import assert from 'node:assert/strict'
import test from 'node:test'
import { types as utilTypes } from 'node:util'

import {
  SYNC_CONTRACT_ACTIONS,
  SYNC_CONTRACT_DATA_ORIGINS,
  SYNC_CONTRACT_HANDLERS,
  SYNC_CONTRACT_MAX_DURATION_MS,
  SYNC_CONTRACT_RESPONSE_ERROR_PROFILES,
  SYNC_CONTRACT_SOURCES,
  SYNC_CONTRACT_VERSION,
  validateSyncRequest,
  validateSyncResponse,
} from '../src/contracts/syncContract.js'
import * as syncServiceModule from '../src/services/syncService.js'

const { createSyncService } = syncServiceModule

const REQUEST_TIMESTAMP = '2031-04-05T10:20:30.000Z'
const SECOND_REQUEST_TIMESTAMP = '2031-04-05T10:20:31.000Z'
const THIRD_REQUEST_TIMESTAMP = '2031-04-05T10:20:32.000Z'
const RESPONSE_TIMESTAMP = '2031-04-05T10:20:30.125Z'
const REQUEST_ID = 'req_48be0e81-2ace-46df-b713-3d580f313b71'
const SECOND_REQUEST_ID = 'req_7a7816e5-2024-4e6c-86d8-06efbf621226'
const THIRD_REQUEST_ID = 'req_91c82166-108c-45e7-9f55-626c76378a47'

const SERVICE_RESULT_PROPERTY_NAMES = Object.freeze([
  'ok',
  'status',
  'requestId',
  'syncResponse',
  'error',
])
const LOCAL_ERROR_PROPERTY_NAMES = Object.freeze(['code', 'message'])
const SYNC_RESPONSE_PROPERTY_NAMES = Object.freeze([
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
const SUCCESS_DATA_PROPERTY_NAMES = Object.freeze(['status', 'dataOrigin'])
const RESPONSE_ERROR_PROPERTY_NAMES = Object.freeze([
  'code',
  'message',
  'retryable',
  'details',
])
const RESPONSE_META_PROPERTY_NAMES = Object.freeze([
  'durationMs',
  'processedBy',
])

const EXPECTED_FAILURES = Object.freeze({
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


function createExpectedRequest(
  requestId = REQUEST_ID,
  timestamp = REQUEST_TIMESTAMP
) {
  return {
    version: SYNC_CONTRACT_VERSION,
    action: SYNC_CONTRACT_ACTIONS[0],
    source: SYNC_CONTRACT_SOURCES[0],
    requestId,
    timestamp,
    payload: {},
  }
}

// Diese Fixture simuliert ausschließlich die bestehende Vertragsrolle. Sie
// beweist weder einen operativen SyncAgent noch einen externen Datenfluss.
function createSyntheticSuccessResponse(request, overrides = {}) {
  return {
    version: SYNC_CONTRACT_VERSION,
    success: true,
    requestId: request.requestId,
    action: request.action,
    handledBy: SYNC_CONTRACT_HANDLERS[0],
    timestamp: RESPONSE_TIMESTAMP,
    data: {
      status: 'ok',
      dataOrigin: SYNC_CONTRACT_DATA_ORIGINS[0],
    },
    error: null,
    warnings: [],
    meta: {
      durationMs: 7,
      processedBy: [SYNC_CONTRACT_HANDLERS[0]],
    },
    ...overrides,
  }
}

function createSyntheticNormalErrorResponse(
  request,
  code = 'SERVICE_UNAVAILABLE',
  overrides = {}
) {
  const profile = SYNC_CONTRACT_RESPONSE_ERROR_PROFILES[code]

  return createSyntheticSuccessResponse(request, {
    success: false,
    data: null,
    error: {
      code: profile.code,
      message: profile.message,
      retryable: profile.retryable,
      details: [],
    },
    ...overrides,
  })
}

function createSyntheticGatewayErrorResponse() {
  const profile = SYNC_CONTRACT_RESPONSE_ERROR_PROFILES.INVALID_JSON

  return {
    version: SYNC_CONTRACT_VERSION,
    success: false,
    requestId: 'gateway_1fde999c-8ea6-4238-a5e7-158e4a106696',
    action: null,
    handledBy: null,
    timestamp: RESPONSE_TIMESTAMP,
    data: null,
    error: {
      code: profile.code,
      message: profile.message,
      retryable: profile.retryable,
      details: [],
    },
    warnings: [],
    meta: {
      durationMs: 3,
      processedBy: [],
    },
  }
}

function getQueuedValue(values, index) {
  return index < values.length ? values[index] : values.at(-1)
}

function createServiceSystem({
  requestIds = [REQUEST_ID],
  timestamps = [REQUEST_TIMESTAMP],
  generateRequestIdImplementation,
  getCurrentTimestampImplementation,
  transportImplementation,
} = {}) {
  const calls = {
    generateRequestId: 0,
    getCurrentTimestamp: 0,
    sendSyncRequest: 0,
    requests: [],
    receivers: [],
  }

  const generateRequestId = () => {
    const callNumber = calls.generateRequestId + 1
    const queuedValue = getQueuedValue(requestIds, callNumber - 1)
    calls.generateRequestId = callNumber

    if (generateRequestIdImplementation) {
      return generateRequestIdImplementation({ callNumber, queuedValue })
    }

    return queuedValue
  }
  const getCurrentTimestamp = () => {
    const callNumber = calls.getCurrentTimestamp + 1
    const queuedValue = getQueuedValue(timestamps, callNumber - 1)
    calls.getCurrentTimestamp = callNumber

    if (getCurrentTimestampImplementation) {
      return getCurrentTimestampImplementation({ callNumber, queuedValue })
    }

    return queuedValue
  }
  const syncTransport = {
    sendSyncRequest(syncRequest) {
      calls.sendSyncRequest += 1
      calls.requests.push(syncRequest)
      calls.receivers.push(this)

      if (transportImplementation) {
        return transportImplementation({
          callNumber: calls.sendSyncRequest,
          syncRequest,
          syncTransport,
        })
      }

      return createSyntheticSuccessResponse(syncRequest)
    },
  }
  const service = createSyncService({
    syncTransport,
    generateRequestId,
    getCurrentTimestamp,
  })

  return { calls, service, syncTransport }
}

function createDeferred() {
  let resolve
  let reject
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })

  return { promise, reject, resolve }
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
    assert.equal(descriptor.configurable, false)
    assert.equal(descriptor.writable, false)
    assert.equal(descriptor.enumerable, propertyName !== 'length')
  }
}

function assertExactFrozenSyncResponseShape(syncResponse) {
  assertExactFrozenOwnDataRecord(
    syncResponse,
    SYNC_RESPONSE_PROPERTY_NAMES
  )

  if (syncResponse.data !== null) {
    assertExactFrozenOwnDataRecord(
      syncResponse.data,
      SUCCESS_DATA_PROPERTY_NAMES
    )
  }

  if (syncResponse.error !== null) {
    assertExactFrozenOwnDataRecord(
      syncResponse.error,
      RESPONSE_ERROR_PROPERTY_NAMES
    )
    assertExactFrozenOwnDataArray(syncResponse.error.details)
  }

  assertExactFrozenOwnDataArray(syncResponse.warnings)
  assertExactFrozenOwnDataRecord(
    syncResponse.meta,
    RESPONSE_META_PROPERTY_NAMES
  )
  assertExactFrozenOwnDataArray(syncResponse.meta.processedBy)
}

function assertLocalFailure(result, failureName, requestId = null) {
  const failure = EXPECTED_FAILURES[failureName]

  assert.deepEqual(result, {
    ok: false,
    status: failure.status,
    requestId,
    syncResponse: null,
    error: {
      code: failure.code,
      message: failure.message,
    },
  })
  assertExactFrozenOwnDataRecord(result, SERVICE_RESULT_PROPERTY_NAMES)
  assertExactFrozenOwnDataRecord(result.error, LOCAL_ERROR_PROPERTY_NAMES)
  assertDeepFrozen(result)
}

function assertSuccessfulServiceResult(result, requestId = REQUEST_ID) {
  assert.equal(result.ok, true)
  assert.equal(result.status, 'syncResponseReceived')
  assert.equal(result.requestId, requestId)
  assert.equal(result.error, null)
  assertExactFrozenOwnDataRecord(result, SERVICE_RESULT_PROPERTY_NAMES)
  assertExactFrozenSyncResponseShape(result.syncResponse)
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
          `Serviceergebnis enthält redigierungspflichtigen Marker: ${marker}`
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
      const originalDescriptor = original.descriptor

      assert.notEqual(current, undefined)
      assert.equal(current.configurable, originalDescriptor.configurable)
      assert.equal(current.enumerable, originalDescriptor.enumerable)
      assert.equal(
        Object.hasOwn(current, 'value'),
        Object.hasOwn(originalDescriptor, 'value')
      )

      if (Object.hasOwn(originalDescriptor, 'value')) {
        assert.equal(current.writable, originalDescriptor.writable)
        assert.equal(
          Object.is(current.value, originalDescriptor.value),
          true
        )
      } else {
        assert.strictEqual(current.get, originalDescriptor.get)
        assert.strictEqual(current.set, originalDescriptor.set)
      }
    }
  }
}

