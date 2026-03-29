import { useState } from 'react'
import GlassSurface from './components/ui/GlassSurface'
import ProfilePanel from './ProfilePanel'
import './Compte.css'

export default function Compte() {
  const [user] = useState({ name: 'Alex Dupont', email: 'alex@email.com', initials: 'AD' })
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <>
      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <ProfilePanel isOpen={profileOpen} onClose={() => setProfileOpen(false)} user={user} />

      <div className="compte-page-layout">
        <nav>
          <GlassSurface width="100%" height={70} borderRadius={100} backgroundOpacity={0.21} blur={14} brightness={55} distortionScale={-60} className="nav-glass">
            <div className="nav-inner">
              <a href="/" className="nav-back" onClick={e => { e.preventDefault(); window.history.back() }} title="Retour">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="15" height="15">
                  <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
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

        <main className="compte-main">
          <section className="compte-hero">
            <h1 className="compte-title">
              <span className="split-line">Mon</span>
              <span className="split-line highlight">compte</span>
            </h1>
          </section>

          {/* Carte profil */}
          <section className="compte-profile-card">
            <div className="compte-avatar">
              {user.initials}
            </div>
            <div className="compte-user-info">
              <div className="compte-user-name">{user.name}</div>
              <div className="compte-user-email">{user.email}</div>
            </div>
          </section>

          {/* Section paramètres */}
          <section className="compte-section">
            <h2 className="compte-section-title">Paramètres</h2>
            <div className="compte-actions">
              <button className="compte-action-btn">
                <span className="compte-action-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </span>
                <span>Modifier mes informations</span>
                <svg className="compte-action-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>

              <button className="compte-action-btn">
                <span className="compte-action-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <span>Mes achats</span>
                <svg className="compte-action-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>

              <button className="compte-action-btn">
                <span className="compte-action-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <span>Sécurité et mot de passe</span>
                <svg className="compte-action-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
          </section>

          {/* Déconnexion */}
          <section className="compte-section">
            <div className="compte-actions">
              <button className="compte-action-btn compte-action-btn--danger">
                <span className="compte-action-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </span>
                <span>Se déconnecter</span>
              </button>
            </div>
          </section>
        </main>

        <footer>
          <p>© 2025 findUp · <a href="#">Mentions légales</a> · <a href="#">Confidentialité</a></p>
        </footer>
      </div>
    </>
  )
}
