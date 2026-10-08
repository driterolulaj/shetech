// src/core/schema.js
var NORMALIZED = Symbol.for("palette-editor.schema");
var KEY = /^[a-zA-Z][a-zA-Z0-9]*$/;
var finishToken = (key, t) => ({ key, label: t.label ?? key, alpha: t.alpha ?? true, css: t.css ?? "color", default: t.default });
function finishList(key, l) {
  const items = typeof l.items === "number" ? Array.from({ length: l.items }, (_, i) => `Colour ${i + 1}`) : l.items;
  return { key, label: l.label ?? key, items, alpha: l.alpha ?? false, default: l.default };
}
function defineSchema(input) {
  if (input?.[NORMALIZED]) return input;
  const base = input?.extends ? defineSchema(input.extends) : null;
  if (!base && !input?.groups?.length) throw new Error("palette-editor: the schema needs at least one group of tokens.");
  const remove = new Set(input.remove ?? []);
  const seen = /* @__PURE__ */ new Set();
  const claim = (key) => {
    if (!KEY.test(key)) throw new Error(`palette-editor: "${key}" isn't a valid token name (letters and digits, starting with a letter).`);
    if (seen.has(key)) throw new Error(`palette-editor: the token "${key}" is defined twice.`);
    seen.add(key);
  };
  const groups = (base?.groups ?? []).map((g) => ({ label: g.label, tokens: [...g.tokens] }));
  for (const group of input.groups ?? []) {
    let target = groups.find((g) => g.label === group.label);
    if (!target) groups.push(target = { label: group.label, tokens: [] });
    for (const [key, value] of Object.entries(group.tokens ?? {})) {
      claim(key);
      const raw = typeof value === "string" ? { label: value } : value;
      const home = groups.find((g) => g.tokens.some((t) => t.key === key));
      if (home) home.tokens = home.tokens.map((t) => t.key === key ? finishToken(key, { ...t, ...raw }) : t);
      else target.tokens.push(finishToken(key, raw));
    }
  }
  for (const g of groups) g.tokens = g.tokens.filter((t) => !remove.has(t.key));
  const keptGroups = groups.filter((g) => g.tokens.length);
  const tokens = keptGroups.flatMap((g) => g.tokens);
  const lists = (base?.lists ?? []).map((l) => ({ ...l }));
  for (const list of input.lists ?? []) {
    claim(list.key);
    const i = lists.findIndex((l) => l.key === list.key);
    if (i === -1) lists.push(finishList(list.key, list));
    else lists[i] = finishList(list.key, { ...lists[i], ...list });
  }
  const keptLists = lists.filter((l) => !remove.has(l.key));
  for (const list of keptLists) {
    if (!list.items?.length) throw new Error(`palette-editor: the list "${list.key}" needs at least one item.`);
  }
  const keys = [...tokens.map((t) => t.key), ...keptLists.map((l) => l.key)];
  for (const key of keys) {
    if (keys.indexOf(key) !== keys.lastIndexOf(key)) throw new Error(`palette-editor: "${key}" is both a token and a list.`);
  }
  if (!tokens.length) throw new Error("palette-editor: the schema has no tokens left.");
  const groupOf = (key) => keptGroups.find((g) => g.tokens.some((t) => t.key === key))?.label ?? keptLists.find((l) => l.key === key)?.label;
  const links = (base?.links ?? []).filter((l) => !(input.links ?? []).some((n) => n.id && n.id === l.id));
  for (const link of input.links ?? []) {
    if (!keys.includes(link.from)) throw new Error(`palette-editor: link "${link.label}" follows an unknown token "${link.from}".`);
    links.push({
      id: link.id ?? `${link.from}:${link.label}`,
      label: link.label,
      from: link.from,
      group: link.group ?? groupOf(link.from),
      derive: link.derive,
      enabled: link.enabled ?? true,
      applyOnEnable: link.applyOnEnable ?? false
    });
  }
  const pick = (name, fallback) => name in input ? input[name] : base ? base[name] : fallback;
  const has = (key) => keys.includes(key);
  const swatches = (input.swatches ?? base?.swatches)?.filter(has);
  return Object.freeze({
    [NORMALIZED]: true,
    themes: pick("themes", ["light", "dark"]),
    themeAttribute: pick("themeAttribute", "data-theme"),
    prefix: pick("prefix", ""),
    // Built-in templates offered alongside the project's own (presets/<name>/palettes); null = none
    preset: pick("preset", null),
    groups: keptGroups,
    tokens,
    lists: keptLists,
    links: links.filter((l) => has(l.from)),
    // The brand colour: the dot beside each template in the randomizer's mix
    accent: [input.accent, base?.accent].find((k) => k && has(k)) ?? tokens[0].key,
    // Shown as a strip on each template: token keys, or list keys (all of the list's colours)
    swatches: swatches?.length ? swatches : [...keptGroups.map((g) => g.tokens[0].key), ...keptLists.map((l) => l.key)]
  });
}
var cssVar = (schema, key) => `--${schema.prefix}${key.replace(/([a-z])([A-Z0-9])/g, "$1-$2").toLowerCase()}`;
var forTheme = (value, theme) => value == null || typeof value === "string" || Array.isArray(value) ? value : value[theme];
function schemaDefaults(schema) {
  schema = defineSchema(schema);
  return Object.fromEntries(
    schema.themes.map((theme) => {
      const colors = {};
      for (const item of [...schema.tokens, ...schema.lists]) {
        const value = forTheme(item.default, theme);
        if (value !== void 0) colors[item.key] = Array.isArray(value) ? [...value] : value;
      }
      return [theme, colors];
    })
  );
}

