export const A11Y_MODE_KEY = 'a11y-mode'
export const ENHANCED = 'enhanced'

export const isEnhanced = (root) => root.dataset.a11yMode === ENHANCED

export const setA11yMode = ({ root, button, storage }, enabled) => {
  if (enabled) {
    root.dataset.a11yMode = ENHANCED
  } else {
    delete root.dataset.a11yMode
  }
  button.setAttribute('aria-pressed', String(enabled))

  try {
    if (enabled) {
      storage.setItem(A11Y_MODE_KEY, ENHANCED)
    } else {
      storage.removeItem(A11Y_MODE_KEY)
    }
  } catch {
    // Stockage bloqué (navigation privée, données de site refusées) : le mode reste actif pour la page.
  }
}
