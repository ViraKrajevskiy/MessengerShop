import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiGetPosts } from '../api/businessApi'
import { resolveUrl } from '../utils/urlUtils'
import { makeInitialAvatar } from '../utils/defaults'
import './TweetsSidebar.css'

const PREVIEW_SIZE = 5

export default function TweetsSidebar({ posts: postsProp }) {
  const [posts, setPosts] = useState(postsProp || [])
  const navigate = useNavigate()
  const { tokens } = useAuth()

  useEffect(() => {
    if (Array.isArray(postsProp)) {
      setPosts(postsProp)
      return
    }
    apiGetPosts(tokens?.access)
      .then(data => setPosts(Array.isArray(data) ? data : []))
      .catch(() => setPosts([]))
  }, [postsProp, tokens?.access])

  const visible = posts.slice(0, PREVIEW_SIZE)
  const hasMore = posts.length > PREVIEW_SIZE

  return (
    <div className="tweets-sidebar-wrap">
      <aside className="tweets-sidebar">
        <div className="tweets-sidebar__header">
          <span>ТВИТЫ</span>
        </div>

        <div className="tweets-sidebar__list">
          {visible.length === 0 ? (
            Array.from({ length: PREVIEW_SIZE }).map((_, i) => (
              <div key={i} className="tweet-item tweet-item--skeleton">
                <div className="tweet-item__avatar-skeleton" />
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
                <img
                  className="tweet-item__avatar"
                  src={post.business_logo ? resolveUrl(post.business_logo) : makeInitialAvatar(post.business_name)}
                  alt={post.business_name}
                  width="38"
                  height="38"
                  loading="lazy"
                  onError={(e) => { e.currentTarget.src = makeInitialAvatar(post.business_name) }}
                />
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

        {hasMore && (
          <button
            className="tweets-sidebar__show-all"
            onClick={() => navigate('/feed')}
          >
            Все твиты ({posts.length})
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        )}
      </aside>
    </div>
  )
}
