import { useState, useEffect, useRef } from 'react'
import ProfilePanel from './ProfilePanel'
import GlassSurface from './components/ui/GlassSurface'
import './Results.css'

const ARTISANS = [
  {
    id: 1, name: 'Jean Dubois', metier: 'Plombier', note: 4.9, avis: 127, ville: 'Nantes', adresse: '12 rue Crébillon, Nantes', tel: '06 12 34 56 78', site: 'https://jean-dubois-plombier.fr', certifie: true, lat: 47.2135, lng: -1.5596, initiales: 'JD', couleur: '#2563EB',
    photos: ['https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600', 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600', 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=600']
  },
  {
    id: 2, name: 'Marie Lecomte', metier: 'Électricienne', note: 4.8, avis: 89, ville: 'Saint-Herblain', adresse: '34 rue du Calvaire, Saint-Herblain', tel: '06 23 45 67 89', site: null, certifie: true, lat: 47.2180, lng: -1.5530, initiales: 'ML', couleur: '#1B3A6B',
    photos: ['https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600', 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600']
  },
  {
    id: 3, name: 'Pierre Renard', metier: 'Carreleur', note: 4.7, avis: 64, ville: 'Rezé', adresse: '8 rue de Strasbourg, Rezé', tel: '06 34 56 78 90', site: 'https://renard-carrelage.fr', certifie: false, lat: 47.2160, lng: -1.5480, initiales: 'PR', couleur: '#D4A853',
    photos: ['https://images.unsplash.com/photo-1558618047-f4e80a89bf44?w=600', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600', 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600']
  },
  {
    id: 4, name: 'Thomas Martin', metier: 'Plombier', note: 4.6, avis: 203, ville: 'Nantes', adresse: '56 bd Victor Hugo, Nantes', tel: '06 45 67 89 01', site: null, certifie: true, lat: 47.2100, lng: -1.5620, initiales: 'TM', couleur: '#2563EB',
    photos: ['https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=600', 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600', 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600']
  },
  {
    id: 5, name: 'Sophie Bernard', metier: 'Chauffagiste', note: 4.9, avis: 41, ville: 'Orvault', adresse: '3 rue Boileau, Orvault', tel: '06 56 78 90 12', site: 'https://bernard-chauffage.com', certifie: true, lat: 47.2200, lng: -1.5700, initiales: 'SB', couleur: '#1B3A6B',
    photos: ['https://images.unsplash.com/photo-1513467535987-fd81bc7d62f8?w=600', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600']
  },
  {
    id: 6, name: 'Lucas Moreau', metier: 'Menuisier', note: 4.5, avis: 58, ville: 'Nantes', adresse: '18 rue de la Paix, Nantes', tel: '06 67 89 01 23', site: null, certifie: false, lat: 47.2080, lng: -1.5550, initiales: 'LM', couleur: '#2563EB',
    photos: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600', 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600', 'https://images.unsplash.com/photo-1558618047-f4e80a89bf44?w=600']
  },
  {
    id: 7, name: 'Claire Dupont', metier: 'Peintre', note: 4.8, avis: 112, ville: 'Carquefou', adresse: '27 rue Voltaire, Carquefou', tel: '06 78 90 12 34', site: 'https://dupont-peinture.fr', certifie: true, lat: 47.2230, lng: -1.5460, initiales: 'CD', couleur: '#D4A853',
    photos: ['https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600', 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600']
  },
]

/* ── CTA BANNER — Desktop ── */
function CtaBannerDesktop() {
  return (
    <div className="promo-inner">
      {/* CTA 1 : DIY */}
      <a href="/diy" className="promo-card cta-card cta-card--diy">
        <div className="promo-card-info">
          <div className="promo-card-brand">Trop cher ?</div>
          <div className="promo-card-desc">Réparez-le vous-même — guides DIY</div>
        </div>
        <div className="cta-card-arrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </a>

      {/* Séparateur */}
      <div className="cta-divider" />

      {/* CTA 2 : Assurance */}
      <a href="https://www.exemple-assurance-travaux.fr" target="_blank" rel="noreferrer sponsored" className="promo-card cta-card cta-card--assurance">
        <div className="promo-card-info">
          <div className="promo-card-brand">Un litige avec votre artisan ?</div>
          <div className="promo-card-desc">Protégez votre chantier en l'assurant</div>
        </div>
        <div className="cta-card-tag">
          Voir l'offre →
        </div>
      </a>
    </div>
  )
}

/* ── CTA BANNER — Mobile ── */
function CtaBannerMobile() {
  return (
    <>
      {/* CTA DIY */}
      <a href="/diy" className="promo-card-mobile cta-card-mobile cta-card-mobile--diy">
        <div className="promo-card-mobile-info">
          <div className="promo-card-mobile-brand">Trop cher ? DIY</div>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ width: 14, height: 14, color: 'var(--navy)', flexShrink: 0 }}>
          <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>

      {/* CTA Assurance */}
      <a href="https://www.exemple-assurance-travaux.fr" target="_blank" rel="noreferrer sponsored" className="promo-card-mobile cta-card-mobile cta-card-mobile--assurance">
        <div className="promo-card-mobile-info">
          <div className="promo-card-mobile-brand">Litige ? Assurez-vous</div>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ width: 14, height: 14, color: 'var(--navy)', flexShrink: 0 }}>
          <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
    </>
  )
}

