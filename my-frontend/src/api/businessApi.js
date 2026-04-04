const BASE = import.meta.env.PROD
  ? 'https://api.101-school.uz/api'
  : 'http://127.0.0.1:8000/api'

const cache = new Map()
const TTL = 60_000

function cached(key, fetcher) {
  const hit = cache.get(key)
  if (hit && Date.now() - hit.ts < TTL) return Promise.resolve(hit.data)
  return fetcher().then(data => { cache.set(key, { data, ts: Date.now() }); return data })
}


export function invalidateCache(key) {
  if (key) cache.delete(key)
  else cache.clear()
}

export async function apiGetBusinesses(params = {}) {
  const q = new URLSearchParams()
  if (params.vip)      q.set('vip', 'true')
  if (params.city)     q.set('city', params.city)
  if (params.category) q.set('category', params.category)
  if (params.search)   q.set('search', params.search)
  const key = `businesses?${q}`
  return cached(key, async () => {
    const res = await fetch(`${BASE}/businesses/?${q}`)
    if (!res.ok) throw new Error('Ошибка загрузки бизнесов')
    return res.json()
  })
}

export async function apiGetBusiness(id) {
  return cached(`business:${id}`, async () => {
    const res = await fetch(`${BASE}/businesses/${id}/`)
    if (!res.ok) throw new Error('Бизнес не найден')
    return res.json()
  })
}

export async function apiGetBusinessProducts(id) {
  return cached(`biz-products:${id}`, async () => {
    const res = await fetch(`${BASE}/businesses/${id}/products/`)
    if (!res.ok) throw new Error('Ошибка загрузки товаров')
    return res.json()
  })
}

export async function apiGetStories() {
  return cached('stories', async () => {
    const res = await fetch(`${BASE}/stories/`)
    if (!res.ok) throw new Error('Ошибка загрузки сторисов')
    return res.json()
  })
}

export async function apiViewStory(storyId, token) {
  if (!token) return
  const res = await fetch(`${BASE}/stories/${storyId}/`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!res.ok) return
  return res.json()
}

export async function apiGetPosts(token) {
  // Не кэшируем если авторизован — нужен актуальный is_subscribed
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
  if (token) {
    const res = await fetch(`${BASE}/posts/`, { headers })
    if (!res.ok) throw new Error('Ошибка загрузки постов')
    return res.json()
  }
  return cached('posts', async () => {
    const res = await fetch(`${BASE}/posts/`)
    if (!res.ok) throw new Error('Ошибка загрузки постов')
    return res.json()
  })
}

export async function apiGetBusinessPosts(id) {
  return cached(`biz-posts:${id}`, async () => {
    const res = await fetch(`${BASE}/businesses/${id}/posts/`)
    if (!res.ok) throw new Error('Ошибка загрузки постов бизнеса')
    return res.json()
  })
}

