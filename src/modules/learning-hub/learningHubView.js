const TITLE_MAX_LENGTH = 120
const CONTENT_MAX_LENGTH = 10000

const ARTIFACT_CONFIGS = Object.freeze({
  note: Object.freeze({
    label: 'Notiz',
    contentLabel: 'Notizinhalt',
    emptyText: 'Noch keine Notiz gespeichert.',
  }),
  summary: Object.freeze({
    label: 'Zusammenfassung',
    contentLabel: 'Zusammenfassungsinhalt',
    emptyText: 'Noch keine Zusammenfassung gespeichert.',
  }),
})

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

function isModuleProgressValid(learningModule, moduleProgress) {
  if (
    !moduleProgress ||
    moduleProgress.moduleId !== learningModule.id ||
    !Number.isInteger(moduleProgress.completedChapterCount) ||
    !Number.isInteger(moduleProgress.totalChapterCount) ||
    moduleProgress.completedChapterCount < 0 ||
    moduleProgress.totalChapterCount !== learningModule.chapters.length ||
    moduleProgress.completedChapterCount > moduleProgress.totalChapterCount ||
    !Number.isInteger(moduleProgress.progressPercent) ||
    moduleProgress.progressPercent < 0 ||
    moduleProgress.progressPercent > 100 ||
    typeof moduleProgress.isCompleted !== 'boolean' ||
    !Array.isArray(moduleProgress.chapters) ||
    moduleProgress.chapters.length !== learningModule.chapters.length
  ) {
    return false
  }

  const chapterProgressById = new Map()

  for (const chapterProgress of moduleProgress.chapters) {
    if (
      !chapterProgress ||
      typeof chapterProgress.chapterId !== 'string' ||
      typeof chapterProgress.isCompleted !== 'boolean' ||
      chapterProgressById.has(chapterProgress.chapterId)
    ) {
      return false
    }

    chapterProgressById.set(chapterProgress.chapterId, chapterProgress)
  }

  const completedChapterCount = learningModule.chapters.reduce(
    (count, chapter) => {
      const chapterProgress = chapterProgressById.get(chapter.id)
      return chapterProgress?.isCompleted ? count + 1 : count
    },
    0
  )
  const totalChapterCount = learningModule.chapters.length
  const expectedProgressPercent = totalChapterCount === 0
    ? 0
    : Math.round((completedChapterCount / totalChapterCount) * 100)
  const expectedIsCompleted =
    totalChapterCount > 0 && completedChapterCount === totalChapterCount

  return (
    learningModule.chapters.every((chapter) =>
      chapterProgressById.has(chapter.id)
    ) &&
    moduleProgress.totalChapterCount === totalChapterCount &&
    completedChapterCount === moduleProgress.completedChapterCount &&
    moduleProgress.progressPercent === expectedProgressPercent &&
    moduleProgress.isCompleted === expectedIsCompleted
  )
}

function getModuleProgress(viewState, learningModule) {
  if (
    !['ready', 'mutating'].includes(viewState.progress?.phase) ||
    !Array.isArray(viewState.progress?.projection)
  ) {
    return null
  }

  const matchingProgress = viewState.progress.projection.filter(
    (moduleProgress) => moduleProgress?.moduleId === learningModule.id
  )

  if (
    matchingProgress.length !== 1 ||
    !isModuleProgressValid(learningModule, matchingProgress[0])
  ) {
    return null
  }

  return matchingProgress[0]
}

function getChapterProgress(moduleProgress, chapterId) {
  return moduleProgress?.chapters.find(
    (chapterProgress) => chapterProgress.chapterId === chapterId
  ) ?? null
}

function getUnavailableProgressText(progressPhase) {
  switch (progressPhase) {
    case 'loading':
      return 'Fortschritt wird geladen.'
    case 'stale':
      return 'Fortschritt ist derzeit veraltet.'
    case 'mutating':
      return 'Fortschritt wird aktualisiert.'
    default:
      return 'Fortschritt ist derzeit nicht verfügbar.'
  }
}

