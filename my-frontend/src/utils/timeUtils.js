export function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'только что'
  if (mins < 60) return `${mins} мин. назад`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ч. назад`
  return `${Math.floor(hours / 24)} дн. назад`
}

export function timeAgoShort(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'сейчас'
  if (mins < 60) return `${mins} мин.`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ч.`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'вчера'
  return `${days} дн.`
}

/** "был в сети" — Telegram-style status text */
export function lastSeenText(dateStr, isOnline = false) {
  if (isOnline) return 'в сети'
  if (!dateStr) return 'не в сети'
  const date = new Date(dateStr)
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'был только что'
  if (mins < 60) return `был ${mins} мин назад`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `был ${hours} ч назад`
  const days = Math.floor(hours / 24)
  if (days === 1) {
    const hh = String(date.getHours()).padStart(2, '0')
    const mm = String(date.getMinutes()).padStart(2, '0')
    return `был вчера в ${hh}:${mm}`
  }
  if (days < 7) return `был ${days} дн назад`
  return `был ${date.toLocaleDateString('ru-RU')}`
}
