import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { resolveUrl } from '../utils/urlUtils'
import { useLanguage } from '../context/LanguageContext'
import './NearbyBusinesses.css'

/* ── City photos (static map for known Turkish/CIS cities) ─────────── */
const CITY_PHOTOS = {
  'Стамбул':   'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=80&h=80&fit=crop',
  'Istanbul':  'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=80&h=80&fit=crop',
  'Анкара':    'https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=80&h=80&fit=crop',
  'Ankara':    'https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=80&h=80&fit=crop',
  'Анталья':   'https://images.unsplash.com/photo-1597466599360-3b9775841aec?w=80&h=80&fit=crop',
  'Antalya':   'https://images.unsplash.com/photo-1597466599360-3b9775841aec?w=80&h=80&fit=crop',
  'Измир':     'https://images.unsplash.com/photo-1610543949555-b4b24c2b5c98?w=80&h=80&fit=crop',
  'Izmir':     'https://images.unsplash.com/photo-1610543949555-b4b24c2b5c98?w=80&h=80&fit=crop',
  'Бурса':     'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=80&h=80&fit=crop',
  'Москва':    'https://images.unsplash.com/photo-1547448415-e9f5b28e570d?w=80&h=80&fit=crop',
  'Алматы':    'https://images.unsplash.com/photo-1560461396-58e61e61c57a?w=80&h=80&fit=crop',
  'Ташкент':   'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=80&h=80&fit=crop',
}

function cityPhoto(city) {
  return CITY_PHOTOS[city] || `https://picsum.photos/seed/${encodeURIComponent(city)}/80/80`
}

const CARDS_PER_PAGE = 2
const MAX_CITIES     = 5

export default function NearbyBusinesses({ businesses = [], posts = [] }) {
  const navigate         = useNavigate()
  const { t }            = useLanguage()
  const [selectedCity, setSelectedCity] = useState(null) // null = nearby/all
  const [page, setPage]  = useState(0)
  const [geoCity, setGeoCity]  = useState(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const trackRef = useRef(null)

  /* build city tabs sorted by count */
  const cityTabs = useMemo(() => {
    const counts = {}
    businesses.forEach(b => {
      if (b.city) counts[b.city] = (counts[b.city] || 0) + 1
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_CITIES)
      .map(([city, count]) => ({ city, count }))
  }, [businesses])

  /* filter businesses */
  const filtered = useMemo(() => {
    const active = selectedCity || geoCity
    if (!active) return businesses.slice(0, 20)
    return businesses.filter(b =>
      b.city && b.city.toLowerCase() === active.toLowerCase()
    )
  }, [businesses, selectedCity, geoCity])

  /* post-image lookup: business_id → first post with image */
  const postImageMap = useMemo(() => {
    const m = {}
    posts.forEach(p => {
      if (p.business_id && p.media_display && !m[p.business_id]) {
        m[p.business_id] = resolveUrl(p.media_display)
      }
    })
    return m
  }, [posts])

  const totalPages = Math.max(1, Math.ceil(filtered.length / CARDS_PER_PAGE))
  const visible    = filtered.slice(page * CARDS_PER_PAGE, (page + 1) * CARDS_PER_PAGE)

  /* reset page on city change */
  useEffect(() => { setPage(0) }, [selectedCity, geoCity])

  /* swipe support */
  const swipeStart = useRef(null)
  const onTouchStart = e => { swipeStart.current = e.touches[0].clientX }
  const onTouchEnd   = e => {
    if (swipeStart.current === null) return
    const dx = e.changedTouches[0].clientX - swipeStart.current
    if (Math.abs(dx) > 40) {
      if (dx < 0 && page < totalPages - 1) setPage(p => p + 1)
      if (dx > 0 && page > 0)             setPage(p => p - 1)
    }
    swipeStart.current = null
  }

  /* geolocation */
  const handleNearby = () => {
    if (!navigator.geolocation) return
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      () => {
        // Without a geocoding API we just pick the most popular city
        const top = cityTabs[0]?.city || null
        setGeoCity(top)
        setSelectedCity(null)
        setGeoLoading(false)
      },
      () => { setGeoLoading(false) },
      { timeout: 5000 }
    )
  }

  if (!businesses.length) return null

  return (
    <section className="nearby">
      <h2 className="nearby__title">{t('nearby_title') || 'Бизнесы рядом с вами'}</h2>
      <p className="nearby__sub">
        {t('nearby_sub') || 'Воспользуйтесь функцией «Рядом со мной» или выберите город, который вы собираетесь посетить.'}
      </p>

      {/* ── City chips ─────────────────────────────────── */}
      <div className="nearby__cities">
        {/* Nearby btn */}
        <button
          className={`nearby__chip nearby__chip--geo${selectedCity === null && !geoCity ? ' nearby__chip--active' : ''}`}
          onClick={handleNearby}
        >
          {geoLoading
            ? <span className="nearby__geo-spin" />
            : <svg className="nearby__geo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="8" strokeDasharray="4 2"/></svg>
          }
          <span>{t('nearby_geo') || 'Рядом со мной'}</span>
        </button>

        {cityTabs.map(({ city, count }) => (
          <button
            key={city}
            className={`nearby__chip${selectedCity === city ? ' nearby__chip--active' : ''}`}
            onClick={() => { setSelectedCity(city); setGeoCity(null) }}
          >
            <img
              className="nearby__chip-img"
              src={cityPhoto(city)}
              alt={city}
              loading="lazy"
              decoding="async"
            />
            <span>{city} ({count})</span>
          </button>
        ))}
      </div>

      {/* ── Cards carousel ─────────────────────────────── */}
      {filtered.length === 0 ? (
        <p className="nearby__empty">Нет бизнесов в этом городе</p>
      ) : (
        <>
          <div
            className="nearby__track"
            ref={trackRef}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {visible.map(biz => {
              const img = postImageMap[biz.id] || resolveUrl(biz.cover) || null
              return (
                <div
                  key={biz.id}
                  className="nearby__card"
                  onClick={() => navigate(`/business/${biz.id}`)}
                >
                  <div className="nearby__card-body">
                    <div className="nearby__card-left">
                      <h3 className="nearby__card-name">
                        {biz.brand_name}
                        {biz.is_verified && (
                          <svg className="nearby__verified" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                          </svg>
                        )}
                      </h3>
                      <p className="nearby__card-city">{biz.city}</p>
                      {biz.description && (
                        <p className="nearby__card-desc">
                          {biz.description.length > 140
                            ? biz.description.slice(0, 140) + '…'
                            : biz.description}
                        </p>
                      )}
                      {!biz.description && biz.category_label && (
                        <p className="nearby__card-cat">{biz.category_label}</p>
                      )}
                    </div>

                    {img && (
                      <div className="nearby__card-img-wrap">
                        <img
                          className="nearby__card-img"
                          src={img}
                          alt={biz.brand_name}
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Dots */}
          {totalPages > 1 && (
            <div className="nearby__dots">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  className={`nearby__dot${i === page ? ' nearby__dot--active' : ''}`}
                  onClick={() => setPage(i)}
                  aria-label={`Страница ${i + 1}`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
