import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiSendProductInquiry } from '../api/businessApi'
import './ProductCard.css'

const FALLBACK_IMGS = [
  'https://picsum.photos/id/119/400/300',
  'https://picsum.photos/id/137/400/300',
  'https://picsum.photos/id/145/400/300',
  'https://picsum.photos/id/177/400/300',
]

export default function ProductCard({ product }) {
  const navigate = useNavigate()
  const { user, getAccessToken } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [likes, setLikes] = useState(product.likes_count || 0)

  const handleLike = (e) => {
    e.stopPropagation()
    if (!user) { navigate('/login'); return }
    setLikes(l => liked ? l - 1 : l + 1)
    setLiked(!liked)
  }

  const handleSave = (e) => {
    e.stopPropagation()
    if (!user) { navigate('/login'); return }
    setSaved(!saved)
  }

  const img = product.image_display || FALLBACK_IMGS[product.id % FALLBACK_IMGS.length]
  const priceStr = product.price != null
    ? `${Number(product.price).toLocaleString('ru-RU')} ${product.currency_symbol || product.currency}`
    : 'Цена по запросу'

  const handleDetail = (e) => {
    e.stopPropagation()
    setShowDetail(true)
  }

  const handleContactFromDetail = () => {
    setShowDetail(false)
    if (!user) { navigate('/login'); return }
    setShowModal(true)
    setMessage(`Здравствуйте! Интересует товар: ${product.name}. `)
    setSent(false)
    setError('')
  }

  const handleContact = (e) => {
    e.stopPropagation()
    if (!user) { navigate('/login'); return }
    setShowModal(true)
    setMessage(`Здравствуйте! Интересует товар: ${product.name}. `)
    setSent(false)
    setError('')
  }

  const handleSend = async () => {
    if (!message.trim()) return
    setSending(true)
    setError('')
    try {
      const token = await getAccessToken()
      if (!token) { navigate('/login'); return }
      await apiSendProductInquiry(product.id, message, token)
      setSent(true)
    } catch {
      setError('Ошибка отправки. Попробуйте ещё раз.')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <div className="product-card" onClick={() => navigate(`/business/${product.business_id}`)}>
        <div className="product-card__img-wrap">
          <img src={img} alt={product.name} className="product-card__img" loading="lazy" />
          {!product.is_available && <span className="product-card__unavailable">Недоступно</span>}
        </div>
        <div className="product-card__body">
          <p className="product-card__biz">{product.business_name}</p>
          <h3 className="product-card__name">{product.name}</h3>
          {product.description && (
            <p className="product-card__desc">{product.description}</p>
          )}
          <div className="product-card__footer">
            <span className="product-card__price">{priceStr}</span>
            <div className="product-card__icon-actions">
              <button className={`product-card__icon-btn ${liked ? 'product-card__icon-btn--liked' : ''}`} onClick={handleLike} title="Нравится">
                <svg width="16" height="16" viewBox="0 0 24 24" fill={liked ? '#e53935' : 'none'} stroke={liked ? '#e53935' : 'currentColor'} strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                {likes}
              </button>
              <button className={`product-card__icon-btn ${saved ? 'product-card__icon-btn--saved' : ''}`} onClick={handleSave} title="В избранное">
                <svg width="16" height="16" viewBox="0 0 24 24" fill={saved ? '#f59e0b' : 'none'} stroke={saved ? '#f59e0b' : 'currentColor'} strokeWidth="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
              </button>
            </div>
          </div>
          <div className="product-card__actions">
            <button className="product-card__btn product-card__btn--contact" onClick={handleContact}>Написать</button>
            <button className="product-card__btn" onClick={handleDetail}>Подробнее</button>
          </div>
        </div>
      </div>

      {showDetail && (
        <div className="inquiry-modal__overlay" onClick={() => setShowDetail(false)}>
          <div className="product-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="inquiry-modal__header">
              <h3 className="product-detail-modal__title">О товаре</h3>
              <button className="inquiry-modal__close" onClick={() => setShowDetail(false)}>✕</button>
            </div>

            <div className="product-detail-modal__img-wrap">
              <img src={img} alt={product.name} className="product-detail-modal__img" />
              {!product.is_available && (
                <span className="product-card__unavailable">Недоступно</span>
              )}
            </div>

            <div className="product-detail-modal__body">
              {product.business_name && (
                <p className="product-card__biz">{product.business_name}</p>
              )}
              <h2 className="product-detail-modal__name">{product.name}</h2>
              <p className="product-detail-modal__price">{priceStr}</p>
              {product.description && (
                <p className="product-detail-modal__desc">{product.description}</p>
              )}
            </div>

            <div className="product-detail-modal__footer">
              <button
                className="product-card__btn product-card__btn--contact"
                style={{ flex: 1 }}
                onClick={handleContactFromDetail}
              >
                ✉ Написать бизнесу
              </button>
              <button
                className="product-card__btn"
                style={{ flex: 1 }}
                onClick={() => { setShowDetail(false); navigate(`/business/${product.business_id}`) }}
              >
                Страница бизнеса
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="inquiry-modal__overlay" onClick={() => setShowModal(false)}>
          <div className="inquiry-modal" onClick={e => e.stopPropagation()}>
            <div className="inquiry-modal__header">
              <h3>Написать бизнесу</h3>
              <button className="inquiry-modal__close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="inquiry-modal__product">
              <img src={img} alt={product.name} className="inquiry-modal__product-img" />
              <div>
                <div className="inquiry-modal__product-name">{product.name}</div>
                <div className="inquiry-modal__product-price">{priceStr}</div>
              </div>
            </div>

            {sent ? (
              <div className="inquiry-modal__success">
                <div style={{ fontSize: 36 }}>✓</div>
                <p>Сообщение отправлено! Бизнес свяжется с вами.</p>
                <button className="inquiry-modal__send-btn" onClick={() => setShowModal(false)}>Закрыть</button>
              </div>
            ) : (
              <>
                <textarea
                  className="inquiry-modal__textarea"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Напишите ваш вопрос..."
                  rows={4}
                />
                {error && <p className="inquiry-modal__error">{error}</p>}
                <button
                  className="inquiry-modal__send-btn"
                  onClick={handleSend}
                  disabled={sending || !message.trim()}
                >
                  {sending ? 'Отправляем...' : 'Отправить'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
