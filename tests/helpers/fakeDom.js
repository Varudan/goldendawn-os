class FakeClassList {
  constructor(element) {
    this.element = element
  }

  get tokens() {
    return new Set(
      this.element.className.split(/\s+/).filter(Boolean)
    )
  }

  write(tokens) {
    this.element.className = [...tokens].join(' ')
  }

  add(...tokens) {
    const classTokens = this.tokens
    tokens.filter(Boolean).forEach((token) => classTokens.add(token))
    this.write(classTokens)
  }

  remove(...tokens) {
    const classTokens = this.tokens
    tokens.forEach((token) => classTokens.delete(token))
    this.write(classTokens)
  }

  contains(token) {
    return this.tokens.has(token)
  }

  toggle(token, force) {
    const classTokens = this.tokens
    const shouldAdd =
      typeof force === 'boolean' ? force : !classTokens.has(token)

    if (shouldAdd) {
      classTokens.add(token)
    } else {
      classTokens.delete(token)
    }

    this.write(classTokens)
    return shouldAdd
  }
}

class FakeNode {
  constructor(ownerDocument, nodeType) {
    this.ownerDocument = ownerDocument
    this.nodeType = nodeType
    this.parentNode = null
    this.children = []
    this._textContent = ''
  }

  append(...nodes) {
    for (const node of nodes) {
      if (node == null) {
        continue
      }

      if (node.nodeType === 11) {
        this.append(...[...node.children])
        node.children = []
        continue
      }

      const appendedNode =
        typeof node === 'string' || typeof node === 'number'
          ? this.ownerDocument.createTextNode(String(node))
          : node
      appendedNode.parentNode = this
      this.children.push(appendedNode)
    }
  }

  replaceChildren(...nodes) {
    this.children.forEach((child) => {
      child.parentNode = null
    })
    this.children = []
    this._textContent = ''
    this.append(...nodes)
  }

  get childElementCount() {
    return this.children.filter((child) => child.nodeType === 1).length
  }

  get textContent() {
    return (
      this._textContent +
      this.children.map((child) => child.textContent).join('')
    )
  }

  set textContent(value) {
    this.children = []
    this._textContent = value == null ? '' : String(value)
  }
}

class FakeTextNode extends FakeNode {
  constructor(ownerDocument, text) {
    super(ownerDocument, 3)
    this._textContent = text
  }
}

export class FakeElement extends FakeNode {
  constructor(ownerDocument, tagName) {
    super(ownerDocument, 1)
    this.tagName = tagName.toUpperCase()
    this.localName = tagName.toLowerCase()
    this.attributes = new Map()
    this.eventListeners = new Map()
    this.classList = new FakeClassList(this)
    this.className = ''
    this.id = ''
    this.disabled = false
    this.checked = false
    this.value = ''
    this.tabIndex = 0
  }

  setAttribute(name, value) {
    const normalizedValue = String(value)
    this.attributes.set(name, normalizedValue)

    if (name === 'id') {
      this.id = normalizedValue
    } else if (name === 'class') {
      this.className = normalizedValue
    }
  }

  getAttribute(name) {
    return this.attributes.has(name) ? this.attributes.get(name) : null
  }

  hasAttribute(name) {
    return this.attributes.has(name)
  }

  removeAttribute(name) {
    this.attributes.delete(name)

    if (name === 'id') {
      this.id = ''
    } else if (name === 'class') {
      this.className = ''
    }
  }

  addEventListener(type, listener) {
    const listeners = this.eventListeners.get(type) ?? []
    listeners.push(listener)
    this.eventListeners.set(type, listeners)
  }

  dispatchEvent(event) {
    const dispatchedEvent =
      typeof event === 'string'
        ? { type: event }
        : event
    dispatchedEvent.defaultPrevented = false
    dispatchedEvent.preventDefault = () => {
      dispatchedEvent.defaultPrevented = true
    }

    for (const listener of this.eventListeners.get(dispatchedEvent.type) ?? []) {
      listener.call(this, dispatchedEvent)
    }

    return !dispatchedEvent.defaultPrevented
  }

  click() {
    if (!this.disabled) {
      this.dispatchEvent({ type: 'click' })
    }
  }

  focus(options = {}) {
    this.ownerDocument.activeElement = this
    this.focusOptions = { ...options }
  }

  setSelectionRange(selectionStart, selectionEnd) {
    this.selectionStart = selectionStart
    this.selectionEnd = selectionEnd
  }

  get innerHTML() {
    return ''
  }

  set innerHTML(_value) {
    throw new Error('innerHTML ist im sicheren View-Test nicht erlaubt.')
  }
}

class FakeDocumentFragment extends FakeNode {
  constructor(ownerDocument) {
    super(ownerDocument, 11)
  }
}

export class FakeDocument {
  constructor() {
    this.activeElement = null
  }

  createElement(tagName) {
    return new FakeElement(this, tagName)
  }

  createTextNode(text) {
    return new FakeTextNode(this, text)
  }

  createDocumentFragment() {
    return new FakeDocumentFragment(this)
  }
}

export function createFakeDom() {
  const previousDocument = globalThis.document
  const fakeDocument = new FakeDocument()
  const root = fakeDocument.createElement('main')
  globalThis.document = fakeDocument

  return {
    document: fakeDocument,
    root,
    restore() {
      if (typeof previousDocument === 'undefined') {
        delete globalThis.document
      } else {
        globalThis.document = previousDocument
      }
    },
  }
}

export function findAll(root, predicate) {
  const matches = []

  function visit(node) {
    if (predicate(node)) {
      matches.push(node)
    }

    node.children?.forEach(visit)
  }

  visit(root)
  return matches
}

export function findByClass(root, className) {
  return findAll(
    root,
    (node) => node.nodeType === 1 && node.classList.contains(className)
  )
}

export function findByTag(root, tagName) {
  const normalizedTagName = tagName.toUpperCase()
  return findAll(
    root,
    (node) => node.nodeType === 1 && node.tagName === normalizedTagName
  )
}

export function findByText(root, text) {
  return findAll(
    root,
    (node) => node.nodeType === 1 && node.textContent === text
  )
}
