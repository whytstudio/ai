/* WHYT.studio — one reversible timeline, driven directly by scroll position. */
(function () {
  'use strict';

  function initHeroScroll() {
    const container = document.getElementById('hero-scroll-section');
    const canvas = document.getElementById('hero-card-canvas');
    if (!container || !canvas || container.dataset.heroScrollReady) return;
    // The deferred dependency precedes this script; do not run an endless retry timer.
    if (typeof gsap === 'undefined') return;
    container.dataset.heroScrollReady = 'true';
    container.classList.add('hero-scroll-ready');

    const centerWrap = document.getElementById('hero-scroll-center-content');
    const centerGlow = document.getElementById('hero-scroll-center-glow');
    const scrollPill = document.getElementById('hero-scroll-indicator');
    const stage = container.querySelector('.hero-scroll-viewport');
    const cards = Array.from(container.querySelectorAll('.hero-canvas-card[data-card]'));

    let activeTimeline;
    let frame = 0;
    function renderScrollPosition() {
      frame = 0;
      if (!activeTimeline) return;
      // The stage stays sticky while the section travels exactly two screens.
      // Reading its position directly avoids cached pin/refresh coordinates.
      const travel = container.offsetHeight - stage.offsetHeight;
      const progress = travel > 0
        ? Math.max(0, Math.min(1, -container.getBoundingClientRect().top / travel))
        : 0;
      activeTimeline.progress(progress).pause();
      // The center links become interactive only after their reveal point.
      if (centerWrap) centerWrap.style.pointerEvents = progress >= 0.46 / 0.94 ? 'auto' : 'none';
    }
    function requestScrollRender() {
      if (!frame) frame = requestAnimationFrame(renderScrollPosition);
    }
    window.addEventListener('scroll', requestScrollRender, { passive: true });
    window.addEventListener('resize', requestScrollRender, { passive: true });
    window.addEventListener('pageshow', requestScrollRender);

    // Preserve the original composition, distances, easing and reveal timing.
    const offsets = [
      [-360, -240], [-260, -270], [-120, -290], [-30, -300],
      [30, -300], [120, -290], [260, -270], [360, -240],
      [-440, -60], [-460, -90], [-480, -130], [-500, -150],
      [500, -150], [480, -130], [460, -90], [440, -60],
      [-440, 60], [-460, 90], [-480, 130], [-500, 150],
      [500, 150], [480, 130], [460, 90], [440, 60],
      [-360, 240], [-260, 270], [-120, 290], [-30, 300],
      [30, 300], [120, 290], [260, 270], [360, 240]
    ];

    // Rebuild only when the CSS layout breakpoint changes. GSAP reverts the
    // old timeline first, so there is exactly one owner per animated element.
    const media = gsap.matchMedia();
    media.add({
      mobile: '(max-width: 768px)',
      tablet: '(min-width: 769px) and (max-width: 992px)',
      desktop: '(min-width: 993px)'
    }, context => {
      const { mobile, tablet } = context.conditions;
      const initialTilt = mobile ? -12 : tablet ? -14 : -18;
      const distanceScale = mobile ? 0.55 : tablet ? 0.8 : 1;

      const timeline = gsap.timeline({ paused: true });
      timeline.fromTo(canvas, {
        x: 0, y: 0, xPercent: -50, yPercent: -50,
        rotation: initialTilt, scale: 1
      }, {
        rotation: 0, scale: 1.02, force3D: true,
        ease: 'power2.inOut', duration: 0.70
      }, 0);

      cards.forEach(card => {
        const offset = offsets[Number(card.dataset.card) - 1];
        if (!offset) return;
        // Explicit origins keep refreshes from using a partially separated pose.
        timeline.fromTo(card, { x: 0, y: 0 }, {
          x: offset[0] * distanceScale,
          y: offset[1] * distanceScale,
          force3D: true, ease: 'power2.inOut', duration: 0.70
        }, 0);
      });

      if (scrollPill) timeline.fromTo(scrollPill, { opacity: 1, y: 0 }, {
        opacity: 0, y: 18, duration: 0.16, ease: 'power1.out'
      }, 0.05);
      if (centerGlow) timeline.fromTo(centerGlow, { opacity: 0 }, {
        opacity: 1, duration: 0.35, ease: 'power2.inOut'
      }, 0.35);
      if (centerWrap) timeline.fromTo(centerWrap, { opacity: 0 }, {
        opacity: 1, duration: 0.001, ease: 'none', immediateRender: false
      }, 0.46);

      const reveals = [
        ['hero-badge', 0.48, 0.20],
        ['hero-heading', 0.54, 0.24],
        ['hero-subtitle', 0.62, 0.22],
        ['hero-cta-group', 0.70, 0.20],
        ['hero-benefits', 0.76, 0.18]
      ];
      reveals.forEach(([id, start, duration]) => {
        const element = document.getElementById(id);
        if (element) timeline.fromTo(element, { opacity: 0, y: 25 }, {
          opacity: 1, y: 0, duration, ease: 'power3.out'
        }, start);
      });

      activeTimeline = timeline;
      requestScrollRender();
      return () => { activeTimeline = null; };
    });

    // Decode only videos whose cards can actually be seen in the sticky stage.
    // Their muted previews stay independent of the scroll-position timeline.
    const videos = Array.from(container.querySelectorAll('.hero-canvas-card video'));
    const visibleCards = new Set();
    let heroVisible = true;
    function syncVideos() {
      videos.forEach(video => {
        const shouldPlay = heroVisible && !document.hidden && visibleCards.has(video.closest('.hero-canvas-card'));
        if (shouldPlay && video.paused) video.play().catch(() => {});
        else if (!shouldPlay && !video.paused) video.pause();
      });
    }
    videos.forEach(video => {
      video.muted = true;
      video.playsInline = true;
      video.autoplay = false;
      video.preload = 'metadata';
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.removeAttribute('autoplay');
      video.pause();
    });
    if ('IntersectionObserver' in window) {
      const videoObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.25) visibleCards.add(entry.target);
          else visibleCards.delete(entry.target);
        });
        syncVideos();
      }, { root: stage, threshold: [0, 0.25] });
      videos.forEach(video => videoObserver.observe(video.closest('.hero-canvas-card')));
      const heroObserver = new IntersectionObserver(([entry]) => {
        heroVisible = entry.isIntersecting;
        syncVideos();
      });
      heroObserver.observe(container);
    } else {
      videos.forEach(video => visibleCards.add(video.closest('.hero-canvas-card')));
    }
    syncVideos();
    document.addEventListener('visibilitychange', syncVideos);
    document.addEventListener('touchstart', syncVideos, { once: true, passive: true });
    document.addEventListener('click', syncVideos, { once: true, passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeroScroll, { once: true });
  } else initHeroScroll();
})();
