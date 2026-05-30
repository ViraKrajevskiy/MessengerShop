import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_URL as BASE } from '../config/api'
import { resolveUrl } from '../utils/urlUtils'
import { timeAgo } from '../utils/timeUtils'
import './GroupPreviewPage.css'

export default function GroupPreviewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, getAccessToken } = useAuth()
  const bottomRef = useRef(null)

  const [group,    setGroup]    = useState(null)
  const [messages, setMessages] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [joining,  setJoining]  = useState(false)
  const [joined,   setJoined]   = useState(false)

  useEffect(() => {
    if (!user) { navigate('/login', { replace: true }); return }
    ;(async () => {
      try {
        const token = await getAccessToken()
        const headers = { Authorization: `Bearer ${token}` }

        const [gRes, mRes] = await Promise.all([
          fetch(`${BASE}/groups/${id}/`,          { headers }),
          fetch(`${BASE}/groups/${id}/messages/`, { headers }),
        ])

        if (!gRes.ok) { setError('Группа не найдена'); return }

        const gData = await gRes.json()
        setGroup(gData)
        // is_member присутствует у обоих сериализаторов; my_role — запасной
        // признак членства (есть роль → ты уже в группе)
        setJoined(gData.is_member || !!gData.my_role)

        if (mRes.ok) {
          const mData = await mRes.json()
          setMessages(Array.isArray(mData) ? mData : [])
        }
      } catch {
        setError('Не удалось загрузить группу')
      } finally {
        setLoading(false)
      }
    })()
  }, [id, user, getAccessToken, navigate])

  // Scroll to bottom after messages load
  useEffect(() => {
    if (messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'instant' })
    }
  }, [messages])

  const handleJoin = async () => {
    if (joining) return
    setJoining(true)
    try {
      const token = await getAccessToken()
      await fetch(`${BASE}/groups/${id}/join/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      setJoined(true)
    } finally {
      setJoining(false)
      navigate('/messenger', {
        state: { openGroup: { id: Number(id), name: group?.name, member_count: group?.member_count ?? 0 } },
      })
    }
  }

  const handleOpen = () => {
    navigate('/messenger', {
      state: { openGroup: { id: Number(id), name: group?.name, member_count: group?.member_count ?? 0 } },
    })
  }

  if (loading) return (
    <div className="gp__fullscreen-center">
      <div className="gp__spinner" />
    </div>
  )

  if (error || !group) return (
    <div className="gp__fullscreen-center">
      <p className="gp__error-text">{error || 'Группа не найдена'}</p>
      <button className="gp__ghost-btn" onClick={() => navigate(-1)}>← Назад</button>
    </div>
  )

  const photo    = group.photo_url ? resolveUrl(group.photo_url) : null
  const initials = (group.name || '?').slice(0, 2).toUpperCase()

  return (
    <div className="gp__layout">

      {/* ── Fixed header ── */}
      <header className="gp__header">
        <button className="gp__back" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>

        <div className="gp__header-avatar">
          {photo
            ? <img src={photo} alt={group.name} />
            : <span>{initials}</span>
          }
        </div>

        <div className="gp__header-info">
          <div className="gp__header-name">{group.name}</div>
          <div className="gp__header-meta">{group.member_count ?? 0} {pluralMembers(group.member_count ?? 0)}</div>
        </div>

        {joined
          ? <button className="gp__header-btn gp__header-btn--open" onClick={handleOpen}>Открыть</button>
          : (
            <button className="gp__header-btn gp__header-btn--join" onClick={handleJoin} disabled={joining}>
              {joining ? <span className="gp__spinner gp__spinner--xs" /> : 'Вступить'}
            </button>
          )
        }
      </header>

      {/* ── Messages feed ── */}
      <main className="gp__feed">

        {/* Group info card at top */}
        <div className="gp__info-card">
          <div className="gp__info-avatar">
            {photo
              ? <img src={photo} alt={group.name} />
              : <span>{initials}</span>
            }
          </div>
          <h2 className="gp__info-name">{group.name}</h2>
          <p className="gp__info-meta">{group.member_count ?? 0} {pluralMembers(group.member_count ?? 0)}</p>
          {group.description && <p className="gp__info-desc">{group.description}</p>}
        </div>

        {/* Messages */}
        {messages.length === 0
          ? <div className="gp__empty">Сообщений пока нет</div>
          : messages.map(msg => <MessageBubble key={msg.id} msg={msg} currentUserId={user?.id} />)
        }
        <div ref={bottomRef} />
      </main>

      {/* ── Bottom bar ── */}
      <div className="gp__bottom-bar">
        {joined
          ? (
            <button className="gp__bottom-btn gp__bottom-btn--open" onClick={handleOpen}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Открыть чат
            </button>
          ) : (
            <button className="gp__bottom-btn gp__bottom-btn--join" onClick={handleJoin} disabled={joining}>
              {joining
                ? <span className="gp__spinner gp__spinner--sm" />
                : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="8.5" cy="7" r="4"/>
                      <line x1="20" y1="8" x2="20" y2="14"/>
                      <line x1="23" y1="11" x2="17" y2="11"/>
                    </svg>
                    Вступить в группу
                  </>
                )
              }
            </button>
          )
        }
      </div>

    </div>
  )
}

function MessageBubble({ msg, currentUserId }) {
  const isMe = msg.sender_id === currentUserId
  const avatar = msg.sender_avatar ? resolveUrl(msg.sender_avatar) : null
  const initials = (msg.sender_name || '?')[0].toUpperCase()

  return (
    <div className={`gp__msg ${isMe ? 'gp__msg--me' : 'gp__msg--other'}`}>
      {!isMe && (
        <div className="gp__msg-avatar">
          {avatar ? <img src={avatar} alt={msg.sender_name} /> : <span>{initials}</span>}
        </div>
      )}
      <div className="gp__msg-body">
        {!isMe && <div className="gp__msg-name">{msg.sender_name}</div>}
        <div className="gp__msg-bubble">
          <span className="gp__msg-text">{msg.text}</span>
          <span className="gp__msg-time">{timeAgo(msg.created_at)}</span>
        </div>
      </div>
    </div>
  )
}

function pluralMembers(n) {
  const mod10 = n % 10, mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 19) return 'участников'
  if (mod10 === 1) return 'участник'
  if (mod10 >= 2 && mod10 <= 4) return 'участника'
  return 'участников'
}
