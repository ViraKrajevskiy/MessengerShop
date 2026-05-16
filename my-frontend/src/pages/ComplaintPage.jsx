import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Header from '../components/Header'
import { apiGetComplaintReasons, apiCreateComplaint } from '../api/businessApi'
import { resolveUrl } from '../utils/urlUtils'
import { makeInitialAvatar } from '../utils/defaults'
import './ComplaintPage.css'

export default function ComplaintPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, getAccessToken } = useAuth()

  const post = location.state?.post || null

  const [reasons, setReasons] = useState([])
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [attached, setAttached] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!user) navigate('/login')
  }, [user, navigate])

  useEffect(() => {
    apiGetComplaintReasons()
      .then(list => {
        const arr = Array.isArray(list) ? list : []
        setReasons(arr)
        if (arr.length) setReason(arr[0].label)
      })
      .catch(() => setReasons([]))
  }, [])

  if (!user) return null

  const submit = async () => {
    if (sending) return
    setSending(true)
    setError('')
    try {
      const token = await getAccessToken()
      if (!token) { setError('Сессия истекла, войдите снова'); setSending(false); return }
      await apiCreateComplaint(
        {
          post_id: attached && post ? post.id : undefined,
          business_id: attached && post ? post.business_id : undefined,
          reason: reason || 'OTHER',
          description: description.trim(),
        },
        token,
      )
      setDone(true)
    } catch (e) {
      setError(e.message || 'Ошибка отправки')
    } finally {
      setSending(false)
    }
  }

  const postImg = post?.media_display ? resolveUrl(post.media_display) : null

  return (
    <div className="cp">
      <Header />
      <main className="cp__main">
        <button className="cp__back" onClick={() => navigate(-1)}>←</button>

        <div className="cp__dialog">
          <div className="cp__head">
            <div className="cp__head-avatar">🛡️</div>
            <div>
              <div className="cp__head-name">Поддержка / Жалоба</div>
              <div className="cp__head-status">● Online</div>
            </div>
          </div>

          {done ? (
            <div className="cp__done">
              <div className="cp__done-icon">✓</div>
              <h3>Жалоба отправлена</h3>
              <p>Администратор рассмотрит вашу жалобу. Спасибо!</p>
              <button className="cp__btn" onClick={() => navigate(-1)}>Закрыть</button>
            </div>
          ) : (
            <div className="cp__body">
              <p className="cp__sys">
                Опишите проблему — сообщение получит администратор.
              </p>

              {post && (
                <div className={`cp__pinned${attached ? '' : ' cp__pinned--off'}`}>
                  <div className="cp__pinned-bar" />
                  <div
                    className="cp__pinned-card"
                    onClick={() => navigate(`/business/${post.business_id}`)}
                  >
                    {postImg ? (
                      <img
                        className="cp__pinned-img"
                        src={postImg}
                        alt={post.business_name || ''}
                        onError={e => { e.target.onerror = null; e.target.src = makeInitialAvatar(post.business_name || '?') }}
                      />
                    ) : (
                      <div className="cp__pinned-img cp__pinned-img--ph">📄</div>
                    )}
                    <div className="cp__pinned-info">
                      <span className="cp__pinned-name">{post.business_name || 'Публикация'}</span>
                      <span className="cp__pinned-text">
                        {post.text ? (post.text.length > 90 ? post.text.slice(0, 90) + '…' : post.text) : 'Без текста'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="cp__pin-toggle"
                    onClick={() => setAttached(a => !a)}
                  >
                    {attached ? '📌 Публикация прикреплена' : '📎 Прикрепить публикацию'}
                  </button>
                </div>
              )}

              <div className="cp__label">Причина</div>
              <div className="cp__reasons">
                {reasons.length === 0 ? (
                  <span className="cp__reasons-empty">Загрузка причин…</span>
                ) : reasons.map(r => (
                  <button
                    key={r.id}
                    type="button"
                    className={`cp__reason${reason === r.label ? ' cp__reason--active' : ''}`}
                    onClick={() => setReason(r.label)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <textarea
                className="cp__textarea"
                placeholder="Опишите подробнее, что не так с публикацией…"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                maxLength={1000}
              />

              {error && <p className="cp__error">{error}</p>}

              <button
                className="cp__btn cp__btn--send"
                onClick={submit}
                disabled={sending || !reason}
              >
                {sending ? 'Отправка…' : 'Отправить администратору'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
