import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import './ProfilePage.css'

// ---------- avatar & post photos ----------
const PROFILE_AVATARS = [
  'https://i.pravatar.cc/300?img=1',
  'https://i.pravatar.cc/300?img=5',
  'https://i.pravatar.cc/300?img=9',
  'https://i.pravatar.cc/300?img=16',
  'https://i.pravatar.cc/300?img=20',
  'https://i.pravatar.cc/300?img=23',
  'https://i.pravatar.cc/300?img=25',
  'https://i.pravatar.cc/300?img=32',
]

const POST_IMAGES = [
  'https://picsum.photos/id/342/800/450',
  'https://picsum.photos/id/399/800/450',
  'https://picsum.photos/id/164/800/450',
  'https://picsum.photos/id/274/800/450',
  'https://picsum.photos/id/225/800/450',
  'https://picsum.photos/id/349/800/450',
  'https://picsum.photos/id/312/800/450',
  'https://picsum.photos/id/366/800/450',
  'https://picsum.photos/id/429/800/450',
  'https://picsum.photos/id/188/800/450',
  'https://picsum.photos/id/96/800/450',
]

const STORY_IMAGES = [
  'https://picsum.photos/id/64/400/700',
  'https://picsum.photos/id/96/400/700',
  'https://picsum.photos/id/180/400/700',
  'https://picsum.photos/id/274/400/700',
  'https://picsum.photos/id/312/400/700',
  'https://picsum.photos/id/20/400/700',
  'https://picsum.photos/id/42/400/700',
  'https://picsum.photos/id/318/400/700',
  'https://picsum.photos/id/429/400/700',
  'https://picsum.photos/id/399/400/700',
]

// ---------- helpers ----------
const FOLLOWERS_THRESHOLD = 100

function formatFollowers(n) {
  if (n < FOLLOWERS_THRESHOLD) return '< 100'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toLocaleString('ru-RU')
}

// ---------- mock user data ----------
const usersDB = {
  0: { name: 'Анна', city: 'Стамбул', country: 'Турция', category: 'Красота', verified: true, bio: 'Салон красоты в центре Стамбула. Более 5 лет опыта. Наращивание ресниц, маникюр, укладка волос. Работаем с ведущими брендами профессиональной косметики. Приглашаем на бесплатную консультацию!', followers: 1243, following: 87, posts: 12, isVip: true, avatar: PROFILE_AVATARS[0], phone: '+90 532 111 22 33', website: 'beautystanbul.com', address: 'Taksim Meydanı 5, Beyoğlu, İstanbul', whatsapp: '+905321112233', telegram: 'beautystanbul' },
  1: { name: 'Елена', city: 'Анкара', country: 'Турция', category: 'Здоровье', verified: true, bio: 'Врач-косметолог с 10-летним стажем. Консультации онлайн и оффлайн. Работаю с ведущими клиниками Анкары. Специализация: омоложение, коррекция фигуры, лечебная косметология.', followers: 890, following: 134, posts: 8, isVip: false, avatar: PROFILE_AVATARS[1], phone: '+90 533 222 33 44', address: 'Kızılay, Çankaya, Ankara', telegram: 'dr_elena_ankara' },
  2: { name: 'Мария', city: 'Стамбул', country: 'Турция', category: 'Недвижимость', verified: true, bio: 'Лицензированный агент по недвижимости. Помогу найти квартиру мечты в Стамбуле. Покупка, продажа, аренда. Сопровождение сделки под ключ, помощь с ипотекой и оформлением документов.', followers: 2100, following: 56, posts: 24, isVip: true, avatar: PROFILE_AVATARS[2], phone: '+90 535 333 44 55', website: 'mariarealty.com.tr', address: 'Bağcılar, İstanbul', whatsapp: '+905353334455', telegram: 'maria_realty' },
  3: { name: 'Ольга', city: 'Анталья', country: 'Турция', category: 'Образование', verified: false, bio: 'Преподаватель турецкого языка. Курсы для начинающих и продвинутых. Индивидуальный подход к каждому ученику. Онлайн и оффлайн занятия.', followers: 567, following: 201, posts: 6, isVip: false, avatar: PROFILE_AVATARS[3], telegram: 'olga_turkish' },
  4: { name: 'Дарья', city: 'Измир', country: 'Турция', category: 'Юридические услуги', verified: true, bio: 'Юрист с российским и турецким образованием. Помощь с ВНЖ, гражданством, открытием бизнеса в Турции. Более 500 успешных кейсов. Консультация бесплатно при первом обращении.', followers: 3400, following: 42, posts: 18, isVip: true, avatar: PROFILE_AVATARS[4], phone: '+90 536 444 55 66', website: 'daria-law.com', address: 'Alsancak, Konak, İzmir', whatsapp: '+905364445566', telegram: 'daria_law_turkey' },
  5: { name: 'Камила', city: 'Бурса', country: 'Турция', category: 'Дизайн', verified: false, bio: 'Дизайнер интерьеров. Создаю уютные пространства. Работаю по всей Турции. Разработка дизайн-проектов, авторский надзор, подбор мебели и декора.', followers: 780, following: 165, posts: 9, isVip: false, avatar: PROFILE_AVATARS[5], telegram: 'kamila_design' },
  6: { name: 'Нигора', city: 'Бурса', country: 'Турция', category: 'Юридические услуги', verified: true, bio: 'Нотариальные услуги и юридические консультации. Перевод документов с/на русский, турецкий, узбекский языки. Апостиль, легализация документов.', followers: 450, following: 98, posts: 5, isVip: false, avatar: PROFILE_AVATARS[6], phone: '+90 537 555 66 77', address: 'Osmangazi, Bursa', whatsapp: '+905375556677', telegram: 'nigora_notary' },
  7: { name: 'Фатима', city: 'Стамбул', country: 'Турция', category: 'Туризм', verified: true, bio: 'Сертифицированный гид по Стамбулу с лицензией Министерства культуры Турции. Индивидуальные и групповые экскурсии. Знаю все тайные места города! Экскурсии на русском языке.', followers: 5600, following: 120, posts: 31, isVip: true, avatar: PROFILE_AVATARS[7], phone: '+90 538 666 77 88', website: 'istanbul-guide.ru', whatsapp: '+905386667788', telegram: 'fatima_istanbul_guide' },
}

