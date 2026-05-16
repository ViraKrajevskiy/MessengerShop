import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGetPosts } from '../api/businessApi'
import './TweetsSidebar.css'

const PAGE_SIZE = 8

export default function TweetsSidebar({ posts: postsProp }) {
  const [posts, setPosts] = useState(postsProp || [])
  const [page, setPage] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    if (Array.isArray(postsProp)) {
      setPosts(postsProp)
      return
    }
    apiGetPosts()
      .then(data => setPosts(Array.isArray(data) ? data : []))
      .catch(() => setPosts([]))
  }, [postsProp])

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
              <div className="tweet-item__body">
                <div className="sk-line" style={{ width: '90%', height: 11 }} />
                <div className="sk-line" style={{ width: '60%', height: 11, marginTop: 5 }} />
                <div className="sk-line" style={{ width: '40%', height: 10, marginTop: 6 }} />
              </div>
            </div>
          ))
        ) : (
          visible.map(post => (
            <div
              key={post.id}
              className="tweet-item"
              onClick={() => navigate(`/business/${post.business_id}`)}
            >
              <div className="tweet-item__body">
                <span className="tweet-item__city">{post.business_name}</span>
                <p className="tweet-item__text">
                  {post.text?.length > 60 ? post.text.slice(0, 60) + '...' : post.text}
                </p>
              </div>
            </div>
          ))
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
