// Liquid hero engine — pure WebGL (no Three.js), GPU fluid simulation.
// Stable-fluids solver (advection → splat → pressure projection) driving a
// glass-refraction display pass. Half-res sim textures, ~60fps.
// Attaches to every [data-liquid-hero] element (canvas at z-index 0;
// keep content wrapped at z-index 1+).
// Requires: liquid-shaders.js and liquid-input.js loaded before this file.

var SIM_RES = 144;      // velocity/pressure grid
var DYE_RES = 448;      // height-field resolution (what you see)
var PRESSURE_ITERS = 18;
var VEL_DISSIPATION = 0.985;  // inertia: how long the flow keeps moving
var DYE_DISSIPATION = 0.972;  // viscosity feel: how fast ripples settle
var SPLAT_FORCE = 4.2;

function _liqCompile(gl, type, src) {
  var s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(s));
  }
  return s;
}

function _liqProgram(gl, fragSrc) {
  var p = gl.createProgram();
  gl.attachShader(p, _liqCompile(gl, gl.VERTEX_SHADER, LiquidShaders.VERT));
  gl.attachShader(p, _liqCompile(gl, gl.FRAGMENT_SHADER, fragSrc));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(p));
  }
  var uniforms = {};
  var n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (var i = 0; i < n; i++) {
    var name = gl.getActiveUniform(p, i).name;
    uniforms[name] = gl.getUniformLocation(p, name);
  }
  return { p: p, u: uniforms };
}

function _liqGetContext(canvas) {
  var attrs = { alpha: false, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };
  var gl = canvas.getContext('webgl2', attrs);
  if (gl) {
    var ext = gl.getExtension('EXT_color_buffer_float');
    gl.getExtension('OES_texture_float_linear');
    if (ext) return { gl: gl, internal: gl.RGBA16F, format: gl.RGBA, type: gl.HALF_FLOAT, webgl2: true };
  }
  gl = canvas.getContext('webgl', attrs);
  if (!gl) return null;
  var half = gl.getExtension('OES_texture_half_float');
  var halfLinear = gl.getExtension('OES_texture_half_float_linear');
  if (!half || !halfLinear) return null;
  return { gl: gl, internal: gl.RGBA, format: gl.RGBA, type: half.HALF_FLOAT_OES, webgl2: false };
}

function _liqCreateFBO(ctx, w, h) {
  var gl = ctx.gl;
  var tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, ctx.internal, w, h, 0, ctx.format, ctx.type, null);
  var fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  var ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
  return ok ? { tex: tex, fbo: fbo, w: w, h: h, texel: [1 / w, 1 / h] } : null;
}

function _liqCreateDoubleFBO(ctx, w, h) {
  var a = _liqCreateFBO(ctx, w, h);
  var b = _liqCreateFBO(ctx, w, h);
  if (!a || !b) return null;
  return {
    read: a, write: b, texel: a.texel, w: w, h: h,
    swap: function() { var t = this.read; this.read = this.write; this.write = t; },
  };
}

function initLiquidHero() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('[data-liquid-hero]').forEach(function(zone) {
    if (zone.getAttribute('data-liquid-done')) return;
    zone.setAttribute('data-liquid-done', '1');
    try { _liqAttach(zone); } catch (e) { /* graceful: hero keeps its CSS background */ }
  });
}

