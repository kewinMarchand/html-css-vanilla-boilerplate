import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  filterTasks,
  formatDoneCount,
  formatVisibleCount,
  splitOnMatch,
} from '../../site/js/domains/tasks/common/models/tasks.js'

const TASKS = [
  { id: '1', title: 'Brancher la vraie API', done: false },
  { id: '2', title: 'Lancer make qa', done: true },
]

describe('tâches', () => {
  it('filtre sans tenir compte de la casse', () => {
    assert.deepEqual(
      filterTasks(TASKS, 'api').map((task) => task.id),
      ['1'],
    )
    assert.equal(filterTasks(TASKS, '  ').length, 2)
  })

  it('découpe le titre autour de la correspondance', () => {
    assert.deepEqual(splitOnMatch('Brancher la vraie API', 'api'), [
      { text: 'Brancher la vraie ', match: false },
      { text: 'API', match: true },
    ])
    assert.deepEqual(splitOnMatch('Lancer', 'zz'), [{ text: 'Lancer', match: false }])
  })

  it('accorde les compteurs', () => {
    assert.equal(formatVisibleCount(1, 3), '1 tâche affichée sur 3')
    assert.equal(formatVisibleCount(2, 3), '2 tâches affichées sur 3')
    assert.equal(formatDoneCount(0, 3), '0 tâche terminée sur 3')
  })
})
