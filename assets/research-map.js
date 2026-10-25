/* Enhance ordinary anchor links; all area resources remain usable without JS. */
(() => {
  'use strict';
  const map = document.querySelector('[data-research-map]');
  if (!map) return;
  const panels = [...document.querySelectorAll('[data-map-panel]')];
  const choices = [...document.querySelectorAll('[data-map-choice]')];
  const title = map.querySelector('[data-map-heading]');
  const description = map.querySelector('[data-map-description]');
  const count = map.querySelector('[data-map-count]');
  const explore = map.querySelector('[data-map-explore]');
  const status = map.querySelector('[data-map-status]');
  const byId = new Map(panels.map(panel => [panel.dataset.mapPanel, panel]));
  if (byId.size !== 4 || !title || !description || !count || !explore || !status ||
      panels.some(panel => !panel.querySelector('[data-theme-title]') || !panel.querySelector('[data-theme-question]'))) return;
  const fromHash = () => location.hash.startsWith('#theme-') ? location.hash.slice(7) : '';
  const select = (id, announce = false) => {
    const panel = byId.get(id);
    if (!panel) return;
    panels.forEach(item => { item.hidden = item !== panel; });
    choices.forEach(choice => {
      if (choice.dataset.mapChoice === id) choice.setAttribute('aria-current', 'true');
      else choice.removeAttribute('aria-current');
    });
    map.querySelectorAll('[data-map-edge]').forEach(edge => {
      edge.classList.toggle('is-connected', edge.dataset.from === id || edge.dataset.to === id);
    });
    title.textContent = panel.querySelector('[data-theme-title]').textContent;
    description.textContent = panel.querySelector('[data-theme-question]').textContent;
    count.textContent = `${panel.dataset.paperCount} papers & preprints · ${panel.dataset.noteCount} reading guides`;
    explore.href = `#${panel.id}`;
    if (announce) status.textContent = `Showing ${title.textContent}: ${count.textContent}.`;
  };
  choices.forEach(choice => choice.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const id = choice.dataset.mapChoice;
    if (!byId.has(id)) return;
    event.preventDefault();
    select(id, true);
    try { history.replaceState(null, '', `#theme-${id}`); } catch (_) { /* Local-file previews can restrict history. */ }
    // Connected-area links sit below the resources: bring the updated overview into view.
    if (!map.contains(choice)) {
      map.scrollIntoView({block: 'start', behavior: 'auto'});
      const node = map.querySelector(`[data-map-choice="${id}"]`);
      if (node) node.focus({preventScroll: true});
    }
  }));
  window.addEventListener('hashchange', () => { if (byId.has(fromHash())) select(fromHash(), true); });
  select(byId.has(fromHash()) ? fromHash() : panels[0].dataset.mapPanel);
})();
