# FindUP — Context for Claude Code

## Projet
Marketplace locale mettant en relation des particuliers avec des artisans qualifiés.
Repo GitHub : ThunderHawk31/FindUP

## Équipe
- **Timothé** : frontend, design system, composants UI
- **Nolan** : backend FastAPI, config Supabase, infra Railway, Sécurité

## Stack
- **Frontend** : React + Vite, déployé sur Vercel. Pas de React Router (navigation par `window.location`).
- **Backend** : FastAPI (Python), déployé sur Railway. URL prod : https://alert-cat-production.up.railway.app
- **DB** : Supabase + PostGIS (projet : `jazxlqjgvldxeppkofnx`)
- **IA** : Anthropic API (Claude)
- **Auth** : Supabase Auth (Google OAuth, Apple à venir)

## Design system (respecter impérativement)
- Couleurs : `#07101F` (fond), `#2563EB` (primaire), `#D4A853` (accent)
- Composants UI custom dans `src/components/ui/` (GlassSurface, etc.)
- Pas de library CSS externe (pas Tailwind, pas Bootstrap)

## Architecture backend

### Middleware stack (ordre d'exécution)
```
Requête → CORSMiddleware → SecurityHeadersMiddleware → Route handler
```
- `CORSMiddleware` : gère les preflight OPTIONS et les headers CORS
- `SecurityHeadersMiddleware` : middleware ASGI pur (pas BaseHTTPMiddleware) — ajoute CSP, X-Frame-Options, etc. Skip automatiquement les OPTIONS
- **Règle critique** : ne jamais utiliser `BaseHTTPMiddleware` — conflit connu avec `CORSMiddleware` sur les requêtes OPTIONS → 502

### Architecture multi-agents (chat IA)
- **Router** (Haiku) : analyse l'intent et route vers le bon agent
- **Chat** (Haiku) : conversation générale, qualification du besoin
- **Search** (Haiku) : recherche d'artisans dans Supabase/PostGIS
- **Guide** (Sonnet) : conseils DIY détaillés

Format JSON attendu pour chaque réponse backend :
```json
{
  "message": "texte affiché à l'utilisateur",
  "suggestions": ["chip 1", "chip 2"],
  "needs_location": false,
  "ready_to_search": false
}
```

## Variables d'environnement Railway (backend)
| Variable | Exemple | Notes |
|---|---|---|
| `CORS_ORIGINS` | `https://find-up.vercel.app,http://localhost:5173` | Pas d'espace autour des virgules |
| `CSP_ENABLED` | `false` | Mettre à `false` pour débugger les 502 CSP |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | |
| `SUPABASE_URL` | `https://xxx.supabase.co` | |
| `SUPABASE_SERVICE_KEY` | `eyJ...` | Ne jamais exposer côté frontend |
| `PORT` | auto-injecté par Railway | Ne pas hardcoder — le Procfile utilise `${PORT:-8080}` |

## Infra Railway — pièges connus
- **Port mismatch** : Railway injecte `$PORT` dynamiquement. L'app doit l'utiliser via le `Procfile` (`backend/Procfile`). Ne jamais hardcoder le port dans le code Python.
- **Redéploiement auto** : Railway redéploie à chaque push sur `main`. Toujours tester en local avant.
- **Health check** : Railway vérifie `/` par défaut. Si la route n'existe pas → 502. Vérifier dans Settings → Networking.

## Frontend — règles importantes
- `sendMessage` dans `Chat.jsx` envoie `conversation_history` au backend à chaque appel
- L'historique doit stocker `botText` (pas `JSON.stringify(data)`) comme contenu assistant
- Pas de `<form>` HTML, uniquement des event handlers React
- Images envoyées en base64 via `image_base64` dans le body

## Conventions de code
- Python : snake_case, type hints partout, pas de `print()` en prod (utiliser `logging`)
- React : functional components, hooks uniquement, pas de class components
- Variables d'env : jamais hardcodées — `import.meta.env.VITE_*` (frontend) ou `.env` / Railway vars (backend)

## Sécurité — 6 failles ouvertes (audit Antigravity)
Ne pas toucher aux endpoints auth sans avoir lu le rapport complet d'abord.
Failles principales : validation des inputs, exposition de données artisan, gestion des tokens.
Rapport dans `.antigravityrules` à la racine du repo.

## Ordre de priorité actuel
1. Sign in with Apple (Supabase Auth)
2. Correction des 6 failles de sécurité (audit Antigravity)
3. Refonte du backend chat avec architecture multi-agents (Router/Chat/Search/Guide)

## Git Workflow
- ALWAYS pull latest from remote before investigating reported bugs or missing files
- NEVER force-push or rewrite commit history without explicit confirmation
- Avoid creating duplicate or speculative commits; confirm with user before committing

## Debugging Approach
- For deployment errors (Railway, Vercel), check dashboard/platform config (ports, env vars) BEFORE hypothesizing code-level causes like CORS, CSP, or middleware ordering
- Verify regex patterns against actual data samples before implementing parsing logic

## Environment
- Shell is PowerShell on Windows; prefer `cmd /c` wrappers or cross-platform commands when execution policy blocks npm/node scripts
