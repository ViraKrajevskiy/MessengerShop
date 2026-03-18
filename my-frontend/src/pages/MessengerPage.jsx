import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import './MessengerPage.css'

const MSG_AVATARS = [
  'https://i.pravatar.cc/100?img=1',
  'https://i.pravatar.cc/100?img=5',
  'https://i.pravatar.cc/100?img=9',
  'https://i.pravatar.cc/100?img=16',
  'https://i.pravatar.cc/100?img=20',
  'https://i.pravatar.cc/100?img=23',
  'https://i.pravatar.cc/100?img=25',
  'https://i.pravatar.cc/100?img=32',
  'https://i.pravatar.cc/100?img=36',
  'https://i.pravatar.cc/100?img=44',
]

// ---------- mock contacts ----------
const contactsData = [
  { id: 0, name: 'Анна', city: 'Стамбул', avatar: MSG_AVATARS[0], online: true, lastSeen: 'онлайн', unread: 3, lastMsg: 'Привет! Как дела с заказом?', lastMsgTime: Date.now() - 2 * 60000, typing: false },
  { id: 1, name: 'Елена', city: 'Анкара', avatar: MSG_AVATARS[1], online: true, lastSeen: 'онлайн', unread: 0, lastMsg: 'Спасибо за информацию!', lastMsgTime: Date.now() - 15 * 60000, typing: false },
  { id: 2, name: 'Мария', city: 'Стамбул', avatar: MSG_AVATARS[2], online: false, lastSeen: '30 мин. назад', unread: 1, lastMsg: 'Да, квартира ещё свободна. Можем договориться о просмотре.', lastMsgTime: Date.now() - 45 * 60000, typing: false },
  { id: 3, name: 'Ольга', city: 'Анталья', avatar: MSG_AVATARS[3], online: false, lastSeen: '2 ч. назад', unread: 0, lastMsg: 'Хорошо, жду вашего звонка', lastMsgTime: Date.now() - 3 * 3600000, typing: false },
  { id: 4, name: 'Дарья', city: 'Измир', avatar: MSG_AVATARS[4], online: true, lastSeen: 'онлайн', unread: 5, lastMsg: 'Документы готовы! Можете забрать в любое время.', lastMsgTime: Date.now() - 5 * 60000, typing: true },
  { id: 5, name: 'Камила', city: 'Бурса', avatar: MSG_AVATARS[5], online: false, lastSeen: '1 ч. назад', unread: 0, lastMsg: 'Проект дизайна отправила на почту', lastMsgTime: Date.now() - 2 * 3600000, typing: false },
  { id: 6, name: 'Нигора', city: 'Бурса', avatar: MSG_AVATARS[6], online: false, lastSeen: 'вчера', unread: 0, lastMsg: 'Перевод будет готов завтра', lastMsgTime: Date.now() - 24 * 3600000, typing: false },
  { id: 7, name: 'Фатима', city: 'Стамбул', avatar: MSG_AVATARS[7], online: true, lastSeen: 'онлайн', unread: 2, lastMsg: 'Экскурсия в субботу в 10:00, не забудьте!', lastMsgTime: Date.now() - 10 * 60000, typing: false },
  { id: 8, name: 'Алина', city: 'Ташкент', avatar: MSG_AVATARS[8], online: false, lastSeen: '3 ч. назад', unread: 0, lastMsg: 'Счёт оплачен', lastMsgTime: Date.now() - 5 * 3600000, typing: false },
  { id: 9, name: 'Нурия', city: 'Стамбул', avatar: MSG_AVATARS[9], online: true, lastSeen: 'онлайн', unread: 0, lastMsg: 'Записала вас на приём', lastMsgTime: Date.now() - 20 * 60000, typing: false },
]

