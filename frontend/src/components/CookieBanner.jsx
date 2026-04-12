import { useState, useEffect } from 'react'

const COOKIE_KEY = 'findup_cookie_consent'

export default function CookieBanner() {
    const [visible, setVisible] = useState(false)
    const [hiding, setHiding] = useState(false)

    useEffect(() => {
        const consent = localStorage.getItem(COOKIE_KEY)
        if (!consent) {
            const t = setTimeout(() => setVisible(true), 800)
            return () => clearTimeout(t)
        }
    }, [])

    function dismiss(choice) {
        localStorage.setItem(COOKIE_KEY, choice)
        setHiding(true)
        setTimeout(() => setVisible(false), 400)
    }

    if (!visible) return null

    return (
        <>
            <style>{`
        .cb-wrap {
          position: fixed;
          top: 16px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 9999;
          width: min(480px, calc(100vw - 32px));
          animation: cb-slide-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .cb-wrap.hiding {
          animation: cb-slide-out 0.35s cubic-bezier(0.4, 0, 1, 1) forwards;
        }

        @keyframes cb-slide-in {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-24px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
        }

        @keyframes cb-slide-out {
          from {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateX(-50%) translateY(-16px) scale(0.97);
          }
        }

        .cb-card {
          background: var(--cream, #F5F4F0);
          border: 1px solid rgba(7, 16, 31, 0.07);
          border-radius: 20px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow:
            0 4px 24px rgba(7, 16, 31, 0.10),
            0 1px 4px rgba(7, 16, 31, 0.06);
        }

        .cb-text {
          flex: 1;
          min-width: 0;
        }

        .cb-title {
          font-family: -apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: var(--navy, #07101F);
          margin: 0 0 5px 0;
          line-height: 1.3;
          letter-spacing: -0.01em;
        }

        .cb-desc {
          font-family: -apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif;
          font-size: 12.5px;
          font-weight: 400;
          color: var(--muted, #6b7a96);
          margin: 0;
          line-height: 1.55;
          letter-spacing: -0.005em;
        }

        .cb-desc a {
          color: var(--blue, #2563EB);
          text-decoration: none;
        }

        .cb-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }

        .cb-btn-decline {
          font-family: -apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: var(--muted, #6b7a96);
          background: rgba(107, 122, 150, 0.10);
          border: none;
          border-radius: 10px;
          padding: 8px 14px;
          cursor: pointer;
          transition: background 0.18s;
          white-space: nowrap;
          letter-spacing: -0.01em;
        }

        .cb-btn-decline:hover {
          background: rgba(107, 122, 150, 0.18);
        }

        .cb-btn-accept {
          font-family: -apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: #fff;
          background: var(--navy, #07101F);
          border: none;
          border-radius: 10px;
          padding: 8px 16px;
          cursor: pointer;
          transition: opacity 0.18s;
          white-space: nowrap;
          letter-spacing: -0.01em;
        }

        .cb-btn-accept:hover {
          opacity: 0.85;
        }
      `}</style>

            <div className={`cb-wrap${hiding ? ' hiding' : ''}`} role="dialog" aria-label="Consentement cookies">
                <div className="cb-card">
                    <div className="cb-text">
                        <p className="cb-title">Cookies & confidentialité</p>
                        <p className="cb-desc">
                            On utilise des cookies pour votre session.<br />
                            <a href="/politique-confidentialite">En savoir plus</a>
                        </p>
                    </div>
                    <div className="cb-actions">
                        <button className="cb-btn-decline" onClick={() => dismiss('declined')}>
                            Refuser
                        </button>
                        <button className="cb-btn-accept" onClick={() => dismiss('accepted')}>
                            Accepter
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}