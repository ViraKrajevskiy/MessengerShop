import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Cropper from 'react-easy-crop'
import Header from '../components/Header'
import BusinessSurveySection from '../components/BusinessSurveySection'
import { useAuth } from '../context/AuthContext'
import {
  apiDeletePost,
  apiDeleteStory,
  apiDeleteProduct,
  apiUpdateProduct,
  apiGetBusinessStories,
  invalidateCache,
} from '../api/businessApi'
import { timeAgo } from '../utils/timeUtils'
import { resolveUrl } from '../utils/urlUtils'
import PostModal from '../components/PostModal'
import { API_URL as BASE, API_ORIGIN } from '../config/api'
import './BusinessDashboardPage.css'

function getVerificationStatus(payload) {
  if (!payload || payload.exists === false) return null
  return payload.status || null
}

const BIZ_CATEGORY_OPTIONS = [
  { value: 'BEAUTY', label: 'Красота и уход' },
  { value: 'HEALTH', label: 'Здоровье' },
  { value: 'REALTY', label: 'Недвижимость' },
  { value: 'EDUCATION', label: 'Образование' },
  { value: 'FINANCE', label: 'Финансы' },
  { value: 'LEGAL', label: 'Юридические услуги' },
  { value: 'TOURISM', label: 'Туризм' },
  { value: 'FOOD', label: 'Еда и рестораны' },
  { value: 'TRANSPORT', label: 'Транспорт' },
  { value: 'OTHER', label: 'Другое' },
]

const CITY_OPTIONS = [
  { value: 'Стамбул', label: '🇹🇷 Стамбул' },
  { value: 'Анкара', label: '🇹🇷 Анкара' },
  { value: 'Анталья', label: '🇹🇷 Анталья' },
  { value: 'Измир', label: '🇹🇷 Измир' },
  { value: 'Бурса', label: '🇹🇷 Бурса' },
  { value: 'Алматы', label: '🇰🇿 Алматы' },
  { value: 'Ташкент', label: '🇺🇿 Ташкент' },
  { value: 'Другой', label: '🌍 Другой город' },
]

function formatDrfErrors(data) {
  if (!data) return 'Не удалось сохранить. Проверьте данные.'
  if (typeof data === 'string') return data
  if (data.detail) return typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)
  if (Array.isArray(data.non_field_errors) && data.non_field_errors.length) {
    return data.non_field_errors.join(' ')
  }
  const parts = []
  for (const [k, v] of Object.entries(data)) {
    if (k === 'non_field_errors') continue
    const text = Array.isArray(v) ? v.join(', ') : String(v)
    parts.push(`${k}: ${text}`)
  }
  return parts.join(' ') || 'Ошибка сохранения'
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4h6v2"/>
  </svg>
)

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({ icon, value, label, color }) {
  return (
    <div className="biz-stat-card" style={{ '--accent': color }}>
      <div className="biz-stat-card__icon">{icon}</div>
      <div className="biz-stat-card__body">
        <strong className="biz-stat-card__value">{value}</strong>
        <span className="biz-stat-card__label">{label}</span>
      </div>
    </div>
  )
}

// ── Post Row ───────────────────────────────────────────────────────────────────
function PostRow({ post, onDelete, deleting }) {
  const [showModal, setShowModal] = useState(false)
  const media = post.media_display || post.media
  return (
    <>
      {showModal && (
        <PostModal post={post} onClose={() => setShowModal(false)} />
      )}
      <div className="biz-content-row">
        <div
          className="biz-content-row__thumb"
          style={media ? { cursor: 'pointer' } : undefined}
          onClick={media ? () => setShowModal(true) : undefined}
        >
          {media
            ? <img src={media} alt="" />
            : <div className="biz-content-row__thumb-placeholder">📝</div>
          }
        </div>
        <div className="biz-content-row__info">
          <p className="biz-content-row__text">
            {post.text ? (post.text.length > 80 ? post.text.slice(0, 80) + '...' : post.text) : '—'}
          </p>
          <span className="biz-content-row__meta">{timeAgo(post.created_at)}</span>
        </div>
        <button
          className="biz-row__delete-btn"
          onClick={() => onDelete(post.id)}
          disabled={deleting === post.id}
          title="Удалить пост"
        >
          {deleting === post.id
            ? <span className="biz-row__delete-spinner" />
            : <TrashIcon />
          }
        </button>
      </div>
    </>
  )
}

// ── Story Row ──────────────────────────────────────────────────────────────────
function StoryRow({ story, onDelete, deleting }) {
  const [showModal, setShowModal] = useState(false)
  const media = story.media_display || story.media
  const isVideo = story.media_type === 'VIDEO'
  const modalPost = media ? { media_display: media, media_type: story.media_type, text: story.caption, created_at: story.created_at } : null
  return (
    <>
      {showModal && modalPost && (
        <PostModal post={modalPost} onClose={() => setShowModal(false)} />
      )}
      <div className="biz-content-row">
        <div
          className="biz-content-row__thumb biz-content-row__thumb--story"
          style={media ? { cursor: 'pointer' } : undefined}
          onClick={media ? () => setShowModal(true) : undefined}
        >
          {media
            ? isVideo
              ? <video src={media} className="biz-content-row__video-thumb" muted preload="metadata" playsInline />
              : <img src={media} alt="" />
            : <div className="biz-content-row__thumb-placeholder">🎬</div>
          }
          <span className="biz-content-row__type-badge">
            {isVideo ? '▶' : '📷'}
          </span>
        </div>
        <div className="biz-content-row__info">
          <p className="biz-content-row__text">
            {story.caption || <em className="biz-content-row__no-caption">Без подписи</em>}
          </p>
          <span className="biz-content-row__meta">{timeAgo(story.created_at)}</span>
        </div>
        <button
          className="biz-row__delete-btn"
          onClick={() => onDelete(story.id)}
          disabled={deleting === story.id}
          title="Удалить историю"
        >
          {deleting === story.id
            ? <span className="biz-row__delete-spinner" />
            : <TrashIcon />
          }
        </button>
      </div>
    </>
  )
}

// ── Media Lightbox (full-screen preview) ──────────────────────────────────────
function MediaLightbox({ src, isVideo, onClose }) {
  if (!src) return null
  return (
    <div className="biz-lightbox-overlay" onClick={onClose}>
      <button className="biz-lightbox__close" onClick={onClose}>✕</button>
      <div className="biz-lightbox__content" onClick={e => e.stopPropagation()}>
        {isVideo ? (
          <video src={src} className="biz-lightbox__media" controls autoPlay playsInline />
        ) : (
          <img src={src} className="biz-lightbox__media" alt="preview" />
        )}
      </div>
    </div>
  )
}

// ── Modal Wrapper ──────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="biz-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="biz-modal">
        <div className="biz-modal__header">
          <h3 className="biz-modal__title">{title}</h3>
          <button className="biz-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="biz-modal__body">
          {children}
        </div>
      </div>
    </div>
  )
}