// ---------- mock messages per chat ----------
const messagesDB = {
  0: [
    { id: 'm0', from: 'them', text: 'Здравствуйте! Хочу записаться на процедуру', time: '10:15' },
    { id: 'm1', from: 'me', text: 'Добрый день! Конечно, какая процедура вас интересует?', time: '10:17' },
    { id: 'm2', from: 'them', text: 'Наращивание ресниц. Есть свободные места на эту неделю?', time: '10:18' },
    { id: 'm3', from: 'me', text: 'Да, есть среда и пятница. Вам какой день удобнее?', time: '10:20' },
    { id: 'm4', from: 'them', text: 'Пятница идеально! Во сколько?', time: '10:21' },
    { id: 'm5', from: 'me', text: 'В 14:00 подойдёт? Процедура занимает около 2 часов', time: '10:23' },
    { id: 'm6', from: 'them', text: 'Отлично, записываюсь! Спасибо', time: '10:24' },
    { id: 'm7', from: 'me', text: 'Записала вас! До встречи в пятницу', time: '10:25' },
    { id: 'm8', from: 'them', text: 'Привет! Как дела с заказом?', time: '14:30' },
  ],
  1: [
    { id: 'm10', from: 'them', text: 'Здравствуйте, подскажите стоимость консультации', time: '09:00' },
    { id: 'm11', from: 'me', text: 'Первичная консультация бесплатная, далее от 500 лир', time: '09:05' },
    { id: 'm12', from: 'them', text: 'Спасибо за информацию!', time: '09:06' },
  ],
  2: [
    { id: 'm20', from: 'me', text: 'Добрый день! Видела вашу квартиру на сайте. Ещё актуально?', time: '11:00' },
    { id: 'm21', from: 'them', text: 'Здравствуйте! Да, квартира доступна', time: '11:05' },
    { id: 'm22', from: 'me', text: 'Какой район? И есть ли парковка?', time: '11:07' },
    { id: 'm23', from: 'them', text: 'Район Бейоглу, подземная парковка включена в стоимость', time: '11:10' },
    { id: 'm24', from: 'me', text: 'Можно организовать просмотр?', time: '11:12' },
    { id: 'm25', from: 'them', text: 'Да, квартира ещё свободна. Можем договориться о просмотре.', time: '11:15' },
  ],
  4: [
    { id: 'm40', from: 'me', text: 'Добрый день! Мне нужна помощь с ВНЖ', time: '08:00' },
    { id: 'm41', from: 'them', text: 'Здравствуйте! Какой тип ВНЖ вас интересует?', time: '08:02' },
    { id: 'm42', from: 'me', text: 'Рабочий ВНЖ. У меня есть оффер от турецкой компании', time: '08:05' },
    { id: 'm43', from: 'them', text: 'Отлично! Для рабочего ВНЖ нужен пакет документов. Отправлю список', time: '08:07' },
    { id: 'm44', from: 'me', text: 'Буду ждать, спасибо!', time: '08:10' },
    { id: 'm45', from: 'them', text: 'Список отправила на почту. Также нужен перевод паспорта', time: '08:30' },
    { id: 'm46', from: 'them', text: 'И ещё фото 4x6 на белом фоне', time: '08:31' },
    { id: 'm47', from: 'them', text: 'Документы готовы! Можете забрать в любое время.', time: '14:00' },
  ],
  7: [
    { id: 'm70', from: 'them', text: 'Привет! Хотите присоединиться к экскурсии по старому городу?', time: '09:00' },
    { id: 'm71', from: 'me', text: 'Да, очень интересно! Когда ближайшая?', time: '09:15' },
    { id: 'm72', from: 'them', text: 'В эту субботу в 10:00. Сбор у Голубой мечети', time: '09:17' },
    { id: 'm73', from: 'me', text: 'Сколько стоит?', time: '09:20' },
    { id: 'm74', from: 'them', text: '300 лир с человека, включая обед и чай', time: '09:22' },
    { id: 'm75', from: 'me', text: 'Записываюсь! Нас будет двое', time: '09:25' },
    { id: 'm76', from: 'them', text: 'Экскурсия в субботу в 10:00, не забудьте!', time: '13:00' },
  ],
}

