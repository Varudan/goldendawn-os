import assert from 'node:assert/strict'
import test from 'node:test'

import * as syncContract from '../src/contracts/syncContract.js'

const {
  SYNC_CONTRACT_VERSION,
  SYNC_CONTRACT_ACTIONS,
  SYNC_CONTRACT_SOURCES,
  SYNC_CONTRACT_HANDLERS,
  SYNC_CONTRACT_DATA_ORIGINS,
  SYNC_CONTRACT_MAX_RAW_BODY_BYTES,
  SYNC_CONTRACT_REQUEST_ID_MAX_LENGTH,
  SYNC_CONTRACT_TIMESTAMP_TOLERANCE_MS,
  SYNC_CONTRACT_MAX_DURATION_MS,
  SYNC_CONTRACT_VALIDATION_ERROR_CODES,
  SYNC_CONTRACT_RESPONSE_ERROR_PROFILES,
  validateSyncRequest,
  validateSyncResponse,
  validateSyncGatewayErrorResponse,
  validateSyncRawBodySize,
} = syncContract

const REFERENCE_TIMESTAMP = '2026-08-03T12:00:00.000Z'
const RESPONSE_TIMESTAMP = '2026-08-03T12:00:00.125Z'
const REQUEST_ID = 'req_2f78d95e-9096-4a76-8a2f-6ed149dc53b9'
const GATEWAY_REQUEST_ID =
  'gateway_63bf9a18-177f-4f35-8a04-1b619bada742'
const EXPECTED_RESPONSE_ERROR_PROFILES = {
  INVALID_JSON: {
    code: 'INVALID_JSON',
    message: 'Die Anfrage enthält kein gültiges JSON.',
    retryable: false,
    details: [],
  },
  VALIDATION_ERROR: {
    code: 'VALIDATION_ERROR',
    message: 'Die Anfrage entspricht nicht dem Sync-Vertrag.',
    retryable: false,
    details: [],
  },
  UNSUPPORTED_VERSION: {
    code: 'UNSUPPORTED_VERSION',
    message: 'Die Vertragsversion wird nicht unterstützt.',
    retryable: false,
    details: [],
  },
  UNKNOWN_ACTION: {
    code: 'UNKNOWN_ACTION',
    message: 'Die angeforderte Aktion wird nicht unterstützt.',
    retryable: false,
    details: [],
  },
  PAYLOAD_TOO_LARGE: {
    code: 'PAYLOAD_TOO_LARGE',
    message: 'Die Anfrage überschreitet die zulässige Größe.',
    retryable: false,
    details: [],
  },
  FORBIDDEN: {
    code: 'FORBIDDEN',
    message: 'Die Anfrage ist in diesem Kontext nicht erlaubt.',
    retryable: false,
    details: [],
  },
  SERVICE_UNAVAILABLE: {
    code: 'SERVICE_UNAVAILABLE',
    message: 'Der Sync-Dienst ist vorübergehend nicht verfügbar.',
    retryable: true,
    details: [],
  },
  INTERNAL_ERROR: {
    code: 'INTERNAL_ERROR',
    message: 'Die Anfrage konnte nicht verarbeitet werden.',
    retryable: false,
    details: [],
  },
}

function createRequest(overrides = {}) {
  return {
    version: '1.0',
    action: 'syncTest',
    source: 'goldendawn-os',
    requestId: REQUEST_ID,
    timestamp: REFERENCE_TIMESTAMP,
    payload: {},
    ...overrides,
  }
}

function createResponseError(code) {
  const profile = EXPECTED_RESPONSE_ERROR_PROFILES[code]

  return {
    code: profile.code,
    message: profile.message,
    retryable: profile.retryable,
    details: [],
  }
}

function createSuccessResponse(request = createRequest(), overrides = {}) {
  return {
    version: '1.0',
    success: true,
    requestId: request.requestId,
    action: request.action,
    handledBy: 'SyncAgent',
    timestamp: RESPONSE_TIMESTAMP,
    data: {
      status: 'ok',
      dataOrigin: 'synthetic',
    },
    error: null,
    warnings: [],
    meta: {
      durationMs: 125,
      processedBy: ['SyncAgent'],
    },
    ...overrides,
  }
}

function createErrorResponse(
  request = createRequest(),
  code = 'SERVICE_UNAVAILABLE',
  overrides = {}
) {
  return createSuccessResponse(request, {
    success: false,
    data: null,
    error: createResponseError(code),
    ...overrides,
  })
}

function createGatewayErrorResponse(
  code = 'INVALID_JSON',
  overrides = {}
) {
  return {
    version: '1.0',
    success: false,
    requestId: GATEWAY_REQUEST_ID,
    action: null,
    handledBy: null,
    timestamp: RESPONSE_TIMESTAMP,
    data: null,
    error: createResponseError(code),
    warnings: [],
    meta: {
      durationMs: 4,
      processedBy: [],
    },
    ...overrides,
  }
}

function getErrorCodes(result) {
  return result.errors.map((error) => error.code)
}

function assertHasError(result, code, path) {
  assert.equal(result.ok, false)
  assert.ok(
    result.errors.some((error) => (
      error.code === code && error.path === path
    )),
    `Erwarteter Fehler ${code} an ${path}: ${JSON.stringify(result.errors)}`
  )
}

function assertErrorsDoNotContain(result, markers) {
  const serializedErrors = JSON.stringify(result.errors)

  for (const marker of markers) {
    assert.equal(serializedErrors.includes(marker), false)
  }
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Reflect.ownKeys(value).forEach((propertyName) => {
      const descriptor = Object.getOwnPropertyDescriptor(value, propertyName)

      if (descriptor && Object.hasOwn(descriptor, 'value')) {
        deepFreeze(descriptor.value)
      }
    })
    Object.freeze(value)
  }

  return value
}

test('exportiert ausschließlich die vereinbarte öffentliche SyncContract-API', () => {
  assert.deepEqual(Object.keys(syncContract).sort(), [
    'SYNC_CONTRACT_ACTIONS',
    'SYNC_CONTRACT_DATA_ORIGINS',
    'SYNC_CONTRACT_HANDLERS',
    'SYNC_CONTRACT_MAX_DURATION_MS',
    'SYNC_CONTRACT_MAX_RAW_BODY_BYTES',
    'SYNC_CONTRACT_REQUEST_ID_MAX_LENGTH',
    'SYNC_CONTRACT_RESPONSE_ERROR_PROFILES',
    'SYNC_CONTRACT_SOURCES',
    'SYNC_CONTRACT_TIMESTAMP_TOLERANCE_MS',
    'SYNC_CONTRACT_VALIDATION_ERROR_CODES',
    'SYNC_CONTRACT_VERSION',
    'validateSyncGatewayErrorResponse',
    'validateSyncRawBodySize',
    'validateSyncRequest',
    'validateSyncResponse',
  ])
})

