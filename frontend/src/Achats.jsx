import { useState } from 'react'
import GlassSurface from './components/ui/GlassSurface'
import './Achats.css'

const CATEGORY_COLORS = {
    Plomberie: { bg: '#eff6ff', text: '#2563eb' },
    Électricité: { bg: '#fefce8', text: '#ca8a04' },
    Menuiserie: { bg: '#fdf4ff', text: '#9333ea' },
    Peinture: { bg: '#fff7ed', text: '#ea580c' },
    Maçonnerie: { bg: '#f0fdf4', text: '#16a34a' },
    Carrelage: { bg: '#fff1f2', text: '#e11d48' },
    Chauffage: { bg: '#fff7ed', text: '#c2410c' },
}

const TRANSACTIONS = [
    {
        id: 'TXN-2025-001',
        guide: 'Réparer une fuite sous l\'évier',
        category: 'Plomberie',
        date: '2025-06-12',
        amount: 4.99,
        status: 'paid',
    },
    {
        id: 'TXN-2025-002',
        guide: 'Changer un disjoncteur',
        category: 'Électricité',
        date: '2025-05-28',
        amount: 5.99,
        status: 'paid',
    },
    {
        id: 'TXN-2025-003',
        guide: 'Poser un parquet flottant',
        category: 'Menuiserie',
        date: '2025-04-14',
        amount: 6.99,
        status: 'paid',
    },
    {
        id: 'TXN-2025-004',
        guide: 'Peindre un mur intérieur',
        category: 'Peinture',
        date: '2025-03-02',
        amount: 3.99,
        status: 'refunded',
    },
    {
        id: 'TXN-2025-005',
        guide: 'Reboucher des fissures',
        category: 'Maçonnerie',
        date: '2025-01-19',
        amount: 4.49,
        status: 'paid',
    },
]

function formatDate(iso) {
    const d = new Date(iso)
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function Achats() {
    const [user] = useState({ name: 'Alex Dupont', email: 'alex@email.com', initials: 'AD' })
    const [filter, setFilter] = useState('all')

    const filtered = filter === 'all' ? TRANSACTIONS : TRANSACTIONS.filter(t => t.status === filter)
    const total = TRANSACTIONS.filter(t => t.status === 'paid').reduce((s, t) => s + t.amount, 0)

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
                    <section className="ach-stats" style={{ animationDelay: '.08s' }}>
                        <div className="ach-stat-card">
                            <span className="ach-stat-value">{TRANSACTIONS.filter(t => t.status === 'paid').length}</span>
                            <span className="ach-stat-label">Guides achetés</span>
                        </div>
                        <div className="ach-stat-divider" />
                        <div className="ach-stat-card">
                            <span className="ach-stat-value">{total.toFixed(2).replace('.', ',')} €</span>
                            <span className="ach-stat-label">Total dépensé</span>
                        </div>
                        <div className="ach-stat-divider" />
                        <div className="ach-stat-card">
                            <span className="ach-stat-value">{TRANSACTIONS.filter(t => t.status === 'refunded').length}</span>
                            <span className="ach-stat-label">Remboursé(s)</span>
                        </div>
                    </section>

                    {/* Filtres */}
                    <div className="ach-filters" style={{ animationDelay: '.12s' }}>
                        {[['all', 'Tous'], ['paid', 'Payés'], ['refunded', 'Remboursés']].map(([val, label]) => (
                            <button
                                key={val}
                                className={`ach-filter-btn${filter === val ? ' ach-filter-btn--active' : ''}`}
                                onClick={() => setFilter(val)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Liste */}
                    <section className="ach-list" style={{ animationDelay: '.16s' }}>
                        {filtered.length === 0 ? (
                            <div className="ach-empty">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="36" height="36">
                                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                                    <line x1="3" y1="6" x2="21" y2="6" />
                                    <path d="M16 10a4 4 0 0 1-8 0" />
                                </svg>
                                <p>Aucune transaction</p>
                            </div>
                        ) : filtered.map((t, i) => {
                            const cat = CATEGORY_COLORS[t.category] || { bg: '#f5f5f5', text: '#555' }
                            return (
                                <a key={t.id} href={`/guide/${t.id}`} className="ach-item" style={{ animationDelay: `${.16 + i * .06}s` }}>
                                    <div className="ach-item-left">
                                        <span className="ach-cat-badge" style={{ background: cat.bg, color: cat.text }}>
                                            {t.category}
                                        </span>
                                        <span className="ach-item-date">{formatDate(t.date)}</span>
                                        <span className="ach-item-title">{t.guide}</span>
                                        <span className="ach-item-id">{t.id}</span>
                                    </div>
                                    <div className="ach-item-right">
                                        <span className="ach-item-amount">{t.amount.toFixed(2).replace('.', ',')} €</span>
                                        <span className={`ach-item-status ach-item-status--${t.status}`}>
                                            {t.status === 'paid' ? 'Payé' : 'Remboursé'}
                                        </span>
                                        <svg className="ach-item-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </a>
                            )
                        })}
                    </section>
                </main>

                <footer>
                    <p>© 2025 findUp · <a href="#">Mentions légales</a> · <a href="#">Confidentialité</a></p>
                </footer>
            </div>
        </>
    )
}