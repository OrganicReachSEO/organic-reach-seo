// SCALE-PROOF.JS — animates the "31 locations" stat card:
// count-up, staggered dot entrance, pulsing accent dots, looping light sweep.
document.addEventListener('DOMContentLoaded', function () {
  var card = document.querySelector('.scale-card');
  if (!card || !window.gsap) return;

  var numberEl = card.querySelector('.scale-number');
  var dots = Array.prototype.slice.call(card.querySelectorAll('.scale-dot'));
  var sweep = card.querySelector('.scale-sweep');

  function play() {
    var counter = { val: 0 };
    gsap.to(counter, {
      val: 31,
      duration: 1.3,
      ease: 'power2.out',
      onUpdate: function () { numberEl.textContent = Math.round(counter.val); }
    });

    gsap.to(dots, {
      scale: 1,
      duration: 0.5,
      ease: 'back.out(2)',
      stagger: { each: 0.025, from: 'start' },
      onComplete: function () {
        dots.forEach(function (d) {
          if (d.classList.contains('is-accent')) {
            gsap.to(d, {
              boxShadow: '0 0 0 6px rgba(108,60,224,0.18)',
              duration: 1.1,
              repeat: -1,
              yoyo: true,
              ease: 'sine.inOut',
              delay: Math.random() * 0.6
            });
          }
        });
      }
    });

    if (sweep) {
      gsap.to(sweep, {
        left: '140%',
        duration: 3.2,
        ease: 'power1.inOut',
        repeat: -1,
        repeatDelay: 1.6,
        delay: 1.4
      });
    }
  }

  if (window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.create({ trigger: card, start: 'top 85%', once: true, onEnter: play });
  } else {
    play();
  }
});
