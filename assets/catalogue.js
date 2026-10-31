/* Progressive enhancement: the complete catalogue is readable without JS. */
(() => {
  let copySequence = 0;
  const copyButtonStates = new WeakMap();
  let manualDialog;
  let returnFocus;

  function createManualDialog() {
    const dialog = document.createElement('dialog');
    dialog.id = 'share-dialog';
    dialog.hidden = true;
    const form = document.createElement('form');
    form.method = 'dialog';
    const heading = document.createElement('h2');
    heading.id = 'share-dialog-title';
    heading.textContent = 'Copy link';
    const help = document.createElement('p');
    const label = document.createElement('label');
    label.textContent = 'Link';
    const input = document.createElement('input');
    input.id = 'share-link';
    input.type = 'url';
    input.readOnly = true;
    label.append(input);
    const close = document.createElement('button');
    close.className = 'button';
    close.value = 'close';
    close.textContent = 'Close';
    form.append(heading, help, label, close);
    dialog.append(form);
    document.body.append(dialog);
    return dialog;
  }

  function showManualCopy(value, trigger, catalogue, feedback) {
    const dialog = document.getElementById('share-dialog') || createManualDialog();
    const input = dialog.querySelector('#share-link');
    const heading = dialog.querySelector('#share-dialog-title');
    const help = dialog.querySelector('p');
    if (input && heading && typeof dialog.showModal === 'function') {
      dialog.classList.add('catalogue-share-dialog');
      dialog.setAttribute('aria-labelledby', heading.id);
      if (help) {
        help.id = 'share-dialog-help';
        help.textContent = 'Automatic copying is unavailable. Copy the selected link using your device’s copy command, then close this window.';
        dialog.setAttribute('aria-describedby', help.id);
      }
      input.value = value;
      input.readOnly = true;
      if (manualDialog !== dialog) {
        dialog.addEventListener('close', () => {
          dialog.hidden = true;
          if (returnFocus && returnFocus.isConnected) returnFocus.focus();
          returnFocus = undefined;
        });
        manualDialog = dialog;
      }
      returnFocus = trigger;
      try {
        dialog.hidden = false;
        if (!dialog.open) dialog.showModal();
        input.focus();
        input.select();
        feedback.textContent = 'Copy the selected link in the open window.';
        return;
      } catch (_) {
        returnFocus = undefined;
      }
    }

    // Keep manual copying available even in browsers without native dialogs.
    dialog.hidden = true;
    const previous = catalogue.querySelector('.catalogue-manual-copy');
    if (previous) previous.remove();
    const panel = document.createElement('div');
    panel.className = 'catalogue-manual-copy';
    panel.setAttribute('role', 'group');
    panel.setAttribute('aria-label', 'Copy link manually');
    const helpText = document.createElement('p');
    helpText.textContent = 'Automatic copying is unavailable. Copy the selected link using your device’s copy command.';
    const label = document.createElement('label');
    label.textContent = 'Link';
    const manualInput = document.createElement('input');
    manualInput.type = 'url';
    manualInput.readOnly = true;
    manualInput.value = value;
    label.append(manualInput);
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'copy-button';
    close.textContent = 'Close';
    close.addEventListener('click', () => {
      panel.remove();
      if (trigger.isConnected) trigger.focus();
    });
    panel.append(helpText, label, close);
    feedback.insertAdjacentElement('afterend', panel);
    manualInput.focus();
    manualInput.select();
    feedback.textContent = 'Copy the selected link below.';
  }

  async function copyLink(value, trigger, catalogue, feedback) {
    const sequence = ++copySequence;
    let buttonState = copyButtonStates.get(trigger);
    if (!buttonState) {
      buttonState = { label: trigger.textContent, request: 0, timer: undefined };
      copyButtonStates.set(trigger, buttonState);
    }
    const request = ++buttonState.request;
    clearTimeout(buttonState.timer);
    buttonState.timer = undefined;
    trigger.textContent = buttonState.label;
    feedback.textContent = 'Copying link…';
    try {
      if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
        throw new Error('Clipboard unavailable');
      }
      await navigator.clipboard.writeText(value);
      if (request === buttonState.request) {
        trigger.textContent = 'Copied';
        buttonState.timer = setTimeout(() => {
          if (request !== buttonState.request) return;
          trigger.textContent = buttonState.label;
          buttonState.timer = undefined;
        }, 2000);
      }
      if (sequence === copySequence) feedback.textContent = 'Link copied.';
    } catch (_) {
      if (sequence === copySequence) showManualCopy(value, trigger, catalogue, feedback);
    }
  }

  document.querySelectorAll('[data-catalogue]').forEach(catalogue => {
    const form = catalogue.querySelector('[data-filters]');
    const items = [...catalogue.querySelectorAll('[data-item]')];
    const groups = [...catalogue.querySelectorAll('[data-group]')];
    const count = catalogue.querySelector('[data-count]');
    const empty = catalogue.querySelector('[data-empty]');
    if (!form || !count || !empty) return;
    let feedback = catalogue.querySelector('[data-copy-feedback]');
    if (!feedback) {
      feedback = document.createElement('p');
      feedback.className = 'copy-feedback';
      feedback.setAttribute('data-copy-feedback', '');
      feedback.setAttribute('role', 'status');
      feedback.setAttribute('aria-live', 'polite');
      count.insertAdjacentElement('afterend', feedback);
    }
    const controls = [['query', 'q'], ['topic', 'topic'], ['year', 'year'], ['status', 'status'], ['format', 'format']]
      .map(([name, parameter]) => ({ control: form.elements.namedItem(name), parameter }))
      .filter(({ control }) => control);
    const normalise = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();

    function filter() {
      const values = new FormData(form);
      const query = normalise(values.get('query')).trim().split(/\s+/).filter(Boolean);
      let visible = 0;
      items.forEach(item => {
        const text = normalise(item.dataset.search);
        const matches = query.every(word => text.includes(word)) && ['topic', 'year', 'status', 'format'].every(key => !values.get(key) || (item.dataset[key] === values.get(key) || (key === 'status' && values.get(key) === 'Submitted' && item.dataset.status === 'Preprint')));
        item.hidden = !matches;
        if (matches) visible++;
      });
      groups.forEach(group => { group.hidden = ![...group.querySelectorAll('[data-item]')].some(item => !item.hidden); });
      count.textContent = `${visible} of ${items.length} ${catalogue.dataset.kind}`;
      empty.hidden = visible > 0;
    }

    function applyURL() {
      const parameters = new URL(window.location.href).searchParams;
      controls.forEach(({ control, parameter }) => {
        const value = parameters.get(parameter) || '';
        control.value = control.tagName === 'SELECT' && ![...control.options].some(option => option.value === value) ? '' : value;
      });
      feedback.textContent = '';
      filter();
    }

    function updateURL() {
      const url = new URL(window.location.href);
      controls.forEach(({ control, parameter }) => {
        if (control.value) url.searchParams.set(parameter, control.value);
        else url.searchParams.delete(parameter);
      });
      try {
        window.history.replaceState(window.history.state, '', url.href);
      } catch (_) {
        // Filtering still works when a local-file preview restricts history.
      }
      feedback.textContent = '';
      filter();
    }

    applyURL();
    form.addEventListener('submit', event => { event.preventDefault(); updateURL(); });
    form.addEventListener('input', updateURL);
    form.addEventListener('change', updateURL);
    form.addEventListener('reset', () => requestAnimationFrame(updateURL));
    const clear = catalogue.querySelector('[data-clear]');
    if (clear) clear.addEventListener('click', () => {
      form.reset();
      const query = form.elements.namedItem('query');
      if (query) query.focus();
    });
    window.addEventListener('popstate', applyURL);
    catalogue.querySelectorAll('[data-copy-view]').forEach(button => {
      button.addEventListener('click', () => copyLink(window.location.href, button, catalogue, feedback));
      button.hidden = false;
    });
    items.forEach(item => {
      if (!item.id) return;
      item.querySelectorAll('[data-copy-link]').forEach(button => {
        button.addEventListener('click', () => {
          const url = new URL(window.location.href);
          url.search = '';
          url.hash = item.id;
          copyLink(url.href, button, catalogue, feedback);
        });
        button.hidden = false;
      });
    });
    form.hidden = false;
  });
})();
