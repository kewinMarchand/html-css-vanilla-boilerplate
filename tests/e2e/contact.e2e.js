import { expect, test } from '@playwright/test'

test.describe('Contact', () => {
  test('affiche les erreurs de validation quand le formulaire est vide', async ({ page }) => {
    await page.goto('/contact')
    await page.getByTestId('contact-submit').click()

    const name = page.getByTestId('contact-name')
    await expect(name).toHaveAttribute('aria-invalid', 'true')
    await expect(name).toBeFocused()
    await expect(name).toHaveAccessibleDescription('Indiquez votre nom (2 caractères minimum).')
    await expect(page.getByTestId('contact-email-error')).toHaveText(
      'Indiquez une adresse e-mail valide, par exemple nom@domaine.fr.',
    )
    await expect(page.getByTestId('contact-message-error')).toHaveText(
      'Votre message doit contenir au moins 10 caractères.',
    )
    await expect(page.getByTestId('contact-success')).toHaveCount(0)
  })

  test('valide un champ à la sortie et retire l’erreur une fois corrigé', async ({ page }) => {
    await page.goto('/contact')
    const email = page.getByTestId('contact-email')

    await email.fill('ada')
    await email.blur()
    await expect(email).toHaveAttribute('aria-invalid', 'true')

    await email.fill('ada@exemple.fr')
    await expect(email).not.toHaveAttribute('aria-invalid')
    await expect(page.getByTestId('contact-email-error')).toBeEmpty()
  })

  test('confirme l’envoi quand le formulaire est valide', async ({ page }) => {
    await page.goto('/contact')
    await page.getByTestId('contact-name').fill('Ada')
    await page.getByTestId('contact-email').fill('ada@exemple.fr')
    await page.getByTestId('contact-message').fill('Bonjour, ceci est un message.')
    await page.getByTestId('contact-submit').click()

    await expect(page.getByTestId('contact-success')).toBeVisible()
    await expect(page.getByTestId('contact-noscript')).toHaveCount(0)
    await expect(page.getByTestId('contact-error')).toHaveCount(0)
    await expect(page.getByTestId('contact-name')).toHaveValue('')
  })

  test('affiche sous le champ la violation renvoyée par l’API', async ({ page }) => {
    await page.goto('/contact')
    await page.getByTestId('contact-name').fill('A'.repeat(300))
    await page.getByTestId('contact-email').fill('ada@exemple.fr')
    await page.getByTestId('contact-message').fill('Bonjour, ceci est un message.')
    await page.getByTestId('contact-submit').click()

    await expect(page.getByTestId('contact-name-error')).toHaveText(
      'Votre nom ne doit pas dépasser 255 caractères.',
    )
    await expect(page.getByTestId('contact-name')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByTestId('contact-success')).toHaveCount(0)
  })

  test('ouvre la modale, la ferme avec Échap et rend le focus', async ({ page }) => {
    await page.goto('/contact')
    const opener = page.getByTestId('contact-privacy-open')
    const dialog = page.getByTestId('contact-privacy-dialog')

    await expect(dialog).toBeHidden()
    await opener.click()
    await expect(dialog).toBeVisible()
    await expect(page.getByRole('dialog', { name: 'Utilisation de vos données' })).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(opener).toBeFocused()
  })
})

test.describe('Contact sans JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('annonce la limite et répond par une page française en 405', async ({ page }) => {
    await page.goto('/contact')
    await expect(page.getByTestId('contact-noscript')).toBeVisible()

    await page.getByTestId('contact-name').fill('Ada')
    await page.getByTestId('contact-email').fill('ada@exemple.fr')
    await page.getByTestId('contact-message').fill('Bonjour, ceci est un message.')
    const responsePromise = page.waitForResponse(
      (response) => response.request().method() === 'POST',
    )
    await page.getByTestId('contact-submit').click()
    const response = await responsePromise

    expect(response.status()).toBe(405)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Envoi impossible sans JavaScript' }),
    ).toBeVisible()
    await expect(page.getByTestId('error-contact-email')).toHaveAttribute(
      'href',
      'mailto:contact@example.com',
    )
  })
})
