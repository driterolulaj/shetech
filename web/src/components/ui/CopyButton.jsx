import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '../../lib/cn'

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // Clipboard API unavailable (http, old browser): fall back to a hidden textarea
    const area = Object.assign(document.createElement('textarea'), { value: text })
    area.style.cssText = 'position:fixed;opacity:0;pointer-events:none'
    document.body.append(area)
    area.select()
    document.execCommand('copy')
    area.remove()
  }
}

export function CopyButton({ value, label = 'Copy', className }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef(0)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  return (
    <button
      type="button"
      onClick={async () => {
        await copyText(value)
        setCopied(true)
        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => setCopied(false), 1800)
      }}
      className={cn(
        'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-sm border border-line-strong bg-surface px-2.5 text-xs font-medium text-ink-2',
        'transition-colors duration-300 ease-soft hover:border-accent hover:text-accent',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        className,
      )}
    >
      {copied ? <Check className="size-3.5 text-success" strokeWidth={2} /> : <Copy className="size-3.5" strokeWidth={1.75} />}
      <span aria-live="polite">{copied ? 'Copied' : label}</span>
    </button>
  )
}
