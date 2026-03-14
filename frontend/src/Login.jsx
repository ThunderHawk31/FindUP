import { useState } from 'react'
import GlassSurface from './components/ui/GlassSurface'
import './Login.css'

export default function Login() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    alert(mode === 'login' ? 'Connexion avec : ' + email : 'Compte créé pour : ' + email)
  }

  return (
    <div className="login-page">
      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <a href="/" className="login-back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Retour
      </a>

      <div className="login-center">
        <a href="/" className="login-logo">find<span>Up</span></a>

        {/* Toggle avec liquid glass */}
        <div className="toggle-wrap">
          <GlassSurface
            width="100%"
            height={52}
            borderRadius={100}
            backgroundOpacity={0.21}
            blur={14}
            brightness={55}
            distortionScale={-60}
            className="toggle-glass"
          >
            <div className="toggle-inner">
              <button
                className={`toggle-btn ${mode === 'login' ? 'active' : ''}`}
                onClick={() => setMode('login')}
              >
                Se connecter
              </button>
              <button
                className={`toggle-btn ${mode === 'register' ? 'active' : ''}`}
                onClick={() => setMode('register')}
              >
                Créer un compte
              </button>
            </div>
          </GlassSurface>
        </div>

        {/* Card simple sans glass */}
        <div className="login-card">
          <h1 className="login-title">
            {mode === 'login' ? 'Bon retour' : 'Rejoindre findUp'}
          </h1>
          <p className="login-sub">
            {mode === 'login'
              ? 'Connectez-vous pour accéder à vos artisans favoris et votre historique.'
              : 'Créez votre compte pour retrouver vos recherches et artisans favoris.'}
          </p>

          {/* Social */}
          <div className="social-btns">
            <button className="social-btn">
              <svg viewBox="0 0 24 24" className="social-icon">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuer avec Google
            </button>
            <button className="social-btn">
              <svg viewBox="0 0 814 1000" className="social-icon" fill="#000">
                <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.3 269-317.3 70.1 0 128.4 46.4 172.5 46.4 42.8 0 109.6-49 192.5-49 30.8 0 108.2 2.6 168.1 74.8zm-126.6-89.5c-22.1-26-59.3-45.8-92.5-45.8-3.8 0-7.7.3-11.5.8 1-19.8 9.7-40.8 20.3-55.8 17.7-24.6 44.9-42.1 71.9-42.1 3.2 0 6.4.3 9.7.6-1 19.8-9 40.8-18.9 57.1-9 15.3-22.1 30.4-35.4 37.4 19.2 1.9 38.7-3.2 54.5-13.9C645 137.5 647.8 107 649 95c-.6 0-1.3-.3-1.9-.3-37.5 0-77.8 26.9-100.2 62.6C533.4 181.6 529 200 529 218c0 1.9.3 3.8.6 5.7 3.8 0 7.7.6 11.5.6 34.6 0 70.7-15.6 94.9-44.9l26.5 31z"/>
              </svg>
              Continuer avec Apple
            </button>
          </div>

          <div className="login-divider"><span>ou</span></div>

          <form className="login-form" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="field">
                <label>Nom complet</label>
                <input type="text" placeholder="Jean Dupont" value={name} onChange={e => setName(e.target.value)} required />
              </div>
            )}
            <div className="field">
              <label>Adresse e-mail</label>
              <input type="email" placeholder="jean@exemple.fr" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label>Mot de passe</label>
              <input type="password" placeholder={mode === 'register' ? 'Minimum 8 caractères' : '••••••••'} value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {mode === 'login' && (
              <a href="#" className="forgot-link">Mot de passe oublié ?</a>
            )}
            <button type="submit" className="btn-primary">
              {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </button>
          </form>
        </div>

        <p className="login-legal">
          En continuant, vous acceptez nos <a href="#">CGU</a> et notre <a href="#">politique de confidentialité</a>.
        </p>
      </div>
    </div>
  )
}