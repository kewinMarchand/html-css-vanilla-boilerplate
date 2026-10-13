// Traceur Matomo factice, servi à la place de http://matomo.test/matomo.js : il rejoue la file _paq
// et envoie une requête à matomo.php par trackPageView, comme le vrai traceur.
;(() => {
  const commands = []
  window.__matomoCommands = commands
  let trackerUrl = ''
  let siteId = ''
  let url = window.location.href
  let title = document.title
  const run = (command) => {
    commands.push(command)
    const [name, value] = command
    if (name === 'setTrackerUrl') trackerUrl = value
    if (name === 'setSiteId') siteId = value
    if (name === 'setCustomUrl') url = value
    if (name === 'setDocumentTitle') title = value
    if (name === 'trackPageView') {
      const params = new URLSearchParams({ idsite: siteId, url, action_name: title })
      fetch(`${trackerUrl}?${params}`, { mode: 'no-cors' })
    }
  }
  const queue = window._paq || []
  window._paq = { push: (...items) => items.forEach(run) }
  queue.forEach(run)
})()
