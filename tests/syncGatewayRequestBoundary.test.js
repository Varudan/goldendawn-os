import assert from 'node:assert/strict'
import test from 'node:test'
import { types as utilTypes } from 'node:util'

import {
  SYNC_CONTRACT_MAX_RAW_BODY_BYTES,
  SYNC_CONTRACT_REQUEST_ID_MAX_LENGTH,
  SYNC_CONTRACT_RESPONSE_ERROR_PROFILES,
  SYNC_CONTRACT_TIMESTAMP_TOLERANCE_MS,
  validateSyncGatewayErrorResponse,
  validateSyncRequest,
} from '../src/contracts/syncContract.js'
import * as syncGatewayRequestBoundaryModule from
  '../src/gateways/syncGatewayRequestBoundary.js'

const { createSyncGatewayRequestBoundary } =
  syncGatewayRequestBoundaryModule

const REFERENCE_TIMESTAMP = '2031-04-05T10:20:30.000Z'
const REQUEST_TIMESTAMP = '2031-04-05T10:20:30.125Z'
const REQUEST_ID = 'req_48be0e81-2ace-46df-b713-3d580f313b71'
const SECOND_REQUEST_ID = 'req_7a7816e5-2024-4e6c-86d8-06efbf621226'
const GATEWAY_REQUEST_ID =
  'gateway_63bf9a18-177f-4f35-8a04-1b619bada742'
const SECOND_GATEWAY_REQUEST_ID =
  'gateway_897d572d-7ce8-4501-bceb-76ba51356667'

const RESULT_PROPERTY_NAMES = Object.freeze([
  'ok',
  'status',
  'syncRequest',
  'gatewayErrorResponse',
  'error',
])
const LOCAL_ERROR_PROPERTY_NAMES = Object.freeze(['code', 'message'])
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
const RESPONSE_ERROR_PROPERTY_NAMES = Object.freeze([
  'code',
  'message',
  'retryable',
  'details',
])
const META_PROPERTY_NAMES = Object.freeze(['durationMs', 'processedBy'])

