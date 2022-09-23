import { createInput, createHTMLElement } from "../htmlUtils"

export function createSVGButtons (svgDetailer) {
  const group = createHTMLElement('span')
  const extractSVG = createInput({
    attr: {
      type: 'button',
      value: 'Extract SVG'
    },
    event: {
      click: () => svgDetailer.apiShowSVG(true)
    }
  })

  const plainSVG = createInput({
    attr: {
      type: 'button',
      value: 'Plain SVG'
    },
    event: {
      click: () => svgDetailer.apiShowSVG(false)
    }
  })

  const bareSVG = createInput({
    attr: {
      type: 'button',
      value: 'Bare SVG'
    },
    event: {
      click: () => svgDetailer.apiBareSVG()
    }
  })

  const jsonSVG = createInput({
    attr: {
      type: 'button',
      value: 'JSON SV'
    },
    event: {
      click: () => svgDetailer.apiJsonSVG()
    }
  })

  group.appendChild(extractSVG)
  group.appendChild(plainSVG)
  group.appendChild(bareSVG)
  group.appendChild(jsonSVG)

  return group
}
