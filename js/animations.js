// GSAP-powered motion for the OrganicReachSEO site: ScrollTrigger reveals/parallax
// and Draggable interactions (marquee + before/after slider).
// GSAP, ScrollTrigger and Draggable are loaded via <script> tags in each page's <head>.

// Most animations only need GSAP + ScrollTrigger. Don't gate them on Draggable.
function whenScrollReady(fn) {
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    fn();
  } else {
    var tries = 0;
    var iv = setInterval(function() {
      tries++;
      if (window.gsap && window.ScrollTrigger) {
        clearInterval(iv);
        gsap.registerPlugin(ScrollTrigger);
        fn();
      } else if (tries > 200) clearInterval(iv);
    }, 25);
  }
}

// Only marquee + before/after slider need Draggable.
function whenDraggableReady(fn) {
  if (window.gsap && window.ScrollTrigger && window.Draggable) {
    gsap.registerPlugin(ScrollTrigger, Draggable);
    fn();
  } else {
    var tries = 0;
    var iv = setInterval(function() {
      tries++;
      if (window.gsap && window.ScrollTrigger && window.Draggable) {
        clearInterval(iv);
        gsap.registerPlugin(ScrollTrigger, Draggable);
        fn();
      } else if (tries > 200) clearInterval(iv);
    }, 25);
  }
}


function initReveal() {
  whenScrollReady(function() {
    var groups = document.querySelectorAll('[data-reveal-group]');
    groups.forEach(function(group) {
      var items = group.querySelectorAll('[data-reveal]');
      if (!items.length) return;
      items.forEach(function(el) {
        gsap.set(el, { opacity: 0, y: 32, scale: 0.97 });
      });
      ScrollTrigger.batch(items, {
        start: 'top 92%',
        once: true,
        onEnter: function(batch) {
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            ease: 'power3.out',
            stagger: 0.12,
            overwrite: true,
            onComplete: function() {
              batch.forEach(function(el) { el.classList.add('is-visible'); });
            }
          });
        },
      });
    });

    // Standalone data-reveal elements not part of a group
    document.querySelectorAll('[data-reveal]:not([data-reveal-group] [data-reveal])').forEach(function(el) {
      gsap.set(el, { opacity: 0, y: 32, scale: 0.97 });
      ScrollTrigger.create({
        trigger: el,
        start: 'top 92%',
        once: true,
        onEnter: function() {
          gsap.to(el, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            ease: 'power3.out',
            overwrite: true,
            onComplete: function() { el.classList.add('is-visible'); }
          });
        },
      });
    });

    ScrollTrigger.refresh();
  });
}

function initCounters() {
  whenScrollReady(function() {
    document.querySelectorAll('[data-count-to]').forEach(function(el) {
      var raw = el.getAttribute('data-count-to');
      var target = parseFloat(raw);
      var decimals = raw.includes('.') ? raw.split('.')[1].length : 0;
      var suffix = el.getAttribute('data-count-suffix') || '';
      var obj = { val: 0 };
      ScrollTrigger.create({
        trigger: el,
        start: 'top 92%',
        once: true,
        onEnter: function() {
          gsap.to(obj, {
            val: target,
            duration: 1.5,
            ease: 'power2.out',
            onUpdate: function() { el.textContent = obj.val.toFixed(decimals) + suffix; },
          });
        },
      });
    });
  });
}

function initMagnetic() {
  whenScrollReady(function() {
    document.querySelectorAll('[data-magnetic]').forEach(function(btn) {
      // Disable on touch devices
      if (window.matchMedia('(pointer: coarse)').matches) return;

      var strength = 16;
      var xTo = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3.out' });
      var yTo = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3.out' });
      btn.addEventListener('mousemove', function(e) {
        var r = btn.getBoundingClientRect();
        xTo(((e.clientX - r.left - r.width / 2) / (r.width / 2)) * strength);
        yTo(((e.clientY - r.top - r.height / 2) / (r.height / 2)) * strength);
      });
      btn.addEventListener('mouseleave', function() {
        gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
      });
    });
  });
}

// Draggable, infinite-loop marquee: auto-scrolls, user can grab and fling it.
function initDraggableMarquee() {
  whenDraggableReady(function() {
    document.querySelectorAll('[data-marquee]').forEach(function(track) {
      var halfWidth = track.scrollWidth / 2;
      gsap.set(track, { x: 0 });
      var loop = gsap.to(track, {
        x: -halfWidth,
        duration: 26,
        ease: 'none',
        repeat: -1,
        modifiers: { x: function(x) { return (parseFloat(x) % halfWidth) + 'px'; } },
      });

      Draggable.create(track, {
        type: 'x',
        inertia: false,
        onPressInit: function() { loop.pause(); track.style.cursor = 'grabbing'; },
        onDrag: function() {
          gsap.set(track, { x: ((this.x % halfWidth) + halfWidth) % -halfWidth || this.x % halfWidth });
        },
        onRelease: function() { track.style.cursor = 'grab'; loop.play(); },
      });
      track.style.cursor = 'grab';
    });
  });
}

