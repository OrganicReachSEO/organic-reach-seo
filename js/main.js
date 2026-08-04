// Animations are loaded globally via script tag

document.addEventListener('DOMContentLoaded', () => {
  // 1b. Initialize WebGL liquid hero effect (doesn't depend on scroll positions)
  if (typeof initLiquidHero === 'function') {
    initLiquidHero();
  }

  // 1. Initialize all GSAP scroll animations AFTER fonts are ready.
  //    hero-v2.js registers its fonts.ready callback first (loaded earlier
  //    in the HTML) so the SERP pin section is created before this runs.
  //    Without this deferral, triggers calculate positions before the pin's
  //    ~1400px virtual height exists, fire immediately, and self-destruct
  //    via once:true — making sections appear static/already loaded.
  document.fonts.ready.then(function () {
    // One rAF to let hero-v2's fonts.ready callback (SERP pin) execute first
    requestAnimationFrame(function () {
      initAll();

      // Refresh after a frame to ensure all pin spacers are measured
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
  const hamburger = document.querySelector('.nav-hamburger');
  const mobileMenu = document.querySelector('.nav-mobile-overlay');
  
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.contains('is-open');
      
      if (isOpen) {
        hamburger.classList.remove('is-open');
        mobileMenu.classList.remove('is-open');
        document.body.style.overflow = '';
      } else {
        hamburger.classList.add('is-open');
        mobileMenu.classList.add('is-open');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
      }
    });

    // Close menu when clicking a link
    const mobileLinks = mobileMenu.querySelectorAll('.nav-link');
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('is-open');
        mobileMenu.classList.remove('is-open');
        document.body.style.overflow = '';
      });
    });
  }

  // 3. Contact Form handling
  const contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      // In a real app, send data to backend here.
      // For now, show success message.
      const successMsg = contactForm.querySelector('.form-success');
      if (successMsg) {
        successMsg.classList.add('is-visible');
        contactForm.reset();
      }
    });
  }
});
