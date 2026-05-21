import { useState, useEffect, useCallback } from 'react'
import { API_URL } from '../config/api'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'

// Russian → Turkish dictionary for the moderator dashboard. Inline because this
// page is admin-only and is otherwise hardcoded in Russian — keys would bloat i18n.
const MOD_TR = {
  // Tabs
  'Лента': 'Akış', 'Верификация': 'Doğrulama', 'Посты': 'Gönderiler',
  'Твиты': 'Tweetler', 'Истории': 'Hikayeler', 'Комментарии': 'Yorumlar',
  'Услуги': 'Hizmetler', 'Отзывы': 'Değerlendirmeler', 'Жалобы': 'Şikayetler',
  'Тарифы': 'Tarifeler', 'Оплаты': 'Ödemeler', 'Профили': 'Profiller',
  // Status / plan
  'Бесплатный': 'Ücretsiz', 'Ожидание': 'Beklemede', 'Одобрено': 'Onaylandı',
  'Отклонено': 'Reddedildi', 'Решено': 'Çözüldü',
  // Reasons
  'Спам': 'Spam', 'Неприемлемый контент': 'Uygunsuz içerik',
  'Мошенничество': 'Dolandırıcılık', 'Дезинформация': 'Yanlış bilgi', 'Другое': 'Diğer',
  // Filters / common
  'Все': 'Tümü', 'Всё': 'Tümü', 'Активные': 'Aktif', 'Заблокированные': 'Engellenmiş',
  'Активен': 'Aktif', 'Заблокирован': 'Engellendi',
  // Buttons
  'Загрузка…': 'Yükleniyor…', 'Загрузка...': 'Yükleniyor...',
  'Сохранить': 'Kaydet', 'Отменить': 'İptal', 'Закрыть': 'Kapat',
  'Применить': 'Uygula', 'Назначить': 'Ata', 'Подтвердить': 'Onayla',
  'Одобрить': 'Onayla', 'Отклонить': 'Reddet',
  '🚫 Заблокировать': '🚫 Engelle', '🔓 Разблокировать': '🔓 Engeli kaldır',
  // Empties
  'Нет постов': 'Gönderi yok', 'Нет твитов': 'Tweet yok',
  'Нет историй': 'Hikaye yok', 'Нет комментариев': 'Yorum yok',
  'Нет услуг': 'Hizmet yok', 'Нет отзывов': 'Değerlendirme yok',
  'Нет жалоб': 'Şikayet yok', 'Нет оплат': 'Ödeme yok',
  'Нет профилей': 'Profil yok', 'Нет верификаций': 'Doğrulama yok',
  'Нет данных': 'Veri yok', 'Без текста': 'Metin yok',
  // Misc
  'Выйти': 'Çıkış', 'Модератор': 'Moderatör', 'Панель модератора': 'Moderatör paneli',
  'Панель управления контентом': 'İçerik yönetim paneli',
  'Заблокировал:': 'Engelleyen:', 'Причина': 'Sebep', 'Статус': 'Durum',
  'Бизнес': 'İşletme', 'Пользователь': 'Kullanıcı', 'Дата': 'Tarih',
  'Сумма': 'Tutar', 'Тариф': 'Tarife', 'Действие': 'İşlem',
  'Без названия': 'Başlıksız',
  'Авто-удаление:': 'Otomatik silme:',
}

function useModT() {
  const ctx = useLanguage()
  const lang = ctx?.lang || 'ru'
  return (ru) => (lang === 'tr' && MOD_TR[ru]) ? MOD_TR[ru] : ru
}
import {
  apiModeratorGetVerifications, apiModeratorReviewVerification,
  apiModeratorGetVerificationDetail, apiModeratorSendVerificationMessage,
  apiModeratorGetPosts, apiModeratorBlockPost,
  apiModeratorGetComplaints, apiModeratorResolveComplaint,
  apiModeratorGetBusinesses, apiModeratorAssignTariff, apiModeratorToggleVerify,
  apiModeratorBlockBusiness, apiModeratorGetBusinessProducts,
  apiModeratorGetStories, apiModeratorBlockStory,
  apiModeratorGetComments, apiModeratorBlockComment,
  apiModeratorGetProducts, apiModeratorBlockProduct,
  apiModeratorGetReviews, apiModeratorBlockReview,
  apiModeratorGetPayments, apiModeratorReviewPayment,
  apiModeratorGetUsers, apiModeratorBlockUser,
  apiModeratorGetFeed,
} from '../api/moderatorApi'
import ModeratorSurveysTab from '../components/ModeratorSurveysTab'
import './ModeratorDashboardPage.css'

const TABS = [
  { id: 'feed',         label: 'Лента',        icon: '📰' },
  { id: 'verification', label: 'Верификация', icon: '🛡️' },
  { id: 'posts',        label: 'Посты',        icon: '📝' },
  { id: 'tweets',       label: 'Твиты',        icon: '🐦' },
  { id: 'stories',      label: 'Истории',      icon: '🎬' },
  { id: 'comments',     label: 'Комментарии',  icon: '💬' },
  { id: 'products',     label: 'Услуги',       icon: '🔧' },
  { id: 'reviews',      label: 'Отзывы',       icon: '⭐' },
  { id: 'complaints',   label: 'Жалобы',       icon: '🚨' },
  { id: 'tariffs',      label: 'Тарифы',       icon: '💎' },
  { id: 'payments',     label: 'Оплаты',       icon: '💳' },
  { id: 'profiles',     label: 'Профили',      icon: '👤' },
  { id: 'surveys',      label: 'Опросы',       icon: '📋' },
]

const PLAN_LABELS = { FREE: 'Бесплатный', PRO: 'Pro', VIP: 'VIP' }
const PLAN_COLORS = { FREE: 'gray', PRO: 'blue', VIP: 'gold' }
const STATUS_LABELS = { PENDING: 'Ожидание', APPROVED: 'Одобрено', REJECTED: 'Отклонено', RESOLVED: 'Решено' }
const STATUS_COLORS = { PENDING: 'yellow', APPROVED: 'green', REJECTED: 'red', RESOLVED: 'green' }
const REASON_LABELS = {
  SPAM: 'Спам', INAPPROPRIATE: 'Неприемлемый контент',
  FRAUD: 'Мошенничество', MISINFORMATION: 'Дезинформация', OTHER: 'Другое',
}

function useModeratorAuth() {
  const navigate = useNavigate()
  const [token, setToken] = useState(null)
  const [modUser, setModUser] = useState(null)

  useEffect(() => {
    try {
      const tokens = JSON.parse(localStorage.getItem('mod_tokens'))
      const user   = JSON.parse(localStorage.getItem('mod_user'))
      if (!tokens?.access || !user) { navigate('/moderator/login'); return }
      setToken(tokens.access)
      setModUser(user)
    } catch {
      navigate('/moderator/login')
    }
  }, [navigate])

  const logout = () => {
    localStorage.removeItem('mod_tokens')
    localStorage.removeItem('mod_user')
    navigate('/moderator/login')
  }

  return { token, modUser, logout }
}

