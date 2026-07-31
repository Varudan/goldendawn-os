import {
  LICHTWALD_LOG_MAX_TAG_COUNT,
  LICHTWALD_LOG_TAG_MAX_LENGTH,
  LICHTWALD_LOG_TEXT_MAX_LENGTH,
  LICHTWALD_LOG_TITLE_MAX_LENGTH,
} from './lichtwaldLogContract.js'

const ROOT_ERROR_MESSAGE =
  'Für LichtwaldLog wird ein gültiges Root-Element benötigt.'

const ACTION_NAMES = Object.freeze([
  'onRetryLoad',
  'onSelectEntry',
  'onBackToOverview',
  'onOpenCreateEntryForm',
  'onOpenUpdateEntryForm',
  'onUpdateFormField',
  'onSubmitForm',
  'onCancelForm',
  'onRequestDeleteEntry',
  'onCancelDeleteEntry',
  'onConfirmDeleteEntry',
  'onSetFeaturedEntry',
])

const FORM_TYPES = Object.freeze({
  CREATE: 'createEntry',
  UPDATE: 'updateEntry',
})

const SCALAR_FIELD_CONFIGS = Object.freeze([
  Object.freeze({
    name: 'calendarDate',
    label: 'Kalenderdatum',
    elementName: 'input',
    hint: 'Format YYYY-MM-DD. Der Wert wird ohne Zeitzonenumwandlung gespeichert.',
  }),
  Object.freeze({
    name: 'title',
    label: 'Titel',
    elementName: 'input',
    hint:
      'Maximal ' +
      String(LICHTWALD_LOG_TITLE_MAX_LENGTH) +
      ' Zeichen.',
    maxLength: LICHTWALD_LOG_TITLE_MAX_LENGTH,
  }),
  Object.freeze({
    name: 'text',
    label: 'Eintragstext',
    elementName: 'textarea',
    hint:
      'Maximal ' +
      LICHTWALD_LOG_TEXT_MAX_LENGTH.toLocaleString('de-DE') +
      ' Zeichen. Zeilenumbrüche bleiben erhalten.',
    maxLength: LICHTWALD_LOG_TEXT_MAX_LENGTH,
    rows: 12,
  }),
])

const FORM_CONFIGS = Object.freeze({
  [FORM_TYPES.CREATE]: Object.freeze({
    heading: 'Neuen LichtwaldLog-Eintrag erstellen',
    description:
      'Der Eintrag wird erst nach dem Absenden über die lokale Servicegrenze gespeichert.',
    submitLabel: 'Eintrag erstellen',
  }),
  [FORM_TYPES.UPDATE]: Object.freeze({
    heading: 'LichtwaldLog-Eintrag bearbeiten',
    description:
      'Alle vier Inhaltsfelder werden gemeinsam und vollständig gespeichert.',
    submitLabel: 'Änderungen speichern',
  }),
})

function isObjectLike(value) {
  return (
    (typeof value === 'object' && value !== null) ||
    typeof value === 'function'
  )
}

function readRootMethod(rootElement, methodName) {
  if (!isObjectLike(rootElement)) return null

  try {
    const method = rootElement[methodName]
    return typeof method === 'function' ? method : null
  } catch {
    return null
  }
}

function createRootPort(rootElement) {
  const replaceChildren = readRootMethod(rootElement, 'replaceChildren')
  const setAttribute = readRootMethod(rootElement, 'setAttribute')
  const removeAttribute = readRootMethod(rootElement, 'removeAttribute')

  if (!replaceChildren || !setAttribute || !removeAttribute) {
    throw new TypeError(ROOT_ERROR_MESSAGE)
  }

  return Object.freeze({
    replaceChildren,
    setAttribute,
    removeAttribute,
  })
}

function callRootMethod(rootElement, method, args) {
  try {
    return Reflect.apply(method, rootElement, args)
  } catch {
    throw new TypeError(ROOT_ERROR_MESSAGE)
  }
}

function readOwnDataProperty(value, propertyName) {
  if (!isObjectLike(value)) return { found: false }

  try {
    const descriptor = Object.getOwnPropertyDescriptor(value, propertyName)

    if (
      !descriptor ||
      !Object.hasOwn(descriptor, 'value')
    ) {
      return { found: false }
    }

    return { found: true, value: descriptor.value }
  } catch {
    return { found: false }
  }
}

function readOwnString(value, propertyName) {
  const property = readOwnDataProperty(value, propertyName)
  return property.found && typeof property.value === 'string'
    ? property.value
    : ''
}

function createActionPort(actions) {
  const actionPort = {}

  for (const actionName of ACTION_NAMES) {
    const property = readOwnDataProperty(actions, actionName)
    actionPort[actionName] = (
      property.found && typeof property.value === 'function'
    )
      ? property.value
      : null
  }

  return Object.freeze(actionPort)
}

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

function setElementId(element, id) {
  element.id = id
  element.setAttribute('id', id)
}

function makeProgrammaticallyFocusable(element) {
  element.tabIndex = -1
  element.setAttribute('tabindex', '-1')
}

function createButton(
  label,
  className,
  onClick,
  { disabled = false } = {}
) {
  const button = createElement('button', className, label)
  button.type = 'button'
  button.setAttribute('type', 'button')
  button.disabled = disabled

  if (typeof onClick === 'function') {
    button.addEventListener('click', (event) => {
      if (button.disabled) return
      onClick(event)
    })
  }

  return button
}

function createFocusReferences() {
  return {
    heading: null,
    entryHeadings: new Map(),
    formFields: new Map(),
    tagInputs: [],
    formAlert: null,
    createFormTrigger: null,
    updateFormTriggers: new Map(),
    deleteConfirmations: new Map(),
    deleteAlerts: new Map(),
    featuredAlert: null,
    status: null,
  }
}

