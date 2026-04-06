import { useState, useRef, useEffect, useCallback } from 'react'
import GlassSurface from './components/ui/GlassSurface'
import ProfilePanel from './ProfilePanel'
import useAuth from './hooks/useAuth'
import './Chat.css'

const API_URL = import.meta.env.VITE_API_URL || 'https://alert-cat-production.up.railway.app'

// ── UTILS ──
function now() {
  return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ── CHOICE CARD ──
function ChoiceMessage({ query }) {
  const encodedQuery = encodeURIComponent(query)
  return (
    <div className="choice-card">
      <div className="choice-options">
        <a href={`/diy?q=${encodedQuery}`} className="choice-option choice-option--diy">
          <div className="choice-option-left">
            <div className="choice-option-icon-wrap choice-option-icon-wrap--diy">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            </div>
            <div>
              <div className="choice-option-label">Je le fais moi-même</div>
              <div className="choice-option-sub">Outils, matériaux et guide pas à pas</div>
            </div>
          </div>
          <div className="choice-option-arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </a>

        <div className="choice-divider" />

        <a href={`/results?q=${encodedQuery}`} className="choice-option choice-option--pro">
          <div className="choice-option-left">
            <div className="choice-option-icon-wrap choice-option-icon-wrap--pro">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <div className="choice-option-label">Je fais appel à un pro</div>
              <div className="choice-option-sub">Artisans qualifiés près de chez vous</div>
            </div>
          </div>
          <div className="choice-option-arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </a>
      </div>
    </div>
  )
}

// ── SUGGESTION CHIPS ──
function SuggestionChips({ suggestions, onSelect, disabled }) {
  if (!suggestions || suggestions.length === 0) return null
  return (
    <div className="chat-suggestions">
      {suggestions.map((s, i) => (
        <button
          key={i}
          className="chat-suggestion-chip"
          onClick={() => onSelect(s)}
          disabled={disabled}
        >
          {s}
        </button>
      ))}
    </div>
  )
}

// ── GEOLOC BUTTON ──
function GeolocButton({ onLocated, disabled }) {
  const [locating, setLocating] = useState(false)

  function handleGeolocate() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        onLocated(pos.coords.latitude, pos.coords.longitude)
      },
      () => {
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <button
      className="chat-geoloc-btn"
      onClick={handleGeolocate}
      disabled={disabled || locating}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
      </svg>
      {locating ? 'Localisation…' : 'Me géolocaliser'}
    </button>
  )
}

