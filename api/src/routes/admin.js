import { Router } from 'express'
import { config } from '../config.js'
import { createSession, deleteSession, findAdminByEmail, findSession, recordLogin } from '../db/admins.js'
import { addBookingEvent, deleteBooking, getBooking, listBookings, updateBooking } from '../db/bookings.js'
import { bookingIcs, formatInZone, sendMail } from '../lib/mail.js'
import { DUMMY_HASH, randomToken, sha256, verifyPassword } from '../lib/passwords.js'
import { rateLimiter } from '../lib/rateLimit.js'

/**
 * Admin API (/api/admin), used by the booking panel at /admin.
 *
 *   GET    /session                       → { authenticated, email? }
 *   POST   /login   { email, password }   → sets the session cookie
 *   POST   /logout
 *   GET    /bookings                      → { bookings }
 *   PATCH  /bookings/:id  { action, … }   → { booking, emailError }
 *            confirm   { scheduledAt, durationMin, meetingLink, notify }   schedule or reschedule
 *            complete | reopen
 *            cancel    { notify }
 *            notes     { notes }
 *   DELETE /bookings/:id
 *
 * Sessions live in admin_sessions; the cookie holds a random token (HttpOnly,
 * SameSite). Every request except GET /session must send `X-Admin: 1`, which a
 * cross-site form can't, so the cookie can't be used to act on your behalf.
 */
export const adminRouter = Router()

const COOKIE = 'st_admin'
const COOKIE_PATH = '/api/admin'
const loginLimited = rateLimiter({ max: 10, windowMs: 15 * 60_000 })

function readToken(req) {
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const [key, ...value] = part.trim().split('=')
    if (key === COOKIE) return decodeURIComponent(value.join('='))
  }
  return null
}

function setCookie(req, res, token, maxAgeMs) {
  const sameSite = config.admin.cookieSameSite
  res.cookie(COOKIE, token, {
    path: COOKIE_PATH,
    httpOnly: true,
    sameSite: sameSite.toLowerCase(),
    secure: req.secure || sameSite === 'None',
    maxAge: maxAgeMs,
  })
}

async function currentAdmin(req) {
  const token = readToken(req)
  return token ? findSession(sha256(token)) : null
}

adminRouter.use((req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})

adminRouter.get('/session', async (req, res) => {
  const admin = await currentAdmin(req)
  res.json(admin ? { authenticated: true, email: admin.email } : { authenticated: false })
})

// Everything below needs the X-Admin header
adminRouter.use((req, res, next) => (req.get('x-admin') === '1' ? next() : res.status(403).json({ error: 'Forbidden.' })))

adminRouter.post('/login', async (req, res) => {
  if (loginLimited(req.ip)) return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' })
  const { email, password } = req.body ?? {}
  if (typeof email !== 'string' || typeof password !== 'string') return res.status(400).json({ error: 'Enter your email and password.' })

  const admin = await findAdminByEmail(email.trim())
  const valid = await verifyPassword(password, admin?.password_hash ?? DUMMY_HASH)
  if (!admin || !valid) return res.status(401).json({ error: 'Wrong email or password.' })

  const token = randomToken()
  const maxAge = config.admin.sessionDays * 86_400_000
  await createSession(admin.id, sha256(token), new Date(Date.now() + maxAge))
  await recordLogin(admin.id)
  setCookie(req, res, token, maxAge)
  res.json({ authenticated: true, email: admin.email })
})

adminRouter.post('/logout', async (req, res) => {
  const token = readToken(req)
  if (token) await deleteSession(sha256(token))
  setCookie(req, res, '', 0)
  res.json({ authenticated: false })
})

// Everything below needs a signed-in admin
adminRouter.use(async (req, res, next) => {
  req.admin = await currentAdmin(req)
  return req.admin ? next() : res.status(401).json({ error: 'Please sign in.' })
})

adminRouter.get('/bookings', async (_req, res) => {
  res.json({ bookings: await listBookings() })
})

adminRouter.patch('/bookings/:id', async (req, res) => {
  const booking = await getBooking(req.params.id)
  if (!booking) return res.status(404).json({ error: 'Booking not found.' })
  const result = await applyAction(booking, req.body ?? {})
  if (result.error) return res.status(400).json({ error: result.error })
  res.json({ booking: await getBooking(booking.id), emailError: result.emailError ?? null })
})

