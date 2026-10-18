/* Google Drive is contacted only after the reader explicitly requests a preview. */
(() => {
  if (typeof HTMLDialogElement === 'undefined') return;
  let dialog;
  let opener;
  const closeReader = () => dialog.close();

  function createReader() {
    dialog = document.createElement('dialog');
    dialog.className = 'notes-reader';
    dialog.setAttribute('aria-labelledby', 'notes-reader-title');
    dialog.innerHTML = '<div class="notes-reader-header"><h2 id="notes-reader-title"></h2><button class="reader-close" type="button" autofocus>Close preview</button></div><p class="notes-reader-help">Preview from Google Drive. If the reader does not open, <a target="_blank" rel="noopener">open the original PDF in a new tab</a>.</p><div class="notes-reader-frame"></div>';
    dialog.querySelector('button').addEventListener('click', closeReader);
    dialog.addEventListener('close', () => {
      dialog.querySelector('.notes-reader-frame').replaceChildren();
      if (opener?.isConnected) opener.focus();
    });
    document.body.append(dialog);
  }

  document.querySelectorAll('[data-note-preview]').forEach(button => {
    button.hidden = false;
    button.addEventListener('click', () => {
      if (!dialog) createReader();
      opener = button;
      dialog.querySelector('h2').textContent = button.dataset.noteTitle;
      dialog.querySelector('a').href = button.dataset.pdfUrl;
      const frame = document.createElement('iframe');
      frame.title = 'PDF preview: ' + button.dataset.noteTitle;
      frame.referrerPolicy = 'no-referrer';
      frame.allow = 'fullscreen';
      frame.src = button.dataset.notePreview;
      dialog.querySelector('.notes-reader-frame').replaceChildren(frame);
      dialog.showModal();
    });
  });
})();
