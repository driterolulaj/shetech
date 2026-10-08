import { PROCESS } from '../content/process'
import { CONTACT_LINKS } from './contact/ContactProvider'
import { RibbonWave } from './RibbonWave'
import { SectionHeader } from './SectionHeader'
import { Button } from './ui/Button'
import { Container } from './ui/Container'
import { Reveal } from './ui/Reveal'

/** #how-we-work: a silk-ribbon backdrop, then a single timeline rule that draws across four open columns. */
export function Process() {
  return (
    <section id="how-we-work" className="relative py-24 sm:py-32">
      {/*
        Silk ribbon through the upper right. It starts 30rem above this section, behind the
        end of the case studies (no isolate/overflow here, so it sits under their content too),
        and fades in from nothing there, out before the timeline, and away from the headline.
      */}
      <RibbonWave
        anchor={[0.84, 0.5]}
        angle={-1.12}
        width={0.115}
        className="-top-[30rem] hidden [mask-composite:intersect] [mask-image:linear-gradient(to_bottom,transparent,black_30%,black_52%,transparent_71%),linear-gradient(to_right,transparent_50%,black_66%)] lg:block"
      />
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-8">
          <SectionHeader
            eyebrow="How we work"
            title="No black boxes. No surprises."
            lead="You don't need to be technical to work with us. Here's exactly what happens from the first call to long after launch."
          />
          <Reveal delay={100}>
            <Button as="a" href={CONTACT_LINKS.book} variant="outline" arrow>
              Start with discovery
            </Button>
          </Reveal>
        </div>

        <Reveal as="ol" delay={120} className="relative mt-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          {/* Timeline: one rule across all steps, drawn left → right on reveal */}
          <span aria-hidden="true" className="absolute inset-x-0 top-0 hidden h-px bg-line lg:block">
            <span className="progress-fill block h-full bg-accent" style={{ '--delay': '300ms' }} />
          </span>

          {PROCESS.map(({ title, body, deliverable }, i) => (
            <li key={title} className="relative flex flex-col border-t border-line pt-8 lg:border-t-0">
              <span aria-hidden="true" className="absolute -top-[3px] left-0 size-[7px] rounded-full bg-accent ring-4 ring-surface" />
              <span className="font-mono text-xs tabular-nums text-ink-3">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-3 text-2xl font-light tracking-tight text-ink">{title}</h3>
              <p className="mt-3 text-[15px] leading-6 text-ink-2">{body}</p>
              <p className="mt-auto pt-6 text-sm leading-6 text-ink">
                <span className="text-ink-3">You get </span>
                {deliverable.charAt(0).toLowerCase() + deliverable.slice(1)}
              </p>
            </li>
          ))}
        </Reveal>
      </Container>
    </section>
  )
}
