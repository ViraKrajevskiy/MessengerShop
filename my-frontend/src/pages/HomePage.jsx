import { useState, useMemo } from 'react'
import Header from '../components/Header'
import FilterBar from '../components/FilterBar'
import Stories from '../components/Stories'
import ViewedBar from '../components/ViewedBar'
import VipSection from '../components/VipSection'
import NewUsers from '../components/NewUsers'
import SocialClub from '../components/SocialClub'
import UserCard from '../components/UserCard'
import Footer from '../components/Footer'
import './HomePage.css'

// ---------- mock data ----------
const vipUsers = [
  { id: 0, name: 'Анна', city: 'Стамбул', country: 'Турция', category: 'Красота', tags: ['С отзывами', 'С видео', 'SKYPE'] },
  { id: 1, name: 'Елена', city: 'Анкара', country: 'Турция', category: 'Здоровье', tags: ['100% проверенные', 'Онлайн'] },
  { id: 2, name: 'Мария', city: 'Анталья', country: 'Турция', category: 'Бизнес', tags: ['С отзывами', 'Обновлённые'] },
  { id: 3, name: 'Ольга', city: 'Стамбул', country: 'Турция', category: 'Недвижимость', tags: ['С видео', 'Частные'] },
  { id: 4, name: 'Дарья', city: 'Измир', country: 'Турция', category: 'Образование', tags: ['Онлайн', 'SKYPE'] },
  { id: 5, name: 'Алина', city: 'Ташкент', country: 'Узбекистан', category: 'Финансы', tags: ['С отзывами', '100% проверенные'] },
  { id: 6, name: 'Камила', city: 'Алматы', country: 'Казахстан', category: 'Красота', tags: ['С видео', 'Обновлённые'] },
  { id: 7, name: 'Нигора', city: 'Бурса', country: 'Турция', category: 'Юридические услуги', tags: ['Частные', '100% проверенные'] },
]

const allCardsData = [
  { id: 0, name: 'Сабина', city: 'Стамбул', country: 'Турция', category: 'Красота', service: 'Консультация', tags: ['С отзывами', 'С видео'] },
  { id: 1, name: 'Лейла', city: 'Анкара', country: 'Турция', category: 'Здоровье', service: 'Онлайн встреча', tags: ['Онлайн', 'SKYPE'] },
  { id: 2, name: 'Айгуль', city: 'Анталья', country: 'Турция', category: 'Бизнес', service: 'Сопровождение', tags: ['100% проверенные'] },
  { id: 3, name: 'Динара', city: 'Измир', country: 'Турция', category: 'Недвижимость', service: 'Персональный подбор', tags: ['С отзывами', 'Обновлённые'] },
  { id: 4, name: 'Зарина', city: 'Стамбул', country: 'Турция', category: 'Образование', service: 'Консультация', tags: ['Онлайн'] },
  { id: 5, name: 'Гулнора', city: 'Ташкент', country: 'Узбекистан', category: 'Финансы', service: 'Аудит', tags: ['С видео', '100% проверенные'] },
  { id: 6, name: 'Малика', city: 'Алматы', country: 'Казахстан', category: 'Красота', service: 'Консультация', tags: ['Частные', 'С отзывами'] },
  { id: 7, name: 'Фатима', city: 'Бурса', country: 'Турция', category: 'Юридические услуги', service: 'Перевод', tags: ['SKYPE', 'Обновлённые'] },
  { id: 8, name: 'Нурия', city: 'Стамбул', country: 'Турция', category: 'Здоровье', service: 'Онлайн встреча', tags: ['С видео', 'Онлайн'] },
  { id: 9, name: 'Амина', city: 'Анкара', country: 'Турция', category: 'Бизнес', service: 'Сопровождение', tags: ['100% проверенные', 'С отзывами'] },
]

