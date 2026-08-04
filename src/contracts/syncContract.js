export const SYNC_CONTRACT_VERSION = '1.0'

export const SYNC_CONTRACT_ACTIONS = Object.freeze(['syncTest'])
export const SYNC_CONTRACT_SOURCES = Object.freeze(['goldendawn-os'])
export const SYNC_CONTRACT_HANDLERS = Object.freeze(['SyncAgent'])
export const SYNC_CONTRACT_DATA_ORIGINS = Object.freeze(['synthetic'])

export const SYNC_CONTRACT_MAX_RAW_BODY_BYTES = 64 * 1024
export const SYNC_CONTRACT_REQUEST_ID_MAX_LENGTH = 64
export const SYNC_CONTRACT_TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000
export const SYNC_CONTRACT_MAX_DURATION_MS = 5 * 60 * 1000

export const SYNC_CONTRACT_VALIDATION_ERROR_CODES = Object.freeze({
  INVALID_SYNC_REQUEST: 'invalidSyncRequest',
  INVALID_SYNC_RESPONSE: 'invalidSyncResponse',
  INVALID_GATEWAY_ERROR_RESPONSE: 'invalidGatewayErrorResponse',
  INVALID_CORRELATED_REQUEST: 'invalidCorrelatedRequest',
  INVALID_RAW_BODY: 'invalidRawBody',
  RAW_BODY_TOO_LARGE: 'rawBodyTooLarge',
  UNKNOWN_PROPERTY: 'unknownProperty',
  MISSING_PROPERTY: 'missingProperty',
  INVALID_PROPERTY_DESCRIPTOR: 'invalidPropertyDescriptor',
  UNSUPPORTED_VERSION: 'unsupportedVersion',
  UNKNOWN_ACTION: 'unknownAction',
  INVALID_SOURCE: 'invalidSource',
  INVALID_REQUEST_ID: 'invalidRequestId',
  REQUEST_ID_TOO_LONG: 'requestIdTooLong',
  INVALID_GATEWAY_REQUEST_ID: 'invalidGatewayRequestId',
  INVALID_TIMESTAMP: 'invalidTimestamp',
  INVALID_REFERENCE_TIMESTAMP: 'invalidReferenceTimestamp',
  TIMESTAMP_OUTSIDE_TOLERANCE: 'timestampOutsideTolerance',
  INVALID_PAYLOAD: 'invalidPayload',
  INVALID_SUCCESS: 'invalidSuccess',
  INVALID_HANDLER: 'invalidHandler',
  INVALID_DATA: 'invalidData',
  INVALID_ERROR: 'invalidError',
  INVALID_ERROR_CODE: 'invalidErrorCode',
  INVALID_ERROR_MESSAGE: 'invalidErrorMessage',
  INVALID_RETRYABLE: 'invalidRetryable',
  INVALID_ERROR_DETAILS: 'invalidErrorDetails',
  INVALID_WARNINGS: 'invalidWarnings',
  INVALID_META: 'invalidMeta',
  INVALID_DURATION: 'invalidDuration',
  INVALID_PROCESSED_BY: 'invalidProcessedBy',
  INVALID_GATEWAY_ACTION: 'invalidGatewayAction',
  RESPONSE_VERSION_MISMATCH: 'responseVersionMismatch',
  RESPONSE_ACTION_MISMATCH: 'responseActionMismatch',
  RESPONSE_REQUEST_ID_MISMATCH: 'responseRequestIdMismatch',
})

const EMPTY_ERROR_DETAILS = Object.freeze([])

function createResponseErrorProfile(code, message, retryable) {
  return Object.freeze({
    code,
    message,
    retryable,
    details: EMPTY_ERROR_DETAILS,
  })
}

export const SYNC_CONTRACT_RESPONSE_ERROR_PROFILES = Object.freeze({
  INVALID_JSON: createResponseErrorProfile(
    'INVALID_JSON',
    'Die Anfrage enthält kein gültiges JSON.',
    false
  ),
  VALIDATION_ERROR: createResponseErrorProfile(
    'VALIDATION_ERROR',
    'Die Anfrage entspricht nicht dem Sync-Vertrag.',
    false
  ),
  UNSUPPORTED_VERSION: createResponseErrorProfile(
    'UNSUPPORTED_VERSION',
    'Die Vertragsversion wird nicht unterstützt.',
    false
  ),
  UNKNOWN_ACTION: createResponseErrorProfile(
    'UNKNOWN_ACTION',
    'Die angeforderte Aktion wird nicht unterstützt.',
    false
  ),
  PAYLOAD_TOO_LARGE: createResponseErrorProfile(
    'PAYLOAD_TOO_LARGE',
    'Die Anfrage überschreitet die zulässige Größe.',
    false
  ),
  FORBIDDEN: createResponseErrorProfile(
    'FORBIDDEN',
    'Die Anfrage ist in diesem Kontext nicht erlaubt.',
    false
  ),
  SERVICE_UNAVAILABLE: createResponseErrorProfile(
    'SERVICE_UNAVAILABLE',
    'Der Sync-Dienst ist vorübergehend nicht verfügbar.',
    true
  ),
  INTERNAL_ERROR: createResponseErrorProfile(
    'INTERNAL_ERROR',
    'Die Anfrage konnte nicht verarbeitet werden.',
    false
  ),
})

