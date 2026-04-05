import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  apiModeratorGetVerifications, apiModeratorReviewVerification,
  apiModeratorGetPosts, apiModeratorBlockPost,
  apiModeratorGetComplaints, apiModeratorResolveComplaint,
  apiModeratorGetBusinesses, apiModeratorAssignTariff,
  apiModeratorGetStories, apiModeratorBlockStory,
  apiModeratorGetComments, apiModeratorBlockComment,
  apiModeratorGetProducts, apiModeratorBlockProduct,
  apiModeratorGetReviews, apiModeratorBlockReview,
} from '../api/moderatorApi'
import './ModeratorDashboardPage.css'

const TABS = [
  { id: 'verification', label: 'Верификация', icon: '🛡️' },
  { id: 'posts',        label: 'Посты',        icon: '📝' },
  { id: 'stories',      label: 'Истории',      icon: '🎬' },
  { id: 'comments',     label: 'Комментарии',  icon: '💬' },
  { id: 'products',     label: 'Продукты',     icon: '🛍️' },
  { id: 'reviews',      label: 'Отзывы',       icon: '⭐' },
  { id: 'complaints',   label: 'Жалобы',       icon: '🚨' },
  { id: 'tariffs',      label: 'Тарифы',       icon: '💎' },
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
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiModeratorGetVerifications(token, { status: filter || undefined })
      setItems(data)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [token, filter])

  useEffect(() => { load() }, [load])

  const handleReview = async (status) => {
    setSaving(true)
    try {
      await apiModeratorReviewVerification(token, selected.id, { status, comment })
      setSelected(null)
      setComment('')
      load()
    } catch { /* ignore */ }
    finally { setSaving(false) }
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
            <div key={item.id} className="mod-card" onClick={() => { setSelected(item); setComment('') }}>
              <div className="mod-card__row">
                <div className="mod-card__title">{item.business?.brand_name || '—'}</div>
                <span className={`mod-badge mod-badge--${STATUS_COLORS[item.status] || 'gray'}`}>
                  {STATUS_LABELS[item.status] || item.status}
                </span>
              </div>
              <div className="mod-card__meta">
                {item.business?.owner_email || item.owner_email || '—'} · {new Date(item.created_at).toLocaleDateString('ru')}
              </div>
              {item.comment && <div className="mod-card__note">💬 {item.comment}</div>}
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="mod-modal" onClick={() => setSelected(null)}>
          <div className="mod-modal__box" onClick={e => e.stopPropagation()}>
            <div className="mod-modal__header">
              <h3>{selected.business?.brand_name}</h3>
              <button className="mod-modal__close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="mod-modal__body">
              <p><b>Статус:</b> {STATUS_LABELS[selected.status] || selected.status}</p>
              <p><b>Создано:</b> {new Date(selected.created_at).toLocaleString('ru')}</p>
              {selected.documents?.length > 0 && (
                <div className="mod-docs">
                  {selected.documents.map(d => (
                    <a key={d.id} href={d.file} target="_blank" rel="noopener noreferrer" className="mod-doc-link">
                      📄 {d.name}
                    </a>
                  ))}
                </div>
              )}
              {selected.status === 'PENDING' && (
                <>
                  <textarea
                    className="mod-textarea"
                    placeholder="Комментарий (необязательно)"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    rows={3}
                  />
                  <div className="mod-modal__actions">
                    <button className="mod-btn mod-btn--green" disabled={saving} onClick={() => handleReview('APPROVED')}>
                      {saving ? '…' : '✅ Одобрить'}
                    </button>
                    <button className="mod-btn mod-btn--red" disabled={saving} onClick={() => handleReview('REJECTED')}>
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

// ── Posts Tab ─────────────────────────────────────────────────────────────────
function PostsTab({ token }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [toggling, setToggling] = useState(null)

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
            {f.l}
          </button>
        ))}
      </div>

      {loading ? <div className="mod-loader">Загрузка…</div> : (
        <div className="mod-list">
          {items.length === 0 && <div className="mod-empty">Нет постов</div>}
          {items.map(post => (
            <div key={post.id} className={`mod-card ${post.is_blocked ? 'mod-card--blocked' : ''}`}>
              <div className="mod-card__row">
                <div className="mod-card__title">{post.business?.brand_name}</div>
                <span className={`mod-badge ${post.is_blocked ? 'mod-badge--red' : 'mod-badge--green'}`}>
                  {post.is_blocked ? 'Заблокирован' : 'Активен'}
                </span>
              </div>
              <div className="mod-card__text">{post.text || <i>Без текста</i>}</div>
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
                {post.is_blocked && post.blocked_by && ` · Заблокировал: ${post.blocked_by}`}
              </div>
              <div className="mod-card__actions">
                <button
                  className={`mod-btn ${post.is_blocked ? 'mod-btn--green' : 'mod-btn--red'}`}
                  disabled={toggling === post.id}
                  onClick={() => toggleBlock(post)}
                >
                  {toggling === post.id ? '…' : post.is_blocked ? '🔓 Разблокировать' : '🚫 Заблокировать'}
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

  const handleAssign = async () => {
    setSaving(true)
    try {
      const payload = planType === 'FREE' ? { plan_type: 'FREE' } : { plan_type: planType, plan_period: planPeriod }
      await apiModeratorAssignTariff(token, selected.id, payload)
      setSelected(null)
      load()
    } catch { /* ignore */ }
    finally { setSaving(false) }
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
            <div key={b.id} className="mod-card" onClick={() => { setSelected(b); setPlanType(b.plan_type || 'PRO'); setPlanPeriod('MONTH') }}>
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
              <h3>Тариф: {selected.brand_name}</h3>
              <button className="mod-modal__close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="mod-modal__body">
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

              <div className="mod-modal__actions" style={{ marginTop: 16 }}>
                <button className="mod-btn mod-btn--purple" disabled={saving} onClick={handleAssign}>
                  {saving ? '…' : '💎 Назначить тариф'}
                </button>
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
            {f.l}
          </button>
        ))}
      </div>

      {loading ? <div className="mod-loader">Загрузка…</div> : (
        <div className="mod-list">
          {items.length === 0 && <div className="mod-empty">Нет записей</div>}
          {items.map(item => (
            <div key={item.id} className={`mod-card ${item.is_blocked ? 'mod-card--blocked' : ''}`}>
              <div className="mod-card__row">
                <div className="mod-card__title">{renderTitle(item)}</div>
                <span className={`mod-badge ${item.is_blocked ? 'mod-badge--red' : 'mod-badge--green'}`}>
                  {item.is_blocked ? 'Заблокирован' : 'Активен'}
                </span>
              </div>
              {renderMeta && <div className="mod-card__meta">{renderMeta(item)}</div>}
              {renderExtra && renderExtra(item)}
              {item.is_blocked && item.blocked_at && (
                <div className="mod-card__meta" style={{ color: 'rgba(248,113,113,0.7)' }}>
                  🗑️ Авто-удаление: {new Date(new Date(item.blocked_at).getTime() + 4*24*60*60*1000).toLocaleDateString('ru')}
                </div>
              )}
              <div className="mod-card__actions">
                <button
                  className={`mod-btn ${item.is_blocked ? 'mod-btn--green' : 'mod-btn--red'}`}
                  disabled={toggling === item.id}
                  onClick={() => toggleBlock(item)}
                >
                  {toggling === item.id ? '…' : item.is_blocked ? '🔓 Разблокировать' : '🚫 Заблокировать'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function ModeratorDashboardPage() {
  const [tab, setTab] = useState('verification')
  const { token, modUser, logout } = useModeratorAuth()

  if (!token) return null

  return (
    <div className="mod-dash">
      {/* Sidebar */}
      <aside className="mod-sidebar">
        <div className="mod-sidebar__brand">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span>Модератор</span>
        </div>

        <nav className="mod-nav">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`mod-nav__item ${tab === t.id ? 'mod-nav__item--active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <span className="mod-nav__icon">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        <div className="mod-sidebar__user">
          <div className="mod-sidebar__avatar">
            {modUser?.username?.[0]?.toUpperCase() || 'M'}
          </div>
          <div className="mod-sidebar__info">
            <div className="mod-sidebar__name">{modUser?.username}</div>
            <div className="mod-sidebar__role">Модератор</div>
          </div>
          <button className="mod-sidebar__logout" onClick={logout} title="Выйти">
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
            <h1 className="mod-main__title">{TABS.find(t => t.id === tab)?.label}</h1>
            <p className="mod-main__subtitle">Панель управления контентом</p>
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
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="mod-content">
          {tab === 'verification' && <VerificationTab token={token} />}
          {tab === 'posts'        && <PostsTab        token={token} />}
          {tab === 'complaints'   && <ComplaintsTab   token={token} />}
          {tab === 'tariffs'      && <TariffsTab      token={token} />}
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
        </div>
      </main>
    </div>
  )
}
