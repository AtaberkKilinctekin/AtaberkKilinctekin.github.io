// Classic scripts, no modules: ES modules are blocked on file://, so the site would show static text.
initI18n();

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  initHero();
  initNetwork();
  initFx();
  // Fires after the deferred GSAP scripts have run, so a slow CDN never delays the language setup.
  document.addEventListener("DOMContentLoaded", initScroll);
}
