#!/usr/bin/env node
// palette-editor CLI: switch or reset the palette file from the terminal.
//
//   palette-editor list             your templates and the built-in ones
//   palette-editor use <name>       copy that template over the palette file
//   palette-editor reset            copy the defaults file (or the built-in defaults) over the palette file
//   palette-editor init             copy the built-in defaults and templates into your project to edit freely
//
// Paths default to the Vite plugin's defaults (relative to the current folder):
//   --palette   src/config/palette.json
//   --defaults  src/config/palette.defaults.json
//   --templates src/config/palettes
//   --dir <dir> shorthand: <dir>/palette.json, <dir>/palette.defaults.json, <dir>/palettes
//   --no-builtin  ignore the built-in templates
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PRESET = fileURLToPath(new URL('../presets/default/', import.meta.url))

const args = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf(`--${name}`)
  if (i === -1) return undefined
  const [, value] = args.splice(i, 2)
  return value
}
const toggle = (name) => {
  const i = args.indexOf(`--${name}`)
  if (i !== -1) args.splice(i, 1)
  return i !== -1
}

const builtin = !toggle('no-builtin')
const dir = flag('dir') ?? 'src/config'
const file = {
  palette: path.resolve(flag('palette') ?? path.join(dir, 'palette.json')),
  defaults: path.resolve(flag('defaults') ?? path.join(dir, 'palette.defaults.json')),
  templates: path.resolve(flag('templates') ?? path.join(dir, 'palettes')),
}
const [command, name] = args
const rel = (p) => path.relative(process.cwd(), p).split(path.sep).join('/')

const namesIn = (folder) => (fs.existsSync(folder) ? fs.readdirSync(folder).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)) : [])
const own = namesIn(file.templates)
const builtins = builtin ? namesIn(path.join(PRESET, 'palettes')).filter((n) => !own.includes(n)) : []
const available = [...own, ...builtins].sort()
/** Your template wins over a built-in one with the same name */
const templatePath = (n) => (own.includes(n) ? path.join(file.templates, `${n}.json`) : path.join(PRESET, 'palettes', `${n}.json`))

const usage = `Usage:
  palette-editor list
  palette-editor use <name>
  palette-editor reset
  palette-editor init
Options: --dir <dir> | --palette <file> --defaults <file> --templates <dir>, --no-builtin`

function fail(message) {
  console.error(message)
  process.exit(1)
}

function copy(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true })
  fs.copyFileSync(from, to)
}

switch (command) {
  case 'list':
    if (!available.length) console.log(`(no templates in ${rel(file.templates)})`)
    for (const n of available) console.log(builtins.includes(n) ? `${n}  (built-in)` : n)
    break

  case 'use':
    if (!name || !available.includes(name)) {
      fail(`${name ? `No template called "${name}". ` : ''}Usage: palette-editor use <name>\nTemplates: ${available.join(', ') || '(none yet)'}`)
    }
    copy(templatePath(name), file.palette)
    console.log(`Palette set to "${name}" (${rel(file.palette)}). Rebuild to apply it to your production build.`)
    break

  case 'reset': {
    const from = fs.existsSync(file.defaults) ? file.defaults : path.join(PRESET, 'palette.defaults.json')
    copy(from, file.palette)
    console.log(`Colours reset to ${fs.existsSync(file.defaults) ? rel(file.defaults) : 'the built-in defaults'} (${rel(file.palette)})`)
    break
  }

  case 'init': {
    // Never overwrites: existing files are yours
    const copied = []
    const add = (from, to) => {
      if (fs.existsSync(to)) return
      copy(from, to)
      copied.push(rel(to))
    }
    add(path.join(PRESET, 'palette.defaults.json'), file.defaults)
    for (const n of namesIn(path.join(PRESET, 'palettes'))) add(path.join(PRESET, 'palettes', `${n}.json`), path.join(file.templates, `${n}.json`))
    console.log(copied.length ? `Copied:\n  ${copied.join('\n  ')}` : 'Nothing to copy: those files already exist.')
    break
  }

  default:
    fail(usage)
}
