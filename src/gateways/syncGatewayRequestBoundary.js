import {
  SYNC_CONTRACT_RESPONSE_ERROR_PROFILES,
  SYNC_CONTRACT_VALIDATION_ERROR_CODES,
  SYNC_CONTRACT_VERSION,
  validateSyncGatewayErrorResponse,
  validateSyncRawBodySize,
  validateSyncRequest,
} from '../contracts/syncContract.js'

const SYNC_REQUEST_PROPERTY_NAMES = Object.freeze([
  'version',
  'action',
  'source',
  'requestId',
  'timestamp',
  'payload',
])
const EMPTY_PROPERTY_NAMES = Object.freeze([])

const SYNC_GATEWAY_BOUNDARY_FAILURES = Object.freeze({
  invalidInvocation: Object.freeze({
    status: 'invalidInvocation',
    code: 'invalidSyncGatewayBoundaryInvocation',
    message: 'Die Sync-Gateway-Grenze erwartet genau einen Raw-Body-Wert.',
  }),
  boundaryFailed: Object.freeze({
    status: 'boundaryFailed',
    code: 'syncGatewayBoundaryFailed',
    message:
      'Die Sync-Anfrage konnte an der Gateway-Grenze nicht sicher verarbeitet werden.',
  }),
})

function defaultCryptoGatewayRequestIdGenerator() {
  const cryptoProvider = globalThis.crypto
  const randomUuidMethod = cryptoProvider?.randomUUID

  if (typeof randomUuidMethod !== 'function') {
    throw new TypeError('crypto.randomUUID is unavailable')
  }

  const randomUuid = Reflect.apply(randomUuidMethod, cryptoProvider, [])

  if (typeof randomUuid !== 'string') {
    throw new TypeError('crypto.randomUUID returned an invalid value')
  }

  return 'gateway_' + randomUuid
}

function defaultUtcClock() {
  return new Date().toISOString()
}

function createLocalFailure(failure) {
  const error = Object.freeze({
    code: failure.code,
    message: failure.message,
  })

  return Object.freeze({
    ok: false,
    status: failure.status,
    syncRequest: null,
    gatewayErrorResponse: null,
    error,
  })
}

function createAcceptedResult(syncRequest) {
  return Object.freeze({
    ok: true,
    status: 'syncRequestAccepted',
    syncRequest,
    gatewayErrorResponse: null,
    error: null,
  })
}

