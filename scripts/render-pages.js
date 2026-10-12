import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { renderSsi, sitePages } from './ssi.js'

const ROOT = fileURLToPath(new URL('../site/', import.meta.url))
const OUTPUT = process.argv[2]

rmSync(OUTPUT, { recursive: true, force: true })
for (const file of sitePages(ROOT)) {
  const html = renderSsi(readFileSync(file, 'utf8'), {
    readInclude: (path) => readFileSync(join(ROOT, path), 'utf8'),
  })
  const target = join(OUTPUT, relative(ROOT, file))
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, html)
}
