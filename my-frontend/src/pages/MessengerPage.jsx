import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'
import {
  apiGetInquiries, apiGetInquiryMessages, apiSendInquiryMessage,
  apiDeleteInquiryMessage, apiEditInquiryMessage,
  apiGetGroups, apiCreateGroup, apiGetGroupDetail,
  apiGetGroupMessages, apiSendGroupMessage, apiDeleteGroupMessage,
  apiEditGroupMessage,
  apiAddGroupMember, apiUpdateGroupMember, apiRemoveGroupMember,
  apiSearchProducts,
} from '../api/businessApi'
import { DEFAULT_AVATAR } from '../utils/defaults'
import { timeAgoShort as timeAgo } from '../utils/timeUtils'
import './MessengerPage.css'

const FALLBACK_AVATAR = DEFAULT_AVATAR
const ROLE_LABELS = { OWNER: 'Владелец', ADMIN: 'Админ', MODERATOR: 'Модератор', MEMBER: 'Участник' }
const CURRENCY_SYMBOLS = { TRY: '₺', USD: '$', EUR: '€', RUB: '₽' }

/* ─── Render message text with product mention cards ─── */
function MessageContent({ text, mentionedProducts, navigate }) {
  if (!mentionedProducts || mentionedProducts.length === 0) {
    return <p className="msg-bubble__text">{text}</p>
  }
  // Replace #id in text with styled tags
  const parts = text.split(/(#\d+)/g)
  const productMap = {}
  mentionedProducts.forEach(p => { productMap[p.id] = p })

  return (
    <>
      <p className="msg-bubble__text">
        {parts.map((part, i) => {
          const match = part.match(/^#(\d+)$/)
          if (match) {
            const pId = parseInt(match[1])
            const prod = productMap[pId]
            if (prod) return <span key={i} className="msg-mention-tag">#{pId} {prod.name}</span>
          }
          return <span key={i}>{part}</span>
        })}
      </p>
      {/* Product preview cards */}
      <div className="msg-product-cards">
        {mentionedProducts.map(p => (
          <div key={p.id} className="msg-product-card" onClick={() => navigate && navigate(`/product/${p.id}`)}>
            {p.image && <img className="msg-product-card__img" src={p.image} alt={p.name} />}
            <div className="msg-product-card__info">
              <span className="msg-product-card__name">{p.name}</span>
              {p.price && (
                <span className="msg-product-card__price">
                  {p.price} {CURRENCY_SYMBOLS[p.currency] || p.currency}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

/* ─── Product mention autocomplete dropdown ─── */
function MentionDropdown({ items, onSelect }) {
  if (!items || items.length === 0) return null
  return (
    <div className="mention-dropdown">
      {items.map(p => (
        <div key={p.id} className="mention-dropdown__item" onClick={() => onSelect(p)}>
          {p.image_display && <img className="mention-dropdown__img" src={p.image_display} alt="" />}
          <div className="mention-dropdown__info">
            <span className="mention-dropdown__name">{p.name}</span>
            <span className="mention-dropdown__id">#{p.id}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Inquiry contact item (existing) ─── */
function ContactItem({ inquiry, isActive, onClick, isBusiness }) {
  const avatar = inquiry.logo || FALLBACK_AVATAR
  const name   = isBusiness ? inquiry.sender_name : inquiry.biz_name
  return (
    <div className={`msg-contact ${isActive ? 'msg-contact--active' : ''}`} onClick={onClick}>
      <div className="msg-contact__avatar-wrap">
        <img className="msg-contact__avatar" src={avatar} alt={name} />
        {inquiry.is_online && <span className="msg-contact__online" />}
      </div>
      <div className="msg-contact__info">
        <div className="msg-contact__top">
          <span className="msg-contact__name">{name}</span>
          <span className="msg-contact__time">{timeAgo(inquiry.created_at)}</span>
        </div>
        <div className="msg-contact__bottom">
          <span className="msg-contact__preview" title={inquiry.message}>{inquiry.message}</span>
          {!inquiry.is_read && <span className="msg-contact__unread">1</span>}
        </div>
      </div>
    </div>
  )
}

/* ─── Group contact item ─── */
function GroupContactItem({ group, isActive, onClick }) {
  return (
    <div className={`msg-contact ${isActive ? 'msg-contact--active' : ''}`} onClick={onClick}>
      <div className="msg-contact__avatar-wrap">
        <div className="msg-contact__group-icon">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
      </div>
      <div className="msg-contact__info">
        <div className="msg-contact__top">
          <span className="msg-contact__name">{group.name}</span>
          <span className="msg-contact__time">
            {group.last_message ? timeAgo(group.last_message.created_at) : ''}
          </span>
        </div>
        <div className="msg-contact__bottom">
          <span className="msg-contact__preview">
            {group.last_message
              ? `${group.last_message.sender_name}: ${group.last_message.text}`
              : `${group.member_count} участник(ов)`}
          </span>
        </div>
      </div>
    </div>
  )
}

/* ─── Inquiry ChatView (existing) ─── */
function ChatView({ inquiry, isBusiness, onBack, onProfileClick, getAccessToken, currentUserId }) {
  const navigate = useNavigate()
  const messagesEndRef  = useRef(null)
  const inputRef        = useRef(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading]   = useState(true)
  const [text, setText]         = useState('')
  const [sending, setSending]   = useState(false)
  const [contextMsg, setContextMsg] = useState(null)
  const [editingMsg, setEditingMsg] = useState(null)
  const [mentionResults, setMentionResults] = useState([])
  const mentionTimer = useRef(null)

  const avatar = inquiry.logo || FALLBACK_AVATAR
  const name   = isBusiness ? inquiry.sender_name : inquiry.biz_name

  useEffect(() => {
    setLoading(true)
    getAccessToken().then(token => {
      if (!token) return
      return apiGetInquiryMessages(inquiry.id, token)
        .then(data => setMessages(data))
        .catch(() => {})
        .finally(() => setLoading(false))
    })
  }, [inquiry.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Product mention autocomplete
  const handleTextChange = (val) => {
    setText(val)
    clearTimeout(mentionTimer.current)
    const hashMatch = val.match(/#(\S*)$/)
    if (hashMatch && hashMatch[1].length >= 1) {
      mentionTimer.current = setTimeout(async () => {
        try {
          const token = await getAccessToken()
          const results = await apiSearchProducts(hashMatch[1], token)
          setMentionResults(results)
        } catch { setMentionResults([]) }
      }, 300)
    } else {
      setMentionResults([])
    }
  }

  const selectMention = (product) => {
    const newText = text.replace(/#\S*$/, `#${product.id} `)
    setText(newText)
    setMentionResults([])
    inputRef.current?.focus()
  }

  const send = async (e) => {
    e.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)
    try {
      const token = await getAccessToken()
      if (editingMsg) {
        const updated = await apiEditInquiryMessage(inquiry.id, editingMsg.id, text.trim(), token)
        setMessages(prev => prev.map(m => m.id === editingMsg.id ? updated : m))
        setEditingMsg(null)
      } else {
        const msg = await apiSendInquiryMessage(inquiry.id, text.trim(), token)
        setMessages(prev => [...prev, msg])
      }
      setText('')
      setMentionResults([])
    } catch {} finally { setSending(false) }
  }

  const handleDelete = async (msgId) => {
    try {
      const token = await getAccessToken()
      await apiDeleteInquiryMessage(inquiry.id, msgId, token)
      setMessages(prev => prev.filter(m => m.id !== msgId))
    } catch {}
    setContextMsg(null)
  }

  const startEdit = (msg) => {
    setEditingMsg(msg)
    setText(msg.text)
    setContextMsg(null)
    inputRef.current?.focus()
  }

  const cancelEdit = () => {
    setEditingMsg(null)
    setText('')
  }

  return (
    <div className="chat-view">
      <div className="chat-view__header">
        <button className="chat-view__back" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <div className="chat-view__user" onClick={onProfileClick} style={{cursor:'pointer'}}>
          <div className="chat-view__avatar-wrap">
            <img className="chat-view__avatar" src={avatar} alt={name} />
            {inquiry.is_online && <span className="chat-view__online" />}
          </div>
          <div className="chat-view__user-info">
            <span className="chat-view__name">{name}</span>
            <span className="chat-view__status" style={inquiry.is_online ? {} : {color: 'var(--text-muted)'}}>
              {inquiry.is_online ? 'в сети' : inquiry.product_name}
            </span>
          </div>
        </div>
        <div className="chat-view__actions">
          <button className="chat-view__action-btn" title="Открыть профиль" onClick={onProfileClick}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="chat-view__messages">
        {loading ? (
          <div style={{textAlign:'center',padding:'40px',color:'var(--text-muted)'}}>Загрузка...</div>
        ) : messages.length === 0 ? (
          <div style={{textAlign:'center',padding:'40px',color:'var(--text-muted)'}}>Нет сообщений</div>
        ) : messages.map(msg => {
          const isMe = msg.sender_id === currentUserId
          const msgAvatar = msg.sender_avatar || FALLBACK_AVATAR
          return (
            <div key={msg.id} className={`msg-bubble-row ${isMe ? 'msg-bubble-row--me' : 'msg-bubble-row--them'}`}>
              {!isMe && (
                <div className="msg-bubble__avatar-wrap">
                  <img className="msg-bubble__avatar" src={msgAvatar} alt="" />
                  {msg.sender_online && <span className="msg-bubble__online-dot" />}
                </div>
              )}
              {isMe && (
                <button className="msg-bubble__menu-btn" onClick={() => setContextMsg(contextMsg === msg.id ? null : msg.id)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
                </button>
              )}
              <div className={`msg-bubble ${isMe ? 'msg-bubble--me' : 'msg-bubble--them'}`}>
                {!isMe && <span className="msg-bubble__author">{msg.sender_name}</span>}
                <MessageContent text={msg.text} mentionedProducts={msg.mentioned_products} navigate={navigate} />
                <span className="msg-bubble__time">
                  {msg.is_edited && <span className="msg-bubble__edited">ред.</span>}
                  {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  {isMe && <svg className="msg-bubble__check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>}
                </span>
                {contextMsg === msg.id && isMe && (
                  <div className="msg-context-menu">
                    <button onClick={() => startEdit(msg)}>Редактировать</button>
                    <button className="msg-context-menu__danger" onClick={() => handleDelete(msg.id)}>Удалить</button>
                    <button onClick={() => setContextMsg(null)}>Отмена</button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {editingMsg && (
        <div className="chat-view__editing-bar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          <span>Редактирование</span>
          <button onClick={cancelEdit}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      )}
      <div className="chat-view__input-wrap">
        <MentionDropdown items={mentionResults} onSelect={selectMention} />
        <form className="chat-view__input-bar" onSubmit={send}>
          <input ref={inputRef} type="text" className="chat-view__input" placeholder={editingMsg ? 'Редактировать сообщение...' : 'Напишите # для упоминания товара...'} value={text} onChange={e => handleTextChange(e.target.value)} disabled={sending} />
          <button type="submit" className="chat-view__send-btn" disabled={!text.trim() || sending}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </form>
      </div>
    </div>
  )
}

/* ─── Group ChatView ─── */
function GroupChatView({ group, onBack, getAccessToken, currentUserId }) {
  const navigate = useNavigate()
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading]   = useState(true)
  const [text, setText]         = useState('')
  const [sending, setSending]   = useState(false)
  const [detail, setDetail]     = useState(null)
  const [showPanel, setShowPanel] = useState(false)
  const [contextMsg, setContextMsg] = useState(null)
  const [editingMsg, setEditingMsg] = useState(null)
  const [mentionResults, setMentionResults] = useState([])
  const mentionTimer = useRef(null)

  const myMembership = detail?.members?.find(m => m.user_id === currentUserId)
  const canDelete = myMembership?.can_delete_messages
  const canSend   = myMembership?.can_send_messages !== false
  const isAdmin   = myMembership && ['OWNER','ADMIN'].includes(myMembership.role)

  // Count online members
  const onlineCount = detail?.members?.filter(m => m.is_online).length || 0

  useEffect(() => {
    setLoading(true)
    getAccessToken().then(async token => {
      if (!token) return
      try {
        const [msgs, det] = await Promise.all([
          apiGetGroupMessages(group.id, token),
          apiGetGroupDetail(group.id, token),
        ])
        setMessages(msgs)
        setDetail(det)
      } catch {} finally { setLoading(false) }
    })
  }, [group.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Product mention autocomplete
  const handleTextChange = (val) => {
    setText(val)
    clearTimeout(mentionTimer.current)
    const hashMatch = val.match(/#(\S*)$/)
    if (hashMatch && hashMatch[1].length >= 1) {
      mentionTimer.current = setTimeout(async () => {
        try {
          const token = await getAccessToken()
          const results = await apiSearchProducts(hashMatch[1], token)
          setMentionResults(results)
        } catch { setMentionResults([]) }
      }, 300)
    } else {
      setMentionResults([])
    }
  }

  const selectMention = (product) => {
    const newText = text.replace(/#\S*$/, `#${product.id} `)
    setText(newText)
    setMentionResults([])
    inputRef.current?.focus()
  }

  const send = async (e) => {
    e.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)
    try {
      const token = await getAccessToken()
      if (editingMsg) {
        const updated = await apiEditGroupMessage(group.id, editingMsg.id, text.trim(), token)
        setMessages(prev => prev.map(m => m.id === editingMsg.id ? updated : m))
        setEditingMsg(null)
      } else {
        const msg = await apiSendGroupMessage(group.id, text.trim(), token)
        setMessages(prev => [...prev, msg])
      }
      setText('')
      setMentionResults([])
    } catch {} finally { setSending(false) }
  }

  const handleDelete = async (msgId) => {
    try {
      const token = await getAccessToken()
      await apiDeleteGroupMessage(group.id, msgId, token)
      setMessages(prev => prev.filter(m => m.id !== msgId))
    } catch {}
    setContextMsg(null)
  }

  const startEdit = (msg) => {
    setEditingMsg(msg)
    setText(msg.text)
    setContextMsg(null)
    inputRef.current?.focus()
  }

  const cancelEdit = () => {
    setEditingMsg(null)
    setText('')
  }

  return (
    <div className="chat-view">
      <div className="chat-view__header">
        <button className="chat-view__back" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <div className="chat-view__user" onClick={() => setShowPanel(p => !p)} style={{cursor:'pointer'}}>
          <div className="chat-view__avatar-wrap">
            <div className="msg-contact__group-icon" style={{width:42,height:42}}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
          </div>
          <div className="chat-view__user-info">
            <span className="chat-view__name">{group.name}</span>
            <span className="chat-view__status">
              {detail?.member_count || group.member_count} участник(ов)
              {onlineCount > 0 && <span className="chat-view__online-count">, {onlineCount} в сети</span>}
            </span>
          </div>
        </div>
        <div className="chat-view__actions">
          <button className="chat-view__action-btn" title="Участники" onClick={() => setShowPanel(p => !p)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </button>
        </div>
      </div>


      <div className="chat-view__messages" style={{ flex: showPanel ? '1 1 50%' : '1' }}>
        {loading ? (
          <div style={{textAlign:'center',padding:'40px',color:'var(--text-muted)'}}>Загрузка...</div>
        ) : messages.length === 0 ? (
          <div style={{textAlign:'center',padding:'40px',color:'var(--text-muted)'}}>Нет сообщений</div>
        ) : messages.map(msg => {
          const isMe = msg.sender_id === currentUserId
          const canDeleteThis = isMe || canDelete
          const hasActions = isMe || canPin || canDeleteThis
          const msgAvatar = msg.sender_avatar || FALLBACK_AVATAR
          return (
            <div key={msg.id} className={`msg-bubble-row ${isMe ? 'msg-bubble-row--me' : 'msg-bubble-row--them'}`}>
              {!isMe && (
                <div className="msg-bubble__avatar-wrap">
                  <img className="msg-bubble__avatar" src={msgAvatar} alt="" />
                  {msg.sender_online && <span className="msg-bubble__online-dot" />}
                </div>
              )}
              {hasActions && (
                <button className="msg-bubble__menu-btn" onClick={() => setContextMsg(contextMsg === msg.id ? null : msg.id)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
                </button>
              )}
              <div className={`msg-bubble ${isMe ? 'msg-bubble--me' : 'msg-bubble--them'}`}>
                {!isMe && <span className="msg-bubble__author">{msg.sender_name}</span>}
                <MessageContent text={msg.text} mentionedProducts={msg.mentioned_products} navigate={navigate} />
                <span className="msg-bubble__time">
                  {msg.is_edited && <span className="msg-bubble__edited">ред.</span>}
                  {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  {isMe && <svg className="msg-bubble__check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>}
                </span>
                {contextMsg === msg.id && (
                  <div className="msg-context-menu">
                    {isMe && <button onClick={() => startEdit(msg)}>Редактировать</button>}
                    {canDeleteThis && (
                      <button className="msg-context-menu__danger" onClick={() => handleDelete(msg.id)}>Удалить</button>
                    )}
                    <button onClick={() => setContextMsg(null)}>Отмена</button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Member management side panel */}
      {showPanel && detail && (
        <MemberPanel
          detail={detail}
          isAdmin={isAdmin}
          myRole={myMembership?.role}
          getAccessToken={getAccessToken}
          onClose={() => setShowPanel(false)}
          onUpdate={async () => {
            const token = await getAccessToken()
            const det = await apiGetGroupDetail(group.id, token)
            setDetail(det)
          }}
        />
      )}

      {editingMsg && (
        <div className="chat-view__editing-bar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          <span>Редактирование</span>
          <button onClick={cancelEdit}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      )}
      {canSend ? (
        <div className="chat-view__input-wrap">
          <MentionDropdown items={mentionResults} onSelect={selectMention} />
          <form className="chat-view__input-bar" onSubmit={send}>
            <input ref={inputRef} type="text" className="chat-view__input" placeholder={editingMsg ? 'Редактировать сообщение...' : 'Напишите # для упоминания товара...'} value={text} onChange={e => handleTextChange(e.target.value)} disabled={sending} />
            <button type="submit" className="chat-view__send-btn" disabled={!text.trim() || sending}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </form>
        </div>
      ) : (
        <div className="chat-view__input-bar chat-view__input-bar--info">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93l14.14 14.14"/></svg>
          Вам запрещено отправлять сообщения
        </div>
      )}
    </div>
  )
}

/* ─── Member Management Panel ─── */
function MemberPanel({ detail, isAdmin, getAccessToken, onClose, onUpdate }) {
  const [addUsername, setAddUsername] = useState('')
  const [addRole, setAddRole]        = useState('MEMBER')
  const [adding, setAdding]          = useState(false)
  const [error, setError]            = useState('')

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!addUsername.trim()) return
    setAdding(true); setError('')
    try {
      const token = await getAccessToken()
      await apiAddGroupMember(detail.id, { username: addUsername.trim(), role: addRole }, token)
      setAddUsername('')
      setAddRole('MEMBER')
      await onUpdate()
    } catch (err) { setError(err.message) }
    finally { setAdding(false) }
  }

  const handleRoleChange = async (memberId, role) => {
    try {
      const token = await getAccessToken()
      await apiUpdateGroupMember(detail.id, memberId, { role }, token)
      await onUpdate()
    } catch {}
  }

  const handleToggle = async (memberId, field, value) => {
    try {
      const token = await getAccessToken()
      await apiUpdateGroupMember(detail.id, memberId, { [field]: value }, token)
      await onUpdate()
    } catch {}
  }

  const handleRemove = async (memberId) => {
    try {
      const token = await getAccessToken()
      await apiRemoveGroupMember(detail.id, memberId, token)
      await onUpdate()
    } catch {}
  }

  return (
    <div className="member-panel">
      <div className="member-panel__header">
        <h3>Участники ({detail.members?.length || 0})</h3>
        <button className="member-panel__close" onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>

      {isAdmin && (
        <form className="member-panel__add" onSubmit={handleAdd}>
          <input
            type="text"
            placeholder="Имя пользователя..."
            value={addUsername}
            onChange={e => setAddUsername(e.target.value)}
            disabled={adding}
          />
          <select value={addRole} onChange={e => setAddRole(e.target.value)}>
            <option value="MEMBER">Участник</option>
            <option value="MODERATOR">Модератор</option>
            <option value="ADMIN">Админ</option>
          </select>
          <button type="submit" disabled={adding || !addUsername.trim()}>+</button>
          {error && <div className="member-panel__error">{error}</div>}
        </form>
      )}

      <div className="member-panel__list">
        {(detail.members || []).map(m => (
          <div key={m.id} className="member-card">
            <div className="member-card__info">
              <div className="member-card__avatar-wrap">
                {m.avatar
                  ? <img className="member-card__avatar" src={m.avatar} alt="" />
                  : <div className="member-card__avatar-placeholder">{m.username?.[0]?.toUpperCase()}</div>
                }
                {m.is_online && <span className="member-card__online" />}
              </div>
              <span className="member-card__name">{m.username}</span>
              <span className={`member-card__role member-card__role--${m.role.toLowerCase()}`}>
                {ROLE_LABELS[m.role] || m.role}
              </span>
            </div>

            {isAdmin && m.role !== 'OWNER' && (
              <div className="member-card__controls">
                <select
                  value={m.role}
                  onChange={e => handleRoleChange(m.id, e.target.value)}
                >
                  <option value="MEMBER">Участник</option>
                  <option value="MODERATOR">Модератор</option>
                  <option value="ADMIN">Админ</option>
                </select>

                <label className="toggle-label">
                  <span>Удаление смс</span>
                  <input
                    type="checkbox"
                    checked={m.can_delete_messages}
                    onChange={e => handleToggle(m.id, 'can_delete_messages', e.target.checked)}
                  />
                  <span className="toggle-switch" />
                </label>

                <label className="toggle-label">
                  <span>Отправка смс</span>
                  <input
                    type="checkbox"
                    checked={m.can_send_messages}
                    onChange={e => handleToggle(m.id, 'can_send_messages', e.target.checked)}
                  />
                  <span className="toggle-switch" />
                </label>

                <button className="member-card__remove" onClick={() => handleRemove(m.id)} title="Удалить из группы">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Create Group Modal ─── */
function CreateGroupModal({ onClose, onCreate }) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h3>Новая группа</h3>
        <input type="text" placeholder="Название группы" value={name} onChange={e => setName(e.target.value)} autoFocus />
        <input type="text" placeholder="Описание (необязательно)" value={desc} onChange={e => setDesc(e.target.value)} />
        <div className="modal-box__actions">
          <button className="modal-box__cancel" onClick={onClose}>Отмена</button>
          <button className="modal-box__ok" disabled={!name.trim()} onClick={() => onCreate({ name: name.trim(), description: desc.trim() })}>Создать</button>
        </div>
      </div>
    </div>
  )
}

/* ═════ Main MessengerPage ═════ */
export default function MessengerPage() {
  const navigate = useNavigate()
  const { user, getAccessToken } = useAuth()

  const [tab, setTab]               = useState('chats') // 'chats' | 'groups'
  const [inquiries, setInquiries]   = useState([])
  const [groups, setGroups]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [activeIdx, setActiveIdx]   = useState(null)
  const [activeGroup, setActiveGroup] = useState(null)
  const [search, setSearch]         = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const isBusiness = user?.role === 'BUSINESS'

  useEffect(() => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    getAccessToken().then(async token => {
      if (!token) { setLoading(false); return }
      try {
        const [inqs, grps] = await Promise.all([
          apiGetInquiries(token).catch(() => []),
          apiGetGroups(token).catch(() => []),
        ])
        setInquiries(inqs || [])
        setGroups(grps || [])
      } finally { setLoading(false) }
    })
  }, [user])

  const filteredInquiries = inquiries.filter(inq => {
    const q = search.toLowerCase()
    return (
      inq.biz_name.toLowerCase().includes(q) ||
      inq.product_name.toLowerCase().includes(q) ||
      inq.message.toLowerCase().includes(q) ||
      (inq.sender_name || '').toLowerCase().includes(q)
    )
  })

  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(search.toLowerCase()))

  const activeInquiry = tab === 'chats' && activeIdx !== null ? filteredInquiries[activeIdx] : null
  const unreadCount   = inquiries.filter(i => !i.is_read).length

  const handleCreateGroup = async (data) => {
    try {
      const token = await getAccessToken()
      const grp = await apiCreateGroup(data, token)
      setGroups(prev => [grp, ...prev])
      setShowCreate(false)
      setTab('groups')
      setActiveGroup(grp)
    } catch {}
  }

  const selectInquiry = (i) => { setActiveIdx(i); setActiveGroup(null) }
  const selectGroup   = (g) => { setActiveGroup(g); setActiveIdx(null) }
  const clearActive    = () => { setActiveIdx(null); setActiveGroup(null) }

  return (
    <div className="messenger-page">
      <Header />
      <div className="messenger">
        <aside className={`messenger__sidebar ${(activeInquiry || activeGroup) ? 'messenger__sidebar--hidden-mobile' : ''}`}>
          <div className="messenger__sidebar-header">
            <h2 className="messenger__title">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              Сообщения
              {unreadCount > 0 && <span className="messenger__total-unread">{unreadCount}</span>}
            </h2>
          </div>

          {/* Tabs */}
          <div className="messenger__tabs">
            <button className={`messenger__tab ${tab === 'chats' ? 'messenger__tab--active' : ''}`} onClick={() => { setTab('chats'); clearActive() }}>
              Чаты
            </button>
            <button className={`messenger__tab ${tab === 'groups' ? 'messenger__tab--active' : ''}`} onClick={() => { setTab('groups'); clearActive() }}>
              Группы
            </button>
          </div>

          <div className="messenger__search-wrap">
            <svg className="messenger__search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input type="text" className="messenger__search" placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {tab === 'groups' && (
            <div style={{padding:'0 16px 8px'}}>
              <button className="group-create-btn" onClick={() => setShowCreate(true)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                Создать группу
              </button>
            </div>
          )}

          <div className="messenger__contacts">
            {loading ? (
              <div className="messenger__no-chats" style={{padding:'32px 20px'}}><p style={{color:'var(--text-muted)'}}>Загрузка...</p></div>
            ) : tab === 'chats' ? (
              filteredInquiries.length > 0 ? filteredInquiries.map((inq, i) => (
                <ContactItem key={inq.id} inquiry={inq} isBusiness={isBusiness} isActive={activeIdx === i} onClick={() => selectInquiry(i)} />
              )) : (
                <div className="messenger__no-chats">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{opacity:0.3,marginBottom:12}}>
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                  <p>Пока нет сообщений</p>
                  <span>Напишите бизнесу через карточку товара</span>
                </div>
              )
            ) : (
              filteredGroups.length > 0 ? filteredGroups.map(g => (
                <GroupContactItem key={g.id} group={g} isActive={activeGroup?.id === g.id} onClick={() => selectGroup(g)} />
              )) : (
                <div className="messenger__no-chats">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{opacity:0.3,marginBottom:12}}>
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  <p>Нет групп</p>
                  <span>Создайте группу, чтобы начать</span>
                </div>
              )
            )}
          </div>
        </aside>

        <main className={`messenger__chat ${(activeInquiry || activeGroup) ? 'messenger__chat--visible-mobile' : ''}`}>
          {activeInquiry ? (
            <ChatView inquiry={activeInquiry} isBusiness={isBusiness} onBack={clearActive} onProfileClick={() => navigate(`/business/${activeInquiry.biz_id}`)} getAccessToken={getAccessToken} currentUserId={user?.id} />
          ) : activeGroup ? (
            <GroupChatView group={activeGroup} onBack={clearActive} getAccessToken={getAccessToken} currentUserId={user?.id} />
          ) : (
            <div className="messenger__empty">
              <div className="messenger__empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              </div>
              <h3>Выберите сообщение</h3>
              <p>Нажмите на контакт слева, чтобы открыть переписку</p>
            </div>
          )}
        </main>
      </div>

      {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} onCreate={handleCreateGroup} />}
    </div>
  )
}
