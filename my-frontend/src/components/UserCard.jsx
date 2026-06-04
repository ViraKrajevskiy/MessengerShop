import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useViewed } from '../context/ViewedContext'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useAuthGate } from './AuthGate'
import { resolveUrl } from '../utils/urlUtils'
import { makeCardPlaceholder } from '../utils/defaults'
import VerifiedBadge from './VerifiedBadge'
import { isFavorite, setFavorite, toggleFavorite, onFavoritesChange } from '../utils/favorites'
import './UserCard.css'

function fmtDate(dt) {
  if (!dt) return ''
  return new Date(dt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function UserCard({ id, name = 'Имя', city = 'Город', badge = null, type = 'card', logo = null, cover = null, cardMedia = null, planType = 'FREE', isOnline = false, isVerified = false, verifiedAt = null, isFavorited = null }) {
  const { addViewed } = useViewed()
  const { user, getAccessToken } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { guard, AuthModal } = useAuthGate()

  const [fav, setFav] = useState(() => isFavorite(id))

  useEffect(() => {
    if (!user) { setFav(false); return }
    // If the parent has server-truth (is_favorited), reconcile localStorage to it
    // so a stale cache entry doesn't show the heart filled after reload.
    if (isFavorited !== null) {
      setFavorite(id, isFavorited)
      setFav(isFavorited)
    } else {
      setFav(isFavorite(id))
    }
    return onFavoritesChange(ids => setFav(ids.includes(id)))
  }, [user, id, isFavorited])

  const toggleFav = (e) => {
    e.stopPropagation()
    // Геттер вместо awaited-токена: локальный тогл + событие срабатывают мгновенно
    // (подписка onFavoritesChange обновит `fav` в этом же тике), сеть — в фоне.
    guard(() => { toggleFavorite(id, getAccessToken) })
  }

  const videoRef = useRef(null)

  const placeholder = makeCardPlaceholder(name, id)
  const mediaSource = cardMedia || cover || logo || null
  const rawPhoto = mediaSource ? resolveUrl(mediaSource) : placeholder
  const isVideo = mediaSource && /\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(mediaSource)

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
    guard(() => navigate('/messenger', { state: { openBizId: id } }))
  }

  return (
    <>
      <div className={`user-card${planType === 'VIP' ? ' user-card--vip-plan' : planType === 'PRO' ? ' user-card--pro-plan' : ''}`} onClick={handleClick}>
        <div className="user-card__image" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          {isVideo
            ? <video ref={videoRef} className="user-card__photo" src={rawPhoto} muted loop playsInline preload="metadata" />
            : <img className="user-card__photo" src={rawPhoto} alt={name} loading="lazy" width="400" height="530" onError={e => { e.target.onerror = null; e.target.src = placeholder }} />
          }
          {planType === 'VIP' ? (
            <span className="user-card__badge user-card__badge--vip">VIP</span>
          ) : planType === 'PRO' ? (
            <span className="user-card__badge user-card__badge--pro">PRO</span>
          ) : badge ? (
            <span className="user-card__badge">{badge}</span>
          ) : null}

          {isVerified && (
            <span className="user-card__verified-badge">
              <VerifiedBadge size={13} />
            </span>
          )}

          {isOnline && <span className="user-card__online-dot" />}

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
