import { useNavigate } from 'react-router-dom'
import './ProductCard.css'

const FALLBACK_IMGS = [
  'https://picsum.photos/id/119/400/300',
  'https://picsum.photos/id/137/400/300',
  'https://picsum.photos/id/145/400/300',
  'https://picsum.photos/id/177/400/300',
]

export default function ProductCard({ product }) {
  const navigate = useNavigate()
  const img = product.image_display || FALLBACK_IMGS[product.id % FALLBACK_IMGS.length]

  const priceStr = product.price != null
    ? `${Number(product.price).toLocaleString('ru-RU')} ${product.currency_symbol || product.currency}`
    : 'Цена по запросу'

  return (
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
          <button
            className="product-card__btn"
            onClick={e => { e.stopPropagation(); navigate(`/business/${product.business_id}`) }}
          >
            Подробнее
          </button>
        </div>
      </div>
    </div>
  )
}
