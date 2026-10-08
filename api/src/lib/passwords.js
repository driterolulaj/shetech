import crypto from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(crypto.scrypt)
const PARAMS = { N: 16384, r: 8, p: 1 }
const KEY_LENGTH = 64

/** "scrypt$N$r$p$salt$hash" (base64url), so parameters can be raised later without breaking old hashes. */
export async function hashPassword(password) {
  const salt = crypto.randomBytes(16)
  const hash = await scrypt(password, salt, KEY_LENGTH, PARAMS)
  return ['scrypt', PARAMS.N, PARAMS.r, PARAMS.p, salt.toString('base64url'), hash.toString('base64url')].join('$')
}

export async function verifyPassword(password, stored) {
  const [scheme, N, r, p, salt, hash] = String(stored).split('$')
  if (scheme !== 'scrypt' || !hash) return false
  const expected = Buffer.from(hash, 'base64url')
  const actual = await scrypt(password, Buffer.from(salt, 'base64url'), expected.length, { N: Number(N), r: Number(r), p: Number(p) })
  return crypto.timingSafeEqual(actual, expected)
}

/** A hash to verify against when the email is unknown, so timing doesn't reveal which emails exist. */
export const DUMMY_HASH = await hashPassword(crypto.randomBytes(16).toString('hex'))

export const randomToken = () => crypto.randomBytes(32).toString('base64url')
export const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex')
