
export default function NewsCard({ item }) {
  return (
    <div className={`news-card news-card--${item.news_type.toLowerCase()}`}>
      {item.media_display && (
        <div className="news-card__image">
          <img src={item.media_display} alt={item.title} />
        </div>
      )}
      <div className="news-card__content">
        <div className="news-card__badge">
          {item.news_type === 'PLATFORM' ? '📢 Платформа' : '🏢 Бизнес'}
        </div>
        <h3 className="news-card__title">{item.title}</h3>
        <p className="news-card__text">{item.text.slice(0, 120)}...</p>
        <div className="news-card__footer">
          <span className="news-card__author">{item.business_name || item.author_name}</span>
          <span className="news-card__date">{new Date(item.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}