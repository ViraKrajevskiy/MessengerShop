import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useViewed } from '../context/ViewedContext'
import './NewUsers.css'

const NEW_USER_AVATARS = [
  'https://i.pravatar.cc/150?img=11',
  'https://i.pravatar.cc/150?img=47',
  'https://i.pravatar.cc/150?img=12',
  'https://i.pravatar.cc/150?img=48',
  'https://i.pravatar.cc/150?img=13',
  'https://i.pravatar.cc/150?img=33',
  'https://i.pravatar.cc/150?img=49',
  'https://i.pravatar.cc/150?img=14',
  'https://i.pravatar.cc/150?img=41',
  'https://i.pravatar.cc/150?img=15',
]

// ---------- mock new users ----------
const initialUsers = [
  { id: 100, name: 'Сулеман', city: 'Ташкент', registeredAt: Date.now() - 3600000 },
  { id: 101, name: 'Айдана', city: 'Алматы', registeredAt: Date.now() - 7200000 },
  { id: 102, name: 'Рустам', city: 'Стамбул', registeredAt: Date.now() - 10800000 },
  { id: 103, name: 'Гульназ', city: 'Анкара', registeredAt: Date.now() - 14400000 },
  { id: 104, name: 'Сулеман', city: 'Ташкент', registeredAt: Date.now() - 18000000 },
  { id: 105, name: 'Фарход', city: 'Бурса', registeredAt: Date.now() - 21600000 },
  { id: 106, name: 'Нилуфар', city: 'Анталья', registeredAt: Date.now() - 25200000 },
  { id: 107, name: 'Ботир', city: 'Стамбул', registeredAt: Date.now() - 28800000 },
  { id: 108, name: 'Зулхумор', city: 'Измир', registeredAt: Date.now() - 32400000 },
  { id: 109, name: 'Аскар', city: 'Алматы', registeredAt: Date.now() - 36000000 },
]

// Simulated new user names for auto-add
const RANDOM_NAMES = ['Диёра', 'Жасмин', 'Тимур', 'Лола', 'Саид', 'Мадина', 'Бахром', 'Шахло']
const RANDOM_CITIES = ['Стамбул', 'Ташкент', 'Алматы', 'Анкара', 'Анталья', 'Измир', 'Бурса']

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

export default function NewUsers() {
  const [users, setUsers] = useState(initialUsers)
  const [showAll, setShowAll] = useState(false)
  const { addViewed } = useViewed()
  const navigate = useNavigate()

  // Simulate auto-adding new users every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const newUser = {
        id: Date.now(),
        name: RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)],
        city: RANDOM_CITIES[Math.floor(Math.random() * RANDOM_CITIES.length)],
        registeredAt: Date.now(),
      }
      setUsers((prev) => [newUser, ...prev])
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const displayUsers = showAll ? users : users.slice(0, 10)

  const handleUserClick = (user) => {
    addViewed({ id: user.id, name: user.name, city: user.city, badge: null, type: 'new-user' })
    navigate(`/profile/${user.id}`)
  }

  return (
    <section className="new-users">
      <div className="new-users__header">
        <h2 className="section-title">Новые пользователи</h2>
        <button
          className="new-users__show-all"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? 'Свернуть' : 'Смотреть все'}
        </button>
      </div>

      <div className="new-users__subtitle">
        Новые люди на платформе — познакомьтесь первыми!
      </div>

      <div className={`new-users__grid ${showAll ? 'new-users__grid--expanded' : ''}`}>
        {displayUsers.map((u) => (
          <div
            key={u.id}
            className="new-users__item"
            onClick={() => handleUserClick(u)}
          >
            <div className="new-users__avatar">
              <img className="new-users__avatar-img" src={NEW_USER_AVATARS[u.id % NEW_USER_AVATARS.length]} alt={u.name} loading="lazy" />
              <div className="new-users__online-dot" />
            </div>
            <span className="new-users__name">{u.name}</span>
            <span className="new-users__city">{u.city}</span>
            <span className="new-users__time">{timeAgo(u.registeredAt)}</span>
          </div>
        ))}
      </div>

      {showAll && users.length > 10 && (
        <div className="new-users__count">
          Всего новых пользователей: <strong>{users.length}</strong>
        </div>
      )}
    </section>
  )
}
