import { validateLearningHub } from './learningHubContract.js'

const EMPTY_PRIVATE_HUB = Object.freeze({
  schemaVersion: 2,
  dataOrigin: 'private',
  modules: Object.freeze([]),
})

const FORM_TYPES = Object.freeze({
  CREATE_MODULE: 'createModule',
  RENAME_MODULE: 'renameModule',
  ADD_CHAPTER: 'addChapter',
  RENAME_CHAPTER: 'renameChapter',
  ADD_LEARNING_NODE: 'addLearningNode',
  UPDATE_LEARNING_NODE: 'updateLearningNode',
})

const FORM_FIELDS = Object.freeze({
  [FORM_TYPES.CREATE_MODULE]: Object.freeze([
    'title',
    'firstChapterTitle',
  ]),
  [FORM_TYPES.RENAME_MODULE]: Object.freeze(['title']),
  [FORM_TYPES.ADD_CHAPTER]: Object.freeze(['title']),
  [FORM_TYPES.RENAME_CHAPTER]: Object.freeze(['title']),
  [FORM_TYPES.ADD_LEARNING_NODE]: Object.freeze(['title', 'content']),
  [FORM_TYPES.UPDATE_LEARNING_NODE]: Object.freeze(['title', 'content']),
})

const SERVICE_METHODS = Object.freeze({
  [FORM_TYPES.CREATE_MODULE]: 'createModule',
  [FORM_TYPES.RENAME_MODULE]: 'renameModule',
  [FORM_TYPES.ADD_CHAPTER]: 'addChapter',
  [FORM_TYPES.RENAME_CHAPTER]: 'renameChapter',
  [FORM_TYPES.ADD_LEARNING_NODE]: 'addLearningNode',
  [FORM_TYPES.UPDATE_LEARNING_NODE]: 'updateLearningNode',
})

const SUCCESS_STATUSES = Object.freeze({
  [FORM_TYPES.CREATE_MODULE]: 'moduleCreated',
  [FORM_TYPES.RENAME_MODULE]: 'moduleRenamed',
  [FORM_TYPES.ADD_CHAPTER]: 'chapterAdded',
  [FORM_TYPES.RENAME_CHAPTER]: 'chapterRenamed',
  [FORM_TYPES.ADD_LEARNING_NODE]: 'learningNodeAdded',
  [FORM_TYPES.UPDATE_LEARNING_NODE]: 'learningNodeUpdated',
})

const SUCCESS_MESSAGES = Object.freeze({
  [FORM_TYPES.CREATE_MODULE]: 'Lernmodul wurde lokal erstellt.',
  [FORM_TYPES.RENAME_MODULE]: 'Lernmodul wurde lokal umbenannt.',
  [FORM_TYPES.ADD_CHAPTER]: 'Kapitel wurde lokal erstellt.',
  [FORM_TYPES.RENAME_CHAPTER]: 'Kapitel wurde lokal umbenannt.',
  [FORM_TYPES.ADD_LEARNING_NODE]: 'LearningNode wurde lokal erstellt.',
  [FORM_TYPES.UPDATE_LEARNING_NODE]: 'LearningNode wurde lokal aktualisiert.',
})

const PROGRESS_SUCCESS_RESULTS = Object.freeze({
  completeChapter: Object.freeze({
    chapterCompleted: true,
    chapterAlreadyCompleted: false,
  }),
  reopenChapter: Object.freeze({
    chapterReopened: true,
    chapterAlreadyOpen: false,
  }),
})

const PROGRESS_SUCCESS_MESSAGES = Object.freeze({
  completeChapter: 'Kapitel wurde als abgeschlossen markiert.',
  reopenChapter: 'Kapitel wurde wieder geöffnet.',
})

const PROGRESS_LOAD_ERROR_MESSAGE =
  'Der Kapitel- und Modulfortschritt ist derzeit nicht verfügbar. Inhalte können weiterhin bearbeitet werden.'
const PROGRESS_STALE_ERROR_MESSAGE =
  'Der Fortschritt ist nach der Inhaltsänderung nicht aktuell. Bitte lade ihn erneut.'
const PROGRESS_MUTATION_ERROR_MESSAGE =
  'Der Kapitelstatus konnte nicht gespeichert werden. Bitte versuche es erneut.'

