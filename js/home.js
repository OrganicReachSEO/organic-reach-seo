// home.js — Premium home page animation controller
// Self-contained: Lenis smooth scroll, preloader, hero intro, all scroll sections.
// Only loaded on index.html.

(function () {
  'use strict';

  var lenis = null;
  var cleanups = [];

  // ─── Boot ───────────────────────────────────────────────────
  function boot() {
    if (!(window.gsap && window.ScrollTrigger)) {
      return setTimeout(boot, 80);
    }
    gsap.registerPlugin(ScrollTrigger);
    initLenis();
    splitAllHeadings();
    buildStatementWords();
    initCursor();
    initMagnetic();
    initMobileMenu();
    runPreloader();
  }

  // ─── Lenis smooth scroll ───────────────────────────────────
  function initLenis() {
    if (!window.Lenis) return;
    lenis = new Lenis({
      duration: 1.15,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      wheelMultiplier: 0.95
    });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    var raf = function (time) { lenis.raf(time * 1000); };
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    cleanups.push(function () { gsap.ticker.remove(raf); });

    // Anchor click handler
    var root = document.querySelector('[data-home-root]');
    if (root) {
      var onClick = function (e) {
        var a = e.target.closest && e.target.closest('a[href^="#"]');
        if (!a) return;
        var id = a.getAttribute('href').slice(1);
        var target = id && document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -20, duration: 1.4 });
      };
      root.addEventListener('click', onClick);
      cleanups.push(function () { root.removeEventListener('click', onClick); });
    }
  }

  // ─── Split headings into masked word spans ──────────────────
  function splitAllHeadings() {
    var nodes = document.querySelectorAll('[data-split]');
    nodes.forEach(function (node) {
      if (node.dataset.splitDone) return;
      node.dataset.splitDone = '1';
      var out = [];
      var walk = function (parent, inheritStyle) {
        var children = parent.childNodes;
        for (var i = 0; i < children.length; i++) {
          var child = children[i];
          if (child.nodeType === 3) {
            child.textContent.split(/(\s+)/).forEach(function (tok) {
              if (!tok.trim()) { out.push({ space: true }); return; }
              out.push({ word: tok, style: inheritStyle });
            });
          } else if (child.nodeType === 1) {
            walk(child, child.getAttribute('style') || inheritStyle);
          }
        }
      };
      walk(node, '');
      node.innerHTML = '';
      var inners = [];
      out.forEach(function (tok) {
        if (tok.space) { node.appendChild(document.createTextNode(' ')); return; }
        var mask = document.createElement('span');
        mask.style.cssText = 'display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:0.06em;';
        var inner = document.createElement('span');
        inner.style.cssText = 'display:inline-block;will-change:transform;' + (tok.style || '');
        inner.textContent = tok.word;
        mask.appendChild(inner);
        node.appendChild(mask);
        inners.push(inner);
      });
      node._words = inners;
      gsap.set(inners, { yPercent: 110 });
    });
  }

  function revealSplit(node, delay) {
    if (!node || !node._words) return null;
    return gsap.to(node._words, {
      yPercent: 0, duration: 1.05, ease: 'expo.out', stagger: 0.035, delay: delay || 0
    });
  }

  // ─── Build statement words ──────────────────────────────────
  function buildStatementWords() {
    var p = document.querySelector('[data-statement]');
    if (!p) return;
    var text = "We build growth the honest way — rankings earned, reputations repaired, and websites that pull their weight. No shortcuts, no jargon, no lock-in contracts.";
    var words = text.split(' ');
    words.forEach(function (word) {
      var span = document.createElement('span');
      span.setAttribute('data-sw', '1');
      span.style.display = 'inline-block';
      span.textContent = word + ' ';
      p.appendChild(span);
    });
  }

  // ─── Preloader ──────────────────────────────────────────────
  function runPreloader() {
    var loader = document.querySelector('[data-preloader]');
    var num = document.querySelector('[data-preloader-num]');
    var word = document.querySelector('[data-preloader-word]');
    var bar = document.querySelector('[data-preloader-bar]');

    if (!loader || !num) {
      buildScroll();
      heroIntro();
      return;
    }

    if (lenis) lenis.stop();

    var counter = { v: 0 };
    var tl = gsap.timeline({
      onComplete: function () {
        if (lenis) lenis.start();
        buildScroll();
      }
    });

    tl.to(counter, {
      v: 100, duration: 1.5, ease: 'power2.inOut',
      onUpdate: function () {
        if (num) num.textContent = Math.round(counter.v);
        if (bar) bar.style.width = counter.v + '%';
      }
    })
    .to([num, word], { yPercent: -120, duration: 0.7, ease: 'expo.inOut', stagger: 0.05 }, '>-0.1')
    .to(loader, { yPercent: -100, duration: 1.05, ease: 'expo.inOut' }, '<0.25')
    .set(loader, { display: 'none' })
    .add(function () { heroIntro(); }, '<0.35');
  }

  // ─── Hero intro sequence ────────────────────────────────────
  function heroIntro() {
    var nav = document.querySelector('[data-home-nav]');
    var heroMeta = document.querySelector('[data-hero-meta]');
    var h1 = document.querySelector('.home-hero h1[data-split]');
    var heroFrame = document.querySelector('[data-hero-frame]');
    var seal = document.querySelector('[data-seal]');
    var heroCopy = document.querySelector('[data-hero-copy]');
    var heroStats = document.querySelector('[data-hero-stats]');
    var rail = document.querySelector('[data-scroll-rail]');

    var tl = gsap.timeline();

    if (nav) tl.from(nav, { yPercent: -140, opacity: 0, duration: 0.9, ease: 'expo.out' }, 0);
    if (heroMeta) tl.from(heroMeta, { opacity: 0, y: 18, duration: 0.8, ease: 'power3.out' }, 0.05);
    if (h1) tl.add(revealSplit(h1), 0.1);
    if (heroFrame) tl.from(heroFrame, { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.12, duration: 1.4, ease: 'expo.out' }, 0.25);
    if (seal) tl.from(seal, { scale: 0, rotate: -90, duration: 1, ease: 'back.out(1.5)' }, 0.9);
    if (heroCopy) tl.from(heroCopy, { opacity: 0, y: 26, duration: 0.9, ease: 'power3.out' }, 0.55);
    if (heroStats && heroStats.children.length) {
      tl.from(heroStats.children, { opacity: 0, y: 22, duration: 0.8, ease: 'power3.out', stagger: 0.08 }, 0.7);
    }
    if (rail) tl.to(rail, { opacity: 1, duration: 0.6 }, 0.9);

    heroChart(tl);
  }

  // ─── Hero chart draw ────────────────────────────────────────
  function heroChart(tl) {
    var path = document.querySelector('[data-chart-path]');
    var area = document.querySelector('[data-chart-area]');
    var dot = document.querySelector('[data-chart-dot]');
    var kwWrap = document.querySelector('[data-kw-wrap]');

    if (!path) return;

    var len = path.getTotalLength();
    gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
    gsap.set(area, { opacity: 0 });
    gsap.set(dot, { opacity: 0 });

    var box = function () { return path.ownerSVGElement.getBoundingClientRect(); };
    var draw = { p: 0 };

    tl.to(path, { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut' }, 0.55)
      .to(area, { opacity: 1, duration: 1.4, ease: 'power2.out' }, 0.8)
      .to(dot, { opacity: 1, duration: 0.3 }, 0.6)
      .to(draw, {
        p: 1, duration: 1.8, ease: 'power2.inOut',
        onUpdate: function () {
          var pt = path.getPointAtLength(len * draw.p);
          var r = box();
          gsap.set(dot, { x: (pt.x / 460) * r.width, y: (pt.y / 300) * r.height });
        }
      }, 0.55);

    if (kwWrap) {
      var rows = kwWrap.querySelectorAll('[data-kw]');
      tl.from(rows, { opacity: 0, x: 26, duration: 0.7, ease: 'power3.out', stagger: 0.12 }, 1.3);

      var chips = kwWrap.querySelectorAll('[data-kw-rank]');
      chips.forEach(function (chip, i) {
        var from = +chip.dataset.from;
        var to = +chip.dataset.to;
        var c = { v: from };
        tl.to(c, {
          v: to, duration: 1, ease: 'power2.inOut',
          onUpdate: function () { chip.textContent = '#' + Math.round(c.v); },
          onComplete: function () { chip.style.background = '#6C3CE0'; }
        }, 1.7 + i * 0.18);
      });
    }
  }

  // ─── All scroll-driven motion ───────────────────────────────
  function buildScroll() {
    var root = document.querySelector('[data-home-root]');
    if (!root) return;

    // Reveal all non-hero split headings on scroll
    root.querySelectorAll('[data-split]').forEach(function (node) {
      if (node.tagName === 'H1') return;
      ScrollTrigger.create({
        trigger: node, start: 'top 85%', once: true,
        onEnter: function () { revealSplit(node); }
      });
    });

    // Generic reveals
    root.querySelectorAll('[data-reveal]').forEach(function (node, i) {
      gsap.from(node, {
        opacity: 0, y: 40, duration: 0.9, ease: 'power3.out',
        delay: (i % 4) * 0.07,
        scrollTrigger: { trigger: node.parentElement, start: 'top 82%', once: true }
      });
    });

    marquee();
    serpClimb();
    statementReveal();
    servicesTrack();
    proof();
    footerDrift();
    navHide();
    railSync();
    ScrollTrigger.refresh();
  }

  // ─── Marquee ────────────────────────────────────────────────
  function marquee() {
    var track = document.querySelector('[data-marquee-track]');
    if (!track) return;
    var tw = gsap.to(track, { xPercent: -50, duration: 30, ease: 'none', repeat: -1 });
    if (lenis) {
      lenis.on('scroll', function (e) {
        var v = e.velocity || 0;
        tw.timeScale(Math.min(6, 1 + Math.abs(v) * 0.12));
        gsap.set(track, { skewX: Math.max(-7, Math.min(7, -v * 0.25)) });
      });
    }
  }

  // ─── SERP climb ─────────────────────────────────────────────
  function serpClimb() {
    var sec = document.querySelector('[data-serp-section]');
    var board = document.querySelector('[data-serp-board]');
    var mine = document.querySelector('[data-serp-mine]');
    var pos = document.querySelector('[data-serp-pos]');
    if (!sec || !board || !mine) return;

    var rows = Array.from(board.querySelectorAll('[data-serp-row]'));
    var H = 74;

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: sec, start: 'top top', end: '+=3000',
        pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true
      }
    });

    tl.to({}, { duration: 0.3 });

    for (var step = 1; step <= 4; step++) {
      var label = 's' + step;
      tl.addLabel(label);
      tl.to(mine, { y: -H * step, duration: 0.6, ease: 'power2.inOut' }, label);
      tl.to(rows[4 - step], { y: H, duration: 0.6, ease: 'power2.inOut' }, label);
      if (pos) tl.set(pos, { innerText: '#' + (5 - step) }, label + '+=0.3');
      tl.to({}, { duration: 0.3 });
    }

    tl.addLabel('win');
    tl.to(mine, { scale: 1.04, boxShadow: '0 24px 70px rgba(108,60,224,0.6)', duration: 0.5, ease: 'power2.out' }, 'win');
    tl.to(rows, { opacity: 0.35, duration: 0.5, ease: 'power2.out' }, 'win');
    if (pos) tl.to(pos, { color: '#CDB9F6', duration: 0.5 }, 'win');
    tl.to({}, { duration: 1.2 });
  }

  // ─── Statement word reveal ──────────────────────────────────
  function statementReveal() {
    var p = document.querySelector('[data-statement]');
    if (!p) return;
    var words = p.querySelectorAll('[data-sw]');
    if (!words.length) return;
    gsap.set(words, { opacity: 0.13 });
    gsap.to(words, {
      opacity: 1, stagger: 0.05, ease: 'none',
      scrollTrigger: {
        trigger: p, start: 'top 82%',
        end: function () { return '+=' + Math.round(window.innerHeight * 0.95); },
        scrub: 0.6, invalidateOnRefresh: true
      }
    });
  }

  // ─── Horizontal services scroll ─────────────────────────────
  function servicesTrack() {
    var sec = document.querySelector('[data-svc-section]');
    var track = document.querySelector('[data-svc-track]');
    if (!sec || !track) return;

    var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth + 44); };

    gsap.to(track, {
      x: function () { return -dist(); },
      ease: 'none',
      scrollTrigger: {
        trigger: sec, start: 'top top',
        end: function () { return '+=' + dist() * 1.15; },
        pin: true, scrub: 0.9, invalidateOnRefresh: true, anticipatePin: 1
      }
    });

    ScrollTrigger.create({
      trigger: sec, start: 'top 70%', once: true,
      onEnter: function () {
        gsap.fromTo(track.children,
          { opacity: 0, y: 60 },
          { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.09 }
        );
      }
    });
  }

  // ─── Proof section ──────────────────────────────────────────
  function proof() {
    // Parallax on background number
    var parallaxEl = document.querySelector('[data-parallax-el]');
    if (parallaxEl) {
      gsap.fromTo(parallaxEl, { yPercent: -8 }, {
        yPercent: 8, ease: 'none',
        scrollTrigger: { trigger: parallaxEl.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    }

    // Bar chart animation
    var chart = document.querySelector('[data-proof-chart]');
    if (chart) {
      var bars = chart.querySelectorAll('[data-bar]');
      var vals = chart.querySelectorAll('[data-bar-val]');
      ScrollTrigger.create({
        trigger: chart, start: 'top 80%', once: true,
        onEnter: function () {
          gsap.to(bars, { scaleY: 1, duration: 1.1, ease: 'expo.out', stagger: 0.09 });
          gsap.to(vals, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.09, delay: 0.25 });
        }
      });
    }

    // Counter
    var num = document.querySelector('[data-proof-num]');
    if (!num) return;
    var c = { v: 0 };
    gsap.to(c, {
      v: 312, duration: 2, ease: 'power2.out',
      scrollTrigger: { trigger: num, start: 'top 88%', once: true },
      onUpdate: function () { num.textContent = '+' + Math.round(c.v) + '%'; }
    });
  }

  // ─── Footer drift ──────────────────────────────────────────
  function footerDrift() {
    var w = document.querySelector('[data-foot-word]');
    if (!w) return;
    gsap.fromTo(w, { xPercent: 6 }, {
      xPercent: -6, ease: 'none',
      scrollTrigger: { trigger: w, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  }

  // ─── Nav auto-hide ──────────────────────────────────────────
  function navHide() {
    var nav = document.querySelector('[data-home-nav]');
    if (!nav) return;
    var last = 0;
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: function (self) {
        var y = self.scroll();
        if (y < 120) {
          gsap.to(nav, { yPercent: 0, duration: 0.4, overwrite: true });
        } else if (y > last + 6) {
          gsap.to(nav, { yPercent: -180, duration: 0.5, ease: 'power3.out', overwrite: true });
        } else if (y < last - 6) {
          gsap.to(nav, { yPercent: 0, duration: 0.5, ease: 'power3.out', overwrite: true });
        }
        last = y;
      }
    });
  }

  // ─── Scroll rail sync ──────────────────────────────────────
  function railSync() {
    var rail = document.querySelector('[data-scroll-rail]');
    if (!rail) return;
    var dots = Array.from(rail.querySelectorAll('a'));
    var secs = Array.from(document.querySelectorAll('[data-sec]'));

    secs.forEach(function (sec, i) {
      var setActive = function () {
        dots.forEach(function (d, j) {
          var on = j === i;
          var label = d.querySelector('.scroll-rail-label');
          var mark = d.querySelector('.scroll-rail-mark');
          if (label) gsap.to(label, { opacity: on ? 1 : 0.35, duration: 0.3 });
          if (mark) gsap.to(mark, {
            opacity: on ? 1 : 0.25,
            width: on ? 34 : 18,
            backgroundColor: on ? '#6C3CE0' : '#17111C',
            duration: 0.35
          });
        });
      };
      ScrollTrigger.create({
        trigger: sec, start: 'top 50%', end: 'bottom 50%',
        onEnter: setActive, onEnterBack: setActive
      });
    });
  }

  // ─── Custom cursor ──────────────────────────────────────────
  function initCursor() {
    if (!window.matchMedia || !window.matchMedia('(pointer: fine)').matches) return;
    var c = document.querySelector('[data-home-cursor]');
    if (!c) return;

    var xTo = gsap.quickTo(c, 'x', { duration: 0.35, ease: 'power3.out' });
    var yTo = gsap.quickTo(c, 'y', { duration: 0.35, ease: 'power3.out' });

    var move = function (e) {
      xTo(e.clientX); yTo(e.clientY);
      gsap.to(c, { opacity: 1, duration: 0.3, overwrite: 'auto' });
    };
    var over = function (e) {
      var t = e.target.closest && e.target.closest('a, button');
      gsap.to(c, {
        scale: t ? 2.1 : 1,
        backgroundColor: t ? 'rgba(108,60,224,0.22)' : 'rgba(0,0,0,0)',
        duration: 0.35, ease: 'power3.out'
      });
    };

    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerover', over, { passive: true });
    cleanups.push(function () {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerover', over);
    });
  }

  // ─── Magnetic buttons ───────────────────────────────────────
  function initMagnetic() {
    if (!window.matchMedia || !window.matchMedia('(pointer: fine)').matches) return;
    var root = document.querySelector('[data-home-root]');
    if (!root) return;

    root.querySelectorAll('[data-magnetic]').forEach(function (btn) {
      var xTo = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'power3.out' });
      var yTo = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'power3.out' });
      var move = function (e) {
        var r = btn.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.32);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.42);
      };
      var leave = function () { xTo(0); yTo(0); };
      btn.addEventListener('pointermove', move);
      btn.addEventListener('pointerleave', leave);
      cleanups.push(function () {
        btn.removeEventListener('pointermove', move);
        btn.removeEventListener('pointerleave', leave);
      });
    });
  }

  // ─── Mobile menu ────────────────────────────────────────────
  function initMobileMenu() {
    var hamburger = document.querySelector('.nav-hamburger');
    var mobileMenu = document.querySelector('.nav-mobile-overlay');
    if (!hamburger || !mobileMenu) return;

    hamburger.addEventListener('click', function () {
      var isOpen = hamburger.classList.contains('is-open');
      if (isOpen) {
        hamburger.classList.remove('is-open');
        mobileMenu.classList.remove('is-open');
        document.body.style.overflow = '';
      } else {
        hamburger.classList.add('is-open');
        mobileMenu.classList.add('is-open');
        document.body.style.overflow = 'hidden';
      }
    });

    mobileMenu.querySelectorAll('.nav-link').forEach(function (link) {
      link.addEventListener('click', function () {
        hamburger.classList.remove('is-open');
        mobileMenu.classList.remove('is-open');
        document.body.style.overflow = '';
      });
    });
  }

  // ─── Cleanup on unload ──────────────────────────────────────
  window.addEventListener('beforeunload', function () {
    cleanups.forEach(function (fn) { try { fn(); } catch (e) {} });
    if (ScrollTrigger) ScrollTrigger.getAll().forEach(function (t) { t.kill(); });
    if (lenis) { try { lenis.destroy(); } catch (e) {} }
  });

  // ─── Init ───────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
