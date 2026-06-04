/**
 * Единая иконка верификации — синий значок с галочкой.
 * Используется везде: PostCard, UserCard, FeedPage, CatalogPage, BusinessPage и т.д.
 *
 * @param {number}  size  — ширина/высота в px (по умолчанию 14)
 * @param {string}  fill  — цвет заливки (по умолчанию #2196f3)
 * @param {string}  className — доп. CSS-класс
 */
export default function VerifiedBadge({ size = 14, fill = '#1d9bf0', className = '', style }) {
  return (
    <svg
      className={className || undefined}
      width={size}
      height={size}
      viewBox="0 0 22 22"
      fill="none"
      style={style}
      aria-label="Verified"
    >
      <circle cx="11" cy="11" r="11" fill={fill} />
      <path d="M6.5 11.5L9.5 14.5L15.5 8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
