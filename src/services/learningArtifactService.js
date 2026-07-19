import { validateLearningHub } from '../modules/learning-hub/learningHubContract.js'
import {
  LEARNING_ARTIFACT_CONTENT_MAX_LENGTH,
  LEARNING_ARTIFACT_TYPES,
  isCanonicalUtcTimestamp,
  validateLearningArtifactStore,
} from '../modules/learning-hub/learningArtifactContract.js'

const PRIVATE_DATA_ORIGIN = 'private'
const MAX_ID_GENERATION_ATTEMPTS = 5
const LEARNING_ARTIFACT_ID_PREFIX = 'learning-artifact'

const SAFE_DEPENDENCY_FAILURES = Object.freeze({
  invalidStorageKey: new Set(['invalidKey']),
  storageUnavailable: new Set(['unavailable']),
  storageReadFailed: new Set(['readFailed']),
  invalidJson: new Set(['invalidJson']),
  storageAdapterUnavailable: new Set(['unavailable']),
  unexpectedStorageResult: new Set(['storageFailed']),
  invalidLearningArtifactData: new Set([
    'invalidStoredData',
    'validationFailed',
  ]),
  privateLearningArtifactsRequired: new Set([
    'invalidStoredData',
    'validationFailed',
  ]),
  serializationFailed: new Set(['serializationFailed']),
  storageQuotaExceeded: new Set(['quotaExceeded']),
  storageWriteFailed: new Set(['writeFailed']),
  learningHubStorageUnavailable: new Set(['unavailable']),
  learningHubStorageReadFailed: new Set(['readFailed']),
  invalidLearningHubData: new Set(['invalidStoredData']),
  invalidStoredLearningHub: new Set(['invalidStoredData']),
  privateLearningHubRequired: new Set(['invalidStoredData']),
})

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

function cloneArtifact(artifact) {
  return { ...artifact }
}

function cloneArtifactStore(artifactStore) {
  return {
    ...artifactStore,
    artifacts: artifactStore.artifacts.map(cloneArtifact),
  }
}

function createFailure(
  status,
  code,
  message,
  artifactStore = null
) {
  return {
    ok: false,
    status,
    changed: false,
    artifactStore: artifactStore
      ? cloneArtifactStore(artifactStore)
      : null,
    error: {
      code,
      message,
    },
  }
}

function createInputFailure(fieldErrors, artifactStore = null) {
  return {
    ok: false,
    status: 'validationFailed',
    changed: false,
    artifactStore: artifactStore
      ? cloneArtifactStore(artifactStore)
      : null,
    error: {
      code: 'invalidLearningArtifactInput',
      message: 'Bitte korrigiere die markierten Felder.',
      fieldErrors: { ...fieldErrors },
    },
  }
}

function createSuccess(status, changed, artifactStore) {
  return {
    ok: true,
    status,
    changed,
    artifactStore: cloneArtifactStore(artifactStore),
  }
}

function forwardDependencyFailure(
  dependencyResult,
  fallbackStatus,
  fallbackCode,
  safeMessage,
  artifactStore = null
) {
  const dependencyCode = dependencyResult?.error?.code
  const hasKnownDependencyCode = (
    isNonEmptyString(dependencyCode) &&
    Object.prototype.hasOwnProperty.call(
      SAFE_DEPENDENCY_FAILURES,
      dependencyCode
    )
  )
  const validStatuses = hasKnownDependencyCode
    ? SAFE_DEPENDENCY_FAILURES[dependencyCode]
    : null

  if (
    dependencyResult?.ok === false &&
    validStatuses?.has(dependencyResult.status) &&
    isNonEmptyString(dependencyResult.error?.message)
  ) {
    return createFailure(
      dependencyResult.status,
      dependencyCode,
      safeMessage,
      artifactStore
    )
  }

  return createFailure(
    fallbackStatus,
    fallbackCode,
    safeMessage,
    artifactStore
  )
}

function isValidPrivateHub(learningHub) {
  try {
    return (
      validateLearningHub(learningHub).ok &&
      learningHub.dataOrigin === PRIVATE_DATA_ORIGIN
    )
  } catch {
    return false
  }
}

