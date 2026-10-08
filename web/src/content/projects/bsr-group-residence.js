// Public-site facts were verified on the live site (October 2026). The admin
// panel and the AI features (document check, "Find my apartment" assistant,
// sales insight) were confirmed as delivered by the team (October 2026).
export default {
  order: 2,
  featured: true,
  visual: 'facade',
  services: ['ai', 'software'],
  url: 'https://www.bsrgroup-residence.com/',

  title: 'BSR Group Residence',
  headline: 'AI-powered sales, from first search to signed paperwork',
  tags: ['AI', 'Real estate', 'Document processing', 'Interactive visualisation', 'Admin panel', 'Web development'],

  summary:
    'An AI-powered sales platform for a residential complex in Prizren, Kosovo. Buyers find their apartment by describing it in plain language, and the sales team runs every sale in one place, with AI checking the paperwork and spotting what sells.',
  challenge:
    'The developer was selling apartments across two buildings using floor-plan PDFs, spreadsheets and email threads. Buyers struggled to see what was actually available, and the sales team tracked unit status, buyer details and documents in several disconnected places. That made it easy to lose track of paperwork or show a unit that had already been sold.',
  solution:
    'We built two connected products with AI running through both. The public website shows both buildings as an interactive visual: buyers describe what they want ("3 bedrooms, high floor, south-facing, under €200k") and the matching apartments light up, or hover any unit for its size, layout, floor, price and live status. The secure admin panel is where the sales team manages every unit, buyer and sale. When buyer documents are uploaded, AI reads them, confirms names and details match the sale, flags anything missing or expired and builds a checklist of what is still needed before signing. AI also tracks which unit types sell fastest and suggests pricing or marketing adjustments for the remaining stock. Every change appears on the public site instantly.',

  steps: [
    { title: 'Buyers describe what they want', body: 'In plain language. The matching apartments light up on the building.', ai: true },
    { title: 'Hover for details and live status', body: 'Size, layout, floor and price, plus available, reserved or sold.' },
    { title: 'AI checks every document', body: 'Contracts and IDs are read, matched against the sale, and anything missing or expired is flagged.', ai: true },
    { title: 'The sales team confirms the sale', body: 'Working from the AI checklist in the admin panel. Status syncs to the public site instantly.', human: true },
    { title: 'AI spots what sells', body: 'Suggests pricing and marketing adjustments for the remaining stock.', ai: true },
  ],

  highlights: [
    '"Find my apartment" assistant: plain-language search that lights up matching apartments on the facade',
    'AI document check: names and details matched to the sale, missing or expired documents flagged, with a pre-signing checklist',
    'AI sales insight: which unit types sell fastest, with pricing and marketing suggestions for remaining stock',
    'Interactive facade: every apartment traced over the render and colour-coded by status',
    'Admin panel for units, buyers and sale documents, synced live to the public site',
    'Filters for apartment type, floor (1–9) and area (89–166 m²), plus a shareable page per apartment with 2D/3D plans and a PDF',
    'The same map for 2,316 m² of commercial space and 83 underground parking and storage units',
    'Phased roll-out: Lamela A and B live, C and D ready to switch on',
  ],

  outcomes: [
    'Buyers find matching apartments by describing them, without calling the sales office.',
    'Missing or expired documents are caught before signing, not after.',
    'Pricing and marketing for the remaining stock follow what is actually selling.',
    'Unit status, buyer details and sale documents live in one place instead of spreadsheets and email threads.',
    'The public site and the sales team always show the same status.',
  ],
  // Add measured numbers once confirmed, e.g. { value: 'X', label: 'Apartments managed across 2 buildings' },
  // { value: '0', label: 'Double-booked units' }, { value: 'X%', label: 'Units sold within Y months of launch' }
  results: [],
  quote: null,
}
