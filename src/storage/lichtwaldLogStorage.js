import {
  LICHTWALD_LOG_SCHEMA_VERSION,
  validateLichtwaldLog,
} from '../modules/lichtwald-log/lichtwaldLogContract.js'

export const LICHTWALD_LOG_STORAGE_KEY =
  'goldendawn.lichtwaldLog.content.v1'

export const LICHTWALD_LOG_MAX_SERIALIZED_LENGTH = 500_000

const PRIVATE_DATA_ORIGIN = 'private'
const STORAGE_OPTIONS = Object.freeze({
  maxSerializedLength: LICHTWALD_LOG_MAX_SERIALIZED_LENGTH,
})

const ADAPTER_FAILURES = Object.freeze({
  invalidStorageKey: Object.freeze({
    status: 'invalidKey',
    message: 'Der lokale Speicherpfad ist ungültig.',
  }),
  invalidStorageLimit: Object.freeze({
    status: 'invalidLimit',
    message: 'Die lokale Speichergrenze ist ungültig.',
  }),
  storageUnavailable: Object.freeze({
    status: 'unavailable',
    message: 'Der lokale Speicher ist nicht verfügbar.',
  }),
  storageReadFailed: Object.freeze({
    status: 'readFailed',
    message: 'Das lokale LichtwaldLog konnte nicht gelesen werden.',
  }),
  invalidJson: Object.freeze({
    status: 'invalidJson',
    message: 'Das gespeicherte LichtwaldLog enthält kein gültiges JSON.',
  }),
  storageSizeLimitExceeded: Object.freeze({
    status: 'sizeLimitExceeded',
    message: 'Das lokale LichtwaldLog überschreitet die zulässige Speichergröße.',
  }),
  serializationFailed: Object.freeze({
    status: 'serializationFailed',
    message: 'Das LichtwaldLog konnte nicht für die Speicherung vorbereitet werden.',
  }),
  storageQuotaExceeded: Object.freeze({
    status: 'quotaExceeded',
    message: 'Der lokale Speicher hat nicht genügend freien Platz.',
  }),
  storageWriteFailed: Object.freeze({
    status: 'writeFailed',
    message: 'Das lokale LichtwaldLog konnte nicht gespeichert werden.',
  }),
})

const READ_ADAPTER_FAILURES = Object.freeze({
  invalidStorageKey: ADAPTER_FAILURES.invalidStorageKey,
  invalidStorageLimit: ADAPTER_FAILURES.invalidStorageLimit,
  storageUnavailable: ADAPTER_FAILURES.storageUnavailable,
  storageReadFailed: ADAPTER_FAILURES.storageReadFailed,
  invalidJson: ADAPTER_FAILURES.invalidJson,
  storageSizeLimitExceeded: ADAPTER_FAILURES.storageSizeLimitExceeded,
})

const WRITE_ADAPTER_FAILURES = Object.freeze({
  invalidStorageKey: ADAPTER_FAILURES.invalidStorageKey,
  invalidStorageLimit: ADAPTER_FAILURES.invalidStorageLimit,
  storageUnavailable: ADAPTER_FAILURES.storageUnavailable,
  serializationFailed: ADAPTER_FAILURES.serializationFailed,
  storageSizeLimitExceeded: ADAPTER_FAILURES.storageSizeLimitExceeded,
  storageQuotaExceeded: ADAPTER_FAILURES.storageQuotaExceeded,
  storageWriteFailed: ADAPTER_FAILURES.storageWriteFailed,
})

const SUCCESS_PROPERTY_NAMES = Object.freeze(['ok', 'status'])
const FOUND_PROPERTY_NAMES = Object.freeze(['ok', 'status', 'value'])
const FAILURE_PROPERTY_NAMES = Object.freeze(['ok', 'status', 'error'])
const ERROR_PROPERTY_NAMES = Object.freeze(['code', 'message'])
const READ_RESULT_PROPERTY_SETS = Object.freeze([
  SUCCESS_PROPERTY_NAMES,
  FOUND_PROPERTY_NAMES,
  FAILURE_PROPERTY_NAMES,
])
const WRITE_RESULT_PROPERTY_SETS = Object.freeze([
  SUCCESS_PROPERTY_NAMES,
  FAILURE_PROPERTY_NAMES,
])

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

