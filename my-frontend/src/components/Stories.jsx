import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Stories.css'

// ---------- avatar photos ----------
const AVATARS = [
  'https://i.pravatar.cc/200?img=1',
  'https://i.pravatar.cc/200?img=5',
  'https://i.pravatar.cc/200?img=9',
  'https://i.pravatar.cc/200?img=16',
  'https://i.pravatar.cc/200?img=20',
  'https://i.pravatar.cc/200?img=23',
  'https://i.pravatar.cc/200?img=25',
  'https://i.pravatar.cc/200?img=32',
  'https://i.pravatar.cc/200?img=36',
  'https://i.pravatar.cc/200?img=44',
]

// ---------- mock stories data ----------
const storiesData = [
  {
    id: 0, userName: 'Анна', city: 'Стамбул', avatar: AVATARS[0],
    media: [
      { type: 'image', img: 'https://picsum.photos/id/64/600/900', caption: 'Новая коллекция в нашем салоне!' },
      { type: 'image', img: 'https://picsum.photos/id/96/600/900', caption: 'Скидки до 50% сегодня' },
      { type: 'video', img: 'https://picsum.photos/id/180/600/900', caption: 'Видео-обзор новинок' },
    ],
    comments: [
      { id: 0, author: 'Елена', text: 'Красиво! Где находится салон?', time: '10 мин. назад' },
      { id: 1, author: 'Мария', text: 'Хочу записаться!', time: '5 мин. назад' },
    ],
  },
  {
    id: 1, userName: 'Елена', city: 'Стамбул', avatar: AVATARS[1],
    media: [
      { type: 'image', img: 'https://picsum.photos/id/274/600/900', caption: 'Утренний Стамбул' },
      { type: 'image', img: 'https://picsum.photos/id/312/600/900', caption: 'Наш новый офис' },
    ],
    comments: [
      { id: 0, author: 'Ольга', text: 'Какой вид!', time: '1 ч. назад' },
    ],
  },
  {
    id: 2, userName: 'Мария', city: 'Стамбул', avatar: AVATARS[2],
    media: [
      { type: 'video', img: 'https://picsum.photos/id/164/600/900', caption: 'Обзор квартиры в центре' },
      { type: 'image', img: 'https://picsum.photos/id/188/600/900', caption: 'Вид с балкона' },
      { type: 'image', img: 'https://picsum.photos/id/365/600/900', caption: 'Район Бейоглу' },
    ],
    comments: [
      { id: 0, author: 'Дарья', text: 'Сколько стоит аренда?', time: '30 мин. назад' },
      { id: 1, author: 'Камила', text: 'Очень уютно!', time: '25 мин. назад' },
      { id: 2, author: 'Фатима', text: 'Какой этаж?', time: '15 мин. назад' },
    ],
  },
  {
    id: 3, userName: 'Ольга', city: 'Стамбул', avatar: AVATARS[3],
    media: [
      { type: 'image', img: 'https://picsum.photos/id/225/600/900', caption: 'Свежие продукты на рынке' },
    ],
    comments: [],
  },
  {
    id: 4, userName: 'Дарья', city: 'Стамбул', avatar: AVATARS[4],
    media: [
      { type: 'image', img: 'https://picsum.photos/id/20/600/900', caption: 'Курсы турецкого языка' },
      { type: 'video', img: 'https://picsum.photos/id/42/600/900', caption: 'Урок #1 — приветствия' },
    ],
    comments: [
      { id: 0, author: 'Нигора', text: 'Когда начало?', time: '2 ч. назад' },
    ],
  },
  {
    id: 5, userName: 'Камила', city: 'Стамбул', avatar: AVATARS[5],
    media: [
      { type: 'image', img: 'https://picsum.photos/id/349/600/900', caption: 'Дизайн интерьера' },
      { type: 'image', img: 'https://picsum.photos/id/357/600/900', caption: 'Проект кухни' },
    ],
    comments: [],
  },
  {
    id: 6, userName: 'Нигора', city: 'Стамбул', avatar: AVATARS[6],
    media: [
      { type: 'image', img: 'https://picsum.photos/id/160/600/900', caption: 'Юридическая консультация' },
    ],
    comments: [
      { id: 0, author: 'Анна', text: 'Нужна консультация по ВНЖ', time: '40 мин. назад' },
    ],
  },
  {
    id: 7, userName: 'Фатима', city: 'Стамбул', avatar: AVATARS[7],
    media: [
      { type: 'video', img: 'https://picsum.photos/id/318/600/900', caption: 'Тур по Стамбулу' },
      { type: 'image', img: 'https://picsum.photos/id/429/600/900', caption: 'Голубая мечеть' },
      { type: 'image', img: 'https://picsum.photos/id/399/600/900', caption: 'Гранд Базар' },
    ],
    comments: [
      { id: 0, author: 'Елена', text: 'Сколько стоит тур?', time: '3 ч. назад' },
      { id: 1, author: 'Мария', text: 'Великолепные фото!', time: '2 ч. назад' },
    ],
  },
]