function assertOwnDataGraphIsUnfrozen(rootValue) {
  const snapshot = captureOwnDataDescriptorGraph(rootValue)

  for (const node of snapshot.nodes) {
    assert.equal(Object.isFrozen(node.value), false)
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

async function runWithTransportResponse(responseFactory, options = {}) {
  let originalResponse
  const system = createServiceSystem({
    ...options,
    transportImplementation({ syncRequest }) {
      originalResponse = responseFactory(syncRequest)
      return originalResponse
    },
  })
  const result = await system.service.runSyncTest()

  return { ...system, originalResponse, result }
}

async function runWithSnapshottedTransportResponse(
  responseFactory,
  options = {}
) {
  let originalResponse
  let originalResponseSnapshot
  const system = createServiceSystem({
    ...options,
    transportImplementation({ syncRequest }) {
      originalResponse = responseFactory(syncRequest)
      originalResponseSnapshot = captureOwnDataDescriptorGraph(
        originalResponse
      )
      return originalResponse
    },
  })
  const result = await system.service.runSyncTest()

  return {
    ...system,
    originalResponse,
    originalResponseSnapshot,
    result,
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
      throw new Error(`${label}-to-string-sentinel`)
    },
    valueOf() {
      calls.valueOf += 1
      throw new Error(`${label}-value-of-sentinel`)
    },
    [Symbol.toPrimitive]() {
      calls.symbolToPrimitive += 1
      throw new Error(`${label}-symbol-to-primitive-sentinel`)
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

test('exportiert ausschließlich die Factory und liefert eine exakt eingefrorene Ein-Methoden-API', () => {
  const service = createSyncService()
  const moduleOwnKeys = Reflect.ownKeys(syncServiceModule)
  const exportDescriptor = Object.getOwnPropertyDescriptor(
    syncServiceModule,
    'createSyncService'
  )
  const moduleTagDescriptor = Object.getOwnPropertyDescriptor(
    syncServiceModule,
    Symbol.toStringTag
  )

  assert.strictEqual(Object.getPrototypeOf(syncServiceModule), null)
  assert.equal(Object.isExtensible(syncServiceModule), false)
  assert.deepEqual(moduleOwnKeys, [
    'createSyncService',
    Symbol.toStringTag,
  ])
  assert.deepEqual(exportDescriptor, {
    value: createSyncService,
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
  assertExactFrozenOwnDataRecord(service, ['runSyncTest'])
  assert.equal(typeof service.runSyncTest, 'function')
  assert.equal(service.runSyncTest.length, 0)
})

test('erkennt versteckte und symbolische Rohwerte descriptor-basiert, ohne Accessors auszuführen', () => {
  const hiddenMarker = 'fixture-hidden-private-sentinel'
  const symbolMarker = 'fixture-symbol-private-sentinel'
  const accessorMarker = 'fixture-accessor-private-sentinel'
  const hiddenError = {
    code: 'syncTransportFailed',
    message: 'Die Sync-Anfrage konnte nicht übermittelt werden.',
  }

  Object.defineProperty(hiddenError, 'rawError', {
    configurable: false,
    enumerable: false,
    value: hiddenMarker,
    writable: false,
  })
  Object.freeze(hiddenError)

  assert.throws(
    () => assertExactFrozenOwnDataRecord(
      hiddenError,
      LOCAL_ERROR_PROPERTY_NAMES
    ),
    { name: 'AssertionError' }
  )
  assert.throws(
    () => assertResultDoesNotContain(hiddenError, [hiddenMarker]),
    { name: 'AssertionError' }
  )

  const symbolValue = {}
  Object.defineProperty(symbolValue, Symbol('fixtureRawError'), {
    configurable: true,
    enumerable: false,
    value: symbolMarker,
    writable: true,
  })
  assert.throws(
    () => assertResultDoesNotContain(symbolValue, [symbolMarker]),
    { name: 'AssertionError' }
  )

  let accessorCalls = 0
  const accessorValue = {}
  Object.defineProperty(accessorValue, 'rawError', {
    configurable: true,
    enumerable: false,
    get() {
      accessorCalls += 1
      throw new Error(accessorMarker)
    },
  })

  assert.doesNotThrow(() => {
    assertResultDoesNotContain(accessorValue, [accessorMarker])
  })
  assert.equal(accessorCalls, 0)
})

test('liefert für alle sieben Ergebnisprofile sofort ein echtes Promise', async () => {
  const invalidInvocationSystem = createServiceSystem()
  const requestBuildSystem = createServiceSystem({
    requestIds: ['fixture-invalid-request-id'],
  })
  const transportFailureSystem = createServiceSystem({
    transportImplementation() {
      throw new Error('fixture-promise-transport-private-sentinel')
    },
  })
  const invalidResponseSystem = createServiceSystem({
    transportImplementation() {
      return {}
    },
  })
  const successSystem = createServiceSystem()
  const normalErrorSystem = createServiceSystem({
    transportImplementation({ syncRequest }) {
      return createSyntheticNormalErrorResponse(syncRequest)
    },
  })
  const pendingResults = {
    invalidInvocation: invalidInvocationSystem.service.runSyncTest(
      'fixture-extra-argument'
    ),
    unavailable: createSyncService().runSyncTest(),
    requestBuildFailed: requestBuildSystem.service.runSyncTest(),
    transportFailed: transportFailureSystem.service.runSyncTest(),
    invalidResponse: invalidResponseSystem.service.runSyncTest(),
    success: successSystem.service.runSyncTest(),
    normalError: normalErrorSystem.service.runSyncTest(),
  }

  for (const pendingResult of Object.values(pendingResults)) {
    assert.equal(utilTypes.isPromise(pendingResult), true)
    assert.equal(pendingResult instanceof Promise, true)
  }

  const results = Object.fromEntries(
    await Promise.all(
      Object.entries(pendingResults).map(async ([profile, pendingResult]) => [
        profile,
        await pendingResult,
      ])
    )
  )

  assertLocalFailure(results.invalidInvocation, 'invalidInvocation')
  assertLocalFailure(results.unavailable, 'unavailable')
  assertLocalFailure(results.requestBuildFailed, 'requestBuildFailed')
  assertLocalFailure(results.transportFailed, 'transportFailed', REQUEST_ID)
  assertLocalFailure(results.invalidResponse, 'invalidResponse', REQUEST_ID)
  assertSuccessfulServiceResult(results.success)
  assertSuccessfulServiceResult(results.normalError)
  assert.equal(results.normalError.syncResponse.success, false)
})

test('weist Zusatzargumente ohne Property-, Proxy- oder Konvertierungszugriff vor allen Dependencies zurück', async () => {
  const trapCalls = {
    get: 0,
    getOwnPropertyDescriptor: 0,
    getPrototypeOf: 0,
    ownKeys: 0,
  }
  const hostileArgument = new Proxy({}, {
    get() {
      trapCalls.get += 1
      throw new Error('fixture-invocation-get-private-sentinel')
    },
    getOwnPropertyDescriptor() {
      trapCalls.getOwnPropertyDescriptor += 1
      throw new Error('fixture-invocation-descriptor-private-sentinel')
    },
    getPrototypeOf() {
      trapCalls.getPrototypeOf += 1
      throw new Error('fixture-invocation-prototype-private-sentinel')
    },
    ownKeys() {
      trapCalls.ownKeys += 1
      throw new Error('fixture-invocation-own-keys-private-sentinel')
    },
  })
  const revokedArgument = Proxy.revocable({}, {})
  revokedArgument.revoke()
  const coercionProbe = createCoercionProbe('fixture-invocation')
  const calls = {
    generateRequestId: 0,
    getCurrentTimestamp: 0,
    transportProperty: 0,
  }
  const syncTransport = new Proxy({}, {
    get() {
      calls.transportProperty += 1
      throw new Error('fixture-unused-transport-private-sentinel')
    },
  })
  const service = createSyncService({
    syncTransport,
    generateRequestId() {
      calls.generateRequestId += 1
      return REQUEST_ID
    },
    getCurrentTimestamp() {
      calls.getCurrentTimestamp += 1
      return REQUEST_TIMESTAMP
    },
  })
  const invocations = [
    [undefined],
    [hostileArgument],
    [revokedArgument.proxy],
    [coercionProbe.value],
    ['synthetic-extra-a', 'synthetic-extra-b'],
  ]

  for (const providedArguments of invocations) {
    const result = await service.runSyncTest(...providedArguments)

    assertLocalFailure(result, 'invalidInvocation')
  }

  assert.deepEqual(trapCalls, {
    get: 0,
    getOwnPropertyDescriptor: 0,
    getPrototypeOf: 0,
    ownKeys: 0,
  })
  assertCoercionProbeWasNotUsed(coercionProbe)
  assert.deepEqual(calls, {
    generateRequestId: 0,
    getCurrentTimestamp: 0,
    transportProperty: 0,
  })
})

test('baut den exakten validierten Sechs-Felder-Request aus Contractkonstanten und derselben Referenzzeit', async () => {
  const system = createServiceSystem()
  const result = await system.service.runSyncTest()
  const transportRequest = system.calls.requests[0]

  assertSuccessfulServiceResult(result)
  assert.deepEqual(transportRequest, createExpectedRequest())
  assert.deepEqual(Reflect.ownKeys(transportRequest), [
    'version',
    'action',
    'source',
    'requestId',
    'timestamp',
    'payload',
  ])
  assert.deepEqual(Reflect.ownKeys(transportRequest.payload), [])
  assert.deepEqual(
    validateSyncRequest(transportRequest, REQUEST_TIMESTAMP),
    { ok: true, errors: [] }
  )
  assert.deepEqual(
    validateSyncResponse(result.syncResponse, transportRequest),
    { ok: true, errors: [] }
  )
  assert.equal(system.calls.generateRequestId, 1)
  assert.equal(system.calls.getCurrentTimestamp, 1)
  assert.equal(system.calls.sendSyncRequest, 1)
  assert.equal(system.calls.receivers[0], system.syncTransport)
  assert.equal(Object.isFrozen(transportRequest), true)
  assert.equal(Object.isFrozen(transportRequest.payload), true)
})

test('löst die Transportmethode genau einmal auf und ruft sie mit dem vorgesehenen Receiver auf', async () => {
  let methodGetterCalls = 0
  let methodCalls = 0
  let receiver
  const syncTransport = {}

  Object.defineProperty(syncTransport, 'sendSyncRequest', {
    configurable: true,
    get() {
      methodGetterCalls += 1

      return function sendSyncRequest(syncRequest) {
        methodCalls += 1
        receiver = this
        return createSyntheticSuccessResponse(syncRequest)
      }
    },
  })
  const service = createSyncService({
    syncTransport,
    generateRequestId: () => REQUEST_ID,
    getCurrentTimestamp: () => REQUEST_TIMESTAMP,
  })
  const result = await service.runSyncTest()

  assertSuccessfulServiceResult(result)
  assert.equal(methodGetterCalls, 1)
  assert.equal(methodCalls, 1)
  assert.equal(receiver, syncTransport)
})

test('erzeugt pro sequenziellem Aufruf frische Requests, Payloads, Snapshots und Arrays', async () => {
  const system = createServiceSystem({
    requestIds: [REQUEST_ID, SECOND_REQUEST_ID],
    timestamps: [REQUEST_TIMESTAMP, SECOND_REQUEST_TIMESTAMP],
  })

  const firstResult = await system.service.runSyncTest()
  const secondResult = await system.service.runSyncTest()
  const [firstRequest, secondRequest] = system.calls.requests

  assertSuccessfulServiceResult(firstResult, REQUEST_ID)
  assertSuccessfulServiceResult(secondResult, SECOND_REQUEST_ID)
  assert.notStrictEqual(firstRequest, secondRequest)
  assert.notStrictEqual(firstRequest.payload, secondRequest.payload)
  assert.notStrictEqual(firstResult, secondResult)
  assert.notStrictEqual(firstResult.syncResponse, secondResult.syncResponse)
  assert.notStrictEqual(
    firstResult.syncResponse.data,
    secondResult.syncResponse.data
  )
  assert.notStrictEqual(
    firstResult.syncResponse.warnings,
    secondResult.syncResponse.warnings
  )
  assert.notStrictEqual(
    firstResult.syncResponse.meta,
    secondResult.syncResponse.meta
  )
  assert.notStrictEqual(
    firstResult.syncResponse.meta.processedBy,
    secondResult.syncResponse.meta.processedBy
  )
  assert.equal(system.calls.generateRequestId, 2)
  assert.equal(system.calls.getCurrentTimestamp, 2)
  assert.equal(system.calls.sendSyncRequest, 2)
})

test('lässt Transportmutationen an Request und Payload scheitern, ohne die Korrelation zu verändern', async () => {
  const mutationResults = []
  const system = createServiceSystem({
    transportImplementation({ syncRequest }) {
      mutationResults.push(
        Reflect.set(syncRequest, 'requestId', SECOND_REQUEST_ID),
        Reflect.defineProperty(syncRequest.payload, 'fixtureInjected', {
          configurable: true,
          enumerable: true,
          value: 'fixture-private-payload-sentinel',
          writable: true,
        })
      )

      return createSyntheticSuccessResponse(syncRequest)
    },
  })
  const result = await system.service.runSyncTest()

  assertSuccessfulServiceResult(result)
  assert.deepEqual(mutationResults, [false, false])
  assert.equal(system.calls.requests[0].requestId, REQUEST_ID)
  assert.deepEqual(Reflect.ownKeys(system.calls.requests[0].payload), [])
  assert.deepEqual(
    validateSyncResponse(result.syncResponse, system.calls.requests[0]),
    { ok: true, errors: [] }
  )
})

test('meldet fehlende und nicht funktionale Transport-Ports vor Generator und Clock als unavailable', async () => {
  const transports = [
    undefined,
    null,
    42,
    'synthetic-port',
    {},
    { sendSyncRequest: null },
    { sendSyncRequest: {} },
    function transportWithoutMethod() {},
  ]

  for (const syncTransport of transports) {
    const calls = { generateRequestId: 0, getCurrentTimestamp: 0 }
    const service = createSyncService({
      syncTransport,
      generateRequestId() {
        calls.generateRequestId += 1
        return REQUEST_ID
      },
      getCurrentTimestamp() {
        calls.getCurrentTimestamp += 1
        return REQUEST_TIMESTAMP
      },
    })
    const result = await service.runSyncTest()

    assertLocalFailure(result, 'unavailable')
    assert.deepEqual(calls, {
      generateRequestId: 0,
      getCurrentTimestamp: 0,
    })
  }
})

test('redigiert werfende Transportmethoden-Zugriffe kontrolliert als unavailable', async () => {
  const privateMarkers = [
    'fixture-transport-getter-private-sentinel',
    'fixture-transport-proxy-private-sentinel',
  ]
  const dependencyCalls = {
    generateRequestId: 0,
    getCurrentTimestamp: 0,
  }
  let getterCalls = 0
  const getterTransport = {}

  Object.defineProperty(getterTransport, 'sendSyncRequest', {
    get() {
      getterCalls += 1
      throw new Error(privateMarkers[0])
    },
  })
  let proxyGetCalls = 0
  const proxyTransport = new Proxy({}, {
    get(_target, propertyName) {
      proxyGetCalls += 1
      assert.equal(propertyName, 'sendSyncRequest')
      throw new Error(privateMarkers[1])
    },
  })

  for (const syncTransport of [getterTransport, proxyTransport]) {
    const service = createSyncService({
      syncTransport,
      generateRequestId() {
        dependencyCalls.generateRequestId += 1
        return REQUEST_ID
      },
      getCurrentTimestamp() {
        dependencyCalls.getCurrentTimestamp += 1
        return REQUEST_TIMESTAMP
      },
    })
    const result = await service.runSyncTest()

    assertLocalFailure(result, 'unavailable')
    assertResultDoesNotContain(result, privateMarkers)
  }

  assert.equal(getterCalls, 1)
  assert.equal(proxyGetCalls, 1)
  assert.deepEqual(dependencyCalls, {
    generateRequestId: 0,
    getCurrentTimestamp: 0,
  })
})

test('redigiert Generator- und Clock-Exceptions nach jeweils genau einer Auswertung ohne Transport', async () => {
  const privateMarkers = [
    'fixture-generator-private-sentinel',
    'fixture-clock-private-sentinel',
  ]
  const systems = [
    createServiceSystem({
      generateRequestIdImplementation() {
        throw new Error(privateMarkers[0])
      },
    }),
    createServiceSystem({
      getCurrentTimestampImplementation() {
        throw new Error(privateMarkers[1])
      },
    }),
  ]

  for (const system of systems) {
    const result = await system.service.runSyncTest()

    assertLocalFailure(result, 'requestBuildFailed')
    assertResultDoesNotContain(result, privateMarkers)
    assert.equal(system.calls.generateRequestId, 1)
    assert.equal(system.calls.getCurrentTimestamp, 1)
    assert.equal(system.calls.sendSyncRequest, 0)
  }
})

test('weist alle nicht primitiven String- und Sondertypen von Generator und Clock ohne Assimilation oder Konvertierung zurück', async () => {
  function createInvalidValueCases(prefix, validString) {
    const thenableCalls = { then: 0 }
    const thenable = {}
    Object.defineProperty(thenable, 'then', {
      get() {
        thenableCalls.then += 1
        throw new Error(`${prefix}-then-private-sentinel`)
      },
    })
    let returnedFunctionCalls = 0
    const returnedFunction = () => {
      returnedFunctionCalls += 1
      return validString
    }
    const coercionProbe = createCoercionProbe(prefix)
    const boxedString = new String(validString)
    boxedString.toString = coercionProbe.value.toString
    boxedString.valueOf = coercionProbe.value.valueOf
    boxedString[Symbol.toPrimitive] = coercionProbe.value[Symbol.toPrimitive]

    return {
      cases: [
        Symbol(`${prefix}-symbol-private-sentinel`),
        7n,
        boxedString,
        Promise.resolve(validString),
        thenable,
        coercionProbe.value,
        [],
        returnedFunction,
      ],
      assertUntouched() {
        assert.equal(thenableCalls.then, 0)
        assert.equal(returnedFunctionCalls, 0)
        assertCoercionProbeWasNotUsed(coercionProbe)
      },
    }
  }

  const generatorValues = createInvalidValueCases(
    'fixture-generator-value',
    REQUEST_ID
  )

  for (const generatedValue of generatorValues.cases) {
    const system = createServiceSystem({
      generateRequestIdImplementation: () => generatedValue,
    })
    const result = await system.service.runSyncTest()

    assertLocalFailure(result, 'requestBuildFailed')
    assert.equal(system.calls.generateRequestId, 1)
    assert.equal(system.calls.getCurrentTimestamp, 1)
    assert.equal(system.calls.sendSyncRequest, 0)
  }
  generatorValues.assertUntouched()

  const clockValues = createInvalidValueCases(
    'fixture-clock-value',
    REQUEST_TIMESTAMP
  )

  for (const clockValue of clockValues.cases) {
    const system = createServiceSystem({
      getCurrentTimestampImplementation: () => clockValue,
    })
    const result = await system.service.runSyncTest()

    assertLocalFailure(result, 'requestBuildFailed')
    assert.equal(system.calls.generateRequestId, 1)
    assert.equal(system.calls.getCurrentTimestamp, 1)
    assert.equal(system.calls.sendSyncRequest, 0)
  }
  clockValues.assertUntouched()
})

test('lehnt ungültige IDs und nichtkanonische Zeitstempel vor dem Transport ab und spiegelt sie nicht', async () => {
  const invalidRequestIds = [
    'id_48be0e81-2ace-46df-b713-3d580f313b71',
    'req_',
    'req_invalid/value',
    ' req_private-id-sentinel ',
    `req_${'a'.repeat(61)}`,
  ]

  for (const generatedRequestId of invalidRequestIds) {
    const system = createServiceSystem({ requestIds: [generatedRequestId] })
    const result = await system.service.runSyncTest()

    assertLocalFailure(result, 'requestBuildFailed')
    assertResultDoesNotContain(result, [generatedRequestId])
    assert.equal(system.calls.generateRequestId, 1)
    assert.equal(system.calls.getCurrentTimestamp, 1)
    assert.equal(system.calls.sendSyncRequest, 0)
  }

  const invalidTimestamps = [
    '2031-04-05T10:20:30Z',
    '2031-04-05T12:20:30.000+02:00',
    '2031-4-5T10:20:30.000Z',
    '2031-02-29T10:20:30.000Z',
    'fixture-private-timestamp-sentinel',
  ]

  for (const timestamp of invalidTimestamps) {
    const system = createServiceSystem({ timestamps: [timestamp] })
    const result = await system.service.runSyncTest()

    assertLocalFailure(result, 'requestBuildFailed')
    assertResultDoesNotContain(result, [timestamp])
    assert.equal(system.calls.generateRequestId, 1)
    assert.equal(system.calls.getCurrentTimestamp, 1)
    assert.equal(system.calls.sendSyncRequest, 0)
  }
})

test('verwendet im echten Defaultpfad exakt die empfangene UUID mit Crypto-Receiver und UTC-Clock', { concurrency: false }, async () => {
  const originalCryptoDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    'crypto'
  )
  const originalMathRandomDescriptor = Object.getOwnPropertyDescriptor(
    Math,
    'random'
  )
  const uuidValues = [
    REQUEST_ID.slice('req_'.length),
    SECOND_REQUEST_ID.slice('req_'.length),
  ]
  const capturedRequests = []
  const cryptoReceivers = []
  const results = []
  let cryptoGetterCalls = 0
  let mathRandomCalls = 0
  let randomUuidGetterCalls = 0
  let randomUuidMethodCalls = 0
  let before
  let after

  const cryptoProvider = {}
  function randomUUID() {
    const uuid = uuidValues[randomUuidMethodCalls]

    randomUuidMethodCalls += 1
    cryptoReceivers.push(this)
    return uuid
  }

  Object.defineProperty(cryptoProvider, 'randomUUID', {
    configurable: true,
    enumerable: false,
    get() {
      randomUuidGetterCalls += 1
      return randomUUID
    },
  })

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
        throw new Error('fixture-default-math-random-private-sentinel')
      },
    })

    const syncTransport = {
      sendSyncRequest(syncRequest) {
        capturedRequests.push(syncRequest)
        return createSyntheticSuccessResponse(syncRequest)
      },
    }
    const service = createSyncService({ syncTransport })

    before = Date.now()
    results.push(await service.runSyncTest())
    assert.equal(randomUuidMethodCalls, 1)
    results.push(await service.runSyncTest())
    assert.equal(randomUuidMethodCalls, 2)
    after = Date.now()
  } finally {
    restoreOwnProperty(globalThis, 'crypto', originalCryptoDescriptor)
    restoreOwnProperty(Math, 'random', originalMathRandomDescriptor)
  }

  assert.deepEqual(
    Object.getOwnPropertyDescriptor(globalThis, 'crypto'),
    originalCryptoDescriptor
  )
  assert.deepEqual(
    Object.getOwnPropertyDescriptor(Math, 'random'),
    originalMathRandomDescriptor
  )
  assert.equal(cryptoGetterCalls, 2)
  assert.equal(randomUuidGetterCalls, 2)
  assert.equal(randomUuidMethodCalls, 2)
  assert.equal(mathRandomCalls, 0)
  assert.deepEqual(cryptoReceivers, [cryptoProvider, cryptoProvider])
  assert.equal(capturedRequests.length, 2)

  for (const [index, capturedRequest] of capturedRequests.entries()) {
    assertSuccessfulServiceResult(results[index], capturedRequest.requestId)
    assert.equal(capturedRequest.requestId, `req_${uuidValues[index]}`)
    assert.match(
      capturedRequest.timestamp,
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    )
    assert.ok(Date.parse(capturedRequest.timestamp) >= before)
    assert.ok(Date.parse(capturedRequest.timestamp) <= after)
    assert.deepEqual(
      validateSyncRequest(capturedRequest, capturedRequest.timestamp),
      { ok: true, errors: [] }
    )
  }
})

test('weist sämtliche Ausfälle des Defaultgenerators redigiert und ohne schwächeren Fallback zurück', { concurrency: false }, async (t) => {
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
  const consoleMethods = ['log', 'warn', 'error', 'info', 'debug', 'trace']
  const originalConsoleDescriptors = new Map(
    consoleMethods.map((methodName) => [
      methodName,
      Object.getOwnPropertyDescriptor(console, methodName),
    ])
  )
  const consoleSpies = consoleMethods.map((methodName) => (
    t.mock.method(console, methodName, () => {})
  ))
  const privateMarkers = [
    'fixture-default-crypto-getter-private-sentinel',
    'fixture-default-random-uuid-getter-private-sentinel',
    'fixture-default-random-uuid-non-function-private-sentinel',
    'fixture-default-random-uuid-call-private-sentinel',
    'fixture-default-random-uuid-object-private-sentinel',
    'fixture-default-invalid/uuid-private-sentinel',
  ]
  const nonPrimitiveProbe = createCoercionProbe(
    'fixture-default-random-uuid-object'
  )
  const trackers = {
    cryptoGetter: 0,
    randomUuidGetter: 0,
    throwingMethod: 0,
    nonPrimitiveMethod: 0,
    invalidStringMethod: 0,
    receivers: [],
  }
  const throwingRandomUuidAccessProvider = {}
  const throwingMethodProvider = {
    randomUUID() {
      trackers.throwingMethod += 1
      trackers.receivers.push(this)
      throw new Error(privateMarkers[3])
    },
  }
  const nonPrimitiveProvider = {
    randomUUID() {
      trackers.nonPrimitiveMethod += 1
      trackers.receivers.push(this)
      return nonPrimitiveProbe.value
    },
  }
  const invalidStringProvider = {
    randomUUID() {
      trackers.invalidStringMethod += 1
      trackers.receivers.push(this)
      return privateMarkers[5]
    },
  }
  let mathRandomCalls = 0
  let dateNowCalls = 0
  let consoleCallCount
  const observations = []

  Object.defineProperty(
    throwingRandomUuidAccessProvider,
    'randomUUID',
    {
      configurable: true,
      enumerable: true,
      get() {
        trackers.randomUuidGetter += 1
        throw new Error(privateMarkers[1])
      },
    }
  )

  const cases = [
    {
      name: 'cryptoUnavailable',
      descriptor: {
        configurable: true,
        enumerable: originalCryptoDescriptor?.enumerable ?? true,
        value: undefined,
        writable: true,
      },
    },
    {
      name: 'randomUuidUnavailable',
      descriptor: {
        configurable: true,
        enumerable: originalCryptoDescriptor?.enumerable ?? true,
        value: {},
        writable: true,
      },
    },
    {
      name: 'cryptoGetterThrows',
      descriptor: {
        configurable: true,
        enumerable: originalCryptoDescriptor?.enumerable ?? true,
        get() {
          trackers.cryptoGetter += 1
          throw new Error(privateMarkers[0])
        },
      },
    },
    {
      name: 'randomUuidGetterThrows',
      descriptor: {
        configurable: true,
        enumerable: originalCryptoDescriptor?.enumerable ?? true,
        value: throwingRandomUuidAccessProvider,
        writable: true,
      },
    },
    {
      name: 'randomUuidNotFunctional',
      descriptor: {
        configurable: true,
        enumerable: originalCryptoDescriptor?.enumerable ?? true,
        value: { randomUUID: privateMarkers[2] },
        writable: true,
      },
    },
    {
      name: 'randomUuidMethodThrows',
      descriptor: {
        configurable: true,
        enumerable: originalCryptoDescriptor?.enumerable ?? true,
        value: throwingMethodProvider,
        writable: true,
      },
    },
    {
      name: 'randomUuidReturnsNonPrimitive',
      descriptor: {
        configurable: true,
        enumerable: originalCryptoDescriptor?.enumerable ?? true,
        value: nonPrimitiveProvider,
        writable: true,
      },
    },
    {
      name: 'randomUuidReturnsInvalidString',
      descriptor: {
        configurable: true,
        enumerable: originalCryptoDescriptor?.enumerable ?? true,
        value: invalidStringProvider,
        writable: true,
      },
    },
  ]

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
        return Reflect.apply(originalDateNowDescriptor.value, Date, [])
      },
    })

    for (const failureCase of cases) {
      Object.defineProperty(
        globalThis,
        'crypto',
        failureCase.descriptor
      )

      const calls = {
        clock: 0,
        methodResolution: 0,
        port: 0,
      }
      const syncTransport = {}
      Object.defineProperty(syncTransport, 'sendSyncRequest', {
        configurable: true,
        enumerable: true,
        get() {
          calls.methodResolution += 1
          return function sendSyncRequest(syncRequest) {
            calls.port += 1
            return createSyntheticSuccessResponse(syncRequest)
          }
        },
      })
      const service = createSyncService({
        syncTransport,
        getCurrentTimestamp() {
          calls.clock += 1
          return REQUEST_TIMESTAMP
        },
      })

      observations.push({
        calls,
        name: failureCase.name,
        result: await service.runSyncTest(),
      })
    }

    consoleCallCount = consoleSpies.reduce(
      (callCount, consoleSpy) => callCount + consoleSpy.mock.callCount(),
      0
    )
  } finally {
    restoreOwnProperty(globalThis, 'crypto', originalCryptoDescriptor)
    restoreOwnProperty(Math, 'random', originalMathRandomDescriptor)
    restoreOwnProperty(Date, 'now', originalDateNowDescriptor)
    t.mock.restoreAll()
  }

  assert.deepEqual(
    Object.getOwnPropertyDescriptor(globalThis, 'crypto'),
    originalCryptoDescriptor
  )
  assert.deepEqual(
    Object.getOwnPropertyDescriptor(Math, 'random'),
    originalMathRandomDescriptor
  )
  assert.deepEqual(
    Object.getOwnPropertyDescriptor(Date, 'now'),
    originalDateNowDescriptor
  )
  for (const methodName of consoleMethods) {
    assert.deepEqual(
      Object.getOwnPropertyDescriptor(console, methodName),
      originalConsoleDescriptors.get(methodName)
    )
  }
  assert.equal(consoleCallCount, 0)
  assert.equal(mathRandomCalls, 0)
  assert.equal(dateNowCalls, 0)
  assert.equal(trackers.cryptoGetter, 1)
  assert.equal(trackers.randomUuidGetter, 1)
  assert.equal(trackers.throwingMethod, 1)
  assert.equal(trackers.nonPrimitiveMethod, 1)
  assert.equal(trackers.invalidStringMethod, 1)
  assert.deepEqual(trackers.receivers, [
    throwingMethodProvider,
    nonPrimitiveProvider,
    invalidStringProvider,
  ])
  assertCoercionProbeWasNotUsed(nonPrimitiveProbe)

  for (const observation of observations) {
    assertLocalFailure(observation.result, 'requestBuildFailed')
    assertResultDoesNotContain(observation.result, privateMarkers)
    assert.deepEqual(observation.calls, {
      clock: 1,
      methodResolution: 1,
      port: 0,
    }, observation.name)
  }
})

