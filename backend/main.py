"""
FindUP Backend API
Application FastAPI pour la plateforme de mise en relation artisans-clients
"""

import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from supabase import create_client, Client
from anthropic import Anthropic

from models import SearchRequest, ArtisanResponse, AvisCreate, ProfileUpdate
from auth import get_current_user, require_auth
from rate_limiter import RateLimiter

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration Supabase
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")

if not all([SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY]):
    raise ValueError("Variables d'environnement Supabase manquantes")

# Clients Supabase
supabase_service: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
supabase_anon: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# Configuration Anthropic
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
if not ANTHROPIC_API_KEY:
    raise ValueError("ANTHROPIC_API_KEY manquante")

anthropic_client = Anthropic(api_key=ANTHROPIC_API_KEY)

# Rate limiter pour le chat
chat_rate_limiter = RateLimiter(max_requests=10, window_seconds=60)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestionnaire de cycle de vie de l'application"""
    logger.info("Démarrage de l'application FindUP Backend")
    yield
    logger.info("Arrêt de l'application FindUP Backend")

# Initialisation FastAPI
app = FastAPI(
    title="FindUP API",
    description="API pour la plateforme FindUP - Mise en relation artisans-clients",
    version="1.0.0",
    lifespan=lifespan
)

# Configuration CORS sécurisée
cors_origins_env = os.environ.get("CORS_ORIGINS", "http://localhost:5173")
cors_origins = [origin.strip() for origin in cors_origins_env.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Middleware ASGI pur pour les security headers
class SecurityHeadersMiddleware:
    """
    Middleware ASGI pur pour ajouter les security headers sur chaque réponse HTTP.
    Implémente l'interface ASGI directement pour éviter les conflits CORS.
    """
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        async def send_with_headers(message):
            if message["type"] == "http.response.start":
                headers = list(message.get("headers", []))
                
                # Ajout des security headers
                security_headers = [
                    (b"x-content-type-options", b"nosniff"),
                    (b"x-frame-options", b"DENY"),
                    (b"referrer-policy", b"strict-origin-when-cross-origin"),
                    (b"strict-transport-security", b"max-age=31536000; includeSubDomains"),
                ]
                
                headers.extend(security_headers)
                message["headers"] = headers
            
            await send(message)
        
        await self.app(scope, receive, send_with_headers)

# Enregistrement du middleware de sécurité
app.add_middleware(SecurityHeadersMiddleware)

api_router = APIRouter(prefix="/api")

def _build_artisan_response(artisan_data: dict, user_authorized: bool = False) -> dict:
    """
    Construit la réponse artisan avec contrôle d'accès aux données sensibles
    
    Args:
        artisan_data: Données brutes de l'artisan
        user_authorized: Si l'utilisateur est autorisé à voir les données complètes
    """
    try:
        # Données toujours visibles
        response = {
            "id": artisan_data.get("id"),
            "nom": artisan_data.get("nom", ""),
            "description": artisan_data.get("description", ""),
            "ville": artisan_data.get("ville", ""),
            "note_moyenne": artisan_data.get("note_moyenne", 0),
            "nombre_avis": artisan_data.get("nombre_avis", 0),
            "photo_profil": artisan_data.get("photo_profil"),
            "certifie": artisan_data.get("certifie", False),
            "disponible": artisan_data.get("disponible", True)
        }
        
        # Données sensibles (uniquement si autorisé)
        if user_authorized:
            response.update({
                "telephone": artisan_data.get("telephone"),
                "email": artisan_data.get("email"),
                "adresse_complete": artisan_data.get("adresse_complete")
            })
        else:
            # Masquage des données sensibles
            response.update({
                "telephone": "***-***-****",
                "email": "***@***.***",
                "adresse_complete": "Adresse masquée"
            })
        
        return response
        
    except Exception as e:
        logger.error(f"Erreur lors de la construction de la réponse artisan: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne")

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Gestionnaire global d'exceptions"""
    logger.error(f"Erreur non gérée: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Erreur interne du serveur"}
    )

@app.get("/")
async def root():
    """Point d'entrée de l'API"""
    return {"message": "FindUP API - Service de mise en relation artisans-clients"}

@app.get("/health")
async def health_check():
    """Vérification de l'état de santé de l'API"""
    try:
        # Test de connexion Supabase
        supabase_service.table("artisans").select("artisan_id").limit(1).execute()
        return {"status": "ok", "supabase": "connected", "auth": "anon_rls_not_tested"}
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "database": "disconnected"}
        )

@api_router.post("/search", response_model=list[ArtisanResponse])
async def search_artisans(request: SearchRequest, current_user=Depends(get_current_user)):
    """
    Recherche d'artisans avec filtres
    Nécessite une authentification
    """
    try:
        logger.info(f"Recherche d'artisans: {request.metier} à {request.ville}")
        
        # Construction de la requête
        query = supabase_anon.table("artisans").select("*")
        
        # Filtres obligatoires
        if request.metier:
            query = query.ilike("metier", f"%{request.metier}%")
        if request.ville:
            query = query.ilike("ville", f"%{request.ville}%")
        
        # Filtres optionnels
        if request.note_min:
            query = query.gte("note_moyenne", request.note_min)
        if request.certifie_seulement:
            query = query.eq("certifie", True)
        if request.disponible_seulement:
            query = query.eq("disponible", True)
        
        # Exécution de la requête
        response = query.limit(50).execute()
        artisans = response.data
        
        # Construction des réponses avec contrôle d'accès
        user_authorized = current_user is not None
        results = []
        
        for artisan in artisans:
            artisan_response = _build_artisan_response(artisan, user_authorized)
            results.append(artisan_response)
        
        logger.info(f"Trouvé {len(results)} artisans")
        return results
        
    except Exception as e:
        logger.error(f"Erreur lors de la recherche: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la recherche")

