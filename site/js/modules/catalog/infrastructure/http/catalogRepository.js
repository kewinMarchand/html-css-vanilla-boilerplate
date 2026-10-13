import { apiGet } from '/js/shared/api.js'

import { toProductsQuery, toSearchResult } from './catalogTranslation.js'

export const searchProducts = async ({ categorySlug, query }) =>
  toSearchResult(await apiGet('/api/products', toProductsQuery(categorySlug, query)))