const LOCAL_FAILURES = Object.freeze({
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

function createRequest(overrides = {}) {
  return {
    version: '1.0',
    action: 'syncTest',
    source: 'goldendawn-os',
    requestId: REQUEST_ID,
    timestamp: REQUEST_TIMESTAMP,
    payload: {},
    ...overrides,
  }
}

function createRawRequest(overrides = {}) {
  return JSON.stringify(createRequest(overrides))
}

function getQueuedValue(values, index) {
  return index < values.length ? values[index] : values.at(-1)
}

function createBoundarySystem({
  gatewayRequestIds = [GATEWAY_REQUEST_ID],
  timestamps = [REFERENCE_TIMESTAMP],
  generateGatewayRequestIdImplementation,
  getCurrentTimestampImplementation,
} = {}) {
  const calls = {
    generateGatewayRequestId: 0,
    getCurrentTimestamp: 0,
  }
  const generateGatewayRequestId = () => {
    const callNumber = calls.generateGatewayRequestId + 1
    const queuedValue = getQueuedValue(gatewayRequestIds, callNumber - 1)
    calls.generateGatewayRequestId = callNumber

    if (generateGatewayRequestIdImplementation) {
      return generateGatewayRequestIdImplementation({
        callNumber,
        queuedValue,
      })
    }

    return queuedValue
  }
  const getCurrentTimestamp = () => {
    const callNumber = calls.getCurrentTimestamp + 1
    const queuedValue = getQueuedValue(timestamps, callNumber - 1)
    calls.getCurrentTimestamp = callNumber

    if (getCurrentTimestampImplementation) {
      return getCurrentTimestampImplementation({
        callNumber,
        queuedValue,
      })
    }

    return queuedValue
  }
  const boundary = createSyncGatewayRequestBoundary({
    generateGatewayRequestId,
    getCurrentTimestamp,
  })

  return { boundary, calls }
}

function assertDeepFrozen(value, seen = new Set()) {
  if (
    value === null ||
    (typeof value !== 'object' && typeof value !== 'function') ||
    seen.has(value)
  ) {
    return
  }

  seen.add(value)
  assert.equal(Object.isFrozen(value), true)

  for (const propertyName of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, propertyName)

    if (descriptor && Object.hasOwn(descriptor, 'value')) {
      assertDeepFrozen(descriptor.value, seen)
    }
  }
}

function assertExactFrozenOwnDataRecord(value, expectedPropertyNames) {
  assert.notEqual(value, null)
  assert.equal(typeof value, 'object')
  assert.equal(Array.isArray(value), false)
  assert.strictEqual(Object.getPrototypeOf(value), Object.prototype)
  assert.deepEqual(Reflect.ownKeys(value), expectedPropertyNames)
  assert.equal(Object.isFrozen(value), true)

  for (const propertyName of expectedPropertyNames) {
    const descriptor = Object.getOwnPropertyDescriptor(value, propertyName)

    assert.notEqual(descriptor, undefined)
    assert.equal(Object.hasOwn(descriptor, 'value'), true)
    assert.equal(Object.hasOwn(descriptor, 'get'), false)
    assert.equal(Object.hasOwn(descriptor, 'set'), false)
    assert.equal(descriptor.enumerable, true)
    assert.equal(descriptor.configurable, false)
    assert.equal(descriptor.writable, false)
  }
}

function assertExactFrozenOwnDataArray(value) {
  assert.equal(Array.isArray(value), true)
  assert.strictEqual(Object.getPrototypeOf(value), Array.prototype)
  assert.equal(Object.isFrozen(value), true)

  const expectedPropertyNames = [
    ...Array.from({ length: value.length }, (_unused, index) => String(index)),
    'length',
  ]

  assert.deepEqual(Reflect.ownKeys(value), expectedPropertyNames)

  for (const propertyName of expectedPropertyNames) {
    const descriptor = Object.getOwnPropertyDescriptor(value, propertyName)

    assert.notEqual(descriptor, undefined)
    assert.equal(Object.hasOwn(descriptor, 'value'), true)
    assert.equal(Object.hasOwn(descriptor, 'get'), false)
    assert.equal(Object.hasOwn(descriptor, 'set'), false)
    assert.equal(descriptor.enumerable, propertyName !== 'length')
    assert.equal(descriptor.configurable, false)
    assert.equal(descriptor.writable, false)
  }
}

function assertExactGatewayResponseShape(gatewayErrorResponse) {
  assertExactFrozenOwnDataRecord(
    gatewayErrorResponse,
    RESPONSE_PROPERTY_NAMES
  )
  assertExactFrozenOwnDataRecord(
    gatewayErrorResponse.error,
    RESPONSE_ERROR_PROPERTY_NAMES
  )
  assertExactFrozenOwnDataArray(gatewayErrorResponse.error.details)
  assertExactFrozenOwnDataArray(gatewayErrorResponse.warnings)
  assertExactFrozenOwnDataRecord(
    gatewayErrorResponse.meta,
    META_PROPERTY_NAMES
  )
  assertExactFrozenOwnDataArray(gatewayErrorResponse.meta.processedBy)
}

function assertAccepted(result, expectedRequest = createRequest()) {
  assert.deepEqual(result, {
    ok: true,
    status: 'syncRequestAccepted',
    syncRequest: expectedRequest,
    gatewayErrorResponse: null,
    error: null,
  })
  assertExactFrozenOwnDataRecord(result, RESULT_PROPERTY_NAMES)
  assertExactFrozenOwnDataRecord(result.syncRequest, REQUEST_PROPERTY_NAMES)
  assertExactFrozenOwnDataRecord(result.syncRequest.payload, [])
  assert.deepEqual(
    validateSyncRequest(result.syncRequest, REFERENCE_TIMESTAMP),
    { ok: true, errors: [] }
  )
  assertDeepFrozen(result)
}

function assertRejected(
  result,
  expectedCode,
  expectedGatewayRequestId = GATEWAY_REQUEST_ID,
  expectedTimestamp = REFERENCE_TIMESTAMP
) {
  const profile = SYNC_CONTRACT_RESPONSE_ERROR_PROFILES[expectedCode]

  assert.deepEqual(result, {
    ok: false,
    status: 'syncRequestRejected',
    syncRequest: null,
    gatewayErrorResponse: {
      version: '1.0',
      success: false,
      requestId: expectedGatewayRequestId,
      action: null,
      handledBy: null,
      timestamp: expectedTimestamp,
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
    },
    error: null,
  })
  assertExactFrozenOwnDataRecord(result, RESULT_PROPERTY_NAMES)
  assertExactGatewayResponseShape(result.gatewayErrorResponse)
  assert.deepEqual(
    validateSyncGatewayErrorResponse(result.gatewayErrorResponse),
    { ok: true, errors: [] }
  )
  assertDeepFrozen(result)
}

function assertLocalFailure(result, failureName) {
  const failure = LOCAL_FAILURES[failureName]

  assert.deepEqual(result, {
    ok: false,
    status: failure.status,
    syncRequest: null,
    gatewayErrorResponse: null,
    error: {
      code: failure.code,
      message: failure.message,
    },
  })
  assertExactFrozenOwnDataRecord(result, RESULT_PROPERTY_NAMES)
  assertExactFrozenOwnDataRecord(result.error, LOCAL_ERROR_PROPERTY_NAMES)
  assertDeepFrozen(result)
}

function assertResultDoesNotContain(result, markers) {
  const seen = new Set()

  function assertValueDoesNotContain(value) {
    if (typeof value === 'string') {
      for (const marker of markers) {
        assert.equal(
          value.includes(marker),
          false,
          `Boundary-Result enthält redigierungspflichtigen Marker: ${marker}`
        )
      }
      return
    }

    if (typeof value === 'symbol') {
      assertValueDoesNotContain(value.description ?? '')
      return
    }

    if (
      value === null ||
      (typeof value !== 'object' && typeof value !== 'function') ||
      seen.has(value)
    ) {
      return
    }

    seen.add(value)

    for (const propertyName of Reflect.ownKeys(value)) {
      assertValueDoesNotContain(
        typeof propertyName === 'string'
          ? propertyName
          : propertyName.description ?? ''
      )

      const descriptor = Object.getOwnPropertyDescriptor(value, propertyName)

      if (descriptor && Object.hasOwn(descriptor, 'value')) {
        assertValueDoesNotContain(descriptor.value)
      }
    }
  }

  assertValueDoesNotContain(result)
}

function captureOwnDataDescriptorGraph(rootValue) {
  const nodes = []
  const seen = new Set()

  function capture(value) {
    if (
      value === null ||
      (typeof value !== 'object' && typeof value !== 'function') ||
      seen.has(value)
    ) {
      return
    }

    seen.add(value)
    const ownKeys = Reflect.ownKeys(value)
    const descriptors = ownKeys.map((propertyName) => {
      const descriptor = Object.getOwnPropertyDescriptor(value, propertyName)
      assert.notEqual(descriptor, undefined)
      return { descriptor, propertyName }
    })

    nodes.push({
      descriptors,
      extensible: Object.isExtensible(value),
      frozen: Object.isFrozen(value),
      ownKeys,
      prototype: Object.getPrototypeOf(value),
      sealed: Object.isSealed(value),
      value,
    })

    for (const { descriptor } of descriptors) {
      if (Object.hasOwn(descriptor, 'value')) {
        capture(descriptor.value)
      }
    }
  }

  capture(rootValue)
  return { nodes, rootValue }
}

function assertOwnDataDescriptorGraphUnchanged(snapshot) {
  for (const node of snapshot.nodes) {
    assert.strictEqual(Object.getPrototypeOf(node.value), node.prototype)
    assert.equal(Object.isExtensible(node.value), node.extensible)
    assert.equal(Object.isSealed(node.value), node.sealed)
    assert.equal(Object.isFrozen(node.value), node.frozen)
    assert.deepEqual(Reflect.ownKeys(node.value), node.ownKeys)

    for (const original of node.descriptors) {
      const current = Object.getOwnPropertyDescriptor(
        node.value,
        original.propertyName
      )

      assert.notEqual(current, undefined)
      assert.equal(current.configurable, original.descriptor.configurable)
      assert.equal(current.enumerable, original.descriptor.enumerable)
      assert.equal(
        Object.hasOwn(current, 'value'),
        Object.hasOwn(original.descriptor, 'value')
      )

      if (Object.hasOwn(original.descriptor, 'value')) {
        assert.equal(current.writable, original.descriptor.writable)
        assert.equal(
          Object.is(current.value, original.descriptor.value),
          true
        )
      } else {
        assert.strictEqual(current.get, original.descriptor.get)
        assert.strictEqual(current.set, original.descriptor.set)
      }
    }
  }
}

function assertOwnDataGraphsAreDisjoint(firstRoot, secondRoot) {
  const firstObjects = new Set(
    captureOwnDataDescriptorGraph(firstRoot).nodes.map((node) => node.value)
  )
  const secondObjects = captureOwnDataDescriptorGraph(secondRoot).nodes
    .map((node) => node.value)

  for (const secondObject of secondObjects) {
    assert.equal(firstObjects.has(secondObject), false)
  }
}

function restoreOwnProperty(target, propertyName, originalDescriptor) {
  if (originalDescriptor === undefined) {
    Reflect.deleteProperty(target, propertyName)
    return
  }

  Object.defineProperty(target, propertyName, originalDescriptor)
}

function createCoercionProbe(label) {
  const calls = {
    toString: 0,
    valueOf: 0,
    symbolToPrimitive: 0,
  }
  const value = {
    toString() {
      calls.toString += 1
      throw new Error(`${label}-to-string-private-sentinel`)
    },
    valueOf() {
      calls.valueOf += 1
      throw new Error(`${label}-value-of-private-sentinel`)
    },
    [Symbol.toPrimitive]() {
      calls.symbolToPrimitive += 1
      throw new Error(`${label}-symbol-to-primitive-private-sentinel`)
    },
  }

  return { calls, value }
}

function assertCoercionProbeWasNotUsed(probe) {
  assert.deepEqual(probe.calls, {
    toString: 0,
    valueOf: 0,
    symbolToPrimitive: 0,
  })
}

function getUtf8ByteLength(value) {
  return new TextEncoder().encode(value).byteLength
}

function hasExactOwnKeys(value, expectedPropertyNames) {
  if (value === null || typeof value !== 'object') {
    return false
  }

  const ownKeys = Reflect.ownKeys(value)

  return (
    ownKeys.length === expectedPropertyNames.length &&
    expectedPropertyNames.every((propertyName) => (
      ownKeys.includes(propertyName)
    ))
  )
}

test('exportiert ausschließlich die Factory und liefert eine exakt eingefrorene synchrone Ein-Methoden-API', () => {
  const boundary = createSyncGatewayRequestBoundary()
  const moduleOwnKeys = Reflect.ownKeys(syncGatewayRequestBoundaryModule)
  const exportDescriptor = Object.getOwnPropertyDescriptor(
    syncGatewayRequestBoundaryModule,
    'createSyncGatewayRequestBoundary'
  )
  const moduleTagDescriptor = Object.getOwnPropertyDescriptor(
    syncGatewayRequestBoundaryModule,
    Symbol.toStringTag
  )

  assert.strictEqual(
    Object.getPrototypeOf(syncGatewayRequestBoundaryModule),
    null
  )
  assert.equal(Object.isExtensible(syncGatewayRequestBoundaryModule), false)
  assert.deepEqual(moduleOwnKeys, [
    'createSyncGatewayRequestBoundary',
    Symbol.toStringTag,
  ])
  assert.deepEqual(exportDescriptor, {
    value: createSyncGatewayRequestBoundary,
    writable: true,
    enumerable: true,
    configurable: false,
  })
  assert.deepEqual(moduleTagDescriptor, {
    value: 'Module',
    writable: false,
    enumerable: false,
    configurable: false,
  })
  assert.equal(createSyncGatewayRequestBoundary.length, 0)
  assertExactFrozenOwnDataRecord(boundary, ['processSyncRawBody'])
  assert.equal(typeof boundary.processSyncRawBody, 'function')
  assert.equal(boundary.processSyncRawBody.length, 1)
})

test('liefert alle vier Boundary-Resultprofile synchron, nicht als Promise oder Thenable', () => {
  const acceptedSystem = createBoundarySystem()
  const rejectedSystem = createBoundarySystem()
  const invalidInvocationSystem = createBoundarySystem()
  const failedSystem = createBoundarySystem({
    getCurrentTimestampImplementation() {
      throw new Error('fixture-synchronous-clock-private-sentinel')
    },
  })
  const results = [
    acceptedSystem.boundary.processSyncRawBody(createRawRequest()),
    rejectedSystem.boundary.processSyncRawBody('{'),
    invalidInvocationSystem.boundary.processSyncRawBody(),
    failedSystem.boundary.processSyncRawBody(createRawRequest()),
  ]

  for (const result of results) {
    assert.equal(utilTypes.isPromise(result), false)
    assert.equal(result instanceof Promise, false)
    assert.equal(Object.hasOwn(result, 'then'), false)
    assertExactFrozenOwnDataRecord(result, RESULT_PROPERTY_NAMES)
  }

  assertAccepted(results[0])
  assertRejected(results[1], 'INVALID_JSON')
  assertLocalFailure(results[2], 'invalidInvocation')
  assertLocalFailure(results[3], 'boundaryFailed')
})

test('hält alle Result- und Error-Shapes frei von versteckten oder symbolischen Feldern', () => {
  const system = createBoundarySystem()
  const results = [
    system.boundary.processSyncRawBody(createRawRequest()),
    system.boundary.processSyncRawBody('{'),
    system.boundary.processSyncRawBody(),
  ]
  const forbiddenPropertyNames = [
    'rawBody',
    'rawError',
    'parsedRequest',
    'validationErrors',
    'cause',
    'stack',
  ]

  for (const result of results) {
    assert.deepEqual(Reflect.ownKeys(result), RESULT_PROPERTY_NAMES)
    assertResultDoesNotContain(result, forbiddenPropertyNames)
  }
})

test('weist fehlende und zusätzliche Argumente vor Größenprüfung, Parsing, Clock und Generator zurück', { concurrency: false }, () => {
  const originalParseDescriptor = Object.getOwnPropertyDescriptor(JSON, 'parse')
  const originalCharCodeAtDescriptor = Object.getOwnPropertyDescriptor(
    String.prototype,
    'charCodeAt'
  )
  const trapCalls = {
    get: 0,
    getOwnPropertyDescriptor: 0,
    getPrototypeOf: 0,
    ownKeys: 0,
  }
  const hostileExtra = new Proxy({}, {
    get() {
      trapCalls.get += 1
      throw new Error('fixture-extra-get-private-sentinel')
    },
    getOwnPropertyDescriptor() {
      trapCalls.getOwnPropertyDescriptor += 1
      throw new Error('fixture-extra-descriptor-private-sentinel')
    },
    getPrototypeOf() {
      trapCalls.getPrototypeOf += 1
      throw new Error('fixture-extra-prototype-private-sentinel')
    },
    ownKeys() {
      trapCalls.ownKeys += 1
      throw new Error('fixture-extra-own-keys-private-sentinel')
    },
  })
  const coercionProbe = createCoercionProbe('fixture-extra')
  const system = createBoundarySystem()
  let parseCalls = 0
  let charCodeAtCalls = 0
  let results

  try {
    Object.defineProperty(JSON, 'parse', {
      ...originalParseDescriptor,
      value() {
        parseCalls += 1
        throw new Error('fixture-unused-parser-private-sentinel')
      },
    })
    Object.defineProperty(String.prototype, 'charCodeAt', {
      ...originalCharCodeAtDescriptor,
      value() {
        charCodeAtCalls += 1
        throw new Error('fixture-unused-size-private-sentinel')
      },
    })

    results = [
      system.boundary.processSyncRawBody(),
      system.boundary.processSyncRawBody(createRawRequest(), hostileExtra),
      Reflect.apply(system.boundary.processSyncRawBody, system.boundary, [
        createRawRequest(),
        coercionProbe.value,
        hostileExtra,
      ]),
    ]
  } finally {
    restoreOwnProperty(JSON, 'parse', originalParseDescriptor)
    restoreOwnProperty(
      String.prototype,
      'charCodeAt',
      originalCharCodeAtDescriptor
    )
  }

  results.forEach((result) => assertLocalFailure(result, 'invalidInvocation'))
  assert.equal(parseCalls, 0)
  assert.equal(charCodeAtCalls, 0)
  assert.deepEqual(system.calls, {
    generateGatewayRequestId: 0,
    getCurrentTimestamp: 0,
  })
  assert.deepEqual(trapCalls, {
    get: 0,
    getOwnPropertyDescriptor: 0,
    getPrototypeOf: 0,
    ownKeys: 0,
  })
  assertCoercionProbeWasNotUsed(coercionProbe)
})

test('klassifiziert jeden einzelnen Nicht-String unverändert als regulären VALIDATION_ERROR ohne Konvertierung oder Parsing', { concurrency: false }, () => {
  const originalParseDescriptor = Object.getOwnPropertyDescriptor(JSON, 'parse')
  const coercionProbe = createCoercionProbe('fixture-single-value')
  const boxedString = new String(createRawRequest())
  boxedString.toString = coercionProbe.value.toString
  boxedString.valueOf = coercionProbe.value.valueOf
  boxedString[Symbol.toPrimitive] = coercionProbe.value[Symbol.toPrimitive]
  let thenGetterCalls = 0
  const thenable = {}
  Object.defineProperty(thenable, 'then', {
    get() {
      thenGetterCalls += 1
      throw new Error('fixture-then-getter-private-sentinel')
    },
  })
  const proxyTrapCalls = {
    get: 0,
    getOwnPropertyDescriptor: 0,
    getPrototypeOf: 0,
    ownKeys: 0,
  }
  const hostileProxy = new Proxy({}, {
    get() {
      proxyTrapCalls.get += 1
      throw new Error('fixture-single-proxy-get-private-sentinel')
    },
    getOwnPropertyDescriptor() {
      proxyTrapCalls.getOwnPropertyDescriptor += 1
      throw new Error('fixture-single-proxy-descriptor-private-sentinel')
    },
    getPrototypeOf() {
      proxyTrapCalls.getPrototypeOf += 1
      throw new Error('fixture-single-proxy-prototype-private-sentinel')
    },
    ownKeys() {
      proxyTrapCalls.ownKeys += 1
      throw new Error('fixture-single-proxy-own-keys-private-sentinel')
    },
  })
  const revoked = Proxy.revocable({}, {})
  revoked.revoke()
  const values = [
    undefined,
    null,
    false,
    0,
    1n,
    Symbol('fixture-single-symbol-private-sentinel'),
    boxedString,
    coercionProbe.value,
    [],
    function fixtureFunction() {},
    Promise.resolve('fixture-promise-private-sentinel'),
    thenable,
    hostileProxy,
    revoked.proxy,
  ]
  const system = createBoundarySystem()
  let parseCalls = 0
  const results = []

  try {
    Object.defineProperty(JSON, 'parse', {
      ...originalParseDescriptor,
      value() {
        parseCalls += 1
        throw new Error('fixture-non-string-parser-private-sentinel')
      },
    })

    for (const value of values) {
      results.push(system.boundary.processSyncRawBody(value))
    }
  } finally {
    restoreOwnProperty(JSON, 'parse', originalParseDescriptor)
  }

  results.forEach((result) => assertRejected(result, 'VALIDATION_ERROR'))
  assert.equal(parseCalls, 0)
  assert.equal(system.calls.getCurrentTimestamp, values.length)
  assert.equal(system.calls.generateGatewayRequestId, values.length)
  assert.equal(thenGetterCalls, 0)
  assert.deepEqual(proxyTrapCalls, {
    get: 0,
    getOwnPropertyDescriptor: 0,
    getPrototypeOf: 0,
    ownKeys: 0,
  })
  assertCoercionProbeWasNotUsed(coercionProbe)
})

test('prüft die UTF-8-Größe vor Parsing und reicht den Raw Body unverändert an JSON.parse weiter', { concurrency: false }, () => {
  const originalParseDescriptor = Object.getOwnPropertyDescriptor(JSON, 'parse')
  const originalCharCodeAtDescriptor = Object.getOwnPropertyDescriptor(
    String.prototype,
    'charCodeAt'
  )
  const originalParse = originalParseDescriptor.value
  const originalCharCodeAt = originalCharCodeAtDescriptor.value
  const rawBody = ' \n' + createRawRequest() + '\t '
  const events = []
  let observedParseArguments
  const system = createBoundarySystem({
    getCurrentTimestampImplementation({ queuedValue }) {
      events.push('clock')
      return queuedValue
    },
  })
  let result

  try {
    Object.defineProperty(String.prototype, 'charCodeAt', {
      ...originalCharCodeAtDescriptor,
      value(...args) {
        if (!events.includes('size')) {
          events.push('size')
        }
        return Reflect.apply(originalCharCodeAt, this, args)
      },
    })
    Object.defineProperty(JSON, 'parse', {
      ...originalParseDescriptor,
      value(...args) {
        events.push('parse')
        observedParseArguments = args
        return Reflect.apply(originalParse, this, args)
      },
    })

    result = system.boundary.processSyncRawBody(rawBody)
  } finally {
    restoreOwnProperty(JSON, 'parse', originalParseDescriptor)
    restoreOwnProperty(
      String.prototype,
      'charCodeAt',
      originalCharCodeAtDescriptor
    )
  }

  assertAccepted(result)
  assert.deepEqual(events.slice(0, 3), ['size', 'parse', 'clock'])
  assert.deepEqual(observedParseArguments, [rawBody])
  assert.equal(system.calls.getCurrentTimestamp, 1)
  assert.equal(system.calls.generateGatewayRequestId, 0)
})

test('erlaubt exakt 65.536 berechnete UTF-8-Bytes und weist 65.537 Bytes für Mehrbytezeichen zurück', () => {
  const exactBodies = [
    '"' + 'a'.repeat(SYNC_CONTRACT_MAX_RAW_BODY_BYTES - 2) + '"',
    '"' + 'ä'.repeat((SYNC_CONTRACT_MAX_RAW_BODY_BYTES - 2) / 2) + '"',
    '"' + '€'.repeat(21_844) + 'aa"',
    '"' + '😀'.repeat(16_383) + 'aa"',
  ]

  for (const exactBody of exactBodies) {
    assert.equal(new TextEncoder().encode(exactBody).byteLength, 65_536)
    const acceptedSizeSystem = createBoundarySystem()
    assertRejected(
      acceptedSizeSystem.boundary.processSyncRawBody(exactBody),
      'VALIDATION_ERROR'
    )

    const oversizedBody = exactBody.slice(0, -1) + 'a"'
    assert.equal(new TextEncoder().encode(oversizedBody).byteLength, 65_537)
    const oversizedSystem = createBoundarySystem()
    assertRejected(
      oversizedSystem.boundary.processSyncRawBody(oversizedBody),
      'PAYLOAD_TOO_LARGE'
    )
  }
})

test('zählt isolierte Surrogate und äußeren Whitespace gemäß bestehender Raw-Body-Helpersemantik', () => {
  const exactSurrogateBody = '"' + 'a'.repeat(65_531) + '\ud800"'
  const oversizedSurrogateBody = '"' + 'a'.repeat(65_532) + '\ud800"'
  const exactWhitespaceBody = ' '.repeat(65_532) + 'null'
  const oversizedWhitespaceBody = exactWhitespaceBody + ' '

  for (const exactBody of [exactSurrogateBody, exactWhitespaceBody]) {
    assert.equal(new TextEncoder().encode(exactBody).byteLength, 65_536)
    const system = createBoundarySystem()
    assertRejected(
      system.boundary.processSyncRawBody(exactBody),
      'VALIDATION_ERROR'
    )
  }

  for (const oversizedBody of [
    oversizedSurrogateBody,
    oversizedWhitespaceBody,
  ]) {
    assert.equal(new TextEncoder().encode(oversizedBody).byteLength, 65_537)
    const system = createBoundarySystem()
    assertRejected(
      system.boundary.processSyncRawBody(oversizedBody),
      'PAYLOAD_TOO_LARGE'
    )
  }
})

test('gibt Übergröße Vorrang vor Syntax und ruft JSON.parse dabei nullmal auf', { concurrency: false }, () => {
  const originalParseDescriptor = Object.getOwnPropertyDescriptor(JSON, 'parse')
  const oversizedInvalidBody = '{' + 'x'.repeat(65_536)
  const system = createBoundarySystem()
  let parseCalls = 0
  let result

  try {
    Object.defineProperty(JSON, 'parse', {
      ...originalParseDescriptor,
      value() {
        parseCalls += 1
        throw new Error('fixture-oversized-parser-private-sentinel')
      },
    })
    result = system.boundary.processSyncRawBody(oversizedInvalidBody)
  } finally {
    restoreOwnProperty(JSON, 'parse', originalParseDescriptor)
  }

  assertRejected(result, 'PAYLOAD_TOO_LARGE')
  assert.equal(parseCalls, 0)
})

test('misst einen zerlegten NFC-Sentinel vor jeder Normalisierung und löst JSON.parse bei 65.537 Originalbytes nicht auf', { concurrency: false }, () => {
  const originalParseDescriptor = Object.getOwnPropertyDescriptor(JSON, 'parse')
  const originalParse = originalParseDescriptor.value
  const rawBody = '"' + 'e\u0301'.repeat(21_845) + '"'
  const normalizedBody = rawBody.normalize('NFC')
  const system = createBoundarySystem()
  let parseGetterCalls = 0
  let parseMethodCalls = 0
  let result

  assert.equal(getUtf8ByteLength(rawBody), 65_537)
  assert.equal(getUtf8ByteLength(normalizedBody), 43_692)

  try {
    Object.defineProperty(JSON, 'parse', {
      configurable: true,
      enumerable: originalParseDescriptor.enumerable,
      get() {
        parseGetterCalls += 1
        return function parse(value) {
          parseMethodCalls += 1
          return Reflect.apply(originalParse, JSON, [value])
        }
      },
    })
    result = system.boundary.processSyncRawBody(rawBody)
  } finally {
    restoreOwnProperty(JSON, 'parse', originalParseDescriptor)
  }

  assertRejected(result, 'PAYLOAD_TOO_LARGE')
  assert.equal(parseGetterCalls, 0)
  assert.equal(parseMethodCalls, 0)
  assert.deepEqual(system.calls, {
    generateGatewayRequestId: 1,
    getCurrentTimestamp: 1,
  })
})

test('verwendet JSON.parse exakt einmal mit einem unveränderten Argument, vorgesehenem Receiver und ohne Reviver oder Stringify-Roundtrip', { concurrency: false }, () => {
  const originalParseDescriptor = Object.getOwnPropertyDescriptor(JSON, 'parse')
  const originalStringifyDescriptor = Object.getOwnPropertyDescriptor(
    JSON,
    'stringify'
  )
  const parsedRequest = createRequest()
  const rawBody = '\n ' + createRawRequest() + ' \t'
  const parseCalls = []
  let stringifyCalls = 0
  const system = createBoundarySystem()
  let result

  try {
    Object.defineProperty(JSON, 'parse', {
      ...originalParseDescriptor,
      value(...args) {
        parseCalls.push({ args, receiver: this })
        if (parseCalls.length > 1) {
          throw new Error('fixture-second-parse-private-sentinel')
        }
        return parsedRequest
      },
    })
    Object.defineProperty(JSON, 'stringify', {
      ...originalStringifyDescriptor,
      value() {
        stringifyCalls += 1
        throw new Error('fixture-stringify-private-sentinel')
      },
    })

    result = system.boundary.processSyncRawBody(rawBody)
  } finally {
    restoreOwnProperty(JSON, 'parse', originalParseDescriptor)
    restoreOwnProperty(JSON, 'stringify', originalStringifyDescriptor)
  }

  assertAccepted(result)
  assert.equal(parseCalls.length, 1)
  assert.deepEqual(parseCalls[0].args, [rawBody])
  assert.strictEqual(parseCalls[0].receiver, JSON)
  assert.equal(stringifyCalls, 0)
})

test('ordnet native JSON-Syntaxfehler vollständig statisch INVALID_JSON zu', () => {
  const invalidJsonBodies = [
    '',
    '   \n\t',
    '{',
    '\ufeff' + createRawRequest(),
    '{"version":"1.0"/* fixture comment */}',
    '{"version":"1.0",}',
    createRawRequest() + ' trailing',
    "{'version':'1.0'}",
    '{version:"1.0"}',
    'NaN',
    'Infinity',
    'undefined',
    '"fixture\u0000nul"',
    '"\\x20"',
  ]

  for (const rawBody of invalidJsonBodies) {
    const system = createBoundarySystem()
    const result = system.boundary.processSyncRawBody(rawBody)

    assertRejected(result, 'INVALID_JSON')
    assert.equal(system.calls.getCurrentTimestamp, 1)
    assert.equal(system.calls.generateGatewayRequestId, 1)
  }
})

test('ordnet syntaktisch gültige JSON-Primitiven, null und Arrays nach dem Parse VALIDATION_ERROR zu', () => {
  const validJsonNonRecords = [
    'null',
    'true',
    'false',
    '0',
    '1.25',
    '"fixture primitive"',
    '[]',
    '[1,2,3]',
  ]

  for (const rawBody of validJsonNonRecords) {
    const system = createBoundarySystem()
    assertRejected(
      system.boundary.processSyncRawBody(rawBody),
      'VALIDATION_ERROR'
    )
  }
})

test('verwirft Parserexception, Stack und Raw Body ohne Result- oder Console-Leak', { concurrency: false }, () => {
  const originalParseDescriptor = Object.getOwnPropertyDescriptor(JSON, 'parse')
  const consoleMethods = ['log', 'info', 'warn', 'error', 'debug', 'trace']
  const originalConsoleDescriptors = new Map(
    consoleMethods.map((methodName) => [
      methodName,
      Object.getOwnPropertyDescriptor(console, methodName),
    ])
  )
  const privateMarkers = [
    'fixture-parser-throw-private-sentinel',
    'fixture-parser-stack-private-sentinel',
    'fixture-raw-body-private-sentinel',
  ]
  const consoleCalls = []
  const system = createBoundarySystem()
  let result

  try {
    Object.defineProperty(JSON, 'parse', {
      ...originalParseDescriptor,
      value() {
        const parserError = new SyntaxError(privateMarkers[0])
        parserError.stack = privateMarkers[1]
        throw parserError
      },
    })
    for (const methodName of consoleMethods) {
      Object.defineProperty(console, methodName, {
        ...originalConsoleDescriptors.get(methodName),
        value(...args) {
          consoleCalls.push({ args, methodName })
        },
      })
    }

    result = system.boundary.processSyncRawBody(privateMarkers[2])
  } finally {
    restoreOwnProperty(JSON, 'parse', originalParseDescriptor)
    for (const methodName of consoleMethods) {
      restoreOwnProperty(
        console,
        methodName,
        originalConsoleDescriptors.get(methodName)
      )
    }
  }

  assertRejected(result, 'INVALID_JSON')
  assertResultDoesNotContain(result, privateMarkers)
  assert.deepEqual(consoleCalls, [])
})

test('trennt Parser-Auflösungsfehler als lokalen boundaryFailed von callable Parserthrows', { concurrency: false }, () => {
  const originalJsonDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    'JSON'
  )
  const originalParseDescriptor = Object.getOwnPropertyDescriptor(JSON, 'parse')
  const validRawBody = createRawRequest()
  const cases = [
    {
      name: 'missing JSON',
      install() {
        Object.defineProperty(globalThis, 'JSON', {
          ...originalJsonDescriptor,
          value: undefined,
        })
      },
    },
    {
      name: 'missing parse',
      install() {
        Object.defineProperty(JSON, 'parse', {
          ...originalParseDescriptor,
          value: undefined,
        })
      },
    },
    {
      name: 'throwing parse getter',
      install() {
        Object.defineProperty(JSON, 'parse', {
          configurable: true,
          enumerable: originalParseDescriptor.enumerable,
          get() {
            throw new Error('fixture-parser-getter-private-sentinel')
          },
        })
      },
    },
  ]

  for (const failureCase of cases) {
    const system = createBoundarySystem()
    let result

    try {
      failureCase.install()
      result = system.boundary.processSyncRawBody(validRawBody)
    } finally {
      restoreOwnProperty(globalThis, 'JSON', originalJsonDescriptor)
      restoreOwnProperty(JSON, 'parse', originalParseDescriptor)
    }

    assertLocalFailure(result, 'boundaryFailed')
    assert.deepEqual(system.calls, {
      generateGatewayRequestId: 0,
      getCurrentTimestamp: 0,
    }, failureCase.name)
  }
})

