import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'
import { apiGetInquiries } from '../api/businessApi'
import './MessengerPage.css'

const FALLBACK_AVATAR = 'https://i.pravatar.cc/100?u='

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'сейчас'
  if (mins < 60) return `${mins} мин.`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ч.`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'вчера'
  return `${days} дн.`
}

// ── Элемент контакта ─────────────────────────────────────────────────────────
function ContactItem({ inquiry, isActive, onClick }) {
  const avatar = inquiry.logo || `${FALLBACK_AVATAR}${inquiry.biz_id}`
  const name   = inquiry.biz_name
  const preview = inquiry.message

  return (
    <div className={`msg-contact ${isActive ? 'msg-contact--active' : ''}`} onClick={onClick}>
      <div className="msg-contact__avatar-wrap">
        <img className="msg-contact__avatar" src={avatar} alt={name} />
      </div>
      <div className="msg-contact__info">
        <div className="msg-contact__top">
          <span className="msg-contact__name">{name}</span>
          <span className="msg-contact__time">{timeAgo(inquiry.created_at)}</span>
        </div>
        <div className="msg-contact__bottom">
          <span className="msg-contact__preview" title={preview}>{preview}</span>
          {!inquiry.is_read && <span className="msg-contact__unread">1</span>}
        </div>
      </div>
    </div>
  )
}

// ── Просмотр переписки ───────────────────────────────────────────────────────
function ChatView({ inquiry, onBack, onProfileClick }) {
  const messagesEndRef = useRef(null)
  const avatar = inquiry.logo || `${FALLBACK_AVATAR}${inquiry.biz_id}`

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  return (
    <div className="chat-view">
      {/* Шапка чата */}
      <div className="chat-view__header">
        <button className="chat-view__back" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="chat-view__user" onClick={onProfileClick} style={{cursor:'pointer'}}>
          <div className="chat-view__avatar-wrap">
            <img className="chat-view__avatar" src={avatar} alt={inquiry.biz_name} />
          </div>
          <div className="chat-view__user-info">
            <span className="chat-view__name">{inquiry.biz_name}</span>
            <span className="chat-view__status">{inquiry.product_name}</span>
          </div>
        </div>
        <div className="chat-view__actions">
          <button
            className="chat-view__action-btn"
            title="Открыть профиль"
            onClick={onProfileClick}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Сообщения */}
      <div className="chat-view__messages">
        <div className="chat-view__date-divider">
          <span>{new Date(inquiry.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</span>
        </div>

        {/* Сообщение пользователя */}
        <div className="msg-bubble msg-bubble--me">
          <p className="msg-bubble__text">{inquiry.message}</p>
          <span className="msg-bubble__time">
            {new Date(inquiry.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            <svg className="msg-bubble__check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </span>
        </div>

        {/* Системное сообщение */}
        <div className="chat-view__system-msg">
          Ответ от бизнеса появится здесь. Вы можете связаться напрямую по телефону или через сайт компании.
        </div>

        <div ref={messagesEndRef} />
      </div>

      {/* Поле ввода — только информационное, т.к. повторная отправка через ProductCard */}
      <div className="chat-view__input-bar chat-view__input-bar--info">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>Чтобы написать ещё — найдите товар и нажмите «Написать»</span>
      </div>
    </div>
  )
}

// ── Главная страница мессенджера ─────────────────────────────────────────────
export default function MessengerPage() {
  const navigate = useNavigate()
  const { tokens } = useAuth()
  const [inquiries, setInquiries] = useState([])
  const [loading, setLoading]     = useState(true)
  const [activeIdx, setActiveIdx] = useState(null)
  const [search, setSearch]       = useState('')

  useEffect(() => {
    if (!tokens?.access) { setLoading(false); return }
    apiGetInquiries(tokens.access)
      .then(data => setInquiries(data))
      .catch(() => setInquiries([]))
      .finally(() => setLoading(false))
  }, [tokens])

  const filtered = inquiries.filter(inq =>
    inq.biz_name.toLowerCase().includes(search.toLowerCase()) ||
    inq.product_name.toLowerCase().includes(search.toLowerCase()) ||
    inq.message.toLowerCase().includes(search.toLowerCase())
  )

  const activeInquiry = activeIdx !== null ? filtered[activeIdx] : null
  const unreadCount   = inquiries.filter(i => !i.is_read).length

  return (
    <div className="messenger-page">
      <Header />
      <div className="messenger">

        {/* ── Боковая панель: список ── */}
        <aside className={`messenger__sidebar ${activeInquiry ? 'messenger__sidebar--hidden-mobile' : ''}`}>
          <div className="messenger__sidebar-header">
            <h2 className="messenger__title">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
              Сообщения
              {unreadCount > 0 && <span className="messenger__total-unread">{unreadCount}</span>}
            </h2>
          </div>

          <div className="messenger__search-wrap">
            <svg className="messenger__search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              className="messenger__search"
              placeholder="Поиск..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="messenger__contacts">
            {loading ? (
              <div className="messenger__no-chats" style={{padding:'32px 20px'}}>
                <p style={{color:'var(--text-muted)'}}>Загрузка...</p>
              </div>
            ) : filtered.length > 0 ? (
              filtered.map((inq, i) => (
                <ContactItem
                  key={inq.id}
                  inquiry={inq}
                  isActive={activeIdx === i}
                  onClick={() => setActiveIdx(i)}
                />
              ))
            ) : (
              <div className="messenger__no-chats">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{opacity:0.3,marginBottom:12}}>
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
                <p>Пока нет сообщений</p>
                <span>Напишите бизнесу через карточку товара</span>
              </div>
            )}
          </div>
        </aside>

        {/* ── Область чата ── */}
        <main className={`messenger__chat ${activeInquiry ? 'messenger__chat--visible-mobile' : ''}`}>
          {activeInquiry ? (
            <ChatView
              inquiry={activeInquiry}
              onBack={() => setActiveIdx(null)}
              onProfileClick={() => navigate(`/business/${activeInquiry.biz_id}`)}
            />
          ) : (
            <div className="messenger__empty">
              <div className="messenger__empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
              </div>
              <h3>Выберите сообщение</h3>
              <p>Нажмите на контакт слева, чтобы открыть переписку</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
