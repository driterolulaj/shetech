/**
 * Turns src/assets/she-tech-logo.svg into:
 *   - src/components/brand/logoArt.js   path data + colour roles for the themeable <Logo />
 *   - public/favicon.svg                the icon with fixed colours (light/dark aware)
 *
 * Run after replacing the logo file:  npm run logo
 *
 * Each original fill is mapped to a palette role, so the logo follows
 * src/config/palette.json (logoMark, logoPrimary, logoLight, logoDeep).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { bandWidth, fitEllipse, refineEllipse, samplePath } from './fit-logo.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const svg = fs.readFileSync(path.join(root, 'src/assets/she-tech-logo.svg'), 'utf8')

// Original colour → palette role
const ROLES = {
  'rgb(251,251,251)': 'mark',
  'rgba(250, 249, 251, 1)': 'mark',
  'rgba(143, 69, 199, 1)': 'primary',
  'rgba(165, 111, 230, 1)': 'light',
  'rgba(89, 42, 135, 1)': 'deep',
}

// Gradient stops expressed as mixes of the three logo purples (close to the originals)
const GRADIENT_STOPS = {
  Gradient1: [['primary', 'light', 0.1], ['light', 'primary', 0]], // #884dc7 → #ab72e7
  Gradient2: [['primary', 'deep', 0.25], ['primary', 'light', 0.05]], // #8831b2 → #9652ca
  Gradient3: [['primary', 'deep', 0.35], ['light', 'primary', 0.05]], // #8226a6 → #a36ce3
}

// Split into the two nested <svg> blocks: wordmark (first) and icon (second)
const blocks = [...svg.matchAll(/<svg[^>]*viewBox="([^"]+)"[^>]*preserveAspectRatio="none">([\s\S]*?)<\/svg>/g)]
if (blocks.length !== 2) throw new Error(`Expected 2 inner <svg> blocks, found ${blocks.length}`)

const readPaths = (body) =>
  [...body.matchAll(/<path([^>]*)\/?>/g)].map(([, attrs]) => {
    const fill = attrs.match(/fill="([^"]+)"/)[1]
    const d = attrs.match(/ d="([^"]+)"/)[1]
    const gradient = fill.match(/url\(#(\w+)\)/)?.[1]
    const role = gradient ?? ROLES[fill]
    if (!role) throw new Error(`Unmapped logo colour: ${fill}`)
    return { role, d }
  })

const gradients = [...svg.matchAll(/<linearGradient id="(\w+)"[^>]*x1="([^"]+)" y1="([^"]+)" x2="([^"]+)" y2="([^"]+)"/g)].map(
  ([, id, x1, y1, x2, y2]) => ({ id, x1, y1, x2, y2, stops: GRADIENT_STOPS[id] }),
)

/**
 * Exact bounding box of a path (absolute M / L / C / z only), found by sampling
 * each cubic curve. Control points overshoot the real shape, so they can't be used.
 */
function exactBox(d) {
  const tokens = d.match(/[MLCz]|-?\d*\.?\d+(?:e-?\d+)?/gi)
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  const add = (x, y) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y) }
  let cmd = null, cx = 0, cy = 0, i = 0
  const num = () => Number(tokens[i++])
  while (i < tokens.length) {
    if (/[a-z]/i.test(tokens[i])) cmd = tokens[i++]
    if (cmd === 'z' || cmd === 'Z') continue
    if (cmd === 'M' || cmd === 'L') {
      cx = num(); cy = num(); add(cx, cy)
    } else if (cmd === 'C') {
      const [ax, ay, bx, by, ex, ey] = [num(), num(), num(), num(), num(), num()]
      for (let s = 1; s <= 48; s++) {
        const t = s / 48, u = 1 - t
        add(u ** 3 * cx + 3 * u * u * t * ax + 3 * u * t * t * bx + t ** 3 * ex, u ** 3 * cy + 3 * u * u * t * ay + 3 * u * t * t * by + t ** 3 * ey)
      }
      cx = ex; cy = ey
    } else throw new Error(`Unsupported path command "${cmd}"; extend exactBox()`)
  }
  const r = (v) => Math.round(v * 100) / 100
  return [r(x0), r(y0), r(x1), r(y1)]
}

