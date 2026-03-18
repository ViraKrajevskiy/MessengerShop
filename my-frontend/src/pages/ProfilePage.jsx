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

// ---------- mock user data ----------
const usersDB = {
  0: { name: 'Анна', city: 'Стамбул', country: 'Турция', category: 'Красота', verified: true, bio: 'Салон красоты в центре Стамбула. Более 5 лет опыта. Наращивание ресниц, маникюр, укладка волос.', followers: 1243, following: 87, posts: 12, isVip: true, avatar: PROFILE_AVATARS[0] },
  1: { name: 'Елена', city: 'Анкара', country: 'Турция', category: 'Здоровье', verified: true, bio: 'Врач-косметолог. Консультации онлайн и оффлайн. Работаю с ведущими клиниками Анкары.', followers: 890, following: 134, posts: 8, isVip: false, avatar: PROFILE_AVATARS[1] },
  2: { name: 'Мария', city: 'Стамбул', country: 'Турция', category: 'Недвижимость', verified: true, bio: 'Агент по недвижимости. Помогу найти квартиру мечты в Стамбуле. Покупка, продажа, аренда.', followers: 2100, following: 56, posts: 24, isVip: true, avatar: PROFILE_AVATARS[2] },
  3: { name: 'Ольга', city: 'Анталья', country: 'Турция', category: 'Образование', verified: false, bio: 'Преподаватель турецкого языка. Курсы для начинающих и продвинутых. Индивидуальный подход.', followers: 567, following: 201, posts: 6, isVip: false, avatar: PROFILE_AVATARS[3] },
  4: { name: 'Дарья', city: 'Измир', country: 'Турция', category: 'Юридические услуги', verified: true, bio: 'Юрист. Помощь с ВНЖ, гражданством, открытием бизнеса в Турции. Более 500 успешных кейсов.', followers: 3400, following: 42, posts: 18, isVip: true, avatar: PROFILE_AVATARS[4] },
  5: { name: 'Камила', city: 'Бурса', country: 'Турция', category: 'Дизайн', verified: false, bio: 'Дизайнер интерьеров. Создаю уютные пространства. Работаю по всей Турции.', followers: 780, following: 165, posts: 9, isVip: false, avatar: PROFILE_AVATARS[5] },
  6: { name: 'Нигора', city: 'Бурса', country: 'Турция', category: 'Юридические услуги', verified: true, bio: 'Нотариальные услуги и юридические консультации. Перевод документов.', followers: 450, following: 98, posts: 5, isVip: false, avatar: PROFILE_AVATARS[6] },
  7: { name: 'Фатима', city: 'Стамбул', country: 'Турция', category: 'Туризм', verified: true, bio: 'Гид по Стамбулу. Индивидуальные и групповые экскурсии. Знаю все тайные места города!', followers: 5600, following: 120, posts: 31, isVip: true, avatar: PROFILE_AVATARS[7] },
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
                  <svg className="profile-header__verified" width="20" height="20" viewBox="0 0 24 24" fill="#2196f3">
                    <path d="M12 2L9.19 4.09 5.5 3.82 4.41 7.41 1.42 9.72 2.83 13.21 1.42 16.71 4.41 19 5.5 22.59 9.19 22.32 12 24.41 14.81 22.32 18.5 22.59 19.59 19 22.58 16.71 21.17 13.21 22.58 9.72 19.59 7.41 18.5 3.82 14.81 4.09 12 2ZM10.09 16.72L7.29 13.91 8.71 12.5 10.09 13.88 15.34 8.63 16.76 10.05 10.09 16.72Z"/>
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
              <div className="profile-header__stat">
                <strong>{user.followers.toLocaleString()}</strong>
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
