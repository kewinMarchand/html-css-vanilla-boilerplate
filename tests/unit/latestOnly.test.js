import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { latestOnly, STALE } from '../../site/js/core/latestOnly.js'

const deferred = () => {
  let resolve
  let reject
  const promise = new Promise((onResolve, onReject) => {
    resolve = onResolve
    reject = onReject
  })
  return { promise, resolve, reject }
}

describe('latestOnly', () => {
  it('ignore une réponse arrivée après une requête plus récente', async () => {
    const slow = deferred()
    const fast = deferred()
    const search = latestOnly((request) => request.promise)

    const first = search(slow)
    const second = search(fast)
    fast.resolve('page 2')
    slow.resolve('page 1')

    assert.equal(await second, 'page 2')
    assert.equal(await first, STALE)
  })

  it('ignore l’erreur d’une requête obsolète et relaie celle de la dernière', async () => {
    const old = deferred()
    const latest = deferred()
    const search = latestOnly((request) => request.promise)

    const first = search(old)
    const second = search(latest)
    old.reject(new Error('ancienne'))
    latest.reject(new Error('récente'))

    assert.equal(await first, STALE)
    await assert.rejects(second, { message: 'récente' })
  })

  it('renvoie la valeur quand aucune autre requête n’a suivi', async () => {
    const search = latestOnly(async (value) => value)
    assert.equal(await search(12), 12)
  })
})