test('akzeptiert synchrone Werte, Promises und regulär aufgelöste Thenables bei stets asynchroner API', async () => {
  let thenCalls = 0
  const implementations = [
    ({ syncRequest }) => createSyntheticSuccessResponse(syncRequest),
    ({ syncRequest }) => Promise.resolve(
      createSyntheticSuccessResponse(syncRequest)
    ),
    ({ syncRequest }) => ({
      then(resolve) {
        thenCalls += 1
        resolve(createSyntheticSuccessResponse(syncRequest))
      },
    }),
  ]

  for (const transportImplementation of implementations) {
    const system = createServiceSystem({ transportImplementation })
    const pendingResult = system.service.runSyncTest()

    assert.equal(pendingResult instanceof Promise, true)

    const result = await pendingResult

    assertSuccessfulServiceResult(result)
    assert.equal(system.calls.sendSyncRequest, 1)
  }

  assert.equal(thenCalls, 1)
})

test('redigiert synchrones Werfen, Promise-Rejection und beobachtbare Thenable-Fehler ohne zweiten Transportversuch', async () => {
  const privateMarkers = [
    'fixture-sync-throw-private-sentinel',
    'fixture-promise-rejection-private-sentinel',
    'fixture-then-getter-private-sentinel',
    'fixture-then-rejection-private-sentinel',
  ]
  let thenGetterCalls = 0
  let rejectingThenCalls = 0
  const throwingThenable = {}
  Object.defineProperty(throwingThenable, 'then', {
    get() {
      thenGetterCalls += 1
      throw new Error(privateMarkers[2])
    },
  })
  const cases = [
    () => {
      throw new Error(privateMarkers[0])
    },
    () => Promise.reject(new Error(privateMarkers[1])),
    () => throwingThenable,
    () => ({
      then(_resolve, reject) {
        rejectingThenCalls += 1
        reject(new Error(privateMarkers[3]))
      },
    }),
  ]

  for (const transportImplementation of cases) {
    const system = createServiceSystem({ transportImplementation })
    const result = await system.service.runSyncTest()

    assertLocalFailure(result, 'transportFailed', REQUEST_ID)
    assertResultDoesNotContain(result, privateMarkers)
    assert.equal(system.calls.generateRequestId, 1)
    assert.equal(system.calls.getCurrentTimestamp, 1)
    assert.equal(system.calls.sendSyncRequest, 1)
  }

  assert.equal(thenGetterCalls, 1)
  assert.equal(rejectingThenCalls, 1)
})