function getProgressCountText(moduleProgress) {
  return `${moduleProgress.completedChapterCount} von ${moduleProgress.totalChapterCount} Kapiteln abgeschlossen · ${moduleProgress.progressPercent} %`
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
    chapterCompletions: new Map(),
    learningNodeHeadings: new Map(),
    artifactHeading: null,
    artifactFields: new Map(),
    artifactTriggers: new Map(),
    artifactClearTriggers: new Map(),
    artifactConfirmations: new Map(),
    artifactAlerts: new Map(),
    artifactLoadAlert: null,
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
      'Verwalte Lernmodule, Kapitel, LearningNodes, Kapitel-/Modulfortschritt sowie Notizen und Zusammenfassungen lokal. Der deterministische lokale Mock-Test folgt als nächster Ausbauschritt.'
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
    'Deine Inhalte und dein Fortschritt sowie deine Notizen und Zusammenfassungen bleiben ausschließlich im aktuellen Browserprofil. Eine Cloud-Sicherung oder geräteübergreifende Synchronisierung gibt es nicht. Das localStorage ist unverschlüsselt und für andere Skripte derselben Origin (Website-Adresse) grundsätzlich lesbar.'
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

function createProgressFeedback(
  viewState,
  actions,
  isInteractionBlocked
) {
  const progressPhase = viewState.progress?.phase

  if (progressPhase === 'loading') {
    const status = createElement(
      'p',
      'learning-hub-progress-feedback learning-hub-progress-feedback--loading',
      'Fortschritt wird aus dem lokalen Browserprofil geladen.'
    )
    status.setAttribute('role', 'status')
    status.setAttribute('aria-live', 'polite')
    status.setAttribute('aria-busy', 'true')
    return status
  }

  if (progressPhase === 'ready' && viewState.progress?.errorMessage) {
    const alert = createElement(
      'p',
      'learning-hub-progress-feedback learning-hub-progress-feedback--error',
      viewState.progress.errorMessage
    )
    alert.setAttribute('role', 'alert')
    return alert
  }

  if (!['unavailable', 'stale'].includes(progressPhase)) {
    return null
  }

  const feedback = createElement(
    'section',
    'learning-hub-progress-feedback learning-hub-progress-feedback--error'
  )
  feedback.setAttribute('role', 'alert')
  const heading = createElement(
    'h2',
    'learning-hub-progress-feedback__title',
    progressPhase === 'stale'
      ? 'Fortschritt ist nicht aktuell'
      : 'Fortschritt ist nicht verfügbar'
  )
  const message = createElement(
    'p',
    '',
    viewState.progress.errorMessage ||
      (progressPhase === 'stale'
        ? 'Die Inhaltsänderung wurde gespeichert, der Fortschritt konnte danach aber nicht neu geladen werden.'
        : 'Der lokale Fortschritt konnte nicht geladen werden. Deine Lerninhalte bleiben weiterhin bedienbar.')
  )
  const retryButton = createButton(
    'Fortschritt erneut laden',
    'button button--secondary',
    () => actions.onRetryProgressLoad?.(),
    { disabled: isInteractionBlocked }
  )
  feedback.append(heading, message, retryButton)
  return feedback
}

function createModuleProgressSummary(
  moduleProgress,
  progressPhase
) {
  const summary = createElement(
    'div',
    'learning-hub-module-progress learning-hub-module-card__progress'
  )
  summary.setAttribute(
    'aria-busy',
    String(['loading', 'mutating'].includes(progressPhase))
  )

  if (!moduleProgress) {
    summary.append(
      createElement(
        'p',
        'learning-hub-module-progress__unavailable',
        getUnavailableProgressText(progressPhase)
      )
    )
    return summary
  }

  summary.append(
    createElement(
      'p',
      'learning-hub-module-progress__count',
      getProgressCountText(moduleProgress)
    )
  )

  if (moduleProgress.isCompleted) {
    summary.append(
      createElement(
        'p',
        'learning-hub-module-progress__complete',
        'Modul abgeschlossen'
      )
    )
  }

  return summary
}

function createModuleProgressDetail(
  moduleProgress,
  progressPhase
) {
  const detail = createElement('div', 'learning-hub-detail__progress')
  detail.setAttribute(
    'aria-busy',
    String(['loading', 'mutating'].includes(progressPhase))
  )
  const progressLabel = createElement(
    'p',
    'learning-hub-detail__progress-label',
    'Modulfortschritt'
  )
  progressLabel.id = 'learning-hub-module-progress-label'
  detail.append(progressLabel)

  if (!moduleProgress) {
    detail.append(
      createElement(
        'p',
        'learning-hub-module-progress__unavailable',
        getUnavailableProgressText(progressPhase)
      )
    )
    return detail
  }

  const progressText = getProgressCountText(moduleProgress)
  const progressBar = createElement(
    'div',
    'learning-hub-progress-bar'
  )
  progressBar.setAttribute('role', 'progressbar')
  progressBar.setAttribute(
    'aria-labelledby',
    `${progressLabel.id} learning-hub-module-heading`
  )
  progressBar.setAttribute('aria-valuemin', '0')
  progressBar.setAttribute(
    'aria-valuemax',
    String(moduleProgress.totalChapterCount)
  )
  progressBar.setAttribute(
    'aria-valuenow',
    String(moduleProgress.completedChapterCount)
  )
  progressBar.setAttribute(
    'aria-valuetext',
    `${moduleProgress.completedChapterCount} von ${moduleProgress.totalChapterCount} Kapiteln abgeschlossen, ${moduleProgress.progressPercent} Prozent`
  )
  const progressBarValue = createElement(
    'span',
    'learning-hub-progress-bar__value'
  )
  progressBarValue.setAttribute('aria-hidden', 'true')
  progressBarValue.setAttribute(
    'style',
    `width: ${moduleProgress.progressPercent}%`
  )
  progressBar.append(progressBarValue)
  detail.append(
    createElement(
      'p',
      'learning-hub-module-progress__count',
      progressText
    ),
    progressBar
  )

  if (moduleProgress.isCompleted) {
    detail.append(
      createElement(
        'p',
        'learning-hub-module-progress__complete',
        'Modul abgeschlossen'
      )
    )
  }

  return detail
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
  formIndex,
  isInteractionBlocked
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
  control.disabled = form.isSubmitting || isInteractionBlocked
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
    if (isInteractionBlocked) return
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

function createForm(
  viewState,
  actions,
  focusReferences,
  formIndex,
  isInteractionBlocked
) {
  const formState = viewState.form
  const config = FORM_CONFIGS[formState?.type]
  if (!formState || !config) return null

  const form = createElement('form', 'learning-hub-form')
  form.noValidate = true
  form.setAttribute('autocomplete', 'off')
  form.setAttribute(
    'aria-busy',
    String(formState.isSubmitting || isInteractionBlocked)
  )
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
      formIndex,
      isInteractionBlocked
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
    { disabled: formState.isSubmitting || isInteractionBlocked }
  )
  const submitButton = createElement(
    'button',
    'button button--primary',
    formState.isSubmitting ? 'Wird gespeichert …' : config.submitLabel
  )
  submitButton.type = 'submit'
  submitButton.disabled = formState.isSubmitting || isInteractionBlocked
  actionsElement.append(cancelButton, submitButton)
  form.append(actionsElement)

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    if (formState.isSubmitting || isInteractionBlocked) return

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
  moduleProgress,
  progressPhase,
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
  const progressSummary = createModuleProgressSummary(
    moduleProgress,
    progressPhase
  )
  const openButton = createButton(
    'Modul öffnen',
    'button button--secondary',
    () => actions.onSelectModule?.(learningModule.id),
    { disabled: isMutating }
  )
  openButton.setAttribute('aria-describedby', titleId)
  card.append(title, chapterCount, progressSummary, openButton)
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
    section.append(
      createForm(
        viewState,
        actions,
        focusReferences,
        0,
        isMutating
      )
    )
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
        getModuleProgress(viewState, learningModule),
        viewState.progress?.phase,
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

function getArtifactType(value) {
  return Object.hasOwn(ARTIFACT_CONFIGS, value) ? value : null
}

function getArtifactState(viewState) {
  const artifacts = viewState.artifacts
  const phase = ['loading', 'ready', 'unavailable', 'mutating'].includes(
    artifacts?.phase
  )
    ? artifacts.phase
    : 'unavailable'
  const getPersistedValue = (type) => {
    const value = artifacts?.values?.[type]
    return typeof value === 'string' && value.length > 0 ? value : null
  }

  return {
    phase,
    values: {
      note: getPersistedValue('note'),
      summary: getPersistedValue('summary'),
    },
    activeType: getArtifactType(artifacts?.activeType),
    mode: ['view', 'editing', 'confirmClear'].includes(artifacts?.mode)
      ? artifacts.mode
      : 'view',
    draft: typeof artifacts?.draft === 'string' ? artifacts.draft : '',
    dirty: artifacts?.dirty === true,
    fieldError:
      typeof artifacts?.fieldError === 'string' ? artifacts.fieldError : '',
    errorMessage:
      typeof artifacts?.errorMessage === 'string'
        ? artifacts.errorMessage
        : '',
    statusMessage:
      typeof artifacts?.statusMessage === 'string'
        ? artifacts.statusMessage
        : '',
    feedbackType: getArtifactType(artifacts?.feedbackType),
    mutatingType: getArtifactType(artifacts?.mutatingType),
    interactionDisabled: artifacts?.interactionDisabled === true,
  }
}

function createArtifactEditor(
  type,
  config,
  artifactState,
  actions,
  focusReferences,
  isBlocked,
  titleId
) {
  const form = createElement('form', 'learning-hub-artifact-form')
  const controlId = `learning-hub-artifact-${type}-content`
  const hintId = `${controlId}-hint`
  const errorId = `${controlId}-error`
  const isMutating =
    artifactState.phase === 'mutating' &&
    artifactState.mutatingType === type
  const field = createElement('div', 'learning-hub-artifact-form__field')
  const label = createElement(
    'label',
    'learning-hub-artifact-form__label',
    config.contentLabel
  )
  label.setAttribute('for', controlId)
  label.append(
    createElement(
      'span',
      'learning-hub-artifact-form__requirement',
      'Pflichtfeld'
    )
  )
  const control = createElement(
    'textarea',
    'form-control learning-hub-artifact-form__control'
  )
  control.id = controlId
  control.name = `${type}Content`
  control.required = true
  control.maxLength = CONTENT_MAX_LENGTH
  control.rows = 8
  control.autocomplete = 'off'
  control.value = artifactState.draft
  control.disabled = isBlocked
  control.setAttribute('required', '')
  control.setAttribute('maxlength', String(CONTENT_MAX_LENGTH))
  control.setAttribute('autocomplete', 'off')
  const hint = createElement(
    'small',
    'learning-hub-artifact-form__hint',
    'Maximal 10.000 Zeichen. Reiner Leerraum kann nicht gespeichert werden.'
  )
  hint.id = hintId
  const describedBy = [hintId]

  if (artifactState.fieldError) {
    control.setAttribute('aria-invalid', 'true')
    describedBy.push(errorId)
  }

  control.setAttribute('aria-describedby', describedBy.join(' '))
  focusReferences.artifactFields.set(type, control)
  field.append(label, control, hint)

  if (artifactState.fieldError) {
    const fieldError = createElement(
      'span',
      'learning-hub-artifact-form__field-error',
      artifactState.fieldError
    )
    fieldError.id = errorId
    field.append(fieldError)
  }

  const formActions = createElement(
    'div',
    'learning-hub-artifact-form__actions'
  )
  const persistedContent = artifactState.values[type]
  if (typeof persistedContent === 'string') {
    const clearButton = createButton(
      `${config.label} leeren`,
      'button button--secondary',
      () => {
        if (isBlocked) return
        actions.onOpenArtifactClearConfirmation?.(type)
      },
      { disabled: isBlocked }
    )
    clearButton.setAttribute('aria-describedby', titleId)
    focusReferences.artifactClearTriggers.set(type, clearButton)
    formActions.append(clearButton)
  }
  const cancelButton = createButton(
    'Abbrechen',
    'button button--secondary',
    () => {
      if (isBlocked) return
      actions.onCancelArtifactEditor?.(type)
    },
    { disabled: isBlocked }
  )
  const submitButton = createElement(
    'button',
    'button button--primary',
    isMutating ? 'Wird gespeichert …' : `${config.label} speichern`
  )
  submitButton.type = 'submit'
  const draftStatus = createElement(
    'p',
    'learning-hub-artifact-form__draft-status',
    artifactState.dirty
      ? 'Ungespeicherte Änderungen.'
      : 'Keine ungespeicherten Änderungen.'
  )
  const updateDraftStatus = () => {
    const persistedValue =
      typeof persistedContent === 'string' ? persistedContent : ''
    draftStatus.textContent =
      control.value.trim() === persistedValue
        ? 'Keine ungespeicherten Änderungen.'
        : 'Ungespeicherte Änderungen.'
  }
  const updateSubmitAvailability = () => {
    submitButton.disabled =
      isBlocked ||
      control.value.trim().length === 0 ||
      control.value.length > CONTENT_MAX_LENGTH
  }
  updateSubmitAvailability()
  control.addEventListener('input', () => {
    updateSubmitAvailability()
    updateDraftStatus()
    if (isBlocked) return
    actions.onUpdateArtifactDraft?.(type, control.value)
  })
  formActions.append(cancelButton, submitButton)
  form.noValidate = true
  form.setAttribute('autocomplete', 'off')
  form.setAttribute('aria-labelledby', titleId)
  form.setAttribute('aria-busy', String(isMutating))
  form.append(field, draftStatus, formActions)
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    if (
      isBlocked ||
      control.value.trim().length === 0 ||
      control.value.length > CONTENT_MAX_LENGTH
    ) {
      return
    }
    actions.onSaveArtifact?.({ type, content: control.value })
  })
  return form
}

