import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './PremiumCarousel.css'

const PAGE_SIZE = 5

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
    return biz.logo.startsWith('http') ? biz.logo : `https://api.101-school.uz${biz.logo}`
  }
  return `https://picsum.photos/id/${(biz.id % 80) + 10}/800/600`
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

  const onDragStart = (clientX) => {
    startX.current = clientX
    wasDrag.current = false
  }
  const onDragEnd = (clientX) => {
    if (startX.current === null) return
    const dx = clientX - startX.current
    if (Math.abs(dx) > 40) {
      wasDrag.current = true
      dx < 0 ? goNext() : goPrev()
      resetTimer()
    }
    startX.current = null
  }

  const handleDotClick = (i) => { setPage(i); resetTimer() }

  const handleCardClick = (id) => {
    if (!wasDrag.current) navigate(`/business/${id}`)
  }

  if (slides.length === 0) return null

  const slide = slides[page]

  const Card = ({ biz, big }) => (
    <div
      className={`pc-card${big ? ' pc-card--big' : ' pc-card--small'}`}
      onClick={() => handleCardClick(biz.id)}
    >
      <img src={getPhoto(biz)} alt={biz.brand_name || biz.name} loading="lazy" />
      <div className="pc-card__overlay">
        <span className={`pc-card__badge${biz.plan_type === 'PRO' || biz.is_pro ? ' pc-card__badge--pro' : ''}`}>
          {biz.plan_type === 'PRO' || biz.is_pro ? 'PRO' : 'VIP'}
        </span>
        <span className="pc-card__name">{biz.brand_name || biz.name}</span>
        {biz.city && <span className="pc-card__city">{biz.city}</span>}
      </div>
    </div>
  )

  return (
    <section className="premium-carousel">
      <div
        className="premium-carousel__mosaic"
        onMouseDown={e => onDragStart(e.clientX)}
        onMouseUp={e => onDragEnd(e.clientX)}
        onMouseLeave={() => { startX.current = null }}
        onTouchStart={e => onDragStart(e.touches[0].clientX)}
        onTouchEnd={e => onDragEnd(e.changedTouches[0].clientX)}
      >
        <Card biz={slide[0]} big />
        <div className="premium-carousel__grid">
          <Card biz={slide[1]} />
          <Card biz={slide[2]} />
          <Card biz={slide[3]} />
          <Card biz={slide[4]} />
        </div>
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
