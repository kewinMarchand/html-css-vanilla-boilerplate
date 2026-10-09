export class CatalogLoadError extends Error {
  constructor() {
    super('Impossible de charger les produits pour le moment.')
    this.name = 'CatalogLoadError'
  }
}
