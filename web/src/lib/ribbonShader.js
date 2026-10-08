/**
 * Silk ribbon, in the spirit of Stripe's current hero wave: one wide band of
 * fine strands sweeping across the canvas, slowly undulating and twisting,
 * with frayed edges. Two layers (front and back) give it depth.
 *
 * Ribbon space: x runs along the band, y across it. The band's half-width
 * shrinks as it twists edge-on, and the colours flip with the face showing.
 * Output is premultiplied alpha over a transparent canvas.
 */
export const RIBBON_FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uC0, uC1, uC2, uC3;
uniform vec2 uAnchor;   // a point the ribbon passes through, 0–1 across the canvas
uniform float uAngle;   // direction of travel, radians from +x (negative = downwards)
uniform float uWidth;   // half-width in units of the canvas's shorter side

float hash(float n) { return fract(sin(n) * 43758.5453123); }
float noise(float x) {
  float i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(hash(i), hash(i + 1.0), f);
}

vec3 palette(float x) {
  x = clamp(x, 0.0, 1.0) * 3.0;
  vec3 c = mix(uC0, uC1, smoothstep(0.0, 1.0, x));
  c = mix(c, uC2, smoothstep(1.0, 2.0, x));
  return mix(c, uC3, smoothstep(2.0, 3.0, x));
}

vec4 ribbon(vec2 p, float t, float seed, float width, float hue) {
  float u = p.x;

  // Centre line: a few slow sines, so the band breathes rather than wobbles
  float centre = 0.11 * sin(u * 1.25 + t * 0.55 + seed)
               + 0.05 * sin(u * 2.6 - t * 0.42 + seed * 2.0)
               + 0.025 * sin(u * 4.3 + t * 0.7 + seed * 3.0);

  // Twist: |cos| narrows the band as it turns edge-on
  float twist = cos(u * 0.85 - t * 0.3 + seed);
  float hw = width * (0.22 + 0.78 * abs(twist));
  float s = (p.y - centre) / hw;               // -1..1 across the band
  if (abs(s) > 1.25) return vec4(0.0);

  // Strands: fixed to the material (s), so they bend and narrow with the band
  float across = s * 0.5 + 0.5;
  float N = 150.0;
  float id = floor(across * N);
  float within = fract(across * N);
  float r = hash(id + seed * 37.0);

  // Frayed edges: every strand stops at its own distance, wavering along the length
  float edge = 1.0 - 0.2 * r - 0.07 * noise(u * 5.0 + id * 0.41 + t * 0.6);
  float a = 1.0 - smoothstep(edge - 0.05, edge, abs(s));
  a *= mix(0.55, 1.0, r) * (0.72 + 0.28 * noise(u * (2.5 + r * 7.0) + id * 1.9 - t * 0.45));

  // Colour runs across the band and drifts along it; the back face is reversed,
  // blended through the edge-on moment so the flip never shows as a seam
  float x = mix(1.0 - across, across, smoothstep(-0.35, 0.35, twist));
  x = clamp(x * 0.85 + 0.075 + 0.14 * sin(u * 0.7 + t * 0.18 + hue), 0.0, 1.0);
  vec3 col = palette(x);

  col *= 0.9 + 0.1 * smoothstep(0.0, 0.5, within) * smoothstep(1.0, 0.5, within); // fine strand lines
  col *= 0.72 + 0.28 * abs(twist);                                              // darker edge-on
  col += 0.14 * pow(1.0 - abs(s), 3.0) * abs(twist);                            // soft sheen along the middle
  return vec4(col * a, a);
}

void main() {
  float unit = min(uRes.x, uRes.y);
  vec2 p = (gl_FragCoord.xy - uAnchor * uRes) / unit;
  float c = cos(uAngle), s = sin(uAngle);
  p = vec2(c * p.x + s * p.y, -s * p.x + c * p.y);   // into ribbon space
  float t = uTime * 0.32;

  vec4 back = ribbon(p + vec2(0.35, 0.06), t, 3.7, uWidth * 0.75, 1.6);
  vec4 front = ribbon(p, t, 0.0, uWidth, 0.0);
  vec4 col = front + back * (1.0 - front.a);

  float g = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  col.rgb += (g - 0.5) / 255.0 * col.a;
  gl_FragColor = col;
}
`
