import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import ruFallback from '../i18n/locales/ru.json'
import enFallback from '../i18n/locales/en.json'
import trFallback from '../i18n/locales/tr.json'

// Bundled copy — guarantees the UI always has text, even before the runtime
// files load or if the owner saves a broken JSON on the server.
const FALLBACK = { ru: ruFallback, en: enFallback, tr: trFallback }

const LANG_NAMES = {
  ru: 'Русский',
  en: 'English',
  tr: 'Türkçe',
}

const SUPPORTED = ['ru', 'en', 'tr']

const LanguageContext = createContext(null)

function getSaved() {
  try { return localStorage.getItem('lang') || 'ru' } catch { return 'ru' }
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(getSaved)
  // Texts loaded at runtime from /locales/<lang>.json — the site owner edits
  // these files directly on the server and changes take effect on next load,
  // with no rebuild. A missing/broken file is ignored (bundled copy is used).
  const [overrides, setOverrides] = useState({})

  const setLang = useCallback((code) => {
    setLangState(code)
    try { localStorage.setItem('lang', code) } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    const need = Array.from(new Set([lang, 'ru'])).filter(
      (l) => SUPPORTED.includes(l) && !overrides[l],
    )
    if (need.length === 0) return
    let cancelled = false
    Promise.all(
      need.map((l) =>
        fetch(`/locales/${l}.json`, { cache: 'no-store' })
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => [l, data && typeof data === 'object' ? data : null])
          .catch(() => [l, null]),
      ),
    ).then((pairs) => {
      if (cancelled) return
      const add = {}
      for (const [l, data] of pairs) if (data) add[l] = data
      if (Object.keys(add).length) setOverrides((prev) => ({ ...prev, ...add }))
    })
    return () => { cancelled = true }
  }, [lang, overrides])

  // t(key) — server override → bundled copy → Russian → the key itself
  const t = useCallback((key) => {
    const cur = overrides[lang] ?? FALLBACK[lang]
    const ru = overrides.ru ?? FALLBACK.ru
    return cur?.[key] ?? ru?.[key] ?? key
  }, [lang, overrides])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, LANG_NAMES }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
