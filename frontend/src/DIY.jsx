import { useState } from 'react'
import GlassSurface from './components/ui/GlassSurface'
import ProfilePanel from './ProfilePanel'
import './DIY.css'

const CATEGORIES = {
  plomberie: {
    label: 'Plomberie',
    products: [
      { id: 'p1', img: '/joint-torique.png',   name: 'Joint torique universel',     detail: 'Lot de 50 — assortiment NBR',              price: '4,90 €',  amazon: 'https://www.amazon.fr/s?k=joint+torique+plomberie',              lm: 'https://www.leroymerlin.fr/recherche=joint+torique' },
      { id: 'p2', img: '/teflon.png',           name: 'Ruban PTFE (téflon)',          detail: '12 m — étanchéité filetages',              price: '2,50 €',  amazon: 'https://www.amazon.fr/s?k=ruban+teflon+ptfe',                    lm: 'https://www.leroymerlin.fr/recherche=teflon' },
      { id: 'p3', img: '/pince-multiprise.png', name: 'Pince multiprise réglable',   detail: 'Serrage joints et raccords',               price: '12,90 €', amazon: 'https://www.amazon.fr/s?k=pince+multiprise',                     lm: 'https://www.leroymerlin.fr/recherche=pince+multiprise' },
      { id: 'p4', img: '/cle-molette.png',      name: 'Clé à molette 250 mm',        detail: 'Acier chromé, poignée bi-matière',         price: '9,90 €',  amazon: 'https://www.amazon.fr/s?k=cle+molette',                          lm: 'https://www.leroymerlin.fr/recherche=cle+molette' },
      { id: 'p5', img: '/raccord-rapide.png',   name: 'Raccord réparation rapide',   detail: 'Sans soudure — 15 ou 22 mm',              price: '6,50 €',  amazon: 'https://www.amazon.fr/s?k=raccord+reparation+rapide+plomberie',  lm: 'https://www.leroymerlin.fr/recherche=raccord+reparation' },
    ]
  },
  electricite: {
    label: 'Électricité',
    products: [
      { id: 'e1', img: '/testeur-tension.png',  name: 'Testeur de tension sans contact', detail: 'Détecte 12–1000V, sécurité max',      price: '14,90 €', amazon: 'https://www.amazon.fr/s?k=testeur+tension+sans+contact',      lm: 'https://www.leroymerlin.fr/recherche=testeur+tension' },
      { id: 'e2', img: '/tournevis-vde.png',    name: 'Tournevis isolés VDE',            detail: 'Jeu de 6 — testés 1000V',             price: '18,90 €', amazon: 'https://www.amazon.fr/s?k=tournevis+isoles+vde',             lm: 'https://www.leroymerlin.fr/recherche=tournevis+isoles' },
      { id: 'e3', img: '/dominos.png',          name: 'Dominos de connexion',            detail: 'Boîte 100 — fils 0.5–2.5 mm²',       price: '3,90 €',  amazon: 'https://www.amazon.fr/s?k=dominos+connexion+electrique',     lm: 'https://www.leroymerlin.fr/recherche=dominos+electrique' },
      { id: 'e4', img: '/disjoncteur.png',      name: 'Disjoncteur unipolaire 16A',      detail: 'Remplacement standard tableau',       price: '8,90 €',  amazon: 'https://www.amazon.fr/s?k=disjoncteur+16a',                  lm: 'https://www.leroymerlin.fr/recherche=disjoncteur+16a' },
      { id: 'e5', img: '/multimetre.png',       name: 'Multimètre numérique',            detail: 'Tension, courant, résistance',        price: '24,90 €', amazon: 'https://www.amazon.fr/s?k=multimetre+numerique',             lm: 'https://www.leroymerlin.fr/recherche=multimetre' },
    ]
  },
  peinture: {
    label: 'Peinture',
    products: [
      { id: 'pe1', img: '/peinture-blanche.png', name: 'Peinture murale blanc mat 2,5L', detail: 'Couverture 25 m² — sans odeur',       price: '22,90 €', amazon: 'https://www.amazon.fr/s?k=peinture+murale+blanche',          lm: 'https://www.leroymerlin.fr/recherche=peinture+blanche+mat' },
      { id: 'pe2', img: '/rouleau.png',          name: 'Rouleau microfibre + bac',       detail: '23 cm — finition lisse garantie',     price: '7,90 €',  amazon: 'https://www.amazon.fr/s?k=rouleau+peinture+microfibre',     lm: 'https://www.leroymerlin.fr/recherche=rouleau+peinture' },
      { id: 'pe3', img: '/enduit.png',           name: 'Enduit de rebouchage 1 kg',      detail: 'Séchage rapide, ponçable en 2h',     price: '6,90 €',  amazon: 'https://www.amazon.fr/s?k=enduit+rebouchage',               lm: 'https://www.leroymerlin.fr/recherche=enduit+rebouchage' },
      { id: 'pe4', img: '/ruban-masquage.png',   name: 'Ruban de masquage pro 50 m',     detail: 'Adhérence précise, sans résidu',     price: '4,50 €',  amazon: 'https://www.amazon.fr/s?k=ruban+masquage+peinture',         lm: 'https://www.leroymerlin.fr/recherche=ruban+masquage' },
      { id: 'pe5', img: '/spatule-inox.png',     name: 'Spatule inox flexible',          detail: 'Rebouchage et lissage enduit',       price: '3,90 €',  amazon: 'https://www.amazon.fr/s?k=spatule+peinture',                lm: 'https://www.leroymerlin.fr/recherche=spatule' },
    ]
  },
  carrelage: {
    label: 'Carrelage',
    products: [
      { id: 'c1', img: '/colle-carrelage.png',   name: 'Colle carrelage blanche 5 kg',  detail: 'Intérieur/extérieur, prise rapide',  price: '11,90 €', amazon: 'https://www.amazon.fr/s?k=colle+carrelage',                 lm: 'https://www.leroymerlin.fr/recherche=colle+carrelage' },
      { id: 'c2', img: '/joint-carrelage.png',   name: 'Joint carrelage gris 5 kg',     detail: 'Hydrofuge, résistant aux taches',   price: '13,90 €', amazon: 'https://www.amazon.fr/s?k=joint+carrelage',                 lm: 'https://www.leroymerlin.fr/recherche=joint+carrelage' },
      { id: 'c3', img: '/truelle.png',           name: 'Truelle dentelée 6 mm',         detail: 'Répartition uniforme de la colle',  price: '5,90 €',  amazon: 'https://www.amazon.fr/s?k=truelle+carrelage',               lm: 'https://www.leroymerlin.fr/recherche=truelle+carrelage' },
      { id: 'c4', img: '/croisillons.png',       name: 'Croisillons 2 mm',              detail: 'Sachet de 100 — joints réguliers',  price: '2,90 €',  amazon: 'https://www.amazon.fr/s?k=croisillons+carrelage',           lm: 'https://www.leroymerlin.fr/recherche=croisillons' },
      { id: 'c5', img: '/spatule-joint.png',     name: 'Spatule à joint mousse',        detail: 'Application propre et homogène',   price: '4,50 €',  amazon: 'https://www.amazon.fr/s?k=spatule+joint+carrelage',         lm: 'https://www.leroymerlin.fr/recherche=spatule+joint' },
    ]
  }
}

