import { useId } from 'react'
import { CalendarDays, Mail } from 'lucide-react'
import { SITE } from '../../config/site'
import { cn } from '../../lib/cn'
import { CopyButton } from '../ui/CopyButton'
import { Dialog, DialogClose } from '../ui/Dialog'
import { BookingEmbed } from './BookingEmbed'
import { ContactForm } from './ContactForm'

const TABS = [
  { id: 'call', label: 'Book a call', icon: CalendarDays },
  { id: 'message', label: 'Send a message', icon: Mail },
]

export function ContactDialog({ open, tab, prefill, formKey, onClose, onTabChange }) {
  const titleId = useId()
  const activeIndex = Math.max(0, TABS.findIndex((t) => t.id === tab))

  return (
    <Dialog open={open} onClose={onClose} labelledBy={titleId} className="w-[min(calc(100%-2rem),46rem)]">
      <header className="border-b border-line px-6 pb-5 pt-6 sm:px-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 id={titleId} className="text-2xl font-light tracking-tighter text-ink sm:text-3xl">
              Let's talk.
            </h2>
            <p className="mt-1 text-sm text-ink-2">
              {tab === 'call'
                ? `${SITE.booking.duration} · ${SITE.booking.format} · no obligation`
                : `We reply ${SITE.responseTime.toLowerCase()}.`}
            </p>
          </div>
          <DialogClose onClick={onClose} />
        </div>

        {/* Segmented tabs with a sliding indicator */}
        <div role="tablist" aria-label="How would you like to get in touch?" className="relative mt-5 grid grid-cols-2 rounded-sm border border-line bg-canvas p-1">
          <span
            aria-hidden="true"
            className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-sm border border-line bg-surface shadow-[0_1px_2px_rgb(10_37_64/0.06)] transition-transform duration-500 ease-soft"
            style={{ transform: `translateX(${activeIndex * 100}%)` }}
          />
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => onTabChange(id)}
              className={cn(
                'relative z-10 inline-flex h-9 items-center justify-center gap-2 rounded-sm text-sm font-medium transition-colors duration-500 ease-soft',
                'focus-visible:outline-2 focus-visible:outline-accent',
                tab === id ? 'text-ink' : 'text-ink-3 hover:text-ink-2',
              )}
            >
              <Icon className={cn('size-4 transition-colors duration-500 ease-soft', tab === id && 'text-accent')} strokeWidth={1.75} />
              {label}
            </button>
          ))}
        </div>
      </header>

      <div role="tabpanel" className="overflow-y-auto overscroll-contain px-6 py-6 sm:px-8">
        {tab === 'call' && SITE.booking.url ? (
          <BookingEmbed />
        ) : (
          <>
            {tab === 'call' && SITE.canReceiveMessages && (
              <p className="mb-6 text-[15px] text-ink-2">
                Tell us when suits you and we'll send a calendar invite. Prefer to write it down?{' '}
                <button type="button" onClick={() => onTabChange('message')} className="font-medium text-accent">
                  Send a message instead
                </button>
                .
              </p>
            )}
            <ContactForm key={`${formKey}-${tab}`} kind={tab} prefill={prefill} />
          </>
        )}
      </div>

      {SITE.email && (
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-canvas px-6 py-3.5 text-sm text-ink-2 sm:px-8">
        <span>
          Prefer email?{' '}
          <a href={`mailto:${SITE.email}`} className="font-medium text-ink transition-colors duration-300 ease-soft hover:text-accent">
            {SITE.email}
          </a>
        </span>
        <CopyButton value={SITE.email} label="Copy" />
      </footer>
      )}
    </Dialog>
  )
}