function scheduleAfterPaint(callback) {
  if (
    typeof globalThis.requestAnimationFrame !== 'function' ||
    typeof globalThis.cancelAnimationFrame !== 'function'
  ) {
    const timeoutId = globalThis.setTimeout(callback, 0)
    return () => globalThis.clearTimeout(timeoutId)
  }

  let secondFrameId = null
  const firstFrameId = globalThis.requestAnimationFrame(() => {
    secondFrameId = globalThis.requestAnimationFrame(callback)
  })

  return () => {
    globalThis.cancelAnimationFrame(firstFrameId)

    if (secondFrameId !== null) {
      globalThis.cancelAnimationFrame(secondFrameId)
    }
  }
}

function isObjectRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isEntityId(value) {
  return typeof value === 'string' && value.length > 0
}

function isHubForView(learningHub) {
  if (learningHub?.dataOrigin !== 'private') return false

  try {
    return validateLearningHub(learningHub).ok
  } catch {
    return false
  }
}

function cloneLearningNode(learningNode) {
  return { ...learningNode }
}

function cloneChapter(chapter) {
  return {
    ...chapter,
    learningNodes: chapter.learningNodes.map(cloneLearningNode),
  }
}

function cloneModule(learningModule) {
  return {
    ...learningModule,
    chapters: learningModule.chapters.map(cloneChapter),
  }
}

function cloneHub(learningHub) {
  return {
    ...learningHub,
    modules: learningHub.modules.map(cloneModule),
  }
}

function cloneProgressProjection(projection) {
  return projection.map((moduleProgress) => ({
    moduleId: moduleProgress.moduleId,
    completedChapterCount: moduleProgress.completedChapterCount,
    totalChapterCount: moduleProgress.totalChapterCount,
    progressPercent: moduleProgress.progressPercent,
    isCompleted: moduleProgress.isCompleted,
    chapters: moduleProgress.chapters.map((chapterProgress) => ({
      chapterId: chapterProgress.chapterId,
      isCompleted: chapterProgress.isCompleted,
    })),
  }))
}

function createInitialProgressState() {
  return {
    phase: 'loading',
    projection: [],
    errorMessage: '',
    mutatingChapterId: null,
  }
}

function cloneProgressState(progress) {
  return {
    ...progress,
    projection: cloneProgressProjection(progress.projection),
  }
}

function createEmptyHub() {
  return {
    ...EMPTY_PRIVATE_HUB,
    modules: [],
  }
}

function createInitialState() {
  return {
    phase: 'loading',
    hub: createEmptyHub(),
    selectedModuleId: null,
    expandedChapterIds: [],
    selectedLearningNodeId: null,
    form: null,
    statusMessage: '',
    errorMessage: '',
    progress: createInitialProgressState(),
  }
}

function createFormState(type, target = {}, values = {}) {
  const normalizedValues = {}

  for (const fieldName of FORM_FIELDS[type] ?? []) {
    normalizedValues[fieldName] =
      typeof values[fieldName] === 'string' ? values[fieldName] : ''
  }

  return {
    type,
    moduleId: target.moduleId ?? null,
    chapterId: target.chapterId ?? null,
    learningNodeId: target.learningNodeId ?? null,
    values: normalizedValues,
    fieldErrors: {},
    errorMessage: '',
    isSubmitting: false,
  }
}

function cloneForm(form) {
  if (!form) return null

  return {
    ...form,
    values: { ...form.values },
    fieldErrors: { ...form.fieldErrors },
  }
}

function getModule(learningHub, moduleId) {
  return learningHub.modules.find(
    (learningModule) => learningModule.id === moduleId
  ) ?? null
}

function getChapter(learningModule, chapterId) {
  return learningModule?.chapters.find(
    (chapter) => chapter.id === chapterId
  ) ?? null
}

function getLearningNode(chapter, learningNodeId) {
  return chapter?.learningNodes.find(
    (learningNode) => learningNode.id === learningNodeId
  ) ?? null
}

function getModuleProgress(projection, moduleId) {
  return projection.find(
    (moduleProgress) => moduleProgress.moduleId === moduleId
  ) ?? null
}

function getChapterProgress(moduleProgress, chapterId) {
  return moduleProgress?.chapters.find(
    (chapterProgress) => chapterProgress.chapterId === chapterId
  ) ?? null
}

function getLearningNodeLocation(learningModule, learningNodeId) {
  for (const chapter of learningModule?.chapters ?? []) {
    const learningNode = getLearningNode(chapter, learningNodeId)

    if (learningNode) {
      return { chapter, learningNode }
    }
  }

  return null
}

