import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { CATEGORIES, PRODUCTS } from '../../site/js/modules/catalog/infrastructure/catalogData.js'
import {
  activeFilters,
  clearFilters,
  countActiveFilters,
  DEFAULT_QUERY,
  isFiltered,
  parseQuery,
  serializeQuery,
  withFilters,
} from '../../site/js/modules/catalog/domain/catalogQuery.js'
import {
  formatPrice,
  formatResultsCount,
  paginationWindow,
  searchCatalog,
  sortProducts,
} from '../../site/js/modules/catalog/domain/catalogSearch.js'

const search = (categorySlug, changes = {}) =>
  searchCatalog({
    products: PRODUCTS,
    categories: CATEGORIES,
    categorySlug,
    query: { ...DEFAULT_QUERY, ...changes },
  })

describe('requête du catalogue', () => {
  it('fait l’aller-retour URL vers requête vers URL', () => {
    const url =
      'exposition=soleil&exposition=ombre&taille=L&prix_min=10&prix_max=50&en_stock=1&tri=prix-asc&vue=liste&page=2'
    assert.equal(serializeQuery(parseQuery(new URLSearchParams(url))), url)
  })

  it('ignore les valeurs invalides', () => {
    const query = parseQuery(
      new URLSearchParams(
        'exposition=lune&taille=XL&prix_min=-3&tri=hasard&vue=mosaique&page=1&en_stock=oui',
      ),
    )
    assert.deepEqual(query, DEFAULT_QUERY)
    assert.equal(serializeQuery(query), '')
  })

  it('remet la page à 1 et conserve la vue à chaque changement de filtre', () => {
    const query = { ...DEFAULT_QUERY, view: 'liste', page: 3 }
    const next = withFilters(query, { sizes: ['M'] })
    assert.equal(next.page, 1)
    assert.equal(next.view, 'liste')
    assert.deepEqual(clearFilters({ ...next, sort: 'nom' }), { ...DEFAULT_QUERY, view: 'liste' })
  })

  it('compte et décrit les filtres actifs', () => {
    const query = { ...DEFAULT_QUERY, exposures: ['mi-ombre'], priceMax: 30, inStock: true }
    assert.equal(countActiveFilters(query), 3)
    assert.deepEqual(
      activeFilters(query).map((filter) => filter.label),
      ['Mi-ombre', 'Prix maximum : 30 €', 'En stock'],
    )
    assert.equal(isFiltered(DEFAULT_QUERY), false)
    assert.equal(isFiltered({ ...DEFAULT_QUERY, sort: 'nom' }), true)
  })
})

describe('recherche dans le catalogue', () => {
  it('limite les produits à la branche de la catégorie', () => {
    assert.equal(search(null).total, 24)
    assert.equal(search('plantes-interieur').total, 12)
    assert.equal(search('feuillages').total, 6)
    assert.equal(search('monstera').total, 3)
  })

  it('combine les valeurs d’une facette en OU et les facettes en ET', () => {
    const result = search('feuillages', { exposures: ['ombre', 'mi-ombre'], sizes: ['S'] })
    assert.deepEqual(
      result.items.map((product) => product.slug),
      ['monstera-adansonii', 'asplenium-nidus'],
    )
  })

  it('compte chaque valeur sans appliquer sa propre facette (comptage disjonctif)', () => {
    const result = search('feuillages', { exposures: ['ombre'] })
    assert.deepEqual(result.exposureCounts, { soleil: 0, 'mi-ombre': 4, ombre: 2 })
    assert.deepEqual(result.sizeCounts, { S: 1, M: 1, L: 0 })
    assert.deepEqual(
      result.categoryCounts.map(({ category, count }) => [category.slug, count]),
      [
        ['monstera', 0],
        ['fougeres', 2],
      ],
    )
  })

  it('filtre par prix en euros et par stock', () => {
    const result = search(null, { priceMin: 80, inStock: true })
    assert.ok(result.items.every((product) => product.price >= 8000 && product.inStock))
  })

  it('trie par prix et par nom', () => {
    const prices = sortProducts(PRODUCTS, 'prix-asc').map((product) => product.price)
    assert.deepEqual(
      prices,
      prices.toSorted((a, b) => a - b),
    )
    assert.equal(sortProducts(PRODUCTS, 'nom')[0].name, 'Anthurium andreanum rouge')
    assert.equal(sortProducts(PRODUCTS, 'pertinence'), PRODUCTS)
  })

  it('pagine par 12 et ramène une page hors limites à la dernière', () => {
    assert.equal(search(null).items.length, 12)
    assert.equal(search(null, { page: 2 }).items.length, 12)
    assert.equal(search(null, { page: 9 }).page, 2)
    assert.equal(search('monstera').pageCount, 1)
  })
})

describe('pagination et formats', () => {
  it('affiche toutes les pages jusqu’à 7', () => {
    assert.deepEqual(paginationWindow(3, 7), [1, 2, 3, 4, 5, 6, 7])
  })

  it('insère des ellipses au-delà de 7 pages', () => {
    assert.deepEqual(paginationWindow(5, 10), [1, '…', 4, 5, 6, '…', 10])
    assert.deepEqual(paginationWindow(1, 10), [1, 2, '…', 10])
    assert.deepEqual(paginationWindow(10, 10), [1, '…', 9, 10])
  })

  it('formate les prix et les compteurs', () => {
    assert.equal(formatPrice(3490).replace(/\s/g, ' '), '34,90 €')
    assert.equal(formatResultsCount(1), '1 produit')
    assert.equal(formatResultsCount(12), '12 produits')
  })
})
