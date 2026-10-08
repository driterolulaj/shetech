import { useRef } from 'react'
import { ArrowUpRight, Check, Sparkles, UserCheck } from 'lucide-react'
import { SERVICES } from '../content/services'
import { cn } from '../lib/cn'
import { useContact } from './contact/ContactProvider'
import { GradientMesh } from './GradientMesh'
import { ProjectVisual } from './ProjectVisual'
import { Button } from './ui/Button'
import { PlaceholderBadge } from './ui/Container'
import { Dialog, DialogClose } from './ui/Dialog'

function SectionLabel({ children }) {
  return <h3 className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3">{children}</h3>
}

/** Two-column list on hairlines; renders nothing when empty. */
function CheckList({ label, items }) {
  if (!items?.length) return null
  return (
    <section>
      <SectionLabel>{label}</SectionLabel>
      <ul className="mt-4 grid gap-x-10 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item} className="flex gap-3 border-t border-line py-3.5 text-[15px] leading-6 text-ink-2">
            <Check className="mt-1 size-4 shrink-0 text-accent" strokeWidth={2} />
            {item}
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Case-study overlay. `project` null = closed; the last one stays rendered through the exit animation. */
export function ProjectModal({ project, onClose }) {
  const { openContact } = useContact()
  const lastProject = useRef(project)
  if (project) lastProject.current = project
  const shown = project ?? lastProject.current

  const startSimilar = () => {
    onClose()
    const service = SERVICES.find((s) => shown.services?.includes(s.id))
    openContact('message', {
      project: shown.title,
      interest: service?.label,
      message: `We'd like to explore something similar to ${shown.title} (${shown.headline.toLowerCase()}). `,
    })
  }

  return (
    <Dialog open={Boolean(project)} onClose={onClose} labelledBy="project-modal-title">
      {shown && (
        <>
          <header className="flex items-start justify-between gap-6 border-b border-line px-6 py-5 sm:px-10">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs tabular-nums text-ink-3">{shown.number}</span>
                {shown.draft && <PlaceholderBadge>Draft</PlaceholderBadge>}
              </div>
              <h2 id="project-modal-title" className="mt-2 text-2xl font-light tracking-tighter text-ink sm:text-3xl">
                {shown.title}
                <span className="text-ink-3">: {shown.headline}</span>
              </h2>
            </div>
            <DialogClose onClick={onClose} />
          </header>

          <div key={shown.id} className="overflow-y-auto overscroll-contain">
            <div className="relative isolate grid h-56 place-items-center overflow-hidden border-b border-line px-6 sm:h-64">
              <GradientMesh skew={false} veil={false} zoom={0.45} />
              <ProjectVisual type={shown.visual} surface className="w-full max-w-sm" />
            </div>

            <div className="space-y-12 px-6 py-10 sm:px-10">
              <div>
                <p className="max-w-2xl text-lg font-light text-ink-2">{shown.summary}</p>
                {shown.url && (
                  <a
                    href={shown.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-colors duration-500 ease-soft hover:text-ink"
                  >
                    {new URL(shown.url).hostname.replace(/^www\./, '')}
                    <ArrowUpRight className="size-3.5" strokeWidth={2} />
                  </a>
                )}
              </div>

              <div className="grid gap-10 sm:grid-cols-2">
                <section>
                  <SectionLabel>The challenge</SectionLabel>
                  <p className="mt-3 text-[15px] leading-7 text-ink-2">{shown.challenge}</p>
                </section>
                <section>
                  <SectionLabel>The solution</SectionLabel>
                  <p className="mt-3 text-[15px] leading-7 text-ink-2">{shown.solution}</p>
                </section>
              </div>

              {shown.steps.length > 0 && (
                <section>
                  <SectionLabel>How it works</SectionLabel>
                  <ol className="mt-4 divide-y divide-line border-y border-line">
                    {shown.steps.map((step, i) => (
                      <li key={step.title} className={cn('flex gap-5 px-3 py-4', step.human && 'bg-accent-wash/60')}>
                        <span className="w-6 pt-0.5 font-mono text-xs tabular-nums text-ink-3">{String(i + 1).padStart(2, '0')}</span>
                        <div className="flex-1">
                          <p className="text-[15px] font-medium text-ink">{step.title}</p>
                          <p className="text-sm text-ink-2">{step.body}</p>
                        </div>
                        {step.human && (
                          <span className="inline-flex h-fit items-center gap-1 whitespace-nowrap text-xs font-medium text-accent">
                            <UserCheck className="size-3.5" strokeWidth={2} />
                            Human in the loop
                          </span>
                        )}
                        {step.ai && (
                          <span className="inline-flex h-fit items-center gap-1 whitespace-nowrap text-xs font-medium text-accent">
                            <Sparkles className="size-3.5" strokeWidth={2} />
                            AI
                          </span>
                        )}
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              <CheckList label="Highlights" items={shown.highlights} />
              <CheckList label="What changed" items={shown.outcomes} />

              {shown.results.length > 0 && (
                <section>
                  <SectionLabel>Results</SectionLabel>
                  <dl className="mt-4 grid gap-x-10 sm:grid-cols-3">
                    {shown.results.map((r) => (
                      <div key={r.label} className="flex flex-col-reverse border-t border-line py-5">
                        <dt className="mt-1 flex items-center gap-2 text-sm text-ink-2">
                          {r.label}
                          {r.placeholder && <PlaceholderBadge>TBC</PlaceholderBadge>}
                        </dt>
                        <dd className="text-3xl font-light tabular-nums tracking-tighter text-accent">{r.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}

              {shown.nextPhase.length > 0 && (
                <section className="relative border-t border-line pt-8">
                  <span aria-hidden="true" className="absolute -top-px left-0 h-px w-12 bg-accent" />
                  <div className="flex flex-wrap items-center gap-3">
                    <SectionLabel>Next phase: where AI fits</SectionLabel>
                    <span className="inline-flex items-center rounded-sm bg-accent-wash px-1.5 py-0.5 text-[11px] font-medium text-accent">
                      Proposed
                    </span>
                  </div>
                  <p className="mt-3 max-w-2xl text-[15px] leading-7 text-ink-2">
                    Ideas we've proposed for the next phase, not delivered work. They show where AI could take the most effort off the team.
                  </p>
                  <ul className="mt-5 grid gap-x-10 sm:grid-cols-3">
                    {shown.nextPhase.map(({ title, body }) => (
                      <li key={title} className="border-t border-line py-5">
                        <p className="flex items-center gap-2 text-[15px] font-medium text-ink">
                          <Sparkles className="size-4 shrink-0 text-accent" strokeWidth={1.75} />
                          {title}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-ink-2">{body}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {shown.quote && (
                <figure className="border-l-2 border-accent pl-6">
                  <blockquote className="text-xl font-light tracking-tight text-ink">“{shown.quote.text}”</blockquote>
                  <figcaption className="mt-3 text-sm text-ink-3">{shown.quote.author}</figcaption>
                </figure>
              )}

              <div className="flex flex-wrap items-center justify-between gap-6 border-t border-line pt-8">
                <p className="text-[13px] text-ink-3">{shown.tags.join('  ·  ')}</p>
                <div className="flex flex-wrap gap-3">
                  {shown.url && (
                    <Button as="a" href={shown.url} target="_blank" rel="noreferrer" variant="outline">
                      Visit the live site
                      <ArrowUpRight className="size-3.5" strokeWidth={2} />
                    </Button>
                  )}
                  <Button arrow onClick={startSimilar}>
                    Start a similar project
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </Dialog>
  )
}
