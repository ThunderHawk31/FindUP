from fastapi import FastAPI, APIRouter, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from supabase import create_client, Client
import os
import logging
import uuid
import math
import re
import json
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timezone
import anthropic as anthropic_module

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Supabase sync client
supabase: Client = None

# Anthropic
ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY')
anthropic_client = anthropic_module.Anthropic(api_key=ANTHROPIC_API_KEY)

app = FastAPI(title="FindUP API", description="Plateforme pour trouver des artisans locaux")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ==================== STARTUP ====================

@app.on_event("startup")
async def startup():
    global supabase
    supabase = create_client(
        os.environ.get('SUPABASE_URL'),
        os.environ.get('SUPABASE_SERVICE_KEY')
    )
    logger.info("Supabase client initialized")
    try:
        r = supabase.table('artisans').select('*').limit(1).execute()
        logger.info(f"Supabase connected OK — artisans sample: {len(r.data or [])} row(s)")
    except Exception as e:
        logger.error(f"Supabase connection test failed: {e}")


# ==================== PYDANTIC MODELS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ArtisanBase(BaseModel):
    nom: str
    entreprise: str
    telephone: str
    email: Optional[str] = None
    latitude: float
    longitude: float
    rayon_km: int = 15
    photo_url: Optional[str] = None
    description: Optional[str] = None
    horaires: Optional[str] = None
    urgent_disponible: bool = False
    abonnement_type: str = "gratuit"

class ArtisanResponse(ArtisanBase):
    artisan_id: str
    tags: List[str] = []
    metiers: List[str] = []
    note_moyenne: float = 0.0
    nombre_avis: int = 0
    distance_km: Optional[float] = None
    is_verified: bool = False

class AvisCreate(BaseModel):
    artisan_id: str
    note: int = Field(ge=1, le=5)
    commentaire: str
    auteur: str

class AvisResponse(BaseModel):
    avis_id: str
    artisan_id: str
    note: int
    commentaire: str
    auteur: str
    date: str

class ChatMessage(BaseModel):
    message: str = Field(max_length=2000)
    image_base64: Optional[str] = Field(None, max_length=5_000_000)
    conversation_history: Optional[List[dict]] = Field(None, max_length=50)
    location: Optional[dict] = None

class FavoriCreate(BaseModel):
    artisan_id: str

class HistoriqueCreate(BaseModel):
    artisan_id: str
    action: str  # "vu" ou "appele"

class SearchRequest(BaseModel):
    metiers: List[str]
    tags: List[str]
    latitude: float
    longitude: float
    rayon_km: int = 15
    urgence: bool = False


# ==================== AUTH HELPERS ====================

async def get_current_user(request: Request) -> Optional[dict]:
    token = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
    if not token:
        token = request.cookies.get("session_token")
    if not token:
        return None
    try:
        user_resp = supabase.auth.get_user(token)
        if not (user_resp and user_resp.user):
            return None
        u = user_resp.user
        name = ""
        picture = None
        try:
            p = supabase.table("profiles").select("name,picture").eq("id", str(u.id)).maybe_single().execute()
            if p.data:
                name = p.data.get("name") or ""
                picture = p.data.get("picture")
        except Exception:
            pass
        if not name:
            meta = u.user_metadata or {}
            name = meta.get("name") or meta.get("full_name") or u.email.split("@")[0]
        return {"user_id": str(u.id), "email": u.email, "name": name, "picture": picture}
    except Exception as e:
        logger.debug(f"Auth check failed: {e}")
    return None


async def require_auth(request: Request) -> dict:
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Non authentifié")
    return user


# ==================== AI CHAT ====================