// Draggable before/after comparison slider
function initBeforeAfterSlider() {
  whenDraggableReady(function() {
    document.querySelectorAll('[data-baf]').forEach(function(container) {
      var after = container.querySelector('[data-baf-after]');
      var handle = container.querySelector('[data-baf-handle]');
      if (!after || !handle) return;

      var setPct = function(pct) {
        pct = Math.max(0, Math.min(100, pct));
        var w = container.getBoundingClientRect().width;
        after.style.clipPath = 'inset(0 ' + (100 - pct) + '% 0 0)';
        gsap.set(handle, { xPercent: -50, x: (pct / 100) * w });
      };
      setPct(50);

      Draggable.create(handle, {
        type: 'x',
        bounds: container,
        onDrag: function() {
          var rect = container.getBoundingClientRect();
          var pct = ((this.pointerX - rect.left) / rect.width) * 100;
          setPct(pct);
        },
      });

      container.addEventListener('click', function(e) {
        if (e.target === handle || handle.contains(e.target)) return;
        var rect = container.getBoundingClientRect();
        setPct(((e.clientX - rect.left) / rect.width) * 100);
      });

      window.addEventListener('resize', function() {
        var w = container.getBoundingClientRect().width;
        var currentPct = (gsap.getProperty(handle, 'x') / w) * 100;
        setPct(currentPct);
      });
    });
  });
}

function initScrollCascade() {
  whenScrollReady(function() {
    document.querySelectorAll('[data-cascade]').forEach(function(row) {
      var items = row.querySelectorAll('[data-cascade-item]');
      if (!items.length) return;
      items.forEach(function(item) {
        gsap.set(item, { opacity: 0, y: 35 });
      });
      ScrollTrigger.create({
        trigger: row,
        start: 'top 88%',
        once: true,
        onEnter: function() {
          gsap.to(items, {
            opacity: 1,
            y: 0,
            duration: 0.85,
            ease: 'power3.out',
            stagger: 0.14,
            overwrite: true,
          });
        },
      });
    });
  });
}

function initCursor() {
  if (!window.matchMedia('(pointer: fine) and (hover: hover)').matches) return;
  var dot = document.querySelector('[data-cursor-dot]');
  var ring = document.querySelector('[data-cursor-ring]');
  if (!dot || !ring) return;

  document.documentElement.style.cursor = 'none';
  var styleTag = document.createElement('style');
  styleTag.textContent = '@media (pointer: fine) and (hover: hover) { * { cursor: none !important; } }';
  document.head.appendChild(styleTag);

  whenScrollReady(function() {
    gsap.set([dot, ring], { opacity: 0 });
    var started = false;
    var dotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' });
    var dotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });
    var ringX = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' });
    var ringY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });

    window.addEventListener('mousemove', function(e) {
      if (!started) {
        started = true;
        gsap.set([dot, ring], { x: e.clientX, y: e.clientY });
        gsap.to([dot, ring], { opacity: 1, duration: 0.25 });
      }
      dotX(e.clientX); dotY(e.clientY);
      ringX(e.clientX); ringY(e.clientY);
    });

    var grow = function() { gsap.to(ring, { scale: 2.2, opacity: 0.5, duration: 0.35, ease: 'power3.out' }); };
    var shrink = function() { gsap.to(ring, { scale: 1, opacity: 1, duration: 0.35, ease: 'power3.out' }); };
    document.addEventListener('mouseover', function(e) {
      if (e.target.closest('a, button, [data-magnetic], [data-baf-handle], [data-marquee]')) grow();
    });
    document.addEventListener('mouseout', function(e) {
      if (e.target.closest('a, button, [data-magnetic], [data-baf-handle], [data-marquee]')) shrink();
    });
  });
}

// Scrub-reveals a headline word by word as it scrolls into view.
function initWordReveal() {
  whenScrollReady(function() {
    document.querySelectorAll('[data-word-reveal]').forEach(function(el) {
      if (el.getAttribute('data-word-done')) return;
      el.setAttribute('data-word-done', '1');
      var words = el.textContent.trim().split(/\s+/);
      el.textContent = '';
      words.forEach(function(w) {
        var s = document.createElement('span');
        s.textContent = w + '\u00A0';
        s.style.display = 'inline-block';
        s.style.opacity = '0.14';
        el.appendChild(s);
      });
      gsap.to(el.children, {
        opacity: 1,
        stagger: 0.04,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 60%', scrub: 0.3 },
      });
    });
  });
}

// Gentle vertical parallax for oversized media inside clipped bands.
function initParallax() {
  whenScrollReady(function() {
    document.querySelectorAll('[data-parallax]').forEach(function(el) {
      var speed = parseFloat(el.getAttribute('data-parallax')) || 10;
      gsap.fromTo(
        el,
        { yPercent: -speed },
        {
          yPercent: speed,
          ease: 'none',
          scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: 0.5 },
        }
      );
    });
  });
}

