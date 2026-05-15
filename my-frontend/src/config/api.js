// PROD: same-origin relative paths. The frontend nginx proxies /api and
// /media to the Django backend, so this works behind any IP or domain
// without rebuilding.
export const API_URL = import.meta.env.PROD
  ? '/api'
  : 'http://127.0.0.1:8000/api'

export const API_ORIGIN = import.meta.env.PROD
  ? ''
  : 'http://127.0.0.1:8000'
