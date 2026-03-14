
export default function ProfilePanel({ isOpen, onClose }) {
  return (
    <>
      {isOpen && <div className="overlay" onClick={onClose} />}
      <div className={`profile-panel ${isOpen ? 'open' : ''}`}>
        <button className="panel-close" onClick={onClose}>✕</button>
        <div className="panel-top">
          <div className="panel-avatar">
            <svg viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
          </div>
          <div className="panel-name">Mon compte</div>
          <div className="panel-sub">Connectez-vous pour accéder à votre profil</div>
          <a href="/login" className="panel-login-btn">Se connecter</a>
        </div>

        <div className="panel-divider" />

        <a href="#" className="panel-item panel-item--muted">
          <span className="panel-item-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </span>
          FAQ
        </a>
      </div>
    </>
  )
}