/* ==========================================================================
   WHYT.studio - Official JavaScript (Pure Modular JS)
   ========================================================================== */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Hero Rotating Word Spinner ---
    const spinnerWords = ['UGC Videos', 'Creative Images', 'Hyper Motion Video', 'TikTok Creatives'];
    let spinnerIdx = 0;
    const spinnerTextEl = document.getElementById('active-spinner-text');

    if (spinnerTextEl) {
      setInterval(() => {
        spinnerIdx = (spinnerIdx + 1) % spinnerWords.length;
        spinnerTextEl.style.opacity = '0';
        spinnerTextEl.style.transform = 'translateY(8px)';
        setTimeout(() => {
          spinnerTextEl.textContent = spinnerWords[spinnerIdx];
          spinnerTextEl.style.opacity = '1';
          spinnerTextEl.style.transform = 'translateY(0px)';
        }, 200);
      }, 2600);
    }

    // --- 2. Mobile Menu Drawer Navigation ---
    const burgerBtn = document.getElementById('burger-btn');
    const closeDrawerBtn = document.getElementById('close-drawer-btn');
    const drawer = document.getElementById('mobile-menu-drawer');

    function openDrawer() {
      if (drawer) {
        drawer.classList.add('open');
        drawer.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      }
    }

    function closeDrawer() {
      if (drawer) {
        drawer.classList.remove('open');
        drawer.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }
    }

    if (burgerBtn) burgerBtn.addEventListener('click', openDrawer);
    if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeDrawer);

    document.querySelectorAll('.mobile-nav-link, .drawer-cta').forEach(link => {
      link.addEventListener('click', closeDrawer);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer && drawer.classList.contains('open')) {
        closeDrawer();
      }
    });

    // --- 3. FAQ Accordion Interaction ---
    const faqItems = document.querySelectorAll('.faq-acc-item');

    faqItems.forEach(item => {
      const trigger = item.querySelector('.faq-acc-trigger');
      if (!trigger) return;

      trigger.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        
        // Close all other FAQ items for a clean single-open accordion feel
        faqItems.forEach(otherItem => {
          otherItem.classList.remove('open');
          const otherBtn = otherItem.querySelector('.faq-acc-trigger');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
        });

        if (!isOpen) {
          item.classList.add('open');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
    });

    // --- 4. Service Selection Chips & Dynamic Prefill ---
    const serviceChips = document.querySelectorAll('.service-chip');
    const briefTextarea = document.getElementById('project-brief');

    function selectServiceByName(serviceName) {
      serviceChips.forEach(chip => {
        if (chip.getAttribute('data-service') === serviceName) {
          chip.classList.add('active');
          chip.setAttribute('aria-pressed', 'true');
        }
      });
      if (briefTextarea && !briefTextarea.value.includes(serviceName)) {
        briefTextarea.value = (briefTextarea.value ? briefTextarea.value + '\n' : '') + 'Selected Service: ' + serviceName;
      }
    }

    serviceChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const isActive = chip.classList.toggle('active');
        chip.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });
    });

    // Handle any link with [data-select-service]
    document.querySelectorAll('[data-select-service]').forEach(btn => {
      btn.addEventListener('click', () => {
        const service = btn.getAttribute('data-select-service');
        if (service) selectServiceByName(service);
      });
    });

    // --- 4b. See What You Get Popover Toggle (Touch & Click Support) ---
    const seeWhatTriggers = document.querySelectorAll('.see-what-trigger');
    seeWhatTriggers.forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = trigger.closest('.make-card');
        const popover = card ? card.querySelector('.what-you-get-popover') : null;
        if (!popover) return;
        const isOpen = popover.classList.toggle('open');
        trigger.classList.toggle('active', isOpen);
        trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.what-you-get-popover') && !e.target.closest('.see-what-trigger')) {
        document.querySelectorAll('.what-you-get-popover.open').forEach(p => p.classList.remove('open'));
        document.querySelectorAll('.see-what-trigger.active').forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-expanded', 'false');
        });
      }
    });

    // --- 5. UGC Package Dual Interactive Sliders (Quantity & Duration) ---
    const ugcDurationSlider = document.getElementById('ugc-duration-slider');
    const ugcDurationWrapper = document.getElementById('ugc-slider-wrapper');
    const ugcDurationFill = document.getElementById('ugc-slider-fill');
    const ugcDurationThumb = document.getElementById('ugc-slider-thumb');
    const ugcDurationBadge = document.getElementById('ugc-duration-badge');
    const ugcDurationValText = document.getElementById('ugc-slider-val-text');
    const ugcFeatDuration = document.getElementById('ugc-feat-duration');
    const ugcDurationTicks = document.querySelectorAll('.duration-ticks .slider-tick');

    const ugcQtySlider = document.getElementById('ugc-qty-slider');
    const ugcQtyWrapper = document.getElementById('ugc-qty-slider-wrapper');
    const ugcQtyFill = document.getElementById('ugc-qty-slider-fill');
    const ugcQtyThumb = document.getElementById('ugc-qty-slider-thumb');
    const ugcQtyValText = document.getElementById('ugc-qty-val-text');
    const ugcQtyTicks = document.querySelectorAll('.qty-ticks .slider-tick');

    const ugcPackagePrice = document.getElementById('ugc-package-price');
    const ugcPricePeriod = document.getElementById('ugc-price-period');
    const ugcSavingsBadge = document.getElementById('ugc-pack-savings-badge');
    const ugcPackageCta = document.getElementById('ugc-package-cta');

    const durationData = [
      { name: 'Up to 15 sec', short: '15 sec', tick: '15s', base: 2499, feat: '15 sec high-converting video' },
      { name: '16–20 sec', short: '16–20 sec', tick: '20s', base: 2999, feat: '16–20 sec high-converting video' },
      { name: '21–30 sec', short: '21–30 sec', tick: '30s', base: 3999, feat: '21–30 sec high-converting video' },
      { name: '31–45 sec', short: '31–45 sec', tick: '45s', base: 4999, feat: '31–45 sec high-converting video' },
      { name: '46–60 sec', short: '46–60 sec', tick: '60s', base: 5999, feat: '46–60 sec high-converting video' }
    ];

    const quantityData = [
      { label: '1x UGC', count: 1, multiplier: 1.0, desc: 'Trial Single Pack · Best for initial testing', period: '/ single video' },
      { label: '3x UGC', count: 3, multiplier: 2.4, desc: 'Starter Pack · Save 20% on multi-hooks', period: '/ 3 videos bundle' },
      { label: '5x UGC', count: 5, multiplier: 4.0, desc: 'Growth Pack · Save 20% on multi-hooks', period: '/ 5 videos bundle' },
      { label: '10x UGC', count: 10, multiplier: 7.2, desc: 'Scale Pack · Save 28% for scaling campaigns', period: '/ 10 videos bundle' },
      { label: '20x UGC', count: 20, multiplier: 13.2, desc: 'Bulk Pack · Save 34% high-volume pipeline', period: '/ 20 videos bulk pack' }
    ];

    const exactPrices15s = [2499, 5999, 9999, 17999, 32999];

    let currentQtyIdx = 0;
    let currentDurIdx = 0;

    function renderUgcCard() {
      const dur = durationData[currentDurIdx];
      const qty = quantityData[currentQtyIdx];

      let finalPrice;
      if (currentDurIdx === 0) {
        finalPrice = exactPrices15s[currentQtyIdx];
      } else {
        const baseCost = dur.base;
        const total = Math.round(baseCost * qty.multiplier);
        finalPrice = Math.floor(total / 100) * 100 + 99;
      }

      const formattedPrice = finalPrice.toLocaleString('en-IN');

      const durPercent = (currentDurIdx / (durationData.length - 1)) * 100;
      const qtyPercent = (currentQtyIdx / (quantityData.length - 1)) * 100;

      if (ugcDurationSlider) ugcDurationSlider.value = currentDurIdx;
      if (ugcDurationFill) ugcDurationFill.style.width = durPercent + '%';
      if (ugcDurationThumb) ugcDurationThumb.style.left = durPercent + '%';
      if (ugcDurationBadge) ugcDurationBadge.textContent = dur.name;
      if (ugcDurationValText) ugcDurationValText.textContent = dur.short;
      if (ugcFeatDuration) ugcFeatDuration.textContent = dur.feat;

      if (ugcQtySlider) ugcQtySlider.value = currentQtyIdx;
      if (ugcQtyFill) ugcQtyFill.style.width = qtyPercent + '%';
      if (ugcQtyThumb) ugcQtyThumb.style.left = qtyPercent + '%';
      if (ugcQtyValText) ugcQtyValText.textContent = qty.label;

      if (ugcPackagePrice) ugcPackagePrice.textContent = formattedPrice;
      if (ugcPricePeriod) ugcPricePeriod.textContent = qty.period;
      if (ugcSavingsBadge) ugcSavingsBadge.textContent = qty.desc;

      ugcDurationTicks.forEach((tick, i) => {
        tick.classList.toggle('active', i === currentDurIdx);
      });
      ugcQtyTicks.forEach((tick, i) => {
        tick.classList.toggle('active', i === currentQtyIdx);
      });

      if (ugcPackageCta) {
        ugcPackageCta.setAttribute(
          'data-select-service',
          `UGC Creative AD Video - ${qty.label} · ${dur.short} (₹${formattedPrice})`
        );
      }
    }

    if (ugcDurationSlider) {
      ugcDurationSlider.addEventListener('input', (e) => {
        currentDurIdx = parseInt(e.target.value) || 0;
        renderUgcCard();
      });
    }

    if (ugcQtySlider) {
      ugcQtySlider.addEventListener('input', (e) => {
        currentQtyIdx = parseInt(e.target.value) || 0;
        renderUgcCard();
      });
    }

    ugcDurationTicks.forEach(tick => {
      tick.addEventListener('click', () => {
        const step = tick.getAttribute('data-step');
        if (step !== null) {
          currentDurIdx = parseInt(step) || 0;
          renderUgcCard();
        }
      });
    });

    ugcQtyTicks.forEach(tick => {
      tick.addEventListener('click', () => {
        const step = tick.getAttribute('data-qty-step');
        if (step !== null) {
          currentQtyIdx = parseInt(step) || 0;
          renderUgcCard();
        }
      });
    });

    // Scroll wheel on Duration slider
    if (ugcDurationWrapper) {
      ugcDurationWrapper.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (e.deltaY < 0 && currentDurIdx < durationData.length - 1) {
          currentDurIdx++;
          renderUgcCard();
        } else if (e.deltaY > 0 && currentDurIdx > 0) {
          currentDurIdx--;
          renderUgcCard();
        }
      }, { passive: false });
    }

    // Scroll wheel on Quantity slider
    if (ugcQtyWrapper) {
      ugcQtyWrapper.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (e.deltaY < 0 && currentQtyIdx < quantityData.length - 1) {
          currentQtyIdx++;
          renderUgcCard();
        } else if (e.deltaY > 0 && currentQtyIdx > 0) {
          currentQtyIdx--;
          renderUgcCard();
        }
      }, { passive: false });
    }

    // --- 6. Project Inquiry Form Submission ---
    const inquiryForm = document.getElementById('agency-inquiry-form');
    const submitBtn = document.getElementById('submit-inquiry-btn');
    const toastMsg = document.getElementById('inquiry-toast');

    if (inquiryForm) {
      inquiryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Submitting Inquiry...';
        }

        setTimeout(() => {
          if (submitBtn) {
            submitBtn.textContent = 'Inquiry Sent Successfully ✓';
            submitBtn.style.background = '#ffffff';
            submitBtn.style.color = '#000000';
          }
          if (toastMsg) {
            toastMsg.style.display = 'block';
            toastMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
          inquiryForm.reset();
        }, 600);
      });
    }

    // --- 6. Seamless Video Autoplay Assurance ---
    const marqueeVideos = document.querySelectorAll('.amq-tile video');
    marqueeVideos.forEach(video => {
      video.muted = true;
      const tryPlay = () => {
        const promise = video.play();
        if (promise !== undefined) {
          promise.catch(() => {});
        }
      };
      tryPlay();
      document.addEventListener('touchstart', tryPlay, { once: true, passive: true });
      document.addEventListener('click', tryPlay, { once: true, passive: true });
    });

  });
})();