const REQUEST_PROPERTY_NAMES = Object.freeze([
  'version',
  'action',
  'source',
  'requestId',
  'timestamp',
  'payload',
])

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

const ERROR_PROPERTY_NAMES = Object.freeze([
  'code',
  'message',
  'retryable',
  'details',
])

const META_PROPERTY_NAMES = Object.freeze([
  'durationMs',
  'processedBy',
])

const EMPTY_PROPERTY_NAMES = Object.freeze([])

const REQUEST_PROPERTY_NAME_SET = new Set(REQUEST_PROPERTY_NAMES)
const RESPONSE_PROPERTY_NAME_SET = new Set(RESPONSE_PROPERTY_NAMES)
const SUCCESS_DATA_PROPERTY_NAME_SET = new Set(SUCCESS_DATA_PROPERTY_NAMES)
const ERROR_PROPERTY_NAME_SET = new Set(ERROR_PROPERTY_NAMES)
const META_PROPERTY_NAME_SET = new Set(META_PROPERTY_NAMES)
const EMPTY_PROPERTY_NAME_SET = new Set()

const NORMAL_RESPONSE_ERROR_CODES = new Set([
  'VALIDATION_ERROR',
  'SERVICE_UNAVAILABLE',
  'INTERNAL_ERROR',
])

const GATEWAY_RESPONSE_ERROR_CODES = new Set([
  'INVALID_JSON',
  'VALIDATION_ERROR',
  'UNSUPPORTED_VERSION',
  'UNKNOWN_ACTION',
  'PAYLOAD_TOO_LARGE',
  'FORBIDDEN',
])

const CANONICAL_UTC_TIMESTAMP_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
// Der Vertrag prüft ausschließlich die sichere Wire-Struktur. Ausreichende
// Kollisionsentropie bleibt Aufgabe des späteren GoldenDawn-ID-Generators.
const REQUEST_ID_PATTERN = /^req_[A-Za-z0-9][A-Za-z0-9_-]*$/
const GATEWAY_REQUEST_ID_PATTERN =
  /^gateway_[A-Za-z0-9][A-Za-z0-9_-]*$/

function addError(errors, code, path, message) {
  errors.push({ code, path, message })
}

function createValidationResult(errors) {
  return errors.length === 0
    ? { ok: true, errors: [] }
    : { ok: false, errors }
}

function isArray(value) {
  try {
    return Array.isArray(value)
  } catch {
    return false
  }
}

function getSupportedPrototype(value, expectedPrototype) {
  let prototype

  try {
    prototype = Object.getPrototypeOf(value)
  } catch {
    return { ok: false }
  }

  return {
    ok: prototype === expectedPrototype || prototype === null,
  }
}

function readOwnKeys(value) {
  try {
    return { ok: true, ownKeys: Reflect.ownKeys(value) }
  } catch {
    return { ok: false, ownKeys: [] }
  }
}

function readOwnPropertyDescriptor(value, propertyName) {
  try {
    return {
      ok: true,
      descriptor: Object.getOwnPropertyDescriptor(value, propertyName),
    }
  } catch {
    return { ok: false, descriptor: undefined }
  }
}

function isEnumerableDataDescriptor(descriptor) {
  return (
    descriptor !== undefined &&
    descriptor.enumerable === true &&
    Object.prototype.hasOwnProperty.call(descriptor, 'value')
  )
}

function isArrayLengthDescriptor(descriptor) {
  return (
    descriptor !== undefined &&
    descriptor.enumerable === false &&
    Object.prototype.hasOwnProperty.call(descriptor, 'value') &&
    Number.isSafeInteger(descriptor.value) &&
    descriptor.value >= 0
  )
}

