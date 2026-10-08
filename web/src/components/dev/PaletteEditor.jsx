import { useEffect, useMemo, useRef, useState } from 'react'
import { BookmarkPlus, Check, Palette, RotateCcw, Save, Shuffle, Trash2, Undo2, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { applyPalette, deriveAccent, deriveLogo, isHexColor, MESH_SIZE, PALETTE_GROUPS, parseHex, toHex } from '../../lib/palette'
import { setRandomizerPaused } from '../../lib/paletteRandomizer'
import { setThemePreference, useTheme } from '../../lib/theme'
import { SITE } from '../../config/site'

/**
 * Colour scheme editor (development, and the studio deployment built with
 * VITE_PALETTE_EDITOR=true; not part of the normal production build).
 *
 * Changes preview live. "Save" writes src/config/palette.json, which is what the
 * site is built from. "Reset" restores src/config/palette.defaults.json.
 * Templates are named palettes in src/config/palettes/<name>.json: pick one to
 * preview it, then "Save to file" to make it the site's palette.
 *
 * In development the files are written by the dev server (/__palette). On a deployed
 * site the API commits them to GitHub (/api/admin/palette, signed-in admins only),
 * and the site rebuilds with them; for anyone else the editor stays hidden.
 */
const DEPLOYED = !import.meta.env.DEV
const API = DEPLOYED ? `${SITE.apiUrl}/api/admin/palette` : '/__palette'
const FETCH_OPTIONS = DEPLOYED ? { credentials: SITE.apiUrl ? 'include' : 'same-origin', headers: { 'X-Admin': '1' } } : { headers: {} }
const REBUILD = 'The site rebuilds with it in about a minute.'
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const slug = (name) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)

/** A template's key colours at a glance: page, text, accent and the four gradient colours. */
function Swatches({ colors }) {
  return (
    <span aria-hidden="true" className="flex shrink-0 overflow-hidden rounded-[3px] border border-line-strong">
      {[colors.surface, colors.ink, colors.accent, ...colors.mesh].map((c, i) => (
        <span key={i} className="h-5 w-2.5" style={{ background: c }} />
      ))}
    </span>
  )
}

// Checkerboard behind swatches so transparency is visible
const CHECKER = 'repeating-conic-gradient(#cbd5e1 0% 25%, #ffffff 0% 50%) 0 0 / 8px 8px'

function ColorField({ label, value, onChange, alpha = true }) {
  const [text, setText] = useState(value)
  useEffect(() => setText(value), [value])
  const { a } = parseHex(value)
  const opaque = toHex({ ...parseHex(value), a: 1 })

  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <label className="relative size-7 shrink-0 cursor-pointer overflow-hidden rounded-sm border border-line-strong" style={{ background: CHECKER }}>
        <span className="absolute inset-0" style={{ background: value }} />
        <input
          type="color"
          value={opaque}
          onChange={(e) => onChange(toHex({ ...parseHex(e.target.value), a }))}
          aria-label={`${label} colour`}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </label>
      <span className="min-w-0 flex-1 truncate text-[13px] text-ink-2">{label}</span>
      <input
        value={text}
        spellCheck={false}
        aria-label={`${label} hex value`}
        onChange={(e) => {
          const next = e.target.value.trim()
          setText(next)
          if (isHexColor(next)) onChange(next.toLowerCase())
        }}
        onBlur={() => setText(value)}
        className={cn(
          'w-[5.75rem] rounded-sm border bg-surface px-2 py-1 font-mono text-xs text-ink outline-none transition-colors duration-300 ease-soft focus:border-accent',
          isHexColor(text) ? 'border-line-strong' : 'border-danger',
        )}
      />
      {alpha ? (
        <label className="flex w-[3.75rem] items-center gap-0.5 font-mono text-xs text-ink-3">
          <input
            type="number"
            min={0}
            max={100}
            value={Math.round(a * 100)}
            aria-label={`${label} opacity`}
            onChange={(e) => onChange(toHex({ ...parseHex(value), a: Math.min(100, Math.max(0, Number(e.target.value))) / 100 }))}
            className="w-12 rounded-sm border border-line-strong bg-surface px-1 py-1 text-right text-ink outline-none [appearance:textfield] focus:border-accent [&::-webkit-inner-spin-button]:appearance-none"
          />
          %
        </label>
      ) : (
        <span className="w-[3.75rem]" />
      )}
    </div>
  )
}

