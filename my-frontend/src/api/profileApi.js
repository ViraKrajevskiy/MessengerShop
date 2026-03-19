const BASE_URL = 'http://127.0.0.1:8000/api'

async function authRequest(endpoint, accessToken, options = {}) {
  const isFormData = options.body instanceof FormData
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
    ...options,
  })

  let data = null
  try { data = await response.json() } catch { /* 204 */ }

  if (!response.ok) {
    const msg = data?.detail || Object.values(data || {}).flat().join(' | ') || `Ошибка ${response.status}`
    throw new Error(msg)
  }
  return data
}

/** GET /api/auth/me/ */
export async function apiGetMe(accessToken) {
  return authRequest('/auth/me/', accessToken)
}

/** PATCH /api/auth/me/ — обновить username, city, avatar */
export async function apiPatchMe(accessToken, formData) {
  return authRequest('/auth/me/', accessToken, {
    method: 'PATCH',
    body: formData,
  })
}
