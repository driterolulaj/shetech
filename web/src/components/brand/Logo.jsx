import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '../../lib/cn'
import { ICON, WORDMARK } from './logoArt'

/**
 * She Tech logo, drawn inline so every colour comes from the palette
 * (src/config/palette.json → logoMark, logoPrimary, logoLight, logoDeep).
 * Data is generated from src/assets/she-tech-logo.svg by `npm run logo`.
 *
 * In the artwork the rings are woven (broken where they cross). To let them
 * spin without showing those breaks, the generator refits each purple ring as
 * one solid ellipse (ICON.solid) and completes the white orbit where it was
 * hidden (ICON.whiteOrbit). The white orbit and bolt stay fixed on top. Animation (styles in index.css, "Logo animation"):
 *   - entrance, once, when first on screen: the outer ring draws itself, the
 *     rings swing in, the bolt strikes (flicker + flash), the letters rise
 *   - idle: each ring spins at its own speed; an electron travels the outer ring
 *   - hover/focus: the rings spin up, the electron races a lap, the bolt strikes
 */
const ROLE_COLOR = {
  mark: 'var(--logo-mark)',
  primary: 'var(--logo-primary)',
  light: 'var(--logo-light)',
  deep: 'var(--logo-deep)',
}

const { cx, cy, r } = ICON.ring
const RING = ICON.paths[0]
// White orbit + bolt (minus weave fragments the bridge replaces)
const MARK = ICON.paths.filter((p) => p.role === 'mark' && !p.hidden)
// Completes the white orbit where the artwork hid it behind the purple rings
const BRIDGES = ICON.whiteOrbit.bridges

/** The white orbit and bolt in one colour, including the bridge. */
function WhiteMark({ color }) {
  return (
    <>
      {BRIDGES.map((d, i) => (
        <path key={`b${i}`} d={d} fill="none" strokeLinecap="round" strokeWidth={ICON.whiteOrbit.width} style={{ stroke: color }} />
      ))}
      {MARK.map(({ d }, i) => (
        <path key={i} d={d} style={{ fill: color }} />
      ))}
    </>
  )
}
const { middleRing, innerOval, orbit } = ICON.solid

// Letters in reading order, for the staggered entrance
const LETTERS = [...WORDMARK.paths].sort((a, b) => a.box[0] - b.box[0])

/**
 * Invisible square centred on the ring. Inside a group it makes the group's
 * bounding-box centre the ring's exact centre, so CSS transforms with
 * `transform-box: fill-box; transform-origin: center` pivot precisely.
 */
const Frame = () => <rect x={cx - r * 1.1} y={cy - r * 1.1} width={r * 2.2} height={r * 2.2} fill="none" />

/** Plays the entrance the first time the element is on screen. */
function usePlayOnce() {
  const ref = useRef(null)
  const [play, setPlay] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setPlay(true)
        observer.disconnect()
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, play]
}

/**
 * A solid ring that spins about its own centre: idle spin › hover boost › shape.
 * Its gradient is in the shape's own box, so it turns with it and makes the
 * rotation visible even on a near-circle.
 */
function SpinningRing({ shape, name, gradient }) {
  return (
    <g className={`logo-spin logo-spin-${name}`}>
      <g className={`logo-boost logo-boost-${name}`}>
        <ellipse
          cx={shape.cx}
          cy={shape.cy}
          rx={shape.rx}
          ry={shape.ry}
          transform={`rotate(${shape.angle} ${shape.cx} ${shape.cy})`}
          fill="none"
          stroke={`url(#${gradient})`}
          strokeWidth={shape.width * 1.15}
        />
      </g>
    </g>
  )
}

