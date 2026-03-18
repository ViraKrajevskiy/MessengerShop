import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useViewed } from '../context/ViewedContext'
import './SocialClub.css'

const SC_AVATARS = [
  'https://i.pravatar.cc/100?img=1',
  'https://i.pravatar.cc/100?img=5',
  'https://i.pravatar.cc/100?img=9',
  'https://i.pravatar.cc/100?img=16',
  'https://i.pravatar.cc/100?img=20',
  'https://i.pravatar.cc/100?img=23',
]

const SC_PHOTOS = [
  'https://picsum.photos/id/342/600/450',
  'https://picsum.photos/id/399/600/450',
  'https://picsum.photos/id/164/600/450',
  'https://picsum.photos/id/274/600/450',
  'https://picsum.photos/id/225/600/450',
  'https://picsum.photos/id/349/600/450',
]

// ---------- mock posts ----------
const postsData = [
  {
    id: 0,
    authorId: 10,
    author: 'Анна',
    city: 'Стамбул',
    verified: true,
    publishedAt: Date.now() - 15 * 60000,
    mediaType: 'image',
    avatar: SC_AVATARS[0],
    mediaImg: SC_PHOTOS[0],
    text: 'Сегодня выходной день. Праздник для нашего народа. Хочу показать вам наш новый салон красоты в центре Стамбула. Мы открылись совсем недавно, но уже успели полюбиться многим клиентам. Приходите к нам за новыми впечатлениями и красотой!',
  },
  {
    id: 1,
    authorId: 11,
    author: 'Елена',
    city: 'Анкара',
    verified: true,
    publishedAt: Date.now() - 35 * 60000,
    mediaType: 'image',
    avatar: SC_AVATARS[1],
    mediaImg: SC_PHOTOS[1],
    text: 'Сегодня замечательный день. Праздник для нашего города. Хочу показать вам нашу новую коллекцию одежды. Все модели доступны для заказа. Доставка по всей Турции бесплатная. Пишите в директ для заказа!',
  },
  {
    id: 2,
    authorId: 12,
    author: 'Мария',
    city: 'Стамбул',
    verified: false,
    publishedAt: Date.now() - 2 * 3600000,
    mediaType: 'video',
    avatar: SC_AVATARS[2],
    mediaImg: SC_PHOTOS[2],
    text: 'Обзор квартиры в центре Стамбула. 2+1, 95 квадратных метров, 5 этаж, вид на Босфор. Цена 250 000$. Документы готовы, можно получить гражданство. Подробности в профиле или пишите в личные сообщения.',
  },
  {
    id: 3,
    authorId: 13,
    author: 'Ольга',
    city: 'Анталья',
    verified: true,
    publishedAt: Date.now() - 5 * 3600000,
    mediaType: 'image',
    avatar: SC_AVATARS[3],
    mediaImg: SC_PHOTOS[3],
    text: 'Новый курс турецкого языка начинается на следующей неделе! Группы утренние и вечерние. Уровни от A1 до B2. Первый урок бесплатно. Преподаватель — носитель языка с 10-летним опытом.',
  },
  {
    id: 4,
    authorId: 14,
    author: 'Дарья',
    city: 'Измир',
    verified: true,
    publishedAt: Date.now() - 8 * 3600000,
    mediaType: 'video',
    avatar: SC_AVATARS[4],
    mediaImg: SC_PHOTOS[4],
    text: 'Юридическая консультация по вопросам ВНЖ и гражданства Турции. Более 500 успешных кейсов. Работаем с 2018 года. Бесплатная первичная консультация. Запись через профиль или по телефону.',
  },
  {
    id: 5,
    authorId: 15,
    author: 'Камила',
    city: 'Бурса',
    verified: false,
    publishedAt: Date.now() - 12 * 3600000,
    mediaType: 'image',
    avatar: SC_AVATARS[5],
    mediaImg: SC_PHOTOS[5],
    text: 'Свежие фрукты и овощи с фермы. Доставка каждый день. Помидоры, огурцы, клубника, черешня — всё свежее и натуральное. Заказы принимаем до 20:00, доставка на следующий день.',
  },
]

