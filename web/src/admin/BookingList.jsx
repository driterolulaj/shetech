import { useMemo } from 'react'
import { Loader2, X } from 'lucide-react'
import { cn } from '../lib/cn'
import { STATUS, bookingDays, formatDateTime, formatDayKey, timeAgo } from './format'

const TABS = [
  { id: 'new', label: 'Requested', empty: 'No open requests. New call requests from the website land here.' },
  { id: 'confirmed', label: 'Confirmed', empty: 'Nothing scheduled yet. Confirm a request to put it on the calendar.' },
  { id: 'completed', label: 'Completed', empty: 'No completed calls yet.' },
  { id: 'cancelled', label: 'Cancelled', empty: 'No cancelled bookings.' },
  { id: 'all', label: 'All', empty: 'No bookings yet. They appear here as soon as someone requests a call on the website.' },
]

const newestFirst = (a, b) => b.createdAt.localeCompare(a.createdAt)
const soonestFirst = (a, b) => (a.scheduledAt ?? '').localeCompare(b.scheduledAt ?? '')

/** When the call is (or could be), in one line. */
function whenText(booking) {
  if (booking.scheduledAt) return `${formatDateTime(booking.scheduledAt)} · ${booking.durationMin} min`
  const days = booking.preferredDays || (booking.preferredDates ?? []).map(formatDayKey).join(', ')
  return [days || 'Any day', booking.preferredTime].filter(Boolean).join(' · ')
}

export function BookingList({ bookings, filter, onFilter, selectedDay, onClearDay, selectedId, onSelect }) {
  const counts = useMemo(() => {
    const result = { all: bookings?.length ?? 0 }
    for (const b of bookings ?? []) result[b.status] = (result[b.status] ?? 0) + 1
    return result
  }, [bookings])

  const rows = useMemo(() => {
    if (!bookings) return []
    if (selectedDay) return bookings.filter((b) => bookingDays(b).includes(selectedDay)).sort(soonestFirst)
    const list = filter === 'all' ? [...bookings] : bookings.filter((b) => b.status === filter)
    return list.sort(filter === 'confirmed' ? soonestFirst : newestFirst)
  }, [bookings, filter, selectedDay])

  return (
    <section aria-label="Bookings" className="rounded-sm border border-line bg-surface">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-2">
        {selectedDay ? (
          <div className="flex h-9 items-center gap-2">
            <p className="text-sm font-medium text-ink">On {formatDayKey(selectedDay)}</p>
            <button
              type="button"
              onClick={onClearDay}
              className="inline-flex h-7 items-center gap-1 rounded-sm border border-line-strong px-2 text-xs text-ink-2 hover:border-accent hover:text-accent"
            >
              <X className="size-3" strokeWidth={2} /> Clear day
            </button>
          </div>
        ) : (
          <div role="tablist" aria-label="Filter by status" className="-mx-1 flex flex-wrap">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={filter === tab.id}
                onClick={() => onFilter(tab.id)}
                className={cn(
                  'inline-flex h-9 items-baseline gap-1.5 border-b-2 px-2.5 pt-2 text-sm font-medium transition-colors duration-300 ease-soft',
                  filter === tab.id ? 'border-accent text-ink' : 'border-transparent text-ink-3 hover:text-ink',
                )}
              >
                {tab.label}
                <span className="text-xs tabular-nums text-ink-3">{counts[tab.id] ?? 0}</span>
              </button>
            ))}
          </div>
        )}
      </header>

      {!bookings ? (
        <div className="grid place-items-center py-14">
          <Loader2 className="size-5 animate-spin text-ink-3" strokeWidth={2} />
        </div>
      ) : rows.length === 0 ? (
        <p className="px-4 py-12 text-center text-sm text-ink-3">
          {selectedDay ? 'Nothing on this day.' : TABS.find((t) => t.id === filter).empty}
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {rows.map((b) => (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => onSelect(b.id)}
                aria-current={b.id === selectedId}
                className={cn(
                  'grid w-full gap-x-4 gap-y-1 px-4 py-3.5 text-left transition-colors duration-200 sm:grid-cols-[minmax(0,1fr)_auto]',
                  b.id === selectedId ? 'bg-accent-wash/60' : 'hover:bg-canvas',
                )}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className={cn('size-2 shrink-0 rounded-full', STATUS[b.status].dot)} />
                  <p className="truncate text-[15px] font-medium text-ink">
                    {b.name}
                    {b.company && <span className="font-normal text-ink-3"> · {b.company}</span>}
                  </p>
                </div>
                <p className="text-xs text-ink-3 sm:row-span-2 sm:self-center sm:text-right">
                  <span className={cn('inline-flex rounded-sm px-1.5 py-0.5 font-medium', STATUS[b.status].badge)}>{STATUS[b.status].label}</span>
                  <span className="mt-1 block">{timeAgo(b.createdAt)}</span>
                </p>
                <p className="truncate pl-[18px] text-sm text-ink-2">
                  {whenText(b)}
                  {b.interest && b.interest !== 'Not sure yet' && <span className="text-ink-3"> · {b.interest}</span>}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
