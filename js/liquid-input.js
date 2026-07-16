// Pointer tracking with momentum for the liquid hero.
// Smooths raw pointer movement into an eased position + velocity so the
// fluid receives inertia (the splash keeps travelling after the cursor stops),
// and emits gentle ambient splats when the pointer is idle or absent.
function createPointerInput(el) {
  var state = {
    x: 0.5, y: 0.5,          // eased position (0..1, y up)
    tx: 0.5, ty: 0.5,        // raw target
    vx: 0, vy: 0,            // eased velocity (uv/sec)
    active: false,
    lastMove: 0,
    raw: null,
  };

  function toUv(e) {
    var r = el.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: 1 - (e.clientY - r.top) / r.height };
  }

  el.addEventListener('pointermove', function(e) {
    var p = toUv(e);
    if (!state.active) { state.x = p.x; state.y = p.y; state.raw = p; }
    state.tx = p.x; state.ty = p.y;
    state.active = true;
    state.lastMove = performance.now();
  }, { passive: true });

  el.addEventListener('pointerleave', function() { state.active = false; });

  el.addEventListener('pointerdown', function(e) {
    var p = toUv(e);
    state.burst = { x: p.x, y: p.y };   // press = a stronger plunge
  }, { passive: true });

  var nextAmbient = performance.now() + 1500;

  // Called once per frame. Returns splats: {x, y, dx, dy, radius} in uv space.
  function update(dt) {
    var splats = [];
    var now = performance.now();

    // momentum easing: position chases target, velocity is the smoothed delta
    var k = Math.min(1, dt * 9);
    var nx = state.x + (state.tx - state.x) * k;
    var ny = state.y + (state.ty - state.y) * k;
    var fvx = (nx - state.x) / Math.max(dt, 1e-4);
    var fvy = (ny - state.y) / Math.max(dt, 1e-4);
    state.vx += (fvx - state.vx) * Math.min(1, dt * 7);
    state.vy += (fvy - state.vy) * Math.min(1, dt * 7);
    state.x = nx; state.y = ny;

    var speed = Math.hypot(state.vx, state.vy);
    // splat while moving OR while inertia is still carrying the wake
    if ((state.active || now - state.lastMove < 700) && speed > 0.01) {
      splats.push({
        x: state.x, y: state.y,
        dx: state.vx, dy: state.vy,
        radius: 0.0016 + Math.min(speed, 2.5) * 0.0009,
      });
    }

    if (state.burst) {
      splats.push({ x: state.burst.x, y: state.burst.y, dx: 0, dy: 0, radius: 0.006, plunge: 1.6 });
      state.burst = null;
    }

    // ambient life when idle (and the default on touch devices)
    if (now > nextAmbient && now - state.lastMove > 2600) {
      splats.push({
        x: 0.18 + Math.random() * 0.64,
        y: 0.25 + Math.random() * 0.5,
        dx: (Math.random() - 0.5) * 0.35,
        dy: (Math.random() - 0.5) * 0.25,
        radius: 0.003,
        plunge: 0.5,
      });
      nextAmbient = now + 2800 + Math.random() * 2600;
    }

    return splats;
  }

  // normalized cursor offset from center, for camera drift / parallax
  function offset() {
    return { x: state.x - 0.5, y: state.y - 0.5 };
  }

  return { update: update, offset: offset };
}
