import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import lucide from '@iconify-json/lucide/icons.json' with { type: 'json' }
import svgstore from 'svgstore'

/**
 * Assemble le sprite `site/icons.svg` et la liste des noms d'icônes à partir de `icons.json`
 * (noms Lucide), et vérifie que chaque `/icons.svg#nom` ou `iconNode('nom')` cité par le site existe dans la liste.
 * `--check` ne réécrit rien et échoue si les fichiers versionnés sont périmés.
 */
const LIST = 'icons.json'
const SPRITE = 'site/icons.svg'
const NAMES = 'site/js/shared/iconNames.js'
const REFERENCE = /(?:\/icons\.svg#|iconNode\(')([a-z0-9-]+)/g

const names = [...new Set(JSON.parse(readFileSync(LIST, 'utf8')))].sort()

const sprite = svgstore({ svgAttrs: { xmlns: 'http://www.w3.org/2000/svg' } })
for (const name of names) {
  const icon = lucide.icons[name]
  if (!icon) throw new Error(`Icône inconnue de Lucide : ${name}`)
  const width = icon.width ?? lucide.width
  const height = icon.height ?? lucide.height
  sprite.add(
    name,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">${icon.body}</svg>`,
  )
}

const outputs = {
  [SPRITE]: `${sprite.toString({ inline: true }).replace(/(<symbol |<\/svg>)/g, '\n$1')}\n`,
  [NAMES]: [
    '// Généré par `make icons` depuis icons.json, ne pas modifier à la main.',
    'export const ICON_NAMES = [',
    ...names.map((name) => `  '${name}',`),
    ']',
    '',
  ].join('\n'),
}

const sources = (directory) =>
  readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry)
    if (statSync(path).isDirectory()) return entry === 'vendor' ? [] : sources(path)
    return /\.(html|js)$/.test(entry) ? [path] : []
  })

const unknown = sources('site').flatMap((path) =>
  [...readFileSync(path, 'utf8').matchAll(REFERENCE)]
    .map(([, name]) => name)
    .filter((name) => !names.includes(name))
    .map((name) => `${path} : ${name}`),
)
if (unknown.length > 0) {
  console.error(`Icônes citées mais absentes de ${LIST} :\n${unknown.join('\n')}`)
  process.exit(1)
}

if (process.argv.includes('--check')) {
  const stale = Object.entries(outputs)
    .filter(([path, content]) => !existsSync(path) || readFileSync(path, 'utf8') !== content)
    .map(([path]) => path)
  if (stale.length > 0) {
    console.error(`Icônes périmées (${stale.join(', ')}) : lancer make icons.`)
    process.exit(1)
  }
  console.log(`Icônes à jour : ${names.length} dans ${SPRITE}.`)
} else {
  for (const [path, content] of Object.entries(outputs)) writeFileSync(path, content)
  console.log(`${names.length} icônes écrites dans ${SPRITE} et ${NAMES}.`)
}
