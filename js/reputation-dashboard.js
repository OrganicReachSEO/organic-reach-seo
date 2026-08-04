// REPUTATION-DASHBOARD.JS — loops the hero review-monitor graphic
// and animates timeline cards (Monthly Cycle & Free Trial) on scroll.

document.addEventListener('DOMContentLoaded', function () {
  // 1. Hero Review Monitor Loop
  var card = document.querySelector('.dash-card');
  if (card) {
    var phases = ['', 'is-flagged', 'is-removed'];
    var i = 0;

    setInterval(function () {
      i = (i + 1) % phases.length;
      card.classList.remove('is-flagged', 'is-removed');
      if (phases[i]) card.classList.add(phases[i]);
    }, 1700);
  }

  // 2. Timeline Card Scroll Animation (Process line grows down on scroll)
  initTimelineScroll();
});

function initTimelineScroll() {
  function setup() {
    if (!(window.gsap && window.ScrollTrigger)) {
      return setTimeout(setup, 30);
    }

    gsap.registerPlugin(ScrollTrigger);

    var cards = document.querySelectorAll('.timeline-card');
    cards.forEach(function (card) {
      var steps = card.querySelectorAll('.timeline-step');
      if (!steps.length) return;

      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
          end: 'bottom 45%',
          scrub: 0.5,
          invalidateOnRefresh: true,
        }
      });

      steps.forEach(function (step) {
        var dot = step.querySelector('.timeline-dot');
        var line = step.querySelector('.timeline-line');
        var body = step.querySelector('.timeline-body');

        // Animate dot pop-in
        if (dot) {
          tl.fromTo(dot, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.5)' });
        }

        // Animate text slide-in
        if (body) {
          tl.fromTo(body, { opacity: 0, x: 14 }, { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' }, '<0.1');
        }

        // Animate vertical process line extending downwards
        if (line) {
          gsap.set(line, { transformOrigin: 'top center' });
          tl.fromTo(line, { scaleY: 0 }, { scaleY: 1, duration: 0.6, ease: 'none' });
        }
      });

      var repeatText = card.querySelector('.timeline-repeat');
      if (repeatText) {
        tl.fromTo(repeatText, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3 });
      }
    });
  }

  setup();
}
