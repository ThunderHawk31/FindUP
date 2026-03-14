import { useState, useRef, useEffect } from 'react'
import GlassSurface from './components/ui/GlassSurface'
import ProfilePanel from './ProfilePanel'
import './Chat.css'

const SUGGESTIONS_MAP = {
  'fuite': ["C'est urgent ?", "Quel étage ?", "Eau chaude ou froide ?", "Depuis combien de temps ?"],
  'eau': ["C'est urgent ?", "Quel étage ?", "Eau chaude ou froide ?", "Depuis combien de temps ?"],
  'électrique': ["Toute la maison ?", "Un seul circuit ?", "Disjoncteur déclenché ?", "Depuis quand ?"],
  'panne': ["Toute la maison ?", "Quel appareil ?", "Depuis quand ?", "Urgent ?"],
  'carrelage': ["Combien de m² ?", "Sol ou mur ?", "Pose ou réparation ?", "Quel délai ?"],
  'toiture': ["Fuite ou dégradation ?", "Surface approximative ?", "Type de toiture ?", "Urgent ?"],
  'chauffage': ["Chaudière ou radiateur ?", "Toute la maison ?", "Depuis quand ?", "Urgent ?"],
}

function now() {
  return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

const INITIAL_MESSAGES = [
  {
    id: 1,
    from: 'bot',
    text: "Bonjour ! Je suis votre assistant findUp. Décrivez-moi votre problème et je trouverai la meilleure solution pour vous.",
    time: now()
  }
]

/* ── CARTE DE CHOIX FINAL ── */
function ChoiceMessage({ query }) {
  const encodedQuery = encodeURIComponent(query)
  return (
    <div className="choice-card">
      <div className="choice-options">

        <a href={`/diy?q=${encodedQuery}`} className="choice-option choice-option--diy">
          <div className="choice-option-left">
            <div className="choice-option-icon-wrap choice-option-icon-wrap--diy">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
            </div>
            <div>
              <div className="choice-option-label">Je le fais moi-même</div>
              <div className="choice-option-sub">Outils, matériaux et guide pas à pas</div>
            </div>
          </div>
          <div className="choice-option-arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </a>

        <div className="choice-divider" />

        <a href={`/results?q=${encodedQuery}`} className="choice-option choice-option--pro">
          <div className="choice-option-left">
            <div className="choice-option-icon-wrap choice-option-icon-wrap--pro">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div>
              <div className="choice-option-label">Je fais appel à un pro</div>
              <div className="choice-option-sub">Artisans qualifiés près de chez vous</div>
            </div>
          </div>
          <div className="choice-option-arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </a>

      </div>
    </div>
  )
}

export default function Chat() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [images, setImages] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [showChoice, setShowChoice] = useState(false)
  const [lastUserQuery, setLastUserQuery] = useState('')
  const [messageCount, setMessageCount] = useState(0)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const didInit = useRef(false)

  useEffect(() => {
    if (didInit.current) return
    didInit.current = true
    const params = new URLSearchParams(window.location.search)
    const q = params.get('q')
    if (q) {
      setTimeout(() => sendMessage(q), 400)
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping, showChoice])

  function handleInputChange(e) {
    setInput(e.target.value)
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = ta.scrollHeight + 'px'
  }

  function sendMessage(text = input) {
    const msg = text.trim()
    if (!msg && images.length === 0) return

    const newCount = messageCount + 1
    setMessageCount(newCount)

    const userMsg = {
      id: Date.now(),
      from: 'user',
      text: msg,
      images: [...images],
      time: now()
    }
    setMessages(prev => [...prev, userMsg])
    setLastUserQuery(msg)
    setInput('')
    setImages([])
    setIsTyping(true)

    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }

    setTimeout(() => {
      setIsTyping(false)

      if (newCount >= 2) {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          from: 'bot',
          text: "Parfait, j'ai bien cerné votre problème. Comment souhaitez-vous le résoudre ?",
          time: now()
        }])
        setShowChoice(true)
      } else {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          from: 'bot',
          text: "Merci pour ces informations ! Je recherche les meilleures solutions pour ce type d'intervention. Pouvez-vous me préciser votre ville ?",
          time: now()
        }])
      }
    }, 1800)
  }

  function handleImageUpload(e) {
    const files = Array.from(e.target.files)
    const urls = files.map(f => URL.createObjectURL(f))
    setImages(prev => [...prev, ...urls])
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="chat-page">
      <div className="bg-orbs">
        <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
      </div>

      <ProfilePanel isOpen={profileOpen} onClose={() => setProfileOpen(false)} />

      {/* HEADER */}
      <header className="chat-header">
        <div className="chat-header-inner">
          <a href="/" className="chat-back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
          <div className="chat-bot-info">
            <div className="chat-bot-avatar">✦</div>
            <div>
              <div className="chat-bot-name">Assistant findUp</div>
              <div className="chat-bot-status">
                <span className="status-dot" />
                En ligne
              </div>
            </div>
          </div>
          <button className="avatar-btn" onClick={() => setProfileOpen(true)}>
            <svg viewBox="0 0 24 24">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
            </svg>
          </button>
        </div>
      </header>

      {/* MESSAGES */}
      <main className="chat-messages">
        {messages.map(msg => (
          <div key={msg.id} className={`msg-row ${msg.from === 'user' ? 'msg-row--user' : 'msg-row--bot'}`}>
            {msg.from === 'bot' && <div className="msg-avatar">✦</div>}
            <div className="msg-group">
              {msg.images && msg.images.length > 0 && (
                <div className={`msg-images ${msg.from === 'user' ? 'msg-images--user' : ''}`}>
                  {msg.images.map((url, i) => (
                    <img key={i} src={url} alt="" className="msg-image" />
                  ))}
                </div>
              )}
              {msg.text && (
                <div className={`msg-bubble ${msg.from === 'user' ? 'msg-bubble--user' : 'msg-bubble--bot'}`}>
                  {msg.text}
                </div>
              )}
              <div className={`msg-time ${msg.from === 'user' ? 'msg-time--user' : ''}`}>{msg.time}</div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="msg-row msg-row--bot">
            <div className="msg-avatar">✦</div>
            <div className="msg-bubble msg-bubble--bot msg-bubble--typing">
              <span /><span /><span />
            </div>
          </div>
        )}

        {/* CARTE DE CHOIX */}
        {showChoice && !isTyping && (
          <div className="choice-row">
            <ChoiceMessage query={lastUserQuery} />
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      {/* INPUT — masqué une fois le choix affiché */}
      {!showChoice && (
        <div className="chat-input-area">
          {images.length > 0 && (
            <div className="chat-image-previews">
              {images.map((url, i) => (
                <div key={i} className="chat-preview-wrap">
                  <img src={url} className="chat-preview-img" alt="" />
                  <button className="chat-preview-remove" onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}>✕</button>
                </div>
              ))}
            </div>
          )}
          <GlassSurface width="100%" height="auto" borderRadius={24} backgroundOpacity={0.21} blur={14} brightness={55} distortionScale={-60} className="chat-input-glass">
            <div className="chat-input-inner">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Décrivez votre problème…"
                autoComplete="off"
                rows={1}
              />
              <div className="chat-input-actions">
                <input type="file" id="chatFileInput" accept="image/*" multiple style={{ display: 'none' }} onChange={handleImageUpload} />
                <button className="btn-icon" onClick={() => document.getElementById('chatFileInput').click()}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="3" width="18" height="18" rx="4"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="M21 15l-5-5L5 21" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button className="btn-send" onClick={() => sendMessage()} disabled={!input.trim() && images.length === 0}>
                  <svg viewBox="0 0 24 24">
                    <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </GlassSurface>
        </div>
      )}
    </div>
  )
}