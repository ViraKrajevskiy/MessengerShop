// Единый бейдж верификации — синяя «звезда-печать» с галочкой внутри.
// Используется во всех местах, где раньше был свой inline-SVG значок.
//   size      — размер в px (по умолчанию 16)
//   color     — цвет заливки (по умолчанию #2196f3; для значков на цветном фоне — #fff)
//   className — для позиционирования/размера из CSS (если задан размер в CSS — он победит)
//   title     — подпись для тултипа и доступности
const VERIFIED_PATH =
  'M12 2L9.19 4.09 5.5 3.82 4.41 7.41 1.42 9.72 2.83 13.21 1.42 16.71 4.41 19 5.5 22.59 9.19 22.32 12 24.41 14.81 22.32 18.5 22.59 19.59 19 22.58 16.71 21.17 13.21 22.58 9.72 19.59 7.41 18.5 3.82 14.81 4.09 12 2ZM10.09 16.72L7.29 13.91 8.71 12.5 10.09 13.88 15.34 8.63 16.76 10.05 10.09 16.72Z'

export default function VerifiedBadge({ size = 16, color = '#2196f3', className, title, style }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      role="img"
      aria-label={title || 'Верифицирован'}
      style={style}
    >
      {title ? <title>{title}</title> : null}
      <path d={VERIFIED_PATH} />
    </svg>
  )
}
