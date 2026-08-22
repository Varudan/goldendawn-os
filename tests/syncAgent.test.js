import assert from 'node:assert/strict'
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { pathToFileURL } from 'node:url'

import * as syncAgentModule from '../src/agents/syncAgent.js'
import {
  SYNC_CONTRACT_REQUEST_ID_MAX_LENGTH,
  SYNC_CONTRACT_TIMESTAMP_TOLERANCE_MS,
  validateSyncResponse,
} from '../src/contracts/syncContract.js'

const { createSyncAgent } = syncAgentModule

const IMPORTED_OBJECT_FREEZE = Object.freeze
const IMPORTED_OBJECT_IS_FROZEN = Object.isFrozen

const REFERENCE_TIMESTAMP = '2026-08-22T12:00:00.000Z'
const REQUEST_TIMESTAMP = '2026-08-22T11:59:59.125Z'

const RESULT_PROPERTY_NAMES = Object.freeze([
  'ok',
  'status',
  'syncResponse',
  'error',
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
const REQUEST_PROPERTY_NAMES = Object.freeze([
  'version',
  'action',
  'source',
  'requestId',
  'timestamp',
  'payload',
])

const FAILURE_PROFILES = Object.freeze({
  invalidInvocation: Object.freeze({
    status: 'invalidInvocation',
    code: 'invalidSyncAgentInvocation',
    message: 'Der lokale SyncAgent erwartet genau einen SyncRequest.',
  }),
  requestRejected: Object.freeze({
    status: 'syncRequestRejected',
    code: 'syncAgentRequestRejected',
    message: 'Die Sync-Anfrage wurde vom lokalen SyncAgent abgelehnt.',
  }),
  agentFailed: Object.freeze({
    status: 'agentFailed',
    code: 'syncAgentFailed',
    message:
      'Die Sync-Anfrage konnte vom lokalen SyncAgent nicht sicher verarbeitet werden.',
  }),
})

function createRequest(overrides = {}) {
  return {
    version: '1.0',
    action: 'syncTest',
    source: 'goldendawn-os',
    requestId: 'req_sync-agent-fixture',
    timestamp: REQUEST_TIMESTAMP,
    payload: {},
    ...overrides,
  }
}

function createNullPrototypeRequest(overrides = {}) {
  const request = Object.assign(
    Object.create(null),
    createRequest(overrides)
  )
  request.payload = Object.assign(Object.create(null), request.payload)
  return request
}

function createClock(timestamp = REFERENCE_TIMESTAMP) {
  const state = { calls: 0 }

  return {
    state,
    clock() {
      state.calls += 1
      return timestamp
    },
  }
}

function createExpectedCorrelation(request) {
  return {
    version: request.version,
    action: request.action,
    source: request.source,
    requestId: request.requestId,
    timestamp: request.timestamp,
    payload: {},
  }
}

function assertOwnEnumerableDataRecord(value, propertyNames) {
  assert.equal(Object.getPrototypeOf(value), Object.prototype)
  assert.deepEqual(Reflect.ownKeys(value), propertyNames)

  for (const propertyName of propertyNames) {
    const descriptor = Object.getOwnPropertyDescriptor(value, propertyName)
    assert.notEqual(descriptor, undefined)
    assert.equal(descriptor.enumerable, true)
    assert.equal(Object.hasOwn(descriptor, 'value'), true)
  }
}

function assertDeepFrozen(value, seen = new Set()) {
  if (
    (typeof value !== 'object' || value === null) &&
    typeof value !== 'function'
  ) {
    return
  }

  if (seen.has(value)) {
    return
  }

  seen.add(value)
  assert.equal(
    Reflect.apply(IMPORTED_OBJECT_IS_FROZEN, Object, [value]),
    true
  )

  for (const propertyName of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, propertyName)

    if (descriptor !== undefined && Object.hasOwn(descriptor, 'value')) {
      assertDeepFrozen(descriptor.value, seen)
    }
  }
}

function assertFailure(result, profile) {
  assertOwnEnumerableDataRecord(result, RESULT_PROPERTY_NAMES)
  assert.deepEqual(result, {
    ok: false,
    status: profile.status,
    syncResponse: null,
    error: {
      code: profile.code,
      message: profile.message,
    },
  })
  assertOwnEnumerableDataRecord(result.error, ['code', 'message'])
  assertDeepFrozen(result)
  assert.equal(Object.hasOwn(result, 'then'), false)
}

function assertSuccess(result, request, timestamp = REFERENCE_TIMESTAMP) {
  assertOwnEnumerableDataRecord(result, RESULT_PROPERTY_NAMES)
  assertOwnEnumerableDataRecord(result.syncResponse, RESPONSE_PROPERTY_NAMES)
  assertOwnEnumerableDataRecord(result.syncResponse.data, [
    'status',
    'dataOrigin',
  ])
  assertOwnEnumerableDataRecord(result.syncResponse.meta, [
    'durationMs',
    'processedBy',
  ])
  assert.deepEqual(result, {
    ok: true,
    status: 'syncResponseCreated',
    syncResponse: {
      version: request.version,
      success: true,
      requestId: request.requestId,
      action: request.action,
      handledBy: 'SyncAgent',
      timestamp,
      data: {
        status: 'ok',
        dataOrigin: 'synthetic',
      },
      error: null,
      warnings: [],
      meta: {
        durationMs: 0,
        processedBy: ['SyncAgent'],
      },
    },
    error: null,
  })
  assert.deepEqual(
    validateSyncResponse(
      result.syncResponse,
      createExpectedCorrelation(request)
    ),
    { ok: true, errors: [] }
  )
  assertDeepFrozen(result)
  assert.equal(Object.hasOwn(result, 'then'), false)
}

function hasExactKeys(value, propertyNames) {
  try {
    const ownKeys = Reflect.ownKeys(value)
    return (
      ownKeys.length === propertyNames.length &&
      propertyNames.every((propertyName) => ownKeys.includes(propertyName))
    )
  } catch {
    return false
  }
}

function restoreOwnProperty(target, propertyName, descriptor) {
  if (descriptor === undefined) {
    delete target[propertyName]
    return
  }

  Object.defineProperty(target, propertyName, descriptor)
}

function installOwnDataProperty(target, propertyName, value) {
  const descriptor = Object.getOwnPropertyDescriptor(target, propertyName)

  assert.notEqual(descriptor, undefined)
  assert.equal(Object.hasOwn(descriptor, 'value'), true)

  Object.defineProperty(target, propertyName, {
    ...descriptor,
    value,
  })

  return descriptor
}

function captureOwnDescriptorSnapshot(value) {
  const ownKeys = Reflect.ownKeys(value)

  return {
    identity: value,
    prototype: Object.getPrototypeOf(value),
    extensible: Object.isExtensible(value),
    ownKeys,
    descriptors: ownKeys.map((propertyName) => {
      const descriptor = Object.getOwnPropertyDescriptor(value, propertyName)

      assert.notEqual(descriptor, undefined)

      if (Object.hasOwn(descriptor, 'value')) {
        return {
          propertyName,
          kind: 'data',
          configurable: descriptor.configurable,
          enumerable: descriptor.enumerable,
          writable: descriptor.writable,
          value: descriptor.value,
        }
      }

      return {
        propertyName,
        kind: 'accessor',
        configurable: descriptor.configurable,
        enumerable: descriptor.enumerable,
        get: descriptor.get,
        set: descriptor.set,
      }
    }),
  }
}

function assertOwnDescriptorSnapshotEqual(before, after) {
  assert.equal(after.identity, before.identity)
  assert.equal(after.prototype, before.prototype)
  assert.equal(after.extensible, before.extensible)
  assert.deepEqual(after.ownKeys, before.ownKeys)
  assert.equal(after.descriptors.length, before.descriptors.length)

  for (let index = 0; index < before.descriptors.length; index += 1) {
    const beforeDescriptor = before.descriptors[index]
    const afterDescriptor = after.descriptors[index]

    assert.equal(afterDescriptor.propertyName, beforeDescriptor.propertyName)
    assert.equal(afterDescriptor.kind, beforeDescriptor.kind)
    assert.equal(afterDescriptor.configurable, beforeDescriptor.configurable)
    assert.equal(afterDescriptor.enumerable, beforeDescriptor.enumerable)

    if (beforeDescriptor.kind === 'data') {
      assert.equal(afterDescriptor.writable, beforeDescriptor.writable)
      assert.equal(afterDescriptor.value, beforeDescriptor.value)
    } else {
      assert.equal(afterDescriptor.get, beforeDescriptor.get)
      assert.equal(afterDescriptor.set, beforeDescriptor.set)
    }
  }
}

function replaceSourceExactlyOnce(source, search, replacement, label) {
  let matchCount = 0
  let searchOffset = 0

  while (true) {
    const matchIndex = source.indexOf(search, searchOffset)

    if (matchIndex === -1) {
      break
    }

    matchCount += 1
    searchOffset = matchIndex + search.length
  }

  assert.equal(matchCount, 1, `${label} muss exakt einen Treffer besitzen`)
  return source.replace(search, replacement)
}

async function withTemporarySyncAgent(
  { agentMutations = [], contractMutations = [] },
  callback
) {
  const temporaryRoot = await mkdtemp(
    join(tmpdir(), 'goldendawn-sync-agent-regression-')
  )

  try {
    const agentDirectory = join(temporaryRoot, 'src', 'agents')
    const contractDirectory = join(temporaryRoot, 'src', 'contracts')
    let agentSource = await readFile(
      new URL('../src/agents/syncAgent.js', import.meta.url),
      'utf8'
    )
    let contractSource = await readFile(
      new URL('../src/contracts/syncContract.js', import.meta.url),
      'utf8'
    )

    agentSource = agentSource.replaceAll('\r\n', '\n')
    contractSource = contractSource.replaceAll('\r\n', '\n')

    for (const mutation of agentMutations) {
      agentSource = replaceSourceExactlyOnce(
        agentSource,
        mutation.search,
        mutation.replacement,
        mutation.label
      )
    }

    for (const mutation of contractMutations) {
      contractSource = replaceSourceExactlyOnce(
        contractSource,
        mutation.search,
        mutation.replacement,
        mutation.label
      )
    }

    await mkdir(agentDirectory, { recursive: true })
    await mkdir(contractDirectory, { recursive: true })
    await writeFile(
      join(temporaryRoot, 'package.json'),
      '{"type":"module"}\n',
      'utf8'
    )
    await writeFile(join(agentDirectory, 'syncAgent.js'), agentSource, 'utf8')
    await writeFile(
      join(contractDirectory, 'syncContract.js'),
      contractSource,
      'utf8'
    )

    const imported = await import(
      pathToFileURL(join(agentDirectory, 'syncAgent.js')).href
    )

    await callback(imported.createSyncAgent)
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true })
  }
}