function getEntries(viewModel) {
  return Array.isArray(viewModel?.entries)
    ? viewModel.entries
    : []
}

function getTags(entry) {
  return Array.isArray(entry?.tags) ? entry.tags : []
}

function getFormTags(form) {
  return Array.isArray(form?.values?.tags)
    ? form.values.tags
    : []
}

function getFieldError(fieldErrors, fieldName) {
  return readOwnString(fieldErrors, fieldName)
}

function createHeader(entryCount, isBusy, focusReferences) {
  const header = createElement('header', 'topbar lichtwald-log-header')
  const titleGroup = createElement('div', 'lichtwald-log-header__title')
  const eyebrow = createElement(
    'span',
    'eyebrow',
    'Lokales Journal'
  )
  const heading = createElement('h1', '', 'LichtwaldLog')
  setElementId(heading, 'lichtwald-log-heading')
  makeProgrammaticallyFocusable(heading)
  focusReferences.heading = heading
  titleGroup.append(eyebrow, heading)

  const state = createElement(
    'span',
    'system-state',
    isBusy ? 'Wird lokal verarbeitet' : 'Lokaler Modus'
  )
  const marker = createElement('span')
  marker.setAttribute('aria-hidden', 'true')
  state.append(marker)
  header.append(titleGroup, state)

  const introduction = createElement(
    'section',
    'lichtwald-log-introduction'
  )
  introduction.setAttribute(
    'aria-labelledby',
    'lichtwald-log-introduction-title'
  )
  const introductionText = createElement(
    'div',
    'lichtwald-log-introduction__text'
  )
  const introductionHeading = createElement(
    'h2',
    'lichtwald-log-introduction__title',
    'Gedanken und Beobachtungen im aktuellen Browserprofil'
  )
  setElementId(
    introductionHeading,
    'lichtwald-log-introduction-title'
  )
  introductionText.append(
    introductionHeading,
    createElement(
      'p',
      '',
      'Erstelle, bearbeite und fokussiere private Journaleinträge mit Kalenderdatum, Titel, Text und einzelnen Tags.'
    )
  )
  const count = createElement('p', 'lichtwald-log-count')
  count.append(
    createElement('strong', '', String(entryCount)),
    document.createTextNode(
      entryCount === 1 ? ' Eintrag' : ' Einträge'
    )
  )
  introduction.append(introductionText, count)

  return { header, introduction }
}

function createPrivacyNotice() {
  const notice = createElement('aside', 'lichtwald-log-privacy')
  notice.setAttribute(
    'aria-labelledby',
    'lichtwald-log-privacy-title'
  )
  const heading = createElement(
    'h2',
    'lichtwald-log-privacy__title',
    'Lokale und unverschlüsselte Speicherung'
  )
  setElementId(heading, 'lichtwald-log-privacy-title')
  notice.append(
    heading,
    createElement(
      'p',
      '',
      'Deine LichtwaldLog-Inhalte werden ausschließlich im aktuellen Browserprofil gespeichert. Es gibt keine Synchronisierung zwischen Geräten und keine automatische Cloud-Sicherung. localStorage ist unverschlüsselt und für andere Skripte derselben Origin grundsätzlich lesbar. Beim Löschen von Browserdaten können die Inhalte verloren gehen.'
    )
  )
  return notice
}

function createStatusFeedback(viewModel, focusReferences) {
  const statusMessage = typeof viewModel?.statusMessage === 'string'
    ? viewModel.statusMessage
    : ''

  if (!statusMessage) return null

  const toneClass = viewModel.statusMessageTone === 'notice'
    ? 'lichtwald-log-feedback--notice'
    : 'lichtwald-log-feedback--success'
  const status = createElement(
    'p',
    'lichtwald-log-feedback ' + toneClass,
    statusMessage
  )
  status.setAttribute('role', 'status')
  status.setAttribute('aria-live', 'polite')
  status.setAttribute('aria-atomic', 'true')
  makeProgrammaticallyFocusable(status)
  focusReferences.status = status
  return status
}

function createGlobalErrorFeedback(viewModel) {
  const errorMessage = typeof viewModel?.errorMessage === 'string'
    ? viewModel.errorMessage
    : ''

  if (!errorMessage || viewModel.phase === 'loadError') return null

  const alert = createElement(
    'p',
    'lichtwald-log-feedback lichtwald-log-feedback--error',
    errorMessage
  )
  alert.setAttribute('role', 'alert')
  alert.setAttribute('aria-live', 'assertive')
  return alert
}

function createFeaturedFeedback(viewModel, focusReferences) {
  const featuredState = viewModel?.featuredState
  const isSubmitting = featuredState?.isSubmitting === true
  const errorMessage = typeof featuredState?.errorMessage === 'string'
    ? featuredState.errorMessage
    : ''

  if (!isSubmitting && !errorMessage) return null

  const region = createElement(
    'section',
    'lichtwald-log-featured-state'
  )
  region.setAttribute('aria-busy', String(isSubmitting))

  if (isSubmitting) {
    const isClearing = featuredState.targetEntryId === null
    const status = createElement(
      'p',
      'lichtwald-log-featured-state__busy',
      isClearing
        ? 'Der Lichtwald-Fokus wird lokal entfernt.'
        : 'Der Lichtwald-Fokus wird lokal gespeichert.'
    )
    status.setAttribute('role', 'status')
    status.setAttribute('aria-live', 'polite')
    region.append(status)
  }

  if (errorMessage) {
    const alert = createElement(
      'p',
      'lichtwald-log-feedback lichtwald-log-feedback--error',
      errorMessage
    )
    alert.setAttribute('role', 'alert')
    alert.setAttribute('aria-live', 'assertive')
    makeProgrammaticallyFocusable(alert)
    focusReferences.featuredAlert = alert
    region.append(alert)
  }

  return region
}

