(() => {
  'use strict';

  const grid = document.getElementById('creative-project-grid');
  const status = document.getElementById('creative-project-status');
  const count = document.getElementById('creative-project-count');
  const dialog = document.getElementById('creative-gallery');
  if (!grid || !status || !count || !dialog) return;

  const title = document.getElementById('creative-gallery-title');
  const image = document.getElementById('creative-gallery-image');
  const caption = document.getElementById('creative-gallery-caption');
  const galleryCount = document.getElementById('creative-gallery-count');
  const thumbnails = document.getElementById('creative-thumbnails');
  const arrows = Array.from(dialog.querySelectorAll('[data-direction]'));
  const closeButton = dialog.querySelector('.creative-dialog-close');
  const fullscreenButton = dialog.querySelector('.creative-fullscreen');
  const shell = dialog.querySelector('.creative-dialog-shell');
  const originalLink = dialog.querySelector('.creative-original');
  const errorMessage = document.getElementById('creative-gallery-error');
  let selectedProject = null;
  let selectedIndex = 0;
  let opener = null;
  let previousOverflow = '';

  function showImage(index) {
    if (!selectedProject) return;
    const images = selectedProject.images;
    selectedIndex = (index + images.length) % images.length;
    const asset = images[selectedIndex];
    errorMessage.hidden = true;
    image.sizes = dialog.classList.contains('is-expanded') ? '100vw' : '(max-width:560px) calc(100vw - 110px), 800px';
    image.srcset = dialog.classList.contains('is-expanded') ? '' : (asset.srcset || '');
    image.src = asset.src;
    image.width = asset.width;
    image.height = asset.height;
    image.alt = asset.alt || `${selectedProject.name} creative image ${selectedIndex + 1}`;
    originalLink.href = asset.original || asset.src;
    caption.textContent = `${selectedProject.name} / Image ${String(selectedIndex + 1).padStart(2, '0')}`;
    galleryCount.textContent = `${selectedIndex + 1} / ${images.length}`;
    thumbnails.querySelectorAll('button').forEach((button, buttonIndex) => {
      if (buttonIndex === selectedIndex) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
    thumbnails.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
  }

  function openProject(project, trigger) {
    selectedProject = project;
    selectedIndex = 0;
    opener = trigger;
    title.textContent = project.name;
    thumbnails.replaceChildren();
    project.images.forEach((asset, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', `Show ${project.name} image ${index + 1}`);
      const thumb = document.createElement('img');
      thumb.src = asset.thumbnail || asset.src;
      thumb.alt = asset.alt ? `${asset.alt} thumbnail` : `${project.name} image ${index + 1} thumbnail`;
      thumb.width = asset.width;
      thumb.height = asset.height;
      thumb.decoding = 'async';
      thumb.loading = 'lazy';
      button.append(thumb);
      button.addEventListener('click', () => showImage(index));
      thumbnails.append(button);
    });
    const multiple = project.images.length > 1;
    arrows.forEach(button => { button.hidden = !multiple; });
    thumbnails.hidden = !multiple;
    showImage(0);
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    closeButton.focus();
  }

  function setExpanded(expanded) {
    dialog.classList.toggle('is-expanded', expanded);
    fullscreenButton.textContent = expanded ? 'Exit full screen' : 'Full screen';
    fullscreenButton.setAttribute('aria-pressed', String(expanded));
    if (selectedProject) showImage(selectedIndex);
  }
  async function closeViewer() {
    if (document.fullscreenElement === shell) await document.exitFullscreen().catch(() => {});
    dialog.close();
  }
  fullscreenButton.addEventListener('click', async () => {
    if (dialog.classList.contains('is-expanded')) {
      if (document.fullscreenElement === shell) await document.exitFullscreen().catch(() => {});
      setExpanded(false);
    } else {
      setExpanded(true);
      // Browsers without the Fullscreen API still get a viewport-filling viewer.
      if (shell.requestFullscreen && document.fullscreenEnabled) await shell.requestFullscreen().catch(() => {});
    }
  });
  document.addEventListener('fullscreenchange', () => {
    if (dialog.open) setExpanded(document.fullscreenElement === shell);
  });
  image.addEventListener('error', () => { errorMessage.hidden = false; });
  image.addEventListener('load', () => { errorMessage.hidden = true; });
  closeButton.addEventListener('click', closeViewer);
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeViewer(); });
  arrows.forEach(button => button.addEventListener('click', () => showImage(selectedIndex + Number(button.dataset.direction))));
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); showImage(selectedIndex - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); showImage(selectedIndex + 1); }
  });
  dialog.addEventListener('click', event => {
    if (event.target === dialog || event.target === shell || event.target.matches('.creative-viewer, .creative-viewer figure')) closeViewer();
  });
  dialog.addEventListener('close', () => {
    document.body.style.overflow = previousOverflow;
    opener?.focus();
    selectedProject = null;
    setExpanded(false);
    image.removeAttribute('srcset');
    image.removeAttribute('src');
    originalLink.removeAttribute('href');
  });

  function addProject(project, index) {
    const article = document.createElement('article');
    article.className = 'ugc-card creative-project-card';
    const headingId = `creative-project-${project.slug}`;
    article.setAttribute('aria-labelledby', headingId);

    const media = document.createElement('div');
    media.className = 'ugc-media';
    const cover = project.images[0];
    const trigger = document.createElement('a');
    trigger.className = 'creative-project-trigger';
    trigger.href = cover.src;
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-label', `View ${project.name} creative images`);
    const preview = document.createElement('img');
    preview.src = cover.preview || cover.src;
    preview.srcset = cover.srcset || '';
    preview.sizes = '(max-width:560px) 260px, (max-width:768px) 276px, (max-width:1000px) 30vw, 255px';
    preview.alt = cover.alt || `${project.name} creative portfolio`;
    preview.width = cover.width;
    preview.height = cover.height;
    preview.loading = index < 4 ? 'eager' : 'lazy';
    preview.decoding = 'async';
    const badge = document.createElement('span');
    badge.className = 'creative-project-badge';
    badge.textContent = `${project.images.length} ${project.images.length === 1 ? 'IMAGE' : 'IMAGES'}`;
    const hint = document.createElement('span');
    hint.className = 'creative-project-hint';
    hint.textContent = 'View project ↗';
    trigger.append(preview, badge, hint);
    trigger.addEventListener('click', event => { event.preventDefault(); openProject(project, trigger); });
    media.append(trigger);

    const meta = document.createElement('div');
    meta.className = 'ugc-card-meta';
    const information = document.createElement('div');
    const category = document.createElement('p');
    category.className = 'ugc-category';
    category.textContent = 'Creative Images';
    const heading = document.createElement('h3');
    heading.id = headingId;
    heading.textContent = project.name;
    const subtitle = document.createElement('span');
    subtitle.textContent = ` / ${project.images.length} image${project.images.length === 1 ? '' : 's'}`;
    heading.append(subtitle);
    information.append(category, heading);
    const number = document.createElement('span');
    number.className = 'ugc-index';
    number.textContent = String(index + 1).padStart(2, '0');
    meta.append(information, number);
    article.append(media, meta);
    grid.append(article);
  }

  try {
    const projects = window.CREATIVE_IMAGE_PORTFOLIO?.projects;
    if (!Array.isArray(projects)) throw new Error('Creative Image project index is missing');
    const available = projects.filter(project => project && project.slug && project.name && Array.isArray(project.images) && project.images.length);
    available.forEach((project, index) => {
      const trigger = [...grid.querySelectorAll('[data-project-slug]')].find(link => link.dataset.projectSlug === project.slug);
      if (trigger) trigger.addEventListener('click', event => { event.preventDefault(); openProject(project, trigger); });
      else addProject(project, index);
    });
    count.textContent = String(available.length).padStart(2, '0');
    status.textContent = available.length
      ? `${available.length} project collections · ${available.reduce((sum, project) => sum + project.images.length, 0)} images`
      : 'No Creative Image projects are available yet.';
  } catch (error) {
    console.error('Creative Image portfolio:', error);
    status.textContent = 'Unable to load projects right now. Please try again later.';
  }
})();
