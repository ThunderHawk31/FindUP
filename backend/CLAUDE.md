# FindUP — Contexte projet

## Résumé
Marketplace locale artisans/particuliers. API FastAPI + Supabase + Railway.
Développeur back-end : Nolan. Développeur front-end : Timothé.

## Stack technique
- **Backend** : FastAPI, Python 3.12, Supabase (auth + DB), Railway (déploiement)
- **Frontend** : React (géré par Timothé — ne pas modifier)
- **LLMs** : Anthropic Claude (Haiku + Sonnet) pour le chat IA interne
- **Auth** : Supabase Auth (JWT Bearer + cookie session_token)

## Structure fichiers
```
FindUP/
├── backend/
│   ├── server.py          ← FICHIER UNIQUE — tout le backend est ici (998 lignes)
│   ├── requirements.txt
│   ├── Procfile           ← Railway : "web: uvicorn server:app --host 0.0.0.0 --port $PORT"
│   ├── .env               ← variables d'env (ne jamais commiter)
│   └── tests/
│       ├── conftest.py    ← mocks Supabase + Anthropic + TestClient
│       └── test_*.py      ← tests générés par le Tester
├── frontend/              ← React (Timothé — ne pas toucher)
├── schema.sql             ← schéma Supabase complet
└── design_guidelines.json ← design system FindUP
```

## Architecture backend (server.py)
**Un seul fichier. Tout est dedans.**

### Initialisation
```python
app = FastAPI(title="FindUP API")
api_router = APIRouter(prefix="/api")
# Clients Supabase initialisés dans startup()
supabase: Client = None        # service_role (admin)
supabase_anon: Client = None   # anon key (RLS)
```

### Routes existantes (préfixe /api)
- `POST /api/auth/register` — inscription
- `POST /api/auth/login` — connexion (cookie session_token)
- `GET  /api/auth/me` — profil courant
- `POST /api/auth/logout`
- `DELETE /api/auth/account`
- `POST /api/chat/send` — IA conversationnelle (Router → Chat/Guide/Search agents)
- `POST /api/chat/reset`
- `GET  /api/artisans` — liste paginée
- `POST /api/artisans/search` — RPC search_artisans_nearby
- `GET  /api/artisans/{id}`
- `GET  /api/artisans/{id}/avis`
- `POST /api/artisans/{id}/avis`
- `GET  /api/profile`
- `PUT  /api/profile`
- `GET  /api/historique-guides`
- `POST /api/historique-guides`
- `GET  /api/transactions`
- `POST /api/transactions`

### Modèles Pydantic principaux
- `UserCreate`, `UserLogin`
- `ArtisanBase`, `ArtisanResponse`
- `AvisCreate`, `AvisResponse`
- `ChatMessage`, `ChatHistoryMessage` (role ∈ {user, assistant} strict)
- `SearchRequest`
- `ProfileUpdate`

### Auth helpers
```python
async def get_current_user(request) -> Optional[dict]  # None si non auth
async def require_auth(request) -> dict                 # 401 si non auth
```

## Variables d'environnement (.env)
```
SUPABASE_URL=
SUPABASE_SERVICE_KEY=    # service_role (admin)
SUPABASE_ANON_KEY=       # anon (RLS)
ANTHROPIC_API_KEY=
```

## Conventions absolues
- **JAMAIS `BaseHTTPMiddleware`** — conflit CORS connu sur Railway
- CORS : `CORSMiddleware` de Starlette uniquement (déjà configuré)
- Pas de secrets hardcodés — tout via `os.environ.get()`
- `supabase` pour les opérations admin, `supabase_anon` pour les opérations user
- Nouveaux endpoints dans `api_router` (pas directement sur `app`)
- Toujours `app.include_router(api_router)` en fin de fichier
- Rate limiter déjà configuré sur `/api/chat/send` (10 req/min/IP)

## Failles Antigravity (6 failles identifiées — audit réel)
1. `BaseHTTPMiddleware` absent ✅ (déjà corrigé)
2. Secrets non hardcodés ✅ (via os.environ)
3. Inputs validés avec Pydantic ✅
4. CORS configuré ✅
5. Rate limiting sur le chat ✅
6. Auth stricte sur les routes sensibles — **vérifier systématiquement**

## Ajouter un nouvel endpoint (pattern)
```python
@api_router.get("/ma-route")
async def ma_route(request: Request):
    user = await require_auth(request)  # si auth requise
    try:
        r = supabase.table('ma_table').select('*').execute()
        return r.data or []
    except Exception as e:
        logger.error(f"ma_route error: {e}")
        raise HTTPException(status_code=500, detail="Erreur serveur")
```

## Supabase — tables principales
- `artisans` — PK: `artisan_id`
- `artisan_tags` — colonnes: `artisan_id`, `tag_nom`, `metier`
- `avis` — PK: `avis_id`, colonnes: `artisan_id`, `note`, `commentaire`, `auteur`, `user_id`
- `profiles` — PK: `id` (= user_id Supabase), colonnes: `name`, `prenom`, `nom`, `picture`
- `chat_sessions` — PK: `session_id`, colonnes: `messages` (JSON), `updated_at`
- `transactions` — PK: `id`
- `historique_guides` — colonnes: `user_id`, `theme`, `titre`, `description`
- RPC: `search_artisans_nearby(search_lat, search_lon, search_rayon_km, search_metiers, search_tags, search_urgence)`

## Déploiement Railway
- Push sur GitHub → Railway détecte et déploie automatiquement
- Procfile : `web: uvicorn server:app --host 0.0.0.0 --port $PORT`
- Variables d'env configurées dans Railway dashboard
- URL prod : https://alert-cat-production.up.railway.app
