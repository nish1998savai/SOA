(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(hover: none)').matches;

  /* Preloader: minimum visible time avoids a flash on fast connections,
     hard fallback timeout guarantees it never gets stuck if an asset stalls */
  var minDisplay = reduced ? 0 : 500;
  var startTime = Date.now();
  function hidePreloader() {
    var elapsed = Date.now() - startTime;
    var wait = Math.max(0, minDisplay - elapsed);
    setTimeout(function () { document.body.classList.add('is-loaded'); }, wait);
  }
  if (document.readyState === 'complete') {
    hidePreloader();
  } else {
    window.addEventListener('load', hidePreloader);
  }
  setTimeout(hidePreloader, 3500); /* fallback: never block the page */

  /* Sticky header shadow state */
  var header = document.getElementById('site-header');
  if (header) {
    window.addEventListener('scroll', function () {
      header.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }

  /* Mobile nav toggle */
  var navToggle = document.getElementById('nav-toggle');
  var navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var open = navLinks.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        navLinks.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* Hero entrance stagger (kicker -> title -> lede -> ctas) */
  var heroContent = document.querySelector('.hero-content');
  if (heroContent && window.gsap) {
    if (reduced) {
      gsap.set(heroContent.children, { opacity: 1, y: 0 });
    } else {
      gsap.fromTo(heroContent.children,
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: 0.9, stagger: 0.14, ease: 'power2.out', delay: 0.3 }
      );
    }
  }

  /* Hero Ken Burns crossfade */
  var slides = document.querySelectorAll('.hero-slide');
  if (!reduced && slides.length && window.gsap) {
    var i = 0;
    slides.forEach(function (s, idx) {
      gsap.set(s, { scale: idx === 0 ? 1.06 : 1.12 });
    });
    function nextSlide() {
      var current = slides[i];
      var next = slides[(i + 1) % slides.length];
      gsap.to(current, { opacity: 0, scale: 1.18, duration: 2, ease: 'power1.inOut' });
      gsap.fromTo(next, { opacity: 0, scale: 1.12 }, { opacity: 1, scale: 1.02, duration: 2, ease: 'power1.inOut' });
      current.classList.remove('is-active');
      next.classList.add('is-active');
      i = (i + 1) % slides.length;
    }
    gsap.to(slides[0], { scale: 1.0, duration: 7, ease: 'none' });
    setInterval(nextSlide, 5500);
  }

  /* GSAP + ScrollTrigger reveals */
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    gsap.utils.toArray('.reveal').forEach(function (el) {
      if (reduced) { gsap.set(el, { opacity: 1 }); return; }
      gsap.fromTo(el, { opacity: 0, y: 28 }, {
        opacity: 1, y: 0, duration: 0.9, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true }
      });
    });

    gsap.utils.toArray('.grid-3, .gallery, .world-grid, .community-grid').forEach(function (grid) {
      var items = grid.children;
      if (reduced) { gsap.set(items, { opacity: 1 }); return; }
      gsap.fromTo(items, { opacity: 0, y: 40 }, {
        opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: 'power2.out',
        scrollTrigger: { trigger: grid, start: 'top 82%', once: true }
      });
    });

    /* Draw-in world-art SVG paths */
    gsap.utils.toArray('.draw-path').forEach(function (path) {
      var len = path.getTotalLength ? path.getTotalLength() : 800;
      path.style.setProperty('--len', len);
      ScrollTrigger.create({
        trigger: path.closest('.world-card'),
        start: 'top 85%',
        once: true,
        onEnter: function () { path.classList.add('drawn'); }
      });
    });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.style.opacity = 1; });
  }

  /* Mandala slow spin */
  if (!reduced && window.gsap) {
    document.querySelectorAll('.mandala-spin').forEach(function (g) {
      gsap.to(g, { rotation: 360, duration: 40, repeat: -1, ease: 'none', transformOrigin: '0px 0px' });
    });
  }

  /* 3D tilt on cards/gallery/world-cards */
  if (window.VanillaTilt && !isTouch) {
    VanillaTilt.init(document.querySelectorAll('.tilt-card'), {
      max: 8,
      speed: 400,
      glare: true,
      'max-glare': 0.18,
      scale: 1.02,
      perspective: 900
    });
  }

  /* Gallery lightbox */
  var lightbox = document.getElementById('lightbox');
  if (lightbox) {
    var lightboxImg = document.getElementById('lightbox-img');
    var lightboxCaption = document.getElementById('lightbox-caption');
    document.querySelectorAll('.gallery figure img').forEach(function (img) {
      img.addEventListener('click', function () {
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        var fig = img.closest('figure');
        var titleEl = fig.querySelector('.work-title');
        var mediumEl = fig.querySelector('.work-medium');
        var parts = [];
        if (titleEl) parts.push(titleEl.textContent);
        if (mediumEl) parts.push(mediumEl.textContent);
        lightboxCaption.textContent = parts.join(' — ');
        lightbox.classList.add('is-open');
      });
    });
    function closeLightbox() { lightbox.classList.remove('is-open'); lightboxImg.src = ''; }
    document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLightbox(); });
  }

  /* Zdog 3D ornament in hero — an orbiting ring motif */
  var ornEl = document.getElementById('hero-orn');
  if (ornEl && window.Zdog && !reduced) {
    var illo = new Zdog.Illustration({
      element: '#hero-orn',
      zoom: 1.1,
      dragRotate: false
    });
    new Zdog.Shape({ addTo: illo, path: [{ x: 0, y: -46 }], stroke: 0 });
    new Zdog.Ellipse({ addTo: illo, diameter: 90, stroke: 6, color: '#e0794f', rotate: { x: Zdog.TAU / 5 } });
    new Zdog.Ellipse({ addTo: illo, diameter: 62, stroke: 5, color: '#f2ede4', rotate: { x: Zdog.TAU / 4, y: Zdog.TAU / 8 } });
    new Zdog.Shape({ addTo: illo, stroke: 14, color: '#2f5d62' });
    function animateOrn() {
      illo.rotate.y += 0.006;
      illo.rotate.x += 0.002;
      illo.updateRenderGraph();
      requestAnimationFrame(animateOrn);
    }
    animateOrn();
  }

  /* Generic mailto-backed form submission (register + contact pages) */
  document.querySelectorAll('form[data-mailto]').forEach(function (form) {
    var status = form.querySelector('.form-status');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var to = form.getAttribute('data-mailto');
      var subject = form.getAttribute('data-subject') || 'Website enquiry';
      var lines = [];
      var seenGroups = {};
      form.querySelectorAll('[data-field]').forEach(function (el) {
        var label = el.getAttribute('data-field');
        var value;
        if (el.type === 'checkbox') {
          if (seenGroups[el.name]) return;
          seenGroups[el.name] = true;
          var group = form.querySelectorAll('input[name="' + el.name + '"]:checked');
          value = Array.prototype.map.call(group, function (c) { return c.value; }).join(', ') || '—';
        } else {
          value = el.value || '—';
        }
        lines.push(label + ': ' + value);
      });

      var body = encodeURIComponent(lines.join('\n'));
      var mailtoUrl = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + body;

      if (status) {
        status.textContent = 'Opening your email client with the form pre-filled — send it to complete your submission.';
        status.classList.add('is-visible');
      }
      window.location.href = mailtoUrl;
    });
  });

  /* Discipline tags are native <label><input type=checkbox></label> —
     the browser already toggles on click; :has(input:checked) in CSS
     handles the visual state. No JS needed here. */
})();
