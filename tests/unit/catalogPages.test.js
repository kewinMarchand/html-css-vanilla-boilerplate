import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { breadcrumbTrail } from '../../lib/breadcrumb.js'
import { listCategoryPaths } from '../../site/js/modules/catalog/domain/categoryPath.js'
import { CATEGORIES } from '../../lib/categoryTree.js'
import { PAGES } from './renderedPages.js'

describe('pages statiques du catalogue', () => {
  it('ne contient aucune donnée de produit, toutes lues dans l’API', () => {
    for (const { route, html } of PAGES.filter((page) => page.route.startsWith('/catalogue'))) {
      const outsideTemplates = html.replace(/<template[\s\S]*?<\/template>/g, '')
      assert.ok(!outsideTemplates.includes('data-testid="catalog-product"'), route)
      assert.ok(html.includes('id="catalog-product-template"'), route)
    }
  })

  it('a une page statique pour chaque chemin de catégorie, et aucune autre', () => {
    const catalogPages = PAGES.map((page) => page.route).filter((route) =>
      route.startsWith('/catalogue/'),
    )
    assert.deepEqual(catalogPages.toSorted(), listCategoryPaths(CATEGORIES).toSorted())
  })
})

describe('fil d’Ariane du catalogue', () => {
  it('suit l’arbre des catégories', () => {
    assert.deepEqual(
      breadcrumbTrail('/catalogue/plantes-interieur/feuillages', 'Feuillages').map(
        (item) => item.label,
      ),
      ['Accueil', 'Catalogue', "Plantes d'intérieur", 'Feuillages'],
    )
  })

  it('refuse un chemin de catalogue qui ne suit pas l’arbre', () => {
    assert.throws(() => breadcrumbTrail('/catalogue/plantes-exterieur/feuillages', 'Feuillages'), {
      message: 'Chemin de catégorie inconnu : /catalogue/plantes-exterieur/feuillages',
    })
  })
})
