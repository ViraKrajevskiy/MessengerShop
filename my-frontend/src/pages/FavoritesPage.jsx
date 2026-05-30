import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Seo from '../components/Seo'
import UserCard from '../components/UserCard'
import '../components/UserCard.css'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { apiGetBusinesses } from '../api/businessApi'
import './FavoritesPage.css'

const FAVS_KEY = 'biz_favorites'

function bizToCard(b) {
  return {
    id: b.id,
    name: b.brand_name,
    city: b.city || '',
    logo: b.logo,
    cover: b.cover || null,
    card_media: b.card_media || null,
    is_verified: b.is_verified,
    verified_at: b.verified_at || null,
    plan_type: b.plan_type || 'FREE',
    owner_is_online: b.owner_is_online,
  }
}

export default function FavoritesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()

  const [allBiz, setAllBiz] = useState([])
  const [loading, setLoading] = useState(true)
  const [favIds, setFavIds] = useState(() => JSON.parse(localStorage.getItem(FAVS_KEY) || '[]'))

  useEffect(() => {
    setLoading(true)
    apiGetBusinesses()
      .then(biz => setAllBiz(Array.isArray(biz) ? biz : []))
      .catch(() => setAllBiz([]))
      .finally(() => setLoading(false))
  }, [])

  // Keep favourites in sync when the user toggles a heart on this page or in another tab
  const refreshFavs = useCallback(() => {
    setFavIds(JSON.parse(localStorage.getItem(FAVS_KEY) || '[]'))
  }, [])

  useEffect(() => {
    window.addEventListener('storage', refreshFavs)
    window.addEventListener('focus', refreshFavs)
    return () => {
      window.removeEventListener('storage', refreshFavs)
      window.removeEventListener('focus', refreshFavs)
    }
  }, [refreshFavs])

  const favBusinesses = useMemo(
    () => allBiz.filter(b => favIds.includes(b.id)).map(bizToCard),
    [allBiz, favIds]
  )

  return (
    <div className="favorites-page">
      <Seo title={t('nav_favorites')} />
      <Header />
      <main className="favorites-page__main">
        <h1 className="favorites-page__title">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
          </svg>
          {t('nav_favorites')}
        </h1>

        {!user ? (
          <div className="favorites-page__empty">
            <p>{t('favorites_loginRequired')}</p>
            <button className="favorites-page__btn" onClick={() => navigate('/login')}>
              {t('nav_login')}
            </button>
          </div>
        ) : loading ? (
          <div className="favorites-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="fav-skel">
                <div className="fav-skel__img" />
                <div className="fav-skel__line" style={{ width: '70%' }} />
                <div className="fav-skel__line" style={{ width: '40%' }} />
              </div>
            ))}
          </div>
        ) : favBusinesses.length === 0 ? (
          <div className="favorites-page__empty">
            <p>{t('favorites_empty')}</p>
            <button className="favorites-page__btn" onClick={() => navigate('/catalog')}>
              {t('nav_catalog')}
            </button>
          </div>
        ) : (
          <div className="favorites-grid">
            {favBusinesses.map(u => (
              <UserCard
                key={u.id}
                id={u.id}
                name={u.name}
                city={u.city}
                logo={u.logo}
                cover={u.cover}
                cardMedia={u.card_media}
                planType={u.plan_type}
                type="all"
                isOnline={!!u.owner_is_online}
                isVerified={!!u.is_verified}
                verifiedAt={u.verified_at}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
