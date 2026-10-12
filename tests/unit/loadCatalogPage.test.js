import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { loadCatalogPage } from '../../site/js/modules/catalog/application/loadCatalogPage.js'
import { DEFAULT_QUERY } from '../../site/js/modules/catalog/domain/catalogQuery.js'

describe('cas d’utilisation : afficher une page du catalogue', () => {
  it('renvoie le résultat et la requête inchangée quand la page existe', async () => {
    const page = await loadCatalogPage({ categorySlug: 'feuillages', query: DEFAULT_QUERY })

    assert.equal(page.status, 'ok')
    assert.equal(page.result.total, 6)
    assert.deepEqual(page.query, DEFAULT_QUERY)
  })

  it('ramène une page hors limites à la dernière et corrige la requête', async () => {
    const page = await loadCatalogPage({ categorySlug: null, query: { ...DEFAULT_QUERY, page: 9 } })

    assert.equal(page.status, 'ok')
    assert.equal(page.query.page, 2)
    assert.equal(page.result.items.length, 12)
  })

  it('transforme un échec du dépôt en résultat d’erreur au message français', async () => {
    const page = await loadCatalogPage({
      categorySlug: null,
      query: DEFAULT_QUERY,
      scenario: 'error',
    })

    assert.deepEqual(page, {
      status: 'error',
      message: 'Impossible de charger les produits pour le moment.',
    })
  })
})
