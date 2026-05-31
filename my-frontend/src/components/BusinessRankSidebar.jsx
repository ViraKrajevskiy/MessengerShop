import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { makeInitialAvatar } from '../utils/defaults'
import { resolveUrl } from '../utils/urlUtils'
import { useAuth } from '../context/AuthContext'
import { useAuthGate } from './AuthGate'
import { getLocalFavorites, toggleFavorite, onFavoritesChange } from '../utils/favorites'
import './BusinessRankSidebar.css'

export default function BusinessRankSidebar({ title, businesses = [], limit = 5 }) {
  const navigate = useNavigate()
  const { user, getAccessToken } = useAuth()
  const { guard, AuthModal } = useAuthGate()
  const list = businesses.slice(0, limit)

  const [favs, setFavs] = useState([])

  useEffect(() => {
    if (!user) { setFavs([]); return }
    setFavs(getLocalFavorites())
    return onFavoritesChange(setFavs)
  }, [user])

  const toggleFav = (e, id) => {
    e.stopPropagation()
    // Передаём getAccessToken как геттер — локальный тогл срабатывает мгновенно,
    // а запрос токена/сети уходит в фон (без задержки сердечка).
    guard(() => { toggleFavorite(id, getAccessToken) })
  }

  return (
    <aside className="brs">
      <h3 className="brs__title">{title}</h3>
      <div className="brs__list">
        {list.length === 0 ? (
          Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="brs__item brs__item--skeleton">
              <div className="brs__avatar brs__avatar--skeleton" />
              <div className="brs__body">
                <div className="brs__sk-line" style={{ width: '70%' }} />
                <div className="brs__sk-line" style={{ width: '40%', marginTop: 5 }} />
              </div>
            </div>
          ))
        ) : (
          list.map(b => {
            const logo = b.logo
              ? resolveUrl(b.logo)
              : makeInitialAvatar(b.brand_name || b.name || '?')
            const name = b.brand_name || b.name || ''
            const city = b.city || ''
            const rating = b.rating ?? 0
            const isFav = favs.includes(b.id)
            return (
              <div
                key={b.id}
                className="brs__item"
                onClick={() => navigate(`/business/${b.id}`)}
              >
                <img
                  className="brs__avatar"
                  src={logo}
                  alt={name}
                  loading="lazy"
                  onError={e => { e.target.onerror = null; e.target.src = makeInitialAvatar(name) }}
                />
                <div className="brs__body">
                  <span className="brs__name">{name}</span>
                  {city && <span className="brs__city">{city}</span>}
                </div>
                <div className="brs__meta">
                  <span className="brs__rating">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#9b6dff">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    <span>{rating}</span>
                  </span>
                  <button
                    className={`brs__heart${isFav ? ' brs__heart--active' : ''}`}
                    onClick={(e) => toggleFav(e, b.id)}
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
