import { cn } from '../../lib/cn'

export function Container({ as: Comp = 'div', className, ...props }) {
  return <Comp className={cn('mx-auto w-full max-w-[1080px] px-4 sm:px-6 lg:px-8', className)} {...props} />
}

export function Eyebrow({ className, ...props }) {
  return <p className={cn('text-[13px] font-medium tracking-tight text-accent', className)} {...props} />
}

export function Tag({ className, ...props }) {
  return (
    <span
      className={cn('inline-flex items-center rounded-sm border border-line-strong bg-surface/70 px-2 py-0.5 text-xs text-ink-2', className)}
      {...props}
    />
  )
}

export function PlaceholderBadge({ className, children = 'Placeholder' }) {
  return (
    <span className={cn('inline-flex items-center rounded-sm border border-warn/30 bg-warn-wash px-1.5 py-0.5 text-[11px] font-medium text-warn', className)}>
      {children}
    </span>
  )
}
