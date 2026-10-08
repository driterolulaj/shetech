import { Braces, Sparkles, Workflow } from 'lucide-react'

/**
 * The three service pillars. Ids are referenced by projects (`services`),
 * the work filters, the contact form and the navbar (#services-<id>).
 * Each is written around the problems it solves, not the technology.
 * `focus: true` marks the lead pillar (AI) with an "Our focus" label.
 */
export const SERVICES = [
  {
    id: 'ai',
    label: 'AI solutions',
    icon: Sparkles,
    focus: true,
    summary: 'AI that reads, sorts and drafts, so your team doesn’t have to.',
    forWhen: 'Your team spends hours reading, sorting or summarising documents and messages.',
    problems: [
      'Contracts, invoices and forms read by hand and re-typed into spreadsheets',
      'Inboxes and support tickets that need triaging before anyone can act',
      'Knowledge buried in PDFs that nobody can find quickly: ask it in plain language instead',
      'Decisions made on gut feel because the data is too slow to pull',
    ],
    note: 'Every AI system we build keeps a human review step wherever it matters. Your team stays in control.',
  },
  {
    id: 'automation',
    label: 'Automation',
    icon: Workflow,
    summary: 'Workflows that run themselves, with AI handling the messy steps.',
    forWhen: 'The same steps get repeated every day, week or month, and someone occasionally forgets one.',
    problems: [
      'Data copied between CRM, accounting and project tools',
      'Invoices, reminders and reports that depend on someone remembering',
      'Emails and attachments that need reading before the next step can start',
      'Errors from manual entry that cost money to fix',
    ],
  },
  {
    id: 'software',
    label: 'Custom software',
    icon: Braces,
    summary: 'Tools built around how you work, with AI where it earns its place.',
    forWhen: "You've outgrown spreadsheets, or no off-the-shelf tool fits the way you actually work.",
    problems: [
      'Internal tools, admin panels and dashboards built around your process',
      'Customer-facing portals and B2B SaaS products',
      'AI features added to software you already have: extraction, search, assistants',
      'Turning a working prototype into a reliable product',
    ],
  },
]
