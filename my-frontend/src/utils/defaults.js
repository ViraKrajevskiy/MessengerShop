const COLORS = ['#e53935','#8e24aa','#1e88e5','#00897b','#f4511e','#6d4c41','#546e7a','#43a047','#fb8c00','#c0392b']

export function makeInitialAvatar(name = '') {
  const letter = (name.trim()[0] || '?').toUpperCase()
  const color = COLORS[(name.charCodeAt(0) || 0) % COLORS.length]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="${color}"/><text x="20" y="27" text-anchor="middle" font-size="19" font-weight="700" fill="white" font-family="sans-serif">${letter}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export const DEFAULT_AVATAR = makeInitialAvatar('?')
