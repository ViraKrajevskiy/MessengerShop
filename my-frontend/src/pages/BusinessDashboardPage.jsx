import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'
import './BusinessDashboardPage.css'

const BASE = import.meta.env.PROD
  ? 'https://api.101-school.uz/api'
  : 'http://127.0.0.1:8000/api'

// ── Stat Card ─────────────────────────────────────────────────────────────────
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

// ── Product Row ───────────────────────────────────────────────────────────────
function ProductRow({ p, rank }) {
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
      <div className={`biz-prod-row__status ${p.is_available ? '' : 'biz-prod-row__status--off'}`}>
        {p.is_available ? 'Активен' : 'Скрыт'}
      </div>
    </div>
  )
}

// ── Modal Wrapper ─────────────────────────────────────────────────────────────
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

// ── Create Story Modal ────────────────────────────────────────────────────────
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
      if (!r.ok) throw new Error((await r.json()).detail || 'Ошибка')
      onSuccess('Сторис опубликован!')
      onClose()
    } catch(e) {
      setError(e.message)
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

// ── Create Post Modal ─────────────────────────────────────────────────────────
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
      if (!r.ok) throw new Error((await r.json()).detail || 'Ошибка')
      onSuccess('Пост опубликован!')
      onClose()
    } catch(e) {
      setError(e.message)
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

// ── Create Product Modal ──────────────────────────────────────────────────────
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
      if (!r.ok) throw new Error((await r.json()).detail || 'Ошибка')
      onSuccess('Продукт добавлен!')
      onClose()
    } catch(e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Новый продукт / услуга" onClose={onClose}>
      <div className="biz-form">
        {/* Тип */}
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

        {/* Цена */}
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

        {/* Фото */}
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

        {/* Доступность */}
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

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BusinessDashboardPage() {
  const navigate = useNavigate()
  const { user, tokens } = useAuth()
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [bizId, setBizId]     = useState(null)
  const [toast, setToast]     = useState('')

  // Modals
  const [showStory,   setShowStory]   = useState(false)
  const [showPost,    setShowPost]    = useState(false)
  const [showProduct, setShowProduct] = useState(false)

  const showToast = msg => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    if (user.role !== 'BUSINESS') { navigate('/'); return }
    if (!tokens?.access) return

    // Получаем ID бизнеса
    fetch(`${BASE}/businesses/me/`, {
      headers: { Authorization: `Bearer ${tokens.access}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setBizId(data.id))
      .catch(() => {})

    fetch(`${BASE}/businesses/me/stats/`, {
      headers: { Authorization: `Bearer ${tokens.access}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setStats(data))
      .catch(() => setError('Не удалось загрузить статистику'))
      .finally(() => setLoading(false))
  }, [tokens?.access])

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
  }

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

            <div className="biz-dashboard__section">
              <div className="biz-dashboard__section-header">
                <h2>Статистика по товарам</h2>
                <div className="biz-dashboard__legend">
                  <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> Просмотры</span>
                  <span><svg width="12" height="12" viewBox="0 0 24 24" fill="#e53935"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> Лайки</span>
                  <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> Запросы</span>
                </div>
              </div>

              {stats.products.length === 0 ? (
                <div className="biz-dashboard__empty">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.3">
                    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                  </svg>
                  <p>Нет товаров. Нажмите «Продукт / Услуга» чтобы добавить.</p>
                </div>
              ) : (
                <div className="biz-prod-list">
                  <div className="biz-prod-list__head">
                    <span></span>
                    <span></span>
                    <span>Товар</span>
                    <span style={{textAlign:'right'}}>Метрики</span>
                    <span>Статус</span>
                  </div>
                  {stats.products.map((p, i) => (
                    <ProductRow key={p.id} p={p} rank={i + 1} />
                  ))}
                </div>
              )}
            </div>

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

      {/* Modals */}
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
    </div>
  )
}