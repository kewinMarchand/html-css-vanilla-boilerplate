const DSN = /^(https?):\/\/[^@/]+@([^/]+)\//

/**
 * Configuration de GlitchTip lue dans l'environnement, telle que nginx la donne aux inclusions
 * côté serveur (`set` dans `docker/default.conf.template`) et à la CSP (`map`). Le serveur de
 * développement et les tests la calculent ici de la même façon. Sans valeur, tout reste vide.
 */
export const glitchtipOrigin = (dsn) => {
  const match = dsn.match(DSN)
  return match ? `${match[1]}://${match[2]}` : ''
}

export const observabilityVariables = (env) => {
  const dsn = env.GLITCHTIP_DSN ?? ''
  return {
    glitchtip_dsn: dsn,
    glitchtip_environment: env.GLITCHTIP_ENVIRONMENT || 'development',
    glitchtip_origin: glitchtipOrigin(dsn),
  }
}

export const resolveVariables = (value, variables) =>
  value.replace(/\$(\w+)/g, (_, name) => variables[name] ?? '')
