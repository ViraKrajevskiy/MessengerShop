import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { apiPatchMe } from '../api/profileApi'
import Header from '../components/Header'
import { DEFAULT_AVATAR } from '../utils/defaults'
import { resolveUrl } from '../utils/urlUtils'
import { API_URL as BASE } from '../config/api'
import './MyProfilePage.css'

async function fetchVerStatus(token) {
  const res = await fetch(`${BASE}/verification/my/`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 404) return null
  if (!res.ok) return null
  const data = await res.json()
  return data?.exists === false ? null : data
}

export default function MyProfilePage() {
  const { user, setUser, tokens, logout, getAccessToken } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const fileRef = useRef(null)

  const VER_STATUS = {
    PENDING:  { label: t('verif_status_pending'),  color: '#f59e0b', icon: '⏳', bg: 'rgba(245,158,11,0.1)' },
    APPROVED: { label: t('verif_status_approved'), color: '#10b981', icon: '✅', bg: 'rgba(16,185,129,0.1)' },
    REJECTED: { label: t('verif_status_rejected'), color: '#ef4444', icon: '❌', bg: 'rgba(239,68,68,0.1)' },
  }

  const ROLE_LABELS = {
    USER:      { label: t('role_user'),      color: '#3b82f6' },
    BUSINESS:  { label: t('role_business'),  color: '#f59e0b' },
    MODERATOR: { label: t('role_moderator'), color: '#8b5cf6' },
  }

  const [editing, setEditing]             = useState(false)
  const [form, setForm]                   = useState({ username: '' })
  const [avatarFile, setAvatarFile]       = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [saving, setSaving]               = useState(false)
  const [saveError, setSaveError]         = useState('')
  const [saveOk, setSaveOk]               = useState(false)
  const [verStatus, setVerStatus]         = useState(undefined)

  useEffect(() => {
    if (user) setForm({ username: user.username || '' })
  }, [user])

  useEffect(() => {
    if (user?.role !== 'BUSINESS') return
    let cancelled = false
    ;(async () => {
      const token = await getAccessToken()
      if (!token || cancelled) {
        if (!cancelled) setVerStatus(null)
        return
      }
      const status = await fetchVerStatus(token)
      if (!cancelled) setVerStatus(status)
    })()
    return () => { cancelled = true }
  }, [user?.role, getAccessToken])

  useEffect(() => {
    if (!user) navigate('/login')
  }, [user, navigate])

  if (!user) return null

  const avatarSrc = avatarPreview
    || (user.avatar ? resolveUrl(user.avatar) : DEFAULT_AVATAR)

  const role = ROLE_LABELS[user.role] || { label: user.role, color: '#64748b' }

  const joinDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' })
    : '—'

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
      const token = await getAccessToken()
      if (!token) throw new Error('Сессия истекла')
      const fd = new FormData()
      fd.append('username', form.username)
      if (avatarFile) fd.append('avatar', avatarFile)
      const updatedUser = await apiPatchMe(token, fd)
      if (updatedUser) setUser(updatedUser)
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
    setForm({ username: user.username || '' })
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="mpp">
      <Header />

      {saveOk && <div className="mpp__toast">✓ {t('success')}</div>}

      <main className="mpp__main">

        {/* Hero card */}
        <div className="mpp__hero">
          <div className="mpp__hero-left">
            <div className="mpp__avatar-wrap" onClick={handleAvatarClick}>
              <img
                src={avatarSrc}
                alt={user.username}
                className={`mpp__avatar${editing ? ' mpp__avatar--edit' : ''}`}
              />
              {editing && (
                <div className="mpp__avatar-overlay">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            </div>

            <div className="mpp__hero-info">
              <div className="mpp__hero-name-row">
                <h1 className="mpp__username">@{user.username}</h1>
                <span className="mpp__role-badge" style={{ background: role.color + '20', color: role.color, border: `1.5px solid ${role.color}40` }}>
                  {user.role === 'BUSINESS'  && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>}
                  {user.role === 'USER'      && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                  {user.role === 'MODERATOR' && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
                  {role.label}
                </span>
              </div>

              <div className="mpp__hero-meta">
                <span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  {user.email}
                </span>
                <span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {joinDate}
                </span>
              </div>

              <div className="mpp__stats">
                <div className="mpp__stat">
                  <strong>{user.subscribers_count ?? 0}</strong>
                  <span>{t('myprofile_subscribers')}</span>
                </div>
                <div className="mpp__stat-divider" />
                <div className="mpp__stat">
                  <strong>{user.subscriptions_count ?? 0}</strong>
                  <span>{t('myprofile_subscriptions')}</span>
                </div>
                <div className="mpp__stat-divider" />
                <div className="mpp__stat">
                  <strong>{user.views_count ?? 0}</strong>
                  <span>{t('views')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mpp__hero-actions">
            {!editing ? (
              <button className="mpp__edit-btn" onClick={() => setEditing(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                {t('myprofile_edit')}
              </button>
            ) : (
              <div className="mpp__save-actions">
                <button className="mpp__cancel-btn" onClick={handleCancel}>{t('myprofile_cancel')}</button>
                <button className="mpp__save-btn" onClick={handleSave} disabled={saving}>
                  {saving ? <span className="mpp__spinner" /> : t('myprofile_save')}
                </button>
              </div>
            )}
          </div>
        </div>

        {saveError && <div className="mpp__save-error">{saveError}</div>}

        <div className="mpp__cards">

          {/* Personal info */}
          <div className="mpp__card">
            <h3 className="mpp__card-title">{t('myprofile_title')}</h3>
            <div className="mpp__fields">

              <div className="mpp__field">
                <label className="mpp__field-label">{t('myprofile_username')}</label>
                {editing
                  ? <input className="mpp__field-input" type="text" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="username" />
                  : <span className="mpp__field-value">{user.username}</span>
                }
              </div>

              <div className="mpp__field">
                <label className="mpp__field-label">Email</label>
                <span className="mpp__field-value mpp__field-value--muted">
                  {user.email}
                  <span className="mpp__verified-badge">✓ {t('verif_status_approved')}</span>
                </span>
              </div>

              <div className="mpp__field">
                <label className="mpp__field-label">{t('myprofile_tariff')}</label>
                <span className={`mpp__status ${user.is_active ? 'mpp__status--active' : 'mpp__status--inactive'}`}>
                  ● {user.is_active ? t('success') : t('myprofile_noVerif')}
                </span>
              </div>

            </div>
          </div>

          {/* Verification — BUSINESS only */}
          {user.role === 'BUSINESS' && (
            <div className="mpp__card">
              <h3 className="mpp__card-title">{t('myprofile_verif')}</h3>

              {verStatus === undefined ? (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{t('loading')}</p>
              ) : verStatus === null ? (
                <div className="mpp__ver-start">
                  <div className="mpp__ver-icon">🛡️</div>
                  <p className="mpp__ver-text">{t('myprofile_noVerif')}</p>
                  <button className="mpp__ver-btn" onClick={() => navigate('/verification')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    {t('myprofile_goVerif')}
                  </button>
                </div>
              ) : (
                <div className="mpp__ver-status" style={{ background: VER_STATUS[verStatus.status]?.bg }}>
                  <span style={{ fontSize: 26 }}>{VER_STATUS[verStatus.status]?.icon}</span>
                  <div>
                    <div className="mpp__ver-status-label" style={{ color: VER_STATUS[verStatus.status]?.color }}>
                      {VER_STATUS[verStatus.status]?.label}
                    </div>
                    {verStatus.status === 'REJECTED' && verStatus.comment && (
                      <div className="mpp__ver-reason">{verStatus.comment}</div>
                    )}
                  </div>
                  <button className="mpp__ver-link" onClick={() => navigate('/verification')}>
                    {t('myprofile_goVerif')} →
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Logout */}
        <button className="mpp__logout-btn" onClick={handleLogout}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          {t('nav_logout')}
        </button>

      </main>
    </div>
  )
}
