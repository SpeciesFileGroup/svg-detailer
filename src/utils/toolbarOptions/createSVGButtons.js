import { createInput, createHTMLElement } from "../htmlUtils"

export function createSVGButtons (svgDetailer) {
  const group = createHTMLElement('span')
  const textarea = createHTMLElement('textarea', { rows: 5 })
  const extractSVG = createInput({
    attr: {
      type: 'button',
      value: 'Extract SVG'
    },
    event: {
      click: () => textarea.innerHTML = svgDetailer.apiShowSVG(true)
    }
  })

  const plainSVG = createInput({
    attr: {
      type: 'button',
      value: 'Plain SVG'
    },
    event: {
      click: () => textarea.innerHTML = svgDetailer.apiShowSVG(false)
    }
  })

  const bareSVG = createInput({
    attr: {
      type: 'button',
      value: 'Bare SVG'
    },
    event: {
      click: () => textarea.innerHTML = svgDetailer.apiBareSVG()
    }
  })

  const jsonSVG = createInput({
    attr: {
      type: 'button',
      value: 'JSON SVG'
    },
    event: {
      click: () => textarea.innerHTML = JSON.stringify(svgDetailer.apiJsonSVG())
    }
  })

  group.appendChild(extractSVG)
  group.appendChild(plainSVG)
  group.appendChild(bareSVG)
  group.appendChild(jsonSVG)
  group.appendChild(createHTMLElement('br'))
  group.appendChild(textarea)

  return group
}
