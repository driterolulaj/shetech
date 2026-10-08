import { CalendarDays, Compass, FileText, LayoutGrid, Mail, MessageSquare, Users } from 'lucide-react'
import { CASE_STUDIES } from '../content/projects'
import { SERVICES } from '../content/services'

/** Projects marked `featured: true` are listed under "Work" automatically (up to 3). */
const featuredWork = CASE_STUDIES.filter((p) => p.featured)
  .slice(0, 3)
  .map((p) => ({ label: p.title, description: p.headline, href: `#work/${p.id}`, icon: p.icon ?? FileText }))

/**
 * Popover menus. The first column renders as rich rows (icon + description);
 * any further columns render compact on a tinted side panel.
 * Every href targets a real section: #services-<id>, #work, #work/<project>,
 * #how-we-work, #about, #contact. "#book" / "#message" open the contact dialog.
 */
export const NAV_MENUS = [
  {
    id: 'services',
    label: 'Services',
    columns: [
      {
        heading: 'What we build',
        items: SERVICES.map((s) => ({ label: s.label, description: s.summary, href: `#services-${s.id}`, icon: s.icon })),
      },
      {
        heading: 'Approach',
        items: [
          { label: 'How we work', href: '#how-we-work', icon: Compass },
          { label: 'Case studies', href: '#work', icon: LayoutGrid },
        ],
      },
    ],
  },
  {
    id: 'work',
    label: 'Work',
    columns: [
      {
        heading: 'Featured',
        items: featuredWork.length
          ? featuredWork
          : [{ label: 'Case studies', description: 'Outcome-driven stories.', href: '#work', icon: LayoutGrid }],
      },
      {
        heading: 'Browse',
        items: [{ label: 'All case studies', href: '#work', icon: LayoutGrid }],
      },
    ],
  },
  {
    id: 'company',
    label: 'Company',
    columns: [
      {
        heading: 'She Tech',
        items: [
          { label: 'How we work', description: 'Discovery → prototype → build → support.', href: '#how-we-work', icon: Compass },
          { label: 'About', description: 'Who we are and what we believe.', href: '#about', icon: Users },
        ],
      },
      {
        heading: 'Get in touch',
        items: [
          { label: 'Book a call', href: '#book', icon: CalendarDays },
          { label: 'Send a message', href: '#message', icon: Mail },
          { label: 'Contact details', href: '#contact', icon: MessageSquare },
        ],
      },
    ],
  },
]

export const NAV_LINKS = [{ label: 'Contact', href: '#contact' }]

/** Footer navigation */
export const FOOTER_LINKS = [
  { label: 'Services', href: '#services' },
  { label: 'Work', href: '#work' },
  { label: 'How we work', href: '#how-we-work' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
]
