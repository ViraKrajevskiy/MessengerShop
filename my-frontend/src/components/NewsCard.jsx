import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NewsCard({ item }) {
  const navigate = useNavigate();
  if (!item) return null;

  const isVideo = item.media_type === 'VIDEO';
  const excerpt = item.text?.length > 90 ? item.text.slice(0, 90) + '...' : item.text;
  const dateStr = item.created_at
    ? new Date(item.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
    : '';

  return (
    <div className="news-card" onClick={() => navigate(`/news/${item.id}`)}>
      <div className="news-card__cover">
        {item.media_display ? (
          <img src={item.media_display} alt={item.title} className="news-card__cover-img" />
        ) : (
          <div className="news-card__no-img">📢</div>
        )}
        <div className="news-card__cover-overlay" />
        <span className="news-card__type-badge">
          {item.news_type === 'PLATFORM' ? 'Платформа' : 'Бизнес'}
        </span>
        {isVideo && <span className="news-card__video-badge">▶</span>}
      </div>

      <div className="news-card__content">
        <h3 className="news-card__title">{item.title}</h3>
        {excerpt && <p className="news-card__excerpt">{excerpt}</p>}
        <div className="news-card__meta">
          <span className="news-card__source">{item.business_name || 'MessengerShop'}</span>
          <span className="news-card__date">{dateStr}</span>
        </div>
      </div>
    </div>
  );
}
