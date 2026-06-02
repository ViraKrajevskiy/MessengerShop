import { API_URL as BASE } from '../config/api'

// Single source of truth for "favourite businesses".
// localStorage gives instant UI + offline; the backend keeps it synced across devices.

const FAVS_KEY = 'biz_favorites'
const EVENT = 'favorites-changed'

export function getLocalFavorites() {
  try { return JSON.parse(localStorage.getItem(FAVS_KEY) || '[]') } catch { return [] }
}

function setLocalFavorites(ids) {
  localStorage.setItem(FAVS_KEY, JSON.stringify(ids))
  // Notify listeners in the same tab (the native 'storage' event only fires in other tabs)
  window.dispatchEvent(new CustomEvent(EVENT, { detail: ids }))
}

export function isFavorite(id) {
  return getLocalFavorites().includes(id)
}

/**
 * Force the local mirror to a known state WITHOUT a server round-trip.
 * Used to reconcile the cache with the server's authoritative `is_favorited`
 * on load — otherwise a stale localStorage entry keeps a card showing
 * "favourited" across reloads even after the server recorded an un-favourite.
 * No-ops (and fires no event) when already in the desired state.
 */
export function setFavorite(id, desired) {
  const cur = getLocalFavorites()
  const has = cur.includes(id)
  if (desired && !has) setLocalFavorites([...cur, id])
  else if (!desired && has) setLocalFavorites(cur.filter(x => x !== id))
}

/** Subscribe to favourite changes (same-tab custom event + cross-tab storage). Returns an unsubscribe fn. */
export function onFavoritesChange(handler) {
  const onLocal = () => handler(getLocalFavorites())
  const onStorage = (e) => { if (e.key === FAVS_KEY) handler(getLocalFavorites()) }
  window.addEventListener(EVENT, onLocal)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(EVENT, onLocal)
    window.removeEventListener('storage', onStorage)
  }
}

/**
 * Toggle locally (instant) and best-effort sync to the backend.
 * `tokenOrGetter` may be a token string OR an async function returning one —
 * passing the getter keeps the local toggle synchronous (instant UI) and defers
 * the (possibly slow) token lookup until after the optimistic update.
 * Returns the new state.
 */
export async function toggleFavorite(id, tokenOrGetter) {
  const cur = getLocalFavorites()
  const wasFav = cur.includes(id)
  const next = wasFav ? cur.filter(x => x !== id) : [...cur, id]
  setLocalFavorites(next)   // мгновенно — UI обновляется в этом же тике
  const token = typeof tokenOrGetter === 'function' ? await tokenOrGetter() : tokenOrGetter
  // Без токена серверный тогл невозможен — откатываем оптимистичное изменение,
  // иначе localStorage разойдётся с сервером и лайк «залипнет» после перезагрузки.
  if (!token) { setLocalFavorites(cur); return wasFav }
  try {
    const res = await fetch(`${BASE}/businesses/${id}/favorite/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error('fail')
    // Сервер — источник истины: приводим локальный стор к его ответу
    // ({favorited: bool}), чтобы состояние всегда совпадало после reload.
    const data = await res.json().catch(() => null)
    if (data && typeof data.favorited === 'boolean') {
      setFavorite(id, data.favorited)
      return data.favorited
    }
    return next.includes(id)
  } catch {
    setLocalFavorites(cur)  // откат при ошибке сети
    return wasFav
  }
}

/** Pull favourites from the server and merge any guest-local ones. Call right after login. */
export async function syncFavoritesFromServer(token) {
  if (!token) return
  let serverIds = []
  try {
    const res = await fetch(`${BASE}/businesses/favorites/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return
    const data = await res.json()
    serverIds = data.ids || []
  } catch { return }

  // Favourites added before login (guest) get pushed up to the account
  const localOnly = getLocalFavorites().filter(id => !serverIds.includes(id))
  await Promise.all(localOnly.map(id =>
    fetch(`${BASE}/businesses/${id}/favorite/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {})
  ))
  setLocalFavorites(Array.from(new Set([...serverIds, ...localOnly])))
}

/** Authoritative list of favourite businesses for the favourites page. Returns { ids, businesses }. */
export async function fetchFavoriteBusinesses(token) {
  const res = await fetch(`${BASE}/businesses/favorites/`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Ошибка загрузки избранного')
  return res.json()
}

/** Wipe local favourites (on logout) so they don't leak to the next account on a shared device. */
export function clearLocalFavorites() {
  setLocalFavorites([])
}