test('exportiert feste, vollständig eingefrorene Sync-v1-Konstanten', () => {
  assert.equal(SYNC_CONTRACT_VERSION, '1.0')
  assert.deepEqual(SYNC_CONTRACT_ACTIONS, ['syncTest'])
  assert.deepEqual(SYNC_CONTRACT_SOURCES, ['goldendawn-os'])
  assert.deepEqual(SYNC_CONTRACT_HANDLERS, ['SyncAgent'])
  assert.deepEqual(SYNC_CONTRACT_DATA_ORIGINS, ['synthetic'])
  assert.equal(SYNC_CONTRACT_MAX_RAW_BODY_BYTES, 65_536)
  assert.equal(SYNC_CONTRACT_REQUEST_ID_MAX_LENGTH, 64)
  assert.equal(SYNC_CONTRACT_TIMESTAMP_TOLERANCE_MS, 300_000)
  assert.equal(SYNC_CONTRACT_MAX_DURATION_MS, 300_000)
  assert.deepEqual(
    SYNC_CONTRACT_RESPONSE_ERROR_PROFILES,
    EXPECTED_RESPONSE_ERROR_PROFILES
  )

  for (const exportedConstant of [
    SYNC_CONTRACT_ACTIONS,
    SYNC_CONTRACT_SOURCES,
    SYNC_CONTRACT_HANDLERS,
    SYNC_CONTRACT_DATA_ORIGINS,
    SYNC_CONTRACT_VALIDATION_ERROR_CODES,
    SYNC_CONTRACT_RESPONSE_ERROR_PROFILES,
  ]) {
    assert.equal(Object.isFrozen(exportedConstant), true)
  }

  for (const profile of Object.values(
    SYNC_CONTRACT_RESPONSE_ERROR_PROFILES
  )) {
    assert.equal(Object.isFrozen(profile), true)
    assert.equal(Object.isFrozen(profile.details), true)
    assert.deepEqual(Object.keys(profile), [
      'code',
      'message',
      'retryable',
      'details',
    ])
    assert.deepEqual(profile.details, [])
    assert.equal(profile.message.length <= 500, true)
  }
})

test('akzeptiert den exakten syncTest-Request mit regulären und Null-Prototyp-Records', () => {
  const regularRequest = createRequest()
  const nullPrototypePayload = Object.create(null)
  const nullPrototypeRequest = Object.assign(
    Object.create(null),
    createRequest({ payload: nullPrototypePayload })
  )

  assert.deepEqual(
    validateSyncRequest(regularRequest, REFERENCE_TIMESTAMP),
    { ok: true, errors: [] }
  )
  assert.deepEqual(
    validateSyncRequest(nullPrototypeRequest, REFERENCE_TIMESTAMP),
    { ok: true, errors: [] }
  )
  assert.equal(Object.getPrototypeOf(nullPrototypeRequest), null)
  assert.equal(Object.getPrototypeOf(nullPrototypePayload), null)
})

test('akzeptiert stabile tief eingefrorene und versiegelte gewöhnliche Requests ohne Mutation', () => {
  const frozenRequest = deepFreeze(createRequest())
  const sealedPayload = Object.seal({})
  const sealedRequest = Object.seal(createRequest({ payload: sealedPayload }))

  assert.deepEqual(
    validateSyncRequest(frozenRequest, REFERENCE_TIMESTAMP),
    { ok: true, errors: [] }
  )
  assert.deepEqual(
    validateSyncRequest(sealedRequest, REFERENCE_TIMESTAMP),
    { ok: true, errors: [] }
  )
})

test('fordert exakt sechs eigene Request-Felder und lehnt unbekannte Felder redigiert ab', () => {
  const requiredPropertyNames = [
    'version',
    'action',
    'source',
    'requestId',
    'timestamp',
    'payload',
  ]

  for (const propertyName of requiredPropertyNames) {
    const request = createRequest()
    delete request[propertyName]

    assertHasError(
      validateSyncRequest(request, REFERENCE_TIMESTAMP),
      'missingProperty',
      `$.${propertyName}`
    )
  }

  const privateFieldMarker = 'private-request-field-sentinel'
  const request = createRequest()
  request[privateFieldMarker] = 'private-request-value-sentinel'
  request.context = { mode: 'private' }

  const result = validateSyncRequest(request, REFERENCE_TIMESTAMP)

  assertHasError(result, 'unknownProperty', '$.*')
  assertErrorsDoNotContain(result, [
    privateFieldMarker,
    'private-request-value-sentinel',
  ])
})

test('weist eigene Symbol- und besondere Properties im Request und Payload zurück', () => {
  const cases = []
  const rootSymbol = Symbol('private-root-symbol-sentinel')
  const payloadSymbol = Symbol('private-payload-symbol-sentinel')
  const symbolRequest = createRequest()
  symbolRequest[rootSymbol] = 'private-symbol-value-sentinel'
  cases.push({ request: symbolRequest, path: '$.*' })

  const symbolPayloadRequest = createRequest()
  symbolPayloadRequest.payload[payloadSymbol] = 'private-payload-value-sentinel'
  cases.push({ request: symbolPayloadRequest, path: '$.payload.*' })

  for (const propertyName of ['__proto__', 'constructor', 'prototype']) {
    const request = createRequest()
    Object.defineProperty(request.payload, propertyName, {
      configurable: true,
      enumerable: true,
      value: 'private-special-property-value-sentinel',
      writable: true,
    })
    cases.push({ request, path: '$.payload.*' })
  }

  for (const testCase of cases) {
    const result = validateSyncRequest(
      testCase.request,
      REFERENCE_TIMESTAMP
    )

    assertHasError(result, 'unknownProperty', testCase.path)
    assertErrorsDoNotContain(result, [
      'private-root-symbol-sentinel',
      'private-payload-symbol-sentinel',
      'private-symbol-value-sentinel',
      'private-payload-value-sentinel',
      'private-special-property-value-sentinel',
    ])
  }
})

test('akzeptiert ausschließlich Version, Aktion und Quelle der geschlossenen Allowlist', () => {
  const cases = [
    {
      overrides: { version: '2.0' },
      code: 'unsupportedVersion',
      path: '$.version',
    },
    {
      overrides: { version: 1 },
      code: 'unsupportedVersion',
      path: '$.version',
    },
    {
      overrides: { action: 'learningTest.create' },
      code: 'unknownAction',
      path: '$.action',
    },
    {
      overrides: { action: 'SyncTest' },
      code: 'unknownAction',
      path: '$.action',
    },
    {
      overrides: { source: 'SyncAgent' },
      code: 'invalidSource',
      path: '$.source',
    },
    {
      overrides: { source: ' goldendawn-os ' },
      code: 'invalidSource',
      path: '$.source',
    },
  ]

  for (const testCase of cases) {
    assertHasError(
      validateSyncRequest(
        createRequest(testCase.overrides),
        REFERENCE_TIMESTAMP
      ),
      testCase.code,
      testCase.path
    )
  }
})