// ── Confirm Delete Modal ───────────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel, loading }) {
  return (
    <div className="biz-modal-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="biz-modal biz-modal--confirm">
        <div className="biz-modal__body">
          <div className="biz-confirm__icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <p className="biz-confirm__text">{message}</p>
          <div className="biz-confirm__btns">
            <button className="biz-confirm__cancel" onClick={onCancel} disabled={loading}>
              Отмена
            </button>
            <button className="biz-confirm__ok" onClick={onConfirm} disabled={loading}>
              {loading ? <span className="biz-row__delete-spinner" /> : 'Удалить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Create Story Modal ─────────────────────────────────────────────────────────
function CreateStoryModal({ getAccessToken, onClose, onSuccess }) {
  const [file, setFile]       = useState(null)
  const [preview, setPreview] = useState(null)
  const [cropSrc, setCropSrc] = useState(null)
  const [caption, setCaption] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef()

  const isVideoFile = (f) =>
    f && (f.type.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv)$/i.test(f.name))

  const processFile = (f) => {
    if (!f) return
    // Редактирование фото (кроп) временно отключено — используем оригинал
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleFile = e => {
    const f = e.target.files[0]
    if (!f) return
    e.target.value = ''
    processFile(f)
  }

  const handleDrop = e => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
    const f = e.dataTransfer?.files?.[0]
    if (f) processFile(f)
  }
  const handleDragOver = e => {
    e.preventDefault()
    e.stopPropagation()
    if (!dragOver) setDragOver(true)
  }
  const handleDragLeave = e => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }

  const handleCropped = (croppedFile) => {
    setFile(croppedFile)
    setPreview(URL.createObjectURL(croppedFile))
    setCropSrc(null)
  }

  const handleSubmit = async () => {
    if (!file) { setError('Выберите файл'); return }
    setLoading(true); setError('')
    const fd = new FormData()
    fd.append('media', file)
    fd.append('media_type', file.type.startsWith('video') ? 'VIDEO' : 'IMAGE')
    fd.append('caption', caption)
    try {
      const token = await getAccessToken()
      if (!token) {
        setError('Сессия истекла')
        return
      }
      const r = await fetch(`${BASE}/stories/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      if (!r.ok) {
        const body = await r.json().catch(() => ({}))
        setError(body.detail || 'Ошибка')
        return
      }
      onSuccess('Сторис опубликован!')
      onClose()
    } catch(e) {
      setError('Ошибка соединения')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <Modal title="Новый сторис" onClose={onClose}>
      <div className="biz-form">
        <div
          className={`biz-form__upload${dragOver ? ' biz-form__upload--dragover' : ''}`}
          onClick={() => inputRef.current.click()}
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {preview
            ? isVideoFile(file)
              ? <video src={preview} className="biz-form__preview" controls />
              : <img src={preview} className="biz-form__preview" alt="preview" />
            : <div className="biz-form__upload-placeholder">
                <span>📷</span>
                <p>{dragOver ? 'Отпустите чтобы загрузить' : 'Нажмите или перетащите фото / видео'}</p>
              </div>
          }
          <input ref={inputRef} type="file" accept="image/*,video/*" onChange={handleFile} hidden />
        </div>
        <textarea
          className="biz-form__textarea"
          placeholder="Подпись к сторису (необязательно)"
          value={caption}
          onChange={e => setCaption(e.target.value)}
          rows={3}
        />
        {error && <p className="biz-form__error">{error}</p>}
        <button className="biz-form__submit" onClick={handleSubmit} disabled={loading}>
          {loading ? <span className="biz-form__spinner" /> : 'Опубликовать'}
        </button>
      </div>
    </Modal>
    {cropSrc && (
      <CropModal
        src={cropSrc}
        aspect={9 / 16}
        onCancel={() => setCropSrc(null)}
        onCrop={handleCropped}
      />
    )}
    </>
  )
}

// ── Create Post Modal ──────────────────────────────────────────────────────────
// Форматы карточки поста. value совпадает с Post.MediaFormat на бэкенде,
// aspect — соотношение для кроп-окна и предпросмотра.
const POST_FORMATS = [
  { value: '4:5',  label: 'Вертикальное', aspect: 4 / 5 },
  { value: '2:3',  label: '2:3',          aspect: 2 / 3 },
  { value: '1:1',  label: 'Квадрат',      aspect: 1 },
  { value: '16:9', label: 'Горизонтальное', aspect: 16 / 9 },
]
const aspectOf = (fmt) => (POST_FORMATS.find(f => f.value === fmt) || POST_FORMATS[0]).aspect

function CreatePostModal({ getAccessToken, bizId, onClose, onSuccess }) {
  const [file, setFile]       = useState(null)
  const [preview, setPreview] = useState(null)
  const [cropSrc, setCropSrc] = useState(null)
  const [origSrc, setOrigSrc] = useState(null)   // оригинал для повторного кропа при смене формата
  const [format, setFormat]   = useState('4:5')
  const [text, setText]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  // Hashtag picker state
  const [tagInput, setTagInput]         = useState('')
  const [tagSuggests, setTagSuggests]   = useState([])
  const [tagLoading, setTagLoading]     = useState(false)
  const [popularTags, setPopularTags]   = useState([])
  const tagTimerRef = useRef(null)

  // Load popular tags on mount
  useEffect(() => {
    fetch(`${BASE}/tags/?q=`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setPopularTags((Array.isArray(data) ? data : []).slice(0, 20)))
      .catch(() => {})
  }, [])

  const searchTags = (q) => {
    clearTimeout(tagTimerRef.current)
    const clean = q.replace(/^#/, '').trim()
    if (!clean) { setTagSuggests([]); setTagLoading(false); return }
    setTagLoading(true)
    tagTimerRef.current = setTimeout(() => {
      fetch(`${BASE}/tags/?q=${encodeURIComponent(clean)}`)
        .then(r => r.ok ? r.json() : [])
        .then(data => setTagSuggests(Array.isArray(data) ? data.slice(0, 15) : []))
        .catch(() => setTagSuggests([]))
        .finally(() => setTagLoading(false))
    }, 280)
  }

  // Уже ли хэштег в тексте поста? Сравниваем как целое слово, регистронезависимо.
  const tagInText = (tagName) => {
    const esc = String(tagName).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`(^|\\s)#${esc}(?=\\s|$)`, 'i').test(text)
  }

  const insertTag = (tagName) => {
    if (tagInText(tagName)) return  // один и тот же хэштег дважды не добавляем
    const tag = `#${tagName} `
    setText(prev => (prev.endsWith(' ') || prev === '' ? prev + tag : prev + ' ' + tag))
    setTagInput('')
    setTagSuggests([])
  }

  const isVideoFile = (f) =>
    f && (f.type.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv)$/i.test(f.name))

  const processFile = (f) => {
    if (!f) return
    // Видео не кадрируем — берём как есть. Фото открываем в кропе под выбранный формат.
    if (isVideoFile(f)) {
      setOrigSrc(null)
      setFile(f)
      setPreview(URL.createObjectURL(f))
      return
    }
    const src = URL.createObjectURL(f)
    setOrigSrc(src)
    setCropSrc(src)
  }

  // Смена формата — перекадрируем то же фото под новое соотношение.
  const changeFormat = (value) => {
    setFormat(value)
    if (origSrc) setCropSrc(origSrc)
  }

  const handleFile = e => {
    const f = e.target.files[0]
    if (!f) return
    e.target.value = ''
    processFile(f)
  }

  const handleDrop = e => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
    const f = e.dataTransfer?.files?.[0]
    if (f) processFile(f)
  }
  const handleDragOver = e => {
    e.preventDefault()
    e.stopPropagation()
    if (!dragOver) setDragOver(true)
  }
  const handleDragLeave = e => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }

  const handleCropped = (croppedFile) => {
    setFile(croppedFile)
    setPreview(URL.createObjectURL(croppedFile))
    setCropSrc(null)
  }

  const handleSubmit = async () => {
    if (!text.trim()) { setError('Введите текст поста'); return }
    setLoading(true); setError('')
    const fd = new FormData()
    fd.append('text', text)
    fd.append('is_tweet', 'false')
    fd.append('media_format', format)
    if (file) {
      fd.append('media', file)
      fd.append('media_type', isVideoFile(file) ? 'VIDEO' : 'IMAGE')
    }
    try {
      const token = await getAccessToken()
      if (!token) {
        setError('Сессия истекла')
        return
      }
      const r = await fetch(`${BASE}/businesses/${bizId}/posts/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      if (!r.ok) {
        const body = await r.json().catch(() => ({}))
        setError(body.detail || 'Ошибка')
        return
      }
      onSuccess('Пост опубликован!')
      onClose()
    } catch(e) {
      setError('Ошибка соединения')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <Modal title="Новый пост" onClose={onClose}>
      <div className="biz-form">
        <textarea
          className="biz-form__textarea"
          placeholder="Текст поста... Используйте #хэштеги"
          value={text}
          onChange={e => setText(e.target.value)}
          rows={4}
        />
        <div className="biz-form__format">
          <span className="biz-form__format-label">Формат фото</span>
          <div className="biz-form__format-chips">
            {POST_FORMATS.map(f => (
              <button
                key={f.value}
                type="button"
                className={`biz-form__format-chip${format === f.value ? ' biz-form__format-chip--active' : ''}`}
                onClick={() => changeFormat(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div
          className={`biz-form__upload biz-form__upload--sm${dragOver ? ' biz-form__upload--dragover' : ''}`}
          onClick={() => fileInputRef.current.click()}
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {preview
            ? isVideoFile(file)
              ? <video src={preview} className="biz-form__preview" controls />
              : <img
                  src={preview}
                  className="biz-form__preview"
                  alt="preview"
                  style={{ aspectRatio: format.replace(':', ' / '), objectFit: 'cover', width: '100%' }}
                />
            : <div className="biz-form__upload-placeholder">
                <span>🖼</span>
                <p>{dragOver ? 'Отпустите чтобы загрузить' : 'Добавить или перетащить фото / видео (необязательно)'}</p>
              </div>
          }
          <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFile} hidden />
        </div>
        {file && (
          <button
            type="button"
            className="biz-form__remove-media"
            onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null) }}
          >
            ✕ Убрать медиа
          </button>
        )}
        {/* ── Hashtag picker ── */}
        <div className="post-tag-picker">
          <div className="post-tag-picker__label">🏷 Хештеги</div>
          <div className="post-tag-picker__search-wrap">
            <input
              type="text"
              className="post-tag-picker__input"
              placeholder="Введите хештег для поиска..."
              value={tagInput}
              onChange={e => { setTagInput(e.target.value); searchTags(e.target.value) }}
            />
            {tagLoading && <span className="post-tag-picker__spinner" />}
          </div>
          <div className="post-tag-picker__chips">
            {(tagInput.trim() ? tagSuggests : popularTags).map(tag => {
              const name = tag.name || tag
              const added = tagInText(name)
              return (
                <button
                  key={name}
                  type="button"
                  className={`post-tag-picker__chip${added ? ' post-tag-picker__chip--added' : ''}`}
                  onClick={() => !added && insertTag(name)}
                  disabled={added}
                >
                  #{name}
                  {added && <span className="post-tag-picker__chip-check">✓</span>}
                </button>
              )
            })}
            {tagInput.trim() && !tagLoading && tagSuggests.length === 0 && (
              <span className="post-tag-picker__empty">Теги не найдены</span>
            )}
          </div>
        </div>

        {error && <p className="biz-form__error">{error}</p>}
        <button className="biz-form__submit" onClick={handleSubmit} disabled={loading}>
          {loading ? <span className="biz-form__spinner" /> : 'Опубликовать'}
        </button>
      </div>
    </Modal>
    {cropSrc && (
      <CropModal
        src={cropSrc}
        aspect={aspectOf(format)}
        onCancel={() => setCropSrc(null)}
        onCrop={handleCropped}
      />
    )}
    </>
  )
}

// ── Create Tweet Modal (text-only post, premium only) ─────────────────────────
function CreateTweetModal({ getAccessToken, bizId, onClose, onSuccess }) {
  const [text, setText]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const MAX = 280

  const handleSubmit = async () => {
    const value = text.trim()
    if (!value) { setError('Введите текст твита'); return }
    if (value.length > MAX) { setError(`Максимум ${MAX} символов`); return }
    setLoading(true); setError('')
    const fd = new FormData()
    fd.append('text', value)
    fd.append('is_tweet', 'true')
    try {
      const token = await getAccessToken()
      if (!token) {
        setError('Сессия истекла')
        return
      }
      const r = await fetch(`${BASE}/businesses/${bizId}/posts/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      if (!r.ok) {
        const body = await r.json().catch(() => ({}))
        setError(body.detail || 'Ошибка')
        return
      }
      onSuccess('Твит опубликован!')
      onClose()
    } catch {
      setError('Ошибка соединения')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Новый твит" onClose={onClose}>
      <div className="biz-form">
        <textarea
          className="biz-form__textarea"
          placeholder="Что у вас нового? Только текст, до 280 символов..."
          value={text}
          onChange={e => setText(e.target.value)}
          rows={5}
          maxLength={MAX}
        />
        <div style={{ textAlign: 'right', fontSize: 12, color: text.length > MAX ? '#e53935' : 'var(--text-muted)' }}>
          {text.length} / {MAX}
        </div>
        {error && <p className="biz-form__error">{error}</p>}
        <button className="biz-form__submit" onClick={handleSubmit} disabled={loading}>
          {loading ? <span className="biz-form__spinner" /> : 'Опубликовать'}
        </button>
      </div>
    </Modal>
  )
}

// ── Create Media-Only Modal (photo or video, no text) ─────────────────────────
function CreateMediaOnlyModal({ getAccessToken, bizId, onClose, onSuccess, mediaType }) {
  const isVideo = mediaType === 'video'
  const [file, setFile]       = useState(null)
  const [preview, setPreview] = useState(null)
  const [cropSrc, setCropSrc] = useState(null)
  const [origSrc, setOrigSrc] = useState(null)
  const [format, setFormat]   = useState('4:5')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef()

  const processFile = (f) => {
    if (!f) return
    // Reject mismatched media type when dragged from desktop
    if (isVideo && !(f.type.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv)$/i.test(f.name))) {
      setError('Выберите видео-файл')
      return
    }
    if (!isVideo && !f.type.startsWith('image/')) {
      setError('Выберите изображение')
      return
    }
    setError('')
    // Видео берём как есть. Фото кадрируем под выбранный формат карточки.
    if (isVideo) {
      setFile(f)
      setPreview(URL.createObjectURL(f))
      return
    }
    const src = URL.createObjectURL(f)
    setOrigSrc(src)
    setCropSrc(src)
  }

  // Смена формата — перекадрируем то же фото под новое соотношение.
  const changeFormat = (value) => {
    setFormat(value)
    if (origSrc) setCropSrc(origSrc)
  }

  const handleFile = e => {
    const f = e.target.files[0]
    if (!f) return
    e.target.value = ''
    processFile(f)
  }

  const handleDrop = e => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
    const f = e.dataTransfer?.files?.[0]
    if (f) processFile(f)
  }
  const handleDragOver = e => {
    e.preventDefault()
    e.stopPropagation()
    if (!dragOver) setDragOver(true)
  }
  const handleDragLeave = e => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }

  const handleCropped = (croppedFile) => {
    setFile(croppedFile)
    setPreview(URL.createObjectURL(croppedFile))
    setCropSrc(null)
  }

  const handleSubmit = async () => {
    if (!file) { setError('Выберите файл'); return }
    setLoading(true); setError('')
    const fd = new FormData()
    fd.append('text', '')
    fd.append('media', file)
    fd.append('media_type', isVideo ? 'VIDEO' : 'IMAGE')
    fd.append('media_format', format)
    try {
      const token = await getAccessToken()
      if (!token) { setError('Сессия истекла'); return }
      const r = await fetch(`${BASE}/businesses/${bizId}/posts/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      if (!r.ok) {
        const body = await r.json().catch(() => ({}))
        setError(body.detail || 'Ошибка')
        return
      }
      onSuccess(isVideo ? 'Видео опубликовано!' : 'Фото опубликовано!')
      onClose()
    } catch {
      setError('Ошибка соединения')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Modal title={isVideo ? 'Добавить видео' : 'Добавить фото'} onClose={onClose}>
        <div className="biz-form">
          {!isVideo && (
            <div className="biz-form__format">
              <span className="biz-form__format-label">Формат фото</span>
              <div className="biz-form__format-chips">
                {POST_FORMATS.map(f => (
                  <button
                    key={f.value}
                    type="button"
                    className={`biz-form__format-chip${format === f.value ? ' biz-form__format-chip--active' : ''}`}
                    onClick={() => changeFormat(f.value)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div
            className={`biz-form__upload${dragOver ? ' biz-form__upload--dragover' : ''}`}
            onClick={() => inputRef.current.click()}
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {preview ? (
              isVideo
                ? <video src={preview} className="biz-form__preview" controls />
                : <img
                    src={preview}
                    className="biz-form__preview"
                    alt="preview"
                    style={{ aspectRatio: format.replace(':', ' / '), objectFit: 'cover', width: '100%' }}
                  />
            ) : (
              <div className="biz-form__upload-placeholder">
                <span>{isVideo ? '🎬' : '📷'}</span>
                <p>{dragOver
                  ? 'Отпустите чтобы загрузить'
                  : `Нажмите или перетащите ${isVideo ? 'видео' : 'фото'}`}</p>
              </div>
            )}
            <input ref={inputRef} type="file" accept={isVideo ? 'video/*' : 'image/*'} onChange={handleFile} hidden />
          </div>
          {error && <p className="biz-form__error">{error}</p>}
          <button className="biz-form__submit" onClick={handleSubmit} disabled={loading}>
            {loading ? <span className="biz-form__spinner" /> : 'Опубликовать'}
          </button>
        </div>
      </Modal>
      {cropSrc && (
        <CropModal
          src={cropSrc}
          aspect={aspectOf(format)}
          onCancel={() => setCropSrc(null)}
          onCrop={handleCropped}
        />
      )}
    </>
  )
}

// ── Image Cropper (aspect + pan/zoom + rotation, max-width 1200px) ────────────
function CropModal({ src, aspect = 4 / 5, onCancel, onCrop }) {
  const [crop, setCrop]           = useState({ x: 0, y: 0 })
  const [zoom, setZoom]           = useState(1)
  const [rotation, setRotation]   = useState(0)
  const [croppedArea, setCroppedArea] = useState(null)
  const [busy, setBusy]           = useState(false)

  const onCropComplete = useCallback((_area, areaPixels) => {
    setCroppedArea(areaPixels)
  }, [])

  const rotateLeft  = () => setRotation(r => (r - 90 + 360) % 360)
  const rotateRight = () => setRotation(r => (r + 90) % 360)

  const doCrop = async () => {
    if (!croppedArea) return
    setBusy(true)
    try {
      const file = await getCroppedFile(src, croppedArea, rotation, 1200)
      onCrop(file)
    } catch (e) {
      console.error('Crop error:', e)
      setBusy(false)
    }
  }

  const aspectLabel =
    aspect === 1       ? '1:1' :
    aspect === 16 / 9  ? '16:9' :
    aspect === 9 / 16  ? '9:16' :
    aspect === 4 / 5   ? '4:5'  :
    aspect === 2 / 3   ? '2:3'  :
    `${aspect.toFixed(2)}`

  return (
    <div className="crop-modal__backdrop" onClick={onCancel}>
      <div className="crop-modal" onClick={e => e.stopPropagation()}>
        <p className="crop-modal__title">Выбор области {aspectLabel}</p>
        <div className="crop-modal__stage">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            minZoom={0.4}
            maxZoom={4}
            zoomSpeed={0.4}
            restrictPosition={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
            objectFit="contain"
          />
        </div>
        <div className="crop-modal__zoom">
          <span>🔍</span>
          <input
            type="range"
            min={0.4}
            max={4}
            step={0.01}
            value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            className="crop-modal__zoom-slider"
          />
        </div>
        <div className="crop-modal__tools">
          <button type="button" className="crop-modal__tool-btn" onClick={rotateLeft} title="Повернуть влево">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10"/>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
            </svg>
            Влево
          </button>
          <button type="button" className="crop-modal__tool-btn" onClick={rotateRight} title="Повернуть вправо">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Вправо
          </button>
          <span className="crop-modal__rotation-value">{rotation}°</span>
        </div>
        <p className="crop-modal__hint">Перетащите фото, используйте зум и поворот, чтобы выбрать нужную область</p>
        <div className="crop-modal__actions">
          <button className="crop-modal__cancel" onClick={onCancel} disabled={busy}>Отмена</button>
          <button className="crop-modal__confirm" onClick={doCrop} disabled={!croppedArea || busy}>
            {busy ? 'Обработка…' : 'Применить'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Helper: вырезает область с учётом поворота и возвращает File (макс. ширина 1200px)
function getCroppedFile(src, area, rotation = 0, maxWidth = 1200) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const radians = (rotation * Math.PI) / 180
      const sin = Math.abs(Math.sin(radians))
      const cos = Math.abs(Math.cos(radians))
      // Bounding box of the rotated image
      const bBoxW = img.width * cos + img.height * sin
      const bBoxH = img.width * sin + img.height * cos

      // Draw the rotated image onto an offscreen canvas
      const rotCanvas = document.createElement('canvas')
      rotCanvas.width  = bBoxW
      rotCanvas.height = bBoxH
      const rotCtx = rotCanvas.getContext('2d')
      rotCtx.translate(bBoxW / 2, bBoxH / 2)
      rotCtx.rotate(radians)
      rotCtx.drawImage(img, -img.width / 2, -img.height / 2)

      // Now crop from the rotated canvas
      const scale = area.width > maxWidth ? maxWidth / area.width : 1
      const outW  = Math.round(area.width  * scale)
      const outH  = Math.round(area.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width  = outW
      canvas.height = outH
      const ctx = canvas.getContext('2d')
      ctx.drawImage(rotCanvas, area.x, area.y, area.width, area.height, 0, 0, outW, outH)
      canvas.toBlob(blob => {
        if (!blob) return reject(new Error('toBlob failed'))
        resolve(new File([blob], 'photo.jpg', { type: 'image/jpeg' }))
      }, 'image/jpeg', 0.92)
    }
    img.onerror = reject
    img.src = src
  })
}

// Ключ для сохранения позиции прокрутки дашборда между перезагрузками
const SCROLL_KEY = 'biz-dashboard-scroll'

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function BusinessDashboardPage() {
  const navigate = useNavigate()
  const { user, getAccessToken } = useAuth()

  // Prevent the browser from opening files dropped outside upload zones
  useEffect(() => {
    const prevent = (e) => {
      if (e.dataTransfer?.types?.includes('Files')) {
        e.preventDefault()
      }
    }
    window.addEventListener('dragover', prevent)
    window.addEventListener('drop', prevent)
    return () => {
      window.removeEventListener('dragover', prevent)
      window.removeEventListener('drop', prevent)
    }
  }, [])

  // Stats & biz info
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [bizId, setBizId]     = useState(null)
  const [bizData, setBizData] = useState(null)
  const [toast, setToast]     = useState('')
  const [verStatus, setVerStatus] = useState(null) // null | 'PENDING' | 'APPROVED' | 'REJECTED'
  const [profileChecked, setProfileChecked] = useState(false)

  const [setupBrandName, setSetupBrandName] = useState('')
  const [setupDescription, setSetupDescription] = useState('')
  const [setupCategory, setSetupCategory] = useState('OTHER')
  const [setupCity, setSetupCity] = useState('')
  const [setupPhone, setSetupPhone] = useState('')
  const [setupAddress, setSetupAddress] = useState('')
  const [setupLogo, setSetupLogo] = useState(null)
  const [setupSubmitting, setSetupSubmitting] = useState(false)
  const [setupError, setSetupError] = useState('')

  // Tab
  const [activeTab, setActiveTab] = useState('profile')

  // Services management
  const [bizServices, setBizServices]     = useState([])
  const [svcName, setSvcName]             = useState('')
  const [svcPrice, setSvcPrice]           = useState('')
  const [svcCurrency, setSvcCurrency]     = useState('TRY')
  const [savingServices, setSavingServices] = useState(false)

  // Content lists
  const [posts, setPosts]       = useState([])
  const [postsLoaded, setPostsLoaded] = useState(false)
  const [postsLoading, setPostsLoading] = useState(false)

  const [stories, setStories]     = useState([])
  const [storiesLoaded, setStoriesLoaded] = useState(false)
  const [storiesLoading, setStoriesLoading] = useState(false)

  // Delete confirm
  const [confirmState, setConfirmState] = useState(null) // { type, id, label }
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Media lightbox { src, isVideo }
  const [lightbox, setLightbox] = useState(null)

  // Profile edit
  const [editBrandName, setEditBrandName] = useState('')
  const [editDesc,    setEditDesc]    = useState('')
  const [editPhone,   setEditPhone]   = useState('')
  const [editWebsite, setEditWebsite] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [editCity,    setEditCity]    = useState('')
  const [editLogo,    setEditLogo]    = useState(null)
  const [editCover,     setEditCover]     = useState(null)
  const [editCardMedia, setEditCardMedia] = useState(null)
  // cropTask = { src, aspect, onCropped } | null
  const [cropTask,      setCropTask]      = useState(null)
  const cardMediaInputRef = useRef(null)
  const [editAudio,   setEditAudio]   = useState(null)
  const [removeAudio, setRemoveAudio] = useState(false)
  const audioInputRef = useRef(null)
  const [savingProfile, setSavingProfile] = useState(false)

  // Hashtags
  const [bizTags,       setBizTags]       = useState([])
  const [tagInput,      setTagInput]      = useState('')
  const [tagSuggests,   setTagSuggests]   = useState([])
  const [tagsLoading,   setTagsLoading]   = useState(false)
  const [bizPopularTags, setBizPopularTags] = useState([])

  const TAG_LIMITS = { FREE: 5, PRO: 15, VIP: null }
  const tagLimit = TAG_LIMITS[bizData?.plan_type] ?? 5
  const editAudioPreviewUrl = useMemo(() => (editAudio ? URL.createObjectURL(editAudio) : ''), [editAudio])

  useEffect(() => {
    return () => {
      if (editAudioPreviewUrl) URL.revokeObjectURL(editAudioPreviewUrl)
    }
  }, [editAudioPreviewUrl])

  // Social links
  const [editTelegram,  setEditTelegram]  = useState('')
  const [editWhatsapp,  setEditWhatsapp]  = useState('')
  const [editInstagram, setEditInstagram] = useState('')
  const [editYoutube,   setEditYoutube]   = useState('')
  const [editTiktok,    setEditTiktok]    = useState('')
  const [editFacebook,  setEditFacebook]  = useState('')

  // Public group selector
  const [myGroups,        setMyGroups]        = useState([])
  const [selectedGroupId, setSelectedGroupId] = useState(null)

  // FAQ edit
  const [bizFaq,      setBizFaq]      = useState([])
  const [faqQuestion, setFaqQuestion] = useState('')
  const [faqAnswer,   setFaqAnswer]   = useState('')

  // Modals
  const [showStory,    setShowStory]    = useState(false)
  const [showPost,     setShowPost]     = useState(false)
  const [showTweet,    setShowTweet]    = useState(false)
  const [showPhoto,    setShowPhoto]    = useState(false)
  const [showVideo,    setShowVideo]    = useState(false)

  // ── Filters: Stories ───────────────────────────────────────────────────────
  const [storySearch, setStorySearch] = useState('')
  const [storyType,   setStoryType]   = useState('all')   // all | IMAGE | VIDEO
  const [storySort,   setStorySort]   = useState('newest') // newest | oldest

  const showToast = msg => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // ── Populate profile form when bizData loads ───────────────────────────────
  useEffect(() => {
    if (!bizData) return
    setEditBrandName(bizData.brand_name || '')
    setEditDesc(bizData.description || '')
    setEditPhone(bizData.phone || '')
    setEditWebsite(bizData.website || '')
    setEditAddress(bizData.address || '')
    setEditCity(bizData.city || '')
    setBizFaq(Array.isArray(bizData.faq) ? bizData.faq : [])
    setBizTags(Array.isArray(bizData.tags) ? bizData.tags : [])
    setEditTelegram(bizData.social_telegram || '')
    setEditWhatsapp(bizData.social_whatsapp || '')
    setEditInstagram(bizData.social_instagram || '')
    setEditYoutube(bizData.social_youtube || '')
    setEditTiktok(bizData.social_tiktok || '')
    setEditFacebook(bizData.social_facebook || '')
    setEditAudio(null)
    setRemoveAudio(false)
    if (audioInputRef.current) audioInputRef.current.value = ''
    setSelectedGroupId(bizData.group_id || null)
  }, [bizData])

  // ── Сохранение/восстановление позиции прокрутки при перезагрузке ───────────
  // Контент дашборда грузится асинхронно (auth → lazy-чанк → fetch), поэтому
  // при F5 браузер не может восстановить скролл и страница «прыгает» наверх.
  // Сохраняем позицию и восстанавливаем её после загрузки данных — но только
  // при перезагрузке страницы (при обычном переходе на дашборд — открываем сверху).
  useEffect(() => {
    const onScroll = () => sessionStorage.setItem(SCROLL_KEY, String(Math.round(window.scrollY)))
    window.addEventListener('scroll', onScroll, { passive: true })
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    return () => {
      window.removeEventListener('scroll', onScroll)
      if ('scrollRestoration' in history) history.scrollRestoration = 'auto'
    }
  }, [])

  const scrollRestored = useRef(false)
  useEffect(() => {
    if (!bizData || scrollRestored.current) return
    scrollRestored.current = true
    const nav = performance.getEntriesByType('navigation')[0]
    const isReload = nav ? nav.type === 'reload' : false
    if (!isReload) { sessionStorage.removeItem(SCROLL_KEY); return }
    const saved = parseInt(sessionStorage.getItem(SCROLL_KEY) || '0', 10)
    if (saved > 0) {
      // ждём пару кадров, чтобы контент успел отрисоваться и стать нужной высоты
      requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, saved)))
    }
  }, [bizData])

  // ── Unified save (profile + social + group + tags + faq + services) ────────
  const handleSaveAll = async () => {
    setSavingProfile(true)
    try {
      const token = await getAccessToken()

      // ── Step 1: FormData PATCH — text fields + optional media ─────────────
      const fd = new FormData()
      fd.append('brand_name', editBrandName.trim())
      fd.append('description', editDesc)
      fd.append('phone', editPhone)
      fd.append('website', editWebsite)
      fd.append('address', editAddress)
      fd.append('city', editCity)
      fd.append('social_telegram',  editTelegram)
      fd.append('social_whatsapp',  editWhatsapp)
      fd.append('social_instagram', editInstagram)
      fd.append('social_youtube',   editYoutube)
      fd.append('social_tiktok',    editTiktok)
      fd.append('social_facebook',  editFacebook)
      if (editLogo)      fd.append('logo',      editLogo)
      if (editCover)     fd.append('cover',      editCover)
      if (editCardMedia) fd.append('card_media', editCardMedia)
      if (editAudio)     fd.append('audio',      editAudio)
      if (removeAudio && !editAudio) fd.append('remove_audio', 'true')

      const r1 = await fetch(`${BASE}/businesses/me/`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      if (!r1.ok) {
        const e1 = await r1.json().catch(() => null)
        throw new Error(e1?.detail || Object.values(e1 || {}).flat().join(' ') || 'Ошибка')
      }

      // ── Step 2: JSON PATCH — complex fields (group, tags, faq, services) ──
      const r2 = await fetch(`${BASE}/businesses/me/`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group:    selectedGroupId,
          tags:     bizTags,
          faq:      bizFaq,
          services: bizServices,
        }),
      })
      if (!r2.ok) {
        const e2 = await r2.json().catch(() => null)
        throw new Error(e2?.detail || Object.values(e2 || {}).flat().join(' ') || 'Ошибка')
      }

      const updated = await r2.json()
      setBizData(updated)
      setBizServices(Array.isArray(updated.services) ? updated.services : [])
      setEditLogo(null)
      setEditCover(null)
      setEditCardMedia(null)
      setEditAudio(null)
      setRemoveAudio(false)
      if (audioInputRef.current) audioInputRef.current.value = ''
      showToast('✅ Все изменения сохранены!')
    } catch (e) {
      showToast('❌ ' + (e.message || 'Ошибка при сохранении'))
    } finally {
      setSavingProfile(false)
    }
  }

  // Мгновенно сохраняет отдельное JSON-поле бизнеса (faq/tags/services) на сервере,
  // чтобы добавление/удаление применялось сразу — без кнопки «Сохранить все».
  // Намеренно НЕ трогаем bizData, чтобы не затереть несохранённые правки текстовых полей.
  const persistBizField = async (patch, okMsg) => {
    try {
      const token = await getAccessToken()
      if (!token) throw new Error('auth')
      const res = await fetch(`${BASE}/businesses/me/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw new Error()
      if (okMsg) showToast(okMsg)
    } catch {
      showToast('❌ Не удалось сохранить')
    }
  }

  // ── FAQ handlers ──────────────────────────────────────────────────────────
  const handleAddFaq = () => {
    if (!faqQuestion.trim() || !faqAnswer.trim()) return
    const next = [...bizFaq, { question: faqQuestion.trim(), answer: faqAnswer.trim() }]
    setBizFaq(next)
    setFaqQuestion('')
    setFaqAnswer('')
    persistBizField({ faq: next }, '✅ Вопрос добавлен')
  }

  const handleRemoveFaq = (idx) => {
    const next = bizFaq.filter((_, i) => i !== idx)
    setBizFaq(next)
    persistBizField({ faq: next }, '🗑 Вопрос удалён')
  }

  // ── Hashtag handlers ──────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${BASE}/tags/?q=`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setBizPopularTags(Array.isArray(data) ? data.slice(0, 40) : []))
      .catch(() => {})
  }, [])

  const searchTags = async (q) => {
    setTagInput(q)
    const clean = q.trim().replace(/^#+/, '')
    if (!clean) { setTagSuggests([]); return }
    setTagsLoading(true)
    try {
      const res = await fetch(`${BASE}/tags/?q=${encodeURIComponent(clean)}`)
      const data = await res.json()
      setTagSuggests(Array.isArray(data) ? data.filter(t => !bizTags.includes(t)) : [])
    } catch {
      setTagSuggests([])
    } finally {
      setTagsLoading(false)
    }
  }

  const handleSelectTag = (tag) => {
    const limit = TAG_LIMITS[bizData?.plan_type] ?? 5
    if (limit !== null && bizTags.length >= limit) return
    if (bizTags.includes(tag)) return
    const next = [...bizTags, tag]
    setBizTags(next)
    setTagInput('')
    setTagSuggests([])
    persistBizField({ tags: next }, '✅ Хэштег добавлен')
  }

  const handleRemoveTag = (tag) => {
    const next = bizTags.filter(t => t !== tag)
    setBizTags(next)
    persistBizField({ tags: next }, '🗑 Хэштег удалён')
  }

  // ── Filtered + sorted lists ────────────────────────────────────────────────
  const filteredStories = useMemo(() => {
    let list = [...stories]
    if (storySearch.trim())  list = list.filter(s => s.caption?.toLowerCase().includes(storySearch.toLowerCase()))
    if (storyType !== 'all') list = list.filter(s => s.media_type === storyType)
    if (storySort === 'oldest') list.reverse()
    return list
  }, [stories, storySearch, storyType, storySort])

  const needsStoreSetup = profileChecked && !loading && !error && bizId == null

  // ── Load stats + biz data ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user) { navigate('/login'); return }
    if (user.role !== 'BUSINESS') { navigate('/'); return }
    setLoading(true)
    setError('')
    setProfileChecked(false)

    ;(async () => {
      const token = await getAccessToken()
      if (!token) throw new Error('auth')

      const r = await fetch(`${BASE}/businesses/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (r.status === 404) {
        setBizId(null)
        setBizData(null)
        setStats(null)
        setVerStatus(null)
        setSetupCity(user?.city || '')
        setProfileChecked(true)
        setLoading(false)
        return
      }

      if (!r.ok) throw new Error('me')

      const data = await r.json()
      setBizId(data.id)
      setBizData(data)
      setBizServices(Array.isArray(data.services) ? data.services : [])
      setProfileChecked(true)

      const headers = { Authorization: `Bearer ${token}` }
      const [statsRes, verRes] = await Promise.all([
        fetch(`${BASE}/businesses/me/stats/`, { headers }),
        fetch(`${BASE}/verification/my/`, { headers }),
      ])

      if (statsRes.status === 404) setStats(null)
      else if (statsRes.ok) setStats(await statsRes.json())
      else throw new Error('stats')

      if (verRes.ok) setVerStatus(getVerificationStatus(await verRes.json()))
      else setVerStatus(null)
    })()
      .catch(() => {
        setError('Не удалось загрузить данные')
        setBizId(null)
        setBizData(null)
        setStats(null)
        setVerStatus(null)
        setProfileChecked(true)
      })
      .finally(() => setLoading(false))
  }, [user, navigate, getAccessToken])

  // ── Load my groups (for public group selector) ─────────────────────────────
  useEffect(() => {
    if (!user) return
    ;(async () => {
      try {
        const token = await getAccessToken()
        const res = await fetch(`${BASE}/groups/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const data = await res.json()
        // Only show groups where I am OWNER
        setMyGroups(Array.isArray(data) ? data.filter(g => g.my_role === 'OWNER') : [])
      } catch {}
    })()
  }, [user, getAccessToken])

  const handleCreateStore = async (e) => {
    e?.preventDefault?.()
    setSetupError('')
    if (!setupBrandName.trim()) {
      setSetupError('Укажите название магазина или бренда')
      return
    }
    if (setupDescription.trim().length < 20) {
      setSetupError('Опишите магазин хотя бы в нескольких предложениях (минимум 20 символов)')
      return
    }
    if (!setupCity) {
      setSetupError('Выберите город')
      return
    }
    setSetupSubmitting(true)
    try {
      const token = await getAccessToken()
      const fd = new FormData()
      fd.append('brand_name', setupBrandName.trim())
      fd.append('description', setupDescription.trim())
      fd.append('category', setupCategory)
      fd.append('city', setupCity)
      fd.append('phone', setupPhone.trim())
      fd.append('address', setupAddress.trim())
      if (setupLogo) fd.append('logo', setupLogo)

      const res = await fetch(`${BASE}/businesses/create/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setSetupError(formatDrfErrors(body))
        return
      }

      setBizId(body.id)
      setBizData(body)
      setBizServices(Array.isArray(body.services) ? body.services : [])
      setSetupBrandName('')
      setSetupDescription('')
      setSetupCategory('OTHER')
      setSetupLogo(null)
      setSetupError('')

      const statsRes = await fetch(`${BASE}/businesses/me/stats/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (statsRes.ok) {
        setStats(await statsRes.json())
      } else {
        setStats({
          profile_views: body.views_count ?? 0,
          unread_inquiries: 0,
          active_stories: 0,
          rating: String(body.rating ?? '0.0'),
          is_verified: body.is_verified ?? false,
        })
      }

      const verRes = await fetch(`${BASE}/verification/my/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (verRes.ok) setVerStatus(getVerificationStatus(await verRes.json()))
      else setVerStatus(null)
      showToast('Магазин создан — можно публиковать контент')
    } catch {
      setSetupError('Ошибка сети. Попробуйте ещё раз.')
    } finally {
      setSetupSubmitting(false)
    }
  }

  // ── Refs to track load state without triggering re-renders/loops ────────────
  const postsLoadedRef   = useRef(false)
  const postsLoadingRef  = useRef(false)
  const storiesLoadedRef = useRef(false)
  const storiesLoadingRef = useRef(false)

  // ── Lazy load posts ────────────────────────────────────────────────────────
  const loadPosts = useCallback(async (id) => {
    if (postsLoadedRef.current || postsLoadingRef.current) return
    postsLoadingRef.current = true
    setPostsLoading(true)
    try {
      const token = await getAccessToken()
      const res = await fetch(`${BASE}/businesses/${id}/posts/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        postsLoadedRef.current = true
        setPostsLoaded(true)
        showToast('Не удалось загрузить посты')
        return
      }
      const data = await res.json()
      setPosts(Array.isArray(data) ? data : (data.results || []))
      postsLoadedRef.current = true
      setPostsLoaded(true)
    } catch {
      postsLoadedRef.current = true   // stop retrying on error
      setPostsLoaded(true)
      showToast('Не удалось загрузить посты')
    } finally {
      postsLoadingRef.current = false
      setPostsLoading(false)
    }
  }, [getAccessToken])

  // ── Lazy load stories ──────────────────────────────────────────────────────
  const loadStories = useCallback(async (id) => {
    if (storiesLoadedRef.current || storiesLoadingRef.current) return
    storiesLoadingRef.current = true
    setStoriesLoading(true)
    try {
      const token = await getAccessToken()
      const data = await apiGetBusinessStories(id, token, user?.id)
      setStories(Array.isArray(data) ? data : (data.results || []))
      storiesLoadedRef.current = true
      setStoriesLoaded(true)
    } catch {
      storiesLoadedRef.current = true  // stop retrying on error
      setStoriesLoaded(true)
      showToast('Не удалось загрузить истории')
    } finally {
      storiesLoadingRef.current = false
      setStoriesLoading(false)
    }
  }, [getAccessToken, user?.id])

  // ── Single effect: fires when tab or bizId changes ─────────────────────────
  useEffect(() => {
    if (!bizId) return
    if (activeTab === 'posts' || activeTab === 'tweets') void loadPosts(bizId)
    if (activeTab === 'stories')  void loadStories(bizId)
  }, [activeTab, bizId])            // loadPosts/loadStories stable — no loop

  // ── Refresh stats after create ─────────────────────────────────────────────
  const refreshStats = () => {
    getAccessToken().then(token => {
      if (!token) return null
      return fetch(`${BASE}/businesses/me/stats/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    })
      .then(async (r) => {
        if (!r) return null
        if (r.status === 404) {
          setStats(null)
          return null
        }
        if (!r.ok) throw new Error('stats')
        return r.json()
      })
      .then((data) => { if (data) setStats(data) })
      .catch(() => {})
  }

  const handleSuccess = msg => {
    showToast(msg)
    refreshStats()
    // Invalidate loaded flags and refresh the active list immediately.
    if (msg.includes('Пост') || msg.includes('Твит') || msg.includes('Фото') || msg.includes('Видео')) {
      // Drop the shared list caches so HomePage / feed / shop profile
      // show the new post immediately instead of a 5-min stale list.
      invalidateCache('posts')
      if (bizId) invalidateCache(`biz-posts:${bizId}`)
      postsLoadedRef.current = false
      setPostsLoaded(false)
      setPosts([])
      if ((activeTab === 'posts' || activeTab === 'tweets') && bizId) void loadPosts(bizId)
    }
    if (msg.includes('Сторис')) {
      storiesLoadedRef.current = false
      setStoriesLoaded(false)
      setStories([])
      if (activeTab === 'stories' && bizId) void loadStories(bizId)
    }
  }

  // ── Delete flow ────────────────────────────────────────────────────────────
  const requestDelete = (type, id, label) => {
    setConfirmState({ type, id, label })
  }

  const handleConfirmDelete = async () => {
    if (!confirmState) return
    const { type, id } = confirmState
    setDeleteLoading(true)
    try {
      const token = await getAccessToken()
      if (type === 'post') {
        await apiDeletePost(bizId, id, token)
        setPosts(prev => prev.filter(p => p.id !== id))
        invalidateCache('posts')
        if (bizId) invalidateCache(`biz-posts:${bizId}`)
        showToast('Пост удалён')
        refreshStats()
      } else if (type === 'story') {
        await apiDeleteStory(id, token)
        // Only remove from UI after confirmed server deletion (no 404 swallowing)
        setStories(prev => prev.filter(s => s.id !== id))
        showToast('История удалена')
        refreshStats()
      }
    } catch (e) {
      showToast(e.message || 'Ошибка удаления')
    } finally {
      setDeleteLoading(false)
      setConfirmState(null)
    }
  }

  // ── Services management ────────────────────────────────────────────────────
  const handleAddService = () => {
    if (!svcName.trim()) return
    const next = [...bizServices, { name: svcName.trim(), price: svcPrice.trim(), currency: svcCurrency }]
    setBizServices(next)
    setSvcName(''); setSvcPrice('')
    persistBizField({ services: next }, '✅ Услуга добавлена')
  }

  const handleRemoveService = (idx) => {
    const next = bizServices.filter((_, i) => i !== idx)
    setBizServices(next)
    persistBizField({ services: next }, '🗑 Услуга удалена')
  }

  const handleSaveServices = async () => {
    setSavingServices(true)
    try {
      const token = await getAccessToken()
      if (!token) throw new Error('auth')
      const res = await fetch(`${BASE}/businesses/me/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ services: bizServices }),
      })
      if (!res.ok) throw new Error()
      showToast('Услуги сохранены!')
    } catch {
      showToast('Ошибка сохранения')
    } finally {
      setSavingServices(false)
    }
  }

  // ── Confirm message per type ───────────────────────────────────────────────
  const confirmMessage = confirmState
    ? confirmState.type === 'post'
      ? `Удалить пост${confirmState.label ? ` "${confirmState.label}"` : ''}? Это действие нельзя отменить.`
      : confirmState.type === 'story'
        ? 'Удалить эту историю? Это действие нельзя отменить.'
        : `Удалить услугу${confirmState.label ? ` "${confirmState.label}"` : ''}? Это действие нельзя отменить.`
    : ''

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="biz-dashboard-page">
      <Header />
      <main className="biz-dashboard">

        {/* Toast */}
        {toast && <div className="biz-toast">{toast}</div>}

        <div className="biz-dashboard__header">
          <button className="biz-dashboard__back" onClick={() => navigate(-1)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Назад
          </button>
          <div>
            <h1 className="biz-dashboard__title">Панель управления</h1>
            <p className="biz-dashboard__sub">
              {needsStoreSetup
                ? 'Заполните данные магазина в разделе «Профиль» — без них остальные разделы недоступны'
                : 'Статистика вашего бизнеса'}
            </p>
          </div>
          <button className="biz-dashboard__profile-btn" onClick={() => navigate('/me')}>
            Мой профиль →
          </button>
        </div>

        {!needsStoreSetup && (
        <div className="biz-publish-btns">
          <button
            type="button"
            className="biz-publish-btn biz-publish-btn--story"
            onClick={() => setShowStory(true)}
            disabled={!bizId}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="16"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            Новый сторис
          </button>
          <button
            type="button"
            className="biz-publish-btn biz-publish-btn--post"
            onClick={() => setShowPost(true)}
            disabled={!bizId}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="12" y1="8" x2="12" y2="16"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            Новый пост
          </button>
          <button
            type="button"
            className="biz-publish-btn biz-publish-btn--photo"
            onClick={() => setShowPhoto(true)}
            disabled={!bizId}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            Фото
          </button>
          <button
            type="button"
            className="biz-publish-btn biz-publish-btn--video"
            onClick={() => setShowVideo(true)}
            disabled={!bizId}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
            Видео
          </button>
          {bizData?.is_pro ? (
            <button
              type="button"
              className="biz-publish-btn biz-publish-btn--tweet"
              onClick={() => setShowTweet(true)}
              disabled={!bizId}
              title="Доступно для Pro и VIP"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
              </svg>
              Новый твит
            </button>
          ) : bizData && (
            <button
              type="button"
              className="biz-publish-btn biz-publish-btn--tweet"
              onClick={() => navigate('/pricing')}
              title={bizData.plan_type !== 'FREE'
                ? 'Срок тарифа истёк — продлите подписку, чтобы публиковать твиты'
                : 'Публикация твитов доступна на тарифах Pro и VIP'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="11" width="14" height="10" rx="2"/>
                <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
              </svg>
              {bizData.plan_type !== 'FREE' ? 'Тариф истёк — продлить' : 'Твиты — оплатить тариф'}
            </button>
          )}
        </div>
        )}

        {loading ? (
          <div className="biz-dashboard__loading">
            <div className="biz-dashboard__spinner" />
            <p>Загрузка…</p>
          </div>
        ) : error ? (
          <div className="biz-dashboard__error">{error}</div>
        ) : needsStoreSetup ? (
          <div className="biz-dashboard__section">
            <div className="biz-profile-lock-banner">
              ⚠️ Заполните данные магазина — без них остальные разделы заблокированы
            </div>
            <div className="biz-content-tabs">
              {[
                ['posts', '📝 Посты'],
                ['tweets', '🐦 Твиты'],
                ['stories', '🎬 Истории'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  className="biz-content-tab biz-content-tab--locked"
                  disabled
                  title="Сначала заполните данные магазина"
                >
                  🔒 {label}
                </button>
              ))}
              <button className="biz-content-tab biz-content-tab--active">
                ✏️ Профиль
              </button>
            </div>
            <form className="biz-store-setup" onSubmit={handleCreateStore}>
              <p className="biz-store-setup__lead">
                Заполните основные данные магазина — после сохранения откроются сторис и посты.
              </p>
              <div className="biz-store-setup__grid">
                <label className="biz-store-setup__field">
                  <span>Название магазина / бренда *</span>
                  <input
                    type="text"
                    value={setupBrandName}
                    onChange={(e) => setSetupBrandName(e.target.value)}
                    placeholder="Как вас видят клиенты"
                    maxLength={200}
                    autoComplete="organization"
                  />
                </label>
                <label className="biz-store-setup__field">
                  <span>Категория *</span>
                  <select
                    value={setupCategory}
                    onChange={(e) => setSetupCategory(e.target.value)}
                  >
                    {BIZ_CATEGORY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </label>
                <label className="biz-store-setup__field">
                  <span>Город *</span>
                  <select
                    value={setupCity}
                    onChange={(e) => setSetupCity(e.target.value)}
                  >
                    <option value="">— выберите —</option>
                    {CITY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </label>
                <label className="biz-store-setup__field">
                  <span>Телефон</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={setupPhone}
                    onChange={(e) => setSetupPhone(e.target.value.replace(/[^\d+\s\-()]/g, ''))}
                    placeholder="+90 …"
                    autoComplete="tel"
                  />
                </label>
                <label className="biz-store-setup__field biz-store-setup__field--wide">
                  <span>Адрес (необязательно)</span>
                  <input
                    type="text"
                    value={setupAddress}
                    onChange={(e) => setSetupAddress(e.target.value)}
                    placeholder="Улица, район"
                  />
                </label>
                <label className="biz-store-setup__field biz-store-setup__field--wide">
                  <span>Описание магазина * (мин. 20 символов)</span>
                  <textarea
                    value={setupDescription}
                    onChange={(e) => setSetupDescription(e.target.value)}
                    placeholder="Чем вы занимаетесь, что предлагаете клиентам"
                    rows={4}
                  />
                </label>
                <label className="biz-store-setup__field biz-store-setup__field--wide">
                  <span>Логотип (необязательно)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSetupLogo(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
              {setupError && <p className="biz-form__error biz-store-setup__error">{setupError}</p>}
              <button
                type="submit"
                className="biz-store-setup__submit"
                disabled={setupSubmitting}
              >
                {setupSubmitting ? <span className="biz-form__spinner" /> : 'Сохранить и открыть разделы'}
              </button>
            </form>
          </div>
        ) : stats ? (
          <>
            {/* ── Stat Cards ── */}
            <div className="biz-stat-cards">
              <StatCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                value={stats.profile_views}
                label="Просмотры профиля"
                color="#6366f1"
              />
              <StatCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>}
                value={stats.unread_inquiries}
                label="Новых сообщений"
                color="#e53935"
              />
              <StatCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
                value={stats.active_stories}
                label="Активных историй"
                color="#10b981"
              />
              <StatCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
                value={stats.rating}
                label="Рейтинг"
                color="#f59e0b"
              />
              {stats.is_verified && (
                <StatCard
                  icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
                  value="✓"
                  label="Верифицирован"
                  color="#10b981"
                />
              )}
            </div>

            {/* ── Plan Card ── */}
            {bizData && (
              <div className="biz-plan-card">
                <div className="biz-plan-card__left">
                  <span className={`biz-plan-badge biz-plan-badge--${(bizData.plan_type || 'FREE').toLowerCase()}`}>
                    {bizData.plan_type === 'VIP' ? '⭐ VIP' : bizData.plan_type === 'PRO' ? '⚡ Pro' : 'Бесплатный'}
                  </span>
                  <span className="biz-plan-card__label">Текущий тариф</span>
                  {bizData.plan_expires_at && bizData.plan_type !== 'FREE' && (
                    <span className="biz-plan-card__expires">
                      Действует до {new Date(bizData.plan_expires_at).toLocaleDateString('ru-RU')}
                    </span>
                  )}
                </div>
                <button className="biz-plan-card__upgrade" onClick={() => navigate('/pricing')}>
                  {bizData.plan_type === 'FREE' ? 'Улучшить тариф' : bizData.plan_type === 'PRO' ? 'Перейти на VIP' : 'Продлить'}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>
            )}

            {/* ── Verification Chat Card ── */}
            <div
              className={`biz-ver-card biz-ver-card--${verStatus ? verStatus.toLowerCase() : 'none'}`}
              onClick={() => navigate('/verification')}
            >
              <div className="biz-ver-card__icon">
                {verStatus === 'APPROVED' ? '✅' : verStatus === 'REJECTED' ? '❌' : verStatus === 'PENDING' ? '⏳' : '🛡️'}
              </div>
              <div className="biz-ver-card__info">
                <div className="biz-ver-card__title">
                  {verStatus === 'APPROVED' ? 'Бизнес верифицирован'
                    : verStatus === 'REJECTED' ? 'Заявка отклонена'
                    : verStatus === 'PENDING' ? 'Заявка на рассмотрении'
                    : 'Верификация бизнеса'}
                </div>
                <div className="biz-ver-card__sub">
                  {verStatus === 'APPROVED' ? 'Ваш аккаунт подтверждён — клиенты видят значок ✓'
                    : verStatus === 'REJECTED' ? 'Откройте чат — можно отправить новые документы'
                    : verStatus === 'PENDING' ? 'Ответьте модератору в чате верификации'
                    : 'Пройдите верификацию чтобы получить значок доверия'}
                </div>
              </div>
              <div className="biz-ver-card__arrow">
                {verStatus === 'PENDING'
                  ? <span className="biz-ver-card__badge">Открыть чат →</span>
                  : <span className="biz-ver-card__arrow-icon">→</span>}
              </div>
            </div>

            {/* ── Content Tabs ── */}
            <div className="biz-dashboard__section">
              <div className="biz-content-tabs">
                <button
                  className={`biz-content-tab ${activeTab === 'posts' ? 'biz-content-tab--active' : ''}`}
                  onClick={() => setActiveTab('posts')}
                >
                  📝 Посты
                  {postsLoaded && <span className="biz-content-tab__count">{posts.length}</span>}
                </button>
                {bizData?.is_pro && (
                  <button
                    className={`biz-content-tab ${activeTab === 'tweets' ? 'biz-content-tab--active' : ''}`}
                    onClick={() => setActiveTab('tweets')}
                  >
                    🐦 Твиты
                    {postsLoaded && (
                      <span className="biz-content-tab__count">
                        {posts.filter(p => p.is_tweet).length}
                      </span>
                    )}
                  </button>
                )}
                <button
                  className={`biz-content-tab ${activeTab === 'stories' ? 'biz-content-tab--active' : ''}`}
                  onClick={() => setActiveTab('stories')}
                >
                  🎬 Истории
                  {storiesLoaded && <span className="biz-content-tab__count">{stories.length}</span>}
                </button>
                <button
                  className={`biz-content-tab ${activeTab === 'profile' ? 'biz-content-tab--active' : ''}`}
                  onClick={() => setActiveTab('profile')}
                >
                  ✏️ Профиль
                </button>
                <button
                  className={`biz-content-tab ${activeTab === 'survey' ? 'biz-content-tab--active' : ''}`}
                  onClick={() => setActiveTab('survey')}
                >
                  📊 Опросы
                </button>
              </div>

              {activeTab === 'survey' && (
                <BusinessSurveySection getAccessToken={getAccessToken} />
              )}

              {/* ── Posts tab ── */}
              {activeTab === 'posts' && (
                <>
                  <div className="biz-dashboard__section-header">
                    <h2>Мои посты</h2>
                    <button className="biz-dashboard__add-btn" onClick={() => setShowPost(true)}>
                      + Новый пост
                    </button>
                  </div>

                  {/* Post filters */}

                  {postsLoading ? (
                    <div className="biz-content-loading"><div className="biz-dashboard__spinner" /></div>
                  ) : posts.filter(p => !p.is_tweet).length === 0 ? (
                    <div className="biz-dashboard__empty">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.3">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/>
                      </svg>
                      <p>Нет постов. Нажмите «Новый пост» чтобы опубликовать.</p>
                    </div>
                  ) : (
                    <div className="biz-content-list">
                      {posts.filter(p => !p.is_tweet).map(post => (
                        <PostRow
                          key={post.id}
                          post={post}
                          onDelete={id => requestDelete('post', id, post.text?.slice(0, 30))}
                          deleting={null}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ── Tweets tab (PRO/VIP only) ── */}
              {activeTab === 'tweets' && (
                <>
                  <div className="biz-dashboard__section-header">
                    <h2>Мои твиты</h2>
                    <button className="biz-dashboard__add-btn" onClick={() => setShowTweet(true)}>
                      + Новый твит
                    </button>
                  </div>

                  {postsLoading ? (
                    <div className="biz-content-loading"><div className="biz-dashboard__spinner" /></div>
                  ) : posts.filter(p => p.is_tweet).length === 0 ? (
                    <div className="biz-dashboard__empty">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.3">
                        <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
                      </svg>
                      <p>Нет твитов. Нажмите «Новый твит» чтобы опубликовать.</p>
                    </div>
                  ) : (
                    <div className="biz-content-list">
                      {posts.filter(p => p.is_tweet).map(post => (
                        <PostRow
                          key={post.id}
                          post={post}
                          onDelete={id => requestDelete('post', id, post.text?.slice(0, 30))}
                          deleting={null}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ── Stories tab ── */}
              {activeTab === 'stories' && (
                <>
                  <div className="biz-dashboard__section-header">
                    <h2>Мои истории</h2>
                    <button className="biz-dashboard__add-btn" onClick={() => setShowStory(true)}>
                      + Новый сторис
                    </button>
                  </div>

                  {/* Story filters */}
                  <div className="biz-filter-bar">
                    <div className="biz-filter-bar__search">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                      <input
                        type="text"
                        className="biz-filter-bar__input"
                        placeholder="Поиск по подписи..."
                        value={storySearch}
                        onChange={e => setStorySearch(e.target.value)}
                      />
                      {storySearch && (
                        <button className="biz-filter-bar__clear" onClick={() => setStorySearch('')}>✕</button>
                      )}
                    </div>
                    <div className="biz-filter-bar__chips">
                      {[['all','Все'],['IMAGE','📷 Фото'],['VIDEO','▶ Видео']].map(([v, l]) => (
                        <button key={v}
                          className={`biz-filter-chip ${storyType === v ? 'biz-filter-chip--active' : ''}`}
                          onClick={() => setStoryType(v)}
                        >{l}</button>
                      ))}
                    </div>
                    <select className="biz-filter-bar__select" value={storySort} onChange={e => setStorySort(e.target.value)}>
                      <option value="newest">Сначала новые</option>
                      <option value="oldest">Сначала старые</option>
                    </select>
                  </div>

                  {(storySearch || storyType !== 'all') && (
                    <div className="biz-filter-bar__result">
                      Найдено: <strong>{filteredStories.length}</strong> из {stories.length}
                      <button className="biz-filter-bar__reset" onClick={() => { setStorySearch(''); setStoryType('all'); setStorySort('newest') }}>
                        Сбросить
                      </button>
                    </div>
                  )}

                  {storiesLoading ? (
                    <div className="biz-content-loading"><div className="biz-dashboard__spinner" /></div>
                  ) : stories.length === 0 ? (
                    <div className="biz-dashboard__empty">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.3">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/>
                      </svg>
                      <p>Нет активных историй. Нажмите «Новый сторис».</p>
                    </div>
                  ) : filteredStories.length === 0 ? (
                    <div className="biz-dashboard__empty">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                      <p>Ничего не найдено. Попробуйте изменить фильтры.</p>
                    </div>
                  ) : (
                    <div className="biz-content-list">
                      {filteredStories.map(story => (
                        <StoryRow
                          key={story.id}
                          story={story}
                          onDelete={id => requestDelete('story', id, null)}
                          deleting={null}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
              {/* ── Profile Edit tab ── */}
              {activeTab === 'profile' && (
                <>
                  <div className="biz-dashboard__section-header">
                    <h2>Редактировать профиль</h2>
                  </div>

                  <div className="biz-profile-edit">

                    {/* Avatar */}
                    <div className="biz-profile-edit__row">
                      <label className="biz-profile-edit__label">Аватар / Логотип</label>
                      <div className="biz-profile-edit__avatar-wrap">
                        {(() => {
                          const logoSrc = editLogo
                            ? URL.createObjectURL(editLogo)
                            : bizData?.logo ? resolveUrl(bizData.logo) : null
                          const logoIsVideo = editLogo
                            ? editLogo.type.startsWith('video/')
                            : bizData?.logo ? /\.(mp4|webm|mov)(\?|$)/i.test(bizData.logo) : false
                          if (!logoSrc) return <div className="biz-profile-edit__avatar-placeholder">{bizData?.brand_name?.[0] || '?'}</div>
                          const openLb = () => setLightbox({ src: logoSrc, isVideo: logoIsVideo })
                          return logoIsVideo
                            ? <video src={logoSrc} className="biz-profile-edit__avatar-preview biz-profile-edit__media-clickable" onClick={openLb} autoPlay muted loop playsInline />
                            : <img src={logoSrc} className="biz-profile-edit__avatar-preview biz-profile-edit__media-clickable" onClick={openLb} alt="logo" />
                        })()}
                        <label className="biz-profile-edit__upload-btn">
                          📷 Сменить фото / видео
                          <input
                            type="file"
                            accept="image/*,video/*"
                            hidden
                            onChange={e => {
                              const f = e.target.files[0]
                              if (!f) return
                              e.target.value = ''
                              setEditLogo(f)
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Cover */}
                    <div className="biz-profile-edit__row">
                      <label className="biz-profile-edit__label">Обложка</label>
                      <div className="biz-profile-edit__cover-wrap">
                        {(() => {
                          const coverSrc = editCover
                            ? URL.createObjectURL(editCover)
                            : bizData?.cover ? resolveUrl(bizData.cover) : null
                          if (!coverSrc) return <div className="biz-profile-edit__cover-placeholder">Нет обложки</div>
                          return <img
                            src={coverSrc}
                            className="biz-profile-edit__cover-preview biz-profile-edit__media-clickable"
                            onClick={() => setLightbox({ src: coverSrc, isVideo: false })}
                            alt="cover"
                          />
                        })()}
                        <label className="biz-profile-edit__upload-btn">
                          🖼️ Сменить обложку
                          <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={e => {
                              const f = e.target.files[0]
                              if (!f) return
                              e.target.value = ''
                              setEditCover(f)
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Card media */}
                    <div className="biz-profile-edit__row">
                      <label className="biz-profile-edit__label">Медиа для карточки</label>
                      <div className="biz-profile-edit__cover-wrap">
                        {(() => {
                          const cardSrc = editCardMedia
                            ? URL.createObjectURL(editCardMedia)
                            : bizData?.card_media ? resolveUrl(bizData.card_media) : null
                          const cardIsVideo = editCardMedia
                            ? /\.(mp4|webm|mov)(\?|$)/i.test(editCardMedia.name)
                            : bizData?.card_media ? /\.(mp4|webm|mov)(\?|$)/i.test(bizData.card_media) : false
                          if (!cardSrc) return <div className="biz-profile-edit__cover-placeholder">Нет медиа</div>
                          const openLb = () => setLightbox({ src: cardSrc, isVideo: cardIsVideo })
                          const cacheBust = editCardMedia ? '' : `?v=${Date.now()}`
                          return cardIsVideo
                            ? <video src={cardSrc + cacheBust} className="biz-profile-edit__card-preview biz-profile-edit__media-clickable" onClick={openLb} muted controls />
                            : <img src={cardSrc + cacheBust} className="biz-profile-edit__card-preview biz-profile-edit__media-clickable" onClick={openLb} alt="card media" />
                        })()}
                        <p className="biz-svc-hint" style={{marginTop:6,marginBottom:4}}>
                          Фото или видео, которое видят все пользователи на главной странице в вашей карточке
                        </p>
                        <label className="biz-profile-edit__upload-btn">
                          🎬 Загрузить фото / видео
                          <input
                            ref={cardMediaInputRef}
                            type="file"
                            accept="image/*,video/*"
                            hidden
                            onChange={e => {
                              const f = e.target.files[0]
                              if (!f) return
                              e.target.value = ''
                              if (f.type.startsWith('image/')) {
                                const url = URL.createObjectURL(f)
                                setCropTask({ src: url, aspect: 2 / 3, onCropped: (cropped) => setEditCardMedia(cropped) })
                              } else {
                                setEditCardMedia(f)
                              }
                            }}
                          />
                        </label>
                        {editCardMedia && (
                          <button className="biz-profile-edit__upload-btn" style={{marginLeft:8,background:'rgba(239,68,68,0.1)',color:'#ef4444',border:'1.5px solid rgba(239,68,68,0.3)'}} onClick={() => setEditCardMedia(null)}>
                            ✕ Убрать
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Brand name (shop name) */}
                    <div className="biz-profile-edit__row">
                      <label className="biz-profile-edit__label">Название магазина</label>
                      <input
                        className="biz-profile-edit__input"
                        type="text"
                        placeholder="Название вашего магазина"
                        value={editBrandName}
                        onChange={e => setEditBrandName(e.target.value)}
                        maxLength={100}
                      />
                    </div>

                    {/* Description */}
                    <div className="biz-profile-edit__row">
                      <label className="biz-profile-edit__label">О нас</label>
                      <textarea
                        className="biz-profile-edit__textarea"
                        placeholder="Расскажите о вашем бизнесе..."
                        value={editDesc}
                        onChange={e => setEditDesc(e.target.value)}
                        rows={4}
                      />
                    </div>

                    {/* City */}
                    <div className="biz-profile-edit__row">
                      <label className="biz-profile-edit__label">Город</label>
                      <select
                        className="biz-profile-edit__input"
                        value={editCity}
                        onChange={e => setEditCity(e.target.value)}
                      >
                        <option value="">Выберите город</option>
                        {CITY_OPTIONS.map((city) => (
                          <option key={city.value} value={city.value}>{city.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Phone */}
                    <div className="biz-profile-edit__row">
                      <label className="biz-profile-edit__label">Телефон</label>
                      <input
                        className="biz-profile-edit__input"
                        type="tel"
                        inputMode="numeric"
                        placeholder="+90 555 000 00 00"
                        value={editPhone}
                        onChange={e => setEditPhone(e.target.value.replace(/[^\d+\s\-()]/g, ''))}
                      />
                    </div>

                    {/* Address */}
                    <div className="biz-profile-edit__row">
                      <label className="biz-profile-edit__label">Адрес</label>
                      <input
                        className="biz-profile-edit__input"
                        placeholder="Улица, дом, район, город"
                        value={editAddress}
                        onChange={e => setEditAddress(e.target.value)}
                      />
                    </div>

                    {/* Audio */}
                    <div className="biz-profile-edit__row">
                      <label className="biz-profile-edit__label">🎵 Фоновая музыка</label>
                      <div className="biz-profile-edit__audio-wrap">
                        {bizData?.audio && !editAudio && !removeAudio && (
                          <audio
                            className="biz-profile-edit__audio-player"
                            src={bizData.audio.startsWith('http') ? bizData.audio : `${API_ORIGIN}${bizData.audio}`}
                            controls
                          />
                        )}
                        {editAudio && (
                          <audio
                            className="biz-profile-edit__audio-player"
                            src={editAudioPreviewUrl}
                            controls
                          />
                        )}
                        <label className="biz-profile-edit__upload-btn">
                          🎵 {bizData?.audio || editAudio ? 'Сменить музыку' : 'Добавить музыку'}
                          <input
                            ref={audioInputRef}
                            type="file"
                            accept="audio/*"
                            hidden
                            onClick={e => { e.target.value = '' }}
                            onChange={e => {
                              setEditAudio(e.target.files[0] || null)
                              setRemoveAudio(false)
                            }}
                          />
                        </label>
                        {bizData?.audio && !editAudio && !removeAudio && (
                          <button
                            className="biz-profile-edit__remove-btn"
                            onClick={() => setRemoveAudio(true)}
                          >
                            🗑 Удалить музыку
                          </button>
                        )}
                        {removeAudio && !editAudio && (
                          <button
                            className="biz-profile-edit__remove-btn"
                            onClick={() => setRemoveAudio(false)}
                          >
                            ↩ Отменить удаление
                          </button>
                        )}
                        {editAudio && (
                          <button
                            className="biz-profile-edit__remove-btn"
                            onClick={() => {
                              setEditAudio(null)
                              if (audioInputRef.current) audioInputRef.current.value = ''
                            }}
                          >
                            ✕ Убрать
                          </button>
                        )}
                        {removeAudio && !editAudio && (
                          <span className="biz-svc-hint">Музыка будет удалена после сохранения профиля</span>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* ── Social links section ── */}
                  <div className="biz-profile-edit biz-profile-edit--section">
                    <div className="biz-profile-edit__section-title">🔗 Социальные сети</div>

                    {[
                      {
                        key: 'telegram', label: 'Telegram', state: editTelegram, set: setEditTelegram, placeholder: 'https://t.me/username',
                        icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="#229ED9"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.88 13.47l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.953z"/></svg>,
                      },
                      {
                        key: 'whatsapp', label: 'WhatsApp', state: editWhatsapp, set: setEditWhatsapp, placeholder: 'https://wa.me/79001234567',
                        icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
                      },
                      {
                        key: 'instagram', label: 'Instagram', state: editInstagram, set: setEditInstagram, placeholder: 'https://instagram.com/username',
                        icon: <svg width="22" height="22" viewBox="0 0 24 24"><defs><linearGradient id="ig-dash" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#FFDC80"/><stop offset="30%" stopColor="#F77737"/><stop offset="60%" stopColor="#C13584"/><stop offset="100%" stopColor="#515BD4"/></linearGradient></defs><path fill="url(#ig-dash)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>,
                      },
                      {
                        key: 'tiktok', label: 'TikTok', state: editTiktok, set: setEditTiktok, placeholder: 'https://tiktok.com/@username',
                        icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.2 8.2 0 004.79 1.53V6.75a4.85 4.85 0 01-1.02-.06z"/></svg>,
                      },
                      {
                        key: 'facebook', label: 'Facebook', state: editFacebook, set: setEditFacebook, placeholder: 'https://facebook.com/page',
                        icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
                      },
                    ].map(({ key, label, icon, state, set, placeholder }) => (
                      <div key={key} className="biz-social-row">
                        <span className="biz-social-row__icon">{icon}</span>
                        <span className="biz-social-row__label">{label}</span>
                        <input
                          className="biz-profile-edit__input biz-social-row__input"
                          placeholder={placeholder}
                          value={state}
                          onChange={e => set(e.target.value)}
                        />
                      </div>
                    ))}

                    <div className="biz-svc-hint" style={{ marginTop: 4 }}>
                      Ссылки отображаются на странице вашего магазина.
                    </div>
                  </div>

                  {/* ── Public group section ── */}
                  <div className="biz-profile-edit biz-profile-edit--section">
                    <div className="biz-profile-edit__section-title">👥 Публичная группа</div>
                    <p className="biz-svc-hint">
                      Выберите группу, в которую пользователи смогут вступить прямо со страницы вашего магазина.
                      Отображается кнопка «Вступить в группу».
                    </p>

                    <div className="biz-profile-edit__row">
                      <label className="biz-profile-edit__label">Группа</label>
                      <select
                        className="biz-profile-edit__input"
                        value={selectedGroupId ?? ''}
                        onChange={e => setSelectedGroupId(e.target.value ? Number(e.target.value) : null)}
                      >
                        <option value="">— Не выбрана —</option>
                        {myGroups.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </div>

                    {myGroups.length === 0 && (
                      <p className="biz-svc-hint" style={{ color: '#888' }}>
                        У вас пока нет созданных групп. Создайте группу в разделе «Мессенджер».
                      </p>
                    )}

                  </div>

                  {/* ── Hashtags section ── */}
                  <div className="biz-profile-edit biz-profile-edit--section">
                    <div className="biz-profile-edit__section-title">
                      # Хэштеги
                      <span className="biz-tags-limit">
                        {tagLimit === null
                          ? `${bizTags.length} / ∞`
                          : `${bizTags.length} / ${tagLimit}`}
                        <span className={`biz-tags-plan biz-tags-plan--${(bizData?.plan_type || 'FREE').toLowerCase()}`}>
                          {bizData?.plan_type === 'VIP' ? '⭐ VIP' : bizData?.plan_type === 'PRO' ? '⚡ Pro' : 'Free'}
                        </span>
                      </span>
                    </div>

                    <p className="biz-svc-hint">
                      По хэштегам пользователи находят ваш магазин в поиске.
                      {tagLimit !== null && ` Тариф ${bizData?.plan_type} — до ${tagLimit} тегов.`}
                    </p>

                    {/* Auto-generated tags (read-only) */}
                    <div className="biz-tags-auto">
                      <span className="biz-tags-auto__label">Авто:</span>
                      <span className="biz-tag-chip biz-tag-chip--auto">#messengershop</span>
                      {bizData?.category && <span className="biz-tag-chip biz-tag-chip--auto">#{bizData.category}</span>}
                      {bizData?.city && <span className="biz-tag-chip biz-tag-chip--auto">#{bizData.city}</span>}
                      {bizData?.is_verified && <span className="biz-tag-chip biz-tag-chip--auto">#verified</span>}
                      {bizData?.plan_type === 'PRO' && <span className="biz-tag-chip biz-tag-chip--auto">#pro</span>}
                      {bizData?.plan_type === 'VIP' && <span className="biz-tag-chip biz-tag-chip--auto">#vip</span>}
                    </div>

                    {/* Current tags */}
                    {bizTags.length > 0 && (
                      <div className="biz-tags-list">
                        {bizTags.map(tag => (
                          <span key={tag} className="biz-tag-chip">
                            #{tag}
                            <button className="biz-tag-chip__remove" onClick={() => handleRemoveTag(tag)}>✕</button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Add tag input with autocomplete */}
                    {(tagLimit === null || bizTags.length < tagLimit) && (
                      <div className="biz-tags-add">
                        <div className="biz-tags-search">
                          <input
                            className="biz-profile-edit__input"
                            placeholder="Начните вводить тег для поиска..."
                            value={tagInput}
                            onChange={e => searchTags(e.target.value)}
                            autoComplete="off"
                          />
                          {tagsLoading && <span className="biz-tags-search__spinner" />}
                          {tagSuggests.length > 0 && (
                            <div className="biz-tags-dropdown">
                              {tagSuggests.map(tag => (
                                <button
                                  key={tag}
                                  className="biz-tags-dropdown__item"
                                  onMouseDown={() => handleSelectTag(tag)}
                                >
                                  #{tag}
                                </button>
                              ))}
                            </div>
                          )}
                          {tagInput.trim() && !tagsLoading && tagSuggests.length === 0 && (
                            <div className="biz-tags-dropdown">
                              <div className="biz-tags-dropdown__empty">Теги не найдены</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {tagLimit !== null && bizTags.length >= tagLimit && (
                      <p className="biz-tags-limit-warn">
                        Достигнут лимит тегов для вашего тарифа.
                        <button className="biz-tags-upgrade" onClick={() => navigate('/pricing')}>
                          Улучшить тариф →
                        </button>
                      </p>
                    )}

                    {/* Popular tags panel */}
                    {(tagLimit === null || bizTags.length < tagLimit) && (
                      <div className="biz-tags-panel">
                        <div className="biz-tags-panel__label">
                          {tagInput.trim() && tagSuggests.length > 0
                            ? `Результаты поиска:`
                            : `Популярные теги — нажмите чтобы добавить:`}
                        </div>
                        <div className="biz-tags-panel__chips">
                          {(tagInput.trim() ? tagSuggests : bizPopularTags).map(tag => {
                            const already = bizTags.includes(tag)
                            return (
                              <button
                                key={tag}
                                className={`biz-tags-panel__chip${already ? ' biz-tags-panel__chip--added' : ''}`}
                                onClick={() => !already && handleSelectTag(tag)}
                                disabled={already}
                              >
                                #{tag}
                                {already && <span className="biz-tags-panel__chip-check">✓</span>}
                              </button>
                            )
                          })}
                          {tagInput.trim() && !tagsLoading && tagSuggests.length === 0 && (
                            <span className="biz-tags-panel__empty">Теги не найдены</span>
                          )}
                        </div>
                      </div>
                    )}

                  </div>

                  {/* ── FAQ section ── */}
                  <div className="biz-profile-edit biz-profile-edit--section">
                    <div className="biz-profile-edit__section-title">❓ Часто задаваемые вопросы (FAQ)</div>

                    {/* Existing FAQ items */}
                    {bizFaq.length > 0 && (
                      <div className="biz-faq-list">
                        {bizFaq.map((item, idx) => (
                          <div key={idx} className="biz-faq-item">
                            <div className="biz-faq-item__texts">
                              <div className="biz-faq-item__q">❓ {item.question}</div>
                              <div className="biz-faq-item__a">💬 {item.answer}</div>
                            </div>
                            <button
                              className="biz-row__delete-btn"
                              onClick={() => handleRemoveFaq(idx)}
                              title="Удалить"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add new FAQ */}
                    <div className="biz-faq-add">
                      <input
                        className="biz-profile-edit__input"
                        placeholder="Вопрос..."
                        value={faqQuestion}
                        onChange={e => setFaqQuestion(e.target.value)}
                      />
                      <textarea
                        className="biz-profile-edit__textarea"
                        placeholder="Ответ..."
                        value={faqAnswer}
                        onChange={e => setFaqAnswer(e.target.value)}
                        rows={3}
                      />
                      <button
                        className="biz-faq-add__btn"
                        onClick={handleAddFaq}
                        disabled={!faqQuestion.trim() || !faqAnswer.trim()}
                      >
                        + Добавить вопрос
                      </button>
                    </div>

                  </div>

                  {/* ── Unified save (фиксированная панель снизу — всегда видна) ── */}
                  <div className="biz-save-all-bar">
                    <div className="biz-save-all-bar__inner">
                      <button
                        className="biz-save-all-btn"
                        onClick={handleSaveAll}
                        disabled={savingProfile}
                      >
                        {savingProfile
                          ? <><span className="biz-form__spinner" /> Сохранение…</>
                          : '💾 Сохранить все изменения'}
                      </button>
                      <span className="biz-svc-hint">Профиль, соцсети, группа, хэштеги, FAQ и услуги</span>
                    </div>
                  </div>

                </>
              )}
            </div>
          </>
        ) : null}
      </main>

      {/* ── Create Modals ── */}
      {showStory && bizId && (
        <CreateStoryModal
          getAccessToken={getAccessToken}
          onClose={() => setShowStory(false)}
          onSuccess={handleSuccess}
        />
      )}
      {showPost && bizId && (
        <CreatePostModal
          getAccessToken={getAccessToken}
          bizId={bizId}
          onClose={() => setShowPost(false)}
          onSuccess={handleSuccess}
        />
      )}
      {showTweet && bizId && (
        <CreateTweetModal
          getAccessToken={getAccessToken}
          bizId={bizId}
          onClose={() => setShowTweet(false)}
          onSuccess={handleSuccess}
        />
      )}
      {cropTask && (
        <CropModal
          src={cropTask.src}
          aspect={cropTask.aspect}
          onCancel={() => setCropTask(null)}
          onCrop={file => { cropTask.onCropped(file); setCropTask(null) }}
        />
      )}
      {showPhoto && bizId && (
        <CreateMediaOnlyModal
          getAccessToken={getAccessToken}
          bizId={bizId}
          onClose={() => setShowPhoto(false)}
          onSuccess={handleSuccess}
          mediaType="image"
        />
      )}
      {showVideo && bizId && (
        <CreateMediaOnlyModal
          getAccessToken={getAccessToken}
          bizId={bizId}
          onClose={() => setShowVideo(false)}
          onSuccess={handleSuccess}
          mediaType="video"
        />
      )}

      {/* ── Confirm Delete Modal ── */}
      {confirmState && (
        <ConfirmModal
          message={confirmMessage}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmState(null)}
          loading={deleteLoading}
        />
      )}

      {/* ── Media Lightbox ── */}
      {lightbox && (
        <MediaLightbox
          src={lightbox.src}
          isVideo={lightbox.isVideo}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  )
}
