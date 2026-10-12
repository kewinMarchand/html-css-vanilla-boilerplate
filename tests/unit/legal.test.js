import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { complianceStatus } from '../../lib/accessibilityCompliance.js'
import { breadcrumbJsonLd, breadcrumbTrail } from '../../lib/breadcrumb.js'
import { contrastLevel, contrastRatio } from '../../site/js/views/styleguide/contrast.js'

describe('état de conformité RGAA', () => {
  it('est non conforme sans audit', () => {
    assert.equal(complianceStatus({ auditDate: null, complianceRate: null }), 'non conforme')
  })

  it('suit le taux de conformité d’un audit', () => {
    assert.equal(complianceStatus({ auditDate: '2026-10-01', complianceRate: 49 }), 'non conforme')
    assert.equal(
      complianceStatus({ auditDate: '2026-10-01', complianceRate: 50 }),
      'partiellement conforme',
    )
    assert.equal(
      complianceStatus({ auditDate: '2026-10-01', complianceRate: 100 }),
      'totalement conforme',
    )
  })
})

describe('fil d’Ariane', () => {
  it('est vide sur l’accueil', () => {
    assert.deepEqual(breadcrumbTrail('/', 'Accueil'), [])
  })

  it('part de l’accueil pour une page simple', () => {
    assert.deepEqual(breadcrumbTrail('/contact', 'Contact'), [
      { label: 'Accueil', href: '/' },
      { label: 'Contact', href: '/contact' },
    ])
  })

  it('suit l’arbre des catégories', () => {
    assert.deepEqual(
      breadcrumbTrail('/catalogue/plantes-interieur/feuillages', 'Feuillages').map(
        (item) => item.label,
      ),
      ['Accueil', 'Catalogue', "Plantes d'intérieur", 'Feuillages'],
    )
  })

  it('produit un BreadcrumbList avec des URL absolues', () => {
    const ld = breadcrumbJsonLd(breadcrumbTrail('/contact', 'Contact'), 'https://www.example.com')
    assert.equal(ld['@type'], 'BreadcrumbList')
    assert.deepEqual(ld.itemListElement[1], {
      '@type': 'ListItem',
      position: 2,
      name: 'Contact',
      item: 'https://www.example.com/contact',
    })
  })
})

describe('contraste', () => {
  it('calcule le ratio WCAG', () => {
    assert.equal(contrastRatio([0, 0, 0], [255, 255, 255]).toFixed(1), '21.0')
    assert.equal(contrastRatio([255, 255, 255], [255, 255, 255]), 1)
  })

  it('classe le niveau atteint', () => {
    assert.equal(contrastLevel(7.2), 'AAA')
    assert.equal(contrastLevel(4.6), 'AA')
    assert.equal(contrastLevel(3.2), 'AA grand texte et composants')
    assert.equal(contrastLevel(2), 'insuffisant')
  })
})