test('akzeptiert den vollständig gültigen Sechs-Felder-Request wertgetreu mit frischem Payload und ohne Gateway-ID', () => {
  const system = createBoundarySystem()
  const result = system.boundary.processSyncRawBody(createRawRequest())

  assertAccepted(result)
  assert.deepEqual(Reflect.ownKeys(result.syncRequest), REQUEST_PROPERTY_NAMES)
  assert.deepEqual(Reflect.ownKeys(result.syncRequest.payload), [])
  assert.equal(system.calls.getCurrentTimestamp, 1)
  assert.equal(system.calls.generateGatewayRequestId, 0)
})

test('akzeptiert einen Sentinel-Request im Erfolgsweg ohne irgendeine Console-Ausgabe', { concurrency: false }, () => {
  const consoleMethods = ['log', 'info', 'warn', 'error', 'debug', 'trace']
  const originalConsoleDescriptors = new Map(
    consoleMethods.map((methodName) => [
      methodName,
      Object.getOwnPropertyDescriptor(console, methodName),
    ])
  )
  const consoleCallLists = new Map(
    consoleMethods.map((methodName) => [methodName, []])
  )
  const sentinelRequestId = 'req_fixture-console-success-private-sentinel'
  const expectedRequest = createRequest({ requestId: sentinelRequestId })
  const rawBody = createRawRequest({ requestId: sentinelRequestId })
  let system
  let result

  function restoreConsoleMethods(index = 0) {
    if (index >= consoleMethods.length) {
      return
    }

    try {
      restoreOwnProperty(
        console,
        consoleMethods[index],
        originalConsoleDescriptors.get(consoleMethods[index])
      )
    } finally {
      restoreConsoleMethods(index + 1)
    }
  }

  try {
    for (const methodName of consoleMethods) {
      Object.defineProperty(console, methodName, {
        ...originalConsoleDescriptors.get(methodName),
        value(...args) {
          consoleCallLists.get(methodName).push(args)
        },
      })
    }

    system = createBoundarySystem()
    result = system.boundary.processSyncRawBody(rawBody)
  } finally {
    restoreConsoleMethods()
  }

  assertAccepted(result, expectedRequest)
  for (const methodName of consoleMethods) {
    assert.deepEqual(consoleCallLists.get(methodName), [])
  }
  assert.deepEqual(system.calls, {
    generateGatewayRequestId: 0,
    getCurrentTimestamp: 1,
  })
})

