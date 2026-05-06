import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import Header from '../components/Header'
import ReviewsSection from '../components/ReviewsSection'
import VideoModal from '../components/VideoModal'
import { apiGetBusiness, apiGetBusinessPosts, apiGetBusinesses, apiToggleSubscription, apiJoinGroup, apiCheckGroupMembership, apiDeletePost } from '../api/businessApi'
import { resolveUrl } from '../utils/urlUtils'
import { lastSeenText } from '../utils/timeUtils'
import './BusinessPage.css'

const CATEGORY_ICONS = {
  BEAUTY: '\u{1f485}', HEALTH: '\u{1fa7a}', REALTY: '\u{1f3e0}', EDUCATION: '\u{1f4da}',
  FINANCE: '\u{1f4bc}', LEGAL: '\u2696\ufe0f', TOURISM: '\u2708\ufe0f', FOOD: '\u{1f37d}\ufe0f',
  TRANSPORT: '\u{1f697}', OTHER: '\u{1f3e2}',
}

const FALLBACK_LOGO  = 'https://picsum.photos/id/1027/200/200'
const FALLBACK_COVER = 'https://picsum.photos/id/1074/1200/400'

/* ── Аудио-плеер (голосовое сообщение) ── */
const WAVE_BARS = [4,7,12,9,14,10,6,13,8,11,5,10,13,7,9,12,6,11,8,14,5,9,12,7,10,13,6,11,8,4]

function BusinessAudioPlayer({ audioUrl }) {
  const { t } = useLanguage()
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime   = () => setProgress(audio.currentTime)
    const onLoaded = () => setDuration(audio.duration)
    const onEnd    = () => { setPlaying(false); setProgress(0) }
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onLoaded)
    audio.addEventListener('ended', onEnd)
    return () => {
      audio.pause()
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onLoaded)
      audio.removeEventListener('ended', onEnd)
    }
  }, [audioUrl])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) { audio.pause(); setPlaying(false) }
    else {
      if (!audio.src) { audio.src = audioUrl; audio.load() }
      audio.play().catch(() => {})
      setPlaying(true)
    }
  }

  const seek = (e) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * duration
  }

  const fmt = (s) => {
    if (!s || isNaN(s)) return '0:00'
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
  }

  const pct = duration ? progress / duration : 0

  return (
    <div className="bp__voice">
      <audio ref={audioRef} preload="none" />
      <button className="bp__voice-btn" onClick={toggle} aria-label={playing ? 'Пауза' : 'Воспроизвести'}>
        {playing
          ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="3" width="5" height="18" rx="1"/><rect x="14" y="3" width="5" height="18" rx="1"/></svg>
          : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,3 20,12 6,21"/></svg>
        }
      </button>
      <div className="bp__voice-body">
        <div className="bp__voice-wave" onClick={seek}>
          {WAVE_BARS.map((h, i) => {
            const filled = i / WAVE_BARS.length < pct
            return (
              <span
                key={i}
                className={`bp__voice-bar${playing && !filled ? ' bp__voice-bar--anim' : ''}`}
                style={{
                  height: h,
                  background: filled ? 'var(--accent-1)' : undefined,
                  animationDelay: `${(i % 6) * 0.09}s`,
                }}
              />
            )
          })}
        </div>
        <div className="bp__voice-meta">
          <span className="bp__voice-label">{t('biz_voiceGreeting')}</span>
          <span className="bp__voice-time">{fmt(progress)}{duration ? ` / ${fmt(duration)}` : ''}</span>
        </div>
      </div>
      <svg className="bp__voice-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8" y1="23" x2="16" y2="23"/>
      </svg>
    </div>
  )
}

