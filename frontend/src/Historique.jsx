import { useState } from 'react'
import GlassSurface from './components/ui/GlassSurface'
import ProfilePanel from './ProfilePanel'
import useAuth from './hooks/useAuth'
import './Historique.css'

const GUIDES = [
  {
    id: 1,
    title: 'Réparer une fuite sous évier',
    date: '24 mars 2026',
    category: 'Plomberie',
    color: '#1d4ed8',
    summary: 'Guide complet pour identifier et réparer une fuite au niveau du siphon ou des raccords sous un évier de cuisine.',
  },
  {
    id: 2,
    title: 'Changer une prise électrique',
    date: '18 mars 2026',
    category: 'Électricité',
    color: '#1B3A6B',
    summary: 'Étapes détaillées pour remplacer une prise de courant défectueuse en toute sécurité.',
  },
  {
    id: 3,
    title: 'Poser du carrelage mural',
    date: '12 mars 2026',
    category: 'Carrelage',
    color: '#a07830',
    summary: 'Techniques de pose de carrelage mural pour salle de bain, incluant la préparation du support et le jointoiement.',
  },
]

export default function Historique() {
  const { user, logout } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <>
      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <ProfilePanel isOpen={profileOpen} onClose={() => setProfileOpen(false)} user={user} onLogout={logout} />

      <div className="hist-page-layout">
        <nav>
          <GlassSurface width="100%" height={70} borderRadius={100} backgroundOpacity={0.21} blur={14} brightness={55} distortionScale={-60} className="nav-glass">
            <div className="nav-inner">
              <a href="/" className="nav-back" onClick={e => { e.preventDefault(); window.history.back() }} title="Retour">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="15" height="15">
                  <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <div className="nav-actions">
                {!user && <a href="/login" className="btn-ghost">Se connecter</a>}
                <button className="avatar-btn" onClick={() => setProfileOpen(true)}>
                  {user ? (
                    <span className="avatar-initials">{user.initials}</span>
                  ) : (
                    <svg viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" /></svg>
                  )}
                </button>
              </div>
            </div>
          </GlassSurface>
        </nav>

        <main className="hist-main">
          <section className="hist-hero">
            <h1 className="hist-title">
              <span className="split-line">Historique des</span>
              <span className="split-line highlight">guides</span>
            </h1>
            <p className="hist-sub">Retrouvez tous les guides que vous avez générés.</p>
          </section>

          <section className="hist-grid">
            {GUIDES.map(guide => (
              <a key={guide.id} href="/guide" className="hist-card">
                <div className="hist-card-top">
                  <span
                    className="hist-card-cat"
                    style={{ color: guide.color }}
                  >
                    {guide.category}
                  </span>
                  <span className="hist-card-date">{guide.date}</span>
                </div>
                <h2 className="hist-card-title">{guide.title}</h2>
                <p className="hist-card-summary">{guide.summary}</p>
              </a>
            ))}
          </section>
        </main>

        <footer>
          <p>© 2025 findUp · <a href="#">Mentions légales</a> · <a href="#">Confidentialité</a></p>
        </footer>
      </div>
    </>
  )
}