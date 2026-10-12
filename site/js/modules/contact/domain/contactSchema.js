const EMAIL_PATTERN =
  /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9-]*\.)+[A-Za-z]{2,}$/

const CONTACT_RULES = {
  name: {
    isValid: (value) => value.trim().length >= 2,
    message: 'Indiquez votre nom (2 caractères minimum).',
  },
  email: {
    isValid: (value) => EMAIL_PATTERN.test(value),
    message: 'Indiquez une adresse e-mail valide, par exemple nom@domaine.fr.',
  },
  message: {
    isValid: (value) => value.trim().length >= 10,
    message: 'Votre message doit contenir au moins 10 caractères.',
  },
}

export const validateField = (name, value) =>
  CONTACT_RULES[name].isValid(value) ? undefined : CONTACT_RULES[name].message
