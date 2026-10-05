import { ArrowLeftRight, Database, Inbox, Mail, Sparkles, Users } from 'lucide-react'
import { cn } from '../lib/cn'

const node = 'grid size-10 place-items-center rounded-sm border border-slate-100 bg-white text-accent'

function Ledger({ featured }) {
  const rows = featured
    ? [['Client', 'Acme Logistics Ltd.'], ['Term', '24 months'], ['Pricing', '€4,200 / mo'], ['Billing', 'Monthly · Net 30']]
    : [['Term', '24 months'], ['Billing', 'Monthly']]
  return (
    <div className="max-w-md rounded-sm border border-slate-100 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 text-xs">
        <span className="font-medium text-ink">Contract_Acme_2026.pdf</span>
        <span className="text-emerald-600">● Extracted</span>
      </div>
      <dl className="divide-y divide-slate-100 px-4 text-xs">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between py-2">
            <dt className="text-ink-3">{k}</dt>
            <dd className="font-medium tabular-nums text-ink">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function Flow() {
  const steps = [Mail, Sparkles, Users]
  return (
    <div className="flex items-center">
      {steps.map((Icon, i) => (
        <div key={i} className="flex items-center">
          {i > 0 && <span className="h-px w-8 border-t border-dashed border-accent/40 sm:w-10" />}
          <span className={node}>
            <Icon className="size-4" strokeWidth={1.75} />
          </span>
        </div>
      ))}
    </div>
  )
}

function Chart() {
  const bars = [38, 52, 44, 66, 58, 78, 72, 90]
  return (
    <div className="flex h-20 items-end gap-1.5">
      {bars.map((h, i) => (
        <span
          key={i}
          style={{ height: `${h}%` }}
          className={cn(
            'w-3 rounded-t-[1px] transition-transform duration-500 ease-out group-hover:scale-y-105 origin-bottom',
            i === bars.length - 1 ? 'bg-accent' : 'bg-accent/20',
          )}
        />
      ))}
    </div>
  )
}

function Sync() {
  return (
    <div className="flex items-center gap-3">
      <span className={node}><Inbox className="size-4" strokeWidth={1.75} /></span>
      <ArrowLeftRight className="size-4 text-ink-3 transition-transform duration-300 group-hover:scale-x-125" strokeWidth={1.75} />
      <span className={node}><Database className="size-4" strokeWidth={1.75} /></span>
    </div>
  )
}

const VISUALS = { ledger: Ledger, flow: Flow, chart: Chart, sync: Sync }

export function ProjectVisual({ type, featured = false, className }) {
  const Visual = VISUALS[type]
  if (!Visual) return null
  return (
    <div aria-hidden="true" className={className}>
      <Visual featured={featured} />
    </div>
  )
}
