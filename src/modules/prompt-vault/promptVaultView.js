const CREATE_FORM_ID = 'prompt-create-form'

const CREATE_FIELD_CONFIG = Object.freeze([
  Object.freeze({
    name: 'title',
    label: 'Titel',
    required: true,
    maxLength: 120,
    element: 'input',
  }),
  Object.freeze({
    name: 'category',
    label: 'Kategorie',
    required: false,
    maxLength: 60,
    element: 'input',
  }),
  Object.freeze({
    name: 'description',
    label: 'Beschreibung',
    required: false,
    maxLength: 240,
    element: 'textarea',
    rows: 4,
  }),
  Object.freeze({
    name: 'content',
    label: 'Prompt-Text',
    required: true,
    maxLength: 10000,
    element: 'textarea',
    rows: 10,
  }),
])

function createElement(tagName, className, text) {
  const element = document.createElement(tagName)

  if (className) {
    element.className = className
  }

  if (typeof text === 'string') {
    element.textContent = text
  }

  return element
}

function createButton(label, className, onClick) {
  const button = createElement('button', className, label)
  button.type = 'button'

  if (typeof onClick === 'function') {
    button.addEventListener('click', onClick)
  }

  return button
}

function focusElement(element, { preventScroll = true } = {}) {
  if (typeof element?.focus !== 'function') {
    return
  }

  element.focus({ preventScroll })
}

function createHeader(viewState, actions) {
  const header = createElement('header', 'topbar prompt-vault-header')
  const titleGroup = createElement('div')
  const eyebrow = createElement('span', 'eyebrow', 'Prompt Engineering')
  const title = createElement('h1', '', 'PromptVault')
  title.tabIndex = -1
  titleGroup.append(eyebrow, title)

  const headerActions = createElement(
    'div',
    'prompt-vault-header__actions'
  )
  const modeStatus = createElement('span', 'system-state')
  const modeIndicator = createElement('span')
  modeIndicator.setAttribute('aria-hidden', 'true')
  modeStatus.append(modeIndicator, 'Lokaler Modus')

  const createPromptButton = createButton(
    'Prompt erstellen',
    'button button--primary prompt-create-trigger',
    () => actions.onOpenCreateForm?.('header')
  )
  createPromptButton.setAttribute('aria-controls', CREATE_FORM_ID)
  createPromptButton.setAttribute(
    'aria-expanded',
    String(viewState.createForm?.isOpen === true)
  )
  createPromptButton.disabled =
    viewState.phase !== 'ready' || viewState.createForm?.isOpen === true
  headerActions.append(modeStatus, createPromptButton)
  header.append(titleGroup, headerActions)

  const introduction = createElement('div', 'prompt-vault-introduction')
  const description = createElement(
    'p',
    '',
    'Dieses lokale MVP zeigt gespeicherte Prompts vollständig an, erstellt eigene Prompts und ermöglicht dauerhaftes Löschen. Weitere Verwaltungsfunktionen sind noch geplant.'
  )
  const promptCount = createElement('p', 'prompt-count')
  promptCount.setAttribute('aria-live', 'polite')

  if (viewState.phase === 'ready') {
    const count = viewState.prompts.length
    const countValue = createElement('strong', '', String(count))
    const countLabel = createElement(
      'span',
      '',
      count === 1 ? 'Prompt lokal gespeichert' : 'Prompts lokal gespeichert'
    )
    promptCount.append(countValue, countLabel)
  } else if (viewState.phase === 'loading') {
    promptCount.append(
      createElement('strong', '', '…'),
      createElement('span', '', 'Prompts werden geladen')
    )
  } else {
    promptCount.append(
      createElement('strong', '', '–'),
      createElement('span', '', 'Anzahl nicht verfügbar')
    )
  }

  introduction.append(description, promptCount)

  return {
    elements: [header, introduction],
    heading: title,
    createPromptButton,
  }
}

function createLoadingState() {
  const loadingState = createElement(
    'section',
    'ui-state-panel ui-state-panel--loading'
  )
  loadingState.setAttribute('role', 'status')
  loadingState.setAttribute('aria-live', 'polite')
  loadingState.setAttribute('aria-busy', 'true')

  const indicator = createElement('span', 'loading-indicator')
  indicator.setAttribute('aria-hidden', 'true')
  const content = createElement('div')
  content.append(
    createElement('h2', '', 'Prompts werden geladen'),
    createElement(
      'p',
      '',
      'Die lokal gespeicherten PromptVault-Daten werden vorbereitet.'
    )
  )
  loadingState.append(indicator, content)

  return loadingState
}

