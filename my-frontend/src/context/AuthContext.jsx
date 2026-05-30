import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { apiLogin, apiRegister, apiVerifyEmail, apiLogout, apiMe, apiRefreshToken, apiGoOffline } from '../api/authApi'
import { syncFavoritesFromServer, clearLocalFavorites } from '../utils/favorites'

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
  const tokensRef = useRef(tokens)

  // Синхронизация с localStorage
  useEffect(() => {
    if (user) LS.set('auth_user', user); else LS.del('auth_user')
  }, [user])

  useEffect(() => {
    if (tokens) LS.set('auth_tokens', tokens); else LS.del('auth_tokens')
  }, [tokens])

  useEffect(() => {
    tokensRef.current = tokens
  }, [tokens])

  // Pull favourites from the server once logged in, so they appear across devices
  useEffect(() => {
    if (user && tokens?.access) syncFavoritesFromServer(tokens.access)
  }, [user, tokens?.access])

  // ── Мгновенный офлайн при уходе со страницы ───────────────────────────────
  useEffect(() => {
    const goOffline = () => {
      const t = tokensRef.current
      if (t?.access) apiGoOffline(t.access)
    }
    // visibilitychange: вкладка свёрнута / переключена
    const onVisibility = () => { if (document.hidden) goOffline() }
    // pagehide: надёжнее beforeunload на мобилках
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', goOffline)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', goOffline)
    }
  }, [])

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

  const loginWithData = useCallback((data) => {
    setTokens({ access: data.access, refresh: data.refresh })
    setUser(data.user)
  }, [])

  // ── login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const data = await apiLogin({ email, password })
      setTokens({ access: data.access, refresh: data.refresh })
      setUser(data.user)
      return { ok: true, user: data.user }
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
    clearLocalFavorites()
    setUser(null)
    setTokens(null)
  }, [tokens])

  // ── getAccessToken (с авто-рефрешем) ──────────────────────────────────────
  const getAccessToken = useCallback(async () => {
    const currentTokens = tokensRef.current
    if (!currentTokens?.access) return null

    // Проверяем exp access-токена — рефрешим только если истекает через <30с
    try {
      const payload = JSON.parse(atob(currentTokens.access.split('.')[1]))
      if (payload.exp && payload.exp * 1000 > Date.now() + 30_000) {
        return currentTokens.access
      }
    } catch { /* невалидный JWT — идём на рефреш */ }

    if (!currentTokens.refresh) return currentTokens.access
    try {
      const data = await apiRefreshToken(currentTokens.refresh)
      setTokens(t => ({ ...t, ...data }))
      return data.access
    } catch {
      setUser(null)
      setTokens(null)
      return null
    }
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      setUser,
      tokens,
      loading,
      isAuthenticated: !!user,
      login,
      loginWithData,
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