function isValidPrivateArtifactStore(artifactStore) {
  try {
    return (
      validateLearningArtifactStore(artifactStore).ok &&
      artifactStore.dataOrigin === PRIVATE_DATA_ORIGIN
    )
  } catch {
    return false
  }
}

function validateTargetId(value, fieldName, fieldErrors) {
  if (!isTrimmedNonEmptyString(value)) {
    fieldErrors[fieldName] =
      'Die ID muss eine nicht leere, getrimmte Zeichenfolge sein.'
    return ''
  }

  return value
}

function validateReferenceInput(input) {
  const artifactInput = isObjectRecord(input) ? input : {}
  const fieldErrors = {}

  return {
    values: {
      moduleId: validateTargetId(
        artifactInput.moduleId,
        'moduleId',
        fieldErrors
      ),
      chapterId: validateTargetId(
        artifactInput.chapterId,
        'chapterId',
        fieldErrors
      ),
      learningNodeId: validateTargetId(
        artifactInput.learningNodeId,
        'learningNodeId',
        fieldErrors
      ),
    },
    fieldErrors,
  }
}

function validateContentInput(input) {
  const normalizedContent = typeof input?.content === 'string'
    ? input.content.trim()
    : ''
  const fieldErrors = {}

  if (!normalizedContent) {
    fieldErrors.content = 'Bitte gib einen Artefakttext ein.'
  } else if (
    normalizedContent.length > LEARNING_ARTIFACT_CONTENT_MAX_LENGTH
  ) {
    fieldErrors.content =
      'Der Artefakttext darf höchstens 10.000 Zeichen lang sein.'
  }

  return {
    content: normalizedContent,
    fieldErrors,
  }
}

function buildReferenceIndex(learningHub) {
  const modulesById = new Map()
  const chaptersById = new Map()
  const learningNodesById = new Map()

  learningHub.modules.forEach((learningModule) => {
    modulesById.set(learningModule.id, learningModule)

    learningModule.chapters.forEach((chapter) => {
      chaptersById.set(chapter.id, {
        moduleId: learningModule.id,
        chapter,
      })

      chapter.learningNodes.forEach((learningNode) => {
        learningNodesById.set(learningNode.id, {
          moduleId: learningModule.id,
          chapterId: chapter.id,
        })
      })
    })
  })

  return { modulesById, chaptersById, learningNodesById }
}

function getTargetReference(
  referenceIndex,
  moduleId,
  chapterId,
  learningNodeId
) {
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

  const learningNodeReference = referenceIndex.learningNodesById.get(
    learningNodeId
  )

  if (!learningNodeReference) {
    return {
      ok: false,
      status: 'notFound',
      code: 'learningNodeNotFound',
      message: 'Der angeforderte LearningNode wurde nicht gefunden.',
    }
  }

  if (
    learningNodeReference.moduleId !== moduleId ||
    learningNodeReference.chapterId !== chapterId
  ) {
    return {
      ok: false,
      status: 'ownershipMismatch',
      code: 'learningNodeChapterMismatch',
      message:
        'Der LearningNode gehört nicht zum angegebenen LearningChapter.',
    }
  }

  return { ok: true }
}

function validateStoredReferences(artifactStore, referenceIndex) {
  for (const artifact of artifactStore.artifacts) {
    if (!referenceIndex.modulesById.has(artifact.moduleId)) {
      return {
        ok: false,
        code: 'orphanedArtifactModuleReference',
        message:
          'Ein gespeichertes Artefakt verweist auf kein vorhandenes LearningModule.',
      }
    }

    const chapterReference = referenceIndex.chaptersById.get(
      artifact.chapterId
    )

    if (!chapterReference) {
      return {
        ok: false,
        code: 'orphanedArtifactChapterReference',
        message:
          'Ein gespeichertes Artefakt verweist auf kein vorhandenes LearningChapter.',
      }
    }

    if (chapterReference.moduleId !== artifact.moduleId) {
      return {
        ok: false,
        code: 'artifactChapterModuleMismatch',
        message:
          'Ein gespeichertes Artefakt besitzt eine ungültige Modul-Kapitel-Zuordnung.',
      }
    }

    const learningNodeReference = referenceIndex.learningNodesById.get(
      artifact.learningNodeId
    )

    if (!learningNodeReference) {
      return {
        ok: false,
        code: 'orphanedArtifactLearningNodeReference',
        message:
          'Ein gespeichertes Artefakt verweist auf keinen vorhandenen LearningNode.',
      }
    }

    if (
      learningNodeReference.moduleId !== artifact.moduleId ||
      learningNodeReference.chapterId !== artifact.chapterId
    ) {
      return {
        ok: false,
        code: 'artifactLearningNodeChapterMismatch',
        message:
          'Ein gespeichertes Artefakt besitzt eine ungültige Kapitel-LearningNode-Zuordnung.',
      }
    }
  }

  return { ok: true }
}

