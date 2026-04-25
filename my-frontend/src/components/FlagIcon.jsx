// Inline SVG country flags — no external CDN, no network requests.
// Replaces flagcdn.com (which was failing with QUIC timeouts on some networks).

const FLAGS = {
  ru: (
    <svg width="20" height="15" viewBox="0 0 20 15" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="20" height="5" fill="#fff"/>
      <rect y="5" width="20" height="5" fill="#0039A6"/>
      <rect y="10" width="20" height="5" fill="#D52B1E"/>
    </svg>
  ),
  us: (
    <svg width="20" height="15" viewBox="0 0 20 15" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="20" height="15" fill="#B22234"/>
      <g fill="#fff">
        <rect y="1.15" width="20" height="1.15"/>
        <rect y="3.46" width="20" height="1.15"/>
        <rect y="5.77" width="20" height="1.15"/>
        <rect y="8.08" width="20" height="1.15"/>
        <rect y="10.38" width="20" height="1.15"/>
        <rect y="12.69" width="20" height="1.15"/>
      </g>
      <rect width="8" height="8.08" fill="#3C3B6E"/>
    </svg>
  ),
  tr: (
    <svg width="20" height="15" viewBox="0 0 20 15" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="20" height="15" fill="#E30A17"/>
      <circle cx="7" cy="7.5" r="3" fill="#fff"/>
      <circle cx="7.8" cy="7.5" r="2.4" fill="#E30A17"/>
      <polygon
        points="11.4,7.5 10.45,8.16 10.79,7.05 9.86,6.36 11.02,6.34 11.4,5.25 11.78,6.34 12.94,6.36 12.01,7.05 12.35,8.16"
        fill="#fff"
      />
    </svg>
  ),
}

export default function FlagIcon({ code, alt, size = 20 }) {
  const flag = FLAGS[code]
  if (!flag) return null
  const ratio = 15 / 20
  return (
    <span
      className="flag-icon"
      role="img"
      aria-label={alt || code}
      style={{
        display: 'inline-flex',
        width: `${size}px`,
        height: `${Math.round(size * ratio)}px`,
        lineHeight: 0,
      }}
    >
      {flag}
    </span>
  )
}
