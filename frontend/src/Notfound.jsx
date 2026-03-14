import { useState } from 'react'
import GlassSurface from './components/ui/GlassSurface'
import ProfilePanel from './ProfilePanel'
import './NotFound.css'

export default function NotFound() {
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <>
      {/* Même fond orbs que l'accueil */}
      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <ProfilePanel isOpen={profileOpen} onClose={() => setProfileOpen(false)} />

      {/* Rubans chantier bleu/blanc en arrière-plan */}
      <div className="nf-tapes-bg" aria-hidden="true">
        <div className="nf-tape nf-tape--a" />
        <div className="nf-tape nf-tape--b" />
        <div className="nf-tape nf-tape--c" />
      </div>

      {/* Header — copie exacte de App.jsx */}
      <nav>
        <GlassSurface
          width="100%"
          height={70}
          borderRadius={100}
          backgroundOpacity={0.21}
          blur={14}
          brightness={55}
          distortionScale={-60}
          className="nav-glass"
        >
          <div className="nav-inner">
            <a href="/" className="nav-logo">find<span>Up</span></a>
            <div className="nav-actions">
              <a href="/login" className="btn-ghost">Se connecter</a>
              <button className="avatar-btn" onClick={() => setProfileOpen(true)}>
                <svg viewBox="0 0 24 24">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                </svg>
              </button>
            </div>
          </div>
        </GlassSurface>
      </nav>

      {/* Contenu 404 */}
      <main className="nf-main">

        {/* 404 + rouleau */}
        <div className="nf-code-wrap">
          <span className="nf-digit">4</span>
          <span className="nf-digit">0</span>
          <div className="nf-digit-last-wrap">
            <span className="nf-digit">4</span>
          </div>
        </div>

        {/* Titre */}
        <h1 className="nf-title">Zone de chantier, Circulez !</h1>

        {/* Boutons */}
        <div className="nf-actions">
          <a href="/" className="nf-btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="18" height="18">
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            Retour à l'accueil
          </a>

          <GlassSurface
            width="auto"
            height={52}
            borderRadius={50}
            backgroundOpacity={0.21}
            blur={14}
            brightness={55}
            distortionScale={-60}
            className="nf-btn-glass-surface"
          >
            <a href="/chat" className="nf-btn-glass">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="18" height="18">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              Trouver un artisan
            </a>
          </GlassSurface>
        </div>

      </main>

      {/* App band + footer — identiques à l'accueil */}
      <div className="app-band">
        <span className="app-band-text">Aussi disponible sur</span>
        <a href="#" className="store-btn">
          <img src="/Apple_logo.svg" className="store-icon" alt="Apple" />
          <div>
            <span className="store-small">Télécharger dans</span>
            <span className="store-name">l'App Store</span>
          </div>
        </a>
        <a href="#" className="store-btn">
          <img src="/Google_Play.png" className="store-icon" alt="Google Play" />
          <div>
            <span className="store-small">Disponible sur</span>
            <span className="store-name">Google Play</span>
          </div>
        </a>
      </div>

      <footer>
        <p>© 2025 findUp · <a href="#">Mentions légales</a> · <a href="#">Politique de confidentialité</a></p>
      </footer>
    </>
  )
}