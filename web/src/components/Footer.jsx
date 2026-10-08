import { ArrowUpRight, CalendarDays, Clock, Mail } from 'lucide-react'
import { SITE } from '../config/site'
import { FOOTER_LINKS } from '../data/navigation'
import { CONTACT_LINKS } from './contact/ContactProvider'
import { ContactForm } from './contact/ContactForm'
import { Logo } from './brand/Logo'
import { Button } from './ui/Button'
import { Container, Eyebrow } from './ui/Container'
import { CopyButton } from './ui/CopyButton'
import { Reveal } from './ui/Reveal'

function Channel({ icon: Icon, term, children, action }) {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-3 py-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-sm border border-line bg-surface text-accent">
        <Icon className="size-4" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-ink-3">{term}</p>
        <p className="truncate text-[15px] font-medium text-ink">{children}</p>
      </div>
      {action}
    </li>
  )
}

/** Contact section (#contact) plus the site footer. */
export function Footer() {
  return (
    <footer id="contact">
      <Container className="grid gap-14 py-24 sm:py-32 lg:grid-cols-12 lg:gap-10">
        <Reveal className="lg:col-span-5">
          <Eyebrow>Contact</Eyebrow>
          <h2 className="mt-3 text-[clamp(2.25rem,4.5vw,3.5rem)] font-light leading-[1.05] tracking-tighter text-ink">
            Let's find the hours hiding in your week.
          </h2>
          <p className="mt-5 max-w-md text-lg font-light text-ink-2">
            A {SITE.booking.duration} call with no obligation. Tell us about the process; you'll leave knowing whether AI can take it off your plate.
          </p>

          <ul className="mt-10 divide-y divide-line border-y border-line">
            <Channel
              icon={CalendarDays}
              term="Book a call"
              action={
                <Button as="a" href={CONTACT_LINKS.book} size="sm" arrow>
                  Pick a time
                </Button>
              }
            >
              {SITE.booking.duration} · {SITE.booking.format}
            </Channel>
            {SITE.email && (
              <Channel icon={Mail} term="Email" action={<CopyButton value={SITE.email} label="Copy" />}>
                <a href={`mailto:${SITE.email}`} className="transition-colors duration-300 ease-soft hover:text-accent">
                  {SITE.email}
                </a>
              </Channel>
            )}
            <Channel icon={Clock} term="Response time">
              {SITE.responseTime}
            </Channel>
          </ul>
        </Reveal>

        <Reveal delay={150} className="lg:col-span-7">
          <div className="relative border-t border-line pt-8">
            <span aria-hidden="true" className="absolute -top-px left-0 h-px w-12 bg-accent" />
            <h3 className="text-2xl font-light tracking-tight text-ink">Send us a message</h3>
            <p className="mt-1 text-sm text-ink-2">A few lines is plenty. We'll take it from there.</p>
            <ContactForm kind="message" className="mt-8" />
          </div>
        </Reveal>
      </Container>

      <div className="border-t border-line">
        <Container className="flex flex-col gap-6 py-8 text-sm text-ink-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Logo />
            <span>{SITE.tagline}</span>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {FOOTER_LINKS.map(({ label, href }) => (
              <a key={label} href={href} className="transition-colors duration-300 ease-soft hover:text-accent">
                {label}
              </a>
            ))}
            {SITE.socials.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-0.5 transition-colors duration-300 ease-soft hover:text-accent"
              >
                {label}
                <ArrowUpRight className="size-3.5" strokeWidth={1.75} />
              </a>
            ))}
            <span>© {new Date().getFullYear()} {SITE.name}</span>
          </nav>
        </Container>
      </div>
    </footer>
  )
}
