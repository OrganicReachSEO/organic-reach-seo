// Animations are loaded globally via script tag
// On the home page (index.html), home.js handles all animations.
// On other pages, this file drives the animation system.

document.addEventListener('DOMContentLoaded', function () {
  // Skip on home page — home.js has its own controller
  if (document.querySelector('[data-home-root]')) return;

  // 1b. Initialize WebGL liquid hero effect (doesn't depend on scroll positions)
  if (typeof initLiquidHero === 'function') {
    initLiquidHero();
  }

  // 1. Initialize all GSAP scroll animations AFTER fonts are ready.
  document.fonts.ready.then(function () {
    requestAnimationFrame(function () {
      if (typeof initAll === 'function') initAll();

      requestAnimationFrame(function () {
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      });
    });
  });

  // Safety net: refresh again after all resources have loaded
  window.addEventListener('load', function () {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      });
    });
  });

  // 2. Mobile hamburger menu toggle
  var hamburger = document.querySelector('.nav-hamburger');
  var mobileMenu = document.querySelector('.nav-mobile-overlay');

  if (hamburger && mobileMenu) {
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

    var mobileLinks = mobileMenu.querySelectorAll('.nav-link');
    mobileLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        hamburger.classList.remove('is-open');
        mobileMenu.classList.remove('is-open');
        document.body.style.overflow = '';
      });
    });
  }

  // 3. Contact Form handling
  var contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var successMsg = contactForm.querySelector('.form-success');
      if (successMsg) {
        successMsg.classList.add('is-visible');
        contactForm.reset();
      }
    });
  }
});