/* ── BOTTOM SHEET ── */
function StoreSheet({ product, onClose }) {
  if (!product) return null
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet-container">
        <div className="sheet-handle" />

        {/* Produit */}
        <div className="sheet-product-row">
          <div className="sheet-product-img">
            {product.img
              ? <img src={product.img} alt={product.name} />
              : <div className="sheet-product-img-placeholder" />
            }
          </div>
          <div className="sheet-product-info">
            <div className="sheet-product-name">{product.name}</div>
            <div className="sheet-product-detail">{product.detail}</div>
          </div>
          <div className="sheet-product-price">{product.price}</div>
        </div>

        <p className="sheet-label">Choisissez où acheter</p>

        {/* Cards stores */}
        <div className="sheet-stores">

          {/* Amazon */}
          <a
            href={product.amazon}
            target="_blank"
            rel="noopener noreferrer"
            className="sheet-store-card sheet-store-card--amazon"
          >
            <div className="sheet-store-logo-wrap sheet-store-logo-wrap--amazon">
              <img src="/Amazon.png" alt="Amazon" className="sheet-store-logo" />
            </div>
            <div className="sheet-store-info">
              <span className="sheet-store-name">Amazon</span>
              <span className="sheet-store-hint">Livraison rapide · Prime éligible</span>
            </div>
            <div className="sheet-store-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </a>

          {/* Leroy Merlin */}
          <a
            href={product.lm}
            target="_blank"
            rel="noopener noreferrer"
            className="sheet-store-card sheet-store-card--lm"
          >
            <div className="sheet-store-logo-wrap sheet-store-logo-wrap--lm">
              <img src="/Leroy-Merlin.png" alt="Leroy Merlin" className="sheet-store-logo" />
            </div>
            <div className="sheet-store-info">
              <span className="sheet-store-name">Leroy Merlin</span>
              <span className="sheet-store-hint">Retrait en magasin · Click & Collect</span>
            </div>
            <div className="sheet-store-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </a>
        </div>

        <button className="sheet-cancel" onClick={onClose}>Annuler</button>
      </div>
    </>
  )
}

