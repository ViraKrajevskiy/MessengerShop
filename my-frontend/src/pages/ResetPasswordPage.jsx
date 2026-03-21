import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import './AuthPage.css'

const BASE = 'https://api.101-school.uz/api'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const uid   = searchParams.get('uid')   || ''
  const token = searchParams.get('token') || ''

  const [password, setPassword]   = useState('')
  const [password2, setPassword2] = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [status, setStatus]       = useState('idle')
  const [error, setError]         = useState('')

  if (!uid || !token) {
    return (
      <div className="auth-page">
        <div className="auth-page__center">
          <div className="auth-card">
            <div className="auth-card__header">
              <h1 className="auth-card__title">Неверная ссылка</h1>
              <p className="auth-card__subtitle">Ссылка недействительна или устарела.</p>
            </div>
            <div className="auth-card__footer">
              <Link to="/forgot-password" className="auth-card__switch-link">Запросить новую ссылку</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 6) { setError('Минимум 6 символов'); return }
    if (password !== password2) { setError('Пароли не совпадают'); return }

    setStatus('loading')
    setError('')
    try {
      const res = await fetch(`${BASE}/auth/password-reset/confirm/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, token, password }),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('done')
      } else {
        setError(data.error || 'Ошибка. Возможно ссылка устарела.')
        setStatus('idle')
      }
    } catch {
      setError('Нет соединения с сервером')
      setStatus('idle')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-page__blob auth-page__blob--1" />
      <div className="auth-page__blob auth-page__blob--2" />

      <div className="auth-page__topbar">
        <div className="auth-page__logo" onClick={() => navigate('/')}>БизнесТурция</div>
      </div>

      <div className="auth-page__center">
        <div className="auth-card">
          <div className="auth-card__header">
            <div className="auth-card__icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <h1 className="auth-card__title">Новый пароль</h1>
            <p className="auth-card__subtitle">Придумайте надёжный пароль</p>
          </div>

          {status === 'done' ? (
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 8 }}>
                Пароль изменён!
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
                Теперь можете войти с новым паролем.
              </p>
              <button className="auth-card__submit" onClick={() => navigate('/login')}>
                Войти
              </button>
            </div>
          ) : (
            <form className="auth-card__form" onSubmit={handleSubmit}>
              <div className="auth-field">
                <label className="auth-field__label">Новый пароль</label>
                <div className="auth-field__wrap">
                  <span className="auth-field__icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </span>
                  <input
                    className="auth-field__input"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Минимум 6 символов"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError('') }}
                  />
                  <button type="button" className="auth-field__eye" onClick={() => setShowPass(s => !s)}>
                    {showPass
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-field__label">Повторите пароль</label>
                <div className="auth-field__wrap">
                  <span className="auth-field__icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </span>
                  <input
                    className="auth-field__input"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Повторите пароль"
                    value={password2}
                    onChange={e => { setPassword2(e.target.value); setError('') }}
                  />
                </div>
              </div>

              {error && <div className="auth-card__error">{error}</div>}

              <button className="auth-card__submit" type="submit" disabled={status === 'loading'}>
                {status === 'loading' ? <span className="auth-card__spinner" /> : 'Сохранить пароль'}
              </button>
            </form>
          )}

          <div className="auth-card__footer">
            <Link to="/login" className="auth-card__switch-link">← Вернуться ко входу</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
