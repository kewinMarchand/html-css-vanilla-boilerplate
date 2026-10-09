import { expect, test } from '@playwright/test'

import { enableEnhancedMode } from './routes.js'

const panelLink = (page, name) =>
  page.getByTestId('layout-category-menu').getByRole('link', { name, exact: true })

test.describe('Menu de catégories, desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'menu en cascade réservé au desktop')

  test('s’ouvre au clic, déplie une branche au survol et se ferme avec Échap', async ({ page }) => {
    await page.goto('/')
    const toggle = page.getByTestId('layout-category-menu-toggle')

    await expect(page.getByTestId('layout-category-menu')).toBeHidden()
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByTestId('layout-category-menu')).toBeVisible()
    await expect(panelLink(page, 'Feuillages')).toBeHidden()

    await panelLink(page, "Plantes d'intérieur").hover()
    await expect(panelLink(page, "Plantes d'intérieur")).toHaveAttribute('aria-expanded', 'true')
    await expect(panelLink(page, 'Feuillages')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByTestId('layout-category-menu')).toBeHidden()
    await expect(toggle).toBeFocused()
  })

  test('ouvre les colonnes au focus clavier', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('layout-category-menu-toggle').focus()
    await page.keyboard.press('Enter')
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Tout le catalogue' })).toBeFocused()
    await page.keyboard.press('Tab')

    await expect(panelLink(page, "Plantes d'intérieur")).toBeFocused()
    await expect(panelLink(page, "Plantes d'intérieur")).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('ArrowRight')
    await expect(panelLink(page, 'Feuillages')).toBeFocused()
  })

  test('un clic sur une feuille navigue et met à jour le fil d’Ariane', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('layout-category-menu-toggle').click()
    await panelLink(page, "Plantes d'intérieur").hover()
    await panelLink(page, 'Feuillages').hover()
    await panelLink(page, 'Monstera').click()

    await expect(page).toHaveURL(/\/catalogue\/plantes-interieur\/feuillages\/monstera$/)
    await expect(page.getByTestId('layout-breadcrumb').getByRole('listitem').last()).toHaveText(
      'Monstera',
    )
  })

  for (const enhanced of [false, true]) {
    test(`le panneau reste attaché à son bouton (mode ${enhanced ? 'renforcé' : 'standard'})`, async ({
      page,
    }) => {
      if (enhanced) await enableEnhancedMode(page)
      await page.goto('/contact')
      const header = page.locator('header.site-header')
      const h1 = page.getByRole('heading', { level: 1 })
      const before = { header: (await header.boundingBox()).height, h1: (await h1.boundingBox()).y }

      const toggle = page.getByTestId('layout-category-menu-toggle')
      await toggle.click()
      const button = await toggle.boundingBox()
      const panel = await page.getByTestId('layout-category-menu').boundingBox()

      expect(Math.abs(panel.y - (button.y + button.height))).toBeLessThan(12)
      const leftAligned = Math.abs(panel.x - button.x) < 12
      const rightAligned = Math.abs(panel.x + panel.width - (button.x + button.width)) < 12
      expect(leftAligned || rightAligned).toBe(true)
      expect((await header.boundingBox()).height).toBe(before.header)
      expect((await h1.boundingBox()).y).toBe(before.h1)
    })
  }
})

test.describe('Menu mobile', () => {
  test.skip(({ isMobile }) => !isMobile, 'navigation par niveaux réservée au mobile')

  test('navigue par niveaux en déplaçant le focus, puis rend le focus au bouton', async ({
    page,
  }) => {
    await page.goto('/')
    const toggle = page.getByTestId('layout-mobile-menu-toggle')
    const menu = page.getByTestId('layout-mobile-menu')
    const levelTitle = menu.getByRole('heading', { level: 2 })

    await toggle.click()
    await expect(menu).toBeVisible()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(levelTitle).toHaveText('Menu')
    await expect(levelTitle).toBeFocused()

    await page.getByTestId('layout-mobile-menu-level-catalogue').click()
    await expect(levelTitle).toHaveText('Catalogue')
    await expect(levelTitle).toBeFocused()
    await expect(menu.getByRole('link', { name: 'Voir toute la catégorie' })).toHaveAttribute(
      'href',
      '/catalogue',
    )

    await page.getByTestId('layout-mobile-menu-level-plantes-interieur').click()
    await expect(levelTitle).toHaveText("Plantes d'intérieur")
    await expect(page.getByTestId('layout-mobile-menu-back')).toHaveText(/Retour : Catalogue/)

    await page.getByTestId('layout-mobile-menu-back').click()
    await expect(levelTitle).toHaveText('Catalogue')
    await expect(levelTitle).toBeFocused()

    await page.keyboard.press('Escape')
    await expect(menu).toBeHidden()
    await expect(toggle).toBeFocused()
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })
})