function Gallery({ posts, onVideoSelect, isPremium }) {
  const { t } = useLanguage()
  const [tab, setTab] = useState('all')
  const images = posts.filter(p => p.media_display && p.media_type !== 'VIDEO')
  const videos = posts.filter(p => p.media_display && p.media_type === 'VIDEO')
  const all    = posts.filter(p => p.media_display)
  const items  = tab === 'video' ? videos : tab === 'photo' ? images : all
  if (all.length === 0) return null
  return (
    <section className="bp__card" id="section-gallery">
      <div className="bp__card-head">
        <h2 className="bp__card-title">{t('biz_photosVideos')}</h2>
        <div className="bp__gallery-tabs">
          <button className={`bp__tab ${tab === 'all'   ? 'bp__tab--on' : ''}`} onClick={() => setTab('all')}>{t('biz_galleryAll')}</button>
          {images.length > 0 && <button className={`bp__tab ${tab === 'photo' ? 'bp__tab--on' : ''}`} onClick={() => setTab('photo')}>{t('biz_galleryPhoto')}</button>}
          {videos.length > 0 && <button className={`bp__tab ${tab === 'video' ? 'bp__tab--on' : ''}`} onClick={() => setTab('video')}>{t('biz_galleryVideo')}</button>}
        </div>
      </div>
      <div className={`bp__gallery${isPremium ? ' bp__gallery--premium' : ''}`}>
        {items.map(p => (
          <div
            key={p.id}
            className={`bp__gallery-cell${p.media_type === 'VIDEO' ? ' bp__gallery-cell--video' : ''}`}
            onClick={() => p.media_type === 'VIDEO' && onVideoSelect({ url: p.media_display, title: '' })}
          >
            {p.media_type === 'VIDEO' ? (
              <div className="bp__gallery-video-placeholder">
                <div className="bp__gallery-video-icon">▶</div>
              </div>
            ) : (
              <img src={p.media_display} alt="" loading="lazy" />
            )}
            {p.media_type === 'VIDEO' && <div className="bp__play">▶</div>}
          </div>
        ))}
      </div>
    </section>
  )
}

function SimilarCard({ biz, onClick }) {
  const photo = resolveUrl(biz.logo) || resolveUrl(biz.cover) || `https://picsum.photos/id/${(biz.id % 80) + 10}/500/500`
  return (
    <div className="bp__sim-card" onClick={onClick}>
      <img src={photo} alt={biz.brand_name} loading="lazy" />
      <div className="bp__sim-overlay">
        {(biz.is_vip || biz.is_pro) && (
          <span className={`bp__sim-badge${biz.is_pro ? ' bp__sim-badge--pro' : ''}`}>
            {biz.is_pro ? 'PRO' : 'VIP'}
          </span>
        )}
        <p className="bp__sim-name">{biz.brand_name}</p>
        {biz.city && <p className="bp__sim-city">{biz.city}</p>}
      </div>
    </div>
  )
}

function VipPromo({ user, navigate }) {
  const { t } = useLanguage()
  return (
    <div className="bp__side-card bp__vip-promo">
      <div className="bp__vip-promo-icon">⭐</div>
      <h3 className="bp__vip-promo-title">{t('biz_vipAccess')}</h3>
      <p className="bp__vip-promo-text">{t('biz_vipPromo')}</p>
      <button className="bp__vip-promo-btn" onClick={() => { if (!user) { navigate('/login'); return } navigate('/vip') }}>
        {user ? t('biz_learnMore') : t('biz_loginForDetails')}
      </button>
    </div>
  )
}

const CURRENCY_SYMBOL = { TRY: '₺', USD: '$', EUR: '€', RUB: '₽' }

function ServiceCard({ item, navigate }) {
  const img = item.image_url || (item.image ? resolveUrl(item.image) : null) || `https://picsum.photos/id/${(item.id % 100) + 50}/400/300`
  const symbol = CURRENCY_SYMBOL[item.currency] || item.currency
  return (
    <div className="bp__service-card" onClick={() => navigate(`/products/${item.id}`)}>
      <div className="bp__service-img">
        <img src={img} alt={item.name} loading="lazy" />
      </div>
      <div className="bp__service-body">
        <p className="bp__service-name">{item.name}</p>
        {item.description && <p className="bp__service-desc">{item.description}</p>}
        {item.price && (
          <p className="bp__service-price">{Number(item.price).toLocaleString()} {symbol}</p>
        )}
      </div>
    </div>
  )
}

