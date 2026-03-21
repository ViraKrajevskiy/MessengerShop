import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './AuthPage.css'

const BASE = 'https://api.101-school.uz/api'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail]   = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | done | error
  const [error, setError]   = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) { setError('Введите email'); return }
    setStatus('loading')
    setError('')
    try {
      const res = await fetch(`${BASE}/auth/password-reset/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('done')
      } else {
        setError(data.error || 'Ошибка')
        setStatus('error')
      }
    } catch {
      setError('Нет соединения с сервером')
      setStatus('error')
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
            <h1 className="auth-card__title">Сброс пароля</h1>
            <p className="auth-card__subtitle">Введите email — пришлём ссылку</p>
          </div>

          {status === 'done' ? (
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📧</div>
              <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 8 }}>
                Письмо отправлено!
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
                Проверьте почту <strong>{email}</strong> и перейдите по ссылке для сброса пароля.
              </p>
              <Link to="/login" className="auth-card__submit" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
                Вернуться ко входу
              </Link>
            </div>
          ) : (
            <form className="auth-card__form" onSubmit={handleSubmit}>
              <div className="auth-field">
                <label className="auth-field__label">Email</label>
                <div className="auth-field__wrap">
                  <span className="auth-field__icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </span>
                  <input
                    className="auth-field__input"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                    autoComplete="email"
                  />
                </div>
              </div>

              {error && <div className="auth-card__error">{error}</div>}

              <button className="auth-card__submit" type="submit" disabled={status === 'loading'}>
                {status === 'loading' ? <span className="auth-card__spinner" /> : 'Отправить ссылку'}
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
