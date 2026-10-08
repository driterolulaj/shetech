import { lazy, Suspense } from 'react'
import { About } from './components/About'
import { ContactProvider } from './components/contact/ContactProvider'
import { Footer } from './components/Footer'
import { Hero } from './components/Hero'
import { Navbar } from './components/Navbar'
import { Process } from './components/Process'
import { Services } from './components/Services'
import { Work } from './components/Work'
import { useSmoothAnchors } from './hooks/useSmoothAnchors'

// Colour scheme editor: development only, so it's dropped from the production build
const PaletteEditor = import.meta.env.DEV ? lazy(() => import('./components/dev/PaletteEditor')) : null

export default function App() {
  useSmoothAnchors({ offset: 72 })

  return (
    <ContactProvider>
      <Navbar />
      <main>
        <Hero />
        <Services />
        <Work />
        <Process />
        <About />
        <Footer />
      </main>
      {PaletteEditor && (
        <Suspense fallback={null}>
          <PaletteEditor />
        </Suspense>
      )}
    </ContactProvider>
  )
}
