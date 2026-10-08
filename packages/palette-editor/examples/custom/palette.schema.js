// A palette described from scratch (no built-in tokens or templates). Copy this file and palette.defaults.json into your project.
import { defineSchema, deriveAccent } from 'palette-editor'

export default defineSchema({
  groups: [
    { label: 'Brand', tokens: { accent: 'Accent', accentStrong: 'Accent hover', accentWash: 'Accent wash' } },
    { label: 'Text', tokens: { text: 'Body text', textMuted: 'Muted text' } },
    { label: 'Surfaces', tokens: { background: 'Page', surface: 'Cards', border: 'Borders' } },
  ],
  // Optional: a list of colours, e.g. for a gradient → --gradient-0, --gradient-1, --gradient-2
  lists: [{ key: 'gradient', label: 'Gradient', items: ['Start', 'Middle', 'End'] }],
  swatches: ['background', 'text', 'accent', 'gradient'],
  links: [
    {
      label: 'Derive hover and wash from the accent',
      from: 'accent',
      derive: ({ value, colors, theme }) => {
        const { strong, wash } = deriveAccent(value, colors.background, theme)
        return { accentStrong: strong, accentWash: wash }
      },
    },
  ],
})
