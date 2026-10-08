import {
  cssColorToHex,
  cssVar,
  defineSchema,
  paletteToCss
} from "./chunk-GY2PRZL3.js";

// src/core/browser.js
var EVENT = "palette:change";
var SHIFT_EVENT = "palette:shift";
function applyPalette(schema, palette, { styleId = "palette" } = {}) {
  let style = document.getElementById(styleId);
  if (!style) {
    style = Object.assign(document.createElement("style"), { id: styleId });
    document.head.prepend(style);
  }
  style.textContent = paletteToCss(schema, palette);
  notifyPaletteChange();
}
function notifyPaletteChange() {
  window.dispatchEvent(new Event(EVENT));
}
function onPaletteChange(listener) {
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
function notifyPaletteShift(duration) {
  window.dispatchEvent(new CustomEvent(SHIFT_EVENT, { detail: { duration } }));
}
function onPaletteShift(listener) {
  const handler = (e) => listener(e.detail.duration);
  window.addEventListener(SHIFT_EVENT, handler);
  return () => window.removeEventListener(SHIFT_EVENT, handler);
}
function readColor(schema, key, fallback = null) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(cssVar(defineSchema(schema), key)).trim();
  return value && cssColorToHex(value) || fallback;
}
function readListColors(schema, key, fallback = "#000000") {
  schema = defineSchema(schema);
  const list = schema.lists.find((l) => l.key === key);
  if (!list) throw new Error(`palette-editor: no list called "${key}" in the schema.`);
  const styles = getComputedStyle(document.documentElement);
  return list.items.map((_, i) => cssColorToHex(styles.getPropertyValue(`${cssVar(schema, key)}-${i}`).trim()) || fallback);
}

export {
  applyPalette,
  notifyPaletteChange,
  onPaletteChange,
  notifyPaletteShift,
  onPaletteShift,
  readColor,
  readListColors
};
