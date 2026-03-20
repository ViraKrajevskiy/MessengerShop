import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useViewed } from '../context/ViewedContext'
import { apiGetBusinesses, CATEGORY_LABELS } from '../api/businessApi'
import './NewUsers.css'

const FALLBACK_LOGO = 'https://i.pravatar.cc/150?u='

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

export default function NewUsers() {
  const [businesses, setBusinesses] = useState([])
  const [showAll, setShowAll] = useState(false)
  const { addViewed } = useViewed()
  const navigate = useNavigate()

  useEffect(() => {
    apiGetBusinesses()
      .then(data => setBusinesses(data.slice(0, 20)))
      .catch(() => {})
  }, [])

  const displayed = showAll ? businesses : businesses.slice(0, 10)

  const handleClick = (biz) => {
    addViewed({ id: biz.id, name: biz.brand_name, city: biz.city, badge: null, type: 'business' })
    navigate(`/business/${biz.id}`)
  }

  if (businesses.length === 0) return null

  return (
    <section className="new-users">
      <div className="new-users__header">
        <h2 className="section-title">Новые бизнесы</h2>
        <button className="new-users__show-all" onClick={() => setShowAll(!showAll)}>
          {showAll ? 'Свернуть' : 'Смотреть все'}
        </button>
      </div>

      <div className="new-users__subtitle">
        Новые компании на платформе — будьте первыми клиентами!
      </div>

      <div className={`new-users__grid ${showAll ? 'new-users__grid--expanded' : ''}`}>
        {displayed.map(biz => {
          const logo = biz.logo
            ? (biz.logo.startsWith('http') ? biz.logo : `https://api.101-school.uz${biz.logo}`)
            : `${FALLBACK_LOGO}${biz.id}`
          return (
            <div key={biz.id} className="new-users__item" onClick={() => handleClick(biz)}>
              <div className="new-users__avatar">
                <img className="new-users__avatar-img" src={logo} alt={biz.brand_name} loading="lazy" />
                {biz.is_verified && <div className="new-users__online-dot" style={{ background: '#2196f3' }} />}
              </div>
              <span className="new-users__name">{biz.brand_name}</span>
              <span className="new-users__city">{biz.city || '—'}</span>
              <span className="new-users__time">{timeAgo(biz.created_at)}</span>
            </div>
          )
        })}
      </div>

      {showAll && businesses.length > 10 && (
        <div className="new-users__count">
          Всего бизнесов: <strong>{businesses.length}</strong>
        </div>
      )}
    </section>
  )
}
