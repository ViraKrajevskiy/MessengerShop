import SearchableDropdown from './SearchableDropdown'
import './FilterBar.css'

const HASHTAGS = [
  'С отзывами',
  'С видео',
  '100% проверенные',
  'Обновлённые',
  'SKYPE',
  'Частные',
  'Онлайн',
  'Красота',
  'Здоровье',
  'Юрист',
  'Недвижимость',
  'Финансы',
  'Образование',
  'Переводчик',
  'Туризм',
]

export default function FilterBar({ filters, onFilterChange }) {
  const {
    country = '',
    city = '',
    category = '',
    service = '',
    activeTags = [],
  } = filters

  const countries = ['Турция', 'Россия', 'Казахстан', 'Узбекистан', 'Азербайджан', 'Грузия']
  const cities = ['Стамбул', 'Анкара', 'Анталья', 'Измир', 'Бурса', 'Ташкент', 'Алматы']
  const categories = ['Бизнес', 'Красота', 'Здоровье', 'Юридические услуги', 'Недвижимость', 'Образование', 'Финансы']
  const services = ['Консультация', 'Онлайн встреча', 'Персональный подбор', 'Перевод', 'Сопровождение', 'Аудит']

  const toggleTag = (tag) => {
    const next = activeTags.includes(tag)
      ? activeTags.filter((t) => t !== tag)
      : [...activeTags, tag]
    onFilterChange({ ...filters, activeTags: next })
  }

  const updateFilter = (key, value) => {
    onFilterChange({ ...filters, [key]: value })
  }

  return (
    <div className="filter-bar">
      <div className="filter-bar__dropdowns">
        <SearchableDropdown
          label="СТРАНА"
          options={countries}
          value={country}
          onChange={(v) => updateFilter('country', v)}
        />
        <SearchableDropdown
          label="ГОРОД"
          options={cities}
          value={city}
          onChange={(v) => updateFilter('city', v)}
        />
        <SearchableDropdown
          label="КАТЕГОРИЯ"
          options={categories}
          value={category}
          onChange={(v) => updateFilter('category', v)}
        />
        <SearchableDropdown
          label="УСЛУГИ"
          options={services}
          value={service}
          onChange={(v) => updateFilter('service', v)}
        />
      </div>

      <div className="filter-bar__tags">
        {HASHTAGS.map((tag) => {
          const isActive = activeTags.includes(tag)
          return (
            <button
              key={tag}
              className={`filter-bar__tag ${isActive ? 'filter-bar__tag--active' : ''}`}
              onClick={() => toggleTag(tag)}
            >
              {isActive && <span className="filter-bar__tag-check">✓</span>}
              {tag}
            </button>
          )
        })}
      </div>

      {activeTags.length > 0 && (
        <button
          className="filter-bar__clear-all"
          onClick={() => onFilterChange({ ...filters, activeTags: [] })}
        >
          Сбросить фильтры
        </button>
      )}
    </div>
  )
}
