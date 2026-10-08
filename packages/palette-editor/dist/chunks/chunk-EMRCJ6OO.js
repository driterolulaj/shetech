import {
  notifyPaletteChange,
  notifyPaletteShift
} from "./chunk-CNVRNEOK.js";

// src/randomizer.js
var browser = typeof window !== "undefined";
var config = browser ? window.__paletteRandomizer ?? null : null;
var root = browser ? document.documentElement : null;
var reduce = browser ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
var timer = 0;
var paused = false;
var settle = () => new Promise((resolve) => setTimeout(resolve, 60));
var shiftEnd = 0;
var setPalette = (name) => name ? root.setAttribute("data-palette", name) : root.removeAttribute("data-palette");
function show(name, { gradual = false } = {}) {
  const fadeMs = (config.fadeSeconds ?? 0) * 1e3;
  const calm = reduce.matches || document.hidden;
  if (gradual && fadeMs && !calm) {
    window.clearTimeout(shiftEnd);
    root.classList.add("palette-shifting");
    setPalette(name);
    notifyPaletteShift(fadeMs);
    shiftEnd = window.setTimeout(() => root.classList.remove("palette-shifting"), fadeMs + 100);
    return;
  }
  window.clearTimeout(shiftEnd);
  root.classList.remove("palette-shifting");
  const apply = async () => {
    setPalette(name);
    notifyPaletteChange();
    await settle();
  };
  if (document.startViewTransition && !calm) document.startViewTransition(apply);
  else apply();
}
function shufflePalette({ gradual = false } = {}) {
  if (!config) return;
  const current = root.getAttribute("data-palette");
  const options = config.names.filter((n) => n !== current);
  show(options[Math.floor(Math.random() * options.length)], { gradual });
}
function sync() {
  window.clearInterval(timer);
  timer = 0;
  if (config?.everySeconds && !paused && !document.hidden && !reduce.matches) {
    timer = window.setInterval(() => shufflePalette({ gradual: true }), config.everySeconds * 1e3);
  }
}
function setRandomizerPaused(value) {
  if (!config || paused === value) return;
  paused = value;
  if (paused) show(null);
  else if (config.onRefresh) shufflePalette();
  sync();
}
var randomizerActive = Boolean(config);
if (config) {
  document.addEventListener("visibilitychange", sync);
  reduce.addEventListener("change", sync);
  sync();
}

export {
  shufflePalette,
  setRandomizerPaused,
  randomizerActive
};
