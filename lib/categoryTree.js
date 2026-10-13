/**
 * Arbre des catégories des pages statiques `site/catalogue/`, pour l'outillage (fil d'Ariane,
 * plan du site, tests). Il doit rester identique à celui de l'API : `tests/e2e/catalogue-arbre.e2e.js`
 * les compare en CI.
 */
export const CATEGORIES = [
  { slug: 'plantes-interieur', name: "Plantes d'intérieur", parentSlug: null, position: 1 },
  { slug: 'feuillages', name: 'Feuillages', parentSlug: 'plantes-interieur', position: 2 },
  { slug: 'monstera', name: 'Monstera', parentSlug: 'feuillages', position: 3 },
  { slug: 'fougeres', name: 'Fougères', parentSlug: 'feuillages', position: 4 },
  {
    slug: 'plantes-a-fleurs',
    name: 'Plantes à fleurs',
    parentSlug: 'plantes-interieur',
    position: 5,
  },
  { slug: 'anthurium', name: 'Anthurium', parentSlug: 'plantes-a-fleurs', position: 6 },
  { slug: 'strelitzia', name: 'Strelitzia', parentSlug: 'plantes-a-fleurs', position: 7 },
  { slug: 'plantes-exterieur', name: "Plantes d'extérieur", parentSlug: null, position: 8 },
  { slug: 'palmiers', name: 'Palmiers', parentSlug: 'plantes-exterieur', position: 9 },
  {
    slug: 'arbustes-a-fleurs',
    name: 'Arbustes à fleurs',
    parentSlug: 'plantes-exterieur',
    position: 10,
  },
  { slug: 'heliconia', name: 'Heliconia', parentSlug: 'arbustes-a-fleurs', position: 11 },
  { slug: 'calliandra', name: 'Calliandra', parentSlug: 'arbustes-a-fleurs', position: 12 },
  { slug: 'plantes-aquatiques', name: 'Plantes aquatiques', parentSlug: null, position: 13 },
  { slug: 'nenuphars', name: 'Nénuphars', parentSlug: 'plantes-aquatiques', position: 14 },
]