function inspectRecord(
  value,
  path,
  propertyNames,
  propertyNameSet,
  errors,
  invalidCode,
  invalidMessage
) {
  if (
    typeof value !== 'object' ||
    value === null ||
    isArray(value)
  ) {
    addError(errors, invalidCode, path, invalidMessage)
    return { isInspectable: false, values: new Map() }
  }

  const prototypeResult = getSupportedPrototype(value, Object.prototype)

  if (!prototypeResult.ok) {
    addError(errors, invalidCode, path, invalidMessage)
    return { isInspectable: false, values: new Map() }
  }

  const ownKeysResult = readOwnKeys(value)

  if (!ownKeysResult.ok) {
    addError(errors, invalidCode, path, invalidMessage)
    return { isInspectable: false, values: new Map() }
  }

  const ownStringKeys = new Set()
  let hasUnknownProperty = false

  for (const propertyName of ownKeysResult.ownKeys) {
    if (
      typeof propertyName === 'string' &&
      propertyNameSet.has(propertyName)
    ) {
      ownStringKeys.add(propertyName)
    } else {
      hasUnknownProperty = true
    }
  }

  if (hasUnknownProperty) {
    addError(
      errors,
      SYNC_CONTRACT_VALIDATION_ERROR_CODES.UNKNOWN_PROPERTY,
      `${path}.*`,
      'Der Vertrag enthält ein nicht unterstütztes Feld.'
    )
  }

  const values = new Map()

  for (const propertyName of propertyNames) {
    const propertyPath = `${path}.${propertyName}`

    if (!ownStringKeys.has(propertyName)) {
      addError(
        errors,
        SYNC_CONTRACT_VALIDATION_ERROR_CODES.MISSING_PROPERTY,
        propertyPath,
        'Ein erforderliches Vertragsfeld fehlt.'
      )
      continue
    }

    const descriptorResult = readOwnPropertyDescriptor(value, propertyName)

    if (
      !descriptorResult.ok ||
      !isEnumerableDataDescriptor(descriptorResult.descriptor)
    ) {
      addError(
        errors,
        SYNC_CONTRACT_VALIDATION_ERROR_CODES.INVALID_PROPERTY_DESCRIPTOR,
        propertyPath,
        'Das Vertragsfeld muss eine lesbare eigene Dateneigenschaft sein.'
      )
      continue
    }

    values.set(propertyName, descriptorResult.descriptor.value)
  }

  return { isInspectable: true, values }
}

function isCanonicalArrayPosition(propertyName, arrayLength) {
  if (typeof propertyName !== 'string' || propertyName.length === 0) {
    return false
  }

  const position = Number(propertyName)

  return (
    Number.isSafeInteger(position) &&
    position >= 0 &&
    position < arrayLength &&
    String(position) === propertyName
  )
}

function inspectExactArray(
  value,
  path,
  expectedLength,
  errors,
  invalidCode,
  invalidMessage
) {
  if (!isArray(value)) {
    addError(errors, invalidCode, path, invalidMessage)
    return { isInspectable: false, values: new Map() }
  }

  const prototypeResult = getSupportedPrototype(value, Array.prototype)

  if (!prototypeResult.ok) {
    addError(errors, invalidCode, path, invalidMessage)
    return { isInspectable: false, values: new Map() }
  }

  const lengthDescriptorResult = readOwnPropertyDescriptor(value, 'length')

  if (
    !lengthDescriptorResult.ok ||
    !isArrayLengthDescriptor(lengthDescriptorResult.descriptor)
  ) {
    addError(errors, invalidCode, path, invalidMessage)
    return { isInspectable: false, values: new Map() }
  }

  const arrayLength = lengthDescriptorResult.descriptor.value

  if (arrayLength !== expectedLength) {
    addError(errors, invalidCode, path, invalidMessage)
    return { isInspectable: true, values: new Map() }
  }

  const ownKeysResult = readOwnKeys(value)

  if (!ownKeysResult.ok) {
    addError(errors, invalidCode, path, invalidMessage)
    return { isInspectable: false, values: new Map() }
  }

  const ownPositionKeys = new Set()
  let hasUnknownProperty = false

  for (const propertyName of ownKeysResult.ownKeys) {
    if (propertyName === 'length') {
      continue
    }

    if (isCanonicalArrayPosition(propertyName, arrayLength)) {
      ownPositionKeys.add(propertyName)
    } else {
      hasUnknownProperty = true
    }
  }

  if (hasUnknownProperty) {
    addError(
      errors,
      SYNC_CONTRACT_VALIDATION_ERROR_CODES.UNKNOWN_PROPERTY,
      `${path}.*`,
      'Der Vertrag enthält ein nicht unterstütztes Feld.'
    )
  }

  const values = new Map()

  for (let index = 0; index < expectedLength; index += 1) {
    const propertyName = String(index)
    const positionPath = `${path}[${index}]`

    if (!ownPositionKeys.has(propertyName)) {
      addError(errors, invalidCode, positionPath, invalidMessage)
      continue
    }

    const descriptorResult = readOwnPropertyDescriptor(value, propertyName)

    if (
      !descriptorResult.ok ||
      !isEnumerableDataDescriptor(descriptorResult.descriptor)
    ) {
      addError(
        errors,
        SYNC_CONTRACT_VALIDATION_ERROR_CODES.INVALID_PROPERTY_DESCRIPTOR,
        positionPath,
        'Die Arrayposition muss eine lesbare eigene Dateneigenschaft sein.'
      )
      continue
    }

    values.set(index, descriptorResult.descriptor.value)
  }

  return { isInspectable: true, values }
}

