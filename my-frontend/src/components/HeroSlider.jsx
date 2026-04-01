import { useState, useEffect, useCallback } from 'react'
import './HeroSlider.css'

const FALLBACK = [
  { src: 'https://picsum.photos/id/342/800/600', alt: '' },
  { src: 'https://picsum.photos/id/177/800/600', alt: '' },
  { src: 'https://picsum.photos/id/239/800/600', alt: '' },
  { src: 'https://picsum.photos/id/306/800/600', alt: '' },
  { src: 'https://picsum.photos/id/338/800/600', alt: '' },
  { src: 'https://picsum.photos/id/349/800/600', alt: '' },
  { src: 'https://picsum.photos/id/366/800/600', alt: '' },
  { src: 'https://picsum.photos/id/399/800/600', alt: '' },
  { src: 'https://picsum.photos/id/429/800/600', alt: '' },
  { src: 'https://picsum.photos/id/64/800/600',  alt: '' },
]

export default function HeroSlider({ images = [] }) {
  const imgs = images.length >= 6 ? images : FALLBACK
  const PAGE_SIZE = 6
  const totalPages = Math.ceil(imgs.length / PAGE_SIZE)
  const [page, setPage] = useState(0)

  const goNext = useCallback(() => setPage(p => (p + 1) % totalPages), [totalPages])

  useEffect(() => {
    const timer = setInterval(goNext, 4000)
    return () => clearInterval(timer)
  }, [goNext])

  const pageImgs = Array.from({ length: 6 }, (_, i) => imgs[(page * PAGE_SIZE + i) % imgs.length])

  return (
    <div className="hero-slider">
      <div className="hero-slider__mosaic">
        <div className="hero-slider__big">
          <img src={pageImgs[0].src} alt={pageImgs[0].alt || ''} loading="eager" />
        </div>
        <div className="hero-slider__small">
          <img src={pageImgs[1].src} alt={pageImgs[1].alt || ''} loading="lazy" />
        </div>
        <div className="hero-slider__small">
          <img src={pageImgs[2].src} alt={pageImgs[2].alt || ''} loading="lazy" />
        </div>
        <div className="hero-slider__big">
          <img src={pageImgs[3].src} alt={pageImgs[3].alt || ''} loading="lazy" />
        </div>
        <div className="hero-slider__small">
          <img src={pageImgs[4].src} alt={pageImgs[4].alt || ''} loading="lazy" />
        </div>
        <div className="hero-slider__small">
          <img src={pageImgs[5].src} alt={pageImgs[5].alt || ''} loading="lazy" />
        </div>
      </div>
      <div className="hero-slider__dots">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            className={`hero-slider__dot${i === page ? ' hero-slider__dot--active' : ''}`}
            onClick={() => setPage(i)}
          />
        ))}
      </div>
    </div>
  )
}