function assertNoSentinels(value, sentinels) {
  const serialized = JSON.stringify(value)

  for (const sentinel of sentinels) {
    assert.equal(serialized.includes(sentinel), false)
  }
}

function getOffsetTimestamp(offsetMilliseconds) {
  return new Date(
    Date.parse(REFERENCE_TIMESTAMP) + offsetMilliseconds
  ).toISOString()
}

test('exportiert exakt die synchrone frische und eingefrorene SyncAgent-API', () => {
  assert.deepEqual(Object.keys(syncAgentModule), ['createSyncAgent'])
  assert.equal(Object.hasOwn(syncAgentModule, 'default'), false)
  assert.equal(typeof createSyncAgent, 'function')
  assert.equal(createSyncAgent.length, 0)

  let clockCalls = 0
  const firstApi = createSyncAgent({
    getCurrentTimestamp() {
      clockCalls += 1
      return REFERENCE_TIMESTAMP
    },
  })
  const secondApi = createSyncAgent()

  assert.notEqual(firstApi, secondApi)
  assertOwnEnumerableDataRecord(firstApi, ['processSyncRequest'])
  assertOwnEnumerableDataRecord(secondApi, ['processSyncRequest'])
  assert.equal(Object.isFrozen(firstApi), true)
  assert.equal(Object.isFrozen(secondApi), true)
  assert.equal(firstApi.processSyncRequest.length, 1)
  assert.equal(
    firstApi.processSyncRequest.constructor.name,
    'Function'
  )
  assert.equal(clockCalls, 0)
})

test('bleibt bei cache-busted Import und Factory-Erzeugung ohne Laufzeitaktivität', { concurrency: false }, async () => {
  const agentSource = await readFile(
    new URL('../src/agents/syncAgent.js', import.meta.url),
    'utf8'
  )
  const mainSource = await readFile(
    new URL('../src/main.js', import.meta.url),
    'utf8'
  )
  const activity = []
  const replacements = [
    [globalThis, 'Date', function instrumentedDate() {
      activity.push('Date')
      throw new Error('fixture-import-date-private-sentinel')
    }],
    [globalThis, 'setTimeout', () => activity.push('setTimeout')],
    [globalThis, 'setInterval', () => activity.push('setInterval')],
    [globalThis, 'fetch', () => {
      activity.push('fetch')
      return Promise.reject(new Error('fixture-import-fetch-private-sentinel'))
    }],
    [globalThis, 'WebSocket', function instrumentedWebSocket() {
      activity.push('WebSocket')
    }],
    [globalThis, 'XMLHttpRequest', function instrumentedXmlHttpRequest() {
      activity.push('XMLHttpRequest')
    }],
  ]
  const originalDescriptors = []
  const passiveGetterNames = ['crypto', 'localStorage', 'sessionStorage']
  const consoleMethods = ['log', 'info', 'warn', 'error', 'debug', 'trace']

  try {
    for (const [target, propertyName, value] of replacements) {
      const originalDescriptor = Object.getOwnPropertyDescriptor(
        target,
        propertyName
      )

      if (originalDescriptor?.configurable === false) {
        continue
      }

      originalDescriptors.push([target, propertyName, originalDescriptor])
      Object.defineProperty(target, propertyName, {
        configurable: true,
        writable: true,
        value,
      })
    }

    for (const propertyName of passiveGetterNames) {
      const originalDescriptor = Object.getOwnPropertyDescriptor(
        globalThis,
        propertyName
      )

      if (originalDescriptor?.configurable === false) {
        continue
      }

      originalDescriptors.push([globalThis, propertyName, originalDescriptor])
      Object.defineProperty(globalThis, propertyName, {
        configurable: true,
        get() {
          activity.push(propertyName)
          throw new Error(`fixture-import-${propertyName}-private-sentinel`)
        },
      })
    }

    for (const methodName of consoleMethods) {
      const originalDescriptor = Object.getOwnPropertyDescriptor(
        console,
        methodName
      )
      originalDescriptors.push([console, methodName, originalDescriptor])
      Object.defineProperty(console, methodName, {
        configurable: true,
        writable: true,
        value() {
          activity.push(`console.${methodName}`)
        },
      })
    }

    const imported = await import(
      '../src/agents/syncAgent.js?import-inactivity=2026-08-22'
    )
    let clockCalls = 0
    const api = imported.createSyncAgent({
      getCurrentTimestamp() {
        clockCalls += 1
        return REFERENCE_TIMESTAMP
      },
    })

    assert.equal(Object.isFrozen(api), true)
    assert.equal(clockCalls, 0)
  } finally {
    for (const [target, propertyName, descriptor] of originalDescriptors.reverse()) {
      restoreOwnProperty(target, propertyName, descriptor)
    }
  }

  assert.deepEqual(activity, [])
  assert.match(agentSource, /from '\.\.\/contracts\/syncContract\.js'/u)
  assert.equal(
    [...agentSource.matchAll(/^import\s/gu)].length,
    1
  )
  assert.doesNotMatch(
    agentSource,
    /\b(?:fetch|WebSocket|XMLHttpRequest|setTimeout|setInterval|process\.env|import\.meta\.env|localStorage|sessionStorage|console\.)\b/u
  )
  assert.doesNotMatch(
    agentSource,
    /(?:PromptVault|LearningHub|LichtwaldLog|GoldenDawn.?Vault|Provider|OpenAI|n8n|node:http|node:net|node:dns)/iu
  )
  assert.doesNotMatch(mainSource, /(?:syncAgent\.js|createSyncAgent)/u)
})

test('arbeitet synchron und liefert weder Promise noch Thenable', () => {
  const request = createRequest()
  const result = createSyncAgent({
    getCurrentTimestamp: () => REFERENCE_TIMESTAMP,
  }).processSyncRequest(request)

  assertSuccess(result, request)
  assert.equal(result instanceof Promise, false)
  assert.equal(typeof result?.then, 'undefined')
})

