import { cpSync } from 'node:fs'

const FILES = [
  ['node_modules/embla-carousel/esm/embla-carousel.esm.js', 'site/vendor/embla-carousel.esm.js'],
  [
    'node_modules/embla-carousel/esm/embla-carousel.esm.js.map',
    'site/vendor/embla-carousel.esm.js.map',
  ],
]

for (const [from, to] of FILES) cpSync(from, to)
