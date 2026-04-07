import { createContext, useContext, useState, useCallback } from 'react'
import ru from '../i18n/ru'
import en from '../i18n/en'
import tr from '../i18n/tr'

const LANGS = { ru, en, tr }

const LANG_NAMES = {
  ru: 'Русский',
  en: 'English',
  tr: 'Türkçe',
}

const LanguageContext = createContext(null)

function getSaved() {
  try { return localStorage.getItem('lang') || 'ru' } catch { return 'ru' }
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(getSaved)

  const setLang = useCallback((code) => {
    setLangState(code)
    try { localStorage.setItem('lang', code) } catch { /* ignore */ }
  }, [])

  // t(key) — returns translation or falls back to Russian, then the key itself
  const t = useCallback((key) => {
    return LANGS[lang]?.[key] ?? LANGS.ru?.[key] ?? key
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, LANG_NAMES }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
