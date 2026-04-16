import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';
import { API_URL } from '../config/api';
import './NewsDetailPage.css';

export default function NewsDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch(`${API_URL}/news/${id}/`);
        if (!res.ok) throw new Error('Error');
        const data = await res.json();
        setItem(data);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    void fetchNews();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) return <div className="news-loading">{t('loading')}</div>;
  if (!item) return <div className="news-error">{t('news_notFound')}</div>;

  const getTimeAgo = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return t('justNow');
    if (diff < 3600) return `${Math.floor(diff / 60)} ${t('minAgo')}`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ${t('hAgo')}`;
    return `${Math.floor(diff / 86400)} ${t('dAgo')}`;
  };

  return (
    <div className="news-page">
      <Header />

      <main className="news-container">
        <button onClick={() => navigate(-1)} className="news-back-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          {t('news_backFeed')}
        </button>

        <article className="news-article">
          <header className="news-header">
            <div className="news-meta-top">
              <span className={`news-type-badge ${item.news_type?.toLowerCase()}`}>
                {item.news_type === 'PLATFORM' ? `📢 ${t('platform')}` : `🏢 ${t('news_business')}`}
              </span>
              <span className="news-date">{new Date(item.created_at).toLocaleDateString()}</span>
            </div>

            <h1 className="news-main-title">{item.title}</h1>

            {item.tags && item.tags.length > 0 && (
              <div className="news-detail-tags">
                {item.tags.map((tag, idx) => (
                  <span key={idx} className="news-detail-tag">#{tag}</span>
                ))}
              </div>
            )}
          </header>

          {item.media_display && (
            <div className="news-main-image">
              <img src={item.media_display} alt={item.title} />
            </div>
          )}

          <div className="news-content-body">
            {item.text}
          </div>

          <footer className="news-article-footer">
            <div className="news-author-info">
              <div className="author-avatar">
                {item.business_name?.[0] || 'A'}
              </div>
              <div>
                <p className="author-label">{t('published')}</p>
                <p className="author-name">{item.business_name || t('administration')}</p>
              </div>
            </div>

            <div className="news-stats">
              <div className="stat-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                {item.views_count || 0} {t('views')}
              </div>
            </div>
          </footer>
        </article>
      </main>

      <Footer />
    </div>
  );
}