function createEmptyPrivateLichtwaldLog() {
  return {
    schemaVersion: LICHTWALD_LOG_SCHEMA_VERSION,
    dataOrigin: PRIVATE_DATA_ORIGIN,
    featuredEntryId: null,
    entries: [],
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
    'invalidLichtwaldLogData',
    'Das gespeicherte LichtwaldLog entspricht nicht dem gültigen LichtwaldLog-Vertrag.'
  )
}

function createInvalidSaveDataResult() {
  return createFailure(
    'validationFailed',
    'invalidLichtwaldLogData',
    'Das LichtwaldLog kann in dieser Form nicht gespeichert werden.'
  )
}

function createPrivateOriginResult(status) {
  return createFailure(
    status,
    'privateLichtwaldLogRequired',
    'Der private LichtwaldLog-Speicher akzeptiert ausschließlich private LichtwaldLog-Daten.'
  )
}

function isObjectRecord(value) {
  try {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return false
    }

    const prototype = Object.getPrototypeOf(value)

    return prototype === Object.prototype || prototype === null
  } catch {
    return false
  }
}

function hasExactPropertyNames(ownKeys, expectedPropertyNames) {
  return (
    ownKeys.length === expectedPropertyNames.length &&
    ownKeys.every(
      (propertyName) => (
        typeof propertyName === 'string' &&
        expectedPropertyNames.includes(propertyName)
      )
    )
  )
}

function readOwnDataProperties(value, expectedPropertySets) {
  if (!isObjectRecord(value)) {
    return { ok: false }
  }

  try {
    const ownKeys = Reflect.ownKeys(value)
    const expectedPropertyNames = expectedPropertySets.find(
      (propertyNames) => hasExactPropertyNames(ownKeys, propertyNames)
    )

    if (!expectedPropertyNames) {
      return { ok: false }
    }

    const properties = Object.create(null)

    for (const propertyName of expectedPropertyNames) {
      const descriptor = Object.getOwnPropertyDescriptor(value, propertyName)

      if (!descriptor || !Object.hasOwn(descriptor, 'value')) {
        return { ok: false }
      }

      properties[propertyName] = descriptor.value
    }

    return { ok: true, properties, propertyNames: expectedPropertyNames }
  } catch {
    return { ok: false }
  }
}

