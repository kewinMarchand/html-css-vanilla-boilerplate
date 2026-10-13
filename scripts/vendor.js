import { cpSync } from 'node:fs'

const SENTRY_VERSION = '11.6.0'

const FILES = [
  ['node_modules/embla-carousel/esm/embla-carousel.esm.js', 'site/vendor/embla-carousel.esm.js'],
  [
    'node_modules/embla-carousel/esm/embla-carousel.esm.js.map',
    'site/vendor/embla-carousel.esm.js.map',
  ],
  [`vendor/sentry/sentry-browser-${SENTRY_VERSION}.min.js`, 'site/vendor/sentry-browser.min.js'],
]

for (const [from, to] of FILES) cpSync(from, to)
