import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './lib/paletteRandomizer'
import '@fontsource-variable/inter'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
