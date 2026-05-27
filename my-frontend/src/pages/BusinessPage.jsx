import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import Header from '../components/Header'
import Seo from '../components/Seo'
import ReviewsSection from '../components/ReviewsSection'
import VideoModal from '../components/VideoModal'
import '../components/PremiumCarousel.css'
import { apiGetBusiness, apiGetBusinessPosts, apiGetBusinesses, apiToggleSubscription, apiJoinGroup, apiCheckGroupMembership, apiDeletePost, apiStartBizChat, apiGetBusinessSurveyAnswers } from '../api/businessApi'
import { API_URL } from '../config/api'
import { resolveUrl } from '../utils/urlUtils'
import { metaText } from '../utils/seo'
import { lastSeenText } from '../utils/timeUtils'
import './BusinessPage.css'

const CATEGORY_ICONS = {
  BEAUTY: '\u{1f485}', HEALTH: '\u{1fa7a}', REALTY: '\u{1f3e0}', EDUCATION: '\u{1f4da}',
  FINANCE: '\u{1f4bc}', LEGAL: '⚖️', TOURISM: '✈️', FOOD: '\u{1f37d}️',
  TRANSPORT: '\u{1f697}', OTHER: '\u{1f3e2}',
}

const FALLBACK_LOGO  = 'https://picsum.photos/id/1027/200/200'
const FALLBACK_COVER = 'https://picsum.photos/id/1074/1200/400'