function createLoadingState() {
  const state = createElement(
    'section',
    'lichtwald-log-state lichtwald-log-state--loading'
  )
  state.setAttribute('role', 'status')
  state.setAttribute('aria-live', 'polite')
  state.setAttribute('aria-busy', 'true')
  const indicator = createElement(
    'span',
    'lichtwald-log-loading-indicator'
  )
  indicator.setAttribute('aria-hidden', 'true')
  const text = createElement('div')
  text.append(
    createElement('h2', '', 'LichtwaldLog wird geladen'),
    createElement(
      'p',
      '',
      'Die privaten Einträge werden aus dem aktuellen Browserprofil gelesen.'
    )
  )
  state.append(indicator, text)
  return state
}

function createLoadErrorState(viewModel, eventContext) {
  const state = createElement(
    'section',
    'lichtwald-log-state lichtwald-log-state--error'
  )
  state.setAttribute('role', 'alert')
  state.setAttribute('aria-live', 'assertive')
  makeProgrammaticallyFocusable(state)
  const icon = createElement('span', 'lichtwald-log-state__icon', '!')
  icon.setAttribute('aria-hidden', 'true')
  state.append(
    icon,
    createElement('h2', '', 'LichtwaldLog konnte nicht geladen werden'),
    createElement(
      'p',
      '',
      typeof viewModel?.errorMessage === 'string'
        ? viewModel.errorMessage
        : ''
    ),
    createButton(
      'Erneut laden',
      'button button--secondary',
      () => eventContext.call('onRetryLoad')
    )
  )
  return state
}

function createTagList(tags, className) {
  const region = createElement('div', className)

  if (tags.length === 0) {
    region.append(
      createElement(
        'p',
        'lichtwald-log-tags__empty',
        'Keine Tags'
      )
    )
    return region
  }

  const list = createElement('ul', 'lichtwald-log-tags__list')
  list.setAttribute('aria-label', 'Tags')

  tags.forEach((tag) => {
    list.append(
      createElement('li', 'lichtwald-log-tags__tag', tag)
    )
  })
  region.append(list)
  return region
}

function createFeaturedBadge() {
  const badge = createElement(
    'p',
    'lichtwald-log-featured-badge',
    'Lichtwald-Fokus'
  )
  badge.append(
    createElement(
      'span',
      'lichtwald-log-featured-badge__mark',
      'Ausgewählt'
    )
  )
  return badge
}

function createFeaturedButton(
  entry,
  featuredEntryId,
  eventContext,
  disabled
) {
  const isFeatured = entry.id === featuredEntryId

  return createButton(
    isFeatured
      ? 'Lichtwald-Fokus entfernen'
      : 'Als Lichtwald-Fokus setzen',
    'button button--secondary',
    () =>
      eventContext.call(
        'onSetFeaturedEntry',
        [isFeatured ? null : entry.id]
      ),
    { disabled }
  )
}

function createDeleteConfirmation(
  entryId,
  entryIndex,
  deleteState,
  eventContext,
  focusReferences,
  isBusy
) {
  const confirmation = createElement(
    'fieldset',
    'lichtwald-log-confirmation'
  )
  confirmation.setAttribute('aria-busy', String(isBusy))
  const confirmationId =
    'lichtwald-log-delete-confirmation-' + String(entryIndex)
  setElementId(confirmation, confirmationId)
  confirmation.append(
    createElement('legend', '', 'Eintrag dauerhaft löschen?'),
    createElement(
      'p',
      '',
      'Diese lokale Löschung kann in LichtwaldLog nicht rückgängig gemacht werden.'
    )
  )

  const errorMessage = typeof deleteState?.errorMessage === 'string'
    ? deleteState.errorMessage
    : ''

  if (errorMessage) {
    const alert = createElement(
      'p',
      'lichtwald-log-confirmation__alert',
      errorMessage
    )
    alert.setAttribute('role', 'alert')
    alert.setAttribute('aria-live', 'assertive')
    makeProgrammaticallyFocusable(alert)
    focusReferences.deleteAlerts.set(entryId, alert)
    confirmation.append(alert)
  }

  const actions = createElement(
    'div',
    'lichtwald-log-confirmation__actions'
  )
  const cancelButton = createButton(
    'Nicht löschen',
    'button button--secondary',
    () => eventContext.call('onCancelDeleteEntry'),
    { disabled: isBusy }
  )
  const confirmButton = createButton(
    isBusy ? 'Wird dauerhaft gelöscht …' : 'Dauerhaft löschen',
    'button lichtwald-log-confirmation__confirm',
    () =>
      eventContext.call('onConfirmDeleteEntry', [entryId]),
    { disabled: isBusy }
  )
  focusReferences.deleteConfirmations.set(entryId, cancelButton)
  actions.append(cancelButton, confirmButton)
  confirmation.append(actions)
  return confirmation
}

