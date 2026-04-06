# FindUP — Context for Claude Code

## Projet
Marketplace locale mettant en relation des particuliers avec des artisans qualifiés.
Repo GitHub : ThunderHawk31/FindUP

## Stack
- **Frontend** : React + Vite, déployé sur Vercel. Pas de React Router (navigation par window.location).
- **Backend** : FastAPI (Python), déployé sur Railway. URL prod : https://alert-cat-production.up.railway.app
- **DB** : Supabase + PostGIS (projet : jazxlqjgvldxeppkofnx)
- **IA** : Anthropic API (Claude)
- **Auth** : Supabase Auth (Google OAuth, Apple à venir)

## Design system (respecter impérativement)
- Couleurs : #07101F (fond), #2563EB (primaire), #D4A853 (accent)
- Composants UI custom dans `src/components/ui/` (GlassSurface, etc.)
- Pas de library CSS externe (pas Tailwind, pas Bootstrap)

## Architecture multi-agents (backend)
Le chat IA est composé de 4 agents :
- **Router** (Haiku) : analyse l'intent et route vers le bon agent
- **Chat** (Haiku) : conversation générale, qualification du besoin
- **Search** (Haiku) : recherche d'artisans dans Supabase/PostGIS
- **Guide** (Sonnet) : conseils DIY détaillés

Le backend doit retourner ce format JSON pour chaque réponse :
```json
{
  "message": "texte affiché à l'utilisateur",
  "suggestions": ["chip 1", "chip 2"],
  "needs_location": false,
  "ready_to_search": false
}
```

## Frontend — règles importantes
- `sendMessage` dans Chat.jsx envoie `conversation_history` au backend à chaque appel
- L'historique doit stocker `botText` (pas `JSON.stringify(data)`) comme contenu assistant
- Pas de `<form>` HTML, uniquement des event handlers React
- Images envoyées en base64 via `image_base64` dans le body

## Sécurité — 6 failles ouvertes (audit Antigravity)
Ne pas toucher aux endpoints auth sans avoir lu le rapport complet d'abord.
Les failles concernent principalement : validation des inputs, exposition de données artisan, gestion des tokens.

## Conventions de code
- Python : snake_case, type hints partout, pas de print() en prod (utiliser logging)
- React : functional components, hooks uniquement, pas de class components
- Variables d'env : jamais hardcodées, toujours via `import.meta.env.VITE_*` (frontend) ou `.env` (backend)

## Règles de travail
- Timothé gère le frontend et le design system
- Nolan gère le backend FastAPI et la config Supabase
- Toujours tester en local avant de push (Railway redéploie automatiquement sur push)
- Ne jamais exposer la service_role key Supabase côté frontend

## Ordre de priorité actuel
1. Fix bug historique conversation (Chat.jsx ligne 247 : utiliser `botText` pas `JSON.stringify(data)`)
2. Refonte du backend chat avec architecture multi-agents
3. Sign in with Apple (Supabase Auth)
4. Correction des 6 failles de sécurité (audit Antigravity)