// ---------- mock stories for profile ----------
const userStories = {
  0: [
    { id: 's0', img: STORY_IMAGES[0], caption: 'Новая коллекция в нашем салоне!', type: 'image', time: '2 ч. назад' },
    { id: 's1', img: STORY_IMAGES[1], caption: 'Скидки до 50% сегодня', type: 'image', time: '3 ч. назад' },
    { id: 's2', img: STORY_IMAGES[2], caption: 'Видео-обзор новинок', type: 'video', time: '5 ч. назад' },
  ],
  2: [
    { id: 's3', img: STORY_IMAGES[3], caption: 'Обзор квартиры в центре', type: 'video', time: '1 ч. назад' },
    { id: 's4', img: STORY_IMAGES[4], caption: 'Вид с балкона', type: 'image', time: '4 ч. назад' },
  ],
  4: [
    { id: 's5', img: STORY_IMAGES[5], caption: 'Курсы турецкого языка', type: 'image', time: '6 ч. назад' },
    { id: 's6', img: STORY_IMAGES[6], caption: 'Урок #1 — приветствия', type: 'video', time: '1 дн. назад' },
  ],
  7: [
    { id: 's7', img: STORY_IMAGES[7], caption: 'Тур по Стамбулу', type: 'video', time: '30 мин. назад' },
    { id: 's8', img: STORY_IMAGES[8], caption: 'Голубая мечеть', type: 'image', time: '2 ч. назад' },
    { id: 's9', img: STORY_IMAGES[9], caption: 'Гранд Базар', type: 'image', time: '5 ч. назад' },
  ],
}