function createRejectedResult(gatewayErrorResponse) {
  return Object.freeze({
    ok: false,
    status: 'syncRequestRejected',
    syncRequest: null,
    gatewayErrorResponse,
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

function readValidationResult(validationResult) {
  try {
    const result = readOwnDataRecord(validationResult, ['ok', 'errors'])

    if (
      !result.ok ||
      typeof result.properties.ok !== 'boolean' ||
      !Array.isArray(result.properties.errors)
    ) {
      return { ok: false }
    }

    const errors = result.properties.errors
    const errorsPrototype = Object.getPrototypeOf(errors)
    const lengthDescriptor = Object.getOwnPropertyDescriptor(
      errors,
      'length'
    )

    if (
      errorsPrototype !== Array.prototype ||
      lengthDescriptor === undefined ||
      lengthDescriptor.enumerable !== false ||
      !Object.hasOwn(lengthDescriptor, 'value') ||
      !Number.isSafeInteger(lengthDescriptor.value) ||
      lengthDescriptor.value < 0
    ) {
      return { ok: false }
    }

    const expectedErrorKeys = []

    for (let index = 0; index < lengthDescriptor.value; index += 1) {
      expectedErrorKeys.push(String(index))
    }

    expectedErrorKeys.push('length')

    if (!hasExactPropertyNames(
      Reflect.ownKeys(errors),
      expectedErrorKeys
    )) {
      return { ok: false }
    }

    const errorCodes = []

    for (let index = 0; index < lengthDescriptor.value; index += 1) {
      const errorDescriptor = Object.getOwnPropertyDescriptor(
        errors,
        String(index)
      )

      if (
        errorDescriptor === undefined ||
        errorDescriptor.enumerable !== true ||
        !Object.hasOwn(errorDescriptor, 'value')
      ) {
        return { ok: false }
      }

      const codeDescriptor = Object.getOwnPropertyDescriptor(
        errorDescriptor.value,
        'code'
      )

      if (
        codeDescriptor === undefined ||
        codeDescriptor.enumerable !== true ||
        !Object.hasOwn(codeDescriptor, 'value') ||
        typeof codeDescriptor.value !== 'string'
      ) {
        return { ok: false }
      }

      errorCodes.push(codeDescriptor.value)
    }

    if (result.properties.ok === true && errorCodes.length === 0) {
      return { ok: true, accepted: true, errorCodes }
    }

    if (result.properties.ok === false && errorCodes.length > 0) {
      return { ok: true, accepted: false, errorCodes }
    }

    return { ok: false }
  } catch {
    return { ok: false }
  }
}

function resolveJsonParseMethod() {
  let jsonProvider
  let parseJson

  try {
    jsonProvider = globalThis.JSON
    parseJson = jsonProvider?.parse
  } catch {
    return { ok: false }
  }

  return typeof parseJson === 'function'
    ? { ok: true, jsonProvider, parseJson }
    : { ok: false }
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

function projectSyncRequest(parsedRequest) {
  const request = readOwnDataRecord(
    parsedRequest,
    SYNC_REQUEST_PROPERTY_NAMES
  )

  if (!request.ok) {
    return { ok: false }
  }

  const payload = readOwnDataRecord(
    request.properties.payload,
    EMPTY_PROPERTY_NAMES
  )

  if (!payload.ok) {
    return { ok: false }
  }

  return {
    ok: true,
    syncRequest: {
      version: request.properties.version,
      action: request.properties.action,
      source: request.properties.source,
      requestId: request.properties.requestId,
      timestamp: request.properties.timestamp,
      payload: {},
    },
  }
}

function isSuccessfulRequestValidation(syncRequest, referenceTimestamp) {
  const validation = readValidationResult(
    validateSyncRequest(syncRequest, referenceTimestamp)
  )

  return validation.ok && validation.accepted
}

function freezeSyncRequest(syncRequest) {
  Object.freeze(syncRequest.payload)
  Object.freeze(syncRequest)

  return (
    Object.isFrozen(syncRequest.payload) &&
    Object.isFrozen(syncRequest)
  )
}

function freezeGatewayErrorResponse(gatewayErrorResponse) {
  Object.freeze(gatewayErrorResponse.error.details)
  Object.freeze(gatewayErrorResponse.error)
  Object.freeze(gatewayErrorResponse.warnings)
  Object.freeze(gatewayErrorResponse.meta.processedBy)
  Object.freeze(gatewayErrorResponse.meta)
  Object.freeze(gatewayErrorResponse)

  return (
    Object.isFrozen(gatewayErrorResponse.error.details) &&
    Object.isFrozen(gatewayErrorResponse.error) &&
    Object.isFrozen(gatewayErrorResponse.warnings) &&
    Object.isFrozen(gatewayErrorResponse.meta.processedBy) &&
    Object.isFrozen(gatewayErrorResponse.meta) &&
    Object.isFrozen(gatewayErrorResponse)
  )
}

function isSuccessfulGatewayResponseValidation(gatewayErrorResponse) {
  const validation = readValidationResult(
    validateSyncGatewayErrorResponse(gatewayErrorResponse)
  )

  return validation.ok && validation.accepted
}

function buildGatewayErrorResponse(
  profileName,
  timestamp,
  generateGatewayRequestId
) {
  const generatedRequestId = capturePrimitiveString(
    generateGatewayRequestId
  )

  if (!generatedRequestId.ok) {
    return { ok: false }
  }

  const profile = SYNC_CONTRACT_RESPONSE_ERROR_PROFILES[profileName]

  if (profile === undefined) {
    return { ok: false }
  }

  const gatewayErrorResponse = {
    version: SYNC_CONTRACT_VERSION,
    success: false,
    requestId: generatedRequestId.value,
    action: null,
    handledBy: null,
    timestamp,
    data: null,
    error: {
      code: profile.code,
      message: profile.message,
      retryable: profile.retryable,
      details: [],
    },
    warnings: [],
    meta: {
      durationMs: 0,
      processedBy: [],
    },
  }

  if (!isSuccessfulGatewayResponseValidation(gatewayErrorResponse)) {
    return { ok: false }
  }

  if (!freezeGatewayErrorResponse(gatewayErrorResponse)) {
    return { ok: false }
  }

  if (!isSuccessfulGatewayResponseValidation(gatewayErrorResponse)) {
    return { ok: false }
  }

  return { ok: true, gatewayErrorResponse }
}

function createGatewayRejectionWithTimestamp(
  profileName,
  timestamp,
  generateGatewayRequestId
) {
  const responseBuild = buildGatewayErrorResponse(
    profileName,
    timestamp,
    generateGatewayRequestId
  )

  return responseBuild.ok
    ? createRejectedResult(responseBuild.gatewayErrorResponse)
    : createLocalFailure(SYNC_GATEWAY_BOUNDARY_FAILURES.boundaryFailed)
}

function createGatewayRejection(
  profileName,
  generateGatewayRequestId,
  getCurrentTimestamp
) {
  const timestamp = capturePrimitiveString(getCurrentTimestamp)

  if (!timestamp.ok) {
    return createLocalFailure(
      SYNC_GATEWAY_BOUNDARY_FAILURES.boundaryFailed
    )
  }

  return createGatewayRejectionWithTimestamp(
    profileName,
    timestamp.value,
    generateGatewayRequestId
  )
}

function getRequestRejectionProfile(errorCodes) {
  if (
    errorCodes.length === 1 &&
    errorCodes[0] ===
      SYNC_CONTRACT_VALIDATION_ERROR_CODES.UNSUPPORTED_VERSION
  ) {
    return 'UNSUPPORTED_VERSION'
  }

  if (
    errorCodes.length === 1 &&
    errorCodes[0] === SYNC_CONTRACT_VALIDATION_ERROR_CODES.UNKNOWN_ACTION
  ) {
    return 'UNKNOWN_ACTION'
  }

  return 'VALIDATION_ERROR'
}

export function createSyncGatewayRequestBoundary({
  generateGatewayRequestId = defaultCryptoGatewayRequestIdGenerator,
  getCurrentTimestamp = defaultUtcClock,
} = {}) {
  function processSyncRawBody(rawBody) {
    if (arguments.length !== 1) {
      return createLocalFailure(
        SYNC_GATEWAY_BOUNDARY_FAILURES.invalidInvocation
      )
    }

    try {
      const rawBodyValidation = readValidationResult(
        validateSyncRawBodySize(rawBody)
      )

      if (!rawBodyValidation.ok) {
        return createLocalFailure(
          SYNC_GATEWAY_BOUNDARY_FAILURES.boundaryFailed
        )
      }

      if (!rawBodyValidation.accepted) {
        const profileName = rawBodyValidation.errorCodes.includes(
          SYNC_CONTRACT_VALIDATION_ERROR_CODES.RAW_BODY_TOO_LARGE
        )
          ? 'PAYLOAD_TOO_LARGE'
          : 'VALIDATION_ERROR'

        return createGatewayRejection(
          profileName,
          generateGatewayRequestId,
          getCurrentTimestamp
        )
      }

      const jsonParser = resolveJsonParseMethod()

      if (!jsonParser.ok) {
        return createLocalFailure(
          SYNC_GATEWAY_BOUNDARY_FAILURES.boundaryFailed
        )
      }

      let parsedRequest

      try {
        parsedRequest = Reflect.apply(
          jsonParser.parseJson,
          jsonParser.jsonProvider,
          [rawBody]
        )
      } catch {
        return createGatewayRejection(
          'INVALID_JSON',
          generateGatewayRequestId,
          getCurrentTimestamp
        )
      }

      const timestamp = capturePrimitiveString(getCurrentTimestamp)

      if (!timestamp.ok) {
        return createLocalFailure(
          SYNC_GATEWAY_BOUNDARY_FAILURES.boundaryFailed
        )
      }

      const parsedRequestValidation = readValidationResult(
        validateSyncRequest(parsedRequest, timestamp.value)
      )

      if (!parsedRequestValidation.ok) {
        return createLocalFailure(
          SYNC_GATEWAY_BOUNDARY_FAILURES.boundaryFailed
        )
      }

      if (
        parsedRequestValidation.errorCodes.includes(
          SYNC_CONTRACT_VALIDATION_ERROR_CODES.INVALID_REFERENCE_TIMESTAMP
        )
      ) {
        return createLocalFailure(
          SYNC_GATEWAY_BOUNDARY_FAILURES.boundaryFailed
        )
      }

      if (!parsedRequestValidation.accepted) {
        return createGatewayRejectionWithTimestamp(
          getRequestRejectionProfile(
            parsedRequestValidation.errorCodes
          ),
          timestamp.value,
          generateGatewayRequestId
        )
      }

      const projection = projectSyncRequest(parsedRequest)

      if (
        !projection.ok ||
        !isSuccessfulRequestValidation(
          projection.syncRequest,
          timestamp.value
        )
      ) {
        return createLocalFailure(
          SYNC_GATEWAY_BOUNDARY_FAILURES.boundaryFailed
        )
      }

      if (!freezeSyncRequest(projection.syncRequest)) {
        return createLocalFailure(
          SYNC_GATEWAY_BOUNDARY_FAILURES.boundaryFailed
        )
      }

      if (!isSuccessfulRequestValidation(
        projection.syncRequest,
        timestamp.value
      )) {
        return createLocalFailure(
          SYNC_GATEWAY_BOUNDARY_FAILURES.boundaryFailed
        )
      }

      return createAcceptedResult(projection.syncRequest)
    } catch {
      return createLocalFailure(
        SYNC_GATEWAY_BOUNDARY_FAILURES.boundaryFailed
      )
    }
  }

  return Object.freeze({ processSyncRawBody })
}
