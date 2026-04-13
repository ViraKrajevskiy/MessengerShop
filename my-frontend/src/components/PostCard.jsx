import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiToggleSubscription } from '../api/businessApi'
import { makeInitialAvatar } from '../utils/defaults'
import VideoModal from './VideoModal'
import './PostCard.css'

const FALLBACK_IMG = 'https://picsum.photos/id/342/800/600'

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'только что'
  if (mins < 60) return `${mins} мин. назад`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ч. назад`
  return `${Math.floor(hours / 24)} дн. назад`
}

export default function PostCard({ post, onDelete }) {
  const navigate = useNavigate()
  const { user, getAccessToken } = useAuth()
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [followed, setFollowed] = useState(post.is_subscribed || false)
  const [subLoading, setSubLoading] = useState(false)
  const [fav, setFav] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState(null)

  const FAVS_KEY = 'post_favorites'

  useEffect(() => {
    if (!user) { setFav(false); return }
    const stored = JSON.parse(localStorage.getItem(FAVS_KEY) || '[]')
    setFav(stored.includes(post.id))
  }, [user, post.id])

  const toggleFav = (e) => {
    e.stopPropagation()
    if (!user) { navigate('/login'); return }
    const stored = JSON.parse(localStorage.getItem(FAVS_KEY) || '[]')
    let next
    if (stored.includes(post.id)) {
      next = stored.filter(x => x !== post.id)
    } else {
      next = [...stored, post.id]
    }
    localStorage.setItem(FAVS_KEY, JSON.stringify(next))
    setFav(next.includes(post.id))
  }

  const logo = post.business_logo
    ? (post.business_logo.startsWith('http') ? post.business_logo : `https://api.101-school.uz${post.business_logo}`)
    : makeInitialAvatar(post.business_name)
  const media = post.media_display || FALLBACK_IMG
  const SHORT = 100
  const isLong = post.text && post.text.length > SHORT

  const handleFollow = async (e) => {
    e.stopPropagation()
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
    <>
      {selectedVideo && (
        <VideoModal
          videoUrl={selectedVideo.url}
          title={selectedVideo.title}
          onClose={() => setSelectedVideo(null)}
        />
      )}
      <div className="post-card" onClick={() => navigate(`/business/${post.business_id}`)}>
      <div className="post-card__header">
        <img className="post-card__avatar" src={logo} alt={post.business_name}
          onClick={(e) => { e.stopPropagation(); navigate(`/business/${post.business_id}`) }} />
        <div className="post-card__meta">
          <span className="post-card__name">
            {post.business_name}
            {post.is_verified && (
              <svg className="post-card__verified" width="14" height="14" viewBox="0 0 24 24" fill="#2196f3">
                <path d="M12 2L9.19 4.09 5.5 3.82 4.41 7.41 1.42 9.72 2.83 13.21 1.42 16.71 4.41 19 5.5 22.59 9.19 22.32 12 24.41 14.81 22.32 18.5 22.59 19.59 19 22.58 16.71 21.17 13.21 22.58 9.72 19.59 7.41 18.5 3.82 14.81 4.09 12 2ZM10.09 16.72L7.29 13.91 8.71 12.5 10.09 13.88 15.34 8.63 16.76 10.05 10.09 16.72Z"/>
              </svg>
            )}
          </span>
          {post.created_at && (
            <span className="post-card__time">{timeAgo(post.created_at)}</span>
          )}
        </div>
        <button
          className={`post-card__follow ${followed ? 'post-card__follow--active' : ''}`}
          onClick={handleFollow}
          disabled={subLoading}
        >
          {followed ? '✓ Подписан' : 'Подписаться'}
        </button>
      </div>

      <div
        className={`post-card__image${post.media_type === 'VIDEO' ? ' post-card__image--video' : ''}`}
        onClick={() => post.media_type === 'VIDEO' && setSelectedVideo({ url: post.media_display, title: post.text })}
      >
        <img src={media} alt="" loading="lazy" width="400" height="300" draggable={false} />
        {post.media_type === 'VIDEO' && <div className="post-card__play">▶</div>}
      </div>

      {post.text && (
        <div className="post-card__body">
          <p className={`post-card__text${expanded ? ' post-card__text--expanded' : ''}`}>
            {isLong && !expanded ? post.text.slice(0, SHORT) + '...' : post.text}
          </p>
          {isLong && (
            <span
              className="post-card__readmore"
              onClick={(e) => { e.stopPropagation(); setExpanded(prev => !prev) }}
            >
              {expanded ? 'Свернуть' : 'Читать далее'}
            </span>
          )}
        </div>
      )}

      <div className="post-card__footer">
        <button
          className={`post-card__fav ${fav ? 'post-card__fav--active' : ''}`}
          onClick={toggleFav}
          title={fav ? 'Убрать из избранного' : 'В избранное'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
          </svg>
          <span>{fav ? '1' : '0'}</span>
        </button>

        {onDelete && (
          <button
            className="post-card__delete"
            onClick={async (e) => {
              e.stopPropagation()
              if (deleteLoading) return
              setDeleteLoading(true)
              try { await onDelete(post.id) } finally { setDeleteLoading(false) }
            }}
            disabled={deleteLoading}
            title="Удалить пост"
          >
            {deleteLoading
              ? <span className="post-card__delete-spinner" />
              : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4h6v2"/>
                </svg>
              )
            }
          </button>
        )}
      </div>
    </div>
    </>
  )
}