export async function apiGetInquiries(token) {
  const res = await fetch(`${BASE}/inquiries/`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Ошибка загрузки сообщений')
  return res.json()
}

export async function apiGetBusinessReviews(id) {
  const res = await fetch(`${BASE}/businesses/${id}/reviews/`)
  if (!res.ok) throw new Error('Ошибка загрузки отзывов')
  return res.json()
}

export async function apiCreateBusinessReview(id, data, token) {
  const res = await fetch(`${BASE}/businesses/${id}/reviews/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Ошибка создания отзыва')
  }
  return res.json()
}

export async function apiGetProductReviews(id) {
  const res = await fetch(`${BASE}/products/${id}/reviews/`)
  if (!res.ok) throw new Error('Ошибка загрузки отзывов')
  return res.json()
}

export async function apiCreateProductReview(id, data, token) {
  const res = await fetch(`${BASE}/products/${id}/reviews/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Ошибка создания отзыва')
  }
  return res.json()
}

export async function apiGetInquiryMessages(inquiryId, token) {
  const res = await fetch(`${BASE}/inquiries/${inquiryId}/messages/`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Ошибка загрузки сообщений')
  return res.json()
}

// ── Content Delete ─────────────────────────────────────────────────────────────

export async function apiDeletePost(bizId, postId, token) {
  const res = await fetch(`${BASE}/businesses/${bizId}/posts/${postId}/`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Ошибка удаления поста')
}

export async function apiDeleteStory(storyId, token) {
  const res = await fetch(`${BASE}/stories/${storyId}/`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Ошибка удаления истории')
}

export async function apiDeleteProduct(bizId, productId, token) {
  const res = await fetch(`${BASE}/businesses/${bizId}/products/${productId}/`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Ошибка удаления продукта')
}

export async function apiGetMyBusiness() {
  const tokens = JSON.parse(localStorage.getItem('auth_tokens') || 'null')
  const access = tokens?.access
  const res = await fetch(`${BASE}/businesses/me/`, {
    headers: access ? { 'Authorization': `Bearer ${access}` } : {},
  })
  if (!res.ok) return null
  return res.json()
}

export async function apiUpdateMyBusiness(data, token) {
  const res = await fetch(`${BASE}/businesses/me/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Ошибка обновления профиля')
  return res.json()
}

export async function apiUpdateProduct(bizId, productId, data, token) {
  const res = await fetch(`${BASE}/businesses/${bizId}/products/${productId}/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Ошибка обновления продукта')
  return res.json()
}

export async function apiGetBusinessStories(bizId, token) {
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
  // Try ?business_id= param; backend may also support ?business=
  const res = await fetch(`${BASE}/stories/?business_id=${bizId}`, { headers })
  if (res.ok) {
    const data = await res.json()
    // If backend ignores the param and returns all, filter client-side
    const list = Array.isArray(data) ? data : (data.results || [])
    return list.filter(s => {
      const id = s.business_id ?? s.business ?? s.user_id ?? s.user
      return id == null || String(id) === String(bizId)
    })
  }
  // Fallback: fetch all and filter
  const res2 = await fetch(`${BASE}/stories/`, { headers })
  if (!res2.ok) throw new Error('Ошибка загрузки историй')
  const all = await res2.json()
  const list = Array.isArray(all) ? all : (all.results || [])
  return list.filter(s => {
    const id = s.business_id ?? s.business ?? s.user_id ?? s.user
    return String(id) === String(bizId)
  })
}

// ── Inquiry Delete ─────────────────────────────────────────────────────────────

export async function apiDeleteInquiryMessage(inquiryId, msgId, token) {
  const res = await fetch(`${BASE}/inquiries/${inquiryId}/messages/${msgId}/`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Ошибка удаления')
}

export async function apiEditInquiryMessage(inquiryId, msgId, text, token) {
  const res = await fetch(`${BASE}/inquiries/${inquiryId}/messages/${msgId}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) throw new Error('Ошибка редактирования')
  return res.json()
}

export async function apiEditGroupMessage(groupId, msgId, text, token) {
  const res = await fetch(`${BASE}/groups/${groupId}/messages/${msgId}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) throw new Error('Ошибка редактирования')
  return res.json()
}

export async function apiSendInquiryMessage(inquiryId, text, token) {
  const res = await fetch(`${BASE}/inquiries/${inquiryId}/messages/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) throw new Error('Ошибка отправки сообщения')
  return res.json()
}

export async function apiSendProductInquiry(productId, message, token) {
  const res = await fetch(`${BASE}/products/${productId}/inquiry/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
  })
  if (!res.ok) throw new Error('Ошибка отправки сообщения')
  return res.json()
}

export async function apiGetSubscription(bizId, token) {
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
  const res = await fetch(`${BASE}/businesses/${bizId}/subscribe/`, { headers })
  if (!res.ok) throw new Error('Ошибка')
  return res.json()
}

export async function apiToggleSubscription(bizId, token) {
  const res = await fetch(`${BASE}/businesses/${bizId}/subscribe/`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Ошибка подписки')
  // Сбрасываем кэш бизнеса и постов чтобы is_subscribed обновился
  invalidateCache(`business:${bizId}`)
  return res.json()
}

// ─── Group chats ───

export async function apiGetGroups(token) {
  const res = await fetch(`${BASE}/groups/`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Ошибка загрузки групп')
  return res.json()
}

export async function apiCreateGroup(data, token) {
  const res = await fetch(`${BASE}/groups/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data),
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || 'Ошибка') }
  return res.json()
}

export async function apiGetGroupDetail(groupId, token) {
  const res = await fetch(`${BASE}/groups/${groupId}/`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Группа не найдена')
  return res.json()
}

export async function apiUpdateGroup(groupId, data, token) {
  const res = await fetch(`${BASE}/groups/${groupId}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data),
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || 'Ошибка') }
  return res.json()
}

export async function apiDeleteGroup(groupId, token) {
  const res = await fetch(`${BASE}/groups/${groupId}/`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Ошибка удаления группы')
}

export async function apiGetGroupMembers(groupId, token) {
  const res = await fetch(`${BASE}/groups/${groupId}/members/`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Ошибка загрузки участников')
  return res.json()
}

export async function apiAddGroupMember(groupId, data, token) {
  const res = await fetch(`${BASE}/groups/${groupId}/members/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data),
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || 'Ошибка') }
  return res.json()
}

export async function apiUpdateGroupMember(groupId, memberId, data, token) {
  const res = await fetch(`${BASE}/groups/${groupId}/members/${memberId}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data),
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || 'Ошибка') }
  return res.json()
}

export async function apiRemoveGroupMember(groupId, memberId, token) {
  const res = await fetch(`${BASE}/groups/${groupId}/members/${memberId}/`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || 'Ошибка') }
}

export async function apiGetGroupMessages(groupId, token) {
  const res = await fetch(`${BASE}/groups/${groupId}/messages/`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Ошибка загрузки сообщений')
  return res.json()
}

export async function apiSendGroupMessage(groupId, text, token) {
  const res = await fetch(`${BASE}/groups/${groupId}/messages/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) throw new Error('Ошибка отправки')
  return res.json()
}

export async function apiDeleteGroupMessage(groupId, msgId, token) {
  const res = await fetch(`${BASE}/groups/${groupId}/messages/${msgId}/`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || 'Ошибка') }
}

export async function apiPinGroupMessage(groupId, msgId, pinned, token) {
  const res = await fetch(`${BASE}/groups/${groupId}/messages/${msgId}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ is_pinned: pinned }),
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || 'Ошибка') }
  return res.json()
}

export async function apiJoinGroup(groupId, token) {
  const res = await fetch(`${BASE}/groups/${groupId}/join/`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Ошибка')
  return res.json()
}

export async function apiCheckGroupMembership(groupId, token) {
  const res = await fetch(`${BASE}/groups/${groupId}/join/`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Ошибка')
  return res.json()
}

export async function apiSearchProducts(query, token) {
  const res = await fetch(`${BASE}/products/search/?q=${encodeURIComponent(query)}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Ошибка поиска товаров')
  return res.json()
}

export const CATEGORY_LABELS = {
  BEAUTY:    'Красота и уход',
  HEALTH:    'Здоровье',
  REALTY:    'Недвижимость',
  EDUCATION: 'Образование',
  FINANCE:   'Финансы',
  LEGAL:     'Юридические услуги',
  TOURISM:   'Туризм',
  FOOD:      'Еда и рестораны',
  TRANSPORT: 'Транспорт',
  OTHER:     'Другое',
}

export const apiGetProducts = async () => {
  try {
    const response = await fetch(`${BASE}/products/`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Ошибка в apiGetProducts:", error);
    return [];
  }
};

export const apiGetNews = async () => {
  try {
    const response = await fetch(`${BASE}/news/`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Ошибка в apiGetNews:", error);
    return [];
  }
};