test('protokolliert fremde sensible Fehlerwerte weder über Console noch im lokalen Result', { concurrency: false }, async (t) => {
  const consoleMethods = ['log', 'warn', 'error', 'info', 'debug', 'trace']
  const consoleSpies = consoleMethods.map((methodName) => (
    t.mock.method(console, methodName, () => {})
  ))
  const privateMarkers = [
    'fixture-console-generator-private-sentinel',
    'fixture-console-transport-private-sentinel',
    'fixture-console-response-private-sentinel',
  ]
  const results = []
  let consoleCallCount = null

  try {
    const generatorSystem = createServiceSystem({
      generateRequestIdImplementation() {
        throw new Error(privateMarkers[0])
      },
    })
    results.push(await generatorSystem.service.runSyncTest())

    const transportSystem = createServiceSystem({
      transportImplementation() {
        return Promise.reject(new Error(privateMarkers[1]))
      },
    })
    results.push(await transportSystem.service.runSyncTest())

    const responseSystem = createServiceSystem({
      transportImplementation({ syncRequest }) {
        return {
          ...createSyntheticSuccessResponse(syncRequest),
          fixturePrivateField: privateMarkers[2],
        }
      },
    })
    results.push(await responseSystem.service.runSyncTest())

    consoleCallCount = consoleSpies.reduce(
      (callCount, consoleSpy) => callCount + consoleSpy.mock.callCount(),
      0
    )
  } finally {
    t.mock.restoreAll()
  }

  assert.equal(consoleCallCount, 0)
  assertLocalFailure(results[0], 'requestBuildFailed')
  assertLocalFailure(results[1], 'transportFailed', REQUEST_ID)
  assertLocalFailure(results[2], 'invalidResponse', REQUEST_ID)
  results.forEach((result) => {
    assertResultDoesNotContain(result, privateMarkers)
  })
})

