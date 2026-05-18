// Normalize free-form text (descriptions, post bodies) into a clean
// meta-description: collapse whitespace, strip newlines, clamp length.
export function metaText(input, max = 160) {
  if (!input) return ''
  const clean = String(input).replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return clean.slice(0, max - 1).trimEnd() + '…'
}
