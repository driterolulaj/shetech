import { useMemo, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { WORK } from '../config/site'
import { CASE_STUDIES, PROJECTS } from '../content/projects'
import { SERVICES } from '../content/services'
import { useProjectRoute } from '../hooks/useProjectRoute'
import { cn } from '../lib/cn'
import { CONTACT_LINKS } from './contact/ContactProvider'
import { ProjectModal } from './ProjectModal'
import { ProjectVisual } from './ProjectVisual'
import { SectionHeader } from './SectionHeader'
import { Button, HoverArrow } from './ui/Button'
import { Container, PlaceholderBadge } from './ui/Container'
import { Reveal } from './ui/Reveal'

/** Shared row grid: number · story · visual. No boxes, just hairlines between rows.
 *  Rows stay short (title, one-line result, up to 3 tags); the full story is in the modal. */
const row = 'grid gap-6 py-10 md:grid-cols-12 md:gap-8 md:py-14'

function RowText({ project, children }) {
  return (
    <div className="md:col-span-6">
      <h3 className="text-3xl font-light tracking-tighter text-ink transition-colors duration-500 ease-soft group-hover:text-accent sm:text-4xl">
        {project.title}
      </h3>
      <p className="mt-1.5 text-xl font-light tracking-tight text-ink-3">{project.headline}</p>
      <p className="mt-5 text-[13px] text-ink-3">{project.tags.slice(0, 3).join('  ·  ')}</p>
      {project.nextPhase.length > 0 && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-ink-2">
          <Sparkles className="size-3.5 text-accent" strokeWidth={1.75} />
          AI next phase proposed
        </p>
      )}
      {children}
    </div>
  )
}

function ProjectRow({ project, onOpen }) {
  return (
    <a
      href={`#work/${project.id}`}
      aria-haspopup="dialog"
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return // allow open-in-new-tab
        e.preventDefault()
        onOpen(project)
      }}
      className={cn(row, 'group focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent')}
    >
      <div className="flex items-center gap-3 md:col-span-1 md:block md:pt-3">
        <span className="font-mono text-xs tabular-nums text-ink-3">{project.number}</span>
        {project.draft && <PlaceholderBadge className="md:mt-2">Draft</PlaceholderBadge>}
      </div>
      <RowText project={project}>
        <span className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
          Read the case study <HoverArrow />
        </span>
      </RowText>
      <div className="flex items-center md:col-span-5 md:justify-end">
        <ProjectVisual
          type={project.visual}
          className="w-full max-w-sm transition-transform duration-700 ease-soft group-hover:-translate-y-1"
        />
      </div>
    </a>
  )
}

/** Announced work without a case study yet: not clickable. */
function ComingSoonRow({ project }) {
  return (
    <div className={row}>
      <span className="font-mono text-xs tabular-nums text-ink-3 md:col-span-1 md:pt-3">{project.number}</span>
      <RowText project={project}>
        <span className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-accent">
          <span className="size-1.5 animate-pulse rounded-full bg-accent" />
          In progress
        </span>
      </RowText>
      <div className="flex items-center opacity-60 md:col-span-5 md:justify-end">
        <ProjectVisual type={project.visual} className="w-full max-w-sm" />
      </div>
    </div>
  )
}

function CtaRow() {
  return (
    <a href={CONTACT_LINKS.book} className="group grid items-center gap-4 py-10 md:grid-cols-12 md:gap-8">
      <span className="font-mono text-xs text-ink-3 md:col-span-1">+</span>
      <div className="md:col-span-7">
        <h3 className="text-2xl font-light tracking-tight text-ink transition-colors duration-500 ease-soft group-hover:text-accent">
          Your process could be next.
        </h3>
        <p className="mt-2 text-[15px] text-ink-2">Tell us where the hours go. We'll tell you honestly whether AI can take it off your plate.</p>
      </div>
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-accent md:col-span-4 md:justify-self-end">
        Book a call <HoverArrow />
      </span>
    </a>
  )
}

/**
 * #work: an editorial list, one row per project, separated by hairlines.
 * Adding a file to content/projects adds a row; filters and "show all"
 * appear on their own as the list grows.
 */
export function Work() {
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState(false)
  const route = useProjectRoute(CASE_STUDIES)

  const filtered = useMemo(
    () => (filter === 'all' ? PROJECTS : PROJECTS.filter((p) => p.services.includes(filter))),
    [filter],
  )
  const visible = expanded ? filtered : filtered.slice(0, WORK.initialVisible)
  const hiddenCount = filtered.length - visible.length

  const filters = useMemo(() => {
    if (PROJECTS.length < WORK.filterThreshold) return []
    const options = SERVICES.map((s) => ({ ...s, count: PROJECTS.filter((p) => p.services.includes(s.id)).length }))
    return [{ id: 'all', label: 'All', count: PROJECTS.length }, ...options.filter((o) => o.count > 0)]
  }, [])

  return (
    <section id="work" className="py-24 sm:py-32">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-8">
          <SectionHeader
            eyebrow="Case studies"
            title="Outcomes, engineered."
            lead="Every project starts with a process that was slow, painful or error-prone. AI and automation are the means; time saved and errors avoided are the result."
          />

          {filters.length > 2 && (
            <Reveal delay={100} role="toolbar" aria-label="Filter projects by service" className="flex flex-wrap gap-x-5 gap-y-2">
              {filters.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={filter === f.id}
                  onClick={() => {
                    setFilter(f.id)
                    setExpanded(false)
                  }}
                  className={cn(
                    'inline-flex items-baseline gap-1.5 border-b py-1 text-sm font-medium transition-colors duration-500 ease-soft',
                    filter === f.id ? 'border-accent text-ink' : 'border-transparent text-ink-3 hover:text-ink',
                  )}
                >
                  {f.label}
                  <span className="text-xs tabular-nums text-ink-3">{f.count}</span>
                </button>
              ))}
            </Reveal>
          )}
        </div>

        <Reveal as="ol" delay={120} className="mt-12 border-b border-line">
          {visible.map((project) => (
            <li key={project.id} className="border-t border-line">
              {project.comingSoon ? <ComingSoonRow project={project} /> : <ProjectRow project={project} onOpen={route.open} />}
            </li>
          ))}
          <li className="border-t border-line">
            <CtaRow />
          </li>
        </Reveal>

        {hiddenCount > 0 && (
          <div className="mt-8 flex justify-center">
            <Button variant="outline" onClick={() => setExpanded(true)}>
              Show all {filtered.length} projects
            </Button>
          </div>
        )}
      </Container>

      <ProjectModal project={route.active} onClose={route.close} />
    </section>
  )
}
