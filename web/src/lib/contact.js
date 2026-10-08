import { SITE } from '../config/site'

const KIND_LABEL = { message: 'New enquiry', call: 'Call request' }

export function subjectFor(kind, data) {
  return `${KIND_LABEL[kind]}: ${data.name}${data.company ? ` (${data.company})` : ''}`
}

/** Plain-text summary used as the email body and the form's `message` field. */
export function buildMessage(kind, data) {
  const details = [
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    data.company && `Company: ${data.company}`,
    data.interest && `Interested in: ${data.interest}`,
    data.project && `Re: ${data.project}`,
    data.days?.length > 0 && `Preferred days: ${data.days.join(', ')}`,
    data.time && `Preferred time: ${data.time}`,
    data.timezone && `Time zone: ${data.timezone}`,
  ].filter(Boolean)

  return [`${KIND_LABEL[kind]} via the ${SITE.name} website`, details.join('\n'), data.message]
    .filter(Boolean)
    .join('\n\n')
}

export function mailtoHref({ subject = '', body = '' } = {}) {
  const params = [subject && `subject=${encodeURIComponent(subject)}`, body && `body=${encodeURIComponent(body)}`]
  const query = params.filter(Boolean).join('&')
  return `mailto:${SITE.email}${query ? `?${query}` : ''}`
}

/**
 * Deliver a contact or call request.
 *  - Form endpoint configured → JSON POST (Formspree / Web3Forms / custom).
 *  - Not configured → opens the visitor's email app, pre-filled.
 * Resolves to { status: 'sent' | 'mailto', subject, message }; throws on failure.
 */
export async function submitContact(kind, data) {
  const subject = subjectFor(kind, data)
  const message = buildMessage(kind, data)

  if (data._gotcha) return { status: 'sent', subject, message } // honeypot: quietly drop bots

  if (!SITE.form.endpoint) {
    window.location.href = mailtoHref({ subject, body: message })
    return { status: 'mailto', subject, message }
  }

  const response = await fetch(SITE.form.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      ...(SITE.form.accessKey && { access_key: SITE.form.accessKey }),
      subject,
      _subject: subject, // Formspree
      from_name: `${SITE.name} website`, // Web3Forms
      name: data.name,
      email: data.email,
      _replyto: data.email,
      company: data.company || undefined,
      kind,
      interest: data.interest || undefined,
      project: data.project || undefined,
      preferred_days: data.days?.join(', ') || undefined,
      preferred_dates: data.dates?.length ? data.dates : undefined, // YYYY-MM-DD, for the admin calendar
      preferred_time: data.time || undefined,
      timezone: data.timezone || undefined,
      note: data.message || undefined, // what the visitor typed, without the summary above
      message,
    }),
  })

  let json = null
  try {
    json = await response.json()
  } catch {
    // some endpoints reply with an empty body
  }
  if (!response.ok || json?.success === false || json?.ok === false) {
    throw new Error(json?.message || json?.error || `The server responded with ${response.status}.`)
  }
  return { status: 'sent', subject, message }
}

/** Calendly needs a few query params to render cleanly inside an iframe. */
export function bookingEmbedUrl(raw) {
  try {
    const url = new URL(raw)
    if (url.hostname.endsWith('calendly.com')) {
      url.searchParams.set('embed_type', 'Inline')
      url.searchParams.set('embed_domain', window.location.hostname)
      url.searchParams.set('hide_gdpr_banner', '1')
    }
    return url.toString()
  } catch {
    return raw
  }
}

/** Next `count` weekdays starting tomorrow: { iso: 'YYYY-MM-DD', label } with the label in the visitor's locale. */
export function upcomingWeekdays(count = 8) {
  const format = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
  const pad = (n) => String(n).padStart(2, '0')
  const days = []
  const date = new Date()
  while (days.length < count) {
    date.setDate(date.getDate() + 1)
    const day = date.getDay()
    if (day !== 0 && day !== 6) {
      days.push({ iso: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`, label: format.format(date) })
    }
  }
  return days
}

export function visitorTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || ''
  } catch {
    return ''
  }
}