function createEntryCard(
  entry,
  entryIndex,
  viewModel,
  eventContext,
  focusReferences,
  interactionBlocked,
  deleteBusy
) {
  const isFeatured = entry.id === viewModel.featuredEntryId
  const card = createElement(
    'article',
    isFeatured
      ? 'lichtwald-log-entry-card lichtwald-log-entry-card--featured'
      : 'lichtwald-log-entry-card'
  )
  const headingId =
    'lichtwald-log-entry-heading-' + String(entryIndex)
  card.setAttribute('aria-labelledby', headingId)
  const header = createElement(
    'div',
    'lichtwald-log-entry-card__header'
  )
  const heading = createElement(
    'h3',
    'lichtwald-log-entry-card__title',
    entry.title
  )
  setElementId(heading, headingId)
  makeProgrammaticallyFocusable(heading)
  focusReferences.entryHeadings.set(entry.id, heading)
  header.append(heading)

  if (isFeatured) {
    header.append(createFeaturedBadge())
  }

  const date = createElement(
    'p',
    'lichtwald-log-entry-card__date'
  )
  date.append(
    createElement('strong', '', 'Kalenderdatum: '),
    document.createTextNode(entry.calendarDate)
  )
  const actions = createElement(
    'div',
    'lichtwald-log-entry-card__actions'
  )
  actions.append(
    createButton(
      'Eintrag öffnen',
      'button button--primary',
      () => eventContext.call('onSelectEntry', [entry.id]),
      { disabled: interactionBlocked }
    ),
    createFeaturedButton(
      entry,
      viewModel.featuredEntryId,
      eventContext,
      interactionBlocked
    )
  )
  card.append(
    header,
    date,
    createTagList(
      getTags(entry),
      'lichtwald-log-tags lichtwald-log-entry-card__tags'
    ),
    actions
  )

  if (viewModel.deleteState?.entryId === entry.id) {
    card.append(
      createDeleteConfirmation(
        entry.id,
        entryIndex,
        viewModel.deleteState,
        eventContext,
        focusReferences,
        deleteBusy
      )
    )
  }

  return card
}

function createEmptyState() {
  const state = createElement(
    'section',
    'lichtwald-log-state lichtwald-log-state--empty'
  )
  const icon = createElement('span', 'lichtwald-log-state__icon', '+')
  icon.setAttribute('aria-hidden', 'true')
  state.append(
    icon,
    createElement('h3', '', 'Noch keine LichtwaldLog-Einträge'),
    createElement(
      'p',
      '',
      'Erstelle deinen ersten privaten Journaleintrag im aktuellen Browserprofil.'
    )
  )
  return state
}

function createOverview(
  viewModel,
  entries,
  eventContext,
  focusReferences,
  interactionBlocked,
  deleteBusy
) {
  const overview = createElement(
    'section',
    'lichtwald-log-overview'
  )
  overview.setAttribute(
    'aria-labelledby',
    'lichtwald-log-overview-heading'
  )
  overview.setAttribute(
    'aria-busy',
    String(viewModel.phase === 'mutating')
  )
  const header = createElement(
    'div',
    'lichtwald-log-section-heading'
  )
  const titleGroup = createElement('div')
  titleGroup.append(
    createElement('span', 'eyebrow', 'Übersicht')
  )
  const heading = createElement('h2', '', 'Journaleinträge')
  setElementId(heading, 'lichtwald-log-overview-heading')
  titleGroup.append(heading)
  const createTrigger = createButton(
    'Neuen Eintrag erstellen',
    'button button--primary',
    () => eventContext.call('onOpenCreateEntryForm'),
    { disabled: interactionBlocked }
  )
  focusReferences.createFormTrigger = createTrigger
  header.append(titleGroup, createTrigger)
  overview.append(header)

  if (entries.length === 0) {
    overview.append(createEmptyState())
    return overview
  }

  const grid = createElement('div', 'lichtwald-log-entry-grid')
  entries.forEach((entry, entryIndex) => {
    grid.append(
      createEntryCard(
        entry,
        entryIndex,
        viewModel,
        eventContext,
        focusReferences,
        interactionBlocked,
        deleteBusy
      )
    )
  })
  overview.append(grid)
  return overview
}

function createDetail(
  entry,
  entryIndex,
  viewModel,
  eventContext,
  focusReferences,
  interactionBlocked,
  deleteBusy
) {
  const detail = createElement('section', 'lichtwald-log-detail')
  detail.setAttribute(
    'aria-labelledby',
    'lichtwald-log-detail-heading-' + String(entryIndex)
  )
  detail.setAttribute(
    'aria-busy',
    String(viewModel.phase === 'mutating')
  )
  const backButton = createButton(
    '← Zur Übersicht',
    'button button--secondary lichtwald-log-detail__back',
    () => eventContext.call('onBackToOverview'),
    { disabled: interactionBlocked }
  )
  const header = createElement('div', 'lichtwald-log-detail__header')
  const titleGroup = createElement('div')
  titleGroup.append(
    createElement('span', 'eyebrow', 'Journaleintrag')
  )
  const heading = createElement(
    'h2',
    'lichtwald-log-detail__title',
    entry.title
  )
  setElementId(
    heading,
    'lichtwald-log-detail-heading-' + String(entryIndex)
  )
  makeProgrammaticallyFocusable(heading)
  focusReferences.entryHeadings.set(entry.id, heading)
  titleGroup.append(heading)

  const date = createElement('p', 'lichtwald-log-detail__date')
  date.append(
    createElement('strong', '', 'Kalenderdatum: '),
    document.createTextNode(entry.calendarDate)
  )
  header.append(titleGroup, date)

  const text = createElement(
    'p',
    'lichtwald-log-detail__text',
    entry.text
  )
  const featuredStatus = createElement(
    'p',
    'lichtwald-log-detail__featured-status',
    entry.id === viewModel.featuredEntryId
      ? 'Lichtwald-Fokus: ausgewählt'
      : 'Lichtwald-Fokus: nicht ausgewählt'
  )
  const actions = createElement(
    'div',
    'lichtwald-log-detail__actions'
  )
  const updateTrigger = createButton(
    'Eintrag bearbeiten',
    'button button--primary',
    () =>
      eventContext.call('onOpenUpdateEntryForm', [entry.id]),
    { disabled: interactionBlocked }
  )
  focusReferences.updateFormTriggers.set(entry.id, updateTrigger)
  const deleteTrigger = createButton(
    'Eintrag dauerhaft löschen',
    'button button--secondary lichtwald-log-detail__delete',
    () =>
      eventContext.call('onRequestDeleteEntry', [entry.id]),
    { disabled: interactionBlocked }
  )
  actions.append(
    updateTrigger,
    deleteTrigger,
    createFeaturedButton(
      entry,
      viewModel.featuredEntryId,
      eventContext,
      interactionBlocked
    )
  )
  detail.append(
    backButton,
    header,
    text,
    createTagList(
      getTags(entry),
      'lichtwald-log-tags lichtwald-log-detail__tags'
    ),
    featuredStatus,
    actions
  )

  if (viewModel.deleteState?.entryId === entry.id) {
    detail.append(
      createDeleteConfirmation(
        entry.id,
        entryIndex,
        viewModel.deleteState,
        eventContext,
        focusReferences,
        deleteBusy
      )
    )
  }

  return detail
}

