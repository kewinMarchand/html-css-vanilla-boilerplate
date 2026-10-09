import { expect, test } from '@playwright/test'

test.describe('Mode accessibilité renforcée', () => {
  test('est désactivé par défaut', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('html')).not.toHaveAttribute('data-a11y-mode')
    await expect(page.getByTestId('a11y-mode-toggle')).toHaveAttribute('aria-pressed', 'false')
  })

  test('s’active, persiste après rechargement et se désactive', async ({ page }) => {
    await page.goto('/')
    const toggle = page.getByTestId('a11y-mode-toggle')
    const html = page.locator('html')

    await toggle.click()
    await expect(html).toHaveAttribute('data-a11y-mode', 'enhanced')
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await expect(html).toHaveCSS('font-size', '16px')
    await expect(page.locator('body')).toHaveCSS('font-size', '20px')

    await page.reload()
    await expect(html).toHaveAttribute('data-a11y-mode', 'enhanced')
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')

    await page.goto('/contact')
    await expect(html).toHaveAttribute('data-a11y-mode', 'enhanced')

    await toggle.click()
    await expect(html).not.toHaveAttribute('data-a11y-mode')
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await page.reload()
    await expect(html).not.toHaveAttribute('data-a11y-mode')
  })
})