function createLoadErrorState(viewState, actions) {
  const errorState = createElement(
    'section',
    'ui-state-panel ui-state-panel--error'
  )
  errorState.setAttribute('role', 'alert')
  const stateIcon = createElement('span', 'state-icon', '!')
  stateIcon.setAttribute('aria-hidden', 'true')
  errorState.append(
    stateIcon,
    createElement('h2', '', 'PromptVault konnte nicht geladen werden'),
    createElement('p', '', viewState.errorMessage)
  )

  const retryButton = createButton(
    'Erneut versuchen',
    'button button--secondary',
    actions.onRetryLoad
  )
  errorState.append(retryButton)

  return errorState
}

function createEmptyState(viewState, actions) {
  const emptyState = createElement(
    'section',
    'ui-state-panel ui-state-panel--empty'
  )
  const stateIcon = createElement('span', 'state-icon', '○')
  stateIcon.setAttribute('aria-hidden', 'true')
  const heading = createElement('h2', '', 'Noch keine Prompts gespeichert')
  heading.tabIndex = -1
  const description = createElement(
    'p',
    '',
    'Aktuell sind keine Prompts lokal gespeichert. Du kannst jetzt deinen ersten eigenen Prompt anlegen.'
  )
  const createFirstPromptButton = createButton(
    'Ersten Prompt erstellen',
    'button button--primary',
    () => actions.onOpenCreateForm?.('empty')
  )
  createFirstPromptButton.setAttribute('aria-controls', CREATE_FORM_ID)
  createFirstPromptButton.setAttribute(
    'aria-expanded',
    String(viewState.createForm?.isOpen === true)
  )
  createFirstPromptButton.disabled = viewState.createForm?.isOpen === true
  emptyState.append(
    stateIcon,
    heading,
    description,
    createFirstPromptButton
  )

  return {
    element: emptyState,
    heading,
    createFirstPromptButton,
  }
}

function createFormField(fieldConfig, createForm, actions, fieldReferences) {
  const field = createElement('div', 'form-field')
  const fieldId = 'prompt-create-' + fieldConfig.name
  const errorId = fieldId + '-error'
  const label = createElement('label', 'form-label')
  label.htmlFor = fieldId
  label.append(
    createElement('span', '', fieldConfig.label),
    createElement(
      'span',
      'form-requirement',
      fieldConfig.required ? 'Erforderlich' : 'Optional'
    )
  )

  const control = createElement(fieldConfig.element, 'form-control')
  control.id = fieldId
  control.name = fieldConfig.name
  control.maxLength = fieldConfig.maxLength
  control.value =
    typeof createForm.values[fieldConfig.name] === 'string'
      ? createForm.values[fieldConfig.name]
      : ''
  control.required = fieldConfig.required
  control.autocomplete = 'off'

  if (fieldConfig.element === 'textarea') {
    control.rows = fieldConfig.rows
    control.wrap = 'soft'
  } else {
    control.type = 'text'
  }

  control.addEventListener('input', () => {
    actions.onUpdateCreateField?.(fieldConfig.name, control.value)
  })
  fieldReferences.set(fieldConfig.name, control)
  field.append(label, control)

  const errorMessage = createForm.fieldErrors[fieldConfig.name]

  if (typeof errorMessage === 'string') {
    control.setAttribute('aria-invalid', 'true')
    control.setAttribute('aria-describedby', errorId)
    const error = createElement('p', 'form-field__error', errorMessage)
    error.id = errorId
    field.append(error)
  }

  return field
}

function createPromptForm(viewState, actions) {
  const createForm = viewState.createForm
  const form = createElement('form', 'prompt-create-form')
  form.id = CREATE_FORM_ID
  form.noValidate = true
  form.setAttribute('aria-labelledby', 'prompt-create-title')
  form.setAttribute('aria-describedby', 'prompt-create-local-hint')

  const formHeader = createElement('div', 'prompt-create-form__header')
  const headingGroup = createElement('div')
  const eyebrow = createElement('span', 'eyebrow', 'Eigener Prompt')
  const heading = createElement('h2', '', 'Prompt erstellen')
  heading.id = 'prompt-create-title'
  headingGroup.append(eyebrow, heading)
  const localHint = createElement(
    'p',
    'prompt-create-form__hint',
    'Dieser Prompt wird ausschließlich lokal in diesem Browser gespeichert.'
  )
  localHint.id = 'prompt-create-local-hint'
  formHeader.append(headingGroup, localHint)

  const fieldGrid = createElement('div', 'prompt-create-form__fields')
  const fieldReferences = new Map()

  CREATE_FIELD_CONFIG.forEach((fieldConfig) => {
    fieldGrid.append(
      createFormField(
        fieldConfig,
        createForm,
        actions,
        fieldReferences
      )
    )
  })

  let alert = null

  if (createForm.errorMessage) {
    alert = createElement(
      'p',
      'prompt-create-form__error',
      createForm.errorMessage
    )
    alert.setAttribute('role', 'alert')
    alert.tabIndex = -1
  }

  const formActions = createElement('div', 'prompt-create-form__actions')
  const submitButton = createButton(
    'Prompt speichern',
    'button button--primary'
  )
  submitButton.type = 'submit'
  submitButton.disabled = createForm.isSubmitting
  const cancelButton = createButton(
    'Abbrechen',
    'button button--secondary',
    actions.onCancelCreateForm
  )
  cancelButton.disabled = createForm.isSubmitting
  formActions.append(cancelButton, submitButton)

  form.append(formHeader, fieldGrid)

  if (alert) {
    form.append(alert)
  }

  form.append(formActions)
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const values = Object.fromEntries(
      CREATE_FIELD_CONFIG.map(({ name }) => [
        name,
        fieldReferences.get(name)?.value ?? '',
      ])
    )
    actions.onSubmitCreateForm?.(values)
  })

  return {
    element: form,
    fields: fieldReferences,
    alert,
  }
}

