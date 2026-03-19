import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import './Header.css'

export default function Header() {
  const [lang, setLang] = useState('Русский')
  const [menuOpen, setMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const menuRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handle = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
    navigate('/')
  }

  return (
    <header className="header">
      <div className="header__logo" onClick={() => navigate('/')}>БизнесТурция</div>

      <div className="header__actions">
        {user ? (
          /* ── Logged-in user menu ── */
          <div className="header__user-menu" ref={menuRef}>
            <button className="header__user-btn" onClick={() => setMenuOpen(o => !o)}>
              <img
                src={user.avatar || `https://i.pravatar.cc/150?u=${user.email}`}
                alt={user.username}
                className="header__user-avatar"
              />
              <span className="header__user-name">{user.username}</span>
              <svg className={`header__user-chevron ${menuOpen ? 'header__user-chevron--open' : ''}`}
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {menuOpen && (
              <div className="header__dropdown">
                <div className="header__dropdown-header">
                  <img src={user.avatar || `https://i.pravatar.cc/150?u=${user.email}`} alt={user.username} className="header__dropdown-avatar" />
                  <div>
                    <div className="header__dropdown-name">{user.username}</div>
                    <div className="header__dropdown-email">{user.email}</div>
                  </div>
                </div>
                <div className="header__dropdown-divider" />
                <button className="header__dropdown-item" onClick={() => { navigate('/me'); setMenuOpen(false) }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Мой профиль
                </button>
                <button className="header__dropdown-item" onClick={() => { navigate('/messenger'); setMenuOpen(false) }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                  Сообщения
                </button>
                <button className="header__dropdown-item" onClick={() => setMenuOpen(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                  Настройки
                </button>
                <div className="header__dropdown-divider" />
                <button className="header__dropdown-item header__dropdown-item--danger" onClick={handleLogout}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Выйти
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ── Guest auth buttons ── */
          <>
            <button className="header__btn header__btn--login" onClick={() => navigate('/login')}>
              Войти
            </button>
            <button className="header__btn header__btn--register" onClick={() => navigate('/register')}>
              Регистрация
            </button>
          </>
        )}

        {/* Messenger */}
        <button className="header__messenger-btn" onClick={() => navigate('/messenger')} title="Мессенджер">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          <span className="header__messenger-badge">11</span>
        </button>

        {/* Theme */}
        <button className="header__theme-toggle" onClick={toggleTheme} title="Сменить тему">
          {theme === 'light' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          )}
        </button>

        {/* Language */}
        <div className="header__lang">
          <select value={lang} onChange={(e) => setLang(e.target.value)} className="header__lang-select">
            <option>Русский</option>
            <option>English</option>
            <option>Türkçe</option>
          </select>
        </div>
      </div>
    </header>
  )
}
