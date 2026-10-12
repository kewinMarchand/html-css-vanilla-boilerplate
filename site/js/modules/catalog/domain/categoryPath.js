import { childrenOf } from './categoryTree.js'

export const CATALOG_ROOT_PATH = '/catalogue'
export const MAX_CATEGORY_DEPTH = 3

export const parseCategorySlugs = (path) =>
  path === CATALOG_ROOT_PATH || path.startsWith(`${CATALOG_ROOT_PATH}/`)
    ? path.slice(CATALOG_ROOT_PATH.length).split('/').filter(Boolean)
    : null

export const categoryHref = (slugs) =>
  slugs.length > 0 ? `${CATALOG_ROOT_PATH}/${slugs.join('/')}` : CATALOG_ROOT_PATH

export const resolveCategoryPath = (categories, slugs) => {
  if (slugs.length > MAX_CATEGORY_DEPTH) return null
  const chain = []
  let parentSlug = null
  for (const slug of slugs) {
    const category = childrenOf(categories, parentSlug).find((child) => child.slug === slug)
    if (!category) return null
    chain.push({
      slug,
      name: category.name,
      path: categoryHref(slugs.slice(0, chain.length + 1)),
    })
    parentSlug = slug
  }
  return chain
}

export const listCategoryPaths = (categories, parentSlug = null, parents = []) =>
  childrenOf(categories, parentSlug).flatMap((category) => {
    const slugs = [...parents, category.slug]
    return [categoryHref(slugs), ...listCategoryPaths(categories, category.slug, slugs)]
  })
