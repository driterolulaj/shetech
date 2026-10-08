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

// Colour scheme editor: loaded only in development and on /admin/home (signed-in admins), never on the public site
const PaletteEditor = lazy(() => import('./components/dev/PaletteEditor'))

/** The home page. `editor` adds the colour editor (/admin/home); it's always there in development. */
export default function App({ editor = import.meta.env.DEV }) {
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
      {editor && (
        <Suspense fallback={null}>
          <PaletteEditor />
        </Suspense>
      )}
    </ContactProvider>
  )
}