function getCanonicalTimestampMilliseconds(value) {
  if (
    typeof value !== 'string' ||
    value.length !== 24 ||
    !CANONICAL_UTC_TIMESTAMP_PATTERN.test(value)
  ) {
    return null
  }

  const timestampMilliseconds = Date.parse(value)

  if (!Number.isFinite(timestampMilliseconds)) {
    return null
  }

  try {
    return new Date(timestampMilliseconds).toISOString() === value
      ? timestampMilliseconds
      : null
  } catch {
    return null
  }
}

function validateRequestId(value, path, errors) {
  if (typeof value !== 'string') {
    addError(
      errors,
      SYNC_CONTRACT_VALIDATION_ERROR_CODES.INVALID_REQUEST_ID,
      path,
      'Die Request-ID muss dem festgelegten sicheren Format entsprechen.'
    )
    return false
  }

  if (value.length > SYNC_CONTRACT_REQUEST_ID_MAX_LENGTH) {
    addError(
      errors,
      SYNC_CONTRACT_VALIDATION_ERROR_CODES.REQUEST_ID_TOO_LONG,
      path,
      'Die Request-ID überschreitet die zulässige Länge.'
    )
    return false
  }

  if (!REQUEST_ID_PATTERN.test(value)) {
    addError(
      errors,
      SYNC_CONTRACT_VALIDATION_ERROR_CODES.INVALID_REQUEST_ID,
      path,
      'Die Request-ID muss dem festgelegten sicheren Format entsprechen.'
    )
    return false
  }

  return true
}

function validateGatewayRequestId(value, path, errors) {
  if (typeof value !== 'string') {
    addError(
      errors,
      SYNC_CONTRACT_VALIDATION_ERROR_CODES.INVALID_GATEWAY_REQUEST_ID,
      path,
      'Die Gateway-Korrelations-ID muss dem festgelegten sicheren Format entsprechen.'
    )
    return false
  }

  if (value.length > SYNC_CONTRACT_REQUEST_ID_MAX_LENGTH) {
    addError(
      errors,
      SYNC_CONTRACT_VALIDATION_ERROR_CODES.INVALID_GATEWAY_REQUEST_ID,
      path,
      'Die Gateway-Korrelations-ID muss dem festgelegten sicheren Format entsprechen.'
    )
    return false
  }

  if (GATEWAY_REQUEST_ID_PATTERN.test(value)) {
    return true
  }

  addError(
    errors,
    SYNC_CONTRACT_VALIDATION_ERROR_CODES.INVALID_GATEWAY_REQUEST_ID,
    path,
    'Die Gateway-Korrelations-ID muss dem festgelegten sicheren Format entsprechen.'
  )
  return false
}

function validateEmptyRecord(value, path, errors, invalidCode, invalidMessage) {
  inspectRecord(
    value,
    path,
    EMPTY_PROPERTY_NAMES,
    EMPTY_PROPERTY_NAME_SET,
    errors,
    invalidCode,
    invalidMessage
  )
}