test('weist falsche Aufrufzahlen vor jeder Input- oder Clockinspektion zurück', () => {
  let clockCalls = 0
  let trapCalls = 0
  const hostile = new Proxy({}, {
    get() {
      trapCalls += 1
      throw new Error('fixture-arity-get-private-sentinel')
    },
    getOwnPropertyDescriptor() {
      trapCalls += 1
      throw new Error('fixture-arity-descriptor-private-sentinel')
    },
    getPrototypeOf() {
      trapCalls += 1
      throw new Error('fixture-arity-prototype-private-sentinel')
    },
    ownKeys() {
      trapCalls += 1
      throw new Error('fixture-arity-keys-private-sentinel')
    },
  })
  const revoked = Proxy.revocable({}, {})
  revoked.revoke()
  const api = createSyncAgent({
    getCurrentTimestamp() {
      clockCalls += 1
      throw new Error('fixture-arity-clock-private-sentinel')
    },
  })

  const noArgument = api.processSyncRequest()
  const twoArguments = api.processSyncRequest(hostile, revoked.proxy)
  const threeArguments = api.processSyncRequest(
    createRequest(),
    hostile,
    revoked.proxy
  )

  assertFailure(noArgument, FAILURE_PROFILES.invalidInvocation)
  assertFailure(twoArguments, FAILURE_PROFILES.invalidInvocation)
  assertFailure(threeArguments, FAILURE_PROFILES.invalidInvocation)
  assert.notEqual(noArgument, twoArguments)
  assert.notEqual(noArgument.error, twoArguments.error)
  assert.equal(clockCalls, 0)
  assert.equal(trapCalls, 0)
})

test('akzeptiert gewöhnliche, Null-Prototyp- und bereits gefrorene Requests ohne Caller-Mutation', async (t) => {
  const ordinary = createRequest()
  const nullPrototype = createNullPrototypeRequest({
    requestId: 'req_null-prototype-fixture',
  })
  const frozen = createRequest({ requestId: 'req_frozen-fixture' })
  Object.freeze(frozen.payload)
  Object.freeze(frozen)

  for (const [label, request] of [
    ['gewöhnlich', ordinary],
    ['Null-Prototyp', nullPrototype],
    ['bereits gefroren', frozen],
  ]) {
    await t.test(label, () => {
      const clock = createClock()
      const result = createSyncAgent({
        getCurrentTimestamp: clock.clock,
      }).processSyncRequest(request)

      assertSuccess(result, request)
      assert.equal(clock.state.calls, 1)
    })
  }

  assert.equal(Object.isFrozen(ordinary), false)
  assert.equal(Object.isFrozen(ordinary.payload), false)
  ordinary.version = 'fixture-mutated-version'
  ordinary.payload.fixture = 'fixture-mutated-payload'
})

test('erzeugt pro Aufruf einen vollständig disjunkten Ausgabe- und internen Requestgraphen', { concurrency: false }, () => {
  const requestOne = createRequest({ requestId: 'req_identity-one' })
  const requestTwo = createRequest({ requestId: 'req_identity-two' })
  const api = createSyncAgent({
    getCurrentTimestamp: () => REFERENCE_TIMESTAMP,
  })
  const originalFreezeDescriptor = Object.getOwnPropertyDescriptor(
    Object,
    'freeze'
  )
  const originalFreeze = originalFreezeDescriptor.value
  const capturedRequests = []
  const capturedPayloads = []
  let firstResult
  let secondResult

  try {
    installOwnDataProperty(Object, 'freeze', function instrumentedFreeze(value) {
      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        Reflect.ownKeys(value).length === 0
      ) {
        capturedPayloads.push(value)
      } else if (hasExactKeys(value, REQUEST_PROPERTY_NAMES)) {
        capturedRequests.push(value)
      }

      return Reflect.apply(originalFreeze, Object, [value])
    })

    firstResult = api.processSyncRequest(requestOne)
    secondResult = api.processSyncRequest(requestTwo)
  } finally {
    restoreOwnProperty(Object, 'freeze', originalFreezeDescriptor)
  }

  assertSuccess(firstResult, requestOne)
  assertSuccess(secondResult, requestTwo)
  assert.equal(capturedRequests.length, 2)
  assert.equal(capturedPayloads.length, 2)
  assert.notEqual(capturedRequests[0], capturedRequests[1])
  assert.notEqual(capturedPayloads[0], capturedPayloads[1])
  assert.notEqual(capturedRequests[0], requestOne)
  assert.notEqual(capturedRequests[1], requestTwo)
  assert.notEqual(capturedPayloads[0], requestOne.payload)
  assert.notEqual(capturedPayloads[1], requestTwo.payload)

  for (const propertyPath of [
    [],
    ['syncResponse'],
    ['syncResponse', 'data'],
    ['syncResponse', 'warnings'],
    ['syncResponse', 'meta'],
    ['syncResponse', 'meta', 'processedBy'],
  ]) {
    const firstValue = propertyPath.reduce(
      (value, propertyName) => value[propertyName],
      firstResult
    )
    const secondValue = propertyPath.reduce(
      (value, propertyName) => value[propertyName],
      secondResult
    )
    assert.notEqual(firstValue, secondValue)
  }
})

test('weist repräsentative Contractabweichungen statisch und redigiert zurück', async (t) => {
  const hiddenFieldRequest = createRequest()
  Object.defineProperty(hiddenFieldRequest, 'hiddenFixture', {
    value: 'fixture-hidden-private-sentinel',
    enumerable: false,
  })
  const symbolFieldRequest = createRequest()
  symbolFieldRequest[Symbol('fixture-symbol-private-sentinel')] = true
  const missingFieldRequest = createRequest()
  delete missingFieldRequest.source
  const customPrototypeRequest = createRequest()
  Object.setPrototypeOf(customPrototypeRequest, { fixture: true })

  const cases = [
    ['falsche Version', createRequest({ version: '2.0' })],
    ['unbekannte Aktion', createRequest({ action: 'fixtureAction' })],
    ['falsche Quelle', createRequest({ source: 'fixture-source' })],
    ['ungültige Request-ID', createRequest({ requestId: 'fixture' })],
    [
      'zu lange Request-ID',
      createRequest({
        requestId: 'req_' + 'a'.repeat(
          SYNC_CONTRACT_REQUEST_ID_MAX_LENGTH - 3
        ),
      }),
    ],
    ['nichtleeres Payload', createRequest({ payload: { value: true } })],
    ['fehlendes Feld', missingFieldRequest],
    ['zusätzliches Feld', { ...createRequest(), extra: true }],
    ['verstecktes Zusatzfeld', hiddenFieldRequest],
    ['Symbolfeld', symbolFieldRequest],
    ['ungeeigneter Prototyp', customPrototypeRequest],
    ['Array', []],
    ['Promise', Promise.resolve(createRequest())],
    ['boxed primitive', new String('fixture')],
  ]

  for (const [label, request] of cases) {
    await t.test(label, () => {
      const clock = createClock()
      const result = createSyncAgent({
        getCurrentTimestamp: clock.clock,
      }).processSyncRequest(request)

      assertFailure(result, FAILURE_PROFILES.requestRejected)
      assert.equal(clock.state.calls, 1)
    })
  }
})

test('führt eigene Accessors, Konvertierungsmethoden, toJSON und then nicht aus', () => {
  const calls = {
    accessor: 0,
    primitive: 0,
    then: 0,
    toJSON: 0,
    toString: 0,
    valueOf: 0,
  }
  const accessorRequest = createRequest()
  Object.defineProperty(accessorRequest, 'version', {
    enumerable: true,
    get() {
      calls.accessor += 1
      throw new Error('fixture-accessor-private-sentinel')
    },
  })
  const coercionProbe = {
    toJSON() {
      calls.toJSON += 1
      throw new Error('fixture-to-json-private-sentinel')
    },
    toString() {
      calls.toString += 1
      throw new Error('fixture-to-string-private-sentinel')
    },
    valueOf() {
      calls.valueOf += 1
      throw new Error('fixture-value-of-private-sentinel')
    },
    [Symbol.toPrimitive]() {
      calls.primitive += 1
      throw new Error('fixture-to-primitive-private-sentinel')
    },
  }
  const coercionRequest = createRequest({ requestId: coercionProbe })
  const thenable = {}
  Object.defineProperty(thenable, 'then', {
    enumerable: true,
    get() {
      calls.then += 1
      throw new Error('fixture-then-private-sentinel')
    },
  })
  const api = createSyncAgent({
    getCurrentTimestamp: () => REFERENCE_TIMESTAMP,
  })

  assertFailure(
    api.processSyncRequest(accessorRequest),
    FAILURE_PROFILES.requestRejected
  )
  assertFailure(
    api.processSyncRequest(coercionRequest),
    FAILURE_PROFILES.requestRejected
  )
  assertFailure(
    api.processSyncRequest(thenable),
    FAILURE_PROFILES.requestRejected
  )
  assert.deepEqual(calls, {
    accessor: 0,
    primitive: 0,
    then: 0,
    toJSON: 0,
    toString: 0,
    valueOf: 0,
  })
})