function readExactOwnDataProperties(value, expectedPropertyNames) {
  return readOwnDataProperties(value, [expectedPropertyNames])
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function forwardAdapterFailure(resultProperties, adapterFailures) {
  if (resultProperties.ok !== false) {
    return createUnexpectedAdapterResult()
  }

  const errorResult = readExactOwnDataProperties(
    resultProperties.error,
    ERROR_PROPERTY_NAMES
  )

  if (!errorResult.ok) {
    return createUnexpectedAdapterResult()
  }

  const { code, message } = errorResult.properties

  if (!isNonEmptyString(code) || !isNonEmptyString(message)) {
    return createUnexpectedAdapterResult()
  }

  const knownFailure = Object.hasOwn(adapterFailures, code)
    ? adapterFailures[code]
    : null

  if (!knownFailure || resultProperties.status !== knownFailure.status) {
    return createUnexpectedAdapterResult()
  }

  return createFailure(
    knownFailure.status,
    code,
    knownFailure.message
  )
}

function isValidLichtwaldLog(lichtwaldLog) {
  try {
    return validateLichtwaldLog(lichtwaldLog).ok === true
  } catch {
    return false
  }
}

function hasPrivateDataOrigin(lichtwaldLog) {
  try {
    return lichtwaldLog.dataOrigin === PRIVATE_DATA_ORIGIN
  } catch {
    return false
  }
}

function cloneLichtwaldLog(lichtwaldLog) {
  try {
    return {
      ok: true,
      lichtwaldLog: structuredClone(lichtwaldLog),
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
      LICHTWALD_LOG_STORAGE_KEY,
      STORAGE_OPTIONS
    )
  } catch {
    return createUnexpectedAdapterResult()
  }

  const resultShape = readOwnDataProperties(
    storageResult,
    READ_RESULT_PROPERTY_SETS
  )

  if (!resultShape.ok) {
    return createUnexpectedAdapterResult()
  }

  if (resultShape.propertyNames === FAILURE_PROPERTY_NAMES) {
    return forwardAdapterFailure(
      resultShape.properties,
      READ_ADAPTER_FAILURES
    )
  }

  if (resultShape.propertyNames === SUCCESS_PROPERTY_NAMES) {
    if (
      resultShape.properties.ok !== true ||
      resultShape.properties.status !== 'missing'
    ) {
      return createUnexpectedAdapterResult()
    }

    return {
      ok: true,
      status: 'missing',
      lichtwaldLog: createEmptyPrivateLichtwaldLog(),
    }
  }

  if (
    resultShape.propertyNames !== FOUND_PROPERTY_NAMES ||
    resultShape.properties.ok !== true ||
    resultShape.properties.status !== 'found'
  ) {
    return createUnexpectedAdapterResult()
  }

  const storedLichtwaldLog = resultShape.properties.value

  if (!isValidLichtwaldLog(storedLichtwaldLog)) {
    return createInvalidStoredDataResult()
  }

  if (!hasPrivateDataOrigin(storedLichtwaldLog)) {
    return createPrivateOriginResult('invalidStoredData')
  }

  const clonedLichtwaldLog = cloneLichtwaldLog(storedLichtwaldLog)

  if (
    !clonedLichtwaldLog.ok ||
    !isValidLichtwaldLog(clonedLichtwaldLog.lichtwaldLog)
  ) {
    return createInvalidStoredDataResult()
  }

  if (!hasPrivateDataOrigin(clonedLichtwaldLog.lichtwaldLog)) {
    return createPrivateOriginResult('invalidStoredData')
  }

  return {
    ok: true,
    status: 'found',
    lichtwaldLog: clonedLichtwaldLog.lichtwaldLog,
  }
}

function writeAdapterResult(storageAdapter, lichtwaldLog) {
  let storageResult

  try {
    storageResult = storageAdapter.writeJson(
      LICHTWALD_LOG_STORAGE_KEY,
      lichtwaldLog,
      STORAGE_OPTIONS
    )
  } catch {
    return createUnexpectedAdapterResult()
  }

  const resultShape = readOwnDataProperties(
    storageResult,
    WRITE_RESULT_PROPERTY_SETS
  )

  if (!resultShape.ok) {
    return createUnexpectedAdapterResult()
  }

  if (resultShape.propertyNames === FAILURE_PROPERTY_NAMES) {
    return forwardAdapterFailure(
      resultShape.properties,
      WRITE_ADAPTER_FAILURES
    )
  }

  if (
    resultShape.propertyNames !== SUCCESS_PROPERTY_NAMES ||
    resultShape.properties.ok !== true ||
    resultShape.properties.status !== 'saved'
  ) {
    return createUnexpectedAdapterResult()
  }

  return {
    ok: true,
    status: 'saved',
  }
}

export function createLichtwaldLogStorage(storageAdapter) {
  function loadLichtwaldLog() {
    if (!hasAdapterMethods(storageAdapter, ['readJson'])) {
      return createAdapterUnavailableResult()
    }

    return readAdapterResult(storageAdapter)
  }

  function saveLichtwaldLog(lichtwaldLog) {
    if (!isValidLichtwaldLog(lichtwaldLog)) {
      return createInvalidSaveDataResult()
    }

    if (!hasPrivateDataOrigin(lichtwaldLog)) {
      return createPrivateOriginResult('validationFailed')
    }

    const clonedLichtwaldLog = cloneLichtwaldLog(lichtwaldLog)

    if (
      !clonedLichtwaldLog.ok ||
      !isValidLichtwaldLog(clonedLichtwaldLog.lichtwaldLog)
    ) {
      return createInvalidSaveDataResult()
    }

    if (!hasPrivateDataOrigin(clonedLichtwaldLog.lichtwaldLog)) {
      return createPrivateOriginResult('validationFailed')
    }

    if (!hasAdapterMethods(storageAdapter, ['readJson', 'writeJson'])) {
      return createAdapterUnavailableResult()
    }

    const preflightResult = readAdapterResult(storageAdapter)

    if (!preflightResult.ok) {
      return preflightResult
    }

    return writeAdapterResult(
      storageAdapter,
      clonedLichtwaldLog.lichtwaldLog
    )
  }

  return Object.freeze({
    loadLichtwaldLog,
    saveLichtwaldLog,
  })
}
