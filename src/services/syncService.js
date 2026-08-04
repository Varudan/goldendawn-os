import {
  SYNC_CONTRACT_ACTIONS,
  SYNC_CONTRACT_SOURCES,
  SYNC_CONTRACT_VERSION,
  validateSyncRequest,
  validateSyncResponse,
} from '../contracts/syncContract.js'

const SYNC_TEST_ACTION = SYNC_CONTRACT_ACTIONS[0]
const GOLDENDAWN_SOURCE = SYNC_CONTRACT_SOURCES[0]

const RESPONSE_PROPERTY_NAMES = Object.freeze([
  'version',
  'success',
  'requestId',
  'action',
  'handledBy',
  'timestamp',
  'data',
  'error',
  'warnings',
  'meta',
])
const SUCCESS_DATA_PROPERTY_NAMES = Object.freeze([
  'status',
  'dataOrigin',
])
const RESPONSE_ERROR_PROPERTY_NAMES = Object.freeze([
  'code',
  'message',
  'retryable',
  'details',
])
const META_PROPERTY_NAMES = Object.freeze([
  'durationMs',
  'processedBy',
])

const SYNC_SERVICE_FAILURES = Object.freeze({
  invalidInvocation: Object.freeze({
    status: 'invalidInvocation',
    code: 'invalidSyncServiceInvocation',
    message: 'Der Sync-Test akzeptiert keine Eingabedaten.',
  }),
  unavailable: Object.freeze({
    status: 'unavailable',
    code: 'syncTransportUnavailable',
    message: 'Der Sync-Dienst ist nicht verfügbar.',
  }),
  requestBuildFailed: Object.freeze({
    status: 'requestBuildFailed',
    code: 'syncRequestBuildFailed',
    message: 'Die Sync-Anfrage konnte nicht sicher vorbereitet werden.',
  }),
  transportFailed: Object.freeze({
    status: 'transportFailed',
    code: 'syncTransportFailed',
    message: 'Die Sync-Anfrage konnte nicht übermittelt werden.',
  }),
  invalidResponse: Object.freeze({
    status: 'invalidResponse',
    code: 'invalidSyncTransportResponse',
    message: 'Die Sync-Antwort konnte nicht sicher verarbeitet werden.',
  }),
})

function defaultCryptoRequestIdGenerator() {
  const cryptoProvider = globalThis.crypto
  const randomUuidMethod = cryptoProvider?.randomUUID

  if (typeof randomUuidMethod !== 'function') {
    throw new TypeError('crypto.randomUUID is unavailable')
  }

  const randomUuid = Reflect.apply(randomUuidMethod, cryptoProvider, [])

  if (typeof randomUuid !== 'string') {
    throw new TypeError('crypto.randomUUID returned an invalid value')
  }

  return 'req_' + randomUuid
}

function defaultUtcClock() {
  return new Date().toISOString()
}

function createFailure(failure, requestId = null) {
  const error = Object.freeze({
    code: failure.code,
    message: failure.message,
  })

  return Object.freeze({
    ok: false,
    status: failure.status,
    requestId,
    syncResponse: null,
    error,
  })
}

