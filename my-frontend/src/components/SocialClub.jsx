import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGetPosts } from '../api/businessApi'
import { timeAgo } from '../utils/timeUtils'
import { resolveUrl } from '../utils/urlUtils'
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

function PostCard({ post, onClick }) {
  const [saved, setSaved] = useState(post.is_favorited || false)

  const media = resolveUrl(post.media_display) || FALLBACK_IMGS[post.id % FALLBACK_IMGS.length]
  const caption = post.text?.length > 55 ? post.text.slice(0, 55) + '...' : post.text

  return (
    <div className="sc-card" onClick={onClick}>
      <div className="sc-card__image">
        <img className="sc-card__photo" src={media} alt="" loading="lazy" />
        <span className="sc-card__time-badge">{timeAgo(post.created_at)}</span>
        {post.media_type === 'VIDEO' && <div className="sc-card__play">▶</div>}
        <div className="sc-card__actions">
          <button
            className={`sc-card__save-btn ${saved ? 'sc-card__save-btn--active' : ''}`}
            onClick={e => { e.stopPropagation(); setSaved(s => !s) }}
            title="Сохранить"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill={saved ? '#f59e0b' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        </div>
      </div>
      <div className="sc-card__info">
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
  const navigate = useNavigate()

  useEffect(() => {
    apiGetPosts()
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [])

  if (!loading && posts.length === 0) return null

  const displayed = loading ? [0, 1, 2, 3] : posts.slice(0, 4)

  return (
    <section className="social-club">
      <div className="social-club__header">
        <h2 className="section-title">Публикации</h2>
        <button className="social-club__link" onClick={() => navigate('/feed?tab=posts')}>
          Все публикации &rarr;
        </button>
      </div>

      <div className="social-club__grid">
        {displayed.map((post, i) =>
          loading
            ? <SkeletonCard key={i} />
            : <PostCard key={post.id} post={post} onClick={() => navigate(`/business/${post.business_id}`)} />
        )}
      </div>
    </section>
  )
}
