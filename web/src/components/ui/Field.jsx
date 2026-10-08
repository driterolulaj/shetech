import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/cn'

/** Shared control styling. `user-invalid` only flags a field after the visitor has touched it. */
const control = [
  'w-full rounded-sm border border-line-strong bg-surface px-3 py-2.5 text-[15px] text-ink outline-none',
  'placeholder:text-ink-3/70 transition-[border-color,box-shadow] duration-300 ease-soft',
  'hover:border-line-hover focus:border-accent focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_14%,transparent)]',
  'user-invalid:border-danger user-invalid:focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--danger)_14%,transparent)]',
].join(' ')

export function Field({ label, htmlFor, optional = false, hint, className, children }) {
  return (
    <div className={cn('grid content-start gap-1.5', className)}>
      <label htmlFor={htmlFor} className="flex items-baseline justify-between gap-3 text-[13px] font-medium text-ink">
        {label}
        {optional && <span className="text-xs font-normal text-ink-3">Optional</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-ink-3">{hint}</p>}
    </div>
  )
}

/** Group label for chip sets (renders a fieldset/legend for screen readers). */
export function FieldGroup({ legend, optional = false, className, children }) {
  return (
    <fieldset className={cn('grid gap-2', className)}>
      <legend className="mb-1.5 flex w-full items-baseline justify-between gap-3 text-[13px] font-medium text-ink">
        {legend}
        {optional && <span className="text-xs font-normal text-ink-3">Optional</span>}
      </legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  )
}

export function Input({ className, ...props }) {
  return <input className={cn(control, className)} {...props} />
}

export function Textarea({ className, ...props }) {
  return <textarea className={cn(control, 'min-h-32 resize-y leading-6', className)} {...props} />
}

export function Select({ className, children, ...props }) {
  return (
    <div className="relative">
      <select className={cn(control, 'appearance-none pr-9', className)} {...props}>
        {children}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
    </div>
  )
}

/** Checkbox/radio styled as a 4px chip. */
export function Chip({ type = 'checkbox', name, value, defaultChecked, children }) {
  return (
    <label className="cursor-pointer select-none">
      <input type={type} name={name} value={value} defaultChecked={defaultChecked} className="peer sr-only" />
      <span
        className={cn(
          'inline-flex h-9 items-center rounded-sm border border-line-strong bg-surface px-3 text-sm text-ink-2',
          'transition-[border-color,background-color,color] duration-300 ease-soft hover:border-line-hover',
          'peer-checked:border-accent peer-checked:bg-accent-wash peer-checked:text-accent',
          'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent',
        )}
      >
        {children}
      </span>
    </label>
  )
}
