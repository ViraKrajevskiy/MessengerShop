// Канонический origin сайта для SEO (canonical, Open Graph, sitemap-ссылки).
// В .env на сервере задаётся VITE_SITE_URL (например: https://mysite.com).
// Пока домена нет (деплой по IP) — без переменной берём текущий origin
// браузера: ссылки остаются валидными и для IP, и для будущего домена.
const ENV_SITE_URL = (import.meta.env.VITE_SITE_URL || '').trim().replace(/\/+$/, '')

export const SITE_URL = ENV_SITE_URL || (
  typeof window !== 'undefined' ? window.location.origin : ''
)

export const SITE_NAME = 'БизнесТурция'

// Абсолютный URL для canonical/OG из пути роутера.
export function absoluteUrl(path = '/') {
  const base = SITE_URL || ''
  if (!path) return base || '/'
  if (/^https?:\/\//i.test(path)) return path
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`
}