// ---------- mock posts for profile ----------
const userPosts = {
  0: [
    { id: 'p0', img: POST_IMAGES[0], type: 'image', text: 'Сегодня выходной день. Праздник для нашего народа. Хочу показать вам наш новый салон красоты в центре Стамбула.', time: '15 мин. назад', likes: 42, comments: 8 },
    { id: 'p1', img: POST_IMAGES[1], type: 'image', text: 'Новая процедура в нашем салоне — ламинирование бровей! Записывайтесь через профиль.', time: '2 ч. назад', likes: 28, comments: 5 },
    { id: 'p2', img: POST_IMAGES[2], type: 'video', text: 'Видео-обзор нашего салона. Приходите к нам за красотой!', time: '1 дн. назад', likes: 95, comments: 12 },
  ],
  1: [
    { id: 'p3', img: POST_IMAGES[3], type: 'image', text: 'Новая коллекция одежды. Все модели доступны для заказа. Доставка по всей Турции бесплатная.', time: '35 мин. назад', likes: 67, comments: 14 },
  ],
  2: [
    { id: 'p4', img: POST_IMAGES[4], type: 'video', text: 'Обзор квартиры в центре Стамбула. 2+1, 95 кв.м., 5 этаж, вид на Босфор.', time: '2 ч. назад', likes: 156, comments: 23 },
    { id: 'p5', img: POST_IMAGES[5], type: 'image', text: 'Новый жилой комплекс в районе Бейликдюзю. Цены от 120 000$.', time: '1 дн. назад', likes: 89, comments: 17 },
  ],
  4: [
    { id: 'p6', img: POST_IMAGES[6], type: 'video', text: 'Юридическая консультация по вопросам ВНЖ и гражданства Турции.', time: '8 ч. назад', likes: 203, comments: 45 },
    { id: 'p7', img: POST_IMAGES[7], type: 'image', text: 'Успешное получение гражданства для клиента из России. Поздравляем!', time: '2 дн. назад', likes: 312, comments: 67 },
  ],
  7: [
    { id: 'p8', img: POST_IMAGES[8], type: 'video', text: 'Тур по старому городу. Голубая мечеть, Айя-София, Гранд Базар.', time: '3 ч. назад', likes: 445, comments: 52 },
    { id: 'p9', img: POST_IMAGES[9], type: 'image', text: 'Закат на Босфоре. Одно из самых красивых мест в мире.', time: '1 дн. назад', likes: 678, comments: 89 },
    { id: 'p10', img: POST_IMAGES[10], type: 'image', text: 'Уличная еда Стамбула. Балык-экмек — рыбный сэндвич у Галатского моста.', time: '3 дн. назад', likes: 234, comments: 31 },
  ],
}

// ---------- Contact Tile ----------
function ContactTile({ icon, label, value, color, onClick }) {
  return (
    <button className="profile-about__tile" onClick={onClick}>
      <span className={`profile-about__tile-icon profile-about__tile-icon--${color}`}>
        {icon}
      </span>
      <span className="profile-about__tile-body">
        <span className="profile-about__tile-label">{label}</span>
        <span className="profile-about__tile-value">{value}</span>
      </span>
      <svg className="profile-about__tile-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    </button>
  )
}

// ---------- Story Viewer for Profile ----------
function ProfileStoryViewer({ stories, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef(null)
  const story = stories[idx]
  const DURATION = story.type === 'video' ? 8000 : 5000

  useEffect(() => {
    setProgress(0)
    const startTime = Date.now()
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const pct = Math.min((elapsed / DURATION) * 100, 100)
      setProgress(pct)
      if (elapsed >= DURATION) {
        if (idx < stories.length - 1) setIdx(i => i + 1)
        else onClose()
      }
    }, 50)
    return () => clearInterval(timerRef.current)
  }, [idx])

  const goNext = useCallback(() => {
    clearInterval(timerRef.current)
    if (idx < stories.length - 1) setIdx(i => i + 1)
    else onClose()
  }, [idx, stories.length, onClose])

  const goPrev = useCallback(() => {
    clearInterval(timerRef.current)
    if (idx > 0) setIdx(i => i - 1)
  }, [idx])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext() }
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goNext, goPrev, onClose])

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    if (x < rect.width / 3) goPrev()
    else goNext()
  }

  return (
    <div className="profile-story-viewer" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="profile-story-viewer__container">
        <div className="profile-story-viewer__progress">
          {stories.map((_, i) => (
            <div key={i} className="profile-story-viewer__bar">
              <div
                className="profile-story-viewer__fill"
                style={{ width: i < idx ? '100%' : i === idx ? `${progress}%` : '0%' }}
              />
            </div>
          ))}
        </div>
        <button className="profile-story-viewer__close" onClick={onClose}>&#10005;</button>
        <div className="profile-story-viewer__media" onClick={handleClick}>
          <img className="profile-story-viewer__img" src={story.img} alt={story.caption} />
          {story.type === 'video' && <div className="profile-story-viewer__play">▶</div>}
        </div>
        <div className="profile-story-viewer__caption">
          {story.type === 'video' && <span className="profile-story-viewer__type">&#128249; Видео</span>}
          <p>{story.caption}</p>
          <span className="profile-story-viewer__time">{story.time}</span>
        </div>
      </div>
    </div>
  )
}

