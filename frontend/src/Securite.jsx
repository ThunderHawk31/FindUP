import { useState } from 'react'
import GlassSurface from './components/ui/GlassSurface'
import { supabase } from './supabaseClient'
import useAuth from './hooks/useAuth'
import './Securite.css'

const API_URL = import.meta.env.VITE_API_URL || 'https://alert-cat-production.up.railway.app'

function PasswordStrength({ password }) {
    const checks = [
        { label: '8 caractères minimum', ok: password.length >= 8 },
        { label: 'Une majuscule', ok: /[A-Z]/.test(password) },
        { label: 'Un chiffre', ok: /[0-9]/.test(password) },
        { label: 'Un caractère spécial', ok: /[^A-Za-z0-9]/.test(password) },
    ]
    const score = checks.filter(c => c.ok).length
    const levels = ['', 'Faible', 'Moyen', 'Bon', 'Excellent']
    const colors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#16a34a']

    if (!password) return null

    return (
        <div className="sec-strength">
            <div className="sec-strength-bars">
                {[1, 2, 3, 4].map(i => (
                    <div
                        key={i}
                        className="sec-strength-bar"
                        style={{ background: i <= score ? colors[score] : 'rgba(0,0,0,.1)' }}
                    />
                ))}
            </div>
            <span className="sec-strength-label" style={{ color: colors[score] }}>{levels[score]}</span>
            <div className="sec-strength-checks">
                {checks.map(c => (
                    <span key={c.label} className={`sec-check${c.ok ? ' sec-check--ok' : ''}`}>
                        {c.ok ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="11" height="11">
                                <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="11" height="11">
                                <circle cx="12" cy="12" r="10" />
                            </svg>
                        )}
                        {c.label}
                    </span>
                ))}
            </div>
        </div>
    )
}

function PasswordField({ label, value, onChange, placeholder, error }) {
    const [show, setShow] = useState(false)
    return (
        <label className="sec-label">
            <span className="sec-label-text">{label}</span>
            <div className="sec-input-wrap">
                <svg className="sec-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                    className={`sec-input${error ? ' sec-input--error' : ''}`}
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    autoComplete="new-password"
                />
                <button type="button" className="sec-eye-btn" onClick={() => setShow(s => !s)} tabIndex={-1}>
                    {show ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="17" height="17">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="17" height="17">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                    )}
                </button>
            </div>
            {error && <span className="sec-error-msg">{error}</span>}
        </label>
    )
}

export default function Securite() {
    const { user, logout, getToken } = useAuth()
    const [form, setForm] = useState({ current: '', newPwd: '', confirm: '' })
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const [saved, setSaved] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)

    const setField = field => val => {
        setForm(f => ({ ...f, [field]: val }))
        if (errors[field]) setErrors(e => ({ ...e, [field]: null }))
    }

    const validate = () => {
        const e = {}
        if (!form.current) e.current = 'Mot de passe actuel requis'
        if (!form.newPwd) e.newPwd = 'Nouveau mot de passe requis'
        else if (form.newPwd.length < 8) e.newPwd = '8 caractères minimum'
        if (!form.confirm) e.confirm = 'Confirmation requise'
        else if (form.newPwd !== form.confirm) e.confirm = 'Les mots de passe ne correspondent pas'
        return e
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const errs = validate()
        if (Object.keys(errs).length) { setErrors(errs); return }
        setLoading(true)
        try {
            const { error } = await supabase.auth.updateUser({ password: form.newPwd })
            if (error) throw error
            setSaved(true)
            setForm({ current: '', newPwd: '', confirm: '' })
            setTimeout(() => setSaved(false), 3500)
        } catch (err) {
            setErrors({ current: err.message || 'Erreur lors du changement' })
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteAccount = async () => {
        try {
            const token = await getToken()
            await fetch(`${API_URL}/api/auth/account`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
                credentials: 'include'
            })
            await logout()
        } catch (err) {
            console.error('Erreur suppression compte:', err)
        }
    }

    return (
        <>
            <div className="bg-orbs">
                <div className="orb orb-1" />
                <div className="orb orb-2" />
                <div className="orb orb-3" />
            </div>

            <div className="sec-page-layout">
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
                                    <span className="avatar-initials">{user?.initials}</span>
                                </button>
                            </div>
                        </div>
                    </GlassSurface>
                </nav>

                <main className="sec-main">
                    <section className="sec-hero">
                        <h1 className="sec-title">
                            <span className="split-line">Sécurité &</span>
                            <span className="split-line highlight">mot de passe</span>
                        </h1>
                        <p className="sec-sub">Protégez votre compte findUp</p>
                    </section>

                    {/* Mot de passe */}
                    <section className="sec-card">
                        <div className="sec-card-header">
                            <div className="sec-card-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            </div>
                            <div>
                                <div className="sec-card-title">Changer le mot de passe</div>
                                <div className="sec-card-desc">Choisissez un mot de passe fort et unique</div>
                            </div>
                        </div>

                        {saved && (
                            <div className="sec-success-banner">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                                    <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Mot de passe mis à jour avec succès
                            </div>
                        )}

                        <form className="sec-form" onSubmit={handleSubmit} noValidate>
                            <PasswordField
                                label="Mot de passe actuel"
                                value={form.current}
                                onChange={setField('current')}
                                placeholder="••••••••"
                                error={errors.current}
                            />
                            <PasswordField
                                label="Nouveau mot de passe"
                                value={form.newPwd}
                                onChange={setField('newPwd')}
                                placeholder="••••••••"
                                error={errors.newPwd}
                            />
                            <PasswordStrength password={form.newPwd} />
                            <PasswordField
                                label="Confirmer le nouveau mot de passe"
                                value={form.confirm}
                                onChange={setField('confirm')}
                                placeholder="••••••••"
                                error={errors.confirm}
                            />

                            <div className="sec-actions">
                                <button
                                    type="submit"
                                    className={`sec-submit${loading ? ' sec-submit--loading' : ''}`}
                                    disabled={loading || saved}
                                >
                                    {loading ? (
                                        <><span className="sec-spinner" />Mise à jour…</>
                                    ) : (
                                        <>
                                            Mettre à jour
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </section>

                    {/* Zone danger */}
                    <section className="sec-card sec-card--danger">
                        <div className="sec-danger-content">
                            <div className="sec-danger-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="22" height="22">
                                    <polyline points="3 6 5 6 21 6" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M10 11v6M14 11v6" strokeLinecap="round" />
                                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div className="sec-danger-text">
                                <span className="sec-danger-title">Supprimer le compte</span>
                                <span className="sec-danger-desc">Action irréversible — toutes vos données seront effacées</span>
                            </div>
                        </div>

                        {!confirmDelete ? (
                            <button
                                className="sec-delete-btn"
                                onClick={() => setConfirmDelete(true)}
                            >
                                Continuer
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="13" height="13">
                                    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        ) : (
                            <div className="sec-danger-confirm">
                                <p className="sec-danger-confirm-text">
                                    Êtes-vous sûr ? Cette action est définitive.
                                </p>
                                <div className="sec-danger-confirm-actions">
                                    <button
                                        className="sec-delete-btn sec-delete-btn--confirm"
                                        onClick={handleDeleteAccount}
                                    >
                                        Oui, supprimer
                                    </button>
                                    <button
                                        className="sec-delete-btn sec-delete-btn--cancel"
                                        onClick={() => setConfirmDelete(false)}
                                    >
                                        Annuler
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>
                </main>

                <footer>
                    <p>© 2025 findUp · <a href="#">Mentions légales</a> · <a href="#">Confidentialité</a></p>
                </footer>
            </div>
        </>
    )
}