test('liefert eine vollständig korrelierte Erfolgsresponse als defensiven tief eingefrorenen Snapshot', async () => {
  const system = await runWithTransportResponse(
    (syncRequest) => createSyntheticSuccessResponse(syncRequest)
  )
  const transportRequest = system.calls.requests[0]

  assertSuccessfulServiceResult(system.result)
  assert.deepEqual(system.result.syncResponse, system.originalResponse)
  assert.notStrictEqual(system.result.syncResponse, system.originalResponse)
  assert.notStrictEqual(
    system.result.syncResponse.data,
    system.originalResponse.data
  )
  assert.notStrictEqual(
    system.result.syncResponse.warnings,
    system.originalResponse.warnings
  )
  assert.notStrictEqual(
    system.result.syncResponse.meta,
    system.originalResponse.meta
  )
  assert.notStrictEqual(
    system.result.syncResponse.meta.processedBy,
    system.originalResponse.meta.processedBy
  )
  assert.deepEqual(
    validateSyncResponse(system.result.syncResponse, transportRequest),
    { ok: true, errors: [] }
  )
})

test('erhält jede gültige normale Contract-Fehlerresponse bei äußerem ok true', async () => {
  for (const code of [
    'VALIDATION_ERROR',
    'SERVICE_UNAVAILABLE',
    'INTERNAL_ERROR',
  ]) {
    const system = await runWithTransportResponse(
      (syncRequest) => createSyntheticNormalErrorResponse(syncRequest, code)
    )

    assertSuccessfulServiceResult(system.result)
    assert.equal(system.result.syncResponse.success, false)
    assert.equal(system.result.syncResponse.data, null)
    assert.equal(system.result.syncResponse.error.code, code)
    assert.deepEqual(system.result.syncResponse, system.originalResponse)
    assert.notStrictEqual(
      system.result.syncResponse.error,
      system.originalResponse.error
    )
    assert.notStrictEqual(
      system.result.syncResponse.error.details,
      system.originalResponse.error.details
    )
    assert.deepEqual(
      validateSyncResponse(
        system.result.syncResponse,
        system.calls.requests[0]
      ),
      { ok: true, errors: [] }
    )
  }
})

test('weist falsche Version, Aktion und Request-ID fail closed mit der ausgehenden ID zurück', async () => {
  const cases = [
    { version: '2.0' },
    { action: 'fixtureUnexpectedAction' },
    { requestId: SECOND_REQUEST_ID },
  ]

  for (const overrides of cases) {
    const system = await runWithTransportResponse(
      (syncRequest) => createSyntheticSuccessResponse(syncRequest, overrides)
    )

    assertLocalFailure(system.result, 'invalidResponse', REQUEST_ID)
    assertResultDoesNotContain(system.result, Object.values(overrides))
    assert.equal(system.calls.sendSyncRequest, 1)
  }
})

test('weist fremde Handler, Verarbeitungsketten und Datenherkünfte ohne Reparatur zurück', async () => {
  const cases = [
    (syncRequest) => createSyntheticSuccessResponse(syncRequest, {
      handledBy: 'TestAgent',
    }),
    (syncRequest) => createSyntheticSuccessResponse(syncRequest, {
      data: { status: 'ok', dataOrigin: 'private' },
    }),
    (syncRequest) => createSyntheticSuccessResponse(syncRequest, {
      meta: { durationMs: 7, processedBy: [] },
    }),
    (syncRequest) => createSyntheticSuccessResponse(syncRequest, {
      meta: { durationMs: 7, processedBy: ['TestAgent'] },
    }),
    (syncRequest) => createSyntheticSuccessResponse(syncRequest, {
      meta: {
        durationMs: 7,
        processedBy: ['SyncAgent', 'TestAgent'],
      },
    }),
  ]

  for (const createResponse of cases) {
    const system = await runWithTransportResponse(createResponse)

    assertLocalFailure(system.result, 'invalidResponse', REQUEST_ID)
  }
})

test('fordert alle zehn eigenen Response-Felder und lehnt zusätzliche String- und Symbolfelder ab', async () => {
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
    const system = await runWithTransportResponse((syncRequest) => {
      const response = createSyntheticSuccessResponse(syncRequest)
      delete response[propertyName]
      return response
    })

    assertLocalFailure(system.result, 'invalidResponse', REQUEST_ID)
  }

  const privateMarker = 'fixture-extra-response-private-sentinel'
  const extraStringSystem = await runWithTransportResponse((syncRequest) => ({
    ...createSyntheticSuccessResponse(syncRequest),
    fixturePrivateField: privateMarker,
  }))
  const extraSymbolSystem = await runWithTransportResponse((syncRequest) => {
    const response = createSyntheticSuccessResponse(syncRequest)
    response[Symbol(privateMarker)] = privateMarker
    return response
  })

  for (const system of [extraStringSystem, extraSymbolSystem]) {
    assertLocalFailure(system.result, 'invalidResponse', REQUEST_ID)
    assertResultDoesNotContain(system.result, [privateMarker])
  }
})

