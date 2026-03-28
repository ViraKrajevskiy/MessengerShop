import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { ViewedProvider } from './context/ViewedContext'
import { AuthProvider, useAuth } from './context/AuthContext'

/* ─── Lazy-loaded pages (code splitting) ─── */
const HomePage              = lazy(() => import('./pages/HomePage'))
const FeedPage              = lazy(() => import('./pages/FeedPage'))
const ProfilePage           = lazy(() => import('./pages/ProfilePage'))
const BusinessPage          = lazy(() => import('./pages/BusinessPage'))
const LoginPage             = lazy(() => import('./pages/LoginPage'))
const RegisterPage          = lazy(() => import('./pages/RegisterPage'))
const ForgotPasswordPage    = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage     = lazy(() => import('./pages/ResetPasswordPage'))
const VerificationPage      = lazy(() => import('./pages/VerificationPage'))
const MessengerPage         = lazy(() => import('./pages/MessengerPage'))
const MyProfilePage         = lazy(() => import('./pages/MyProfilePage'))
const BusinessDashboardPage = lazy(() => import('./pages/BusinessDashboardPage'))
const NewsDetailPage        = lazy(() => import('./pages/NewsDetailPage'))
const ProductDetailPage     = lazy(() => import('./pages/ProductDetailPage'))
const PricingPage           = lazy(() => import('./pages/PricingPage'))

/* ─── Skeleton loader для Suspense ─── */
function PageFallback() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '60vh',
      color: 'var(--text-muted, #888)',
      fontSize: 15,
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 36, height: 36,
          border: '3px solid var(--border-color, #333)',
          borderTopColor: 'var(--accent-1, #e53935)',
          borderRadius: '50%',
          animation: 'spin .7s linear infinite',
          margin: '0 auto 12px',
        }} />
        Загрузка…
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function PrivateRoute({ children }) {
  const { user, tokens, loading } = useAuth()
  if (loading) return null
  return (user && tokens?.access) ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ViewedProvider>
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/"               element={<HomePage />} />
                <Route path="/feed"           element={<FeedPage />} />
                <Route path="/profile/:id"    element={<ProfilePage />} />
                <Route path="/business/:id"   element={<BusinessPage />} />
                <Route path="/login"          element={<LoginPage />} />
                <Route path="/register"       element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/verification"   element={<VerificationPage />} />
                <Route path="/messenger" element={<PrivateRoute><MessengerPage /></PrivateRoute>} />
                <Route path="/me"        element={<PrivateRoute><MyProfilePage /></PrivateRoute>} />
                <Route path="/dashboard" element={<PrivateRoute><BusinessDashboardPage /></PrivateRoute>} />
                <Route path="/news/:id" element={<NewsDetailPage />} />
                <Route path="/product/:id" element={<ProductDetailPage />} />
                <Route path="/pricing" element={<PricingPage />} />
              </Routes>
            </Suspense>
          </ViewedProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
