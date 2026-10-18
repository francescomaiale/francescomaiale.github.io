/* The full search index remains readable when JavaScript is unavailable. */
(() => {
  'use strict';

  const form = document.querySelector('[data-site-search-form]');
  const results = document.querySelector('[data-search-results]');
  const count = document.querySelector('[data-search-count]');
  const empty = document.querySelector('[data-search-empty]');
  if (!form || !results || !count || !empty) return;

  const queryInput = form.elements.namedItem('q');
  const typeInput = form.elements.namedItem('type');
  if (!queryInput || !typeInput || typeInput.tagName !== 'SELECT') return;

  const status = document.querySelector('[data-search-status]');
  const types = new Set([...typeInput.options].map(option => option.value));
  const fold = value => String(value || '').normalize('NFKD')
    .replace(/\p{M}/gu, '').toLowerCase()
    .replace(/[αγ]/gu, letter => letter === 'α' ? ' alpha ' : ' gamma ');
  const words = value => fold(value).match(/[\p{L}\p{N}]+/gu) || [];
  const searchable = value => words(value).join(' ');

  const entries = [...results.querySelectorAll('[data-search-item]')].map((node, order) => {
    const title = searchable(node.dataset.title);
    const description = searchable(node.dataset.description);
    const keywords = searchable(node.dataset.keywords);
    const type = searchable(node.dataset.type);
    const url = searchable(node.dataset.url);
    return {
      node, order, title, description, keywords, type, url,
      category: node.dataset.type || '',
      text: [title, description, keywords, type, url].join(' ')
    };
  });

  function relevance(entry, terms, phrase) {
    if (!terms.length) return 0;
    let score = 0;
    if (entry.title === phrase) score += 1000;
    else if (entry.title.startsWith(phrase)) score += 300;
    else if (entry.title.includes(phrase)) score += 180;
    if (entry.keywords.includes(phrase)) score += 80;
    if (entry.url.includes(phrase)) score += 45;
    if (entry.description.includes(phrase)) score += 25;
    terms.forEach(term => {
      if (entry.title.includes(term)) score += 30;
      if (entry.keywords.includes(term)) score += 12;
      if (entry.url.includes(term)) score += 8;
      if (entry.description.includes(term)) score += 4;
      if (entry.type.includes(term)) score += 2;
    });
    return score;
  }

  function filter() {
    const terms = [...new Set(words(queryInput.value))];
    const phrase = words(queryInput.value).join(' ');
    const selectedType = types.has(typeInput.value) ? typeInput.value : '';
    const matches = entries.filter(entry =>
      (!selectedType || entry.category === selectedType) &&
      terms.every(term => entry.text.includes(term))
    ).map(entry => ({ entry, score: relevance(entry, terms, phrase) }));
    matches.sort((a, b) => b.score - a.score || a.entry.order - b.entry.order);

    const visible = new Set(matches.map(match => match.entry));
    const fragment = document.createDocumentFragment();
    matches.forEach(({ entry }) => {
      entry.node.hidden = false;
      fragment.appendChild(entry.node);
    });
    entries.forEach(entry => {
      if (visible.has(entry)) return;
      entry.node.hidden = true;
      fragment.appendChild(entry.node);
    });
    results.appendChild(fragment);
    count.textContent = `${matches.length} ${matches.length === 1 ? 'result' : 'results'}`;
    empty.hidden = matches.length > 0;
    if (status) status.textContent = '';
  }

  function applyURL() {
    const parameters = new URL(window.location.href).searchParams;
    queryInput.value = parameters.get('q') || '';
    const requestedType = parameters.get('type') || '';
    typeInput.value = types.has(requestedType) ? requestedType : '';
    filter();
  }

  function update() {
    const url = new URL(window.location.href);
    const query = queryInput.value.trim();
    const selectedType = types.has(typeInput.value) ? typeInput.value : '';
    if (query) url.searchParams.set('q', query);
    else url.searchParams.delete('q');
    if (selectedType) url.searchParams.set('type', selectedType);
    else url.searchParams.delete('type');
    if (['https:', 'http:', 'file:'].includes(url.protocol)) {
      try {
        window.history.replaceState(window.history.state, '', url.href);
      } catch (_) {
        // Search remains usable in previews that restrict history updates.
      }
    }
    filter();
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    update();
  });
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  form.addEventListener('reset', event => {
    event.preventDefault();
    queryInput.value = '';
    typeInput.value = '';
    update();
    queryInput.focus();
  });
  queryInput.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    queryInput.value = '';
    update();
  });
  window.addEventListener('popstate', applyURL);

  applyURL();
  form.hidden = false;
})();
