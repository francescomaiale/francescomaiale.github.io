/* Progressive enhancement: the complete catalogue is readable without JS. */
document.querySelectorAll('[data-catalogue]').forEach(catalogue => {
  const form = catalogue.querySelector('[data-filters]');
  const items = [...catalogue.querySelectorAll('[data-item]')];
  const groups = [...catalogue.querySelectorAll('[data-group]')];
  const count = catalogue.querySelector('[data-count]');
  const empty = catalogue.querySelector('[data-empty]');
  const normalise = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
  function filter() {
    const values = new FormData(form);
    const query = normalise(String(values.get('query') || '')).trim().split(/\s+/).filter(Boolean);
    let visible = 0;
    items.forEach(item => {
      const text = normalise(item.dataset.search);
      const matches = query.every(word => text.includes(word)) && ['topic', 'year', 'status', 'format'].every(key => !values.get(key) || item.dataset[key] === values.get(key));
      item.hidden = !matches;
      if (matches) visible++;
    });
    groups.forEach(group => { group.hidden = ![...group.querySelectorAll('[data-item]')].some(item => !item.hidden); });
    count.textContent = `${visible} of ${items.length} ${catalogue.dataset.kind}`;
    empty.hidden = visible > 0;
  }
  form.hidden = false;
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('input', filter);
  form.addEventListener('change', filter);
  form.addEventListener('reset', () => requestAnimationFrame(filter));
  catalogue.querySelector('[data-clear]').addEventListener('click', () => { form.reset(); form.elements.query.focus(); });
  filter();
});
