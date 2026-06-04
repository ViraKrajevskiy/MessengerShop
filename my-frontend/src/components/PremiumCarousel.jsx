import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { resolveUrl } from '../utils/urlUtils'
import VerifiedBadge from './VerifiedBadge'
import './PremiumCarousel.css'

const isVideoSrc = (src) => src && /\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(src)

function onImgEnter(e) {
  const v = e.currentTarget.querySelector('video')
  if (v) v.play().catch(() => {})
}
function onImgLeave(e) {
  const v = e.currentTarget.querySelector('video')
  if (v) { v.pause(); v.currentTime = 0 }
}

const PAGE_SIZE = 10
const MOBILE_BREAKPOINT = 500

function buildSlides(businesses) {
  if (businesses.length === 0) return []
  const len = businesses.length
  const maxSlides = Math.min(12, Math.ceil(len / PAGE_SIZE))
  return Array.from({ length: maxSlides }, (_, i) =>
    Array.from({ length: PAGE_SIZE }, (_, j) => businesses[(i * PAGE_SIZE + j) % len])
  )
}

const PH_COLORS = [
  ['#6366f1', '#8b5cf6'], ['#e53935', '#b71c1c'], ['#0891b2', '#0e7490'],
  ['#059669', '#047857'], ['#d97706', '#b45309'], ['#7c3aed', '#5b21b6'],
]

