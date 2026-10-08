/**
 * The editor's own styles, injected once as <style id="palette-editor-styles">.
 * Everything is scoped under .pe-root, so it neither needs nor disturbs the host's CSS.
 *
 * Restyle it by overriding the variables, e.g. to use the site's own accent:
 *   .pe-root { --pe-accent: var(--accent); --pe-font: inherit; }
 */
export const editorCss = `
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
`

const STYLE_ID = 'palette-editor-styles'

export function injectEditorCss() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return
  const style = Object.assign(document.createElement('style'), { id: STYLE_ID, textContent: editorCss })
  document.head.append(style)
}
