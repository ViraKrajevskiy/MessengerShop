import { API_URL as BASE } from '../config/api'

// Generic favourite store for content (posts, news): instant localStorage UI +
// best-effort backend sync so favourites persist across devices.
// Mirrors the businesses favourites util in ./favorites.js.
function createFavoriteStore({ storageKey, toggleUrl, fetchServerIds }) {
  const EVENT = `${storageKey}-changed`

  const getIds = () => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '[]') } catch { return [] }
  }
  const setIds = (ids) => {
    localStorage.setItem(storageKey, JSON.stringify(ids))
    window.dispatchEvent(new CustomEvent(EVENT, { detail: ids }))
  }

  const isFavorite = (id) => getIds().includes(id)

  /** Subscribe to changes (same-tab + cross-tab). Returns unsubscribe fn. */
  const onChange = (handler) => {
    const onLocal = () => handler(getIds())
    const onStorage = (e) => { if (e.key === storageKey) handler(getIds()) }
    window.addEventListener(EVENT, onLocal)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(EVENT, onLocal)
      window.removeEventListener('storage', onStorage)
    }
  }

  /**
   * Toggle locally (instant) + best-effort backend sync. Returns new state.
   * `tokenOrGetter` may be a token string OR an async getter — passing the getter
   * keeps the local toggle synchronous (instant UI) and defers the token lookup.
   */
  const toggle = async (id, tokenOrGetter) => {
    const cur = getIds()
    const next = cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id]
    setIds(next)   // мгновенно — UI обновляется в этом же тике
    const token = typeof tokenOrGetter === 'function' ? await tokenOrGetter() : tokenOrGetter
    if (token) {
      try {
        await fetch(toggleUrl(id), {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch { /* offline — localStorage holds it, re-synced later */ }
    }
    return next.includes(id)
  }

  /** Pull server favourites and push any guest-local ones. Call after login. */
  const syncFromServer = async (token) => {
    if (!token) return
    let serverIds = []
    try { serverIds = await fetchServerIds(token) } catch { return }
    const localOnly = getIds().filter(id => !serverIds.includes(id))
    await Promise.all(localOnly.map(id =>
      fetch(toggleUrl(id), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {})
    ))
    setIds(Array.from(new Set([...serverIds, ...localOnly])))
  }

  const clear = () => setIds([])

  return { getIds, setIds, isFavorite, onChange, toggle, syncFromServer, clear }
}

// ── Posts ──────────────────────────────────────────────────────────────────
export const postFavorites = createFavoriteStore({
  storageKey: 'post_favorites',
  toggleUrl: (id) => `${BASE}/posts/${id}/favorite/`,
  fetchServerIds: async (token) => {
    const res = await fetch(`${BASE}/posts/favorites/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error('fail')
    const data = await res.json()
    return (Array.isArray(data) ? data : []).map(p => p.id)
  },
})

// ── News ───────────────────────────────────────────────────────────────────
export const newsFavorites = createFavoriteStore({
  storageKey: 'news_favorites',
  toggleUrl: (id) => `${BASE}/news/${id}/favorite/`,
  fetchServerIds: async (token) => {
    const res = await fetch(`${BASE}/news/favorites/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error('fail')
    const data = await res.json()
    return data.ids || []
  },
})

// ── List fetchers for the favourites page ────────────────────────────────────
export async function fetchFavoritePosts(token) {
  const res = await fetch(`${BASE}/posts/favorites/`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Ошибка загрузки избранных постов')
  return res.json()  // массив постов
}

export async function fetchFavoriteNews(token) {
  const res = await fetch(`${BASE}/news/favorites/`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Ошибка загрузки избранных новостей')
  const data = await res.json()
  return data.news || []  // массив новостей
}

/** Удалить из избранного локально + на сервере (для кнопки «удалить» в избранном). */
export function clearAllPostFavorites() { postFavorites.clear() }
export function clearAllNewsFavorites() { newsFavorites.clear() }
