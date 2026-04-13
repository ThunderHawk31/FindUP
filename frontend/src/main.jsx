import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Login from './Login.jsx'
import Chat from './Chat.jsx'
import Results from './Results.jsx'
import DIY from './DIY.jsx'
import Guide from './Guide.jsx'
import Historique from './Historique.jsx'
import Compte from './Compte.jsx'
import Contact from './Contact.jsx'
import NotFound from './Notfound.jsx'
import EditInfos from './EditInfos.jsx'
import Achats from './Achats.jsx'
import Securite from './Securite.jsx'
import PolitiqueConfidentialite from './PolitiqueConfidentialite.jsx'

const path = window.location.pathname
const root = createRoot(document.getElementById('root'))

if (path === '/login') {
  root.render(<StrictMode><Login /></StrictMode>)
} else if (path === '/chat') {
  root.render(<StrictMode><Chat /></StrictMode>)
} else if (path === '/results') {
  root.render(<StrictMode><Results /></StrictMode>)
} else if (path === '/diy') {
  root.render(<StrictMode><DIY /></StrictMode>)
} else if (path === '/guide') {
  root.render(<StrictMode><Guide /></StrictMode>)
} else if (path === '/historique') {
  root.render(<StrictMode><Historique /></StrictMode>)
} else if (path === '/compte') {
  root.render(<StrictMode><Compte /></StrictMode>)
} else if (path === '/compte/infos') {
  root.render(<StrictMode><EditInfos /></StrictMode>)
} else if (path === '/compte/achats') {
  root.render(<StrictMode><Achats /></StrictMode>)
} else if (path === '/compte/securite') {
  root.render(<StrictMode><Securite /></StrictMode>)
} else if (path === '/contact') {
  root.render(<StrictMode><Contact /></StrictMode>)
} else if (path === '/politique-confidentialite') {
  root.render(<StrictMode><PolitiqueConfidentialite /></StrictMode>)
} else if (path === '/') {
  root.render(<StrictMode><App /></StrictMode>)
} else {
  root.render(<StrictMode><NotFound /></StrictMode>)
}