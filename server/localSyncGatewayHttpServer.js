import { createServer, STATUS_CODES } from 'node:http'
import { TextDecoder } from 'node:util'

import {
  SYNC_CONTRACT_MAX_RAW_BODY_BYTES,
  validateSyncGatewayErrorResponse,
  validateSyncRequest,
  validateSyncResponse,
} from '../src/contracts/syncContract.js'
import {
  createSyncGatewayRequestBoundary,
} from '../src/gateways/syncGatewayRequestBoundary.js'
import {
  readLocalSyncGatewayRuntimeConfig,
} from './localSyncGatewayRuntimeConfig.js'

const capturedObjectPrototype = Object.prototype
const capturedArrayPrototype = Array.prototype
const capturedObjectGetPrototypeOf = Object.getPrototypeOf
const capturedObjectGetOwnPropertyDescriptor =
  Object.getOwnPropertyDescriptor
const capturedObjectHasOwn = Object.hasOwn
const capturedObjectCreate = Object.create
const capturedObjectFreeze = Object.freeze
const capturedObjectIsFrozen = Object.isFrozen
const capturedReflectOwnKeys = Reflect.ownKeys
const capturedArrayIsArray = Array.isArray
const capturedJsonStringify = JSON.stringify
const capturedReflectApply = Reflect.apply

