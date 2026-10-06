(() => {
  'use strict';

  // INR and USD quotes are the supplied price points. Package totals multiply
  // the quoted per-item prices so each quantity uses the same pricing rule.
  const services = [
    {
      name: 'AI UGC Videos',
      description: 'Creator-style ads built for social and performance marketing.',
      badge: 'Up to 20s',
      unit: 'video',
      shortUnit: 'UGC',
      turnaround: '2–3 days',
      tiers: [
        { count: 1, inr: 4000, usd: 48, discount: 'Standard' },
        { count: 3, inr: 3800, usd: 45, discount: '5% OFF' },
        { count: 5, inr: 3700, usd: 44, discount: '7.5% OFF' },
        { count: 10, inr: 3600, usd: 43, discount: '10% OFF' },
        { count: 20, inr: 3500, usd: 42, discount: '12.5% OFF' }
      ],
      features: [
        'AI Creator Match & Synthesis',
        'Direct Response Hook & Scriptwriting',
        'Up to 20s 9:16 Video + Dynamic Captions',
        'AI Voice Synthesis',
        'Hook Variations'
      ]
    },
    {
      name: 'Creative Advertising Images',
      description: 'Premium product visuals for ads, launches, and campaigns.',
      badge: 'All formats & 4K',
      unit: 'image',
      shortUnit: 'Image',
      turnaround: '1–2 days',
      tiers: [
        { count: 1, inr: 1499, usd: 18, discount: 'Standard' },
        { count: 3, inr: 1333, usd: 16, discount: '11% OFF' },
        { count: 5, inr: 1300, usd: 15, discount: '13% OFF' },
        { count: 10, inr: 1200, usd: 14, discount: '20% OFF' },
        { count: 20, inr: 1100, usd: 13, discount: '27% OFF' }
      ],
      features: [
        'Creative Art Direction & Concepting',
        'Photorealistic 3D Lighting & Reflection',
        '1:1 Square, 4:5 Portrait & 9:16 Story/Reel Formats',
        'Ultra 4K Master JPG & PNG',
        'Multi-Platform Aspect Ratio Crops'
      ]
    },
    {
      name: 'Hyper Motion Product Videos',
      description: 'Cinematic product films with motion, VFX, and sound design.',
      badge: 'Up to 20s',
      unit: 'video',
      shortUnit: 'Video',
      turnaround: '2–4 days',
      tiers: [
        { count: 1, inr: 4500, usd: 54, discount: 'Standard' },
        { count: 2, inr: 4400, usd: 52, discount: '2.2% OFF' },
        { count: 3, inr: 4300, usd: 51, discount: '4.4% OFF' },
        { count: 5, inr: 4200, usd: 50, discount: '6.7% OFF' },
        { count: 10, inr: 4100, usd: 49, discount: '8.9% OFF' }
      ],
      features: [
        'Cinematic AI Camera Motion & Dynamics',
        'VFX Simulations, Fluid & Particle Physics',
        'Up to 20s Video + Kinetic Sound Design',
        '9:16 & 16:9 4K Export',
        '3D Camera Motion'
      ]
    },
    {
      name: 'AI Commercial Video Ads',
      description: 'Story-led video ads that bring your brand and products into focus.',
      badge: 'Commercial ads',
      unit: 'video',
      shortUnit: 'Ad',
      turnaround: 'Confirmed with your brief',
      // Fixed USD quotes follow the site's approximate ₹4,000 / $48 convention.
      // Each listed quantity tier reduces the per-video INR price by ₹100.
      tiers: [
        { count: 1, inr: 5000, usd: 60, discount: 'Standard' },
        { count: 2, inr: 4900, usd: 59, discount: '2% OFF' },
        { count: 3, inr: 4800, usd: 58, discount: '4% OFF' },
        { count: 5, inr: 4700, usd: 56, discount: '6% OFF' },
        { count: 10, inr: 4600, usd: 55, discount: '8% OFF' }
      ],
      features: [
        'Brand-Focused Concept & Script',
        'AI-Generated Commercial Visuals',
        'Product & Brand Storytelling',
        'Editing & Sound Design',
        'Campaign-Ready Video Delivery'
      ]
    }
  ];

  const combined = [
    {
      name: 'Starter Creative Pack', inr: 19499, usd: 235,
      originalInr: 19899, originalUsd: 239, discount: '2% OFF',
      features: ['3x AI UGC Video', '3x Creative Images', '1x Hyper Motion Video']
    },
    {
      name: 'Growth Creative Pack', inr: 38299, usd: 460,
      originalInr: 39299, originalUsd: 472, discount: '2.5% OFF', featured: true,
      features: ['5x AI UGC Video', '10x Creative Images', '2x Hyper Motion Video']
    },
    {
      name: 'Performance Creative Pack', inr: 66899, usd: 805,
      originalInr: 70899, originalUsd: 850, discount: '5.6% OFF',
      features: ['10x AI UGC Video', '20x Creative Images', '3x Hyper Motion Video',
        'Multiple creative angles', 'Hook variations', 'Ad-focused creative direction']
    }
  ];

  const formatINR = value => value.toLocaleString('en-IN');
  const formatUSD = value => value.toLocaleString('en-US');
  const featureList = features => features.map(feature =>
    `<li><span class="check-icon" aria-hidden="true">✓</span> ${feature}</li>`
  ).join('');

  const individualGrid = document.getElementById('individual-pricing-grid');
  if (individualGrid) {
    services.forEach(service => {
      const card = document.createElement('article');
      card.className = 'package-card';
      card.innerHTML = `
        <div class="package-head-row">
          <h3 class="package-title">${service.name}</h3>
          <span class="package-duration-pill">${service.badge}</span>
        </div>
        <p class="package-desc">${service.description}</p>
        <div class="dual-sliders-container">
          <div class="duration-slider-container">
            <div class="slider-header-row">
              <label class="slider-label" for="pricing-${service.shortUnit.toLowerCase()}">Select ${service.unit} quantity:</label>
              <span class="slider-val-display" data-quantity-label></span>
            </div>
            <div class="custom-slider-wrapper" data-pricing-wrapper>
              <input id="pricing-${service.shortUnit.toLowerCase()}" type="range" class="custom-range-slider"
                min="0" max="4" step="1" value="0" aria-label="${service.name} quantity" data-pricing-range>
              <div class="slider-track-fill" data-pricing-fill></div>
              <div class="slider-thumb-custom" data-pricing-thumb><span class="thumb-arrows" aria-hidden="true">&lt;&gt;</span></div>
            </div>
            <div class="slider-ticks-row pricing-quantity-ticks">
              ${service.tiers.map((tier, index) => `<button type="button" class="slider-tick${index === 0 ? ' active' : ''}"
                data-pricing-step="${index}" aria-label="${tier.count} ${service.unit}${tier.count === 1 ? '' : 's'}">${tier.count}x</button>`).join('')}
            </div>
          </div>
        </div>
        <div class="package-pricing-box">
          <div class="package-price-main pricing-price-line"><span class="currency-symbol">₹</span>
            <span class="price-number" data-price-inr></span><span class="pricing-usd" data-price-usd></span></div>
          <div class="pricing-unit-note" data-unit-price></div>
          <div class="package-volume-note" data-savings></div>
          <div class="pricing-turnaround">Estimated turnaround: ${service.turnaround}</div>
        </div>
        <div class="package-features-title">Included in package:</div>
        <ul class="package-items">${featureList(service.features)}</ul>
        <a href="#contact" class="btn-secondary-agency package-btn" data-pricing-cta
          data-select-service="${service.name}">Start Project with This Package →</a>`;
      individualGrid.append(card);

      const range = card.querySelector('[data-pricing-range]');
      const steps = [...card.querySelectorAll('[data-pricing-step]')];
      function render(index) {
        const tier = service.tiers[index];
        const label = `${tier.count}x ${service.shortUnit}`;
        card.querySelector('[data-quantity-label]').textContent = label;
        card.querySelector('[data-price-inr]').textContent = formatINR(tier.inr * tier.count);
        card.querySelector('[data-price-usd]').textContent = `/ $${formatUSD(tier.usd * tier.count)}`;
        card.querySelector('[data-unit-price]').textContent =
          `₹${formatINR(tier.inr)} / $${formatUSD(tier.usd)} per ${service.unit}`;
        card.querySelector('[data-savings]').textContent = tier.discount;
        card.querySelector('[data-pricing-fill]').style.width = `${index * 25}%`;
        card.querySelector('[data-pricing-thumb]').style.left = `${index * 25}%`;
        card.querySelector('[data-pricing-cta]').dataset.selectService =
          `${service.name} — ${label} (₹${formatINR(tier.inr * tier.count)} / $${formatUSD(tier.usd * tier.count)})`;
        range.value = String(index);
        range.setAttribute('aria-valuetext', `${label}, ₹${formatINR(tier.inr * tier.count)} or $${formatUSD(tier.usd * tier.count)}`);
        steps.forEach((step, stepIndex) => step.classList.toggle('active', stepIndex === index));
      }
      range.addEventListener('input', () => render(Number(range.value)));
      steps.forEach(step => step.addEventListener('click', () => render(Number(step.dataset.pricingStep))));
      card.querySelector('[data-pricing-wrapper]').addEventListener('wheel', event => {
        event.preventDefault();
        render(Math.max(0, Math.min(4, Number(range.value) - Math.sign(event.deltaY))));
      }, { passive: false });
      render(0);
    });
  }

  const combinedGrid = document.getElementById('combined-pricing-grid');
  if (combinedGrid) {
    combined.forEach(pack => {
      const card = document.createElement('article');
      card.className = `package-card${pack.featured ? ' featured' : ''}`;
      card.innerHTML = `
        ${pack.featured ? '<span class="package-badge">Most Popular</span>' : ''}
        <h3 class="package-title">${pack.name}</h3>
        <div class="package-pricing-box">
          <div class="package-price-main pricing-price-line"><span class="currency-symbol">₹</span>
            <span class="price-number">${formatINR(pack.inr)}</span>
            <span class="pricing-usd">/ $${formatUSD(pack.usd)}</span></div>
          <div class="pricing-original">Was ₹${formatINR(pack.originalInr)} / $${formatUSD(pack.originalUsd)}</div>
          <div class="package-volume-note">${pack.discount}</div>
        </div>
        <div class="package-features-title">Included in package:</div>
        <ul class="package-items">${featureList(pack.features)}</ul>
        <a href="#contact" class="${pack.featured ? 'btn-primary-agency' : 'btn-secondary-agency'} package-btn"
          data-select-service="${pack.name} (₹${formatINR(pack.inr)} / $${formatUSD(pack.usd)})">Get This Package →</a>`;
      combinedGrid.append(card);
    });
  }
})();