const [wordmark, icon] = blocks.map(([, viewBox, body]) => ({
  viewBox,
  paths: readPaths(body).map((p) => ({ ...p, box: exactBox(p.d) })),
}))

// The first icon path is the outer ring: its exact centre is the logo's pivot
const [rx0, ry0, rx1, ry1] = icon.paths[0].box
const ring = { cx: (rx0 + rx1) / 2, cy: (ry0 + ry1) / 2, r: Math.max(rx1 - rx0, ry1 - ry0) / 2 }

/**
 * The animated logo spins its rings independently. In the artwork they are
 * woven (broken where the white orbit passes), so spinning the original pieces
 * would expose the breaks. Instead each ring is refit as one solid ellipse.
 * Piece indices refer to the icon's paths in the artwork; update them if the
 * logo file changes (see the README).
 */
const SOLID_PARTS = {
  middleRing: [2, 3, 6, 9, 10, 11, 12, 15, 16, 19, 20, 21, 26],
  innerOval: [4, 14, 17, 18, 23, 27],
  orbit: [5, 8, 13],
}
const round1 = (v) => Math.round(v * 10) / 10
const solid = Object.fromEntries(
  Object.entries(SOLID_PARTS).map(([name, ids]) => {
    const points = ids.flatMap((i) => samplePath(icon.paths[i].d, 48).flat())
    const guess = fitEllipse(points, { x: ring.cx, y: ring.cy })
    const a = refineEllipse(points, guess, 6000)
    const b = refineEllipse(points, { ...guess, rx: guess.ry, ry: guess.rx, angle: guess.angle + 90 }, 6000)
    const e = a.rms < b.rms ? a : b
    const widths = ids.map((i) => bandWidth(samplePath(icon.paths[i].d))).sort((x, y) => x - y)
    const width = widths[Math.floor(widths.length / 2)]
    return [name, { cx: round1(e.cx), cy: round1(e.cy), rx: round1(e.rx), ry: round1(e.ry), angle: round1(e.angle), width: round1(width) }]
  }),
)

/**
 * The white orbit is woven too: its upper-right section is missing in the
 * artwork because it passed behind the purple rings. With those rings now
 * spinning underneath, the hole would show, so bridge it with a smooth curve.
 *
 * Anchors are approximate points on the white band (artwork coordinates);
 * each is snapped to the band's centreline, and the curve follows the band's
 * direction on both sides. Update them if the logo file changes.
 */
