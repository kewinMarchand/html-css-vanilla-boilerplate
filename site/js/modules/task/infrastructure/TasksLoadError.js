export class TasksLoadError extends Error {
  constructor() {
    super('Impossible de charger les tâches pour le moment.')
    this.name = 'TasksLoadError'
  }
}
