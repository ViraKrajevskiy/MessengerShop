import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { ViewedProvider } from './context/ViewedContext'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'
import MessengerPage from './pages/MessengerPage'

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ViewedProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/profile/:id" element={<ProfilePage />} />
            <Route path="/messenger" element={<MessengerPage />} />
          </Routes>
        </ViewedProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