function validateRequestStructure(
  syncRequest,
  referenceTimestamp,
  validateTimestampTolerance
) {
  const errors = []
  const requestResult = inspectRecord(
    syncRequest,
    '$',
    REQUEST_PROPERTY_NAMES,
    REQUEST_PROPERTY_NAME_SET,
    errors,
    SYNC_CONTRACT_VALIDATION_ERROR_CODES.INVALID_SYNC_REQUEST,
    'Der Sync-Request muss ein unterstütztes Vertragsobjekt sein.'
  )

  if (!requestResult.isInspectable) {
    return { errors, values: requestResult.values }
  }

  const { values } = requestResult

  if (
    values.has('version') &&
    values.get('version') !== SYNC_CONTRACT_VERSION
  ) {
    addError(
      errors,
      SYNC_CONTRACT_VALIDATION_ERROR_CODES.UNSUPPORTED_VERSION,
      '$.version',
      'Die Vertragsversion wird nicht unterstützt.'
    )
  }

  if (
    values.has('action') &&
    !SYNC_CONTRACT_ACTIONS.includes(values.get('action'))
  ) {
    addError(
      errors,
      SYNC_CONTRACT_VALIDATION_ERROR_CODES.UNKNOWN_ACTION,
      '$.action',
      'Die Aktion wird von diesem Vertrag nicht unterstützt.'
    )
  }

  if (
    values.has('source') &&
    !SYNC_CONTRACT_SOURCES.includes(values.get('source'))
  ) {
    addError(
      errors,
      SYNC_CONTRACT_VALIDATION_ERROR_CODES.INVALID_SOURCE,
      '$.source',
      'Die Request-Quelle wird von diesem Vertrag nicht unterstützt.'
    )
  }

  if (values.has('requestId')) {
    validateRequestId(values.get('requestId'), '$.requestId', errors)
  }

  let requestTimestampMilliseconds = null

  if (values.has('timestamp')) {
    requestTimestampMilliseconds = getCanonicalTimestampMilliseconds(
      values.get('timestamp')
    )

    if (requestTimestampMilliseconds === null) {
      addError(
        errors,
        SYNC_CONTRACT_VALIDATION_ERROR_CODES.INVALID_TIMESTAMP,
        '$.timestamp',
        'Der Request-Zeitstempel muss ein kanonischer ISO-8601-UTC-Wert sein.'
      )
    }
  }

  if (values.has('payload')) {
    validateEmptyRecord(
      values.get('payload'),
      '$.payload',
      errors,
      SYNC_CONTRACT_VALIDATION_ERROR_CODES.INVALID_PAYLOAD,
      'Der syncTest-Payload muss ein exakt leeres Objekt sein.'
    )
  }

  if (validateTimestampTolerance) {
    const referenceTimestampMilliseconds =
      getCanonicalTimestampMilliseconds(referenceTimestamp)

    if (referenceTimestampMilliseconds === null) {
      addError(
        errors,
        SYNC_CONTRACT_VALIDATION_ERROR_CODES.INVALID_REFERENCE_TIMESTAMP,
        '$referenceTimestamp',
        'Die Referenzzeit muss ein kanonischer ISO-8601-UTC-Wert sein.'
      )
    } else if (
      requestTimestampMilliseconds !== null &&
      Math.abs(
        requestTimestampMilliseconds - referenceTimestampMilliseconds
      ) > SYNC_CONTRACT_TIMESTAMP_TOLERANCE_MS
    ) {
      addError(
        errors,
        SYNC_CONTRACT_VALIDATION_ERROR_CODES.TIMESTAMP_OUTSIDE_TOLERANCE,
        '$.timestamp',
        'Der Request-Zeitstempel liegt außerhalb des zulässigen Zeitfensters.'
      )
    }
  }

  return { errors, values }
}

function validateSuccessData(value, path, errors) {
  const dataResult = inspectRecord(
    value,
    path,
    SUCCESS_DATA_PROPERTY_NAMES,
    SUCCESS_DATA_PROPERTY_NAME_SET,
    errors,
    SYNC_CONTRACT_VALIDATION_ERROR_CODES.INVALID_DATA,
    'Die Sync-Erfolgsdaten entsprechen nicht dem Vertrag.'
  )

  if (!dataResult.isInspectable) {
    return
  }

  if (
    dataResult.values.has('status') &&
    dataResult.values.get('status') !== 'ok'
  ) {
    addError(
      errors,
      SYNC_CONTRACT_VALIDATION_ERROR_CODES.INVALID_DATA,
      `${path}.status`,
      'Der Sync-Status wird nicht unterstützt.'
    )
  }

  if (
    dataResult.values.has('dataOrigin') &&
    !SYNC_CONTRACT_DATA_ORIGINS.includes(
      dataResult.values.get('dataOrigin')
    )
  ) {
    addError(
      errors,
      SYNC_CONTRACT_VALIDATION_ERROR_CODES.INVALID_DATA,
      `${path}.dataOrigin`,
      'Die Sync-Datenherkunft wird nicht unterstützt.'
    )
  }
}

