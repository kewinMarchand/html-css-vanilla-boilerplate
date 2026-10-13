const config = document.querySelector('script[data-glitchtip-dsn]').dataset

/**
 * Suivi des erreurs du navigateur par GlitchTip. Ce script n'est inclus dans la page que si un DSN
 * est configuré, et jamais sur les pages d'erreur attendues. Le SDK, bundle officiel « erreurs
 * seules », se charge après l'affichage (événement load), sans donnée personnelle ni trace.
 */
const loadSdk = () => {
  const sdk = document.createElement('script')
  sdk.src = '/vendor/sentry-browser.min.js'
  sdk.async = true
  sdk.addEventListener(
    'load',
    () =>
      window.Sentry.init({
        dsn: config.glitchtipDsn,
        environment: config.glitchtipEnvironment,
        sendDefaultPii: false,
        tracesSampleRate: 0,
      }),
    { once: true },
  )
  document.head.append(sdk)
}

if (document.readyState === 'complete') {
  loadSdk()
} else {
  window.addEventListener('load', loadSdk, { once: true })
}
