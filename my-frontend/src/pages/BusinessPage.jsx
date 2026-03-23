import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Header from '../components/Header'
import ProductCard from '../components/ProductCard'
import ReviewsSection from '../components/ReviewsSection'
import { apiGetBusiness, apiGetBusinessPosts, apiGetBusinesses, apiToggleSubscription, apiJoinGroup, apiCheckGroupMembership } from '../api/businessApi'
import './BusinessPage.css'

const CATEGORY_ICONS = {
  BEAUTY: '💅', HEALTH: '🩺', REALTY: '🏠', EDUCATION: '📚',
  FINANCE: '💼', LEGAL: '⚖️', TOURISM: '✈️', FOOD: '🍽️',
  TRANSPORT: '🚗', OTHER: '🏢',
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

function Gallery({ posts }) {
  const [tab, setTab] = useState('all')
  const images = posts.filter(p => p.media_display && p.media_type !== 'VIDEO')
  const videos = posts.filter(p => p.media_display && p.media_type === 'VIDEO')
  const all    = posts.filter(p => p.media_display)
  const items = tab === 'video' ? videos : tab === 'photo' ? images : all
  if (all.length === 0) return null

  return (
    <section className="bp__card">
      <div className="bp__card-head">
        <h2 className="bp__card-title">Фото и видео</h2>
        <div className="bp__gallery-tabs">
          <button className={`bp__tab ${tab === 'all' ? 'bp__tab--on' : ''}`} onClick={() => setTab('all')}>Все</button>
          {images.length > 0 && <button className={`bp__tab ${tab === 'photo' ? 'bp__tab--on' : ''}`} onClick={() => setTab('photo')}>Фото</button>}
          {videos.length > 0 && <button className={`bp__tab ${tab === 'video' ? 'bp__tab--on' : ''}`} onClick={() => setTab('video')}>Видео</button>}
        </div>
      </div>
      <div className="bp__gallery">
        {items.map(p => (
          <div key={p.id} className="bp__gallery-cell">
            <img src={p.media_display} alt="" loading="lazy" />
            {p.media_type === 'VIDEO' && <div className="bp__play">▶</div>}
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

  if (loading) return (
    <div className="bp">
      <Header />
      <div className="bp__loader">
        <span className="bp__spinner" />
        <p>Загружаем...</p>
      </div>
    </div>
  )

  if (error || !biz) return (
    <div className="bp">
      <Header />
      <div className="bp__error-state">
        <div style={{ fontSize: 48 }}>🏢</div>
        <h2>Бизнес не найден</h2>
        <p>{error || 'Страница недоступна или была удалена'}</p>
        <button onClick={() => navigate('/')}>На главную</button>
      </div>
    </div>
  )

  const logo  = resolveUrl(biz.logo)  || FALLBACK_LOGO
  const cover = resolveUrl(biz.cover) || FALLBACK_COVER
  const categoryIcon = CATEGORY_ICONS[biz.category] || '🏢'
  const availableProducts = (biz.products || []).filter(p => p.is_available)

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

      {/* ── Cover ── */}
      <div className="bp__cover" style={{ backgroundImage: `url(${cover})` }}>
        <div className="bp__cover-fade" />
        <button className="bp__back" onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
      </div>

      {/* ── Hero ── */}
      <div className="bp__wrap">
        <div className="bp__hero">
          <img src={logo} alt={biz.brand_name} className="bp__avatar" />

          <div className="bp__hero-body">
            <div className="bp__name-row">
              <h1 className="bp__name">{biz.brand_name}</h1>
              {biz.is_verified && (
                <svg className="bp__verified-icon" width="20" height="20" viewBox="0 0 24 24" fill="#10b981">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              )}
              {biz.is_vip && <span className="bp__vip-tag">VIP</span>}
            </div>

            <div className="bp__tags">
              <span className="bp__tag">{categoryIcon} {biz.category_label}</span>
              {biz.city && <span className="bp__tag">📍 {biz.city}</span>}
              {biz.rating > 0 && <span className="bp__tag">⭐ {Number(biz.rating).toFixed(1)}</span>}
            </div>

            <div className="bp__stats">
              <div className="bp__stat">
                <span className="bp__stat-num">{subCount}</span>
                <span className="bp__stat-label">подписчиков</span>
              </div>
              {biz.views_count > 0 && (
                <div className="bp__stat">
                  <span className="bp__stat-num">{biz.views_count}</span>
                  <span className="bp__stat-label">просмотров</span>
                </div>
              )}
              <div className="bp__stat">
                <span className="bp__stat-num">{availableProducts.length}</span>
                <span className="bp__stat-label">товаров</span>
              </div>
            </div>
          </div>

          <div className="bp__actions">
            <button
              className={`bp__act-btn bp__act-btn--sub ${subscribed ? 'bp__act-btn--active' : ''}`}
              onClick={handleSubscribe}
              disabled={subLoading}
            >
              {subscribed ? '✓ Подписан' : 'Подписаться'}
            </button>
            <button className="bp__act-btn bp__act-btn--chat" onClick={() => { if (!user) { navigate('/login'); return } navigate('/messenger') }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Чат
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
                {inGroup ? 'В группе' : 'Вступить'}
              </button>
            )}
            {biz.phone && (
              <a href={`tel:${biz.phone}`} className="bp__act-btn bp__act-btn--phone">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.78a16 16 0 0 0 7.86 7.86l1.06-1.06a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </a>
            )}
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div className="bp__grid">
          {/* ── Main column ── */}
          <div className="bp__main">

            {/* О нас */}
            {biz.description && (
              <section className="bp__card">
                <h2 className="bp__card-title">О нас</h2>
                <p className="bp__about-text">{biz.description}</p>
              </section>
            )}

            {/* Контакты */}
            <section className="bp__card">
              <h2 className="bp__card-title">Контакты</h2>
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
                  Верифицированный бизнес
                </div>
              )}
            </section>

            {/* Характеристики + Услуги side by side */}
            <div className="bp__twin">
              <section className="bp__card">
                <h2 className="bp__card-title">Характеристики</h2>
                <div className="bp__props">
                  <div className="bp__prop"><span>Категория</span><span>{categoryIcon} {biz.category_label}</span></div>
                  {biz.city && <div className="bp__prop"><span>Город</span><span>{biz.city}</span></div>}
                  <div className="bp__prop"><span>Рейтинг</span><span>⭐ {Number(biz.rating).toFixed(1)}</span></div>
                  <div className="bp__prop">
                    <span>Статус</span>
                    <span style={{ color: biz.is_verified ? '#10b981' : 'var(--text-muted)' }}>
                      {biz.is_verified ? '✓ Подтверждён' : 'Не верифицирован'}
                    </span>
                  </div>
                </div>
              </section>
              {availableProducts.length > 0 && (
                <section className="bp__card">
                  <h2 className="bp__card-title">Услуги <span className="bp__pill">{availableProducts.length}</span></h2>
                  <div className="bp__services">
                    {availableProducts.slice(0, 4).map(p => (
                      <div key={p.id} className="bp__service-item" onClick={() => navigate(`/product/${p.id}`)}>
                        {p.photo && <img src={resolveUrl(p.photo)} alt={p.name} className="bp__service-img" />}
                        <div>
                          <div className="bp__service-name">{p.name}</div>
                          {p.price && <div className="bp__service-price">{Number(p.price).toLocaleString()} сум</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Владелец */}
            <section className="bp__card">
              <h2 className="bp__card-title">Команда</h2>
              <div className="bp__team">
                <div className="bp__team-member">
                  <img
                    src={biz.owner_avatar
                      ? (biz.owner_avatar.startsWith('http') ? biz.owner_avatar : `${API_BASE}${biz.owner_avatar}`)
                      : `https://i.pravatar.cc/80?u=${biz.owner_email}`}
                    alt={biz.owner_username}
                    className="bp__team-ava"
                  />
                  <div className="bp__team-info">
                    <span className="bp__team-name">@{biz.owner_username}</span>
                    <span className="bp__team-role">Владелец</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Галерея */}
            <Gallery posts={posts} />

            {/* Новости */}
            {posts.length > 0 && (
              <section className="bp__card">
                <h2 className="bp__card-title">Публикации <span className="bp__pill">{posts.length}</span></h2>
                <div className="bp__feed">
                  {posts.map(post => (
                    <div key={post.id} className="bp__feed-item">
                      {post.media_display && (
                        <div className="bp__feed-media">
                          <img src={post.media_display} alt="" loading="lazy" />
                          {post.media_type === 'VIDEO' && <div className="bp__play">▶</div>}
                        </div>
                      )}
                      <div className="bp__feed-body">
                        <p className="bp__feed-text">{post.text}</p>
                        <span className="bp__feed-date">
                          {new Date(post.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Отзывы */}
            <section className="bp__card">
              <ReviewsSection type="business" targetId={id} horizontal />
            </section>

            {/* Адрес */}
            {biz.address && (
              <section className="bp__card">
                <h2 className="bp__card-title">Местоположение</h2>
                <div className="bp__map-row">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-1)" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span>{biz.address}{biz.city ? `, ${biz.city}` : ''}</span>
                </div>
                <a
                  className="bp__map-link"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(biz.address + (biz.city ? ' ' + biz.city : ''))}`}
                  target="_blank" rel="noopener noreferrer"
                >
                  Открыть на карте
                </a>
              </section>
            )}

            {availableProducts.length === 0 && !biz.description && posts.length === 0 && (
              <div className="bp__empty">
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                <p>Бизнес ещё не добавил контент</p>
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <aside className="bp__side">
            {/* Хэштеги */}
            <div className="bp__side-card">
              <h3 className="bp__side-title">Хэштеги</h3>
              <div className="bp__hashtags">
                <span className="bp__hashtag">#{biz.category?.toLowerCase()}</span>
                {biz.city && <span className="bp__hashtag">#{biz.city.toLowerCase().replace(/\s/g, '_')}</span>}
                {biz.is_verified && <span className="bp__hashtag">#verified</span>}
                {biz.is_vip && <span className="bp__hashtag">#vip</span>}
                <span className="bp__hashtag">#messengershop</span>
              </div>
            </div>

            {/* Товары (compact cards) */}
            {availableProducts.length > 0 && (
              <div className="bp__side-card">
                <h3 className="bp__side-title">Товары <span className="bp__pill">{availableProducts.length}</span></h3>
                <div className="bp__side-products">
                  {availableProducts.slice(0, 3).map(p => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </div>
            )}

            {/* Информация */}
            <div className="bp__side-card">
              <h3 className="bp__side-title">Информация</h3>
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

        {/* Похожие */}
        {similar.length > 0 && (
          <section className="bp__similar">
            <h2 className="bp__card-title">Похожие бизнесы</h2>
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