test('akzeptiert beide Zeitgrenzen inklusiv und weist je eine Millisekunde außerhalb zurück', async (t) => {
  const cases = [
    ['untere Grenze', -SYNC_CONTRACT_TIMESTAMP_TOLERANCE_MS, true],
    ['obere Grenze', SYNC_CONTRACT_TIMESTAMP_TOLERANCE_MS, true],
    [
      'unterhalb der unteren Grenze',
      -SYNC_CONTRACT_TIMESTAMP_TOLERANCE_MS - 1,
      false,
    ],
    [
      'oberhalb der oberen Grenze',
      SYNC_CONTRACT_TIMESTAMP_TOLERANCE_MS + 1,
      false,
    ],
  ]

  for (const [label, offset, accepted] of cases) {
    await t.test(label, () => {
      const request = createRequest({
        requestId: `req_timestamp_${String(offset).replace('-', 'minus_')}`,
        timestamp: getOffsetTimestamp(offset),
      })
      const clock = createClock()
      const result = createSyncAgent({
        getCurrentTimestamp: clock.clock,
      }).processSyncRequest(request)

      if (accepted) {
        assertSuccess(result, request)
      } else {
        assertFailure(result, FAILURE_PROFILES.requestRejected)
      }

      assert.equal(clock.state.calls, 1)
    })
  }
})

test('behandelt beherrschte Reflection-Trapthrows als Ablehnung und spätere Proxy-Drift als Agentfehler', () => {
  const sentinel = 'fixture-proxy-private-sentinel'
  let throwingTrapCalls = 0
  const throwingProxy = new Proxy(createRequest(), {
    getPrototypeOf() {
      throwingTrapCalls += 1
      throw new Error(sentinel)
    },
  })
  const target = createRequest({ requestId: 'req_stateful-proxy' })
  let versionDescriptorCalls = 0
  const driftingProxy = new Proxy(target, {
    getOwnPropertyDescriptor(value, propertyName) {
      if (propertyName === 'version') {
        versionDescriptorCalls += 1

        if (versionDescriptorCalls === 2) {
          throw new Error(sentinel)
        }
      }

      return Reflect.getOwnPropertyDescriptor(value, propertyName)
    },
  })
  const revoked = Proxy.revocable(createRequest(), {})
  revoked.revoke()
  const api = createSyncAgent({
    getCurrentTimestamp: () => REFERENCE_TIMESTAMP,
  })

  const throwingResult = api.processSyncRequest(throwingProxy)
  const revokedResult = api.processSyncRequest(revoked.proxy)
  const driftingResult = api.processSyncRequest(driftingProxy)

  assertFailure(throwingResult, FAILURE_PROFILES.requestRejected)
  assertFailure(revokedResult, FAILURE_PROFILES.requestRejected)
  assertFailure(driftingResult, FAILURE_PROFILES.agentFailed)
  assert.equal(throwingTrapCalls, 1)
  assert.equal(versionDescriptorCalls, 2)
  assertNoSentinels(
    [throwingResult, revokedResult, driftingResult],
    [sentinel]
  )
})

test('validiert das unveränderte Original vor jeder Projektion', () => {
  const target = createRequest({ requestId: 'req_original-first' })
  let versionDescriptorCalls = 0
  const proxy = new Proxy(target, {
    getOwnPropertyDescriptor(value, propertyName) {
      const descriptor = Reflect.getOwnPropertyDescriptor(value, propertyName)

      if (propertyName !== 'version') {
        return descriptor
      }

      versionDescriptorCalls += 1
      return {
        ...descriptor,
        value: versionDescriptorCalls === 1 ? '2.0' : '1.0',
      }
    },
  })
  const result = createSyncAgent({
    getCurrentTimestamp: () => REFERENCE_TIMESTAMP,
  }).processSyncRequest(proxy)

  assertFailure(result, FAILURE_PROFILES.requestRejected)
  assert.equal(versionDescriptorCalls, 1)
})

test('redigiert werfende, nichtfunktionale und nichtprimitive Clockpfade nach genau einem zulässigen Versuch', async (t) => {
  await t.test('werfende callable Proxy-Clock', () => {
    const sentinel = 'fixture-clock-throw-private-sentinel'
    let applyCalls = 0
    const clock = new Proxy(function fixtureClock() {}, {
      apply() {
        applyCalls += 1
        throw new Error(sentinel)
      },
    })
    const result = createSyncAgent({
      getCurrentTimestamp: clock,
    }).processSyncRequest(createRequest())

    assertFailure(result, FAILURE_PROFILES.agentFailed)
    assert.equal(applyCalls, 1)
    assertNoSentinels(result, [sentinel])
  })

  await t.test('nichtfunktionale Clock', () => {
    const result = createSyncAgent({
      getCurrentTimestamp: 42,
    }).processSyncRequest(createRequest())
    assertFailure(result, FAILURE_PROFILES.agentFailed)
  })

  let thenCalls = 0
  const thenable = {}
  Object.defineProperty(thenable, 'then', {
    get() {
      thenCalls += 1
      throw new Error('fixture-clock-then-private-sentinel')
    },
  })
  const values = [
    undefined,
    null,
    {},
    [],
    Promise.resolve(REFERENCE_TIMESTAMP),
    thenable,
    new String(REFERENCE_TIMESTAMP),
    Symbol('fixture-clock-symbol-private-sentinel'),
    1n,
    function fixtureClockValue() {},
  ]

  for (const [index, value] of values.entries()) {
    await t.test(`nichtprimitiver Rückgabewert ${index + 1}`, () => {
      let calls = 0
      const result = createSyncAgent({
        getCurrentTimestamp() {
          calls += 1
          return value
        },
      }).processSyncRequest(createRequest())

      assertFailure(result, FAILURE_PROFILES.agentFailed)
      assert.equal(calls, 1)
    })
  }

  assert.equal(thenCalls, 0)
})

test('gibt nichtkanonischer Referenzzeit Vorrang vor gleichzeitigen Requestfehlern', async (t) => {
  const invalidTimestamps = [
    '2026-08-22T12:00:00Z',
    '2026-02-30T12:00:00.000Z',
    'fixture-clock-private-sentinel',
  ]
  const invalidRequests = [null, createRequest({ version: '2.0' })]

  for (const timestamp of invalidTimestamps) {
    for (const request of invalidRequests) {
      await t.test(`${timestamp} / ${request === null ? 'null' : 'record'}`, () => {
        let calls = 0
        const result = createSyncAgent({
          getCurrentTimestamp() {
            calls += 1
            return timestamp
          },
        }).processSyncRequest(request)

        assertFailure(result, FAILURE_PROFILES.agentFailed)
        assert.equal(calls, 1)
        assertNoSentinels(result, ['fixture-clock-private-sentinel'])
      })
    }
  }
})

