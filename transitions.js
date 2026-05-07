(function () {
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (
      !href ||
      href.charAt(0) === '#' ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      a.target === '_blank'
    ) return;

    e.preventDefault();
    gsap.to(document.documentElement, {
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: function () { window.location.href = href; }
    });
  });
}());
