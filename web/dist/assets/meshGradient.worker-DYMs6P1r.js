(function(){let e=e=>{let t=parseInt(e.replace(`#`,``),16);return[(t>>16&255)/255,(t>>8&255)/255,(t&255)/255]};function t(e,t,n){let r=e.createShader(t);return e.shaderSource(r,n),e.compileShader(r),e.getShaderParameter(r,e.COMPILE_STATUS)?r:(console.warn(`[meshGradient]`,e.getShaderInfoLog(r)),e.deleteShader(r),null)}let n=e=>typeof requestAnimationFrame==`function`?requestAnimationFrame(e):setTimeout(()=>e(performance.now()),16),r=e=>typeof cancelAnimationFrame==`function`?cancelAnimationFrame(e):clearTimeout(e);function i(i,{shader:a=`mesh`,colors:o,resolution:s=.5,speed:c=1,zoom:l=1,ribbon:u={}}){let d=a===`ribbon`,f=i.getContext(`webgl`,{antialias:!1,alpha:d,premultipliedAlpha:!0,depth:!1,powerPreference:`low-power`});if(!f)return null;let p=t(f,f.VERTEX_SHADER,`
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`),m=t(f,f.FRAGMENT_SHADER,d?`
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
`:`
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
`);if(!p||!m)return null;let h=f.createProgram();if(f.attachShader(h,p),f.attachShader(h,m),f.linkProgram(h),!f.getProgramParameter(h,f.LINK_STATUS))return null;f.useProgram(h);let g=f.createBuffer();f.bindBuffer(f.ARRAY_BUFFER,g),f.bufferData(f.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),f.STATIC_DRAW);let _=f.getAttribLocation(h,`aPos`);f.enableVertexAttribArray(_),f.vertexAttribPointer(_,2,f.FLOAT,!1,0,0);let v=f.getUniformLocation(h,`uRes`),y=f.getUniformLocation(h,`uTime`);f.uniform1f(f.getUniformLocation(h,`uZoom`),l),f.uniform2fv(f.getUniformLocation(h,`uAnchor`),u.anchor??[.7,.6]),f.uniform1f(f.getUniformLocation(h,`uAngle`),u.angle??-1),f.uniform1f(f.getUniformLocation(h,`uWidth`),u.width??.2);let b=[`uC0`,`uC1`,`uC2`,`uC3`].map(e=>f.getUniformLocation(h,e)),x=t=>t.forEach((t,n)=>f.uniform3fv(b[n],e(t)));x(o);let S=0,C=!1,w=0,T=Math.random()*6e4,E=()=>{f.uniform2f(v,i.width,i.height),f.uniform1f(y,T/1e3),f.drawArrays(f.TRIANGLE_STRIP,0,4)},D=(e,t)=>{let n=Math.max(1,Math.round(e*s)),r=Math.max(1,Math.round(t*s));(i.width!==n||i.height!==r)&&(i.width=n,i.height=r,f.viewport(0,0,n,r))},O=e=>{T+=Math.min(e-w,50)*c,w=e,E(),S=n(O)};return{draw:E,resize:D,setColors:x,start(){C||(C=!0,w=performance.now(),S=n(O))},stop(){C=!1,r(S)},destroy(){this.stop(),f.deleteBuffer(g),f.deleteProgram(h),f.deleteShader(p),f.deleteShader(m)}}}let a=null;self.onmessage=({data:e})=>{if(e.type===`init`){a=i(e.canvas,e.options),a||self.postMessage(`failed`);return}a&&(e.type===`resize`?a.resize(e.width,e.height):e.type===`colors`?a.setColors(e.colors):e.type===`draw`?a.draw():e.type===`start`?a.start():e.type===`stop`&&a.stop())}})();