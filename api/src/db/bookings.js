import crypto from 'node:crypto'
import { upsertClient } from './clients.js'
import { pool, transaction } from './pool.js'

/**
 * Bookings with their client, preferred dates and history, in the shape the
 * admin panel uses:
 * { id, status, name, email, company, timezone, interest, project, preferredDates,
 *   preferredDays, preferredTime, note, scheduledAt, durationMin, meetingLink, notes,
 *   sequence, createdAt, updatedAt, history: [{ at, text }] }
 */

const SELECT = `
  SELECT b.*, c.name, c.email, c.company, c.timezone
  FROM bookings b JOIN clients c ON c.id = b.client_id`

const iso = (date) => (date ? new Date(date).toISOString() : null)

function toBooking(row, dates = [], events = []) {
  return {
    id: row.id,
    status: row.status,
    name: row.name,
    email: row.email,
    company: row.company ?? '',
    timezone: row.timezone ?? '',
    interest: row.interest ?? '',
    project: row.project ?? '',
    preferredDates: dates,
    preferredDays: row.preferred_days ?? '',
    preferredTime: row.preferred_time ?? '',
    note: row.note ?? '',
    scheduledAt: iso(row.scheduled_at),
    durationMin: row.duration_min,
    meetingLink: row.meeting_link ?? '',
    notes: row.notes ?? '',
    sequence: row.sequence,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    history: events,
  }
}

/** Loads dates and history for the given rows in two queries and assembles the bookings. */
async function hydrate(rows) {
  if (rows.length === 0) return []
  const ids = rows.map((r) => r.id)
  const [[dates], [events]] = await Promise.all([
    pool.query('SELECT booking_id, date FROM booking_preferred_dates WHERE booking_id IN (?) ORDER BY date', [ids]),
    pool.query('SELECT booking_id, text, created_at FROM booking_events WHERE booking_id IN (?) ORDER BY created_at, id', [ids]),
  ])
  const group = (items, map) => {
    const result = new Map()
    for (const item of items) result.set(item.booking_id, [...(result.get(item.booking_id) ?? []), map(item)])
    return result
  }
  const datesBy = group(dates, (d) => d.date)
  const eventsBy = group(events, (e) => ({ at: iso(e.created_at), text: e.text }))
  return rows.map((row) => toBooking(row, datesBy.get(row.id), eventsBy.get(row.id)))
}

export async function listBookings() {
  const [rows] = await pool.query(`${SELECT} ORDER BY b.created_at DESC`)
  return hydrate(rows)
}

export async function getBooking(id) {
  const [rows] = await pool.query(`${SELECT} WHERE b.id = ?`, [id])
  return (await hydrate(rows))[0] ?? null
}

/** A call request from the website. Creates or updates the client too. */
export async function createBooking({ client, interest, project, preferredDates, preferredDays, preferredTime, note }) {
  const id = crypto.randomUUID()
  const now = new Date()
  await transaction(async (connection) => {
    const clientId = await upsertClient(connection, client)
    await connection.query(
      `INSERT INTO bookings (id, client_id, status, interest, project, preferred_days, preferred_time, note, created_at, updated_at)
       VALUES (?, ?, 'new', ?, ?, ?, ?, ?, ?, ?)`,
      [id, clientId, interest || null, project || null, preferredDays || null, preferredTime || null, note || null, now, now],
    )
    if (preferredDates.length) {
      await connection.query('INSERT IGNORE INTO booking_preferred_dates (booking_id, date) VALUES ?', [preferredDates.map((d) => [id, d])])
    }
    await connection.query('INSERT INTO booking_events (booking_id, text, created_at) VALUES (?, ?, ?)', [id, 'Requested on the website', now])
  })
  return getBooking(id)
}

/** Columns the admin panel may change, by field name. */
const COLUMNS = {
  status: 'status',
  scheduledAt: 'scheduled_at',
  durationMin: 'duration_min',
  meetingLink: 'meeting_link',
  notes: 'notes',
  sequence: 'sequence',
}

/**
 * Applies `changes` (fields from COLUMNS) and appends `events` to the history.
 * Resolves to the updated booking, or null if it doesn't exist.
 */
export async function updateBooking(id, changes = {}, events = []) {
  const now = new Date()
  const fields = Object.entries(changes).filter(([key]) => COLUMNS[key])
  const found = await transaction(async (connection) => {
    const [result] = await connection.query(
      `UPDATE bookings SET ${[...fields.map(([key]) => `${COLUMNS[key]} = ?`), 'updated_at = ?'].join(', ')} WHERE id = ?`,
      [...fields.map(([key, value]) => (key === 'scheduledAt' && value ? new Date(value) : value)), now, id],
    )
    if (result.affectedRows === 0) return false
    for (const text of events) {
      await connection.query('INSERT INTO booking_events (booking_id, text, created_at) VALUES (?, ?, ?)', [id, text, new Date()])
    }
    return true
  })
  return found ? getBooking(id) : null
}

/** Appends one history line without touching anything else. */
export async function addBookingEvent(id, text) {
  await pool.query('INSERT INTO booking_events (booking_id, text, created_at) VALUES (?, ?, ?)', [id, text, new Date()])
}

export async function deleteBooking(id) {
  const [result] = await pool.query('DELETE FROM bookings WHERE id = ?', [id])
  return result.affectedRows > 0
}