test('führt auf dem Erfolgspfad exakt drei Request- und zwei Responsevalidierungen in Freeze-Reihenfolge aus', { concurrency: false }, () => {
  const request = createRequest({ requestId: 'req_validation-trace' })
  const api = createSyncAgent({
    getCurrentTimestamp: () => REFERENCE_TIMESTAMP,
  })
  const originalDateParseDescriptor = Object.getOwnPropertyDescriptor(
    Date,
    'parse'
  )
  const originalDateParse = Date.parse
  const originalFreezeDescriptor = Object.getOwnPropertyDescriptor(
    Object,
    'freeze'
  )
  const originalFreeze = originalFreezeDescriptor.value
  const parsedValues = []
  const freezeEvents = []
  let result

  try {
    Object.defineProperty(Date, 'parse', {
      configurable: true,
      writable: true,
      value(value) {
        parsedValues.push(value)
        return Reflect.apply(originalDateParse, Date, [value])
      },
    })
    installOwnDataProperty(Object, 'freeze', function instrumentedFreeze(value) {
      if (hasExactKeys(value, REQUEST_PROPERTY_NAMES)) {
        freezeEvents.push(['request', parsedValues.length])
      } else if (hasExactKeys(value, RESPONSE_PROPERTY_NAMES)) {
        freezeEvents.push(['response', parsedValues.length])
      } else if (hasExactKeys(value, RESULT_PROPERTY_NAMES)) {
        const okDescriptor = Object.getOwnPropertyDescriptor(value, 'ok')

        if (okDescriptor?.value === true) {
          freezeEvents.push(['successResult', parsedValues.length])
        }
      }

      return Reflect.apply(originalFreeze, Object, [value])
    })

    result = api.processSyncRequest(request)
  } finally {
    restoreOwnProperty(Object, 'freeze', originalFreezeDescriptor)
    restoreOwnProperty(Date, 'parse', originalDateParseDescriptor)
  }

  assertSuccess(result, request)
  assert.equal(parsedValues.length, 10)
  assert.equal(
    parsedValues.filter((value) => value === REQUEST_TIMESTAMP).length,
    5
  )
  assert.equal(
    parsedValues.filter((value) => value === REFERENCE_TIMESTAMP).length,
    5
  )
  assert.deepEqual(freezeEvents, [
    ['request', 4],
    ['response', 8],
  ])
})

test('behandelt ein unsicher lesbares Validatorresultat fail closed', { concurrency: false }, () => {
  const originalOwnKeysDescriptor = Object.getOwnPropertyDescriptor(
    Reflect,
    'ownKeys'
  )
  const originalOwnKeys = originalOwnKeysDescriptor.value
  const marker = Symbol('fixture-validator-errors-private-sentinel')
  let manipulatedArrays = 0
  let result

  try {
    installOwnDataProperty(Reflect, 'ownKeys', function instrumentedOwnKeys(value) {
      const ownKeys = Reflect.apply(originalOwnKeys, Reflect, [value])

      if (
        manipulatedArrays === 0 &&
        Array.isArray(value) &&
        value.length === 0
      ) {
        manipulatedArrays += 1
        return [...ownKeys, marker]
      }

      return ownKeys
    })

    result = createSyncAgent({
      getCurrentTimestamp: () => REFERENCE_TIMESTAMP,
    }).processSyncRequest(createRequest())
  } finally {
    restoreOwnProperty(Reflect, 'ownKeys', originalOwnKeysDescriptor)
  }

  assertFailure(result, FAILURE_PROFILES.agentFailed)
  assert.equal(manipulatedArrays, 1)
  assertNoSentinels(result, [marker.description])
})

test('weist gezielte Freeze-Throws und Freeze-No-ops für jeden internen Ausgabeabschnitt zurück', { concurrency: false }, async (t) => {
  const targets = [
    [
      'Request-Payload',
      (value) => (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        Reflect.ownKeys(value).length === 0
      ),
    ],
    ['Request', (value) => hasExactKeys(value, REQUEST_PROPERTY_NAMES)],
    ['Response-Data', (value) => hasExactKeys(value, ['status', 'dataOrigin'])],
    [
      'Warnings',
      (value) => Array.isArray(value) && value.length === 0,
    ],
    [
      'processedBy',
      (value) => (
        Array.isArray(value) &&
        value.length === 1 &&
        Object.getOwnPropertyDescriptor(value, '0')?.value === 'SyncAgent'
      ),
    ],
    ['Meta', (value) => hasExactKeys(value, ['durationMs', 'processedBy'])],
    ['Response', (value) => hasExactKeys(value, RESPONSE_PROPERTY_NAMES)],
  ]

  for (const [label, predicate] of targets) {
    for (const mode of ['throw', 'noop']) {
      await t.test(`${label} / ${mode}`, () => {
        const originalFreezeDescriptor = Object.getOwnPropertyDescriptor(
          Object,
          'freeze'
        )
        const originalFreeze = originalFreezeDescriptor.value
        const sentinel = `fixture-freeze-${label}-${mode}-private-sentinel`
        let targetCalls = 0
        let result

        try {
          installOwnDataProperty(Object, 'freeze', function instrumentedFreeze(value) {
            if (targetCalls === 0 && predicate(value)) {
              targetCalls += 1

              if (mode === 'throw') {
                throw new Error(sentinel)
              }

              return value
            }

            return Reflect.apply(originalFreeze, Object, [value])
          })

          result = createSyncAgent({
            getCurrentTimestamp: () => REFERENCE_TIMESTAMP,
          }).processSyncRequest(createRequest())
        } finally {
          restoreOwnProperty(Object, 'freeze', originalFreezeDescriptor)
        }

        assertFailure(result, FAILURE_PROFILES.agentFailed)
        assert.equal(targetCalls, 1)
        assertNoSentinels(result, [sentinel])
      })
    }
  }
})

test('erkennt valide, aber semantisch veränderte Werte während des Freeze', { concurrency: false }, async (t) => {
  const cases = [
    [
      'Request-Korrelation',
      (value) => hasExactKeys(value, REQUEST_PROPERTY_NAMES),
      (value) => {
        value.requestId = 'req_freeze-mutated'
      },
    ],
    [
      'statische Dauer',
      (value) => hasExactKeys(value, ['durationMs', 'processedBy']),
      (value) => {
        value.durationMs = 1
      },
    ],
    [
      'Response-Zeit',
      (value) => hasExactKeys(value, RESPONSE_PROPERTY_NAMES),
      (value) => {
        value.timestamp = '2026-08-22T12:00:01.000Z'
      },
    ],
  ]

  for (const [label, predicate, mutate] of cases) {
    await t.test(label, () => {
      const originalFreezeDescriptor = Object.getOwnPropertyDescriptor(
        Object,
        'freeze'
      )
      const originalFreeze = originalFreezeDescriptor.value
      let mutationCalls = 0
      let result

      try {
        installOwnDataProperty(Object, 'freeze', function mutatingFreeze(value) {
          if (mutationCalls === 0 && predicate(value)) {
            mutationCalls += 1
            mutate(value)
          }

          return Reflect.apply(originalFreeze, Object, [value])
        })

        result = createSyncAgent({
          getCurrentTimestamp: () => REFERENCE_TIMESTAMP,
        }).processSyncRequest(createRequest())
      } finally {
        restoreOwnProperty(Object, 'freeze', originalFreezeDescriptor)
      }

      assertFailure(result, FAILURE_PROFILES.agentFailed)
      assert.equal(mutationCalls, 1)
    })
  }
})

test('leakt keine Input-, Clock-, Proxy- oder Freeze-Sentinels über Result oder Console', { concurrency: false }, () => {
  const consoleMethods = ['log', 'info', 'warn', 'error', 'debug', 'trace']
  const originalConsoleDescriptors = new Map(
    consoleMethods.map((methodName) => [
      methodName,
      Object.getOwnPropertyDescriptor(console, methodName),
    ])
  )
  const consoleCalls = []
  const originalFreezeDescriptor = Object.getOwnPropertyDescriptor(
    Object,
    'freeze'
  )
  const originalFreeze = originalFreezeDescriptor.value
  const sentinels = [
    'fixture-input-private-sentinel',
    'fixture-clock-private-sentinel',
    'fixture-proxy-private-sentinel',
    'fixture-freeze-private-sentinel',
  ]
  const results = []

  try {
    for (const methodName of consoleMethods) {
      Object.defineProperty(console, methodName, {
        configurable: true,
        writable: true,
        value(...args) {
          consoleCalls.push({ methodName, args })
        },
      })
    }

    results.push(createSyncAgent({
      getCurrentTimestamp: () => REFERENCE_TIMESTAMP,
    }).processSyncRequest({
      ...createRequest(),
      extra: sentinels[0],
    }))
    results.push(createSyncAgent({
      getCurrentTimestamp() {
        throw new Error(sentinels[1])
      },
    }).processSyncRequest(createRequest()))
    results.push(createSyncAgent({
      getCurrentTimestamp: () => REFERENCE_TIMESTAMP,
    }).processSyncRequest(new Proxy(createRequest(), {
      getPrototypeOf() {
        throw new Error(sentinels[2])
      },
    })))

    let freezeThrown = false
    installOwnDataProperty(Object, 'freeze', function throwingFreeze(value) {
      if (!freezeThrown && hasExactKeys(value, REQUEST_PROPERTY_NAMES)) {
        freezeThrown = true
        throw new Error(sentinels[3])
      }

      return Reflect.apply(originalFreeze, Object, [value])
    })
    results.push(createSyncAgent({
      getCurrentTimestamp: () => REFERENCE_TIMESTAMP,
    }).processSyncRequest(createRequest()))
  } finally {
    restoreOwnProperty(Object, 'freeze', originalFreezeDescriptor)

    for (const methodName of consoleMethods) {
      restoreOwnProperty(
        console,
        methodName,
        originalConsoleDescriptors.get(methodName)
      )
    }
  }

  assertFailure(results[0], FAILURE_PROFILES.requestRejected)
  assertFailure(results[1], FAILURE_PROFILES.agentFailed)
  assertFailure(results[2], FAILURE_PROFILES.requestRejected)
  assertFailure(results[3], FAILURE_PROFILES.agentFailed)
  assert.deepEqual(consoleCalls, [])
  assertNoSentinels(results, sentinels)
})