function configureTextControl(control, fieldConfig) {
  control.name = fieldConfig.name
  control.autocomplete = 'off'
  control.setAttribute('name', fieldConfig.name)
  control.setAttribute('autocomplete', 'off')
  control.required = true
  control.setAttribute('required', '')

  if (fieldConfig.elementName === 'input') {
    control.type = 'text'
    control.setAttribute('type', 'text')
  }

  if (fieldConfig.name === 'calendarDate') {
    control.placeholder = 'YYYY-MM-DD'
    control.inputMode = 'numeric'
    control.setAttribute('placeholder', 'YYYY-MM-DD')
    control.setAttribute('inputmode', 'numeric')
  }

  if (Number.isInteger(fieldConfig.maxLength)) {
    control.maxLength = fieldConfig.maxLength
    control.setAttribute(
      'maxlength',
      String(fieldConfig.maxLength)
    )
  }

  if (Number.isInteger(fieldConfig.rows)) {
    control.rows = fieldConfig.rows
    control.setAttribute('rows', String(fieldConfig.rows))
  }
}

function readCaretMetadata(control, fieldName, tagIndex = null) {
  let selectionStart = null
  let selectionEnd = null

  try {
    if (
      Number.isSafeInteger(control.selectionStart) &&
      control.selectionStart >= 0
    ) {
      selectionStart = control.selectionStart
    }

    if (
      Number.isSafeInteger(control.selectionEnd) &&
      control.selectionEnd >= 0
    ) {
      selectionEnd = control.selectionEnd
    }
  } catch {
    selectionStart = null
    selectionEnd = null
  }

  return {
    fieldName,
    tagIndex: Number.isSafeInteger(tagIndex) && tagIndex >= 0
      ? tagIndex
      : null,
    selectionStart,
    selectionEnd,
  }
}

function createScalarField(
  form,
  fieldConfig,
  eventContext,
  focusReferences,
  isBusy
) {
  const field = createElement('div', 'lichtwald-log-form__field')
  const controlId = 'lichtwald-log-form-' + fieldConfig.name
  const hintId = controlId + '-hint'
  const errorId = controlId + '-error'
  const label = createElement(
    'label',
    'lichtwald-log-form__label',
    fieldConfig.label
  )
  label.setAttribute('for', controlId)
  label.append(
    createElement(
      'span',
      'lichtwald-log-form__requirement',
      'Pflichtfeld'
    )
  )
  const control = createElement(
    fieldConfig.elementName,
    'form-control lichtwald-log-form__control'
  )
  setElementId(control, controlId)
  configureTextControl(control, fieldConfig)
  control.value = typeof form.values?.[fieldConfig.name] === 'string'
    ? form.values[fieldConfig.name]
    : ''
  control.disabled = isBusy
  const hint = createElement(
    'small',
    'lichtwald-log-form__hint',
    fieldConfig.hint
  )
  setElementId(hint, hintId)
  const fieldError = getFieldError(
    form.fieldErrors,
    fieldConfig.name
  )
  const describedBy = [hintId]

  if (fieldError) {
    control.setAttribute('aria-invalid', 'true')
    describedBy.push(errorId)
  }

  control.setAttribute('aria-describedby', describedBy.join(' '))
  control.addEventListener('input', () => {
    if (control.disabled || !eventContext.isCurrent()) return

    eventContext.call(
      'onUpdateFormField',
      [fieldConfig.name, control.value],
      readCaretMetadata(control, fieldConfig.name)
    )
  })
  focusReferences.formFields.set(fieldConfig.name, control)
  field.append(label, control, hint)

  if (fieldError) {
    const error = createElement(
      'span',
      'lichtwald-log-form__field-error',
      fieldError
    )
    setElementId(error, errorId)
    field.append(error)
  }

  return { element: field, control }
}

function readTagControlValues(tagControls) {
  return tagControls.map((control) => control.value)
}

