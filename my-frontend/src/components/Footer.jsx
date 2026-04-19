import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import './Footer.css'

export default function Footer() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const year = new Date().getFullYear()

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
            <li><span className="footer__link">{t('footer_vip')}</span></li>
            <li><span className="footer__link">{t('footer_all')}</span></li>
            <li><span className="footer__link">{t('footer_club')}</span></li>
          </ul>
        </div>

        <div className="footer__col">
          <h4 className="footer__col-title">{t('footer_cats')}</h4>
          <ul className="footer__links">
            <li><span className="footer__link">{t('home_beauty')}</span></li>
            <li><span className="footer__link">{t('cat_health')}</span></li>
            <li><span className="footer__link">{t('cat_realty')}</span></li>
            <li><span className="footer__link">{t('footer_education')}</span></li>
            <li><span className="footer__link">{t('filter_cat_legal')}</span></li>
            <li><span className="footer__link">{t('cat_finance')}</span></li>
          </ul>
        </div>

        <div className="footer__col">
          <h4 className="footer__col-title">{t('footer_company')}</h4>
          <ul className="footer__links">
            <li><span className="footer__link">{t('footer_about')}</span></li>
            <li><span className="footer__link">{t('footer_ads')}</span></li>
            <li><span className="footer__link">{t('footer_support')}</span></li>
            <li><span className="footer__link">{t('footer_rules')}</span></li>
            <li><span className="footer__link">{t('footer_privacy')}</span></li>
          </ul>
        </div>

        <div className="footer__col">
          <h4 className="footer__col-title">{t('footer_cities')}</h4>
          <ul className="footer__links">
            <li><span className="footer__link">{t('city_istanbul')}</span></li>
            <li><span className="footer__link">{t('city_ankara')}</span></li>
            <li><span className="footer__link">{t('city_antalya')}</span></li>
            <li><span className="footer__link">{t('city_izmir')}</span></li>
            <li><span className="footer__link">{t('city_bursa')}</span></li>
            <li><span className="footer__link">{t('city_almaty')}</span></li>
          </ul>
        </div>

      </div>

      <div className="footer__bottom">
        <span>© {year} {t('appName')}. {t('footer_copyright')}</span>
        <span className="footer__bottom-links">
          <span className="footer__link">{t('footer_privacy')}</span>
          <span className="footer__divider">·</span>
          <span className="footer__link">{t('footer_rules')}</span>
        </span>
      </div>
    </footer>
  )
}
