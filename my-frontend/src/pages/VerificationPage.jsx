import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import Header from '../components/Header'
import './VerificationPage.css'

const BASE = import.meta.env.PROD
  ? 'https://api.101-school.uz/api'
  : 'http://127.0.0.1:8000/api'

function normalizeVerificationPayload(payload) {
  if (!payload || payload.exists === false) return null
  return payload
}

async function apiFetch(url, token, opts = {}) {
  const res = await fetch(BASE + url, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, ...opts.headers },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || JSON.stringify(data))
  return data
}

function ChatPanel({ chatName, chatIcon, systemMsg, canSend, showQuickActions,
                     verReq, setVerReq, statusLabel, chatRef,
                     msgText, setMsgText, sending, onSend, error, getToken,
                     quickActions }) {
  const [editingId,   setEditingId]   = useState(null)
  const [editingText, setEditingText] = useState('')
  const [savingEdit,  setSavingEdit]  = useState(false)

  const startEdit = (msg) => { setEditingId(msg.id); setEditingText(msg.text) }
  const cancelEdit = () => { setEditingId(null); setEditingText('') }

  const saveEdit = async (msgId) => {
    if (!editingText.trim()) return
    setSavingEdit(true)
    try {
      const token = await getToken()
      if (!token) throw new Error()
      const res = await fetch(`${BASE}/verification/messages/${msgId}/`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editingText.trim() }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setVerReq(prev => ({
        ...prev,
        messages: prev.messages.map(m => m.id === msgId ? { ...m, text: updated.text, is_edited: true } : m),
      }))
      cancelEdit()
    } catch {
      // silent
    } finally {
      setSavingEdit(false)
    }
  }

  return (
    <div className="vp__chat">
      <div className="vp__chat-header">
        <div className="vp__chat-avatar">{chatIcon}</div>
        <div>
          <div className="vp__chat-name">{chatName}</div>
          <div className="vp__chat-status">{canSend ? '● Online' : statusLabel || ''}</div>
        </div>
      </div>

      <div className="vp__messages" ref={chatRef}>
        <div className="vp__msg vp__msg--system"><p>{systemMsg}</p></div>
        {showQuickActions && verReq?.messages?.length === 0 && (
          <div className="vp__quick-actions">
            {(quickActions || []).map(a => (
              <button key={a.label} className="vp__quick-btn" onClick={() => setMsgText(a.text)}>
                {a.label}
              </button>
            ))}
          </div>
        )}
        {verReq?.messages?.map(msg => (
          <div key={msg.id} className={`vp__msg ${msg.is_mine ? 'vp__msg--mine' : 'vp__msg--their'}`}>
            {!msg.is_mine && (
              <div className="vp__msg-author">
                {msg.sender_role === 'MODERATOR' ? '🛡️ Support' : msg.sender_username}
              </div>
            )}

            {editingId === msg.id ? (
              <div className="vp__msg-edit">
                <textarea
                  className="vp__msg-edit__input"
                  value={editingText}
                  onChange={e => setEditingText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(msg.id) } if (e.key === 'Escape') cancelEdit() }}
                  autoFocus
                  rows={2}
                />
                <div className="vp__msg-edit__actions">
                  <button className="vp__msg-edit__save" onClick={() => saveEdit(msg.id)} disabled={savingEdit || !editingText.trim()}>
                    {savingEdit ? '...' : 'OK'}
                  </button>
                  <button className="vp__msg-edit__cancel" onClick={cancelEdit}>✕</button>
                </div>
              </div>
            ) : (
              <>
                {msg.text && <div className="vp__msg-text">{msg.text}</div>}
                {msg.file_name && (
                  <div className="vp__msg-file">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    {msg.file_name}
                  </div>
                )}
              </>
            )}

            <div className="vp__msg-footer">
              <span className="vp__msg-time">
                {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                {msg.is_edited && <em className="vp__msg-edited"> · edited</em>}
              </span>
              {msg.is_mine && msg.text && editingId !== msg.id && (
                <button className="vp__msg-edit-btn" onClick={() => startEdit(msg)} title="Edit">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {canSend ? (
        <form className="vp__chat-input" onSubmit={onSend}>
          <input
            className="vp__input"
            value={msgText}
            onChange={e => setMsgText(e.target.value)}
            placeholder="..."
            disabled={sending}
          />
          <button className="vp__send-btn" type="submit" disabled={sending || !msgText.trim()}>
            {sending ? <span className="vp__spinner vp__spinner--sm" /> : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            )}
          </button>
        </form>
      ) : (
        <div className="vp__chat-closed">{statusLabel}</div>
      )}

      {error && <div className="vp__error vp__error--chat">{error}</div>}
    </div>
  )
}

export default function VerificationPage() {
  const { user, getAccessToken } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useLanguage()
  const pricingMessage = location.state?.pricingMessage || ''

  const STATUS_CONFIG = {
    PENDING:  { label: t('verif_status_pending'),  color: '#f59e0b', icon: '⏳' },
    APPROVED: { label: t('verif_status_approved'), color: '#10b981', icon: '✅' },
    REJECTED: { label: t('verif_status_rejected'), color: '#ef4444', icon: '❌' },
  }

  const QUICK_ACTIONS = [
    { label: `💳 ${t('verif_buyTariff')}`,   text: t('verif_msgTariff') },
    { label: `⚠️ ${t('verif_problem')}`,      text: t('verif_msgProblem') },
    { label: `❓ ${t('verif_question')}`,      text: t('verif_msgQuestion') },
  ]

  const [verReq, setVerReq]       = useState(null)
  const [loading, setLoading]     = useState(true)
  const [creating, setCreating]   = useState(false)
  const [msgText, setMsgText]     = useState('')
  const [sending, setSending]     = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState('')

  const chatRef  = useRef(null)
  const fileRef  = useRef(null)

  // Redirect hooks
  useEffect(() => {
    if (!user) navigate('/login')
    else if (user.role !== 'BUSINESS') navigate('/')
  }, [user, navigate])

  useEffect(() => {
    if (user?.role !== 'BUSINESS') return
    ;(async () => {
      const token = await getAccessToken()
      if (!token) {
        setVerReq(null)
        setLoading(false)
        return
      }
      try {
        const data = await apiFetch('/verification/my/', token)
        const normalized = normalizeVerificationPayload(data)
        setVerReq(normalized)
        if (normalized && pricingMessage) setMsgText(pricingMessage)
      } catch {
        if (pricingMessage) {
          try {
            const data = await apiFetch('/verification/my/', token, { method: 'POST' })
            setVerReq(data)
            setMsgText(pricingMessage)
          } catch {
            setVerReq(null)
          }
        } else {
          setVerReq(null)
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [user?.role, pricingMessage, getAccessToken])

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [verReq?.messages?.length])

  if (!user || user.role !== 'BUSINESS') return null

  const handleCreate = async () => {
    setCreating(true)
    setError('')
    try {
      const token = await getAccessToken()
      if (!token) throw new Error('Сессия истекла')
      const data = await apiFetch('/verification/my/', token, { method: 'POST' })
      setVerReq(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setCreating(false)
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!msgText.trim()) return
    setSending(true)
    try {
      const token = await getAccessToken()
      if (!token) throw new Error('Сессия истекла')
      const msg = await apiFetch('/verification/chat/', token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: msgText }),
      })
      setVerReq(prev => ({ ...prev, messages: [...(prev.messages || []), msg] }))
      setMsgText('')
    } catch (e) {
      setError(e.message)
    } finally {
      setSending(false)
    }
  }

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const token = await getAccessToken()
      if (!token) throw new Error('Сессия истекла')
      const fd = new FormData()
      fd.append('file', file)
      const doc = await apiFetch('/verification/upload/', token, { method: 'POST', body: fd })
      const fakeMsg = {
        id: Date.now(), sender_username: user.username, sender_role: 'BUSINESS',
        text: '', file: doc.name, file_name: doc.name, is_mine: true,
        created_at: new Date().toISOString(),
      }
      setVerReq(prev => ({
        ...prev,
        documents: [...(prev.documents || []), doc],
        messages:  [...(prev.messages || []), fakeMsg],
      }))
    } catch (e) {
      setError(e.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const status = verReq ? STATUS_CONFIG[verReq.status] : null
  const isVerified = verReq?.status === 'APPROVED'
  const isLoaded = !loading

  const chatProps = {
    verReq, setVerReq, statusLabel: status?.label, chatRef,
    msgText, setMsgText, sending, onSend: handleSend, error,
    getToken: getAccessToken,
    quickActions: QUICK_ACTIONS,
  }

  if (loading) return <div className="vp__loading">{t('loading')}</div>

  // ── APPROVED: support chat only ────────────────────────────────────────────
  if (isLoaded && isVerified) {
    return (
      <div className="vp">
        <Header />
        <main className="vp__main">
          <button className="vp__back" onClick={() => navigate('/dashboard')}>← </button>

          <div className="vp__verified-header">
            <span className="vp__verified-badge-big">✅ {t('verif_status_approved')}</span>
            <p className="vp__verified-sub">{t('verif_question')}</p>
          </div>

          <div className="vp__layout vp__layout--support">
            <ChatPanel
              {...chatProps}
              chatIcon="🛡️"
              chatName="Support"
              systemMsg={t('verif_msgTariff')}
              canSend={true}
              showQuickActions={true}
            />
          </div>
        </main>
      </div>
    )
  }

  // ── NO REQUEST: start card ─────────────────────────────────────────────────
  if (isLoaded && !verReq) {
    return (
      <div className="vp">
        <Header />
        <main className="vp__main">
          <button className="vp__back" onClick={() => navigate('/dashboard')}>← </button>
          <div className="vp__start-card">
            <div className="vp__start-icon">🛡️</div>
            <h1 className="vp__start-title">{t('verif_status_pending')}</h1>
            <p className="vp__start-text">
              <strong>✓ {t('verif_status_approved')}</strong>
            </p>

            <div className="vp__docs-required">
              <div className="vp__docs-required__title">📋</div>
              <div className="vp__docs-required__list">
                <div className="vp__doc-req-item">
                  <span className="vp__doc-req-item__num">1</span>
                  <div>
                    <strong></strong>
                    <p></p>
                  </div>
                </div>
                <div className="vp__doc-req-item">
                  <span className="vp__doc-req-item__num">2</span>
                  <div>
                    <strong></strong>
                    <p></p>
                  </div>
                </div>
                <div className="vp__doc-req-item">
                  <span className="vp__doc-req-item__num">3</span>
                  <div>
                    <strong></strong>
                    <p></p>
                  </div>
                </div>
                <div className="vp__doc-req-item">
                  <span className="vp__doc-req-item__num">4</span>
                  <div>
                    <strong></strong>
                    <p></p>
                  </div>
                </div>
              </div>
            </div>

            <div className="vp__steps">
              <div className="vp__step"><span>1</span><p></p></div>
              <div className="vp__step-arrow">→</div>
              <div className="vp__step"><span>2</span><p></p></div>
              <div className="vp__step-arrow">→</div>
              <div className="vp__step"><span>3</span><p></p></div>
            </div>

            {error && <div className="vp__error">{error}</div>}
            <button className="vp__create-btn" onClick={handleCreate} disabled={creating}>
              {creating ? <span className="vp__spinner" /> : '🚀'}
            </button>
          </div>
        </main>
      </div>
    )
  }

  // ── PENDING / REJECTED ─────────────────────────────────────────────────────
  return (
    <div className="vp">
      <Header />
      <main className="vp__main">
        <button className="vp__back" onClick={() => navigate('/dashboard')}>← </button>

        <div className="vp__layout">
          {/* Sidebar */}
          <aside className="vp__sidebar">
            <div className="vp__status-card">
              <div className="vp__status-icon">{status?.icon}</div>
              <div className="vp__status-label" style={{ color: status?.color }}>{status?.label}</div>
              {verReq?.status === 'REJECTED' && verReq.comment && (
                <div className="vp__reject-reason"><strong></strong> {verReq.comment}</div>
              )}
            </div>

            {verReq?.status === 'PENDING' && (
              <div className="vp__sidebar-hint">
                <div className="vp__sidebar-hint__title">📋</div>
                <ul className="vp__sidebar-hint__list">
                  <li>📄</li>
                  <li>🏢</li>
                  <li>📸</li>
                  <li>🔗</li>
                </ul>
              </div>
            )}

            <div className="vp__docs-list">
              <h3 className="vp__sidebar-title"></h3>
              {verReq?.documents?.length === 0
                ? <p className="vp__no-docs"></p>
                : verReq?.documents?.map(doc => (
                    <div key={doc.id} className="vp__doc-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                      </svg>
                      <span>{doc.name}</span>
                    </div>
                  ))
              }
              {verReq?.status === 'PENDING' && (
                <>
                  <button className="vp__upload-btn" onClick={() => fileRef.current?.click()} disabled={uploading}>
                    {uploading ? <span className="vp__spinner" /> : (
                      <>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                          <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                        </svg>
                        ↑
                      </>
                    )}
                  </button>
                  <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={handleUpload}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
                  <p className="vp__upload-hint">PDF, JPG, PNG, DOC</p>
                </>
              )}
            </div>
          </aside>

          <ChatPanel
            {...chatProps}
            chatIcon="🛡️"
            chatName={pricingMessage ? t('verif_buyTariff') : 'Support'}
            systemMsg={
              pricingMessage
                ? t('verif_msgTariff')
                : t('verif_msgProblem')
            }
            canSend={verReq?.status === 'PENDING'}
            showQuickActions={false}
          />
        </div>
      </main>
    </div>
  )
}