function createArtifactClearConfirmation(
  type,
  config,
  artifactState,
  actions,
  focusReferences,
  isBlocked
) {
  const confirmation = createElement(
    'fieldset',
    'learning-hub-artifact-confirmation'
  )
  const isMutating =
    artifactState.phase === 'mutating' &&
    artifactState.mutatingType === type
  confirmation.setAttribute('aria-busy', String(isMutating))
  const legend = createElement(
    'legend',
    '',
    `${config.label} wirklich leeren?`
  )
  const explanation = createElement(
    'p',
    '',
    'Nur dieses gespeicherte Lernartefakt wird geleert. Der LearningNode und das andere Lernartefakt bleiben unverändert.'
  )
  const confirmationActions = createElement(
    'div',
    'learning-hub-artifact-confirmation__actions'
  )
  const cancelButton = createButton(
    'Nicht leeren',
    'button button--secondary',
    () => {
      if (isBlocked) return
      actions.onCancelArtifactClearConfirmation?.(type)
    },
    { disabled: isBlocked }
  )
  const confirmButton = createButton(
    isMutating ? 'Wird geleert …' : `${config.label} leeren`,
    'button learning-hub-artifact-confirmation__confirm',
    () => {
      if (isBlocked) return
      actions.onConfirmArtifactClear?.(type)
    },
    { disabled: isBlocked }
  )
  focusReferences.artifactConfirmations.set(type, cancelButton)
  confirmationActions.append(cancelButton, confirmButton)
  confirmation.append(legend, explanation, confirmationActions)
  return confirmation
}

