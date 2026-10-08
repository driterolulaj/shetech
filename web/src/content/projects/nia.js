export default {
  order: 1,
  featured: true,
  visual: 'ledger',
  services: ['ai', 'automation', 'software'],

  title: 'Nia',
  headline: 'Contract-to-invoice in minutes, not hours',
  tags: ['AI', 'Document processing', 'Automation', 'B2B SaaS'],

  summary: 'AI that turns contracts into automated invoicing. A business uploads a contract; Nia reads it and sets up the entire invoicing schedule.',
  challenge:
    'B2B companies manage dozens of contracts, each with its own pricing, start and end dates, and billing terms. Finance teams were reading every contract by hand, copying details into spreadsheets and building invoices manually. It was slow and repetitive, and invoices were sometimes missed or wrong.',
  solution:
    'Nia lets a business simply upload a contract. It reads the document, extracts the key commercial terms (parties, duration, pricing, start and end dates, billing frequency) and sets up the whole invoicing schedule. Nothing goes live until a person has confirmed the terms.',
  steps: [
    { title: 'Upload a contract', body: 'PDF or Word, straight from the inbox or drive.' },
    { title: 'AI extracts the key terms', body: 'Parties, dates, pricing and billing frequency, in seconds.', ai: true },
    { title: 'The team reviews and confirms', body: 'Everything on one screen. Edit anything before it goes live.', human: true },
    { title: 'Invoices are generated on schedule', body: 'For the whole life of the contract, with nothing to remember.' },
    { title: 'Each invoice is sent automatically', body: 'Straight to the client, on time, every time.' },
  ],
  // What changed, in words. Add measured numbers to `results` once they're confirmed, e.g.
  // { value: '45 → 2 min', label: 'Contract setup time' }, { value: '0', label: 'Missed invoices' },
  // { value: 'X', label: 'Contracts processed' }
  outcomes: [
    'Commercial terms are read off the contract instead of re-typed into a spreadsheet.',
    'Every invoice in a schedule is created up front, so none depend on someone remembering.',
    'Finance still signs off on the extracted terms before anything is sent.',
  ],
  results: [],
  quote: null,
}
