import { useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../lib/cn'
import { STATUS, bookingDays, dayKey, formatTime } from './format'

const WEEKDAYS = Array.from({ length: 7 }, (_, i) =>
  new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(new Date(2024, 0, 1 + i)), // 1 Jan 2024 was a Monday
)
const MAX_PILLS = 3

/** Confirmed calls first (by time), then open requests. */
const order = (a, b) => (a.scheduledAt && b.scheduledAt ? a.scheduledAt.localeCompare(b.scheduledAt) : a.scheduledAt ? -1 : b.scheduledAt ? 1 : 0)

function Pill({ booking, selected, onSelect }) {
  const request = !booking.scheduledAt
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onSelect(booking.id)
      }}
      title={request ? `${booking.name}: requested this day` : `${booking.name}: ${formatTime(booking.scheduledAt)}`}
      className={cn(
        'flex w-full items-center gap-1 truncate rounded-[3px] px-1.5 py-0.5 text-left text-[11px] leading-4 transition-[box-shadow] duration-200',
        request ? 'border border-dashed border-warn/50 text-warn' : STATUS[booking.status].badge,
        selected && 'ring-2 ring-accent ring-offset-1 ring-offset-surface',
      )}
    >
      {!request && <span className="shrink-0 font-medium tabular-nums">{formatTime(booking.scheduledAt)}</span>}
      <span className="truncate">{booking.name}</span>
    </button>
  )
}

/**
 * Month view. Confirmed and completed calls sit on their scheduled day; open
 * requests show (dashed) on each day the client said would suit them.
 */
export function Calendar({ month, onMonthChange, bookings, selectedDay, onSelectDay, selectedId, onSelect }) {
  const byDay = useMemo(() => {
    const map = new Map()
    for (const booking of bookings) {
      for (const key of bookingDays(booking)) map.set(key, [...(map.get(key) ?? []), booking])
    }
    for (const list of map.values()) list.sort(order)
    return map
  }, [bookings])

  const days = useMemo(() => {
    const start = new Date(month)
    start.setDate(1 - ((month.getDay() + 6) % 7)) // back to Monday
    return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i))
  }, [month])

  const today = dayKey(new Date())
  const shift = (delta) => onMonthChange(new Date(month.getFullYear(), month.getMonth() + delta, 1))

  return (
    <section aria-label="Calendar" className="rounded-sm border border-line bg-surface">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <h2 className="text-lg font-light tracking-tight text-ink">
          {new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(month)}
        </h2>
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-3 text-xs text-ink-3 md:flex">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-[2px] bg-accent-wash ring-1 ring-accent/40" /> Confirmed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-[2px] border border-dashed border-warn" /> Requested day
            </span>
          </div>
          <div className="flex items-center rounded-sm border border-line-strong">
            <button type="button" onClick={() => shift(-1)} aria-label="Previous month" className="grid size-8 place-items-center text-ink-2 hover:text-accent">
              <ChevronLeft className="size-4" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={() => {
                const now = new Date()
                onMonthChange(new Date(now.getFullYear(), now.getMonth(), 1))
              }}
              className="h-8 border-x border-line-strong px-3 text-[13px] font-medium text-ink hover:text-accent"
            >
              Today
            </button>
            <button type="button" onClick={() => shift(1)} aria-label="Next month" className="grid size-8 place-items-center text-ink-2 hover:text-accent">
              <ChevronRight className="size-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-7 border-b border-line">
        {WEEKDAYS.map((label) => (
          <p key={label} className="px-2 py-2 text-center text-[11px] font-medium uppercase tracking-[0.06em] text-ink-3 sm:text-left">
            {label}
          </p>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((date, i) => {
          const key = dayKey(date)
          const items = byDay.get(key) ?? []
          const outside = date.getMonth() !== month.getMonth()
          const isToday = key === today
          const isSelected = key === selectedDay
          return (
            <div
              key={key}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              aria-label={`${date.toDateString()}${items.length ? `, ${items.length} booking${items.length > 1 ? 's' : ''}` : ''}`}
              onClick={() => onSelectDay(key)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelectDay(key))}
              className={cn(
                'min-h-14 cursor-pointer border-line p-1 text-left outline-none transition-colors duration-200 sm:min-h-24 sm:p-1.5',
                i % 7 !== 6 && 'border-r',
                i < 35 && 'border-b',
                outside && 'bg-canvas/60',
                isSelected ? 'bg-accent-wash/60' : 'hover:bg-canvas',
                'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent',
              )}
            >
              <span
                className={cn(
                  'grid size-6 place-items-center rounded-full text-xs tabular-nums',
                  isToday ? 'bg-accent font-medium text-white' : outside ? 'text-ink-3/60' : 'text-ink-2',
                )}
              >
                {date.getDate()}
              </span>

              {/* Pills from sm up, dots on phones */}
              <div className="mt-1 hidden space-y-0.5 sm:block">
                {items.slice(0, MAX_PILLS).map((b) => (
                  <Pill key={b.id} booking={b} selected={b.id === selectedId} onSelect={onSelect} />
                ))}
                {items.length > MAX_PILLS && <p className="px-1.5 text-[11px] text-ink-3">+{items.length - MAX_PILLS} more</p>}
              </div>
              {items.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-0.5 px-1 sm:hidden">
                  {items.slice(0, 4).map((b) => (
                    <span key={b.id} className={cn('size-1.5 rounded-full', b.scheduledAt ? STATUS[b.status].dot : 'bg-warn/60')} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
