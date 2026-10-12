const TASKS = [
  { id: '1', title: 'Brancher la vraie API', done: false },
  { id: '2', title: 'Générer les types OpenAPI', done: false },
  { id: '3', title: 'Lancer make qa', done: true },
]

const LATENCY_MS = 300

export const findAllTasks = ({ scenario } = {}) =>
  new Promise((resolve, reject) =>
    setTimeout(() => {
      if (scenario === 'error') {
        reject(new Error('Erreur serveur simulée'))
        return
      }
      resolve(scenario === 'empty' ? [] : structuredClone(TASKS))
    }, LATENCY_MS),
  )
