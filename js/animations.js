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

  // ── Typewriter ───────────────────────────────────────────

  function typeText(el, text, charDelay, onComplete) {
    var i = 0;
    function tick() {
      if (i < text.length) {
        el.textContent = text.slice(0, ++i);
        setTimeout(tick, charDelay);
      } else if (onComplete) {
        onComplete();
      }
    }
    tick();
  }

  // ── Intro animation ──────────────────────────────────────

  function runIntro() {
    var isAbout = document.body.classList.contains('page-about');

    if (isAbout) {
      document.querySelector('.name-subtitle').classList.add('typing-cursor');
      gsap.set('.nav-link', { opacity: 0, scale: 0.9 });
      gsap.to('.nav-link', { opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out', delay: 0.1, clearProps: 'opacity,scale' });
      return;
    }

    gsap.set('.nav-link',     { opacity: 0, scale: 0.9 });
    gsap.set('.sidebar-bio',  { opacity: 0, y: 12, scale: 0.9, filter: 'blur(10px)' });
    gsap.set('.sidebar-link', { opacity: 0, y: 8,  scale: 0.9, filter: 'blur(8px)'  });

    var primary  = document.querySelector('.name-primary');
    var subtitle = document.querySelector('.name-subtitle');
    var primaryText  = primary.textContent.trim();
    var subtitleText = subtitle.textContent.trim();
    primary.style.minHeight  = primary.offsetHeight  + 'px';
    subtitle.style.minHeight = subtitle.offsetHeight + 'px';
    primary.textContent  = '';
    subtitle.textContent = '';
    primary.classList.add('typing-cursor');

    typeText(primary, primaryText, 38, function () {
      primary.classList.remove('typing-cursor');
      subtitle.classList.add('typing-cursor');

      var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.to('.nav-link',     { opacity: 1, scale: 1, duration: 0.5, clearProps: 'opacity,scale' },                                           0)
        .to('.sidebar-bio',  { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.65, clearProps: 'filter,scale' },                0.1)
        .to('.sidebar-link', { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.45, stagger: 0.06, clearProps: 'filter,scale' }, 0.2);

      typeText(subtitle, subtitleText, 30);
    });
  }

  // ── Scroll animations ────────────────────────────────────

  function setupScrollAnimations() {
    var framing = document.querySelector('.framing-text');
    if (framing) {
      gsap.from(framing, {
        scrollTrigger: { trigger: framing, start: 'top 87%', once: true },
        opacity: 0, y: 28, scale: 0.9, filter: 'blur(10px)',
        duration: 0.7, ease: 'power2.out',
        clearProps: 'filter,scale'
      });
    }

    gsap.utils.toArray('.cv-section, .about-section, .brands-section').forEach(function (el) {
      var heading = el.querySelector('.section-heading, h2');
      var body    = el.querySelector('.job-list, .skills-grid, .education-row, .about-body, .brands-list');
      var st      = { trigger: el, start: 'top 87%', once: true };

      if (heading) {
        gsap.from(heading, {
          scrollTrigger: st,
          opacity: 0, y: 10, scale: 0.9, filter: 'blur(6px)',
          duration: 0.55, ease: 'power2.out',
          clearProps: 'filter,scale'
        });
      }
      if (body) {
        gsap.from(body, {
          scrollTrigger: st,
          opacity: 0, y: 28, scale: 0.9, filter: 'blur(10px)',
          duration: 0.7, ease: 'power2.out', delay: 0.1,
          clearProps: 'filter,scale'
        });
      }
    });

    var inViewIndex = 0;
    gsap.utils.toArray('.job').forEach(function (job) {
      var inView = job.getBoundingClientRect().top < window.innerHeight * 0.9;
      var delay  = inView ? inViewIndex++ * 0.25 : 0;
      gsap.from(job, {
        scrollTrigger: { trigger: job, start: 'top 90%', once: true },
        opacity: 0, y: 28, scale: 0.9, filter: 'blur(10px)',
        duration: 0.65, ease: 'power2.out',
        delay: delay,
        clearProps: 'filter,scale'
      });
    });

    var footer = document.querySelector('.site-footer');
    if (footer) {
      gsap.from(footer, {
        scrollTrigger: { trigger: footer, start: 'top 92%', once: true },
        opacity: 0, y: 16, scale: 0.9, filter: 'blur(8px)',
        duration: 0.6, ease: 'power2.out',
        clearProps: 'filter,scale'
      });
    }
  }
}());
