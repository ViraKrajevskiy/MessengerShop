import { useNavigate } from 'react-router-dom'
import { useViewed } from '../context/ViewedContext'
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

export default function UserCard({ id, name = 'Имя', city = 'Город', badge = null, type = 'card' }) {
  const { addViewed } = useViewed()
  const navigate = useNavigate()

  const photo = CARD_PHOTOS[id % CARD_PHOTOS.length]

  const handleClick = () => {
    addViewed({ id, name, city, badge, type })
    navigate(`/profile/${id}`)
  }

  return (
    <div className="user-card" onClick={handleClick}>
      <div className="user-card__image">
        <img className="user-card__photo" src={photo} alt={name} loading="lazy" />
        {badge && <span className="user-card__badge">{badge}</span>}
      </div>
      <div className="user-card__info">
        <span className="user-card__name">{name}</span>
        <span className="user-card__city">{city}</span>
      </div>
    </div>
  )
}
