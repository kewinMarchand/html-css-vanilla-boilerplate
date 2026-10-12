import { sendContactMessage } from '../infrastructure/sendContactMessage.js'
import { validateField } from '../domain/contactSchema.js'

const form = document.querySelector('[data-contact-form]')
const status = form.querySelector('[data-contact-status]')
const submit = form.querySelector('[type="submit"]')
const fields = [...form.querySelectorAll('input, textarea')]
let isSending = false

const check = (field) => {
  const message = validateField(field.name, field.value)
  document.getElementById(field.getAttribute('aria-describedby')).textContent = message ?? ''
  if (message) {
    field.setAttribute('aria-invalid', 'true')
  } else {
    field.removeAttribute('aria-invalid')
  }
  return !message
}

const showStatus = (templateId) => {
  status.replaceChildren(document.getElementById(templateId).content.cloneNode(true))
}

form.noValidate = true

for (const field of fields) {
  field.addEventListener('blur', () => {
    if (field.value !== '' || field.hasAttribute('aria-invalid')) check(field)
  })
  field.addEventListener('input', () => {
    if (field.hasAttribute('aria-invalid')) check(field)
  })
}

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  if (isSending) return

  status.replaceChildren()
  const invalidFields = fields.filter((field) => !check(field))
  if (invalidFields.length) {
    invalidFields[0].focus()
    return
  }

  isSending = true
  submit.setAttribute('aria-disabled', 'true')
  try {
    await sendContactMessage(Object.fromEntries(new FormData(form)))
    form.reset()
    showStatus('contact-success-template')
  } catch {
    showStatus('contact-error-template')
  } finally {
    isSending = false
    submit.removeAttribute('aria-disabled')
  }
})
