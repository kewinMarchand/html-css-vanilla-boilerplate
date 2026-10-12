import {
  CATALOG_ROOT_PATH,
  parseCategorySlugs,
  resolveCategoryPath,
} from '../site/js/modules/catalog/domain/categoryPath.js'
import { CATEGORIES } from '../site/js/modules/catalog/infrastructure/catalogData.js'

const HOME = { label: 'Accueil', href: '/' }
const CATALOG = { label: 'Catalogue', href: CATALOG_ROOT_PATH }

export const breadcrumbTrail = (path, label) => {
  if (path === '/') return []
  const slugs = parseCategorySlugs(path)
  if (slugs === null) return [HOME, { label, href: path }]

  const categories = resolveCategoryPath(CATEGORIES, slugs)
  if (categories === null) throw new Error(`Chemin de catégorie inconnu : ${path}`)
  return [
    HOME,
    CATALOG,
    ...categories.map((category) => ({ label: category.name, href: category.path })),
  ]
}

export const breadcrumbJsonLd = (trail, siteUrl) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: trail.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.label,
    item: `${siteUrl}${item.href}`,
  })),
})
