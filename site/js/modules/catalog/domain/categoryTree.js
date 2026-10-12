export const childrenOf = (categories, parentSlug) =>
  categories
    .filter((category) => category.parentSlug === parentSlug)
    .toSorted((a, b) => a.position - b.position)

export const ancestorsOf = (categories, slug) => {
  const trail = []
  for (let current = categories.find((c) => c.slug === slug); current;) {
    trail.unshift(current)
    current = categories.find((c) => c.slug === current.parentSlug)
  }
  return trail
}

export const branchSlugs = (categories, rootSlug) =>
  new Set(
    categories
      .filter(
        (category) =>
          rootSlug === null ||
          ancestorsOf(categories, category.slug).some((ancestor) => ancestor.slug === rootSlug),
      )
      .map((category) => category.slug),
  )
