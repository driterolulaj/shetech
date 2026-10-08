import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import palette from 'palette-editor/vite'
import schema from './src/palette.schema.js'

export default defineConfig({
  plugins: [
    react(),
    palette({
      schema,
      // These are the defaults; change them to suit your project:
      // palette: 'src/config/palette.json',
      // defaults: 'src/config/palette.defaults.json',
      // templates: 'src/config/palettes',
      // randomizer: 'src/config/palette.randomizer.json',   // or false
      // randomizerSkip: /admin\.html$/,                      // pages that always use the saved palette
    }),
  ],
})
