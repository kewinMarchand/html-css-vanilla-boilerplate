export const EXPOSURES = ['soleil', 'mi-ombre', 'ombre']
export const SIZES = ['S', 'M', 'L']
export const SORTS = ['pertinence', 'prix-asc', 'prix-desc', 'nom']
export const VIEWS = ['grille', 'liste']

export const EXPOSURE_LABELS = { soleil: 'Soleil', 'mi-ombre': 'Mi-ombre', ombre: 'Ombre' }
export const SIZE_LABELS = { S: 'Petite (S)', M: 'Moyenne (M)', L: 'Grande (L)' }

export const DEFAULT_QUERY = Object.freeze({
  exposures: [],
  sizes: [],
  priceMin: null,
  priceMax: null,
  inStock: false,
  sort: 'pertinence',
  view: 'grille',
  page: 1,
})

const parsePrice = (value) => {
  if (value === null || value.trim() === '') return null
  const price = Number(value)
  return Number.isFinite(price) && price >= 0 ? price : null
}

const parsePage = (value) => {
  const page = Number(value)
  return Number.isInteger(page) && page >= 2 ? page : 1
}

const allowed = (values, accepted) => accepted.filter((value) => values.includes(value))

export const parseQuery = (params) => {
  const sort = params.get('tri')
  return {
    exposures: allowed(params.getAll('exposition'), EXPOSURES),
    sizes: allowed(params.getAll('taille'), SIZES),
    priceMin: parsePrice(params.get('prix_min')),
    priceMax: parsePrice(params.get('prix_max')),
    inStock: params.get('en_stock') === '1',
    sort: SORTS.includes(sort) ? sort : DEFAULT_QUERY.sort,
    view: params.get('vue') === 'liste' ? 'liste' : DEFAULT_QUERY.view,
    page: parsePage(params.get('page')),
  }
}

export const serializeQuery = (query) => {
  const params = new URLSearchParams()
  query.exposures.forEach((value) => params.append('exposition', value))
  query.sizes.forEach((value) => params.append('taille', value))
  if (query.priceMin !== null) params.set('prix_min', String(query.priceMin))
  if (query.priceMax !== null) params.set('prix_max', String(query.priceMax))
  if (query.inStock) params.set('en_stock', '1')
  if (query.sort !== DEFAULT_QUERY.sort) params.set('tri', query.sort)
  if (query.view !== DEFAULT_QUERY.view) params.set('vue', query.view)
  if (query.page > 1) params.set('page', String(query.page))
  return params.toString()
}

export const withFilters = (query, changes) => ({ ...query, ...changes, page: 1 })

export const clearFilters = (query) => ({ ...DEFAULT_QUERY, view: query.view })

export const countActiveFilters = (query) =>
  query.exposures.length +
  query.sizes.length +
  (query.priceMin === null ? 0 : 1) +
  (query.priceMax === null ? 0 : 1) +
  (query.inStock ? 1 : 0)

export const isFiltered = (query) =>
  countActiveFilters(query) > 0 || query.sort !== DEFAULT_QUERY.sort

export const activeFilters = (query) => [
  ...query.exposures.map((value) => ({
    label: EXPOSURE_LABELS[value],
    remove: (q) => ({ exposures: q.exposures.filter((item) => item !== value) }),
  })),
  ...query.sizes.map((value) => ({
    label: SIZE_LABELS[value],
    remove: (q) => ({ sizes: q.sizes.filter((item) => item !== value) }),
  })),
  ...(query.priceMin === null
    ? []
    : [{ label: `Prix minimum : ${query.priceMin} €`, remove: () => ({ priceMin: null }) }]),
  ...(query.priceMax === null
    ? []
    : [{ label: `Prix maximum : ${query.priceMax} €`, remove: () => ({ priceMax: null }) }]),
  ...(query.inStock ? [{ label: 'En stock', remove: () => ({ inStock: false }) }] : []),
]
