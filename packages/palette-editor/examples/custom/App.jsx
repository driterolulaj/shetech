import { lazy, Suspense } from 'react'
import schema from './palette.schema.js'

// The editor is for development only, so it's left out of the production build
const PaletteEditor = import.meta.env.DEV ? lazy(() => import('palette-editor/react')) : null

export default function App() {
  return (
    <>
      <main style={{ background: 'var(--background)', color: 'var(--text)', minHeight: '100vh', padding: 32 }}>
        <h1>Hello</h1>
        <button style={{ background: 'var(--accent)', color: 'white' }}>A button in the accent colour</button>
        <div style={{ height: 120, marginTop: 24, background: 'linear-gradient(90deg, var(--gradient-0), var(--gradient-1), var(--gradient-2))' }} />
      </main>

      {PaletteEditor && (
        <Suspense fallback={null}>
          <PaletteEditor schema={schema} />
        </Suspense>
      )}
    </>
  )
}
