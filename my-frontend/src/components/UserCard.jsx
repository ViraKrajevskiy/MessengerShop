import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useViewed } from '../context/ViewedContext'
import { useAuthGate } from './AuthGate'
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

export default function UserCard({ id, name = 'Имя', city = 'Город', badge = null, type = 'card', logo = null }) {
  const { addViewed } = useViewed()
  const navigate = useNavigate()
  const { guard, AuthModal } = useAuthGate()
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(Math.floor(Math.random() * 40) + 1)

  // Используем логотип бизнеса, или fallback из picsum
  const photo = logo
    ? (logo.startsWith('http') ? logo : `http://127.0.0.1:8000${logo}`)
    : CARD_PHOTOS[id % CARD_PHOTOS.length]

  const handleClick = () => {
    addViewed({ id, name, city, badge, type })
    navigate(`/business/${id}`)
  }

  const handleLike = (e) => {
    e.stopPropagation()
    guard(() => {
      setLiked(l => !l)
      setLikes(n => liked ? n - 1 : n + 1)
    })
  }

  const handleMessage = (e) => {
    e.stopPropagation()
    guard(() => navigate('/messenger'))
  }

  return (
    <>
      <div className="user-card" onClick={handleClick}>
        <div className="user-card__image">
          <img className="user-card__photo" src={photo} alt={name} loading="lazy" />
          {badge && <span className="user-card__badge">{badge}</span>}

          {/* Action buttons — появляются при hover */}
          <div className="user-card__actions">
            <button
              className={`user-card__action-btn user-card__action-btn--like ${liked ? 'user-card__action-btn--liked' : ''}`}
              onClick={handleLike}
              title="Лайк"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              {likes}
            </button>
            <button
              className="user-card__action-btn user-card__action-btn--msg"
              onClick={handleMessage}
              title="Написать"
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
