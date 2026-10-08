// Builds dist/: plain ESM with JSX compiled, one file per entry plus shared chunks
// (so the editor and the randomizer share one randomizer instance).
import fs from 'node:fs'
import { build } from 'esbuild'

fs.rmSync('dist', { recursive: true, force: true })

await build({
  entryPoints: { index: 'src/index.js', react: 'src/react.js', vite: 'src/vite.js', randomizer: 'src/randomizer.js' },
  outdir: 'dist',
  bundle: true,
  splitting: true,
  format: 'esm',
  platform: 'neutral',
  target: 'es2020',
  jsx: 'automatic',
  external: ['react', 'react/*', 'react-dom', 'node:*'],
  chunkNames: 'chunks/[name]-[hash]',
  logLevel: 'info',
})