// ---------- Story Viewer (fullscreen modal) ----------
function StoryViewer({ stories, startIndex, onClose }) {
  const [storyIdx, setStoryIdx] = useState(startIndex)
  const [mediaIdx, setMediaIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const [showComments, setShowComments] = useState(false)
  const [userComments, setUserComments] = useState({})
  const [commentText, setCommentText] = useState('')
  const timerRef = useRef(null)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const commentInputRef = useRef(null)
  const commentsEndRef = useRef(null)
  const navigate = useNavigate()

  const story = stories[storyIdx]
  const slide = story.media[mediaIdx]
  const DURATION = slide.type === 'video' ? 8000 : 5000

  // Merge mock + user comments
  const allComments = [
    ...(story.comments || []),
    ...(userComments[story.id] || []),
  ]

  // Auto-advance timer — pauses when comments are open
  useEffect(() => {
    if (showComments) {
      clearInterval(timerRef.current)
      return
    }

    setProgress(0)
    const startTime = Date.now()

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const pct = Math.min((elapsed / DURATION) * 100, 100)
      setProgress(pct)
      if (elapsed >= DURATION) goNext()
    }, 50)

    return () => clearInterval(timerRef.current)
  }, [storyIdx, mediaIdx, showComments])

  // Scroll to bottom when new comment added
  useEffect(() => {
    if (showComments) commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [allComments.length, showComments])

  const goNext = useCallback(() => {
    clearInterval(timerRef.current)
    if (mediaIdx < story.media.length - 1) {
      setMediaIdx((m) => m + 1)
    } else if (storyIdx < stories.length - 1) {
      setStoryIdx((s) => s + 1)
      setMediaIdx(0)
    } else {
      onClose()
    }
  }, [mediaIdx, storyIdx, story, stories.length, onClose])

  const goPrev = useCallback(() => {
    clearInterval(timerRef.current)
    if (mediaIdx > 0) {
      setMediaIdx((m) => m - 1)
    } else if (storyIdx > 0) {
      setStoryIdx((s) => s - 1)
      setMediaIdx(stories[storyIdx - 1].media.length - 1)
    }
  }, [mediaIdx, storyIdx, stories])

  // Keyboard
  useEffect(() => {
    const handleKey = (e) => {
      if (showComments) {
        if (e.key === 'Escape') setShowComments(false)
        return
      }
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext() }
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goNext, goPrev, onClose, showComments])

  // Touch / swipe
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e) => {
    if (showComments) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)
    if (absDy > 80 && absDy > absDx && dy > 0) { onClose(); return }
    if (absDx > 50 && absDx > absDy) { dx < 0 ? goNext() : goPrev() }
  }

  // Click left/right halves
  const handleMediaClick = (e) => {
    if (showComments) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    if (x < rect.width / 3) goPrev()
    else goNext()
  }

  // Profile navigation
  const handleProfileClick = (e) => {
    e.stopPropagation()
    onClose()
    navigate(`/profile/${story.id}`)
  }

  // Toggle comments panel
  const toggleComments = (e) => {
    e.stopPropagation()
    const opening = !showComments
    setShowComments(opening)
    if (opening) setTimeout(() => commentInputRef.current?.focus(), 150)
  }

  // Send comment
  const sendComment = (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    const newComment = {
      id: Date.now(),
      author: 'Вы',
      text: commentText.trim(),
      time: 'только что',
      isOwn: true,
    }
    setUserComments((prev) => ({
      ...prev,
      [story.id]: [...(prev[story.id] || []), newComment],
    }))
    setCommentText('')
  }

  return (
    <div className="story-viewer" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="story-viewer__container"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Progress bars */}
        <div className="story-viewer__progress">
          {story.media.map((_, i) => (
            <div key={i} className="story-viewer__progress-bar">
              <div
                className="story-viewer__progress-fill"
                style={{
                  width: i < mediaIdx ? '100%' : i === mediaIdx ? `${progress}%` : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="story-viewer__header">
          <div className="story-viewer__user" onClick={handleProfileClick} style={{ cursor: 'pointer' }}>
            <img className="story-viewer__user-avatar" src={story.avatar} alt={story.userName} />
            <div className="story-viewer__user-info">
              <span className="story-viewer__user-name">{story.userName}</span>
              <span className="story-viewer__user-time">2 часа назад</span>
            </div>
          </div>
          <div className="story-viewer__header-right">
            <button className="story-viewer__profile-btn" onClick={handleProfileClick}>
              Профиль
            </button>
            <button className="story-viewer__close" onClick={(e) => { e.stopPropagation(); onClose() }}>
              &#10005;
            </button>
          </div>
        </div>

        {/* Media content */}
        <div
          className="story-viewer__media"
          onClick={handleMediaClick}
        >
          <img className="story-viewer__media-img" src={slide.img} alt={slide.caption} />
          {slide.type === 'video' && (
            <div className="story-viewer__play-icon">&#9654;</div>
          )}
        </div>

        {/* Caption */}
        <div className="story-viewer__caption">
          {slide.type === 'video' && <span className="story-viewer__media-type">&#128249; Видео</span>}
          <p>{slide.caption}</p>
        </div>

        {/* Bottom bar — comment toggle */}
        <div className="story-viewer__bottom" onClick={(e) => e.stopPropagation()}>
          <button className="story-viewer__comment-toggle" onClick={toggleComments}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            {allComments.length > 0 && (
              <span className="story-viewer__comment-badge">{allComments.length}</span>
            )}
          </button>
          <div className="story-viewer__reply-placeholder" onClick={toggleComments}>
            Написать комментарий...
          </div>
        </div>

        {/* ========== Comments panel ========== */}
        <div className={`story-viewer__comments ${showComments ? 'story-viewer__comments--open' : ''}`} onClick={(e) => e.stopPropagation()}>
          <div className="story-viewer__comments-header">
            <h4>Комментарии <span className="story-viewer__comments-count">{allComments.length}</span></h4>
            <button className="story-viewer__comments-close" onClick={toggleComments}>&#10005;</button>
          </div>

          <div className="story-viewer__comments-list">
            {allComments.length === 0 && (
              <div className="story-viewer__comments-empty">
                Пока нет комментариев.<br />Будьте первым!
              </div>
            )}
            {allComments.map((c) => (
              <div key={c.id} className={`sv-comment ${c.isOwn ? 'sv-comment--own' : ''}`}>
                <div className="sv-comment__avatar" />
                <div className="sv-comment__body">
                  <div className="sv-comment__top">
                    <span className="sv-comment__author">{c.author}</span>
                    <span className="sv-comment__time">{c.time}</span>
                  </div>
                  <p className="sv-comment__text">{c.text}</p>
                </div>
              </div>
            ))}
            <div ref={commentsEndRef} />
          </div>

          <form className="story-viewer__comment-form" onSubmit={sendComment}>
            <input
              ref={commentInputRef}
              type="text"
              className="story-viewer__comment-input"
              placeholder="Ваш комментарий..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button
              type="submit"
              className="story-viewer__comment-send"
              disabled={!commentText.trim()}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </form>
        </div>

        {/* Navigation arrows (desktop) — hide when comments open */}
        {!showComments && storyIdx > 0 && (
          <button
            className="story-viewer__nav story-viewer__nav--prev"
            onClick={(e) => { e.stopPropagation(); setStoryIdx(s => s - 1); setMediaIdx(0) }}
          >
            &#8249;
          </button>
        )}
        {!showComments && storyIdx < stories.length - 1 && (
          <button
            className="story-viewer__nav story-viewer__nav--next"
            onClick={(e) => { e.stopPropagation(); setStoryIdx(s => s + 1); setMediaIdx(0) }}
          >
            &#8250;
          </button>
        )}
      </div>
    </div>
  )
}

// ---------- Stories carousel ----------
export default function Stories() {
  const [offset, setOffset] = useState(0)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerStart, setViewerStart] = useState(0)
  const [seenIds, setSeenIds] = useState(new Set())
  const listRef = useRef(null)
  const touchStartX = useRef(0)
  const visible = 6

  const prev = () => setOffset((o) => Math.max(0, o - 1))
  const next = () => setOffset((o) => Math.min(storiesData.length - visible, o + 1))

  const openStory = (index) => {
    setViewerStart(index)
    setViewerOpen(true)
    setSeenIds((prev) => new Set(prev).add(storiesData[index].id))
    document.body.style.overflow = 'hidden'
  }

  const closeViewer = () => {
    setViewerOpen(false)
    document.body.style.overflow = ''
  }

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const handleTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 50) { dx < 0 ? next() : prev() }
  }

  return (
    <section className="stories">
      <h2 className="section-title">Истории - Стамбул</h2>
      <div className="stories__carousel">
        <button className="stories__arrow stories__arrow--left" onClick={prev} disabled={offset === 0}>
          &#8249;
        </button>
        <div className="stories__list" ref={listRef} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          {storiesData.slice(offset, offset + visible).map((s, i) => {
            const realIndex = offset + i
            const isSeen = seenIds.has(s.id)
            return (
              <div key={s.id} className="stories__item" onClick={() => openStory(realIndex)}>
                <div className={`stories__avatar ${isSeen ? 'stories__avatar--seen' : ''}`}>
                  <img className="stories__avatar-img" src={s.avatar} alt={s.userName} />
                </div>
                <span className="stories__name">{s.userName}</span>
              </div>
            )
          })}
        </div>
        <button className="stories__arrow stories__arrow--right" onClick={next} disabled={offset >= storiesData.length - visible}>
          &#8250;
        </button>
      </div>

      {viewerOpen && (
        <StoryViewer stories={storiesData} startIndex={viewerStart} onClose={closeViewer} />
      )}
    </section>
  )
}
