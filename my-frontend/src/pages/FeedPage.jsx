import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Seo from '../components/Seo'
import Stories from '../components/Stories'
import PostCard from '../components/PostCard'
import VerifiedBadge from '../components/VerifiedBadge'
import TweetsSidebar from '../components/TweetsSidebar'
import BusinessRankSidebar from '../components/BusinessRankSidebar'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { apiGetPosts, apiGetBusinesses, apiGetNews, CATEGORY_LABELS } from '../api/businessApi'
import { postFavorites, newsFavorites } from '../utils/mediaFavorites'
import { makeInitialAvatar } from '../utils/defaults'
import { timeAgo } from '../utils/timeUtils'
import { resolveUrl } from '../utils/urlUtils'
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

// ── Tweet card (compact post) ────────────────────────────────────────────────
function TweetCard({ post, onTagClick }) {
  const navigate = useNavigate()
  const { user, getAccessToken } = useAuth()
  const { t } = useLanguage()
  const [fav, setFav] = useState(false)

  useEffect(() => {
    if (!user) { setFav(false); return }
    // Сервер — источник истины; локальный стор приводим к нему, иначе
    // устаревшая запись в localStorage залипает после перезагрузки.
    const serverFav = !!post.is_favorited
    postFavorites.setFavorite(post.id, serverFav)
    setFav(serverFav)
    return postFavorites.onChange(ids => setFav(ids.includes(post.id)))
  }, [user, post.id, post.is_favorited])

  const toggleFav = async (e) => {
    e.stopPropagation()
    if (!user) { navigate('/login'); return }
    setFav(prev => !prev)
    const token = await getAccessToken()
    await postFavorites.toggle(post.id, token)
  }

  const logo = post.business_logo
    ? resolveUrl(post.business_logo)
    : makeInitialAvatar(post.business_name)

  return (
    <div className="feed-tweet" onClick={() => navigate(`/business/${post.business_id}`)}>
      <img className="feed-tweet__avatar" src={logo} alt={post.business_name} width="40" height="40" />
      <div className="feed-tweet__body">
        <div className="feed-tweet__top">
          <span className="feed-tweet__name">
            <span className="feed-tweet__name-text">{post.business_name}</span>
            {post.is_verified && (
              <VerifiedBadge size={13} style={{flexShrink:0}} />
            )}
          </span>
          <span className="feed-tweet__time">{timeAgo(post.created_at)}</span>
        </div>
        <p className="feed-tweet__text">{post.text}</p>
        <TagPills tags={post.tags} onTagClick={onTagClick} />
        <div className="feed-tweet__footer">
          <button
            className={`feed-tweet__fav ${fav ? 'feed-tweet__fav--active' : ''}`}
            onClick={toggleFav}
            title={fav ? t('post_removeFav') : t('post_addFav')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
            <span>{fav ? t('post_removeFav') : t('post_addFav')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── News card (feed style) ──────────────────────────────────────────────────
function FeedNewsCard({ item, onTagClick }) {
  const navigate = useNavigate()
  const { user, getAccessToken } = useAuth()
  const { t } = useLanguage()
  const [fav, setFav] = useState(false)
  const img = item.media_display || item.media_url || null

  useEffect(() => {
    if (!user) { setFav(false); return }
    const serverFav = !!item.is_favorited
    newsFavorites.setFavorite(item.id, serverFav)
    setFav(serverFav)
    return newsFavorites.onChange(ids => setFav(ids.includes(item.id)))
  }, [user, item.id, item.is_favorited])

  const toggleFav = async (e) => {
    e.stopPropagation()
    if (!user) { navigate('/login'); return }
    setFav(prev => !prev)
    const token = await getAccessToken()
    await newsFavorites.toggle(item.id, token)
  }

  return (
    <div className="feed-news-card" onClick={() => navigate(`/news/${item.id}`)}>
      {img && (
        <div className="feed-news-card__img-wrap">
          <img src={img} alt={item.title} loading="lazy" />
          <span className="feed-news-card__badge">{item.news_type === 'PLATFORM' ? t('platform') : t('news_business')}</span>
        </div>
      )}
      <div className="feed-news-card__body">
        <h3 className="feed-news-card__title">{item.title}</h3>
        <p className="feed-news-card__text">{item.text?.length > 100 ? item.text.slice(0, 100) + '...' : item.text}</p>
        <TagPills tags={item.tags} onTagClick={onTagClick} />
        <div className="feed-news-card__footer">
          <span className="feed-news-card__source">{item.business_name || item.author_name || 'MessengerShop'}</span>
          <button
            className={`feed-news-card__fav ${fav ? 'feed-news-card__fav--active' : ''}`}
            onClick={toggleFav}
            title={fav ? t('post_removeFav') : t('post_addFav')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Business mini-card ────────────────────────────────────────────────────────
function FeedBizCard({ biz }) {
  const navigate = useNavigate()
  const logo = biz.logo
    ? resolveUrl(biz.logo)
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
  const [tab, setTab]           = useState('posts') // posts | news | tweets
  const [activeTags, setActiveTags] = useState([])
  const [filterVip, setFilterVip] = useState(false)
  const [filterVerified, setFilterVerified] = useState(false)
  const [filterNew, setFilterNew] = useState(false)
  const [filterCity, setFilterCity] = useState('')
  const [sortOrder, setSortOrder] = useState('none') // none | date_desc | date_asc | price_desc | price_asc
  const [page, setPage] = useState(0)
  const navigate = useNavigate()
  const { getAccessToken, user } = useAuth()
  const { t } = useLanguage()
  const CARDS_PER_PAGE = 25
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

  // Фото / Видео — по типу медиа. Подпись (text) не исключает пост:
  // фото с текстом всё равно фото, видео с текстом — видео.
  const fPhotos = fPosts.filter(p => p.media_display && p.media_type !== 'VIDEO')
  const fVideos = fPosts.filter(p => p.media_display && p.media_type === 'VIDEO')

  const TABS = [
    { key: 'posts',  label: 'feed_tab_posts'  },
    { key: 'news',   label: 'feed_tab_news'   },
    { key: 'tweets', label: 'feed_tab_tweets' },
  ]

  return (
    <div className="feed-page">
      <Seo title={t('feed_title')} description={t('feed_sub')} path="/feed" />
      <Header />

      <div className="feed-page__shell">
      <main className="feed-page__main">
        {/* Tabs */}
        <div className="feed-page__tabs">
          {TABS.map(tb => (
            <button
              key={tb.key}
              className={`feed-page__tab ${tab === tb.key ? 'feed-page__tab--active' : ''}`}
              onClick={() => setTab(tb.key)}
            >
              {t(tb.label)}
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
              <span className="feed-filter-chip__icon">&#10003;</span> {t('catalog_verified')}
            </button>
            <button
              className={`feed-filter-chip feed-filter-chip--new ${filterNew ? 'feed-filter-chip--on' : ''}`}
              onClick={() => setFilterNew(v => !v)}
            >
              <span className="feed-filter-chip__icon">&#9679;</span> {t('catalog_new')}
            </button>

            <div className="feed-filters__sep" />

            <select
              name="sort-order"
              className="feed-filters__sort"
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value)}
            >
              <option value="none">{t('catalog_sort')}</option>
              <option value="date_desc">{t('catalog_newest')}</option>
              <option value="date_asc">{t('catalog_oldest')}</option>
              <option value="price_asc">{t('catalog_priceAsc')}</option>
              <option value="price_desc">{t('catalog_priceDesc')}</option>
            </select>

            {allCities.length > 0 && (
              <select
                name="filter-city"
                className="feed-filters__sort"
                value={filterCity}
                onChange={e => setFilterCity(e.target.value)}
              >
                <option value="">{t('filter_allCities')}</option>
                {allCities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}

            {hasActiveFilters && (
              <button className="feed-filter-chip feed-filter-chip--clear" onClick={clearFilters}>
                &#10005; {t('reset_filters')}
              </button>
            )}
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div className="feed-filters__tags">
              <div className="feed-filters__tags-list feed-filters__tags-list--expanded">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    className={`feed-filter-chip feed-filter-chip--tag ${activeTags.includes(tag) ? 'feed-filter-chip--on' : ''}`}
                    onClick={() => handleTagClick(tag)}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
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
                      // Посты = всё, что не твит (с медиа и текстовые посты).
                      // Твиты — отдельная платная сущность, у них своя вкладка.
                      const allPosts = fPosts.filter(p => !p.is_tweet)
                      return (
                        <div className="post-cards-grid post-cards-grid--5">
                          {allPosts.map(post => (
                            <PostCard key={`post-${post.id}`} post={post} />
                          ))}
                        </div>
                      )
                    })()}
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
                    {fNews.length === 0 && <div className="feed-page__empty">{t('feed_noNews')}</div>}
                  </>
                )}

                {/* ── Твиты (text-only posts) ── */}
                {tab === 'tweets' && (() => {
                  const fTweets = fPosts.filter(p => p.is_tweet)
                  return (
                    <>
                      <div className="feed-tweets-list">
                        {fTweets.map(post => (
                          <TweetCard key={`tweet-${post.id}`} post={post} onTagClick={handleTagClick} />
                        ))}
                      </div>
                      {fTweets.length === 0 && <div className="feed-page__empty">{t('feed_noTweets')}</div>}
                    </>
                  )
                })()}

                {hasActiveFilters && fPosts.length === 0 && fNews.length === 0 && tab !== 'news' && tab !== 'tweets' && (
                  <div className="feed-page__empty">
                    {t('feed_nothingFiltered')}
                    <button className="feed-page__empty-reset" onClick={clearFilters}>{t('reset_filters')}</button>
                  </div>
                )}

                {!loading && !hasActiveFilters && posts.length === 0 && news.length === 0 && (
                  <div className="feed-page__empty">{t('feed_empty')}</div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <aside className="feed-page__sidebar">
        <TweetsSidebar posts={posts} />
        <BusinessRankSidebar
          title={t('home_popularBiz') || 'Самые популярные Бизнесы на этой неделе'}
          businesses={[...businesses].sort((a, b) => (b.rating || 0) - (a.rating || 0))}
        />
        <BusinessRankSidebar
          title={t('home_viewedBiz') || 'Самые просматриваемые Бизнесы на этой неделе'}
          businesses={[...businesses].sort((a, b) => (b.views_count || b.id || 0) - (a.views_count || a.id || 0))}
        />
      </aside>
      </div>


    </div>
  )
}
