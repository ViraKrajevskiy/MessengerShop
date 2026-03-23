import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Header from '../components/Header'
import ReviewsSection from '../components/ReviewsSection'
import { apiGetBusiness, apiGetBusinessPosts, apiGetBusinesses, apiToggleSubscription, apiJoinGroup, apiCheckGroupMembership } from '../api/businessApi'
import './BusinessPage.css'

const CATEGORY_ICONS = {
  BEAUTY: '\u{1f485}', HEALTH: '\u{1fa7a}', REALTY: '\u{1f3e0}', EDUCATION: '\u{1f4da}',
  FINANCE: '\u{1f4bc}', LEGAL: '\u2696\ufe0f', TOURISM: '\u2708\ufe0f', FOOD: '\u{1f37d}\ufe0f',
  TRANSPORT: '\u{1f697}', OTHER: '\u{1f3e2}',
}

const FALLBACK_LOGO  = 'https://picsum.photos/id/1027/200/200'
const FALLBACK_COVER = 'https://picsum.photos/id/1074/1200/400'

const API_BASE = import.meta.env.PROD
  ? 'https://api.101-school.uz'
  : 'http://127.0.0.1:8000'

function resolveUrl(url) {
  if (!url) return null
  if (url.startsWith('http')) return url
  return `${API_BASE}${url}`
}

/* ── Section tabs for scrolling ── */
const SECTION_TABS = [
  { id: 'about', label: '\u041e \u043d\u0430\u0441' },
  { id: 'gallery', label: '\u0424\u043e\u0442\u043e/\u0412\u0438\u0434\u0435\u043e' },
  { id: 'reviews', label: '\u041e\u0442\u0437\u044b\u0432\u044b' },
  { id: 'posts', label: '\u041f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u0438' },
  { id: 'faq', label: '\u041f\u043e\u043c\u043e\u0449\u044c' },
]

function Gallery({ posts }) {
  const [tab, setTab] = useState('all')
  const images = posts.filter(p => p.media_display && p.media_type !== 'VIDEO')
  const videos = posts.filter(p => p.media_display && p.media_type === 'VIDEO')
  const all    = posts.filter(p => p.media_display)
  const items = tab === 'video' ? videos : tab === 'photo' ? images : all
  if (all.length === 0) return null

  return (
    <section className="bp__card" id="section-gallery">
      <div className="bp__card-head">
        <h2 className="bp__card-title">{'\u0424\u043e\u0442\u043e \u0438 \u0432\u0438\u0434\u0435\u043e'}</h2>
        <div className="bp__gallery-tabs">
          <button className={`bp__tab ${tab === 'all' ? 'bp__tab--on' : ''}`} onClick={() => setTab('all')}>{'\u0412\u0441\u0435'}</button>
          {images.length > 0 && <button className={`bp__tab ${tab === 'photo' ? 'bp__tab--on' : ''}`} onClick={() => setTab('photo')}>{'\u0424\u043e\u0442\u043e'}</button>}
          {videos.length > 0 && <button className={`bp__tab ${tab === 'video' ? 'bp__tab--on' : ''}`} onClick={() => setTab('video')}>{'\u0412\u0438\u0434\u0435\u043e'}</button>}
        </div>
      </div>
      <div className="bp__gallery">
        {items.map(p => (
          <div key={p.id} className="bp__gallery-cell">
            <img src={p.media_display} alt="" loading="lazy" />
            {p.media_type === 'VIDEO' && <div className="bp__play">{'\u25b6'}</div>}
          </div>
        ))}
      </div>
    </section>
  )
}

