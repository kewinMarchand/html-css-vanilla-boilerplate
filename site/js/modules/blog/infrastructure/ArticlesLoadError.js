export class ArticlesLoadError extends Error {
  constructor() {
    super('Impossible de charger les articles pour le moment.')
    this.name = 'ArticlesLoadError'
  }
}
