// GLSL sources for the liquid hero. GLSL ES 1.0 — runs on WebGL1 + WebGL2.
var LiquidShaders = {};

LiquidShaders.VERT = `
precision highp float;
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

// Semi-Lagrangian advection (carries velocity/height along the flow).
LiquidShaders.ADVECT = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 uTexel;
uniform float uDt;
uniform float uDissipation;
void main() {
  vec2 coord = vUv - uDt * texture2D(uVelocity, vUv).xy * uTexel;
  gl_FragColor = uDissipation * texture2D(uSource, coord);
}`;

// Gaussian impulse from the cursor into velocity or height field.
LiquidShaders.SPLAT = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTarget;
uniform float uAspect;
uniform vec3 uColor;
uniform vec2 uPoint;
uniform float uRadius;
void main() {
  vec2 p = vUv - uPoint;
  p.x *= uAspect;
  vec3 splat = exp(-dot(p, p) / uRadius) * uColor;
  vec3 base = texture2D(uTarget, vUv).xyz;
  gl_FragColor = vec4(base + splat, 1.0);
}`;

LiquidShaders.DIVERGENCE = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uVelocity;
uniform vec2 uTexel;
void main() {
  float l = texture2D(uVelocity, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture2D(uVelocity, vUv + vec2(uTexel.x, 0.0)).x;
  float b = texture2D(uVelocity, vUv - vec2(0.0, uTexel.y)).y;
  float t = texture2D(uVelocity, vUv + vec2(0.0, uTexel.y)).y;
  gl_FragColor = vec4(0.5 * (r - l + t - b), 0.0, 0.0, 1.0);
}`;

// Jacobi iteration for the pressure field (incompressibility).
LiquidShaders.PRESSURE = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
uniform vec2 uTexel;
void main() {
  float l = texture2D(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture2D(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
  float b = texture2D(uPressure, vUv - vec2(0.0, uTexel.y)).x;
  float t = texture2D(uPressure, vUv + vec2(0.0, uTexel.y)).x;
  float div = texture2D(uDivergence, vUv).x;
  gl_FragColor = vec4((l + r + b + t - div) * 0.25, 0.0, 0.0, 1.0);
}`;

LiquidShaders.GRADIENT_SUBTRACT = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
uniform vec2 uTexel;
void main() {
  float l = texture2D(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture2D(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
  float b = texture2D(uPressure, vUv - vec2(0.0, uTexel.y)).x;
  float t = texture2D(uPressure, vUv + vec2(0.0, uTexel.y)).x;
  vec2 vel = texture2D(uVelocity, vUv).xy - vec2(r - l, t - b);
  gl_FragColor = vec4(vel, 0.0, 1.0);
}`;

// Multiply a field by a scalar (pressure damping between frames).
LiquidShaders.CLEAR = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTexture;
uniform float uValue;
void main() {
  gl_FragColor = uValue * texture2D(uTexture, vUv);
}`;

// Final pass: refract a procedural paper background through the liquid
// height field. Tone-on-tone (#F3EFE7 paper / #17111C ink shading) with
// chromatic refraction at the edges, specular catch, camera drift + breathing.
LiquidShaders.DISPLAY = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uDye;
uniform vec2 uTexel;
uniform float uTime;
uniform vec2 uDrift;
uniform float uBreath;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

vec3 background(vec2 uv) {
  vec3 paper = vec3(0.9529, 0.9373, 0.9059);
  vec3 deep  = vec3(0.9020, 0.8784, 0.8314);
  float v = smoothstep(0.10, 0.95, distance(uv, vec2(0.5, 0.38)));
  vec3 col = mix(paper, deep, v * 0.5);
  col += (hash(floor(uv * 900.0)) - 0.5) * 0.013;
  return col;
}

void main() {
  vec2 uv = (vUv - 0.5) / uBreath + 0.5 + uDrift;
  float h  = texture2D(uDye, vUv).r;
  float hx = texture2D(uDye, vUv + vec2(uTexel.x, 0.0)).r
           - texture2D(uDye, vUv - vec2(uTexel.x, 0.0)).r;
  float hy = texture2D(uDye, vUv + vec2(0.0, uTexel.y)).r
           - texture2D(uDye, vUv - vec2(0.0, uTexel.y)).r;
  vec2 n = vec2(hx, hy);
  vec2 refr = n * 0.30;

  vec3 col;
  col.r = background(uv + refr * 1.07).r;
  col.g = background(uv + refr).g;
  col.b = background(uv + refr * 0.93).b;

  float shade = clamp(hy * 2.4, -1.0, 1.0);
  col *= 1.0 - max(0.0, -shade) * 0.11 - clamp(h, 0.0, 1.0) * 0.045;
  col += max(0.0, shade) * vec3(0.05, 0.046, 0.062);

  float spec = pow(clamp(length(n) * 5.5, 0.0, 1.0), 3.0);
  col += spec * 0.09;

  gl_FragColor = vec4(col, 1.0);
}`;
