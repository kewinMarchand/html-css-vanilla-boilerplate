export const paginationWindow = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)
  const pages = [1, current - 1, current, current + 1, total].filter(
    (page, index, list) => page >= 1 && page <= total && list.indexOf(page) === index,
  )
  return pages.flatMap((page, index) =>
    index > 0 && page - pages[index - 1] > 1 ? ['…', page] : [page],
  )
}
