import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGetPosts } from '../api/businessApi'
import { useAuth } from '../context/AuthContext'
import './SocialClub.css'

const FALLBACK_IMG = 'https://picsum.photos/id/342/800/600'
const FALLBACK_LOGO = 'https://i.pravatar.cc/80?u=default'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'только что'
  if (mins < 60) return `${mins} мин. назад`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ч. назад`
  const days = Math.floor(hours / 24)
  return `${days} дн. назад`
}

function PostCard({ post, onAvatarClick, onMediaClick }) {
  const [expanded, setExpanded] = useState(false)
  const [followed, setFollowed] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(post.likes_count || 0)
  const { user } = useAuth()
  const navigate = useNavigate()

  const SHORT_LEN = 90
  const isLong = post.text && post.text.length > SHORT_LEN
  const displayText = expanded || !isLong ? post.text : post.text.slice(0, SHORT_LEN) + '...'

  const logo = post.business_logo || FALLBACK_LOGO
  const media = post.media_display || FALLBACK_IMG

  const handleFollow = () => {
    if (!user) { navigate('/login'); return }
    setFollowed(!followed)
  }

  const handleLike = () => {
    if (!user) { navigate('/login'); return }
    setLikes(l => liked ? l - 1 : l + 1)
    setLiked(!liked)
  }

  return (
    <div className="sc-card">
      <div className="sc-card__header">
        <img
          className="sc-card__avatar"
          src={logo}
          alt={post.business_name}
          onClick={(e) => { e.stopPropagation(); onAvatarClick(post) }}
          title="Открыть профиль"
        />
        <div className="sc-card__meta">
          <span className="sc-card__author">
            {post.business_name}
            {post.is_verified && (
              <span className="sc-card__verified" title="Верифицированный">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#2196f3">
                  <path d="M12 2L9.19 4.09 5.5 3.82 4.41 7.41 1.42 9.72 2.83 13.21 1.42 16.71 4.41 19 5.5 22.59 9.19 22.32 12 24.41 14.81 22.32 18.5 22.59 19.59 19 22.58 16.71 21.17 13.21 22.58 9.72 19.59 7.41 18.5 3.82 14.81 4.09 12 2ZM10.09 16.72L7.29 13.91 8.71 12.5 10.09 13.88 15.34 8.63 16.76 10.05 10.09 16.72Z"/>
                </svg>
              </span>
            )}
          </span>
          <span className="sc-card__time">{timeAgo(post.created_at)}</span>
        </div>
        <button
          className={`sc-card__subscribe ${followed ? 'sc-card__subscribe--active' : ''}`}
          onClick={handleFollow}
        >
          {followed ? 'Подписан' : 'Подписаться'}
        </button>
      </div>

      <div className="sc-card__media" onClick={() => onMediaClick(post)} title="Открыть публикацию">
        <img className="sc-card__media-img" src={media} alt={post.text?.slice(0, 30)} loading="lazy" />
        {post.media_type === 'VIDEO' && (
          <div className="sc-card__play">▶</div>
        )}
      </div>

      <div className="sc-card__body">
        {post.text && (
          <>
            <p className="sc-card__text">{displayText}</p>
            {isLong && (
              <button className="sc-card__read-more" onClick={() => setExpanded(!expanded)}>
                {expanded ? 'Свернуть' : 'Читать далее'}
              </button>
            )}
          </>
        )}
        <div className="sc-card__actions">
          <button className={`sc-card__like ${liked ? 'sc-card__like--active' : ''}`} onClick={handleLike}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill={liked ? '#e53935' : 'none'} stroke={liked ? '#e53935' : 'currentColor'} strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            {likes}
          </button>
        </div>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="sc-card sc-card--skeleton">
      <div className="sc-card__header">
        <div className="sk-circle" style={{ width: 40, height: 40 }} />
        <div className="sc-card__meta">
          <div className="sk-line" style={{ width: '60%', height: 13 }} />
          <div className="sk-line" style={{ width: '35%', height: 10, marginTop: 5 }} />
        </div>
      </div>
      <div className="sk-media" />
      <div className="sc-card__body">
        <div className="sk-line" style={{ width: '95%', height: 12 }} />
        <div className="sk-line" style={{ width: '75%', height: 12, marginTop: 6 }} />
      </div>
    </div>
  )
}

export default function SocialClub() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState(0)
  const navigate = useNavigate()
  const touchStartX = useRef(0)
  const mouseStartX = useRef(0)
  const isDragging = useRef(false)
  const visible = 3

  useEffect(() => {
    apiGetPosts()
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [])

  const maxOffset = Math.max(0, posts.length - visible)
  const prev = () => setOffset(o => Math.max(0, o - 1))
  const next = () => setOffset(o => Math.min(maxOffset, o + 1))

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const handleTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 50) { if (dx < 0) next(); else prev() }
  }

  const handleMouseDown = (e) => { mouseStartX.current = e.clientX; isDragging.current = true }
  const handleMouseUp = (e) => {
    if (!isDragging.current) return
    isDragging.current = false
    const dx = e.clientX - mouseStartX.current
    if (Math.abs(dx) > 50) { if (dx < 0) next(); else prev() }
  }
  const handleMouseLeave = () => { isDragging.current = false }

  const goToBusiness = (post) => navigate(`/business/${post.business_id}`)

  if (loading) {
    return (
      <section className="social-club">
        <div className="social-club__header">
          <h2 className="section-title">Публикации</h2>
        </div>
        <div className="social-club__carousel">
          <div className="social-club__list">
            {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
          </div>
        </div>
      </section>
    )
  }

  if (posts.length === 0) return null

  return (
    <section className="social-club">
      <div className="social-club__header">
        <h2 className="section-title">Публикации</h2>
        <button className="social-club__link" onClick={() => navigate('/')}>
          Все публикации &rarr;
        </button>
      </div>

      <div
        className="social-club__carousel"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: 'grab', userSelect: 'none' }}
      >
        <button className="social-club__arrow social-club__arrow--left" onClick={prev} disabled={offset === 0}>
          &#8249;
        </button>

        <div className="social-club__list">
          {posts.slice(offset, offset + visible).map(post => (
            <PostCard
              key={post.id}
              post={post}
              onAvatarClick={goToBusiness}
              onMediaClick={goToBusiness}
            />
          ))}
        </div>

        <button className="social-club__arrow social-club__arrow--right" onClick={next} disabled={offset >= maxOffset}>
          &#8250;
        </button>
      </div>

      <div className="social-club__dots">
        {Array.from({ length: maxOffset + 1 }, (_, i) => (
          <button
            key={i}
            className={`social-club__dot ${i === offset ? 'social-club__dot--active' : ''}`}
            onClick={() => setOffset(i)}
          />
        ))}
      </div>
    </section>
  )
}