function getReadyPhase(learningHub) {
  return learningHub.modules.length === 0 ? 'empty' : 'ready'
}

function hasPlausibleModuleProgress(moduleProgress, learningModule) {
  if (
    !Number.isInteger(moduleProgress.completedChapterCount) ||
    !Number.isInteger(moduleProgress.totalChapterCount) ||
    !Number.isInteger(moduleProgress.progressPercent) ||
    moduleProgress.totalChapterCount !== learningModule.chapters.length ||
    moduleProgress.completedChapterCount < 0 ||
    moduleProgress.completedChapterCount > moduleProgress.totalChapterCount ||
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
      !isObjectRecord(chapterProgress) ||
      !isEntityId(chapterProgress.chapterId) ||
      typeof chapterProgress.isCompleted !== 'boolean' ||
      chapterProgressById.has(chapterProgress.chapterId)
    ) {
      return false
    }

    chapterProgressById.set(chapterProgress.chapterId, chapterProgress)
  }

  let completedChapterCount = 0

  for (const chapter of learningModule.chapters) {
    const chapterProgress = chapterProgressById.get(chapter.id)

    if (!chapterProgress) return false

    if (chapterProgress.isCompleted) {
      completedChapterCount += 1
    }
  }

  const totalChapterCount = learningModule.chapters.length
  const expectedProgressPercent = totalChapterCount === 0
    ? 0
    : Math.round((completedChapterCount / totalChapterCount) * 100)
  const expectedIsCompleted =
    totalChapterCount > 0 && completedChapterCount === totalChapterCount

  return (
    chapterProgressById.size === totalChapterCount &&
    moduleProgress.totalChapterCount === totalChapterCount &&
    moduleProgress.completedChapterCount === completedChapterCount &&
    moduleProgress.progressPercent === expectedProgressPercent &&
    moduleProgress.isCompleted === expectedIsCompleted
  )
}

function isProgressProjectionForHub(projection, learningHub) {
  if (
    !Array.isArray(projection) ||
    projection.length !== learningHub.modules.length
  ) {
    return false
  }

  const moduleProgressById = new Map()

  for (const moduleProgress of projection) {
    if (
      !isObjectRecord(moduleProgress) ||
      !isEntityId(moduleProgress.moduleId) ||
      moduleProgressById.has(moduleProgress.moduleId)
    ) {
      return false
    }

    moduleProgressById.set(moduleProgress.moduleId, moduleProgress)
  }

  for (const learningModule of learningHub.modules) {
    const moduleProgress = moduleProgressById.get(learningModule.id)

    if (
      !moduleProgress ||
      !hasPlausibleModuleProgress(moduleProgress, learningModule)
    ) {
      return false
    }
  }

  return moduleProgressById.size === learningHub.modules.length
}

function formTargetExists(form, learningHub) {
  if (!form) return true
  if (form.type === FORM_TYPES.CREATE_MODULE) return true

  const learningModule = getModule(learningHub, form.moduleId)
  if (!learningModule) return false

  if (
    form.type === FORM_TYPES.RENAME_MODULE ||
    form.type === FORM_TYPES.ADD_CHAPTER
  ) {
    return true
  }

  const chapter = getChapter(learningModule, form.chapterId)
  if (!chapter) return false

  if (
    form.type === FORM_TYPES.RENAME_CHAPTER ||
    form.type === FORM_TYPES.ADD_LEARNING_NODE
  ) {
    return true
  }

  return Boolean(getLearningNode(chapter, form.learningNodeId))
}

function reconcileStateWithHub(state, learningHub) {
  const hub = cloneHub(learningHub)
  const selectedModule = getModule(hub, state.selectedModuleId)

  if (!selectedModule) {
    return {
      ...state,
      phase: getReadyPhase(hub),
      hub,
      selectedModuleId: null,
      expandedChapterIds: [],
      selectedLearningNodeId: null,
      form:
        state.form?.type === FORM_TYPES.CREATE_MODULE
          ? cloneForm(state.form)
          : null,
    }
  }

  const validChapterIds = new Set(
    selectedModule.chapters.map((chapter) => chapter.id)
  )
  const expandedChapterIds = [...new Set(state.expandedChapterIds)].filter(
    (chapterId) => validChapterIds.has(chapterId)
  )
  const selectedLearningNode = getLearningNodeLocation(
    selectedModule,
    state.selectedLearningNodeId
  )

  return {
    ...state,
    phase: getReadyPhase(hub),
    hub,
    expandedChapterIds,
    selectedLearningNodeId: selectedLearningNode
      ? state.selectedLearningNodeId
      : null,
    form: formTargetExists(state.form, hub) ? cloneForm(state.form) : null,
  }
}