// ---------- Profile Page ----------
export default function ProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const userId = parseInt(id, 10)
  const user = usersDB[userId]

  const [activeTab, setActiveTab] = useState('posts')
  const [subscribed, setSubscribed] = useState(false)
  const [storyViewerOpen, setStoryViewerOpen] = useState(false)
  const [storyStart, setStoryStart] = useState(0)
  const [copiedPhone, setCopiedPhone] = useState(false)

  const handleCopyPhone = (phone) => {
    navigator.clipboard.writeText(phone).then(() => {
      setCopiedPhone(true)
      setTimeout(() => setCopiedPhone(false), 2000)
    })
  }

  const stories = userStories[userId] || []
  const posts = userPosts[userId] || []

  if (!user) {
    return (
      <div className="profile-page">
        <Header />
        <main className="profile-page__content">
          <div className="profile-page__not-found">
            <span className="profile-page__not-found-icon">&#128533;</span>
            <h2>Пользователь не найден</h2>
            <p>Такого профиля не существует или он был удалён.</p>
            <button className="profile-page__back-btn" onClick={() => navigate('/')}>
              &#8592; На главную
            </button>
          </div>
        </main>
      </div>
    )
  }

  const openStory = (index) => {
    setStoryStart(index)
    setStoryViewerOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const closeStoryViewer = () => {
    setStoryViewerOpen(false)
    document.body.style.overflow = ''
  }

  return (
    <div className="profile-page">
      <Header />
      <main className="profile-page__content">
        {/* Back button */}
        <button className="profile-page__back" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Назад
        </button>

        {/* ===== Profile Header ===== */}
        <div className="profile-header">
          <div className="profile-header__avatar-wrapper">
            <div className={`profile-header__avatar ${stories.length > 0 ? 'profile-header__avatar--has-stories' : ''}`} onClick={() => stories.length > 0 && openStory(0)}>
              <img className="profile-header__avatar-img" src={user.avatar} alt={user.name} />
            </div>
            {user.isVip && <span className="profile-header__vip-badge">VIP</span>}
          </div>

          <div className="profile-header__info">
            <div className="profile-header__name-row">
              <h1 className="profile-header__name">
                {user.name}
                {user.verified && (
                  <svg className="profile-header__verified" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-label="Верифицирован">
                    <title>Верифицирован</title>
                    <circle cx="12" cy="12" r="11" fill="#2196f3"/>
                    <path d="M7 12.5l3.5 3.5 6.5-7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </h1>
              <span className="profile-header__category">{user.category}</span>
            </div>

            <div className="profile-header__location">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {user.city}, {user.country}
            </div>

            <p className="profile-header__bio">{user.bio}</p>

            <div className="profile-header__stats">
              <div className="profile-header__stat">
                <strong>{user.posts}</strong>
                <span>публикаций</span>
              </div>
              <div
                className="profile-header__stat"
                title={user.followers < FOLLOWERS_THRESHOLD ? 'Счётчик отображается после 100 подписчиков' : undefined}
              >
                <strong className={user.followers < FOLLOWERS_THRESHOLD ? 'profile-header__stat-masked' : ''}>
                  {formatFollowers(user.followers)}
                </strong>
                <span>подписчиков</span>
              </div>
              <div className="profile-header__stat">
                <strong>{user.following}</strong>
                <span>подписок</span>
              </div>
            </div>

            <div className="profile-header__actions">
              <button
                className={`profile-header__subscribe ${subscribed ? 'profile-header__subscribe--active' : ''}`}
                onClick={() => setSubscribed(!subscribed)}
              >
                {subscribed ? '✓ Подписан' : 'Подписаться'}
              </button>
              <button className="profile-header__message" onClick={() => navigate('/messenger')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
                Написать
              </button>
            </div>
          </div>
        </div>

        {/* ===== Stories section ===== */}
        {stories.length > 0 && (
          <section className="profile-stories">
            <h3 className="profile-stories__title">Истории</h3>
            <div className="profile-stories__list">
              {stories.map((s, i) => (
                <div key={s.id} className="profile-stories__item" onClick={() => openStory(i)}>
                  <div className="profile-stories__thumb">
                    <img className="profile-stories__thumb-img" src={s.img} alt={s.caption} loading="lazy" />
                    {s.type === 'video' && <span className="profile-stories__play">▶</span>}
                  </div>
                  <span className="profile-stories__time">{s.time}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===== Tabs ===== */}
        <div className="profile-tabs">
          <button
            className={`profile-tabs__btn ${activeTab === 'posts' ? 'profile-tabs__btn--active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
            Публикации
          </button>
          <button
            className={`profile-tabs__btn ${activeTab === 'grid' ? 'profile-tabs__btn--active' : ''}`}
            onClick={() => setActiveTab('grid')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
            </svg>
            Сетка
          </button>
          <button
            className={`profile-tabs__btn ${activeTab === 'about' ? 'profile-tabs__btn--active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            О нас
          </button>
        </div>

        {/* ===== Posts Feed ===== */}
        {activeTab === 'posts' && (
          <div className="profile-posts">
            {posts.length > 0 ? posts.map((post) => (
              <article key={post.id} className="profile-post">
                <div className="profile-post__media">
                  <img className="profile-post__img" src={post.img} alt="" loading="lazy" />
                  {post.type === 'video' && <div className="profile-post__play">▶</div>}
                </div>
                <div className="profile-post__body">
                  <p className="profile-post__text">{post.text}</p>
                  <div className="profile-post__footer">
                    <div className="profile-post__reactions">
                      <button className="profile-post__reaction">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                        </svg>
                        {post.likes}
                      </button>
                      <button className="profile-post__reaction">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                        </svg>
                        {post.comments}
                      </button>
                    </div>
                    <span className="profile-post__time">{post.time}</span>
                  </div>
                </div>
              </article>
            )) : (
              <div className="profile-posts__empty">
                <span>&#128247;</span>
                <p>Пока нет публикаций</p>
              </div>
            )}
          </div>
        )}

        {/* ===== Grid View ===== */}
        {activeTab === 'grid' && (
          <div className="profile-grid">
            {posts.length > 0 ? posts.map((post) => (
              <div key={post.id} className="profile-grid__item">
                <img className="profile-grid__img" src={post.img} alt="" loading="lazy" />
                {post.type === 'video' && <span className="profile-grid__play">▶</span>}
                <div className="profile-grid__overlay">
                  <span>&#10084; {post.likes}</span>
                  <span>&#128172; {post.comments}</span>
                </div>
              </div>
            )) : (
              <div className="profile-posts__empty">
                <span>&#128247;</span>
                <p>Пока нет публикаций</p>
              </div>
            )}
          </div>
        )}

        {/* ===== About Section ===== */}
        {activeTab === 'about' && (
          <div className="profile-about">
            {/* Bio */}
            <div className="profile-about__bio">
              <h3 className="profile-about__section-title">О нас</h3>
              <p className="profile-about__bio-text">{user.bio}</p>
            </div>

            {/* Contacts */}
            {(user.phone || user.website || user.address || user.whatsapp || user.telegram) && (
              <>
                <div className="profile-about__divider" />
                <div className="profile-about__contacts">
                  <h3 className="profile-about__section-title">Контакты</h3>
                  <div className="profile-about__tiles">
                    {user.phone && (
                      <ContactTile
                        color="phone"
                        label={copiedPhone ? 'Скопировано!' : 'Телефон'}
                        value={user.phone}
                        onClick={() => handleCopyPhone(user.phone)}
                        icon={
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.67A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z"/>
                          </svg>
                        }
                      />
                    )}
                    {user.website && (
                      <ContactTile
                        color="web"
                        label="Сайт"
                        value={user.website}
                        onClick={() => window.open(`https://${user.website}`, '_blank', 'noopener,noreferrer')}
                        icon={
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                            <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
                          </svg>
                        }
                      />
                    )}
                    {user.address && (
                      <ContactTile
                        color="map"
                        label="Адрес"
                        value={user.address}
                        onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(user.address)}`, '_blank', 'noopener,noreferrer')}
                        icon={
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                          </svg>
                        }
                      />
                    )}
                    {user.whatsapp && (
                      <ContactTile
                        color="wa"
                        label="WhatsApp"
                        value={user.whatsapp}
                        onClick={() => window.open(`https://wa.me/${user.whatsapp.replace(/\D/g, '')}`, '_blank', 'noopener,noreferrer')}
                        icon={
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                        }
                      />
                    )}
                    {user.telegram && (
                      <ContactTile
                        color="tg"
                        label="Telegram"
                        value={`@${user.telegram}`}
                        onClick={() => window.open(`https://t.me/${user.telegram}`, '_blank', 'noopener,noreferrer')}
                        icon={
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                          </svg>
                        }
                      />
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Verified Business Badge */}
            {user.verified && (
              <>
                <div className="profile-about__divider" />
                <div className="profile-about__verified-badge">
                  <svg className="profile-about__badge-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" fill="rgba(33,150,243,0.15)" stroke="#2196f3" strokeWidth="1.5"/>
                    <path d="M9 12l2 2 4-4" stroke="#2196f3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div className="profile-about__badge-text">
                    <strong>Верифицированный бизнес</strong>
                    <span>Личность и деятельность подтверждены платформой</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Story Viewer */}
      {storyViewerOpen && stories.length > 0 && (
        <ProfileStoryViewer
          stories={stories}
          startIndex={storyStart}
          onClose={closeStoryViewer}
        />
      )}
    </div>
  )
}
