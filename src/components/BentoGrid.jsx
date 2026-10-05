import { useState } from 'react'
import { ArrowUpRight, Plus } from 'lucide-react'
import { PROJECTS } from '../data/projects'
import { cn } from '../lib/cn'
import { ProjectModal } from './ProjectModal'
import { ProjectVisual } from './ProjectVisual'
import { HoverArrow } from './ui/Button'
import { Container, Eyebrow, PlaceholderBadge, Tag } from './ui/Container'
import { Reveal } from './ui/Reveal'

const cellBase =
  'group relative flex h-full w-full flex-col p-6 text-left transition-colors duration-700 ease-soft sm:p-8 ' +
  'hover:bg-accent-wash/70 focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent'

function BentoCell({ project, onOpen }) {
  const { index, title, headline, summary, tags, visual, featured, draft } = project
  return (
    <button type="button" aria-haspopup="dialog" onClick={() => onOpen(project)} className={cellBase}>
      <div className="flex items-center justify-between gap-4">
        <span className="font-mono text-xs tabular-nums text-ink-3">{index}</span>
        <div className="flex items-center gap-2">
          {draft && <PlaceholderBadge />}
          <ArrowUpRight
            aria-hidden="true"
            strokeWidth={1.75}
            className="size-4 text-ink-3 transition-[color,transform] duration-700 ease-soft group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
          />
        </div>
      </div>

      <h3 className={cn('mt-6 font-light text-ink', featured ? 'text-3xl tracking-tighter sm:text-4xl' : 'text-xl tracking-tight')}>
        {title}
        <span className="text-ink-3">: {headline}</span>
      </h3>
      {featured && <p className="mt-3 max-w-md text-[15px] text-ink-2">{summary}</p>}

      <ProjectVisual type={visual} featured={featured} className={cn('mt-auto pt-8', featured && 'pt-12')} />

      <div className="mt-6 flex flex-wrap gap-1.5">
        {tags.slice(0, featured ? 4 : 2).map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}
      </div>
    </button>
  )
}

/**
 * Hairline bento: cells sit on a 1px-gap slate grid, so every rule is exactly
 * one pixel with no doubled borders. Clicking a cell opens <ProjectModal />
 * on the same page; the grid itself never reflows.
 */
export function BentoGrid() {
  const [selected, setSelected] = useState(null)

  return (
    <section id="work" className="border-y border-slate-100 bg-canvas py-24 sm:py-32">
      <Container>
        <Reveal className="max-w-2xl">
          <Eyebrow>Selected work</Eyebrow>
          <h2 className="mt-3 text-[clamp(2.25rem,4.5vw,3.5rem)] font-light leading-[1.05] tracking-tighter text-ink">
            Outcomes, engineered.
          </h2>
          <p className="mt-5 text-lg font-light text-ink-2">
            Every project starts with a process that was slow, painful or error-prone, and ends with a number that moved.
          </p>
        </Reveal>

        <Reveal as="ul" delay={120} className="mt-14 grid auto-rows-[minmax(15rem,auto)] grid-cols-1 gap-px overflow-hidden rounded-sm border border-slate-100 bg-slate-100 md:grid-cols-6">
          {PROJECTS.map((project) => (
            <li key={project.id} className={cn('bg-white', project.span)}>
              <BentoCell project={project} onOpen={setSelected} />
            </li>
          ))}
          <li className="bg-white md:col-span-3">
            <a href="#contact" className={cn(cellBase, 'justify-between')}>
              <span className="grid size-10 place-items-center rounded-sm border border-dashed border-accent/40 text-accent transition-colors duration-700 ease-soft group-hover:border-accent">
                <Plus className="size-4" strokeWidth={1.75} />
              </span>
              <div>
                <h3 className="text-xl font-light tracking-tight text-ink">Your process could be next.</h3>
                <p className="mt-2 max-w-sm text-[15px] text-ink-2">Tell us where the hours go. We'll tell you honestly whether AI or automation can help.</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
                  Book a call <HoverArrow />
                </span>
              </div>
            </a>
          </li>
        </Reveal>
      </Container>

      <ProjectModal project={selected} onClose={() => setSelected(null)} />
    </section>
  )
}
