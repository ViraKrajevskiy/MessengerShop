import { useState, useEffect, useCallback } from 'react'
import './HeroSlider.css'

const FALLBACK = [
  { src: 'https://picsum.photos/id/342/600/500', alt: '' },
  { src: 'https://picsum.photos/id/177/600/500', alt: '' },
  { src: 'https://picsum.photos/id/239/600/500', alt: '' },
  { src: 'https://picsum.photos/id/306/600/500', alt: '' },
  { src: 'https://picsum.photos/id/338/600/500', alt: '' },
  { src: 'https://picsum.photos/id/349/600/500', alt: '' },
]

export default function HeroSlider({ images = [] }) {
  const imgs = images.length >= 3 ? images : FALLBACK
  // show 3 per page: left-big | center-single | right-big
  const PAGE_SIZE = 3
  const totalPages = Math.ceil(imgs.length / PAGE_SIZE)
  const [page, setPage] = useState(0)

  const goNext = useCallback(() => setPage(p => (p + 1) % totalPages), [totalPages])

  useEffect(() => {
    const timer = setInterval(goNext, 4000)
    return () => clearInterval(timer)
  }, [goNext])

  const pageImgs = Array.from({ length: 3 }, (_, i) => imgs[(page * PAGE_SIZE + i) % imgs.length])

  return (
    <div className="hero-slider">
      <div className="hero-slider__mosaic">
        {/* left big */}
        <div className="hero-slider__big">
          <img
            src={pageImgs[0].src}
            alt={pageImgs[0].alt || ''}
            loading="eager"
            fetchPriority="high"
            sizes="(max-width: 480px) 100vw, (max-width: 768px) 33vw, 33vw"
          />
        </div>
        {/* center — one photo spanning both rows */}
        <div className="hero-slider__center">
          <img
            src={pageImgs[1].src}
            alt={pageImgs[1].alt || ''}
            loading="lazy"
            sizes="(max-width: 480px) 100vw, (max-width: 768px) 33vw, 33vw"
          />
        </div>
        {/* right big */}
        <div className="hero-slider__big">
          <img
            src={pageImgs[2].src}
            alt={pageImgs[2].alt || ''}
            loading="lazy"
            sizes="(max-width: 480px) 0vw, (max-width: 768px) 33vw, 33vw"
          />
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
