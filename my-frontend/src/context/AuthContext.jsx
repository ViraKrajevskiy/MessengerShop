import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('auth_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (user) localStorage.setItem('auth_user', JSON.stringify(user))
    else localStorage.removeItem('auth_user')
  }, [user])

  // Mock registered users DB (в реальном проекте — запрос к серверу)
  const login = (email, password) => {
    const users = JSON.parse(localStorage.getItem('registered_users') || '[]')
    const found = users.find(u => u.email === email && u.password === password)
    if (found) {
      const { password: _, ...safeUser } = found
      setUser(safeUser)
      return { ok: true }
    }
    return { ok: false, error: 'Неверный email или пароль' }
  }

  const register = (data) => {
    const users = JSON.parse(localStorage.getItem('registered_users') || '[]')
    if (users.find(u => u.email === data.email)) {
      return { ok: false, error: 'Пользователь с таким email уже существует' }
    }
    const newUser = {
      id: Date.now(),
      name: data.name,
      email: data.email,
      password: data.password,
      city: data.city,
      category: data.category,
      avatar: `https://i.pravatar.cc/150?u=${data.email}`,
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem('registered_users', JSON.stringify([...users, newUser]))
    const { password: _, ...safeUser } = newUser
    setUser(safeUser)
    return { ok: true }
  }

  const logout = () => setUser(null)

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
