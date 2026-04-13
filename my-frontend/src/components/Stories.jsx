import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiGetStories, apiViewStory, invalidateCache } from '../api/businessApi'
import { makeInitialAvatar } from '../utils/defaults'
import './Stories.css'

function groupStoriesByAuthor(apiStories) {
  console.log('Processing stories, total count:', apiStories?.length || 0)

  if (!Array.isArray(apiStories)) {
    console.warn('apiStories is not an array:', apiStories)
    return []
  }

  const map = {}
  let skipped = 0

  for (const s of apiStories) {
    // Check is_active status
    if (s.is_active === false) {
      console.log('Skipped inactive story:', s.id)
      skipped++
      continue
    }

    const aId = s.author?.id
    if (!aId) {
      console.warn('Story missing author.id:', s)
      skipped++
      continue
    }

    // Ensure author object is valid
    if (!s.author || typeof s.author !== 'object') {
      console.warn('Story has invalid author object:', s)
      skipped++
      continue
    }

    if (!map[aId]) {
      map[aId] = {
        id:       aId,
        bizId:    aId,
        userName: s.author.brand_name || s.author.username || 'Бизнес',
        city:     s.author.city || '',
        avatar:   s.author.avatar
          ? (s.author.avatar.startsWith('http') ? s.author.avatar : `https://api.101-school.uz${s.author.avatar}`)
          : makeInitialAvatar(s.author.brand_name || s.author.username || '?'),
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

  const grouped = Object.values(map)
  console.log(`Grouped ${grouped.length} stories from ${apiStories.length} total (skipped: ${skipped})`)
  console.log('Final grouped data:', grouped)
  return grouped
}

function StoryViewer({ stories, startIndex, onClose, onTrackViews }) {
  const [storyIdx, setStoryIdx] = useState(startIndex)
  const [mediaIdx, setMediaIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const [posterUrl, setPosterUrl] = useState(null)
  const timerRef = useRef(null)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const videoRef = useRef(null)
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

  // Generate poster image from first frame of video
  useEffect(() => {
    if (slide.type !== 'video') {
      setPosterUrl(null)
      return
    }

    const video = document.createElement('video')
    video.src = slide.img
    video.crossOrigin = 'anonymous'

    const handleLoadedMetadata = () => {
      video.currentTime = 0.5 // Get frame at 0.5 seconds
    }

    const handleSeeked = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(video, 0, 0)
          const poster = canvas.toDataURL('image/jpeg')
          setPosterUrl(poster)
        }
      } catch (e) {
        // CORS or other issues - use placeholder
        setPosterUrl(null)
      }
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('seeked', handleSeeked)

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('seeked', handleSeeked)
    }
  }, [storyIdx, mediaIdx])

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

  return createPortal(
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
          {slide.type === 'video' ? (
            <>
              <video
                ref={videoRef}
                className="story-viewer__media-video"
                src={slide.img}
                poster={posterUrl || undefined}
                controls
                autoPlay
                onEnded={goNext}
              />
              {!posterUrl && (
                <div className="story-viewer__video-overlay">
                  <div className="story-viewer__video-info">
                    <div className="story-viewer__video-play">▶</div>
                    <span className="story-viewer__video-label">Видео</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <img className="story-viewer__media-img" src={slide.img} alt={slide.caption} />
          )}
          {slide.type === 'video' && posterUrl && (
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
    </div>,
    document.body
  )
}

export default function Stories({ noTitle = false }) {
  const [storiesData, setStoriesData] = useState([])
  const [loadingStories, setLoadingStories] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { tokens } = useAuth()
  const viewedStoryIds = useRef(new Set())

  const loadStories = () => {
    setLoadingStories(true)
    invalidateCache('stories')
    apiGetStories()
      .then(data => {
        console.log('Raw API stories:', data)
        setStoriesData(groupStoriesByAuthor(data))
      })
      .catch((err) => {
        console.error('Error loading stories:', err)
        setStoriesData([])
      })
      .finally(() => setLoadingStories(false))
  }

  const refreshStories = () => {
    setRefreshing(true)
    invalidateCache('stories')
    apiGetStories()
      .then(data => {
        console.log('Raw API stories (refresh):', data)
        setStoriesData(groupStoriesByAuthor(data))
      })
      .catch((err) => {
        console.error('Error refreshing stories:', err)
      })
      .finally(() => setRefreshing(false))
  }

  useEffect(() => {
    console.log('Stories component mounted, loading initial data')
    loadStories()
  }, [])

  // Обновлять истории каждые 30 секунд
  useEffect(() => {
    console.log('Setting up auto-refresh interval')
    const interval = setInterval(() => {
      console.log('Auto-refreshing stories...')
      refreshStories()
    }, 30000)
    return () => {
      console.log('Clearing auto-refresh interval')
      clearInterval(interval)
    }
  }, [])

  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerStart, setViewerStart] = useState(0)
  const [seenIds, setSeenIds] = useState(new Set())
  const listRef = useRef(null)
  const drag = useRef({ isDown: false, startX: 0, scrollLeft: 0, moved: false })

  const trackViews = useCallback((storyGroup) => {
    if (!tokens?.access) return
    for (const m of storyGroup.media) {
      if (viewedStoryIds.current.has(m.storyId)) continue
      viewedStoryIds.current.add(m.storyId)
      apiViewStory(m.storyId, tokens.access).catch(() => {})
    }
  }, [tokens])

  const openStory = (index) => {
    if (drag.current.moved) return
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

  const onMouseDown = (e) => {
    const el = listRef.current
    if (!el) return
    drag.current = { isDown: true, startX: e.clientX, scrollLeft: el.scrollLeft, moved: false }
    el.style.cursor = 'grabbing'
  }
  const onMouseMove = (e) => {
    if (!drag.current.isDown) return
    const el = listRef.current
    if (!el) return
    const dx = e.clientX - drag.current.startX
    if (Math.abs(dx) > 5) drag.current.moved = true
    el.scrollLeft = drag.current.scrollLeft - dx
  }
  const onMouseUp = () => {
    drag.current.isDown = false
    if (listRef.current) listRef.current.style.cursor = 'grab'
  }

  const onTouchStart = (e) => {
    const el = listRef.current
    if (!el) return
    drag.current = { isDown: true, startX: e.touches[0].clientX, scrollLeft: el.scrollLeft, moved: false }
  }
  const onTouchMove = (e) => {
    if (!drag.current.isDown) return
    const el = listRef.current
    if (!el) return
    const dx = e.touches[0].clientX - drag.current.startX
    if (Math.abs(dx) > 5) drag.current.moved = true
    el.scrollLeft = drag.current.scrollLeft - dx
  }
  const onTouchEnd = () => { drag.current.isDown = false }

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
      <div
        className="stories__list"
        ref={listRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {storiesData.map((s, i) => {
          const isSeen = seenIds.has(s.id)
          return (
            <div key={s.id} className="stories__item" onClick={() => openStory(i)}>
              <div className={`stories__avatar ${isSeen ? 'stories__avatar--seen' : ''}`}>
                <img className="stories__avatar-img" src={s.avatar} alt={s.userName} draggable={false} />
              </div>
              <span className="stories__name">{s.userName}</span>
            </div>
          )
        })}
      </div>

      {viewerOpen && (
        <StoryViewer stories={storiesData} startIndex={viewerStart} onClose={closeViewer} onTrackViews={trackViews} />
      )}
    </section>
  )
}