test('liest bekannte und unbekannte eigene Response-Accessors nicht als Werte', async () => {
  const privateMarker = 'fixture-response-accessor-private-sentinel'
  let knownGetterCalls = 0
  let unknownGetterCalls = 0
  const knownAccessorSystem = await runWithTransportResponse((syncRequest) => {
    const response = createSyntheticSuccessResponse(syncRequest)
    Object.defineProperty(response, 'success', {
      configurable: true,
      enumerable: true,
      get() {
        knownGetterCalls += 1
        throw new Error(privateMarker)
      },
    })
    return response
  })
  const unknownAccessorSystem = await runWithTransportResponse((syncRequest) => {
    const response = createSyntheticSuccessResponse(syncRequest)
    Object.defineProperty(response, 'fixturePrivateField', {
      configurable: true,
      enumerable: true,
      get() {
        unknownGetterCalls += 1
        throw new Error(privateMarker)
      },
    })
    return response
  })
  const nonEnumerableSystem = await runWithTransportResponse((syncRequest) => {
    const response = createSyntheticSuccessResponse(syncRequest)
    Object.defineProperty(response, 'success', {
      configurable: true,
      enumerable: false,
      value: true,
      writable: true,
    })
    return response
  })

  for (const system of [
    knownAccessorSystem,
    unknownAccessorSystem,
    nonEnumerableSystem,
  ]) {
    assertLocalFailure(system.result, 'invalidResponse', REQUEST_ID)
    assertResultDoesNotContain(system.result, [privateMarker])
  }
  assert.equal(knownGetterCalls, 0)
  assert.equal(unknownGetterCalls, 0)
})

test('lehnt verschachtelte Accessors, Zusatzfelder und Symbole ab, ohne Getter auszuführen', async () => {
  const privateMarker = 'fixture-nested-response-private-sentinel'
  let getterCalls = 0
  const responseFactories = [
    (syncRequest) => {
      const response = createSyntheticSuccessResponse(syncRequest)
      Object.defineProperty(response.data, 'status', {
        configurable: true,
        enumerable: true,
        get() {
          getterCalls += 1
          throw new Error(privateMarker)
        },
      })
      return response
    },
    (syncRequest) => {
      const response = createSyntheticNormalErrorResponse(
        syncRequest,
        'INTERNAL_ERROR'
      )
      Object.defineProperty(response.error, 'message', {
        configurable: true,
        enumerable: true,
        get() {
          getterCalls += 1
          throw new Error(privateMarker)
        },
      })
      return response
    },
    (syncRequest) => {
      const response = createSyntheticSuccessResponse(syncRequest)
      Object.defineProperty(response.meta, 'durationMs', {
        configurable: true,
        enumerable: true,
        get() {
          getterCalls += 1
          throw new Error(privateMarker)
        },
      })
      return response
    },
    (syncRequest) => {
      const response = createSyntheticSuccessResponse(syncRequest)
      Object.defineProperty(response.meta.processedBy, '0', {
        configurable: true,
        enumerable: true,
        get() {
          getterCalls += 1
          throw new Error(privateMarker)
        },
      })
      return response
    },
    (syncRequest) => {
      const response = createSyntheticSuccessResponse(syncRequest)
      response.data.fixturePrivateField = privateMarker
      return response
    },
    (syncRequest) => {
      const response = createSyntheticNormalErrorResponse(
        syncRequest,
        'INTERNAL_ERROR'
      )
      response.error.fixturePrivateField = privateMarker
      return response
    },
    (syncRequest) => {
      const response = createSyntheticSuccessResponse(syncRequest)
      response.meta[Symbol(privateMarker)] = privateMarker
      return response
    },
  ]

  for (const createResponse of responseFactories) {
    const system = await runWithTransportResponse(createResponse)

    assertLocalFailure(system.result, 'invalidResponse', REQUEST_ID)
    assertResultDoesNotContain(system.result, [privateMarker])
  }
  assert.equal(getterCalls, 0)
})

test('weist sparse, erweiterte, symbolische und accessor-basierte Response-Arrays kontrolliert zurück', async () => {
  const privateMarker = 'fixture-response-array-private-sentinel'
  let positionGetterCalls = 0
  const responseFactories = [
    (syncRequest) => {
      const response = createSyntheticSuccessResponse(syncRequest)
      response.warnings.fixturePrivateField = privateMarker
      return response
    },
    (syncRequest) => {
      const response = createSyntheticSuccessResponse(syncRequest)
      response.warnings[Symbol(privateMarker)] = privateMarker
      return response
    },
    (syncRequest) => {
      const response = createSyntheticSuccessResponse(syncRequest)
      response.warnings.length = 1
      return response
    },
    (syncRequest) => {
      const response = createSyntheticSuccessResponse(syncRequest)
      response.meta.processedBy = new Array(1)
      return response
    },
    (syncRequest) => {
      const response = createSyntheticSuccessResponse(syncRequest)
      response.meta.processedBy[Symbol(privateMarker)] = privateMarker
      return response
    },
    (syncRequest) => {
      const response = createSyntheticSuccessResponse(syncRequest)
      Object.defineProperty(response.meta.processedBy, '0', {
        configurable: true,
        enumerable: true,
        get() {
          positionGetterCalls += 1
          throw new Error(privateMarker)
        },
      })
      return response
    },
    (syncRequest) => {
      const response = createSyntheticNormalErrorResponse(
        syncRequest,
        'INTERNAL_ERROR'
      )
      response.error.details.fixturePrivateField = privateMarker
      return response
    },
    (syncRequest) => {
      const response = createSyntheticNormalErrorResponse(
        syncRequest,
        'INTERNAL_ERROR'
      )
      response.error.details[Symbol(privateMarker)] = privateMarker
      return response
    },
  ]

  for (const createResponse of responseFactories) {
    const system = await runWithTransportResponse(createResponse)

    assertLocalFailure(system.result, 'invalidResponse', REQUEST_ID)
    assertResultDoesNotContain(system.result, [privateMarker])
  }
  assert.equal(positionGetterCalls, 0)
})

test('weist primitive, nullische, funktionale und nicht unterstützte Record-Responses zurück', async () => {
  const customPrototypeResponse = Object.assign(
    Object.create({ inheritedFixture: true }),
    createSyntheticSuccessResponse(createExpectedRequest())
  )
  const invalidResponses = [
    undefined,
    null,
    false,
    'synthetic-response',
    17,
    17n,
    Symbol('fixture-response-symbol-private-sentinel'),
    () => createSyntheticSuccessResponse(createExpectedRequest()),
    [],
    new Date(RESPONSE_TIMESTAMP),
    new Map(),
    new Set(),
    customPrototypeResponse,
  ]

  for (const invalidResponse of invalidResponses) {
    const system = createServiceSystem({
      transportImplementation: () => invalidResponse,
    })
    const result = await system.service.runSyncTest()

    assertLocalFailure(result, 'invalidResponse', REQUEST_ID)
    assert.equal(system.calls.sendSyncRequest, 1)
  }
})

test('weist ungültige Response-Zeitstempel, Dauern und Vertragsarrays vollständig zurück', async () => {
  const invalidTimestamps = [
    '2031-04-05T10:20:30Z',
    '2031-04-05T12:20:30.000+02:00',
    '2031-02-29T10:20:30.000Z',
    new Date(RESPONSE_TIMESTAMP),
  ]

  for (const timestamp of invalidTimestamps) {
    const system = await runWithTransportResponse(
      (syncRequest) => createSyntheticSuccessResponse(syncRequest, {
        timestamp,
      })
    )

    assertLocalFailure(system.result, 'invalidResponse', REQUEST_ID)
  }

  const invalidDurations = [
    -1,
    0.5,
    SYNC_CONTRACT_MAX_DURATION_MS + 1,
    Number.MAX_SAFE_INTEGER + 1,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    '7',
  ]

  for (const durationMs of invalidDurations) {
    const system = await runWithTransportResponse(
      (syncRequest) => createSyntheticSuccessResponse(syncRequest, {
        meta: {
          durationMs,
          processedBy: [SYNC_CONTRACT_HANDLERS[0]],
        },
      })
    )

    assertLocalFailure(system.result, 'invalidResponse', REQUEST_ID)
  }

  const internalErrorProfile =
    SYNC_CONTRACT_RESPONSE_ERROR_PROFILES.INTERNAL_ERROR
  const arraySystems = [
    await runWithTransportResponse(
      (syncRequest) => createSyntheticSuccessResponse(syncRequest, {
        warnings: ['fixture-warning-private-sentinel'],
      })
    ),
    await runWithTransportResponse(
      (syncRequest) => createSyntheticNormalErrorResponse(
        syncRequest,
        'INTERNAL_ERROR',
        {
          error: {
            code: internalErrorProfile.code,
            message: internalErrorProfile.message,
            retryable: internalErrorProfile.retryable,
            details: ['fixture-detail-private-sentinel'],
          },
        }
      )
    ),
    await runWithTransportResponse((syncRequest) => {
      const processedBy = [SYNC_CONTRACT_HANDLERS[0]]
      Object.setPrototypeOf(processedBy, Object.create(Array.prototype))
      return createSyntheticSuccessResponse(syncRequest, {
        meta: { durationMs: 7, processedBy },
      })
    }),
  ]

  for (const system of arraySystems) {
    assertLocalFailure(system.result, 'invalidResponse', REQUEST_ID)
    assertResultDoesNotContain(system.result, [
      'fixture-warning-private-sentinel',
      'fixture-detail-private-sentinel',
    ])
  }
})

