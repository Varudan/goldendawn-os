import assert from 'node:assert/strict'
import { createHash, randomBytes } from 'node:crypto'
import {
  mkdtemp,
  readFile,
  realpath,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { types as utilTypes } from 'node:util'
import vm from 'node:vm'

import * as diagnosticObserverModule from
  '../scripts/browser/browserSyncTransportRuntimeDiagnosticObserver.js'

const {
  createBrowserSyncTransportRuntimeDiagnosticObserver,
} = diagnosticObserverModule

const PRODUCTION_MODULE_URL = new URL(
  '../scripts/browser/browserSyncTransportRuntimeDiagnosticObserver.js',
  import.meta.url
)
const REPOSITORY_ROOT = fileURLToPath(new URL('../', import.meta.url))
const PRIVATE_EXPORT_ANCHOR =
  '// ADR-0035-CONFORMANCE-EXPORT-ANCHOR-V2'

const PUBLIC_EXPORT_NAME =
  'createBrowserSyncTransportRuntimeDiagnosticObserver'
const PRIVATE_TEST_EXPORT_NAMES = Object.freeze([
  'createBrowserSyncTransportRuntimeDiagnosticRunMachine',
  'deriveCandidateFinding',
  'deriveCandidateObserverGate',
  'requestBrowserSyncTransportRuntimeDiagnosticExchange',
])
const TEST_EXPORT_DECLARATION = [
  'export {',
  '  deriveCandidateObserverGate,',
  '  deriveCandidateFinding,',
  '  createBrowserSyncTransportRuntimeDiagnosticRunMachine,',
  '  requestBrowserSyncTransportRuntimeDiagnosticExchange,',
  '};',
].join('\n')

const HISTORICAL_COMMIT = '8001cc7eb7d2fed68c5ca4061514b486a204ac44'
const REPLAY_COMMIT = '6f0fd7d883efe284c574de295b195de1dd50396a'
const EVALUATION_SHA256 =
  'a623ffafee8dfcbc1d2ddc374cc35f0dbf800defd97619a3b58337d972090f7b'
const EXPECTED_FACTORY_ERROR =
  'invalidBrowserSyncTransportRuntimeDiagnosticObserverDependencies'
const EXPECTED_FOUNDATION_ERROR = Object.freeze({
  code: 'BROWSER_TRANSPORT_DIAGNOSTIC_FOUNDATION_FAILED',
  message: 'Die Browser-Transport-Diagnosefoundation ist fehlgeschlagen.',
})
const TOP_LEVEL_URL = 'http://127.0.0.1:5173/'
const ENDPOINT_URL = 'http://127.0.0.1:8787/api/sync-test'

const INTENT_KINDS = Object.freeze([
  'capability-probe',
  'controller-clock-sample',
  'cap-arm',
  'cap-cancel',
  'protocol-command-send',
  'observation-dequeue',
  'cleanup-step',
])
const EXTERNAL_CLEANUP_FACT_IDS = Object.freeze([
  'debugPipeClosed',
  'browserStopped',
  'devServerStopped',
  'gatewayStopped',
  'profileRemoved',
  'harnessFragmentsRemoved',
  'permissionSiteCacheAndServiceWorkerStateCleared',
  'environmentRestored',
  'portsFree',
  'repositoryAndIndexRestored',
  'historicalEvidenceHashUnchanged',
  'observerStorageLogAndTelemetryResidueAbsent',
])
const PROTOCOL_COMMANDS = Object.freeze([
  'Target.getTargets',
  'Target.attachToTarget',
  'Network.enable',
  'Runtime.evaluate',
  'Network.disable',
  'Target.detachFromTarget',
])
const FOUNDATION_RESULT_KEYS = Object.freeze([
  'ok',
  'resultType',
  'evidenceStatus',
  'runtimeAuthorized',
  'persistenceAuthorized',
  'recordProjection',
  'error',
])
const FOUNDATION_PROJECTION_KEYS = Object.freeze([
  'schemaVersion',
  'projectionType',
  'diagnosticRunId',
  'observedAt',
  'timeZone',
  'historicalEvidence',
  'replay',
  'observer',
  'requestBudget',
  'publicSettlement',
  'stages',
  'timing',
  'cleanup',
  'adr0029OverallGate',
  'candidateObserverGate',
  'candidateFinding',
  'causeStatus',
])

let freshImportSequence = 0

const HISTORICAL_REPLAY_VALUES = Object.freeze([
  ['artifact.transport.src/transports/browserSyncTransport.js.sha256', '3c41b17e1d80e94e4b05e7c76f019d3fd3af281b451e85c8f90d80fd25391c28'],
  ['artifact.contract.src/contracts/syncContract.js.sha256', '96ad2c52fb4545d6e587d9b3fd86d76a4a735e8cb33e9b572a3d7d5f4e5a6aeb'],
  ['artifact.gateway.server/startLocalSyncGateway.js.sha256', '677be5e9cace926ba0a1f3540e39926f5b5c54dd57440bd1ac53de6f255ca6d5'],
  ['artifact.gateway.server/localSyncGatewayRuntimeConfig.js.sha256', 'e9a4419666e33b57d1ed5712e00f3d954a5b82c1cc7956b9a7582e0462743836'],
  ['artifact.gateway.server/localSyncGatewayHttpServer.js.sha256', '70243e66f85448c23920ea30409a03be7ed349b6868535729f4a798f012fdbb8'],
  ['artifact.gateway.src/gateways/syncGatewayRequestBoundary.js.sha256', 'b1e55f03283bfdd1d35562951503471b4a812ac61868af0b927a05623e597b79'],
  ['artifact.gateway.src/agents/syncAgent.js.sha256', '899e06d3a80925cab8680749d133e9a8d87f30a2fd1d509cf7339eb1c8d65db0'],
  ['artifact.frontend.runtime-source-set.sha256', '6f3d5740b043308b4d38df33b6293c9064d8dd1b3f0c5801d50844336c195591'],
  ['repository.state', 'clean'],
  ['hostRuntime.executionClass', 'local-disposable'],
  ['operatingSystem.family', 'windows'],
  ['operatingSystem.edition', 'Windows 11 Home'],
  ['operatingSystem.architecture', 'x64'],
  ['operatingSystem.version', '25H2'],
  ['operatingSystem.build', '26200'],
  ['operatingSystem.patch', '9168'],
  ['node.version', '24.19.0'],
  ['browser.product', 'chrome'],
  ['browser.channel', 'stable'],
  ['browser.version', '151.0.7922.174'],
  ['browser.engine', 'blink'],
  ['browser.engineBuild', '@39c51c70dd5feca6b6aba5bb7997b595011c553d'],
  ['browser.executionMode', 'visible'],
  ['browser.privateMode', true],
  ['profile.lifecycle', 'fresh-disposable'],
  ['profile.extensions', 'none'],
  ['profile.startParameters', 'effective-non-bypassing'],
  ['profile.featureFlags', 'none-effective'],
  ['profile.enterprisePolicies', 'none-effective'],
  ['networkEnvironment.proxy', 'inactive'],
  ['networkEnvironment.vpn', 'inactive'],
  ['initialState.serviceWorker', 'absent'],
  ['initialState.permission', 'prompt'],
  ['initialState.preflightCache', 'empty-confirmed'],
  ['initialState.siteCache', 'empty-confirmed'],
  ['bindingComparisonProfile', 'ephemeral-exact-effective-context-comparison-without-retention'],
  ['frontend.topLevelUrl', 'http://127.0.0.1:5173/'],
  ['frontend.serializedOrigin', 'http://127.0.0.1:5173'],
  ['frontend.contextKind', 'top-level'],
  ['frontend.isSecureContext', true],
  ['transportRequest.factoryProfile', 'real-default-factory'],
  ['transportRequest.compositionProfile', 'transport-only'],
  ['transportRequest.requestProfile', 'synthetic-v1-syncTest-empty-payload'],
  ['transportRequest.requestEqualityMethod', 'ephemeral-full-value-comparison-without-retention'],
  ['transportRequest.initialUrl', 'http://127.0.0.1:8787/api/sync-test'],
  ['transportRequest.initialScheme', 'http'],
  ['transportRequest.initialHost', '127.0.0.1'],
  ['transportRequest.initialPort', 8787],
  ['transportRequest.initialPath', '/api/sync-test'],
  ['transportRequest.requestInitProfile', 'adr-0028-fixed'],
  ['gateway.listenerHost', '127.0.0.1'],
  ['gateway.listenerPort', 8787],
  ['gateway.portEnvironmentValue', '"8787"'],
  ['gateway.allowedOrigin.value', 'http://127.0.0.1:5173'],
  ['gateway.allowedOrigin.relationToFrontend', 'matches-frontend-origin'],
  ['gateway.endpoint', 'http://127.0.0.1:8787/api/sync-test'],
  ['gateway.responderProfile', 'production-gateway'],
  ['gateway.responseProfile', 'adr-0020-options204-post200-syncresponse-v1'],
  ['toolchain.vite.lockfileVersion', '8.1.4'],
])

function deepFreeze(value) {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) {
    return value
  }

  for (const key of Reflect.ownKeys(value)) {
    deepFreeze(value[key])
  }

  return Object.freeze(value)
}

function createValidRunBinding({
  replayOverrides = new Map(),
  rootOverrides = {},
} = {}) {
  const replayOperands = HISTORICAL_REPLAY_VALUES.map(([fieldId, value]) => ({
    fieldId,
    observationState: replayOverrides.has(fieldId)
      ? replayOverrides.get(fieldId).observationState
      : 'observed',
    replayValue: replayOverrides.has(fieldId)
      ? replayOverrides.get(fieldId).replayValue
      : value,
  }))

  return {
    diagnosticRunId: 'adr-0035-foundation-test-01',
    observedAt: '2026-09-05T12:00:00.000Z',
    timeZone: 'Europe/Berlin',
    replayContextId: 'adr-0035-replay-test-01',
    repositoryCommit: REPLAY_COMMIT,
    profileInstanceObservation: {
      newInstanceObserved: true,
      historicalInstanceReuseObserved: false,
    },
    unexplainedCausalDeviationObservation: {
      reviewCompleted: true,
      deviationObserved: false,
    },
    replayOperands,
    viteRuntimeVersionObservation: '8.1.4',
    ...rootOverrides,
  }
}

function cloneTree(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => cloneTree(entry))
  }
  if (value !== null && typeof value === 'object') {
    const clone = {}
    for (const key of Reflect.ownKeys(value)) {
      clone[key] = cloneTree(value[key])
    }
    return clone
  }
  return value
}

function createReplayVariant(index, {
  fieldId,
  observationState,
  replayValue,
} = {}) {
  const runBinding = cloneTree(createValidRunBinding())
  const entry = runBinding.replayOperands[index]
  if (fieldId !== undefined) {
    entry.fieldId = fieldId
  }
  if (observationState !== undefined) {
    entry.observationState = observationState
  }
  if (replayValue !== undefined || observationState !== undefined) {
    entry.replayValue = replayValue
  }
  return runBinding
}

function createRootVariant(key, value) {
  const runBinding = cloneTree(createValidRunBinding())
  runBinding[key] = value
  return runBinding
}

function createNotificationProbe() {
  const calls = []
  function observationClosed() {
    calls.push({ receiver: this, argumentCount: arguments.length })
  }
  return { calls, observationClosed }
}

function createObserverOptions(runBinding = createValidRunBinding(), exchange) {
  return {
    effectPort: {
      exchange: exchange ?? (() => new Promise(() => {})),
      observationClosed: createNotificationProbe().observationClosed,
    },
    runBinding,
  }
}

function assertFactoryDependencyError(invocation) {
  assert.throws(
    invocation,
    (error) => error instanceof TypeError
      && error.message === EXPECTED_FACTORY_ERROR
  )
}

function assertFactoryAccepts(runBinding) {
  const api = createBrowserSyncTransportRuntimeDiagnosticObserver(
    createObserverOptions(runBinding)
  )
  assertFrozenOrdinaryRecord(api, ['run'])
}

function createDescriptorObservationTree(
  value,
  label,
  observations,
  childrenAlreadyWrapped = false
) {
  if (value === null || typeof value !== 'object') {
    return value
  }

  const target = Array.isArray(value) ? [] : {}
  for (const key of Reflect.ownKeys(value)) {
    if (key === 'length') {
      continue
    }
    target[key] = childrenAlreadyWrapped
      ? value[key]
      : createDescriptorObservationTree(
          value[key],
          `${label}.${String(key)}`,
          observations
        )
  }
  const observation = {
    descriptorCalls: new Map(),
    getCalls: 0,
    label,
    ownKeysCalls: 0,
    prototypeCalls: 0,
    target,
  }
  observations.push(observation)

  return new Proxy(target, {
    get() {
      observation.getCalls += 1
      throw new Error(`forbidden-free-read:${label}`)
    },
    getOwnPropertyDescriptor(currentTarget, key) {
      observation.descriptorCalls.set(
        key,
        (observation.descriptorCalls.get(key) ?? 0) + 1
      )
      return Reflect.getOwnPropertyDescriptor(currentTarget, key)
    },
    getPrototypeOf(currentTarget) {
      observation.prototypeCalls += 1
      return Reflect.getPrototypeOf(currentTarget)
    },
    ownKeys(currentTarget) {
      observation.ownKeysCalls += 1
      return Reflect.ownKeys(currentTarget)
    },
  })
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function countOccurrences(source, search) {
  let count = 0
  let offset = 0

  while (true) {
    const index = source.indexOf(search, offset)
    if (index === -1) {
      return count
    }
    count += 1
    offset = index + search.length
  }
}

function toBuffer(value) {
  return Buffer.isBuffer(value) ? value : Buffer.from(value, 'utf8')
}

function countBufferOccurrences(source, search) {
  const sourceBytes = toBuffer(source)
  const searchBytes = toBuffer(search)
  let count = 0
  let offset = 0

  while (true) {
    const index = sourceBytes.indexOf(searchBytes, offset)
    if (index === -1) {
      return count
    }
    count += 1
    offset = index + searchBytes.byteLength
  }
}

function replaceBufferExactlyOnce(source, search, replacement, label) {
  const sourceBytes = toBuffer(source)
  const searchBytes = toBuffer(search)
  const replacementBytes = toBuffer(replacement)
  assert.equal(
    countBufferOccurrences(sourceBytes, searchBytes),
    1,
    `${label} muss exakt einen Rohbyte-Treffer besitzen`
  )
  const index = sourceBytes.indexOf(searchBytes)
  return Buffer.concat([
    sourceBytes.subarray(0, index),
    replacementBytes,
    sourceBytes.subarray(index + searchBytes.byteLength),
  ])
}

function replaceExactlyOnce(source, search, replacement, label) {
  assert.equal(
    countOccurrences(source, search),
    1,
    `${label} muss exakt einen lexikalischen Treffer besitzen`
  )
  const changed = source.replace(search, replacement)
  assert.equal(
    countOccurrences(changed, search),
    replacement.includes(search) ? 1 : 0,
    `${label} muss nach der Änderung eindeutig bleiben`
  )
  return changed
}

async function assertPathAbsent(targetPath) {
  await assert.rejects(
    stat(targetPath),
    (error) => error !== null && error.code === 'ENOENT'
  )
}

async function withTemporaryDiagnosticObserverCopy({
  anchor,
  kind = 'conformance',
  mutate = null,
}, callback) {
  const repositoryRoot = await realpath(REPOSITORY_ROOT)
  const temporaryRoot = await mkdtemp(
    path.join(tmpdir(), 'goldendawn-adr-0035-foundation-')
  )
  const resolvedTemporaryRoot = await realpath(temporaryRoot)
  const relativeToRepository = path.relative(
    repositoryRoot,
    resolvedTemporaryRoot
  )
  assert.equal(
    relativeToRepository === '..'
      || relativeToRepository.startsWith(`..${path.sep}`),
    true,
    'die Testkopie muss außerhalb des Repositorys liegen'
  )

  const nonce = randomBytes(12).toString('hex')
  assert.equal(typeof kind, 'string')
  const copyName =
    `browserSyncTransportRuntimeDiagnosticObserver.${nonce}.conformance.mjs`
  const copyPath = path.join(resolvedTemporaryRoot, copyName)

  try {
    const productionBytes = await readFile(PRODUCTION_MODULE_URL)
    await writeFile(copyPath, productionBytes)
    const copiedBytes = await readFile(copyPath)

    assert.equal(copiedBytes.byteLength, productionBytes.byteLength)
    assert.equal(sha256(copiedBytes), sha256(productionBytes))
    assert.deepEqual(copiedBytes, productionBytes)

    const anchorBytes = Buffer.from(anchor, 'utf8')
    assert.equal(countBufferOccurrences(productionBytes, anchorBytes), 1)

    let instrumentedBytes = replaceBufferExactlyOnce(
      productionBytes,
      anchorBytes,
      Buffer.concat([
        Buffer.from(`${TEST_EXPORT_DECLARATION}\n\n`, 'utf8'),
        anchorBytes,
      ]),
      'ADR-0035-Exportanker'
    )
    assert.equal(countBufferOccurrences(instrumentedBytes, anchorBytes), 1)
    assert.equal(
      countBufferOccurrences(instrumentedBytes, TEST_EXPORT_DECLARATION),
      1
    )

    if (mutate !== null) {
      instrumentedBytes = mutate(instrumentedBytes, replaceBufferExactlyOnce)
    }

    await writeFile(copyPath, instrumentedBytes)
    const importBytes = await readFile(copyPath)
    assert.equal(sha256(importBytes), sha256(instrumentedBytes))
    assert.deepEqual(importBytes, instrumentedBytes)
    const namespace = await import(pathToFileURL(copyPath).href)
    assert.deepEqual(
      Object.keys(namespace),
      [...PRIVATE_TEST_EXPORT_NAMES, PUBLIC_EXPORT_NAME].sort()
    )
    await callback({
      namespace,
      productionBytes,
      productionSource: productionBytes.toString('utf8'),
      instrumentedSource: instrumentedBytes.toString('utf8'),
      instrumentedBytes,
    })
  } finally {
    await rm(resolvedTemporaryRoot, { recursive: true, force: true })
    await assertPathAbsent(resolvedTemporaryRoot)
    await assertPathAbsent(copyPath)
  }
}

function assertFrozenOrdinaryRecord(value, expectedKeys) {
  assert.equal(value !== null && typeof value === 'object', true)
  assert.equal(Object.getPrototypeOf(value), Object.prototype)
  assert.equal(Object.isFrozen(value), true)
  assert.deepEqual(Reflect.ownKeys(value), expectedKeys)

  for (const key of expectedKeys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)
    assert.equal(descriptor.enumerable, true)
    assert.equal(descriptor.writable, false)
    assert.equal(descriptor.configurable, false)
    assert.equal(Object.hasOwn(descriptor, 'get'), false)
    assert.equal(Object.hasOwn(descriptor, 'set'), false)
  }
}

function assertDeepFrozenGraph(value, seen = new Set()) {
  if (value === null || typeof value !== 'object' || seen.has(value)) {
    return
  }
  seen.add(value)
  assert.equal(Object.isFrozen(value), true)
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)
    if (Object.hasOwn(descriptor, 'value')) {
      assertDeepFrozenGraph(descriptor.value, seen)
    }
  }
}

function assertFoundationResult(result) {
  assert.equal(result !== null && typeof result === 'object', true)
  assert.equal(Object.getPrototypeOf(result), null)
  assert.equal(Object.isFrozen(result), true)
  assert.deepEqual(Reflect.ownKeys(result), FOUNDATION_RESULT_KEYS)
  assert.equal(Object.hasOwn(result, 'then'), false)
  assert.equal(
    result.resultType,
    'browser-transport-diagnostic-foundation-run-v1'
  )
  assert.equal(result.evidenceStatus, 'NOT_EVIDENCE')
  assert.equal(result.runtimeAuthorized, false)
  assert.equal(result.persistenceAuthorized, false)
  if (result.recordProjection !== null) {
    const pair = [
      result.recordProjection.candidateObserverGate,
      result.recordProjection.candidateFinding,
    ]
    assert.equal(
      pair[0] === 'FAIL' && pair[1] === 'observer-invalid' ||
      pair[0] === 'UNPROVEN' && pair[1] === 'inconclusive',
      true,
      `unerlaubte oeffentliche Gate-/Finding-Domain: ${pair.join('/')}`
    )
    assert.notEqual(pair[0], 'PASS')
  }
}

function restoreOwnProperty(target, key, descriptor) {
  if (descriptor === undefined) {
    Reflect.deleteProperty(target, key)
    return
  }
  Object.defineProperty(target, key, descriptor)
}

function normalizePromise(candidate) {
  for (const propertyName of Reflect.ownKeys(candidate)) {
    const descriptor = Object.getOwnPropertyDescriptor(candidate, propertyName)
    if (descriptor !== undefined && descriptor.configurable === true) {
      Reflect.deleteProperty(candidate, propertyName)
    }
  }
  return candidate
}

function createCleanDeferred() {
  let rejectPromise
  let resolvePromise
  const promise = normalizePromise(new Promise((resolve, reject) => {
    resolvePromise = resolve
    rejectPromise = reject
  }))
  return {
    promise,
    reject: rejectPromise,
    resolve: resolvePromise,
  }
}

function createInternalRunBinding() {
  return deepFreeze(cloneTree(createValidRunBinding()))
}

function snapshotJoinState(machine, receivedIntents, capabilityCalls) {
  return {
    activeObservationClosed: machine.activeObservationClosed,
    observationNotificationState: machine.observationNotificationState,
    observationNotificationViolation: machine.observationNotificationViolation,
    capabilityCallCount: machine.capabilityCallCount,
    capabilityCalls,
    cleanupLedger: machine.cleanupLedger,
    currentExchangeCount: machine.currentExchangeCount,
    intentCount: machine.intentCount,
    lease: machine.lease,
    nextIntentId: machine.nextIntentId,
    pendingInternalExchangeViolation:
      machine.pendingInternalExchangeViolation,
    portCallCount: machine.portCallCount,
    preCleanupObservationSnapshot: machine.preCleanupObservationSnapshot,
    protocolSendCount: machine.protocolSendCount,
    receivedIntentCount: receivedIntents.length,
    runSettlementCount: machine.runSettlementCount,
  }
}

function assertOnlyJoinClassificationChanged(before, after, phase) {
  assert.equal(after.activeObservationClosed, before.activeObservationClosed)
  assert.equal(after.observationNotificationState, before.observationNotificationState)
  assert.equal(after.observationNotificationViolation, before.observationNotificationViolation)
  assert.equal(after.intentCount - before.intentCount, 0)
  assert.equal(after.nextIntentId - before.nextIntentId, 0)
  assert.equal(after.portCallCount - before.portCallCount, 0)
  assert.equal(after.protocolSendCount - before.protocolSendCount, 0)
  assert.equal(after.capabilityCallCount - before.capabilityCallCount, 0)
  assert.equal(after.receivedIntentCount - before.receivedIntentCount, 0)
  assert.equal(after.capabilityCalls - before.capabilityCalls, 0)
  assert.equal(after.currentExchangeCount, 1)
  assert.equal(after.lease, 'observable-pending')
  assert.equal(after.pendingInternalExchangeViolation, phase)
  assert.equal(after.runSettlementCount, before.runSettlementCount)
  assert.equal(
    after.preCleanupObservationSnapshot,
    before.preCleanupObservationSnapshot
  )
  assert.equal(after.cleanupLedger, before.cleanupLedger)
}

function normalFulfillmentForIntent(intent) {
  if (intent.kind === 'capability-probe') {
    return {
      kind: 'capability-probe-result',
      profile: 'adr-0033-foundation-effect-port-v1',
      capabilitySet: 'clock-cap-send-dequeue-cleanup-v1',
    }
  }
  if (intent.kind === 'controller-clock-sample') {
    const monotonicMilliseconds = intent.payload.reason === 'setup-origin'
      ? 100
      : (intent.payload.reason === 'setup-dequeue-before-reflection'
          ? 6100
          : 6100)
    return {
      kind: 'controller-clock-sample-result',
      reason: intent.payload.reason,
      monotonicMilliseconds,
    }
  }
  if (intent.kind === 'cap-arm') {
    return {
      kind: 'cap-arm-result',
      capKind: intent.payload.capKind,
      armState: intent.payload.capKind === 'capture' ? 'pending' : 'armed',
    }
  }
  if (intent.kind === 'cap-cancel') {
    return {
      kind: 'cap-cancel-result',
      capKind: intent.payload.capKind,
      armIntentId: intent.payload.armIntentId,
      cancelState: 'cancelled',
    }
  }
  if (intent.kind === 'protocol-command-send') {
    return {
      kind: 'protocol-command-send-result',
      commandId: intent.payload.commandId,
      sendState: intent.payload.command === 'Runtime.evaluate'
        ? 'sent-and-capture-cap-started'
        : 'sent',
    }
  }
  if (intent.kind === 'cleanup-step') {
    return {
      kind: 'cleanup-step-result',
      checkId: intent.payload.checkId,
      stepState: 'accepted',
    }
  }
  return {}
}

function capturedHandlerPair(handlerPairs, call) {
  const pair = handlerPairs.get(call.deferred.promise)
  assert.notEqual(pair, undefined)
  assert.equal(pair.onFulfilled.length, 1)
  assert.equal(pair.onRejected.length, 0)
  return pair
}

function fulfillControlledExchange(handlerPairs, call, value) {
  const pair = capturedHandlerPair(handlerPairs, call)
  assert.equal(pair.onFulfilled(value), undefined)
  call.deferred.resolve(value)
}

function rejectControlledExchange(handlerPairs, call) {
  const pair = capturedHandlerPair(handlerPairs, call)
  assert.equal(pair.onRejected(), undefined)
  call.deferred.reject(new Error('late-private-rejection-sentinel'))
}

function prepareJoinFixture(namespace, handlerPairs, phase, timing, outcome) {
  const targetCallIndex = phase === 'prestart'
    ? 0
    : (phase === 'observation' ? 3 : 5)
  const targetDeferred = createCleanDeferred()
  const fulfillmentValue = phase === 'observation'
    ? {
        kind: 'protocol-command-send-result',
        commandId: 1,
        sendState: 'sent',
      }
    : (phase === 'cleanup'
        ? {
            kind: 'controller-clock-sample-result',
            reason: 'cleanup-origin',
            monotonicMilliseconds: 6100,
          }
        : {
            kind: 'capability-probe-result',
            profile: 'adr-0033-foundation-effect-port-v1',
            capabilitySet: 'clock-cap-send-dequeue-cleanup-v1',
          })
  const rejectionReason = new Proxy({}, {
    get() {
      throw new Error('join-rejection-reason-read')
    },
    getOwnPropertyDescriptor() {
      throw new Error('join-rejection-reason-reflection')
    },
    ownKeys() {
      throw new Error('join-rejection-reason-keys')
    },
  })
  if (timing === 'pre-invocation') {
    if (outcome === 'fulfillment') {
      targetDeferred.resolve(fulfillmentValue)
    } else {
      targetDeferred.reject(rejectionReason)
    }
  }

  const calls = []
  let capabilityCalls = 0
  const notificationProbe = createNotificationProbe()
  const machine =
    namespace.createBrowserSyncTransportRuntimeDiagnosticRunMachine({
      activeExchange(intent) {
        const deferred = calls.length === targetCallIndex
          ? targetDeferred
          : createCleanDeferred()
        capabilityCalls += 1
        calls.push({ deferred, intent })
        return deferred.promise
      },
      activeObservationClosed: notificationProbe.observationClosed,
      runBinding: createInternalRunBinding(),
    })
  namespace.requestBrowserSyncTransportRuntimeDiagnosticExchange(
    machine,
    machine.nextExchangeRequestProfile
  )

  for (let index = 0; index < targetCallIndex; index += 1) {
    assert.equal(calls.length, index + 1)
    if (phase === 'cleanup' && index === 3) {
      rejectControlledExchange(handlerPairs, calls[index])
    } else {
      fulfillControlledExchange(
        handlerPairs,
        calls[index],
        normalFulfillmentForIntent(calls[index].intent)
      )
    }
  }
  assert.equal(calls.length, targetCallIndex + 1)
  assert.equal(machine.phase, phase)
  assert.equal(machine.lease, 'observable-pending')

  if (timing === 'synchronous-post-invocation') {
    if (outcome === 'fulfillment') {
      targetDeferred.resolve(fulfillmentValue)
    } else {
      targetDeferred.reject(rejectionReason)
    }
  }

  return {
    calls,
    capabilityCalls: () => capabilityCalls,
    fulfillmentValue,
    machine,
    notificationProbe,
    rejectionReason,
    targetCallIndex,
    targetDeferred,
  }
}

async function withCapturedControlledPromiseHandlers(callback) {
  const thenDescriptor = Object.getOwnPropertyDescriptor(
    Promise.prototype,
    'then'
  )
  const handlerPairs = new Map()
  try {
    Object.defineProperty(Promise.prototype, 'then', {
      ...thenDescriptor,
      value(onFulfilled, onRejected) {
        if (
          onFulfilled?.name === 'controlledFulfillment' &&
          onRejected?.name === 'controlledRejection'
        ) {
          handlerPairs.set(this, { onFulfilled, onRejected })
        }
        return Reflect.apply(thenDescriptor.value, this, [
          onFulfilled,
          onRejected,
        ])
      },
    })
    await callback(handlerPairs)
  } finally {
    restoreOwnProperty(Promise.prototype, 'then', thenDescriptor)
  }
}

function createMainWorldValue({
  outcome = 'static-redacted-rejection',
  relativeMilliseconds = 5000,
  staticProfileResult = 'match',
  timingState = 'measured',
} = {}) {
  return {
    preTransportContext: {
      url: { contextResult: 'match' },
      origin: { contextResult: 'match' },
      topLevel: { contextResult: 'match' },
      secureContext: { contextResult: 'match' },
    },
    execution: {
      factoryCallCount: 'one',
      transportCallCount: 'one',
      dispatchState: 'dispatched',
    },
    settlement: {
      outcome,
      staticProfileResult,
      relativeMilliseconds,
      timingState,
    },
  }
}

function createCdpMessage(value) {
  return { kind: 'cdp-message', value }
}

function createNetworkRequestMessage(requestId, method, timestamp) {
  return createCdpMessage({
    method: 'Network.requestWillBeSent',
    sessionId: 'session-adr0035-1',
    params: {
      requestId,
      request: { url: ENDPOINT_URL, method },
      timestamp,
    },
  })
}

function createNetworkResponseMessage(requestId, status, timestamp) {
  return createCdpMessage({
    method: 'Network.responseReceived',
    sessionId: 'session-adr0035-1',
    params: {
      requestId,
      response: { url: ENDPOINT_URL, status },
      timestamp,
    },
  })
}

function createNetworkTerminalMessage(requestId, timestamp, failed = false) {
  return createCdpMessage({
    method: failed ? 'Network.loadingFailed' : 'Network.loadingFinished',
    sessionId: 'session-adr0035-1',
    params: { requestId, timestamp },
  })
}

function createSetupMessagesForTargets(targetInfos) {
  return [
    createCdpMessage({ id: 1, result: { targetInfos } }),
    createCdpMessage({
      id: 2,
      result: { sessionId: 'session-adr0035-1' },
    }),
    createCdpMessage({
      id: 3,
      sessionId: 'session-adr0035-1',
      result: {},
    }),
  ]
}

async function runFullController(controller, runBinding = createValidRunBinding()) {
  const observer = createBrowserSyncTransportRuntimeDiagnosticObserver({
    effectPort: controller.effectPort,
    runBinding,
  })
  return observer.run()
}

function createFullRunEffectController({
  cleanupFact = true,
  cleanupPrefaceMessages = [],
  cleanupProtocolResponseOrder = 'send-order',
  clockForReason,
  captureTailPending = false,
  captureMessages,
  mainWorldValue = createMainWorldValue(),
  onObservationClosed,
  settlementForIntent,
  setupMessages: suppliedSetupMessages,
  targetInfos,
} = {}) {
  const intents = []
  const notificationCalls = []
  const protocolCommands = []
  const responses = []
  const cleanupStepIds = []
  const setupMessages = suppliedSetupMessages === undefined ? [
    createCdpMessage({
      id: 1,
      result: {
        targetInfos: targetInfos ?? [{
          type: 'page',
          url: TOP_LEVEL_URL,
          attached: false,
          targetId: 'target-adr0035-1',
        }],
      },
    }),
    createCdpMessage({
      id: 2,
      result: { sessionId: 'session-adr0035-1' },
    }),
    createCdpMessage({
      id: 3,
      sessionId: 'session-adr0035-1',
      result: {},
    }),
  ] : [...suppliedSetupMessages]
  const defaultCaptureMessages = [
    createCdpMessage({
      id: 4,
      sessionId: 'session-adr0035-1',
      result: {
        result: {
          type: 'object',
          value: mainWorldValue,
        },
      },
    }),
    createCdpMessage({
      method: 'Network.requestWillBeSent',
      sessionId: 'session-adr0035-1',
      params: {
        requestId: 'preflight-adr0035-1',
        request: { url: ENDPOINT_URL, method: 'OPTIONS' },
        timestamp: 10,
      },
    }),
    createCdpMessage({
      method: 'Network.responseReceived',
      sessionId: 'session-adr0035-1',
      params: {
        requestId: 'preflight-adr0035-1',
        response: { url: ENDPOINT_URL, status: 204 },
        timestamp: 10.1,
      },
    }),
    createCdpMessage({
      method: 'Network.requestWillBeSent',
      sessionId: 'session-adr0035-1',
      params: {
        requestId: 'post-adr0035-1',
        request: { url: ENDPOINT_URL, method: 'POST' },
        timestamp: 10.2,
      },
    }),
    createCdpMessage({
      method: 'Network.responseReceived',
      sessionId: 'session-adr0035-1',
      params: {
        requestId: 'post-adr0035-1',
        response: { url: ENDPOINT_URL, status: 200 },
        timestamp: 10.3,
      },
    }),
    createCdpMessage({
      method: 'Network.loadingFinished',
      sessionId: 'session-adr0035-1',
      params: { requestId: 'post-adr0035-1', timestamp: 10.4 },
    }),
  ]
  const pendingCaptureMessages = captureMessages === undefined
    ? defaultCaptureMessages
    : [...captureMessages]
  const cleanupProtocolResponses = []
  const pendingCleanupPrefaceMessages = [...cleanupPrefaceMessages]
  let cleanupProtocolResponsesReordered = false
  let captureArmIntentId = null
  let clockValue = 90
  let currentCleanupCheckId = null
  let exchangeDepth = 0
  let maxExchangeDepth = 0
  const captureTailDeferred = createCleanDeferred()
  let captureTailReachedResolve
  const captureTailReached = new Promise((resolve) => {
    captureTailReachedResolve = resolve
  })
  let captureTailWasUsed = false

  function responseFor(intent) {
    if (intent.kind === 'capability-probe') {
      return normalFulfillmentForIntent(intent)
    }
    if (intent.kind === 'controller-clock-sample') {
      const nextValue = typeof clockForReason === 'function'
        ? clockForReason(intent.payload.reason, clockValue)
        : clockValue + 10
      clockValue = nextValue
      return {
        kind: 'controller-clock-sample-result',
        reason: intent.payload.reason,
        monotonicMilliseconds: clockValue,
      }
    }
    if (intent.kind === 'cap-arm') {
      if (intent.payload.capKind === 'capture') {
        captureArmIntentId = intent.intentId
      }
      return normalFulfillmentForIntent(intent)
    }
    if (intent.kind === 'cap-cancel') {
      return normalFulfillmentForIntent(intent)
    }
    if (intent.kind === 'protocol-command-send') {
      protocolCommands.push(intent.payload.command)
      if (intent.payload.command === 'Network.disable') {
        cleanupProtocolResponses.push(createCdpMessage({
          id: intent.payload.commandId,
          sessionId: 'session-adr0035-1',
          result: {},
        }))
      } else if (intent.payload.command === 'Target.detachFromTarget') {
        cleanupProtocolResponses.push(createCdpMessage({
          id: intent.payload.commandId,
          result: {},
        }))
      }
      return normalFulfillmentForIntent(intent)
    }
    if (intent.kind === 'cleanup-step') {
      currentCleanupCheckId = intent.payload.checkId
      cleanupStepIds.push(currentCleanupCheckId)
      return normalFulfillmentForIntent(intent)
    }
    if (intent.payload.phase === 'setup') {
      assert.notEqual(setupMessages.length, 0)
      return setupMessages.shift()
    }
    if (intent.payload.phase === 'capture') {
      if (pendingCaptureMessages.length !== 0) {
        return pendingCaptureMessages.shift()
      }
      return {
        kind: 'cap-fired',
        capKind: 'capture',
        armIntentId: captureArmIntentId,
      }
    }
    if (cleanupProtocolResponses.length !== 0) {
      if (pendingCleanupPrefaceMessages.length !== 0) {
        return pendingCleanupPrefaceMessages.shift()
      }
      if (
        cleanupProtocolResponseOrder === 'reverse' &&
        cleanupProtocolResponsesReordered === false
      ) {
        cleanupProtocolResponses.reverse()
        cleanupProtocolResponsesReordered = true
      }
      return cleanupProtocolResponses.shift()
    }
    assert.notEqual(currentCleanupCheckId, null)
    const checkId = currentCleanupCheckId
    return {
      kind: 'cleanup-fact',
      checkId,
      fact: typeof cleanupFact === 'function'
        ? cleanupFact(checkId)
        : cleanupFact,
    }
  }

  const effectPort = {
    exchange(intent) {
      exchangeDepth += 1
      maxExchangeDepth = Math.max(maxExchangeDepth, exchangeDepth)
      assertFrozenOrdinaryRecord(intent, ['intentId', 'kind', 'payload'])
      assert.equal(INTENT_KINDS.includes(intent.kind), true)
      assert.equal(intent.intentId, intents.length + 1)
      intents.push(intent)
      if (
        captureTailPending &&
        !captureTailWasUsed &&
        intent.kind === 'observation-dequeue' &&
        intent.payload.phase === 'capture' &&
        pendingCaptureMessages.length === 0
      ) {
        captureTailWasUsed = true
        captureTailReachedResolve()
        exchangeDepth -= 1
        return captureTailDeferred.promise
      }
      const response = responseFor(intent)
      responses.push({ intent, response })
      const settlement = typeof settlementForIntent === 'function'
        ? settlementForIntent(intent, response)
        : null
      let candidate
      if (settlement?.type === 'reject') {
        candidate = normalizePromise(Promise.reject(settlement.reason))
      } else if (settlement?.type === 'candidate') {
        candidate = settlement.promise
      } else if (settlement?.type === 'throw') {
        exchangeDepth -= 1
        throw settlement.reason
      } else {
        candidate = normalizePromise(Promise.resolve(
          settlement?.type === 'fulfill' ? settlement.value : response
        ))
      }
      assert.deepEqual(Reflect.ownKeys(candidate), [])
      exchangeDepth -= 1
      return candidate
    },
    observationClosed() {
      notificationCalls.push({
        intentCount: intents.length,
        receiver: this,
        argumentCount: arguments.length,
      })
      if (typeof onObservationClosed === 'function') {
        return Reflect.apply(onObservationClosed, undefined, [])
      }
    },
  }

  return {
    captureArmIntentId: () => captureArmIntentId,
    cleanupStepIds,
    captureTailReached,
    effectPort,
    intents,
    notificationCalls,
    maxExchangeDepth: () => maxExchangeDepth,
    protocolCommands,
    responses,
    resolveCaptureTail() {
      captureTailDeferred.resolve({
        kind: 'cap-fired',
        capKind: 'capture',
        armIntentId: captureArmIntentId,
      })
    },
  }
}

