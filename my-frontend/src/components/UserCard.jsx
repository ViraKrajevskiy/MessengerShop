import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useViewed } from '../context/ViewedContext'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useAuthGate } from './AuthGate'
import { resolveUrl } from '../utils/urlUtils'
import './UserCard.css'

const CARD_PHOTOS = [
  'https://picsum.photos/id/64/400/530',
  'https://picsum.photos/id/177/400/530',
  'https://picsum.photos/id/239/400/530',
  'https://picsum.photos/id/306/400/530',
  'https://picsum.photos/id/338/400/530',
  'https://picsum.photos/id/342/400/530',
  'https://picsum.photos/id/349/400/530',
  'https://picsum.photos/id/366/400/530',
  'https://picsum.photos/id/399/400/530',
  'https://picsum.photos/id/429/400/530',
]

export default function UserCard({ id, name = 'Имя', city = 'Город', badge = null, type = 'card', logo = null, planType = 'FREE', isOnline = false }) {
  const { addViewed } = useViewed()
  const { user } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { guard, AuthModal } = useAuthGate()

  const FAVS_KEY = 'biz_favorites'
  const [fav, setFav] = useState(false)

  useEffect(() => {
    if (!user) { setFav(false); return }
    const stored = JSON.parse(localStorage.getItem(FAVS_KEY) || '[]')
    setFav(stored.includes(id))
  }, [user, id])

  const toggleFav = (e) => {
    e.stopPropagation()
    guard(() => {
      const stored = JSON.parse(localStorage.getItem(FAVS_KEY) || '[]')
      let next
      if (stored.includes(id)) {
        next = stored.filter(x => x !== id)
      } else {
        next = [...stored, id]
      }
      localStorage.setItem(FAVS_KEY, JSON.stringify(next))
      setFav(next.includes(id))
    })
  }

  const videoRef = useRef(null)

  const rawPhoto = logo ? resolveUrl(logo) : CARD_PHOTOS[id % CARD_PHOTOS.length]
  const isVideo = logo && /\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(logo)

  const handleMouseEnter = () => { if (isVideo && videoRef.current) videoRef.current.play() }
  const handleMouseLeave = () => {
    if (isVideo && videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }

  const handleClick = () => {
    addViewed({ id, name, city, badge, type })
    navigate(`/business/${id}`)
  }

  const handleMessage = (e) => {
    e.stopPropagation()
    guard(() => navigate('/messenger'))
  }

  return (
    <>
      <div className={`user-card${planType === 'VIP' ? ' user-card--vip-plan' : planType === 'PRO' ? ' user-card--pro-plan' : ''}`} onClick={handleClick}>
        <div className="user-card__image" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          {isVideo
            ? <video ref={videoRef} className="user-card__photo" src={rawPhoto} muted loop playsInline preload="metadata" />
            : <img className="user-card__photo" src={rawPhoto} alt={name} loading="lazy" width="400" height="530" />
          }
          {planType === 'VIP' ? (
            <span className="user-card__badge user-card__badge--vip">VIP</span>
          ) : planType === 'PRO' ? (
            <span className="user-card__badge user-card__badge--pro">PRO</span>
          ) : badge ? (
            <span className="user-card__badge">{badge}</span>
          ) : null}

          {isOnline && <span className="user-card__online-dot" />}

          {/* Action buttons — появляются при hover */}
          <div className="user-card__actions">
            <button
              className={`user-card__action-btn${fav ? ' user-card__action-btn--liked' : ''}`}
              onClick={toggleFav}
              title={fav ? t('user_removeFav') : t('user_addFav')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
              </svg>
            </button>
            <button
              className="user-card__action-btn user-card__action-btn--msg"
              onClick={handleMessage}
              title={t('user_write')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="user-card__info">
          <span className="user-card__name">{name}</span>
          <span className="user-card__city">{city}</span>
        </div>
      </div>
      <AuthModal />
    </>
  )
}