const WHITE_BRIDGES = [
  {
    // from where the orbit dives behind the bolt (snapped clear of the bolt,
    // then carried 130 units along the band so the join hides under the bolt) …
    from: { at: [860, 672], towards: [640, 593], extend: 130 },
    // … to where it reappears on the right
    to: { at: [1660, 1115], towards: [1775, 1200] },
  },
]
const whiteOutline = samplePath(icon.paths.find((p) => p.role === 'mark').d, 48).flat()
/** Centreline point near (x, y): average of the band's outline points close by. */
const snap = ([x, y]) => {
  let near = []
  for (const radius of [26, 40, 60]) {
    near = whiteOutline.filter(([px, py]) => Math.hypot(px - x, py - y) < radius)
    if (near.length >= 4) break
  }
  if (!near.length) throw new Error(`No white-orbit outline near ${x},${y}; adjust WHITE_BRIDGES`)
  return [near.reduce((s, p) => s + p[0], 0) / near.length, near.reduce((s, p) => s + p[1], 0) / near.length]
}
const unit = ([x, y]) => { const l = Math.hypot(x, y); return [x / l, y / l] }
const whiteWidth = round1(
  // the band's thickness near the bridge's right anchor
  (() => {
    const [x, y] = snap(WHITE_BRIDGES[0].to.towards)
    const near = whiteOutline.filter(([px, py]) => Math.hypot(px - x, py - y) < 60)
    const d = near.map(([px, py]) => Math.hypot(px - x, py - y)).sort((a, b) => a - b)
    return Math.max(12, d[0] * 2)
  })(),
)
const whiteOrbit = {
  width: whiteWidth,
  bridges: WHITE_BRIDGES.map(({ from, to }) => {
    const a0 = snap(from.at)
    const a3 = snap(to.at)
    // directions pointing *into* the gap from each side
    const d0 = unit([a0[0] - snap(from.towards)[0], a0[1] - snap(from.towards)[1]])
    const d3 = unit([a3[0] - snap(to.towards)[0], a3[1] - snap(to.towards)[1]])
    const p0 = [a0[0] + d0[0] * (from.extend ?? 0), a0[1] + d0[1] * (from.extend ?? 0)]
    const p3 = [a3[0] + d3[0] * (to.extend ?? 0), a3[1] + d3[1] * (to.extend ?? 0)]
    const span = Math.hypot(p3[0] - p0[0], p3[1] - p0[1]) * 0.38
    const p1 = [p0[0] + d0[0] * span, p0[1] + d0[1] * span]
    const p2 = [p3[0] + d3[0] * span, p3[1] + d3[1] * span]
    const pt = (p) => p.map(round1).join(' ')
    return `M ${pt(p0)} C ${pt(p1)} ${pt(p2)} ${pt(p3)}`
  }),
}

// Small white fragments that lie along a bridge (leftovers of the weave) would
// poke out of the new line at a slightly different angle: hide them.
const bridgePoints = whiteOrbit.bridges.flatMap((d) => samplePath(d, 120).flat())
icon.paths.forEach((p, i) => {
  if (p.role !== 'mark' || i === icon.paths.findIndex((q) => q.role === 'mark')) return
  const pts = samplePath(p.d, 12).flat()
  const alongBridge = pts.every(([x, y]) => bridgePoints.some(([bx, by]) => Math.hypot(bx - x, by - y) < 40))
  if (alongBridge) p.hidden = true
})

fs.writeFileSync(
  path.join(root, 'src/components/brand/logoArt.js'),
  `// Generated by scripts/build-logo.mjs from src/assets/she-tech-logo.svg. Do not edit by hand.\n` +
    `export const WORDMARK = ${JSON.stringify(wordmark)}\n` +
    `export const ICON = ${JSON.stringify({ ...icon, gradients, ring, solid, whiteOrbit })}\n`,
)

// Favicon: original purples; the white mark turns navy on light browser chrome
const original = { primary: '#8f45c7', light: '#a56fe6', deep: '#592a87' }
const mix = ([a, b, t]) => {
  const p = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  const [x, y] = [p(original[a]), p(original[b])]
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('')}`
}
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${icon.viewBox}">
<style>.mark{fill:#0a2540}@media (prefers-color-scheme: dark){.mark{fill:#fbfbfb}}</style>
<defs>${gradients
  .map((g) => `<linearGradient id="${g.id}" gradientUnits="userSpaceOnUse" x1="${g.x1}" y1="${g.y1}" x2="${g.x2}" y2="${g.y2}"><stop offset="0" stop-color="${mix(g.stops[0])}"/><stop offset="1" stop-color="${mix(g.stops[1])}"/></linearGradient>`)
  .join('')}</defs>
${icon.paths
  .map(({ role, d }) =>
    role === 'mark' ? `<path class="mark" d="${d}"/>` : `<path fill="${original[role] ? original[role] : `url(#${role})`}" d="${d}"/>`,
  )
  .join('\n')}
</svg>
`
fs.mkdirSync(path.join(root, 'public'), { recursive: true })
fs.writeFileSync(path.join(root, 'public/favicon.svg'), favicon)

console.log(`Logo: ${wordmark.paths.length} wordmark paths, ${icon.paths.length} icon paths, ${gradients.length} gradients → logoArt.js + favicon.svg`)