test('prüft sichere Request-IDs an den exakten Längengrenzen', () => {
  const minimumId = 'req_a'
  const maximumId = `req_${'a'.repeat(60)}`

  assert.equal(minimumId.length, 5)
  assert.equal(maximumId.length, 64)

  for (const requestId of [minimumId, maximumId, REQUEST_ID]) {
    assert.deepEqual(
      validateSyncRequest(
        createRequest({ requestId }),
        REFERENCE_TIMESTAMP
      ),
      { ok: true, errors: [] }
    )
  }

  const invalidIds = [
    '',
    'req_',
    'REQ_a',
    'req_ä',
    'req_a b',
    ' req_a',
    null,
    Symbol('private-request-id-symbol'),
  ]

  for (const requestId of invalidIds) {
    assertHasError(
      validateSyncRequest(
        createRequest({ requestId }),
        REFERENCE_TIMESTAMP
      ),
      'invalidRequestId',
      '$.requestId'
    )
  }

  assertHasError(
    validateSyncRequest(
      createRequest({ requestId: `req_${'a'.repeat(61)}` }),
      REFERENCE_TIMESTAMP
    ),
    'requestIdTooLong',
    '$.requestId'
  )
})

test('prüft IDs nur strukturell und begrenzt sehr lange Werte vor dem Mustervergleich', () => {
  const minimalStructuralId = 'req_a'
  const veryLongRequestId = `req_${'a'.repeat(1_000_000)}`
  const veryLongGatewayId = `gateway_${'a'.repeat(1_000_000)}`

  assert.deepEqual(
    validateSyncRequest(
      createRequest({ requestId: minimalStructuralId }),
      REFERENCE_TIMESTAMP
    ),
    { ok: true, errors: [] }
  )

  const requestResult = validateSyncRequest(
    createRequest({ requestId: veryLongRequestId }),
    REFERENCE_TIMESTAMP
  )
  const gatewayResult = validateSyncGatewayErrorResponse(
    createGatewayErrorResponse('INVALID_JSON', {
      requestId: veryLongGatewayId,
    })
  )

  assert.deepEqual(getErrorCodes(requestResult), ['requestIdTooLong'])
  assert.deepEqual(getErrorCodes(gatewayResult), ['invalidGatewayRequestId'])

  // Kollisionsarmut ist Aufgabe des späteren ID-Generators. Der reine
  // Vertrag prüft ausschließlich Präfix, sichere ASCII-Zeichen und Länge.
})

test('prüft kanonische existente UTC-Zeitstempel', () => {
  const validLeapTimestamp = '2028-02-29T23:59:59.999Z'

  assert.deepEqual(
    validateSyncRequest(
      createRequest({ timestamp: validLeapTimestamp }),
      validLeapTimestamp
    ),
    { ok: true, errors: [] }
  )

  const invalidTimestamps = [
    '2026-02-29T12:00:00.000Z',
    '2026-08-03T12:00:00Z',
    '2026-08-03T14:00:00.000+02:00',
    '2026-8-3T12:00:00.000Z',
    '2026-08-03 12:00:00.000Z',
    new Date(REFERENCE_TIMESTAMP),
    Symbol('private-timestamp-symbol'),
    '2'.repeat(1_000_000),
  ]

  for (const timestamp of invalidTimestamps) {
    assertHasError(
      validateSyncRequest(
        createRequest({ timestamp }),
        REFERENCE_TIMESTAMP
      ),
      'invalidTimestamp',
      '$.timestamp'
    )
  }
})

test('akzeptiert beide Zeitfenstergrenzen und weist eine Millisekunde außerhalb zurück', () => {
  const acceptedTimestamps = [
    '2026-08-03T11:55:00.000Z',
    '2026-08-03T12:05:00.000Z',
  ]
  const rejectedTimestamps = [
    '2026-08-03T11:54:59.999Z',
    '2026-08-03T12:05:00.001Z',
  ]

  for (const timestamp of acceptedTimestamps) {
    assert.deepEqual(
      validateSyncRequest(
        createRequest({ timestamp }),
        REFERENCE_TIMESTAMP
      ),
      { ok: true, errors: [] }
    )
  }

  for (const timestamp of rejectedTimestamps) {
    assertHasError(
      validateSyncRequest(
        createRequest({ timestamp }),
        REFERENCE_TIMESTAMP
      ),
      'timestampOutsideTolerance',
      '$.timestamp'
    )
  }
})

test('fordert für die Zeitfensterprüfung eine explizite kanonische Referenzzeit', () => {
  for (const referenceTimestamp of [
    undefined,
    null,
    '2026-08-03T12:00:00Z',
    new Date(REFERENCE_TIMESTAMP),
    Symbol('private-reference-symbol'),
  ]) {
    assertHasError(
      validateSyncRequest(createRequest(), referenceTimestamp),
      'invalidReferenceTimestamp',
      '$referenceTimestamp'
    )
  }
})

test('fordert einen exakt leeren Payload-Record', () => {
  const invalidPayloads = [
    null,
    [],
    'payload',
    1,
    { message: 'private-payload-message-sentinel' },
  ]

  for (const payload of invalidPayloads) {
    const result = validateSyncRequest(
      createRequest({ payload }),
      REFERENCE_TIMESTAMP
    )

    assert.equal(result.ok, false)
    assertErrorsDoNotContain(result, ['private-payload-message-sentinel'])
  }

  const customPrototypePayload = Object.create({ inherited: 'synthetic' })

  assertHasError(
    validateSyncRequest(
      createRequest({ payload: customPrototypePayload }),
      REFERENCE_TIMESTAMP
    ),
    'invalidPayload',
    '$.payload'
  )
})

test('liest eigene Accessor-Properties gewöhnlicher Request-Records nicht als Werte', () => {
  const privateMarker = 'private-request-getter-error-sentinel'
  let knownGetterCalls = 0
  let unknownGetterCalls = 0
  const knownGetterRequest = createRequest()
  const unknownGetterRequest = createRequest()

  Object.defineProperty(knownGetterRequest, 'action', {
    configurable: true,
    enumerable: true,
    get() {
      knownGetterCalls += 1
      throw new Error(privateMarker)
    },
  })
  Object.defineProperty(unknownGetterRequest, 'privateUnknownField', {
    configurable: true,
    enumerable: true,
    get() {
      unknownGetterCalls += 1
      throw new Error(privateMarker)
    },
  })

  const knownResult = validateSyncRequest(
    knownGetterRequest,
    REFERENCE_TIMESTAMP
  )
  const unknownResult = validateSyncRequest(
    unknownGetterRequest,
    REFERENCE_TIMESTAMP
  )

  assertHasError(knownResult, 'invalidPropertyDescriptor', '$.action')
  assertHasError(unknownResult, 'unknownProperty', '$.*')
  assert.equal(knownGetterCalls, 0)
  assert.equal(unknownGetterCalls, 0)
  assertErrorsDoNotContain(knownResult, [privateMarker])
  assertErrorsDoNotContain(unknownResult, [privateMarker])
})

