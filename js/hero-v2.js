// hero-v2.js — kinetic headline swap, SERP-climb scroll section, headline parallax.
// Load after animations.js. Self-initializes on DOMContentLoaded.

(function () {
  function boot() {
    if (!(window.gsap && window.ScrollTrigger)) return setTimeout(boot, 40);
    gsap.registerPlugin(ScrollTrigger);
    document.fonts.ready.then(function () {
      initHeroSwap();
      initSerpClimb();
      initHeadlineParallax();
      ScrollTrigger.refresh();
    });
  }

  // Strike-through + word swap on the last headline line
  function initHeroSwap() {
    var wrap = document.querySelector('[data-hero-swap]');
    var word = document.querySelector('[data-swap-word]');
    var strike = document.querySelector('[data-swap-strike]');
    if (!wrap || !word || !strike) return;
    var words = ['rankings report.', 'vanity metrics.', 'empty dashboards.'];
    var hold = 2400; // ms each word stays before swapping
    var i = 0;
    function measure(text) {
      var m = word.cloneNode(false);
      m.textContent = text;
      m.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;display:inline-block;';
      wrap.appendChild(m);
      var w = m.offsetWidth;
      wrap.removeChild(m);
      return w;
    }
    wrap.style.width = word.offsetWidth + 'px';
    function cycle() {
      var tl = gsap.timeline({ onComplete: function () { setTimeout(cycle, hold); } });
      tl.fromTo(strike, { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: 0.35, ease: 'power2.inOut' })
        .to(word, { yPercent: -120, duration: 0.4, ease: 'power2.in' }, '+=0.25')
        .to(strike, { opacity: 0, duration: 0.2 }, '<0.1')
        .add(function () {
          i = (i + 1) % words.length;
          word.textContent = words[i];
          gsap.set(strike, { scaleX: 0, opacity: 1 });
          gsap.to(wrap, { width: measure(words[i]), duration: 0.5, ease: 'power3.out' });
          gsap.fromTo(word, { yPercent: 120 }, { yPercent: 0, duration: 0.6, ease: 'power3.out' });
        });
    }
    setTimeout(cycle, hold);
  }

  // Pinned scroll section: "Your Business" climbs from #5 to #1
  function initSerpClimb() {
    var section = document.querySelector('[data-serp]');
    if (!section) return;
    var rows = section.querySelectorAll('[data-serp-row]');
    var mine = section.querySelector('[data-serp-mine]');
    var pos = section.querySelector('[data-serp-pos]');
    if (!mine || rows.length !== 4) return;
    var step = 74; // row height 64 + 10 gap
    var tl = gsap.timeline({
      scrollTrigger: { trigger: section, start: 'top top', end: '+=1400', scrub: 0.5, pin: true },
      onUpdate: function () {
        if (pos) pos.textContent = '#' + (5 - Math.round(tl.progress() * 4));
      }
    });
    tl.to(mine, { y: -4 * step, duration: 4, ease: 'none' }, 0);
    for (var j = 0; j < 4; j++) {
      tl.to(rows[j], { y: step, duration: 0.5, ease: 'power2.inOut' }, (3 - j) + 0.3);
    }
    tl.fromTo(mine, { boxShadow: '0 12px 30px rgba(108,60,224,0.35)' },
      { boxShadow: '0 18px 44px rgba(108,60,224,0.6)', duration: 0.4 }, 3.6);
  }

  // Subtle depth: headline lines leave at different speeds
  function initHeadlineParallax() {
    document.querySelectorAll('.home-hero .heading-line').forEach(function (line, i) {
      gsap.to(line, {
        yPercent: -(10 + i * 14),
        ease: 'none',
        scrollTrigger: { trigger: '.home-hero', start: 'top top', end: 'bottom top', scrub: 0.6 }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
