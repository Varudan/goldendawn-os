import {
  LEARNING_PROGRESS_SCHEMA_VERSION,
  validateLearningProgress,
} from '../modules/learning-hub/learningProgressContract.js'

export const LEARNING_PROGRESS_STORAGE_KEY =
  'goldendawn.learningHub.progress.v1'

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

function createEmptyPrivateProgressLog() {
  return {
    schemaVersion: LEARNING_PROGRESS_SCHEMA_VERSION,
    dataOrigin: PRIVATE_DATA_ORIGIN,
    events: [],
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
    'invalidLearningProgressData',
    'Die gespeicherten LearningProgress-Daten entsprechen nicht dem gültigen Fortschrittsvertrag.'
  )
}

function createInvalidSaveDataResult() {
  return createFailure(
    'validationFailed',
    'invalidLearningProgressData',
    'Der LearningProgress-Log kann in dieser Form nicht gespeichert werden.'
  )
}

function createPrivateOriginResult(status) {
  return createFailure(
    status,
    'privateLearningProgressRequired',
    'Der private LearningProgress-Speicher akzeptiert ausschließlich private Fortschrittsdaten.'
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

function isValidLearningProgress(progressLog) {
  try {
    return validateLearningProgress(progressLog).ok
  } catch {
    return false
  }
}

function cloneLearningProgress(progressLog) {
  try {
    return {
      ok: true,
      progressLog: structuredClone(progressLog),
    }
  } catch {
    return { ok: false }
  }
}

export function createLearningProgressStorage(storageAdapter) {
  function loadLearningProgress() {
    if (typeof storageAdapter?.readJson !== 'function') {
      return createAdapterUnavailableResult()
    }

    let storageResult

    try {
      storageResult = storageAdapter.readJson(
        LEARNING_PROGRESS_STORAGE_KEY
      )
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
        progressLog: createEmptyPrivateProgressLog(),
      }
    }

    if (
      storageResult.status !== 'found' ||
      !Object.prototype.hasOwnProperty.call(storageResult, 'value')
    ) {
      return createUnexpectedAdapterResult()
    }

    const storedProgressLog = storageResult.value

    if (!isValidLearningProgress(storedProgressLog)) {
      return createInvalidStoredDataResult()
    }

    if (storedProgressLog.dataOrigin !== PRIVATE_DATA_ORIGIN) {
      return createPrivateOriginResult('invalidStoredData')
    }

    const clonedProgressLog = cloneLearningProgress(storedProgressLog)

    if (!clonedProgressLog.ok) {
      return createInvalidStoredDataResult()
    }

    return {
      ok: true,
      status: 'found',
      progressLog: clonedProgressLog.progressLog,
    }
  }

  function saveLearningProgress(progressLog) {
    if (!isValidLearningProgress(progressLog)) {
      return createInvalidSaveDataResult()
    }

    if (progressLog.dataOrigin !== PRIVATE_DATA_ORIGIN) {
      return createPrivateOriginResult('validationFailed')
    }

    if (typeof storageAdapter?.writeJson !== 'function') {
      return createAdapterUnavailableResult()
    }

    const clonedProgressLog = cloneLearningProgress(progressLog)

    if (!clonedProgressLog.ok) {
      return createInvalidSaveDataResult()
    }

    let storageResult

    try {
      storageResult = storageAdapter.writeJson(
        LEARNING_PROGRESS_STORAGE_KEY,
        clonedProgressLog.progressLog
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
    loadLearningProgress,
    saveLearningProgress,
  })
}
