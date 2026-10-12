import { EXPOSURES, SIZES } from './catalogQuery.js'
import { branchSlugs, childrenOf } from './categoryTree.js'

export const ITEMS_PER_PAGE = 12

const COLLATOR = new Intl.Collator('fr')

const matchers = (query) => ({
  exposure: (product) => !query.exposures.length || query.exposures.includes(product.exposure),
  size: (product) => !query.sizes.length || query.sizes.includes(product.size),
  others: (product) =>
    (query.priceMin === null || product.price >= query.priceMin * 100) &&
    (query.priceMax === null || product.price <= query.priceMax * 100) &&
    (!query.inStock || product.inStock),
})

export const sortProducts = (products, sort) => {
  const compare = {
    'prix-asc': (a, b) => a.price - b.price,
    'prix-desc': (a, b) => b.price - a.price,
    nom: (a, b) => COLLATOR.compare(a.name, b.name),
  }[sort]
  return compare ? products.toSorted(compare) : products
}

export const searchCatalog = ({ products, categories, categorySlug, query }) => {
  const branch = branchSlugs(categories, categorySlug)
  const match = matchers(query)
  const inBranch = (product) => branch.has(product.categorySlug)
  const count = (predicate) => products.filter(predicate).length

  const results = products.filter(
    (p) => inBranch(p) && match.exposure(p) && match.size(p) && match.others(p),
  )
  const pageCount = Math.max(1, Math.ceil(results.length / ITEMS_PER_PAGE))
  const page = Math.min(query.page, pageCount)
  const start = (page - 1) * ITEMS_PER_PAGE

  return {
    items: sortProducts(results, query.sort).slice(start, start + ITEMS_PER_PAGE),
    total: results.length,
    page,
    pageCount,
    exposureCounts: Object.fromEntries(
      EXPOSURES.map((value) => [
        value,
        count((p) => p.exposure === value && inBranch(p) && match.size(p) && match.others(p)),
      ]),
    ),
    sizeCounts: Object.fromEntries(
      SIZES.map((value) => [
        value,
        count((p) => p.size === value && inBranch(p) && match.exposure(p) && match.others(p)),
      ]),
    ),
    categoryCounts: childrenOf(categories, categorySlug).map((category) => {
      const childBranch = branchSlugs(categories, category.slug)
      return {
        category,
        count: count(
          (p) =>
            childBranch.has(p.categorySlug) &&
            match.exposure(p) &&
            match.size(p) &&
            match.others(p),
        ),
      }
    }),
  }
}

export const paginationWindow = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)
  const pages = [1, current - 1, current, current + 1, total].filter(
    (page, index, list) => page >= 1 && page <= total && list.indexOf(page) === index,
  )
  return pages.flatMap((page, index) =>
    index > 0 && page - pages[index - 1] > 1 ? ['…', page] : [page],
  )
}

const PRICE_FORMAT = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })

export const formatPrice = (cents) => PRICE_FORMAT.format(cents / 100)

export const formatResultsCount = (total) => `${total} ${total > 1 ? 'produits' : 'produit'}`
