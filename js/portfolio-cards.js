(() => {
  'use strict';
  const states = Array.from(document.querySelectorAll('.ugc-card')).filter(card => card.querySelector('video')).map(card => ({
    card, video: card.querySelector('video'), sound: card.querySelector('.ugc-sound'),
    pause: card.querySelector('.ugc-pause'), label: card.dataset.label || card.dataset.brand,
    visible: false, manuallyPaused: false
  }));
  const allButton = document.querySelector('.ugc-toggle-all');
  let allPaused = false;
  function update(s) {
    s.sound.setAttribute('aria-pressed', String(!s.video.muted));
    s.sound.setAttribute('aria-label', `Turn sound ${s.video.muted ? 'on' : 'off'} for ${s.label}`);
    s.sound.querySelector('[data-sound-label]').textContent = s.video.muted ? 'Sound off' : 'Sound on';
    s.pause.textContent = s.video.paused ? 'Play ▷' : 'Pause Ⅱ';
    s.pause.setAttribute('aria-label', `${s.video.paused ? 'Play' : 'Pause'} ${s.label}`);
  }
  function play(s) {
    // A visible Play control remains available when browser policy blocks autoplay.
    const attempt = s.video.play();
    if (attempt) attempt.catch(() => update(s));
  }
  function muteOthers(active) {
    states.forEach(s => { if (s !== active) { s.video.muted = true; update(s); } });
  }
  function sync(s) {
    if (s.visible && !document.hidden && !allPaused && !s.manuallyPaused) play(s);
    else { s.video.pause(); s.video.muted = true; update(s); }
  }
  states.forEach(s => {
    const { video, card, sound, pause } = s;
    // Initial markup reserves the source dimensions; metadata also handles replacements.
    function fitVideo() {
      if (!video.videoWidth || !video.videoHeight) return;
      card.querySelector('.ugc-media').style.setProperty('--video-aspect', `${video.videoWidth} / ${video.videoHeight}`);
      card.classList.toggle('ugc-card--landscape', video.videoWidth > video.videoHeight);
    }
    video.addEventListener('loadedmetadata', fitVideo);
    video.addEventListener('resize', fitVideo);
    fitVideo();
    video.muted = true;
    video.controls = false;
    sound.hidden = false;
    card.querySelector('.ugc-controls').hidden = false;
    ['play', 'pause', 'volumechange'].forEach(event => video.addEventListener(event, () => update(s)));
    function showError() {
      card.querySelector('.ugc-error').hidden = false;
      sound.hidden = true;
      card.querySelector('.ugc-controls').hidden = true;
    }
    video.addEventListener('error', showError);
    if (video.error) showError();
    sound.addEventListener('click', () => {
      const enableSound = video.muted;
      muteOthers(s);
      video.muted = !enableSound;
      if (enableSound) { video.volume = 1; s.manuallyPaused = false; play(s); }
      update(s);
    });
    pause.addEventListener('click', () => {
      s.manuallyPaused = !video.paused;
      if (s.manuallyPaused) video.pause(); else play(s);
      update(s);
    });
    const fullscreen = card.querySelector('.ugc-fullscreen');
    const media = card.querySelector('.ugc-media');
    if (!media.requestFullscreen && !video.webkitEnterFullscreen) fullscreen.hidden = true;
    fullscreen.addEventListener('click', async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else if (media.requestFullscreen) await media.requestFullscreen();
        else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
      } catch { /* Inline playback remains available if fullscreen is declined. */ }
    });
    update(s);
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      const s = states.find(item => item.card === entry.target);
      s.visible = entry.isIntersecting && entry.intersectionRatio >= 0.1;
      sync(s);
    }), { threshold: [0, 0.1] });
    states.forEach(s => observer.observe(s.card));
  } else states.forEach(s => { s.visible = true; sync(s); });
  if (allButton) {
    allButton.hidden = false;
    allButton.addEventListener('click', () => {
      allPaused = !allPaused;
      allButton.setAttribute('aria-pressed', String(allPaused));
      allButton.setAttribute('aria-label', allPaused ? 'Resume previews' : 'Pause previews');
      allButton.textContent = allPaused ? 'Resume previews ▷' : 'Pause previews Ⅱ';
      states.forEach(s => { if (!allPaused) s.manuallyPaused = false; sync(s); });
    });
  }
  document.addEventListener('visibilitychange', () => states.forEach(sync));
  window.addEventListener('pagehide', () => states.forEach(s => { s.video.pause(); s.video.muted = true; }));
  window.addEventListener('pageshow', () => states.forEach(sync));
  const drawer = document.getElementById('mobile-menu-drawer');
  const burger = document.getElementById('burger-btn');
  const close = document.getElementById('close-drawer-btn');
  const background = [document.querySelector('main'), document.querySelector('.site-footer'), document.querySelector('.hp-head')];
  function toggleDrawer(open) {
    drawer.classList.toggle('open', open);
    drawer.setAttribute('aria-hidden', String(!open));
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    background.forEach(el => { if (el) el.inert = open; });
    if (open) { muteOthers(null); close.focus(); } else burger.focus();
  }
  if (drawer && burger && close) {
    burger.addEventListener('click', () => toggleDrawer(true));
    close.addEventListener('click', () => toggleDrawer(false));
    drawer.querySelectorAll('a').forEach(link => link.addEventListener('click', () => toggleDrawer(false)));
    document.addEventListener('keydown', event => {
      if (!drawer.classList.contains('open')) return;
      if (event.key === 'Escape') toggleDrawer(false);
      if (event.key === 'Tab') {
        const links = Array.from(drawer.querySelectorAll('a, button'));
        const first = links[0], last = links[links.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
    window.matchMedia('(min-width: 769px)').addEventListener('change', event => {
      if (event.matches && drawer.classList.contains('open')) toggleDrawer(false);
    });
  }
})();
