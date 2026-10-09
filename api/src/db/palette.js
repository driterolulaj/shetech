import { pool, transaction } from './pool.js'

/** The hosted site's colours: settings ('palette', 'randomizer', 'defaults') and named templates. */

export async function getSettings() {
  const { rows } = await pool.query('SELECT key, value FROM site_settings')
  return Object.fromEntries(rows.map((r) => [r.key, r.value]))
}

export async function setSetting(key, value) {
  await pool.query(
    `INSERT INTO site_settings (key, value, updated_at) VALUES ($1, $2, $3)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at`,
    [key, JSON.stringify(value), new Date()],
  )
}

/** { name, palette } A–Z. */
export async function listTemplates() {
  const { rows } = await pool.query('SELECT name, palette FROM palette_templates ORDER BY name')
  return rows
}

export async function saveTemplate(name, palette) {
  await pool.query(
    `INSERT INTO palette_templates (name, palette, updated_at) VALUES ($1, $2, $3)
     ON CONFLICT (name) DO UPDATE SET palette = EXCLUDED.palette, updated_at = EXCLUDED.updated_at`,
    [name, JSON.stringify(palette), new Date()],
  )
}

export async function deleteTemplate(name) {
  await pool.query('DELETE FROM palette_templates WHERE name = $1', [name])
}

/**
 * Fills the tables from the repository's colour files: the defaults every time (they
 * only change with the code), everything else only once, so the colours saved on the
 * hosted site are never overwritten by a deploy. Returns true when it seeded.
 */
export function seedPalette({ defaults, palette, randomizer, templates }) {
  return transaction(async (db) => {
    const now = new Date()
    const upsert = (key, value, overwrite) =>
      db.query(
        `INSERT INTO site_settings (key, value, updated_at) VALUES ($1, $2, $3)
         ON CONFLICT (key) DO ${overwrite ? 'UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at' : 'NOTHING'}`,
        [key, JSON.stringify(value), now],
      )
    await upsert('defaults', defaults, true)
    const { rowCount: seeded } = await db.query('SELECT 1 FROM site_settings WHERE key = $1', ['palette'])
    if (seeded) return false
    await upsert('palette', palette, false)
    await upsert('randomizer', randomizer, false)
    for (const t of templates) {
      await db.query('INSERT INTO palette_templates (name, palette, updated_at) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING', [
        t.name,
        JSON.stringify(t.palette),
        now,
      ])
    }
    return true
  })
}
