import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import './PricingPage.css'

const PLANS = {
  PRO: {
    MONTH:   { price: 5,  perMonth: 5 },
    QUARTER: { price: 12, perMonth: 4 },
    YEAR:    { price: 40, perMonth: 3.3 },
  },
  VIP: {
    MONTH:   { price: 10, perMonth: 10 },
    QUARTER: { price: 25, perMonth: 8.3 },
    YEAR:    { price: 80, perMonth: 6.7 },
  },
}

export default function PricingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()
  const [period, setPeriod] = useState('YEAR')
  const [faqOpen, setFaqOpen] = useState(null)

  const PERIOD_LABELS = {
    MONTH: t('pricing_month'),
    QUARTER: t('pricing_quarter'),
    YEAR: t('pricing_year'),
  }

  const FEATURES = {
    FREE: [
      { text: t('pricing_bizProfile'), yes: true },
      { text: t('pricing_posts'), yes: true },
      { text: t('pricing_products'), yes: true },
      { text: t('pricing_groupChat'), yes: true },
      { text: t('pricing_proBadge'), yes: false },
      { text: t('pricing_priority'), yes: false },
      { text: t('pricing_vipSection'), yes: false },
      { text: t('pricing_goldBorder'), yes: false },
    ],
    PRO: [
      { text: t('pricing_bizProfile'), yes: true },
      { text: t('pricing_posts'), yes: true },
      { text: t('pricing_products'), yes: true },
      { text: t('pricing_groupChat'), yes: true },
      { text: t('pricing_proBadge'), yes: true },
      { text: t('pricing_priority'), yes: true },
      { text: t('pricing_vipSection'), yes: false },
      { text: t('pricing_goldBorder'), yes: false },
    ],
    VIP: [
      { text: t('pricing_bizProfile'), yes: true },
      { text: t('pricing_posts'), yes: true },
      { text: t('pricing_products'), yes: true },
      { text: t('pricing_groupChat'), yes: true },
      { text: t('pricing_proBadge'), yes: true },
      { text: t('pricing_topResults'), yes: true },
      { text: t('pricing_vipSection'), yes: true },
      { text: t('pricing_goldBorder'), yes: true },
    ],
  }

  const FAQS = [
    { q: t('pricing_faq1q'), a: t('pricing_faq1a') },
    { q: t('pricing_faq2q'), a: t('pricing_faq2a') },
    { q: t('pricing_faq3q'), a: t('pricing_faq3a') },
    { q: t('pricing_faq4q'), a: t('pricing_faq4a') },
  ]

  const handleCta = (planType) => {
    if (!user) {
      navigate('/login')
      return
    }
    const planLabel = planType === 'PRO' ? '⚡ Pro' : '⭐ VIP'
    const msg = `${t('pricing_msgTariff')} ${planLabel} — ${PERIOD_LABELS[period]} — $${PLANS[planType][period].price}. ${t('pricing_msgReqs')}`
    navigate('/verification', { state: { pricingMessage: msg } })
  }

  const getSaving = (planType) => {
    const monthly = PLANS[planType].MONTH.price
    const current = PLANS[planType][period]
    if (period === 'MONTH') return null
    const periods = period === 'QUARTER' ? 3 : 12
    const wouldPay = monthly * periods
    const pct = Math.round((1 - current.price / wouldPay) * 100)
    return pct > 0 ? pct : null
  }

  return (
    <div className="pricing">
      <Header />
      <main className="pricing__main">
        <div className="pricing__hero">
          <h1>{t('pricing_title')}</h1>
          <p>{t('pricing_sub')}</p>
        </div>

        {/* Period toggle */}
        <div className="pricing__period">
          {Object.entries(PERIOD_LABELS).map(([key, label]) => (
            <button
              key={key}
              className={`pricing__period-btn${period === key ? ' pricing__period-btn--active' : ''}`}
              onClick={() => setPeriod(key)}
            >
              {label}
              {key === 'YEAR' && <span className="pricing__save-tag">-34%</span>}
            </button>
          ))}
        </div>

        {/* Cards */}
        <div className="pricing__cards">
          {/* Free */}
          <div className="pricing__card pricing__card--free">
            <div className="pricing__card-icon">&#128100;</div>
            <h3 className="pricing__card-name">{t('pricing_free')}</h3>
            <p className="pricing__card-desc">Базовый профиль для старта</p>
            <div className="pricing__price">
              <span className="pricing__price-free">$0</span>
            </div>
            <ul className="pricing__features">
              {FEATURES.FREE.map((f, i) => (
                <li key={i} className="pricing__feature">
                  <span className={`pricing__feature-icon pricing__feature-icon--${f.yes ? 'yes' : 'no'}`}>
                    {f.yes ? '✓' : '✕'}
                  </span>
                  {f.text}
                </li>
              ))}
            </ul>
            <button className="pricing__cta pricing__cta--free">Текущий тариф</button>
          </div>

          {/* Pro */}
          <div className="pricing__card pricing__card--pro">
            <div className="pricing__card-icon">&#9889;</div>
            <h3 className="pricing__card-name">{t('pricing_pro')}</h3>
            <p className="pricing__card-desc">Больше видимости и приоритет</p>
            <div className="pricing__price">
              <span className="pricing__price-current">
                ${PLANS.PRO[period].price}<span>/{PERIOD_LABELS[period]}</span>
              </span>
              {period !== 'MONTH' && (
                <>
                  <span className="pricing__price-old">${PLANS.PRO.MONTH.price * (period === 'QUARTER' ? 3 : 12)}</span>
                  <span className="pricing__price-save">-{getSaving('PRO')}%</span>
                </>
              )}
            </div>
            <ul className="pricing__features">
              {FEATURES.PRO.map((f, i) => (
                <li key={i} className="pricing__feature">
                  <span className={`pricing__feature-icon pricing__feature-icon--${f.yes ? 'yes' : 'no'}`}>
                    {f.yes ? '✓' : '✕'}
                  </span>
                  {f.text}
                </li>
              ))}
            </ul>
            <button className="pricing__cta pricing__cta--pro" onClick={() => handleCta('PRO')}>
              {t('pricing_writeMod')}
            </button>
          </div>

          {/* VIP */}
          <div className="pricing__card pricing__card--vip">
            <div className="pricing__card-icon">&#11088;</div>
            <h3 className="pricing__card-name">{t('pricing_vip')}</h3>
            <p className="pricing__card-desc">Максимальная видимость и престиж</p>
            <div className="pricing__price">
              <span className="pricing__price-current">
                ${PLANS.VIP[period].price}<span>/{PERIOD_LABELS[period]}</span>
              </span>
              {period !== 'MONTH' && (
                <>
                  <span className="pricing__price-old">${PLANS.VIP.MONTH.price * (period === 'QUARTER' ? 3 : 12)}</span>
                  <span className="pricing__price-save">-{getSaving('VIP')}%</span>
                </>
              )}
            </div>
            <ul className="pricing__features">
              {FEATURES.VIP.map((f, i) => (
                <li key={i} className="pricing__feature">
                  <span className={`pricing__feature-icon pricing__feature-icon--${f.yes ? 'yes' : 'no'}`}>
                    {f.yes ? '✓' : '✕'}
                  </span>
                  {f.text}
                </li>
              ))}
            </ul>
            <button className="pricing__cta pricing__cta--vip" onClick={() => handleCta('VIP')}>
              {t('pricing_writeMod')}
            </button>
          </div>
        </div>

        {/* How it works */}
        <div className="pricing__how">
          <h2>Как подключить тариф?</h2>
          <div className="pricing__steps">
            <div className="pricing__step">
              <span className="pricing__step-num">1</span>
              <div className="pricing__step-text">
                <strong>Выберите тариф</strong>
                Определите подходящий план и период
              </div>
            </div>
            <div className="pricing__step">
              <span className="pricing__step-num">2</span>
              <div className="pricing__step-text">
                <strong>{t('pricing_writeMod')}</strong>
                Отправьте запрос и получите реквизиты
              </div>
            </div>
            <div className="pricing__step">
              <span className="pricing__step-num">3</span>
              <div className="pricing__step-text">
                <strong>Отправьте квитанцию</strong>
                Модератор проверит оплату и активирует тариф
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="pricing__faq">
          <h2>Частые вопросы</h2>
          {FAQS.map((f, i) => (
            <div key={i} className="pricing__faq-item">
              <button className="pricing__faq-q" onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                <span>{f.q}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  style={{ transform: faqOpen === i ? 'rotate(180deg)' : '', transition: 'transform .2s', flexShrink: 0 }}>
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
              {faqOpen === i && <p className="pricing__faq-a">{f.a}</p>}
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}
