const DATE_FORMAT = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'UTC' })

export const formatPublishedAt = (isoDate) => DATE_FORMAT.format(new Date(`${isoDate}T00:00:00Z`))