function InfoTabs({ biz, categoryIcon, faq, services, navigate }) {
  const { t } = useLanguage()
  const [tab, setTab] = useState('props')
  const [openFaq, setOpenFaq] = useState(null)
  const hasFaq = faq && faq.length > 0
  const profileServices = Array.isArray(services) ? services : []
  const productServices = Array.isArray(biz?.products)
    ? biz.products.filter(item => item.product_type === 'SERVICE')
    : []
  const serviceList = [...productServices, ...profileServices]

  return (
    <section className="bp__card">
      <div className="bp__info-tabs">
        <button
          className={`bp__info-tab${tab === 'props' ? ' bp__info-tab--active' : ''}`}
          onClick={() => setTab('props')}
        >{t('biz_infoFeatures')}</button>
        <button
          className={`bp__info-tab${tab === 'services' ? ' bp__info-tab--active' : ''}`}
          onClick={() => setTab('services')}
        >
          {t('biz_infoServices')}
          {serviceList.length > 0 && <span className="bp__info-tab-count">{serviceList.length}</span>}
        </button>
        <button
          className={`bp__info-tab${tab === 'faq' ? ' bp__info-tab--active' : ''}`}
          onClick={() => setTab('faq')}
        >FAQ</button>
      </div>

      {tab === 'props' && (
        <div className="bp__props">
          <div className="bp__prop"><span>{t('biz_category')}</span><span>{categoryIcon} {biz.category_label}</span></div>
          {biz.city && <div className="bp__prop"><span>{t('biz_city')}</span><span>{biz.city}</span></div>}
          <div className="bp__prop"><span>{t('biz_rating')}</span><span>⭐ {Number(biz.rating).toFixed(1)} / 5</span></div>
          <div className="bp__prop">
            <span>{t('biz_status')}</span>
            <span style={{ color: biz.is_verified ? '#10b981' : 'var(--text-muted)' }}>
              {biz.is_verified ? `✓ ${t('biz_verified')}` : t('biz_notVerified')}
            </span>
          </div>
        </div>
      )}

      {tab === 'services' && (
        serviceList.length > 0
          ? <div className="bp__svc-list">
              {serviceList.map((s, i) => {
                const symbol = { TRY: '₺', USD: '$', EUR: '€', RUB: '₽' }[s.currency] || s.currency || ''
                return (
                  <div key={i} className="bp__svc-item">
                    <div className="bp__svc-item__icon">🔧</div>
                    <div className="bp__svc-item__name">{s.name}</div>
                    {s.price && (
                      <div className="bp__svc-item__price">{Number(s.price).toLocaleString()} {symbol}</div>
                    )}
                  </div>
                )
              })}
            </div>
          : <div className="bp__services-empty">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
              <p>{t('biz_noServices')}</p>
              <span>{t('biz_noServicesSub')}</span>
            </div>
      )}

      {tab === 'faq' && (
        hasFaq
          ? <div className="bp__faq-list">
              {faq.map((item, i) => (
                <div key={i} className="bp__faq-item">
                  <button className="bp__faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <span>{item.question}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points={openFaq === i ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} />
                    </svg>
                  </button>
                  {openFaq === i && <p className="bp__faq-a">{item.answer}</p>}
                </div>
              ))}
            </div>
          : <div className="bp__services-empty">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <p>{t('biz_noFaq')}</p>
              <span>{t('biz_noFaqSub')}</span>
            </div>
      )}
    </section>
  )
}