/* ── PRODUCT CARD ── */
function ProductCard({ product, index, onSelect }) {
  return (
    <div
      className="diy-product-card"
      style={{ animationDelay: `${0.06 * index}s` }}
      onClick={() => onSelect(product)}
    >
      <div className="diy-product-row">
        <div className="diy-product-img">
          {product.img
            ? <img src={product.img} alt={product.name} />
            : <div className="diy-product-img-placeholder" />
          }
        </div>
        <div className="diy-product-text">
          <div className="diy-product-name">{product.name}</div>
          <div className="diy-product-detail">{product.detail}</div>
        </div>
        <div className="diy-product-price">{product.price}</div>
        <div className="diy-product-chevron">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="13" height="13">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  )
}

export default function DIY() {
  const params = new URLSearchParams(window.location.search)
  const catKey = params.get('cat') || 'plomberie'
  const q = params.get('q') || ''
  const category = CATEGORIES[catKey] || CATEGORIES.plomberie
  const [profileOpen, setProfileOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  return (
    <>
      <div className="bg-orbs">
        <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
      </div>
      <ProfilePanel isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
      <StoreSheet product={selectedProduct} onClose={() => setSelectedProduct(null)} />

      <div className="diy-page-layout">

        {/* NAV */}
        <nav>
          <GlassSurface width="100%" height={70} borderRadius={100} backgroundOpacity={0.21} blur={14} brightness={55} distortionScale={-60} className="nav-glass">
            <div className="nav-inner">
              <a href="/chat" className="nav-back" title="Retour à la discussion">
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

        <main className="diy-main">

          {/* HERO */}
          <section className="diy-hero">
            <h1 className="diy-hero-title">
              Réparez <span className="highlight">vous-même</span>
            </h1>
            <p className="diy-hero-sub">
              Notre IA a analysé votre problème et sélectionné exactement ce qu'il vous faut.
            </p>
            <div className="diy-fallback-row">
              <span className="diy-fallback-text">Trop complexe ?</span>
              <a href={`/results${q ? `?q=${encodeURIComponent(q)}` : ''}`} className="diy-fallback-link">
                Trouver un artisan
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="13" height="13">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </div>
          </section>

          {/* GUIDE TEASER */}
          <section className="diy-guide-section">
            <a href="/guide" className="diy-guide-teaser">
              <div className="diy-guide-teaser-text">
                <span className="diy-guide-teaser-hook">Vous voulez réparer sans risque d'erreur ?</span>
                <span className="diy-guide-teaser-sub">Voir le guide personnalisé</span>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="16" height="16" className="diy-guide-teaser-arrow">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </section>

          {/* PRODUITS */}
          <section className="diy-section">
            <div className="diy-products-header">
              <h2 className="diy-section-title">Ce qu'il vous faut</h2>
              <p className="diy-section-sub">
                Sélection pour <strong>{category.label}</strong> · {category.products.length} produits
              </p>
            </div>
            <div className="diy-products-grid">
              {category.products.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} onSelect={setSelectedProduct} />
              ))}
            </div>
          </section>

        </main>

        <footer>
          <p>© 2025 findUp · <a href="#">Mentions légales</a> · <a href="#">Confidentialité</a></p>
          <p className="diy-footer-affil">Liens affiliés — findUp perçoit une commission sur les achats.</p>
        </footer>

      </div>
    </>
  )
}