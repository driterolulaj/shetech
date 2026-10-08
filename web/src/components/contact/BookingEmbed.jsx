import { useState } from 'react'
import { ExternalLink, Loader2 } from 'lucide-react'
import { SITE } from '../../config/site'
import { bookingEmbedUrl } from '../../lib/contact'
import { cn } from '../../lib/cn'

/** Inline scheduler (Calendly, Cal.com, …) with a loading state and a new-tab escape hatch. */
export function BookingEmbed({ url = SITE.booking.url }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <div className="grid gap-3">
      <div className="relative h-[min(68dvh,700px)] overflow-hidden rounded-sm border border-line bg-canvas">
        {!loaded && (
          <div className="absolute inset-0 grid place-items-center text-sm text-ink-3">
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" strokeWidth={2} />
              Loading available times…
            </span>
          </div>
        )}
        <iframe
          src={bookingEmbedUrl(url)}
          title={`Book a call with ${SITE.name}`}
          onLoad={() => setLoaded(true)}
          allow="payment"
          className={cn('absolute inset-0 size-full transition-opacity duration-700 ease-soft', loaded ? 'opacity-100' : 'opacity-0')}
        />
      </div>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 self-end text-xs text-ink-3 transition-colors duration-300 ease-soft hover:text-accent"
      >
        Trouble loading? Open the scheduler in a new tab
        <ExternalLink className="size-3.5" strokeWidth={1.75} />
      </a>
    </div>
  )
}
