import { isEnhanced, setA11yMode } from './a11yMode.js'

const getStorage = () => {
  try {
    return localStorage
  } catch {
    return undefined
  }
}

const root = document.documentElement
const button = document.querySelector('[data-a11y-mode-toggle]')
const storage = getStorage()

button.setAttribute('aria-pressed', String(isEnhanced(root)))
button.addEventListener('click', () => setA11yMode({ root, button, storage }, !isEnhanced(root)))
