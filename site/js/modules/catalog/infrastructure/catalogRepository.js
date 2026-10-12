import { searchCatalog } from '../domain/catalogSearch.js'
import { CATEGORIES, PRODUCTS } from './catalogData.js'

const LATENCY_MS = 300

export const searchProducts = ({ categorySlug, query, scenario }) =>
  new Promise((resolve, reject) =>
    setTimeout(() => {
      if (scenario === 'error') {
        reject(new Error('Erreur serveur simulée'))
        return
      }
      const products = scenario === 'empty' ? [] : PRODUCTS
      resolve(searchCatalog({ products, categories: CATEGORIES, categorySlug, query }))
    }, LATENCY_MS),
  )
