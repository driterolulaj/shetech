import { Moon, Sun } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useTheme } from '../../lib/theme'

/** Sun/moon switch. The two icons cross-rotate rather than swapping abruptly. */
export function ThemeToggle({ className }) {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  const label = dark ? 'Switch to light theme' : 'Switch to dark theme'
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={cn(
        'relative grid size-9 place-items-center overflow-hidden rounded-sm text-ink transition-colors duration-500 ease-soft hover:text-accent',
        'focus-visible:outline-2 focus-visible:outline-accent',
        className,
      )}
    >
      <Sun
        aria-hidden="true"
        strokeWidth={1.75}
        className={cn(
          'absolute size-[18px] transition-[transform,opacity] duration-700 ease-soft',
          dark ? 'rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100',
        )}
      />
      <Moon
        aria-hidden="true"
        strokeWidth={1.75}
        className={cn(
          'absolute size-[18px] transition-[transform,opacity] duration-700 ease-soft',
          dark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0',
        )}
      />
    </button>
  )
}
