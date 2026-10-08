import nodemailer from 'nodemailer'
import { config } from '../config.js'

const { mail } = config

const transport = mail.user && mail.pass ? nodemailer.createTransport({ service: 'gmail', auth: { user: mail.user, pass: mail.pass } }) : null

export const mailConfigured = Boolean(transport)

/** Sends from the Gmail account. Throws if mail isn't configured or Gmail refuses. */
export function sendMail({ fromName = mail.senderName, ...options }) {
  if (!transport) throw new Error('Gmail is not configured (GMAIL_USER / GMAIL_APP_PASSWORD).')
  return transport.sendMail({ from: { name: fromName, address: mail.user }, ...options })
}

/** "Thursday 9 October, 10:00 CEST", in the given IANA time zone (UTC if it isn't valid). */
export function formatInZone(date, timeZone) {
  const options = { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }
  try {
    return new Intl.DateTimeFormat('en-GB', { ...options, timeZone: timeZone || 'UTC' }).format(date)
  } catch {
    return new Intl.DateTimeFormat('en-GB', { ...options, timeZone: 'UTC' }).format(date)
  }
}

const icsDate = (date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
const icsText = (value) => String(value).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
/** Lines longer than 75 octets must be folded (RFC 5545 §3.1). */
const fold = (line) => {
  const parts = []
  let rest = line
  while (Buffer.byteLength(rest) > 75) {
    let cut = 75
    while (Buffer.byteLength(rest.slice(0, cut)) > 75) cut--
    parts.push(rest.slice(0, cut))
    rest = ` ${rest.slice(cut)}`
  }
  parts.push(rest)
  return parts.join('\r\n')
}

/** Calendar invite for a booking. `cancel` produces the matching cancellation. */
export function bookingIcs(booking, { cancel = false } = {}) {
  const start = new Date(booking.scheduledAt)
  const end = new Date(start.getTime() + booking.durationMin * 60_000)
  const description = [
    `Call with ${mail.senderName}.`,
    booking.meetingLink && `Join: ${booking.meetingLink}`,
    'Need to change the time? Just reply to the confirmation email.',
  ]
    .filter(Boolean)
    .join('\n')

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//She Tech//Bookings//EN',
    `METHOD:${cancel ? 'CANCEL' : 'REQUEST'}`,
    'BEGIN:VEVENT',
    `UID:${booking.id}@shetech`,
    `SEQUENCE:${booking.sequence ?? 0}`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsText(`Call with ${mail.senderName}`)}`,
    `DESCRIPTION:${icsText(description)}`,
    booking.meetingLink && `LOCATION:${icsText(booking.meetingLink)}`,
    `ORGANIZER;CN=${icsText(mail.senderName)}:mailto:${mail.user}`,
    `ATTENDEE;CN=${icsText(booking.name)};RSVP=TRUE:mailto:${booking.email}`,
    `STATUS:${cancel ? 'CANCELLED' : 'CONFIRMED'}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean)

  return { method: cancel ? 'CANCEL' : 'REQUEST', content: lines.map(fold).join('\r\n') }
}
