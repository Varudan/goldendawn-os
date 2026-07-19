import {
  LEARNING_TEST_ATTEMPT_SCHEMA_VERSION,
  validateLearningTestAttemptLog,
} from '../modules/learning-hub/learningTestAttemptContract.js'

export const LEARNING_TEST_ATTEMPT_STORAGE_KEY =
  'goldendawn.learningHub.testAttempts.v1'

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
    message: 'Die lokale Testhistorie konnte nicht gelesen werden.',
  }),
  invalidJson: Object.freeze({
    status: 'invalidJson',
    message: 'Die gespeicherte Testhistorie enthält kein gültiges JSON.',
  }),
  serializationFailed: Object.freeze({
    status: 'serializationFailed',
    message: 'Die Testhistorie konnte nicht für die Speicherung vorbereitet werden.',
  }),
  storageQuotaExceeded: Object.freeze({
    status: 'quotaExceeded',
    message: 'Der lokale Speicher hat nicht genügend freien Platz.',
  }),
  storageWriteFailed: Object.freeze({
    status: 'writeFailed',
    message: 'Die lokale Testhistorie konnte nicht gespeichert werden.',
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

function createEmptyPrivateAttemptLog() {
  return {
    schemaVersion: LEARNING_TEST_ATTEMPT_SCHEMA_VERSION,
    dataOrigin: PRIVATE_DATA_ORIGIN,
    attempts: [],
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
    'invalidLearningTestAttemptLogData',
    'Die gespeicherte LearningTest-Historie entspricht nicht dem gültigen Versuchsspeichervertrag.'
  )
}

function createInvalidAppendDataResult() {
  return createFailure(
    'validationFailed',
    'invalidLearningTestAttemptLogData',
    'Der LearningTest-Versuch kann in dieser Form nicht gespeichert werden.'
  )
}

function createPrivateOriginResult(status) {
  return createFailure(
    status,
    'privateLearningTestAttemptsRequired',
    'Der private LearningTest-Versuchsspeicher akzeptiert ausschließlich private Testdaten.'
  )
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function forwardAdapterFailure(result) {
  try {
    const errorCode = result?.error?.code
    const hasKnownErrorCode =
      isNonEmptyString(errorCode) &&
      Object.prototype.hasOwnProperty.call(ADAPTER_FAILURES, errorCode)
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
  } catch {
    return createUnexpectedAdapterResult()
  }
}

function isValidAttemptLog(attemptLog) {
  try {
    return validateLearningTestAttemptLog(attemptLog).ok === true
  } catch {
    return false
  }
}

function isValidAttempt(attempt) {
  return isValidAttemptLog({
    schemaVersion: LEARNING_TEST_ATTEMPT_SCHEMA_VERSION,
    dataOrigin: PRIVATE_DATA_ORIGIN,
    attempts: [attempt],
  })
}

function hasPrivateDataOrigin(attemptLog) {
  try {
    return attemptLog.dataOrigin === PRIVATE_DATA_ORIGIN
  } catch {
    return false
  }
}

function cloneAttemptLog(attemptLog) {
  try {
    return {
      ok: true,
      attemptLog: structuredClone(attemptLog),
    }
  } catch {
    return { ok: false }
  }
}

function cloneAttempt(attempt) {
  try {
    return {
      ok: true,
      attempt: structuredClone(attempt),
    }
  } catch {
    return { ok: false }
  }
}

function hasAdapterMethods(storageAdapter, methodNames) {
  try {
    return methodNames.every(
      (methodName) => typeof storageAdapter?.[methodName] === 'function'
    )
  } catch {
    return false
  }
}

function readAdapterResult(storageAdapter) {
  let storageResult

  try {
    storageResult = storageAdapter.readJson(
      LEARNING_TEST_ATTEMPT_STORAGE_KEY
    )
  } catch {
    return createUnexpectedAdapterResult()
  }

  try {
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
        attemptLog: createEmptyPrivateAttemptLog(),
      }
    }

    if (
      storageResult.status !== 'found' ||
      !Object.prototype.hasOwnProperty.call(storageResult, 'value')
    ) {
      return createUnexpectedAdapterResult()
    }
  } catch {
    return createUnexpectedAdapterResult()
  }

  let storedAttemptLog

  try {
    storedAttemptLog = storageResult.value
  } catch {
    return createUnexpectedAdapterResult()
  }

  if (!isValidAttemptLog(storedAttemptLog)) {
    return createInvalidStoredDataResult()
  }

  if (!hasPrivateDataOrigin(storedAttemptLog)) {
    return createPrivateOriginResult('invalidStoredData')
  }

  const clonedAttemptLog = cloneAttemptLog(storedAttemptLog)

  if (
    !clonedAttemptLog.ok ||
    !isValidAttemptLog(clonedAttemptLog.attemptLog)
  ) {
    return createInvalidStoredDataResult()
  }

  if (!hasPrivateDataOrigin(clonedAttemptLog.attemptLog)) {
    return createPrivateOriginResult('invalidStoredData')
  }

  return {
    ok: true,
    status: 'found',
    attemptLog: clonedAttemptLog.attemptLog,
  }
}

function writeAdapterResult(storageAdapter, attemptLog) {
  let storageResult

  try {
    storageResult = storageAdapter.writeJson(
      LEARNING_TEST_ATTEMPT_STORAGE_KEY,
      attemptLog
    )
  } catch {
    return createUnexpectedAdapterResult()
  }

  try {
    if (storageResult?.ok === false) {
      return forwardAdapterFailure(storageResult)
    }

    if (
      storageResult?.ok !== true ||
      storageResult.status !== 'saved'
    ) {
      return createUnexpectedAdapterResult()
    }
  } catch {
    return createUnexpectedAdapterResult()
  }

  return {
    ok: true,
    status: 'saved',
  }
}

export function createLearningTestAttemptStorage(storageAdapter) {
  function loadLearningTestAttempts() {
    if (!hasAdapterMethods(storageAdapter, ['readJson'])) {
      return createAdapterUnavailableResult()
    }

    return readAdapterResult(storageAdapter)
  }

  function appendLearningTestAttempt(attempt) {
    if (!isValidAttempt(attempt)) {
      return createInvalidAppendDataResult()
    }

    const clonedAttempt = cloneAttempt(attempt)

    if (!clonedAttempt.ok || !isValidAttempt(clonedAttempt.attempt)) {
      return createInvalidAppendDataResult()
    }

    if (!hasAdapterMethods(storageAdapter, ['readJson', 'writeJson'])) {
      return createAdapterUnavailableResult()
    }

    const preflightResult = loadLearningTestAttempts()

    if (!preflightResult.ok) {
      return preflightResult
    }

    const clonedPrefix = cloneAttemptLog(preflightResult.attemptLog)

    if (!clonedPrefix.ok || !isValidAttemptLog(clonedPrefix.attemptLog)) {
      return createInvalidStoredDataResult()
    }

    if (!hasPrivateDataOrigin(clonedPrefix.attemptLog)) {
      return createPrivateOriginResult('invalidStoredData')
    }

    clonedPrefix.attemptLog.attempts.push(clonedAttempt.attempt)

    if (!isValidAttemptLog(clonedPrefix.attemptLog)) {
      return createInvalidAppendDataResult()
    }

    if (!hasPrivateDataOrigin(clonedPrefix.attemptLog)) {
      return createPrivateOriginResult('validationFailed')
    }

    const writeValue = cloneAttemptLog(clonedPrefix.attemptLog)
    const returnValue = cloneAttemptLog(clonedPrefix.attemptLog)

    if (
      !writeValue.ok ||
      !returnValue.ok ||
      !isValidAttemptLog(writeValue.attemptLog) ||
      !isValidAttemptLog(returnValue.attemptLog)
    ) {
      return createInvalidAppendDataResult()
    }

    if (
      !hasPrivateDataOrigin(writeValue.attemptLog) ||
      !hasPrivateDataOrigin(returnValue.attemptLog)
    ) {
      return createPrivateOriginResult('validationFailed')
    }

    const writeResult = writeAdapterResult(
      storageAdapter,
      writeValue.attemptLog
    )

    if (!writeResult.ok) {
      return writeResult
    }

    return {
      ok: true,
      status: 'appended',
      attemptLog: returnValue.attemptLog,
    }
  }

  return Object.freeze({
    loadLearningTestAttempts,
    appendLearningTestAttempt,
  })
}
