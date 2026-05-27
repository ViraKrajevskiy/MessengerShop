import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Header from '../components/Header'
import Seo from '../components/Seo'
import Stories from '../components/Stories'
import NewUsers from '../components/NewUsers'
import UserCard from '../components/UserCard'
import Footer from '../components/Footer'
import TweetsSidebar from '../components/TweetsSidebar'
import BusinessRankSidebar from '../components/BusinessRankSidebar'
import PostCard from '../components/PostCard'
import PremiumCarousel from '../components/PremiumCarousel'
import NearbyBusinesses from '../components/NearbyBusinesses'
import { apiGetBusinesses, apiGetPosts, CATEGORY_LABELS } from '../api/businessApi'
import { useLanguage } from '../context/LanguageContext'
import { resolveUrl } from '../utils/urlUtils'
import { metaText } from '../utils/seo'
import { SITE_NAME, absoluteUrl } from '../config/site'
import './HomePage.css'

const DESC_KEYS = {
  default:        { title: 'home_turkey',   text: 'home_turkey_sub' },
  'Турция':       { title: 'home_turkey',   text: 'home_turkey_sub' },
  'Россия':       { title: 'home_russia',   text: 'home_russia_sub' },
  'Казахстан':    { title: 'home_kz',       text: 'home_kz_sub' },
  'Узбекистан':   { title: 'home_uz',       text: 'home_uz_sub' },
  'Стамбул':      { title: 'home_istanbul', text: 'home_istanbul_sub' },
  'Анкара':       { title: 'home_ankara',   text: 'home_ankara_sub' },
  'Анталья':      { title: 'home_antalya',  text: 'home_antalya_sub' },
  'Красота и уход': { title: 'home_beauty', text: 'home_beauty_sub' },
  'Здоровье':     { title: 'home_health',   text: 'home_health_sub' },
  'Недвижимость': { title: 'home_realty',   text: 'home_realty_sub' },
}

function getDescKeys(filters) {
  const cat = filters.category && CATEGORY_LABELS[filters.category]
  if (cat && DESC_KEYS[cat]) return DESC_KEYS[cat]
  if (filters.city && DESC_KEYS[filters.city]) return DESC_KEYS[filters.city]
  if (filters.country && DESC_KEYS[filters.country]) return DESC_KEYS[filters.country]
  return DESC_KEYS.default
}

function bizToCard(b) {
  return {
    id: b.id,
    name: b.brand_name,
    city: b.city || '',
    category: b.category_label || CATEGORY_LABELS[b.category] || b.category,
    logo: b.logo,
    cover: b.cover || null,
    card_media: b.card_media || null,
    is_verified: b.is_verified,
    verified_at: b.verified_at || null,
    is_vip: b.is_vip,
    is_pro: b.is_pro,
    plan_type: b.plan_type || 'FREE',
    rating: b.rating,
    owner_is_online: b.owner_is_online,
  }
}

const GUEST_LIMIT = 4
const GUEST_CARDS_LIMIT = 12
/** Сколько постов показываем на главной в блоке «Публикации» */
const HOME_POSTS_VISIBLE = 20
const MOBILE_MEDIA_QUERY = '(max-width: 500px)'

