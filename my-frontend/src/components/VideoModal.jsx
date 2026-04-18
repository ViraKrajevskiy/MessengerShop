import { useEffect, useRef } from 'react'
import './VideoModal.css'

export default function VideoModal({ videoUrl, title, onClose }) {
  const videoRef = useRef(null)

  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  return (
    <div className="video-modal" onClick={handleBackdropClick}>
      <div className="video-modal__container">
        <button className="video-modal__close" onClick={onClose} title="Закрыть (Esc)">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <video
          ref={videoRef}
          className="video-modal__video"
          src={videoUrl}
          controls
          autoPlay
          preload="metadata"
          playsInline
          controlsList="nodownload"
        />

        {title && <p className="video-modal__title">{title}</p>}
      </div>
    </div>
  )
}
