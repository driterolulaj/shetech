import {
  Braces,
  Compass,
  FileText,
  Inbox,
  LayoutDashboard,
  LayoutGrid,
  MessageSquare,
  Sparkles,
  Users,
  Workflow,
} from 'lucide-react'

/**
 * Popover menus. The first column renders as rich rows (icon + description);
 * any further columns render compact on a tinted side panel.
 * TODO: #how-we-work and #about point at sections that don't exist yet.
 */
export const NAV_MENUS = [
  {
    id: 'services',
    label: 'Services',
    columns: [
      {
        heading: 'What we build',
        items: [
          { label: 'AI solutions', description: 'Pull data out of contracts, emails and forms.', href: '#work', icon: Sparkles },
          { label: 'Automation', description: 'Invoices and handoffs that run themselves.', href: '#work', icon: Workflow },
          { label: 'Custom software', description: 'Internal tools and B2B products that fit.', href: '#work', icon: Braces },
        ],
      },
      {
        heading: 'Use cases',
        items: [
          { label: 'Contract-to-invoice', href: '#work', icon: FileText },
          { label: 'Inbox triage', href: '#work', icon: Inbox },
          { label: 'Ops dashboards', href: '#work', icon: LayoutDashboard },
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
        items: [
          { label: 'Nia', description: 'Contract-to-invoice in minutes, not hours.', href: '#work', icon: FileText },
        ],
      },
      {
        heading: 'Browse',
        items: [{ label: 'All projects', href: '#work', icon: LayoutGrid }],
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
          { label: 'About', description: 'The team and the story behind the name.', href: '#about', icon: Users },
        ],
      },
      {
        heading: 'Get in touch',
        items: [{ label: 'Book a call', href: '#contact', icon: MessageSquare }],
      },
    ],
  },
]

export const NAV_LINKS = [{ label: 'Contact', href: '#contact' }]