test('macht Seiteneffekte eines mutierenden Reflection-Traps bei gültiger beobachteter Sicht sichtbar', () => {
  const requestTarget = createRequest({ payload: null })
  const externalSideEffects = []
  const request = new Proxy(requestTarget, {
    getPrototypeOf(target) {
      target.payload = {}
      externalSideEffects.push('getPrototypeOf')
      return Object.prototype
    },
  })

  assert.equal(requestTarget.payload, null)
  assert.deepEqual(
    validateSyncRequest(request, REFERENCE_TIMESTAMP),
    { ok: true, errors: [] }
  )
  assert.deepEqual(requestTarget.payload, {})
  assert.deepEqual(externalSideEffects, ['getPrototypeOf'])
})

test('macht die Engine-Ausführung eines Getters im Descriptor-Trap-Ergebnis sichtbar', () => {
  const requestTarget = createRequest({ action: 'unknownAction' })
  let actionDescriptorTrapCalls = 0
  let descriptorValueGetterCalls = 0
  const request = new Proxy(requestTarget, {
    getOwnPropertyDescriptor(target, propertyName) {
      if (propertyName !== 'action') {
        return Reflect.getOwnPropertyDescriptor(target, propertyName)
      }

      actionDescriptorTrapCalls += 1

      return {
        configurable: true,
        enumerable: true,
        writable: true,
        get value() {
          descriptorValueGetterCalls += 1
          return 'syncTest'
        },
      }
    },
  })

  assert.equal(requestTarget.action, 'unknownAction')
  assert.deepEqual(
    validateSyncRequest(request, REFERENCE_TIMESTAMP),
    { ok: true, errors: [] }
  )
  assert.equal(actionDescriptorTrapCalls, 1)
  assert.equal(descriptorValueGetterCalls, 1)
  assert.equal(requestTarget.action, 'unknownAction')
})

test('führt bei einem transparenten Request-Proxy dessen nicht benötigte Get- oder Write-Traps nicht aus', () => {
  const trapCalls = {
    get: 0,
    set: 0,
    defineProperty: 0,
    deleteProperty: 0,
    setPrototypeOf: 0,
    preventExtensions: 0,
  }
  const requestTarget = createRequest()
  const targetSnapshot = structuredClone(requestTarget)
  const request = new Proxy(requestTarget, {
    get() {
      trapCalls.get += 1
      throw new Error('private-transparent-get-trap-sentinel')
    },
    set() {
      trapCalls.set += 1
      throw new Error('private-transparent-set-trap-sentinel')
    },
    defineProperty() {
      trapCalls.defineProperty += 1
      throw new Error('private-transparent-define-trap-sentinel')
    },
    deleteProperty() {
      trapCalls.deleteProperty += 1
      throw new Error('private-transparent-delete-trap-sentinel')
    },
    setPrototypeOf() {
      trapCalls.setPrototypeOf += 1
      throw new Error('private-transparent-prototype-trap-sentinel')
    },
    preventExtensions() {
      trapCalls.preventExtensions += 1
      throw new Error('private-transparent-extensions-trap-sentinel')
    },
  })

  assert.deepEqual(
    validateSyncRequest(request, REFERENCE_TIMESTAMP),
    { ok: true, errors: [] }
  )
  assert.deepEqual(trapCalls, {
    get: 0,
    set: 0,
    defineProperty: 0,
    deleteProperty: 0,
    setPrototypeOf: 0,
    preventExtensions: 0,
  })
  assert.deepEqual(requestTarget, targetSnapshot)
})

test('weist nicht-enumerable Pflichtfelder zurück und akzeptiert eingefrorene Data-Deskriptoren', () => {
  const hiddenActionRequest = createRequest()
  Object.defineProperty(hiddenActionRequest, 'action', {
    configurable: true,
    enumerable: false,
    value: 'syncTest',
    writable: true,
  })

  assertHasError(
    validateSyncRequest(hiddenActionRequest, REFERENCE_TIMESTAMP),
    'invalidPropertyDescriptor',
    '$.action'
  )

  const frozenRequest = deepFreeze(createRequest())
  const actionDescriptor = Object.getOwnPropertyDescriptor(
    frozenRequest,
    'action'
  )

  assert.equal(actionDescriptor.writable, false)
  assert.equal(actionDescriptor.configurable, false)
  assert.deepEqual(
    validateSyncRequest(frozenRequest, REFERENCE_TIMESTAMP),
    { ok: true, errors: [] }
  )
})

test('weist Custom-Prototypen sowie die abgedeckten werfenden Request-Proxies kontrolliert zurück', () => {
  const privateMarkers = [
    'private-request-prototype-trap-sentinel',
    'private-request-own-keys-trap-sentinel',
    'private-request-descriptor-trap-sentinel',
  ]
  const customPrototypeRequest = Object.assign(
    Object.create({ inherited: 'synthetic' }),
    createRequest()
  )
  const proxyRequests = [
    new Proxy(createRequest(), {
      getPrototypeOf() {
        throw new Error(privateMarkers[0])
      },
    }),
    new Proxy(createRequest(), {
      ownKeys() {
        throw new Error(privateMarkers[1])
      },
    }),
    new Proxy(createRequest(), {
      getOwnPropertyDescriptor(target, propertyName) {
        if (propertyName === 'action') {
          throw new Error(privateMarkers[2])
        }

        return Reflect.getOwnPropertyDescriptor(target, propertyName)
      },
    }),
  ]

  assertHasError(
    validateSyncRequest(customPrototypeRequest, REFERENCE_TIMESTAMP),
    'invalidSyncRequest',
    '$'
  )

  for (const proxyRequest of proxyRequests) {
    let result

    assert.doesNotThrow(() => {
      result = validateSyncRequest(proxyRequest, REFERENCE_TIMESTAMP)
    })
    assert.equal(result.ok, false)
    assertErrorsDoNotContain(result, privateMarkers)
  }

  const revokedRequest = Proxy.revocable(createRequest(), {})
  revokedRequest.revoke()

  assert.doesNotThrow(() => {
    const result = validateSyncRequest(
      revokedRequest.proxy,
      REFERENCE_TIMESTAMP
    )
    assertHasError(result, 'invalidSyncRequest', '$')
  })
})

test('akzeptiert gültige Erfolgs- und alle normalen statischen Fehlerresponses', () => {
  const request = createRequest()

  assert.deepEqual(validateSyncResponse(
    createSuccessResponse(request),
    request
  ), { ok: true, errors: [] })

  for (const code of [
    'VALIDATION_ERROR',
    'SERVICE_UNAVAILABLE',
    'INTERNAL_ERROR',
  ]) {
    assert.deepEqual(validateSyncResponse(
      createErrorResponse(request, code),
      request
    ), { ok: true, errors: [] })
  }
})

test('korreliert normale Responses exakt über Version, Aktion und Request-ID', () => {
  const request = createRequest()
  const cases = [
    {
      overrides: { version: '2.0' },
      code: 'responseVersionMismatch',
      path: '$.version',
    },
    {
      overrides: { action: 'unknownAction' },
      code: 'responseActionMismatch',
      path: '$.action',
    },
    {
      overrides: { requestId: 'req_other' },
      code: 'responseRequestIdMismatch',
      path: '$.requestId',
    },
  ]

  for (const testCase of cases) {
    assertHasError(
      validateSyncResponse(
        createSuccessResponse(request, testCase.overrides),
        request
      ),
      testCase.code,
      testCase.path
    )
  }
})

