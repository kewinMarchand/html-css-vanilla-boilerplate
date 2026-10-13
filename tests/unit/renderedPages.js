import { readFileSync } from 'node:fs'
import { join, relative } from 'node:path'

import { renderSsi, sitePages } from '../../scripts/ssi.js'

export const ROOT = new URL('../../', import.meta.url).pathname
export const SITE_DIR = join(ROOT, 'site')

export const renderPage = (source, variables = {}) =>
  renderSsi(source, {
    readInclude: (path) => readFileSync(join(SITE_DIR, path), 'utf8'),
    variables: { ...variables },
  })

export const PAGES = sitePages(SITE_DIR).map((file) => {
  const route =
    `/${relative(SITE_DIR, file)}`.replace(/\/?index\.html$/, '').replace(/\.html$/, '') || '/'
  const source = readFileSync(file, 'utf8')
  const html = renderPage(source)
  return { file, route, source, html }
})

export const text = (fragment) =>
  fragment
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
