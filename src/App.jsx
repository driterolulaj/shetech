import { BentoGrid } from './components/BentoGrid'
import { Footer } from './components/Footer'
import { Hero } from './components/Hero'
import { Navbar } from './components/Navbar'
import { useSmoothAnchors } from './hooks/useSmoothAnchors'

export default function App() {
  useSmoothAnchors({ offset: 72 })

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <BentoGrid />
      </main>
      <Footer />
    </>
  )
}
