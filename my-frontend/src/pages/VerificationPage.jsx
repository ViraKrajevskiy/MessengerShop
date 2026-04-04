import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Header from '../components/Header'
import './VerificationPage.css'

const BASE = 'http://127.0.0.1:8000/api'

async function apiFetch(url, token, opts = {}) {
  const res = await fetch(BASE + url, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, ...opts.headers },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || JSON.stringify(data))
  return data
}

const STATUS_CONFIG = {
  PENDING:  { label: 'На рассмотрении', color: '#f59e0b', icon: '⏳' },
  APPROVED: { label: 'Подтверждён',     color: '#10b981', icon: '✅' },
  REJECTED: { label: 'Отклонён',        color: '#ef4444', icon: '❌' },
}

export default function VerificationPage() {
  const { user, tokens } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const pricingMessage = location.state?.pricingMessage || ''

  const [verReq, setVerReq]       = useState(null)    // текущая заявка
  const [loading, setLoading]     = useState(true)
  const [creating, setCreating]   = useState(false)
  const [msgText, setMsgText]     = useState('')
  const [sending, setSending]     = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState('')

  const chatRef  = useRef(null)
  const fileRef  = useRef(null)

  // Redirect hooks — всегда вверху
  useEffect(() => {
    if (!user) navigate('/login')
    else if (user.role !== 'BUSINESS') navigate('/')
  }, [user, navigate])

  // Загружаем статус заявки; если пришли с тарифной страницы — предзаполняем сообщение
  useEffect(() => {
    if (!tokens?.access || user?.role !== 'BUSINESS') return
    apiFetch('/verification/my/', tokens.access)
      .then(data => {
        setVerReq(data)
        if (pricingMessage) setMsgText(pricingMessage)
      })
      .catch(async () => {
        // Нет заявки — если пришли с тарифной страницы, создаём автоматически
        if (pricingMessage) {
          try {
            const data = await apiFetch('/verification/my/', tokens.access, { method: 'POST' })
            setVerReq(data)
            setMsgText(pricingMessage)
          } catch {
            setVerReq(null)
          }
        } else {
          setVerReq(null)
        }
      })
      .finally(() => setLoading(false))
  }, [tokens?.access])

  // Скролл вниз при новых сообщениях
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [verReq?.messages?.length])

  if (!user || user.role !== 'BUSINESS') return null

  // ── Создать заявку ──────────────────────────────────────────────────────────
  const handleCreate = async () => {
    setCreating(true)
    setError('')
    try {
      const data = await apiFetch('/verification/my/', tokens.access, { method: 'POST' })
      setVerReq(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setCreating(false)
    }
  }

  // ── Отправить сообщение ─────────────────────────────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault()
    if (!msgText.trim()) return
    setSending(true)
    try {
      const msg = await apiFetch('/verification/chat/', tokens.access, {
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

  // ── Загрузить документ ──────────────────────────────────────────────────────
  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const doc = await apiFetch('/verification/upload/', tokens.access, { method: 'POST', body: fd })
      // добавляем документ и системное сообщение в чат
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

  // ── Стартовый экран: нет заявки ────────────────────────────────────────────
  if (!loading && !verReq) {
    return (
      <div className="vp">
        <Header />
        <main className="vp__main">
          <button className="vp__back" onClick={() => navigate('/me')}>← Назад</button>
          <div className="vp__start-card">
            <div className="vp__start-icon">🛡️</div>
            <h1 className="vp__start-title">Подтверждение аккаунта</h1>
            <p className="vp__start-text">
              Получите значок <strong>✓ Верифицирован</strong> на вашем профиле.<br/>
              Это повысит доверие клиентов и выделит вас среди других.
            </p>
            <div className="vp__steps">
              <div className="vp__step"><span>1</span><p>Создайте заявку</p></div>
              <div className="vp__step-arrow">→</div>
              <div className="vp__step"><span>2</span><p>Отправьте документы в чат</p></div>
              <div className="vp__step-arrow">→</div>
              <div className="vp__step"><span>3</span><p>Модератор проверит и подтвердит</p></div>
            </div>
            <div className="vp__docs-hint">
              <strong>Какие документы нужны:</strong>
              <ul>
                <li>Паспорт или удостоверение личности</li>
                <li>Свидетельство о регистрации бизнеса (если есть)</li>
                <li>Любой документ подтверждающий деятельность</li>
              </ul>
            </div>
            {error && <div className="vp__error">{error}</div>}
            <button className="vp__create-btn" onClick={handleCreate} disabled={creating}>
              {creating ? <span className="vp__spinner" /> : '🚀 Начать верификацию'}
            </button>
          </div>
        </main>
      </div>
    )
  }

  // ── Чат ────────────────────────────────────────────────────────────────────
  return (
    <div className="vp">
      <Header />
      <main className="vp__main">
        <button className="vp__back" onClick={() => navigate('/me')}>← Назад в профиль</button>

        <div className="vp__layout">
          {/* Sidebar */}
          <aside className="vp__sidebar">
            <div className="vp__status-card">
              <div className="vp__status-icon">{status?.icon}</div>
              <div className="vp__status-label" style={{ color: status?.color }}>
                {status?.label}
              </div>
              {verReq?.status === 'APPROVED' && (
                <div className="vp__verified-badge">✓ Верифицированный бизнес</div>
              )}
              {verReq?.status === 'REJECTED' && verReq.comment && (
                <div className="vp__reject-reason">
                  <strong>Причина:</strong> {verReq.comment}
                </div>
              )}
            </div>

            <div className="vp__docs-list">
              <h3 className="vp__sidebar-title">Загруженные документы</h3>
              {verReq?.documents?.length === 0 && (
                <p className="vp__no-docs">Документы не загружены</p>
              )}
              {verReq?.documents?.map(doc => (
                <div key={doc.id} className="vp__doc-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <span>{doc.name}</span>
                </div>
              ))}

              {verReq?.status === 'PENDING' && (
                <>
                  <button className="vp__upload-btn" onClick={() => fileRef.current?.click()} disabled={uploading}>
                    {uploading ? <span className="vp__spinner" /> : (
                      <>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                          <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                        </svg>
                        Загрузить документ
                      </>
                    )}
                  </button>
                  <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={handleUpload}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
                  <p className="vp__upload-hint">PDF, JPG, PNG, DOC — до 10 МБ</p>
                </>
              )}
            </div>
          </aside>

          {/* Chat */}
          <div className="vp__chat">
            <div className="vp__chat-header">
              <div className="vp__chat-avatar">{pricingMessage ? '💳' : '🛡️'}</div>
              <div>
                <div className="vp__chat-name">
                  {pricingMessage ? 'Подключение тарифа' : 'Служба верификации'}
                </div>
                <div className="vp__chat-status">
                  {verReq?.status === 'PENDING' ? '● Ожидает ответа модератора' : status?.label}
                </div>
              </div>
            </div>

            <div className="vp__messages" ref={chatRef}>
              {/* Системное приветствие */}
              <div className="vp__msg vp__msg--system">
                <p>
                  {pricingMessage
                    ? '💳 Для подключения тарифа напишите сообщение — модератор пришлёт реквизиты и активирует тариф после оплаты.'
                    : '👋 Добро пожаловать в чат верификации! Загрузите документы слева и напишите сообщение — модератор ответит в ближайшее время.'}
                </p>
              </div>

              {verReq?.messages?.map(msg => (
                <div key={msg.id} className={`vp__msg ${msg.is_mine ? 'vp__msg--mine' : 'vp__msg--their'}`}>
                  {!msg.is_mine && (
                    <div className="vp__msg-author">
                      {msg.sender_role === 'MODERATOR' ? '🛡️ Модератор' : msg.sender_username}
                    </div>
                  )}
                  {msg.text && <div className="vp__msg-text">{msg.text}</div>}
                  {msg.file_name && (
                    <div className="vp__msg-file">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                      </svg>
                      {msg.file_name}
                    </div>
                  )}
                  <div className="vp__msg-time">
                    {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>

            {verReq?.status === 'PENDING' ? (
              <form className="vp__chat-input" onSubmit={handleSend}>
                <input
                  className="vp__input"
                  value={msgText}
                  onChange={e => setMsgText(e.target.value)}
                  placeholder="Напишите сообщение модератору..."
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
              <div className="vp__chat-closed">
                {verReq?.status === 'APPROVED'
                  ? '✅ Ваш аккаунт успешно верифицирован!'
                  : '❌ Заявка отклонена. Вы можете создать новую заявку.'}
              </div>
            )}

            {error && <div className="vp__error vp__error--chat">{error}</div>}
          </div>
        </div>
      </main>
    </div>
  )
}
