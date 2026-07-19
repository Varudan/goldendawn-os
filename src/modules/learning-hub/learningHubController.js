import { validateLearningHub } from './learningHubContract.js'
import {
  LEARNING_ARTIFACT_CONTENT_MAX_LENGTH,
  LEARNING_ARTIFACT_TYPES,
  validateLearningArtifactStore,
} from './learningArtifactContract.js'

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

const ARTIFACT_TYPES = Object.freeze([
  LEARNING_ARTIFACT_TYPES.NOTE,
  LEARNING_ARTIFACT_TYPES.SUMMARY,
])

const ARTIFACT_SAVE_METHODS = Object.freeze({
  [LEARNING_ARTIFACT_TYPES.NOTE]: 'saveNote',
  [LEARNING_ARTIFACT_TYPES.SUMMARY]: 'saveSummary',
})

const ARTIFACT_CLEAR_METHODS = Object.freeze({
  [LEARNING_ARTIFACT_TYPES.NOTE]: 'clearNote',
  [LEARNING_ARTIFACT_TYPES.SUMMARY]: 'clearSummary',
})

const ARTIFACT_LABELS = Object.freeze({
  [LEARNING_ARTIFACT_TYPES.NOTE]: 'Notiz',
  [LEARNING_ARTIFACT_TYPES.SUMMARY]: 'Zusammenfassung',
})

const ARTIFACT_SAVE_SUCCESS_RESULTS = Object.freeze({
  artifactCreated: true,
  artifactUpdated: true,
  artifactUnchanged: false,
})

const ARTIFACT_CLEAR_SUCCESS_RESULTS = Object.freeze({
  artifactCleared: true,
  artifactAlreadyEmpty: false,
})

const ARTIFACT_LOAD_ERROR_MESSAGE =
  'Notizen und Zusammenfassungen sind derzeit nicht verfügbar. Lerninhalte und Fortschritt bleiben bedienbar.'
const ARTIFACT_MUTATION_ERROR_MESSAGE =
  'Das Lernartefakt konnte nicht lokal gespeichert werden. Bitte versuche es erneut.'
const ARTIFACT_RESULT_ERROR_MESSAGE =
  'Das Ergebnis der Artefaktoperation konnte nicht sicher verarbeitet werden. Der letzte gültige Stand bleibt erhalten.'
const ARTIFACT_DIRTY_BLOCK_MESSAGE =
  'Es gibt einen ungespeicherten Entwurf. Speichere ihn oder brich die Bearbeitung ab, bevor du den Bereich wechselst.'

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

function isPlainDataObject(value) {
  if (!isObjectRecord(value)) return false

  try {
    const prototype = Object.getPrototypeOf(value)
    return prototype === Object.prototype || prototype === null
  } catch {
    return false
  }
}

