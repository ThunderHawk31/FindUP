# findUp

Application web de mise en relation avec des artisans qualifiés, propulsée par l'IA.

## Stack technique

- React 19 + Vite
- CSS natif (pas de Tailwind)
- Leaflet (carte interactive OpenStreetMap)
- Liquid Glass UI (composant GlassSurface custom)

## Lancer le projet en local

1. Cloner le repo
git clone https://github.com/rennessontimothe/findup-frontend.git
cd findup-frontend

2. Installer les dépendances
npm install

3. Démarrer le serveur de développement
npm run dev

L'app tourne sur http://localhost:5173

## Pages disponibles

| Route | Description |
|-------|-------------|
| `/` | Page d'accueil avec recherche IA |
| `/chat` | Chat avec l'assistant findUp |
| `/results` | Carte + liste des artisans |
| `/login` | Connexion / Inscription |
| `/diy` | Lien objet + Guide |

## Structure du projet

src/
├── App.jsx / App.css → Page d'accueil
├── Chat.jsx / Chat.css → Interface chat
├── Results.jsx / Results.css → Carte et résultats
├── Login.jsx / Login.css → Authentification
├── ProfilePanel.jsx → Panneau profil
├── DIY.jsx / DIY.css → Guide et Achat
└── components/ui/GlassSurface.jsx → Composant liquid glass

## Variables CSS principales

--cream: #F5F4F0
--navy: #07101F
--blue: #2563EB
--gold: #D4A853
```
