import { ABOUT } from '../content/about'
import { SectionHeader } from './SectionHeader'
import { Container } from './ui/Container'
import { Reveal } from './ui/Reveal'

const initials = (name) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

/** #about: mission + values. Story and team render only once content/about.js has them. */
export function About() {
  const { headline, intro, story, team, values } = ABOUT

  return (
    <section id="about" className="py-24 sm:py-32">
      <Container className="grid gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <SectionHeader eyebrow="About" title={headline} lead={intro} />
          {story.length > 0 && (
            <Reveal delay={100} className="mt-6 space-y-4 text-[15px] leading-7 text-ink-2">
              {story.map((paragraph) => (
                <p key={paragraph.slice(0, 32)}>{paragraph}</p>
              ))}
            </Reveal>
          )}
        </div>

        <Reveal delay={150} className="lg:col-span-7">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3">What we believe</p>
          <ol className="mt-4 divide-y divide-line border-y border-line">
            {values.map(({ title, body }, i) => (
              <li key={title} className="grid gap-2 py-6 sm:grid-cols-[3rem_1fr]">
                <span className="font-mono text-xs tabular-nums text-ink-3 sm:pt-2">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className="text-2xl font-light tracking-tight text-ink">{title}</h3>
                  <p className="mt-2 max-w-lg text-[15px] leading-6 text-ink-2">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>

        {team.length > 0 && (
          <Reveal delay={100} className="lg:col-span-12">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3">The team</p>
            <ul className="mt-6 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {team.map(({ name, role, bio, photo }) => (
                <li key={name} className="border-t border-line pt-6">
                  {photo ? (
                    <img src={photo} alt="" className="size-14 rounded-sm object-cover" loading="lazy" />
                  ) : (
                    <span aria-hidden="true" className="grid size-14 place-items-center rounded-sm bg-accent-wash text-lg font-light text-accent">
                      {initials(name)}
                    </span>
                  )}
                  <p className="mt-4 text-[15px] font-medium text-ink">{name}</p>
                  <p className="text-sm text-ink-3">{role}</p>
                  {bio && <p className="mt-3 text-sm leading-6 text-ink-2">{bio}</p>}
                </li>
              ))}
            </ul>
          </Reveal>
        )}
      </Container>
    </section>
  )
}
