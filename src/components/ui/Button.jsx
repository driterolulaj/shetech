import { cn, variants } from '../../lib/cn'
import { Glass } from './Glass'

export const buttonStyles = variants({
  base: [
    'group inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-sm font-medium',
    'transition-[background-color,border-color,color,box-shadow,transform,--sheen,--glass-a,--glass-b] duration-500 ease-soft',
    'active:scale-[0.98] active:duration-150',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
    'disabled:pointer-events-none disabled:opacity-50',
  ].join(' '),
  variants: {
    variant: {
      primary:
        'bg-accent text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.22)] hover:bg-accent-strong hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_8px_24px_-10px_rgb(83_58_253/0.6)]',
      outline: 'border border-ink/15 bg-white/50 text-ink hover:border-accent hover:text-accent',
      glass: 'liquid-glass text-ink [--glass-a:0.6] [--glass-b:0.32] hover:text-accent hover:[--glass-a:0.8] hover:[--glass-b:0.55]',
      ghost: 'text-accent hover:text-ink',
    },
    size: {
      sm: 'h-8 px-3 text-[13px]',
      md: 'h-9 px-4 text-sm',
      lg: 'h-10 px-5 text-[15px]',
    },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
})

/** Chevron that grows a stem on hover, the classic fintech "hover arrow". */
export function HoverArrow({ className }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('size-2.5 overflow-visible', className)}
    >
      <path d="M0 5h7" className="opacity-0 transition-opacity duration-500 ease-soft group-hover:opacity-100" />
      <path d="M1 1l4 4-4 4" className="transition-transform duration-500 ease-soft group-hover:translate-x-[3px]" />
    </svg>
  )
}

/**
 * Compact 4px button. Polymorphic via `as` (e.g. as="a" for links).
 * Hover eases colour and glow over 500ms; press gives a brief scale-down.
 */
export function Button({ as: Comp = 'button', variant, size, arrow = false, className, children, ...props }) {
  const typeProps = Comp === 'button' && !props.type ? { type: 'button' } : {}
  // Glass buttons get the pointer-tracking sheen
  const Element = variant === 'glass' ? Glass : Comp
  const asProp = variant === 'glass' ? { as: Comp } : {}
  return (
    <Element className={buttonStyles({ variant, size, className })} {...asProp} {...typeProps} {...props}>
      {children}
      {arrow && <HoverArrow />}
    </Element>
  )
}
