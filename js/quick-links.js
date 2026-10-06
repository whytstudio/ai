(() => {
  const button = document.getElementById('scroll-to-top');
  if (!button) return;

  function updateVisibility() {
    const visible = window.scrollY > 1;
    button.classList.toggle('is-visible', visible);
    button.disabled = !visible;
    button.setAttribute('aria-hidden', String(!visible));
    if (!visible && document.activeElement === button) button.blur();
  }

  window.addEventListener('scroll', updateVisibility, { passive: true });
  window.addEventListener('pageshow', updateVisibility);
  updateVisibility();

  button.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
    });
  });
})();