test('isoliert Fehlerzustände und erlaubt danach auf derselben Instanz einen Erfolg', () => {
  let calls = 0
  const api = createSyncAgent({
    getCurrentTimestamp() {
      calls += 1

      if (calls === 1) {
        throw new Error('fixture-first-call-private-sentinel')
      }

      return REFERENCE_TIMESTAMP
    },
  })
  const failed = api.processSyncRequest(createRequest())
  const successfulRequest = createRequest({ requestId: 'req_after-failure' })
  const successful = api.processSyncRequest(successfulRequest)
  const rejectedOne = api.processSyncRequest(null)
  const rejectedTwo = api.processSyncRequest(null)

  assertFailure(failed, FAILURE_PROFILES.agentFailed)
  assertSuccess(successful, successfulRequest)
  assertFailure(rejectedOne, FAILURE_PROFILES.requestRejected)
  assertFailure(rejectedTwo, FAILURE_PROFILES.requestRejected)
  assert.notEqual(rejectedOne, rejectedTwo)
  assert.notEqual(rejectedOne.error, rejectedTwo.error)
  assert.equal(calls, 4)
})

test('verbirgt den terminalen Success-Result vor einem post-import installierten Freeze-Wrapper', { concurrency: false }, () => {
  const request = createRequest({ requestId: 'req_terminal-success-wrapper' })
  const api = createSyncAgent({
    getCurrentTimestamp: () => REFERENCE_TIMESTAMP,
  })
  const freezeDescriptor = Object.getOwnPropertyDescriptor(Object, 'freeze')
  const liveFreeze = freezeDescriptor.value
  let terminalResultCalls = 0
  let result

  try {
    installOwnDataProperty(Object, 'freeze', function mutatingFreeze(value) {
      if (
        hasExactKeys(value, RESULT_PROPERTY_NAMES) &&
        Object.getOwnPropertyDescriptor(value, 'ok')?.value === true
      ) {
        terminalResultCalls += 1
        value.syncResponse = null
      }

      return Reflect.apply(liveFreeze, Object, [value])
    })

    result = api.processSyncRequest(request)
  } finally {
    restoreOwnProperty(Object, 'freeze', freezeDescriptor)
  }

  assert.equal(terminalResultCalls, 0)
  assertSuccess(result, request)
})

test('verbirgt Errorrecord und Failure-Result vor post-import installierten Freeze- und Console-Wrappern', { concurrency: false }, () => {
  const sentinel = 'fixture-terminal-failure-private-sentinel'
  const freezeDescriptor = Object.getOwnPropertyDescriptor(Object, 'freeze')
  const liveFreeze = freezeDescriptor.value
  const consoleMethods = ['log', 'info', 'warn', 'error', 'debug', 'trace']
  const consoleDescriptors = new Map(
    consoleMethods.map((methodName) => [
      methodName,
      Object.getOwnPropertyDescriptor(console, methodName),
    ])
  )
  const consoleCalls = []
  let errorRecordCalls = 0
  let failureResultCalls = 0
  let result

  try {
    for (const methodName of consoleMethods) {
      installOwnDataProperty(console, methodName, function instrumentedConsole(...args) {
        consoleCalls.push({ methodName, args })
      })
    }

    installOwnDataProperty(Object, 'freeze', function mutatingFreeze(value) {
      if (hasExactKeys(value, ['code', 'message'])) {
        errorRecordCalls += 1
        value.rawError = sentinel
      } else if (
        hasExactKeys(value, RESULT_PROPERTY_NAMES) &&
        Object.getOwnPropertyDescriptor(value, 'ok')?.value === false
      ) {
        failureResultCalls += 1
        value.status = sentinel
      }

      return Reflect.apply(liveFreeze, Object, [value])
    })

    result = createSyncAgent({
      getCurrentTimestamp: () => REFERENCE_TIMESTAMP,
    }).processSyncRequest()
  } finally {
    restoreOwnProperty(Object, 'freeze', freezeDescriptor)

    for (const methodName of consoleMethods) {
      restoreOwnProperty(
        console,
        methodName,
        consoleDescriptors.get(methodName)
      )
    }
  }

  assert.equal(errorRecordCalls, 0)
  assert.equal(failureResultCalls, 0)
  assertFailure(result, FAILURE_PROFILES.invalidInvocation)
  assert.deepEqual(consoleCalls, [])
  assertNoSentinels([result, consoleCalls], [sentinel])
})

test('liefert bei dauerhaft werfendem post-import Freeze terminale eingefrorene Fehler statt Throws', { concurrency: false }, () => {
  const sentinel = 'fixture-permanent-freeze-throw-private-sentinel'
  const api = createSyncAgent({
    getCurrentTimestamp: () => REFERENCE_TIMESTAMP,
  })
  const freezeDescriptor = Object.getOwnPropertyDescriptor(Object, 'freeze')
  let invalidInvocation
  let invalidInvocationThrow = null
  let agentFailure
  let agentFailureThrow = null

  try {
    installOwnDataProperty(Object, 'freeze', function throwingFreeze() {
      throw new Error(sentinel)
    })

    try {
      invalidInvocation = api.processSyncRequest()
    } catch (error) {
      invalidInvocationThrow = error
    }

    try {
      agentFailure = api.processSyncRequest(createRequest())
    } catch (error) {
      agentFailureThrow = error
    }
  } finally {
    restoreOwnProperty(Object, 'freeze', freezeDescriptor)
  }

  assert.equal(invalidInvocationThrow, null)
  assert.equal(agentFailureThrow, null)
  assertFailure(invalidInvocation, FAILURE_PROFILES.invalidInvocation)
  assertFailure(agentFailure, FAILURE_PROFILES.agentFailed)
  assertNoSentinels(
    [invalidInvocation, agentFailure],
    [sentinel]
  )
})

test('liefert bei dauerhaftem post-import Freeze-No-op nur sichere eingefrorene API- und Failure-Records', { concurrency: false }, () => {
  const freezeDescriptor = Object.getOwnPropertyDescriptor(Object, 'freeze')
  let api
  let invalidInvocation
  let agentFailure

  try {
    installOwnDataProperty(Object, 'freeze', function noOpFreeze(value) {
      return value
    })

    api = createSyncAgent({
      getCurrentTimestamp: () => REFERENCE_TIMESTAMP,
    })
    invalidInvocation = api.processSyncRequest()
    agentFailure = api.processSyncRequest(createRequest())
  } finally {
    restoreOwnProperty(Object, 'freeze', freezeDescriptor)
  }

  assertOwnEnumerableDataRecord(api, ['processSyncRequest'])
  assertDeepFrozen(api)
  assertFailure(invalidInvocation, FAILURE_PROFILES.invalidInvocation)
  assertFailure(agentFailure, FAILURE_PROFILES.agentFailed)
})

