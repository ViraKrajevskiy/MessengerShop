import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { resolveUrl } from '../utils/urlUtils'
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

function getPhoto(biz) {
  if (biz.logo) {
    return resolveUrl(biz.logo)
  }
  return `https://picsum.photos/id/${(biz.id % 80) + 10}/500/400`
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
    ? {}
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
            {isVideoSrc(biz.logo)
              ? <video src={resolveUrl(biz.logo)} muted loop playsInline preload="metadata" draggable={false} />
              : <img
                  src={getPhoto(biz)}
                  alt={biz.brand_name || biz.name}
                  loading={i < 5 ? 'eager' : 'lazy'}
                  fetchPriority={i < 5 ? 'high' : 'auto'}
                  decoding="async"
                  draggable={false}
                />
            }
            <div className="pc-card__overlay">
              <div className="pc-card__overlay-top">
                <span className={`pc-card__badge${biz.plan_type === 'PRO' || biz.is_pro ? ' pc-card__badge--pro' : ''}`}>
                  {biz.plan_type === 'PRO' || biz.is_pro ? 'PRO' : 'VIP'}
                </span>
                {biz.is_verified && (
                  <span className="pc-card__verified" title="Официальный">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff">
                      <path d="M12 2L9.19 4.09 5.5 3.82 4.41 7.41 1.42 9.72 2.83 13.21 1.42 16.71 4.41 19 5.5 22.59 9.19 22.32 12 24.41 14.81 22.32 18.5 22.59 19.59 19 22.58 16.71 21.17 13.21 22.58 9.72 19.59 7.41 18.5 3.82 14.81 4.09 12 2ZM10.09 16.72L7.29 13.91 8.71 12.5 10.09 13.88 15.34 8.63 16.76 10.05 10.09 16.72Z"/>
                    </svg>
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
    </section>
  )
}
