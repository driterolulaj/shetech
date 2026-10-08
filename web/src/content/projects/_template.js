/**
 * PROJECT TEMPLATE. Files starting with "_" are ignored.
 *
 * To add a project: copy this file to `src/content/projects/<slug>.js`
 * (the slug becomes its link: /#work/<slug>), fill it in and save.
 * It appears in the work grid, the modal and, if `featured`, the navbar.
 */
export default {
  /** Position in the grid (lower comes first). */
  order: 50,

  /** true = visible in `npm run dev` only, hidden from the live site. */
  draft: true,

  /**
   * true = listed as "In progress" with title, headline and tags only;
   * no modal. Handy for announcing work before the case study is ready.
   */
  comingSoon: false,

  /** Also list it under "Work" in the navbar. */
  featured: false,

  /** Illustration beside the project: 'ledger' · 'facade' · 'flow' · 'chart' · 'sync' */
  visual: 'flow',

  /** Live site, shown as "Visit the live site" in the case study. Optional. */
  url: '',

  /** Which service filters it belongs to: 'ai' · 'automation' · 'software' */
  services: ['ai'],

  // ── Card ────────────────────────────────────────────────────────────────
  title: 'Client or product name',
  headline: 'One-line result, e.g. "Onboarding in a day, not a week"',
  tags: ['AI', 'Automation'],

  // ── Case study (modal) ──────────────────────────────────────────────────
  summary: 'One or two sentences: what it is and who it is for.',
  challenge: 'What was slow, painful or error-prone before.',
  solution: 'What we built, in plain language.',

  /** 3–5 steps. Mark steps where AI does the work with `ai: true`, and the step where a person reviews with `human: true`. */
  steps: [
    { title: 'Step one', body: 'Short explanation.', ai: true },
    { title: 'People review', body: 'Where the team stays in control.', human: true },
    { title: 'Step three', body: 'Short explanation.' },
  ],

  /** Features worth calling out. Shown as "Highlights" in the modal. */
  highlights: [],

  /**
   * Proposed AI extensions, not delivered work: { title, body }. Shown as
   * "Next phase: where AI fits" with a "Proposed" label, and flagged on the card.
   */
  nextPhase: [],

  /** What changed, in words. Shown as "What changed" in the modal. */
  outcomes: [
    'One sentence per outcome.',
  ],

  /** Measured numbers (numbers beat adjectives). Leave empty until confirmed. */
  results: [
    // { value: '45 → 2 min', label: 'Contract setup time' },
  ],

  /** Optional */
  quote: null, // { text: 'What the client said.', author: 'Name, Role, Company' }
}
