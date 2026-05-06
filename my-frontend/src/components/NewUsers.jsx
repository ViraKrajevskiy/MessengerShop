import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useViewed } from '../context/ViewedContext'
import { useLanguage } from '../context/LanguageContext'
import { apiGetBusinesses } from '../api/businessApi'
import { makeInitialAvatar } from '../utils/defaults'
import { resolveUrl } from '../utils/urlUtils'
import './NewUsers.css'

const NEW_BUSINESS_LIMIT = 40
const DESKTOP_BUSINESS_LIMIT = 10
const MOBILE_MEDIA_QUERY = '(max-width: 500px)'

export default function NewUsers({ businesses: businessesProp }) {
  const [businesses, setBusinesses] = useState(
    Array.isArray(businessesProp) ? businessesProp.slice(0, NEW_BUSINESS_LIMIT) : []
  )
  const [isMobile, setIsMobile] = useState(false)
  const { addViewed } = useViewed()
  const { t } = useLanguage()
  const navigate = useNavigate()

  useEffect(() => {
    if (Array.isArray(businessesProp)) {
      setBusinesses(businessesProp.slice(0, NEW_BUSINESS_LIMIT))
      return
    }
    apiGetBusinesses()
      .then(data => setBusinesses(data.slice(0, NEW_BUSINESS_LIMIT)))
      .catch(() => {})
  }, [businessesProp])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const media = window.matchMedia(MOBILE_MEDIA_QUERY)
    const update = () => setIsMobile(media.matches)

    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  const displayed = isMobile ? businesses : businesses.slice(0, DESKTOP_BUSINESS_LIMIT)

  const handleClick = (biz) => {
    addViewed({ id: biz.id, name: biz.brand_name, city: biz.city, badge: null, type: 'business' })
    navigate(`/business/${biz.id}`)
  }

  const isLoading = businesses.length === 0

  return (
    <section className="new-users" aria-busy={isLoading || undefined}>
      <div className="new-users__header">
        <h2 className="section-title">{t('newBiz_title')}</h2>
        <button className="new-users__show-all" onClick={() => navigate('/catalog?tab=companies')}>
          {t('newBiz_showAll')}
        </button>
      </div>

      <div className="new-users__subtitle">
        {t('newBiz_sub')}
      </div>

      <div className="new-users__grid">
        {isLoading && Array.from({ length: 10 }).map((_, i) => (
          <div key={`s-${i}`} className="new-users__item new-users__item--skeleton">
            <div className="new-users__avatar new-users__avatar--skeleton" />
            <span className="new-users__name-skeleton" />
            <span className="new-users__city-skeleton" />
          </div>
        ))}
        {!isLoading && displayed.map(biz => {
          const isVideo = biz.logo && /\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(biz.logo)
          const logo = biz.logo
            ? (resolveUrl(biz.logo) || makeInitialAvatar(biz.brand_name))
            : makeInitialAvatar(biz.brand_name)
          return (
            <div key={biz.id} className="new-users__item" onClick={() => handleClick(biz)}>
              <div className="new-users__avatar">
                {isVideo
                  ? <video className="new-users__avatar-img" src={logo} muted playsInline preload="metadata" />
                  : <img className="new-users__avatar-img" src={logo} alt={biz.brand_name} loading="lazy" decoding="async" />
                }
                {biz.owner_is_online && <span className="new-users__online-dot" />}
              </div>
              <span className="new-users__name">{biz.brand_name}</span>
              <span className="new-users__city">{biz.city || '—'}</span>
            </div>
          )
        })}
      </div>


    </section>
  )
}
