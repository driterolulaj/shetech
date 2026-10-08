/**
 * Geometry helpers for the logo generator: sample paths, fit ellipses, and
 * estimate stroke widths, so broken (woven) arcs can be redrawn as solid shapes.
 */

/** Points along a path made of absolute M / L / C / z commands. Returns one array per subpath. */
export function samplePath(d, steps = 24) {
  const t = d.match(/[MLCz]|-?\d*\.?\d+(?:e-?\d+)?/gi)
  const subpaths = []
  let pts = []
  let i = 0
  let cmd
  let x = 0
  let y = 0
  const n = () => Number(t[i++])
  while (i < t.length) {
    if (/[a-z]/i.test(t[i])) cmd = t[i++]
    if (cmd === 'z' || cmd === 'Z') {
      if (pts.length) subpaths.push(pts)
      pts = []
      continue
    }
    if (cmd === 'M' || cmd === 'L') {
      if (cmd === 'M' && pts.length) {
        subpaths.push(pts)
        pts = []
      }
      x = n()
      y = n()
      pts.push([x, y])
    } else if (cmd === 'C') {
      const [a, b, c, e, f, g] = [n(), n(), n(), n(), n(), n()]
      for (let s = 1; s <= steps; s++) {
        const q = s / steps
        const u = 1 - q
        pts.push([u ** 3 * x + 3 * u * u * q * a + 3 * u * q * q * c + q ** 3 * f, u ** 3 * y + 3 * u * u * q * b + 3 * u * q * q * e + q ** 3 * g])
      }
      x = f
      y = g
    }
  }
  if (pts.length) subpaths.push(pts)
  return subpaths
}

/** Solve a small linear system (Gaussian elimination with partial pivoting). */
function solve(A, b) {
  const n = b.length
  const M = A.map((row, i) => [...row, b[i]])
  for (let c = 0; c < n; c++) {
    let p = c
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r
    ;[M[c], M[p]] = [M[p], M[c]]
    for (let r = c + 1; r < n; r++) {
      const f = M[r][c] / M[c][c]
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]
    }
  }
  const x = Array(n).fill(0)
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n]
    for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k]
    x[r] = s / M[r][r]
  }
  return x
}

/**
 * Least-squares ellipse through points: A x² + B xy + C y² + D x + E y = 1
 * (coordinates are shifted to `origin` first for numerical stability).
 * Returns { cx, cy, rx, ry, angle } with angle in degrees.
 */
export function fitEllipse(points, origin) {
  const P = points.map(([x, y]) => [x - origin.x, y - origin.y])
  const rows = P.map(([x, y]) => [x * x, x * y, y * y, x, y])
  const AtA = Array.from({ length: 5 }, (_, i) => Array.from({ length: 5 }, (_, j) => rows.reduce((s, r) => s + r[i] * r[j], 0)))
  const Atb = Array.from({ length: 5 }, (_, i) => rows.reduce((s, r) => s + r[i], 0))
  const [A, B, C, D, E] = solve(AtA, Atb)
  const F = -1
  // Centre
  const den = 4 * A * C - B * B
  const x0 = (B * E - 2 * C * D) / den
  const y0 = (B * D - 2 * A * E) / den
  // Axes
  const theta = 0.5 * Math.atan2(B, A - C)
  const cos = Math.cos(theta)
  const sin = Math.sin(theta)
  const Ap = A * cos * cos + B * cos * sin + C * sin * sin
  const Cp = A * sin * sin - B * cos * sin + C * cos * cos
  const Fp = A * x0 * x0 + B * x0 * y0 + C * y0 * y0 + D * x0 + E * y0 + F
  const rx = Math.sqrt(-Fp / Ap)
  const ry = Math.sqrt(-Fp / Cp)
  return { cx: x0 + origin.x, cy: y0 + origin.y, rx, ry, angle: (theta * 180) / Math.PI }
}

/** Average thickness of a thin filled band: 2 × area / perimeter. */
export function bandWidth(subpaths) {
  let area = 0
  let perimeter = 0
  for (const pts of subpaths) {
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i]
      const [x2, y2] = pts[(i + 1) % pts.length]
      area += x1 * y2 - x2 * y1
      perimeter += Math.hypot(x2 - x1, y2 - y1)
    }
  }
  return (2 * Math.abs(area / 2)) / perimeter
}

