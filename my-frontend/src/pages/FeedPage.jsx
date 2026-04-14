import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Stories from '../components/Stories'
import PostCard from '../components/PostCard'
import { useAuth } from '../context/AuthContext'
import { apiGetPosts, apiGetBusinesses, apiGetNews, CATEGORY_LABELS } from '../api/businessApi'
import { makeInitialAvatar } from '../utils/defaults'
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

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'только что'
  if (mins < 60) return `${mins} мин. назад`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ч. назад`
  return `${Math.floor(hours / 24)} дн. назад`
}

// ── Tweet card (compact post) ────────────────────────────────────────────────
function TweetCard({ post, onTagClick }) {
  const navigate = useNavigate()
  const logo = post.business_logo
    ? (post.business_logo.startsWith('http') ? post.business_logo : `https://api.101-school.uz${post.business_logo}`)
    : makeInitialAvatar(post.business_name)
  const media = post.media_display || null

  return (
    <div className="feed-tweet" onClick={() => navigate(`/business/${post.business_id}`)}>
      <img className="feed-tweet__avatar" src={logo} alt={post.business_name} width="40" height="40" />
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
    : makeInitialAvatar(biz.brand_name)
  return (
    <div className="feed-biz-card" onClick={() => navigate(`/business/${biz.id}`)}>
      <img className="feed-biz-card__logo" src={logo} alt={biz.brand_name} width="42" height="42" />
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
  const [tab, setTab]           = useState('posts') // posts | photos | videos | news | tweets
  const [activeTags, setActiveTags] = useState([])
  const [filterVip, setFilterVip] = useState(false)
  const [filterVerified, setFilterVerified] = useState(false)
  const [filterNew, setFilterNew] = useState(false)
  const [filterCity, setFilterCity] = useState('')
  const [sortOrder, setSortOrder] = useState('none') // none | date_desc | date_asc | price_desc | price_asc
  const [showAllTags, setShowAllTags] = useState(false)
  const [columns, setColumns] = useState(4)
  const [page, setPage] = useState(0)
  const navigate = useNavigate()
  const { getAccessToken, user } = useAuth()
  const CARDS_PER_PAGE = columns * 5
  const GUEST_LIMIT = 4

  useEffect(() => {
    getAccessToken().then(token =>
      Promise.all([apiGetPosts(token), apiGetBusinesses(), apiGetNews()])
        .then(([p, b, n]) => {
          setPosts(p)
          setBiz(b)
          setNews(Array.isArray(n) ? n : [])
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    )
  }, [])

  // Collect all unique tags
  const allTags = useMemo(() => {
    const set = new Set()
    posts.forEach(p => (p.tags || []).forEach(t => set.add(t)))
    news.forEach(n => (n.tags || []).forEach(t => set.add(t)))
    return [...set].sort()
  }, [posts, news])

  const handleTagClick = (tag) => {
    setActiveTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleColumnsChange = (col) => {
    setColumns(col)
    setPage(0)
  }

  const clearFilters = () => {
    setActiveTags([])
    setFilterVip(false)
    setFilterVerified(false)
    setFilterNew(false)
    setFilterCity('')
    setSortOrder('none')
  }

  const hasActiveFilters = activeTags.length > 0 || filterVip || filterVerified || filterNew || filterCity || sortOrder !== 'none'

  // All unique cities from businesses
  const allCities = useMemo(() => {
    const set = new Set()
    businesses.forEach(b => { if (b.city) set.add(b.city) })
    return [...set].sort()
  }, [businesses])

  // Business city map for filtering posts/products by business city
  const bizCityMap = useMemo(() => {
    const m = new Map()
    businesses.forEach(b => m.set(b.id, b.city))
    return m
  }, [businesses])

  // VIP/verified business IDs for filtering
  const vipBizIds = useMemo(() => new Set(businesses.filter(b => b.is_vip).map(b => b.id)), [businesses])
  const verifiedBizIds = useMemo(() => new Set(businesses.filter(b => b.is_verified).map(b => b.id)), [businesses])

  // Filter by tags + vip/verified + new
  const isNewItem = (item) => {
    if (!item.created_at) return false
    const hoursDiff = (Date.now() - new Date(item.created_at).getTime()) / 3600000
    return hoursDiff < 24
  }
  const passesFilter = (item, bizIdKey = 'business_id') =>
    (activeTags.length === 0 || activeTags.some(t => (item.tags || []).includes(t))) &&
    (!filterVip || vipBizIds.has(item[bizIdKey])) &&
    (!filterVerified || verifiedBizIds.has(item[bizIdKey])) &&
    (!filterNew || isNewItem(item)) &&
    (!filterCity || bizCityMap.get(item[bizIdKey]) === filterCity)

  // Sort helper
  const applySortDate = (arr) => {
    if (sortOrder === 'date_desc') return [...arr].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    if (sortOrder === 'date_asc') return [...arr].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    return arr
  }
  const applySortPrice = (arr) => {
    if (sortOrder === 'price_desc') return [...arr].sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0))
    if (sortOrder === 'price_asc') return [...arr].sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0))
    return applySortDate(arr)
  }

  const fPosts = applySortDate(posts.filter(p => passesFilter(p)))
  const fNews = applySortDate(news.filter(n =>
    (activeTags.length === 0 || activeTags.some(t => (n.tags || []).includes(t))) &&
    (!filterVip || !n.business_id || vipBizIds.has(n.business_id)) &&
    (!filterVerified || !n.business_id || verifiedBizIds.has(n.business_id)) &&
    (!filterNew || isNewItem(n)) &&
    (!filterCity || !n.business_id || bizCityMap.get(n.business_id) === filterCity)
  ))

  // Фото / Видео — фильтрация постов по типу медиа (только без текста)
  const fPhotos = fPosts.filter(p => p.media_display && p.media_type !== 'VIDEO' && !p.text?.trim())
  const fVideos = fPosts.filter(p => p.media_display && p.media_type === 'VIDEO' && !p.text?.trim())

  const TABS = [
    { key: 'posts',  label: 'Посты'   },
    { key: 'photos', label: 'Фото'    },
    { key: 'videos', label: 'Видео'   },
    { key: 'news',   label: 'Новости' },
    { key: 'tweets', label: 'Твиты'   },
  ]

  return (
    <div className="feed-page">
      <Header />

      <main className="feed-page__main">
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

        {/* Grid columns selector */}
        <div className="feed-grid-selector">
          <span className="feed-grid-selector__label">Столбцы:</span>
          {[2, 3, 4, 5].map(col => (
            <button
              key={col}
              className={`feed-grid-selector__btn ${columns === col ? 'feed-grid-selector__btn--active' : ''}`}
              onClick={() => handleColumnsChange(col)}
              title={`${col} карточек в строке`}
            >
              {col}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="feed-filters">
          {/* Status filters + sort */}
          <div className="feed-filters__row">
            <button
              className={`feed-filter-chip feed-filter-chip--vip ${filterVip ? 'feed-filter-chip--on' : ''}`}
              onClick={() => setFilterVip(v => !v)}
            >
              <span className="feed-filter-chip__icon">&#9733;</span> VIP
            </button>
            <button
              className={`feed-filter-chip feed-filter-chip--verified ${filterVerified ? 'feed-filter-chip--on' : ''}`}
              onClick={() => setFilterVerified(v => !v)}
            >
              <span className="feed-filter-chip__icon">&#10003;</span> Проверенные
            </button>
            <button
              className={`feed-filter-chip feed-filter-chip--new ${filterNew ? 'feed-filter-chip--on' : ''}`}
              onClick={() => setFilterNew(v => !v)}
            >
              <span className="feed-filter-chip__icon">&#9679;</span> Новые
            </button>

            <div className="feed-filters__sep" />

            <select
              name="sort-order"
              className="feed-filters__sort"
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value)}
            >
              <option value="none">Сортировка</option>
              <option value="date_desc">Сначала новые</option>
              <option value="date_asc">Сначала старые</option>
              <option value="price_asc">Цена: по возрастанию</option>
              <option value="price_desc">Цена: по убыванию</option>
            </select>

            {allCities.length > 0 && (
              <select
                name="filter-city"
                className="feed-filters__sort"
                value={filterCity}
                onChange={e => setFilterCity(e.target.value)}
              >
                <option value="">Все города</option>
                {allCities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}

            {hasActiveFilters && (
              <button className="feed-filter-chip feed-filter-chip--clear" onClick={clearFilters}>
                &#10005; Сбросить
              </button>
            )}
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div className="feed-filters__tags">
              <div className={`feed-filters__tags-list ${showAllTags ? 'feed-filters__tags-list--expanded' : ''}`}>
                {(showAllTags ? allTags : allTags.slice(0, 8)).map(tag => (
                  <button
                    key={tag}
                    className={`feed-filter-chip feed-filter-chip--tag ${activeTags.includes(tag) ? 'feed-filter-chip--on' : ''}`}
                    onClick={() => handleTagClick(tag)}
                  >
                    #{tag}
                  </button>
                ))}
                {allTags.length > 8 && (
                  <button
                    className="feed-filter-chip feed-filter-chip--more"
                    onClick={() => setShowAllTags(v => !v)}
                  >
                    {showAllTags ? 'Свернуть' : `+${allTags.length - 8}`}
                  </button>
                )}
              </div>
              {activeTags.length > 0 && (
                <div className="feed-filters__active">
                  {activeTags.map(tag => (
                    <span key={tag} className="feed-filter-active-tag" onClick={() => handleTagClick(tag)}>
                      #{tag} <span className="feed-filter-active-tag__x">&#10005;</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="feed-page__layout">
          {/* ── Main feed ── */}
          <div className="feed-page__feed">
            {loading ? (
              [0,1,2].map(i => <FeedSkeleton key={i} />)
            ) : (
              <>
                {/* ── Посты (+ Истории вверху) ── */}
                {tab === 'posts' && (
                  <>
                    <Stories />
                    {(() => {
                      const allPosts = fPosts
                      const hasMore = false
                      const totalPages = Math.ceil(allPosts.length / CARDS_PER_PAGE)
                      const paginatedPosts = allPosts.slice(page * CARDS_PER_PAGE, (page + 1) * CARDS_PER_PAGE)
                      return (
                        <>
                          <div className="post-cards-grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                            {paginatedPosts.map(post => (
                              <PostCard key={`post-${post.id}`} post={post} />
                            ))}
                          </div>
                          {totalPages > 1 && (
                            <div className="feed-pagination">
                              {Array.from({ length: totalPages }).map((_, i) => (
                                <button
                                  key={i}
                                  className={`feed-pagination__btn ${i === page ? 'feed-pagination__btn--active' : ''}`}
                                  onClick={() => { setPage(i); window.scrollTo(0, 0) }}
                                >
                                  {i + 1}
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </>
                )}

                {/* ── Фото ── */}
                {tab === 'photos' && (
                  <>
                    {(() => {
                      const allPhotos = fPhotos
                      const totalPages = Math.ceil(allPhotos.length / CARDS_PER_PAGE)
                      const paginatedPhotos = allPhotos.slice(page * CARDS_PER_PAGE, (page + 1) * CARDS_PER_PAGE)
                      return (
                        <>
                          <div className="post-cards-grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                            {paginatedPhotos.map(post => (
                              <PostCard key={`photo-${post.id}`} post={post} />
                            ))}
                          </div>
                          {totalPages > 1 && (
                            <div className="feed-pagination">
                              {Array.from({ length: totalPages }).map((_, i) => (
                                <button
                                  key={i}
                                  className={`feed-pagination__btn ${i === page ? 'feed-pagination__btn--active' : ''}`}
                                  onClick={() => { setPage(i); window.scrollTo(0, 0) }}
                                >
                                  {i + 1}
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      )
                    })()}
                    {fPhotos.length === 0 && <div className="feed-page__empty">Фото пока нет</div>}
                  </>
                )}

                {/* ── Видео ── */}
                {tab === 'videos' && (
                  <>
                    {(() => {
                      const allVideos = fVideos
                      const totalPages = Math.ceil(allVideos.length / CARDS_PER_PAGE)
                      const paginatedVideos = allVideos.slice(page * CARDS_PER_PAGE, (page + 1) * CARDS_PER_PAGE)
                      return (
                        <>
                          <div className="post-cards-grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                            {paginatedVideos.map(post => (
                              <PostCard key={`video-${post.id}`} post={post} />
                            ))}
                          </div>
                          {totalPages > 1 && (
                            <div className="feed-pagination">
                              {Array.from({ length: totalPages }).map((_, i) => (
                                <button
                                  key={i}
                                  className={`feed-pagination__btn ${i === page ? 'feed-pagination__btn--active' : ''}`}
                                  onClick={() => { setPage(i); window.scrollTo(0, 0) }}
                                >
                                  {i + 1}
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      )
                    })()}
                    {fVideos.length === 0 && <div className="feed-page__empty">Видео пока нет</div>}
                  </>
                )}

                {/* ── Новости ── */}
                {tab === 'news' && (
                  <>
                    <div className="feed-news-list">
                      {fNews.map(item => (
                        <FeedNewsCard key={`news-${item.id}`} item={item} onTagClick={handleTagClick} />
                      ))}
                    </div>
                    {fNews.length === 0 && <div className="feed-page__empty">Новостей пока нет</div>}
                  </>
                )}

                {/* ── Твиты ── */}
                {tab === 'tweets' && (
                  <>
                    <div className="feed-tweets-list">
                      {fPosts.map(post => (
                        <TweetCard key={`tweet-${post.id}`} post={post} onTagClick={handleTagClick} />
                      ))}
                    </div>
                    {fPosts.length === 0 && <div className="feed-page__empty">Твитов пока нет</div>}
                  </>
                )}

                {hasActiveFilters && fPosts.length === 0 && fNews.length === 0 && tab !== 'news' && tab !== 'tweets' && (
                  <div className="feed-page__empty">
                    По выбранным фильтрам ничего не найдено
                    <button className="feed-page__empty-reset" onClick={clearFilters}>Сбросить фильтры</button>
                  </div>
                )}

                {!loading && !hasActiveFilters && posts.length === 0 && news.length === 0 && (
                  <div className="feed-page__empty">Пока нет публикаций</div>
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
