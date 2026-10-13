import { searchProducts } from '../infrastructure/http/catalogRepository.js'
import { CatalogLoadError } from './CatalogLoadError.js'

/**
 * Cas d'utilisation « afficher une page du catalogue » : interroge l'API puis décide.
 * Échec : résultat en erreur, affiché avec une relance. Page au-delà de la dernière : relue à la
 * dernière, et la requête corrigée est rendue pour que l'interface réécrive l'URL.
 */
export const loadCatalogPage = async ({ categorySlug, query }) => {
  try {
    let result = await searchProducts({ categorySlug, query })
    if (result.page > result.pageCount) {
      result = await searchProducts({ categorySlug, query: { ...query, page: result.pageCount } })
    }
    return { status: 'ok', query: { ...query, page: result.page }, result }
  } catch {
    return { status: 'error', message: new CatalogLoadError().message }
  }
}
