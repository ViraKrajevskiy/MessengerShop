const BASE = import.meta.env.PROD
  ? 'https://api.101-school.uz/api'
  : 'http://127.0.0.1:8000/api'

export async function apiGetBusinesses(params = {}) {
  const q = new URLSearchParams()
  if (params.vip)      q.set('vip', 'true')
  if (params.city)     q.set('city', params.city)
  if (params.category) q.set('category', params.category)
  if (params.search)   q.set('search', params.search)
  const res = await fetch(`${BASE}/businesses/?${q}`)
  if (!res.ok) throw new Error('Ошибка загрузки бизнесов')
  return res.json()
}

export async function apiGetBusiness(id) {
  const res = await fetch(`${BASE}/businesses/${id}/`)
  if (!res.ok) throw new Error('Бизнес не найден')
  return res.json()
}

export async function apiGetBusinessProducts(id) {
  const res = await fetch(`${BASE}/businesses/${id}/products/`)
  if (!res.ok) throw new Error('Ошибка загрузки товаров')
  return res.json()
}

export async function apiGetStories() {
  const res = await fetch(`${BASE}/stories/`)
  if (!res.ok) throw new Error('Ошибка загрузки сторисов')
  return res.json()
}

export async function apiGetPosts() {
  const res = await fetch(`${BASE}/posts/`)
  if (!res.ok) throw new Error('Ошибка загрузки постов')
  return res.json()
}

export async function apiGetBusinessPosts(id) {
  const res = await fetch(`${BASE}/businesses/${id}/posts/`)
  if (!res.ok) throw new Error('Ошибка загрузки постов бизнеса')
  return res.json()
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

// Карта category code → русское название
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
