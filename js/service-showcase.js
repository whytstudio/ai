(() => {
  'use strict';
  const IMAGE_DURATION = 6000;
  const players = [];
  const icons = {
    play: '<path d="m9 5 11 7-11 7Z"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    next: '<path d="m5 5 10 7-10 7ZM19 5v14"/>',
    muted: '<path d="m11 5-5 4H3v6h3l5 4ZM16 9l6 6m0-6-6 6"/>',
    sound: '<path d="m11 5-5 4H3v6h3l5 4ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>'
  };
  const svg = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
  const absolute = (src, base) => src ? new URL(src, base).href : '';
  const imageItems = data => (data?.projects || []).flatMap(project => (project.images || []).map(img => ({
    src: absolute(img.preview || img.src, document.baseURI), srcset: img.srcset || '',
    width: img.width, height: img.height, label: img.alt || `${project.name} creative image`
  })));
  const uniqueItems = items => {
    const seen = new Set();
    return items.filter(item => item.src && !seen.has(item.src) && seen.add(item.src));
  };

  async function playlist(container) {
    const url = new URL(container.dataset.portfolio, document.baseURI);
    const isImage = container.dataset.mediaKind === 'image';
    const fallback = uniqueItems(isImage ? imageItems(window.CREATIVE_IMAGE_PORTFOLIO) :
      (window.SERVICE_VIDEO_PORTFOLIOS?.[container.dataset.portfolio] || []).map(item => ({
        ...item, src: absolute(item.src, document.baseURI), poster: absolute(item.poster, document.baseURI)
      })));
    // Chrome blocks fetch(file://...), but classic local scripts load normally.
    if (url.protocol === 'file:') return fallback;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(url, { cache: 'no-cache', signal: controller.signal });
      if (!response.ok) throw new Error('Portfolio unavailable');
      let items;
      if (isImage) items = imageItems(await response.json());
      else {
        const page = new DOMParser().parseFromString(await response.text(), 'text/html');
        items = [...page.querySelectorAll('.ugc-grid .ugc-card video')].map(video => ({
          src: absolute(video.getAttribute('src') || video.querySelector('source')?.getAttribute('src'), url),
          poster: absolute(video.getAttribute('poster'), url),
          label: video.getAttribute('aria-label') || video.closest('.ugc-card').dataset.label,
          width: video.getAttribute('width'), height: video.getAttribute('height')
        }));
      }
      items = uniqueItems(items);
      return items.length ? items : fallback;
    } catch {
      if (fallback.length) return fallback;
      throw new Error('Portfolio unavailable');
    } finally {
      clearTimeout(timeout);
    }
  }

  class Showcase {
    constructor(container) {
      this.container = container;
      this.minimalControls = Boolean(container.closest('[data-card-controls="minimal"]'));
      this.isImage = container.dataset.mediaKind === 'image';
      this.name = container.closest('.make-card').querySelector('.make-title').textContent;
      this.media = container.querySelector('video, img');
      this.items = [];
      this.index = -1;
      this.paused = false;
      this.muted = true;
      this.visible = false;
      this.busy = false;
      this.failed = new Set();
      this.remaining = IMAGE_DURATION;
      this.controls = document.createElement('div');
      this.controls.className = 'service-media-controls';
      this.controls.setAttribute('role', 'group');
      this.controls.setAttribute('aria-label', `${this.name} preview controls`);
      const button = (action, icon) => {
        const el = document.createElement('button');
        el.type = 'button';
        el.innerHTML = svg(icon);
        el.dataset.action = action;
        this.controls.append(el);
        return el;
      };
      if (!this.minimalControls) this.playButton = button('play', 'pause');
      this.nextButton = button('next', 'next');
      if (!this.isImage) this.soundButton = button('sound', 'muted');
      if (!this.minimalControls) {
        this.counter = document.createElement('span');
        this.counter.className = 'service-media-count';
        this.controls.append(this.counter);
      }
      container.append(this.controls);
      container.classList.add('service-showcase');
      this.status = document.createElement('span');
      this.status.className = 'service-media-status';
      this.status.setAttribute('role', 'status');
      container.append(this.status);
      this.bindMedia(this.media);
      this.playButton?.addEventListener('click', () => {
        this.paused = !this.paused;
        this.sync();
      });
      this.nextButton.addEventListener('click', () => {
        if (this.minimalControls) this.paused = false;
        this.advance();
      });
      this.soundButton?.addEventListener('click', () => {
        this.muted = !this.muted;
        // This gesture can also resume a video blocked by browser autoplay.
        if (this.minimalControls) this.paused = false;
        if (!this.muted) players.forEach(other => {
          if (other !== this && !other.isImage) { other.muted = true; other.sync(); }
        });
        this.sync();
      });
      const popover = container.querySelector('.what-you-get-popover');
      if (popover) new MutationObserver(() => this.sync()).observe(popover, { attributes: true, attributeFilter: ['class'] });
      this.sync();
      this.load();
    }
    running() {
      return this.visible && !document.hidden && !this.paused && !this.container.querySelector('.what-you-get-popover.open');
    }
    bindMedia(media) {
      if (this.isImage) return;
      media.loop = false;
      media.autoplay = false;
      media.muted = this.muted;
      media.playsInline = true;
      media.addEventListener('ended', () => {
        if (media === this.media && !this.paused) this.advance();
      });
      media.addEventListener('error', () => {
        if (media !== this.media || this.index < 0 || this.busy) return;
        this.failed.add(this.index);
        this.advance();
      });
      ['play', 'pause'].forEach(event => media.addEventListener(event, () => {
        if (media === this.media) this.update();
      }));
    }
    async load() {
      try {
        this.items = await playlist(this.container);
        if (!this.items.length) throw new Error('Empty portfolio');
        const current = this.media.src;
        this.index = this.items.findIndex(item => item.src === current);
        if (this.index < 0) await this.show(0);
        else { this.update(); this.sync(); }
      } catch {
        // Leave the original card usable if the portfolio cannot be fetched.
        if (!this.isImage) this.media.loop = true;
        this.status.textContent = 'Portfolio unavailable. Showing the current preview.';
        this.update();
      }
    }
    stopTimer() {
      if (!this.timer) return;
      clearTimeout(this.timer);
      this.timer = null;
      this.remaining = Math.max(0, this.remaining - (performance.now() - this.started));
    }
    sync() {
      const run = this.running();
      if (this.isImage) {
        if (!run || this.busy) this.stopTimer();
        else if (!this.timer && this.items.length > 1) {
          this.started = performance.now();
          this.timer = setTimeout(() => { this.timer = null; this.advance(); }, this.remaining);
        }
      } else {
        this.media.muted = this.muted;
        if (run && !this.busy) {
          if (this.media.ended && this.items.length && !this.failed.has(this.index)) { this.advance(); return; }
          const active = this.media;
          active.play()?.catch(error => {
            if (error.name !== 'AbortError' && active === this.media && this.running()) {
              this.paused = true;
              this.update();
            }
          });
        } else this.media.pause();
      }
      this.update();
    }
    update() {
      const paused = this.paused || (!this.isImage && this.media.paused);
      const label = `${paused ? 'Play' : 'Pause'} ${this.name} ${this.isImage ? 'slideshow' : 'video'}`;
      if (this.playButton) {
        this.playButton.innerHTML = `${paused ? 'Play' : 'Pause'} <span aria-hidden="true">${paused ? '▷' : 'Ⅱ'}</span>`;
        this.playButton.setAttribute('aria-label', label);
        this.playButton.title = label;
      }
      this.nextButton.disabled = this.busy || this.items.length < 2 || this.failed.size >= this.items.length;
      this.nextButton.setAttribute('aria-label', `Next ${this.name} ${this.isImage ? 'image' : 'video'}`);
      this.nextButton.title = this.nextButton.getAttribute('aria-label');
      this.nextButton.innerHTML = `Next ${svg('next')}`;
      if (this.soundButton) {
        this.soundButton.innerHTML = svg(this.muted ? 'muted' : 'sound') +
          (this.minimalControls ? '' : `<span>Sound ${this.muted ? 'off' : 'on'}</span>`);
        this.soundButton.setAttribute('aria-label', `${this.muted ? 'Unmute' : 'Mute'} ${this.name} video`);
        this.soundButton.setAttribute('aria-pressed', String(!this.muted));
        this.soundButton.title = this.soundButton.getAttribute('aria-label');
      }
      if (this.counter) this.counter.textContent = this.index >= 0 ? `${this.index + 1} / ${this.items.length}` : '';
    }
    advance() {
      if (this.busy || !this.items.length || this.failed.size >= this.items.length) return;
      let next = (this.index + 1) % this.items.length;
      while (this.failed.has(next)) next = (next + 1) % this.items.length;
      this.show(next);
    }
    async show(index) {
      if (this.busy) return;
      this.busy = true;
      this.stopTimer();
      if (!this.isImage) this.media.pause();
      this.update();
      const item = this.items[index];
      const next = document.createElement(this.isImage ? 'img' : 'video');
      next.className = `${this.isImage ? 'make-image-contain' : 'make-video-contain'} service-media-entering`;
      next.width = Number(item.width) || 1080;
      next.height = Number(item.height) || 1920;
      if (this.isImage) {
        next.alt = item.label;
        next.decoding = 'async';
        next.sizes = '(max-width:640px) 90vw, (max-width:1099px) 45vw, 260px';
        if (item.srcset) next.srcset = item.srcset;
      } else {
        next.setAttribute('aria-label', item.label);
        next.preload = 'auto';
        next.poster = item.poster;
        this.bindMedia(next);
      }
      next.setAttribute('aria-hidden', 'true');
      this.container.insertBefore(next, this.media);
      try {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => finish(new Error('Media timeout')), 20000);
          const finish = error => {
            clearTimeout(timeout);
            next.removeEventListener(this.isImage ? 'load' : 'loadeddata', ready);
            next.removeEventListener('error', failed);
            error ? reject(error) : resolve();
          };
          const ready = () => finish();
          const failed = () => finish(new Error('Media unavailable'));
          next.addEventListener(this.isImage ? 'load' : 'loadeddata', ready, { once: true });
          next.addEventListener('error', failed, { once: true });
          next.src = item.src;
        });
        const previous = this.media;
        previous.setAttribute('aria-hidden', 'true');
        next.removeAttribute('aria-hidden');
        this.media = next;
        this.index = index;
        this.remaining = IMAGE_DURATION;
        this.busy = false;
        this.status.textContent = '';
        // Both layers have identical geometry; retain the old frame until ready.
        requestAnimationFrame(() => {
          next.classList.remove('service-media-entering');
          previous.classList.add('service-media-leaving');
          setTimeout(() => {
            previous.remove();
            if (!this.isImage) { previous.removeAttribute('src'); previous.load(); }
          }, 240);
        });
        this.sync();
      } catch {
        next.remove();
        if (!this.isImage) { next.removeAttribute('src'); next.load(); }
        this.failed.add(index);
        this.busy = false;
        if (this.failed.size < this.items.length) this.advance();
        else {
          this.paused = true;
          this.status.textContent = 'Previews unavailable. Please visit the portfolio.';
          this.update();
        }
      }
    }
  }
  document.querySelectorAll('#services .make-media[data-portfolio]').forEach(container => players.push(new Showcase(container)));
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      const player = players.find(item => item.container === entry.target);
      player.visible = entry.isIntersecting && entry.intersectionRatio >= 0.15;
      player.sync();
    }), { threshold: [0, 0.15] });
    players.forEach(player => observer.observe(player.container));
  } else players.forEach(player => { player.visible = true; player.sync(); });
  document.addEventListener('visibilitychange', () => players.forEach(player => player.sync()));
  window.addEventListener('pagehide', () => players.forEach(player => { player.stopTimer(); if (!player.isImage) player.media.pause(); }));
  window.addEventListener('pageshow', () => players.forEach(player => player.sync()));
})();
