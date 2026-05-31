import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import './Footer.css'

export default function Footer() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const year = new Date().getFullYear()

  // Открыть каталог с предустановленным фильтром по категории / городу
  const goCategory = (cat) => navigate(`/catalog?cat=${cat}`)
  const goCity     = (cityLabel) => navigate(`/catalog?city=${encodeURIComponent(cityLabel)}`)

  return (
    <footer className="footer">
      <div className="footer__inner">

        {/* Brand */}
        <div className="footer__brand">
          <div className="footer__logo" onClick={() => navigate('/')}>{t('appName')}</div>
          <p className="footer__tagline">{t('footer_tagline')}</p>
        </div>

        {/* Nav columns */}
        <div className="footer__col">
          <h4 className="footer__col-title">{t('footer_nav')}</h4>
          <ul className="footer__links">
            <li><span className="footer__link" onClick={() => navigate('/')}>{t('footer_home')}</span></li>
            <li><span className="footer__link" onClick={() => navigate('/messenger')}>{t('footer_messenger')}</span></li>
            <li><span className="footer__link" onClick={() => navigate('/pricing')}>{t('footer_vip')}</span></li>
            <li><span className="footer__link" onClick={() => navigate('/catalog')}>{t('footer_all')}</span></li>
            <li><span className="footer__link" onClick={() => navigate('/feed')}>{t('footer_club')}</span></li>
          </ul>
        </div>

        <div className="footer__col">
          <h4 className="footer__col-title">{t('footer_cats')}</h4>
          <ul className="footer__links">
            <li><span className="footer__link" onClick={() => goCategory('BEAUTY')}>{t('home_beauty')}</span></li>
            <li><span className="footer__link" onClick={() => goCategory('HEALTH')}>{t('cat_health')}</span></li>
            <li><span className="footer__link" onClick={() => goCategory('REALTY')}>{t('cat_realty')}</span></li>
            <li><span className="footer__link" onClick={() => goCategory('EDUCATION')}>{t('footer_education')}</span></li>
            <li><span className="footer__link" onClick={() => goCategory('LEGAL')}>{t('filter_cat_legal')}</span></li>
            <li><span className="footer__link" onClick={() => goCategory('FINANCE')}>{t('cat_finance')}</span></li>
          </ul>
        </div>

        <div className="footer__col">
          <h4 className="footer__col-title">{t('footer_company')}</h4>
          <ul className="footer__links">
            <li><span className="footer__link" onClick={() => navigate('/')}>{t('footer_about')}</span></li>
            <li><span className="footer__link" onClick={() => navigate('/pricing')}>{t('footer_ads')}</span></li>
            <li><span className="footer__link" onClick={() => navigate('/complaint')}>{t('footer_support')}</span></li>
            <li><span className="footer__link" onClick={() => navigate('/')}>{t('footer_rules')}</span></li>
            <li><span className="footer__link" onClick={() => navigate('/')}>{t('footer_privacy')}</span></li>
          </ul>
        </div>

        <div className="footer__col">
          <h4 className="footer__col-title">{t('footer_cities')}</h4>
          <ul className="footer__links">
            <li><span className="footer__link" onClick={() => goCity(t('city_istanbul'))}>{t('city_istanbul')}</span></li>
            <li><span className="footer__link" onClick={() => goCity(t('city_ankara'))}>{t('city_ankara')}</span></li>
            <li><span className="footer__link" onClick={() => goCity(t('city_antalya'))}>{t('city_antalya')}</span></li>
            <li><span className="footer__link" onClick={() => goCity(t('city_izmir'))}>{t('city_izmir')}</span></li>
            <li><span className="footer__link" onClick={() => goCity(t('city_bursa'))}>{t('city_bursa')}</span></li>
            <li><span className="footer__link" onClick={() => goCity(t('city_almaty'))}>{t('city_almaty')}</span></li>
          </ul>
        </div>

      </div>

      <div className="footer__bottom">
        <span>© {year} {t('appName')}. {t('footer_copyright')}</span>
        <span className="footer__bottom-links">
          <span className="footer__link" onClick={() => navigate('/')}>{t('footer_privacy')}</span>
          <span className="footer__divider">·</span>
          <span className="footer__link" onClick={() => navigate('/')}>{t('footer_rules')}</span>
        </span>
      </div>
    </footer>
  )
}