test('behandelt das getrennte frühe Gateway-Fehlerprofil ausschließlich als invalidResponse', async () => {
  const system = await runWithTransportResponse(
    () => createSyntheticGatewayErrorResponse()
  )

  assertLocalFailure(system.result, 'invalidResponse', REQUEST_ID)
  assert.equal(system.result.syncResponse, null)
  assert.equal(system.calls.sendSyncRequest, 1)
})

test('erzwingt success-, data- und error-Konsistenz sowie statische normale Fehlerprofile', async () => {
  const unavailableProfile =
    SYNC_CONTRACT_RESPONSE_ERROR_PROFILES.SERVICE_UNAVAILABLE
  const cases = [
    (syncRequest) => createSyntheticSuccessResponse(syncRequest, {
      success: 'true',
    }),
    (syncRequest) => createSyntheticSuccessResponse(syncRequest, {
      data: null,
    }),
    (syncRequest) => createSyntheticSuccessResponse(syncRequest, {
      error: {
        code: unavailableProfile.code,
        message: unavailableProfile.message,
        retryable: unavailableProfile.retryable,
        details: [],
      },
    }),
    (syncRequest) => createSyntheticNormalErrorResponse(
      syncRequest,
      'SERVICE_UNAVAILABLE',
      { data: { status: 'ok', dataOrigin: 'synthetic' } }
    ),
    (syncRequest) => createSyntheticNormalErrorResponse(
      syncRequest,
      'SERVICE_UNAVAILABLE',
      { error: null }
    ),
    (syncRequest) => createSyntheticNormalErrorResponse(
      syncRequest,
      'SERVICE_UNAVAILABLE',
      {
        error: {
          code: 'FORBIDDEN',
          message: SYNC_CONTRACT_RESPONSE_ERROR_PROFILES.FORBIDDEN.message,
          retryable: false,
          details: [],
        },
      }
    ),
    (syncRequest) => createSyntheticNormalErrorResponse(
      syncRequest,
      'SERVICE_UNAVAILABLE',
      {
        error: {
          code: unavailableProfile.code,
          message: 'fixture-changed-error-message-private-sentinel',
          retryable: unavailableProfile.retryable,
          details: [],
        },
      }
    ),
    (syncRequest) => createSyntheticNormalErrorResponse(
      syncRequest,
      'SERVICE_UNAVAILABLE',
      {
        error: {
          code: unavailableProfile.code,
          message: unavailableProfile.message,
          retryable: false,
          details: [],
        },
      }
    ),
  ]

  for (const createResponse of cases) {
    const system = await runWithTransportResponse(createResponse)

    assertLocalFailure(system.result, 'invalidResponse', REQUEST_ID)
    assertResultDoesNotContain(system.result, [
      'fixture-changed-error-message-private-sentinel',
    ])
  }
})

test('weist fehlende verschachtelte Pflichtfelder und ungeeignete verschachtelte Prototypen zurück', async () => {
  const responseFactories = [
    (syncRequest) => {
      const response = createSyntheticSuccessResponse(syncRequest)
      delete response.data.status
      return response
    },
    (syncRequest) => {
      const response = createSyntheticSuccessResponse(syncRequest)
      delete response.meta.processedBy
      return response
    },
    (syncRequest) => {
      const response = createSyntheticNormalErrorResponse(
        syncRequest,
        'INTERNAL_ERROR'
      )
      delete response.error.code
      return response
    },
    (syncRequest) => {
      const response = createSyntheticSuccessResponse(syncRequest)
      response.data = Object.assign(
        Object.create({ inheritedFixture: true }),
        response.data
      )
      return response
    },
    (syncRequest) => {
      const response = createSyntheticSuccessResponse(syncRequest)
      response.meta = Object.assign(
        Object.create({ inheritedFixture: true }),
        response.meta
      )
      return response
    },
  ]

  for (const createResponse of responseFactories) {
    const system = await runWithTransportResponse(createResponse)

    assertLocalFailure(system.result, 'invalidResponse', REQUEST_ID)
  }
})

test('bewahrt die gültige originale Erfolgsresponse descriptor- und identitätsgetreu vor Mutation', async () => {
  const system = await runWithSnapshottedTransportResponse(
    (syncRequest) => createSyntheticSuccessResponse(syncRequest)
  )
  const serviceSnapshot = captureOwnDataDescriptorGraph(
    system.result.syncResponse
  )

  assertSuccessfulServiceResult(system.result)
  assertOwnDataDescriptorGraphUnchanged(system.originalResponseSnapshot)
  assertOwnDataGraphIsUnfrozen(system.originalResponse)
  assertOwnDataGraphsAreDisjoint(
    system.originalResponse,
    system.result.syncResponse
  )

  system.originalResponse.timestamp = THIRD_REQUEST_TIMESTAMP
  system.originalResponse.data.status = 'fixture-mutated-status'
  system.originalResponse.warnings.push('fixture-mutated-warning')
  system.originalResponse.meta.durationMs = 999
  system.originalResponse.meta.processedBy[0] = 'TestAgent'
  system.originalResponse.fixtureLateField = true

  assertOwnDataDescriptorGraphUnchanged(serviceSnapshot)
  assert.deepEqual(
    validateSyncResponse(
      system.result.syncResponse,
      system.calls.requests[0]
    ),
    { ok: true, errors: [] }
  )
})

test('bewahrt die gültige originale Contract-Fehlerresponse und entkoppelt den Fehlersnapshot vollständig', async () => {
  const system = await runWithSnapshottedTransportResponse(
    (syncRequest) => createSyntheticNormalErrorResponse(syncRequest)
  )
  const serviceSnapshot = captureOwnDataDescriptorGraph(
    system.result.syncResponse
  )

  assertSuccessfulServiceResult(system.result)
  assert.equal(system.result.syncResponse.success, false)
  assertOwnDataDescriptorGraphUnchanged(system.originalResponseSnapshot)
  assertOwnDataGraphIsUnfrozen(system.originalResponse)
  assertOwnDataGraphsAreDisjoint(
    system.originalResponse,
    system.result.syncResponse
  )

  system.originalResponse.error.code = 'fixture-mutated-error-code'
  system.originalResponse.error.details.push('fixture-mutated-detail')
  system.originalResponse.warnings.push('fixture-mutated-warning')
  system.originalResponse.meta.durationMs = 999
  system.originalResponse.meta.processedBy[0] = 'TestAgent'
  system.originalResponse.fixtureLateField = true

  assertOwnDataDescriptorGraphUnchanged(serviceSnapshot)
  assert.deepEqual(
    validateSyncResponse(
      system.result.syncResponse,
      system.calls.requests[0]
    ),
    { ok: true, errors: [] }
  )
})

test('bewahrt auch eine gewöhnliche ungültige Transportresponse ohne Normalisierung oder Löschung', async () => {
  const invalidStatus = ' fixture-invalid-status '
  const invalidFieldValue = 'fixture-invalid-field-private-sentinel'
  const system = await runWithSnapshottedTransportResponse((syncRequest) => {
    const response = createSyntheticSuccessResponse(syncRequest)

    response.data.status = invalidStatus
    response.fixtureUnexpectedField = invalidFieldValue
    return response
  })

  assertLocalFailure(system.result, 'invalidResponse', REQUEST_ID)
  assertResultDoesNotContain(system.result, [
    invalidStatus,
    invalidFieldValue,
  ])
  assertOwnDataDescriptorGraphUnchanged(system.originalResponseSnapshot)
  assertOwnDataGraphIsUnfrozen(system.originalResponse)
  assert.equal(system.originalResponse.data.status, invalidStatus)
  assert.equal(
    system.originalResponse.fixtureUnexpectedField,
    invalidFieldValue
  )
  assert.equal(
    Object.hasOwn(system.originalResponse, 'fixtureUnexpectedField'),
    true
  )

  const replacementProbe = {
    data: { status: 'fixture-value-equal-status' },
  }
  const replacementSnapshot = captureOwnDataDescriptorGraph(replacementProbe)
  replacementProbe.data = { status: 'fixture-value-equal-status' }

  assert.throws(
    () => assertOwnDataDescriptorGraphUnchanged(replacementSnapshot),
    { name: 'AssertionError' }
  )
})

function deepFreezeFixture(value, seen = new Set()) {
  if (
    value === null ||
    (typeof value !== 'object' && typeof value !== 'function') ||
    seen.has(value)
  ) {
    return value
  }

  seen.add(value)

  for (const propertyName of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, propertyName)

    if (descriptor && Object.hasOwn(descriptor, 'value')) {
      deepFreezeFixture(descriptor.value, seen)
    }
  }

  return Object.freeze(value)
}

function createNullPrototypeSuccessResponse(syncRequest) {
  const response = createSyntheticSuccessResponse(syncRequest)
  const data = Object.assign(Object.create(null), response.data)
  const warnings = []
  const processedBy = [SYNC_CONTRACT_HANDLERS[0]]
  Object.setPrototypeOf(warnings, null)
  Object.setPrototypeOf(processedBy, null)
  const meta = Object.assign(Object.create(null), {
    durationMs: response.meta.durationMs,
    processedBy,
  })

  return Object.assign(Object.create(null), {
    ...response,
    data,
    warnings,
    meta,
  })
}

test('akzeptiert stabile tief eingefrorene und Null-Prototyp-Responses ohne Inputmutation', async () => {
  const frozenSystem = await runWithTransportResponse(
    (syncRequest) => deepFreezeFixture(
      createSyntheticSuccessResponse(syncRequest)
    )
  )
  const nullPrototypeSystem = await runWithTransportResponse(
    (syncRequest) => createNullPrototypeSuccessResponse(syncRequest)
  )

  for (const system of [frozenSystem, nullPrototypeSystem]) {
    assertSuccessfulServiceResult(system.result)
    assert.notStrictEqual(system.result.syncResponse, system.originalResponse)
    assert.deepEqual(
      validateSyncResponse(
        system.result.syncResponse,
        system.calls.requests[0]
      ),
      { ok: true, errors: [] }
    )
  }

  assertDeepFrozen(frozenSystem.originalResponse)
  assert.equal(Object.getPrototypeOf(nullPrototypeSystem.originalResponse), null)
  assert.equal(
    Object.getPrototypeOf(nullPrototypeSystem.originalResponse.data),
    null
  )
  assert.equal(
    Object.getPrototypeOf(
      nullPrototypeSystem.originalResponse.meta.processedBy
    ),
    null
  )
})

