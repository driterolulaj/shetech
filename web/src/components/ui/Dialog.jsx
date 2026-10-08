import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { lockScroll } from '../../lib/scrollLock'

const EXIT_MS = 280 // keep in sync with `dialog-out` in index.css

/**
 * Controlled native <dialog>. The platform gives us the focus trap, Escape,
 * top-layer stacking and focus return; this adds enter/exit motion, backdrop
 * click to close and a scroll lock. Children stay mounted through the exit
 * animation, then unmount.
 */
export function Dialog({ open, onClose, labelledBy, className, children }) {
  const ref = useRef(null)
  const [closing, setClosing] = useState(false)
  const [mounted, setMounted] = useState(open)

  useEffect(() => {
    const dialog = ref.current
    if (!open || !dialog) return
    setMounted(true)
    setClosing(false)
    if (!dialog.open) dialog.showModal()
    return lockScroll()
  }, [open])

  useEffect(() => {
    const dialog = ref.current
    if (open || !dialog?.open) return
    setClosing(true)
    const timer = window.setTimeout(() => {
      dialog.close()
      setClosing(false)
      setMounted(false)
    }, EXIT_MS)
    return () => window.clearTimeout(timer)
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      data-closing={closing}
      onCancel={(e) => {
        e.preventDefault() // run the exit animation instead of closing instantly
        onClose()
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className={cn(
        'dialog-panel m-auto max-h-[min(calc(100dvh-2rem),56rem)] w-[min(calc(100%-2rem),60rem)] max-w-none overflow-hidden rounded-sm border border-line bg-surface p-0 text-ink',
        className,
      )}
    >
      {(open || mounted) && <div className="flex max-h-[inherit] flex-col">{children}</div>}
    </dialog>
  )
}

export function DialogClose({ onClick, label = 'Close' }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-8 shrink-0 place-items-center rounded-sm border border-line text-ink-2 transition-colors duration-500 ease-soft hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
    >
      <X className="size-4" strokeWidth={1.75} />
    </button>
  )
}
