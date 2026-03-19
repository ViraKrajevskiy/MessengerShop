import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiPatchMe } from '../api/profileApi'
import Header from '../components/Header'
import './MyProfilePage.css'

const BASE = 'http://127.0.0.1:8000/api'

async function fetchVerStatus(token) {
  const res = await fetch(`${BASE}/verification/my/`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 404) return null
  if (!res.ok) return null
  return res.json()
}

const VER_STATUS = {
  PENDING:  { label: 'На рассмотрении', color: '#f59e0b', icon: '⏳', bg: 'rgba(245,158,11,0.1)' },
  APPROVED: { label: 'Верифицирован',   color: '#10b981', icon: '✅', bg: 'rgba(16,185,129,0.1)' },
  REJECTED: { label: 'Отклонён',        color: '#ef4444', icon: '❌', bg: 'rgba(239,68,68,0.1)' },
}

const ROLE_LABELS = {
  USER:      { label: 'Пользователь', color: '#3b82f6' },
  BUSINESS:  { label: 'Бизнесмен',   color: '#f59e0b' },
  MODERATOR: { label: 'Модератор',    color: '#8b5cf6' },
}

export default function MyProfilePage() {
  const { user, tokens, logout } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef(null)

  // ВСЕ хуки должны быть ДО любых return
  const [editing, setEditing]             = useState(false)
  const [form, setForm]                   = useState({ username: '', city: '' })
  const [avatarFile, setAvatarFile]       = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [saving, setSaving]               = useState(false)
  const [saveError, setSaveError]         = useState('')
  const [saveOk, setSaveOk]               = useState(false)
  const [verStatus, setVerStatus]         = useState(undefined) // undefined=loading, null=нет заявки

  // Когда user загрузился — инициализируем форму
  useEffect(() => {
    if (user) setForm({ username: user.username || '', city: user.city || '' })
  }, [user])

  // Загружаем статус верификации для бизнесменов
  useEffect(() => {
    if (!tokens?.access || user?.role !== 'BUSINESS') return
    fetchVerStatus(tokens.access).then(setVerStatus)
  }, [tokens?.access, user?.role])

  // Если не залогинен — редирект (ПОСЛЕ всех хуков)
  useEffect(() => {
    if (!user) navigate('/login')
  }, [user, navigate])

  if (!user) return null

  // ── Производные значения ────────────────────────────────────────────────────
  const avatarSrc = avatarPreview
    || (user.avatar
        ? (user.avatar.startsWith('http') ? user.avatar : `http://127.0.0.1:8000${user.avatar}`)
        : `https://i.pravatar.cc/200?u=${user.email}`)

  const role = ROLE_LABELS[user.role] || { label: user.role, color: '#64748b' }

  const joinDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—'

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleAvatarClick = () => { if (editing) fileRef.current?.click() }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError('')
    try {
      const fd = new FormData()
      fd.append('username', form.username)
      fd.append('city', form.city)
      if (avatarFile) fd.append('avatar', avatarFile)
      await apiPatchMe(tokens.access, fd)
      setEditing(false)
      setAvatarFile(null)
      setAvatarPreview(null)
      setSaveOk(true)
      setTimeout(() => setSaveOk(false), 3000)
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditing(false)
    setAvatarFile(null)
    setAvatarPreview(null)
    setSaveError('')
    setForm({ username: user.username || '', city: user.city || '' })
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="my-profile-page">
      <Header />
      <main className="my-profile__main">

        <button className="my-profile__back" onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Назад
        </button>

        {saveOk && <div className="my-profile__toast">✓ Профиль обновлён</div>}

        <div className="my-profile__layout">

          {/* ── Sidebar ── */}
          <aside className="my-profile__sidebar">
            <div className="my-profile__avatar-wrap" onClick={handleAvatarClick}>
              <img src={avatarSrc} alt={user.username} className={`my-profile__avatar ${editing ? 'my-profile__avatar--editable' : ''}`} />
              {editing && (
                <div className="my-profile__avatar-overlay">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  <span>Сменить</span>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            </div>

            <div className="my-profile__role-badge" style={{ background: role.color + '22', color: role.color, border: `1.5px solid ${role.color}44` }}>
              {user.role === 'BUSINESS'  && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>}
              {user.role === 'USER'      && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
              {user.role === 'MODERATOR' && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
              {role.label}
            </div>

            <div className="my-profile__stats-grid">
              <div className="my-profile__stat"><strong>0</strong><span>публикаций</span></div>
              <div className="my-profile__stat"><strong>0</strong><span>подписчиков</span></div>
              <div className="my-profile__stat"><strong>0</strong><span>подписок</span></div>
            </div>

            <div className="my-profile__meta">
              <div className="my-profile__meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                {user.email}
              </div>
              {(editing ? form.city : user.city) && (
                <div className="my-profile__meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {editing ? form.city : user.city}
                </div>
              )}
              <div className="my-profile__meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Зарегистрирован {joinDate}
              </div>
            </div>

            <button className="my-profile__logout-btn" onClick={handleLogout}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Выйти из аккаунта
            </button>
          </aside>

          {/* ── Content ── */}
          <section className="my-profile__content">
            <div className="my-profile__content-header">
              <div>
                <h1 className="my-profile__username">@{user.username}</h1>
                <p className="my-profile__email-sub">{user.email}</p>
              </div>
              {!editing ? (
                <button className="my-profile__edit-btn" onClick={() => setEditing(true)}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Редактировать
                </button>
              ) : (
                <div className="my-profile__edit-actions">
                  <button className="my-profile__cancel-btn" onClick={handleCancel}>Отмена</button>
                  <button className="my-profile__save-btn" onClick={handleSave} disabled={saving}>
                    {saving ? <span className="my-profile__btn-spinner" /> : 'Сохранить'}
                  </button>
                </div>
              )}
            </div>

            {saveError && <div className="my-profile__save-error">{saveError}</div>}

            <div className="my-profile__card">
              <h3 className="my-profile__card-title">Основная информация</h3>
              <div className="my-profile__fields">

                <div className="my-profile__field">
                  <label className="my-profile__field-label">Имя пользователя</label>
                  {editing
                    ? <input className="my-profile__field-input" type="text" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="username" />
                    : <span className="my-profile__field-value">{user.username}</span>
                  }
                </div>

                <div className="my-profile__field">
                  <label className="my-profile__field-label">Email</label>
                  <span className="my-profile__field-value my-profile__field-value--muted">
                    {user.email}
                    <span className="my-profile__verified-badge">✓ Подтверждён</span>
                  </span>
                </div>

                <div className="my-profile__field">
                  <label className="my-profile__field-label">Город</label>
                  {editing
                    ? <input className="my-profile__field-input" type="text" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Стамбул" />
                    : <span className="my-profile__field-value">{user.city || <span style={{ color: 'var(--text-muted)' }}>Не указан</span>}</span>
                  }
                </div>

                <div className="my-profile__field">
                  <label className="my-profile__field-label">Роль</label>
                  <span className="my-profile__field-value">{role.label}</span>
                </div>

                <div className="my-profile__field">
                  <label className="my-profile__field-label">Статус</label>
                  <span className={`my-profile__status ${user.is_active ? 'my-profile__status--active' : 'my-profile__status--inactive'}`}>
                    {user.is_active ? '● Активен' : '● Не активирован'}
                  </span>
                </div>

              </div>
            </div>

            {/* ── Верификация (только для BUSINESS) ── */}
            {user.role === 'BUSINESS' && (
              <div className="my-profile__card my-profile__card--ver">
                <h3 className="my-profile__card-title">Верификация аккаунта</h3>

                {verStatus === undefined ? (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Загрузка...</p>
                ) : verStatus === null ? (
                  /* Нет заявки */
                  <div className="my-profile__ver-start">
                    <div className="my-profile__ver-icon">🛡️</div>
                    <p className="my-profile__ver-text">
                      Получите значок <strong>✓ Верифицирован</strong> — это повысит доверие клиентов.
                    </p>
                    <button className="my-profile__ver-btn" onClick={() => navigate('/verification')}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      </svg>
                      Подтвердить аккаунт
                    </button>
                  </div>
                ) : (
                  /* Заявка есть */
                  <div
                    className="my-profile__ver-status"
                    style={{ background: VER_STATUS[verStatus.status]?.bg }}
                  >
                    <span style={{ fontSize: 26 }}>{VER_STATUS[verStatus.status]?.icon}</span>
                    <div>
                      <div className="my-profile__ver-status-label" style={{ color: VER_STATUS[verStatus.status]?.color }}>
                        {VER_STATUS[verStatus.status]?.label}
                      </div>
                      {verStatus.status === 'REJECTED' && verStatus.comment && (
                        <div className="my-profile__ver-reason">Причина: {verStatus.comment}</div>
                      )}
                    </div>
                    <button className="my-profile__ver-link" onClick={() => navigate('/verification')}>
                      Открыть чат →
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="my-profile__card my-profile__card--posts">
              <h3 className="my-profile__card-title">Публикации</h3>
              <div className="my-profile__posts-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.3">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <p>Пока нет публикаций</p>
                {user.role === 'BUSINESS' && (
                  <span className="my-profile__posts-hint">Вы можете публиковать сторисы как бизнесмен</span>
                )}
              </div>
            </div>

          </section>
        </div>
      </main>
    </div>
  )
}