function createTagFieldset(
  form,
  eventContext,
  focusReferences,
  isBusy
) {
  const tags = getFormTags(form)
  const fieldset = createElement(
    'fieldset',
    'lichtwald-log-tags-editor'
  )
  setElementId(fieldset, 'lichtwald-log-form-tags')
  makeProgrammaticallyFocusable(fieldset)
  fieldset.disabled = isBusy
  fieldset.setAttribute('aria-busy', String(isBusy))
  const hintId = 'lichtwald-log-form-tags-hint'
  const errorId = 'lichtwald-log-form-tags-error'
  const fieldError = getFieldError(form.fieldErrors, 'tags')
  const describedBy = [hintId]

  if (fieldError) {
    fieldset.setAttribute('aria-invalid', 'true')
    describedBy.push(errorId)
  }

  fieldset.setAttribute('aria-describedby', describedBy.join(' '))
  fieldset.append(
    createElement('legend', '', 'Tags'),
    createElement(
      'small',
      'lichtwald-log-form__hint',
      'Bis zu ' +
        String(LICHTWALD_LOG_MAX_TAG_COUNT) +
        ' einzelne Tags mit jeweils höchstens ' +
        String(LICHTWALD_LOG_TAG_MAX_LENGTH) +
        ' Zeichen. Kommas bleiben Bestandteil eines Tags.'
    )
  )
  setElementId(fieldset.children[1], hintId)

  if (fieldError) {
    const error = createElement(
      'p',
      'lichtwald-log-form__field-error',
      fieldError
    )
    setElementId(error, errorId)
    fieldset.append(error)
  }

  const tagList = createElement(
    'div',
    'lichtwald-log-tags-editor__list'
  )
  const tagControls = []

  tags.forEach((tagValue, tagIndex) => {
    const row = createElement(
      'div',
      'lichtwald-log-tags-editor__row'
    )
    const inputId =
      'lichtwald-log-form-tag-' + String(tagIndex)
    const label = createElement(
      'label',
      'lichtwald-log-form__label',
      'Tag ' + String(tagIndex + 1)
    )
    label.setAttribute('for', inputId)
    const input = createElement(
      'input',
      'form-control lichtwald-log-tags-editor__input'
    )
    setElementId(input, inputId)
    input.type = 'text'
    input.setAttribute('type', 'text')
    input.name = 'tag-' + String(tagIndex)
    input.setAttribute('name', input.name)
    input.value = typeof tagValue === 'string' ? tagValue : ''
    input.maxLength = LICHTWALD_LOG_TAG_MAX_LENGTH
    input.setAttribute(
      'maxlength',
      String(LICHTWALD_LOG_TAG_MAX_LENGTH)
    )
    input.autocomplete = 'off'
    input.setAttribute('autocomplete', 'off')
    input.required = true
    input.setAttribute('required', '')
    input.disabled = isBusy
    input.setAttribute('aria-describedby', describedBy.join(' '))
    if (fieldError) input.setAttribute('aria-invalid', 'true')
    tagControls.push(input)
    input.addEventListener('input', () => {
      if (input.disabled || !eventContext.isCurrent()) return

      eventContext.call(
        'onUpdateFormField',
        ['tags', readTagControlValues(tagControls)],
        readCaretMetadata(input, 'tags', tagIndex)
      )
    })
    const removeButton = createButton(
      'Tag ' + String(tagIndex + 1) + ' entfernen',
      'button button--secondary lichtwald-log-tags-editor__remove',
      () => {
        if (!eventContext.isCurrent()) return

        const nextTags = readTagControlValues(tagControls).filter(
          (_tag, currentIndex) => currentIndex !== tagIndex
        )
        const nextTagIndex = nextTags.length === 0
          ? null
          : Math.min(tagIndex, nextTags.length - 1)
        eventContext.call(
          'onUpdateFormField',
          ['tags', nextTags],
          {
            fieldName: 'tags',
            tagIndex: nextTagIndex,
            selectionStart: nextTagIndex === null ? null : 0,
            selectionEnd: nextTagIndex === null ? null : 0,
          }
        )
      },
      { disabled: isBusy }
    )
    row.append(label, input, removeButton)
    tagList.append(row)
  })

  if (tags.length === 0) {
    tagList.append(
      createElement(
        'p',
        'lichtwald-log-tags-editor__empty',
        'Noch keine Tagfelder hinzugefügt.'
      )
    )
  }

  const addButton = createButton(
    'Tag hinzufügen',
    'button button--secondary lichtwald-log-tags-editor__add',
    () => {
      if (!eventContext.isCurrent()) return

      const nextTags = [
        ...readTagControlValues(tagControls),
        '',
      ]
      const nextTagIndex = nextTags.length - 1
      eventContext.call(
        'onUpdateFormField',
        ['tags', nextTags],
        {
          fieldName: 'tags',
          tagIndex: nextTagIndex,
          selectionStart: 0,
          selectionEnd: 0,
        }
      )
    },
    {
      disabled:
        isBusy || tags.length >= LICHTWALD_LOG_MAX_TAG_COUNT,
    }
  )
  fieldset.append(tagList, addButton)
  focusReferences.formFields.set('tags', fieldset)
  focusReferences.tagInputs = tagControls
  return { element: fieldset, controls: tagControls }
}

function createFormAlert(form, focusReferences) {
  const formError = typeof form.errorMessage === 'string'
    ? form.errorMessage
    : ''
  const fieldError = getFieldError(form.fieldErrors, 'form')
  const messages = []

  if (formError) messages.push(formError)
  if (fieldError && fieldError !== formError) messages.push(fieldError)
  if (messages.length === 0) return null

  const alert = createElement(
    'div',
    'lichtwald-log-form__alert'
  )
  alert.setAttribute('role', 'alert')
  alert.setAttribute('aria-live', 'assertive')
  makeProgrammaticallyFocusable(alert)
  messages.forEach((message) => {
    alert.append(createElement('p', '', message))
  })
  focusReferences.formAlert = alert
  return alert
}

