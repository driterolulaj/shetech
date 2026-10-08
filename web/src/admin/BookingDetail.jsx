import { useState } from 'react'
import { AlertCircle, CalendarCheck, CheckCircle2, Loader2, RotateCcw, Trash2, Video, X } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { CopyButton } from '../components/ui/CopyButton'
import { Field, Input, Select, Textarea } from '../components/ui/Field'
import { cn } from '../lib/cn'
import { api } from './api'
import { STATUS, browserTimeZone, formatDateTime, formatDayKey, suggestedSlot, toLocalInput } from './format'

const DURATIONS = [15, 30, 45, 60, 90]

function Label({ children }) {
  return <h3 className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3">{children}</h3>
}

function Row({ term, children }) {
  if (!children) return null
  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 py-2.5 text-sm">
      <dt className="text-ink-3">{term}</dt>
      <dd className="min-w-0 break-words text-ink">{children}</dd>
    </div>
  )
}

function Check({ checked, onChange, children }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink-2">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 size-4 accent-[var(--accent)]" />
      {children}
    </label>
  )
}

/** Everything about one booking: the client, their request, scheduling and actions. */
export function BookingDetail({ booking, onChange, onDeleted, onClose, onUnauthorized }) {
  const [slot, setSlot] = useState(() => toLocalInput(suggestedSlot(booking)))
  const [duration, setDuration] = useState(String(booking.durationMin ?? 30))
  const [link, setLink] = useState(booking.meetingLink ?? '')
  const [notify, setNotify] = useState(true)
  const [notifyCancel, setNotifyCancel] = useState(true)
  const [notes, setNotes] = useState(booking.notes ?? '')
  const [busy, setBusy] = useState('')
  const [feedback, setFeedback] = useState(null) // { tone: 'ok' | 'warn' | 'error', text }
  const [confirmDelete, setConfirmDelete] = useState(false)

  const status = STATUS[booking.status]
  const myZone = browserTimeZone()
  const clientZone = booking.timezone
  const otherZone = clientZone && clientZone !== myZone
  const open = booking.status === 'new' || booking.status === 'confirmed'

  const run = async (name, body, success) => {
    setBusy(name)
    setFeedback(null)
    try {
      const result = await api.update(booking.id, body)
      onChange(result.booking)
      setFeedback(result.emailError ? { tone: 'warn', text: result.emailError } : success && { tone: 'ok', text: success })
    } catch (err) {
      if (err.status === 401) return onUnauthorized()
      setFeedback({ tone: 'error', text: err.message })
    } finally {
      setBusy('')
    }
  }

  const confirm = (e) => {
    e.preventDefault()
    const scheduledAt = new Date(slot)
    if (Number.isNaN(scheduledAt.getTime())) return setFeedback({ tone: 'error', text: 'Pick a date and time.' })
    run(
      'confirm',
      { action: 'confirm', scheduledAt: scheduledAt.toISOString(), durationMin: Number(duration), meetingLink: link, notify },
      notify ? `Confirmed. Invite sent to ${booking.email}.` : 'Confirmed.',
    )
  }

  const remove = async () => {
    setBusy('delete')
    try {
      await api.remove(booking.id)
      onDeleted(booking.id)
    } catch (err) {
      if (err.status === 401) return onUnauthorized()
      setFeedback({ tone: 'error', text: err.message })
      setBusy('')
    }
  }

  const preferredDays = booking.preferredDays || (booking.preferredDates ?? []).map(formatDayKey).join(', ')
  const slotDate = new Date(slot)

  return (
    <article className="rounded-sm border border-line bg-surface">
      <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <span className={cn('inline-flex rounded-sm px-1.5 py-0.5 text-[11px] font-medium', status.badge)}>{status.label}</span>
          <h2 className="mt-2 truncate text-2xl font-light tracking-tighter text-ink">{booking.name}</h2>
          {booking.company && <p className="text-sm text-ink-2">{booking.company}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid size-8 shrink-0 place-items-center rounded-sm text-ink-3 transition-colors hover:text-ink"
        >
          <X className="size-4" strokeWidth={1.75} />
        </button>
      </header>

      <div className="space-y-7 px-5 py-5">
        {feedback && (
          <p
            role="status"
            className={cn(
              'flex gap-2.5 rounded-sm px-3 py-2.5 text-sm',
              feedback.tone === 'ok' && 'bg-success-wash text-success',
              feedback.tone === 'warn' && 'bg-warn-wash text-warn',
              feedback.tone === 'error' && 'bg-danger-wash text-danger',
            )}
          >
            {feedback.tone === 'ok' ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" strokeWidth={2} /> : <AlertCircle className="mt-0.5 size-4 shrink-0" strokeWidth={2} />}
            {feedback.text}
          </p>
        )}

        {booking.status === 'confirmed' && booking.scheduledAt && (
          <div className="rounded-sm border border-accent/30 bg-accent-wash/60 px-4 py-3">
            <p className="flex items-center gap-2 text-[15px] font-medium text-ink">
              <CalendarCheck className="size-4 text-accent" strokeWidth={1.75} />
              {formatDateTime(booking.scheduledAt)} · {booking.durationMin} min
            </p>
            {otherZone && <p className="mt-0.5 pl-6 text-[13px] text-ink-2">{formatDateTime(booking.scheduledAt, clientZone)} for the client ({clientZone})</p>}
            {booking.meetingLink && (
              <a href={booking.meetingLink} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1.5 pl-6 text-[13px] font-medium text-accent hover:text-ink">
                <Video className="size-3.5" strokeWidth={1.75} /> Join the call
              </a>
            )}
          </div>
        )}

        <section>
          <Label>Client</Label>
          <dl className="mt-2 divide-y divide-line border-y border-line">
            <Row term="Email">
              <span className="flex flex-wrap items-center justify-between gap-2">
                <a href={`mailto:${booking.email}`} className="truncate text-accent hover:text-ink">
                  {booking.email}
                </a>
                <CopyButton value={booking.email} label="Copy" />
              </span>
            </Row>
            <Row term="Company">{booking.company}</Row>
            <Row term="Interested in">{booking.interest}</Row>
            <Row term="About project">{booking.project}</Row>
            <Row term="Time zone">{clientZone}</Row>
            <Row term="Requested">{formatDateTime(booking.createdAt)}</Row>
          </dl>
        </section>

        <section>
          <Label>Their request</Label>
          <dl className="mt-2 divide-y divide-line border-y border-line">
            <Row term="Preferred days">{preferredDays || 'Any day'}</Row>
            <Row term="Best time">{booking.preferredTime || 'Flexible'}</Row>
          </dl>
          <div className="mt-3 rounded-sm bg-canvas px-3.5 py-3 text-sm leading-6 whitespace-pre-wrap text-ink-2">
            {booking.note || <span className="text-ink-3">No message.</span>}
          </div>
        </section>

        {open && (
          <form onSubmit={confirm} className="space-y-4">
            <Label>{booking.status === 'confirmed' ? 'Reschedule' : 'Schedule the call'}</Label>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_7rem]">
              <Field label="Date and time" htmlFor="slot" hint={otherZone && !Number.isNaN(slotDate.getTime()) ? `${formatDateTime(slotDate.toISOString(), clientZone)} for the client` : undefined}>
                <Input id="slot" type="datetime-local" value={slot} onChange={(e) => setSlot(e.target.value)} required />
              </Field>
              <Field label="Length" htmlFor="duration">
                <Select id="duration" value={duration} onChange={(e) => setDuration(e.target.value)}>
                  {DURATIONS.map((m) => (
                    <option key={m} value={m}>
                      {m} min
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Meeting link" htmlFor="link" optional>
              <Input id="link" type="url" placeholder="https://meet.google.com/…" value={link} onChange={(e) => setLink(e.target.value)} />
            </Field>
            <Check checked={notify} onChange={setNotify}>
              Email {booking.name.split(' ')[0]} a confirmation with a calendar invite
            </Check>
            <Button type="submit" size="lg" className="w-full" disabled={Boolean(busy)}>
              {busy === 'confirm' ? <Loader2 className="size-4 animate-spin" strokeWidth={2} /> : <CalendarCheck className="size-4" strokeWidth={1.75} />}
              {booking.status === 'confirmed' ? 'Update booking' : 'Confirm booking'}
            </Button>
          </form>
        )}

        <section className="space-y-3">
          <Label>Actions</Label>
          <div className="flex flex-wrap gap-2">
            {booking.status === 'confirmed' && (
              <Button variant="outline" disabled={Boolean(busy)} onClick={() => run('complete', { action: 'complete' }, 'Marked as completed.')}>
                <CheckCircle2 className="size-4" strokeWidth={1.75} /> Mark completed
              </Button>
            )}
            {(booking.status === 'cancelled' || booking.status === 'completed') && (
              <Button variant="outline" disabled={Boolean(busy)} onClick={() => run('reopen', { action: 'reopen' }, 'Reopened as a request.')}>
                <RotateCcw className="size-4" strokeWidth={1.75} /> Reopen
              </Button>
            )}
            {open && (
              <Button
                variant="outline"
                disabled={Boolean(busy)}
                className="hover:border-danger hover:text-danger"
                onClick={() =>
                  run('cancel', { action: 'cancel', notify: notifyCancel }, notifyCancel ? `Cancelled. ${booking.email} has been told.` : 'Cancelled.')
                }
              >
                {busy === 'cancel' ? <Loader2 className="size-4 animate-spin" strokeWidth={2} /> : <X className="size-4" strokeWidth={1.75} />}
                {booking.status === 'confirmed' ? 'Cancel call' : 'Decline'}
              </Button>
            )}
          </div>
          {open && (
            <Check checked={notifyCancel} onChange={setNotifyCancel}>
              Let the client know by email if I cancel or decline
            </Check>
          )}
        </section>

        <section className="space-y-2">
          <Label>Internal notes</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Only visible here." className="min-h-24 text-sm" />
          <div className="flex justify-end">
            <Button size="sm" variant="outline" disabled={notes === (booking.notes ?? '') || Boolean(busy)} onClick={() => run('notes', { action: 'notes', notes }, 'Notes saved.')}>
              Save notes
            </Button>
          </div>
        </section>

        {booking.history?.length > 0 && (
          <section>
            <Label>History</Label>
            <ol className="mt-3 space-y-2.5 border-l border-line pl-4">
              {[...booking.history].reverse().map((entry, i) => (
                <li key={`${entry.at}-${i}`} className="relative text-sm">
                  <span className="absolute -left-[19.5px] top-1.5 size-2 rounded-full bg-line-strong ring-2 ring-surface" />
                  <p className="text-ink-2">{entry.text}</p>
                  <p className="text-xs text-ink-3">{formatDateTime(entry.at)}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
          {confirmDelete ? (
            <>
              <span className="mr-auto text-sm text-ink-2">Delete this booking for good?</span>
              <Button size="sm" variant="outline" onClick={() => setConfirmDelete(false)}>
                Keep
              </Button>
              <Button size="sm" className="bg-danger hover:bg-danger" disabled={busy === 'delete'} onClick={remove}>
                Delete
              </Button>
            </>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-1.5 text-[13px] text-ink-3 transition-colors hover:text-danger">
              <Trash2 className="size-3.5" strokeWidth={1.75} /> Delete booking
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
