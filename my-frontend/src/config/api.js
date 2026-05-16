// В production домен берётся из переменной VITE_API_DOMAIN (задаётся в .env на сервере)
// Пример: VITE_API_DOMAIN=api.mysite.com
const PROD_DOMAIN = import.meta.env.VITE_API_DOMAIN || 'api.101-school.uz'

export const API_URL = import.meta.env.PROD
  ? `http://${PROD_DOMAIN}/api`
  : 'http://127.0.0.1:8000/api'

export const API_ORIGIN = import.meta.env.PROD
  ? `http://${PROD_DOMAIN}`
  : 'http://127.0.0.1:8000'
