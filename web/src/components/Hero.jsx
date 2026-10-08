import { Check, FileText, Send, UserCheck } from 'lucide-react'
import { SERVICES } from '../content/services'
import { cn } from '../lib/cn'
import { GradientMesh } from './GradientMesh'
import { Button } from './ui/Button'
import { Container, Eyebrow } from './ui/Container'
import { Glass } from './ui/Glass'

/** Terms the contract-to-invoice flow pulls out. The card shows the steps, not invented values. */
const EXTRACTED_FIELDS = [
  ['Parties', '72%'],
  ['Contract term', '58%'],
  ['Pricing', '44%'],
  ['Billing frequency', '50%'],
]

/** Entrance stagger for the .rise animation */
const delay = (ms) => ({ '--delay': `${ms}ms` })

/** Contract → extracted terms → invoice schedule, drawn as a product surface. */
function FlowCard() {
  return (
    <div aria-hidden="true" className="relative">
      <Glass className="rise rounded-sm [--glass-a:0.78] [--glass-b:0.62]" style={delay(360)}>
        <div className="flex items-center justify-between gap-4 border-b border-glass-edge px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-2.5 text-sm font-medium text-ink">
            <FileText className="size-4 shrink-0 text-accent" strokeWidth={1.75} />
            <span className="truncate">contract.pdf</span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-sm bg-success-wash px-2 py-0.5 text-xs font-medium text-success">
            <span className="size-1.5 rounded-full bg-success" />
            Extracted by AI
          </span>
        </div>

        <dl className="divide-y divide-ink/[0.06] px-5">
          {EXTRACTED_FIELDS.map(([term, width], i) => (
            <div key={term} className="flex items-center justify-between gap-6 py-3 text-sm">
              <dt className="text-ink-3">{term}</dt>
              <dd className="flex flex-1 items-center justify-end gap-2.5">
                <span className="skeleton h-2 rounded-full" style={{ width }} />
                <span className="rise grid size-4 place-items-center rounded-full bg-accent text-white" style={delay(900 + i * 160)}>
                  <Check className="size-2.5" strokeWidth={3} />
                </span>
              </dd>
            </div>
          ))}
        </dl>

        <div className="border-t border-glass-edge bg-glass-tint px-5 py-4">
          <div className="flex justify-between text-xs text-ink-2">
            <span>Invoice schedule</span>
            <span>Created automatically</span>
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
            Reviewed by your team before anything is sent
          </p>
        </div>
      </Glass>

      <Glass
        className="rise absolute -left-6 top-full -mt-3 hidden items-center gap-3 rounded-sm px-4 py-3 [--glass-a:0.85] [--glass-b:0.7] sm:flex"
        style={delay(900)}
      >
        <span className="grid size-8 place-items-center rounded-sm bg-accent-wash text-accent">
          <Send className="size-4" strokeWidth={1.75} />
        </span>
        <div className="text-xs">
          <p className="font-medium text-ink">Invoices go out on schedule</p>
          <p className="text-ink-3">For the life of the contract</p>
        </div>
      </Glass>
    </div>
  )
}

export function Hero() {
  return (
    <section id="top" className="relative isolate overflow-hidden bg-surface">
      <GradientMesh />

      <Container className="grid grid-cols-12 gap-x-6 pb-20 pt-36 lg:pb-28 lg:pt-44">
        <div className="col-span-12 lg:col-span-7">
          <Eyebrow className="rise">She Tech · AI solutions, automation &amp; custom software</Eyebrow>
          <h1
            className="rise mt-5 text-[clamp(2.75rem,6.2vw,4.75rem)] font-light leading-[0.98] tracking-[-0.045em] text-ink"
            style={delay(90)}
          >
            AI that takes repetitive work off your team's plate.
          </h1>
          <p
            className="rise mt-8 max-w-xl text-xl/8 font-light tracking-tight text-ink-2 sm:text-2xl/9"
            style={delay(180)}
          >
            For founders, ops and finance teams: we build AI that reads your documents, moves your data and runs the routine steps, while your people review what matters. Hours back, fewer errors, and revenue that stops slipping through.
          </p>
          <div style={delay(270)} className="rise mt-10 flex flex-wrap gap-3">
            <Button as="a" href="#book" size="lg" arrow>
              Book a call
            </Button>
            <Button as="a" href="#work" size="lg" variant="glass" arrow>
              See our work
            </Button>
          </div>
        </div>

        <div className="col-span-12 mt-16 lg:col-span-5 lg:mt-28">
          <FlowCard />
        </div>

        <ul className="rise col-span-12 mt-24 grid gap-6 border-t border-line pt-6 sm:grid-cols-3 sm:gap-10" style={delay(480)}>
          {SERVICES.map(({ id, icon: Icon, label, summary }) => (
            <li key={id}>
              <a href={`#services-${id}`} className="group flex h-full items-start gap-3">
                <Icon className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={1.75} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink transition-colors duration-500 ease-soft group-hover:text-accent">{label}</p>
                  <p className="text-sm text-ink-2">{summary}</p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