SYSTEM_PROMPT = """Tu es l'assistant FindUP, un expert en travaux du bâtiment français. Tu es chaleureux, rassurant et naturel — comme un ami qui s'y connaît vraiment.

## TON RÔLE
Tu aides les particuliers à trouver le bon artisan. Tu comprends leur problème, tu identifies le métier nécessaire, et tu poses les bonnes questions pour affiner la recherche.

## RÈGLES DE CONVERSATION
1. Sois naturel et concis : 1-3 phrases max.
2. Pose maximum 3-4 questions au total. Ne repose JAMAIS une question dont tu as déjà la réponse.
3. Si le problème est évident, passe directement à la localisation.
4. Relis TOUJOURS l'historique avant de répondre.

## INFORMATIONS À COLLECTER
- Le problème (souvent donné dès le premier message)
- La localisation (ville ou géolocalisation)
- L'urgence (pressé ou projet futur)

## FORMAT DE RÉPONSE (JSON STRICT)
Réponds TOUJOURS avec ce JSON exact, sans texte avant/après, sans backticks :

{"message":"Ta réponse ici","suggestions":["Option 1","Option 2"],"collected":{"problem_understood":false,"location_known":false,"urgency_known":false},"diagnosis":null,"needs_location":false,"ready_to_search":false}

Quand tu as identifié le métier, diagnosis devient :
{"metiers":["Plombier"],"tags":["FuiteEau"],"urgence":false}

ready_to_search = true UNIQUEMENT quand problème + localisation + urgence sont connus.
suggestions = 2 réponses courtes contextuelles (max 25 caractères chacune).
needs_location = true quand tu as besoin de la localisation.

## MÉTIERS & TAGS DISPONIBLES
Plombier: FuiteEau, ChauffeEau, Canalisation, Robinetterie, WC, SalleDeBain
Électricien: InstallationÉlectrique, Dépannage, MiseAuxNormes, Éclairage, Tableau
Menuisier: RénovationFenêtres, Huisserie, PortesIntérieures, Parquet, Escalier
Peintre: PeintureIntérieure, PeintureExtérieure, Tapisserie, Ravalement, Façade
Maçon: GrosOeuvre, Rénovation, Murs, Fondations, Extension, Démolition
Chauffagiste: Chaudière, Radiateur, PompeAChaleur, PlancherChauffant
Carreleur: Carrelage, Faïence, SalleDeBain, Mosaïque
Couvreur: Toiture, Étanchéité, Gouttières, Charpente
Serrurier: Serrure, Blindage, Ouverture, DépannageUrgent
Vitrier: Vitrage, DoubleVitrage, Miroir, Remplacement"""


async def chat_with_ai(session_id: str, message: str, image_base64: Optional[str] = None, chat_history: List[dict] = None) -> dict:
    try:
        messages = []
        if chat_history:
            for msg in chat_history:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                if role in ["user", "assistant"] and content:
                    messages.append({"role": role, "content": content})

        content_parts = []
        if image_base64:
            content_parts.append({
                "type": "image",
                "source": {"type": "base64", "media_type": "image/jpeg", "data": image_base64}
            })
        if message:
            content_parts.append({"type": "text", "text": message})
        messages.append({"role": "user", "content": content_parts if image_base64 else message})

        response = anthropic_client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=messages
        )
        return {"success": True, "response": response.content[0].text}
    except Exception as e:
        logger.error(f"AI Chat error: {e}")
        return {"success": False, "error": str(e)}


def parse_structured_response(raw: str) -> dict:
    try:
        return json.loads(raw.strip())
    except json.JSONDecodeError:
        pass
    m = re.search(r'```json\s*(.*?)\s*```', raw, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(1))
        except Exception:
            pass
    m = re.search(r'\{[^{}]*"message"[^{}]*\}', raw, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(0))
        except Exception:
            pass
    return {
        "message": raw, "suggestions": [],
        "collected": {"problem_understood": False, "location_known": False, "urgency_known": False},
        "diagnosis": None, "needs_location": False, "ready_to_search": False
    }


# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
async def register(user: UserCreate, response: Response):
    try:
        result = supabase.auth.sign_up({
            "email": user.email,
            "password": user.password,
            "options": {"data": {"name": user.name}}
        })
        if not result.user:
            raise HTTPException(status_code=400, detail="Erreur lors de l'inscription")
        token = result.session.access_token if result.session else None
        if token:
            response.set_cookie(
                key="session_token", value=token,
                httponly=True, secure=True, samesite="lax", path="/", max_age=7 * 24 * 60 * 60
            )
        return {
            "token": token,
            "user": {"user_id": str(result.user.id), "email": result.user.email, "name": user.name}
        }
    except HTTPException:
        raise
    except Exception as e:
        msg = str(e)
        if "already" in msg.lower():
            raise HTTPException(status_code=400, detail="Email déjà utilisé")
        raise HTTPException(status_code=400, detail=msg)