function createArtifactFeedback(
  type,
  artifactState,
  focusReferences
) {
  if (artifactState.feedbackType !== type) return null

  if (artifactState.errorMessage) {
    const alert = createElement(
      'p',
      'learning-hub-artifact-feedback learning-hub-artifact-feedback--error',
      artifactState.errorMessage
    )
    alert.setAttribute('role', 'alert')
    alert.tabIndex = -1
    focusReferences.artifactAlerts.set(type, alert)
    return alert
  }

  if (artifactState.statusMessage) {
    const status = createElement(
      'p',
      'learning-hub-artifact-feedback learning-hub-artifact-feedback--success',
      artifactState.statusMessage
    )
    status.setAttribute('role', 'status')
    status.setAttribute('aria-live', 'polite')
    return status
  }

  return null
}

function createArtifactCard(
  type,
  artifactState,
  actions,
  focusReferences
) {
  const config = ARTIFACT_CONFIGS[type]
  const persistedContent = artifactState.values[type]
  const hasContent = typeof persistedContent === 'string'
  const isActive = artifactState.activeType === type
  const isMutating =
    artifactState.phase === 'mutating' &&
    artifactState.mutatingType === type
  const hasOtherActiveMode =
    artifactState.activeType !== null &&
    artifactState.activeType !== type &&
    artifactState.mode !== 'view'
  const isBlocked =
    artifactState.interactionDisabled ||
    artifactState.phase === 'mutating' ||
    hasOtherActiveMode
  const titleId = `learning-hub-artifact-${type}-title`
  const card = createElement('article', 'learning-hub-artifact-card')
  card.setAttribute('aria-labelledby', titleId)
  card.setAttribute('aria-busy', String(isMutating))
  const header = createElement(
    'div',
    'learning-hub-artifact-card__header'
  )
  const title = createElement('h6', '', config.label)
  title.id = titleId
  const availabilityText = isMutating
    ? artifactState.mode === 'confirmClear'
      ? 'Wird geleert'
      : 'Wird gespeichert'
    : isActive && artifactState.mode === 'editing'
      ? 'Wird bearbeitet'
      : isActive && artifactState.mode === 'confirmClear'
        ? 'Leerung bestätigen'
        : hasContent
          ? 'Vorhanden'
          : 'Nicht vorhanden'
  const availability = createElement(
    'span',
    'learning-hub-artifact-card__availability',
    availabilityText
  )
  header.append(title, availability)
  card.append(header)

  if (isActive && artifactState.mode === 'editing') {
    card.append(
      createArtifactEditor(
        type,
        config,
        artifactState,
        actions,
        focusReferences,
        isBlocked,
        titleId
      )
    )
  } else {
    card.append(
      createElement(
        'p',
        hasContent
          ? 'learning-hub-artifact-card__content'
          : 'learning-hub-artifact-card__empty',
        hasContent ? persistedContent : config.emptyText
      )
    )

    if (isActive && artifactState.mode === 'confirmClear') {
      card.append(
        createArtifactClearConfirmation(
          type,
          config,
          artifactState,
          actions,
          focusReferences,
          isBlocked
        )
      )
    } else {
      const cardActions = createElement(
        'div',
        'learning-hub-artifact-card__actions'
      )
      const primaryButton = createButton(
        hasContent
          ? `${config.label} bearbeiten`
          : `${config.label} erstellen`,
        'button button--secondary',
        () => {
          if (isBlocked) return
          actions.onOpenArtifactEditor?.(type)
        },
        { disabled: isBlocked }
      )
      primaryButton.setAttribute('aria-describedby', titleId)
      focusReferences.artifactTriggers.set(type, primaryButton)
      cardActions.append(primaryButton)

      if (hasContent) {
        const clearButton = createButton(
          `${config.label} leeren`,
          'button button--secondary',
          () => {
            if (isBlocked) return
            actions.onOpenArtifactClearConfirmation?.(type)
          },
          { disabled: isBlocked }
        )
        clearButton.setAttribute('aria-describedby', titleId)
        focusReferences.artifactClearTriggers.set(type, clearButton)
        cardActions.append(clearButton)
      }

      card.append(cardActions)
    }
  }

  const feedback = createArtifactFeedback(
    type,
    artifactState,
    focusReferences
  )
  if (feedback) card.append(feedback)
  return card
}

