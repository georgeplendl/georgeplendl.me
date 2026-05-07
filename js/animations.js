(function () {
  gsap.registerPlugin(ScrollTrigger);

  var html = document.documentElement;

  var fontsReady = typeof document.fonts !== 'undefined'
    ? Promise.race([
        document.fonts.ready,
        new Promise(function (r) { setTimeout(r, 1000); })
      ])
    : Promise.resolve();

  fontsReady.then(init).catch(init);

  function init() {
    html.style.transition = 'none';
    html.style.opacity = '1';

    runIntro();
    setupScrollAnimations();
  }

  // ── Intro animation ──────────────────────────────────────────
  // Use set() + to() so GSAP has explicit from/to values and doesn't
  // accidentally read a stale computed opacity from the hidden html element.

  function runIntro() {
    gsap.set('.name-primary',  { opacity: 0, y: 14 });
    gsap.set('.name-subtitle', { opacity: 0, y: 14 });
    gsap.set('.nav-link',      { opacity: 0 });
    gsap.set('.sidebar-bio',   { opacity: 0, y: 12 });
    gsap.set('.sidebar-link',  { opacity: 0, y: 8 });

    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.to('.name-primary',  { opacity: 1, y: 0, duration: 0.7 },                         0)
      .to('.name-subtitle', { opacity: 1, y: 0, duration: 0.7 },                         0.07)
      .to('.nav-link',      { opacity: 1,        duration: 0.5, clearProps: 'opacity' },  0.14)
      .to('.sidebar-bio',   { opacity: 1, y: 0,  duration: 0.65 },                       0.22)
      .to('.sidebar-link',  { opacity: 1, y: 0,  duration: 0.45, stagger: 0.06 },        0.32);
  }

  // ── Scroll animations ────────────────────────────────────────

  function setupScrollAnimations() {
    gsap.utils.toArray('.cv-section, .about-section, .brands-section').forEach(function (el) {
      var heading = el.querySelector('.section-heading, h2');
      var body    = el.querySelector('.job-list, .skills-grid, .education-row, .about-body, .brands-list');
      var st      = { trigger: el, start: 'top 87%', once: true };

      if (heading) {
        gsap.from(heading, { scrollTrigger: st, opacity: 0, y: 10, duration: 0.55, ease: 'power2.out' });
      }
      if (body) {
        gsap.from(body, { scrollTrigger: st, opacity: 0, y: 22, duration: 0.7, ease: 'power2.out', delay: 0.1 });
      }
    });

    gsap.utils.toArray('.job').forEach(function (job, i) {
      gsap.from(job, {
        scrollTrigger: { trigger: job, start: 'top 90%', once: true },
        opacity: 0, y: 14, duration: 0.55, ease: 'power2.out',
        delay: (i % 3) * 0.04
      });
    });

    var footer = document.querySelector('.site-footer');
    if (footer) {
      gsap.from(footer, {
        scrollTrigger: { trigger: footer, start: 'top 92%', once: true },
        opacity: 0, y: 16, duration: 0.6, ease: 'power2.out'
      });
    }
  }
}());