test('redigiert werfende Response-Reflection-Traps als invalidResponse', async () => {
  const privateMarkers = [
    'fixture-response-prototype-trap-private-sentinel',
    'fixture-response-own-keys-trap-private-sentinel',
    'fixture-response-descriptor-trap-private-sentinel',
  ]
  const trapCalls = [0, 0, 0]
  const proxyFactories = [
    (syncRequest) => new Proxy(
      createSyntheticSuccessResponse(syncRequest),
      {
        getPrototypeOf() {
          trapCalls[0] += 1
          throw new Error(privateMarkers[0])
        },
      }
    ),
    (syncRequest) => new Proxy(
      createSyntheticSuccessResponse(syncRequest),
      {
        ownKeys() {
          trapCalls[1] += 1
          throw new Error(privateMarkers[1])
        },
      }
    ),
    (syncRequest) => new Proxy(
      createSyntheticSuccessResponse(syncRequest),
      {
        getOwnPropertyDescriptor(target, propertyName) {
          if (propertyName === 'version') {
            trapCalls[2] += 1
            throw new Error(privateMarkers[2])
          }

          return Reflect.getOwnPropertyDescriptor(target, propertyName)
        },
      }
    ),
  ]

  for (const createProxy of proxyFactories) {
    const system = await runWithTransportResponse(createProxy)

    assertLocalFailure(system.result, 'invalidResponse', REQUEST_ID)
    assertResultDoesNotContain(system.result, privateMarkers)
  }

  assert.deepEqual(trapCalls, [1, 1, 1])
})

test('ordnet werfenden then-Zugriff und widerrufene Response-Proxies der beobachtbaren Transportgrenze zu', async () => {
  const privateMarker = 'fixture-response-then-private-sentinel'
  let thenGetCalls = 0
  const throwingThenSystem = createServiceSystem({
    transportImplementation({ syncRequest }) {
      return new Proxy(createSyntheticSuccessResponse(syncRequest), {
        get(target, propertyName, receiver) {
          if (propertyName === 'then') {
            thenGetCalls += 1
            throw new Error(privateMarker)
          }

          return Reflect.get(target, propertyName, receiver)
        },
      })
    },
  })
  const throwingThenResult = await throwingThenSystem.service.runSyncTest()

  assertLocalFailure(throwingThenResult, 'transportFailed', REQUEST_ID)
  assertResultDoesNotContain(throwingThenResult, [privateMarker])
  assert.equal(thenGetCalls, 1)
  assert.equal(throwingThenSystem.calls.sendSyncRequest, 1)

  const revokedSystem = createServiceSystem({
    transportImplementation({ syncRequest }) {
      const revocableResponse = Proxy.revocable(
        createSyntheticSuccessResponse(syncRequest),
        {}
      )
      revocableResponse.revoke()
      return revocableResponse.proxy
    },
  })
  const revokedResult = await revokedSystem.service.runSyncTest()

  assertLocalFailure(revokedResult, 'transportFailed', REQUEST_ID)
  assert.equal(revokedSystem.calls.sendSyncRequest, 1)
})

test('akzeptiert einen transparent beobachteten Proxy ohne universelle Proxy-Erkennungsbehauptung', async () => {
  const observedGets = []
  const system = await runWithTransportResponse((syncRequest) => new Proxy(
    createSyntheticSuccessResponse(syncRequest),
    {
      get(target, propertyName, receiver) {
        observedGets.push(propertyName)
        return Reflect.get(target, propertyName, receiver)
      },
    }
  ))

  assertSuccessfulServiceResult(system.result)
  assert.deepEqual(observedGets, ['then'])
  assert.deepEqual(
    validateSyncResponse(system.result.syncResponse, system.calls.requests[0]),
    { ok: true, errors: [] }
  )
})

test('hält zwei parallele Aufrufe bei umgekehrter Antwortreihenfolge exakt getrennt', async () => {
  const deferredResponses = [createDeferred(), createDeferred()]
  const system = createServiceSystem({
    requestIds: [REQUEST_ID, SECOND_REQUEST_ID],
    timestamps: [REQUEST_TIMESTAMP, SECOND_REQUEST_TIMESTAMP],
    transportImplementation({ callNumber }) {
      return deferredResponses[callNumber - 1].promise
    },
  })
  const firstPendingResult = system.service.runSyncTest()
  const secondPendingResult = system.service.runSyncTest()

  await Promise.resolve()
  assert.equal(system.calls.sendSyncRequest, 2)

  const [firstRequest, secondRequest] = system.calls.requests
  assert.equal(firstRequest.requestId, REQUEST_ID)
  assert.equal(secondRequest.requestId, SECOND_REQUEST_ID)
  assert.notStrictEqual(firstRequest, secondRequest)
  assert.notStrictEqual(firstRequest.payload, secondRequest.payload)

  deferredResponses[1].resolve(
    createSyntheticSuccessResponse(secondRequest)
  )
  const secondResult = await secondPendingResult
  deferredResponses[0].resolve(
    createSyntheticSuccessResponse(firstRequest)
  )
  const firstResult = await firstPendingResult

  assertSuccessfulServiceResult(firstResult, REQUEST_ID)
  assertSuccessfulServiceResult(secondResult, SECOND_REQUEST_ID)
  assert.equal(firstResult.syncResponse.requestId, REQUEST_ID)
  assert.equal(secondResult.syncResponse.requestId, SECOND_REQUEST_ID)
})

test('weist bei parallelen Aufrufen vertauschte Response-IDs für jede eigene Korrelation zurück', async () => {
  const deferredResponses = [createDeferred(), createDeferred()]
  const system = createServiceSystem({
    requestIds: [REQUEST_ID, SECOND_REQUEST_ID],
    timestamps: [REQUEST_TIMESTAMP, SECOND_REQUEST_TIMESTAMP],
    transportImplementation({ callNumber }) {
      return deferredResponses[callNumber - 1].promise
    },
  })
  const firstPendingResult = system.service.runSyncTest()
  const secondPendingResult = system.service.runSyncTest()

  await Promise.resolve()
  const [firstRequest, secondRequest] = system.calls.requests
  deferredResponses[0].resolve(
    createSyntheticSuccessResponse(secondRequest)
  )
  deferredResponses[1].resolve(
    createSyntheticSuccessResponse(firstRequest)
  )

  const [firstResult, secondResult] = await Promise.all([
    firstPendingResult,
    secondPendingResult,
  ])

  assertLocalFailure(firstResult, 'invalidResponse', REQUEST_ID)
  assertLocalFailure(secondResult, 'invalidResponse', SECOND_REQUEST_ID)
  assert.equal(system.calls.sendSyncRequest, 2)
})

test('isoliert Transportfehler von parallelen und späteren erfolgreichen Aufrufen', async () => {
  const firstDeferred = createDeferred()
  const system = createServiceSystem({
    requestIds: [REQUEST_ID, SECOND_REQUEST_ID, THIRD_REQUEST_ID],
    timestamps: [
      REQUEST_TIMESTAMP,
      SECOND_REQUEST_TIMESTAMP,
      THIRD_REQUEST_TIMESTAMP,
    ],
    transportImplementation({ callNumber, syncRequest }) {
      return callNumber === 1
        ? firstDeferred.promise
        : createSyntheticSuccessResponse(syncRequest)
    },
  })
  const firstPendingResult = system.service.runSyncTest()
  const secondPendingResult = system.service.runSyncTest()
  firstDeferred.reject(new Error('fixture-isolated-transport-private-sentinel'))

  const [firstResult, secondResult] = await Promise.all([
    firstPendingResult,
    secondPendingResult,
  ])
  const thirdResult = await system.service.runSyncTest()

  assertLocalFailure(firstResult, 'transportFailed', REQUEST_ID)
  assertSuccessfulServiceResult(secondResult, SECOND_REQUEST_ID)
  assertSuccessfulServiceResult(thirdResult, THIRD_REQUEST_ID)
  assert.equal(system.calls.generateRequestId, 3)
  assert.equal(system.calls.getCurrentTimestamp, 3)
  assert.equal(system.calls.sendSyncRequest, 3)
})

test('führt bei gleicher syntaktisch gültiger injizierter ID keinen globalen Kollisions- oder Deduplizierungsspeicher', async () => {
  const system = createServiceSystem({
    requestIds: [REQUEST_ID, REQUEST_ID],
    timestamps: [REQUEST_TIMESTAMP, SECOND_REQUEST_TIMESTAMP],
  })

  const [firstResult, secondResult] = await Promise.all([
    system.service.runSyncTest(),
    system.service.runSyncTest(),
  ])

  assertSuccessfulServiceResult(firstResult, REQUEST_ID)
  assertSuccessfulServiceResult(secondResult, REQUEST_ID)
  assert.equal(system.calls.sendSyncRequest, 2)
  assert.notStrictEqual(system.calls.requests[0], system.calls.requests[1])
  assert.notStrictEqual(
    system.calls.requests[0].payload,
    system.calls.requests[1].payload
  )
})

test('liefert lokale Fehler pro Aufruf als frische voneinander entkoppelte unveränderliche Records', async () => {
  const service = createSyncService()
  const firstResult = await service.runSyncTest('fixture-extra')
  const secondResult = await service.runSyncTest('fixture-extra')

  assertLocalFailure(firstResult, 'invalidInvocation')
  assertLocalFailure(secondResult, 'invalidInvocation')
  assert.notStrictEqual(firstResult, secondResult)
  assert.notStrictEqual(firstResult.error, secondResult.error)
})
