import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useViewed } from '../context/ViewedContext'
import { useLanguage } from '../context/LanguageContext'
import { apiGetBusinesses } from '../api/businessApi'
import { makeInitialAvatar } from '../utils/defaults'
import './NewUsers.css'

export default function NewUsers() {
  const [businesses, setBusinesses] = useState([])
  const [showAll, setShowAll] = useState(false)
  const { addViewed } = useViewed()
  const { t } = useLanguage()
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
        <h2 className="section-title">{t('newBiz_title')}</h2>
        <button className="new-users__show-all" onClick={() => setShowAll(!showAll)}>
          {showAll ? t('newBiz_collapse') : t('newBiz_showAll')}
        </button>
      </div>

      <div className="new-users__subtitle">
        {t('newBiz_sub')}
      </div>

      <div className={`new-users__grid ${showAll ? 'new-users__grid--expanded' : ''}`}>
        {displayed.map(biz => {
          const logo = biz.logo
            ? (biz.logo.startsWith('http') ? biz.logo : `https://api.101-school.uz${biz.logo}`)
            : makeInitialAvatar(biz.brand_name)
          return (
            <div key={biz.id} className="new-users__item" onClick={() => handleClick(biz)}>
              <div className="new-users__avatar">
                <img className="new-users__avatar-img" src={logo} alt={biz.brand_name} loading="lazy" />
              </div>
              <span className="new-users__name">{biz.brand_name}</span>
              <span className="new-users__city">{biz.city || '—'}</span>
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
