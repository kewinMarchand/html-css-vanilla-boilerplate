import { searchProducts } from '../infrastructure/catalogRepository.js'
import { CatalogLoadError } from './CatalogLoadError.js'

/**
 * Cas d'utilisation « afficher une page du catalogue » : interroge le dépôt puis décide.
 * Échec du dépôt : résultat en erreur, affiché avec une relance. Page au-delà de la dernière :
 * ramenée à la dernière, et la requête corrigée est rendue pour que l'interface réécrive l'URL.
 */
export const loadCatalogPage = async ({ categorySlug, query, scenario }) => {
  let result
  try {
    result = await searchProducts({ categorySlug, query, scenario })
  } catch {
    return { status: 'error', message: new CatalogLoadError().message }
  }
  return { status: 'ok', query: { ...query, page: result.page }, result }
}