test('lässt kombiniertes Freeze-No-op und falsches globales isFrozen den internen Frozen-Nachweis nicht umgehen', { concurrency: false }, () => {
  const freezeDescriptor = Object.getOwnPropertyDescriptor(Object, 'freeze')
  const isFrozenDescriptor = Object.getOwnPropertyDescriptor(
    Object,
    'isFrozen'
  )
  let api
  let result

  try {
    installOwnDataProperty(Object, 'freeze', function noOpFreeze(value) {
      return value
    })
    installOwnDataProperty(Object, 'isFrozen', function lyingIsFrozen() {
      return true
    })

    api = createSyncAgent({
      getCurrentTimestamp: () => REFERENCE_TIMESTAMP,
    })
    result = api.processSyncRequest(createRequest())
  } finally {
    restoreOwnProperty(Object, 'isFrozen', isFrozenDescriptor)
    restoreOwnProperty(Object, 'freeze', freezeDescriptor)
  }

  assertOwnEnumerableDataRecord(api, ['processSyncRequest'])
  assertDeepFrozen(api)
  assertFailure(result, FAILURE_PROFILES.agentFailed)
})

test('hält terminale Failure-Results bei dauerhaft werfenden post-import Reflection- und Array-Prototypmethoden sicher', { concurrency: false }, async (t) => {
  const fixtures = [
    {
      label: 'Reflect.ownKeys',
      target: Reflect,
      propertyName: 'ownKeys',
    },
    {
      label: 'Object.getPrototypeOf',
      target: Object,
      propertyName: 'getPrototypeOf',
    },
    {
      label: 'Object.getOwnPropertyDescriptor',
      target: Object,
      propertyName: 'getOwnPropertyDescriptor',
    },
    {
      label: 'Object.hasOwn',
      target: Object,
      propertyName: 'hasOwn',
    },
    {
      label: 'Array.prototype.every',
      target: Array.prototype,
      propertyName: 'every',
    },
    {
      label: 'Array.prototype.includes',
      target: Array.prototype,
      propertyName: 'includes',
    },
  ]

  for (let fixtureIndex = 0; fixtureIndex < fixtures.length; fixtureIndex += 1) {
    const fixture = fixtures[fixtureIndex]

    await t.test(fixture.label, { concurrency: false }, () => {
      const sentinel =
        `fixture-terminal-reflection-${fixtureIndex}-private-sentinel`
      const clock = createClock()
      const api = createSyncAgent({ getCurrentTimestamp: clock.clock })
      const factoryClock = createClock()
      const targetDescriptor = Object.getOwnPropertyDescriptor(
        fixture.target,
        fixture.propertyName
      )
      const consoleMethods = ['log', 'info', 'warn', 'error', 'debug', 'trace']
      const consoleDescriptors = new Map(
        consoleMethods.map((methodName) => [
          methodName,
          Object.getOwnPropertyDescriptor(console, methodName),
        ])
      )
      const consoleCalls = []
      const invalidInvocationResults = []
      const invalidInvocationThrows = []
      const agentFailureResults = []
      const agentFailureThrows = []
      let factoryApi
      let factoryThrow = null
      let clockCallsAfterInvalidInvocations

      try {
        for (let index = 0; index < consoleMethods.length; index += 1) {
          const methodName = consoleMethods[index]
          const descriptor = consoleDescriptors.get(methodName)

          Object.defineProperty(console, methodName, {
            ...descriptor,
            value(...args) {
              consoleCalls.push({ methodName, args })
            },
          })
        }

        Object.defineProperty(fixture.target, fixture.propertyName, {
          ...targetDescriptor,
          value() {
            throw new Error(sentinel)
          },
        })

        try {
          factoryApi = createSyncAgent({
            getCurrentTimestamp: factoryClock.clock,
          })
        } catch (error) {
          factoryThrow = error
        }

        for (let index = 0; index < 2; index += 1) {
          try {
            invalidInvocationResults.push(api.processSyncRequest())
          } catch (error) {
            invalidInvocationThrows.push(error)
          }
        }

        clockCallsAfterInvalidInvocations = clock.state.calls

        for (let index = 0; index < 2; index += 1) {
          try {
            agentFailureResults.push(api.processSyncRequest(createRequest({
              requestId: `req_terminal-reflection-${fixtureIndex}-${index}`,
            })))
          } catch (error) {
            agentFailureThrows.push(error)
          }
        }
      } finally {
        restoreOwnProperty(
          fixture.target,
          fixture.propertyName,
          targetDescriptor
        )

        for (let index = 0; index < consoleMethods.length; index += 1) {
          const methodName = consoleMethods[index]
          restoreOwnProperty(
            console,
            methodName,
            consoleDescriptors.get(methodName)
          )
        }
      }

      assert.notEqual(targetDescriptor, undefined)
      assert.equal(factoryThrow, null)
      assertOwnEnumerableDataRecord(api, ['processSyncRequest'])
      assertOwnEnumerableDataRecord(factoryApi, ['processSyncRequest'])
      assertDeepFrozen(api)
      assertDeepFrozen(factoryApi)
      assert.equal(factoryApi.processSyncRequest.length, 1)
      assert.equal(factoryClock.state.calls, 0)
      assert.deepEqual(invalidInvocationThrows, [])
      assert.deepEqual(agentFailureThrows, [])
      assert.equal(clockCallsAfterInvalidInvocations, 0)
      assert.equal(clock.state.calls, 2)
      assert.equal(invalidInvocationResults.length, 2)
      assert.equal(agentFailureResults.length, 2)

      for (let index = 0; index < invalidInvocationResults.length; index += 1) {
        assertFailure(
          invalidInvocationResults[index],
          FAILURE_PROFILES.invalidInvocation
        )
        assertFailure(
          agentFailureResults[index],
          FAILURE_PROFILES.agentFailed
        )
      }

      const allResults = [
        invalidInvocationResults[0],
        invalidInvocationResults[1],
        agentFailureResults[0],
        agentFailureResults[1],
      ]

      for (let leftIndex = 0; leftIndex < allResults.length; leftIndex += 1) {
        for (
          let rightIndex = leftIndex + 1;
          rightIndex < allResults.length;
          rightIndex += 1
        ) {
          assert.notEqual(allResults[leftIndex], allResults[rightIndex])
          assert.notEqual(
            allResults[leftIndex].error,
            allResults[rightIndex].error
          )
        }
      }

      assert.deepEqual(consoleCalls, [])
      assertNoSentinels(
        [allResults, consoleCalls],
        [sentinel]
      )
    })
  }
})

test('erzeugt die Factory-API nach Import auch unter globalem Freeze-No-op oder Freeze-Throw sicher', { concurrency: false }, async (t) => {
  for (const mode of ['noop', 'throw']) {
    await t.test(mode, () => {
      const freezeDescriptor = Object.getOwnPropertyDescriptor(
        Object,
        'freeze'
      )
      let api
      let factoryThrow = null

      try {
        installOwnDataProperty(Object, 'freeze', function replacedFreeze(value) {
          if (mode === 'throw') {
            throw new Error('fixture-factory-freeze-private-sentinel')
          }

          return value
        })

        try {
          api = createSyncAgent({
            getCurrentTimestamp: () => REFERENCE_TIMESTAMP,
          })
        } catch (error) {
          factoryThrow = error
        }
      } finally {
        restoreOwnProperty(Object, 'freeze', freezeDescriptor)
      }

      assert.equal(factoryThrow, null)
      assertOwnEnumerableDataRecord(api, ['processSyncRequest'])
      assertDeepFrozen(api)
      assert.equal(api.processSyncRequest.length, 1)
    })
  }
})

test('prüft Success-Result-Status und Response-Identität mutationswirksam', { concurrency: false }, async (t) => {
  const resultConstruction = [
    "    status: 'syncResponseCreated',",
    '    syncResponse,',
    '    error: null,',
  ].join('\n')
  const cases = [
    {
      label: 'falscher Status',
      replacement: [
        "    status: 'fixtureCorruptedStatus',",
        '    syncResponse,',
        '    error: null,',
      ].join('\n'),
      sentinel: 'fixtureCorruptedStatus',
    },
    {
      label: 'falsche Response-Identität',
      replacement: [
        "    status: 'syncResponseCreated',",
        '    syncResponse: null,',
        '    error: null,',
      ].join('\n'),
      sentinel: 'fixture-wrong-response-identity-private-sentinel',
    },
  ]

  for (const fixture of cases) {
    await t.test(fixture.label, async () => {
      await withTemporarySyncAgent({
        agentMutations: [{
          label: `Success-Result-Mutation: ${fixture.label}`,
          search: resultConstruction,
          replacement: fixture.replacement,
        }],
      }, async (createMutatedSyncAgent) => {
        const result = createMutatedSyncAgent({
          getCurrentTimestamp: () => REFERENCE_TIMESTAMP,
        }).processSyncRequest(createRequest({
          requestId: `req_success_result_${fixture.label === 'falscher Status'
            ? 'status'
            : 'identity'}`,
        }))

        assertFailure(result, FAILURE_PROFILES.agentFailed)
        assertNoSentinels(result, [fixture.sentinel])
      })
    })
  }
})

