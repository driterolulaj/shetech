import readline from 'node:readline'
import { saveAdmin } from '../db/admins.js'
import { migrate } from '../db/migrate.js'
import { pool } from '../db/pool.js'
import { hashPassword } from '../lib/passwords.js'

/**
 * Add an admin, or reset an existing admin's password (which signs them out everywhere).
 *   npm run admin:create -- you@example.com
 * The password is asked for without echoing it.
 */
function ask(question, { hidden = false } = {}) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true })
  if (hidden) rl._writeToOutput = (s) => rl.output.write(s.includes(question) ? s : '')
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close()
      if (hidden) process.stdout.write('\n')
      resolve(answer.trim())
    }),
  )
}

try {
  await migrate({ log: () => {} })
  const email = process.argv[2] || (await ask('Admin email: '))
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('That is not an email address.')
  const password = await ask('Password (min. 10 characters): ', { hidden: true })
  if (password.length < 10) throw new Error('Use at least 10 characters.')
  if ((await ask('Repeat password: ', { hidden: true })) !== password) throw new Error('The passwords do not match.')

  const outcome = await saveAdmin(email, await hashPassword(password))
  console.log(outcome === 'created' ? `Admin ${email} created.` : `Password for ${email} updated; their sessions were signed out.`)
} catch (err) {
  console.error(err.message)
  process.exitCode = 1
} finally {
  await pool.end()
}
