import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './NewsDetailPage.css'; // Создадим отдельный файл стилей

export default function NewsDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const BASE = import.meta.env.PROD ? 'https://api.101-school.uz/api' : 'http://127.0.0.1:8000/api';
        const res = await fetch(`${BASE}/news/${id}/`);
        if (!res.ok) throw new Error('Ошибка');
        const data = await res.json();
        setItem(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
    window.scrollTo(0, 0); // Прокрутка вверх при открытии
  }, [id]);

  if (loading) return <div className="news-loading">Загрузка...</div>;
  if (!item) return <div className="news-error">Новость не найдена</div>;

  return (
    <div className="news-page">
      <Header />

      <main className="news-container">
        {/* Кнопка назад с иконкой */}
        <button onClick={() => navigate(-1)} className="news-back-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Назад к ленте
        </button>

        <article className="news-article">
          {/* Шапка новости */}
          <header className="news-header">
            <div className="news-meta-top">
              <span className={`news-type-badge ${item.news_type?.toLowerCase()}`}>
                {item.news_type === 'PLATFORM' ? '📢 Платформа' : '🏢 Бизнес'}
              </span>
              <span className="news-date">{new Date(item.created_at).toLocaleDateString()}</span>
            </div>

            <h1 className="news-main-title">{item.title}</h1>

            {/* Теги под заголовком */}
            {item.tags && item.tags.length > 0 && (
              <div className="news-detail-tags">
                {item.tags.map((tag, idx) => (
                  <span key={idx} className="news-detail-tag">#{tag}</span>
                ))}
              </div>
            )}
          </header>

          {/* Главное изображение */}
          {item.media_display && (
            <div className="news-main-image">
              <img src={item.media_display} alt={item.title} />
            </div>
          )}

          {/* Контент */}
          <div className="news-content-body">
            {item.text}
          </div>

          {/* Футер статьи */}
          <footer className="news-article-footer">
            <div className="news-author-info">
              <div className="author-avatar">
                {item.business_name?.[0] || 'A'}
              </div>
              <div>
                <p className="author-label">Опубликовано</p>
                <p className="author-name">{item.business_name || 'Администрация'}</p>
              </div>
            </div>

            <div className="news-stats">
              <div className="stat-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                {item.views_count || 0} просмотров
              </div>
            </div>
          </footer>
        </article>
      </main>

      <Footer />
    </div>
  );
}