// ── MAIN COMPONENT ──
export default function Chat() {
  const { user, loading: authLoading, logout, getToken } = useAuth()

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [images, setImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [showChoice, setShowChoice] = useState(false)
  const [lastUserQuery, setLastUserQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [needsLocation, setNeedsLocation] = useState(false)
  const [conversationHistory, setConversationHistory] = useState([])
  const [error, setError] = useState('')

  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const didInit = useRef(false)

  // ── Init ──
  useEffect(() => {
    if (didInit.current) return
    didInit.current = true

    const greeting = user
      ? `Bonjour ${user.name.split(' ')[0]} ! Je suis votre assistant findUp. Décrivez-moi votre problème et je trouverai la meilleure solution pour vous.`
      : "Bonjour ! Je suis votre assistant findUp. Décrivez-moi votre problème et je trouverai la meilleure solution pour vous."

    setMessages([{
      id: 1,
      from: 'bot',
      text: greeting,
      time: now()
    }])

    const params = new URLSearchParams(window.location.search)
    const q = params.get('q')
    if (q) {
      setTimeout(() => sendMessage(q), 500)
    }
  }, [user])

  // ── Auto-scroll ──
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping, showChoice])

  // ── Scroll quand le clavier iOS s'ouvre ──
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const onResize = () => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    vv.addEventListener('resize', onResize)
    return () => vv.removeEventListener('resize', onResize)
  }, [])

  // ── Send message to backend ──
  const sendMessage = useCallback(async (text = input) => {
    const msg = text.trim()
    if (!msg && images.length === 0) return

    setError('')

    const userMsg = {
      id: Date.now(),
      from: 'user',
      text: msg,
      images: [...imagePreviews],
      time: now()
    }
    setMessages(prev => [...prev, userMsg])
    setLastUserQuery(msg)
    setInput('')
    setSuggestions([])
    setNeedsLocation(false)

    let imageBase64 = null
    if (images.length > 0) {
      try {
        imageBase64 = await fileToBase64(images[0])
      } catch { }
    }
    setImages([])
    setImagePreviews([])

    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }

    setIsTyping(true)

    try {
      const token = await getToken()
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const body = {
        message: msg,
        conversation_history: conversationHistory,
      }
      if (imageBase64) body.image_base64 = imageBase64

      const resp = await fetch(`${API_URL}/api/chat/send`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(body)
      })

      if (!resp.ok) {
        throw new Error(`Erreur serveur (${resp.status})`)
      }

      const data = await resp.json()

      const botText = data.message || data.response || "Je n'ai pas compris, pouvez-vous reformuler ?"

      setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: msg },
        { role: 'assistant', content: botText }
      ])

      setIsTyping(false)
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        from: 'bot',
        text: botText,
        time: now()
      }])

      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions)
      } else {
        setSuggestions([])
      }

      if (data.needs_location) {
        setNeedsLocation(true)
      }

      if (data.ready_to_search) {
        setShowChoice(true)
        setSuggestions([])
      }

    } catch (err) {
      setIsTyping(false)
      setError(err.message || 'Erreur de connexion')
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        from: 'bot',
        text: "Désolé, une erreur est survenue. Réessayez dans quelques instants.",
        time: now()
      }])
    }
  }, [input, images, imagePreviews, conversationHistory, getToken])

  // ── Géolocalisation callback ──
  function handleGeolocation(lat, lon) {
    sendMessage(`Ma position : ${lat.toFixed(4)}, ${lon.toFixed(4)}`)
  }

  // ── Input handlers ──
  function handleInputChange(e) {
    setInput(e.target.value)
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = ta.scrollHeight + 'px'
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function handleImageUpload(e) {
    const files = Array.from(e.target.files)
    setImages(prev => [...prev, ...files])
    const urls = files.map(f => URL.createObjectURL(f))
    setImagePreviews(prev => [...prev, ...urls])
  }

  function removeImage(index) {
    setImages(prev => prev.filter((_, j) => j !== index))
    setImagePreviews(prev => prev.filter((_, j) => j !== index))
  }

  return (
    <div className="chat-page">

      <ProfilePanel isOpen={profileOpen} onClose={() => setProfileOpen(false)} user={user} onLogout={logout} />

      {/* HEADER */}
      <header className="chat-header">
        <div className="chat-header-inner">
          <a href="/" className="chat-back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
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
            {user ? (
              user.picture ? (
                <img src={user.picture} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <span className="avatar-initials">{user.initials}</span>
              )
            ) : (
              <svg viewBox="0 0 24 24">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
            )}
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

        {/* Typing indicator */}
        {isTyping && (
          <div className="msg-row msg-row--bot">
            <div className="msg-avatar">✦</div>
            <div className="msg-bubble msg-bubble--bot msg-bubble--typing">
              <span /><span /><span />
            </div>
          </div>
        )}

        {/* Suggestions chips */}
        {!isTyping && !showChoice && suggestions.length > 0 && (
          <SuggestionChips
            suggestions={suggestions}
            onSelect={(s) => sendMessage(s)}
            disabled={isTyping}
          />
        )}

        {/* Geoloc button */}
        {!isTyping && !showChoice && needsLocation && (
          <div className="chat-geoloc-row">
            <GeolocButton onLocated={handleGeolocation} disabled={isTyping} />
          </div>
        )}

        {/* Carte de choix */}
        {showChoice && !isTyping && (
          <div className="choice-row">
            <ChoiceMessage query={lastUserQuery} />
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      {/* INPUT — masqué après le choix */}
      {!showChoice && (
        <div className="chat-input-area">
          {imagePreviews.length > 0 && (
            <div className="chat-image-previews">
              {imagePreviews.map((url, i) => (
                <div key={i} className="chat-preview-wrap">
                  <img src={url} className="chat-preview-img" alt="" />
                  <button className="chat-preview-remove" onClick={() => removeImage(i)}>✕</button>
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
                    <rect x="3" y="3" width="18" height="18" rx="4" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" strokeLinejoin="round" />
                  </svg>
                </button>
                <button className="btn-send" onClick={() => sendMessage()} disabled={isTyping || (!input.trim() && images.length === 0)}>
                  <svg viewBox="0 0 24 24">
                    <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
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