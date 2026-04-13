import { useState } from 'react'
import GlassSurface from './components/ui/GlassSurface'
import ProfilePanel from './ProfilePanel'
import useAuth from './hooks/useAuth'
import './PolitiqueConfidentialite.css'

export default function PolitiqueConfidentialite() {
    const { user, logout } = useAuth()
    const [profileOpen, setProfileOpen] = useState(false)

    return (
        <>
            <div className="bg-orbs">
                <div className="orb orb-1" />
                <div className="orb orb-2" />
                <div className="orb orb-3" />
            </div>

            <ProfilePanel isOpen={profileOpen} onClose={() => setProfileOpen(false)} user={user} onLogout={logout} />

            <div className="pc-page-layout">
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

                <main className="pc-main">
                    <section className="pc-hero">
                        <h1 className="pc-title">
                            <span className="split-line">Politique de</span>
                            <span className="split-line highlight">confidentialité</span>
                        </h1>
                        <p className="pc-sub">Dernière mise à jour : Avril 2026</p>
                    </section>

                    <div className="pc-content">

                        <div className="pc-card pc-card--highlight">
                            <p className="pc-intro">
                                Chez findUp, votre vie privée est une priorité. Cette page explique simplement quelles données nous collectons, pourquoi, et comment vous pouvez les contrôler.
                            </p>
                        </div>

                        <div className="pc-card">
                            <h2 className="pc-section-title">
                                <span className="pc-section-num">01</span>
                                Les cookies
                            </h2>
                            <p className="pc-text">findUp utilise un unique cookie de session nommé <code className="pc-code">session_token</code>. Il est strictement nécessaire au fonctionnement de votre compte et ne peut pas être refusé si vous êtes connecté.</p>
                            <div className="pc-table">
                                <div className="pc-table-row pc-table-header">
                                    <span>Nom</span>
                                    <span>Durée</span>
                                    <span>Utilité</span>
                                </div>
                                <div className="pc-table-row">
                                    <span><code className="pc-code">session_token</code></span>
                                    <span>7 jours</span>
                                    <span>Maintenir votre connexion</span>
                                </div>
                                <div className="pc-table-row">
                                    <span><code className="pc-code">chat_session</code></span>
                                    <span>1 heure</span>
                                    <span>Historique de conversation IA</span>
                                </div>
                            </div>
                            <p className="pc-text">Nous n'utilisons aucun cookie publicitaire, de tracking ou d'analyse tiers.</p>
                        </div>

                        <div className="pc-card">
                            <h2 className="pc-section-title">
                                <span className="pc-section-num">02</span>
                                Données collectées
                            </h2>
                            <p className="pc-text">Lors de la création d'un compte, nous collectons :</p>
                            <ul className="pc-list">
                                <li>Adresse e-mail</li>
                                <li>Nom (facultatif)</li>
                                <li>Photo de profil (si connexion Google)</li>
                            </ul>
                            <p className="pc-text">Lors de l'utilisation du service, nous enregistrons vos recherches d'artisans, favoris et l'historique de vos conversations avec notre IA — uniquement pour améliorer votre expérience.</p>
                        </div>

                        <div className="pc-card">
                            <h2 className="pc-section-title">
                                <span className="pc-section-num">03</span>
                                Vos droits
                            </h2>
                            <p className="pc-text">Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Vous pouvez supprimer votre compte à tout moment depuis <a href="/compte/securite" className="pc-link">Paramètres → Sécurité</a>.</p>
                            <p className="pc-text">Pour toute demande, contactez-nous à <a href="mailto:privacy@findup.fr" className="pc-link">privacy@findup.fr</a>.</p>
                        </div>

                        <div className="pc-card">
                            <h2 className="pc-section-title">
                                <span className="pc-section-num">04</span>
                                Hébergement & sécurité
                            </h2>
                            <p className="pc-text">Vos données sont hébergées en Europe via <strong>Supabase</strong> (conforme RGPD) et notre backend sur <strong>Railway</strong>. Les échanges sont chiffrés en HTTPS. Les cookies de session sont <code className="pc-code">HttpOnly</code> et <code className="pc-code">Secure</code> — ils ne sont pas accessibles depuis JavaScript.</p>
                        </div>

                    </div>
                </main>

                <footer>
                    <p>© 2025 findUp · <a href="#">Mentions légales</a> · <a href="/politique-confidentialite">Confidentialité</a></p>
                </footer>
            </div>
        </>
    )
}