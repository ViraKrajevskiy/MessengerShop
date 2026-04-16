import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { resolveUrl } from '../utils/urlUtils'
import './PremiumCarousel.css'

const PAGE_SIZE = 10

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

export default function PremiumCarousel({ businesses = [] }) {
  const navigate  = useNavigate()
  const slides    = buildSlides(businesses)
  const total     = slides.length

  const [page, setPage] = useState(0)
  const startX    = useRef(null)
  const wasDrag   = useRef(false)
  const timerRef  = useRef(null)

  const goNext = useCallback(() => setPage(p => (p + 1) % total), [total])
  const goPrev = useCallback(() => setPage(p => (p - 1 + total) % total), [total])

  const resetTimer = useCallback(() => {
    clearInterval(timerRef.current)
    if (total > 1) timerRef.current = setInterval(goNext, 5000)
  }, [goNext, total])

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
  const handleCardClick = (id) => { if (!wasDrag.current) navigate(`/business/${id}`) }

  if (slides.length === 0) return null

  const slide = slides[page]

  return (
    <section className="premium-carousel">
      <div
        className="premium-carousel__mosaic"
        onMouseDown={e => onDragStart(e.clientX)}
        onTouchStart={e => onDragStart(e.touches[0].clientX)}
        onTouchMove={e => onDragMove(e.touches[0].clientX)}
        onTouchEnd={e => onDragEnd(e.changedTouches[0].clientX)}
      >
        {slide.map((biz, i) => (
          <div
            key={i}
            className="pc-card"
            onClick={() => handleCardClick(biz.id)}
          >
            <img
              src={getPhoto(biz)}
              alt={biz.brand_name || biz.name}
              loading="lazy"
              draggable={false}
            />
            <div className="pc-card__overlay">
              <span className={`pc-card__badge${biz.plan_type === 'PRO' || biz.is_pro ? ' pc-card__badge--pro' : ''}`}>
                {biz.plan_type === 'PRO' || biz.is_pro ? 'PRO' : 'VIP'}
              </span>
              <span className="pc-card__name">{biz.brand_name || biz.name}</span>
              {biz.city && <span className="pc-card__city">{biz.city}</span>}
            </div>
          </div>
        ))}
      </div>

      {total > 1 && (
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