export default function HomePage() {
  const navigate = useNavigate()
  const { user, tokens } = useAuth()
  const { t } = useLanguage()

  const [filters] = useState({
    country: '', city: '', category: '', service: '', activeTags: [],
  })

  const [allBiz, setAllBiz] = useState([])
  const [loadingBiz, setLoadingBiz] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [cardFilter, setCardFilter] = useState({ planType: null, verified: false, sortNew: false, category: null })

  const [posts, setPosts] = useState([])
  const [loadingPosts, setLoadingPosts] = useState(true)

  useEffect(() => {
    // Грузим независимо — кто пришёл первым, тот и показывается.
    // Раньше был Promise.all — если один запрос медленный, вся страница висела.
    setLoadingBiz(true)
    apiGetBusinesses()
      .then(biz => setAllBiz(Array.isArray(biz) ? biz : []))
      .catch(() => setAllBiz([]))
      .finally(() => setLoadingBiz(false))

    setLoadingPosts(true)
    apiGetPosts(tokens?.access)
      .then(p => setPosts(Array.isArray(p) ? p : []))
      .catch(() => setPosts([]))
      .finally(() => setLoadingPosts(false))
  }, [tokens?.access])

  const filteredAll = useMemo(() =>
    allBiz.filter(b =>
      (!filters.city || !b.city || b.city.toLowerCase().includes(filters.city.toLowerCase())) &&
      (!filters.category || b.category === filters.category)
    ).map(bizToCard)
  , [allBiz, filters])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const media = window.matchMedia(MOBILE_MEDIA_QUERY)
    const update = () => setIsMobile(media.matches)

    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  // Premium (VIP/PRO) businesses for carousel
  const premiumBiz = useMemo(() =>
    allBiz.filter(b => b.plan_type === 'VIP' || b.plan_type === 'PRO' || b.is_vip || b.is_pro),
    [allBiz]
  )

  // Combine post images + business logos for slider
  const sliderImages = useMemo(() => {
    const postImgs = posts
      .filter(p => p.media_display)
      .map(p => ({
        src: resolveUrl(p.media_display),
        alt: p.text || '',
      }))
    const bizImgs = allBiz
      .filter(b => b.logo)
      .map(b => ({
        src: resolveUrl(b.logo),
        alt: b.brand_name,
      }))
    return [...postImgs, ...bizImgs].slice(0, 50)
  }, [posts, allBiz])

  const descKeys = getDescKeys(filters)
  const desc = { title: t(descKeys.title), text: t(descKeys.text) }

  const homePosts = useMemo(
    () => posts.slice(0, HOME_POSTS_VISIBLE),
    [posts]
  )

  const homeBusinessCards = useMemo(() => {
    let list = user ? filteredAll : filteredAll.slice(0, GUEST_CARDS_LIMIT)
    if (cardFilter.planType === 'VIP') list = list.filter(u => u.plan_type === 'VIP' || u.is_vip)
    if (cardFilter.verified) list = list.filter(u => u.is_verified)
    if (cardFilter.category) list = list.filter(u => u.category === cardFilter.category)
    if (cardFilter.sortNew) list = [...list].sort((a, b) => b.id - a.id)
    return list
  }, [filteredAll, user, cardFilter])


  const postsGridRef = useRef(null)
  const dragState = useRef({ isDown: false, startX: 0, scrollLeft: 0, moved: false })
  const [postsPage, setPostsPage] = useState(0)
  const [postsTotalPages, setPostsTotalPages] = useState(1)

  const onDragStart = (clientX) => {
    const el = postsGridRef.current
    if (!el) return
    dragState.current = { isDown: true, startX: clientX, scrollLeft: el.scrollLeft, moved: false }
    el.style.cursor = 'grabbing'
    el.style.userSelect = 'none'
  }
  const onDragMove = (clientX) => {
    if (!dragState.current.isDown) return
    const el = postsGridRef.current
    if (!el) return
    const dx = clientX - dragState.current.startX
    if (Math.abs(dx) > 5) dragState.current.moved = true
    el.scrollLeft = dragState.current.scrollLeft - dx
  }
  const onDragEnd = () => {
    dragState.current.isDown = false
    const el = postsGridRef.current
    if (!el) return
    el.style.cursor = 'grab'
    el.style.userSelect = ''
    if (dragState.current.moved) {
      el.addEventListener('click', e => e.stopPropagation(), { capture: true, once: true })
    }
  }

  const recomputePostsPaging = useCallback(() => {
    const el = postsGridRef.current
    if (!el) return
    const { scrollLeft, clientWidth, scrollWidth } = el
    if (clientWidth === 0) return
    const total = Math.max(1, Math.ceil(homePosts.length / 3))
    const maxScroll = scrollWidth - clientWidth
    const ratio = maxScroll > 2 ? scrollLeft / maxScroll : 0
    const page = Math.min(total - 1, Math.max(0, Math.round(ratio * (total - 1))))
    setPostsTotalPages(total)
    setPostsPage(page)
  }, [homePosts.length])

  useEffect(() => {
    recomputePostsPaging()
    const onResize = () => recomputePostsPaging()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [recomputePostsPaging, homePosts.length, loadingPosts])

  // Vertical mouse-wheel → horizontal scroll, releasing to the page at the
  // track edges. Native non-passive listener (React onWheel is passive).
  useEffect(() => {
    const el = postsGridRef.current
    if (!el) return
    const onWheel = (e) => {
      if (e.deltaY === 0 || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
      const atStart = el.scrollLeft <= 0
      const atEnd = Math.ceil(el.scrollLeft + el.clientWidth) >= el.scrollWidth
      if ((e.deltaY < 0 && atStart) || (e.deltaY > 0 && atEnd)) return
      e.preventDefault()
      el.scrollLeft += e.deltaY
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [homePosts.length, loadingPosts])

  return (
    <div className="home-page">
      <Seo
        title={desc.title}
        description={metaText(desc.text)}
        path="/"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: SITE_NAME,
          url: absoluteUrl('/'),
        }}
      />
      <Header />

      {/* Hero + слайдер — полная ширина, вне двухколоночного layout */}
      <div className="home-page__hero-full">
        <div className="home-page__hero">
          <h1>{desc.title}</h1>
          <p>
            {desc.text.split('\n').map((line, i) => (
              <span key={i}>{line}{i === 0 && <br />}</span>
            ))}
          </p>
        </div>

        <PremiumCarousel businesses={premiumBiz} isUserPremium={user?.role === 'BUSINESS'} />
      </div>

      <div className="home-page__layout">
        <main className="home-page__content">

          {/* Новые бизнесы */}
          <NewUsers businesses={allBiz} />

          {/* Публикации */}
          <section className="home-posts-section">
            <div className="section-header">
              <h2 className="section-title">{t('home_publications')}</h2>
              <button className="see-all-btn" onClick={() => navigate('/feed')}>
                {t('home_allPublications')}
              </button>
            </div>

            {/* Stories as author bar */}
            <Stories noTitle />

            {/* Post cards */}
            {loadingPosts ? (
              <div className="home-posts-grid">
                {[1, 2, 3].map(i => (
                  <div key={i} className="post-card-skeleton">
                    <div className="post-card-skeleton__header">
                      <div className="skel-circle" />
                      <div className="skel-lines">
                        <div className="skel-line" />
                        <div className="skel-line skel-line--short" />
                      </div>
                    </div>
                    <div className="skel-img skel-img--portrait" />
                    <div className="skel-body">
                      <div className="skel-line" />
                      <div className="skel-line skel-line--short" />
                    </div>
                  </div>
                ))}
              </div>
            ) : homePosts.length > 0 ? (
              <>
                <div
                  className="home-posts-grid"
                  ref={postsGridRef}
                  onScroll={recomputePostsPaging}
                  onMouseDown={e => onDragStart(e.clientX)}
                  onMouseMove={e => onDragMove(e.clientX)}
                  onMouseUp={onDragEnd}
                  onMouseLeave={onDragEnd}
                  onDragStart={e => e.preventDefault()}
                >
                  {homePosts.map(p => (
                    <PostCard key={p.id} post={p} />
                  ))}
                </div>
                {postsTotalPages > 1 && (
                  <div className="home-posts-dots">
                    {Array.from({ length: postsTotalPages }).map((_, i) => (
                      <button
                        key={i}
                        className={`home-posts-dot${i === postsPage ? ' home-posts-dot--active' : ''}`}
                        onClick={() => {
                          const el = postsGridRef.current
                          if (!el) return
                          const denom = Math.max(1, postsTotalPages - 1)
                          el.scrollTo({ left: (i / denom) * (el.scrollWidth - el.clientWidth), behavior: 'smooth' })
                        }}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : null}
          </section>

          {/* Бизнесы рядом с вами */}
          <NearbyBusinesses businesses={allBiz} posts={posts} />

          {/* Все карточки */}
          <section className="all-cards-section">
            <div className="section-header">
              <h2 className="section-title">{t('home_allCards')}</h2>
              <button className="see-all-btn" onClick={() => navigate('/feed')}>
                {t('home_allPublications')}
              </button>
            </div>

            {/* Фильтры */}
            <div className="ac-filters">
              <div className="ac-filters__row">
                <button
                  className={`ac-chip${cardFilter.planType === 'VIP' ? ' ac-chip--active' : ''}`}
                  onClick={() => setCardFilter(f => ({ ...f, planType: f.planType === 'VIP' ? null : 'VIP' }))}
                >⭐ VIP</button>
                <button
                  className={`ac-chip${cardFilter.verified ? ' ac-chip--active' : ''}`}
                  onClick={() => setCardFilter(f => ({ ...f, verified: !f.verified }))}
                >{t('filter_verified') || 'Проверенные'}</button>
                <button
                  className={`ac-chip${cardFilter.sortNew ? ' ac-chip--active' : ''}`}
                  onClick={() => setCardFilter(f => ({ ...f, sortNew: !f.sortNew }))}
                >{t('filter_new') || 'Новые'}</button>
              </div>
              <div className="ac-filters__row ac-filters__row--cats">
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    className={`ac-chip ac-chip--sm${cardFilter.category === label ? ' ac-chip--active' : ''}`}
                    onClick={() => setCardFilter(f => ({ ...f, category: f.category === label ? null : label }))}
                  >{label}</button>
                ))}
              </div>
            </div>

            <div className="card-grid card-grid--4">
              {loadingBiz ? (
                Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className="vip-card vip-card--skeleton">
                    <div className="vip-card__image"><div className="vip-card__skel-img" /></div>
                    <div className="vip-card__info">
                      <div className="vip-card__skel-line" style={{ width: '70%' }} />
                      <div className="vip-card__skel-line" style={{ width: '40%' }} />
                    </div>
                  </div>
                ))
              ) : filteredAll.length > 0 ? (
                homeBusinessCards.slice(0, 8).map(u => (
                  <UserCard key={u.id} id={u.id} name={u.name} city={u.city} logo={u.logo} cover={u.cover} cardMedia={u.card_media} planType={u.plan_type} type="all" isOnline={!!u.owner_is_online} isVerified={!!u.is_verified} verifiedAt={u.verified_at} />
                ))
              ) : (
                <div className="no-results">{t('home_noCards')}</div>
              )}
            </div>

          </section>

          {/* Auth gate for guests — shown below all cards */}

        </main>
        <div className="home-page__sidebar">
          <TweetsSidebar posts={posts} />
          <BusinessRankSidebar
            title={t('home_popularBiz') || 'Самые популярные Бизнесы на этой неделе'}
            businesses={[...allBiz].sort((a, b) => (b.rating || 0) - (a.rating || 0))}
          />
          <BusinessRankSidebar
            title={t('home_viewedBiz') || 'Самые просматриваемые Бизнесы на этой неделе'}
            businesses={[...allBiz].sort((a, b) => (b.views_count || b.id || 0) - (a.views_count || a.id || 0))}
          />
        </div>
      </div>

      <Footer />
    </div>
  )
}
