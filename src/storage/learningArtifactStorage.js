import {
  LEARNING_ARTIFACT_SCHEMA_VERSION,
  validateLearningArtifactStore,
} from '../modules/learning-hub/learningArtifactContract.js'

export const LEARNING_ARTIFACT_STORAGE_KEY =
  'goldendawn.learningHub.artifacts.v1'

const PRIVATE_DATA_ORIGIN = 'private'

const ADAPTER_FAILURES = Object.freeze({
  invalidStorageKey: Object.freeze({
    status: 'invalidKey',
    message: 'Der lokale Speicherpfad ist ungültig.',
  }),
  storageUnavailable: Object.freeze({
    status: 'unavailable',
    message: 'Der lokale Speicher ist nicht verfügbar.',
  }),
  storageReadFailed: Object.freeze({
    status: 'readFailed',
    message: 'Die lokalen Artefaktdaten konnten nicht gelesen werden.',
  }),
  invalidJson: Object.freeze({
    status: 'invalidJson',
    message:
      'Die gespeicherten Artefaktdaten enthalten kein gültiges JSON.',
  }),
  serializationFailed: Object.freeze({
    status: 'serializationFailed',
    message:
      'Die Artefaktdaten konnten nicht für die Speicherung vorbereitet werden.',
  }),
  storageQuotaExceeded: Object.freeze({
    status: 'quotaExceeded',
    message: 'Der lokale Speicher hat nicht genügend freien Platz.',
  }),
  storageWriteFailed: Object.freeze({
    status: 'writeFailed',
    message: 'Die lokalen Artefaktdaten konnten nicht gespeichert werden.',
  }),
})

function createFailure(status, code, message) {
  return {
    ok: false,
    status,
    error: {
      code,
      message,
    },
  }
}

function createEmptyPrivateArtifactStore() {
  return {
    schemaVersion: LEARNING_ARTIFACT_SCHEMA_VERSION,
    dataOrigin: PRIVATE_DATA_ORIGIN,
    artifacts: [],
  }
}

function createAdapterUnavailableResult() {
  return createFailure(
    'unavailable',
    'storageAdapterUnavailable',
    'Der Storage-Adapter ist nicht verfügbar.'
  )
}

function createUnexpectedAdapterResult() {
  return createFailure(
    'storageFailed',
    'unexpectedStorageResult',
    'Der Storage-Adapter hat kein verwertbares Ergebnis geliefert.'
  )
}

function createInvalidStoredDataResult() {
  return createFailure(
    'invalidStoredData',
    'invalidLearningArtifactData',
    'Die gespeicherten LearningArtifact-Daten entsprechen nicht dem gültigen Artefaktvertrag.'
  )
}

function createInvalidSaveDataResult() {
  return createFailure(
    'validationFailed',
    'invalidLearningArtifactData',
    'Der LearningArtifact-Store kann in dieser Form nicht gespeichert werden.'
  )
}

function createPrivateOriginResult(status) {
  return createFailure(
    status,
    'privateLearningArtifactsRequired',
    'Der private LearningArtifact-Speicher akzeptiert ausschließlich private Artefaktdaten.'
  )
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function forwardAdapterFailure(result) {
  const errorCode = result?.error?.code
  const hasKnownErrorCode = (
    isNonEmptyString(errorCode) &&
    Object.prototype.hasOwnProperty.call(ADAPTER_FAILURES, errorCode)
  )
  const knownFailure = hasKnownErrorCode
    ? ADAPTER_FAILURES[errorCode]
    : null

  if (
    result?.ok !== false ||
    !knownFailure ||
    result.status !== knownFailure.status ||
    !isNonEmptyString(result.error?.message)
  ) {
    return createUnexpectedAdapterResult()
  }

  return createFailure(
    knownFailure.status,
    errorCode,
    knownFailure.message
  )
}

function isValidLearningArtifactStore(artifactStore) {
  try {
    return validateLearningArtifactStore(artifactStore).ok
  } catch {
    return false
  }
}

function cloneLearningArtifactStore(artifactStore) {
  try {
    return {
      ok: true,
      artifactStore: structuredClone(artifactStore),
    }
  } catch {
    return { ok: false }
  }
}

export function createLearningArtifactStorage(storageAdapter) {
  function loadLearningArtifacts() {
    if (typeof storageAdapter?.readJson !== 'function') {
      return createAdapterUnavailableResult()
    }

    let storageResult

    try {
      storageResult = storageAdapter.readJson(LEARNING_ARTIFACT_STORAGE_KEY)
    } catch {
      return createUnexpectedAdapterResult()
    }

    if (storageResult?.ok === false) {
      return forwardAdapterFailure(storageResult)
    }

    if (storageResult?.ok !== true) {
      return createUnexpectedAdapterResult()
    }

    if (storageResult.status === 'missing') {
      return {
        ok: true,
        status: 'missing',
        artifactStore: createEmptyPrivateArtifactStore(),
      }
    }

    if (
      storageResult.status !== 'found' ||
      !Object.prototype.hasOwnProperty.call(storageResult, 'value')
    ) {
      return createUnexpectedAdapterResult()
    }

    const clonedArtifactStore = cloneLearningArtifactStore(
      storageResult.value
    )

    if (!clonedArtifactStore.ok) {
      return createInvalidStoredDataResult()
    }

    if (!isValidLearningArtifactStore(clonedArtifactStore.artifactStore)) {
      return createInvalidStoredDataResult()
    }

    if (
      clonedArtifactStore.artifactStore.dataOrigin !== PRIVATE_DATA_ORIGIN
    ) {
      return createPrivateOriginResult('invalidStoredData')
    }

    return {
      ok: true,
      status: 'found',
      artifactStore: clonedArtifactStore.artifactStore,
    }
  }

  function saveLearningArtifacts(artifactStore) {
    const clonedArtifactStore = cloneLearningArtifactStore(artifactStore)

    if (!clonedArtifactStore.ok) {
      return createInvalidSaveDataResult()
    }

    if (!isValidLearningArtifactStore(clonedArtifactStore.artifactStore)) {
      return createInvalidSaveDataResult()
    }

    if (
      clonedArtifactStore.artifactStore.dataOrigin !== PRIVATE_DATA_ORIGIN
    ) {
      return createPrivateOriginResult('validationFailed')
    }

    if (
      typeof storageAdapter?.readJson !== 'function' ||
      typeof storageAdapter?.writeJson !== 'function'
    ) {
      return createAdapterUnavailableResult()
    }

    const existingStoreResult = loadLearningArtifacts()

    if (!existingStoreResult.ok) {
      return existingStoreResult
    }

    let storageResult

    try {
      storageResult = storageAdapter.writeJson(
        LEARNING_ARTIFACT_STORAGE_KEY,
        clonedArtifactStore.artifactStore
      )
    } catch {
      return createUnexpectedAdapterResult()
    }

    if (storageResult?.ok === false) {
      return forwardAdapterFailure(storageResult)
    }

    if (
      storageResult?.ok !== true ||
      storageResult.status !== 'saved'
    ) {
      return createUnexpectedAdapterResult()
    }

    return {
      ok: true,
      status: 'saved',
    }
  }

  return Object.freeze({
    loadLearningArtifacts,
    saveLearningArtifacts,
  })
}
