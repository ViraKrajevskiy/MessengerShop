import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { apiGetProducts, apiGetBusinesses, CATEGORY_LABELS } from '../api/businessApi'
import { makeInitialAvatar } from '../utils/defaults'
import './CatalogPage.css'

const PROD_IMGS = [
  'https://picsum.photos/id/119/400/300',
  'https://picsum.photos/id/137/400/300',
  'https://picsum.photos/id/145/400/300',
  'https://picsum.photos/id/177/400/300',
  'https://picsum.photos/id/200/400/300',
]

// ── Tag pills ────────────────────────────────────────────────────────────────
function TagPills({ tags, onTagClick }) {
  if (!tags || tags.length === 0) return null
  return (
    <div className="cat-tags">
      {tags.map(t => (
        <span key={t} className="cat-tag" onClick={e => { e.stopPropagation(); onTagClick?.(t) }}>#{t}</span>
      ))}
    </div>
  )
}

// ── Product card ─────────────────────────────────────────────────────────────
function ProductCard({ product, onTagClick }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [saved, setSaved] = useState(false)

  const img      = product.image_display || PROD_IMGS[product.id % PROD_IMGS.length]
  const priceStr = product.price != null
    ? `${Number(product.price).toLocaleString('ru-RU')} ${product.currency_symbol || product.currency}`
    : 'Цена по запросу'

  return (
    <div className="cat-product">
      <div className="cat-product__img-wrap" onClick={() => navigate(`/product/${product.id}`)}>
        <img src={img} alt={product.name} loading="lazy" />
        <div
          className={`cat-product__save-btn ${saved ? 'cat-product__save-btn--active' : ''}`}
          onClick={e => { e.stopPropagation(); if (!user) { navigate('/login'); return }; setSaved(s => !s) }}
          title="В избранное"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={saved ? '#f59e0b' : 'none'} stroke={saved ? '#f59e0b' : '#fff'} strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
      </div>
      <div className="cat-product__body">
        <p className="cat-product__biz" onClick={e => { e.stopPropagation(); navigate(`/business/${product.business_id}`) }}>
          {product.business_name}
        </p>
        <h3 className="cat-product__name" onClick={() => navigate(`/product/${product.id}`)}>{product.name}</h3>
        <TagPills tags={product.tags} onTagClick={onTagClick} />
        <div className="cat-product__footer">
          <span className="cat-product__price">{priceStr}</span>
          <button className="cat-product__btn" onClick={() => navigate(`/product/${product.id}`)}>
            Подробнее
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Service row ──────────────────────────────────────────────────────────────
function ServiceCard({ product, onTagClick }) {
  const navigate = useNavigate()

  const priceStr = product.price != null
    ? `${Number(product.price).toLocaleString('ru-RU')} ${product.currency_symbol || product.currency}`
    : 'Цена по запросу'

  return (
    <div className="cat-service" onClick={() => navigate(`/product/${product.id}`)}>
      <div className="cat-service__icon">🔧</div>
      <div className="cat-service__info">
        <div className="cat-service__name">{product.name}</div>
        <div
          className="cat-service__biz"
          onClick={e => { e.stopPropagation(); navigate(`/business/${product.business_id}`) }}
        >
          {product.business_name}
        </div>
        <TagPills tags={product.tags} onTagClick={onTagClick} />
      </div>
      <div className="cat-service__price">{priceStr}</div>
    </div>
  )
}

// ── Business card ────────────────────────────────────────────────────────────
function BizCard({ biz }) {
  const navigate = useNavigate()
  const logo = biz.logo
    ? (biz.logo.startsWith('http') ? biz.logo : `https://api.101-school.uz${biz.logo}`)
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
    <div className="cat-product cat-skeleton">
      <div className="cat-skel-img" />
      <div className="cat-product__body">
        <div className="cat-skel-line" style={{width:'40%', height:10}} />
        <div className="cat-skel-line" style={{width:'70%', height:13, marginTop:6}} />
        <div className="cat-skel-line" style={{width:'30%', height:10, marginTop:8}} />
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'products',  label: '📦 Продукты'  },
  { key: 'services',  label: '🔧 Услуги'    },
  { key: 'companies', label: '🏢 Компании'  },
]

export default function CatalogPage() {
  const navigate  = useNavigate()
  const { user }  = useAuth()

  const [tab, setTab]           = useState('products')
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
    products.forEach(p => (p.tags || []).forEach(t => set.add(t)))
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
    (activeTags.length === 0 || activeTags.some(t => (p.tags || []).includes(t))) &&
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

  const toggleTag = (tag) => setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])

  const GUEST_LIMIT = 6

  return (
    <div className="cat-page">
      <Header />

      <main className="cat-page__main">
        {/* Hero */}
        <div className="cat-page__hero">
          <h1>Каталог</h1>
          <p>Товары, услуги и компании на одной странице</p>
        </div>

        {/* Tabs */}
        <div className="cat-page__tabs">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`cat-page__tab ${tab === t.key ? 'cat-page__tab--active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              <span className="cat-page__tab-count">
                {t.key === 'products'  ? fProducts.length
                 : t.key === 'services'  ? fServices.length
                 : fBiz.length}
              </span>
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
              placeholder={tab === 'companies' ? 'Поиск компании...' : 'Поиск...'}
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
              <span>✓</span> Проверенные
            </button>
            <button
              className={`cat-filter-chip cat-filter-chip--new ${filterNew ? 'cat-filter-chip--on' : ''}`}
              onClick={() => setFilterNew(v => !v)}
            >
              <span>●</span> Новые
            </button>

            <div className="cat-filters__sep" />

            <select className="cat-filters__select" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
              <option value="none">Сортировка</option>
              <option value="date_desc">Сначала новые</option>
              <option value="date_asc">Сначала старые</option>
              {tab !== 'companies' && <option value="price_asc">Цена: по возрастанию</option>}
              {tab !== 'companies' && <option value="price_desc">Цена: по убыванию</option>}
            </select>

            {allCities.length > 0 && (
              <select className="cat-filters__select" value={filterCity} onChange={e => setFilterCity(e.target.value)}>
                <option value="">Все города</option>
                {allCities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}

            {tab === 'companies' && (
              <select className="cat-filters__select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                <option value="">Все категории</option>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            )}

            {hasFilters && (
              <button className="cat-filter-chip cat-filter-chip--clear" onClick={clearFilters}>
                ✕ Сбросить
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
                    {showAllTags ? 'Свернуть' : `+${allTags.length - 8}`}
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
        {loading ? (
          <div className="cat-products-grid">
            {[0,1,2,3,4,5].map(i => <ProductSkeleton key={i} />)}
          </div>
        ) : (
          <>
            {/* ── Продукты ── */}
            {tab === 'products' && (
              <>
                {fProducts.length === 0 ? (
                  <div className="cat-empty">
                    <div className="cat-empty__icon">📦</div>
                    <p>{hasFilters ? 'По фильтрам ничего не найдено' : 'Продуктов пока нет'}</p>
                    {hasFilters && <button className="cat-empty__reset" onClick={clearFilters}>Сбросить фильтры</button>}
                  </div>
                ) : (
                  <>
                    <div className="cat-results-count">{fProducts.length} продукт{fProducts.length === 1 ? '' : fProducts.length < 5 ? 'а' : 'ов'}</div>
                    <div className="cat-products-grid">
                      {(user ? fProducts : fProducts.slice(0, GUEST_LIMIT)).map(p => (
                        <ProductCard key={p.id} product={p} onTagClick={toggleTag} />
                      ))}
                    </div>
                    {!user && fProducts.length > GUEST_LIMIT && (
                      <div className="cat-auth-gate">
                        <div className="cat-auth-gate__blur" />
                        <div className="cat-auth-gate__box">
                          <div className="cat-auth-gate__icon">🔒</div>
                          <p>Войдите, чтобы видеть все товары</p>
                          <button className="cat-auth-gate__btn" onClick={() => navigate('/login')}>Войти</button>
                          <button className="cat-auth-gate__reg" onClick={() => navigate('/register')}>Регистрация</button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* ── Услуги ── */}
            {tab === 'services' && (
              <>
                {fServices.length === 0 ? (
                  <div className="cat-empty">
                    <div className="cat-empty__icon">🔧</div>
                    <p>{hasFilters ? 'По фильтрам ничего не найдено' : 'Услуг пока нет'}</p>
                    {hasFilters && <button className="cat-empty__reset" onClick={clearFilters}>Сбросить фильтры</button>}
                  </div>
                ) : (
                  <>
                    <div className="cat-results-count">{fServices.length} услуг{fServices.length === 1 ? 'а' : fServices.length < 5 ? 'и' : ''}</div>
                    <div className="cat-services-list">
                      {(user ? fServices : fServices.slice(0, GUEST_LIMIT)).map(s => (
                        <ServiceCard key={s.id} product={s} onTagClick={toggleTag} />
                      ))}
                    </div>
                    {!user && fServices.length > GUEST_LIMIT && (
                      <div className="cat-auth-gate">
                        <div className="cat-auth-gate__blur" />
                        <div className="cat-auth-gate__box">
                          <div className="cat-auth-gate__icon">🔒</div>
                          <p>Войдите, чтобы видеть все услуги</p>
                          <button className="cat-auth-gate__btn" onClick={() => navigate('/login')}>Войти</button>
                          <button className="cat-auth-gate__reg" onClick={() => navigate('/register')}>Регистрация</button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* ── Компании ── */}
            {tab === 'companies' && (
              <>
                {fBiz.length === 0 ? (
                  <div className="cat-empty">
                    <div className="cat-empty__icon">🏢</div>
                    <p>{hasFilters ? 'По фильтрам ничего не найдено' : 'Компаний пока нет'}</p>
                    {hasFilters && <button className="cat-empty__reset" onClick={clearFilters}>Сбросить фильтры</button>}
                  </div>
                ) : (
                  <>
                    <div className="cat-results-count">{fBiz.length} компани{fBiz.length === 1 ? 'я' : fBiz.length < 5 ? 'и' : 'й'}</div>
                    <div className="cat-biz-grid">
                      {(user ? fBiz : fBiz.slice(0, GUEST_LIMIT)).map(b => (
                        <BizCard key={b.id} biz={b} />
                      ))}
                    </div>
                    {!user && fBiz.length > GUEST_LIMIT && (
                      <div className="cat-auth-gate">
                        <div className="cat-auth-gate__blur" />
                        <div className="cat-auth-gate__box">
                          <div className="cat-auth-gate__icon">🔒</div>
                          <p>Войдите, чтобы видеть все компании</p>
                          <button className="cat-auth-gate__btn" onClick={() => navigate('/login')}>Войти</button>
                          <button className="cat-auth-gate__reg" onClick={() => navigate('/register')}>Регистрация</button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