// ---------- adaptive descriptions ----------
const DESCRIPTIONS = {
  default: {
    title: 'Бизнес в Турции',
    text: 'Ваш личный бизнес партнер по компаниям и частному бизнесу в Турции!\nОтсортируйте и выберите вашего будущего бизнес партнера:',
  },
  'Турция': {
    title: 'Бизнес в Турции',
    text: 'Найдите лучших специалистов и бизнес партнёров по всей Турции.\nОтсортируйте карточки по городу, категории или хештегам.',
  },
  'Россия': {
    title: 'Бизнес в России',
    text: 'Ваши бизнес партнёры из России. Частные и корпоративные предложения.\nИспользуйте фильтры для поиска нужного специалиста.',
  },
  'Казахстан': {
    title: 'Бизнес в Казахстане',
    text: 'Партнёры и услуги в Казахстане.\nВыберите город и категорию для поиска.',
  },
  'Узбекистан': {
    title: 'Бизнес в Узбекистане',
    text: 'Бизнес услуги и специалисты из Узбекистана.\nВыберите нужную категорию и начните сотрудничество.',
  },
  'Стамбул': {
    title: 'Бизнес в Стамбуле',
    text: 'Лучшие специалисты и бизнес партнёры в Стамбуле.\nОт красоты до недвижимости — все категории в одном месте.',
  },
  'Анкара': {
    title: 'Бизнес в Анкаре',
    text: 'Бизнес партнёры столицы Турции.\nНайдите специалистов в Анкаре по любой категории.',
  },
  'Анталья': {
    title: 'Бизнес в Анталье',
    text: 'Туризм, недвижимость и другие услуги в Анталье.\nВыберите категорию и начните поиск.',
  },
  'Красота': {
    title: 'Красота и уход',
    text: 'Салоны красоты, стилисты и косметологи.\nНайдите лучших мастеров в вашем городе.',
  },
  'Здоровье': {
    title: 'Здоровье и медицина',
    text: 'Клиники, врачи и медицинские специалисты.\nЗапишитесь на консультацию онлайн или лично.',
  },
  'Недвижимость': {
    title: 'Недвижимость',
    text: 'Агенты и компании по недвижимости.\nПокупка, продажа и аренда — все предложения здесь.',
  },
}

function getDescription(filters) {
  if (filters.category && DESCRIPTIONS[filters.category]) return DESCRIPTIONS[filters.category]
  if (filters.city && DESCRIPTIONS[filters.city]) return DESCRIPTIONS[filters.city]
  if (filters.country && DESCRIPTIONS[filters.country]) return DESCRIPTIONS[filters.country]
  return DESCRIPTIONS.default
}

// ---------- filter logic ----------
function filterCards(cards, filters) {
  return cards.filter((card) => {
    if (filters.country && card.country !== filters.country) return false
    if (filters.city && card.city !== filters.city) return false
    if (filters.category && card.category !== filters.category) return false
    if (filters.service && card.service !== filters.service) return false
    if (filters.activeTags && filters.activeTags.length > 0) {
      const hasAll = filters.activeTags.every((tag) => card.tags?.includes(tag))
      if (!hasAll) return false
    }
    return true
  })
}

// ---------- component ----------
export default function HomePage() {
  const [filters, setFilters] = useState({
    country: '',
    city: '',
    category: '',
    service: '',
    activeTags: [],
  })

  const desc = getDescription(filters)
  const filteredVip = useMemo(() => filterCards(vipUsers, filters), [filters])
  const filteredAll = useMemo(() => filterCards(allCardsData, filters), [filters])

  const hasFilters = filters.country || filters.city || filters.category || filters.service || filters.activeTags.length > 0
  const totalResults = filteredVip.length + filteredAll.length

  return (
    <div className="home-page">
      <Header />

      {/* Viewed bar — sticky, appears only after clicking cards */}
      <div className="home-page__viewed-wrapper">
        <ViewedBar />
      </div>

      <main className="home-page__content">
        {/* Adaptive hero */}
        <div className="home-page__hero">
          <h1>{desc.title}</h1>
          <p>
            {desc.text.split('\n').map((line, i) => (
              <span key={i}>
                {line}
                {i === 0 && <br />}
              </span>
            ))}
          </p>
          {hasFilters && (
            <div className="home-page__results-count">
              Найдено результатов: <strong>{totalResults}</strong>
            </div>
          )}
        </div>

        <FilterBar filters={filters} onFilterChange={setFilters} />
        <Stories />

        {/* VIP реклама — оплаченные карточки */}
        <VipSection users={filteredVip} />

        <NewUsers />
        <SocialClub />

        {/* Все карточки */}
        <section className="all-cards-section">
          <h2 className="section-title">Все карточки</h2>
          {filteredAll.length > 0 ? (
            <div className="card-grid card-grid--5">
              {filteredAll.map((u) => (
                <UserCard key={u.id} id={u.id} name={u.name} city={u.city} badge="NEW" type="all" />
              ))}
            </div>
          ) : (
            <div className="no-results">Нет карточек по выбранным фильтрам</div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}
