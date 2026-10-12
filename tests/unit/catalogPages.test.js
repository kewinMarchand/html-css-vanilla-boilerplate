import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { breadcrumbTrail } from '../../lib/breadcrumb.js'
import { listCategoryPaths } from '../../site/js/modules/catalog/domain/categoryPath.js'
import { formatPrice } from '../../site/js/modules/catalog/domain/price.js'
import {
  CATEGORIES,
  PRODUCTS,
} from '../../site/js/modules/catalog/infrastructure/in-memory/catalogData.js'
import { PAGES, text } from './renderedPages.js'

describe('pages statiques du catalogue', () => {
  it('affiche dans chaque carte produit le prix formaté du jeu de données', () => {
    const cards = PAGES.filter((page) => page.route.startsWith('/catalogue')).flatMap(
      ({ html }) => [
        ...html.matchAll(
          /data-product-id="(\d+)"[\s\S]*?data-testid="catalog-product-price">([^<]+)</g,
        ),
      ],
    )
    assert.ok(cards.length > 0)
    for (const [, id, price] of cards) {
      const product = PRODUCTS.find((item) => item.id === Number(id))
      assert.equal(text(price), formatPrice(product.price).replace(/\s/g, ' '), product.name)
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