const AGENT_RESULT_PROPERTY_NAMES = capturedObjectFreeze([
  'ok',
  'status',
  'syncResponse',
  'error',
])
const SYNC_REQUEST_PROPERTY_NAMES = capturedObjectFreeze([
  'version',
  'action',
  'source',
  'requestId',
  'timestamp',
  'payload',
])
const SYNC_RESPONSE_PROPERTY_NAMES = capturedObjectFreeze([
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
const SUCCESS_DATA_PROPERTY_NAMES = capturedObjectFreeze([
  'status',
  'dataOrigin',
])
const META_PROPERTY_NAMES = capturedObjectFreeze([
  'durationMs',
  'processedBy',
])
const VALIDATION_RESULT_PROPERTY_NAMES = capturedObjectFreeze([
  'ok',
  'errors',
])
const EMPTY_ARRAY_VALUES = capturedObjectFreeze([])
const SYNC_AGENT_ARRAY_VALUES = capturedObjectFreeze(['SyncAgent'])
const EMPTY_ARRAY_PROPERTY_NAMES = capturedObjectFreeze(['length'])
const ONE_VALUE_ARRAY_PROPERTY_NAMES = capturedObjectFreeze(['0', 'length'])

const LOCAL_SYNC_GATEWAY_HOST = '127.0.0.1'
const LOCAL_SYNC_GATEWAY_PATH = '/api/sync-test'
const LOCAL_SYNC_GATEWAY_ALLOW_HEADER = 'POST, OPTIONS'
const LOCAL_SYNC_GATEWAY_COMPOSITION_ERROR =
  'Die lokale SyncGateway-Komposition ist ungültig.'

export const LOCAL_SYNC_GATEWAY_HTTP_LIMITS = Object.freeze({
  maxHeaderSize: 8_192,
  maxHeaderFields: 32,
  headersTimeoutMs: 5_000,
  requestTimeoutMs: 10_000,
  socketTimeoutMs: 10_000,
  connectionsCheckingIntervalMs: 100,
  keepAliveTimeoutMs: 1_000,
  maxRequestsPerSocket: 1,
})

const LOCAL_SYNC_GATEWAY_TEST_TIMEOUT_POLICY = Object.freeze({
  headersTimeoutMs: 250,
  requestTimeoutMs: 500,
  socketTimeoutMs: 500,
  connectionsCheckingIntervalMs: 25,
})

const LOCAL_HTTP_PROFILES = Object.freeze({
  invalidHttpRequest: Object.freeze({
    httpStatus: 400,
    status: 'invalidHttpRequest',
    code: 'invalidLocalSyncGatewayHttpRequest',
    message: 'Die lokale SyncGateway-HTTP-Anfrage ist ungültig.',
  }),
  originRejected: Object.freeze({
    httpStatus: 403,
    status: 'originRejected',
    code: 'localSyncGatewayOriginRejected',
    message: 'Die Anfrage ist für diese lokale Origin nicht erlaubt.',
  }),
  routeNotFound: Object.freeze({
    httpStatus: 404,
    status: 'routeNotFound',
    code: 'localSyncGatewayRouteNotFound',
    message:
      'Die angeforderte lokale SyncGateway-Route ist nicht verfügbar.',
  }),
  methodNotAllowed: Object.freeze({
    httpStatus: 405,
    status: 'methodNotAllowed',
    code: 'localSyncGatewayMethodNotAllowed',
    message:
      'Die HTTP-Methode ist für das lokale SyncGateway nicht erlaubt.',
  }),
  payloadTooLarge: Object.freeze({
    httpStatus: 413,
    status: 'payloadTooLarge',
    code: 'localSyncGatewayPayloadTooLarge',
    message:
      'Die lokale SyncGateway-Anfrage überschreitet die zulässige Größe.',
  }),
  unsupportedMediaType: Object.freeze({
    httpStatus: 415,
    status: 'unsupportedMediaType',
    code: 'localSyncGatewayUnsupportedMediaType',
    message:
      'Medientyp oder Inhaltskodierung der lokalen SyncGateway-Anfrage wird nicht unterstützt.',
  }),
  expectationRejected: Object.freeze({
    httpStatus: 417,
    status: 'expectationRejected',
    code: 'localSyncGatewayExpectationRejected',
    message:
      'Die HTTP-Erwartung wird vom lokalen SyncGateway nicht unterstützt.',
  }),
  requestHeadersTooLarge: Object.freeze({
    httpStatus: 431,
    status: 'requestHeadersTooLarge',
    code: 'localSyncGatewayRequestHeadersTooLarge',
    message:
      'Die HTTP-Header der lokalen SyncGateway-Anfrage überschreiten die zulässige Größe.',
  }),
  gatewayFailed: Object.freeze({
    httpStatus: 500,
    status: 'gatewayFailed',
    code: 'localSyncGatewayFailed',
    message:
      'Die lokale SyncGateway-Anfrage konnte nicht sicher verarbeitet werden.',
  }),
})

const LIFECYCLE_FAILURES = Object.freeze({
  alreadyStarted: Object.freeze({
    status: 'alreadyStarted',
    code: 'localSyncGatewayAlreadyStarted',
    message: 'Das lokale SyncGateway wurde bereits gestartet.',
  }),
  startFailed: Object.freeze({
    status: 'startFailed',
    code: 'localSyncGatewayStartFailed',
    message: 'Das lokale SyncGateway konnte nicht gestartet werden.',
  }),
  notStarted: Object.freeze({
    status: 'notStarted',
    code: 'localSyncGatewayNotStarted',
    message: 'Das lokale SyncGateway wurde noch nicht gestartet.',
  }),
  alreadyStopped: Object.freeze({
    status: 'alreadyStopped',
    code: 'localSyncGatewayAlreadyStopped',
    message: 'Das lokale SyncGateway wurde bereits gestoppt.',
  }),
  stopFailed: Object.freeze({
    status: 'stopFailed',
    code: 'localSyncGatewayStopFailed',
    message: 'Das lokale SyncGateway konnte nicht kontrolliert gestoppt werden.',
  }),
})

const SECURITY_RELEVANT_HEADER_NAMES = Object.freeze([
  'host',
  'origin',
  'content-type',
  'content-encoding',
  'content-length',
  'transfer-encoding',
  'connection',
  'expect',
  'upgrade',
  'access-control-request-method',
  'access-control-request-headers',
  'trailer',
])

const LOCAL_HTTP_RESPONSE_BODIES = new Map(
  Object.entries(LOCAL_HTTP_PROFILES).map(([profileName, profile]) => {
    const envelope = Object.freeze({
      ok: false,
      status: profile.status,
      error: Object.freeze({
        code: profile.code,
        message: profile.message,
      }),
    })

    return [profileName, JSON.stringify(envelope)]
  })
)
const LOCAL_GATEWAY_FAILED_RESPONSE_BODY =
  LOCAL_HTTP_RESPONSE_BODIES.get('gatewayFailed')

function defaultStrictUtf8TextDecoderFactory() {
  return new TextDecoder('utf-8', {
    fatal: true,
    ignoreBOM: true,
  })
}

function createLifecycleSuccess(status, host = null, port = null) {
  return Object.freeze({
    ok: true,
    status,
    host,
    port,
    error: null,
  })
}

function createLifecycleFailure(failure) {
  return Object.freeze({
    ok: false,
    status: failure.status,
    host: null,
    port: null,
    error: Object.freeze({
      code: failure.code,
      message: failure.message,
    }),
  })
}

function isValidFactoryPort(port) {
  return (
    Number.isSafeInteger(port) &&
    port >= 0 &&
    port <= 65_535
  )
}

function isValidFactoryAllowedOrigin(allowedOrigin) {
  const validation = readLocalSyncGatewayRuntimeConfig({
    GOLDENDAWN_SYNC_GATEWAY_PORT: '1',
    GOLDENDAWN_SYNC_GATEWAY_ALLOWED_ORIGIN: allowedOrigin,
  })

  return (
    validation.ok === true &&
    validation.config.allowedOrigin === allowedOrigin
  )
}

function hasExactOwnDataProperties(value, propertyNames) {
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

    if (
      ownKeys.length !== propertyNames.length ||
      !ownKeys.every(
        (propertyName) => (
          typeof propertyName === 'string' &&
          propertyNames.includes(propertyName)
        )
      )
    ) {
      return { ok: false }
    }

    const properties = Object.create(null)

    for (const propertyName of propertyNames) {
      const descriptor = Object.getOwnPropertyDescriptor(
        value,
        propertyName
      )

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

function isAcceptedValidationResult(validationResult) {
  const result = hasExactOwnDataProperties(
    validationResult,
    ['ok', 'errors']
  )

  return (
    result.ok &&
    result.properties.ok === true &&
    Array.isArray(result.properties.errors) &&
    result.properties.errors.length === 0
  )
}

function isAcceptedSyncRequestProjection(syncRequest) {
  const inspectedRequest = hasExactOwnDataProperties(
    syncRequest,
    ['version', 'action', 'source', 'requestId', 'timestamp', 'payload']
  )

  if (!inspectedRequest.ok) {
    return false
  }

  const payload = inspectedRequest.properties.payload

  try {
    if (
      !Object.isFrozen(syncRequest) ||
      typeof payload !== 'object' ||
      payload === null ||
      !Object.isFrozen(payload)
    ) {
      return false
    }

    return isAcceptedValidationResult(
      validateSyncRequest(
        syncRequest,
        inspectedRequest.properties.timestamp
      )
    )
  } catch {
    return false
  }
}

function capturedOwnKeysMatch(ownKeys, expectedPropertyNames) {
  if (ownKeys.length !== expectedPropertyNames.length) {
    return false
  }

  for (
    let expectedIndex = 0;
    expectedIndex < expectedPropertyNames.length;
    expectedIndex += 1
  ) {
    const expectedPropertyName = expectedPropertyNames[expectedIndex]
    let propertyFound = false

    for (
      let ownKeyIndex = 0;
      ownKeyIndex < ownKeys.length;
      ownKeyIndex += 1
    ) {
      if (ownKeys[ownKeyIndex] === expectedPropertyName) {
        propertyFound = true
        break
      }
    }

    if (!propertyFound) {
      return false
    }
  }

  return true
}

function readCapturedOrdinaryDataRecord(value, expectedPropertyNames) {
  try {
    if (
      typeof value !== 'object' ||
      value === null ||
      capturedArrayIsArray(value) ||
      capturedObjectGetPrototypeOf(value) !== capturedObjectPrototype
    ) {
      return { ok: false }
    }

    const ownKeys = capturedReflectOwnKeys(value)

    if (!capturedOwnKeysMatch(ownKeys, expectedPropertyNames)) {
      return { ok: false }
    }

    const values = capturedReflectApply(
      capturedObjectCreate,
      capturedObjectPrototype,
      [null]
    )

    for (
      let propertyIndex = 0;
      propertyIndex < expectedPropertyNames.length;
      propertyIndex += 1
    ) {
      const descriptor = capturedObjectGetOwnPropertyDescriptor(
        value,
        expectedPropertyNames[propertyIndex]
      )

      if (
        descriptor === undefined ||
        descriptor.enumerable !== true ||
        !capturedObjectHasOwn(descriptor, 'value')
      ) {
        return { ok: false }
      }

      values[propertyIndex] = descriptor.value
    }

    return { ok: true, values }
  } catch {
    return { ok: false }
  }
}

function readCapturedDataArray(value, expectedValues) {
  try {
    if (
      !capturedArrayIsArray(value) ||
      capturedObjectGetPrototypeOf(value) !== capturedArrayPrototype
    ) {
      return { ok: false }
    }

    let expectedPropertyNames

    if (expectedValues.length === 0) {
      expectedPropertyNames = EMPTY_ARRAY_PROPERTY_NAMES
    } else if (expectedValues.length === 1) {
      expectedPropertyNames = ONE_VALUE_ARRAY_PROPERTY_NAMES
    } else {
      return { ok: false }
    }

    const ownKeys = capturedReflectOwnKeys(value)

    if (!capturedOwnKeysMatch(ownKeys, expectedPropertyNames)) {
      return { ok: false }
    }

    const lengthDescriptor = capturedObjectGetOwnPropertyDescriptor(
      value,
      'length'
    )

    if (
      lengthDescriptor === undefined ||
      lengthDescriptor.enumerable !== false ||
      !capturedObjectHasOwn(lengthDescriptor, 'value') ||
      lengthDescriptor.value !== expectedValues.length
    ) {
      return { ok: false }
    }

    if (expectedValues.length === 1) {
      const valueDescriptor = capturedObjectGetOwnPropertyDescriptor(value, '0')

      if (
        valueDescriptor === undefined ||
        valueDescriptor.enumerable !== true ||
        !capturedObjectHasOwn(valueDescriptor, 'value') ||
        valueDescriptor.value !== expectedValues[0]
      ) {
        return { ok: false }
      }
    }

    return { ok: true }
  } catch {
    return { ok: false }
  }
}

function isCapturedAcceptedValidationResult(validationResult) {
  const inspectedResult = readCapturedOrdinaryDataRecord(
    validationResult,
    VALIDATION_RESULT_PROPERTY_NAMES
  )

  return (
    inspectedResult.ok &&
    inspectedResult.values[0] === true &&
    readCapturedDataArray(
      inspectedResult.values[1],
      EMPTY_ARRAY_VALUES
    ).ok
  )
}

function validateNormalSyncResponse(syncResponse, syncRequest) {
  try {
    return isCapturedAcceptedValidationResult(
      capturedReflectApply(
        validateSyncResponse,
        undefined,
        [syncResponse, syncRequest]
      )
    )
  } catch {
    return false
  }
}

function inspectCapturedSuccessSyncResponse(syncResponse, syncRequest) {
  const request = readCapturedOrdinaryDataRecord(
    syncRequest,
    SYNC_REQUEST_PROPERTY_NAMES
  )
  const response = readCapturedOrdinaryDataRecord(
    syncResponse,
    SYNC_RESPONSE_PROPERTY_NAMES
  )

  if (!request.ok || !response.ok) {
    return { ok: false }
  }

  const dataValue = response.values[6]
  const warningsValue = response.values[8]
  const metaValue = response.values[9]
  const data = readCapturedOrdinaryDataRecord(
    dataValue,
    SUCCESS_DATA_PROPERTY_NAMES
  )
  const warnings = readCapturedDataArray(
    warningsValue,
    EMPTY_ARRAY_VALUES
  )
  const meta = readCapturedOrdinaryDataRecord(
    metaValue,
    META_PROPERTY_NAMES
  )

  if (!data.ok || !warnings.ok || !meta.ok) {
    return { ok: false }
  }

  const processedByValue = meta.values[1]
  const processedBy = readCapturedDataArray(
    processedByValue,
    SYNC_AGENT_ARRAY_VALUES
  )

  if (
    !processedBy.ok ||
    response.values[0] !== '1.0' ||
    response.values[1] !== true ||
    response.values[2] !== request.values[3] ||
    response.values[3] !== 'syncTest' ||
    response.values[4] !== 'SyncAgent' ||
    typeof response.values[5] !== 'string' ||
    data.values[0] !== 'ok' ||
    data.values[1] !== 'synthetic' ||
    response.values[7] !== null ||
    meta.values[0] !== 0 ||
    syncResponse === dataValue ||
    syncResponse === warningsValue ||
    syncResponse === metaValue ||
    syncResponse === processedByValue ||
    dataValue === metaValue ||
    warningsValue === processedByValue
  ) {
    return { ok: false }
  }

  try {
    if (
      capturedObjectIsFrozen(syncResponse) !== true ||
      capturedObjectIsFrozen(dataValue) !== true ||
      capturedObjectIsFrozen(warningsValue) !== true ||
      capturedObjectIsFrozen(metaValue) !== true ||
      capturedObjectIsFrozen(processedByValue) !== true
    ) {
      return { ok: false }
    }
  } catch {
    return { ok: false }
  }

  return {
    ok: true,
    timestamp: response.values[5],
    identities: {
      data: dataValue,
      meta: metaValue,
      processedBy: processedByValue,
      syncResponse,
      warnings: warningsValue,
    },
  }
}

function createDefensiveSuccessSyncResponse(syncRequest, timestamp) {
  const request = readCapturedOrdinaryDataRecord(
    syncRequest,
    SYNC_REQUEST_PROPERTY_NAMES
  )

  if (!request.ok) {
    return null
  }

  const data = {
    status: 'ok',
    dataOrigin: 'synthetic',
  }
  const warnings = []
  const processedBy = ['SyncAgent']
  const meta = {
    durationMs: 0,
    processedBy,
  }
  const syncResponse = {
    version: '1.0',
    success: true,
    requestId: request.values[3],
    action: 'syncTest',
    handledBy: 'SyncAgent',
    timestamp,
    data,
    error: null,
    warnings,
    meta,
  }

  return { data, meta, processedBy, syncResponse, warnings }
}

function freezeDefensiveSuccessSyncResponse(responseBuild) {
  try {
    capturedReflectApply(capturedObjectFreeze, undefined, [responseBuild.data])
    capturedReflectApply(capturedObjectFreeze, undefined, [responseBuild.warnings])
    capturedReflectApply(capturedObjectFreeze, undefined, [responseBuild.processedBy])
    capturedReflectApply(capturedObjectFreeze, undefined, [responseBuild.meta])
    capturedReflectApply(capturedObjectFreeze, undefined, [responseBuild.syncResponse])

    return (
      capturedObjectIsFrozen(responseBuild.data) === true &&
      capturedObjectIsFrozen(responseBuild.warnings) === true &&
      capturedObjectIsFrozen(responseBuild.processedBy) === true &&
      capturedObjectIsFrozen(responseBuild.meta) === true &&
      capturedObjectIsFrozen(responseBuild.syncResponse) === true
    )
  } catch {
    return false
  }
}

function serializeAgentSuccessResult(agentResult, syncRequest) {
  try {
    const result = readCapturedOrdinaryDataRecord(
      agentResult,
      AGENT_RESULT_PROPERTY_NAMES
    )

    if (
      !result.ok ||
      capturedObjectIsFrozen(agentResult) !== true ||
      result.values[0] !== true ||
      result.values[1] !== 'syncResponseCreated' ||
      result.values[3] !== null
    ) {
      return null
    }

    const originalSyncResponse = result.values[2]

    if (!validateNormalSyncResponse(originalSyncResponse, syncRequest)) {
      return null
    }

    const originalInspection = inspectCapturedSuccessSyncResponse(
      originalSyncResponse,
      syncRequest
    )

    if (!originalInspection.ok) {
      return null
    }

    const responseBuild = createDefensiveSuccessSyncResponse(
      syncRequest,
      originalInspection.timestamp
    )

    if (
      responseBuild === null ||
      !validateNormalSyncResponse(responseBuild.syncResponse, syncRequest) ||
      !freezeDefensiveSuccessSyncResponse(responseBuild) ||
      !validateNormalSyncResponse(responseBuild.syncResponse, syncRequest)
    ) {
      return null
    }

    const terminalInspection = inspectCapturedSuccessSyncResponse(
      responseBuild.syncResponse,
      syncRequest
    )

    if (
      !terminalInspection.ok ||
      terminalInspection.identities.syncResponse !== responseBuild.syncResponse ||
      terminalInspection.identities.data !== responseBuild.data ||
      terminalInspection.identities.warnings !== responseBuild.warnings ||
      terminalInspection.identities.meta !== responseBuild.meta ||
      terminalInspection.identities.processedBy !== responseBuild.processedBy ||
      terminalInspection.timestamp !== originalInspection.timestamp ||
      responseBuild.syncResponse === originalInspection.identities.syncResponse ||
      responseBuild.data === originalInspection.identities.data ||
      responseBuild.warnings === originalInspection.identities.warnings ||
      responseBuild.meta === originalInspection.identities.meta ||
      responseBuild.processedBy === originalInspection.identities.processedBy ||
      capturedObjectGetPrototypeOf(capturedArrayPrototype) !==
        capturedObjectPrototype ||
      capturedObjectGetPrototypeOf(capturedObjectPrototype) !== null ||
      capturedObjectHasOwn(capturedArrayPrototype, 'toJSON') ||
      capturedObjectHasOwn(capturedObjectPrototype, 'toJSON')
    ) {
      return null
    }

    const serializedResponse = capturedReflectApply(
      capturedJsonStringify,
      undefined,
      [responseBuild.syncResponse]
    )

    return typeof serializedResponse === 'string'
      ? serializedResponse
      : null
  } catch {
    return null
  }
}

function inspectBoundaryResult(boundaryResult) {
  return hasExactOwnDataProperties(
    boundaryResult,
    [
      'ok',
      'status',
      'syncRequest',
      'gatewayErrorResponse',
      'error',
    ]
  )
}

function readRawHeaders(request) {
  let rawHeaders

  try {
    rawHeaders = request.rawHeaders
  } catch {
    return { ok: false, headersTooLarge: false, values: new Map() }
  }

  if (
    !Array.isArray(rawHeaders) ||
    rawHeaders.length % 2 !== 0
  ) {
    return { ok: false, headersTooLarge: false, values: new Map() }
  }

  const headerFieldCount = rawHeaders.length / 2

  if (headerFieldCount > LOCAL_SYNC_GATEWAY_HTTP_LIMITS.maxHeaderFields) {
    return { ok: false, headersTooLarge: true, values: new Map() }
  }

  const values = new Map()

  for (let index = 0; index < rawHeaders.length; index += 2) {
    const rawName = rawHeaders[index]
    const rawValue = rawHeaders[index + 1]

    if (typeof rawName !== 'string' || typeof rawValue !== 'string') {
      return { ok: false, headersTooLarge: false, values: new Map() }
    }

    const headerName = rawName.toLowerCase()
    const existingValues = values.get(headerName)

    if (existingValues === undefined) {
      values.set(headerName, [rawValue])
    } else {
      existingValues.push(rawValue)
    }
  }

  return { ok: true, headersTooLarge: false, values }
}

function getHeaderValues(rawHeaderResult, headerName) {
  return rawHeaderResult.values.get(headerName) ?? []
}

function hasDuplicateHeader(rawHeaderResult, headerName) {
  return getHeaderValues(rawHeaderResult, headerName).length > 1
}

function hasAnySecurityRelevantDuplicate(rawHeaderResult) {
  return SECURITY_RELEVANT_HEADER_NAMES.some(
    (headerName) => hasDuplicateHeader(rawHeaderResult, headerName)
  )
}

function hasAllowedOrigin(rawHeaderResult, allowedOrigin) {
  if (!rawHeaderResult.ok) {
    return false
  }

  const originValues = getHeaderValues(rawHeaderResult, 'origin')

  return originValues.length === 1 && originValues[0] === allowedOrigin
}

function hasSupportedConnectionHeader(rawHeaderResult) {
  const connectionValues = getHeaderValues(rawHeaderResult, 'connection')

  if (connectionValues.length === 0) {
    return true
  }

  if (connectionValues.length !== 1) {
    return false
  }

  const normalizedValue = connectionValues[0].toLowerCase()

  return normalizedValue === 'close' || normalizedValue === 'keep-alive'
}

function isSupportedContentType(value) {
  return /^application\/json(?:[\t ]*;[\t ]*charset[\t ]*=[\t ]*utf-8)?$/i
    .test(value)
}

function parseContentLength(value) {
  if (value === undefined) {
    return { ok: true, value: null }
  }

  if (typeof value !== 'string' || !/^[0-9]+$/.test(value)) {
    return { ok: false, value: null }
  }

  const numericValue = Number(value)

  if (!Number.isSafeInteger(numericValue) || numericValue < 0) {
    return { ok: false, value: null }
  }

  return { ok: true, value: numericValue }
}

function setResponseProtectionHeaders(response, allowedOrigin, useCors) {
  response.setHeader('Cache-Control', 'no-store')
  response.setHeader('X-Content-Type-Options', 'nosniff')
  response.setHeader('Connection', 'close')

  if (useCors) {
    response.setHeader('Access-Control-Allow-Origin', allowedOrigin)
    response.setHeader('Vary', 'Origin')
  }
}

function writeSerializedJsonResponse(
  response,
  httpStatus,
  serializedBody,
  allowedOrigin,
  useCors,
  claimSocketResponse,
  { allowMethods = false } = {}
) {
  try {
    if (response.destroyed || response.writableEnded) {
      return false
    }

    const socket = response.socket

    if (!claimSocketResponse(socket)) {
      return false
    }

    response.statusCode = httpStatus
    response.setHeader('Content-Type', 'application/json; charset=utf-8')
    response.setHeader(
      'Content-Length',
      Buffer.byteLength(serializedBody, 'utf8')
    )
    setResponseProtectionHeaders(response, allowedOrigin, useCors)

    if (allowMethods) {
      response.setHeader('Allow', LOCAL_SYNC_GATEWAY_ALLOW_HEADER)
    }

    response.end(serializedBody, 'utf8')
    return true
  } catch {
    try {
      response.destroy()
    } catch {
      // Der Socket ist bereits nicht mehr kontrollierbar.
    }

    return false
  }
}

function writeLocalHttpResponse(
  response,
  profileName,
  allowedOrigin,
  useCors,
  claimSocketResponse,
  options
) {
  const profile = LOCAL_HTTP_PROFILES[profileName]
  const serializedBody = LOCAL_HTTP_RESPONSE_BODIES.get(profileName)

  return writeSerializedJsonResponse(
    response,
    profile.httpStatus,
    serializedBody,
    allowedOrigin,
    useCors,
    claimSocketResponse,
    options
  )
}

function writePreflightResponse(
  response,
  allowedOrigin,
  claimSocketResponse
) {
  try {
    if (response.destroyed || response.writableEnded) {
      return false
    }

    const socket = response.socket

    if (!claimSocketResponse(socket)) {
      return false
    }

    response.statusCode = 204
    response.setHeader('Content-Length', '0')
    setResponseProtectionHeaders(response, allowedOrigin, true)
    response.setHeader('Access-Control-Allow-Methods', 'POST')
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    response.end()
    return true
  } catch {
    try {
      response.destroy()
    } catch {
      // Der Socket ist bereits nicht mehr kontrollierbar.
    }

    return false
  }
}

function writeRawSocketResponse(
  socket,
  profileName,
  claimSocketResponse,
  destroySocket,
  { allowMethods = false } = {}
) {
  if (!claimSocketResponse(socket)) {
    destroySocket(socket)
    return false
  }

  const profile = LOCAL_HTTP_PROFILES[profileName]
  const serializedBody = LOCAL_HTTP_RESPONSE_BODIES.get(profileName)
  const reasonPhrase = STATUS_CODES[profile.httpStatus] ?? 'Error'
  const headerLines = [
    `HTTP/1.1 ${profile.httpStatus} ${reasonPhrase}`,
    'Content-Type: application/json; charset=utf-8',
    `Content-Length: ${Buffer.byteLength(serializedBody, 'utf8')}`,
    'Cache-Control: no-store',
    'X-Content-Type-Options: nosniff',
    'Connection: close',
  ]

  if (allowMethods) {
    headerLines.push(`Allow: ${LOCAL_SYNC_GATEWAY_ALLOW_HEADER}`)
  }

  headerLines.push('', serializedBody)

  try {
    if (!socket.destroyed && socket.writable) {
      const handleRawSocketError = () => destroySocket(socket)

      socket.once('error', handleRawSocketError)
      socket.end(
        headerLines.join('\r\n'),
        'utf8',
        () => {
          try {
            socket.off('error', handleRawSocketError)
          } catch {
            // Der Destroy bleibt auch bei einer ungeeigneten Socket-API sicher.
          }

          destroySocket(socket)
        }
      )
      return true
    }
  } catch {
    // Der kontrollierte Fallback darunter schließt den Socket.
  }

  destroySocket(socket)

  return false
}

function isExpectedHostAuthority(hostValue, boundPort) {
  if (boundPort === 80) {
    return (
      hostValue === LOCAL_SYNC_GATEWAY_HOST ||
      hostValue === `${LOCAL_SYNC_GATEWAY_HOST}:80`
    )
  }

  return hostValue === `${LOCAL_SYNC_GATEWAY_HOST}:${boundPort}`
}

function isValidPreflight(rawHeaderResult) {
  const requestedMethod = getHeaderValues(
    rawHeaderResult,
    'access-control-request-method'
  )
  const requestedHeaders = getHeaderValues(
    rawHeaderResult,
    'access-control-request-headers'
  )
  const contentLengthValues = getHeaderValues(
    rawHeaderResult,
    'content-length'
  )

  if (
    requestedMethod.length !== 1 ||
    requestedMethod[0] !== 'POST' ||
    requestedHeaders.length !== 1 ||
    requestedHeaders[0].toLowerCase() !== 'content-type' ||
    getHeaderValues(rawHeaderResult, 'content-type').length !== 0 ||
    getHeaderValues(rawHeaderResult, 'content-encoding').length !== 0 ||
    getHeaderValues(rawHeaderResult, 'transfer-encoding').length !== 0 ||
    getHeaderValues(rawHeaderResult, 'expect').length !== 0 ||
    getHeaderValues(rawHeaderResult, 'upgrade').length !== 0 ||
    getHeaderValues(rawHeaderResult, 'trailer').length !== 0 ||
    !hasSupportedConnectionHeader(rawHeaderResult)
  ) {
    return false
  }

  if (contentLengthValues.length === 0) {
    return true
  }

  const parsedContentLength = parseContentLength(contentLengthValues[0])

  return parsedContentLength.ok && parsedContentLength.value === 0
}

function validatePostHeaders(rawHeaderResult) {
  if (
    hasDuplicateHeader(rawHeaderResult, 'content-type') ||
    hasDuplicateHeader(rawHeaderResult, 'content-encoding')
  ) {
    return { ok: false, profileName: 'unsupportedMediaType' }
  }

  if (hasAnySecurityRelevantDuplicate(rawHeaderResult)) {
    return { ok: false, profileName: 'invalidHttpRequest' }
  }

  const contentTypeValues = getHeaderValues(
    rawHeaderResult,
    'content-type'
  )
  const contentEncodingValues = getHeaderValues(
    rawHeaderResult,
    'content-encoding'
  )

  if (
    contentTypeValues.length !== 1 ||
    !isSupportedContentType(contentTypeValues[0]) ||
    contentEncodingValues.length > 1 ||
    (
      contentEncodingValues.length === 1 &&
      contentEncodingValues[0].toLowerCase() !== 'identity'
    )
  ) {
    return { ok: false, profileName: 'unsupportedMediaType' }
  }

  if (
    !hasSupportedConnectionHeader(rawHeaderResult) ||
    getHeaderValues(rawHeaderResult, 'expect').length !== 0 ||
    getHeaderValues(rawHeaderResult, 'upgrade').length !== 0 ||
    getHeaderValues(rawHeaderResult, 'trailer').length !== 0 ||
    getHeaderValues(
      rawHeaderResult,
      'access-control-request-method'
    ).length !== 0 ||
    getHeaderValues(
      rawHeaderResult,
      'access-control-request-headers'
    ).length !== 0
  ) {
    return { ok: false, profileName: 'invalidHttpRequest' }
  }

  const contentLengthValues = getHeaderValues(
    rawHeaderResult,
    'content-length'
  )
  const transferEncodingValues = getHeaderValues(
    rawHeaderResult,
    'transfer-encoding'
  )

  if (
    contentLengthValues.length > 1 ||
    transferEncodingValues.length > 1 ||
    (
      contentLengthValues.length === 1 &&
      transferEncodingValues.length === 1
    ) ||
    (
      transferEncodingValues.length === 1 &&
      transferEncodingValues[0].toLowerCase() !== 'chunked'
    )
  ) {
    return { ok: false, profileName: 'invalidHttpRequest' }
  }

  const parsedContentLength = parseContentLength(
    contentLengthValues.length === 1
      ? contentLengthValues[0]
      : undefined
  )

  if (!parsedContentLength.ok) {
    return { ok: false, profileName: 'invalidHttpRequest' }
  }

  if (
    parsedContentLength.value !== null &&
    parsedContentLength.value > SYNC_CONTRACT_MAX_RAW_BODY_BYTES
  ) {
    return { ok: false, profileName: 'payloadTooLarge' }
  }

  return {
    ok: true,
    contentLength: parsedContentLength.value,
  }
}

export function createLocalSyncGatewayHttpServer({
  port,
  allowedOrigin,
  syncAgent,
  syncGatewayRequestBoundary = createSyncGatewayRequestBoundary(),
  createTextDecoder = defaultStrictUtf8TextDecoderFactory,
  onFatal = () => {},
  useTestTimeoutPolicy = false,
} = {}) {
  if (
    !isValidFactoryPort(port) ||
    !isValidFactoryAllowedOrigin(allowedOrigin) ||
    typeof createTextDecoder !== 'function' ||
    typeof onFatal !== 'function' ||
    (
      useTestTimeoutPolicy !== false &&
      !(useTestTimeoutPolicy === true && port === 0)
    )
  ) {
    throw new TypeError(LOCAL_SYNC_GATEWAY_COMPOSITION_ERROR)
  }

  let processSyncRequest

  try {
    processSyncRequest = syncAgent?.processSyncRequest
  } catch {
    throw new TypeError(LOCAL_SYNC_GATEWAY_COMPOSITION_ERROR)
  }

  if (typeof processSyncRequest !== 'function') {
    throw new TypeError(LOCAL_SYNC_GATEWAY_COMPOSITION_ERROR)
  }

  let processSyncRawBody

  try {
    processSyncRawBody = syncGatewayRequestBoundary?.processSyncRawBody
  } catch {
    throw new TypeError(LOCAL_SYNC_GATEWAY_COMPOSITION_ERROR)
  }

  if (typeof processSyncRawBody !== 'function') {
    throw new TypeError(LOCAL_SYNC_GATEWAY_COMPOSITION_ERROR)
  }

  let lifecycleState = 'created'
  let boundPort = null
  let pendingStart = null
  let pendingStop = null
  let fatalNotificationSent = false
  const sockets = new Set()
  const admittedRequestSockets = new WeakSet()
  const responseOwnedSockets = new WeakSet()
  const timeoutPolicy = useTestTimeoutPolicy
    ? LOCAL_SYNC_GATEWAY_TEST_TIMEOUT_POLICY
    : LOCAL_SYNC_GATEWAY_HTTP_LIMITS

  function isOperational() {
    return lifecycleState === 'started' && boundPort !== null
  }

  function destroySocket(socket) {
    try {
      socket?.destroy()
    } catch {
      // Der Socket ist bereits geschlossen oder nicht mehr kontrollierbar.
    }
  }

  function destroyTrackedSockets() {
    for (const socket of sockets) {
      destroySocket(socket)
    }
  }

  function closeListenerBestEffort({ retryAfterThrow = false } = {}) {
    try {
      server.close()
      return
    } catch {
      // Der defensive Retry bleibt auf den Startfehlerpfad begrenzt.
    }

    if (retryAfterThrow) {
      try {
        server.close()
        return
      } catch {
        // Ein dauerhaft werfender Listener wird wenigstens dereferenziert.
      }
    }

    try {
      server.unref()
    } catch {
      // Der Listener bleibt durch den failed-Zustand unverwendbar.
    }
  }

  function failClosedServer({
    notifyFatal = false,
    retryListenerClose = false,
  } = {}) {
    boundPort = null
    lifecycleState = 'failed'

    closeListenerBestEffort({ retryAfterThrow: retryListenerClose })

    destroyTrackedSockets()

    if (!notifyFatal || fatalNotificationSent) {
      return
    }

    fatalNotificationSent = true

    try {
      const fatalNotification = Reflect.apply(onFatal, undefined, [])

      void Promise.resolve(fatalNotification).catch(() => {})
    } catch {
      // Der Fatal-Kanal ist beobachtbar, aber kein neuer Fehlerpfad.
    }
  }

  function claimSocketResponse(socket) {
    if (
      socket === null ||
      (typeof socket !== 'object' && typeof socket !== 'function') ||
      responseOwnedSockets.has(socket)
    ) {
      return false
    }

    responseOwnedSockets.add(socket)
    return true
  }

  function sendSerializedJsonResponse(
    response,
    httpStatus,
    serializedBody,
    configuredOrigin,
    useCors,
    options
  ) {
    return writeSerializedJsonResponse(
      response,
      httpStatus,
      serializedBody,
      configuredOrigin,
      useCors,
      claimSocketResponse,
      options
    )
  }

  function sendLocalHttpResponse(
    response,
    profileName,
    configuredOrigin,
    useCors,
    options
  ) {
    return writeLocalHttpResponse(
      response,
      profileName,
      configuredOrigin,
      useCors,
      claimSocketResponse,
      options
    )
  }

  function sendGatewayFailedResponse(response, useCors) {
    return writeSerializedJsonResponse(
      response,
      500,
      LOCAL_GATEWAY_FAILED_RESPONSE_BODY,
      allowedOrigin,
      useCors,
      claimSocketResponse
    )
  }

  function sendPreflightResponse(response, configuredOrigin) {
    return writePreflightResponse(
      response,
      configuredOrigin,
      claimSocketResponse
    )
  }

  function sendRawSocketResponse(socket, profileName, options) {
    return writeRawSocketResponse(
      socket,
      profileName,
      claimSocketResponse,
      destroySocket,
      options
    )
  }

  function abortRequestWithoutResponse(request, response) {
    try {
      request?.pause()
    } catch {
      // Der Socket wird unten unabhängig davon geschlossen.
    }

    try {
      response?.destroy()
    } catch {
      destroySocket(request?.socket)
    }
  }

  function admitHttpRequest(request, response) {
    if (!isOperational()) {
      abortRequestWithoutResponse(request, response)
      return false
    }

    let socket

    try {
      socket = request?.socket
    } catch {
      abortRequestWithoutResponse(request, response)
      return false
    }

    if (
      socket === null ||
      (typeof socket !== 'object' && typeof socket !== 'function')
    ) {
      abortRequestWithoutResponse(request, response)
      destroySocket(socket)
      return false
    }

    if (admittedRequestSockets.has(socket)) {
      claimSocketResponse(socket)
      abortRequestWithoutResponse(request, response)
      destroySocket(socket)
      return false
    }

    admittedRequestSockets.add(socket)

    let httpVersion

    try {
      httpVersion = request.httpVersion
    } catch {
      httpVersion = null
    }

    if (httpVersion !== '1.1') {
      try {
        request.pause()
      } catch {
        // Die statische Response schließt die Verbindung unabhängig davon.
      }

      sendLocalHttpResponse(
        response,
        'invalidHttpRequest',
        allowedOrigin,
        false
      )
      return false
    }

    return true
  }

  function useCorsForRequest(request) {
    const rawHeaderResult = readRawHeaders(request)
    return hasAllowedOrigin(rawHeaderResult, allowedOrigin)
  }

  function handleBoundaryResult(response, boundaryResult, useCors) {
    if (!isOperational()) {
      abortRequestWithoutResponse(null, response)
      return
    }

    const inspectedResult = inspectBoundaryResult(boundaryResult)

    if (!inspectedResult.ok) {
      sendLocalHttpResponse(
        response,
        'gatewayFailed',
        allowedOrigin,
        useCors
      )
      return
    }

    const result = inspectedResult.properties

    if (
      result.ok === true &&
      result.status === 'syncRequestAccepted' &&
      isAcceptedSyncRequestProjection(result.syncRequest) &&
      result.gatewayErrorResponse === null &&
      result.error === null
    ) {
      let agentResult

      try {
        agentResult = capturedReflectApply(
          processSyncRequest,
          syncAgent,
          [result.syncRequest]
        )
      } catch {
        sendGatewayFailedResponse(response, useCors)
        return
      }

      if (!isOperational()) {
        abortRequestWithoutResponse(null, response)
        return
      }

      const serializedSyncResponse = serializeAgentSuccessResult(
        agentResult,
        result.syncRequest
      )

      if (serializedSyncResponse === null) {
        sendGatewayFailedResponse(response, useCors)
        return
      }

      if (!isOperational()) {
        abortRequestWithoutResponse(null, response)
        return
      }

      sendSerializedJsonResponse(
        response,
        200,
        serializedSyncResponse,
        allowedOrigin,
        useCors
      )
      return
    }

    if (
      result.ok === false &&
      result.status === 'syncRequestRejected' &&
      result.syncRequest === null &&
      result.gatewayErrorResponse !== null &&
      result.error === null
    ) {
      let gatewayResponseIsValid = false

      try {
        gatewayResponseIsValid = isAcceptedValidationResult(
          validateSyncGatewayErrorResponse(result.gatewayErrorResponse)
        )
      } catch {
        gatewayResponseIsValid = false
      }

      if (!gatewayResponseIsValid) {
        sendLocalHttpResponse(
          response,
          'gatewayFailed',
          allowedOrigin,
          useCors
        )
        return
      }

      let serializedGatewayResponse

      try {
        serializedGatewayResponse = JSON.stringify(
          result.gatewayErrorResponse
        )
      } catch {
        sendLocalHttpResponse(
          response,
          'gatewayFailed',
          allowedOrigin,
          useCors
        )
        return
      }

      sendSerializedJsonResponse(
        response,
        400,
        serializedGatewayResponse,
        allowedOrigin,
        useCors
      )
      return
    }

    sendLocalHttpResponse(
      response,
      'gatewayFailed',
      allowedOrigin,
      useCors
    )
  }

  function receiveRequestBody(
    request,
    response,
    declaredContentLength,
    useCors
  ) {
    let terminal = false
    let receivedByteLength = 0
    const bodyChunks = []

    function rejectBody(profileName) {
      if (terminal) {
        return
      }

      terminal = true
      bodyChunks.length = 0

      if (!isOperational()) {
        abortRequestWithoutResponse(request, response)
        return
      }

      try {
        request.pause()
      } catch {
        // Die Response schließt die Verbindung unabhängig davon.
      }

      sendLocalHttpResponse(
        response,
        profileName,
        allowedOrigin,
        useCors
      )
    }

    request.on('data', (chunk) => {
      if (terminal) {
        return
      }

      if (!isOperational()) {
        terminal = true
        bodyChunks.length = 0
        abortRequestWithoutResponse(request, response)
        return
      }

      if (!Buffer.isBuffer(chunk)) {
        rejectBody('gatewayFailed')
        return
      }

      const nextByteLength = receivedByteLength + chunk.byteLength

      if (nextByteLength > SYNC_CONTRACT_MAX_RAW_BODY_BYTES) {
        rejectBody('payloadTooLarge')
        return
      }

      bodyChunks.push(chunk)
      receivedByteLength = nextByteLength
    })

    request.once('aborted', () => {
      rejectBody('invalidHttpRequest')
    })

    request.once('error', () => {
      rejectBody('invalidHttpRequest')
    })

    request.once('end', () => {
      if (terminal) {
        return
      }

      terminal = true

      if (!isOperational()) {
        bodyChunks.length = 0
        abortRequestWithoutResponse(request, response)
        return
      }

      let rawTrailers

      try {
        rawTrailers = request.rawTrailers
      } catch {
        rawTrailers = null
      }

      if (
        !Array.isArray(rawTrailers) ||
        rawTrailers.length !== 0 ||
        (
          declaredContentLength !== null &&
          receivedByteLength !== declaredContentLength
        )
      ) {
        bodyChunks.length = 0
        sendLocalHttpResponse(
          response,
          'invalidHttpRequest',
          allowedOrigin,
          useCors
        )
        return
      }

      let bodyBuffer

      try {
        bodyBuffer = Buffer.concat(bodyChunks, receivedByteLength)
      } catch {
        bodyChunks.length = 0
        sendLocalHttpResponse(
          response,
          'gatewayFailed',
          allowedOrigin,
          useCors
        )
        return
      }

      bodyChunks.length = 0

      if (!isOperational()) {
        abortRequestWithoutResponse(request, response)
        return
      }

      let decoder
      let decode

      try {
        decoder = Reflect.apply(createTextDecoder, undefined, [])
        decode = decoder?.decode

        if (
          decoder === null ||
          (typeof decoder !== 'object' && typeof decoder !== 'function') ||
          decoder.fatal !== true ||
          decoder.ignoreBOM !== true ||
          typeof decode !== 'function'
        ) {
          sendLocalHttpResponse(
            response,
            'gatewayFailed',
            allowedOrigin,
            useCors
          )
          return
        }
      } catch {
        sendLocalHttpResponse(
          response,
          'gatewayFailed',
          allowedOrigin,
          useCors
        )
        return
      }

      if (!isOperational()) {
        abortRequestWithoutResponse(request, response)
        return
      }

      let rawBody

      try {
        rawBody = Reflect.apply(decode, decoder, [bodyBuffer])
      } catch {
        sendLocalHttpResponse(
          response,
          'invalidHttpRequest',
          allowedOrigin,
          useCors
        )
        return
      }

      if (typeof rawBody !== 'string') {
        sendLocalHttpResponse(
          response,
          'gatewayFailed',
          allowedOrigin,
          useCors
        )
        return
      }

      if (!isOperational()) {
        abortRequestWithoutResponse(request, response)
        return
      }

      let boundaryResult

      try {
        boundaryResult = Reflect.apply(
          processSyncRawBody,
          syncGatewayRequestBoundary,
          [rawBody]
        )
      } catch {
        sendLocalHttpResponse(
          response,
          'gatewayFailed',
          allowedOrigin,
          useCors
        )
        return
      }

      if (!isOperational()) {
        abortRequestWithoutResponse(request, response)
        return
      }

      handleBoundaryResult(response, boundaryResult, useCors)
    })
  }

  function handleHttpRequest(request, response) {
    if (!admitHttpRequest(request, response)) {
      return
    }

    const rawHeaderResult = readRawHeaders(request)
    const useCors = hasAllowedOrigin(rawHeaderResult, allowedOrigin)

    if (!rawHeaderResult.ok) {
      sendLocalHttpResponse(
        response,
        rawHeaderResult.headersTooLarge
          ? 'requestHeadersTooLarge'
          : 'invalidHttpRequest',
        allowedOrigin,
        false
      )
      return
    }

    if (request.url !== LOCAL_SYNC_GATEWAY_PATH) {
      sendLocalHttpResponse(
        response,
        'routeNotFound',
        allowedOrigin,
        useCors
      )
      return
    }

    const hostValues = getHeaderValues(rawHeaderResult, 'host')

    if (
      boundPort === null ||
      hostValues.length !== 1 ||
      !isExpectedHostAuthority(hostValues[0], boundPort)
    ) {
      sendLocalHttpResponse(
        response,
        'invalidHttpRequest',
        allowedOrigin,
        useCors
      )
      return
    }

    if (request.method !== 'POST' && request.method !== 'OPTIONS') {
      sendLocalHttpResponse(
        response,
        'methodNotAllowed',
        allowedOrigin,
        useCors,
        { allowMethods: true }
      )
      return
    }

    const originValues = getHeaderValues(rawHeaderResult, 'origin')

    if (
      originValues.length !== 1 ||
      originValues[0] !== allowedOrigin
    ) {
      sendLocalHttpResponse(
        response,
        'originRejected',
        allowedOrigin,
        false
      )
      return
    }

    if (request.method === 'OPTIONS') {
      if (
        hasAnySecurityRelevantDuplicate(rawHeaderResult) ||
        !isValidPreflight(rawHeaderResult)
      ) {
        sendLocalHttpResponse(
          response,
          'invalidHttpRequest',
          allowedOrigin,
          true
        )
        return
      }

      sendPreflightResponse(response, allowedOrigin)
      return
    }

    const postHeaderValidation = validatePostHeaders(rawHeaderResult)

    if (!postHeaderValidation.ok) {
      sendLocalHttpResponse(
        response,
        postHeaderValidation.profileName,
        allowedOrigin,
        true
      )
      return
    }

    receiveRequestBody(
      request,
      response,
      postHeaderValidation.contentLength,
      true
    )
  }

  const server = createServer(
    {
      connectionsCheckingInterval:
        timeoutPolicy.connectionsCheckingIntervalMs,
      headersTimeout: timeoutPolicy.headersTimeoutMs,
      maxHeaderSize: LOCAL_SYNC_GATEWAY_HTTP_LIMITS.maxHeaderSize,
      requestTimeout: timeoutPolicy.requestTimeoutMs,
      requireHostHeader: false,
    },
    handleHttpRequest
  )

  server.maxHeadersCount =
    LOCAL_SYNC_GATEWAY_HTTP_LIMITS.maxHeaderFields + 1
  server.keepAliveTimeout =
    LOCAL_SYNC_GATEWAY_HTTP_LIMITS.keepAliveTimeoutMs
  server.maxRequestsPerSocket =
    LOCAL_SYNC_GATEWAY_HTTP_LIMITS.maxRequestsPerSocket
  server.setTimeout(
    timeoutPolicy.socketTimeoutMs,
    (socket) => {
      destroySocket(socket)
    }
  )

  server.on('connection', (socket) => {
    if (
      lifecycleState !== 'starting' &&
      lifecycleState !== 'started'
    ) {
      destroySocket(socket)
      return
    }

    sockets.add(socket)
    socket.once('close', () => sockets.delete(socket))
  })

  server.on('dropRequest', (_request, socket) => {
    claimSocketResponse(socket)
    destroySocket(socket)
  })

  server.on('checkContinue', (request, response) => {
    if (!admitHttpRequest(request, response)) {
      return
    }

    try {
      request.pause()
    } catch {
      // Die Response schließt die Verbindung unabhängig davon.
    }

    sendLocalHttpResponse(
      response,
      'expectationRejected',
      allowedOrigin,
      useCorsForRequest(request)
    )
  })

  server.on('checkExpectation', (request, response) => {
    if (!admitHttpRequest(request, response)) {
      return
    }

    try {
      request.pause()
    } catch {
      // Die Response schließt die Verbindung unabhängig davon.
    }

    sendLocalHttpResponse(
      response,
      'expectationRejected',
      allowedOrigin,
      useCorsForRequest(request)
    )
  })

  server.on('connect', (_request, socket) => {
    if (!isOperational()) {
      destroySocket(socket)
      return
    }

    sendRawSocketResponse(socket, 'methodNotAllowed', {
      allowMethods: true,
    })
  })

  server.on('upgrade', (_request, socket) => {
    if (!isOperational()) {
      destroySocket(socket)
      return
    }

    sendRawSocketResponse(socket, 'invalidHttpRequest')
  })

  server.on('clientError', (error, socket) => {
    if (!isOperational()) {
      destroySocket(socket)
      return
    }

    let profileName = 'invalidHttpRequest'

    try {
      if (error?.code === 'HPE_HEADER_OVERFLOW') {
        profileName = 'requestHeadersTooLarge'
      }
    } catch {
      profileName = 'invalidHttpRequest'
    }

    sendRawSocketResponse(socket, profileName)
  })

  server.on('error', () => {
    if (lifecycleState === 'started') {
      failClosedServer({ notifyFatal: true })
    }
  })

  async function start() {
    if (
      lifecycleState === 'starting' ||
      lifecycleState === 'started' ||
      lifecycleState === 'stopping'
    ) {
      return createLifecycleFailure(LIFECYCLE_FAILURES.alreadyStarted)
    }

    if (lifecycleState === 'stopped') {
      return createLifecycleFailure(LIFECYCLE_FAILURES.alreadyStopped)
    }

    if (lifecycleState === 'failed') {
      return createLifecycleFailure(LIFECYCLE_FAILURES.startFailed)
    }

    lifecycleState = 'starting'

    pendingStart = new Promise((resolve) => {
      let settled = false

      function beginSettlement() {
        if (settled) {
          return false
        }

        settled = true
        server.off('error', handleStartError)
        server.off('listening', handleListening)
        return true
      }

      function settleStartFailure() {
        if (!beginSettlement()) {
          return
        }

        failClosedServer({ retryListenerClose: true })
        resolve(createLifecycleFailure(LIFECYCLE_FAILURES.startFailed))
      }

      function handleStartError() {
        settleStartFailure()
      }

      function handleListening() {
        let addressIsValid = false
        let addressPort = null

        try {
          const address = server.address()

          if (typeof address === 'object' && address !== null) {
            const addressHost = address.address
            const candidatePort = address.port

            if (
              addressHost === LOCAL_SYNC_GATEWAY_HOST &&
              Number.isSafeInteger(candidatePort) &&
              candidatePort >= 1 &&
              candidatePort <= 65_535 &&
              (port === 0 || candidatePort === port)
            ) {
              addressIsValid = true
              addressPort = candidatePort
            }
          }
        } catch {
          addressIsValid = false
          addressPort = null
        }

        if (!addressIsValid) {
          settleStartFailure()
          return
        }

        if (!beginSettlement()) {
          return
        }

        lifecycleState = 'started'
        boundPort = addressPort
        resolve(
          createLifecycleSuccess(
            'started',
            LOCAL_SYNC_GATEWAY_HOST,
            boundPort
          )
        )
      }

      server.once('error', handleStartError)
      server.once('listening', handleListening)

      try {
        server.listen({
          host: LOCAL_SYNC_GATEWAY_HOST,
          port,
          exclusive: true,
        })
      } catch {
        handleStartError()
      }
    })

    return pendingStart
  }

  async function stop() {
    if (lifecycleState === 'starting' && pendingStart !== null) {
      await pendingStart
      return stop()
    }

    if (lifecycleState === 'created') {
      return createLifecycleFailure(LIFECYCLE_FAILURES.notStarted)
    }

    if (lifecycleState === 'stopped') {
      return createLifecycleFailure(LIFECYCLE_FAILURES.alreadyStopped)
    }

    if (lifecycleState === 'stopping' && pendingStop !== null) {
      return pendingStop
    }

    if (lifecycleState === 'failed' && !server.listening) {
      for (const socket of sockets) {
        try {
          socket.destroy()
        } catch {
          // Der Socket ist bereits geschlossen.
        }
      }

      lifecycleState = 'stopped'
      boundPort = null
      return createLifecycleSuccess('stopped')
    }

    lifecycleState = 'stopping'

    pendingStop = new Promise((resolve) => {
      let settled = false

      function settle(result) {
        if (settled) {
          return
        }

        settled = true
        resolve(result)
      }

      try {
        server.close((error) => {
          boundPort = null

          if (error) {
            lifecycleState = 'failed'
            settle(createLifecycleFailure(LIFECYCLE_FAILURES.stopFailed))
            return
          }

          lifecycleState = 'stopped'
          settle(createLifecycleSuccess('stopped'))
        })

        for (const socket of sockets) {
          try {
            socket.destroy()
          } catch {
            // Der Socket ist bereits geschlossen.
          }
        }
      } catch {
        boundPort = null
        lifecycleState = 'failed'

        for (const socket of sockets) {
          try {
            socket.destroy()
          } catch {
            // Der Socket ist bereits geschlossen.
          }
        }

        settle(createLifecycleFailure(LIFECYCLE_FAILURES.stopFailed))
      }
    })

    return pendingStop
  }

  return Object.freeze({ start, stop })
}