function FAQSection({ biz }) {
  const [openIdx, setOpenIdx] = useState(null)
  const faqs = [
    { q: `\u041a\u0430\u043a \u0441\u0432\u044f\u0437\u0430\u0442\u044c\u0441\u044f \u0441 ${biz.brand_name}?`, a: biz.phone ? `\u041f\u043e\u0437\u0432\u043e\u043d\u0438\u0442\u0435 \u043f\u043e \u043d\u043e\u043c\u0435\u0440\u0443 ${biz.phone} \u0438\u043b\u0438 \u043d\u0430\u043f\u0438\u0448\u0438\u0442\u0435 \u0432 \u0447\u0430\u0442.` : '\u041d\u0430\u043f\u0438\u0448\u0438\u0442\u0435 \u0432 \u0447\u0430\u0442 \u043d\u0430 \u043f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u0435.' },
    { q: '\u041a\u0430\u043a\u043e\u0432\u0430 \u0441\u0442\u043e\u0438\u043c\u043e\u0441\u0442\u044c \u0434\u043e\u0441\u0442\u0430\u0432\u043a\u0438?', a: '\u0421\u0442\u043e\u0438\u043c\u043e\u0441\u0442\u044c \u0434\u043e\u0441\u0442\u0430\u0432\u043a\u0438 \u0437\u0430\u0432\u0438\u0441\u0438\u0442 \u043e\u0442 \u0440\u0430\u0441\u0441\u0442\u043e\u044f\u043d\u0438\u044f \u0438 \u043e\u0431\u044a\u0451\u043c\u0430 \u0437\u0430\u043a\u0430\u0437\u0430. \u0423\u0442\u043e\u0447\u043d\u044f\u0439\u0442\u0435 \u0443 \u043f\u0440\u043e\u0434\u0430\u0432\u0446\u0430.' },
    { q: '\u041c\u043e\u0436\u043d\u043e \u043b\u0438 \u0432\u0435\u0440\u043d\u0443\u0442\u044c \u0442\u043e\u0432\u0430\u0440?', a: '\u0423\u0441\u043b\u043e\u0432\u0438\u044f \u0432\u043e\u0437\u0432\u0440\u0430\u0442\u0430 \u0443\u0442\u043e\u0447\u043d\u044f\u0439\u0442\u0435 \u043d\u0430\u043f\u0440\u044f\u043c\u0443\u044e \u0443 \u043f\u0440\u043e\u0434\u0430\u0432\u0446\u0430 \u0447\u0435\u0440\u0435\u0437 \u0447\u0430\u0442.' },
  ]
  return (
    <section className="bp__card" id="section-faq">
      <h2 className="bp__card-title">{'\u0427\u0430\u0441\u0442\u044b\u0435 \u0432\u043e\u043f\u0440\u043e\u0441\u044b'}</h2>
      <div className="bp__faq-list">
        {faqs.map((f, i) => (
          <div key={i} className={`bp__faq-item ${openIdx === i ? 'bp__faq-item--open' : ''}`}>
            <button className="bp__faq-q" onClick={() => setOpenIdx(openIdx === i ? null : i)}>
              <span>{f.q}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                style={{ transform: openIdx === i ? 'rotate(180deg)' : '', transition: 'transform .2s' }}>
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
            {openIdx === i && <p className="bp__faq-a">{f.a}</p>}
          </div>
        ))}
      </div>
    </section>
  )
}

function SimilarCard({ biz, onClick }) {
  const logo = resolveUrl(biz.logo) || `https://picsum.photos/id/${biz.id + 10}/200/200`
  const cover = resolveUrl(biz.cover) || `https://picsum.photos/id/${biz.id + 20}/400/200`
  return (
    <div className="bp__sim-card" onClick={onClick}>
      <div className="bp__sim-cover" style={{ backgroundImage: `url(${cover})` }}>
        {biz.is_vip && <span className="bp__sim-badge bp__sim-badge--vip">VIP</span>}
      </div>
      <img src={logo} alt={biz.brand_name} className="bp__sim-logo" />
      <div className="bp__sim-body">
        <p className="bp__sim-name">{biz.brand_name}</p>
        {biz.city && <p className="bp__sim-city">{biz.city}</p>}
      </div>
    </div>
  )
}

/* ── VIP promo block (replaces Товары sidebar) ── */
function VipPromo({ user, navigate }) {
  return (
    <div className="bp__side-card bp__vip-promo">
      <div className="bp__vip-promo-icon">{'\u2b50'}</div>
      <h3 className="bp__vip-promo-title">VIP {'\u0434\u043e\u0441\u0442\u0443\u043f'}</h3>
      <p className="bp__vip-promo-text">
        {'\u041f\u043e\u043b\u0443\u0447\u0438\u0442\u0435 \u043f\u0440\u0438\u043e\u0440\u0438\u0442\u0435\u0442\u043d\u043e\u0435 \u0440\u0430\u0437\u043c\u0435\u0449\u0435\u043d\u0438\u0435, \u0431\u0435\u0439\u0434\u0436 VIP \u0438 \u0440\u0430\u0441\u0448\u0438\u0440\u0435\u043d\u043d\u0443\u044e \u0430\u043d\u0430\u043b\u0438\u0442\u0438\u043a\u0443 \u0434\u043b\u044f \u0432\u0430\u0448\u0435\u0433\u043e \u0431\u0438\u0437\u043d\u0435\u0441\u0430.'}
      </p>
      <button className="bp__vip-promo-btn" onClick={() => {
        if (!user) { navigate('/login'); return }
        navigate('/vip')
      }}>
        {user ? '\u0423\u0437\u043d\u0430\u0442\u044c \u0431\u043e\u043b\u044c\u0448\u0435' : '\u0412\u043e\u0439\u0442\u0438 \u0434\u043b\u044f \u043f\u043e\u0434\u0440\u043e\u0431\u043d\u043e\u0441\u0442\u0435\u0439'}
      </button>
    </div>
  )
}

