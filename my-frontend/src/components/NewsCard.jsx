import { useNavigate } from 'react-router-dom'

const FALLBACK_IMG = 'https://picsum.photos/id/399/800/600'

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

export default function NewsCard({ item }) {
  const navigate = useNavigate()
  if (!item) return null

  const img    = item.media_display || FALLBACK_IMG
  const source = item.business_name || item.author_name || 'MessengerShop'
  const isPlatform = item.news_type === 'PLATFORM'
  const SHORT  = 90
  const isLong = item.text && item.text.length > SHORT

  return (
    <div className="news-card" onClick={() => navigate(`/news/${item.id}`)}>
      {/* Header — same as post-card__header */}
      <div className="news-card__header">
        <div className="news-card__source-icon">
          {isPlatform ? '📢' : '🏢'}
        </div>
        <div className="news-card__meta">
          <span className="news-card__source-name">{source}</span>
          <span className="news-card__time">{timeAgo(item.created_at)}</span>
        </div>
      </div>

      {/* Image 4:3 */}
      <div className="news-card__image">
        <img
          src={img}
          alt={item.title}
          className="news-card__photo"
          loading="lazy"
          width="400"
          height="300"
        />
        <span className="news-card__badge">
          {isPlatform ? 'Платформа' : 'Бизнес'}
        </span>
      </div>

      {/* Body — title + excerpt */}
      <div className="news-card__body">
        <p className="news-card__title">{item.title}</p>
        </div>

      {/* Footer */}
      <div className="news-card__footer">
        <span className="news-card__read-more">Читать далее →</span>
      </div>
    </div>
  )
}
