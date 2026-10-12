import { CATEGORIES } from '../site/js/modules/catalog/infrastructure/catalogData.js'
import { ancestorsOf, categoryPath } from '../site/js/modules/catalog/domain/catalogSearch.js'

const HOME = { label: 'Accueil', href: '/' }
const CATALOG = { label: 'Catalogue', href: '/catalogue' }

export const breadcrumbTrail = (path, label) => {
  if (path === '/') return []
  if (path === CATALOG.href) return [HOME, CATALOG]
  if (path.startsWith(`${CATALOG.href}/`)) {
    const slug = path.split('/').at(-1)
    return [
      HOME,
      CATALOG,
      ...ancestorsOf(CATEGORIES, slug).map((category) => ({
        label: category.name,
        href: categoryPath(CATEGORIES, category.slug),
      })),
    ]
  }
  return [HOME, { label, href: path }]
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