@api_router.get("/artisan/{artisan_id}")
async def get_artisan_details(artisan_id: int, current_user=Depends(get_current_user)):
    """
    Récupération des détails d'un artisan
    Nécessite une authentification pour les données complètes
    """
    try:
        response = supabase_anon.table("artisans").select("*").eq("id", artisan_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Artisan non trouvé")
        
        artisan = response.data[0]
        user_authorized = current_user is not None
        
        return _build_artisan_response(artisan, user_authorized)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la récupération de l'artisan {artisan_id}: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la récupération")

@api_router.get("/artisan/{artisan_id}/avis")
async def get_artisan_avis(artisan_id: int):
    """Récupération des avis d'un artisan (accès public)"""
    try:
        response = supabase_anon.table("avis").select("*").eq("artisan_id", artisan_id).order("created_at", desc=True).execute()
        return response.data
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des avis: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la récupération des avis")

@api_router.post("/artisan/{artisan_id}/avis")
async def create_avis(artisan_id: int, avis: AvisCreate, current_user=Depends(require_auth)):
    """
    Création d'un avis pour un artisan
    Nécessite une authentification obligatoire
    """
    try:
        # Vérification que l'artisan existe
        artisan_response = supabase_anon.table("artisans").select("id").eq("id", artisan_id).execute()
        if not artisan_response.data:
            raise HTTPException(status_code=404, detail="Artisan non trouvé")
        
        # Vérification qu'un avis n'existe pas déjà pour cet utilisateur
        existing_avis = supabase_anon.table("avis").select("id").eq("artisan_id", artisan_id).eq("user_id", current_user["id"]).execute()
        if existing_avis.data:
            raise HTTPException(status_code=400, detail="Vous avez déjà donné un avis pour cet artisan")
        
        # Création de l'avis
        avis_data = {
            "artisan_id": artisan_id,
            "user_id": current_user["id"],
            "note": avis.note,
            "commentaire": avis.commentaire,
            "nom_client": current_user.get("user_metadata", {}).get("full_name", "Client anonyme")
        }
        
        response = supabase_service.table("avis").insert(avis_data).execute()
        
        # Mise à jour de la note moyenne de l'artisan
        await _update_artisan_rating(artisan_id)
        
        return response.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la création de l'avis: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la création de l'avis")

async def _update_artisan_rating(artisan_id: int):
    """Met à jour la note moyenne et le nombre d'avis d'un artisan"""
    try:
        # Calcul de la nouvelle moyenne
        response = supabase_anon.table("avis").select("note").eq("artisan_id", artisan_id).execute()
        avis_list = response.data
        
        if avis_list:
            notes = [avis["note"] for avis in avis_list]
            note_moyenne = sum(notes) / len(notes)
            nombre_avis = len(notes)
            
            # Mise à jour de l'artisan
            supabase_service.table("artisans").update({
                "note_moyenne": round(note_moyenne, 1),
                "nombre_avis": nombre_avis
            }).eq("id", artisan_id).execute()
            
    except Exception as e:
        logger.error(f"Erreur lors de la mise à jour de la note: {e}")

@api_router.get("/profile")
async def get_profile(current_user=Depends(require_auth)):
    """Récupération du profil utilisateur"""
    try:
        return {
            "id": current_user["id"],
            "email": current_user["email"],
            "nom": current_user.get("user_metadata", {}).get("full_name", ""),
            "created_at": current_user["created_at"]
        }
    except Exception as e:
        logger.error(f"Erreur lors de la récupération du profil: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la récupération du profil")

@api_router.put("/profile")
async def update_profile(profile_data: ProfileUpdate, current_user=Depends(require_auth)):
    """Mise à jour du profil utilisateur"""
    try:
        # Mise à jour des métadonnées utilisateur
        update_data = {}
        if profile_data.nom:
            update_data["full_name"] = profile_data.nom
        
        if update_data:
            supabase_service.auth.admin.update_user_by_id(
                current_user["id"],
                {"user_metadata": update_data}
            )
        
        return {"message": "Profil mis à jour avec succès"}
        
    except Exception as e:
        logger.error(f"Erreur lors de la mise à jour du profil: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la mise à jour du profil")

@api_router.post("/chat/send")
async def chat_with_ai(request: Request, current_user=Depends(require_auth)):
    """
    Chat avec l'IA pour des conseils sur les travaux
    Avec rate limiting pour éviter les abus
    """
    try:
        # Vérification du rate limiting
        client_ip = request.client.host
        user_id = current_user["id"]
        rate_limit_key = f"{user_id}:{client_ip}"
        
        if not chat_rate_limiter.is_allowed(rate_limit_key):
            raise HTTPException(
                status_code=429, 
                detail="Trop de requêtes. Veuillez patienter avant de poser une nouvelle question."
            )
        
        # Récupération du message
        body = await request.json()
        user_message = body.get("message", "").strip()
        
        if not user_message:
            raise HTTPException(status_code=400, detail="Message requis")
        
        if len(user_message) > 500:
            raise HTTPException(status_code=400, detail="Message trop long (max 500 caractères)")
        
        # Appel à l'API Anthropic
        system_prompt = """Tu es un assistant spécialisé dans les travaux et l'artisanat. 
        Tu aides les utilisateurs à comprendre leurs besoins en travaux et à choisir les bons artisans.
        Réponds de manière concise et pratique. Si la question n'est pas liée aux travaux, 
        redirige poliment vers le sujet des travaux et de l'artisanat."""
        
        response = anthropic_client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=300,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}]
        )
        
        ai_response = response.content[0].text
        
        return {"response": ai_response}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors du chat avec l'IA: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la communication avec l'IA")

app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