function createDeleteConfirmation(prompt, viewState, actions, focusReferences) {
  const confirmation = createElement('fieldset', 'delete-confirmation')
  const legend = createElement('legend', '', 'Prompt wirklich löschen?')
  const explanation = createElement(
    'p',
    '',
    'Der Prompt wird dauerhaft aus diesem Browser entfernt.'
  )
  const actionGroup = createElement('div', 'delete-confirmation__actions')
  const cancelButton = createButton(
    'Abbrechen',
    'button button--secondary',
    actions.onCancelDelete
  )
  const confirmButton = createButton(
    'Endgültig löschen',
    'button button--danger',
    () => actions.onConfirmDelete(prompt.id)
  )
  const isDeleting = viewState.deletingId === prompt.id
  cancelButton.disabled = isDeleting
  confirmButton.disabled = isDeleting
  actionGroup.append(cancelButton, confirmButton)
  confirmation.append(legend, explanation, actionGroup)

  if (viewState.deleteErrorId === prompt.id && viewState.errorMessage) {
    const errorMessage = createElement(
      'p',
      'delete-confirmation__error',
      viewState.errorMessage
    )
    errorMessage.setAttribute('role', 'alert')
    errorMessage.tabIndex = -1
    confirmation.append(errorMessage)
    focusReferences.deleteAlert = errorMessage
  }

  focusReferences.cancelButton = cancelButton

  return confirmation
}

function createPromptCard(prompt, index, viewState, actions, focusReferences) {
  const listItem = createElement('li', 'prompt-list__item')
  const card = createElement('article', 'prompt-card')
  const cardHeader = createElement('div', 'prompt-card__header')
  const title = createElement('h3', 'prompt-card__title', prompt.title)
  const titleId = 'prompt-title-' + index
  title.id = titleId
  title.tabIndex = -1
  card.setAttribute('aria-labelledby', titleId)

  const badges = createElement('div', 'prompt-card__badges')

  if (
    typeof prompt.category === 'string' &&
    prompt.category.trim().length > 0
  ) {
    badges.append(
      createElement('span', 'prompt-category', prompt.category)
    )
  }

  if (prompt.isDemo === true) {
    badges.append(createElement('span', 'demo-label', 'Beispielprompt'))
  }

  cardHeader.append(title)

  if (badges.childElementCount > 0) {
    cardHeader.append(badges)
  }

  const cardContent = [cardHeader]

  if (
    typeof prompt.description === 'string' &&
    prompt.description.trim().length > 0
  ) {
    cardContent.push(
      createElement(
        'p',
        'prompt-card__description',
        prompt.description
      )
    )
  }

  const details = createElement('details', 'prompt-details')
  const summary = createElement('summary', '', 'Prompt anzeigen')
  const promptContent = createElement(
    'div',
    'prompt-content',
    prompt.content
  )
  details.append(summary, promptContent)

  const cardActions = createElement('div', 'prompt-card__actions')
  const deleteButton = createButton(
    'Löschen',
    'button button--delete',
    () => actions.onRequestDelete(prompt.id)
  )
  const accessibleTitle =
    typeof prompt.title === 'string' && prompt.title
      ? prompt.title
      : 'Prompt'
  deleteButton.setAttribute(
    'aria-label',
    accessibleTitle + ' löschen'
  )
  cardActions.append(deleteButton)
  card.append(...cardContent, details, cardActions)

  if (viewState.pendingDeleteId === prompt.id) {
    card.append(
      createDeleteConfirmation(prompt, viewState, actions, focusReferences)
    )
  }

  if (
    viewState.focusTarget?.type === 'deleteButton' &&
    viewState.focusTarget.id === prompt.id
  ) {
    focusReferences.requestedElement = deleteButton
  }

  if (
    viewState.focusTarget?.type === 'promptTitle' &&
    viewState.focusTarget.id === prompt.id
  ) {
    focusReferences.promptTitle = title
  }

  listItem.append(card)

  return listItem
}