function timeAgo(timestamp) {
  const diff = Date.now() - timestamp
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'только что'
  if (mins < 60) return `${mins} мин. назад`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ч. назад`
  const days = Math.floor(hours / 24)
  return `${days} дн. назад`
}

// ---------- Single post card ----------
function PostCard({ post, onAvatarClick, onMediaClick }) {
  const [expanded, setExpanded] = useState(false)
  const [subscribed, setSubscribed] = useState(false)

  const SHORT_LEN = 90
  const isLong = post.text.length > SHORT_LEN
  const displayText = expanded || !isLong ? post.text : post.text.slice(0, SHORT_LEN) + '...'

  return (
    <div className="sc-card">
      {/* Header: avatar + name + verified + time + subscribe */}
      <div className="sc-card__header">
        <img
          className="sc-card__avatar"
          src={post.avatar}
          alt={post.author}
          onClick={(e) => { e.stopPropagation(); onAvatarClick(post) }}
          title="Открыть профиль"
        />
        <div className="sc-card__meta">
          <span className="sc-card__author">
            {post.author}
            {post.verified && (
              <span className="sc-card__verified" title="Верифицированный">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#2196f3">
                  <path d="M12 2L9.19 4.09 5.5 3.82 4.41 7.41 1.42 9.72 2.83 13.21 1.42 16.71 4.41 19 5.5 22.59 9.19 22.32 12 24.41 14.81 22.32 18.5 22.59 19.59 19 22.58 16.71 21.17 13.21 22.58 9.72 19.59 7.41 18.5 3.82 14.81 4.09 12 2ZM10.09 16.72L7.29 13.91 8.71 12.5 10.09 13.88 15.34 8.63 16.76 10.05 10.09 16.72Z"/>
                </svg>
              </span>
            )}
          </span>
          <span className="sc-card__time">{timeAgo(post.publishedAt)}</span>
        </div>
        <button
          className={`sc-card__subscribe ${subscribed ? 'sc-card__subscribe--active' : ''}`}
          onClick={() => setSubscribed(!subscribed)}
        >
          {subscribed ? 'Подписан' : 'Подписаться'}
        </button>
      </div>

      {/* Media: image or video */}
      <div
        className="sc-card__media"
        onClick={() => onMediaClick(post)}
        title="Открыть публикацию"
      >
        <img className="sc-card__media-img" src={post.mediaImg} alt={post.text.slice(0, 30)} loading="lazy" />
        {post.mediaType === 'video' && (
          <div className="sc-card__play">▶</div>
        )}
      </div>

      {/* Text with "read more" */}
      <div className="sc-card__body">
        <p className="sc-card__text">{displayText}</p>
        {isLong && !expanded && (
          <button
            className="sc-card__read-more"
            onClick={() => setExpanded(true)}
          >
            Читать далее
          </button>
        )}
        {isLong && expanded && (
          <button
            className="sc-card__read-more"
            onClick={() => setExpanded(false)}
          >
            Свернуть
          </button>
        )}
      </div>
    </div>
  )
}

// ---------- SocialClub carousel ----------
export default function SocialClub() {
  const [offset, setOffset] = useState(0)
  const { addViewed } = useViewed()
  const navigate = useNavigate()
  const touchStartX = useRef(0)
  const visible = 3

  const maxOffset = Math.max(0, postsData.length - visible)
  const prev = () => setOffset((o) => Math.max(0, o - 1))
  const next = () => setOffset((o) => Math.min(maxOffset, o + 1))

  // Swipe support
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 50) {
      if (dx < 0) next()
      else prev()
    }
  }

  const handleAvatarClick = (post) => {
    addViewed({ id: post.authorId, name: post.author, city: post.city, badge: null, type: 'social' })
    navigate(`/profile/${post.authorId}`)
  }

  const handleMediaClick = (post) => {
    addViewed({ id: post.authorId, name: post.author, city: post.city, badge: null, type: 'social' })
    navigate(`/profile/${post.authorId}`)
  }

  return (
    <section className="social-club">
      <div className="social-club__header">
        <h2 className="section-title">Социальный клуб</h2>
        <a href="#" className="social-club__link">Войти в клуб &rarr;</a>
      </div>

      <div
        className="social-club__carousel"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <button
          className="social-club__arrow social-club__arrow--left"
          onClick={prev}
          disabled={offset === 0}
        >
          &#8249;
        </button>

        <div className="social-club__list">
          {postsData.slice(offset, offset + visible).map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onAvatarClick={handleAvatarClick}
              onMediaClick={handleMediaClick}
            />
          ))}
        </div>

        <button
          className="social-club__arrow social-club__arrow--right"
          onClick={next}
          disabled={offset >= maxOffset}
        >
          &#8250;
        </button>
      </div>

      {/* Pagination dots */}
      <div className="social-club__dots">
        {Array.from({ length: maxOffset + 1 }, (_, i) => (
          <button
            key={i}
            className={`social-club__dot ${i === offset ? 'social-club__dot--active' : ''}`}
            onClick={() => setOffset(i)}
          />
        ))}
      </div>
    </section>
  )
}
