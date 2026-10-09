import { readFileSync } from 'node:fs'

const SITE = JSON.parse(readFileSync(new URL('../../site.config.json', import.meta.url), 'utf8'))

export const CATEGORY_ROUTES = [
  '/catalogue/plantes-interieur',
  '/catalogue/plantes-interieur/feuillages',
]

export const ROUTES = [
  ...SITE.navigation.map((item) => item.href),
  ...CATEGORY_ROUTES,
  ...SITE.legalNavigation.map((item) => item.href),
]

export const enableEnhancedMode = (page) =>
  page.addInitScript(() => localStorage.setItem('a11y-mode', 'enhanced'))