/* ── Auth gate overlay ── */
function AuthGate({ navigate }) {
  return (
    <div className="bp__auth-gate">
      <div className="bp__auth-gate-inner">
        <div className="bp__auth-gate-icon">{'\u{1f512}'}</div>
        <h3>{'\u0412\u043e\u0439\u0434\u0438\u0442\u0435, \u0447\u0442\u043e\u0431\u044b \u0432\u0438\u0434\u0435\u0442\u044c \u0431\u043e\u043b\u044c\u0448\u0435'}</h3>
        <p>{'\u0417\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u0443\u0439\u0442\u0435\u0441\u044c \u0438\u043b\u0438 \u0432\u043e\u0439\u0434\u0438\u0442\u0435 \u0432 \u0430\u043a\u043a\u0430\u0443\u043d\u0442, \u0447\u0442\u043e\u0431\u044b \u043f\u043e\u043b\u0443\u0447\u0438\u0442\u044c \u043f\u043e\u043b\u043d\u044b\u0439 \u0434\u043e\u0441\u0442\u0443\u043f.'}</p>
        <div className="bp__auth-gate-btns">
          <button className="bp__auth-gate-btn bp__auth-gate-btn--login" onClick={() => navigate('/login')}>{'\u0412\u043e\u0439\u0442\u0438'}</button>
          <button className="bp__auth-gate-btn bp__auth-gate-btn--reg" onClick={() => navigate('/register')}>{'\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044f'}</button>
        </div>
      </div>
    </div>
  )
}

