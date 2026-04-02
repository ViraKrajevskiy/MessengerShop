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

  // Tab
  const [activeTab, setActiveTab] = useState('products')

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

  // ── Load stats + biz data ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user) { navigate('/login'); return }
    if (user.role !== 'BUSINESS') { navigate('/'); return }
    if (!tokens?.access) return

    fetch(`${BASE}/businesses/me/`, {
      headers: { Authorization: `Bearer ${tokens.access}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => { setBizId(data.id); setBizData(data) })
      .catch(() => {})

    fetch(`${BASE}/businesses/me/stats/`, {
      headers: { Authorization: `Bearer ${tokens.access}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setStats(data))
      .catch(() => setError('Не удалось загрузить статистику'))
      .finally(() => setLoading(false))
  }, [tokens?.access])

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
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setStats(data))
      .catch(() => {})
  }

  const handleSuccess = msg => {
    showToast(msg)
    refreshStats()
    // Invalidate loaded flags so lists reload on next tab switch
    if (msg.includes('Пост')) {
      postsLoadedRef.current = false
      setPostsLoaded(false)
      setPosts([])
    }
    if (msg.includes('Сторис')) {
      storiesLoadedRef.current = false
      setStoriesLoaded(false)
      setStories([])
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
            <h1 className="biz-dashboard__title">Панель управления</h1>
            <p className="biz-dashboard__sub">Статистика вашего бизнеса</p>
          </div>
          <button className="biz-dashboard__profile-btn" onClick={() => navigate('/me')}>
            Мой профиль →
          </button>
        </div>

        {/* Кнопки публикации */}
        <div className="biz-publish-btns">
          <button className="biz-publish-btn biz-publish-btn--story" onClick={() => setShowStory(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="16"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            Новый сторис
          </button>
          <button className="biz-publish-btn biz-publish-btn--post" onClick={() => setShowPost(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="12" y1="8" x2="12" y2="16"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            Новый пост
          </button>
          <button className="biz-publish-btn biz-publish-btn--product" onClick={() => setShowProduct(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            Продукт / Услуга
          </button>
        </div>

        {loading ? (
          <div className="biz-dashboard__loading">
            <div className="biz-dashboard__spinner" />
            <p>Загрузка статистики...</p>
          </div>
        ) : error ? (
          <div className="biz-dashboard__error">{error}</div>
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
      {showStory && (
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
