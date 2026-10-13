const DSN = /^(https?):\/\/[^@/]+@([^/]+)\//
const URL_ORIGIN = /^(https?:\/\/[^/]+)/

/**
 * Configuration de GlitchTip et de Matomo lue dans l'environnement, telle que nginx la donne aux inclusions
 * côté serveur (`set` dans `docker/default.conf.template`) et à la CSP (`map`). Le serveur de
 * développement et les tests la calculent ici de la même façon. Sans valeur, tout reste vide.
 */
export const glitchtipOrigin = (dsn) => {
  const match = dsn.match(DSN)
  return match ? `${match[1]}://${match[2]}` : ''
}

export const matomoOrigin = (url, siteId) => (siteId ? (url.match(URL_ORIGIN)?.[1] ?? '') : '')

export const observabilityVariables = (env) => {
  const dsn = env.GLITCHTIP_DSN ?? ''
  const matomoUrl = env.MATOMO_URL ?? ''
  const matomoSiteId = env.MATOMO_SITE_ID ?? ''
  return {
    glitchtip_dsn: dsn,
    glitchtip_environment: env.GLITCHTIP_ENVIRONMENT || 'development',
    glitchtip_origin: glitchtipOrigin(dsn),
    matomo_url: matomoUrl,
    matomo_site_id: matomoSiteId,
    matomo_origin: matomoOrigin(matomoUrl, matomoSiteId),
  }
}

export const resolveVariables = (value, variables) =>
  value.replace(/\$(\w+)/g, (_, name) => variables[name] ?? '')
