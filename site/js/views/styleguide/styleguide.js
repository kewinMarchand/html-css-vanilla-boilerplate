import { ICON_NAMES } from '/js/shared/iconNames.js'

import { contrastLevel, contrastRatio } from './contrast.js'

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

const SVG_NS = 'http://www.w3.org/2000/svg'

const renderIcons = () => {
  root.querySelector('[data-icon-gallery]').replaceChildren(
    ...ICON_NAMES.map((name) => {
      const svg = document.createElementNS(SVG_NS, 'svg')
      const use = document.createElementNS(SVG_NS, 'use')
      use.setAttribute('href', `/icons.svg#${name}`)
      svg.setAttribute('class', 'bui-icon bui-icon--md')
      svg.setAttribute('aria-hidden', 'true')
      svg.setAttribute('width', '20')
      svg.setAttribute('height', '20')
      svg.append(use)
      const label = document.createElement('code')
      label.textContent = name
      const item = document.createElement('li')
      item.append(svg, label)
      return item
    }),
  )
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
renderIcons()