test('akzeptiert Request-Zeitstempel innerhalb und exakt an beiden inklusiven Toleranzgrenzen', () => {
  const referenceMilliseconds = Date.parse(REFERENCE_TIMESTAMP)
  const acceptedTimestamps = [
    new Date(
      referenceMilliseconds - SYNC_CONTRACT_TIMESTAMP_TOLERANCE_MS
    ).toISOString(),
    REFERENCE_TIMESTAMP,
    new Date(
      referenceMilliseconds + SYNC_CONTRACT_TIMESTAMP_TOLERANCE_MS
    ).toISOString(),
  ]

  for (const timestamp of acceptedTimestamps) {
    const system = createBoundarySystem()
    const result = system.boundary.processSyncRawBody(
      createRawRequest({ timestamp })
    )

    assertAccepted(result, createRequest({ timestamp }))
    assert.equal(system.calls.getCurrentTimestamp, 1)
    assert.equal(system.calls.generateGatewayRequestId, 0)
  }
})

test('weist eine Millisekunde außerhalb beider Timestamp-Toleranzgrenzen als VALIDATION_ERROR zurück', () => {
  const referenceMilliseconds = Date.parse(REFERENCE_TIMESTAMP)
  const rejectedTimestamps = [
    new Date(
      referenceMilliseconds - SYNC_CONTRACT_TIMESTAMP_TOLERANCE_MS - 1
    ).toISOString(),
    new Date(
      referenceMilliseconds + SYNC_CONTRACT_TIMESTAMP_TOLERANCE_MS + 1
    ).toISOString(),
  ]

  for (const timestamp of rejectedTimestamps) {
    const system = createBoundarySystem()
    assertRejected(
      system.boundary.processSyncRawBody(createRawRequest({ timestamp })),
      'VALIDATION_ERROR'
    )
  }
})

test('bildet nur alleinige Version- und Aktionsfehler spezifisch und gemischte Fehler generisch ab', () => {
  const cases = [
    {
      rawBody: createRawRequest({ version: '2.0' }),
      expectedCode: 'UNSUPPORTED_VERSION',
    },
    {
      rawBody: createRawRequest({ action: 'fixtureUnknownAction' }),
      expectedCode: 'UNKNOWN_ACTION',
    },
    {
      rawBody: createRawRequest({
        version: '2.0',
        action: 'fixtureUnknownAction',
      }),
      expectedCode: 'VALIDATION_ERROR',
    },
    {
      rawBody: createRawRequest({
        version: '2.0',
        source: 'fixture-private-source-sentinel',
      }),
      expectedCode: 'VALIDATION_ERROR',
    },
  ]

  for (const fixture of cases) {
    const system = createBoundarySystem()
    assertRejected(
      system.boundary.processSyncRawBody(fixture.rawBody),
      fixture.expectedCode
    )
  }
})

test('weist fehlende, zusätzliche und fachlich ungültige Requestfelder fail closed ohne Reparatur zurück', () => {
  const missingVersion = createRequest()
  delete missingVersion.version
  const tooLongRequestId = 'req_' + 'a'.repeat(
    SYNC_CONTRACT_REQUEST_ID_MAX_LENGTH - 3
  )
  assert.equal(tooLongRequestId.length, SYNC_CONTRACT_REQUEST_ID_MAX_LENGTH + 1)
  const invalidRequests = [
    missingVersion,
    { ...createRequest(), extra: 'fixture-extra-private-sentinel' },
    createRequest({ version: 1 }),
    createRequest({ action: null }),
    createRequest({ source: 'fixture-private-source-sentinel' }),
    createRequest({ requestId: 'id_without-required-prefix' }),
    createRequest({ requestId: tooLongRequestId }),
    createRequest({ timestamp: '2031-04-05T10:20:30Z' }),
    createRequest({ payload: { note: 'fixture-private-payload-sentinel' } }),
    createRequest({ payload: [] }),
    { ...createRequest(), constructor: 'fixture-constructor-sentinel' },
    { ...createRequest(), prototype: 'fixture-prototype-sentinel' },
  ]

  for (const invalidRequest of invalidRequests) {
    const system = createBoundarySystem()
    const result = system.boundary.processSyncRawBody(
      JSON.stringify(invalidRequest)
    )
    const expectedCode = invalidRequest.version === 1
      ? 'UNSUPPORTED_VERSION'
      : invalidRequest.action === null
        ? 'UNKNOWN_ACTION'
        : 'VALIDATION_ERROR'

    assertRejected(result, expectedCode)
  }
})

test('lehnt __proto__ als JSON-Dateneigenschaft ab, ohne Object.prototype zu verändern', () => {
  const protoRawBody = createRawRequest().slice(0, -1) +
    ',"__proto__":{"fixture":"fixture-proto-private-sentinel"}}'
  const system = createBoundarySystem()
  const result = system.boundary.processSyncRawBody(protoRawBody)

  assertRejected(result, 'VALIDATION_ERROR')
  assert.equal(Object.hasOwn(Object.prototype, 'fixture'), false)
  assert.equal(Object.prototype.fixture, undefined)
})

test('folgt bei doppelten JSON-Membernamen bewusst der nativen Last-Key-Wins-Semantik', () => {
  const acceptedRawBody = createRawRequest().replace(
    '"version":"1.0"',
    '"version":"2.0","version":"1.0"'
  )
  const rejectedRawBody = createRawRequest().replace(
    '"version":"1.0"',
    '"version":"1.0","version":"2.0"'
  )
  const acceptedSystem = createBoundarySystem()
  const rejectedSystem = createBoundarySystem()

  assertAccepted(
    acceptedSystem.boundary.processSyncRawBody(acceptedRawBody)
  )
  assertRejected(
    rejectedSystem.boundary.processSyncRawBody(rejectedRawBody),
    'UNSUPPORTED_VERSION'
  )
})

test('weist ungeeignete Root- und Payloadrecords einschließlich instrumentierter Accessors und Symbole zurück', { concurrency: false }, () => {
  const originalParseDescriptor = Object.getOwnPropertyDescriptor(JSON, 'parse')
  const privateMarker = 'fixture-record-private-sentinel'
  let accessorCalls = 0
  const accessorRequest = createRequest()
  Object.defineProperty(accessorRequest, 'source', {
    configurable: true,
    enumerable: true,
    get() {
      accessorCalls += 1
      throw new Error(privateMarker)
    },
  })
  const symbolRequest = createRequest()
  symbolRequest[Symbol(privateMarker)] = privateMarker
  const hiddenPayloadRequest = createRequest()
  Object.defineProperty(hiddenPayloadRequest.payload, 'hidden', {
    configurable: true,
    enumerable: false,
    value: privateMarker,
  })
  const parsedValues = [
    accessorRequest,
    symbolRequest,
    hiddenPayloadRequest,
    Object.create({ inherited: privateMarker }),
  ]
  const results = []

  try {
    for (const parsedValue of parsedValues) {
      Object.defineProperty(JSON, 'parse', {
        ...originalParseDescriptor,
        value() {
          return parsedValue
        },
      })
      const system = createBoundarySystem()
      results.push(system.boundary.processSyncRawBody('{}'))
    }
  } finally {
    restoreOwnProperty(JSON, 'parse', originalParseDescriptor)
  }

  results.forEach((result) => {
    assertRejected(result, 'VALIDATION_ERROR')
    assertResultDoesNotContain(result, [privateMarker])
  })
  assert.equal(accessorCalls, 0)
})

test('behandelt invalidReferenceTimestamp auch in gemischten Fehlerbildern immer als lokalen Clockfehler', () => {
  const invalidReferenceTimestamps = [
    '2031-04-05T10:20:30Z',
    'fixture-invalid-reference-private-sentinel',
  ]

  for (const referenceTimestamp of invalidReferenceTimestamps) {
    for (const rawBody of [
      createRawRequest(),
      createRawRequest({ version: '2.0' }),
    ]) {
      const system = createBoundarySystem({
        timestamps: [referenceTimestamp],
      })
      const result = system.boundary.processSyncRawBody(rawBody)

      assertLocalFailure(result, 'boundaryFailed')
      assert.equal(system.calls.getCurrentTimestamp, 1)
      assert.equal(system.calls.generateGatewayRequestId, 0)
      assertResultDoesNotContain(result, [referenceTimestamp])
    }
  }
})

test('spiegelt niemals eine syntaktisch gültige eingehende req_-ID in einer Gateway-Ablehnung', () => {
  const privateRequestId = SECOND_REQUEST_ID
  const system = createBoundarySystem()
  const result = system.boundary.processSyncRawBody(
    createRawRequest({
      requestId: privateRequestId,
      source: 'fixture-invalid-source',
    })
  )

  assertRejected(result, 'VALIDATION_ERROR')
  assert.notEqual(result.gatewayErrorResponse.requestId, privateRequestId)
  assertResultDoesNotContain(result, [privateRequestId])
})

