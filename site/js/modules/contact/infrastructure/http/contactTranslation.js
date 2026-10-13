const FIELDS = ['name', 'email', 'message']

/** Violations 422 vers les erreurs de champ. Les messages de l'API sont déjà en français. */
export const toFieldErrors = (body) =>
  (Array.isArray(body?.violations) ? body.violations : []).flatMap((violation) =>
    FIELDS.includes(violation?.propertyPath) && typeof violation.message === 'string'
      ? [{ field: violation.propertyPath, message: violation.message }]
      : [],
  )

export class ContactRejectedError extends Error {
  constructor(fieldErrors) {
    super('Message refusé par l’API')
    this.name = 'ContactRejectedError'
    this.fieldErrors = fieldErrors
  }
}