function getLoadErrorMessage(result) {
  switch (result?.status) {
    case 'invalidJson':
    case 'invalidStoredData':
      return 'Die lokal gespeicherten LearningHub-Daten sind nicht lesbar. Sie wurden nicht überschrieben.'
    case 'unavailable':
      return 'Der lokale LearningHub-Speicher ist in diesem Browserprofil nicht verfügbar.'
    case 'readFailed':
      return 'Der LearningHub konnte lokal nicht gelesen werden. Bitte versuche es erneut.'
    default:
      return 'Der LearningHub konnte nicht geladen werden. Bitte versuche es erneut.'
  }
}

function getMutationErrorMessage(result) {
  switch (result?.status) {
    case 'validationFailed':
      return 'Bitte korrigiere die markierten Felder.'
    case 'quotaExceeded':
      return 'Der verfügbare lokale Speicherplatz reicht für diese Änderung nicht aus.'
    case 'unavailable':
      return 'Der lokale LearningHub-Speicher ist derzeit nicht verfügbar.'
    case 'notFound':
    case 'ownershipMismatch':
      return 'Das ausgewählte Ziel ist nicht mehr verfügbar. Lade den LearningHub neu und versuche es erneut.'
    case 'generationFailed':
      return 'Die Änderung konnte lokal nicht vorbereitet werden. Bitte versuche es erneut.'
    case 'writeFailed':
      return 'Die Änderung konnte nicht lokal gespeichert werden. Bitte versuche es erneut.'
    default:
      return 'Die LearningHub-Änderung konnte nicht gespeichert werden. Bitte versuche es erneut.'
  }
}

function getRequiredFieldErrors(formValues, fieldNames) {
  const fieldErrors = {}

  for (const fieldName of fieldNames) {
    const value = formValues[fieldName]

    if (typeof value !== 'string' || value.trim().length === 0) {
      if (fieldName === 'content') {
        fieldErrors[fieldName] = 'Bitte gib einen LearningNode-Inhalt ein.'
      } else if (fieldName === 'firstChapterTitle') {
        fieldErrors[fieldName] = 'Bitte gib den Titel des ersten Kapitels ein.'
      } else {
        fieldErrors[fieldName] = 'Bitte gib einen Titel ein.'
      }
    }
  }

  return fieldErrors
}

function getServiceFieldErrors(result, formType) {
  const fieldErrors = {}
  const allowedFields = FORM_FIELDS[formType] ?? []
  const serviceFieldErrors = result?.error?.fieldErrors

  if (!isObjectRecord(serviceFieldErrors)) return fieldErrors

  for (const fieldName of allowedFields) {
    if (!Object.hasOwn(serviceFieldErrors, fieldName)) continue

    if (fieldName === 'content') {
      fieldErrors[fieldName] =
        'Bitte gib einen Inhalt mit höchstens 10.000 Zeichen ein.'
    } else if (fieldName === 'firstChapterTitle') {
      fieldErrors[fieldName] =
        'Bitte gib einen Kapiteltitel mit höchstens 120 Zeichen ein.'
    } else {
      fieldErrors[fieldName] =
        'Bitte gib einen Titel mit höchstens 120 Zeichen ein.'
    }
  }

  return fieldErrors
}

function getFirstFieldError(fieldErrors, formType) {
  return (FORM_FIELDS[formType] ?? []).find((fieldName) =>
    Object.hasOwn(fieldErrors, fieldName)
  ) ?? null
}

function getSubmission(form, submittedValues) {
  if (!isObjectRecord(submittedValues) || submittedValues.type !== form.type) {
    return null
  }

  const targetFields = ['moduleId', 'chapterId', 'learningNodeId']

  for (const fieldName of targetFields) {
    if (
      form[fieldName] !== null &&
      submittedValues[fieldName] !== form[fieldName]
    ) {
      return null
    }
  }

  const values = {}
  for (const fieldName of FORM_FIELDS[form.type] ?? []) {
    values[fieldName] =
      typeof submittedValues[fieldName] === 'string'
        ? submittedValues[fieldName]
        : ''
  }

  const serviceInput = { ...values }
  for (const fieldName of targetFields) {
    if (form[fieldName] !== null) {
      serviceInput[fieldName] = form[fieldName]
    }
  }

  return { values, serviceInput }
}

