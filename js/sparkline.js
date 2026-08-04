// SPARKLINE.JS — draws the "Why It's Different" ascending growth line once
// on scroll-into-view, then loops continuously with a traveling dot.
document.addEventListener('DOMContentLoaded', function () {
  var svg = document.querySelector('.spark-svg');
  if (!svg || !window.gsap) return;

  var draw = svg.querySelector('.spark-draw');
  var dot = svg.querySelector('.spark-dot');
  var len = draw.getTotalLength();
  draw.style.strokeDasharray = len;
  draw.style.strokeDashoffset = len;

  function playOnce() {
    draw.style.strokeDashoffset = len;
    var state = { p: 0 };
    gsap.to(state, {
      p: 1,
      duration: 2.2,
      ease: 'power1.inOut',
      onUpdate: function () {
        draw.style.strokeDashoffset = len * (1 - state.p);
        var pt = draw.getPointAtLength(len * state.p);
        dot.setAttribute('cx', pt.x);
        dot.setAttribute('cy', pt.y);
      },
      onComplete: function () {
        gsap.to({}, { duration: 0.8, onComplete: playOnce });
      }
    });
  }

  if (window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.create({ trigger: svg, start: 'top 90%', once: true, onEnter: playOnce });
  } else {
    playOnce();
  }
});
