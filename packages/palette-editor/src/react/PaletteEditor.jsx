import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { applyPalette } from '../core/browser.js'
import { defineSchema } from '../core/schema.js'
import { defaultSchema } from '../preset.js'
import { setRandomizerPaused } from '../randomizer.js'
import { ColorField } from './ColorField.jsx'
import { BookmarkPlusIcon, CheckIcon, PaletteIcon, ResetIcon, SaveIcon, ShuffleIcon, TrashIcon, UndoIcon, XIcon } from './icons.jsx'
import { injectEditorCss } from './styles.js'
import { useDocumentTheme } from './useDocumentTheme.js'

/**
 * Colour scheme editor. Meant for development: render it only when
 * import.meta.env.DEV, since it talks to the Vite plugin's dev endpoint.
 *
 * Changes preview live. "Save to file" writes the palette file the site is built
 * from; "Reset" restores the defaults file. Templates are named palettes in the
 * templates folder: pick one to preview it, then "Save to file" to make it the
 * site's palette.
 *
 * @param {object}   [props.schema]        The same schema given to the Vite plugin. Default: the built-in defaultSchema.
 * @param {string}   [props.endpoint]      The plugin's endpoint. Default '/__palette'.
 * @param {string}   [props.theme]         The theme being shown. Default: read from <html data-theme>.
 * @param {Function} [props.onThemeChange] Called with a theme name from the theme tabs. Default: sets <html data-theme>.
 * @param {string}   [props.styleId]       id of the palette <style> the plugin injects. Default 'palette'.
 * @param {'right'|'left'} [props.side]    Corner for the button and panel. Default 'right'.
 * @param {boolean}  [props.defaultOpen]
 * @param {string}   [props.title]         Panel heading. Default 'Colour scheme'.
 * @param {string}   [props.buttonLabel]   Default 'Colours'.
 * @param {string}   [props.subtitle]      Default 'Only visible in development.'
 * @param {boolean}  [props.injectStyles]  Add the editor's CSS to the page. Default true (see editorCss).
 */
