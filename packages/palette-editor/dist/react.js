import {
  defaultSchema
} from "./chunks/chunk-CEKA3FL6.js";
import {
  setRandomizerPaused
} from "./chunks/chunk-EMRCJ6OO.js";
import {
  applyPalette
} from "./chunks/chunk-CNVRNEOK.js";
import {
  defineSchema,
  isHexColor,
  parseHex,
  toHex
} from "./chunks/chunk-GY2PRZL3.js";

// src/react/PaletteEditor.jsx
import { useEffect as useEffect2, useLayoutEffect, useMemo, useRef, useState as useState2 } from "react";

// src/react/ColorField.jsx
import { useEffect, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
function ColorField({ label, value, onChange, alpha = true }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  const { a } = parseHex(value);
  const opaque = toHex({ ...parseHex(value), a: 1 });
  return /* @__PURE__ */ jsxs("div", { className: "pe-field", children: [
    /* @__PURE__ */ jsxs("label", { className: "pe-swatch", children: [
      /* @__PURE__ */ jsx("span", { style: { background: value } }),
      /* @__PURE__ */ jsx("input", { type: "color", value: opaque, onChange: (e) => onChange(toHex({ ...parseHex(e.target.value), a })), "aria-label": `${label} colour` })
    ] }),
    /* @__PURE__ */ jsx("span", { className: "pe-label", children: label }),
    /* @__PURE__ */ jsx(
      "input",
      {
        value: text,
        spellCheck: false,
        "aria-label": `${label} hex value`,
        "aria-invalid": !isHexColor(text),
        onChange: (e) => {
          const next = e.target.value.trim();
          setText(next);
          if (isHexColor(next)) onChange(next.toLowerCase());
        },
        onBlur: () => setText(value),
        className: "pe-input pe-hex"
      }
    ),
    alpha ? /* @__PURE__ */ jsxs("label", { className: "pe-alpha", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "number",
          min: 0,
          max: 100,
          value: Math.round(a * 100),
          "aria-label": `${label} opacity`,
          onChange: (e) => onChange(toHex({ ...parseHex(value), a: Math.min(100, Math.max(0, Number(e.target.value))) / 100 })),
          className: "pe-input pe-num"
        }
      ),
      "%"
    ] }) : /* @__PURE__ */ jsx("span", { className: "pe-alpha-spacer" })
  ] });
}

