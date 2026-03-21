import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './AuthPage.css'

const BASE = 'https://api.101-school.uz/api'

export default function QRLoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const { loginWithData } = useAuth()
  const [status, setStatus] = useState('loading') // loading | ok | error
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) { setStatus('error'); setError('QR-код недействителен'); return }

    fetch(`${BASE}/auth/qr-login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (ok) {
          loginWithData(data)
          setStatus('ok')
          setTimeout(() => navigate('/'), 1200)
        } else {
          setStatus('error')
          setError(data.error || 'Неверный QR-код')
        }
      })
      .catch(() => { setStatus('error'); setError('Нет соединения с сервером') })
  }, [token])

  return (
    <div className="auth-page">
      <div className="auth-page__blob auth-page__blob--1" />
      <div className="auth-page__blob auth-page__blob--2" />
      <div className="auth-page__topbar">
        <div className="auth-page__logo" onClick={() => navigate('/')}>БизнесТурция</div>
      </div>
      <div className="auth-page__center">
        <div className="auth-card" style={{ textAlign: 'center', padding: '40px 32px' }}>
          {status === 'loading' && (
            <>
              <div style={{ fontSize: 52, marginBottom: 16 }}>📷</div>
              <h2 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Входим...</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Проверяем QR-код</p>
              <div className="auth-card__spinner" style={{ margin: '20px auto 0', display: 'block', width: 32, height: 32 }} />
            </>
          )}
          {status === 'ok' && (
            <>
              <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
              <h2 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Вход выполнен!</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Перенаправляем на главную...</p>
            </>
          )}
          {status === 'error' && (
            <>
              <div style={{ fontSize: 52, marginBottom: 16 }}>❌</div>
              <h2 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Ошибка</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>{error}</p>
              <button className="auth-card__submit" onClick={() => navigate('/login')}>
                Войти обычным способом
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
