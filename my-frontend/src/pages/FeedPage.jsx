import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Stories from '../components/Stories'
import { useAuth } from '../context/AuthContext'
import { apiGetPosts, apiGetBusinesses, apiGetNews, apiToggleSubscription, CATEGORY_LABELS } from '../api/businessApi'
import './FeedPage.css'

// ── Tag pills ────────────────────────────────────────────────────────────────
function TagPills({ tags, onTagClick }) {
  if (!tags || tags.length === 0) return null
  return (
    <div className="feed-tags">
      {tags.map(t => (
        <span key={t} className="feed-tag" onClick={e => { e.stopPropagation(); onTagClick?.(t) }}>#{t}</span>
      ))}
    </div>
  )
}

const FALLBACK_IMG  = 'https://picsum.photos/id/342/800/600'
const FALLBACK_LOGO = 'https://i.pravatar.cc/80?u=default'
const PROD_IMGS = [
  'https://picsum.photos/id/119/400/300',
  'https://picsum.photos/id/137/400/300',
  'https://picsum.photos/id/145/400/300',
  'https://picsum.photos/id/177/400/300',
  'https://picsum.photos/id/200/400/300',
]

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'только что'
  if (mins < 60) return `${mins} мин. назад`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ч. назад`
  return `${Math.floor(hours / 24)} дн. назад`
}

// ── Post card (full feed style) ───────────────────────────────────────────────
function FeedPost({ post, onTagClick }) {
  const navigate = useNavigate()
  const { user, getAccessToken } = useAuth()
  const [saved, setSaved] = useState(false)
  const [followed, setFollowed] = useState(post.is_subscribed || false)
  const [subLoading, setSubLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const logo  = post.business_logo
    ? (post.business_logo.startsWith('http') ? post.business_logo : `https://api.101-school.uz${post.business_logo}`)
    : FALLBACK_LOGO
  const media = post.media_display || FALLBACK_IMG
  const SHORT = 120
  const isLong = post.text && post.text.length > SHORT

  const requireAuth = (cb) => {
    if (!user) { navigate('/login'); return }
    cb()
  }

  const handleFollow = async () => {
    if (!user) { navigate('/login'); return }
    if (subLoading) return
    setSubLoading(true)
    try {
      const token = await getAccessToken()
      const data = await apiToggleSubscription(post.business_id, token)
      setFollowed(data.subscribed)
    } catch { /* ignore */ } finally {
      setSubLoading(false)
    }
  }

  return (
    <div className="feed-post">
      <div className="feed-post__header">
        <img className="feed-post__avatar" src={logo} alt={post.business_name}
          onClick={() => navigate(`/business/${post.business_id}`)} />
        <div className="feed-post__meta">
          <span className="feed-post__name" onClick={() => navigate(`/business/${post.business_id}`)}>
            {post.business_name}
            {post.is_verified && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#2196f3" style={{marginLeft:4,verticalAlign:'middle'}}>
                <path d="M12 2L9.19 4.09 5.5 3.82 4.41 7.41 1.42 9.72 2.83 13.21 1.42 16.71 4.41 19 5.5 22.59 9.19 22.32 12 24.41 14.81 22.32 18.5 22.59 19.59 19 22.58 16.71 21.17 13.21 22.58 9.72 19.59 7.41 18.5 3.82 14.81 4.09 12 2ZM10.09 16.72L7.29 13.91 8.71 12.5 10.09 13.88 15.34 8.63 16.76 10.05 10.09 16.72Z"/>
              </svg>
            )}
          </span>
          <span className="feed-post__time">{timeAgo(post.created_at)}</span>
        </div>
        <button
          className={`feed-post__follow ${followed ? 'feed-post__follow--active' : ''}`}
          onClick={handleFollow}
          disabled={subLoading}
        >
          {followed ? '✓ Подписан' : '+ Подписаться'}
        </button>
      </div>

      {post.text && (
        <p className="feed-post__text">
          {expanded || !isLong ? post.text : post.text.slice(0, SHORT) + '...'}
          {isLong && (
            <button className="feed-post__expand" onClick={() => setExpanded(!expanded)}>
              {expanded ? ' Свернуть' : ' Читать далее'}
            </button>
          )}
        </p>
      )}

      <TagPills tags={post.tags} onTagClick={onTagClick} />

      <div className="feed-post__media" onClick={() => navigate(`/business/${post.business_id}`)}>
        <img src={media} alt={post.text?.slice(0, 30)} loading="lazy" />
        {post.media_type === 'VIDEO' && <div className="feed-post__play">▶</div>}
      </div>

      <div className="feed-post__actions">
        <button
          className={`feed-post__action ${saved ? 'feed-post__action--saved' : ''}`}
          onClick={() => requireAuth(() => setSaved(s => !s))}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? '#f59e0b' : 'none'} stroke={saved ? '#f59e0b' : 'currentColor'} strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
          {saved ? 'Сохранено' : 'Сохранить'}
        </button>
        <button className="feed-post__action" onClick={() => navigate(`/business/${post.business_id}`)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          Открыть
        </button>
        <button className="feed-post__action feed-post__action--share">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

// ── Product card (feed style) ─────────────────────────────────────────────────
function FeedProduct({ product, onTagClick }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [saved, setSaved] = useState(false)

  const img      = product.image_display || PROD_IMGS[product.id % PROD_IMGS.length]
  const priceStr = product.price != null
    ? `${Number(product.price).toLocaleString('ru-RU')} ${product.currency_symbol || product.currency}`
    : 'Цена по запросу'

  const requireAuth = (cb) => {
    if (!user) { navigate('/login'); return }
    cb()
  }

  return (
    <div className="feed-product">
      <div className="feed-product__img-wrap" onClick={() => navigate(`/business/${product.business_id}`)}>
        <img src={img} alt={product.name} loading="lazy" />
        <div className="feed-product__save-btn"
          onClick={e => { e.stopPropagation(); requireAuth(() => setSaved(!saved)) }}
          title="В избранное">
          <svg width="16" height="16" viewBox="0 0 24 24" fill={saved ? '#f59e0b' : 'none'} stroke={saved ? '#f59e0b' : '#fff'} strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
      </div>
      <div className="feed-product__body">
        <p className="feed-product__biz" onClick={() => navigate(`/business/${product.business_id}`)}>
          {product.business_name}
        </p>
        <h3 className="feed-product__name">{product.name}</h3>
        <TagPills tags={product.tags} onTagClick={onTagClick} />
        <div className="feed-product__footer">
          <span className="feed-product__price">{priceStr}</span>
          <button className="feed-product__btn" onClick={() => navigate(`/business/${product.business_id}`)}>
            Подробнее
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Tweet card (compact post) ────────────────────────────────────────────────
function TweetCard({ post, onTagClick }) {
  const navigate = useNavigate()
  const logo = post.business_logo
    ? (post.business_logo.startsWith('http') ? post.business_logo : `https://api.101-school.uz${post.business_logo}`)
    : FALLBACK_LOGO
  const media = post.media_display || null

  return (
    <div className="feed-tweet" onClick={() => navigate(`/business/${post.business_id}`)}>
      <img className="feed-tweet__avatar" src={logo} alt={post.business_name} />
      <div className="feed-tweet__body">
        <div className="feed-tweet__top">
          <span className="feed-tweet__name">
            {post.business_name}
            {post.is_verified && (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#2196f3" style={{marginLeft:3,verticalAlign:'middle'}}>
                <path d="M12 2L9.19 4.09 5.5 3.82 4.41 7.41 1.42 9.72 2.83 13.21 1.42 16.71 4.41 19 5.5 22.59 9.19 22.32 12 24.41 14.81 22.32 18.5 22.59 19.59 19 22.58 16.71 21.17 13.21 22.58 9.72 19.59 7.41 18.5 3.82 14.81 4.09 12 2ZM10.09 16.72L7.29 13.91 8.71 12.5 10.09 13.88 15.34 8.63 16.76 10.05 10.09 16.72Z"/>
              </svg>
            )}
          </span>
          <span className="feed-tweet__time">{timeAgo(post.created_at)}</span>
        </div>
        <p className="feed-tweet__text">{post.text?.length > 140 ? post.text.slice(0, 140) + '...' : post.text}</p>
        <TagPills tags={post.tags} onTagClick={onTagClick} />
        {media && <img className="feed-tweet__media" src={media} alt="" loading="lazy" />}
      </div>
    </div>
  )
}

// ── News card (feed style) ──────────────────────────────────────────────────
function FeedNewsCard({ item, onTagClick }) {
  const navigate = useNavigate()
  const img = item.media_display || item.media_url || null

  return (
    <div className="feed-news-card" onClick={() => navigate(`/news/${item.id}`)}>
      {img && (
        <div className="feed-news-card__img-wrap">
          <img src={img} alt={item.title} loading="lazy" />
          <span className="feed-news-card__badge">{item.news_type === 'PLATFORM' ? 'Платформа' : 'Бизнес'}</span>
        </div>
      )}
      <div className="feed-news-card__body">
        <h3 className="feed-news-card__title">{item.title}</h3>
        <p className="feed-news-card__text">{item.text?.length > 100 ? item.text.slice(0, 100) + '...' : item.text}</p>
        <TagPills tags={item.tags} onTagClick={onTagClick} />
        <span className="feed-news-card__source">{item.business_name || item.author_name || 'MessengerShop'}</span>
      </div>
    </div>
  )
}

// ── Business mini-card ────────────────────────────────────────────────────────
function FeedBizCard({ biz }) {
  const navigate = useNavigate()
  const logo = biz.logo
    ? (biz.logo.startsWith('http') ? biz.logo : `https://api.101-school.uz${biz.logo}`)
    : `https://i.pravatar.cc/100?u=${biz.id}`
  return (
    <div className="feed-biz-card" onClick={() => navigate(`/business/${biz.id}`)}>
      <img className="feed-biz-card__logo" src={logo} alt={biz.brand_name} />
      <div className="feed-biz-card__info">
        <span className="feed-biz-card__name">{biz.brand_name}</span>
        <span className="feed-biz-card__cat">{CATEGORY_LABELS[biz.category] || biz.category}</span>
      </div>
      {biz.is_verified && <span className="feed-biz-card__verified">✓</span>}
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function FeedSkeleton() {
  return (
    <div className="feed-post feed-post--skeleton">
      <div className="feed-post__header">
        <div className="fsk-circle" />
        <div style={{flex:1,display:'flex',flexDirection:'column',gap:6}}>
          <div className="fsk-line" style={{width:'40%'}} />
          <div className="fsk-line" style={{width:'20%'}} />
        </div>
      </div>
      <div className="fsk-media" />
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function FeedPage() {
  const [posts, setPosts]       = useState([])
  const [businesses, setBiz]    = useState([])
  const [news, setNews]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('all') // all | posts | tweets | services | products | news
  const [activeTag, setActiveTag] = useState(null)
  const navigate = useNavigate()
  const { getAccessToken, user } = useAuth()
  const GUEST_LIMIT = 6

  useEffect(() => {
    getAccessToken().then(token =>
      Promise.all([apiGetPosts(token), apiGetBusinesses(), apiGetNews()])
        .then(([p, b, n]) => { setPosts(p); setBiz(b); setNews(Array.isArray(n) ? n : []) })
        .catch(() => {})
        .finally(() => setLoading(false))
    )
  }, [])

  // Products/Services from businesses
  const allItems = businesses.flatMap(b =>
    (b.products || []).map(p => ({ ...p, business_id: b.id, business_name: b.brand_name }))
  )
  const allProducts = allItems.filter(p => p.product_type !== 'SERVICE')
  const allServices = allItems.filter(p => p.product_type === 'SERVICE')

  // Collect all unique tags
  const allTags = useMemo(() => {
    const set = new Set()
    posts.forEach(p => (p.tags || []).forEach(t => set.add(t)))
    allItems.forEach(p => (p.tags || []).forEach(t => set.add(t)))
    news.forEach(n => (n.tags || []).forEach(t => set.add(t)))
    return [...set].sort()
  }, [posts, allItems, news])

  const handleTagClick = (tag) => {
    setActiveTag(prev => prev === tag ? null : tag)
  }

  // Filter by active tag
  const hasTag = (item) => !activeTag || (item.tags || []).includes(activeTag)
  const fPosts = posts.filter(hasTag)
  const fProducts = allProducts.filter(hasTag)
  const fServices = allServices.filter(hasTag)
  const fNews = news.filter(hasTag)

  const TABS = [
    { key: 'all',      label: 'Всё' },
    { key: 'posts',    label: 'Посты' },
    { key: 'tweets',   label: 'Твиты' },
    { key: 'services', label: 'Услуги' },
    { key: 'products', label: 'Продукты' },
    { key: 'news',     label: 'Новости' },
  ]

  return (
    <div className="feed-page">
      <Header />

      <main className="feed-page__main">
        {/* Stories strip */}
        <div className="feed-page__stories">
          <Stories />
        </div>

        {/* Tabs */}
        <div className="feed-page__tabs">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`feed-page__tab ${tab === t.key ? 'feed-page__tab--active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tag filter */}
        {allTags.length > 0 && (
          <div className="feed-page__tag-filter">
            <button
              className={`feed-page__tag-btn ${!activeTag ? 'feed-page__tag-btn--active' : ''}`}
              onClick={() => setActiveTag(null)}
            >
              Все
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                className={`feed-page__tag-btn ${activeTag === tag ? 'feed-page__tag-btn--active' : ''}`}
                onClick={() => handleTagClick(tag)}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        <div className="feed-page__layout">
          {/* ── Main feed ── */}
          <div className="feed-page__feed">
            {loading ? (
              [0,1,2].map(i => <FeedSkeleton key={i} />)
            ) : (
              <>
                {/* ── Посты ── */}
                {(tab === 'all' || tab === 'posts') && (() => {
                  const visiblePosts = user ? fPosts : fPosts.slice(0, GUEST_LIMIT)
                  const hasMore = !user && fPosts.length > GUEST_LIMIT
                  return (
                    <>
                      {tab === 'all' && visiblePosts.length > 0 && (
                        <div className="feed-section-label"><span>Посты</span></div>
                      )}
                      {(tab === 'all' ? visiblePosts.slice(0, 4) : visiblePosts).map(post => (
                        <FeedPost key={`post-${post.id}`} post={post} onTagClick={handleTagClick} />
                      ))}
                      {hasMore && tab === 'posts' && (
                        <div className="feed-auth-gate">
                          <div className="feed-auth-gate__blur" />
                          <div className="feed-auth-gate__box">
                            <div className="feed-auth-gate__icon">🔒</div>
                            <p className="feed-auth-gate__text">Войдите, чтобы видеть все публикации</p>
                            <button className="feed-auth-gate__btn" onClick={() => navigate('/login')}>Войти</button>
                            <button className="feed-auth-gate__reg" onClick={() => navigate('/register')}>Регистрация</button>
                          </div>
                        </div>
                      )}
                    </>
                  )
                })()}

                {/* ── Твиты ── */}
                {(tab === 'all' || tab === 'tweets') && fPosts.length > 0 && (
                  <>
                    {tab === 'all' && (
                      <div className="feed-section-label">
                        <span>Твиты</span>
                        <button onClick={() => setTab('tweets')}>Все →</button>
                      </div>
                    )}
                    <div className="feed-tweets-list">
                      {(user ? fPosts : fPosts.slice(0, GUEST_LIMIT)).slice(0, tab === 'all' ? 4 : undefined).map(post => (
                        <TweetCard key={`tweet-${post.id}`} post={post} onTagClick={handleTagClick} />
                      ))}
                    </div>
                  </>
                )}

                {/* ── Услуги ── */}
                {(tab === 'all' || tab === 'services') && fServices.length > 0 && (
                  <>
                    {tab === 'all' && (
                      <div className="feed-section-label">
                        <span>Услуги</span>
                        <button onClick={() => setTab('services')}>Все →</button>
                      </div>
                    )}
                    <div className="feed-products-grid">
                      {(user ? fServices : fServices.slice(0, GUEST_LIMIT)).slice(0, tab === 'all' ? 6 : undefined).map(p => (
                        <FeedProduct key={`svc-${p.id}`} product={p} onTagClick={handleTagClick} />
                      ))}
                    </div>
                  </>
                )}

                {/* ── Продукты ── */}
                {(tab === 'all' || tab === 'products') && fProducts.length > 0 && (
                  <>
                    {tab === 'all' && (
                      <div className="feed-section-label">
                        <span>Продукты</span>
                        <button onClick={() => setTab('products')}>Все →</button>
                      </div>
                    )}
                    <div className="feed-products-grid">
                      {(user ? fProducts : fProducts.slice(0, GUEST_LIMIT)).slice(0, tab === 'all' ? 6 : undefined).map(p => (
                        <FeedProduct key={`prod-${p.id}`} product={p} onTagClick={handleTagClick} />
                      ))}
                    </div>
                  </>
                )}

                {/* ── Новости ── */}
                {(tab === 'all' || tab === 'news') && fNews.length > 0 && (
                  <>
                    {tab === 'all' && (
                      <div className="feed-section-label">
                        <span>Новости</span>
                        <button onClick={() => setTab('news')}>Все →</button>
                      </div>
                    )}
                    <div className="feed-news-list">
                      {fNews.slice(0, tab === 'all' ? 3 : undefined).map(item => (
                        <FeedNewsCard key={`news-${item.id}`} item={item} onTagClick={handleTagClick} />
                      ))}
                    </div>
                  </>
                )}

                {/* Auth gate for tab=all */}
                {tab === 'all' && !user && (posts.length > GUEST_LIMIT || allItems.length > GUEST_LIMIT) && (
                  <div className="feed-auth-gate">
                    <div className="feed-auth-gate__blur" />
                    <div className="feed-auth-gate__box">
                      <div className="feed-auth-gate__icon">🔒</div>
                      <p className="feed-auth-gate__text">Войдите, чтобы видеть все публикации</p>
                      <button className="feed-auth-gate__btn" onClick={() => navigate('/login')}>Войти</button>
                      <button className="feed-auth-gate__reg" onClick={() => navigate('/register')}>Регистрация</button>
                    </div>
                  </div>
                )}

                {activeTag && fPosts.length === 0 && fProducts.length === 0 && fServices.length === 0 && fNews.length === 0 && (
                  <div className="feed-page__empty">
                    По тегу <strong>#{activeTag}</strong> ничего не найдено
                  </div>
                )}

                {!loading && !activeTag && posts.length === 0 && allItems.length === 0 && news.length === 0 && (
                  <div className="feed-page__empty">
                    Лента пуста. Запусти <code>python manage.py seed</code>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Sidebar ── */}
          <aside className="feed-page__sidebar">
            <div className="feed-sidebar-card">
              <h3 className="feed-sidebar-card__title">Компании</h3>
              {businesses.slice(0, 6).map(b => (
                <FeedBizCard key={b.id} biz={b} />
              ))}
              <button className="feed-sidebar-card__more" onClick={() => navigate('/')}>
                Все компании →
              </button>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  )
}
