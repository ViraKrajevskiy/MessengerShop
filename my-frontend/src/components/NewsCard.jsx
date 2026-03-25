import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NewsCard({ item }) {
  const navigate = useNavigate();
  if (!item) return null;

  return (
    <div
      className={`news-card news-card--${item.news_type?.toLowerCase()}`}
      onClick={() => navigate(`/news/${item.id}`)}
    >
      <div className="news-card__image-wrapper">
        {item.media_display ? (
          <img src={item.media_display} alt={item.title} className="news-card__img" />
        ) : (
          <div className="news-card__placeholder">📢</div>
        )}

        {/* Тип новости поверх картинки */}
        <div className="news-card__category-tag">
          {item.news_type === 'PLATFORM' ? 'Инфо' : 'Бизнес'}
        </div>
      </div>

      <div className="news-card__body">
        <h3 className="news-card__title">{item.title}</h3>

        {/* Теги внутри карточки */}
        {item.tags && item.tags.length > 0 && (
          <div className="news-card__hashtags">
            {item.tags.map((tag, idx) => (
              <span key={idx} className="hashtag">#{tag}</span>
            ))}
          </div>
        )}

        <p className="news-card__description">
          {item.text?.length > 100 ? item.text.slice(0, 100) + '...' : item.text}
        </p>

        <div className="news-card__footer">
          <span className="news-card__source">
             {item.business_name || 'MessengerShop'}
          </span>
          <span className="news-card__date">
            {new Date(item.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}