export default function PaletteEditor() {
  const { theme } = useTheme()
  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState(null) // what's in palette.json
  const [defaults, setDefaults] = useState(null)
  const [templates, setTemplates] = useState([])
  const [templateName, setTemplateName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null) // template name awaiting a second click
  const [draft, setDraft] = useState(null) // what's on screen
  const [autoAccent, setAutoAccent] = useState(true)
  const [logoFollows, setLogoFollows] = useState(true)
  const [confirmReset, setConfirmReset] = useState(false)
  const [message, setMessage] = useState(null) // { tone: 'ok' | 'error', text }
  const [loadError, setLoadError] = useState(null) // why the saved colours couldn't be loaded
  const [randomizer, setRandomizer] = useState(null) // saved settings
  const [randomDraft, setRandomDraft] = useState(null) // settings being edited
  const resetTimer = useRef(0)

  useEffect(() => {
    fetch(API, FETCH_OPTIONS)
      .then((r) => {
        // Deployed: not signed in as an admin, so there's no editor
        if (DEPLOYED && r.status === 401) throw Object.assign(new Error(), { hidden: true })
        return r.json().then((json) => (r.ok ? json : Promise.reject(new Error(json.error))))
      })
      .then(({ palette, defaults, templates, randomizer }) => {
        setSaved(palette)
        setDefaults(defaults)
        setDraft(palette)
        setTemplates(templates ?? [])
        setRandomizer(randomizer)
        setRandomDraft(randomizer)
      })
      .catch((err) => {
        if (err.hidden) return
        setLoadError(err.message || (DEPLOYED ? 'Could not reach the API.' : 'Could not reach the dev server.'))
      })
    return () => window.clearTimeout(resetTimer.current)
  }, [])

  // Live preview
  useEffect(() => {
    if (draft) applyPalette(draft)
  }, [draft])

  // While editing, hold the randomizer so what's on screen is the draft
  useEffect(() => {
    setRandomizerPaused(open)
  }, [open])

  const dirty = useMemo(() => draft && saved && !same(draft, saved), [draft, saved])
  const atDefaults = useMemo(() => draft && defaults && same(draft, defaults), [draft, defaults])
  const current = useMemo(() => templates.find((t) => same(t.palette, draft)), [templates, draft]) // template on screen, if any

  // Nothing to edit without the saved colours: say why rather than vanish
  if (!draft) {
    return loadError ? (
      <p
        role="status"
        className="liquid-glass fixed bottom-4 right-4 z-[60] flex max-w-[min(calc(100vw-2rem),23rem)] items-start gap-2 rounded-sm px-3.5 py-2.5 text-[13px] text-ink [--glass-a:0.85] [--glass-b:0.7]"
      >
        <Palette className="mt-0.5 size-4 shrink-0 text-danger" strokeWidth={1.75} />
        <span>Colours unavailable: {loadError}</span>
      </p>
    ) : null
  }
  const colors = draft[theme]

  const update = (patch) => {
    setMessage(null)
    setDraft((d) => ({ ...d, [theme]: { ...d[theme], ...patch } }))
  }
  const setToken = (token, value) => {
    if (token !== 'accent') return update({ [token]: value })
    update({
      accent: value,
      ...(autoAccent && deriveAccent(value, colors.surface, theme)),
      ...(logoFollows && deriveLogo(value)),
    })
  }
  const setMesh = (i, value) => update({ mesh: colors.mesh.map((c, j) => (j === i ? value : c)) })

  const request = async (method, path = '', body) => {
    const res = await fetch(API + path, {
      ...FETCH_OPTIONS,
      method,
      headers: { ...FETCH_OPTIONS.headers, 'Content-Type': 'application/json' },
      body: body && JSON.stringify(body),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`)
    return json
  }

  const save = async () => {
    try {
      const { palette } = await request('PUT', '', draft)
      setSaved(palette)
      setMessage({ tone: 'ok', text: DEPLOYED ? `Saved. ${REBUILD}` : 'Saved to src/config/palette.json' })
    } catch (err) {
      setMessage({ tone: 'error', text: err.message })
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
      setMessage({ tone: 'ok', text: `Restored the default colours and saved.${DEPLOYED ? ` ${REBUILD}` : ''}` })
    } catch (err) {
      setMessage({ tone: 'error', text: err.message })
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
      const { randomizer: next } = await request('PUT', '/randomizer', randomDraft)
      if (DEPLOYED) {
        setRandomizer(next)
        setRandomDraft(next)
        setMessage({ tone: 'ok', text: `Randomizer saved. ${REBUILD}` })
      } else {
        setMessage({ tone: 'ok', text: 'Randomizer saved. Reloading…' }) // the dev server reloads the page
      }
    } catch (err) {
      setMessage({ tone: 'error', text: err.message })
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
      setMessage({ tone: 'error', text: err.message })
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
      setMessage({ tone: 'error', text: err.message })
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="liquid-glass fixed bottom-4 right-4 z-[60] inline-flex h-10 items-center gap-2 rounded-sm px-3.5 text-sm font-medium text-ink [--glass-a:0.85] [--glass-b:0.7] hover:text-accent"
      >
        <Palette className="size-4" strokeWidth={1.75} />
        Colours
        {dirty && <span className="size-1.5 rounded-full bg-accent" aria-label="unsaved changes" />}
      </button>

      <aside
        aria-label="Colour scheme editor"
        inert={!open}
        className={cn(
          'fixed bottom-16 right-4 top-20 z-[60] flex w-[min(calc(100vw-2rem),23rem)] flex-col overflow-hidden rounded-sm border border-line bg-surface shadow-[0_30px_80px_-30px_rgb(10_37_64/0.45)]',
          'transition-[opacity,transform] duration-500 ease-soft',
          open ? 'opacity-100' : 'pointer-events-none translate-y-2 opacity-0',
        )}
      >
        <header className="border-b border-line px-5 pb-4 pt-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-light tracking-tight text-ink">Colour scheme</h2>
              <p className="mt-0.5 text-xs text-ink-3">{DEPLOYED ? 'Saving updates the live site.' : 'Only visible while running npm run dev.'}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close colour editor"
              className="grid size-8 place-items-center rounded-sm text-ink-2 transition-colors duration-300 ease-soft hover:text-accent"
            >
              <X className="size-4" strokeWidth={1.75} />
            </button>
          </div>
          {/* Which theme is being edited (also switches the site to it) */}
          <div role="tablist" className="mt-4 grid grid-cols-2 rounded-sm border border-line bg-canvas p-1">
            {['light', 'dark'].map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={theme === t}
                onClick={() => setThemePreference(t)}
                className={cn(
                  'h-8 rounded-sm text-sm font-medium capitalize transition-colors duration-300 ease-soft',
                  theme === t ? 'bg-surface text-ink shadow-[0_1px_2px_rgb(10_37_64/0.08)]' : 'text-ink-3 hover:text-ink-2',
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-3">
          <section className="border-b border-line pb-4 pt-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3">Templates</h3>
              {templates.length > 1 && (
                <button
                  type="button"
                  onClick={shuffle}
                  className="inline-flex items-center gap-1 text-xs font-medium text-accent transition-colors duration-300 ease-soft hover:text-ink"
                >
                  <Shuffle className="size-3.5" strokeWidth={2} /> Shuffle
                </button>
              )}
            </div>
            {templates.length > 0 ? (
              <ul className="mt-2.5 grid gap-1.5">
                {templates.map((t) => {
                  const active = t === current
                  const live = same(t.palette, saved)
                  const confirming = confirmDelete === t.name
                  return (
                    <li key={t.name} className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => applyTemplate(t)}
                        aria-pressed={active}
                        className={cn(
                          'flex min-w-0 flex-1 items-center gap-3 rounded-sm border px-2.5 py-2 text-left transition-colors duration-300 ease-soft',
                          active ? 'border-accent bg-accent-wash' : 'border-line-strong hover:border-line-hover',
                        )}
                      >
                        <Swatches colors={t.palette[theme]} />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium capitalize text-ink">{t.name.replace(/-/g, ' ')}</span>
                        {live && <span className="text-[11px] text-ink-3">Live</span>}
                        {active && <Check className="size-3.5 shrink-0 text-accent" strokeWidth={2.25} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTemplate(t.name)}
                        onBlur={() => confirming && setConfirmDelete(null)}
                        aria-label={confirming ? `Click again to delete ${t.name}` : `Delete template ${t.name}`}
                        title={confirming ? 'Click again to delete' : 'Delete template'}
                        className={cn(
                          'grid h-9 shrink-0 place-items-center rounded-sm border transition-colors duration-300 ease-soft',
                          confirming ? 'border-danger px-2 text-[11px] font-medium text-danger' : 'w-9 border-transparent text-ink-3 hover:text-danger',
                        )}
                      >
                        {confirming ? 'Delete?' : <Trash2 className="size-3.5" strokeWidth={1.75} />}
                      </button>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-ink-3">No templates yet. Save the current colours below to create one.</p>
            )}
            <form onSubmit={saveTemplate} className="mt-3 flex gap-2">
              <input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Name, e.g. autumn"
                aria-label="Template name"
                maxLength={40}
                className="min-w-0 flex-1 rounded-sm border border-line-strong bg-surface px-2.5 py-1.5 text-[13px] text-ink outline-none transition-colors duration-300 ease-soft placeholder:text-ink-3/70 focus:border-accent"
              />
              <button
                type="submit"
                disabled={!templateSlug}
                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-sm border border-line-strong px-3 text-[13px] font-medium text-ink transition-colors duration-300 ease-soft hover:border-accent hover:text-accent disabled:opacity-40"
              >
                <BookmarkPlus className="size-3.5" strokeWidth={2} />
                {overwriting ? 'Update' : 'Save as template'}
              </button>
            </form>
            <p className="mt-1.5 text-[11px] text-ink-3">Saves the light and dark colours to src/config/palettes/.</p>
          </section>

          {randomDraft && (
            <section className="border-b border-line pb-4 pt-3">
              <h3 className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3">Randomizer</h3>
              <p className="mt-1 text-[11px] text-ink-3">Works on the live site too. Paused while this panel is open.</p>

              <label className="mt-3 flex cursor-pointer items-center gap-2 text-[13px] text-ink-2">
                <input
                  type="checkbox"
                  checked={randomDraft.onRefresh}
                  onChange={(e) => editRandom({ onRefresh: e.target.checked })}
                  className="accent-[var(--accent)]"
                />
                New palette on every refresh
              </label>
              <div className="mt-2 flex items-center gap-2 text-[13px] text-ink-2">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={randomDraft.everySeconds > 0}
                    onChange={(e) => editRandom({ everySeconds: e.target.checked ? randomizer.everySeconds || 30 : 0 })}
                    className="accent-[var(--accent)]"
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
                  className="w-16 rounded-sm border border-line-strong bg-surface px-2 py-1 text-right font-mono text-xs text-ink outline-none focus:border-accent disabled:opacity-40"
                />
                seconds
              </div>
              <div className={cn('mt-2 flex items-center gap-2 pl-6 text-[13px] text-ink-2', !randomDraft.everySeconds && 'opacity-40')}>
                <label htmlFor="palette-fade">Drift over</label>
                <input
                  id="palette-fade"
                  type="number"
                  min={0}
                  max={60}
                  step={0.5}
                  value={randomDraft.fadeSeconds}
                  disabled={!randomDraft.everySeconds}
                  onChange={(e) => editRandom({ fadeSeconds: Math.min(60, Math.max(0, Number(e.target.value) || 0)) })}
                  className="w-16 rounded-sm border border-line-strong bg-surface px-2 py-1 text-right font-mono text-xs text-ink outline-none focus:border-accent"
                />
                seconds
                <span className="text-[11px] text-ink-3">(0 = quick fade)</span>
              </div>

              <p className="mt-3 text-[11px] font-medium text-ink-3">In the mix</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {templates.map((t) => {
                  const included = !randomDraft.exclude.includes(t.name)
                  return (
                    <button
                      key={t.name}
                      type="button"
                      onClick={() => toggleInMix(t.name)}
                      aria-pressed={included}
                      className={cn(
                        'inline-flex h-7 items-center gap-1.5 rounded-sm border px-2 text-xs transition-colors duration-300 ease-soft',
                        included ? 'border-accent bg-accent-wash text-ink' : 'border-line-strong text-ink-3 line-through decoration-ink-3/50 hover:text-ink-2',
                      )}
                    >
                      <span className="size-2.5 rounded-full" style={{ background: t.palette[theme].accent }} />
                      {t.name}
                    </button>
                  )
                })}
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-[11px] text-ink-3">
                  {randomDraft.onRefresh || randomDraft.everySeconds
                    ? `${templates.length - randomDraft.exclude.filter((n) => templates.some((t) => t.name === n)).length} templates in the mix`
                    : 'Off: the site uses the saved palette'}
                </p>
                <button
                  type="button"
                  onClick={saveRandomizer}
                  disabled={!randomDirty}
                  className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-sm border border-line-strong px-3 text-[13px] font-medium text-ink transition-colors duration-300 ease-soft hover:border-accent hover:text-accent disabled:opacity-40"
                >
                  <Save className="size-3.5" strokeWidth={2} /> Save randomizer
                </button>
              </div>
            </section>
          )}

          {PALETTE_GROUPS.map((group) => (
            <section key={group.label} className="border-b border-line py-3 last:border-b-0">
              <h3 className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3">{group.label}</h3>
              {group.label === 'Brand' && (
                <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-ink-2">
                  <input type="checkbox" checked={autoAccent} onChange={(e) => setAutoAccent(e.target.checked)} className="accent-[var(--accent)]" />
                  Derive hover and wash from the accent
                </label>
              )}
              {group.label === 'Logo' && (
                <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-ink-2">
                  <input
                    type="checkbox"
                    checked={logoFollows}
                    onChange={(e) => {
                      setLogoFollows(e.target.checked)
                      if (e.target.checked) update(deriveLogo(colors.accent))
                    }}
                    className="accent-[var(--accent)]"
                  />
                  Follow the accent colour
                </label>
              )}
              <div className="mt-1.5">
                {Object.entries(group.tokens).map(([token, label]) => (
                  <ColorField key={token} label={label} value={colors[token]} onChange={(v) => setToken(token, v)} />
                ))}
              </div>
            </section>
          ))}
          <section className="py-3">
            <h3 className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3">Hero gradient</h3>
            <div className="mt-1.5">
              {Array.from({ length: MESH_SIZE }, (_, i) => (
                <ColorField
                  key={i}
                  label={['Base', 'Layer 2', 'Layer 3', 'Top layer'][i]}
                  value={colors.mesh[i]}
                  alpha={false}
                  onChange={(v) => setMesh(i, v)}
                />
              ))}
            </div>
          </section>
        </div>

        <footer className="border-t border-line bg-canvas px-5 py-4">
          <p
            role="status"
            className={cn('mb-3 flex min-h-4 items-center gap-1.5 text-xs', message?.tone === 'error' ? 'text-danger' : 'text-ink-3')}
          >
            {message ? (
              <>
                {message.tone === 'ok' && <Check className="size-3.5 text-success" strokeWidth={2} />}
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
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={save}
              disabled={!dirty}
              className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-accent px-3 text-[13px] font-medium text-white transition-colors duration-300 ease-soft hover:bg-accent-strong disabled:opacity-40"
            >
              <Save className="size-3.5" strokeWidth={2} /> Save to file
            </button>
            <button
              type="button"
              onClick={discard}
              disabled={!dirty}
              className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-line-strong px-3 text-[13px] font-medium text-ink transition-colors duration-300 ease-soft hover:border-accent hover:text-accent disabled:opacity-40"
            >
              <Undo2 className="size-3.5" strokeWidth={2} /> Discard
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={atDefaults && !dirty}
              className={cn(
                'ml-auto inline-flex h-8 items-center gap-1.5 rounded-sm border px-3 text-[13px] font-medium transition-colors duration-300 ease-soft disabled:opacity-40',
                confirmReset ? 'border-danger text-danger' : 'border-line-strong text-ink-2 hover:border-danger hover:text-danger',
              )}
            >
              <RotateCcw className="size-3.5" strokeWidth={2} />
              {confirmReset ? 'Click to confirm' : 'Reset to defaults'}
            </button>
          </div>
        </footer>
      </aside>
    </>
  )
}