export function createLearningHubController({
  learningHubService,
  learningProgressService,
  learningHubView,
  scheduleTask = scheduleAfterPaint,
} = {}) {
  let isActive = false
  let cancelScheduledLoad = null
  let viewState = createInitialState()

  const actions = Object.freeze({
    onRetryLoad: retryHubLoad,
    onRetryProgressLoad: retryProgressLoad,
    onSelectModule: selectModule,
    onBackToOverview: backToOverview,
    onToggleChapter: toggleChapter,
    onToggleChapterCompletion: toggleChapterCompletion,
    onSelectLearningNode: selectLearningNode,
    onOpenCreateModuleForm: openCreateModuleForm,
    onOpenRenameModuleForm: openRenameModuleForm,
    onOpenAddChapterForm: openAddChapterForm,
    onOpenRenameChapterForm: openRenameChapterForm,
    onOpenAddLearningNodeForm: openAddLearningNodeForm,
    onOpenUpdateLearningNodeForm: openUpdateLearningNodeForm,
    onUpdateFormField: updateFormField,
    onSubmitForm: submitForm,
    onCancelForm: cancelForm,
  })

  function render(focusTarget = null) {
    if (!isActive || typeof learningHubView?.render !== 'function') return

    learningHubView.render(
      {
        ...viewState,
        hub: cloneHub(viewState.hub),
        expandedChapterIds: [...viewState.expandedChapterIds],
        form: cloneForm(viewState.form),
        progress: cloneProgressState(viewState.progress),
        focusTarget,
      },
      actions
    )
  }

  function cancelPendingLoad() {
    if (typeof cancelScheduledLoad === 'function') {
      cancelScheduledLoad()
    }

    cancelScheduledLoad = null
  }

  function readProgressProjection() {
    try {
      const result = learningProgressService?.loadProgress?.()

      if (
        result?.ok !== true ||
        !['empty', 'loaded'].includes(result.status) ||
        !isProgressProjectionForHub(result.projection, viewState.hub)
      ) {
        return null
      }

      return cloneProgressProjection(result.projection)
    } catch {
      return null
    }
  }

  function finishProgressLoading(failurePhase) {
    const projection = readProgressProjection()

    if (projection) {
      viewState = {
        ...viewState,
        progress: {
          phase: 'ready',
          projection,
          errorMessage: '',
          mutatingChapterId: null,
        },
      }
      return true
    }

    viewState = {
      ...viewState,
      progress: {
        phase: failurePhase,
        projection: [],
        errorMessage:
          failurePhase === 'stale'
            ? PROGRESS_STALE_ERROR_MESSAGE
            : PROGRESS_LOAD_ERROR_MESSAGE,
        mutatingChapterId: null,
      },
    }
    return false
  }

  function finishLoading() {
    cancelScheduledLoad = null
    if (!isActive) return

    let result

    try {
      result = learningHubService?.loadHub?.()
    } catch {
      result = null
    }

    if (
      result?.ok === true &&
      ['empty', 'loaded'].includes(result.status) &&
      isHubForView(result.hub)
    ) {
      viewState = reconcileStateWithHub(
        {
          ...createInitialState(),
          statusMessage: '',
        },
        result.hub
      )
      render()
      finishProgressLoading('unavailable')
      render({ type: 'heading' })
      return
    }

    viewState = {
      ...createInitialState(),
      phase: 'loadError',
      errorMessage: getLoadErrorMessage(result),
      progress: {
        phase: 'unavailable',
        projection: [],
        errorMessage: '',
        mutatingChapterId: null,
      },
    }
    render({ type: 'heading' })
  }

  function loadHub() {
    if (!isActive) return

    cancelPendingLoad()
    viewState = createInitialState()
    render()
    cancelScheduledLoad = scheduleTask(finishLoading)
  }

  function retryHubLoad() {
    if (!isActive || viewState.phase !== 'loadError') return

    loadHub()
  }

  function canUseReadyView() {
    return (
      isActive &&
      ['empty', 'ready'].includes(viewState.phase) &&
      !viewState.form?.isSubmitting &&
      viewState.progress.phase !== 'mutating'
    )
  }

  function retryProgressLoad() {
    if (
      !canUseReadyView() ||
      !['unavailable', 'stale'].includes(viewState.progress.phase)
    ) {
      return
    }

    viewState = {
      ...viewState,
      progress: createInitialProgressState(),
    }
    render()
    finishProgressLoading('unavailable')
    render()
  }

  function selectModule(moduleId) {
    if (!canUseReadyView()) return

    const learningModule = getModule(viewState.hub, moduleId)
    if (!learningModule) return

    viewState = {
      ...viewState,
      selectedModuleId: learningModule.id,
      expandedChapterIds: [],
      selectedLearningNodeId: null,
      form: null,
      statusMessage: '',
      errorMessage: '',
    }
    render({ type: 'moduleHeading' })
  }

  function backToOverview() {
    if (!canUseReadyView() || viewState.selectedModuleId === null) return

    viewState = {
      ...viewState,
      selectedModuleId: null,
      expandedChapterIds: [],
      selectedLearningNodeId: null,
      form: null,
      errorMessage: '',
    }
    render({ type: 'overviewHeading' })
  }

  function toggleChapter(moduleId, chapterId) {
    if (!canUseReadyView() || moduleId !== viewState.selectedModuleId) return

    const learningModule = getModule(viewState.hub, moduleId)
    const chapter = getChapter(learningModule, chapterId)
    if (!chapter) return

    const isExpanded = viewState.expandedChapterIds.includes(chapterId)
    const expandedChapterIds = isExpanded
      ? viewState.expandedChapterIds.filter((id) => id !== chapterId)
      : [...viewState.expandedChapterIds, chapterId]
    const selectedLocation = getLearningNodeLocation(
      learningModule,
      viewState.selectedLearningNodeId
    )

    viewState = {
      ...viewState,
      expandedChapterIds,
      selectedLearningNodeId:
        isExpanded && selectedLocation?.chapter.id === chapterId
          ? null
          : viewState.selectedLearningNodeId,
      form:
        isExpanded && viewState.form?.chapterId === chapterId
          ? null
          : viewState.form,
      errorMessage: '',
    }
    render({ type: 'chapterToggle', moduleId, chapterId })
  }

  function toggleChapterCompletion(moduleId, chapterId) {
    if (
      !canUseReadyView() ||
      viewState.progress.phase !== 'ready' ||
      moduleId !== viewState.selectedModuleId
    ) {
      return
    }

    const learningModule = getModule(viewState.hub, moduleId)
    const chapter = getChapter(learningModule, chapterId)
    const moduleProgress = getModuleProgress(
      viewState.progress.projection,
      moduleId
    )
    const chapterProgress = getChapterProgress(
      moduleProgress,
      chapterId
    )

    if (!chapter || !chapterProgress) return

    const serviceMethod = chapterProgress.isCompleted
      ? 'reopenChapter'
      : 'completeChapter'
    const previousProjection = cloneProgressProjection(
      viewState.progress.projection
    )

    viewState = {
      ...viewState,
      statusMessage: '',
      progress: {
        phase: 'mutating',
        projection: previousProjection,
        errorMessage: '',
        mutatingChapterId: chapterId,
      },
    }
    render()

    let result
    let nextProjection = null

    try {
      result = learningProgressService?.[serviceMethod]?.({
        moduleId,
        chapterId,
      })
      const expectedResults = PROGRESS_SUCCESS_RESULTS[serviceMethod]

      if (
        result?.ok === true &&
        Object.hasOwn(expectedResults, result.status) &&
        result.changed === expectedResults[result.status] &&
        isProgressProjectionForHub(result.projection, viewState.hub)
      ) {
        const nextModuleProgress = getModuleProgress(
          result.projection,
          moduleId
        )
        const nextChapterProgress = getChapterProgress(
          nextModuleProgress,
          chapterId
        )
        const expectedIsCompleted = serviceMethod === 'completeChapter'

        if (nextChapterProgress?.isCompleted === expectedIsCompleted) {
          nextProjection = cloneProgressProjection(result.projection)
        }
      }
    } catch {
      result = null
    }

    if (!nextProjection) {
      viewState = {
        ...viewState,
        progress: {
          phase: 'ready',
          projection: previousProjection,
          errorMessage: PROGRESS_MUTATION_ERROR_MESSAGE,
          mutatingChapterId: null,
        },
      }
      render({ type: 'chapterCompletion', chapterId })
      return
    }

    viewState = {
      ...viewState,
      statusMessage: PROGRESS_SUCCESS_MESSAGES[serviceMethod],
      errorMessage: '',
      progress: {
        phase: 'ready',
        projection: nextProjection,
        errorMessage: '',
        mutatingChapterId: null,
      },
    }
    render({ type: 'chapterCompletion', chapterId })
  }

  function selectLearningNode(moduleId, chapterId, learningNodeId) {
    if (!canUseReadyView() || moduleId !== viewState.selectedModuleId) return

    const learningModule = getModule(viewState.hub, moduleId)
    const chapter = getChapter(learningModule, chapterId)
    const learningNode = getLearningNode(chapter, learningNodeId)
    if (!learningNode) return

    viewState = {
      ...viewState,
      expandedChapterIds: [
        ...new Set([...viewState.expandedChapterIds, chapterId]),
      ],
      selectedLearningNodeId: learningNode.id,
      form: null,
      statusMessage: '',
      errorMessage: '',
    }
    render({
      type: 'learningNodeHeading',
      moduleId,
      chapterId,
      learningNodeId,
    })
  }

  function setForm(form, focusTarget) {
    if (!canUseReadyView()) return

    viewState = {
      ...viewState,
      form,
      statusMessage: '',
      errorMessage: '',
    }
    render(focusTarget)
  }

  function openCreateModuleForm() {
    if (viewState.selectedModuleId !== null) return
    setForm(
      createFormState(FORM_TYPES.CREATE_MODULE),
      { type: 'formField', fieldName: 'title' }
    )
  }

  function openRenameModuleForm(moduleId) {
    const learningModule = getModule(viewState.hub, moduleId)
    if (!learningModule || moduleId !== viewState.selectedModuleId) return

    setForm(
      createFormState(
        FORM_TYPES.RENAME_MODULE,
        { moduleId },
        { title: learningModule.title }
      ),
      { type: 'formField', fieldName: 'title' }
    )
  }

  function openAddChapterForm(moduleId) {
    if (
      moduleId !== viewState.selectedModuleId ||
      !getModule(viewState.hub, moduleId)
    ) return

    setForm(
      createFormState(FORM_TYPES.ADD_CHAPTER, { moduleId }),
      { type: 'formField', fieldName: 'title' }
    )
  }

  function openRenameChapterForm(moduleId, chapterId) {
    const learningModule = getModule(viewState.hub, moduleId)
    const chapter = getChapter(learningModule, chapterId)
    if (!chapter || moduleId !== viewState.selectedModuleId) return

    setForm(
      createFormState(
        FORM_TYPES.RENAME_CHAPTER,
        { moduleId, chapterId },
        { title: chapter.title }
      ),
      { type: 'formField', fieldName: 'title' }
    )
  }

  function openAddLearningNodeForm(moduleId, chapterId) {
    if (!canUseReadyView()) return

    const learningModule = getModule(viewState.hub, moduleId)
    const chapter = getChapter(learningModule, chapterId)
    if (!chapter || moduleId !== viewState.selectedModuleId) return

    viewState = {
      ...viewState,
      expandedChapterIds: [
        ...new Set([...viewState.expandedChapterIds, chapterId]),
      ],
    }
    setForm(
      createFormState(FORM_TYPES.ADD_LEARNING_NODE, {
        moduleId,
        chapterId,
      }),
      { type: 'formField', fieldName: 'title' }
    )
  }

  function openUpdateLearningNodeForm(
    moduleId,
    chapterId,
    learningNodeId
  ) {
    if (!canUseReadyView()) return

    const learningModule = getModule(viewState.hub, moduleId)
    const chapter = getChapter(learningModule, chapterId)
    const learningNode = getLearningNode(chapter, learningNodeId)
    if (!learningNode || moduleId !== viewState.selectedModuleId) return

    viewState = {
      ...viewState,
      expandedChapterIds: [
        ...new Set([...viewState.expandedChapterIds, chapterId]),
      ],
      selectedLearningNodeId: learningNodeId,
    }
    setForm(
      createFormState(
        FORM_TYPES.UPDATE_LEARNING_NODE,
        { moduleId, chapterId, learningNodeId },
        { title: learningNode.title, content: learningNode.content }
      ),
      { type: 'formField', fieldName: 'title' }
    )
  }

  function updateFormField(fieldName, value) {
    if (
      !canUseReadyView() ||
      !viewState.form ||
      !FORM_FIELDS[viewState.form.type]?.includes(fieldName) ||
      typeof value !== 'string'
    ) return

    const hadFieldError = Object.hasOwn(
      viewState.form.fieldErrors,
      fieldName
    )
    const fieldErrors = { ...viewState.form.fieldErrors }
    delete fieldErrors[fieldName]

    viewState = {
      ...viewState,
      form: {
        ...viewState.form,
        values: {
          ...viewState.form.values,
          [fieldName]: value,
        },
        fieldErrors,
        errorMessage: hadFieldError ? '' : viewState.form.errorMessage,
      },
    }

    if (hadFieldError) {
      render({ type: 'formField', fieldName })
    }
  }

  function cancelForm() {
    if (!canUseReadyView() || !viewState.form) return

    const cancelledForm = cloneForm(viewState.form)
    viewState = {
      ...viewState,
      form: null,
      errorMessage: '',
    }
    render({
      type: 'formTrigger',
      formType: cancelledForm.type,
      moduleId: cancelledForm.moduleId,
      chapterId: cancelledForm.chapterId,
      learningNodeId: cancelledForm.learningNodeId,
    })
  }

  function completeSuccessfulMutation(form, result) {
    let nextState = {
      ...viewState,
      phase: getReadyPhase(result.hub),
      form: null,
      statusMessage: SUCCESS_MESSAGES[form.type],
      errorMessage: '',
    }

    if (
      form.type === FORM_TYPES.ADD_CHAPTER &&
      isEntityId(result.createdChapter?.id)
    ) {
      nextState.expandedChapterIds = [
        ...new Set([
          ...nextState.expandedChapterIds,
          result.createdChapter.id,
        ]),
      ]
    }

    if (
      form.type === FORM_TYPES.ADD_LEARNING_NODE &&
      isEntityId(result.createdLearningNode?.id)
    ) {
      nextState.expandedChapterIds = [
        ...new Set([...nextState.expandedChapterIds, form.chapterId]),
      ]
      nextState.selectedLearningNodeId = result.createdLearningNode.id
    }

    nextState = reconcileStateWithHub(nextState, result.hub)
    viewState = nextState

    if (
      [FORM_TYPES.CREATE_MODULE, FORM_TYPES.ADD_CHAPTER].includes(form.type)
    ) {
      viewState = {
        ...viewState,
        progress: createInitialProgressState(),
      }
      render()
      finishProgressLoading('stale')
    }

    render({ type: 'status' })
  }

  function submitForm(submittedValues) {
    if (
      !canUseReadyView() ||
      !viewState.form ||
      viewState.form.isSubmitting
    ) return

    const form = cloneForm(viewState.form)
    const submission = getSubmission(form, submittedValues)
    if (!submission) return

    const fieldErrors = getRequiredFieldErrors(
      submission.values,
      FORM_FIELDS[form.type]
    )

    if (Object.keys(fieldErrors).length > 0) {
      viewState = {
        ...viewState,
        form: {
          ...form,
          values: submission.values,
          fieldErrors,
          errorMessage: 'Bitte korrigiere die markierten Felder.',
        },
      }
      render({
        type: 'formField',
        fieldName: getFirstFieldError(fieldErrors, form.type),
      })
      return
    }

    viewState = {
      ...viewState,
      phase: 'mutating',
      statusMessage: '',
      errorMessage: '',
      form: {
        ...form,
        values: submission.values,
        fieldErrors: {},
        errorMessage: '',
        isSubmitting: true,
      },
    }
    render()

    let result
    const serviceMethod = SERVICE_METHODS[form.type]

    try {
      result = learningHubService?.[serviceMethod]?.({
        ...submission.serviceInput,
      })
    } catch {
      result = null
    }

    if (
      result?.ok === true &&
      result.status === SUCCESS_STATUSES[form.type] &&
      isHubForView(result.hub)
    ) {
      completeSuccessfulMutation(form, result)
      return
    }

    const serviceFieldErrors = getServiceFieldErrors(result, form.type)
    const firstInvalidField = getFirstFieldError(
      serviceFieldErrors,
      form.type
    )
    viewState = {
      ...viewState,
      phase: getReadyPhase(viewState.hub),
      form: {
        ...form,
        values: submission.values,
        fieldErrors: serviceFieldErrors,
        errorMessage: getMutationErrorMessage(result),
        isSubmitting: false,
      },
    }
    render(
      firstInvalidField
        ? { type: 'formField', fieldName: firstInvalidField }
        : { type: 'formAlert' }
    )
  }

  function open() {
    if (isActive) return

    isActive = true
    loadHub()
  }

  function close() {
    isActive = false
    cancelPendingLoad()
    viewState = createInitialState()
    learningHubView?.unmount?.()
  }

  return Object.freeze({ open, close })
}
