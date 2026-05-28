import { useEffect } from 'react'
import './PostModal.css'

export default function PostModal({ post, photoUrl, onClose }) {
  const mediaSrc = post?.media_display || photoUrl
  const isVideo = post?.media_type === 'VIDEO' ||
    (mediaSrc && /\.(mp4|webm|mov|avi|mkv)(\?|#|$)/i.test(mediaSrc))
  const hasText = post?.text?.trim()
  const hasDate = post?.created_at

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!mediaSrc && !hasText) return null

  return (
    <div className="post-modal" onClick={onClose}>
      <div className="post-modal__box" onClick={e => e.stopPropagation()}>
        <button className="post-modal__close" onClick={onClose} aria-label="Закрыть">✕</button>

        {mediaSrc && (
          <div className="post-modal__media">
            {isVideo ? (
              <video
                src={mediaSrc}
                className="post-modal__video"
                controls
                autoPlay
                playsInline
              />
            ) : (
              <img src={mediaSrc} alt="" className="post-modal__img" draggable={false} />
            )}
          </div>
        )}

        {(hasText || hasDate) && (
          <div className="post-modal__body">
            {hasText && <p className="post-modal__text">{post.text}</p>}
            {hasDate && (
              <span className="post-modal__date">
                {new Date(post.created_at).toLocaleDateString('ru-RU', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
