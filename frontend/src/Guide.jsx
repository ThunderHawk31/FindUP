import { useState, useEffect, useRef } from 'react'
import GlassSurface from './components/ui/GlassSurface'
import ProfilePanel from './ProfilePanel'
import './Guide.css'

const GUIDE_DATA = {
  title: 'Réparer une fuite sous évier',
  steps: [
    {
      num: 1,
      tag: 'Matériel',
      title: 'Ce qu\'il vous faut',
      body: 'Avant de commencer, rassemblez tout le matériel nécessaire : un joint torique de remplacement (Ø adapté à votre siphon), du ruban PTFE, une pince multiprise, un seau et un chiffon sec. Avoir tout à portée de main évite les allers-retours et réduit le temps d\'intervention.',
      tip: 'Vérifiez le diamètre de votre joint actuel avant d\'acheter. La taille est souvent marquée sur le joint ou dans la notice du siphon.',
      confirm: 'J\'ai tout le matériel devant moi.',
      free: true,
    },
    {
      num: 2,
      tag: 'Mise en place',
      title: 'Préparez la zone de travail',
      body: 'Videz le meuble sous l\'évier. Placez un seau directement sous le siphon pour récupérer l\'eau résiduelle. Coupez l\'alimentation en eau en tournant le robinet d\'arrêt dans le sens des aiguilles d\'une montre. Ouvrez un robinet pour vider la pression dans le circuit.',
      tip: 'Si le robinet d\'arrêt local est dur ou introuvable, coupez directement au compteur général.',
      confirm: 'Le seau est en place et l\'eau est coupée.',
      free: true,
    },
    {
      num: 3,
      tag: 'Première étape',
      title: 'Démontez le siphon',
      body: 'Dévissez le bouchon de vidange en bas du siphon à la main, puis récupérez l\'eau restante dans le seau. Dévissez ensuite les deux écrous de raccordement — celui côté lavabo et celui côté évacuation. Retirez délicatement le siphon. Prenez une photo avant de démonter pour faciliter le remontage.',
      tip: 'Ne forcez pas avec un outil sur les raccords plastique — la main suffit, quitte à utiliser un chiffon pour le grip.',
      confirm: 'Le siphon est démonté et posé de côté.',
      free: true,
    },
    {
      num: 4,
      tag: 'Remplacement',
      title: 'Changez le joint défaillant',
      body: 'Examinez le joint torique dans la rainure du raccord. S\'il est aplati, fissuré ou déformé, retirez-le. Insérez le nouveau joint bien centré dans la rainure. Appliquez une légère couche de graisse silicone pour améliorer l\'étanchéité et faciliter le démontage futur.',
      tip: null,
      confirm: 'Le nouveau joint est en place.',
      free: false,
    },
    {
      num: 5,
      tag: 'Remontage',
      title: 'Remontez et serrez correctement',
      body: 'Revissez les raccords à la main d\'abord dans le bon ordre (consultez votre photo). Serrez ensuite d\'un quart de tour avec la pince — jamais plus. Sur les filetages métalliques, ajoutez 3–4 tours de ruban PTFE dans le sens du filetage avant de visser.',
      tip: 'Sur-serrer est la première cause de fissure des raccords plastique. La main + un quart de tour suffit.',
      confirm: 'Tout est remonté et serré sans forcer.',
      free: false,
    },
    {
      num: 6,
      tag: 'Test',
      title: 'Testez l\'étanchéité',
      body: 'Essuyez tout à sec avec un chiffon. Rouvrez l\'eau progressivement. Observez chaque raccord pendant 2 minutes sans bouger. Si une goutte apparaît, serrez légèrement. Si la fuite persiste, démontez et vérifiez le positionnement du joint.',
      tip: null,
      confirm: 'Aucune fuite après 2 minutes — réparation réussie.',
      free: false,
    },
  ]
}

const FREE_COUNT = 3

function useStreamingGuide() {
  const [phase, setPhase] = useState('idle')
  const [visibleSteps, setVisibleSteps] = useState(0)
  const timerRef = useRef(null)

  const generate = () => {
    setPhase('generating')
    setVisibleSteps(0)
    let count = 0
    const revealNext = () => {
      count++
      setVisibleSteps(count)
      if (count < FREE_COUNT) {
        timerRef.current = setTimeout(revealNext, 1000)
      } else {
        setTimeout(() => setPhase('done'), 500)
      }
    }
    timerRef.current = setTimeout(revealNext, 800)
  }

  const retry = () => { clearTimeout(timerRef.current); generate() }
  useEffect(() => () => clearTimeout(timerRef.current), [])
  return { phase, visibleSteps, generate, retry }
}

