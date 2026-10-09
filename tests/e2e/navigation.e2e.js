import { expect, test } from '@playwright/test'

test.describe('Navigation', () => {
  test('le lien actif porte aria-current', async ({ page, isMobile }) => {
    test.skip(isMobile, 'la navigation principale passe dans le menu mobile')
    await page.goto('/contact')

    const nav = page.getByRole('navigation', { name: 'Navigation principale' })
    await expect(nav.getByRole('link', { name: 'Contact' })).toHaveAttribute('aria-current', 'page')
    await expect(nav.getByRole('link', { name: 'Accueil' })).not.toHaveAttribute('aria-current')
  })

  test('le lien d’évitement mène au contenu principal', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')

    const skipLink = page.getByRole('link', { name: 'Aller au contenu principal' })
    await expect(skipLink).toBeFocused()
    await skipLink.press('Enter')
    await expect(page).toHaveURL(/#main$/)
  })
})
