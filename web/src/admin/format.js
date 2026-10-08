/** Status labels and colours, shared by the list, calendar and detail panel. */
export const STATUS = {
  new: { label: 'Requested', badge: 'bg-warn-wash text-warn', dot: 'bg-warn' },
  confirmed: { label: 'Confirmed', badge: 'bg-accent-wash text-accent', dot: 'bg-accent' },
  completed: { label: 'Completed', badge: 'bg-success-wash text-success', dot: 'bg-success' },
  cancelled: { label: 'Cancelled', badge: 'bg-danger-wash text-danger', dot: 'bg-danger' },
}

const pad = (n) => String(n).padStart(2, '0')

/** Local calendar day as 'YYYY-MM-DD'. */
export const dayKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

/** 'YYYY-MM-DD' → local Date at midnight. */
export const fromDayKey = (key) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Value for <input type="datetime-local"> in the browser's time zone. */
export const toLocalInput = (date) => `${dayKey(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`

const fmt = (options, timeZone) => {
  try {
    return new Intl.DateTimeFormat(undefined, { ...options, timeZone })
  } catch {
    return new Intl.DateTimeFormat(undefined, options) // unknown time zone typed by the visitor
  }
}

export const formatTime = (iso, timeZone) => fmt({ hour: '2-digit', minute: '2-digit' }, timeZone).format(new Date(iso))
export const formatDate = (iso) => fmt({ weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(iso))
export const formatDateTime = (iso, timeZone) =>
  fmt({ weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }, timeZone).format(new Date(iso))
export const formatDayKey = (key) => fmt({ weekday: 'short', day: 'numeric', month: 'short' }).format(fromDayKey(key))

export const browserTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || ''
  } catch {
    return ''
  }
}

/** "3 min ago", "yesterday", "12 Oct". */
export function timeAgo(iso) {
  const seconds = (Date.now() - new Date(iso).getTime()) / 1000
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return rtf.format(-Math.round(seconds / 60), 'minute')
  if (seconds < 86_400) return rtf.format(-Math.round(seconds / 3600), 'hour')
  if (seconds < 7 * 86_400) return rtf.format(-Math.round(seconds / 86_400), 'day')
  return formatDate(iso)
}

/** Days a booking occupies on the calendar: its scheduled day, or the preferred days while it's still a request. */
export function bookingDays(booking) {
  if (booking.status === 'cancelled') return []
  if (booking.scheduledAt) return [dayKey(new Date(booking.scheduledAt))]
  return booking.status === 'new' ? booking.preferredDates ?? [] : []
}

/** A sensible starting slot for the scheduler: first preferred day, at the start of the preferred window. */
export function suggestedSlot(booking) {
  if (booking.scheduledAt) return new Date(booking.scheduledAt)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const upcoming = (booking.preferredDates ?? []).map(fromDayKey).find((d) => d >= fromDayKey(dayKey(new Date())))
  const date = upcoming ?? tomorrow
  date.setHours(/afternoon/i.test(booking.preferredTime) ? 14 : 10, 0, 0, 0)
  return date
}
