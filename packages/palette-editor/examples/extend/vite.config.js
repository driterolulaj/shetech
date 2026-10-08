import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import palette from 'palette-editor/vite'
import schema from './src/palette.schema.js'

// With no schema at all — palette() — you get the built-in palette as is.
export default defineConfig({
  plugins: [react(), palette({ schema })],
})
