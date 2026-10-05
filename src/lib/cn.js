import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Join class names conditionally, then resolve Tailwind conflicts so the
 * last one wins: cn('px-4 py-2', isLarge && 'px-6') → 'py-2 px-6'.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Tiny variant builder (cva-style) for component style APIs.
 *
 *   const badge = variants({
 *     base: 'inline-flex rounded-sm',
 *     variants: { tone: { neutral: 'bg-canvas', accent: 'bg-accent-wash' } },
 *     defaultVariants: { tone: 'neutral' },
 *   })
 *   badge({ tone: 'accent', className: 'mt-2' })
 *
 * Output goes through cn(), so a caller's className always overrides.
 */
export function variants({ base = '', variants: map = {}, defaultVariants = {} }) {
  return ({ className, ...props } = {}) => {
    const resolved = Object.keys(map).map((key) => {
      const value = props[key] ?? defaultVariants[key]
      return value == null ? null : map[key][value]
    })
    return cn(base, resolved, className)
  }
}
