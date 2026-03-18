import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import './Header.css'

export default function Header() {
  const [lang, setLang] = useState('Русский')
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  return (
    <header className="header">
      <div className="header__logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>LOGO</div>
      <div className="header__actions">
        <input type="text" placeholder="Логин" className="header__input" />
        <input type="password" placeholder="Пароль" className="header__input" />
        <button className="header__btn header__btn--login">ВОЙТИ</button>
        <button className="header__btn header__btn--register">ЗАРЕГИСТРИРОВАТЬСЯ</button>
        <button className="header__messenger-btn" onClick={() => navigate('/messenger')} title="Мессенджер">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          <span className="header__messenger-badge">11</span>
        </button>
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