export default function BusinessPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, getAccessToken } = useAuth()
  const { t } = useLanguage()

  const [biz, setBiz]               = useState(null)
  const [posts, setPosts]           = useState([])
  const [similar, setSimilar]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [subCount, setSubCount]     = useState(0)
  const [subLoading, setSubLoading] = useState(false)
  const [inGroup, setInGroup]       = useState(false)
  const [groupLoading, setGroupLoading] = useState(false)
  const [isOwner, setIsOwner]       = useState(false)
  const [deletingPost, setDeletingPost] = useState(null)
  const [toast, setToast]           = useState('')
  const [faq, setFaq]               = useState([])
  const [services, setServices]     = useState([])
  const [postsPage, setPostsPage]   = useState(0)
  const POSTS_PER_PAGE = 8
  const [selectedVideo, setSelectedVideo] = useState(null)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  useEffect(() => {
    setLoading(true)
    setError('')
    setBiz(null)
    setSimilar([])
    Promise.all([apiGetBusiness(id), apiGetBusinessPosts(id)])
      .then(([bizData, postsData]) => {
        setBiz(bizData)
        setPosts(postsData)
        setFaq(Array.isArray(bizData.faq) ? bizData.faq : [])
        setServices(Array.isArray(bizData.services) ? bizData.services : [])
        setSubscribed(bizData.is_subscribed || false)
        setSubCount(bizData.subscribers_count || 0)
        if (bizData.group_id) {
          getAccessToken().then(token => {
            if (token) {
              apiCheckGroupMembership(bizData.group_id, token)
                .then(data => setInGroup(data.joined))
                .catch(() => {})
            }
          })
        }
        if (bizData.category) {
          apiGetBusinesses({ category: bizData.category })
            .then(list => setSimilar(list.filter(b => b.id !== bizData.id).slice(0, 5)))
            .catch(() => {})
        }
        // Determine ownership
        if (user?.role === 'BUSINESS') {
          getAccessToken().then(token => {
            if (!token) return
            fetch(`${API_BASE}/api/businesses/me/`, {
              headers: { Authorization: `Bearer ${token}` },
            })
              .then(r => r.ok ? r.json() : null)
              .then(me => { if (me && String(me.id) === String(id)) setIsOwner(true) })
              .catch(() => {})
          })
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  const handleDeletePost = async (postId) => {
    if (!window.confirm(t('biz_confirmDelete'))) return
    setDeletingPost(postId)
    try {
      const token = await getAccessToken()
      await apiDeletePost(id, postId, token)
      setPosts(prev => prev.filter(p => p.id !== postId))
      showToast(t('biz_postDeleted'))
    } catch (e) {
      showToast(e.message || t('biz_deleteError'))
    } finally {
      setDeletingPost(null)
    }
  }

  const handlePostsPageChange = (page) => {
    setPostsPage(page)
    const element = document.getElementById('section-posts')
    if (element) element.scrollIntoView({ behavior: 'smooth' })
  }


  if (loading) return (
    <div className="bp">
      <Header />
      <div className="bp__loader">
        <span className="bp__spinner" />
        <p>{t('biz_loading')}</p>
      </div>
    </div>
  )

  if (error || !biz) return (
    <div className="bp">
      <Header />
      <div className="bp__error-state">
        <div style={{ fontSize: 48 }}>🏢</div>
        <h2>{t('biz_notFound')}</h2>
        <p>{error || t('biz_notFoundSub')}</p>
        <button onClick={() => navigate('/')}>На главную</button>
      </div>
    </div>
  )

  const isVideo = (src) => src && /\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(src)

  const logo     = resolveUrl(biz.logo)  || FALLBACK_LOGO
  const cover    = resolveUrl(biz.cover) || FALLBACK_COVER
  const logoIsVideo  = isVideo(biz.logo)
  const coverIsVideo = isVideo(biz.cover)
  const audioUrl = resolveUrl(biz.audio) || null
  const categoryIcon = CATEGORY_ICONS[biz.category] || '🏢'

  const bizHashtags = [
    `#${(biz.category || 'business').toLowerCase()}`,
    ...(biz.city ? [`#${biz.city.toLowerCase().replace(/\s/g, '_')}`] : []),
    ...(biz.is_verified ? ['#verified'] : []),
    ...(biz.is_vip ? ['#vip'] : []),
    '#messengershop',
  ]

  const handleJoinGroup = async () => {
    if (!user) { navigate('/login'); return }
    if (groupLoading || !biz.group_id) return
    setGroupLoading(true)
    try {
      const token = await getAccessToken()
      await apiJoinGroup(biz.group_id, token)
      setInGroup(true)
    } catch {} finally { setGroupLoading(false) }
  }

  const handleSubscribe = async () => {
    if (!user) { navigate('/login'); return }
    if (subLoading) return
    setSubLoading(true)
    try {
      const token = await getAccessToken()
      const data = await apiToggleSubscription(id, token)
      setSubscribed(data.subscribed)
      setSubCount(data.subscribers_count)
    } catch {} finally { setSubLoading(false) }
  }

  return (
    <div className="bp">
      <Header />

      {/* Video Modal */}
      {selectedVideo && (
        <VideoModal
          videoUrl={selectedVideo.url}
          title={selectedVideo.title}
          onClose={() => setSelectedVideo(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '70px', left: '50%', transform: 'translateX(-50%)',
          background: '#10b981', color: '#fff', padding: '10px 22px', borderRadius: '10px',
          fontWeight: 600, fontSize: '14px', zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          pointerEvents: 'none',
        }}>
          {toast}
        </div>
      )}

      {/* Cover */}
      <div className="bp__cover" style={coverIsVideo ? {} : { backgroundImage: `url(${cover})` }}>
        {coverIsVideo && (
          <video className="bp__cover-video" src={cover} autoPlay muted loop playsInline />
        )}
        <div className="bp__cover-fade" />
        <button className="bp__back" onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
      </div>

      <div className="bp__wrap">

        {/* Hero */}
        <div className="bp__hero">
          {logoIsVideo
            ? <video src={logo} className="bp__avatar" autoPlay muted loop playsInline />
            : <img src={logo} alt={biz.brand_name} className="bp__avatar" />
          }

          <div className="bp__hero-body">
            <div className="bp__name-row">
              <h1 className="bp__name">{biz.brand_name}</h1>
              {biz.is_vip && <span className="bp__vip-tag">VIP</span>}
            </div>
            {(biz.owner_is_online || biz.owner_last_seen) && (
              <div className={`bp__online-status ${biz.owner_is_online ? 'bp__online-status--online' : ''}`}>
                <span className="bp__online-dot" />
                <span className="bp__online-text">
                  {lastSeenText(biz.owner_last_seen, biz.owner_is_online)}
                </span>
              </div>
            )}
            <div className="bp__stats">
              <div className="bp__stat">
                <span className="bp__stat-num">{subCount}</span>
                <span className="bp__stat-label">{t('myprofile_subscribers').toLowerCase()}</span>
              </div>
              {biz.views_count > 0 && (
                <div className="bp__stat">
                  <span className="bp__stat-num">{biz.views_count}</span>
                  <span className="bp__stat-label">{t('views')}</span>
                </div>
              )}
            </div>
            <div className="bp__hero-hashtags">
              {bizHashtags.map((h, i) => <span key={i} className="bp__hashtag">{h}</span>)}
            </div>

            <div className="bp__actions">
              <button
                className={`bp__act-btn bp__act-btn--sub ${subscribed ? 'bp__act-btn--active' : ''}`}
                onClick={handleSubscribe}
                disabled={subLoading}
              >
                {subscribed ? t('biz_subscribed') : t('biz_subscribe')}
              </button>
              <button className="bp__act-btn bp__act-btn--chat"
                onClick={() => { if (!user) { navigate('/login'); return } navigate('/messenger') }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                {t('biz_chat')}
              </button>
              {biz.group_id && (
                <button
                  className={`bp__act-btn bp__act-btn--group ${inGroup ? 'bp__act-btn--joined' : ''}`}
                  onClick={inGroup ? () => navigate('/messenger') : handleJoinGroup}
                  disabled={groupLoading}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  {inGroup ? t('biz_inGroup') : t('biz_joinGroup')}
                </button>
              )}
              {biz.phone && (
                <a href={`tel:${biz.phone}`} className="bp__act-btn bp__act-btn--phone">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.78a16 16 0 0 0 7.86 7.86l1.06-1.06a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>

        </div>



        <div className="bp__grid">
          <div className="bp__main">

            {/* БЛОК 1: О нас + Контакты — объединённый */}
            <section className="bp__card" id="section-about">
              <h2 className="bp__card-title">{t('biz_about')}</h2>
              {audioUrl && <BusinessAudioPlayer audioUrl={audioUrl} />}
              {biz.description && <p className="bp__about-text" style={{ marginTop: audioUrl ? 14 : 0 }}>{biz.description}</p>}
              {biz.description && <div className="bp__about-divider" />}
              <h3 className="bp__about-contacts-title">{t('biz_contacts')}</h3>
              <div className="bp__contacts-row">
                {biz.phone && (
                  <a href={`tel:${biz.phone}`} className="bp__contact-chip bp__contact-chip--phone">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.78a16 16 0 0 0 7.86 7.86l1.06-1.06a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    <span>{biz.phone}</span>
                  </a>
                )}
                {biz.website && (
                  <a href={biz.website} target="_blank" rel="noopener noreferrer" className="bp__contact-chip bp__contact-chip--web">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="2" y1="12" x2="22" y2="12"/>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                    <span>{biz.website.replace(/^https?:\/\//, '')}</span>
                  </a>
                )}
                {biz.address && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(biz.address + (biz.city ? ' ' + biz.city : ''))}`}
                    target="_blank" rel="noopener noreferrer"
                    className="bp__contact-chip bp__contact-chip--map"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span>{biz.address}</span>
                  </a>
                )}
              </div>
            </section>

            <InfoTabs
              biz={biz}
              categoryIcon={categoryIcon}
              faq={faq}
              services={services}
              navigate={navigate}
            />

            <Gallery posts={posts} onVideoSelect={setSelectedVideo} isPremium={biz.is_vip} />

            {posts.length > 0 && (
              <section className="bp__card" id="section-posts">
                <h2 className="bp__card-title">{t('biz_publications')} <span className="bp__pill">{posts.length}</span></h2>
                <div className="bp__feed">
                  {(() => {
                    const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE)
                    const start = postsPage * POSTS_PER_PAGE
                    const end = start + POSTS_PER_PAGE
                    const visiblePosts = posts.slice(start, end)
                    return visiblePosts.map(post => (
                      <div key={post.id} className="bp__feed-item">
                        {post.media_display && (
                          <div
                            className={`bp__feed-media${post.media_type === 'VIDEO' ? ' bp__feed-media--video' : ''}`}
                            onClick={() => post.media_type === 'VIDEO' && setSelectedVideo({ url: post.media_display, title: post.text })}
                          >
                            {post.media_type === 'VIDEO' ? (
                              <div className="bp__feed-video-placeholder">
                                <div className="bp__feed-video-icon">▶</div>
                              </div>
                            ) : (
                              <img src={post.media_display} alt="" loading="lazy" />
                            )}
                            {post.media_type === 'VIDEO' && <div className="bp__play">▶</div>}
                          </div>
                        )}
                        <div className="bp__feed-body">
                          <p className="bp__feed-text">{post.text}</p>
                          <div className="bp__feed-hashtags">
                            {bizHashtags.slice(0, 3).map((h, i) => <span key={i} className="bp__feed-hashtag">{h}</span>)}
                          </div>
                          <div className="bp__feed-footer">
                            <span className="bp__feed-date">
                              {new Date(post.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                            </span>
                            {isOwner && (
                              <button
                                className="bp__feed-delete"
                                onClick={() => handleDeletePost(post.id)}
                                disabled={deletingPost === post.id}
                                title={t('biz_deletePost')}
                              >
                                {deletingPost === post.id ? (
                                  <span className="bp__feed-delete-spinner" />
                                ) : (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <polyline points="3 6 5 6 21 6"/>
                                    <path d="M19 6l-1 14H6L5 6"/>
                                    <path d="M10 11v6M14 11v6"/>
                                    <path d="M9 6V4h6v2"/>
                                  </svg>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  })()}
                </div>
                {(() => {
                  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE)
                  return totalPages > 1 && (
                    <div className="bp__pagination">
                      {Array.from({ length: totalPages }, (_, i) => (
                        <button
                          key={i}
                          className={`bp__pagination-btn ${postsPage === i ? 'bp__pagination-btn--active' : ''}`}
                          onClick={() => handlePostsPageChange(i)}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  )
                })()}
              </section>
            )}

            <section className="bp__card" id="section-reviews">
              <ReviewsSection type="business" targetId={id} horizontal ratingScale={10} />
            </section>

            {!biz.description && posts.length === 0 && (
              <div className="bp__empty">
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                <p>{t('biz_noContent')}</p>
              </div>
            )}
          </div>

          {/* Sidebar — хештеги убраны отсюда, они теперь в hero */}
          <aside className="bp__side">
            <VipPromo user={user} navigate={navigate} />
          </aside>
        </div>

        {similar.length > 0 && (
          <section className="bp__similar">
            <h2 className="bp__card-title">{t('biz_similar')}</h2>
            <div className="bp__sim-grid">
              {similar.map(s => (
                <SimilarCard key={s.id} biz={s} onClick={() => navigate(`/business/${s.id}`)} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
