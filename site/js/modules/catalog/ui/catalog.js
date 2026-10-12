import { latestOnly, STALE } from '/js/shared/latestOnly.js'

import { searchProducts } from '../infrastructure/catalogRepository.js'
import { CatalogLoadError } from './CatalogLoadError.js'
import {
  activeFilters,
  clearFilters,
  countActiveFilters,
  EXPOSURES,
  isFiltered,
  parseQuery,
  serializeQuery,
  SIZES,
  withFilters,
} from '../domain/catalogQuery.js'
import { formatResultsCount, paginationWindow } from '../domain/catalogSearch.js'

const root = document.querySelector('[data-catalog]')
const $ = (selector) => root.querySelector(selector)
const form = $('[data-catalog-filters]')
const aside = $('[data-catalog-aside]')
const list = $('[data-catalog-list]')
const count = $('[data-catalog-count]')
const sort = $('[data-catalog-sort]')
const state = $('[data-catalog-state]')
const pagination = $('[data-catalog-pagination]')
const title = $('#catalog-title')
const activeWrapper = $('[data-catalog-active-filters]')
const chips = $('[data-catalog-chips]')
const openButton = $('[data-catalog-filters-open]')
const activeCount = $('[data-catalog-active-count]')
const dialog = $('[data-catalog-filters-dialog]')
const dialogBody = $('[data-catalog-dialog-body]')
const doneButton = $('[data-catalog-dialog-done]')

const BASE_PATH = form.getAttribute('action')
const categorySlug = root.dataset.category || null
const scenario = new URLSearchParams(location.search).get('scenario')
const productNodes = new Map(
  [...list.children].map((item) => [Number(item.dataset.productId), item]),
)
let query = parseQuery(new URLSearchParams(location.search))

const urlFor = (nextQuery) => {
  const search = serializeQuery(nextQuery)
  return search ? `${BASE_PATH}?${search}` : BASE_PATH
}

const fromTemplate = (id) => document.getElementById(id).content.cloneNode(true)

const element = (tag, properties = {}, children = []) => {
  const node = Object.assign(document.createElement(tag), properties)
  node.append(...children)
  return node
}

const syncControls = () => {
  form.querySelectorAll('[data-facet="exposures"]').forEach((input) => {
    input.checked = query.exposures.includes(input.value)
  })
  form.querySelectorAll('[data-facet="sizes"]').forEach((input) => {
    input.checked = query.sizes.includes(input.value)
  })
  form.querySelector('[data-facet="priceMin"]').value = query.priceMin ?? ''
  form.querySelector('[data-facet="priceMax"]').value = query.priceMax ?? ''
  form.querySelector('[data-facet="inStock"]').checked = query.inStock
  sort.value = query.sort
  list.dataset.view = query.view
  root.querySelectorAll('[data-catalog-view]').forEach((link) => {
    const view = link.dataset.catalogView
    link.href = urlFor({ ...query, view })
    if (view === query.view) link.setAttribute('aria-current', 'page')
    else link.removeAttribute('aria-current')
  })
}

const updateHead = (result) => {
  const canonical = document.querySelector('link[rel="canonical"]')
  const origin = new URL(canonical.href).origin
  canonical.href = `${origin}${BASE_PATH}${result.page > 1 ? `?page=${result.page}` : ''}`
  document
    .querySelector('meta[name="robots"]')
    .setAttribute('content', isFiltered(query) ? 'noindex, follow' : 'index, follow')
  document.querySelectorAll('link[rel="prev"], link[rel="next"]').forEach((link) => link.remove())
  const relations = [
    ['prev', result.page > 1 ? result.page - 1 : null],
    ['next', result.page < result.pageCount ? result.page + 1 : null],
  ]
  for (const [rel, page] of relations) {
    if (page) document.head.append(element('link', { rel, href: urlFor({ ...query, page }) }))
  }
}

const updateCounts = (result) => {
  const facets = [
    ['exposures', EXPOSURES, result.exposureCounts],
    ['sizes', SIZES, result.sizeCounts],
  ]
  for (const [facet, values, counts] of facets) {
    for (const value of values) {
      const input = form.querySelector(`[data-facet="${facet}"][value="${value}"]`)
      form.querySelector(`[data-count="${facet}-${value}"]`).textContent = `(${counts[value]})`
      input.disabled = counts[value] === 0 && !input.checked
    }
  }
  for (const { category, count: total } of result.categoryCounts) {
    form.querySelector(`[data-count="category-${category.slug}"]`).textContent = `(${total})`
  }
}

const renderChips = () => {
  const filters = activeFilters(query)
  activeWrapper.hidden = filters.length === 0
  activeCount.textContent = filters.length ? `(${countActiveFilters(query)})` : ''
  chips.replaceChildren(
    ...filters.map((filter) => {
      const button = element('button', { type: 'button', className: 'chip' }, [
        element('span', { className: 'visually-hidden', textContent: 'Retirer le filtre : ' }),
        filter.label,
      ])
      button.dataset.testid = 'catalog-active-filter'
      button.addEventListener('click', () =>
        navigate(withFilters(query, filter.remove(query)), { focusTitle: true }),
      )
      return element('li', {}, [button])
    }),
  )
}

