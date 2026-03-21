import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { ViewedProvider } from './context/ViewedContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'
import MessengerPage from './pages/MessengerPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import MyProfilePage from './pages/MyProfilePage'
import VerificationPage from './pages/VerificationPage'
import BusinessPage from './pages/BusinessPage'
import FeedPage from './pages/FeedPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import QRLoginPage from './pages/QRLoginPage'

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
            <Routes>
              <Route path="/"               element={<HomePage />} />
              <Route path="/feed"           element={<FeedPage />} />
              <Route path="/profile/:id"    element={<ProfilePage />} />
              <Route path="/business/:id"   element={<BusinessPage />} />
              <Route path="/login"          element={<LoginPage />} />
              <Route path="/register"       element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/qr-login"       element={<QRLoginPage />} />
              <Route path="/verification"   element={<VerificationPage />} />
              <Route path="/messenger" element={<PrivateRoute><MessengerPage /></PrivateRoute>} />
              <Route path="/me"        element={<PrivateRoute><MyProfilePage /></PrivateRoute>} />
            </Routes>
          </ViewedProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