/** Distance from a point to an ellipse, measured along the ray from its centre (good for refinement). */
const rayDistance = ([x, y], { cx, cy, rx, ry, angle }) => {
  const t = (-angle * Math.PI) / 180
  const dx = x - cx
  const dy = y - cy
  const qx = dx * Math.cos(t) - dy * Math.sin(t)
  const qy = dx * Math.sin(t) + dy * Math.cos(t)
  const k = Math.hypot(qx / rx, qy / ry)
  return Math.hypot(qx, qy) * (1 - 1 / k)
}

/** Geometric refinement of an ellipse fit (Nelder–Mead on summed squared distances). */
export function refineEllipse(points, start, iterations = 4000) {
  const keys = ['cx', 'cy', 'rx', 'ry', 'angle']
  const cost = (v) => {
    const e = Object.fromEntries(keys.map((k, i) => [k, v[i]]))
    if (e.rx <= 1 || e.ry <= 1) return Infinity
    return points.reduce((s, p) => s + rayDistance(p, e) ** 2, 0)
  }
  const steps = [20, 20, 20, 20, 3]
  let simplex = [keys.map((k) => start[k])]
  for (let i = 0; i < 5; i++) simplex.push(simplex[0].map((v, j) => (j === i ? v + steps[i] : v)))
  let scores = simplex.map(cost)
  for (let it = 0; it < iterations; it++) {
    const order = scores.map((s, i) => i).sort((a, b) => scores[a] - scores[b])
    simplex = order.map((i) => simplex[i])
    scores = order.map((i) => scores[i])
    const centroid = simplex.slice(0, 5).reduce((c, v) => c.map((x, j) => x + v[j] / 5), Array(5).fill(0))
    const worst = simplex[5]
    const at = (f) => centroid.map((c, j) => c + f * (worst[j] - c))
    const reflected = at(-1)
    const r = cost(reflected)
    if (r < scores[0]) {
      const expanded = at(-2)
      const e = cost(expanded)
      ;[simplex[5], scores[5]] = e < r ? [expanded, e] : [reflected, r]
    } else if (r < scores[4]) {
      ;[simplex[5], scores[5]] = [reflected, r]
    } else {
      const contracted = at(0.5)
      const c = cost(contracted)
      if (c < scores[5]) [simplex[5], scores[5]] = [contracted, c]
      else {
        simplex = simplex.map((v, i) => (i === 0 ? v : v.map((x, j) => simplex[0][j] + 0.5 * (x - simplex[0][j]))))
        scores = simplex.map(cost)
      }
    }
  }
  const best = simplex[scores.indexOf(Math.min(...scores))]
  const e = Object.fromEntries(keys.map((k, i) => [k, best[i]]))
  const rms = Math.sqrt(cost(best) / points.length)
  return { ...e, rms }
}

/**
 * Smooth closed curve through scattered points: radius as a low-order Fourier
 * series of the angle around `center`. Follows hand-drawn (non-elliptical)
 * loops and bridges gaps smoothly. Returns { path, rms } with `path` an SVG d.
 */
export function fitLoop(points, center, order = 4, samples = 240) {
  const polar = points.map(([x, y]) => [Math.atan2(y - center.y, x - center.x), Math.hypot(x - center.x, y - center.y)])
  const basis = (t) => [1, ...Array.from({ length: order }, (_, k) => [Math.cos((k + 1) * t), Math.sin((k + 1) * t)]).flat()]
  const rows = polar.map(([t]) => basis(t))
  const n = rows[0].length
  const AtA = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => rows.reduce((s, r) => s + r[i] * r[j], 0)))
  const Atb = Array.from({ length: n }, (_, i) => rows.reduce((s, r, k) => s + r[i] * polar[k][1], 0))
  const coef = solve(AtA, Atb)
  const radius = (t) => basis(t).reduce((s, b, i) => s + b * coef[i], 0)
  const rms = Math.sqrt(polar.reduce((s, [t, r]) => s + (r - radius(t)) ** 2, 0) / polar.length)
  const round = (v) => Math.round(v * 10) / 10
  const pts = Array.from({ length: samples }, (_, i) => {
    const t = (i / samples) * Math.PI * 2
    const r = radius(t)
    return `${round(center.x + r * Math.cos(t))} ${round(center.y + r * Math.sin(t))}`
  })
  return { path: `M ${pts.join(' L ')} Z`, rms }
}