test('weist fehlende oder ungültige Korrelationsrequests fail closed zurück', () => {
  const response = createSuccessResponse()
  const privateMarker = 'private-correlation-proxy-sentinel'
  const hostileCorrelation = new Proxy(createRequest(), {
    getOwnPropertyDescriptor() {
      throw new Error(privateMarker)
    },
  })

  for (const correlatedRequest of [
    undefined,
    null,
    {},
    createRequest({ payload: { private: 'synthetic' } }),
    hostileCorrelation,
  ]) {
    let result

    assert.doesNotThrow(() => {
      result = validateSyncResponse(response, correlatedRequest)
    })
    assertHasError(
      result,
      'invalidCorrelatedRequest',
      '$correlatedRequest'
    )
    assertErrorsDoNotContain(result, [privateMarker])
  }
})

test('fordert alle zehn Response-Felder und weist Zusatzfelder redigiert zurück', () => {
  const request = createRequest()
  const requiredPropertyNames = [
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
  ]

  for (const propertyName of requiredPropertyNames) {
    const response = createSuccessResponse(request)
    delete response[propertyName]

    assertHasError(
      validateSyncResponse(response, request),
      'missingProperty',
      `$.${propertyName}`
    )
  }

  const privateFieldMarker = 'private-response-field-sentinel'
  const response = createSuccessResponse(request)
  response[privateFieldMarker] = 'private-response-value-sentinel'
  const result = validateSyncResponse(response, request)

  assertHasError(result, 'unknownProperty', '$.*')
  assertErrorsDoNotContain(result, [
    privateFieldMarker,
    'private-response-value-sentinel',
  ])
})

test('erzwingt die success-, data- und error-Konsistenz', () => {
  const request = createRequest()
  const cases = [
    {
      response: createSuccessResponse(request, { success: 'true' }),
      code: 'invalidSuccess',
      path: '$.success',
    },
    {
      response: createSuccessResponse(request, { data: null }),
      code: 'invalidData',
      path: '$.data',
    },
    {
      response: createSuccessResponse(request, {
        error: createResponseError('INTERNAL_ERROR'),
      }),
      code: 'invalidError',
      path: '$.error',
    },
    {
      response: createErrorResponse(request, 'INTERNAL_ERROR', {
        data: { status: 'ok', dataOrigin: 'synthetic' },
      }),
      code: 'invalidData',
      path: '$.data',
    },
    {
      response: createErrorResponse(request, 'INTERNAL_ERROR', {
        error: null,
      }),
      code: 'invalidError',
      path: '$.error',
    },
  ]

  for (const testCase of cases) {
    assertHasError(
      validateSyncResponse(testCase.response, request),
      testCase.code,
      testCase.path
    )
  }
})

test('begrenzt Erfolgsdaten exakt auf ok und synthetic', () => {
  const request = createRequest()
  const cases = [
    { data: {}, path: '$.data.status' },
    {
      data: { status: 'connected', dataOrigin: 'synthetic' },
      path: '$.data.status',
    },
    {
      data: { status: 'ok', dataOrigin: 'private' },
      path: '$.data.dataOrigin',
    },
    {
      data: {
        status: 'ok',
        dataOrigin: 'synthetic',
        echo: 'private-echo-sentinel',
      },
      path: '$.data.*',
    },
  ]

  for (const testCase of cases) {
    const result = validateSyncResponse(
      createSuccessResponse(request, { data: testCase.data }),
      request
    )

    assert.equal(result.ok, false)
    assert.ok(result.errors.some((error) => error.path === testCase.path))
    assertErrorsDoNotContain(result, ['private-echo-sentinel'])
  }
})

test('validiert normale Fehlercodes, Meldungen, Retry-Werte und leere Details statisch', () => {
  const request = createRequest()
  const unsupportedCodeResult = validateSyncResponse(
    createErrorResponse(request, 'SERVICE_UNAVAILABLE', {
      error: {
        code: 'INVALID_JSON',
        message: 'private-error-message-sentinel',
        retryable: false,
        details: [],
      },
    }),
    request
  )
  assertHasError(
    unsupportedCodeResult,
    'invalidErrorCode',
    '$.error.code'
  )
  assertErrorsDoNotContain(unsupportedCodeResult, [
    'private-error-message-sentinel',
  ])

  const changedMessage = createResponseError('SERVICE_UNAVAILABLE')
  changedMessage.message = 'private-changed-message-sentinel'
  assertHasError(
    validateSyncResponse(
      createErrorResponse(request, 'SERVICE_UNAVAILABLE', {
        error: changedMessage,
      }),
      request
    ),
    'invalidErrorMessage',
    '$.error.message'
  )

  const changedRetry = createResponseError('SERVICE_UNAVAILABLE')
  changedRetry.retryable = false
  assertHasError(
    validateSyncResponse(
      createErrorResponse(request, 'SERVICE_UNAVAILABLE', {
        error: changedRetry,
      }),
      request
    ),
    'invalidRetryable',
    '$.error.retryable'
  )

  const changedDetails = createResponseError('SERVICE_UNAVAILABLE')
  changedDetails.details = [{ field: 'private-field-sentinel' }]
  const detailsResult = validateSyncResponse(
    createErrorResponse(request, 'SERVICE_UNAVAILABLE', {
      error: changedDetails,
    }),
    request
  )
  assertHasError(
    detailsResult,
    'invalidErrorDetails',
    '$.error.details'
  )
  assertErrorsDoNotContain(detailsResult, ['private-field-sentinel'])
})

test('fordert kanonischen Response-Zeitstempel, Handler und sichere Request-ID', () => {
  const request = createRequest()
  const cases = [
    {
      overrides: { timestamp: '2026-08-03T12:00:00Z' },
      code: 'invalidTimestamp',
      path: '$.timestamp',
    },
    {
      overrides: { handledBy: 'sync-agent' },
      code: 'invalidHandler',
      path: '$.handledBy',
    },
    {
      overrides: { requestId: 'invalid response id' },
      code: 'invalidRequestId',
      path: '$.requestId',
    },
  ]

  for (const testCase of cases) {
    assertHasError(
      validateSyncResponse(
        createSuccessResponse(request, testCase.overrides),
        request
      ),
      testCase.code,
      testCase.path
    )
  }
})

