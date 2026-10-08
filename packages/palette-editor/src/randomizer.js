/**
 * Palette randomizer, the timed half. The Vite plugin embeds the templates in
 * the mix as CSS scoped to <html data-palette="…"> and an inline script that may
 * already have picked one on load; this switches to another template every
 * `everySeconds`, letting every colour drift over `fadeSeconds`.
 *
 * Import it once in your entry file: import 'palette-editor/randomizer'
 *
 * Timed switching stays off for prefers-reduced-motion and pauses while the tab
 * is hidden. <PaletteEditor /> pauses it (showing the base palette) while open.
 */
import { notifyPaletteChange, notifyPaletteShift } from './core/browser.js'

const browser = typeof window !== 'undefined'
const config = browser ? (window.__paletteRandomizer ?? null) : null
const root = browser ? document.documentElement : null
const reduce = browser ? window.matchMedia('(prefers-reduced-motion: reduce)') : null
let timer = 0
let paused = false

// Rendering is paused inside a view-transition update, so wait on a timer, not on frames
const settle = () => new Promise((resolve) => setTimeout(resolve, 60))
let shiftEnd = 0

const setPalette = (name) => (name ? root.setAttribute('data-palette', name) : root.removeAttribute('data-palette'))

/**
 * Show a template (null = the base palette).
 * gradual: every colour drifts to the new palette over fadeSeconds (CSS transitions on the
 * registered colour variables, see paletteShiftCss); canvases can follow via onPaletteShift.
 * Otherwise: a quick cross-fade, or an instant swap for reduced motion / hidden tabs.
 */
function show(name, { gradual = false } = {}) {
  const fadeMs = (config.fadeSeconds ?? 0) * 1000
  const calm = reduce.matches || document.hidden

  if (gradual && fadeMs && !calm) {
    window.clearTimeout(shiftEnd)
    root.classList.add('palette-shifting')
    setPalette(name)
    notifyPaletteShift(fadeMs)
    shiftEnd = window.setTimeout(() => root.classList.remove('palette-shifting'), fadeMs + 100)
    return
  }

  // Stop any drift in progress so the new colours land at once
  window.clearTimeout(shiftEnd)
  root.classList.remove('palette-shifting')
  const apply = async () => {
    setPalette(name)
    notifyPaletteChange()
    await settle() // give canvas backgrounds time to recolour before the "after" snapshot
  }
  if (document.startViewTransition && !calm) document.startViewTransition(apply)
  else apply()
}

/** Switch to a random template other than the one showing. */
export function shufflePalette({ gradual = false } = {}) {
  if (!config) return
  const current = root.getAttribute('data-palette')
  const options = config.names.filter((n) => n !== current)
  show(options[Math.floor(Math.random() * options.length)], { gradual })
}

function sync() {
  window.clearInterval(timer)
  timer = 0
  if (config?.everySeconds && !paused && !document.hidden && !reduce.matches) {
    timer = window.setInterval(() => shufflePalette({ gradual: true }), config.everySeconds * 1000)
  }
}

/** While paused the base palette shows and nothing changes; used by the colour editor. */
export function setRandomizerPaused(value) {
  if (!config || paused === value) return
  paused = value
  if (paused) show(null)
  else if (config.onRefresh) shufflePalette() // back to a random one, as on a fresh load
  sync()
}

export const randomizerActive = Boolean(config)

if (config) {
  document.addEventListener('visibilitychange', sync)
  reduce.addEventListener('change', sync)
  sync()
}
