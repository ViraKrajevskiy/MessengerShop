import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { apiToggleSubscription } from '../api/businessApi'
import { makeInitialAvatar } from '../utils/defaults'
import VideoModal from './VideoModal'
import { timeAgo } from '../utils/timeUtils'
import { resolveUrl } from '../utils/urlUtils'
import './PostCard.css'

const FALLBACK_IMG = 'https://picsum.photos/id/342/800/600'

// Module-level cache for video poster frames so the same video URL is never
// re-fetched across multiple PostCards or remounts.
// Keys: video URL → { status: 'pending'|'done'|'fail', poster?: string, waiters?: Array<fn> }
const POSTER_CACHE = new Map()

function getOrExtractPoster(videoUrl) {
  return new Promise((resolve) => {
    if (!videoUrl) { resolve(null); return }
    const cached = POSTER_CACHE.get(videoUrl)
    if (cached?.status === 'done') { resolve(cached.poster); return }
    if (cached?.status === 'fail') { resolve(null); return }
    if (cached?.status === 'pending') { cached.waiters.push(resolve); return }

    const entry = { status: 'pending', waiters: [resolve] }
    POSTER_CACHE.set(videoUrl, entry)

    const finish = (poster) => {
      const e = POSTER_CACHE.get(videoUrl)
      if (!e) return
      e.status = poster ? 'done' : 'fail'
      e.poster = poster
      const waiters = e.waiters || []
      e.waiters = null
      waiters.forEach(fn => fn(poster))
    }

    const video = document.createElement('video')
    video.src = videoUrl
    video.crossOrigin = 'anonymous'
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true

    let done = false
    const cleanup = () => {
      video.removeEventListener('loadedmetadata', onMeta)
      video.removeEventListener('seeked', onSeeked)
      video.removeEventListener('error', onError)
      try { video.removeAttribute('src'); video.load() } catch { /* ignore */ }
    }
    const onMeta = () => { try { video.currentTime = 0.1 } catch { onError() } }
    const onSeeked = () => {
      if (done) return
      done = true
      try {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth || 400
        canvas.height = video.videoHeight || 300
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0)
        const data = canvas.toDataURL('image/jpeg', 0.7)
        cleanup()
        finish(data)
      } catch {
        cleanup()
        finish(null)
      }
    }
    const onError = () => {
      if (done) return
      done = true
      cleanup()
      finish(null)
    }

    video.addEventListener('loadedmetadata', onMeta)
    video.addEventListener('seeked', onSeeked)
    video.addEventListener('error', onError)
    // Safety timeout — give up after 8s and stop downloading
    setTimeout(() => { if (!done) onError() }, 8000)
  })
}

