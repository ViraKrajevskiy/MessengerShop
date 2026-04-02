import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import './Header.css'

export default function Header() {
  const [lang, setLang] = useState('Русский')
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
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

  // Close mobile menu on resize
  useEffect(() => {
    const handle = () => { if (window.innerWidth > 640) setMobileOpen(false) }
    window.addEventListener('resize', handle)
    return () => window.removeEventListener('resize', handle)
  }, [])

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
    setMobileOpen(false)
    navigate('/')
  }

  const go = (path) => { setMobileOpen(false); setMenuOpen(false); navigate(path) }

  const ThemeIcon = () => theme === 'light' ? (
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
  )

  return (
    <>
      <header className="header">
        <div className="header__logo" onClick={() => go('/')}>БизнесТурция</div>

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
                  {user?.role === 'BUSINESS' && (
                    <button className="header__dropdown-item" onClick={() => { navigate('/dashboard'); setMenuOpen(false) }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                      Панель управления
                    </button>
                  )}
                  <button className="header__dropdown-item" onClick={() => { navigate('/messenger'); setMenuOpen(false) }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                    Сообщения
                  </button>
                  <button className="header__dropdown-item" onClick={() => { navigate('/pricing'); setMenuOpen(false) }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    Тарифы
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

          {/* Feed */}
          <button className="header__feed-btn" onClick={() => navigate('/feed')} title="Лента">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span className="header__feed-label">Лента</span>
          </button>

          {/* Messenger */}
          <button className="header__messenger-btn" onClick={() => navigate('/messenger')} title="Мессенджер">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
          </button>

          {/* Theme */}
          <button className="header__theme-toggle" onClick={toggleTheme} title="Сменить тему">
            <ThemeIcon />
          </button>

          {/* Language */}
          <div className="header__lang">
            <select name="language" value={lang} onChange={(e) => setLang(e.target.value)} className="header__lang-select">
              <option>Русский</option>
              <option>English</option>
              <option>Türkçe</option>
            </select>
          </div>

          {/* Burger button — mobile only */}
          <button
            className={`header__burger ${mobileOpen ? 'header__burger--open' : ''}`}
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Меню"
          >
            <span /><span /><span />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && <div className="header__mobile-overlay" onClick={() => setMobileOpen(false)} />}
      <div className={`header__mobile-drawer ${mobileOpen ? 'header__mobile-drawer--open' : ''}`}>
        <div className="header__mobile-drawer-top">
          {user ? (
            <div className="header__mobile-user">
              <img src={user.avatar || `https://i.pravatar.cc/150?u=${user.email}`} alt={user.username} className="header__mobile-avatar" />
              <div>
                <div className="header__mobile-username">{user.username}</div>
                <div className="header__mobile-email">{user.email}</div>
              </div>
            </div>
          ) : (
            <div className="header__mobile-auth">
              <button className="header__btn header__btn--login" onClick={() => go('/login')}>Войти</button>
              <button className="header__btn header__btn--register" onClick={() => go('/register')}>Регистрация</button>
            </div>
          )}
        </div>

        <nav className="header__mobile-nav">
          <button className="header__mobile-nav-item" onClick={() => go('/')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Главная
          </button>
          <button className="header__mobile-nav-item" onClick={() => go('/feed')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Лента
          </button>
          <button className="header__mobile-nav-item" onClick={() => go('/messenger')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            Сообщения
          </button>
          <button className="header__mobile-nav-item" onClick={() => go('/pricing')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            Тарифы
          </button>
          {user && (
            <>
              <button className="header__mobile-nav-item" onClick={() => go('/me')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Мой профиль
              </button>
              {user.role === 'BUSINESS' && (
                <button className="header__mobile-nav-item" onClick={() => go('/dashboard')}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                  Панель управления
                </button>
              )}
            </>
          )}
        </nav>

        <div className="header__mobile-footer">
          <button className="header__mobile-theme" onClick={() => { toggleTheme(); }}>
            <ThemeIcon />
            <span>{theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}</span>
          </button>
          <select name="language" value={lang} onChange={(e) => setLang(e.target.value)} className="header__lang-select">
            <option>Русский</option>
            <option>English</option>
            <option>Türkçe</option>
          </select>
          {user && (
            <button className="header__mobile-nav-item header__mobile-logout" onClick={handleLogout}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Выйти
            </button>
          )}
        </div>
      </div>
    </>
  )
}