export function PaletteEditor({
  schema: schemaInput,
  endpoint = '/__palette',
  theme: themeProp,
  onThemeChange,
  styleId = 'palette',
  side = 'right',
  defaultOpen = false,
  title = 'Colour scheme',
  buttonLabel = 'Colours',
  subtitle = 'Only visible in development.',
  injectStyles = true,
}) {
  const schema = useMemo(() => defineSchema(schemaInput ?? defaultSchema), [schemaInput])
  const [documentTheme, setDocumentTheme] = useDocumentTheme(schema)
  const theme = schema.themes.includes(themeProp) ? themeProp : documentTheme
  const setTheme = onThemeChange ?? setDocumentTheme

  const [open, setOpen] = useState(defaultOpen)
  const [saved, setSaved] = useState(null) // what's in the palette file
  const [defaults, setDefaults] = useState(null)
  const [files, setFiles] = useState(null) // file paths, for messages
  const [templates, setTemplates] = useState([])
  const [templateName, setTemplateName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null) // template name awaiting a second click
  const [draft, setDraft] = useState(null) // what's on screen
  const [links, setLinks] = useState(() => Object.fromEntries(schema.links.map((l) => [l.id, l.enabled])))
  const [confirmReset, setConfirmReset] = useState(false)
  const [message, setMessage] = useState(null) // { tone: 'ok' | 'info' | 'error', text }
  const [randomizer, setRandomizer] = useState(null) // saved settings
  const [randomDraft, setRandomDraft] = useState(null) // settings being edited
  const resetTimer = useRef(0)
  const panelRef = useRef(null)

  useLayoutEffect(() => {
    if (injectStyles) injectEditorCss()
  }, [injectStyles])

  useEffect(() => {
    fetch(endpoint)
      .then((r) => r.json())
      .then(({ palette, defaults, templates, randomizer, files }) => {
        setSaved(palette)
        setDefaults(defaults)
        setDraft(palette)
        setTemplates(templates ?? [])
        setRandomizer(randomizer)
        setRandomDraft(randomizer)
        setFiles(files)
      })
      .catch(() => console.warn(`[palette-editor] Could not reach ${endpoint}. Is the Vite plugin installed and the dev server running?`))
    return () => window.clearTimeout(resetTimer.current)
  }, [endpoint])

  // Live preview
  useEffect(() => {
    if (draft) applyPalette(schema, draft, { styleId })
  }, [schema, draft, styleId])

  // While editing, hold the randomizer so what's on screen is the draft
  useEffect(() => {
    setRandomizerPaused(open)
  }, [open])

  // `inert` keeps the closed panel out of the tab order (set directly: React 18 doesn't know the attribute)
  useEffect(() => {
    if (panelRef.current) panelRef.current.inert = !open
  }, [open, draft])

  const dirty = useMemo(() => draft && saved && !same(draft, saved), [draft, saved])
  const atDefaults = useMemo(() => draft && defaults && same(draft, defaults), [draft, defaults])
  const current = useMemo(() => templates.find((t) => same(t.palette, draft)), [templates, draft]) // template on screen, if any

  if (!draft) return null
  const colors = draft[theme]

  const update = (patch) => {
    setMessage(null)
    setDraft((d) => ({ ...d, [theme]: { ...d[theme], ...patch } }))
  }
  /** Set a token, plus whatever the switched-on links derive from it. */
  const setToken = (key, value) => {
    const derived = schema.links.filter((l) => l.from === key && links[l.id]).map((l) => l.derive({ value, colors, theme, palette: draft }))
    // Only tokens the schema still has (a link may set ones an extending schema removed)
    const known = (patch) => Object.fromEntries(Object.entries(patch).filter(([k]) => k in colors))
    update(Object.assign({ [key]: value }, ...derived.map(known)))
  }
  const setListItem = (key, i, value) => setToken(key, colors[key].map((c, j) => (j === i ? value : c)))
  const toggleLink = (link, on) => {
    setLinks((l) => ({ ...l, [link.id]: on }))
    if (on && link.applyOnEnable) update(link.derive({ value: colors[link.from], colors, theme, palette: draft }))
  }

  const request = async (method, path = '', body) => {
    const res = await fetch(endpoint + path, { method, headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`)
    return json
  }
  const fail = (err) => setMessage({ tone: 'error', text: err.message })

  const save = async () => {
    try {
      const { palette } = await request('PUT', '/', draft)
      setSaved(palette)
      setMessage({ tone: 'ok', text: `Saved to ${files?.palette ?? 'the palette file'}` })
    } catch (err) {
      fail(err)
    }
  }

  const reset = async () => {
    if (!confirmReset) {
      setConfirmReset(true)
      resetTimer.current = window.setTimeout(() => setConfirmReset(false), 3500)
      return
    }
    window.clearTimeout(resetTimer.current)
    setConfirmReset(false)
    try {
      const { palette } = await request('POST', '/reset')
      setSaved(palette)
      setDraft(palette)
      setMessage({ tone: 'ok', text: 'Restored the default colours and saved.' })
    } catch (err) {
      fail(err)
    }
  }

  const discard = () => {
    setDraft(saved)
    setMessage(null)
  }

  const applyTemplate = (template) => {
    setDraft(template.palette)
    setConfirmDelete(null)
    setMessage(
      same(template.palette, saved)
        ? { tone: 'ok', text: `“${template.name}” is the live palette.` }
        : { tone: 'info', text: `Previewing “${template.name}”. Save to file to make it the site's palette.` },
    )
  }

  /** Preview a random template from the mix (not the one already showing). */
  const shuffle = () => {
    const pool = templates.filter((t) => !randomizer?.exclude.includes(t.name) && t !== current)
    if (pool.length) applyTemplate(pool[Math.floor(Math.random() * pool.length)])
  }

  const randomDirty = randomDraft && randomizer && !same(randomDraft, randomizer)
  const editRandom = (patch) => setRandomDraft((r) => ({ ...r, ...patch }))
  const toggleInMix = (name) =>
    editRandom({ exclude: randomDraft.exclude.includes(name) ? randomDraft.exclude.filter((n) => n !== name) : [...randomDraft.exclude, name].sort() })

  const saveRandomizer = async () => {
    try {
      await request('PUT', '/randomizer', randomDraft)
      setMessage({ tone: 'ok', text: 'Randomizer saved. Reloading…' }) // the dev server reloads the page
    } catch (err) {
      fail(err)
    }
  }

  const templateSlug = slug(templateName)
  const overwriting = templates.some((t) => t.name === templateSlug)

  const saveTemplate = async (e) => {
    e.preventDefault()
    if (!templateSlug) return
    try {
      const { templates: next } = await request('PUT', `/templates/${encodeURIComponent(templateSlug)}`, draft)
      setTemplates(next)
      setTemplateName('')
      setMessage({ tone: 'ok', text: `${overwriting ? 'Updated' : 'Saved'} template “${templateSlug}”.` })
    } catch (err) {
      fail(err)
    }
  }

  const deleteTemplate = async (name) => {
    if (confirmDelete !== name) return setConfirmDelete(name)
    setConfirmDelete(null)
    try {
      const { templates: next } = await request('DELETE', `/templates/${encodeURIComponent(name)}`)
      setTemplates(next)
      setMessage({ tone: 'ok', text: `Deleted template “${name}”.` })
    } catch (err) {
      fail(err)
    }
  }

  const swatchesOf = (c) => schema.swatches.flatMap((key) => c[key] ?? [])

  return (
    <div className="pe-root" data-pe-theme={theme.includes('dark') ? 'dark' : 'light'}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className={`pe-trigger pe-${side}`}>
        <PaletteIcon size={16} strokeWidth={1.75} />
        {buttonLabel}
        {dirty && <span className="pe-dot" aria-label="unsaved changes" />}
      </button>

      <aside ref={panelRef} aria-label={title} data-open={open} className={`pe-panel pe-${side}`}>
        <header className="pe-header">
          <div className="pe-header-row">
            <div>
              <h2 className="pe-title">{title}</h2>
              {subtitle && <p className="pe-subtitle">{subtitle}</p>}
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close colour editor" className="pe-icon-btn">
              <XIcon size={16} strokeWidth={1.75} />
            </button>
          </div>
          {/* Which theme is being edited (also switches the site to it) */}
          {schema.themes.length > 1 && (
            <div role="tablist" className="pe-tabs">
              {schema.themes.map((t) => (
                <button key={t} type="button" role="tab" aria-selected={theme === t} onClick={() => setTheme(t)} className="pe-tab">
                  {t}
                </button>
              ))}
            </div>
          )}
        </header>

        <div className="pe-body">
          <section className="pe-section">
            <div className="pe-section-head">
              <h3 className="pe-h3">Templates</h3>
              {templates.length > 1 && (
                <button type="button" onClick={shuffle} className="pe-text-btn">
                  <ShuffleIcon /> Shuffle
                </button>
              )}
            </div>
            {templates.length > 0 ? (
              <ul className="pe-templates">
                {templates.map((t) => {
                  const active = t === current
                  const live = same(t.palette, saved)
                  const confirming = confirmDelete === t.name
                  return (
                    <li key={t.name} className="pe-template">
                      <button
                        type="button"
                        onClick={() => applyTemplate(t)}
                        aria-pressed={active}
                        title={t.builtin ? 'Built-in template' : undefined}
                        className="pe-template-btn"
                      >
                        <span aria-hidden="true" className="pe-strip">
                          {swatchesOf(t.palette[theme]).map((c, i) => (
                            <span key={i} style={{ background: c }} />
                          ))}
                        </span>
                        <span className="pe-template-name">{t.name.replace(/-/g, ' ')}</span>
                        {live && <span className="pe-note">Live</span>}
                        {active && <CheckIcon className="pe-accent-icon" strokeWidth={2.25} />}
                      </button>
                      {t.builtin ? (
                        <span className="pe-del-spacer" title="Built-in template" />
                      ) : (
                        <button
                          type="button"
                          onClick={() => deleteTemplate(t.name)}
                          onBlur={() => confirming && setConfirmDelete(null)}
                          aria-label={confirming ? `Click again to delete ${t.name}` : `Delete template ${t.name}`}
                          title={confirming ? 'Click again to delete' : 'Delete template'}
                          data-confirm={confirming}
                          className="pe-del"
                        >
                          {confirming ? 'Delete?' : <TrashIcon strokeWidth={1.75} />}
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="pe-note" style={{ marginTop: 8, fontSize: 12 }}>
                No templates yet. Save the current colours below to create one.
              </p>
            )}
            <form onSubmit={saveTemplate} className="pe-form">
              <input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Name, e.g. autumn"
                aria-label="Template name"
                maxLength={40}
                className="pe-input pe-name"
              />
              <button type="submit" disabled={!templateSlug} className="pe-btn">
                <BookmarkPlusIcon />
                {overwriting ? 'Update' : 'Save as template'}
              </button>
            </form>
            <p className="pe-note" style={{ marginTop: 6 }}>
              Saves every theme&apos;s colours to {files?.templates ?? 'the templates folder'}.
            </p>
          </section>

          {randomDraft && (
            <section className="pe-section">
              <h3 className="pe-h3">Randomizer</h3>
              <p className="pe-note" style={{ marginTop: 4 }}>
                Works on the live site too. Paused while this panel is open.
              </p>

              <label className="pe-check" style={{ marginTop: 12 }}>
                <input type="checkbox" checked={randomDraft.onRefresh} onChange={(e) => editRandom({ onRefresh: e.target.checked })} />
                New palette on every refresh
              </label>
              <div className="pe-row">
                <label className="pe-check">
                  <input
                    type="checkbox"
                    checked={randomDraft.everySeconds > 0}
                    onChange={(e) => editRandom({ everySeconds: e.target.checked ? randomizer.everySeconds || 30 : 0 })}
                  />
                  Change every
                </label>
                <input
                  type="number"
                  min={3}
                  max={3600}
                  value={randomDraft.everySeconds || ''}
                  placeholder="30"
                  disabled={!randomDraft.everySeconds}
                  aria-label="Seconds between changes"
                  onChange={(e) => editRandom({ everySeconds: Math.min(3600, Math.max(3, Math.round(Number(e.target.value) || 3))) })}
                  className="pe-input pe-small-num"
                />
                seconds
              </div>
              <div className="pe-row pe-indent" data-off={!randomDraft.everySeconds}>
                <span>Drift over</span>
                <input
                  type="number"
                  min={0}
                  max={60}
                  step={0.5}
                  value={randomDraft.fadeSeconds}
                  disabled={!randomDraft.everySeconds}
                  aria-label="Seconds each change takes"
                  onChange={(e) => editRandom({ fadeSeconds: Math.min(60, Math.max(0, Number(e.target.value) || 0)) })}
                  className="pe-input pe-small-num"
                />
                seconds
                <span className="pe-note">(0 = quick fade)</span>
              </div>

              <p className="pe-note" style={{ marginTop: 12, fontWeight: 500 }}>
                In the mix
              </p>
              <div className="pe-chips">
                {templates.map((t) => (
                  <button key={t.name} type="button" onClick={() => toggleInMix(t.name)} aria-pressed={!randomDraft.exclude.includes(t.name)} className="pe-chip">
                    <span style={{ background: t.palette[theme][schema.accent] }} />
                    {t.name}
                  </button>
                ))}
              </div>

              <div className="pe-split">
                <p className="pe-note">
                  {randomDraft.onRefresh || randomDraft.everySeconds
                    ? `${templates.length - randomDraft.exclude.filter((n) => templates.some((t) => t.name === n)).length} templates in the mix`
                    : 'Off: the site uses the saved palette'}
                </p>
                <button type="button" onClick={saveRandomizer} disabled={!randomDirty} className="pe-btn">
                  <SaveIcon /> Save randomizer
                </button>
              </div>
            </section>
          )}

          {schema.groups.map((group) => (
            <section key={group.label} className="pe-section">
              <h3 className="pe-h3">{group.label}</h3>
              {schema.links
                .filter((l) => l.group === group.label)
                .map((link) => (
                  <label key={link.id} className="pe-check pe-check-sm">
                    <input type="checkbox" checked={links[link.id]} onChange={(e) => toggleLink(link, e.target.checked)} />
                    {link.label}
                  </label>
                ))}
              <div style={{ marginTop: 6 }}>
                {group.tokens.map((token) => (
                  <ColorField key={token.key} label={token.label} value={colors[token.key]} alpha={token.alpha} onChange={(v) => setToken(token.key, v)} />
                ))}
              </div>
            </section>
          ))}
          {schema.lists.map((list) => (
            <section key={list.key} className="pe-section">
              <h3 className="pe-h3">{list.label}</h3>
              {schema.links
                .filter((l) => l.group === list.label)
                .map((link) => (
                  <label key={link.id} className="pe-check pe-check-sm">
                    <input type="checkbox" checked={links[link.id]} onChange={(e) => toggleLink(link, e.target.checked)} />
                    {link.label}
                  </label>
                ))}
              <div style={{ marginTop: 6 }}>
                {list.items.map((label, i) => (
                  <ColorField key={i} label={label} value={colors[list.key][i]} alpha={list.alpha} onChange={(v) => setListItem(list.key, i, v)} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <footer className="pe-footer">
          <p role="status" className="pe-status" data-tone={message?.tone}>
            {message ? (
              <>
                {message.tone === 'ok' && <CheckIcon className="pe-success-icon" />}
                {message.text}
              </>
            ) : dirty ? (
              'Unsaved changes (previewing)'
            ) : current ? (
              `Using the “${current.name}” template`
            ) : atDefaults ? (
              'Using the default colours'
            ) : (
              'Using your saved colours'
            )}
          </p>
          <div className="pe-actions">
            <button type="button" onClick={save} disabled={!dirty} className="pe-btn pe-btn-primary">
              <SaveIcon /> Save to file
            </button>
            <button type="button" onClick={discard} disabled={!dirty} className="pe-btn">
              <UndoIcon /> Discard
            </button>
            <button type="button" onClick={reset} disabled={atDefaults && !dirty} data-confirm={confirmReset} className="pe-btn pe-btn-danger">
              <ResetIcon />
              {confirmReset ? 'Click to confirm' : 'Reset to defaults'}
            </button>
          </div>
        </footer>
      </aside>
    </div>
  )
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const slug = (name) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)

export default PaletteEditor