function _liqAttach(zone) {
  var canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;';
  zone.insertBefore(canvas, zone.firstChild);
  var ctx = _liqGetContext(canvas);
  if (!ctx) { canvas.remove(); return; }
  var gl = ctx.gl;

  // fullscreen quad
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  var progs = {
    advect: _liqProgram(gl, LiquidShaders.ADVECT),
    splat: _liqProgram(gl, LiquidShaders.SPLAT),
    divergence: _liqProgram(gl, LiquidShaders.DIVERGENCE),
    pressure: _liqProgram(gl, LiquidShaders.PRESSURE),
    gradient: _liqProgram(gl, LiquidShaders.GRADIENT_SUBTRACT),
    clear: _liqProgram(gl, LiquidShaders.CLEAR),
    display: _liqProgram(gl, LiquidShaders.DISPLAY),
  };

  function bindQuad(prog) {
    gl.useProgram(prog.p);
    var loc = gl.getAttribLocation(prog.p, 'aPos');
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  }

  function blit(target) {
    if (target) {
      gl.viewport(0, 0, target.w, target.h);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    } else {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  var velocity, pressure, divergence, dye, aspect = 1;

  function allocate() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(2, Math.floor(zone.clientWidth * dpr));
    canvas.height = Math.max(2, Math.floor(zone.clientHeight * dpr));
    aspect = canvas.width / canvas.height;
    var simW = Math.round(SIM_RES * Math.max(1, aspect));
    var simH = SIM_RES;
    var dyeW = Math.round(DYE_RES * Math.max(1, aspect));
    var dyeH = DYE_RES;
    velocity = _liqCreateDoubleFBO(ctx, simW, simH);
    pressure = _liqCreateDoubleFBO(ctx, simW, simH);
    divergence = _liqCreateFBO(ctx, simW, simH);
    dye = _liqCreateDoubleFBO(ctx, dyeW, dyeH);
    if (!velocity || !pressure || !divergence || !dye) throw new Error('fbo alloc failed');
  }
  allocate();
  var resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(allocate, 150);
  });

  var input = createPointerInput(zone);

  function bindTex(unit, tex) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    return unit;
  }

  function splatFn(target, x, y, r, g_, b, radius) {
    var pr = progs.splat;
    bindQuad(pr);
    gl.uniform1i(pr.u.uTarget, bindTex(0, target.read.tex));
    gl.uniform1f(pr.u.uAspect, aspect);
    gl.uniform2f(pr.u.uPoint, x, y);
    gl.uniform3f(pr.u.uColor, r, g_, b);
    gl.uniform1f(pr.u.uRadius, radius);
    blit(target.write);
    target.swap();
  }

  function step(dt, time) {
    // 1) cursor / ambient impulses
    var splats = input.update(dt);
    for (var si = 0; si < splats.length; si++) {
      var s = splats[si];
      var force = s.plunge || 1;
      splatFn(velocity, s.x, s.y, s.dx * SPLAT_FORCE * 60, s.dy * SPLAT_FORCE * 60, 0, s.radius);
      var amount = Math.min(Math.hypot(s.dx, s.dy) * 0.55 + (s.plunge ? 0.5 : 0), 1.2) * force;
      splatFn(dye, s.x, s.y, amount, 0, 0, s.radius * 1.4);
    }

    // 2) advect velocity through itself
    var pr = progs.advect;
    bindQuad(pr);
    gl.uniform2fv(pr.u.uTexel, velocity.texel);
    gl.uniform1i(pr.u.uVelocity, bindTex(0, velocity.read.tex));
    gl.uniform1i(pr.u.uSource, bindTex(1, velocity.read.tex));
    gl.uniform1f(pr.u.uDt, dt);
    gl.uniform1f(pr.u.uDissipation, VEL_DISSIPATION);
    blit(velocity.write);
    velocity.swap();

    // 3) pressure projection (incompressibility → realistic swirls)
    pr = progs.divergence;
    bindQuad(pr);
    gl.uniform2fv(pr.u.uTexel, velocity.texel);
    gl.uniform1i(pr.u.uVelocity, bindTex(0, velocity.read.tex));
    blit(divergence);

    pr = progs.clear;
    bindQuad(pr);
    gl.uniform1i(pr.u.uTexture, bindTex(0, pressure.read.tex));
    gl.uniform1f(pr.u.uValue, 0.8);
    blit(pressure.write);
    pressure.swap();

    pr = progs.pressure;
    bindQuad(pr);
    gl.uniform2fv(pr.u.uTexel, velocity.texel);
    gl.uniform1i(pr.u.uDivergence, bindTex(1, divergence.tex));
    for (var i = 0; i < PRESSURE_ITERS; i++) {
      gl.uniform1i(pr.u.uPressure, bindTex(0, pressure.read.tex));
      blit(pressure.write);
      pressure.swap();
    }

    pr = progs.gradient;
    bindQuad(pr);
    gl.uniform2fv(pr.u.uTexel, velocity.texel);
    gl.uniform1i(pr.u.uPressure, bindTex(0, pressure.read.tex));
    gl.uniform1i(pr.u.uVelocity, bindTex(1, velocity.read.tex));
    blit(velocity.write);
    velocity.swap();

    // 4) advect the height field along the flow
    pr = progs.advect;
    bindQuad(pr);
    gl.uniform2fv(pr.u.uTexel, velocity.texel);
    gl.uniform1i(pr.u.uVelocity, bindTex(0, velocity.read.tex));
    gl.uniform1i(pr.u.uSource, bindTex(1, dye.read.tex));
    gl.uniform1f(pr.u.uDt, dt);
    gl.uniform1f(pr.u.uDissipation, DYE_DISSIPATION);
    blit(dye.write);
    dye.swap();

    // 5) display: refraction + drift + breathing
    var off = input.offset();
    pr = progs.display;
    bindQuad(pr);
    gl.uniform1i(pr.u.uDye, bindTex(0, dye.read.tex));
    gl.uniform2fv(pr.u.uTexel, dye.texel);
    gl.uniform1f(pr.u.uTime, time);
    gl.uniform2f(
      pr.u.uDrift,
      Math.sin(time * 0.11) * 0.006 - off.x * 0.012,
      Math.cos(time * 0.09) * 0.005 + off.y * 0.012
    );
    gl.uniform1f(pr.u.uBreath, 1.0 + Math.sin(time * 0.3) * 0.012);
    blit(null);
  }

  // run only while visible; pause offscreen and on hidden tabs
  var running = false, last = 0, rafId = null;
  function loop(now) {
    var dt = Math.min(Math.max((now - last) / 1000, 0.001), 0.033);
    last = now;
    step(dt, now / 1000);
    rafId = running ? requestAnimationFrame(loop) : null;
  }
  var io = new IntersectionObserver(function(entries) {
    var entry = entries[0];
    var want = entry.isIntersecting && !document.hidden;
    if (want && !running) { running = true; last = performance.now(); rafId = requestAnimationFrame(loop); }
    if (!want) { running = false; if (rafId) cancelAnimationFrame(rafId); rafId = null; }
  });
  io.observe(zone);
  document.addEventListener('visibilitychange', function() {
    if (document.hidden && running) { running = false; if (rafId) cancelAnimationFrame(rafId); rafId = null; }
    else if (!document.hidden && !running) { running = true; last = performance.now(); rafId = requestAnimationFrame(loop); }
  });
}
