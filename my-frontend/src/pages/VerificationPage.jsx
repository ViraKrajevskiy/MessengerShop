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

const QUICK_ACTIONS = [
  { label: '💳 Купить тариф',        text: 'Здравствуйте! Хочу подключить тариф. Подскажите пожалуйста реквизиты для оплаты и условия.' },
  { label: '⚠️ Сообщить о проблеме', text: 'Здравствуйте! Хочу сообщить о проблеме: ' },
  { label: '❓ Задать вопрос',        text: 'Здравствуйте! У меня вопрос: ' },
]

function ChatPanel({ chatName, chatIcon, systemMsg, canSend, showQuickActions,
                     verReq, setVerReq, statusLabel, chatRef,
                     msgText, setMsgText, sending, onSend, error, token }) {
  const [editingId,   setEditingId]   = useState(null)
  const [editingText, setEditingText] = useState('')
  const [savingEdit,  setSavingEdit]  = useState(false)

  const startEdit = (msg) => { setEditingId(msg.id); setEditingText(msg.text) }
  const cancelEdit = () => { setEditingId(null); setEditingText('') }

  const saveEdit = async (msgId) => {
    if (!editingText.trim()) return
    setSavingEdit(true)
    try {
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
          <div className="vp__chat-status">{canSend ? '● Онлайн' : statusLabel || ''}</div>
        </div>
      </div>

      <div className="vp__messages" ref={chatRef}>
        <div className="vp__msg vp__msg--system"><p>{systemMsg}</p></div>
        {showQuickActions && verReq?.messages?.length === 0 && (
          <div className="vp__quick-actions">
            {QUICK_ACTIONS.map(a => (
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
                {msg.sender_role === 'MODERATOR' ? '🛡️ Поддержка' : msg.sender_username}
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
                    {savingEdit ? '...' : 'Сохранить'}
                  </button>
                  <button className="vp__msg-edit__cancel" onClick={cancelEdit}>Отмена</button>
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
                {msg.is_edited && <em className="vp__msg-edited"> · изменено</em>}
              </span>
              {msg.is_mine && msg.text && editingId !== msg.id && (
                <button className="vp__msg-edit-btn" onClick={() => startEdit(msg)} title="Редактировать">
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
            placeholder="Напишите сообщение..."
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
  const isVerified = verReq?.status === 'APPROVED'
  const isLoaded = !loading

  const chatProps = {
    verReq, setVerReq, statusLabel: status?.label, chatRef,
    msgText, setMsgText, sending, onSend: handleSend, error,
    token: tokens?.access,
  }

  // ── ВЕРИФИЦИРОВАН: только чат поддержки, без инструкций ────────────────────
  if (isLoaded && isVerified) {
    return (
      <div className="vp">
        <Header />
        <main className="vp__main">
          <button className="vp__back" onClick={() => navigate('/dashboard')}>← Назад</button>

          <div className="vp__verified-header">
            <span className="vp__verified-badge-big">✅ Верифицированный бизнес</span>
            <p className="vp__verified-sub">Здесь вы можете связаться с поддержкой по любому вопросу</p>
          </div>

          <div className="vp__layout vp__layout--support">
            <ChatPanel
              {...chatProps}
              chatIcon="🛡️"
              chatName="Служба поддержки"
              systemMsg="Здравствуйте! Ваш бизнес верифицирован ✅ Здесь вы можете купить или продлить тариф, сообщить о проблеме или задать любой вопрос."
              canSend={true}
              showQuickActions={true}
            />
          </div>
        </main>
      </div>
    )
  }

  // ── НЕТ ЗАЯВКИ: подробная инструкция + кнопка начать ──────────────────────
  if (isLoaded && !verReq) {
    return (
      <div className="vp">
        <Header />
        <main className="vp__main">
          <button className="vp__back" onClick={() => navigate('/dashboard')}>← Назад</button>
          <div className="vp__start-card">
            <div className="vp__start-icon">🛡️</div>
            <h1 className="vp__start-title">Верификация бизнеса</h1>
            <p className="vp__start-text">
              Получите значок <strong>✓ Верифицирован</strong> — клиенты будут доверять вам больше.
            </p>

            <div className="vp__docs-required">
              <div className="vp__docs-required__title">📋 Что нужно отправить в чат:</div>
              <div className="vp__docs-required__list">
                <div className="vp__doc-req-item">
                  <span className="vp__doc-req-item__num">1</span>
                  <div>
                    <strong>Фото документа владельца</strong>
                    <p>Паспорт или удостоверение личности (фото разворота с фотографией)</p>
                  </div>
                </div>
                <div className="vp__doc-req-item">
                  <span className="vp__doc-req-item__num">2</span>
                  <div>
                    <strong>Подтверждение реального бизнеса</strong>
                    <p>Свидетельство о регистрации компании, торговая лицензия или налоговый номер</p>
                  </div>
                </div>
                <div className="vp__doc-req-item">
                  <span className="vp__doc-req-item__num">3</span>
                  <div>
                    <strong>Фото точки продаж / офиса</strong>
                    <p>Фотография магазина, офиса или места ведения деятельности</p>
                  </div>
                </div>
                <div className="vp__doc-req-item">
                  <span className="vp__doc-req-item__num">4</span>
                  <div>
                    <strong>Любое дополнительное подтверждение</strong>
                    <p>Визитки, сайт, ссылки на соцсети, договоры — всё что докажет реальность бизнеса</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="vp__steps">
              <div className="vp__step"><span>1</span><p>Нажмите кнопку ниже</p></div>
              <div className="vp__step-arrow">→</div>
              <div className="vp__step"><span>2</span><p>Отправьте документы в чат</p></div>
              <div className="vp__step-arrow">→</div>
              <div className="vp__step"><span>3</span><p>Модератор проверит (до 24ч)</p></div>
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

  // ── PENDING / REJECTED: чат с sidebar документов + напоминание ─────────────
  return (
    <div className="vp">
      <Header />
      <main className="vp__main">
        <button className="vp__back" onClick={() => navigate('/dashboard')}>← Назад</button>

        <div className="vp__layout">
          {/* Sidebar */}
          <aside className="vp__sidebar">
            <div className="vp__status-card">
              <div className="vp__status-icon">{status?.icon}</div>
              <div className="vp__status-label" style={{ color: status?.color }}>{status?.label}</div>
              {verReq?.status === 'REJECTED' && verReq.comment && (
                <div className="vp__reject-reason"><strong>Причина:</strong> {verReq.comment}</div>
              )}
            </div>

            {/* Инструкция что отправить — только если не верифицирован */}
            {verReq?.status === 'PENDING' && (
              <div className="vp__sidebar-hint">
                <div className="vp__sidebar-hint__title">📋 Что нужно отправить:</div>
                <ul className="vp__sidebar-hint__list">
                  <li>📄 Паспорт / удостоверение</li>
                  <li>🏢 Свидетельство о регистрации или лицензия</li>
                  <li>📸 Фото точки продаж / офиса</li>
                  <li>🔗 Сайт, соцсети или визитка</li>
                </ul>
              </div>
            )}

            <div className="vp__docs-list">
              <h3 className="vp__sidebar-title">Загруженные документы</h3>
              {verReq?.documents?.length === 0
                ? <p className="vp__no-docs">Документы не загружены</p>
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

          <ChatPanel
            {...chatProps}
            chatIcon="🛡️"
            chatName={pricingMessage ? 'Подключение тарифа' : 'Служба верификации'}
            systemMsg={
              pricingMessage
                ? '💳 Для подключения тарифа напишите сообщение — модератор пришлёт реквизиты и активирует тариф после оплаты.'
                : '👋 Загрузите документы слева и напишите сообщение — модератор ответит в течение 24 часов.'
            }
            canSend={verReq?.status === 'PENDING'}
            showQuickActions={false}
          />
        </div>
      </main>
    </div>
  )
}
