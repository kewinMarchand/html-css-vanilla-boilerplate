for (const opener of document.querySelectorAll('[data-dialog-open]')) {
  const dialog = document.getElementById(opener.dataset.dialogOpen)

  opener.addEventListener('click', () => dialog.showModal())
  dialog.addEventListener('close', () => opener.focus())
}
