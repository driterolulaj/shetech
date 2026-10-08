/**
 * Site-wide settings. Values can come from environment variables (see
 * .env.example) so deploys don't need code changes; the fallbacks below are
 * used when a variable isn't set.
 */
const env = import.meta.env

export const SITE = {
  name: 'She Tech',
  tagline: 'AI solutions, automation & custom software.',

  /** Shown on the page and used for mailto links. Hidden everywhere while empty. */
  email: env.VITE_CONTACT_EMAIL || '',
  responseTime: 'Within one business day',

  booking: {
    /**
     * Your scheduling page (Calendly, Cal.com, TidyCal, SavvyCal, HubSpot
     * Meetings, Google Calendar appointment page…). When set, "Book a call"
     * embeds it. When empty, visitors get a call-request form instead.
     */
    url: env.VITE_BOOKING_URL || '',
    duration: '30 min',
    format: 'Video call',
  },

  /**
   * Where the API service (../api) lives. Empty = same origin (/api, forwarded by
   * the dev server, server/index.js or nginx). Set it only when the API is on its
   * own host, e.g. https://api.shetech.com.
   */
  apiUrl: (env.VITE_API_URL || '').replace(/\/+$/, ''),

  form: {
    /**
     * Where form submissions are POSTed as JSON: the She Tech API by default.
     * VITE_FORM_ENDPOINT can point at Formspree (https://formspree.io/f/xxxx),
     * Web3Forms (https://api.web3forms.com/submit) or another endpoint instead.
     */
    endpoint: env.VITE_FORM_ENDPOINT || `${(env.VITE_API_URL || '').replace(/\/+$/, '')}/api/contact`,
    /** Web3Forms only. */
    accessKey: env.VITE_FORM_ACCESS_KEY || '',
  },

  /** Can the site deliver a message at all? (form endpoint or an email for mailto) */
  get canReceiveMessages() {
    return Boolean(this.form.endpoint || this.email)
  },

  /** Empty hrefs are hidden automatically. */
  socials: [
    { label: 'LinkedIn', href: env.VITE_LINKEDIN_URL || '' },
    { label: 'GitHub', href: env.VITE_GITHUB_URL || '' },
    { label: 'Instagram', href: env.VITE_INSTAGRAM_URL || '' },
  ].filter((s) => s.href),
}

export const WORK = {
  /** Draft projects show while developing and are hidden in production builds. */
  showDrafts: env.DEV || env.VITE_SHOW_DRAFTS === 'true',
  /** Service filter chips appear once there are at least this many projects. */
  filterThreshold: 5,
  /** Projects shown before "Show all". */
  initialVisible: 8,
}
