const TITLE_MAX_LENGTH = 120
const CONTENT_MAX_LENGTH = 10000

const FORM_CONFIGS = Object.freeze({
  createModule: Object.freeze({
    heading: 'Neues Lernmodul erstellen',
    hint: 'Das erste Kapitel wird gemeinsam mit dem Lernmodul gespeichert.',
    submitLabel: 'Lernmodul erstellen',
    fields: Object.freeze([
      Object.freeze({
        name: 'title',
        label: 'Modultitel',
        element: 'input',
        maxLength: TITLE_MAX_LENGTH,
      }),
      Object.freeze({
        name: 'firstChapterTitle',
        label: 'Titel des ersten Kapitels',
        element: 'input',
        maxLength: TITLE_MAX_LENGTH,
      }),
    ]),
  }),
  renameModule: Object.freeze({
    heading: 'Lernmodul umbenennen',
    hint: 'Die Kapitel und LearningNodes bleiben unverändert.',
    submitLabel: 'Modultitel speichern',
    fields: Object.freeze([
      Object.freeze({
        name: 'title',
        label: 'Modultitel',
        element: 'input',
        maxLength: TITLE_MAX_LENGTH,
      }),
    ]),
  }),
  addChapter: Object.freeze({
    heading: 'Neues Kapitel erstellen',
    hint: 'Ein neues Kapitel darf zunächst noch keine LearningNodes enthalten.',
    submitLabel: 'Kapitel erstellen',
    fields: Object.freeze([
      Object.freeze({
        name: 'title',
        label: 'Kapiteltitel',
        element: 'input',
        maxLength: TITLE_MAX_LENGTH,
      }),
    ]),
  }),
  renameChapter: Object.freeze({
    heading: 'Kapitel umbenennen',
    hint: 'Vorhandene LearningNodes bleiben unverändert.',
    submitLabel: 'Kapiteltitel speichern',
    fields: Object.freeze([
      Object.freeze({
        name: 'title',
        label: 'Kapiteltitel',
        element: 'input',
        maxLength: TITLE_MAX_LENGTH,
      }),
    ]),
  }),
  addLearningNode: Object.freeze({
    heading: 'Neuen LearningNode erstellen',
    hint: 'Speichere eine eigene Textkarte in diesem Kapitel.',
    submitLabel: 'LearningNode erstellen',
    fields: Object.freeze([
      Object.freeze({
        name: 'title',
        label: 'Titel',
        element: 'input',
        maxLength: TITLE_MAX_LENGTH,
      }),
      Object.freeze({
        name: 'content',
        label: 'Inhalt',
        element: 'textarea',
        maxLength: CONTENT_MAX_LENGTH,
        rows: 10,
      }),
    ]),
  }),
  updateLearningNode: Object.freeze({
    heading: 'LearningNode bearbeiten',
    hint: 'Die bestehende Textkarte wird mit dem neuen Inhalt gespeichert.',
    submitLabel: 'LearningNode speichern',
    fields: Object.freeze([
      Object.freeze({
        name: 'title',
        label: 'Titel',
        element: 'input',
        maxLength: TITLE_MAX_LENGTH,
      }),
      Object.freeze({
        name: 'content',
        label: 'Inhalt',
        element: 'textarea',
        maxLength: CONTENT_MAX_LENGTH,
        rows: 10,
      }),
    ]),
  }),
})

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

function createButton(
  label,
  className,
  onClick,
  { disabled = false } = {}
) {
  const button = createElement('button', className, label)
  button.type = 'button'
  button.disabled = disabled

  if (typeof onClick === 'function') {
    button.addEventListener('click', onClick)
  }

  return button
}

function sortByPosition(entries) {
  return [...entries].sort(
    (firstEntry, secondEntry) =>
      firstEntry.position - secondEntry.position ||
      firstEntry.id.localeCompare(secondEntry.id)
  )
}

