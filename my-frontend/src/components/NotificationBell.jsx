import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { timeAgo } from '../utils/timeUtils'
import {
  apiGetNotifications, apiGetUnreadCount,
  apiMarkNotificationsRead, apiClearNotifications,
} from '../api/notificationsApi'
import './NotificationBell.css'

const POLL_MS = 30_000  // как часто опрашивать счётчик непрочитанных

// Достаём имя группы из заголовка вида: Новое сообщение в «Название»
function groupNameFromTitle(title) {
  const m = (title || '').match(/«([^»]+)»/)
  return m ? m[1] : ''
}

// Куда вести при клике по уведомлению.
// Возвращает [path, navigateOptions]
function targetFor(n) {
  const d = n.data || {}
  if (n.type === 'GROUP_MSG' && d.group_id) {
    // Сразу открываем чат группы в мессенджере (без страницы-превью)
    return ['/messenger', {
      state: { openGroup: { id: d.group_id, name: groupNameFromTitle(n.title), member_count: 0 } },
    }]
  }
  if (n.type === 'INQUIRY_MSG') {
    return ['/messenger', { state: { openInquiryId: d.inquiry_id } }]
  }
  if (n.type === 'FOLLOW' && d.business_id) return [`/business/${d.business_id}`]
  if (n.type === 'NEW_POST' && d.business_id) return [`/business/${d.business_id}`]
  if (n.type === 'CONTENT_BLOCKED' || n.type === 'PROFILE_BLOCKED') {
    return ['/complaint', { state: { appeal: true, content_type: d.content_type, content_id: d.content_id } }]
  }
  return [null]
}

export default function NotificationBell() {
  const { user, getAccessToken } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const ref = useRef(null)

  // Лёгкий поллинг счётчика
  const pollCount = useCallback(async () => {
    const token = await getAccessToken()
    if (!token) return
    try {
      const { unread_count } = await apiGetUnreadCount(token)
      setUnread(unread_count || 0)
    } catch { /* тихо игнорируем */ }
  }, [getAccessToken])

  useEffect(() => {
    if (!user) { setUnread(0); setItems([]); return }
    pollCount()
    const id = setInterval(pollCount, POLL_MS)
    return () => clearInterval(id)
  }, [user, pollCount])

  // Закрытие по клику вне
  useEffect(() => {
    const handle = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // Открыть список + отметить прочитанными
  const toggle = async () => {
    const next = !open
    setOpen(next)
    if (!next) return
    const token = await getAccessToken()
    if (!token) return
    setLoading(true)
    try {
      const { results, unread_count } = await apiGetNotifications(token)
      setItems(results || [])
      setUnread(unread_count || 0)
      // Отмечаем все прочитанными, как только пользователь открыл панель
      if ((unread_count || 0) > 0) {
        await apiMarkNotificationsRead(token)
        setUnread(0)
        setItems(prev => prev.map(n => ({ ...n, is_read: true })))
      }
    } catch { /* тихо */ } finally {
      setLoading(false)
    }
  }

  const onItemClick = (n) => {
    const [path, opts] = targetFor(n)
    setOpen(false)
    if (path) navigate(path, opts)
  }

  const onClear = async (e) => {
    e.stopPropagation()
    const token = await getAccessToken()
    if (!token) return
    try {
      await apiClearNotifications(token)
      setItems([])
      setUnread(0)
    } catch { /* тихо */ }
  }

  if (!user) return null

  return (
    <div className="notif" ref={ref}>
      <button className="notif__btn" onClick={toggle} title="Уведомления" aria-label="Уведомления">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unread > 0 && <span className="notif__badge">{unread > 99 ? '99+' : unread}</span>}
      </button>

      {open && (
        <div className="notif__dropdown">
          <div className="notif__head">
            <span className="notif__title">Уведомления</span>
            {items.length > 0 && (
              <button className="notif__clear" onClick={onClear}>Очистить</button>
            )}
          </div>

          <div className="notif__list">
            {loading && <div className="notif__empty">Загрузка…</div>}
            {!loading && items.length === 0 && (
              <div className="notif__empty">Пока нет уведомлений</div>
            )}
            {!loading && items.map(n => (
              <button
                key={n.id}
                className={`notif__item ${n.is_read ? '' : 'notif__item--unread'}${n.type === 'CONTENT_BLOCKED' || n.type === 'PROFILE_BLOCKED' ? ' notif__item--blocked' : ''}`}
                onClick={() => onItemClick(n)}
              >
                <div className="notif__item-title">{n.title}</div>
                {n.body && <div className="notif__item-body">{n.body}</div>}
                {(n.type === 'CONTENT_BLOCKED' || n.type === 'PROFILE_BLOCKED') && (
                  <div className="notif__item-appeal">Подать апелляцию →</div>
                )}
                <div className="notif__item-time">{timeAgo(n.created_at)}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
