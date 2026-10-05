/**
 * Flowing WebGL mesh gradient, in the spirit of Stripe's hero.
 *
 * A single full-screen quad: the fragment shader domain-warps simplex noise
 * and layers four colours as soft diagonal bands that drift over time.
 * It renders at reduced resolution (the gradient is smooth, so upscaling
 * is free), and the caller decides when to start/stop it.
 */

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uZoom;
uniform vec3 uC0, uC1, uC2, uC3;

// 3D simplex noise (Ashima Arts / Stefan Gustavson, MIT)
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}

vec2 rot(vec2 v, float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c)*v; }

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = rot((uv - 0.5) * vec2(uRes.x / uRes.y, 1.0) * uZoom, -0.32);
  float t = uTime * 0.045;

  // Domain warp: the "liquid" in the motion
  vec2 w = vec2(snoise(vec3(p * 0.7, t)), snoise(vec3(p * 0.7 + 7.3, t)));
  vec2 q = p + w * 0.42;

  vec3 col = uC0;
  col = mix(col, uC1, smoothstep(-0.25, 0.55, snoise(vec3(q.x * 0.9, q.y * 2.4 - t * 1.3, t * 0.8))));
  col = mix(col, uC2, smoothstep(-0.05, 0.65, snoise(vec3(q.x * 1.2 + 3.0, q.y * 2.9 + t * 1.0, t * 0.7 + 11.0))));
  col = mix(col, uC3, 0.85 * smoothstep(0.15, 0.8, snoise(vec3(q.x * 1.6 - 2.0, q.y * 2.0 - t * 0.8, t * 0.6 + 23.0))));

  // 1-bit dither kills banding in the soft ramps
  float g = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  col += (g - 0.5) / 255.0;

  gl_FragColor = vec4(col, 1.0);
}
`

const hexToRgb = (hex) => {
  const n = parseInt(hex.replace('#', ''), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

function compile(gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn('[meshGradient]', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ colors: [string, string, string, string], resolution?: number, speed?: number, zoom?: number }} options
 *        zoom < 1 widens the bands (useful for short, wide banners)
 * @returns controller, or null when WebGL is unavailable
 */
export function createMeshGradient(canvas, { colors, resolution = 0.5, speed = 1, zoom = 1 }) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, powerPreference: 'low-power' })
  if (!gl) return null

  const vs = compile(gl, gl.VERTEX_SHADER, VERT)
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
  if (!vs || !fs) return null

  const program = gl.createProgram()
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null
  gl.useProgram(program)

  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const aPos = gl.getAttribLocation(program, 'aPos')
  gl.enableVertexAttribArray(aPos)
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

  const uRes = gl.getUniformLocation(program, 'uRes')
  const uTime = gl.getUniformLocation(program, 'uTime')
  gl.uniform1f(gl.getUniformLocation(program, 'uZoom'), zoom)
  ;['uC0', 'uC1', 'uC2', 'uC3'].forEach((name, i) => {
    gl.uniform3fv(gl.getUniformLocation(program, name), hexToRgb(colors[i]))
  })

  let raf = 0
  let running = false
  let last = 0
  let elapsed = Math.random() * 60_000 // start mid-flow, not at a seam

  const draw = () => {
    gl.uniform2f(uRes, canvas.width, canvas.height)
    gl.uniform1f(uTime, elapsed / 1000)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  const resize = () => {
    const w = Math.max(1, Math.round(canvas.clientWidth * resolution))
    const h = Math.max(1, Math.round(canvas.clientHeight * resolution))
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
      gl.viewport(0, 0, w, h)
    }
  }

  const frame = (now) => {
    elapsed += Math.min(now - last, 50) * speed // clamp so a stalled tab doesn't lurch
    last = now
    draw()
    raf = requestAnimationFrame(frame)
  }

  return {
    draw,
    resize,
    start() {
      if (running) return
      running = true
      last = performance.now()
      raf = requestAnimationFrame(frame)
    },
    stop() {
      running = false
      cancelAnimationFrame(raf)
    },
    destroy() {
      this.stop()
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
    },
  }
}
