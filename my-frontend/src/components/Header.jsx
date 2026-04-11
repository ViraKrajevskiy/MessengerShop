import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { DEFAULT_AVATAR } from '../utils/defaults'
import './Header.css'

const ThemeIcon = ({ theme }) => theme === 'light' ? (
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

const PATH_NAMES = {
  '/':          null,
  '/catalog':   'Каталог',
  '/feed':      'Лента',
  '/messenger': 'Мессенджер',
  '/pricing':   'Цены',
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef(null)
  const [bizId, setBizId] = useState(null)
  const [bizName, setBizName] = useState(null)
  const [pageTitle, setPageTitle] = useState(null)   // for news/product pages
  const [pageParent, setPageParent] = useState(null) // e.g. { label: 'Лента', path: '/feed' }
  const { theme, toggleTheme } = useTheme()
  const { user, logout, getAccessToken } = useAuth()
  const { lang, setLang, t, LANG_NAMES } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const menuRef = useRef(null)

  // Load dynamic breadcrumb data based on current path
  useEffect(() => {
    const base = import.meta.env.PROD ? 'https://api.101-school.uz/api' : 'http://127.0.0.1:8000/api'
    const p = location.pathname

    setBizName(null)
    setPageTitle(null)
    setPageParent(null)

    const bizMatch = p.match(/^\/business\/(\d+)$/)
    const newsMatch = p.match(/^\/news\/(\d+)$/)
    const productMatch = p.match(/^\/product\/(\d+)$/)

    if (bizMatch) {
      fetch(`${base}/businesses/${bizMatch[1]}/`)
        .then(r => r.ok ? r.json() : null)
        .then(b => setBizName(b?.brand_name || 'Профиль'))
        .catch(() => setBizName('Профиль'))
    } else if (newsMatch) {
      setPageParent({ label: 'Лента', path: '/feed' })
      fetch(`${base}/posts/${newsMatch[1]}/`)
        .then(r => r.ok ? r.json() : null)
        .then(d => setPageTitle(d?.text?.slice(0, 40) || 'Публикация'))
        .catch(() => setPageTitle('Публикация'))
    } else if (productMatch) {
      setPageParent({ label: 'Каталог', path: '/catalog' })
      fetch(`${base}/products/${productMatch[1]}/`)
        .then(r => r.ok ? r.json() : null)
        .then(d => setPageTitle(d?.name?.slice(0, 40) || 'Товар'))
        .catch(() => setPageTitle('Товар'))
    }
  }, [location.pathname])

  // Derive breadcrumb current page name from path
  const currentPageName = useMemo(() => {
    const p = location.pathname
    if (p in PATH_NAMES) return PATH_NAMES[p]
    if (p.startsWith('/business/')) return bizName || 'Профиль'
    if (p.startsWith('/news/') || p.startsWith('/product/')) return pageTitle
    return '...'
  }, [location.pathname, bizName, pageTitle])

  // Close dropdowns on outside click
  useEffect(() => {
    const handle = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false)
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

  // Load business ID for BUSINESS role
  useEffect(() => {
    if (user?.role === 'BUSINESS') {
      getAccessToken().then(token => {
        if (!token) return
        fetch(`${import.meta.env.PROD ? 'https://api.101-school.uz/api' : 'http://127.0.0.1:8000/api'}/businesses/me/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.ok ? r.json() : null).then(b => setBizId(b?.id || null)).catch(() => {})
      })
    }
  }, [user, getAccessToken])

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
    setMobileOpen(false)
    navigate('/')
  }

  const go = (path) => { setMobileOpen(false); setMenuOpen(false); navigate(path) }

  return (
    <>
      <header className="header">

        {/* ── Row 1: Logo + Auth controls ── */}
        <div className="header__top">
          <div className="header__logo" onClick={() => go('/')}>БизнесТурция</div>

          <div className="header__top-right">

            {/* Language picker */}
            <div className="header__lang-picker" ref={langRef}>
              <button
                className="header__lang-globe"
                onClick={() => setLangOpen(o => !o)}
                title="Язык / Language"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                <img
                  src={`https://flagcdn.com/20x15/${lang === 'en' ? 'us' : lang}.png`}
                  width="16" height="12" alt={lang}
                  className="header__lang-globe-flag"
                />
              </button>
              {langOpen && (
                <div className="header__lang-dropdown">
                  {[
                    { code: 'ru', country: 'ru', label: 'Русский' },
                    { code: 'en', country: 'us', label: 'English' },
                    { code: 'tr', country: 'tr', label: 'Türkçe' },
                  ].map(({ code, country, label }) => (
                    <button
                      key={code}
                      className={`header__lang-option ${lang === code ? 'header__lang-option--active' : ''}`}
                      onClick={() => { setLang(code); setLangOpen(false) }}
                    >
                      <img src={`https://flagcdn.com/20x15/${country}.png`} width="20" height="15" alt={label} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme */}
            <button className="header__theme-toggle" onClick={toggleTheme} title="Сменить тему">
              <ThemeIcon theme={theme} />
            </button>

            {user ? (
              /* ── Logged-in user menu ── */
              <div className="header__user-menu" ref={menuRef}>
                <button className="header__user-btn" onClick={() => setMenuOpen(o => !o)}>
                  <img
                    src={user.avatar || DEFAULT_AVATAR}
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
                      <img src={user.avatar || DEFAULT_AVATAR} alt={user.username} className="header__dropdown-avatar" />
                      <div>
                        <div className="header__dropdown-name">{user.username}</div>
                        <div className="header__dropdown-email">{user.email}</div>
                      </div>
                    </div>
                    <div className="header__dropdown-divider" />
                    <button className="header__dropdown-item" onClick={() => { navigate('/me'); setMenuOpen(false) }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      {t('nav_profile')}
                    </button>
                    {user?.role === 'BUSINESS' && (
                      <button className="header__dropdown-item" onClick={() => { navigate('/dashboard'); setMenuOpen(false) }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                        {t('nav_dashboard')}
                      </button>
                    )}
                    <button className="header__dropdown-item" onClick={() => { navigate('/messenger'); setMenuOpen(false) }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                      {t('nav_messages')}
                    </button>
                    {user?.role === 'BUSINESS' && (
                      <button className="header__dropdown-item" onClick={() => { navigate('/verification'); setMenuOpen(false) }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        {t('nav_support')}
                      </button>
                    )}
                    <button className="header__dropdown-item" onClick={() => { navigate('/pricing'); setMenuOpen(false) }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      {t('nav_pricing')}
                    </button>
                    {user?.role === 'BUSINESS' && bizId && (
                      <button className="header__dropdown-item" onClick={() => { navigate(`/business/${bizId}`); setMenuOpen(false) }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                        {t('nav_shopPage')}
                      </button>
                    )}
                    <div className="header__dropdown-divider" />
                    <button className="header__dropdown-item header__dropdown-item--danger" onClick={handleLogout}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      {t('nav_logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* ── Guest auth buttons ── */
              <>
                <button className="header__btn header__btn--register" onClick={() => navigate('/register')}>
                  {t('nav_register')}
                </button>
                <button className="header__btn header__btn--login" onClick={() => navigate('/login')}>
                  {t('nav_login')}
                </button>
              </>
            )}

            {/* Burger button — mobile only */}
            <button
              className={`header__burger ${mobileOpen ? 'header__burger--open' : ''}`}
              onClick={() => setMobileOpen(o => !o)}
              aria-label="Меню"
            >
              <span /><span /><span />
            </button>
          </div>
        </div>

        {/* ── Row 2: Breadcrumb + Nav buttons ── */}
        <div className="header__bottom">
          <div className="header__breadcrumb">
            <span className="header__breadcrumb-home" onClick={() => go('/')}>Дом</span>
            {pageParent && (
              <>
                <span className="header__breadcrumb-sep">›</span>
                <span className="header__breadcrumb-home" onClick={() => go(pageParent.path)}>{pageParent.label}</span>
              </>
            )}
            {currentPageName && (
              <>
                <span className="header__breadcrumb-sep">›</span>
                <span className="header__breadcrumb-current">{currentPageName}</span>
              </>
            )}
          </div>

          <div className="header__nav">
            {/* Catalog button */}
            <button className="header__nav-btn" onClick={() => go('/catalog')}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
              Каталог
            </button>

            {/* Feed button */}
            <button className="header__nav-btn" onClick={() => go('/feed')}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Лента
            </button>

            {/* Messenger circle button */}
            <button className="header__messenger-btn" onClick={() => go('/messenger')} title={t('nav_messenger')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
            </button>
          </div>
        </div>

      </header>

      {/* Mobile drawer */}
      {mobileOpen && <div className="header__mobile-overlay" onClick={() => setMobileOpen(false)} />}
      <div className={`header__mobile-drawer ${mobileOpen ? 'header__mobile-drawer--open' : ''}`}>
        <div className="header__mobile-drawer-top">
          {user ? (
            <div className="header__mobile-user">
              <img src={user.avatar || DEFAULT_AVATAR} alt={user.username} className="header__mobile-avatar" />
              <div>
                <div className="header__mobile-username">{user.username}</div>
                <div className="header__mobile-email">{user.email}</div>
              </div>
            </div>
          ) : (
            <div className="header__mobile-auth">
              <button className="header__btn header__btn--login" onClick={() => go('/login')}>{t('nav_login')}</button>
              <button className="header__btn header__btn--register" onClick={() => go('/register')}>{t('nav_register')}</button>
            </div>
          )}
        </div>

        <nav className="header__mobile-nav">
          <button className="header__mobile-nav-item" onClick={() => go('/')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            {t('nav_home')}
          </button>
          <button className="header__mobile-nav-item" onClick={() => go('/feed')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            {t('nav_feed')}
          </button>
          <button className="header__mobile-nav-item" onClick={() => go('/catalog')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            {t('nav_catalog')}
          </button>
          <button className="header__mobile-nav-item" onClick={() => go('/messenger')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            {t('nav_messages')}
          </button>
          {user?.role === 'BUSINESS' && (
            <button className="header__mobile-nav-item" onClick={() => go('/verification')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              {t('nav_support')}
            </button>
          )}
          <button className="header__mobile-nav-item" onClick={() => go('/pricing')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            {t('nav_pricing')}
          </button>
          {user && (
            <>
              <button className="header__mobile-nav-item" onClick={() => go('/me')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                {t('nav_profile')}
              </button>
              {user.role === 'BUSINESS' && (
                <>
                  <button className="header__mobile-nav-item" onClick={() => go('/dashboard')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                    {t('nav_dashboard')}
                  </button>
                  {bizId && (
                    <button className="header__mobile-nav-item" onClick={() => go(`/business/${bizId}`)}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                      {t('nav_shopPage')}
                    </button>
                  )}
                </>
              )}
            </>
          )}
        </nav>

        <div className="header__mobile-footer">
          <button className="header__mobile-theme" onClick={() => { toggleTheme(); }}>
            <ThemeIcon theme={theme} />
            <span>{theme === 'light' ? t('nav_darkTheme') : t('nav_lightTheme')}</span>
          </button>
          <select name="language" value={lang} onChange={(e) => setLang(e.target.value)} className="header__lang-select">
            <option value="ru">Русский</option>
            <option value="en">English</option>
            <option value="tr">Türkçe</option>
          </select>
          {user && (
            <button className="header__mobile-nav-item header__mobile-logout" onClick={handleLogout}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              {t('nav_logout')}
            </button>
          )}
        </div>
      </div>
    </>
  )
}