test('belegt Caller-Nichtmutation vollständig descriptorbasiert und prüft mutationswirksame Gegenkontrollen', async (t) => {
  for (const [label, request] of [
    ['gewöhnlicher Request', createRequest({ requestId: 'req_snapshot-ordinary' })],
    [
      'Null-Prototyp-Request',
      createNullPrototypeRequest({ requestId: 'req_snapshot-null-prototype' }),
    ],
  ]) {
    await t.test(label, () => {
      const rootBefore = captureOwnDescriptorSnapshot(request)
      const payloadBefore = captureOwnDescriptorSnapshot(request.payload)
      const result = createSyncAgent({
        getCurrentTimestamp: () => REFERENCE_TIMESTAMP,
      }).processSyncRequest(request)
      const rootAfter = captureOwnDescriptorSnapshot(request)
      const payloadAfter = captureOwnDescriptorSnapshot(request.payload)

      assertSuccess(result, request)
      assertOwnDescriptorSnapshotEqual(rootBefore, rootAfter)
      assertOwnDescriptorSnapshotEqual(payloadBefore, payloadAfter)
      assert.equal(rootAfter.identity, request)
      assert.equal(payloadAfter.identity, request.payload)
    })
  }

  await t.test('Gegenkontrolle erkennt timestamp-Mutation nach Projektion', () => {
    const request = createRequest({ requestId: 'req_snapshot-timestamp-control' })
    const before = captureOwnDescriptorSnapshot(request)
    const projected = createExpectedCorrelation(request)

    request.timestamp = '2026-08-22T11:59:58.125Z'

    assert.equal(projected.timestamp, REQUEST_TIMESTAMP)
    assert.throws(
      () => assertOwnDescriptorSnapshotEqual(
        before,
        captureOwnDescriptorSnapshot(request)
      ),
      (error) => error instanceof assert.AssertionError
    )
  })

  await t.test('Gegenkontrolle erkennt Payload-Zusatzfeld nach Projektion', () => {
    const request = createRequest({ requestId: 'req_snapshot-payload-control' })
    const before = captureOwnDescriptorSnapshot(request.payload)
    const projected = createExpectedCorrelation(request)

    request.payload.fixtureAfterProjection = true

    assert.deepEqual(projected.payload, {})
    assert.throws(
      () => assertOwnDescriptorSnapshotEqual(
        before,
        captureOwnDescriptorSnapshot(request.payload)
      ),
      (error) => error instanceof assert.AssertionError
    )
  })
})

test('führt den echten Default-Clock-Pfad exakt einmal aus und redigiert dessen Constructor-Throw', { concurrency: false }, async (t) => {
  await t.test('kanonischer Default-Zeitstempel', () => {
    const dateDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'Date')
    const OriginalDate = dateDescriptor.value
    let noArgumentConstructions = 0
    let result

    try {
      const InstrumentedDate = new Proxy(OriginalDate, {
        apply(target, thisArgument, argumentList) {
          return Reflect.apply(target, thisArgument, argumentList)
        },
        construct(target, argumentList) {
          if (argumentList.length === 0) {
            noArgumentConstructions += 1
            return Reflect.construct(target, [REFERENCE_TIMESTAMP], target)
          }

          return Reflect.construct(target, argumentList, target)
        },
      })

      installOwnDataProperty(globalThis, 'Date', InstrumentedDate)
      result = createSyncAgent().processSyncRequest(createRequest({
        requestId: 'req_default-clock-success',
      }))
    } finally {
      restoreOwnProperty(globalThis, 'Date', dateDescriptor)
    }

    assert.equal(noArgumentConstructions, 1)
    assertSuccess(
      result,
      createRequest({ requestId: 'req_default-clock-success' })
    )
    assert.equal(result.syncResponse.timestamp, REFERENCE_TIMESTAMP)
  })

  await t.test('werfender Default-Clock-Constructor', () => {
    const sentinel = 'fixture-default-clock-constructor-private-sentinel'
    const dateDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'Date')
    const OriginalDate = dateDescriptor.value
    let noArgumentConstructions = 0
    let result
    let escapedThrow = null

    try {
      const ThrowingDate = new Proxy(OriginalDate, {
        apply(target, thisArgument, argumentList) {
          return Reflect.apply(target, thisArgument, argumentList)
        },
        construct(target, argumentList) {
          if (argumentList.length === 0) {
            noArgumentConstructions += 1
            throw new Error(sentinel)
          }

          return Reflect.construct(target, argumentList, target)
        },
      })

      installOwnDataProperty(globalThis, 'Date', ThrowingDate)

      try {
        result = createSyncAgent().processSyncRequest(createRequest({
          requestId: 'req_default-clock-throw',
        }))
      } catch (error) {
        escapedThrow = error
      }
    } finally {
      restoreOwnProperty(globalThis, 'Date', dateDescriptor)
    }

    assert.equal(noArgumentConstructions, 1)
    assert.equal(escapedThrow, null)
    assertFailure(result, FAILURE_PROFILES.agentFailed)
    assertNoSentinels(result, [sentinel])
  })
})

test('teilt zwischen getrennten agentFailed-Aufrufen weder Result- noch Erroridentität', () => {
  const api = createSyncAgent({
    getCurrentTimestamp() {
      throw new Error('fixture-fresh-agent-failure-private-sentinel')
    },
  })
  const first = api.processSyncRequest(createRequest({
    requestId: 'req_fresh-agent-failure-one',
  }))
  const second = api.processSyncRequest(createRequest({
    requestId: 'req_fresh-agent-failure-two',
  }))

  assertFailure(first, FAILURE_PROFILES.agentFailed)
  assertFailure(second, FAILURE_PROFILES.agentFailed)
  assert.notEqual(first, second)
  assert.notEqual(first.error, second.error)
})

test('hält die private Agent-Policy bei erweiterten und umgeordneten Contractlisten fest', { concurrency: false }, async () => {
  const contractMutations = [
    {
      label: 'Contract-Actions-Erweiterung und -Umordnung',
      search:
        "export const SYNC_CONTRACT_ACTIONS = Object.freeze(['syncTest'])",
      replacement:
        "export const SYNC_CONTRACT_ACTIONS = Object.freeze(['futureAction', 'syncTest'])",
    },
    {
      label: 'Contract-Handlers-Erweiterung und -Umordnung',
      search:
        "export const SYNC_CONTRACT_HANDLERS = Object.freeze(['SyncAgent'])",
      replacement:
        "export const SYNC_CONTRACT_HANDLERS = Object.freeze(['FutureAgent', 'SyncAgent'])",
    },
    {
      label: 'Contract-Data-Origins-Erweiterung und -Umordnung',
      search:
        "export const SYNC_CONTRACT_DATA_ORIGINS = Object.freeze(['synthetic'])",
      replacement:
        "export const SYNC_CONTRACT_DATA_ORIGINS = Object.freeze(['future', 'synthetic'])",
    },
  ]

  await withTemporarySyncAgent({ contractMutations }, async (createMutatedSyncAgent) => {
    const api = createMutatedSyncAgent({
      getCurrentTimestamp: () => REFERENCE_TIMESTAMP,
    })
    const syncTestRequest = createRequest({
      requestId: 'req_mutated-contract-sync-test',
    })
    const futureActionRequest = createRequest({
      action: 'futureAction',
      requestId: 'req_mutated-contract-future-action',
    })
    const syncTestResult = api.processSyncRequest(syncTestRequest)
    const futureActionResult = api.processSyncRequest(futureActionRequest)

    assertSuccess(syncTestResult, syncTestRequest)
    assert.equal(syncTestResult.syncResponse.handledBy, 'SyncAgent')
    assert.deepEqual(
      syncTestResult.syncResponse.meta.processedBy,
      ['SyncAgent']
    )
    assert.equal(syncTestResult.syncResponse.data.dataOrigin, 'synthetic')
    assertFailure(
      futureActionResult,
      FAILURE_PROFILES.requestRejected
    )
  })
})
