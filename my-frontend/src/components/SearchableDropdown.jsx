import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'
import './SearchableDropdown.css'

export default function SearchableDropdown({ label, options = [], value, onChange }) {
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)

  // Close on click outside
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = options.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (opt) => {
    onChange(opt)
    setIsOpen(false)
    setSearch('')
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange('')
    setSearch('')
  }

  return (
    <div className="sd" ref={ref}>
      <div
        className={`sd__trigger ${isOpen ? 'sd__trigger--open' : ''} ${value ? 'sd__trigger--active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="sd__label">{value || label}</span>
        <div className="sd__icons">
          {value && (
            <span className="sd__clear" onClick={handleClear}>×</span>
          )}
          <span className={`sd__arrow ${isOpen ? 'sd__arrow--up' : ''}`}>▾</span>
        </div>
      </div>

      {isOpen && (
        <div className="sd__dropdown">
          <input
            type="text"
            className="sd__search"
            placeholder={`${t('dropdown_searchPh')} ${label.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <ul className="sd__list">
            {filtered.length > 0 ? (
              filtered.map((opt) => (
                <li
                  key={opt}
                  className={`sd__option ${opt === value ? 'sd__option--selected' : ''}`}
                  onClick={() => handleSelect(opt)}
                >
                  {opt}
                  {opt === value && <span className="sd__check">✓</span>}
                </li>
              ))
            ) : (
              <li className="sd__no-results">{t('nothing_found')}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