test('akzeptiert Metadaten-Grenzen sowie eingefrorene und Null-Prototyp-Strukturen', () => {
  const request = deepFreeze(createRequest())
  const data = Object.assign(Object.create(null), {
    status: 'ok',
    dataOrigin: 'synthetic',
  })
  const processedBy = ['SyncAgent']
  Object.setPrototypeOf(processedBy, null)
  const warnings = []
  Object.setPrototypeOf(warnings, null)
  const meta = Object.assign(Object.create(null), {
    durationMs: SYNC_CONTRACT_MAX_DURATION_MS,
    processedBy,
  })
  const response = Object.assign(
    Object.create(null),
    createSuccessResponse(request, { data, warnings, meta })
  )

  assert.deepEqual(validateSyncResponse(response, request), {
    ok: true,
    errors: [],
  })
  assert.deepEqual(
    validateSyncResponse(
      deepFreeze(createSuccessResponse(request, {
        meta: { durationMs: 0, processedBy: ['SyncAgent'] },
      })),
      request
    ),
    { ok: true, errors: [] }
  )
})

test('weist ungültige Dauer, Warnungen und Verarbeitungsketten zurück', () => {
  const request = createRequest()

  for (const durationMs of [
    -1,
    0.5,
    SYNC_CONTRACT_MAX_DURATION_MS + 1,
    Number.MAX_SAFE_INTEGER + 1,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    '4',
  ]) {
    assertHasError(
      validateSyncResponse(
        createSuccessResponse(request, {
          meta: { durationMs, processedBy: ['SyncAgent'] },
        }),
        request
      ),
      'invalidDuration',
      '$.meta.durationMs'
    )
  }

  const cases = [
    {
      overrides: { warnings: ['private-warning-sentinel'] },
      code: 'invalidWarnings',
      path: '$.warnings',
    },
    {
      overrides: {
        meta: { durationMs: 4, processedBy: [] },
      },
      code: 'invalidProcessedBy',
      path: '$.meta.processedBy',
    },
    {
      overrides: {
        meta: { durationMs: 4, processedBy: ['sync-agent'] },
      },
      code: 'invalidProcessedBy',
      path: '$.meta.processedBy[0]',
    },
  ]

  for (const testCase of cases) {
    const result = validateSyncResponse(
      createSuccessResponse(request, testCase.overrides),
      request
    )
    assertHasError(result, testCase.code, testCase.path)
    assertErrorsDoNotContain(result, ['private-warning-sentinel'])
  }
})

test('weist sparse, erweiterte und manipulierte Response-Arrays zurück', () => {
  const request = createRequest()
  const sparseProcessedBy = ['SyncAgent']
  delete sparseProcessedBy[0]
  const extraWarnings = []
  extraWarnings.privateField = 'private-array-value-sentinel'
  const symbolProcessedBy = ['SyncAgent']
  symbolProcessedBy[Symbol('private-array-symbol-sentinel')] =
    'private-array-value-sentinel'
  const customPrototypeProcessedBy = ['SyncAgent']
  Object.setPrototypeOf(
    customPrototypeProcessedBy,
    Object.create(Array.prototype)
  )

  const responses = [
    createSuccessResponse(request, {
      meta: { durationMs: 4, processedBy: sparseProcessedBy },
    }),
    createSuccessResponse(request, { warnings: extraWarnings }),
    createSuccessResponse(request, {
      meta: { durationMs: 4, processedBy: symbolProcessedBy },
    }),
    createSuccessResponse(request, {
      meta: { durationMs: 4, processedBy: customPrototypeProcessedBy },
    }),
  ]

  for (const response of responses) {
    const result = validateSyncResponse(response, request)
    assert.equal(result.ok, false)
    assertErrorsDoNotContain(result, [
      'private-array-value-sentinel',
      'private-array-symbol-sentinel',
    ])
  }
})

test('weist deutlich überlange Arrays vor jeder Own-Key-Reflection begrenzt zurück', () => {
  const request = createRequest()
  let ownKeysCalls = 0
  const oversizedWarnings = new Proxy(new Array(100_000), {
    ownKeys() {
      ownKeysCalls += 1
      throw new Error('private-oversized-array-own-keys-sentinel')
    },
  })
  const oversizedProcessedBy = new Proxy(new Array(100_000), {
    ownKeys() {
      ownKeysCalls += 1
      throw new Error('private-oversized-array-own-keys-sentinel')
    },
  })

  const warningsResult = validateSyncResponse(
    createSuccessResponse(request, { warnings: oversizedWarnings }),
    request
  )
  const processedByResult = validateSyncResponse(
    createSuccessResponse(request, {
      meta: { durationMs: 4, processedBy: oversizedProcessedBy },
    }),
    request
  )

  assertHasError(warningsResult, 'invalidWarnings', '$.warnings')
  assertHasError(
    processedByResult,
    'invalidProcessedBy',
    '$.meta.processedBy'
  )
  assert.equal(ownKeysCalls, 0)
  assertErrorsDoNotContain(warningsResult, [
    'private-oversized-array-own-keys-sentinel',
  ])
  assertErrorsDoNotContain(processedByResult, [
    'private-oversized-array-own-keys-sentinel',
  ])
})

test('fängt einen werfenden Array-length-Descriptor-Trap vor Own-Key-Reflection ab', () => {
  const request = createRequest()
  const privateMarker = 'private-array-length-descriptor-trap-sentinel'
  let lengthDescriptorCalls = 0
  let ownKeysCalls = 0
  const processedBy = new Proxy(['SyncAgent'], {
    getOwnPropertyDescriptor(target, propertyName) {
      if (propertyName === 'length') {
        lengthDescriptorCalls += 1
        throw new Error(privateMarker)
      }

      return Reflect.getOwnPropertyDescriptor(target, propertyName)
    },
    ownKeys() {
      ownKeysCalls += 1
      throw new Error('private-array-own-keys-should-not-run-sentinel')
    },
  })
  let result

  assert.doesNotThrow(() => {
    result = validateSyncResponse(
      createSuccessResponse(request, {
        meta: { durationMs: 4, processedBy },
      }),
      request
    )
  })

  assertHasError(
    result,
    'invalidProcessedBy',
    '$.meta.processedBy'
  )
  assert.equal(lengthDescriptorCalls, 1)
  assert.equal(ownKeysCalls, 0)
  assertErrorsDoNotContain(result, [
    privateMarker,
    'private-array-own-keys-should-not-run-sentinel',
  ])
})

test('liest eigene Accessor-Positionen gewöhnlicher Arrays nicht als Werte', () => {
  const request = createRequest()
  const privateMarker = 'private-array-accessor-sentinel'
  let getterCalls = 0
  const processedBy = ['SyncAgent']

  Object.defineProperty(processedBy, '0', {
    configurable: true,
    enumerable: true,
    get() {
      getterCalls += 1
      throw new Error(privateMarker)
    },
  })

  const result = validateSyncResponse(
    createSuccessResponse(request, {
      meta: { durationMs: 4, processedBy },
    }),
    request
  )

  assertHasError(
    result,
    'invalidPropertyDescriptor',
    '$.meta.processedBy[0]'
  )
  assert.equal(getterCalls, 0)
  assertErrorsDoNotContain(result, [privateMarker])
})