export default function PostCard({ post, onDelete }) {
  const navigate = useNavigate()
  const { user, getAccessToken } = useAuth()
  const { t } = useLanguage()
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [followed, setFollowed] = useState(post.is_subscribed || false)
  const [subLoading, setSubLoading] = useState(false)
  const [fav, setFav] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [posterUrl, setPosterUrl] = useState(() => {
    if (post.media_type !== 'VIDEO') return null
    const cached = POSTER_CACHE.get(post.media_display)
    return cached?.status === 'done' ? cached.poster : null
  })
  const cardRef = useRef(null)

  const FAVS_KEY = 'post_favorites'

  useEffect(() => {
    if (!user) { setFav(false); return }
    const stored = JSON.parse(localStorage.getItem(FAVS_KEY) || '[]')
    setFav(stored.includes(post.id))
  }, [user, post.id])

  // Extract video poster lazily — only when card is near viewport AND only once per URL.
  useEffect(() => {
    if (post.media_type !== 'VIDEO' || !post.media_display) {
      setPosterUrl(null)
      return
    }
    const cached = POSTER_CACHE.get(post.media_display)
    if (cached?.status === 'done') { setPosterUrl(cached.poster); return }
    if (cached?.status === 'fail') { setPosterUrl(null); return }

    let cancelled = false
    const trigger = () => {
      getOrExtractPoster(post.media_display).then((poster) => {
        if (!cancelled && poster) setPosterUrl(poster)
      })
    }

    const el = cardRef.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      // Fallback — extract immediately
      trigger()
      return () => { cancelled = true }
    }

    const io = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) {
        io.disconnect()
        trigger()
      }
    }, { rootMargin: '200px' })
    io.observe(el)

    return () => { cancelled = true; io.disconnect() }
  }, [post.media_type, post.media_display])

  const toggleFav = (e) => {
    e.stopPropagation()
    if (!user) { navigate('/login'); return }
    const stored = JSON.parse(localStorage.getItem(FAVS_KEY) || '[]')
    let next
    if (stored.includes(post.id)) {
      next = stored.filter(x => x !== post.id)
    } else {
      next = [...stored, post.id]
    }
    localStorage.setItem(FAVS_KEY, JSON.stringify(next))
    setFav(next.includes(post.id))
  }

  const logo = post.business_logo
    ? resolveUrl(post.business_logo)
    : makeInitialAvatar(post.business_name)

  // For videos, use extracted poster or dark placeholder
  const getVideoPlaceholder = () => {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23222;stop-opacity:1'/%3E%3Cstop offset='100%25' style='stop-color:%23111;stop-opacity:1'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='300' fill='url(%23g)'/%3E%3Ctext x='200' y='150' font-size='64' fill='%23fff' text-anchor='middle' dominant-baseline='middle' opacity='0.6'%3E&#9654;%3C/text%3E%3C/svg%3E`
  }
  const media = post.media_type === 'VIDEO'
    ? (posterUrl || getVideoPlaceholder())
    : (post.media_display || FALLBACK_IMG)

  const SHORT = 100
  const isLong = post.text && post.text.length > SHORT

  const handleFollow = async (e) => {
    e.stopPropagation()
    if (!user) { navigate('/login'); return }
    if (subLoading) return
    setSubLoading(true)
    try {
      const token = await getAccessToken()
      const data = await apiToggleSubscription(post.business_id, token)
      setFollowed(data.subscribed)
    } catch { /* ignore */ } finally {
      setSubLoading(false)
    }
  }

  return (
    <>
      {selectedVideo && (
        <VideoModal
          videoUrl={selectedVideo.url}
          title={selectedVideo.title}
          onClose={() => setSelectedVideo(null)}
        />
      )}
      <div className="post-card" ref={cardRef} onClick={() => navigate(`/business/${post.business_id}`)}>
      <div className="post-card__header">
        <img className="post-card__avatar" src={logo} alt={post.business_name}
          onClick={(e) => { e.stopPropagation(); navigate(`/business/${post.business_id}`) }} />
        <div className="post-card__meta">
          <span className="post-card__name">
            {post.business_name}
            {post.is_verified && (
              <svg className="post-card__verified" width="14" height="14" viewBox="0 0 24 24" fill="#2196f3">
                <path d="M12 2L9.19 4.09 5.5 3.82 4.41 7.41 1.42 9.72 2.83 13.21 1.42 16.71 4.41 19 5.5 22.59 9.19 22.32 12 24.41 14.81 22.32 18.5 22.59 19.59 19 22.58 16.71 21.17 13.21 22.58 9.72 19.59 7.41 18.5 3.82 14.81 4.09 12 2ZM10.09 16.72L7.29 13.91 8.71 12.5 10.09 13.88 15.34 8.63 16.76 10.05 10.09 16.72Z"/>
              </svg>
            )}
          </span>
          {post.created_at && (
            <span className="post-card__time">{timeAgo(post.created_at)}</span>
          )}
        </div>
        <button
          className={`post-card__follow ${followed ? 'post-card__follow--active' : ''}`}
          onClick={handleFollow}
          disabled={subLoading}
        >
          {followed ? t('post_subscribed') : 'Подписаться'}
        </button>
      </div>

      <div
        className={`post-card__image${post.media_type === 'VIDEO' ? ' post-card__image--video' : ''}`}
        onClick={(e) => {
          if (post.media_type === 'VIDEO') {
            e.stopPropagation()
            setSelectedVideo({ url: post.media_display, title: post.text })
          }
        }}
      >
        <img src={media} alt="" loading="lazy" width="400" height="300" draggable={false} />
        {post.media_type === 'VIDEO' && <div className="post-card__play">▶</div>}
      </div>

      {post.text && (
        <div className="post-card__body">
          <p className={`post-card__text${expanded ? ' post-card__text--expanded' : ''}`}>
            {isLong && !expanded ? post.text.slice(0, SHORT) + '...' : post.text}
          </p>
          {isLong && (
            <span
              className="post-card__readmore"
              onClick={(e) => { e.stopPropagation(); setExpanded(prev => !prev) }}
            >
              {expanded ? t('post_collapse') : t('post_readMore')}
            </span>
          )}
        </div>
      )}

      <div className="post-card__footer">
        <button
          className={`post-card__fav ${fav ? 'post-card__fav--active' : ''}`}
          onClick={toggleFav}
          title={fav ? t('post_removeFav') : t('post_addFav')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
          </svg>
          <span>{fav ? '1' : '0'}</span>
        </button>

        {onDelete && (
          <button
            className="post-card__delete"
            onClick={async (e) => {
              e.stopPropagation()
              if (deleteLoading) return
              setDeleteLoading(true)
              try { await onDelete(post.id) } finally { setDeleteLoading(false) }
            }}
            disabled={deleteLoading}
            title={t('post_delete')}
          >
            {deleteLoading
              ? <span className="post-card__delete-spinner" />
              : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4h6v2"/>
                </svg>
              )
            }
          </button>
        )}
      </div>
    </div>
    </>
  )
}
