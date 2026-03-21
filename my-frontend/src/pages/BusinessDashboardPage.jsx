import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'
import './BusinessDashboardPage.css'

const BASE = import.meta.env.PROD
  ? 'https://api.101-school.uz/api'
  : 'http://127.0.0.1:8000/api'

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

function ProductRow({ p, rank }) {
  const maxViews = 1
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

export default function BusinessDashboardPage() {
  const navigate = useNavigate()
  const { user, tokens } = useAuth()
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    if (user.role !== 'BUSINESS') { navigate('/'); return }
    if (!tokens?.access) return

    fetch(`${BASE}/businesses/me/stats/`, {
      headers: { Authorization: `Bearer ${tokens.access}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setStats(data))
      .catch(() => setError('Не удалось загрузить статистику'))
      .finally(() => setLoading(false))
  }, [tokens?.access])

  return (
    <div className="biz-dashboard-page">
      <Header />
      <main className="biz-dashboard">
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
                  <p>Нет товаров. Добавьте их через страницу профиля бизнеса.</p>
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
    </div>
  )
}