test('akzeptiert alle statischen Gateway-Fehlerprofile getrennt', () => {
  for (const code of [
    'INVALID_JSON',
    'VALIDATION_ERROR',
    'UNSUPPORTED_VERSION',
    'UNKNOWN_ACTION',
    'PAYLOAD_TOO_LARGE',
    'FORBIDDEN',
  ]) {
    assert.deepEqual(
      validateSyncGatewayErrorResponse(createGatewayErrorResponse(code)),
      { ok: true, errors: [] }
    )
  }
})

test('erzwingt das separate Gateway-Profil mit action und handledBy null', () => {
  const cases = [
    {
      overrides: { success: true },
      code: 'invalidSuccess',
      path: '$.success',
    },
    {
      overrides: { requestId: 'req_client' },
      code: 'invalidGatewayRequestId',
      path: '$.requestId',
    },
    {
      overrides: { action: 'syncTest' },
      code: 'invalidGatewayAction',
      path: '$.action',
    },
    {
      overrides: { handledBy: 'SyncAgent' },
      code: 'invalidHandler',
      path: '$.handledBy',
    },
    {
      overrides: { data: {} },
      code: 'invalidData',
      path: '$.data',
    },
    {
      overrides: {
        meta: { durationMs: 4, processedBy: ['SyncAgent'] },
      },
      code: 'invalidProcessedBy',
      path: '$.meta.processedBy',
    },
  ]

  for (const testCase of cases) {
    assertHasError(
      validateSyncGatewayErrorResponse(
        createGatewayErrorResponse('INVALID_JSON', testCase.overrides)
      ),
      testCase.code,
      testCase.path
    )
  }

  assert.equal(
    validateSyncResponse(
      createGatewayErrorResponse(),
      createRequest()
    ).ok,
    false
  )
  assert.equal(
    validateSyncGatewayErrorResponse(
      createErrorResponse(createRequest(), 'INTERNAL_ERROR')
    ).ok,
    false
  )
})

test('prüft Gateway-Korrelations-IDs vollständig und weist normale Fehlercodes ab', () => {
  const minimumGatewayId = 'gateway_a'
  const maximumGatewayId = `gateway_${'a'.repeat(56)}`
  assert.equal(minimumGatewayId.length, 9)
  assert.equal(maximumGatewayId.length, 64)

  for (const requestId of [
    minimumGatewayId,
    maximumGatewayId,
    GATEWAY_REQUEST_ID,
  ]) {
    assert.deepEqual(
      validateSyncGatewayErrorResponse(
        createGatewayErrorResponse('INVALID_JSON', { requestId })
      ),
      { ok: true, errors: [] }
    )
  }

  const invalidGatewayIds = [
    'gateway_',
    'gateway__a',
    'gateway_-a',
    'gateway_a b',
    ' gateway_a',
    'gateway_a ',
    'gateway_ä',
    `gateway_${'a'.repeat(57)}`,
    undefined,
    null,
    false,
    1,
    1n,
    {},
    [],
    Symbol('private-gateway-id-symbol'),
  ]

  for (const requestId of invalidGatewayIds) {
    assertHasError(
      validateSyncGatewayErrorResponse(
        createGatewayErrorResponse('INVALID_JSON', { requestId })
      ),
      'invalidGatewayRequestId',
      '$.requestId'
    )
  }

  assertHasError(
    validateSyncGatewayErrorResponse(
      createGatewayErrorResponse('INVALID_JSON', {
        error: createResponseError('SERVICE_UNAVAILABLE'),
      })
    ),
    'invalidErrorCode',
    '$.error.code'
  )
})

test('weist eigene Record-Accessors und die abgedeckten werfenden Reflection-Traps kontrolliert zurück', () => {
  const request = createRequest()
  const privateMarkers = [
    'private-data-getter-sentinel',
    'private-meta-own-keys-sentinel',
    'private-error-descriptor-sentinel',
  ]
  let dataGetterCalls = 0
  const data = {
    status: 'ok',
    dataOrigin: 'synthetic',
  }
  Object.defineProperty(data, 'status', {
    configurable: true,
    enumerable: true,
    get() {
      dataGetterCalls += 1
      throw new Error(privateMarkers[0])
    },
  })
  const hostileMeta = new Proxy({
    durationMs: 4,
    processedBy: ['SyncAgent'],
  }, {
    ownKeys() {
      throw new Error(privateMarkers[1])
    },
  })
  const hostileError = new Proxy(
    createResponseError('INTERNAL_ERROR'),
    {
      getOwnPropertyDescriptor(target, propertyName) {
        if (propertyName === 'message') {
          throw new Error(privateMarkers[2])
        }

        return Reflect.getOwnPropertyDescriptor(target, propertyName)
      },
    }
  )
  const responses = [
    createSuccessResponse(request, { data }),
    createSuccessResponse(request, { meta: hostileMeta }),
    createErrorResponse(request, 'INTERNAL_ERROR', { error: hostileError }),
  ]

  for (const response of responses) {
    let result

    assert.doesNotThrow(() => {
      result = validateSyncResponse(response, request)
    })
    assert.equal(result.ok, false)
    assertErrorsDoNotContain(result, privateMarkers)
  }

  assert.equal(dataGetterCalls, 0)
})

test('weist werfende und widerrufene Array-Proxies kontrolliert zurück', () => {
  const request = createRequest()
  const privateMarkers = [
    'private-array-prototype-trap-sentinel',
    'private-array-own-keys-trap-sentinel',
    'private-array-descriptor-trap-sentinel',
  ]
  const proxyArrays = [
    new Proxy(['SyncAgent'], {
      getPrototypeOf() {
        throw new Error(privateMarkers[0])
      },
    }),
    new Proxy(['SyncAgent'], {
      ownKeys() {
        throw new Error(privateMarkers[1])
      },
    }),
    new Proxy(['SyncAgent'], {
      getOwnPropertyDescriptor(target, propertyName) {
        if (propertyName === '0') {
          throw new Error(privateMarkers[2])
        }

        return Reflect.getOwnPropertyDescriptor(target, propertyName)
      },
    }),
  ]

  for (const processedBy of proxyArrays) {
    let result

    assert.doesNotThrow(() => {
      result = validateSyncResponse(
        createSuccessResponse(request, {
          meta: { durationMs: 4, processedBy },
        }),
        request
      )
    })
    assert.equal(result.ok, false)
    assertErrorsDoNotContain(result, privateMarkers)
  }

  const revokedWarnings = Proxy.revocable([], {})
  const response = createSuccessResponse(request, {
    warnings: revokedWarnings.proxy,
  })
  revokedWarnings.revoke()

  assert.doesNotThrow(() => {
    const result = validateSyncResponse(response, request)
    assertHasError(result, 'invalidWarnings', '$.warnings')
  })
})

