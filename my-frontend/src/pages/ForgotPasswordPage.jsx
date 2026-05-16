import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'
import { apiSendPasswordResetCode, apiVerifyPasswordResetCode } from '../api/authApi'
import './AuthPage.css'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { theme, toggleTheme } = useTheme()

  const [step, setStep] = useState(1) // 1: email+password | 2: code verification
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  // Шаг 2 — верификация кода
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const codeRefs = useRef([])
  const [codeError, setCodeError] = useState('')

  // ── Валидация шага 1 ────────────────────────────────────────────────────────
  const validateStep1 = () => {
    const errs = {}
    if (!email.trim()) errs.email = t('reg_enterEmail')
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = t('reg_invalidEmail')
    if (!newPassword) errs.newPassword = t('reg_enterPassword')
    else if (newPassword.length < 6) errs.newPassword = t('reg_min6')
    if (newPassword !== confirmPassword) errs.confirmPassword = t('reg_pwdMismatch')
    return errs
  }

  // ── Шаг 1: Отправка кода на email ────────────────────────────────────────
  const handleSendCode = async (e) => {
    e.preventDefault()
    const errs = validateStep1()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setErrors({})
    try {
      await apiSendPasswordResetCode(email)
      setStep(2)
    } catch (err) {
      setErrors({ general: err.message })
    } finally {
      setLoading(false)
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

  // ── Шаг 2: Подтверждение кода и сброс пароля ─────────────────────────────
  const handleVerifyCode = async (e) => {
    e.preventDefault()
    const codeStr = code.join('')
    if (codeStr.length < 6) { setCodeError(t('reg_codeFull')); return }

    setLoading(true)
    try {
      await apiVerifyPasswordResetCode({
        email,
        code: codeStr,
        new_password: newPassword,
      })
      // Успешно, переходим на login
      navigate('/login', { state: { message: t('pwd_reset_success') } })
    } catch (err) {
      setCodeError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-page__blob auth-page__blob--1" />
      <div className="auth-page__blob auth-page__blob--2" />

      <div className="auth-page__topbar">
        <div className="auth-page__logo" onClick={() => navigate('/')}>{t('appName')}</div>
        <button className="auth-page__icon-btn" onClick={toggleTheme} title={t('theme')}>
          {theme === 'light'
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>
          }
        </button>
      </div>

      <div className="auth-page__center">
        <div className="auth-card">
          <button className="auth-card__close" onClick={() => navigate(-1)} title={t('close')}>✕</button>

          <div className="auth-card__header">
            <div className="auth-card__icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <h1 className="auth-card__title">{t('pwd_reset_title')}</h1>
            <p className="auth-card__subtitle">{t('pwd_reset_sub')}</p>
          </div>

          {/* ── Шаг 1: Email и новый пароль ── */}
          {step === 1 && (
            <form className="auth-card__form" onSubmit={handleSendCode}>
              {/* Email */}
              <div className="auth-field">
                <label className="auth-field__label">{t('auth_email')}</label>
                <div className="auth-field__wrap">
                  <span className="auth-field__icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </span>
                  <input
                    className={`auth-field__input ${errors.email ? 'auth-field__input--error' : ''}`}
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setErrors(er => ({ ...er, email: '' })) }}
                    autoComplete="email"
                  />
                </div>
                {errors.email && <span className="auth-field__error">{errors.email}</span>}
              </div>

              {/* New Password */}
              <div className="auth-field">
                <label className="auth-field__label">{t('reg_newPassword')}</label>
                <div className="auth-field__wrap">
                  <span className="auth-field__icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </span>
                  <input
                    className={`auth-field__input ${errors.newPassword ? 'auth-field__input--error' : ''}`}
                    type={showPass ? 'text' : 'password'}
                    placeholder={t('reg_min6')}
                    value={newPassword}
                    onChange={e => { setNewPassword(e.target.value); setErrors(er => ({ ...er, newPassword: '' })) }}
                    autoComplete="new-password"
                  />
                  <button type="button" className="auth-field__eye" onClick={() => setShowPass(s => !s)}>
                    {showPass
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
                {errors.newPassword && <span className="auth-field__error">{errors.newPassword}</span>}
              </div>

              {/* Confirm Password */}
              <div className="auth-field">
                <label className="auth-field__label">{t('reg_confirmPwd')}</label>
                <div className="auth-field__wrap">
                  <span className="auth-field__icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </span>
                  <input
                    className={`auth-field__input ${errors.confirmPassword ? 'auth-field__input--error' : ''}`}
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setErrors(er => ({ ...er, confirmPassword: '' })) }}
                    autoComplete="new-password"
                  />
                </div>
                {errors.confirmPassword && <span className="auth-field__error">{errors.confirmPassword}</span>}
              </div>

              {errors.general && <div className="auth-card__error">{errors.general}</div>}

              <button className="auth-card__submit auth-card__submit--purple" type="submit" disabled={loading}>
                {loading ? <span className="auth-card__spinner" /> : t('pwd_sendLink')}
              </button>
            </form>
          )}

          {/* ── Шаг 2: Верификация кода ── */}
          {step === 2 && (
            <form className="auth-card__form" onSubmit={handleVerifyCode}>
              <div className="auth-verify">
                <div className="auth-verify__icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
                <p className="auth-verify__text">
                  {t('reg_codeSent')}<br />
                  <strong>{email}</strong>
                </p>
                <p className="auth-verify__hint">{t('reg_codeHint')}</p>
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
                {loading ? <span className="auth-card__spinner" /> : t('pwd_reset_title')}
              </button>

              <p className="auth-verify__resend">
                {t('reg_codeNotReceived')}{' '}
                <span className="auth-card__switch-link" onClick={() => setStep(1)}>{t('reg_codeResend')}</span>
              </p>
            </form>
          )}

          <div className="auth-card__footer">
            <Link to="/login" className="auth-card__switch-link">← {t('pwd_backToLogin')}</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
