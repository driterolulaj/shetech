import { Braces, FileText, Send, Sparkles, UserCheck, Workflow } from 'lucide-react'
import { cn } from '../lib/cn'
import { GradientMesh } from './GradientMesh'
import { Button } from './ui/Button'
import { Container, Eyebrow } from './ui/Container'
import { Glass } from './ui/Glass'

const PILLARS = [
  { icon: Sparkles, title: 'AI solutions', body: 'Stop reading documents by hand.' },
  { icon: Workflow, title: 'Automation', body: 'No more re-typing data between tools.' },
  { icon: Braces, title: 'Custom software', body: 'Tools built around how you work.' },
]

const LEDGER_ROWS = [
  ['Parties', 'Acme Logistics ↔ Client Co.'],
  ['Term', '01 Jan 2026 – 31 Dec 2027'],
  ['Pricing', '€4,200.00 / month'],
  ['Billing', 'Monthly · Net 30'],
]

/** Dashed column guides behind the hero, like the rules of a ledger. */
function GridGuides() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      <Container className="grid h-full grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={cn('border-l border-dashed border-ink/[0.07] last:border-r', i > 1 && 'hidden lg:block')} />
        ))}
      </Container>
    </div>
  )
}

function LedgerCard() {
  return (
    <div className="relative">
      <Glass className="rise rounded-sm [--glass-a:0.78] [--glass-b:0.62]" style={delay(360)}>
        <div className="flex items-center justify-between gap-4 border-b border-white/70 px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-2.5 text-sm font-medium text-ink">
            <FileText className="size-4 shrink-0 text-accent" strokeWidth={1.75} />
            <span className="truncate">MSA_Acme_2026.pdf</span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-sm bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Extracted
          </span>
        </div>
        <dl className="divide-y divide-ink/[0.06] px-5">
          {LEDGER_ROWS.map(([term, value]) => (
            <div key={term} className="flex justify-between gap-6 py-3 text-sm">
              <dt className="text-ink-3">{term}</dt>
              <dd className="text-right font-medium tabular-nums text-ink">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="border-t border-white/70 bg-white/35 px-5 py-4">
          <div className="flex justify-between text-xs text-ink-2">
            <span>Invoice schedule</span>
            <span className="tabular-nums">3 of 24 sent</span>
          </div>
          <div className="mt-2 flex gap-[3px]">
            {Array.from({ length: 24 }, (_, i) => (
              <span
                key={i}
                className={cn('rise h-5 flex-1 rounded-[1px]', i < 3 ? 'bg-accent' : 'bg-accent/15')}
                style={delay(700 + i * 35)}
              />
            ))}
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-2">
            <UserCheck className="size-3.5 text-accent" strokeWidth={2} />
            Reviewed by finance before going live
          </p>
        </div>
      </Glass>

      {/* Floating receipt */}
      <Glass
        className="rise absolute -left-6 top-full -mt-3 hidden items-center gap-3 rounded-sm px-4 py-3 [--glass-a:0.85] [--glass-b:0.7] sm:flex"
        style={delay(900)}
      >
        <span className="grid size-8 place-items-center rounded-sm bg-accent-wash text-accent">
          <Send className="size-4" strokeWidth={1.75} />
        </span>
        <div className="text-xs">
          <p className="font-medium text-ink">INV-0003 sent</p>
          <p className="tabular-nums text-ink-3">€4,200.00 · 1 Mar</p>
        </div>
      </Glass>
    </div>
  )
}

/** Entrance stagger for the .rise animation */
const delay = (ms) => ({ '--delay': `${ms}ms` })

export function Hero() {
  return (
    <section id="top" className="relative isolate overflow-hidden bg-white">
      <GradientMesh />
      <GridGuides />

      <Container className="grid grid-cols-12 gap-x-6 pb-20 pt-36 lg:pb-28 lg:pt-44">
        <div className="col-span-12 lg:col-span-7">
          <Eyebrow className="rise">AI · Automation · Custom software</Eyebrow>
          <h1
            className="rise mt-5 text-[clamp(4.25rem,13vw,10.5rem)] font-light leading-[0.86] tracking-[-0.055em] text-ink"
            style={delay(90)}
          >
            She Tech
          </h1>
          <p
            className="rise mt-8 max-w-xl text-xl/8 font-light tracking-tight text-ink-2 sm:text-2xl/9"
            style={delay(180)}
          >
            We build AI and automation that takes repetitive work off your team's plate. Hours back, fewer errors, and revenue that stops slipping through.
          </p>
          <div style={delay(270)} className="rise mt-10 flex flex-wrap gap-3">
            <Button as="a" href="#contact" size="lg" arrow>
              Book a call
            </Button>
            <Button as="a" href="#work" size="lg" variant="glass" arrow>
              See our work
            </Button>
          </div>
        </div>

        <div className="col-span-12 mt-16 lg:col-span-5 lg:mt-28">
          <LedgerCard />
          <p style={delay(1000)} className="rise mt-3 text-right text-[11px] text-ink-3">
            Illustrative data
          </p>
        </div>

        <Glass
          as="ul"
          className="rise col-span-12 mt-20 grid divide-y divide-ink/[0.06] rounded-sm [--glass-a:0.7] [--glass-b:0.5] sm:grid-cols-3 sm:divide-x sm:divide-y-0"
          style={delay(480)}
        >
          {PILLARS.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex items-start gap-3 p-5">
              <Icon className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={1.75} />
              <div>
                <p className="text-sm font-medium text-ink">{title}</p>
                <p className="text-sm text-ink-2">{body}</p>
              </div>
            </li>
          ))}
        </Glass>
      </Container>
    </section>
  )
}