function createEntryForm(
  viewModel,
  eventContext,
  focusReferences
) {
  const formState = viewModel.form
  const config = FORM_CONFIGS[formState.type]
  const isBusy =
    viewModel.phase === 'mutating' ||
    formState.isSubmitting === true
  const section = createElement(
    'section',
    'lichtwald-log-form-section'
  )
  section.setAttribute(
    'aria-labelledby',
    'lichtwald-log-form-heading'
  )
  section.setAttribute('aria-busy', String(isBusy))
  const form = createElement('form', 'lichtwald-log-form')
  form.noValidate = true
  form.setAttribute('novalidate', '')
  form.autocomplete = 'off'
  form.setAttribute('autocomplete', 'off')
  form.setAttribute(
    'aria-labelledby',
    'lichtwald-log-form-heading'
  )
  form.setAttribute('aria-busy', String(isBusy))
  const header = createElement('div', 'lichtwald-log-form__header')
  const heading = createElement('h2', '', config.heading)
  setElementId(heading, 'lichtwald-log-form-heading')
  header.append(
    heading,
    createElement('p', '', config.description)
  )
  form.append(header)

  const formAlert = createFormAlert(formState, focusReferences)
  if (formAlert) form.append(formAlert)

  const fields = createElement('div', 'lichtwald-log-form__fields')
  const scalarControls = new Map()
  SCALAR_FIELD_CONFIGS.forEach((fieldConfig) => {
    const field = createScalarField(
      formState,
      fieldConfig,
      eventContext,
      focusReferences,
      isBusy
    )
    scalarControls.set(fieldConfig.name, field.control)
    fields.append(field.element)
  })
  const tagsField = createTagFieldset(
    formState,
    eventContext,
    focusReferences,
    isBusy
  )
  fields.append(tagsField.element)
  form.append(fields)

  form.append(
    createElement(
      'p',
      'lichtwald-log-form__dirty-state',
      formState.isDirty === true
        ? 'Ungespeicherte Änderungen.'
        : 'Keine ungespeicherten Änderungen.'
    )
  )
  const actions = createElement(
    'div',
    'lichtwald-log-form__actions'
  )
  const cancelButton = createButton(
    'Abbrechen',
    'button button--secondary',
    () => eventContext.call('onCancelForm'),
    { disabled: isBusy }
  )
  const submitButton = createElement(
    'button',
    'button button--primary',
    isBusy ? 'Wird gespeichert …' : config.submitLabel
  )
  submitButton.type = 'submit'
  submitButton.setAttribute('type', 'submit')
  submitButton.disabled = isBusy
  actions.append(cancelButton, submitButton)
  form.append(actions)

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    if (
      isBusy ||
      submitButton.disabled ||
      !eventContext.isCurrent()
    ) {
      return
    }

    const payload = {
      type: formState.type,
      calendarDate: scalarControls.get('calendarDate').value,
      title: scalarControls.get('title').value,
      text: scalarControls.get('text').value,
      tags: readTagControlValues(tagsField.controls),
    }

    if (formState.type === FORM_TYPES.UPDATE) {
      eventContext.call('onSubmitForm', [{
        type: payload.type,
        entryId: formState.entryId,
        calendarDate: payload.calendarDate,
        title: payload.title,
        text: payload.text,
        tags: [...payload.tags],
      }])
      return
    }

    eventContext.call('onSubmitForm', [{
      type: payload.type,
      calendarDate: payload.calendarDate,
      title: payload.title,
      text: payload.text,
      tags: [...payload.tags],
    }])
  })
  section.append(form)
  return section
}

function readFocusTargetProperty(focusTarget, propertyName) {
  const property = readOwnDataProperty(focusTarget, propertyName)
  return property.found ? property.value : undefined
}

function resolveFocusTarget(
  focusTarget,
  focusReferences,
  caretMetadata
) {
  const type = readFocusTargetProperty(focusTarget, 'type')

  switch (type) {
    case 'heading':
      return focusReferences.heading
    case 'entry': {
      const entryId = readFocusTargetProperty(
        focusTarget,
        'entryId'
      )
      return typeof entryId === 'string'
        ? focusReferences.entryHeadings.get(entryId) ?? null
        : null
    }
    case 'formField': {
      const fieldName = readFocusTargetProperty(
        focusTarget,
        'fieldName'
      )

      if (
        fieldName === 'tags' &&
        caretMetadata?.fieldName === 'tags' &&
        Number.isSafeInteger(caretMetadata.tagIndex) &&
        caretMetadata.tagIndex >= 0
      ) {
        return (
          focusReferences.tagInputs[caretMetadata.tagIndex] ??
          focusReferences.formFields.get('tags') ??
          null
        )
      }

      return typeof fieldName === 'string'
        ? focusReferences.formFields.get(fieldName) ?? null
        : null
    }
    case 'formAlert':
      return focusReferences.formAlert
    case 'formTrigger': {
      const entryId = readFocusTargetProperty(
        focusTarget,
        'entryId'
      )
      return typeof entryId === 'string'
        ? focusReferences.updateFormTriggers.get(entryId) ?? null
        : focusReferences.createFormTrigger
    }
    case 'deleteConfirmation': {
      const entryId = readFocusTargetProperty(
        focusTarget,
        'entryId'
      )
      return typeof entryId === 'string'
        ? focusReferences.deleteConfirmations.get(entryId) ?? null
        : null
    }
    case 'deleteAlert': {
      const entryId = readFocusTargetProperty(
        focusTarget,
        'entryId'
      )
      return typeof entryId === 'string'
        ? focusReferences.deleteAlerts.get(entryId) ?? null
        : null
    }
    case 'featuredAlert':
      return focusReferences.featuredAlert
    case 'status':
      return focusReferences.status
    default:
      return null
  }
}

function focusSafely(element) {
  if (!element) return false

  try {
    const focus = element.focus
    if (typeof focus !== 'function') return false
    Reflect.apply(focus, element, [{ preventScroll: true }])
    return true
  } catch {
    return false
  }
}

function restoreCaretSafely(element, caretMetadata) {
  if (
    !element ||
    !caretMetadata ||
    !Number.isSafeInteger(caretMetadata.selectionStart) ||
    !Number.isSafeInteger(caretMetadata.selectionEnd) ||
    caretMetadata.selectionStart < 0 ||
    caretMetadata.selectionEnd < 0
  ) {
    return
  }

  try {
    const setSelectionRange = element.setSelectionRange
    if (typeof setSelectionRange !== 'function') return
    Reflect.apply(
      setSelectionRange,
      element,
      [
        caretMetadata.selectionStart,
        caretMetadata.selectionEnd,
      ]
    )
  } catch {
    return
  }
}

