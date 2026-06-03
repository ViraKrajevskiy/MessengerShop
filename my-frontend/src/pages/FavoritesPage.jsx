import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Seo from '../components/Seo'
import UserCard from '../components/UserCard'
import PostCard from '../components/PostCard'
import '../components/UserCard.css'
import '../components/PostCard.css'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { apiGetBusinesses } from '../api/businessApi'
import { fetchFavoriteBusinesses, getLocalFavorites, onFavoritesChange } from '../utils/favorites'
import {
  postFavorites, newsFavorites,
  fetchFavoritePosts, fetchFavoriteNews,
} from '../utils/mediaFavorites'
import { resolveUrl } from '../utils/urlUtils'
import { timeAgo } from '../utils/timeUtils'
import './FavoritesPage.css'

function bizToCard(b) {
  return {
    id: b.id,
    name: b.brand_name,
    city: b.city || '',
    logo: b.logo,
    cover: b.cover || null,
    card_media: b.card_media || null,
    is_verified: b.is_verified,
    verified_at: b.verified_at || null,
    plan_type: b.plan_type || 'FREE',
    owner_is_online: b.owner_is_online,
  }
}

// Карточка избранной новости с кнопкой удаления из избранного
function NewsFavCard({ item, onRemove }) {
  const navigate = useNavigate()
  const img = item.media_display ? resolveUrl(item.media_display) : null
  return (
    <div className="fav-news-card" onClick={() => navigate(`/news/${item.id}`)}>
      {img && (
        <div className="fav-news-card__img">
          <img src={img} alt={item.title} loading="lazy" />
        </div>
      )}
      <div className="fav-news-card__body">
        <h3 className="fav-news-card__title">{item.title}</h3>
        {item.text && <p className="fav-news-card__text">{item.text.slice(0, 120)}{item.text.length > 120 ? '…' : ''}</p>}
        <div className="fav-news-card__meta">
          <span>{item.business_name || item.author_name || 'MessengerShop'}</span>
          <span>·</span>
          <span>{timeAgo(item.created_at)}</span>
        </div>
      </div>
      <button
        className="fav-news-card__remove"
        title="Убрать из избранного"
        onClick={(e) => { e.stopPropagation(); onRemove(item.id) }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
        </svg>
      </button>
    </div>
  )
}

const TABS = [
  { key: 'companies', label: 'Компании' },
  { key: 'posts',     label: 'Посты' },
  { key: 'tweets',    label: 'Твиты' },
  { key: 'news',      label: 'Новости' },
]

export default function FavoritesPage() {
  const navigate = useNavigate()
  const { user, getAccessToken } = useAuth()
  const { t } = useLanguage()

  const [tab, setTab] = useState('companies')
  const [loading, setLoading] = useState(true)

  const [favBiz, setFavBiz] = useState([])
  const [favIds, setFavIds] = useState(() => getLocalFavorites())

  const [favPosts, setFavPosts] = useState([])
  const [favPostIds, setFavPostIds] = useState(() => postFavorites.getIds())

  const [favNews, setFavNews] = useState([])
  const [favNewsIds, setFavNewsIds] = useState(() => newsFavorites.getIds())

  useEffect(() => {
    if (!user) { setLoading(false); return }
    let cancelled = false
    setLoading(true)
    ;(async () => {
      const token = await getAccessToken()

      // ── Компании ──
      try {
        const data = await fetchFavoriteBusinesses(token)
        if (!cancelled) { setFavBiz(data.businesses || []); setFavIds(data.ids || []) }
      } catch {
        try {
          const all = await apiGetBusinesses()
          const ids = getLocalFavorites()
          if (!cancelled) { setFavBiz((Array.isArray(all) ? all : []).filter(b => ids.includes(b.id))); setFavIds(ids) }
        } catch { if (!cancelled) setFavBiz([]) }
      }

      // ── Посты / твиты (мигрируем локальные → бэкенд, затем тянем список) ──
      try { await postFavorites.syncFromServer(token) } catch { /* offline */ }
      try {
        const posts = await fetchFavoritePosts(token)
        if (!cancelled) { setFavPosts(Array.isArray(posts) ? posts : []); setFavPostIds(postFavorites.getIds()) }
      } catch { if (!cancelled) setFavPosts([]) }

      // ── Новости ──
      try { await newsFavorites.syncFromServer(token) } catch { /* offline */ }
      try {
        const news = await fetchFavoriteNews(token)
        if (!cancelled) { setFavNews(Array.isArray(news) ? news : []); setFavNewsIds(newsFavorites.getIds()) }
      } catch { if (!cancelled) setFavNews([]) }

      if (!cancelled) setLoading(false)
    })()
    return () => { cancelled = true }
  }, [user, getAccessToken])

  // Живое снятие из избранного (на этой или другой вкладке/устройстве)
  useEffect(() => onFavoritesChange(setFavIds), [])
  useEffect(() => postFavorites.onChange(setFavPostIds), [])
  useEffect(() => newsFavorites.onChange(setFavNewsIds), [])

  const favBusinesses = useMemo(
    () => favBiz.filter(b => favIds.includes(b.id)).map(bizToCard),
    [favBiz, favIds]
  )
  // Твит — отдельная платная сущность (флаг is_tweet), пост — всё остальное.
  const visiblePosts = useMemo(
    () => favPosts.filter(p => favPostIds.includes(p.id) && !p.is_tweet),
    [favPosts, favPostIds]
  )
  const visibleTweets = useMemo(
    () => favPosts.filter(p => favPostIds.includes(p.id) && p.is_tweet),
    [favPosts, favPostIds]
  )
  const visibleNews = useMemo(
    () => favNews.filter(n => favNewsIds.includes(n.id)),
    [favNews, favNewsIds]
  )

  const counts = {
    companies: favBusinesses.length,
    posts: visiblePosts.length,
    tweets: visibleTweets.length,
    news: visibleNews.length,
  }

  const removeNews = async (id) => {
    const token = await getAccessToken()
    await newsFavorites.toggle(id, token)
  }

  const renderSkeleton = () => (
    <div className="favorites-grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="fav-skel">
          <div className="fav-skel__img" />
          <div className="fav-skel__line" style={{ width: '70%' }} />
          <div className="fav-skel__line" style={{ width: '40%' }} />
        </div>
      ))}
    </div>
  )

  const emptyState = (text, btnLabel, to) => (
    <div className="favorites-page__empty">
      <p>{text}</p>
      <button className="favorites-page__btn" onClick={() => navigate(to)}>{btnLabel}</button>
    </div>
  )

  return (
    <div className="favorites-page">
      <Seo title={t('nav_favorites')} />
      <Header />
      <main className="favorites-page__main">
        <h1 className="favorites-page__title">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
          </svg>
          {t('nav_favorites')}
        </h1>

        {!user ? (
          emptyState(t('favorites_loginRequired'), t('nav_login'), '/login')
        ) : (
          <>
            {/* Вкладки */}
            <div className="favorites-page__tabs">
              {TABS.map(tb => (
                <button
                  key={tb.key}
                  className={`favorites-page__tab ${tab === tb.key ? 'favorites-page__tab--active' : ''}`}
                  onClick={() => setTab(tb.key)}
                >
                  {tb.label}
                  {counts[tb.key] > 0 && <span className="favorites-page__tab-count">{counts[tb.key]}</span>}
                </button>
              ))}
            </div>

            {loading ? renderSkeleton() : (
              <>
                {/* Компании */}
                {tab === 'companies' && (
                  favBusinesses.length === 0
                    ? emptyState(t('favorites_empty'), t('nav_catalog'), '/catalog')
                    : (
                      <div className="favorites-grid">
                        {favBusinesses.map(u => (
                          <UserCard
                            key={u.id} id={u.id} name={u.name} city={u.city}
                            logo={u.logo} cover={u.cover} cardMedia={u.card_media}
                            planType={u.plan_type} type="all"
                            isOnline={!!u.owner_is_online}
                            isVerified={!!u.is_verified} verifiedAt={u.verified_at}
                          />
                        ))}
                      </div>
                    )
                )}

                {/* Посты */}
                {tab === 'posts' && (
                  visiblePosts.length === 0
                    ? emptyState('Нет избранных постов', t('nav_feed'), '/feed')
                    : (
                      <div className="favorites-posts-grid">
                        {visiblePosts.map(p => <PostCard key={`post-${p.id}`} post={p} />)}
                      </div>
                    )
                )}

                {/* Твиты */}
                {tab === 'tweets' && (
                  visibleTweets.length === 0
                    ? emptyState('Нет избранных твитов', t('nav_feed'), '/feed')
                    : (
                      <div className="favorites-posts-grid">
                        {visibleTweets.map(p => <PostCard key={`tweet-${p.id}`} post={p} />)}
                      </div>
                    )
                )}

                {/* Новости */}
                {tab === 'news' && (
                  visibleNews.length === 0
                    ? emptyState('Нет избранных новостей', t('nav_feed'), '/feed')
                    : (
                      <div className="fav-news-list">
                        {visibleNews.map(n => <NewsFavCard key={`news-${n.id}`} item={n} onRemove={removeNews} />)}
                      </div>
                    )
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}
