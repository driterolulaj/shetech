// Switch the site's palette to a saved template: npm run palette:use -- purple
// (copies src/config/palettes/<name>.json over src/config/palette.json)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dir = path.join(root, 'src/config/palettes')
const available = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)) : []
const name = process.argv[2]

if (!name || !available.includes(name)) {
  console.error(`${name ? `No template called "${name}". ` : ''}Usage: npm run palette:use -- <name>\nTemplates: ${available.join(', ') || '(none yet)'}`)
  process.exit(1)
}
fs.copyFileSync(path.join(dir, `${name}.json`), path.join(root, 'src/config/palette.json'))
console.log(`Palette set to "${name}" (src/config/palette.json). Rebuild to apply it to dist/.`)
