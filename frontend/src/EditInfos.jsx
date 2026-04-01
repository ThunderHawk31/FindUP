import { useState } from 'react'
import GlassSurface from './components/ui/GlassSurface'
import './EditInfos.css'

export default function EditInfos() {
    const [user] = useState({ name: 'Alex Dupont', email: 'alex@email.com', initials: 'AD' })
    const [form, setForm] = useState({
        prenom: 'Alex',
        nom: 'Dupont',
        email: 'alex@email.com',
    })
    const [saved, setSaved] = useState(false)
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState({})

    const validate = () => {
        const e = {}
        if (!form.prenom.trim()) e.prenom = 'Prénom requis'
        if (!form.nom.trim()) e.nom = 'Nom requis'
        if (!form.email.trim()) e.email = 'Email requis'
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email invalide'
        return e
    }

    const handleChange = (field) => (e) => {
        setForm(f => ({ ...f, [field]: e.target.value }))
        if (errors[field]) setErrors(er => ({ ...er, [field]: null }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const errs = validate()
        if (Object.keys(errs).length) { setErrors(errs); return }
        setLoading(true)
        await new Promise(r => setTimeout(r, 900))
        setLoading(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
    }

    return (
        <>
            <div className="bg-orbs">
                <div className="orb orb-1" />
                <div className="orb orb-2" />
                <div className="orb orb-3" />
            </div>

            <div className="ei-page-layout">
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

                <main className="ei-main">
                    <section className="ei-hero">
                        <h1 className="ei-title">
                            <span className="split-line">Mes</span>
                            <span className="split-line highlight">informations</span>
                        </h1>
                        <p className="ei-sub">Modifiez vos informations personnelles</p>
                    </section>

                    <section className="ei-card">
                        <div className="ei-avatar-row">
                            <div className="ei-avatar">{user.initials}</div>
                            <div className="ei-avatar-meta">
                                <span className="ei-avatar-name">{form.prenom} {form.nom}</span>
                                <span className="ei-avatar-email">{form.email}</span>
                            </div>
                        </div>

                        <form className="ei-form" onSubmit={handleSubmit} noValidate>
                            <div className="ei-fields-row">
                                <div className="ei-field-group">
                                    <label className="ei-label">
                                        <span className="ei-label-text">Prénom</span>
                                        <input
                                            className={`ei-input${errors.prenom ? ' ei-input--error' : ''}`}
                                            type="text"
                                            value={form.prenom}
                                            onChange={handleChange('prenom')}
                                            placeholder="Votre prénom"
                                            autoComplete="given-name"
                                        />
                                        {errors.prenom && <span className="ei-error-msg">{errors.prenom}</span>}
                                    </label>
                                </div>
                                <div className="ei-field-group">
                                    <label className="ei-label">
                                        <span className="ei-label-text">Nom</span>
                                        <input
                                            className={`ei-input${errors.nom ? ' ei-input--error' : ''}`}
                                            type="text"
                                            value={form.nom}
                                            onChange={handleChange('nom')}
                                            placeholder="Votre nom"
                                            autoComplete="family-name"
                                        />
                                        {errors.nom && <span className="ei-error-msg">{errors.nom}</span>}
                                    </label>
                                </div>
                            </div>

                            <div className="ei-field-group ei-field-group--full">
                                <label className="ei-label">
                                    <span className="ei-label-text">Adresse e-mail</span>
                                    <div className="ei-input-icon-wrap">
                                        <svg className="ei-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                            <polyline points="22,6 12,13 2,6" />
                                        </svg>
                                        <input
                                            className={`ei-input ei-input--with-icon${errors.email ? ' ei-input--error' : ''}`}
                                            type="email"
                                            value={form.email}
                                            onChange={handleChange('email')}
                                            placeholder="votre@email.com"
                                            autoComplete="email"
                                        />
                                    </div>
                                    {errors.email && <span className="ei-error-msg">{errors.email}</span>}
                                </label>
                            </div>

                            <div className="ei-actions">
                                <button
                                    type="submit"
                                    className={`ei-submit${loading ? ' ei-submit--loading' : ''}${saved ? ' ei-submit--saved' : ''}`}
                                    disabled={loading || saved}
                                >
                                    {saved ? (
                                        <>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                                                <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            Sauvegardé
                                        </>
                                    ) : loading ? (
                                        <>
                                            <span className="ei-spinner" />
                                            Enregistrement…
                                        </>
                                    ) : (
                                        <>
                                            Enregistrer
                                        </>
                                    )}
                                </button>
                                <button type="button" className="ei-cancel" onClick={() => window.history.back()}>
                                    Annuler
                                </button>
                            </div>
                        </form>
                    </section>
                </main>

                <footer>
                    <p>© 2025 findUp · <a href="#">Mentions légales</a> · <a href="#">Confidentialité</a></p>
                </footer>
            </div>
        </>
    )
}