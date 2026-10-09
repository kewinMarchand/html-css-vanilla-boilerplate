import { expect, test } from '@playwright/test'

import { ROUTES } from './routes.js'

for (const route of ROUTES) {
  test(`la page ${route} répond 200 sans erreur console`, async ({ page }) => {
    const errors = []
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    page.on('pageerror', (error) => errors.push(error.message))

    const response = await page.goto(route)

    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    expect(errors).toEqual([])
  })
}

for (const route of ['/route-inexistante', '/catalogue/categorie-inconnue']) {
  test(`${route} répond 404 avec la page introuvable`, async ({ page }) => {
    const response = await page.goto(route)

    expect(response?.status()).toBe(404)
    await expect(page.getByRole('heading', { level: 1, name: 'Page introuvable' })).toBeVisible()
    await expect(page.getByTestId('error-home-link')).toHaveAttribute('href', '/')
    await expect(page.getByTestId('layout-breadcrumb')).toContainText('Page introuvable')
  })
}

test('la route de test répond 500 avec un message neutre', async ({ page }) => {
  const response = await page.goto('/_erreur-test')

  expect(response?.status()).toBe(500)
  await expect(
    page.getByRole('heading', { level: 1, name: 'Une erreur est survenue' }),
  ).toBeVisible()
  await expect(page.getByTestId('error-retry')).toBeVisible()
  await expect(page.locator('main')).not.toContainText(/error|stack|exception/i)
})

test('le footer reste collé en bas sur une page courte', async ({ page }) => {
  await page.goto('/route-inexistante')

  const footer = await page.getByRole('contentinfo').boundingBox()
  const viewport = page.viewportSize()

  expect(footer && viewport && Math.round(footer.y + footer.height)).toBe(viewport?.height)
})

test('le footer liste les quatre pages légales', async ({ page }) => {
  await page.goto('/')

  const legalNav = page.getByRole('navigation', { name: 'Liens légaux' })
  await expect(legalNav.getByRole('link')).toHaveCount(4)
  await expect(legalNav.getByRole('link', { name: /^Accessibilité : / })).toHaveAttribute(
    'href',
    '/accessibilite',
  )
})

test('la charte graphique est servie en développement avec ses dix sections', async ({ page }) => {
  const response = await page.goto('/charte-graphique')

  expect(response?.status()).toBe(200)
  await expect(page.locator('[data-styleguide] > section > h2')).toHaveCount(10)
  await expect(page.locator('[data-color-contrast]').first()).toContainText(':1')
  await expect(page.getByRole('link', { name: /Charte graphique/ })).toBeVisible()
})
