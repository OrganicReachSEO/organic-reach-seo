// Animations are loaded globally via script tag

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize all GSAP animations
  initAll();

  // 1b. Initialize WebGL liquid hero effect
  if (typeof initLiquidHero === 'function') {
    initLiquidHero();
  }

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