function hasArtifactResultShape(result) {
  try {
    return (
      isPlainDataObject(result) &&
      Object.hasOwn(result, 'ok') &&
      Object.hasOwn(result, 'status') &&
      Object.hasOwn(result, 'changed') &&
      Object.hasOwn(result, 'artifactStore')
    )
  } catch {
    return false
  }
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

function cloneArtifact(artifact) {
  return { ...artifact }
}

function cloneArtifactStore(artifactStore) {
  return {
    schemaVersion: artifactStore.schemaVersion,
    dataOrigin: artifactStore.dataOrigin,
    artifacts: artifactStore.artifacts.map(cloneArtifact),
  }
}

function createInitialArtifactState() {
  return {
    phase: 'loading',
    activeType: null,
    mode: 'view',
    draft: '',
    fieldError: '',
    errorMessage: '',
    statusMessage: '',
    feedbackType: null,
    mutatingType: null,
  }
}

function isArtifactType(type) {
  return ARTIFACT_TYPES.includes(type)
}

function getArtifactIndex(artifactStore, type, references) {
  if (!artifactStore || !references) return -1

  return artifactStore.artifacts.findIndex((artifact) => (
    artifact.type === type &&
    artifact.moduleId === references.moduleId &&
    artifact.chapterId === references.chapterId &&
    artifact.learningNodeId === references.learningNodeId
  ))
}

function getArtifactContent(artifactStore, type, references) {
  const artifactIndex = getArtifactIndex(
    artifactStore,
    type,
    references
  )

  return artifactIndex === -1
    ? null
    : artifactStore.artifacts[artifactIndex].content
}

function createArtifactTargetSnapshot(type, references) {
  if (
    !isArtifactType(type) ||
    !isEntityId(references?.moduleId) ||
    !isEntityId(references?.chapterId) ||
    !isEntityId(references?.learningNodeId)
  ) {
    return null
  }

  return Object.freeze({
    moduleId: references.moduleId,
    chapterId: references.chapterId,
    learningNodeId: references.learningNodeId,
    type,
  })
}

function isValidArtifactTargetSnapshot(target) {
  try {
    if (!isPlainDataObject(target) || !Object.isFrozen(target)) {
      return false
    }

    return (
      Object.keys(target).length === 4 &&
      Object.hasOwn(target, 'moduleId') &&
      Object.hasOwn(target, 'chapterId') &&
      Object.hasOwn(target, 'learningNodeId') &&
      Object.hasOwn(target, 'type') &&
      isEntityId(target.moduleId) &&
      isEntityId(target.chapterId) &&
      isEntityId(target.learningNodeId) &&
      isArtifactType(target.type)
    )
  } catch {
    return false
  }
}

function getArtifactTargetReferences(target) {
  if (!isValidArtifactTargetSnapshot(target)) return null

  return {
    moduleId: target.moduleId,
    chapterId: target.chapterId,
    learningNodeId: target.learningNodeId,
  }
}

function doesArtifactTargetMatchSelection(
  target,
  type,
  references
) {
  return (
    isValidArtifactTargetSnapshot(target) &&
    target.type === type &&
    references !== null &&
    target.moduleId === references.moduleId &&
    target.chapterId === references.chapterId &&
    target.learningNodeId === references.learningNodeId
  )
}

function areArtifactsEqual(firstArtifact, secondArtifact) {
  return (
    firstArtifact?.id === secondArtifact?.id &&
    firstArtifact?.type === secondArtifact?.type &&
    firstArtifact?.moduleId === secondArtifact?.moduleId &&
    firstArtifact?.chapterId === secondArtifact?.chapterId &&
    firstArtifact?.learningNodeId === secondArtifact?.learningNodeId &&
    firstArtifact?.content === secondArtifact?.content &&
    firstArtifact?.createdAt === secondArtifact?.createdAt &&
    firstArtifact?.updatedAt === secondArtifact?.updatedAt
  )
}

function areArtifactStoresEqual(firstStore, secondStore) {
  return (
    firstStore?.schemaVersion === secondStore?.schemaVersion &&
    firstStore?.dataOrigin === secondStore?.dataOrigin &&
    Array.isArray(firstStore?.artifacts) &&
    Array.isArray(secondStore?.artifacts) &&
    firstStore.artifacts.length === secondStore.artifacts.length &&
    firstStore.artifacts.every((artifact, index) =>
      areArtifactsEqual(artifact, secondStore.artifacts[index])
    )
  )
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

function getSelectedLearningNodeReferences(viewState) {
  const learningModule = getModule(
    viewState.hub,
    viewState.selectedModuleId
  )
  const location = getLearningNodeLocation(
    learningModule,
    viewState.selectedLearningNodeId
  )

  if (!learningModule || !location) return null

  return {
    moduleId: learningModule.id,
    chapterId: location.chapter.id,
    learningNodeId: location.learningNode.id,
  }
}

function isArtifactStoreForHub(artifactStore, learningHub) {
  try {
    if (
      artifactStore?.dataOrigin !== 'private' ||
      !validateLearningArtifactStore(artifactStore).ok
    ) {
      return false
    }

    for (const artifact of artifactStore.artifacts) {
      const learningModule = getModule(learningHub, artifact.moduleId)
      const chapter = getChapter(learningModule, artifact.chapterId)
      const learningNode = getLearningNode(
        chapter,
        artifact.learningNodeId
      )

      if (!learningModule || !chapter || !learningNode) {
        return false
      }
    }

    return true
  } catch {
    return false
  }
}

function readValidatedArtifactStore(result, learningHub) {
  let candidateStore

  try {
    if (!hasArtifactResultShape(result)) return null
    candidateStore = result?.artifactStore
  } catch {
    return null
  }

  if (
    !isObjectRecord(candidateStore) ||
    !isArtifactStoreForHub(candidateStore, learningHub)
  ) {
    return null
  }

  let artifactStore

  try {
    artifactStore = cloneArtifactStore(candidateStore)
  } catch {
    return null
  }

  return isArtifactStoreForHub(artifactStore, learningHub)
    ? artifactStore
    : null
}

function createArtifactViewModel(
  viewState,
  artifactState,
  artifactStoreSnapshot
) {
  const references = getSelectedLearningNodeReferences(viewState)
  const values = {
    [LEARNING_ARTIFACT_TYPES.NOTE]: references
      ? getArtifactContent(
          artifactStoreSnapshot,
          LEARNING_ARTIFACT_TYPES.NOTE,
          references
        )
      : null,
    [LEARNING_ARTIFACT_TYPES.SUMMARY]: references
      ? getArtifactContent(
          artifactStoreSnapshot,
          LEARNING_ARTIFACT_TYPES.SUMMARY,
          references
        )
      : null,
  }
  const persistedValue = artifactState.activeType
    ? values[artifactState.activeType] ?? ''
    : ''

  return {
    ...artifactState,
    values,
    dirty:
      artifactState.mode === 'editing' &&
      artifactState.draft.trim() !== persistedValue,
    interactionDisabled: viewState.form !== null,
  }
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

function getArtifactLoadErrorMessage(result) {
  switch (result?.status) {
    case 'invalidJson':
    case 'invalidStoredData':
      return 'Die lokal gespeicherten Lernartefakte sind nicht lesbar. Sie wurden nicht überschrieben.'
    case 'unavailable':
      return 'Der lokale Speicher für Notizen und Zusammenfassungen ist in diesem Browserprofil nicht verfügbar.'
    case 'readFailed':
      return 'Notizen und Zusammenfassungen konnten lokal nicht gelesen werden. Bitte versuche es erneut.'
    default:
      return ARTIFACT_LOAD_ERROR_MESSAGE
  }
}

function getArtifactMutationErrorMessage(result) {
  switch (result?.status) {
    case 'validationFailed':
      return 'Bitte korrigiere den Artefakttext.'
    case 'quotaExceeded':
      return 'Der verfügbare lokale Speicherplatz reicht für dieses Lernartefakt nicht aus.'
    case 'unavailable':
      return 'Der lokale Speicher für Notizen und Zusammenfassungen ist derzeit nicht verfügbar.'
    case 'invalidJson':
    case 'invalidStoredData':
      return 'Die gespeicherten Lernartefakte sind nicht lesbar und wurden nicht überschrieben.'
    case 'readFailed':
      return 'Die Lernartefakte konnten vor dem Speichern nicht sicher gelesen werden.'
    case 'notFound':
    case 'ownershipMismatch':
      return 'Der ausgewählte LearningNode ist nicht mehr verfügbar. Lade den LearningHub neu und versuche es erneut.'
    case 'generationFailed':
      return 'Das Lernartefakt konnte lokal nicht vorbereitet werden. Bitte versuche es erneut.'
    case 'writeFailed':
    case 'serializationFailed':
      return ARTIFACT_MUTATION_ERROR_MESSAGE
    default:
      return ARTIFACT_MUTATION_ERROR_MESSAGE
  }
}

function hasArtifactContentFieldError(result) {
  return (
    result?.status === 'validationFailed' &&
    isObjectRecord(result.error?.fieldErrors) &&
    Object.hasOwn(result.error.fieldErrors, 'content')
  )
}

function hasExpectedTargetArtifact(
  artifact,
  type,
  references,
  content
) {
  return (
    artifact?.type === type &&
    artifact?.moduleId === references.moduleId &&
    artifact?.chapterId === references.chapterId &&
    artifact?.learningNodeId === references.learningNodeId &&
    artifact?.content === content
  )
}

function isArtifactSaveResultConsistent(
  status,
  previousStore,
  updatedStore,
  type,
  references,
  content
) {
  const previousIndex = getArtifactIndex(
    previousStore,
    type,
    references
  )
  const updatedIndex = getArtifactIndex(
    updatedStore,
    type,
    references
  )

  if (status === 'artifactUnchanged') {
    return (
      previousIndex !== -1 &&
      previousStore.artifacts[previousIndex].content === content &&
      areArtifactStoresEqual(previousStore, updatedStore)
    )
  }

  if (status === 'artifactCreated') {
    if (
      previousIndex !== -1 ||
      updatedIndex !== previousStore.artifacts.length ||
      updatedStore.artifacts.length !==
        previousStore.artifacts.length + 1 ||
      previousStore.schemaVersion !== updatedStore.schemaVersion ||
      previousStore.dataOrigin !== updatedStore.dataOrigin ||
      !hasExpectedTargetArtifact(
        updatedStore.artifacts[updatedIndex],
        type,
        references,
        content
      )
    ) {
      return false
    }

    return previousStore.artifacts.every((artifact, index) =>
      areArtifactsEqual(artifact, updatedStore.artifacts[index])
    )
  }

  if (
    status !== 'artifactUpdated' ||
    previousIndex === -1 ||
    updatedIndex !== previousIndex ||
    updatedStore.artifacts.length !== previousStore.artifacts.length ||
    previousStore.schemaVersion !== updatedStore.schemaVersion ||
    previousStore.dataOrigin !== updatedStore.dataOrigin
  ) {
    return false
  }

  const previousArtifact = previousStore.artifacts[previousIndex]
  const updatedArtifact = updatedStore.artifacts[updatedIndex]

  if (
    previousArtifact.content === content ||
    previousArtifact.id !== updatedArtifact.id ||
    previousArtifact.createdAt !== updatedArtifact.createdAt ||
    !hasExpectedTargetArtifact(
      updatedArtifact,
      type,
      references,
      content
    )
  ) {
    return false
  }

  return previousStore.artifacts.every((artifact, index) =>
    index === previousIndex ||
    areArtifactsEqual(artifact, updatedStore.artifacts[index])
  )
}

function isArtifactClearResultConsistent(
  status,
  previousStore,
  updatedStore,
  type,
  references
) {
  const previousIndex = getArtifactIndex(
    previousStore,
    type,
    references
  )
  const updatedIndex = getArtifactIndex(
    updatedStore,
    type,
    references
  )

  if (status === 'artifactAlreadyEmpty') {
    if (updatedIndex !== -1) return false

    if (previousIndex === -1) {
      return areArtifactStoresEqual(previousStore, updatedStore)
    }

    return isExactArtifactRemoval(
      previousStore,
      updatedStore,
      previousIndex
    )
  }

  if (
    status !== 'artifactCleared' ||
    previousIndex === -1 ||
    updatedIndex !== -1
  ) {
    return false
  }

  return isExactArtifactRemoval(
    previousStore,
    updatedStore,
    previousIndex
  )
}

function isExactArtifactRemoval(
  previousStore,
  updatedStore,
  removedIndex
) {
  if (
    updatedStore.artifacts.length !== previousStore.artifacts.length - 1 ||
    previousStore.schemaVersion !== updatedStore.schemaVersion ||
    previousStore.dataOrigin !== updatedStore.dataOrigin
  ) {
    return false
  }

  const expectedArtifacts = previousStore.artifacts.filter(
    (_, index) => index !== removedIndex
  )

  return expectedArtifacts.every((artifact, index) =>
    areArtifactsEqual(artifact, updatedStore.artifacts[index])
  )
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
  learningArtifactService,
  learningHubView,
  scheduleTask = scheduleAfterPaint,
} = {}) {
  let isActive = false
  let cancelScheduledLoad = null
  let viewState = createInitialState()
  let artifactState = createInitialArtifactState()
  let artifactStoreSnapshot = null
  let artifactTargetSnapshot = null
  let resumeArtifactEditingAfterClear = false

  const actions = Object.freeze({
    onRetryLoad: retryHubLoad,
    onRetryProgressLoad: retryProgressLoad,
    onRetryArtifactLoad: retryArtifactLoad,
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
    onOpenArtifactEditor: openArtifactEditor,
    onUpdateArtifactDraft: updateArtifactDraft,
    onSaveArtifact: saveArtifact,
    onCancelArtifactEditor: cancelArtifactEditor,
    onOpenArtifactClearConfirmation:
      openArtifactClearConfirmation,
    onCancelArtifactClearConfirmation:
      cancelArtifactClearConfirmation,
    onConfirmArtifactClear: confirmArtifactClear,
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
        artifacts: createArtifactViewModel(
          viewState,
          artifactState,
          artifactStoreSnapshot
        ),
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

  function finishArtifactLoading() {
    let result

    try {
      result = learningArtifactService?.loadArtifacts?.()
    } catch {
      result = null
    }

    let artifactStore = null
    let resultStatus = null

    try {
      resultStatus = result?.status

      if (
        hasArtifactResultShape(result) &&
        result?.ok === true &&
        ['empty', 'loaded'].includes(resultStatus) &&
        result.changed === false
      ) {
        artifactStore = readValidatedArtifactStore(result, viewState.hub)
      }
    } catch {
      artifactStore = null
      resultStatus = null
    }

    const hasConsistentEmptyStatus =
      resultStatus !== 'empty' ||
      artifactStore?.artifacts.length === 0

    if (artifactStore && hasConsistentEmptyStatus) {
      artifactStoreSnapshot = artifactStore
      artifactTargetSnapshot = null
      resumeArtifactEditingAfterClear = false
      artifactState = {
        ...createInitialArtifactState(),
        phase: 'ready',
      }
      return true
    }

    artifactStoreSnapshot = null
    artifactTargetSnapshot = null
    resumeArtifactEditingAfterClear = false
    let errorMessage = ARTIFACT_LOAD_ERROR_MESSAGE

    try {
      errorMessage = getArtifactLoadErrorMessage(result)
    } catch {
      errorMessage = ARTIFACT_LOAD_ERROR_MESSAGE
    }

    artifactState = {
      ...createInitialArtifactState(),
      phase: 'unavailable',
      errorMessage,
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
      artifactStoreSnapshot = null
      artifactTargetSnapshot = null
      artifactState = createInitialArtifactState()
      resumeArtifactEditingAfterClear = false
      render()
      finishProgressLoading('unavailable')
      render()
      finishArtifactLoading()
      render({ type: 'heading' })
      return
    }

    artifactStoreSnapshot = null
    artifactTargetSnapshot = null
    resumeArtifactEditingAfterClear = false
    artifactState = {
      ...createInitialArtifactState(),
      phase: 'unavailable',
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
    artifactStoreSnapshot = null
    artifactTargetSnapshot = null
    artifactState = createInitialArtifactState()
    resumeArtifactEditingAfterClear = false
    render()
    cancelScheduledLoad = scheduleTask(finishLoading)
  }

  function retryHubLoad() {
    if (!isActive || viewState.phase !== 'loadError') return

    loadHub()
  }

  function getPersistedArtifactContent(type) {
    const references = getArtifactTargetReferences(
      artifactTargetSnapshot
    )
    return getArtifactContent(
      artifactStoreSnapshot,
      type,
      references
    ) ?? ''
  }

  function hasCurrentArtifactTarget(type) {
    return doesArtifactTargetMatchSelection(
      artifactTargetSnapshot,
      type,
      getSelectedLearningNodeReferences(viewState)
    )
  }

  function isArtifactEditorDirty() {
    if (
      artifactState.phase === 'ready' &&
      artifactState.mode === 'editing' &&
      isArtifactType(artifactState.activeType)
    ) {
      return (
        !hasCurrentArtifactTarget(artifactState.activeType) ||
        artifactState.draft.trim() !==
          getPersistedArtifactContent(artifactState.activeType)
      )
    }

    return false
  }

  function resetArtifactInteraction() {
    artifactTargetSnapshot = null
    resumeArtifactEditingAfterClear = false
    artifactState = {
      ...artifactState,
      activeType: null,
      mode: 'view',
      draft: '',
      fieldError: '',
      errorMessage: artifactState.phase === 'unavailable'
        ? artifactState.errorMessage
        : '',
      statusMessage: '',
      feedbackType: null,
      mutatingType: null,
    }
  }

  function rejectArtifactTargetMismatch(type) {
    const feedbackType = isArtifactType(type)
      ? type
      : artifactState.activeType

    resetArtifactInteraction()
    artifactState = {
      ...artifactState,
      errorMessage: ARTIFACT_RESULT_ERROR_MESSAGE,
      feedbackType,
    }
    render({
      type: 'artifactAlert',
      artifactType: feedbackType,
    })
  }

  function blockDirtyArtifactTransition() {
    if (!isArtifactEditorDirty()) return false

    artifactState = {
      ...artifactState,
      fieldError: '',
      errorMessage: ARTIFACT_DIRTY_BLOCK_MESSAGE,
      statusMessage: '',
      feedbackType: artifactState.activeType,
    }
    render({
      type: 'artifactField',
      artifactType: artifactState.activeType,
    })
    return true
  }

  function canUseReadyView() {
    return (
      isActive &&
      ['empty', 'ready'].includes(viewState.phase) &&
      !viewState.form?.isSubmitting &&
      viewState.progress.phase !== 'mutating' &&
      artifactState.phase !== 'mutating' &&
      artifactState.mode !== 'confirmClear'
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

  function retryArtifactLoad() {
    if (
      !canUseReadyView() ||
      viewState.form !== null ||
      artifactState.phase !== 'unavailable'
    ) {
      return
    }

    artifactTargetSnapshot = null
    artifactState = createInitialArtifactState()
    render()
    finishArtifactLoading()
    render(
      artifactState.phase === 'ready'
        ? { type: 'artifactHeading' }
        : { type: 'artifactLoadAlert' }
    )
  }

  function selectModule(moduleId) {
    if (!canUseReadyView()) return

    const learningModule = getModule(viewState.hub, moduleId)
    if (!learningModule) return
    if (moduleId === viewState.selectedModuleId) return
    if (blockDirtyArtifactTransition()) return

    resetArtifactInteraction()
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
    if (blockDirtyArtifactTransition()) return

    resetArtifactInteraction()
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
    const willHideSelectedLearningNode =
      isExpanded && selectedLocation?.chapter.id === chapterId

    if (
      willHideSelectedLearningNode &&
      blockDirtyArtifactTransition()
    ) {
      return
    }

    if (willHideSelectedLearningNode) {
      resetArtifactInteraction()
    }

    viewState = {
      ...viewState,
      expandedChapterIds,
      selectedLearningNodeId:
        willHideSelectedLearningNode
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
    if (learningNodeId === viewState.selectedLearningNodeId) return
    if (blockDirtyArtifactTransition()) return

    resetArtifactInteraction()
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

  function setForm(form, focusTarget, stateUpdates = {}) {
    if (!canUseReadyView()) return
    if (blockDirtyArtifactTransition()) return

    resetArtifactInteraction()
    viewState = {
      ...viewState,
      ...stateUpdates,
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
    setForm(
      createFormState(FORM_TYPES.ADD_LEARNING_NODE, {
        moduleId,
        chapterId,
      }),
      { type: 'formField', fieldName: 'title' },
      {
        expandedChapterIds: [
          ...new Set([...viewState.expandedChapterIds, chapterId]),
        ],
      }
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
    setForm(
      createFormState(
        FORM_TYPES.UPDATE_LEARNING_NODE,
        { moduleId, chapterId, learningNodeId },
        { title: learningNode.title, content: learningNode.content }
      ),
      { type: 'formField', fieldName: 'title' },
      {
        expandedChapterIds: [
          ...new Set([...viewState.expandedChapterIds, chapterId]),
        ],
        selectedLearningNodeId: learningNodeId,
      }
    )
  }

  function canUseArtifactEditor() {
    return (
      canUseReadyView() &&
      viewState.form === null &&
      artifactState.phase === 'ready' &&
      artifactStoreSnapshot !== null &&
      getSelectedLearningNodeReferences(viewState) !== null
    )
  }

  function openArtifactEditor(type) {
    if (!isArtifactType(type) || !canUseArtifactEditor()) return

    if (
      artifactState.mode === 'editing' &&
      !hasCurrentArtifactTarget(artifactState.activeType)
    ) {
      rejectArtifactTargetMismatch(artifactState.activeType)
      return
    }

    if (
      artifactState.mode === 'editing' &&
      artifactState.activeType === type
    ) {
      render({ type: 'artifactField', artifactType: type })
      return
    }

    if (blockDirtyArtifactTransition()) return

    const references = getSelectedLearningNodeReferences(viewState)
    const targetSnapshot = createArtifactTargetSnapshot(
      type,
      references
    )
    if (targetSnapshot === null) return

    resetArtifactInteraction()
    artifactTargetSnapshot = targetSnapshot
    artifactState = {
      ...artifactState,
      activeType: type,
      mode: 'editing',
      draft: getArtifactContent(
        artifactStoreSnapshot,
        type,
        references
      ) ?? '',
    }
    render({ type: 'artifactField', artifactType: type })
  }

  function updateArtifactDraft(type, value) {
    if (
      !isArtifactType(type) ||
      typeof value !== 'string' ||
      artifactState.phase !== 'ready' ||
      artifactState.mode !== 'editing' ||
      artifactState.activeType !== type
    ) {
      return
    }

    if (!hasCurrentArtifactTarget(type)) {
      rejectArtifactTargetMismatch(type)
      return
    }

    const shouldRender = Boolean(
      artifactState.fieldError ||
      artifactState.errorMessage ||
      artifactState.statusMessage
    )
    artifactState = {
      ...artifactState,
      draft: value,
      fieldError: '',
      errorMessage: '',
      statusMessage: '',
      feedbackType: null,
    }

    if (shouldRender) {
      render({ type: 'artifactField', artifactType: type })
    }
  }

  function getArtifactFailureFeedback(result, malformedSuccess) {
    if (malformedSuccess) {
      return {
        fieldError: '',
        errorMessage: ARTIFACT_RESULT_ERROR_MESSAGE,
      }
    }

    try {
      const hasFieldError = hasArtifactContentFieldError(result)

      return {
        fieldError: hasFieldError
          ? 'Bitte gib einen Text mit höchstens 10.000 Zeichen ein.'
          : '',
        errorMessage: hasFieldError
          ? 'Bitte korrigiere den Artefakttext.'
          : getArtifactMutationErrorMessage(result),
      }
    } catch {
      return {
        fieldError: '',
        errorMessage: ARTIFACT_MUTATION_ERROR_MESSAGE,
      }
    }
  }

  function saveArtifact(submission) {
    const targetSnapshotAtEntry = artifactTargetSnapshot
    const interactionType = artifactState.activeType
    const references = getArtifactTargetReferences(
      targetSnapshotAtEntry
    )
    const selectedReferencesAtEntry =
      getSelectedLearningNodeReferences(viewState)
    const targetMatchedSelectionAtEntry =
      doesArtifactTargetMatchSelection(
        targetSnapshotAtEntry,
        interactionType,
        selectedReferencesAtEntry
      )

    if (
      artifactState.phase !== 'ready' ||
      artifactState.mode !== 'editing' ||
      !isArtifactType(interactionType)
    ) {
      return
    }

    if (
      references === null ||
      !targetMatchedSelectionAtEntry ||
      artifactTargetSnapshot !== targetSnapshotAtEntry
    ) {
      rejectArtifactTargetMismatch(interactionType)
      return
    }

    function isOriginalArtifactInteractionCurrent(
      submittedType = interactionType
    ) {
      const currentReferences =
        getSelectedLearningNodeReferences(viewState)
      const targetMatchesSelection =
        doesArtifactTargetMatchSelection(
          targetSnapshotAtEntry,
          interactionType,
          currentReferences
        )

      return (
        targetMatchesSelection &&
        artifactTargetSnapshot === targetSnapshotAtEntry &&
        artifactState.phase === 'ready' &&
        artifactState.mode === 'editing' &&
        artifactState.activeType === interactionType &&
        submittedType === interactionType
      )
    }

    const canUseEditor = canUseArtifactEditor()

    if (!isOriginalArtifactInteractionCurrent()) {
      rejectArtifactTargetMismatch(interactionType)
      return
    }

    if (!canUseEditor) return

    let isSubmissionPlain = false

    try {
      isSubmissionPlain = isPlainDataObject(submission)
    } catch {
      isSubmissionPlain = false
    }

    if (!isOriginalArtifactInteractionCurrent()) {
      rejectArtifactTargetMismatch(interactionType)
      return
    }

    if (!isSubmissionPlain) return

    let type

    try {
      type = submission.type
    } catch {
      if (!isOriginalArtifactInteractionCurrent()) {
        rejectArtifactTargetMismatch(interactionType)
      }
      return
    }

    if (!isOriginalArtifactInteractionCurrent(type)) {
      rejectArtifactTargetMismatch(interactionType)
      return
    }

    if (!isArtifactType(type)) return

    let content

    try {
      content = submission.content
    } catch {
      if (!isOriginalArtifactInteractionCurrent(type)) {
        rejectArtifactTargetMismatch(interactionType)
      }
      return
    }

    if (!isOriginalArtifactInteractionCurrent(type)) {
      rejectArtifactTargetMismatch(interactionType)
      return
    }

    if (typeof content !== 'string') return

    let normalizedContent

    try {
      normalizedContent = content.trim()
    } catch {
      if (!isOriginalArtifactInteractionCurrent(type)) {
        rejectArtifactTargetMismatch(interactionType)
      }
      return
    }

    if (!isOriginalArtifactInteractionCurrent(type)) {
      rejectArtifactTargetMismatch(interactionType)
      return
    }

    artifactState = {
      ...artifactState,
      draft: content,
      fieldError: '',
      errorMessage: '',
      statusMessage: '',
      feedbackType: type,
    }

    if (
      normalizedContent.length === 0 ||
      normalizedContent.length > LEARNING_ARTIFACT_CONTENT_MAX_LENGTH
    ) {
      artifactState = {
        ...artifactState,
        fieldError:
          normalizedContent.length === 0
            ? 'Bitte gib einen Text ein.'
            : 'Bitte gib einen Text mit höchstens 10.000 Zeichen ein.',
        errorMessage: 'Bitte korrigiere den Artefakttext.',
      }
      render({ type: 'artifactField', artifactType: type })
      return
    }

    const previousStore = cloneArtifactStore(artifactStoreSnapshot)
    artifactState = {
      ...artifactState,
      phase: 'mutating',
      mutatingType: type,
    }
    render()

    let result = null
    let updatedStore = null
    let isValidSuccess = false
    let malformedSuccess = false

    try {
      result = learningArtifactService?.[
        ARTIFACT_SAVE_METHODS[type]
      ]?.({
        ...references,
        content,
      })

      if (result?.ok === true) {
        malformedSuccess = true
        if (hasArtifactResultShape(result)) {
          const expectedChanged =
            ARTIFACT_SAVE_SUCCESS_RESULTS[result.status]
          updatedStore = readValidatedArtifactStore(result, viewState.hub)
          isValidSuccess = (
            Object.hasOwn(
              ARTIFACT_SAVE_SUCCESS_RESULTS,
              result.status
            ) &&
            result.changed === expectedChanged &&
            updatedStore !== null &&
            isArtifactSaveResultConsistent(
              result.status,
              previousStore,
              updatedStore,
              type,
              references,
              normalizedContent
            )
          )
        }
        malformedSuccess = !isValidSuccess
      }
    } catch {
      result = null
      updatedStore = null
      isValidSuccess = false
      malformedSuccess = false
    }

    if (isValidSuccess) {
      artifactStoreSnapshot = updatedStore
      artifactTargetSnapshot = null
      artifactState = {
        ...createInitialArtifactState(),
        phase: 'ready',
        statusMessage: result.status === 'artifactCreated'
          ? ARTIFACT_LABELS[type] + ' wurde lokal erstellt.'
          : result.status === 'artifactUpdated'
            ? ARTIFACT_LABELS[type] + ' wurde lokal aktualisiert.'
            : ARTIFACT_LABELS[type] + ' ist bereits aktuell.',
        feedbackType: type,
      }
      render({ type: 'artifactTrigger', artifactType: type })
      return
    }

    const feedback = getArtifactFailureFeedback(
      result,
      malformedSuccess
    )
    artifactState = {
      ...artifactState,
      phase: 'ready',
      mode: 'editing',
      activeType: type,
      draft: content,
      fieldError: feedback.fieldError,
      errorMessage: feedback.errorMessage,
      statusMessage: '',
      feedbackType: type,
      mutatingType: null,
    }
    render({
      type: feedback.fieldError ? 'artifactField' : 'artifactAlert',
      artifactType: type,
    })
  }

  function cancelArtifactEditor(type) {
    if (
      !isArtifactType(type) ||
      artifactState.phase !== 'ready' ||
      artifactState.mode !== 'editing' ||
      artifactState.activeType !== type
    ) {
      return
    }

    resetArtifactInteraction()
    render({ type: 'artifactTrigger', artifactType: type })
  }

  function canResolveArtifactClear(type) {
    return (
      isActive &&
      isArtifactType(type) &&
      ['empty', 'ready'].includes(viewState.phase) &&
      viewState.form === null &&
      viewState.progress.phase !== 'mutating' &&
      artifactState.phase === 'ready' &&
      artifactStoreSnapshot !== null &&
      getSelectedLearningNodeReferences(viewState) !== null
    )
  }

  function openArtifactClearConfirmation(type) {
    if (!canResolveArtifactClear(type)) return

    if (artifactState.mode === 'confirmClear') {
      if (
        artifactState.activeType !== type ||
        !hasCurrentArtifactTarget(type)
      ) {
        rejectArtifactTargetMismatch(artifactState.activeType)
        return
      }

      render({
        type: 'artifactConfirmation',
        artifactType: type,
      })
      return
    }

    const references = getSelectedLearningNodeReferences(viewState)
    const targetSnapshot = createArtifactTargetSnapshot(
      type,
      references
    )
    if (targetSnapshot === null) return

    if (artifactState.mode === 'editing') {
      if (!hasCurrentArtifactTarget(artifactState.activeType)) {
        rejectArtifactTargetMismatch(artifactState.activeType)
        return
      }

      if (
        artifactState.activeType !== type &&
        blockDirtyArtifactTransition()
      ) {
        return
      }
    }

    if (getArtifactContent(artifactStoreSnapshot, type, references) === null) {
      return
    }

    const shouldResumeArtifactEditing = (
      artifactState.mode === 'editing' &&
      artifactState.activeType === type
    )
    const preservedDraft = shouldResumeArtifactEditing
      ? artifactState.draft
      : ''

    if (!shouldResumeArtifactEditing) {
      resetArtifactInteraction()
    }

    artifactTargetSnapshot = targetSnapshot
    resumeArtifactEditingAfterClear = shouldResumeArtifactEditing
    artifactState = {
      ...artifactState,
      activeType: type,
      mode: 'confirmClear',
      draft: preservedDraft,
      fieldError: '',
      errorMessage: '',
      statusMessage: '',
      feedbackType: type,
      mutatingType: null,
    }
    render({
      type: 'artifactConfirmation',
      artifactType: type,
    })
  }

  function cancelArtifactClearConfirmation(type) {
    if (
      !isArtifactType(type) ||
      artifactState.phase !== 'ready' ||
      artifactState.mode !== 'confirmClear'
    ) {
      return
    }

    if (
      artifactState.activeType !== type ||
      !canResolveArtifactClear(type) ||
      !hasCurrentArtifactTarget(type)
    ) {
      rejectArtifactTargetMismatch(artifactState.activeType)
      return
    }

    if (resumeArtifactEditingAfterClear) {
      resumeArtifactEditingAfterClear = false
      artifactState = {
        ...artifactState,
        mode: 'editing',
        fieldError: '',
        errorMessage: '',
        statusMessage: '',
        feedbackType: null,
      }
      render({ type: 'artifactClearTrigger', artifactType: type })
      return
    }

    resetArtifactInteraction()
    render({ type: 'artifactClearTrigger', artifactType: type })
  }

  function confirmArtifactClear(type) {
    if (
      !isArtifactType(type) ||
      artifactState.phase !== 'ready' ||
      artifactState.mode !== 'confirmClear'
    ) {
      return
    }

    if (
      artifactState.activeType !== type ||
      !canResolveArtifactClear(type) ||
      !hasCurrentArtifactTarget(type)
    ) {
      rejectArtifactTargetMismatch(artifactState.activeType)
      return
    }

    const references = getArtifactTargetReferences(
      artifactTargetSnapshot
    )
    const previousStore = cloneArtifactStore(artifactStoreSnapshot)
    artifactState = {
      ...artifactState,
      phase: 'mutating',
      errorMessage: '',
      statusMessage: '',
      mutatingType: type,
    }
    render()

    let result = null
    let updatedStore = null
    let isValidSuccess = false
    let malformedSuccess = false

    try {
      result = learningArtifactService?.[
        ARTIFACT_CLEAR_METHODS[type]
      ]?.({ ...references })

      if (result?.ok === true) {
        malformedSuccess = true
        if (hasArtifactResultShape(result)) {
          const expectedChanged =
            ARTIFACT_CLEAR_SUCCESS_RESULTS[result.status]
          updatedStore = readValidatedArtifactStore(result, viewState.hub)
          isValidSuccess = (
            Object.hasOwn(
              ARTIFACT_CLEAR_SUCCESS_RESULTS,
              result.status
            ) &&
            result.changed === expectedChanged &&
            updatedStore !== null &&
            isArtifactClearResultConsistent(
              result.status,
              previousStore,
              updatedStore,
              type,
              references
            )
          )
        }
        malformedSuccess = !isValidSuccess
      }
    } catch {
      result = null
      updatedStore = null
      isValidSuccess = false
      malformedSuccess = false
    }

    if (isValidSuccess) {
      artifactStoreSnapshot = updatedStore
      artifactTargetSnapshot = null
      resumeArtifactEditingAfterClear = false
      artifactState = {
        ...createInitialArtifactState(),
        phase: 'ready',
        statusMessage: result.status === 'artifactCleared'
          ? ARTIFACT_LABELS[type] + ' wurde lokal geleert.'
          : ARTIFACT_LABELS[type] + ' war bereits leer.',
        feedbackType: type,
      }
      render({ type: 'artifactTrigger', artifactType: type })
      return
    }

    const feedback = getArtifactFailureFeedback(
      result,
      malformedSuccess
    )
    artifactState = {
      ...artifactState,
      phase: 'ready',
      mode: 'confirmClear',
      activeType: type,
      fieldError: '',
      errorMessage: feedback.errorMessage,
      statusMessage: '',
      feedbackType: type,
      mutatingType: null,
    }
    render({ type: 'artifactAlert', artifactType: type })
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
      artifactStoreSnapshot &&
      !isArtifactStoreForHub(artifactStoreSnapshot, result.hub)
    ) {
      artifactStoreSnapshot = null
      artifactTargetSnapshot = null
      resumeArtifactEditingAfterClear = false
      artifactState = {
        ...createInitialArtifactState(),
        phase: 'unavailable',
        errorMessage: ARTIFACT_LOAD_ERROR_MESSAGE,
      }
    }

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
    if (
      isActive &&
      (
        artifactState.phase === 'mutating' ||
        artifactState.mode === 'confirmClear'
      )
    ) {
      render({
        type: artifactState.mode === 'confirmClear'
          ? 'artifactConfirmation'
          : 'artifactAlert',
        artifactType: artifactState.activeType,
      })
      return false
    }

    if (isActive && blockDirtyArtifactTransition()) {
      return false
    }

    isActive = false
    cancelPendingLoad()
    viewState = createInitialState()
    artifactState = createInitialArtifactState()
    artifactStoreSnapshot = null
    artifactTargetSnapshot = null
    resumeArtifactEditingAfterClear = false
    learningHubView?.unmount?.()
    return true
  }

  return Object.freeze({ open, close })
}
