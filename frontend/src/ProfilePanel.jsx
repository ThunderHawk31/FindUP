
export default function ProfilePanel({ isOpen, onClose, user }) {
  return (
    <>
      {isOpen && <div className="overlay" onClick={onClose} />}
      <div className={`profile-panel ${isOpen ? 'open' : ''}`}>
        <button className="panel-close" onClick={onClose}>✕</button>
        <div className="panel-top">
          {user ? (
            <>
              <div className="panel-avatar">
                <span className="avatar-initials">{user.initials}</span>
              </div>
              <div className="panel-name">{user.name}</div>
              <div className="panel-sub">{user.email}</div>
            </>
          ) : (
            <>
              <div className="panel-avatar">
                <svg viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
              </div>
              <div className="panel-name">Mon compte</div>
              <div className="panel-sub">Connectez-vous pour accéder à votre profil</div>
              <a href="/login" className="panel-login-btn">Se connecter</a>
            </>
          )}
        </div>

        <div className="panel-divider" />

        {user ? (
          <>
            <a href="/historique" className="panel-item">
              <span className="panel-item-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </span>
              Historique des guides
            </a>
            <a href="/compte" className="panel-item">
              <span className="panel-item-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </span>
              Mon compte
            </a>
            <a href="/contact" className="panel-item">
              <span className="panel-item-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </span>
              Nous contacter
            </a>
          </>
        ) : (
          <a href="#" className="panel-item panel-item--muted">
            <span className="panel-item-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </span>
            FAQ
          </a>
        )}
      </div>
    </>
  )
}