export function createHTMLElement (tagElement, attr = {}) {
  const element = document.createElement(tagElement)
  
  Object.entries(attr).forEach(([attr, value]) => {
    element.setAttribute(attr, value)
  })

  return element
}

export function createSVGElement (tagElement, attr = {}) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tagElement)
  
  Object.entries(attr).forEach(([attr, value]) => {
    element.setAttributeNS(attr, value)
  })

  return element
}

export function createInput ({ 
  label,
  attr = {}, 
  event = {} 
}) {
  const eventList = Object.entries(event)
  const inputElement = createHTMLElement('input', {
    type: 'text',
    ...attr
  })

  eventList.forEach(([eventName, callback]) => {
    inputElement.addEventListener(eventName, callback)
  })

  if (label) {
    const labelElement = createHTMLElement('label')

    labelElement.innerHTML = label
    labelElement.appendChild(inputElement)

    return labelElement
  } else {
    return inputElement
  }
}