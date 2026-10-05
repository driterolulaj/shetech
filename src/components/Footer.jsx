import { Button } from './ui/Button'
import { Container, Eyebrow } from './ui/Container'
import { Logo } from './Navbar'
import { Reveal } from './ui/Reveal'

// TODO: replace with the real booking link (Calendly / Cal.com) and inbox.
const BOOKING_URL = '#'
const EMAIL = 'hello@shetech.example'

export function Footer() {
  return (
    <footer id="contact" className="bg-white">
      <Container className="grid gap-10 py-24 sm:py-32 lg:grid-cols-12">
        <Reveal className="lg:col-span-8">
          <Eyebrow>Contact</Eyebrow>
          <h2 className="mt-3 text-[clamp(2.25rem,4.5vw,3.5rem)] font-light leading-[1.05] tracking-tighter text-ink">
            Let's find the hours hiding in your week.
          </h2>
          <p className="mt-5 max-w-xl text-lg font-light text-ink-2">
            A 30-minute call with no obligation. You'll leave with at least one idea you can use.
          </p>
        </Reveal>
        <Reveal delay={150} className="flex flex-wrap items-end gap-3 lg:col-span-4 lg:justify-end">
          <Button as="a" href={BOOKING_URL} size="lg" arrow>
            Book a call
          </Button>
          <Button as="a" href={`mailto:${EMAIL}`} size="lg" variant="outline">
            Email us
          </Button>
        </Reveal>
      </Container>
      <div className="border-t border-slate-100">
        <Container className="flex flex-wrap items-center justify-between gap-4 py-8 text-sm text-ink-3">
          <Logo />
          <p>© {new Date().getFullYear()} She Tech. AI, automation & custom software.</p>
        </Container>
      </div>
    </footer>
  )
}
