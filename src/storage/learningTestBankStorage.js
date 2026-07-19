import {
  LEARNING_TEST_BANK_SCHEMA_VERSION,
  validateLearningTestBank,
} from '../modules/learning-hub/learningTestBankContract.js'

export const LEARNING_TEST_BANK_STORAGE_KEY =
  'goldendawn.learningHub.testBank.v1'

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
    message: 'Die lokale Testbank konnte nicht gelesen werden.',
  }),
  invalidJson: Object.freeze({
    status: 'invalidJson',
    message: 'Die gespeicherte Testbank enthält kein gültiges JSON.',
  }),
  serializationFailed: Object.freeze({
    status: 'serializationFailed',
    message: 'Die Testbank konnte nicht für die Speicherung vorbereitet werden.',
  }),
  storageQuotaExceeded: Object.freeze({
    status: 'quotaExceeded',
    message: 'Der lokale Speicher hat nicht genügend freien Platz.',
  }),
  storageWriteFailed: Object.freeze({
    status: 'writeFailed',
    message: 'Die lokale Testbank konnte nicht gespeichert werden.',
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

function createEmptyPrivateTestBank() {
  return {
    schemaVersion: LEARNING_TEST_BANK_SCHEMA_VERSION,
    dataOrigin: PRIVATE_DATA_ORIGIN,
    questions: [],
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
    'invalidLearningTestBankData',
    'Die gespeicherte LearningTestBank entspricht nicht dem gültigen Testbankvertrag.'
  )
}

function createInvalidSaveDataResult() {
  return createFailure(
    'validationFailed',
    'invalidLearningTestBankData',
    'Die LearningTestBank kann in dieser Form nicht gespeichert werden.'
  )
}

function createPrivateOriginResult(status) {
  return createFailure(
    status,
    'privateLearningTestBankRequired',
    'Der private LearningTestBank-Speicher akzeptiert ausschließlich private Testdaten.'
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

function isValidTestBank(testBank) {
  try {
    return validateLearningTestBank(testBank).ok === true
  } catch {
    return false
  }
}

function hasPrivateDataOrigin(testBank) {
  try {
    return testBank.dataOrigin === PRIVATE_DATA_ORIGIN
  } catch {
    return false
  }
}

function cloneTestBank(testBank) {
  try {
    return {
      ok: true,
      testBank: structuredClone(testBank),
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
      LEARNING_TEST_BANK_STORAGE_KEY
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
        testBank: createEmptyPrivateTestBank(),
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

  let storedTestBank

  try {
    storedTestBank = storageResult.value
  } catch {
    return createUnexpectedAdapterResult()
  }

  if (!isValidTestBank(storedTestBank)) {
    return createInvalidStoredDataResult()
  }

  if (!hasPrivateDataOrigin(storedTestBank)) {
    return createPrivateOriginResult('invalidStoredData')
  }

  const clonedTestBank = cloneTestBank(storedTestBank)

  if (!clonedTestBank.ok || !isValidTestBank(clonedTestBank.testBank)) {
    return createInvalidStoredDataResult()
  }

  if (!hasPrivateDataOrigin(clonedTestBank.testBank)) {
    return createPrivateOriginResult('invalidStoredData')
  }

  return {
    ok: true,
    status: 'found',
    testBank: clonedTestBank.testBank,
  }
}

function writeAdapterResult(storageAdapter, testBank) {
  let storageResult

  try {
    storageResult = storageAdapter.writeJson(
      LEARNING_TEST_BANK_STORAGE_KEY,
      testBank
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

export function createLearningTestBankStorage(storageAdapter) {
  function loadLearningTestBank() {
    if (!hasAdapterMethods(storageAdapter, ['readJson'])) {
      return createAdapterUnavailableResult()
    }

    return readAdapterResult(storageAdapter)
  }

  function saveLearningTestBank(testBank) {
    if (!isValidTestBank(testBank)) {
      return createInvalidSaveDataResult()
    }

    if (!hasPrivateDataOrigin(testBank)) {
      return createPrivateOriginResult('validationFailed')
    }

    const clonedTestBank = cloneTestBank(testBank)

    if (!clonedTestBank.ok || !isValidTestBank(clonedTestBank.testBank)) {
      return createInvalidSaveDataResult()
    }

    if (!hasPrivateDataOrigin(clonedTestBank.testBank)) {
      return createPrivateOriginResult('validationFailed')
    }

    if (!hasAdapterMethods(storageAdapter, ['readJson', 'writeJson'])) {
      return createAdapterUnavailableResult()
    }

    const preflightResult = loadLearningTestBank()

    if (!preflightResult.ok) {
      return preflightResult
    }

    return writeAdapterResult(storageAdapter, clonedTestBank.testBank)
  }

  return Object.freeze({
    loadLearningTestBank,
    saveLearningTestBank,
  })
}
