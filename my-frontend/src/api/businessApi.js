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

export async function apiGetPosts() {
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
