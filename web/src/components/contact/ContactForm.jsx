import { useId, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2, Mail } from 'lucide-react'
import { SITE } from '../../config/site'
import { SERVICES } from '../../content/services'
import { buildMessage, mailtoHref, submitContact, subjectFor, upcomingWeekdays, visitorTimeZone } from '../../lib/contact'
import { cn } from '../../lib/cn'
import { Button } from '../ui/Button'
import { CopyButton } from '../ui/CopyButton'
import { Chip, Field, FieldGroup, Input, Select, Textarea } from '../ui/Field'

const TIME_WINDOWS = ['Morning (9–12)', 'Afternoon (12–5)', 'Flexible']

/**
 * Contact form in two flavours:
 *  - kind="message": general enquiry
 *  - kind="call":    call request (preferred days/time); used when no booking link is set
 * Delivery is handled by submitContact(): form endpoint if configured, else the email app.
 */
export function ContactForm({ kind = 'message', prefill = {}, className }) {
  const uid = useId()
  const id = (name) => `${uid}-${name}`
  const [status, setStatus] = useState('idle') // idle | sending | sent | mailto | error
  const [error, setError] = useState('')
  const [last, setLast] = useState(null)
  const weekdays = useMemo(() => (kind === 'call' ? upcomingWeekdays(8) : []), [kind])

  const onSubmit = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const value = (key) => String(fd.get(key) ?? '').trim()
    const data = {
      name: value('name'),
      email: value('email'),
      company: value('company'),
      interest: value('interest'),
      message: value('message'),
      dates: fd.getAll('days').map(String),
      days: weekdays.filter((d) => fd.getAll('days').includes(d.iso)).map((d) => d.label),
      time: value('time'),
      timezone: value('timezone'),
      project: prefill.project,
      _gotcha: value('_gotcha'),
    }
    setLast(data)
    setStatus('sending')
    setError('')
    try {
      const result = await submitContact(kind, data)
      setStatus(result.status)
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  if (!SITE.canReceiveMessages) return <NotConnected className={className} />

  if (status === 'sent' || status === 'mailto') {
    return <Confirmation status={status} kind={kind} data={last} onReset={() => setStatus('idle')} className={className} />
  }

  const fallbackHref = last ? mailtoHref({ subject: subjectFor(kind, last), body: buildMessage(kind, last) }) : mailtoHref()

  return (
    <form onSubmit={onSubmit} className={cn('grid gap-5', className)}>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" htmlFor={id('name')}>
          <Input id={id('name')} name="name" autoComplete="name" required defaultValue={prefill.name} />
        </Field>
        <Field label="Work email" htmlFor={id('email')}>
          <Input id={id('email')} name="email" type="email" autoComplete="email" required defaultValue={prefill.email} />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Company" htmlFor={id('company')} optional>
          <Input id={id('company')} name="company" autoComplete="organization" defaultValue={prefill.company} />
        </Field>
        <Field label="Interested in" htmlFor={id('interest')}>
          <Select id={id('interest')} name="interest" defaultValue={prefill.interest ?? 'Not sure yet'}>
            <option>Not sure yet</option>
            {SERVICES.map((s) => (
              <option key={s.id}>{s.label}</option>
            ))}
          </Select>
        </Field>
      </div>

      {kind === 'call' && (
        <>
          <FieldGroup legend="Preferred days" optional>
            {weekdays.map((day) => (
              <Chip key={day.iso} name="days" value={day.iso}>
                {day.label}
              </Chip>
            ))}
          </FieldGroup>
          <div className="grid gap-5 sm:grid-cols-[1fr_minmax(0,14rem)]">
            <FieldGroup legend="Best time">
              {TIME_WINDOWS.map((slot) => (
                <Chip key={slot} type="radio" name="time" value={slot} defaultChecked={slot === 'Flexible'}>
                  {slot}
                </Chip>
              ))}
            </FieldGroup>
            <Field label="Time zone" htmlFor={id('timezone')}>
              <Input id={id('timezone')} name="timezone" defaultValue={visitorTimeZone()} />
            </Field>
          </div>
        </>
      )}

      <Field
        label={kind === 'call' ? 'What would you like to talk about?' : 'What process is slowing your team down?'}
        htmlFor={id('message')}
        optional={kind === 'call'}
      >
        <Textarea
          id={id('message')}
          name="message"
          required={kind === 'message'}
          minLength={kind === 'message' ? 10 : undefined}
          placeholder={kind === 'message' ? 'e.g. We copy contract details into invoices by hand every month…' : ''}
          defaultValue={prefill.message}
        />
      </Field>

      {/* Honeypot: hidden from people, irresistible to bots */}
      <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

      {status === 'error' && (
        <div role="alert" className="flex gap-3 rounded-sm border border-danger/30 bg-danger-wash p-4 text-sm text-danger">
          <AlertCircle className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
          {SITE.email ? (
            <p>
              We couldn't send that ({error}). Please try again, or{' '}
              <a href={fallbackHref} className="font-medium underline underline-offset-2">
                email us directly
              </a>
              . Your message will be pre-filled.
            </p>
          ) : (
            <p>We couldn't send that ({error}). Please try again in a moment.</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-ink-3">
          {SITE.form.endpoint ? `We reply ${SITE.responseTime.toLowerCase()}.` : 'Opens your email app with everything filled in.'}
        </p>
        <Button type="submit" size="lg" arrow={status !== 'sending'} disabled={status === 'sending'}>
          {status === 'sending' && <Loader2 className="size-4 animate-spin" strokeWidth={2} />}
          {status === 'sending' ? 'Sending' : kind === 'call' ? 'Request a call' : 'Send message'}
        </Button>
      </div>
    </form>
  )
}

function Confirmation({ status, kind, data, onReset, className }) {
  const firstName = data?.name.split(' ')[0]
  const sent = status === 'sent'
  return (
    <div role="status" className={cn('flex flex-col items-start gap-4 py-6', className)}>
      <span className="grid size-11 place-items-center rounded-sm bg-accent-wash text-accent">
        {sent ? <CheckCircle2 className="size-5" strokeWidth={1.75} /> : <Mail className="size-5" strokeWidth={1.75} />}
      </span>
      <div>
        <h3 className="text-2xl font-light tracking-tight text-ink">
          {sent ? `Thanks${firstName ? `, ${firstName}` : ''}.` : 'Almost there.'}
        </h3>
        <p className="mt-2 max-w-md text-[15px] text-ink-2">
          {sent
            ? kind === 'call'
              ? `We'll email ${data.email} with a few times that fit, ${SITE.responseTime.toLowerCase()}.`
              : `Your message is in. We'll reply to ${data.email} ${SITE.responseTime.toLowerCase()}.`
            : 'Your email app should have opened with everything filled in. Just press send.'}
        </p>
      </div>
      {!sent && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-ink-2">
          <span>Didn't open?</span>
          <a href={mailtoHref({ subject: subjectFor(kind, data), body: buildMessage(kind, data) })} className="font-medium text-accent">
            Try again
          </a>
          <span className="text-ink-3">or copy our address</span>
          <CopyButton value={SITE.email} label={SITE.email} />
        </div>
      )}
      <Button variant="outline" onClick={onReset}>
        {sent ? 'Send another' : 'Back to the form'}
      </Button>
    </div>
  )
}

/** Shown when neither a form endpoint nor an email address is configured. */
function NotConnected({ className }) {
  return (
    <div role="status" className={cn('flex gap-3 rounded-sm border border-line bg-surface p-5 text-sm text-ink-2', className)}>
      <Mail className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={1.75} />
      {import.meta.env.DEV ? (
        <p>
          <strong className="font-medium text-ink">Messaging isn't connected yet.</strong> Set <code>VITE_FORM_ENDPOINT</code> or{' '}
          <code>VITE_CONTACT_EMAIL</code> in <code>.env.local</code> (see <code>.env.example</code>). This notice only shows in development.
        </p>
      ) : (
        <p>Our contact form is being set up. Please check back soon.</p>
      )}
    </div>
  )
}
