import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGetPosts } from '../api/businessApi'
import './TweetsSidebar.css'

const FALLBACK_IMGS = [
  'https://picsum.photos/id/342/80/80',
  'https://picsum.photos/id/1025/80/80',
  'https://picsum.photos/id/177/80/80',
  'https://picsum.photos/id/1062/80/80',
  'https://picsum.photos/id/239/80/80',
  'https://picsum.photos/id/1074/80/80',
  'https://picsum.photos/id/306/80/80',
  'https://picsum.photos/id/338/80/80',
]

const PAGE_SIZE = 5

export default function TweetsSidebar() {
  const [posts, setPosts] = useState([])
  const [page, setPage] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    apiGetPosts()
      .then(data => setPosts(Array.isArray(data) ? data : []))
      .catch(() => setPosts([]))
  }, [])

  const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE))
  const visible = posts.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  return (
    <aside className="tweets-sidebar">
      <div className="tweets-sidebar__header">
        <span>ТВИТЫ</span>
      </div>

      <div className="tweets-sidebar__list">
        {visible.length === 0 ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="tweet-item tweet-item--skeleton">
              <div className="tweet-item__img-skeleton" />
              <div className="tweet-item__body">
                <div className="sk-line" style={{ width: '90%', height: 11 }} />
                <div className="sk-line" style={{ width: '60%', height: 11, marginTop: 5 }} />
                <div className="sk-line" style={{ width: '40%', height: 10, marginTop: 6 }} />
              </div>
            </div>
          ))
        ) : (
          visible.map(post => {
            const fixUrl = (url) => {
              if (!url) return null
              if (url.startsWith('http')) return url
              return 'https://api.101-school.uz' + url
            }
            const img = fixUrl(post.media_display) || FALLBACK_IMGS[post.id % FALLBACK_IMGS.length]
            return (
              <div
                key={post.id}
                className="tweet-item"
                onClick={() => navigate(`/business/${post.business_id}`)}
              >
                <img className="tweet-item__img" src={img} alt={post.business_name} loading="lazy" />
                <div className="tweet-item__body">
                  <p className="tweet-item__text">
                    {post.text?.length > 60 ? post.text.slice(0, 60) + '...' : post.text}
                  </p>
                  <span className="tweet-item__city">{post.business_name}</span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {totalPages > 1 && (
        <div className="tweets-sidebar__pagination">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              className={`tweets-sidebar__page-btn ${i === page ? 'tweets-sidebar__page-btn--active' : ''}`}
              onClick={() => setPage(i)}
            >
              {i + 1}
            </button>
          ))}
          {page < totalPages - 1 && (
            <button className="tweets-sidebar__page-btn" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}>
              &rsaquo;
            </button>
          )}
        </div>
      )}
    </aside>
  )
}
