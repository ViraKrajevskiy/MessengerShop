import { useNavigate } from 'react-router-dom'
import { useViewed } from '../context/ViewedContext'
import { useLanguage } from '../context/LanguageContext'
import './ViewedBar.css'

const VIEWED_PHOTOS = [
  'https://picsum.photos/id/64/120/160',
  'https://picsum.photos/id/177/120/160',
  'https://picsum.photos/id/239/120/160',
  'https://picsum.photos/id/306/120/160',
  'https://picsum.photos/id/338/120/160',
  'https://picsum.photos/id/342/120/160',
  'https://picsum.photos/id/349/120/160',
  'https://picsum.photos/id/366/120/160',
  'https://picsum.photos/id/399/120/160',
  'https://picsum.photos/id/429/120/160',
]

export default function ViewedBar() {
  const { viewedCards, clearViewed } = useViewed()
  const navigate = useNavigate()
  const { t } = useLanguage()

  // Don't show if nothing has been viewed
  if (viewedCards.length === 0) return null

  const handleClick = (card) => {
    navigate(`/profile/${card.id}`)
  }

  return (
    <div className="viewed-bar">
      <div className="viewed-bar__header">
        <h3 className="viewed-bar__title">{t('viewed_title')}</h3>
        <button className="viewed-bar__clear" onClick={clearViewed}>
          {t('viewed_clear')}
        </button>
      </div>
      <div className="viewed-bar__list">
        {viewedCards.map((card) => (
          <div
            key={`${card.type}-${card.id}`}
            className="viewed-bar__item"
            onClick={() => handleClick(card)}
            title={`${card.name}, ${card.city}`}
          >
            <div className="viewed-bar__thumb">
              <img className="viewed-bar__thumb-img" src={VIEWED_PHOTOS[card.id % VIEWED_PHOTOS.length]} alt={card.name} loading="lazy" />
              {card.badge && (
                <span className="viewed-bar__badge">{card.badge}</span>
              )}
            </div>
            <span className="viewed-bar__name">{card.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