function isCaretTarget(
  element,
  focusTarget,
  focusReferences,
  caretMetadata
) {
  if (
    !caretMetadata ||
    readFocusTargetProperty(focusTarget, 'type') !== 'formField' ||
    readFocusTargetProperty(focusTarget, 'fieldName') !==
      caretMetadata.fieldName
  ) {
    return false
  }

  if (caretMetadata.fieldName === 'tags') {
    return (
      Number.isSafeInteger(caretMetadata.tagIndex) &&
      focusReferences.tagInputs[caretMetadata.tagIndex] === element
    )
  }

  return focusReferences.formFields.get(
    caretMetadata.fieldName
  ) === element
}

export function createLichtwaldLogView(rootElement) {
  const rootPort = createRootPort(rootElement)
  let renderSequence = 0
  let activeRenderToken = 0
  let pendingCaretMetadata = null

  function render(viewModel, actions = {}) {
    const caretMetadata = pendingCaretMetadata
    pendingCaretMetadata = null
    const renderToken = ++renderSequence
    activeRenderToken = renderToken
    const actionPort = createActionPort(actions)
    const eventContext = {
      isCurrent() {
        return activeRenderToken === renderToken
      },
      call(actionName, args = [], nextCaretMetadata = null) {
        if (activeRenderToken !== renderToken) return false

        const action = actionPort[actionName]
        if (typeof action !== 'function') return false

        const tokenAtCall = activeRenderToken
        pendingCaretMetadata = nextCaretMetadata

        try {
          Reflect.apply(action, undefined, args)
        } finally {
          if (activeRenderToken === tokenAtCall) {
            pendingCaretMetadata = null
          }
        }

        return true
      },
    }
    const entries = getEntries(viewModel)
    const isLoading = viewModel?.phase === 'loading'
    const isPhaseMutating = viewModel?.phase === 'mutating'
    const isFormSubmitting =
      viewModel?.form?.isSubmitting === true
    const isDeleteSubmitting =
      viewModel?.deleteState?.isSubmitting === true
    const isFeaturedSubmitting =
      viewModel?.featuredState?.isSubmitting === true
    const isRootBusy =
      isLoading ||
      isPhaseMutating ||
      isFormSubmitting ||
      isDeleteSubmitting ||
      isFeaturedSubmitting
    const hasDeleteTarget =
      typeof viewModel?.deleteState?.entryId === 'string'
    const interactionBlocked =
      isPhaseMutating ||
      hasDeleteTarget ||
      isFeaturedSubmitting
    const deleteBusy =
      isPhaseMutating || isDeleteSubmitting
    const fragment = document.createDocumentFragment()
    const focusReferences = createFocusReferences()
    const region = createElement('section', 'lichtwald-log')
    region.setAttribute('aria-labelledby', 'lichtwald-log-heading')
    region.setAttribute('aria-busy', String(isRootBusy))
    const header = createHeader(
      entries.length,
      isRootBusy,
      focusReferences
    )
    region.append(header.header, header.introduction)

    const status = createStatusFeedback(
      viewModel,
      focusReferences
    )
    if (status) region.append(status)

    const globalError = createGlobalErrorFeedback(viewModel)
    if (globalError) region.append(globalError)

    if (viewModel?.phase === 'loading') {
      region.append(createLoadingState())
    } else if (viewModel?.phase === 'loadError') {
      region.append(createLoadErrorState(viewModel, eventContext))
    } else {
      const featuredFeedback = createFeaturedFeedback(
        viewModel,
        focusReferences
      )
      if (featuredFeedback) region.append(featuredFeedback)

      const hasKnownForm = Boolean(
        viewModel?.form &&
        Object.hasOwn(FORM_CONFIGS, viewModel.form.type)
      )

      if (hasKnownForm) {
        region.append(
          createEntryForm(
            viewModel,
            eventContext,
            focusReferences
          )
        )
      } else {
        const selectedEntryIndex = entries.findIndex(
          (entry) => entry.id === viewModel?.selectedEntryId
        )

        if (selectedEntryIndex >= 0) {
          region.append(
            createDetail(
              entries[selectedEntryIndex],
              selectedEntryIndex,
              viewModel,
              eventContext,
              focusReferences,
              interactionBlocked,
              deleteBusy
            )
          )
        } else {
          region.append(
            createOverview(
              viewModel,
              entries,
              eventContext,
              focusReferences,
              interactionBlocked,
              deleteBusy
            )
          )
        }
      }
    }

    region.append(createPrivacyNotice())
    fragment.append(region)
    callRootMethod(
      rootElement,
      rootPort.replaceChildren,
      [fragment]
    )
    callRootMethod(
      rootElement,
      rootPort.setAttribute,
      ['aria-busy', String(isRootBusy)]
    )

    const focusTarget = viewModel?.focusTarget
    if (focusTarget !== null && typeof focusTarget !== 'undefined') {
      const resolvedTarget = resolveFocusTarget(
        focusTarget,
        focusReferences,
        caretMetadata
      )
      const focusTargetElement =
        resolvedTarget ?? focusReferences.heading
      const didFocus = focusSafely(focusTargetElement)

      if (
        didFocus &&
        isCaretTarget(
          focusTargetElement,
          focusTarget,
          focusReferences,
          caretMetadata
        )
      ) {
        restoreCaretSafely(focusTargetElement, caretMetadata)
      } else if (
        !didFocus &&
        focusTargetElement !== focusReferences.heading
      ) {
        focusSafely(focusReferences.heading)
      }
    }
  }

  function unmount() {
    activeRenderToken = ++renderSequence
    pendingCaretMetadata = null
    callRootMethod(
      rootElement,
      rootPort.replaceChildren,
      []
    )
    callRootMethod(
      rootElement,
      rootPort.removeAttribute,
      ['aria-busy']
    )
  }

  return Object.freeze({ render, unmount })
}