// src/react/icons.jsx
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function Icon({ children, size = 14, strokeWidth = 2, className }) {
  return /* @__PURE__ */ jsx2(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      className,
      children
    }
  );
}
var PaletteIcon = (p) => /* @__PURE__ */ jsxs2(Icon, { ...p, children: [
  /* @__PURE__ */ jsx2("circle", { cx: "13.5", cy: "6.5", r: ".5", fill: "currentColor" }),
  /* @__PURE__ */ jsx2("circle", { cx: "17.5", cy: "10.5", r: ".5", fill: "currentColor" }),
  /* @__PURE__ */ jsx2("circle", { cx: "8.5", cy: "7.5", r: ".5", fill: "currentColor" }),
  /* @__PURE__ */ jsx2("circle", { cx: "6.5", cy: "12.5", r: ".5", fill: "currentColor" }),
  /* @__PURE__ */ jsx2("path", { d: "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" })
] });
var CheckIcon = (p) => /* @__PURE__ */ jsx2(Icon, { ...p, children: /* @__PURE__ */ jsx2("path", { d: "M20 6 9 17l-5-5" }) });
var XIcon = (p) => /* @__PURE__ */ jsxs2(Icon, { ...p, children: [
  /* @__PURE__ */ jsx2("path", { d: "M18 6 6 18" }),
  /* @__PURE__ */ jsx2("path", { d: "m6 6 12 12" })
] });
var ShuffleIcon = (p) => /* @__PURE__ */ jsxs2(Icon, { ...p, children: [
  /* @__PURE__ */ jsx2("path", { d: "m18 14 4 4-4 4" }),
  /* @__PURE__ */ jsx2("path", { d: "m18 2 4 4-4 4" }),
  /* @__PURE__ */ jsx2("path", { d: "M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-7.6a4 4 0 0 1 3.3-1.7H22" }),
  /* @__PURE__ */ jsx2("path", { d: "M2 6h1.972a4 4 0 0 1 3.6 2.2" }),
  /* @__PURE__ */ jsx2("path", { d: "M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45" })
] });
var TrashIcon = (p) => /* @__PURE__ */ jsxs2(Icon, { ...p, children: [
  /* @__PURE__ */ jsx2("path", { d: "M3 6h18" }),
  /* @__PURE__ */ jsx2("path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }),
  /* @__PURE__ */ jsx2("path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" }),
  /* @__PURE__ */ jsx2("path", { d: "M10 11v6" }),
  /* @__PURE__ */ jsx2("path", { d: "M14 11v6" })
] });
var SaveIcon = (p) => /* @__PURE__ */ jsxs2(Icon, { ...p, children: [
  /* @__PURE__ */ jsx2("path", { d: "M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" }),
  /* @__PURE__ */ jsx2("path", { d: "M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" }),
  /* @__PURE__ */ jsx2("path", { d: "M7 3v4a1 1 0 0 0 1 1h7" })
] });
var UndoIcon = (p) => /* @__PURE__ */ jsxs2(Icon, { ...p, children: [
  /* @__PURE__ */ jsx2("path", { d: "M9 14 4 9l5-5" }),
  /* @__PURE__ */ jsx2("path", { d: "M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11" })
] });
var ResetIcon = (p) => /* @__PURE__ */ jsxs2(Icon, { ...p, children: [
  /* @__PURE__ */ jsx2("path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }),
  /* @__PURE__ */ jsx2("path", { d: "M3 3v5h5" })
] });
var BookmarkPlusIcon = (p) => /* @__PURE__ */ jsxs2(Icon, { ...p, children: [
  /* @__PURE__ */ jsx2("path", { d: "m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" }),
  /* @__PURE__ */ jsx2("path", { d: "M12 7v6" }),
  /* @__PURE__ */ jsx2("path", { d: "M15 10H9" })
] });

// src/react/styles.js
var editorCss = `
.pe-root{
  --pe-bg:#ffffff;--pe-bg-2:#f6f8fb;--pe-fg:#0f1b2d;--pe-fg-2:#45566b;--pe-fg-3:#8492a6;
  --pe-line:#edf1f6;--pe-line-strong:#dfe5ec;--pe-line-hover:#c3ccd8;
  --pe-accent:#533afd;--pe-accent-strong:#4029d9;--pe-accent-wash:#f0eeff;--pe-on-accent:#ffffff;
  --pe-danger:#d11d48;--pe-success:#047857;
  --pe-radius:4px;--pe-z:2147483000;--pe-ease:cubic-bezier(0.22,1,0.36,1);
  --pe-font:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",sans-serif;
  --pe-mono:ui-monospace,"SF Mono","JetBrains Mono",Menlo,Consolas,monospace;
  --pe-shadow:0 30px 80px -30px rgb(10 37 64 / 0.45);
  --pe-trigger-bg:rgb(255 255 255 / 0.82);
  color-scheme:light;
  font-family:var(--pe-font);font-size:14px;line-height:1.4;color:var(--pe-fg);
  -webkit-font-smoothing:antialiased;
}
.pe-root[data-pe-theme="dark"]{
  --pe-bg:#0d1322;--pe-bg-2:#090e1a;--pe-fg:#edf1f8;--pe-fg-2:#a3afc4;--pe-fg-3:#717f98;
  --pe-line:#ffffff12;--pe-line-strong:#ffffff1f;--pe-line-hover:#ffffff38;
  --pe-accent:#8a7dff;--pe-accent-strong:#a79dff;--pe-accent-wash:#8a7dff24;--pe-on-accent:#0b0820;
  --pe-danger:#fb7185;--pe-success:#34d399;
  --pe-shadow:0 30px 80px -30px rgb(0 0 0 / 0.7);
  --pe-trigger-bg:rgb(13 19 34 / 0.82);
  color-scheme:dark;
}
/* Resets use :where() so they add no specificity: any .pe-* rule below wins */
:where(.pe-root) *,:where(.pe-root) *::before,:where(.pe-root) *::after{box-sizing:border-box;margin:0;padding:0;border:0 solid}
.pe-root :where(button,input){font:inherit;color:inherit;background:none;letter-spacing:inherit;text-transform:none}
.pe-root :where(button){cursor:pointer}
.pe-root button:disabled{cursor:default;opacity:.4}
.pe-root :where(svg){display:block;flex-shrink:0}
.pe-root :focus-visible{outline:2px solid var(--pe-accent);outline-offset:2px}

.pe-trigger{
  position:fixed;bottom:16px;z-index:var(--pe-z);display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 14px;
  border:1px solid var(--pe-line-strong);border-radius:var(--pe-radius);background:var(--pe-trigger-bg);
  -webkit-backdrop-filter:blur(14px) saturate(1.6);backdrop-filter:blur(14px) saturate(1.6);
  box-shadow:0 10px 30px -12px rgb(10 37 64 / 0.35);font-size:14px;font-weight:500;color:var(--pe-fg);
  transition:color .3s var(--pe-ease),border-color .3s var(--pe-ease);
}
.pe-trigger:hover{color:var(--pe-accent);border-color:var(--pe-line-hover)}
.pe-dot{width:6px;height:6px;border-radius:999px;background:var(--pe-accent)}

.pe-panel{
  position:fixed;top:80px;bottom:64px;z-index:var(--pe-z);display:flex;flex-direction:column;overflow:hidden;
  width:min(calc(100vw - 32px),23rem);border:1px solid var(--pe-line);border-radius:var(--pe-radius);
  background:var(--pe-bg);box-shadow:var(--pe-shadow);
  transition:opacity .5s var(--pe-ease),transform .5s var(--pe-ease);
}
.pe-panel[data-open="false"]{opacity:0;transform:translateY(8px);pointer-events:none}
.pe-right{right:16px}.pe-left{left:16px}

.pe-header{padding:20px 20px 16px;border-bottom:1px solid var(--pe-line)}
.pe-header-row{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
.pe-title{font-size:18px;font-weight:300;letter-spacing:-0.01em;color:var(--pe-fg)}
.pe-subtitle{margin-top:2px;font-size:12px;color:var(--pe-fg-3)}
.pe-icon-btn{display:grid;place-items:center;width:32px;height:32px;border-radius:var(--pe-radius);color:var(--pe-fg-2);transition:color .3s var(--pe-ease)}
.pe-icon-btn:hover{color:var(--pe-accent)}

.pe-tabs{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;margin-top:16px;padding:4px;border:1px solid var(--pe-line);border-radius:var(--pe-radius);background:var(--pe-bg-2)}
.pe-tab{height:32px;border-radius:var(--pe-radius);font-size:14px;font-weight:500;text-transform:capitalize;color:var(--pe-fg-3);transition:color .3s var(--pe-ease),background-color .3s var(--pe-ease)}
.pe-tab:hover{color:var(--pe-fg-2)}
.pe-tab[aria-selected="true"]{background:var(--pe-bg);color:var(--pe-fg);box-shadow:0 1px 2px rgb(10 37 64 / 0.08)}

.pe-body{flex:1;overflow-y:auto;overscroll-behavior:contain;padding:12px 20px}
.pe-section{padding:12px 0;border-bottom:1px solid var(--pe-line)}
.pe-section:last-child{border-bottom:0}
.pe-section-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
.pe-h3{font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:.08em;color:var(--pe-fg-3)}
.pe-note{font-size:11px;color:var(--pe-fg-3)}
.pe-text-btn{display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:500;color:var(--pe-accent);transition:color .3s var(--pe-ease)}
.pe-text-btn:hover{color:var(--pe-fg)}

.pe-field{display:flex;align-items:center;gap:10px;padding:6px 0}
.pe-swatch{position:relative;width:28px;height:28px;flex-shrink:0;overflow:hidden;cursor:pointer;border:1px solid var(--pe-line-strong);border-radius:var(--pe-radius);
  background:repeating-conic-gradient(#cbd5e1 0% 25%,#ffffff 0% 50%) 0 0/8px 8px}
.pe-swatch>span{position:absolute;inset:0}
.pe-swatch>input{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer}
.pe-label{flex:1;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-size:13px;color:var(--pe-fg-2)}
.pe-input{border:1px solid var(--pe-line-strong);border-radius:var(--pe-radius);background:var(--pe-bg);color:var(--pe-fg);outline:none;transition:border-color .3s var(--pe-ease)}
.pe-input:focus{border-color:var(--pe-accent)}
.pe-input:disabled{opacity:.4}
.pe-input[aria-invalid="true"]{border-color:var(--pe-danger)}
.pe-input::placeholder{color:var(--pe-fg-3);opacity:.7}
.pe-hex{width:5.75rem;padding:4px 8px;font-family:var(--pe-mono);font-size:12px}
.pe-alpha{display:flex;align-items:center;gap:2px;width:3.75rem;font-family:var(--pe-mono);font-size:12px;color:var(--pe-fg-3)}
.pe-num{width:48px;padding:4px;text-align:right;font-family:var(--pe-mono);font-size:12px;-moz-appearance:textfield;appearance:textfield}
.pe-num::-webkit-inner-spin-button,.pe-num::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
.pe-alpha-spacer{width:3.75rem;flex-shrink:0}

.pe-templates{display:grid;gap:6px;margin-top:10px;list-style:none}
.pe-template{display:flex;align-items:center;gap:6px}
.pe-template-btn{display:flex;flex:1;min-width:0;align-items:center;gap:12px;padding:8px 10px;text-align:left;border:1px solid var(--pe-line-strong);border-radius:var(--pe-radius);transition:border-color .3s var(--pe-ease),background-color .3s var(--pe-ease)}
.pe-template-btn:hover{border-color:var(--pe-line-hover)}
.pe-template-btn[aria-pressed="true"]{border-color:var(--pe-accent);background:var(--pe-accent-wash)}
.pe-template-name{flex:1;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-size:14px;font-weight:500;text-transform:capitalize;color:var(--pe-fg)}
.pe-strip{display:flex;flex-shrink:0;overflow:hidden;border:1px solid var(--pe-line-strong);border-radius:3px}
.pe-strip>span{width:10px;height:20px}
.pe-accent-icon{color:var(--pe-accent)}
.pe-success-icon{color:var(--pe-success)}
.pe-del{display:grid;place-items:center;flex-shrink:0;width:36px;height:36px;border:1px solid transparent;border-radius:var(--pe-radius);color:var(--pe-fg-3);transition:color .3s var(--pe-ease),border-color .3s var(--pe-ease)}
.pe-del-spacer{width:36px;flex-shrink:0}
.pe-del:hover{color:var(--pe-danger)}
.pe-del[data-confirm="true"]{width:auto;padding:0 8px;border-color:var(--pe-danger);font-size:11px;font-weight:500;color:var(--pe-danger)}

.pe-form{display:flex;gap:8px;margin-top:12px}
.pe-name{flex:1;min-width:0;padding:6px 10px;font-size:13px}
.pe-btn{display:inline-flex;align-items:center;gap:6px;flex-shrink:0;height:32px;padding:0 12px;border:1px solid var(--pe-line-strong);border-radius:var(--pe-radius);font-size:13px;font-weight:500;color:var(--pe-fg);transition:color .3s var(--pe-ease),border-color .3s var(--pe-ease),background-color .3s var(--pe-ease)}
.pe-btn:not(:disabled):hover{border-color:var(--pe-accent);color:var(--pe-accent)}
.pe-btn-primary{border-color:var(--pe-accent);background:var(--pe-accent);color:var(--pe-on-accent)}
.pe-btn-primary:not(:disabled):hover{border-color:var(--pe-accent-strong);background:var(--pe-accent-strong);color:var(--pe-on-accent)}
.pe-btn-danger{margin-left:auto;color:var(--pe-fg-2)}
.pe-btn-danger:not(:disabled):hover,.pe-btn-danger[data-confirm="true"]{border-color:var(--pe-danger);color:var(--pe-danger)}

.pe-check{display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;color:var(--pe-fg-2)}
.pe-check-sm{margin-top:8px;font-size:12px}
.pe-check input{accent-color:var(--pe-accent);width:14px;height:14px;cursor:pointer}
.pe-row{display:flex;align-items:center;gap:8px;margin-top:8px;font-size:13px;color:var(--pe-fg-2)}
.pe-row[data-off="true"]{opacity:.4}
.pe-indent{padding-left:24px}
.pe-small-num{width:64px;padding:4px 8px;text-align:right;font-family:var(--pe-mono);font-size:12px}
.pe-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
.pe-chip{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 8px;border:1px solid var(--pe-line-strong);border-radius:var(--pe-radius);font-size:12px;color:var(--pe-fg-3);text-decoration:line-through;text-decoration-color:color-mix(in srgb,var(--pe-fg-3) 50%,transparent);transition:color .3s var(--pe-ease),border-color .3s var(--pe-ease)}
.pe-chip:hover{color:var(--pe-fg-2)}
.pe-chip[aria-pressed="true"]{border-color:var(--pe-accent);background:var(--pe-accent-wash);color:var(--pe-fg);text-decoration:none}
.pe-chip>span{width:10px;height:10px;border-radius:999px}
.pe-split{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:12px}

.pe-footer{padding:16px 20px;border-top:1px solid var(--pe-line);background:var(--pe-bg-2)}
.pe-status{display:flex;align-items:center;gap:6px;min-height:16px;margin-bottom:12px;font-size:12px;color:var(--pe-fg-3)}
.pe-status[data-tone="error"]{color:var(--pe-danger)}
.pe-actions{display:flex;flex-wrap:wrap;gap:8px}

@media (prefers-reduced-motion:reduce){.pe-root *{transition:none !important}}
`;
var STYLE_ID = "palette-editor-styles";
function injectEditorCss() {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
  const style = Object.assign(document.createElement("style"), { id: STYLE_ID, textContent: editorCss });
  document.head.append(style);
}

// src/react/useDocumentTheme.js
import { useCallback, useSyncExternalStore } from "react";
function useDocumentTheme(schema) {
  const { themes, themeAttribute } = schema;
  const subscribe = useCallback(
    (listener) => {
      const observer = new MutationObserver(listener);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: [themeAttribute] });
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      media.addEventListener("change", listener);
      return () => {
        observer.disconnect();
        media.removeEventListener("change", listener);
      };
    },
    [themeAttribute]
  );
  const read = () => {
    const value = document.documentElement.getAttribute(themeAttribute);
    if (themes.includes(value)) return value;
    return themes.includes("dark") && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : themes[0];
  };
  const theme = useSyncExternalStore(subscribe, read, () => themes[0]);
  const setTheme = useCallback((next) => document.documentElement.setAttribute(themeAttribute, next), [themeAttribute]);
  return [theme, setTheme];
}

