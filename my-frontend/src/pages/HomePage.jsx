import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Header from '../components/Header'
import Stories from '../components/Stories'
import NewUsers from '../components/NewUsers'
import UserCard from '../components/UserCard'
import Footer from '../components/Footer'
import TweetsSidebar from '../components/TweetsSidebar'
import PostCard from '../components/PostCard'
import HeroSlider from '../components/HeroSlider'
import PremiumCarousel from '../components/PremiumCarousel'
import { apiGetBusinesses, apiGetPosts, CATEGORY_LABELS } from '../api/businessApi'
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
const GUEST_CARDS_LIMIT = 8
const CARDS_PER_PAGE = 8
/** Сколько постов показываем на главной в блоке «Публикации» */
const HOME_POSTS_VISIBLE = 3

export default function HomePage() {
  const navigate = useNavigate()
  const { user, tokens } = useAuth()

  const [filters] = useState({
    country: '', city: '', category: '', service: '', activeTags: [],
  })

  const [allBiz, setAllBiz] = useState([])
  const [loadingBiz, setLoadingBiz] = useState(true)
  const [cardsPage, setCardsPage] = useState(0)

  const [posts, setPosts] = useState([])
  const [loadingPosts, setLoadingPosts] = useState(true)

  useEffect(() => {
    setLoadingBiz(true)
    apiGetBusinesses()
      .then(data => setAllBiz(data))
      .catch(() => {})
      .finally(() => setLoadingBiz(false))
  }, [])

  useEffect(() => {
    setLoadingPosts(true)
    apiGetPosts()
      .then(data => setPosts(Array.isArray(data) ? data.slice(0, Math.max(HOME_POSTS_VISIBLE, 6)) : []))
      .catch(() => setPosts([]))
      .finally(() => setLoadingPosts(false))
  }, [])

  const filteredAll = useMemo(() => {
    setCardsPage(0)
    return allBiz.filter(b =>
      (!filters.city || !b.city || b.city.toLowerCase().includes(filters.city.toLowerCase())) &&
      (!filters.category || b.category === filters.category)
    ).map(bizToCard)
  }, [allBiz, filters])

  // Premium (VIP/PRO) businesses for carousel
  const premiumBiz = useMemo(() =>
    allBiz.filter(b => b.plan_type === 'VIP' || b.plan_type === 'PRO' || b.is_vip || b.is_pro),
    [allBiz]
  )

  // Combine post images + business logos for slider
  const sliderImages = useMemo(() => {
    const postImgs = posts
      .filter(p => p.media_display)
      .map(p => ({
        src: p.media_display.startsWith('http') ? p.media_display : `https://api.101-school.uz${p.media_display}`,
        alt: p.text || '',
      }))
    const bizImgs = allBiz
      .filter(b => b.logo)
      .map(b => ({
        src: b.logo.startsWith('http') ? b.logo : `https://api.101-school.uz${b.logo}`,
        alt: b.brand_name,
      }))
    return [...postImgs, ...bizImgs].slice(0, 50)
  }, [posts, allBiz])

  const desc = getDescription(filters)

  const homePosts = useMemo(
    () => posts.slice(0, HOME_POSTS_VISIBLE),
    [posts]
  )

  return (
    <div className="home-page">
      <Header />

      {/* Hero + слайдер — полная ширина, вне двухколоночного layout */}
      <div className="home-page__hero-full">
        <div className="home-page__hero">
          <h1>{desc.title}</h1>
          <p>
            {desc.text.split('\n').map((line, i) => (
              <span key={i}>{line}{i === 0 && <br />}</span>
            ))}
          </p>
        </div>

        {premiumBiz.length >= 4
          ? <PremiumCarousel businesses={premiumBiz} />
          : <HeroSlider images={sliderImages} />
        }
      </div>

      <div className="home-page__layout">
        <main className="home-page__content">

          {/* Новые бизнесы */}
          <NewUsers />

          {/* Публикации */}
          <section className="home-posts-section">
            <div className="section-header">
              <h2 className="section-title">Публикации</h2>
              <button className="see-all-btn" onClick={() => navigate('/feed')}>
                Все публикации
              </button>
            </div>

            {/* Stories as author bar */}
            <Stories noTitle />

            {/* Post cards */}
            {loadingPosts ? (
              <div className="home-posts-grid">
                {[1, 2, 3].map(i => (
                  <div key={i} className="post-card-skeleton">
                    <div className="post-card-skeleton__header">
                      <div className="skel-circle" />
                      <div className="skel-lines">
                        <div className="skel-line" />
                        <div className="skel-line skel-line--short" />
                      </div>
                    </div>
                    <div className="skel-img skel-img--portrait" />
                    <div className="skel-body">
                      <div className="skel-line" />
                      <div className="skel-line skel-line--short" />
                    </div>
                  </div>
                ))}
              </div>
            ) : homePosts.length > 0 ? (
              <div className="home-posts-grid">
                {homePosts.map(p => (
                  <PostCard key={p.id} post={p} />
                ))}
              </div>
            ) : null}
          </section>

          {/* Все карточки */}
          <section className="all-cards-section">
            <div className="section-header">
              <h2 className="section-title">Все карточки</h2>
              <button className="see-all-btn" onClick={() => navigate('/feed')}>
                Все публикации
              </button>
            </div>
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
                  <div className="card-grid card-grid--4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                      <div key={i} className="vip-card vip-card--skeleton">
                        <div className="vip-card__image"><div className="vip-card__skel-img" /></div>
                        <div className="vip-card__info">
                          <div className="vip-card__skel-line" style={{ width: '70%' }} />
                          <div className="vip-card__skel-line" style={{ width: '40%' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredAll.length > 0 ? (
                  <div className="card-grid card-grid--4">
                    {(user
                      ? filteredAll.slice(cardsPage * CARDS_PER_PAGE, (cardsPage + 1) * CARDS_PER_PAGE)
                      : filteredAll.slice(0, GUEST_CARDS_LIMIT)
                    ).map(u => (
                      <UserCard key={u.id} id={u.id} name={u.name} city={u.city} logo={u.logo} planType={u.plan_type} type="all" />
                    ))}
                  </div>
                ) : (
                  <div className="no-results">Нет карточек по выбранным фильтрам</div>
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

          {/* Auth gate for guests — shown below all cards */}

        </main>
        <TweetsSidebar />
      </div>

      <Footer />
    </div>
  )
}