test('weist Symbol-Werte und unerwartete nicht serialisierbare Werte kontrolliert zurück', () => {
  const requestCases = [
    createRequest({ version: Symbol('private-version-symbol') }),
    createRequest({ action: Symbol('private-action-symbol') }),
    createRequest({ source: Symbol('private-source-symbol') }),
    createRequest({ requestId: 1n }),
    createRequest({ timestamp: () => REFERENCE_TIMESTAMP }),
    createRequest({ payload: new Map() }),
  ]

  for (const request of requestCases) {
    let result

    assert.doesNotThrow(() => {
      result = validateSyncRequest(request, REFERENCE_TIMESTAMP)
    })
    assert.equal(result.ok, false)
    assertErrorsDoNotContain(result, [
      'private-version-symbol',
      'private-action-symbol',
      'private-source-symbol',
    ])
  }

  const response = createSuccessResponse(createRequest(), {
    data: { status: Symbol('private-status-symbol'), dataOrigin: 'synthetic' },
  })
  const result = validateSyncResponse(response, createRequest())
  assert.equal(result.ok, false)
  assertErrorsDoNotContain(result, ['private-status-symbol'])
})

test('verändert stabile seiteneffektfreie Vertragswerte nicht', () => {
  const request = createRequest()
  const response = createSuccessResponse(request)
  const invalidRequest = createRequest({ action: 'unknownAction' })
  const requestSnapshot = structuredClone(request)
  const responseSnapshot = structuredClone(response)
  const invalidSnapshot = structuredClone(invalidRequest)
  const requestKeys = Reflect.ownKeys(request)
  const responseDescriptors = Object.getOwnPropertyDescriptors(response)

  validateSyncRequest(request, REFERENCE_TIMESTAMP)
  validateSyncRequest(invalidRequest, REFERENCE_TIMESTAMP)
  validateSyncResponse(response, request)

  assert.deepEqual(request, requestSnapshot)
  assert.deepEqual(response, responseSnapshot)
  assert.deepEqual(invalidRequest, invalidSnapshot)
  assert.deepEqual(Reflect.ownKeys(request), requestKeys)
  assert.deepEqual(
    Object.getOwnPropertyDescriptors(response),
    responseDescriptors
  )

  const frozenRequest = deepFreeze(createRequest())
  const frozenResponse = deepFreeze(createSuccessResponse(frozenRequest))
  assert.deepEqual(
    validateSyncResponse(frozenResponse, frozenRequest),
    { ok: true, errors: [] }
  )
})

test('liefert bei stabilen seiteneffektfreien werfenden Proxy-Traps deterministische Fehlerfolgen', () => {
  const privateMarker = 'private-deterministic-trap-sentinel'
  const request = new Proxy(createRequest(), {
    getOwnPropertyDescriptor(target, propertyName) {
      if (propertyName === 'payload') {
        throw new Error(privateMarker)
      }

      return Reflect.getOwnPropertyDescriptor(target, propertyName)
    },
  })

  const firstResult = validateSyncRequest(request, REFERENCE_TIMESTAMP)
  const secondResult = validateSyncRequest(request, REFERENCE_TIMESTAMP)

  assert.deepEqual(secondResult, firstResult)
  assertErrorsDoNotContain(firstResult, [privateMarker])
})

test('gibt ausschließlich stabile redigierte Validierungsfehler zurück', () => {
  const privateMarkers = [
    'private-id-value-sentinel',
    'private-action-value-sentinel',
    'private-field-name-sentinel',
  ]
  const request = createRequest({
    action: privateMarkers[1],
    requestId: ` ${privateMarkers[0]} `,
  })
  request[privateMarkers[2]] = 'private-field-value-sentinel'
  const result = validateSyncRequest(request, REFERENCE_TIMESTAMP)

  result.errors.forEach((error) => {
    assert.deepEqual(Object.keys(error), ['code', 'path', 'message'])
    assert.equal(typeof error.code, 'string')
    assert.equal(typeof error.path, 'string')
    assert.equal(typeof error.message, 'string')
  })
  assertErrorsDoNotContain(result, [
    ...privateMarkers,
    'private-field-value-sentinel',
  ])
})

test('akzeptiert exakt 64 KiB rohe UTF-8-Daten und weist ein Byte mehr zurück', () => {
  const exactAsciiBody = 'a'.repeat(SYNC_CONTRACT_MAX_RAW_BODY_BYTES)
  const oversizedAsciiBody = `${exactAsciiBody}a`
  const exactTwoByteBody = 'ä'.repeat(
    SYNC_CONTRACT_MAX_RAW_BODY_BYTES / 2
  )
  const exactThreeByteBody = `${'€'.repeat(21_845)}a`
  const exactFourByteBody = '😀'.repeat(
    SYNC_CONTRACT_MAX_RAW_BODY_BYTES / 4
  )

  for (const rawBody of [
    '',
    exactAsciiBody,
    exactTwoByteBody,
    exactThreeByteBody,
    exactFourByteBody,
  ]) {
    assert.deepEqual(validateSyncRawBodySize(rawBody), {
      ok: true,
      errors: [],
    })
  }

  for (const rawBody of [
    oversizedAsciiBody,
    `${exactTwoByteBody}a`,
    `${exactThreeByteBody}a`,
    `${exactFourByteBody}a`,
  ]) {
    assertHasError(
      validateSyncRawBodySize(rawBody),
      'rawBodyTooLarge',
      '$rawBody'
    )
  }
})

test('zählt isolierte UTF-16-Surrogate wie UTF-8-Ersatzzeichen', () => {
  const exactBody = `${'a'.repeat(
    SYNC_CONTRACT_MAX_RAW_BODY_BYTES - 3
  )}\ud800`
  const oversizedBody = `${exactBody}a`

  assert.equal(new TextEncoder().encode(exactBody).byteLength, 65_536)
  assert.equal(new TextEncoder().encode(oversizedBody).byteLength, 65_537)
  assert.deepEqual(validateSyncRawBodySize(exactBody), {
    ok: true,
    errors: [],
  })
  assertHasError(
    validateSyncRawBodySize(oversizedBody),
    'rawBodyTooLarge',
    '$rawBody'
  )
})

test('serialisiert oder koerziert nicht-string Raw-Bodies niemals', () => {
  const privateMarker = 'private-raw-body-coercion-sentinel'
  let coercionCalls = 0
  const hostileBody = {
    toJSON() {
      coercionCalls += 1
      throw new Error(privateMarker)
    },
    toString() {
      coercionCalls += 1
      throw new Error(privateMarker)
    },
  }
  Object.defineProperty(hostileBody, Symbol.toPrimitive, {
    configurable: true,
    get() {
      coercionCalls += 1
      throw new Error(privateMarker)
    },
  })
  const hostileProxy = new Proxy(hostileBody, {
    get() {
      coercionCalls += 1
      throw new Error(privateMarker)
    },
  })

  for (const rawBody of [
    hostileBody,
    hostileProxy,
    null,
    undefined,
    1,
    1n,
    Symbol('private-raw-body-symbol'),
  ]) {
    let result

    assert.doesNotThrow(() => {
      result = validateSyncRawBodySize(rawBody)
    })
    assertHasError(result, 'invalidRawBody', '$rawBody')
    assertErrorsDoNotContain(result, [privateMarker])
  }

  assert.equal(coercionCalls, 0)
})
