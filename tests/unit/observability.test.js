import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'

import {
  glitchtipOrigin,
  observabilityVariables,
  resolveVariables,
} from '../../scripts/observability.js'
import { PAGES, renderPage, ROOT } from './renderedPages.js'

const DSN = 'https://cle@glitchtip.example.com/1'
const NONE = observabilityVariables({})
const CONFIGURED = observabilityVariables({
  GLITCHTIP_DSN: DSN,
  GLITCHTIP_ENVIRONMENT: 'production',
})

const scriptTags = (html) =>
  [...html.matchAll(/<script\b([^>]*)>/g)].map(([, attributes]) =>
    Object.fromEntries(
      [...attributes.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, name, value]) => [name, value]),
    ),
  )

const glitchtipScripts = (html) =>
  scriptTags(html).filter((attributes) => attributes.src === '/js/shared/glitchtip.js')

const csp = (variables) => {
  const conf = readFileSync(join(ROOT, 'docker/security-headers.conf'), 'utf8')
  const value = conf.match(/add_header Content-Security-Policy "([^"]*)"/)[1]
  return Object.fromEntries(
    resolveVariables(value, variables)
      .split(';')
      .map((directive) => directive.trim().split(/\s+/))
      .map(([name, ...sources]) => [name, sources]),
  )
}

const page = (route) => PAGES.find((item) => item.route === route)

describe('GlitchTip', () => {
  it('lit l’origine d’un DSN au format Sentry', () => {
    assert.equal(glitchtipOrigin(DSN), 'https://glitchtip.example.com')
    assert.equal(glitchtipOrigin('http://cle@localhost:3231/1'), 'http://localhost:3231')
    assert.equal(glitchtipOrigin(''), '')
  })

  it('n’injecte aucun script et n’ouvre aucune origine sans DSN', () => {
    for (const { route, source } of PAGES) {
      assert.deepEqual(glitchtipScripts(renderPage(source, NONE)), [], route)
    }
    assert.deepEqual(csp(NONE)['connect-src'], ["'self'"])
  })

  it('injecte le DSN et l’environnement sur les pages ordinaires', () => {
    assert.deepEqual(glitchtipScripts(renderPage(page('/contact').source, CONFIGURED)), [
      {
        type: 'module',
        src: '/js/shared/glitchtip.js',
        'data-glitchtip-dsn': DSN,
        'data-glitchtip-environment': 'production',
      },
    ])
    assert.deepEqual(csp(CONFIGURED)['connect-src'], ["'self'", 'https://glitchtip.example.com'])
  })

  it('ne charge rien sur les pages d’erreur attendues', () => {
    for (const route of ['/404', '/405', '/50x', '/503']) {
      assert.deepEqual(glitchtipScripts(renderPage(page(route).source, CONFIGURED)), [], route)
    }
  })

  it('échappe une valeur injectée', () => {
    const [script] = glitchtipScripts(
      renderPage(page('/').source, { ...CONFIGURED, glitchtip_environment: 'a"b<c' }),
    )
    assert.equal(script['data-glitchtip-environment'], 'a&quot;b&lt;c')
  })
})
