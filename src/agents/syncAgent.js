import {
  SYNC_CONTRACT_VALIDATION_ERROR_CODES,
  validateSyncRequest,
  validateSyncResponse,
} from '../contracts/syncContract.js'

const trustedObjectPrototype = Object.prototype
const trustedObjectFreeze = Object.freeze
const trustedObjectGetOwnPropertyDescriptor =
  Object.getOwnPropertyDescriptor
const trustedObjectGetPrototypeOf = Object.getPrototypeOf
const trustedObjectHasOwn = Object.hasOwn
const trustedObjectIsFrozen = Object.isFrozen
const trustedReflectOwnKeys = Reflect.ownKeys

const SYNC_AGENT_API_PROPERTY_NAMES = trustedObjectFreeze([
  'processSyncRequest',
])
const SYNC_AGENT_ERROR_PROPERTY_NAMES = trustedObjectFreeze([
  'code',
  'message',
])
const SYNC_AGENT_RESULT_PROPERTY_NAMES = trustedObjectFreeze([
  'ok',
  'status',
  'syncResponse',
  'error',
])
const SYNC_REQUEST_PROPERTY_NAMES = trustedObjectFreeze([
  'version',
  'action',
  'source',
  'requestId',
  'timestamp',
  'payload',
])
const SYNC_RESPONSE_PROPERTY_NAMES = trustedObjectFreeze([
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
const SUCCESS_DATA_PROPERTY_NAMES = trustedObjectFreeze([
  'status',
  'dataOrigin',
])
const META_PROPERTY_NAMES = trustedObjectFreeze([
  'durationMs',
  'processedBy',
])
const VALIDATION_RESULT_PROPERTY_NAMES = trustedObjectFreeze(['ok', 'errors'])
const VALIDATION_ERROR_PROPERTY_NAMES = trustedObjectFreeze([
  'code',
  'path',
  'message',
])
const EMPTY_PROPERTY_NAMES = trustedObjectFreeze([])

const CANONICAL_UTC_TIMESTAMP_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

const SYNC_TEST_ACTION = 'syncTest'
const SYNC_AGENT_HANDLER = 'SyncAgent'
const SYNTHETIC_DATA_ORIGIN = 'synthetic'
const SYNC_AGENT_ACTIONS = trustedObjectFreeze([SYNC_TEST_ACTION])

const SYNC_AGENT_FAILURES = trustedObjectFreeze({
  invalidInvocation: trustedObjectFreeze({
    status: 'invalidInvocation',
    code: 'invalidSyncAgentInvocation',
    message: 'Der lokale SyncAgent erwartet genau einen SyncRequest.',
  }),
  requestRejected: trustedObjectFreeze({
    status: 'syncRequestRejected',
    code: 'syncAgentRequestRejected',
    message: 'Die Sync-Anfrage wurde vom lokalen SyncAgent abgelehnt.',
  }),
  agentFailed: trustedObjectFreeze({
    status: 'agentFailed',
    code: 'syncAgentFailed',
    message:
      'Die Sync-Anfrage konnte vom lokalen SyncAgent nicht sicher verarbeitet werden.',
  }),
})

function defaultUtcClock() {
  return new Date().toISOString()
}

function createFailure(failure) {
  const error = {
    code: failure.code,
    message: failure.message,
  }

  trustedObjectFreeze(error)

  const verifiedError = matchesFrozenOrdinaryDataRecord(
    error,
    SYNC_AGENT_ERROR_PROPERTY_NAMES,
    [failure.code, failure.message]
  )

  if (!verifiedError) {
    throw new TypeError('sync agent error result creation failed')
  }

  const result = {
    ok: false,
    status: failure.status,
    syncResponse: null,
    error,
  }

  trustedObjectFreeze(result)

  const verifiedResult = matchesFrozenOrdinaryDataRecord(
    result,
    SYNC_AGENT_RESULT_PROPERTY_NAMES,
    [false, failure.status, null, error]
  )

  if (!verifiedResult) {
    throw new TypeError('sync agent failure result creation failed')
  }

  return result
}

function createSuccess(syncResponse) {
  const result = {
    ok: true,
    status: 'syncResponseCreated',
    syncResponse,
    error: null,
  }

  trustedObjectFreeze(result)

  const verifiedResult = matchesFrozenOrdinaryDataRecord(
    result,
    SYNC_AGENT_RESULT_PROPERTY_NAMES,
    [true, 'syncResponseCreated', syncResponse, null]
  )

  if (!verifiedResult) {
    return null
  }

  return result
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

function matchesFrozenOrdinaryDataRecord(
  value,
  expectedPropertyNames,
  expectedPropertyValues
) {
  try {
    if (
      typeof value !== 'object' ||
      value === null ||
      expectedPropertyNames.length !== expectedPropertyValues.length ||
      trustedObjectGetPrototypeOf(value) !== trustedObjectPrototype ||
      trustedObjectIsFrozen(value) !== true
    ) {
      return false
    }

    const ownKeys = trustedReflectOwnKeys(value)

    if (ownKeys.length !== expectedPropertyNames.length) {
      return false
    }

    for (
      let expectedIndex = 0;
      expectedIndex < expectedPropertyNames.length;
      expectedIndex += 1
    ) {
      const propertyName = expectedPropertyNames[expectedIndex]
      let propertyFound = false

      for (
        let ownKeyIndex = 0;
        ownKeyIndex < ownKeys.length;
        ownKeyIndex += 1
      ) {
        if (ownKeys[ownKeyIndex] === propertyName) {
          propertyFound = true
          break
        }
      }

      if (!propertyFound) {
        return false
      }

      const descriptor = trustedObjectGetOwnPropertyDescriptor(
        value,
        propertyName
      )

      if (
        descriptor === undefined ||
        descriptor.enumerable !== true ||
        !trustedObjectHasOwn(descriptor, 'value') ||
        descriptor.value !== expectedPropertyValues[expectedIndex]
      ) {
        return false
      }
    }
  } catch {
    return false
  }

  return true
}

function readExactDataArray(value, expectedLength) {
  try {
    if (!Array.isArray(value)) {
      return { ok: false }
    }

    const prototype = Object.getPrototypeOf(value)

    if (prototype !== Array.prototype) {
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

    const expectedPropertyNames = []

    for (let index = 0; index < expectedLength; index += 1) {
      expectedPropertyNames.push(String(index))
    }

    expectedPropertyNames.push('length')

    if (!hasExactPropertyNames(
      Reflect.ownKeys(value),
      expectedPropertyNames
    )) {
      return { ok: false }
    }

    const values = []

    for (let index = 0; index < expectedLength; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(
        value,
        String(index)
      )

      if (
        descriptor === undefined ||
        descriptor.enumerable !== true ||
        !Object.hasOwn(descriptor, 'value')
      ) {
        return { ok: false }
      }

      values.push(descriptor.value)
    }

    return { ok: true, values }
  } catch {
    return { ok: false }
  }
}

function readValidationResult(validationResult) {
  const result = readOwnDataRecord(
    validationResult,
    VALIDATION_RESULT_PROPERTY_NAMES
  )

  if (
    !result.ok ||
    typeof result.properties.ok !== 'boolean'
  ) {
    return { ok: false }
  }

  const errors = result.properties.errors
  let errorCount

  try {
    if (!Array.isArray(errors)) {
      return { ok: false }
    }

    const prototype = Object.getPrototypeOf(errors)
    const lengthDescriptor = Object.getOwnPropertyDescriptor(errors, 'length')

    if (
      prototype !== Array.prototype ||
      lengthDescriptor === undefined ||
      lengthDescriptor.enumerable !== false ||
      !Object.hasOwn(lengthDescriptor, 'value') ||
      !Number.isSafeInteger(lengthDescriptor.value) ||
      lengthDescriptor.value < 0
    ) {
      return { ok: false }
    }

    errorCount = lengthDescriptor.value

    const expectedPropertyNames = []

    for (let index = 0; index < errorCount; index += 1) {
      expectedPropertyNames.push(String(index))
    }

    expectedPropertyNames.push('length')

    if (!hasExactPropertyNames(
      Reflect.ownKeys(errors),
      expectedPropertyNames
    )) {
      return { ok: false }
    }
  } catch {
    return { ok: false }
  }

  const errorCodes = []

  for (let index = 0; index < errorCount; index += 1) {
    let errorDescriptor

    try {
      errorDescriptor = Object.getOwnPropertyDescriptor(errors, String(index))
    } catch {
      return { ok: false }
    }

    if (
      errorDescriptor === undefined ||
      errorDescriptor.enumerable !== true ||
      !Object.hasOwn(errorDescriptor, 'value')
    ) {
      return { ok: false }
    }

    const validationError = readOwnDataRecord(
      errorDescriptor.value,
      VALIDATION_ERROR_PROPERTY_NAMES
    )

    if (
      !validationError.ok ||
      typeof validationError.properties.code !== 'string' ||
      typeof validationError.properties.path !== 'string' ||
      typeof validationError.properties.message !== 'string'
    ) {
      return { ok: false }
    }

    errorCodes.push(validationError.properties.code)
  }

  if (result.properties.ok === true && errorCodes.length === 0) {
    return { ok: true, accepted: true, errorCodes }
  }

  if (result.properties.ok === false && errorCodes.length > 0) {
    return { ok: true, accepted: false, errorCodes }
  }

  return { ok: false }
}

function capturePrimitiveString(dependency) {
  let value

  try {
    value = Reflect.apply(dependency, undefined, [])
  } catch {
    return { ok: false }
  }

  return typeof value === 'string'
    ? { ok: true, value }
    : { ok: false }
}

function isCanonicalUtcTimestamp(value) {
  if (
    value.length !== 24 ||
    !CANONICAL_UTC_TIMESTAMP_PATTERN.test(value)
  ) {
    return false
  }

  const timestampMilliseconds = Date.parse(value)

  if (!Number.isFinite(timestampMilliseconds)) {
    return false
  }

  return new Date(timestampMilliseconds).toISOString() === value
}

function validateRequest(syncRequest, referenceTimestamp) {
  try {
    return readValidationResult(
      validateSyncRequest(syncRequest, referenceTimestamp)
    )
  } catch {
    return { ok: false }
  }
}

function validateResponse(syncResponse, correlatedRequest) {
  try {
    return readValidationResult(
      validateSyncResponse(syncResponse, correlatedRequest)
    )
  } catch {
    return { ok: false }
  }
}

function projectSyncRequest(syncRequest) {
  const request = readOwnDataRecord(
    syncRequest,
    SYNC_REQUEST_PROPERTY_NAMES
  )

  if (!request.ok) {
    return { ok: false }
  }

  const callerPayload = readOwnDataRecord(
    request.properties.payload,
    EMPTY_PROPERTY_NAMES
  )

  if (!callerPayload.ok) {
    return { ok: false }
  }

  const payload = {}
  const projectedRequest = {
    version: request.properties.version,
    action: request.properties.action,
    source: request.properties.source,
    requestId: request.properties.requestId,
    timestamp: request.properties.timestamp,
    payload,
  }

  return {
    ok: true,
    payload,
    projectedRequest,
    expectedValues: {
      version: request.properties.version,
      action: request.properties.action,
      source: request.properties.source,
      requestId: request.properties.requestId,
      timestamp: request.properties.timestamp,
    },
  }
}

function matchesProjectedRequest(projection) {
  const request = readOwnDataRecord(
    projection.projectedRequest,
    SYNC_REQUEST_PROPERTY_NAMES
  )

  if (!request.ok) {
    return false
  }

  const payload = readOwnDataRecord(
    request.properties.payload,
    EMPTY_PROPERTY_NAMES
  )

  return (
    payload.ok &&
    request.properties.payload === projection.payload &&
    request.properties.version === projection.expectedValues.version &&
    request.properties.action === projection.expectedValues.action &&
    request.properties.source === projection.expectedValues.source &&
    request.properties.requestId === projection.expectedValues.requestId &&
    request.properties.timestamp === projection.expectedValues.timestamp
  )
}

function freezeProjectedRequest(projection) {
  Object.freeze(projection.payload)
  Object.freeze(projection.projectedRequest)

  return (
    trustedObjectIsFrozen(projection.payload) &&
    trustedObjectIsFrozen(projection.projectedRequest) &&
    matchesProjectedRequest(projection)
  )
}

function buildSyncResponse(internalRequest, timestamp) {
  const data = {
    status: 'ok',
    dataOrigin: SYNTHETIC_DATA_ORIGIN,
  }
  const warnings = []
  const processedBy = [SYNC_AGENT_HANDLER]
  const meta = {
    durationMs: 0,
    processedBy,
  }
  const syncResponse = {
    version: internalRequest.version,
    success: true,
    requestId: internalRequest.requestId,
    action: internalRequest.action,
    handledBy: SYNC_AGENT_HANDLER,
    timestamp,
    data,
    error: null,
    warnings,
    meta,
  }

  return {
    data,
    warnings,
    processedBy,
    meta,
    syncResponse,
  }
}

function matchesExpectedSyncResponse(responseBuild, internalRequest, timestamp) {
  const response = readOwnDataRecord(
    responseBuild.syncResponse,
    SYNC_RESPONSE_PROPERTY_NAMES
  )

  if (!response.ok) {
    return false
  }

  const data = readOwnDataRecord(
    response.properties.data,
    SUCCESS_DATA_PROPERTY_NAMES
  )
  const warnings = readExactDataArray(response.properties.warnings, 0)
  const meta = readOwnDataRecord(
    response.properties.meta,
    META_PROPERTY_NAMES
  )

  if (!data.ok || !warnings.ok || !meta.ok) {
    return false
  }

  const processedBy = readExactDataArray(
    meta.properties.processedBy,
    1
  )

  return (
    processedBy.ok &&
    response.properties.version === internalRequest.version &&
    response.properties.success === true &&
    response.properties.requestId === internalRequest.requestId &&
    response.properties.action === internalRequest.action &&
    response.properties.handledBy === SYNC_AGENT_HANDLER &&
    response.properties.timestamp === timestamp &&
    response.properties.data === responseBuild.data &&
    data.properties.status === 'ok' &&
    data.properties.dataOrigin === SYNTHETIC_DATA_ORIGIN &&
    response.properties.error === null &&
    response.properties.warnings === responseBuild.warnings &&
    response.properties.meta === responseBuild.meta &&
    meta.properties.durationMs === 0 &&
    meta.properties.processedBy === responseBuild.processedBy &&
    processedBy.values[0] === SYNC_AGENT_HANDLER
  )
}

function freezeSyncResponse(responseBuild) {
  Object.freeze(responseBuild.data)
  Object.freeze(responseBuild.warnings)
  Object.freeze(responseBuild.processedBy)
  Object.freeze(responseBuild.meta)
  Object.freeze(responseBuild.syncResponse)

  return (
    trustedObjectIsFrozen(responseBuild.data) &&
    trustedObjectIsFrozen(responseBuild.warnings) &&
    trustedObjectIsFrozen(responseBuild.processedBy) &&
    trustedObjectIsFrozen(responseBuild.meta) &&
    trustedObjectIsFrozen(responseBuild.syncResponse)
  )
}

export function createSyncAgent({
  getCurrentTimestamp = defaultUtcClock,
} = {}) {
  function processSyncRequest(syncRequest) {
    if (arguments.length !== 1) {
      return createFailure(SYNC_AGENT_FAILURES.invalidInvocation)
    }

    try {
      const timestamp = capturePrimitiveString(getCurrentTimestamp)

      if (!timestamp.ok) {
        return createFailure(SYNC_AGENT_FAILURES.agentFailed)
      }

      const originalValidation = validateRequest(
        syncRequest,
        timestamp.value
      )

      if (!originalValidation.ok) {
        return createFailure(SYNC_AGENT_FAILURES.agentFailed)
      }

      if (originalValidation.errorCodes.includes(
        SYNC_CONTRACT_VALIDATION_ERROR_CODES.INVALID_REFERENCE_TIMESTAMP
      )) {
        return createFailure(SYNC_AGENT_FAILURES.agentFailed)
      }

      if (!originalValidation.accepted) {
        if (!isCanonicalUtcTimestamp(timestamp.value)) {
          return createFailure(SYNC_AGENT_FAILURES.agentFailed)
        }

        return createFailure(SYNC_AGENT_FAILURES.requestRejected)
      }

      const projection = projectSyncRequest(syncRequest)

      if (!projection.ok || !matchesProjectedRequest(projection)) {
        return createFailure(SYNC_AGENT_FAILURES.agentFailed)
      }

      const projectedValidation = validateRequest(
        projection.projectedRequest,
        timestamp.value
      )

      if (!projectedValidation.ok || !projectedValidation.accepted) {
        return createFailure(SYNC_AGENT_FAILURES.agentFailed)
      }

      if (!freezeProjectedRequest(projection)) {
        return createFailure(SYNC_AGENT_FAILURES.agentFailed)
      }

      const frozenRequestValidation = validateRequest(
        projection.projectedRequest,
        timestamp.value
      )

      if (
        !frozenRequestValidation.ok ||
        !frozenRequestValidation.accepted ||
        !matchesProjectedRequest(projection)
      ) {
        return createFailure(SYNC_AGENT_FAILURES.agentFailed)
      }

      if (!SYNC_AGENT_ACTIONS.includes(projection.expectedValues.action)) {
        return createFailure(SYNC_AGENT_FAILURES.requestRejected)
      }

      const responseBuild = buildSyncResponse(
        projection.projectedRequest,
        timestamp.value
      )
      const responseValidation = validateResponse(
        responseBuild.syncResponse,
        projection.projectedRequest
      )

      if (
        !responseValidation.ok ||
        !responseValidation.accepted ||
        !matchesExpectedSyncResponse(
          responseBuild,
          projection.projectedRequest,
          timestamp.value
        )
      ) {
        return createFailure(SYNC_AGENT_FAILURES.agentFailed)
      }

      if (!freezeSyncResponse(responseBuild)) {
        return createFailure(SYNC_AGENT_FAILURES.agentFailed)
      }

      const frozenResponseValidation = validateResponse(
        responseBuild.syncResponse,
        projection.projectedRequest
      )

      if (
        !frozenResponseValidation.ok ||
        !frozenResponseValidation.accepted ||
        !matchesExpectedSyncResponse(
          responseBuild,
          projection.projectedRequest,
          timestamp.value
        )
      ) {
        return createFailure(SYNC_AGENT_FAILURES.agentFailed)
      }

      const successResult = createSuccess(responseBuild.syncResponse)

      if (successResult === null) {
        return createFailure(SYNC_AGENT_FAILURES.agentFailed)
      }

      return successResult
    } catch {
      return createFailure(SYNC_AGENT_FAILURES.agentFailed)
    }
  }

  trustedObjectFreeze(processSyncRequest.prototype)
  trustedObjectFreeze(processSyncRequest)

  const api = { processSyncRequest }

  trustedObjectFreeze(api)

  const verifiedApi = matchesFrozenOrdinaryDataRecord(
    api,
    SYNC_AGENT_API_PROPERTY_NAMES,
    [processSyncRequest]
  )

  if (
    !verifiedApi ||
    trustedObjectIsFrozen(processSyncRequest.prototype) !== true ||
    trustedObjectIsFrozen(processSyncRequest) !== true
  ) {
    throw new TypeError('sync agent api creation failed')
  }

  return api
}
