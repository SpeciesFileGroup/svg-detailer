import { drawMode, BoardOptions } from '../constants/index.js'
import { createHTMLElement, createInput } from '../utils/htmlUtils.js'
import { 
  createArrowOptionInputs,
  createColorInput,
  createFontSizeInput,
  createSVGButtons
} from './toolbarOptions/index.js'

export function buildSVGMenu (svgDetailer) {
  const { containerElement } = svgDetailer 

  if (containerElement.attributes['data-buttons']) {
    const buttons = JSON.parse(containerElement.attributes['data-buttons'].value).buttons
    const toolbar = createHTMLElement('div')
  
    containerElement.parentElement.appendChild(toolbar)

    buttons.forEach((button) => {
      const functionName = button.function
      let newElement
  
      switch (functionName) {
        case drawMode.CLEAR:
        case drawMode.POLYGON:
        case drawMode.POLYLINE:
        case drawMode.LINE:
        case drawMode.ARROW:
        case drawMode.RECTANGLE:
        case drawMode.CIRCLE:
        case drawMode.ELLIPSE:
        case drawMode.QUADRATIC:
        case drawMode.CUBIC:
        case drawMode.DRAW:
        case drawMode.TEXT:
        case drawMode.MOVE:
        case BoardOptions.RESET:
          newElement = createInput({
            attr: {
              type: 'button',
              value: button.value || functionName.charAt(0).toUpperCase() + functionName.slice(1),
            },
            event: {
              click: () => { svgDetailer.apiSetMode(functionName) }
            }
          })

          break;
        case BoardOptions.MODE:
          newElement = createHTMLElement('span', { id: 'mode '})
          break;

        case BoardOptions.ZOOM:
          newElement = createHTMLElement('span', { id: 'zoom' })
          newElement.innerHTML = 'Zoom: ----'
          break;
        case BoardOptions.ZOOM_IN:
          newElement = createInput({
            attr: {
              type: 'button',
              value: 'Zoom IN',
            },
            event: {
              click: e => {
                e.target.blur();
                svgDetailer.apiZoomIn()
              }
            }
          })
          break;
        case BoardOptions.ZOOM_OUT:
          newElement = createInput({
            attr: {
              type: 'button',
              value: 'Zoom OUT'
            },
            event: {
              click: () => { svgDetailer.apiZoomOut() }
            }
          })

          break;
        case BoardOptions.FONT_SIZE:
          newElement = createFontSizeInput(svgDetailer)
          break;
        case BoardOptions.NEWLINE:
          newElement = createHTMLElement('br')
          break;
        case BoardOptions.COLOR:
          newElement = createColorInput(svgDetailer)
          break;
        case BoardOptions.ARROWS_SPECS:
          newElement = createArrowOptionInputs(svgDetailer)
          break;

        case BoardOptions.JSON:
          newElement = createSVGButtons(svgDetailer)
          break;
      }

      if(newElement) {
        toolbar.appendChild(newElement)
      }
    })
  }
}