const pageItem = (page, label, rel) => {
  const link = element('a', { className: 'pagination-link', href: urlFor({ ...query, page }) })
  if (rel) link.rel = rel
  if (typeof label === 'string') link.textContent = label
  else link.append(...label)
  link.addEventListener('click', (event) => {
    event.preventDefault()
    navigate({ ...query, page }, { focusTitle: true })
  })
  return element('li', {}, [link])
}

const disabledItem = (label) => {
  const span = element('span', { className: 'pagination-link', textContent: label })
  span.setAttribute('aria-disabled', 'true')
  return element('li', {}, [span])
}

const pageLabel = (page) => [
  element('span', { className: 'visually-hidden', textContent: 'Page ' }),
  String(page),
]

const renderPagination = (result) => {
  pagination.hidden = result.pageCount <= 1
  const { page, pageCount } = result
  pagination.querySelector('ul').replaceChildren(
    page > 1 ? pageItem(page - 1, 'Précédent', 'prev') : disabledItem('Précédent'),
    ...paginationWindow(page, pageCount).map((item) => {
      if (item === '…') {
        const ellipsis = element('span', { textContent: '…' })
        ellipsis.setAttribute('aria-hidden', 'true')
        return element('li', {}, [ellipsis])
      }
      if (item !== page) return pageItem(item, pageLabel(item))
      const current = element('span', { className: 'pagination-link' }, pageLabel(item))
      current.setAttribute('aria-current', 'page')
      return element('li', {}, [current])
    }),
    page < pageCount ? pageItem(page + 1, 'Suivant', 'next') : disabledItem('Suivant'),
  )
}

const renderResult = (result) => {
  if (result.page !== query.page) {
    query = { ...query, page: result.page }
    history.replaceState(null, '', urlFor(query))
  }
  list.removeAttribute('aria-busy')
  list.replaceChildren(...result.items.map((product) => productNodes.get(product.id)))
  state.replaceChildren(...(result.total ? [] : [fromTemplate('catalog-empty-template')]))
  state
    .querySelector('[data-catalog-empty-clear]')
    ?.addEventListener('click', () => navigate(clearFilters(query), { focusTitle: true }))
  count.textContent = formatResultsCount(result.total)
  doneButton.textContent = `Voir les ${formatResultsCount(result.total)}`
  updateCounts(result)
  renderChips()
  renderPagination(result)
  updateHead(result)
}

const renderError = (message) => {
  list.removeAttribute('aria-busy')
  list.replaceChildren()
  pagination.hidden = true
  count.textContent = ''
  state.replaceChildren(fromTemplate('catalog-error-template'))
  state.querySelector('[data-catalog-error-message]').textContent = message
  state.querySelector('[data-catalog-retry]').addEventListener('click', () => load())
}

const fetchResult = latestOnly(async () => {
  try {
    return await searchProducts({ categorySlug, query, scenario })
  } catch {
    throw new CatalogLoadError()
  }
})

const load = async ({ showLoading = true } = {}) => {
  if (showLoading) {
    list.setAttribute('aria-busy', 'true')
    state.replaceChildren(fromTemplate('catalog-loading-template'))
    count.textContent = 'Chargement des produits…'
  }
  try {
    const result = await fetchResult()
    if (result !== STALE) renderResult(result)
  } catch (error) {
    renderError(error.message)
  }
}

const navigate = async (nextQuery, { focusTitle = false } = {}) => {
  query = nextQuery
  history.pushState(null, '', urlFor(query))
  syncControls()
  await load()
  if (focusTitle) title.focus()
}

const checkedValues = (facet) =>
  [...form.querySelectorAll(`[data-facet="${facet}"]:checked`)].map((input) => input.value)

const readPrices = () => {
  const prices = parseQuery(new URLSearchParams(new FormData(form)))
  return { priceMin: prices.priceMin, priceMax: prices.priceMax }
}

form.addEventListener('change', (event) => {
  const { facet } = event.target.dataset
  const changes = {
    exposures: () => ({ exposures: checkedValues('exposures') }),
    sizes: () => ({ sizes: checkedValues('sizes') }),
    priceMin: readPrices,
    priceMax: readPrices,
    inStock: () => ({ inStock: event.target.checked }),
  }[facet]
  if (changes) navigate(withFilters(query, changes()))
})
form.addEventListener('submit', (event) => {
  event.preventDefault()
  navigate(withFilters(query, readPrices()))
})
sort.addEventListener('change', () => navigate(withFilters(query, { sort: sort.value })))
root.querySelectorAll('[data-catalog-view]').forEach((link) =>
  link.addEventListener('click', (event) => {
    event.preventDefault()
    navigate({ ...query, view: link.dataset.catalogView })
  }),
)
$('[data-catalog-clear]').addEventListener('click', () =>
  navigate(clearFilters(query), { focusTitle: true }),
)
window.addEventListener('popstate', () => {
  query = parseQuery(new URLSearchParams(location.search))
  syncControls()
  load()
})

openButton.addEventListener('click', () => {
  dialogBody.append(form)
  dialog.showModal()
  openButton.setAttribute('aria-expanded', 'true')
})
dialog.addEventListener('close', () => {
  aside.append(form)
  openButton.setAttribute('aria-expanded', 'false')
  openButton.focus()
})
doneButton.addEventListener('click', () => dialog.close())
$('[data-catalog-dialog-close]').addEventListener('click', () => dialog.close())

syncControls()
load({ showLoading: false })
