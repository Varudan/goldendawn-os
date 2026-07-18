import { validateLearningHub } from '../modules/learning-hub/learningHubContract.js'
import {
  LEARNING_PROGRESS_EVENT_TYPES,
  validateLearningProgress,
} from '../modules/learning-hub/learningProgressContract.js'
import {
  projectLearningProgress,
} from '../modules/learning-hub/learningProgressProjection.js'

const PRIVATE_DATA_ORIGIN = 'private'
const MAX_ID_GENERATION_ATTEMPTS = 5
const LEARNING_PROGRESS_EVENT_ID_PREFIX = 'learning-progress-event'
const CANONICAL_UTC_TIMESTAMP_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

function isObjectRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function isTrimmedNonEmptyString(value) {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value === value.trim()
  )
}

function isCanonicalUtcTimestamp(value) {
  if (
    typeof value !== 'string' ||
    !CANONICAL_UTC_TIMESTAMP_PATTERN.test(value)
  ) {
    return false
  }

  const timestamp = new Date(value)

  return (
    !Number.isNaN(timestamp.getTime()) &&
    timestamp.toISOString() === value
  )
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

function cloneProgressEvent(progressEvent) {
  return { ...progressEvent }
}

function cloneProgressLog(progressLog) {
  return {
    ...progressLog,
    events: progressLog.events.map(cloneProgressEvent),
  }
}

function cloneProjection(projection) {
  return projection.map((moduleProgress) => ({
    ...moduleProgress,
    chapters: moduleProgress.chapters.map((chapterProgress) => ({
      ...chapterProgress,
    })),
  }))
}

function createFailure(
  status,
  code,
  message,
  { progressLog = null, projection = null } = {}
) {
  return {
    ok: false,
    status,
    changed: false,
    progressLog: progressLog ? cloneProgressLog(progressLog) : null,
    projection: projection ? cloneProjection(projection) : null,
    error: {
      code,
      message,
    },
  }
}

function createInputFailure(fieldErrors, currentState) {
  return {
    ok: false,
    status: 'validationFailed',
    changed: false,
    progressLog: cloneProgressLog(currentState.progressLog),
    projection: cloneProjection(currentState.projection),
    error: {
      code: 'invalidLearningProgressInput',
      message: 'Bitte korrigiere die markierten Referenzen.',
      fieldErrors: { ...fieldErrors },
    },
  }
}

function createSuccess(status, changed, progressLog, projection) {
  return {
    ok: true,
    status,
    changed,
    progressLog: cloneProgressLog(progressLog),
    projection: cloneProjection(projection),
  }
}

function forwardDependencyFailure(
  dependencyResult,
  fallbackStatus,
  fallbackCode,
  fallbackMessage,
  currentState
) {
  if (
    dependencyResult?.ok === false &&
    isNonEmptyString(dependencyResult.status) &&
    isNonEmptyString(dependencyResult.error?.code) &&
    isNonEmptyString(dependencyResult.error?.message)
  ) {
    return createFailure(
      dependencyResult.status,
      dependencyResult.error.code,
      dependencyResult.error.message,
      currentState
    )
  }

  return createFailure(
    fallbackStatus,
    fallbackCode,
    fallbackMessage,
    currentState
  )
}

function validateHubState(learningHub) {
  let validationResult

  try {
    validationResult = validateLearningHub(learningHub)
  } catch {
    return { ok: false }
  }

  return {
    ok:
      validationResult.ok &&
      learningHub.dataOrigin === PRIVATE_DATA_ORIGIN,
  }
}

function validateProgressState(progressLog) {
  let validationResult

  try {
    validationResult = validateLearningProgress(progressLog)
  } catch {
    return { ok: false }
  }

  return {
    ok:
      validationResult.ok &&
      progressLog.dataOrigin === PRIVATE_DATA_ORIGIN,
  }
}

function buildReferenceIndex(learningHub) {
  const modulesById = new Map()
  const chaptersById = new Map()

  learningHub.modules.forEach((learningModule) => {
    modulesById.set(learningModule.id, learningModule)

    learningModule.chapters.forEach((chapter) => {
      chaptersById.set(chapter.id, {
        chapter,
        moduleId: learningModule.id,
      })
    })
  })

  return { modulesById, chaptersById }
}

function validateStoredReferences(progressLog, referenceIndex) {
  for (const progressEvent of progressLog.events) {
    if (!referenceIndex.modulesById.has(progressEvent.moduleId)) {
      return {
        ok: false,
        code: 'orphanedProgressModuleReference',
        message:
          'Ein gespeichertes Fortschrittsereignis verweist auf kein vorhandenes LearningModule.',
      }
    }

    const chapterReference = referenceIndex.chaptersById.get(
      progressEvent.chapterId
    )

    if (!chapterReference) {
      return {
        ok: false,
        code: 'orphanedProgressChapterReference',
        message:
          'Ein gespeichertes Fortschrittsereignis verweist auf kein vorhandenes LearningChapter.',
      }
    }

    if (chapterReference.moduleId !== progressEvent.moduleId) {
      return {
        ok: false,
        code: 'progressChapterModuleMismatch',
        message:
          'Ein gespeichertes Fortschrittsereignis besitzt eine ungültige Modul-Kapitel-Zuordnung.',
      }
    }
  }

  return { ok: true }
}

function createProjectionResult(learningHub, progressLog) {
  let projection

  try {
    projection = projectLearningProgress(learningHub, progressLog)
  } catch {
    return { ok: false }
  }

  if (!Array.isArray(projection)) {
    return { ok: false }
  }

  return { ok: true, projection }
}

function validateTargetId(value, fieldName, fieldErrors) {
  if (!isTrimmedNonEmptyString(value)) {
    fieldErrors[fieldName] =
      'Die ID muss eine nicht leere, getrimmte Zeichenfolge sein.'
    return ''
  }

  return value
}

function validateMutationInput(input) {
  const progressInput = isObjectRecord(input) ? input : {}
  const fieldErrors = {}

  return {
    values: {
      moduleId: validateTargetId(
        progressInput.moduleId,
        'moduleId',
        fieldErrors
      ),
      chapterId: validateTargetId(
        progressInput.chapterId,
        'chapterId',
        fieldErrors
      ),
    },
    fieldErrors,
  }
}

function getTargetReference(referenceIndex, moduleId, chapterId) {
  if (!referenceIndex.modulesById.has(moduleId)) {
    return {
      ok: false,
      status: 'notFound',
      code: 'moduleNotFound',
      message: 'Das angeforderte LearningModule wurde nicht gefunden.',
    }
  }

  const chapterReference = referenceIndex.chaptersById.get(chapterId)

  if (!chapterReference) {
    return {
      ok: false,
      status: 'notFound',
      code: 'chapterNotFound',
      message: 'Das angeforderte LearningChapter wurde nicht gefunden.',
    }
  }

  if (chapterReference.moduleId !== moduleId) {
    return {
      ok: false,
      status: 'ownershipMismatch',
      code: 'chapterModuleMismatch',
      message:
        'Das LearningChapter gehört nicht zum angegebenen LearningModule.',
    }
  }

  return { ok: true }
}

function isChapterCompleted(progressLog, moduleId, chapterId) {
  let isCompleted = false

  progressLog.events.forEach((progressEvent) => {
    if (
      progressEvent.moduleId === moduleId &&
      progressEvent.chapterId === chapterId
    ) {
      isCompleted =
        progressEvent.type ===
        LEARNING_PROGRESS_EVENT_TYPES.CHAPTER_COMPLETED
    }
  })

  return isCompleted
}

function generateUniqueEventId(generateLearningProgressEventId, progressLog) {
  const existingEventIds = new Set(
    progressLog.events.map((progressEvent) => progressEvent.id)
  )

  for (
    let attempt = 0;
    attempt < MAX_ID_GENERATION_ATTEMPTS;
    attempt += 1
  ) {
    let generatedId

    try {
      generatedId = generateLearningProgressEventId()
    } catch {
      continue
    }

    if (
      isTrimmedNonEmptyString(generatedId) &&
      !existingEventIds.has(generatedId)
    ) {
      return generatedId
    }
  }

  return null
}

function generateDefaultLearningProgressEventId() {
  if (typeof globalThis.crypto?.randomUUID !== 'function') {
    throw new Error('randomUUID unavailable')
  }

  return `${LEARNING_PROGRESS_EVENT_ID_PREFIX}-${globalThis.crypto.randomUUID()}`
}

function getDefaultNow() {
  return new Date().toISOString()
}

export function createLearningProgressService({
  learningProgressStorage,
  learningHubService,
  generateLearningProgressEventId = generateDefaultLearningProgressEventId,
  now = getDefaultNow,
} = {}) {
  function readHubState() {
    if (typeof learningHubService?.loadHub !== 'function') {
      return createFailure(
        'unavailable',
        'learningHubServiceUnavailable',
        'Der LearningHub-Service ist nicht verfügbar.'
      )
    }

    let loadResult

    try {
      loadResult = learningHubService.loadHub()
    } catch {
      return createFailure(
        'readFailed',
        'learningHubServiceReadFailed',
        'Der aktuelle LearningHub konnte nicht gelesen werden.'
      )
    }

    if (loadResult?.ok === false) {
      return forwardDependencyFailure(
        loadResult,
        'readFailed',
        'learningHubServiceReadFailed',
        'Der aktuelle LearningHub konnte nicht gelesen werden.'
      )
    }

    if (
      loadResult?.ok !== true ||
      !['empty', 'loaded'].includes(loadResult.status) ||
      !isObjectRecord(loadResult.hub)
    ) {
      return createFailure(
        'serviceFailed',
        'unexpectedLearningHubResult',
        'Der LearningHub-Service hat kein verwertbares Ergebnis geliefert.'
      )
    }

    if (!validateHubState(loadResult.hub).ok) {
      return createFailure(
        'invalidStoredData',
        'invalidStoredLearningHub',
        'Der aktuelle LearningHub entspricht nicht dem gültigen privaten Inhaltsvertrag.'
      )
    }

    return {
      ok: true,
      hub: cloneHub(loadResult.hub),
    }
  }

  function readProgressState() {
    if (
      typeof learningProgressStorage?.loadLearningProgress !== 'function'
    ) {
      return createFailure(
        'unavailable',
        'learningProgressStorageUnavailable',
        'Der LearningProgress-Speicher ist nicht verfügbar.'
      )
    }

    let loadResult

    try {
      loadResult = learningProgressStorage.loadLearningProgress()
    } catch {
      return createFailure(
        'readFailed',
        'learningProgressStorageReadFailed',
        'Die LearningProgress-Daten konnten nicht gelesen werden.'
      )
    }

    if (loadResult?.ok === false) {
      return forwardDependencyFailure(
        loadResult,
        'readFailed',
        'learningProgressStorageReadFailed',
        'Die LearningProgress-Daten konnten nicht gelesen werden.'
      )
    }

    if (
      loadResult?.ok !== true ||
      !['missing', 'found'].includes(loadResult.status) ||
      !isObjectRecord(loadResult.progressLog)
    ) {
      return createFailure(
        'storageFailed',
        'unexpectedStorageResult',
        'Die LearningProgress-Daten konnten nicht verarbeitet werden.'
      )
    }

    if (!validateProgressState(loadResult.progressLog).ok) {
      return createFailure(
        'invalidStoredData',
        'invalidStoredLearningProgress',
        'Die gespeicherten LearningProgress-Daten sind ungültig.'
      )
    }

    return {
      ok: true,
      storageStatus: loadResult.status,
      progressLog: cloneProgressLog(loadResult.progressLog),
    }
  }

  function readCurrentState() {
    const hubResult = readHubState()

    if (!hubResult.ok) {
      return hubResult
    }

    const progressResult = readProgressState()

    if (!progressResult.ok) {
      return progressResult
    }

    const referenceIndex = buildReferenceIndex(hubResult.hub)
    const referenceValidation = validateStoredReferences(
      progressResult.progressLog,
      referenceIndex
    )

    if (!referenceValidation.ok) {
      return createFailure(
        'invalidStoredData',
        referenceValidation.code,
        referenceValidation.message,
        { progressLog: progressResult.progressLog }
      )
    }

    const projectionResult = createProjectionResult(
      hubResult.hub,
      progressResult.progressLog
    )

    if (!projectionResult.ok) {
      return createFailure(
        'projectionFailed',
        'learningProgressProjectionFailed',
        'Der aktuelle LearningProgress-Zustand konnte nicht abgeleitet werden.',
        { progressLog: progressResult.progressLog }
      )
    }

    return {
      ok: true,
      hub: hubResult.hub,
      progressLog: progressResult.progressLog,
      projection: projectionResult.projection,
      referenceIndex,
      storageStatus: progressResult.storageStatus,
    }
  }

  function persistProgress(previousState, updatedProgressLog) {
    if (
      typeof learningProgressStorage?.saveLearningProgress !== 'function'
    ) {
      return createFailure(
        'unavailable',
        'learningProgressStorageUnavailable',
        'Der LearningProgress-Speicher ist nicht verfügbar.',
        previousState
      )
    }

    let saveResult

    try {
      saveResult = learningProgressStorage.saveLearningProgress(
        cloneProgressLog(updatedProgressLog)
      )
    } catch {
      return createFailure(
        'writeFailed',
        'learningProgressStorageWriteFailed',
        'Die LearningProgress-Änderung konnte nicht gespeichert werden.',
        previousState
      )
    }

    if (saveResult?.ok === false) {
      return forwardDependencyFailure(
        saveResult,
        'writeFailed',
        'learningProgressStorageWriteFailed',
        'Die LearningProgress-Änderung konnte nicht gespeichert werden.',
        previousState
      )
    }

    if (saveResult?.ok !== true || saveResult.status !== 'saved') {
      return createFailure(
        'storageFailed',
        'unexpectedStorageResult',
        'Die LearningProgress-Änderung konnte nicht gespeichert werden.',
        previousState
      )
    }

    return { ok: true }
  }

  function loadProgress() {
    const currentState = readCurrentState()

    if (!currentState.ok) {
      return currentState
    }

    return createSuccess(
      currentState.storageStatus === 'missing' ? 'empty' : 'loaded',
      false,
      currentState.progressLog,
      currentState.projection
    )
  }

  function changeChapterState(input, eventType) {
    const currentState = readCurrentState()

    if (!currentState.ok) {
      return currentState
    }

    const inputValidation = validateMutationInput(input)

    if (Object.keys(inputValidation.fieldErrors).length > 0) {
      return createInputFailure(
        inputValidation.fieldErrors,
        currentState
      )
    }

    const { moduleId, chapterId } = inputValidation.values
    const targetReference = getTargetReference(
      currentState.referenceIndex,
      moduleId,
      chapterId
    )

    if (!targetReference.ok) {
      return createFailure(
        targetReference.status,
        targetReference.code,
        targetReference.message,
        currentState
      )
    }

    const currentChapterState = isChapterCompleted(
      currentState.progressLog,
      moduleId,
      chapterId
    )
    const nextChapterState =
      eventType === LEARNING_PROGRESS_EVENT_TYPES.CHAPTER_COMPLETED

    if (currentChapterState === nextChapterState) {
      return createSuccess(
        nextChapterState
          ? 'chapterAlreadyCompleted'
          : 'chapterAlreadyOpen',
        false,
        currentState.progressLog,
        currentState.projection
      )
    }

    const eventId = generateUniqueEventId(
      generateLearningProgressEventId,
      currentState.progressLog
    )

    if (!eventId) {
      return createFailure(
        'generationFailed',
        'learningProgressEventIdGenerationFailed',
        'Das Fortschrittsereignis konnte nicht eindeutig vorbereitet werden.',
        currentState
      )
    }

    let occurredAt

    try {
      occurredAt = now()
    } catch {
      return createFailure(
        'generationFailed',
        'learningProgressClockFailed',
        'Der Ereigniszeitpunkt konnte nicht bestimmt werden.',
        currentState
      )
    }

    if (!isCanonicalUtcTimestamp(occurredAt)) {
      return createFailure(
        'generationFailed',
        'invalidLearningProgressTimestamp',
        'Der Ereigniszeitpunkt ist kein gültiger kanonischer UTC-Zeitstempel.',
        currentState
      )
    }

    const progressEvent = {
      id: eventId,
      type: eventType,
      moduleId,
      chapterId,
      occurredAt,
    }
    const updatedProgressLog = {
      ...currentState.progressLog,
      events: [...currentState.progressLog.events, progressEvent],
    }
    let validationResult

    try {
      validationResult = validateLearningProgress(updatedProgressLog)
    } catch {
      validationResult = { ok: false }
    }

    if (
      !validationResult.ok ||
      updatedProgressLog.dataOrigin !== PRIVATE_DATA_ORIGIN
    ) {
      return createFailure(
        'validationFailed',
        'invalidLearningProgressState',
        'Die Fortschrittsänderung ergibt keinen gültigen Gesamtzustand.',
        currentState
      )
    }

    const updatedProjectionResult = createProjectionResult(
      currentState.hub,
      updatedProgressLog
    )

    if (!updatedProjectionResult.ok) {
      return createFailure(
        'projectionFailed',
        'learningProgressProjectionFailed',
        'Der neue LearningProgress-Zustand konnte nicht abgeleitet werden.',
        currentState
      )
    }

    const persistResult = persistProgress(
      currentState,
      updatedProgressLog
    )

    if (!persistResult.ok) {
      return persistResult
    }

    return createSuccess(
      nextChapterState ? 'chapterCompleted' : 'chapterReopened',
      true,
      updatedProgressLog,
      updatedProjectionResult.projection
    )
  }

  function completeChapter(input) {
    return changeChapterState(
      input,
      LEARNING_PROGRESS_EVENT_TYPES.CHAPTER_COMPLETED
    )
  }

  function reopenChapter(input) {
    return changeChapterState(
      input,
      LEARNING_PROGRESS_EVENT_TYPES.CHAPTER_REOPENED
    )
  }

  return Object.freeze({
    loadProgress,
    completeChapter,
    reopenChapter,
  })
}
