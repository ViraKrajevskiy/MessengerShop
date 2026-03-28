import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Header from '../components/Header'
import Stories from '../components/Stories'
import ViewedBar from '../components/ViewedBar'
import VipSection from '../components/VipSection'
import NewsCard from '../components/NewsCard'
import NewUsers from '../components/NewUsers'
import SocialClub from '../components/SocialClub'
import UserCard from '../components/UserCard'
import Footer from '../components/Footer'
import TweetsSidebar from '../components/TweetsSidebar'
import PostCard from '../components/PostCard'
import { apiGetBusinesses, apiGetNews, apiGetPosts, CATEGORY_LABELS } from '../api/businessApi'
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

function bizToCard(b) {
  return {
    id: b.id,
    name: b.brand_name,
    city: b.city || '',
    category: b.category_label || CATEGORY_LABELS[b.category] || b.category,
    logo: b.logo,
    is_verified: b.is_verified,
    is_vip: b.is_vip,
    is_pro: b.is_pro,
    plan_type: b.plan_type || 'FREE',
    rating: b.rating,
  }
}


const GUEST_LIMIT = 4

export default function HomePage() {
  const navigate = useNavigate()
  const { user, tokens } = useAuth()

  const [filters, setFilters] = useState({
    country: '', city: '', category: '', service: '', activeTags: [],
  })

  const [allBiz, setAllBiz]     = useState([])
  const [vipBiz, setVipBiz]     = useState([])
  const [loadingBiz, setLoadingBiz] = useState(true)
  const [cardsPage, setCardsPage] = useState(0)
  const CARDS_PER_PAGE = 10

  // Состояние для публикаций
  const [posts, setPosts] = useState([])
  const [loadingPosts, setLoadingPosts] = useState(true)

  // Состояние для новостей
  const [news, setNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);

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

  // Загружаем публикации (6 свежих)
  useEffect(() => {
    setLoadingPosts(true)
    apiGetPosts()
      .then(data => setPosts(Array.isArray(data) ? data.slice(0, 6) : []))
      .catch(() => setPosts([]))
      .finally(() => setLoadingPosts(false))
  }, [])

  // Загружаем новости (3 свежих)
  useEffect(() => {
    setLoadingNews(true);
    apiGetNews()
      .then(data => {
        // Предполагаем, что бэк отдает массив, берем первые 3
        setNews(Array.isArray(data) ? data.slice(0, 3) : []);
      })
      .catch(() => setNews([]))
      .finally(() => setLoadingNews(false));
  }, []);

  // Фильтрация по параметрам
  const filteredAll = useMemo(() => {
    setCardsPage(0)
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

      <div className="home-page__layout">
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

        {/* Stories */}
        <Stories />

        {/* VIP — оплаченные карточки */}
        <VipSection users={filteredVip} loading={loadingBiz} />

        {/* ---------- Секция публикаций ---------- */}
        {!loadingPosts && posts.length > 0 && (
          <section className="home-posts-section">
            <div className="section-header">
              <h2 className="section-title">Публикации</h2>
              <button className="see-all-btn" onClick={() => navigate('/feed')}>
                Все публикации
              </button>
            </div>
            <div className="post-cards-grid">
              {(user ? posts : posts.slice(0, GUEST_LIMIT)).map(p => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </section>
        )}

        {/* ---------- Секция новостей ---------- */}
        {!loadingNews && news.length > 0 && (
          <section className="home-news-section">
            <div className="section-header">
              <h2 className="section-title">Последние новости</h2>
              <button className="see-all-btn" onClick={() => navigate('/feed?tab=news')}>
                Смотреть все
              </button>
            </div>
            <div className="news-grid-home">
              {news.map(item => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}

        {/* ---------- Auth gate for guests ---------- */}
        {!user && !loadingBiz && filteredAll.length > GUEST_LIMIT && (
          <div className="home-auth-gate">
            <div className="home-auth-gate__blur" />
            <div className="home-auth-gate__content">
              <p>Зарегистрируйтесь, чтобы увидеть все карточки и публикации</p>
              <div className="home-auth-gate__btns">
                <button className="home-auth-gate__btn home-auth-gate__btn--login" onClick={() => navigate('/login')}>Войти</button>
                <button className="home-auth-gate__btn home-auth-gate__btn--reg" onClick={() => navigate('/register')}>Регистрация</button>
              </div>
            </div>
          </div>
        )}

        <NewUsers />
        <SocialClub />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 className="section-title all-cards-title" style={{ margin: 0 }}>Все карточки</h2>
          <button className="social-club__link" onClick={() => navigate('/feed')}>
            Все публикации &rarr;
          </button>
        </div>

        {/* Все карточки */}
        <section className="all-cards-section">
          <div className="all-cards__carousel">
            {tokens?.access && (
              <button
                className="all-cards__arrow"
                onClick={() => setCardsPage(p => p - 1)}
                disabled={cardsPage === 0}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
            )}
            <div className="all-cards__content">
              {loadingBiz ? (
                <div className="card-grid card-grid--5">
                  {[1,2,3,4,5,6,7,8,9,10].map(i => (
                    <div key={i} className="vip-card vip-card--skeleton">
                      <div className="vip-card__image"><div className="vip-card__skel-img" /></div>
                      <div className="vip-card__info">
                        <div className="vip-card__skel-line" style={{width:'70%'}} />
                        <div className="vip-card__skel-line" style={{width:'40%'}} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredAll.length > 0 ? (
                <div className="card-grid card-grid--5">
                  {(user
                    ? filteredAll.slice(cardsPage * CARDS_PER_PAGE, (cardsPage + 1) * CARDS_PER_PAGE)
                    : filteredAll.slice(0, GUEST_LIMIT)
                  ).map(u => (
                    <UserCard key={u.id} id={u.id} name={u.name} city={u.city} logo={u.logo} planType={u.plan_type} type="all" />
                  ))}
                </div>
              ) : (
                <div className="no-results">
                  Нет карточек по выбранным фильтрам
                </div>
              )}
            </div>
            {tokens?.access && (
              <button
                className="all-cards__arrow"
                onClick={() => setCardsPage(p => p + 1)}
                disabled={(cardsPage + 1) * CARDS_PER_PAGE >= filteredAll.length}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            )}
          </div>
        </section>
      </main>
      <TweetsSidebar />
      </div>
      <Footer />
    </div>
  )
}