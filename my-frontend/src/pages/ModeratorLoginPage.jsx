import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiModeratorLogin } from '../api/moderatorApi'
import './ModeratorLoginPage.css'

export default function ModeratorLoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', secret_key: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showKey, setShowKey] = useState(false)

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password || !form.secret_key) {
      setError('Заполните все поля')
      return
    }
    setLoading(true)
    try {
      const data = await apiModeratorLogin(form)
      localStorage.setItem('mod_tokens', JSON.stringify({ access: data.access, refresh: data.refresh }))
      localStorage.setItem('mod_user', JSON.stringify(data.user))
      navigate('/moderator')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mod-login">
      <div className="mod-login__bg" />

      <div className="mod-login__card">
        {/* Header */}
        <div className="mod-login__header">
          <div className="mod-login__shield">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h1 className="mod-login__title">Панель модератора</h1>
          <p className="mod-login__subtitle">Доступ только для авторизованных сотрудников</p>
        </div>

        <form className="mod-login__form" onSubmit={handleSubmit}>
          {/* Email */}
          <div className="mod-field">
            <label className="mod-field__label">Email</label>
            <div className="mod-field__wrap">
              <span className="mod-field__icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </span>
              <input
                className="mod-field__input"
                type="email"
                name="email"
                placeholder="moderator@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="mod-field">
            <label className="mod-field__label">Пароль</label>
            <div className="mod-field__wrap">
              <span className="mod-field__icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input
                className="mod-field__input"
                type={showPass ? 'text' : 'password'}
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
              <button type="button" className="mod-field__eye" onClick={() => setShowPass(s => !s)}>
                {showPass
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          {/* Secret key */}
          <div className="mod-field">
            <label className="mod-field__label">Секретный ключ</label>
            <div className="mod-field__wrap">
              <span className="mod-field__icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                </svg>
              </span>
              <input
                className="mod-field__input"
                type={showKey ? 'text' : 'password'}
                name="secret_key"
                placeholder="Секретный ключ"
                value={form.secret_key}
                onChange={handleChange}
                autoComplete="off"
              />
              <button type="button" className="mod-field__eye" onClick={() => setShowKey(s => !s)}>
                {showKey
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          {error && <div className="mod-login__error">{error}</div>}

          <button className="mod-login__submit" type="submit" disabled={loading}>
            {loading
              ? <span className="mod-login__spinner" />
              : <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  Войти в панель
                </>
            }
          </button>
        </form>

        <p className="mod-login__footer">
          Нет доступа? Обратитесь к администратору системы.
        </p>
      </div>
    </div>
  )
}
