import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import './AuthPage.css'

const CITIES = ['Стамбул', 'Анкара', 'Анталья', 'Измир', 'Бурса', 'Алматы', 'Ташкент', 'Другой']

export default function RegisterPage() {
  const { register, verifyEmail } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    username: '', email: '', password: '', confirm: '',
    role: 'USER', city: '', agree: false,
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  // Шаг 3 — верификация кода
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const codeRefs = useRef([])
  const [codeError, setCodeError] = useState('')

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
    setErrors(er => ({ ...er, [name]: '' }))
  }

  // ── Валидация ──────────────────────────────────────────────────────────────
  const validateStep1 = () => {
    const errs = {}
    if (!form.username.trim()) errs.username = 'Введите имя пользователя'
    else if (form.username.length < 3) errs.username = 'Минимум 3 символа'
    if (!form.email.trim()) errs.email = 'Введите email'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Некорректный email'
    if (!form.password) errs.password = 'Введите пароль'
    else if (form.password.length < 6) errs.password = 'Минимум 6 символов'
    if (form.password !== form.confirm) errs.confirm = 'Пароли не совпадают'
    return errs
  }

  const validateStep2 = () => {
    const errs = {}
    if (!form.city) errs.city = 'Выберите город'
    if (!form.agree) errs.agree = 'Необходимо согласие'
    return errs
  }

  // ── Шаг 1 → 2 ─────────────────────────────────────────────────────────────
  const handleNext = () => {
    const errs = validateStep1()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setStep(2)
  }

  // ── Шаг 2 → 3: отправка регистрации на бэкенд ─────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault()
    const errs = validateStep2()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    const result = await register(form)
    setLoading(false)
    if (result.ok) {
      setStep(3)
    } else {
      // Если ошибка связана с email — вернуть на шаг 1
      if (result.error?.toLowerCase().includes('email')) {
        setErrors({ email: result.error })
        setStep(1)
      } else {
        setErrors({ general: result.error })
      }
    }
  }

  // ── Ввод кода верификации ──────────────────────────────────────────────────
  const handleCodeChange = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...code]
    next[i] = val
    setCode(next)
    setCodeError('')
    if (val && i < 5) codeRefs.current[i + 1]?.focus()
  }

  const handleCodeKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      codeRefs.current[i - 1]?.focus()
    }
  }

  const handleCodePaste = (e) => {
    e.preventDefault()
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const next = [...code]
    paste.split('').forEach((ch, i) => { next[i] = ch })
    setCode(next)
    codeRefs.current[Math.min(paste.length, 5)]?.focus()
  }

  // ── Шаг 3: подтверждение кода ──────────────────────────────────────────────
  const handleVerify = async (e) => {
    e.preventDefault()
    const codeStr = code.join('')
    if (codeStr.length < 6) { setCodeError('Введите все 6 цифр'); return }
    setLoading(true)
    const result = await verifyEmail(form.email, codeStr, form.password)
    setLoading(false)
    if (result.ok) navigate('/')
    else setCodeError(result.error)
  }

  // ── Рендер шагов ──────────────────────────────────────────────────────────
  const stepsConfig = [
    { label: 'Аккаунт' },
    { label: 'Профиль' },
    { label: 'Код' },
  ]

  return (
    <div className="auth-page">
      <div className="auth-page__blob auth-page__blob--1" />
      <div className="auth-page__blob auth-page__blob--2" />

      {/* Top bar */}
      <div className="auth-page__topbar">
        <div className="auth-page__logo" onClick={() => navigate('/')}>БизнесТурция</div>
        <button className="auth-page__icon-btn" onClick={toggleTheme} title="Тема">
          {theme === 'light'
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>
          }
        </button>
      </div>

      <div className="auth-page__center">
        <div className="auth-card auth-card--wide">

          {/* Header */}
          <div className="auth-card__header">
            <div className="auth-card__icon auth-card__icon--purple">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
            </div>
            <h1 className="auth-card__title">Создать аккаунт</h1>
            <p className="auth-card__subtitle">Присоединяйтесь к бизнес-сообществу</p>
          </div>

          {/* Steps indicator */}
          <div className="auth-steps">
            {stepsConfig.map((s, i) => (
              <>
                <div key={s.label} className={[
                  'auth-steps__item',
                  step >= i + 1 ? 'auth-steps__item--active' : '',
                  step > i + 1 ? 'auth-steps__item--done' : '',
                ].join(' ')}>
                  <div className="auth-steps__dot">
                    {step > i + 1
                      ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      : i + 1}
                  </div>
                  <span>{s.label}</span>
                </div>
                {i < stepsConfig.length - 1 && <div key={`line-${i}`} className="auth-steps__line" />}
              </>
            ))}
          </div>

          {/* ── Шаг 1: Аккаунт ── */}
          {step === 1 && (
            <div className="auth-card__form">

              {/* Username */}
              <div className="auth-field">
                <label className="auth-field__label">Имя пользователя</label>
                <div className="auth-field__wrap">
                  <span className="auth-field__icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </span>
                  <input className={`auth-field__input ${errors.username ? 'auth-field__input--error' : ''}`}
                    type="text" name="username" placeholder="username (латиница)"
                    value={form.username} onChange={handleChange} autoComplete="username" />
                </div>
                {errors.username && <span className="auth-field__error">{errors.username}</span>}
              </div>

              {/* Email */}
              <div className="auth-field">
                <label className="auth-field__label">Email</label>
                <div className="auth-field__wrap">
                  <span className="auth-field__icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </span>
                  <input className={`auth-field__input ${errors.email ? 'auth-field__input--error' : ''}`}
                    type="email" name="email" placeholder="your@email.com"
                    value={form.email} onChange={handleChange} autoComplete="email" />
                </div>
                {errors.email && <span className="auth-field__error">{errors.email}</span>}
              </div>

              {/* Password */}
              <div className="auth-field">
                <label className="auth-field__label">Пароль</label>
                <div className="auth-field__wrap">
                  <span className="auth-field__icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </span>
                  <input className={`auth-field__input ${errors.password ? 'auth-field__input--error' : ''}`}
                    type={showPass ? 'text' : 'password'} name="password" placeholder="Минимум 6 символов"
                    value={form.password} onChange={handleChange} autoComplete="new-password" />
                  <button type="button" className="auth-field__eye" onClick={() => setShowPass(s => !s)}>
                    {showPass
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
                {errors.password && <span className="auth-field__error">{errors.password}</span>}
              </div>

              {/* Confirm */}
              <div className="auth-field">
                <label className="auth-field__label">Повторите пароль</label>
                <div className="auth-field__wrap">
                  <span className="auth-field__icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </span>
                  <input className={`auth-field__input ${errors.confirm ? 'auth-field__input--error' : ''}`}
                    type="password" name="confirm" placeholder="••••••••"
                    value={form.confirm} onChange={handleChange} autoComplete="new-password" />
                </div>
                {errors.confirm && <span className="auth-field__error">{errors.confirm}</span>}
              </div>

              <button className="auth-card__submit auth-card__submit--purple" type="button" onClick={handleNext}>
                Далее →
              </button>
            </div>
          )}

          {/* ── Шаг 2: Профиль ── */}
          {step === 2 && (
            <form className="auth-card__form" onSubmit={handleRegister}>

              {/* Роль */}
              <div className="auth-field">
                <label className="auth-field__label">Тип аккаунта</label>
                <div className="auth-role-btns">
                  <label className={`auth-role-btn ${form.role === 'USER' ? 'auth-role-btn--active' : ''}`}>
                    <input type="radio" name="role" value="USER" checked={form.role === 'USER'} onChange={handleChange} />
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <span>Пользователь</span>
                    <small>Ищу услуги</small>
                  </label>
                  <label className={`auth-role-btn ${form.role === 'BUSINESS' ? 'auth-role-btn--active' : ''}`}>
                    <input type="radio" name="role" value="BUSINESS" checked={form.role === 'BUSINESS'} onChange={handleChange} />
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>
                    <span>Бизнесмен</span>
                    <small>Продвигаю бизнес</small>
                  </label>
                </div>
              </div>

              {/* City */}
              <div className="auth-field">
                <label className="auth-field__label">Город</label>
                <div className="auth-field__wrap">
                  <span className="auth-field__icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  </span>
                  <select className={`auth-field__input auth-field__input--select ${errors.city ? 'auth-field__input--error' : ''}`}
                    name="city" value={form.city} onChange={handleChange}>
                    <option value="">Выберите город</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {errors.city && <span className="auth-field__error">{errors.city}</span>}
              </div>

              {/* Agree */}
              <label className="auth-checkbox">
                <input type="checkbox" name="agree" checked={form.agree} onChange={handleChange} className="auth-checkbox__input" />
                <span className="auth-checkbox__box" />
                <span className="auth-checkbox__label">
                  Я принимаю <span className="auth-card__switch-link">условия использования</span> и <span className="auth-card__switch-link">политику конфиденциальности</span>
                </span>
              </label>
              {errors.agree && <span className="auth-field__error">{errors.agree}</span>}

              {errors.general && <div className="auth-card__error">{errors.general}</div>}

              <div className="auth-card__two-btns">
                <button type="button" className="auth-card__back" onClick={() => setStep(1)}>← Назад</button>
                <button className="auth-card__submit auth-card__submit--purple" type="submit" disabled={loading}>
                  {loading ? <span className="auth-card__spinner" /> : 'Создать аккаунт'}
                </button>
              </div>
            </form>
          )}

          {/* ── Шаг 3: Подтверждение email ── */}
          {step === 3 && (
            <form className="auth-card__form" onSubmit={handleVerify}>
              <div className="auth-verify">
                <div className="auth-verify__icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
                <p className="auth-verify__text">
                  Код подтверждения отправлен на<br />
                  <strong>{form.email}</strong>
                </p>
                <p className="auth-verify__hint">Введите 6-значный код из письма</p>
              </div>

              {/* Code inputs */}
              <div className="auth-code-inputs" onPaste={handleCodePaste}>
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => codeRefs.current[i] = el}
                    className={`auth-code-input ${codeError ? 'auth-code-input--error' : ''} ${digit ? 'auth-code-input--filled' : ''}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleCodeChange(i, e.target.value)}
                    onKeyDown={e => handleCodeKeyDown(i, e)}
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              {codeError && <div className="auth-card__error">{codeError}</div>}

              <button className="auth-card__submit auth-card__submit--purple" type="submit" disabled={loading}>
                {loading ? <span className="auth-card__spinner" /> : 'Подтвердить'}
              </button>

              <p className="auth-verify__resend">
                Не пришёл код?{' '}
                <span className="auth-card__switch-link" onClick={() => setStep(2)}>Отправить снова</span>
              </p>
            </form>
          )}

          <div className="auth-card__footer">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="auth-card__switch-link">Войти</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