// src/react/PaletteEditor.jsx
import { Fragment, jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
function PaletteEditor({
  schema: schemaInput,
  endpoint = "/__palette",
  theme: themeProp,
  onThemeChange,
  styleId = "palette",
  side = "right",
  defaultOpen = false,
  title = "Colour scheme",
  buttonLabel = "Colours",
  subtitle = "Only visible in development.",
  injectStyles = true
}) {
  const schema = useMemo(() => defineSchema(schemaInput ?? defaultSchema), [schemaInput]);
  const [documentTheme, setDocumentTheme] = useDocumentTheme(schema);
  const theme = schema.themes.includes(themeProp) ? themeProp : documentTheme;
  const setTheme = onThemeChange ?? setDocumentTheme;
  const [open, setOpen] = useState2(defaultOpen);
  const [saved, setSaved] = useState2(null);
  const [defaults, setDefaults] = useState2(null);
  const [files, setFiles] = useState2(null);
  const [templates, setTemplates] = useState2([]);
  const [templateName, setTemplateName] = useState2("");
  const [confirmDelete, setConfirmDelete] = useState2(null);
  const [draft, setDraft] = useState2(null);
  const [links, setLinks] = useState2(() => Object.fromEntries(schema.links.map((l) => [l.id, l.enabled])));
  const [confirmReset, setConfirmReset] = useState2(false);
  const [message, setMessage] = useState2(null);
  const [randomizer, setRandomizer] = useState2(null);
  const [randomDraft, setRandomDraft] = useState2(null);
  const resetTimer = useRef(0);
  const panelRef = useRef(null);
  useLayoutEffect(() => {
    if (injectStyles) injectEditorCss();
  }, [injectStyles]);
  useEffect2(() => {
    fetch(endpoint).then((r) => r.json()).then(({ palette, defaults: defaults2, templates: templates2, randomizer: randomizer2, files: files2 }) => {
      setSaved(palette);
      setDefaults(defaults2);
      setDraft(palette);
      setTemplates(templates2 ?? []);
      setRandomizer(randomizer2);
      setRandomDraft(randomizer2);
      setFiles(files2);
    }).catch(() => console.warn(`[palette-editor] Could not reach ${endpoint}. Is the Vite plugin installed and the dev server running?`));
    return () => window.clearTimeout(resetTimer.current);
  }, [endpoint]);
  useEffect2(() => {
    if (draft) applyPalette(schema, draft, { styleId });
  }, [schema, draft, styleId]);
  useEffect2(() => {
    setRandomizerPaused(open);
  }, [open]);
  useEffect2(() => {
    if (panelRef.current) panelRef.current.inert = !open;
  }, [open, draft]);
  const dirty = useMemo(() => draft && saved && !same(draft, saved), [draft, saved]);
  const atDefaults = useMemo(() => draft && defaults && same(draft, defaults), [draft, defaults]);
  const current = useMemo(() => templates.find((t) => same(t.palette, draft)), [templates, draft]);
  if (!draft) return null;
  const colors = draft[theme];
  const update = (patch) => {
    setMessage(null);
    setDraft((d) => ({ ...d, [theme]: { ...d[theme], ...patch } }));
  };
  const setToken = (key, value) => {
    const derived = schema.links.filter((l) => l.from === key && links[l.id]).map((l) => l.derive({ value, colors, theme, palette: draft }));
    const known = (patch) => Object.fromEntries(Object.entries(patch).filter(([k]) => k in colors));
    update(Object.assign({ [key]: value }, ...derived.map(known)));
  };
  const setListItem = (key, i, value) => setToken(key, colors[key].map((c, j) => j === i ? value : c));
  const toggleLink = (link, on) => {
    setLinks((l) => ({ ...l, [link.id]: on }));
    if (on && link.applyOnEnable) update(link.derive({ value: colors[link.from], colors, theme, palette: draft }));
  };
  const request = async (method, path = "", body) => {
    const res = await fetch(endpoint + path, { method, headers: { "Content-Type": "application/json" }, body: body && JSON.stringify(body) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
    return json;
  };
  const fail = (err) => setMessage({ tone: "error", text: err.message });
  const save = async () => {
    try {
      const { palette } = await request("PUT", "/", draft);
      setSaved(palette);
      setMessage({ tone: "ok", text: `Saved to ${files?.palette ?? "the palette file"}` });
    } catch (err) {
      fail(err);
    }
  };
  const reset = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      resetTimer.current = window.setTimeout(() => setConfirmReset(false), 3500);
      return;
    }
    window.clearTimeout(resetTimer.current);
    setConfirmReset(false);
    try {
      const { palette } = await request("POST", "/reset");
      setSaved(palette);
      setDraft(palette);
      setMessage({ tone: "ok", text: "Restored the default colours and saved." });
    } catch (err) {
      fail(err);
    }
  };
  const discard = () => {
    setDraft(saved);
    setMessage(null);
  };
  const applyTemplate = (template) => {
    setDraft(template.palette);
    setConfirmDelete(null);
    setMessage(
      same(template.palette, saved) ? { tone: "ok", text: `\u201C${template.name}\u201D is the live palette.` } : { tone: "info", text: `Previewing \u201C${template.name}\u201D. Save to file to make it the site's palette.` }
    );
  };
  const shuffle = () => {
    const pool = templates.filter((t) => !randomizer?.exclude.includes(t.name) && t !== current);
    if (pool.length) applyTemplate(pool[Math.floor(Math.random() * pool.length)]);
  };
  const randomDirty = randomDraft && randomizer && !same(randomDraft, randomizer);
  const editRandom = (patch) => setRandomDraft((r) => ({ ...r, ...patch }));
  const toggleInMix = (name) => editRandom({ exclude: randomDraft.exclude.includes(name) ? randomDraft.exclude.filter((n) => n !== name) : [...randomDraft.exclude, name].sort() });
  const saveRandomizer = async () => {
    try {
      await request("PUT", "/randomizer", randomDraft);
      setMessage({ tone: "ok", text: "Randomizer saved. Reloading\u2026" });
    } catch (err) {
      fail(err);
    }
  };
  const templateSlug = slug(templateName);
  const overwriting = templates.some((t) => t.name === templateSlug);
  const saveTemplate = async (e) => {
    e.preventDefault();
    if (!templateSlug) return;
    try {
      const { templates: next } = await request("PUT", `/templates/${encodeURIComponent(templateSlug)}`, draft);
      setTemplates(next);
      setTemplateName("");
      setMessage({ tone: "ok", text: `${overwriting ? "Updated" : "Saved"} template \u201C${templateSlug}\u201D.` });
    } catch (err) {
      fail(err);
    }
  };
  const deleteTemplate = async (name) => {
    if (confirmDelete !== name) return setConfirmDelete(name);
    setConfirmDelete(null);
    try {
      const { templates: next } = await request("DELETE", `/templates/${encodeURIComponent(name)}`);
      setTemplates(next);
      setMessage({ tone: "ok", text: `Deleted template \u201C${name}\u201D.` });
    } catch (err) {
      fail(err);
    }
  };
  const swatchesOf = (c) => schema.swatches.flatMap((key) => c[key] ?? []);
  return /* @__PURE__ */ jsxs3("div", { className: "pe-root", "data-pe-theme": theme.includes("dark") ? "dark" : "light", children: [
    /* @__PURE__ */ jsxs3("button", { type: "button", onClick: () => setOpen((o) => !o), "aria-expanded": open, className: `pe-trigger pe-${side}`, children: [
      /* @__PURE__ */ jsx3(PaletteIcon, { size: 16, strokeWidth: 1.75 }),
      buttonLabel,
      dirty && /* @__PURE__ */ jsx3("span", { className: "pe-dot", "aria-label": "unsaved changes" })
    ] }),
    /* @__PURE__ */ jsxs3("aside", { ref: panelRef, "aria-label": title, "data-open": open, className: `pe-panel pe-${side}`, children: [
      /* @__PURE__ */ jsxs3("header", { className: "pe-header", children: [
        /* @__PURE__ */ jsxs3("div", { className: "pe-header-row", children: [
          /* @__PURE__ */ jsxs3("div", { children: [
            /* @__PURE__ */ jsx3("h2", { className: "pe-title", children: title }),
            subtitle && /* @__PURE__ */ jsx3("p", { className: "pe-subtitle", children: subtitle })
          ] }),
          /* @__PURE__ */ jsx3("button", { type: "button", onClick: () => setOpen(false), "aria-label": "Close colour editor", className: "pe-icon-btn", children: /* @__PURE__ */ jsx3(XIcon, { size: 16, strokeWidth: 1.75 }) })
        ] }),
        schema.themes.length > 1 && /* @__PURE__ */ jsx3("div", { role: "tablist", className: "pe-tabs", children: schema.themes.map((t) => /* @__PURE__ */ jsx3("button", { type: "button", role: "tab", "aria-selected": theme === t, onClick: () => setTheme(t), className: "pe-tab", children: t }, t)) })
      ] }),
      /* @__PURE__ */ jsxs3("div", { className: "pe-body", children: [
        /* @__PURE__ */ jsxs3("section", { className: "pe-section", children: [
          /* @__PURE__ */ jsxs3("div", { className: "pe-section-head", children: [
            /* @__PURE__ */ jsx3("h3", { className: "pe-h3", children: "Templates" }),
            templates.length > 1 && /* @__PURE__ */ jsxs3("button", { type: "button", onClick: shuffle, className: "pe-text-btn", children: [
              /* @__PURE__ */ jsx3(ShuffleIcon, {}),
              " Shuffle"
            ] })
          ] }),
          templates.length > 0 ? /* @__PURE__ */ jsx3("ul", { className: "pe-templates", children: templates.map((t) => {
            const active = t === current;
            const live = same(t.palette, saved);
            const confirming = confirmDelete === t.name;
            return /* @__PURE__ */ jsxs3("li", { className: "pe-template", children: [
              /* @__PURE__ */ jsxs3(
                "button",
                {
                  type: "button",
                  onClick: () => applyTemplate(t),
                  "aria-pressed": active,
                  title: t.builtin ? "Built-in template" : void 0,
                  className: "pe-template-btn",
                  children: [
                    /* @__PURE__ */ jsx3("span", { "aria-hidden": "true", className: "pe-strip", children: swatchesOf(t.palette[theme]).map((c, i) => /* @__PURE__ */ jsx3("span", { style: { background: c } }, i)) }),
                    /* @__PURE__ */ jsx3("span", { className: "pe-template-name", children: t.name.replace(/-/g, " ") }),
                    live && /* @__PURE__ */ jsx3("span", { className: "pe-note", children: "Live" }),
                    active && /* @__PURE__ */ jsx3(CheckIcon, { className: "pe-accent-icon", strokeWidth: 2.25 })
                  ]
                }
              ),
              t.builtin ? /* @__PURE__ */ jsx3("span", { className: "pe-del-spacer", title: "Built-in template" }) : /* @__PURE__ */ jsx3(
                "button",
                {
                  type: "button",
                  onClick: () => deleteTemplate(t.name),
                  onBlur: () => confirming && setConfirmDelete(null),
                  "aria-label": confirming ? `Click again to delete ${t.name}` : `Delete template ${t.name}`,
                  title: confirming ? "Click again to delete" : "Delete template",
                  "data-confirm": confirming,
                  className: "pe-del",
                  children: confirming ? "Delete?" : /* @__PURE__ */ jsx3(TrashIcon, { strokeWidth: 1.75 })
                }
              )
            ] }, t.name);
          }) }) : /* @__PURE__ */ jsx3("p", { className: "pe-note", style: { marginTop: 8, fontSize: 12 }, children: "No templates yet. Save the current colours below to create one." }),
          /* @__PURE__ */ jsxs3("form", { onSubmit: saveTemplate, className: "pe-form", children: [
            /* @__PURE__ */ jsx3(
              "input",
              {
                value: templateName,
                onChange: (e) => setTemplateName(e.target.value),
                placeholder: "Name, e.g. autumn",
                "aria-label": "Template name",
                maxLength: 40,
                className: "pe-input pe-name"
              }
            ),
            /* @__PURE__ */ jsxs3("button", { type: "submit", disabled: !templateSlug, className: "pe-btn", children: [
              /* @__PURE__ */ jsx3(BookmarkPlusIcon, {}),
              overwriting ? "Update" : "Save as template"
            ] })
          ] }),
          /* @__PURE__ */ jsxs3("p", { className: "pe-note", style: { marginTop: 6 }, children: [
            "Saves every theme's colours to ",
            files?.templates ?? "the templates folder",
            "."
          ] })
        ] }),
        randomDraft && /* @__PURE__ */ jsxs3("section", { className: "pe-section", children: [
          /* @__PURE__ */ jsx3("h3", { className: "pe-h3", children: "Randomizer" }),
          /* @__PURE__ */ jsx3("p", { className: "pe-note", style: { marginTop: 4 }, children: "Works on the live site too. Paused while this panel is open." }),
          /* @__PURE__ */ jsxs3("label", { className: "pe-check", style: { marginTop: 12 }, children: [
            /* @__PURE__ */ jsx3("input", { type: "checkbox", checked: randomDraft.onRefresh, onChange: (e) => editRandom({ onRefresh: e.target.checked }) }),
            "New palette on every refresh"
          ] }),
          /* @__PURE__ */ jsxs3("div", { className: "pe-row", children: [
            /* @__PURE__ */ jsxs3("label", { className: "pe-check", children: [
              /* @__PURE__ */ jsx3(
                "input",
                {
                  type: "checkbox",
                  checked: randomDraft.everySeconds > 0,
                  onChange: (e) => editRandom({ everySeconds: e.target.checked ? randomizer.everySeconds || 30 : 0 })
                }
              ),
              "Change every"
            ] }),
            /* @__PURE__ */ jsx3(
              "input",
              {
                type: "number",
                min: 3,
                max: 3600,
                value: randomDraft.everySeconds || "",
                placeholder: "30",
                disabled: !randomDraft.everySeconds,
                "aria-label": "Seconds between changes",
                onChange: (e) => editRandom({ everySeconds: Math.min(3600, Math.max(3, Math.round(Number(e.target.value) || 3))) }),
                className: "pe-input pe-small-num"
              }
            ),
            "seconds"
          ] }),
          /* @__PURE__ */ jsxs3("div", { className: "pe-row pe-indent", "data-off": !randomDraft.everySeconds, children: [
            /* @__PURE__ */ jsx3("span", { children: "Drift over" }),
            /* @__PURE__ */ jsx3(
              "input",
              {
                type: "number",
                min: 0,
                max: 60,
                step: 0.5,
                value: randomDraft.fadeSeconds,
                disabled: !randomDraft.everySeconds,
                "aria-label": "Seconds each change takes",
                onChange: (e) => editRandom({ fadeSeconds: Math.min(60, Math.max(0, Number(e.target.value) || 0)) }),
                className: "pe-input pe-small-num"
              }
            ),
            "seconds",
            /* @__PURE__ */ jsx3("span", { className: "pe-note", children: "(0 = quick fade)" })
          ] }),
          /* @__PURE__ */ jsx3("p", { className: "pe-note", style: { marginTop: 12, fontWeight: 500 }, children: "In the mix" }),
          /* @__PURE__ */ jsx3("div", { className: "pe-chips", children: templates.map((t) => /* @__PURE__ */ jsxs3("button", { type: "button", onClick: () => toggleInMix(t.name), "aria-pressed": !randomDraft.exclude.includes(t.name), className: "pe-chip", children: [
            /* @__PURE__ */ jsx3("span", { style: { background: t.palette[theme][schema.accent] } }),
            t.name
          ] }, t.name)) }),
          /* @__PURE__ */ jsxs3("div", { className: "pe-split", children: [
            /* @__PURE__ */ jsx3("p", { className: "pe-note", children: randomDraft.onRefresh || randomDraft.everySeconds ? `${templates.length - randomDraft.exclude.filter((n) => templates.some((t) => t.name === n)).length} templates in the mix` : "Off: the site uses the saved palette" }),
            /* @__PURE__ */ jsxs3("button", { type: "button", onClick: saveRandomizer, disabled: !randomDirty, className: "pe-btn", children: [
              /* @__PURE__ */ jsx3(SaveIcon, {}),
              " Save randomizer"
            ] })
          ] })
        ] }),
        schema.groups.map((group) => /* @__PURE__ */ jsxs3("section", { className: "pe-section", children: [
          /* @__PURE__ */ jsx3("h3", { className: "pe-h3", children: group.label }),
          schema.links.filter((l) => l.group === group.label).map((link) => /* @__PURE__ */ jsxs3("label", { className: "pe-check pe-check-sm", children: [
            /* @__PURE__ */ jsx3("input", { type: "checkbox", checked: links[link.id], onChange: (e) => toggleLink(link, e.target.checked) }),
            link.label
          ] }, link.id)),
          /* @__PURE__ */ jsx3("div", { style: { marginTop: 6 }, children: group.tokens.map((token) => /* @__PURE__ */ jsx3(ColorField, { label: token.label, value: colors[token.key], alpha: token.alpha, onChange: (v) => setToken(token.key, v) }, token.key)) })
        ] }, group.label)),
        schema.lists.map((list) => /* @__PURE__ */ jsxs3("section", { className: "pe-section", children: [
          /* @__PURE__ */ jsx3("h3", { className: "pe-h3", children: list.label }),
          schema.links.filter((l) => l.group === list.label).map((link) => /* @__PURE__ */ jsxs3("label", { className: "pe-check pe-check-sm", children: [
            /* @__PURE__ */ jsx3("input", { type: "checkbox", checked: links[link.id], onChange: (e) => toggleLink(link, e.target.checked) }),
            link.label
          ] }, link.id)),
          /* @__PURE__ */ jsx3("div", { style: { marginTop: 6 }, children: list.items.map((label, i) => /* @__PURE__ */ jsx3(ColorField, { label, value: colors[list.key][i], alpha: list.alpha, onChange: (v) => setListItem(list.key, i, v) }, i)) })
        ] }, list.key))
      ] }),
      /* @__PURE__ */ jsxs3("footer", { className: "pe-footer", children: [
        /* @__PURE__ */ jsx3("p", { role: "status", className: "pe-status", "data-tone": message?.tone, children: message ? /* @__PURE__ */ jsxs3(Fragment, { children: [
          message.tone === "ok" && /* @__PURE__ */ jsx3(CheckIcon, { className: "pe-success-icon" }),
          message.text
        ] }) : dirty ? "Unsaved changes (previewing)" : current ? `Using the \u201C${current.name}\u201D template` : atDefaults ? "Using the default colours" : "Using your saved colours" }),
        /* @__PURE__ */ jsxs3("div", { className: "pe-actions", children: [
          /* @__PURE__ */ jsxs3("button", { type: "button", onClick: save, disabled: !dirty, className: "pe-btn pe-btn-primary", children: [
            /* @__PURE__ */ jsx3(SaveIcon, {}),
            " Save to file"
          ] }),
          /* @__PURE__ */ jsxs3("button", { type: "button", onClick: discard, disabled: !dirty, className: "pe-btn", children: [
            /* @__PURE__ */ jsx3(UndoIcon, {}),
            " Discard"
          ] }),
          /* @__PURE__ */ jsxs3("button", { type: "button", onClick: reset, disabled: atDefaults && !dirty, "data-confirm": confirmReset, className: "pe-btn pe-btn-danger", children: [
            /* @__PURE__ */ jsx3(ResetIcon, {}),
            confirmReset ? "Click to confirm" : "Reset to defaults"
          ] })
        ] })
      ] })
    ] })
  ] });
}
var same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
var slug = (name) => name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
var PaletteEditor_default = PaletteEditor;
export {
  ColorField,
  PaletteEditor,
  PaletteEditor_default as default,
  editorCss,
  injectEditorCss,
  useDocumentTheme
};
