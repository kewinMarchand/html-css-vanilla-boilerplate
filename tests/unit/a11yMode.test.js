import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { A11Y_MODE_KEY, isEnhanced, setA11yMode } from '../../site/js/shared/a11yMode.js'

const fakeButton = () => ({
  attributes: {},
  setAttribute(name, value) {
    this.attributes[name] = value
  },
})

const fakeStorage = () => {
  const values = new Map()
  return {
    values,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
}

describe('mode accessibilité renforcée', () => {
  it('active le mode, pose aria-pressed et persiste le choix', () => {
    const root = { dataset: {} }
    const button = fakeButton()
    const storage = fakeStorage()

    setA11yMode({ root, button, storage }, true)

    assert.equal(isEnhanced(root), true)
    assert.equal(button.attributes['aria-pressed'], 'true')
    assert.equal(storage.values.get(A11Y_MODE_KEY), 'enhanced')
  })

  it('désactive le mode et retire la clé', () => {
    const root = { dataset: { a11yMode: 'enhanced' } }
    const button = fakeButton()
    const storage = fakeStorage()
    storage.setItem(A11Y_MODE_KEY, 'enhanced')

    setA11yMode({ root, button, storage }, false)

    assert.equal(isEnhanced(root), false)
    assert.equal(button.attributes['aria-pressed'], 'false')
    assert.equal(storage.values.has(A11Y_MODE_KEY), false)
  })

  it('reste utilisable quand le stockage est bloqué', () => {
    const root = { dataset: {} }
    const storage = {
      setItem: () => {
        throw new Error('bloqué')
      },
    }

    setA11yMode({ root, button: fakeButton(), storage }, true)

    assert.equal(isEnhanced(root), true)
  })
})
