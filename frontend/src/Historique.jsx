import { useState, useEffect } from 'react'
import GlassSurface from './components/ui/GlassSurface'
import ProfilePanel from './ProfilePanel'
import useAuth from './hooks/useAuth'
import './Historique.css'

const API_URL = import.meta.env.VITE_API_URL || 'https://alert-cat-production.up.railway.app'

const THEME_COLORS = {
  'Plomberie': '#1d4ed8',
  'Électricité': '#1B3A6B',
  'Carrelage': '#a07830',
  'Maçonnerie': '#7c3aed',
  'Menuiserie': '#b45309',
  'Peinture': '#0891b2',
  'Toiture': '#dc2626',
  'Chauffage': '#ea580c',
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function Historique() {
  const { user, logout, getToken } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)
  const [guides, setGuides] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    async function fetchGuides() {
      try {
        const token = await getToken()
        const r = await fetch(`${API_URL}/api/historique-guides`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include'
        })
        if (r.ok) setGuides(await r.json())
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchGuides()
  }, [user])

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
            {loading ? (
              <p className="hist-sub">Chargement…</p>
            ) : !user ? (
              <p className="hist-sub">Connectez-vous pour voir votre historique.</p>
            ) : guides.length === 0 ? (
              <p className="hist-sub">Aucun guide consulté pour l'instant.</p>
            ) : guides.map(guide => (
              <a key={guide.id} href="/guide" className="hist-card">
                <div className="hist-card-top">
                  <span className="hist-card-cat" style={{ color: THEME_COLORS[guide.theme] || '#2563EB' }}>
                    {guide.theme}
                  </span>
                  <span className="hist-card-date">{formatDate(guide.date)}</span>
                </div>
                <h2 className="hist-card-title">{guide.titre}</h2>
                <p className="hist-card-summary">{guide.description}</p>
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