import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import Header from '../components/Header'
import './VerificationPage.css'

import { API_URL as BASE } from '../config/api'

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

  const [verReq, setVerReq]       = useState(null)
  const [loading, setLoading]     = useState(true)
  const [creating, setCreating]   = useState(false)
  const [msgText, setMsgText]     = useState('')
  const [sending, setSending]     = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState('')

  const messagesEndRef = useRef(null)
  const fileRef        = useRef(null)

  useEffect(() => {
    if (!user) navigate('/login')
    else if (user.role !== 'BUSINESS') navigate('/')
  }, [user, navigate])

  useEffect(() => {
    if (user?.role !== 'BUSINESS') return
    ;(async () => {
      const token = await getAccessToken()
      if (!token) { setLoading(false); return }
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
          } catch { setVerReq(null) }
        } else {
          setVerReq(null)
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [user?.role, pricingMessage, getAccessToken])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [verReq?.messages?.length])

  if (!user || user.role !== 'BUSINESS') return null
  if (loading) return <div className="vp__loading">{t('loading')}</div>

  const status = verReq ? STATUS_CONFIG[verReq.status] : null

  const handleCreate = async () => {
    setCreating(true)
    setError('')
    try {
      const token = await getAccessToken()
      if (!token) throw new Error('Сессия истекла')
      const data = await apiFetch('/verification/my/', token, { method: 'POST' })
      setVerReq(data)
    } catch (e) { setError(e.message) }
    finally { setCreating(false) }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!msgText.trim() || sending) return
    setSending(true)
    const trimmed = msgText
    setMsgText('')
    try {
      const token = await getAccessToken()
      if (!token) throw new Error()
      const msg = await apiFetch('/verification/chat/', token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      })
      setVerReq(prev => ({ ...prev, messages: [...(prev.messages || []), msg] }))
    } catch { setMsgText(trimmed) }
    finally { setSending(false) }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploading(true)
    try {
      const token = await getAccessToken()
      if (!token) throw new Error()
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`${BASE}/verification/upload/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      if (!res.ok) throw new Error()
      const doc = await res.json()
      const fakeMsg = {
        id: Date.now(),
        is_mine: true,
        text: '',
        file: doc.file || doc.url || '',
        file_name: doc.name || file.name,
        created_at: new Date().toISOString(),
      }
      setVerReq(prev => ({
        ...prev,
        documents: [...(prev.documents || []), doc],
        messages: [...(prev.messages || []), fakeMsg],
      }))
    } catch { /* ignore */ }
    finally { setUploading(false) }
  }

  const canSend = verReq && verReq.status !== 'APPROVED' || verReq?.status === 'APPROVED'

  return (
    <div className="vp">
      <Header />
      <main className="vp__main vp__main--unified">

        {/* ── Chat container ── */}
        <div className="vp__unified-chat">

          {/* Header */}
          <div className="vp__unified-header">
            <button className="vp__unified-back" onClick={() => navigate('/dashboard')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <div className="vp__unified-avatar">🛡️</div>
            <div className="vp__unified-info">
              <span className="vp__unified-name">Support</span>
              {status ? (
                <span className="vp__unified-status" style={{ color: status.color }}>
                  {status.icon} {status.label}
                </span>
              ) : (
                <span className="vp__unified-status">Верификация и тарифы</span>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="vp__unified-messages">

            {/* System welcome */}
            <div className="vp__unified-system">
              Это чат с модератором. Здесь можно задать вопрос по тарифу, отправить чек об оплате или пройти верификацию.
            </div>

            {/* If rejected — show reason */}
            {verReq?.status === 'REJECTED' && verReq.comment && (
              <div className="vp__unified-system vp__unified-system--warn">
                ❌ Причина отказа: {verReq.comment}
              </div>
            )}

            {/* No request yet */}
            {!verReq && (
              <div className="vp__unified-start">
                <p>Нажмите кнопку ниже, чтобы начать чат с модератором</p>
                {error && <div className="vp__error" style={{ marginBottom: 12 }}>{error}</div>}
                <button className="vp__unified-start-btn" onClick={handleCreate} disabled={creating}>
                  {creating ? <span className="vp__spinner" /> : '🚀 Начать чат'}
                </button>
              </div>
            )}

            {/* Messages list */}
            {verReq?.messages?.map(msg => {
              const isMe = msg.is_mine
              const isImage = msg.file && /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(msg.file)
              return (
                <div key={msg.id} className={`vp__unified-msg ${isMe ? 'vp__unified-msg--me' : 'vp__unified-msg--them'}`}>
                  {!isMe && (
                    <div className="vp__unified-msg-avatar">🛡️</div>
                  )}
                  <div className="vp__unified-bubble">
                    {!isMe && <span className="vp__unified-author">Support</span>}
                    {msg.text && <div className="vp__unified-text">{msg.text}</div>}
                    {msg.file && (
                      isImage ? (
                        <a href={msg.file} target="_blank" rel="noopener noreferrer">
                          <img src={msg.file} alt={msg.file_name || 'файл'} className="vp__unified-img" />
                        </a>
                      ) : (
                        <a href={msg.file} target="_blank" rel="noopener noreferrer" className="vp__unified-file">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                          </svg>
                          {msg.file_name || 'Файл'}
                        </a>
                      )
                    )}
                    <span className="vp__unified-time">
                      {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              )
            })}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          {verReq ? (
            <form className="vp__unified-input" onSubmit={handleSend}>
              <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={handleFileChange} accept="image/*,.pdf,.doc,.docx" />
              <button
                type="button"
                className="vp__unified-attach"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                title="Прикрепить чек / файл"
              >
                {uploading
                  ? <span className="vp__spinner vp__spinner--sm" />
                  : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                }
              </button>
              <input
                type="text"
                className="vp__unified-text-input"
                placeholder="Написать или прикрепить чек об оплате..."
                value={msgText}
                onChange={e => setMsgText(e.target.value)}
                disabled={sending}
              />
              <button type="submit" className="vp__unified-send" disabled={sending || !msgText.trim()}>
                {sending
                  ? <span className="vp__spinner vp__spinner--sm" />
                  : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                }
              </button>
            </form>
          ) : null}

          {error && verReq && <div className="vp__error" style={{ padding: '8px 20px' }}>{error}</div>}
        </div>

      </main>
    </div>
  )
}
