import {
  LEARNING_HUB_SCHEMA_VERSION,
  validateLearningHub,
} from '../modules/learning-hub/learningHubContract.js'

export const LEARNING_HUB_STORAGE_KEY =
  'goldendawn.learningHub.content.v1'

const PRIVATE_DATA_ORIGIN = 'private'

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

function createEmptyPrivateLearningHub() {
  return {
    schemaVersion: LEARNING_HUB_SCHEMA_VERSION,
    dataOrigin: PRIVATE_DATA_ORIGIN,
    modules: [],
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
    'invalidLearningHubData',
    'Die gespeicherten LearningHub-Daten entsprechen nicht dem gültigen Inhaltsvertrag.'
  )
}

function createInvalidSaveDataResult() {
  return createFailure(
    'validationFailed',
    'invalidLearningHubData',
    'Der LearningHub kann in dieser Form nicht gespeichert werden.'
  )
}

function createPrivateOriginResult(status) {
  return createFailure(
    status,
    'privateLearningHubRequired',
    'Der private LearningHub-Speicher akzeptiert ausschließlich private Inhalte.'
  )
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function forwardAdapterFailure(result) {
  if (
    result?.ok !== false ||
    !isNonEmptyString(result.status) ||
    !isNonEmptyString(result.error?.code) ||
    !isNonEmptyString(result.error?.message)
  ) {
    return createUnexpectedAdapterResult()
  }

  return createFailure(
    result.status,
    result.error.code,
    result.error.message
  )
}

function isValidLearningHub(learningHub) {
  try {
    return validateLearningHub(learningHub).ok
  } catch {
    return false
  }
}

function cloneLearningHub(learningHub) {
  try {
    return {
      ok: true,
      hub: structuredClone(learningHub),
    }
  } catch {
    return { ok: false }
  }
}

export function createLearningHubStorage(storageAdapter) {
  function loadLearningHub() {
    if (typeof storageAdapter?.readJson !== 'function') {
      return createAdapterUnavailableResult()
    }

    let storageResult

    try {
      storageResult = storageAdapter.readJson(LEARNING_HUB_STORAGE_KEY)
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
        hub: createEmptyPrivateLearningHub(),
      }
    }

    if (
      storageResult.status !== 'found' ||
      !Object.prototype.hasOwnProperty.call(storageResult, 'value')
    ) {
      return createUnexpectedAdapterResult()
    }

    const storedLearningHub = storageResult.value

    if (!isValidLearningHub(storedLearningHub)) {
      return createInvalidStoredDataResult()
    }

    if (storedLearningHub.dataOrigin !== PRIVATE_DATA_ORIGIN) {
      return createPrivateOriginResult('invalidStoredData')
    }

    const clonedLearningHub = cloneLearningHub(storedLearningHub)

    if (!clonedLearningHub.ok) {
      return createInvalidStoredDataResult()
    }

    return {
      ok: true,
      status: 'found',
      hub: clonedLearningHub.hub,
    }
  }

  function saveLearningHub(learningHub) {
    if (!isValidLearningHub(learningHub)) {
      return createInvalidSaveDataResult()
    }

    if (learningHub.dataOrigin !== PRIVATE_DATA_ORIGIN) {
      return createPrivateOriginResult('validationFailed')
    }

    if (typeof storageAdapter?.writeJson !== 'function') {
      return createAdapterUnavailableResult()
    }

    const clonedLearningHub = cloneLearningHub(learningHub)

    if (!clonedLearningHub.ok) {
      return createInvalidSaveDataResult()
    }

    let storageResult

    try {
      storageResult = storageAdapter.writeJson(
        LEARNING_HUB_STORAGE_KEY,
        clonedLearningHub.hub
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
    loadLearningHub,
    saveLearningHub,
  })
}
