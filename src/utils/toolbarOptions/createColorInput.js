import { createInput } from '../htmlUtils.js'

export function createColorInput (svgDetailer) {
  const colorPicker = createInput({ 
    label: 'Select color: ',
    attr: {
      type: 'color',
      value: '#000000'
    },
    event: { 
      change: event => { svgDetailer.apiStroke(event.target.value) }
    }
  })

  return colorPicker
}
