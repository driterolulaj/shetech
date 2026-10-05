/**
 * Bento grid + modal content.
 *
 * - `span`    Tailwind grid placement on the 6-column md+ grid.
 * - `visual`  key into <ProjectVisual /> (ledger | flow | chart | sync).
 * - `draft`   shows a "Placeholder" badge. Replace these entries with real
 *             projects (or delete them) before launch.
 * - `results[].placeholder` flags numbers that still need real figures.
 */
export const PROJECTS = [
  {
    id: 'nia',
    index: '01',
    title: 'Nia',
    headline: 'Contract-to-invoice in minutes, not hours',
    summary: 'An AI platform that reads B2B contracts and sets up the entire invoicing schedule automatically.',
    tags: ['AI', 'Document processing', 'Automation', 'B2B SaaS'],
    span: 'md:col-span-4 md:row-span-2',
    visual: 'ledger',
    featured: true,
    challenge:
      'B2B companies manage dozens of contracts, each with its own pricing, start and end dates, and billing terms. Finance teams were reading every contract by hand, copying details into spreadsheets and building invoices manually. It was slow and repetitive, and invoices were sometimes missed or wrong.',
    solution:
      'Nia lets a business simply upload a contract. It reads the document, extracts the key commercial terms (parties, duration, pricing, start and end dates, billing frequency) and sets up the whole invoicing schedule. Nothing goes live until a person has confirmed the terms.',
    steps: [
      { title: 'Upload a contract', body: 'PDF or Word, straight from the inbox or drive.' },
      { title: 'AI extracts the key terms', body: 'Parties, dates, pricing and billing frequency, in seconds.' },
      { title: 'The team reviews and confirms', body: 'Everything on one screen. Edit anything before it goes live.', human: true },
      { title: 'Invoices are generated on schedule', body: 'For the whole life of the contract, with nothing to remember.' },
      { title: 'Each invoice is sent automatically', body: 'Straight to the client, on time, every time.' },
    ],
    results: [
      { value: '45 → 2 min', label: 'Contract setup time', placeholder: true },
      { value: '0', label: 'Missed invoices', placeholder: true },
      { value: 'X', label: 'Contracts processed', placeholder: true },
    ],
    quote: null, // { text: '…', author: 'Name, Role, Company' }
  },
  {
    id: 'inbox-triage',
    index: '02',
    title: 'Inbox triage',
    headline: 'Requests routed before anyone opens them',
    summary: 'AI classifies incoming email and support tickets and hands each one to the right person.',
    tags: ['AI', 'Automation'],
    span: 'md:col-span-2',
    visual: 'flow',
    draft: true,
    challenge: 'Describe the slow, painful or error-prone process here.',
    solution: 'Describe what was built, in plain language.',
    steps: [
      { title: 'Message arrives', body: 'Email, form or ticket.' },
      { title: 'AI classifies it', body: 'Intent, urgency, owner.' },
      { title: 'Team confirms edge cases', body: 'Low-confidence items go to a person.', human: true },
    ],
    results: [{ value: '—', label: 'Add a real metric', placeholder: true }],
  },
  {
    id: 'ops-dashboard',
    index: '03',
    title: 'Ops dashboard',
    headline: 'One live view instead of five spreadsheets',
    summary: 'A custom internal tool that pulls operational data into a single dashboard.',
    tags: ['Custom software'],
    span: 'md:col-span-2',
    visual: 'chart',
    draft: true,
    challenge: 'Describe the slow, painful or error-prone process here.',
    solution: 'Describe what was built, in plain language.',
    steps: [
      { title: 'Connect sources', body: 'CRM, accounting, spreadsheets.' },
      { title: 'Model the metrics', body: 'Agreed definitions, one source of truth.' },
      { title: 'Ship the dashboard', body: 'Live, shareable, permissioned.' },
    ],
    results: [{ value: '—', label: 'Add a real metric', placeholder: true }],
  },
  {
    id: 'crm-sync',
    index: '04',
    title: 'CRM ↔ accounting sync',
    headline: 'Records that stay in sync on their own',
    summary: 'Automation that keeps customer and billing data consistent across tools.',
    tags: ['Automation', 'Integrations'],
    span: 'md:col-span-3',
    visual: 'sync',
    draft: true,
    challenge: 'Describe the slow, painful or error-prone process here.',
    solution: 'Describe what was built, in plain language.',
    steps: [
      { title: 'Detect a change', body: 'New deal, updated address, closed account.' },
      { title: 'Sync both ways', body: 'With conflict rules agreed up front.' },
      { title: 'Flag anomalies', body: 'Anything unusual goes to a person.', human: true },
    ],
    results: [{ value: '—', label: 'Add a real metric', placeholder: true }],
  },
]
