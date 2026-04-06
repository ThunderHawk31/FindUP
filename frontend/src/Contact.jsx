import { useState, useRef, useEffect } from 'react'
import GlassSurface from './components/ui/GlassSurface'
import ProfilePanel from './ProfilePanel'
import useAuth from './hooks/useAuth'
import './Contact.css'

const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_KEY || '23c8ac38-2ec9-49e7-b550-93d7e814eecb'

const SUBJECTS = [
  { id: 'bug', label: 'Signaler un bug' },
  { id: 'question', label: 'Question générale' },
  { id: 'abo', label: 'Abonnement & facturation' },
  { id: 'suggestion', label: 'Suggestion' },
  { id: 'autre', label: 'Autre' }
]

export default function Contact() {
  const { user, logout } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)

  const [subject, setSubject] = useState('')
  const [subjectOpen, setSubjectOpen] = useState(false)
  const [message, setMessage] = useState('')

  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setSubjectOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!subject || !message.trim() || sending) return

    setSending(true)
    setError(null)

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: `findUp — ${SUBJECTS.find(s => s.id === subject)?.label || subject}`,
          message: message,
          from_name: user?.name || 'Utilisateur findUp',
          email: user?.email || 'inconnu@findup.fr',
        })
      })

      const data = await res.json()

      if (data.success) {
        setSent(true)
        setSubject('')
        setMessage('')
      } else {
        setError('Une erreur est survenue. Réessaie ou écris-nous directement.')
      }
    } catch {
      setError('Connexion impossible. Vérifie ta connexion internet.')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <ProfilePanel isOpen={profileOpen} onClose={() => setProfileOpen(false)} user={user} onLogout={logout} />

      <div className="contact-page-layout">
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

        <main className="contact-main">
          <section className="contact-hero">
            <h1 className="contact-title">
              <span className="split-line">Nous</span>
              <span className="split-line highlight">contacter</span>
            </h1>
            <p className="contact-sub">Une question, un problème ou une suggestion ? Écrivez-nous.</p>
          </section>

          {sent ? (
            <div className="contact-success">
              <div className="contact-success-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="40" height="40">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="contact-success-title">Message envoyé !</h2>
              <p className="contact-success-text">Nous reviendrons vers vous dans les meilleurs délais.</p>
              <button className="contact-back-btn" onClick={() => setSent(false)}>
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <section className="contact-form-card">
              <form className="contact-form" onSubmit={handleSubmit}>
                <label className="contact-label">
                  <span className="contact-label-text">Sujet</span>

                  <div className="custom-select-wrapper" ref={dropdownRef}>
                    <div
                      className={`custom-select-trigger ${subjectOpen ? 'open' : ''} ${subject ? 'selected' : ''}`}
                      onClick={() => setSubjectOpen(!subjectOpen)}
                    >
                      <span>{subject ? SUBJECTS.find(s => s.id === subject)?.label : 'Choisissez un sujet…'}</span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </div>

                    {subjectOpen && (
                      <div className="custom-select-options">
                        {SUBJECTS.map((s) => (
                          <div
                            key={s.id}
                            className={`custom-select-option ${subject === s.id ? 'active' : ''}`}
                            onClick={() => {
                              setSubject(s.id)
                              setSubjectOpen(false)
                            }}
                          >
                            {s.label}
                            {subject === s.id && (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="14" height="14">
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </label>

                <label className="contact-label">
                  <span className="contact-label-text">Message</span>
                  <textarea
                    className="contact-textarea"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Décrivez votre demande…"
                    rows={5}
                    required
                  />
                </label>

                {error && (
                  <p style={{
                    fontSize: '.84rem', color: '#dc2626',
                    background: 'rgba(239,68,68,0.07)',
                    border: '1px solid rgba(239,68,68,0.18)',
                    borderRadius: '10px', padding: '10px 14px', margin: 0
                  }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className={`contact-submit${sending ? ' contact-submit--loading' : ''}`}
                  disabled={sending}
                >
                  {sending ? 'Envoi en cours…' : (
                    <>
                      Envoyer
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="16" height="16">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </section>
          )}

          <div className="contact-email-block">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <span>Vous pouvez aussi nous écrire à <a href="mailto:rennessontimothe@gmail.com">rennessontimothe@gmail.com</a></span>
          </div>
        </main>

        <footer>
          <p>© 2025 findUp · <a href="#">Mentions légales</a> · <a href="#">Confidentialité</a></p>
        </footer>
      </div>
    </>
  )
}