async function assertPublicNotificationCapture(namespace) {
  let calls = 0
  let replacements = 0
  const reflection = { get: 0, getPrototypeOf: 0, ownKeys: 0, descriptors: [] }
  function callback() { calls += 1 }
  const observed = new Proxy(callback, {
    get(target, key, receiver) { reflection.get += 1; return Reflect.get(target, key, receiver) },
    getPrototypeOf(target) { reflection.getPrototypeOf += 1; return Reflect.getPrototypeOf(target) },
    ownKeys(target) { reflection.ownKeys += 1; return Reflect.ownKeys(target) },
    getOwnPropertyDescriptor(target, key) {
      reflection.descriptors.push(key)
      return Reflect.getOwnPropertyDescriptor(target, key)
    },
  })
  const controller = createFullRunEffectController()
  const options = {
    effectPort: { exchange: controller.effectPort.exchange, observationClosed: observed },
    runBinding: createValidRunBinding(),
  }
  const api = namespace.createBrowserSyncTransportRuntimeDiagnosticObserver(options)
  assert.equal(calls, 0, 'notification-factory-inactive')
  assert.deepEqual(reflection, { get: 0, getPrototypeOf: 0, ownKeys: 0, descriptors: ['length'] },
    'notification-exact-length-descriptor')
  Object.defineProperty(callback, 'length', { value: 17 })
  options.effectPort.observationClosed = function replacement() { replacements += 1 }
  const result = await api.run()
  assert.equal(result.ok, true, 'notification-captured-owner-result')
  assert.equal(calls, 1, 'notification-captured-identity')
  assert.equal(replacements, 0, 'notification-no-late-container-read')
  assert.deepEqual(reflection, { get: 0, getPrototypeOf: 0, ownKeys: 0, descriptors: ['length'] },
    'notification-length-not-rechecked')
}

test('ADR0037 erzwingt die gesamte Required-Port- und length-Descriptorgrammatik', async (t) => {
  let invocations = 0
  let accessorCalls = 0
  const exchange = () => { invocations += 1 }
  const notification = () => { invocations += 1 }
  function withLength(descriptor) {
    const callback = () => { invocations += 1 }
    Object.defineProperty(callback, 'length', descriptor)
    return callback
  }
  const absentLength = () => { invocations += 1 }
  Reflect.deleteProperty(absentLength, 'length')
  const accessorPort = { exchange }
  Object.defineProperty(accessorPort, 'observationClosed', {
    enumerable: true, get() { accessorCalls += 1; return notification },
  })
  const hiddenPort = { exchange, observationClosed: notification }
  Object.defineProperty(hiddenPort, 'observationClosed', { enumerable: false })
  const inputs = [
    ['legacy', { exchange }],
    ['missing-exchange', { observationClosed: notification }],
    ['reversed', { observationClosed: notification, exchange }],
    ['extra', { exchange, observationClosed: notification, extra: true }],
    ['symbol', { exchange, observationClosed: notification, [Symbol('extra')]: true }],
    ['accessor', accessorPort], ['hidden', hiddenPort],
    ...[undefined, null, false, 0, {}, 'callback'].map((value, index) =>
      [`nonfunction-${index}`, { exchange, observationClosed: value }]),
    ['arity-one', { exchange, observationClosed(value) { invocations += 1 } }],
    ['length-absent', { exchange, observationClosed: absentLength }],
    ['length-enumerable', { exchange, observationClosed: withLength({ value: 0, enumerable: true }) }],
    ['length-boxed', { exchange, observationClosed: withLength({ value: Object(0) }) }],
    ['length-string', { exchange, observationClosed: withLength({ value: '0' }) }],
    ['length-accessor', { exchange, observationClosed: withLength({
      get() { accessorCalls += 1; return 0 },
    }) }],
    ['length-reflectionthrow', { exchange, observationClosed: new Proxy(notification, {
      getOwnPropertyDescriptor() { throw 'private-length-sentinel' },
    }) }],
    ['port-reflectionthrow', new Proxy({ exchange, observationClosed: notification }, {
      getOwnPropertyDescriptor() { throw 'private-port-sentinel' },
    })],
  ]
  for (const [name, effectPort] of inputs) {
    await t.test(name, () => {
      assertFactoryDependencyError(() => createBrowserSyncTransportRuntimeDiagnosticObserver({
        effectPort, runBinding: createValidRunBinding(),
      }))
    })
  }
  for (const writable of [false, true]) {
    for (const configurable of [false, true]) {
      const callback = withLength({ value: 0, enumerable: false, writable, configurable })
      const before = Object.getOwnPropertyDescriptor(callback, 'length')
      const api = createBrowserSyncTransportRuntimeDiagnosticObserver({
        effectPort: { exchange, observationClosed: callback }, runBinding: createValidRunBinding(),
      })
      assertFrozenOrdinaryRecord(api, ['run'])
      assert.deepEqual(Object.getOwnPropertyDescriptor(callback, 'length'), before)
      assert.equal(Object.isFrozen(callback), false)
    }
  }
  for (const callback of [function () {}, () => {}, (function () {}).bind(null),
    async function () {}, function* () {}, class ZeroArity {}]) {
    assertFrozenOrdinaryRecord(createBrowserSyncTransportRuntimeDiagnosticObserver({
      effectPort: { exchange, observationClosed: callback }, runBinding: createValidRunBinding(),
    }), ['run'])
  }
  assert.equal(invocations, 0)
  assert.equal(accessorCalls, 0)
})

test('ADR0037 erfasst die Notificationidentitaet und ihren length-Descriptor nur einmal', async () => {
  await assertPublicNotificationCapture(diagnosticObserverModule)
})

async function assertNotificationWrongRunArity(namespace) {
  const probe = createNotificationProbe()
  let exchanges = 0
  const api = namespace.createBrowserSyncTransportRuntimeDiagnosticObserver({
    effectPort: {
      exchange() { exchanges += 1; return new Promise(() => {}) },
      observationClosed: probe.observationClosed,
    },
    runBinding: createValidRunBinding(),
  })
  let first
  let second
  assert.doesNotThrow(() => { first = api.run(undefined) }, 'wrong-first-run-must-not-throw')
  assert.doesNotThrow(() => { second = api.run() }, 'nonowner-must-not-throw')
  assert.equal(probe.calls.length, 0, 'wrong-first-run-no-marker')
  assert.equal(exchanges, 0, 'wrong-first-run-no-exchange')
  assert.notEqual(first, second)
  for (const promise of [first, second]) {
    const result = await promise
    assertFoundationResult(result)
    assert.equal(result.ok, false)
  }
}

test('ADR0037 verwirft beide Rollen bei falscher erster Runarity ohne Notification', async () => {
  await assertNotificationWrongRunArity(diagnosticObserverModule)
})

test('ADR0037 prueft private Konstruktorrollen ohne erneute oeffentliche length-Pruefung', { concurrency: false }, async () => {
  await withTemporaryDiagnosticObserverCopy({ anchor: PRIVATE_EXPORT_ANCHOR }, async ({ namespace }) => {
    let reads = 0
    let calls = 0
    const notification = new Proxy(function (notPublicArity) { calls += 1 }, {
      getOwnPropertyDescriptor() { reads += 1; throw 'private-constructor-length-read' },
    })
    const exchange = () => { calls += 1 }
    const input = { activeExchange: exchange, activeObservationClosed: notification, runBinding: createInternalRunBinding() }
    const machine = namespace.createBrowserSyncTransportRuntimeDiagnosticRunMachine(input)
    assert.equal(machine.activeObservationClosed, notification)
    assert.equal(machine.observationNotificationState, 'armed')
    assert.equal(machine.observationNotificationViolation, false)
    assert.equal(reads, 0)
    assert.equal(calls, 0)
    for (const value of [
      { activeExchange: exchange, runBinding: input.runBinding },
      { ...input, activeObservationClosed: undefined },
      { ...input, activeExchange: undefined },
      { activeObservationClosed: notification, activeExchange: exchange, runBinding: input.runBinding },
      { ...input, extra: true },
    ]) assert.throws(() => namespace.createBrowserSyncTransportRuntimeDiagnosticRunMachine(value),
      { name: 'TypeError', message: 'invalidRunMachineInput' })
    assert.throws(() => namespace.createBrowserSyncTransportRuntimeDiagnosticRunMachine(), TypeError)
    assert.throws(() => namespace.createBrowserSyncTransportRuntimeDiagnosticRunMachine(input, undefined), TypeError)
    assert.equal(reads, 0)
    assert.equal(calls, 0)
  })
})

function notificationFlowDefinition(id) {
  const command = (name) => (intent) => intent.kind === 'protocol-command-send' &&
    intent.payload.command === name
  const cancel = (capKind) => (intent) => intent.kind === 'cap-cancel' &&
    intent.payload.capKind === capKind
  const definitions = {
    'setup-ready': { target: cancel('setup'), preO0: true },
    'rejection-setup': {
      target: cancel('setup'), trigger: command('Target.getTargets'), preO0: true,
    },
    'rejection-capture': {
      target: cancel('capture'), trigger: command('Runtime.evaluate'), preO0: true,
    },
    'capture-terminal': {
      target: cancel('capture'), preO0: true,
      options: { captureMessages: [{ kind: 'connection-closed' }] },
    },
    'old-setup': {
      target: cancel('setup'), preO0: false, oldCap: true,
      options: { setupMessages: [{ kind: 'connection-closed' }] },
    },
    'old-capture': {
      target: cancel('capture'), preO0: false, oldCap: true,
      options: { captureMessages: [{ kind: 'cap-fired', capKind: 'setup', armIntentId: 1 }] },
    },
    regular: {
      target: (intent) => intent.kind === 'controller-clock-sample' &&
        intent.payload.reason === 'cleanup-origin',
      preO0: false,
    },
    'portless-observation': { target: command('Target.getTargets'), preO0: true },
    prestart: { target: (intent) => intent.kind === 'capability-probe', preO0: true, prestart: true },
    'prestart-arm': {
      target: (intent) => intent.kind === 'cap-arm' && intent.payload.capKind === 'setup',
      preO0: true, prestart: true,
    },
    'portless-cleanup': {
      target: (intent) => intent.kind === 'cleanup-step', preO0: false,
    },
  }
  return definitions[id]
}

// This driver supplies synthetic settlements to the real controlled handlers.
// Every native deferred is settled with undefined, never with an adversarial graph.
function driveNotificationFlow(namespace, handlerPairs, {
  id = 'regular', mode = 'exact', publicPath = false,
  notificationBehavior, aliasRoles = false, controllerOptions = {},
} = {}) {
  const definition = notificationFlowDefinition(id)
  const calls = []
  const markers = []
  const events = []
  let machine = null
  let api = null
  let targetCall = null
  let triggered = false
  let savedProfile = null
  const nonOwnerPromises = []
  function notification() {
    const marker = {
      receiver: this,
      argumentCount: arguments.length,
      intentCount: controller.intents.length,
      snapshot: machine?.preCleanupObservationSnapshot,
      snapshotValues: machine?.preCleanupObservationSnapshot === null
        ? null : cloneTree(machine?.preCleanupObservationSnapshot),
      ledger: machine?.cleanupLedger,
      phase: machine?.phase,
      slot: machine?.activeObservationClosed,
      state: machine?.observationNotificationState,
      port: machine?.portState,
      exchange: machine?.activeExchange,
      freezeError: null,
    }
    if (machine !== null) {
      try {
        assert.notEqual(marker.snapshot, null)
        assertDeepFrozenGraph(marker.snapshot)
      } catch (error) {
        marker.freezeError = error
      }
    }
    markers.push(marker)
    events.push({ kind: 'marker' })
    if (publicPath) {
      nonOwnerPromises.push(api.run(), api.run('not-owner'))
    }
    if (notificationBehavior !== undefined) {
      return notificationBehavior({ machine, namespace, savedProfile, marker })
    }
  }
  const controller = createFullRunEffectController({
    ...definition.options,
    ...controllerOptions,
    onObservationClosed: notification,
    settlementForIntent(intent, response) {
      const event = {
        kind: 'intent', intent,
        snapshot: machine?.preCleanupObservationSnapshot,
        ledger: machine?.cleanupLedger,
      }
      events.push(event)
      let outcome = 'exact'
      if (!triggered && definition.trigger?.(intent)) {
        triggered = true
        outcome = 'rejection'
      }
      const isTarget = targetCall === null && definition.target(intent)
      if (isTarget) outcome = mode
      const call = { deferred: createCleanDeferred(), intent, response, outcome, event }
      calls.push(call)
      if (isTarget) targetCall = call
      if (outcome === 'unobservable') {
        return { type: 'throw', reason: 'unobserved-notification-flow-sentinel' }
      }
      return { type: 'candidate', promise: call.deferred.promise }
    },
  })
  function aliasedCapability() {
    return arguments.length === 0
      ? Reflect.apply(controller.effectPort.observationClosed, undefined, [])
      : Reflect.apply(controller.effectPort.exchange, undefined, [arguments[0]])
  }
  const activeExchange = aliasRoles ? aliasedCapability : controller.effectPort.exchange
  const activeObservationClosed = aliasRoles
    ? aliasedCapability : controller.effectPort.observationClosed
  let runPromise
  if (publicPath) {
    api = namespace.createBrowserSyncTransportRuntimeDiagnosticObserver({
      effectPort: { exchange: activeExchange, observationClosed: activeObservationClosed },
      runBinding: createValidRunBinding(),
    })
    assert.equal(markers.length, 0, 'factory-marker')
    runPromise = api.run()
    nonOwnerPromises.push(api.run())
  } else {
    machine = namespace.createBrowserSyncTransportRuntimeDiagnosticRunMachine({
      activeExchange, activeObservationClosed, runBinding: createInternalRunBinding(),
    })
    savedProfile = machine.nextExchangeRequestProfile
    runPromise = machine.ownerRunPromise
    namespace.requestBrowserSyncTransportRuntimeDiagnosticExchange(machine, savedProfile)
  }
  // A finite deterministic drain of already issued test exchanges, no scheduler.
  let driven = 0
  for (let index = 0; index < calls.length; index += 1) {
    assert.ok(index < 160, 'finite-notification-fixture-bound')
    const call = calls[index]
    if (call.outcome === 'pending') break
    if (call.outcome === 'unobservable') continue
    const pair = capturedHandlerPair(handlerPairs, call)
    if (call.outcome === 'rejection') {
      assert.equal(pair.onRejected(), undefined)
    } else {
      assert.equal(pair.onFulfilled(call.outcome === 'malformed' ? {} : call.response), undefined)
    }
    call.deferred.resolve(undefined)
    driven += 1
  }
  return {
    machine, controller, markers, events, calls, driven, targetCall,
    runPromise, nonOwnerPromises, activeExchange, activeObservationClosed,
    definition, id, mode, publicPath,
  }
}

function assertNotificationFlow(scenario) {
  const { machine, markers, events, definition, mode, targetCall, publicPath } = scenario
  assert.notEqual(targetCall, null, 'flow-target-reached')
  const noO0 = definition.prestart || (mode === 'pending' && definition.preO0)
  assert.equal(markers.length, noO0 ? 0 : 1, 'notification-cardinality')
  for (const marker of markers) {
    assert.equal(marker.receiver, undefined, 'notification-receiver')
    assert.equal(marker.argumentCount, 0, 'notification-arguments')
    if (!publicPath) {
      assert.equal(marker.freezeError, null, 'notification-after-deep-freeze')
      assert.equal(marker.ledger, null, 'notification-before-ledger')
      assert.notEqual(marker.phase, 'cleanup', 'notification-before-phase')
      assert.equal(marker.slot, null, 'notification-slot-consumed-before-call')
      assert.equal(marker.state, 'invoking', 'notification-invoking-state')
      assert.equal(machine.preCleanupObservationSnapshot, marker.snapshot, 'notification-o0-identity')
      assert.deepEqual(machine.preCleanupObservationSnapshot, marker.snapshotValues, 'notification-o0-values')
      if (mode === 'unobservable' && definition.preO0) {
        assert.equal(marker.port, 'closed', 'portless-marker-port')
        assert.equal(marker.exchange, null, 'portless-marker-exchange')
      }
    }
  }
  if (markers.length === 1) {
    const markerIndex = events.findIndex((event) => event.kind === 'marker')
    const targetIndex = events.indexOf(targetCall.event)
    assert.equal(markerIndex > targetIndex, definition.preO0, 'notification-intent-order')
  }
  if (publicPath) return
  assert.equal(machine.intentCount, scenario.controller.intents.length, 'notification-not-an-intent')
  assert.equal(machine.nextIntentId, machine.intentCount + 1, 'notification-no-intent-id')
  assert.equal(machine.portCallCount, machine.intentCount, 'notification-no-port-count')
  assert.equal(machine.capabilityCallCount, machine.intentCount, 'notification-no-capability-count')
  if (mode === 'pending') {
    assert.equal(machine.runSettlementCount, 0, 'notification-pending-no-settlement')
    assert.equal(machine.lease, 'observable-pending', 'notification-pending-lease')
    assert.equal(machine.currentExchangeCount, 1, 'notification-pending-exchange')
    assert.equal(machine.activeObservationClosed, noO0 ? scenario.activeObservationClosed : null,
      'notification-pending-reference')
    assert.equal(machine.observationNotificationState, noO0 ? 'armed' : 'consumed',
      'notification-pending-state')
    if (definition.oldCap) assert.equal(machine.cleanupLedger, null, 'old-cap-pending-no-ledger')
  } else {
    assert.equal(machine.runSettlementCount, 1, 'notification-terminal-settlement')
    assert.equal(machine.activeExchange, null, 'notification-terminal-exchange-clear')
    assert.equal(machine.activeObservationClosed, null, 'notification-terminal-slot-clear')
    assert.equal(machine.observationNotificationState, noO0 ? 'discarded' : 'consumed',
      'notification-terminal-state')
  }
  if (noO0) {
    assert.equal(machine.preCleanupObservationSnapshot, null, 'notification-no-invented-o0')
    assert.equal(machine.cleanupLedger, null, 'notification-prestart-no-cleanup')
  }
}

test('ADR0037 bindet alle sieben Ablaufklassen privat und black-box an denselben Marker', { concurrency: false }, async (t) => {
  await withCapturedControlledPromiseHandlers(async (handlerPairs) => {
    await withTemporaryDiagnosticObserverCopy({ anchor: PRIVATE_EXPORT_ANCHOR }, async ({ namespace }) => {
      const cases = [
        ...['setup-ready', 'rejection-setup', 'rejection-capture', 'capture-terminal',
          'old-setup', 'old-capture'].flatMap((id) =>
          ['exact', 'rejection', 'malformed', 'unobservable', 'pending'].map((mode) => ({ id, mode }))),
        { id: 'regular', mode: 'exact' },
        { id: 'regular', mode: 'pending' },
        { id: 'portless-observation', mode: 'unobservable' },
        { id: 'portless-cleanup', mode: 'unobservable' },
        ...['prestart', 'prestart-arm'].flatMap((id) =>
          ['rejection', 'malformed', 'unobservable', 'pending'].map((mode) => ({ id, mode }))),
      ]
      for (const vector of cases) {
        for (const publicPath of [false, true]) {
          await t.test(`${vector.id}/${vector.mode}/${publicPath ? 'public' : 'private'}`, async () => {
            const scenario = driveNotificationFlow(namespace, handlerPairs, { ...vector, publicPath })
            assertNotificationFlow(scenario)
            if (vector.mode === 'pending') {
              const before = scenario.machine === null ? null : snapshotJoinState(
                scenario.machine, scenario.controller.intents, scenario.machine.capabilityCallCount)
              const markerCount = scenario.markers.length
              const intentCount = scenario.controller.intents.length
              let settlements = 0
              scenario.runPromise.then(() => { settlements += 1 })
              for (let checkpoint = 0; checkpoint < 3; checkpoint += 1) {
                await new Promise((resolve) => queueMicrotask(resolve))
                assert.equal(settlements, 0)
                assert.equal(scenario.markers.length, markerCount)
                assert.equal(scenario.controller.intents.length, intentCount)
                assertNotificationFlow(scenario)
                if (before !== null) assert.deepEqual(snapshotJoinState(
                  scenario.machine, scenario.controller.intents, scenario.machine.capabilityCallCount), before)
              }
            } else {
              const result = await scenario.runPromise
              assertFoundationResult(result)
              assert.equal(result.ok, !scenario.definition.prestart)
              assertNotificationFlow(scenario)
            }
            for (const promise of scenario.nonOwnerPromises) {
              assert.equal((await promise).ok, false)
            }
          })
        }
      }
    })
  })
})

function createNotificationReturnVector(kind) {
  const traps = { get: 0, getPrototypeOf: 0, ownKeys: 0, getOwnPropertyDescriptor: 0, thenCalls: 0 }
  let value
  if (kind === 'thenable') {
    value = Object.defineProperty({}, 'then', {
      get() { traps.get += 1; return () => { traps.thenCalls += 1 } },
    })
  } else if (kind === 'proxy' || kind === 'throw') {
    value = new Proxy({}, Object.fromEntries(
      ['get', 'getPrototypeOf', 'ownKeys', 'getOwnPropertyDescriptor'].map((trap) => [trap,
        (...args) => { traps[trap] += 1; return Reflect[trap](...args) }])
    ))
  } else if (kind === 'promise') {
    value = normalizePromise(Promise.resolve('already-fulfilled'))
  } else {
    value = kind
  }
  return {
    traps,
    behavior() {
      if (kind === 'throw') throw value
      return value
    },
  }
}

function assertNotificationFailure(scenario, vector) {
  assertNotificationFlow(scenario)
  assert.deepEqual(vector.traps,
    { get: 0, getPrototypeOf: 0, ownKeys: 0, getOwnPropertyDescriptor: 0, thenCalls: 0 },
    'notification-return-not-reflected-or-assimilated')
  assert.equal(scenario.machine.observationNotificationViolation, true, 'notification-violation-sticky')
  assert.equal(scenario.machine.cleanupInitialViolation, true, 'notification-cleanup-initial-violation')
  assert.equal(scenario.machine.preCleanupObservationSnapshot.stickyViolation, false, 'notification-no-retroactive-v')
  assert.equal(scenario.machine.preCleanupObservationSnapshot.observationCompletion.observationCloseReason,
    'capture-cap', 'notification-original-close-reason')
  if (scenario.mode !== 'pending') {
    assert.equal(scenario.machine.cleanupLedger.result, 'FAIL', 'notification-fail-precedence')
    assert.equal(scenario.machine.cleanupLedger.cleanupViolation, true, 'notification-ledger-violation')
    assert.equal(scenario.controller.cleanupStepIds.length, 12, 'notification-ordered-cleanup')
  }
}

test('ADR0037 behandelt Throw und jeden fremden Return ohne Reflection oder Assimilation', { concurrency: false }, async (t) => {
  await withCapturedControlledPromiseHandlers(async (handlerPairs) => {
    await withTemporaryDiagnosticObserverCopy({ anchor: PRIVATE_EXPORT_ANCHOR }, async ({ namespace }) => {
      for (const kind of [null, false, true, 0, 1, NaN, '', 'text', 0n, Symbol('invalid'),
        'thenable', 'proxy', 'promise', 'throw']) {
        await t.test(String(kind), async () => {
          const vector = createNotificationReturnVector(kind)
          const scenario = driveNotificationFlow(namespace, handlerPairs, { notificationBehavior: vector.behavior })
          assertNotificationFailure(scenario, vector)
          const result = await scenario.runPromise
          assertFoundationResult(result)
          assert.equal(result.ok, true)
          assert.equal(result.recordProjection.candidateObserverGate, 'FAIL')
          assert.equal(result.recordProjection.candidateFinding, 'observer-invalid')
          assert.equal(result.recordProjection.cleanup.checks[19].result, 'confirmed')
          assertNotificationFailure(scenario, vector)
        })
      }
      const vector = createNotificationReturnVector('throw')
      const pending = driveNotificationFlow(namespace, handlerPairs, {
        id: 'regular', mode: 'pending', notificationBehavior: vector.behavior,
      })
      for (let checkpoint = 0; checkpoint < 3; checkpoint += 1) {
        await new Promise((resolve) => queueMicrotask(resolve))
        assertNotificationFailure(pending, vector)
      }
    })
  })
})

test('ADR0037 erhaelt FAIL bei jeder Stimulusklasse und spaeterem Cleanupcap', { concurrency: false }, async (t) => {
  await withCapturedControlledPromiseHandlers(async (handlerPairs) => {
    await withTemporaryDiagnosticObserverCopy({ anchor: PRIVATE_EXPORT_ANCHOR }, async ({ namespace }) => {
      for (const stimulus of ['zero', 'unknown', 'one']) {
        await t.test(stimulus, async () => {
          let baselineSnapshot
          for (const invalidReturn of [false, true]) {
            let cleanupOrigin
            const vector = createNotificationReturnVector('proxy')
            const scenario = driveNotificationFlow(namespace, handlerPairs, {
              notificationBehavior: invalidReturn ? vector.behavior : undefined,
              controllerOptions: {
                ...(stimulus === 'zero' ? { targetInfos: [] } :
                  stimulus === 'unknown' ? { captureMessages: [] } : {}),
                clockForReason(reason, current) {
                  if (reason === 'cleanup-origin') cleanupOrigin = current + 10
                  return reason === 'cleanup-dequeue-before-reflection'
                    ? cleanupOrigin + 60000 : current + 10
                },
              },
            })
            assertNotificationFlow(scenario)
            const result = await scenario.runPromise
            assertFoundationResult(result)
            assert.equal(result.ok, true)
            const projection = result.recordProjection
            assert.equal(projection.requestBudget.defaultTransportCalls, stimulus)
            assert.equal(projection.timing.completion.cleanupFinalizeReason, 'cleanup-cap')
            assert.equal(projection.cleanup.checks[19].result, 'unproven')
            assert.equal(projection.candidateObserverGate, invalidReturn ? 'FAIL' : 'UNPROVEN')
            assert.equal(projection.candidateFinding, invalidReturn ? 'observer-invalid' : 'inconclusive')
            assert.equal(scenario.machine.observationNotificationViolation, invalidReturn)
            assert.equal(scenario.machine.cleanupLedger.cleanupViolation, invalidReturn)
            assert.equal(scenario.machine.preCleanupObservationSnapshot.stickyViolation, false)
            assert.equal(scenario.controller.cleanupStepIds.length, stimulus === 'zero' ? 1 : 0)
            assert.deepEqual(vector.traps,
              { get: 0, getPrototypeOf: 0, ownKeys: 0, getOwnPropertyDescriptor: 0, thenCalls: 0 })
            if (invalidReturn) {
              assert.deepEqual(scenario.machine.preCleanupObservationSnapshot, baselineSnapshot)
            } else {
              baselineSnapshot = scenario.machine.preCleanupObservationSnapshot
            }
          }
        })
      }
    })
  })
})

function createNotificationReentrancyVector(profileKind) {
  const observations = []
  const traps = { get: 0, getPrototypeOf: 0, ownKeys: 0, getOwnPropertyDescriptor: 0 }
  return {
    observations, traps,
    behavior({ machine, namespace, savedProfile }) {
      const before = snapshotJoinState(machine, [], machine.capabilityCallCount)
      const profile = profileKind === 'saved' ? savedProfile : new Proxy({}, Object.fromEntries(
        Object.keys(traps).map((trap) => [trap, (...args) => {
          traps[trap] += 1
          return Reflect[trap](...args)
        }])
      ))
      let thrown = null
      const results = []
      try {
        // Invalid arity and foreign identity are still inert before the new guard.
        results.push(namespace.requestBrowserSyncTransportRuntimeDiagnosticExchange(machine))
        results.push(namespace.requestBrowserSyncTransportRuntimeDiagnosticExchange({}, profile))
        const beforeActualCall = machine.observationNotificationViolation
        results.push(namespace.requestBrowserSyncTransportRuntimeDiagnosticExchange(machine, profile))
        results.push(namespace.requestBrowserSyncTransportRuntimeDiagnosticExchange(machine, profile))
        observations.push({ beforeActualCall })
      } catch (error) { thrown = error }
      observations.push({
        before, after: snapshotJoinState(machine, [], machine.capabilityCallCount), thrown, results,
        state: machine.observationNotificationState,
        nextProfile: machine.nextExchangeRequestProfile,
      })
    },
  }
}

function assertNotificationReentrancy(scenario, vector) {
  assertNotificationFlow(scenario)
  assert.deepEqual(vector.traps,
    { get: 0, getPrototypeOf: 0, ownKeys: 0, getOwnPropertyDescriptor: 0 },
    'notification-reentrancy-before-profile-reflection')
  assert.equal(vector.observations.length, 2, 'notification-reentrancy-completed')
  assert.equal(vector.observations[0].beforeActualCall, false, 'notification-invalid-identity-inert')
  const observation = vector.observations[1]
  assert.equal(observation.thrown, null, 'notification-reentrancy-no-throw')
  assert.deepEqual(observation.results, [undefined, undefined, undefined, undefined])
  assert.equal(observation.state, 'invoking', 'notification-invoking-until-return')
  assert.equal(observation.nextProfile, null, 'notification-no-new-profile-required')
  assert.deepEqual(observation.after, { ...observation.before, observationNotificationViolation: true },
    'notification-reentrancy-only-violation')
  assert.equal(scenario.machine.observationNotificationViolation, true, 'notification-reentrancy-sticky')
  assert.equal(scenario.machine.cleanupLedger.result, 'FAIL', 'notification-reentrancy-fail')
  assert.equal(scenario.machine.preCleanupObservationSnapshot.stickyViolation, false)
  assert.equal(scenario.controller.cleanupStepIds.length, 12)
}

test('ADR0037 sperrt echte interne Reentranz vor gespeichertem und Proxyprofil', { concurrency: false }, async (t) => {
  await withCapturedControlledPromiseHandlers(async (handlerPairs) => {
    await withTemporaryDiagnosticObserverCopy({ anchor: PRIVATE_EXPORT_ANCHOR }, async ({ namespace }) => {
      for (const profileKind of ['saved', 'proxy']) {
        await t.test(profileKind, async () => {
          const vector = createNotificationReentrancyVector(profileKind)
          const scenario = driveNotificationFlow(namespace, handlerPairs, { notificationBehavior: vector.behavior })
          assertNotificationReentrancy(scenario, vector)
          const result = await scenario.runPromise
          assert.equal(result.recordProjection.candidateObserverGate, 'FAIL')
          assert.equal(result.recordProjection.candidateFinding, 'observer-invalid')
        })
      }
    })
  })
})

test('ADR0037 konsumiert aliasierte Rollen getrennt und behaelt keine terminale Referenz', { concurrency: false }, async () => {
  await withCapturedControlledPromiseHandlers(async (handlerPairs) => {
    await withTemporaryDiagnosticObserverCopy({ anchor: PRIVATE_EXPORT_ANCHOR }, async ({ namespace }) => {
      for (const publicPath of [false, true]) {
        const scenario = driveNotificationFlow(namespace, handlerPairs, { aliasRoles: true, publicPath })
        assertNotificationFlow(scenario)
        if (!publicPath) assert.equal(scenario.markers[0].exchange, scenario.activeObservationClosed)
        assert.equal((await scenario.runPromise).ok, true)
        assert.equal(scenario.controller.cleanupStepIds.length, 12)
      }
    })
  })
})