/* ── STARS ── */
function Stars({ note }) {
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} viewBox="0 0 24 24" className={`star ${i <= Math.round(note) ? 'star--full' : 'star--empty'}`}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  )
}

/* ── ARTISAN CARD ── */
function ArtisanCard({ artisan, selected, onClick }) {
  return (
    <div className={`artisan-card ${selected ? 'artisan-card--selected' : ''}`} onClick={onClick}>
      <div className="artisan-avatar-wrap">
        <div className="artisan-avatar" style={{ background: artisan.couleur }}>{artisan.initiales}</div>
      </div>
      <div className="artisan-info">
        <div className="artisan-header">
          <div className="artisan-name-row">
            <div className="artisan-name">{artisan.name}</div>
            {artisan.certifie && <div className="certif-badge"><svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg></div>}
          </div>
          <div className="artisan-metier">{artisan.metier}</div>
        </div>
        <div className="artisan-meta">
          <Stars note={artisan.note} />
          <span className="artisan-note">{artisan.note}</span>
          <span className="artisan-avis">({artisan.avis} avis)</span>
        </div>
        <div className="artisan-bottom-row">
          <span className="artisan-ville">{artisan.ville}</span>
          <button className="btn-call" onClick={e => { e.stopPropagation(); window.location.href = `tel:${artisan.tel}` }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.6 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.86a16 16 0 0 0 6.13 6.13l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
            Appeler
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── PHOTO CAROUSEL ── */
function PhotoCarousel({ photos }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const trackRef = useRef(null)

  function handleScroll() {
    const track = trackRef.current
    if (!track) return
    const index = Math.round(track.scrollLeft / track.clientWidth)
    setActiveIndex(index)
  }

  function scrollTo(index) {
    const track = trackRef.current
    if (!track) return
    track.scrollTo({ left: index * track.clientWidth, behavior: 'smooth' })
    setActiveIndex(index)
  }

  if (!photos || photos.length === 0) return null

  return (
    <div className="photo-carousel">
      <div className="photo-carousel-track" ref={trackRef} onScroll={handleScroll}>
        {photos.map((url, i) => (
          <div key={i} className="photo-carousel-slide">
            <img src={url} alt="" className="photo-carousel-img" />
          </div>
        ))}
      </div>
      <div className="photo-carousel-footer">
        <span className="photo-carousel-counter">{activeIndex + 1} / {photos.length}</span>
        <div className="photo-carousel-dots">
          {photos.map((_, i) => (
            <button
              key={i}
              className={`photo-carousel-dot ${i === activeIndex ? 'photo-carousel-dot--active' : ''}`}
              onClick={() => scrollTo(i)}
            />
          ))}
        </div>
        <div className="photo-carousel-arrows">
          <button
            className={`photo-carousel-arrow ${activeIndex === 0 ? 'photo-carousel-arrow--disabled' : ''}`}
            onClick={() => scrollTo(activeIndex - 1)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            className={`photo-carousel-arrow ${activeIndex === photos.length - 1 ? 'photo-carousel-arrow--disabled' : ''}`}
            onClick={() => scrollTo(activeIndex + 1)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── ARTISAN DETAIL ── */
function ArtisanDetail({ artisan, onClose }) {
  if (!artisan) return null
  const photos = artisan.photos || []

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-card" onClick={e => e.stopPropagation()}>
        <button className="detail-close" onClick={onClose}>✕</button>
        <div className="detail-header">
          <div className="detail-avatar-wrap">
            <div className="detail-avatar" style={{ background: artisan.couleur }}>{artisan.initiales}</div>
            {artisan.certifie && <div className="detail-certif">✓ Certifié</div>}
          </div>
          <div>
            <div className="detail-name">{artisan.name}</div>
            <div className="detail-metier">{artisan.metier}</div>
            <div className="artisan-meta" style={{ marginTop: '6px' }}>
              <Stars note={artisan.note} /><span className="artisan-note">{artisan.note}</span><span className="artisan-avis">({artisan.avis} avis)</span>
            </div>
          </div>
        </div>

        {photos.length > 0 && <PhotoCarousel photos={photos} />}

        <div className="detail-body">
          <div className="detail-row">
            <span className="detail-row-left">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="detail-icon"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
              Lieu
            </span>
            <span className="detail-value">{artisan.adresse}</span>
          </div>
          <div className="detail-row">
            <span className="detail-row-left">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="detail-icon"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
              Site web
            </span>
            {artisan.site
              ? <a href={artisan.site} target="_blank" rel="noreferrer" className="detail-tag detail-tag--site">Voir le site →</a>
              : <a href={`https://www.pagesjaunes.fr/recherche/${encodeURIComponent(artisan.name)}`} target="_blank" rel="noreferrer" className="detail-tag detail-tag--pj">Pages Jaunes →</a>
            }
          </div>
        </div>
        <button className="detail-btn-call" onClick={() => window.location.href = `tel:${artisan.tel}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.6 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.86a16 16 0 0 0 6.13 6.13l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
          Appeler {artisan.tel}
        </button>
      </div>
    </div>
  )
}

/* ── DRAWER MOBILE ── */
function MobileDrawer({ children }) {
  const [expanded, setExpanded] = useState(false)
  const touchStartY = useRef(null)
  const drawerRef = useRef(null)

  function onTouchStart(e) {
    touchStartY.current = e.touches[0].clientY
  }

  function onTouchEnd(e) {
    if (touchStartY.current === null) return
    const dy = touchStartY.current - e.changedTouches[0].clientY
    if (dy > 50) setExpanded(true)
    else if (dy < -50) setExpanded(false)
    touchStartY.current = null
  }

  return (
    <div
      ref={drawerRef}
      className={`mobile-drawer ${expanded ? 'mobile-drawer--expanded' : ''}`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="mobile-drawer-handle" onClick={() => setExpanded(v => !v)}>
        <div className="mobile-drawer-pill" />
        <div className="mobile-drawer-header-row">
          <span className="mobile-drawer-count">7 artisans trouvés</span>
          <span className="mobile-drawer-zone">Nantes Centre</span>
          <svg
            className={`mobile-drawer-chevron ${expanded ? 'mobile-drawer-chevron--up' : ''}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <div className="mobile-drawer-content">
        {children}
      </div>
    </div>
  )
}

/* ── PAGE PRINCIPALE ── */
export default function Results() {
  const [user] = useState({ name: 'Alex Dupont', email: 'alex@email.com', initials: 'AD' })
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const mapRef = useRef(null)
  const mapInstance = useRef(null)

  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => initMap()
    document.head.appendChild(script)
    return () => { if (mapInstance.current) mapInstance.current.remove() }
  }, [])

  function initMap() {
    const L = window.L
    const map = L.map(mapRef.current, { zoomControl: false }).setView([47.2173, -1.5534], 14)
    mapInstance.current = map
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO', maxZoom: 19
    }).addTo(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    ARTISANS.forEach(a => {
      const icon = L.divIcon({
        html: `<div class="map-marker" style="background:${a.couleur}">${a.initiales}</div>`,
        className: '', iconSize: [40, 40], iconAnchor: [20, 20]
      })
      const marker = L.marker([a.lat, a.lng], { icon }).addTo(map)
      marker.on('click', () => { setSelected(a.id); setDetail(a) })
    })
  }

  function handleCardClick(artisan) {
    setSelected(artisan.id)
    setDetail(artisan)
    if (mapInstance.current) mapInstance.current.flyTo([artisan.lat, artisan.lng], 15, { duration: 0.8 })
  }

  return (
    <div className="results-page">
      <ProfilePanel isOpen={profileOpen} onClose={() => setProfileOpen(false)} user={user} />
      <div ref={mapRef} className="results-map" />

      <header className="results-header">
        <div className="results-header-inner">
          <div className="results-header-left">
            <a href="/chat" className="results-back">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </a>
          </div>
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
      </header>

      {/* ── BANNIÈRE MOBILE ── */}
      <div className="promo-mobile-strip">
        <CtaBannerMobile />
      </div>

      {/* ── BANNIÈRE DESKTOP ── */}
      <div className="promo-desktop-wrap">
        <GlassSurface width="100%" height={70} borderRadius={18} backgroundOpacity={0.21} blur={14} brightness={55} distortionScale={-60} className="promo-glass">
          <CtaBannerDesktop />
        </GlassSurface>
      </div>

      <aside className="results-list">
        <div className="results-list-header">
          <h2 className="results-count">7 artisans trouvés</h2>
          <span className="results-zone">Nantes Centre</span>
        </div>
        <div className="results-cards">
          {ARTISANS.map(a => <ArtisanCard key={a.id} artisan={a} selected={selected === a.id} onClick={() => handleCardClick(a)} />)}
        </div>
      </aside>

      <MobileDrawer>
        {ARTISANS.map(a => <ArtisanCard key={a.id} artisan={a} selected={selected === a.id} onClick={() => handleCardClick(a)} />)}
      </MobileDrawer>

      {detail && <ArtisanDetail artisan={detail} onClose={() => { setDetail(null); setSelected(null) }} />}
    </div>
  )
}