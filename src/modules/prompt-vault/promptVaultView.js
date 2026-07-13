const CREATE_FORM_ID = 'prompt-create-form'
const CREATE_FORM_HEADING_ID = 'prompt-create-heading'
const SEARCH_INPUT_ID = 'prompt-search'
const CATEGORY_FILTER_ID = 'prompt-category-filter'
const FAVORITES_FILTER_ID = 'prompt-favorites-only'
const FILTER_HEADING_ID = 'prompt-filter-title'

const PROMPT_FORM_FIELD_CONFIG = Object.freeze([
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

function restoreTextSelection(element, selectionStart, selectionEnd) {
  if (
    typeof element?.setSelectionRange !== 'function' ||
    !Number.isInteger(selectionStart) ||
    !Number.isInteger(selectionEnd)
  ) {
    return
  }

  const valueLength = element.value.length
  const safeStart = Math.min(Math.max(selectionStart, 0), valueLength)
  const safeEnd = Math.min(
    Math.max(selectionEnd, safeStart),
    valueLength
  )

  element.setSelectionRange(safeStart, safeEnd)
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
    'Dieses lokale MVP unterstützt Erstellen, Bearbeiten, dauerhaftes Löschen, Suche, Kategorie-Filter und Favoriten. Prompt-Versionierung bleibt als nächster Schritt geplant.'
  )
  const promptCount = createElement('p', 'prompt-count')

  if (viewState.phase === 'ready') {
    const count = Array.isArray(viewState.prompts)
      ? viewState.prompts.length
      : 0
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

function getPromptResultLabel(viewState) {
  const totalCount = Array.isArray(viewState.prompts)
    ? viewState.prompts.length
    : 0
  const visibleCount = Array.isArray(viewState.visiblePrompts)
    ? viewState.visiblePrompts.length
    : 0

  if (viewState.hasActiveFilters === true) {
    return `${visibleCount} von ${totalCount} Prompts`
  }

  return totalCount === 1 ? '1 Prompt' : `${totalCount} Prompts`
}

function createFilterField(labelText, control) {
  const field = createElement('div', 'prompt-filter-field')
  const label = createElement('label', 'prompt-filter-label', labelText)
  label.htmlFor = control.id
  field.append(label, control)

  return field
}

function createPromptFilters(viewState, actions) {
  const filterPanel = createElement('section', 'prompt-filter-panel')
  filterPanel.setAttribute('aria-labelledby', FILTER_HEADING_ID)
  const filtersDisabled = viewState.editForm?.isOpen === true

  if (viewState.hasActiveFilters === true) {
    filterPanel.classList.add('has-active-filters')
  }

  const panelHeader = createElement(
    'div',
    'prompt-filter-panel__header'
  )
  const headingGroup = createElement('div')
  const eyebrow = createElement('span', 'eyebrow', 'Lokale Suche')
  const heading = createElement(
    'h2',
    '',
    'Prompts durchsuchen und filtern'
  )
  heading.id = FILTER_HEADING_ID
  heading.tabIndex = -1
  headingGroup.append(eyebrow, heading)

  const resultCount = createElement(
    'p',
    'prompt-filter-results',
    getPromptResultLabel(viewState)
  )
  resultCount.setAttribute('role', 'status')
  resultCount.setAttribute('aria-live', 'polite')
  resultCount.setAttribute('aria-atomic', 'true')
  panelHeader.append(headingGroup, resultCount)

  const controls = createElement('div', 'prompt-filter-controls')
  const searchInput = createElement(
    'input',
    'form-control prompt-filter-control'
  )
  searchInput.id = SEARCH_INPUT_ID
  searchInput.type = 'search'
  searchInput.name = 'promptSearch'
  searchInput.value =
    typeof viewState.searchQuery === 'string'
      ? viewState.searchQuery
      : ''
  searchInput.disabled = filtersDisabled
  searchInput.autocomplete = 'off'
  searchInput.addEventListener('input', () => {
    actions.onChangeSearchQuery?.(
      searchInput.value,
      searchInput.selectionStart,
      searchInput.selectionEnd
    )
  })
  const searchField = createFilterField(
    'Prompts durchsuchen',
    searchInput
  )
  searchField.classList.add('prompt-filter-field--search')

  const categoryFilter = createElement(
    'select',
    'form-control prompt-filter-control'
  )
  categoryFilter.id = CATEGORY_FILTER_ID
  categoryFilter.name = 'promptCategory'
  categoryFilter.disabled = filtersDisabled
  const allCategoriesOption = createElement(
    'option',
    '',
    'Alle Kategorien'
  )
  allCategoriesOption.value = ''
  categoryFilter.append(allCategoriesOption)

  if (Array.isArray(viewState.categories)) {
    viewState.categories.forEach((category) => {
      if (
        typeof category !== 'string' ||
        category.trim().length === 0
      ) {
        return
      }

      const option = createElement('option', '', category)
      option.value = category
      categoryFilter.append(option)
    })
  }

  categoryFilter.value =
    typeof viewState.selectedCategory === 'string'
      ? viewState.selectedCategory
      : ''
  categoryFilter.addEventListener('change', () => {
    actions.onChangeCategory?.(categoryFilter.value)
  })
  const categoryField = createFilterField(
    'Kategorie',
    categoryFilter
  )

  const favoritesField = createElement(
    'div',
    'prompt-filter-field prompt-filter-field--favorites'
  )
  const favoritesLabel = createElement(
    'label',
    'prompt-filter-toggle'
  )
  favoritesLabel.htmlFor = FAVORITES_FILTER_ID
  const favoritesFilter = createElement('input')
  favoritesFilter.id = FAVORITES_FILTER_ID
  favoritesFilter.name = 'promptFavoritesOnly'
  favoritesFilter.type = 'checkbox'
  favoritesFilter.checked = viewState.favoritesOnly === true
  favoritesFilter.disabled = filtersDisabled
  favoritesFilter.addEventListener('change', () => {
    actions.onChangeFavoritesOnly?.(favoritesFilter.checked)
  })
  favoritesLabel.append(
    favoritesFilter,
    createElement('span', '', 'Nur Favoriten')
  )
  favoritesField.append(favoritesLabel)
  controls.append(searchField, categoryField, favoritesField)

  filterPanel.append(panelHeader, controls)

  let resetButton = null

  if (viewState.hasActiveFilters === true) {
    const filterActions = createElement(
      'div',
      'prompt-filter-panel__actions'
    )
    resetButton = createButton(
      'Filter zurücksetzen',
      'button button--secondary prompt-filter-reset',
      actions.onResetFilters
    )
    resetButton.disabled = filtersDisabled
    filterActions.append(resetButton)
    filterPanel.append(filterActions)
  }

  return {
    element: filterPanel,
    heading,
    searchInput,
    categoryFilter,
    favoritesFilter,
    resetButton,
  }
}

function createFilteredEmptyState(viewState, actions) {
  const hasNoFavorites =
    viewState.filteredEmptyState === 'noFavorites' ||
    viewState.filteredEmptyState === 'favoritesOnly'
  const emptyState = createElement(
    'section',
    'ui-state-panel ui-state-panel--filtered-empty'
  )
  const headingId = 'prompt-filter-empty-title'
  emptyState.setAttribute('aria-labelledby', headingId)

  const stateIcon = createElement(
    'span',
    'state-icon',
    hasNoFavorites ? '☆' : '○'
  )
  stateIcon.setAttribute('aria-hidden', 'true')
  const heading = createElement(
    'h2',
    '',
    hasNoFavorites
      ? 'Noch keine Favoriten vorhanden'
      : 'Keine passenden Prompts gefunden'
  )
  heading.id = headingId
  heading.tabIndex = -1
  const description = createElement(
    'p',
    '',
    hasNoFavorites
      ? 'Für die aktuelle Auswahl sind keine Favoriten vorhanden. Deine gespeicherten Prompts bleiben unverändert.'
      : 'Passe den Suchbegriff oder die Filter an, um andere gespeicherte Prompts anzuzeigen.'
  )
  const resetButton = createButton(
    'Filter zurücksetzen',
    'button button--secondary',
    actions.onResetFilters
  )
  emptyState.append(stateIcon, heading, description, resetButton)

  return {
    element: emptyState,
    heading,
    resetButton,
  }
}

function createFormField(
  fieldConfig,
  formState,
  { idPrefix, onUpdateField },
  fieldReferences
) {
  const field = createElement('div', 'form-field')
  const fieldId = idPrefix + '-' + fieldConfig.name
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
    typeof formState.values[fieldConfig.name] === 'string'
      ? formState.values[fieldConfig.name]
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
    onUpdateField?.(fieldConfig.name, control.value)
  })
  fieldReferences.set(fieldConfig.name, control)
  field.append(label, control)

  const errorMessage = formState.fieldErrors[fieldConfig.name]

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
  form.setAttribute('aria-labelledby', CREATE_FORM_HEADING_ID)
  form.setAttribute('aria-describedby', 'prompt-create-local-hint')

  const formHeader = createElement('div', 'prompt-create-form__header')
  const headingGroup = createElement('div')
  const eyebrow = createElement('span', 'eyebrow', 'Eigener Prompt')
  const heading = createElement('h2', '', 'Prompt erstellen')
  heading.id = CREATE_FORM_HEADING_ID
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

  PROMPT_FORM_FIELD_CONFIG.forEach((fieldConfig) => {
    fieldGrid.append(
      createFormField(
        fieldConfig,
        createForm,
        {
          idPrefix: 'prompt-create',
          onUpdateField: actions.onUpdateCreateField,
        },
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
      PROMPT_FORM_FIELD_CONFIG.map(({ name }) => [
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

function createPromptEditForm(prompt, index, viewState, actions) {
  const editForm = viewState.editForm
  const idPrefix = 'prompt-edit-' + index
  const formId = idPrefix + '-form'
  const headingId = idPrefix + '-heading'
  const hintId = idPrefix + '-local-hint'
  const form = createElement('form', 'prompt-edit-form')
  form.id = formId
  form.noValidate = true
  form.setAttribute('aria-labelledby', headingId)
  form.setAttribute('aria-describedby', hintId)

  if (editForm.isSubmitting) {
    form.setAttribute('aria-busy', 'true')
  }

  const formHeader = createElement('div', 'prompt-edit-form__header')
  const headingGroup = createElement('div')
  const eyebrow = createElement(
    'span',
    'eyebrow',
    prompt.isDemo === true ? 'Beispielprompt' : 'Lokaler Prompt'
  )
  const heading = createElement('h4', '', 'Prompt bearbeiten')
  heading.id = headingId
  headingGroup.append(eyebrow, heading)
  const localHint = createElement(
    'p',
    'prompt-edit-form__hint',
    'Änderungen werden ausschließlich lokal in diesem Browser gespeichert.'
  )
  localHint.id = hintId
  formHeader.append(headingGroup, localHint)

  const fieldGrid = createElement('div', 'prompt-edit-form__fields')
  const fieldReferences = new Map()

  PROMPT_FORM_FIELD_CONFIG.forEach((fieldConfig) => {
    fieldGrid.append(
      createFormField(
        fieldConfig,
        editForm,
        {
          idPrefix,
          onUpdateField: actions.onUpdateEditField,
        },
        fieldReferences
      )
    )
  })

  let alert = null

  if (editForm.errorMessage) {
    alert = createElement(
      'p',
      'prompt-edit-form__error',
      editForm.errorMessage
    )
    alert.setAttribute('role', 'alert')
    alert.tabIndex = -1
  }

  const formActions = createElement('div', 'prompt-edit-form__actions')
  const cancelButton = createButton(
    'Abbrechen',
    'button button--secondary',
    actions.onCancelEditForm
  )
  cancelButton.disabled = editForm.isSubmitting
  const submitButton = createButton(
    editForm.isSubmitting
      ? 'Änderungen werden gespeichert …'
      : 'Änderungen speichern',
    'button button--primary'
  )
  submitButton.type = 'submit'
  submitButton.disabled = editForm.isSubmitting
  formActions.append(cancelButton, submitButton)

  form.append(formHeader, fieldGrid)

  if (alert) {
    form.append(alert)
  }

  form.append(formActions)
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const values = Object.fromEntries(
      PROMPT_FORM_FIELD_CONFIG.map(({ name }) => [
        name,
        fieldReferences.get(name)?.value ?? '',
      ])
    )
    actions.onSubmitEditForm?.(prompt.id, values)
  })

  return {
    element: form,
    formId,
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
  const accessibleTitle =
    typeof prompt.title === 'string' && prompt.title
      ? prompt.title
      : 'Prompt'
  const isEditingPrompt =
    viewState.editForm?.isOpen === true &&
    viewState.editForm.editingPromptId === prompt.id
  const isEditSubmitting =
    isEditingPrompt && viewState.editForm.isSubmitting === true
  const editFormId = 'prompt-edit-' + index + '-form'
  const isFavorite = prompt.isFavorite === true
  const favoriteAction = isFavorite
    ? 'Aus Favoriten entfernen'
    : 'Zu Favoriten hinzufügen'
  const favoriteButton = createButton(
    '',
    'button favorite-button',
    () => actions.onSetPromptFavorite?.(prompt.id, !isFavorite)
  )
  favoriteButton.setAttribute('aria-pressed', String(isFavorite))
  favoriteButton.setAttribute(
    'aria-label',
    `${favoriteAction}: ${accessibleTitle}`
  )
  const favoriteIcon = createElement(
    'span',
    'favorite-button__icon',
    isFavorite ? '★' : '☆'
  )
  favoriteIcon.setAttribute('aria-hidden', 'true')
  favoriteButton.append(
    favoriteIcon,
    createElement('span', 'favorite-button__label', favoriteAction)
  )

  if (viewState.favoriteSavingId === prompt.id) {
    favoriteButton.disabled = true
    favoriteButton.setAttribute('aria-busy', 'true')
  }

  if (isEditingPrompt) {
    favoriteButton.disabled = true
  }

  const editButton = createButton(
    'Bearbeiten',
    'button button--secondary prompt-edit-trigger',
    () => actions.onOpenEditForm?.(prompt.id)
  )
  editButton.setAttribute(
    'aria-label',
    accessibleTitle + ' bearbeiten'
  )
  editButton.setAttribute('aria-expanded', String(isEditingPrompt))

  if (isEditingPrompt) {
    editButton.setAttribute('aria-controls', editFormId)
  }

  editButton.disabled =
    isEditingPrompt || viewState.editForm?.isSubmitting === true

  const deleteButton = createButton(
    'Löschen',
    'button button--delete',
    () => actions.onRequestDelete(prompt.id)
  )
  deleteButton.setAttribute(
    'aria-label',
    accessibleTitle + ' löschen'
  )
  deleteButton.disabled = isEditSubmitting
  cardActions.append(favoriteButton, editButton, deleteButton)
  card.append(...cardContent, details, cardActions)

  if (
    viewState.favoriteErrorId === prompt.id &&
    viewState.favoriteErrorMessage
  ) {
    const favoriteError = createElement(
      'p',
      'prompt-card__favorite-error',
      viewState.favoriteErrorMessage
    )
    favoriteError.setAttribute('role', 'alert')
    card.append(favoriteError)
  }

  let promptEditForm = null

  if (isEditingPrompt) {
    promptEditForm = createPromptEditForm(
      prompt,
      index,
      viewState,
      actions
    )
    card.append(promptEditForm.element)
  }

  if (viewState.pendingDeleteId === prompt.id) {
    card.append(
      createDeleteConfirmation(prompt, viewState, actions, focusReferences)
    )
  }

  if (
    viewState.focusTarget?.type === 'editButton' &&
    viewState.focusTarget.id === prompt.id
  ) {
    focusReferences.editButton = editButton
  }

  if (
    viewState.focusTarget?.type === 'editTitle' &&
    viewState.focusTarget.id === prompt.id
  ) {
    focusReferences.editTitle = promptEditForm?.fields.get('title')
  }

  if (
    viewState.focusTarget?.type === 'editField' &&
    viewState.focusTarget.id === prompt.id
  ) {
    focusReferences.editField = promptEditForm?.fields.get(
      viewState.focusTarget.fieldName
    )
  }

  if (
    viewState.focusTarget?.type === 'editAlert' &&
    viewState.focusTarget.id === prompt.id
  ) {
    focusReferences.editAlert = promptEditForm?.alert
  }

  if (
    viewState.focusTarget?.type === 'deleteButton' &&
    viewState.focusTarget.id === prompt.id
  ) {
    focusReferences.requestedElement = deleteButton
  }

  if (
    viewState.focusTarget?.type === 'favoriteButton' &&
    viewState.focusTarget.id === prompt.id
  ) {
    focusReferences.favoriteButton = favoriteButton
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
      'Suche und Filter arbeiten ausschließlich lokal. Favoriten bleiben in diesem Browser gespeichert.'
    )
  )

  const list = createElement('ul', 'prompt-list')
  list.setAttribute('aria-label', 'Gespeicherte Prompts')
  const focusReferences = {}

  const visiblePrompts = Array.isArray(viewState.visiblePrompts)
    ? viewState.visiblePrompts
    : []

  visiblePrompts.forEach((prompt, index) => {
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

function createEditErrorMessage(message) {
  const alert = createElement(
    'p',
    'prompt-feedback prompt-feedback--error',
    message
  )
  alert.setAttribute('role', 'alert')
  alert.tabIndex = -1

  return alert
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
    const prompts = Array.isArray(viewState.prompts)
      ? viewState.prompts
      : []
    const visiblePrompts = Array.isArray(viewState.visiblePrompts)
      ? viewState.visiblePrompts
      : []
    let requestedFocusElement = null
    let shouldRevealFocus = false
    let editGlobalAlert = null

    if (viewState.statusMessage) {
      fragment.append(createSuccessMessage(viewState.statusMessage))
    }

    if (viewState.editErrorMessage) {
      editGlobalAlert = createEditErrorMessage(
        viewState.editErrorMessage
      )
      fragment.append(editGlobalAlert)
    }

    let promptForm = null
    let emptyState = null
    let promptFilters = null
    let filteredEmptyState = null
    let promptList = null

    if (viewState.phase === 'ready' && viewState.createForm?.isOpen) {
      promptForm = createPromptForm(viewState, actions)
      fragment.append(promptForm.element)
    }

    if (viewState.phase === 'loading') {
      fragment.append(createLoadingState())
    } else if (viewState.phase === 'loadError') {
      const loadError = createLoadErrorState(viewState, actions)
      fragment.append(loadError)
    } else if (prompts.length === 0) {
      emptyState = createEmptyState(viewState, actions)
      fragment.append(emptyState.element)
    } else {
      promptFilters = createPromptFilters(viewState, actions)
      fragment.append(promptFilters.element)

      if (visiblePrompts.length === 0) {
        filteredEmptyState = createFilteredEmptyState(
          viewState,
          actions
        )
        fragment.append(filteredEmptyState.element)
      } else {
        promptList = createPromptList(viewState, actions)
        fragment.append(promptList.element)
      }
    }

    const focusTarget = viewState.focusTarget
    const contentHeading =
      emptyState?.heading ??
      filteredEmptyState?.heading ??
      promptList?.heading ??
      promptFilters?.heading

    if (focusTarget?.type === 'heading') {
      requestedFocusElement = header.heading
    } else if (focusTarget?.type === 'contentHeading') {
      requestedFocusElement = contentHeading
      shouldRevealFocus = true
    } else if (focusTarget?.type === 'emptyCreateButton') {
      requestedFocusElement = emptyState?.createFirstPromptButton
      shouldRevealFocus = true
    } else if (focusTarget?.type === 'headerCreateButton') {
      requestedFocusElement = header.createPromptButton
      shouldRevealFocus = true
    } else if (focusTarget?.type === 'createTitle') {
      requestedFocusElement = promptForm?.fields.get('title')
      shouldRevealFocus = true
    } else if (focusTarget?.type === 'createField') {
      requestedFocusElement = promptForm?.fields.get(
        focusTarget.fieldName
      )
      shouldRevealFocus = true
    } else if (focusTarget?.type === 'createAlert') {
      requestedFocusElement = promptForm?.alert
      shouldRevealFocus = true
    } else if (focusTarget?.type === 'editTitle') {
      requestedFocusElement = promptList?.focusReferences.editTitle
      shouldRevealFocus = true
    } else if (focusTarget?.type === 'editField') {
      requestedFocusElement = promptList?.focusReferences.editField
      shouldRevealFocus = true
    } else if (focusTarget?.type === 'editAlert') {
      requestedFocusElement = promptList?.focusReferences.editAlert
      shouldRevealFocus = true
    } else if (focusTarget?.type === 'editButton') {
      requestedFocusElement =
        promptList?.focusReferences.editButton ?? contentHeading
      shouldRevealFocus = true
    } else if (focusTarget?.type === 'editGlobalAlert') {
      requestedFocusElement = editGlobalAlert
      shouldRevealFocus = true
    } else if (focusTarget?.type === 'searchInput') {
      requestedFocusElement = promptFilters?.searchInput
    } else if (focusTarget?.type === 'categoryFilter') {
      requestedFocusElement = promptFilters?.categoryFilter
    } else if (focusTarget?.type === 'favoritesFilter') {
      requestedFocusElement = promptFilters?.favoritesFilter
    } else if (focusTarget?.type === 'cancelButton') {
      requestedFocusElement =
        promptList?.focusReferences.cancelButton
    } else if (focusTarget?.type === 'deleteAlert') {
      requestedFocusElement =
        promptList?.focusReferences.deleteAlert
    } else if (focusTarget?.type === 'deleteButton') {
      requestedFocusElement =
        promptList?.focusReferences.requestedElement
    } else if (focusTarget?.type === 'favoriteButton') {
      requestedFocusElement =
        promptList?.focusReferences.favoriteButton ??
        promptFilters?.favoritesFilter ??
        contentHeading
    } else if (focusTarget?.type === 'promptTitle') {
      requestedFocusElement =
        promptList?.focusReferences.promptTitle ?? contentHeading
      shouldRevealFocus = true
    }

    rootElement.replaceChildren(fragment)
    focusElement(requestedFocusElement, {
      preventScroll: !shouldRevealFocus,
    })

    if (focusTarget?.type === 'searchInput') {
      restoreTextSelection(
        requestedFocusElement,
        focusTarget.selectionStart,
        focusTarget.selectionEnd
      )
    }
  }

  return Object.freeze({ render })
}