export default function BusinessPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, getAccessToken } = useAuth()

  const [biz, setBiz]               = useState(null)
  const [posts, setPosts]           = useState([])
  const [similar, setSimilar]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [subCount, setSubCount]     = useState(0)
  const [subLoading, setSubLoading] = useState(false)
  const [inGroup, setInGroup]       = useState(false)
  const [groupLoading, setGroupLoading] = useState(false)
  const [activeTab, setActiveTab]   = useState('about')

  useEffect(() => {
    setLoading(true)
    setError('')
    setBiz(null)
    setSimilar([])
    Promise.all([apiGetBusiness(id), apiGetBusinessPosts(id)])
      .then(([bizData, postsData]) => {
        setBiz(bizData)
        setPosts(postsData)
        setSubscribed(bizData.is_subscribed || false)
        setSubCount(bizData.subscribers_count || 0)
        if (bizData.group_id) {
          getAccessToken().then(token => {
            if (token) {
              apiCheckGroupMembership(bizData.group_id, token)
                .then(data => setInGroup(data.joined))
                .catch(() => {})
            }
          })
        }
        if (bizData.category) {
          apiGetBusinesses({ category: bizData.category })
            .then(list => setSimilar(list.filter(b => b.id !== bizData.id).slice(0, 5)))
            .catch(() => {})
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  const scrollToSection = (sectionId) => {
    setActiveTab(sectionId)
    const el = document.getElementById(`section-${sectionId}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (loading) return (
    <div className="bp">
      <Header />
      <div className="bp__loader">
        <span className="bp__spinner" />
        <p>{'\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043c...'}</p>
      </div>
    </div>
  )

  if (error || !biz) return (
    <div className="bp">
      <Header />
      <div className="bp__error-state">
        <div style={{ fontSize: 48 }}>{'\u{1f3e2}'}</div>
        <h2>{'\u0411\u0438\u0437\u043d\u0435\u0441 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d'}</h2>
        <p>{error || '\u0421\u0442\u0440\u0430\u043d\u0438\u0446\u0430 \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u043d\u0430 \u0438\u043b\u0438 \u0431\u044b\u043b\u0430 \u0443\u0434\u0430\u043b\u0435\u043d\u0430'}</p>
        <button onClick={() => navigate('/')}>{'\u041d\u0430 \u0433\u043b\u0430\u0432\u043d\u0443\u044e'}</button>
      </div>
    </div>
  )

  const logo  = resolveUrl(biz.logo)  || FALLBACK_LOGO
  const cover = resolveUrl(biz.cover) || FALLBACK_COVER
  const categoryIcon = CATEGORY_ICONS[biz.category] || '\u{1f3e2}'
  const rating10 = Math.min(10, (Number(biz.rating) * 2).toFixed(1))

  const bizHashtags = [
    `#${(biz.category || 'business').toLowerCase()}`,
    ...(biz.city ? [`#${biz.city.toLowerCase().replace(/\s/g, '_')}`] : []),
    ...(biz.is_verified ? ['#verified'] : []),
    ...(biz.is_vip ? ['#vip'] : []),
    '#messengershop',
  ]

  const handleJoinGroup = async () => {
    if (!user) { navigate('/login'); return }
    if (groupLoading || !biz.group_id) return
    setGroupLoading(true)
    try {
      const token = await getAccessToken()
      await apiJoinGroup(biz.group_id, token)
      setInGroup(true)
    } catch {} finally { setGroupLoading(false) }
  }

  const handleSubscribe = async () => {
    if (!user) { navigate('/login'); return }
    if (subLoading) return
    setSubLoading(true)
    try {
      const token = await getAccessToken()
      const data = await apiToggleSubscription(id, token)
      setSubscribed(data.subscribed)
      setSubCount(data.subscribers_count)
    } catch {} finally { setSubLoading(false) }
  }

  return (
    <div className="bp">
      <Header />

      {/* Cover */}
      <div className="bp__cover" style={{ backgroundImage: `url(${cover})` }}>
        <div className="bp__cover-fade" />
        <button className="bp__back" onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
      </div>

      {/* Hero */}
      <div className="bp__wrap">
        <div className="bp__hero">
          <img src={logo} alt={biz.brand_name} className="bp__avatar" />

          <div className="bp__hero-body">
            <div className="bp__name-row">
              <h1 className="bp__name">{biz.brand_name}</h1>
              {biz.is_verified && (
                <svg className="bp__verified-icon" width="22" height="22" viewBox="0 0 24 24" fill="#10b981">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              )}
              {biz.is_vip && <span className="bp__vip-tag">VIP</span>}
            </div>

            <div className="bp__tags">
              <span className="bp__tag">{categoryIcon} {biz.category_label}</span>
              {biz.city && <span className="bp__tag">{'\u{1f4cd}'} {biz.city}</span>}
              <span className="bp__tag bp__tag--rating">{'\u{1f31f}'} {rating10} / 10</span>
            </div>

            <div className="bp__stats">
              <div className="bp__stat">
                <span className="bp__stat-num">{subCount}</span>
                <span className="bp__stat-label">{'\u043f\u043e\u0434\u043f\u0438\u0441\u0447\u0438\u043a\u043e\u0432'}</span>
              </div>
              {biz.views_count > 0 && (
                <div className="bp__stat">
                  <span className="bp__stat-num">{biz.views_count}</span>
                  <span className="bp__stat-label">{'\u043f\u0440\u043e\u0441\u043c\u043e\u0442\u0440\u043e\u0432'}</span>
                </div>
              )}
            </div>

            {/* Hashtags inside hero */}
            <div className="bp__hero-hashtags">
              {bizHashtags.map((h, i) => (
                <span key={i} className="bp__hashtag">{h}</span>
              ))}
            </div>
          </div>

          <div className="bp__actions">
            <button
              className={`bp__act-btn bp__act-btn--sub ${subscribed ? 'bp__act-btn--active' : ''}`}
              onClick={handleSubscribe}
              disabled={subLoading}
            >
              {subscribed ? '\u2713 \u041f\u043e\u0434\u043f\u0438\u0441\u0430\u043d' : '\u041f\u043e\u0434\u043f\u0438\u0441\u0430\u0442\u044c\u0441\u044f'}
            </button>
            <button className="bp__act-btn bp__act-btn--chat" onClick={() => { if (!user) { navigate('/login'); return } navigate('/messenger') }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              {'\u0427\u0430\u0442'}
            </button>
            {biz.group_id && (
              <button
                className={`bp__act-btn bp__act-btn--group ${inGroup ? 'bp__act-btn--joined' : ''}`}
                onClick={inGroup ? () => navigate('/messenger') : handleJoinGroup}
                disabled={groupLoading}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                {inGroup ? '\u0412 \u0433\u0440\u0443\u043f\u043f\u0435' : '\u0412\u0441\u0442\u0443\u043f\u0438\u0442\u044c'}
              </button>
            )}
            {biz.phone && (
              <a href={`tel:${biz.phone}`} className="bp__act-btn bp__act-btn--phone">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.78a16 16 0 0 0 7.86 7.86l1.06-1.06a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </a>
            )}
          </div>
        </div>

        {/* Section navigation tabs */}
        <div className="bp__section-nav">
          {SECTION_TABS.map(t => (
            <button
              key={t.id}
              className={`bp__section-tab ${activeTab === t.id ? 'bp__section-tab--on' : ''}`}
              onClick={() => scrollToSection(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Two-column layout */}
        <div className="bp__grid">
          {/* Main column */}
          <div className="bp__main">

            {/* About */}
            {biz.description && (
              <section className="bp__card" id="section-about">
                <h2 className="bp__card-title">{'\u041e \u043d\u0430\u0441'}</h2>
                <p className="bp__about-text">{biz.description}</p>
              </section>
            )}

            {/* Contacts */}
            <section className="bp__card">
              <h2 className="bp__card-title">{'\u041a\u043e\u043d\u0442\u0430\u043a\u0442\u044b'}</h2>
              <div className="bp__contacts-row">
                {biz.phone && (
                  <a href={`tel:${biz.phone}`} className="bp__contact-chip bp__contact-chip--phone">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.78a16 16 0 0 0 7.86 7.86l1.06-1.06a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    <span>{biz.phone}</span>
                  </a>
                )}
                {biz.website && (
                  <a href={biz.website} target="_blank" rel="noopener noreferrer" className="bp__contact-chip bp__contact-chip--web">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                    <span>{biz.website.replace(/^https?:\/\//, '')}</span>
                  </a>
                )}
                {biz.address && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(biz.address + (biz.city ? ' ' + biz.city : ''))}`}
                    target="_blank" rel="noopener noreferrer"
                    className="bp__contact-chip bp__contact-chip--map"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <span>{biz.address}</span>
                  </a>
                )}
              </div>
              {biz.is_verified && (
                <div className="bp__verified-stamp">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#10b981"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                  {'\u0412\u0435\u0440\u0438\u0444\u0438\u0446\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u044b\u0439 \u0431\u0438\u0437\u043d\u0435\u0441'}
                </div>
              )}
            </section>

            {/* Characteristics only (no services/uslugi) */}
            <section className="bp__card">
              <h2 className="bp__card-title">{'\u0425\u0430\u0440\u0430\u043a\u0442\u0435\u0440\u0438\u0441\u0442\u0438\u043a\u0438'}</h2>
              <div className="bp__props">
                <div className="bp__prop"><span>{'\u041a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u044f'}</span><span>{categoryIcon} {biz.category_label}</span></div>
                {biz.city && <div className="bp__prop"><span>{'\u0413\u043e\u0440\u043e\u0434'}</span><span>{biz.city}</span></div>}
                <div className="bp__prop"><span>{'\u0420\u0435\u0439\u0442\u0438\u043d\u0433'}</span><span>{'\u{1f31f}'} {rating10} / 10</span></div>
                <div className="bp__prop">
                  <span>{'\u0421\u0442\u0430\u0442\u0443\u0441'}</span>
                  <span style={{ color: biz.is_verified ? '#10b981' : 'var(--text-muted)' }}>
                    {biz.is_verified ? '\u2713 \u041f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0451\u043d' : '\u041d\u0435 \u0432\u0435\u0440\u0438\u0444\u0438\u0446\u0438\u0440\u043e\u0432\u0430\u043d'}
                  </span>
                </div>
              </div>
            </section>

            {/* Gallery */}
            <Gallery posts={posts} />

            {/* Posts with hashtags */}
            {posts.length > 0 && (
              <section className="bp__card" id="section-posts">
                <h2 className="bp__card-title">{'\u041f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u0438'} <span className="bp__pill">{posts.length}</span></h2>
                <div className="bp__feed">
                  {posts.map(post => (
                    <div key={post.id} className="bp__feed-item">
                      {post.media_display && (
                        <div className="bp__feed-media">
                          <img src={post.media_display} alt="" loading="lazy" />
                          {post.media_type === 'VIDEO' && <div className="bp__play">{'\u25b6'}</div>}
                        </div>
                      )}
                      <div className="bp__feed-body">
                        <p className="bp__feed-text">{post.text}</p>
                        <div className="bp__feed-hashtags">
                          {bizHashtags.slice(0, 3).map((h, i) => (
                            <span key={i} className="bp__feed-hashtag">{h}</span>
                          ))}
                        </div>
                        <span className="bp__feed-date">
                          {new Date(post.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Reviews */}
            <section className="bp__card" id="section-reviews">
              <ReviewsSection type="business" targetId={id} horizontal ratingScale={10} />
            </section>

            {/* FAQ */}
            <FAQSection biz={biz} />

            {/* Location */}
            {biz.address && (
              <section className="bp__card">
                <h2 className="bp__card-title">{'\u041c\u0435\u0441\u0442\u043e\u043f\u043e\u043b\u043e\u0436\u0435\u043d\u0438\u0435'}</h2>
                <div className="bp__map-row">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-1)" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span>{biz.address}{biz.city ? `, ${biz.city}` : ''}</span>
                </div>
                <a
                  className="bp__map-link"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(biz.address + (biz.city ? ' ' + biz.city : ''))}`}
                  target="_blank" rel="noopener noreferrer"
                >
                  {'\u041e\u0442\u043a\u0440\u044b\u0442\u044c \u043d\u0430 \u043a\u0430\u0440\u0442\u0435'}
                </a>
              </section>
            )}

            {/* Auth gate for non-logged users */}
            {!user && <AuthGate navigate={navigate} />}

            {!biz.description && posts.length === 0 && (
              <div className="bp__empty">
                <div style={{ fontSize: 40, marginBottom: 12 }}>{'\u{1f4ed}'}</div>
                <p>{'\u0411\u0438\u0437\u043d\u0435\u0441 \u0435\u0449\u0451 \u043d\u0435 \u0434\u043e\u0431\u0430\u0432\u0438\u043b \u043a\u043e\u043d\u0442\u0435\u043d\u0442'}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="bp__side">
            {/* Hashtags */}
            <div className="bp__side-card">
              <h3 className="bp__side-title">{'\u0425\u044d\u0448\u0442\u0435\u0433\u0438'}</h3>
              <div className="bp__hashtags">
                {bizHashtags.map((h, i) => (
                  <span key={i} className="bp__hashtag">{h}</span>
                ))}
              </div>
            </div>

            {/* VIP promo (replaces products) */}
            <VipPromo user={user} navigate={navigate} />

            {/* FAQ sidebar links */}
            <div className="bp__side-card">
              <h3 className="bp__side-title">FAQ</h3>
              <div className="bp__side-faq-links">
                <button onClick={() => scrollToSection('faq')}>{'\u041a\u0430\u043a \u0441\u0432\u044f\u0437\u0430\u0442\u044c\u0441\u044f?'}</button>
                <button onClick={() => scrollToSection('faq')}>{'\u0414\u043e\u0441\u0442\u0430\u0432\u043a\u0430 \u0438 \u0432\u043e\u0437\u0432\u0440\u0430\u0442'}</button>
                <button onClick={() => scrollToSection('reviews')}>{'\u041e\u0442\u0437\u044b\u0432\u044b \u043a\u043b\u0438\u0435\u043d\u0442\u043e\u0432'}</button>
              </div>
            </div>

            {/* Info */}
            <div className="bp__side-card">
              <h3 className="bp__side-title">{'\u0418\u043d\u0444\u043e\u0440\u043c\u0430\u0446\u0438\u044f'}</h3>
              <div className="bp__info-list">
                {biz.phone && (
                  <div className="bp__info-row">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.78a16 16 0 0 0 7.86 7.86l1.06-1.06a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    <a href={`tel:${biz.phone}`}>{biz.phone}</a>
                  </div>
                )}
                {biz.website && (
                  <div className="bp__info-row">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                    <a href={biz.website} target="_blank" rel="noopener noreferrer">{biz.website.replace(/^https?:\/\//, '')}</a>
                  </div>
                )}
                {biz.owner_email && (
                  <div className="bp__info-row">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    <a href={`mailto:${biz.owner_email}`}>{biz.owner_email}</a>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>

        {/* Similar */}
        {similar.length > 0 && (
          <section className="bp__similar">
            <h2 className="bp__card-title">{'\u041f\u043e\u0445\u043e\u0436\u0438\u0435 \u0431\u0438\u0437\u043d\u0435\u0441\u044b'}</h2>
            <div className="bp__sim-grid">
              {similar.map(s => (
                <SimilarCard key={s.id} biz={s} onClick={() => navigate(`/business/${s.id}`)} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
