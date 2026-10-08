import { cn } from '../lib/cn'
import { Eyebrow } from './ui/Container'
import { Reveal } from './ui/Reveal'

/** Eyebrow + light, tightly tracked headline + optional lead, shared by every section. */
export function SectionHeader({ eyebrow, title, lead, className, children }) {
  return (
    <Reveal className={cn('max-w-2xl', className)}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-3 text-[clamp(2.25rem,4.5vw,3.5rem)] font-light leading-[1.05] tracking-tighter text-ink">{title}</h2>
      {lead && <p className="mt-5 text-lg font-light text-ink-2">{lead}</p>}
      {children}
    </Reveal>
  )
}
