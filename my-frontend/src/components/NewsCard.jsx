import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NewsCard({ item }) {
  const navigate = useNavigate();
  if (!item) return null;

  const dateStr = item.created_at
    ? new Date(item.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
    : '';
  const title = item.title?.length > 55 ? item.title.slice(0, 55) + '...' : item.title;

  return (
    <div className="news-card" onClick={() => navigate(`/news/${item.id}`)}>
      <div className="news-card__image">
        {item.media_display ? (
          <img src={item.media_display} alt={item.title} className="news-card__photo" loading="lazy" />
        ) : (
          <div className="news-card__no-img">📢</div>
        )}
        <span className="news-card__badge">
          {item.news_type === 'PLATFORM' ? 'Платформа' : 'Бизнес'}
        </span>
      </div>
      <div className="news-card__info">
        <span className="news-card__title">{title}</span>
        <span className="news-card__source">{item.business_name || 'MessengerShop'}</span>
      </div>
    </div>
  );
}