function createLearningArtifacts(
  viewState,
  actions,
  focusReferences
) {
  const normalizedArtifactState = getArtifactState(viewState)
  const artifactState = {
    ...normalizedArtifactState,
    interactionDisabled:
      normalizedArtifactState.interactionDisabled ||
      viewState.phase === 'mutating' ||
      viewState.progress?.phase === 'mutating',
  }
  const section = createElement('section', 'learning-hub-artifacts')
  section.setAttribute('aria-labelledby', 'learning-hub-artifacts-title')
  section.setAttribute(
    'aria-busy',
    String(['loading', 'mutating'].includes(artifactState.phase))
  )
  const header = createElement('div', 'learning-hub-artifacts__header')
  const heading = createElement('h5', '', 'Lernartefakte')
  heading.id = 'learning-hub-artifacts-title'
  heading.tabIndex = -1
  focusReferences.artifactHeading = heading
  header.append(
    heading,
    createElement(
      'p',
      '',
      'Persönliche Notiz und Zusammenfassung zu dieser Textkarte.'
    )
  )
  section.append(header)

  if (artifactState.phase === 'loading') {
    const loading = createElement(
      'p',
      'learning-hub-artifacts__load-state',
      'Lernartefakte werden aus dem lokalen Browserprofil geladen.'
    )
    loading.setAttribute('role', 'status')
    loading.setAttribute('aria-live', 'polite')
    loading.setAttribute('aria-busy', 'true')
    section.append(loading)
    return section
  }

  if (artifactState.phase === 'unavailable') {
    const unavailable = createElement(
      'div',
      'learning-hub-artifacts__load-state learning-hub-artifacts__load-state--error'
    )
    unavailable.setAttribute('role', 'alert')
    unavailable.tabIndex = -1
    focusReferences.artifactLoadAlert = unavailable
    unavailable.append(
      createElement(
        'p',
        '',
        artifactState.errorMessage ||
          'Die lokalen Lernartefakte sind derzeit nicht verfügbar.'
      ),
      createButton(
        'Lernartefakte erneut laden',
        'button button--secondary',
        () => {
          if (artifactState.interactionDisabled) return
          actions.onRetryArtifactLoad?.()
        },
        { disabled: artifactState.interactionDisabled }
      )
    )
    section.append(unavailable)
    return section
  }

  if (artifactState.errorMessage && artifactState.feedbackType === null) {
    const alert = createElement(
      'p',
      'learning-hub-artifact-feedback learning-hub-artifact-feedback--error',
      artifactState.errorMessage
    )
    alert.setAttribute('role', 'alert')
    section.append(alert)
  }

  if (artifactState.statusMessage && artifactState.feedbackType === null) {
    const status = createElement(
      'p',
      'learning-hub-artifact-feedback learning-hub-artifact-feedback--success',
      artifactState.statusMessage
    )
    status.setAttribute('role', 'status')
    status.setAttribute('aria-live', 'polite')
    section.append(status)
  }

  const grid = createElement('div', 'learning-hub-artifact-grid')
  for (const type of Object.keys(ARTIFACT_CONFIGS)) {
    grid.append(
      createArtifactCard(
        type,
        artifactState,
        actions,
        focusReferences
      )
    )
  }
  section.append(grid)
  return section
}

