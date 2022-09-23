import { createInput } from '../htmlUtils.js'

export function createFontSizeInput (svgDetailer) {
  const element = createInput({
    label: ' Font Size: ',
    attr: {
      type: 'number',
      min: 5,
      step: 5,
      max: 300,
      style: 'width: 4em',
      value: svgDetailer.configuration.fontSize,
    },
    event: {
      input: e => {
        svgDetailer.configuration.fontSize = e.target.value
      }
    }
  })

  return element
}
