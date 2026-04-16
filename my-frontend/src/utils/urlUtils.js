import { API_ORIGIN } from '../config/api'

export function resolveUrl(url) {
  if (!url) return null
  if (url.startsWith('http')) return url
  return `${API_ORIGIN}${url}`
}
