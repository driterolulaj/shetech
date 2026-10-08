import {
  defineSchema,
  deriveAccent,
  deriveShades
} from "./chunk-GY2PRZL3.js";

// presets/default/palette.defaults.json
var palette_defaults_default = {
  light: {
    accent: "#2a9d8f",
    accentStrong: "#228175",
    accentWash: "#f0f8f7",
    secondary: "#00d4ff",
    ink: "#0a2540",
    ink2: "#425466",
    ink3: "#8898aa",
    surface: "#f7f7ed",
    canvas: "#f8fafd",
    glass: "#ffffff",
    line: "#eef2f7",
    lineStrong: "#e2e8f0",
    lineHover: "#cbd5e1",
    success: "#047857",
    successWash: "#ecfdf5",
    warn: "#b45309",
    warnWash: "#fffbeb",
    danger: "#be123c",
    dangerWash: "#fff1f2",
    logoMark: "#0a2540",
    logoPrimary: "#2a9d8f",
    logoLight: "#5fb6ab",
    logoDeep: "#195e56",
    mesh: [
      "#264653",
      "#2a9d8f",
      "#e9c46a",
      "#f4a261"
    ]
  },
  dark: {
    accent: "#2a9d8f",
    accentStrong: "#50afa3",
    accentWash: "#2a9d8f24",
    secondary: "#e9c46a",
    ink: "#edf1f8",
    ink2: "#a3afc4",
    ink3: "#717f98",
    surface: "#061312",
    canvas: "#070c18",
    glass: "#0f172c",
    line: "#ffffff12",
    lineStrong: "#ffffff1f",
    lineHover: "#ffffff38",
    success: "#34d399",
    successWash: "#34d3991f",
    warn: "#fbbf24",
    warnWash: "#fbbf241f",
    danger: "#fb7185",
    dangerWash: "#fb71851f",
    logoMark: "#fbfbfb",
    logoPrimary: "#2a9d8f",
    logoLight: "#5fb6ab",
    logoDeep: "#195e56",
    mesh: [
      "#264653",
      "#2a9d8f",
      "#e9c46a",
      "#f4a261"
    ]
  }
};

// src/preset.js
var withDefaults = (labels, extra = {}) => Object.fromEntries(
  Object.entries(labels).map(([key, label]) => [key, { label, default: { light: palette_defaults_default.light[key], dark: palette_defaults_default.dark[key] }, ...extra[key] }])
);
var defaultSchema = defineSchema({
  themes: ["light", "dark"],
  preset: "default",
  groups: [
    { label: "Brand", tokens: withDefaults({ accent: "Accent", accentStrong: "Accent hover", accentWash: "Accent wash", secondary: "Secondary" }) },
    { label: "Text", tokens: withDefaults({ ink: "Headings", ink2: "Body text", ink3: "Muted text" }) },
    {
      label: "Surfaces",
      tokens: withDefaults(
        { surface: "Page", canvas: "Tinted panels", glass: "Glass tint", line: "Hairlines", lineStrong: "Borders", lineHover: "Borders (hover)" },
        { glass: { css: "rgb" } }
      )
    },
    { label: "Logo", tokens: withDefaults({ logoMark: "Wordmark & bolt", logoPrimary: "Logo primary", logoLight: "Logo light", logoDeep: "Logo deep" }) },
    {
      label: "Status",
      tokens: withDefaults({ success: "Success", successWash: "Success wash", warn: "Warning", warnWash: "Warning wash", danger: "Error", dangerWash: "Error wash" })
    }
  ],
  lists: [
    { key: "mesh", label: "Hero gradient", items: ["Base", "Layer 2", "Layer 3", "Top layer"], default: { light: palette_defaults_default.light.mesh, dark: palette_defaults_default.dark.mesh } }
  ],
  accent: "accent",
  swatches: ["surface", "ink", "accent", "mesh"],
  links: [
    {
      id: "accent-shades",
      label: "Derive hover and wash from the accent",
      from: "accent",
      derive: ({ value, colors, theme }) => {
        const { strong, wash } = deriveAccent(value, colors.surface ?? "#ffffff", theme);
        return { accentStrong: strong, accentWash: wash };
      }
    },
    {
      id: "logo-follows-accent",
      group: "Logo",
      label: "Follow the accent colour",
      from: "accent",
      applyOnEnable: true,
      derive: ({ value }) => {
        const { light, base, deep } = deriveShades(value);
        return { logoPrimary: base, logoLight: light, logoDeep: deep };
      }
    }
  ]
});

export {
  defaultSchema
};