function formatCount(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`
}

function getChapterCountLabel(count) {
  return formatCount(count, 'Kapitel', 'Kapitel')
}

function getLearningNodeCountLabel(count) {
  return formatCount(count, 'LearningNode', 'LearningNodes')
}

function getContentPreview(content) {
  if (content.length <= 220) return content
  return `${content.slice(0, 219)}…`
}

function focusElement(element) {
  if (typeof element?.focus === 'function') {
    element.focus({ preventScroll: true })
  }
}

function createFocusReferences() {
  return {
    heading: null,
    overviewHeading: null,
    moduleHeading: null,
    status: null,
    formAlert: null,
    formFields: new Map(),
    formTriggers: new Map(),
    chapterToggles: new Map(),
    learningNodeHeadings: new Map(),
  }
}

function createReferenceKey(...values) {
  return JSON.stringify(values)
}

function getFormTriggerKey({
  formType,
  moduleId = null,
  chapterId = null,
  learningNodeId = null,
}) {
  return createReferenceKey(
    formType,
    moduleId,
    chapterId,
    learningNodeId
  )
}

function registerFormTrigger(focusReferences, target, button) {
  focusReferences.formTriggers.set(getFormTriggerKey(target), button)
}

function createHeader(moduleCount, isMutating, focusReferences) {
  const header = createElement('header', 'topbar learning-hub-header')
  const titleGroup = createElement('div')
  const eyebrow = createElement('span', 'eyebrow', 'Lokale Lerninhalte')
  const title = createElement('h1', '', 'LearningHub')
  title.tabIndex = -1
  focusReferences.heading = title
  titleGroup.append(eyebrow, title)

  const state = createElement(
    'span',
    'system-state',
    isMutating ? 'Wird lokal gespeichert' : 'Lokaler Modus'
  )
  const stateMarker = createElement('span')
  stateMarker.setAttribute('aria-hidden', 'true')
  state.prepend?.(stateMarker)
  header.append(titleGroup, state)

  const introduction = createElement(
    'section',
    'learning-hub-introduction'
  )
  introduction.setAttribute('aria-labelledby', 'learning-hub-intro-title')
  const introText = createElement('div')
  const introTitle = createElement(
    'h2',
    'learning-hub-introduction__title',
    'Eigene Lernmodule und Textkarten'
  )
  introTitle.id = 'learning-hub-intro-title'
  introText.append(
    introTitle,
    createElement(
      'p',
      '',
      'Verwalte Lernmodule, Kapitel und LearningNodes lokal. Fortschritt und Tests folgen in getrennten Arbeitsschritten.'
    )
  )
  const count = createElement('p', 'learning-hub-count')
  count.append(
    createElement('strong', '', String(moduleCount)),
    document.createTextNode(moduleCount === 1 ? ' Lernmodul' : ' Lernmodule')
  )
  introduction.append(introText, count)

  return { header, introduction }
}

function createPrivacyNotice() {
  const notice = createElement('aside', 'learning-hub-privacy')
  notice.setAttribute('aria-labelledby', 'learning-hub-privacy-title')
  const title = createElement(
    'h2',
    'learning-hub-privacy__title',
    'Lokale Speicherung'
  )
  title.id = 'learning-hub-privacy-title'
  const text = createElement(
    'p',
    '',
    'Deine Inhalte bleiben im aktuellen Browserprofil. Eine Cloud-Sicherung oder geräteübergreifende Synchronisierung gibt es noch nicht. Andere Skripte derselben Origin (Website-Adresse) könnten grundsätzlich auf das unverschlüsselte localStorage zugreifen.'
  )
  notice.append(title, text)
  return notice
}

function createFeedback(viewState, focusReferences) {
  if (viewState.statusMessage) {
    const status = createElement(
      'p',
      'learning-hub-feedback learning-hub-feedback--success',
      viewState.statusMessage
    )
    status.setAttribute('role', 'status')
    status.setAttribute('aria-live', 'polite')
    status.tabIndex = -1
    focusReferences.status = status
    return status
  }

  if (viewState.errorMessage && viewState.phase !== 'loadError') {
    const alert = createElement(
      'p',
      'learning-hub-feedback learning-hub-feedback--error',
      viewState.errorMessage
    )
    alert.setAttribute('role', 'alert')
    return alert
  }

  return null
}

function createLoadingState() {
  const panel = createElement(
    'section',
    'learning-hub-state learning-hub-state--loading'
  )
  panel.setAttribute('role', 'status')
  panel.setAttribute('aria-live', 'polite')
  panel.setAttribute('aria-busy', 'true')
  const indicator = createElement('span', 'learning-hub-loading-indicator')
  indicator.setAttribute('aria-hidden', 'true')
  const text = createElement('div')
  text.append(
    createElement('h2', '', 'LearningHub wird geladen'),
    createElement(
      'p',
      '',
      'Die privaten Inhalte werden aus dem lokalen Browserprofil gelesen.'
    )
  )
  panel.append(indicator, text)
  return panel
}

function createLoadErrorState(viewState, actions) {
  const panel = createElement(
    'section',
    'learning-hub-state learning-hub-state--error'
  )
  panel.setAttribute('role', 'alert')
  const icon = createElement('span', 'learning-hub-state__icon', '!')
  icon.setAttribute('aria-hidden', 'true')
  panel.append(
    icon,
    createElement('h2', '', 'LearningHub konnte nicht geladen werden'),
    createElement('p', '', viewState.errorMessage),
    createButton(
      'Erneut laden',
      'button button--secondary',
      () => actions.onRetryLoad?.()
    )
  )
  return panel
}

function createField(
  form,
  fieldConfig,
  actions,
  focusReferences,
  formIndex
) {
  const field = createElement('div', 'learning-hub-form__field')
  const inputId = `learning-hub-form-${formIndex}-${fieldConfig.name}`
  const hintId = `${inputId}-hint`
  const errorId = `${inputId}-error`
  const label = createElement('label', 'learning-hub-form__label')
  label.setAttribute('for', inputId)
  label.append(
    document.createTextNode(fieldConfig.label),
    createElement('span', 'learning-hub-form__requirement', 'Pflichtfeld')
  )

  const control = createElement(
    fieldConfig.element,
    'form-control learning-hub-form__control'
  )
  control.id = inputId
  control.name = fieldConfig.name
  control.required = true
  control.maxLength = fieldConfig.maxLength
  control.disabled = form.isSubmitting
  control.autocomplete = 'off'
  control.value = form.values[fieldConfig.name] ?? ''
  control.setAttribute('required', '')
  control.setAttribute('maxlength', String(fieldConfig.maxLength))
  control.setAttribute('autocomplete', 'off')

  if (fieldConfig.element === 'input') {
    control.type = 'text'
  } else if (fieldConfig.rows) {
    control.rows = fieldConfig.rows
  }

  const hintText =
    fieldConfig.name === 'content'
      ? 'Maximal 10.000 Zeichen. Leerraum an Anfang und Ende wird beim Speichern entfernt.'
      : 'Maximal 120 Zeichen. Leerraum an Anfang und Ende wird beim Speichern entfernt.'
  const hint = createElement(
    'small',
    'learning-hub-form__hint',
    hintText
  )
  hint.id = hintId
  const fieldError = form.fieldErrors[fieldConfig.name]
  const describedBy = [hintId]

  if (fieldError) {
    control.setAttribute('aria-invalid', 'true')
    describedBy.push(errorId)
  }

  control.setAttribute('aria-describedby', describedBy.join(' '))
  control.addEventListener('input', () => {
    actions.onUpdateFormField?.(fieldConfig.name, control.value)
  })
  focusReferences.formFields.set(fieldConfig.name, control)
  field.append(label, control, hint)

  if (fieldError) {
    const error = createElement(
      'span',
      'learning-hub-form__field-error',
      fieldError
    )
    error.id = errorId
    field.append(error)
  }

  return { element: field, control }
}

function createForm(viewState, actions, focusReferences, formIndex) {
  const formState = viewState.form
  const config = FORM_CONFIGS[formState?.type]
  if (!formState || !config) return null

  const form = createElement('form', 'learning-hub-form')
  form.noValidate = true
  form.setAttribute('autocomplete', 'off')
  form.setAttribute('aria-busy', String(formState.isSubmitting))
  const header = createElement('div', 'learning-hub-form__header')
  const headingLevel = [
    'renameChapter',
    'addLearningNode',
    'updateLearningNode',
  ].includes(formState.type)
    ? 'h4'
    : 'h3'
  const heading = createElement(headingLevel, '', config.heading)
  const hint = createElement('p', '', config.hint)
  header.append(heading, hint)
  const fields = createElement('div', 'learning-hub-form__fields')
  const controls = new Map()

  config.fields.forEach((fieldConfig) => {
    const field = createField(
      formState,
      fieldConfig,
      actions,
      focusReferences,
      formIndex
    )
    controls.set(fieldConfig.name, field.control)
    fields.append(field.element)
  })

  form.append(header, fields)

  if (formState.errorMessage) {
    const alert = createElement(
      'p',
      'learning-hub-form__error',
      formState.errorMessage
    )
    alert.setAttribute('role', 'alert')
    alert.tabIndex = -1
    focusReferences.formAlert = alert
    form.append(alert)
  }

  const actionsElement = createElement('div', 'learning-hub-form__actions')
  const cancelButton = createButton(
    'Abbrechen',
    'button button--secondary',
    () => actions.onCancelForm?.(),
    { disabled: formState.isSubmitting }
  )
  const submitButton = createElement(
    'button',
    'button button--primary',
    formState.isSubmitting ? 'Wird gespeichert …' : config.submitLabel
  )
  submitButton.type = 'submit'
  submitButton.disabled = formState.isSubmitting
  actionsElement.append(cancelButton, submitButton)
  form.append(actionsElement)

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    if (formState.isSubmitting) return

    const submission = {
      type: formState.type,
    }

    for (const targetName of [
      'moduleId',
      'chapterId',
      'learningNodeId',
    ]) {
      if (formState[targetName] !== null) {
        submission[targetName] = formState[targetName]
      }
    }

    config.fields.forEach((fieldConfig) => {
      submission[fieldConfig.name] = controls.get(fieldConfig.name).value
    })
    actions.onSubmitForm?.(submission)
  })

  return form
}

function createEmptyOverview() {
  const panel = createElement(
    'section',
    'learning-hub-state learning-hub-state--empty'
  )
  const icon = createElement('span', 'learning-hub-state__icon', '+')
  icon.setAttribute('aria-hidden', 'true')
  panel.append(
    icon,
    createElement('h3', '', 'Noch keine Lernmodule'),
    createElement(
      'p',
      '',
      'Erstelle dein erstes Lernmodul gemeinsam mit einem Startkapitel.'
    )
  )
  return panel
}

function createModuleCard(
  learningModule,
  moduleIndex,
  actions,
  isMutating
) {
  const card = createElement('article', 'learning-hub-module-card')
  const titleId = `learning-hub-module-title-${moduleIndex}`
  const title = createElement('h3', '', learningModule.title)
  title.id = titleId
  const chapterCount = createElement(
    'p',
    'learning-hub-module-card__count',
    getChapterCountLabel(learningModule.chapters.length)
  )
  const openButton = createButton(
    'Modul öffnen',
    'button button--secondary',
    () => actions.onSelectModule?.(learningModule.id),
    { disabled: isMutating }
  )
  openButton.setAttribute('aria-describedby', titleId)
  card.append(title, chapterCount, openButton)
  return card
}

function createOverview(
  viewState,
  actions,
  focusReferences,
  isMutating
) {
  const section = createElement('section', 'learning-hub-overview')
  section.setAttribute('aria-labelledby', 'learning-hub-overview-title')
  const header = createElement('div', 'learning-hub-section-heading')
  const titleGroup = createElement('div')
  const eyebrow = createElement('span', 'eyebrow', 'Übersicht')
  const title = createElement('h2', '', 'Lernmodule')
  title.id = 'learning-hub-overview-title'
  title.tabIndex = -1
  focusReferences.overviewHeading = title
  titleGroup.append(eyebrow, title)
  const createTrigger = createButton(
    'Neues Lernmodul erstellen',
    'button button--primary',
    () => actions.onOpenCreateModuleForm?.(),
    {
      disabled:
        isMutating || viewState.form?.type === 'createModule',
    }
  )
  registerFormTrigger(
    focusReferences,
    { formType: 'createModule' },
    createTrigger
  )
  header.append(titleGroup, createTrigger)
  section.append(header)

  if (viewState.form?.type === 'createModule') {
    section.append(createForm(viewState, actions, focusReferences, 0))
  }

  const modules = sortByPosition(viewState.hub.modules)
  if (modules.length === 0) {
    section.append(createEmptyOverview())
    return section
  }

  const list = createElement('div', 'learning-hub-module-grid')
  modules.forEach((learningModule, moduleIndex) => {
    list.append(
      createModuleCard(
        learningModule,
        moduleIndex,
        actions,
        isMutating
      )
    )
  })
  section.append(list)
  return section
}

function createLearningNodeCard(
  learningModule,
  chapter,
  learningNode,
  nodeIndex,
  viewState,
  actions,
  focusReferences,
  isMutating
) {
  const isSelected =
    viewState.selectedLearningNodeId === learningNode.id
  const card = createElement(
    'article',
    `learning-hub-node-card${
      isSelected ? ' learning-hub-node-card--selected' : ''
    }`
  )
  const titleId = `learning-hub-node-title-${chapter.position}-${nodeIndex}`
  const header = createElement('div', 'learning-hub-node-card__header')
  const title = createElement('h4', '', learningNode.title)
  title.id = titleId
  header.append(title)

  if (isSelected) {
    card.setAttribute('aria-current', 'true')
    header.append(
      createElement(
        'span',
        'learning-hub-node-card__selection',
        'Ausgewählt'
      )
    )
  }

  const preview = createElement(
    'p',
    'learning-hub-node-card__preview',
    getContentPreview(learningNode.content)
  )
  const cardActions = createElement('div', 'learning-hub-node-card__actions')
  const selectButton = createButton(
    isSelected ? 'LearningNode erneut anzeigen' : 'LearningNode auswählen',
    'button button--secondary',
    () =>
      actions.onSelectLearningNode?.(
        learningModule.id,
        chapter.id,
        learningNode.id
      ),
    { disabled: isMutating }
  )
  selectButton.setAttribute('aria-describedby', titleId)
  const editButton = createButton(
    'LearningNode bearbeiten',
    'button button--secondary',
    () =>
      actions.onOpenUpdateLearningNodeForm?.(
        learningModule.id,
        chapter.id,
        learningNode.id
      ),
    { disabled: isMutating }
  )
  editButton.setAttribute('aria-describedby', titleId)
  registerFormTrigger(
    focusReferences,
    {
      formType: 'updateLearningNode',
      moduleId: learningModule.id,
      chapterId: chapter.id,
      learningNodeId: learningNode.id,
    },
    editButton
  )
  cardActions.append(selectButton, editButton)
  card.append(header, preview, cardActions)
  return card
}

function createSelectedLearningNode(
  learningModule,
  chapter,
  learningNode,
  focusReferences
) {
  const detail = createElement('section', 'learning-hub-node-detail')
  detail.setAttribute('aria-labelledby', 'learning-hub-selected-node-title')
  const eyebrow = createElement('span', 'eyebrow', 'Ausgewählte Textkarte')
  const title = createElement('h4', '', learningNode.title)
  title.id = 'learning-hub-selected-node-title'
  title.tabIndex = -1
  focusReferences.learningNodeHeadings.set(
    createReferenceKey(
      learningModule.id,
      chapter.id,
      learningNode.id
    ),
    title
  )
  const content = createElement(
    'p',
    'learning-hub-node-detail__content',
    learningNode.content
  )
  detail.append(eyebrow, title, content)
  return detail
}

function createChapter(
  learningModule,
  chapter,
  chapterIndex,
  viewState,
  actions,
  focusReferences,
  isMutating
) {
  const isExpanded = viewState.expandedChapterIds.includes(chapter.id)
  const article = createElement('article', 'learning-hub-chapter')
  const toggleId = `learning-hub-chapter-toggle-${chapterIndex}`
  const titleId = `learning-hub-chapter-title-${chapterIndex}`
  const panelId = `learning-hub-chapter-panel-${chapterIndex}`
  const header = createElement('div', 'learning-hub-chapter__header')
  const heading = createElement('h3', 'learning-hub-chapter__heading')
  const toggle = createButton(
    '',
    'learning-hub-chapter__toggle',
    () => actions.onToggleChapter?.(learningModule.id, chapter.id),
    { disabled: isMutating }
  )
  toggle.id = toggleId
  toggle.setAttribute('aria-expanded', String(isExpanded))
  toggle.setAttribute('aria-controls', panelId)
  const chapterTitle = createElement(
    'span',
    'learning-hub-chapter__title',
    chapter.title
  )
  chapterTitle.id = titleId
  toggle.append(
    chapterTitle,
    createElement(
      'span',
      'learning-hub-chapter__count',
      getLearningNodeCountLabel(chapter.learningNodes.length)
    ),
    createElement(
      'span',
      'learning-hub-chapter__indicator',
      isExpanded ? 'Einklappen' : 'Ausklappen'
    )
  )
  focusReferences.chapterToggles.set(
    createReferenceKey(learningModule.id, chapter.id),
    toggle
  )
  heading.append(toggle)
  const renameButton = createButton(
    'Kapitel umbenennen',
    'button button--secondary',
    () =>
      actions.onOpenRenameChapterForm?.(
        learningModule.id,
        chapter.id
    ),
    { disabled: isMutating }
  )
  renameButton.setAttribute('aria-describedby', titleId)
  registerFormTrigger(
    focusReferences,
    {
      formType: 'renameChapter',
      moduleId: learningModule.id,
      chapterId: chapter.id,
    },
    renameButton
  )
  header.append(heading, renameButton)
  article.append(header)

  if (
    viewState.form?.type === 'renameChapter' &&
    viewState.form.chapterId === chapter.id
  ) {
    article.append(
      createForm(
        viewState,
        actions,
        focusReferences,
        `chapter-${chapterIndex}`
      )
    )
  }

  const panel = createElement('div', 'learning-hub-chapter__panel')
  panel.id = panelId
  panel.hidden = !isExpanded
  panel.setAttribute('aria-labelledby', toggleId)

  if (chapter.learningNodes.length === 0) {
    const empty = createElement('div', 'learning-hub-chapter__empty')
    empty.append(
      createElement('h4', '', 'Noch keine LearningNodes'),
      createElement(
        'p',
        '',
        'Erstelle die erste eigene Textkarte für dieses Kapitel.'
      )
    )
    panel.append(empty)
  } else {
    const nodeList = createElement('div', 'learning-hub-node-grid')
    const learningNodes = sortByPosition(chapter.learningNodes)
    learningNodes.forEach((learningNode, nodeIndex) => {
      nodeList.append(
        createLearningNodeCard(
          learningModule,
          chapter,
          learningNode,
          nodeIndex,
          viewState,
          actions,
          focusReferences,
          isMutating
        )
      )
    })
    panel.append(nodeList)

    const selectedLearningNode = learningNodes.find(
      (learningNode) =>
        learningNode.id === viewState.selectedLearningNodeId
    )
    if (selectedLearningNode) {
      panel.append(
        createSelectedLearningNode(
          learningModule,
          chapter,
          selectedLearningNode,
          focusReferences
        )
      )
    }
  }

  const addNodeButton = createButton(
    chapter.learningNodes.length === 0
      ? 'Ersten LearningNode erstellen'
      : 'LearningNode erstellen',
    'button button--primary learning-hub-chapter__add-node',
    () =>
      actions.onOpenAddLearningNodeForm?.(
        learningModule.id,
        chapter.id
    ),
    { disabled: isMutating }
  )
  addNodeButton.setAttribute('aria-describedby', titleId)
  registerFormTrigger(
    focusReferences,
    {
      formType: 'addLearningNode',
      moduleId: learningModule.id,
      chapterId: chapter.id,
    },
    addNodeButton
  )
  panel.append(addNodeButton)

  if (
    ['addLearningNode', 'updateLearningNode'].includes(
      viewState.form?.type
    ) &&
    viewState.form.chapterId === chapter.id
  ) {
    panel.append(
      createForm(
        viewState,
        actions,
        focusReferences,
        `node-${chapterIndex}`
      )
    )
  }

  article.append(panel)
  return article
}

function createModuleDetail(
  learningModule,
  viewState,
  actions,
  focusReferences,
  isMutating
) {
  const section = createElement('section', 'learning-hub-detail')
  section.setAttribute('aria-labelledby', 'learning-hub-module-heading')
  const backButton = createButton(
    '← Zur Modulübersicht',
    'button button--secondary learning-hub-detail__back',
    () => actions.onBackToOverview?.(),
    { disabled: isMutating }
  )
  const header = createElement('div', 'learning-hub-detail__header')
  const titleGroup = createElement('div')
  const eyebrow = createElement('span', 'eyebrow', 'Lernmodul')
  const title = createElement('h2', '', learningModule.title)
  title.id = 'learning-hub-module-heading'
  title.tabIndex = -1
  focusReferences.moduleHeading = title
  titleGroup.append(eyebrow, title)
  const actionsElement = createElement(
    'div',
    'learning-hub-detail__actions'
  )
  const renameButton = createButton(
    'Lernmodul umbenennen',
    'button button--secondary',
    () => actions.onOpenRenameModuleForm?.(learningModule.id),
    { disabled: isMutating }
  )
  const addChapterButton = createButton(
    'Kapitel erstellen',
    'button button--primary',
    () => actions.onOpenAddChapterForm?.(learningModule.id),
    { disabled: isMutating }
  )
  registerFormTrigger(
    focusReferences,
    {
      formType: 'renameModule',
      moduleId: learningModule.id,
    },
    renameButton
  )
  registerFormTrigger(
    focusReferences,
    {
      formType: 'addChapter',
      moduleId: learningModule.id,
    },
    addChapterButton
  )
  actionsElement.append(renameButton, addChapterButton)
  header.append(titleGroup, actionsElement)
  const progressNotice = createElement(
    'p',
    'learning-hub-detail__progress-notice',
    'Kapitelabschluss und Modulfortschritt werden in einem nächsten LearningHub-Schritt ergänzt.'
  )
  section.append(backButton, header, progressNotice)

  if (
    ['renameModule', 'addChapter'].includes(viewState.form?.type)
  ) {
    section.append(createForm(viewState, actions, focusReferences, 'module'))
  }

  const chaptersSection = createElement(
    'section',
    'learning-hub-chapters'
  )
  chaptersSection.setAttribute('aria-labelledby', 'learning-hub-chapters-title')
  const chaptersTitle = createElement('h2', '', 'Kapitel')
  chaptersTitle.id = 'learning-hub-chapters-title'
  chaptersSection.append(chaptersTitle)
  const chapters = sortByPosition(learningModule.chapters)
  const chapterList = createElement('div', 'learning-hub-chapter-list')
  chapters.forEach((chapter, chapterIndex) => {
    chapterList.append(
      createChapter(
        learningModule,
        chapter,
        chapterIndex,
        viewState,
        actions,
        focusReferences,
        isMutating
      )
    )
  })
  chaptersSection.append(chapterList)
  section.append(chaptersSection)
  return section
}

function resolveFocusTarget(focusTarget, focusReferences) {
  if (!focusTarget) return null

  switch (focusTarget.type) {
    case 'heading':
      return focusReferences.heading
    case 'overviewHeading':
      return focusReferences.overviewHeading
    case 'moduleHeading':
      return focusReferences.moduleHeading
    case 'status':
      return focusReferences.status
    case 'formAlert':
      return focusReferences.formAlert
    case 'formField':
      return focusReferences.formFields.get(focusTarget.fieldName)
    case 'formTrigger':
      return focusReferences.formTriggers.get(
        getFormTriggerKey(focusTarget)
      )
    case 'chapterToggle':
      return focusReferences.chapterToggles.get(
        createReferenceKey(focusTarget.moduleId, focusTarget.chapterId)
      )
    case 'learningNodeHeading':
      return focusReferences.learningNodeHeadings.get(
        createReferenceKey(
          focusTarget.moduleId,
          focusTarget.chapterId,
          focusTarget.learningNodeId
        )
      )
    default:
      return null
  }
}

export function createLearningHubView(rootElement) {
  if (typeof rootElement?.replaceChildren !== 'function') {
    throw new TypeError(
      'Für LearningHub wird ein gültiges Root-Element benötigt.'
    )
  }

  function render(viewState, actions = {}) {
    const fragment = document.createDocumentFragment()
    const focusReferences = createFocusReferences()
    const modules = Array.isArray(viewState.hub?.modules)
      ? viewState.hub.modules
      : []
    const isMutating = viewState.phase === 'mutating'
    const header = createHeader(
      modules.length,
      isMutating,
      focusReferences
    )
    fragment.append(header.header, header.introduction)

    const feedback = createFeedback(viewState, focusReferences)
    if (feedback) fragment.append(feedback)

    if (viewState.phase === 'loading') {
      fragment.append(createLoadingState())
    } else if (viewState.phase === 'loadError') {
      fragment.append(createLoadErrorState(viewState, actions))
    } else {
      const selectedModule = modules.find(
        (learningModule) =>
          learningModule.id === viewState.selectedModuleId
      )

      if (selectedModule) {
        fragment.append(
          createModuleDetail(
            selectedModule,
            viewState,
            actions,
            focusReferences,
            isMutating
          )
        )
      } else {
        fragment.append(
          createOverview(
            viewState,
            actions,
            focusReferences,
            isMutating
          )
        )
      }
    }

    fragment.append(createPrivacyNotice())
    rootElement.setAttribute(
      'aria-busy',
      String(viewState.phase === 'loading' || isMutating)
    )
    rootElement.replaceChildren(fragment)
    focusElement(
      resolveFocusTarget(viewState.focusTarget, focusReferences) ??
        (viewState.focusTarget ? focusReferences.heading : null)
    )
  }

  function unmount() {
    rootElement.removeAttribute('aria-busy')
  }

  return Object.freeze({ render, unmount })
}