test('projiziert ein instrumentiert erfasstes Parsed-Original descriptor- und identitätsgetreu in einen getrennten Snapshot', { concurrency: false }, () => {
  const originalParseDescriptor = Object.getOwnPropertyDescriptor(JSON, 'parse')
  const parsedRequest = createRequest()
  const originalSnapshot = captureOwnDataDescriptorGraph(parsedRequest)
  const system = createBoundarySystem()
  let result

  try {
    Object.defineProperty(JSON, 'parse', {
      ...originalParseDescriptor,
      value() {
        return parsedRequest
      },
    })
    result = system.boundary.processSyncRawBody('{}')
  } finally {
    restoreOwnProperty(JSON, 'parse', originalParseDescriptor)
  }

  assertAccepted(result)
  assertOwnDataDescriptorGraphUnchanged(originalSnapshot)
  assert.equal(Object.isFrozen(parsedRequest), false)
  assert.equal(Object.isFrozen(parsedRequest.payload), false)
  assertOwnDataGraphsAreDisjoint(parsedRequest, result.syncRequest)
  assert.notStrictEqual(result.syncRequest, parsedRequest)
  assert.notStrictEqual(result.syncRequest.payload, parsedRequest.payload)

  parsedRequest.version = '2.0'
  parsedRequest.requestId = SECOND_REQUEST_ID
  parsedRequest.payload.privateField = 'fixture-late-private-sentinel'

  assert.deepEqual(result.syncRequest, createRequest())
})

test('akzeptiert unterstützte Null-Prototyp-Records und gibt dennoch eine neue gewöhnliche Projektion aus', { concurrency: false }, () => {
  const originalParseDescriptor = Object.getOwnPropertyDescriptor(JSON, 'parse')
  const parsedRequest = Object.assign(Object.create(null), createRequest())
  parsedRequest.payload = Object.create(null)
  const system = createBoundarySystem()
  let result

  try {
    Object.defineProperty(JSON, 'parse', {
      ...originalParseDescriptor,
      value() {
        return parsedRequest
      },
    })
    result = system.boundary.processSyncRawBody('{}')
  } finally {
    restoreOwnProperty(JSON, 'parse', originalParseDescriptor)
  }

  assertAccepted(result)
  assert.strictEqual(Object.getPrototypeOf(parsedRequest), null)
  assert.strictEqual(Object.getPrototypeOf(parsedRequest.payload), null)
  assert.strictEqual(Object.getPrototypeOf(result.syncRequest), Object.prototype)
  assert.strictEqual(
    Object.getPrototypeOf(result.syncRequest.payload),
    Object.prototype
  )
})

test('teilt zwischen mehreren Aufrufen weder Request-, Payload- noch Resultidentitäten', () => {
  const system = createBoundarySystem()
  const firstResult = system.boundary.processSyncRawBody(createRawRequest())
  const secondResult = system.boundary.processSyncRawBody(createRawRequest())

  assertAccepted(firstResult)
  assertAccepted(secondResult)
  assert.notStrictEqual(firstResult, secondResult)
  assert.notStrictEqual(firstResult.syncRequest, secondResult.syncRequest)
  assert.notStrictEqual(
    firstResult.syncRequest.payload,
    secondResult.syncRequest.payload
  )
  assertOwnDataGraphsAreDisjoint(firstResult, secondResult)
})

test('isoliert einen fehlgeschlagenen Aufruf vollständig von einem späteren Erfolg', () => {
  const system = createBoundarySystem()
  const failedResult = system.boundary.processSyncRawBody('{')
  const acceptedResult = system.boundary.processSyncRawBody(createRawRequest())

  assertRejected(failedResult, 'INVALID_JSON')
  assertAccepted(acceptedResult)
  assertOwnDataGraphsAreDisjoint(failedResult, acceptedResult)
})

test('klassifiziert eine nach initial gültiger Validierung inkonsistent werdende Parsed-Struktur lokal als boundaryFailed', { concurrency: false }, () => {
  const originalParseDescriptor = Object.getOwnPropertyDescriptor(JSON, 'parse')
  const target = createRequest()
  let versionDescriptorCalls = 0
  const parsedProxy = new Proxy(target, {
    getOwnPropertyDescriptor(proxyTarget, propertyName) {
      if (propertyName === 'version') {
        versionDescriptorCalls += 1
        if (versionDescriptorCalls > 1) {
          throw new Error('fixture-projection-drift-private-sentinel')
        }
      }
      return Reflect.getOwnPropertyDescriptor(proxyTarget, propertyName)
    },
  })
  const system = createBoundarySystem()
  let result

  try {
    Object.defineProperty(JSON, 'parse', {
      ...originalParseDescriptor,
      value() {
        return parsedProxy
      },
    })
    result = system.boundary.processSyncRawBody('{}')
  } finally {
    restoreOwnProperty(JSON, 'parse', originalParseDescriptor)
  }

  assertLocalFailure(result, 'boundaryFailed')
  assert.equal(versionDescriptorCalls, 2)
  assert.equal(system.calls.getCurrentTimestamp, 1)
  assert.equal(system.calls.generateGatewayRequestId, 0)
})

test('klassifiziert Freeze-Inkonsistenzen an Request und Gateway-Response lokal als boundaryFailed', { concurrency: false }, () => {
  const originalFreezeDescriptor = Object.getOwnPropertyDescriptor(
    Object,
    'freeze'
  )
  const originalFreeze = originalFreezeDescriptor.value
  const system = createBoundarySystem()
  let projectedRequestFreezeCalls = 0
  let result

  try {
    Object.defineProperty(Object, 'freeze', {
      ...originalFreezeDescriptor,
      value(value) {
        if (
          value &&
          typeof value === 'object' &&
          Reflect.ownKeys(value).length === REQUEST_PROPERTY_NAMES.length &&
          REQUEST_PROPERTY_NAMES.every((propertyName) => (
            Object.hasOwn(value, propertyName)
          ))
        ) {
          projectedRequestFreezeCalls += 1
          throw new Error('fixture-freeze-private-sentinel')
        }
        return Reflect.apply(originalFreeze, Object, [value])
      },
    })
    result = system.boundary.processSyncRawBody(createRawRequest())
  } finally {
    restoreOwnProperty(Object, 'freeze', originalFreezeDescriptor)
  }

  assertLocalFailure(result, 'boundaryFailed')
  assert.equal(projectedRequestFreezeCalls, 1)
  assert.equal(system.calls.generateGatewayRequestId, 0)

  const rejectionSystem = createBoundarySystem()
  let gatewayResponseFreezeCalls = 0
  let rejectionResult

  try {
    Object.defineProperty(Object, 'freeze', {
      ...originalFreezeDescriptor,
      value(value) {
        if (
          value &&
          typeof value === 'object' &&
          Reflect.ownKeys(value).length === RESPONSE_PROPERTY_NAMES.length &&
          RESPONSE_PROPERTY_NAMES.every((propertyName) => (
            Object.hasOwn(value, propertyName)
          ))
        ) {
          gatewayResponseFreezeCalls += 1
          throw new Error('fixture-response-freeze-private-sentinel')
        }
        return Reflect.apply(originalFreeze, Object, [value])
      },
    })
    rejectionResult = rejectionSystem.boundary.processSyncRawBody('{')
  } finally {
    restoreOwnProperty(Object, 'freeze', originalFreezeDescriptor)
  }

  assertLocalFailure(rejectionResult, 'boundaryFailed')
  assert.equal(gatewayResponseFreezeCalls, 1)
  assert.deepEqual(rejectionSystem.calls, {
    generateGatewayRequestId: 1,
    getCurrentTimestamp: 1,
  })
})

test('ordnet echte Request- und Gateway-Response-Validierungen nach dem Freeze des ausgegebenen Snapshots an', { concurrency: false }, () => {
  const originalDateParseDescriptor = Object.getOwnPropertyDescriptor(
    Date,
    'parse'
  )
  const originalFreezeDescriptor = Object.getOwnPropertyDescriptor(
    Object,
    'freeze'
  )
  const originalGetOwnPropertyDescriptorDescriptor =
    Object.getOwnPropertyDescriptor(
      Object,
      'getOwnPropertyDescriptor'
    )
  const originalDateParse = originalDateParseDescriptor.value
  const originalFreeze = originalFreezeDescriptor.value
  const originalGetOwnPropertyDescriptor =
    originalGetOwnPropertyDescriptorDescriptor.value
  const acceptedSystem = createBoundarySystem()
  const rejectedSystem = createBoundarySystem()
  const requestEvents = []
  const responseEvents = []
  const requestValidationTargets = []
  const responseValidationTargets = []
  let activeFlow = null
  let currentRequestValidationTarget
  let currentResponseValidationTarget
  let projectedRequest
  let gatewayErrorResponse
  let acceptedResult
  let rejectedResult

  function areRequestChildrenFrozen(value) {
    return value !== undefined && Object.isFrozen(value.payload)
  }

  function areResponseChildrenFrozen(value) {
    return (
      value !== undefined &&
      Object.isFrozen(value.error.details) &&
      Object.isFrozen(value.error) &&
      Object.isFrozen(value.warnings) &&
      Object.isFrozen(value.meta.processedBy) &&
      Object.isFrozen(value.meta)
    )
  }

  try {
    Object.defineProperty(Object, 'getOwnPropertyDescriptor', {
      ...originalGetOwnPropertyDescriptorDescriptor,
      value(value, propertyName) {
        if (
          propertyName === 'timestamp' &&
          activeFlow === 'request' &&
          hasExactOwnKeys(value, REQUEST_PROPERTY_NAMES)
        ) {
          currentRequestValidationTarget = value
        }

        if (
          propertyName === 'timestamp' &&
          activeFlow === 'response' &&
          hasExactOwnKeys(value, RESPONSE_PROPERTY_NAMES)
        ) {
          currentResponseValidationTarget = value
        }

        return Reflect.apply(
          originalGetOwnPropertyDescriptor,
          Object,
          [value, propertyName]
        )
      },
    })
    Object.defineProperty(Date, 'parse', {
      ...originalDateParseDescriptor,
      value(timestamp) {
        if (timestamp === REFERENCE_TIMESTAMP && activeFlow === 'request') {
          requestValidationTargets.push(currentRequestValidationTarget)
          requestEvents.push({
            event: 'validation',
            snapshotKnown: projectedRequest !== undefined,
            snapshotFrozen: projectedRequest === undefined
              ? false
              : Object.isFrozen(projectedRequest),
            childrenFrozen: areRequestChildrenFrozen(projectedRequest),
          })
        }

        if (timestamp === REFERENCE_TIMESTAMP && activeFlow === 'response') {
          responseValidationTargets.push(currentResponseValidationTarget)
          responseEvents.push({
            event: 'validation',
            snapshotKnown: gatewayErrorResponse !== undefined,
            snapshotFrozen: gatewayErrorResponse === undefined
              ? false
              : Object.isFrozen(gatewayErrorResponse),
            childrenFrozen: areResponseChildrenFrozen(gatewayErrorResponse),
          })
        }

        return Reflect.apply(originalDateParse, Date, [timestamp])
      },
    })
    Object.defineProperty(Object, 'freeze', {
      ...originalFreezeDescriptor,
      value(value) {
        if (
          activeFlow === 'request' &&
          hasExactOwnKeys(value, REQUEST_PROPERTY_NAMES)
        ) {
          projectedRequest = value
          requestEvents.push({
            event: 'freeze',
            snapshotKnown: true,
            snapshotFrozen: Object.isFrozen(value),
            childrenFrozen: areRequestChildrenFrozen(value),
          })
        }

        if (
          activeFlow === 'response' &&
          hasExactOwnKeys(value, RESPONSE_PROPERTY_NAMES)
        ) {
          gatewayErrorResponse = value
          responseEvents.push({
            event: 'freeze',
            snapshotKnown: true,
            snapshotFrozen: Object.isFrozen(value),
            childrenFrozen: areResponseChildrenFrozen(value),
          })
        }

        return Reflect.apply(originalFreeze, Object, [value])
      },
    })

    activeFlow = 'request'
    acceptedResult = acceptedSystem.boundary.processSyncRawBody(
      createRawRequest()
    )
    activeFlow = 'response'
    rejectedResult = rejectedSystem.boundary.processSyncRawBody('{')
  } finally {
    try {
      restoreOwnProperty(Date, 'parse', originalDateParseDescriptor)
    } finally {
      try {
        restoreOwnProperty(Object, 'freeze', originalFreezeDescriptor)
      } finally {
        restoreOwnProperty(
          Object,
          'getOwnPropertyDescriptor',
          originalGetOwnPropertyDescriptorDescriptor
        )
      }
    }
  }

  assertAccepted(acceptedResult)
  assertRejected(rejectedResult, 'INVALID_JSON')
  assert.strictEqual(acceptedResult.syncRequest, projectedRequest)
  assert.strictEqual(
    rejectedResult.gatewayErrorResponse,
    gatewayErrorResponse
  )
  assert.equal(requestValidationTargets.length, 3)
  assert.notStrictEqual(requestValidationTargets[0], projectedRequest)
  assert.strictEqual(requestValidationTargets[1], projectedRequest)
  assert.strictEqual(requestValidationTargets[2], projectedRequest)
  assert.equal(responseValidationTargets.length, 2)
  assert.strictEqual(responseValidationTargets[0], gatewayErrorResponse)
  assert.strictEqual(responseValidationTargets[1], gatewayErrorResponse)
  assert.deepEqual(requestEvents, [
    {
      event: 'validation',
      snapshotKnown: false,
      snapshotFrozen: false,
      childrenFrozen: false,
    },
    {
      event: 'validation',
      snapshotKnown: false,
      snapshotFrozen: false,
      childrenFrozen: false,
    },
    {
      event: 'freeze',
      snapshotKnown: true,
      snapshotFrozen: false,
      childrenFrozen: true,
    },
    {
      event: 'validation',
      snapshotKnown: true,
      snapshotFrozen: true,
      childrenFrozen: true,
    },
  ])
  assert.deepEqual(responseEvents, [
    {
      event: 'validation',
      snapshotKnown: false,
      snapshotFrozen: false,
      childrenFrozen: false,
    },
    {
      event: 'freeze',
      snapshotKnown: true,
      snapshotFrozen: false,
      childrenFrozen: true,
    },
    {
      event: 'validation',
      snapshotKnown: true,
      snapshotFrozen: true,
      childrenFrozen: true,
    },
  ])
})