function findArtifactIndex(artifactStore, type, references) {
  return artifactStore.artifacts.findIndex((artifact) => (
    artifact.type === type &&
    artifact.moduleId === references.moduleId &&
    artifact.chapterId === references.chapterId &&
    artifact.learningNodeId === references.learningNodeId
  ))
}

function generateUniqueArtifactId(
  generateLearningArtifactId,
  artifactStore
) {
  const existingIds = new Set(
    artifactStore.artifacts.map((artifact) => artifact.id)
  )

  for (
    let attempt = 0;
    attempt < MAX_ID_GENERATION_ATTEMPTS;
    attempt += 1
  ) {
    let generatedId

    try {
      generatedId = generateLearningArtifactId()
    } catch {
      continue
    }

    if (
      isTrimmedNonEmptyString(generatedId) &&
      !existingIds.has(generatedId)
    ) {
      return generatedId
    }
  }

  return null
}

function generateDefaultLearningArtifactId() {
  if (typeof globalThis.crypto?.randomUUID !== 'function') {
    throw new Error('randomUUID unavailable')
  }

  return `${LEARNING_ARTIFACT_ID_PREFIX}-${globalThis.crypto.randomUUID()}`
}

function getDefaultNow() {
  return new Date().toISOString()
}

export function createLearningArtifactService({
  learningArtifactStorage,
  learningHubService,
  generateLearningArtifactId = generateDefaultLearningArtifactId,
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

    let hub

    try {
      hub = cloneHub(loadResult.hub)
    } catch {
      return createFailure(
        'invalidStoredData',
        'invalidStoredLearningHub',
        'Der aktuelle LearningHub entspricht nicht dem gültigen privaten Inhaltsvertrag.'
      )
    }

    if (!isValidPrivateHub(hub)) {
      return createFailure(
        'invalidStoredData',
        'invalidStoredLearningHub',
        'Der aktuelle LearningHub entspricht nicht dem gültigen privaten Inhaltsvertrag.'
      )
    }

    return {
      ok: true,
      hub,
      referenceIndex: buildReferenceIndex(hub),
    }
  }

  function readArtifactState() {
    if (
      typeof learningArtifactStorage?.loadLearningArtifacts !== 'function'
    ) {
      return createFailure(
        'unavailable',
        'learningArtifactStorageUnavailable',
        'Der LearningArtifact-Speicher ist nicht verfügbar.'
      )
    }

    let loadResult

    try {
      loadResult = learningArtifactStorage.loadLearningArtifacts()
    } catch {
      return createFailure(
        'readFailed',
        'learningArtifactStorageReadFailed',
        'Die LearningArtifact-Daten konnten nicht gelesen werden.'
      )
    }

    if (loadResult?.ok === false) {
      return forwardDependencyFailure(
        loadResult,
        'readFailed',
        'learningArtifactStorageReadFailed',
        'Die LearningArtifact-Daten konnten nicht gelesen werden.'
      )
    }

    if (
      loadResult?.ok !== true ||
      !['missing', 'found'].includes(loadResult.status) ||
      !isObjectRecord(loadResult.artifactStore)
    ) {
      return createFailure(
        'storageFailed',
        'unexpectedStorageResult',
        'Die LearningArtifact-Daten konnten nicht verarbeitet werden.'
      )
    }

    let artifactStore

    try {
      artifactStore = cloneArtifactStore(loadResult.artifactStore)
    } catch {
      return createFailure(
        'invalidStoredData',
        'invalidStoredLearningArtifacts',
        'Die gespeicherten LearningArtifact-Daten sind ungültig.'
      )
    }

    if (!isValidPrivateArtifactStore(artifactStore)) {
      return createFailure(
        'invalidStoredData',
        'invalidStoredLearningArtifacts',
        'Die gespeicherten LearningArtifact-Daten sind ungültig.'
      )
    }

    return {
      ok: true,
      storageStatus: loadResult.status,
      artifactStore,
    }
  }

  function prepareMutation(input) {
    const hubResult = readHubState()

    if (!hubResult.ok) {
      return hubResult
    }

    const referenceValidation = validateReferenceInput(input)

    if (Object.keys(referenceValidation.fieldErrors).length > 0) {
      return createInputFailure(referenceValidation.fieldErrors)
    }

    const targetReference = getTargetReference(
      hubResult.referenceIndex,
      referenceValidation.values.moduleId,
      referenceValidation.values.chapterId,
      referenceValidation.values.learningNodeId
    )

    if (!targetReference.ok) {
      return createFailure(
        targetReference.status,
        targetReference.code,
        targetReference.message
      )
    }

    const artifactResult = readArtifactState()

    if (!artifactResult.ok) {
      return artifactResult
    }

    const storedReferenceValidation = validateStoredReferences(
      artifactResult.artifactStore,
      hubResult.referenceIndex
    )

    if (!storedReferenceValidation.ok) {
      return createFailure(
        'invalidStoredData',
        storedReferenceValidation.code,
        storedReferenceValidation.message,
        artifactResult.artifactStore
      )
    }

    return {
      ok: true,
      references: referenceValidation.values,
      artifactStore: artifactResult.artifactStore,
    }
  }

  function persistArtifactStore(previousStore, updatedStore) {
    if (!isValidPrivateArtifactStore(updatedStore)) {
      return createFailure(
        'validationFailed',
        'invalidLearningArtifactState',
        'Die Artefaktänderung ergibt keinen gültigen Gesamtzustand.',
        previousStore
      )
    }

    if (
      typeof learningArtifactStorage?.saveLearningArtifacts !== 'function'
    ) {
      return createFailure(
        'unavailable',
        'learningArtifactStorageUnavailable',
        'Der LearningArtifact-Speicher ist nicht verfügbar.',
        previousStore
      )
    }

    let saveResult

    try {
      saveResult = learningArtifactStorage.saveLearningArtifacts(
        cloneArtifactStore(updatedStore)
      )
    } catch {
      return createFailure(
        'writeFailed',
        'learningArtifactStorageWriteFailed',
        'Die Artefaktänderung konnte nicht gespeichert werden.',
        previousStore
      )
    }

    if (saveResult?.ok === false) {
      return forwardDependencyFailure(
        saveResult,
        'writeFailed',
        'learningArtifactStorageWriteFailed',
        'Die Artefaktänderung konnte nicht gespeichert werden.',
        previousStore
      )
    }

    if (saveResult?.ok !== true || saveResult.status !== 'saved') {
      return createFailure(
        'storageFailed',
        'unexpectedStorageResult',
        'Die Artefaktänderung konnte nicht gespeichert werden.',
        previousStore
      )
    }

    return { ok: true }
  }

  function getTimestamp(previousTimestamp = null) {
    let timestamp

    try {
      timestamp = now()
    } catch {
      return {
        ok: false,
        code: 'learningArtifactClockFailed',
        message: 'Der Artefaktzeitpunkt konnte nicht bestimmt werden.',
      }
    }

    if (!isCanonicalUtcTimestamp(timestamp)) {
      return {
        ok: false,
        code: 'invalidLearningArtifactTimestamp',
        message:
          'Der Artefaktzeitpunkt ist kein gültiger kanonischer UTC-Zeitstempel.',
      }
    }

    if (
      previousTimestamp !== null &&
      Date.parse(timestamp) < Date.parse(previousTimestamp)
    ) {
      return {
        ok: false,
        code: 'learningArtifactTimestampMovedBackward',
        message: 'Der Artefaktzeitpunkt darf nicht rückläufig sein.',
      }
    }

    return { ok: true, timestamp }
  }

  function loadArtifacts() {
    const artifactResult = readArtifactState()

    if (!artifactResult.ok) {
      return artifactResult
    }

    return createSuccess(
      artifactResult.storageStatus === 'missing' ? 'empty' : 'loaded',
      false,
      artifactResult.artifactStore
    )
  }

  function saveArtifact(input, type) {
    const currentState = prepareMutation(input)

    if (!currentState.ok) {
      return currentState
    }

    const contentValidation = validateContentInput(input)

    if (Object.keys(contentValidation.fieldErrors).length > 0) {
      return createInputFailure(
        contentValidation.fieldErrors,
        currentState.artifactStore
      )
    }

    const artifactIndex = findArtifactIndex(
      currentState.artifactStore,
      type,
      currentState.references
    )
    const existingArtifact = artifactIndex === -1
      ? null
      : currentState.artifactStore.artifacts[artifactIndex]

    if (existingArtifact?.content === contentValidation.content) {
      return createSuccess(
        'artifactUnchanged',
        false,
        currentState.artifactStore
      )
    }

    let updatedArtifact

    if (existingArtifact) {
      const timestampResult = getTimestamp(existingArtifact.updatedAt)

      if (!timestampResult.ok) {
        return createFailure(
          'generationFailed',
          timestampResult.code,
          timestampResult.message,
          currentState.artifactStore
        )
      }

      updatedArtifact = {
        ...existingArtifact,
        content: contentValidation.content,
        updatedAt: timestampResult.timestamp,
      }
    } else {
      const artifactId = generateUniqueArtifactId(
        generateLearningArtifactId,
        currentState.artifactStore
      )

      if (!artifactId) {
        return createFailure(
          'generationFailed',
          'learningArtifactIdGenerationFailed',
          'Das Artefakt konnte nicht eindeutig vorbereitet werden.',
          currentState.artifactStore
        )
      }

      const timestampResult = getTimestamp()

      if (!timestampResult.ok) {
        return createFailure(
          'generationFailed',
          timestampResult.code,
          timestampResult.message,
          currentState.artifactStore
        )
      }

      updatedArtifact = {
        id: artifactId,
        type,
        ...currentState.references,
        content: contentValidation.content,
        createdAt: timestampResult.timestamp,
        updatedAt: timestampResult.timestamp,
      }
    }

    const updatedArtifacts = existingArtifact
      ? currentState.artifactStore.artifacts.map((artifact, index) => (
        index === artifactIndex ? updatedArtifact : artifact
      ))
      : [...currentState.artifactStore.artifacts, updatedArtifact]
    const updatedStore = {
      ...currentState.artifactStore,
      artifacts: updatedArtifacts,
    }
    const persistResult = persistArtifactStore(
      currentState.artifactStore,
      updatedStore
    )

    if (!persistResult.ok) {
      return persistResult
    }

    return createSuccess(
      existingArtifact ? 'artifactUpdated' : 'artifactCreated',
      true,
      updatedStore
    )
  }

  function clearArtifact(input, type) {
    const currentState = prepareMutation(input)

    if (!currentState.ok) {
      return currentState
    }

    const artifactIndex = findArtifactIndex(
      currentState.artifactStore,
      type,
      currentState.references
    )

    if (artifactIndex === -1) {
      return createSuccess(
        'artifactAlreadyEmpty',
        false,
        currentState.artifactStore
      )
    }

    const updatedStore = {
      ...currentState.artifactStore,
      artifacts: currentState.artifactStore.artifacts.filter(
        (_, index) => index !== artifactIndex
      ),
    }
    const persistResult = persistArtifactStore(
      currentState.artifactStore,
      updatedStore
    )

    if (!persistResult.ok) {
      return persistResult
    }

    return createSuccess('artifactCleared', true, updatedStore)
  }

  function saveNote(input) {
    return saveArtifact(input, LEARNING_ARTIFACT_TYPES.NOTE)
  }

  function saveSummary(input) {
    return saveArtifact(input, LEARNING_ARTIFACT_TYPES.SUMMARY)
  }

  function clearNote(input) {
    return clearArtifact(input, LEARNING_ARTIFACT_TYPES.NOTE)
  }

  function clearSummary(input) {
    return clearArtifact(input, LEARNING_ARTIFACT_TYPES.SUMMARY)
  }

  return Object.freeze({
    loadArtifacts,
    saveNote,
    saveSummary,
    clearNote,
    clearSummary,
  })
}
