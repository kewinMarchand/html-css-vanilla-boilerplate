import { createServer } from 'node:http'
import { gunzipSync } from 'node:zlib'

import { expect, test } from '@playwright/test'

import { OBSERVABILITY_PORT } from '../../playwright.config.js'

// Second serveur de développement lancé par Playwright avec des valeurs factices : son DSN
// pointe vers le faux GlitchTip local ci-dessous. Aucune instance réelle n'est contactée.
const OBSERVED = `http://localhost:${OBSERVABILITY_PORT}`
const GLITCHTIP_PORT = 3231

const envelopes = []
const events = () => envelopes.filter((body) => body.includes('"type":"event"'))

const startFakeGlitchtip = () =>
  createServer((request, response) => {
    response.setHeader('access-control-allow-origin', '*')
    response.setHeader('access-control-allow-headers', '*')
    if (request.method === 'OPTIONS') {
      response.writeHead(204).end()
      return
    }
    const chunks = []
    request.on('data', (chunk) => chunks.push(chunk))
    request.on('end', () => {
      const body = Buffer.concat(chunks)
      const gzipped = request.headers['content-encoding'] === 'gzip'
      envelopes.push((gzipped ? gunzipSync(body) : body).toString('utf8'))
      response.writeHead(200, { 'content-type': 'application/json' }).end('{}')
    })
  }).listen(GLITCHTIP_PORT)

const throwInBrowser = async (page, message) => {
  await page.evaluate((text) => {
    setTimeout(() => {
      throw new Error(text)
    })
  }, message)
}

test('sans configuration, aucun traceur n’est chargé', async ({ page }) => {
  const requests = []
  page.on('request', (request) => requests.push(request.url()))
  await page.goto('/contact')
  await page.waitForLoadState('load')

  await expect(page.locator('script[data-glitchtip-dsn]')).toHaveCount(0)
  expect(requests.filter((url) => url.includes('sentry-browser'))).toEqual([])
})

test.describe('Suivi des erreurs GlitchTip, avec un DSN factice', () => {
  test.describe.configure({ mode: 'serial' })

  let glitchtip

  test.beforeAll(() => {
    test.skip(test.info().project.name !== 'desktop', 'vérification des envois, une seule fois')
    glitchtip = startFakeGlitchtip()
  })

  test.afterAll(() => {
    glitchtip?.close()
  })

  test.beforeEach(() => {
    envelopes.length = 0
  })

  test('une erreur du navigateur est envoyée après l’affichage', async ({ page }) => {
    await page.goto(`${OBSERVED}/`)
    await page.waitForFunction(() => typeof window.Sentry?.getClient?.() === 'object')
    await throwInBrowser(page, 'Erreur navigateur volontaire')

    await expect
      .poll(() => events().some((body) => body.includes('Erreur navigateur volontaire')))
      .toBe(true)
  })

  test('rien n’est chargé ni envoyé pour une 404', async ({ page }) => {
    const requests = []
    page.on('request', (request) => requests.push(request.url()))
    expect((await page.goto(`${OBSERVED}/route-inexistante`))?.status()).toBe(404)
    await page.waitForLoadState('load')
    await throwInBrowser(page, 'Erreur sur une 404')

    await expect(page.locator('script[data-glitchtip-dsn]')).toHaveCount(0)
    expect(requests.filter((url) => url.includes('sentry-browser'))).toEqual([])
    expect(events()).toEqual([])
  })
})
