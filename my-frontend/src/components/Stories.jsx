import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiGetStories, apiViewStory } from '../api/businessApi'
import './Stories.css'

function groupStoriesByAuthor(apiStories) {
  const map = {}
  for (const s of apiStories) {
    if (s.is_active === false) continue
    const aId = s.author?.id
    if (!aId) continue
    if (!map[aId]) {
      map[aId] = {
        id:       aId,
        bizId:    aId,
        userName: s.author.username || 'Бизнес',
        city:     s.author.city || '',
        avatar:   s.author.avatar
          ? (s.author.avatar.startsWith('http') ? s.author.avatar : `https://api.101-school.uz${s.author.avatar}`)
          : `https://i.pravatar.cc/200?u=${aId}`,
        media:    [],
      }
    }
    map[aId].media.push({
      type:      s.media_type === 'VIDEO' ? 'video' : 'image',
      img:       s.media_display || `https://picsum.photos/seed/${s.id}/600/900`,
      caption:   s.caption || '',
      storyId:   s.id,
      createdAt: s.created_at || null,
    })
  }
  return Object.values(map)
}

function StoryViewer({ stories, startIndex, onClose, onTrackViews }) {
  const [storyIdx, setStoryIdx] = useState(startIndex)
  const [mediaIdx, setMediaIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef(null)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const navigate = useNavigate()

  const story = stories[storyIdx]
  const slide = story.media[mediaIdx]
  const DURATION = slide.type === 'video' ? 8000 : 5000

  function slideTimeAgo(dateStr) {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'только что'
    if (mins < 60) return `${mins} мин. назад`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} ч. назад`
    return `${Math.floor(hours / 24)} дн. назад`
  }

  // Записать просмотр при переключении на другого автора
  useEffect(() => {
    onTrackViews?.(stories[storyIdx])
  }, [storyIdx])

  useEffect(() => {
    setProgress(0)
    const startTime = Date.now()

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const pct = Math.min((elapsed / DURATION) * 100, 100)
      setProgress(pct)
      if (elapsed >= DURATION) goNext()
    }, 50)

    return () => clearInterval(timerRef.current)
  }, [storyIdx, mediaIdx])

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

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext() }
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goNext, goPrev, onClose])

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)
    if (absDy > 80 && absDy > absDx && dy > 0) { onClose(); return }
    if (absDx > 50 && absDx > absDy) { dx < 0 ? goNext() : goPrev() }
  }

  const handleMediaClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    if (x < rect.width / 3) goPrev()
    else goNext()
  }

  const handleProfileClick = (e) => {
    e.stopPropagation()
    onClose()
    navigate(`/business/${story.bizId || story.id}`)
  }

  return (
    <div className="story-viewer" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="story-viewer__container"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
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

        <div className="story-viewer__header">
          <div className="story-viewer__user" onClick={handleProfileClick} style={{ cursor: 'pointer' }}>
            <img className="story-viewer__user-avatar" src={story.avatar} alt={story.userName} />
            <div className="story-viewer__user-info">
              <span className="story-viewer__user-name">{story.userName}</span>
              {slide.createdAt && <span className="story-viewer__user-time">{slideTimeAgo(slide.createdAt)}</span>}
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

        <div
          className="story-viewer__media"
          onClick={handleMediaClick}
        >
          <img className="story-viewer__media-img" src={slide.img} alt={slide.caption} />
          {slide.type === 'video' && (
            <div className="story-viewer__play-icon">&#9654;</div>
          )}
        </div>

        <div className="story-viewer__caption">
          {slide.type === 'video' && <span className="story-viewer__media-type">&#128249; Видео</span>}
          <p>{slide.caption}</p>
        </div>

        {storyIdx > 0 && (
          <button
            className="story-viewer__nav story-viewer__nav--prev"
            onClick={(e) => { e.stopPropagation(); setStoryIdx(s => s - 1); setMediaIdx(0) }}
          >
            &#8249;
          </button>
        )}
        {storyIdx < stories.length - 1 && (
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

export default function Stories({ noTitle = false }) {
  const [storiesData, setStoriesData] = useState([])
  const [loadingStories, setLoadingStories] = useState(true)
  const { tokens } = useAuth()
  const viewedStoryIds = useRef(new Set())

  useEffect(() => {
    apiGetStories()
      .then(data => setStoriesData(groupStoriesByAuthor(data)))
      .catch(() => setStoriesData([]))
      .finally(() => setLoadingStories(false))
  }, [])

  const [offset, setOffset] = useState(0)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerStart, setViewerStart] = useState(0)
  const [seenIds, setSeenIds] = useState(new Set())
  const listRef = useRef(null)
  const touchStartX = useRef(0)
  const visible = 6

  const prev = () => setOffset((o) => Math.max(0, o - 1))
  const next = () => setOffset((o) => Math.min(Math.max(0, storiesData.length - visible), o + 1))

  // Записать просмотр всех медиа автора (только для залогиненных, 1 раз за сессию)
  const trackViews = useCallback((storyGroup) => {
    if (!tokens?.access) return
    for (const m of storyGroup.media) {
      if (viewedStoryIds.current.has(m.storyId)) continue
      viewedStoryIds.current.add(m.storyId)
      apiViewStory(m.storyId, tokens.access).catch(() => {})
    }
  }, [tokens])

  const openStory = (index) => {
    if (!storiesData[index]) return
    setViewerStart(index)
    setViewerOpen(true)
    setSeenIds((prev) => new Set(prev).add(storiesData[index].id))
    trackViews(storiesData[index])
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

  if (loadingStories) return (
    <section className="stories">
      {!noTitle && <h2 className="section-title">Истории</h2>}
      <div className="stories__loading">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="stories__skeleton">
            <div className="stories__skeleton-avatar" />
            <div className="stories__skeleton-name" />
          </div>
        ))}
      </div>
    </section>
  )

  if (storiesData.length === 0) return (
    <section className="stories">
      {!noTitle && <h2 className="section-title">Истории</h2>}
      <p className="stories__empty">Пока нет активных историй</p>
    </section>
  )

  return (
    <section className="stories">
      {!noTitle && <h2 className="section-title">Истории</h2>}
      <div className="stories__carousel">
        <button className="stories__arrow stories__arrow--left" onClick={prev} disabled={offset === 0}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      {viewerOpen && (
        <StoryViewer stories={storiesData} startIndex={viewerStart} onClose={closeViewer} onTrackViews={trackViews} />
      )}
    </section>
  )
}
