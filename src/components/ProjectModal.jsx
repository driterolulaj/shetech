import { useCallback, useEffect, useRef, useState } from 'react'
import { UserCheck, X } from 'lucide-react'
import { cn } from '../lib/cn'
import { GradientMesh } from './GradientMesh'
import { ProjectVisual } from './ProjectVisual'
import { Button } from './ui/Button'
import { PlaceholderBadge, Tag } from './ui/Container'

const EXIT_MS = 280 // keep in sync with `modal-out` in index.css

function SectionLabel({ children }) {
  return <h3 className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3">{children}</h3>
}

/**
 * Native <dialog> overlay: focus trap, Escape and top-layer stacking come
 * from the platform. We only add enter/exit motion and a scroll lock
 * (html has scrollbar-gutter: stable, so the page never shifts).
 */
export function ProjectModal({ project, onClose }) {
  const dialogRef = useRef(null)
  const exitTimer = useRef(0)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (project && dialog && !dialog.open) {
      setClosing(false)
      dialog.showModal()
      dialog.querySelector('[data-scroll]')?.scrollTo(0, 0)
    }
    document.documentElement.classList.toggle('overflow-hidden', Boolean(project))
  }, [project])

  useEffect(
    () => () => {
      window.clearTimeout(exitTimer.current)
      document.documentElement.classList.remove('overflow-hidden')
    },
    [],
  )

  const requestClose = useCallback(() => {
    if (closing) return
    setClosing(true)
    exitTimer.current = window.setTimeout(() => {
      dialogRef.current?.close()
      setClosing(false)
      onClose()
    }, EXIT_MS)
  }, [closing, onClose])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="project-modal-title"
      data-closing={closing}
      onCancel={(e) => {
        e.preventDefault() // run the exit animation instead of closing instantly
        requestClose()
      }}
      onClick={(e) => e.target === e.currentTarget && requestClose()}
      className="project-modal m-auto max-h-[min(calc(100dvh-2rem),56rem)] w-[min(calc(100%-2rem),60rem)] max-w-none overflow-hidden rounded-sm border border-slate-100 bg-white p-0 text-ink"
    >
      {project && (
        <div className="flex max-h-[inherit] flex-col">
          <header className="flex items-start justify-between gap-6 border-b border-slate-100 px-6 py-5 sm:px-10">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs tabular-nums text-ink-3">{project.index}</span>
                {project.draft && <PlaceholderBadge />}
              </div>
              <h2 id="project-modal-title" className="mt-2 text-2xl font-light tracking-tighter text-ink sm:text-3xl">
                {project.title}
                <span className="text-ink-3">: {project.headline}</span>
              </h2>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={requestClose}
              className="grid size-8 shrink-0 place-items-center rounded-sm border border-slate-100 text-ink-2 transition-colors duration-500 ease-soft hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
            >
              <X className="size-4" strokeWidth={1.75} />
            </button>
          </header>

          <div data-scroll className="overflow-y-auto overscroll-contain">
            {/* Banner */}
            <div className="relative isolate grid h-56 place-items-center overflow-hidden border-b border-slate-100 px-6 sm:h-64">
              <GradientMesh skew={false} veil={false} zoom={0.45} />
              <ProjectVisual type={project.visual} featured className="w-full max-w-sm" />
            </div>

            <div className="space-y-12 px-6 py-10 sm:px-10">
              <p className="max-w-2xl text-lg font-light text-ink-2">{project.summary}</p>

              <div className="grid gap-10 sm:grid-cols-2">
                <section>
                  <SectionLabel>The challenge</SectionLabel>
                  <p className="mt-3 text-[15px] leading-7 text-ink-2">{project.challenge}</p>
                </section>
                <section>
                  <SectionLabel>The solution</SectionLabel>
                  <p className="mt-3 text-[15px] leading-7 text-ink-2">{project.solution}</p>
                </section>
              </div>

              <section>
                <SectionLabel>How it works</SectionLabel>
                <ol className="mt-4 divide-y divide-slate-100 border-y border-slate-100">
                  {project.steps.map((step, i) => (
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
                    </li>
                  ))}
                </ol>
              </section>

              <section>
                <SectionLabel>Results</SectionLabel>
                <dl className="mt-4 grid gap-px overflow-hidden rounded-sm border border-slate-100 bg-slate-100 sm:grid-cols-3">
                  {project.results.map((r) => (
                    <div key={r.label} className="bg-white p-5">
                      <dd className="text-3xl font-light tabular-nums tracking-tighter text-accent">{r.value}</dd>
                      <dt className="mt-1 flex items-center gap-2 text-sm text-ink-2">
                        {r.label}
                        {r.placeholder && <PlaceholderBadge>TBC</PlaceholderBadge>}
                      </dt>
                    </div>
                  ))}
                </dl>
              </section>

              {project.quote && (
                <figure className="border-l-2 border-accent pl-6">
                  <blockquote className="text-xl font-light tracking-tight text-ink">“{project.quote.text}”</blockquote>
                  <figcaption className="mt-3 text-sm text-ink-3">{project.quote.author}</figcaption>
                </figure>
              )}

              <div className="flex flex-wrap items-center justify-between gap-6 border-t border-slate-100 pt-8">
                <div className="flex flex-wrap gap-1.5">
                  {project.tags.map((tag) => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </div>
                <Button as="a" href="#contact" arrow onClick={requestClose}>
                  Start a similar project
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </dialog>
  )
}
