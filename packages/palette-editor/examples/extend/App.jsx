import { lazy, Suspense } from 'react'
import schema from './palette.schema.js'

// The editor is for development only, so it's left out of the production build
const PaletteEditor = import.meta.env.DEV ? lazy(() => import('palette-editor/react')) : null

export default function App() {
  return (
    <>
      <main style={{ background: 'var(--surface)', color: 'var(--ink)', minHeight: '100vh', padding: 32 }}>
        <h1>Hello</h1>
        <p style={{ color: 'var(--ink-2)' }}>Body text in the built-in palette.</p>
        <button style={{ background: 'var(--accent)', color: 'white' }}>Accent</button>{' '}
        <mark style={{ background: 'var(--highlight)' }}>An added variable</mark>
        <div style={{ height: 120, marginTop: 24, background: 'linear-gradient(90deg, var(--mesh-0), var(--mesh-1), var(--mesh-2), var(--mesh-3))' }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <span style={{ width: 40, height: 40, background: 'var(--chart-1)' }} />
          <span style={{ width: 40, height: 40, background: 'var(--chart-2)' }} />
        </div>
      </main>

      {PaletteEditor && (
        <Suspense fallback={null}>
          <PaletteEditor schema={schema} />
        </Suspense>
      )}
    </>
  )
}