function fmtDate(dt) {
  if (!dt) return ''
  return new Date(dt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

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

function Gallery({ posts, onVideoSelect, onPhotoSelect, isPremium }) {
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
          <button className={`bp__tab ${tab === 'video' ? 'bp__tab--on' : ''}`} onClick={() => setTab('video')}>{t('biz_galleryVideo')}</button>
        </div>
      </div>
      {tab === 'video' && videos.length === 0 ? (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
          🎬 Видео пока нет
        </div>
      ) : (
      <div className={`bp__gallery${isPremium ? ' bp__gallery--premium' : ''}`}>
        {items.map(p => (
          <div
            key={p.id}
            className={`bp__gallery-cell${p.media_type === 'VIDEO' ? ' bp__gallery-cell--video' : ''}`}
            onClick={() => p.media_type === 'VIDEO' ? onVideoSelect({ url: p.media_display, title: '' }) : onPhotoSelect(p.media_display)}
          >
            {p.media_type === 'VIDEO' ? (
              <video
                src={p.media_display + '#t=0.5'}
                className="bp__gallery-video-thumb"
                preload="metadata"
                muted
                playsInline
              />
            ) : (
              <>
                <img src={p.media_display} aria-hidden="true" className="bp__gallery-img-bg" />
                <img src={p.media_display} alt="" loading="lazy" className="bp__gallery-img-main" />
              </>
            )}
            {p.media_type === 'VIDEO' && (
              <div className="bp__play">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <circle cx="16" cy="16" r="16" fill="rgba(0,0,0,0.45)"/>
                  <polygon points="13,10 24,16 13,22" fill="white"/>
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
      )}
    </section>
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



function InfoTabs({ biz, categoryIcon, faq, navigate, surveyAnswers }) {
  const { t } = useLanguage()
  const [tab, setTab] = useState('props')
  const [openFaq, setOpenFaq] = useState(null)
  const hasFaq = faq && faq.length > 0
  const hasSurvey = surveyAnswers && surveyAnswers.length > 0

  return (
    <section className="bp__card">
      <div className="bp__info-tabs">
        <button
          className={`bp__info-tab${tab === 'props' ? ' bp__info-tab--active' : ''}`}
          onClick={() => setTab('props')}
        >{t('biz_infoFeatures')}</button>
        {hasSurvey && (
          <button
            className={`bp__info-tab${tab === 'about' ? ' bp__info-tab--active' : ''}`}
            onClick={() => setTab('about')}
          >{t('biz_aboutBusiness')}</button>
        )}
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
        </div>
      )}

      {tab === 'about' && hasSurvey && (
        <div className="bp__props">
          {surveyAnswers.map(s => (
            <div className="bp__prop" key={s.survey_id}>
              <span>{s.question}</span>
              <span>{s.answers.join(', ')}</span>
            </div>
          ))}
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
  const [surveyAnswers, setSurveyAnswers] = useState([])
  const [postsPage, setPostsPage]   = useState(0)
  const POSTS_PER_PAGE = 8
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [selectedPost, setSelectedPost] = useState(null)
  const [avatarVideoOpen, setAvatarVideoOpen] = useState(false)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  useEffect(() => {
    setLoading(true)
    setError('')
    setBiz(null)
    setSimilar([])
    setSurveyAnswers([])
    apiGetBusinessSurveyAnswers(id)
      .then(d => setSurveyAnswers(Array.isArray(d) ? d : []))
      .catch(() => setSurveyAnswers([]))
    Promise.all([apiGetBusiness(id), apiGetBusinessPosts(id)])
      .then(([bizData, postsData]) => {
        setBiz(bizData)
        setPosts(postsData)
        setFaq(Array.isArray(bizData.faq) ? bizData.faq : [])
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
            fetch(`${API_URL}/businesses/me/`, {
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
      <Seo title={t('biz_notFound')} noindex />
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

  const handleJoinGroup = () => {
    if (!user) { navigate('/login'); return }
    if (!biz.group_id) return
    // Navigate to group preview page — user decides to join there (like Telegram)
    navigate(`/group/${biz.group_id}`)
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

  const seoImage = resolveUrl(biz.logo) && !logoIsVideo ? resolveUrl(biz.logo) : undefined
  const seoDesc = metaText(
    biz.description ||
    [biz.category_label, biz.city].filter(Boolean).join(' · ') ||
    biz.brand_name
  )
  const seoJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: biz.brand_name,
    ...(biz.description ? { description: metaText(biz.description, 400) } : {}),
    ...(seoImage ? { image: seoImage } : {}),
    ...(biz.phone ? { telephone: biz.phone } : {}),
    ...(biz.website ? { url: biz.website } : {}),
    ...((biz.address || biz.city) ? {
      address: {
        '@type': 'PostalAddress',
        ...(biz.address ? { streetAddress: biz.address } : {}),
        ...(biz.city ? { addressLocality: biz.city } : {}),
      },
    } : {}),
  }

  return (
    <div className="bp">
      <Seo
        title={biz.brand_name}
        description={seoDesc}
        path={`/business/${id}`}
        image={seoImage}
        type="profile"
        jsonLd={seoJsonLd}
      />
      <Header />

      {/* Avatar video modal */}
      {avatarVideoOpen && logoIsVideo && (
        <div className="biz-video-modal" onClick={() => setAvatarVideoOpen(false)}>
          <video src={logo} autoPlay controls onClick={e => e.stopPropagation()} />
          <button className="biz-video-modal__close" onClick={() => setAvatarVideoOpen(false)}>✕</button>
        </div>
      )}

      {/* Video Modal */}
      {selectedVideo && (
        <VideoModal
          videoUrl={selectedVideo.url}
          title={selectedVideo.title}
          onClose={() => setSelectedVideo(null)}
        />
      )}

      {/* Post Modal */}
      {selectedPost && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '16px' }}
          onClick={() => setSelectedPost(null)}
        >
          <div
            style={{ background: 'var(--bg-secondary)', borderRadius: 14, maxWidth: 560, width: '100%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}
          >
            {selectedPost.media_display && selectedPost.media_type !== 'VIDEO' && (
              <img
                src={selectedPost.media_display}
                alt=""
                style={{ width: '100%', display: 'block', borderRadius: '14px 14px 0 0', objectFit: 'cover', maxHeight: 400 }}
              />
            )}
            {selectedPost.media_display && selectedPost.media_type === 'VIDEO' && (
              <video
                src={selectedPost.media_display}
                controls
                style={{ width: '100%', display: 'block', borderRadius: '14px 14px 0 0', maxHeight: 400 }}
              />
            )}
            <div style={{ padding: '16px 20px 20px' }}>
              {selectedPost.text && (
                <p style={{ margin: '0 0 12px', fontSize: 15, lineHeight: 1.6, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                  {selectedPost.text}
                </p>
              )}
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {new Date(selectedPost.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <button
              style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: 20, width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => setSelectedPost(null)}
            >✕</button>
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, cursor: 'zoom-out' }}
          onClick={() => setSelectedPhoto(null)}
        >
          <img
            src={selectedPhoto}
            alt=""
            style={{ maxWidth: '95vw', maxHeight: '92vh', objectFit: 'contain', borderRadius: 10, display: 'block' }}
            onClick={e => e.stopPropagation()}
          />
          <button
            style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: 22, width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
            onClick={() => setSelectedPhoto(null)}
          >✕</button>
        </div>
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
            ? <video src={logo} className="bp__avatar bp__avatar--clickable" autoPlay muted loop playsInline onClick={() => setAvatarVideoOpen(true)} />
            : <img src={logo} alt={biz.brand_name} className="bp__avatar" />
          }

          <div className="bp__hero-body">
            <div className="bp__name-row">
              <h1 className="bp__name">{biz.brand_name}</h1>
              {biz.is_vip && <span className="bp__vip-tag">VIP</span>}
            </div>
            <div className={`bp__online-status ${biz.owner_is_online ? 'bp__online-status--online' : ''}`}>
              <span className="bp__online-dot" />
              <span className="bp__online-text">
                {lastSeenText(biz.owner_last_seen, biz.owner_is_online)}
              </span>
            </div>
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
                onClick={async () => {
                  if (!user) { navigate('/login'); return }
                  try {
                    const token = await getAccessToken()
                    const data = await apiStartBizChat(id, token)
                    navigate('/messenger', { state: { openBizId: parseInt(id), openInquiryId: data.inquiry_id } })
                  } catch {
                    navigate('/messenger', { state: { openBizId: parseInt(id) } })
                  }
                }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                {t('biz_chat')}
              </button>
              {biz.group_id && (
                <button
                  className={`bp__act-btn bp__act-btn--group ${inGroup ? 'bp__act-btn--joined' : ''}`}
                  onClick={handleJoinGroup}
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

            {/* О нас + Контакты */}
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
              {(biz.social_telegram || biz.social_whatsapp || biz.social_instagram || biz.social_tiktok || biz.social_facebook) && (
                <div className="bp__socials">
                  {biz.social_telegram && (
                    <a href={biz.social_telegram.startsWith('http') ? biz.social_telegram : `https://t.me/${biz.social_telegram.replace(/^@/,'')}`} target="_blank" rel="noopener noreferrer" className="bp__social-btn bp__social-btn--telegram" title="Telegram">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.88 13.47l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.953z"/>
                      </svg>
                    </a>
                  )}
                  {biz.social_whatsapp && (
                    <a href={biz.social_whatsapp.startsWith('http') ? biz.social_whatsapp : `https://wa.me/${biz.social_whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className="bp__social-btn bp__social-btn--whatsapp" title="WhatsApp">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zm-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884zm8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </a>
                  )}
                  {biz.social_instagram && (
                    <a href={biz.social_instagram.startsWith('http') ? biz.social_instagram : `https://instagram.com/${biz.social_instagram.replace(/^@/,'')}`} target="_blank" rel="noopener noreferrer" className="bp__social-btn bp__social-btn--instagram" title="Instagram">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                      </svg>
                    </a>
                  )}
                  {biz.social_tiktok && (
                    <a href={biz.social_tiktok.startsWith('http') ? biz.social_tiktok : `https://tiktok.com/@${biz.social_tiktok.replace(/^@/,'')}`} target="_blank" rel="noopener noreferrer" className="bp__social-btn bp__social-btn--tiktok" title="TikTok">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.2 8.2 0 004.79 1.53V6.75a4.85 4.85 0 01-1.02-.06z"/>
                      </svg>
                    </a>
                  )}
                  {biz.social_facebook && (
                    <a href={biz.social_facebook.startsWith('http') ? biz.social_facebook : `https://facebook.com/${biz.social_facebook.replace(/^@/,'')}`} target="_blank" rel="noopener noreferrer" className="bp__social-btn bp__social-btn--facebook" title="Facebook">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </a>
                  )}
                </div>
              )}
            </section>

            <InfoTabs
              biz={biz}
              categoryIcon={categoryIcon}
              faq={faq}
              navigate={navigate}
              surveyAnswers={surveyAnswers}
            />

            <Gallery posts={posts} onVideoSelect={setSelectedVideo} onPhotoSelect={setSelectedPhoto} isPremium={biz.is_vip} />

            {posts.filter(p => p.text?.trim()).length > 0 && (
              <section className="bp__card" id="section-posts">
                <h2 className="bp__card-title">{t('biz_publications')} <span className="bp__pill">{posts.filter(p => p.text?.trim()).length}</span></h2>
                <div className="bp__feed">
                  {(() => {
                    const textPosts = posts.filter(p => p.text?.trim())
                    const totalPages = Math.ceil(textPosts.length / POSTS_PER_PAGE)
                    const start = postsPage * POSTS_PER_PAGE
                    const end = start + POSTS_PER_PAGE
                    const visiblePosts = textPosts.slice(start, end)
                    return visiblePosts.map(post => (
                      <div key={post.id} className="bp__feed-item" style={{ cursor: 'pointer' }} onClick={() => setSelectedPost(post)}>
                        <div className="bp__feed-body">
                          {post.media_display && (
                            post.media_type === 'VIDEO' ? (
                              <div
                                className="bp__feed-media bp__feed-media--video"
                                onClick={e => { e.stopPropagation(); setSelectedVideo({ url: post.media_display, title: post.text || '' }) }}
                                style={{ position: 'relative', cursor: 'pointer', marginBottom: 8 }}
                              >
                                <video
                                  src={post.media_display}
                                  muted
                                  preload="metadata"
                                  style={{ width: '100%', borderRadius: 8, display: 'block' }}
                                />
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, color: '#fff', textShadow: '0 0 8px rgba(0,0,0,.6)' }}>▶</div>
                              </div>
                            ) : (
                              <img
                                className="bp__feed-media"
                                src={post.media_display}
                                alt=""
                                loading="lazy"
                                style={{ width: '100%', borderRadius: 8, display: 'block', marginBottom: 8, objectFit: 'cover' }}
                              />
                            )
                          )}
                          {post.text && <p className="bp__feed-text">{post.text}</p>}
                          <div className="bp__feed-footer">
                            <span className="bp__feed-date">
                              {new Date(post.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                            </span>
                            {isOwner && (
                              <button
                                className="bp__feed-delete"
                                onClick={e => { e.stopPropagation(); handleDeletePost(post.id) }}
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
                  const textPosts = posts.filter(p => p.text?.trim())
                  const totalPages = Math.ceil(textPosts.length / POSTS_PER_PAGE)
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
            <div className="premium-carousel__mosaic bp__sim-mosaic">
              {similar.map(s => {
                const isVid = s.logo && /\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(s.logo)
                const photo = resolveUrl(s.logo) || `https://picsum.photos/id/${(s.id % 80) + 10}/500/400`
                return (
                  <div
                    key={s.id}
                    className="pc-card"
                    onClick={() => navigate(`/business/${s.id}`)}
                  >
                    {isVid
                      ? <video src={photo} muted loop playsInline preload="metadata" draggable={false} />
                      : <img src={photo} alt={s.brand_name} loading="lazy" decoding="async" draggable={false} />
                    }
                    <div className="pc-card__overlay">
                      <div className="pc-card__overlay-top">
                        {(s.is_vip || s.is_pro || s.plan_type === 'VIP' || s.plan_type === 'PRO') && (
                          <span className={`pc-card__badge${s.plan_type === 'PRO' || s.is_pro ? ' pc-card__badge--pro' : ''}`}>
                            {s.plan_type === 'PRO' || s.is_pro ? 'PRO' : 'VIP'}
                          </span>
                        )}
                        {s.is_verified && (
                          <span className="pc-card__verified">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff">
                              <path d="M12 2L9.19 4.09 5.5 3.82 4.41 7.41 1.42 9.72 2.83 13.21 1.42 16.71 4.41 19 5.5 22.59 9.19 22.32 12 24.41 14.81 22.32 18.5 22.59 19.59 19 22.58 16.71 21.17 13.21 22.58 9.72 19.59 7.41 18.5 3.82 14.81 4.09 12 2ZM10.09 16.72L7.29 13.91 8.71 12.5 10.09 13.88 15.34 8.63 16.76 10.05 10.09 16.72Z"/>
                            </svg>
                          </span>
                        )}
                      </div>
                      <span className="pc-card__name">{s.brand_name}</span>
                      {s.city && <span className="pc-card__city">{s.city}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
