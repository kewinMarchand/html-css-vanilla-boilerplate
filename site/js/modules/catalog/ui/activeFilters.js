import { EXPOSURE_LABELS, SIZE_LABELS } from './labels.js'

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