@api_router.post("/auth/login")
async def login(user: UserLogin, response: Response):
    try:
        result = supabase.auth.sign_in_with_password({
            "email": user.email,
            "password": user.password
        })
        if not result.user or not result.session:
            raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
        token = result.session.access_token
        response.set_cookie(
            key="session_token", value=token,
            httponly=True, secure=True, samesite="lax", path="/", max_age=7 * 24 * 60 * 60
        )
        meta = result.user.user_metadata or {}
        return {
            "token": token,
            "user": {
                "user_id": str(result.user.id),
                "email": result.user.email,
                "name": meta.get("name") or meta.get("full_name") or user.email.split("@")[0],
                "picture": meta.get("picture") or meta.get("avatar_url")
            }
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")


@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Non authentifié")
    return user


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Déconnecté avec succès"}


# ==================== CHAT ROUTES ====================

@api_router.post("/chat/send")
async def send_chat_message(request: Request, chat_message: ChatMessage):
    session_id = request.cookies.get("chat_session") or str(uuid.uuid4())

    if chat_message.conversation_history is not None:
        chat_history = chat_message.conversation_history
    else:
        try:
            r = supabase.table('chat_sessions').select('messages').eq('session_id', session_id).maybe_single().execute()
            chat_history = r.data['messages'] if r.data else []
        except Exception:
            chat_history = []

    ai_result = await chat_with_ai(
        session_id=session_id,
        message=chat_message.message,
        image_base64=chat_message.image_base64,
        chat_history=chat_history
    )

    if not ai_result.get("success"):
        raise HTTPException(status_code=500, detail=ai_result.get("error", "Erreur IA"))

    parsed = parse_structured_response(ai_result["response"])
    diagnosis = parsed.get("diagnosis") or {}

    now = datetime.now(timezone.utc).isoformat()
    new_msgs = [
        {"role": "user", "content": chat_message.message, "timestamp": now},
        {"role": "assistant", "content": ai_result["response"], "timestamp": now}
    ]
    try:
        r = supabase.table('chat_sessions').select('messages').eq('session_id', session_id).maybe_single().execute()
        current = r.data['messages'] if r.data else []
        supabase.table('chat_sessions').upsert(
            {'session_id': session_id, 'messages': current + new_msgs, 'updated_at': now},
            on_conflict='session_id'
        ).execute()
    except Exception as e:
        logger.error(f"Chat session save error: {e}")

    resp = JSONResponse(content={
        "message": parsed.get("message", ""),
        "suggestions": parsed.get("suggestions", []),
        "collected": parsed.get("collected", {}),
        "diagnosis": parsed.get("diagnosis"),
        "needs_location": parsed.get("needs_location", False),
        "ready_to_search": parsed.get("ready_to_search", False),
        "metiers": diagnosis.get("metiers") if diagnosis else None,
        "tags": diagnosis.get("tags") if diagnosis else None,
        "urgence": diagnosis.get("urgence") if diagnosis else None,
        "response": parsed.get("message", ""),
    })
    resp.set_cookie(key="chat_session", value=session_id, max_age=3600, httponly=True, secure=True, samesite="lax")
    return resp


@api_router.post("/chat/reset")
async def reset_chat(request: Request, response: Response):
    session_id = request.cookies.get("chat_session")
    if session_id:
        try:
            supabase.table('chat_sessions').delete().eq('session_id', session_id).execute()
        except Exception:
            pass
    response.delete_cookie(key="chat_session")
    return {"message": "Chat réinitialisé"}


# ==================== ARTISAN HELPERS ====================

def _build_artisan_response(
    a: dict,
    distance_km: Optional[float] = None,
    tags_list: Optional[List[str]] = None,
    metiers_list: Optional[List[str]] = None,
    note_moyenne: Optional[float] = None,
    nombre_avis: Optional[int] = None
) -> ArtisanResponse:
    # Support both 'artisan_id' (RPC / doc schema) and 'id' (actual PK if different)
    artisan_id = a.get('artisan_id') or a.get('id', '')

    if tags_list is None:
        try:
            r = supabase.table('artisan_tags').select('tag_nom,metier').eq('artisan_id', artisan_id).execute()
            d = r.data or []
            tags_list = [t['tag_nom'] for t in d]
            metiers_list = list(set(t['metier'] for t in d))
        except Exception:
            tags_list, metiers_list = [], []

    if note_moyenne is None:
        try:
            r = supabase.table('avis').select('note').eq('artisan_id', artisan_id).execute()
            d = r.data or []
            note_moyenne = sum(x['note'] for x in d) / len(d) if d else 0.0
            nombre_avis = len(d)
        except Exception:
            note_moyenne, nombre_avis = 0.0, 0

    return ArtisanResponse(
        artisan_id=artisan_id,
        nom=a.get('nom', ''),
        entreprise=a.get('entreprise', ''),
        telephone=a.get('telephone', ''),
        email=a.get('email'),
        latitude=float(a.get('latitude', 0)),
        longitude=float(a.get('longitude', 0)),
        rayon_km=int(a.get('rayon_km', 15)),
        photo_url=a.get('photo_url'),
        description=a.get('description'),
        horaires=a.get('horaires'),
        urgent_disponible=bool(a.get('urgent_disponible', False)),
        abonnement_type=a.get('abonnement_type', 'gratuit'),
        tags=tags_list or [],
        metiers=metiers_list or [],
        note_moyenne=round(float(note_moyenne or 0), 1),
        nombre_avis=int(nombre_avis or 0),
        distance_km=distance_km,
        is_verified=bool(a.get('is_verified', False))
    )


# ==================== ARTISAN ROUTES ====================

@api_router.get("/artisans", response_model=List[ArtisanResponse])
async def get_artisans(page: int = 1, limit: int = 20):
    offset = (page - 1) * limit
    r = supabase.table('artisans').select('*').range(offset, offset + limit - 1).execute()
    return [_build_artisan_response(a) for a in (r.data or [])]


@api_router.post("/artisans/search", response_model=List[ArtisanResponse])
async def search_artisans(search: SearchRequest):
    try:
        r = supabase.rpc("search_artisans_nearby", {
            "search_lat": search.latitude,
            "search_lon": search.longitude,
            "search_rayon_km": search.rayon_km,
            "search_metiers": search.metiers if search.metiers else None,
            "search_tags": search.tags if search.tags else None,
            "search_urgence": search.urgence
        }).execute()
        artisans = r.data or []
        return [
            _build_artisan_response(
                a,
                distance_km=a.get('distance_km'),
                tags_list=a.get('tags_list') or [],
                metiers_list=a.get('metiers_list') or [],
                note_moyenne=a.get('note_moyenne', 0.0),
                nombre_avis=a.get('nombre_avis', 0)
            )
            for a in artisans
        ]
    except Exception as e:
        logger.error(f"Search RPC error: {e}")
        return []


@api_router.get("/artisans/{artisan_id}", response_model=ArtisanResponse)
async def get_artisan(artisan_id: str):
    # Try artisan_id column first (per official schema), fallback to id
    r = supabase.table('artisans').select('*').eq('artisan_id', artisan_id).maybe_single().execute()
    if not r.data:
        r = supabase.table('artisans').select('*').eq('id', artisan_id).maybe_single().execute()
    if not r.data:
        raise HTTPException(status_code=404, detail="Artisan non trouvé")
    return _build_artisan_response(r.data)


@api_router.get("/artisans/{artisan_id}/avis", response_model=List[AvisResponse])
async def get_artisan_avis(artisan_id: str):
    r = supabase.table('avis').select('*').eq('artisan_id', artisan_id).order('created_at', desc=True).execute()
    return [
        AvisResponse(
            avis_id=str(av.get('avis_id') or av.get('id', '')),
            artisan_id=av['artisan_id'],
            note=av['note'],
            commentaire=av['commentaire'],
            auteur=av['auteur'],
            date=av.get('created_at') or av.get('date', '')
        )
        for av in (r.data or [])
    ]


@api_router.post("/artisans/{artisan_id}/avis")
async def create_avis(artisan_id: str, avis: AvisCreate, request: Request):
    user = await require_auth(request)
    doc = {
        "avis_id": f"avis_{uuid.uuid4().hex[:12]}",
        "artisan_id": artisan_id,
        "note": avis.note,
        "commentaire": avis.commentaire,
        "auteur": user["name"],
        "user_id": user["user_id"],
    }
    result = supabase.table('avis').insert(doc).execute()
    inserted = result.data[0] if result.data else {}
    return AvisResponse(
        avis_id=str(inserted.get('avis_id') or inserted.get('id') or str(uuid.uuid4())),
        artisan_id=artisan_id,
        note=avis.note,
        commentaire=avis.commentaire,
        auteur=doc["auteur"],
        date=inserted.get('created_at') or datetime.now(timezone.utc).isoformat()
    )


# ==================== FAVORIS ROUTES ====================

@api_router.get("/favoris", response_model=List[ArtisanResponse])
async def get_favoris(request: Request):
    user = await require_auth(request)
    r = supabase.table('favoris').select('artisan_id').eq('user_id', user['user_id']).execute()
    ids = [f['artisan_id'] for f in (r.data or [])]
    if not ids:
        return []
    # Try artisan_id column, fallback to id
    ar = supabase.table('artisans').select('*').in_('artisan_id', ids).execute()
    if not ar.data:
        ar = supabase.table('artisans').select('*').in_('id', ids).execute()
    return [_build_artisan_response(a) for a in (ar.data or [])]


@api_router.post("/favoris")
async def add_favori(favori: FavoriCreate, request: Request):
    user = await require_auth(request)
    # Check already exists
    r = supabase.table('favoris').select('favori_id').eq('user_id', user['user_id']).eq('artisan_id', favori.artisan_id).maybe_single().execute()
    if r.data:
        return {"message": "Déjà en favoris"}
    supabase.table('favoris').insert({
        "favori_id": f"fav_{uuid.uuid4().hex[:12]}",
        "user_id": user['user_id'],
        "artisan_id": favori.artisan_id
    }).execute()
    return {"message": "Ajouté aux favoris"}


@api_router.delete("/favoris/{artisan_id}")
async def remove_favori(artisan_id: str, request: Request):
    user = await require_auth(request)
    supabase.table('favoris').delete().eq('user_id', user['user_id']).eq('artisan_id', artisan_id).execute()
    return {"message": "Retiré des favoris"}


# ==================== HISTORIQUE ROUTES ====================

@api_router.get("/historique")
async def get_historique(request: Request):
    user = await require_auth(request)
    r = supabase.table('historique').select('*').eq('user_id', user['user_id']).order('created_at', desc=True).limit(50).execute()
    result = []
    for h in (r.data or []):
        try:
            ar = supabase.table('artisans').select('*').eq('artisan_id', h['artisan_id']).maybe_single().execute()
            if not ar.data:
                ar = supabase.table('artisans').select('*').eq('id', h['artisan_id']).maybe_single().execute()
            if ar.data:
                result.append({
                    "artisan": ar.data,
                    "action": h["action"],
                    "date": h.get("created_at") or h.get("date", "")
                })
        except Exception:
            pass
    return result


@api_router.post("/historique")
async def add_historique(historique: HistoriqueCreate, request: Request):
    user = await get_current_user(request)
    if not user:
        return {"message": "Non connecté, historique non enregistré"}
    supabase.table('historique').insert({
        "historique_id": f"hist_{uuid.uuid4().hex[:12]}",
        "user_id": user['user_id'],
        "artisan_id": historique.artisan_id,
        "action": historique.action
    }).execute()
    return {"message": "Historique enregistré"}


# ==================== SEO ROUTE ====================

@api_router.get("/seo/{metier}-{ville}")
async def get_seo_page(metier: str, ville: str):
    metier_map = {
        "plombier": "Plombier", "electricien": "Électricien", "menuisier": "Menuisier",
        "peintre": "Peintre", "macon": "Maçon", "chauffagiste": "Chauffagiste",
        "carreleur": "Carreleur", "couvreur": "Couvreur", "serrurier": "Serrurier", "vitrier": "Vitrier"
    }
    metier_name = metier_map.get(metier.lower(), metier.capitalize())
    ville_name = ville.replace("-", " ").title()

    r = supabase.table('artisan_tags').select('artisan_id').eq('metier', metier_name).execute()
    ids = list(set(row['artisan_id'] for row in (r.data or [])))
    artisans = []
    if ids:
        ar = supabase.table('artisans').select('*').in_('artisan_id', ids).execute()
        artisans = ar.data or []

    return {
        "metier": metier_name,
        "ville": ville_name,
        "title": f"{metier_name} à {ville_name} - Trouvez le meilleur artisan | FindUP",
        "description": f"Trouvez les meilleurs {metier_name.lower()}s à {ville_name}.",
        "artisans_count": len(artisans),
        "artisans": artisans[:5]
    }


# ==================== ROOT ====================

@api_router.get("/")
async def root():
    return {"message": "FindUP API — Trouvez le bon artisan près de chez vous"}


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response


app.include_router(api_router)

app.add_middleware(SecurityHeadersMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(','),
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