function formatMsgTime(timestamp) {
  const diff = Date.now() - timestamp
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'сейчас'
  if (mins < 60) return `${mins} мин.`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ч.`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'вчера'
  return `${days} дн.`
}

// ---------- Contact list item ----------
function ContactItem({ contact, isActive, onClick }) {
  return (
    <div className={`msg-contact ${isActive ? 'msg-contact--active' : ''}`} onClick={onClick}>
      <div className="msg-contact__avatar-wrap">
        <img className="msg-contact__avatar" src={contact.avatar} alt={contact.name} />
        {contact.online && <span className="msg-contact__online" />}
      </div>
      <div className="msg-contact__info">
        <div className="msg-contact__top">
          <span className="msg-contact__name">{contact.name}</span>
          <span className="msg-contact__time">{formatMsgTime(contact.lastMsgTime)}</span>
        </div>
        <div className="msg-contact__bottom">
          {contact.typing ? (
            <span className="msg-contact__typing">печатает...</span>
          ) : (
            <span className="msg-contact__preview">{contact.lastMsg}</span>
          )}
          {contact.unread > 0 && (
            <span className="msg-contact__unread">{contact.unread}</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------- Single message bubble ----------
function MessageBubble({ msg, isMe }) {
  return (
    <div className={`msg-bubble ${isMe ? 'msg-bubble--me' : 'msg-bubble--them'}`}>
      <p className="msg-bubble__text">{msg.text}</p>
      <span className="msg-bubble__time">
        {msg.time}
        {isMe && (
          <svg className="msg-bubble__check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        )}
      </span>
    </div>
  )
}

// ---------- Chat View ----------
function ChatView({ contact, onBack, onProfileClick }) {
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    setMessages(messagesDB[contact.id] || [])
    setIsTyping(contact.typing || false)
    setTimeout(() => inputRef.current?.focus(), 200)
  }, [contact.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const sendMessage = (e) => {
    e.preventDefault()
    if (!inputText.trim()) return

    const newMsg = {
      id: `m_${Date.now()}`,
      from: 'me',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages((prev) => [...prev, newMsg])
    setInputText('')

    // Simulate reply after 1.5s
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      const replies = [
        'Хорошо, поняла!',
        'Спасибо за сообщение!',
        'Сейчас проверю и отвечу',
        'Отлично!',
        'Записала, спасибо!',
        'Да, конечно!',
        'Минуточку, уточню',
      ]
      const reply = {
        id: `m_r_${Date.now()}`,
        from: 'them',
        text: replies[Math.floor(Math.random() * replies.length)],
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, reply])
    }, 1500 + Math.random() * 1500)
  }

  return (
    <div className="chat-view">
      {/* Chat header */}
      <div className="chat-view__header">
        <button className="chat-view__back" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="chat-view__user" onClick={onProfileClick}>
          <div className="chat-view__avatar-wrap">
            <img className="chat-view__avatar" src={contact.avatar} alt={contact.name} />
            {contact.online && <span className="chat-view__online" />}
          </div>
          <div className="chat-view__user-info">
            <span className="chat-view__name">{contact.name}</span>
            <span className="chat-view__status">
              {isTyping ? 'печатает...' : contact.online ? 'онлайн' : contact.lastSeen}
            </span>
          </div>
        </div>
        <div className="chat-view__actions">
          <button className="chat-view__action-btn" title="Поиск">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
          </button>
          <button className="chat-view__action-btn" title="Ещё">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-view__messages">
        <div className="chat-view__date-divider">
          <span>Сегодня</span>
        </div>
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} isMe={msg.from === 'me'} />
        ))}
        {isTyping && (
          <div className="chat-view__typing">
            <div className="chat-view__typing-dots">
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form className="chat-view__input-bar" onSubmit={sendMessage}>
        <button type="button" className="chat-view__attach" title="Прикрепить">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
          </svg>
        </button>
        <input
          ref={inputRef}
          type="text"
          className="chat-view__input"
          placeholder="Написать сообщение..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <button type="button" className="chat-view__emoji" title="Эмодзи">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
          </svg>
        </button>
        {inputText.trim() ? (
          <button type="submit" className="chat-view__send" title="Отправить">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        ) : (
          <button type="button" className="chat-view__mic" title="Голосовое сообщение">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </button>
        )}
      </form>
    </div>
  )
}

// ---------- Messenger Page ----------
export default function MessengerPage() {
  const navigate = useNavigate()
  const [activeChat, setActiveChat] = useState(null)
  const [search, setSearch] = useState('')
  const [contacts, setContacts] = useState(contactsData)

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.city.toLowerCase().includes(search.toLowerCase())
  )

  const totalUnread = contacts.reduce((sum, c) => sum + c.unread, 0)

  const openChat = (contact) => {
    setActiveChat(contact)
    // Clear unread
    setContacts((prev) =>
      prev.map((c) => (c.id === contact.id ? { ...c, unread: 0 } : c))
    )
  }

  const handleProfileClick = () => {
    if (activeChat) navigate(`/profile/${activeChat.id}`)
  }

  return (
    <div className="messenger-page">
      <Header />
      <div className="messenger">
        {/* ===== Sidebar: contacts ===== */}
        <aside className={`messenger__sidebar ${activeChat !== null ? 'messenger__sidebar--hidden-mobile' : ''}`}>
          <div className="messenger__sidebar-header">
            <h2 className="messenger__title">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
              Чаты
              {totalUnread > 0 && <span className="messenger__total-unread">{totalUnread}</span>}
            </h2>
            <button className="messenger__new-chat" title="Новый чат">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          </div>

          <div className="messenger__search-wrap">
            <svg className="messenger__search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              className="messenger__search"
              placeholder="Поиск чатов..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Online now */}
          {contacts.filter((c) => c.online).length > 0 && (
            <div className="messenger__online-strip">
              {contacts.filter((c) => c.online).map((c) => (
                <div key={c.id} className="messenger__online-avatar" onClick={() => openChat(c)} title={c.name}>
                  <img className="messenger__online-img" src={c.avatar} alt={c.name} />
                  <span className="messenger__online-dot" />
                </div>
              ))}
            </div>
          )}

          <div className="messenger__contacts">
            {filtered.length > 0 ? filtered.map((c) => (
              <ContactItem
                key={c.id}
                contact={c}
                isActive={activeChat?.id === c.id}
                onClick={() => openChat(c)}
              />
            )) : (
              <div className="messenger__no-chats">
                <p>Чаты не найдены</p>
              </div>
            )}
          </div>
        </aside>

        {/* ===== Chat area ===== */}
        <main className={`messenger__chat ${activeChat !== null ? 'messenger__chat--visible-mobile' : ''}`}>
          {activeChat ? (
            <ChatView
              contact={activeChat}
              onBack={() => setActiveChat(null)}
              onProfileClick={handleProfileClick}
            />
          ) : (
            <div className="messenger__empty">
              <div className="messenger__empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
              </div>
              <h3>Выберите чат</h3>
              <p>Нажмите на контакт слева, чтобы начать общение</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
