export default function ResumeModal({ onResume, onNew }) {
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(7,16,31,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
        }}>
            <div style={{
                background: 'rgba(245,244,240,0.97)',
                border: '1px solid rgba(255,255,255,0.9)',
                borderRadius: '24px', padding: '28px 24px',
                maxWidth: '360px', width: '100%', textAlign: 'center',
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
            }}>
                <div style={{
                    width: '48px', height: '48px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--blue), var(--navy-mid))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px', fontSize: '1.2rem', color: 'white'
                }}>✦</div>

                <p style={{
                    fontFamily: 'Sora, sans-serif', fontWeight: 800,
                    fontSize: '1.1rem', color: 'var(--navy)', marginBottom: '8px'
                }}>
                    Conversation en cours
                </p>
                <p style={{
                    fontSize: '.88rem', color: 'var(--muted)',
                    lineHeight: 1.6, marginBottom: '24px'
                }}>
                    Tu as une discussion non terminée.<br />Veux-tu la reprendre ?
                </p>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={onNew} style={{
                        flex: 1, padding: '11px 16px', borderRadius: '12px',
                        border: '1px solid rgba(0,0,0,0.1)',
                        background: 'transparent', color: 'var(--muted)',
                        fontFamily: 'DM Sans, sans-serif', fontSize: '.88rem',
                        cursor: 'pointer', transition: 'all .2s'
                    }}>
                        Nouvelle
                    </button>
                    <button onClick={onResume} style={{
                        flex: 1, padding: '11px 16px', borderRadius: '12px',
                        border: 'none', background: 'var(--navy)', color: 'white',
                        fontFamily: 'Sora, sans-serif', fontSize: '.88rem',
                        fontWeight: 600, cursor: 'pointer', transition: 'all .2s',
                        boxShadow: '0 2px 12px rgba(7,16,31,0.2)'
                    }}>
                        Reprendre ✦
                    </button>
                </div>
            </div>
        </div>
    )
}