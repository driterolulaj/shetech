import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '../App'
import { api } from './api'
import '../lib/paletteRandomizer'
import '@fontsource-variable/inter'
import '../index.css'

/**
 * /admin/home: the home page exactly as visitors see it, plus the colour editor.
 * Signed-in admins only; anyone else is sent to the sign-in at /admin, which
 * brings them back here afterwards.
 */
const root = createRoot(document.getElementById('root'))

api
  .session()
  .then(({ authenticated }) => {
    if (!authenticated) return window.location.replace(`/admin?next=${encodeURIComponent('/admin/home')}`)
    root.render(
      <StrictMode>
        <App editor />
      </StrictMode>,
    )
  })
  .catch(() => window.location.replace('/admin'))
