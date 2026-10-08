import { useEffect, useState } from 'react'
import { isHexColor, parseHex, toHex } from '../core/color.js'

/** One colour: swatch (opens the native picker), hex text field and, optionally, opacity. */
export function ColorField({ label, value, onChange, alpha = true }) {
  const [text, setText] = useState(value)
  useEffect(() => setText(value), [value])
  const { a } = parseHex(value)
  const opaque = toHex({ ...parseHex(value), a: 1 })

  return (
    <div className="pe-field">
      <label className="pe-swatch">
        <span style={{ background: value }} />
        <input type="color" value={opaque} onChange={(e) => onChange(toHex({ ...parseHex(e.target.value), a }))} aria-label={`${label} colour`} />
      </label>
      <span className="pe-label">{label}</span>
      <input
        value={text}
        spellCheck={false}
        aria-label={`${label} hex value`}
        aria-invalid={!isHexColor(text)}
        onChange={(e) => {
          const next = e.target.value.trim()
          setText(next)
          if (isHexColor(next)) onChange(next.toLowerCase())
        }}
        onBlur={() => setText(value)}
        className="pe-input pe-hex"
      />
      {alpha ? (
        <label className="pe-alpha">
          <input
            type="number"
            min={0}
            max={100}
            value={Math.round(a * 100)}
            aria-label={`${label} opacity`}
            onChange={(e) => onChange(toHex({ ...parseHex(value), a: Math.min(100, Math.max(0, Number(e.target.value))) / 100 }))}
            className="pe-input pe-num"
          />
          %
        </label>
      ) : (
        <span className="pe-alpha-spacer" />
      )}
    </div>
  )
}
