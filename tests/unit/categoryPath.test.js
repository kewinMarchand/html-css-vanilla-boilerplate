import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { CATEGORIES } from '../../lib/categoryTree.js'
import {
  categoryHref,
  listCategoryPaths,
  parseCategorySlugs,
  resolveCategoryPath,
} from '../../site/js/modules/catalog/domain/categoryPath.js'

describe('chemin de catégorie', () => {
  it('construit l’URL d’une suite de slugs', () => {
    assert.equal(categoryHref([]), '/catalogue')
    assert.equal(
      categoryHref(['plantes-interieur', 'feuillages']),
      '/catalogue/plantes-interieur/feuillages',
    )
  })

  it('lit les slugs d’une URL du catalogue, et seulement du catalogue', () => {
    assert.deepEqual(parseCategorySlugs('/catalogue'), [])
    assert.deepEqual(parseCategorySlugs('/catalogue/plantes-interieur/feuillages'), [
      'plantes-interieur',
      'feuillages',
    ])
    assert.equal(parseCategorySlugs('/contact'), null)
    assert.equal(parseCategorySlugs('/catalogue-bis'), null)
  })

  it('résout une suite valide en chaîne de catégories avec leurs chemins', () => {
    assert.deepEqual(
      resolveCategoryPath(CATEGORIES, ['plantes-interieur', 'feuillages', 'monstera']),
      [
        {
          slug: 'plantes-interieur',
          name: 'Plantes d’intérieur',
          path: '/catalogue/plantes-interieur',
        },
        { slug: 'feuillages', name: 'Feuillages', path: '/catalogue/plantes-interieur/feuillages' },
        {
          slug: 'monstera',
          name: 'Monstera',
          path: '/catalogue/plantes-interieur/feuillages/monstera',
        },
      ],
    )
    assert.deepEqual(resolveCategoryPath(CATEGORIES, []), [])
  })

  it('refuse un slug inconnu, une branche incohérente ou trop profonde', () => {
    assert.equal(resolveCategoryPath(CATEGORIES, ['inconnue']), null)
    assert.equal(resolveCategoryPath(CATEGORIES, ['feuillages']), null)
    assert.equal(resolveCategoryPath(CATEGORIES, ['plantes-exterieur', 'feuillages']), null)
    assert.equal(
      resolveCategoryPath(CATEGORIES, ['plantes-interieur', 'feuillages', 'monstera', 'x']),
      null,
    )
  })

  it('liste les quatorze chemins de l’arbre en profondeur d’abord', () => {
    const paths = listCategoryPaths(CATEGORIES)
    assert.equal(paths.length, 14)
    assert.deepEqual(paths.slice(0, 4), [
      '/catalogue/plantes-interieur',
      '/catalogue/plantes-interieur/feuillages',
      '/catalogue/plantes-interieur/feuillages/monstera',
      '/catalogue/plantes-interieur/feuillages/fougeres',
    ])
    for (const path of paths) {
      assert.notEqual(resolveCategoryPath(CATEGORIES, parseCategorySlugs(path)), null, path)
    }
  })
})
