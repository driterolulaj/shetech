/**
 * The built-in palette (from the She Tech site): 23 colour tokens plus a
 * 4-colour gradient, with light and dark defaults and 16 templates
 * (presets/default/palettes). Used when no schema is given; extend it with
 * defineSchema({ extends: defaultSchema, … }) to add your own variables.
 *
 * CSS variables: --accent --accent-strong --accent-wash --secondary
 *   --ink --ink-2 --ink-3 --surface --canvas --glass-rgb --line --line-strong --line-hover
 *   --logo-mark --logo-primary --logo-light --logo-deep
 *   --success --success-wash --warn --warn-wash --danger --danger-wash --mesh-0 … --mesh-3
 */
import defaults from '../presets/default/palette.defaults.json'
import { deriveAccent, deriveShades } from './core/color.js'
import { defineSchema } from './core/schema.js'

/** { key: label } → { key: { label, default: { light, dark } } }, defaults from presets/default/palette.defaults.json */
const withDefaults = (labels, extra = {}) =>
  Object.fromEntries(
    Object.entries(labels).map(([key, label]) => [key, { label, default: { light: defaults.light[key], dark: defaults.dark[key] }, ...extra[key] }]),
  )

export const defaultSchema = defineSchema({
  themes: ['light', 'dark'],
  preset: 'default',
  groups: [
    { label: 'Brand', tokens: withDefaults({ accent: 'Accent', accentStrong: 'Accent hover', accentWash: 'Accent wash', secondary: 'Secondary' }) },
    { label: 'Text', tokens: withDefaults({ ink: 'Headings', ink2: 'Body text', ink3: 'Muted text' }) },
    {
      label: 'Surfaces',
      tokens: withDefaults(
        { surface: 'Page', canvas: 'Tinted panels', glass: 'Glass tint', line: 'Hairlines', lineStrong: 'Borders', lineHover: 'Borders (hover)' },
        { glass: { css: 'rgb' } },
      ),
    },
    { label: 'Logo', tokens: withDefaults({ logoMark: 'Wordmark & bolt', logoPrimary: 'Logo primary', logoLight: 'Logo light', logoDeep: 'Logo deep' }) },
    {
      label: 'Status',
      tokens: withDefaults({ success: 'Success', successWash: 'Success wash', warn: 'Warning', warnWash: 'Warning wash', danger: 'Error', dangerWash: 'Error wash' }),
    },
  ],
  lists: [
    { key: 'mesh', label: 'Hero gradient', items: ['Base', 'Layer 2', 'Layer 3', 'Top layer'], default: { light: defaults.light.mesh, dark: defaults.dark.mesh } },
  ],
  accent: 'accent',
  swatches: ['surface', 'ink', 'accent', 'mesh'],
  links: [
    {
      id: 'accent-shades',
      label: 'Derive hover and wash from the accent',
      from: 'accent',
      derive: ({ value, colors, theme }) => {
        const { strong, wash } = deriveAccent(value, colors.surface ?? '#ffffff', theme)
        return { accentStrong: strong, accentWash: wash }
      },
    },
    {
      id: 'logo-follows-accent',
      group: 'Logo',
      label: 'Follow the accent colour',
      from: 'accent',
      applyOnEnable: true,
      derive: ({ value }) => {
        const { light, base, deep } = deriveShades(value)
        return { logoPrimary: base, logoLight: light, logoDeep: deep }
      },
    },
  ],
})
