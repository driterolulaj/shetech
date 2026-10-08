import { config } from '../config.js'

/**
 * Reads and commits files in the site's GitHub repository (contents API), for
 * the colour editor on a deployed site: saving commits the palette files, and
 * the push makes Vercel rebuild the website with them.
 */
const { github } = config

export const githubConfigured = Boolean(github.token && github.repo)

async function request(method, path, body) {
  const res = await fetch(`https://api.github.com/repos/${github.repo}/contents/${path}`, {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${github.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body && { 'Content-Type': 'application/json' }),
    },
    body: body && JSON.stringify(body),
  })
  if (res.status === 404 && method === 'GET') return null
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const reason =
      res.status === 409 || res.status === 422
        ? 'it was changed elsewhere; reload and try again'
        : res.status === 401
          ? 'GITHUB_TOKEN is invalid or expired'
          : res.status === 403
            ? `GITHUB_TOKEN can't write to ${github.repo} (it needs Contents: Read and write)`
            : json.message || res.status
    throw Object.assign(new Error(`GitHub: ${reason}`), { status: 502 })
  }
  return json
}

const ref = () => `?ref=${encodeURIComponent(github.branch)}`

/** { text, sha } of a file, or null if it doesn't exist. */
export async function readFile(path) {
  const file = await request('GET', `${path}${ref()}`)
  return file && { text: Buffer.from(file.content, 'base64').toString('utf8'), sha: file.sha }
}

/** Names of the files in a directory ([] if it doesn't exist). */
export async function listFiles(path) {
  const entries = await request('GET', `${path}${ref()}`)
  return (entries ?? []).filter((e) => e.type === 'file').map((e) => e.name)
}

/** Creates or replaces a file in one commit. Skips the commit when nothing changed. */
export async function writeFile(path, text, message) {
  const current = await readFile(path)
  if (current?.text === text) return
  await request('PUT', path, { message, content: Buffer.from(text).toString('base64'), branch: github.branch, ...(current && { sha: current.sha }) })
}

export async function deleteFile(path, message) {
  const current = await readFile(path)
  if (current) await request('DELETE', path, { message, sha: current.sha, branch: github.branch })
}
