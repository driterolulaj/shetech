import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, CalendarDays, LogOut, Palette, RefreshCw } from 'lucide-react'
import { Logo } from '../components/brand/Logo'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { cn } from '../lib/cn'
import { api } from './api'
import { BookingDetail } from './BookingDetail'
import { BookingList } from './BookingList'
import { Calendar } from './Calendar'
import { bookingDays } from './format'

const REFRESH_MS = 60_000
const readHash = () => window.location.hash.match(/^#booking\/([\w-]+)$/)?.[1] ?? null

function Stat({ label, value, hint, onClick, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-sm border bg-surface px-4 py-3.5 text-left transition-colors duration-300 ease-soft hover:border-line-hover',
        active ? 'border-accent' : 'border-line',
      )}
    >
      <p className="text-[13px] text-ink-3">{label}</p>
      <p className="mt-1 text-3xl font-light tabular-nums tracking-tighter text-ink">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-3">{hint}</p>}
    </button>
  )
}

export function Dashboard({ email, onSignOut, onUnauthorized }) {
  const [bookings, setBookings] = useState(null)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [selectedId, setSelectedId] = useState(readHash)
  const [filter, setFilter] = useState('new')
  const [selectedDay, setSelectedDay] = useState(null)
  const [month, setMonth] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const load = useCallback(async () => {
    setRefreshing(true)
    try {
      setBookings(await api.bookings())
      setError('')
    } catch (err) {
      if (err.status === 401) return onUnauthorized()
      setError(err.message)
    } finally {
      setRefreshing(false)
    }
  }, [onUnauthorized])

  // Initial load, a quiet refresh every minute and whenever the tab regains focus
  useEffect(() => {
    load()
    const timer = window.setInterval(load, REFRESH_MS)
    const onFocus = () => document.visibilityState === 'visible' && load()
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [load])

  // #booking/<id> deep links (used in the notification emails)
  useEffect(() => {
    const onHash = () => setSelectedId(readHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const select = useCallback((id) => {
    setSelectedId(id)
    window.history.replaceState(null, '', id ? `#booking/${id}` : window.location.pathname)
  }, [])

  const selected = bookings?.find((b) => b.id === selectedId) ?? null

  // Jump the calendar to a deep-linked booking once data arrives
  const selectedDayKey = selected ? bookingDays(selected)[0] : null
  useEffect(() => {
    if (!selectedDayKey) return
    const [y, m] = selectedDayKey.split('-').map(Number)
    setMonth(new Date(y, m - 1, 1))
  }, [selectedDayKey])

  const stats = useMemo(() => {
    const list = bookings ?? []
    const now = Date.now()
    const week = now + 7 * 86_400_000
    const upcoming = list.filter((b) => b.status === 'confirmed' && new Date(b.scheduledAt).getTime() >= now)
    return {
      requested: list.filter((b) => b.status === 'new').length,
      upcoming: upcoming.length,
      thisWeek: upcoming.filter((b) => new Date(b.scheduledAt).getTime() < week).length,
      completed: list.filter((b) => b.status === 'completed').length,
    }
  }, [bookings])

  const replace = (updated) => setBookings((list) => list.map((b) => (b.id === updated.id ? updated : b)))
  const showTab = (tab) => {
    setFilter(tab)
    setSelectedDay(null)
  }

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <Logo href="/admin" />
            <span className="hidden h-5 w-px bg-line-strong sm:block" />
            <span className="hidden items-center gap-1.5 text-sm font-medium text-ink sm:inline-flex">
              <CalendarDays className="size-4 text-accent" strokeWidth={1.75} />
              Bookings
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={load}
              aria-label="Refresh"
              title="Refresh"
              className="grid size-9 place-items-center rounded-sm text-ink transition-colors duration-300 ease-soft hover:text-accent"
            >
              <RefreshCw className={cn('size-4', refreshing && 'animate-spin')} strokeWidth={1.75} />
            </button>
            <ThemeToggle />
            <a
              href="/admin/home"
              title="The home page with the colour editor"
              className="hidden h-9 items-center gap-1.5 rounded-sm px-3 text-sm text-ink-2 transition-colors duration-300 ease-soft hover:text-accent sm:inline-flex"
            >
              <Palette className="size-4" strokeWidth={1.75} /> Colours
            </a>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="hidden h-9 items-center gap-1 rounded-sm px-3 text-sm text-ink-2 transition-colors duration-300 ease-soft hover:text-accent sm:inline-flex"
            >
              View site <ArrowUpRight className="size-3.5" strokeWidth={1.75} />
            </a>
            <button
              type="button"
              onClick={onSignOut}
              title={email ? `Signed in as ${email}` : undefined}
              className="inline-flex h-9 items-center gap-1.5 rounded-sm px-3 text-sm text-ink-2 transition-colors duration-300 ease-soft hover:text-accent"
            >
              <LogOut className="size-4" strokeWidth={1.75} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1280px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="min-w-0 space-y-6">
          {error && (
            <p role="alert" className="rounded-sm border border-danger/30 bg-danger-wash px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Requested" value={stats.requested} hint="Waiting for a time" onClick={() => showTab('new')} active={filter === 'new' && !selectedDay} />
            <Stat label="Upcoming" value={stats.upcoming} hint={`${stats.thisWeek} in the next 7 days`} onClick={() => showTab('confirmed')} active={filter === 'confirmed' && !selectedDay} />
            <Stat label="Completed" value={stats.completed} onClick={() => showTab('completed')} active={filter === 'completed' && !selectedDay} />
            <Stat label="All bookings" value={bookings?.length ?? 0} onClick={() => showTab('all')} active={filter === 'all' && !selectedDay} />
          </div>

          <Calendar
            month={month}
            onMonthChange={setMonth}
            bookings={bookings ?? []}
            selectedDay={selectedDay}
            onSelectDay={(key) => setSelectedDay((current) => (current === key ? null : key))}
            selectedId={selectedId}
            onSelect={select}
          />

          <BookingList
            bookings={bookings}
            filter={filter}
            onFilter={showTab}
            selectedDay={selectedDay}
            onClearDay={() => setSelectedDay(null)}
            selectedId={selectedId}
            onSelect={select}
          />
        </div>

        {/* Side panel on desktop; full-screen sheet on small screens */}
        <aside
          className={cn(
            'lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:self-start lg:overflow-y-auto',
            selected ? 'max-lg:fixed max-lg:inset-0 max-lg:z-30 max-lg:overflow-y-auto max-lg:bg-canvas max-lg:p-4 sm:max-lg:p-6' : 'max-lg:hidden',
          )}
        >
          {selected ? (
            <BookingDetail
              key={selected.id}
              booking={selected}
              onChange={replace}
              onDeleted={(id) => {
                setBookings((list) => list.filter((b) => b.id !== id))
                select(null)
              }}
              onClose={() => select(null)}
              onUnauthorized={onUnauthorized}
            />
          ) : (
            <div className="grid place-items-center rounded-sm border border-dashed border-line-strong px-6 py-16 text-center">
              <CalendarDays className="size-6 text-ink-3" strokeWidth={1.5} />
              <p className="mt-3 text-sm font-medium text-ink">No booking selected</p>
              <p className="mt-1 max-w-56 text-sm text-ink-3">Pick one from the calendar or the list to see the client and schedule the call.</p>
            </div>
          )}
        </aside>
      </main>
    </div>
  )
}
