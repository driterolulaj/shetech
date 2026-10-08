// The built-in palette plus your own variables. Everything not listed here
// (accent, ink, surface, mesh… and the 16 templates) comes from the package.
import { defaultSchema, defineSchema } from 'palette-editor'

export default defineSchema({
  extends: defaultSchema,
  groups: [
    // Added to the existing "Brand" group → --highlight
    { label: 'Brand', tokens: { highlight: { label: 'Highlight', default: '#ffcc00' } } },
    // A new group → --chart-1, --chart-2 (one colour per theme)
    {
      label: 'Charts',
      tokens: {
        chart1: { label: 'Series 1', default: { light: '#2563eb', dark: '#60a5fa' } },
        chart2: { label: 'Series 2', default: { light: '#db2777', dark: '#f472b6' } },
      },
    },
  ],
  // Optional: drop built-in tokens you don't use
  // remove: ['logoMark', 'logoPrimary', 'logoLight', 'logoDeep'],
})
