import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_URL as BASE } from '../config/api'
import { resolveUrl } from '../utils/urlUtils'
import './GroupPreviewPage.css'

export default function GroupPreviewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, getAccessToken } = useAuth()

  const [group,   setGroup]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [joining, setJoining] = useState(false)
  const [joined,  setJoined]  = useState(false)

  useEffect(() => {
    if (!user) { navigate('/login', { replace: true }); return }
    ;(async () => {
      try {
        const token = await getAccessToken()
        const res = await fetch(`${BASE}/groups/${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) { setError('Группа не найдена'); return }
        const data = await res.json()
        setGroup(data)
        setJoined(data.is_member || false)
      } catch {
        setError('Не удалось загрузить группу')
      } finally {
        setLoading(false)
      }
    })()
  }, [id, user, getAccessToken, navigate])

  const handleJoin = async () => {
    if (joining) return
    setJoining(true)
    try {
      const token = await getAccessToken()
      const res = await fetch(`${BASE}/groups/${id}/join/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      setJoined(true)
    } catch {
      // silently fail — navigate anyway
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
    <div className="gp__loading">
      <div className="gp__spinner" />
    </div>
  )

  if (error || !group) return (
    <div className="gp__error">
      <p>{error || 'Группа не найдена'}</p>
      <button className="gp__back-btn" onClick={() => navigate(-1)}>← Назад</button>
    </div>
  )

  const photo = group.photo_url ? resolveUrl(group.photo_url) : null
  const initials = (group.name || '?').slice(0, 2).toUpperCase()

  return (
    <div className="gp__page">
      <button className="gp__back" onClick={() => navigate(-1)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        Назад
      </button>

      <div className="gp__card">
        {/* Avatar */}
        <div className="gp__avatar-wrap">
          {photo
            ? <img src={photo} alt={group.name} className="gp__avatar" />
            : <div className="gp__avatar gp__avatar--placeholder">{initials}</div>
          }
        </div>

        {/* Name */}
        <h1 className="gp__name">{group.name}</h1>

        {/* Member count */}
        <p className="gp__meta">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          {group.member_count ?? 0} {pluralMembers(group.member_count ?? 0)}
        </p>

        {/* Description */}
        {group.description && (
          <p className="gp__desc">{group.description}</p>
        )}

        {/* Action button */}
        {joined
          ? (
            <button className="gp__btn gp__btn--open" onClick={handleOpen}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Открыть чат
            </button>
          ) : (
            <button className="gp__btn gp__btn--join" onClick={handleJoin} disabled={joining}>
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

        {!joined && (
          <p className="gp__hint">Вступите, чтобы читать сообщения и участвовать в обсуждении</p>
        )}
      </div>
    </div>
  )
}

function pluralMembers(n) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 19) return 'участников'
  if (mod10 === 1) return 'участник'
  if (mod10 >= 2 && mod10 <= 4) return 'участника'
  return 'участников'
}