// src/core/color.js
var HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
var isHexColor = (value) => typeof value === "string" && HEX.test(value);
function parseHex(hex) {
  let h = hex.slice(1);
  if (h.length <= 4) h = [...h].map((c) => c + c).join("");
  const n = (i) => parseInt(h.slice(i, i + 2), 16);
  return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? Math.round(n(6) / 255 * 100) / 100 : 1 };
}
var byte = (v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0");
var toHex = ({ r, g, b, a = 1 }) => `#${byte(r)}${byte(g)}${byte(b)}${a < 1 ? byte(a * 255) : ""}`;
var toHex6 = (hex) => toHex({ ...parseHex(hex), a: 1 });
function mixHex(a, b, t) {
  const x = parseHex(a);
  const y = parseHex(b);
  return toHex({ r: x.r + (y.r - x.r) * t, g: x.g + (y.g - x.g) * t, b: x.b + (y.b - x.b) * t });
}
function deriveShades(color) {
  const base = toHex6(color);
  return { light: mixHex(base, "#ffffff", 0.25), base, deep: mixHex(base, "#000000", 0.4) };
}
function deriveAccent(accent, surface, theme) {
  const base = toHex6(accent);
  return theme === "dark" ? { strong: mixHex(base, "#ffffff", 0.18), wash: `${base}24` } : { strong: mixHex(base, "#000000", 0.18), wash: mixHex(base, toHex6(surface), 0.93) };
}
function cssColorToHex(value) {
  if (isHexColor(value)) return toHex6(value);
  const n = value.match(/[\d.]+/g)?.map(Number);
  if (!n || n.length < 3) return null;
  const scale = value.startsWith("color(") ? 255 : 1;
  return toHex({ r: n[0] * scale, g: n[1] * scale, b: n[2] * scale });
}

// src/core/css.js
function themeBlock(schema, colors) {
  const vars = [];
  for (const t of schema.tokens) if (t.css !== "rgb") vars.push(`${cssVar(schema, t.key)}:${colors[t.key]};`);
  for (const t of schema.tokens) {
    if (t.css === "color") continue;
    const { r, g, b } = parseHex(colors[t.key]);
    vars.push(`${cssVar(schema, t.key)}-rgb:${r} ${g} ${b};`);
  }
  for (const list of schema.lists) {
    colors[list.key].forEach((c, i) => vars.push(`${cssVar(schema, list.key)}-${i}:${list.alpha ? c : toHex6(c)};`));
  }
  return vars.join("");
}
function paletteToCss(schema, palette, name) {
  schema = defineSchema(schema);
  const [base, ...others] = schema.themes;
  const scope = name ? `:root[data-palette="${name}"]` : ":root";
  const nested = name ? scope : "";
  return [
    `${scope}{${themeBlock(schema, palette[base])}}`,
    ...others.map((t) => `${nested}[${schema.themeAttribute}="${t}"]{${themeBlock(schema, palette[t])}}`)
  ].join("");
}
function withDefaults(schema, palette, defaults) {
  schema = defineSchema(schema);
  return Object.fromEntries(schema.themes.map((t) => [t, { ...defaults?.[t], ...palette?.[t] }]));
}
function validatePalette(schema, palette) {
  schema = defineSchema(schema);
  for (const theme of schema.themes) {
    const colors = palette?.[theme];
    if (!colors) return `Missing "${theme}" colours.`;
    for (const { key } of schema.tokens) {
      if (!isHexColor(colors[key])) return `"${theme}.${key}" must be a hex colour like #533afd (got ${JSON.stringify(colors[key])}).`;
    }
    for (const { key, items } of schema.lists) {
      if (!Array.isArray(colors[key]) || colors[key].length !== items.length || !colors[key].every(isHexColor)) {
        return `"${theme}.${key}" must be a list of ${items.length} hex colours.`;
      }
    }
  }
  return null;
}
function colorVars(schema) {
  return [
    ...schema.tokens.filter((t) => t.css !== "rgb").map((t) => cssVar(schema, t.key)),
    ...schema.lists.flatMap((l) => l.items.map((_, i) => `${cssVar(schema, l.key)}-${i}`))
  ];
}
function paletteShiftCss(schema, seconds) {
  const vars = colorVars(defineSchema(schema));
  const properties = vars.map((v) => `@property ${v}{syntax:'<color>';inherits:true;initial-value:transparent}`).join("");
  return `${properties}:root.palette-shifting{transition-property:${vars.join(",")};transition-duration:${seconds}s;transition-timing-function:cubic-bezier(0.45,0,0.55,1)}`;
}
var RANDOMIZER_DEFAULTS = { onRefresh: false, everySeconds: 0, fadeSeconds: 4, exclude: [] };
function validateRandomizer(settings) {
  if (typeof settings?.onRefresh !== "boolean") return '"onRefresh" must be true or false.';
  const s = settings.everySeconds;
  if (!Number.isInteger(s) || s !== 0 && (s < 3 || s > 3600)) return '"everySeconds" must be 0 (off) or 3\u20133600.';
  const f = settings.fadeSeconds;
  if (typeof f !== "number" || !(f >= 0 && f <= 60)) return '"fadeSeconds" must be between 0 and 60.';
  if (!Array.isArray(settings.exclude) || !settings.exclude.every((n) => typeof n === "string")) return '"exclude" must be a list of template names.';
  return null;
}

export {
  defineSchema,
  cssVar,
  schemaDefaults,
  isHexColor,
  parseHex,
  toHex,
  toHex6,
  mixHex,
  deriveShades,
  deriveAccent,
  cssColorToHex,
  paletteToCss,
  withDefaults,
  validatePalette,
  paletteShiftCss,
  RANDOMIZER_DEFAULTS,
  validateRandomizer
};
