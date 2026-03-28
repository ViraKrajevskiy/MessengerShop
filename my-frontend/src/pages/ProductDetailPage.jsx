import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { apiSendProductInquiry } from '../api/businessApi'
import './ProductDetailPage.css'

const BASE = import.meta.env.PROD
  ? 'https://api.101-school.uz/api'
  : 'http://127.0.0.1:8000/api'

const FALLBACK_IMG = 'https://picsum.photos/id/342/800/600'

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, getAccessToken } = useAuth()
  const [product, setProduct] = useState(null)
  const [business, setBusiness] = useState(null)
  const [loading, setLoading] = useState(true)
  const [inquiryMsg, setInquiryMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    fetch(`${BASE}/products/${id}/`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        setProduct(data)
        return fetch(`${BASE}/businesses/${data.business_id}/`)
      })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(biz => setBusiness(biz))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const handleInquiry = async () => {
    if (!user) { navigate('/login'); return }
    if (!inquiryMsg.trim()) return
    setSending(true)
    try {
      const token = await getAccessToken()
      const msg = `#${product.id} ${inquiryMsg}`
      await apiSendProductInquiry(product.id, msg, token)
      setSent(true)
      setInquiryMsg('')
    } catch (e) {
      console.error(e)
    } finally {
      setSending(false)
    }
  }

  const goToGroup = () => {
    if (!user) { navigate('/login'); return }
    if (business?.group_id) {
      navigate(`/messenger?group=${business.group_id}`)
    }
  }

  const goToChat = () => {
    if (!user) { navigate('/login'); return }
    navigate(`/messenger`)
  }

  if (loading) {
    return (
      <div className="pdp">
        <Header />
        <main className="pdp__main">
          <div className="pdp__skeleton">
            <div className="pdp__skel-img" />
            <div className="pdp__skel-lines">
              <div className="pdp__skel-line" style={{ width: '60%' }} />
              <div className="pdp__skel-line" style={{ width: '40%' }} />
              <div className="pdp__skel-line" style={{ width: '80%' }} />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="pdp">
        <Header />
        <main className="pdp__main">
          <div className="pdp__not-found">Товар не найден</div>
        </main>
        <Footer />
      </div>
    )
  }

  const img = product.image_display || FALLBACK_IMG
  const priceStr = product.price != null
    ? `${Number(product.price).toLocaleString('ru-RU')} ${product.currency_symbol || product.currency}`
    : 'Цена по запросу'
  const isService = product.product_type === 'SERVICE'
  const tags = product.tags || []

  return (
    <div className="pdp">
      <Header />
      <main className="pdp__main">
        <button className="pdp__back" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Назад
        </button>

        <div className="pdp__layout">
          {/* Left: image */}
          <div className="pdp__gallery">
            <img className="pdp__img" src={img} alt={product.name} />
            <span className={`pdp__type-badge pdp__type-badge--${isService ? 'service' : 'product'}`}>
              {isService ? 'Услуга' : 'Товар'}
            </span>
          </div>

          {/* Right: info */}
          <div className="pdp__info">
            <h1 className="pdp__name">{product.name}</h1>
            <div className="pdp__price">{priceStr}</div>

            {tags.length > 0 && (
              <div className="pdp__tags">
                {tags.map(t => (
                  <span key={t} className="pdp__tag" onClick={() => navigate(`/feed`)}>#{t}</span>
                ))}
              </div>
            )}

            {product.description && (
              <div className="pdp__desc">
                <h3>Описание</h3>
                <p>{product.description}</p>
              </div>
            )}

            <div className="pdp__id">ID товара: <code>#{product.id}</code></div>

            {/* Business profile */}
            {business && (
              <div className="pdp__biz" onClick={() => navigate(`/business/${business.id}`)}>
                <img
                  className="pdp__biz-logo"
                  src={business.logo ? (business.logo.startsWith('http') ? business.logo : `https://api.101-school.uz${business.logo}`) : `https://i.pravatar.cc/80?u=${business.id}`}
                  alt={business.brand_name}
                />
                <div className="pdp__biz-info">
                  <span className="pdp__biz-name">
                    {business.brand_name}
                    {business.is_verified && <span className="pdp__biz-verified" title="Проверено">&#10003;</span>}
                    {business.is_vip && <span className="pdp__biz-vip" title="VIP">&#9733;</span>}
                  </span>
                  <span className="pdp__biz-meta">
                    {business.category_label} {business.city && `\u00b7 ${business.city}`}
                  </span>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="pdp__actions">
              <button className="pdp__btn pdp__btn--chat" onClick={goToChat}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                Написать
              </button>
              {business?.group_id && (
                <button className="pdp__btn pdp__btn--group" onClick={goToGroup}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                  Группа
                </button>
              )}
            </div>

            {/* Quick inquiry form */}
            <div className="pdp__inquiry">
              <h3>Задать вопрос о {isService ? 'услуге' : 'товаре'}</h3>
              {sent ? (
                <div className="pdp__inquiry-sent">
                  <span>Вопрос отправлен!</span>
                  <button onClick={() => navigate('/messenger')}>Открыть чат</button>
                </div>
              ) : (
                <>
                  <div className="pdp__inquiry-preview">
                    <code>#{product.id}</code> будет автоматически прикреплён
                  </div>
                  <div className="pdp__inquiry-form">
                    <input
                      type="text"
                      placeholder={`Вопрос о "${product.name}"...`}
                      value={inquiryMsg}
                      onChange={e => setInquiryMsg(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleInquiry()}
                    />
                    <button onClick={handleInquiry} disabled={sending || !inquiryMsg.trim()}>
                      {sending ? '...' : 'Отправить'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