/** The orbit + bolt icon on its own. `charged` plays the hover burst. */
export function LogoMark({ className, title, charged = false, onChargeEnd }) {
  // Ids must be unique per instance (the logo appears several times per page)
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const [ref, play] = usePlayOnce()
  const electron = r * 0.05
  const stops = (...colors) =>
    colors.map(([offset, color]) => <stop key={offset} offset={offset} style={{ stopColor: color }} />)

  return (
    <svg
      ref={ref}
      viewBox={ICON.viewBox}
      data-play={play}
      data-charged={charged}
      onAnimationEnd={(e) => e.animationName === 'logo-charge' && onChargeEnd?.()}
      className={cn('logo-mark overflow-visible', className)}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <linearGradient id={`${uid}mid`} x1="0" y1="0" x2="1" y2="1">
          {stops(['0', ROLE_COLOR.light], ['0.5', ROLE_COLOR.light], ['1', ROLE_COLOR.deep])}
        </linearGradient>
        <linearGradient id={`${uid}orbit`} x1="0" y1="0" x2="1" y2="0">
          {stops(['0', ROLE_COLOR.primary], ['0.6', ROLE_COLOR.light], ['1', ROLE_COLOR.primary])}
        </linearGradient>
        <linearGradient id={`${uid}inner`} x1="0" y1="1" x2="1" y2="0">
          {stops(['0', ROLE_COLOR.primary], ['1', ROLE_COLOR.light])}
        </linearGradient>

        {/* Draw-on mask for the outer ring: a thick stroke whose dash grows from the top */}
        <mask id={`${uid}ring`} maskUnits="userSpaceOnUse" x={cx - r * 1.2} y={cy - r * 1.2} width={r * 2.4} height={r * 2.4}>
          <circle
            className="logo-ring-wipe"
            cx={cx}
            cy={cy}
            r={r}
            pathLength="100"
            transform={`rotate(-90 ${cx} ${cy})`}
            fill="none"
            stroke="#fff"
            strokeWidth={r * 0.3}
          />
        </mask>

        {/* Lightning glow: thicken, then blur, so it reads even at navbar size */}
        <filter id={`${uid}glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feMorphology operator="dilate" radius={r * 0.035} />
          <feGaussianBlur stdDeviation={r * 0.09} />
        </filter>
        <filter id={`${uid}soft`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={r * 0.06} />
        </filter>
      </defs>

      <g className="logo-body">
        <Frame />
        <path d={RING.d} style={{ fill: ROLE_COLOR[RING.role] }} mask={`url(#${uid}ring)`} />

        <SpinningRing shape={middleRing} name="middle" gradient={`${uid}mid`} />
        <SpinningRing shape={orbit} name="orbit" gradient={`${uid}orbit`} />
        <SpinningRing shape={innerOval} name="inner" gradient={`${uid}inner`} />

        {/* Lightning strike: a bright halo behind the bolt. Separate layers for the
            entrance and hover strikes, so one never restarts the other. */}
        {['in', 'hover'].map((when) => (
          <g key={when} className={`logo-strike logo-strike-${when}`} filter={`url(#${uid}glow)`}>
            <WhiteMark color="var(--logo-light)" />
          </g>
        ))}

        {/* White orbit and bolt: fixed, on top (flickers during a strike) */}
        <g className="logo-bolt-in">
          <g className="logo-bolt-hover">
            <WhiteMark color={ROLE_COLOR.mark} />
          </g>
        </g>

        {/* Electron riding the outer ring: idle orbit › hover lap */}
        <g className="logo-electron">
          <Frame />
          <g className="logo-electron-lap">
            <Frame />
            <circle cx={cx} cy={cy - r + electron * 0.6} r={electron * 2.6} filter={`url(#${uid}soft)`} style={{ fill: 'var(--logo-light)' }} opacity="0.8" />
            <circle cx={cx} cy={cy - r + electron * 0.6} r={electron} style={{ fill: 'var(--logo-mark)' }} />
          </g>
        </g>
      </g>
    </svg>
  )
}

/** The "She Tech" lettering on its own. */
export function Wordmark({ className }) {
  const [ref, play] = usePlayOnce()
  return (
    <svg
      ref={ref}
      viewBox={WORDMARK.viewBox}
      preserveAspectRatio="xMinYMid meet"
      data-play={play}
      className={cn('logo-wordmark overflow-visible', className)}
      aria-hidden="true"
    >
      {LETTERS.map(({ d }, i) => (
        <path key={i} d={d} className="logo-letter" style={{ fill: ROLE_COLOR.mark, '--i': i }} />
      ))}
    </svg>
  )
}

/** Icon + wordmark, side by side, linking home. Hover or focus charges the mark. */
export function Logo({ className, href = '#top' }) {
  const [charged, setCharged] = useState(false)
  const charge = () => setCharged(true)
  return (
    <a
      href={href}
      aria-label="She Tech, home"
      onPointerEnter={charge}
      onFocus={charge}
      className={cn('logo-link inline-flex items-center gap-2.5', className)}
    >
      <LogoMark className="size-9 shrink-0" charged={charged} onChargeEnd={() => setCharged(false)} />
      <Wordmark className="h-4 w-auto" />
    </a>
  )
}
