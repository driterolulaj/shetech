import { Router } from 'express'
import { config } from '../config.js'
import { createBooking } from '../db/bookings.js'
import { createEnquiry } from '../db/enquiries.js'
import { mailConfigured, sendMail } from '../lib/mail.js'
import { rateLimiter } from '../lib/rateLimit.js'

/**
 * POST /api/contact: the website's "Send a message" and "Book a call" forms.
 * Saves the submission (enquiry or booking) and emails it to the inbox.
 * The visitor gets success as long as either step worked, so nothing is lost.
 */
export const contactRouter = Router()

const EMAIL_RE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]+$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const limited = rateLimiter({ max: 5, windowMs: 10 * 60_000 }) // per IP

/** Trimmed single-line string capped at `max` characters (headers must not contain newlines). */
const line = (value, max = 200) => (typeof value === 'string' ? value.replace(/[\r\n]+/g, ' ').trim().slice(0, max) : '')
const text = (value, max = 10_000) => (typeof value === 'string' ? value.trim().slice(0, max) : '')

/**
 * Where the website lives, for the admin link in the email: PUBLIC_URL, else the
 * Origin the form was sent from, but only if it's this host or an allowed CORS origin.
 */
function siteOrigin(req) {
  if (config.publicUrl) return config.publicUrl
  const origin = req.get('origin')
  if (!origin) return null
  try {
    return config.corsOrigins.includes(origin) || new URL(origin).host === req.get('host') ? origin : null
  } catch {
    return null
  }
}

contactRouter.post('/', async (req, res) => {
  if (limited(req.ip)) return res.status(429).json({ success: false, message: 'Too many messages. Please try again in a few minutes.' })

  const data = req.body ?? {}
  if (line(data._gotcha)) return res.json({ success: true }) // honeypot: quietly drop bots

  const name = line(data.name)
  const email = line(data.email, 254)
  const message = text(data.message)
  if (!name || !EMAIL_RE.test(email) || !message) {
    return res.status(400).json({ success: false, message: 'Please fill in your name, a valid email and a message.' })
  }

  const client = { name, email, company: line(data.company), timezone: line(data.timezone, 80) }
  const isCall = data.kind === 'call'

  let saved = null
  try {
    saved = isCall
      ? await createBooking({
          client,
          interest: line(data.interest),
          project: line(data.project),
          preferredDates: (Array.isArray(data.preferred_dates) ? data.preferred_dates : []).filter((d) => typeof d === 'string' && DATE_RE.test(d)).slice(0, 14),
          preferredDays: line(data.preferred_days, 300),
          preferredTime: line(data.preferred_time, 60),
          note: text(data.note, 5000),
        })
      : { enquiryId: await createEnquiry({ client, interest: line(data.interest), project: line(data.project), message: text(data.note) || message }) }
  } catch (err) {
    console.error('[contact] could not save submission:', err.message)
  }

  let emailed = false
  if (mailConfigured) {
    const site = siteOrigin(req)
    const adminLink = isCall && saved?.id && site && `${site}/admin#booking/${saved.id}`
    try {
      await sendMail({
        fromName: `${config.mail.senderName} website`,
        to: config.mail.to,
        replyTo: { name, address: email },
        subject: line(data.subject) || `New enquiry: ${name}`,
        text: adminLink ? `${message}\n\nConfirm a time in the admin panel:\n${adminLink}` : message,
      })
      emailed = true
    } catch (err) {
      console.error('[contact] Gmail send failed:', err.message)
    }
  }

  if (!saved && !emailed) {
    return res.status(502).json({ success: false, message: "We couldn't send your message right now. Please try again or email us directly." })
  }
  res.json({ success: true })
})
