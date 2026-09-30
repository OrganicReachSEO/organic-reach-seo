document.addEventListener('click', function (e) {
  var a = e.target.closest && e.target.closest('a');
  if (!a || typeof gtag !== 'function') return;
  var href = a.getAttribute('href') || '';
  if (href.indexOf('mailto:') === 0) {
    gtag('event', 'contact_click', { method: 'email' });
  } else if (href.indexOf('tel:') === 0) {
    gtag('event', 'contact_click', { method: 'phone' });
  } else if (/\/contact\/?$/.test(a.pathname || '')) {
    gtag('event', 'cta_click', {
      cta_text: (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80),
      cta_destination: href
    });
  }
});