test('validiert Parsed-Wert, Projektion und finalen gefrorenen Snapshot jeweils mit derselben Referenzzeit', { concurrency: false }, () => {
  const originalDateParseDescriptor = Object.getOwnPropertyDescriptor(
    Date,
    'parse'
  )
  const originalDateParse = originalDateParseDescriptor.value
  const observedTimestamps = []
  const system = createBoundarySystem()
  let result

  try {
    Object.defineProperty(Date, 'parse', {
      ...originalDateParseDescriptor,
      value(timestamp) {
        observedTimestamps.push(timestamp)
        return Reflect.apply(originalDateParse, Date, [timestamp])
      },
    })
    result = system.boundary.processSyncRawBody(createRawRequest())
  } finally {
    restoreOwnProperty(Date, 'parse', originalDateParseDescriptor)
  }

  assertAccepted(result)
  assert.equal(
    observedTimestamps.filter((value) => value === REQUEST_TIMESTAMP).length,
    3
  )
  assert.equal(
    observedTimestamps.filter((value) => value === REFERENCE_TIMESTAMP).length,
    3
  )
  assert.equal(observedTimestamps.length, 6)

  for (const invalidDateParseCall of [3, 5]) {
    const failedSystem = createBoundarySystem()
    let dateParseCalls = 0
    let invalidationReached = false
    let failedResult

    try {
      Object.defineProperty(Date, 'parse', {
        ...originalDateParseDescriptor,
        value(timestamp) {
          dateParseCalls += 1
          if (dateParseCalls === invalidDateParseCall) {
            invalidationReached = true
            return Number.NaN
          }
          return Reflect.apply(originalDateParse, Date, [timestamp])
        },
      })
      failedResult = failedSystem.boundary.processSyncRawBody(
        createRawRequest()
      )
    } finally {
      restoreOwnProperty(Date, 'parse', originalDateParseDescriptor)
    }

    assert.equal(invalidationReached, true)
    assertLocalFailure(failedResult, 'boundaryFailed')
    assert.deepEqual(failedSystem.calls, {
      generateGatewayRequestId: 0,
      getCurrentTimestamp: 1,
    })
  }
})

test('erzeugt für alle fünf Boundary-Profile vollständig gültige statische Gateway-Fehlerresponses', () => {
  const fixtures = [
    { rawBody: '{', code: 'INVALID_JSON' },
    { rawBody: 'null', code: 'VALIDATION_ERROR' },
    {
      rawBody: createRawRequest({ version: '2.0' }),
      code: 'UNSUPPORTED_VERSION',
    },
    {
      rawBody: createRawRequest({ action: 'fixtureUnknownAction' }),
      code: 'UNKNOWN_ACTION',
    },
    {
      rawBody: '{' + 'x'.repeat(65_536),
      code: 'PAYLOAD_TOO_LARGE',
    },
  ]

  for (const fixture of fixtures) {
    const system = createBoundarySystem()
    const result = system.boundary.processSyncRawBody(fixture.rawBody)

    assertRejected(result, fixture.code)
    assert.deepEqual(
      Reflect.ownKeys(result.gatewayErrorResponse),
      RESPONSE_PROPERTY_NAMES
    )
    assert.equal(result.gatewayErrorResponse.action, null)
    assert.equal(result.gatewayErrorResponse.handledBy, null)
    assert.equal(result.gatewayErrorResponse.data, null)
    assert.deepEqual(result.gatewayErrorResponse.warnings, [])
    assert.deepEqual(result.gatewayErrorResponse.error.details, [])
    assert.deepEqual(result.gatewayErrorResponse.meta.processedBy, [])
    assert.equal(result.gatewayErrorResponse.meta.durationMs, 0)
    assert.equal(system.calls.getCurrentTimestamp, 1)
    assert.equal(system.calls.generateGatewayRequestId, 1)
  }
})

test('validiert jede Gateway-Fehlerresponse vor und nach ihrem Deep Freeze', { concurrency: false }, () => {
  const originalDateParseDescriptor = Object.getOwnPropertyDescriptor(
    Date,
    'parse'
  )
  const originalDateParse = originalDateParseDescriptor.value
  let responseTimestampParseCalls = 0
  const system = createBoundarySystem()
  let result

  try {
    Object.defineProperty(Date, 'parse', {
      ...originalDateParseDescriptor,
      value(timestamp) {
        if (timestamp === REFERENCE_TIMESTAMP) {
          responseTimestampParseCalls += 1
        }
        return Reflect.apply(originalDateParse, Date, [timestamp])
      },
    })
    result = system.boundary.processSyncRawBody('{')
  } finally {
    restoreOwnProperty(Date, 'parse', originalDateParseDescriptor)
  }

  assertRejected(result, 'INVALID_JSON')
  assert.equal(responseTimestampParseCalls, 2)

  for (const invalidResponseValidation of [1, 2]) {
    const failedSystem = createBoundarySystem()
    let validationCalls = 0
    let invalidationReached = false
    let failedResult

    try {
      Object.defineProperty(Date, 'parse', {
        ...originalDateParseDescriptor,
        value(timestamp) {
          if (timestamp === REFERENCE_TIMESTAMP) {
            validationCalls += 1
            if (validationCalls === invalidResponseValidation) {
              invalidationReached = true
              return Number.NaN
            }
          }
          return Reflect.apply(originalDateParse, Date, [timestamp])
        },
      })
      failedResult = failedSystem.boundary.processSyncRawBody('{')
    } finally {
      restoreOwnProperty(Date, 'parse', originalDateParseDescriptor)
    }

    assert.equal(invalidationReached, true)
    assertLocalFailure(failedResult, 'boundaryFailed')
    assert.deepEqual(failedSystem.calls, {
      generateGatewayRequestId: 1,
      getCurrentTimestamp: 1,
    })
  }
})

test('erzeugt für dasselbe INVALID_JSON-Profil vollständig disjunkte ausgabeseitige Identitäten', () => {
  const system = createBoundarySystem({
    gatewayRequestIds: [GATEWAY_REQUEST_ID, SECOND_GATEWAY_REQUEST_ID],
  })
  const firstResult = system.boundary.processSyncRawBody('{')
  const secondResult = system.boundary.processSyncRawBody('{')

  assertRejected(firstResult, 'INVALID_JSON', GATEWAY_REQUEST_ID)
  assertRejected(secondResult, 'INVALID_JSON', SECOND_GATEWAY_REQUEST_ID)
  assertOwnDataGraphsAreDisjoint(firstResult, secondResult)
  assert.notStrictEqual(
    firstResult.gatewayErrorResponse,
    secondResult.gatewayErrorResponse
  )
  assert.notStrictEqual(
    firstResult.gatewayErrorResponse.error,
    secondResult.gatewayErrorResponse.error
  )
  assert.notStrictEqual(
    firstResult.gatewayErrorResponse.meta,
    secondResult.gatewayErrorResponse.meta
  )
  assert.notStrictEqual(
    firstResult.gatewayErrorResponse.error.details,
    secondResult.gatewayErrorResponse.error.details
  )
  assert.notStrictEqual(
    firstResult.gatewayErrorResponse.warnings,
    secondResult.gatewayErrorResponse.warnings
  )
  assert.notStrictEqual(
    firstResult.gatewayErrorResponse.meta.processedBy,
    secondResult.gatewayErrorResponse.meta.processedBy
  )
})

test('erfindet niemals FORBIDDEN, SERVICE_UNAVAILABLE, INTERNAL_ERROR oder eine SyncAgent-Verarbeitung', () => {
  const rawBodies = [
    '{',
    'null',
    createRawRequest({ version: '2.0' }),
    createRawRequest({ action: 'fixtureUnknownAction' }),
    '{' + 'x'.repeat(65_536),
  ]
  const forbiddenCodes = [
    'FORBIDDEN',
    'SERVICE_UNAVAILABLE',
    'INTERNAL_ERROR',
  ]

  for (const rawBody of rawBodies) {
    const system = createBoundarySystem()
    const result = system.boundary.processSyncRawBody(rawBody)

    assert.equal(
      forbiddenCodes.includes(result.gatewayErrorResponse.error.code),
      false
    )
    assert.equal(result.gatewayErrorResponse.handledBy, null)
    assert.deepEqual(result.gatewayErrorResponse.meta.processedBy, [])
    assertResultDoesNotContain(result, ['SyncAgent'])
  }
})

test('wertet die Clock bei akzeptiertem Request und Gateway-Ablehnung jeweils exakt einmal aus', () => {
  const acceptedSystem = createBoundarySystem({
    timestamps: [REFERENCE_TIMESTAMP, 'fixture-second-clock-private-sentinel'],
  })
  const rejectedSystem = createBoundarySystem({
    timestamps: [REFERENCE_TIMESTAMP, 'fixture-second-clock-private-sentinel'],
  })
  const acceptedResult = acceptedSystem.boundary.processSyncRawBody(
    createRawRequest()
  )
  const rejectedResult = rejectedSystem.boundary.processSyncRawBody('{')

  assertAccepted(acceptedResult)
  assertRejected(rejectedResult, 'INVALID_JSON')
  assert.equal(acceptedSystem.calls.getCurrentTimestamp, 1)
  assert.equal(acceptedSystem.calls.generateGatewayRequestId, 0)
  assert.equal(rejectedSystem.calls.getCurrentTimestamp, 1)
  assert.equal(rejectedSystem.calls.generateGatewayRequestId, 1)
  assert.equal(
    rejectedResult.gatewayErrorResponse.timestamp,
    REFERENCE_TIMESTAMP
  )
})

