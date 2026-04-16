import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './PremiumCarousel.css'

const COLS = 5
const ROWS = 2
const PAGE_SIZE = COLS * ROWS

function getPhoto(biz) {
  if (biz.logo) {
    return biz.logo.startsWith('http') ? biz.logo : `https://api.101-school.uz${biz.logo}`
  }
  return `https://picsum.photos/id/${(biz.id % 80) + 10}/500/400`
}

export default function PremiumCarousel({ businesses = [] }) {
  const navigate  = useNavigate()
  const trackRef  = useRef(null)
  const timerRef  = useRef(null)

  const slides = useRef([])
  if (businesses.length > 0) {
    const len = businesses.length
    const count = Math.min(12, Math.ceil(len / PAGE_SIZE))
    slides.current = Array.from({ length: count }, (_, i) =>
      Array.from({ length: PAGE_SIZE }, (_, j) => businesses[(i * PAGE_SIZE + j) % len])
    )
  }
  const total = slides.current.length

  const [page, setPage]     = useState(0)
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)

  const dragRef = useRef({ active: false, startX: 0, startOffset: 0, moved: false })
  const pageRef = useRef(0)

  useEffect(() => { pageRef.current = page }, [page])

  const getPageW = () => {
    const trackW = trackRef.current?.offsetWidth ?? 0
    return trackW / (total || 1)
  }

  const goToPage = useCallback((idx) => {
    const pageW = getPageW()
    const target = -idx * pageW
    if (trackRef.current) trackRef.current.style.transition = ''
    setOffset(target)
    setPage(idx)
    pageRef.current = idx
  }, [total])

  const resetTimer = useCallback(() => {
    clearInterval(timerRef.current)
    if (total > 1) {
      timerRef.current = setInterval(() => {
        const next = (pageRef.current + 1) % total
        goToPage(next)
      }, 5000)
    }
  }, [total, goToPage])

  useEffect(() => {
    resetTimer()
    return () => clearInterval(timerRef.current)
  }, [resetTimer])

  // ── Drag handlers на окне ──
  const startDrag = useCallback((e) => {
    if (total < 2) return
    clearInterval(timerRef.current)
    dragRef.current = { active: true, startX: e.clientX, startOffset: offset, moved: false }
    setDragging(true)
    if (trackRef.current) trackRef.current.style.transition = 'none'
  }, [offset, total])

  const moveDrag = useCallback((e) => {
    if (!dragRef.current.active) return
    const dx = e.clientX - dragRef.current.startX
    if (Math.abs(dx) > 5) dragRef.current.moved = true
    setOffset(dragRef.current.startOffset + dx)
  }, [])

  const endDrag = useCallback((e) => {
    if (!dragRef.current.active) return
    dragRef.current.active = false
    setDragging(false)
    if (trackRef.current) trackRef.current.style.transition = ''

    const dx = e.clientX - dragRef.current.startX
    const pageW = getPageW()
    let next = pageRef.current

    if (Math.abs(dx) > pageW * 0.15) {
      next = dx < 0
        ? Math.min(total - 1, pageRef.current + 1)
        : Math.max(0, pageRef.current - 1)
    }
    goToPage(next)
    resetTimer()
  }, [total, goToPage, resetTimer])

  // Добавляем слушатели на window
  useEffect(() => {
    window.addEventListener('mousemove', moveDrag)
    window.addEventListener('mouseup', endDrag)
    window.addEventListener('mouseleave', endDrag)
    return () => {
      window.removeEventListener('mousemove', moveDrag)
      window.removeEventListener('mouseup', endDrag)
      window.removeEventListener('mouseleave', endDrag)
    }
  }, [moveDrag, endDrag])

  const handleCardClick = (id) => {
    if (!dragRef.current.moved) navigate(`/business/${id}`)
  }

  if (total === 0) return null

  const allSlides = slides.current

  return (
    <section className="premium-carousel">
      <div
        className="premium-carousel__viewport"
        onMouseDown={startDrag}
        onTouchStart={e => {
          if (total < 2) return
          clearInterval(timerRef.current)
          const touch = e.touches[0]
          dragRef.current = { active: true, startX: touch.clientX, startOffset: offset, moved: false }
          setDragging(true)
          if (trackRef.current) trackRef.current.style.transition = 'none'
        }}
      >
        <div
          ref={trackRef}
          className={`premium-carousel__track${dragging ? ' premium-carousel__track--dragging' : ''}`}
          style={{
            transform: `translateX(${offset}px)`,
            width: `${total * 100}%`,
          }}
          onTouchMove={e => {
            if (!dragRef.current.active) return
            const touch = e.touches[0]
            const dx = touch.clientX - dragRef.current.startX
            if (Math.abs(dx) > 5) dragRef.current.moved = true
            setOffset(dragRef.current.startOffset + dx)
          }}
          onTouchEnd={e => {
            if (!dragRef.current.active) return
            dragRef.current.active = false
            setDragging(false)
            if (trackRef.current) trackRef.current.style.transition = ''

            const touch = e.changedTouches[0]
            const dx = touch.clientX - dragRef.current.startX
            const w = getW()
            let next = pageRef.current

            if (Math.abs(dx) > w * 0.15) {
              next = dx < 0
                ? Math.min(total - 1, pageRef.current + 1)
                : Math.max(0, pageRef.current - 1)
            }
            goToPage(next)
            resetTimer()
          }}
        >
          {allSlides.map((slide, si) => (
            <div
              key={si}
              className="premium-carousel__slide"
              style={{ width: `${100 / total}%` }}
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
                    loading={si === 0 ? 'eager' : 'lazy'}
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
          ))}
        </div>
      </div>

      {total > 1 && (
        <div className="premium-carousel__dots">
          {allSlides.map((_, i) => (
            <button
              key={i}
              className={`premium-carousel__dot${i === page ? ' premium-carousel__dot--active' : ''}`}
              onClick={() => { goToPage(i); resetTimer() }}
            />
          ))}
        </div>
      )}
    </section>
  )
}
