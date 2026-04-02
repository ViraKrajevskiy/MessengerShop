import { useNavigate } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  const navigate = useNavigate()
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer__inner">

        {/* Brand */}
        <div className="footer__brand">
          <div className="footer__logo" onClick={() => navigate('/')}>БизнесТурция</div>
          <p className="footer__tagline">Ваш личный бизнес-партнёр в Турции и&nbsp;СНГ</p>
        </div>

        {/* Nav columns */}
        <div className="footer__col">
          <h4 className="footer__col-title">Навигация</h4>
          <ul className="footer__links">
            <li><span className="footer__link" onClick={() => navigate('/')}>Главная</span></li>
            <li><span className="footer__link" onClick={() => navigate('/messenger')}>Мессенджер</span></li>
            <li><span className="footer__link">VIP объявления</span></li>
            <li><span className="footer__link">Все карточки</span></li>
            <li><span className="footer__link">Социальный клуб</span></li>
          </ul>
        </div>

        <div className="footer__col">
          <h4 className="footer__col-title">Категории</h4>
          <ul className="footer__links">
            <li><span className="footer__link">Красота и уход</span></li>
            <li><span className="footer__link">Здоровье</span></li>
            <li><span className="footer__link">Недвижимость</span></li>
            <li><span className="footer__link">Образование</span></li>
            <li><span className="footer__link">Юридические услуги</span></li>
            <li><span className="footer__link">Финансы</span></li>
          </ul>
        </div>

        <div className="footer__col">
          <h4 className="footer__col-title">Компания</h4>
          <ul className="footer__links">
            <li><span className="footer__link">О нас</span></li>
            <li><span className="footer__link">Реклама</span></li>
            <li><span className="footer__link">Поддержка</span></li>
            <li><span className="footer__link">Правила сайта</span></li>
            <li><span className="footer__link">Конфиденциальность</span></li>
          </ul>
        </div>

        <div className="footer__col">
          <h4 className="footer__col-title">Города</h4>
          <ul className="footer__links">
            <li><span className="footer__link">Стамбул</span></li>
            <li><span className="footer__link">Анкара</span></li>
            <li><span className="footer__link">Анталья</span></li>
            <li><span className="footer__link">Измир</span></li>
            <li><span className="footer__link">Бурса</span></li>
            <li><span className="footer__link">Алматы</span></li>
          </ul>
        </div>

      </div>

      <div className="footer__bottom">
        <span>© {year} БизнесТурция. Все права защищены.</span>
        <span className="footer__bottom-links">
          <span className="footer__link">Политика конфиденциальности</span>
          <span className="footer__divider">·</span>
          <span className="footer__link">Условия использования</span>
        </span>
      </div>
    </footer>
  )
}
