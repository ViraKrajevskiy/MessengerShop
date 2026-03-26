import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGetPosts } from '../api/businessApi'
import './SocialClub.css'

const FALLBACK_IMGS = [
  'https://picsum.photos/id/342/800/600',
  'https://picsum.photos/id/1025/800/600',
  'https://picsum.photos/id/177/800/600',
  'https://picsum.photos/id/1062/800/600',
  'https://picsum.photos/id/239/800/600',
  'https://picsum.photos/id/1074/800/600',
  'https://picsum.photos/id/306/800/600',
  'https://picsum.photos/id/338/800/600',
]
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
  const [saved, setSaved] = useState(post.is_favorited || false)

  const fixUrl = (url) => {
    if (!url) return null
    if (url.startsWith('http')) return url
    return 'https://api.101-school.uz' + url
  }
  const media = fixUrl(post.media_display) || FALLBACK_IMGS[post.id % FALLBACK_IMGS.length]
  const caption = post.text?.length > 55 ? post.text.slice(0, 55) + '...' : post.text

  const handleSave = (e) => {
    e.stopPropagation()
    setSaved(s => !s)
  }

  return (
    <div className="sc-card" onClick={() => onMediaClick(post)}>
      <div className="sc-card__image">
        <img className="sc-card__photo" src={media} alt="" loading="lazy" />
        <span className="sc-card__time-badge">{timeAgo(post.created_at)}</span>
        {post.media_type === 'VIDEO' && <div className="sc-card__play">▶</div>}
        <div className="sc-card__actions">
          <button className={`sc-card__save-btn ${saved ? 'sc-card__save-btn--active' : ''}`} onClick={handleSave} title="Сохранить">
            <svg width="14" height="14" viewBox="0 0 24 24" fill={saved ? '#f59e0b' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        </div>
      </div>
      <div className="sc-card__info" onClick={(e) => { e.stopPropagation(); onAvatarClick(post) }}>
        <span className="sc-card__name">{post.business_name}</span>
        {caption && <span className="sc-card__caption">{caption}</span>}
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="sc-card sc-card--skeleton">
      <div className="sk-media" />
      <div className="sc-card__info">
        <div className="sk-line" style={{ width: '70%', height: 13 }} />
        <div className="sk-line" style={{ width: '50%', height: 10, marginTop: 5 }} />
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
