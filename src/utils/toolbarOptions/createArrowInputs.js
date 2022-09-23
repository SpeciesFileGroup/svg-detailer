import { createInput, createHTMLElement } from '../htmlUtils.js'

export function createArrowOptionInputs (svgDetailer) {
  const group = createHTMLElement('span', { innerHTML: 'Arrowhead: ' })
  const arrowClose = createInput({ label: 'Close', attr: { type: 'checkbox' }, event: { change: e => svgDetailer.apiArrowClosed(e.target.value) }})
  const arrowFixed = createInput({ label: 'Fixed', attr: { type: 'checkbox' }, event: { change: e => svgDetailer.apiArrowFixed(e.target.value) }})
  const arrowLength = createInput({ 
    label: 'Length',
    attr: {
      type: 'number',
      value: 50,
      style: 'width: 4em'
    },
    event: {
      change: e => svgDetailer.configuration.arrowheadLength = e.target.value
    }
  })
  const arrowPercent = createInput({ 
    label: 'Percent',
    attr: {
      type: 'number',
      value: 10,
      min: 5,
      step: 1,
      max: 30,
      style: 'width: 4em'
    },
    event: { 
      change: e => svgDetailer.configuration.arrowPercent = e.target.value
    }
  })

  group.innerHTML = 'Arrowhead: '

  group.appendChild(arrowClose)
  group.appendChild(arrowFixed)
  group.appendChild(arrowLength)
  group.appendChild(arrowPercent)

  return group
}