function createSelectedLearningNode(
  learningModule,
  chapter,
  learningNode,
  viewState,
  actions,
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
  detail.append(
    eyebrow,
    title,
    content,
    createLearningArtifacts(viewState, actions, focusReferences)
  )
  return detail
}

function createChapter(
  learningModule,
  chapter,
  chapterIndex,
  viewState,
  actions,
  focusReferences,
  moduleProgress,
  isMutating
) {
  const isExpanded = viewState.expandedChapterIds.includes(chapter.id)
  const chapterProgress = getChapterProgress(moduleProgress, chapter.id)
  const canToggleCompletion =
    viewState.progress?.phase === 'ready' &&
    Boolean(chapterProgress) &&
    !isMutating
  const article = createElement('article', 'learning-hub-chapter')
  article.setAttribute(
    'aria-busy',
    String(
      viewState.progress?.phase === 'mutating' &&
        viewState.progress.mutatingChapterId === chapter.id
    )
  )
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
  const completionActions = createElement(
    'div',
    'learning-hub-chapter__actions'
  )
  const completionLabel = createElement(
    'label',
    'learning-hub-chapter__completion'
  )
  const completionCheckbox = createElement(
    'input',
    'learning-hub-chapter__checkbox'
  )
  completionCheckbox.type = 'checkbox'
  completionCheckbox.id = `${toggleId}-completion`
  completionCheckbox.checked = chapterProgress?.isCompleted === true
  completionCheckbox.disabled = !canToggleCompletion
  completionCheckbox.indeterminate = chapterProgress === null
  completionCheckbox.setAttribute('aria-describedby', titleId)
  completionCheckbox.addEventListener('change', () => {
    if (!canToggleCompletion) return
    actions.onToggleChapterCompletion?.(learningModule.id, chapter.id)
  })
  completionLabel.setAttribute('for', completionCheckbox.id)
  completionLabel.append(
    completionCheckbox,
    createElement('span', '', 'Kapitel abgeschlossen')
  )
  focusReferences.chapterCompletions.set(chapter.id, completionCheckbox)
  registerFormTrigger(
    focusReferences,
    {
      formType: 'renameChapter',
      moduleId: learningModule.id,
      chapterId: chapter.id,
    },
    renameButton
  )
  completionActions.append(completionLabel, renameButton)
  header.append(heading, completionActions)
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
        `chapter-${chapterIndex}`,
        isMutating
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
          viewState,
          actions,
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
        `node-${chapterIndex}`,
        isMutating
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
  const moduleProgress = getModuleProgress(viewState, learningModule)
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
  const progressDetail = createModuleProgressDetail(
    moduleProgress,
    viewState.progress?.phase
  )
  section.append(backButton, header, progressDetail)

  if (
    ['renameModule', 'addChapter'].includes(viewState.form?.type)
  ) {
    section.append(
      createForm(
        viewState,
        actions,
        focusReferences,
        'module',
        isMutating
      )
    )
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
        moduleProgress,
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
    case 'chapterCompletion':
      return focusReferences.chapterCompletions.get(
        focusTarget.chapterId
      )
    case 'learningNodeHeading':
      return focusReferences.learningNodeHeadings.get(
        createReferenceKey(
          focusTarget.moduleId,
          focusTarget.chapterId,
          focusTarget.learningNodeId
        )
      )
    case 'artifactHeading':
      return focusReferences.artifactHeading
    case 'artifactField':
      return focusReferences.artifactFields.get(
        focusTarget.artifactType
      )
    case 'artifactTrigger':
      return focusReferences.artifactTriggers.get(
        focusTarget.artifactType
      )
    case 'artifactClearTrigger':
      return focusReferences.artifactClearTriggers.get(
        focusTarget.artifactType
      )
    case 'artifactConfirmation':
      return focusReferences.artifactConfirmations.get(
        focusTarget.artifactType
      )
    case 'artifactAlert':
      return focusReferences.artifactAlerts.get(
        focusTarget.artifactType
      )
    case 'artifactLoadAlert':
      return focusReferences.artifactLoadAlert
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
    const isContentMutating = viewState.phase === 'mutating'
    const hasContentView = !['loading', 'loadError'].includes(
      viewState.phase
    )
    const isProgressMutating =
      hasContentView && viewState.progress?.phase === 'mutating'
    const isProgressLoading =
      hasContentView && viewState.progress?.phase === 'loading'
    const hasArtifactContext =
      hasContentView &&
      typeof viewState.selectedLearningNodeId === 'string'
    const artifactViewState = hasArtifactContext
      ? getArtifactState(viewState)
      : null
    const artifactPhase = artifactViewState?.phase ?? null
    const isArtifactMutating = artifactPhase === 'mutating'
    const isArtifactLoading = artifactPhase === 'loading'
    const isMutating =
      isContentMutating || isProgressMutating || isArtifactMutating
    const isInteractionBlocked =
      isMutating || artifactViewState?.mode === 'confirmClear'
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
      const progressFeedback = createProgressFeedback(
        viewState,
        actions,
        isInteractionBlocked
      )
      if (progressFeedback) fragment.append(progressFeedback)

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
            isInteractionBlocked
          )
        )
      } else {
        fragment.append(
          createOverview(
            viewState,
            actions,
            focusReferences,
            isInteractionBlocked
          )
        )
      }
    }

    fragment.append(createPrivacyNotice())
    rootElement.setAttribute(
      'aria-busy',
      String(
        viewState.phase === 'loading' ||
          isMutating ||
          isProgressLoading ||
          isArtifactLoading
      )
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
