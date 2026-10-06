(() => {
  const select = document.getElementById('monthly-budget');
  if (!select) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'form-select-wrap';
  const display = document.createElement('span');
  display.className = 'form-select form-select-display';
  display.setAttribute('aria-hidden', 'true');
  select.before(wrapper);
  wrapper.append(select, display);

  const sync = () => {
    display.textContent = select.selectedOptions[0]?.textContent || '';
  };
  select.addEventListener('change', sync);
  select.addEventListener('input', sync);
  select.form?.addEventListener('reset', () => requestAnimationFrame(sync));
  window.addEventListener('pageshow', sync);
  sync();
})();
