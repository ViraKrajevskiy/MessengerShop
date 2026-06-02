import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAuthGate } from './AuthGate'
import { apiGetPosts } from '../api/businessApi'
import { postFavorites } from '../utils/mediaFavorites'
import { resolveUrl } from '../utils/urlUtils'
import { makeInitialAvatar } from '../utils/defaults'
// Дизайн точ-в-точ как у блоков «Бизнесы …» (BusinessRankSidebar)
import './BusinessRankSidebar.css'

const PREVIEW_SIZE = 5

export default function TweetsSidebar({ posts: postsProp, title = 'Твиты' }) {
  const navigate = useNavigate()
  const { user, getAccessToken, tokens } = useAuth()
  const { guard, AuthModal } = useAuthGate()

  const [posts, setPosts] = useState(postsProp || [])
  const [favIds, setFavIds] = useState([])

  useEffect(() => {
    if (Array.isArray(postsProp)) { setPosts(postsProp); return }
    apiGetPosts(tokens?.access)
      .then(data => setPosts(Array.isArray(data) ? data : []))
      .catch(() => setPosts([]))
  }, [postsProp, tokens?.access])

  useEffect(() => {
    if (!user) { setFavIds([]); return }
    setFavIds(postFavorites.getIds())
    return postFavorites.onChange(setFavIds)
  }, [user])

  // Сердечки здесь рисуются из локального стора — приводим его к серверной
  // правде (post.is_favorited), иначе устаревшая запись в localStorage держит
  // твит «лайкнутым» даже после перезагрузки.
  useEffect(() => {
    if (!user) return
    posts.forEach(p => {
      if (typeof p.is_favorited === 'boolean') postFavorites.setFavorite(p.id, p.is_favorited)
    })
  }, [user, posts])

  const toggleFav = (e, id) => {
    e.stopPropagation()
    // Геттер вместо awaited-токена — сердечко переключается мгновенно, синк в фоне.
    guard(() => { postFavorites.toggle(id, getAccessToken) })
  }

  const list = posts.slice(0, PREVIEW_SIZE)

  return (
    <aside className="brs brs--tweets">
      <h3 className="brs__title">{title}</h3>
      <div className="brs__list">
        {list.length === 0 ? (
          Array.from({ length: PREVIEW_SIZE }).map((_, i) => (
            <div key={i} className="brs__item brs__item--skeleton">
              <div className="brs__avatar brs__avatar--skeleton" />
              <div className="brs__body">
                <div className="brs__sk-line" style={{ width: '70%' }} />
                <div className="brs__sk-line" style={{ width: '40%', marginTop: 5 }} />
              </div>
            </div>
          ))
        ) : (
          list.map(post => {
            const logo = post.business_logo
              ? resolveUrl(post.business_logo)
              : makeInitialAvatar(post.business_name)
            const isFav = favIds.includes(post.id)
            return (
              <div
                key={post.id}
                className="brs__item"
                onClick={() => navigate(`/business/${post.business_id}`)}
              >
                <img
                  className="brs__avatar"
                  src={logo}
                  alt={post.business_name}
                  loading="lazy"
                  onError={e => { e.target.onerror = null; e.target.src = makeInitialAvatar(post.business_name) }}
                />
                <div className="brs__body">
                  <span className="brs__name">{post.business_name}</span>
                  {post.text && <span className="brs__city">{post.text}</span>}
                </div>
                <div className="brs__meta">
                  <button
                    className={`brs__heart${isFav ? ' brs__heart--active' : ''}`}
                    onClick={(e) => toggleFav(e, post.id)}
                    aria-label="favorite"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={isFav ? '#9b6dff' : 'none'} stroke="#9b6dff" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
      <AuthModal />
    </aside>
  )
}
