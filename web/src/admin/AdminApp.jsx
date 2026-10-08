import { useEffect, useState } from 'react'
import { AlertCircle, Loader2, LockKeyhole } from 'lucide-react'
import { LogoMark } from '../components/brand/Logo'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Field'
import { api } from './api'
import { Dashboard } from './Dashboard'

/** /admin: session check → sign-in screen or the bookings dashboard. */
export function AdminApp() {
  const [session, setSession] = useState(null) // null while loading

  useEffect(() => {
    api
      .session()
      .then(setSession)
      .catch(() => setSession({ authenticated: false, offline: true }))
  }, [])

  if (!session) {
    return (
      <div className="grid min-h-dvh place-items-center bg-canvas">
        <Loader2 className="size-5 animate-spin text-ink-3" strokeWidth={2} />
      </div>
    )
  }

  const signedOut = () => setSession({ authenticated: false })

  if (!session.authenticated) {
    return <SignIn offline={session.offline} onSignedIn={setSession} />
  }

  return (
    <Dashboard
      email={session.email}
      onUnauthorized={signedOut}
      onSignOut={async () => {
        await api.logout().catch(() => {})
        signedOut()
      }}
    />
  )
}

function SignIn({ offline, onSignedIn }) {
  const [error, setError] = useState(offline ? "Can't reach the server. Is the API running?" : '')
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setBusy(true)
    setError('')
    try {
      onSignedIn(await api.login(String(form.get('email')), String(form.get('password'))))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3">
          <LogoMark className="h-9 w-auto" />
          <div>
            <p className="text-lg font-light tracking-tight text-ink">She Tech</p>
            <p className="text-[13px] text-ink-3">Bookings admin</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-8 grid gap-5 rounded-sm border border-line bg-surface p-6 shadow-[0_1px_2px_rgb(10_37_64/0.04)]">
          <Field label="Email" htmlFor="admin-email">
            <Input id="admin-email" name="email" type="email" autoComplete="username" required autoFocus />
          </Field>
          <Field label="Password" htmlFor="admin-password">
            <Input id="admin-password" name="password" type="password" autoComplete="current-password" required />
          </Field>
          {error && (
            <p role="alert" className="flex gap-2 text-sm text-danger">
              <AlertCircle className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
              {error}
            </p>
          )}
          <Button type="submit" size="lg" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" strokeWidth={2} /> : <LockKeyhole className="size-4" strokeWidth={1.75} />}
            Sign in
          </Button>
        </form>
      </div>
    </div>
  )
}
