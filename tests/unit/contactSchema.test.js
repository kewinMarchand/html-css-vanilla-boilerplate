import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { validateField } from '../../site/js/modules/contact/domain/contactSchema.js'

describe('validation du formulaire de contact', () => {
  it('accepte un message complet', () => {
    assert.equal(validateField('name', 'Ada'), undefined)
    assert.equal(validateField('email', 'ada@exemple.fr'), undefined)
    assert.equal(validateField('message', 'Bonjour, ceci est un message.'), undefined)
  })

  it('renvoie les messages français du schéma', () => {
    assert.equal(validateField('name', ' A '), 'Indiquez votre nom (2 caractères minimum).')
    assert.equal(
      validateField('email', 'ada'),
      'Indiquez une adresse e-mail valide, par exemple nom@domaine.fr.',
    )
    assert.equal(validateField('email', 'ada@exemple'), validateField('email', 'ada'))
    assert.equal(
      validateField('message', 'Court'),
      'Votre message doit contenir au moins 10 caractères.',
    )
  })
})