// Instant inline-SVG gradient placeholder. Replaces picsum.photos which had
// ~5.5s resource-load delay and was the LCP element.
function placeholder(biz) {
  const [c1, c2] = PH_COLORS[(biz.id || 0) % PH_COLORS.length]
  const label = (biz.brand_name || biz.name || '').slice(0, 22)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="500" height="400" fill="url(#g)"/><text x="250" y="210" text-anchor="middle" font-size="32" font-weight="700" fill="rgba(255,255,255,0.92)" font-family="sans-serif">${label}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function getPhoto(biz) {
  // Prefer dedicated cover photo; fall back to logo
  const src = biz.cover || biz.logo
  if (src) return resolveUrl(src)
  return placeholder(biz)
}

export default function PremiumCarousel({ businesses = [], onMessage }) {
  const navigate  = useNavigate()
  const slides    = buildSlides(businesses)
  const total     = slides.length

  const [page, setPage] = useState(0)
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT
  )
  const startX    = useRef(null)
  const wasDrag   = useRef(false)
  const timerRef  = useRef(null)

  // Mobile scroll dots
  const mobileRef = useRef(null)
  const [mobilePage, setMobilePage] = useState(0)
  const mobileTotalPages = Math.ceil(businesses.length / 4) // 2 cols × 2 rows per page
  const onMobileScroll = () => {
    const el = mobileRef.current
    if (!el) return
    setMobilePage(Math.round(el.scrollLeft / el.clientWidth))
  }

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const goNext = useCallback(() => setPage(p => (p + 1) % total), [total])
  const goPrev = useCallback(() => setPage(p => (p - 1 + total) % total), [total])

  const resetTimer = useCallback(() => {
    clearInterval(timerRef.current)
    if (total > 1 && !isMobile) timerRef.current = setInterval(goNext, 5000)
  }, [goNext, total, isMobile])

  useEffect(() => {
    resetTimer()
    return () => clearInterval(timerRef.current)
  }, [resetTimer])

  const onDragStart = useCallback((clientX) => {
    startX.current = clientX
    wasDrag.current = false
  }, [])

  const onDragMove = useCallback((clientX) => {
    if (startX.current === null) return
    const dx = clientX - startX.current
    if (Math.abs(dx) > 5) wasDrag.current = true
  }, [])

  const onDragEnd = useCallback((clientX) => {
    if (startX.current === null) return
    const dx = clientX - startX.current
    if (Math.abs(dx) > 40) {
      dx < 0 ? goNext() : goPrev()
      resetTimer()
    }
    startX.current = null
    wasDrag.current = false
  }, [goNext, goPrev, resetTimer])

  useEffect(() => {
    const handleMouseMove = (e) => onDragMove(e.clientX)
    const handleMouseUp = (e) => onDragEnd(e.clientX)

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [onDragMove, onDragEnd])

  const handleDotClick = (i) => { setPage(i); resetTimer() }
  const handleCardClick = (biz) => {
    if (wasDrag.current) return
    navigate(`/business/${biz.id}`)
  }

  // Skeleton placeholder while loading — reserves exact height to prevent CLS
  if (slides.length === 0) {
    return (
      <section className="premium-carousel" aria-busy="true">
        <div className={`premium-carousel__mosaic${isMobile ? ' premium-carousel__mosaic--scroll' : ''}`}>
          {Array.from({ length: isMobile ? 6 : 10 }).map((_, i) => (
            <div key={i} className="pc-card pc-card--skeleton" />
          ))}
        </div>
      </section>
    )
  }

  const slide = slides[page]
  // On mobile, show ALL businesses in a single horizontal scroll row (native scroll)
  const items = isMobile ? businesses : slide

  const mosaicProps = isMobile
    ? { ref: mobileRef, onScroll: onMobileScroll }
    : {
        onMouseDown: e => onDragStart(e.clientX),
        onTouchStart: e => onDragStart(e.touches[0].clientX),
        onTouchMove: e => onDragMove(e.touches[0].clientX),
        onTouchEnd: e => onDragEnd(e.changedTouches[0].clientX),
      }

  return (
    <section className="premium-carousel">
      <div
        className={`premium-carousel__mosaic${isMobile ? ' premium-carousel__mosaic--scroll' : ''}`}
        {...mosaicProps}
      >
        {items.map((biz, i) => (
          <div
            key={i}
            className="pc-card"
            onClick={() => handleCardClick(biz)}
            onMouseEnter={onImgEnter}
            onMouseLeave={onImgLeave}
          >
            {isVideoSrc(biz.cover || biz.logo)
              ? <video src={resolveUrl(biz.cover || biz.logo)} muted loop playsInline preload="metadata" draggable={false} />
              : <img
                  src={getPhoto(biz)}
                  alt={biz.brand_name || biz.name}
                  loading={i < 5 ? 'eager' : 'lazy'}
                  fetchPriority={i < 5 ? 'high' : 'auto'}
                  decoding="async"
                  draggable={false}
                  onError={e => { e.target.onerror = null; e.target.src = placeholder(biz) }}
                />
            }
            <div className="pc-card__overlay">
              <div className="pc-card__overlay-top">
                <span className={`pc-card__badge${biz.plan_type === 'PRO' || biz.is_pro ? ' pc-card__badge--pro' : ''}`}>
                  {biz.plan_type === 'PRO' || biz.is_pro ? 'PRO' : 'VIP'}
                </span>
                {biz.is_verified && (
                  <span className="pc-card__verified" title="">
                    <VerifiedBadge size={12} />
                  </span>
                )}
              </div>
              <span className="pc-card__name">{biz.brand_name || biz.name}</span>
              {biz.city && <span className="pc-card__city">{biz.city}</span>}
            </div>
          </div>
        ))}
      </div>

      {!isMobile && total > 1 && (
        <div className="premium-carousel__dots">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`premium-carousel__dot${i === page ? ' premium-carousel__dot--active' : ''}`}
              onClick={() => handleDotClick(i)}
            />
          ))}
        </div>
      )}
      {isMobile && mobileTotalPages > 1 && (
        <div className="premium-carousel__dots">
          {Array.from({ length: mobileTotalPages }).map((_, i) => (
            <button
              key={i}
              className={`premium-carousel__dot${i === mobilePage ? ' premium-carousel__dot--active' : ''}`}
              onClick={() => {
                const el = mobileRef.current
                if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
              }}
            />
          ))}
        </div>
      )}
    </section>
  )
}
