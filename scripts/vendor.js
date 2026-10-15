import { cpSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const SENTRY_VERSION = '11.6.0'
const UI = 'node_modules/@kewinmarchand/boilerplates-ui'

const FILES = [
  ['node_modules/embla-carousel/esm/embla-carousel.esm.js', 'site/vendor/embla-carousel.esm.js'],
  [
    'node_modules/embla-carousel/esm/embla-carousel.esm.js.map',
    'site/vendor/embla-carousel.esm.js.map',
  ],
  [`vendor/sentry/sentry-browser-${SENTRY_VERSION}.min.js`, 'site/vendor/sentry-browser.min.js'],
]

for (const [from, to] of FILES) cpSync(from, to)

// Tokens et composants de boilerplates-ui en une seule feuille, dans la couche `bui` que main.css place entre
// ses styles d'éléments et ses composants : chaque `@import` serait une requête bloquante de plus.
const inlineImports = (path) =>
  readFileSync(join(UI, path), 'utf8').replace(/^@import '\.\/(.+)';$/gm, (_, file) =>
    inlineImports(join(dirname(path), file)).trim(),
  )

writeFileSync(
  'site/vendor/boilerplates-ui.css',
  `@layer bui {\n${readFileSync(join(UI, 'packages/tokens/generated/tokens.css'), 'utf8')}\n${inlineImports('packages/css/index.css')}\n}\n`,
)
