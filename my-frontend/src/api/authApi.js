import { API_URL as BASE_URL } from '../config/api'

async function request(endpoint, options = {}) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    // пустой ответ (например 204 No Content)
  }

  if (!response.ok) {
    // Форматируем ошибки от DRF в читаемую строку
    const message = formatErrors(data) || `Ошибка ${response.status}`
    throw new Error(message)
  }

  return data
}

function formatErrors(data) {
  if (!data) return null
  if (typeof data === 'string') return data
  if (data.detail) return data.detail
  // DRF возвращает { field: ["error"] } или { non_field_errors: ["..."] }
  const messages = []
  for (const [key, value] of Object.entries(data)) {
    const text = Array.isArray(value) ? value.join(', ') : String(value)
    if (key === 'non_field_errors') messages.push(text)
    else messages.push(`${key}: ${text}`)
  }
  return messages.join(' | ')
}

// ── API методы ───────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register/
 * Body: { username, email, password, password2, role, city }
 * → 201: { message, role }
 */
export async function apiRegister({ username, email, password, password2, role, city }) {
  return request('/auth/register/', {
    method: 'POST',
    body: JSON.stringify({ username, email, password, password2, role, city: city || '' }),
  })
}

/**
 * POST /api/auth/verify-email/
 * Body: { email, code }
 * → 200: { message }
 */
export async function apiVerifyEmail({ email, code }) {
  return request('/auth/verify-email/', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  })
}

/**
 * POST /api/auth/login/
 * Body: { email, password }
 * → 200: { access, refresh, user }
 */
export async function apiLogin({ email, password }) {
  return request('/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

/**
 * POST /api/auth/logout/
 * Body: { refresh }
 */
export async function apiLogout(refreshToken, accessToken) {
  return request('/auth/logout/', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ refresh: refreshToken }),
  })
}

/**
 * GET /api/auth/me/
 * → 200: User object
 */
export async function apiMe(accessToken) {
  return request('/auth/me/', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

/**
 * POST /api/auth/token/refresh/
 * Body: { refresh }
 * → 200: { access, refresh }
 */
export async function apiRefreshToken(refreshToken) {
  return request('/auth/token/refresh/', {
    method: 'POST',
    body: JSON.stringify({ refresh: refreshToken }),
  })
}

/**
 * POST /api/auth/google/
 * Body: { credential, role }
 * → 200: { access, refresh, user }
 */
export async function apiGoogleAuth({ credential, role = 'USER' }) {
  return request('/auth/google/', {
    method: 'POST',
    body: JSON.stringify({ credential, role }),
  })
}
