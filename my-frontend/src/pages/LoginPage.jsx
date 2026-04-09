import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
import { apiGoogleAuth } from '../api/authApi'
import './AuthPage.css'

export default function LoginPage() {
  const { login, loginWithData } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true)
      setError('')
      try {
        // useGoogleLogin returns access_token (implicit flow), not id_token
        // We send it as credential and backend handles it via tokeninfo
        const data = await apiGoogleAuth({ credential: tokenResponse.access_token })
        loginWithData(data)
        navigate(data.user?.role === 'BUSINESS' ? '/dashboard' : '/')
      } catch (err) {
        setError(err.message)
      } finally {
        setGoogleLoading(false)
      }
    },
    onError: () => setError(t('auth_loginError')),
  })

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      setError(t('auth_fillAll'))
      return
    }
    setLoading(true)
    const result = await login(form.email, form.password)
    setLoading(false)
    if (result.ok) {
      navigate(result.user?.role === 'BUSINESS' ? '/dashboard' : '/')
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="auth-page">
      {/* Background blobs */}
      <div className="auth-page__blob auth-page__blob--1" />
      <div className="auth-page__blob auth-page__blob--2" />

      {/* Top bar */}
      <div className="auth-page__topbar">
        <div className="auth-page__logo" onClick={() => navigate('/')}>{t('appName')}</div>
        <div className="auth-page__topbar-actions">
          <button className="auth-page__icon-btn" onClick={toggleTheme} title="Тема">
            {theme === 'light' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>
            )}
          </button>
        </div>
      </div>

      <div className="auth-page__center">
        <div className="auth-card">
          <button className="auth-card__close" onClick={() => navigate(-1)} title="Закрыть">✕</button>
          {/* Header */}
          <div className="auth-card__header">
            <div className="auth-card__icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <h1 className="auth-card__title">{t('auth_login')}</h1>
            <p className="auth-card__subtitle">{t('auth_loginBtn')} в свой аккаунт</p>
          </div>

          <form className="auth-card__form" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="auth-field">
              <label className="auth-field__label">{t('auth_email')}</label>
              <div className="auth-field__wrap">
                <span className="auth-field__icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </span>
                <input
                  className="auth-field__input"
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-field">
              <label className="auth-field__label">{t('auth_password')}</label>
              <div className="auth-field__wrap">
                <span className="auth-field__icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input
                  className="auth-field__input"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />
                <button type="button" className="auth-field__eye" onClick={() => setShowPassword(s => !s)}>
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Forgot */}
            <div className="auth-card__forgot">
              <Link to="/forgot-password" className="auth-card__forgot-link">{t('auth_forgotPassword')}</Link>
            </div>

            {/* Error */}
            {error && <div className="auth-card__error">{error}</div>}

            {/* Submit */}
            <button className="auth-card__submit" type="submit" disabled={loading}>
              {loading ? <span className="auth-card__spinner" /> : t('auth_loginBtn')}
            </button>

            {/* Divider */}
            <div className="auth-card__divider"><span>или</span></div>

            {/* Social buttons */}
            <div className="auth-card__socials">
              <button
                type="button"
                className="auth-social-btn auth-social-btn--google auth-social-btn--full"
                onClick={() => handleGoogleLogin()}
                disabled={googleLoading}
              >
                {googleLoading ? <span className="auth-card__spinner" style={{ borderTopColor: '#4285F4', borderColor: 'rgba(66,133,244,0.3)', width: 16, height: 16 }} /> : (
                  <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                )}
                {t('auth_loginGoogle')}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="auth-card__footer">
            {t('auth_noAccount')}{' '}
            <Link to="/register" className="auth-card__switch-link">{t('nav_register')}</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