// Floating preview card that follows the cursor over [data-preview] rows.
function initHoverPreview() {
  whenScrollReady(function() {
    var rows = document.querySelectorAll('[data-preview]');
    if (!rows.length || document.querySelector('[data-preview-float]')) return;
    var el = document.createElement('div');
    el.setAttribute('data-preview-float', '1');
    el.style.cssText =
      'position:fixed;top:0;left:0;width:220px;height:150px;pointer-events:none;z-index:600;' +
      'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;' +
      'background:#6C3CE0;color:#F3EFE7;opacity:0;transform:translate(-50%,-50%) scale(0.8);';
    el.innerHTML =
      '<span data-preview-glyph style="font-family:\'Instrument Serif\',serif;font-size:84px;line-height:0.7;margin-top:24px;">*</span>' +
      '<span data-preview-label style="font-size:11px;font-weight:700;letter-spacing:0.2em;font-family:inherit;"></span>';
    document.body.appendChild(el);
    var xTo = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3.out' });
    var yTo = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3.out' });
    var label = el.querySelector('[data-preview-label]');
    document.addEventListener('mousemove', function(e) { xTo(e.clientX); yTo(e.clientY); });
    rows.forEach(function(row) {
      row.addEventListener('mouseenter', function() {
        label.textContent = row.getAttribute('data-preview') || '';
        el.style.background = row.getAttribute('data-preview-bg') || '#6C3CE0';
        gsap.to(el, { opacity: 1, scale: 1, rotate: -4, duration: 0.3, ease: 'power3.out' });
      });
      row.addEventListener('mouseleave', function() {
        gsap.to(el, { opacity: 0, scale: 0.8, rotate: 0, duration: 0.25, ease: 'power3.in' });
      });
    });
  });
}

// Water-trail: canvas ripple that looks like dragging a finger through water.
// Each trail point renders as a shaded "dent" (dark edge below, light catch above)
// in tones of the page background, with a slight liquid wobble as it dissipates.
function initRipple() {
  whenScrollReady(function() {
    document.querySelectorAll('[data-ripple]').forEach(function(zone) {
      if (zone.getAttribute('data-ripple-done')) return;
      zone.setAttribute('data-ripple-done', '1');
      var canvas = document.createElement('canvas');
      canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;';
      zone.appendChild(canvas);
      var ctx = canvas.getContext('2d');
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = zone.clientWidth * dpr;
        canvas.height = zone.clientHeight * dpr;
      }
      resize();
      window.addEventListener('resize', resize);

      var points = [];
      var lastX = null, lastY = null, raf = null;

      zone.addEventListener('mousemove', function(e) {
        var rect = zone.getBoundingClientRect();
        var x = e.clientX - rect.left, y = e.clientY - rect.top;
        if (lastX !== null) {
          // interpolate so fast swipes leave a continuous stroke of water
          var d = Math.hypot(x - lastX, y - lastY);
          var steps = Math.max(1, Math.floor(d / 26));
          for (var s = 1; s <= steps; s++) {
            points.push({
              x: lastX + ((x - lastX) * s) / steps,
              y: lastY + ((y - lastY) * s) / steps,
              age: 0,
              seed: Math.random() * Math.PI * 2,
            });
          }
        }
        lastX = x; lastY = y;
        if (!raf) raf = requestAnimationFrame(tick);
      });

      zone.addEventListener('mouseleave', function() { lastX = lastY = null; });

      function tick() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.scale(dpr, dpr);
        for (var i = points.length - 1; i >= 0; i--) {
          var p = points[i];
          p.age += 0.016;
          var life = p.age / 1.5;           // 1.5s lifetime
          if (life >= 1) { points.splice(i, 1); continue; }
          var fade = (1 - life) * (1 - life); // ease-out fade
          var wobble = 1 + Math.sin(p.age * 7 + p.seed) * 0.05; // liquid shimmer
          var r = (10 + life * 52) * wobble;  // spreads as it settles

          // crisp ripple front: thin dark ring at the leading edge
          ctx.strokeStyle = 'rgba(23,17,28,' + 0.16 * fade + ')';
          ctx.lineWidth = 1.4 + (1 - life) * 1.2;
          ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.stroke();

          // light catch just inside the front — sharp water refraction edge
          ctx.strokeStyle = 'rgba(255,252,244,' + 0.55 * fade + ')';
          ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.arc(p.x, p.y - 1.2, r - 2, 0, Math.PI * 2); ctx.stroke();

          // faint interior dish so the ring reads as displaced water, not a line
          var g = ctx.createRadialGradient(p.x, p.y, r * 0.3, p.x, p.y, r);
          g.addColorStop(0, 'rgba(23,17,28,0)');
          g.addColorStop(0.85, 'rgba(23,17,28,' + 0.028 * fade + ')');
          g.addColorStop(1, 'rgba(23,17,28,0)');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
        raf = points.length ? requestAnimationFrame(tick) : null;
        if (!raf) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });
  });
}

function initAll() {
  initReveal();
  initCounters();
  initMagnetic();
  initDraggableMarquee();
  initBeforeAfterSlider();
  initScrollCascade();
  initWordReveal();
  initParallax();
  initRipple();
  initHoverPreview();
  initCursor();
}
