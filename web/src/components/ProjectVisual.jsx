import { ArrowLeftRight, Database, Inbox, Mail, Sparkles, Users } from 'lucide-react'
import { cn } from '../lib/cn'

const node = 'grid size-10 place-items-center rounded-sm border border-line bg-surface text-accent'

/** Document → extracted fields. Field names only; shimmer bars stand in for values. */
function Ledger() {
  const rows = [['Parties', '64%'], ['Contract term', '48%'], ['Pricing', '38%'], ['Billing frequency', '44%']]
  return (
    <div className="w-full max-w-sm text-xs">
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <span className="font-medium text-ink">contract.pdf</span>
        <span className="text-success">● Extracted</span>
      </div>
      <dl className="divide-y divide-line">
        {rows.map(([field, width]) => (
          <div key={field} className="flex items-center justify-between gap-6 py-2.5">
            <dt className="text-ink-3">{field}</dt>
            <dd className="skeleton h-1.5 rounded-full" style={{ width }} />
          </div>
        ))}
      </dl>
    </div>
  )
}

/**
 * A terraced facade where each block is an apartment, coloured by status like
 * the BSR map. The highlighted unit and its tooltip use real data (A07).
 * Floors are listed top → bottom; 1 = available, 0 = sold.
 */
const FLOORS = [
  [1, 0, 1],
  [0, 1, 1, 0],
  [1, 0, 0, 1, 1],
  [0, 1, 1, 0, 1, 1],
  [1, 1, 0, 1, 0, 1],
]
const HIGHLIGHT = { floor: 3, unit: 1 } // second floor from the ground: "Floor 2"

function Facade() {
  return (
    <div className="w-full max-w-sm">
      <div className="relative flex flex-col items-start gap-[3px]">
        {FLOORS.map((units, f) => (
          <div key={f} className="flex gap-[3px]">
            {units.map((free, u) => {
              const highlighted = f === HIGHLIGHT.floor && u === HIGHLIGHT.unit
              return (
                <span
                  key={u}
                  className={cn(
                    'relative h-6 w-10 rounded-[1px] transition-[background-color,box-shadow] duration-700 ease-soft sm:w-12',
                    free ? 'bg-success/35' : 'bg-danger/30',
                    highlighted && 'bg-success/70 shadow-[0_0_0_2px_var(--accent)]',
                  )}
                >
                  {highlighted && (
                    <span className="absolute bottom-full left-1/2 z-10 mb-2.5 w-max -translate-x-1/2 rounded-sm border border-line bg-surface px-2.5 py-1.5 text-[11px] leading-4 shadow-[0_8px_24px_-12px_rgb(10_37_64/0.35)]">
                      <span className="font-medium text-ink">A07</span>
                      <span className="ml-1.5 text-success">Available</span>
                      <span className="block text-ink-3">3+1 · Floor 2 · 131.6 m²</span>
                    </span>
                  )}
                </span>
              )
            })}
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-4 text-[11px] text-ink-3">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-[1px] bg-success/60" /> Available
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-[1px] bg-danger/50" /> Sold
        </span>
      </div>
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
          className={cn('w-3 origin-bottom rounded-t-[1px]', i === bars.length - 1 ? 'bg-accent' : 'bg-accent/20')}
        />
      ))}
    </div>
  )
}

function Sync() {
  return (
    <div className="flex items-center gap-3">
      <span className={node}><Inbox className="size-4" strokeWidth={1.75} /></span>
      <ArrowLeftRight className="size-4 text-ink-3" strokeWidth={1.75} />
      <span className={node}><Database className="size-4" strokeWidth={1.75} /></span>
    </div>
  )
}

const VISUALS = { ledger: Ledger, facade: Facade, flow: Flow, chart: Chart, sync: Sync }

/**
 * @param {boolean} surface  Sit the visual on a solid panel (needed over the gradient in the modal banner).
 */
export function ProjectVisual({ type, surface = false, className }) {
  const Visual = VISUALS[type]
  if (!Visual) return null
  return (
    <div aria-hidden="true" className={cn(surface && 'rounded-sm border border-line bg-surface/90 p-5 backdrop-blur', className)}>
      <Visual />
    </div>
  )
}
