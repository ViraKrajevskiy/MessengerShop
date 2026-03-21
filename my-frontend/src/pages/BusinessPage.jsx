import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Header from '../components/Header'
import ProductCard from '../components/ProductCard'
import { apiGetBusiness, apiGetBusinessPosts } from '../api/businessApi'
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

export default function BusinessPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, tokens } = useAuth()

  const [biz, setBiz]       = useState(null)
  const [posts, setPosts]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    Promise.all([apiGetBusiness(id), apiGetBusinessPosts(id)])
      .then(([bizData, postsData]) => { setBiz(bizData); setPosts(postsData) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  const handleMessage = () => {
    if (!user) { navigate('/login'); return }
    navigate('/messenger')
  }

  if (loading) return (
    <div className="bp">
      <Header />
      <div className="bp__loader">
        <span className="bp__spinner" />
        <p>Загружаем страницу бизнеса...</p>
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
        <button onClick={() => navigate('/')}>← На главную</button>
      </div>
    </div>
  )

  const logo  = resolveUrl(biz.logo)  || FALLBACK_LOGO
  const cover = resolveUrl(biz.cover) || FALLBACK_COVER
  const categoryIcon = CATEGORY_ICONS[biz.category] || '🏢'
  const availableProducts = (biz.products || []).filter(p => p.is_available)

  return (
    <div className="bp">
      <Header />

      {/* Cover */}
      <div className="bp__cover" style={{ backgroundImage: `url(${cover})` }}>
        <div className="bp__cover-overlay" />
      </div>

      <main className="bp__main">

        {/* Back */}
        <button className="bp__back" onClick={() => navigate(-1)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Назад
        </button>

        {/* Hero card */}
        <div className="bp__hero">
          <div className="bp__logo-wrap">
            <img src={logo} alt={biz.brand_name} className="bp__logo" />
          </div>

          <div className="bp__hero-info">
            <div className="bp__badges">
              <span className="bp__category-badge">
                {categoryIcon} {biz.category_label}
              </span>
              {biz.is_verified && <span className="bp__verified-badge">✓ Верифицирован</span>}
              {biz.is_vip && <span className="bp__vip-badge">👑 VIP</span>}
            </div>

            <h1 className="bp__brand-name">{biz.brand_name}</h1>

            <div className="bp__meta">
              {biz.city && (
                <span className="bp__meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  {biz.city}
                </span>
              )}
              {biz.rating > 0 && (
                <span className="bp__meta-item">
                  ⭐ {Number(biz.rating).toFixed(1)}
                </span>
              )}
              {biz.views_count > 0 && (
                <span className="bp__meta-item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                  {biz.views_count} просмотров
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bp__hero-actions">
            <button className="bp__msg-btn" onClick={handleMessage}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Написать
            </button>
            {biz.phone && (
              <a href={`tel:${biz.phone}`} className="bp__phone-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.78a16 16 0 0 0 7.86 7.86l1.06-1.06a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                {biz.phone}
              </a>
            )}
          </div>
        </div>

        {/* Layout: main + sidebar */}
        <div className="bp__layout">

          {/* ── Основная часть ── */}
          <div className="bp__content">

            {/* Description */}
            {biz.description && (
              <section className="bp__section">
                <h2 className="bp__section-title">О компании</h2>
                <p className="bp__description">{biz.description}</p>
              </section>
            )}

            {/* Products */}
            {availableProducts.length > 0 && (
              <section className="bp__section">
                <h2 className="bp__section-title">
                  Товары и услуги
                  <span className="bp__count">{availableProducts.length}</span>
                </h2>
                <div className="bp__products-grid">
                  {availableProducts.map(p => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </section>
            )}

            {/* Posts / News */}
            {posts.length > 0 && (
              <section className="bp__section">
                <h2 className="bp__section-title">
                  Новости
                  <span className="bp__count">{posts.length}</span>
                </h2>
                <div className="bp__posts-grid">
                  {posts.map(post => (
                    <div key={post.id} className="bp__post-card">
                      {post.media_display && (
                        <div className="bp__post-media">
                          <img src={post.media_display} alt="" loading="lazy" />
                          {post.media_type === 'VIDEO' && <div className="bp__post-play">▶</div>}
                        </div>
                      )}
                      <div className="bp__post-body">
                        <p className="bp__post-text">{post.text}</p>
                        <span className="bp__post-time">
                          {new Date(post.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Location */}
            {biz.address && (
              <section className="bp__section">
                <h2 className="bp__section-title">Где мы находимся</h2>
                <div className="bp__location">
                  <div className="bp__location-info">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-1)" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span>{biz.address}{biz.city ? `, ${biz.city}` : ''}</span>
                  </div>
                  <a
                    className="bp__map-link"
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(biz.address + (biz.city ? ' ' + biz.city : ''))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Открыть в Google Maps
                  </a>
                </div>
              </section>
            )}

            {availableProducts.length === 0 && !biz.description && posts.length === 0 && (
              <div className="bp__empty">
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                <p>Бизнес ещё не добавил товары и услуги</p>
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <aside className="bp__sidebar">

            {/* Contact card */}
            <div className="bp__contact-card">
              <h3 className="bp__contact-title">Контакты</h3>

              {biz.address && (
                <div className="bp__contact-row">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent-1)" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span>{biz.address}</span>
                </div>
              )}
              {biz.phone && (
                <div className="bp__contact-row">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent-1)" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.78a16 16 0 0 0 7.86 7.86l1.06-1.06a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  <a href={`tel:${biz.phone}`}>{biz.phone}</a>
                </div>
              )}
              {biz.website && (
                <div className="bp__contact-row">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent-1)" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                  <a href={biz.website} target="_blank" rel="noopener noreferrer">{biz.website.replace(/^https?:\/\//, '')}</a>
                </div>
              )}

              {!biz.address && !biz.phone && !biz.website && (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Контакты не указаны</p>
              )}
            </div>

            {/* Owner */}
            <div className="bp__contact-card">
              <h3 className="bp__contact-title">Владелец</h3>
              <div className="bp__owner">
                <img
                  src={biz.owner_avatar
                    ? (biz.owner_avatar.startsWith('http') ? biz.owner_avatar : `http://127.0.0.1:8000${biz.owner_avatar}`)
                    : `https://i.pravatar.cc/80?u=${biz.owner_email}`}
                  alt={biz.owner_username}
                  className="bp__owner-avatar"
                />
                <div>
                  <div className="bp__owner-name">@{biz.owner_username}</div>
                  <div className="bp__owner-email">{biz.owner_email}</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
