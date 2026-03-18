import { createContext, useContext, useState, useCallback } from 'react'

const ViewedContext = createContext()

export function ViewedProvider({ children }) {
  const [viewedCards, setViewedCards] = useState([])

  const addViewed = useCallback((card) => {
    setViewedCards((prev) => {
      // Don't duplicate, move to front if already exists
      const filtered = prev.filter((c) => c.id !== card.id || c.type !== card.type)
      return [{ ...card, viewedAt: Date.now() }, ...filtered]
    })
  }, [])

  const clearViewed = useCallback(() => {
    setViewedCards([])
  }, [])

  return (
    <ViewedContext.Provider value={{ viewedCards, addViewed, clearViewed }}>
      {children}
    </ViewedContext.Provider>
  )
}

export function useViewed() {
  const ctx = useContext(ViewedContext)
  if (!ctx) throw new Error('useViewed must be used within ViewedProvider')
  return ctx
}
