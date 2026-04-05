const BASE_URL = import.meta.env.PROD
  ? 'https://api.101-school.uz/api'
  : 'http://127.0.0.1:8000/api'

async function request(endpoint, options = {}) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  let data = null
  try { data = await response.json() } catch { /* empty */ }
  if (!response.ok) {
    const message = data?.detail || `Ошибка ${response.status}`
    throw new Error(message)
  }
  return data
}

const auth = (token) => ({ Authorization: `Bearer ${token}` })

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function apiModeratorLogin({ email, password, secret_key }) {
  return request('/moderator/login/', {
    method: 'POST',
    body: JSON.stringify({ email, password, secret_key }),
  })
}

// ── Posts ─────────────────────────────────────────────────────────────────────
export async function apiModeratorGetPosts(token, { blocked } = {}) {
  const params = blocked !== undefined ? `?blocked=${blocked}` : ''
  return request(`/moderator/posts/${params}`, { headers: auth(token) })
}

export async function apiModeratorBlockPost(token, postId, blocked) {
  return request(`/moderator/posts/${postId}/block/`, {
    method: 'PATCH',
    headers: auth(token),
    body: JSON.stringify({ blocked }),
  })
}

// ── Complaints ────────────────────────────────────────────────────────────────
export async function apiModeratorGetComplaints(token, { status } = {}) {
  const params = status ? `?status=${status}` : ''
  return request(`/moderator/complaints/${params}`, { headers: auth(token) })
}

export async function apiModeratorResolveComplaint(token, id, { status, resolution_note }) {
  return request(`/moderator/complaints/${id}/`, {
    method: 'PATCH',
    headers: auth(token),
    body: JSON.stringify({ status, resolution_note }),
  })
}

// ── Tariffs / Businesses ──────────────────────────────────────────────────────
export async function apiModeratorGetBusinesses(token) {
  return request('/moderator/businesses/', { headers: auth(token) })
}

export async function apiModeratorAssignTariff(token, businessId, { plan_type, plan_period }) {
  return request(`/moderator/businesses/${businessId}/tariff/`, {
    method: 'PATCH',
    headers: auth(token),
    body: JSON.stringify({ plan_type, plan_period }),
  })
}

// ── Verification (reuses existing endpoints) ─────────────────────────────────
export async function apiModeratorGetVerifications(token, { status } = {}) {
  const params = status ? `?status=${status}` : ''
  return request(`/verification/${params}`, { headers: auth(token) })
}

export async function apiModeratorReviewVerification(token, id, { status, comment }) {
  return request(`/verification/${id}/`, {
    method: 'PATCH',
    headers: auth(token),
    body: JSON.stringify({ status, comment }),
  })
}

export async function apiModeratorGetVerificationChat(token, reqId) {
  return request(`/verification/${reqId}/chat/`, { headers: auth(token) })
}

export async function apiModeratorSendVerificationMessage(token, reqId, text) {
  return request(`/verification/${reqId}/chat/`, {
    method: 'POST',
    headers: auth(token),
    body: JSON.stringify({ text }),
  })
}

// ── Stories ───────────────────────────────────────────────────────────────────
export async function apiModeratorGetStories(token, { blocked } = {}) {
  const params = blocked !== undefined ? `?blocked=${blocked}` : ''
  return request(`/moderator/stories/${params}`, { headers: auth(token) })
}
export async function apiModeratorBlockStory(token, id, blocked) {
  return request(`/moderator/stories/${id}/block/`, {
    method: 'PATCH', headers: auth(token), body: JSON.stringify({ blocked }),
  })
}

// ── Comments ──────────────────────────────────────────────────────────────────
export async function apiModeratorGetComments(token, { blocked } = {}) {
  const params = blocked !== undefined ? `?blocked=${blocked}` : ''
  return request(`/moderator/comments/${params}`, { headers: auth(token) })
}
export async function apiModeratorBlockComment(token, id, blocked) {
  return request(`/moderator/comments/${id}/block/`, {
    method: 'PATCH', headers: auth(token), body: JSON.stringify({ blocked }),
  })
}

// ── Products ──────────────────────────────────────────────────────────────────
export async function apiModeratorGetProducts(token, { blocked } = {}) {
  const params = blocked !== undefined ? `?blocked=${blocked}` : ''
  return request(`/moderator/products/${params}`, { headers: auth(token) })
}
export async function apiModeratorBlockProduct(token, id, blocked) {
  return request(`/moderator/products/${id}/block/`, {
    method: 'PATCH', headers: auth(token), body: JSON.stringify({ blocked }),
  })
}

// ── Reviews ───────────────────────────────────────────────────────────────────
export async function apiModeratorGetReviews(token, { blocked } = {}) {
  const params = blocked !== undefined ? `?blocked=${blocked}` : ''
  return request(`/moderator/reviews/${params}`, { headers: auth(token) })
}
export async function apiModeratorBlockReview(token, id, blocked) {
  return request(`/moderator/reviews/${id}/block/`, {
    method: 'PATCH', headers: auth(token), body: JSON.stringify({ blocked }),
  })
}
