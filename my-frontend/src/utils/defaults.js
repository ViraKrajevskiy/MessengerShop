const COLORS = ['#e53935','#8e24aa','#1e88e5','#00897b','#f4511e','#6d4c41','#546e7a','#43a047','#fb8c00','#c0392b']

const GRADIENTS = [
  ['#667eea','#764ba2'],
  ['#f093fb','#f5576c'],
  ['#4facfe','#00f2fe'],
  ['#43e97b','#38f9d7'],
  ['#fa709a','#fee140'],
  ['#a18cd1','#fbc2eb'],
  ['#fda085','#f6d365'],
  ['#89f7fe','#66a6ff'],
  ['#e96c6c','#c0392b'],
  ['#9b6dff','#6a3de8'],
]

export function makeInitialAvatar(name = '') {
  const letter = (name.trim()[0] || '?').toUpperCase()
  const color = COLORS[(name.charCodeAt(0) || 0) % COLORS.length]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="${color}"/><text x="20" y="27" text-anchor="middle" font-size="19" font-weight="700" fill="white" font-family="sans-serif">${letter}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/** Плейсхолдер для больших карточек (градиент + первая буква) */
export function makeCardPlaceholder(name = '', seed = 0) {
  const letter = (name.trim()[0] || '?').toUpperCase()
  const [c1, c2] = GRADIENTS[(seed + (name.charCodeAt(0) || 0)) % GRADIENTS.length]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 530"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs><rect width="400" height="530" fill="url(#g)"/><text x="200" y="310" text-anchor="middle" font-size="200" font-weight="800" fill="rgba(255,255,255,0.25)" font-family="sans-serif">${letter}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export const DEFAULT_AVATAR = makeInitialAvatar('?')