test('konvertiert fremde Clockwerte nie und behandelt alle nicht primitiven oder nichtkanonischen Werte lokal', () => {
  const coercionProbe = createCoercionProbe('fixture-clock')
  const boxedString = new String(REFERENCE_TIMESTAMP)
  boxedString.toString = coercionProbe.value.toString
  boxedString.valueOf = coercionProbe.value.valueOf
  boxedString[Symbol.toPrimitive] = coercionProbe.value[Symbol.toPrimitive]
  let thenGetterCalls = 0
  const thenable = {}
  Object.defineProperty(thenable, 'then', {
    get() {
      thenGetterCalls += 1
      throw new Error('fixture-clock-then-private-sentinel')
    },
  })
  const invalidClockValues = [
    undefined,
    null,
    false,
    0,
    1n,
    Symbol('fixture-clock-symbol-private-sentinel'),
    boxedString,
    coercionProbe.value,
    Promise.resolve(REFERENCE_TIMESTAMP),
    thenable,
    [],
    function fixtureClockValue() {},
    '2031-04-05T10:20:30Z',
  ]

  for (const clockValue of invalidClockValues) {
    const system = createBoundarySystem({ timestamps: [clockValue] })
    const result = system.boundary.processSyncRawBody(createRawRequest())

    assertLocalFailure(result, 'boundaryFailed')
    assert.equal(system.calls.getCurrentTimestamp, 1)
    assert.equal(system.calls.generateGatewayRequestId, 0)
  }

  const invalidRejectionClockSystem = createBoundarySystem({
    timestamps: ['2031-04-05T10:20:30Z'],
  })
  const invalidRejectionClockResult =
    invalidRejectionClockSystem.boundary.processSyncRawBody('{')

  assertLocalFailure(invalidRejectionClockResult, 'boundaryFailed')
  assert.deepEqual(invalidRejectionClockSystem.calls, {
    generateGatewayRequestId: 1,
    getCurrentTimestamp: 1,
  })

  assertCoercionProbeWasNotUsed(coercionProbe)
  assert.equal(thenGetterCalls, 0)
})

test('redigiert werfende oder nicht funktionale Clock-Dependencies nach exakt einem Versuch als boundaryFailed', { concurrency: false }, () => {
  const privateMarkers = [
    'fixture-clock-throw-private-sentinel',
    'fixture-clock-proxy-private-sentinel',
  ]
  let throwingFunctionCalls = 0
  let throwingProxyCalls = 0
  const throwingProxy = new Proxy(function fixtureClockProxy() {}, {
    apply() {
      throwingProxyCalls += 1
      throw new Error(privateMarkers[1])
    },
  })
  const dependencies = [
    () => {
      throwingFunctionCalls += 1
      throw new Error(privateMarkers[0])
    },
    throwingProxy,
    null,
    'fixture-not-a-function',
  ]

  for (const getCurrentTimestamp of dependencies) {
    const boundary = createSyncGatewayRequestBoundary({
      generateGatewayRequestId() {
        throw new Error('fixture-unused-generator-private-sentinel')
      },
      getCurrentTimestamp,
    })
    const result = boundary.processSyncRawBody(createRawRequest())

    assertLocalFailure(result, 'boundaryFailed')
    assertResultDoesNotContain(result, privateMarkers)
  }
  assert.equal(throwingFunctionCalls, 1)
  assert.equal(throwingProxyCalls, 1)
})

test('ruft den Gateway-ID-Generator bei Erfolg nullmal und bei jeder Ablehnung exakt einmal auf', () => {
  let successGeneratorCalls = 0
  const successBoundary = createSyncGatewayRequestBoundary({
    generateGatewayRequestId() {
      successGeneratorCalls += 1
      throw new Error('fixture-success-generator-private-sentinel')
    },
    getCurrentTimestamp() {
      return REFERENCE_TIMESTAMP
    },
  })
  const rejectedSystem = createBoundarySystem({
    gatewayRequestIds: [
      GATEWAY_REQUEST_ID,
      'gateway_fixture-second-call-private-sentinel',
    ],
  })

  assertAccepted(successBoundary.processSyncRawBody(createRawRequest()))
  assert.equal(successGeneratorCalls, 0)

  const rejectedResult = rejectedSystem.boundary.processSyncRawBody('{')
  assertRejected(rejectedResult, 'INVALID_JSON')
  assert.equal(rejectedSystem.calls.generateGatewayRequestId, 1)
})

test('konvertiert Generatorwerte nie und weist nicht primitive oder syntaktisch ungültige gateway_-IDs lokal zurück', () => {
  const coercionProbe = createCoercionProbe('fixture-generator')
  const boxedString = new String(GATEWAY_REQUEST_ID)
  boxedString.toString = coercionProbe.value.toString
  boxedString.valueOf = coercionProbe.value.valueOf
  boxedString[Symbol.toPrimitive] = coercionProbe.value[Symbol.toPrimitive]
  let thenGetterCalls = 0
  const thenable = {}
  Object.defineProperty(thenable, 'then', {
    get() {
      thenGetterCalls += 1
      throw new Error('fixture-generator-then-private-sentinel')
    },
  })
  const invalidGeneratorValues = [
    undefined,
    null,
    false,
    0,
    1n,
    Symbol('fixture-generator-symbol-private-sentinel'),
    boxedString,
    coercionProbe.value,
    Promise.resolve(GATEWAY_REQUEST_ID),
    thenable,
    [],
    function fixtureGeneratorValue() {},
    'req_wrong-prefix',
    'gateway_invalid/value',
    'gateway_' + 'a'.repeat(SYNC_CONTRACT_REQUEST_ID_MAX_LENGTH - 7),
  ]

  for (const generatorValue of invalidGeneratorValues) {
    const system = createBoundarySystem({
      gatewayRequestIds: [generatorValue],
    })
    const result = system.boundary.processSyncRawBody('{')

    assertLocalFailure(result, 'boundaryFailed')
    assert.equal(system.calls.getCurrentTimestamp, 1)
    assert.equal(system.calls.generateGatewayRequestId, 1)
  }

  assertCoercionProbeWasNotUsed(coercionProbe)
  assert.equal(thenGetterCalls, 0)
})

test('redigiert werfende und nicht funktionale Gateway-ID-Dependencies nach exakt einem Versuch', { concurrency: false }, () => {
  const privateMarkers = [
    'fixture-generator-throw-private-sentinel',
    'fixture-generator-proxy-private-sentinel',
  ]
  let throwingFunctionCalls = 0
  let throwingProxyCalls = 0
  const throwingProxy = new Proxy(function fixtureGeneratorProxy() {}, {
    apply() {
      throwingProxyCalls += 1
      throw new Error(privateMarkers[1])
    },
  })
  const dependencies = [
    () => {
      throwingFunctionCalls += 1
      throw new Error(privateMarkers[0])
    },
    throwingProxy,
    null,
    'fixture-not-a-function',
  ]

  for (const generateGatewayRequestId of dependencies) {
    let clockCalls = 0
    const boundary = createSyncGatewayRequestBoundary({
      generateGatewayRequestId,
      getCurrentTimestamp() {
        clockCalls += 1
        return REFERENCE_TIMESTAMP
      },
    })
    const result = boundary.processSyncRawBody('{')

    assertLocalFailure(result, 'boundaryFailed')
    assertResultDoesNotContain(result, privateMarkers)
    assert.equal(clockCalls, 1)
  }
  assert.equal(throwingFunctionCalls, 1)
  assert.equal(throwingProxyCalls, 1)
})

test('verwendet im echten Defaultpfad ausschließlich gateway_ plus crypto.randomUUID mit vorgesehenem Receiver', { concurrency: false }, () => {
  const originalCryptoDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    'crypto'
  )
  const originalMathRandomDescriptor = Object.getOwnPropertyDescriptor(
    Math,
    'random'
  )
  const originalDateNowDescriptor = Object.getOwnPropertyDescriptor(
    Date,
    'now'
  )
  const uuid = '63bf9a18-177f-4f35-8a04-1b619bada742'
  let cryptoGetterCalls = 0
  let randomUuidGetterCalls = 0
  let randomUuidCalls = 0
  let mathRandomCalls = 0
  let dateNowCalls = 0
  const receivers = []
  const cryptoProvider = {}
  Object.defineProperty(cryptoProvider, 'randomUUID', {
    configurable: true,
    enumerable: true,
    get() {
      randomUuidGetterCalls += 1
      return function randomUUID() {
        randomUuidCalls += 1
        receivers.push(this)
        return uuid
      }
    },
  })
  let result

  try {
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      enumerable: originalCryptoDescriptor?.enumerable ?? true,
      get() {
        cryptoGetterCalls += 1
        return cryptoProvider
      },
    })
    Object.defineProperty(Math, 'random', {
      ...originalMathRandomDescriptor,
      value() {
        mathRandomCalls += 1
        throw new Error('fixture-math-random-private-sentinel')
      },
    })
    Object.defineProperty(Date, 'now', {
      ...originalDateNowDescriptor,
      value() {
        dateNowCalls += 1
        throw new Error('fixture-date-now-private-sentinel')
      },
    })
    const boundary = createSyncGatewayRequestBoundary({
      getCurrentTimestamp() {
        return REFERENCE_TIMESTAMP
      },
    })
    result = boundary.processSyncRawBody('{')
  } finally {
    restoreOwnProperty(globalThis, 'crypto', originalCryptoDescriptor)
    restoreOwnProperty(Math, 'random', originalMathRandomDescriptor)
    restoreOwnProperty(Date, 'now', originalDateNowDescriptor)
  }

  assertRejected(result, 'INVALID_JSON', 'gateway_' + uuid)
  assert.equal(cryptoGetterCalls, 1)
  assert.equal(randomUuidGetterCalls, 1)
  assert.equal(randomUuidCalls, 1)
  assert.deepEqual(receivers, [cryptoProvider])
  assert.equal(mathRandomCalls, 0)
  assert.equal(dateNowCalls, 0)
})

test('liefert der echte Default-Clockpfad kanonische UTC-Zeitstempel für Erfolg und Ablehnung', () => {
  const currentTimestamp = new Date().toISOString()
  const acceptedBoundary = createSyncGatewayRequestBoundary()
  const rejectedBoundary = createSyncGatewayRequestBoundary({
    generateGatewayRequestId() {
      return GATEWAY_REQUEST_ID
    },
  })
  const acceptedResult = acceptedBoundary.processSyncRawBody(
    createRawRequest({ timestamp: currentTimestamp })
  )
  const rejectedResult = rejectedBoundary.processSyncRawBody('{')

  assert.equal(acceptedResult.status, 'syncRequestAccepted')
  assert.deepEqual(
    validateSyncRequest(
      acceptedResult.syncRequest,
      acceptedResult.syncRequest.timestamp
    ),
    { ok: true, errors: [] }
  )
  assertRejected(
    rejectedResult,
    'INVALID_JSON',
    GATEWAY_REQUEST_ID,
    rejectedResult.gatewayErrorResponse.timestamp
  )
  assert.match(
    rejectedResult.gatewayErrorResponse.timestamp,
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
  )
})