function StepConfirm({ label, checked, onChange }) {
  return (
    <button
      className={`step-confirm${checked ? ' step-confirm--checked' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="step-confirm-check">
        {checked && (
          <svg viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.2" width="11" height="11">
            <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </span>
      <span className="step-confirm-label">{label}</span>
    </button>
  )
}

function StepCard({ step, index, visible }) {
  const [confirmed, setConfirmed] = useState(false)
  return (
    <div className={`guide-step${visible ? ' guide-step--visible' : ''}`} style={{'--step-delay': `${index * 0.07}s`}}>
      <div className="guide-step-left">
        <div className={`guide-step-num${confirmed ? ' guide-step-num--done' : ''}`}>
          {confirmed
            ? <svg viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.2" width="12" height="12"><path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            : step.num}
        </div>
        <div className="guide-step-line" />
      </div>
      <div className="guide-step-body">
        <span className="guide-step-tag">{step.tag}</span>
        <h3 className="guide-step-title">{step.title}</h3>
        <div className="guide-step-img">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" width="24" height="24" opacity=".2">
            <rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="M21 15l-5-5L5 21"/>
          </svg>
        </div>
        <p className="guide-step-text">{step.body}</p>
        {step.tip && (
          <div className="guide-step-tip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13" style={{flexShrink:0,marginTop:1}}>
              <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
            </svg>
            {step.tip}
          </div>
        )}
        <StepConfirm label={step.confirm} checked={confirmed} onChange={setConfirmed} />
      </div>
    </div>
  )
}

export default function Guide() {
  const [profileOpen, setProfileOpen] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const { phase, visibleSteps, generate, retry } = useStreamingGuide()
  const freeSteps = GUIDE_DATA.steps.slice(0, FREE_COUNT)
  const paidSteps = GUIDE_DATA.steps.slice(FREE_COUNT)

  return (
    <>
      <div className="bg-orbs">
        <div className="orb orb-1"/><div className="orb orb-2"/><div className="orb orb-3"/>
      </div>
      <ProfilePanel isOpen={profileOpen} onClose={() => setProfileOpen(false)} />

      <div className="guide-page-layout">
        <nav>
          <GlassSurface width="100%" height={70} borderRadius={100} backgroundOpacity={0.21} blur={14} brightness={55} distortionScale={-60} className="nav-glass">
            <div className="nav-inner">
              <a href="/diy" className="nav-back" title="Retour">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="15" height="15">
                  <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
              <div className="nav-actions">
                <a href="/login" className="btn-ghost">Se connecter</a>
                <button className="avatar-btn" onClick={() => setProfileOpen(true)}>
                  <svg viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                </button>
              </div>
            </div>
          </GlassSurface>
        </nav>

        <main className="guide-main">

          {/* HERO */}
          <section className="guide-hero">
            <h1 className="guide-hero-title">
              Réparez <span className="highlight">vous-même</span>
            </h1>
          </section>

          {/* IDLE — carte génération iOS */}
          {phase === 'idle' && (
            <section className="guide-generate-section">
              <div className="guide-generate-card">

                <div className="guide-gen-text">
                  <div className="guide-gen-title">Guide prêt à générer</div>
                  <div className="guide-gen-sub">Notre IA va analyser votre problème et générer un guide de réparation étape par étape, illustré et adapté à votre situation exacte.</div>
                </div>

                <button className="guide-gen-btn" onClick={generate}>
                  <span>Générer le guide</span>
                  <div className="guide-gen-btn-arrow">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </button>
              </div>
            </section>
          )}

          {/* GENERATING / DONE */}
          {(phase === 'generating' || phase === 'done') && (
            <section className="guide-steps-section">

              {freeSteps.map((step, i) => (
                <StepCard key={step.num} step={step} index={i} visible={i < visibleSteps} />
              ))}

              {/* Loader streaming */}
              {phase === 'generating' && visibleSteps < FREE_COUNT && (
                <div className="guide-step-loading">
                  <div className="guide-loading-dots"><span/><span/><span/></div>
                  <span className="guide-loading-text">Génération en cours…</span>
                </div>
              )}

              {/* PAYWALL — iOS sheet, pas de preview floutée */}
              {phase === 'done' && !unlocked && (
                <div className="guide-paywall">
                  <div className="guide-ios-sheet">
                    <div className="guide-ios-handle"/>
                    <h3 className="guide-ios-title">{paidSteps.length} étapes restantes</h3>
                    <p className="guide-ios-sub">
                      Débloquez le guide complet pour finaliser la réparation.
                    </p>
                    <div className="guide-ios-price-row">
                      <span className="guide-ios-price">2,99 €</span>
                      <span className="guide-ios-price-label">accès permanent</span>
                    </div>
                    <button className="guide-ios-btn" onClick={() => setUnlocked(true)}>
                      Débloquer maintenant
                    </button>
                    <p className="guide-ios-legal">Paiement sécurisé · Accès immédiat</p>
                  </div>
                </div>
              )}

              {/* Étapes débloquées */}
              {phase === 'done' && unlocked && paidSteps.map((step, i) => (
                <StepCard key={step.num} step={step} index={FREE_COUNT + i} visible={true} />
              ))}

            </section>
          )}

          {/* ERREUR */}
          {phase === 'error' && (
            <section className="guide-error">
              <div className="guide-error-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                </svg>
              </div>
              <p className="guide-error-text">Une erreur est survenue lors de la génération.</p>
              <button className="guide-error-retry" onClick={retry}>Réessayer</button>
            </section>
          )}

        </main>

        <footer>
          <p>© 2025 findUp · <a href="#">Mentions légales</a> · <a href="#">Confidentialité</a></p>
        </footer>
      </div>
    </>
  )
}