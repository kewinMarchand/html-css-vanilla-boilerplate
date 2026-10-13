import { ApiError, apiPost } from '/js/shared/api.js'

import { ContactRejectedError, toFieldErrors } from './contactTranslation.js'

export const sendContactMessage = async (values) => {
  try {
    await apiPost('/api/contact_messages', values)
  } catch (error) {
    const fieldErrors =
      error instanceof ApiError && error.status === 422 ? toFieldErrors(error.body) : []
    throw fieldErrors.length > 0 ? new ContactRejectedError(fieldErrors) : error
  }
}
