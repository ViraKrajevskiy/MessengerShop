import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { apiGetBusinessReviews, apiCreateBusinessReview, apiGetProductReviews, apiCreateProductReview } from '../api/businessApi'
import { DEFAULT_AVATAR } from '../utils/defaults'
import './ReviewsSection.css'

const FALLBACK_AVATAR = DEFAULT_AVATAR

function Stars({ rating, size = 16, interactive = false, onSelect }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="rv-stars" style={{ gap: size * 0.2 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          className={`rv-star ${n <= (hover || rating) ? 'rv-star--filled' : ''} ${interactive ? 'rv-star--interactive' : ''}`}
          style={{ fontSize: size }}
          onMouseEnter={() => interactive && setHover(n)}
          onMouseLeave={() => interactive && setHover(0)}
          onClick={() => interactive && onSelect?.(n)}
        >★</span>
      ))}
    </div>
  )
}


function ReviewCard({ review }) {
  const { t } = useLanguage()
  const avatar = review.author_avatar || FALLBACK_AVATAR
  const date = new Date(review.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
  return (
    <div className="rv-card">
      <div className="rv-card__head">
        <img src={avatar} alt={review.author_name} className="rv-card__avatar" />
        <div className="rv-card__author">
          <span className="rv-card__name">{review.author_name}</span>
          <span className="rv-card__date">{date}</span>
        </div>
        <Stars rating={review.rating} size={14} />
      </div>
      {review.pros && (
        <div className="rv-card__row">
          <span className="rv-card__label rv-card__label--pros">{t('review_pros')}</span>
          <span>{review.pros}</span>
        </div>
      )}
      {review.cons && (
        <div className="rv-card__row">
          <span className="rv-card__label rv-card__label--cons">{t('review_cons')}</span>
          <span>{review.cons}</span>
        </div>
      )}
      {review.text && <p className="rv-card__text">{review.text}</p>}
    </div>
  )
}

function ReviewForm({ onSubmit, onCancel, loading, error }) {
  const [rating, setRating] = useState(0)
  const [pros, setPros] = useState('')
  const [cons, setCons] = useState('')
  const [text, setText] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!rating) return
    onSubmit({ rating, pros, cons, text })
  }

  return (
    <form className="rv-form" onSubmit={handleSubmit}>
      <div className="rv-form__stars-label">Ваша оценка</div>
      <Stars rating={rating} size={32} interactive onSelect={setRating} />
      <input
        className="rv-form__input"
        placeholder="Достоинства (необязательно)"
        value={pros}
        onChange={e => setPros(e.target.value)}
        maxLength={500}
      />
      <input
        className="rv-form__input"
        placeholder="Недостатки (необязательно)"
        value={cons}
        onChange={e => setCons(e.target.value)}
        maxLength={500}
      />
      <textarea
        className="rv-form__textarea"
        placeholder="Комментарий (необязательно)"
        value={text}
        onChange={e => setText(e.target.value)}
        rows={3}
      />
      {error && <p className="rv-form__error">{error}</p>}
      <div className="rv-form__actions">
        <button type="button" className="rv-form__cancel" onClick={onCancel}>Отмена</button>
        <button type="submit" className="rv-form__submit" disabled={!rating || loading}>
          {loading ? 'Отправка...' : 'Опубликовать отзыв'}
        </button>
      </div>
    </form>
  )
}

export default function ReviewsSection({ type, targetId, horizontal }) {
  const { user, getAccessToken } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [page, setPage] = useState(0)

  const isBusiness = type === 'business'
  const CARDS_PER_PAGE = horizontal ? 20 : undefined

  useEffect(() => {
    const fetcher = isBusiness ? apiGetBusinessReviews : apiGetProductReviews
    fetcher(targetId)
      .then(setData)
      .catch(() => setData({ summary: { average: 0, total: 0, distribution: {} }, reviews: [] }))
      .finally(() => setLoading(false))
  }, [targetId, isBusiness])

  const handleSubmit = async (formData) => {
    setSubmitting(true)
    setFormError('')
    try {
      const token = await getAccessToken()
      const creator = isBusiness ? apiCreateBusinessReview : apiCreateProductReview
      const review = await creator(targetId, formData, token)
      setData(prev => ({
        summary: {
          ...prev.summary,
          total: prev.summary.total + 1,
          average: ((prev.summary.average * prev.summary.total) + formData.rating) / (prev.summary.total + 1),
          distribution: {
            ...prev.summary.distribution,
            [formData.rating]: (prev.summary.distribution[formData.rating] || 0) + 1,
          },
        },
        reviews: [review, ...prev.reviews],
      }))
      setShowForm(false)
    } catch (e) {
      setFormError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return null
  if (!data) return null

  const { summary, reviews } = data

  // Pagination logic for horizontal layout
  let visible = reviews
  let totalPages = 1
  if (horizontal && CARDS_PER_PAGE) {
    totalPages = Math.ceil(reviews.length / CARDS_PER_PAGE)
    visible = reviews.slice(page * CARDS_PER_PAGE, (page + 1) * CARDS_PER_PAGE)
  } else if (!horizontal) {
    // Vertical layout: show all or first 3
    visible = showAll ? reviews : reviews.slice(0, 3)
  }

  const canReview = user && !showForm

  const handlePageChange = (newPage) => {
    setPage(newPage)
    window.scrollTo(0, 0)
  }

  return (
    <section className="rv-section">
      <div className="rv-section__header">
        <h2 className="rv-section__title">
          Оценки
          {summary.total > 0 && <sup className="rv-section__count">{summary.total}</sup>}
        </h2>
      </div>

      {summary.total === 0 && (
        <p className="rv-empty">Пока нет отзывов. Будьте первым!</p>
      )}

      {canReview && (
        <button className="rv-write-btn" onClick={() => {
          if (!user) { navigate('/login'); return }
          setShowForm(true)
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Написать отзыв
        </button>
      )}

      {showForm && (
        <ReviewForm
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setFormError('') }}
          loading={submitting}
          error={formError}
        />
      )}

      {visible.length > 0 && (
        <div className={horizontal ? 'rv-list rv-list--horizontal' : 'rv-list'}>
          {visible.map(r => <ReviewCard key={r.id} review={r} />)}
        </div>
      )}

      {horizontal && reviews.length > CARDS_PER_PAGE && (
        <div className="rv-pagination">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              className={`rv-pagination__btn ${page === i ? 'rv-pagination__btn--active' : ''}`}
              onClick={() => handlePageChange(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {!horizontal && reviews.length > 3 && (
        <button className="rv-show-all" onClick={() => setShowAll(s => !s)}>
          {showAll ? 'Скрыть' : `Смотреть все отзывы (${reviews.length})`}
        </button>
      )}
    </section>
  )
}
