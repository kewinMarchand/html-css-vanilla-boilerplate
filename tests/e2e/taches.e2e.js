import { expect, test } from '@playwright/test'

test.describe('Tâches', () => {
  test('affiche la liste chargée depuis le dépôt', async ({ page }) => {
    await page.goto('/taches')

    await expect(page.getByTestId('tasks-list')).toBeVisible()
    await expect(page.getByTestId('tasks-item')).toHaveCount(3)
    await expect(page.getByTestId('tasks-progress')).toHaveAttribute('value', '1')
  })

  test("n'affiche ni chargement, ni erreur, ni liste vide quand les données sont là", async ({
    page,
  }) => {
    await page.goto('/taches')

    await expect(page.getByTestId('tasks-list')).toBeVisible()
    await expect(page.getByTestId('tasks-loading')).toHaveCount(0)
    await expect(page.getByTestId('tasks-error')).toHaveCount(0)
    await expect(page.getByTestId('tasks-empty')).toHaveCount(0)
  })

  test('affiche l’erreur et relance le chargement', async ({ page }) => {
    await page.goto('/taches?scenario=error')

    await expect(page.getByTestId('tasks-error')).toContainText(
      'Impossible de charger les tâches pour le moment.',
    )
    await expect(page.getByTestId('tasks-list')).toHaveCount(0)

    await page.getByTestId('tasks-retry').click()
    await expect(page.getByTestId('tasks-loading')).toBeVisible()
    await expect(page.getByTestId('tasks-error')).toBeVisible()
  })

  test('affiche un message amical quand la liste est vide', async ({ page }) => {
    await page.goto('/taches?scenario=empty')

    await expect(page.getByTestId('tasks-empty')).toBeVisible()
    await expect(page.getByTestId('tasks-list')).toHaveCount(0)
  })

  test('filtre les tâches et surligne la correspondance', async ({ page }) => {
    await page.goto('/taches')
    await page.getByTestId('tasks-filter').fill('api')

    await expect(page.getByTestId('tasks-item')).toHaveCount(2)
    await expect(page.getByTestId('tasks-item').first().locator('mark')).toHaveText('API')
    await expect(page.getByTestId('tasks-count')).toHaveText('2 tâches affichées sur 3')
    await expect(page.getByTestId('tasks-no-match')).toBeHidden()

    await page.getByTestId('tasks-filter').fill('zzz')
    await expect(page.getByTestId('tasks-item')).toHaveCount(0)
    await expect(page.getByTestId('tasks-no-match')).toHaveText(
      'Aucune tâche ne correspond à « zzz ».',
    )
  })
})
