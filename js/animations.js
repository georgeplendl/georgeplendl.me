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
      gsap.set('.name-block',                        { opacity: 0, y: 8,  scale: 0.97 });
      gsap.set('.nav-link',                          { opacity: 0, scale: 0.9 });
      gsap.set('.sidebar-bio',                       { opacity: 0, y: 12, scale: 0.9, filter: 'blur(10px)' });
      gsap.set('.sidebar-link',                      { opacity: 0, y: 8,  scale: 0.9, filter: 'blur(8px)'  });
      gsap.set('.about-section .section-heading',    { opacity: 0, y: 10, scale: 0.9, filter: 'blur(6px)'  });
      gsap.set('.about-section .about-body',         { opacity: 0, y: 12, scale: 0.9, filter: 'blur(10px)' });
      gsap.set('.about-section',                     { borderTopColor: 'transparent' });

      var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.to('.name-block',                        { opacity: 1, y: 0, scale: 1, duration: 0.5, clearProps: 'transform' },                                              0)
        .to('.nav-link',                          { opacity: 1, scale: 1, duration: 0.5, clearProps: 'opacity,scale' },                                                0)
        .to('.sidebar-bio',                       { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.65, clearProps: 'filter,scale' },                     0.35)
        .to('.about-section',                     { borderTopColor: 'var(--divider)', duration: 0.55, ease: 'power2.out' },                                            0.35)
        .to('.about-section .section-heading',    { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.55, clearProps: 'filter,scale' },                     0.35)
        .to('.about-section .about-body',         { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.65, clearProps: 'filter,scale' },                     0.45)
        .to('.sidebar-link',                      { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.45, stagger: 0.06, clearProps: 'filter,scale' },      0.45);
      return;
    }

    gsap.set('.nav-link',      { opacity: 0, scale: 0.9 });
    gsap.set('.sidebar-bio',   { opacity: 0, y: 12, scale: 0.9, filter: 'blur(10px)' });
    gsap.set('.sidebar-link',  { opacity: 0, y: 8,  scale: 0.9, filter: 'blur(8px)'  });
    gsap.set('.framing-text',  { opacity: 0, y: 12, scale: 0.9, filter: 'blur(10px)' });

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
      tl.to('.nav-link',     { opacity: 1, scale: 1, duration: 0.5, clearProps: 'opacity,scale' },                                              0)
        .to('.sidebar-bio',  { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.65, clearProps: 'filter,scale' },                  0.1)
        .to('.sidebar-link', { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.45, stagger: 0.06, clearProps: 'filter,scale' },   0.2)
        .to('.framing-text', { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.65, clearProps: 'filter,scale' },                    0.1);

      typeText(subtitle, subtitleText, 30);
    });
  }

  // ── Scroll animations ────────────────────────────────────

  function setupScrollAnimations() {
    var isAbout = document.body.classList.contains('page-about');

    gsap.utils.toArray('.cv-section, .about-section, .brands-section').forEach(function (el) {
      if (isAbout && el.classList.contains('about-section')) return;
      var inView  = el.getBoundingClientRect().top < window.innerHeight;
      var delay   = inView ? 1.1 : 0;
      var heading = el.querySelector('.section-heading, h2');
      var bodies  = el.querySelectorAll('.skills-grid, .education-row, .about-body, .brands-list, .impact-body');
      var st      = { trigger: el, start: 'top 97%', once: true };

      if (el.classList.contains('cv-section')) {
        gsap.from(el, {
          scrollTrigger: st,
          borderTopColor: 'transparent',
          duration: 0.55, ease: 'power2.out',
          delay: delay
        });
      }

      if (heading) {
        gsap.from(heading, {
          scrollTrigger: st,
          opacity: 0, y: 10, scale: 0.9, filter: 'blur(6px)',
          duration: 0.55, ease: 'power2.out',
          delay: delay,
          clearProps: 'filter,scale'
        });
      }
      bodies.forEach(function (body) {
        var bodyInView = body.getBoundingClientRect().top < window.innerHeight;
        var bodyDelay  = bodyInView ? 1.1 : 0;
        gsap.from(body, {
          scrollTrigger: { trigger: body, start: 'top 97%', once: true },
          opacity: 0, y: 28, scale: 0.9, filter: 'blur(10px)',
          duration: 0.7, ease: 'power2.out',
          delay: bodyDelay + 0.1,
          clearProps: 'filter,scale'
        });
      });
    });

    var inViewIndex = 0;
    gsap.utils.toArray('.job').forEach(function (job) {
      var inView = job.getBoundingClientRect().top < window.innerHeight * 0.9;
      var delay  = inView ? 1.1 + inViewIndex++ * 0.12 : 0;
      gsap.from(job, {
        scrollTrigger: { trigger: job, start: 'top 97%', once: true },
        opacity: 0, y: 12, scale: 0.9, filter: 'blur(10px)',
        duration: 0.65, ease: 'power3.out',
        delay: delay,
        clearProps: 'filter,scale'
      });
    });

    var inViewTestimonialIndex = 0;
    gsap.utils.toArray('.testimonial').forEach(function (testimonial) {
      var inView = testimonial.getBoundingClientRect().top < window.innerHeight * 0.9;
      var delay  = inView ? 1.1 + inViewTestimonialIndex++ * 0.12 : 0;
      gsap.from(testimonial, {
        scrollTrigger: { trigger: testimonial, start: 'top 97%', once: true },
        opacity: 0, y: 12, scale: 0.9, filter: 'blur(10px)',
        duration: 0.65, ease: 'power3.out',
        delay: delay,
        clearProps: 'filter,scale'
      });
    });

    gsap.utils.toArray('.logo-track').forEach(function (track) {
      var touchStartX  = 0;
      var animStartX   = 0;
      var halfWidth    = 0;
      var animDuration = 35;

      function getTranslateX() {
        var transform = window.getComputedStyle(track).transform;
        if (!transform || transform === 'none') return 0;
        return new DOMMatrix(transform).m41;
      }

      function onTouchStart(e) {
        halfWidth   = track.offsetWidth / 2;
        animStartX  = getTranslateX();
        touchStartX = e.touches[0].clientX;
        // Set inline transform to current position first, THEN kill animation
        // so there's no jump when animation is removed
        track.style.transform = 'translateX(' + animStartX + 'px)';
        track.style.animation = 'none';
      }

      function onTouchMove(e) {
        var delta = e.touches[0].clientX - touchStartX;
        var newX  = Math.min(0, Math.max(-halfWidth, animStartX + delta));
        track.style.transform = 'translateX(' + newX + 'px)';
      }

      function onTouchEnd() {
        var currentX = getTranslateX();
        var progress = halfWidth > 0 ? Math.abs(currentX) / halfWidth : 0;
        // Restore animation from the exact scroll position the user left off at
        track.style.transform = '';
        track.style.animation = 'logo-scroll ' + animDuration + 's linear ' + -(progress * animDuration) + 's infinite';
      }

      track.addEventListener('touchstart',  onTouchStart, { passive: true });
      track.addEventListener('touchmove',   onTouchMove,  { passive: true });
      track.addEventListener('touchend',    onTouchEnd,   { passive: true });
      track.addEventListener('touchcancel', onTouchEnd,   { passive: true });
    });

    var footer = document.querySelector('.site-footer');
    if (footer) {
      gsap.from(footer, {
        scrollTrigger: { trigger: footer, start: 'top 98%', once: true },
        opacity: 0, y: 16, scale: 0.9, filter: 'blur(8px)',
        duration: 0.6, ease: 'power2.out',
        clearProps: 'filter,scale'
      });
    }
  }
}());
