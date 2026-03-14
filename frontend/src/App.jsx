import { useState, useRef } from 'react'
import GlassSurface from './components/ui/GlassSurface'
import './App.css'
import ProfilePanel from './ProfilePanel'

export default function App() {
  const [query, setQuery] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const [images, setImages] = useState([])
  const textareaRef = useRef(null)

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    const urls = files.map(f => URL.createObjectURL(f))
    setImages(prev => [...prev, ...urls])
  }

  function handleQueryChange(e) {
    setQuery(e.target.value)
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = ta.scrollHeight + 'px'
  }

  function goToChat() {
    if (query.trim()) {
      window.location.href = '/chat?q=' + encodeURIComponent(query)
    } else {
      window.location.href = '/chat'
    }
  }

  function setQueryText(t) {
    setQuery(t)
    const ta = textareaRef.current
    if (ta) {
      ta.focus()
      setTimeout(() => {
        ta.style.height = 'auto'
        ta.style.height = ta.scrollHeight + 'px'
      }, 0)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      goToChat()
    }
  }

  const chips = ["Fuite d'eau", "Panne électrique", "Carrelage fissuré", "Porte qui grince", "Chauffage"]

  return (
    <>
      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <ProfilePanel isOpen={profileOpen} onClose={() => setProfileOpen(false)} />

      <div className="page-layout">
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

      <section className="hero">
        <h1 className="hero-title">
          <span className="split-line">La solution à tous</span>
          <span className="split-line highlight">
            vos <span className="shiny">travaux</span>
          </span>
        </h1>

        <p className="hero-sub">
          Décrivez votre problème, notre IA l'analyse et vous guide vers la meilleure solution — réparer vous-même ou faire appel à un artisan qualifié près de chez vous.
        </p>

        {images.length > 0 && (
          <div className="image-previews">
            {images.map((url, i) => (
              <div key={i} className="image-preview-wrap">
                <img src={url} alt={`upload-${i}`} className="image-preview" />
                <button className="image-remove" onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}>✕</button>
              </div>
            ))}
          </div>
        )}

        <div className="search-container">
          <GlassSurface
            width="100%"
            height="auto"
            borderRadius={28}
            backgroundOpacity={0.21}
            blur={14}
            brightness={55}
            distortionScale={-60}
            className="search-glass"
          >
            <div className="search-inner">
              <textarea
                id="searchInput"
                ref={textareaRef}
                value={query}
                onChange={handleQueryChange}
                onKeyDown={handleKeyDown}
                placeholder="Ex : robinet qui fuit, carrelage fissuré…"
                autoComplete="off"
                rows={1}
              />
              <div className="search-actions">
                <input
                  type="file"
                  id="fileInput"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                />
                <button className="btn-icon" title="Ajouter une photo" onClick={() => document.getElementById('fileInput').click()}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="3" width="18" height="18" rx="4"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="M21 15l-5-5L5 21" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button className="btn-send" onClick={goToChat}>
                  <svg viewBox="0 0 24 24">
                    <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </GlassSurface>

          <div className="suggestions">
            {chips.map(s => (
              <button key={s} className="chip" onClick={() => setQueryText(s)}>{s}</button>
            ))}
          </div>
        </div>
      </section>

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
      </div>
    </>
  )
}