// ── Verification Tab ──────────────────────────────────────────────────────────
function VerificationTab({ token }) {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('')
  const [detail, setDetail]   = useState(null)   // полные данные выбранной заявки
  const [detailLoading, setDetailLoading] = useState(false)
  const [comment, setComment] = useState('')
  const [saving, setSaving]   = useState(false)
  const [msgText, setMsgText] = useState('')
  const [sending, setSending] = useState(false)
  const chatEndRef = useState(null)[0]
  const chatRef    = { current: null }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiModeratorGetVerifications(token, { status: filter || undefined })
      setItems(data)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [token, filter])

  useEffect(() => { load() }, [load])

  const openDetail = async (item) => {
    setDetail({ ...item, messages: [], documents: [] })
    setDetailLoading(true)
    setComment('')
    setMsgText('')
    try {
      const full = await apiModeratorGetVerificationDetail(token, item.id)
      setDetail(full)
    } catch { /* ignore */ }
    finally { setDetailLoading(false) }
  }

  const handleReview = async (action) => {
    setSaving(true)
    try {
      await apiModeratorReviewVerification(token, detail.id, { action, comment })
      const updated = await apiModeratorGetVerificationDetail(token, detail.id)
      setDetail(updated)
      load()
    } catch { /* ignore */ }
    finally { setSaving(false) }
  }

  const sendMessage = async () => {
    if (!msgText.trim()) return
    setSending(true)
    try {
      await apiModeratorSendVerificationMessage(token, detail.id, msgText.trim())
      setMsgText('')
      const updated = await apiModeratorGetVerificationDetail(token, detail.id)
      setDetail(updated)
    } catch { /* ignore */ }
    finally { setSending(false) }
  }

  const handleMsgKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div className="mod-tab">
      <div className="mod-tab__filters">
        {['', 'PENDING', 'APPROVED', 'REJECTED'].map(s => (
          <button key={s} className={`mod-filter-btn ${filter === s ? 'mod-filter-btn--active' : ''}`} onClick={() => setFilter(s)}>
            {s || 'Все'}
          </button>
        ))}
      </div>

      {loading ? <div className="mod-loader">Загрузка…</div> : (
        <div className="mod-list">
          {items.length === 0 && <div className="mod-empty">Нет заявок</div>}
          {items.map(item => (
            <div key={item.id} className="mod-card" onClick={() => openDetail(item)}>
              <div className="mod-card__row">
                <div className="mod-card__title">{item.brand_name || '—'}</div>
                <span className={`mod-badge mod-badge--${STATUS_COLORS[item.status] || 'gray'}`}>
                  {STATUS_LABELS[item.status] || item.status}
                </span>
              </div>
              <div className="mod-card__meta">
                {item.owner_email || '—'} · {new Date(item.created_at).toLocaleDateString('ru')}
                {item.docs_count > 0 && ` · 📎 ${item.docs_count} файл(а)`}
              </div>
              {item.comment && <div className="mod-card__note">💬 {item.comment}</div>}
            </div>
          ))}
        </div>
      )}

      {detail && (
        <div className="mod-modal" onClick={() => setDetail(null)}>
          <div className="mod-modal__box mod-modal__box--chat" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="mod-modal__header">
              <div>
                <h3>{detail.brand_name}</h3>
                <span className={`mod-badge mod-badge--${STATUS_COLORS[detail.status] || 'gray'}`} style={{ fontSize: 11 }}>
                  {STATUS_LABELS[detail.status] || detail.status}
                </span>
              </div>
              <button className="mod-modal__close" onClick={() => setDetail(null)}>✕</button>
            </div>

            {detailLoading ? (
              <div className="mod-loader" style={{ padding: 32 }}>Загрузка…</div>
            ) : (
              <>
                {/* Documents */}
                {detail.documents?.length > 0 && (
                  <div className="mod-modal__docs">
                    <div className="mod-modal__docs-title">📎 Документы</div>
                    <div className="mod-docs">
                      {detail.documents.map(d => (
                        <a key={d.id} href={d.file} target="_blank" rel="noopener noreferrer" className="mod-doc-link">
                          📄 {d.name}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chat messages */}
                <div className="mod-chat" ref={el => { chatRef.current = el }}>
                  {detail.messages?.length === 0 && (
                    <div className="mod-chat__empty">Сообщений пока нет</div>
                  )}
                  {detail.messages?.map(msg => {
                    const isMod = msg.sender_role === 'MODERATOR'
                    return (
                      <div key={msg.id} className={`mod-msg ${isMod ? 'mod-msg--out' : 'mod-msg--in'}`}>
                        <div className="mod-msg__bubble">
                          <div className="mod-msg__sender">
                            {isMod ? '🛡️ Вы' : `👤 ${msg.sender_username}`}
                          </div>
                          {msg.text && <div className="mod-msg__text">{msg.text}</div>}
                          {msg.file && (
                            <a href={msg.file} target="_blank" rel="noopener noreferrer" className="mod-msg__file">
                              📎 {msg.file_name || 'Файл'}
                            </a>
                          )}
                          <div className="mod-msg__time">
                            {new Date(msg.created_at).toLocaleString('ru', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                            {msg.is_edited && ' · изменено'}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Actions: approve/reject */}
                {detail.status === 'PENDING' && (
                  <div className="mod-modal__review">
                    <textarea
                      className="mod-textarea"
                      placeholder="Комментарий к решению (необязательно)"
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      rows={2}
                    />
                    <div className="mod-modal__actions">
                      <button className="mod-btn mod-btn--green" disabled={saving} onClick={() => handleReview('approve')}>
                        {saving ? '…' : '✅ Одобрить'}
                      </button>
                      <button className="mod-btn mod-btn--red" disabled={saving} onClick={() => handleReview('reject')}>
                        {saving ? '…' : '❌ Отклонить'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Message input */}
                <div className="mod-chat__input">
                  <textarea
                    className="mod-chat__textarea"
                    placeholder="Написать сообщение… (Enter — отправить)"
                    value={msgText}
                    onChange={e => setMsgText(e.target.value)}
                    onKeyDown={handleMsgKey}
                    rows={2}
                  />
                  <button className="mod-chat__send" onClick={sendMessage} disabled={sending || !msgText.trim()}>
                    {sending ? '…' : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="22" y1="2" x2="11" y2="13"/>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Posts Tab ─────────────────────────────────────────────────────────────────
function PostsTab({ token }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [toggling, setToggling] = useState(null)
  const mt = useModT()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = filter === 'blocked' ? { blocked: true } : filter === 'active' ? { blocked: false } : {}
      const data = await apiModeratorGetPosts(token, params)
      setItems(data)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [token, filter])

  useEffect(() => { load() }, [load])

  const toggleBlock = async (post) => {
    setToggling(post.id)
    try {
      await apiModeratorBlockPost(token, post.id, !post.is_blocked)
      setItems(prev => prev.map(p => p.id === post.id ? { ...p, is_blocked: !p.is_blocked } : p))
    } catch { /* ignore */ }
    finally { setToggling(null) }
  }

  return (
    <div className="mod-tab">
      <div className="mod-tab__filters">
        {[{ v: '', l: 'Все' }, { v: 'active', l: 'Активные' }, { v: 'blocked', l: 'Заблокированные' }].map(f => (
          <button key={f.v} className={`mod-filter-btn ${filter === f.v ? 'mod-filter-btn--active' : ''}`} onClick={() => setFilter(f.v)}>
            {mt(f.l)}
          </button>
        ))}
      </div>

      {loading ? <div className="mod-loader">{mt('Загрузка…')}</div> : (
        <div className="mod-list">
          {items.length === 0 && <div className="mod-empty">{mt('Нет постов')}</div>}
          {items.map(post => (
            <div key={post.id} className={`mod-card ${post.is_blocked ? 'mod-card--blocked' : ''}`}>
              <div className="mod-card__row">
                <div className="mod-card__title">{post.business?.brand_name}</div>
                <span className={`mod-badge ${post.is_blocked ? 'mod-badge--red' : 'mod-badge--green'}`}>
                  {post.is_blocked ? mt('Заблокирован') : mt('Активен')}
                </span>
              </div>
              <div className="mod-card__text">{post.text || <i>{mt('Без текста')}</i>}</div>
              {post.media && (
                <div className="mod-card__media">
                  {post.media_type === 'IMAGE'
                    ? <img src={post.media} alt="" className="mod-card__img" />
                    : <video src={post.media} className="mod-card__img" controls />
                  }
                </div>
              )}
              <div className="mod-card__meta">
                {new Date(post.created_at).toLocaleString('ru')}
                {post.is_blocked && post.blocked_by && ` · ${mt('Заблокировал:')} ${post.blocked_by}`}
              </div>
              <div className="mod-card__actions">
                <button
                  className={`mod-btn ${post.is_blocked ? 'mod-btn--green' : 'mod-btn--red'}`}
                  disabled={toggling === post.id}
                  onClick={() => toggleBlock(post)}
                >
                  {toggling === post.id ? '…' : post.is_blocked ? mt('🔓 Разблокировать') : mt('🚫 Заблокировать')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Tweets Tab (text-only posts) ──────────────────────────────────────────────
function TweetsTab({ token }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [toggling, setToggling] = useState(null)
  const mt = useModT()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = filter === 'blocked' ? { blocked: true } : filter === 'active' ? { blocked: false } : {}
      const data = await apiModeratorGetPosts(token, params)
      setItems((data || []).filter(p => !p.media))
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [token, filter])

  useEffect(() => { load() }, [load])

  const toggleBlock = async (post) => {
    setToggling(post.id)
    try {
      await apiModeratorBlockPost(token, post.id, !post.is_blocked)
      setItems(prev => prev.map(p => p.id === post.id ? { ...p, is_blocked: !p.is_blocked } : p))
    } catch { /* ignore */ }
    finally { setToggling(null) }
  }

  return (
    <div className="mod-tab">
      <div className="mod-tab__filters">
        {[{ v: '', l: 'Все' }, { v: 'active', l: 'Активные' }, { v: 'blocked', l: 'Заблокированные' }].map(f => (
          <button key={f.v} className={`mod-filter-btn ${filter === f.v ? 'mod-filter-btn--active' : ''}`} onClick={() => setFilter(f.v)}>
            {mt(f.l)}
          </button>
        ))}
      </div>

      {loading ? <div className="mod-loader">{mt('Загрузка…')}</div> : (
        <div className="mod-list">
          {items.length === 0 && <div className="mod-empty">{mt('Нет твитов')}</div>}
          {items.map(post => (
            <div key={post.id} className={`mod-card ${post.is_blocked ? 'mod-card--blocked' : ''}`}>
              <div className="mod-card__row">
                <div className="mod-card__title">🐦 {post.business?.brand_name}</div>
                <span className={`mod-badge ${post.is_blocked ? 'mod-badge--red' : 'mod-badge--green'}`}>
                  {post.is_blocked ? mt('Заблокирован') : mt('Активен')}
                </span>
              </div>
              <div className="mod-card__text">{post.text || <i>{mt('Без текста')}</i>}</div>
              <div className="mod-card__meta">
                {new Date(post.created_at).toLocaleString('ru')}
                {post.is_blocked && post.blocked_by && ` · ${mt('Заблокировал:')} ${post.blocked_by}`}
              </div>
              <div className="mod-card__actions">
                <button
                  className={`mod-btn ${post.is_blocked ? 'mod-btn--green' : 'mod-btn--red'}`}
                  disabled={toggling === post.id}
                  onClick={() => toggleBlock(post)}
                >
                  {toggling === post.id ? '…' : post.is_blocked ? mt('🔓 Разблокировать') : mt('🚫 Заблокировать')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Complaints Tab ────────────────────────────────────────────────────────────
function ComplaintsTab({ token }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('PENDING')
  const [selected, setSelected] = useState(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiModeratorGetComplaints(token, { status: filter || undefined })
      setItems(data)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [token, filter])

  useEffect(() => { load() }, [load])

  const handleResolve = async (status) => {
    setSaving(true)
    try {
      await apiModeratorResolveComplaint(token, selected.id, { status, resolution_note: note })
      setSelected(null)
      setNote('')
      load()
    } catch { /* ignore */ }
    finally { setSaving(false) }
  }

  return (
    <div className="mod-tab">
      <div className="mod-tab__filters">
        {[{ v: '', l: 'Все' }, { v: 'PENDING', l: 'Ожидают' }, { v: 'RESOLVED', l: 'Решены' }, { v: 'REJECTED', l: 'Отклонены' }].map(f => (
          <button key={f.v} className={`mod-filter-btn ${filter === f.v ? 'mod-filter-btn--active' : ''}`} onClick={() => setFilter(f.v)}>
            {f.l}
          </button>
        ))}
      </div>

      {loading ? <div className="mod-loader">Загрузка…</div> : (
        <div className="mod-list">
          {items.length === 0 && <div className="mod-empty">Нет жалоб</div>}
          {items.map(c => (
            <div key={c.id} className="mod-card" onClick={() => { setSelected(c); setNote('') }}>
              <div className="mod-card__row">
                <div className="mod-card__title">{REASON_LABELS[c.reason] || c.reason}</div>
                <span className={`mod-badge mod-badge--${STATUS_COLORS[c.status] || 'gray'}`}>
                  {STATUS_LABELS[c.status] || c.status}
                </span>
              </div>
              <div className="mod-card__text">{c.description || <i>Без описания</i>}</div>
              <div className="mod-card__meta">
                От: {c.reporter?.username || c.reporter?.email} · {new Date(c.created_at).toLocaleDateString('ru')}
                {c.post && ` · Пост: ${c.post.business_name}`}
                {c.business && ` · Бизнес: ${c.business.brand_name}`}
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="mod-modal" onClick={() => setSelected(null)}>
          <div className="mod-modal__box" onClick={e => e.stopPropagation()}>
            <div className="mod-modal__header">
              <h3>{REASON_LABELS[selected.reason]}</h3>
              <button className="mod-modal__close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="mod-modal__body">
              <p><b>От:</b> {selected.reporter?.email}</p>
              <p><b>Описание:</b> {selected.description || '—'}</p>
              {selected.post && <p><b>Пост:</b> {selected.post.text}</p>}
              {selected.business && <p><b>Бизнес:</b> {selected.business.brand_name}</p>}
              {selected.status === 'PENDING' && (
                <>
                  <textarea
                    className="mod-textarea"
                    placeholder="Заметка (необязательно)"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    rows={3}
                  />
                  <div className="mod-modal__actions">
                    <button className="mod-btn mod-btn--green" disabled={saving} onClick={() => handleResolve('RESOLVED')}>
                      {saving ? '…' : '✅ Решено'}
                    </button>
                    <button className="mod-btn mod-btn--gray" disabled={saving} onClick={() => handleResolve('REJECTED')}>
                      {saving ? '…' : '❌ Отклонить'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tariffs Tab ───────────────────────────────────────────────────────────────
function TariffsTab({ token }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [planType, setPlanType] = useState('PRO')
  const [planPeriod, setPlanPeriod] = useState('MONTH')
  const [saving, setSaving] = useState(false)
  const [assignMsg, setAssignMsg] = useState(null) // { ok: bool, text: string }
  const [verifying, setVerifying] = useState(false)
  const [blocking, setBlocking] = useState(false)
  const [blockDuration, setBlockDuration] = useState('permanent')
  const [customBlockDate, setCustomBlockDate] = useState('')
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [blockingProduct, setBlockingProduct] = useState(null)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiModeratorGetBusinesses(token)
      setItems(data)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [token])

  useEffect(() => { load() }, [load])

  const openBusiness = (b) => {
    setSelected(b)
    setPlanType(b.plan_type || 'PRO')
    setPlanPeriod('MONTH')
    setBlockDuration('permanent')
    setCustomBlockDate('')
    setProducts([])
    setProductsLoading(true)
    apiModeratorGetBusinessProducts(token, b.id)
      .then(data => setProducts(data))
      .catch(() => setProducts([]))
      .finally(() => setProductsLoading(false))
  }

  const handleAssign = async () => {
    setSaving(true)
    setAssignMsg(null)
    try {
      const payload = planType === 'FREE' ? { plan_type: 'FREE' } : { plan_type: planType, plan_period: planPeriod }
      const res = await apiModeratorAssignTariff(token, selected.id, payload)
      setSelected(s => ({ ...s, plan_type: res.plan_type, plan_period: res.plan_period, plan_expires_at: res.plan_expires_at }))
      setItems(prev => prev.map(b => b.id === selected.id ? { ...b, plan_type: res.plan_type } : b))
      setAssignMsg({ ok: true, text: `✅ Тариф ${res.plan_type} назначен!` })
      load()
    } catch (e) {
      setAssignMsg({ ok: false, text: `❌ ${e.message || 'Ошибка при назначении тарифа'}` })
    }
    finally { setSaving(false) }
  }

  const handleToggleVerify = async () => {
    setVerifying(true)
    try {
      const res = await apiModeratorToggleVerify(token, selected.id)
      setSelected(s => ({ ...s, is_verified: res.is_verified }))
      setItems(prev => prev.map(b => b.id === selected.id ? { ...b, is_verified: res.is_verified } : b))
    } catch { /* ignore */ }
    finally { setVerifying(false) }
  }

  const handleToggleBlock = async () => {
    setBlocking(true)
    try {
      let blockedUntil = undefined
      if (!selected.is_blocked) {
        if (blockDuration === 'permanent') {
          blockedUntil = null
        } else if (blockDuration === '1w') {
          blockedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        } else if (blockDuration === '1m') {
          blockedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        } else if (blockDuration === '3m') {
          blockedUntil = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
        } else if (blockDuration === 'custom') {
          blockedUntil = customBlockDate ? new Date(customBlockDate + 'T23:59:59').toISOString() : null
        }
      }
      const res = await apiModeratorBlockBusiness(token, selected.id, !selected.is_blocked, blockedUntil)
      setSelected(s => ({
        ...s,
        is_blocked: res.is_blocked,
        blocked_at: res.blocked_at,
        blocked_until: res.blocked_until,
        is_currently_blocked: res.is_currently_blocked,
      }))
      setItems(prev => prev.map(b => b.id === selected.id ? {
        ...b,
        is_blocked: res.is_blocked,
        blocked_until: res.blocked_until,
        is_currently_blocked: res.is_currently_blocked,
      } : b))
    } catch { /* ignore */ }
    finally { setBlocking(false) }
  }

  const handleToggleProduct = async (product) => {
    setBlockingProduct(product.id)
    try {
      await apiModeratorBlockProduct(token, product.id, !product.is_blocked)
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_blocked: !p.is_blocked } : p))
    } catch { /* ignore */ }
    finally { setBlockingProduct(null) }
  }

  const filtered = items.filter(b => b.brand_name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="mod-tab">
      <div className="mod-tab__search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          className="mod-search-input"
          placeholder="Поиск бизнеса…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? <div className="mod-loader">Загрузка…</div> : (
        <div className="mod-list">
          {filtered.length === 0 && <div className="mod-empty">Нет бизнесов</div>}
          {filtered.map(b => (
            <div key={b.id} className="mod-card" onClick={() => openBusiness(b)}>
              <div className="mod-card__row">
                <div className="mod-card__biz">
                  {b.logo && <img src={b.logo} alt="" className="mod-card__logo" />}
                  <div>
                    <div className="mod-card__title">{b.brand_name}</div>
                    <div className="mod-card__meta">{b.owner_email}</div>
                  </div>
                </div>
                <div className="mod-card__plan-info">
                  <span className={`mod-badge mod-badge--${PLAN_COLORS[b.plan_type] || 'gray'}`}>
                    {PLAN_LABELS[b.plan_type] || b.plan_type}
                  </span>
                  {b.is_verified && <span className="mod-badge mod-badge--teal">✓ Верифицирован</span>}
                  {b.is_blocked && <span className="mod-badge mod-badge--red">🚫 Заблокирован</span>}
                </div>
              </div>
              {b.plan_expires_at && (
                <div className="mod-card__meta" style={{ marginTop: 6 }}>
                  Истекает: {new Date(b.plan_expires_at).toLocaleDateString('ru')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="mod-modal" onClick={() => setSelected(null)}>
          <div className="mod-modal__box" onClick={e => e.stopPropagation()}>
            <div className="mod-modal__header">
              <h3>{selected.brand_name}</h3>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  className="mod-btn mod-btn--gray"
                  style={{ fontSize: 12, padding: '4px 10px' }}
                  onClick={() => window.open(`/business/${selected.id}`, '_blank')}
                  title="Открыть профиль"
                >
                  👁 Профиль
                </button>
                <button className="mod-modal__close" onClick={() => setSelected(null)}>✕</button>
              </div>
            </div>
            <div className="mod-modal__body">

              {/* ── Блокировка бизнеса ── */}
              <div style={{ marginBottom: 16, padding: '12px 14px', background: selected.is_blocked ? 'rgba(229,57,53,0.08)' : 'var(--bg-tertiary)', borderRadius: 10, border: selected.is_blocked ? '1px solid rgba(229,57,53,0.3)' : '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
                  {selected.is_blocked ? '🚫 Бизнес заблокирован' : '✅ Бизнес активен'}
                </div>

                {selected.is_blocked ? (
                  <div>
                    {selected.blocked_at && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                        Заблокирован с {new Date(selected.blocked_at).toLocaleDateString('ru')}
                      </div>
                    )}
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: selected.blocked_until ? '#f8a04e' : '#f87171' }}>
                      {selected.blocked_until
                        ? `Блок до: ${new Date(selected.blocked_until).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}`
                        : 'Блок: Бессрочно'}
                    </div>
                    <button
                      className="mod-btn mod-btn--green"
                      disabled={blocking}
                      onClick={handleToggleBlock}
                      style={{ minWidth: 160 }}
                    >
                      {blocking ? '…' : '🔓 Разблокировать'}
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Срок блокировки:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                      {[
                        { v: '1w',       l: '1 неделя' },
                        { v: '1m',       l: '1 месяц' },
                        { v: '3m',       l: '3 месяца' },
                        { v: 'permanent', l: 'Постоянно' },
                        { v: 'custom',   l: 'Своя дата' },
                      ].map(opt => (
                        <button
                          key={opt.v}
                          className={`mod-plan-btn ${blockDuration === opt.v ? 'mod-plan-btn--active' : ''}`}
                          style={{ fontSize: 12 }}
                          onClick={() => setBlockDuration(opt.v)}
                        >
                          {opt.l}
                        </button>
                      ))}
                    </div>
                    {blockDuration === 'custom' && (
                      <input
                        type="date"
                        className="mod-search-input"
                        style={{ marginBottom: 10, padding: '6px 10px', width: '100%', boxSizing: 'border-box' }}
                        value={customBlockDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={e => setCustomBlockDate(e.target.value)}
                      />
                    )}
                    <button
                      className="mod-btn mod-btn--red"
                      disabled={blocking || (blockDuration === 'custom' && !customBlockDate)}
                      onClick={handleToggleBlock}
                      style={{ minWidth: 160 }}
                    >
                      {blocking ? '…' : '🚫 Заблокировать'}
                    </button>
                  </div>
                )}
              </div>

              {/* ── Тариф ── */}
              <p><b>Текущий тариф:</b> {PLAN_LABELS[selected.plan_type]}</p>

              <label className="mod-field__label" style={{ marginTop: 12 }}>Новый тариф</label>
              <div className="mod-plan-btns">
                {['FREE', 'PRO', 'VIP'].map(p => (
                  <button
                    key={p}
                    className={`mod-plan-btn ${planType === p ? 'mod-plan-btn--active' : ''}`}
                    onClick={() => setPlanType(p)}
                  >
                    {PLAN_LABELS[p]}
                  </button>
                ))}
              </div>

              {planType !== 'FREE' && (
                <>
                  <label className="mod-field__label" style={{ marginTop: 12 }}>Период</label>
                  <div className="mod-plan-btns">
                    {[{ v: 'MONTH', l: '1 месяц' }, { v: 'QUARTER', l: '3 месяца' }, { v: 'YEAR', l: '1 год' }].map(p => (
                      <button
                        key={p.v}
                        className={`mod-plan-btn ${planPeriod === p.v ? 'mod-plan-btn--active' : ''}`}
                        onClick={() => setPlanPeriod(p.v)}
                      >
                        {p.l}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className="mod-modal__actions" style={{ marginTop: 16, gap: 8, display: 'flex', flexWrap: 'wrap' }}>
                <button className="mod-btn mod-btn--purple" disabled={saving} onClick={handleAssign}>
                  {saving ? '…' : '💎 Назначить тариф'}
                </button>
                <button
                  className={`mod-btn ${selected.is_verified ? 'mod-btn--gray' : 'mod-btn--teal'}`}
                  disabled={verifying}
                  onClick={handleToggleVerify}
                  style={{ minWidth: 160 }}
                >
                  {verifying ? '…' : selected.is_verified ? '✓ Снять верификацию' : '✓ Верифицировать'}
                </button>
              </div>
              {assignMsg && (
                <p style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: assignMsg.ok ? '#4caf50' : '#ef4444' }}>
                  {assignMsg.text}
                </p>
              )}

              {/* ── Услуги / Продукты ── */}
              <div style={{ marginTop: 20, borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>🔧 Услуги / Продукты</div>
                {productsLoading ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Загрузка…</div>
                ) : products.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Нет услуг</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {products.map(p => (
                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-tertiary)', borderRadius: 8, border: p.is_blocked ? '1px solid rgba(229,57,53,0.3)' : '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {p.image && <img src={p.image} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6 }} />}
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: p.is_blocked ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                              {p.is_blocked && '🚫 '}{p.name}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.price}</div>
                          </div>
                        </div>
                        <button
                          className={`mod-btn ${p.is_blocked ? 'mod-btn--green' : 'mod-btn--red'}`}
                          style={{ fontSize: 12, padding: '4px 10px' }}
                          disabled={blockingProduct === p.id}
                          onClick={() => handleToggleProduct(p)}
                        >
                          {blockingProduct === p.id ? '…' : p.is_blocked ? '🔓' : '🚫'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Generic Blockable Tab ─────────────────────────────────────────────────────
function BlockableTab({ token, fetchFn, blockFn, renderTitle, renderMeta, renderExtra }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [toggling, setToggling] = useState(null)
  const mt = useModT()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = filter === 'blocked' ? { blocked: true } : filter === 'active' ? { blocked: false } : {}
      const data = await fetchFn(token, params)
      setItems(data)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [token, filter, fetchFn])

  useEffect(() => { load() }, [load])

  const toggleBlock = async (item) => {
    setToggling(item.id)
    try {
      await blockFn(token, item.id, !item.is_blocked)
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_blocked: !i.is_blocked } : i))
    } catch { /* ignore */ }
    finally { setToggling(null) }
  }

  return (
    <div className="mod-tab">
      <div className="mod-tab__filters">
        {[{ v: '', l: 'Все' }, { v: 'active', l: 'Активные' }, { v: 'blocked', l: 'Заблокированные' }].map(f => (
          <button key={f.v} className={`mod-filter-btn ${filter === f.v ? 'mod-filter-btn--active' : ''}`} onClick={() => setFilter(f.v)}>
            {mt(f.l)}
          </button>
        ))}
      </div>

      {loading ? <div className="mod-loader">{mt('Загрузка…')}</div> : (
        <div className="mod-list">
          {items.length === 0 && <div className="mod-empty">{mt('Нет данных')}</div>}
          {items.map(item => (
            <div key={item.id} className={`mod-card ${item.is_blocked ? 'mod-card--blocked' : ''}`}>
              <div className="mod-card__row">
                <div className="mod-card__title">{renderTitle(item)}</div>
                <span className={`mod-badge ${item.is_blocked ? 'mod-badge--red' : 'mod-badge--green'}`}>
                  {item.is_blocked ? mt('Заблокирован') : mt('Активен')}
                </span>
              </div>
              {renderMeta && <div className="mod-card__meta">{renderMeta(item)}</div>}
              {renderExtra && renderExtra(item)}
              {item.is_blocked && item.blocked_at && (
                <div className="mod-card__meta" style={{ color: 'rgba(248,113,113,0.7)' }}>
                  🗑️ {mt('Авто-удаление:')} {new Date(new Date(item.blocked_at).getTime() + 4*24*60*60*1000).toLocaleDateString('ru')}
                </div>
              )}
              <div className="mod-card__actions">
                <button
                  className={`mod-btn ${item.is_blocked ? 'mod-btn--green' : 'mod-btn--red'}`}
                  disabled={toggling === item.id}
                  onClick={() => toggleBlock(item)}
                >
                  {toggling === item.id ? '…' : item.is_blocked ? mt('🔓 Разблокировать') : mt('🚫 Заблокировать')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Feed Tab ──────────────────────────────────────────────────────────────────
const CONTENT_TYPE_LABELS = { post: '📝 Пост', story: '🎬 История', product: '🔧 Услуга' }
const CONTENT_TYPE_COLORS = { post: 'blue', story: 'teal', product: 'gold' }

function FeedTab({ token }) {
  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [typeFilter, setType]   = useState('')
  const [blockedFilter, setBlocked] = useState('')
  const [toggling, setToggling] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (typeFilter)    params.type    = typeFilter
      if (blockedFilter) params.blocked = blockedFilter
      const data = await apiModeratorGetFeed(token, params)
      setItems(data)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [token, typeFilter, blockedFilter])

  useEffect(() => { load() }, [load])

  const toggleBlock = async (item) => {
    setToggling(`${item.content_type}-${item.id}`)
    try {
      const endpointMap = { post: 'posts', story: 'stories', product: 'products' }
      const endpoint = endpointMap[item.content_type]
      await fetch(`${API_URL}/moderator/${endpoint}/${item.id}/block/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ blocked: !item.is_blocked }),
      })
      setItems(prev => prev.map(i =>
        i.content_type === item.content_type && i.id === item.id
          ? { ...i, is_blocked: !i.is_blocked }
          : i
      ))
    } catch { /* ignore */ }
    finally { setToggling(null) }
  }

  return (
    <div className="mod-tab">
      <div className="mod-tab__filters">
        {[{ v: '', l: 'Всё' }, { v: 'post', l: '📝 Посты' }, { v: 'story', l: '🎬 Истории' }, { v: 'product', l: '🔧 Услуги' }].map(f => (
          <button key={f.v} className={`mod-filter-btn ${typeFilter === f.v ? 'mod-filter-btn--active' : ''}`} onClick={() => setType(f.v)}>
            {f.l}
          </button>
        ))}
        <div style={{ width: 1, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
        {[{ v: '', l: 'Все' }, { v: 'false', l: 'Активные' }, { v: 'true', l: 'Заблокированные' }].map(f => (
          <button key={f.v} className={`mod-filter-btn ${blockedFilter === f.v ? 'mod-filter-btn--active' : ''}`} onClick={() => setBlocked(f.v)}>
            {f.l}
          </button>
        ))}
      </div>

      {loading ? <div className="mod-loader">Загрузка…</div> : (
        <div className="mod-list">
          {items.length === 0 && <div className="mod-empty">Лента пуста</div>}
          {items.map(item => {
            const key = `${item.content_type}-${item.id}`
            const isToggling = toggling === key
            return (
              <div key={key} className={`mod-card ${item.is_blocked ? 'mod-card--blocked' : ''}`}>
                <div className="mod-card__row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`mod-badge mod-badge--${CONTENT_TYPE_COLORS[item.content_type] || 'gray'}`} style={{ fontSize: 11 }}>
                      {CONTENT_TYPE_LABELS[item.content_type] || item.content_type}
                    </span>
                    <div className="mod-card__title">{item.title}</div>
                  </div>
                  <span className={`mod-badge ${item.is_blocked ? 'mod-badge--red' : 'mod-badge--green'}`}>
                    {item.is_blocked ? 'Заблок.' : 'Активен'}
                  </span>
                </div>

                {item.text && (
                  <div className="mod-card__text">{item.text.slice(0, 160)}{item.text.length > 160 ? '…' : ''}</div>
                )}

                {item.media && item.media_type === 'IMAGE' && (
                  <div className="mod-card__media">
                    <img src={item.media} alt="" className="mod-card__img" />
                  </div>
                )}
                {item.media && item.media_type === 'VIDEO' && (
                  <div className="mod-card__media">
                    <video src={item.media} className="mod-card__img" controls />
                  </div>
                )}

                <div className="mod-card__meta">
                  {new Date(item.created_at).toLocaleString('ru')}
                  {item.meta?.business_name && ` · ${item.meta.business_name}`}
                  {item.meta?.price && ` · ${item.meta.price} ${item.meta.currency}`}
                  {item.is_blocked && item.blocked_by && ` · Заблок.: ${item.blocked_by}`}
                </div>

                {item.is_blocked && item.blocked_at && (
                  <div className="mod-card__meta" style={{ color: 'rgba(248,113,113,0.7)' }}>
                    🗑️ Авто-удаление: {new Date(new Date(item.blocked_at).getTime() + 4*24*60*60*1000).toLocaleDateString('ru')}
                  </div>
                )}

                <div className="mod-card__actions">
                  <button
                    className={`mod-btn ${item.is_blocked ? 'mod-btn--green' : 'mod-btn--red'}`}
                    disabled={isToggling}
                    onClick={() => toggleBlock(item)}
                  >
                    {isToggling ? '…' : item.is_blocked ? '🔓 Разблокировать' : '🚫 Заблокировать'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Payments Tab ──────────────────────────────────────────────────────────────
function PaymentsTab({ token }) {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('PENDING')
  const [selected, setSelected] = useState(null)
  const [note, setNote]       = useState('')
  const [saving, setSaving]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiModeratorGetPayments(token, { status: filter || undefined })
      setItems(data)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [token, filter])

  useEffect(() => { load() }, [load])

  const handleReview = async (action) => {
    setSaving(true)
    try {
      await apiModeratorReviewPayment(token, selected.id, { action, rejection_note: note })
      setSelected(null)
      setNote('')
      load()
    } catch { /* ignore */ }
    finally { setSaving(false) }
  }

  const PERIOD_LABELS = { MONTH: '1 месяц', QUARTER: '3 месяца', YEAR: '1 год' }

  return (
    <div className="mod-tab">
      <div className="mod-tab__filters">
        {[{ v: '', l: 'Все' }, { v: 'PENDING', l: 'Ожидают' }, { v: 'APPROVED', l: 'Одобрены' }, { v: 'REJECTED', l: 'Отклонены' }].map(f => (
          <button key={f.v} className={`mod-filter-btn ${filter === f.v ? 'mod-filter-btn--active' : ''}`} onClick={() => setFilter(f.v)}>
            {f.l}
          </button>
        ))}
      </div>

      {loading ? <div className="mod-loader">Загрузка…</div> : (
        <div className="mod-list">
          {items.length === 0 && <div className="mod-empty">Нет заявок</div>}
          {items.map(p => (
            <div key={p.id} className="mod-card" onClick={() => { setSelected(p); setNote('') }}>
              <div className="mod-card__row">
                <div className="mod-card__biz">
                  {p.business?.logo && <img src={p.business.logo} alt="" className="mod-card__logo" />}
                  <div>
                    <div className="mod-card__title">{p.business?.brand_name}</div>
                    <div className="mod-card__meta">{p.business?.owner_email}</div>
                  </div>
                </div>
                <span className={`mod-badge mod-badge--${STATUS_COLORS[p.status] || 'gray'}`}>
                  {STATUS_LABELS[p.status] || p.status}
                </span>
              </div>
              <div className="mod-card__meta" style={{ marginTop: 6 }}>
                Тариф: <b>{PLAN_LABELS[p.plan_type]}</b>
                {p.plan_period && ` · ${PERIOD_LABELS[p.plan_period]}`}
                {' · '}{new Date(p.created_at).toLocaleDateString('ru')}
              </div>
              {p.message && <div className="mod-card__text">{p.message}</div>}
              {p.proof_file && (
                <a href={p.proof_file} target="_blank" rel="noopener noreferrer" className="mod-pay__proof">
                  📎 Скриншот оплаты
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="mod-modal" onClick={() => setSelected(null)}>
          <div className="mod-modal__box" onClick={e => e.stopPropagation()}>
            <div className="mod-modal__header">
              <h3>Заявка на тариф — {selected.business?.brand_name}</h3>
              <button className="mod-modal__close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="mod-modal__body">
              <p><b>Тариф:</b> {PLAN_LABELS[selected.plan_type]} {selected.plan_period ? `· ${PERIOD_LABELS[selected.plan_period]}` : ''}</p>
              <p><b>От:</b> {selected.business?.owner_email}</p>
              {selected.message && <p><b>Сообщение:</b> {selected.message}</p>}
              {selected.proof_file && (
                <div className="mod-pay__img-wrap">
                  <a href={selected.proof_file} target="_blank" rel="noopener noreferrer">
                    <img src={selected.proof_file} alt="Скриншот" className="mod-pay__img" onError={e => e.target.style.display='none'} />
                    <div className="mod-pay__proof">📎 Открыть файл</div>
                  </a>
                </div>
              )}
              {selected.reviewed_by && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Проверил: {selected.reviewed_by}</p>}
              {selected.rejection_note && <p><b>Причина отклонения:</b> {selected.rejection_note}</p>}

              {selected.status === 'PENDING' && (
                <>
                  <textarea
                    className="mod-textarea"
                    placeholder="Причина отклонения (если отклоняете)"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    rows={3}
                    style={{ marginTop: 12 }}
                  />
                  <div className="mod-modal__actions">
                    <button className="mod-btn mod-btn--green" disabled={saving} onClick={() => handleReview('approve')}>
                      {saving ? '…' : '✅ Одобрить и назначить тариф'}
                    </button>
                    <button className="mod-btn mod-btn--red" disabled={saving} onClick={() => handleReview('reject')}>
                      {saving ? '…' : '❌ Отклонить'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Profiles Tab ──────────────────────────────────────────────────────────────
function ProfilesTab({ token }) {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [roleFilter, setRoleFilter]       = useState('')
  const [blockedFilter, setBlockedFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const [toggling, setToggling] = useState(null)
  const [deactivate, setDeactivate] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (roleFilter)    params.role    = roleFilter
      if (blockedFilter) params.blocked = blockedFilter
      if (search)        params.search  = search
      const data = await apiModeratorGetUsers(token, params)
      setItems(data)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [token, roleFilter, blockedFilter, search])

  useEffect(() => {
    const t = setTimeout(() => load(), 300)
    return () => clearTimeout(t)
  }, [load])

  const toggleBlock = async (user, block) => {
    setToggling(user.id)
    try {
      const updated = await apiModeratorBlockUser(token, user.id, { blocked: block, deactivate })
      setItems(prev => prev.map(u => u.id === user.id ? { ...u, ...updated } : u))
      if (selected?.id === user.id) setSelected(prev => ({ ...prev, ...updated }))
    } catch { /* ignore */ }
    finally { setToggling(null) }
  }

  const ROLE_LABELS = { USER: 'Пользователь', BUSINESS: 'Бизнес', MODERATOR: 'Модератор' }

  return (
    <div className="mod-tab">
      <div className="mod-tab__search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          className="mod-search-input"
          placeholder="Поиск по имени или email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="mod-tab__filters">
        {[{ v: '', l: 'Все роли' }, { v: 'USER', l: 'Пользователи' }, { v: 'BUSINESS', l: 'Бизнес' }].map(f => (
          <button key={f.v} className={`mod-filter-btn ${roleFilter === f.v ? 'mod-filter-btn--active' : ''}`} onClick={() => setRoleFilter(f.v)}>
            {f.l}
          </button>
        ))}
        <div style={{ width: 1, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
        {[{ v: '', l: 'Все' }, { v: 'true', l: 'Заблокированные' }, { v: 'false', l: 'Активные' }].map(f => (
          <button key={f.v} className={`mod-filter-btn ${blockedFilter === f.v ? 'mod-filter-btn--active' : ''}`} onClick={() => setBlockedFilter(f.v)}>
            {f.l}
          </button>
        ))}
      </div>

      {loading ? <div className="mod-loader">Загрузка…</div> : (
        <div className="mod-list">
          {items.length === 0 && <div className="mod-empty">Нет пользователей</div>}
          {items.map(u => (
            <div key={u.id} className={`mod-card ${u.is_profile_blocked ? 'mod-card--blocked' : ''}`} onClick={() => { setSelected(u); setDeactivate(false) }}>
              <div className="mod-card__row">
                <div className="mod-card__biz">
                  {u.avatar
                    ? <img src={u.avatar} alt="" className="mod-card__logo mod-card__logo--round" />
                    : <div className="mod-card__avatar-placeholder">{u.username?.[0]?.toUpperCase() || '?'}</div>
                  }
                  <div>
                    <div className="mod-card__title">{u.username}</div>
                    <div className="mod-card__meta">{u.email}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span className={`mod-badge mod-badge--${u.role === 'BUSINESS' ? 'blue' : u.role === 'MODERATOR' ? 'teal' : 'gray'}`}>
                    {ROLE_LABELS[u.role] || u.role}
                  </span>
                  {u.is_profile_blocked && <span className="mod-badge mod-badge--red">Заблокирован</span>}
                  {!u.is_active && <span className="mod-badge mod-badge--red">Деактивирован</span>}
                </div>
              </div>
              <div className="mod-card__meta" style={{ marginTop: 4 }}>
                {u.city && `${u.city} · `}
                Рег: {new Date(u.date_joined).toLocaleDateString('ru')}
                {u.complaints_count > 0 && <span style={{ color: '#f87171', marginLeft: 8 }}>⚠️ {u.complaints_count} жалоб(ы)</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="mod-modal" onClick={() => setSelected(null)}>
          <div className="mod-modal__box" onClick={e => e.stopPropagation()}>
            <div className="mod-modal__header">
              <h3>{selected.username}</h3>
              <button className="mod-modal__close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="mod-modal__body">
              <p><b>Email:</b> {selected.email}</p>
              <p><b>Роль:</b> {ROLE_LABELS[selected.role] || selected.role}</p>
              {selected.city && <p><b>Город:</b> {selected.city}</p>}
              <p><b>Регистрация:</b> {new Date(selected.date_joined).toLocaleDateString('ru')}</p>
              {selected.last_seen && <p><b>Был в сети:</b> {new Date(selected.last_seen).toLocaleString('ru')}</p>}
              <p><b>Профиль заблокирован:</b> {selected.is_profile_blocked ? 'Да' : 'Нет'}</p>
              <p><b>Аккаунт активен:</b> {selected.is_active ? 'Да' : 'Нет'}</p>
              {selected.profile_blocked_by && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Заблокировал: {selected.profile_blocked_by}</p>}

              {selected.role !== 'MODERATOR' && (
                <>
                  <label className="mod-field__label" style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={deactivate}
                      onChange={e => setDeactivate(e.target.checked)}
                      style={{ accentColor: '#f87171' }}
                    />
                    Также деактивировать аккаунт (запрет входа)
                  </label>
                  <div className="mod-modal__actions" style={{ marginTop: 12 }}>
                    {selected.is_profile_blocked ? (
                      <button
                        className="mod-btn mod-btn--green"
                        disabled={toggling === selected.id}
                        onClick={() => toggleBlock(selected, false)}
                      >
                        {toggling === selected.id ? '…' : '🔓 Разблокировать профиль'}
                      </button>
                    ) : (
                      <button
                        className="mod-btn mod-btn--red"
                        disabled={toggling === selected.id}
                        onClick={() => toggleBlock(selected, true)}
                      >
                        {toggling === selected.id ? '…' : '🚫 Заблокировать профиль'}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function ModeratorDashboardPage() {
  const [tab, setTab] = useState('feed')
  const { token, modUser, logout } = useModeratorAuth()
  const mt = useModT()
  const { lang, setLang } = useLanguage() || { lang: 'ru', setLang: () => {} }

  if (!token) return null

  return (
    <div className="mod-dash">
      {/* Sidebar */}
      <aside className="mod-sidebar">
        <div className="mod-sidebar__brand">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span>{mt('Модератор')}</span>
        </div>

        <nav className="mod-nav">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`mod-nav__item ${tab === t.id ? 'mod-nav__item--active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <span className="mod-nav__icon">{t.icon}</span>
              <span>{mt(t.label)}</span>
            </button>
          ))}
        </nav>

        <div className="mod-sidebar__langs">
          {[['ru','RU'],['en','EN'],['tr','TR']].map(([code, label]) => (
            <button
              key={code}
              className={`mod-sidebar__lang-btn ${lang === code ? 'mod-sidebar__lang-btn--active' : ''}`}
              onClick={() => setLang(code)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mod-sidebar__user">
          <div className="mod-sidebar__avatar">
            {modUser?.username?.[0]?.toUpperCase() || 'M'}
          </div>
          <div className="mod-sidebar__info">
            <div className="mod-sidebar__name">{modUser?.username}</div>
            <div className="mod-sidebar__role">{mt('Модератор')}</div>
          </div>
          <button className="mod-sidebar__logout" onClick={logout} title={mt('Выйти')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="mod-main">
        <div className="mod-main__header">
          <div>
            <h1 className="mod-main__title">{mt(TABS.find(t => t.id === tab)?.label)}</h1>
            <p className="mod-main__subtitle">{mt('Панель управления контентом')}</p>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="mod-mobile-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`mod-mobile-tab ${tab === t.id ? 'mod-mobile-tab--active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.icon} {mt(t.label)}
            </button>
          ))}
        </div>

        <div className="mod-content">
          {tab === 'feed'         && <FeedTab         token={token} />}
          {tab === 'verification' && <VerificationTab token={token} />}
          {tab === 'posts'        && <PostsTab        token={token} />}
          {tab === 'tweets'       && <TweetsTab       token={token} />}
          {tab === 'complaints'   && <ComplaintsTab   token={token} />}
          {tab === 'tariffs'      && <TariffsTab      token={token} />}
          {tab === 'surveys'      && <ModeratorSurveysTab token={token} />}
          {tab === 'stories' && (
            <BlockableTab
              token={token}
              fetchFn={apiModeratorGetStories}
              blockFn={apiModeratorBlockStory}
              renderTitle={i => i.caption || `История #${i.id}`}
              renderMeta={i => `${i.author?.username} · ${new Date(i.created_at).toLocaleString('ru')}`}
              renderExtra={i => i.media && i.media_type === 'IMAGE' && (
                <div className="mod-card__media"><img src={i.media} alt="" className="mod-card__img" /></div>
              )}
            />
          )}
          {tab === 'comments' && (
            <BlockableTab
              token={token}
              fetchFn={apiModeratorGetComments}
              blockFn={apiModeratorBlockComment}
              renderTitle={i => i.text?.slice(0, 80) || `Комментарий #${i.id}`}
              renderMeta={i => `${i.author?.username} · история #${i.story_id} · ${new Date(i.created_at).toLocaleString('ru')}`}
            />
          )}
          {tab === 'products' && (
            <BlockableTab
              token={token}
              fetchFn={apiModeratorGetProducts}
              blockFn={apiModeratorBlockProduct}
              renderTitle={i => i.name}
              renderMeta={i => `${i.business?.brand_name} · ${i.product_type} · ${i.price ? `${i.price} ${i.currency}` : 'Без цены'}`}
              renderExtra={i => i.description && <div className="mod-card__text">{i.description}</div>}
            />
          )}
          {tab === 'reviews' && (
            <BlockableTab
              token={token}
              fetchFn={apiModeratorGetReviews}
              blockFn={apiModeratorBlockReview}
              renderTitle={i => `${'★'.repeat(i.rating)}${'☆'.repeat(5 - i.rating)} — ${i.author?.username}`}
              renderMeta={i => `${i.business?.brand_name || i.product?.name || '—'} · ${new Date(i.created_at).toLocaleString('ru')}`}
              renderExtra={i => i.text && <div className="mod-card__text">{i.text}</div>}
            />
          )}
          {tab === 'payments'  && <PaymentsTab  token={token} />}
          {tab === 'profiles'  && <ProfilesTab  token={token} />}
        </div>
      </main>
    </div>
  )
}