adminRouter.delete('/bookings/:id', async (req, res) => {
  return (await deleteBooking(req.params.id)) ? res.json({ deleted: true }) : res.status(404).json({ error: 'Booking not found.' })
})

const isUrl = (value) => {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol)
  } catch {
    return false
  }
}

async function applyAction(booking, body) {
  switch (body.action) {
    case 'confirm': {
      const scheduled = new Date(body.scheduledAt)
      const durationMin = Number(body.durationMin)
      const meetingLink = typeof body.meetingLink === 'string' ? body.meetingLink.trim().slice(0, 500) : ''
      if (Number.isNaN(scheduled.getTime())) return { error: 'Pick a date and time.' }
      if (!Number.isInteger(durationMin) || durationMin < 10 || durationMin > 240) return { error: 'Duration must be 10–240 minutes.' }
      if (meetingLink && !isUrl(meetingLink)) return { error: 'The meeting link must start with http:// or https://' }

      const rescheduled = booking.status === 'confirmed' && Boolean(booking.scheduledAt)
      const updated = await updateBooking(
        booking.id,
        { status: 'confirmed', scheduledAt: scheduled, durationMin, meetingLink: meetingLink || null, sequence: booking.sequence + (rescheduled ? 1 : 0) },
        [`${rescheduled ? 'Rescheduled' : 'Confirmed'} for ${formatInZone(scheduled, 'UTC')}`],
      )
      return body.notify ? { emailError: await notify(updated, confirmationEmail(updated, { rescheduled }), 'Confirmation') } : {}
    }
    case 'cancel': {
      const updated = await updateBooking(booking.id, { status: 'cancelled', sequence: booking.sequence + 1 }, ['Cancelled'])
      return body.notify ? { emailError: await notify(updated, cancellationEmail(updated), 'Cancellation') } : {}
    }
    case 'complete':
      await updateBooking(booking.id, { status: 'completed' }, ['Marked as completed'])
      return {}
    case 'reopen':
      await updateBooking(booking.id, { status: 'new' }, ['Reopened'])
      return {}
    case 'notes':
      await updateBooking(booking.id, { notes: typeof body.notes === 'string' ? body.notes.slice(0, 10_000) : '' })
      return {}
    default:
      return { error: 'Unknown action.' }
  }
}

/** Emails the client; logs it in the history. Returns an error message for the panel, or null. */
async function notify(booking, email, kind) {
  try {
    await sendMail(email)
    await addBookingEvent(booking.id, `${kind} emailed to ${booking.email}`)
    return null
  } catch (err) {
    console.error('[admin] client email failed:', err.message)
    return `Saved, but the email to ${booking.email} failed: ${err.message}`
  }
}

function confirmationEmail(booking, { rescheduled }) {
  const when = formatInZone(new Date(booking.scheduledAt), booking.timezone)
  return {
    to: { name: booking.name, address: booking.email },
    replyTo: config.mail.to,
    subject: `${rescheduled ? 'Updated: your' : 'Your'} call with ${config.mail.senderName}, ${when}`,
    text: [
      `Hi ${booking.name.split(' ')[0]},`,
      rescheduled ? 'We have moved our call. Here is the new time:' : `Thanks for booking a call with ${config.mail.senderName}. You are all set:`,
      `${when} (${booking.durationMin} minutes)`,
      booking.meetingLink ? `Join here: ${booking.meetingLink}` : 'We will send the video link before the call.',
      'A calendar invite is attached. Need a different time? Just reply to this email.',
      `Speak soon,\n${config.mail.senderName}`,
    ].join('\n\n'),
    icalEvent: { filename: 'invite.ics', ...bookingIcs(booking) },
  }
}

function cancellationEmail(booking) {
  return {
    to: { name: booking.name, address: booking.email },
    replyTo: config.mail.to,
    subject: `Your call with ${config.mail.senderName} has been cancelled`,
    text: [
      `Hi ${booking.name.split(' ')[0]},`,
      booking.scheduledAt
        ? `We have had to cancel our call on ${formatInZone(new Date(booking.scheduledAt), booking.timezone)}.`
        : 'We are not able to schedule the call you requested.',
      'Reply to this email if you would like to find another time.',
      `Best,\n${config.mail.senderName}`,
    ].join('\n\n'),
    ...(booking.scheduledAt && { icalEvent: { filename: 'cancel.ics', ...bookingIcs(booking, { cancel: true }) } }),
  }
}
