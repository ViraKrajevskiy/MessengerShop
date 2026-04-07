import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useViewed } from '../context/ViewedContext'
import { useLanguage } from '../context/LanguageContext'
import './VipSection.css'

const VIP_PHOTOS = [
  'https://picsum.photos/id/1027/400/530',
  'https://picsum.photos/id/1012/400/530',
  'https://picsum.photos/id/1025/400/530',
  'https://picsum.photos/id/1074/400/530',
  'https://picsum.photos/id/1035/400/530',
  'https://picsum.photos/id/1062/400/530',
  'https://picsum.photos/id/1064/400/530',
  'https://picsum.photos/id/1084/400/530',
]

export default function VipSection({ users = [], loading = false }) {
  const [showAll, setShowAll] = useState(false)
  const { addViewed } = useViewed()
  const { t } = useLanguage()
  const navigate = useNavigate()

  // Show first 2 rows (8 cards) on home, or all on "show all" page
  const displayLimit = 8
  const displayUsers = showAll ? users : users.slice(0, displayLimit)
  const hasMore = users.length > displayLimit

  const handleCardClick = (user) => {
    addViewed({ id: user.id, name: user.name, city: user.city, badge: 'VIP', type: 'vip' })
    navigate(`/business/${user.id}`)
  }

  return (
    <section className="vip-section">
      <div className="vip-section__header">
        <h2 className="vip-section__title">
          <span className="vip-section__crown">&#128081;</span>
          {t('vip_title')}
        </h2>
        {hasMore && !showAll && (
          <button className="vip-section__show-all" onClick={() => setShowAll(true)}>
            {t('newBiz_showAll')}
          </button>
        )}
        {showAll && (
          <button className="vip-section__show-all" onClick={() => setShowAll(false)}>
            {t('newBiz_collapse')}
          </button>
        )}
      </div>

      <div className="vip-section__label">
        <span className="vip-section__label-icon">&#9733;</span>
        {t('vip_promo')}
      </div>

      {loading ? (
        <div className="vip-section__grid">
          {[1,2,3,4].map(i => (
            <div key={i} className="vip-card vip-card--skeleton">
              <div className="vip-card__image">
                <div className="vip-card__skel-img" />
              </div>
              <div className="vip-card__info">
                <div className="vip-card__skel-line" style={{width:'70%'}} />
                <div className="vip-card__skel-line" style={{width:'40%'}} />
              </div>
            </div>
          ))}
        </div>
      ) : displayUsers.length > 0 ? (
        <div className="vip-section__grid">
          {displayUsers.map((user, idx) => (
            <div
              key={user.id}
              className="vip-card"
              onClick={() => handleCardClick(user)}
            >
              <div className="vip-card__image">
                <img
                className="vip-card__photo"
                src={user.logo
                  ? (user.logo.startsWith('http') ? user.logo : `https://api.101-school.uz${user.logo}`)
                  : VIP_PHOTOS[user.id % VIP_PHOTOS.length]}
                alt={user.name}
                loading={idx < 4 ? 'eager' : 'lazy'}
                fetchPriority={idx === 0 ? 'high' : undefined}
                width="400"
                height="530"
              />
                <span className="vip-card__badge">VIP</span>
                <div className="vip-card__overlay">
                  <span className="vip-card__category">{user.category}</span>
                </div>
              </div>
              <div className="vip-card__info">
                <span className="vip-card__name">{user.name}</span>
                <span className="vip-card__city">{user.city}</span>
                {user.tags && user.tags.length > 0 && (
                  <div className="vip-card__tags">
                    {user.tags.slice(0, 2).map((tag, i) => (
                      <span key={i} className="vip-card__tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="vip-section__empty">Нет VIP пользователей по выбранным фильтрам</div>
      )}

      {/* Full page overlay when "Смотреть все" */}
      {showAll && users.length > displayLimit && (
        <div className="vip-section__counter">
          Показано {displayUsers.length} из {users.length} VIP пользователей
        </div>
      )}
    </section>
  )
}
