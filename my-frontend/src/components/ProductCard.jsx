import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { apiSendProductInquiry } from '../api/businessApi'
import ReviewsSection from './ReviewsSection'
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
  const { t } = useLanguage()
  const [showModal, setShowModal] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const handleSave = (e) => {
    e.stopPropagation()
    if (!user) { navigate('/login'); return }
    setSaved(!saved)
  }

  const img = product.image_display || FALLBACK_IMGS[product.id % FALLBACK_IMGS.length]
  const priceStr = product.price != null
    ? `${Number(product.price).toLocaleString('ru-RU')} ${product.currency_symbol || product.currency}`
    : t('product_onReq')

  const handleDetail = (e) => {
    e.stopPropagation()
    setShowDetail(true)
  }

  const handleContactFromDetail = () => {
    setShowDetail(false)
    if (!user) { navigate('/login'); return }
    setShowModal(true)
    setMessage(`${t('product_inquiry')} ${product.name}. `)
    setSent(false)
    setError('')
  }

  const handleContact = (e) => {
    e.stopPropagation()
    if (!user) { navigate('/login'); return }
    setShowModal(true)
    setMessage(`${t('product_inquiry')} ${product.name}. `)
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
      setError(t('prod_sendError'))
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <div className="product-card" onClick={() => navigate(`/business/${product.business_id}`)}>
        <div className="product-card__img-wrap">
          <img src={img} alt={product.name} className="product-card__img" loading="lazy" />
          {!product.is_available && <span className="product-card__unavailable">{t('prod_unavailable')}</span>}
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
              <button className={`product-card__icon-btn ${saved ? 'product-card__icon-btn--saved' : ''}`} onClick={handleSave} title={t('post_addFav')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill={saved ? '#f59e0b' : 'none'} stroke={saved ? '#f59e0b' : 'currentColor'} strokeWidth="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
              </button>
            </div>
          </div>
          <div className="product-card__actions">
            <button className="product-card__btn product-card__btn--contact" onClick={handleContact}>{t('prod_write')}</button>
            <button className="product-card__btn" onClick={handleDetail}>{t('prod_details')}</button>
          </div>
        </div>
      </div>

      {showDetail && (
        <div className="inquiry-modal__overlay" onClick={() => setShowDetail(false)}>
          <div className="product-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="inquiry-modal__header">
              <h3 className="product-detail-modal__title">{t('prod_modalAbout')}</h3>
              <button className="inquiry-modal__close" onClick={() => setShowDetail(false)}>✕</button>
            </div>

            <div className="product-detail-modal__img-wrap">
              <img src={img} alt={product.name} className="product-detail-modal__img" />
              {!product.is_available && (
                <span className="product-card__unavailable">{t('prod_unavailable')}</span>
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

            <div className="product-detail-modal__reviews">
              <ReviewsSection type="product" targetId={product.id} />
            </div>

            <div className="product-detail-modal__footer">
              <button
                className="product-card__btn product-card__btn--contact"
                style={{ flex: 1 }}
                onClick={handleContactFromDetail}
              >
                ✉ {t('prod_modalWriteBiz')}
              </button>
              <button
                className="product-card__btn"
                style={{ flex: 1 }}
                onClick={() => { setShowDetail(false); navigate(`/business/${product.business_id}`) }}
              >
                {t('nav_shopPage')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="inquiry-modal__overlay" onClick={() => setShowModal(false)}>
          <div className="inquiry-modal" onClick={e => e.stopPropagation()}>
            <div className="inquiry-modal__header">
              <h3>{t('prod_modalWriteBiz')}</h3>
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
                <p>{t('prod_messageSent')}</p>
                <button className="inquiry-modal__send-btn" onClick={() => setShowModal(false)}>{t('prod_close')}</button>
              </div>
            ) : (
              <>
                <textarea
                  className="inquiry-modal__textarea"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder={t('prod_questionPlaceholder')}
                  rows={4}
                />
                {error && <p className="inquiry-modal__error">{error}</p>}
                <button
                  className="inquiry-modal__send-btn"
                  onClick={handleSend}
                  disabled={sending || !message.trim()}
                >
                  {sending ? t('prod_sending') : t('send')}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
