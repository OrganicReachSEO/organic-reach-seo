// REPUTATION-DASHBOARD.JS — loops the hero review-monitor graphic
// through scanning -> flagged -> removed, then resets. Pure class
// toggle; all visual states are CSS transitions in reputation.css.
document.addEventListener('DOMContentLoaded', function () {
  var card = document.querySelector('.dash-card');
  if (!card) return;

  var phases = ['', 'is-flagged', 'is-removed'];
  var i = 0;

  setInterval(function () {
    i = (i + 1) % phases.length;
    card.classList.remove('is-flagged', 'is-removed');
    if (phases[i]) card.classList.add(phases[i]);
  }, 1700);
});