function validateResponseError(value, path, allowedCodes, errors) {
  const errorResult = inspectRecord(
    value,
    path,
    ERROR_PROPERTY_NAMES,
    ERROR_PROPERTY_NAME_SET,
    errors,
    SYNC_CONTRACT_VALIDATION_ERROR_CODES.INVALID_ERROR,
    'Der Sync-Fehler entspricht nicht dem Vertrag.'
  )

  if (!errorResult.isInspectable) {
    return
  }

  const code = errorResult.values.get('code')
  const hasSupportedCode = (
    errorResult.values.has('code') &&
    typeof code === 'string' &&
    allowedCodes.has(code)
  )

  if (errorResult.values.has('code') && !hasSupportedCode) {
    addError(
      errors,
      SYNC_CONTRACT_VALIDATION_ERROR_CODES.INVALID_ERROR_CODE,
      `${path}.code`,
      'Der Fehlercode wird für dieses Response-Profil nicht unterstützt.'
    )
  }

  if (hasSupportedCode) {
    const profile = SYNC_CONTRACT_RESPONSE_ERROR_PROFILES[code]

    if (
      errorResult.values.has('message') &&
      errorResult.values.get('message') !== profile.message
    ) {
      addError(
        errors,
        SYNC_CONTRACT_VALIDATION_ERROR_CODES.INVALID_ERROR_MESSAGE,
        `${path}.message`,
        'Die Fehlermeldung entspricht nicht dem statischen Fehlerprofil.'
      )
    }

    if (
      errorResult.values.has('retryable') &&
      errorResult.values.get('retryable') !== profile.retryable
    ) {
      addError(
        errors,
        SYNC_CONTRACT_VALIDATION_ERROR_CODES.INVALID_RETRYABLE,
        `${path}.retryable`,
        'Der Retry-Wert entspricht nicht dem statischen Fehlerprofil.'
      )
    }
  }

  if (errorResult.values.has('details')) {
    inspectExactArray(
      errorResult.values.get('details'),
      `${path}.details`,
      0,
      errors,
      SYNC_CONTRACT_VALIDATION_ERROR_CODES.INVALID_ERROR_DETAILS,
      'Fehlerdetails müssen für diesen Vertrag leer bleiben.'
    )
  }
}

function validateWarnings(value, path, errors) {
  inspectExactArray(
    value,
    path,
    0,
    errors,
    SYNC_CONTRACT_VALIDATION_ERROR_CODES.INVALID_WARNINGS,
    'Warnungen müssen für diesen Vertrag leer bleiben.'
  )
}

function validateMeta(value, path, expectedHandlers, errors) {
  const metaResult = inspectRecord(
    value,
    path,
    META_PROPERTY_NAMES,
    META_PROPERTY_NAME_SET,
    errors,
    SYNC_CONTRACT_VALIDATION_ERROR_CODES.INVALID_META,
    'Die Sync-Metadaten entsprechen nicht dem Vertrag.'
  )

  if (!metaResult.isInspectable) {
    return
  }

  if (metaResult.values.has('durationMs')) {
    const durationMs = metaResult.values.get('durationMs')

    if (
      !Number.isSafeInteger(durationMs) ||
      durationMs < 0 ||
      durationMs > SYNC_CONTRACT_MAX_DURATION_MS
    ) {
      addError(
        errors,
        SYNC_CONTRACT_VALIDATION_ERROR_CODES.INVALID_DURATION,
        `${path}.durationMs`,
        'Die Verarbeitungsdauer liegt außerhalb des zulässigen Bereichs.'
      )
    }
  }

  if (metaResult.values.has('processedBy')) {
    const processedByResult = inspectExactArray(
      metaResult.values.get('processedBy'),
      `${path}.processedBy`,
      expectedHandlers.length,
      errors,
      SYNC_CONTRACT_VALIDATION_ERROR_CODES.INVALID_PROCESSED_BY,
      'Die Verarbeitungskette entspricht nicht dem Response-Profil.'
    )

    for (let index = 0; index < expectedHandlers.length; index += 1) {
      if (
        processedByResult.values.has(index) &&
        processedByResult.values.get(index) !== expectedHandlers[index]
      ) {
        addError(
          errors,
          SYNC_CONTRACT_VALIDATION_ERROR_CODES.INVALID_PROCESSED_BY,
          `${path}.processedBy[${index}]`,
          'Die Verarbeitungskette enthält einen nicht unterstützten Handler.'
        )
      }
    }
  }
}

function getCorrelationReference(correlatedRequest) {
  const result = validateRequestStructure(
    correlatedRequest,
    undefined,
    false
  )

  if (result.errors.length > 0) {
    return null
  }

  return {
    version: result.values.get('version'),
    action: result.values.get('action'),
    requestId: result.values.get('requestId'),
  }
}

