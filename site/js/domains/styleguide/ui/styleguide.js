import { contrastLevel, contrastRatio } from '../common/models/contrast.js'

const root = document.querySelector('[data-styleguide]')
const canvas = document.createElement('canvas')
canvas.width = 1
canvas.height = 1
const context = canvas.getContext('2d', { willReadFrequently: true })

const resolveColor = (token) => {
  const probe = document.createElement('span')
  probe.style.color = `var(${token})`
  root.append(probe)
  const color = getComputedStyle(probe).color
  probe.remove()
  return color
}

const toRgb = (color) => {
  context.clearRect(0, 0, 1, 1)
  context.fillStyle = color
  context.fillRect(0, 0, 1, 1)
  return [...context.getImageData(0, 0, 1, 1).data.slice(0, 3)]
}

const renderColors = () => {
  root.querySelectorAll('[data-color-token]').forEach((row) => {
    const color = resolveColor(row.dataset.colorToken)
    const background = resolveColor(row.dataset.colorBackground)
    const ratio = contrastRatio(toRgb(color), toRgb(background))
    row.querySelector('[data-swatch]').style.backgroundColor = color
    row.querySelector('[data-color-value]').textContent = color
    row.querySelector('[data-color-contrast]').textContent =
      `${ratio.toFixed(2)}:1 sur ${row.dataset.colorBackground}, ${contrastLevel(ratio)}`
  })
}

const renderTypography = () => {
  root.querySelectorAll('[data-computed-font]').forEach((sample) => {
    const style = getComputedStyle(sample)
    sample.dataset.size = `${style.fontSize}, interligne ${style.lineHeight}`
    sample.title = sample.dataset.size
    sample.querySelector('small')?.remove()
    sample.append(
      Object.assign(document.createElement('small'), { textContent: ` (${sample.dataset.size})` }),
    )
  })
}

const renderSpacing = () => {
  root.querySelectorAll('[data-space-token]').forEach((item) => {
    const value = getComputedStyle(root).getPropertyValue(item.dataset.spaceToken).trim()
    item.querySelector('[data-space-value]').textContent = value
    item.querySelector('[data-space-bar]').style.inlineSize = `var(${item.dataset.spaceToken})`
  })
}

const render = () => {
  renderColors()
  renderTypography()
  renderSpacing()
}

new MutationObserver(render).observe(document.documentElement, {
  attributeFilter: ['data-a11y-mode'],
})
render()
