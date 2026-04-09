import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'
import {
  apiDeletePost,
  apiDeleteStory,
  apiDeleteProduct,
  apiUpdateProduct,
  apiGetBusinessStories,
} from '../api/businessApi'
import './BusinessDashboardPage.css'

const BASE = import.meta.env.PROD
  ? 'https://api.101-school.uz/api'
  : 'http://127.0.0.1:8000/api'
const API_ORIGIN = BASE.replace(/\/api$/, '')

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

const SETUP_CITIES = ['Стамбул', 'Анкара', 'Анталья', 'Измир', 'Бурса', 'Алматы', 'Ташкент', 'Другой']

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

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'только что'
  if (mins < 60) return `${mins} мин. назад`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ч. назад`
  return `${Math.floor(hours / 24)} дн. назад`
}

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

// ── Product Row ────────────────────────────────────────────────────────────────
function ProductRow({ p, rank, onDelete, onToggleStatus, togglingStatus }) {
  const isToggling = togglingStatus === p.id

  return (
    <div className="biz-prod-row">
      <div className="biz-prod-row__rank">#{rank}</div>

      <div className="biz-prod-row__img">
        {p.image
          ? <img src={p.image} alt={p.name} />
          : <div className="biz-prod-row__img-placeholder">📦</div>
        }
      </div>

      <div className="biz-prod-row__info">
        <span className="biz-prod-row__name">{p.name}</span>
        <span className="biz-prod-row__type-badge">
          {p.product_type === 'SERVICE' ? '🔧 Услуга' : '📦 Продукт'}
        </span>
        {p.price && (
          <span className="biz-prod-row__price">{p.price} {p.currency}</span>
        )}
      </div>

      <div className="biz-prod-row__metrics">
        <div className="biz-prod-row__metric" title="Просмотры">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          {p.views}
        </div>
        <div className="biz-prod-row__metric biz-prod-row__metric--like" title="Лайки">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          {p.likes}
        </div>
        <div className="biz-prod-row__metric biz-prod-row__metric--inq" title="Запросы">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          {p.inquiries}
        </div>
      </div>

      {/* ── Clickable status toggle ── */}
      <button
        className={`biz-prod-row__status-btn ${p.is_available ? 'biz-prod-row__status-btn--on' : 'biz-prod-row__status-btn--off'} ${isToggling ? 'biz-prod-row__status-btn--loading' : ''}`}
        onClick={() => onToggleStatus(p.id, p.is_available)}
        disabled={isToggling}
        title={p.is_available ? 'Нажмите чтобы скрыть' : 'Нажмите чтобы активировать'}
      >
        {isToggling ? (
          <span className="biz-row__delete-spinner" />
        ) : (
          <>
            <span className="biz-prod-row__status-dot" />
            {p.is_available ? 'Активен' : 'Скрыт'}
            <svg className="biz-prod-row__status-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </>
        )}
      </button>

      <button
        className="biz-row__delete-btn"
        onClick={() => onDelete(p.id)}
        title="Удалить продукт"
      >
        <TrashIcon />
      </button>
    </div>
  )
}

// ── Post Row ───────────────────────────────────────────────────────────────────
function PostRow({ post, onDelete, deleting }) {
  const media = post.media_display || post.media
  return (
    <div className="biz-content-row">
      <div className="biz-content-row__thumb">
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
  )
}

// ── Story Row ──────────────────────────────────────────────────────────────────
function StoryRow({ story, onDelete, deleting }) {
  const media = story.media_display || story.media
  const isVideo = story.media_type === 'VIDEO'
  return (
    <div className="biz-content-row">
      <div className="biz-content-row__thumb biz-content-row__thumb--story">
        {media
          ? isVideo
            ? <video src={media} className="biz-content-row__video-thumb" muted />
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
function CreateStoryModal({ tokens, onClose, onSuccess }) {
  const [file, setFile]       = useState(null)
  const [preview, setPreview] = useState(null)
  const [caption, setCaption] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const inputRef = useRef()

  const handleFile = e => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleSubmit = async () => {
    if (!file) { setError('Выберите файл'); return }
    setLoading(true); setError('')
    const fd = new FormData()
    fd.append('media', file)
    fd.append('media_type', file.type.startsWith('video') ? 'VIDEO' : 'IMAGE')
    fd.append('caption', caption)
    try {
      const r = await fetch(`${BASE}/stories/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokens.access}` },
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
    <Modal title="Новый сторис" onClose={onClose}>
      <div className="biz-form">
        <div className="biz-form__upload" onClick={() => inputRef.current.click()}>
          {preview
            ? file?.type.startsWith('video')
              ? <video src={preview} className="biz-form__preview" controls />
              : <img src={preview} className="biz-form__preview" alt="preview" />
            : <div className="biz-form__upload-placeholder">
                <span>📷</span>
                <p>Нажмите чтобы выбрать фото или видео</p>
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
  )
}

// ── Create Post Modal ──────────────────────────────────────────────────────────
function CreatePostModal({ tokens, bizId, onClose, onSuccess }) {
  const [file, setFile]       = useState(null)
  const [preview, setPreview] = useState(null)
  const [text, setText]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const inputRef = useRef()

  const handleFile = e => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleSubmit = async () => {
    if (!text.trim() && !file) { setError('Добавьте текст или медиафайл'); return }
    setLoading(true); setError('')
    const fd = new FormData()
    fd.append('text', text)
    if (file) {
      fd.append('media', file)
      fd.append('media_type', file.type.startsWith('video') ? 'VIDEO' : 'IMAGE')
    }
    try {
      const r = await fetch(`${BASE}/businesses/${bizId}/posts/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokens.access}` },
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
    <Modal title="Новый пост" onClose={onClose}>
      <div className="biz-form">
        <textarea
          className="biz-form__textarea"
          placeholder="Текст поста... Используйте #хэштеги"
          value={text}
          onChange={e => setText(e.target.value)}
          rows={4}
        />
        <div className="biz-form__upload biz-form__upload--sm" onClick={() => inputRef.current.click()}>
          {preview
            ? file?.type.startsWith('video')
              ? <video src={preview} className="biz-form__preview" controls />
              : <img src={preview} className="biz-form__preview" alt="preview" />
            : <div className="biz-form__upload-placeholder">
                <span>🖼</span>
                <p>Добавить фото или видео (необязательно)</p>
              </div>
          }
          <input ref={inputRef} type="file" accept="image/*,video/*" onChange={handleFile} hidden />
        </div>
        {error && <p className="biz-form__error">{error}</p>}
        <button className="biz-form__submit" onClick={handleSubmit} disabled={loading}>
          {loading ? <span className="biz-form__spinner" /> : 'Опубликовать'}
        </button>
      </div>
    </Modal>
  )
}

// ── Create Product Modal ───────────────────────────────────────────────────────
function CreateProductModal({ tokens, bizId, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: '', description: '', product_type: 'PRODUCT',
    price: '', currency: 'TRY', image_url: '', is_available: true,
  })
  const [file, setFile]       = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const inputRef = useRef()

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleFile = e => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('Введите название'); return }
    setLoading(true); setError('')
    const fd = new FormData()
    fd.append('name', form.name)
    fd.append('description', form.description)
    fd.append('product_type', form.product_type)
    fd.append('currency', form.currency)
    fd.append('is_available', form.is_available)
    if (form.price) fd.append('price', form.price)
    if (form.image_url) fd.append('image_url', form.image_url)
    if (file) fd.append('image', file)
    try {
      const r = await fetch(`${BASE}/businesses/${bizId}/products/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokens.access}` },
        body: fd,
      })
      if (!r.ok) {
        const body = await r.json().catch(() => ({}))
        setError(body.detail || 'Ошибка')
        return
      }
      onSuccess('Продукт добавлен!')
      onClose()
    } catch(e) {
      setError('Ошибка соединения')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Новый продукт / услуга" onClose={onClose}>
      <div className="biz-form">
        <div className="biz-form__type-toggle">
          <button
            className={`biz-form__type-btn ${form.product_type === 'PRODUCT' ? 'biz-form__type-btn--active' : ''}`}
            onClick={() => set('product_type', 'PRODUCT')}
          >
            📦 Продукт
          </button>
          <button
            className={`biz-form__type-btn ${form.product_type === 'SERVICE' ? 'biz-form__type-btn--active' : ''}`}
            onClick={() => set('product_type', 'SERVICE')}
          >
            🔧 Услуга
          </button>
        </div>

        <input
          className="biz-form__input"
          placeholder="Название *"
          value={form.name}
          onChange={e => set('name', e.target.value)}
        />
        <textarea
          className="biz-form__textarea"
          placeholder="Описание"
          value={form.description}
          onChange={e => set('description', e.target.value)}
          rows={3}
        />

        <div className="biz-form__row">
          <input
            className="biz-form__input"
            placeholder="Цена (необязательно)"
            type="number"
            value={form.price}
            onChange={e => set('price', e.target.value)}
          />
          <select
            className="biz-form__select"
            value={form.currency}
            onChange={e => set('currency', e.target.value)}
          >
            <option value="TRY">₺ TRY</option>
            <option value="USD">$ USD</option>
            <option value="EUR">€ EUR</option>
            <option value="RUB">₽ RUB</option>
          </select>
        </div>

        <div className="biz-form__upload biz-form__upload--sm" onClick={() => inputRef.current.click()}>
          {preview
            ? <img src={preview} className="biz-form__preview" alt="preview" />
            : <div className="biz-form__upload-placeholder">
                <span>🖼</span>
                <p>Добавить фото</p>
              </div>
          }
          <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} hidden />
        </div>

        <input
          className="biz-form__input"
          placeholder="Или вставьте ссылку на фото"
          value={form.image_url}
          onChange={e => set('image_url', e.target.value)}
        />

        <label className="biz-form__checkbox">
          <input
            type="checkbox"
            checked={form.is_available}
            onChange={e => set('is_available', e.target.checked)}
          />
          Доступен для заказа
        </label>

        {error && <p className="biz-form__error">{error}</p>}
        <button className="biz-form__submit" onClick={handleSubmit} disabled={loading}>
          {loading ? <span className="biz-form__spinner" /> : 'Добавить'}
        </button>
      </div>
    </Modal>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function BusinessDashboardPage() {
  const navigate = useNavigate()
  const { user, tokens, getAccessToken } = useAuth()

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
  const [activeTab, setActiveTab] = useState('products')

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

  // Status toggle
  const [togglingStatus, setTogglingStatus] = useState(null) // product id being toggled

  // Profile edit
  const [editDesc,    setEditDesc]    = useState('')
  const [editPhone,   setEditPhone]   = useState('')
  const [editWebsite, setEditWebsite] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [editCity,    setEditCity]    = useState('')
  const [editLogo,    setEditLogo]    = useState(null)
  const [editCover,   setEditCover]   = useState(null)
  const [editAudio,   setEditAudio]   = useState(null)
  const [removeAudio, setRemoveAudio] = useState(false)
  const audioInputRef = useRef(null)
  const [savingProfile, setSavingProfile] = useState(false)

  // Hashtags
  const [bizTags,      setBizTags]      = useState([])
  const [tagInput,     setTagInput]     = useState('')
  const [tagSuggests,  setTagSuggests]  = useState([])
  const [tagsLoading,  setTagsLoading]  = useState(false)
  const [savingTags,   setSavingTags]   = useState(false)

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

  // FAQ edit
  const [bizFaq,      setBizFaq]      = useState([])
  const [faqQuestion, setFaqQuestion] = useState('')
  const [faqAnswer,   setFaqAnswer]   = useState('')
  const [savingFaq,   setSavingFaq]   = useState(false)

  // Modals
  const [showStory,   setShowStory]   = useState(false)
  const [showPost,    setShowPost]    = useState(false)
  const [showProduct, setShowProduct] = useState(false)

  // ── Filters: Products ──────────────────────────────────────────────────────
  const [prodSearch, setProdSearch]   = useState('')
  const [prodType,   setProdType]     = useState('all')   // all | PRODUCT | SERVICE
  const [prodStatus, setProdStatus]   = useState('all')   // all | active | hidden
  const [prodSort,   setProdSort]     = useState('default') // default | views | likes | inquiries | price_asc | price_desc

  // ── Filters: Posts ─────────────────────────────────────────────────────────
  const [postSearch, setPostSearch]   = useState('')
  const [postMedia,  setPostMedia]    = useState('all')   // all | with | without
  const [postSort,   setPostSort]     = useState('newest') // newest | oldest

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
  }, [bizData])

  // ── Save profile handler ───────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    setSavingProfile(true)
    try {
      const token = await getAccessToken()
      const fd = new FormData()
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
      if (editLogo)  fd.append('logo',  editLogo)
      if (editCover) fd.append('cover', editCover)
      if (editAudio) fd.append('audio', editAudio)
      if (removeAudio && !editAudio) fd.append('remove_audio', 'true')
      const res = await fetch(`${BASE}/businesses/me/`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setBizData(updated)
      setEditLogo(null)
      setEditCover(null)
      setEditAudio(null)
      setRemoveAudio(false)
      if (audioInputRef.current) audioInputRef.current.value = ''
      showToast('✅ Профиль сохранён!')
    } catch {
      showToast('❌ Ошибка при сохранении')
    } finally {
      setSavingProfile(false)
    }
  }

  // ── FAQ handlers ──────────────────────────────────────────────────────────
  const handleAddFaq = () => {
    if (!faqQuestion.trim() || !faqAnswer.trim()) return
    setBizFaq(prev => [...prev, { question: faqQuestion.trim(), answer: faqAnswer.trim() }])
    setFaqQuestion('')
    setFaqAnswer('')
  }

  const handleRemoveFaq = (idx) => {
    setBizFaq(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSaveFaq = async () => {
    setSavingFaq(true)
    try {
      const token = await getAccessToken()
      const res = await fetch(`${BASE}/businesses/me/`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ faq: bizFaq }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setBizData(updated)
      showToast('✅ FAQ сохранён!')
    } catch {
      showToast('❌ Ошибка при сохранении FAQ')
    } finally {
      setSavingFaq(false)
    }
  }

  // ── Hashtag handlers ──────────────────────────────────────────────────────
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
    setBizTags(prev => [...prev, tag])
    setTagInput('')
    setTagSuggests([])
  }

  const handleRemoveTag = (tag) => setBizTags(prev => prev.filter(t => t !== tag))

  const handleSaveTags = async () => {
    setSavingTags(true)
    try {
      const token = await getAccessToken()
      const res = await fetch(`${BASE}/businesses/me/`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: bizTags }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setBizData(updated)
      showToast('✅ Хэштеги сохранены!')
    } catch {
      showToast('❌ Ошибка при сохранении хэштегов')
    } finally {
      setSavingTags(false)
    }
  }

  // ── Filtered + sorted lists ────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    let list = [...(stats?.products || [])]
    if (prodSearch.trim())    list = list.filter(p => p.name?.toLowerCase().includes(prodSearch.toLowerCase()))
    if (prodType !== 'all')   list = list.filter(p => p.product_type === prodType)
    if (prodStatus === 'active') list = list.filter(p => p.is_available)
    if (prodStatus === 'hidden') list = list.filter(p => !p.is_available)
    if (prodSort === 'views')       list.sort((a, b) => (b.views  || 0) - (a.views  || 0))
    if (prodSort === 'likes')       list.sort((a, b) => (b.likes  || 0) - (a.likes  || 0))
    if (prodSort === 'inquiries')   list.sort((a, b) => (b.inquiries || 0) - (a.inquiries || 0))
    if (prodSort === 'price_asc')   list.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0))
    if (prodSort === 'price_desc')  list.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0))
    return list
  }, [stats?.products, prodSearch, prodType, prodStatus, prodSort])

  const filteredPosts = useMemo(() => {
    let list = [...posts]
    if (postSearch.trim()) list = list.filter(p => p.text?.toLowerCase().includes(postSearch.toLowerCase()))
    if (postMedia === 'with')    list = list.filter(p => p.media_display || p.media)
    if (postMedia === 'without') list = list.filter(p => !p.media_display && !p.media)
    if (postSort === 'oldest') list.reverse()
    return list
  }, [posts, postSearch, postMedia, postSort])

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
    if (!tokens?.access) return

    setLoading(true)
    setError('')
    setProfileChecked(false)

    fetch(`${BASE}/businesses/me/`, {
      headers: { Authorization: `Bearer ${tokens.access}` },
    })
      .then(async (r) => {
        if (r.status === 404) {
          setBizId(null)
          setBizData(null)
          setStats(null)
          setVerStatus(null)
          setSetupCity(user?.city || '')
          setProfileChecked(true)
          setLoading(false)
          return { missing: true }
        }
        if (!r.ok) throw new Error('me')
        const data = await r.json()
        setBizId(data.id)
        setBizData(data)
        setBizServices(Array.isArray(data.services) ? data.services : [])
        setProfileChecked(true)
        return { missing: false }
      })
      .then(async (result) => {
        if (!result || result.missing) return

        const headers = { Authorization: `Bearer ${tokens.access}` }
        const [statsRes, verRes] = await Promise.all([
          fetch(`${BASE}/businesses/me/stats/`, { headers }),
          fetch(`${BASE}/verification/my/`, { headers }),
        ])

        if (statsRes.status === 404) setStats(null)
        else if (statsRes.ok) setStats(await statsRes.json())
        else throw new Error('stats')

        if (verRes.ok) setVerStatus(getVerificationStatus(await verRes.json()))
        else setVerStatus(null)
      })
      .catch(() => {
        setError('Не удалось загрузить данные')
        setBizId(null)
        setBizData(null)
        setStats(null)
        setVerStatus(null)
        setProfileChecked(true)
      })
      .finally(() => setLoading(false))
  }, [user, tokens?.access, navigate])

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
          total_products: 0,
          unread_inquiries: 0,
          active_stories: 0,
          rating: String(body.rating ?? '0.0'),
          is_verified: body.is_verified ?? false,
          products: [],
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
      const data = await apiGetBusinessStories(id, token)
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
  }, [getAccessToken])

  // ── Single effect: fires when tab or bizId changes ─────────────────────────
  useEffect(() => {
    if (!bizId) return
    if (activeTab === 'posts')    void loadPosts(bizId)
    if (activeTab === 'stories')  void loadStories(bizId)
  }, [activeTab, bizId])            // loadPosts/loadStories stable — no loop

  // ── Refresh stats after create ─────────────────────────────────────────────
  const refreshStats = () => {
    if (!tokens?.access) return
    fetch(`${BASE}/businesses/me/stats/`, {
      headers: { Authorization: `Bearer ${tokens.access}` },
    })
      .then(async (r) => {
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
    if (msg.includes('Пост')) {
      postsLoadedRef.current = false
      setPostsLoaded(false)
      setPosts([])
      if (activeTab === 'posts' && bizId) void loadPosts(bizId)
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
        showToast('Пост удалён')
        refreshStats()
      } else if (type === 'story') {
        await apiDeleteStory(id, token)
        setStories(prev => prev.filter(s => s.id !== id))
        showToast('История удалена')
        refreshStats()
      } else if (type === 'product') {
        await apiDeleteProduct(bizId, id, token)
        setStats(prev => prev
          ? { ...prev, products: prev.products.filter(p => p.id !== id), total_products: prev.total_products - 1 }
          : prev
        )
        showToast('Продукт удалён')
      }
    } catch (e) {
      showToast(e.message || 'Ошибка удаления')
    } finally {
      setDeleteLoading(false)
      setConfirmState(null)
    }
  }

  // ── Toggle product status ──────────────────────────────────────────────────
  const handleToggleStatus = async (productId, currentStatus) => {
    if (togglingStatus === productId) return
    setTogglingStatus(productId)
    try {
      const token = await getAccessToken()
      await apiUpdateProduct(bizId, productId, { is_available: !currentStatus }, token)
      // Optimistic update in stats.products
      setStats(prev => prev ? {
        ...prev,
        products: prev.products.map(p =>
          p.id === productId ? { ...p, is_available: !currentStatus } : p
        ),
      } : prev)
      showToast(!currentStatus ? 'Продукт активирован' : 'Продукт скрыт')
    } catch (e) {
      showToast(e.message || 'Ошибка изменения статуса')
    } finally {
      setTogglingStatus(null)
    }
  }

  // ── Services management ────────────────────────────────────────────────────
  const handleAddService = () => {
    if (!svcName.trim()) return
    setBizServices(prev => [...prev, { name: svcName.trim(), price: svcPrice.trim(), currency: svcCurrency }])
    setSvcName(''); setSvcPrice('')
  }

  const handleRemoveService = (idx) => {
    setBizServices(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSaveServices = async () => {
    if (!tokens?.access) return
    setSavingServices(true)
    try {
      const res = await fetch(`${BASE}/businesses/me/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens.access}` },
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
        : `Удалить продукт${confirmState.label ? ` "${confirmState.label}"` : ''}? Это действие нельзя отменить.`
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
            <h1 className="biz-dashboard__title">
              {needsStoreSetup ? 'Создайте страницу магазина' : 'Панель управления'}
            </h1>
            <p className="biz-dashboard__sub">
              {needsStoreSetup
                ? 'Без профиля магазина нельзя публиковать сторис, посты и товары'
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
            className="biz-publish-btn biz-publish-btn--product"
            onClick={() => setShowProduct(true)}
            disabled={!bizId}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            Продукт / Услуга
          </button>
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
          <form className="biz-store-setup" onSubmit={handleCreateStore}>
            <p className="biz-store-setup__lead">
              Заполните основные данные — после сохранения откроются сторис, посты и каталог.
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
                  {SETUP_CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="biz-store-setup__field">
                <span>Телефон</span>
                <input
                  type="tel"
                  value={setupPhone}
                  onChange={(e) => setSetupPhone(e.target.value)}
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
              {setupSubmitting ? <span className="biz-form__spinner" /> : 'Создать магазин и продолжить'}
            </button>
          </form>
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
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>}
                value={stats.total_products}
                label="Товаров"
                color="#f59e0b"
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
                  className={`biz-content-tab ${activeTab === 'products' ? 'biz-content-tab--active' : ''}`}
                  onClick={() => setActiveTab('products')}
                >
                  📦 Товары
                  <span className="biz-content-tab__count">{stats.products?.length || 0}</span>
                </button>
                <button
                  className={`biz-content-tab ${activeTab === 'posts' ? 'biz-content-tab--active' : ''}`}
                  onClick={() => setActiveTab('posts')}
                >
                  📝 Посты
                  {postsLoaded && <span className="biz-content-tab__count">{posts.length}</span>}
                </button>
                <button
                  className={`biz-content-tab ${activeTab === 'stories' ? 'biz-content-tab--active' : ''}`}
                  onClick={() => setActiveTab('stories')}
                >
                  🎬 Истории
                  {storiesLoaded && <span className="biz-content-tab__count">{stories.length}</span>}
                </button>
                <button
                  className={`biz-content-tab ${activeTab === 'services' ? 'biz-content-tab--active' : ''}`}
                  onClick={() => setActiveTab('services')}
                >
                  🔧 Услуги
                  <span className="biz-content-tab__count">{bizServices.length}</span>
                </button>
                <button
                  className={`biz-content-tab ${activeTab === 'profile' ? 'biz-content-tab--active' : ''}`}
                  onClick={() => setActiveTab('profile')}
                >
                  ✏️ Профиль
                </button>
              </div>

              {/* ── Products tab ── */}
              {activeTab === 'products' && (
                <>
                  <div className="biz-dashboard__section-header">
                    <h2>Товары и услуги</h2>
                    <button className="biz-dashboard__add-btn" onClick={() => setShowProduct(true)}>
                      + Добавить
                    </button>
                  </div>

                  {/* Product filters */}
                  <div className="biz-filter-bar">
                    <div className="biz-filter-bar__search">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                      <input
                        type="text"
                        className="biz-filter-bar__input"
                        placeholder="Поиск по названию..."
                        value={prodSearch}
                        onChange={e => setProdSearch(e.target.value)}
                      />
                      {prodSearch && (
                        <button className="biz-filter-bar__clear" onClick={() => setProdSearch('')}>✕</button>
                      )}
                    </div>
                    <div className="biz-filter-bar__chips">
                      {[['all','Все'],['PRODUCT','Продукты'],['SERVICE','Услуги']].map(([v, l]) => (
                        <button key={v}
                          className={`biz-filter-chip ${prodType === v ? 'biz-filter-chip--active' : ''}`}
                          onClick={() => setProdType(v)}
                        >{l}</button>
                      ))}
                    </div>
                    <div className="biz-filter-bar__chips">
                      {[['all','Все'],['active','Активные'],['hidden','Скрытые']].map(([v, l]) => (
                        <button key={v}
                          className={`biz-filter-chip ${prodStatus === v ? 'biz-filter-chip--active biz-filter-chip--status' : ''}`}
                          onClick={() => setProdStatus(v)}
                        >{l}</button>
                      ))}
                    </div>
                    <select className="biz-filter-bar__select" value={prodSort} onChange={e => setProdSort(e.target.value)}>
                      <option value="default">По умолчанию</option>
                      <option value="views">По просмотрам</option>
                      <option value="likes">По лайкам</option>
                      <option value="inquiries">По запросам</option>
                      <option value="price_asc">Цена ↑</option>
                      <option value="price_desc">Цена ↓</option>
                    </select>
                  </div>

                  {/* Result count */}
                  {(prodSearch || prodType !== 'all' || prodStatus !== 'all') && (
                    <div className="biz-filter-bar__result">
                      Найдено: <strong>{filteredProducts.length}</strong> из {stats.products.length}
                      <button className="biz-filter-bar__reset" onClick={() => { setProdSearch(''); setProdType('all'); setProdStatus('all'); setProdSort('default') }}>
                        Сбросить
                      </button>
                    </div>
                  )}

                  {stats.products.length === 0 ? (
                    <div className="biz-dashboard__empty">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.3">
                        <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                      </svg>
                      <p>Нет товаров. Нажмите «Добавить» чтобы создать.</p>
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="biz-dashboard__empty">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                      <p>Ничего не найдено. Попробуйте изменить фильтры.</p>
                    </div>
                  ) : (
                    <div className="biz-prod-list">
                      <div className="biz-prod-list__head">
                        <span></span>
                        <span></span>
                        <span>Товар</span>
                        <span style={{textAlign:'right'}}>Метрики</span>
                        <span>Статус</span>
                        <span></span>
                      </div>
                      {filteredProducts.map((p, i) => (
                        <ProductRow
                          key={p.id}
                          p={p}
                          rank={i + 1}
                          onDelete={id => requestDelete('product', id, p.name)}
                          onToggleStatus={handleToggleStatus}
                          togglingStatus={togglingStatus}
                        />
                      ))}
                    </div>
                  )}
                </>
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
                  <div className="biz-filter-bar">
                    <div className="biz-filter-bar__search">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                      <input
                        type="text"
                        className="biz-filter-bar__input"
                        placeholder="Поиск по тексту..."
                        value={postSearch}
                        onChange={e => setPostSearch(e.target.value)}
                      />
                      {postSearch && (
                        <button className="biz-filter-bar__clear" onClick={() => setPostSearch('')}>✕</button>
                      )}
                    </div>
                    <div className="biz-filter-bar__chips">
                      {[['all','Все'],['with','С медиа'],['without','Только текст']].map(([v, l]) => (
                        <button key={v}
                          className={`biz-filter-chip ${postMedia === v ? 'biz-filter-chip--active' : ''}`}
                          onClick={() => setPostMedia(v)}
                        >{l}</button>
                      ))}
                    </div>
                    <select className="biz-filter-bar__select" value={postSort} onChange={e => setPostSort(e.target.value)}>
                      <option value="newest">Сначала новые</option>
                      <option value="oldest">Сначала старые</option>
                    </select>
                  </div>

                  {(postSearch || postMedia !== 'all') && (
                    <div className="biz-filter-bar__result">
                      Найдено: <strong>{filteredPosts.length}</strong> из {posts.length}
                      <button className="biz-filter-bar__reset" onClick={() => { setPostSearch(''); setPostMedia('all'); setPostSort('newest') }}>
                        Сбросить
                      </button>
                    </div>
                  )}

                  {postsLoading ? (
                    <div className="biz-content-loading"><div className="biz-dashboard__spinner" /></div>
                  ) : posts.length === 0 ? (
                    <div className="biz-dashboard__empty">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.3">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/>
                      </svg>
                      <p>Нет постов. Нажмите «Новый пост» чтобы опубликовать.</p>
                    </div>
                  ) : filteredPosts.length === 0 ? (
                    <div className="biz-dashboard__empty">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                      <p>Ничего не найдено. Попробуйте изменить фильтры.</p>
                    </div>
                  ) : (
                    <div className="biz-content-list">
                      {filteredPosts.map(post => (
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
              {/* ── Services tab ── */}
              {activeTab === 'services' && (
                <>
                  <div className="biz-dashboard__section-header">
                    <h2>Услуги</h2>
                  </div>

                  {/* Add service form */}
                  <div className="biz-svc-form">
                    <input
                      className="biz-svc-form__input biz-svc-form__input--name"
                      placeholder="Название услуги *"
                      value={svcName}
                      onChange={e => setSvcName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddService()}
                    />
                    <input
                      className="biz-svc-form__input biz-svc-form__input--price"
                      placeholder="Цена"
                      type="number"
                      min="0"
                      value={svcPrice}
                      onChange={e => setSvcPrice(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddService()}
                    />
                    <select
                      className="biz-svc-form__select"
                      value={svcCurrency}
                      onChange={e => setSvcCurrency(e.target.value)}
                    >
                      <option value="TRY">₺ TRY</option>
                      <option value="USD">$ USD</option>
                      <option value="EUR">€ EUR</option>
                      <option value="RUB">₽ RUB</option>
                    </select>
                    <button className="biz-svc-form__add" onClick={handleAddService} disabled={!svcName.trim()}>
                      + Добавить
                    </button>
                  </div>

                  {/* Services list */}
                  {bizServices.length === 0 ? (
                    <div className="biz-dashboard__empty">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.3">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                      </svg>
                      <p>Нет услуг. Добавьте первую услугу выше.</p>
                    </div>
                  ) : (
                    <div className="biz-svc-list">
                      {bizServices.map((svc, idx) => (
                        <div key={idx} className="biz-svc-row">
                          <div className="biz-svc-row__icon">🔧</div>
                          <div className="biz-svc-row__name">{svc.name}</div>
                          {svc.price && (
                            <div className="biz-svc-row__price">
                              {Number(svc.price).toLocaleString()} {svc.currency === 'TRY' ? '₺' : svc.currency === 'USD' ? '$' : svc.currency === 'EUR' ? '€' : '₽'}
                            </div>
                          )}
                          <button className="biz-row__delete-btn" onClick={() => handleRemoveService(idx)} title="Удалить">
                            <TrashIcon />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Save button */}
                  <div className="biz-svc-save-row">
                    <button className="biz-svc-save-btn" onClick={handleSaveServices} disabled={savingServices}>
                      {savingServices ? <span className="biz-form__spinner" /> : '💾 Сохранить услуги'}
                    </button>
                    <span className="biz-svc-hint">Услуги отображаются на странице вашего магазина</span>
                  </div>
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
                        {(editLogo
                          ? <img src={URL.createObjectURL(editLogo)} className="biz-profile-edit__avatar-preview" alt="preview" />
                          : bizData?.logo
                            ? <img src={bizData.logo.startsWith('http') ? bizData.logo : `https://api.101-school.uz${bizData.logo}`} className="biz-profile-edit__avatar-preview" alt="logo" />
                            : <div className="biz-profile-edit__avatar-placeholder">{bizData?.brand_name?.[0] || '?'}</div>
                        )}
                        <label className="biz-profile-edit__upload-btn">
                          📷 Сменить фото
                          <input type="file" accept="image/*" hidden onChange={e => setEditLogo(e.target.files[0] || null)} />
                        </label>
                      </div>
                    </div>

                    {/* Cover */}
                    <div className="biz-profile-edit__row">
                      <label className="biz-profile-edit__label">Обложка</label>
                      <div className="biz-profile-edit__cover-wrap">
                        {editCover
                          ? <img src={URL.createObjectURL(editCover)} className="biz-profile-edit__cover-preview" alt="cover preview" />
                          : bizData?.cover
                            ? <img src={bizData.cover.startsWith('http') ? bizData.cover : `https://api.101-school.uz${bizData.cover}`} className="biz-profile-edit__cover-preview" alt="cover" />
                            : <div className="biz-profile-edit__cover-placeholder">Нет обложки</div>
                        }
                        <label className="biz-profile-edit__upload-btn">
                          🖼️ Сменить обложку
                          <input type="file" accept="image/*" hidden onChange={e => setEditCover(e.target.files[0] || null)} />
                        </label>
                      </div>
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
                      <input
                        className="biz-profile-edit__input"
                        placeholder="Например: Стамбул"
                        value={editCity}
                        onChange={e => setEditCity(e.target.value)}
                      />
                    </div>

                    {/* Phone */}
                    <div className="biz-profile-edit__row">
                      <label className="biz-profile-edit__label">Телефон</label>
                      <input
                        className="biz-profile-edit__input"
                        placeholder="+90 555 000 00 00"
                        value={editPhone}
                        onChange={e => setEditPhone(e.target.value)}
                      />
                    </div>

                    {/* Website */}
                    <div className="biz-profile-edit__row">
                      <label className="biz-profile-edit__label">Сайт</label>
                      <input
                        className="biz-profile-edit__input"
                        placeholder="https://example.com"
                        value={editWebsite}
                        onChange={e => setEditWebsite(e.target.value)}
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

                    <div className="biz-svc-save-row">
                      <button
                        className="biz-svc-save-btn"
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                      >
                        {savingProfile ? <span className="biz-form__spinner" /> : '💾 Сохранить профиль'}
                      </button>
                      <span className="biz-svc-hint">Изменения отобразятся на странице вашего магазина</span>
                    </div>
                  </div>

                  {/* ── Social links section ── */}
                  <div className="biz-profile-edit biz-profile-edit--section">
                    <div className="biz-profile-edit__section-title">🔗 Социальные сети</div>

                    {[
                      { key: 'telegram',  label: 'Telegram',  icon: '✈️',  state: editTelegram,  set: setEditTelegram,  placeholder: 'https://t.me/username' },
                      { key: 'whatsapp',  label: 'WhatsApp',  icon: '📱',  state: editWhatsapp,  set: setEditWhatsapp,  placeholder: 'https://wa.me/79001234567' },
                      { key: 'instagram', label: 'Instagram', icon: '📸',  state: editInstagram, set: setEditInstagram, placeholder: 'https://instagram.com/username' },
                      { key: 'youtube',   label: 'YouTube',   icon: '▶️',  state: editYoutube,   set: setEditYoutube,   placeholder: 'https://youtube.com/@channel' },
                      { key: 'tiktok',    label: 'TikTok',    icon: '🎵',  state: editTiktok,    set: setEditTiktok,    placeholder: 'https://tiktok.com/@username' },
                      { key: 'facebook',  label: 'Facebook',  icon: '📘',  state: editFacebook,  set: setEditFacebook,  placeholder: 'https://facebook.com/page' },
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
                      Ссылки отображаются на странице вашего магазина. Сохраните через кнопку «💾 Сохранить профиль» выше.
                    </div>
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

                    <div className="biz-svc-save-row">
                      <button className="biz-svc-save-btn" onClick={handleSaveTags} disabled={savingTags}>
                        {savingTags ? <span className="biz-form__spinner" /> : '💾 Сохранить хэштеги'}
                      </button>
                    </div>
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

                    <div className="biz-svc-save-row">
                      <button className="biz-svc-save-btn" onClick={handleSaveFaq} disabled={savingFaq}>
                        {savingFaq ? <span className="biz-form__spinner" /> : '💾 Сохранить FAQ'}
                      </button>
                      <span className="biz-svc-hint">FAQ отображается на странице вашего магазина</span>
                    </div>
                  </div>

                  {/* ── Services section ── */}
                  <div className="biz-profile-edit biz-profile-edit--section">
                    <div className="biz-profile-edit__section-title">🔧 Услуги</div>

                    {/* Add service form */}
                    <div className="biz-svc-form">
                      <input
                        className="biz-svc-form__input biz-svc-form__input--name"
                        placeholder="Название услуги *"
                        value={svcName}
                        onChange={e => setSvcName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddService()}
                      />
                      <input
                        className="biz-svc-form__input biz-svc-form__input--price"
                        placeholder="Цена"
                        type="number"
                        min="0"
                        value={svcPrice}
                        onChange={e => setSvcPrice(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddService()}
                      />
                      <select
                        className="biz-svc-form__select"
                        value={svcCurrency}
                        onChange={e => setSvcCurrency(e.target.value)}
                      >
                        <option value="TRY">₺ TRY</option>
                        <option value="USD">$ USD</option>
                        <option value="EUR">€ EUR</option>
                        <option value="RUB">₽ RUB</option>
                      </select>
                      <button className="biz-svc-form__add" onClick={handleAddService} disabled={!svcName.trim()}>
                        + Добавить
                      </button>
                    </div>

                    {/* Services list */}
                    {bizServices.length === 0 ? (
                      <div className="biz-dashboard__empty">
                        <p>Нет услуг. Добавьте первую услугу выше.</p>
                      </div>
                    ) : (
                      <div className="biz-svc-list">
                        {bizServices.map((svc, idx) => (
                          <div key={idx} className="biz-svc-row">
                            <div className="biz-svc-row__icon">🔧</div>
                            <div className="biz-svc-row__name">{svc.name}</div>
                            {svc.price && (
                              <div className="biz-svc-row__price">
                                {Number(svc.price).toLocaleString()} {svc.currency === 'TRY' ? '₺' : svc.currency === 'USD' ? '$' : svc.currency === 'EUR' ? '€' : '₽'}
                              </div>
                            )}
                            <button className="biz-row__delete-btn" onClick={() => handleRemoveService(idx)} title="Удалить">
                              <TrashIcon />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="biz-svc-save-row">
                      <button className="biz-svc-save-btn" onClick={handleSaveServices} disabled={savingServices}>
                        {savingServices ? <span className="biz-form__spinner" /> : '💾 Сохранить услуги'}
                      </button>
                      <span className="biz-svc-hint">Услуги отображаются на странице вашего магазина</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ── Action Buttons ── */}
            <div className="biz-dashboard__actions">
              <button className="biz-dashboard__action-btn" onClick={() => navigate('/messenger')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
                Сообщения
                {stats.unread_inquiries > 0 && (
                  <span className="biz-dashboard__action-badge">{stats.unread_inquiries}</span>
                )}
              </button>
              <button className="biz-dashboard__action-btn" onClick={() => navigate('/verification')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Верификация
              </button>
              <button className="biz-dashboard__action-btn" onClick={() => navigate('/me')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                Профиль
              </button>
            </div>
          </>
        ) : null}
      </main>

      {/* ── Create Modals ── */}
      {showStory && bizId && (
        <CreateStoryModal
          tokens={tokens}
          onClose={() => setShowStory(false)}
          onSuccess={handleSuccess}
        />
      )}
      {showPost && bizId && (
        <CreatePostModal
          tokens={tokens}
          bizId={bizId}
          onClose={() => setShowPost(false)}
          onSuccess={handleSuccess}
        />
      )}
      {showProduct && bizId && (
        <CreateProductModal
          tokens={tokens}
          bizId={bizId}
          onClose={() => setShowProduct(false)}
          onSuccess={handleSuccess}
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
    </div>
  )
}