function createSuccess(requestId, syncResponse) {
  return Object.freeze({
    ok: true,
    status: 'syncResponseReceived',
    requestId,
    syncResponse,
    error: null,
  })
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

function readOwnDataRecord(value, expectedPropertyNames) {
  try {
    if (
      typeof value !== 'object' ||
      value === null ||
      Array.isArray(value)
    ) {
      return { ok: false }
    }

    const prototype = Object.getPrototypeOf(value)

    if (prototype !== Object.prototype && prototype !== null) {
      return { ok: false }
    }

    const ownKeys = Reflect.ownKeys(value)

    if (!hasExactPropertyNames(ownKeys, expectedPropertyNames)) {
      return { ok: false }
    }

    const properties = Object.create(null)

    for (const propertyName of expectedPropertyNames) {
      const descriptor = Object.getOwnPropertyDescriptor(value, propertyName)

      if (
        descriptor === undefined ||
        descriptor.enumerable !== true ||
        !Object.hasOwn(descriptor, 'value')
      ) {
        return { ok: false }
      }

      properties[propertyName] = descriptor.value
    }

    return { ok: true, properties }
  } catch {
    return { ok: false }
  }
}

function readExactDataArray(value, expectedLength) {
  try {
    if (!Array.isArray(value)) {
      return { ok: false }
    }

    const prototype = Object.getPrototypeOf(value)

    if (prototype !== Array.prototype && prototype !== null) {
      return { ok: false }
    }

    const lengthDescriptor = Object.getOwnPropertyDescriptor(value, 'length')

    if (
      lengthDescriptor === undefined ||
      lengthDescriptor.enumerable !== false ||
      !Object.hasOwn(lengthDescriptor, 'value') ||
      lengthDescriptor.value !== expectedLength
    ) {
      return { ok: false }
    }

    const ownKeys = Reflect.ownKeys(value)

    if (ownKeys.length !== expectedLength + 1) {
      return { ok: false }
    }

    const positionNames = new Set()

    for (const propertyName of ownKeys) {
      if (propertyName === 'length') {
        continue
      }

      if (
        typeof propertyName !== 'string' ||
        !/^(0|[1-9]\d*)$/.test(propertyName) ||
        Number(propertyName) >= expectedLength
      ) {
        return { ok: false }
      }

      positionNames.add(propertyName)
    }

    const projectedArray = []

    for (let index = 0; index < expectedLength; index += 1) {
      const propertyName = String(index)

      if (!positionNames.has(propertyName)) {
        return { ok: false }
      }

      const descriptor = Object.getOwnPropertyDescriptor(value, propertyName)

      if (
        descriptor === undefined ||
        descriptor.enumerable !== true ||
        !Object.hasOwn(descriptor, 'value')
      ) {
        return { ok: false }
      }

      projectedArray.push(descriptor.value)
    }

    return { ok: true, value: projectedArray }
  } catch {
    return { ok: false }
  }
}

function projectSuccessData(value) {
  if (value === null) {
    return { ok: true, value: null }
  }

  const record = readOwnDataRecord(value, SUCCESS_DATA_PROPERTY_NAMES)

  if (!record.ok) {
    return { ok: false }
  }

  return {
    ok: true,
    value: {
      status: record.properties.status,
      dataOrigin: record.properties.dataOrigin,
    },
  }
}

function projectResponseError(value) {
  if (value === null) {
    return { ok: true, value: null }
  }

  const record = readOwnDataRecord(value, RESPONSE_ERROR_PROPERTY_NAMES)

  if (!record.ok) {
    return { ok: false }
  }

  const details = readExactDataArray(record.properties.details, 0)

  if (!details.ok) {
    return { ok: false }
  }

  return {
    ok: true,
    value: {
      code: record.properties.code,
      message: record.properties.message,
      retryable: record.properties.retryable,
      details: details.value,
    },
  }
}

function projectMeta(value) {
  const record = readOwnDataRecord(value, META_PROPERTY_NAMES)

  if (!record.ok) {
    return { ok: false }
  }

  const processedBy = readExactDataArray(record.properties.processedBy, 1)

  if (!processedBy.ok) {
    return { ok: false }
  }

  return {
    ok: true,
    value: {
      durationMs: record.properties.durationMs,
      processedBy: processedBy.value,
    },
  }
}

function projectSyncResponse(transportResponse) {
  const response = readOwnDataRecord(
    transportResponse,
    RESPONSE_PROPERTY_NAMES
  )

  if (!response.ok) {
    return { ok: false }
  }

  const data = projectSuccessData(response.properties.data)
  const error = projectResponseError(response.properties.error)
  const warnings = readExactDataArray(response.properties.warnings, 0)
  const meta = projectMeta(response.properties.meta)

  if (!data.ok || !error.ok || !warnings.ok || !meta.ok) {
    return { ok: false }
  }

  return {
    ok: true,
    syncResponse: {
      version: response.properties.version,
      success: response.properties.success,
      requestId: response.properties.requestId,
      action: response.properties.action,
      handledBy: response.properties.handledBy,
      timestamp: response.properties.timestamp,
      data: data.value,
      error: error.value,
      warnings: warnings.value,
      meta: meta.value,
    },
  }
}

function freezeSyncResponse(syncResponse) {
  if (syncResponse.data !== null) {
    Object.freeze(syncResponse.data)
  }

  if (syncResponse.error !== null) {
    Object.freeze(syncResponse.error.details)
    Object.freeze(syncResponse.error)
  }

  Object.freeze(syncResponse.warnings)
  Object.freeze(syncResponse.meta.processedBy)
  Object.freeze(syncResponse.meta)

  return Object.freeze(syncResponse)
}

function createFrozenSyncRequest(requestId, timestamp) {
  return Object.freeze({
    version: SYNC_CONTRACT_VERSION,
    action: SYNC_TEST_ACTION,
    source: GOLDENDAWN_SOURCE,
    requestId,
    timestamp,
    payload: Object.freeze({}),
  })
}

function buildSyncRequests(generateRequestId, getCurrentTimestamp) {
  let generatedRequestId
  let currentTimestamp
  let requestIdRead = true
  let timestampRead = true

  try {
    generatedRequestId = generateRequestId()
  } catch {
    requestIdRead = false
  }

  try {
    currentTimestamp = getCurrentTimestamp()
  } catch {
    timestampRead = false
  }

  if (
    !requestIdRead ||
    !timestampRead ||
    typeof generatedRequestId !== 'string' ||
    typeof currentTimestamp !== 'string'
  ) {
    return { ok: false }
  }

  const transportRequest = createFrozenSyncRequest(
    generatedRequestId,
    currentTimestamp
  )
  const correlatedRequest = createFrozenSyncRequest(
    generatedRequestId,
    currentTimestamp
  )

  let transportValidation
  let correlationValidation

  try {
    transportValidation = validateSyncRequest(
      transportRequest,
      currentTimestamp
    )
    correlationValidation = validateSyncRequest(
      correlatedRequest,
      currentTimestamp
    )
  } catch {
    return { ok: false }
  }

  if (
    transportValidation.ok !== true ||
    correlationValidation.ok !== true
  ) {
    return { ok: false }
  }

  return {
    ok: true,
    requestId: generatedRequestId,
    transportRequest,
    correlatedRequest,
  }
}

function resolveTransportMethod(syncTransport) {
  if (
    (typeof syncTransport !== 'object' || syncTransport === null) &&
    typeof syncTransport !== 'function'
  ) {
    return { ok: false }
  }

  let sendSyncRequest

  try {
    sendSyncRequest = syncTransport.sendSyncRequest
  } catch {
    return { ok: false }
  }

  return typeof sendSyncRequest === 'function'
    ? { ok: true, sendSyncRequest }
    : { ok: false }
}

function isValidSyncResponse(syncResponse, correlatedRequest) {
  try {
    return validateSyncResponse(syncResponse, correlatedRequest).ok === true
  } catch {
    return false
  }
}

export function createSyncService({
  syncTransport,
  generateRequestId = defaultCryptoRequestIdGenerator,
  getCurrentTimestamp = defaultUtcClock,
} = {}) {
  async function runSyncTest() {
    if (arguments.length !== 0) {
      return createFailure(SYNC_SERVICE_FAILURES.invalidInvocation)
    }

    const transportMethod = resolveTransportMethod(syncTransport)

    if (!transportMethod.ok) {
      return createFailure(SYNC_SERVICE_FAILURES.unavailable)
    }

    const requestBuild = buildSyncRequests(
      generateRequestId,
      getCurrentTimestamp
    )

    if (!requestBuild.ok) {
      return createFailure(SYNC_SERVICE_FAILURES.requestBuildFailed)
    }

    let transportResponse

    try {
      const transportResult = Reflect.apply(
        transportMethod.sendSyncRequest,
        syncTransport,
        [requestBuild.transportRequest]
      )
      transportResponse = await transportResult
    } catch {
      return createFailure(
        SYNC_SERVICE_FAILURES.transportFailed,
        requestBuild.requestId
      )
    }

    const responseProjection = projectSyncResponse(transportResponse)

    if (
      !responseProjection.ok ||
      !isValidSyncResponse(
        responseProjection.syncResponse,
        requestBuild.correlatedRequest
      )
    ) {
      return createFailure(
        SYNC_SERVICE_FAILURES.invalidResponse,
        requestBuild.requestId
      )
    }

    const frozenSyncResponse = freezeSyncResponse(
      responseProjection.syncResponse
    )

    if (!isValidSyncResponse(
      frozenSyncResponse,
      requestBuild.correlatedRequest
    )) {
      return createFailure(
        SYNC_SERVICE_FAILURES.invalidResponse,
        requestBuild.requestId
      )
    }

    return createSuccess(requestBuild.requestId, frozenSyncResponse)
  }

  return Object.freeze({ runSyncTest })
}
