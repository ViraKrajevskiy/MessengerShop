import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import './AuthGate.css'

/**
 * Хук — вызов action требует авторизации.
 * Если не залогинен — показывает модал.
 *
 * Использование:
 *   const { guard, AuthModal } = useAuthGate()
 *   <button onClick={() => guard(() => handleLike())}>❤</button>
 *   <AuthModal />
 */
export function useAuthGate() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  const guard = (action) => {
    if (user) {
      action?.()
    } else {
      setOpen(true)
    }
  }

  const AuthModal = () => open ? <AuthGateModal onClose={() => setOpen(false)} /> : null

  return { guard, AuthModal }
}

function AuthGateModal({ onClose }) {
  const navigate = useNavigate()
  const { t } = useLanguage()

  return (
    <div className="authgate__overlay" onClick={onClose}>
      <div className="authgate__modal" onClick={e => e.stopPropagation()}>
        <button className="authgate__close" onClick={onClose}>×</button>

        <div className="authgate__icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        <h2 className="authgate__title">{t('authGate_title')}</h2>
        <p className="authgate__text">
          {t('authGate_sub')}
        </p>

        <div className="authgate__actions">
          <button
            className="authgate__btn authgate__btn--login"
            onClick={() => { onClose(); navigate('/login') }}
          >
            {t('nav_login')}
          </button>
          <button
            className="authgate__btn authgate__btn--register"
            onClick={() => { onClose(); navigate('/register') }}
          >
            {t('nav_register')}
          </button>
        </div>

        <p className="authgate__hint">
          Просматривать профили и объявления можно без регистрации
        </p>
      </div>
    </div>
  )
}
