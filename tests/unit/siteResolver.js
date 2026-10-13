import { register } from 'node:module'

// Les modules du site importent le socle par son chemin servi (`/js/shared/api.js`), comme le
// navigateur. Ce crochet de résolution fait pointer ces chemins vers `site/` sous Node.
register(
  'data:text/javascript,' +
    encodeURIComponent(`
const SITE = ${JSON.stringify(new URL('../../site/', import.meta.url).href)}
export const resolve = (specifier, context, next) =>
  /^\\/(js|vendor)\\//.test(specifier) ? next(new URL(specifier.slice(1), SITE).href, context) : next(specifier, context)
`),
)
