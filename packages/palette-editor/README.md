# palette-editor

A live colour-scheme editor for **Vite + React** sites. Extracted from the She Tech site (`web/`), and it ships with that site's colour palette as the default.

- Colours become CSS variables (`--accent`, `--ink-2`, …), inlined into every HTML page, so the first paint already has the right colours (dev and production).
- In development, a **Colours** button opens an editor panel. Changes preview live, and **Save to file** writes them to `src/config/palette.json`.
- **Ready to use:** a complete light/dark palette (23 colour variables plus a 4-colour gradient) and **16 templates** come built in. You don't need any config files.
- **Add your own variables** next to the built-in ones, or remove the ones you don't need.
- An optional **randomizer** shows a random template on each visit or drifts between templates every N seconds. It also works on the live site.

The editor brings its own CSS and icons. Your project doesn't need Tailwind or an icon library, and the panel's styles don't leak into your site.

---

## Quick start (built-in palette)

**1. Install** (from your other project's folder; adjust the path):

```bash
npm install --install-links ../path/to/shetech/packages/palette-editor
```

`--install-links` copies the package into your project, so React is never loaded twice. Needs `react` ≥ 18 and `vite` ≥ 5.

**2. Add the plugin** to `vite.config.js`:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import palette from 'palette-editor/vite'

export default defineConfig({
  plugins: [react(), palette()],
})
```

**3. Show the editor in development** (e.g. in `src/App.jsx`):

```jsx
import { lazy, Suspense } from 'react'

const PaletteEditor = import.meta.env.DEV ? lazy(() => import('palette-editor/react')) : null

export default function App() {
  return (
    <>
      {/* your app */}
      {PaletteEditor && (
        <Suspense fallback={null}>
          <PaletteEditor />
        </Suspense>
      )}
    </>
  )
}
```

**4. Use the variables** in your CSS:

```css
body       { background: var(--surface); color: var(--ink); }
p          { color: var(--ink-2); }
.btn       { background: var(--accent); }
.btn:hover { background: var(--accent-strong); }
.card      { background: rgb(var(--glass-rgb) / 0.6); border: 1px solid var(--line); }
.hero      { background: linear-gradient(135deg, var(--mesh-0), var(--mesh-1), var(--mesh-2), var(--mesh-3)); }
```

Run `npm run dev` and click **Colours** in the bottom-right corner. That's it. The first **Save to file** creates `src/config/palette.json`, and the production build uses whatever is in that file.

### The built-in variables

| Group | Variables |
|---|---|
| Brand | `--accent` `--accent-strong` (hover) `--accent-wash` (tinted background) `--secondary` |
| Text | `--ink` (headings) `--ink-2` (body) `--ink-3` (muted) |
| Surfaces | `--surface` (page) `--canvas` (tinted panels) `--glass-rgb` (as `r g b`, use `rgb(var(--glass-rgb) / 0.5)`) `--line` `--line-strong` `--line-hover` |
| Logo | `--logo-mark` `--logo-primary` `--logo-light` `--logo-deep` |
| Status | `--success` `--success-wash` `--warn` `--warn-wash` `--danger` `--danger-wash` |
| Hero gradient | `--mesh-0` `--mesh-1` `--mesh-2` `--mesh-3` |

The default colours are in [`presets/default/palette.defaults.json`](presets/default/palette.defaults.json).

**Built-in templates:** calm, clay-rose, coastal, colorblind-blue-yellow, colorblind-red-green, crimson-harbor, dyslexia-friendly, ember-tide, graphite, green, harvest, high-contrast, purple, rosewood, sage-lagoon, sunset. Pick one in the panel to preview it, then **Save to file** to use it.

Built-in templates are read-only (they have no delete button). If you save a template under the same name, your copy replaces the built-in one. To hide them all, use `palette({ builtinTemplates: false })`.

---

## Adding your own variables

Create `src/palette.schema.js` that **extends** the built-in schema:

```js
import { defaultSchema, defineSchema } from 'palette-editor'

export default defineSchema({
  extends: defaultSchema,
  groups: [
    // Added to the existing "Brand" group → --highlight (same colour in light and dark)
    { label: 'Brand', tokens: { highlight: { label: 'Highlight', default: '#ffcc00' } } },

    // A new group in the editor → --chart-1, --chart-2 (a colour per theme)
    {
      label: 'Charts',
      tokens: {
        chart1: { label: 'Series 1', default: { light: '#2563eb', dark: '#60a5fa' } },
        chart2: { label: 'Series 2', default: { light: '#db2777', dark: '#f472b6' } },
      },
    },
  ],

  // Optional: built-in variables you don't need
  remove: ['logoMark', 'logoPrimary', 'logoLight', 'logoDeep'],
})
```

Then pass it to **both** the plugin and the editor:

```js
// vite.config.js
import schema from './src/palette.schema.js'
palette({ schema })
```

```jsx
// App.jsx
import schema from './palette.schema.js'
<PaletteEditor schema={schema} />
```

What happens:

- **New variables** get their `default` colour everywhere: in the live palette, in every template (built-in or yours), and when you reset. You don't have to edit any JSON.
- They appear in the editor under their group, and the values you pick are saved to `palette.json` like the others.
- **Naming:** the token key becomes the variable. `highlight` → `--highlight`, `buttonText` → `--button-text`, `chart1` → `--chart-1`.
- **Same group label = same section.** Use `'Brand'`, `'Text'`, `'Surfaces'`, `'Logo'`, `'Status'` to add to a built-in group, or any other label for a new one.
- **Change a built-in variable** by listing its key again. `accent: 'Brand colour'` renames it in the editor, and `accent: { default: '#e11d48' }` changes its default.
- **Removing** a variable drops it from the CSS and the editor. A group that ends up empty disappears.

### Token options

| Option | |
|---|---|
| `label` | Shown in the editor. A plain string (`highlight: 'Highlight'`) is just the label. |
| `default` | `'#ffcc00'` for every theme, or `{ light: '…', dark: '…' }`. Hex only: `#rgb`, `#rrggbb`, or `#rrggbbaa` for transparency. |
| `alpha` | `false` hides the opacity field. |
| `css` | `'color'` (default) → `--x: #hex`. `'rgb'` → `--x-rgb: r g b` only. `'both'` → both. |

### Other schema options

| Option | |
|---|---|
| `lists` | Colour lists, e.g. `{ key: 'stops', label: 'Gradient stops', items: ['Start', 'End'], default: ['#000000', '#ffffff'] }` → `--stops-0`, `--stops-1` |
| `links` | Checkboxes that update other colours when one changes. See "Linked colours" below. |
| `remove` | Keys of inherited tokens/lists to drop. |
| `themes` | Theme names. Default `['light', 'dark']`. The first goes on `:root`, the others on `[data-theme="…"]`. |
| `themeAttribute` | The `<html>` attribute that picks the theme. Default `'data-theme'`. |
| `prefix` | Prefix every variable: `prefix: 'brand-'` → `--brand-accent`. |
| `accent` | The token shown as a dot beside each template in the randomizer. |
| `swatches` | Token/list keys shown as the colour strip on each template. |
| `preset` | `null` turns off the built-in templates for this schema. |

### Linked colours

The built-in schema has two links, both on by default and toggled with a checkbox in the editor:

- **Brand:** "Derive hover and wash from the accent": changing `accent` also sets `accentStrong` and `accentWash`.
- **Logo:** "Follow the accent colour": changing `accent` also sets the three logo colours.

You can add your own:

```js
import { defaultSchema, defineSchema, mixHex } from 'palette-editor'

export default defineSchema({
  extends: defaultSchema,
  groups: [{ label: 'Brand', tokens: { highlight: { label: 'Highlight', default: '#ffcc00' } } }],
  links: [
    {
      label: 'Highlight follows the accent',
      from: 'accent',                 // when this changes…
      group: 'Brand',                 // …show the checkbox in this section
      derive: ({ value, colors, theme }) => ({ highlight: mixHex(value, '#ffffff', 0.6) }),
    },
  ],
})
```

Colour helpers you can use in `derive`: `mixHex(a, b, t)`, `deriveAccent(accent, surface, theme)` → `{ strong, wash }`, `deriveShades(color)` → `{ light, base, deep }`, `parseHex`, `toHex`.

---

## Starting from scratch instead

If you don't want the built-in palette at all, leave out `extends` and describe every token yourself:

```js
import { defineSchema } from 'palette-editor'

export default defineSchema({
  groups: [
    { label: 'Brand', tokens: { accent: { label: 'Accent', default: { light: '#533afd', dark: '#8a7dff' } } } },
    { label: 'Text', tokens: { text: { label: 'Body text', default: { light: '#0f1b2d', dark: '#edf1f8' } } } },
    { label: 'Surfaces', tokens: { background: { label: 'Page', default: { light: '#ffffff', dark: '#0b1020' } } } },
  ],
})
```

Instead of `default` values, you can also keep the colours in `src/config/palette.defaults.json` (see [`examples/custom/`](examples/custom)). A schema without `extends` has no built-in templates.

---

## Where the files go

None of these files has to exist. The plugin falls back to the schema's defaults and the built-in templates.

| File | |
|---|---|
| `src/config/palette.json` | The live palette (what the site is built from). Created by **Save to file**. |
| `src/config/palette.defaults.json` | Your own "original colours" for **Reset**. Optional. Overrides the schema's defaults, and can list only some tokens. |
| `src/config/palettes/<name>.json` | Your templates. Created by **Save as template**. |
| `src/config/palette.randomizer.json` | Randomizer settings. Created by **Save randomizer**. |

Want to own the built-in colours and templates as editable files? Run:

```bash
npx palette-editor init     # copies palette.defaults.json and the 16 templates into src/config/ (never overwrites)
```

### Plugin options

| Option | Default |
|---|---|
| `schema` | the built-in `defaultSchema` |
| `palette` | `'src/config/palette.json'` |
| `defaults` | `'src/config/palette.defaults.json'` |
| `templates` | `'src/config/palettes'` |
| `builtinTemplates` | `true` |
| `randomizer` | `'src/config/palette.randomizer.json'`, or `false` to leave the randomizer out |
| `randomizerSkip` | Pages that always use the saved palette, e.g. `/admin\.html$/` |
| `endpoint` | `'/__palette'` (the dev-only API the editor talks to) |
| `styleId` | `'palette'` (id of the injected `<style>`) |

Paths are relative to the Vite root.

### Editor props

| Prop | Default | |
|---|---|---|
| `schema` | the built-in `defaultSchema` | The same schema as the plugin |
| `theme` / `onThemeChange` | reads/sets `<html data-theme>` | Pass your own theme state (e.g. `theme={theme} onThemeChange={setThemePreference}`) so the theme tabs also remember the choice the way your site does |
| `side` | `'right'` | `'left'` puts the button and panel in the bottom-left corner |
| `defaultOpen` | `false` | |
| `title`, `buttonLabel`, `subtitle` | `'Colour scheme'`, `'Colours'`, `'Only visible in development.'` | |
| `endpoint`, `styleId` | `'/__palette'`, `'palette'` | Must match the plugin's |
| `injectStyles` | `true` | `false` = add `editorCss` (exported from `palette-editor/react`) yourself |

**Restyling the panel:** override its CSS variables, e.g. to use your site's accent and font:

```css
.pe-root { --pe-accent: var(--accent); --pe-font: inherit; --pe-radius: 8px; }
```

---

## Dark mode

The dark colours apply when `<html data-theme="dark">`. The editor's Light/Dark tabs set that attribute. To follow the visitor's system setting without a flash, put this in your `index.html` `<head>`:

```html
<script>
  try {
    var t = localStorage.getItem('theme')
    var dark = t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  } catch (e) {}
</script>
```

## Tailwind CSS

Map the variables once and use them as utilities (`bg-accent`, `text-ink-2`, `border-line`):

```css
@import "tailwindcss";
@source not "./config/*.json"; /* saving from the editor shouldn't trigger a Tailwind rebuild */

@theme inline {
  --color-accent: var(--accent);
  --color-accent-strong: var(--accent-strong);
  --color-ink: var(--ink);
  --color-ink-2: var(--ink-2);
  --color-surface: var(--surface);
  --color-line: var(--line);
  /* …and your own: --color-highlight: var(--highlight); */
}
```

## Randomizer

Turn it on in the panel (section **Randomizer**, then **Save randomizer**), or by hand in `src/config/palette.randomizer.json`:

```json
{ "onRefresh": true, "everySeconds": 30, "fadeSeconds": 4, "exclude": ["high-contrast"] }
```

| Setting | |
|---|---|
| `onRefresh` | Pick a random template on every page load. It's picked before the first paint, so there's no flash. |
| `everySeconds` | Switch template every N seconds (3–3600, `0` = off). |
| `fadeSeconds` | How long each timed switch drifts from one palette to the next (0–60; `0` = quick cross-fade). |
| `exclude` | Template names left out of the mix. By default the accessibility templates (calm, colorblind-*, dyslexia-friendly, high-contrast) are left out. |

For the timed switching, import the runtime once in your entry file:

```js
// src/main.jsx
import 'palette-editor/randomizer'
```

Timed changes pause in background tabs and stay off for visitors who prefer reduced motion. The randomizer also pauses while the editor panel is open.

## Canvas / WebGL backgrounds

CSS updates itself. Anything that reads colours in JavaScript can follow along:

```js
import { defaultSchema, onPaletteChange, onPaletteShift, readListColors } from 'palette-editor'

const recolor = () => gradient.setColors(readListColors(defaultSchema, 'mesh'))
onPaletteChange(recolor) // editor previews, template switches
onPaletteShift((ms) => { /* a gradual drift lasting `ms` started: recolor every frame until it ends */ })
```

Also exported: `readColor(schema, key)`, `schemaDefaults(schema)`, `paletteToCss`, `validatePalette` and the colour helpers.

## CLI

```bash
npx palette-editor list            # your templates and the built-in ones
npx palette-editor use purple      # make a template the live palette (palette.json)
npx palette-editor reset           # back to your defaults file, or the built-in defaults
npx palette-editor init            # copy the built-in defaults and templates into src/config/ to edit
# options: --dir src/config | --palette <file> --defaults <file> --templates <dir>, --no-builtin
```

Handy as package scripts: `"palette:use": "palette-editor use"`, `"palette:reset": "palette-editor reset"`.

## Other ways to install

```bash
# A tarball, e.g. to share or keep a fixed version
cd packages/palette-editor && npm pack     # → palette-editor-0.1.0.tgz
npm install ../path/to/palette-editor-0.1.0.tgz
```

If you install it as a symlink (plain `npm install ../path` or `npm link`), add `resolve: { dedupe: ['react', 'react-dom'] }` to your Vite config.

---

## Dev API (what the editor talks to)

Served by the plugin in `vite dev` only:

| Request | |
|---|---|
| `GET /__palette` | `{ palette, defaults, templates: [{ name, palette, builtin }], randomizer, files }` |
| `PUT /__palette/` | Validate and save the posted palette to `palette.json` |
| `POST /__palette/reset` | Write the defaults to `palette.json` |
| `PUT /__palette/templates/<name>` | Save the posted palette as a template (`a-z`, `0-9`, `-`) |
| `DELETE /__palette/templates/<name>` | Delete one of your templates (built-in ones can't be deleted) |
| `PUT /__palette/randomizer` | Save the randomizer settings (the page then reloads) |

Editing `palette.json` by hand also reloads the page.

## Developing this package

```bash
npm install       # also builds dist/
npm run build     # src/ → dist/ (esbuild)
npm test          # includes a check that the built-in palette gives byte-identical CSS to web/
```

To change the built-in palette, edit [`presets/default/`](presets/default) (colours and templates) and [`src/preset.js`](src/preset.js) (labels and links), then rebuild.