function validateNormalCorrelation(responseValues, correlatedRequest, errors) {
  const correlation = getCorrelationReference(correlatedRequest)

  if (correlation === null) {
    addError(
      errors,
      SYNC_CONTRACT_VALIDATION_ERROR_CODES.INVALID_CORRELATED_REQUEST,
      '$correlatedRequest',
      'Der Korrelationsrequest entspricht nicht dem Sync-Vertrag.'
    )
    return
  }

  if (
    responseValues.has('version') &&
    responseValues.get('version') !== correlation.version
  ) {
    addError(
      errors,
      SYNC_CONTRACT_VALIDATION_ERROR_CODES.RESPONSE_VERSION_MISMATCH,
      '$.version',
      'Die Response-Version stimmt nicht mit dem Request überein.'
    )
  }

  if (
    responseValues.has('action') &&
    responseValues.get('action') !== correlation.action
  ) {
    addError(
      errors,
      SYNC_CONTRACT_VALIDATION_ERROR_CODES.RESPONSE_ACTION_MISMATCH,
      '$.action',
      'Die Response-Aktion stimmt nicht mit dem Request überein.'
    )
  }

  if (
    responseValues.has('requestId') &&
    responseValues.get('requestId') !== correlation.requestId
  ) {
    addError(
      errors,
      SYNC_CONTRACT_VALIDATION_ERROR_CODES.RESPONSE_REQUEST_ID_MISMATCH,
      '$.requestId',
      'Die Response-ID stimmt nicht mit dem Request überein.'
    )
  }
}

function validateResponseEnvelope(syncResponse, profile, correlatedRequest) {
  const errors = []
  const invalidRootCode = profile === 'gateway'
    ? SYNC_CONTRACT_VALIDATION_ERROR_CODES.INVALID_GATEWAY_ERROR_RESPONSE
    : SYNC_CONTRACT_VALIDATION_ERROR_CODES.INVALID_SYNC_RESPONSE
  const invalidRootMessage = profile === 'gateway'
    ? 'Die Gateway-Fehlerresponse muss ein unterstütztes Vertragsobjekt sein.'
    : 'Die Sync-Response muss ein unterstütztes Vertragsobjekt sein.'
  const responseResult = inspectRecord(
    syncResponse,
    '$',
    RESPONSE_PROPERTY_NAMES,
    RESPONSE_PROPERTY_NAME_SET,
    errors,
    invalidRootCode,
    invalidRootMessage
  )

  if (!responseResult.isInspectable) {
    return createValidationResult(errors)
  }

  const { values } = responseResult

  if (
    values.has('version') &&
    values.get('version') !== SYNC_CONTRACT_VERSION
  ) {
    addError(
      errors,
      SYNC_CONTRACT_VALIDATION_ERROR_CODES.UNSUPPORTED_VERSION,
      '$.version',
      'Die Response-Vertragsversion wird nicht unterstützt.'
    )
  }

  if (values.has('timestamp')) {
    if (getCanonicalTimestampMilliseconds(values.get('timestamp')) === null) {
      addError(
        errors,
        SYNC_CONTRACT_VALIDATION_ERROR_CODES.INVALID_TIMESTAMP,
        '$.timestamp',
        'Der Response-Zeitstempel muss ein kanonischer ISO-8601-UTC-Wert sein.'
      )
    }
  }

  if (values.has('warnings')) {
    validateWarnings(values.get('warnings'), '$.warnings', errors)
  }

  if (profile === 'gateway') {
    if (values.has('success') && values.get('success') !== false) {
      addError(
        errors,
        SYNC_CONTRACT_VALIDATION_ERROR_CODES.INVALID_SUCCESS,
        '$.success',
        'Eine Gateway-Fehlerresponse muss success false verwenden.'
      )
    }

    if (values.has('requestId')) {
      validateGatewayRequestId(values.get('requestId'), '$.requestId', errors)
    }

    if (values.has('action') && values.get('action') !== null) {
      addError(
        errors,
        SYNC_CONTRACT_VALIDATION_ERROR_CODES.INVALID_GATEWAY_ACTION,
        '$.action',
        'Eine frühe Gateway-Fehlerresponse muss action null verwenden.'
      )
    }

    if (values.has('handledBy') && values.get('handledBy') !== null) {
      addError(
        errors,
        SYNC_CONTRACT_VALIDATION_ERROR_CODES.INVALID_HANDLER,
        '$.handledBy',
        'Eine frühe Gateway-Fehlerresponse darf keinen Handler ausweisen.'
      )
    }

    if (values.has('data') && values.get('data') !== null) {
      addError(
        errors,
        SYNC_CONTRACT_VALIDATION_ERROR_CODES.INVALID_DATA,
        '$.data',
        'Eine Gateway-Fehlerresponse muss data null verwenden.'
      )
    }

    if (values.has('error')) {
      validateResponseError(
        values.get('error'),
        '$.error',
        GATEWAY_RESPONSE_ERROR_CODES,
        errors
      )
    }

    if (values.has('meta')) {
      validateMeta(values.get('meta'), '$.meta', [], errors)
    }
  } else {
    if (
      values.has('success') &&
      typeof values.get('success') !== 'boolean'
    ) {
      addError(
        errors,
        SYNC_CONTRACT_VALIDATION_ERROR_CODES.INVALID_SUCCESS,
        '$.success',
        'success muss ein boolescher Wert sein.'
      )
    }

    if (values.has('requestId')) {
      validateRequestId(values.get('requestId'), '$.requestId', errors)
    }

    if (
      values.has('action') &&
      !SYNC_CONTRACT_ACTIONS.includes(values.get('action'))
    ) {
      addError(
        errors,
        SYNC_CONTRACT_VALIDATION_ERROR_CODES.UNKNOWN_ACTION,
        '$.action',
        'Die Response-Aktion wird nicht unterstützt.'
      )
    }

    if (
      values.has('handledBy') &&
      !SYNC_CONTRACT_HANDLERS.includes(values.get('handledBy'))
    ) {
      addError(
        errors,
        SYNC_CONTRACT_VALIDATION_ERROR_CODES.INVALID_HANDLER,
        '$.handledBy',
        'Der Response-Handler wird nicht unterstützt.'
      )
    }

    if (values.get('success') === true) {
      if (values.has('data')) {
        validateSuccessData(values.get('data'), '$.data', errors)
      }

      if (values.has('error') && values.get('error') !== null) {
        addError(
          errors,
          SYNC_CONTRACT_VALIDATION_ERROR_CODES.INVALID_ERROR,
          '$.error',
          'Eine erfolgreiche Sync-Response muss error null verwenden.'
        )
      }
    } else if (values.get('success') === false) {
      if (values.has('data') && values.get('data') !== null) {
        addError(
          errors,
          SYNC_CONTRACT_VALIDATION_ERROR_CODES.INVALID_DATA,
          '$.data',
          'Eine fehlgeschlagene Sync-Response muss data null verwenden.'
        )
      }

      if (values.has('error')) {
        validateResponseError(
          values.get('error'),
          '$.error',
          NORMAL_RESPONSE_ERROR_CODES,
          errors
        )
      }
    }

    if (values.has('meta')) {
      validateMeta(values.get('meta'), '$.meta', ['SyncAgent'], errors)
    }

    validateNormalCorrelation(values, correlatedRequest, errors)
  }

  return createValidationResult(errors)
}

