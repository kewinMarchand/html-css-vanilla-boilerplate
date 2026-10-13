import { expect, test } from '@playwright/test'

import { CATEGORIES } from '../../lib/categoryTree.js'

const API_URL = process.env.API_URL || 'http://localhost:8090'

const flatten = (nodes, parentSlug = null) =>
  nodes.flatMap((node) => [
    { slug: node.slug, name: node.name, parentSlug },
    ...flatten(node.children, node.slug),
  ])

test.describe('Arbre des catégories', () => {
  test.skip(({ isMobile }) => isMobile, 'comparaison de données, une seule fois')

  test('les pages statiques suivent l’arbre de l’API', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/categories`)
    expect(response.ok()).toBe(true)

    const fromApi = flatten(await response.json())
    const fromPages = CATEGORIES.map(({ slug, name, parentSlug }) => ({ slug, name, parentSlug }))
    expect(fromApi).toEqual(fromPages)
  })
})