test('weist alle fehlenden, werfenden und ungültigen Default-crypto.randomUUID-Pfade ohne schwächeren Fallback zurück', { concurrency: false }, () => {
  const originalCryptoDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    'crypto'
  )
  const originalMathRandomDescriptor = Object.getOwnPropertyDescriptor(
    Math,
    'random'
  )
  const originalDateNowDescriptor = Object.getOwnPropertyDescriptor(
    Date,
    'now'
  )
  const privateMarkers = [
    'fixture-crypto-getter-private-sentinel',
    'fixture-uuid-getter-private-sentinel',
    'fixture-uuid-non-function-private-sentinel',
    'fixture-uuid-call-private-sentinel',
    'fixture-uuid-object-private-sentinel',
    'fixture-uuid-invalid/value-private-sentinel',
  ]
  const coercionProbe = createCoercionProbe('fixture-default-uuid')
  const throwingGetterProvider = {}
  Object.defineProperty(throwingGetterProvider, 'randomUUID', {
    configurable: true,
    get() {
      throw new Error(privateMarkers[1])
    },
  })
  let throwingRandomUuidCalls = 0
  const fallbackCryptoPropertyReads = []
  const throwingMethodProviderTarget = {
    randomUUID() {
      throwingRandomUuidCalls += 1
      throw new Error(privateMarkers[3])
    },
  }
  const throwingMethodProvider = new Proxy(
    throwingMethodProviderTarget,
    {
      get(target, propertyName, receiver) {
        if (propertyName !== 'randomUUID') {
          fallbackCryptoPropertyReads.push(propertyName)
        }
        return Reflect.get(target, propertyName, receiver)
      },
    }
  )
  const nonPrimitiveProvider = {
    randomUUID() {
      return coercionProbe.value
    },
  }
  const invalidStringProvider = {
    randomUUID() {
      return privateMarkers[5]
    },
  }
  const cases = [
    {
      name: 'crypto unavailable',
      descriptor: {
        configurable: true,
        enumerable: originalCryptoDescriptor?.enumerable ?? true,
        value: undefined,
        writable: true,
      },
    },
    {
      name: 'randomUUID unavailable',
      descriptor: {
        configurable: true,
        enumerable: originalCryptoDescriptor?.enumerable ?? true,
        value: {},
        writable: true,
      },
    },
    {
      name: 'crypto getter throws',
      descriptor: {
        configurable: true,
        enumerable: originalCryptoDescriptor?.enumerable ?? true,
        get() {
          throw new Error(privateMarkers[0])
        },
      },
    },
    {
      name: 'randomUUID getter throws',
      descriptor: {
        configurable: true,
        enumerable: originalCryptoDescriptor?.enumerable ?? true,
        value: throwingGetterProvider,
        writable: true,
      },
    },
    {
      name: 'randomUUID non-functional',
      descriptor: {
        configurable: true,
        enumerable: originalCryptoDescriptor?.enumerable ?? true,
        value: { randomUUID: privateMarkers[2] },
        writable: true,
      },
    },
    {
      name: 'randomUUID throws',
      descriptor: {
        configurable: true,
        enumerable: originalCryptoDescriptor?.enumerable ?? true,
        value: throwingMethodProvider,
        writable: true,
      },
    },
    {
      name: 'randomUUID returns object',
      descriptor: {
        configurable: true,
        enumerable: originalCryptoDescriptor?.enumerable ?? true,
        value: nonPrimitiveProvider,
        writable: true,
      },
    },
    {
      name: 'randomUUID returns invalid string',
      descriptor: {
        configurable: true,
        enumerable: originalCryptoDescriptor?.enumerable ?? true,
        value: invalidStringProvider,
        writable: true,
      },
    },
  ]
  let mathRandomCalls = 0
  let dateNowCalls = 0
  const results = []

  try {
    Object.defineProperty(Math, 'random', {
      ...originalMathRandomDescriptor,
      value() {
        mathRandomCalls += 1
        return 0.25
      },
    })
    Object.defineProperty(Date, 'now', {
      ...originalDateNowDescriptor,
      value() {
        dateNowCalls += 1
        return 0
      },
    })

    for (const failureCase of cases) {
      Object.defineProperty(globalThis, 'crypto', failureCase.descriptor)
      const boundary = createSyncGatewayRequestBoundary({
        getCurrentTimestamp() {
          return REFERENCE_TIMESTAMP
        },
      })
      results.push({
        name: failureCase.name,
        result: boundary.processSyncRawBody('{'),
      })
    }
  } finally {
    try {
      restoreOwnProperty(globalThis, 'crypto', originalCryptoDescriptor)
    } finally {
      try {
        restoreOwnProperty(Math, 'random', originalMathRandomDescriptor)
      } finally {
        restoreOwnProperty(Date, 'now', originalDateNowDescriptor)
      }
    }
  }

  for (const observation of results) {
    assertLocalFailure(observation.result, 'boundaryFailed')
    assertResultDoesNotContain(observation.result, privateMarkers)
  }
  assert.equal(throwingRandomUuidCalls, 1)
  assert.deepEqual(fallbackCryptoPropertyReads, [])
  assert.equal(mathRandomCalls, 0)
  assert.equal(dateNowCalls, 0)
  assertCoercionProbeWasNotUsed(coercionProbe)
})

test('behandelt manipulierte interne Validatorresultat-Arrays mit symbolischen Zusatzkeys fail closed', { concurrency: false }, () => {
  const originalOwnKeysDescriptor = Object.getOwnPropertyDescriptor(
    Reflect,
    'ownKeys'
  )
  const originalOwnKeys = originalOwnKeysDescriptor.value
  const privateMarker = 'fixture-validation-array-symbol-private-sentinel'
  let injectedArrayKeys = 0
  const system = createBoundarySystem()
  let result

  try {
    Object.defineProperty(Reflect, 'ownKeys', {
      ...originalOwnKeysDescriptor,
      value(value) {
        const ownKeys = Reflect.apply(originalOwnKeys, Reflect, [value])
        if (
          injectedArrayKeys === 0 &&
          Array.isArray(value) &&
          value.length === 0
        ) {
          injectedArrayKeys += 1
          return [...ownKeys, Symbol(privateMarker)]
        }
        return ownKeys
      },
    })
    result = system.boundary.processSyncRawBody(createRawRequest())
  } finally {
    restoreOwnProperty(Reflect, 'ownKeys', originalOwnKeysDescriptor)
  }

  assertLocalFailure(result, 'boundaryFailed')
  assert.equal(injectedArrayKeys, 1)
  assert.deepEqual(system.calls, {
    generateGatewayRequestId: 0,
    getCurrentTimestamp: 0,
  })
  assertResultDoesNotContain(result, [privateMarker])
})

test('redigiert Sentinels aus Raw Body, Request, Clock, Generator und instrumentierten versteckten Feldern vollständig ohne Console-Ausgabe', { concurrency: false }, () => {
  const consoleMethods = ['log', 'info', 'warn', 'error', 'debug', 'trace']
  const originalConsoleDescriptors = new Map(
    consoleMethods.map((methodName) => [
      methodName,
      Object.getOwnPropertyDescriptor(console, methodName),
    ])
  )
  const originalParseDescriptor = Object.getOwnPropertyDescriptor(JSON, 'parse')
  const privateMarkers = [
    'fixture-console-raw-private-sentinel',
    'fixture-console-request-private-sentinel',
    'fixture-console-clock-private-sentinel',
    'fixture-console-generator-private-sentinel',
    'fixture-console-hidden-private-sentinel',
    'fixture-console-symbol-private-sentinel',
  ]
  const consoleCalls = []
  const results = []
  const hiddenRequest = createRequest()
  Object.defineProperty(hiddenRequest, 'hiddenPrivateField', {
    configurable: true,
    enumerable: false,
    value: privateMarkers[4],
  })
  hiddenRequest[Symbol(privateMarkers[5])] = privateMarkers[5]

  try {
    for (const methodName of consoleMethods) {
      Object.defineProperty(console, methodName, {
        ...originalConsoleDescriptors.get(methodName),
        value(...args) {
          consoleCalls.push({ args, methodName })
        },
      })
    }

    results.push(
      createBoundarySystem().boundary.processSyncRawBody(privateMarkers[0])
    )
    results.push(
      createBoundarySystem().boundary.processSyncRawBody(
        createRawRequest({ source: privateMarkers[1] })
      )
    )
    results.push(createSyncGatewayRequestBoundary({
      generateGatewayRequestId() {
        return GATEWAY_REQUEST_ID
      },
      getCurrentTimestamp() {
        throw new Error(privateMarkers[2])
      },
    }).processSyncRawBody(createRawRequest()))
    results.push(createSyncGatewayRequestBoundary({
      generateGatewayRequestId() {
        throw new Error(privateMarkers[3])
      },
      getCurrentTimestamp() {
        return REFERENCE_TIMESTAMP
      },
    }).processSyncRawBody('{'))

    Object.defineProperty(JSON, 'parse', {
      ...originalParseDescriptor,
      value() {
        return hiddenRequest
      },
    })
    results.push(
      createBoundarySystem().boundary.processSyncRawBody('{}')
    )
  } finally {
    restoreOwnProperty(JSON, 'parse', originalParseDescriptor)
    for (const methodName of consoleMethods) {
      restoreOwnProperty(
        console,
        methodName,
        originalConsoleDescriptors.get(methodName)
      )
    }
  }

  assertRejected(results[0], 'INVALID_JSON')
  assertRejected(results[1], 'VALIDATION_ERROR')
  assertLocalFailure(results[2], 'boundaryFailed')
  assertLocalFailure(results[3], 'boundaryFailed')
  assertRejected(results[4], 'VALIDATION_ERROR')
  results.forEach((result) => {
    assertResultDoesNotContain(result, privateMarkers)
  })
  assert.deepEqual(consoleCalls, [])
})

test('normalisiert Unicode im Raw Body nicht und übergibt auch decomposed Sequenzen bytegetreu an den Parser', { concurrency: false }, () => {
  const originalParseDescriptor = Object.getOwnPropertyDescriptor(JSON, 'parse')
  const decomposedMarker = 'e\u0301-fixture'
  const rawBody = '"' + decomposedMarker + '"'
  let observedRawBody
  const system = createBoundarySystem()
  let result

  assert.notEqual(decomposedMarker, decomposedMarker.normalize('NFC'))

  try {
    Object.defineProperty(JSON, 'parse', {
      ...originalParseDescriptor,
      value(value) {
        observedRawBody = value
        return createRequest()
      },
    })
    result = system.boundary.processSyncRawBody(rawBody)
  } finally {
    restoreOwnProperty(JSON, 'parse', originalParseDescriptor)
  }

  assertAccepted(result)
  assert.equal(observedRawBody, rawBody)
  assert.equal(observedRawBody.includes(decomposedMarker), true)
  assert.equal(observedRawBody.includes(decomposedMarker.normalize('NFC')), false)
})

test('löst die JSON.parse-Property exakt einmal auf und ruft die aufgelöste Methode genau einmal auf', { concurrency: false }, () => {
  const originalParseDescriptor = Object.getOwnPropertyDescriptor(JSON, 'parse')
  const originalParse = originalParseDescriptor.value
  let parseGetterCalls = 0
  let parseMethodCalls = 0
  const receivers = []
  const system = createBoundarySystem()
  let result

  try {
    Object.defineProperty(JSON, 'parse', {
      configurable: true,
      enumerable: originalParseDescriptor.enumerable,
      get() {
        parseGetterCalls += 1
        return function parse(rawBody) {
          parseMethodCalls += 1
          receivers.push(this)
          return Reflect.apply(originalParse, JSON, [rawBody])
        }
      },
    })
    result = system.boundary.processSyncRawBody(createRawRequest())
  } finally {
    restoreOwnProperty(JSON, 'parse', originalParseDescriptor)
  }

  assertAccepted(result)
  assert.equal(parseGetterCalls, 1)
  assert.equal(parseMethodCalls, 1)
  assert.deepEqual(receivers, [JSON])
})

test('löst JSON.parse bei Übergröße nicht einmal als Property auf', { concurrency: false }, () => {
  const originalParseDescriptor = Object.getOwnPropertyDescriptor(JSON, 'parse')
  let parseGetterCalls = 0
  const system = createBoundarySystem()
  let result

  try {
    Object.defineProperty(JSON, 'parse', {
      configurable: true,
      enumerable: originalParseDescriptor.enumerable,
      get() {
        parseGetterCalls += 1
        throw new Error('fixture-oversized-parser-getter-private-sentinel')
      },
    })
    result = system.boundary.processSyncRawBody('{' + 'x'.repeat(65_536))
  } finally {
    restoreOwnProperty(JSON, 'parse', originalParseDescriptor)
  }

  assertRejected(result, 'PAYLOAD_TOO_LARGE')
  assert.equal(parseGetterCalls, 0)
})

test('prüft Redaktionsgraphen descriptor-basiert, ohne fremde Accessors auszuführen', () => {
  const privateMarker = 'fixture-redaction-accessor-private-sentinel'
  let accessorCalls = 0
  const hostileValue = {}
  Object.defineProperty(hostileValue, 'hiddenAccessor', {
    configurable: true,
    enumerable: false,
    get() {
      accessorCalls += 1
      throw new Error(privateMarker)
    },
  })

  assert.doesNotThrow(() => {
    assertResultDoesNotContain(hostileValue, [privateMarker])
  })
  assert.equal(accessorCalls, 0)
})

test('erzeugt auch lokale Fehler pro Aufruf als frische vollständig getrennte Snapshots', () => {
  const boundary = createSyncGatewayRequestBoundary()
  const firstResult = boundary.processSyncRawBody()
  const secondResult = boundary.processSyncRawBody()

  assertLocalFailure(firstResult, 'invalidInvocation')
  assertLocalFailure(secondResult, 'invalidInvocation')
  assert.notStrictEqual(firstResult, secondResult)
  assert.notStrictEqual(firstResult.error, secondResult.error)
  assertOwnDataGraphsAreDisjoint(firstResult, secondResult)
})
