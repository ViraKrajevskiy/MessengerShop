import { API_URL as BASE } from '../config/api'

// Список уведомлений + число непрочитанных
export async function apiGetNotifications(token) {
  const res = await fetch(`${BASE}/notifications/`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Ошибка загрузки уведомлений')
  return res.json()  // { results: [...], unread_count: N }
}

// Лёгкий запрос только счётчика непрочитанных (для поллинга)
export async function apiGetUnreadCount(token) {
  const res = await fetch(`${BASE}/notifications/unread-count/`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!res.ok) return { unread_count: 0 }
  return res.json()
}

// Отметить прочитанными (без ids — все, с ids — конкретные)
export async function apiMarkNotificationsRead(token, ids = null) {
  const res = await fetch(`${BASE}/notifications/read/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(ids ? { ids } : {}),
  })
  if (!res.ok) throw new Error('Ошибка')
  return res.json()
}

// Удалить одно уведомление
export async function apiDeleteNotification(token, id) {
  const res = await fetch(`${BASE}/notifications/${id}/`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!res.ok && res.status !== 404) throw new Error('Ошибка удаления')
}

// Очистить все уведомления
export async function apiClearNotifications(token) {
  const res = await fetch(`${BASE}/notifications/`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!res.ok && res.status !== 204) throw new Error('Ошибка')
}
