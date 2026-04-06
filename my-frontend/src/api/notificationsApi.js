const BASE_URL = import.meta.env.PROD
  ? 'https://api.101-school.uz/api'
  : 'http://127.0.0.1:8000/api'

async function request(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  let data = null
  try { data = await res.json() } catch { /* empty */ }
  if (!res.ok) throw new Error(data?.detail || `Error ${res.status}`)
  return data
}

const auth = (token) => ({ Authorization: `Bearer ${token}` })

export async function apiGetNotifications(token) {
  return request('/notifications/', { headers: auth(token) })
}

export async function apiMarkNotificationRead(token, id) {
  return request(`/notifications/${id}/read/`, { method: 'PATCH', headers: auth(token) })
}

export async function apiMarkAllNotificationsRead(token) {
  return request('/notifications/read-all/', { method: 'POST', headers: auth(token) })
}
