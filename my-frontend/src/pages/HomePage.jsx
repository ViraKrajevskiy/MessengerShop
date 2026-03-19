import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import FilterBar from '../components/FilterBar'
import Stories from '../components/Stories'
import ViewedBar from '../components/ViewedBar'
import VipSection from '../components/VipSection'
import NewUsers from '../components/NewUsers'
import SocialClub from '../components/SocialClub'
import UserCard from '../components/UserCard'
import Footer from '../components/Footer'
import { apiGetBusinesses, CATEGORY_LABELS } from '../api/businessApi'
import './HomePage.css'

// ---------- adaptive descriptions ----------
const DESCRIPTIONS = {
  default:      { title: 'Бизнес в Турции', text: 'Ваш личный бизнес партнер по компаниям и частному бизнесу в Турции!\nОтсортируйте и выберите вашего будущего бизнес партнера:' },
  'Турция':     { title: 'Бизнес в Турции', text: 'Найдите лучших специалистов и бизнес партнёров по всей Турции.\nОтсортируйте карточки по городу, категории или хештегам.' },
  'Россия':     { title: 'Бизнес в России', text: 'Ваши бизнес партнёры из России. Частные и корпоративные предложения.\nИспользуйте фильтры для поиска нужного специалиста.' },
  'Казахстан':  { title: 'Бизнес в Казахстане', text: 'Партнёры и услуги в Казахстане.\nВыберите город и категорию для поиска.' },
  'Узбекистан': { title: 'Бизнес в Узбекистане', text: 'Бизнес услуги и специалисты из Узбекистана.\nВыберите нужную категорию и начните сотрудничество.' },
  'Стамбул':    { title: 'Бизнес в Стамбуле', text: 'Лучшие специалисты и бизнес партнёры в Стамбуле.\nОт красоты до недвижимости — все категории в одном месте.' },
  'Анкара':     { title: 'Бизнес в Анкаре', text: 'Бизнес партнёры столицы Турции.\nНайдите специалистов в Анкаре по любой категории.' },
  'Анталья':    { title: 'Бизнес в Анталье', text: 'Туризм, недвижимость и другие услуги в Анталье.\nВыберите категорию и начните поиск.' },
  'Красота и уход': { title: 'Красота и уход', text: 'Салоны красоты, стилисты и косметологи.\nНайдите лучших мастеров в вашем городе.' },
  'Здоровье':   { title: 'Здоровье и медицина', text: 'Клиники, врачи и медицинские специалисты.\nЗапишитесь на консультацию онлайн или лично.' },
  'Недвижимость': { title: 'Недвижимость', text: 'Агенты и компании по недвижимости.\nПокупка, продажа и аренда — все предложения здесь.' },
}

function getDescription(filters) {
  const cat = filters.category && CATEGORY_LABELS[filters.category]
  if (cat && DESCRIPTIONS[cat]) return DESCRIPTIONS[cat]
  if (filters.city && DESCRIPTIONS[filters.city]) return DESCRIPTIONS[filters.city]
  if (filters.country && DESCRIPTIONS[filters.country]) return DESCRIPTIONS[filters.country]
  return DESCRIPTIONS.default
}

// Перевод бизнеса из API в формат, понятный UserCard / VipSection
function bizToCard(b) {
  return {
    id: b.id,
    name: b.brand_name,
    city: b.city || '',
    category: b.category_label || CATEGORY_LABELS[b.category] || b.category,
    logo: b.logo,
    is_verified: b.is_verified,
    is_vip: b.is_vip,
    rating: b.rating,
  }
}

// ---------- component ----------
export default function HomePage() {
  const navigate = useNavigate()

  const [filters, setFilters] = useState({
    country: '', city: '', category: '', service: '', activeTags: [],
  })

  const [allBiz, setAllBiz]     = useState([])
  const [vipBiz, setVipBiz]     = useState([])
  const [loadingBiz, setLoadingBiz] = useState(true)

  // Загружаем все бизнесы один раз
  useEffect(() => {
    setLoadingBiz(true)
    apiGetBusinesses()
      .then(data => {
        setAllBiz(data)
        setVipBiz(data.filter(b => b.is_vip))
      })
      .catch(() => {})
      .finally(() => setLoadingBiz(false))
  }, [])

  // Фильтрация по параметрам
  const filteredAll = useMemo(() => {
    return allBiz.filter(b => {
      if (filters.city && b.city && !b.city.toLowerCase().includes(filters.city.toLowerCase())) return false
      if (filters.category && b.category !== filters.category) return false
      return true
    }).map(bizToCard)
  }, [allBiz, filters])

  const filteredVip = useMemo(() => {
    return vipBiz.filter(b => {
      if (filters.city && b.city && !b.city.toLowerCase().includes(filters.city.toLowerCase())) return false
      if (filters.category && b.category !== filters.category) return false
      return true
    }).map(bizToCard)
  }, [vipBiz, filters])

  const desc = getDescription(filters)
  const hasFilters = filters.country || filters.city || filters.category || filters.service || filters.activeTags.length > 0
  const totalResults = filteredAll.length

  return (
    <div className="home-page">
      <Header />

      <div className="home-page__viewed-wrapper">
        <ViewedBar />
      </div>

      <main className="home-page__content">
        {/* Hero */}
        <div className="home-page__hero">
          <h1>{desc.title}</h1>
          <p>
            {desc.text.split('\n').map((line, i) => (
              <span key={i}>{line}{i === 0 && <br />}</span>
            ))}
          </p>
          {hasFilters && (
            <div className="home-page__results-count">
              Найдено результатов: <strong>{totalResults}</strong>
            </div>
          )}
        </div>

        <FilterBar filters={filters} onFilterChange={setFilters} />

        {/* Stories */}
        <Stories />

        {/* VIP — оплаченные карточки */}
        {loadingBiz ? (
          <div className="home-page__loading">
            <span className="home-page__spinner" />
            <span>Загружаем бизнесы...</span>
          </div>
        ) : (
          <VipSection users={filteredVip} />
        )}

        <NewUsers />
        <SocialClub />

        {/* Все карточки */}
        <section className="all-cards-section">
          <h2 className="section-title">Все карточки</h2>
          {loadingBiz ? (
            <div className="home-page__loading">
              <span className="home-page__spinner" />
            </div>
          ) : filteredAll.length > 0 ? (
            <div className="card-grid card-grid--5">
              {filteredAll.map(u => (
                <UserCard key={u.id} id={u.id} name={u.name} city={u.city} logo={u.logo} badge={u.is_vip ? 'VIP' : 'NEW'} type="all" />
              ))}
            </div>
          ) : (
            <div className="no-results">
              {allBiz.length === 0
                ? 'Пока нет зарегистрированных бизнесов'
                : 'Нет карточек по выбранным фильтрам'}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}
