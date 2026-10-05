import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ChevronDown, Menu, X } from 'lucide-react'
import { NAV_LINKS, NAV_MENUS } from '../data/navigation'
import { useScrolled } from '../hooks/useScrolled'
import { cn } from '../lib/cn'
import { Button } from './ui/Button'
import { Container } from './ui/Container'
import { Glass } from './ui/Glass'

const CLOSE_DELAY = 220
const HOVER_CLICK_GRACE = 400
const MORPH = '560ms var(--ease-soft)'

const clamp = (value, min, max) => Math.min(Math.max(value, min), Math.max(min, max))

export function Logo({ className }) {
  return (
    <a href="#top" className={cn('inline-flex items-center gap-2 text-[17px] font-medium tracking-tight text-ink', className)}>
      <span aria-hidden="true" className="size-4 rounded-sm bg-linear-to-br from-accent via-violet-400 to-cyan" />
      She Tech
    </a>
  )
}

function ColumnHeading({ children }) {
  return <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3">{children}</p>
}

function MenuContent({ menu, onNavigate }) {
  const [primary, ...secondary] = menu.columns
  return (
    <div className="flex">
      <div className="w-[22rem] p-6">
        <ColumnHeading>{primary.heading}</ColumnHeading>
        <ul className="mt-3 space-y-0.5">
          {primary.items.map(({ label, description, href, icon: Icon }) => (
            <li key={label}>
              <a href={href} onClick={onNavigate} className="group/item -mx-2 flex gap-3 rounded-sm p-2 transition-colors duration-500 ease-soft hover:bg-white/70">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-sm border border-white/80 bg-white/70 text-accent transition-transform duration-500 ease-soft group-hover/item:scale-105">
                  <Icon className="size-4" strokeWidth={1.75} />
                </span>
                <span>
                  <span className="block text-sm font-medium text-ink transition-colors duration-500 ease-soft group-hover/item:text-accent">{label}</span>
                  <span className="block text-[13px] leading-5 text-ink-2">{description}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      {secondary.map((column) => (
        <div key={column.heading} className="w-52 border-l border-white/70 bg-white/35 p-6">
          <ColumnHeading>{column.heading}</ColumnHeading>
          <ul className="mt-3 space-y-0.5">
            {column.items.map(({ label, href, icon: Icon }) => (
              <li key={label}>
                <a href={href} onClick={onNavigate} className="-mx-2 flex items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm text-ink-2 transition-colors duration-500 ease-soft hover:text-accent">
                  <Icon className="size-4 text-ink-3" strokeWidth={1.75} />
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

/**
 * Fixed liquid-glass header. At the top it spans the page; once scrolled it
 * condenses into a floating bar. The popover is a single morphing shell that
 * slides and resizes between triggers. It's a sibling of the bar, not a
 * child, because nested backdrop-filters can't see the page behind them.
 */
export function Navbar() {
  const scrolled = useScrolled(16)
  const [activeId, setActiveId] = useState(null)
  const [renderedId, setRenderedId] = useState(NAV_MENUS[0].id) // keeps content during fade-out
  const [geometry, setGeometry] = useState({ anchorX: 0, minX: 0, maxX: 0, top: 0 })
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [morph, setMorph] = useState(false) // animate geometry only when switching between menus
  const [mobileOpen, setMobileOpen] = useState(false)

  const headerRef = useRef(null)
  const barRef = useRef(null)
  const navRef = useRef(null)
  const contentRef = useRef(null)
  const triggerRefs = useRef({})
  const closeTimer = useRef(0)
  const hoverOpenedAt = useRef(0)

  const cancelClose = () => window.clearTimeout(closeTimer.current)

  const openMenu = useCallback(
    (id) => {
      window.clearTimeout(closeTimer.current)
      const trigger = triggerRefs.current[id]
      const header = headerRef.current
      if (trigger && header && navRef.current && barRef.current) {
        const h = header.getBoundingClientRect()
        const t = trigger.getBoundingClientRect()
        const n = navRef.current.getBoundingClientRect()
        setGeometry({
          anchorX: t.left + t.width / 2 - h.left,
          minX: n.left - h.left,
          maxX: n.right - h.left,
          top: barRef.current.getBoundingClientRect().bottom - h.top,
        })
      }
      setMorph(activeId !== null)
      setActiveId(id)
      setRenderedId(id)
    },
    [activeId],
  )

  const closeMenu = useCallback(() => {
    window.clearTimeout(closeTimer.current)
    setActiveId(null)
  }, [])

  const scheduleClose = useCallback(() => {
    window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setActiveId(null), CLOSE_DELAY)
  }, [])

  // Track the natural size of the active menu so the shell can morph to it.
  // ResizeObserver also catches late changes such as the web font swapping in.
  useLayoutEffect(() => {
    const el = contentRef.current
    if (!el) return
    const measure = () => setSize({ width: el.offsetWidth, height: el.offsetHeight })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [renderedId])

  // The bar changes shape when scrolling, so drop any open popover
  useEffect(() => closeMenu(), [scrolled, closeMenu])

  useEffect(() => {
    if (!activeId && !mobileOpen) return
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (activeId) triggerRefs.current[activeId]?.focus()
      closeMenu()
      setMobileOpen(false)
    }
    const onPointer = (e) => {
      if (!headerRef.current?.contains(e.target)) closeMenu()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [activeId, mobileOpen, closeMenu])

  useEffect(() => () => window.clearTimeout(closeTimer.current), [])

  const isOpen = activeId !== null
  const left = clamp(geometry.anchorX - size.width / 2, geometry.minX, geometry.maxX - size.width)
  const menu = NAV_MENUS.find((m) => m.id === renderedId)
  const ease = 'duration-700 ease-soft'

  return (
    <header
      ref={headerRef}
      className={cn('fixed inset-x-0 top-0 z-50 transition-[padding]', ease, scrolled ? 'px-3 pt-3' : 'px-0 pt-0')}
      onBlur={(e) => {
        if (!headerRef.current?.contains(e.relatedTarget)) closeMenu()
      }}
    >
      <Glass
        ref={barRef}
        className={cn(
          'mx-auto transition-[max-width,border-radius,box-shadow,--glass-a,--glass-b,--sheen]',
          ease,
          scrolled
            ? 'max-w-[1080px] rounded-sm [--glass-a:0.72] [--glass-b:0.5]'
            : 'max-w-full rounded-none [--glass-a:0.42] [--glass-b:0.18] shadow-none',
        )}
      >
        <Container
          ref={navRef}
          className={cn('relative flex items-center justify-between transition-[height]', ease, scrolled ? 'h-14 lg:px-5' : 'h-16')}
        >
          <Logo />

          <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
            {NAV_MENUS.map(({ id, label }) => (
              <button
                key={id}
                ref={(el) => (triggerRefs.current[id] = el)}
                type="button"
                aria-expanded={activeId === id}
                aria-controls="nav-popover"
                onPointerEnter={(e) => {
                  if (e.pointerType !== 'mouse') return
                  hoverOpenedAt.current = performance.now()
                  openMenu(id)
                }}
                onPointerLeave={(e) => e.pointerType === 'mouse' && scheduleClose()}
                onClick={() => {
                  const justHovered = performance.now() - hoverOpenedAt.current < HOVER_CLICK_GRACE
                  activeId === id && !justHovered ? closeMenu() : openMenu(id)
                }}
                className={cn(
                  'inline-flex h-9 items-center gap-1 rounded-sm px-3 text-[15px] font-medium text-ink transition-colors duration-500 ease-soft hover:text-accent',
                  'focus-visible:outline-2 focus-visible:outline-accent',
                  activeId === id && 'text-accent',
                )}
              >
                {label}
                <ChevronDown
                  aria-hidden="true"
                  strokeWidth={2}
                  className={cn('size-3.5 transition-transform duration-500 ease-soft', activeId === id && 'rotate-180')}
                />
              </button>
            ))}
            {NAV_LINKS.map(({ label, href }) => (
              <a key={label} href={href} className="inline-flex h-9 items-center rounded-sm px-3 text-[15px] font-medium text-ink transition-colors duration-500 ease-soft hover:text-accent">
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button as="a" href="#contact" size="sm" arrow className="hidden lg:inline-flex">
              Book a call
            </Button>
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
              className="grid size-9 place-items-center rounded-sm text-ink transition-colors duration-500 ease-soft hover:text-accent lg:hidden"
            >
              <Menu className="size-5" strokeWidth={1.75} />
            </button>
          </div>
        </Container>
      </Glass>

      {/* Shared popover shell (sibling of the bar, see note above) */}
      <div
        id="nav-popover"
        className={cn('absolute left-0 hidden pt-2.5 [perspective:2000px] lg:block', !isOpen && 'pointer-events-none')}
        style={{
          top: geometry.top,
          transform: `translateX(${left}px)`,
          transition: morph ? `transform ${MORPH}` : 'none',
        }}
        onPointerEnter={cancelClose}
        onPointerLeave={scheduleClose}
        inert={!isOpen}
      >
        {/* Transform lives on the wrapper; opacity on the glass itself, since an
            ancestor with opacity < 1 would cut the blur off mid-fade. */}
        <div
          className={cn(
            'relative origin-top transition-transform duration-500 ease-soft',
            !isOpen && '[transform:rotateX(-6deg)_scale(0.98)_translateY(-4px)]',
          )}
        >
          <Glass
            className="overflow-hidden rounded-sm [--glass-a:0.82] [--glass-b:0.7]"
            style={{
              width: size.width,
              height: size.height,
              opacity: isOpen ? 1 : 0,
              transition: [
                'opacity 500ms var(--ease-soft)',
                '--sheen 700ms var(--ease-soft)',
                morph && `width ${MORPH}, height ${MORPH}`,
              ]
                .filter(Boolean)
                .join(', '),
            }}
          >
            <div ref={contentRef} key={renderedId} className="absolute left-0 top-0 w-max animate-[menu-fade_480ms_var(--ease-soft)]">
              {menu && <MenuContent menu={menu} onNavigate={closeMenu} />}
            </div>
          </Glass>
          {/* Caret */}
          <span
            aria-hidden="true"
            className="absolute -top-[5px] size-2.5 rotate-45 rounded-[1px] border-l border-t border-white bg-white/90"
            style={{
              left: geometry.anchorX - left - 5,
              opacity: isOpen ? 1 : 0,
              transition: `opacity 500ms var(--ease-soft)${morph ? `, left ${MORPH}` : ''}`,
            }}
          />
        </div>
      </div>

      {/* Mobile sheet */}
      <Glass
        inert={!mobileOpen}
        sheen={false}
        className={cn(
          'fixed inset-x-2 top-2 z-50 max-h-[calc(100dvh-1rem)] origin-top overflow-y-auto rounded-sm [--glass-a:0.88] [--glass-b:0.78] lg:hidden',
          'transition-[opacity,transform] duration-500 ease-soft',
          mobileOpen ? 'opacity-100' : 'pointer-events-none -translate-y-2 scale-[0.98] opacity-0',
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-white/70 px-4">
          <Logo />
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="grid size-9 place-items-center rounded-sm text-ink transition-colors duration-500 ease-soft hover:text-accent"
          >
            <X className="size-5" strokeWidth={1.75} />
          </button>
        </div>
        <div className="grid divide-y divide-ink/[0.06] sm:grid-cols-2 sm:divide-y-0">
          {NAV_MENUS.flatMap((m) => m.columns).map((column) => (
            <div key={column.heading} className="p-5">
              <ColumnHeading>{column.heading}</ColumnHeading>
              <ul className="mt-2">
                {column.items.map(({ label, href, icon: Icon }) => (
                  <li key={label}>
                    <a href={href} onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 py-2 text-[15px] font-medium text-ink transition-colors duration-500 ease-soft hover:text-accent">
                      <Icon className="size-4 text-accent" strokeWidth={1.75} />
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/70 p-4">
          <Button as="a" href="#contact" size="lg" arrow className="w-full" onClick={() => setMobileOpen(false)}>
            Book a call
          </Button>
        </div>
      </Glass>
    </header>
  )
}