function getUtf8ByteLengthUpToLimit(value, byteLimit) {
  let byteLength = 0

  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index)

    if (codeUnit <= 0x7f) {
      byteLength += 1
    } else if (codeUnit <= 0x7ff) {
      byteLength += 2
    } else if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      const nextCodeUnit = index + 1 < value.length
        ? value.charCodeAt(index + 1)
        : 0

      if (nextCodeUnit >= 0xdc00 && nextCodeUnit <= 0xdfff) {
        byteLength += 4
        index += 1
      } else {
        byteLength += 3
      }
    } else {
      byteLength += 3
    }

    if (byteLength > byteLimit) {
      return byteLength
    }
  }

  return byteLength
}

export function validateSyncRequest(syncRequest, referenceTimestamp) {
  const result = validateRequestStructure(
    syncRequest,
    referenceTimestamp,
    true
  )

  return createValidationResult(result.errors)
}

export function validateSyncResponse(syncResponse, correlatedRequest) {
  return validateResponseEnvelope(
    syncResponse,
    'normal',
    correlatedRequest
  )
}

export function validateSyncGatewayErrorResponse(syncResponse) {
  return validateResponseEnvelope(syncResponse, 'gateway', undefined)
}

export function validateSyncRawBodySize(rawBody) {
  const errors = []

  if (typeof rawBody !== 'string') {
    addError(
      errors,
      SYNC_CONTRACT_VALIDATION_ERROR_CODES.INVALID_RAW_BODY,
      '$rawBody',
      'Der rohe Request-Body muss als Zeichenfolge vorliegen.'
    )
    return createValidationResult(errors)
  }

  if (
    getUtf8ByteLengthUpToLimit(
      rawBody,
      SYNC_CONTRACT_MAX_RAW_BODY_BYTES
    ) > SYNC_CONTRACT_MAX_RAW_BODY_BYTES
  ) {
    addError(
      errors,
      SYNC_CONTRACT_VALIDATION_ERROR_CODES.RAW_BODY_TOO_LARGE,
      '$rawBody',
      'Der rohe Request-Body überschreitet 64 KiB UTF-8-Daten.'
    )
  }

  return createValidationResult(errors)
}
