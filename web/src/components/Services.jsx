import { Check, UserCheck } from 'lucide-react'
import { SERVICES } from '../content/services'
import { useContact } from './contact/ContactProvider'
import { SectionHeader } from './SectionHeader'
import { HoverArrow } from './ui/Button'
import { Container } from './ui/Container'
import { Reveal } from './ui/Reveal'

/** #services, with one anchor per pillar (#services-ai, …) for the navbar and hero strip. Open columns, no boxes. */
export function Services() {
  const { openContact } = useContact()

  return (
    <section id="services" className="py-24 sm:py-32">
      <Container>
        <SectionHeader
          eyebrow="Services"
          title="AI first, wherever it earns its place."
          lead="You're not buying “AI”. You're buying hours back, fewer mistakes and revenue that doesn't slip away. AI is usually how we get there. Here's what that looks like in practice."
        />

        <Reveal delay={120} className="mt-16 grid gap-14 md:grid-cols-3 md:gap-10">
          {SERVICES.map(({ id, icon: Icon, label, focus, summary, forWhen, problems, note }) => (
            <article key={id} id={`services-${id}`} className="relative flex flex-col border-t border-line pt-8">
              <span aria-hidden="true" className="absolute -top-px left-0 h-px w-12 bg-accent" />
              <h3 className="flex flex-wrap items-center gap-2.5 text-2xl font-light tracking-tight text-ink">
                <Icon className="size-5 text-accent" strokeWidth={1.5} />
                {label}
                {focus && (
                  <span className="rounded-sm bg-accent-wash px-1.5 py-0.5 text-[11px] font-medium tracking-normal text-accent">Our focus</span>
                )}
              </h3>
              <p className="mt-2 text-[15px] text-ink-2">{summary}</p>

              <p className="mt-7 text-[15px] leading-6 text-ink">
                <span className="text-ink-3">For when </span>
                {forWhen.charAt(0).toLowerCase() + forWhen.slice(1)}
              </p>

              <ul className="mt-5 space-y-2.5">
                {problems.map((problem) => (
                  <li key={problem} className="flex gap-2.5 text-sm leading-6 text-ink-2">
                    <Check className="mt-1 size-3.5 shrink-0 text-accent" strokeWidth={2.25} />
                    {problem}
                  </li>
                ))}
              </ul>

              {note && (
                <p className="mt-5 flex gap-2.5 text-sm leading-6 text-ink-2">
                  <UserCheck className="mt-1 size-3.5 shrink-0 text-accent" strokeWidth={2.25} />
                  {note}
                </p>
              )}

              <button
                type="button"
                onClick={() => openContact('message', { interest: label })}
                className="group mt-auto inline-flex items-center gap-1.5 self-start pt-8 text-sm font-medium text-accent transition-colors duration-500 ease-soft hover:text-ink"
              >
                Talk to us about {label.toLowerCase()} <HoverArrow />
              </button>
            </article>
          ))}
        </Reveal>
      </Container>
    </section>
  )
}
