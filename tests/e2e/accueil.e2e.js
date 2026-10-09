import { expect, test } from '@playwright/test'

const currentDot = (page) => page.locator('[data-testid="carousel-dot"][aria-current="true"]')

test.describe('Accueil', () => {
  test('le hero porte le titre, les deux appels à l’action et une image prioritaire', async ({
    page,
  }) => {
    await page.goto('/')

    const hero = page.getByTestId('home-hero')
    await expect(hero.getByRole('heading', { level: 1 })).toHaveText('HTML CSS Vanilla Boilerplate')
    await expect(page.getByTestId('home-tasks-link')).toHaveAttribute('href', '/taches')
    await expect(page.getByTestId('home-contact-link')).toHaveAttribute('href', '/contact')
    await expect(hero.locator('img')).toHaveAttribute('fetchpriority', 'high')
    await expect(hero.locator('img')).not.toHaveAttribute('loading', 'lazy')
    const box = await page.getByTestId('home-tasks-link').boundingBox()
    expect(box?.height).toBeGreaterThanOrEqual(44)
  })

  test('le carrousel avance avec Suivant et désactive Précédent au début', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByTestId('carousel-slide')).toHaveCount(5)
    await expect(page.getByTestId('carousel-prev')).toBeDisabled()
    await expect(currentDot(page)).toHaveAttribute('aria-label', 'Aller à la diapositive 1')

    await page.getByTestId('carousel-next').click()
    await expect(currentDot(page)).toHaveAttribute('aria-label', 'Aller à la diapositive 2')
    await expect(page.getByTestId('carousel-prev')).toBeEnabled()

    await page.getByTestId('carousel-prev').click()
    await expect(currentDot(page)).toHaveAttribute('aria-label', 'Aller à la diapositive 1')
  })

  test('le carrousel se glisse à la souris', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('carousel-track').scrollIntoViewIfNeeded()
    const track = await page.getByTestId('carousel-track').boundingBox()
    const y = track.y + track.height / 2

    await page.mouse.move(track.x + track.width * 0.8, y)
    await page.mouse.down()
    await page.mouse.move(track.x + track.width * 0.3, y, { steps: 10 })
    await page.mouse.up()

    await expect(currentDot(page)).not.toHaveAttribute('aria-label', 'Aller à la diapositive 1')
    await expect(page.getByTestId('carousel-prev')).toBeEnabled()
  })

  test('un geste de trackpad n’avance que d’une diapositive', async ({ page }) => {
    await page.goto('/')
    const track = page.getByTestId('carousel-track')
    await track.scrollIntoViewIfNeeded()
    const box = await track.boundingBox()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)

    for (let index = 0; index < 4; index += 1) await page.mouse.wheel(120, 0)

    await expect(currentDot(page)).toHaveAttribute('aria-label', 'Aller à la diapositive 2')
  })

  test('la grille de blog affiche trois articles datés, sans message vide', async ({ page }) => {
    await page.goto('/')

    const cards = page.getByTestId('home-blog-card')
    await expect(cards).toHaveCount(3)
    await expect(cards.first().locator('time')).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}$/)
    await expect(page.getByTestId('home-blog-empty')).toBeHidden()
  })

  test('la grille de blog affiche un message amical quand elle est vide', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('home-blog-card').evaluateAll((cards) => {
      for (const card of cards) card.remove()
    })

    await expect(page.getByTestId('home-blog-empty')).toBeVisible()
  })
})

test.describe('Accueil sans JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('la piste du carrousel défile nativement', async ({ page }) => {
    await page.goto('/')
    const track = page.getByTestId('carousel-track')

    await expect(page.getByTestId('carousel-next')).toBeHidden()
    await expect(page.getByTestId('carousel-slide').last()).not.toBeInViewport()
    await track.scrollIntoViewIfNeeded()
    const box = await track.boundingBox()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.wheel(5000, 0)
    await expect(page.getByTestId('carousel-slide').last()).toBeInViewport()
  })
})