function createPromptList(viewState, actions) {
  const section = createElement('section', 'prompt-list-section')
  const sectionHeader = createElement(
    'div',
    'section-heading prompt-list-heading'
  )
  const headingGroup = createElement('div')
  const eyebrow = createElement('span', 'eyebrow', 'Lokale Bibliothek')
  const heading = createElement('h2', '', 'Gespeicherte Prompts')
  heading.tabIndex = -1
  headingGroup.append(eyebrow, heading)
  sectionHeader.append(
    headingGroup,
    createElement(
      'p',
      '',
      'Kategorien werden als Metadatum angezeigt; Suche und Filter sind noch nicht umgesetzt.'
    )
  )

  const list = createElement('ul', 'prompt-list')
  list.setAttribute('aria-label', 'Gespeicherte Prompts')
  const focusReferences = {}

  viewState.prompts.forEach((prompt, index) => {
    list.append(
      createPromptCard(prompt, index, viewState, actions, focusReferences)
    )
  })

  section.append(sectionHeader, list)

  return {
    element: section,
    heading,
    focusReferences,
  }
}

function createSuccessMessage(message) {
  const status = createElement('p', 'prompt-feedback', message)
  status.setAttribute('role', 'status')
  status.setAttribute('aria-live', 'polite')

  return status
}

export function createPromptVaultView(rootElement) {
  if (typeof rootElement?.replaceChildren !== 'function') {
    throw new TypeError(
      'Für PromptVault wird ein gültiges Root-Element benötigt.'
    )
  }

  function render(viewState, actions = {}) {
    const fragment = document.createDocumentFragment()
    const header = createHeader(viewState, actions)
    fragment.append(...header.elements)
    let requestedFocusElement = null
    let shouldRevealFocus = false

    if (viewState.statusMessage) {
      fragment.append(createSuccessMessage(viewState.statusMessage))
    }

    let promptForm = null

    if (viewState.phase === 'ready' && viewState.createForm?.isOpen) {
      promptForm = createPromptForm(viewState, actions)
      fragment.append(promptForm.element)
    }

    if (viewState.phase === 'loading') {
      fragment.append(createLoadingState())
    } else if (viewState.phase === 'loadError') {
      const loadError = createLoadErrorState(viewState, actions)
      fragment.append(loadError)
      requestedFocusElement =
        viewState.focusTarget?.type === 'heading' ? header.heading : null
    } else if (viewState.prompts.length === 0) {
      const emptyState = createEmptyState(viewState, actions)
      fragment.append(emptyState.element)

      if (viewState.focusTarget?.type === 'contentHeading') {
        requestedFocusElement = emptyState.heading
        shouldRevealFocus = true
      } else if (viewState.focusTarget?.type === 'emptyCreateButton') {
        requestedFocusElement = emptyState.createFirstPromptButton
        shouldRevealFocus = true
      }
    } else {
      const promptList = createPromptList(viewState, actions)
      fragment.append(promptList.element)

      if (viewState.focusTarget?.type === 'heading') {
        requestedFocusElement = header.heading
      } else if (viewState.focusTarget?.type === 'contentHeading') {
        requestedFocusElement = promptList.heading
        shouldRevealFocus = true
      } else if (viewState.focusTarget?.type === 'cancelButton') {
        requestedFocusElement = promptList.focusReferences.cancelButton
      } else if (viewState.focusTarget?.type === 'deleteAlert') {
        requestedFocusElement = promptList.focusReferences.deleteAlert
      } else if (viewState.focusTarget?.type === 'promptTitle') {
        requestedFocusElement = promptList.focusReferences.promptTitle
        shouldRevealFocus = true
      } else {
        requestedFocusElement = promptList.focusReferences.requestedElement
      }
    }

    if (
      viewState.focusTarget?.type === 'headerCreateButton'
    ) {
      requestedFocusElement = header.createPromptButton
      shouldRevealFocus = true
    } else if (
      promptForm &&
      viewState.focusTarget?.type === 'createTitle'
    ) {
      requestedFocusElement = promptForm.fields.get('title')
      shouldRevealFocus = true
    } else if (
      promptForm &&
      viewState.focusTarget?.type === 'createField'
    ) {
      requestedFocusElement = promptForm.fields.get(
        viewState.focusTarget.fieldName
      )
      shouldRevealFocus = true
    } else if (
      promptForm &&
      viewState.focusTarget?.type === 'createAlert'
    ) {
      requestedFocusElement = promptForm.alert
      shouldRevealFocus = true
    }

    rootElement.replaceChildren(fragment)
    focusElement(requestedFocusElement, {
      preventScroll: !shouldRevealFocus,
    })
  }

  return Object.freeze({ render })
}
