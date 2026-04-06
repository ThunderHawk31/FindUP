import { useState, useEffect } from 'react'
import GlassSurface from './components/ui/GlassSurface'
import useAuth from './hooks/useAuth'
import './Achats.css'

const API_URL = import.meta.env.VITE_API_URL || 'https://alert-cat-production.up.railway.app'

function formatDate(iso) {
    const d = new Date(iso)
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function Achats() {
    const { user, getToken } = useAuth()
    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) { setLoading(false); return }
        async function fetchTransactions() {
            try {
                const token = await getToken()
                const r = await fetch(`${API_URL}/api/transactions`, {
                    headers: { Authorization: `Bearer ${token}` },
                    credentials: 'include'
                })
                if (r.ok) setTransactions(await r.json())
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        fetchTransactions()
    }, [user])

    const total = transactions.reduce((s, t) => s + Number(t.montant || 0), 0)

    return (
        <>
            <div className="bg-orbs">
                <div className="orb orb-1" />
                <div className="orb orb-2" />
                <div className="orb orb-3" />
            </div>

            <div className="ach-page-layout">
                <nav>
                    <GlassSurface width="100%" height={70} borderRadius={100} backgroundOpacity={0.21} blur={14} brightness={55} distortionScale={-60} className="nav-glass">
                        <div className="nav-inner">
                            <a href="/compte" className="nav-back" onClick={e => { e.preventDefault(); window.history.back() }} title="Retour">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="15" height="15">
                                    <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </a>
                            <div className="nav-actions">
                                <button className="avatar-btn">
                                    <span className="avatar-initials">{user.initials}</span>
                                </button>
                            </div>
                        </div>
                    </GlassSurface>
                </nav>

                <main className="ach-main">
                    <section className="ach-hero">
                        <h1 className="ach-title">
                            <span className="split-line">Mes</span>
                            <span className="split-line highlight">achats</span>
                        </h1>
                        <p className="ach-sub">Historique de vos guides achetés</p>
                    </section>

                    {/* Stats */}
                    <section className="ach-stats">
                        <div className="ach-stat-card">
                            <span className="ach-stat-value">{transactions.length}</span>
                            <span className="ach-stat-label">Guides achetés</span>
                        </div>
                        <div className="ach-stat-divider" />
                        <div className="ach-stat-card">
                            <span className="ach-stat-value">{total.toFixed(2).replace('.', ',')} €</span>
                            <span className="ach-stat-label">Total dépensé</span>
                        </div>
                    </section>

                    {/* Label section */}
                    <p className="ach-section-label">Transactions</p>

                    {/* Liste */}
                    <section className="ach-list">
                        {loading ? (
                            <p className="ach-sub">Chargement…</p>
                        ) : transactions.length === 0 ? (
                            <div className="ach-empty">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="36" height="36">
                                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                                    <line x1="3" y1="6" x2="21" y2="6" />
                                    <path d="M16 10a4 4 0 0 1-8 0" />
                                </svg>
                                <p>Aucune transaction</p>
                            </div>
                        ) : transactions.map((t) => (
                            <div key={t.id} className="ach-item">
                                <div className="ach-item-left">
                                    <span className="ach-item-title">{t.description}</span>
                                    <div className="ach-item-meta">
                                        <span className="ach-item-date">{formatDate(t.created_at)}</span>
                                        <span className="ach-item-dot" />
                                        <span className="ach-item-category">{t.statut}</span>
                                    </div>
                                </div>
                                <div className="ach-item-right">
                                    <span className="ach-item-amount">{Number(t.montant).toFixed(2).replace('.', ',')} €</span>
                                </div>
                            </div>
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