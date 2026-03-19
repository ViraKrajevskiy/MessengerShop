import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { apiLogin, apiRegister, apiVerifyEmail, apiLogout, apiMe, apiRefreshToken } from '../api/authApi'

const AuthContext = createContext(null)

// ── localStorage helpers ─────────────────────────────────────────────────────
const LS = {
  get: (key) => { try { return JSON.parse(localStorage.getItem(key)) } catch { return null } },
  set: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
  del: (key) => localStorage.removeItem(key),
}

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(() => LS.get('auth_user'))
  const [tokens, setTokens] = useState(() => LS.get('auth_tokens'))
  const [loading, setLoading] = useState(false)

  // Синхронизация с localStorage
  useEffect(() => {
    if (user) LS.set('auth_user', user); else LS.del('auth_user')
  }, [user])

  useEffect(() => {
    if (tokens) LS.set('auth_tokens', tokens); else LS.del('auth_tokens')
  }, [tokens])

  // Тихое обновление access-токена при старте (если он есть, но протух)
  useEffect(() => {
    if (!tokens?.refresh || user) return
    apiRefreshToken(tokens.refresh)
      .then(data => {
        setTokens(t => ({ ...t, ...data }))
        return apiMe(data.access)
      })
      .then(me => setUser(me))
      .catch(() => {
        setUser(null)
        setTokens(null)
      })
  }, []) // eslint-disable-line

  // ── login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const data = await apiLogin({ email, password })
      setTokens({ access: data.access, refresh: data.refresh })
      setUser(data.user)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  // ── register ───────────────────────────────────────────────────────────────
  const register = useCallback(async ({ username, email, password, confirm, role, city }) => {
    setLoading(true)
    try {
      await apiRegister({ username, email, password, password2: confirm, role, city })
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  // ── verifyEmail ────────────────────────────────────────────────────────────
  // После проверки кода — автоматически логинимся
  const verifyEmail = useCallback(async (email, code, password) => {
    setLoading(true)
    try {
      await apiVerifyEmail({ email, code })
      // Аккаунт подтверждён → сразу входим
      const data = await apiLogin({ email, password })
      setTokens({ access: data.access, refresh: data.refresh })
      setUser(data.user)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  // ── logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      if (tokens?.refresh) await apiLogout(tokens.refresh, tokens.access)
    } catch { /* игнорируем ошибку логаута */ }
    setUser(null)
    setTokens(null)
  }, [tokens])

  // ── getAccessToken (с авто-рефрешем) ──────────────────────────────────────
  const getAccessToken = useCallback(async () => {
    if (!tokens) return null
    try {
      // Пробуем обновить токен (в проде — проверять exp)
      const data = await apiRefreshToken(tokens.refresh)
      setTokens(t => ({ ...t, ...data }))
      return data.access
    } catch {
      setUser(null)
      setTokens(null)
      return null
    }
  }, [tokens])

  return (
    <AuthContext.Provider value={{
      user,
      tokens,
      loading,
      isAuthenticated: !!user,
      login,
      register,
      verifyEmail,
      logout,
      getAccessToken,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