function assertNotificationSourceTransitions(source) {
  assert.equal(countOccurrences(source, 'capturedReflectApply(observationClosed, undefined, [])'), 1,
    'notification-single-apply-callsite')
  assert.equal(countOccurrences(source, 'capturedObservationClosed = null'), 2,
    'notification-factory-slots-discarded-and-transferred')
  assert.equal(countOccurrences(source, "machine.observationNotificationState = 'invoking'"), 1)
  assert.equal(countOccurrences(source, "machine.observationNotificationState = 'consumed'"), 1)
  assert.equal(countOccurrences(source, "machine.observationNotificationState = 'discarded'"), 1)
  assert.equal(countOccurrences(source, 'observationNotificationViolation: false'), 1)
  assert.equal(countOccurrences(source, 'observationNotificationViolation = false'), 0,
    'notification-violation-never-demoted')
  const freezer = source.slice(source.indexOf('function freezeObservationSnapshot(machine) {'),
    source.indexOf('function createCleanupCheckMap() {'))
  assert.ok(freezer.indexOf('machine.preCleanupObservationSnapshot = deepFreezeGenerated(snapshot)') <
    freezer.indexOf('capturedReflectApply(observationClosed, undefined, [])'))
  assert.equal(/\b(?:prepareExchange|invokePreparedExchange|requestCapCancel|initializeCleanupLedger|settleMachineWith\w+)\(/u.test(freezer), false,
    'notification-freezer-no-autonomous-progress')
  assert.match(source, /const activeExchange = capturedExchange\n    const activeObservationClosed = capturedObservationClosed\n    capturedExchange = null\n    capturedObservationClosed = null/u,
    'notification-synchronous-owner-transfer')
  assert.match(source, /machine\.observationNotificationState === 'invoking'\) \{\n    machine\.observationNotificationViolation = true\n    return undefined\n  \}\n\n  if \(machine\.lease === LEASE_OBSERVABLE_PENDING/u,
    'notification-guard-before-join')
}

test('ADR0037 schliesst Notificationtransitions ohne neue Fortschrittsquelle strukturell', async () => {
  assertNotificationSourceTransitions((await readFile(PRODUCTION_MODULE_URL)).toString('utf8'))
})

test('ADR0037 toetet disjunkte Notificationmutanten am jeweils identischen Oracle', { concurrency: false }, async (t) => {
  const call = 'capturedReflectApply(observationClosed, undefined, [])'
  const guard = [
    "  if (machine.observationNotificationState === 'invoking') {",
    '    machine.observationNotificationViolation = true',
    '    return undefined',
    '  }',
  ].join('\n')
  const notificationBlock = (bytes) => {
    const source = bytes.toString('utf8')
    const start = source.indexOf('  // ADR 0037: consume the separate role after O0, before any cleanup transition.')
    const end = source.indexOf('\n}\n\nfunction createCleanupCheckMap()', start)
    assert.ok(start > 0 && end > start)
    return source.slice(start, end)
  }
  function moveBlock(bytes, replace, destination, after) {
    const block = notificationBlock(bytes)
    const removed = replace(bytes, block, '', 'remove-notification-block-for-single-move')
    return replace(removed, destination,
      after ? destination + '\n' + block : block + '\n' + destination,
      'place-notification-block-for-single-move')
  }
  const definitions = [
    { id: 'removed-callsite', mutate: (b, r) => r(b, notificationBlock(b), '', 'removed-callsite') },
    { id: 'before-o0', mutate(b, r) {
      return moveBlock(b, r, '  machine.preCleanupObservationSnapshot = deepFreezeGenerated(snapshot)', false)
    } },
    { id: 'after-phase', mutate(b, r) {
      return moveBlock(b, r, "  freezeObservationSnapshot(machine)\n  machine.phase = 'cleanup'", true)
    } },
    { id: 'after-ledger', mutate(b, r) {
      return moveBlock(b, r, [
        '  initializeCleanupLedger(machine)',
        "  if (machine.portState === 'open') {",
        '    startCleanupController(machine)',
      ].join('\n'), true)
    } },
    { id: 'after-old-cap', vector: { id: 'old-setup' }, mutate(b, r) {
      const block = notificationBlock(b)
      const removed = r(b, block, '', 'remove-notification-block-for-single-move')
      const branch = "  if (context.purpose === 'post-o0-old-cap') {\n    continuePostSnapshotOldCapCancels(machine)"
      return r(removed, branch,
        "  if (context.purpose === 'post-o0-old-cap') {\n" + block + '\n    continuePostSnapshotOldCapCancels(machine)',
        'place-notification-after-old-cap')
    } },
    { id: 'duplicate-callsite', search: call, replacement: `(${call}, ${call})` },
    { id: 'premature-port-discard', vector: { id: 'portless-observation', mode: 'unobservable' },
      search: 'function closePortAndLease(machine) {',
      replacement: 'function closePortAndLease(machine) {\n  machine.activeObservationClosed = null' },
    { id: 'missing-consumption',
      search: '  let observationClosed = machine.activeObservationClosed\n  machine.activeObservationClosed = null',
      replacement: '  let observationClosed = machine.activeObservationClosed' },
    { id: 'missing-prestart-discard', vector: { id: 'prestart', mode: 'malformed' },
      search: 'function clearEphemeralMachineState(machine) {\n  if (machine.activeObservationClosed !== null) {\n    machine.activeObservationClosed = null\n  }',
      replacement: 'function clearEphemeralMachineState(machine) {' },
    { id: 'missing-slot', fault: true,
      search: '    activeObservationClosed: inputValues[1],', replacement: '    activeObservationClosed: null,' },
    { id: 'impossible-consumption-state', fault: true,
      search: "    observationNotificationState: 'armed',", replacement: "    observationNotificationState: 'consumed'," },
    { id: 'cleanup-error-demotion', returnKind: 'proxy',
      search: '  if (machine.observationNotificationViolation) {\n    machine.cleanupInitialViolation = true\n  }',
      replacement: '  if (machine.observationNotificationViolation) {\n    machine.cleanupInitialViolation = false\n  }' },
    { id: 'ignored-throw', returnKind: 'throw',
      search: '    } catch {\n      machine.observationNotificationViolation = true\n    }\n  }\n  observationClosed = null',
      replacement: '    } catch {\n      machine.observationNotificationViolation = false\n    }\n  }\n  observationClosed = null' },
    { id: 'ignored-return', returnKind: 'proxy',
      search: `${call} !== undefined`, replacement: `(${call}, false)` },
    { id: 'return-assimilation', returnKind: 'thenable',
      search: `${call} !== undefined`, replacement: `CapturedPromise.resolve(${call}) !== undefined` },
    { id: 'removed-reentrancy-guard', profileKind: 'saved', search: guard, replacement: '' },
    { id: 'late-reentrancy-guard', profileKind: 'proxy',
      search: guard, replacement: '  if (machine.observationNotificationState === \'invoking\') {\n    profile.phase\n    machine.observationNotificationViolation = true\n    return undefined\n  }' },
    { id: 'guard-after-profile-identity', profileKind: 'saved', mutate(b, r) {
      const removed = r(b, guard, '', 'move-reentrancy-guard')
      return r(removed, '  const phase = profile.phase', guard + '\n\n  const phase = profile.phase', 'late-profile-identity-guard')
    } },
    { id: 'post-marker-pending-progress', vector: { id: 'old-setup', mode: 'pending' },
      search: '  machine.activeExchangePromiseCandidate = candidate',
      replacement: "  machine.activeExchangePromiseCandidate = candidate\n  if (machine.observationNotificationState === 'consumed') {\n    forceControlledHandlerFailure(machine)\n    return undefined\n  }" },
    { id: 'factory-marker', oracle: 'factory',
      search: '    capturedObservationClosed = portValues[1]',
      replacement: '    capturedObservationClosed = portValues[1]\n    capturedReflectApply(capturedObservationClosed, undefined, [])' },
    { id: 'second-length-read', oracle: 'factory',
      search: "    const notificationLength = capturedGetOwnPropertyDescriptor(portValues[1], 'length')",
      replacement: "    capturedGetOwnPropertyDescriptor(portValues[1], 'length')\n    const notificationLength = capturedGetOwnPropertyDescriptor(portValues[1], 'length')" },
    { id: 'late-free-notification-read', oracle: 'factory',
      search: '    const activeObservationClosed = capturedObservationClosed',
      replacement: '    const activeObservationClosed = options.effectPort.observationClosed' },
    { id: 'prestart-marker', oracle: 'wrong-arity',
      search: '    if (arguments.length !== 0) {\n      capturedExchange = null',
      replacement: '    if (arguments.length !== 0) {\n      capturedReflectApply(capturedObservationClosed, undefined, [])\n      capturedExchange = null' },
    { id: 'nonowner-marker', oracle: 'nonowner',
      search: "    if (runState !== 'unused') {",
      replacement: "    if (runState !== 'unused') {\n      capturedReflectApply(capturedObservationClosed, undefined, [])" },
    { id: 'retained-factory-slot', oracle: 'structure',
      search: '    capturedExchange = null\n    capturedObservationClosed = null',
      replacement: '    capturedExchange = null' },
    { id: 'required-field-bypass', oracle: 'required-field',
      search: "    const portValues = readClosedRecord(\n      optionValues[0],\n      ['exchange', 'observationClosed'],\n      visited\n    )",
      replacement: "    const portValues = [readOwnDataDescriptor(optionValues[0], 'exchange'), function () {}]" },
    { id: 'length-value-bypass', oracle: 'invalid-length',
      search: '      notificationLength.value !== 0', replacement: '      false' },
  ]
  async function executeOracle(namespace, handlerPairs, definition, source, expectKill) {
    const vector = definition.returnKind !== undefined ? createNotificationReturnVector(definition.returnKind)
      : definition.profileKind !== undefined ? createNotificationReentrancyVector(definition.profileKind) : null
    // Fixture/driver failures cannot count as an oracle kill.
    const scenario = definition.oracle === undefined ? driveNotificationFlow(namespace, handlerPairs, {
      ...definition.vector, notificationBehavior: vector?.behavior,
    }) : null
    if (expectKill && definition.fault) {
      // Check fail-closed fault handling outside the expected conformance failure.
      assert.equal(scenario.markers.length, 0)
      assert.equal(scenario.machine.activeObservationClosed, null)
      assert.equal(scenario.machine.observationNotificationState, 'consumed')
      assert.equal(scenario.machine.observationNotificationViolation, true)
      assert.equal(scenario.machine.cleanupLedger.result, 'FAIL')
      assert.equal(scenario.controller.cleanupStepIds.length, 12)
    }
    const oracle = async () => {
      if (definition.oracle === 'factory') return assertPublicNotificationCapture(namespace)
      if (definition.oracle === 'wrong-arity' || definition.oracle === 'nonowner') {
        return assertNotificationWrongRunArity(namespace)
      }
      if (definition.oracle === 'structure') return assertNotificationSourceTransitions(source)
      if (definition.oracle === 'required-field' || definition.oracle === 'invalid-length') {
        const effectPort = { exchange() {} }
        if (definition.oracle === 'invalid-length') effectPort.observationClosed = function (one) {}
        assertFactoryDependencyError(() => namespace.createBrowserSyncTransportRuntimeDiagnosticObserver({
          effectPort, runBinding: createValidRunBinding(),
        }))
        return
      }
      if (definition.returnKind !== undefined) assertNotificationFailure(scenario, vector)
      else if (definition.profileKind !== undefined) assertNotificationReentrancy(scenario, vector)
      else assertNotificationFlow(scenario)
    }
    if (expectKill) await assert.rejects(oracle, (error) => error?.code === 'ERR_ASSERTION')
    else await oracle()
  }
  await withCapturedControlledPromiseHandlers(async (handlerPairs) => {
    for (const definition of definitions) {
      await t.test(definition.id, async () => {
        let baselineBytes
        await withTemporaryDiagnosticObserverCopy({ anchor: PRIVATE_EXPORT_ANCHOR }, async ({ namespace, productionBytes, productionSource }) => {
          baselineBytes = productionBytes
          await executeOracle(namespace, handlerPairs, definition, productionSource, false)
        })
        await withTemporaryDiagnosticObserverCopy({
          anchor: PRIVATE_EXPORT_ANCHOR, kind: `adr0037-mutant-${definition.id}`,
          mutate(bytes, replace) {
            return definition.mutate ? definition.mutate(bytes, replace)
              : replace(bytes, definition.search, definition.replacement, definition.id)
          },
        }, async ({ namespace, productionBytes, instrumentedSource }) => {
          assert.deepEqual(productionBytes, baselineBytes, 'same-production-bytes-for-mutant')
          await executeOracle(namespace, handlerPairs, definition, instrumentedSource, true)
        })
      })
    }
  })
})

test('bindet den öffentlichen Modulvertrag importinaktiv und ohne zusätzliche Exports', () => {
  assert.deepEqual(Object.keys(diagnosticObserverModule), [PUBLIC_EXPORT_NAME])
  assert.equal(typeof createBrowserSyncTransportRuntimeDiagnosticObserver, 'function')
  assert.equal(createBrowserSyncTransportRuntimeDiagnosticObserver.length, 1)
  assert.equal(HISTORICAL_REPLAY_VALUES.length, 59)
  assert.equal(HISTORICAL_COMMIT.length, 40)
  assert.equal(EVALUATION_SHA256.length, 64)
})

test('bleibt beim frischen Import ohne Timer-, Browser-, Netzwerk-, Log- oder Storagewirkung', { concurrency: false }, async () => {
  const globalNames = [
    'fetch',
    'setTimeout',
    'setInterval',
    'WebSocket',
    'XMLHttpRequest',
    'localStorage',
    'sessionStorage',
  ]
  const globalDescriptors = new Map(
    globalNames.map((name) => [
      name,
      Object.getOwnPropertyDescriptor(globalThis, name),
    ])
  )
  const consoleNames = ['log', 'info', 'warn', 'error', 'debug']
  const consoleDescriptors = new Map(
    consoleNames.map((name) => [
      name,
      Object.getOwnPropertyDescriptor(console, name),
    ])
  )
  const calls = []

  try {
    for (const name of globalNames) {
      Object.defineProperty(globalThis, name, {
        configurable: true,
        enumerable: false,
        value() {
          calls.push(name)
          throw new Error(`forbidden-import-effect:${name}`)
        },
        writable: true,
      })
    }
    for (const name of consoleNames) {
      Object.defineProperty(console, name, {
        configurable: true,
        enumerable: false,
        value() {
          calls.push(`console.${name}`)
        },
        writable: true,
      })
    }

    freshImportSequence += 1
    const imported = await import(
      `${PRODUCTION_MODULE_URL.href}?import-inactive=${freshImportSequence}`
    )
    assert.deepEqual(Object.keys(imported), [PUBLIC_EXPORT_NAME])
    assert.deepEqual(calls, [])
  } finally {
    for (const [name, descriptor] of globalDescriptors) {
      restoreOwnProperty(globalThis, name, descriptor)
    }
    for (const [name, descriptor] of consoleDescriptors) {
      restoreOwnProperty(console, name, descriptor)
    }
  }
})

test('enthält keine Implementierungsimports oder autonome Hoststrecke', async () => {
  const source = (await readFile(PRODUCTION_MODULE_URL)).toString('utf8')
  const forbiddenPatterns = [
    /(?:^|\n)\s*import\s+(?!\()/u,
    /\bnode:(?:http|https|net|tls|dns|child_process|worker_threads)\b/u,
    /\b(?:setTimeout|setInterval|setImmediate)\s*\(/u,
    /\b(?:fetch|WebSocket|XMLHttpRequest)\s*\(/u,
    /\b(?:localStorage|sessionStorage)\s*[.[]/u,
    /\bconsole\s*\./u,
  ]

  for (const pattern of forbiddenPatterns) {
    assert.equal(pattern.test(source), false, String(pattern))
  }
})

test('weist ungültige Factorygrenzen synchron und statisch zurück', () => {
  const invalidValues = [
    undefined,
    null,
    {},
    { effectPort: {}, runBinding: createValidRunBinding() },
    {
      effectPort: { exchange() {} },
      runBinding: createValidRunBinding(),
      extra: true,
    },
  ]

  for (const value of invalidValues) {
    assertFactoryDependencyError(
      () => createBrowserSyncTransportRuntimeDiagnosticObserver(value)
    )
  }

  assertFactoryDependencyError(
    () => createBrowserSyncTransportRuntimeDiagnosticObserver()
  )
  assertFactoryDependencyError(
    () => createBrowserSyncTransportRuntimeDiagnosticObserver(
      createObserverOptions(),
      undefined
    )
  )
})

test('erzwingt gewöhnliche Factory-, Port- und RunBinding-Knoten mit exakter Keyfolge', () => {
  const validRunBinding = createValidRunBinding()
  const validOptions = createObserverOptions(validRunBinding)
  const reversedOptions = {
    runBinding: validRunBinding,
    effectPort: validOptions.effectPort,
  }
  const reversedPort = {}
  Object.defineProperty(reversedPort, 'exchange', {
    configurable: true,
    enumerable: false,
    value() {},
    writable: true,
  })
  reversedPort.observationClosed = createNotificationProbe().observationClosed
  const rootWithSymbol = cloneTree(validRunBinding)
  rootWithSymbol[Symbol('extra')] = true
  const replayWithSymbol = cloneTree(validRunBinding)
  replayWithSymbol.replayOperands[0][Symbol('extra')] = true
  const rootWithNullPrototype = Object.assign(
    Object.create(null),
    cloneTree(validRunBinding)
  )
  let accessorCalls = 0
  const accessorOptions = {}
  Object.defineProperty(accessorOptions, 'effectPort', {
    configurable: true,
    enumerable: true,
    get() {
      accessorCalls += 1
      return validOptions.effectPort
    },
  })
  Object.defineProperty(accessorOptions, 'runBinding', {
    configurable: true,
    enumerable: true,
    value: validRunBinding,
    writable: true,
  })
  const reflectionThrow = new Proxy({}, {
    ownKeys() {
      throw new Error('private-reflection-sentinel')
    },
  })

  const invalidOptions = [
    reversedOptions,
    { ...validOptions, extra: true },
    Object.assign(Object.create(null), validOptions),
    [validOptions.effectPort, validRunBinding],
    { effectPort: reversedPort, runBinding: validRunBinding },
    { effectPort: { exchange() {}, observationClosed() {}, extra: true }, runBinding: validRunBinding },
    { effectPort: Object.create(null), runBinding: validRunBinding },
    { effectPort: reflectionThrow, runBinding: validRunBinding },
    { effectPort: validOptions.effectPort, runBinding: rootWithSymbol },
    { effectPort: validOptions.effectPort, runBinding: replayWithSymbol },
    { effectPort: validOptions.effectPort, runBinding: rootWithNullPrototype },
    accessorOptions,
  ]

  for (const options of invalidOptions) {
    assertFactoryDependencyError(
      () => createBrowserSyncTransportRuntimeDiagnosticObserver(options)
    )
  }
  assert.equal(accessorCalls, 0)
})

test('liest jeden geschlossenen Factoryknoten descriptorbasiert exakt einmal und nie frei', () => {
  const observations = []
  const runBinding = createDescriptorObservationTree(
    cloneTree(createValidRunBinding()),
    'runBinding',
    observations
  )
  const effectPort = createDescriptorObservationTree(
    {
      exchange() { return new Promise(() => {}) },
      observationClosed: createNotificationProbe().observationClosed,
    },
    'effectPort',
    observations
  )
  const options = createDescriptorObservationTree(
    { effectPort, runBinding },
    'options',
    observations,
    true
  )

  const api = createBrowserSyncTransportRuntimeDiagnosticObserver(options)
  assertFrozenOrdinaryRecord(api, ['run'])

  for (const observation of observations) {
    assert.equal(observation.getCalls, 0, observation.label)
    assert.equal(observation.prototypeCalls, 1, observation.label)
    assert.equal(observation.ownKeysCalls, 1, observation.label)
    for (const key of Reflect.ownKeys(observation.target)) {
      assert.equal(
        observation.descriptorCalls.get(key),
        1,
        `${observation.label}.${String(key)}`
      )
    }
  }
})

test('verändert oder friert Factoryeingaben nicht ein', () => {
  const runBinding = cloneTree(createValidRunBinding())
  const effectPort = {
    exchange() { return new Promise(() => {}) },
    observationClosed: createNotificationProbe().observationClosed,
  }
  const options = { effectPort, runBinding }

  createBrowserSyncTransportRuntimeDiagnosticObserver(options)

  assert.equal(Object.isFrozen(options), false)
  assert.equal(Object.isFrozen(effectPort), false)
  assert.equal(Object.isFrozen(runBinding), false)
  assert.equal(Object.isFrozen(runBinding.replayOperands), false)
  assert.equal(Object.isFrozen(runBinding.replayOperands[0]), false)
  runBinding.diagnosticRunId = 'caller-remains-mutable'
  assert.equal(runBinding.diagnosticRunId, 'caller-remains-mutable')
})

test('bindet alle 59 Replaypositionen und Feld-IDs kanonisch', () => {
  assertFactoryAccepts(createValidRunBinding())

  for (let index = 0; index < HISTORICAL_REPLAY_VALUES.length; index += 1) {
    const [fieldId] = HISTORICAL_REPLAY_VALUES[index]
    assertFactoryDependencyError(
      () => createBrowserSyncTransportRuntimeDiagnosticObserver(
        createObserverOptions(createReplayVariant(index, {
          fieldId: `${fieldId}.wrong`,
        }))
      )
    )
  }

  const missing = cloneTree(createValidRunBinding())
  missing.replayOperands.pop()
  const additional = cloneTree(createValidRunBinding())
  additional.replayOperands.push({
    fieldId: 'extra',
    observationState: 'observed',
    replayValue: 'extra',
  })
  const sparse = cloneTree(createValidRunBinding())
  Reflect.deleteProperty(sparse.replayOperands, '10')
  const reordered = cloneTree(createValidRunBinding())
  const first = reordered.replayOperands[0]
  reordered.replayOperands[0] = reordered.replayOperands[1]
  reordered.replayOperands[1] = first
  const arrayWithExtra = cloneTree(createValidRunBinding())
  arrayWithExtra.replayOperands.extra = true

  for (const runBinding of [missing, additional, sparse, reordered, arrayWithExtra]) {
    assertFactoryDependencyError(
      () => createBrowserSyncTransportRuntimeDiagnosticObserver(
        createObserverOptions(deepFreeze(runBinding))
      )
    )
  }
})

test('erzwingt Replayzustände, Nullregeln und primitive skalare Werte', () => {
  assertFactoryAccepts(createReplayVariant(9, {
    observationState: 'not-observed',
    replayValue: null,
  }))
  assertFactoryAccepts(createReplayVariant(9, {
    observationState: 'ambiguous',
    replayValue: null,
  }))

  const invalidBindings = [
    createReplayVariant(9, {
      observationState: 'unknown',
      replayValue: null,
    }),
    createReplayVariant(9, {
      observationState: 'not-observed',
      replayValue: 'local-disposable',
    }),
    createReplayVariant(9, {
      observationState: 'observed',
      replayValue: null,
    }),
    createReplayVariant(9, {
      observationState: 'observed',
      replayValue: {},
    }),
  ]

  for (const runBinding of invalidBindings) {
    assertFactoryDependencyError(
      () => createBrowserSyncTransportRuntimeDiagnosticObserver(
        createObserverOptions(runBinding)
      )
    )
  }
})

test('schließt Lower-Hex-, Printable-ASCII- und Portgrenzen', () => {
  const lowerHex = HISTORICAL_REPLAY_VALUES[0][1]
  const printableIndex = 12
  const portIndex = 47

  assertFactoryAccepts(createReplayVariant(0, { replayValue: 'a'.repeat(64) }))
  assertFactoryAccepts(createReplayVariant(printableIndex, {
    replayValue: ` ${'A'.repeat(14)} `,
  }))
  assertFactoryAccepts(createReplayVariant(portIndex, { replayValue: 0 }))
  assertFactoryAccepts(createReplayVariant(portIndex, { replayValue: 65_535 }))

  const invalidBindings = [
    createReplayVariant(0, { replayValue: lowerHex.toUpperCase() }),
    createReplayVariant(0, { replayValue: 'a'.repeat(63) }),
    createReplayVariant(0, { replayValue: 'a'.repeat(65) }),
    createReplayVariant(printableIndex, { replayValue: '' }),
    createReplayVariant(printableIndex, { replayValue: 'A'.repeat(17) }),
    createReplayVariant(printableIndex, { replayValue: '\u001f' }),
    createReplayVariant(printableIndex, { replayValue: '\u007f' }),
    createReplayVariant(printableIndex, { replayValue: 'ä' }),
    createReplayVariant(portIndex, { replayValue: -1 }),
    createReplayVariant(portIndex, { replayValue: 65_536 }),
    createReplayVariant(portIndex, { replayValue: 8787.5 }),
    createReplayVariant(portIndex, { replayValue: '8787' }),
  ]

  for (const runBinding of invalidBindings) {
    assertFactoryDependencyError(
      () => createBrowserSyncTransportRuntimeDiagnosticObserver(
        createObserverOptions(runBinding)
      )
    )
  }
})

test('schließt ID-, UTC-, Zeitzonen- und Core-SemVer-Grammatiken', () => {
  const acceptedTimeZones = [
    'UTC',
    'Europe/Berlin',
    'Etc/GMT+1',
    'America/Argentina/Buenos_Aires',
  ]
  const acceptedSemVers = [
    '0.0.0',
    '24.19.0',
    `${'1'.repeat(10)}.${'2'.repeat(10)}.${'3'.repeat(10)}`,
  ]

  for (const timeZone of acceptedTimeZones) {
    assertFactoryAccepts(createRootVariant('timeZone', timeZone))
  }
  for (const semVer of acceptedSemVers) {
    assertFactoryAccepts(
      createRootVariant('viteRuntimeVersionObservation', semVer)
    )
  }
  assertFactoryAccepts(
    createRootVariant('viteRuntimeVersionObservation', null)
  )
  assertFactoryAccepts(
    createRootVariant('diagnosticRunId', 'a'.repeat(32))
  )
  assertFactoryAccepts(
    createRootVariant('observedAt', '2024-02-29T23:59:59.999Z')
  )

  const invalidBindings = [
    createRootVariant('diagnosticRunId', ''),
    createRootVariant('diagnosticRunId', 'A'),
    createRootVariant('diagnosticRunId', 'a'.repeat(33)),
    createRootVariant('replayContextId', 'chrome-stable-win-t0-01'),
    createRootVariant('repositoryCommit', REPLAY_COMMIT.toUpperCase()),
    createRootVariant('repositoryCommit', 'a'.repeat(39)),
    createRootVariant('observedAt', '2023-02-29T12:00:00.000Z'),
    createRootVariant('observedAt', '2026-09-05T12:00:00Z'),
    createRootVariant('observedAt', '2026-09-05t12:00:00.000z'),
    createRootVariant('timeZone', 'Berlin'),
    createRootVariant('timeZone', 'Europe//Berlin'),
    createRootVariant('timeZone', 'Europe/1Berlin'),
    createRootVariant('timeZone', 'Europe\\Berlin'),
    createRootVariant('timeZone', 'Europe/Berlín'),
    createRootVariant('timeZone', `A/${'b'.repeat(63)}`),
    createRootVariant('viteRuntimeVersionObservation', '01.2.3'),
    createRootVariant('viteRuntimeVersionObservation', 'v1.2.3'),
    createRootVariant('viteRuntimeVersionObservation', '1.2.3-alpha'),
    createRootVariant('viteRuntimeVersionObservation', '1.2'),
    createRootVariant('viteRuntimeVersionObservation',
      `${'1'.repeat(11)}.${'2'.repeat(10)}.${'3'.repeat(10)}`),
  ]

  for (const runBinding of invalidBindings) {
    assertFactoryDependencyError(
      () => createBrowserSyncTransportRuntimeDiagnosticObserver(
        createObserverOptions(runBinding)
      )
    )
  }
})

test('schließt Profilinstanz- und Kausalabweichungsbeobachtungen', () => {
  const invalidProfileValues = [
    { newInstanceObserved: true, historicalInstanceReuseObserved: true },
    { newInstanceObserved: 'true', historicalInstanceReuseObserved: false },
    { historicalInstanceReuseObserved: false, newInstanceObserved: true },
  ]
  const invalidDeviationValues = [
    { reviewCompleted: false, deviationObserved: true },
    { reviewCompleted: true, deviationObserved: 'false' },
    { deviationObserved: false, reviewCompleted: true },
  ]

  for (const value of invalidProfileValues) {
    assertFactoryDependencyError(
      () => createBrowserSyncTransportRuntimeDiagnosticObserver(
        createObserverOptions(
          createRootVariant('profileInstanceObservation', value)
        )
      )
    )
  }
  for (const value of invalidDeviationValues) {
    assertFactoryDependencyError(
      () => createBrowserSyncTransportRuntimeDiagnosticObserver(
        createObserverOptions(
          createRootVariant('unexplainedCausalDeviationObservation', value)
        )
      )
    )
  }
})

test('erzeugt eine frische eingefrorene API ohne Factoryeffect', () => {
  let exchangeCalls = 0
  const effectPort = {
    exchange() {
      exchangeCalls += 1
      return new Promise(() => {})
    },
    observationClosed: createNotificationProbe().observationClosed,
  }
  const runBinding = createValidRunBinding()

  const first = createBrowserSyncTransportRuntimeDiagnosticObserver({
    effectPort,
    runBinding,
  })
  const second = createBrowserSyncTransportRuntimeDiagnosticObserver({
    effectPort,
    runBinding,
  })

  assert.notEqual(first, second)
  assertFrozenOrdinaryRecord(first, ['run'])
  assertFrozenOrdinaryRecord(second, ['run'])
  assert.equal(first.run.length, 0)
  assert.equal(second.run.length, 0)
  assert.equal(exchangeCalls, 0)
})

test('liefert beim falschen ersten Runaufruf einen lokalen erfüllten Fehler ohne Effect', async () => {
  let exchangeCalls = 0
  const observer = createBrowserSyncTransportRuntimeDiagnosticObserver({
    effectPort: {
      exchange() {
        exchangeCalls += 1
        return Promise.resolve(undefined)
      },
      observationClosed: createNotificationProbe().observationClosed,
    },
    runBinding: createValidRunBinding(),
  })

  const pending = observer.run('forbidden')
  assert.equal(utilTypes.isPromise(pending), true)
  const result = await pending

  assertFoundationResult(result)
  assert.equal(result.ok, false)
  assert.equal(result.recordProjection, null)
  assert.deepEqual(result.error, EXPECTED_FOUNDATION_ERROR)
  assert.equal(exchangeCalls, 0)

  const laterNonOwner = observer.run()
  assert.equal(utilTypes.isPromise(laterNonOwner), true)
  assert.notEqual(laterNonOwner, pending)
  const laterResult = await laterNonOwner
  assertFoundationResult(laterResult)
  assert.equal(laterResult.ok, false)
  assert.equal(laterResult.recordProjection, null)
  assert.deepEqual(laterResult.error, EXPECTED_FOUNDATION_ERROR)
  assert.equal(exchangeCalls, 0)
})

test('latcht den Owner vor reentrantem Portzugriff und isoliert alle Nicht-Owner', { concurrency: false }, async () => {
  let observer
  let ownerPromise
  let reentrantPromise
  let exchangeCalls = 0
  let receivedIntent
  let releaseExchange
  const exchangePromise = normalizePromise(new Promise((resolve) => {
    releaseExchange = resolve
  }))
  const effectPort = {
    exchange(intent) {
      assert.equal(this, undefined)
      exchangeCalls += 1
      receivedIntent = intent
      reentrantPromise = observer.run()
      return exchangePromise
    },
    observationClosed: createNotificationProbe().observationClosed,
  }

  observer = createBrowserSyncTransportRuntimeDiagnosticObserver({
    effectPort,
    runBinding: createValidRunBinding(),
  })
  ownerPromise = observer.run()
  const parallelPromise = observer.run()

  assert.equal(utilTypes.isPromise(ownerPromise), true)
  assert.equal(utilTypes.isPromise(reentrantPromise), true)
  assert.equal(utilTypes.isPromise(parallelPromise), true)
  assert.notEqual(ownerPromise, reentrantPromise)
  assert.notEqual(ownerPromise, parallelPromise)
  assert.notEqual(reentrantPromise, parallelPromise)
  assert.equal(exchangeCalls, 1)

  assertFrozenOrdinaryRecord(receivedIntent, ['intentId', 'kind', 'payload'])
  assert.equal(receivedIntent.intentId, 1)
  assert.equal(receivedIntent.kind, 'capability-probe')
  assertFrozenOrdinaryRecord(receivedIntent.payload, ['profile'])
  assert.equal(
    receivedIntent.payload.profile,
    'adr-0033-foundation-effect-port-v1'
  )

  for (const nonOwnerPromise of [reentrantPromise, parallelPromise]) {
    const result = await nonOwnerPromise
    assertFoundationResult(result)
    assert.equal(result.ok, false)
    assert.deepEqual(result.error, EXPECTED_FOUNDATION_ERROR)
  }

  let ownerSettlements = 0
  ownerPromise.then(() => {
    ownerSettlements += 1
  })
  await Promise.resolve()
  assert.equal(ownerSettlements, 0)
  assert.equal(exchangeCalls, 1)

  releaseExchange({
    kind: 'capability-probe-result',
    profile: 'wrong-profile',
    capabilitySet: 'wrong-capability',
  })
  const ownerResult = await ownerPromise
  assertFoundationResult(ownerResult)
  assert.equal(ownerResult.ok, false)
  assert.equal(ownerSettlements, 1)
  assert.equal(exchangeCalls, 1)
})

test('erzeugt die rohe ADR-0035-Konformitaetskopie mit exakt vier privaten Bindings', { concurrency: false }, async () => {
  await withTemporaryDiagnosticObserverCopy({
    anchor: PRIVATE_EXPORT_ANCHOR,
  }, async ({ namespace, productionBytes, productionSource }) => {
    assert.equal(
      countBufferOccurrences(productionBytes, PRIVATE_EXPORT_ANCHOR),
      1
    )
    assert.equal(
      countBufferOccurrences(productionBytes, TEST_EXPORT_DECLARATION),
      0
    )
    assert.equal(namespace.deriveCandidateObserverGate.length, 1)
    assert.equal(namespace.deriveCandidateFinding.length, 1)
    assert.equal(
      namespace.createBrowserSyncTransportRuntimeDiagnosticRunMachine.length,
      1
    )
    assert.equal(
      namespace.requestBrowserSyncTransportRuntimeDiagnosticExchange.length,
      2
    )

    const expressionMatch = productionSource.match(
      /const EVALUATION_EXPRESSION = '([^']*)'/u
    )
    assert.notEqual(expressionMatch, null)
    const expressionBytes = Buffer.from(expressionMatch[1], 'utf8')
    assert.equal(expressionBytes.byteLength, 4259)
    assert.equal(sha256(expressionBytes), EVALUATION_SHA256)

    const receivedIntents = []
    const deferred = createCleanDeferred()
    const activeExchange = (intent) => {
      receivedIntents.push(intent)
      return deferred.promise
    }
    const internalRunBinding = createInternalRunBinding()
    const machine =
      namespace.createBrowserSyncTransportRuntimeDiagnosticRunMachine({
        activeExchange,
        activeObservationClosed: createNotificationProbe().observationClosed,
        runBinding: internalRunBinding,
      })

    assert.equal(machine.runState, 'active')
    assert.equal(machine.activeRunToken, 1)
    assert.equal(machine.attemptStarted, false)
    assert.equal(machine.phase, 'prestart')
    assert.equal(machine.lease, 'idle')
    assert.equal(machine.activeExchange, activeExchange)
    assert.equal(machine.runBinding, internalRunBinding)
    assert.equal(machine.intentCount, 0)
    assert.equal(machine.nextIntentId, 1)
    assert.equal(machine.portCallCount, 0)
    assert.equal(machine.protocolSendCount, 0)
    assert.equal(machine.capabilityCallCount, 0)
    assert.equal(machine.currentExchangeCount, 0)
    assert.equal(machine.runSettlementCount, 0)
    assert.equal(machine.preCleanupObservationSnapshot, null)
    assert.equal(machine.cleanupLedger, null)
    assert.equal(machine.pendingInternalExchangeViolation, false)
    assert.equal(receivedIntents.length, 0)
    assertFrozenOrdinaryRecord(
      machine.nextExchangeRequestProfile,
      ['phase', 'intentKind', 'payload']
    )
    assert.equal(machine.nextExchangeRequestProfile.phase, 'prestart')
    assert.equal(
      machine.nextExchangeRequestProfile.intentKind,
      'capability-probe'
    )
    assert.equal(
      namespace.requestBrowserSyncTransportRuntimeDiagnosticExchange(
        machine,
        machine.nextExchangeRequestProfile
      ),
      undefined
    )
    assert.equal(receivedIntents.length, 1)
    assert.equal(machine.lease, 'observable-pending')
    assert.equal(machine.activeExchangeRequestProfile.phase, 'prestart')
  })
})

test('loescht den privaten activeExchange-Slot auf jedem Terminalpfad exakt einmal', { concurrency: false }, async (t) => {
  await withTemporaryDiagnosticObserverCopy({
    anchor: PRIVATE_EXPORT_ANCHOR,
    kind: 'active-exchange-single-clear-conformance',
  }, async ({ namespace }) => {
    function instrumentActiveExchange(machine) {
      let current = machine.activeExchange
      const writes = []
      Object.defineProperty(machine, 'activeExchange', {
        configurable: true,
        enumerable: true,
        get() {
          return current
        },
        set(value) {
          writes.push(value)
          current = value
        },
      })
      return { current: () => current, writes }
    }

    await t.test('prestart-unobservable', async () => {
      let calls = 0
      const machine =
        namespace.createBrowserSyncTransportRuntimeDiagnosticRunMachine({
          activeExchange() {
            calls += 1
            return undefined
          },
          activeObservationClosed: createNotificationProbe().observationClosed,
          runBinding: createInternalRunBinding(),
        })
      const observed = instrumentActiveExchange(machine)
      assert.equal(
        namespace.requestBrowserSyncTransportRuntimeDiagnosticExchange(
          machine,
          machine.nextExchangeRequestProfile
        ),
        undefined
      )
      const result = await machine.ownerRunPromise
      assert.equal(result.ok, false)
      assert.equal(calls, 1)
      assert.deepEqual(observed.writes, [null])
      assert.equal(observed.current(), null)
    })

    await t.test('pending-join', async () => {
      const deferred = createCleanDeferred()
      let receivedIntent = null
      const machine =
        namespace.createBrowserSyncTransportRuntimeDiagnosticRunMachine({
          activeExchange(intent) {
            receivedIntent = intent
            return deferred.promise
          },
          activeObservationClosed: createNotificationProbe().observationClosed,
          runBinding: createInternalRunBinding(),
        })
      const observed = instrumentActiveExchange(machine)
      assert.equal(
        namespace.requestBrowserSyncTransportRuntimeDiagnosticExchange(
          machine,
          machine.nextExchangeRequestProfile
        ),
        undefined
      )
      assert.equal(machine.lease, 'observable-pending')
      assert.equal(
        namespace.requestBrowserSyncTransportRuntimeDiagnosticExchange(
          machine,
          machine.activeExchangeRequestProfile
        ),
        undefined
      )
      deferred.resolve(normalFulfillmentForIntent(receivedIntent))
      const result = await machine.ownerRunPromise
      assert.equal(result.ok, false)
      assert.deepEqual(observed.writes, [null])
      assert.equal(observed.current(), null)
    })

    await t.test('normal-projection', async () => {
      const controller = createFullRunEffectController()
      const machine =
        namespace.createBrowserSyncTransportRuntimeDiagnosticRunMachine({
          activeExchange: controller.effectPort.exchange,
          activeObservationClosed: createNotificationProbe().observationClosed,
          runBinding: createInternalRunBinding(),
        })
      const observed = instrumentActiveExchange(machine)
      assert.equal(
        namespace.requestBrowserSyncTransportRuntimeDiagnosticExchange(
          machine,
          machine.nextExchangeRequestProfile
        ),
        undefined
      )
      const result = await machine.ownerRunPromise
      assert.equal(result.ok, true)
      assert.notEqual(result.recordProjection, null)
      assert.deepEqual(observed.writes, [null])
      assert.equal(observed.current(), null)
    })
  })
})

test('haelt nur den aktuellen gueltigen Exchange-Promisekandidaten bis Settlement', { concurrency: false }, async (t) => {
  await withCapturedControlledPromiseHandlers(async (handlerPairs) => {
    await withTemporaryDiagnosticObserverCopy({
      anchor: PRIVATE_EXPORT_ANCHOR,
      kind: 'active-promise-candidate-conformance',
    }, async ({ namespace }) => {
      for (const outcome of ['fulfillment', 'rejection']) {
        await t.test(outcome, async () => {
          const deferred = createCleanDeferred()
          let receivedIntent = null
          const machine =
            namespace.createBrowserSyncTransportRuntimeDiagnosticRunMachine({
              activeExchange(intent) {
                receivedIntent = intent
                return deferred.promise
              },
              activeObservationClosed: createNotificationProbe().observationClosed,
              runBinding: createInternalRunBinding(),
            })
          assert.equal(machine.activeExchangePromiseCandidate, null)
          assert.equal(
            namespace.requestBrowserSyncTransportRuntimeDiagnosticExchange(
              machine,
              machine.nextExchangeRequestProfile
            ),
            undefined
          )
          assert.equal(machine.activeExchangePromiseCandidate, deferred.promise)
          assert.equal(machine.lease, 'observable-pending')
          assert.equal(
            namespace.requestBrowserSyncTransportRuntimeDiagnosticExchange(
              machine,
              machine.activeExchangeRequestProfile
            ),
            undefined
          )
          const pair = handlerPairs.get(deferred.promise)
          assert.notEqual(pair, undefined)
          if (outcome === 'fulfillment') {
            assert.equal(
              pair.onFulfilled(normalFulfillmentForIntent(receivedIntent)),
              undefined
            )
          } else {
            assert.equal(pair.onRejected(), undefined)
          }
          assert.equal(machine.activeExchangePromiseCandidate, null)
          assert.equal(machine.lease, 'closed')
          const result = await machine.ownerRunPromise
          assert.equal(result.ok, false)
          assert.deepEqual(
            Reflect.ownKeys(machine).filter(
              (key) => typeof key === 'string' &&
                /exchange.*promise|promise.*exchange/iu.test(key)
            ),
            ['activeExchangePromiseCandidate']
          )
        })
      }

      await t.test('malformed-candidate-is-never-retained', async () => {
        const malformedCandidate = Object.freeze({ then() {} })
        const machine =
          namespace.createBrowserSyncTransportRuntimeDiagnosticRunMachine({
            activeExchange() {
              return malformedCandidate
            },
            activeObservationClosed: createNotificationProbe().observationClosed,
            runBinding: createInternalRunBinding(),
          })
        namespace.requestBrowserSyncTransportRuntimeDiagnosticExchange(
          machine,
          machine.nextExchangeRequestProfile
        )
        assert.equal(machine.activeExchangePromiseCandidate, null)
        assert.equal((await machine.ownerRunPromise).ok, false)
      })
    })
  })
})

test('totalisiert die privaten Candidate-Gate- und Finding-Ableitungen', { concurrency: false }, async () => {
  await withTemporaryDiagnosticObserverCopy({
    anchor: PRIVATE_EXPORT_ANCHOR,
  }, async ({ namespace }) => {
    const gateCases = [
      [false, false, 'PASS'],
      [false, true, 'UNPROVEN'],
      [true, false, 'FAIL'],
      [true, true, 'FAIL'],
    ]
    for (const [hardViolation, proofIncomplete, expected] of gateCases) {
      assert.equal(
        namespace.deriveCandidateObserverGate({
          hardViolation,
          proofIncomplete,
        }),
        expected
      )
    }

    const gates = ['FAIL', 'UNPROVEN', 'PASS']
    const replays = ['EQUIVALENT', 'DIVERGED', 'UNPROVEN']
    const stimuli = ['zero', 'one', 'multiple', 'unknown']
    const sequences = [
      'OPTIONS-204-POST-200-loadingFinished',
      'other',
      'incomplete',
      'ambiguous',
    ]
    const outcomes = [
      'fulfilled',
      'static-redacted-rejection',
      'other-rejection',
      'unknown',
    ]
    const profiles = ['match', 'mismatch', 'unproven', 'not-applicable']
    let caseCount = 0

    for (const candidateObserverGate of gates) {
      for (const replayResult of replays) {
        for (const stimulusCount of stimuli) {
          for (const requestSequence of sequences) {
            for (const settlementOutcome of outcomes) {
              for (const settlementStaticProfileResult of profiles) {
                const input = {
                  candidateObserverGate,
                  replayResult,
                  stimulusCount,
                  requestSequence,
                  settlementOutcome,
                  settlementStaticProfileResult,
                }
                let expected = 'inconclusive'
                if (candidateObserverGate === 'FAIL') {
                  expected = 'observer-invalid'
                } else if (
                  candidateObserverGate === 'PASS' &&
                  replayResult === 'EQUIVALENT' &&
                  stimulusCount === 'one'
                ) {
                  if (requestSequence === 'other') {
                    expected = 'network-signature-diverged'
                  } else if (
                    requestSequence ===
                      'OPTIONS-204-POST-200-loadingFinished' &&
                    settlementOutcome === 'static-redacted-rejection' &&
                    settlementStaticProfileResult === 'match'
                  ) {
                    expected =
                      'static-rejection-reproduced-after-http200'
                  } else if (
                    requestSequence ===
                      'OPTIONS-204-POST-200-loadingFinished' &&
                    settlementOutcome === 'fulfilled' &&
                    settlementStaticProfileResult === 'not-applicable'
                  ) {
                    expected = 'original-failure-not-reproduced'
                  }
                }
                assert.equal(
                  namespace.deriveCandidateFinding(input),
                  expected,
                  JSON.stringify(input)
                )
                caseCount += 1
              }
            }
          }
        }
      }
    }
    assert.equal(caseCount, 2304)

    assert.throws(
      () => namespace.deriveCandidateObserverGate({
        proofIncomplete: false,
        hardViolation: false,
      }),
      TypeError
    )
    assert.throws(
      () => namespace.deriveCandidateFinding({
        candidateObserverGate: 'PASS',
      }),
      TypeError
    )
  })
})

test('bindet den zentralen Join vor Profilreflexion, Intent, ID, Ledger und Capability', { concurrency: false }, async () => {
  await withTemporaryDiagnosticObserverCopy({
    anchor: PRIVATE_EXPORT_ANCHOR,
  }, async ({ namespace }) => {
    const receivedIntents = []
    const deferred = createCleanDeferred()
    let capabilityCalls = 0
    const machine =
      namespace.createBrowserSyncTransportRuntimeDiagnosticRunMachine({
        activeExchange(intent) {
          capabilityCalls += 1
          receivedIntents.push(intent)
          return deferred.promise
        },
        activeObservationClosed: createNotificationProbe().observationClosed,
        runBinding: createInternalRunBinding(),
      })
    const profile = machine.nextExchangeRequestProfile
    namespace.requestBrowserSyncTransportRuntimeDiagnosticExchange(
      machine,
      profile
    )
    const before = snapshotJoinState(
      machine,
      receivedIntents,
      capabilityCalls
    )
    assert.equal(
      namespace.requestBrowserSyncTransportRuntimeDiagnosticExchange(
        machine,
        new Proxy({}, {
          get() {
            throw new Error('pending-profile-read')
          },
          getOwnPropertyDescriptor() {
            throw new Error('pending-profile-reflection')
          },
          getPrototypeOf() {
            throw new Error('pending-profile-prototype')
          },
          ownKeys() {
            throw new Error('pending-profile-keys')
          },
        })
      ),
      undefined
    )
    const after = snapshotJoinState(
      machine,
      receivedIntents,
      capabilityCalls
    )
    assertOnlyJoinClassificationChanged(before, after, 'prestart')
  })
})

test('totalisiert exakt 18 Pending-Join-Faelle ueber Phase, Outcome und Zeitlage', { concurrency: false }, async (t) => {
  await withCapturedControlledPromiseHandlers(async (handlerPairs) => {
    await withTemporaryDiagnosticObserverCopy({
      anchor: PRIVATE_EXPORT_ANCHOR,
    }, async ({ namespace }) => {
    const phases = ['prestart', 'observation', 'cleanup']
    const outcomes = ['fulfillment', 'rejection']
    const timings = [
      'pre-invocation',
      'synchronous-post-invocation',
      'observable-pending',
    ]
    let caseCount = 0

    for (const phase of phases) {
      for (const outcome of outcomes) {
        for (const timing of timings) {
          await t.test(`${phase}/${outcome}/${timing}`, async () => {
            const fixture = prepareJoinFixture(
              namespace,
              handlerPairs,
              phase,
              timing,
              outcome
            )
            const {
              calls,
              capabilityCalls,
              fulfillmentValue,
              machine,
              rejectionReason,
              targetCallIndex,
              targetDeferred,
            } = fixture
            const snapshotBeforeJoin = machine.preCleanupObservationSnapshot
            assert.equal(fixture.notificationProbe.calls.length, phase === 'cleanup' ? 1 : 0)
            const before = snapshotJoinState(
              machine,
              calls.map((call) => call.intent),
              capabilityCalls()
            )
            const activeProfile = machine.activeExchangeRequestProfile

            assert.equal(
              namespace.requestBrowserSyncTransportRuntimeDiagnosticExchange(
                machine,
                activeProfile
              ),
              undefined
            )
            const after = snapshotJoinState(
              machine,
              calls.map((call) => call.intent),
              capabilityCalls()
            )
            assertOnlyJoinClassificationChanged(before, after, phase)

            if (phase === 'observation') {
              assert.equal(calls[targetCallIndex].intent.kind,
                'protocol-command-send')
              assert.equal(
                calls[targetCallIndex].intent.payload.command,
                'Target.getTargets'
              )
              assert.equal(machine.protocolSendCount, 0)
              assert.equal(
                machine.operationLedger['Target.getTargets'].ackCount,
                0
              )
            }

            if (timing === 'observable-pending') {
              if (outcome === 'fulfillment') {
                targetDeferred.resolve(fulfillmentValue)
              } else {
                targetDeferred.reject(rejectionReason)
              }
            }
            const targetHandlers = capturedHandlerPair(
              handlerPairs,
              calls[targetCallIndex]
            )
            assert.equal(
              outcome === 'fulfillment'
                ? targetHandlers.onFulfilled(fulfillmentValue)
                : targetHandlers.onRejected(),
              undefined
            )

            assert.equal(machine.lease, 'closed')
            assert.equal(machine.activeExchange, null)
            assert.equal(machine.activeObservationClosed, null)
            assert.equal(fixture.notificationProbe.calls.length, phase === 'prestart' ? 0 : 1)
            assert.equal(machine.observationNotificationState,
              phase === 'prestart' ? 'discarded' : 'consumed')
            assert.equal(machine.portState, 'closed')
            assert.equal(machine.furtherExchangeCount, 'zero')
            assert.equal(machine.currentExchangeCount, 0)
            assert.equal(machine.runSettlementCount, 1)
            assert.equal(capabilityCalls(), before.capabilityCalls)
            assert.equal(calls.length, before.receivedIntentCount)

            if (phase === 'prestart') {
              assert.equal(machine.preCleanupObservationSnapshot, null)
              assert.equal(machine.cleanupLedger, null)
            } else if (phase === 'observation') {
              assert.equal(machine.stickyViolation, true)
              assert.equal(machine.closeClass, 'V')
              assert.equal(
                machine.observationCloseReason,
                'confirmed-violation'
              )
              assert.equal(
                Object.isFrozen(machine.preCleanupObservationSnapshot),
                true
              )
              assert.notEqual(machine.cleanupLedger, null)
              assert.equal(machine.protocolSendCount, 0)
              assert.equal(
                machine.operationLedger['Target.getTargets'].ackCount,
                0
              )
              assert.equal(machine.capStates.setup, 'terminal-unknown')
            } else {
              assert.equal(
                machine.preCleanupObservationSnapshot,
                snapshotBeforeJoin
              )
              assert.equal(machine.cleanupViolation, true)
              assert.equal(
                machine.cleanupFinalizeReason,
                'cleanup-terminal-failure'
              )
            }

            const terminalSnapshot = snapshotJoinState(
              machine,
              calls.map((call) => call.intent),
              capabilityCalls()
            )
            assert.equal(
              namespace.requestBrowserSyncTransportRuntimeDiagnosticExchange(
                machine,
                activeProfile
              ),
              undefined
            )
            assert.deepEqual(
              snapshotJoinState(
                machine,
                calls.map((call) => call.intent),
                capabilityCalls()
              ),
              terminalSnapshot
            )

            assert.equal(
              targetHandlers.onFulfilled(new Proxy({}, {
                get() {
                  throw new Error('late-fulfillment-read')
                },
              })),
              undefined
            )
            assert.equal(targetHandlers.onRejected(), undefined)
            assert.deepEqual(
              snapshotJoinState(
                machine,
                calls.map((call) => call.intent),
                capabilityCalls()
              ),
              terminalSnapshot
            )

            const ownerResult = await machine.ownerRunPromise
            assertFoundationResult(ownerResult)
            assert.equal(
              phase === 'prestart' ? ownerResult.ok : true,
              phase === 'prestart' ? false : true
            )
            caseCount += 1
          })
        }
      }
    }
    assert.equal(caseCount, 18)
    })
  })
})

test('laesst Pending-Joins auf Cleanup-Sends keinen bestaetigten Send-Ack erfinden', { concurrency: false }, async (t) => {
  await withTemporaryDiagnosticObserverCopy({
    anchor: PRIVATE_EXPORT_ANCHOR,
    kind: 'cleanup-protocol-send-pending-join-conformance',
  }, async ({ namespace }) => {
    for (const [command, operationIndex] of [
      ['Network.disable', 4],
      ['Target.detachFromTarget', 5],
    ]) {
      await t.test(command, async () => {
        const controller = createFullRunEffectController()
        const deferred = createCleanDeferred()
        let pendingIntent = null
        let signalPending
        const pendingReached = new Promise((resolve) => {
          signalPending = resolve
        })
        const machine =
          namespace.createBrowserSyncTransportRuntimeDiagnosticRunMachine({
            activeExchange(intent) {
              if (
                pendingIntent === null &&
                intent.kind === 'protocol-command-send' &&
                intent.payload.command === command
              ) {
                pendingIntent = intent
                signalPending()
                return deferred.promise
              }
              return controller.effectPort.exchange(intent)
            },
            activeObservationClosed: createNotificationProbe().observationClosed,
            runBinding: createInternalRunBinding(),
          })

        namespace.requestBrowserSyncTransportRuntimeDiagnosticExchange(
          machine,
          machine.nextExchangeRequestProfile
        )
        await pendingReached
        assert.notEqual(pendingIntent, null)
        assert.equal(machine.phase, 'cleanup')
        assert.equal(machine.lease, 'observable-pending')
        assert.notEqual(machine.preCleanupObservationSnapshot, null)
        const operation = machine.operationLedger[command]
        assert.equal(operation.intentCount, 1)
        assert.equal(operation.ackCount, 0)
        assert.equal(operation.sendUnknown, false)

        const before = snapshotJoinState(
          machine,
          controller.intents,
          machine.capabilityCallCount
        )
        assert.equal(
          namespace.requestBrowserSyncTransportRuntimeDiagnosticExchange(
            machine,
            machine.activeExchangeRequestProfile
          ),
          undefined
        )
        const after = snapshotJoinState(
          machine,
          controller.intents,
          machine.capabilityCallCount
        )
        assertOnlyJoinClassificationChanged(before, after, 'cleanup')

        deferred.resolve({
          kind: 'protocol-command-send-result',
          commandId: pendingIntent.payload.commandId,
          sendState: 'sent',
        })
        const result = await machine.ownerRunPromise
        assertFoundationResult(result)
        assert.equal(result.ok, true)
        assert.equal(operation.ackCount, 0)
        assert.equal(operation.sendUnknown, false)
        assert.equal(
          result.recordProjection.observer.protocolOperations[operationIndex]
            .observedCountClass,
          'unknown'
        )
        assert.equal(
          result.recordProjection.observer.protocolOperations[operationIndex]
            .result,
          'unproven'
        )
      })
    }
  })
})

test('belegt je Phase den endlichen Drei-Checkpoint-Praefix eines forever-pending Exchange', { concurrency: false }, async (t) => {
  await withCapturedControlledPromiseHandlers(async (handlerPairs) => {
    await withTemporaryDiagnosticObserverCopy({
      anchor: PRIVATE_EXPORT_ANCHOR,
    }, async ({ namespace }) => {
      const ownersLeftPendingToTestEnd = []
      for (const phase of ['prestart', 'observation', 'cleanup']) {
        await t.test(phase, async () => {
          const fixture = prepareJoinFixture(
            namespace,
            handlerPairs,
            phase,
            'observable-pending',
            'fulfillment'
          )
          const { calls, capabilityCalls, machine } = fixture
          assert.equal(fixture.notificationProbe.calls.length, phase === 'cleanup' ? 1 : 0)
          let ownerFulfillments = 0
          let ownerRejections = 0
          machine.ownerRunPromise.then(
            () => {
              ownerFulfillments += 1
            },
            () => {
              ownerRejections += 1
            }
          )
          const before = snapshotJoinState(
            machine,
            calls.map((call) => call.intent),
            capabilityCalls()
          )
          const activeProfile = machine.activeExchangeRequestProfile
          namespace.requestBrowserSyncTransportRuntimeDiagnosticExchange(
            machine,
            activeProfile
          )
          const afterJoin = snapshotJoinState(
            machine,
            calls.map((call) => call.intent),
            capabilityCalls()
          )
          assertOnlyJoinClassificationChanged(before, afterJoin, phase)

          let checkpointCount = 0
          for (let checkpoint = 1; checkpoint <= 3; checkpoint += 1) {
            await new Promise((resolve, reject) => {
              queueMicrotask(() => {
                try {
                  checkpointCount += 1
                  assert.equal(checkpointCount, checkpoint)
                  assert.deepEqual(
                    snapshotJoinState(
                      machine,
                      calls.map((call) => call.intent),
                      capabilityCalls()
                    ),
                    afterJoin
                  )
                  assert.equal(ownerFulfillments, 0)
                  assert.equal(ownerRejections, 0)
                  resolve()
                } catch (error) {
                  reject(error)
                }
              })
            })
          }
          assert.equal(checkpointCount, 3)
          assert.equal(fixture.notificationProbe.calls.length, phase === 'cleanup' ? 1 : 0)
          assert.equal(machine.runState, 'active')
          assert.equal(machine.activeRunToken, 1)
          assert.equal(machine.lease, 'observable-pending')
          assert.equal(machine.currentExchangeCount, 1)
          assert.equal(machine.runSettlementCount, 0)
          assert.equal(ownerFulfillments, 0)
          assert.equal(ownerRejections, 0)

          namespace.requestBrowserSyncTransportRuntimeDiagnosticExchange(
            machine,
            activeProfile
          )
          assert.deepEqual(
            snapshotJoinState(
              machine,
              calls.map((call) => call.intent),
              capabilityCalls()
            ),
            afterJoin
          )

          const toTestEnd = prepareJoinFixture(
            namespace,
            handlerPairs,
            phase,
            'observable-pending',
            'fulfillment'
          )
          let terminalCallbacks = 0
          toTestEnd.machine.ownerRunPromise.then(
            () => {
              terminalCallbacks += 1
            },
            () => {
              terminalCallbacks += 1
            }
          )
          const untilEndBefore = snapshotJoinState(
            toTestEnd.machine,
            toTestEnd.calls.map((call) => call.intent),
            toTestEnd.capabilityCalls()
          )
          namespace.requestBrowserSyncTransportRuntimeDiagnosticExchange(
            toTestEnd.machine,
            toTestEnd.machine.activeExchangeRequestProfile
          )
          const untilEndAfter = snapshotJoinState(
            toTestEnd.machine,
            toTestEnd.calls.map((call) => call.intent),
            toTestEnd.capabilityCalls()
          )
          assertOnlyJoinClassificationChanged(
            untilEndBefore,
            untilEndAfter,
            phase
          )
          namespace.requestBrowserSyncTransportRuntimeDiagnosticExchange(
            toTestEnd.machine,
            toTestEnd.machine.activeExchangeRequestProfile
          )
          assert.deepEqual(
            snapshotJoinState(
              toTestEnd.machine,
              toTestEnd.calls.map((call) => call.intent),
              toTestEnd.capabilityCalls()
            ),
            untilEndAfter
          )
          ownersLeftPendingToTestEnd.push({
            fixture: toTestEnd,
            terminalCallbacks: () => terminalCallbacks,
            expected: untilEndAfter,
          })
        })
      }

      assert.equal(ownersLeftPendingToTestEnd.length, 3)
      for (const entry of ownersLeftPendingToTestEnd) {
        assert.equal(entry.terminalCallbacks(), 0)
        assert.equal(entry.fixture.machine.runSettlementCount, 0)
        assert.equal(entry.fixture.machine.lease, 'observable-pending')
        assert.deepEqual(
          snapshotJoinState(
            entry.fixture.machine,
            entry.fixture.calls.map((call) => call.intent),
            entry.fixture.capabilityCalls()
          ),
          entry.expected
        )
      }
    })
  })
})

test('schliesst die Lease-Transitionstabelle strukturell ohne autonomen Scheduler', async () => {
  const source = (await readFile(PRODUCTION_MODULE_URL)).toString('utf8')
  const requiredFragments = [
    "const LEASE_IDLE = 'idle'",
    "const LEASE_OBSERVABLE_PENDING = 'observable-pending'",
    "const LEASE_SETTLEMENT_UNOBSERVABLE = 'settlement-unobservable'",
    "const LEASE_CLOSED = 'closed'",
    'if (machine.lease === LEASE_OBSERVABLE_PENDING) {',
    'machine.lease = LEASE_OBSERVABLE_PENDING',
    'machine.lease = LEASE_IDLE',
    'machine.lease = LEASE_SETTLEMENT_UNOBSERVABLE',
    'machine.lease = LEASE_CLOSED',
    'machine.activeExchangeToken !== intentId',
    'machine.activeRunToken !== 1',
  ]
  for (const fragment of requiredFragments) {
    assert.equal(countOccurrences(source, fragment) >= 1, true, fragment)
  }
  assert.equal(
    countOccurrences(
      source,
      'if (machine.lease === LEASE_OBSERVABLE_PENDING) {'
    ),
    1
  )
  for (const forbidden of [
    /\bsetTimeout\s*\(/u,
    /\bsetInterval\s*\(/u,
    /\bsetImmediate\s*\(/u,
    /\bqueueMicrotask\s*\(/u,
    /\bPromise\s*\.\s*race\s*\(/u,
    /\bretry\b/iu,
    /\bpoll(?:ing)?\b/iu,
  ]) {
    assert.equal(forbidden.test(source), false, String(forbidden))
  }
  assert.equal(
    countOccurrences(source, 'capturedReflectApply(machine.activeExchange'),
    1
  )
  assert.equal(
    countOccurrences(
      source,
      'function createBrowserSyncTransportRuntimeDiagnosticRunMachine(input) {'
    ),
    1
  )
  assert.equal(
    countOccurrences(
      source,
      [
        'machine = createBrowserSyncTransportRuntimeDiagnosticRunMachine({',
        '        activeExchange,',
        '        activeObservationClosed,',
        '        runBinding: internalRunBinding,',
        '      })',
      ].join('\n')
    ),
    1
  )
  assert.equal(
    countOccurrences(
      source,
      'createBrowserSyncTransportRuntimeDiagnosticRunMachine('
    ),
    2,
    'eine Definition und genau eine oeffentliche Owner-Callsite'
  )
  assert.equal(countOccurrences(source, '  prepareExchange(machine,'), 7)
  assert.equal(
    countOccurrences(
      source,
      'requestBrowserSyncTransportRuntimeDiagnosticExchange(machine, profile)'
    ),
    2,
    'eine Definition und der einzige vorbereitete Dispatch'
  )
  assert.equal(countOccurrences(source, 'new CapturedPromise'), 2)
})

test('toetet elf disjunkte erfolgreich importierende ADR-0035-Joinmutanten', { concurrency: false }, async (t) => {
  const guardLine =
    '  if (machine.lease === LEASE_OBSERVABLE_PENDING) {'
  const classification = [
    '      machine.pendingInternalExchangeViolation = machine.preCleanupObservationSnapshot === null',
    "        ? (machine.attemptStarted ? 'observation' : 'prestart')",
    "        : 'cleanup'",
  ].join('\n')
  const definitions = [
    {
      id: '01-join-guard-bypassed',
      phase: 'prestart',
      search: guardLine,
      replacement:
        '  if (false && machine.lease === LEASE_OBSERVABLE_PENDING) {',
      verify({ machine }) {
        assert.equal(machine.pendingInternalExchangeViolation, false)
      },
    },
    {
      id: '02-guard-after-intent-construction',
      hostileProfile: true,
      phase: 'prestart',
      search: guardLine,
      replacement: [
        guardLine,
        '    deepFreezeGenerated({',
        '      intentId: machine.nextIntentId,',
        '      kind: profile.intentKind,',
        '      payload: profile.payload,',
        '    })',
      ].join('\n'),
      verify({ invocation }) {
        assert.throws(invocation, /mutant-hostile-profile/u)
      },
    },
    {
      id: '03-guard-after-id-increment',
      phase: 'prestart',
      search: guardLine,
      replacement: `${guardLine}\n    machine.nextIntentId += 1`,
      verify({ before, machine }) {
        assert.equal(machine.nextIntentId, before.nextIntentId + 1)
      },
    },
    {
      id: '04-guard-after-count-mutation',
      phase: 'prestart',
      search: guardLine,
      replacement: `${guardLine}\n    machine.intentCount += 1`,
      verify({ before, machine }) {
        assert.equal(machine.intentCount, before.intentCount + 1)
      },
    },
    {
      id: '05-second-capability-call',
      phase: 'prestart',
      search: guardLine,
      replacement: [
        guardLine,
        '    capturedReflectApply(machine.activeExchange, undefined, [])',
      ].join('\n'),
      verify({ before, capabilityCalls, calls }) {
        assert.equal(capabilityCalls(), before.capabilityCalls + 1)
        assert.equal(calls.length, before.receivedIntentCount + 1)
      },
    },
    {
      id: '06-release-to-idle',
      phase: 'prestart',
      search: guardLine,
      replacement: `${guardLine}\n    machine.lease = LEASE_IDLE`,
      verify({ machine }) {
        assert.equal(machine.lease, 'idle')
      },
    },
    {
      id: '07-artificial-owner-settlement',
      phase: 'prestart',
      search: guardLine,
      replacement: `${guardLine}\n    settleMachineWithError(machine)`,
      verify({ machine }) {
        assert.equal(machine.runSettlementCount, 1)
        assert.equal(machine.runState, 'terminal')
      },
    },
    {
      id: '08-premature-o0',
      phase: 'prestart',
      search: guardLine,
      replacement: `${guardLine}\n    freezeObservationSnapshot(machine)`,
      verify({ machine }) {
        assert.notEqual(machine.preCleanupObservationSnapshot, null)
        assert.equal(Object.isFrozen(machine.preCleanupObservationSnapshot), true)
      },
    },
    {
      id: '09-premature-cleanup',
      phase: 'prestart',
      search: guardLine,
      replacement: `${guardLine}\n    initializeCleanupLedger(machine)`,
      verify({ machine }) {
        assert.notEqual(machine.cleanupLedger, null)
        assert.equal(machine.phase, 'cleanup')
      },
    },
    {
      id: '10-lost-phase-classification',
      phase: 'observation',
      search: classification,
      replacement:
        "      machine.pendingInternalExchangeViolation = 'prestart'",
      verify({ machine }) {
        assert.equal(machine.pendingInternalExchangeViolation, 'prestart')
      },
    },
    {
      id: '11-frozen-o0-mutation',
      handlerMutation: true,
      phase: 'cleanup',
      search: 'function closePendingInternalExchangeJoin(machine) {',
      replacement: [
        'function closePendingInternalExchangeJoin(machine) {',
        "  if (machine.pendingInternalExchangeViolation === 'cleanup') {",
        '    machine.preCleanupObservationSnapshot.stickyViolation = false',
        '  }',
      ].join('\n'),
      verify({ fixture, handlerPairs, machine }) {
        const o0 = machine.preCleanupObservationSnapshot
        const pair = capturedHandlerPair(
          handlerPairs,
          fixture.calls[fixture.targetCallIndex]
        )
        assert.throws(
          () => pair.onFulfilled(fixture.fulfillmentValue),
          TypeError
        )
        assert.equal(machine.preCleanupObservationSnapshot, o0)
        assert.equal(Object.isFrozen(o0), true)
      },
    },
  ]

  function executeMutationScenario(namespace, handlerPairs, definition) {
    const fixture = prepareJoinFixture(
      namespace,
      handlerPairs,
      definition.phase,
      'observable-pending',
      'fulfillment'
    )
    const { calls, capabilityCalls, machine } = fixture
    assert.equal(machine.lease, 'observable-pending')
    assert.equal(machine.pendingInternalExchangeViolation, false)
    const before = snapshotJoinState(
      machine,
      calls.map((call) => call.intent),
      capabilityCalls()
    )
    let secondProfile = machine.activeExchangeRequestProfile
    if (definition.hostileProfile) {
      secondProfile = new Proxy({}, {
        get() {
          throw new Error('mutant-hostile-profile')
        },
      })
    }
    let invocationError = null
    let invocationResult
    try {
      invocationResult =
        namespace.requestBrowserSyncTransportRuntimeDiagnosticExchange(
          machine,
          secondProfile
        )
    } catch (error) {
      invocationError = error
    }
    const afterBoundary = snapshotJoinState(
      machine,
      calls.map((call) => call.intent),
      capabilityCalls()
    )
    const o0 = machine.preCleanupObservationSnapshot
    let handlerError = null
    let handlerResult
    if (definition.handlerMutation && invocationError === null) {
      const pair = capturedHandlerPair(
        handlerPairs,
        fixture.calls[fixture.targetCallIndex]
      )
      try {
        handlerResult = pair.onFulfilled(fixture.fulfillmentValue)
      } catch (error) {
        handlerError = error
      }
    }
    return {
      afterBoundary,
      before,
      capabilityCalls,
      calls,
      fixture,
      handlerError,
      handlerResult,
      invocationError,
      invocationResult,
      machine,
      o0,
    }
  }

  function assertMutationScenarioConforms(scenario, definition) {
    assert.equal(scenario.invocationError, null)
    assert.equal(scenario.invocationResult, undefined)
    assertOnlyJoinClassificationChanged(
      scenario.before,
      scenario.afterBoundary,
      definition.phase
    )
    if (definition.handlerMutation) {
      assert.equal(scenario.handlerError, null)
      assert.equal(scenario.handlerResult, undefined)
      assert.equal(scenario.machine.preCleanupObservationSnapshot, scenario.o0)
      assert.equal(Object.isFrozen(scenario.o0), true)
      assert.equal(scenario.machine.lease, 'closed')
    }
  }

  assert.equal(definitions.length, 11)
  await withCapturedControlledPromiseHandlers(async (handlerPairs) => {
    for (const definition of definitions) {
      await t.test(definition.id, async () => {
        await withTemporaryDiagnosticObserverCopy({
          anchor: PRIVATE_EXPORT_ANCHOR,
          kind: `conformance-baseline-${definition.id}`,
        }, async ({ namespace }) => {
          const baseline = executeMutationScenario(
            namespace,
            handlerPairs,
            definition
          )
          assertMutationScenarioConforms(baseline, definition)
        })

        await withTemporaryDiagnosticObserverCopy({
          anchor: PRIVATE_EXPORT_ANCHOR,
          kind: `mutant-${definition.id}`,
          mutate(bytes, replace) {
            return replace(
              bytes,
              definition.search,
              definition.replacement,
              definition.id
            )
          },
        }, async ({ namespace }) => {
          const scenario = executeMutationScenario(
            namespace,
            handlerPairs,
            definition
          )
          assert.throws(
            () => assertMutationScenarioConforms(scenario, definition),
            (error) => error?.code === 'ERR_ASSERTION'
          )
          assert.equal(
            namespace.createBrowserSyncTransportRuntimeDiagnosticRunMachine
              .length,
            1
          )
          assert.equal(
            namespace.requestBrowserSyncTransportRuntimeDiagnosticExchange
              .length,
            2
          )
          if (definition.handlerMutation) {
            assert.equal(scenario.handlerError instanceof TypeError, true)
            assert.equal(
              scenario.machine.preCleanupObservationSnapshot,
              scenario.o0
            )
            assert.equal(Object.isFrozen(scenario.o0), true)
          } else {
            definition.verify({
              before: scenario.before,
              capabilityCalls: scenario.capabilityCalls,
              calls: scenario.calls,
              fixture: scenario.fixture,
              handlerPairs,
              invocation() {
                if (scenario.invocationError !== null) {
                  throw scenario.invocationError
                }
                return scenario.invocationResult
              },
              machine: scenario.machine,
            })
          }
        })
      })
    }
  })
})

test('toetet einen finalen Observer-Extra-Key am nodeweisen Projection-Selbstcheck', { concurrency: false }, async () => {
  async function runCopiedObserver(namespace) {
    const controller = createFullRunEffectController()
    const observer =
      namespace.createBrowserSyncTransportRuntimeDiagnosticObserver({
        effectPort: controller.effectPort,
        runBinding: createValidRunBinding(),
      })
    const result = await observer.run()
    return { controller, result }
  }

  await withTemporaryDiagnosticObserverCopy({
    anchor: PRIVATE_EXPORT_ANCHOR,
    kind: 'projection-nodewise-conformance-baseline',
  }, async ({ namespace }) => {
    const { controller, result } = await runCopiedObserver(namespace)
    assert.equal(result.ok, true)
    assert.notEqual(result.recordProjection, null)
    assert.equal(
      result.recordProjection.observer.integrityChecks[14].result,
      'confirmed'
    )
    assert.deepEqual(controller.protocolCommands, PROTOCOL_COMMANDS)
    assert.equal(controller.cleanupStepIds.length, 12)
  })

  await withTemporaryDiagnosticObserverCopy({
    anchor: PRIVATE_EXPORT_ANCHOR,
    kind: 'projection-nodewise-observer-extra-key-mutant',
    mutate(bytes, replace) {
      return replace(
        bytes,
        [
          '    interferenceObservation: deriveInterferenceObservation(integrityChecks),',
          '  }',
          '  const stages = new CapturedArray(10)',
        ].join('\n'),
        [
          '    interferenceObservation: deriveInterferenceObservation(integrityChecks),',
          '    mutantExtraObserverKey: true,',
          '  }',
          '  const stages = new CapturedArray(10)',
        ].join('\n'),
        'projection-observer-extra-key'
      )
    },
  }, async ({ namespace }) => {
    const { controller, result } = await runCopiedObserver(namespace)
    assertFoundationResult(result)
    assert.equal(result.ok, false)
    assert.equal(result.recordProjection, null)
    assert.deepEqual(result.error, EXPECTED_FOUNDATION_ERROR)
    assert.deepEqual(controller.protocolCommands, PROTOCOL_COMMANDS)
    assert.equal(controller.cleanupStepIds.length, 12)
  })
})

test('toetet sechs wert- und crossfieldwidrige Endprojektionen am privaten Selbstcheck', { concurrency: false }, async (t) => {
  const definitions = [
    {
      id: 'fixed-cause-status',
      search: "    causeStatus: 'CAUSE_NOT_PROVEN',",
      replacement: "    causeStatus: 'MUTANT_CAUSE_STATUS',",
    },
    {
      id: 'stage-layer-domain',
      search: '    layer: stage.layer,',
      replacement: "    layer: 'mutant-layer',",
    },
    {
      id: 'stage-timing-pair',
      search: '    timingState: stage.timingState,',
      replacement: [
        '    timingState: stage.relativeMilliseconds === null',
        "      ? stage.timingState : 'not-measured',",
      ].join('\n'),
    },
    {
      id: 'layer-receipt-order-gap',
      search: '    receiptOrder: stage.receiptOrder,',
      replacement: [
        '    receiptOrder: stage.receiptOrder === null',
        '      ? null : stage.receiptOrder + 1,',
      ].join('\n'),
    },
    {
      id: 'stage-id-domain',
      search: '    stageId: stage.stageId,',
      replacement: "    stageId: 'mutant-stage-id',",
    },
    {
      id: 'fixed-overall-gate-crossfield',
      search:
        "    adr0029OverallGate: { before: 'FAIL', after: 'FAIL', unchanged: true },",
      replacement:
        "    adr0029OverallGate: { before: 'FAIL', after: 'PASS', unchanged: true },",
    },
  ]

  async function runCopiedObserver(namespace) {
    const controller = createFullRunEffectController()
    const observer =
      namespace.createBrowserSyncTransportRuntimeDiagnosticObserver({
        effectPort: controller.effectPort,
        runBinding: createValidRunBinding(),
      })
    const result = await observer.run()
    return { controller, result }
  }

  assert.equal(definitions.length, 6)
  for (const definition of definitions) {
    await t.test(definition.id, async () => {
      await withTemporaryDiagnosticObserverCopy({
        anchor: PRIVATE_EXPORT_ANCHOR,
        kind: `projection-selfcheck-baseline-${definition.id}`,
      }, async ({ namespace }) => {
        const { controller, result } = await runCopiedObserver(namespace)
        assertFoundationResult(result)
        assert.equal(result.ok, true)
        assert.notEqual(result.recordProjection, null)
        assert.equal(result.error, null)
        assert.deepEqual(controller.protocolCommands, PROTOCOL_COMMANDS)
        assert.equal(controller.cleanupStepIds.length, 12)
      })

      await withTemporaryDiagnosticObserverCopy({
        anchor: PRIVATE_EXPORT_ANCHOR,
        kind: `projection-selfcheck-mutant-${definition.id}`,
        mutate(bytes, replace) {
          return replace(
            bytes,
            definition.search,
            definition.replacement,
            definition.id
          )
        },
      }, async ({ namespace }) => {
        const { controller, result } = await runCopiedObserver(namespace)
        assertFoundationResult(result)
        assert.equal(result.ok, false)
        assert.equal(result.recordProjection, null)
        assert.deepEqual(result.error, EXPECTED_FOUNDATION_ERROR)
        assert.deepEqual(controller.protocolCommands, PROTOCOL_COMMANDS)
        assert.equal(controller.cleanupStepIds.length, 12)
      })
    })
  }
})

test('toetet eine von O0 abweichende finale Check15-Kopie am Selbstcheck', { concurrency: false }, async () => {
  async function runCopiedObserver(namespace) {
    const controller = createFullRunEffectController()
    const observer =
      namespace.createBrowserSyncTransportRuntimeDiagnosticObserver({
        effectPort: controller.effectPort,
        runBinding: createValidRunBinding(),
      })
    const result = await observer.run()
    return { controller, result }
  }

  await withTemporaryDiagnosticObserverCopy({
    anchor: PRIVATE_EXPORT_ANCHOR,
    kind: 'projection-check15-o0-baseline',
  }, async ({ namespace }) => {
    const { controller, result } = await runCopiedObserver(namespace)
    assertFoundationResult(result)
    assert.equal(result.ok, true)
    assert.equal(
      result.recordProjection.observer.integrityChecks[15].result,
      'unproven'
    )
    assert.deepEqual(controller.protocolCommands, PROTOCOL_COMMANDS)
    assert.equal(controller.cleanupStepIds.length, 12)
  })

  await withTemporaryDiagnosticObserverCopy({
    anchor: PRIVATE_EXPORT_ANCHOR,
    kind: 'projection-check15-o0-mutant',
    mutate(bytes, replace) {
      return replace(
        bytes,
        [
          '  const observer = {',
          '    deltaProfile: snapshot.observerObservation.deltaProfile,',
        ].join('\n'),
        [
          "  integrityChecks[15].result = 'violated'",
          '  const observer = {',
          '    deltaProfile: snapshot.observerObservation.deltaProfile,',
        ].join('\n'),
        'projection-check15-o0-divergence'
      )
    },
  }, async ({ namespace }) => {
    const { controller, result } = await runCopiedObserver(namespace)
    assertFoundationResult(result)
    assert.equal(result.ok, false)
    assert.equal(result.recordProjection, null)
    assert.deepEqual(result.error, EXPECTED_FOUNDATION_ERROR)
    assert.deepEqual(controller.protocolCommands, PROTOCOL_COMMANDS)
    assert.equal(controller.cleanupStepIds.length, 12)
  })
})

test('durchlaeuft black-box die volle Setup-Capture-Network-O0-Cleanup-Projection', { concurrency: false }, async () => {
  const controller = createFullRunEffectController()
  const runBinding = createValidRunBinding()
  const originalDiagnosticRunId = runBinding.diagnosticRunId
  const observer = createBrowserSyncTransportRuntimeDiagnosticObserver({
    effectPort: controller.effectPort,
    runBinding,
  })
  const capturedExchange = controller.effectPort.exchange
  runBinding.diagnosticRunId = 'caller-mutated-after-factory'
  runBinding.replayOperands[0].replayValue = 'f'.repeat(64)
  controller.effectPort.exchange = () => {
    throw new Error('live-port-method-must-not-be-used')
  }

  const ownerPromise = observer.run()
  assert.equal(utilTypes.isPromise(ownerPromise), true)
  const result = await ownerPromise
  assertFoundationResult(result)
  assert.equal(result.ok, true)
  assert.equal(result.error, null)
  assert.notEqual(result.recordProjection, null)

  const projection = result.recordProjection
  assertFrozenOrdinaryRecord(projection, FOUNDATION_PROJECTION_KEYS)
  assertDeepFrozenGraph(projection)
  assert.equal(projection.schemaVersion, 1)
  assert.equal(
    projection.projectionType,
    'browser-transport-diagnostic-foundation-projection'
  )
  assert.equal(projection.diagnosticRunId, originalDiagnosticRunId)
  assert.equal(projection.observedAt, '2026-09-05T12:00:00.000Z')
  assert.equal(projection.timeZone, 'Europe/Berlin')
  assert.equal(projection.historicalEvidence.overallGate, 'FAIL')
  assert.equal(projection.replay.equivalence.comparisons.length, 59)
  assert.equal(projection.replay.equivalence.result, 'EQUIVALENT')
  assert.equal(projection.observer.protocolOperations.length, 6)
  assert.equal(projection.observer.integrityChecks.length, 17)
  assert.equal(projection.observer.foundationSha256, null)
  assert.equal(projection.observer.evaluationSha256, EVALUATION_SHA256)
  assert.equal(projection.observer.controllerEvaluateIntentCount, 'one')
  assert.equal(projection.observer.mainWorldEvaluationCount, 'one')
  assert.equal(projection.observer.transportFactoryCallCount, 'one')
  assert.deepEqual(
    projection.observer.protocolOperations.map((operation) => operation.command),
    PROTOCOL_COMMANDS
  )
  for (const operation of projection.observer.protocolOperations) {
    assert.equal(operation.allowedMaximum, 1)
    assert.equal(operation.observedCountClass, 'one')
    assert.equal(operation.result, 'match')
  }
  assert.equal(projection.requestBudget.defaultTransportCalls, 'one')
  assert.equal(projection.requestBudget.endpointOptions, 'one')
  assert.equal(projection.requestBudget.endpointPosts, 'one')
  assert.equal(projection.requestBudget.endpointOtherMethods, 'zero')
  assert.equal(
    projection.requestBudget.sequence,
    'OPTIONS-204-POST-200-loadingFinished'
  )
  assert.equal(projection.publicSettlement.observationState, 'observed')
  assert.equal(
    projection.publicSettlement.outcome,
    'static-redacted-rejection'
  )
  assert.equal(projection.publicSettlement.staticProfileResult, 'match')
  assert.equal(
    projection.publicSettlement.deadlineRelation,
    'deadline-compatible'
  )
  assert.equal(projection.publicSettlement.internalStage, 'unknown')
  assert.equal(projection.publicSettlement.internalOwner, 'unknown')
  assert.equal(projection.stages.length, 10)
  assert.equal(
    projection.stages.filter((stage) => stage.observationState === 'observed')
      .length,
    10
  )
  assert.equal(projection.timing.clockDomains.length, 3)
  assert.equal(projection.timing.roundingMilliseconds, 10)
  assert.equal(projection.timing.setupWindowMilliseconds, 6000)
  assert.equal(projection.timing.captureWindowMilliseconds, 6000)
  assert.equal(projection.timing.durationCapMilliseconds, 60000)
  assert.equal(projection.timing.completion.productEvidenceComplete, true)
  assert.equal(projection.timing.completion.observationClosed, true)
  assert.equal(projection.timing.completion.captureWindowState, 'elapsed')
  assert.equal(
    projection.timing.completion.cleanupFinalizeReason,
    'all-steps-terminal'
  )
  assert.equal(projection.timing.completion.cleanupFinalized, true)
  assert.equal(projection.cleanup.observationClosedBeforeCleanup, true)
  assert.equal(projection.cleanup.projectionMaterializedAfterCleanup, true)
  assert.equal(projection.cleanup.checks.length, 20)
  assert.equal(projection.cleanup.checks[19].checkId, 'cleanupCompleted')
  assert.equal(projection.cleanup.checks[19].result, 'confirmed')
  assert.equal(projection.cleanup.result, 'UNPROVEN')
  assert.deepEqual(projection.adr0029OverallGate, {
    before: 'FAIL',
    after: 'FAIL',
    unchanged: true,
  })
  assert.equal(projection.candidateObserverGate, 'UNPROVEN')
  assert.equal(projection.candidateFinding, 'inconclusive')
  assert.equal(projection.causeStatus, 'CAUSE_NOT_PROVEN')

  assert.equal(controller.maxExchangeDepth(), 1)
  assert.equal(controller.intents.length > 7, true)
  assert.deepEqual(
    [...new Set(controller.intents.map((intent) => intent.kind))].sort(),
    [...INTENT_KINDS].sort()
  )
  assert.deepEqual(controller.protocolCommands, PROTOCOL_COMMANDS)
  assert.equal(controller.cleanupStepIds.length, 12)
  assert.equal(capturedExchange === controller.effectPort.exchange, false)
  for (let index = 0; index < controller.intents.length; index += 1) {
    const intent = controller.intents[index]
    assert.equal(intent.intentId, index + 1)
    assertDeepFrozenGraph(intent)
  }
  const evaluateIntent = controller.intents.find(
    (intent) => intent.kind === 'protocol-command-send' &&
      intent.payload.command === 'Runtime.evaluate'
  )
  assert.notEqual(evaluateIntent, undefined)
  const expressionBytes = Buffer.from(
    evaluateIntent.payload.params.expression,
    'utf8'
  )
  assert.equal(expressionBytes.byteLength, 4259)
  assert.equal(sha256(expressionBytes), EVALUATION_SHA256)
  assert.deepEqual(
    Reflect.ownKeys(evaluateIntent.payload.params),
    ['expression', 'awaitPromise', 'returnByValue', 'generatePreview']
  )
})

test('bindet alle sieben Intentarten an exakte Acks oder phasenlokale Rejectionfolgen', { concurrency: false }, async (t) => {
  await t.test('exact-success-ack-and-observation-tuples', async () => {
    const controller = createFullRunEffectController()
    const result = await runFullController(controller)
    assert.equal(result.ok, true)
    const expectedResponseKeys = new Map([
      ['capability-probe', ['kind', 'profile', 'capabilitySet']],
      [
        'controller-clock-sample',
        ['kind', 'reason', 'monotonicMilliseconds'],
      ],
      ['cap-arm', ['kind', 'capKind', 'armState']],
      ['cap-cancel', ['kind', 'capKind', 'armIntentId', 'cancelState']],
      ['protocol-command-send', ['kind', 'commandId', 'sendState']],
      ['observation-dequeue', ['kind', 'value']],
      ['cleanup-step', ['kind', 'checkId', 'stepState']],
    ])
    for (const kind of INTENT_KINDS) {
      const pair = controller.responses.find(
        (candidate) => candidate.intent.kind === kind
      )
      assert.notEqual(pair, undefined)
      assert.deepEqual(
        Reflect.ownKeys(pair.response),
        expectedResponseKeys.get(kind)
      )
    }
    assert.deepEqual(
      [...new Set(controller.intents.map((intent) => intent.kind))].sort(),
      [...INTENT_KINDS].sort()
    )
  })

  const cases = [
    ['capability-probe', false, null],
    ['controller-clock-sample', false, null],
    ['cap-arm', false, null],
    ['cap-cancel', true, null],
    ['protocol-command-send', true, 0],
    ['observation-dequeue', true, null],
    ['cleanup-step', true, null],
  ]
  for (const [kind, expectProjection, operationIndex] of cases) {
    await t.test(`${kind}/zero-argument-rejection`, async () => {
      const rejectionReason = Object.freeze({
        secret: `must-not-project-${kind}`,
      })
      let rejected = false
      const controller = createFullRunEffectController({
        settlementForIntent(intent) {
          if (rejected === false && intent.kind === kind) {
            rejected = true
            return { type: 'reject', reason: rejectionReason }
          }
          return null
        },
      })
      const result = await runFullController(controller)
      assertFoundationResult(result)
      assert.equal(rejected, true)
      assert.equal(result.ok, expectProjection)
      assert.equal(
        JSON.stringify(result).includes(`must-not-project-${kind}`),
        false
      )
      if (!expectProjection) {
        assert.equal(result.recordProjection, null)
        assert.deepEqual(result.error, EXPECTED_FOUNDATION_ERROR)
        return
      }
      const projection = result.recordProjection
      assert.equal(projection.candidateObserverGate, 'FAIL')
      assert.equal(projection.candidateFinding, 'observer-invalid')
      if (operationIndex !== null) {
        assert.equal(
          projection.observer.protocolOperations[operationIndex]
            .observedCountClass,
          'unknown'
        )
        assert.equal(
          projection.observer.protocolOperations[operationIndex].result,
          'unproven'
        )
      }
      if (kind === 'cleanup-step') {
        assert.equal(controller.cleanupStepIds.length, 12)
        assert.equal(projection.cleanup.checks[19].result, 'confirmed')
      }
    })
  }
})

test('haelt alle Prestart-Abbrueche vor O0 und Cleanup', { concurrency: false }, async (t) => {
  const cases = [
    { id: 'probe-rejection', target: 'probe', mode: 'reject' },
    { id: 'probe-malformed', target: 'probe', mode: 'malformed' },
    { id: 'setup-origin-rejection', target: 'origin', mode: 'reject' },
    { id: 'setup-origin-malformed', target: 'origin', mode: 'malformed' },
    { id: 'setup-origin-unobservable', target: 'origin', mode: 'unobservable' },
    { id: 'setup-origin-pending', target: 'origin', mode: 'pending' },
    {
      id: 'setup-origin-unsafe-deadline',
      target: 'origin',
      mode: 'unsafe-deadline',
    },
    {
      id: 'setup-arm-rejection-recovery-success',
      target: 'setup-arm',
      mode: 'reject',
      cancelMode: 'normal',
    },
    {
      id: 'setup-arm-unobservable',
      target: 'setup-arm',
      mode: 'unobservable',
    },
    {
      id: 'setup-arm-pending',
      target: 'setup-arm',
      mode: 'pending',
    },
    {
      id: 'setup-arm-malformed-recovery-success',
      target: 'setup-arm',
      mode: 'malformed',
      cancelMode: 'normal',
    },
    {
      id: 'prestart-arm-recovery-cancel-rejection',
      target: 'setup-arm',
      mode: 'reject',
      cancelMode: 'reject',
    },
    {
      id: 'prestart-arm-recovery-cancel-malformed',
      target: 'setup-arm',
      mode: 'reject',
      cancelMode: 'malformed',
    },
    {
      id: 'prestart-arm-recovery-cancel-unobservable',
      target: 'setup-arm',
      mode: 'reject',
      cancelMode: 'unobservable',
    },
    {
      id: 'prestart-arm-recovery-cancel-pending',
      target: 'setup-arm',
      mode: 'reject',
      cancelMode: 'pending',
    },
  ]

  function matchesTarget(intent, target) {
    return target === 'probe'
      ? intent.kind === 'capability-probe'
      : (target === 'origin'
          ? intent.kind === 'controller-clock-sample' &&
            intent.payload.reason === 'setup-origin'
          : intent.kind === 'cap-arm' && intent.payload.capKind === 'setup')
  }

  await withTemporaryDiagnosticObserverCopy({
    anchor: PRIVATE_EXPORT_ANCHOR,
    kind: 'prestart-abort-matrix-conformance',
  }, async ({ namespace }) => {
    for (const definition of cases) {
      await t.test(definition.id, async () => {
        const intents = []
        const pending = createCleanDeferred()
        let pendingReachedResolve
        const pendingReached = new Promise((resolve) => {
          pendingReachedResolve = resolve
        })
        let targetHandled = false
        let cancelHandled = false

        function candidate(mode, intent) {
          if (mode === 'unobservable') {
            return undefined
          }
          if (mode === 'pending') {
            pendingReachedResolve()
            return pending.promise
          }
          if (mode === 'reject') {
            return normalizePromise(Promise.reject(new Proxy({}, {
              get() {
                throw new Error('prestart-rejection-reason-read')
              },
              ownKeys() {
                throw new Error('prestart-rejection-reason-keys')
              },
            })))
          }
          if (mode === 'malformed') {
            return normalizePromise(Promise.resolve({}))
          }
          if (mode === 'unsafe-deadline') {
            return normalizePromise(Promise.resolve({
              kind: 'controller-clock-sample-result',
              reason: 'setup-origin',
              monotonicMilliseconds: Number.MAX_SAFE_INTEGER - 1,
            }))
          }
          return normalizePromise(Promise.resolve(
            normalFulfillmentForIntent(intent)
          ))
        }

        const machine =
          namespace.createBrowserSyncTransportRuntimeDiagnosticRunMachine({
            activeExchange(intent) {
              intents.push(intent)
              if (!targetHandled && matchesTarget(intent, definition.target)) {
                targetHandled = true
                return candidate(definition.mode, intent)
              }
              if (
                targetHandled && !cancelHandled &&
                intent.kind === 'cap-cancel' &&
                intent.payload.capKind === 'setup'
              ) {
                cancelHandled = true
                return candidate(definition.cancelMode ?? 'normal', intent)
              }
              return candidate('normal', intent)
            },
            activeObservationClosed: createNotificationProbe().observationClosed,
            runBinding: createInternalRunBinding(),
          })
        namespace.requestBrowserSyncTransportRuntimeDiagnosticExchange(
          machine,
          machine.nextExchangeRequestProfile
        )

        if (
          definition.mode === 'pending' ||
          definition.cancelMode === 'pending'
        ) {
          await pendingReached
          assert.equal(machine.runState, 'active')
          assert.equal(machine.lease, 'observable-pending')
          let settlements = 0
          machine.ownerRunPromise.then(() => {
            settlements += 1
          })
          for (let checkpoint = 0; checkpoint < 3; checkpoint += 1) {
            await new Promise((resolve) => {
              queueMicrotask(() => {
                assert.equal(settlements, 0)
                assert.equal(machine.preCleanupObservationSnapshot, null)
                assert.equal(machine.cleanupLedger, null)
                resolve()
              })
            })
          }
        } else {
          const result = await machine.ownerRunPromise
          assertFoundationResult(result)
          assert.equal(result.ok, false)
          assert.equal(result.recordProjection, null)
          assert.deepEqual(result.error, EXPECTED_FOUNDATION_ERROR)
          assert.equal(machine.runState, 'terminal')
          assert.equal(machine.lease, 'closed')
        }
        if (
          definition.target === 'setup-arm' &&
          definition.mode === 'unobservable'
        ) {
          assert.equal(machine.capStates.setup, 'terminal-unknown')
        }
        if (
          definition.target === 'setup-arm' &&
          definition.mode === 'pending'
        ) {
          assert.equal(machine.capStates.setup, 'arm-pending')
        }
        assert.equal(targetHandled, true)
        assert.equal(machine.attemptStarted, false)
        assert.equal(machine.preCleanupObservationSnapshot, null)
        assert.equal(machine.cleanupLedger, null)
        assert.equal(
          intents.some((intent) => intent.payload?.phase === 'cleanup'),
          false
        )
        assert.equal(
          intents.some((intent) => intent.kind === 'cleanup-step'),
          false
        )
      })
    }
  })
})

test('totalisiert alle erreichbaren phasen- und purposegebundenen Rejectiontupel', { concurrency: false }, async (t) => {
  const rejectDecision = () => ({ type: 'reject', reason: new Proxy({}, {
    get() {
      throw new Error('rejection-reason-must-stay-unread')
    },
    getOwnPropertyDescriptor() {
      throw new Error('rejection-reason-must-stay-unreflected')
    },
    ownKeys() {
      throw new Error('rejection-reason-must-stay-unkeyed')
    },
  }) })
  const malformedDecision = () => ({ type: 'fulfill', value: {} })
  const command = (intent, value) =>
    intent.kind === 'protocol-command-send' &&
    intent.payload.command === value
  const clock = (intent, reason) =>
    intent.kind === 'controller-clock-sample' &&
    intent.payload.reason === reason
  const dequeue = (intent, phase) =>
    intent.kind === 'observation-dequeue' && intent.payload.phase === phase
  const cancel = (intent, capKind) =>
    intent.kind === 'cap-cancel' && intent.payload.capKind === capKind

  const simple = (id, predicate, extra = {}) => ({
    id,
    decide(intent, state) {
      if (!state.simpleHandled && predicate(intent)) {
        state.simpleHandled = true
        return rejectDecision()
      }
      return null
    },
    ...extra,
  })
  const definitions = [
    simple('get-targets-send', (intent) => command(intent, 'Target.getTargets'), {
      operationIndex: 0,
    }),
    simple('attach-send', (intent) => command(intent, 'Target.attachToTarget'), {
      operationIndex: 1,
    }),
    simple('enable-send', (intent) => command(intent, 'Network.enable'), {
      operationIndex: 2,
    }),
    simple(
      'setup-dequeue-clock',
      (intent) => clock(intent, 'setup-dequeue-before-reflection')
    ),
    simple('setup-ready-transition-cancel', (intent) => cancel(intent, 'setup')),
    {
      id: 'rejection-quiescence-cancel',
      decide(intent, state) {
        if (!state.triggered && command(intent, 'Target.getTargets')) {
          state.triggered = true
          return malformedDecision()
        }
        return state.triggered && cancel(intent, 'setup')
          ? rejectDecision()
          : null
      },
    },
    {
      id: 'capture-rejection-quiescence-cancel',
      decide(intent, state) {
        if (!state.triggered && command(intent, 'Runtime.evaluate')) {
          state.triggered = true
          return malformedDecision()
        }
        return state.triggered && cancel(intent, 'capture')
          ? rejectDecision()
          : null
      },
    },
    simple(
      'capture-arm',
      (intent) => intent.kind === 'cap-arm' &&
        intent.payload.capKind === 'capture'
    ),
    simple('evaluate-send', (intent) => command(intent, 'Runtime.evaluate'), {
      operationIndex: 3,
    }),
    simple('capture-dequeue', (intent) => dequeue(intent, 'capture')),
    simple(
      'capture-dequeue-clock',
      (intent) => clock(intent, 'capture-dequeue-before-reflection')
    ),
    simple('capture-terminal-quiescence-cancel', (intent) =>
      cancel(intent, 'capture'), {
      controllerOptions: {
        captureMessages: [{ kind: 'connection-closed' }],
      },
    }),
    simple('post-o0-old-setup-cap-cancel', (intent) => cancel(intent, 'setup'), {
      controllerOptions: {
        setupMessages: [{ kind: 'connection-closed' }],
      },
    }),
    simple('post-o0-old-capture-cap-cancel', (intent) =>
      cancel(intent, 'capture'), {
      controllerOptions: {
        captureMessages: [
          createCdpMessage({
            id: 4,
            sessionId: 'session-adr0035-1',
            result: {
              result: {
                type: 'object',
                value: createMainWorldValue(),
              },
            },
          }),
          createNetworkRequestMessage('post-first', 'POST', 10),
          createNetworkRequestMessage('post-second', 'POST', 10.125),
        ],
      },
    }),
    simple(
      'cleanup-origin-clock',
      (intent) => clock(intent, 'cleanup-origin'),
      { terminalCleanup: true }
    ),
    simple(
      'cleanup-arm',
      (intent) => intent.kind === 'cap-arm' &&
        intent.payload.capKind === 'cleanup'
    ),
    {
      id: 'cleanup-arm-recovery-cancel',
      terminalCleanup: true,
      decide(intent, state) {
        if (
          !state.triggered && intent.kind === 'cap-arm' &&
          intent.payload.capKind === 'cleanup'
        ) {
          state.triggered = true
          return malformedDecision()
        }
        return state.triggered && cancel(intent, 'cleanup')
          ? rejectDecision()
          : null
      },
    },
    simple('network-disable-send', (intent) => command(intent, 'Network.disable'), {
      operationIndex: 4,
    }),
    simple('target-detach-send', (intent) =>
      command(intent, 'Target.detachFromTarget'), {
      operationIndex: 5,
    }),
    {
      id: 'cleanup-protocol-dequeue',
      decide(intent, state) {
        if (intent.kind === 'cleanup-step') {
          state.externalCleanupStarted = true
        }
        return !state.externalCleanupStarted && dequeue(intent, 'cleanup')
          ? rejectDecision()
          : null
      },
    },
    {
      id: 'cleanup-protocol-dequeue-clock',
      decide(intent, state) {
        if (intent.kind === 'cleanup-step') {
          state.externalCleanupStarted = true
        }
        return !state.externalCleanupStarted &&
          clock(intent, 'cleanup-dequeue-before-reflection')
          ? rejectDecision()
          : null
      },
    },
    {
      id: 'cleanup-fact-dequeue',
      decide(intent, state) {
        if (intent.kind === 'cleanup-step') {
          state.externalCleanupStarted = true
        }
        return state.externalCleanupStarted && dequeue(intent, 'cleanup')
          ? rejectDecision()
          : null
      },
    },
    {
      id: 'cleanup-fact-dequeue-clock',
      decide(intent, state) {
        if (intent.kind === 'cleanup-step') {
          state.externalCleanupStarted = true
        }
        return state.externalCleanupStarted &&
          clock(intent, 'cleanup-dequeue-before-reflection')
          ? rejectDecision()
          : null
      },
    },
    simple('cleanup-step', (intent) => intent.kind === 'cleanup-step'),
    {
      id: 'cleanup-recovery-cancel',
      terminalCleanup: true,
      decide(intent, state) {
        if (!state.triggered && dequeue(intent, 'cleanup')) {
          state.triggered = true
          return malformedDecision()
        }
        return state.triggered && cancel(intent, 'cleanup')
          ? rejectDecision()
          : null
      },
    },
    simple('cleanup-final-cancel', (intent) => cancel(intent, 'cleanup'), {
      terminalCleanup: true,
    }),
    simple(
      'cleanup-completion-clock',
      (intent) => clock(intent, 'cleanup-completion-after-cap-cancel'),
      { terminalCleanup: true }
    ),
  ]

  for (const definition of definitions) {
    await t.test(definition.id, async () => {
      const state = {
        externalCleanupStarted: false,
        simpleHandled: false,
        triggered: false,
      }
      let rejectionCount = 0
      const controller = createFullRunEffectController({
        ...definition.controllerOptions,
        settlementForIntent(intent) {
          const decision = definition.decide(intent, state)
          if (decision?.type === 'reject') {
            rejectionCount += 1
          }
          return decision
        },
      })
      const result = await runFullController(controller)
      assertFoundationResult(result)
      assert.equal(rejectionCount, 1)
      assert.equal(result.ok, true)
      assert.notEqual(result.recordProjection, null)
      assert.equal(result.recordProjection.candidateObserverGate, 'FAIL')
      assert.equal(result.recordProjection.candidateFinding, 'observer-invalid')
      assert.equal(
        JSON.stringify(result).includes('rejection-reason-must-stay'),
        false
      )
      if (definition.operationIndex !== undefined) {
        const operation = result.recordProjection.observer
          .protocolOperations[definition.operationIndex]
        assert.equal(operation.observedCountClass, 'unknown')
        assert.equal(operation.result, 'unproven')
      }
      if (definition.terminalCleanup) {
        assert.equal(result.recordProjection.cleanup.checks[19].result, 'failed')
        assert.equal(result.recordProjection.stages[9].result, 'mismatch')
      }
    })
  }
})

test('totalisiert purposegebundene Cancelsettlements bis forever-pending', { concurrency: false }, async (t) => {
  const groups = [
    {
      id: 'setup-rejection-quiescence',
      preCleanupAtTarget: false,
      route(intent, state) {
        if (!state.triggered && intent.kind === 'protocol-command-send' &&
          intent.payload.command === 'Target.getTargets') {
          state.triggered = true
          return 'trigger-malformed'
        }
        return state.triggered && intent.kind === 'cap-cancel' &&
          intent.payload.capKind === 'setup'
          ? 'target' : null
      },
    },
    {
      id: 'capture-rejection-quiescence',
      preCleanupAtTarget: false,
      route(intent, state) {
        if (!state.triggered && intent.kind === 'protocol-command-send' &&
          intent.payload.command === 'Runtime.evaluate') {
          state.triggered = true
          return 'trigger-malformed'
        }
        return state.triggered && intent.kind === 'cap-cancel' &&
          intent.payload.capKind === 'capture'
          ? 'target' : null
      },
    },
    {
      id: 'cleanup-arm-recovery',
      preCleanupAtTarget: true,
      route(intent, state) {
        if (!state.triggered && intent.kind === 'cap-arm' &&
          intent.payload.capKind === 'cleanup') {
          state.triggered = true
          return 'trigger-malformed'
        }
        return state.triggered && intent.kind === 'cap-cancel' &&
          intent.payload.capKind === 'cleanup'
          ? 'target' : null
      },
    },
    {
      id: 'cleanup-recovery',
      preCleanupAtTarget: true,
      route(intent, state) {
        if (!state.triggered && intent.kind === 'observation-dequeue' &&
          intent.payload.phase === 'cleanup') {
          state.triggered = true
          return 'trigger-malformed'
        }
        return state.triggered && intent.kind === 'cap-cancel' &&
          intent.payload.capKind === 'cleanup'
          ? 'target' : null
      },
    },
    {
      id: 'cleanup-final',
      preCleanupAtTarget: true,
      route(intent) {
        return intent.kind === 'cap-cancel' &&
          intent.payload.capKind === 'cleanup'
          ? 'target' : null
      },
    },
  ]
  const modes = ['exact', 'malformed', 'unobservable', 'pending']

  await withTemporaryDiagnosticObserverCopy({
    anchor: PRIVATE_EXPORT_ANCHOR,
    kind: 'purpose-cancel-settlement-matrix',
  }, async ({ namespace }) => {
    for (const group of groups) {
      for (const mode of modes) {
        await t.test(`${group.id}/${mode}`, async () => {
          const state = { targetSeen: false, triggered: false }
          const pending = createCleanDeferred()
          let pendingReachedResolve
          const pendingReached = new Promise((resolve) => {
            pendingReachedResolve = resolve
          })
          let machine
          const controller = createFullRunEffectController({
            settlementForIntent(intent) {
              const route = group.route(intent, state)
              if (route === 'trigger-malformed') {
                return { type: 'fulfill', value: {} }
              }
              if (route !== 'target' || state.targetSeen) {
                return null
              }
              state.targetSeen = true
              assert.equal(machine.lease, 'observable-pending')
              assert.equal(
                machine.preCleanupObservationSnapshot !== null,
                group.preCleanupAtTarget
              )
              if (mode === 'malformed') {
                return { type: 'fulfill', value: {} }
              }
              if (mode === 'unobservable') {
                return {
                  type: 'candidate',
                  promise: Object.freeze({ then() {} }),
                }
              }
              if (mode === 'pending') {
                pendingReachedResolve()
                return { type: 'candidate', promise: pending.promise }
              }
              return null
            },
          })
          machine =
            namespace.createBrowserSyncTransportRuntimeDiagnosticRunMachine({
              activeExchange: controller.effectPort.exchange,
              activeObservationClosed: createNotificationProbe().observationClosed,
              runBinding: createInternalRunBinding(),
            })
          namespace.requestBrowserSyncTransportRuntimeDiagnosticExchange(
            machine,
            machine.nextExchangeRequestProfile
          )

          if (mode === 'pending') {
            await pendingReached
            const o0 = machine.preCleanupObservationSnapshot
            const ledger = machine.cleanupLedger
            const intentCount = controller.intents.length
            let ownerSettled = false
            machine.ownerRunPromise.then(() => {
              ownerSettled = true
            })
            for (let checkpoint = 0; checkpoint < 3; checkpoint += 1) {
              await new Promise((resolve) => {
                queueMicrotask(() => {
                  assert.equal(ownerSettled, false)
                  assert.equal(machine.lease, 'observable-pending')
                  assert.equal(machine.preCleanupObservationSnapshot, o0)
                  assert.equal(machine.cleanupLedger, ledger)
                  assert.equal(controller.intents.length, intentCount)
                  resolve()
                })
              })
            }
          } else {
            const result = await machine.ownerRunPromise
            assertFoundationResult(result)
            assert.equal(result.ok, true)
            assert.notEqual(result.recordProjection, null)
            assert.equal(machine.lease, 'closed')
            if (mode === 'unobservable') {
              assert.equal(machine.portState, 'closed')
              assert.equal(machine.activeExchange, null)
            }
          }
          assert.equal(state.targetSeen, true)
        })
      }
    }
  })
})

test('haelt nach S-und-N die Beobachtung bis zum verarbeiteten Capture-Cap offen', { concurrency: false }, async () => {
  const controller = createFullRunEffectController({
    captureTailPending: true,
  })
  const observer = createBrowserSyncTransportRuntimeDiagnosticObserver({
    effectPort: controller.effectPort,
    runBinding: createValidRunBinding(),
  })
  const ownerPromise = observer.run()
  await controller.captureTailReached

  assert.equal(
    controller.intents.at(-1).kind,
    'observation-dequeue'
  )
  assert.equal(controller.intents.at(-1).payload.phase, 'capture')
  const countAtProductEvidence = controller.intents.length
  let ownerSettlements = 0
  ownerPromise.then(
    () => {
      ownerSettlements += 1
    },
    () => {
      ownerSettlements += 1
    }
  )
  for (let checkpoint = 0; checkpoint < 3; checkpoint += 1) {
    await new Promise((resolve) => {
      queueMicrotask(() => {
        assert.equal(ownerSettlements, 0)
        assert.equal(controller.intents.length, countAtProductEvidence)
        assert.equal(
          controller.intents.some((intent) => intent.kind === 'cleanup-step'),
          false
        )
        resolve()
      })
    })
  }

  controller.resolveCaptureTail()
  const result = await ownerPromise
  assertFoundationResult(result)
  assert.equal(result.ok, true)
  assert.equal(ownerSettlements, 1)
  assert.equal(
    result.recordProjection.timing.completion.productEvidenceComplete,
    true
  )
  assert.equal(
    result.recordProjection.timing.completion.observationCloseReason,
    'capture-cap'
  )
})

test('erzwingt das lokale native Port-Promiseprofil und failt unobservable statisch', { concurrency: false }, async (t) => {
  class PromiseSubclass extends Promise {}
  const ownKeyPromise = normalizePromise(new Promise(() => {}))
  ownKeyPromise.extra = true
  const reflectedPromise = normalizePromise(new Promise(() => {}))
  const invalidCandidates = [
    ['undefined', undefined],
    ['null', null],
    ['thenable', { then() {} }],
    ['promise-subclass', normalizePromise(new PromiseSubclass(() => {}))],
    [
      'cross-realm',
      vm.runInNewContext('new Promise(() => {})'),
    ],
    ['own-key', ownKeyPromise],
    ['prototype-mask-without-brand', Object.create(Promise.prototype)],
    [
      'reflection-throw',
      new Proxy(reflectedPromise, {
        ownKeys() {
          throw new Error('promise-ownkeys-private-sentinel')
        },
      }),
    ],
  ]

  for (const [label, candidate] of invalidCandidates) {
    await t.test(label, async () => {
      let calls = 0
      const observer = createBrowserSyncTransportRuntimeDiagnosticObserver({
        effectPort: {
          exchange() {
            calls += 1
            return candidate
          },
          observationClosed: createNotificationProbe().observationClosed,
        },
        runBinding: createValidRunBinding(),
      })
      const result = await observer.run()
      assertFoundationResult(result)
      assert.equal(result.ok, false)
      assert.equal(result.recordProjection, null)
      assert.deepEqual(result.error, EXPECTED_FOUNDATION_ERROR)
      assert.equal(calls, 1)
    })
  }

  const mutationCases = [
    {
      label: 'Promise.prototype.constructor',
      target: Promise.prototype,
      key: 'constructor',
      mutate(descriptor) {
        return { ...descriptor, value: function MutatedPromiseConstructor() {} }
      },
    },
    {
      label: 'Promise.Symbol.species',
      target: Promise,
      key: Symbol.species,
      mutate(descriptor) {
        return { ...descriptor, get() { return null } }
      },
    },
    {
      label: 'Promise.prototype.then',
      target: Promise.prototype,
      key: 'then',
      mutate(descriptor) {
        return {
          ...descriptor,
          value(onFulfilled, onRejected) {
            return Reflect.apply(descriptor.value, this, [
              onFulfilled,
              onRejected,
            ])
          },
        }
      },
    },
  ]
  for (const mutation of mutationCases) {
    await t.test(mutation.label, async () => {
      const descriptor = Object.getOwnPropertyDescriptor(
        mutation.target,
        mutation.key
      )
      const candidate = normalizePromise(new Promise(() => {}))
      const observer = createBrowserSyncTransportRuntimeDiagnosticObserver({
        effectPort: {
          exchange() { return candidate },
          observationClosed: createNotificationProbe().observationClosed,
        },
        runBinding: createValidRunBinding(),
      })
      let ownerPromise
      try {
        Object.defineProperty(
          mutation.target,
          mutation.key,
          mutation.mutate(descriptor)
        )
        ownerPromise = observer.run()
      } finally {
        restoreOwnProperty(mutation.target, mutation.key, descriptor)
      }
      const result = await ownerPromise
      assertFoundationResult(result)
      assert.equal(result.ok, false)
      assert.equal(result.recordProjection, null)
    })
  }
})

test('behandelt einen Throw der einmaligen nativen then-Anwendung als unobservable', { concurrency: false }, async () => {
  const thenDescriptor = Object.getOwnPropertyDescriptor(
    Promise.prototype,
    'then'
  )
  try {
    Object.defineProperty(Promise.prototype, 'then', {
      ...thenDescriptor,
      value(onFulfilled, onRejected) {
        if (
          onFulfilled?.name === 'controlledFulfillment' &&
          onRejected?.name === 'controlledRejection'
        ) {
          throw new Error('captured-native-then-private-sentinel')
        }
        return Reflect.apply(thenDescriptor.value, this, [
          onFulfilled,
          onRejected,
        ])
      },
    })
    await withTemporaryDiagnosticObserverCopy({
      anchor: PRIVATE_EXPORT_ANCHOR,
    }, async ({ namespace }) => {
      let portCalls = 0
      const observer =
        namespace.createBrowserSyncTransportRuntimeDiagnosticObserver({
          effectPort: {
            exchange() {
              portCalls += 1
              return normalizePromise(new Promise(() => {}))
            },
            observationClosed: createNotificationProbe().observationClosed,
          },
          runBinding: createValidRunBinding(),
        })
      const result = await observer.run()
      assertFoundationResult(result)
      assert.equal(result.ok, false)
      assert.equal(result.recordProjection, null)
      assert.equal(portCalls, 1)

      const candidate = normalizePromise(new Promise(() => {}))
      const machine =
        namespace.createBrowserSyncTransportRuntimeDiagnosticRunMachine({
          activeExchange() {
            return candidate
          },
          activeObservationClosed: createNotificationProbe().observationClosed,
          runBinding: createInternalRunBinding(),
        })
      namespace.requestBrowserSyncTransportRuntimeDiagnosticExchange(
        machine,
        machine.nextExchangeRequestProfile
      )
      assert.equal(machine.activeExchangePromiseCandidate, null)
      assert.equal((await machine.ownerRunPromise).ok, false)
    })
  } finally {
    restoreOwnProperty(Promise.prototype, 'then', thenDescriptor)
  }
})

test('totalisiert Target.getTargets mit 128/129, Dichte, Keys, Accessors und Dubletten', { concurrency: false }, async (t) => {
  const matchingTarget = () => ({
    type: 'page',
    url: TOP_LEVEL_URL,
    attached: false,
    targetId: 'target-adr0035-1',
  })
  const otherTarget = (index) => ({
    targetId: `worker-target-${index}`,
    type: 'worker',
    url: `http://127.0.0.1/worker-${index}`,
    attached: false,
  })
  const accepted128 = [matchingTarget()]
  for (let index = 1; index < 128; index += 1) {
    accepted128.push(otherTarget(index))
  }
  const tooMany129 = [...accepted128, otherTarget(128)]
  const sparse = new Array(1)
  const withExtra = [matchingTarget()]
  withExtra.extra = true
  const withSymbol = [matchingTarget()]
  withSymbol[Symbol('target-array-extra')] = true
  let accessorCalls = 0
  const withAccessor = []
  Object.defineProperty(withAccessor, '0', {
    configurable: true,
    enumerable: true,
    get() {
      accessorCalls += 1
      return matchingTarget()
    },
  })
  const aliased = otherTarget('alias')

  const cases = [
    { label: '128-dense', targetInfos: accepted128, gate: 'UNPROVEN', evaluate: true },
    { label: '129-too-many', targetInfos: tooMany129, gate: 'UNPROVEN', evaluate: false },
    { label: 'zero-candidates', targetInfos: [], gate: 'UNPROVEN', evaluate: false },
    {
      label: 'two-matching-candidates',
      targetInfos: [matchingTarget(), { ...matchingTarget(), targetId: 'target-2' }],
      gate: 'UNPROVEN',
      evaluate: false,
    },
    {
      label: 'already-attached',
      targetInfos: [{ ...matchingTarget(), attached: true }],
      gate: 'UNPROVEN',
      evaluate: false,
    },
    { label: 'sparse', targetInfos: sparse, gate: 'FAIL', evaluate: false },
    { label: 'array-extra-key', targetInfos: withExtra, gate: 'FAIL', evaluate: false },
    { label: 'array-symbol', targetInfos: withSymbol, gate: 'FAIL', evaluate: false },
    { label: 'array-accessor', targetInfos: withAccessor, gate: 'FAIL', evaluate: false },
    { label: 'aliased-entry', targetInfos: [aliased, aliased], gate: 'FAIL', evaluate: false },
  ]

  for (const entry of cases) {
    await t.test(entry.label, async () => {
      const controller = createFullRunEffectController({
        setupMessages: createSetupMessagesForTargets(entry.targetInfos),
      })
      const result = await runFullController(controller)
      assertFoundationResult(result)
      assert.equal(
        result.ok,
        true,
        JSON.stringify(controller.intents.map((intent) => [
          intent.kind,
          intent.payload,
        ]))
      )
      const projection = result.recordProjection
      assert.equal(
        projection.candidateObserverGate,
        entry.gate,
        JSON.stringify({
          cleanup: projection.cleanup,
          completion: projection.timing.completion,
          integrity: projection.observer.integrityChecks,
        })
      )
      assert.equal(
        controller.protocolCommands.includes('Runtime.evaluate'),
        entry.evaluate
      )
      const getTargets = projection.observer.protocolOperations[0]
      assert.equal(getTargets.observedCountClass, 'one')
      assert.equal(getTargets.result, 'match')
      if (!entry.evaluate) {
        assert.equal(projection.stages[0].observationState, 'observed')
        for (let index = 1; index < 8; index += 1) {
          assert.equal(projection.stages[index].observationState, 'not-observed')
          assert.equal(projection.stages[index].receiptOrder, null)
          assert.equal(projection.stages[index].result, 'unproven')
          assert.equal(projection.stages[index].relativeMilliseconds, null)
          assert.equal(projection.stages[index].timingState, 'unavailable')
        }
        assert.equal(
          projection.timing.completion.captureWindowState,
          'not-started'
        )
      }
    })
  }
  assert.equal(accessorCalls, 0)
})

test('regrediert die Browser-Network-Clock gegen das letzte gueltige Sample', { concurrency: false }, async (t) => {
  const maximumSafeSeconds = Number.MAX_SAFE_INTEGER / 1000
  const cases = [
    {
      label: '10-12-11-last-sample-regression',
      messages: [
        createNetworkRequestMessage('preflight-clock', 'OPTIONS', 10),
        createNetworkResponseMessage('preflight-clock', 204, 12),
        createNetworkRequestMessage('post-clock', 'POST', 11),
      ],
      gate: 'FAIL',
      observedStages: [2, 3],
      untouchedStage: 4,
      lastTiming: 2000,
    },
    {
      label: '10-9-regression',
      messages: [
        createNetworkRequestMessage('preflight-clock', 'OPTIONS', 10),
        createNetworkResponseMessage('preflight-clock', 204, 9),
      ],
      gate: 'FAIL',
      observedStages: [2],
      untouchedStage: 3,
    },
    {
      label: 'equal-is-valid',
      messages: [
        createNetworkRequestMessage('preflight-clock', 'OPTIONS', 10),
        createNetworkResponseMessage('preflight-clock', 204, 10),
      ],
      gate: 'UNPROVEN',
      observedStages: [2, 3],
      lastTiming: 0,
    },
    {
      label: 'invalid-first-negative',
      messages: [createNetworkRequestMessage('negative', 'OPTIONS', -1)],
      gate: 'FAIL',
      observedStages: [],
      untouchedStage: 2,
    },
    {
      label: 'invalid-first-NaN',
      messages: [createNetworkRequestMessage('nan', 'OPTIONS', NaN)],
      gate: 'FAIL',
      observedStages: [],
      untouchedStage: 2,
    },
    {
      label: 'invalid-first-Infinity',
      messages: [createNetworkRequestMessage('infinity', 'OPTIONS', Infinity)],
      gate: 'FAIL',
      observedStages: [],
      untouchedStage: 2,
    },
    {
      label: 'unsafe-absolute-and-relative-milliseconds',
      messages: [
        createNetworkRequestMessage(
          'unsafe',
          'OPTIONS',
          maximumSafeSeconds + 1
        ),
      ],
      gate: 'FAIL',
      observedStages: [],
      untouchedStage: 2,
    },
  ]

  for (const entry of cases) {
    await t.test(entry.label, async () => {
      const controller = createFullRunEffectController({
        captureMessages: entry.messages,
      })
      const result = await runFullController(controller)
      assertFoundationResult(result)
      assert.equal(result.ok, true)
      const projection = result.recordProjection
      assert.equal(projection.candidateObserverGate, entry.gate)
      assert.equal(
        projection.candidateFinding,
        entry.gate === 'FAIL' ? 'observer-invalid' : 'inconclusive'
      )
      for (const stageIndex of entry.observedStages) {
        assert.equal(projection.stages[stageIndex].observationState, 'observed')
      }
      if (entry.untouchedStage !== undefined) {
        const stage = projection.stages[entry.untouchedStage]
        assert.equal(stage.observationState, 'not-observed')
        assert.equal(stage.receiptOrder, null)
        assert.equal(stage.relativeMilliseconds, null)
        assert.equal(stage.timingState, 'unavailable')
      }
      if (entry.lastTiming !== undefined) {
        const stage = projection.stages[entry.observedStages.at(-1)]
        assert.equal(stage.relativeMilliseconds, entry.lastTiming)
      }
      if (entry.gate === 'FAIL') {
        assert.equal(
          projection.timing.completion.observationCloseReason,
          'confirmed-violation'
        )
        assert.equal(
          projection.timing.completion.captureWindowState,
          'truncated'
        )
      }
    })
  }
})

test('validiert konsumierte TargetInfo-Typen und URLs vor der Kandidatenklassifikation', { concurrency: false }, async (t) => {
  const cases = [
    ['non-string-type', 7, TOP_LEVEL_URL, 'FAIL', 'unknown'],
    ['non-string-url', 'page', 7, 'FAIL', 'unknown'],
    ['empty-url', 'page', '', 'FAIL', 'unknown'],
    ['url-over-2048-code-units', 'page', 'x'.repeat(2049), 'FAIL', 'unknown'],
    ['valid-nonmatching-type', 'worker', TOP_LEVEL_URL, 'UNPROVEN', 'other'],
    [
      'valid-nonmatching-url',
      'page',
      'http://127.0.0.1:5174/',
      'UNPROVEN',
      'other',
    ],
  ]
  for (const [label, type, url, gate, targetProfile] of cases) {
    await t.test(label, async () => {
      const controller = createFullRunEffectController({
        setupMessages: createSetupMessagesForTargets([{
          targetId: 'target-type-url-probe',
          type,
          url,
          attached: false,
        }]),
      })
      const result = await runFullController(controller)
      assert.equal(result.ok, true)
      const projection = result.recordProjection
      assert.equal(projection.candidateObserverGate, gate)
      assert.equal(projection.observer.targetProfile, targetProfile)
      assert.equal(
        projection.timing.completion.observationCloseReason,
        gate === 'FAIL'
          ? 'confirmed-violation'
          : 'setup-terminal-unproven'
      )
      assert.equal(
        projection.observer.protocolOperations[0].observedCountClass,
        'one'
      )
      assert.equal(projection.observer.protocolOperations[0].result, 'match')
      assert.equal(
        controller.protocolCommands.includes('Target.attachToTarget'),
        false
      )
      assert.equal(
        controller.protocolCommands.includes('Runtime.evaluate'),
        false
      )
    })
  }
})

test('haelt unkorrelierte Endpoint-Responses in Preflight und POST sticky ambiguous', { concurrency: false }, async (t) => {
  function uncorrelatedResponseProbe() {
    let statusReads = 0
    let timestampReads = 0
    const response = { url: ENDPOINT_URL }
    Object.defineProperty(response, 'status', {
      configurable: true,
      enumerable: true,
      get() {
        statusReads += 1
        throw new Error('uncorrelated-status-must-stay-unread')
      },
    })
    const params = {
      requestId: 'unknown-endpoint-response-id',
      response,
    }
    Object.defineProperty(params, 'timestamp', {
      configurable: true,
      enumerable: true,
      get() {
        timestampReads += 1
        throw new Error('uncorrelated-timestamp-must-stay-unread')
      },
    })
    return {
      message: createCdpMessage({
        method: 'Network.responseReceived',
        sessionId: 'session-adr0035-1',
        params,
      }),
      reads() {
        return { statusReads, timestampReads }
      },
    }
  }

  const cases = [
    ['preflight-only', 'preflight', false],
    ['preflight-then-correlated', 'preflight', true],
    ['post-only', 'post', false],
    ['post-then-correlated', 'post', true],
  ]
  for (const [label, phase, laterCorrelated] of cases) {
    await t.test(label, async () => {
      const probe = uncorrelatedResponseProbe()
      const messages = [
        createNetworkRequestMessage('preflight-correlated', 'OPTIONS', 10),
      ]
      if (phase === 'post') {
        messages.push(
          createNetworkResponseMessage('preflight-correlated', 204, 10.1),
          createNetworkRequestMessage('post-correlated', 'POST', 10.2)
        )
      }
      messages.push(probe.message)
      if (laterCorrelated) {
        messages.push(
          phase === 'preflight'
            ? createNetworkResponseMessage(
                'preflight-correlated',
                204,
                10.1
              )
            : createNetworkResponseMessage('post-correlated', 200, 10.3)
        )
      }

      const result = await runFullController(
        createFullRunEffectController({ captureMessages: messages })
      )
      assert.equal(result.ok, true)
      const projection = result.recordProjection
      const stage = projection.stages[phase === 'preflight' ? 3 : 5]
      assert.deepEqual(probe.reads(), {
        statusReads: 0,
        timestampReads: 0,
      })
      assert.equal(
        stage.observationState,
        laterCorrelated ? 'observed' : 'not-observed'
      )
      assert.equal(stage.result, laterCorrelated ? 'match' : 'unproven')
      assert.equal(
        stage.receiptOrder,
        laterCorrelated ? (phase === 'preflight' ? 2 : 4) : null
      )
      assert.equal(
        stage.relativeMilliseconds,
        laterCorrelated ? (phase === 'preflight' ? 90 : 300) : null
      )
      assert.equal(
        stage.timingState,
        laterCorrelated ? 'measured' : 'unavailable'
      )
      assert.equal(projection.requestBudget.sequence, 'ambiguous')
      assert.equal(
        projection.timing.completion.productEvidenceComplete,
        false
      )
      assert.equal(projection.candidateObserverGate, 'UNPROVEN')
      assert.equal(projection.candidateFinding, 'inconclusive')
    })
  }
})

test('bindet Response-URLs und exakte Network-Reihenfolge an die Sequenz', { concurrency: false }, async (t) => {
  function responseWithUrl(requestId, url, status, timestamp) {
    return createCdpMessage({
      method: 'Network.responseReceived',
      sessionId: 'session-adr0035-1',
      params: {
        requestId,
        response: { url, status },
        timestamp,
      },
    })
  }

  for (const entry of [
    {
      label: 'bound-preflight-response-foreign-url',
      messages: [
        createNetworkRequestMessage('foreign-url-options', 'OPTIONS', 10),
        responseWithUrl(
          'foreign-url-options',
          'http://127.0.0.1:8787/other',
          204,
          10.1
        ),
      ],
      stageIndex: 3,
      receiptOrder: 2,
    },
    {
      label: 'bound-post-response-foreign-url',
      messages: [
        createNetworkRequestMessage('foreign-url-options', 'OPTIONS', 10),
        createNetworkResponseMessage('foreign-url-options', 204, 10.1),
        createNetworkRequestMessage('foreign-url-post', 'POST', 10.2),
        responseWithUrl(
          'foreign-url-post',
          'http://127.0.0.1:8787/other',
          200,
          10.3
        ),
      ],
      stageIndex: 5,
      receiptOrder: 4,
    },
  ]) {
    await t.test(entry.label, async () => {
      const result = await runFullController(createFullRunEffectController({
        captureMessages: entry.messages,
      }))
      assert.equal(result.ok, true)
      const projection = result.recordProjection
      const stage = projection.stages[entry.stageIndex]
      assert.equal(stage.observationState, 'observed')
      assert.equal(stage.result, 'mismatch')
      assert.equal(stage.receiptOrder, entry.receiptOrder)
      assert.equal(stage.timingState, 'measured')
      assert.notEqual(stage.relativeMilliseconds, null)
      assert.equal(projection.requestBudget.sequence, 'other')
    })
  }

  await t.test('unknown-id-foreign-url-stays-ignored-and-deep-unread', async () => {
    let deepReflectionCount = 0
    const response = { url: 'http://127.0.0.1:8787/other' }
    Object.defineProperty(response, 'status', {
      enumerable: true,
      get() {
        deepReflectionCount += 1
        throw new Error('unknown-foreign-status-must-stay-unread')
      },
    })
    const params = {
      requestId: 'unknown-foreign-response',
      response,
    }
    Object.defineProperty(params, 'timestamp', {
      enumerable: true,
      get() {
        deepReflectionCount += 1
        throw new Error('unknown-foreign-timestamp-must-stay-unread')
      },
    })
    const message = createCdpMessage({
      method: 'Network.responseReceived',
      sessionId: 'session-adr0035-1',
      params,
    })
    const result = await runFullController(createFullRunEffectController({
      captureMessages: [message],
    }))
    assert.equal(result.ok, true)
    assert.equal(deepReflectionCount, 0)
    assert.equal(result.recordProjection.requestBudget.sequence, 'incomplete')
    assert.equal(result.recordProjection.candidateObserverGate, 'UNPROVEN')
  })

  await t.test('reversed-methods-never-form-canonical-sequence', async () => {
    const messages = [
      createNetworkRequestMessage('reverse-method-a', 'POST', 10),
      createNetworkResponseMessage('reverse-method-a', 204, 10.1),
      createNetworkRequestMessage('reverse-method-b', 'OPTIONS', 10.2),
      createNetworkResponseMessage('reverse-method-b', 200, 10.3),
      createNetworkTerminalMessage('reverse-method-b', 10.4),
    ]
    const result = await runFullController(createFullRunEffectController({
      captureMessages: messages,
    }))
    assert.equal(result.ok, true)
    const projection = result.recordProjection
    assert.equal(projection.requestBudget.endpointOptions, 'one')
    assert.equal(projection.requestBudget.endpointPosts, 'one')
    assert.equal(projection.stages[2].result, 'mismatch')
    assert.equal(projection.stages[3].result, 'match')
    assert.equal(projection.stages[4].result, 'mismatch')
    assert.equal(projection.stages[5].result, 'match')
    assert.equal(projection.stages[6].result, 'match')
    assert.equal(projection.requestBudget.sequence, 'other')
  })

  await t.test('matching-events-out-of-order-are-still-other', async () => {
    const messages = [
      createNetworkRequestMessage('order-options', 'OPTIONS', 10),
      createNetworkRequestMessage('order-post', 'POST', 10.1),
      createNetworkResponseMessage('order-post', 200, 10.2),
      createNetworkResponseMessage('order-options', 204, 10.3),
      createNetworkTerminalMessage('order-post', 10.4),
    ]
    const result = await runFullController(createFullRunEffectController({
      captureMessages: messages,
    }))
    assert.equal(result.ok, true)
    const projection = result.recordProjection
    assert.equal(
      projection.stages.slice(2, 7).every(
        (stage) => stage.observationState === 'observed' &&
          stage.result === 'match'
      ),
      true
    )
    assert.deepEqual(
      projection.stages.slice(2, 7).map((stage) => stage.receiptOrder),
      [1, 4, 2, 3, 5]
    )
    assert.equal(projection.requestBudget.sequence, 'other')
  })
})

test('ignoriert Network-Events fremder valider Session vor jeder Params-Reflection', { concurrency: false }, async (t) => {
  const baseline = await runFullController(createFullRunEffectController({
    captureMessages: [],
  }))
  assertFoundationResult(baseline)
  assert.equal(baseline.ok, true)

  let deepReads = 0
  const hostileParams = new Proxy({}, {
    get() {
      deepReads += 1
      throw new Error('foreign-network-params-read')
    },
    getOwnPropertyDescriptor() {
      deepReads += 1
      throw new Error('foreign-network-params-descriptor')
    },
    ownKeys() {
      deepReads += 1
      throw new Error('foreign-network-params-keys')
    },
  })
  const foreign = await runFullController(createFullRunEffectController({
    captureMessages: [createCdpMessage({
      method: 'Network.requestWillBeSent',
      sessionId: 'foreign-valid-session',
      params: hostileParams,
    })],
  }))
  assertFoundationResult(foreign)
  assert.equal(foreign.ok, true)
  assert.equal(deepReads, 0)
  assert.equal(foreign.recordProjection.candidateObserverGate, 'UNPROVEN')
  assert.equal(foreign.recordProjection.candidateFinding, 'inconclusive')
  assert.deepEqual(
    foreign.recordProjection.requestBudget,
    baseline.recordProjection.requestBudget
  )
  assert.deepEqual(
    foreign.recordProjection.stages.slice(2, 7),
    baseline.recordProjection.stages.slice(2, 7)
  )
  assert.equal(
    foreign.recordProjection.timing.completion.observationCloseReason,
    'capture-cap'
  )

  for (const [label, createMessage] of [
    [
      'non-string-session',
      () => createCdpMessage({
        method: 'Network.requestWillBeSent',
        sessionId: 17,
        params: hostileParams,
      }),
    ],
    [
      'accessor-session',
      () => {
        const message = {
          method: 'Network.requestWillBeSent',
          params: hostileParams,
        }
        Object.defineProperty(message, 'sessionId', {
          configurable: true,
          enumerable: true,
          get() {
            throw new Error('network-session-accessor-must-not-run')
          },
        })
        return createCdpMessage(message)
      },
    ],
  ]) {
    await t.test(label, async () => {
      const readsBefore = deepReads
      const result = await runFullController(createFullRunEffectController({
        captureMessages: [createMessage()],
      }))
      assertFoundationResult(result)
      assert.equal(result.ok, true)
      assert.equal(result.recordProjection.candidateObserverGate, 'FAIL')
      assert.equal(result.recordProjection.candidateFinding, 'observer-invalid')
      assert.equal(deepReads, readsBefore)
    })
  }
})

test('demotiert Network-Dubletten und haelt ReceiptOrders je Layer dicht', { concurrency: false }, async (t) => {
  function assertDenseObservedNetworkOrders(projection) {
    const orders = projection.stages
      .filter(
        (stage) => stage.layer === 'browser-network' &&
          stage.observationState === 'observed'
      )
      .map((stage) => stage.receiptOrder)
      .sort((left, right) => left - right)
    assert.deepEqual(
      orders,
      Array.from({ length: orders.length }, (_, index) => index + 1)
    )
  }

  await t.test('duplicate-preflight-request-id-counts-and-demotes', async () => {
    const messages = [
      createNetworkRequestMessage('duplicate-options', 'OPTIONS', 10),
      createNetworkRequestMessage('duplicate-options', 'OPTIONS', 10.1),
      createNetworkResponseMessage('duplicate-options', 204, 10.2),
      createNetworkRequestMessage('after-duplicate-post', 'POST', 10.3),
      createNetworkResponseMessage('after-duplicate-post', 200, 10.4),
      createNetworkTerminalMessage('after-duplicate-post', 10.5),
    ]
    const result = await runFullController(createFullRunEffectController({
      captureMessages: messages,
    }))
    assert.equal(result.ok, true)
    const projection = result.recordProjection
    assert.equal(projection.requestBudget.endpointOptions, 'multiple')
    assert.equal(projection.requestBudget.endpointPosts, 'one')
    assert.equal(projection.requestBudget.sequence, 'ambiguous')
    assert.equal(projection.stages[2].observationState, 'ambiguous')
    assert.equal(projection.stages[2].receiptOrder, null)
    assert.equal(projection.stages[2].result, 'unproven')
    assertDenseObservedNetworkOrders(projection)
    assert.equal(
      projection.timing.completion.observationCloseReason,
      'capture-cap'
    )
  })

  await t.test('duplicate-post-request-id-counts-and-is-v', async () => {
    const messages = [
      createNetworkRequestMessage('duplicate-post-options', 'OPTIONS', 10),
      createNetworkResponseMessage('duplicate-post-options', 204, 10.1),
      createNetworkRequestMessage('duplicate-post', 'POST', 10.2),
      createNetworkRequestMessage('duplicate-post', 'POST', 10.3),
    ]
    const result = await runFullController(createFullRunEffectController({
      captureMessages: messages,
    }))
    assert.equal(result.ok, true)
    const projection = result.recordProjection
    assert.equal(projection.requestBudget.endpointPosts, 'multiple')
    assert.equal(projection.stages[4].observationState, 'ambiguous')
    assert.equal(projection.stages[4].receiptOrder, null)
    assert.equal(projection.candidateObserverGate, 'FAIL')
    assert.equal(
      projection.timing.completion.observationCloseReason,
      'confirmed-violation'
    )
    assertDenseObservedNetworkOrders(projection)
  })

  await t.test('options-options-post-is-other-not-v', async () => {
    const messages = [
      createNetworkRequestMessage('two-options-a', 'OPTIONS', 10),
      createNetworkRequestMessage('two-options-b', 'OPTIONS', 10.1),
      createNetworkRequestMessage('first-post-third-request', 'POST', 10.2),
    ]
    const result = await runFullController(createFullRunEffectController({
      captureMessages: messages,
    }))
    assert.equal(result.ok, true)
    const projection = result.recordProjection
    assert.equal(projection.requestBudget.endpointOptions, 'multiple')
    assert.equal(projection.requestBudget.endpointPosts, 'one')
    assert.equal(projection.requestBudget.endpointOtherMethods, 'zero')
    assert.equal(projection.requestBudget.sequence, 'other')
    assert.equal(projection.candidateObserverGate, 'UNPROVEN')
    assert.equal(
      projection.timing.completion.observationCloseReason,
      'capture-cap'
    )
  })

  for (const kind of ['preflight-response', 'post-response', 'terminal']) {
    await t.test(`duplicate-${kind}-compacts-orders`, async () => {
      const messages = [
        createNetworkRequestMessage('demote-options', 'OPTIONS', 10),
        createNetworkResponseMessage('demote-options', 204, 10.1),
      ]
      if (kind === 'preflight-response') {
        messages.push(createNetworkResponseMessage('demote-options', 204, 10.15))
      }
      messages.push(
        createNetworkRequestMessage('demote-post', 'POST', 10.2),
        createNetworkResponseMessage('demote-post', 200, 10.3)
      )
      if (kind === 'post-response') {
        messages.push(createNetworkResponseMessage('demote-post', 200, 10.35))
      }
      messages.push(createNetworkTerminalMessage('demote-post', 10.4))
      if (kind === 'terminal') {
        messages.push(createNetworkTerminalMessage('demote-post', 10.45))
      }
      const result = await runFullController(createFullRunEffectController({
        captureMessages: messages,
      }))
      assert.equal(result.ok, true)
      const projection = result.recordProjection
      const demotedIndex = kind === 'preflight-response'
        ? 3
        : (kind === 'post-response' ? 5 : 6)
      assert.equal(projection.stages[demotedIndex].observationState, 'ambiguous')
      assert.equal(projection.stages[demotedIndex].receiptOrder, null)
      assert.equal(projection.stages[demotedIndex].result, 'unproven')
      assertDenseObservedNetworkOrders(projection)
      assert.equal(projection.requestBudget.sequence, 'ambiguous')
    })
  }
})

test('akzeptiert passend direkt-protomaskierte echte Subclass- und Cross-Realm-Promises', { concurrency: false }, async (t) => {
  for (const kind of ['subclass', 'cross-realm']) {
    await t.test(kind, async () => {
      let masked = false
      const controller = createFullRunEffectController({
        settlementForIntent(intent, response) {
          if (masked || intent.kind !== 'capability-probe') {
            return null
          }
          masked = true
          let candidate
          if (kind === 'subclass') {
            class MaskedPromiseSubclass extends Promise {}
            candidate = new MaskedPromiseSubclass((resolve) => {
              resolve(response)
            })
          } else {
            const context = vm.createContext({ response })
            candidate = vm.runInContext('Promise.resolve(response)', context)
          }
          normalizePromise(candidate)
          Object.setPrototypeOf(candidate, Promise.prototype)
          assert.equal(Object.getPrototypeOf(candidate), Promise.prototype)
          return { type: 'candidate', promise: candidate }
        },
      })
      const result = await runFullController(controller)
      assert.equal(masked, true)
      assert.equal(result.ok, true)
      assert.notEqual(result.recordProjection, null)
      assert.equal(
        result.recordProjection.timing.completion.observationCloseReason,
        'capture-cap'
      )
      assert.equal(controller.intents[0].kind, 'capability-probe')
      assert.equal(controller.protocolCommands.length, 6)
    })
  }
})

test('trennt GetTargets-Antwortdubletten vom bestaetigten einzelnen Send-Ack', { concurrency: false }, async (t) => {
  const targetInfos = [{
    targetId: 'target-adr0035-1',
    type: 'page',
    url: TOP_LEVEL_URL,
    attached: false,
  }]
  const validReply = () => createCdpMessage({
    id: 1,
    result: { targetInfos: cloneTree(targetInfos) },
  })
  const cases = [
    {
      label: 'well-formed-before-evaluate',
      controller: createFullRunEffectController({
        setupMessages: [validReply(), validReply()],
      }),
      gate: 'UNPROVEN',
      evaluate: false,
      targetProfile: 'unknown',
    },
    {
      label: 'well-formed-during-capture',
      controller: createFullRunEffectController({
        captureMessages: [validReply()],
      }),
      gate: 'UNPROVEN',
      evaluate: true,
      targetProfile: 'unknown',
    },
    {
      label: 'malformed-before-o0',
      controller: createFullRunEffectController({
        setupMessages: [
          validReply(),
          createCdpMessage({ id: 1, result: { targetInfos: 'malformed' } }),
        ],
      }),
      gate: 'FAIL',
      evaluate: false,
      targetProfile: 'single-goldendawn-top-level',
    },
  ]

  for (const entry of cases) {
    await t.test(entry.label, async () => {
      const result = await runFullController(entry.controller)
      assert.equal(result.ok, true)
      const projection = result.recordProjection
      const getTargets = projection.observer.protocolOperations[0]
      assert.equal(getTargets.observedCountClass, 'one')
      assert.equal(getTargets.result, 'match')
      assert.equal(
        entry.controller.protocolCommands.filter(
          (command) => command === 'Target.getTargets'
        ).length,
        1
      )
      assert.equal(
        entry.controller.protocolCommands.includes('Runtime.evaluate'),
        entry.evaluate
      )
      assert.equal(projection.observer.targetProfile, entry.targetProfile)
      assert.equal(projection.candidateObserverGate, entry.gate)
      assert.equal(
        projection.candidateFinding,
        entry.gate === 'FAIL' ? 'observer-invalid' : 'inconclusive'
      )
      if (entry.label === 'well-formed-during-capture') {
        assert.equal(
          projection.timing.completion.observationCloseReason,
          'capture-cap'
        )
        assert.equal(
          projection.timing.completion.captureWindowState,
          'elapsed'
        )
      }
      if (entry.label === 'malformed-before-o0') {
        assert.equal(projection.stages[0].observationState, 'observed')
        assert.equal(projection.stages[0].result, 'match')
        assert.equal(
          projection.stages.slice(1, 8).every(
            (stage) => stage.observationState === 'not-observed'
          ),
          true
        )
        assert.equal(
          projection.stages.slice(1, 8).every(
            (stage) => stage.result === 'unproven'
          ),
          true
        )
      }
    })
  }

  await t.test('well-formed-post-o0-is-cleanup-only', async () => {
    const baselineResult = await runFullController(
      createFullRunEffectController()
    )
    let injected = false
    let postO0ResultReflectionCount = 0
    const postO0Duplicate = createCdpMessage(new Proxy(
      { id: 1 },
      {
        getOwnPropertyDescriptor(target, key) {
          if (key === 'result') {
            postO0ResultReflectionCount += 1
            throw new Error('post-o0-result-must-stay-unread')
          }
          return Reflect.getOwnPropertyDescriptor(target, key)
        },
      }
    ))
    const controller = createFullRunEffectController({
      settlementForIntent(intent) {
        if (
          injected === false &&
          intent.kind === 'observation-dequeue' &&
          intent.payload.phase === 'cleanup'
        ) {
          injected = true
          return { type: 'fulfill', value: postO0Duplicate }
        }
        return null
      },
    })
    const result = await runFullController(controller)
    assert.equal(result.ok, true)
    assert.equal(injected, true)
    const baseline = baselineResult.recordProjection
    const projection = result.recordProjection

    assert.equal(postO0ResultReflectionCount, 0)
    assert.deepEqual(projection.historicalEvidence, baseline.historicalEvidence)
    assert.deepEqual(projection.replay, baseline.replay)
    assert.deepEqual(
      projection.observer.protocolOperations.slice(0, 4),
      baseline.observer.protocolOperations.slice(0, 4)
    )
    for (const key of [
      'deltaProfile',
      'controllerExclusivity',
      'connectionProfile',
      'targetProfile',
      'foundationSha256',
      'evaluationSha256',
      'controllerEvaluateIntentCount',
      'mainWorldEvaluationCount',
      'transportFactoryCallCount',
      'primitiveProjectionProfile',
    ]) {
      assert.deepEqual(projection.observer[key], baseline.observer[key])
    }
    assert.deepEqual(projection.requestBudget, baseline.requestBudget)
    assert.deepEqual(projection.publicSettlement, baseline.publicSettlement)
    assert.deepEqual(projection.stages.slice(0, 8), baseline.stages.slice(0, 8))
    for (const key of [
      'productEvidenceComplete',
      'observationCloseReason',
      'observationClosed',
      'captureWindowState',
      'evaluateReplyCountClass',
      'requestBudgetFinalized',
    ]) {
      assert.deepEqual(
        projection.timing.completion[key],
        baseline.timing.completion[key]
      )
    }
    assert.equal(
      projection.observer.protocolOperations[0].observedCountClass,
      'one'
    )
    assert.equal(projection.observer.protocolOperations[0].result, 'match')
    assert.equal(projection.cleanup.result, 'FAIL')
    assert.equal(projection.candidateObserverGate, 'FAIL')
    assert.equal(projection.candidateFinding, 'observer-invalid')
  })
})

test('entscheidet Setup- und Cleanup-Caps unterhalb, exakt und oberhalb roh vor Reflection', { concurrency: false }, async (t) => {
  await t.test('setup-below-deadline', async () => {
    let setupDequeueCount = 0
    const result = await runFullController(createFullRunEffectController({
      clockForReason(reason, current) {
        if (reason === 'setup-origin') {
          return 100
        }
        if (reason === 'setup-dequeue-before-reflection') {
          setupDequeueCount += 1
          return 5900 + setupDequeueCount * 10
        }
        return current + 10
      },
    }))
    assert.equal(result.ok, true)
    assert.equal(
      result.recordProjection.timing.completion.observationCloseReason,
      'capture-cap'
    )
  })

  for (const [label, sampledClock] of [
    ['setup-equal-deadline', 6100],
    ['setup-above-deadline', 6101],
  ]) {
    await t.test(label, async () => {
      let envelopeReads = 0
      const unreadEnvelope = {}
      Object.defineProperty(unreadEnvelope, 'kind', {
        configurable: true,
        enumerable: true,
        get() {
          envelopeReads += 1
          throw new Error('setup-cap-envelope-must-stay-unread')
        },
      })
      const controller = createFullRunEffectController({
        setupMessages: [unreadEnvelope],
        clockForReason(reason, current) {
          if (reason === 'setup-origin') {
            return 100
          }
          if (reason === 'setup-dequeue-before-reflection') {
            return sampledClock
          }
          return current + 10
        },
      })
      const result = await runFullController(controller)
      assert.equal(result.ok, true)
      assert.equal(envelopeReads, 0)
      const projection = result.recordProjection
      assert.equal(
        projection.timing.completion.observationCloseReason,
        'setup-cap'
      )
      assert.equal(
        projection.timing.completion.captureWindowState,
        'not-started'
      )
      assert.equal(projection.candidateObserverGate, 'UNPROVEN')
      assert.equal(
        controller.protocolCommands.includes('Runtime.evaluate'),
        false
      )
    })
  }

  await t.test('cleanup-below-deadline', async () => {
    let cleanupOrigin = null
    let cleanupDequeueCount = 0
    const result = await runFullController(createFullRunEffectController({
      clockForReason(reason, current) {
        if (reason === 'cleanup-origin') {
          cleanupOrigin = current + 100
          return cleanupOrigin
        }
        if (reason === 'cleanup-dequeue-before-reflection') {
          cleanupDequeueCount += 1
          return cleanupOrigin + 100 + cleanupDequeueCount
        }
        if (reason === 'cleanup-completion-after-cap-cancel') {
          return cleanupOrigin + 1000
        }
        return current + 10
      },
    }))
    assert.equal(result.ok, true)
    const projection = result.recordProjection
    assert.equal(
      projection.timing.completion.cleanupFinalizeReason,
      'all-steps-terminal'
    )
    assert.equal(projection.stages[9].observationState, 'observed')
    assert.equal(projection.stages[9].receiptOrder, 2)
    assert.equal(projection.stages[9].result, 'match')
    assert.equal(projection.stages[9].relativeMilliseconds, 1000)
    assert.equal(projection.stages[9].timingState, 'measured')
    assert.equal(projection.cleanup.checks[19].result, 'confirmed')
    assert.equal(cleanupDequeueCount > 0, true)
  })

  for (const [label, delta] of [
    ['cleanup-equal-deadline', 60000],
    ['cleanup-above-deadline', 60001],
  ]) {
    await t.test(label, async () => {
      let cleanupOrigin = null
      let cleanupEnvelopeReads = 0
      let replacedCleanupDequeue = false
      const unreadEnvelope = {}
      Object.defineProperty(unreadEnvelope, 'kind', {
        configurable: true,
        enumerable: true,
        get() {
          cleanupEnvelopeReads += 1
          throw new Error('cleanup-cap-envelope-must-stay-unread')
        },
      })
      const controller = createFullRunEffectController({
        clockForReason(reason, current) {
          if (reason === 'cleanup-origin') {
            cleanupOrigin = current + 10
            return cleanupOrigin
          }
          if (reason === 'cleanup-dequeue-before-reflection') {
            return cleanupOrigin + delta
          }
          return current + 10
        },
        settlementForIntent(intent) {
          if (
            !replacedCleanupDequeue &&
            intent.kind === 'observation-dequeue' &&
            intent.payload.phase === 'cleanup'
          ) {
            replacedCleanupDequeue = true
            return { type: 'fulfill', value: unreadEnvelope }
          }
          return null
        },
      })
      const result = await runFullController(controller)
      assert.equal(result.ok, true)
      assert.equal(cleanupEnvelopeReads, 0)
      const projection = result.recordProjection
      assert.equal(
        projection.timing.completion.cleanupFinalizeReason,
        'cleanup-cap'
      )
      assert.equal(projection.stages[9].observationState, 'not-observed')
      assert.equal(projection.stages[9].receiptOrder, null)
      assert.equal(projection.stages[9].relativeMilliseconds, null)
      assert.equal(projection.stages[9].timingState, 'unavailable')
      assert.equal(projection.cleanup.checks[19].result, 'unproven')
    })
  }
})

test('totalisiert Completionclock, Check20, Stage10 und Cleanup-Praezedenz', { concurrency: false }, async (t) => {
  for (const delta of [60000, 60001]) {
    await t.test(`completion-delta-${delta}-is-not-a-cleanup-cap`, async () => {
      let cleanupOrigin = null
      const result = await runFullController(createFullRunEffectController({
        clockForReason(reason, current) {
          if (reason === 'cleanup-origin') {
            cleanupOrigin = current + 10
            return cleanupOrigin
          }
          if (reason === 'cleanup-completion-after-cap-cancel') {
            return cleanupOrigin + delta
          }
          return current + 1
        },
      }))
      assertFoundationResult(result)
      assert.equal(result.ok, true)
      const projection = result.recordProjection
      assert.equal(
        projection.timing.completion.cleanupFinalizeReason,
        'all-steps-terminal'
      )
      assert.equal(projection.cleanup.checks[19].result, 'confirmed')
      assert.equal(projection.stages[9].observationState, 'observed')
      assert.equal(projection.stages[9].receiptOrder, 2)
      assert.equal(projection.stages[9].result, 'match')
      assert.equal(projection.stages[9].relativeMilliseconds, 60000)
      assert.equal(projection.stages[9].timingState, 'at-or-above-cap')
    })
  }

  const invalidCompletionCases = [
    ['negative', () => -1],
    ['backward', (origin) => origin - 1],
    ['nan', () => Number.NaN],
    ['infinity', () => Number.POSITIVE_INFINITY],
    ['non-number', () => 'unsafe-clock-value'],
    ['throw', () => {
      throw new Error('completion-clock-effect-throw')
    }],
    ['rejection', null],
    ['malformed-ack', null],
  ]
  for (const [label, clockValue] of invalidCompletionCases) {
    await t.test(`completion-${label}-is-terminal`, async () => {
      let cleanupOrigin = null
      let targetReached = false
      const controller = createFullRunEffectController({
        clockForReason(reason, current) {
          if (reason === 'cleanup-origin') {
            cleanupOrigin = current + 10
            return cleanupOrigin
          }
          if (reason === 'cleanup-completion-after-cap-cancel') {
            targetReached = true
            return clockValue === null
              ? cleanupOrigin + 100
              : clockValue(cleanupOrigin)
          }
          return current + 1
        },
        settlementForIntent(intent) {
          if (
            intent.kind === 'controller-clock-sample' &&
            intent.payload.reason === 'cleanup-completion-after-cap-cancel'
          ) {
            if (label === 'rejection') {
              return {
                type: 'reject',
                reason: new Error('completion-clock-rejection'),
              }
            }
            if (label === 'malformed-ack') {
              return { type: 'fulfill', value: {} }
            }
          }
          return null
        },
      })
      const result = await runFullController(controller)
      assertFoundationResult(result)
      assert.equal(targetReached, true)
      assert.equal(result.ok, true)
      const projection = result.recordProjection
      assert.equal(
        projection.timing.completion.cleanupFinalizeReason,
        'cleanup-terminal-failure'
      )
      assert.equal(projection.cleanup.result, 'FAIL')
      assert.equal(projection.cleanup.checks[19].result, 'failed')
      assert.equal(projection.stages[9].observationState, 'observed')
      assert.equal(projection.stages[9].receiptOrder, 2)
      assert.equal(projection.stages[9].result, 'mismatch')
      assert.equal(projection.stages[9].relativeMilliseconds, null)
      assert.equal(projection.stages[9].timingState, 'unavailable')
      assert.equal(projection.candidateObserverGate, 'FAIL')
    })
  }

  await t.test('failed-check-dominates-later-cleanup-cap', async () => {
    let cleanupOrigin = null
    let cleanupDequeueCount = 0
    const result = await runFullController(createFullRunEffectController({
      cleanupFact(checkId) {
        return checkId !== 'debugPipeClosed'
      },
      clockForReason(reason, current) {
        if (reason === 'cleanup-origin') {
          cleanupOrigin = current + 10
          return cleanupOrigin
        }
        if (reason === 'cleanup-dequeue-before-reflection') {
          cleanupDequeueCount += 1
          return cleanupDequeueCount < 4
            ? cleanupOrigin + cleanupDequeueCount
            : cleanupOrigin + 60000
        }
        return current + 1
      },
    }))
    assertFoundationResult(result)
    assert.equal(result.ok, true)
    const projection = result.recordProjection
    assert.equal(cleanupDequeueCount, 4)
    assert.equal(
      projection.timing.completion.cleanupFinalizeReason,
      'cleanup-cap'
    )
    assert.equal(
      projection.cleanup.checks.find(
        (check) => check.checkId === 'debugPipeClosed'
      ).result,
      'failed'
    )
    assert.equal(projection.cleanup.checks[19].result, 'unproven')
    assert.equal(projection.cleanup.result, 'FAIL')
    assert.equal(projection.candidateObserverGate, 'FAIL')
  })
})

test('korreliert den Capturecap ohne Controllerdeadline und sendet Evaluate nie erneut', { concurrency: false }, async (t) => {
  await t.test('normale Observationen vor korreliertem C', async () => {
    const controller = createFullRunEffectController()
    const result = await runFullController(controller)
    assert.equal(result.ok, true)
    assert.equal(
      result.recordProjection.timing.completion.observationCloseReason,
      'capture-cap'
    )
    assert.equal(
      result.recordProjection.timing.completion.captureWindowState,
      'elapsed'
    )
    assert.equal(
      controller.protocolCommands.filter(
        (command) => command === 'Runtime.evaluate'
      ).length,
      1
    )
    assert.equal(
      controller.intents.filter(
        (intent) => intent.kind === 'cap-arm' &&
          intent.payload.capKind === 'capture'
      ).length,
      1
    )
  })

  for (const [label, envelope] of [
    ['wrong-cap-kind', {
      kind: 'cap-fired',
      capKind: 'setup',
      armIntentId: 1,
    }],
    ['wrong-arm-intent-id', {
      kind: 'cap-fired',
      capKind: 'capture',
      armIntentId: Number.MAX_SAFE_INTEGER,
    }],
  ]) {
    await t.test(label, async () => {
      const controller = createFullRunEffectController({
        captureMessages: [envelope],
      })
      const result = await runFullController(controller)
      assert.equal(result.ok, true)
      assert.equal(result.recordProjection.candidateObserverGate, 'FAIL')
      assert.equal(
        result.recordProjection.candidateFinding,
        'observer-invalid'
      )
      assert.equal(
        result.recordProjection.timing.completion.observationCloseReason,
        'confirmed-violation'
      )
      assert.equal(
        controller.protocolCommands.filter(
          (command) => command === 'Runtime.evaluate'
        ).length,
        1
      )
    })
  }

  await t.test('duplicate-late-cap-fired-is-cleanup-only', async () => {
    let acceptedCaptureCap = null
    let injectedLateDuplicate = false
    const controller = createFullRunEffectController({
      settlementForIntent(intent, response) {
        if (
          intent.kind === 'observation-dequeue' &&
          intent.payload.phase === 'capture' &&
          response?.kind === 'cap-fired'
        ) {
          acceptedCaptureCap = response
        }
        if (
          acceptedCaptureCap !== null &&
          injectedLateDuplicate === false &&
          intent.kind === 'observation-dequeue' &&
          intent.payload.phase === 'cleanup'
        ) {
          injectedLateDuplicate = true
          return {
            type: 'fulfill',
            value: cloneTree(acceptedCaptureCap),
          }
        }
        return null
      },
    })
    const result = await runFullController(controller)
    assert.equal(result.ok, true)
    assert.equal(injectedLateDuplicate, true)
    assert.equal(
      result.recordProjection.timing.completion.observationCloseReason,
      'capture-cap'
    )
    assert.equal(
      result.recordProjection.timing.completion.cleanupFinalizeReason,
      'cleanup-terminal-failure'
    )
    assert.equal(result.recordProjection.candidateObserverGate, 'FAIL')
    assert.equal(
      controller.protocolCommands.filter(
        (command) => command === 'Runtime.evaluate'
      ).length,
      1
    )
  })
})

test('projiziert Evaluate-Send ohne Reply am Capturecap epistemisch als unknown', { concurrency: false }, async () => {
  const controller = createFullRunEffectController({ captureMessages: [] })
  const result = await runFullController(controller)
  assert.equal(result.ok, true)
  const projection = result.recordProjection
  const evaluateOperation = projection.observer.protocolOperations[3]

  assert.equal(evaluateOperation.command, 'Runtime.evaluate')
  assert.equal(evaluateOperation.observedCountClass, 'one')
  assert.equal(evaluateOperation.result, 'match')
  assert.equal(projection.observer.evaluationSha256, EVALUATION_SHA256)
  assert.equal(projection.observer.controllerEvaluateIntentCount, 'one')
  assert.equal(
    projection.timing.completion.evaluateReplyCountClass,
    'zero'
  )
  assert.equal(projection.observer.mainWorldEvaluationCount, 'unknown')
  assert.equal(projection.observer.transportFactoryCallCount, 'unknown')
  assert.equal(projection.requestBudget.defaultTransportCalls, 'unknown')
  assert.equal(projection.publicSettlement, null)
  assert.equal(projection.timing.completion.productEvidenceComplete, false)
  assert.equal(
    projection.timing.completion.observationCloseReason,
    'capture-cap'
  )
  assert.equal(
    projection.timing.completion.captureWindowState,
    'elapsed'
  )
  assert.equal(
    controller.protocolCommands.filter(
      (command) => command === 'Runtime.evaluate'
    ).length,
    1
  )
})

test('haelt wohlgeformte fremde Capture-Routings bis C aktiv und liest tief nichts', { concurrency: false }, async (t) => {
  for (const entry of [
    {
      label: 'foreign-positive-response-id',
      base: { id: 999 },
    },
    {
      label: 'evaluate-id-foreign-session',
      base: { id: 4, sessionId: 'foreign-valid-session' },
    },
  ]) {
    await t.test(entry.label, async () => {
      let deepReflectionCount = 0
      const routedMessage = new Proxy(entry.base, {
        getOwnPropertyDescriptor(target, key) {
          if (key === 'result' || key === 'error') {
            deepReflectionCount += 1
            throw new Error('foreign-routing-deep-payload-must-stay-unread')
          }
          return Reflect.getOwnPropertyDescriptor(target, key)
        },
      })
      const controller = createFullRunEffectController({
        captureMessages: [createCdpMessage(routedMessage)],
      })
      const result = await runFullController(controller)
      assert.equal(result.ok, true)
      assert.equal(deepReflectionCount, 0)
      const projection = result.recordProjection
      assert.equal(
        projection.timing.completion.observationCloseReason,
        'capture-cap'
      )
      assert.equal(
        projection.timing.completion.captureWindowState,
        'elapsed'
      )
      assert.equal(
        projection.timing.completion.evaluateReplyCountClass,
        'unknown'
      )
      assert.equal(projection.observer.mainWorldEvaluationCount, 'unknown')
      assert.equal(projection.observer.transportFactoryCallCount, 'unknown')
      assert.equal(projection.requestBudget.defaultTransportCalls, 'unknown')
      assert.equal(projection.publicSettlement, null)
      assert.equal(projection.candidateObserverGate, 'UNPROVEN')
      assert.equal(projection.candidateFinding, 'inconclusive')
      assert.equal(
        projection.observer.protocolOperations[3].observedCountClass,
        'one'
      )
      assert.equal(projection.observer.protocolOperations[3].result, 'match')
    })
  }

  for (const entry of [
    {
      label: 'foreign-id-before-accepted-reply-stays-unknown',
      base: { id: 999 },
    },
    {
      label: 'foreign-session-before-accepted-reply-stays-unknown',
      base: { id: 4, sessionId: 'foreign-valid-session' },
    },
  ]) {
    await t.test(entry.label, async () => {
      let deepReflectionCount = 0
      const routedMessage = new Proxy(entry.base, {
        getOwnPropertyDescriptor(target, key) {
          if (key === 'result' || key === 'error') {
            deepReflectionCount += 1
            throw new Error('early-foreign-routing-deep-read')
          }
          return Reflect.getOwnPropertyDescriptor(target, key)
        },
      })
      const acceptedReply = createCdpMessage({
        id: 4,
        sessionId: 'session-adr0035-1',
        result: {
          result: {
            type: 'object',
            value: createMainWorldValue(),
          },
        },
      })
      const result = await runFullController(createFullRunEffectController({
        captureMessages: [createCdpMessage(routedMessage), acceptedReply],
      }))
      assertFoundationResult(result)
      assert.equal(result.ok, true)
      assert.equal(deepReflectionCount, 0)
      const projection = result.recordProjection
      assert.equal(
        projection.timing.completion.evaluateReplyCountClass,
        'unknown'
      )
      assert.equal(projection.observer.mainWorldEvaluationCount, 'unknown')
      assert.equal(projection.observer.transportFactoryCallCount, 'unknown')
      assert.equal(projection.requestBudget.defaultTransportCalls, 'unknown')
      assert.equal(projection.publicSettlement, null)
      assert.equal(
        projection.timing.completion.observationCloseReason,
        'capture-cap'
      )
      assert.equal(projection.candidateObserverGate, 'UNPROVEN')
      assert.equal(projection.candidateFinding, 'inconclusive')
    })
  }

  for (const entry of [
    {
      label: 'capture-missing-id',
      message: () => ({}),
    },
    {
      label: 'capture-accessor-id',
      message() {
        const value = {}
        Object.defineProperty(value, 'id', {
          enumerable: true,
          get() {
            return 4
          },
        })
        return value
      },
    },
    {
      label: 'capture-throwing-id-reflection',
      message: () => new Proxy({}, {
        getOwnPropertyDescriptor(target, key) {
          if (key === 'id') {
            throw new Error('capture-id-reflection')
          }
          return Reflect.getOwnPropertyDescriptor(target, key)
        },
      }),
    },
    {
      label: 'capture-non-safe-id',
      message: () => ({ id: Number.MAX_SAFE_INTEGER + 1 }),
    },
    {
      label: 'evaluate-id-malformed-session',
      message: () => ({ id: 4, sessionId: 7 }),
    },
  ]) {
    await t.test(entry.label, async () => {
      const result = await runFullController(createFullRunEffectController({
        captureMessages: [createCdpMessage(entry.message())],
      }))
      assert.equal(result.ok, true)
      assert.equal(result.recordProjection.candidateObserverGate, 'FAIL')
      assert.equal(
        result.recordProjection.timing.completion.observationCloseReason,
        'confirmed-violation'
      )
      assert.equal(
        result.recordProjection.timing.completion.evaluateReplyCountClass,
        'unknown'
      )
      assert.equal(
        result.recordProjection.observer.mainWorldEvaluationCount,
        'unknown'
      )
      assert.equal(
        result.recordProjection.observer.transportFactoryCallCount,
        'unknown'
      )
      assert.equal(
        result.recordProjection.requestBudget.defaultTransportCalls,
        'unknown'
      )
      assert.equal(result.recordProjection.publicSettlement, null)
    })
  }
})

test('zaehlt korrelierte Evaluate-Kandidaten vor ihrer Inhaltsvalidierung', { concurrency: false }, async (t) => {
  const cases = [
    {
      label: 'normal-error',
      message: createCdpMessage({
        id: 4,
        sessionId: 'session-adr0035-1',
        error: { code: -32000, message: 'synthetic' },
      }),
    },
    {
      label: 'exception-details',
      message: createCdpMessage({
        id: 4,
        sessionId: 'session-adr0035-1',
        result: {
          exceptionDetails: { text: 'synthetic' },
          result: { type: 'object', value: createMainWorldValue() },
        },
      }),
    },
    {
      label: 'invalid-remote-object',
      message: createCdpMessage({
        id: 4,
        sessionId: 'session-adr0035-1',
        result: {
          result: { type: 'string', value: 'not-a-main-world-object' },
        },
      }),
    },
  ]
  for (const entry of cases) {
    await t.test(entry.label, async () => {
      const result = await runFullController(createFullRunEffectController({
        captureMessages: [entry.message],
      }))
      assert.equal(result.ok, true)
      const projection = result.recordProjection
      assert.equal(
        projection.timing.completion.evaluateReplyCountClass,
        'one'
      )
      assert.equal(projection.observer.mainWorldEvaluationCount, 'unknown')
      assert.equal(projection.observer.transportFactoryCallCount, 'unknown')
      assert.equal(projection.requestBudget.defaultTransportCalls, 'unknown')
      assert.equal(projection.publicSettlement, null)
      assert.equal(projection.candidateObserverGate, 'FAIL')
      assert.equal(projection.candidateFinding, 'observer-invalid')
      assert.equal(
        projection.timing.completion.observationCloseReason,
        'confirmed-violation'
      )
      assert.equal(
        projection.observer.protocolOperations[3].observedCountClass,
        'one'
      )
      assert.equal(projection.observer.protocolOperations[3].result, 'match')
    })
  }

  await t.test('second-correlated-candidate-is-multiple', async () => {
    const evaluationReply = () => createCdpMessage({
      id: 4,
      sessionId: 'session-adr0035-1',
      result: {
        result: {
          type: 'object',
          value: createMainWorldValue(),
        },
      },
    })
    const result = await runFullController(createFullRunEffectController({
      captureMessages: [evaluationReply(), evaluationReply()],
    }))
    assert.equal(result.ok, true)
    const projection = result.recordProjection
    assert.equal(
      projection.timing.completion.evaluateReplyCountClass,
      'multiple'
    )
    assert.equal(projection.observer.mainWorldEvaluationCount, 'multiple')
    assert.equal(projection.observer.transportFactoryCallCount, 'unknown')
    assert.equal(projection.requestBudget.defaultTransportCalls, 'unknown')
    assert.equal(projection.publicSettlement, null)
    for (const stageIndex of [1, 7]) {
      assert.equal(projection.stages[stageIndex].observationState, 'ambiguous')
      assert.equal(projection.stages[stageIndex].receiptOrder, null)
      assert.equal(projection.stages[stageIndex].result, 'unproven')
    }
    assert.deepEqual(
      projection.stages
        .filter(
          (stage) => stage.layer === 'javascript-main-world' &&
            stage.observationState === 'observed'
        )
        .map((stage) => stage.receiptOrder),
      []
    )
    assert.equal(
      projection.observer.integrityChecks.find(
        (check) => check.checkId === 'singleMainWorldEvaluationConfirmed'
      ).result,
      'violated'
    )
    assert.equal(projection.candidateObserverGate, 'FAIL')
  })
})

test('setzt nach Evaluate-Send-Rejection oder malformed Ack alle Networkcounts unknown', { concurrency: false }, async (t) => {
  for (const mode of ['rejection', 'malformed-ack']) {
    await t.test(mode, async () => {
      let replaced = false
      const controller = createFullRunEffectController({
        settlementForIntent(intent) {
          if (
            replaced === false &&
            intent.kind === 'protocol-command-send' &&
            intent.payload.command === 'Runtime.evaluate'
          ) {
            replaced = true
            return mode === 'rejection'
              ? { type: 'reject', reason: new Error('evaluate-send-rejected') }
              : { type: 'fulfill', value: Object.freeze({}) }
          }
          return null
        },
      })
      const result = await runFullController(controller)
      assert.equal(result.ok, true)
      assert.equal(replaced, true)
      const projection = result.recordProjection
      const operation = projection.observer.protocolOperations[3]
      assert.equal(operation.observedCountClass, 'unknown')
      assert.equal(operation.result, 'unproven')
      assert.equal(
        projection.timing.completion.evaluateReplyCountClass,
        'unknown'
      )
      assert.equal(projection.observer.mainWorldEvaluationCount, 'unknown')
      assert.equal(projection.observer.transportFactoryCallCount, 'unknown')
      assert.equal(projection.requestBudget.defaultTransportCalls, 'unknown')
      assert.equal(projection.requestBudget.endpointOptions, 'unknown')
      assert.equal(projection.requestBudget.endpointPosts, 'unknown')
      assert.equal(projection.requestBudget.endpointOtherMethods, 'unknown')
      assert.equal(projection.requestBudget.sequence, 'incomplete')
      assert.equal(projection.publicSettlement, null)
      assert.equal(
        projection.timing.completion.observationCloseReason,
        'confirmed-violation'
      )
      assert.equal(
        projection.timing.completion.captureWindowState,
        'truncated'
      )
      assert.equal(projection.candidateObserverGate, 'FAIL')
    })
  }
})

test('trennt sichere fremde von malformed Routings nach akzeptiertem Evaluate-Reply', { concurrency: false }, async (t) => {
  const acceptedReply = () => createCdpMessage({
    id: 4,
    sessionId: 'session-adr0035-1',
    result: {
      result: {
        type: 'object',
        value: createMainWorldValue(),
      },
    },
  })
  const cases = [
    {
      label: 'safe-foreign-id-preserves-one',
      message: createCdpMessage({ id: 999 }),
      malformed: false,
    },
    {
      label: 'safe-foreign-session-preserves-one',
      message: createCdpMessage({
        id: 4,
        sessionId: 'foreign-valid-session',
      }),
      malformed: false,
    },
    {
      label: 'missing-id-invalidates-routing-knowledge',
      message: createCdpMessage({}),
      malformed: true,
    },
    {
      label: 'matched-id-malformed-session-invalidates-routing-knowledge',
      message: createCdpMessage({ id: 4, sessionId: 7 }),
      malformed: true,
    },
  ]
  for (const entry of cases) {
    await t.test(entry.label, async () => {
      const result = await runFullController(createFullRunEffectController({
        captureMessages: [acceptedReply(), entry.message],
      }))
      assert.equal(result.ok, true)
      const projection = result.recordProjection
      assert.equal(
        projection.timing.completion.evaluateReplyCountClass,
        entry.malformed ? 'unknown' : 'one'
      )
      assert.equal(
        projection.observer.mainWorldEvaluationCount,
        entry.malformed ? 'unknown' : 'one'
      )
      assert.equal(
        projection.observer.transportFactoryCallCount,
        entry.malformed ? 'unknown' : 'one'
      )
      assert.equal(
        projection.requestBudget.defaultTransportCalls,
        entry.malformed ? 'unknown' : 'one'
      )
      assert.equal(
        projection.publicSettlement === null,
        entry.malformed
      )
      assert.equal(
        projection.timing.completion.observationCloseReason,
        entry.malformed ? 'confirmed-violation' : 'capture-cap'
      )
      assert.equal(
        projection.candidateObserverGate,
        entry.malformed ? 'FAIL' : 'UNPROVEN'
      )
    })
  }
})

test('haelt O0 gegen alle spaeten Observationklassen unveraendert', { concurrency: false }, async (t) => {
  function observationProjection(projection) {
    const {
      cleanupFinalizeReason,
      cleanupFinalized,
      ...observationCompletion
    } = projection.timing.completion
    return {
      diagnosticRunId: projection.diagnosticRunId,
      observedAt: projection.observedAt,
      timeZone: projection.timeZone,
      historicalEvidence: projection.historicalEvidence,
      replay: projection.replay,
      observer: {
        ...projection.observer,
        protocolOperations:
          projection.observer.protocolOperations.slice(0, 4),
      },
      requestBudget: projection.requestBudget,
      publicSettlement: projection.publicSettlement,
      stages: projection.stages.slice(0, 8),
      timing: {
        ...projection.timing,
        completion: observationCompletion,
      },
      adr0029OverallGate: projection.adr0029OverallGate,
      causeStatus: projection.causeStatus,
    }
  }

  const baselineResult = await runFullController(
    createFullRunEffectController()
  )
  assertFoundationResult(baselineResult)
  assert.equal(baselineResult.ok, true)
  const baselineProjection = baselineResult.recordProjection
  const baselineObservation = observationProjection(baselineProjection)
  const lateMessages = [
    [
      'evaluate-reply',
      createCdpMessage({
        id: 4,
        sessionId: 'session-adr0035-1',
        result: {
          result: {
            type: 'object',
            value: createMainWorldValue({ outcome: 'fulfilled' }),
          },
        },
      }),
    ],
    [
      'network-request',
      createNetworkRequestMessage('late-request', 'POST', 99),
    ],
    [
      'network-response',
      createNetworkResponseMessage('post-adr0035-1', 201, 99),
    ],
    [
      'network-terminal',
      createNetworkTerminalMessage('post-adr0035-1', 99, true),
    ],
    [
      'get-targets-reply',
      createCdpMessage({ id: 1, result: { targetInfos: [] } }),
    ],
    [
      'attach-reply',
      createCdpMessage({ id: 2, result: { sessionId: 'late-session' } }),
    ],
    [
      'enable-reply',
      createCdpMessage({
        id: 3,
        sessionId: 'session-adr0035-1',
        result: {},
      }),
    ],
    [
      'capture-cap-fired',
      { kind: 'cap-fired', capKind: 'capture', armIntentId: 1 },
    ],
    ['connection-close', { kind: 'connection-closed' }],
  ]

  for (const [label, lateMessage] of lateMessages) {
    await t.test(label, async () => {
      const result = await runFullController(createFullRunEffectController({
        cleanupPrefaceMessages: [lateMessage],
      }))
      assertFoundationResult(result)
      assert.equal(result.ok, true)
      const projection = result.recordProjection
      assert.deepEqual(
        observationProjection(projection),
        baselineObservation
      )
      assert.notDeepEqual(projection.cleanup, baselineProjection.cleanup)
      assert.equal(projection.cleanup.observationClosedBeforeCleanup, true)
      assert.equal(projection.cleanup.result, 'FAIL')
      assert.equal(projection.candidateObserverGate, 'FAIL')
      assert.equal(projection.candidateFinding, 'observer-invalid')
    })
  }
})

test('totalisiert Cleanup-CDP-Antworten, Reihenfolgen und Reflectionfehler', { concurrency: false }, async (t) => {
  for (const responseOrder of ['send-order', 'reverse']) {
    await t.test(`disable-detach-${responseOrder}`, async () => {
      const controller = createFullRunEffectController({
        cleanupProtocolResponseOrder: responseOrder,
      })
      const result = await runFullController(controller)
      assert.equal(result.ok, true)
      const projection = result.recordProjection
      assert.equal(
        projection.cleanup.checks.find(
          (check) => check.checkId === 'networkDomainClosed'
        ).result,
        'confirmed'
      )
      assert.equal(
        projection.cleanup.checks.find(
          (check) => check.checkId === 'targetSessionClosed'
        ).result,
        'confirmed'
      )
      assert.equal(
        projection.timing.completion.cleanupFinalizeReason,
        'all-steps-terminal'
      )
      assert.equal(projection.stages[9].result, 'match')
      assert.equal(projection.cleanup.checks[19].result, 'confirmed')
    })
  }

  await t.test('known-open-id-ordinary-malformed-is-recoverable', async () => {
    let replaced = false
    const controller = createFullRunEffectController({
      settlementForIntent(intent, response) {
        if (
          replaced === false &&
          intent.kind === 'observation-dequeue' &&
          intent.payload.phase === 'cleanup' &&
          response?.kind === 'cdp-message'
        ) {
          replaced = true
          return {
            type: 'fulfill',
            value: createCdpMessage({
              ...response.value,
              result: 'ordinary-malformed-result',
            }),
          }
        }
        return null
      },
    })
    const result = await runFullController(controller)
    assert.equal(result.ok, true)
    assert.equal(replaced, true)
    const projection = result.recordProjection
    assert.equal(
      projection.cleanup.checks.find(
        (check) => check.checkId === 'networkDomainClosed'
      ).result,
      'failed'
    )
    assert.equal(
      projection.cleanup.checks.find(
        (check) => check.checkId === 'targetSessionClosed'
      ).result,
      'confirmed'
    )
    assert.equal(
      projection.timing.completion.cleanupFinalizeReason,
      'all-steps-terminal'
    )
    assert.equal(projection.stages[9].result, 'match')
    assert.equal(projection.cleanup.checks[19].result, 'confirmed')
    assert.equal(projection.candidateObserverGate, 'FAIL')
  })

  for (const reflectionPoint of [
    'sessionId',
    'error',
    'result',
    'nested-empty-result',
  ]) {
    await t.test(`known-open-id-reflectionthrow-${reflectionPoint}`, async () => {
      let replaced = false
      let reflectionCount = 0
      const controller = createFullRunEffectController({
        settlementForIntent(intent, response) {
          if (
            replaced === false &&
            intent.kind === 'observation-dequeue' &&
            intent.payload.phase === 'cleanup' &&
            response?.kind === 'cdp-message'
          ) {
            replaced = true
            let message
            if (reflectionPoint === 'nested-empty-result') {
              const throwingResult = new Proxy({}, {
                getPrototypeOf() {
                  reflectionCount += 1
                  throw new Error('nested-cleanup-result-reflection')
                },
              })
              message = { ...response.value, result: throwingResult }
            } else {
              message = new Proxy(response.value, {
                getOwnPropertyDescriptor(target, key) {
                  if (key === reflectionPoint) {
                    reflectionCount += 1
                    throw new Error(`cleanup-${reflectionPoint}-reflection`)
                  }
                  return Reflect.getOwnPropertyDescriptor(target, key)
                },
              })
            }
            return {
              type: 'fulfill',
              value: createCdpMessage(message),
            }
          }
          return null
        },
      })
      const result = await runFullController(controller)
      assert.equal(result.ok, true)
      assert.equal(replaced, true)
      assert.equal(reflectionCount, 1)
      const projection = result.recordProjection
      assert.equal(
        projection.timing.completion.cleanupFinalizeReason,
        'cleanup-terminal-failure'
      )
      assert.equal(projection.stages[9].result, 'mismatch')
      assert.equal(projection.cleanup.checks[19].result, 'failed')
      assert.equal(projection.candidateObserverGate, 'FAIL')
      assert.equal(projection.candidateFinding, 'observer-invalid')
    })
  }
})

test('bewahrt Cleanup-Purpose und offene IDs bei sicher fremdem Routing', { concurrency: false }, async (t) => {
  await t.test('safe-wrong-id-during-cleanup-fact-retains-purpose', async () => {
    let replaced = false
    let deepReflectionCount = 0
    const wrongPurposeMessage = createCdpMessage(new Proxy(
      { id: 999 },
      {
        getOwnPropertyDescriptor(target, key) {
          if (key === 'result' || key === 'error') {
            deepReflectionCount += 1
            throw new Error('wrong-purpose-cleanup-payload-must-stay-unread')
          }
          return Reflect.getOwnPropertyDescriptor(target, key)
        },
      }
    ))
    const controller = createFullRunEffectController({
      settlementForIntent(intent, response) {
        if (
          replaced === false &&
          intent.kind === 'observation-dequeue' &&
          intent.payload.phase === 'cleanup' &&
          response?.kind === 'cleanup-fact'
        ) {
          replaced = true
          return { type: 'fulfill', value: wrongPurposeMessage }
        }
        return null
      },
    })
    const result = await runFullController(controller)
    assert.equal(result.ok, true)
    assert.equal(replaced, true)
    assert.equal(deepReflectionCount, 0)
    assert.equal(controller.cleanupStepIds.length, 12)
    assert.equal(
      result.recordProjection.cleanup.checks.find(
        (check) => check.checkId === 'debugPipeClosed'
      ).result,
      'unproven'
    )
    assert.equal(
      result.recordProjection.timing.completion.cleanupFinalizeReason,
      'all-steps-terminal'
    )
    assert.equal(result.recordProjection.cleanup.result, 'FAIL')
  })

  for (const entry of [
    ['missing-id', {}],
    ['unsafe-id', { id: Number.MAX_SAFE_INTEGER + 1 }],
    ['accessor-id', (() => {
      const value = {}
      Object.defineProperty(value, 'id', {
        enumerable: true,
        get() {
          return 999
        },
      })
      return value
    })()],
    ['throwing-id-reflection', new Proxy({}, {
      getOwnPropertyDescriptor(target, key) {
        if (key === 'id') {
          throw new Error('cleanup-fact-id-reflection')
        }
        return Reflect.getOwnPropertyDescriptor(target, key)
      },
    })],
  ]) {
    await t.test(`cleanup-fact-${entry[0]}-is-terminal`, async () => {
      let replaced = false
      const controller = createFullRunEffectController({
        settlementForIntent(intent, response) {
          if (
            replaced === false &&
            intent.kind === 'observation-dequeue' &&
            intent.payload.phase === 'cleanup' &&
            response?.kind === 'cleanup-fact'
          ) {
            replaced = true
            return {
              type: 'fulfill',
              value: createCdpMessage(entry[1]),
            }
          }
          return null
        },
      })
      const result = await runFullController(controller)
      assert.equal(result.ok, true)
      assert.equal(replaced, true)
      assert.equal(
        result.recordProjection.timing.completion.cleanupFinalizeReason,
        'cleanup-terminal-failure'
      )
      assert.equal(result.recordProjection.stages[9].result, 'mismatch')
      assert.equal(result.recordProjection.cleanup.checks[19].result, 'failed')
    })
  }

  for (const entry of [
    ['disable-foreign-session', 5, 'foreign-cleanup-session'],
    ['detach-foreign-outer-session', 6, 'foreign-cleanup-session'],
  ]) {
    await t.test(entry[0], async () => {
      let deepReflectionCount = 0
      const foreignMessage = createCdpMessage(new Proxy(
        { id: entry[1], sessionId: entry[2] },
        {
          getOwnPropertyDescriptor(target, key) {
            if (key === 'result' || key === 'error') {
              deepReflectionCount += 1
              throw new Error('foreign-cleanup-session-deep-unread')
            }
            return Reflect.getOwnPropertyDescriptor(target, key)
          },
        }
      ))
      const result = await runFullController(createFullRunEffectController({
        cleanupPrefaceMessages: [foreignMessage],
      }))
      assert.equal(result.ok, true)
      assert.equal(deepReflectionCount, 0)
      const projection = result.recordProjection
      assert.equal(
        projection.cleanup.checks.find(
          (check) => check.checkId === 'networkDomainClosed'
        ).result,
        'confirmed'
      )
      assert.equal(
        projection.cleanup.checks.find(
          (check) => check.checkId === 'targetSessionClosed'
        ).result,
        'confirmed'
      )
      assert.equal(
        projection.timing.completion.cleanupFinalizeReason,
        'all-steps-terminal'
      )
      assert.equal(projection.cleanup.result, 'FAIL')
    })
  }

  for (const entry of [
    ['disable-malformed-session', createCdpMessage({ id: 5, sessionId: 7 })],
    ['detach-accessor-session', createCdpMessage((() => {
      const value = { id: 6 }
      Object.defineProperty(value, 'sessionId', {
        enumerable: true,
        get() {
          return 'foreign-cleanup-session'
        },
      })
      return value
    })())],
  ]) {
    await t.test(`${entry[0]}-is-terminal`, async () => {
      const result = await runFullController(createFullRunEffectController({
        cleanupPrefaceMessages: [entry[1]],
      }))
      assert.equal(result.ok, true)
      assert.equal(
        result.recordProjection.timing.completion.cleanupFinalizeReason,
        'cleanup-terminal-failure'
      )
      assert.equal(result.recordProjection.stages[9].result, 'mismatch')
      assert.equal(result.recordProjection.cleanup.checks[19].result, 'failed')
    })
  }
})

test('zaehlt jeden neuen Endpointrequest getrennt und macht den zweiten POST sticky', { concurrency: false }, async (t) => {
  const firstOptionsThenPost = [
    createNetworkRequestMessage('count-options-1', 'OPTIONS', 10),
    createNetworkRequestMessage('count-post-1', 'POST', 10.1),
  ]
  const cases = [
    {
      label: 'third-options',
      messages: [
        ...firstOptionsThenPost,
        createNetworkRequestMessage('count-options-2', 'OPTIONS', 10.2),
      ],
      expected: ['multiple', 'one', 'zero'],
      gate: 'UNPROVEN',
    },
    {
      label: 'third-post',
      messages: [
        ...firstOptionsThenPost,
        createNetworkRequestMessage('count-post-2', 'POST', 10.2),
      ],
      expected: ['one', 'multiple', 'zero'],
      gate: 'FAIL',
    },
    {
      label: 'third-other',
      messages: [
        ...firstOptionsThenPost,
        createNetworkRequestMessage('count-put-1', 'PUT', 10.2),
      ],
      expected: ['one', 'one', 'one'],
      gate: 'UNPROVEN',
    },
    {
      label: 'second-post-after-first-post',
      messages: [
        createNetworkRequestMessage('count-post-first', 'POST', 10),
        createNetworkRequestMessage('count-post-second', 'POST', 10.1),
      ],
      expected: ['zero', 'multiple', 'zero'],
      gate: 'FAIL',
    },
  ]

  for (const entry of cases) {
    await t.test(entry.label, async () => {
      const result = await runFullController(createFullRunEffectController({
        captureMessages: entry.messages,
      }))
      assert.equal(result.ok, true)
      const projection = result.recordProjection
      assert.deepEqual([
        projection.requestBudget.endpointOptions,
        projection.requestBudget.endpointPosts,
        projection.requestBudget.endpointOtherMethods,
      ], entry.expected)
      assert.equal(projection.requestBudget.sequence, 'other')
      assert.equal(projection.candidateObserverGate, entry.gate)
      assert.equal(
        projection.candidateFinding,
        entry.gate === 'FAIL' ? 'observer-invalid' : 'inconclusive'
      )
      assert.equal(
        projection.timing.completion.observationCloseReason,
        entry.gate === 'FAIL' ? 'confirmed-violation' : 'capture-cap'
      )
    })
  }
})

test('totalisiert alle zwoelf externen Cleanupfacts ueber sechs Settlementklassen', { concurrency: false }, async (t) => {
  for (const checkId of EXTERNAL_CLEANUP_FACT_IDS) {
    for (const mode of [
      'true',
      'false',
      'reject',
      'malformed',
      'unobservable',
      'pending',
    ]) {
      await t.test(`${checkId}/${mode}`, async () => {
        const pendingDeferred = createCleanDeferred()
        let pendingReachedResolve
        const pendingReached = new Promise((resolve) => {
          pendingReachedResolve = resolve
        })
        const rejectionReason = Object.freeze({ checkId, mode })
        const controller = createFullRunEffectController({
          cleanupFact(currentCheckId) {
            if (currentCheckId !== checkId) {
              return true
            }
            return mode !== 'false'
          },
          settlementForIntent(intent) {
            if (
              intent.kind !== 'cleanup-step' ||
              intent.payload.checkId !== checkId
            ) {
              return null
            }
            if (mode === 'reject') {
              return { type: 'reject', reason: rejectionReason }
            }
            if (mode === 'malformed') {
              return { type: 'fulfill', value: Object.freeze({}) }
            }
            if (mode === 'unobservable') {
              return {
                type: 'candidate',
                promise: Object.freeze({ then() {} }),
              }
            }
            if (mode === 'pending') {
              pendingReachedResolve()
              return { type: 'candidate', promise: pendingDeferred.promise }
            }
            return null
          },
        })
        const observer = createBrowserSyncTransportRuntimeDiagnosticObserver({
          effectPort: controller.effectPort,
          runBinding: createValidRunBinding(),
        })
        const owner = observer.run()

        if (mode === 'pending') {
          let ownerSettled = false
          Reflect.apply(Promise.prototype.then, owner, [
            () => {
              ownerSettled = true
            },
            () => {
              ownerSettled = true
            },
          ])
          await pendingReached
          await Promise.resolve()
          await Promise.resolve()
          await Promise.resolve()
          assert.equal(ownerSettled, false)
          assert.equal(controller.cleanupStepIds.at(-1), checkId)
          assert.equal(
            controller.cleanupStepIds.length,
            EXTERNAL_CLEANUP_FACT_IDS.indexOf(checkId) + 1
          )
          return
        }

        const result = await owner
        assertFoundationResult(result)
        if (mode === 'unobservable') {
          assert.equal(result.ok, true)
          const projection = result.recordProjection
          assert.equal(
            projection.timing.completion.cleanupFinalizeReason,
            'cleanup-terminal-failure'
          )
          assert.equal(projection.stages[9].result, 'mismatch')
          assert.equal(projection.cleanup.checks[19].result, 'failed')
          assert.equal(projection.cleanup.result, 'FAIL')
          assert.equal(projection.candidateObserverGate, 'FAIL')
          assert.equal(controller.cleanupStepIds.at(-1), checkId)
          assert.equal(
            controller.cleanupStepIds.length,
            EXTERNAL_CLEANUP_FACT_IDS.indexOf(checkId) + 1
          )
          return
        }

        assert.equal(result.ok, true)
        const projection = result.recordProjection
        const check = projection.cleanup.checks.find(
          (candidate) => candidate.checkId === checkId
        )
        assert.notEqual(check, undefined)
        assert.equal(
          check.result,
          mode === 'true' ? 'unproven' : 'failed'
        )
        assert.equal(controller.cleanupStepIds.length, 12)
        assert.equal(projection.cleanup.checks[19].result, 'confirmed')
        assert.equal(
          projection.timing.completion.cleanupFinalizeReason,
          'all-steps-terminal'
        )
        assert.equal(
          projection.candidateObserverGate,
          mode === 'true' ? 'UNPROVEN' : 'FAIL'
        )
      })
    }
  }
})

test('begrenzt Dequeues bei 128 und trennt den 129. Wert vor und nach O0', { concurrency: false }, async (t) => {
  function benignCaptureMessages(count) {
    return Array.from({ length: count }, (_, index) => createCdpMessage({
      method: 'Network.requestWillBeSent',
      sessionId: 'session-adr0035-1',
      params: {
        requestId: `benign-off-endpoint-${index}`,
        request: {
          url: 'http://127.0.0.1:9999/not-the-diagnostic-endpoint',
          method: 'GET',
        },
      },
    }))
  }

  await t.test('128th-capture-dequeue-is-accepted', async () => {
    const controller = createFullRunEffectController({
      captureMessages: benignCaptureMessages(124),
    })
    const result = await runFullController(controller)
    assert.equal(result.ok, true)
    const projection = result.recordProjection
    assert.equal(
      projection.timing.completion.observationCloseReason,
      'capture-cap'
    )
    assert.equal(
      projection.timing.completion.captureWindowState,
      'elapsed'
    )
    assert.equal(
      controller.intents.filter(
        (intent) => intent.kind === 'observation-dequeue' &&
          intent.payload.phase !== 'cleanup'
      ).length,
      128
    )
  })

  await t.test('129th-before-o0-is-unread-and-sticky-v', async () => {
    let reflectionCount = 0
    const unread129th = new Proxy({}, {
      getPrototypeOf() {
        reflectionCount += 1
        throw new Error('129th-pre-o0-envelope-must-stay-unread')
      },
    })
    const controller = createFullRunEffectController({
      captureMessages: [
        ...benignCaptureMessages(125),
        unread129th,
      ],
    })
    const result = await runFullController(controller)
    assert.equal(result.ok, true)
    assert.equal(reflectionCount, 0)
    const projection = result.recordProjection
    assert.equal(
      projection.timing.completion.observationCloseReason,
      'confirmed-violation'
    )
    assert.equal(
      projection.timing.completion.captureWindowState,
      'truncated'
    )
    assert.equal(projection.candidateObserverGate, 'FAIL')
    assert.equal(projection.candidateFinding, 'observer-invalid')
  })

  await t.test('129th-post-o0-only-fails-cleanup', async () => {
    let cleanupEnvelopeReflectionCount = 0
    let replaced = false
    const unreadCleanupEnvelope = new Proxy({}, {
      getPrototypeOf() {
        cleanupEnvelopeReflectionCount += 1
        throw new Error('129th-post-o0-envelope-must-stay-unread')
      },
    })
    const controller = createFullRunEffectController({
      captureMessages: benignCaptureMessages(124),
      settlementForIntent(intent) {
        if (
          replaced === false &&
          intent.kind === 'observation-dequeue' &&
          intent.payload.phase === 'cleanup'
        ) {
          replaced = true
          return { type: 'fulfill', value: unreadCleanupEnvelope }
        }
        return null
      },
    })
    const result = await runFullController(controller)
    assert.equal(result.ok, true)
    assert.equal(replaced, true)
    assert.equal(cleanupEnvelopeReflectionCount, 0)
    const projection = result.recordProjection
    assert.equal(
      projection.timing.completion.observationCloseReason,
      'capture-cap'
    )
    assert.equal(
      projection.timing.completion.captureWindowState,
      'elapsed'
    )
    assert.equal(
      projection.timing.completion.cleanupFinalizeReason,
      'cleanup-terminal-failure'
    )
    assert.equal(projection.stages[9].result, 'mismatch')
    assert.equal(projection.cleanup.checks[19].result, 'failed')
    assert.equal(projection.candidateObserverGate, 'FAIL')
  })
})

test('trennt Setup-Routing ohne Kandidat, unkorreliert, fremde Session und malformed', { concurrency: false }, async (t) => {
  const normalSetup = () => createSetupMessagesForTargets([{
    targetId: 'target-adr0035-1',
    type: 'page',
    url: TOP_LEVEL_URL,
    attached: false,
  }])

  await t.test('cdp-without-id-is-not-an-answer-candidate', async () => {
    const controller = createFullRunEffectController({
      setupMessages: [createCdpMessage({ method: 'Target.targetCreated' }), ...normalSetup()],
    })
    const result = await runFullController(controller)
    assert.equal(result.ok, true)
    const projection = result.recordProjection
    assert.equal(projection.observer.protocolOperations[0].observedCountClass, 'one')
    assert.equal(projection.observer.protocolOperations[0].result, 'match')
    assert.equal(
      controller.protocolCommands.filter(
        (command) => command === 'Target.getTargets'
      ).length,
      1
    )
    assert.equal(
      projection.timing.completion.observationCloseReason,
      'capture-cap'
    )
  })

  await t.test('well-formed-unmapped-id-is-u', async () => {
    const controller = createFullRunEffectController({
      setupMessages: [createCdpMessage({ id: 999, result: {} })],
    })
    const result = await runFullController(controller)
    assert.equal(result.ok, true)
    const projection = result.recordProjection
    assert.equal(
      projection.timing.completion.observationCloseReason,
      'setup-terminal-unproven'
    )
    assert.equal(projection.candidateObserverGate, 'UNPROVEN')
    assert.equal(projection.candidateFinding, 'inconclusive')
    assert.equal(projection.observer.protocolOperations[0].observedCountClass, 'one')
    assert.equal(projection.observer.protocolOperations[0].result, 'match')
    assert.equal(controller.protocolCommands.includes('Runtime.evaluate'), false)
  })

  await t.test('network-enable-foreign-valid-session-is-u', async () => {
    const setupMessages = normalSetup()
    setupMessages[2] = createCdpMessage({
      id: 3,
      sessionId: 'foreign-valid-session',
      result: {},
    })
    const result = await runFullController(createFullRunEffectController({
      setupMessages,
    }))
    assert.equal(result.ok, true)
    const projection = result.recordProjection
    assert.equal(
      projection.timing.completion.observationCloseReason,
      'setup-terminal-unproven'
    )
    assert.equal(projection.candidateObserverGate, 'UNPROVEN')
    assert.equal(projection.observer.protocolOperations[2].observedCountClass, 'one')
    assert.equal(projection.observer.protocolOperations[2].result, 'match')
  })

  for (const entry of [
    {
      label: 'accessor-id',
      envelope() {
        const message = {}
        Object.defineProperty(message, 'id', {
          enumerable: true,
          get() {
            return 1
          },
        })
        return createCdpMessage(message)
      },
    },
    {
      label: 'non-safe-id',
      envelope: () => createCdpMessage({
        id: Number.MAX_SAFE_INTEGER + 1,
        result: {},
      }),
    },
    {
      label: 'malformed-enable-session',
      setupPrefix: () => normalSetup().slice(0, 2),
      envelope: () => createCdpMessage({ id: 3, sessionId: 7, result: {} }),
    },
  ]) {
    await t.test(entry.label, async () => {
      const setupMessages = [
        ...(entry.setupPrefix?.() ?? []),
        entry.envelope(),
      ]
      const result = await runFullController(createFullRunEffectController({
        setupMessages,
      }))
      assert.equal(result.ok, true)
      assert.equal(result.recordProjection.candidateObserverGate, 'FAIL')
      assert.equal(
        result.recordProjection.candidateFinding,
        'observer-invalid'
      )
      assert.equal(
        result.recordProjection.timing.completion.observationCloseReason,
        'confirmed-violation'
      )
    })
  }
})

test('leitet partielle Target- und Network-Ressourcen ohne erfundene Schliessung ab', { concurrency: false }, async (t) => {
  const target = {
    targetId: 'target-adr0035-1',
    type: 'page',
    url: TOP_LEVEL_URL,
    attached: false,
  }
  const getTargets = createCdpMessage({
    id: 1,
    result: { targetInfos: [target] },
  })
  const attach = createCdpMessage({
    id: 2,
    result: { sessionId: 'session-adr0035-1' },
  })
  const closed = { kind: 'connection-closed' }
  const cleanupResult = (projection, checkId) => projection.cleanup.checks.find(
    (check) => check.checkId === checkId
  ).result

  await t.test('attach-and-enable-safely-never-sent', async () => {
    const result = await runFullController(createFullRunEffectController({
      targetInfos: [],
    }))
    assert.equal(result.ok, true)
    const projection = result.recordProjection
    assert.equal(cleanupResult(projection, 'targetSessionClosed'), 'confirmed')
    assert.equal(cleanupResult(projection, 'networkDomainClosed'), 'confirmed')
    for (const index of [1, 2, 4, 5]) {
      assert.equal(
        projection.observer.protocolOperations[index].observedCountClass,
        'zero'
      )
      assert.equal(projection.observer.protocolOperations[index].result, 'match')
    }
  })

  await t.test('attach-sent-but-no-session-does-not-confirm-session', async () => {
    const result = await runFullController(createFullRunEffectController({
      setupMessages: [getTargets, closed],
    }))
    assert.equal(result.ok, true)
    const projection = result.recordProjection
    assert.equal(cleanupResult(projection, 'targetSessionClosed'), 'unproven')
    assert.equal(cleanupResult(projection, 'networkDomainClosed'), 'confirmed')
    assert.equal(
      projection.observer.protocolOperations[1].observedCountClass,
      'one'
    )
    assert.equal(projection.observer.protocolOperations[1].result, 'match')
    assert.equal(
      projection.observer.protocolOperations[5].observedCountClass,
      'zero'
    )
    assert.equal(projection.observer.protocolOperations[5].result, 'unproven')
    assert.equal(
      projection.observer.protocolOperations[4].observedCountClass,
      'zero'
    )
    assert.equal(projection.observer.protocolOperations[4].result, 'match')
  })

  await t.test('connection-close-after-enable-confirms-neither-resource', async () => {
    const result = await runFullController(createFullRunEffectController({
      setupMessages: [getTargets, attach, closed],
    }))
    assert.equal(result.ok, true)
    const projection = result.recordProjection
    assert.equal(cleanupResult(projection, 'targetSessionClosed'), 'unproven')
    assert.equal(cleanupResult(projection, 'networkDomainClosed'), 'unproven')
    assert.equal(
      projection.observer.protocolOperations[2].observedCountClass,
      'one'
    )
    assert.equal(projection.observer.protocolOperations[2].result, 'match')
    for (const index of [4, 5]) {
      assert.equal(
        projection.observer.protocolOperations[index].observedCountClass,
        'zero'
      )
      assert.equal(
        projection.observer.protocolOperations[index].result,
        'unproven'
      )
    }
  })

  await t.test('attach-send-rejection-is-unknown-and-portless', async () => {
    let rejected = false
    const controller = createFullRunEffectController({
      settlementForIntent(intent) {
        if (
          rejected === false &&
          intent.kind === 'protocol-command-send' &&
          intent.payload.command === 'Target.attachToTarget'
        ) {
          rejected = true
          return { type: 'reject', reason: new Error('synthetic-attach-reject') }
        }
        return null
      },
    })
    const result = await runFullController(controller)
    assert.equal(result.ok, true)
    assert.equal(rejected, true)
    const projection = result.recordProjection
    assert.equal(
      projection.observer.protocolOperations[1].observedCountClass,
      'unknown'
    )
    assert.equal(projection.observer.protocolOperations[1].result, 'unproven')
    assert.equal(cleanupResult(projection, 'targetSessionClosed'), 'unproven')
    assert.equal(
      projection.observer.protocolOperations[5].observedCountClass,
      'zero'
    )
    assert.equal(projection.observer.protocolOperations[5].result, 'unproven')
  })
})

test('leitet Target- und Session-Widersprueche nur aus verschiedenen gueltigen Bindungen ab', { concurrency: false }, async (t) => {
  const targetInfo = (targetId) => ({
    targetId,
    type: 'page',
    url: TOP_LEVEL_URL,
    attached: false,
  })
  const getTargetsReply = (targetId) => createCdpMessage({
    id: 1,
    result: { targetInfos: [targetInfo(targetId)] },
  })
  const attachReply = (sessionId) => createCdpMessage({
    id: 2,
    result: { sessionId },
  })
  const enableReply = (sessionId = 'session-adr0035-1') => createCdpMessage({
    id: 3,
    sessionId,
    result: {},
  })
  const integrity = (projection) => projection.observer.integrityChecks.find(
    (check) => check.checkId === 'singleTargetAndSessionConfirmed'
  )

  for (const entry of [
    {
      label: 'get-targets-same-binding',
      setupMessages: [
        getTargetsReply('target-adr0035-1'),
        getTargetsReply('target-adr0035-1'),
      ],
      expectedIntegrity: 'unproven',
      expectedGate: 'UNPROVEN',
      expectedTargetProfile: 'unknown',
      operationIndex: 0,
    },
    {
      label: 'get-targets-different-binding',
      setupMessages: [
        getTargetsReply('target-adr0035-1'),
        getTargetsReply('target-adr0035-2'),
      ],
      expectedIntegrity: 'violated',
      expectedGate: 'FAIL',
      expectedTargetProfile: 'unknown',
      operationIndex: 0,
    },
    {
      label: 'attach-same-session',
      setupMessages: [
        getTargetsReply('target-adr0035-1'),
        attachReply('session-adr0035-1'),
        attachReply('session-adr0035-1'),
      ],
      expectedIntegrity: 'unproven',
      expectedGate: 'UNPROVEN',
      expectedTargetProfile: 'single-goldendawn-top-level',
      operationIndex: 1,
    },
    {
      label: 'attach-different-session',
      setupMessages: [
        getTargetsReply('target-adr0035-1'),
        attachReply('session-adr0035-1'),
        attachReply('session-adr0035-2'),
      ],
      expectedIntegrity: 'violated',
      expectedGate: 'FAIL',
      expectedTargetProfile: 'single-goldendawn-top-level',
      operationIndex: 1,
    },
  ]) {
    await t.test(entry.label, async () => {
      const result = await runFullController(createFullRunEffectController({
        setupMessages: entry.setupMessages,
      }))
      assert.equal(result.ok, true)
      const projection = result.recordProjection
      assert.equal(
        projection.observer.targetProfile,
        entry.expectedTargetProfile
      )
      assert.equal(integrity(projection).result, entry.expectedIntegrity)
      assert.equal(projection.candidateObserverGate, entry.expectedGate)
      assert.equal(
        projection.candidateFinding,
        entry.expectedGate === 'FAIL' ? 'observer-invalid' : 'inconclusive'
      )
      assert.equal(
        projection.observer.interferenceObservation,
        entry.expectedIntegrity === 'violated'
          ? 'contract-visible-detected'
          : 'unknown'
      )
      assert.equal(
        projection.observer.protocolOperations[entry.operationIndex]
          .observedCountClass,
        'one'
      )
      assert.equal(
        projection.observer.protocolOperations[entry.operationIndex].result,
        'match'
      )
      assert.equal(
        projection.timing.completion.observationCloseReason,
        'setup-terminal-unproven'
      )
    })
  }

  for (const entry of [
    {
      label: 'capture-get-targets-different-binding',
      message: getTargetsReply('target-adr0035-2'),
      expectedIntegrity: 'violated',
      expectedGate: 'FAIL',
      expectedTargetProfile: 'unknown',
      operationIndex: 0,
    },
    {
      label: 'capture-enable-same-session',
      message: enableReply(),
      expectedIntegrity: 'unproven',
      expectedGate: 'UNPROVEN',
      expectedTargetProfile: 'single-goldendawn-top-level',
      operationIndex: 2,
    },
    {
      label: 'capture-enable-foreign-session',
      message: enableReply('session-adr0035-foreign'),
      expectedIntegrity: 'unproven',
      expectedGate: 'UNPROVEN',
      expectedTargetProfile: 'single-goldendawn-top-level',
      operationIndex: 2,
    },
  ]) {
    await t.test(entry.label, async () => {
      const result = await runFullController(createFullRunEffectController({
        captureMessages: [entry.message],
      }))
      assert.equal(result.ok, true)
      const projection = result.recordProjection
      assert.equal(
        projection.observer.targetProfile,
        entry.expectedTargetProfile
      )
      assert.equal(integrity(projection).result, entry.expectedIntegrity)
      assert.equal(projection.candidateObserverGate, entry.expectedGate)
      assert.equal(
        projection.observer.protocolOperations[entry.operationIndex]
          .observedCountClass,
        'one'
      )
      assert.equal(
        projection.observer.protocolOperations[entry.operationIndex].result,
        'match'
      )
      assert.equal(
        projection.timing.completion.observationCloseReason,
        'capture-cap'
      )
    })
  }

  await t.test('capture-enable-malformed-is-v-with-one-send', async () => {
    const result = await runFullController(createFullRunEffectController({
      captureMessages: [enableReply(7)],
    }))
    assert.equal(result.ok, true)
    const projection = result.recordProjection
    assert.equal(projection.candidateObserverGate, 'FAIL')
    assert.equal(
      projection.timing.completion.observationCloseReason,
      'confirmed-violation'
    )
    assert.equal(
      projection.observer.protocolOperations[2].observedCountClass,
      'one'
    )
    assert.equal(projection.observer.protocolOperations[2].result, 'match')
  })
})

test('belegt I1-bis-I8 und die DIVERGED-vor-UNPROVEN-Replaypraezedenz', { concurrency: false }, async (t) => {
  const invariantCases = [
    ['I1-frontend-url-origin', 36, 'http://127.0.0.1:5173/other'],
    ['I2-transport-url-components', 44, 'http://127.0.0.1:8787/other'],
    ['I3-loopback-and-port-binding', 50, 'localhost'],
    ['I4-allowed-origin-relation', 53, 'http://127.0.0.1:5174'],
    ['I5-transport-gateway-endpoint', 55, 'http://127.0.0.1:8787/other'],
  ]

  await t.test('all-eight-match-or-confirmed', async () => {
    const result = await runFullController(createFullRunEffectController())
    assert.equal(result.ok, true)
    assert.equal(result.recordProjection.replay.equivalence.result, 'EQUIVALENT')
    assert.equal(
      result.recordProjection.replay.equivalence
        .noUnexplainedCausalDeviation,
      'confirmed'
    )
    assert.equal(
      result.recordProjection.replay.equivalence.comparisons.length,
      59
    )
  })

  for (const [label, operandIndex, mismatchValue] of invariantCases) {
    await t.test(`${label}/mismatch`, async () => {
      const runBinding = createReplayVariant(operandIndex, {
        replayValue: mismatchValue,
      })
      const result = await runFullController(
        createFullRunEffectController(),
        runBinding
      )
      assert.equal(result.ok, true)
      assert.equal(result.recordProjection.replay.equivalence.result, 'DIVERGED')
    })
    await t.test(`${label}/unproven`, async () => {
      const runBinding = createReplayVariant(operandIndex, {
        observationState: 'not-observed',
        replayValue: null,
      })
      const result = await runFullController(
        createFullRunEffectController(),
        runBinding
      )
      assert.equal(result.ok, true)
      assert.equal(result.recordProjection.replay.equivalence.result, 'UNPROVEN')
    })
  }

  await t.test('I6-vite-runtime-mismatch', async () => {
    const runBinding = createValidRunBinding({
      rootOverrides: { viteRuntimeVersionObservation: '8.1.5' },
    })
    const result = await runFullController(
      createFullRunEffectController(),
      runBinding
    )
    assert.equal(result.recordProjection.replay.equivalence.result, 'DIVERGED')
  })
  await t.test('I6-vite-runtime-unproven', async () => {
    const runBinding = createReplayVariant(58, {
      observationState: 'not-observed',
      replayValue: null,
    })
    const result = await runFullController(
      createFullRunEffectController(),
      runBinding
    )
    assert.equal(result.recordProjection.replay.equivalence.result, 'UNPROVEN')
  })
  await t.test('I7-profile-lifecycle-mismatch', async () => {
    const runBinding = createValidRunBinding({
      rootOverrides: {
        profileInstanceObservation: {
          newInstanceObserved: false,
          historicalInstanceReuseObserved: true,
        },
      },
    })
    const result = await runFullController(
      createFullRunEffectController(),
      runBinding
    )
    assert.equal(
      result.recordProjection.replay.profileInstanceBinding.lifecycle,
      'reused'
    )
    assert.equal(result.recordProjection.replay.equivalence.result, 'DIVERGED')
  })
  await t.test('I7-profile-lifecycle-unproven', async () => {
    const runBinding = createReplayVariant(24, {
      observationState: 'not-observed',
      replayValue: null,
    })
    const result = await runFullController(
      createFullRunEffectController(),
      runBinding
    )
    assert.equal(result.recordProjection.replay.equivalence.result, 'UNPROVEN')
  })
  await t.test('I8-causal-deviation-contradicted', async () => {
    const runBinding = createValidRunBinding({
      rootOverrides: {
        unexplainedCausalDeviationObservation: {
          reviewCompleted: true,
          deviationObserved: true,
        },
      },
    })
    const result = await runFullController(
      createFullRunEffectController(),
      runBinding
    )
    assert.equal(
      result.recordProjection.replay.equivalence
        .noUnexplainedCausalDeviation,
      'contradicted'
    )
    assert.equal(result.recordProjection.replay.equivalence.result, 'DIVERGED')
  })
  await t.test('I8-causal-deviation-unproven', async () => {
    const runBinding = createValidRunBinding({
      rootOverrides: {
        unexplainedCausalDeviationObservation: {
          reviewCompleted: false,
          deviationObserved: false,
        },
      },
    })
    const result = await runFullController(
      createFullRunEffectController(),
      runBinding
    )
    assert.equal(
      result.recordProjection.replay.equivalence
        .noUnexplainedCausalDeviation,
      'unproven'
    )
    assert.equal(result.recordProjection.replay.equivalence.result, 'UNPROVEN')
  })
  await t.test('mismatch-dominates-unproven', async () => {
    const runBinding = createReplayVariant(36, {
      replayValue: 'http://127.0.0.1:5173/other',
    })
    runBinding.replayOperands[9].observationState = 'not-observed'
    runBinding.replayOperands[9].replayValue = null
    runBinding.unexplainedCausalDeviationObservation = {
      reviewCompleted: false,
      deviationObserved: false,
    }
    const result = await runFullController(
      createFullRunEffectController(),
      runBinding
    )
    assert.equal(result.recordProjection.replay.equivalence.result, 'DIVERGED')
  })
})

test('schliesst ungueltige Controllerclocks und Deadlineueberlauf phasengerecht', { concurrency: false }, async (t) => {
  const cases = [
    ['negative-origin', -1, false],
    ['NaN-origin', NaN, false],
    ['Infinity-origin', Infinity, false],
    ['unsafe-deadline', Number.MAX_SAFE_INTEGER - 5999, false],
    ['backward-after-attempt', 100, true],
  ]
  for (const [label, origin, backward] of cases) {
    await t.test(label, async () => {
      const controller = createFullRunEffectController({
        clockForReason(reason, current) {
          if (reason === 'setup-origin') {
            return origin
          }
          if (backward && reason === 'setup-dequeue-before-reflection') {
            return origin - 1
          }
          return current + 10
        },
      })
      const result = await runFullController(controller)
      assertFoundationResult(result)
      if (backward) {
        assert.equal(result.ok, true)
        assert.equal(result.recordProjection.candidateObserverGate, 'FAIL')
        assert.equal(result.recordProjection.candidateFinding, 'observer-invalid')
      } else {
        assert.equal(result.ok, false)
        assert.equal(result.recordProjection, null)
      }
    })
  }
})

async function runDeadlineProxyScenario(namespace, handlerPairs, definition) {
  const calls = []
  const trapCounts = {
    get: 0,
    getPrototypeOf: 0,
    ownKeys: 0,
    getOwnPropertyDescriptor: 0,
  }
  const descriptorKeys = []
  let markerCount = 0
  let cleanupCheckId = null
  let envelopeDelivered = false
  let selectedClockCallIndex = null
  let selectedObservation = null
  let countsBeforeClock = null
  const machine =
    namespace.createBrowserSyncTransportRuntimeDiagnosticRunMachine({
      activeExchange(intent) {
        const deferred = createCleanDeferred()
        calls.push({ deferred, intent })
        return deferred.promise
      },
      activeObservationClosed() {
        markerCount += 1
      },
      runBinding: createInternalRunBinding(),
    })
  namespace.requestBrowserSyncTransportRuntimeDiagnosticExchange(
    machine,
    machine.nextExchangeRequestProfile
  )

  // This bounded, synchronous driver processes existing controlled handlers.
  // It neither polls a Promise nor introduces a clock, timer or scheduler race.
  let processedCallCount = 0
  for (let callIndex = 0; callIndex < 64 && callIndex < calls.length; callIndex += 1) {
    const call = calls[callIndex]
    const intent = call.intent
    let value
    if (intent.kind === 'cleanup-step') {
      cleanupCheckId = intent.payload.checkId
    }
    if (intent.kind === 'observation-dequeue') {
      const envelope = intent.payload.phase === 'setup'
        ? createCdpMessage({ id: 1, result: { targetInfos: [] } })
        : {
            kind: 'cleanup-fact',
            checkId: cleanupCheckId,
            fact: true,
          }
      if (!envelopeDelivered && intent.payload.phase === definition.phase) {
        if (definition.phase === 'cleanup') {
          assert.equal(cleanupCheckId, 'debugPipeClosed')
        }
        envelopeDelivered = true
        selectedClockCallIndex = callIndex + 1
        value = new Proxy(envelope, {
          get(target, key, receiver) {
            trapCounts.get += 1
            return Reflect.get(target, key, receiver)
          },
          getPrototypeOf(target) {
            trapCounts.getPrototypeOf += 1
            return Reflect.getPrototypeOf(target)
          },
          ownKeys(target) {
            trapCounts.ownKeys += 1
            return Reflect.ownKeys(target)
          },
          getOwnPropertyDescriptor(target, key) {
            trapCounts.getOwnPropertyDescriptor += 1
            descriptorKeys.push(key)
            return Reflect.getOwnPropertyDescriptor(target, key)
          },
        })
      } else {
        value = envelope
      }
    } else if (intent.kind === 'controller-clock-sample') {
      const reason = intent.payload.reason
      let monotonicMilliseconds = reason === 'setup-origin' ? 100 : 7000
      if (reason === 'setup-dequeue-before-reflection') {
        monotonicMilliseconds = 6100
      } else if (reason === 'cleanup-dequeue-before-reflection') {
        monotonicMilliseconds = 70000
      }
      if (callIndex === selectedClockCallIndex) {
        assert.equal(reason, `${definition.phase}-dequeue-before-reflection`)
        countsBeforeClock = { ...trapCounts }
        monotonicMilliseconds =
          (definition.phase === 'setup' ? 6100 : 67000) + definition.delta
      }
      value = {
        kind: 'controller-clock-sample-result',
        reason,
        monotonicMilliseconds,
      }
    } else {
      value = normalFulfillmentForIntent(intent)
    }

    // Resolving with the proxy would itself read its `then` outside the
    // Foundation. Deliver directly, then settle only with primitive undefined.
    const pair = capturedHandlerPair(handlerPairs, call)
    assert.equal(pair.onFulfilled(value), undefined)
    call.deferred.resolve(undefined)
    processedCallCount += 1
    if (callIndex === selectedClockCallIndex) {
      selectedObservation = {
        counts: { ...trapCounts },
        descriptorKeys: [...descriptorKeys],
        markerCount,
        snapshot: machine.preCleanupObservationSnapshot,
      }
    }
  }
  assert.equal(envelopeDelivered, true)
  assert.notEqual(selectedObservation, null)
  assert.equal(processedCallCount, calls.length)
  assert.equal(machine.runSettlementCount, 1)
  const result = await machine.ownerRunPromise
  assertFoundationResult(result)
  assert.equal(result.ok, true)
  return {
    calls,
    countsBeforeClock,
    countsAfterSettlement: { ...trapCounts },
    markerCount,
    result,
    selectedObservation,
    finalSnapshot: machine.preCleanupObservationSnapshot,
  }
}

function assertDeadlineProxyScenarioConforms(scenario, definition) {
  const unreadCounts = {
    get: 0,
    getPrototypeOf: 0,
    ownKeys: 0,
    getOwnPropertyDescriptor: 0,
  }
  assert.deepEqual(scenario.countsBeforeClock, unreadCounts)
  const expectedCounts = definition.delta < 0
    ? {
        get: 0,
        getPrototypeOf: 1,
        ownKeys: 1,
        getOwnPropertyDescriptor: definition.phase === 'setup' ? 2 : 3,
      }
    : unreadCounts
  assert.deepEqual(
    scenario.selectedObservation.counts,
    expectedCounts,
    'ADR-0037 deadline envelope reflection must follow the inclusive guard'
  )
  assert.deepEqual(scenario.countsAfterSettlement, expectedCounts)
  assert.deepEqual(
    scenario.selectedObservation.descriptorKeys,
    definition.delta < 0
      ? (definition.phase === 'setup' ? ['kind', 'value'] : ['kind', 'checkId', 'fact'])
      : []
  )
  assert.equal(scenario.selectedObservation.markerCount, 1)
  assert.equal(scenario.markerCount, 1)
  assert.equal(scenario.finalSnapshot, scenario.selectedObservation.snapshot)
  assertDeepFrozenGraph(scenario.finalSnapshot)
  const projection = scenario.result.recordProjection
  assert.equal(projection.candidateObserverGate, 'UNPROVEN')
  assert.equal(projection.candidateFinding, 'inconclusive')
  assert.equal(
    projection.timing.completion.observationCloseReason,
    definition.phase === 'setup' && definition.delta < 0
      ? 'setup-terminal-unproven'
      : 'setup-cap'
  )
  assert.equal(projection.timing.completion.cleanupFinalizeReason, 'cleanup-cap')
  assert.equal(projection.timing.completion.captureWindowState, 'not-started')
  assert.equal(
    scenario.calls.some(({ intent }) =>
      intent.kind === 'protocol-command-send' &&
      intent.payload.command === 'Runtime.evaluate'),
    false
  )
  assert.equal(
    scenario.calls.filter(({ intent }) => intent.kind === 'cleanup-step').length,
    definition.phase === 'cleanup' && definition.delta < 0 ? 2 : 1
  )
  const arm = scenario.calls.find(({ intent }) =>
    intent.kind === 'cap-arm' && intent.payload.capKind === definition.phase)
  assert.notEqual(arm, undefined)
  assert.equal(
    arm.intent.payload.deadlineMilliseconds,
    definition.phase === 'setup' ? 6100 : 67000
  )
}

test('beweist ADR-0037-Deadlinegrenzen mit vier getrennten Envelope-Proxytraps und kausalen Mutanten', { concurrency: false }, async (t) => {
  await withCapturedControlledPromiseHandlers(async (handlerPairs) => {
    let baselineProductionBytes
    await withTemporaryDiagnosticObserverCopy({
      anchor: PRIVATE_EXPORT_ANCHOR,
      kind: 'adr-0037-deadline-proxy-baseline',
    }, async ({ namespace, productionBytes }) => {
      baselineProductionBytes = productionBytes
      for (const phase of ['setup', 'cleanup']) {
        for (const delta of [-1, 0, 1]) {
          let baselinePassed = false
          await t.test(`baseline-${phase}-deadline${delta < 0 ? '-1' : delta === 0 ? '' : '+1'}`, async () => {
            const definition = { phase, delta }
            const scenario = await runDeadlineProxyScenario(namespace, handlerPairs, definition)
            assertDeadlineProxyScenarioConforms(scenario, definition)
            baselinePassed = true
          })
          assert.equal(baselinePassed, true, 'All deadline baselines must pass before mutation probes')
        }
      }
    })

    for (const phase of ['setup', 'cleanup']) {
      const deadlineField = phase === 'setup' ? 'setupDeadline' : 'cleanupDeadline'
      const guard = `if (value >= machine.${deadlineField}) {`
      const phaseGuard = `if (phase === '${phase}') {\n    ${guard}`
      const mutations = [
        {
          id: `${phase}-exclusive-deadline`,
          search: guard,
          replacement: `if (value > machine.${deadlineField}) {`,
          deltas: [0],
        },
        {
          id: `${phase}-envelope-before-deadline-guard`,
          search: phaseGuard,
          replacement: `if (phase === '${phase}') {\n    readAckEnvelope(held)\n    ${guard}`,
          deltas: [0, 1],
        },
      ]
      for (const mutation of mutations) {
        await t.test(`mutant-${mutation.id}`, async () => {
          await withTemporaryDiagnosticObserverCopy({
            anchor: PRIVATE_EXPORT_ANCHOR,
            kind: `adr-0037-deadline-${mutation.id}`,
            mutate(bytes, replace) {
              return replace(bytes, mutation.search, mutation.replacement, mutation.id)
            },
          }, async ({ namespace, productionBytes }) => {
            assert.deepEqual(productionBytes, baselineProductionBytes)
            for (const delta of mutation.deltas) {
              const definition = { phase, delta }
              const scenario = await runDeadlineProxyScenario(namespace, handlerPairs, definition)
              assert.throws(
                () => assertDeadlineProxyScenarioConforms(scenario, definition),
                (error) => error?.code === 'ERR_ASSERTION' &&
                  error.message.includes('ADR-0037 deadline envelope reflection')
              )
            }
          })
        })
      }
    }
  })
})
