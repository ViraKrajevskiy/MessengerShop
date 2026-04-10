import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { ThemeProvider } from './context/ThemeContext'
import { ViewedProvider } from './context/ViewedContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

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
const PricingPage             = lazy(() => import('./pages/PricingPage'))
const CatalogPage             = lazy(() => import('./pages/CatalogPage'))
const ModeratorLoginPage      = lazy(() => import('./pages/ModeratorLoginPage'))
const ModeratorDashboardPage  = lazy(() => import('./pages/ModeratorDashboardPage'))

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

function AppContent() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
        <AuthProvider>
          <ViewedProvider>
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/"               element={<HomePage />} />
                <Route path="/feed"           element={<FeedPage />} />
                <Route path="/profile/:id"    element={<ProfilePage />} />
                <Route path="/business/:id"   element={<BusinessPage />} />
                <Route path="/login"          element={<GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}><LoginPage /></GoogleOAuthProvider>} />
                <Route path="/register"       element={<GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}><RegisterPage /></GoogleOAuthProvider>} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/verification"   element={<VerificationPage />} />
                <Route path="/messenger" element={<PrivateRoute><MessengerPage /></PrivateRoute>} />
                <Route path="/me"        element={<PrivateRoute><MyProfilePage /></PrivateRoute>} />
                <Route path="/dashboard" element={<PrivateRoute><BusinessDashboardPage /></PrivateRoute>} />
                <Route path="/news/:id" element={<NewsDetailPage />} />
                <Route path="/product/:id" element={<ProductDetailPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/catalog" element={<CatalogPage />} />
                <Route path="/vip" element={<Navigate to="/pricing" replace />} />
                <Route path="/moderator/login" element={<ModeratorLoginPage />} />
                <Route path="/moderator" element={<ModeratorDashboardPage />} />
              </Routes>
            </Suspense>
          </ViewedProvider>
        </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

function App() {
  return <AppContent />
}

export default App
