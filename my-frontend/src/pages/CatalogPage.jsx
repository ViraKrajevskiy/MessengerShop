import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { apiGetProducts, apiGetBusinesses, CATEGORY_LABELS } from '../api/businessApi'
import { makeInitialAvatar } from '../utils/defaults'
import { resolveUrl } from '../utils/urlUtils'
import '../components/UserCard.css'
import './CatalogPage.css'

// ── Tag pills ────────────────────────────────────────────────────────────────
function TagPills({ tags, onTagClick }) {
  if (!tags || tags.length === 0) return null
  return (
    <div className="cat-tags">
      {tags.map(tag => (
        <span key={tag} className="cat-tag" onClick={e => { e.stopPropagation(); onTagClick?.(tag) }}>#{tag}</span>
      ))}
    </div>
  )
}

// ── Service card — идентичная структура PostCard ──────────────────────────────
function ServiceCard({ product, onTagClick }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()
  const [fav, setFav] = useState(false)

  const image = product.image_display
    ? resolveUrl(product.image_display)
    : product.business_logo
      ? resolveUrl(product.business_logo)
      : makeInitialAvatar(product.name || product.business_name)

  const priceStr = product.price != null
    ? `${Number(product.price).toLocaleString('ru-RU')} ${product.currency_symbol || product.currency}`
    : t('catalog_priceOnReq')

  const toggleFav = e => {
    e.stopPropagation()
    if (!user) { navigate('/login'); return }
    setFav(v => !v)
  }

  return (
    <div className="user-card" onClick={() => navigate(`/product/${product.id}`)}>
      <div className="user-card__image">
        <img className="user-card__photo" src={image} alt={product.name} loading="lazy" width="400" height="530" />
        <span className="user-card__badge">{priceStr}</span>

        <div className="user-card__actions">
          <button
            className={`user-card__action-btn${fav ? ' user-card__action-btn--liked' : ''}`}
            onClick={toggleFav}
            title={fav ? 'Убрать из избранного' : 'В избранное'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
            </svg>
          </button>
          <button
            className="user-card__action-btn user-card__action-btn--msg"
            onClick={e => {
              e.stopPropagation()
              navigate(`/business/${product.business_id}`)
            }}
            title="Открыть бизнес"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="user-card__info">
        <span className="user-card__name">{product.name}</span>
        <span className="user-card__city">
          {product.business_name}
          {product.business_city ? ` · ${product.business_city}` : ''}
        </span>
        <TagPills tags={product.tags} onTagClick={onTagClick} />
      </div>
    </div>
  )
}

// ── Business card ────────────────────────────────────────────────────────────
function BizCard({ biz }) {
  const navigate = useNavigate()
  const logo = biz.logo
    ? resolveUrl(biz.logo)
    : makeInitialAvatar(biz.brand_name)

  return (
    <div className="cat-biz-card" onClick={() => navigate(`/business/${biz.id}`)}>
      <img className="cat-biz-card__logo" src={logo} alt={biz.brand_name} width="48" height="48" />
      <div className="cat-biz-card__info">
        <div className="cat-biz-card__name">
          {biz.brand_name}
          {biz.is_verified && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#2196f3" style={{marginLeft:4,verticalAlign:'middle',flexShrink:0}}>
              <path d="M12 2L9.19 4.09 5.5 3.82 4.41 7.41 1.42 9.72 2.83 13.21 1.42 16.71 4.41 19 5.5 22.59 9.19 22.32 12 24.41 14.81 22.32 18.5 22.59 19.59 19 22.58 16.71 21.17 13.21 22.58 9.72 19.59 7.41 18.5 3.82 14.81 4.09 12 2ZM10.09 16.72L7.29 13.91 8.71 12.5 10.09 13.88 15.34 8.63 16.76 10.05 10.09 16.72Z"/>
            </svg>
          )}
        </div>
        <div className="cat-biz-card__cat">{CATEGORY_LABELS[biz.category] || biz.category}</div>
        {biz.city && <div className="cat-biz-card__city">📍 {biz.city}</div>}
      </div>
      {biz.is_vip && <span className="cat-biz-card__vip">VIP</span>}
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function ProductSkeleton() {
  return (
    <div className="user-card">
      <div className="user-card__image">
        <div className="cat-skel-img" />
      </div>
      <div className="user-card__info">
        <div className="cat-skel-line" style={{ width: '70%', height: 13 }} />
        <div className="cat-skel-line" style={{ width: '40%', height: 10, marginTop: 6 }} />
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function CatalogPage() {
  const navigate  = useNavigate()
  const { t }     = useLanguage()

  const TABS = [
    { key: 'services',  label: `🔧 ${t('catalog_services')}` },
    { key: 'companies', label: `🏢 ${t('catalog_companies')}` },
  ]

  const [searchParams] = useSearchParams()
  const [tab, setTab]           = useState(() => searchParams.get('tab') || 'services')
  const [products, setProducts] = useState([])
  const [businesses, setBiz]    = useState([])
  const [loading, setLoading]   = useState(true)

  // Filters
  const [activeTags, setActiveTags]       = useState([])
  const [filterVip, setFilterVip]         = useState(false)
  const [filterVerified, setFilterVerified] = useState(false)
  const [filterNew, setFilterNew]         = useState(false)
  const [filterCity, setFilterCity]       = useState('')
  const [filterCat, setFilterCat]         = useState('')
  const [sortOrder, setSortOrder]         = useState('none')
  const [showAllTags, setShowAllTags]     = useState(false)
  const [search, setSearch]               = useState('')
  const [columns, setColumns]             = useState(4)

  useEffect(() => {
    Promise.all([apiGetProducts(), apiGetBusinesses()])
      .then(([p, b]) => {
        setProducts(Array.isArray(p) ? p : [])
        setBiz(Array.isArray(b) ? b : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Derived lists
  const allProducts = useMemo(() => products.filter(p => p.product_type !== 'SERVICE'), [products])
  const allServices = useMemo(() => products.filter(p => p.product_type === 'SERVICE'), [products])

  // All unique tags
  const allTags = useMemo(() => {
    const set = new Set()
    products.forEach(p => (p.tags || []).forEach(tg => set.add(tg)))
    return [...set].sort()
  }, [products])

  // All unique cities
  const allCities = useMemo(() => {
    const set = new Set()
    businesses.forEach(b => { if (b.city) set.add(b.city) })
    return [...set].sort()
  }, [businesses])

  // VIP / verified sets
  const vipBizIds      = useMemo(() => new Set(businesses.filter(b => b.is_vip).map(b => b.id)),      [businesses])
  const verifiedBizIds = useMemo(() => new Set(businesses.filter(b => b.is_verified).map(b => b.id)), [businesses])
  const bizCityMap     = useMemo(() => { const m = new Map(); businesses.forEach(b => m.set(b.id, b.city)); return m }, [businesses])

  const isNew = (item) => item.created_at && (Date.now() - new Date(item.created_at)) / 3600000 < 24

  const passesProductFilter = (p) =>
    (!search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.business_name?.toLowerCase().includes(search.toLowerCase())) &&
    (activeTags.length === 0 || activeTags.some(tg => (p.tags || []).includes(tg))) &&
    (!filterVip      || vipBizIds.has(p.business_id)) &&
    (!filterVerified || verifiedBizIds.has(p.business_id)) &&
    (!filterNew      || isNew(p)) &&
    (!filterCity     || bizCityMap.get(p.business_id) === filterCity)

  const passesBizFilter = (b) =>
    (!search || b.brand_name?.toLowerCase().includes(search.toLowerCase())) &&
    (!filterVip      || b.is_vip) &&
    (!filterVerified || b.is_verified) &&
    (!filterNew      || isNew(b)) &&
    (!filterCity     || b.city === filterCity) &&
    (!filterCat      || b.category === filterCat)

  const applySort = (arr) => {
    if (sortOrder === 'date_desc') return [...arr].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    if (sortOrder === 'date_asc')  return [...arr].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    if (sortOrder === 'price_asc') return [...arr].sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0))
    if (sortOrder === 'price_desc') return [...arr].sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0))
    return arr
  }

  const fProducts  = applySort(allProducts.filter(passesProductFilter))
  const fServices  = applySort(allServices.filter(passesProductFilter))
  const fBiz       = businesses.filter(passesBizFilter)

  const hasFilters = activeTags.length > 0 || filterVip || filterVerified || filterNew || filterCity || filterCat || sortOrder !== 'none' || search

  const clearFilters = () => {
    setActiveTags([]); setFilterVip(false); setFilterVerified(false)
    setFilterNew(false); setFilterCity(''); setFilterCat(''); setSortOrder('none'); setSearch('')
  }

  const toggleTag = (tag) => setActiveTags(prev => prev.includes(tag) ? prev.filter(tg => tg !== tag) : [...prev, tag])

  const handleColumnsChange = (col) => {
    setColumns(col)
  }

  return (
    <div className="cat-page">
      <Header />

      <main className="cat-page__main">
        {/* Hero */}
        <div className="cat-page__hero">
          <h1>{t('catalog_title')}</h1>
          <p>{t('catalog_sub')}</p>
        </div>

        {/* Tabs */}
        <div className="cat-page__tabs">
          {TABS.map(tb => (
            <button
              key={tb.key}
              className={`cat-page__tab ${tab === tb.key ? 'cat-page__tab--active' : ''}`}
              onClick={() => setTab(tb.key)}
            >
              {tb.label}
              <span className="cat-page__tab-count">
                {tb.key === 'services' ? fServices.length : fBiz.length}
              </span>
            </button>
          ))}
        </div>

        {/* Grid columns selector */}
        <div className="cat-grid-selector">
          <span className="cat-grid-selector__label">{t('grid_columns')}</span>
          {[2, 3, 4, 5].map(col => (
            <button
              key={col}
              className={`cat-grid-selector__btn ${columns === col ? 'cat-grid-selector__btn--active' : ''}`}
              onClick={() => handleColumnsChange(col)}
              title={t('grid_columnsTitle').replace('{{col}}', col)}
            >
              {col}
            </button>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="cat-filters">
          {/* Search */}
          <div className="cat-filters__search-wrap">
            <svg className="cat-filters__search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="cat-filters__search"
              type="text"
              placeholder={tab === 'companies' ? t('catalog_searchBiz') : t('catalog_search')}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="cat-filters__search-clear" onClick={() => setSearch('')}>✕</button>
            )}
          </div>

          {/* Chips row */}
          <div className="cat-filters__row">
            <button
              className={`cat-filter-chip cat-filter-chip--vip ${filterVip ? 'cat-filter-chip--on' : ''}`}
              onClick={() => setFilterVip(v => !v)}
            >
              <span>⭐</span> VIP
            </button>
            <button
              className={`cat-filter-chip cat-filter-chip--verified ${filterVerified ? 'cat-filter-chip--on' : ''}`}
              onClick={() => setFilterVerified(v => !v)}
            >
              <span>✓</span> {t('catalog_verified')}
            </button>
            <button
              className={`cat-filter-chip cat-filter-chip--new ${filterNew ? 'cat-filter-chip--on' : ''}`}
              onClick={() => setFilterNew(v => !v)}
            >
              <span>●</span> {t('catalog_new')}
            </button>

            <div className="cat-filters__sep" />

            <select className="cat-filters__select" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
              <option value="none">{t('catalog_sort')}</option>
              <option value="date_desc">{t('catalog_newest')}</option>
              <option value="date_asc">{t('catalog_oldest')}</option>
              {tab !== 'companies' && <option value="price_asc">{t('catalog_priceAsc')}</option>}
              {tab !== 'companies' && <option value="price_desc">{t('catalog_priceDesc')}</option>}
            </select>

            {allCities.length > 0 && (
              <select className="cat-filters__select" value={filterCity} onChange={e => setFilterCity(e.target.value)}>
                <option value=""></option>
                {allCities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}

            {tab === 'companies' && (
              <select className="cat-filters__select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                <option value=""></option>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            )}

            {hasFilters && (
              <button className="cat-filter-chip cat-filter-chip--clear" onClick={clearFilters}>
                ✕
              </button>
            )}
          </div>

          {/* Tags (only for products/services) */}
          {tab !== 'companies' && allTags.length > 0 && (
            <div className="cat-filters__tags">
              <div className="cat-filters__tags-list">
                {(showAllTags ? allTags : allTags.slice(0, 8)).map(tag => (
                  <button
                    key={tag}
                    className={`cat-filter-chip cat-filter-chip--tag ${activeTags.includes(tag) ? 'cat-filter-chip--on' : ''}`}
                    onClick={() => toggleTag(tag)}
                  >
                    #{tag}
                  </button>
                ))}
                {allTags.length > 8 && (
                  <button className="cat-filter-chip cat-filter-chip--more" onClick={() => setShowAllTags(v => !v)}>
                    {showAllTags ? '−' : `+${allTags.length - 8}`}
                  </button>
                )}
              </div>
              {activeTags.length > 0 && (
                <div className="cat-filters__active-tags">
                  {activeTags.map(tag => (
                    <span key={tag} className="cat-active-tag" onClick={() => toggleTag(tag)}>
                      #{tag} <span>✕</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="cat-page__layout">
          <div className="cat-page__content">
            {loading ? (
              <div className="card-grid card-grid--4">
                {[0,1,2,3,4,5,6,7].map(i => <ProductSkeleton key={i} />)}
              </div>
            ) : (
              <>
                {/* ── Services ── */}
                {tab === 'services' && (
                  <>
                    {fServices.length === 0 ? (
                      <div className="cat-empty">
                        <div className="cat-empty__icon">🔧</div>
                        <p>{hasFilters ? t('nothing_found') : t('catalog_services')}</p>
                        {hasFilters && <button className="cat-empty__reset" onClick={clearFilters}>{t('reset_filters')}</button>}
                      </div>
                    ) : (
                      <>
                        <div className="cat-results-count">{fServices.length}</div>
                        <div className="card-grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                          {fServices.map(s => (
                            <ServiceCard key={s.id} product={s} onTagClick={toggleTag} />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* ── Companies ── */}
                {tab === 'companies' && (
                  <>
                    {fBiz.length === 0 ? (
                      <div className="cat-empty">
                        <div className="cat-empty__icon">🏢</div>
                        <p>{t('catalog_companies')}</p>
                        {hasFilters && <button className="cat-empty__reset" onClick={clearFilters}></button>}
                      </div>
                    ) : (
                      <>
                        <div className="cat-results-count">{fBiz.length}</div>
                        <div className="cat-biz-grid">
                          {fBiz.map(b => (
                            <BizCard key={b.id} biz={b} />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
