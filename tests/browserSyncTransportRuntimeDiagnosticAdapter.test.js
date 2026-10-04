// ADR0038-BEGIN
import { after as g36NativeAfter } from 'node:test'
import { createAdapterTestRegistry } from '../scripts/ci/adapterTestPlan.js'
// ADR0038-END
import test from 'node:test'
import assert from 'node:assert/strict'
import g36HarnessAssert from 'node:assert/strict'
import * as g36HarnessFs from 'node:fs/promises'
import * as g36HarnessPath from 'node:path'
import { tmpdir as g36HarnessTmpdir } from 'node:os'
import { pathToFileURL as g36HarnessFileUrl } from 'node:url'
import { createHash as g36HarnessCreateHash } from 'node:crypto'

// ADR0038-BEGIN
const g36Registry = createAdapterTestRegistry({ nativeTest: test, after: g36NativeAfter, sourceUrl: import.meta.url })
const g36CaseTest = g36Registry.test
const g36Variant = g36Registry.variant
// ADR0038-END
// Explicit raw-byte pins bind the reviewed production edits before test copies.
const g36HarnessExpectedAdapterByteLength = 257839
const g36HarnessExpectedAdapterSha256 = '4d27ab936ab4cb2f20ac22f570ded19ebc2f68e7ee1d9014bb8d735979163e7d'
const g36HarnessRepositoryRoot = g36HarnessPath.resolve(process.cwd())
const g36HarnessProductionPath = g36HarnessPath.join(g36HarnessRepositoryRoot, 'scripts', 'browser', 'browserSyncTransportRuntimeDiagnosticAdapter.js')
const g36HarnessAnchor = '// ADR-0036-ADAPTER-TESTCOPY-EXPORT-ANCHOR-V1'
const g36HarnessEligibility = 'const adapterEvidenceEligible = true'
const g36HarnessSelector = 'const createSelectedBrowserSyncTransportRuntimeDiagnosticCapabilities =\n  createBrowserSyncTransportRuntimeDiagnosticNodeCapabilities'
const g36HarnessDerivationBlock = [
  'function rejectBrowserSyncTransportRuntimeDiagnosticDerivationCapabilities() {',
  '  throw new TypeError("browserSyncTransportRuntimeDiagnosticAdapterFailed")',
  '}',
  '',
  'export {',
  '  deriveBrowserSyncTransportRuntimeDiagnosticRecordGate,',
  '  deriveBrowserSyncTransportRuntimeDiagnosticRecordFinding,',
  '  finalizeBrowserSyncTransportRuntimeDiagnosticRecord,',
  '}',
].join('\n')
const g36HarnessVirtualBlock = [
  'let browserSyncTransportRuntimeDiagnosticVirtualCapabilitySlot',
  '',
  'function installBrowserSyncTransportRuntimeDiagnosticVirtualCapabilities(runtimeCapabilities) {',
  '  if (arguments.length !== 1 || browserSyncTransportRuntimeDiagnosticVirtualCapabilitySlot !== undefined) adapterFail()',
  '  adapterValidateCapabilities(runtimeCapabilities)',
  '  adapterAssert(!adapterCapabilityIdentities.has(runtimeCapabilities))',
  '  browserSyncTransportRuntimeDiagnosticVirtualCapabilitySlot = runtimeCapabilities',
  '  return undefined',
  '}',
  '',
  'function consumeBrowserSyncTransportRuntimeDiagnosticVirtualCapabilities() {',
  '  if (arguments.length !== 0 || browserSyncTransportRuntimeDiagnosticVirtualCapabilitySlot === undefined || browserSyncTransportRuntimeDiagnosticVirtualCapabilitySlot === null) adapterFail()',
  '  const runtimeCapabilities = browserSyncTransportRuntimeDiagnosticVirtualCapabilitySlot',
  '  browserSyncTransportRuntimeDiagnosticVirtualCapabilitySlot = null',
  '  return runtimeCapabilities',
  '}',
  '',
  'export {',
  '  createBrowserSyncTransportRuntimeDiagnosticAdapterOwner,',
  '  enqueueBrowserSyncTransportRuntimeDiagnosticAdapterEvent,',
  '  installBrowserSyncTransportRuntimeDiagnosticVirtualCapabilities,',
  '}',
].join('\n')
let g36HarnessCopyTail = Promise.resolve()
let g36HarnessOriginalSource = null

function g36HarnessHash(bytes) { return g36HarnessCreateHash('sha256').update(bytes).digest('hex') }
function g36HarnessUniqueIndex(source, needle) {
  g36HarnessAssert.equal(typeof needle, 'string')
  g36HarnessAssert.ok(needle.length > 0)
  const first = source.indexOf(needle)
  g36HarnessAssert.notEqual(first, -1, 'missing exact source binding')
  g36HarnessAssert.equal(source.indexOf(needle, first + needle.length), -1, 'duplicate exact source binding')
  return first
}
function g36HarnessExactReplace(source, from, to) {
  g36HarnessUniqueIndex(source, from)
  return source.replace(from, () => to)
}
function g36HarnessExpectedSplices(source, changes) {
  const ordered = changes.map(({ from, to }) => ({ start: g36HarnessUniqueIndex(source, from), from, to })).sort((left, right) => left.start - right.start)
  let cursor = 0
  let output = ''
  for (const change of ordered) {
    g36HarnessAssert.ok(change.start >= cursor, 'overlapping source changes')
    output += source.slice(cursor, change.start) + change.to
    cursor = change.start + change.from.length
  }
  return output + source.slice(cursor)
}
function g36HarnessProfiles(profile) {
  g36HarnessAssert.ok(profile === 'derivation-conformance' || profile === 'virtual-runtime-conformance')
  const virtual = profile === 'virtual-runtime-conformance'
  return {
    block: virtual ? g36HarnessVirtualBlock : g36HarnessDerivationBlock,
    selector: virtual ? 'consumeBrowserSyncTransportRuntimeDiagnosticVirtualCapabilities' : 'rejectBrowserSyncTransportRuntimeDiagnosticDerivationCapabilities',
    names: ['createBrowserSyncTransportRuntimeDiagnosticAdapter', ...(virtual ?
      ['createBrowserSyncTransportRuntimeDiagnosticAdapterOwner', 'enqueueBrowserSyncTransportRuntimeDiagnosticAdapterEvent', 'installBrowserSyncTransportRuntimeDiagnosticVirtualCapabilities'] :
      ['deriveBrowserSyncTransportRuntimeDiagnosticRecordGate', 'deriveBrowserSyncTransportRuntimeDiagnosticRecordFinding', 'finalizeBrowserSyncTransportRuntimeDiagnosticRecord'])].sort(),
  }
}
async function g36HarnessReadProduction() {
  g36HarnessAssert.ok(Number.isSafeInteger(g36HarnessExpectedAdapterByteLength) && g36HarnessExpectedAdapterByteLength > 0, 'production byte-length pin must be filled before tests')
  g36HarnessAssert.match(g36HarnessExpectedAdapterSha256 ?? '', /^[0-9a-f]{64}$/, 'production SHA256 pin must be filled before tests')
  const path = await g36HarnessFs.realpath(g36HarnessProductionPath)
  g36HarnessAssert.equal(path, g36HarnessProductionPath)
  const stat = await g36HarnessFs.lstat(path)
  g36HarnessAssert.ok(stat.isFile() && !stat.isSymbolicLink())
  const bytes = new Uint8Array(await g36HarnessFs.readFile(path))
  g36HarnessAssert.equal(bytes.length, g36HarnessExpectedAdapterByteLength)
  g36HarnessAssert.equal(g36HarnessHash(bytes), g36HarnessExpectedAdapterSha256)
  const source = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes)
  g36HarnessAssert.deepEqual(new TextEncoder().encode(source), bytes)
  if (g36HarnessOriginalSource === null) g36HarnessOriginalSource = source
  else g36HarnessAssert.equal(source, g36HarnessOriginalSource, 'production bytes drifted between copies')
  g36HarnessAssert.equal((source.match(/^export\s+/gm) ?? []).length, 1)
  g36HarnessAssert.equal((source.match(/^export function createBrowserSyncTransportRuntimeDiagnosticAdapter\(\)/gm) ?? []).length, 1)
  g36HarnessAssert.equal((source.match(/^const adapterEvidenceEligible = true$/gm) ?? []).length, 1)
  g36HarnessAssert.equal((source.match(/^const createSelectedBrowserSyncTransportRuntimeDiagnosticCapabilities =\n  createBrowserSyncTransportRuntimeDiagnosticNodeCapabilities$/gm) ?? []).length, 1)
  for (const binding of [g36HarnessAnchor, g36HarnessEligibility, g36HarnessSelector]) g36HarnessUniqueIndex(source, binding)
  return { source, bytes }
}
async function g36HarnessAbsent(path) {
  try { await g36HarnessFs.lstat(path); return false }
  catch (error) { if (error.code === 'ENOENT') return true; throw error }
}
function g36HarnessContained(parent, child) {
  const relative = g36HarnessPath.relative(parent, child)
  return relative !== '' && relative !== '..' && !relative.startsWith(`..${g36HarnessPath.sep}`) && !g36HarnessPath.isAbsolute(relative)
}

async function withAdapterCopy(profile, mutation, callback) {/* ADR0038:sync */g36Registry.assertExecutable();/* ADR0038:end */
  g36HarnessAssert.equal(arguments.length, 3)
  g36HarnessAssert.equal(typeof callback, 'function')
  const previous = g36HarnessCopyTail
  let release
  g36HarnessCopyTail = new Promise((resolve) => { release = resolve })
  await previous
/* ADR0038:sync */g36Registry.copyBegin();/* ADR0038:end */  let temporaryRoot = null
  let copyPath = null
  let temporaryParent = null
  try {
    const { source, bytes } = await g36HarnessReadProduction()
    const definition = g36HarnessProfiles(profile)
    const changes = [
      { from: g36HarnessEligibility, to: 'const adapterEvidenceEligible = false' },
      { from: g36HarnessSelector, to: `const createSelectedBrowserSyncTransportRuntimeDiagnosticCapabilities =\n  ${definition.selector}` },
      { from: g36HarnessAnchor, to: `${g36HarnessAnchor}\n${definition.block}` },
    ]
    const expectedProfile = g36HarnessExpectedSplices(source, changes)
    let transformed = source
    for (const change of changes) transformed = g36HarnessExactReplace(transformed, change.from, change.to)
    g36HarnessAssert.equal(transformed, expectedProfile, 'copy differs from the precomputed complete profile transform')
    let expectedCopy = expectedProfile
    if (mutation !== null) {
      g36HarnessAssert.deepEqual(Reflect.ownKeys(mutation), ['name', 'from', 'to'])
      g36HarnessAssert.match(mutation.name, /^[A-Za-z0-9_-]+$/)
      g36HarnessAssert.equal(typeof mutation.to, 'string')
      g36HarnessAssert.notEqual(mutation.from, mutation.to)
      const mutationIndex = g36HarnessUniqueIndex(expectedProfile, mutation.from)
      expectedCopy = expectedProfile.slice(0, mutationIndex) + mutation.to + expectedProfile.slice(mutationIndex + mutation.from.length)
      transformed = g36HarnessExactReplace(transformed, mutation.from, mutation.to)
    }
    const expectedBytes = new TextEncoder().encode(expectedCopy)
    const copyBytes = new TextEncoder().encode(transformed)
    g36HarnessAssert.deepEqual(copyBytes, expectedBytes, 'unexpected additional copy-byte difference')
    g36HarnessAssert.notEqual(g36HarnessHash(copyBytes), g36HarnessHash(bytes))
    temporaryParent = await g36HarnessFs.realpath(g36HarnessPath.resolve(g36HarnessTmpdir()))
    temporaryRoot = await g36HarnessFs.mkdtemp(g36HarnessPath.join(temporaryParent, 'goldendawn-adr0036-testcopy-'))/* ADR0038:sync */;g36Registry.copyCreated();/* ADR0038:end */
    temporaryRoot = g36HarnessPath.resolve(temporaryRoot)
    g36HarnessAssert.ok(g36HarnessContained(temporaryParent, temporaryRoot))
    g36HarnessAssert.ok(!g36HarnessContained(g36HarnessRepositoryRoot, temporaryRoot))
    g36HarnessAssert.equal(await g36HarnessFs.realpath(temporaryRoot), temporaryRoot)
    copyPath = g36HarnessPath.join(temporaryRoot, `${profile}.mjs`)
    await g36HarnessFs.writeFile(copyPath, copyBytes, { flag: 'wx' })
    g36HarnessAssert.deepEqual(new Uint8Array(await g36HarnessFs.readFile(copyPath)), expectedBytes)
    const hashes = Object.freeze({ productionByteLength: bytes.length, productionSha256: g36HarnessHash(bytes), copyByteLength: copyBytes.length, copySha256: g36HarnessHash(copyBytes) })
    const namespace = await import(g36HarnessFileUrl(copyPath).href)
    g36HarnessAssert.deepEqual(Object.getOwnPropertyNames(namespace).sort(), definition.names)
    const result = await callback(namespace, { source, copyPath, hashes })
    g36HarnessAssert.deepEqual(new Uint8Array(await g36HarnessFs.readFile(copyPath)), expectedBytes)
    await g36HarnessReadProduction()
    return result
  } finally {
    try {
      if (temporaryRoot !== null) {
        // Delete only the exact exclusive copy root after resolving containment
        // and confirming that neither it nor its parent was substituted.
        g36HarnessAssert.ok(g36HarnessContained(temporaryParent, temporaryRoot))
        g36HarnessAssert.ok(!g36HarnessContained(g36HarnessRepositoryRoot, temporaryRoot))
        g36HarnessAssert.equal(await g36HarnessFs.realpath(temporaryRoot), temporaryRoot)
        const stat = await g36HarnessFs.lstat(temporaryRoot)
        g36HarnessAssert.ok(stat.isDirectory() && !stat.isSymbolicLink())
        await g36HarnessFs.rm(temporaryRoot, { recursive: true, force: false })
        g36HarnessAssert.equal(await g36HarnessAbsent(temporaryRoot), true)
        if (copyPath !== null) g36HarnessAssert.equal(await g36HarnessAbsent(copyPath), true)/* ADR0038:sync */;g36Registry.copyRemoved();/* ADR0038:end */
      }
    } finally { /* ADR0038:sync */g36Registry.copyEnd();/* ADR0038:end */release() }
  }
}

function g36HarnessFrame(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(value))
  const frame = new Uint8Array(bytes.length + 1)
  frame.set(bytes)
  return frame
}
function g36HarnessEvaluation(sourcePlan) {
  const path = g36HarnessPath.win32.join(sourcePlan.repositoryRoot, 'docs', 'decisions', '0033-browser-sync-transport-diagnostic-foundation-effects-protocol-boundary.md')
  const document = sourcePlan.files.get(path)
  g36HarnessAssert.ok(document instanceof Uint8Array)
  const source = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(document)
  const heading = '### 8. Exakter private Evaluationtext'
  const start = g36HarnessUniqueIndex(source, heading)
  const sectionEnd = source.indexOf('\n### ', start + heading.length)
  const section = source.slice(start, sectionEnd < 0 ? source.length : sectionEnd)
  const marker = '```javascript\n'
  const opening = g36HarnessUniqueIndex(section, marker) + marker.length
  const closing = section.indexOf('\n```', opening)
  g36HarnessAssert.ok(closing >= opening)
  const expression = section.slice(opening, closing)
  const bytes = new TextEncoder().encode(expression)
  g36HarnessAssert.equal(bytes.length, 4259)
  g36HarnessAssert.equal(g36HarnessHash(bytes), 'a623ffafee8dfcbc1d2ddc374cc35f0dbf800defd97619a3b58337d972090f7b')
  return expression
}
function g36HarnessSeedSources(fixture, sourcePlan, scenario) {
  const dispatch = fixture.controller.dispatch
  const returnSource = (source, value) => dispatch({ kind: 'source-return', source, value })
  returnSource('readDiagnosticRunIdEntropyBytes', new Uint8Array(17).fill(17))
  returnSource('readReplayContextIdEntropyBytes', new Uint8Array(15).fill(29))
  returnSource('readWallMilliseconds', 1789257600000)
  returnSource('readTimeZone', 'UTC')
  returnSource('readProcessPlatform', 'win32')
  returnSource('readProcessArchitecture', 'x64')
  returnSource('readProcessVersion', 'v24.19.0')
  returnSource('readProcessExecutablePath', sourcePlan.nodePath)
  returnSource('readProcessExecArguments', ['--experimental-vm-modules', '--no-warnings'])
  returnSource('readWorkingDirectory', sourcePlan.repositoryRoot)
  for (const name of g36FixtureEnvironmentNames) returnSource(`process-environment:${name}`,
    name === 'TEMP' ? [{ name, value: 'C:\\GoldenDawnFixtureTemp' }] : [])
}

async function runVirtualAdapterScenario(namespace, options) {
  const { entry = 'owner', sourcePlan, scenario = 'capture-cap', sourceScriptTransform = null,
    rawBeforeCaptureCap = null, rawAfterHookMicrotasks = 3, sourceSettlementOrder = 'passive-first',
    controllerClockValues = null, assertAtCapturePending = null, assertBeforeCaptureCap = null,
    assertAtEvaluateWriteReturn = null, rawAfterCaptureAssertions = null, controllerClockActions = null,
    assertAfterObservationCap = null, failRemainingResourceOperations = false,
    assertAfterOutputOverflow = null, readinessActions = null, assertAfterReadiness = null,
    failResourcesAfterReadiness = false, assertAtOuterCleanupPending = null,
    releaseFirstSetupCap = false } = options
  g36HarnessAssert.ok(entry === 'owner' || entry === 'factory')
  g36HarnessAssert.ok(['capture-cap', 'setup-cap', 'prestart', 'partial-gateway', 'partial-profile-completed', 'partial-vite',
    'setup-ready-cancel-reject', 'rejection-quiescence', 'post-o0-setup-cancel',
    'portless-start', 'portless-cleanup', 'capture-cap-post-settlement-first',
    'capture-cap-no-post-settlement', 'first-write-backpressure', 'first-write-drain',
    'first-write-pending', 'first-write-error', 'evaluate-partial-write',
    'evaluate-write-throw', 'evaluate-timer-throw', 'stdout-cap', 'stdout-over-cap',
    'stderr-cap', 'stderr-over-cap', 'setup-deadline-reached', 'cleanup-deadline-reached', 'pre-foundation-rejection', 'setup-origin-rejected', 'first-command-rejected'].includes(scenario))
  g36HarnessAssert.ok(sourcePlan && Array.isArray(sourcePlan.preflight))
  g36HarnessAssert.ok(sourceScriptTransform === null || typeof sourceScriptTransform === 'function')
  g36HarnessAssert.ok(rawBeforeCaptureCap === null || Array.isArray(rawBeforeCaptureCap) || typeof rawBeforeCaptureCap === 'function')
  g36HarnessAssert.ok(Number.isInteger(rawAfterHookMicrotasks) && rawAfterHookMicrotasks >= 0 && rawAfterHookMicrotasks <= 2048)
  g36HarnessAssert.ok(['passive-first', 'post-settlement-first'].includes(sourceSettlementOrder))
  g36HarnessAssert.ok(controllerClockValues === null || Array.isArray(controllerClockValues) &&
    controllerClockValues.length > 0 && controllerClockValues.every(value => Number.isSafeInteger(value) && value >= 0))
  g36HarnessAssert.ok(controllerClockActions === null || controllerClockValues === null && Array.isArray(controllerClockActions) &&
    controllerClockActions.length > 0 && controllerClockActions.every(action => action !== null && typeof action === 'object' &&
      ['source-return', 'source-throw'].includes(action.kind) && action.source === 'readControllerNanoseconds'))
  g36HarnessAssert.ok(assertAtCapturePending === null || typeof assertAtCapturePending === 'function')
  g36HarnessAssert.ok(assertBeforeCaptureCap === null || typeof assertBeforeCaptureCap === 'function')
  g36HarnessAssert.ok(assertAtEvaluateWriteReturn === null || typeof assertAtEvaluateWriteReturn === 'function')
  g36HarnessAssert.ok(rawAfterCaptureAssertions === null || Array.isArray(rawAfterCaptureAssertions) || typeof rawAfterCaptureAssertions === 'function')
  g36HarnessAssert.ok(assertAfterObservationCap === null || typeof assertAfterObservationCap === 'function')
  g36HarnessAssert.equal(typeof failRemainingResourceOperations, 'boolean')
  g36HarnessAssert.ok(assertAfterOutputOverflow === null || typeof assertAfterOutputOverflow === 'function')
  g36HarnessAssert.ok(readinessActions === null || typeof readinessActions === 'function')
  g36HarnessAssert.ok(assertAfterReadiness === null || typeof assertAfterReadiness === 'function')
  g36HarnessAssert.equal(typeof failResourcesAfterReadiness, 'boolean')
  g36HarnessAssert.ok(assertAtOuterCleanupPending === null || typeof assertAtOuterCleanupPending === 'function')
  g36HarnessAssert.equal(typeof releaseFirstSetupCap, 'boolean')
  const fixture = createVirtualRuntimeFixture()
  const controller = fixture.controller
  g36HarnessSeedSources(fixture, sourcePlan, scenario)
  if (controllerClockValues !== null) for (const value of controllerClockValues) {
    controller.dispatch({ kind: 'source-return', source: 'readControllerNanoseconds', value: BigInt(value) * 1000000n })
  }
  if (controllerClockActions !== null) for (const action of controllerClockActions) controller.dispatch(action)
  let owner = null
  let api
  if (entry === 'owner') {
    owner = namespace.createBrowserSyncTransportRuntimeDiagnosticAdapterOwner(fixture.runtimeCapabilities)
    api = owner.api
  } else {
    namespace.installBrowserSyncTransportRuntimeDiagnosticVirtualCapabilities(fixture.runtimeCapabilities)
    api = namespace.createBrowserSyncTransportRuntimeDiagnosticAdapter()
  }
  let outcome = null
  const run = api.run()
  run.then((result) => { outcome = { kind: 'result', result } }, (error) => { outcome = { kind: 'error', error } })
  let completedSourceEntries = 0
  const target = 'target-adr0036-fixture'
  const session = 'session-adr0036-fixture'
  const commands = [
    { id: 1, method: 'Target.getTargets', params: {} },
    { id: 2, method: 'Target.attachToTarget', params: { targetId: target, flatten: true } },
    { id: 3, method: 'Network.enable', params: {}, sessionId: session },
    { id: 4, method: 'Runtime.evaluate', params: { expression: g36HarnessEvaluation(sourcePlan), awaitPromise: true, returnByValue: true, generatePreview: false }, sessionId: session },
    { id: 5, method: 'Network.disable', params: {}, sessionId: session },
    { id: 6, method: 'Target.detachFromTarget', params: { sessionId: session } },
  ]
  const replies = [
    { id: 1, result: { targetInfos: [{ type: 'page', url: 'http://127.0.0.1:5173/', attached: false, targetId: target }] } },
    { id: 2, result: { sessionId: session } },
    { id: 3, sessionId: session, result: {} },
    null,
    { id: 5, sessionId: session, result: {} },
    { id: 6, result: {} },
  ]
  if (scenario === 'setup-ready-cancel-reject') {
    commands.splice(3, 1)
    commands[3].id = 4
    commands[4].id = 5
    replies.splice(3, 1)
    replies[3].id = 4
    replies[4].id = 5
  }
  if (scenario === 'post-o0-setup-cancel') replies[0] = { id: 1, result: { targetInfos: [] } }
  const earlyObservationStop = ['setup-cap', 'rejection-quiescence', 'post-o0-setup-cancel',
    'portless-start', 'first-write-backpressure', 'first-write-pending', 'first-write-error', 'setup-deadline-reached'].includes(scenario)
  const settlementFirst = sourceSettlementOrder === 'post-settlement-first' || ['portless-start', 'portless-cleanup', 'first-write-error', 'capture-cap-post-settlement-first',
    'capture-cap-no-post-settlement'].includes(scenario)
  let truncatedSourceFailurePhase = null
  const transform = (script, phase) => {
    const transformed = sourceScriptTransform === null ? script : sourceScriptTransform(script, phase)
    g36HarnessAssert.ok(Array.isArray(transformed))
    if (transformed.length < script.length) truncatedSourceFailurePhase = phase
    return transformed
  }
  let sourcePhase = 'preflight'
  let sourceScript = transform(sourcePlan.preflight, sourcePhase)
  let sourceIndex = 0
  let sourceAborted = false
  let clockReturns = 0
  let writeObserved = 0
  let writePrepared = 0
  let readinessSent = false
  let observationCapFired = false
  let observationClosureTriggered = false
  let passiveCompleted = false
  let closingGenerated = false
  let partialGatewayArmed = false
  let staleSetupTimer = null
  let partialCloseHeld = false
  let heldProfileCreateOrdinal = null
  let postSettlementCompleted = false
  let outerCleanupPendingAsserted = false
  let resourceFailureDrain = false
  const completedSourceScriptEntries = []
  const runtimeCreated = { root: false, profile: false }
  let lastActivityTurn = 0
  const seedNextClock = (snapshot = controller.snapshot()) => {
    if (controllerClockValues !== null || controllerClockActions !== null) return
    const reads = snapshot.callCounts.clock.readControllerNanoseconds
    // Two raw primitive source answers allow the named double-read mutant to
    // reach its causal count oracle rather than fail from an empty fixture
    // queue. The unchanged adapter still consumes exactly 100 + 10*i.
    if (reads > clockReturns) clockReturns = reads
    while (clockReturns < reads + 2) {
      const milliseconds = scenario === 'setup-cap' && clockReturns > 0 ? 6100 + clockReturns - 1 : 100 + clockReturns * 10
      controller.dispatch({ kind: 'source-return', source: 'readControllerNanoseconds', value: BigInt(milliseconds) * 1000000n })
      clockReturns += 1
    }
  }
  const microtaskPrefix = async (count) => {
    for (let checkpoint = 0; checkpoint < count; checkpoint += 1) { seedNextClock(); await Promise.resolve() }
  }
  const rootPath = 'C:\\GoldenDawnFixtureTemp\\goldendawn-diagnostic-run'
  const rootIdentity = { pathType: 'directory', volumeId: '1', fileId: '900001', byteLength: 0, modifiedTimeNanoseconds: '1', changeTimeNanoseconds: '1', reparsePoint: false }
  const profileIdentity = { ...rootIdentity, fileId: '900002' }
  const passiveResult = { kind: 'passive-tcp-listeners', endpoints: [{ address: '127.0.0.1', port: 5173, state: 'unavailable' }, { address: '127.0.0.1', port: 8787, state: 'unavailable' }] }
  const nextScript = () => {
    if (sourcePhase === truncatedSourceFailurePhase && ['preflight', 'runtime-create', 'pre-o0'].includes(sourcePhase)) {
      sourceAborted = true
      sourcePhase = 'aborted-cleanup'
      sourceScript = []
      sourceIndex = 0
      return
    }
    if (sourcePhase === 'preflight') {
      sourcePhase = 'runtime-create'
      sourceScript = transform([
        ...sourcePlan.pathChecks('C:\\GoldenDawnFixtureTemp'),
        { kind: 'create-temporary-root', result: { kind: 'resource-created', path: rootPath, pathIdentity: rootIdentity } },
        ...sourcePlan.pathChecks(rootPath, rootIdentity),
        { kind: 'inspect-open-resource', result: { kind: 'open-resource-identity', ...rootIdentity } },
        { kind: 'create-directory-exclusive', result: { kind: 'resource-created', path: `${rootPath}\\profile`, pathIdentity: profileIdentity } },
        ...sourcePlan.pathChecks(`${rootPath}\\profile`, profileIdentity),
        { kind: 'inspect-open-resource', result: { kind: 'open-resource-identity', ...profileIdentity } },
      ], sourcePhase)
    } else if (sourcePhase === 'runtime-create') {
      sourcePhase = 'pre-o0'
      sourceScript = transform(sourcePlan.verification('pre-o0'), sourcePhase)
    } else if (sourcePhase === 'pre-o0') {
      sourceAborted = scenario === 'pre-foundation-rejection'
      if (['setup-origin-rejected', 'first-command-rejected'].includes(scenario)) observationClosureTriggered = true
      const verifySettlementNow = observationClosureTriggered && (settlementFirst || ['setup-origin-rejected', 'first-command-rejected'].includes(scenario))
      sourcePhase = verifySettlementNow ? 'post-settlement' : sourceAborted ? 'aborted-cleanup' : 'observation'
      sourceScript = verifySettlementNow ? transform(sourcePlan.verification('post-settlement'), sourcePhase) : []
    }
    else if (sourcePhase === 'post-settlement') {
      postSettlementCompleted = true
      if (!passiveCompleted) { sourcePhase = 'outer-passive'; sourceScript = [] }
      else {
        sourcePhase = 'post-cleanup'
        sourceScript = transform(sourcePlan.verification('post-cleanup'), sourcePhase)
      }
    } else if (sourcePhase === 'post-cleanup') {
      sourcePhase = 'source-closing'
      sourceScript = typeof sourcePlan.closingAfterScripts === 'function'
        ? sourcePlan.closingAfterScripts(completedSourceScriptEntries) : sourcePlan.closing()
      closingGenerated = true
    } else if (sourcePhase === 'source-closing') {
      sourcePhase = 'runtime-closing'
      sourceScript = [
        ...(runtimeCreated.profile ? sourcePlan.handleCheckAndClose(`${rootPath}\\profile`, profileIdentity) : []),
        ...(runtimeCreated.root ? sourcePlan.handleCheckAndClose(rootPath, rootIdentity) : []),
      ]
    } else if (sourcePhase === 'runtime-closing') { sourcePhase = 'done'; sourceScript = [] }
    sourceIndex = 0
  }
  const maximumMicrotaskTurns = Math.max(1000000, sourcePlan.preflight.length * 512)
  g36HarnessAssert.ok(Number.isSafeInteger(maximumMicrotaskTurns))
  for (let turn = 0; turn < maximumMicrotaskTurns && outcome === null; turn += 1) {
    let snapshot = controller.snapshot()
    seedNextClock(snapshot)
    if (['partial-gateway', 'partial-profile-completed'].includes(scenario) && !partialGatewayArmed && snapshot.callCounts.launcher.spawnChild === 1) {
      controller.dispatch({ kind: 'fail-next-capability-call', capability: 'spawnChild' })
      partialGatewayArmed = true
      lastActivityTurn = turn
    }
    if (!readinessSent && snapshot.liveOrdinals.children.length === 3 && snapshot.liveOrdinals.debugPipes.length === 1) {
      const childOrdinals = Object.freeze({ viteOrdinal: snapshot.liveOrdinals.children[0], gatewayOrdinal: snapshot.liveOrdinals.children[1], chromeOrdinal: snapshot.liveOrdinals.children[2] })
      const startupActions = readinessActions === null ? [
        { kind: 'child-stdout', childOrdinal: childOrdinals.viteOrdinal, bytes: new TextEncoder().encode('  ➜  Local:   http://127.0.0.1:5173/\n') },
        { kind: 'child-stdout', childOrdinal: childOrdinals.gatewayOrdinal, bytes: new TextEncoder().encode('Das lokale SyncGateway lauscht ausschließlich auf 127.0.0.1.\n') },
      ] : readinessActions(childOrdinals)
      g36HarnessAssert.ok(Array.isArray(startupActions))
      for (const action of startupActions) controller.dispatch(action)
      if (assertAfterReadiness !== null) g36HarnessAssert.equal(assertAfterReadiness(owner, controller.snapshot()), undefined)
      if (failResourcesAfterReadiness) {
        resourceFailureDrain = true
        sourceAborted = true
        sourcePhase = 'aborted-cleanup'
        sourceScript = []
        sourceIndex = 0
      }
      if (['stdout-cap', 'stdout-over-cap', 'stderr-cap', 'stderr-over-cap'].includes(scenario)) {
        // Chrome has no readiness line: its two independent retained-output
        // counters therefore start at zero for these exact boundary vectors.
        const stream = scenario.startsWith('stdout') ? 'stdout' : 'stderr'
        controller.dispatch({ kind: `child-${stream}`, childOrdinal: snapshot.liveOrdinals.children[2], bytes: new Uint8Array(65536).fill(120) })
        if (scenario.endsWith('over-cap')) {
          controller.dispatch({ kind: `child-${stream}`, childOrdinal: snapshot.liveOrdinals.children[2], bytes: new Uint8Array([120]) })
          // The byte-boundary oracle runs synchronously before any additional
          // raw resource failure can contribute to the terminal outcome.
          if (assertAfterOutputOverflow !== null) g36HarnessAssert.equal(assertAfterOutputOverflow(owner, controller.snapshot()), undefined)
          resourceFailureDrain = true
          sourceAborted = true
          sourcePhase = 'aborted-cleanup'
          sourceScript = []
          sourceIndex = 0
        }
      }
      readinessSent = true
      lastActivityTurn = turn
    }
    const pipeOrdinal = snapshot.liveOrdinals.debugPipes[0]
    const prepareWrite = () => {
      if (earlyObservationStop && writePrepared > 0) return
      if (scenario === 'evaluate-write-throw' && writePrepared === 3) {
        controller.dispatch({ kind: 'fail-next-capability-call', capability: 'writeDebugPipe' })
        writePrepared += 1
        return
      }
      const partial = scenario === 'rejection-quiescence' && writePrepared === 0 || scenario === 'evaluate-partial-write' && writePrepared === 3
      const backpressure = ['first-write-backpressure', 'first-write-drain'].includes(scenario) && writePrepared === 0
      controller.dispatch({ kind: 'pipe-write-result', pipeOrdinal,
        acceptedByteLength: g36HarnessFrame(commands[writePrepared]).length - (partial ? 1 : 0), backpressure })
      writePrepared += 1
    }
    if (pipeOrdinal !== undefined && snapshot.pendingPipeWriteResultCount === 0 && writePrepared === writeObserved && writePrepared < commands.length) {
      prepareWrite()
      lastActivityTurn = turn
    }
    if (snapshot.callCounts.pipe.writeDebugPipe > writeObserved) {
      g36HarnessAssert.equal(snapshot.callCounts.pipe.writeDebugPipe, writeObserved + 1)
      const index = writeObserved++
      if (index === 3 && assertAtEvaluateWriteReturn !== null) g36HarnessAssert.equal(assertAtEvaluateWriteReturn(owner, snapshot), undefined)
      if (pipeOrdinal === undefined) {
        observationClosureTriggered = true
        if (settlementFirst && sourcePhase === 'observation') {
          sourcePhase = 'post-settlement'
          sourceScript = transform(sourcePlan.verification('post-settlement'), sourcePhase)
          sourceIndex = 0
        }
        lastActivityTurn = turn
        await Promise.resolve()
        continue
      }
      if (writeObserved > writePrepared || snapshot.pendingPipeWriteResultCount !== 0 || scenario === 'evaluate-write-throw' && index === 3) {
        // The exact fixture counters establish that this attempted raw method
        // did not consume a prepared result, so it installed no completion
        // callback. This is an observed synchronous raw failure, never an ACK.
        observationClosureTriggered = true
        lastActivityTurn = turn
        await Promise.resolve()
        continue
      }
      if (!(scenario === 'first-write-pending' && index === 0) && !(scenario === 'evaluate-write-throw' && index === 3)) {
        controller.dispatch({ kind: 'pipe-write-completion', pipeOrdinal, state: scenario === 'first-write-error' && index === 0 ? 'failed' : 'completed' })
      }
      if (scenario === 'first-write-drain' && index === 0) controller.dispatch({ kind: 'pipe-drain', pipeOrdinal })
      if (releaseFirstSetupCap && index === 0) {
        const savedSetupOrdinal = snapshot.liveOrdinals.timers[0]
        g36HarnessAssert.equal(snapshot.liveOrdinals.timers.length, 1)
        // The same finite raw-event policy applies to control and mutant.
        await microtaskPrefix(32)
        if (controller.snapshot().liveOrdinals.timers.includes(savedSetupOrdinal)) {
          controller.dispatch({ kind: 'timer-fire', timerOrdinal: savedSetupOrdinal })
        }
      }
      const captureStop = index === 3 && !['setup-ready-cancel-reject', 'evaluate-partial-write', 'evaluate-write-throw', 'evaluate-timer-throw'].includes(scenario) && !earlyObservationStop
      if (scenario === 'setup-cap' && index === 0 || captureStop) {
        const observationTimer = snapshot.liveOrdinals.timers[0]
        g36HarnessAssert.equal(snapshot.liveOrdinals.timers.length, 1)
        if (index === 3 && (rawBeforeCaptureCap !== null || assertAtCapturePending !== null || assertBeforeCaptureCap !== null || rawAfterCaptureAssertions !== null)) {
          // A raw observation can close O0 during this scheduling prefix and
          // synchronously reach the first cleanup write. Its deterministic
          // local acceptance must already be prepared before releasing it.
          if (writePrepared === writeObserved && writePrepared < commands.length) prepareWrite()
          // Finite scheduling prefix only; tests separately inspect the genuine
          // productive Owner when they need a structural pending assertion.
          await microtaskPrefix(8)
          if (assertAtCapturePending !== null) g36HarnessAssert.equal(assertAtCapturePending(owner, controller.snapshot()), undefined)
          const actions = rawBeforeCaptureCap === null ? [] : typeof rawBeforeCaptureCap === 'function' ? rawBeforeCaptureCap(pipeOrdinal) : rawBeforeCaptureCap
          g36HarnessAssert.ok(Array.isArray(actions))
          for (const action of actions) controller.dispatch(action)
          await microtaskPrefix(rawAfterHookMicrotasks)
          if (assertBeforeCaptureCap !== null) g36HarnessAssert.equal(assertBeforeCaptureCap(owner, controller.snapshot()), undefined)
          const terminalActions = rawAfterCaptureAssertions === null ? [] : typeof rawAfterCaptureAssertions === 'function' ? rawAfterCaptureAssertions(pipeOrdinal) : rawAfterCaptureAssertions
          g36HarnessAssert.ok(Array.isArray(terminalActions))
          for (const action of terminalActions) controller.dispatch(action)
        }
        if (controller.snapshot().liveOrdinals.timers.includes(observationTimer)) controller.dispatch({ kind: 'timer-fire', timerOrdinal: observationTimer })
        observationCapFired = true
        observationClosureTriggered = true
        if (assertAfterObservationCap !== null || failRemainingResourceOperations) {
          // A finite withheld-resource prefix permits separate structural
          // assertions about the real Owner. No raw resource result is released
          // during these turns, and no Owner value controls the driver.
          await microtaskPrefix(128)
          if (assertAfterObservationCap !== null) g36HarnessAssert.equal(assertAfterObservationCap(owner, controller.snapshot()), undefined)
          resourceFailureDrain = failRemainingResourceOperations
        }
        if (settlementFirst) {
          sourcePhase = 'post-settlement'
          sourceScript = transform(sourcePlan.verification('post-settlement'), sourcePhase)
          sourceIndex = 0
        }
      } else if (index === 0 && ['rejection-quiescence', 'portless-start', 'first-write-error'].includes(scenario)) {
        observationClosureTriggered = true
        if (settlementFirst) {
          sourcePhase = 'post-settlement'
          sourceScript = transform(sourcePlan.verification('post-settlement'), sourcePhase)
          sourceIndex = 0
        }
      } else if (index === 3 && ['evaluate-partial-write', 'evaluate-write-throw', 'evaluate-timer-throw'].includes(scenario)) {
        observationClosureTriggered = true
      } else if (replies[index] !== null) {
        // Prepare the next synchronous local acceptance before releasing the
        // raw response that can causally start that next command.
        if (writePrepared === writeObserved && writePrepared < commands.length) {
          prepareWrite()
        }
        if (scenario === 'setup-ready-cancel-reject' && index === 2) {
          staleSetupTimer = snapshot.liveOrdinals.timers[0]
          controller.dispatch({ kind: 'fail-next-capability-call', capability: 'cancelTimer' })
          observationClosureTriggered = true
        }
        if (scenario === 'evaluate-timer-throw' && index === 2) controller.dispatch({ kind: 'fail-next-capability-call', capability: 'armTimer' })
        if (scenario === 'setup-deadline-reached' && index === 0) staleSetupTimer = snapshot.liveOrdinals.timers[0]
        controller.dispatch({ kind: 'pipe-chunk', pipeOrdinal, bytes: g36HarnessFrame(replies[index]) })
        if (scenario === 'setup-ready-cancel-reject' && index === 2 && settlementFirst) {
          sourcePhase = 'post-settlement'
          sourceScript = transform(sourcePlan.verification('post-settlement'), sourcePhase)
          sourceIndex = 0
        }
        if (index === 0 && earlyObservationStop) observationClosureTriggered = true
      }
      lastActivityTurn = turn
    }
    if (staleSetupTimer !== null && snapshot.callCounts.scheduler.armTimer >= 2) {
      if (snapshot.liveOrdinals.timers.includes(staleSetupTimer)) controller.dispatch({ kind: 'timer-fire', timerOrdinal: staleSetupTimer })
      staleSetupTimer = null
      lastActivityTurn = turn
    }
    if (!sourceAborted && ['preflight', 'runtime-create', 'pre-o0'].includes(sourcePhase) &&
      (sourcePhase !== 'pre-o0' || sourceIndex < sourceScript.length) && snapshot.callCounts.scheduler.armTimer > 0) {
      sourceAborted = true
      sourcePhase = 'aborted-cleanup'
      sourceScript = []
      sourceIndex = 0
    }
    if (sourcePhase === 'observation' && snapshot.callCounts.scheduler.armTimer >= 2 && writeObserved < 4) observationClosureTriggered = true
    if (sourceIndex === sourceScript.length && ['preflight', 'runtime-create', 'pre-o0', 'post-settlement', 'post-cleanup', 'source-closing', 'runtime-closing'].includes(sourcePhase)) nextScript()
    if (!outerCleanupPendingAsserted && assertAtOuterCleanupPending !== null && sourceAborted &&
      snapshot.callCounts.scheduler.armTimer > 0 &&
      (snapshot.liveOrdinals.timers.length > 0 || snapshot.liveOrdinals.resourceOperations.length > 0)) {
      // This is the first known outer-cleanup timer/resource boundary in the
      // statically aborted source path. Inspecting the exported Owner is only
      // an assertion; its fields never select a raw action or source script.
      outerCleanupPendingAsserted = true
      g36HarnessAssert.equal(assertAtOuterCleanupPending(owner, snapshot), undefined)
    }
    const operationOrdinal = snapshot.liveOrdinals.resourceOperations.find(ordinal => ordinal !== heldProfileCreateOrdinal)
    if (operationOrdinal !== undefined) {
      if (resourceFailureDrain) {
        controller.dispatch({ kind: 'resource-completion', operationOrdinal, state: 'failed', result: null })
        lastActivityTurn = turn
        await Promise.resolve()
        continue
      }
      if (sourceIndex < sourceScript.length) {
        const entryValue = sourceScript[sourceIndex]
        if (['partial-gateway', 'partial-vite'].includes(scenario) && sourcePhase === 'runtime-create' && entryValue.kind === 'create-directory-exclusive') {
          // The only script difference is withholding this raw result. The
          // productive owner has latched profile creation, starts Vite and
          // reaches the already armed Gateway failure without a profile handle.
          heldProfileCreateOrdinal = operationOrdinal
          sourceAborted = true
          sourcePhase = 'aborted-cleanup'
          sourceScript = []
          sourceIndex = 0
          lastActivityTurn = turn
          await Promise.resolve()
          continue
        }
        if (['partial-gateway', 'partial-vite'].includes(scenario) && sourcePhase === 'source-closing' && entryValue.kind === 'close-resource' && !partialCloseHeld) {
          g36HarnessAssert.equal(snapshot.liveOrdinals.timers.length, 1)
          controller.dispatch({ kind: 'timer-fire', timerOrdinal: snapshot.liveOrdinals.timers[0] })
          partialCloseHeld = true
          sourceScript = []
          sourceIndex = 0
          sourcePhase = 'done'
          lastActivityTurn = turn
          await Promise.resolve()
          continue
        }
        try {
          controller.dispatch({ kind: 'resource-completion', operationOrdinal, state: entryValue.state ?? 'completed', result: entryValue.state === 'failed' ? null : entryValue.result })
        } catch (error) {
          throw new Error(`virtual source dispatch failed at ${sourcePhase}[${sourceIndex}]/${entryValue.kind}, raw operation ${operationOrdinal}`, { cause: error })
        }
        sourceIndex += 1
        if (['preflight', 'pre-o0', 'post-settlement', 'post-cleanup', 'source-closing'].includes(sourcePhase) &&
          ['open-resource', 'close-resource'].includes(entryValue.kind)) {
          completedSourceScriptEntries.push({ kind: entryValue.kind, path: entryValue.path,
            resourceKey: entryValue.resourceKey, state: entryValue.state ?? 'completed' })
        }
        if (sourcePhase === 'preflight') completedSourceEntries += 1
        if (sourcePhase === 'runtime-create' && entryValue.state !== 'failed') {
          if (entryValue.kind === 'create-temporary-root') runtimeCreated.root = true
          if (entryValue.kind === 'create-directory-exclusive') runtimeCreated.profile = true
          if (scenario === 'partial-vite' && entryValue.kind === 'inspect-open-resource' && !runtimeCreated.profile) {
            controller.dispatch({ kind: 'fail-next-capability-call', capability: 'spawnChild' })
          }
          if (scenario === 'prestart' && sourceIndex === sourceScript.length) {
            controller.dispatch({ kind: 'fail-next-capability-call', capability: 'spawnChild' })
            sourceAborted = true
            sourcePhase = 'aborted-cleanup'
            sourceScript = []
            sourceIndex = 0
          }
        }
        lastActivityTurn = turn
        if (['preflight', 'pre-o0', 'post-settlement', 'post-cleanup', 'source-closing'].includes(sourcePhase)) {
          // Source operations are a fixed sequential raw script. Allow their
          // bounded native-Promise continuation to reach the next operation
          // before constructing another complete closed fixture snapshot.
          // Runtime creation is excluded so Vite/Gateway checkpoints remain
          // individually observable, and no new raw clock answer is consumed
          // merely to wait for source I/O.
          for (let checkpoint = 0; checkpoint < 8; checkpoint += 1) await Promise.resolve()
        }
      } else if (!passiveCompleted && (observationClosureTriggered || sourceAborted)) {
        controller.dispatch({ kind: 'resource-completion', operationOrdinal, state: 'completed', result: passiveResult })
        passiveCompleted = true
        if (sourceAborted) {
          const captureCompleted = completedSourceEntries === sourcePlan.preflight.length
          sourcePhase = captureCompleted ? 'post-cleanup' : 'source-closing'
          sourceScript = captureCompleted ? transform(sourcePlan.verification('post-cleanup'), sourcePhase) : sourcePlan.closingAfterPrefix(completedSourceEntries)
          sourceIndex = 0
          closingGenerated = !captureCompleted
        } else if (postSettlementCompleted) {
          sourcePhase = 'post-cleanup'
          sourceScript = transform(sourcePlan.verification('post-cleanup'), sourcePhase)
          sourceIndex = 0
        } else {
          sourcePhase = 'post-settlement'
          sourceScript = transform(sourcePlan.verification('post-settlement'), sourcePhase)
          sourceIndex = 0
        }
        lastActivityTurn = turn
      }
    }
    if (turn - lastActivityTurn > 4096) {
      const liveTimers = controller.snapshot().liveOrdinals.timers
      if (liveTimers.length === 1 && (sourceAborted || closingGenerated)) {
        controller.dispatch({ kind: 'timer-fire', timerOrdinal: liveTimers[0] })
        lastActivityTurn = turn
      } else g36HarnessAssert.fail(`virtual scenario stopped making bounded progress in ${sourcePhase}`)
    }
    await Promise.resolve()
  }
  g36HarnessAssert.notEqual(outcome, null, 'virtual scenario exhausted the finite microtask budget')
  // A sampled deadline invalidates a timer producer without claiming that its
  // native callback has already arrived. Deliver those known fixture tokens
  // after settlement and verify the productive terminal state stays inert.
  const terminalClockReads = controller.snapshot().callCounts.clock.readControllerNanoseconds
  for (const timerOrdinal of controller.snapshot().liveOrdinals.timers) controller.dispatch({ kind: 'timer-fire', timerOrdinal })
  g36HarnessAssert.equal(controller.snapshot().callCounts.clock.readControllerNanoseconds, terminalClockReads)
  return { owner, outcome, fixtureSnapshot: controller.snapshot(), completedSourceEntries }
}

function registerAdapterHarnessBaselineTests({ test, assert, loadSourceFixtureFiles }) {
  for (const entry of ['owner', 'factory']) for (const scenario of ['capture-cap', 'setup-cap']) {
    /* ADR0038:register:test */ g36CaseTest('L728', 'registerAdapterHarnessBaselineTests', `ADR 0036 harness baseline: ${entry}/${scenario}`, { concurrency: false }, async () => {
      await withAdapterCopy('virtual-runtime-conformance', null, async (namespace) => {
        const sourcePlan = createAdapterSourceFixturePlan(await loadSourceFixtureFiles())
        const result = await runVirtualAdapterScenario(namespace, { entry, sourcePlan, scenario })
        assert.equal(result.completedSourceEntries, sourcePlan.preflight.length)
        assert.equal(result.outcome.kind, 'error')
        assert.equal(Object.getPrototypeOf(result.outcome.error), Error.prototype)
        assert.deepEqual(Reflect.ownKeys(result.outcome.error), ['message'])
        assert.equal(result.outcome.error.message, 'browserSyncTransportRuntimeDiagnosticAdapterFailed')
        assert.equal(result.fixtureSnapshot.callCounts.launcher.spawnChild, 3)
        assert.equal(result.fixtureSnapshot.callCounts.pipe.writeDebugPipe, scenario === 'capture-cap' ? 6 : 1)
        assert.equal(result.fixtureSnapshot.fixtureOwnedByteLength, 0)
        assert.deepEqual(result.fixtureSnapshot.liveOrdinals.resources, [])
        assert.deepEqual(result.fixtureSnapshot.liveOrdinals.resourceOperations, [])
        if (entry === 'factory') assert.equal(result.owner, null)
        else {
          assert.equal(result.owner.attemptStarted, true)
          assert.equal(result.owner.notificationCount, 1)
          assert.notEqual(result.owner.adapterObservationSnapshot, null)
          assert.equal(result.owner.finalizationCount, 1)
          assert.equal(result.owner.ownerFinalizationCount, 1)
          assert.equal(result.owner.writerCallCount, 0)
          assert.equal(result.owner.terminalOutcome.evidenceStatus, 'NOT_EVIDENCE')
          assert.equal(result.owner.cleanupLedger.terminal, true)
          assert.equal(result.owner.fifoMaterialBytes, 0)
        }
      })
    })
  }
}

import g36FixtureAssert from 'node:assert/strict'
import g36FixtureTest from 'node:test'

const g36FixtureApply = Reflect.apply
const g36FixtureTypedArrayPrototype = Object.getPrototypeOf(Uint8Array.prototype)
const g36FixtureTypedArrayTag = Object.getOwnPropertyDescriptor(g36FixtureTypedArrayPrototype, Symbol.toStringTag).get
const g36FixtureTypedArrayBuffer = Object.getOwnPropertyDescriptor(g36FixtureTypedArrayPrototype, 'buffer').get
const g36FixtureTypedArrayLength = Object.getOwnPropertyDescriptor(g36FixtureTypedArrayPrototype, 'byteLength').get
const g36FixtureTypedArrayOffset = Object.getOwnPropertyDescriptor(g36FixtureTypedArrayPrototype, 'byteOffset').get
const g36FixtureArrayBufferLength = Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'byteLength').get
const g36FixtureArrayBufferResizable = Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'resizable').get
const g36FixtureTypedArraySet = Uint8Array.prototype.set

const g36FixtureEnvironmentNames = Object.freeze(['NODE_OPTIONS', 'SystemRoot', 'WINDIR', 'ComSpec', 'PATHEXT', 'Path', 'TEMP', 'TMP', 'LOCALAPPDATA', 'ProgramFiles', 'ProgramFiles(x86)', 'ProgramW6432'])
const g36FixtureMethodGroups = Object.freeze({
  entropy: Object.freeze({ readDiagnosticRunIdEntropyBytes: 0, readReplayContextIdEntropyBytes: 0 }),
  clock: Object.freeze({ readControllerNanoseconds: 0, readWallMilliseconds: 0, readTimeZone: 0 }),
  runtime: Object.freeze({ readProcessPlatform: 0, readProcessArchitecture: 0, readProcessVersion: 0, readProcessExecutablePath: 0, readProcessExecArguments: 0, readProcessEnvironmentMatches: 1, readWorkingDirectory: 0 }),
  scheduler: Object.freeze({ armTimer: 2, cancelTimer: 1 }),
  pipe: Object.freeze({ openDebugPipe: 2, writeDebugPipe: 3, closeDebugPipe: 1 }),
  launcher: Object.freeze({ spawnChild: 2, terminateChild: 1, closeChild: 1 }),
  resources: Object.freeze({ performResourceOperation: 2, closeResource: 2 }),
})
const g36FixtureOperationInputs = Object.freeze({
  'canonicalize-path': ['path'], 'inspect-path': ['path'], 'open-resource': ['path', 'expectedType'],
  'inspect-open-resource': ['resourceHandle'], 'read-resource': ['resourceHandle', 'offset', 'maximumByteLength'],
  'list-directory': ['resourceHandle', 'maximumEntries'], 'create-temporary-root': ['parentPath', 'prefix'],
  'create-directory-exclusive': ['parentHandle', 'name'], 'create-file-exclusive': ['parentHandle', 'name', 'bytes'],
  'passive-tcp-listeners': ['endpoints'],
})
const g36FixtureIdentityKeys = Object.freeze(['pathType', 'volumeId', 'fileId', 'byteLength', 'modifiedTimeNanoseconds', 'changeTimeNanoseconds', 'reparsePoint'])

const g36FixtureStateErrors = new WeakSet()
function g36FixtureInvalid() { throw new TypeError('browserSyncTransportRuntimeDiagnosticVirtualDispatchInvalid') }
function g36FixtureStateInvalid() {
  const error = new Error('browserSyncTransportRuntimeDiagnosticVirtualDispatchStateInvalid')
  g36FixtureStateErrors.add(error)
  throw error
}
function g36FixtureCheck(valid) { if (!valid) g36FixtureInvalid() }
function g36FixtureState(valid) { if (!valid) g36FixtureStateInvalid() }
function g36FixtureExact(value, names) {
  if (value === null || typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype) return false
  const keys = Reflect.ownKeys(value)
  return keys.length === names.length && names.every((name, index) => {
    const descriptor = Object.getOwnPropertyDescriptor(value, name)
    return keys[index] === name && descriptor && Object.hasOwn(descriptor, 'value') && descriptor.enumerable
  })
}
function g36FixtureOwnArray(value, maximum = 4096) {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype || value.length > maximum) return false
  const keys = Reflect.ownKeys(value)
  if (keys.length !== value.length + 1 || keys[value.length] !== 'length') return false
  return Array.from({ length: value.length }, (_, index) => {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index))
    return keys[index] === String(index) && descriptor && Object.hasOwn(descriptor, 'value') && descriptor.enumerable
  }).every(Boolean)
}
function g36FixtureBytes(value, maximum) {
  if (value === null || typeof value !== 'object' || Object.getPrototypeOf(value) !== Uint8Array.prototype) return false
  try {
    if (g36FixtureApply(g36FixtureTypedArrayTag, value, []) !== 'Uint8Array') return false
    const buffer = g36FixtureApply(g36FixtureTypedArrayBuffer, value, [])
    const length = g36FixtureApply(g36FixtureTypedArrayLength, value, [])
    if (Object.getPrototypeOf(buffer) !== ArrayBuffer.prototype || g36FixtureApply(g36FixtureArrayBufferResizable, buffer, []) ||
      g36FixtureApply(g36FixtureTypedArrayOffset, value, []) !== 0 ||
      length !== g36FixtureApply(g36FixtureArrayBufferLength, buffer, []) || length > maximum || Reflect.ownKeys(value).length !== length) return false
    new Uint8Array(buffer, 0, 0)
    return true
  } catch { return false }
}
function g36FixtureCopyValidatedBytes(value) {
  const copy = new Uint8Array(g36FixtureApply(g36FixtureTypedArrayLength, value, []))
  g36FixtureApply(g36FixtureTypedArraySet, copy, [value])
  return copy
}
function g36FixtureClone(value, depth = 0) {
  g36FixtureCheck(depth <= 64)
  if (value === null || ['undefined', 'string', 'number', 'boolean', 'bigint'].includes(typeof value)) return value
  if (g36FixtureBytes(value, 1048576)) return g36FixtureCopyValidatedBytes(value)
  if (g36FixtureOwnArray(value)) return value.map((entry) => g36FixtureClone(entry, depth + 1))
  g36FixtureCheck(value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype)
  const names = Reflect.ownKeys(value)
  g36FixtureCheck(names.length <= 4096 && names.every((name) => typeof name === 'string'))
  const copy = {}
  for (const name of names) {
    const descriptor = Object.getOwnPropertyDescriptor(value, name)
    g36FixtureCheck(descriptor && Object.hasOwn(descriptor, 'value') && descriptor.enumerable)
    Object.defineProperty(copy, name, { value: g36FixtureClone(descriptor.value, depth + 1), enumerable: true, writable: true, configurable: true })
  }
  return copy
}
function g36FixtureByteLength(value) {
  // This accounting traversal receives only a just-created private normalized
  // graph. Its byte views were validated before copying; repeat enumeration
  // of every integer-index property adds no new boundary check.
  if (ArrayBuffer.isView(value)) return g36FixtureApply(g36FixtureTypedArrayLength, value, [])
  if (value === null || typeof value !== 'object') return 0
  return Object.values(value).reduce((total, entry) => total + g36FixtureByteLength(entry), 0)
}
function g36FixtureFreeze(value) {
  if (value !== null && typeof value === 'object') {
    for (const entry of Object.values(value)) g36FixtureFreeze(entry)
    Object.freeze(value)
  }
  return value
}
function g36FixturePath(value) { return typeof value === 'string' && value.length <= 32767 && !value.includes('\0') }
function g36FixtureName(value) { return typeof value === 'string' && !['.', '..'].includes(value) && !/[\0/\\]/.test(value) && new TextEncoder().encode(value).length >= 1 && new TextEncoder().encode(value).length <= 1024 }
function g36FixtureCount(value) { return Number.isSafeInteger(value) && value >= 0 }
function g36FixtureOrdinal(value) { return Number.isSafeInteger(value) && value > 0 }
function g36FixtureIdentity(value) {
  return g36FixtureExact(value, g36FixtureIdentityKeys) && ['regular-file', 'directory', 'other'].includes(value.pathType) &&
    ['volumeId', 'fileId', 'modifiedTimeNanoseconds', 'changeTimeNanoseconds'].every((name) => value[name] === null || typeof value[name] === 'string' && /^(0|[1-9][0-9]{0,63})$/.test(value[name])) &&
    g36FixtureCount(value.byteLength) && typeof value.reparsePoint === 'boolean'
}
function g36FixtureLaunchPolicy(profile) {
  const argumentBytes = profile.arguments.reduce((length, value) => length + new TextEncoder().encode(value).length, 0)
  if (profile.arguments.some((value) => value.includes('\0'))) return false
  const names = new Set()
  const environment = {}
  let byteLength = argumentBytes
  for (const match of profile.environment) {
    if (names.has(match.name.toLowerCase()) || match.name.includes('\0') || match.value.includes('\0')) return false
    names.add(match.name.toLowerCase())
    if (!g36FixtureEnvironmentNames.slice(1).includes(match.name) &&
      !(profile.role === 'vite' && match.name === 'NO_COLOR' && match.value === '1') &&
      !(profile.role === 'gateway' && match.name === 'GOLDENDAWN_SYNC_GATEWAY_PORT' && match.value === '8787') &&
      !(profile.role === 'gateway' && match.name === 'GOLDENDAWN_SYNC_GATEWAY_ALLOWED_ORIGIN' && match.value === 'http://127.0.0.1:5173')) return false
    byteLength += new TextEncoder().encode(match.name + match.value).length
    Object.defineProperty(environment, match.name, { value: match.value, enumerable: true })
  }
  if (byteLength > 65536) return false
  if (profile.role === 'vite') return profile.entryPath === `${profile.workingDirectory}\\node_modules\\vite\\bin\\vite.js` &&
    JSON.stringify(profile.arguments) === JSON.stringify(['--host', '127.0.0.1', '--port', '5173', '--strictPort']) && environment.NO_COLOR === '1'
  if (profile.role === 'gateway') return profile.entryPath === `${profile.workingDirectory}\\server\\startLocalSyncGateway.js` && profile.arguments.length === 0 &&
    environment.GOLDENDAWN_SYNC_GATEWAY_PORT === '8787' && environment.GOLDENDAWN_SYNC_GATEWAY_ALLOWED_ORIGIN === 'http://127.0.0.1:5173'
  return profile.executablePath === 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' &&
    profile.arguments.length === 7 && profile.arguments[0] === '--remote-debugging-pipe' && profile.arguments[1].startsWith('--user-data-dir=') && profile.arguments[1].length > 16 &&
    JSON.stringify(profile.arguments.slice(2)) === JSON.stringify(['--incognito', '--no-first-run', '--no-default-browser-check', '--new-window', 'http://127.0.0.1:5173/'])
}

function createVirtualRuntimeFixture() {/* ADR0038:sync */g36Registry.assertExecutable();/* ADR0038:end */
  g36FixtureCheck(arguments.length === 0)
  const sourceNames = [
    ...Object.keys(g36FixtureMethodGroups.entropy), ...Object.keys(g36FixtureMethodGroups.clock),
    ...Object.keys(g36FixtureMethodGroups.runtime).filter((name) => name !== 'readProcessEnvironmentMatches'),
    ...g36FixtureEnvironmentNames.map((name) => `process-environment:${name}`),
  ]
  const sourceQueues = new Map(sourceNames.map((name) => [name, []]))
  const sourceConsumed = new Set()
  const callCounts = Object.fromEntries(Object.entries(g36FixtureMethodGroups).map(([group, methods]) => [group, Object.fromEntries(Object.keys(methods).map((method) => [method, 0]))]))
  const effectfulNames = Object.keys(g36FixtureMethodGroups).slice(3).flatMap((group) => Object.keys(g36FixtureMethodGroups[group]))
  const byOrdinal = { timers: new Map(), debugPipes: new Map(), children: new Map(), resourceOperations: new Map(), resources: new Map() }
  const nextOrdinal = { timers: 0, debugPipes: 0, children: 0, resourceOperations: 0, resources: 0 }
  const handles = new WeakMap()
  let nextOperationId = 0
  let dispatchCount = 0
  let producerTurnCount = 0
  let fixtureOwnedByteLength = 0
  let failureArm = null
  let pipeEverOpened = false
  const spawnedRoles = new Set()
  const sink = (value) => typeof value === 'function' && value.length === 1
  const addHandle = (group, fields) => {
    const handle = Object.create(null)
    const ordinal = ++nextOrdinal[group]
    const entry = { ...fields, handle, ordinal, group, live: true }
    handles.set(handle, entry)
    byOrdinal[group].set(ordinal, entry)
    return entry
  }
  const retire = (entry) => { entry.live = false; byOrdinal[entry.group].delete(entry.ordinal); handles.delete(entry.handle) }
  const fromHandle = (handle, group) => {
    const entry = handles.get(handle)
    g36FixtureState(entry && entry.group === group && entry.live)
    return entry
  }
  const fromOrdinal = (ordinal, group) => {
    g36FixtureCheck(g36FixtureOrdinal(ordinal))
    const entry = byOrdinal[group].get(ordinal)
    g36FixtureState(entry && entry.live)
    return entry
  }
  const enter = (group, method, receiver, actualArity) => {
    g36FixtureCheck(receiver === undefined && actualArity === g36FixtureMethodGroups[group][method])
    callCounts[group][method] += 1
    if (failureArm === method) {
      failureArm = null
      if (method === 'performResourceOperation' || method === 'closeResource') nextOperationId += 1
      g36FixtureStateInvalid()
    }
  }
  const source = (name) => {
    const queue = sourceQueues.get(name)
    g36FixtureState(queue && queue.length > 0 && (name === 'readControllerNanoseconds' || !sourceConsumed.has(name)))
    const result = queue.shift()
    sourceConsumed.add(name)
    fixtureOwnedByteLength -= result.byteLength
    if (result.throw) g36FixtureStateInvalid()
    return result.value
  }
  const rawTurn = (producerSink, value) => {
    Reflect.apply(producerSink, undefined, [Object.freeze(value)])
    producerTurnCount += 1
  }
  const totalPendingWrites = () => [...byOrdinal.debugPipes.values()].filter((entry) => entry.writeResult !== null).length
  const entropy = Object.freeze({
    readDiagnosticRunIdEntropyBytes: function () { enter('entropy', 'readDiagnosticRunIdEntropyBytes', this, arguments.length); return source('readDiagnosticRunIdEntropyBytes') },
    readReplayContextIdEntropyBytes: function () { enter('entropy', 'readReplayContextIdEntropyBytes', this, arguments.length); return source('readReplayContextIdEntropyBytes') },
  })
  const clock = Object.freeze({
    readControllerNanoseconds: function () { enter('clock', 'readControllerNanoseconds', this, arguments.length); return source('readControllerNanoseconds') },
    readWallMilliseconds: function () { enter('clock', 'readWallMilliseconds', this, arguments.length); return source('readWallMilliseconds') },
    readTimeZone: function () { enter('clock', 'readTimeZone', this, arguments.length); return source('readTimeZone') },
  })
  const runtime = Object.freeze({
    readProcessPlatform: function () { enter('runtime', 'readProcessPlatform', this, arguments.length); return source('readProcessPlatform') },
    readProcessArchitecture: function () { enter('runtime', 'readProcessArchitecture', this, arguments.length); return source('readProcessArchitecture') },
    readProcessVersion: function () { enter('runtime', 'readProcessVersion', this, arguments.length); return source('readProcessVersion') },
    readProcessExecutablePath: function () { enter('runtime', 'readProcessExecutablePath', this, arguments.length); return source('readProcessExecutablePath') },
    readProcessExecArguments: function () { enter('runtime', 'readProcessExecArguments', this, arguments.length); return source('readProcessExecArguments') },
    readProcessEnvironmentMatches: function (name) {
      enter('runtime', 'readProcessEnvironmentMatches', this, arguments.length)
      g36FixtureCheck(g36FixtureEnvironmentNames.includes(name))
      return source(`process-environment:${name}`)
    },
    readWorkingDirectory: function () { enter('runtime', 'readWorkingDirectory', this, arguments.length); return source('readWorkingDirectory') },
  })
  const scheduler = Object.freeze({
    armTimer: function (callback, milliseconds) {
      enter('scheduler', 'armTimer', this, arguments.length)
      g36FixtureCheck(typeof callback === 'function' && callback.length === 0 && g36FixtureCount(milliseconds) && milliseconds <= 60000)
      return addHandle('timers', { callback, milliseconds }).handle
    },
    cancelTimer: function (handle) {
      enter('scheduler', 'cancelTimer', this, arguments.length)
      const entry = handles.get(handle)
      g36FixtureState(entry && entry.group === 'timers' && entry.live && !entry.cancelled)
      entry.cancelled = true
      retire(entry)
      return undefined
    },
  })
  const pipe = Object.freeze({
    openDebugPipe: function (childHandle, producerSink) {
      enter('pipe', 'openDebugPipe', this, arguments.length)
      const child = fromHandle(childHandle, 'children')
      g36FixtureCheck(sink(producerSink))
      g36FixtureState(child.role === 'chrome' && !pipeEverOpened)
      const entry = addHandle('debugPipes', { producerSink, writeResult: null, write: null })
      pipeEverOpened = true
      return entry.handle
    },
    writeDebugPipe: function (pair, bytes, completionSink) {
      enter('pipe', 'writeDebugPipe', this, arguments.length)
      const entry = fromHandle(pair, 'debugPipes')
      g36FixtureCheck(g36FixtureBytes(bytes, 65536) && sink(completionSink))
      g36FixtureState(entry.writeResult !== null && entry.write === null && entry.writeResult.acceptedByteLength <= bytes.byteLength)
      const result = entry.writeResult
      entry.writeResult = null
      entry.write = { completionSink, loan: bytes }
      return { acceptedByteLength: result.acceptedByteLength, backpressure: result.backpressure }
    },
    closeDebugPipe: function (pair) {
      enter('pipe', 'closeDebugPipe', this, arguments.length)
      const entry = fromHandle(pair, 'debugPipes')
      if (entry.write) { entry.write.loan = null; entry.write = null }
      entry.writeResult = null
      retire(entry)
      return undefined
    },
  })
  const launcher = Object.freeze({
    spawnChild: function (profile, producerSink) {
      enter('launcher', 'spawnChild', this, arguments.length)
      g36FixtureCheck(g36FixtureExact(profile, ['role', 'executablePath', 'entryPath', 'arguments', 'workingDirectory', 'environment', 'stdioProfile', 'windowsHide', 'shell', 'detached']) &&
        Object.isFrozen(profile) && ['vite', 'gateway', 'chrome'].includes(profile.role) && sink(producerSink) &&
        g36FixturePath(profile.executablePath) && g36FixturePath(profile.workingDirectory) &&
        (profile.role === 'chrome' ? profile.entryPath === null : g36FixturePath(profile.entryPath)) &&
        g36FixtureOwnArray(profile.arguments, 16) && Object.isFrozen(profile.arguments) && profile.arguments.every((value) => typeof value === 'string') &&
        g36FixtureOwnArray(profile.environment, 16) && Object.isFrozen(profile.environment) &&
        profile.environment.every((value) => g36FixtureExact(value, ['name', 'value']) && Object.isFrozen(value) && typeof value.name === 'string' && typeof value.value === 'string') &&
        profile.stdioProfile === (profile.role === 'chrome' ? 'chrome-debug-pipe-v1' : 'node-readiness-v1') &&
        profile.windowsHide === (profile.role !== 'chrome') && profile.shell === false && profile.detached === false)
      g36FixtureCheck(new TextEncoder().encode(profile.arguments.join('') + profile.environment.map((value) => value.name + value.value).join('')).length <= 65536)
      g36FixtureCheck(g36FixtureLaunchPolicy(profile))
      g36FixtureState(!spawnedRoles.has(profile.role))
      const entry = addHandle('children', { producerSink, role: profile.role, exited: false, terminated: false })
      spawnedRoles.add(profile.role)
      return entry.handle
    },
    terminateChild: function (handle) {
      enter('launcher', 'terminateChild', this, arguments.length)
      const entry = fromHandle(handle, 'children')
      g36FixtureState(!entry.terminated)
      entry.terminated = true
      return undefined
    },
    closeChild: function (handle) {
      enter('launcher', 'closeChild', this, arguments.length)
      retire(fromHandle(handle, 'children'))
      return undefined
    },
  })
  const resources = Object.freeze({
    performResourceOperation: function (operation, producerSink) {
      enter('resources', 'performResourceOperation', this, arguments.length)
      g36FixtureCheck(g36FixtureExact(operation, ['operationId', 'kind', 'input']) && Object.isFrozen(operation) &&
        Object.hasOwn(g36FixtureOperationInputs, operation.kind) &&
        g36FixtureExact(operation.input, g36FixtureOperationInputs[operation.kind]) && Object.isFrozen(operation.input) && sink(producerSink))
      g36FixtureState(operation.operationId === nextOperationId + 1 && g36FixtureOrdinal(operation.operationId))
      const input = operation.input
      if (Object.hasOwn(input, 'path')) g36FixtureCheck(g36FixturePath(input.path))
      if (Object.hasOwn(input, 'parentPath')) g36FixtureCheck(g36FixturePath(input.parentPath))
      if (Object.hasOwn(input, 'resourceHandle')) fromHandle(input.resourceHandle, 'resources')
      if (Object.hasOwn(input, 'parentHandle')) fromHandle(input.parentHandle, 'resources')
      if (Object.hasOwn(input, 'expectedType')) g36FixtureCheck(['regular-file', 'directory'].includes(input.expectedType))
      if (Object.hasOwn(input, 'offset')) g36FixtureCheck(g36FixtureCount(input.offset))
      if (Object.hasOwn(input, 'maximumByteLength')) g36FixtureCheck(g36FixtureCount(input.maximumByteLength) && input.maximumByteLength <= 1048576)
      if (Object.hasOwn(input, 'maximumEntries')) g36FixtureCheck(g36FixtureCount(input.maximumEntries) && input.maximumEntries <= 4096)
      if (Object.hasOwn(input, 'name')) g36FixtureCheck(g36FixtureName(input.name))
      if (Object.hasOwn(input, 'prefix')) g36FixtureCheck(typeof input.prefix === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(input.prefix))
      if (Object.hasOwn(input, 'bytes')) g36FixtureCheck(g36FixtureBytes(input.bytes, 1048576))
      if (operation.kind === 'passive-tcp-listeners') g36FixtureCheck(g36FixtureOwnArray(input.endpoints, 2) && input.endpoints.length === 2 && Object.isFrozen(input.endpoints) &&
        input.endpoints.every((entry, index) => g36FixtureExact(entry, ['address', 'port']) && Object.isFrozen(entry) && entry.address === '127.0.0.1' && entry.port === [5173, 8787][index]))
      const entry = addHandle('resourceOperations', { operationId: operation.operationId, kind: operation.kind, input, producerSink })
      nextOperationId = operation.operationId
      return entry.handle
    },
    closeResource: function (handle, producerSink) {
      enter('resources', 'closeResource', this, arguments.length)
      const resource = fromHandle(handle, 'resources')
      g36FixtureCheck(sink(producerSink))
      g36FixtureState(!resource.closing)
      resource.closing = true
      const entry = addHandle('resourceOperations', { operationId: ++nextOperationId, kind: 'close-resource', input: { resourceHandle: handle }, producerSink, closingResource: resource })
      return entry.handle
    },
  })
  const runtimeCapabilities = Object.freeze({ profile: 'adr-0036-runtime-capabilities-v1', entropy, clock, runtime, scheduler, pipe, launcher, resources })
  const resourceResult = (entry, result) => {
    const kinds = {
      'canonicalize-path': ['canonical-path', ['kind', 'path']], 'inspect-path': ['path-identity', ['kind', ...g36FixtureIdentityKeys]],
      'open-resource': ['resource-opened', ['kind']], 'inspect-open-resource': ['open-resource-identity', ['kind', ...g36FixtureIdentityKeys]],
      'read-resource': ['resource-bytes', ['kind', 'bytes', 'endOfFile']], 'list-directory': ['directory-entries', ['kind', 'entries']],
      'create-temporary-root': ['resource-created', ['kind', 'path', 'pathIdentity']], 'create-directory-exclusive': ['resource-created', ['kind', 'path', 'pathIdentity']],
      'create-file-exclusive': ['resource-created', ['kind', 'path', 'pathIdentity']], 'passive-tcp-listeners': ['passive-tcp-listeners', ['kind', 'endpoints']],
      'close-resource': ['resource-closed', ['kind']],
    }
    const [kind, names] = kinds[entry.kind]
    g36FixtureCheck(g36FixtureExact(result, names) && result.kind === kind)
    if (Object.hasOwn(result, 'path')) g36FixtureCheck(g36FixturePath(result.path))
    if (Object.hasOwn(result, 'pathIdentity')) g36FixtureCheck(g36FixtureIdentity(result.pathIdentity))
    if (kind === 'path-identity' || kind === 'open-resource-identity') {
      const identity = Object.fromEntries(g36FixtureIdentityKeys.map((name) => [name, result[name]]))
      g36FixtureCheck(g36FixtureIdentity(identity))
    }
    if (kind === 'resource-bytes') {
      g36FixtureCheck(g36FixtureBytes(result.bytes, entry.input.maximumByteLength) && typeof result.endOfFile === 'boolean')
      return { kind, bytes: g36FixtureCopyValidatedBytes(result.bytes), endOfFile: result.endOfFile }
    }
    if (kind === 'directory-entries') g36FixtureCheck(g36FixtureOwnArray(result.entries, entry.input.maximumEntries) && result.entries.every((value) =>
      g36FixtureExact(value, ['name', 'pathType', 'reparsePoint']) && typeof value.name === 'string' && !value.name.includes('\0') &&
      new TextEncoder().encode(value.name).length <= 1024 && ['regular-file', 'directory', 'other'].includes(value.pathType) && typeof value.reparsePoint === 'boolean'))
    if (kind === 'passive-tcp-listeners') g36FixtureCheck(g36FixtureOwnArray(result.endpoints, 2) && result.endpoints.length === 2 && result.endpoints.every((value, index) =>
      g36FixtureExact(value, ['address', 'port', 'state']) && value.address === '127.0.0.1' && value.port === [5173, 8787][index] && ['free', 'occupied', 'unavailable'].includes(value.state)))
    return g36FixtureClone(result)
  }
  function dispatchChecked(profile) {
    g36FixtureCheck(arguments.length === 1 && profile !== null && typeof profile === 'object' && Object.getPrototypeOf(profile) === Object.prototype)
    const kindDescriptor = Object.getOwnPropertyDescriptor(profile, 'kind')
    g36FixtureCheck(kindDescriptor && Object.hasOwn(kindDescriptor, 'value'))
    const kind = kindDescriptor.value
    const variants = {
      'source-return': ['kind', 'source', 'value'], 'source-throw': ['kind', 'source'], 'fail-next-capability-call': ['kind', 'capability'],
      'timer-fire': ['kind', 'timerOrdinal'], 'pipe-chunk': ['kind', 'pipeOrdinal', 'bytes'],
      'pipe-eof': ['kind', 'pipeOrdinal'], 'pipe-read-error': ['kind', 'pipeOrdinal'], 'pipe-write-error': ['kind', 'pipeOrdinal'], 'pipe-drain': ['kind', 'pipeOrdinal'],
      'pipe-write-result': ['kind', 'pipeOrdinal', 'acceptedByteLength', 'backpressure'], 'pipe-write-completion': ['kind', 'pipeOrdinal', 'state'],
      'child-stdout': ['kind', 'childOrdinal', 'bytes'], 'child-stderr': ['kind', 'childOrdinal', 'bytes'],
      'child-exit': ['kind', 'childOrdinal', 'code', 'signal'], 'child-close': ['kind', 'childOrdinal', 'code', 'signal'], 'child-error': ['kind', 'childOrdinal'],
      'resource-completion': ['kind', 'operationOrdinal', 'state', 'result'],
    }
    g36FixtureCheck(typeof kind === 'string' && Object.hasOwn(variants, kind) && g36FixtureExact(profile, variants[kind]))
    if (kind === 'source-return' || kind === 'source-throw') {
      g36FixtureCheck(typeof profile.source === 'string' && sourceQueues.has(profile.source))
      const queue = sourceQueues.get(profile.source)
      g36FixtureState(profile.source === 'readControllerNanoseconds' || queue.length === 0 && !sourceConsumed.has(profile.source))
      const value = kind === 'source-return' ? g36FixtureClone(profile.value) : null
      const byteLength = g36FixtureByteLength(value)
      queue.push({ value, throw: kind === 'source-throw', byteLength })
      fixtureOwnedByteLength += byteLength
      dispatchCount += 1
      return undefined
    }
    if (kind === 'fail-next-capability-call') {
      g36FixtureCheck(effectfulNames.includes(profile.capability))
      g36FixtureState(failureArm === null && (profile.capability !== 'writeDebugPipe' || totalPendingWrites() === 0))
      failureArm = profile.capability
      dispatchCount += 1
      return undefined
    }
    if (kind === 'timer-fire') {
      const entry = fromOrdinal(profile.timerOrdinal, 'timers')
      retire(entry)
      dispatchCount += 1
      Reflect.apply(entry.callback, undefined, [])
      return undefined
    }
    if (kind.startsWith('pipe-')) {
      const entry = fromOrdinal(profile.pipeOrdinal, 'debugPipes')
      if (kind === 'pipe-write-result') {
        g36FixtureCheck(g36FixtureCount(profile.acceptedByteLength) && profile.acceptedByteLength <= 65536 && typeof profile.backpressure === 'boolean')
        g36FixtureState(entry.writeResult === null && failureArm !== 'writeDebugPipe')
        entry.writeResult = { acceptedByteLength: profile.acceptedByteLength, backpressure: profile.backpressure }
        dispatchCount += 1
        return undefined
      }
      if (kind === 'pipe-write-completion') {
        g36FixtureCheck(['completed', 'failed'].includes(profile.state))
        g36FixtureState(entry.write !== null)
        const completionSink = entry.write.completionSink
        entry.write.loan = null
        entry.write = null
        dispatchCount += 1
        Reflect.apply(completionSink, undefined, [Object.freeze({ state: profile.state })])
        return undefined
      }
      let bytes = null
      if (kind === 'pipe-chunk') { g36FixtureCheck(g36FixtureBytes(profile.bytes, 65536)); bytes = g36FixtureCopyValidatedBytes(profile.bytes) }
      const rawKind = { 'pipe-chunk': 'read-chunk', 'pipe-eof': 'read-eof', 'pipe-read-error': 'read-error', 'pipe-write-error': 'write-error', 'pipe-drain': 'drain' }[kind]
      dispatchCount += 1
      fixtureOwnedByteLength += bytes?.byteLength ?? 0
      try { rawTurn(entry.producerSink, bytes ? { kind: rawKind, bytes } : { kind: rawKind }) }
      finally { fixtureOwnedByteLength -= bytes?.byteLength ?? 0 }
      return undefined
    }
    if (kind.startsWith('child-')) {
      const entry = fromOrdinal(profile.childOrdinal, 'children')
      let bytes = null
      if (kind === 'child-stdout' || kind === 'child-stderr') { g36FixtureCheck(g36FixtureBytes(profile.bytes, 65536)); bytes = g36FixtureCopyValidatedBytes(profile.bytes) }
      if (kind === 'child-exit' || kind === 'child-close') g36FixtureCheck((profile.code === null || Number.isInteger(profile.code) && profile.code >= -2147483648 && profile.code <= 2147483647) &&
        (profile.signal === null || typeof profile.signal === 'string' && /^[\x20-\x7e]{0,32}$/.test(profile.signal)))
      if (kind === 'child-exit') { g36FixtureState(!entry.exited); entry.exited = true }
      if (kind === 'child-close') retire(entry)
      const rawKind = kind.slice(6)
      const raw = bytes ? { kind: rawKind, bytes } : kind === 'child-exit' || kind === 'child-close' ? { kind: rawKind, code: profile.code, signal: profile.signal } : { kind: rawKind }
      dispatchCount += 1
      fixtureOwnedByteLength += bytes?.byteLength ?? 0
      try { rawTurn(entry.producerSink, raw) }
      finally { fixtureOwnedByteLength -= bytes?.byteLength ?? 0 }
      return undefined
    }
    const entry = fromOrdinal(profile.operationOrdinal, 'resourceOperations')
    g36FixtureCheck(['completed', 'failed'].includes(profile.state) && (profile.state !== 'failed' || profile.result === null))
    let result = profile.state === 'completed' ? resourceResult(entry, profile.result) : null
    const byteLength = g36FixtureByteLength(result)
    let createdResource = null
    if (result?.kind === 'resource-opened' || result?.kind === 'resource-created') {
      // This handle is the only field the caller cannot supply in a completion.
      const handle = Object.create(null)
      const ordinal = nextOrdinal.resources + 1
      createdResource = { handle, ordinal, group: 'resources', live: false, closing: false }
      result = result.kind === 'resource-opened' ? { kind: result.kind, resourceHandle: handle } :
        { kind: result.kind, path: result.path, resourceHandle: handle, pathIdentity: Object.freeze(result.pathIdentity) }
    }
    if (result?.entries) { for (const value of result.entries) Object.freeze(value); Object.freeze(result.entries) }
    if (result?.endpoints) { for (const value of result.endpoints) Object.freeze(value); Object.freeze(result.endpoints) }
    if (result) Object.freeze(result)
    retire(entry)
    dispatchCount += 1
    fixtureOwnedByteLength += byteLength
    try {
      rawTurn(entry.producerSink, { operationId: entry.operationId, state: profile.state, result })
      if (createdResource) {
        nextOrdinal.resources = createdResource.ordinal
        createdResource.live = true
        handles.set(createdResource.handle, createdResource)
        byOrdinal.resources.set(createdResource.ordinal, createdResource)
      }
      if (entry.closingResource && profile.state === 'completed') retire(entry.closingResource)
    } finally { fixtureOwnedByteLength -= byteLength }
    return undefined
  }
  function dispatch(profile) {
    g36FixtureCheck(arguments.length === 1)
    try { return dispatchChecked(profile) }
    catch (error) {
      if (g36FixtureStateErrors.has(error)) throw error
      g36FixtureInvalid()
    }
  }
  function snapshot() {
    g36FixtureCheck(arguments.length === 0)
    const liveOrdinals = Object.fromEntries(Object.entries(byOrdinal).map(([group, entries]) => {
      const ordinals = [...entries.keys()]
      // Normal insertion is monotone. Retain the numeric-sort fallback for
      // resource handles published after a potentially reentrant raw sink.
      for (let index = 1; index < ordinals.length; index += 1) {
        if (ordinals[index - 1] > ordinals[index]) {
          ordinals.sort((left, right) => left - right)
          break
        }
      }
      return [group, Object.freeze(ordinals)]
    }))
    // The closed snapshot contains only primitive leaves. Freeze each freshly
    // copied container directly without enumerating every live ordinal twice.
    return Object.freeze({
      profile: 'adr-0036-virtual-runtime-snapshot-v1', dispatchCount,
      pendingSourceResultCount: [...sourceQueues.values()].reduce((count, queue) => count + queue.length, 0),
      pendingCapabilityFailureArmCount: failureArm === null ? 0 : 1,
      pendingPipeWriteResultCount: totalPendingWrites(),
      callCounts: Object.freeze(Object.fromEntries(Object.entries(callCounts).map(([group, methods]) => [group, Object.freeze({ ...methods })]))),
      liveOrdinals: Object.freeze(liveOrdinals),
      producerTurnCount, fixtureOwnedByteLength,
    })
  }
  return Object.freeze({ runtimeCapabilities, controller: Object.freeze({ dispatch, snapshot }) })
}

/* ADR0038:register:g36FixtureTest */ g36CaseTest('L1280', 'fixture', 'ADR 0036: virtuelle Capabilityprofile und Controller bleiben geschlossen und inaktiv', () => {
  const first = createVirtualRuntimeFixture()
  const second = createVirtualRuntimeFixture()
  g36FixtureAssert.notEqual(first.runtimeCapabilities, second.runtimeCapabilities)
  g36FixtureAssert.deepEqual(Reflect.ownKeys(first.runtimeCapabilities), ['profile', ...Object.keys(g36FixtureMethodGroups)])
  g36FixtureAssert.deepEqual(Reflect.ownKeys(first.controller), ['dispatch', 'snapshot'])
  g36FixtureAssert.equal(first.controller.dispatch.length, 1)
  g36FixtureAssert.equal(first.controller.snapshot.length, 0)
  g36FixtureAssert.ok(Object.isFrozen(first.runtimeCapabilities) && Object.isFrozen(first.controller))
  for (const [group, methods] of Object.entries(g36FixtureMethodGroups)) {
    g36FixtureAssert.deepEqual(Reflect.ownKeys(first.runtimeCapabilities[group]), Object.keys(methods))
    g36FixtureAssert.ok(Object.isFrozen(first.runtimeCapabilities[group]))
    for (const [name, arity] of Object.entries(methods)) g36FixtureAssert.equal(first.runtimeCapabilities[group][name].length, arity)
  }
  const snap = first.controller.snapshot()
  g36FixtureAssert.deepEqual(Reflect.ownKeys(snap), ['profile', 'dispatchCount', 'pendingSourceResultCount', 'pendingCapabilityFailureArmCount', 'pendingPipeWriteResultCount', 'callCounts', 'liveOrdinals', 'producerTurnCount', 'fixtureOwnedByteLength'])
  g36FixtureAssert.equal(snap.dispatchCount, 0)
  g36FixtureAssert.equal(snap.fixtureOwnedByteLength, 0)
  g36FixtureAssert.ok(Object.values(snap.callCounts).every((methods) => Object.values(methods).every((count) => count === 0)))
  const fresh = first.controller.snapshot()
  g36FixtureAssert.deepEqual(fresh, snap)
  for (const value of [snap, fresh, snap.callCounts, fresh.callCounts, snap.liveOrdinals, fresh.liveOrdinals]) {
    g36FixtureAssert.equal(Object.getPrototypeOf(value), Object.prototype)
    g36FixtureAssert.ok(Object.isFrozen(value))
  }
  g36FixtureAssert.notEqual(snap, fresh)
  for (const root of ['callCounts', 'liveOrdinals']) {
    g36FixtureAssert.notEqual(snap[root], fresh[root])
    for (const group of Object.keys(snap[root])) {
      g36FixtureAssert.notEqual(snap[root][group], fresh[root][group])
      g36FixtureAssert.ok(Object.isFrozen(snap[root][group]) && Object.isFrozen(fresh[root][group]))
      g36FixtureAssert.equal(Object.getPrototypeOf(snap[root][group]), root === 'callCounts' ? Object.prototype : Array.prototype)
    }
  }
  g36FixtureAssert.throws(() => { snap.callCounts.clock.readControllerNanoseconds = 1 }, TypeError)
  g36FixtureAssert.throws(() => { snap.liveOrdinals.resources.push(1) }, TypeError)
  g36FixtureAssert.deepEqual(first.controller.snapshot(), fresh)
})

/* ADR0038:register:g36FixtureTest */ g36CaseTest('L1319', 'fixture', 'ADR 0036: Fixture verwirft fremde Formen ohne Zustand oder Producerturn', () => {
  const fixture = createVirtualRuntimeFixture()
  const invalids = [null, [], 1, {}, { kind: 'cdp-message' }, { kind: 'cap-fired' }, { kind: 'connection-closed' }, { kind: 'cleanup-fact' },
    { kind: 'source-return', source: 'readTimeZone', value: 'UTC', extra: true },
    { kind: 'source-return', source: 'process-environment:PATH', value: [] },
    { kind: 'timer-fire', timerOrdinal: 0 }, { kind: 'timer-fire', timerOrdinal: 1.5 },
    Object.defineProperty({}, 'kind', { get() { throw new Error('MUST_NOT_READ') }, enumerable: true })]
  for (const value of invalids) {/* ADR0038:sync */g36Variant('fixture-invalid-dispatch',['null','array','number','empty-record','cdp-message','cap-fired','connection-closed','cleanup-fact','source-extra-key','environment-case','timer-zero','timer-fractional','kind-accessor'][invalids.indexOf(value)]);/* ADR0038:end */
    const before = fixture.controller.snapshot()
    g36FixtureAssert.throws(() => fixture.controller.dispatch(value), { name: 'TypeError', message: 'browserSyncTransportRuntimeDiagnosticVirtualDispatchInvalid' })
    g36FixtureAssert.deepEqual(fixture.controller.snapshot(), before)
  }
  const before = fixture.controller.snapshot()
  g36FixtureAssert.throws(() => fixture.controller.dispatch({ kind: 'timer-fire', timerOrdinal: 1 }), { name: 'Error', message: 'browserSyncTransportRuntimeDiagnosticVirtualDispatchStateInvalid' })
  g36FixtureAssert.deepEqual(fixture.controller.snapshot(), before)
})

/* ADR0038:register:g36FixtureTest */ g36CaseTest('L1336', 'fixture', 'ADR 0036: Fixture kopiert Quellenbytes und konsumiert Clock-FIFO ohne versteckte Reads', () => {
  const fixture = createVirtualRuntimeFixture()
  const bytes = new Uint8Array(17).fill(9)
  fixture.controller.dispatch({ kind: 'source-return', source: 'readDiagnosticRunIdEntropyBytes', value: bytes })
  bytes.fill(1)
  g36FixtureAssert.equal(fixture.controller.snapshot().fixtureOwnedByteLength, 17)
  const before = fixture.controller.snapshot()
  g36FixtureAssert.throws(() => fixture.controller.dispatch({ kind: 'source-throw', source: 'readDiagnosticRunIdEntropyBytes' }), /VirtualDispatchStateInvalid/)
  g36FixtureAssert.deepEqual(fixture.controller.snapshot(), before)
  const actual = Reflect.apply(fixture.runtimeCapabilities.entropy.readDiagnosticRunIdEntropyBytes, undefined, [])
  g36FixtureAssert.equal(actual[0], 9)
  g36FixtureAssert.notEqual(actual, bytes)
  g36FixtureAssert.equal(fixture.controller.snapshot().fixtureOwnedByteLength, 0)
  for (const value of [100n, 6099n, 6100n, 6101n]) /* ADR0038:sync */{g36Variant('fixture-clock-enqueue',value);/* ADR0038:end */fixture.controller.dispatch({ kind: 'source-return', source: 'readControllerNanoseconds', value })/* ADR0038:sync */}/* ADR0038:end */
  for (const value of [100n, 6099n, 6100n, 6101n]) /* ADR0038:sync */{g36Variant('fixture-clock-consume',value);/* ADR0038:end */g36FixtureAssert.equal(Reflect.apply(fixture.runtimeCapabilities.clock.readControllerNanoseconds, undefined, []), value)/* ADR0038:sync */}/* ADR0038:end */
  g36FixtureAssert.equal(fixture.controller.snapshot().pendingSourceResultCount, 0)
  g36FixtureAssert.throws(() => Reflect.apply(fixture.runtimeCapabilities.clock.readControllerNanoseconds, undefined, []), /VirtualDispatchStateInvalid/)
})

/* ADR0038:register:g36FixtureTest */ g36CaseTest('L1355', 'fixture', 'ADR 0036: Fixture-Timer und Failurearm haben korrelierte einmalige Übergänge', () => {
  const fixture = createVirtualRuntimeFixture()
  let fired = 0
  const callback = function () { fired += 1 }
  fixture.controller.dispatch({ kind: 'fail-next-capability-call', capability: 'armTimer' })
  const before = fixture.controller.snapshot()
  g36FixtureAssert.throws(() => fixture.controller.dispatch({ kind: 'fail-next-capability-call', capability: 'spawnChild' }), /VirtualDispatchStateInvalid/)
  g36FixtureAssert.deepEqual(fixture.controller.snapshot(), before)
  g36FixtureAssert.throws(() => Reflect.apply(fixture.runtimeCapabilities.scheduler.armTimer, undefined, [callback, 6000]), /VirtualDispatchStateInvalid/)
  g36FixtureAssert.equal(fixture.controller.snapshot().pendingCapabilityFailureArmCount, 0)
  const handle = Reflect.apply(fixture.runtimeCapabilities.scheduler.armTimer, undefined, [callback, 6000])
  g36FixtureAssert.equal(fired, 0)
  fixture.controller.dispatch({ kind: 'timer-fire', timerOrdinal: fixture.controller.snapshot().liveOrdinals.timers[0] })
  g36FixtureAssert.equal(fired, 1)
  g36FixtureAssert.equal(fixture.controller.snapshot().producerTurnCount, 0)
  g36FixtureAssert.deepEqual(fixture.controller.snapshot().liveOrdinals.timers, [])
  g36FixtureAssert.throws(() => Reflect.apply(fixture.runtimeCapabilities.scheduler.cancelTimer, undefined, [handle]), /VirtualDispatchStateInvalid/)
  const pendingHandle = Reflect.apply(fixture.runtimeCapabilities.scheduler.armTimer, undefined, [callback, 6000])
  Reflect.apply(fixture.runtimeCapabilities.scheduler.cancelTimer, undefined, [pendingHandle])
  g36FixtureAssert.deepEqual(fixture.controller.snapshot().liveOrdinals.timers, [])
  g36FixtureAssert.equal(fired, 1)
  g36FixtureAssert.throws(() => Reflect.apply(fixture.runtimeCapabilities.scheduler.cancelTimer, undefined, [pendingHandle]), /VirtualDispatchStateInvalid/)
})

function g36FixtureSyntheticSpawn(role) {
  const workingDirectory = 'C:\\virtual\\GoldenDawn'
  const chrome = role === 'chrome'
  return g36FixtureFreeze({
    role,
    executablePath: chrome ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : 'C:\\virtual\\node.exe',
    entryPath: chrome ? null : `${workingDirectory}\\${role === 'vite' ? 'node_modules\\vite\\bin\\vite.js' : 'server\\startLocalSyncGateway.js'}`,
    arguments: chrome ? ['--remote-debugging-pipe', '--user-data-dir=C:\\virtual\\run\\profile', '--incognito', '--no-first-run', '--no-default-browser-check', '--new-window', 'http://127.0.0.1:5173/'] :
      role === 'vite' ? ['--host', '127.0.0.1', '--port', '5173', '--strictPort'] : [],
    workingDirectory,
    environment: role === 'vite' ? [{ name: 'NO_COLOR', value: '1' }] : role === 'gateway' ?
      [{ name: 'GOLDENDAWN_SYNC_GATEWAY_PORT', value: '8787' }, { name: 'GOLDENDAWN_SYNC_GATEWAY_ALLOWED_ORIGIN', value: 'http://127.0.0.1:5173' }] : [],
    stdioProfile: chrome ? 'chrome-debug-pipe-v1' : 'node-readiness-v1', windowsHide: !chrome, shell: false, detached: false,
  })
}
function g36FixtureSyntheticIdentity(pathType = 'regular-file', byteLength = 0) {
  return { pathType, volumeId: '1', fileId: '2', byteLength, modifiedTimeNanoseconds: '3', changeTimeNanoseconds: '4', reparsePoint: false }
}
function g36FixtureCall(fixture, group, method, ...argumentsList) {
  return Reflect.apply(fixture.runtimeCapabilities[group][method], undefined, argumentsList)
}
function g36FixtureOpenPipe(fixture, rawSink) {
  const childSink = function (raw) { void raw }
  const child = g36FixtureCall(fixture, 'launcher', 'spawnChild', g36FixtureSyntheticSpawn('chrome'), childSink)
  const pair = g36FixtureCall(fixture, 'pipe', 'openDebugPipe', child, rawSink)
  return { pair, pipeOrdinal: fixture.controller.snapshot().liveOrdinals.debugPipes[0], child }
}

for (const name of [
  ...Object.keys(g36FixtureMethodGroups.entropy), ...Object.keys(g36FixtureMethodGroups.clock),
  ...Object.keys(g36FixtureMethodGroups.runtime).filter((value) => value !== 'readProcessEnvironmentMatches'),
  ...g36FixtureEnvironmentNames.map((value) => `process-environment:${value}`),
]) {
  /* ADR0038:register:g36FixtureTest */ g36CaseTest('L1412', 'fixture', `ADR 0036: Fixture-Quelllabel ${name} bleibt exakt und einmalig konsumiert`, () => {
    const fixture = createVirtualRuntimeFixture()
    fixture.controller.dispatch({ kind: 'source-throw', source: name })
    let group = Object.keys(g36FixtureMethodGroups).find((value) => Object.hasOwn(g36FixtureMethodGroups[value], name))
    let method = name
    let args = []
    if (name.startsWith('process-environment:')) { group = 'runtime'; method = 'readProcessEnvironmentMatches'; args = [name.slice(20)] }
    g36FixtureAssert.throws(() => g36FixtureCall(fixture, group, method, ...args), /VirtualDispatchStateInvalid/)
    g36FixtureAssert.equal(fixture.controller.snapshot().pendingSourceResultCount, 0)
    if (name !== 'readControllerNanoseconds') g36FixtureAssert.throws(() => fixture.controller.dispatch({ kind: 'source-throw', source: name }), /VirtualDispatchStateInvalid/)
  })
}

for (const [group, methods] of Object.entries(g36FixtureMethodGroups).slice(3)) {
  for (const method of Object.keys(methods)) {
    /* ADR0038:register:g36FixtureTest */ g36CaseTest('L1427', 'fixture', `ADR 0036: Fixture-Failurearm trifft genau ${method} ohne Handle oder Signal`, () => {
      const fixture = createVirtualRuntimeFixture()
      fixture.controller.dispatch({ kind: 'fail-next-capability-call', capability: method })
      g36FixtureAssert.throws(() => g36FixtureCall(fixture, group, method, ...Array(methods[method]).fill(null)), /VirtualDispatchStateInvalid/)
      const after = fixture.controller.snapshot()
      g36FixtureAssert.equal(after.pendingCapabilityFailureArmCount, 0)
      g36FixtureAssert.equal(after.callCounts[group][method], 1)
      g36FixtureAssert.equal(after.producerTurnCount, 0)
      g36FixtureAssert.ok(Object.values(after.liveOrdinals).every((ordinals) => ordinals.length === 0))
    })
  }
}

for (const dispatchKind of ['pipe-chunk', 'pipe-eof', 'pipe-read-error', 'pipe-write-error', 'pipe-drain']) {
  /* ADR0038:register:g36FixtureTest */ g36CaseTest('L1441', 'fixture', `ADR 0036: ${dispatchKind} liefert ausschließlich seinen gebundenen Raw-Sink`, () => {
    const fixture = createVirtualRuntimeFixture()
    const seen = []
    let bytesDuringSink = null
    const rawSink = function (raw) { seen.push(raw); bytesDuringSink = fixture.controller.snapshot().fixtureOwnedByteLength }
    const { pipeOrdinal } = g36FixtureOpenPipe(fixture, rawSink)
    g36FixtureAssert.equal(seen.length, 0)
    const bytes = new Uint8Array([65, 0])
    const input = dispatchKind === 'pipe-chunk' ? { kind: dispatchKind, pipeOrdinal, bytes } : { kind: dispatchKind, pipeOrdinal }
    fixture.controller.dispatch(input)
    g36FixtureAssert.equal(seen.length, 1)
    g36FixtureAssert.equal(seen[0].kind, { 'pipe-chunk': 'read-chunk', 'pipe-eof': 'read-eof', 'pipe-read-error': 'read-error', 'pipe-write-error': 'write-error', 'pipe-drain': 'drain' }[dispatchKind])
    g36FixtureAssert.ok(Object.isFrozen(seen[0]))
    g36FixtureAssert.equal(fixture.controller.snapshot().producerTurnCount, 1)
    g36FixtureAssert.equal(fixture.controller.snapshot().fixtureOwnedByteLength, 0)
    g36FixtureAssert.equal(bytesDuringSink, dispatchKind === 'pipe-chunk' ? 2 : 0)
    if (dispatchKind === 'pipe-chunk') {
      g36FixtureAssert.notEqual(seen[0].bytes, bytes)
      bytes.fill(1)
      g36FixtureAssert.deepEqual([...seen[0].bytes], [65, 0])
    }
  })
}

for (const writeCase of [
  { acceptedByteLength: 3, backpressure: false, state: 'completed' },
  { acceptedByteLength: 3, backpressure: true, state: 'completed' },
  { acceptedByteLength: 1, backpressure: true, state: 'failed' },
  { acceptedByteLength: 0, backpressure: false, state: 'failed' },
]) {
  /* ADR0038:register:g36FixtureTest */ g36CaseTest('L1471', 'fixture', `ADR 0036: Pipeannahme ${writeCase.acceptedByteLength}/${writeCase.backpressure}/${writeCase.state} bleibt getrennt von Completion`, () => {
    const fixture = createVirtualRuntimeFixture()
    const raw = []
    const completed = []
    const rawSink = function (value) { raw.push(value) }
    const completionSink = function (value) { completed.push(value) }
    const { pair, pipeOrdinal } = g36FixtureOpenPipe(fixture, rawSink)
    const bytes = new Uint8Array([1, 2, 3])
    fixture.controller.dispatch({ kind: 'pipe-write-result', pipeOrdinal, acceptedByteLength: writeCase.acceptedByteLength, backpressure: writeCase.backpressure })
    const before = fixture.controller.snapshot()
    g36FixtureAssert.throws(() => fixture.controller.dispatch({ kind: 'fail-next-capability-call', capability: 'writeDebugPipe' }), /VirtualDispatchStateInvalid/)
    g36FixtureAssert.deepEqual(fixture.controller.snapshot(), before)
    const result = g36FixtureCall(fixture, 'pipe', 'writeDebugPipe', pair, bytes, completionSink)
    g36FixtureAssert.deepEqual(result, { acceptedByteLength: writeCase.acceptedByteLength, backpressure: writeCase.backpressure })
    g36FixtureAssert.equal(completed.length, 0)
    g36FixtureAssert.equal(fixture.controller.snapshot().pendingPipeWriteResultCount, 0)
    fixture.controller.dispatch({ kind: 'pipe-write-completion', pipeOrdinal, state: writeCase.state })
    g36FixtureAssert.deepEqual(completed, [Object.freeze({ state: writeCase.state })])
    g36FixtureAssert.equal(fixture.controller.snapshot().producerTurnCount, 0)
    fixture.controller.dispatch({ kind: 'pipe-write-error', pipeOrdinal })
    g36FixtureAssert.deepEqual(raw, [Object.freeze({ kind: 'write-error' })])
    const after = fixture.controller.snapshot()
    g36FixtureAssert.throws(() => fixture.controller.dispatch({ kind: 'pipe-write-completion', pipeOrdinal, state: writeCase.state }), /VirtualDispatchStateInvalid/)
    g36FixtureAssert.deepEqual(fixture.controller.snapshot(), after)
    g36FixtureAssert.deepEqual([...bytes], [1, 2, 3])
  })
}

/* ADR0038:register:g36FixtureTest */ g36CaseTest('L1499', 'fixture', 'ADR 0036: Pipezustandsfehler nehmen weder Dispatch noch zweite Writegeneration an', () => {
  const fixture = createVirtualRuntimeFixture()
  const rawSink = function (value) { void value }
  const completionSink = function (value) { void value }
  const { pair, pipeOrdinal } = g36FixtureOpenPipe(fixture, rawSink)
  fixture.controller.dispatch({ kind: 'fail-next-capability-call', capability: 'writeDebugPipe' })
  const before = fixture.controller.snapshot()
  g36FixtureAssert.throws(() => fixture.controller.dispatch({ kind: 'pipe-write-result', pipeOrdinal, acceptedByteLength: 1, backpressure: false }), /VirtualDispatchStateInvalid/)
  g36FixtureAssert.deepEqual(fixture.controller.snapshot(), before)
  g36FixtureAssert.throws(() => g36FixtureCall(fixture, 'pipe', 'writeDebugPipe', pair, new Uint8Array(1), completionSink), /VirtualDispatchStateInvalid/)
  fixture.controller.dispatch({ kind: 'pipe-write-result', pipeOrdinal, acceptedByteLength: 1, backpressure: false })
  const pending = fixture.controller.snapshot()
  g36FixtureAssert.throws(() => fixture.controller.dispatch({ kind: 'pipe-write-result', pipeOrdinal, acceptedByteLength: 1, backpressure: true }), /VirtualDispatchStateInvalid/)
  g36FixtureAssert.deepEqual(fixture.controller.snapshot(), pending)
  g36FixtureCall(fixture, 'pipe', 'writeDebugPipe', pair, new Uint8Array(1), completionSink)
  fixture.controller.dispatch({ kind: 'pipe-write-result', pipeOrdinal, acceptedByteLength: 1, backpressure: false })
  g36FixtureAssert.throws(() => g36FixtureCall(fixture, 'pipe', 'writeDebugPipe', pair, new Uint8Array(1), completionSink), /VirtualDispatchStateInvalid/)
  g36FixtureCall(fixture, 'pipe', 'closeDebugPipe', pair)
  g36FixtureAssert.deepEqual(fixture.controller.snapshot().liveOrdinals.debugPipes, [])
  g36FixtureAssert.equal(fixture.controller.snapshot().pendingPipeWriteResultCount, 0)
})

for (const kind of ['child-stdout', 'child-stderr', 'child-exit', 'child-close', 'child-error']) {
  /* ADR0038:register:g36FixtureTest */ g36CaseTest('L1522', 'fixture', `ADR 0036: ${kind} bleibt ein primitiver Child-Rawturn`, () => {
    const fixture = createVirtualRuntimeFixture()
    const raw = []
    const rawSink = function (value) { raw.push(value) }
    g36FixtureCall(fixture, 'launcher', 'spawnChild', g36FixtureSyntheticSpawn('vite'), rawSink)
    const childOrdinal = fixture.controller.snapshot().liveOrdinals.children[0]
    const input = kind === 'child-stdout' || kind === 'child-stderr' ? { kind, childOrdinal, bytes: new Uint8Array([10]) } :
      kind === 'child-exit' || kind === 'child-close' ? { kind, childOrdinal, code: null, signal: null } : { kind, childOrdinal }
    fixture.controller.dispatch(input)
    g36FixtureAssert.equal(raw.length, 1)
    g36FixtureAssert.equal(raw[0].kind, kind.slice(6))
    g36FixtureAssert.ok(Object.isFrozen(raw[0]))
    g36FixtureAssert.equal(fixture.controller.snapshot().producerTurnCount, 1)
    g36FixtureAssert.equal(fixture.controller.snapshot().fixtureOwnedByteLength, 0)
    if (kind === 'child-close') g36FixtureAssert.deepEqual(fixture.controller.snapshot().liveOrdinals.children, [])
  })
}

/* ADR0038:register:g36FixtureTest */ g36CaseTest('L1540', 'fixture', 'ADR 0036: Ressourcenhandles entstehen ausschließlich nach dem gebundenen Completionturn', () => {
  const fixture = createVirtualRuntimeFixture()
  let opened = null
  let snapshotInside = null
  let rawCalls = 0
  const rawSink = function (raw) { rawCalls += 1; opened = raw; snapshotInside = fixture.controller.snapshot() }
  const operation = Object.freeze({ operationId: 1, kind: 'open-resource', input: Object.freeze({ path: 'C:\\virtual\\file', expectedType: 'regular-file' }) })
  g36FixtureCall(fixture, 'resources', 'performResourceOperation', operation, rawSink)
  g36FixtureAssert.equal(opened, null)
  const operationOrdinal = fixture.controller.snapshot().liveOrdinals.resourceOperations[0]
  const before = fixture.controller.snapshot()
  g36FixtureAssert.throws(() => fixture.controller.dispatch({ kind: 'resource-completion', operationOrdinal, state: 'completed', result: { kind: 'resource-opened', resourceHandle: {} } }), /VirtualDispatchInvalid/)
  g36FixtureAssert.deepEqual(fixture.controller.snapshot(), before)
  fixture.controller.dispatch({ kind: 'resource-completion', operationOrdinal, state: 'completed', result: { kind: 'resource-opened' } })
  g36FixtureAssert.deepEqual(snapshotInside.liveOrdinals.resources, [])
  const openedSnapshot = fixture.controller.snapshot()
  g36FixtureAssert.deepEqual(openedSnapshot.liveOrdinals.resources, [1])
  g36FixtureAssert.ok(Object.isFrozen(openedSnapshot.liveOrdinals.resources))
  g36FixtureAssert.equal(opened.operationId, 1)
  g36FixtureAssert.deepEqual(Reflect.ownKeys(opened.result), ['kind', 'resourceHandle'])
  const resourceHandle = opened.result.resourceHandle
  g36FixtureCall(fixture, 'resources', 'closeResource', resourceHandle, rawSink)
  const closeOrdinal = fixture.controller.snapshot().liveOrdinals.resourceOperations[0]
  fixture.controller.dispatch({ kind: 'resource-completion', operationOrdinal: closeOrdinal, state: 'completed', result: { kind: 'resource-closed' } })
  g36FixtureAssert.equal(opened.operationId, 2)
  g36FixtureAssert.deepEqual(fixture.controller.snapshot().liveOrdinals.resources, [])
  g36FixtureAssert.equal(fixture.controller.snapshot().producerTurnCount, 2)
  g36FixtureAssert.deepEqual(openedSnapshot.liveOrdinals.resources, [1])
  g36FixtureAssert.equal(openedSnapshot.producerTurnCount, 1)
  g36FixtureAssert.equal(openedSnapshot.callCounts.resources.closeResource, 0)
  const closedSnapshot = fixture.controller.snapshot()
  const staticStateError = error => Object.getPrototypeOf(error) === Error.prototype &&
    error.message === 'browserSyncTransportRuntimeDiagnosticVirtualDispatchStateInvalid'
  g36FixtureAssert.throws(() => g36FixtureCall(fixture, 'resources', 'closeResource', resourceHandle, rawSink), staticStateError)
  const rejectedSnapshot = fixture.controller.snapshot()
  g36FixtureAssert.deepEqual(rejectedSnapshot, {
    ...closedSnapshot,
    callCounts: { ...closedSnapshot.callCounts,
      resources: { ...closedSnapshot.callCounts.resources, closeResource: closedSnapshot.callCounts.resources.closeResource + 1 } },
  })
  g36FixtureAssert.equal(rawCalls, 2)
  g36FixtureAssert.throws(() => fixture.controller.dispatch({ kind: 'resource-completion', operationOrdinal: closeOrdinal, state: 'completed', result: { kind: 'resource-closed' } }), staticStateError)
  g36FixtureAssert.deepEqual(fixture.controller.snapshot(), rejectedSnapshot)
  g36FixtureAssert.equal(rawCalls, 2)
})

for (const operationCase of [
  { kind: 'canonicalize-path', input: { path: 'C:\\virtual' }, result: { kind: 'canonical-path', path: 'C:\\virtual' } },
  { kind: 'inspect-path', input: { path: 'C:\\virtual' }, result: { kind: 'path-identity', ...g36FixtureSyntheticIdentity() } },
  { kind: 'create-temporary-root', input: { parentPath: 'C:\\virtual', prefix: 'run_' }, result: { kind: 'resource-created', path: 'C:\\virtual\\run_1', pathIdentity: g36FixtureSyntheticIdentity('directory') } },
  { kind: 'passive-tcp-listeners', input: { endpoints: [{ address: '127.0.0.1', port: 5173 }, { address: '127.0.0.1', port: 8787 }] },
    result: { kind: 'passive-tcp-listeners', endpoints: [{ address: '127.0.0.1', port: 5173, state: 'unavailable' }, { address: '127.0.0.1', port: 8787, state: 'unavailable' }] } },
]) {
  /* ADR0038:register:g36FixtureTest */ g36CaseTest('L1593', 'fixture', `ADR 0036: Ressourcenresultat ${operationCase.kind} bleibt an seine Operation gebunden`, () => {
    const fixture = createVirtualRuntimeFixture()
    const raw = []
    const rawSink = function (value) { raw.push(value) }
    const operation = g36FixtureFreeze({ operationId: 1, kind: operationCase.kind, input: operationCase.input })
    g36FixtureCall(fixture, 'resources', 'performResourceOperation', operation, rawSink)
    const operationOrdinal = fixture.controller.snapshot().liveOrdinals.resourceOperations[0]
    const before = fixture.controller.snapshot()
    g36FixtureAssert.throws(() => fixture.controller.dispatch({ kind: 'resource-completion', operationOrdinal, state: 'completed', result: { kind: 'resource-closed' } }), /VirtualDispatchInvalid/)
    g36FixtureAssert.deepEqual(fixture.controller.snapshot(), before)
    fixture.controller.dispatch({ kind: 'resource-completion', operationOrdinal, state: 'completed', result: operationCase.result })
    g36FixtureAssert.equal(raw.length, 1)
    g36FixtureAssert.equal(raw[0].result.kind, operationCase.result.kind)
    g36FixtureAssert.deepEqual(fixture.controller.snapshot().liveOrdinals.resourceOperations, [])
    const after = fixture.controller.snapshot()
    g36FixtureAssert.throws(() => fixture.controller.dispatch({ kind: 'resource-completion', operationOrdinal, state: 'completed', result: operationCase.result }), /VirtualDispatchStateInvalid/)
    g36FixtureAssert.deepEqual(fixture.controller.snapshot(), after)
  })
}

/* ADR0038:register:g36FixtureTest */ g36CaseTest('L1613', 'fixture', 'ADR 0036: fehlgeschlagene Ressourcencompletion besitzt ausschließlich null und keinen Handle', () => {
  const fixture = createVirtualRuntimeFixture()
  const raw = []
  const rawSink = function (value) { raw.push(value) }
  g36FixtureCall(fixture, 'resources', 'performResourceOperation', Object.freeze({ operationId: 1, kind: 'open-resource', input: Object.freeze({ path: 'C:\\virtual', expectedType: 'directory' }) }), rawSink)
  const operationOrdinal = fixture.controller.snapshot().liveOrdinals.resourceOperations[0]
  const before = fixture.controller.snapshot()
  g36FixtureAssert.throws(() => fixture.controller.dispatch({ kind: 'resource-completion', operationOrdinal, state: 'failed', result: { kind: 'resource-opened' } }), /VirtualDispatchInvalid/)
  g36FixtureAssert.deepEqual(fixture.controller.snapshot(), before)
  fixture.controller.dispatch({ kind: 'resource-completion', operationOrdinal, state: 'failed', result: null })
  g36FixtureAssert.deepEqual(raw, [Object.freeze({ operationId: 1, state: 'failed', result: null })])
  g36FixtureAssert.deepEqual(fixture.controller.snapshot().liveOrdinals.resources, [])
})

// A test driver may know its independent raw-source schedule. It can observe
// only public fixture ordinals, never operation inputs, handles or owner state.
async function g36FixtureDispatchResourcePlan(controller, plan) {
  for (const completion of plan) {
    let ordinal = null
    for (let turn = 0; turn < 256; turn += 1) {
      const pending = controller.snapshot().liveOrdinals.resourceOperations
      if (pending.length > 0) { ordinal = pending[0]; break }
      await Promise.resolve()
    }
    g36FixtureAssert.notEqual(ordinal, null, 'expected the next bounded resource operation')
    controller.dispatch({ kind: 'resource-completion', operationOrdinal: ordinal, state: completion.state, result: completion.result })
  }
}

/* ADR0038:register:g36FixtureTest */ g36CaseTest('L1642', 'fixture', 'ADR 0036: Ressourcenreads kopieren Bytes und begrenzen Ergebnisse vor dem Sink', () => {
  const fixture = createVirtualRuntimeFixture()
  const raw = []
  let byteLengthInside = 0
  const rawSink = function (value) { raw.push(value); byteLengthInside = fixture.controller.snapshot().fixtureOwnedByteLength }
  g36FixtureCall(fixture, 'resources', 'performResourceOperation', Object.freeze({ operationId: 1, kind: 'open-resource', input: Object.freeze({ path: 'C:\\virtual\\file', expectedType: 'regular-file' }) }), rawSink)
  fixture.controller.dispatch({ kind: 'resource-completion', operationOrdinal: 1, state: 'completed', result: { kind: 'resource-opened' } })
  const resourceHandle = raw[0].result.resourceHandle
  g36FixtureCall(fixture, 'resources', 'performResourceOperation', Object.freeze({ operationId: 2, kind: 'read-resource', input: Object.freeze({ resourceHandle, offset: 0, maximumByteLength: 3 }) }), rawSink)
  const before = fixture.controller.snapshot()
  g36FixtureAssert.throws(() => fixture.controller.dispatch({ kind: 'resource-completion', operationOrdinal: 2, state: 'completed', result: { kind: 'resource-bytes', bytes: new Uint8Array(4), endOfFile: true } }), /VirtualDispatchInvalid/)
  g36FixtureAssert.deepEqual(fixture.controller.snapshot(), before)
  const bytes = new Uint8Array([1, 2, 3])
  fixture.controller.dispatch({ kind: 'resource-completion', operationOrdinal: 2, state: 'completed', result: { kind: 'resource-bytes', bytes, endOfFile: true } })
  g36FixtureAssert.equal(byteLengthInside, 3)
  g36FixtureAssert.equal(fixture.controller.snapshot().fixtureOwnedByteLength, 0)
  bytes.fill(9)
  g36FixtureAssert.deepEqual([...raw[1].result.bytes], [1, 2, 3])
  g36FixtureAssert.notEqual(raw[1].result.bytes, bytes)
})

for (const kind of ['inspect-open-resource', 'list-directory', 'create-directory-exclusive', 'create-file-exclusive']) {
  /* ADR0038:register:g36FixtureTest */ g36CaseTest('L1664', 'fixture', `ADR 0036: ${kind} bindet den virtuellen Parent-/Readhandle ohne Callerhandle im Resultat`, () => {
    const fixture = createVirtualRuntimeFixture()
    const raw = []
    const rawSink = function (value) { raw.push(value) }
    g36FixtureCall(fixture, 'resources', 'performResourceOperation', Object.freeze({ operationId: 1, kind: 'open-resource', input: Object.freeze({ path: 'C:\\virtual', expectedType: 'directory' }) }), rawSink)
    fixture.controller.dispatch({ kind: 'resource-completion', operationOrdinal: 1, state: 'completed', result: { kind: 'resource-opened' } })
    const resourceHandle = raw[0].result.resourceHandle
    const input = kind === 'inspect-open-resource' ? { resourceHandle } : kind === 'list-directory' ? { resourceHandle, maximumEntries: 1 } :
      kind === 'create-directory-exclusive' ? { parentHandle: resourceHandle, name: 'child' } : { parentHandle: resourceHandle, name: 'child', bytes: new Uint8Array([1]) }
    g36FixtureCall(fixture, 'resources', 'performResourceOperation', Object.freeze({ operationId: 2, kind, input: Object.freeze(input) }), rawSink)
    const result = kind === 'inspect-open-resource' ? { kind: 'open-resource-identity', ...g36FixtureSyntheticIdentity('directory') } :
      kind === 'list-directory' ? { kind: 'directory-entries', entries: [{ name: 'file', pathType: 'regular-file', reparsePoint: false }] } :
        { kind: 'resource-created', path: 'C:\\virtual\\child', pathIdentity: g36FixtureSyntheticIdentity(kind === 'create-directory-exclusive' ? 'directory' : 'regular-file') }
    fixture.controller.dispatch({ kind: 'resource-completion', operationOrdinal: 2, state: 'completed', result })
    g36FixtureAssert.equal(raw[1].result.kind, result.kind)
    g36FixtureAssert.equal(fixture.controller.snapshot().producerTurnCount, 2)
  })
}

/* ADR0038:register:g36FixtureTest */ g36CaseTest('L1683', 'fixture', 'ADR 0036: Ressourcen-Failurearm verbraucht die versuchte ID vor späterem Cleanup', () => {
  const fixture = createVirtualRuntimeFixture()
  const raw = []
  const rawSink = function (value) { raw.push(value) }
  fixture.controller.dispatch({ kind: 'fail-next-capability-call', capability: 'performResourceOperation' })
  const first = Object.freeze({ operationId: 1, kind: 'canonicalize-path', input: Object.freeze({ path: 'C:\\virtual' }) })
  g36FixtureAssert.throws(() => g36FixtureCall(fixture, 'resources', 'performResourceOperation', first, rawSink), /VirtualDispatchStateInvalid/)
  g36FixtureCall(fixture, 'resources', 'performResourceOperation', Object.freeze({ operationId: 2, kind: 'canonicalize-path', input: first.input }), rawSink)
  fixture.controller.dispatch({ kind: 'resource-completion', operationOrdinal: 1, state: 'completed', result: { kind: 'canonical-path', path: 'C:\\virtual' } })
  g36FixtureAssert.equal(raw[0].operationId, 2)
  g36FixtureAssert.equal(fixture.controller.snapshot().callCounts.resources.performResourceOperation, 2)
})

/* ADR0038:register:g36FixtureTest */ g36CaseTest('L1696', 'fixture', 'ADR 0036: ungültige rohe Byteprofile bleiben vor Sink, Zähler und Bytesaldo', () => {
  const fixture = createVirtualRuntimeFixture()
  let calls = 0
  const rawSink = function (value) { void value; calls += 1 }
  const { pipeOrdinal } = g36FixtureOpenPipe(fixture, rawSink)
  const detached = new Uint8Array(1)
  structuredClone(detached.buffer, { transfer: [detached.buffer] })
  const views = [
    new Uint8Array(65537), new Uint8Array(new ArrayBuffer(3), 1, 1),
    new Uint8Array(new SharedArrayBuffer(1)), new Uint8Array(new ArrayBuffer(1, { maxByteLength: 2 })),
    new (class extends Uint8Array {})(1), detached,
    new Proxy(new Uint8Array(1), { get() { throw new Error('UNTRUSTED_BYTE_REASON') } }),
  ]
  for (const bytes of views) {/* ADR0038:sync */g36Variant('fixture-byte-input',['over-cap','nonwhole-buffer','shared-buffer','resizable-buffer','subclass','detached','proxy'][views.indexOf(bytes)]);/* ADR0038:end */
    const before = fixture.controller.snapshot()
    g36FixtureAssert.throws(() => fixture.controller.dispatch({ kind: 'pipe-chunk', pipeOrdinal, bytes }), { name: 'TypeError', message: 'browserSyncTransportRuntimeDiagnosticVirtualDispatchInvalid' })
    g36FixtureAssert.deepEqual(fixture.controller.snapshot(), before)
    g36FixtureAssert.equal(calls, 0)
  }
})

// These tests become active when root composes this fragment with the exact
// copy builder. The fixture itself never imports or chooses an adapter copy.
{
  /* ADR0038:register:g36FixtureTest */ g36CaseTest('L1720', 'fixture', 'ADR 0036: dieselbe vollständige Fixture bindet direkten Owner und öffentlichen virtuellen Factorypfad inaktiv', async () => {
    await withAdapterCopy('virtual-runtime-conformance', null, async (namespace) => {
      const direct = createVirtualRuntimeFixture()
      const owner = namespace.createBrowserSyncTransportRuntimeDiagnosticAdapterOwner(direct.runtimeCapabilities)
      g36FixtureAssert.deepEqual(Reflect.ownKeys(owner.api), ['run'])
      g36FixtureAssert.equal(owner.api.run.length, 0)
      g36FixtureAssert.ok(Object.isFrozen(owner.api))
      g36FixtureAssert.ok(Object.values(direct.controller.snapshot().callCounts).every((methods) => Object.values(methods).every((count) => count === 0)))
      const publicFixture = createVirtualRuntimeFixture()
      namespace.installBrowserSyncTransportRuntimeDiagnosticVirtualCapabilities(publicFixture.runtimeCapabilities)
      const api = namespace.createBrowserSyncTransportRuntimeDiagnosticAdapter()
      g36FixtureAssert.deepEqual(Reflect.ownKeys(api), ['run'])
      g36FixtureAssert.notEqual(api, owner.api)
      g36FixtureAssert.ok(Object.values(publicFixture.controller.snapshot().callCounts).every((methods) => Object.values(methods).every((count) => count === 0)))
      g36FixtureAssert.throws(() => namespace.createBrowserSyncTransportRuntimeDiagnosticAdapter())
      g36FixtureAssert.throws(() => namespace.installBrowserSyncTransportRuntimeDiagnosticVirtualCapabilities(createVirtualRuntimeFixture().runtimeCapabilities))
    })
  })
  for (const variant of [
    { name: 'virtual-selector-null-consume', replacement: 'function g36VirtualNullConsume(){ return undefined }' },
    { name: 'virtual-selector-double-consume', replacement: 'function g36VirtualDoubleConsume(){ const selected = consumeBrowserSyncTransportRuntimeDiagnosticVirtualCapabilities(); consumeBrowserSyncTransportRuntimeDiagnosticVirtualCapabilities(); return selected }' },
  ]) {
    /* ADR0038:register:g36FixtureTest */ g36CaseTest('L1742', 'fixture', `ADR 0036: produktiver Factory-Oracle erkennt ${variant.name}`, async () => {
      const from = 'const createSelectedBrowserSyncTransportRuntimeDiagnosticCapabilities =\n  consumeBrowserSyncTransportRuntimeDiagnosticVirtualCapabilities'
      const to = `const createSelectedBrowserSyncTransportRuntimeDiagnosticCapabilities =\n  ${variant.replacement}`
      const oracle = async (namespace) => {
        const fixture = createVirtualRuntimeFixture()
        namespace.installBrowserSyncTransportRuntimeDiagnosticVirtualCapabilities(fixture.runtimeCapabilities)
        let api
        g36FixtureAssert.doesNotThrow(() => { api = namespace.createBrowserSyncTransportRuntimeDiagnosticAdapter() })
        g36FixtureAssert.deepEqual(Reflect.ownKeys(api), ['run'])
      }
      await withAdapterCopy('virtual-runtime-conformance', null, oracle)
      await g36FixtureAssert.rejects(() => withAdapterCopy('virtual-runtime-conformance', { name: variant.name, from, to }, oracle), { name: 'AssertionError' })
    })
  }
}

// Independent pure fixture literals; they carry no runtime identity or authority.
const recordFixtureCommands = Object.freeze(['Target.getTargets', 'Target.attachToTarget', 'Network.enable', 'Runtime.evaluate', 'Network.disable', 'Target.detachFromTarget']);
const recordFixtureReplayDefinitions = Object.freeze([
  ['artifact.transport.src/transports/browserSyncTransport.js.sha256', 'historical-commit-artifact-sha256', '3c41b17e1d80e94e4b05e7c76f019d3fd3af281b451e85c8f90d80fd25391c28', 'H64'],
  ['artifact.contract.src/contracts/syncContract.js.sha256', 'historical-commit-artifact-sha256', '96ad2c52fb4545d6e587d9b3fd86d76a4a735e8cb33e9b572a3d7d5f4e5a6aeb', 'H64'],
  ['artifact.gateway.server/startLocalSyncGateway.js.sha256', 'historical-commit-artifact-sha256', '677be5e9cace926ba0a1f3540e39926f5b5c54dd57440bd1ac53de6f255ca6d5', 'H64'],
  ['artifact.gateway.server/localSyncGatewayRuntimeConfig.js.sha256', 'historical-commit-artifact-sha256', 'e9a4419666e33b57d1ed5712e00f3d954a5b82c1cc7956b9a7582e0462743836', 'H64'],
  ['artifact.gateway.server/localSyncGatewayHttpServer.js.sha256', 'historical-commit-artifact-sha256', '70243e66f85448c23920ea30409a03be7ed349b6868535729f4a798f012fdbb8', 'H64'],
  ['artifact.gateway.src/gateways/syncGatewayRequestBoundary.js.sha256', 'historical-commit-artifact-sha256', 'b1e55f03283bfdd1d35562951503471b4a812ac61868af0b927a05623e597b79', 'H64'],
  ['artifact.gateway.src/agents/syncAgent.js.sha256', 'historical-commit-artifact-sha256', '899e06d3a80925cab8680749d133e9a8d87f30a2fd1d509cf7339eb1c8d65db0', 'H64'],
  ['artifact.frontend.runtime-source-set.sha256', 'historical-commit-artifact-sha256', '6f3d5740b043308b4d38df33b6293c9064d8dd1b3f0c5801d50844336c195591', 'H64'],
  ['repository.state', 'historical-record-value', 'clean', 'STATE'],
  ['hostRuntime.executionClass', 'historical-record-value', 'local-disposable', 'A64'],
  ['operatingSystem.family', 'historical-record-value', 'windows', 'A32'],
  ['operatingSystem.edition', 'historical-record-value', 'Windows 11 Home', 'A64'],
  ['operatingSystem.architecture', 'historical-record-value', 'x64', 'A16'],
  ['operatingSystem.version', 'historical-record-value', '25H2', 'A64'],
  ['operatingSystem.build', 'historical-record-value', '26200', 'A32'],
  ['operatingSystem.patch', 'historical-record-value', '9168', 'A32'],
  ['node.version', 'historical-record-value', '24.19.0', 'S32'],
  ['browser.product', 'historical-record-value', 'chrome', 'A32'],
  ['browser.channel', 'historical-record-value', 'stable', 'A32'],
  ['browser.version', 'historical-record-value', '151.0.7922.174', 'A64'],
  ['browser.engine', 'historical-record-value', 'blink', 'A32'],
  ['browser.engineBuild', 'historical-record-value', '@39c51c70dd5feca6b6aba5bb7997b595011c553d', 'A128'],
  ['browser.executionMode', 'historical-record-value', 'visible', 'A32'],
  ['browser.privateMode', 'historical-record-value', true, 'B'],
  ['profile.lifecycle', 'historical-record-value', 'fresh-disposable', 'A64'],
  ['profile.extensions', 'historical-record-value', 'none', 'A64'],
  ['profile.startParameters', 'historical-record-value', 'effective-non-bypassing', 'A128'],
  ['profile.featureFlags', 'historical-record-value', 'none-effective', 'A128'],
  ['profile.enterprisePolicies', 'historical-record-value', 'none-effective', 'A128'],
  ['networkEnvironment.proxy', 'historical-record-value', 'inactive', 'A32'],
  ['networkEnvironment.vpn', 'historical-record-value', 'inactive', 'A32'],
  ['initialState.serviceWorker', 'historical-record-value', 'absent', 'A64'],
  ['initialState.permission', 'historical-record-value', 'prompt', 'A64'],
  ['initialState.preflightCache', 'historical-record-value', 'empty-confirmed', 'A64'],
  ['initialState.siteCache', 'historical-record-value', 'empty-confirmed', 'A64'],
  ['bindingComparisonProfile', 'historical-record-value', 'ephemeral-exact-effective-context-comparison-without-retention', 'A128'],
  ['frontend.topLevelUrl', 'historical-record-value', 'http://127.0.0.1:5173/', 'A2048'],
  ['frontend.serializedOrigin', 'historical-record-value', 'http://127.0.0.1:5173', 'A2048'],
  ['frontend.contextKind', 'historical-record-value', 'top-level', 'A32'],
  ['frontend.isSecureContext', 'historical-record-value', true, 'B'],
  ['transportRequest.factoryProfile', 'historical-record-value', 'real-default-factory', 'A64'],
  ['transportRequest.compositionProfile', 'historical-record-value', 'transport-only', 'A64'],
  ['transportRequest.requestProfile', 'historical-record-value', 'synthetic-v1-syncTest-empty-payload', 'A128'],
  ['transportRequest.requestEqualityMethod', 'historical-record-value', 'ephemeral-full-value-comparison-without-retention', 'A128'],
  ['transportRequest.initialUrl', 'historical-record-value', 'http://127.0.0.1:8787/api/sync-test', 'A2048'],
  ['transportRequest.initialScheme', 'historical-record-value', 'http', 'A16'],
  ['transportRequest.initialHost', 'historical-record-value', '127.0.0.1', 'A256'],
  ['transportRequest.initialPort', 'historical-record-value', 8787, 'P'],
  ['transportRequest.initialPath', 'historical-record-value', '/api/sync-test', 'A1024'],
  ['transportRequest.requestInitProfile', 'historical-record-value', 'adr-0028-fixed', 'A64'],
  ['gateway.listenerHost', 'historical-record-value', '127.0.0.1', 'A256'],
  ['gateway.listenerPort', 'historical-record-value', 8787, 'P'],
  ['gateway.portEnvironmentValue', 'historical-record-value', '"8787"', 'A16'],
  ['gateway.allowedOrigin.value', 'historical-record-value', 'http://127.0.0.1:5173', 'A2048'],
  ['gateway.allowedOrigin.relationToFrontend', 'historical-record-value', 'matches-frontend-origin', 'A64'],
  ['gateway.endpoint', 'historical-record-value', 'http://127.0.0.1:8787/api/sync-test', 'A2048'],
  ['gateway.responderProfile', 'historical-record-value', 'production-gateway', 'A64'],
  ['gateway.responseProfile', 'historical-record-closed-derivation', 'adr-0020-options204-post200-syncresponse-v1', 'A128'],
  ['toolchain.vite.lockfileVersion', 'historical-commit-closed-derivation', '8.1.4', 'S32'],
])

/* ADR0038:sync */g36Registry.bindReplayFields(recordFixtureReplayDefinitions.map(row => row[0]));/* ADR0038:end */function recordFixtureLedgerTemplate() {
  const wire = [];
  for (let i = 0; i < 6; i += 1) wire[i] = { command: recordFixtureCommands[i], intentCount: 0, acceptedFrameCount: 0, ackCount: 0, profileMatch: true, replyState: 'unobserved', replyCount: 0 };
  const resources = [];
  const names = ['pipe', 'browser', 'vite', 'gateway', 'profile', 'harness', 'environment', 'observer-output'];
  for (let i = 0; i < names.length; i += 1) resources[i] = { name: names[i], creationState: 'never-attempted', boundCount: 0, terminalCount: 0, activeAfterCleanupCount: 0, foreignTouchCount: 0, failureCount: 0 };
  return {
    profile: 'adr-0036-terminal-adapter-ledger-v1',
    sources: { foundationSha256: null, loadedFoundationSha256: null, commitFoundationSha256: null, loadCount: 0, importCount: 0, loadKind: 'none', pathCheckCount: 0, pathRecheckCount: 0, mismatchCount: 0, inventoryExpectedCount: 0, inventoryCompletedCount: 0, extraTransportLoadCount: 0, capabilitySelectionCount: 0, ownerCount: 0, dispatcherCount: 0, extraCapabilityCount: 0, runtimeActionCount: 0, interceptionCount: 0, debuggerOperationCount: 0, profilerTracingOperationCount: 0, retryCount: 0, directFetchCount: 0, negativeOriginRunCount: 0, redirectRunCount: 0 },
    wire,
    parser: { frameCount: 0, decodeCount: 0, scanCount: 0, parseCount: 0, parseFailureCount: 0, duplicateKeyCount: 0, filterCount: 0, reorderCount: 0, bodyReadCount: 0, freeInspectionCount: 0, queueEntries: 0, queuedBytes: 0, dequeuedMaterialBytes: 0, resolverCount: 0, pendingWriteCount: 0, liveCallbackCount: 0, retainedRawCount: 0, retainedIdentifierCount: 0, postObservationCount: 0, violationCount: 0, intakeState: 'open', pipeOpenCount: 0, pipeReadOwnerCount: 0, pipeWriteOwnerCount: 0, inheritedReadDescriptor: null, inheritedWriteDescriptor: null, debugPortArgumentCount: 0, objectGroupCount: 0, remoteObjectHandleCount: 0 },
    resources,
    network: { endpointOptions: null, endpointPosts: null, endpointOtherMethods: null, unattributedCount: 0, observerRequestCount: 0, additionalFetchCount: 0, sequence: 'incomplete', targetBindingCount: 0, sessionBindingCount: 0, targetContradictionCount: 0, evaluateCorrelationContradictionCount: 0, captureState: 'not-started', acceptedEvaluationSha256: null, acceptedEvaluationBytes: 0 },
    output: { writeCount: 0, rawWriteCount: 0, diagnosticWriteCount: 0, childStreamCount: 0, terminalChildStreamCount: 0, inventoryExpectedCount: 0, inventoryCompletedCount: 0, residueCount: 0, repositoryBaselineSha256: null, repositoryFinalSha256: null, repositoryIdentityDifferenceCount: 0, historicalBaselineSha256: null, historicalFinalSha256: null, historicalIdentityDifferenceCount: 0, passivePortsSourceState: 'unavailable', listener5173Count: null, listener8787Count: null, environmentDifferenceCount: 0 },
    completion: { markerCount: 0, markerSequence: null, firstCleanupSequence: null, cleanupGeneration: 0, violationCount: 0, reason: 'cleanup-terminal-failure', capArmCount: 0, capCancelCount: 0, capCancelAckCount: 0, completionClockCount: 0, cleanupOrigin: null, completionClock: null, terminalState: 'pending' },
  };
}
// Integration inputs are test-owned constructors, never adapter capabilities.
// loadRecordCopy uses only the ADR-0036 record four-export copy profile.
// makeRecordPair returns a mutable { foundationProjection, adapterLedger } whose
// unregistered, frozen baseline finalizes UNPROVEN / NOT_EVIDENCE. It is not R0.
function makeAdr36RecordPairFixture() {
  const comparisons = recordFixtureReplayDefinitions.map(definition => ({ fieldId: definition[0], comparisonBasis: definition[1], observationState: 'not-observed', historicalValue: definition[2], replayValue: null, result: 'unproven' }));
  const integrityIds = ['sourceUnmodified', 'instrumentedSourceCopyAbsent', 'compositionSeamsAbsent', 'protocolAllowlistOnly', 'runtimeSurfaceMutationAbsent', 'fetchInterceptionAbsent', 'debuggerBreakpointsAndSteppingAbsent', 'profilerAndTracingAbsent', 'responseBodyReadAbsent', 'freeRawInspectionAbsent', 'additionalNativeFetchAbsent', 'observerProductEndpointRequestAbsent', 'rawPersistenceAbsent', 'observerDiagnosticDuringRunOutputAbsent', 'closedPrimitiveProjectionConfirmed', 'singleTargetAndSessionConfirmed', 'singleMainWorldEvaluationConfirmed'];
  const cleanupIds = ['cleanupStarted', 'networkDomainClosed', 'targetSessionClosed', 'debugPipeClosed', 'controllerObservationClosed', 'browserStopped', 'devServerStopped', 'gatewayStopped', 'profileRemoved', 'harnessFragmentsRemoved', 'objectGroupsAbsentOrReleased', 'rawEventsDiscarded', 'ephemeralIdentifiersDiscarded', 'permissionSiteCacheAndServiceWorkerStateCleared', 'environmentRestored', 'portsFree', 'repositoryAndIndexRestored', 'historicalEvidenceHashUnchanged', 'observerStorageLogAndTelemetryResidueAbsent', 'cleanupCompleted'];
  const stageNames = ['observer-armed', 'transport-call-dispatched', 'preflight-request-observed', 'preflight-204-observed', 'post-request-observed', 'post-response-200-observed', 'post-loading-terminal', 'public-promise-settled', 'cleanup-started', 'cleanup-completed'];
  const stages = stageNames.map((stageId, i) => {
    const layer = i === 0 ? 'controller' : i === 1 || i === 7 ? 'javascript-main-world' : i >= 8 ? 'cleanup' : 'browser-network';
    const observed = i === 0 || i >= 8;
    return { stageId, layer, observationState: observed ? 'observed' : 'not-observed', receiptOrder: observed ? i === 9 ? 2 : 1 : null, result: observed ? 'match' : 'unproven', clockDomain: layer === 'controller' || layer === 'cleanup' ? 'controller-monotonic' : layer, relativeMilliseconds: observed ? 0 : null, timingState: observed ? 'measured' : 'unavailable' };
  });
  const foundationProjection = {
    schemaVersion: 1,
    projectionType: 'browser-transport-diagnostic-foundation-projection',
    diagnosticRunId: 'diag-pure-record-fixture',
    observedAt: '2026-09-13T12:00:00.000Z',
    timeZone: 'UTC',
    historicalEvidence: { recordPath: 'docs/evidence/browser-runtime-evidence.chrome-stable-windows-01.json', recordSha256: 'ffad6b1de2e0c32ec5c2cdc3e88bfd455b14adc2eb4dd45f0d81e911e1a64b33', measurementRunId: 'chrome-stable-win-01', baseContextId: 'chrome-stable-win-t0-01', overallGate: 'FAIL' },
    replay: {
      replayContextId: 'replay-pure-record-fixture', repositoryCommit: '0000000000000000000000000000000000000000', repositoryState: null,
      profileInstanceBinding: { lifecycle: 'unknown', newInstanceConfirmed: false, historicalInstanceReused: false },
      causalContext: {
        hostRuntime: { executionClass: null }, operatingSystem: { family: null, edition: null, architecture: null, version: null, build: null, patch: null }, node: { version: null },
        browser: { product: null, channel: null, version: null, engine: null, engineBuild: null, executionMode: null, privateMode: null },
        profile: { lifecycle: null, extensions: null, startParameters: null, featureFlags: null, enterprisePolicies: null }, networkEnvironment: { proxy: null, vpn: null },
        initialState: { serviceWorker: null, permission: null, preflightCache: null, siteCache: null }, bindingComparisonProfile: null,
        frontend: { topLevelUrl: null, serializedOrigin: null, contextKind: null, isSecureContext: null },
        transportRequest: { factoryProfile: null, compositionProfile: null, requestProfile: null, requestEqualityMethod: null, initialUrl: null, initialScheme: null, initialHost: null, initialPort: null, initialPath: null, requestInitProfile: null },
        gateway: { listenerHost: null, listenerPort: null, portEnvironmentValue: null, allowedOrigin: { value: null, relationToFrontend: null }, endpoint: null, responderProfile: null, responseProfile: null },
        toolchain: { vite: { lockfileVersion: null, runtimeVersion: null } },
      },
      equivalence: { relationId: 'adr-0032-causal-replay-v2', comparisons, noUnexplainedCausalDeviation: 'unproven', result: 'UNPROVEN' },
    },
    observer: {
      deltaProfile: 'adr-0030-passive-external-observer-v1', controllerExclusivity: 'unknown', connectionProfile: 'unknown', targetProfile: 'unknown', foundationSha256: null, evaluationSha256: null, controllerEvaluateIntentCount: 'zero',
      protocolOperations: recordFixtureCommands.map((command, i) => ({ command, allowedMaximum: 1, observedCountClass: i === 0 ? 'one' : 'zero', result: 'match' })),
      mainWorldEvaluationCount: 'zero', transportFactoryCallCount: 'zero', primitiveProjectionProfile: 'immediate-closed-by-value-pretransport-context-and-settlement-v2-no-handle',
      integrityChecks: integrityIds.map((checkId, i) => ({ checkId, result: i === 3 ? 'confirmed' : 'unproven' })), interferenceObservation: 'unknown',
    },
    requestBudget: { defaultTransportCalls: 'zero', retries: 'zero', directDiagnosticFetches: 'zero', negativeOriginRuns: 'zero', redirectRuns: 'zero', observerProductEndpointRequests: 'zero', endpointOptions: 'zero', endpointPosts: 'zero', endpointOtherMethods: 'zero', sequence: 'incomplete' },
    publicSettlement: null, stages,
    timing: {
      roundingMilliseconds: 10, durationCapMilliseconds: 60000, setupWindowMilliseconds: 6000, captureWindowMilliseconds: 6000,
      clockDomains: [{ clockDomain: 'controller-monotonic', source: 'controller-monotonic-fixed-v1', comparisonScope: 'setup-observation-and-cleanup-only' }, { clockDomain: 'javascript-main-world', source: 'window.performance.now', comparisonScope: 'transport-dispatch-and-public-settlement-only' }, { clockDomain: 'browser-network', source: 'cdp-network-monotonic-time', comparisonScope: 'endpoint-network-events-only' }],
      calibration: 'none', crossDomainComparison: 'forbidden', completion: { productEvidenceComplete: false, observationCloseReason: 'setup-terminal-unproven', observationClosed: true, captureWindowState: 'not-started', evaluateReplyCountClass: 'zero', requestBudgetFinalized: true, cleanupFinalizeReason: 'all-steps-terminal', cleanupFinalized: true },
    },
    cleanup: { observationClosedBeforeCleanup: true, checks: cleanupIds.map(checkId => ({ checkId, result: 'unproven' })), result: 'UNPROVEN', projectionMaterializedAfterCleanup: true },
    adr0029OverallGate: { before: 'FAIL', after: 'FAIL', unchanged: true }, candidateObserverGate: 'UNPROVEN', candidateFinding: 'inconclusive', causeStatus: 'CAUSE_NOT_PROVEN',
  };
  const adapterLedger = recordFixtureLedgerTemplate();
  Object.assign(adapterLedger.wire[0], { intentCount: 1, acceptedFrameCount: 1, ackCount: 1, replyCount: 1, replyState: 'correlated' });
  Object.assign(adapterLedger.completion, { markerCount: 1, markerSequence: 10, firstCleanupSequence: 11, cleanupGeneration: 1, reason: 'all-steps-terminal', capArmCount: 1, capCancelCount: 1, capCancelAckCount: 1, completionClockCount: 1, cleanupOrigin: 0, completionClock: 10, terminalState: 'terminal' });
  adapterLedger.parser.intakeState = 'closed';
  return { foundationProjection, adapterLedger };
}
function registerAdr36RecordDerivationTests({ test, assert, loadRecordCopy, makeRecordPair = makeAdr36RecordPairFixture, freeze }) {
  const staticError = error => error instanceof TypeError && error.message === 'browserSyncTransportRuntimeDiagnosticAdapterFailed';
  const apiNames = ['createBrowserSyncTransportRuntimeDiagnosticAdapter', 'deriveBrowserSyncTransportRuntimeDiagnosticRecordGate', 'deriveBrowserSyncTransportRuntimeDiagnosticRecordFinding', 'finalizeBrowserSyncTransportRuntimeDiagnosticRecord'];
  const expectedFinding = ({ gate = 'PASS', replay = 'EQUIVALENT', stimulus = 'one', sequence = 'OPTIONS-204-POST-200-loadingFinished', outcome = 'static-redacted-rejection', profile = 'match' } = {}) => freeze({ candidateObserverGate: gate, replayResult: replay, stimulusCount: stimulus, requestSequence: sequence, settlementOutcome: outcome, settlementStaticProfileResult: profile });
  /* ADR0038:register:test */ g36CaseTest('L1901', 'registerAdr36RecordDerivationTests', 'record copy has only its four exports, unchanged arities, and no integrity inspector', async () => {
    const api = await loadRecordCopy();
    assert.deepEqual(Object.keys(api).sort(), [...apiNames].sort());
    for (const name of apiNames) /* ADR0038:sync */{g36Variant('export-arity',name);/* ADR0038:end */assert.equal(api[name].length, name === apiNames[0] ? 0 : 1);/* ADR0038:sync */}/* ADR0038:end */
  });
  for (const [hardViolation, proofIncomplete, expected] of [[false, false, 'PASS'], [false, true, 'UNPROVEN'], [true, false, 'FAIL'], [true, true, 'FAIL']]) {
    /* ADR0038:register:test */ g36CaseTest('L1907', 'registerAdr36RecordDerivationTests', `record gate preserves priority for hard=${hardViolation} incomplete=${proofIncomplete}`, async () => {
      const api = await loadRecordCopy();
      assert.equal(api.deriveBrowserSyncTransportRuntimeDiagnosticRecordGate(freeze({ hardViolation, proofIncomplete })), expected);
    });
  }
  for (const [name, options, expected] of [
    ['reproduction', {}, 'static-rejection-reproduced-after-http200'],
    ['fulfillment', { outcome: 'fulfilled', profile: 'not-applicable' }, 'original-failure-not-reproduced'],
    ['network divergence', { sequence: 'other' }, 'network-signature-diverged'],
    ['invalid observer', { gate: 'FAIL' }, 'observer-invalid'],
    ['incomplete evidence', { gate: 'UNPROVEN' }, 'inconclusive'],
  ]) {
    /* ADR0038:register:test */ g36CaseTest('L1919', 'registerAdr36RecordDerivationTests', `record finding covers ${name}`, async () => {
      const api = await loadRecordCopy();
      assert.equal(api.deriveBrowserSyncTransportRuntimeDiagnosticRecordFinding(expectedFinding(options)), expected);
    });
  }
  for (const stimulus of ['zero', 'one', 'multiple', 'unknown']) {
    for (const gate of ['FAIL', 'UNPROVEN', 'PASS']) {
      /* ADR0038:register:test */ g36CaseTest('L1926', 'registerAdr36RecordDerivationTests', `record finding binds ${stimulus} stimulus and ${gate} gate`, async () => {
        const api = await loadRecordCopy();
        const expected = gate === 'FAIL' ? 'observer-invalid' : gate === 'PASS' && stimulus === 'one' ? 'static-rejection-reproduced-after-http200' : 'inconclusive';
        assert.equal(api.deriveBrowserSyncTransportRuntimeDiagnosticRecordFinding(expectedFinding({ stimulus, gate })), expected);
      });
    }
  }
  for (const replay of ['DIVERGED', 'UNPROVEN']) {
    /* ADR0038:register:test */ g36CaseTest('L1934', 'registerAdr36RecordDerivationTests', `record finding cannot turn ${replay} replay into positive evidence`, async () => {
      const api = await loadRecordCopy();
      for (const sequence of ['OPTIONS-204-POST-200-loadingFinished', 'other', 'incomplete', 'ambiguous']) {/* ADR0038:sync */g36Variant('finding-sequence',sequence);/* ADR0038:end */
        assert.equal(api.deriveBrowserSyncTransportRuntimeDiagnosticRecordFinding(expectedFinding({ replay, sequence })), 'inconclusive');
      }
    });
  }
  for (const [outcome, profile] of [['static-redacted-rejection', 'mismatch'], ['other-rejection', 'mismatch'], ['unknown', 'unproven'], ['fulfilled', 'unproven']]) {
    /* ADR0038:register:test */ g36CaseTest('L1942', 'registerAdr36RecordDerivationTests', `record finding leaves unconfirmed public settlement ${outcome}/${profile} inconclusive`, async () => {
      const api = await loadRecordCopy();
      assert.equal(api.deriveBrowserSyncTransportRuntimeDiagnosticRecordFinding(expectedFinding({ outcome, profile })), 'inconclusive');
    });
  }
  /* ADR0038:register:test */ g36CaseTest('L1947', 'registerAdr36RecordDerivationTests', 'record helpers reject caller accessors without invocation and redact reflection throws', async () => {
    const api = await loadRecordCopy();
    let getterCount = 0;
    const malformed = Object.freeze(Object.defineProperty({}, 'hardViolation', { get() { getterCount += 1; throw new Error('private reason'); }, enumerable: true, configurable: false }));
    assert.throws(() => api.deriveBrowserSyncTransportRuntimeDiagnosticRecordGate(malformed), staticError);
    assert.equal(getterCount, 0);
    const throwing = new Proxy({}, { getPrototypeOf() { throw new Error('private reason'); } });
    assert.throws(() => api.deriveBrowserSyncTransportRuntimeDiagnosticRecordGate(throwing), staticError);
  });
  /* ADR0038:register:test */ g36CaseTest('L1956', 'registerAdr36RecordDerivationTests', 'record helpers require exact arity, closed shape, and frozen inputs', async () => {
    const api = await loadRecordCopy();
    const gate = api.deriveBrowserSyncTransportRuntimeDiagnosticRecordGate;
    assert.throws(() => gate(), staticError);
    assert.throws(() => gate(freeze({ hardViolation: false, proofIncomplete: false }), null), staticError);
    assert.throws(() => gate({ hardViolation: false, proofIncomplete: false }), staticError);
    assert.throws(() => gate(freeze({ hardViolation: false, proofIncomplete: false, evidence: true })), staticError);
    assert.throws(() => gate(freeze({ proofIncomplete: false, hardViolation: false })), staticError);
    assert.throws(() => api.deriveBrowserSyncTransportRuntimeDiagnosticRecordFinding(freeze({ ...expectedFinding(), stimulusCount: 'two' })), staticError);
  });
  /* ADR0038:register:test */ g36CaseTest('L1966', 'registerAdr36RecordDerivationTests', 'pure finalization is always NOT_EVIDENCE with null runtimeRecord and does not alter F', async () => {
    const api = await loadRecordCopy();
    const input = freeze(makeRecordPair());
    const before = JSON.stringify(input.foundationProjection);
    const first = api.finalizeBrowserSyncTransportRuntimeDiagnosticRecord(input);
    const second = api.finalizeBrowserSyncTransportRuntimeDiagnosticRecord(input);
    assert.deepEqual(first, { evidenceStatus: 'NOT_EVIDENCE', observerGate: 'UNPROVEN', finding: 'inconclusive', runtimeRecord: null });
    assert.deepEqual(second, first);
    assert.notEqual(first, second);
    assert.equal(Object.isFrozen(first), true);
    assert.equal(JSON.stringify(input.foundationProjection), before);
    assert.equal(Object.isFrozen(input.foundationProjection), true);
    assert.equal(input.foundationProjection.projectionType, 'browser-transport-diagnostic-foundation-projection');
    assert.equal(Object.hasOwn(input.foundationProjection, 'recordType'), false);
  });
  const integrityCases = [
    ['sourceUnmodified', a => { a.sources.mismatchCount += 1; }],
    ['instrumentedSourceCopyAbsent', a => { a.sources.extraTransportLoadCount += 1; }],
    ['compositionSeamsAbsent', a => { a.sources.extraCapabilityCount += 1; }],
    ['protocolAllowlistOnly', a => { a.wire[0].profileMatch = false; }],
    ['runtimeSurfaceMutationAbsent', a => { a.sources.runtimeActionCount = 2; }],
    ['fetchInterceptionAbsent', a => { a.sources.interceptionCount += 1; }],
    ['debuggerBreakpointsAndSteppingAbsent', a => { a.sources.debuggerOperationCount += 1; }],
    ['profilerAndTracingAbsent', a => { a.sources.profilerTracingOperationCount += 1; }],
    ['responseBodyReadAbsent', a => { a.parser.bodyReadCount += 1; }],
    ['freeRawInspectionAbsent', a => { a.parser.freeInspectionCount += 1; }],
    ['additionalNativeFetchAbsent', a => { a.network.additionalFetchCount += 1; }],
    ['observerProductEndpointRequestAbsent', a => { a.network.observerRequestCount += 1; }],
    ['rawPersistenceAbsent', a => { a.output.rawWriteCount += 1; }],
    ['observerDiagnosticDuringRunOutputAbsent', a => { a.output.diagnosticWriteCount += 1; }],
    ['singleTargetAndSessionConfirmed', a => { a.network.targetContradictionCount += 1; }],
    ['singleMainWorldEvaluationConfirmed', a => { a.network.evaluateCorrelationContradictionCount += 1; }],
  ];
  for (const [name, mutate] of integrityCases) {
    /* ADR0038:register:test */ g36CaseTest('L2000', 'registerAdr36RecordDerivationTests', `record integrity negative fact remains FAIL without A_obs: ${name}`, async () => {
      const api = await loadRecordCopy();
      const input = makeRecordPair();
      mutate(input.adapterLedger);
      const result = api.finalizeBrowserSyncTransportRuntimeDiagnosticRecord(freeze(input));
      assert.deepEqual(result, { evidenceStatus: 'NOT_EVIDENCE', observerGate: 'FAIL', finding: 'observer-invalid', runtimeRecord: null });
    });
  }
  /* ADR0038:register:test */ g36CaseTest('L2008', 'registerAdr36RecordDerivationTests', 'record integrity closedPrimitiveProjectionConfirmed cannot accept a widened F', async () => {
    const api = await loadRecordCopy();
    const input = makeRecordPair();
    input.foundationProjection.observer.primitiveProjectionProfile = 'allow-handle';
    assert.throws(() => api.finalizeBrowserSyncTransportRuntimeDiagnosticRecord(freeze(input)), staticError);
  });
  const cleanupCases = [
    ['cleanupStarted', a => { a.completion.markerCount = 2; }],
    ['debugPipeClosed', a => { a.resources[0].failureCount += 1; }],
    ['controllerObservationClosed', a => { a.parser.postObservationCount += 1; }],
    ['browserStopped', a => { a.resources[1].failureCount += 1; }],
    ['devServerStopped', a => { a.resources[2].failureCount += 1; }],
    ['gatewayStopped', a => { a.resources[3].failureCount += 1; }],
    ['profileRemoved', a => { a.resources[4].failureCount += 1; }],
    ['harnessFragmentsRemoved', a => { a.resources[5].failureCount += 1; }],
    ['objectGroupsAbsentOrReleased', a => { a.parser.objectGroupCount += 1; }],
    ['rawEventsDiscarded', a => { a.parser.retainedRawCount += 1; }],
    ['ephemeralIdentifiersDiscarded', a => { a.parser.retainedIdentifierCount += 1; }],
    ['permissionSiteCacheAndServiceWorkerStateCleared', a => { a.resources[4].creationState = 'bound'; a.resources[4].boundCount = 1; a.resources[4].activeAfterCleanupCount = 1; }],
    ['environmentRestored', a => { a.output.environmentDifferenceCount += 1; }],
    ['portsFree', a => { a.output.passivePortsSourceState = 'bound-before-cleanup'; a.output.listener5173Count = 1; a.output.listener8787Count = 0; }],
    ['repositoryAndIndexRestored', a => { a.output.repositoryIdentityDifferenceCount += 1; }],
    ['historicalEvidenceHashUnchanged', a => { a.output.historicalIdentityDifferenceCount += 1; }],
    ['observerStorageLogAndTelemetryResidueAbsent', a => { a.output.residueCount += 1; }],
    ['cleanupCompleted', a => { a.completion.reason = 'cleanup-terminal-failure'; }],
  ];
  for (const [name, mutate] of cleanupCases) {
    /* ADR0038:register:test */ g36CaseTest('L2035', 'registerAdr36RecordDerivationTests', `record cleanup negative fact remains FAIL without A_obs: ${name}`, async () => {
      const api = await loadRecordCopy();
      const input = makeRecordPair();
      mutate(input.adapterLedger);
      const result = api.finalizeBrowserSyncTransportRuntimeDiagnosticRecord(freeze(input));
      assert.equal(result.observerGate, 'FAIL');
      assert.equal(result.finding, 'observer-invalid');
      assert.equal(result.evidenceStatus, 'NOT_EVIDENCE');
      assert.equal(result.runtimeRecord, null);
    });
  }
  for (const [name, opening, closing] of [['networkDomainClosed', 2, 4], ['targetSessionClosed', 1, 5]]) {
    /* ADR0038:register:test */ g36CaseTest('L2047', 'registerAdr36RecordDerivationTests', `record cleanup rejects bound failed protocol close: ${name}`, async () => {
      const api = await loadRecordCopy();
      const input = makeRecordPair();
      for (const index of [opening, closing]) {/* ADR0038:sync */g36Variant('protocol-close',index);/* ADR0038:end */
        Object.assign(input.adapterLedger.wire[index], { intentCount: 1, acceptedFrameCount: 1, ackCount: 1, replyCount: 1, replyState: 'exact' });
        Object.assign(input.foundationProjection.observer.protocolOperations[index], { observedCountClass: 'one', result: 'match' });
      }
      input.adapterLedger.wire[closing].replyState = 'error';
      const result = api.finalizeBrowserSyncTransportRuntimeDiagnosticRecord(freeze(input));
      assert.equal(result.observerGate, 'FAIL');
      assert.equal(result.runtimeRecord, null);
    });
  }
  for (const resourceIndex of [1, 2, 3, 4, 5]) {
    /* ADR0038:register:test */ g36CaseTest('L2061', 'registerAdr36RecordDerivationTests', `record cannot promote bound host resource ${resourceIndex} from a root terminal count`, async () => {
      const api = await loadRecordCopy();
      const input = makeRecordPair();
      Object.assign(input.adapterLedger.resources[resourceIndex], { creationState: 'bound', boundCount: 1, terminalCount: 1 });
      const result = api.finalizeBrowserSyncTransportRuntimeDiagnosticRecord(freeze(input));
      assert.equal(result.observerGate, 'UNPROVEN');
      assert.equal(result.runtimeRecord, null);
    });
  }
  for (const mutate of [
    f => { f.replay.equivalence.comparisons[0].historicalValue = '0'.repeat(64); },
    f => { f.replay.equivalence.comparisons[1].fieldId = f.replay.equivalence.comparisons[0].fieldId; },
    f => { f.replay.causalContext.operatingSystem.family = 'counterfeit'; },
    f => { f.cleanup.checks[0].checkId = 'extra-cleanup'; },
    f => { f.observer.integrityChecks.pop(); },
    f => { f.requestBudget.extraRequests = 'zero'; },
    f => { f.causeStatus = 'CAUSE_PROVEN'; },
  ]) {
    /* ADR0038:register:test */ g36CaseTest('L2079', 'registerAdr36RecordDerivationTests', 'record finalizer rejects malformed F rather than borrowing its claims', async () => {
      const api = await loadRecordCopy();
      const input = makeRecordPair();
      mutate(input.foundationProjection);
      assert.throws(() => api.finalizeBrowserSyncTransportRuntimeDiagnosticRecord(freeze(input)), staticError);
    });
  }
  /* ADR0038:register:test */ g36CaseTest('L2086', 'registerAdr36RecordDerivationTests', 'record finalizer preserves a valid sticky Foundation FAIL', async () => {
    const api = await loadRecordCopy();
    const input = makeRecordPair();
    input.foundationProjection.cleanup.result = 'FAIL';
    input.foundationProjection.candidateObserverGate = 'FAIL';
    input.foundationProjection.candidateFinding = 'observer-invalid';
    const result = api.finalizeBrowserSyncTransportRuntimeDiagnosticRecord(freeze(input));
    assert.deepEqual(result, { evidenceStatus: 'NOT_EVIDENCE', observerGate: 'FAIL', finding: 'observer-invalid', runtimeRecord: null });
  });
  /* ADR0038:register:test */ g36CaseTest('L2095', 'registerAdr36RecordDerivationTests', 'record receipt orders reject nonpositive, fractional, duplicate and gapped per-layer values', async () => {
    const api = await loadRecordCopy();
    assert.equal(api.finalizeBrowserSyncTransportRuntimeDiagnosticRecord(freeze(makeRecordPair())).observerGate, 'UNPROVEN');
    for (const value of [0, -1, 1.5, 2, NaN, Number.MAX_SAFE_INTEGER + 1]) {/* ADR0038:sync */g36Variant('receipt-order',value);/* ADR0038:end */
      const input = makeRecordPair();
      input.foundationProjection.stages[0].receiptOrder = value;
      assert.throws(() => api.finalizeBrowserSyncTransportRuntimeDiagnosticRecord(freeze(input)), staticError);
    }
    const duplicate = makeRecordPair();
    duplicate.foundationProjection.stages[9].receiptOrder = 1;/* ADR0038:sync */g36Variant('receipt-order','duplicate');/* ADR0038:end */
    assert.throws(() => api.finalizeBrowserSyncTransportRuntimeDiagnosticRecord(freeze(duplicate)), staticError);
  });
}

// Test-only raw filesystem/object fixtures and ordinal-only resource completion scripts.
// These helpers never import an adapter/loader or inspect/mutate its owner.
import { createHash as sourceFixtureHash } from 'node:crypto'
import { deflateSync as sourceFixtureDeflate } from 'node:zlib'
import { win32 as sourceFixturePath } from 'node:path'
const sourceFixtureEncoder=new TextEncoder()
const sourceFixturePlanDisposals=new WeakMap()
function disposeAdapterSourceFixturePlan(plan) {
  const dispose=sourceFixturePlanDisposals.get(plan)
  if(dispose===undefined) throw new Error('source-fixture-disposal-identity-invalid')
  sourceFixturePlanDisposals.delete(plan)
  dispose()
}
const sourceFixtureBytes=value=>typeof value==='string'?sourceFixtureEncoder.encode(value):new Uint8Array(value)
const sourceFixtureDigest=(bytes,algorithm='sha1')=>sourceFixtureHash(algorithm).update(bytes).digest('hex')
function sourceFixtureConcat(...chunks) { const output=new Uint8Array(chunks.reduce((length,chunk)=>length+chunk.length,0)); let offset=0; for(const chunk of chunks) { output.set(chunk,offset); offset+=chunk.length } return output }
function sourceFixtureU32(value) { return Uint8Array.of(Math.floor(value/16777216)&255,Math.floor(value/65536)&255,Math.floor(value/256)&255,value&255) }
function sourceFixtureOidBytes(oid) { return Uint8Array.from(oid.match(/../g).map(value=>Number.parseInt(value,16))) }
function sourceFixtureCompare(left,right) { const a=sourceFixtureBytes(left),b=sourceFixtureBytes(right); for(let index=0;index<Math.min(a.length,b.length);index+=1) if(a[index]!==b[index]) return a[index]-b[index]; return a.length-b.length }
function sourceFixtureCrc(bytes) { let value=0xffffffff; for(const byte of bytes) { value^=byte; for(let bit=0;bit<8;bit+=1) value=(value>>>1)^((value&1)?0xedb88320:0) } return (value^0xffffffff)>>>0 }
function sourceFixtureVarint(value) { const bytes=[]; do { let byte=value%128; value=Math.floor(value/128); if(value) byte|=128; bytes.push(byte) } while(value); return Uint8Array.from(bytes) }
function sourceFixturePackHeader(type,length) { const bytes=[]; let byte=(type<<4)|(length%16); length=Math.floor(length/16); if(length) byte|=128; bytes.push(byte); while(length) { byte=length%128; length=Math.floor(length/128); if(length) byte|=128; bytes.push(byte) } return Uint8Array.from(bytes) }
function sourceFixtureOfs(distance) { const bytes=[distance&127]; while((distance=Math.floor(distance/128))>0) { distance-=1; bytes.unshift(128|(distance&127)) } return Uint8Array.from(bytes) }
function sourceFixtureDelta(base,target) {
  const bytes=[...sourceFixtureVarint(base.length),...sourceFixtureVarint(target.length)]
  if(base.length>0) {
    let flags=128; const size=[]
    for(let byte=0;byte<3;byte+=1) { const value=Math.floor(base.length/2**(byte*8))&255; if(value) { flags|=16<<byte; size.push(value) } }
    bytes.push(flags,...size)
  }
  for(let offset=base.length;offset<target.length;offset+=127) { const chunk=target.subarray(offset,Math.min(offset+127,target.length)); bytes.push(chunk.length,...chunk) }
  return Uint8Array.from(bytes)
}
function createAdapterSourceFixturePlan(inputFiles,options={}) {
  const repositoryRoot=options.repositoryRoot??'C:\\GoldenDawnFixture'
  const nodePath=options.nodePath??'C:\\NodeFixture\\node.exe'
  const chromePath='C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  const gitMode=options.gitMode??'loose'
  if(!['loose','pack-v2','pack-v3','ref-delta','ofs-delta','ref-loosebase'].includes(gitMode)) throw new Error('invalid-source-fixture-mode')
  const files=new Map(),directories=new Map(),objects=new Map(),tracked=new Map(),looseObjects=new Set(),packObjects=new Map(),packs=[]
  const join=(root,literal)=>sourceFixturePath.join(root,...literal.split('/'))
  const ensureDirectory=path=>{ if(directories.has(path)) return; directories.set(path,new Map()); const parent=sourceFixturePath.dirname(path); if(parent!==path) { ensureDirectory(parent); directories.get(parent).set(sourceFixturePath.basename(path),{path,pathType:'directory'}) } }
  const putFile=(path,value)=>{ const bytes=sourceFixtureBytes(value); ensureDirectory(sourceFixturePath.dirname(path)); files.set(path,bytes); directories.get(sourceFixturePath.dirname(path)).set(sourceFixturePath.basename(path),{path,pathType:'regular-file'}) }
  const addObject=(type,body)=>{ const bytes=sourceFixtureBytes(body),raw=sourceFixtureConcat(sourceFixtureBytes(type+' '+bytes.length+'\0'),bytes),oid=sourceFixtureDigest(raw); objects.set(oid,{oid,type,bytes,raw}); return oid }
  const nested=new Map()
  for(const [literal,input] of inputFiles) {
    const bytes=sourceFixtureBytes(input); putFile(join(repositoryRoot,literal),bytes)
    const oid=addObject('blob',bytes),parts=literal.split('/'); let parent=nested
    for(let index=0;index<parts.length-1;index+=1) { if(!parent.has(parts[index])) parent.set(parts[index],new Map()); parent=parent.get(parts[index]) }
    parent.set(parts.at(-1),{oid,literal,mode:'100644'})
  }
  const trees=new Map()
  const buildTree=(node,prefix)=>{
    const entries=[...node].sort(([a,left],[b,right])=>sourceFixtureCompare(a+(left instanceof Map?'/':''),b+(right instanceof Map?'/':'')))
    const chunks=[],children=[]
    for(const [name,item] of entries) {
      if(item instanceof Map) { const oid=buildTree(item,prefix+name+'/'); chunks.push(sourceFixtureBytes('40000 '+name+'\0'),sourceFixtureOidBytes(oid)); children.push({oid,tree:true}) }
      else { chunks.push(sourceFixtureBytes(item.mode+' '+name+'\0'),sourceFixtureOidBytes(item.oid)); children.push({...item,tree:false}); tracked.set(item.literal,item) }
    }
    const rawTree=sourceFixtureConcat(...chunks)
    const oid=addObject('tree',prefix===''&&options.rootTreeBodyTransform?options.rootTreeBodyTransform(rawTree):rawTree); trees.set(oid,children); return oid
  }
  const tree=buildTree(nested,'')
  const ordinaryCommit='tree '+tree+'\nauthor Fixture <fixture@example.invalid> 0 +0000\ncommitter Fixture <fixture@example.invalid> 0 +0000\n\nADR-0036 synthetic source fixture\n'
  const commit=addObject('commit',options.commitBodyTransform?options.commitBodyTransform(ordinaryCommit):ordinaryCommit)
  const gitRoot=join(repositoryRoot,'.git'),objectsRoot=join(gitRoot,'objects')
  ensureDirectory(gitRoot); ensureDirectory(join(gitRoot,'refs/heads')); ensureDirectory(join(gitRoot,'info')); ensureDirectory(objectsRoot); ensureDirectory(join(objectsRoot,'info')); ensureDirectory(join(objectsRoot,'pack'))
  putFile(join(gitRoot,'config'),'[core]\n\trepositoryformatversion = 0\n\tbare = false\n# '+'.'.repeat(512)+'\n')
  putFile(join(gitRoot,'HEAD'),options.detachedHead?commit+'\n':'ref: refs/heads/fixture\n')
  if(options.packedRefs) putFile(join(gitRoot,'packed-refs'),'# pack-refs with: peeled fully-peeled sorted\n'+commit+' refs/heads/fixture\n')
  else if(!options.detachedHead) putFile(join(gitRoot,'refs/heads/fixture'),commit+'\n')
  putFile(join(gitRoot,'info/exclude'),'# synthetic empty excludes\n')
  const indexEntries=[]
  for(const [literal,item] of [...tracked].sort(([a],[b])=>sourceFixtureCompare(a,b))) {
    const name=sourceFixtureBytes(literal),fixed=new Uint8Array(62)
    fixed.set(sourceFixtureU32(33188),24); fixed.set(sourceFixtureOidBytes(item.oid),40)
    fixed[60]=(name.length>>>8)&15; fixed[61]=name.length&255
    const length=62+name.length+1,padded=Math.ceil(length/8)*8,entry=new Uint8Array(padded)
    entry.set(fixed); entry.set(name,62); indexEntries.push(entry)
  }
  const indexPrefix=sourceFixtureConcat(sourceFixtureBytes('DIRC'),sourceFixtureU32(2),sourceFixtureU32(indexEntries.length),...indexEntries)
  putFile(join(gitRoot,'index'),sourceFixtureConcat(indexPrefix,sourceFixtureOidBytes(sourceFixtureDigest(indexPrefix))))
  const foundationLiteral='scripts/browser/browserSyncTransportRuntimeDiagnosticObserver.js',foundationOid=tracked.get(foundationLiteral)?.oid
  const packedOids=new Set()
  if(gitMode!=='loose') {
    if(!foundationOid) throw new Error('foundation-fixture-required')
    const target=objects.get(foundationOid),entries=[]
    let base=null,baseOid=null
    if(['ref-delta','ofs-delta','ref-loosebase'].includes(gitMode)) {
      const depth=options.deltaDepth??1
      if(!Number.isInteger(depth)||depth<1||depth>34) throw new Error('invalid-source-fixture-depth')
      base=target.bytes.subarray(0,target.bytes.length-depth); baseOid=addObject('blob',base)
      if(gitMode!=='ref-loosebase') { entries.push({oid:baseOid,type:3,bytes:base,baseOid:null}); packedOids.add(baseOid) }
      for(let step=1;step<=depth;step+=1) {
        const nextBytes=target.bytes.subarray(0,target.bytes.length-depth+step),nextOid=addObject('blob',nextBytes)
        let delta=sourceFixtureDelta(base,nextBytes)
        if(step===depth && options.deltaFault) {
          const head=sourceFixtureConcat(sourceFixtureVarint(base.length),sourceFixtureVarint(nextBytes.length))
          if(options.deltaFault==='base-length') delta=sourceFixtureConcat(sourceFixtureVarint(base.length+1),sourceFixtureVarint(nextBytes.length),delta.subarray(head.length))
          if(options.deltaFault==='result-length') delta=sourceFixtureConcat(sourceFixtureVarint(base.length),sourceFixtureVarint(nextBytes.length+1),delta.subarray(head.length))
          if(options.deltaFault==='zero-opcode') delta=sourceFixtureConcat(head,Uint8Array.of(0))
          if(options.deltaFault==='insert-truncated') delta=sourceFixtureConcat(head,Uint8Array.of(127,65))
          if(options.deltaFault==='varint-truncated') delta=Uint8Array.of(128)
          if(options.deltaFault==='copy-source-overflow') {
            const offsetBytes=[]; let opcode=0x90
            for(let index=0;index<4;index+=1) { const byte=Math.floor(base.length/2**(index*8))&255; if(byte) { opcode|=1<<index; offsetBytes.push(byte) } }
            delta=sourceFixtureConcat(head,Uint8Array.from([opcode,...offsetBytes,1]))
          }
        }
        const reference=step===depth && options.deltaFault==='ref-absent'?'0'.repeat(40):step===depth && options.deltaFault==='ref-cycle'?nextOid:baseOid
        entries.push({oid:nextOid,type:gitMode==='ofs-delta'?6:7,bytes:delta,baseOid:reference}); packedOids.add(nextOid)
        base=nextBytes; baseOid=nextOid
      }
    } else entries.push({oid:foundationOid,type:3,bytes:target.bytes,baseOid:null})
    packedOids.add(foundationOid)
    let offset=12; const segments=[]
    for(const entry of entries) {
      entry.offset=offset
      const basePrefix=entry.type===7?sourceFixtureOidBytes(entry.baseOid):entry.type===6?sourceFixtureOfs(options.deltaFault==='ofs-zero'?0:options.deltaFault==='ofs-outside'?offset+1000:offset-entries.find(candidate=>candidate.oid===entry.baseOid).offset):new Uint8Array()
      entry.segment=sourceFixtureConcat(sourceFixturePackHeader(entry.type,entry.bytes.length),basePrefix,new Uint8Array(sourceFixtureDeflate(entry.bytes)))
      entry.crc=sourceFixtureCrc(entry.segment); offset+=entry.segment.length; segments.push(entry.segment)
    }
    const packPrefix=sourceFixtureConcat(sourceFixtureBytes(options.packHeaderMagic??'PACK'),sourceFixtureU32(options.packHeaderVersion??(gitMode==='pack-v3'?3:2)),sourceFixtureU32(entries.length+(options.packHeaderCountDelta??0)),...segments)
    const packHash=sourceFixtureDigest(packPrefix),packBytes=sourceFixtureConcat(packPrefix,sourceFixtureOidBytes(packHash)),name='pack-'+packHash
    putFile(join(objectsRoot,'pack/'+name+'.pack'),packBytes)
    const sorted=[...entries].sort((a,b)=>a.oid<b.oid?-1:a.oid>b.oid?1:0),fanout=[]
    for(let byte=0;byte<256;byte+=1) fanout.push(sourceFixtureU32(sorted.filter(entry=>Number.parseInt(entry.oid.slice(0,2),16)<=byte).length))
    const index=sourceFixtureConcat(Uint8Array.of(255,116,79,99),sourceFixtureU32(2),...fanout,...sorted.map(entry=>sourceFixtureOidBytes(entry.oid)),...sorted.map(entry=>sourceFixtureU32(entry.crc)),...sorted.map(entry=>sourceFixtureU32(entry.offset)),sourceFixtureOidBytes(packHash))
    putFile(join(objectsRoot,'pack/'+name+'.idx'),sourceFixtureConcat(index,sourceFixtureOidBytes(sourceFixtureDigest(index))))
    const pack={name,entries,loaded:false}; packs.push(pack)
    for(const entry of entries) packObjects.set(entry.oid,{pack,entry})
  }
  for(const object of objects.values()) if(!packedOids.has(object.oid)) { putFile(join(objectsRoot,object.oid.slice(0,2)+'/'+object.oid.slice(2)),sourceFixtureDeflate(object.raw)); looseObjects.add(object.oid) }
  putFile(join(repositoryRoot,'node_modules/vite/package.json'),'{'+'"version":"8.1.4","bin":{"vite":"bin/vite.js"}}')
  putFile(join(repositoryRoot,'node_modules/vite/bin/vite.js'),'// inert synthetic Vite entry bytes\n')
  putFile(nodePath,'synthetic-node-binary-fixture\0')
  putFile(chromePath,'synthetic-chrome-binary-fixture\0')
  if(options.rawFixtureEdit) options.rawFixtureEdit({files,directories,objects,tracked,repositoryRoot,nodePath,chromePath,gitRoot,objectsRoot,commit,tree,packs,putFile,ensureDirectory})
  const tempParent=options.tempParent??'C:\\GoldenDawnFixtureTemp'
  ensureDirectory(tempParent)
  const identities=new Map()
  let nextIdentity=1
  for(const path of [...directories.keys(),...files.keys()].sort(sourceFixtureCompare)) identities.set(path,Object.freeze({pathType:directories.has(path)?'directory':'regular-file',volumeId:'1',fileId:String(nextIdentity++),byteLength:files.get(path)?.length??0,modifiedTimeNanoseconds:'1',changeTimeNanoseconds:'1',reparsePoint:false}))
  identities.set(tempParent,Object.freeze({pathType:'directory',volumeId:'1',fileId:'900000',byteLength:0,modifiedTimeNanoseconds:'1',changeTimeNanoseconds:'1',reparsePoint:false}))
  const snapshots=[],openResources=[],readObjects=new Set(),readLooseFolders=new Set(),readPackedObjects=new Set(),planningPacked=new Set()
  let firstDeltaDepthFailurePrefix=null
  let nextPlannedResourceKey=1
  // These immutable test descriptions may be shared: the normative fixture
  // defensively copies every result before delivering its raw producer signal.
  // No script entry or byte identity is used as runtime provenance.
  const chainTemplates=new Map(),listingTemplates=new Map(),readTemplates=new Map()
  const append=(script,kind,path,result,resourceKey=null)=>script.push(Object.freeze(resourceKey===null?{kind,path,result}:{kind,path,result,resourceKey}))
  const chain=(script,path)=>{
    if(chainTemplates.has(path)) { for(const item of chainTemplates.get(path)) script.push(item); return }
    const template=[]
    const root=sourceFixturePath.parse(path).root,parts=path.slice(root.length).split('\\').filter(Boolean)
    let current=root
    for(let index=-1;index<parts.length;index+=1) {
      if(index>=0) current=sourceFixturePath.join(current,parts[index])
      append(template,'canonicalize-path',current,Object.freeze({kind:'canonical-path',path:current}))
      append(template,'inspect-path',current,Object.freeze({kind:'path-identity',...identities.get(current)}))
    }
    chainTemplates.set(path,Object.freeze(template)); for(const item of template) script.push(item)
  }
  const open=(script,path)=>{
    const entry={path,closed:false,resourceKey:nextPlannedResourceKey++}
    chain(script,path); append(script,'open-resource',path,{kind:'resource-opened'},entry.resourceKey)
    append(script,'inspect-open-resource',path,{kind:'open-resource-identity',...identities.get(path)})
    openResources.push(entry); return entry
  }
  const read=(script,entry)=>{
    if(readTemplates.has(entry.path)) { for(const item of readTemplates.get(entry.path)) script.push(item); return }
    const template=[]
    const bytes=files.get(entry.path)
    for(let offset=0;;offset+=1048576) {
      const chunk=bytes.subarray(offset,Math.min(offset+1048576,bytes.length)),endOfFile=offset+chunk.length===bytes.length
      append(template,'read-resource',entry.path,Object.freeze({kind:'resource-bytes',bytes:new Uint8Array(chunk),endOfFile}))
      if(endOfFile) break
    }
    append(template,'inspect-open-resource',entry.path,Object.freeze({kind:'open-resource-identity',...identities.get(entry.path)}))
    readTemplates.set(entry.path,Object.freeze(template)); for(const item of template) script.push(item)
  }
  const close=(script,entry)=>{ if(entry.closed) return; chain(script,entry.path); append(script,'close-resource',entry.path,{kind:'resource-closed'},entry.resourceKey??null); entry.closed=true }
  const readFile=(script,path,retain=true)=>{ const entry=open(script,path); read(script,entry); snapshots.push(entry); if(!retain) close(script,entry); return entry }
  const list=(script,path)=>{
    const entry=open(script,path)
    if(!listingTemplates.has(path)) listingTemplates.set(path,Object.freeze({kind:'directory-entries',entries:Object.freeze([...directories.get(path)].sort(([a],[b])=>sourceFixtureCompare(a,b)).map(([name,item])=>Object.freeze({name,pathType:item.pathType,reparsePoint:false})))}))
    append(script,'list-directory',path,listingTemplates.get(path))
    close(script,entry)
  }
  const packedRead=(script,oid,depth=0)=>{
    if(readPackedObjects.has(oid)||planningPacked.has(oid)||!packObjects.has(oid)) return
    if(depth>32) { if(firstDeltaDepthFailurePrefix===null) firstDeltaDepthFailurePrefix=script.length; return }
    planningPacked.add(oid)
    const {pack,entry}=packObjects.get(oid)
    if(!pack.loaded) { readFile(script,join(objectsRoot,'pack/'+pack.name+'.pack'),false); pack.loaded=true }
    if(entry.type===6) packedRead(script,entry.baseOid,depth+1)
    if(entry.type===7) objectRead(script,entry.baseOid,depth+1)
    readPackedObjects.add(oid); planningPacked.delete(oid)
  }
  const objectRead=(script,oid,depth=0)=>{
    if(depth>32) { if(firstDeltaDepthFailurePrefix===null) firstDeltaDepthFailurePrefix=script.length; return }
    if(readObjects.has(oid)) return
    const prefix=oid.slice(0,2),folder=join(objectsRoot,prefix)
    if(directories.has(folder)&&!readLooseFolders.has(prefix)) { list(script,folder); readLooseFolders.add(prefix) }
    if(!objects.has(oid)) return
    if(looseObjects.has(oid)) readFile(script,join(objectsRoot,prefix+'/'+oid.slice(2)),false)
    else packedRead(script,oid,depth)
    readObjects.add(oid)
  }
  const walk=(script,oid)=>{ objectRead(script,oid); for(const child of trees.get(oid)) if(child.tree) walk(script,child.oid) }
  const preflight=[]
  append(preflight,'canonicalize-path',repositoryRoot,{kind:'canonical-path',path:repositoryRoot}); chain(preflight,repositoryRoot)
  list(preflight,repositoryRoot); list(preflight,gitRoot); readFile(preflight,join(gitRoot,'config'))
  if(options.packedRefs) readFile(preflight,join(gitRoot,'packed-refs'))
  readFile(preflight,join(gitRoot,'HEAD'))
  if(!options.detachedHead) {
    list(preflight,gitRoot); list(preflight,join(gitRoot,'refs')); list(preflight,join(gitRoot,'refs/heads'))
    if(!options.packedRefs) readFile(preflight,join(gitRoot,'refs/heads/fixture'))
  }
  readFile(preflight,join(gitRoot,'index'))
  list(preflight,join(gitRoot,'info')); list(preflight,join(gitRoot,'refs')); list(preflight,objectsRoot); list(preflight,join(objectsRoot,'info')); list(preflight,join(objectsRoot,'pack'))
  for(const pack of packs) readFile(preflight,join(objectsRoot,'pack/'+pack.name+'.idx'),false)
  const beforeObjectReads=preflight.length
  objectRead(preflight,commit); walk(preflight,tree)
  for(const [literal,item] of tracked) { readFile(preflight,join(repositoryRoot,literal)); objectRead(preflight,item.oid) }
  readFile(preflight,join(repositoryRoot,'node_modules/vite/package.json'))
  readFile(preflight,join(repositoryRoot,'node_modules/vite/bin/vite.js'))
  readFile(preflight,nodePath); readFile(preflight,chromePath)
  function verification(phase) {
    if(!['pre-o0','post-settlement','post-cleanup'].includes(phase)) throw new Error('invalid-source-fixture-phase')
    const script=[]
    list(script,gitRoot); list(script,join(gitRoot,'info')); list(script,join(gitRoot,'refs')); list(script,objectsRoot); list(script,join(objectsRoot,'info')); list(script,join(objectsRoot,'pack'))
    for(const original of snapshots) {
      chain(script,original.path)
      const current=original.closed?open(script,original.path):original
      append(script,'inspect-open-resource',original.path,{kind:'open-resource-identity',...identities.get(original.path)})
      read(script,current)
      const fresh=open(script,original.path); read(script,fresh); close(script,fresh)
      if(current!==original) close(script,current)
    }
    return script
  }
  function closing() { const script=[]; for(const entry of openResources) close(script,entry); return script }
  function closingAfterPrefix(completedEntries) {
    if(!Number.isSafeInteger(completedEntries)||completedEntries<0||completedEntries>preflight.length) throw new Error('source-fixture-prefix-count-invalid')
    return closingAfterScripts(preflight.slice(0,completedEntries))
  }
  function closingAfterScripts(completedEntries) {
    if(!Array.isArray(completedEntries)) throw new Error('source-fixture-completed-script-array-required')
    const active=new Map()
    for(const entry of completedEntries) {
      if(entry.state==='failed') continue
      if(entry.kind==='open-resource') {
        if(!Number.isSafeInteger(entry.resourceKey)||entry.resourceKey<=0||active.has(entry.resourceKey)) throw new Error('source-fixture-resource-key-invalid')
        active.set(entry.resourceKey,{path:entry.path,closed:false,resourceKey:entry.resourceKey})
      }
      if(entry.kind==='close-resource') {
        const opened=active.get(entry.resourceKey)
        if(!opened||opened.path!==entry.path||opened.closed) throw new Error('source-fixture-close-key-invalid')
        opened.closed=true
      }
    }
    const script=[]; for(const entry of active.values()) close(script,entry); return script
  }
  function pathChecks(path,identity=identities.get(path)) {
    if(!identity) throw new Error('source-fixture-path-identity-required')
    identities.set(path,Object.freeze({...identity}))
    chainTemplates.delete(path)
    const script=[]; chain(script,path); return script
  }
  function handleCheckAndClose(path,identity=identities.get(path)) {
    const script=pathChecks(path,identity)
    append(script,'inspect-open-resource',path,{kind:'open-resource-identity',...identity})
    append(script,'close-resource',path,{kind:'resource-closed'})
    return script
  }
  const expectedObjectReads=[...readObjects].filter(oid=>looseObjects.has(oid)).length+readPackedObjects.size
  let expandedByteLength=0
  for(const oid of readObjects) if(looseObjects.has(oid)) expandedByteLength+=objects.get(oid).raw.length
  for(const oid of readPackedObjects) { const entry=packObjects.get(oid).entry; expandedByteLength+=entry.bytes.length+(entry.type>=6?objects.get(oid).bytes.length:0) }
  const worktreeByteLength=[...tracked.keys()].reduce((total,literal)=>total+files.get(join(repositoryRoot,literal)).length,0)
  const plan={repositoryRoot,nodePath,chromePath,repositoryCommit:commit,repositoryTree:tree,beforeObjectReads,gitMode,files,identities,preflight,verification,closing,closingAfterPrefix,closingAfterScripts,pathChecks,handleCheckAndClose,tempParent,expectedObjectReads,expandedByteLength,worktreeByteLength,firstDeltaDepthFailurePrefix}
  sourceFixturePlanDisposals.set(plan,()=>{
    // Only test-owned static descriptions are released after all observations.
    // The productive owner, fixture capability graph and raw ledgers are untouched.
    for(const map of [files,directories,objects,tracked,packObjects,nested,trees,identities,chainTemplates,listingTemplates,readTemplates]) map.clear()
    for(const set of [looseObjects,packedOids,readObjects,readLooseFolders,readPackedObjects,planningPacked]) set.clear()
    for(const array of [packs,indexEntries,snapshots,openResources,preflight]) array.length=0
  })
  return plan
}
async function driveAdapterSourceResourceScript(controller,script,startOrdinal=null) {
  let previous=startOrdinal===null?0:startOrdinal-1
  for(let index=0;index<script.length;index+=1) {
    let ordinals=[]
    for(let checkpoint=0;checkpoint<128;checkpoint+=1) {
      ordinals=controller.snapshot().liveOrdinals.resourceOperations
      if(ordinals.length) break
      await Promise.resolve()
    }
    if(ordinals.length!==1 || ordinals[0]<=previous) throw new Error('source-fixture-resource-sequence-mismatch')
    previous=ordinals[0]
    const entry=script[index]
    controller.dispatch({kind:'resource-completion',operationOrdinal:previous,state:entry.state??'completed',result:entry.state==='failed'?null:entry.result})
  }
  return previous
}
function sourceFixtureRewriteTrailer(bytes) {
  const output=new Uint8Array(bytes)
  output.set(sourceFixtureOidBytes(sourceFixtureDigest(output.subarray(0,output.length-20))),output.length-20)
  return output
}
function sourceFixtureRawResultTransform(predicate,change,{allMatches=false}={}) {
  let affectedIndex=-1
  const transform=script=>{
    const index=script.findIndex(predicate)
    if(index<0) return script
    if(affectedIndex<0) affectedIndex=index
    return script.map((entry,position)=>(allMatches?predicate(entry):position===index)?{...entry,result:change(entry.result)}:entry)
  }
  return {transform,get affectedIndex(){return affectedIndex}}
}
function sourceFixtureReadEnd(plan,path) {
  const read=plan.preflight.findIndex(entry=>entry.kind==='read-resource'&&entry.path===path)
  if(read<0) throw new Error('source-fixture-read-anchor-missing')
  let end=read
  while(plan.preflight[end]?.kind==='read-resource'&&plan.preflight[end]?.path===path) end+=1
  if(plan.preflight[end]?.kind!=='inspect-open-resource'||plan.preflight[end]?.path!==path) throw new Error('source-fixture-read-end-missing')
  end+=1
  if(path.includes('\\.git\\objects\\')) {
    const closed=plan.preflight.findIndex((entry,index)=>index>=end&&entry.kind==='close-resource'&&entry.path===path)
    if(closed<0) throw new Error('source-fixture-close-anchor-missing')
    end=closed+1
  }
  return {first:read+1,end}
}
function sourceFixtureListEnd(plan,path,occurrence=0) {
  const listed=plan.preflight.map((entry,index)=>entry.kind==='list-directory'&&entry.path===path?index:-1).filter(index=>index>=0)[occurrence]??-1
  if(listed<0) throw new Error('source-fixture-list-anchor-missing')
  const closed=plan.preflight.findIndex((entry,index)=>index>listed&&entry.kind==='close-resource'&&entry.path===path)
  return {first:listed+1,end:closed+1}
}
function sourceFixtureBeforeFile(plan,path) {
  const opened=plan.preflight.findIndex(entry=>entry.kind==='open-resource'&&entry.path===path)
  if(opened<0) throw new Error('source-fixture-open-anchor-missing')
  return opened-2*(path.slice(sourceFixturePath.parse(path).root.length).split('\\').filter(Boolean).length+1)
}
function sourceFixtureError(assert,outcome) {
  assert.equal(outcome.kind,'error')
  assert.equal(Object.getPrototypeOf(outcome.error),Error.prototype)
  assert.deepEqual(Reflect.ownKeys(outcome.error),['message'])
  assert.deepEqual(Object.getOwnPropertyDescriptor(outcome.error,'message'),{value:'browserSyncTransportRuntimeDiagnosticAdapterFailed',writable:true,enumerable:false,configurable:true})
}
function sourceFixtureFailurePrefix(assert,result,prefix) {
  sourceFixtureError(assert,result.outcome)
  assert.ok(Number.isSafeInteger(result.completedSourceEntries))
  assert.ok(result.completedSourceEntries>=prefix.first,'source must consume the intended raw fixture before rejecting')
  assert.ok(result.completedSourceEntries<=prefix.end,'source must reject at its first failing boundary')
}
function sourceFixtureEditConfig(text) {
  return graph=>graph.putFile(sourceFixturePath.join(graph.gitRoot,'config'),'[core]\nrepositoryformatversion = 0\nbare = false\n'+text+'\n')
}
function sourceFixtureObjectPath(plan,oid) { return sourceFixturePath.join(plan.repositoryRoot,'.git','objects',oid.slice(0,2),oid.slice(2)) }
function sourceFixturePackPath(plan,suffix) {
  const paths=[...plan.files.keys()].filter(path=>path.endsWith(suffix)&&path.includes('\\objects\\pack\\'))
  if(paths.length!==1) throw new Error('source-fixture-pack-anchor-missing')
  return paths[0]
}
function sourceFixtureVersion3Index(graph,extended=false,extendedFlags=0) {
  const chunks=[]
  for(const [literal,item] of [...graph.tracked].sort(([a],[b])=>sourceFixtureCompare(a,b))) {
    const name=sourceFixtureBytes(literal),fixed=new Uint8Array(extended?64:62)
    fixed.set(sourceFixtureU32(33188),24); fixed.set(sourceFixtureOidBytes(item.oid),40)
    fixed[60]=(extended?64:0)|((name.length>>>8)&15); fixed[61]=name.length&255
    if(extended) { fixed[62]=(extendedFlags>>>8)&255; fixed[63]=extendedFlags&255 }
    const entry=new Uint8Array(Math.ceil((fixed.length+name.length+1)/8)*8)
    entry.set(fixed); entry.set(name,fixed.length); chunks.push(entry)
  }
  const body=sourceFixtureConcat(sourceFixtureBytes('DIRC'),sourceFixtureU32(3),sourceFixtureU32(chunks.length),...chunks)
  graph.putFile(sourceFixturePath.join(graph.gitRoot,'index'),sourceFixtureConcat(body,sourceFixtureOidBytes(sourceFixtureDigest(body))))
}
function sourceFixtureIndexExtension(graph,signature) {
  const path=sourceFixturePath.join(graph.gitRoot,'index'),bytes=graph.files.get(path)
  const body=sourceFixtureConcat(bytes.subarray(0,bytes.length-20),sourceFixtureBytes(signature),sourceFixtureU32(0))
  graph.putFile(path,sourceFixtureConcat(body,sourceFixtureOidBytes(sourceFixtureDigest(body))))
}
function sourceFixtureLargePackOffsets(graph,fault=null) {
  const path=[...graph.files.keys()].find(path=>path.endsWith('.idx')&&path.includes('\\objects\\pack\\'))
  if(path===undefined) throw new Error('source-fixture-large-offset-index-required')
  const bytes=graph.files.get(path),count=graph.packs[0].entries.length,offsetsAt=1032+count*24,largeAt=1032+count*28
  const prefix=new Uint8Array(bytes.subarray(0,largeAt)),large=[]
  for(let index=0;index<count;index+=1) {
    const offset=bytes[offsetsAt+index*4]*16777216+bytes[offsetsAt+index*4+1]*65536+bytes[offsetsAt+index*4+2]*256+bytes[offsetsAt+index*4+3]
    prefix.set(sourceFixtureU32(fault==='unused'&&index===0?offset:2147483648+(fault==='missing'?count:fault==='duplicate'?0:index)),offsetsAt+index*4)
    large.push(sourceFixtureU32(fault==='unsafe'?2097152:0),sourceFixtureU32(fault==='cap'?536870912:fault==='before-header'?11:offset))
  }
  const body=sourceFixtureConcat(prefix,...large,bytes.subarray(bytes.length-40,bytes.length-20))
  graph.putFile(path,sourceFixtureConcat(body,sourceFixtureOidBytes(sourceFixtureDigest(body))))
}
function sourceFixtureFirstTreeEntry(bytes,{name=null,mode=null,second=false,truncate=false,upperName=false}={}) {
  const space=bytes.indexOf(32),nul=bytes.indexOf(0),end=nul+21
  if(space<=0||nul<=space||end>bytes.length) throw new Error('source-fixture-tree-entry-required')
  if(truncate) return bytes.subarray(0,end-1)
  const decode=value=>new TextDecoder('utf-8',{fatal:true}).decode(value)
  const originalName=decode(bytes.subarray(space+1,nul)),chosenName=upperName?originalName.toUpperCase():(name??originalName)
  const chosenMode=mode??(second?'100644':decode(bytes.subarray(0,space)))
  const record=sourceFixtureConcat(sourceFixtureBytes(chosenMode+' '+chosenName+'\0'),bytes.subarray(nul+1,end))
  const first=sourceFixtureConcat(sourceFixtureBytes('100644 '+originalName+'\0'),bytes.subarray(nul+1,end))
  return second?sourceFixtureConcat(first,record,bytes.subarray(end)):sourceFixtureConcat(record,bytes.subarray(end))
}
function sourceFixtureNegativeCases() {
  const join=(plan,...parts)=>sourceFixturePath.join(plan.repositoryRoot,...parts)
  const readCase=(name,path,options,change,mutation=null)=>({name,options,path,kind:'read',change,mutation})
  const listCase=(name,parts,options,mutation=null)=>({name,options,kind:'list',path:plan=>join(plan,...parts),mutation})
  const cases=[
    readCase('HEAD closed grammar',plan=>join(plan,'.git','HEAD'),{},bytes=>{bytes[0]=88;return bytes}),
    readCase('direct ref lowerhex',plan=>join(plan,'.git','refs','heads','fixture'),{},bytes=>{bytes[0]=103;return bytes}),
    readCase('packed ref lowerhex',plan=>join(plan,'.git','packed-refs'),{packedRefs:true},bytes=>{const marker=sourceFixtureBytes('# pack-refs with: peeled fully-peeled sorted\n').length;bytes[marker]=103;return bytes}),
    readCase('repository version unsupported',plan=>join(plan,'.git','config'),{rawFixtureEdit:sourceFixtureEditConfig('[core]\nrepositoryformatversion = 9')},null),
    readCase('Git include forbidden',plan=>join(plan,'.git','config'),{rawFixtureEdit:sourceFixtureEditConfig('[include]\npath = ignored')},null),
    readCase('unknown extension forbidden',plan=>join(plan,'.git','config'),{rawFixtureEdit:sourceFixtureEditConfig('[extensions]\nunknown = true')},null,{name:'source-unknown-extension-guard',from:"sourceRequire(owner,key==='objectformat' && value==='sha1' && !seen.has('extensions.objectformat'))",to:'sourceRequire(owner,true)'}),
    readCase('SHA256 object format forbidden',plan=>join(plan,'.git','config'),{rawFixtureEdit:sourceFixtureEditConfig('[extensions]\nobjectformat = sha256')},null),
    readCase('promisor remote forbidden',plan=>join(plan,'.git','config'),{rawFixtureEdit:sourceFixtureEditConfig('[remote "fixture"]\npromisor = true')},null),
    readCase('index unsupported version',plan=>join(plan,'.git','index'),{},bytes=>{bytes[7]=4;return sourceFixtureRewriteTrailer(bytes)}),
    readCase('index SHA1 trailer',plan=>join(plan,'.git','index'),{},bytes=>{bytes[bytes.length-1]^=1;return bytes},{name:'source-index-sha1-guard',from:"sourceRequire(owner,[2,3].includes(version) && count<=4096 && sourceHash(bytes.subarray(0,bytes.length-20),'sha1')===sourceHex(bytes.subarray(bytes.length-20)))",to:'sourceRequire(owner,[2,3].includes(version) && count<=4096)'}),
    readCase('index count over4096',plan=>join(plan,'.git','index'),{},bytes=>{bytes.set(sourceFixtureU32(4097),8);return sourceFixtureRewriteTrailer(bytes)}),
    readCase('loose zlib invalid',plan=>sourceFixtureObjectPath(plan,plan.repositoryCommit),{},bytes=>{bytes[0]=0;return bytes}),
    readCase('loose trailing compressed bytes',plan=>sourceFixtureObjectPath(plan,plan.repositoryCommit),{rawFixtureEdit:graph=>{const path=sourceFixturePath.join(graph.objectsRoot,graph.commit.slice(0,2),graph.commit.slice(2));graph.putFile(path,sourceFixtureConcat(graph.files.get(path),Uint8Array.of(0)))}},null,{name:'source-zlib-complete-input-guard',from:' && result.engine.bytesWritten === bytes.length',to:''}),
    readCase('loose OID mismatch',plan=>sourceFixtureObjectPath(plan,plan.repositoryCommit),{rawFixtureEdit:graph=>{const object=graph.objects.get(graph.commit),raw=new Uint8Array(object.raw);raw[raw.length-2]^=1;graph.putFile(sourceFixturePath.join(graph.objectsRoot,graph.commit.slice(0,2),graph.commit.slice(2)),sourceFixtureDeflate(raw))}},null,{name:'source-loose-object-oid-guard',from:" && sourceHash(inflated,'sha1')===oid",to:''}),
    readCase('pack index signature',plan=>sourceFixturePackPath(plan,'.idx'),{gitMode:'pack-v2'},bytes=>{bytes[0]=0;return bytes}),
    readCase('pack index version',plan=>sourceFixturePackPath(plan,'.idx'),{gitMode:'pack-v2'},bytes=>{bytes[7]=3;return sourceFixtureRewriteTrailer(bytes)}),
    readCase('pack index trailer',plan=>sourceFixturePackPath(plan,'.idx'),{gitMode:'pack-v2'},bytes=>{bytes[bytes.length-1]^=1;return bytes},{name:'source-pack-index-sha1-guard',from:"sourceRequire(owner,largeCount<=count && sourceHash(bytes.subarray(0,bytes.length-20),'sha1')===sourceHex(bytes.subarray(bytes.length-20)))",to:'sourceRequire(owner,largeCount<=count)'}),
    readCase('pack index fanout histogram',plan=>sourceFixturePackPath(plan,'.idx'),{gitMode:'ref-delta'},bytes=>{const read=at=>bytes[at]*16777216+bytes[at+1]*65536+bytes[at+2]*256+bytes[at+3];let found=false;for(let index=0;index<255;index+=1)if(read(8+4*index)<read(12+4*index)){bytes.set(sourceFixtureU32(read(12+4*index)),8+4*index);found=true;break}if(!found)throw new Error('source-fixture-fanout-control-required');return sourceFixtureRewriteTrailer(bytes)},{name:'source-pack-fanout-histogram-guard',from:'sourceRequire(owner,fanout[index]===cumulative)',to:'sourceRequire(owner,true)'}),
    readCase('pack index OID ordering',plan=>sourceFixturePackPath(plan,'.idx'),{gitMode:'ref-delta'},bytes=>{const count=2,names=1032,crc=names+count*20,offsets=crc+count*4;for(const [at,width]of[[names,20],[crc,4],[offsets,4]]){const first=bytes.slice(at,at+width);bytes.copyWithin(at,at+width,at+width*2);bytes.set(first,at+width)}return sourceFixtureRewriteTrailer(bytes)},{name:'source-pack-index-order-guard',from:'sourceRequire(owner,index===0 || oid>previous); previous=oid',to:'sourceRequire(owner,true); previous=oid'}),
    readCase('pack index offset beforeheader',plan=>sourceFixturePackPath(plan,'.idx'),{gitMode:'pack-v2'},bytes=>{bytes.set(sourceFixtureU32(11),1056);return sourceFixtureRewriteTrailer(bytes)}),
    readCase('pack CRC32',plan=>sourceFixturePackPath(plan,'.idx'),{gitMode:'pack-v2'},bytes=>{bytes[1052]^=1;return sourceFixtureRewriteTrailer(bytes)},{name:'source-pack-crc32-guard',from:'sourceRequire(owner,sourceCrc32(bytes.subarray(candidate.offset,candidate.end))===candidate.crc)',to:'sourceRequire(owner,true)'}),
    readCase('pack magic',plan=>sourceFixturePackPath(plan,'.pack'),{gitMode:'pack-v2',packHeaderMagic:'PAKK'},null),
    readCase('pack version',plan=>sourceFixturePackPath(plan,'.pack'),{gitMode:'pack-v2',packHeaderVersion:4},null,{name:'source-pack-header-guard',from:"sourceRequire(owner,sourceAscii(owner,bytes.subarray(0,4))==='PACK' && [2,3].includes(sourceU32(owner,bytes,4)) && sourceU32(owner,bytes,8)===pack.index.count)",to:'sourceRequire(owner,true)'}),
    readCase('pack count',plan=>sourceFixturePackPath(plan,'.pack'),{gitMode:'pack-v2',packHeaderCountDelta:1},null),
    readCase('pack SHA1 trailer',plan=>sourceFixturePackPath(plan,'.pack'),{gitMode:'pack-v2'},bytes=>{bytes[bytes.length-1]^=1;return bytes},{name:'source-pack-trailer-crossbinding-guard',from:"sourceRequire(owner,sourceHash(bytes.subarray(0,bytes.length-20),'sha1')===sourceHex(bytes.subarray(bytes.length-20)) && pack.index.packHash===sourceHex(bytes.subarray(bytes.length-20)))",to:'sourceRequire(owner,true)'}),
    ...['base-length','result-length','zero-opcode','copy-source-overflow','insert-truncated','varint-truncated','ref-absent','ref-cycle'].map(fault=>readCase('REF delta '+fault,plan=>sourceFixturePackPath(plan,'.pack'),{gitMode:'ref-delta',deltaFault:fault},null)),
    ...['ofs-zero','ofs-outside'].map(fault=>readCase('OFS delta '+fault,plan=>sourceFixturePackPath(plan,'.pack'),{gitMode:'ofs-delta',deltaFault:fault},null)),
    readCase('delta depth33',plan=>sourceFixturePackPath(plan,'.pack'),{gitMode:'ref-delta',deltaDepth:33},null),
    listCase('alternates forbidden',['.git','objects','info'],{rawFixtureEdit:graph=>graph.putFile(sourceFixturePath.join(graph.objectsRoot,'info','alternates'),'')},{name:'source-alternates-presence-guard',from:"sourceRequire(owner,!info.has('alternates') && !info.has('http-alternates'))",to:'sourceRequire(owner,true)'}),
    listCase('grafts forbidden',['.git','info'],{rawFixtureEdit:graph=>graph.putFile(sourceFixturePath.join(graph.gitRoot,'info','grafts'),'')}),
    listCase('replace refs forbidden',['.git','refs'],{rawFixtureEdit:graph=>graph.putFile(sourceFixturePath.join(graph.gitRoot,'refs','replace','0'.repeat(40)),'0'.repeat(40)+'\n')},{name:'source-replace-ref-presence-guard',from:"sourceRequire(owner,!refs.has('replace'))",to:'sourceRequire(owner,true)'}),
    listCase('shallow repository forbidden',['.git'],{rawFixtureEdit:graph=>graph.putFile(sourceFixturePath.join(graph.gitRoot,'shallow'),'0'.repeat(40)+'\n')}),
    readCase('Vite duplicate key',plan=>join(plan,'node_modules','vite','package.json'),{rawFixtureEdit:graph=>graph.putFile(sourceFixturePath.join(graph.repositoryRoot,'node_modules','vite','package.json'),'{"version":"8.1.4","version":"8.1.4","bin":{"vite":"bin/vite.js"}}')},null,{name:'source-json-decoded-duplicate-guard',from:'sourceRequire(owner,!keys.has(key)); keys.add(key)',to:'sourceRequire(owner,true); keys.add(key)'}),
    readCase('Vite escaped duplicate key',plan=>join(plan,'node_modules','vite','package.json'),{rawFixtureEdit:graph=>graph.putFile(sourceFixturePath.join(graph.repositoryRoot,'node_modules','vite','package.json'),'{"version":"8.1.4","ver\\u0073ion":"8.1.4","bin":{"vite":"bin/vite.js"}}')},null),
    readCase('Vite version mismatch',plan=>join(plan,'node_modules','vite','package.json'),{rawFixtureEdit:graph=>graph.putFile(sourceFixturePath.join(graph.repositoryRoot,'node_modules','vite','package.json'),'{"version":"8.1.5","bin":{"vite":"bin/vite.js"}}')},null),
    readCase('Vite entry mismatch',plan=>join(plan,'node_modules','vite','package.json'),{rawFixtureEdit:graph=>graph.putFile(sourceFixturePath.join(graph.repositoryRoot,'node_modules','vite','package.json'),'{"version":"8.1.4","bin":{"vite":"bin/other.js"}}')},null),
    ...[
      ['missing commit header separator',text=>text.replace('\n\n','\n')],
      ['duplicate commit tree header',text=>text.slice(0,text.indexOf('\n')+1)+text],
      ['tree header is not first',text=>'encoding UTF-8\n'+text],
      ['malformed commit tree OID',text=>text.replace(/^tree ./,'tree g')],
    ].map(([name,commitBodyTransform])=>readCase(name,plan=>sourceFixtureObjectPath(plan,plan.repositoryCommit),{commitBodyTransform},null)),
    ...[
      ['tree symlink mode',{mode:'120000'}],['tree gitlink mode',{mode:'160000'}],['tree unknown mode',{mode:'100640'}],
      ['tree parent traversal',{name:'..'}],['tree slash name',{name:'nested/name'}],['tree backslash name',{name:'nested\\name'}],
      ['tree reserved Windows path',{name:'CON'}],['tree trailing-dot path',{name:'file.'}],
      ['tree duplicate name',{second:true}],['tree case collision',{upperName:true,second:true}],
      ['tree byte ordering',{name:'!',second:true}],['tree truncated object identity',{truncate:true}],
    ].map(([name,shape])=>readCase(name,plan=>sourceFixtureObjectPath(plan,plan.repositoryTree),{rootTreeBodyTransform:bytes=>sourceFixtureFirstTreeEntry(bytes,shape)},null)),
    readCase('index v3 reserved extended flags',plan=>join(plan,'.git','index'),{rawFixtureEdit:graph=>sourceFixtureVersion3Index(graph,true,1)},null),
    ...['missing','unused','unsafe','cap','before-header','duplicate'].map(fault=>readCase('pack large-offset '+fault,plan=>sourceFixturePackPath(plan,'.idx'),{gitMode:fault==='duplicate'?'ref-delta':'pack-v2',rawFixtureEdit:graph=>sourceFixtureLargePackOffsets(graph,fault)},null)),
    ...['commondir','gitdir','worktrees'].map(name=>listCase('unsupported repository '+name,['.git'],{rawFixtureEdit:graph=>name==='worktrees'?graph.ensureDirectory(sourceFixturePath.join(graph.gitRoot,name)):graph.putFile(sourceFixturePath.join(graph.gitRoot,name),'../other\n')})),
    listCase('linked worktree gitfile forbidden',[],{rawFixtureEdit:graph=>graph.directories.get(graph.repositoryRoot).set('.git',{path:graph.gitRoot,pathType:'regular-file'})}),
    listCase('sparse-checkout mechanism forbidden',['.git','info'],{rawFixtureEdit:graph=>graph.putFile(sourceFixturePath.join(graph.gitRoot,'info','sparse-checkout'),'/*\n')}),
    listCase('HTTP alternates forbidden',['.git','objects','info'],{rawFixtureEdit:graph=>graph.putFile(sourceFixturePath.join(graph.objectsRoot,'info','http-alternates'),'http://example.invalid/\n')}),
    listCase('multi-pack-index unsupported',['.git','objects','pack'],{rawFixtureEdit:graph=>graph.putFile(sourceFixturePath.join(graph.objectsRoot,'pack','multi-pack-index'),'MIDX')}),
    ...[['split-index','link'],['sparse-index','sdir'],['unknown index extension','ZZZZ']].map(([name,signature])=>readCase(name,plan=>join(plan,'.git','index'),{rawFixtureEdit:graph=>sourceFixtureIndexExtension(graph,signature)},null)),
    ...[['bare repository','bare = true'],['core worktree override','worktree = ../other'],['core sparse-checkout','sparsecheckout = true']].map(([name,line])=>readCase(name,plan=>join(plan,'.git','config'),{rawFixtureEdit:name==='bare repository'?graph=>graph.putFile(sourceFixturePath.join(graph.gitRoot,'config'),'[core]\nrepositoryformatversion = 0\nbare = true\n'):sourceFixtureEditConfig('[core]\n'+line)},null)),
  ]
  return cases
}
function registerAdapterSourceConformanceTests({test,assert,withAdapterCopy,runVirtualAdapterScenario,loadSourceFixtureFiles}) {
  let filesPromise=null
  const provenSourceFamilies=new Set()
  const files=()=>filesPromise??=Promise.resolve().then(loadSourceFixtureFiles)
  const run=async(plan,{entry='owner',mutation=null,sourceScriptTransform,scenario='capture-cap',assertAtOuterCleanupPending=null}={})=>{
    let entered=false,result
    await withAdapterCopy('virtual-runtime-conformance',mutation,async namespace=>{entered=true;result=await runVirtualAdapterScenario(namespace,{entry,sourcePlan:plan,scenario,sourceScriptTransform,assertAtOuterCleanupPending})})
    assert.equal(entered,true,'a causal mutant must import successfully and enter the real virtual-owner scenario')
    return result
  }
  const control=async(options={},entry='owner')=>{
    const plan=createAdapterSourceFixturePlan(await files(),options)
    const result=await run(plan,{entry})
    assert.ok(result.completedSourceEntries>=plan.preflight.length,'valid raw source fixture must exhaust preflight')
    assert.equal(entry==='factory'?result.owner===null:result.owner!==null,true)
    assert.equal(result.fixtureSnapshot.callCounts.launcher.spawnChild,3)
    assert.equal(result.fixtureSnapshot.callCounts.pipe.writeDebugPipe,6)
    sourceFixtureError(assert,result.outcome)
    if(result.owner!==null) {
      assert.notEqual(result.owner.foundationProjection,null)
      assert.equal(result.owner.notificationCount,1)
      assert.equal(result.owner.finalizationCount,1)
    }
    provenSourceFamilies.add(options.gitMode??'loose')
    return {plan,result}
  }
  const familyControl=async(gitMode='loose')=>{if(!provenSourceFamilies.has(gitMode)) await control({gitMode})}
  const positives=[...['loose','pack-v2','pack-v3','ref-delta','ofs-delta','ref-loosebase'].map(gitMode=>({name:gitMode,options:{gitMode}})),{name:'detached HEAD',options:{detachedHead:true}},{name:'packed refs',options:{packedRefs:true}},{name:'REF delta depth32',options:{gitMode:'ref-delta',deltaDepth:32}}]
  for(const vector of positives) for(const entry of ['owner','factory']) /* ADR0038:register:test */ g36CaseTest('L2614', 'registerAdapterSourceConformanceTests', 'ADR 0036 Source: '+vector.name+' via '+entry,{concurrency:false},async()=>{await control(vector.options,entry)})
  for(const [name,options] of [
    ['Git index v3',{rawFixtureEdit:graph=>sourceFixtureVersion3Index(graph)}],
    ['Git index v3 with explicit extended flag word',{rawFixtureEdit:graph=>sourceFixtureVersion3Index(graph,true)}],
    ['pack index v2 with 64-bit offset table',{gitMode:'pack-v2',rawFixtureEdit:graph=>sourceFixtureLargePackOffsets(graph)}],
    ['REF-delta pack with distinct 64-bit table entries',{gitMode:'ref-delta',rawFixtureEdit:graph=>sourceFixtureLargePackOffsets(graph)}],
  ]) /* ADR0038:register:test */ g36CaseTest('L2620', 'registerAdapterSourceConformanceTests', 'ADR 0036 Source: '+name+' reaches unchanged Foundation runtime',{concurrency:false},async()=>{await control(options)})
  /* ADR0038:register:test */ g36CaseTest('L2621', 'registerAdapterSourceConformanceTests', 'ADR 0036 Source: syntactically valid but unavailable bound commit cannot load another commit',{concurrency:false},async()=>{
    await familyControl()
    const plan=createAdapterSourceFixturePlan(await files(),{detachedHead:true})
    const objectsRoot=sourceFixturePath.join(plan.repositoryRoot,'.git','objects')
    const prefix=Array.from({length:256},(_,value)=>value.toString(16).padStart(2,'0')).find(value=>!plan.identities.has(sourceFixturePath.join(objectsRoot,value)))
    assert.equal(typeof prefix,'string')
    const wrongCommit=prefix+'0'.repeat(38),head=sourceFixturePath.join(plan.repositoryRoot,'.git','HEAD')
    assert.notEqual(wrongCommit,plan.repositoryCommit)
    const transform=(script,phase)=>phase==='preflight'?script.slice(0,plan.beforeObjectReads).map(entry=>entry.kind==='read-resource'&&entry.path===head?{...entry,result:{...entry.result,bytes:sourceFixtureBytes(wrongCommit+'\n')}}:entry):script
    const result=await run(plan,{sourceScriptTransform:transform})
    sourceFixtureFailurePrefix(assert,result,{first:plan.beforeObjectReads,end:plan.beforeObjectReads})
    assert.equal(result.fixtureSnapshot.callCounts.launcher.spawnChild,0)
    assert.equal(result.owner.sourceState.repositoryCommit,wrongCommit)
    assert.equal(result.owner.sourceState.factory,null)
  })
  const negatives=sourceFixtureNegativeCases()
  for(const vector of negatives) /* ADR0038:register:test */ g36CaseTest('L2637', 'registerAdapterSourceConformanceTests', 'ADR 0036 Source: reject '+vector.name+' at the first source boundary',{concurrency:false},async()=>{
    await familyControl(vector.options?.gitMode??'loose')
    const plan=createAdapterSourceFixturePlan(await files(),vector.options)
    const path=vector.path(plan),prefix=vector.kind==='list'?sourceFixtureListEnd(plan,path,vector.name==='replace refs forbidden'?1:0):sourceFixtureReadEnd(plan,path)
    // CRC is checked only when the pack is addressed after the already validated index.
    if(vector.name==='pack CRC32') prefix.end=sourceFixtureReadEnd(plan,sourceFixturePackPath(plan,'.pack')).end
    if(vector.name==='delta depth33') { assert.ok(Number.isSafeInteger(plan.firstDeltaDepthFailurePrefix)); prefix.end=plan.firstDeltaDepthFailurePrefix }
    if(vector.name==='REF delta ref-absent') { const folder=joinSourceZeroFolder(plan),listed=plan.preflight.findIndex((entry,index)=>index>=prefix.end&&entry.kind==='list-directory'&&entry.path===folder); if(listed>=0) { const closed=plan.preflight.findIndex((entry,index)=>index>listed&&entry.kind==='close-resource'&&entry.path===folder); prefix.end=closed+1 } }
    let sourceScriptTransform
    if(vector.change) sourceScriptTransform=sourceFixtureRawResultTransform(entry=>entry.kind==='read-resource'&&entry.path===path,result=>({...result,bytes:vector.change(new Uint8Array(result.bytes))})).transform
    const result=await run(plan,{scenario:'capture-cap',sourceScriptTransform})
    sourceFixtureFailurePrefix(assert,result,prefix)
  })
  for(const vector of negatives.filter(value=>value.mutation)) /* ADR0038:register:test */ g36CaseTest('L2650', 'registerAdapterSourceConformanceTests', 'ADR 0036 Source causal mutant: '+vector.mutation.name,{concurrency:false},async()=>{
    await control({gitMode:vector.options?.gitMode??'loose'})
    const make=()=>createAdapterSourceFixturePlan(loadedFiles,vector.options)
    const loadedFiles=await files()
    const baselinePlan=make(),path=vector.path(baselinePlan)
    const prefix=vector.kind==='list'?sourceFixtureListEnd(baselinePlan,path,vector.name==='replace refs forbidden'?1:0):sourceFixtureReadEnd(baselinePlan,path)
    if(vector.name==='pack CRC32') prefix.end=sourceFixtureReadEnd(baselinePlan,sourceFixturePackPath(baselinePlan,'.pack')).end
    const rawTransform=vector.change?sourceFixtureRawResultTransform(entry=>entry.kind==='read-resource'&&entry.path===path,result=>({...result,bytes:vector.change(new Uint8Array(result.bytes))}),{allMatches:true}).transform:null
    const transform=(script,phase)=>{
      const changed=rawTransform===null?script:rawTransform(script,phase)
      if(['pre-o0','post-cleanup'].includes(phase)&&['alternates forbidden','replace refs forbidden'].includes(vector.name)) {
        const listed=changed.findIndex(entry=>entry.kind==='list-directory'&&entry.path===path)
        const closed=changed.findIndex((entry,index)=>index>listed&&entry.kind==='close-resource'&&entry.path===path)
        assert.ok(listed>=0&&closed>listed)
        return changed.slice(0,closed+1)
      }
      return changed
    }
    const baseline=await run(baselinePlan,{scenario:'capture-cap',sourceScriptTransform:transform})
    sourceFixtureFailurePrefix(assert,baseline,prefix)
    const mutated=await run(make(),{mutation:vector.mutation,scenario:'capture-cap',sourceScriptTransform:transform})
    assert.ok(mutated.completedSourceEntries>prefix.end,'removing the guarded source boundary must expose a later observable resource operation')
    if(['alternates forbidden','replace refs forbidden'].includes(vector.name)) {
      assert.deepEqual(mutated.owner.sourceState.checkpoints,[{phase:'pre-o0',state:'violated'},{phase:'post-cleanup',state:'violated'}])
      assert.equal(mutated.owner.attemptStarted,false)
      assert.equal(mutated.owner.notificationCount,0)
      assert.equal(mutated.owner.finalizationCount,0)
      assert.equal(mutated.owner.sourceState.sourceResourceClosedCount+mutated.owner.sourceState.sourceResourceUnknownCount,mutated.owner.sourceState.sourceResourceCount)
    }
  })
  for(const [name,relative,cap] of [['raw index','.git/index',16777216],['Foundation file','scripts/browser/browserSyncTransportRuntimeDiagnosticObserver.js',1048576],['package-lock file','package-lock.json',1048576]]) /* ADR0038:register:test */ g36CaseTest('L2680', 'registerAdapterSourceConformanceTests', 'ADR 0036 Source: '+name+' declared cap+1 rejects before opening',{concurrency:false},async()=>{
    await familyControl()
    const plan=createAdapterSourceFixturePlan(await files()),path=sourceFixturePath.join(plan.repositoryRoot,...relative.split('/'))
    const index=plan.preflight.findIndex(entry=>entry.kind==='inspect-path'&&entry.path===path)
    const sourceScriptTransform=sourceFixtureRawResultTransform(entry=>entry.kind==='inspect-path'&&entry.path===path,result=>({...result,byteLength:cap+1})).transform
    const result=await run(plan,{scenario:'capture-cap',sourceScriptTransform})
    sourceFixtureFailurePrefix(assert,result,{first:index+1,end:index+1})
  })
  /* ADR0038:register:test */ g36CaseTest('L2688', 'registerAdapterSourceConformanceTests', 'ADR 0036 Source: addressed pack512MiB+1 rejects before opening',{concurrency:false},async()=>{
    await familyControl('pack-v2')
    const plan=createAdapterSourceFixturePlan(await files(),{gitMode:'pack-v2'}),path=sourceFixturePackPath(plan,'.pack')
    const index=plan.preflight.findIndex(entry=>entry.kind==='inspect-path'&&entry.path===path)
    const transform=sourceFixtureRawResultTransform(entry=>entry.kind==='inspect-path'&&entry.path===path,result=>({...result,byteLength:536870913})).transform
    sourceFixtureFailurePrefix(assert,await run(plan,{scenario:'capture-cap',sourceScriptTransform:transform}),{first:index+1,end:index+1})
  })
  for(const [name,gitMode,cap,pathFor] of [
    ['raw index16MiB','loose',16777216,plan=>sourceFixturePath.join(plan.repositoryRoot,'.git','index')],
    ['addressed pack512MiB','pack-v2',536870912,plan=>sourceFixturePackPath(plan,'.pack')],
  ]) /* ADR0038:register:test */ g36CaseTest('L2698', 'registerAdapterSourceConformanceTests', 'ADR 0036 Source: exact '+name+' declared size reaches an actual open and read before explicit unavailable bytes',{concurrency:false},async()=>{
    await familyControl(gitMode)
    const plan=createAdapterSourceFixturePlan(await files(),{gitMode}),path=pathFor(plan)
    const opened=plan.preflight.findIndex(entry=>entry.kind==='open-resource'&&entry.path===path)
    const read=plan.preflight.findIndex((entry,index)=>index>opened&&entry.kind==='read-resource'&&entry.path===path)
    assert.ok(opened>=0&&read>opened)
    const transform=(script,phase)=>{
      if(phase!=='preflight') return script
      return script.slice(0,read+1).map((entry,index)=>{
        if(index===read) return {...entry,state:'failed',result:null}
        if(entry.path===path&&['inspect-path','inspect-open-resource'].includes(entry.kind)) return {...entry,result:{...entry.result,byteLength:cap}}
        return entry
      })
    }
    const result=await run(plan,{scenario:'capture-cap',sourceScriptTransform:transform})
    sourceFixtureFailurePrefix(assert,result,{first:read+1,end:read+1})
    assert.ok(result.completedSourceEntries>opened+1,'exact cap must accept the actual resource-opened completion before attempting read')
    assert.equal(result.fixtureSnapshot.callCounts.launcher.spawnChild,0)
    // This demonstrates the production metadata guard, not a valid giant
    // index/pack: the explicit failed read supplies no allocated giant bytes.
  })
  for(const length of [1048576,1048577]) /* ADR0038:register:test */ g36CaseTest('L2719', 'registerAdapterSourceConformanceTests', 'ADR 0036 Source: actual Git blob '+length+' bytes',{concurrency:false},async()=>{
    const inputs=new Map(await files()); inputs.set('zz-source-blob-boundary.txt',new Uint8Array(length).fill(65))
    const plan=createAdapterSourceFixturePlan(inputs)
    const result=await run(plan,{scenario:'capture-cap'})
    if(length===1048576) assert.ok(result.completedSourceEntries>=plan.preflight.length)
    else {
      const raw=sourceFixtureConcat(sourceFixtureBytes('blob '+length+'\0'),inputs.get('zz-source-blob-boundary.txt'))
      sourceFixtureFailurePrefix(assert,result,sourceFixtureReadEnd(plan,sourceFixtureObjectPath(plan,sourceFixtureDigest(raw))))
    }
  })
  for(const [name,from,measure] of [['object-count','objects:4096',plan=>plan.expectedObjectReads],['expanded-byte-count','expanded:67108864',plan=>plan.expandedByteLength],['worktree-byte-count','worktree:268435456',plan=>plan.worktreeByteLength]]) /* ADR0038:register:test */ g36CaseTest('L2729', 'registerAdapterSourceConformanceTests', 'ADR 0036 Source causal bound: '+name+' inclusive comparison on the same valid source fixture',{concurrency:false},async()=>{
    const input=await files(),original=createAdapterSourceFixturePlan(input),threshold=measure(original)
    assert.ok(Number.isSafeInteger(threshold)&&threshold>1)
    const field=from.slice(0,from.indexOf(':'))
    const inclusive=await run(createAdapterSourceFixturePlan(input),{mutation:{name:'source-'+name+'-exact-control',from,to:field+':'+threshold}})
    assert.ok(inclusive.completedSourceEntries>=original.preflight.length)
    const exclusive=await run(createAdapterSourceFixturePlan(input),{mutation:{name:'source-'+name+'-one-less',from,to:field+':'+(threshold-1)},scenario:'capture-cap'})
    sourceFixtureError(assert,exclusive.outcome)
    assert.ok(exclusive.completedSourceEntries<original.preflight.length,'one fewer budget unit must prevent complete source capture')
  })
  for(const targetObjects of [4096,4097]) /* ADR0038:register:test */ g36CaseTest('L2739', 'registerAdapterSourceConformanceTests', 'ADR 0036 Source: actual '+targetObjects+' distinct object-read boundary',{concurrency:false},async()=>{
    const inputs=new Map(await files()),base=createAdapterSourceFixturePlan(inputs)
    const extras=targetObjects-base.expectedObjectReads
    disposeAdapterSourceFixturePlan(base)
    assert.ok(extras>0)
    let lastLiteral=''
    for(let index=0;index<extras;index+=1) { lastLiteral='zz-source-object-'+String(index).padStart(5,'0')+'.txt'; inputs.set(lastLiteral,sourceFixtureBytes('unique-source-object-'+index+'\n')) }
    const plan=createAdapterSourceFixturePlan(inputs)
    assert.equal(plan.expectedObjectReads,targetObjects)
    try {
      const result=await run(plan,{scenario:'capture-cap'})
      if(targetObjects===4096) assert.ok(result.completedSourceEntries>=plan.preflight.length)
      else sourceFixtureFailurePrefix(assert,result,sourceFixtureReadEnd(plan,sourceFixturePath.join(plan.repositoryRoot,lastLiteral)))
    } finally { disposeAdapterSourceFixturePlan(plan); inputs.clear() }
  })
  /* ADR0038:register:test */ g36CaseTest('L2754', 'registerAdapterSourceConformanceTests', 'ADR 0036 Source: active Foundation rawhash mismatch prevents SourceTextModule',{concurrency:false},async()=>{
    await familyControl()
    const plan=createAdapterSourceFixturePlan(await files(),{rawFixtureEdit:graph=>{
      const path=sourceFixturePath.join(graph.repositoryRoot,'scripts','browser','browserSyncTransportRuntimeDiagnosticObserver.js'),bytes=new Uint8Array(graph.files.get(path)); bytes[bytes.length-1]^=1; graph.putFile(path,bytes)
    }})
    const path=sourceFixturePath.join(plan.repositoryRoot,'scripts','browser','browserSyncTransportRuntimeDiagnosticObserver.js')
    const prefix={first:sourceFixtureReadEnd(plan,path).first,end:sourceFixtureBeforeFile(plan,sourceFixturePath.join(plan.repositoryRoot,'node_modules','vite','package.json'))}
    const result=await run(plan,{scenario:'capture-cap'})
    sourceFixtureFailurePrefix(assert,result,prefix)
    assert.equal(result.fixtureSnapshot.callCounts.launcher.spawnChild,0)
    const source=result.owner.sourceState
    assert.equal(source.foundationResourceState,'unbound')
    assert.ok(source.sourceResourceCount>0,'an absent valid Foundation binding must not erase earlier resource allocations')
    assert.equal(source.sourceResourceClosedCount+source.sourceResourceUnknownCount,source.sourceResourceCount)
  })
  for(const [name,expression] of [
    ['extra module export',"'export const forbiddenAdapterFixtureExport=0;\\n'+text"],
    ['static module import',"'import \\\"unapproved:source-fixture\\\";\\n'+text"],
    ['loaded factory arity',"text+'\\nObject.defineProperty(createBrowserSyncTransportRuntimeDiagnosticObserver,\\\"length\\\",{value:0})'"],
  ]) /* ADR0038:register:test */ g36CaseTest('L2773', 'registerAdapterSourceConformanceTests', 'ADR 0036 Source actual-load causal mutant: '+name,{concurrency:false},async()=>{
    const valid=await control()
    assert.ok(valid.result.fixtureSnapshot.callCounts.launcher.spawnChild>0,'positive control must pass SourceTextModule and reach the runtime resource phase')
    const plan=createAdapterSourceFixturePlan(await files())
    const result=await run(plan,{scenario:'capture-cap',mutation:{name:'source-actual-load-'+name.replaceAll(' ','-'),from:'new sourceVm.SourceTextModule(text,{identifier:',to:'new sourceVm.SourceTextModule('+expression+',{identifier:'}})
    assert.equal(result.completedSourceEntries,plan.preflight.length)
    sourceFixtureError(assert,result.outcome)
    assert.equal(result.fixtureSnapshot.callCounts.launcher.spawnChild,0)
  })
  /* ADR0038:register:test */ g36CaseTest('L2782', 'registerAdapterSourceConformanceTests', 'ADR 0036 Source mandatory causal mutant: standard import cannot replace the byte-owned SourceTextModule load',{concurrency:false},async()=>{
    await control()
    const plan=createAdapterSourceFixturePlan(await files())
    const from='new sourceVm.SourceTextModule(text,{identifier:state.foundation.url,importModuleDynamically:sourceRejectFoundationImport})'
    const to="await import('data:text/javascript;charset=utf-8,'+encodeURIComponent(text))"
    let namespaceAssertions=0
    const result=await run(plan,{scenario:'capture-cap',mutation:{name:'STANDARD_IMPORT_INSTEAD_OF_BYTE_OWNED_LOAD',from,to},assertAtOuterCleanupPending(owner){
      const namespace=owner.sourceState.module
      assert.equal(Object.getPrototypeOf(namespace),null,'the unchanged bound Foundation bytes must actually evaluate as a standard module namespace')
      assert.deepEqual(Object.getOwnPropertyNames(namespace),['createBrowserSyncTransportRuntimeDiagnosticObserver'])
      assert.equal(typeof namespace.createBrowserSyncTransportRuntimeDiagnosticObserver,'function')
      assert.equal(namespace.createBrowserSyncTransportRuntimeDiagnosticObserver.length,1)
      namespaceAssertions+=1
    }})
    sourceFixtureError(assert,result.outcome)
    assert.equal(result.completedSourceEntries,plan.preflight.length)
    assert.equal(result.fixtureSnapshot.callCounts.launcher.spawnChild,0)
    assert.equal(result.fixtureSnapshot.callCounts.pipe.writeDebugPipe,0)
    assert.equal(namespaceAssertions,1)
    assert.equal(result.owner.sourceState.module,null)
    assert.equal(result.owner.sourceState.loadCount,1)
    assert.equal(result.owner.sourceState.loadVerified,false)
    assert.equal(result.owner.sourceState.namespace,null)
    assert.equal(result.owner.sourceState.factory,null)
    assert.equal(result.owner.foundationInstance,null)
  })
  return {sourcePrimaryModePositiveCases:positives.length*2,sourceIndexLargeOffsetPositiveCases:4,sourceNegativeVectorCases:negatives.length,sourceGuardCausalCases:negatives.filter(value=>value.mutation).length,sourceAdditionalBoundaryAndLoadCases:19}
}

function joinSourceZeroFolder(plan) { return sourceFixturePath.join(plan.repositoryRoot,'.git','objects','00') }

// Checkpoint cases use only raw completion scripts. Truncating the failing
// script communicates its deterministic stop to the test driver, never to the adapter.
function sourceFixtureCheckpointTransform(plan, targetPhase, vector, { truncate = true } = {}) {
  const targetPath = vector.path(plan)
  let prepared = 0, affectedIndex = -1, stopIndex = -1
  const transform = (script, phase) => {
    if (phase !== targetPhase) return script
    prepared += 1
    const matches = []
    for (let index = 0; index < script.length; index += 1) if (script[index].kind === vector.kind && script[index].path === targetPath) matches.push(index)
    const selected = matches[vector.occurrence ?? 0]
    if (selected === undefined) throw new Error('source-checkpoint-fault-anchor-missing')
    affectedIndex = selected
    stopIndex = selected
    if (vector.kind === 'read-resource') {
      while (script[stopIndex + 1]?.kind === 'read-resource' && script[stopIndex + 1]?.path === targetPath) stopIndex += 1
      if (script[stopIndex + 1]?.kind !== 'inspect-open-resource' || script[stopIndex + 1]?.path !== targetPath) throw new Error('source-checkpoint-read-end-missing')
      stopIndex += 1
    }
    const changed = script.map((entry, index) => {
      if (index !== selected) return entry
      if (vector.failed) return { ...entry, state: 'failed', result: null }
      return { ...entry, result: vector.change(entry.result) }
    })
    return truncate ? changed.slice(0, stopIndex + 1) : changed
  }
  return { transform, get prepared() { return prepared }, get affectedIndex() { return affectedIndex }, get stopIndex() { return stopIndex } }
}
function registerAdapterSourceCheckpointTests({ test, assert, withAdapterCopy, runVirtualAdapterScenario, loadSourceFixtureFiles }) {
  let filesPromise = null, controlPromise = null
  const files = () => filesPromise ??= Promise.resolve().then(loadSourceFixtureFiles)
  const foundationRelative = 'scripts/browser/browserSyncTransportRuntimeDiagnosticObserver.js'
  const foundationPath = plan => sourceFixturePath.join(plan.repositoryRoot, ...foundationRelative.split('/'))
  const mutateBytes = result => { const bytes = new Uint8Array(result.bytes); assert.ok(bytes.length > 0); bytes[0] ^= 1; return { ...result, bytes } }
  const vectors = [
    { name: 'canonical Foundation path replacement', kind: 'canonicalize-path', path: foundationPath, change: result => ({ ...result, path: result.path + '.replacement' }) },
    { name: 'parent file-ID replacement', kind: 'inspect-path', path: plan => sourceFixturePath.join(plan.repositoryRoot, 'scripts'), change: result => ({ ...result, fileId: '80000001' }) },
    { name: 'Foundation path file-ID ABA', kind: 'inspect-path', path: foundationPath, change: result => ({ ...result, fileId: '80000002' }) },
    { name: 'Foundation path volume-ID ABA', kind: 'inspect-path', path: foundationPath, change: result => ({ ...result, volumeId: '80000003' }) },
    { name: 'Foundation path length ABA', kind: 'inspect-path', path: foundationPath, change: result => ({ ...result, byteLength: result.byteLength + 1 }) },
    { name: 'Foundation path modification-time ABA', kind: 'inspect-path', path: foundationPath, change: result => ({ ...result, modifiedTimeNanoseconds: '2' }) },
    { name: 'Foundation path change-time ABA', kind: 'inspect-path', path: foundationPath, change: result => ({ ...result, changeTimeNanoseconds: '2' }) },
    { name: 'bound Foundation path becomes a directory', kind: 'inspect-path', path: foundationPath, change: result => ({ ...result, pathType: 'directory' }) },
    { name: 'bound Foundation path becomes a reparse point', kind: 'inspect-path', path: foundationPath, change: result => ({ ...result, reparsePoint: true }) },
    { name: 'held Foundation file-ID differs', kind: 'inspect-open-resource', path: foundationPath, change: result => ({ ...result, fileId: '80000004' }) },
    { name: 'held Foundation raw bytes differ', kind: 'read-resource', path: foundationPath, change: mutateBytes,
      mutation: { name: 'held-checkpoint-rawbyte-comparison-bypass', from: 'sourceRequire(owner,sourceBytesEqual(entry.bytes,held) && sourceHash(held)===entry.sha256,true)', to: 'sourceRequire(owner,true)' } },
    { name: 'fresh Foundation path raw bytes differ after stable held bytes', kind: 'read-resource', path: foundationPath, occurrence: 1, change: mutateBytes,
      mutation: { name: 'fresh-checkpoint-rawbyte-comparison-bypass', from: 'sourceRequire(owner,sourceBytesEqual(entry.bytes,freshBytes),true)', to: 'sourceRequire(owner,true)' } },
    { name: 'missing held-resource capability stays unproven', kind: 'inspect-open-resource', path: foundationPath, failed: true, unproven: true },
    { name: 'unavailable held file-ID stays unproven', kind: 'inspect-open-resource', path: foundationPath, change: result => ({ ...result, fileId: null }), unproven: true },
  ]
  async function run(vector = null, phase = null, { entry = 'owner', mutation = null, truncate = true } = {}) {
    const plan = createAdapterSourceFixturePlan(await files())
    const fault = vector === null ? null : sourceFixtureCheckpointTransform(plan, phase, vector, { truncate })
    let imported = false, result, loadIdentityAssertions = 0
    await withAdapterCopy('virtual-runtime-conformance', mutation, async namespace => {
      imported = true
      result = await runVirtualAdapterScenario(namespace, { entry, sourcePlan: plan, scenario: 'capture-cap', sourceScriptTransform: fault?.transform, assertAfterReadiness(owner) {
        if (owner === null) return
        assert.equal(owner.sourceState.factory, Object.getOwnPropertyDescriptor(owner.sourceState.namespace, 'createBrowserSyncTransportRuntimeDiagnosticObserver').value)
        loadIdentityAssertions += 1
      } })
    })
    assert.equal(loadIdentityAssertions, entry === 'owner' ? 1 : 0)
    assert.equal(imported, true)
    assert.equal(result.completedSourceEntries, plan.preflight.length)
    sourceFixtureError(assert, result.outcome)
    if (fault !== null) { assert.equal(fault.prepared, 1); assert.ok(fault.affectedIndex >= 0); assert.ok(fault.stopIndex >= fault.affectedIndex) }
    return { plan, fault, result }
  }
  function fullControl(result) {
    assert.equal(result.fixtureSnapshot.callCounts.launcher.spawnChild, 3)
    assert.equal(result.fixtureSnapshot.callCounts.pipe.writeDebugPipe, 6)
    const owner = result.owner
    assert.notEqual(owner.foundationProjection, null)
    assert.equal(owner.notificationCount, 1)
    assert.equal(owner.finalizationCount, 1)
    assert.equal(owner.writerCallCount, 0)
    assert.equal(owner.sourceState.provenanceState, 'verified')
    assert.deepEqual(owner.sourceState.checkpoints.map(check => [check.phase, check.state]), [['pre-o0', 'verified'], ['post-settlement', 'verified'], ['post-cleanup', 'verified']])
  }
  const control = () => controlPromise ??= run().then(value => { fullControl(value.result); return value })
  for(const vector of vectors.filter(value=>value.unproven)) /* ADR0038:register:test */ g36CaseTest('L2896', 'registerAdapterSourceCheckpointTests', 'ADR 0036 Source checkpoint post-cleanup unavailable evidence: '+vector.name+' cannot promote UNPROVEN to FAIL',{concurrency:false},async()=>{
    const baseline=await control()
    assert.equal(baseline.result.owner.cleanupViolation,false)
    assert.equal(baseline.result.owner.terminalOutcome.observerGate,'UNPROVEN')
    const {result}=await run(vector,'post-cleanup')
    failedCheckpoint(result,'post-cleanup',true)
    assert.equal(result.owner.cleanupViolation,false,'unavailable source identity or failed resource call is not a confirmed cleanup violation')
    assert.equal(result.owner.terminalOutcome.observerGate,'UNPROVEN')
  })
  function failedCheckpoint(result, phase, failedCapability) {
    const owner = result.owner, source = owner.sourceState
    assert.equal(owner.runState, 'terminal')
    assert.equal(owner.writerCallCount, 0)
    assert.equal(owner.ownerFinalizationCount, 1)
    assert.equal(source.actualLoadedSha256, 'd4cadf656bb50e2b062c9d0d66e3f895bc87649362ce995abfbdbe24a9f4e731')
    assert.equal(source.loadVerified, true)
    assert.equal(source.factory, null)
    assert.equal(source.namespace, null)
    const matches = source.checkpoints.filter(check => check.phase === phase)
    assert.equal(matches.length, 1, 'a failed checkpoint cannot be retried into positive provenance')
    assert.equal(matches[0].state, failedCapability ? 'unproven' : 'violated')
    assert.equal(source.violation, !failedCapability)
    assert.equal(source.provenanceState, failedCapability ? 'unproven' : 'violated')
    if (phase === 'pre-o0') {
      assert.equal(result.fixtureSnapshot.callCounts.pipe.writeDebugPipe, 0)
      assert.equal(owner.foundationInstance, null)
      assert.equal(owner.notificationCount, 0)
    } else {
      assert.equal(result.fixtureSnapshot.callCounts.pipe.writeDebugPipe, 6)
      assert.notEqual(owner.foundationProjection, null)
      assert.equal(owner.notificationCount, 1)
    }
    if (!failedCapability && owner.terminalOutcome !== null) assert.equal(owner.terminalOutcome.observerGate, 'FAIL')
  }
  for (const phase of ['pre-o0', 'post-settlement', 'post-cleanup']) {
    for (const vector of vectors) /* ADR0038:register:test */ g36CaseTest('L2931', 'registerAdapterSourceCheckpointTests', 'ADR 0036 Source checkpoint ' + phase + ': ' + vector.name, { concurrency: false }, async () => {
      await control()
      const { result } = await run(vector, phase)
      failedCheckpoint(result, phase, vector.unproven === true)
    })
    /* ADR0038:register:test */ g36CaseTest('L2936', 'registerAdapterSourceCheckpointTests', 'ADR 0036 Source checkpoint ' + phase + ': changed Git-object bytes invalidate the immutable-source comparison', { concurrency: false }, async () => {
      await control()
      const input = await files(), body = input.get(foundationRelative)
      assert.ok(body instanceof Uint8Array)
      const oid = sourceFixtureDigest(sourceFixtureConcat(sourceFixtureBytes('blob ' + body.length + '\0'), body))
      const vector = { name: 'Git object raw bytes', kind: 'read-resource', path: plan => sourceFixtureObjectPath(plan, oid), change: mutateBytes }
      const { result } = await run(vector, phase)
      failedCheckpoint(result, phase, false)
    })
    /* ADR0038:register:test */ g36CaseTest('L2945', 'registerAdapterSourceCheckpointTests', 'ADR 0036 Source checkpoint ' + phase + ': public factory also rejects the bound-path replacement', { concurrency: false }, async () => {
      await control()
      const { result } = await run(vectors[0], phase, { entry: 'factory' })
      assert.equal(result.owner, null)
      assert.equal(result.fixtureSnapshot.callCounts.launcher.spawnChild, 3)
      assert.equal(result.fixtureSnapshot.callCounts.pipe.writeDebugPipe, phase === 'pre-o0' ? 0 : 6)
    })
    for (const vector of vectors.filter(value => value.mutation)) /* ADR0038:register:test */ g36CaseTest('L2952', 'registerAdapterSourceCheckpointTests', 'ADR 0036 Source checkpoint causal mutant ' + phase + ': ' + vector.mutation.name, { concurrency: false }, async () => {
      await control()
      const baseline = await run(vector, phase)
      failedCheckpoint(baseline.result, phase, false)
      // The same single raw fault is followed by the otherwise unchanged script.
      // Source copies must import, complete actual LOAD, and cross the removed comparison.
      const changed = await run(vector, phase, { mutation: vector.mutation, truncate: false })
      fullControl(changed.result)
      assert.equal(changed.result.owner.sourceState.checkpoints.find(check => check.phase === phase).state, 'verified')
    })
  }
  return { checkpointPhases: 3, rawFaultKinds: vectors.length + 1, publicCheckpointCases: 3, causalCheckpointCases: 6 }
}

function assertAdapterStaticError(error, code = 'browserSyncTransportRuntimeDiagnosticAdapterFailed') {
  assert.equal(Object.getPrototypeOf(error), Error.prototype)
  assert.deepEqual(Reflect.ownKeys(error), ['message'])
  assert.equal(error.message, code)
  return true
}

function guardSourceRows() {
  return [
    ['readDiagnosticRunIdEntropyBytes', new Uint8Array(17).fill(17)],
    ['readReplayContextIdEntropyBytes', new Uint8Array(15).fill(29)],
    ['readWallMilliseconds', 1789257600000], ['readTimeZone', 'UTC'],
    ['readProcessPlatform', 'win32'], ['readProcessArchitecture', 'x64'],
    ['readProcessVersion', 'v24.19.0'], ['readProcessExecutablePath', 'C:\\NodeFixture\\node.exe'],
    ['readProcessExecArguments', ['--experimental-vm-modules', '--no-warnings']],
    ['readWorkingDirectory', 'C:\\GoldenDawnFixture'],
    ...g36FixtureEnvironmentNames.map(name => [`process-environment:${name}`, []]),
  ]
}

for (const entry of ['owner', 'factory']) {
  for (const argumentsValue of [[undefined], [null], [{ runBinding: true }], [1, 2]]) {
    /* ADR0038:register:test */ g36CaseTest('L2988', 'publicBoundary', `adapter ${entry}: first invalid run arity irreversibly consumes the run without a capability call (${argumentsValue.length})`, async () => {
      await withAdapterCopy('virtual-runtime-conformance', null, async namespace => {
        const fixture = createVirtualRuntimeFixture()
        let api
        if (entry === 'owner') api = namespace.createBrowserSyncTransportRuntimeDiagnosticAdapterOwner(fixture.runtimeCapabilities).api
        else {
          namespace.installBrowserSyncTransportRuntimeDiagnosticVirtualCapabilities(fixture.runtimeCapabilities)
          api = namespace.createBrowserSyncTransportRuntimeDiagnosticAdapter()
        }
        const promise = Reflect.apply(api.run, undefined, argumentsValue)
        assert.equal(Object.getPrototypeOf(promise), Promise.prototype)
        await assert.rejects(promise, error => assertAdapterStaticError(error, 'invalidBrowserSyncTransportRuntimeDiagnosticAdapterArguments'))
        await assert.rejects(api.run(), error => assertAdapterStaticError(error, 'browserSyncTransportRuntimeDiagnosticAdapterAlreadyUsed'))
        for (const group of Object.values(fixture.controller.snapshot().callCounts)) for (const count of Object.values(group)) assert.equal(count, 0)
      })
    })
  }
  for (let failed = 0; failed < guardSourceRows().length; failed += 1) {
    const source = guardSourceRows()[failed][0]
    /* ADR0038:register:test */ g36CaseTest('L3007', 'publicBoundary', `adapter ${entry}: R0 source throw at ${source} has a closed error and no later effect`, async () => {
      await withAdapterCopy('virtual-runtime-conformance', null, async namespace => {
        const fixture = createVirtualRuntimeFixture()
        const rows = guardSourceRows()
        for (let index = 0; index < failed; index += 1) fixture.controller.dispatch({ kind: 'source-return', source: rows[index][0], value: rows[index][1] })
        fixture.controller.dispatch({ kind: 'source-throw', source })
        let api, owner = null
        if (entry === 'owner') {
          owner = namespace.createBrowserSyncTransportRuntimeDiagnosticAdapterOwner(fixture.runtimeCapabilities)
          api = owner.api
        } else {
          namespace.installBrowserSyncTransportRuntimeDiagnosticVirtualCapabilities(fixture.runtimeCapabilities)
          api = namespace.createBrowserSyncTransportRuntimeDiagnosticAdapter()
        }
        const run = Reflect.apply(api.run, undefined, [])
        await assert.rejects(run, error => assertAdapterStaticError(error))
        const snapshot = fixture.controller.snapshot()
        for (const group of ['scheduler', 'pipe', 'launcher', 'resources']) for (const count of Object.values(snapshot.callCounts[group])) assert.equal(count, 0)
        assert.equal(snapshot.callCounts.clock.readControllerNanoseconds, 0)
        if (owner !== null) {
          assert.equal(owner.r0, null)
          assert.equal(owner.sourceState, null)
          assert.equal(owner.adapterObservationSnapshot, null)
          assert.equal(owner.finalizationCount, 0)
          assert.equal(owner.ownerFinalizationCount, 1)
          assert.equal(owner.writerCallCount, 0)
          assert.equal(owner.runtimeCapabilities, null)
        }
      })
    })
  }
}

/* ADR0038:register:test */ g36CaseTest('L3040', 'publicBoundary', 'adapter copy profiles are disjoint, factory selector is poisoned in derivation copy, and no real capability is called', async () => {
  await withAdapterCopy('derivation-conformance', null, namespace => {
    assert.equal(namespace.createBrowserSyncTransportRuntimeDiagnosticAdapter.length, 0)
    assert.throws(() => namespace.createBrowserSyncTransportRuntimeDiagnosticAdapter(), error => error instanceof TypeError && error.message === 'browserSyncTransportRuntimeDiagnosticAdapterFailed')
    assert.equal('createBrowserSyncTransportRuntimeDiagnosticAdapterOwner' in namespace, false)
    assert.equal('enqueueBrowserSyncTransportRuntimeDiagnosticAdapterEvent' in namespace, false)
  })
  await withAdapterCopy('virtual-runtime-conformance', null, namespace => {
    assert.equal(namespace.enqueueBrowserSyncTransportRuntimeDiagnosticAdapterEvent.length, 2)
    assert.equal(namespace.createBrowserSyncTransportRuntimeDiagnosticAdapterOwner.length, 1)
    assert.equal(namespace.installBrowserSyncTransportRuntimeDiagnosticVirtualCapabilities.length, 1)
    assert.equal('finalizeBrowserSyncTransportRuntimeDiagnosticRecord' in namespace, false)
    assert.throws(() => namespace.createBrowserSyncTransportRuntimeDiagnosticAdapter())
  })
})

for (const caseName of ['root-key', 'root-prototype', 'root-not-frozen', 'missing-method', 'method-arity', 'group-key', 'group-not-frozen', 'method-accessor']) {
  /* ADR0038:register:test */ g36CaseTest('L3057', 'publicBoundary', `adapter owner rejects the ${caseName} capability profile before consuming sources`, async () => {
    await withAdapterCopy('virtual-runtime-conformance', null, namespace => {
      const fixture = createVirtualRuntimeFixture()
      const root = { ...fixture.runtimeCapabilities }
      const group = { ...root.clock }
      let getterCount = 0
      if (caseName === 'root-key') root.extra = true
      if (caseName === 'root-prototype') Object.setPrototypeOf(root, null)
      if (caseName === 'missing-method') delete group.readWallMilliseconds
      if (caseName === 'method-arity') group.readWallMilliseconds = function wrongArity(value) { return value }
      if (caseName === 'group-key') group.extra = function extra() {}
      if (caseName === 'method-accessor') Object.defineProperty(group, 'readWallMilliseconds', { enumerable: true, configurable: true, get() { getterCount += 1; return () => 0 } })
      root.clock = caseName === 'group-not-frozen' ? group : Object.freeze(group)
      if (caseName !== 'root-not-frozen') Object.freeze(root)
      assert.throws(() => namespace.createBrowserSyncTransportRuntimeDiagnosticAdapterOwner(root), error => error instanceof TypeError && error.message === 'browserSyncTransportRuntimeDiagnosticAdapterFailed')
      assert.equal(getterCount, 0)
      for (const methods of Object.values(fixture.controller.snapshot().callCounts)) for (const count of Object.values(methods)) assert.equal(count, 0)
    })
  })
}

/* ADR0038:register:test */ g36CaseTest('L3078', 'publicBoundary', 'adapter owner capability identity is consumed exactly once and forged owner is rejected before producer reflection', async () => {
  await withAdapterCopy('virtual-runtime-conformance', null, namespace => {
    const fixture = createVirtualRuntimeFixture()
    namespace.createBrowserSyncTransportRuntimeDiagnosticAdapterOwner(fixture.runtimeCapabilities)
    assert.throws(() => namespace.createBrowserSyncTransportRuntimeDiagnosticAdapterOwner(fixture.runtimeCapabilities))
    let reflected = 0
    const event = new Proxy({}, { ownKeys() { reflected += 1; throw new Error('not a valid producer') } })
    assert.throws(() => namespace.enqueueBrowserSyncTransportRuntimeDiagnosticAdapterEvent({}, event))
    assert.equal(reflected, 0)
  })
})

// Selection faults stop at the factory boundary. The real-selector mutant
// allocates its inert capability graph but never calls run or a host method.
/* ADR0038:register:test */ g36CaseTest('L3092', 'publicBoundary', 'ADR 0036: derivation-no-host-selector-poison dies at the exact synchronous sentinel', async () => {
  const oracle = namespace => assert.throws(() => namespace.createBrowserSyncTransportRuntimeDiagnosticAdapter(), error =>
    Object.getPrototypeOf(error) === TypeError.prototype && error.message === 'browserSyncTransportRuntimeDiagnosticAdapterFailed')
  await withAdapterCopy('derivation-conformance', null, oracle)
  await withAdapterCopy('derivation-conformance', {
    name: 'derivation-no-host-selector-poison',
    from: 'const createSelectedBrowserSyncTransportRuntimeDiagnosticCapabilities =\n  rejectBrowserSyncTransportRuntimeDiagnosticDerivationCapabilities',
    to: 'const createSelectedBrowserSyncTransportRuntimeDiagnosticCapabilities =\n  function derivationRealFallbackPoison(){ throw new Error("ADR-0036-DERIVATION-REAL-FALLBACK-POISON") }',
  }, namespace => {
    assert.throws(() => oracle(namespace), assert.AssertionError)
    assert.throws(() => namespace.createBrowserSyncTransportRuntimeDiagnosticAdapter(), error =>
      Object.getPrototypeOf(error) === Error.prototype && error.message === 'ADR-0036-DERIVATION-REAL-FALLBACK-POISON')
  })
})

/* ADR0038:register:test */ g36CaseTest('L3107', 'publicBoundary', 'ADR 0036: derivation-real-selector-fallback dies on factory return before run', async () => {
  const oracle = namespace => assert.throws(() => namespace.createBrowserSyncTransportRuntimeDiagnosticAdapter(), TypeError)
  await withAdapterCopy('derivation-conformance', null, oracle)
  await withAdapterCopy('derivation-conformance', {
    name: 'derivation-real-selector-fallback',
    from: 'const createSelectedBrowserSyncTransportRuntimeDiagnosticCapabilities =\n  rejectBrowserSyncTransportRuntimeDiagnosticDerivationCapabilities',
    to: 'const createSelectedBrowserSyncTransportRuntimeDiagnosticCapabilities =\n  createBrowserSyncTransportRuntimeDiagnosticNodeCapabilities',
  }, async (namespace, binding) => {
    assert.throws(() => oracle(namespace), assert.AssertionError)
    const source = await g36HarnessFs.readFile(binding.copyPath, 'utf8')
    const structuralOracle = text => assert.equal(text.includes(g36HarnessSelector), false)
    assert.throws(() => structuralOracle(source), assert.AssertionError)
  })
})

/* ADR0038:register:test */ g36CaseTest('L3122', 'publicBoundary', 'ADR 0036: virtual installer validates exact arity, retains one slot and consumes one identity', async () => {
  await withAdapterCopy('virtual-runtime-conformance', null, namespace => {
    const fixture = createVirtualRuntimeFixture()
    const second = createVirtualRuntimeFixture()
    for (const args of [[], [undefined], [fixture.runtimeCapabilities, undefined]]) {/* ADR0038:sync */g36Variant('installer-arguments',args.length===0?'empty':args.length===1?'undefined':'extra');/* ADR0038:end */
      assert.throws(() => Reflect.apply(namespace.installBrowserSyncTransportRuntimeDiagnosticVirtualCapabilities, undefined, args))
    }
    assert.equal(namespace.installBrowserSyncTransportRuntimeDiagnosticVirtualCapabilities(fixture.runtimeCapabilities), undefined)
    assert.throws(() => namespace.installBrowserSyncTransportRuntimeDiagnosticVirtualCapabilities(second.runtimeCapabilities))
    const api = namespace.createBrowserSyncTransportRuntimeDiagnosticAdapter()
    assert.equal(Object.getPrototypeOf(api), Object.prototype)
    assert.deepEqual(Reflect.ownKeys(api), ['run'])
    assert.equal(Object.isFrozen(api), true)
    assert.equal(api.run.length, 0)
    assert.throws(() => namespace.createBrowserSyncTransportRuntimeDiagnosticAdapter())
    assert.throws(() => namespace.installBrowserSyncTransportRuntimeDiagnosticVirtualCapabilities(second.runtimeCapabilities))
    for (const methods of Object.values(fixture.controller.snapshot().callCounts)) for (const count of Object.values(methods)) assert.equal(count, 0)
  })
})

for (const mutation of [
  { name: 'VIRTUAL_SLOT_NULL_CONSUME',
    from: '  const runtimeCapabilities = browserSyncTransportRuntimeDiagnosticVirtualCapabilitySlot\n  browserSyncTransportRuntimeDiagnosticVirtualCapabilitySlot = null',
    to: '  const runtimeCapabilities = null\n  browserSyncTransportRuntimeDiagnosticVirtualCapabilitySlot = null' },
  { name: 'VIRTUAL_SLOT_DOUBLE_CONSUME',
    from: '    createSelectedBrowserSyncTransportRuntimeDiagnosticCapabilities()\n  )',
    to: '    (createSelectedBrowserSyncTransportRuntimeDiagnosticCapabilities(), createSelectedBrowserSyncTransportRuntimeDiagnosticCapabilities())\n  )' },
  { name: 'VIRTUAL_INSTALLER_IGNORES_ARGUMENT',
    from: '  browserSyncTransportRuntimeDiagnosticVirtualCapabilitySlot = runtimeCapabilities\n  return undefined',
    to: '  browserSyncTransportRuntimeDiagnosticVirtualCapabilitySlot = undefined\n  return undefined' },
]) /* ADR0038:register:test */ g36CaseTest('L3152', 'publicBoundary', 'ADR 0036 selector causal mutant: ' + mutation.name, async () => {
  const oracle = namespace => {
    const fixture = createVirtualRuntimeFixture()
    namespace.installBrowserSyncTransportRuntimeDiagnosticVirtualCapabilities(fixture.runtimeCapabilities)
    assert.doesNotThrow(() => namespace.createBrowserSyncTransportRuntimeDiagnosticAdapter())
  }
  await withAdapterCopy('virtual-runtime-conformance', null, oracle)
  await withAdapterCopy('virtual-runtime-conformance', mutation, namespace => assert.throws(() => oracle(namespace), assert.AssertionError))
})

for (const mutation of [
  { name: 'PUBLIC_FACTORY_OWNER_BYPASS', from: '  return owner.api\n}',
    to: '  return adapterFreeze({ run: function run() { return new AdapterPromise(resolve => resolve(undefined)) } })\n}' },
  { name: 'OWNER_RUN_REPLACEMENT_MACHINE', from: '      const task = adapterRunOwner(owner)',
    to: '      const task = new AdapterPromise(resolve => resolve(undefined))' },
  { name: 'OWNER_CAPABILITY_ARGUMENT_IGNORED',
    from: '    runtimeCapabilities, capabilityCallDepth: 0, capabilityViolation: false,',
    to: '    runtimeCapabilities: null, capabilityCallDepth: 0, capabilityViolation: false,' },
]) /* ADR0038:register:test */ g36CaseTest('L3170', 'publicBoundary', 'ADR 0036 owner causal mutant: ' + mutation.name, async () => {
  const oracle = async namespace => {
    const fixture = createVirtualRuntimeFixture()
    fixture.controller.dispatch({ kind: 'source-throw', source: 'readDiagnosticRunIdEntropyBytes' })
    namespace.installBrowserSyncTransportRuntimeDiagnosticVirtualCapabilities(fixture.runtimeCapabilities)
    const api = namespace.createBrowserSyncTransportRuntimeDiagnosticAdapter()
    await assert.rejects(api.run(), error => assertAdapterStaticError(error))
    assert.equal(fixture.controller.snapshot().callCounts.entropy.readDiagnosticRunIdEntropyBytes, 1)
    assert.equal(fixture.controller.snapshot().callCounts.resources.performResourceOperation, 0)
  }
  await withAdapterCopy('virtual-runtime-conformance', null, oracle)
  await withAdapterCopy('virtual-runtime-conformance', mutation, namespace => assert.rejects(oracle(namespace), assert.AssertionError))
})

let sourceFixtureFilesSeedPromise = null
async function readSourceFixtureFilesSeed() {/* ADR0038:sync */g36Registry.assertExecutable();/* ADR0038:end */
  const files = new Map()
  const literals = ['index.html', 'package.json', 'package-lock.json',
    'server/startLocalSyncGateway.js', 'server/localSyncGatewayRuntimeConfig.js',
    'server/localSyncGatewayHttpServer.js',
    'scripts/browser/browserSyncTransportRuntimeDiagnosticObserver.js',
    'tests/browserSyncTransportRuntimeDiagnosticObserver.test.js',
    'docs/decisions/0032-browser-sync-transport-diagnostic-determinism-boundary.md',
    'docs/decisions/0033-browser-sync-transport-diagnostic-foundation-effects-protocol-boundary.md',
    'docs/decisions/0034-browser-sync-transport-diagnostic-foundation-grammar-derivation-and-testability-boundary.md',
    'docs/decisions/0035-browser-sync-transport-diagnostic-foundation-join-and-internal-transition-testability-boundary.md',
    'docs/decisions/0037-browser-sync-transport-diagnostic-foundation-observation-close-notification.md',
    'docs/evidence/browser-runtime-evidence.chrome-stable-windows-01.json']
  async function sources(relative) {
    const entries = await g36HarnessFs.readdir(g36HarnessPath.join(g36HarnessRepositoryRoot, relative), { withFileTypes: true })
    for (const entry of entries) {
      assert.equal(entry.isSymbolicLink(), false)
      const path = `${relative}/${entry.name}`
      if (entry.isDirectory()) await sources(path)
      else { assert.ok(entry.isFile()); literals.push(path) }
    }
  }
  await sources('src')
  for (const literal of literals.sort()) files.set(literal,
    new Uint8Array(await g36HarnessFs.readFile(g36HarnessPath.join(g36HarnessRepositoryRoot, ...literal.split('/')))))
  return files
}

async function loadSourceFixtureFiles() {
  // Cache only private raw fixture seeds. Every consumer receives a fresh Map
  // and fresh byte arrays; production test copies are still read and imported
  // independently by withAdapterCopy on every invocation.
  sourceFixtureFilesSeedPromise ??= readSourceFixtureFilesSeed()
  const seed = await sourceFixtureFilesSeedPromise
  return new Map([...seed].map(([literal, bytes]) => [literal, new Uint8Array(bytes)]))
}

/* ADR0038:register:test */ g36CaseTest('L3222', 'publicBoundary', 'adapter integration smoke: raw source load, frozen targetInfos, capture cap, cleanup, NOT_EVIDENCE', async () => {
  await withAdapterCopy('virtual-runtime-conformance', null, async namespace => {
    const sourcePlan = createAdapterSourceFixturePlan(await loadSourceFixtureFiles())
    const result = await runVirtualAdapterScenario(namespace, { entry: 'owner', sourcePlan, scenario: 'capture-cap' })
    assert.equal(result.completedSourceEntries, sourcePlan.preflight.length)
    assert.equal(result.outcome.kind, 'error')
    assertAdapterStaticError(result.outcome.error)
    assert.equal(result.owner.attemptStarted, true)
    assert.equal(result.owner.notificationCount, 1)
    assert.notEqual(result.owner.adapterObservationSnapshot, null)
    assert.equal(result.owner.foundationProjection.timing.completion.captureWindowState, 'elapsed')
    assert.equal(result.owner.finalizationCount, 1)
    assert.equal(result.owner.terminalOutcome.evidenceStatus, 'NOT_EVIDENCE')
    assert.equal(result.owner.writerCallCount, 0)
  })
})

// The virtual driver returns the fixed 100 + 10*i raw millisecond sequence.
// These are assertions over product-used owner facts and the closed fixture
// snapshot, with no extra export, callback installation, clock, or timer.
function registerAdr36ClockContractTests({ test, assert, withAdapterCopy, runVirtualAdapterScenario, createSourcePlan }) {
  const run = async mutation => withAdapterCopy('virtual-runtime-conformance', mutation, async namespace =>
    runVirtualAdapterScenario(namespace, { entry: 'owner', sourcePlan: await createSourcePlan(), scenario: 'capture-cap' }));
  const oracle = result => {
    const owner = result.owner;
    assert.equal(result.fixtureSnapshot.callCounts.clock.readControllerNanoseconds, owner.clockReadCount, 'each capability clock read belongs to the product clock ledger');
    assert.equal(owner.clockReadCount, owner.clockLedger.length, 'the normal Foundation path has no outer cleanup clock origin');
    assert.ok(owner.clockLedger.length > 3);
    for (let index = 0; index < owner.clockLedger.length; index += 1) {
      assert.equal(owner.clockLedger[index].milliseconds, 100 + index * 10, 'ledger uses the exact single primitive raw sample supplied to the Foundation');
    }
    const origins = owner.clockLedger.filter(row => row.reason === 'cleanup-origin');
    const completions = owner.clockLedger.filter(row => row.reason === 'cleanup-completion-after-cap-cancel');
    assert.equal(origins.length, 1);
    assert.equal(completions.length, 1);
    assert.equal(owner.cleanupOrigin, origins[0].milliseconds);
    assert.equal(owner.lastControllerClock, completions[0].milliseconds);
    assert.equal(owner.foundationProjection.timing.completion.cleanupFinalizeReason, 'all-steps-terminal');
    assert.equal(owner.foundationProjection.stages[9].relativeMilliseconds, 10 * Math.floor((completions[0].milliseconds - origins[0].milliseconds) / 10));
    assert.equal(owner.notificationCount, 1);
    assert.equal(owner.writerCallCount, 0);
  };
  let controlPromise = null;
  const ensureControl = () => {
    if (controlPromise === null) controlPromise = run(null).then(result => { oracle(result); }).catch(error => {
      controlPromise = null;
      throw error;
    });
    return controlPromise;
  };
  /* ADR0038:register:test */ g36CaseTest('L3272', 'registerAdr36ClockContractTests', 'ADR 0036: one exact deferred sample binds FIFO, adapter ledger and Foundation', async () => {
    await ensureControl();
  });
  const mutants = [
    {
      name: 'DEQUEUE_CLOCK_READ_EARLY',
      from: '  const entry = owner.fifo.shift()',
      to: "  if (owner.phase === 'capture') adapterInvoke(owner, 'clock', 'readControllerNanoseconds', [])\n  const entry = owner.fifo.shift()",
    },
    {
      name: 'CLOCK_SAMPLE_DOUBLE',
      from: '  owner.clockLedger.push({ reason, milliseconds })',
      to: "  owner.clockLedger.push({ reason, milliseconds })\n  if (reason === 'capture-dequeue-before-reflection') adapterInvoke(owner, 'clock', 'readControllerNanoseconds', [])",
    },
    {
      name: 'CLOCK_SAMPLE_LEDGER_SPLIT',
      from: '  owner.clockLedger.push({ reason, milliseconds })',
      to: '  owner.clockLedger.push({ reason, milliseconds: milliseconds + 1 })',
    },
  ];
  for (const mutation of mutants) {
    /* ADR0038:register:test */ g36CaseTest('L3293', 'registerAdr36ClockContractTests', `ADR 0036: exact source mutant ${mutation.name} is causally rejected by clock oracle`, async () => {
      await ensureControl();
      const result = await run(mutation);
      assert.equal(result.owner.ownerFinalizationCount, 1);
      assert.equal(result.owner.writerCallCount, 0);
      assert.throws(() => oracle(result), { name: 'AssertionError' });
    });
  }
}

// Test infrastructure only: raw UTF-8/NUL material enters the complete virtual owner.
const parserFixtureEncode = new TextEncoder()
const parserFixtureSession = 'session-adr0036-fixture'
function parserFixtureBytes(text) { return parserFixtureEncode.encode(text) }
function parserFixtureJoin(...arrays) {
  const output = new Uint8Array(arrays.reduce((sum, bytes) => sum + bytes.length, 0))
  let offset = 0
  for (const bytes of arrays) { output.set(bytes, offset); offset += bytes.length }
  return output
}
function parserFixtureFrame(text) { return parserFixtureJoin(typeof text === 'string' ? parserFixtureBytes(text) : text, Uint8Array.of(0)) }
function parserFixtureChunks(bytes, maximum = 65536) {
  const chunks = []
  for (let offset = 0; offset < bytes.length; offset += maximum) chunks.push(bytes.slice(offset, offset + maximum))
  return chunks
}
function parserFixtureActions(chunks) {
  return pipeOrdinal => chunks.map(bytes => ({ kind: 'pipe-chunk', pipeOrdinal, bytes }))
}
function parserFixtureTextActions(texts, maximum = 65536) {
  return parserFixtureActions(parserFixtureChunks(parserFixtureJoin(...texts.map(parserFixtureFrame)), maximum))
}
function parserFixturePadded(length) {
  const prefix = '{"method":"fixture-unrecognized","params":{}}'
  if (length < prefix.length) throw new Error('parser-fixture-frame-too-short')
  return prefix + ' '.repeat(length - prefix.length)
}
function parserFixtureNetworkRequest(requestId = 'parser-fixture-options') {
  return JSON.stringify({ method: 'Network.requestWillBeSent', sessionId: parserFixtureSession,
    params: { requestId, request: { url: 'http://127.0.0.1:8787/api/sync-test', method: 'OPTIONS' }, timestamp: 10 } })
}
function parserFixtureEvaluate() {
  return JSON.stringify({ id: 4, sessionId: parserFixtureSession, result: { result: { type: 'object', value: {
    preTransportContext: { url: { contextResult: 'match' }, origin: { contextResult: 'match' }, topLevel: { contextResult: 'match' }, secureContext: { contextResult: 'match' } },
    execution: { factoryCallCount: 'one', transportCallCount: 'one', dispatchState: 'dispatched' },
    settlement: { outcome: 'static-redacted-rejection', staticProfileResult: 'match', relativeMilliseconds: 5000, timingState: 'measured' },
  } } } })
}
function parserFixtureTerminal(assert, result) {
  assert.ok(result.outcome && ['error', 'result'].includes(result.outcome.kind))
  if (result.owner !== null) {
    assert.equal(result.owner.runState, 'terminal')
    assert.equal(result.owner.writerCallCount, 0)
    assert.equal(result.owner.ownerFinalizationCount, 1)
    if (result.owner.terminalOutcome !== null) assert.equal(result.owner.terminalOutcome.evidenceStatus, 'NOT_EVIDENCE')
  }
  if (result.outcome.kind === 'result') assert.equal(result.outcome.result, null)
  else {
    assert.equal(Object.getPrototypeOf(result.outcome.error), Error.prototype)
    assert.deepEqual(Reflect.ownKeys(result.outcome.error), ['message'])
    assert.equal(result.outcome.error.message, 'browserSyncTransportRuntimeDiagnosticAdapterFailed')
  }
}
function parserFixtureAccepted(assert, result, injectedMessages) {
  parserFixtureTerminal(assert, result)
  const pipe = result.owner.pipeLedger
  // Three setup replies precede the raw injection. Cleanup may add two replies.
  assert.ok(pipe.messageCount >= 3 + injectedMessages, 'every complete bounded CDP envelope must be materialized before semantic processing')
  assert.equal(pipe.frameCount, pipe.decodeCount)
  assert.equal(pipe.decodeCount, pipe.scanCount)
  assert.equal(pipe.scanCount, pipe.parseCount)
  assert.equal(pipe.violation, false, 'Foundation semantics must not be reported as a parser failure')
}
function parserFixtureRejected(assert, result, boundary = null) {
  parserFixtureTerminal(assert, result)
  const pipe = result.owner.pipeLedger
  assert.equal(pipe.violation, true)
  assert.equal(pipe.closed, true)
  assert.equal(pipe.accumulator.length, 0)
  assert.equal(result.owner.fifo.length, 0)
  assert.equal(result.owner.fifoMaterialBytes, 0)
  if (boundary === 'frame') assert.equal(pipe.decodeCount, 3)
  if (boundary === 'decode') { assert.equal(pipe.frameCount, 4); assert.equal(pipe.decodeCount, 3) }
  if (boundary === 'scan') { assert.equal(pipe.decodeCount, 4); assert.equal(pipe.scanCount, 3); assert.equal(pipe.parseCount, 3) }
  if (boundary === 'postparse') { assert.equal(pipe.parseCount, 4); assert.equal(pipe.messageCount, 3) }
}
function registerAdapterParserQueueConformanceTests({ test, assert, withAdapterCopy, runVirtualAdapterScenario, loadSourceFixtureFiles }) {
  let filesPromise = null
  const files = () => filesPromise ??= Promise.resolve().then(loadSourceFixtureFiles)
  async function run(rawBeforeCaptureCap, { entry = 'owner', mutation = null, rawAfterHookMicrotasks = 0, sourceSettlementOrder = 'post-settlement-first', assertBeforeCaptureCap = null } = {}) {
    let imported = false, result
    const sourcePlan = createAdapterSourceFixturePlan(await files())
    await withAdapterCopy('virtual-runtime-conformance', mutation, async namespace => {
      imported = true
      result = await runVirtualAdapterScenario(namespace, { entry, sourcePlan, scenario: 'capture-cap', rawBeforeCaptureCap, rawAfterHookMicrotasks, sourceSettlementOrder, assertBeforeCaptureCap })
    })
    assert.equal(imported, true, 'each control and mutant must import and enter the productive virtual-owner flow')
    assert.equal(result.completedSourceEntries, sourcePlan.preflight.length)
    parserFixtureTerminal(assert, result)
    return result
  }
  const envelope = '{"method":"fixture-unrecognized","params":{}}'
  const validTexts = [
    envelope, '{"id":9001,"result":null}', '{"id":9002,"error":[]}',
    '{"method":"x","params":[null,true,false,-0,1,-2,0.5,1e2,1E-2]}',
    '{"method":"x","sessionId":"foreign-session","params":{"escaped":"\\uFEFF","surrogate":"\\uD800","pair":"\\uD83D\\uDE00","escapes":"\\\"\\\\\\/\\b\\f\\n\\r\\t"}}',
    ' \t\r\n{"method":"x","params":{"same":{"name":0},"separate":{"name":1},"unicode":"ä€😀"}}\r\n',
    '{"method":"x","params":{"__proto__":{"toJSON":null},"constructor":0,"prototype":0}}',
    '{"id":1,"result":{"targetInfos":[]}}', '{"id":1,"result":{"targetInfos":[]}}',
    '{"method":"Network.responseReceived","sessionId":"foreign","params":{"requestId":"unrelated","response":{"url":"http://127.0.0.1:8787/api/sync-test","status":418},"timestamp":-17}}',
  ]
  /* ADR0038:register:test */ g36CaseTest('L3404', 'registerAdapterParserQueueConformanceTests', 'ADR 0036 Parser: one chunk preserves multiple RFC8259 envelopes and semantic counterexamples', { concurrency: false }, async () => {
    parserFixtureAccepted(assert, await run(parserFixtureTextActions(validTexts)), validTexts.length)
  })
  /* ADR0038:register:test */ g36CaseTest('L3407', 'registerAdapterParserQueueConformanceTests', 'ADR 0036 Parser: every single-byte boundary preserves multibyte UTF8 and escaped UTF16', { concurrency: false }, async () => {
    const text = '{"method":"x","params":{"unicode":"ä€😀","escaped":"\\uFEFF\\uD800"}}'
    parserFixtureAccepted(assert, await run(parserFixtureTextActions([text], 1), { sourceSettlementOrder: 'passive-first' }), 1)
  })
  /* ADR0038:register:test */ g36CaseTest('L3411', 'registerAdapterParserQueueConformanceTests', 'ADR 0036 Parser: interior unescaped U+FEFF and escaped U+FEFF are ordinary JSON string data',{concurrency:false},async()=>{
    const texts=['{"method":"x","params":{"value":"\uFEFF"}}','{"method":"x","params":{"\uFEFF":"\\uFEFF"}}']
    parserFixtureAccepted(assert,await run(parserFixtureTextActions(texts)),2)
  })
  /* ADR0038:register:test */ g36CaseTest('L3415', 'registerAdapterParserQueueConformanceTests', 'ADR 0036 Parser: raw and escaped interior U+FEFF member names remain duplicate-equivalent',{concurrency:false},async()=>{
    parserFixtureRejected(assert,await run(parserFixtureTextActions(['{"method":"x","params":{"\uFEFF":0,"\\uFEFF":1}}'])),'scan')
  })
  const nestedMemberText=(depth,duplicate)=>{
    if(depth===1) return duplicate?'{"method":"x","me\\u0074hod":"x","params":null}':'{"method":"x","params":null}'
    const leaf=duplicate?'{"key":0,"k\\u0065y":1}':'{"key":0,"other":1}'
    return '{"method":"x","params":'+'{"next":'.repeat(depth-2)+leaf+'}'.repeat(depth-2)+'}'
  }
  for(const depth of [1,2,16,31]) /* ADR0038:register:test */ g36CaseTest('L3423', 'registerAdapterParserQueueConformanceTests', 'ADR 0036 Parser: distinct object members at depth'+depth+' remain valid',{concurrency:false},async()=>{
    parserFixtureAccepted(assert,await run(parserFixtureTextActions([nestedMemberText(depth,false)]),{sourceSettlementOrder:'passive-first'}),1)
  })
  for(let depth=1;depth<=31;depth+=1) /* ADR0038:register:test */ g36CaseTest('L3426', 'registerAdapterParserQueueConformanceTests', 'ADR 0036 Parser: decoded duplicate member rejected at every permitted nonempty-object depth '+depth,{concurrency:false},async()=>{
    parserFixtureRejected(assert,await run(parserFixtureTextActions([nestedMemberText(depth,true)])),'scan')
  })
  // A member value of an object at depth32 would itself be depth33. That
  // independently forbidden shape cannot be a positive duplicate-key control.
  /* ADR0038:register:test */ g36CaseTest('L3431', 'registerAdapterParserQueueConformanceTests', 'ADR 0036 Parser: object at depth32 cannot admit even its first member value',{concurrency:false},async()=>{
    parserFixtureRejected(assert,await run(parserFixtureTextActions([nestedMemberText(32,false)])),'scan')
  })
  /* ADR0038:register:test */ g36CaseTest('L3434', 'registerAdapterParserQueueConformanceTests', 'ADR 0036 Parser causal mutant: deepest permitted duplicate guard must precede native parse',{concurrency:false},async()=>{
    const input=parserFixtureTextActions([nestedMemberText(31,true)])
    const baseline=await run(input); parserFixtureRejected(assert,baseline,'scan')
    const changed=await run(input,{mutation:{name:'DEEPEST_DECODED_DUPLICATE_KEY_BYPASS',from:'adapterAssert(!keys.has(key) && ++members <= 8192)',to:'adapterAssert(++members <= 8192)'}})
    assert.equal(changed.owner.pipeLedger.parseCount,baseline.owner.pipeLedger.parseCount+1)
    assert.throws(()=>parserFixtureRejected(assert,changed,'scan'),{name:'AssertionError'})
  })
  /* ADR0038:register:test */ g36CaseTest('L3441', 'registerAdapterParserQueueConformanceTests', 'ADR 0036 Parser: public factory traverses raw chunk framing with the unchanged Foundation', { concurrency: false }, async () => {
    const result = await run(parserFixtureTextActions(validTexts.slice(0, 3)), { entry: 'factory', sourceSettlementOrder: 'passive-first' })
    assert.equal(result.owner, null)
    assert.ok(result.fixtureSnapshot.callCounts.pipe.writeDebugPipe >= 4)
    assert.ok(result.fixtureSnapshot.producerTurnCount > 3)
  })
  const badTexts = [
    ['unescaped control', '{"method":"x","params":"\u0001"}', 'scan'],
    ['unknown escape', '{"method":"x","params":"\\v"}', 'scan'],
    ['short unicode escape', '{"method":"x","params":"\\u12"}', 'scan'],
    ['nonhex unicode escape', '{"method":"x","params":"\\u12GG"}', 'scan'],
    ['leading zero', '{"method":"x","params":01}', 'scan'],
    ['leading plus', '{"method":"x","params":+1}', 'scan'],
    ['missing integer', '{"method":"x","params":.1}', 'scan'],
    ['missing fraction', '{"method":"x","params":1.}', 'scan'],
    ['missing exponent', '{"method":"x","params":1e+}', 'scan'],
    ['trailing comma object', '{"method":"x","params":{},}', 'scan'],
    ['trailing comma array', '{"method":"x","params":[0,]}', 'scan'],
    ['comment', '{"method":"x","params":/*x*/0}', 'scan'],
    ['additional text', envelope + ' true', 'scan'],
    ['unclosed object', '{"method":"x","params":{}', 'scan'],
    ['unclosed string', '{"method":"x","params":"x}', 'scan'],
    ['nonRFC whitespace', '\u00a0' + envelope, 'scan'],
    ['duplicate member', '{"method":"x","params":{"name":0,"name":1}}', 'scan'],
    ['escape-equivalent duplicate', '{"method":"x","params":{"name":0,"na\\u006de":1}}', 'scan'],
    ['UTF16 equivalent duplicate', '{"method":"x","params":{"😀":0,"\\uD83D\\uDE00":1}}', 'scan'],
    ['nonfinite native number', '{"method":"x","params":1e400}', 'postparse'],
    ['primitive root', 'null', 'postparse'], ['array root', '[]', 'postparse'],
    ['empty root', '{}', 'postparse'], ['response missing result/error', '{"id":9}', 'postparse'],
    ['response result and error', '{"id":9,"result":{},"error":{}}', 'postparse'],
    ['response extra', '{"id":9,"result":{},"extra":0}', 'postparse'],
    ['response zero id', '{"id":0,"result":{}}', 'postparse'],
    ['response fractional id', '{"id":1.5,"result":{}}', 'postparse'],
    ['response unsafe id', '{"id":9007199254740992,"result":{}}', 'postparse'],
    ['event missing params', '{"method":"x"}', 'postparse'],
    ['event empty method', '{"method":"","params":{}}', 'postparse'],
    ['event mixed response', '{"method":"x","params":{},"id":9}', 'postparse'],
    ['empty session', '{"method":"x","sessionId":"","params":{}}', 'postparse'],
    ['nonstring session', '{"method":"x","sessionId":1,"params":{}}', 'postparse'],
  ]
  for (const [name, text, boundary] of badTexts) /* ADR0038:register:test */ g36CaseTest('L3481', 'registerAdapterParserQueueConformanceTests', 'ADR 0036 Parser: reject ' + name + ' at ' + boundary, { concurrency: false }, async () => {
    parserFixtureRejected(assert, await run(parserFixtureTextActions([text])), boundary)
  })
  for (const [name, bytes, boundary] of [
    ['empty frame', Uint8Array.of(0), 'decode'],
    ['leading raw BOM', parserFixtureJoin(Uint8Array.of(239,187,191), parserFixtureFrame(envelope)), 'decode'],
    ['overlong UTF8', parserFixtureJoin(Uint8Array.of(192,175), Uint8Array.of(0)), 'decode'],
    ['truncated UTF8', Uint8Array.of(226,130,0), 'decode'],
    ['encoded surrogate UTF8', Uint8Array.of(237,160,128,0), 'decode'],
    ['invalid continuation UTF8', Uint8Array.of(226,32,172,0), 'decode'],
  ]) /* ADR0038:register:test */ g36CaseTest('L3491', 'registerAdapterParserQueueConformanceTests', 'ADR 0036 Parser: reject ' + name + ' before lexical scan', { concurrency: false }, async () => {
    parserFixtureRejected(assert, await run(parserFixtureActions([bytes])), boundary)
  })
  for (const [name, actions, violated] of [
    ['empty EOF creates connection close', pipeOrdinal => [{ kind: 'pipe-eof', pipeOrdinal }], false],
    ['partial frame EOF is violation', pipeOrdinal => [{ kind: 'pipe-chunk', pipeOrdinal, bytes: parserFixtureBytes('{') }, { kind: 'pipe-eof', pipeOrdinal }], true],
    ['bytes after EOF are violation', pipeOrdinal => [{ kind: 'pipe-eof', pipeOrdinal }, { kind: 'pipe-chunk', pipeOrdinal, bytes: Uint8Array.of(32) }], true],
    ['read error is violation', pipeOrdinal => [{ kind: 'pipe-read-error', pipeOrdinal }], true],
  ]) /* ADR0038:register:test */ g36CaseTest('L3499', 'registerAdapterParserQueueConformanceTests', 'ADR 0036 Parser: ' + name, { concurrency: false }, async () => {
    const result = await run(actions, { sourceSettlementOrder: violated ? 'post-settlement-first' : 'passive-first' })
    if (violated) parserFixtureRejected(assert, result)
    else { assert.equal(result.owner.pipeLedger.violation, false); assert.equal(result.owner.pipeLedger.closed, true) }
  })
  const bounds = [
    ['frame bytes and ASCII text codeunits', 262144, length => parserFixturePadded(length), 'frame'],
    ['string UTF16 codeunits', 131072, length => '{"method":"x","params":"' + 'a'.repeat(length) + '"}', 'scan'],
    ['root-counted depth', 32, depth => '{"method":"x","params":' + '['.repeat(depth - 2) + '0' + ']'.repeat(depth - 2) + '}', 'scan'],
    ['JSON nodes', 4096, nodes => '{"method":"x","params":[' + new Array(nodes - 3).fill('0').join(',') + ']}', 'scan'],
  ]
  for (const [name, limit, build, boundary] of bounds) for (const delta of [0, 1]) /* ADR0038:register:test */ g36CaseTest('L3510', 'registerAdapterParserQueueConformanceTests', 'ADR 0036 Parser: actual ' + name + ' ' + (limit + delta), { concurrency: false }, async () => {
    const result = await run(parserFixtureTextActions([build(limit + delta)]), { sourceSettlementOrder: delta === 0 ? 'passive-first' : 'post-settlement-first' })
    if (delta === 0) parserFixtureAccepted(assert, result, 1)
    else parserFixtureRejected(assert, result, boundary)
  })
  /* ADR0038:register:test */ g36CaseTest('L3515', 'registerAdapterParserQueueConformanceTests', 'ADR 0036 FIFO: actual 1048576 material bytes survive until dequeue', { concurrency: false }, async () => {
    parserFixtureAccepted(assert, await run(parserFixtureTextActions([envelope, ...[262144,262144,262144,262144].map(parserFixturePadded)])), 5)
  })
  /* ADR0038:register:test */ g36CaseTest('L3518', 'registerAdapterParserQueueConformanceTests', 'ADR 0036 FIFO: actual 1048577 queued material bytes reject', { concurrency: false }, async () => {
    // The hook starts with a pending dequeue: a first small envelope takes that slot.
    const texts = [envelope, ...[262144,262144,262144,262100,45].map(parserFixturePadded)]
    parserFixtureRejected(assert, await run(parserFixtureTextActions(texts)))
  })
  for (const excess of [false, true]) /* ADR0038:register:test */ g36CaseTest('L3523', 'registerAdapterParserQueueConformanceTests', 'ADR 0036 FIFO: actual ' + (excess ? '257' : '256') + ' waiting entries', { concurrency: false }, async () => {
    // One envelope is delivered into the pending dequeue; the rest remain FIFO-owned.
    const count = excess ? 258 : 257
    const result = await run(parserFixtureTextActions(new Array(count).fill(envelope)), { rawAfterHookMicrotasks: 32, sourceSettlementOrder: excess ? 'passive-first' : 'post-settlement-first' })
    if (excess) parserFixtureRejected(assert, result)
    else parserFixtureAccepted(assert, result, count)
  })
  const queueCall = "adapterQueue(owner, adapterFreeze({ kind: 'cdp-message', value: root }), frame.length)"
  // Each bypass is a distinct productive callsite. The fixture still emits only
  // raw bytes; the changed adapter illicitly manufactures its own parsed event.
  const rawBypassInput = parserFixtureTextActions(['{"method":"x","me\\u0074hod":"x","params":null}'])
  const rawEnvelopeCall = "      enqueueBrowserSyncTransportRuntimeDiagnosticAdapterEvent(owner, adapterFreeze({\n        profile: 'adr-0036-producer-event-v1', producer: producerName,\n        producerHandle: pendingBinding.handle, generation: pendingBinding.generation, event,\n      }))"
  const bypasses = [
    { name: 'RAW_PIPE_BYPASS', from: '      adapterParseFrame(owner, frame)',
      to: "      adapterQueue(owner, adapterFreeze({ kind: 'cdp-message', value: adapterFreezeData(adapterParse(new AdapterTextDecoder('utf-8', { fatal: true }).decode(frame))) }), frame.length)" },
    { name: 'PRODUCER_EVENT_BYPASS', from: rawEnvelopeCall,
      to: "      if (producerName === 'debug-pipe-read' && event.kind === 'chunk') {\n        const rawText = new AdapterTextDecoder('utf-8', { fatal: true }).decode(event.bytes);\n        for (const part of rawText.split('\\0').filter(part => part.length > 0)) adapterQueue(owner, adapterFreeze({ kind: 'cdp-message', value: adapterFreezeData(adapterParse(part)) }), part.length);\n      } else {\n" + rawEnvelopeCall + '\n      }' },
  ]
  for (const mutation of bypasses) /* ADR0038:register:test */ g36CaseTest('L3541', 'registerAdapterParserQueueConformanceTests', 'ADR 0036 Parser mandatory causal mutant: ' + mutation.name, { concurrency: false }, async () => {
    const baseline = await run(rawBypassInput)
    parserFixtureRejected(assert, baseline, 'scan')
    assert.equal(baseline.owner.pipeLedger.messageCount, 3)
    const changed = await run(rawBypassInput, { mutation, sourceSettlementOrder: 'passive-first' })
    assert.equal(changed.owner.pipeLedger.violation, false)
    assert.equal(changed.owner.pipeLedger.frameCount, 0)
    assert.equal(changed.owner.pipeLedger.parseCount, 0)
    assert.equal(changed.owner.pipeLedger.messageCount, 0)
    assert.equal(changed.fixtureSnapshot.callCounts.pipe.writeDebugPipe, 4)
    assert.deepEqual(changed.owner.wireLedger.operations.map(operation => ({
      intentCount: operation.intentCount, acceptedFrameCount: operation.acceptedFrameCount,
      ackCount: operation.ackCount, replyCount: operation.replyCount,
    })), [
      { intentCount: 1, acceptedFrameCount: 1, ackCount: 1, replyCount: 1 },
      { intentCount: 1, acceptedFrameCount: 1, ackCount: 1, replyCount: 1 },
      { intentCount: 1, acceptedFrameCount: 1, ackCount: 1, replyCount: 1 },
      { intentCount: 1, acceptedFrameCount: 1, ackCount: 1, replyCount: 0 },
      { intentCount: 1, acceptedFrameCount: 0, ackCount: 0, replyCount: 0 },
      { intentCount: 1, acceptedFrameCount: 0, ackCount: 0, replyCount: 0 },
    ])
    assert.deepEqual(Object.fromEntries(Object.entries(changed.owner.capLedger).map(([kind, cap]) =>
      [kind, { state: cap.state, cancelAttempted: cap.cancelAttempted }])), {
      setup: { state: 'cancelled', cancelAttempted: true },
      capture: { state: 'fired', cancelAttempted: false },
      cleanup: { state: 'cancelled', cancelAttempted: true },
    })
    assert.equal(changed.owner.hardViolation, true)
    assert.equal(changed.owner.capabilityError, true)
    assert.equal(changed.owner.capabilityViolation, false)
    assert.equal(changed.owner.producerViolation, false)
    assert.equal(changed.owner.notificationViolation, false)
    assert.equal(changed.owner.notificationCount, 1)
    assert.equal(changed.owner.finalizationCount, 1)
    assert.notEqual(changed.owner.foundationProjection, null)
    assert.equal(changed.owner.foundationProjection.timing.completion.observationCloseReason, 'confirmed-violation')
    assert.equal(changed.owner.terminalOutcome.observerGate, 'FAIL')
    assert.equal(changed.owner.terminalOutcome.finding, 'observer-invalid')
    assert.throws(() => parserFixtureRejected(assert, changed, 'scan'), { name: 'AssertionError' })
  })
  const mutants = [
    { name: 'raw-BOM-guard-bypass', from: '!(frame.length >= 3 && frame[0] === 239 && frame[1] === 187 && frame[2] === 191)', to: 'true',
      input: parserFixtureActions([parserFixtureJoin(Uint8Array.of(239,187,191), parserFixtureFrame(envelope))]), baseline: 'decode', observable: 'accepted' },
    { name: 'duplicate-decoded-key-bypass', from: 'adapterAssert(!keys.has(key) && ++members <= 8192)', to: 'adapterAssert(++members <= 8192)',
      input: parserFixtureTextActions(['{"method":"x","params":{"name":0,"na\\u006de":1}}']), baseline: 'scan', observable: 'parse' },
    { name: 'double-native-parse', from: 'const root = adapterParse(text)', to: 'const root = (owner.pipeLedger.parseCount += 1, adapterParse(text), adapterParse(text))',
      input: parserFixtureTextActions([envelope]), baseline: null, observable: 'doubleparse' },
    { name: 'FIFO-material-accounting-bypass', from: 'owner.fifo.length < 256 && owner.fifoMaterialBytes + materialBytes <= 1048576 &&', to: 'owner.fifo.length < 256 &&',
      input: parserFixtureTextActions([envelope, ...[262144,262144,262144,262100,45].map(parserFixturePadded)]), baseline: true, observable: 'accepted' },
    { name: 'FIFO-entry-cap-bypass', from: 'owner.fifo.length < 256 && owner.fifoMaterialBytes + materialBytes <= 1048576 &&', to: 'owner.fifoMaterialBytes + materialBytes <= 1048576 &&',
      input: parserFixtureTextActions(new Array(258).fill(envelope)), baseline: true, observable: 'accepted' },
  ]
  for (const vector of mutants) /* ADR0038:register:test */ g36CaseTest('L3593', 'registerAdapterParserQueueConformanceTests', 'ADR 0036 Parser causal mutant: ' + vector.name, { concurrency: false }, async () => {
    const queueBoundary = vector.name === 'FIFO-material-accounting-bypass'
      ? { messages: 9, beforeEntries: 4, beforeBytes: 1048532, afterEntries: 5, afterBytes: 1048577 }
      : vector.name === 'FIFO-entry-cap-bypass'
        ? { messages: 261, beforeEntries: 256, beforeBytes: 256 * parserFixtureBytes(envelope).length,
          afterEntries: 257, afterBytes: 257 * parserFixtureBytes(envelope).length }
        : null
    let baselineQueue = null, changedQueue = null
    const queueState = owner => ({ entries: owner.fifo.length, materialBytes: owner.fifoMaterialBytes,
      messageCount: owner.pipeLedger.messageCount, violation: owner.pipeLedger.violation })
    const withinQueueLimits = state => {
      assert.ok(state.entries <= 256, 'the queued entry count remains within its independent cap')
      assert.ok(state.materialBytes <= 1048576, 'the queued material remains within its independent cap')
    }
    const baseline = await run(vector.input, {
      sourceSettlementOrder: vector.baseline === null || vector.name === 'FIFO-entry-cap-bypass' ? 'passive-first' : 'post-settlement-first',
      assertBeforeCaptureCap: queueBoundary === null ? null : owner => {
        assert.equal(baselineQueue, null)
        baselineQueue = queueState(owner)
      },
    })
    if (vector.baseline !== null) parserFixtureRejected(assert, baseline, vector.baseline === true ? null : vector.baseline)
    else parserFixtureAccepted(assert, baseline, 1)
    if (queueBoundary !== null) {
      assert.deepEqual(baselineQueue, { entries: queueBoundary.beforeEntries, materialBytes: queueBoundary.beforeBytes,
        messageCount: queueBoundary.messages, violation: true })
      withinQueueLimits(baselineQueue)
      if (vector.name === 'FIFO-entry-cap-bypass') {
        assert.equal(baseline.owner.pipeLedger.violation, true, 'cleanup queue overflow is contained as a confirmed parser violation')
        assert.equal(baseline.owner.cleanupViolation, true)
      }
    }
    const changed = await run(vector.input, {
      mutation: { name: vector.name, from: vector.from, to: vector.to },
      sourceSettlementOrder: ['duplicate-decoded-key-bypass','FIFO-entry-cap-bypass','FIFO-material-accounting-bypass'].includes(vector.name) ? 'post-settlement-first' : 'passive-first',
      assertBeforeCaptureCap: queueBoundary === null ? null : owner => {
        assert.equal(changedQueue, null)
        changedQueue = queueState(owner)
      },
    })
    if (queueBoundary !== null) {
      assert.deepEqual(changedQueue, { entries: queueBoundary.afterEntries, materialBytes: queueBoundary.afterBytes,
        messageCount: queueBoundary.messages, violation: false })
      assert.throws(() => withinQueueLimits(changedQueue), { name: 'AssertionError' })
      assert.equal(changed.owner.pipeLedger.violation, false)
      assert.equal(changed.owner.fifo.length, 0)
      assert.equal(changed.owner.fifoMaterialBytes, 0)
    } else if (vector.observable === 'parse') assert.ok(changed.owner.pipeLedger.parseCount > baseline.owner.pipeLedger.parseCount)
    else if (vector.observable === 'doubleparse') assert.ok(changed.owner.pipeLedger.parseCount > changed.owner.pipeLedger.scanCount)
    else { assert.equal(changed.owner.pipeLedger.violation, false); assert.ok(changed.owner.pipeLedger.messageCount > baseline.owner.pipeLedger.messageCount || vector.name === 'raw-BOM-guard-bypass') }
  })
  /* ADR0038:register:test */ g36CaseTest('L3644', 'registerAdapterParserQueueConformanceTests', 'ADR 0036 FIFO causal mutant: identical replies cannot be deduplicated', { concurrency: false }, async () => {
    const input = parserFixtureTextActions([parserFixtureNetworkRequest(), parserFixtureEvaluate(), parserFixtureEvaluate()])
    const baseline = await run(input, { sourceSettlementOrder: 'passive-first' })
    parserFixtureAccepted(assert, baseline, 3)
    assert.equal(baseline.owner.wireLedger.operations[3].replyCount, 2)
    const mutation = { name: 'duplicate-response-coalescing', from: queueCall, to: "if (!(Object.hasOwn(root, 'id') && owner.fifo.some(entry => entry.value.kind === 'cdp-message' && entry.value.value.id === root.id))) " + queueCall }
    const changed = await run(input, { mutation, sourceSettlementOrder: 'passive-first' })
    assert.equal(changed.owner.wireLedger.operations[3].replyCount, 1)
  })
  /* ADR0038:register:test */ g36CaseTest('L3653', 'registerAdapterParserQueueConformanceTests', 'ADR 0036 FIFO causal mutant: LIFO cannot move capture cap before an earlier reply', { concurrency: false }, async () => {
    const input = parserFixtureTextActions([parserFixtureNetworkRequest(), parserFixtureEvaluate()])
    const baseline = await run(input, { sourceSettlementOrder: 'passive-first' })
    parserFixtureAccepted(assert, baseline, 2)
    assert.notEqual(baseline.owner.adapterObservationSnapshot, null)
    assert.equal(Object.isFrozen(baseline.owner.adapterObservationSnapshot), true)
    assert.equal(Object.isFrozen(baseline.owner.adapterObservationSnapshot.wire), true)
    assert.equal(Object.isFrozen(baseline.owner.adapterObservationSnapshot.wire[3]), true)
    assert.equal(baseline.owner.adapterObservationSnapshot.wire[3].replyCount, 1)
    const changed = await run(input, { mutation: { name: 'FIFO-reordered-to-LIFO', from: 'const entry = owner.fifo.shift()', to: 'const entry = owner.fifo.pop()' }, sourceSettlementOrder: 'passive-first' })
    assert.notEqual(changed.owner.adapterObservationSnapshot, null)
    assert.equal(Object.isFrozen(changed.owner.adapterObservationSnapshot), true)
    assert.equal(Object.isFrozen(changed.owner.adapterObservationSnapshot.wire), true)
    assert.equal(Object.isFrozen(changed.owner.adapterObservationSnapshot.wire[3]), true)
    assert.equal(changed.owner.adapterObservationSnapshot.wire[3].replyCount, 0)
  })
  /* ADR0038:register:test */ g36CaseTest('L3669', 'registerAdapterParserQueueConformanceTests', 'ADR 0036 FIFO causal mutant: uncorrelated endpoint responses cannot be prefiltered', { concurrency: false }, async () => {
    const foreign = JSON.stringify({ method: 'Network.responseReceived', sessionId: parserFixtureSession,
      params: { requestId: 'foreign-fixture-request', response: { url: 'http://127.0.0.1:8787/api/sync-test', status: 418 }, timestamp: 10.1 } })
    const input = parserFixtureTextActions([parserFixtureNetworkRequest(), foreign])
    const baseline = await run(input, { sourceSettlementOrder: 'passive-first' })
    parserFixtureAccepted(assert, baseline, 2)
    assert.notEqual(baseline.owner.foundationProjection, null)
    assert.equal(baseline.owner.foundationProjection.requestBudget.sequence, 'ambiguous')
    const changed = await run(input, { sourceSettlementOrder: 'passive-first', mutation: { name: 'raw-endpoint-response-prefilter', from: queueCall,
      to: "if (root.method !== 'Network.responseReceived') " + queueCall } })
    assert.notEqual(changed.owner.foundationProjection, null)
    assert.equal(changed.owner.foundationProjection.requestBudget.sequence, 'incomplete')
  })
  const rawNetworkOrder=times=>parserFixtureTextActions([
    JSON.stringify({method:'Network.requestWillBeSent',sessionId:parserFixtureSession,params:{requestId:'timestamp-options',request:{url:'http://127.0.0.1:8787/api/sync-test',method:'OPTIONS'},timestamp:times[0]}}),
    JSON.stringify({method:'Network.responseReceived',sessionId:parserFixtureSession,params:{requestId:'timestamp-options',response:{url:'http://127.0.0.1:8787/api/sync-test',status:204},timestamp:times[1]}}),
    JSON.stringify({method:'Network.requestWillBeSent',sessionId:parserFixtureSession,params:{requestId:'timestamp-post',request:{url:'http://127.0.0.1:8787/api/sync-test',method:'POST'},timestamp:times[2]}}),
  ])
  const networkStage=(result,id)=>result.owner.foundationProjection.stages.find(stage=>stage.stageId===id)
  /* ADR0038:register:test */ g36CaseTest('L3688', 'registerAdapterParserQueueConformanceTests', 'ADR 0036 Raw Network: timestamps10→11→12 pass unchanged parser and reach three ordered Foundation stages',{concurrency:false},async()=>{
    const result=await run(rawNetworkOrder([10,11,12]),{sourceSettlementOrder:'passive-first'})
    parserFixtureAccepted(assert,result,3)
    for(const [id,order,time] of [['preflight-request-observed',1,0],['preflight-204-observed',2,1000],['post-request-observed',3,2000]]) {/* ADR0038:sync */g36Variant('network-stage',id);/* ADR0038:end */
      const stage=networkStage(result,id)
      assert.equal(stage.observationState,'observed'); assert.equal(stage.receiptOrder,order); assert.equal(stage.relativeMilliseconds,time)
    }
  })
  for(const entry of ['owner','factory']) /* ADR0038:register:test */ g36CaseTest('L3696', 'registerAdapterParserQueueConformanceTests', 'ADR 0036 Raw Network: timestamps10→12→11 remain in producer arrival order via '+entry,{concurrency:false},async()=>{
    const result=await run(rawNetworkOrder([10,12,11]),{entry,sourceSettlementOrder:'passive-first'})
    if(entry==='owner') {
      parserFixtureAccepted(assert,result,3)
      assert.equal(result.owner.foundationProjection.candidateObserverGate,'FAIL')
      assert.equal(networkStage(result,'preflight-204-observed').relativeMilliseconds,2000)
      assert.equal(networkStage(result,'post-request-observed').observationState,'not-observed')
      assert.equal(result.owner.foundationProjection.requestBudget.endpointPosts,'zero')
    } else { assert.equal(result.owner,null); assert.ok(result.fixtureSnapshot.callCounts.pipe.writeDebugPipe>=4) }
  })
  /* ADR0038:register:test */ g36CaseTest('L3706', 'registerAdapterParserQueueConformanceTests', 'ADR 0036 Raw Network causal mutant: sorting timestamps cannot conceal10→12→11',{concurrency:false},async()=>{
    const input=rawNetworkOrder([10,12,11]),baseline=await run(input,{sourceSettlementOrder:'passive-first'})
    parserFixtureAccepted(assert,baseline,3)
    assert.equal(networkStage(baseline,'post-request-observed').observationState,'not-observed')
    const mutation={name:'RAW_NETWORK_TIMESTAMP_SORT',from:'  owner.fifo.push(entry)',to:"  owner.fifo.push(entry); owner.fifo.sort((left,right)=>{ if(left.value.kind!=='cdp-message'||right.value.kind!=='cdp-message') return 0; const a=left.value.value.params?.timestamp,b=right.value.value.params?.timestamp; return typeof a==='number'&&typeof b==='number'?a-b:0 })"}
    const changed=await run(input,{mutation,sourceSettlementOrder:'passive-first'})
    parserFixtureAccepted(assert,changed,3)
    assert.equal(networkStage(changed,'post-request-observed').observationState,'observed')
    assert.equal(networkStage(changed,'post-request-observed').relativeMilliseconds,1000)
    assert.deepEqual(['preflight-request-observed','preflight-204-observed','post-request-observed'].map(id=>networkStage(changed,id).receiptOrder),[1,3,2])
    assert.equal(changed.owner.foundationProjection.requestBudget.sequence,'other')
    assert.equal(changed.owner.foundationProjection.requestBudget.endpointPosts,'one')
  })
  // 8192 members cannot be reached while the independent4096-node cap holds.
  // Test its actual production callsites with lower20/19 controls; setup replies remain below both.
  for (const [name, from, make] of [
    ['scanner-object-members', '++members <= 8192', limit => '++members <= ' + limit],
    ['postparse-object-members', 'if (!array) adapterAssert(++members <= 8192)', limit => 'if (!array) adapterAssert(++members <= ' + limit + ')'],
  ]) /* ADR0038:register:test */ g36CaseTest('L3724', 'registerAdapterParserQueueConformanceTests', 'ADR 0036 Parser causal bound: ' + name + ' dominated actual cap', { concurrency: false }, async () => {
    const text = '{"method":"x","params":{' + Array.from({ length: 18 }, (_, index) => '"k' + index + '":0').join(',') + '}}'
    // Anchor scanner uniquely; the postparse guard intentionally retains its own cap.
    const exactFrom = name.startsWith('scanner') ? 'adapterAssert(!keys.has(key) && ++members <= 8192)' : from
    const exactTo = limit => name.startsWith('scanner') ? 'adapterAssert(!keys.has(key) && ++members <= ' + limit + ')' : make(limit)
    const input = parserFixtureTextActions([text])
    const inclusive = await run(input, { mutation: { name: name + '-inclusive20', from: exactFrom, to: exactTo(20) }, sourceSettlementOrder: 'passive-first' })
    parserFixtureAccepted(assert, inclusive, 1)
    const exclusive = await run(input, { mutation: { name: name + '-exclusive19', from: exactFrom, to: exactTo(19) } })
    parserFixtureRejected(assert, exclusive, name.startsWith('scanner') ? 'scan' : 'postparse')
  })
  /* ADR0038:register:test */ g36CaseTest('L3735', 'registerAdapterParserQueueConformanceTests', 'ADR 0036 Parser causal bound: raw readchunk guard below normative fixture cap', { concurrency: false }, async () => {
    const mutation = { name: 'raw-chunk-cap512-control', from: 'function adapterReceiveChunk(owner, bytes) {\n  const copy = adapterCopyBytes(bytes, 65536)', to: 'function adapterReceiveChunk(owner, bytes) {\n  const copy = adapterCopyBytes(bytes, 512)' }
    const exact = parserFixtureFrame(parserFixturePadded(511))
    parserFixtureAccepted(assert, await run(parserFixtureActions([exact]), { mutation, sourceSettlementOrder: 'passive-first' }), 1)
    parserFixtureRejected(assert, await run(parserFixtureActions([parserFixtureJoin(exact, Uint8Array.of(32))]), { mutation }), 'frame')
  })
  for (const [name, from, to, goodLength, badLength, boundary] of [
    ['decoded-text-codeunits', "adapterAssert(typeof text === 'string' && text.length > 0 && text.length <= 262144)", "adapterAssert(typeof text === 'string' && text.length > 0 && text.length <= 512)", 512, 513, 'scan'],
    ['accumulator-including-NUL', 'pipe.accumulator.length + 1 <= 262145', 'pipe.accumulator.length + 1 <= 513', 512, 513, 'frame'],
  ]) /* ADR0038:register:test */ g36CaseTest('L3744', 'registerAdapterParserQueueConformanceTests', 'ADR 0036 Parser causal bound: ' + name + ' independently enforced before materialization', { concurrency: false }, async () => {
    const mutation = { name: name + '-lower-limit-control', from, to }
    parserFixtureAccepted(assert, await run(parserFixtureTextActions([parserFixturePadded(goodLength)]), { mutation, sourceSettlementOrder: 'passive-first' }), 1)
    parserFixtureRejected(assert, await run(parserFixtureTextActions([parserFixturePadded(badLength)]), { mutation }), boundary)
  })
  /* ADR0038:register:test */ g36CaseTest('L3749', 'registerAdapterParserQueueConformanceTests', 'ADR 0036 Parser causal bound: inbound message cap independent of Foundation dequeue cap', { concurrency: false }, async () => {
    const mutation = { name: 'message-cap6-control', from: '++owner.pipeLedger.messageCount <= 512', to: '++owner.pipeLedger.messageCount <= 6' }
    // Measure the bound immediately after the unchanged raw reply prefix.
    // Later cleanup replies may legitimately exhaust the same message budget.
    const staleReply = '{"id":1,"result":{"targetInfos":[]}}'
    let inclusiveCheckpoints = 0, exclusiveCheckpoints = 0
    const boundary = (owner, messages, violated) => {
      assert.equal(owner.pipeLedger.messageCount, messages)
      assert.equal(owner.pipeLedger.frameCount, messages)
      assert.equal(owner.pipeLedger.decodeCount, messages)
      assert.equal(owner.pipeLedger.scanCount, messages)
      assert.equal(owner.pipeLedger.parseCount, messages)
      assert.equal(owner.pipeLedger.violation, violated)
    }
    const inclusive = await run(parserFixtureTextActions(new Array(3).fill(staleReply)), { mutation,
      assertBeforeCaptureCap(owner) { inclusiveCheckpoints += 1; boundary(owner, 6, false) },
    })
    assert.equal(inclusiveCheckpoints, 1)
    assert.equal(inclusive.owner.activeExchange, null)
    assert.equal(inclusive.owner.waitingDequeueResolver, null)
    assert.equal(inclusive.owner.fifo.length, 0)
    assert.equal(inclusive.owner.fifoMaterialBytes, 0)
    const exclusive = await run(parserFixtureTextActions(new Array(4).fill(staleReply)), { mutation,
      assertBeforeCaptureCap(owner) { exclusiveCheckpoints += 1; boundary(owner, 7, true) },
    })
    assert.equal(exclusiveCheckpoints, 1)
    parserFixtureRejected(assert, exclusive)
    assert.equal(exclusive.owner.pipeLedger.messageCount, 7)
  })
  return { actualMember8192Reachable: false, reason: 'each member consumes a node;4096 nodes dominate8192 members', rawChunk65537Dispatchable: false, reasonChunk: 'normative fixture rejects before invoking producer', inbound512SynchronousReachable: false, reasonInbound: 'FIFO256 and Foundation128 precede512; lower-bound causal production-callsite controls are present' }
}

// These tests use the unmodified loaded Foundation and only the virtual
// capability profile. A mutant changes exactly one named adapter source site.
function registerAdr36ObservationBindingTests({ test, assert, withAdapterCopy, runVirtualAdapterScenario, createSourcePlan }) {
  const profile = 'virtual-runtime-conformance';
  const run = async (mutation, scenario) => withAdapterCopy(profile, mutation, async namespace => {
    const sourcePlan = await createSourcePlan();
    return runVirtualAdapterScenario(namespace, { entry: 'owner', sourcePlan, scenario });
  });
  const completed = result => {
    assert.equal(result.outcome.kind, 'error');
    assert.equal(result.owner.ownerFinalizationCount, 1);
    assert.equal(result.owner.writerCallCount, 0);
    assert.equal(result.owner.cleanupLedger.terminal, true);
    assert.equal(result.owner.waitingDequeueResolver, null);
    assert.equal(result.owner.activeExchange, null);
    assert.equal(result.owner.fifo.length, 0);
  };
  // Every selected marker mutant imports a pristine control, even when the
  // standalone positive tests are filtered out. Identical controls share only
  // this completed assertion result, never a module, Owner or Foundation load.
  let markerControl = null;
  const requireMarkerControl = () => markerControl ??= run(null, 'capture-cap').then(result => {
    completed(result);
    assert.equal(result.owner.notificationCount, 1);
    assert.equal(result.owner.notificationViolation, false);
    assert.notEqual(result.owner.adapterObservationSnapshot, null);
    assert.equal(Object.isFrozen(result.owner.adapterObservationSnapshot), true);
    assert.ok(result.owner.markerSequence < result.owner.firstCleanupSequence);
    assert.equal(result.owner.finalizationCount, 1);
    assert.equal(result.owner.terminalOutcome.evidenceStatus, 'NOT_EVIDENCE');
  });
  for (const scenario of ['capture-cap', 'setup-ready-cancel-reject', 'rejection-quiescence', 'post-o0-setup-cancel']) {
    /* ADR0038:register:test */ g36CaseTest('L3813', 'registerAdr36ObservationBindingTests', `ADR 0036: owned virtual observation-close binding survives ${scenario}`, async () => {
      const result = await run(null, scenario);
      completed(result);
      assert.equal(result.owner.notificationCount, 1);
      assert.equal(result.owner.notificationViolation, false);
      assert.notEqual(result.owner.adapterObservationSnapshot, null);
      assert.equal(Object.isFrozen(result.owner.adapterObservationSnapshot), true);
      assert.ok(result.owner.markerSequence < result.owner.firstCleanupSequence);
      assert.equal(result.owner.finalizationCount, 1);
      assert.equal(result.owner.terminalOutcome.evidenceStatus, 'NOT_EVIDENCE');
      if (scenario === 'setup-ready-cancel-reject' || scenario === 'rejection-quiescence') assert.equal(result.owner.terminalOutcome.observerGate, 'FAIL');
    });
  }
  /* ADR0038:register:test */ g36CaseTest('L3826', 'registerAdr36ObservationBindingTests', 'ADR 0036: prestart has no O0, no marker, no record finalizer', async () => {
    const result = await run(null, 'prestart');
    completed(result);
    assert.equal(result.owner.attemptStarted, false);
    assert.equal(result.owner.notificationCount, 0);
    assert.equal(result.owner.adapterObservationSnapshot, null);
    assert.equal(result.owner.finalizationCount, 0);
  });
  for (const [name, condition, scenario] of [
    ['portless-observation', "intent.kind === 'protocol-command-send' && intent.payload.command === 'Target.getTargets'", 'portless-start'],
    ['portless-cleanup', "intent.kind === 'cleanup-step'", 'portless-cleanup'],
  ]) {
    const mutation = {
      name,
      from: '      return adapterExchange(owner, intent)',
      to: `      const result = adapterExchange(owner, intent)\n      if (${condition}) Object.defineProperty(result, 'invalidFoundationPromiseProfile', { value: true })\n      return result`,
    };
    /* ADR0038:register:test */ g36CaseTest('L3843', 'registerAdr36ObservationBindingTests', `ADR 0036: ${name} retains the original marker through outer cleanup`, async () => {
      const result = await run(mutation, scenario);
      completed(result);
      assert.equal(result.owner.notificationCount, 1);
      assert.equal(result.owner.notificationViolation, false);
      assert.notEqual(result.owner.adapterObservationSnapshot, null);
      assert.ok(result.owner.markerSequence < result.owner.firstCleanupSequence);
      assert.equal(result.owner.finalizationCount, 1);
      assert.equal(result.owner.terminalOutcome.observerGate, 'FAIL');
      assert.equal(result.owner.terminalOutcome.evidenceStatus, 'NOT_EVIDENCE');
    });
  }
  const guardMutants = [
    { name: 'missing-marker', from: '      return adapterObservationClosed(owner)', to: '      return undefined' },
    { name: 'early-marker', from: '    const promise = adapterApply(run, undefined, [])', to: '    adapterObservationClosed(owner)\n    const promise = adapterApply(run, undefined, [])' },
    { name: 'duplicate-marker', from: '      return adapterObservationClosed(owner)', to: '      adapterObservationClosed(owner)\n      return adapterObservationClosed(owner)' },
    { name: 'reentrant-marker', from: '  owner.notificationInvoking = true', to: '  owner.notificationInvoking = true\n  adapterObservationClosed(owner)' },
    { name: 'delayed-marker-fence', from: '      return adapterObservationClosed(owner)', to: '      adapterApply(adapterThen, new AdapterPromise(resolve => resolve(undefined)), [function delayedMarker() { adapterObservationClosed(owner); return undefined }])\n      return undefined' },
  ];
  for (const mutation of guardMutants) {
    /* ADR0038:register:test */ g36CaseTest('L3863', 'registerAdr36ObservationBindingTests', `ADR 0036: ${mutation.name} cannot authorize record finalization`, async () => {
      await requireMarkerControl();
      // Early rejection precedes the first write. All other invalid markers
      // settle Foundation before the outer passive resource cleanup begins.
      const scenario = mutation.name === 'early-marker'
        ? 'first-command-rejected' : 'capture-cap-post-settlement-first';
      const result = await run(mutation, scenario);
      completed(result);
      assert.equal(result.owner.finalizationCount, 0);
      assert.equal(result.owner.terminalOutcome, null);
      assert.equal(result.owner.trackerState, 'TERMINAL_NO_RECORD');
      if (mutation.name !== 'missing-marker') assert.equal(result.owner.notificationViolation, true);
    });
  }
}

// Raw millisecond source operands and raw CDP bytes drive the production Owner.
// Checkpoint callbacks assert existing Owner state only; they install no
// capability, event, resolver, ledger, Foundation result, or alternative state machine.
function registerAdr36DeadlineIntegrationTests({ test, assert, withAdapterCopy, runVirtualAdapterScenario, createSourcePlan }) {
  const fixedClock = (prefix, rest) => [...prefix, ...Array(132 - prefix.length).fill(rest)];
  const run = async (options, mutation = null) => withAdapterCopy('virtual-runtime-conformance', mutation,
    async namespace => runVirtualAdapterScenario(namespace, { entry: 'owner', sourcePlan: await createSourcePlan(), ...options }));
  const terminal = result => {
    assert.equal(result.outcome.kind, 'error');
    assert.equal(result.outcome.error.message, 'browserSyncTransportRuntimeDiagnosticAdapterFailed');
    if (result.owner === null) return;
    assert.equal(result.owner.runState, 'terminal');
    assert.equal(result.owner.ownerFinalizationCount, 1);
    assert.equal(result.owner.writerCallCount, 0);
    assert.equal(result.owner.activeExchange, null);
    assert.equal(result.owner.waitingDequeueResolver, null);
    assert.equal(result.owner.lastDequeuedMaterial, null);
    assert.equal(result.owner.fifo.length, 0);
    assert.equal(result.owner.fifoMaterialBytes, 0);
    assert.equal(result.owner.notificationCount, 1);
  };
  const setupOracle = (result, value) => {
    terminal(result);
    const owner = result.owner;
    const first = owner.clockLedger.find(row => row.reason === 'setup-dequeue-before-reflection');
    assert.equal(owner.setupOrigin, 100);
    assert.equal(owner.terminalOwnershipFacts.caps.setup.deadline, 6100);
    assert.equal(first.milliseconds, value);
    assert.equal(owner.pipeLedger.frameCount, owner.pipeLedger.parseCount);
    assert.ok(owner.pipeLedger.parseCount >= 1, 'the older raw JSON frame passed the actual parser');
    assert.equal(owner.pipeLedger.violation, false);
    if (value < 6100) {
      assert.equal(owner.wireLedger.operations[0].replyCount, 1);
      assert.equal(owner.foundationProjection.observer.targetProfile, 'single-goldendawn-top-level');
      assert.equal(owner.foundationProjection.timing.completion.observationCloseReason, 'capture-cap');
    } else {
      assert.equal(owner.wireLedger.operations[0].replyCount, 0, 'reached raw cap prevents even the adapter correlated-header reads');
      assert.equal(owner.wireLedger.operations[1].intentCount, 0);
      assert.equal(owner.foundationProjection.observer.targetProfile, 'unknown');
      assert.equal(owner.foundationProjection.timing.completion.observationCloseReason, 'setup-cap');
      assert.equal(owner.capLedger.setup.state, 'fired');
    }
  };
  let setupEqualityControlPromise = null;
  const ensureSetupEqualityControl = () => {
    if (setupEqualityControlPromise === null) setupEqualityControlPromise = run({
      scenario: 'setup-deadline-reached', controllerClockValues: fixedClock([100], 6100),
    }).then(result => { setupOracle(result, 6100); }).catch(error => {
      setupEqualityControlPromise = null;
      throw error;
    });
    return setupEqualityControlPromise;
  };
  for (const value of [6099, 6100, 6101]) {
    /* ADR0038:register:test */ g36CaseTest('L3933', 'registerAdr36DeadlineIntegrationTests', `ADR 0036: actual raw Setup frame loses to inclusive deadline at ${value}`, async () => {
      if (value === 6100) await ensureSetupEqualityControl();
      else {
        const result = await run({ scenario: value < 6100 ? 'capture-cap' : 'setup-deadline-reached', controllerClockValues: fixedClock([100], value) });
        setupOracle(result, value);
      }
    });
  }
  /* ADR0038:register:test */ g36CaseTest('L3941', 'registerAdr36DeadlineIntegrationTests', 'ADR 0036: public factory uses the same raw Setup deadline equality path', async () => {
    const result = await run({ entry: 'factory', scenario: 'setup-deadline-reached', controllerClockValues: fixedClock([100], 6100) });
    terminal(result);
    assert.equal(result.owner, null);
    assert.equal(result.fixtureSnapshot.callCounts.pipe.writeDebugPipe, 1);
  });

  const cleanupOracle = (result, offset) => {
    terminal(result);
    const owner = result.owner;
    const origin = owner.clockLedger.find(row => row.reason === 'cleanup-origin');
    const first = owner.clockLedger.find(row => row.reason === 'cleanup-dequeue-before-reflection');
    assert.equal(origin.milliseconds, 150, 'the fixed preceding raw samples establish this cleanup origin');
    assert.equal(first.milliseconds, 60150 + offset);
    assert.equal(owner.terminalOwnershipFacts.caps.cleanup.deadline, 60150);
    assert.equal(owner.pipeLedger.frameCount, owner.pipeLedger.parseCount);
    assert.ok(owner.pipeLedger.parseCount >= 4, 'the cleanup reply exists as a product-parsed older FIFO graph');
    assert.equal(owner.pipeLedger.violation, false);
    if (offset < 0) {
      assert.equal(owner.wireLedger.operations[4].replyCount, 1);
      assert.equal(owner.wireLedger.operations[4].replyState, 'exact');
      assert.equal(owner.foundationProjection.timing.completion.cleanupFinalizeReason, 'all-steps-terminal');
      assert.equal(owner.foundationProjection.cleanup.checks.find(row => row.checkId === 'networkDomainClosed').result, 'confirmed');
    } else {
      assert.equal(owner.wireLedger.operations[4].replyCount, 0);
      assert.equal(owner.wireLedger.operations[4].replyState, 'unobserved');
      assert.equal(owner.foundationProjection.timing.completion.cleanupFinalizeReason, 'cleanup-cap');
      assert.equal(owner.capLedger.cleanup.state, 'fired');
      assert.equal(owner.foundationProjection.cleanup.checks.find(row => row.checkId === 'networkDomainClosed').result, 'unproven');
    }
  };
  for (const offset of [-1, 0, 1]) {
    /* ADR0038:register:test */ g36CaseTest('L3973', 'registerAdr36DeadlineIntegrationTests', `ADR 0036: actual raw Cleanup frame loses to inclusive deadline at offset ${offset}`, async () => {
      const result = await run({ scenario: offset < 0 ? 'capture-cap' : 'cleanup-deadline-reached', controllerClockValues: fixedClock([100, 110, 120, 130, 140, 150], 60150 + offset) });
      cleanupOracle(result, offset);
    });
  }
  /* ADR0038:register:test */ g36CaseTest('L3978', 'registerAdr36DeadlineIntegrationTests', 'ADR 0036: public factory uses the same raw Cleanup deadline equality path', async () => {
    const result = await run({ entry: 'factory', scenario: 'cleanup-deadline-reached', controllerClockValues: fixedClock([100, 110, 120, 130, 140, 150], 60150) });
    terminal(result);
    assert.equal(result.owner, null);
    assert.ok(result.fixtureSnapshot.callCounts.pipe.writeDebugPipe >= 5);
  });

  const fifoMutation = {
    name: 'FIFO_OLDER_PARSED_EVENT_BEATS_REACHED_CAP',
    from: '  const milliseconds = Number(raw / 1000000n)',
    to: "  const milliseconds = reason === 'setup-dequeue-before-reflection' && Number(raw / 1000000n) >= owner.capLedger.setup.deadline ? owner.capLedger.setup.deadline - 1 : Number(raw / 1000000n)",
  };
  /* ADR0038:register:test */ g36CaseTest('L3990', 'registerAdr36DeadlineIntegrationTests', 'ADR 0036: FIFO_OLDER_PARSED_EVENT_BEATS_REACHED_CAP is killed by the same raw equality operand', async () => {
    await ensureSetupEqualityControl();
    const result = await run({ scenario: 'setup-deadline-reached', controllerClockValues: fixedClock([100], 6100) }, fifoMutation);
    terminal(result);
    assert.equal(result.owner.pipeLedger.parseCount >= 1, true);
    assert.throws(() => setupOracle(result, 6100), { name: 'AssertionError' });
    assert.equal(result.owner.wireLedger.operations[0].replyCount, 1, 'the mutant actually let the older parsed response win');
    assert.equal(result.owner.foundationProjection.observer.targetProfile, 'single-goldendawn-top-level');
  });

  const captureMutation = {
    name: 'CAPTURE_NUMERIC_CLOSE_WITHOUT_CAP_FIRED',
    from: '  owner.clockLedger.push({ reason, milliseconds })',
    to: "  owner.clockLedger.push({ reason, milliseconds })\n  if (reason === 'capture-dequeue-before-reflection' && milliseconds >= owner.setupOrigin + 6000 && owner.capLedger.capture.state === 'armed') {\n    adapterExpireCap(owner, owner.capLedger.capture)\n    adapterQueue(owner, adapterFreeze({ kind: 'cap-fired', capKind: 'capture', armIntentId: owner.capLedger.capture.armIntentId }))\n  }",
  };
  const huge = 1000000000;
  const request = new TextEncoder().encode(JSON.stringify({ method: 'Network.requestWillBeSent', sessionId: 'session-adr0036-fixture',
    params: { requestId: 'deadline-options', request: { url: 'http://127.0.0.1:8787/api/sync-test', method: 'OPTIONS' }, timestamp: 10 } }) + '\u0000');
  const pending = (owner, snapshot, expectedReads) => {
    assert.equal(snapshot.callCounts.clock.readControllerNanoseconds, expectedReads);
    assert.equal(snapshot.liveOrdinals.timers.length, 1);
    if (owner === null) return;
    assert.equal(owner.phase, 'capture');
    assert.equal(owner.capLedger.capture.state, 'armed');
    assert.equal(owner.notificationCount, 0);
    assert.equal(owner.adapterObservationSnapshot, null);
    assert.equal(owner.ownerFinalizationCount, 0);
    assert.equal(owner.fifo.length, 0);
    assert.equal(owner.awaitingDequeueClock, false);
    assert.equal(owner.lastDequeuedMaterial, null);
    assert.equal(owner.activeExchange.kind, 'observation-dequeue');
    assert.equal(typeof owner.waitingDequeueResolver, 'function');
  };
  async function captureRun(entry, mutation) {
    let beforeResolver = null;
    let beforeExchange = null;
    let beforeChecks = 0;
    let afterChecks = 0;
    let pendingFailure = null;
    const result = await run({ entry, scenario: 'capture-cap', controllerClockValues: fixedClock([100, 110, 120, 130], huge),
      rawBeforeCaptureCap: pipeOrdinal => [{ kind: 'pipe-chunk', pipeOrdinal, bytes: request }], rawAfterHookMicrotasks: 8,
      assertAtCapturePending(owner, snapshot) {
        pending(owner, snapshot, 4);
        beforeChecks += 1;
        if (owner !== null) { beforeResolver = owner.waitingDequeueResolver; beforeExchange = owner.activeExchange; }
      },
      assertBeforeCaptureCap(owner, snapshot) {
        afterChecks += 1;
        try {
          pending(owner, snapshot, 5);
          if (owner !== null) {
            assert.notEqual(owner.waitingDequeueResolver, beforeResolver, 'the raw producer closed the previous resolver and the Foundation requested the next one');
            assert.notEqual(owner.activeExchange, beforeExchange);
            assert.equal(owner.clockLedger[4].milliseconds, huge);
            assert.equal(owner.clockLedger[4].reason, 'capture-dequeue-before-reflection');
            assert.equal(owner.pipeLedger.parseCount, 4);
          }
        } catch (error) { pendingFailure = error; }
      },
    }, mutation);
    terminal(result);
    assert.equal(beforeChecks, 1);
    assert.equal(afterChecks, 1);
    return { result, pendingFailure };
  }
  const captureControlPromises = new Map();
  const ensureCaptureControl = entry => {
    if (!captureControlPromises.has(entry)) captureControlPromises.set(entry,
      captureRun(entry, null).then(({ result, pendingFailure }) => {
        assert.equal(pendingFailure, null);
        if (result.owner !== null) assert.equal(result.owner.foundationProjection.timing.completion.observationCloseReason, 'capture-cap');
      }).catch(error => {
        captureControlPromises.delete(entry);
        throw error;
      }));
    return captureControlPromises.get(entry);
  };
  for (const entry of ['owner', 'factory']) {
    /* ADR0038:register:test */ g36CaseTest('L4068', 'registerAdr36DeadlineIntegrationTests', `ADR 0036: ${entry} keeps Capture structurally pending at a huge numeric sample until the raw cap event`, async () => {
      await ensureCaptureControl(entry);
    });
  }
  /* ADR0038:register:test */ g36CaseTest('L4072', 'registerAdr36DeadlineIntegrationTests', 'ADR 0036: CAPTURE_NUMERIC_CLOSE_WITHOUT_CAP_FIRED is killed before the fixture fires its timer', async () => {
    await ensureCaptureControl('owner');
    const { pendingFailure } = await captureRun('owner', captureMutation);
    assert.equal(pendingFailure?.name, 'AssertionError');
  });
}

// End-to-end wire assertions inspect the exported productive owner only.
// Every stimulus and resource completion still enters the closed raw fixture.
function registerAdapterWireLifecycleTests({ test, assert, withAdapterCopy, runVirtualAdapterScenario, createSourcePlan }) {
  const profile = 'virtual-runtime-conformance'
  const run = async (scenario, { entry = 'owner', mutation = null, ...options } = {}) => {
    const sourcePlan = await createSourcePlan()
    return withAdapterCopy(profile, mutation, namespace => runVirtualAdapterScenario(namespace, { entry, sourcePlan, scenario, ...options }))
  }
  const terminal = result => {
    assert.equal(result.outcome.kind, 'error')
    assert.equal(Object.getPrototypeOf(result.outcome.error), Error.prototype)
    assert.deepEqual(Reflect.ownKeys(result.outcome.error), ['message'])
    assert.equal(result.outcome.error.message, 'browserSyncTransportRuntimeDiagnosticAdapterFailed')
    if (result.owner !== null) {
      assert.equal(result.owner.runState, 'terminal')
      assert.equal(result.owner.ownerFinalizationCount, 1)
      assert.equal(result.owner.writerCallCount, 0)
      assert.equal(result.owner.cleanupLedger.terminal, true)
      assert.equal(result.owner.activeExchange, null)
      assert.equal(result.owner.waitingDequeueResolver, null)
      assert.equal(result.owner.fifoMaterialBytes, 0)
      if (result.owner.terminalOutcome !== null) assert.equal(result.owner.terminalOutcome.evidenceStatus, 'NOT_EVIDENCE')
    }
  }
  const commandFrames = sourcePlan => {
    const sessionId = 'session-adr0036-fixture'
    return [
      { id: 1, method: 'Target.getTargets', params: {} },
      { id: 2, method: 'Target.attachToTarget', params: { targetId: 'target-adr0036-fixture', flatten: true } },
      { id: 3, method: 'Network.enable', params: {}, sessionId },
      { id: 4, method: 'Runtime.evaluate', params: { expression: g36HarnessEvaluation(sourcePlan), awaitPromise: true, returnByValue: true, generatePreview: false }, sessionId },
      { id: 5, method: 'Network.disable', params: {}, sessionId },
      { id: 6, method: 'Target.detachFromTarget', params: { sessionId } },
    ].map(g36HarnessFrame)
  }
  const wireOracle = (owner, frames) => {
    assert.equal(owner.wireLedger.operations.length, 6)
    owner.wireLedger.operations.forEach((operation, index) => {
      assert.equal(operation.intentCount, 1)
      assert.equal(operation.acceptedFrameCount, 1)
      assert.equal(operation.ackCount, 1)
      assert.equal(operation.frameSha256, g36HarnessHash(frames[index]), 'independent whole-frame hash includes exact key order, parameters and trailing NUL')
    })
    assert.equal(owner.wireLedger.evaluationByteLength, 4259)
    assert.equal(owner.wireLedger.evaluationSha256, 'a623ffafee8dfcbc1d2ddc374cc35f0dbf800defd97619a3b58337d972090f7b')
  }
  const captureCommitOracle = (owner, snapshot) => {
    assert.equal(snapshot.callCounts.pipe.writeDebugPipe, 4)
    assert.equal(snapshot.callCounts.scheduler.armTimer, 2)
    if (owner !== null) {
      assert.equal(owner.capLedger.capture.state, 'armed')
      assert.equal(owner.wireLedger.operations[3].acceptedFrameCount, 1)
      assert.equal(owner.wireLedger.operations[3].ackCount, 1)
      assert.notEqual(owner.captureOrigin, null)
      assert.equal(owner.captureOrigin.commandId, 4)
      assert.equal(owner.captureOrigin.armIntentId, owner.capLedger.capture.armIntentId)
      assert.equal(owner.captureOrigin.generation, owner.capLedger.capture.generation)
      assert.equal(owner.pipeLedger.writePending, true)
    }
  }
  let wireControlPromise = null
  const ensureWireControl = () => {
    if (wireControlPromise === null) wireControlPromise = (async () => {
      const sourcePlan = await createSourcePlan()
      const frames = commandFrames(sourcePlan)
      await withAdapterCopy(profile, null, async namespace => {
        const result = await runVirtualAdapterScenario(namespace, { sourcePlan, scenario: 'capture-cap' })
        terminal(result)
        wireOracle(result.owner, frames)
      })
    })().catch(error => {
      wireControlPromise = null
      throw error
    })
    return wireControlPromise
  }
  /* ADR0038:register:test */ g36CaseTest('L4155', 'registerAdapterWireLifecycleTests', 'ADR 0036 Wire: six actual accepted frames match independent ordered UTF8/NUL bytes', { concurrency: false }, async () => {
    await ensureWireControl()
  })
  for (const mutation of [
    { name: 'WIRE_MEMBER_ORDER_DRIFT', from: '? { id: commandId, method: command, params: projectedParams }', to: '? { method: command, id: commandId, params: projectedParams }' },
    { name: 'WIRE_SAME_LENGTH_METHOD_DRIFT', from: '  const serialized = adapterStringify(wire)', to: '  const serialized = adapterStringify(wire).replace("Target.getTargets", "Target.getTargetx")' },
  ]) /* ADR0038:register:test */ g36CaseTest('L4161', 'registerAdapterWireLifecycleTests', `ADR 0036 Wire: independent frame oracle kills ${mutation.name}`, { concurrency: false }, async () => {
    await ensureWireControl()
    const sourcePlan = await createSourcePlan()
    const frames = commandFrames(sourcePlan)
    await withAdapterCopy(profile, mutation, async namespace => {
      const result = await runVirtualAdapterScenario(namespace, { sourcePlan, scenario: 'capture-cap' })
      terminal(result)
      assert.equal(result.fixtureSnapshot.callCounts.pipe.writeDebugPipe, 6)
      assert.throws(() => wireOracle(result.owner, frames), assert.AssertionError)
    })
  })
  for (const entry of ['owner', 'factory']) {
    /* ADR0038:register:test */ g36CaseTest('L4173', 'registerAdapterWireLifecycleTests', `ADR 0036 K2: ${entry} productive pending dequeue resolves once from one raw turn`, { concurrency: false }, async () => {
      let pendingExchange = null, pendingResolver = null, pendingClockReads = null
      let pendingAsserted = 0, resumedAsserted = 0
      const result = await run('capture-cap', {
        entry,
        assertAtEvaluateWriteReturn: captureCommitOracle,
        rawBeforeCaptureCap: pipeOrdinal => [{ kind: 'pipe-chunk', pipeOrdinal, bytes: g36HarnessFrame({
          method: 'Network.requestWillBeSent', sessionId: 'session-adr0036-fixture', params: {
            requestId: 'wire-pending-options', request: { url: 'http://127.0.0.1:8787/api/sync-test', method: 'OPTIONS' }, timestamp: 10,
          },
        }) }],
        rawAfterHookMicrotasks: 32,
        assertAtCapturePending(owner, snapshot) {
          pendingAsserted += 1
          pendingClockReads = snapshot.callCounts.clock.readControllerNanoseconds
          assert.equal(snapshot.callCounts.pipe.writeDebugPipe, 4)
          assert.equal(snapshot.callCounts.scheduler.armTimer, 2)
          if (owner !== null) {
            assert.equal(owner.phase, 'capture')
            assert.equal(owner.fifo.length, 0)
            assert.notEqual(owner.activeExchange, null)
            assert.notEqual(owner.waitingDequeueResolver, null)
            assert.equal(owner.awaitingDequeueClock, false)
            assert.equal(owner.notificationCount, 0)
            assert.equal(owner.capLedger.capture.state, 'armed')
            assert.equal(owner.wireLedger.operations[3].acceptedFrameCount, 1)
            assert.equal(owner.wireLedger.operations[3].ackCount, 1)
            assert.equal(owner.captureOrigin.commandId, 4)
            pendingExchange = owner.activeExchange
            pendingResolver = owner.waitingDequeueResolver
          }
        },
        assertBeforeCaptureCap(owner, snapshot) {
          resumedAsserted += 1
          assert.equal(snapshot.callCounts.clock.readControllerNanoseconds, pendingClockReads + 1)
          if (owner !== null) {
            assert.notEqual(owner.activeExchange, pendingExchange)
            assert.notEqual(owner.waitingDequeueResolver, pendingResolver)
            assert.notEqual(owner.activeExchange, null)
            assert.notEqual(owner.waitingDequeueResolver, null)
            assert.equal(pendingExchange.resolve, null)
            assert.equal(pendingExchange.reject, null)
            assert.equal(owner.fifo.length, 0)
            assert.equal(owner.notificationCount, 0)
            assert.equal(owner.phase, 'capture')
            assert.equal(owner.clockLedger.at(-1).reason, 'capture-dequeue-before-reflection')
          }
        },
      })
      terminal(result)
      assert.equal(pendingAsserted, 1)
      assert.equal(resumedAsserted, 1)
      assert.equal(result.fixtureSnapshot.callCounts.pipe.writeDebugPipe, 6)
    })
    /* ADR0038:register:test */ g36CaseTest('L4227', 'registerAdapterWireLifecycleTests', `ADR 0036 K2: ${entry} partial Gateway creation ends on pending resource cleanup cap`, { concurrency: false }, async () => {
      const result = await run('partial-gateway', { entry })
      terminal(result)
      const counts = result.fixtureSnapshot.callCounts
      assert.equal(counts.launcher.spawnChild, 2)
      assert.equal(counts.launcher.terminateChild, 1)
      assert.equal(counts.launcher.closeChild, 1)
      assert.equal(counts.pipe.openDebugPipe, 0)
      assert.equal(counts.pipe.writeDebugPipe, 0)
      assert.equal(result.fixtureSnapshot.liveOrdinals.resourceOperations.length, 2)
      if (result.owner !== null) {
        assert.equal(result.owner.attemptStarted, false)
        assert.equal(result.owner.notificationCount, 0)
        assert.equal(result.owner.finalizationCount, 0)
        assert.equal(result.owner.childLedger.vite.creation, 'may-have-started')
        assert.equal(result.owner.childLedger.vite.handle, null)
        assert.equal(result.owner.terminalOwnershipFacts.resources.find(resource => resource.name === 'vite').boundCount, 1)
        assert.equal(result.owner.childLedger.gateway.creation, 'may-have-started')
        assert.equal(result.owner.childLedger.gateway.handle, null)
        assert.equal(result.owner.childLedger.chrome.creation, 'never-attempted')
        assert.equal(result.owner.resourceLedger.profile.creation, 'may-exist')
        assert.equal(result.owner.resourceLedger.profile.handle, null)
        assert.equal(result.owner.cleanupLedger.steps.get('browserStopped').result, 'confirmed')
        for (const id of ['devServerStopped', 'gatewayStopped', 'profileRemoved', 'harnessFragmentsRemoved']) assert.equal(result.owner.cleanupLedger.steps.get(id).result, 'unproven')
        assert.equal(result.owner.cleanupLedger.finalizeReason, 'cleanup-cap')
      }
    })
    /* ADR0038:register:test */ g36CaseTest('L4254', 'registerAdapterWireLifecycleTests', `ADR 0036 K2: ${entry} completed concurrent profile is still closed after Gateway failure`, { concurrency: false }, async () => {
      const result = await run('partial-profile-completed', { entry })
      terminal(result)
      assert.equal(result.fixtureSnapshot.callCounts.launcher.spawnChild, 2)
      assert.equal(result.fixtureSnapshot.callCounts.launcher.terminateChild, 1)
      assert.equal(result.fixtureSnapshot.callCounts.launcher.closeChild, 1)
      assert.equal(result.fixtureSnapshot.callCounts.pipe.openDebugPipe, 0)
      assert.equal(result.fixtureSnapshot.callCounts.pipe.writeDebugPipe, 0)
      assert.deepEqual(result.fixtureSnapshot.liveOrdinals.resources, [])
      assert.deepEqual(result.fixtureSnapshot.liveOrdinals.resourceOperations, [])
      if (result.owner !== null) {
        assert.equal(result.owner.attemptStarted, false)
        assert.equal(result.owner.notificationCount, 0)
        assert.equal(result.owner.finalizationCount, 0)
        assert.equal(result.owner.resourceLedger.profile.handle, null)
        assert.equal(result.owner.resourceLedger.handles.size, 0)
        for (const name of ['profile', 'harness']) {
          const resource = result.owner.terminalOwnershipFacts.resources.find(resource => resource.name === name)
          assert.equal(resource.boundCount, 1)
          assert.equal(resource.terminalCount, 0)
          assert.equal(resource.activeAfterCleanupCount, 0)
          assert.equal(result.owner.terminalOwnershipFacts[`${name}ResourceState`], 'closed')
        }
        assert.ok(result.owner.terminalOwnershipFacts.sourceResourceCount > 0)
        assert.equal(result.owner.terminalOwnershipFacts.sourceResourceCount, result.owner.terminalOwnershipFacts.sourceResourceClosedCount)
        assert.equal(result.owner.terminalOwnershipFacts.sourceResourceUnknownCount, 0)
      }
    })
    for (const scenario of ['evaluate-partial-write', 'evaluate-write-throw', 'evaluate-timer-throw']) {
      /* ADR0038:register:test */ g36CaseTest('L4283', 'registerAdapterWireLifecycleTests', `ADR 0036 Capture commit: ${entry}/${scenario} has no successful Evaluate acknowledgement`, { concurrency: false }, async () => {
        const result = await run(scenario, { entry })
        terminal(result)
        assert.ok(result.fixtureSnapshot.callCounts.pipe.writeDebugPipe >= 4)
        if (result.owner !== null) {
          const evaluate = result.owner.wireLedger.operations[3]
          assert.equal(evaluate.intentCount, 1)
          assert.equal(evaluate.acceptedFrameCount, scenario === 'evaluate-timer-throw' ? 1 : 0)
          assert.equal(evaluate.ackCount, 0)
          assert.equal(evaluate.sendUnknown, true)
          assert.equal(result.owner.captureOrigin, null)
          if (scenario === 'evaluate-timer-throw') assert.equal(result.owner.capLedger.capture.state, 'activation-unknown')
        }
      })
    }
  }
  let captureCommitControlPromise = null
  const ensureCaptureCommitControl = () => {
    if (captureCommitControlPromise === null) captureCommitControlPromise = (async () => {
      let reached = 0
      const result = await run('capture-cap', {
        assertAtEvaluateWriteReturn(owner, snapshot) {
          reached += 1
          captureCommitOracle(owner, snapshot)
        },
      })
      terminal(result)
      assert.equal(reached, 1)
    })().catch(error => {
      captureCommitControlPromise = null
      throw error
    })
    return captureCommitControlPromise
  }
  for (const mutation of [
    {
      name: 'CAPTURE_TIMER_BEFORE_DELAYED_LEDGER_COMMIT',
      from: '      owner.captureOrigin = { commandId, armIntentId: cap.armIntentId, generation: cap.generation }',
      to: '      adapterApply(adapterThen, new AdapterPromise(resolve => resolve(undefined)), [function delayedCaptureLedgerCommit() { owner.captureOrigin = { commandId, armIntentId: cap.armIntentId, generation: cap.generation }; return undefined }])',
    },
    {
      name: 'CAPTURE_COMMIT_BEFORE_DELAYED_ACK',
      from: "      operation.ackCount += 1\n      return adapterFreeze({ kind: 'protocol-command-send-result', commandId, sendState: 'sent-and-capture-cap-started' })",
      to: "      adapterApply(adapterThen, new AdapterPromise(resolve => resolve(undefined)), [function delayedCaptureAcknowledgement() { operation.ackCount += 1; return undefined }])\n      return adapterFreeze({ kind: 'protocol-command-send-result', commandId, sendState: 'sent-and-capture-cap-started' })",
    },
  ]) /* ADR0038:register:test */ g36CaseTest('L4328', 'registerAdapterWireLifecycleTests', `ADR 0036 Capture commit: ${mutation.name} is detected at the raw write return`, { concurrency: false }, async () => {
    await ensureCaptureCommitControl()
    let reached = 0, detected = 0
    const result = await run('capture-cap', {
      mutation,
      assertAtEvaluateWriteReturn(owner, snapshot) {
        reached += 1
        try { captureCommitOracle(owner, snapshot) }
        catch (error) {
          assert.equal(error.name, 'AssertionError')
          detected += 1
        }
      },
    })
    terminal(result)
    assert.equal(reached, 1)
    assert.equal(detected, 1)
  })
  for (const [scenario, expectedWrites, failed] of [
    ['first-write-backpressure', 1, true], ['first-write-drain', 6, false],
    ['first-write-pending', 1, true], ['first-write-error', 1, true],
    ['stdout-cap', 6, false], ['stdout-over-cap', 0, true],
    ['stderr-cap', 6, false], ['stderr-over-cap', 0, true],
  ]) /* ADR0038:register:test */ g36CaseTest('L4351', 'registerAdapterWireLifecycleTests', `ADR 0036 Wire lifecycle: ${scenario}`, { concurrency: false }, async () => {
    let overflowAsserted = 0
    const outputOverflow = scenario === 'stdout-over-cap' || scenario === 'stderr-over-cap'
    const result = await run(scenario, {
      assertAfterOutputOverflow: outputOverflow ? (owner, snapshot) => {
        overflowAsserted += 1
        const stream = scenario.startsWith('stdout') ? 'stdout' : 'stderr'
        assert.equal(owner.childLedger.chrome[`${stream}Count`], 65537)
        assert.equal(owner.childLedger.chrome.outputOverflow, true)
        assert.equal(owner.hardViolation, true)
        assert.equal(snapshot.callCounts.pipe.writeDebugPipe, 0)
        assert.equal(owner.wireLedger.operations.every(operation => operation.acceptedFrameCount === 0), true)
        assert.equal(owner.notificationCount, 0)
        assert.equal(owner.terminalOutcome, null)
      } : null,
    })
    terminal(result)
    assert.equal(result.fixtureSnapshot.callCounts.pipe.writeDebugPipe, expectedWrites)
    assert.equal(result.owner.pipeLedger.writePending, false)
    if (outputOverflow) assert.equal(overflowAsserted, 1)
    if (failed && (!outputOverflow || result.owner.terminalOutcome !== null)) assert.equal(result.owner.terminalOutcome?.observerGate, 'FAIL')
    if (scenario.startsWith('stdout') || scenario.startsWith('stderr')) {
      const stream = scenario.startsWith('stdout') ? 'stdout' : 'stderr'
      assert.equal(result.owner.childLedger.chrome[`${stream}Count`], failed ? 65537 : 65536)
      assert.equal(result.owner.childLedger.chrome.outputOverflow, failed)
    }
  })
  for (const length of [65536, 65537]) {
    const mutation = {
      name: `OUTBOUND_FRAME_${length}`,
      from: '  const serialized = adapterStringify(wire)',
      to: `  const originalSerialized = adapterStringify(wire)\n  const serialized = command === 'Target.getTargets' ? originalSerialized + ' '.repeat(${length} - new AdapterTextEncoder().encode(originalSerialized).length - 1) : originalSerialized`,
    }
    /* ADR0038:register:test */ g36CaseTest('L4384', 'registerAdapterWireLifecycleTests', `ADR 0036 Wire: complete serialized frame ${length} bytes meets exact output guard`, { concurrency: false }, async () => {
      // The raw fixture still offers only the ordinary command length. At the
      // inclusive bound this is a real partial write; over the bound the raw
      // write capability must remain untouched.
      const result = await run('rejection-quiescence', { mutation })
      terminal(result)
      assert.equal(result.fixtureSnapshot.callCounts.pipe.writeDebugPipe, length === 65536 ? 1 : 0)
      assert.equal(result.owner.wireLedger.operations[0].ackCount, 0)
    })
  }
}

// Each mutant changes one exact product-used source site inside the unchanged
// four-export derivation profile. Inputs are independent closed pure fixtures;
// no private identity registration or actual runtime evidence is fabricated.
function registerAdr36RecordMutationTests({ test, assert, withAdapterCopy, freeze, makeRecordPair = makeAdr36RecordPairFixture }) {
  const expected = gate => ({ evidenceStatus: 'NOT_EVIDENCE', observerGate: gate,
    finding: gate === 'FAIL' ? 'observer-invalid' : 'inconclusive', runtimeRecord: null });
  const finalizeOperation = change => api => {
    const input = makeRecordPair();
    if (change) change(input);
    freeze(input);
    const before = JSON.stringify(input);
    const value = api.finalizeBrowserSyncTransportRuntimeDiagnosticRecord(input);
    assert.equal(JSON.stringify(input), before, 'the original closed F and adapter input remain unchanged');
    return value;
  };
  const findingInput = (stimulusCount = 'one', candidateObserverGate = 'FAIL') => freeze({ candidateObserverGate,
    replayResult: 'EQUIVALENT', stimulusCount, requestSequence: 'OPTIONS-204-POST-200-loadingFinished',
    settlementOutcome: 'static-redacted-rejection', settlementStaticProfileResult: 'match' });
  function causal(mutation, operation, oracle) {
    /* ADR0038:register:test */ g36CaseTest('L4415', 'registerAdr36RecordMutationTests', `ADR 0036 record causal mutant: ${mutation.name}`, async () => {
      let baselineValue;
      await withAdapterCopy('derivation-conformance', null, api => { baselineValue = operation(api); oracle(baselineValue); });
      let entered = false;
      let returned = false;
      await assert.rejects(() => withAdapterCopy('derivation-conformance', mutation, api => {
        entered = true;
        const value = operation(api);
        returned = true;
        oracle(value);
      }), { name: 'AssertionError' });
      assert.equal(entered, true, 'the named mutant imported with exactly the expected four exports');
      assert.equal(returned, true, 'the actual product helper returned before its behavioral oracle rejected it');
    });
  }

  causal({ name: 'RECORD_UNPROVEN_BEFORE_CONFIRMED_FAIL',
    from: "  if (value.hardViolation) return 'FAIL';",
    to: "  if (value.proofIncomplete) return 'UNPROVEN';\n  if (value.hardViolation) return 'FAIL';" },
  api => api.deriveBrowserSyncTransportRuntimeDiagnosticRecordGate(freeze({ hardViolation: true, proofIncomplete: true })), value => assert.equal(value, 'FAIL'));
  causal({ name: 'RECORD_EVIDENCE_DEMOTION_BEFORE_VIOLATION',
    from: "  if (value.hardViolation) return 'FAIL';",
    to: "  if (adapterEvidenceEligible !== true) return 'UNPROVEN';\n  if (value.hardViolation) return 'FAIL';" },
  api => api.deriveBrowserSyncTransportRuntimeDiagnosticRecordGate(freeze({ hardViolation: true, proofIncomplete: false })), value => assert.equal(value, 'FAIL'));
  for (const stimulus of ['zero', 'multiple', 'unknown']) causal({ name: `RECORD_OBSERVER_INVALID_REQUIRES_ONE_${stimulus.toUpperCase()}`,
    from: "  if (value.candidateObserverGate === 'FAIL') return 'observer-invalid';",
    to: "  if (value.stimulusCount !== 'one') return 'inconclusive';\n  if (value.candidateObserverGate === 'FAIL') return 'observer-invalid';" },
  api => api.deriveBrowserSyncTransportRuntimeDiagnosticRecordFinding(findingInput(stimulus)), value => assert.equal(value, 'observer-invalid'));
  causal({ name: 'RECORD_PRODUCT_FINDING_WITHOUT_EXACTLY_ONE_STIMULUS',
    from: "  if (value.candidateObserverGate === 'UNPROVEN' || value.replayResult !== 'EQUIVALENT' || value.stimulusCount !== 'one') return 'inconclusive';",
    to: "  if (value.candidateObserverGate === 'UNPROVEN' || value.replayResult !== 'EQUIVALENT') return 'inconclusive';" },
  api => api.deriveBrowserSyncTransportRuntimeDiagnosticRecordFinding(findingInput('zero', 'PASS')), value => assert.equal(value, 'inconclusive'));

  const gateLine = '  const gate = deriveBrowserSyncTransportRuntimeDiagnosticRecordGate(adr36RecordDeepFreeze({ hardViolation, proofIncomplete }));';
  const failedSource = finalizeOperation(input => { input.adapterLedger.sources.mismatchCount = 1; });
  causal({ name: 'RECORD_GATE_COPIED_FROM_FOUNDATION_PLACEHOLDER', from: gateLine, to: '  const gate = f.candidateObserverGate;' },
    failedSource, value => assert.deepEqual(value, expected('FAIL')));
  causal({ name: 'RECORD_FINALIZER_DEMOTION_BEFORE_VIOLATION', from: gateLine,
    to: "  const gate = adapterEvidenceEligible !== true ? 'UNPROVEN' : deriveBrowserSyncTransportRuntimeDiagnosticRecordGate(adr36RecordDeepFreeze({ hardViolation, proofIncomplete }));" },
    failedSource, value => assert.deepEqual(value, expected('FAIL')));
  causal({ name: 'RECORD_FINDING_COPIED_FROM_FOUNDATION_PLACEHOLDER',
    from: '  const finding = deriveBrowserSyncTransportRuntimeDiagnosticRecordFinding(adr36RecordDeepFreeze({ candidateObserverGate: gate, replayResult: f.replay.equivalence.result, stimulusCount: stimulus, requestSequence: budget.sequence, settlementOutcome, settlementStaticProfileResult }));',
    to: '  const finding = f.candidateFinding;' }, failedSource, value => assert.deepEqual(value, expected('FAIL')));
  causal({ name: 'RECORD_STICKY_FOUNDATION_FAIL_DROPPED',
    from: "  let hardViolation = f.candidateObserverGate === 'FAIL' || f.cleanup.result === 'FAIL' || c.violationCount > 0 || p.violationCount > 0;",
    to: '  let hardViolation = c.violationCount > 0 || p.violationCount > 0;' },
    finalizeOperation(input => { input.foundationProjection.cleanup.result = 'FAIL'; input.foundationProjection.candidateObserverGate = 'FAIL'; input.foundationProjection.candidateFinding = 'observer-invalid'; }),
    value => assert.deepEqual(value, expected('FAIL')));

  const ledgerLine = '  const s = a.sources, p = a.parser, n = a.network, d = a.output, c = a.completion;';
  causal({ name: 'RECORD_FOUNDATION_HASH_COPIED_FROM_NULL_PLACEHOLDER', from: ledgerLine,
    to: '  const s = { ...a.sources, foundationSha256: f.observer.foundationSha256, loadedFoundationSha256: f.observer.foundationSha256, commitFoundationSha256: f.observer.foundationSha256 }, p = a.parser, n = a.network, d = a.output, c = a.completion;' },
    finalizeOperation(input => { input.adapterLedger.sources.foundationSha256 = '0'.repeat(64); }), value => assert.deepEqual(value, expected('FAIL')));
  causal({ name: 'RECORD_EVALUATION_HASH_COPIED_FROM_NULL_PLACEHOLDER', from: ledgerLine,
    to: '  const s = a.sources, p = a.parser, n = { ...a.network, acceptedEvaluationSha256: f.observer.evaluationSha256 }, d = a.output, c = a.completion;' },
    finalizeOperation(input => { input.adapterLedger.network.acceptedEvaluationSha256 = '0'.repeat(64); }), value => assert.deepEqual(value, expected('FAIL')));
  causal({ name: 'RECORD_CONTROLLER_EXCLUSIVITY_COPIED_FROM_UNKNOWN_PLACEHOLDER',
    from: '  const capabilitiesBad = s.capabilitySelectionCount > 1 || s.ownerCount > 1 || s.dispatcherCount > 1 || s.extraCapabilityCount > 0;',
    to: "  const capabilitiesBad = f.observer.controllerExclusivity === 'not-exclusive';" },
    finalizeOperation(input => { input.adapterLedger.sources.extraCapabilityCount = 1; }), value => assert.deepEqual(value, expected('FAIL')));
  causal({ name: 'RECORD_CONNECTION_PROFILE_COPIED_FROM_UNKNOWN_PLACEHOLDER',
    from: '  const pipeBad = p.pipeOpenCount > 1 || p.pipeReadOwnerCount > 1 || p.pipeWriteOwnerCount > 1 || p.debugPortArgumentCount > 0;',
    to: "  const pipeBad = f.observer.connectionProfile === 'other-prohibited';" },
    finalizeOperation(input => { input.adapterLedger.parser.pipeOpenCount = 2; }), value => assert.deepEqual(value, expected('FAIL')));
  causal({ name: 'RECORD_PROTOCOL_OPERATIONS_COPIED_FROM_FOUNDATION_PLACEHOLDER',
    from: '    const w = a.wire[i];',
    to: "    const w = { ...a.wire[i], profileMatch: f.observer.protocolOperations[i].result !== 'mismatch' };" },
    finalizeOperation(input => { input.adapterLedger.wire[0].profileMatch = false; }), value => assert.deepEqual(value, expected('FAIL')));
  causal({ name: 'RECORD_REQUEST_BUDGET_COPIED_FROM_FOUNDATION_ZERO_PLACEHOLDER', from: ledgerLine,
    to: "  const s = a.sources, p = a.parser, n = { ...a.network, observerRequestCount: f.requestBudget.observerProductEndpointRequests === 'zero' ? 0 : 1 }, d = a.output, c = a.completion;" },
    finalizeOperation(input => { input.adapterLedger.network.observerRequestCount = 1; }), value => assert.deepEqual(value, expected('FAIL')));
  causal({ name: 'RECORD_INTEGRITY_AGGREGATE_COPIED_FROM_FOUNDATION_PLACEHOLDER',
    from: "if (bad) hardViolation = true; if (result !== 'confirmed') proofIncomplete = true;",
    to: "if (f.observer.interferenceObservation === 'contract-visible-detected') hardViolation = true; if (result !== 'confirmed') proofIncomplete = true;" },
    finalizeOperation(input => { input.adapterLedger.sources.profilerTracingOperationCount = 1; }), value => assert.deepEqual(value, expected('FAIL')));
  causal({ name: 'RECORD_CLEANUP_AGGREGATE_COPIED_FROM_FOUNDATION_PLACEHOLDER',
    from: "if (result === 'failed') hardViolation = true; if (checks[index].result !== 'confirmed') proofIncomplete = true;",
    to: "if (f.cleanup.result === 'FAIL') hardViolation = true; if (checks[index].result !== 'confirmed') proofIncomplete = true;" },
    finalizeOperation(input => { input.adapterLedger.resources[1].failureCount = 1; }), value => assert.deepEqual(value, expected('FAIL')));
  causal({ name: 'RECORD_PREMATURE_FOUNDATION_PROJECTION_RETURNED_AS_RUNTIME_RECORD',
    from: "  if (adapterEvidenceEligible !== true || !authentic || !markerValid || c.terminalState !== 'terminal') return adr36RecordDeepFreeze({ evidenceStatus: 'NOT_EVIDENCE', observerGate: gate, finding, runtimeRecord: null });",
    to: "  if (adapterEvidenceEligible !== true || !authentic || !markerValid || c.terminalState !== 'terminal') return adr36RecordDeepFreeze({ evidenceStatus: 'NOT_EVIDENCE', observerGate: gate, finding, runtimeRecord: f });" },
    finalizeOperation(), value => assert.deepEqual(value, expected('UNPROVEN')));

  // A confirmed second pipe is a negative fact, not an invented positive
  // resource attestation. Run this control before modifying its production join.
  /* ADR0038:register:test */ g36CaseTest('L4501', 'registerAdr36RecordMutationTests', 'ADR 0036 record counterprobe: confirmed second pipe must remain FAIL without runtime authority', async () => {
    await withAdapterCopy('derivation-conformance', null, api => {
      const value = finalizeOperation(input => { input.adapterLedger.parser.pipeOpenCount = 2; })(api);
      assert.deepEqual(value, expected('FAIL'));
    });
  });
}

// Bytes are exercised through coherent virtual capabilities and full Owners.
// Faulty shapes cannot pass the fixture grammar; adapter-copy fault specimens
// therefore alter exactly the first entropy callsite before the existing byte guard.
function registerAdapterByteBoundaryTests({ test, assert, withAdapterCopy, runVirtualAdapterScenario, loadSourceFixtureFiles, createVirtualRuntimeFixture }) {
  let filesPromise = null, controlPromise = null
  const files = () => filesPromise ??= Promise.resolve().then(loadSourceFixtureFiles)
  const entropyCall = "adapterInvoke(owner, 'entropy', 'readDiagnosticRunIdEntropyBytes', [])"
  const entropyLine = 'const runEntropy = adapterCopyBytes(' + entropyCall + ', 17, 17)'
  const cases = [
    ['Int8Array positive bytes with Uint8Array prototype', 'Object.setPrototypeOf(new Int8Array(17).fill(17), Uint8Array.prototype)'],
    ['Int8Array negative bytes with Uint8Array prototype', 'Object.setPrototypeOf(new Int8Array(17).fill(-1), Uint8Array.prototype)'],
    ['Uint8ClampedArray with Uint8Array prototype', 'Object.setPrototypeOf(new Uint8ClampedArray(17).fill(17), Uint8Array.prototype)'],
    ['DataView with Uint8Array prototype', 'Object.setPrototypeOf(new DataView(new ArrayBuffer(17)), Uint8Array.prototype)'],
    ['prototype-only fake', 'Object.create(Uint8Array.prototype)'],
    ['Buffer subclass', 'Buffer.alloc(17, 17)'],
    ['nonzero offset', 'new Uint8Array(new ArrayBuffer(18), 1, 17)'],
    ['larger backing allocation', 'new Uint8Array(new ArrayBuffer(18), 0, 17)'],
    ['resizable backing', 'new Uint8Array(new ArrayBuffer(17, { maxByteLength: 18 }))'],
    ['shared backing', 'new Uint8Array(new SharedArrayBuffer(17))'],
    ['re-prototyped shared backing', 'new Uint8Array(Object.setPrototypeOf(new SharedArrayBuffer(17), ArrayBuffer.prototype))'],
    ['extra own string', "Object.defineProperty(value, 'extra', { value: 1 })"],
    ['extra own symbol', "Object.defineProperty(value, Symbol('extra'), { value: 1 })"],
    ['shadow buffer getter', "Object.defineProperty(value, 'buffer', { get() { throw new Error('foreign-byte-getter'); } })"],
    ['shadow tag getter', "Object.defineProperty(value, Symbol.toStringTag, { get() { throw new Error('foreign-byte-tag'); } })"],
    ['Proxy wrapper', "new Proxy(value, { get() { throw new Error('foreign-byte-proxy'); } })"],
    ['detached nonempty source', '(() => { structuredClone(value.buffer, { transfer: [value.buffer] }); return value })()'],
    ['wrong exact length', 'new Uint8Array(16)'],
  ]
  async function run({ mutation = null, entry = 'owner', extraEmptyFile = false, assertAfterReadiness = null } = {}) {
    const input = new Map(await files())
    if (extraEmptyFile) input.set('zz-byte-boundary-empty.txt', new Uint8Array(0))
    const plan = createAdapterSourceFixturePlan(input)
    let imported = false, result
    await withAdapterCopy('virtual-runtime-conformance', mutation, async namespace => {
      imported = true
      result = await runVirtualAdapterScenario(namespace, { entry, sourcePlan: plan, scenario: 'capture-cap', assertAfterReadiness })
    })
    assert.equal(imported, true, 'a byte specimen must import and execute the productive owner')
    sourceFixtureError(assert, result.outcome)
    return { result, plan }
  }
  function complete(result, entry = 'owner') {
    assert.equal(result.fixtureSnapshot.callCounts.launcher.spawnChild, 3)
    assert.equal(result.fixtureSnapshot.callCounts.pipe.writeDebugPipe, 6)
    if (entry === 'factory') { assert.equal(result.owner, null); return }
    assert.notEqual(result.owner.foundationProjection, null)
    assert.equal(result.owner.notificationCount, 1)
    assert.equal(result.owner.finalizationCount, 1)
    assert.equal(result.owner.writerCallCount, 0)
  }
  const control = () => controlPromise ??= run().then(value => { complete(value.result); return value })
  for (const entry of ['owner', 'factory']) /* ADR0038:register:test */ g36CaseTest('L4560', 'registerAdapterByteBoundaryTests', 'ADR 0036 Byte boundary: ordinary Uint8Array through ' + entry, { concurrency: false }, async () => {
    const { result, plan } = entry === 'owner' ? await control() : await run({ entry })
    complete(result, entry)
    assert.equal(result.completedSourceEntries, plan.preflight.length)
  })
  for (const [name, expression] of cases) /* ADR0038:register:test */ g36CaseTest('L4565', 'registerAdapterByteBoundaryTests', 'ADR 0036 Byte boundary: reject ' + name + ' before external effects', { concurrency: false }, async () => {
    await control()
    const mutation = { name: 'entropy-byte-specimen-' + name.replaceAll(' ', '-'), from: entropyLine,
      to: 'const runEntropy = adapterCopyBytes((value => ' + expression + ')(' + entropyCall + '), 17, 17)' }
    const { result } = await run({ mutation })
    const counts = result.fixtureSnapshot.callCounts
    assert.equal(result.completedSourceEntries, 0)
    assert.equal(counts.entropy.readDiagnosticRunIdEntropyBytes, 1)
    assert.equal(counts.entropy.readReplayContextIdEntropyBytes, 0)
    for (const domain of ['clock', 'runtime', 'scheduler', 'pipe', 'launcher', 'resources']) assert.ok(Object.values(counts[domain]).every(value => value === 0), 'invalid first entropy must stop before ' + domain)
    assert.equal(result.owner.r0, null)
    assert.equal(result.owner.sourceState, null)
    assert.equal(result.owner.writerCallCount, 0)
    assert.equal(result.owner.ownerFinalizationCount, 1)
  })
  /* ADR0038:register:test */ g36CaseTest('L4580', 'registerAdapterByteBoundaryTests', 'ADR 0036 Byte boundary: detached zero-length resource differs from valid empty resource', { concurrency: false }, async () => {
    const baseline = await run({ extraEmptyFile: true })
    complete(baseline.result)
    assert.equal(baseline.result.completedSourceEntries, baseline.plan.preflight.length)
    const anchor = 'adapterCopyBytes(bytes, operation.input.maximumByteLength)'
    const mutation = { name: 'detached-zero-resource-specimen', from: anchor,
      to: "adapterCopyBytes((value => { if (value.byteLength === 0) structuredClone(value.buffer, { transfer: [value.buffer] }); return value })(bytes), operation.input.maximumByteLength)" }
    const changed = await run({ mutation, extraEmptyFile: true })
    const zeroPath = sourceFixturePath.join(changed.plan.repositoryRoot, 'zz-byte-boundary-empty.txt')
    const zeroRead = changed.plan.preflight.findIndex(entry => entry.kind === 'read-resource' && entry.path === zeroPath)
    assert.ok(zeroRead >= 0)
    assert.equal(changed.result.completedSourceEntries, zeroRead + 1, 'zero byte detachment must fail at the resource byte boundary')
    assert.equal(changed.result.fixtureSnapshot.callCounts.launcher.spawnChild, 0)
    assert.equal(changed.result.owner.writerCallCount, 0)
  })
  const referenceBase32 = (length, byte, bits) => {
    const bitString = new Array(length).fill(byte.toString(2).padStart(8, '0')).join('').slice(0, bits)
    return bitString.match(/.{5}/g).map(group => 'abcdefghijklmnopqrstuvwxyz234567'[Number.parseInt(group, 2)]).join('')
  }
  /* ADR0038:register:test */ g36CaseTest('L4599', 'registerAdapterByteBoundaryTests', 'ADR 0036 Byte boundary: mutating the supplied backing after copy cannot change bound entropy', { concurrency: false }, async () => {
    await control()
    const wrapper = returnValue => 'const runEntropy = (value => { const owned = adapterCopyBytes(value, 17, 17); value[0] = value[0] ^ 255; return ' + returnValue + ' })(' + entropyCall + ')'
    const expected = 'diag-' + referenceBase32(17, 17, 130)
    const expectedReplay = 'replay-' + referenceBase32(15, 29, 120)
    let safeAssertions = 0, aliasAssertions = 0
    const safe = await run({ mutation: { name: 'entropy-copy-alias-control', from: entropyLine, to: wrapper('owned') }, assertAfterReadiness(owner) {
      assert.equal(owner.r0.diagnosticRunId, expected)
      assert.equal(owner.r0.replayContextId, expectedReplay)
      safeAssertions += 1
    } })
    complete(safe.result)
    assert.equal(safeAssertions, 1)
    assert.equal(safe.result.owner.r0, null)
    const alias = await run({ mutation: { name: 'entropy-owned-copy-replaced-by-source-alias', from: entropyLine, to: wrapper('value') }, assertAfterReadiness(owner) {
      assert.notEqual(owner.r0.diagnosticRunId, expected, 'source aliasing must produce the independently expected ID distinction')
      assert.equal(owner.r0.replayContextId, expectedReplay)
      aliasAssertions += 1
    } })
    complete(alias.result)
    assert.equal(aliasAssertions, 1)
    assert.equal(alias.result.owner.r0, null)
  })
  const fixtureCases = [
    ['Int8Array prototype spoof', () => Object.setPrototypeOf(new Int8Array(17).fill(17), Uint8Array.prototype)],
    ['Uint8ClampedArray prototype spoof', () => Object.setPrototypeOf(new Uint8ClampedArray(17).fill(17), Uint8Array.prototype)],
    ['extra own string', () => Object.defineProperty(new Uint8Array(17), 'extra', { value: 1 })],
    ['extra own symbol', () => Object.defineProperty(new Uint8Array(17), Symbol('extra'), { value: 1 })],
    ['overlapping subview', () => new Uint8Array(new ArrayBuffer(18), 1, 17)],
    ['detached zero-length view', () => { const value = new Uint8Array(0); structuredClone(value.buffer, { transfer: [value.buffer] }); return value }],
  ]
  for (const [name, make] of fixtureCases) /* ADR0038:register:test */ g36CaseTest('L4630', 'registerAdapterByteBoundaryTests', 'ADR 0036 Virtual fixture bytes: atomic rejection of ' + name, { concurrency: false }, () => {
    const fixture = createVirtualRuntimeFixture()
    const before = fixture.controller.snapshot()
    assert.throws(() => fixture.controller.dispatch({ kind: 'source-return', source: 'readDiagnosticRunIdEntropyBytes', value: make() }), { name: 'TypeError', message: 'browserSyncTransportRuntimeDiagnosticVirtualDispatchInvalid' })
    assert.deepEqual(fixture.controller.snapshot(), before)
  })
  /* ADR0038:register:test */ g36CaseTest('L4636', 'registerAdapterByteBoundaryTests', 'ADR 0036 Virtual fixture bytes: descriptor-only rejection never invokes shadow getters', { concurrency: false }, () => {
    for (const key of ['buffer', 'byteLength', Symbol.toStringTag]) {/* ADR0038:sync */g36Variant('byte-descriptor',key);/* ADR0038:end */
      let calls = 0
      const value = new Uint8Array(17)
      Object.defineProperty(value, key, { get() { calls += 1; throw new Error('must-not-read-byte-getter') } })
      const fixture = createVirtualRuntimeFixture(), before = fixture.controller.snapshot()
      assert.throws(() => fixture.controller.dispatch({ kind: 'source-return', source: 'readDiagnosticRunIdEntropyBytes', value }), { name: 'TypeError', message: 'browserSyncTransportRuntimeDiagnosticVirtualDispatchInvalid' })
      assert.equal(calls, 0)
      assert.deepEqual(fixture.controller.snapshot(), before)
    }
  })
  return { productiveByteFaultSpecimens: cases.length + 1, fixtureAtomicCases: fixtureCases.length + 1, copyAliasCausalCases: 1, publicFactoryControl: 1 }
}

// Negative producer profiles use the already exported product event boundary.
// Authentic handles come only from the Owner created by the complete raw driver;
// tests never edit its ledgers or manufacture Foundation acknowledgements.
function registerAdr36ProducerCapTests({ test, assert, withAdapterCopy, runVirtualAdapterScenario, createSourcePlan }) {
  const profile = 'virtual-runtime-conformance';
  const freeze = Object.freeze;
  const poison = () => {
    const counts = { get: 0, getPrototypeOf: 0, ownKeys: 0, getOwnPropertyDescriptor: 0 };
    const handlers = {};
    for (const name of Object.keys(counts)) handlers[name] = function forbiddenReflection() { counts[name] += 1; throw new Error('private producer poison'); };
    return { value: new Proxy({}, handlers), counts };
  };
  const zero = counts => assert.deepEqual(counts, { get: 0, getPrototypeOf: 0, ownKeys: 0, getOwnPropertyDescriptor: 0 });
  const envelope = (producer, producerHandle, generation, event) => freeze({ profile: 'adr-0036-producer-event-v1', producer, producerHandle, generation, event });
  const terminal = result => {
    assert.equal(result.outcome.kind, 'error');
    assert.equal(result.outcome.error.message, 'browserSyncTransportRuntimeDiagnosticAdapterFailed');
    assert.equal(result.owner.ownerFinalizationCount, 1);
    assert.equal(result.owner.writerCallCount, 0);
    assert.equal(result.owner.runState, 'terminal');
    assert.equal(result.owner.activeExchange, null);
    assert.equal(result.owner.waitingDequeueResolver, null);
  };
  async function probeRun(kind, mutation = null) {
    let result;
    let oracleFailure = null;
    let checks = 0;
    await withAdapterCopy(profile, mutation, async namespace => {
      let activeOwner = null;
      const invalid = ['unknown-handle', 'future-generation', 'malformed-child', 'malformed-scheduler'].includes(kind) || mutation !== null;
      result = await runVirtualAdapterScenario(namespace, { entry: 'owner', sourcePlan: await createSourcePlan(), scenario: 'capture-cap',
        sourceSettlementOrder: invalid ? 'post-settlement-first' : 'passive-first', rawAfterHookMicrotasks: 0,
        assertAtCapturePending(owner) {
          assert.equal(owner.phase, 'capture');
          assert.equal(owner.fifo.length, 0);
          assert.equal(typeof owner.waitingDequeueResolver, 'function');
          activeOwner = owner;
        },
        rawBeforeCaptureCap() {
          const owner = activeOwner;
          const trap = poison();
          const before = { sequence: owner.nextFifoSequence, parser: owner.pipeLedger.parseCount,
            exchange: owner.activeExchange, resolver: owner.waitingDequeueResolver,
            setupState: owner.capLedger.setup.state, captureState: owner.capLedger.capture.state };
          let producer = 'debug-pipe-read', handle = owner.pipeLedger.pair, generation = owner.pipeLedger.generation;
          if (kind === 'unknown-handle') handle = freeze({});
          if (kind === 'future-generation') generation += 1;
          if (kind === 'stale-generation') generation -= 1;
          if (kind === 'cancelled-setup-generation' || kind === 'malformed-scheduler') {
            const cap = owner.capLedger[kind === 'cancelled-setup-generation' ? 'setup' : 'capture'];
            producer = 'scheduler'; handle = cap.handle; generation = cap.generation;
          }
          if (kind === 'malformed-child') { producer = 'child'; handle = owner.childLedger.chrome.handle; generation = owner.childLedger.chrome.generation; }
          if (kind === 'malformed-child' || kind === 'malformed-scheduler') {
            const malformed = kind === 'malformed-child' ? freeze({ kind: 'exit', code: undefined, signal: null }) : freeze({ kind: 'not-fired' });
            assert.equal(namespace.enqueueBrowserSyncTransportRuntimeDiagnosticAdapterEvent(owner, envelope(producer, handle, generation, malformed)), undefined);
          }
          assert.equal(namespace.enqueueBrowserSyncTransportRuntimeDiagnosticAdapterEvent(owner, envelope(producer, handle, generation, trap.value)), undefined);
          checks += 1;
          try {
            zero(trap.counts);
            assert.equal(owner.nextFifoSequence, before.sequence, 'rejected or stale producer cannot assign a FIFO sequence');
            assert.equal(owner.pipeLedger.parseCount, before.parser);
            if (invalid) assert.equal(owner.producerViolation, true);
            else {
              assert.equal(owner.producerViolation, false);
              assert.equal(owner.activeExchange, before.exchange);
              assert.equal(owner.waitingDequeueResolver, before.resolver);
              assert.equal(owner.capLedger.setup.state, before.setupState);
              assert.equal(owner.capLedger.capture.state, before.captureState);
            }
            if (kind === 'malformed-child' || kind === 'malformed-scheduler') assert.equal(owner.producerBindings.get(handle).get(producer).active, false);
          } catch (error) { oracleFailure = error; }
          return [];
        },
      });
      terminal(result);
      const whole = poison();
      const sequence = result.owner.nextFifoSequence;
      assert.equal(namespace.enqueueBrowserSyncTransportRuntimeDiagnosticAdapterEvent(result.owner, whole.value), undefined);
      zero(whole.counts);
      assert.equal(result.owner.nextFifoSequence, sequence);
    });
    assert.equal(checks, 1);
    return { result, oracleFailure };
  }
  for (const kind of ['unknown-handle', 'future-generation', 'stale-generation', 'cancelled-setup-generation']) {
    /* ADR0038:register:test */ g36CaseTest('L4737', 'registerAdr36ProducerCapTests', `ADR 0036 Producer: ${kind} leaves all four payload traps unreachable`, async () => {
      const { oracleFailure } = await probeRun(kind);
      assert.equal(oracleFailure, null);
    });
  }
  for (const kind of ['malformed-child', 'malformed-scheduler']) {
    /* ADR0038:register:test */ g36CaseTest('L4743', 'registerAdr36ProducerCapTests', `ADR 0036 Producer counterprobe: ${kind} invalidates its generation before later payload reflection`, async () => {
      const { oracleFailure } = await probeRun(kind);
      assert.equal(oracleFailure, null);
    });
  }
  for (const [kind, mutation] of [
    ['future-generation', { name: 'PRODUCER_FUTURE_GENERATION_PAYLOAD_BEFORE_GUARD',
      from: 'if (binding === undefined || generation > binding.generation)', to: 'if (binding === undefined)' }],
    ['stale-generation', { name: 'PRODUCER_STALE_GENERATION_PAYLOAD_BEFORE_GUARD',
      from: 'if (!binding.active || generation < binding.generation) return undefined', to: 'if (!binding.active) return undefined' }],
    ['cancelled-setup-generation', { name: 'PRODUCER_CANCELLED_GENERATION_PAYLOAD_BEFORE_GUARD',
      from: 'if (!binding.active || generation < binding.generation) return undefined', to: 'if (generation < binding.generation) return undefined' }],
  ]) /* ADR0038:register:test */ g36CaseTest('L4755', 'registerAdr36ProducerCapTests', `ADR 0036 Producer causal mutant: ${mutation.name}`, async () => {
    const control = await probeRun(kind);
    assert.equal(control.oracleFailure, null);
    const changed = await probeRun(kind, mutation);
    assert.equal(changed.oracleFailure?.name, 'AssertionError');
  });

  const capOracle = result => {
    terminal(result);
    const calls = result.fixtureSnapshot.callCounts.scheduler;
    assert.equal(calls.armTimer, 3, 'one Setup, one committed Capture, one shared Cleanup timer');
    assert.equal(calls.cancelTimer, 2, 'one Setup cancel and one Cleanup cancel; fired Capture cannot be cancelled');
    assert.equal(result.owner.capLedger.setup.state, 'cancelled');
    assert.equal(result.owner.capLedger.capture.state, 'fired');
    assert.equal(result.owner.capLedger.cleanup.state, 'cancelled');
    assert.equal(result.owner.terminalOwnershipFacts.capGenerationDistinctCount, 3);
    assert.equal(result.owner.clockLedger.filter(row => row.reason === 'cleanup-origin').length, 1);
    assert.equal(result.owner.clockLedger.filter(row => row.reason === 'cleanup-completion-after-cap-cancel').length, 1);
  };
  const simpleRun = mutation => withAdapterCopy(profile, mutation, async namespace => runVirtualAdapterScenario(namespace,
    { entry: 'owner', sourcePlan: await createSourcePlan(), scenario: 'capture-cap' }));
  /* ADR0038:register:test */ g36CaseTest('L4776', 'registerAdr36ProducerCapTests', 'ADR 0036 Cap: actual timer handles obey one arm and at most one cancel per generation', async () => { capOracle(await simpleRun(null)); });
  for (const mutation of [
    { name: 'TIMER_RESET_AFTER_ARM',
      from: "  const handle = adapterInvoke(owner, 'scheduler', 'armTimer', [callback, milliseconds])",
      to: "  const resetHandle = adapterInvoke(owner, 'scheduler', 'armTimer', [callback, milliseconds])\n  adapterInvoke(owner, 'scheduler', 'cancelTimer', [resetHandle])\n  const handle = adapterInvoke(owner, 'scheduler', 'armTimer', [callback, milliseconds])" },
    { name: 'SECOND_CLEANUP_CANCEL',
      from: "      adapterAssert(adapterInvoke(owner, 'scheduler', 'cancelTimer', [cap.handle]) === undefined)",
      to: "      adapterAssert(adapterInvoke(owner, 'scheduler', 'cancelTimer', [cap.handle]) === undefined)\n      if (kind === 'cleanup') adapterInvoke(owner, 'scheduler', 'cancelTimer', [cap.handle])" },
  ]) /* ADR0038:register:test */ g36CaseTest('L4784', 'registerAdr36ProducerCapTests', `ADR 0036 Cap causal mutant: ${mutation.name}`, async () => {
    capOracle(await simpleRun(null));
    const result = await simpleRun(mutation);
    terminal(result);
    assert.throws(() => capOracle(result), { name: 'AssertionError' });
    if (mutation.name === 'TIMER_RESET_AFTER_ARM') assert.equal(result.fixtureSnapshot.callCounts.scheduler.armTimer, 6);
    else assert.equal(result.fixtureSnapshot.callCounts.scheduler.cancelTimer, 3);
  });

  const rawRequest = new TextEncoder().encode(JSON.stringify({ method: 'Network.requestWillBeSent', sessionId: 'session-adr0036-fixture',
    params: { requestId: 'producer-resolver-options', request: { url: 'http://127.0.0.1:8787/api/sync-test', method: 'OPTIONS' }, timestamp: 10 } }) + '\u0000');
  const pendingOracle = owner => {
    assert.equal(owner.phase, 'capture');
    assert.equal(owner.fifo.length, 0);
    assert.equal(owner.awaitingDequeueClock, false);
    assert.equal(owner.lastDequeuedMaterial, null);
    assert.notEqual(owner.activeExchange, null);
    assert.equal(owner.activeExchange.kind, 'observation-dequeue');
    assert.equal(typeof owner.waitingDequeueResolver, 'function');
    assert.equal(owner.notificationCount, 0);
  };
  async function queueRun(mutation, secondResolver = false) {
    let initialExchange = null, initialResolver = null, initialClockReads = null;
    let initialFailure = null, afterFailure = null, checkpoints = 0;
    const result = await withAdapterCopy(profile, mutation, async namespace => runVirtualAdapterScenario(namespace, {
      entry: 'owner', sourcePlan: await createSourcePlan(), scenario: 'capture-cap',
      ...(secondResolver ? { sourceSettlementOrder: 'post-settlement-first', rawAfterCaptureAssertions: pipeOrdinal => [{ kind: 'pipe-read-error', pipeOrdinal }] } : {}),
      rawBeforeCaptureCap: pipeOrdinal => [{ kind: 'pipe-chunk', pipeOrdinal, bytes: rawRequest }], rawAfterHookMicrotasks: 32,
      assertAtCapturePending(owner, snapshot) {
        checkpoints += 1;
        initialExchange = owner.activeExchange; initialResolver = owner.waitingDequeueResolver;
        initialClockReads = snapshot.callCounts.clock.readControllerNanoseconds;
        try { pendingOracle(owner); } catch (error) { initialFailure = error; }
      },
      assertBeforeCaptureCap(owner, snapshot) {
        checkpoints += 1;
        try {
          pendingOracle(owner);
          assert.notEqual(owner.activeExchange, initialExchange);
          assert.notEqual(owner.waitingDequeueResolver, initialResolver);
          assert.equal(initialExchange.resolve, null);
          assert.equal(initialExchange.reject, null);
          assert.equal(snapshot.callCounts.clock.readControllerNanoseconds, initialClockReads + 1);
        } catch (error) { afterFailure = error; }
      },
    }));
    terminal(result);
    assert.equal(checkpoints, 2);
    return { initialFailure, afterFailure };
  }
  for (const [mutation, secondResolver] of [
    [{ name: 'DEQUEUED_MATERIAL_RELEASE_OMITTED',
      from: '    const entry = owner.lastDequeuedMaterial\n    owner.lastDequeuedMaterial = null',
      to: '    const entry = owner.lastDequeuedMaterial' }, false],
    [{ name: 'SECOND_RESOLVER_CONSUMES_RAW_VALUE',
      from: '        owner.waitingDequeueResolver = fulfill',
      to: "        owner.waitingDequeueResolver = owner.phase === 'capture' ? value => { new AdapterPromise(resolve => { resolve(value) }) } : fulfill" }, true],
  ]) /* ADR0038:register:test */ g36CaseTest('L4841', 'registerAdr36ProducerCapTests', `ADR 0036 Queue causal mutant: ${mutation.name}`, async () => {
    const control = await queueRun(null, secondResolver);
    assert.equal(control.initialFailure, null);
    assert.equal(control.afterFailure, null);
    const changed = await queueRun(mutation, secondResolver);
    assert.ok(changed.initialFailure?.name === 'AssertionError' || changed.afterFailure?.name === 'AssertionError');
  });
  /* ADR0038:register:test */ g36CaseTest('L4848', 'registerAdr36ProducerCapTests', 'ADR 0036 Queue causal mutant: QUEUE_EMPTY_FULFILLMENT cannot replace a pending dequeue', async () => {
    const mutation = { name: 'QUEUE_EMPTY_FULFILLMENT',
      from: '  if (owner.waitingDequeueResolver === null || owner.fifo.length === 0) return',
      to: "  if (owner.waitingDequeueResolver === null) return\n  if (owner.fifo.length === 0) {\n    if (owner.phase === 'capture') { const resolver = owner.waitingDequeueResolver; owner.waitingDequeueResolver = null; resolver(adapterFreeze({ kind: 'connection-closed' })) }\n    return\n  }" };
    async function emptyRun(change) {
      let failure = null, checkpoints = 0;
      const result = await withAdapterCopy(profile, change, async namespace => runVirtualAdapterScenario(namespace, {
        entry: 'owner', sourcePlan: await createSourcePlan(), scenario: 'capture-cap', rawAfterHookMicrotasks: 0,
        assertAtCapturePending(owner) {
          checkpoints += 1;
          try { pendingOracle(owner); } catch (error) { failure = error; }
        },
      }));
      terminal(result);
      assert.equal(checkpoints, 1);
      return { result, failure };
    }
    const control = await emptyRun(null);
    assert.equal(control.failure, null);
    const changed = await emptyRun(mutation);
    assert.equal(changed.failure?.name, 'AssertionError');
    // The forged dequeue skips the mandatory awaiting-clock bookkeeping.
    // Its clock guard fails before Foundation can inspect connection-closed.
    assert.equal(changed.result.owner.clockLedger.some(row => row.reason === 'capture-dequeue-before-reflection'), false);
    assert.equal(changed.result.owner.foundationProjection.timing.completion.observationCloseReason, 'confirmed-violation');
    assert.equal(changed.result.owner.foundationProjection.candidateObserverGate, 'FAIL');
    assert.equal(changed.result.owner.terminalOutcome.observerGate, 'FAIL');
    assert.equal(changed.result.owner.terminalOutcome.finding, 'observer-invalid');
  });
  for (const [kind, name] of [
    ['malformed-child', 'PRODUCER_REJECTED_CHILD_GENERATION_REUSED'],
    ['malformed-scheduler', 'PRODUCER_REJECTED_TIMER_GENERATION_REUSED'],
  ]) /* ADR0038:register:test */ g36CaseTest('L4880', 'registerAdr36ProducerCapTests', `ADR 0036 Producer causal mutant: ${name}`, async () => {
    const original = await probeRun(kind);
    assert.equal(original.oracleFailure, null);
    const changed = await probeRun(kind, {
      name,
      from: '    if (activeBinding !== null) activeBinding.active = false',
      to: '    // Named mutation omits only invalidation of the rejected active generation.',
    });
    assert.equal(changed.oracleFailure?.name, 'AssertionError');
    assert.equal(changed.oracleFailure.actual.getOwnPropertyDescriptor, 1);
    assert.deepEqual(changed.oracleFailure.expected, { get: 0, getPrototypeOf: 0, ownKeys: 0, getOwnPropertyDescriptor: 0 });
  });
}

// Literal raw capability results, including invalid primitive values and throws.
// No mock clock intent, synthesized Foundation result, or owner-clock mutation.
function registerAdr36InvalidClockTests({ test, assert, withAdapterCopy, runVirtualAdapterScenario, createSourcePlan }) {
  const raw = value => ({ kind: 'source-return', source: 'readControllerNanoseconds', value });
  const throws = { kind: 'source-throw', source: 'readControllerNanoseconds' };
  const ns = milliseconds => BigInt(milliseconds) * 1000000n;
  const script = (prefix, invalid, following) => [
    ...prefix.map(value => raw(ns(value))), invalid,
    ...Array.from({ length: 132 - prefix.length - 1 }, (_, index) => raw(ns(following + index * 10))),
  ];
  const terminal = result => {
    assert.equal(result.outcome.kind, 'error');
    assert.equal(result.outcome.error.message, 'browserSyncTransportRuntimeDiagnosticAdapterFailed');
    if (result.owner === null) return;
    assert.equal(result.owner.runState, 'terminal');
    assert.equal(result.owner.ownerFinalizationCount, 1);
    assert.equal(result.owner.writerCallCount, 0);
    assert.equal(result.owner.activeExchange, null);
    assert.equal(result.owner.waitingDequeueResolver, null);
    assert.equal(result.owner.fifo.length, 0);
    assert.equal(result.owner.lastDequeuedMaterial, null);
  };
  const run = (options, mutation = null) => withAdapterCopy('virtual-runtime-conformance', mutation,
    async namespace => runVirtualAdapterScenario(namespace, { entry: 'owner', sourcePlan: await createSourcePlan(), ...options }));
  const vectors = [
    ['negative BigInt', raw(-1n)],
    ['Number instead of BigInt', raw(140000000)],
    ['string instead of BigInt', raw('140000000')],
    ['NaN', raw(NaN)],
    ['positive Infinity', raw(Infinity)],
    ['negative Infinity', raw(-Infinity)],
    ['undefined', raw(undefined)],
    ['null', raw(null)],
    ['ordinary object', raw({})],
    ['unsafe millisecond quotient', raw((BigInt(Number.MAX_SAFE_INTEGER) + 1n) * 1000000n)],
    ['raw monotonic rollback by one millisecond', raw(ns(129))],
    ['capability throw', throws],
  ];
  for (const [name, invalid] of vectors) /* ADR0038:register:test */ g36CaseTest('L4932', 'registerAdr36InvalidClockTests', `ADR 0036 Clock raw rejection: ${name}`, async () => {
    const result = await run({ scenario: 'capture-cap-post-settlement-first', controllerClockActions: script([100, 110, 120, 130], invalid, 140) });
    terminal(result);
    const owner = result.owner;
    assert.equal(result.fixtureSnapshot.callCounts.clock.readControllerNanoseconds, owner.clockReadCount + 1, 'exactly the rejected raw call has no accepted controller sample');
    assert.equal(owner.clockLedger.length, owner.clockReadCount);
    assert.deepEqual(owner.clockLedger.slice(0, 4).map(row => row.milliseconds), [100, 110, 120, 130]);
    assert.equal(owner.clockLedger.some(row => row.reason === 'capture-dequeue-before-reflection'), false);
    assert.equal(owner.notificationCount, 1);
    assert.equal(owner.finalizationCount, 1);
    assert.equal(owner.terminalOutcome.evidenceStatus, 'NOT_EVIDENCE');
    assert.equal(owner.terminalOutcome.observerGate, 'FAIL');
    assert.equal(owner.terminalOutcome.finding, 'observer-invalid');
    assert.equal(owner.trackerState, 'TERMINAL_NO_RECORD');
    assert.equal(owner.capabilityError, true);
  });
  /* ADR0038:register:test */ g36CaseTest('L4948', 'registerAdr36InvalidClockTests', 'ADR 0036 Clock raw rejection: public factory rejects the same rollback operand', async () => {
    const result = await run({ entry: 'factory', scenario: 'capture-cap-post-settlement-first', controllerClockActions: script([100, 110, 120, 130], raw(ns(129)), 140) });
    terminal(result);
    assert.equal(result.owner, null);
    assert.equal(result.fixtureSnapshot.callCounts.pipe.writeDebugPipe, 4);
  });
  /* ADR0038:register:test */ g36CaseTest('L4954', 'registerAdr36InvalidClockTests', 'ADR 0036 Clock addition overflow: invalid Setup origin never arms a numeric cap', async () => {
    const actions = Array.from({ length: 132 }, () => raw(ns(Number.MAX_SAFE_INTEGER)));
    const result = await run({ scenario: 'setup-origin-rejected', controllerClockActions: actions });
    terminal(result);
    assert.equal(result.owner.attemptStarted, false);
    assert.equal(result.owner.notificationCount, 0);
    assert.equal(result.owner.finalizationCount, 0);
    assert.equal(result.fixtureSnapshot.callCounts.pipe.writeDebugPipe, 0);
    assert.equal(result.fixtureSnapshot.callCounts.scheduler.armTimer, 0);
    assert.equal(result.owner.capLedger.setup.state, 'absent');
  });
  /* ADR0038:register:test */ g36CaseTest('L4965', 'registerAdr36InvalidClockTests', 'ADR 0036 Clock counterprobe: failed Cleanup-origin addition cannot be reused by outer timer arm', async () => {
    const actions = [...[100, 110, 120, 130, 140].map(value => raw(ns(value))),
      ...Array.from({ length: 127 }, () => raw(ns(Number.MAX_SAFE_INTEGER)))];
    const result = await run({ scenario: 'capture-cap-post-settlement-first', controllerClockActions: actions });
    terminal(result);
    assert.equal(result.fixtureSnapshot.callCounts.scheduler.armTimer, 2, 'only the valid Setup and committed Capture timers may arm');
    assert.equal(result.owner.capLedger.cleanup.state, 'terminal-unknown');
    assert.equal(result.owner.terminalOutcome.observerGate, 'FAIL');
  });
  /* ADR0038:register:test */ g36CaseTest('L4974', 'registerAdr36InvalidClockTests', 'ADR 0036 Clock causal mutant: UNSAFE_ABSOLUTE_DEADLINE_ARMED after rejected Cleanup origin', async () => {
    const actions = [...[100, 110, 120, 130, 140].map(value => raw(ns(value))),
      ...Array.from({ length: 127 }, () => raw(ns(Number.MAX_SAFE_INTEGER)))];
    const oracle = result => {
      terminal(result);
      assert.equal(result.fixtureSnapshot.callCounts.scheduler.armTimer, 2);
      assert.equal(result.owner.capLedger.cleanup.state, 'terminal-unknown');
    };
    const options = { scenario: 'capture-cap-post-settlement-first', controllerClockActions: actions };
    oracle(await run(options));
    const mutation = {
      name: 'UNSAFE_ABSOLUTE_DEADLINE_ARMED',
      from: "  adapterAssert(kind === 'capture' ? deadline === null :\n    adapterSafeInteger(deadline) && deadline >= 0)",
      to: '  adapterAssert(true)',
    };
    const changed = await run(options, mutation);
    terminal(changed);
    assert.equal(changed.fixtureSnapshot.callCounts.scheduler.armTimer, 3);
    assert.throws(() => oracle(changed), { name: 'AssertionError' });
  });
}

// An ordinary raw capability throw latches its private error, but is no proof of
// a second capability or authority to reject later correctly returned cleanup tokens.
function registerAdr36CapabilityThrowTests({ test, assert, withAdapterCopy, runVirtualAdapterScenario, createSourcePlan }) {
  const terminal = result => {
    assert.equal(result.outcome.kind, 'error');
    assert.equal(result.outcome.error.message, 'browserSyncTransportRuntimeDiagnosticAdapterFailed');
    assert.equal(result.owner.ownerFinalizationCount, 1);
    assert.equal(result.owner.writerCallCount, 0);
    assert.equal(result.owner.runState, 'terminal');
    assert.equal(result.owner.cleanupLedger.terminal, true);
  };
  /* ADR0038:register:test */ g36CaseTest('L5007', 'registerAdr36CapabilityThrowTests', 'ADR 0036 Capability counterprobe: ordinary Gateway throw preserves later valid cleanup bindings', async () => {
    const result = await withAdapterCopy('virtual-runtime-conformance', null, async namespace =>
      runVirtualAdapterScenario(namespace, { entry: 'owner', sourcePlan: await createSourcePlan(), scenario: 'partial-profile-completed' }));
    terminal(result);
    const owner = result.owner;
    assert.equal(result.fixtureSnapshot.callCounts.launcher.spawnChild, 2);
    assert.equal(result.fixtureSnapshot.callCounts.launcher.terminateChild, 1);
    assert.equal(result.fixtureSnapshot.callCounts.launcher.closeChild, 1);
    assert.equal(owner.childLedger.vite.handle, null);
    assert.equal(owner.childLedger.gateway.handle, null);
    assert.equal(owner.childLedger.chrome.creation, 'never-attempted');
    assert.equal(owner.attemptStarted, false);
    assert.equal(owner.notificationCount, 0);
    assert.equal(owner.adapterObservationSnapshot, null);
    assert.equal(owner.finalizationCount, 0);
    assert.equal(result.fixtureSnapshot.callCounts.pipe.writeDebugPipe, 0);
    assert.equal(result.fixtureSnapshot.callCounts.scheduler.armTimer, 1);
    assert.equal(owner.capLedger.cleanup.handle, null, 'the successfully bound timer identity is discarded after terminalization');
    assert.equal(owner.capLedger.cleanup.state, 'cancelled');
    assert.equal(result.fixtureSnapshot.callCounts.scheduler.cancelTimer, 1);
    assert.equal(owner.sourceState.foundationResourceState, 'closed',
      'the held Foundation read handle closes through later valid resource operation tokens');
    assert.equal(owner.capabilityError, true);
    assert.equal(owner.capabilityViolation, false);
    assert.equal(owner.producerViolation, false);
    assert.deepEqual(result.fixtureSnapshot.liveOrdinals.resources, []);
    assert.deepEqual(result.fixtureSnapshot.liveOrdinals.resourceOperations, []);
  });
  /* ADR0038:register:test */ g36CaseTest('L5035', 'registerAdr36CapabilityThrowTests', 'ADR 0036 Capability ordinary Evaluate throw retains actual Foundation FAIL and cleanup binding', async () => {
    const result = await withAdapterCopy('virtual-runtime-conformance', null, async namespace =>
      runVirtualAdapterScenario(namespace, { entry: 'owner', sourcePlan: await createSourcePlan(), scenario: 'evaluate-write-throw', sourceSettlementOrder: 'post-settlement-first' }));
    terminal(result);
    const owner = result.owner;
    assert.equal(result.fixtureSnapshot.callCounts.pipe.writeDebugPipe, 4);
    assert.equal(owner.attemptStarted, true);
    assert.equal(owner.notificationCount, 1);
    assert.notEqual(owner.adapterObservationSnapshot, null);
    assert.equal(owner.finalizationCount, 1);
    assert.equal(owner.terminalOutcome.evidenceStatus, 'NOT_EVIDENCE');
    assert.equal(owner.terminalOutcome.observerGate, 'FAIL');
    assert.equal(owner.terminalOutcome.finding, 'observer-invalid');
    assert.equal(owner.capLedger.cleanup.handle, null);
    assert.equal(owner.capLedger.cleanup.state, 'cancelled');
    assert.equal(owner.capabilityError, true);
    assert.equal(owner.capabilityViolation, false);
  });
}
// The finite microtask checkpoint is an assertion about the real Owner. The
// driver releases only raw failed resource results afterward, never synthetic
// cleanup facts or owner-derived routing decisions.
function registerAdr36UnavailableCleanupCapTests({ test, assert, withAdapterCopy, runVirtualAdapterScenario, createSourcePlan }) {
  const ns = value => BigInt(value) * 1000000n;
  async function probe(kind, mutation = null) {
    let seen = 0;
    let oracleFailure = null;
    const options = { entry: 'owner', sourcePlan: await createSourcePlan(), scenario: 'capture-cap',
      sourceSettlementOrder: 'post-settlement-first', failRemainingResourceOperations: true,
      assertAfterObservationCap(owner, snapshot) {
        seen += 1;
        try {
          assert.equal(owner.runState, 'terminal', 'a definitively unavailable Cleanup cap cannot leave later source operations pending');
          assert.equal(owner.ownerFinalizationCount, 1);
          assert.equal(owner.capLedger.cleanup.state, 'terminal-unknown');
          assert.equal(owner.activeExchange, null);
          assert.equal(owner.waitingDequeueResolver, null);
          assert.equal(owner.resourceLedger.operations.size, 0);
          assert.equal(snapshot.liveOrdinals.resourceOperations.length, 0);
          assert.equal(snapshot.liveOrdinals.timers.length, 0);
          assert.equal(owner.writerCallCount, 0);
        } catch (error) { oracleFailure = error; }
      },
    };
    if (kind === 'arm-throw') options.rawBeforeCaptureCap = [{ kind: 'fail-next-capability-call', capability: 'armTimer' }];
    else options.controllerClockActions = [...[100, 110, 120, 130, 140].map(value => ({ kind: 'source-return', source: 'readControllerNanoseconds', value: ns(value) })),
      ...Array.from({ length: 127 }, () => ({ kind: 'source-return', source: 'readControllerNanoseconds', value: ns(Number.MAX_SAFE_INTEGER) }))];
    const result = await withAdapterCopy('virtual-runtime-conformance', mutation, namespace => runVirtualAdapterScenario(namespace, options));
    assert.equal(seen, 1);
    assert.equal(result.outcome.kind, 'error');
    assert.equal(result.outcome.error.message, 'browserSyncTransportRuntimeDiagnosticAdapterFailed');
    assert.equal(result.owner.runState, 'terminal');
    assert.equal(result.owner.ownerFinalizationCount, 1);
    assert.equal(result.owner.writerCallCount, 0);
    assert.equal(result.owner.notificationCount, 1);
    assert.equal(result.owner.finalizationCount, 1);
    assert.equal(result.owner.terminalOutcome.evidenceStatus, 'NOT_EVIDENCE');
    assert.equal(result.owner.terminalOutcome.observerGate, 'FAIL');
    assert.equal(result.owner.capabilityError, true);
    assert.deepEqual(result.owner.sourceState.checkpoints.slice(1).map(check => ({ phase: check.phase, state: check.state })), [{ phase: 'post-settlement', state: 'unproven' }, { phase: 'post-cleanup', state: 'unproven' }]);
    return { result, oracleFailure };
  }
  for (const kind of ['arm-throw', 'overflow']) /* ADR0038:register:test */ g36CaseTest('L5097', 'registerAdr36UnavailableCleanupCapTests', `ADR 0036 Cleanup cap counterprobe: ${kind} refuses an unbounded later resource wait`, async () => {
    const { result, oracleFailure } = await probe(kind);
    assert.equal(oracleFailure, null);
    assert.equal(result.fixtureSnapshot.callCounts.scheduler.armTimer, kind === 'arm-throw' ? 3 : 2);
  });
  for (const kind of ['arm-throw', 'overflow']) /* ADR0038:register:test */ g36CaseTest('L5102', 'registerAdr36UnavailableCleanupCapTests', `ADR 0036 Cleanup cap causal mutant: resource wait after ${kind}`, async () => {
    const original = await probe(kind);
    assert.equal(original.oracleFailure, null);
    const changed = await probe(kind, {
      name: kind === 'arm-throw' ? 'RESOURCE_WAIT_AFTER_UNAVAILABLE_CLEANUP_CAP_ARM_THROW' : 'RESOURCE_WAIT_AFTER_UNAVAILABLE_CLEANUP_CAP_OVERFLOW',
      from: "    if (owner.capLedger.cleanup.state === 'fired' || owner.capLedger.cleanup.state === 'terminal-unknown') {",
      to: "    if (owner.capLedger.cleanup.state === 'fired') {",
    });
    assert.equal(changed.oracleFailure?.name, 'AssertionError');
    assert.equal(changed.oracleFailure.actual, 'active');
    assert.equal(changed.oracleFailure.expected, 'terminal');
  });
}

// These are 59 independent hypothetical replay rows in a pure finalizer input.
// They exercise the record boundary, not the runtime R0 builder or an authentic
// observation. No fixture-provided authority, owner, or positive Record exists.
function registerAdr36ReplayRecordMatrixTests({ test, assert, withAdapterCopy, freeze, makeRecordPair = makeAdr36RecordPairFixture }) {
  const definitions = recordFixtureReplayDefinitions;
  const exactResult = { evidenceStatus: 'NOT_EVIDENCE', observerGate: 'UNPROVEN', finding: 'inconclusive', runtimeRecord: null };
  const staticError = { name: 'TypeError', message: 'browserSyncTransportRuntimeDiagnosticAdapterFailed' };
  const different = definition => {
    const value = definition[2], type = definition[3];
    if (type === 'H64') return (value[0] === '0' ? 'f' : '0') + value.slice(1);
    if (type === 'B') return !value;
    if (type === 'P') return value === 65535 ? 65534 : value + 1;
    if (type === 'STATE') return value === 'dirty' ? 'clean' : 'dirty';
    if (type === 'S32') return value === '0.0.0' ? '0.0.1' : '0.0.0';
    return value === 'different' ? 'other' : 'different';
  };
  const setValue = (input, index, value) => {
    const projection = input.foundationProjection;
    const row = projection.replay.equivalence.comparisons[index];
    row.replayValue = value;
    if (index === 8) projection.replay.repositoryState = value;
    if (index >= 9) {
      const path = definitions[index][0].split('.');
      let object = projection.replay.causalContext;
      for (let offset = 0; offset < path.length - 1; offset += 1) object = object[path[offset]];
      object[path[path.length - 1]] = value;
    }
  };
  const pair = (index, kind) => {
    const input = makeRecordPair();
    const equivalence = input.foundationProjection.replay.equivalence;
    const row = equivalence.comparisons[index];
    if (kind === 'ambiguous') row.observationState = 'ambiguous';
    else if (kind !== 'not-observed') {
      row.observationState = 'observed';
      row.result = kind === 'mismatch' ? 'mismatch' : 'match';
      setValue(input, index, kind === 'mismatch' ? different(definitions[index]) : definitions[index][2]);
    }
    equivalence.result = kind === 'mismatch' ? 'DIVERGED' : 'UNPROVEN';
    return input;
  };
  const badPair = (index, kind) => {
    const input = pair(index, kind);
    const row = input.foundationProjection.replay.equivalence.comparisons[index];
    if (kind === 'ambiguous') setValue(input, index, definitions[index][2]);
    else {
      row.result = 'match';
      input.foundationProjection.replay.equivalence.result = 'UNPROVEN';
    }
    return input;
  };
  const finalize = (api, input) => {
    const original = JSON.stringify(input);
    freeze(input);
    const result = api.finalizeBrowserSyncTransportRuntimeDiagnosticRecord(input);
    assert.deepEqual(result, exactResult);
    assert.equal(Object.isFrozen(result), true);
    assert.equal(JSON.stringify(input), original, 'pure validation never mutates F or its hypothetical ledger');
    assert.notEqual(result, input);
    assert.notEqual(result, input.foundationProjection);
    return result;
  };
  for (let index = 0; index < definitions.length; index += 1) {
    for (const kind of ['mismatch', 'ambiguous']) /* ADR0038:register:test */ g36CaseTest('L5179', 'registerAdr36ReplayRecordMatrixTests', `ADR 0036 Replay record operand ${String(index + 1).padStart(2, '0')}: ${kind} ${definitions[index][0]}`, async () => {
      await withAdapterCopy('derivation-conformance', null, async api => {
        finalize(api, pair(index, kind === 'mismatch' ? 'match' : 'not-observed'));
        const input = pair(index, kind);
        finalize(api, input);
        const row = input.foundationProjection.replay.equivalence.comparisons[index];
        assert.equal(row.observationState, kind === 'ambiguous' ? 'ambiguous' : 'observed');
        assert.equal(row.result, kind === 'ambiguous' ? 'unproven' : 'mismatch');
        assert.equal(input.foundationProjection.replay.equivalence.result, kind === 'ambiguous' ? 'UNPROVEN' : 'DIVERGED');
        assert.throws(() => api.finalizeBrowserSyncTransportRuntimeDiagnosticRecord(freeze(badPair(index, kind))), staticError);
      });
    });
  }
  const mutations = [
    ['ambiguous', {
      name: 'REPLAY_AMBIGUOUS_VALUE_RETAINED',
      from: "    if (row.observationState !== 'observed') adr36RecordAssert(row.replayValue === null && row.result === 'unproven');",
      to: "    if (row.observationState !== 'observed') adr36RecordAssert(true);",
    }],
    ['mismatch', {
      name: 'REPLAY_OBSERVED_MISMATCH_LABELLED_MATCH',
      from: "    else adr36RecordAssert(row.replayValue !== null && adr36RecordScalar(row.replayValue, definition[3]) && row.result === (row.replayValue === row.historicalValue ? 'match' : 'mismatch'));",
      to: '    else adr36RecordAssert(true);',
    }],
  ];
  for (const [kind, mutation] of mutations) /* ADR0038:register:test */ g36CaseTest('L5204', 'registerAdr36ReplayRecordMatrixTests', `ADR 0036 Replay record causal mutant: ${mutation.name} across all 59 operands`, async () => {
    const rejectsInvalid = (api, index) => assert.throws(() => api.finalizeBrowserSyncTransportRuntimeDiagnosticRecord(freeze(badPair(index, kind))), staticError);
    let originalChecks = 0, killedRows = 0;
    await withAdapterCopy('derivation-conformance', null, async api => {
      for (let index = 0; index < definitions.length; index += 1) { rejectsInvalid(api, index); originalChecks += 1; /* ADR0038:sync */g36Variant('replay-control',definitions[index][0]);/* ADR0038:end */}
    });
    await withAdapterCopy('derivation-conformance', mutation, async api => {
      for (let index = 0; index < definitions.length; index += 1) {
        finalize(api, badPair(index, kind));
        assert.throws(() => rejectsInvalid(api, index), { name: 'AssertionError' });
        killedRows += 1;/* ADR0038:sync */g36Variant('replay-mutant',definitions[index][0]);/* ADR0038:end */
      }
    });
    assert.equal(originalChecks, 59);
    assert.equal(killedRows, 59);
  });
}
// Faults are one declared substitution in the productive private wrapper or
// fulfillment closure. The loaded Foundation and its bytes stay unchanged.
function registerAdr36EffectPortProfileTests({ test, assert, withAdapterCopy, runVirtualAdapterScenario, createSourcePlan }) {
  const wrapper = '      return adapterExchange(owner, intent)';
  const phaseCondition = "intent.kind === 'capability-probe'";
  const sourceHash = 'd4cadf656bb50e2b062c9d0d66e3f895bc87649362ce995abfbdbe24a9f4e731';
  const run = (mutation, scenario = 'capture-cap', sourceSettlementOrder = 'passive-first') => withAdapterCopy('virtual-runtime-conformance', mutation, async namespace =>
    runVirtualAdapterScenario(namespace, { entry: 'owner', sourcePlan: await createSourcePlan(), scenario, sourceSettlementOrder }));
  const terminal = result => {
    assert.equal(result.outcome.kind, 'error');
    assert.equal(result.outcome.error.message, 'browserSyncTransportRuntimeDiagnosticAdapterFailed');
    assert.deepEqual(Reflect.ownKeys(result.outcome.error), ['message']);
    assert.equal(result.owner.runState, 'terminal');
    assert.equal(result.owner.ownerFinalizationCount, 1);
    assert.equal(result.owner.writerCallCount, 0);
    assert.equal(result.owner.sourceState.instanceCreated, true, 'terminal facts record the genuinely loaded Foundation instance');
    assert.equal(result.owner.sourceState.loadCount, 1);
    assert.equal(result.owner.foundationInstance, null);
    assert.equal(result.owner.sourceState.module, null);
    assert.equal(result.owner.sourceState.namespace, null);
    assert.equal(result.owner.sourceState.factory, null);
    assert.equal(result.owner.sourceState.factoryInstance, null);
    assert.equal(Object.isFrozen(result.owner.sourceState), true);
    assert.equal(result.owner.sourceState.actualLoadedSha256, sourceHash);
    assert.equal(result.owner.activeExchange, null);
    assert.equal(result.owner.waitingDequeueResolver, null);
  };
  const rejected = result => {
    terminal(result);
    const owner = result.owner;
    assert.equal(owner.hardViolation || owner.notificationViolation || owner.foundationProjection?.candidateObserverGate === 'FAIL' ||
      owner.attemptStarted === false && owner.foundationProjection === null && owner.capabilityError, true,
    'the malformed private contract must be detected beyond the common NOT_EVIDENCE rejection');
    if (owner.finalizationCount !== 0) {
      assert.equal(owner.terminalOutcome.evidenceStatus, 'NOT_EVIDENCE');
      assert.equal(owner.terminalOutcome.observerGate, 'FAIL');
      assert.equal(owner.trackerState, 'TERMINAL_NO_RECORD');
    }
  };
  /* ADR0038:register:test */ g36CaseTest('L5260', 'registerAdr36EffectPortProfileTests', 'ADR 0036 Effect port: unchanged seven-intent path and six fulfillment classes remain accepted', async () => {
    const result = await run(null);
    terminal(result);
    assert.equal(result.owner.hardViolation, false);
    assert.equal(result.owner.notificationViolation, false);
    assert.equal(result.owner.foundationProjection.candidateObserverGate, 'UNPROVEN');
    assert.equal(result.owner.probeConsumed, true);
    assert.ok(result.owner.terminalOwnershipFacts.consumedIntentCount >= 20);
    assert.equal(result.owner.clockLedger.some(row => row.reason === 'setup-origin'), true);
    assert.equal(result.owner.capLedger.setup.state, 'cancelled');
    assert.equal(result.owner.capLedger.capture.state, 'fired');
    assert.equal(result.owner.capLedger.cleanup.state, 'cancelled');
    assert.equal(result.owner.wireLedger.operations.every(operation => operation.ackCount === 1), true);
    assert.ok(result.owner.dequeueCount > 0);
    assert.equal(result.owner.cleanupLedger.steps.size, 12);
    assert.throws(() => rejected(result), { name: 'AssertionError' });
  });
  const payloadCases = [
    ['capability-probe', phaseCondition, 'setup-origin-rejected'],
    ['controller-clock-sample', "intent.kind === 'controller-clock-sample' && intent.payload.reason === 'setup-origin'", 'setup-origin-rejected'],
    ['cap-arm', "intent.kind === 'cap-arm' && intent.payload.capKind === 'setup'", 'setup-origin-rejected'],
    ['cap-cancel', "intent.kind === 'cap-cancel' && intent.payload.capKind === 'cleanup'", 'capture-cap'],
    ['protocol-command-send', "intent.kind === 'protocol-command-send' && intent.payload.command === 'Target.getTargets'", 'setup-origin-rejected'],
    ['observation-dequeue', "intent.kind === 'observation-dequeue' && intent.payload.phase === 'setup'", 'post-o0-setup-cancel'],
    ['cleanup-step', "intent.kind === 'cleanup-step' && intent.payload.checkId === 'debugPipeClosed'", 'capture-cap'],
  ];
  for (const [kind, condition, scenario] of payloadCases) /* ADR0038:register:test */ g36CaseTest('L5286', 'registerAdr36EffectPortProfileTests', `ADR 0036 Effect intent closed payload: ${kind}`, async () => {
    const result = await run({ name: `INTENT_PAYLOAD_EXTRA_${kind.replaceAll('-', '_')}`, from: wrapper,
      to: `      return adapterExchange(owner, ${condition} ? adapterFreeze({ ...intent, payload: adapterFreeze({ ...intent.payload, extra: true }) }) : intent)` }, scenario);
    rejected(result);
  });
  const roots = [
    ['extra-key', 'adapterFreeze({ ...intent, extra: true })'],
    ['missing-key', 'adapterFreeze({ intentId: intent.intentId, kind: intent.kind })'],
    ['key-order', 'adapterFreeze({ kind: intent.kind, intentId: intent.intentId, payload: intent.payload })'],
    ['symbol-key', "adapterFreeze({ ...intent, [Symbol('extra')]: true })"],
    ['accessor', "adapterFreeze(Object.defineProperty({ intentId: intent.intentId, kind: intent.kind, payload: intent.payload }, 'intentId', { get() { throw new Error('unreachable-intent-getter') }, enumerable: true }))"],
    ['mutable', '{ ...intent }'],
    ['null-prototype', 'adapterFreeze(Object.assign(Object.create(null), intent))'],
    ['foreign-realm', "sourceVm.runInNewContext('Object.freeze({intentId:1,kind:\"capability-probe\",payload:Object.freeze({profile:\"adr-0033-foundation-effect-port-v1\"})})')"],
  ];
  for (const [name, expression] of roots) /* ADR0038:register:test */ g36CaseTest('L5301', 'registerAdr36EffectPortProfileTests', `ADR 0036 Effect intent root rejects ${name}`, async () => {
    const result = await run({ name: `INTENT_ROOT_${name.replaceAll('-', '_')}`, from: wrapper,
      to: `      return adapterExchange(owner, ${phaseCondition} ? ${expression} : intent)` }, 'setup-origin-rejected');
    rejected(result);
    assert.equal(result.owner.attemptStarted, false);
    assert.equal(result.owner.probeConsumed, false);
    assert.equal(result.fixtureSnapshot.callCounts.pipe.writeDebugPipe, 0);
  });
  for (const [name, expression] of [['zero', '0'], ['negative', '-1'], ['future', '2'], ['fractional', '1.5'], ['unsafe', 'Number.MAX_SAFE_INTEGER + 1'], ['NaN', 'NaN'], ['Infinity', 'Infinity'], ['string', "'1'"]]) {
    /* ADR0038:register:test */ g36CaseTest('L5310', 'registerAdr36EffectPortProfileTests', `ADR 0036 Effect intent ID rejects ${name}`, async () => {
      const result = await run({ name: `INTENT_ID_${name}`, from: wrapper,
        to: `      return adapterExchange(owner, ${phaseCondition} ? adapterFreeze({ ...intent, intentId: ${expression} }) : intent)` }, 'setup-origin-rejected');
      rejected(result);
      assert.equal(result.owner.terminalOwnershipFacts.consumedIntentCount, 0);
      assert.equal(result.owner.probeConsumed, false);
      assert.equal(result.fixtureSnapshot.callCounts.pipe.writeDebugPipe, 0);
    });
  }
  const fulfillFrom = '      exchange.resolve = null\n      exchange.reject = null\n      resolve(value)';
  for (const [name, condition, scenario] of [
    ['capability-probe-result', "exchange.kind === 'capability-probe'", 'setup-origin-rejected'],
    ['controller-clock-sample-result', "exchange.kind === 'controller-clock-sample' && value.reason === 'setup-origin'", 'setup-origin-rejected'],
    ['cap-arm-result', "exchange.kind === 'cap-arm' && value.capKind === 'setup'", 'setup-origin-rejected'],
    ['cap-cancel-result', "exchange.kind === 'cap-cancel' && value.capKind === 'cleanup'", 'capture-cap'],
    ['protocol-command-send-result', "exchange.kind === 'protocol-command-send' && value.commandId === 1", 'post-o0-setup-cancel'],
    ['cleanup-step-result', "exchange.kind === 'cleanup-step' && value.checkId === 'debugPipeClosed'", 'capture-cap'],
    ['dequeue-direct-envelope', "exchange.kind === 'observation-dequeue' && value.kind === 'cap-fired' && value.capKind === 'capture'", 'capture-cap'],
  ]) /* ADR0038:register:test */ g36CaseTest('L5328', 'registerAdr36EffectPortProfileTests', `ADR 0036 Effect productive fulfillment rejects ${name} extra field`, async () => {
    const result = await run({ name: `FULFILLMENT_EXTRA_${name.replaceAll('-', '_')}`, from: fulfillFrom,
      to: `      exchange.resolve = null\n      exchange.reject = null\n      resolve(${condition} ? adapterFreeze({ ...value, extra: true }) : value)` }, scenario);
    rejected(result);
  });
  for (const [name, expression] of [
    ['foreign-native', "sourceVm.runInNewContext('Promise.resolve(undefined)')"],
    ['subclass', '(new (class ForbiddenPromiseSubclass extends AdapterPromise {})(resolve => resolve(undefined)))'],
    ['thenable', "({ then() { throw new Error('unreachable-thenable') } })"],
    ['prototype-forgery', 'Object.create(adapterPromisePrototype)'],
    ['own-string-key', "Object.defineProperty(promise, 'invalidOwnKey', { value: true })"],
    ['own-symbol-key', "Object.defineProperty(promise, Symbol('invalid-own-key'), { value: true })"],
  ]) /* ADR0038:register:test */ g36CaseTest('L5340', 'registerAdr36EffectPortProfileTests', `ADR 0036 Effect returned promise profile rejects ${name}`, async () => {
    const result = await run({ name: `EXCHANGE_PROMISE_${name.replaceAll('-', '_')}`, from: wrapper,
      to: `      const promise = adapterExchange(owner, intent)\n      return ${phaseCondition} ? ${expression} : promise` }, 'setup-origin-rejected');
    rejected(result);
    assert.equal(result.owner.attemptStarted, false);
    assert.equal(result.owner.probeConsumed, true);
    assert.equal(result.owner.notificationCount, 0);
    assert.equal(result.owner.finalizationCount, 0);
    assert.equal(result.fixtureSnapshot.callCounts.pipe.writeDebugPipe, 0);
  });
  /* ADR0038:register:test */ g36CaseTest('L5350', 'registerAdr36EffectPortProfileTests', 'ADR 0036 Effect caller and seam promises are unreachable through the public zero-argument boundary', async () => {
    await withAdapterCopy('virtual-runtime-conformance', null, async namespace => {
      let reflected = 0;
      const seam = {};
      for (const key of ['effectPort', 'exchange', 'observationClosed', 'runBinding', 'clock', 'scheduler', 'pipe', 'launcher', 'resources', 'promise', 'then']) {/* ADR0038:sync */g36Variant('caller-seam',key);/* ADR0038:end */
        Object.defineProperty(seam, key, { enumerable: true, get() { reflected += 1; throw new Error('unreachable-public-seam'); } });
      }
      const callerPromise = Promise.resolve(undefined);
      for (const input of [seam, callerPromise]) /* ADR0038:sync */{g36Variant('caller-input',input===seam?'seam':'promise');/* ADR0038:end */assert.throws(() => namespace.createBrowserSyncTransportRuntimeDiagnosticAdapter(input), {
        name: 'TypeError', message: 'invalidBrowserSyncTransportRuntimeDiagnosticAdapterArguments',
      });/* ADR0038:sync */}/* ADR0038:end */
      const fixture = createVirtualRuntimeFixture();
      namespace.installBrowserSyncTransportRuntimeDiagnosticVirtualCapabilities(fixture.runtimeCapabilities);
      const api = namespace.createBrowserSyncTransportRuntimeDiagnosticAdapter();
      assert.deepEqual(Reflect.ownKeys(api), ['run']);
      const rejectedPromise = api.run(seam, callerPromise);
      assert.equal(Object.getPrototypeOf(rejectedPromise), Promise.prototype);
      assert.notEqual(rejectedPromise, callerPromise);
      await assert.rejects(rejectedPromise, { name: 'Error', message: 'invalidBrowserSyncTransportRuntimeDiagnosticAdapterArguments' });
      assert.equal(reflected, 0);
      assert.equal(Object.values(fixture.controller.snapshot().callCounts).every(group => Object.values(group).every(count => count === 0)), true);
    });
  });
  /* ADR0038:register:test */ g36CaseTest('L5373', 'registerAdr36EffectPortProfileTests', 'ADR 0036 Effect intent ID rejects a repeated prior ID after the genuine probe', async () => {
    const result = await run({ name: 'INTENT_ID_REPEATED_AFTER_PROBE', from: wrapper,
      to: "      return adapterExchange(owner, intent.kind === 'controller-clock-sample' && intent.payload.reason === 'setup-origin' ? adapterFreeze({ ...intent, intentId: 1 }) : intent)" }, 'setup-origin-rejected');
    rejected(result);
    assert.equal(result.owner.probeConsumed, true);
    assert.equal(result.owner.terminalOwnershipFacts.consumedIntentCount, 1);
    assert.equal(result.owner.clockLedger.some(row => row.reason === 'setup-origin'), false);
    assert.equal(result.fixtureSnapshot.callCounts.pipe.writeDebugPipe, 0);
  });
  for (const [name, condition, field, expression, scenario] of [
    ['probe-set', "exchange.kind === 'capability-probe'", 'capabilitySet', "'other'", 'setup-origin-rejected'],
    ['clock-reason', "exchange.kind === 'controller-clock-sample' && value.reason === 'setup-origin'", 'reason', "'capture-dequeue-before-reflection'", 'setup-origin-rejected'],
    ['arm-kind', "exchange.kind === 'cap-arm' && value.capKind === 'setup'", 'capKind', "'capture'", 'setup-origin-rejected'],
    ['cancel-arm-id', "exchange.kind === 'cap-cancel' && value.capKind === 'cleanup'", 'armIntentId', 'value.armIntentId + 1', 'capture-cap'],
    ['send-command-id', "exchange.kind === 'protocol-command-send' && value.commandId === 1", 'commandId', 'value.commandId + 1', 'post-o0-setup-cancel'],
    ['cleanup-check-id', "exchange.kind === 'cleanup-step' && value.checkId === 'debugPipeClosed'", 'checkId', "'browserStopped'", 'capture-cap'],
  ]) /* ADR0038:register:test */ g36CaseTest('L5389', 'registerAdr36EffectPortProfileTests', `ADR 0036 Effect productive fulfillment rejects mismatched ${name}`, async () => {
    const result = await run({ name: `FULFILLMENT_WRONG_${name.replaceAll('-', '_')}`, from: fulfillFrom,
      to: `      exchange.resolve = null\n      exchange.reject = null\n      resolve(${condition} ? adapterFreeze({ ...value, ${field}: ${expression} }) : value)` }, scenario);
    rejected(result);
  });
  /* ADR0038:register:test */ g36CaseTest('L5394', 'registerAdr36EffectPortProfileTests', 'ADR 0036 Effect port: valid no-target raw control retains the same strict contract', async () => {
    const result = await run(null, 'post-o0-setup-cancel');
    terminal(result);
    assert.equal(result.owner.hardViolation, false);
    assert.equal(result.owner.notificationViolation, false);
    assert.equal(result.owner.foundationProjection.candidateObserverGate, 'UNPROVEN');
    assert.equal(result.owner.notificationCount, 1);
    assert.equal(result.fixtureSnapshot.callCounts.pipe.writeDebugPipe, 1);
    assert.throws(() => rejected(result), { name: 'AssertionError' });
  });
}

function registerAdapterRuntimeBoundaryTests({ test, assert, withAdapterCopy, runVirtualAdapterScenario, createSourcePlan }) {
  const encode = text => new TextEncoder().encode(text)
  const lines = { vite: '  ➜  Local:   http://127.0.0.1:5173/\n', gateway: 'Das lokale SyncGateway lauscht ausschließlich auf 127.0.0.1.\n' }
  const terminal = result => {
    assert.equal(result.outcome.kind, 'error')
    assert.equal(result.owner.runState, 'terminal')
    assert.equal(result.owner.ownerFinalizationCount, 1)
    assert.equal(result.owner.writerCallCount, 0)
    assert.equal(result.owner.activeExchange, null)
    assert.equal(result.owner.waitingDequeueResolver, null)
  }
  const run = async (options, mutation = null) => withAdapterCopy('virtual-runtime-conformance', mutation, async namespace =>
    runVirtualAdapterScenario(namespace, { sourcePlan: await createSourcePlan(), scenario: 'capture-cap', ...options }))
  for (const role of ['vite', 'gateway']) for (const variant of ['exact', 'split-every-byte', 'CRLF', 'duplicate', 'ANSI-wrapper', 'window-last-byte', 'window-incomplete']) {
    /* ADR0038:register:test */ g36CaseTest('L5420', 'registerAdapterRuntimeBoundaryTests', `ADR 0036 Readiness: ${role}/${variant} uses only the exact raw stdout window`, { concurrency: false }, async () => {
      let callbackCount = 0, boundaryError = null
      const accepted = ['exact', 'split-every-byte', 'window-last-byte'].includes(variant)
      const result = await run({
        readinessActions(ordinals) {
          const actions = []
          for (const candidate of ['vite', 'gateway']) {
            let text = lines[candidate]
            const selected = candidate === role
            if (selected && variant === 'CRLF') text = text.replace('\n', '\r\n')
            if (selected && variant === 'duplicate') text += text
            if (selected && variant === 'ANSI-wrapper') text = '\u001b[32m' + text + '\u001b[0m'
            if (selected && variant === 'window-last-byte') text = 'x'.repeat(65536 - encode(text).length) + text
            if (selected && variant === 'window-incomplete') text = 'x'.repeat(65536 - encode(text).length + 1) + text.slice(0, -1)
            const bytes = encode(text), childOrdinal = ordinals[`${candidate}Ordinal`]
            if (selected && variant === 'split-every-byte') {
              for (const byte of bytes) actions.push({ kind: 'child-stdout', childOrdinal, bytes: new Uint8Array([byte]) })
            } else actions.push({ kind: 'child-stdout', childOrdinal, bytes })
          }
          return actions
        },
        assertAfterReadiness(owner, snapshot) {
          callbackCount += 1
          try {
            assert.equal(snapshot.callCounts.pipe.writeDebugPipe, 0)
            if (accepted) assert.equal(owner.childLedger[role].readiness, 'seen-once')
            else assert.notEqual(owner.childLedger[role].readiness, 'seen-once')
            if (variant === 'duplicate') assert.equal(owner.childLedger[role].readiness, 'ambiguous')
            assert.equal(owner.childLedger[role].outputOverflow, false)
          } catch (error) { boundaryError = error }
        },
      })
      terminal(result)
      assert.equal(callbackCount, 1)
      if (boundaryError !== null) throw boundaryError
      assert.equal(result.fixtureSnapshot.callCounts.pipe.writeDebugPipe, accepted ? 6 : 0)
      if (!accepted) assert.equal(result.owner.terminalOutcome?.observerGate, 'FAIL')
    })
  }
  for (const [role, ordinal, checkId] of [['chrome', 3, 'browserStopped'], ['vite', 1, 'devServerStopped'], ['gateway', 2, 'gatewayStopped']]) {
    for (const event of ['child-exit', 'child-close']) {
      /* ADR0038:register:test */ g36CaseTest('L5461', 'registerAdapterRuntimeBoundaryTests', `ADR 0036 Child lifecycle: ${role}/${event} leaves descendant cleanup unproven`, { concurrency: false }, async () => {
        const result = await run({ rawBeforeCaptureCap: () => [{ kind: event, childOrdinal: ordinal, code: 0, signal: null }] })
        terminal(result)
        assert.equal(result.owner.childLedger[role].rootState, 'terminal')
        assert.equal(result.owner.cleanupLedger.steps.get(checkId).result, 'unproven')
        assert.equal(result.fixtureSnapshot.callCounts.launcher.terminateChild, 2)
        assert.equal(result.fixtureSnapshot.callCounts.launcher.closeChild, event === 'child-close' ? 2 : 3)
        assert.notEqual(result.owner.childLedger[role].stopFailed, true)
      })
    }
  }
  for (const capability of ['terminateChild', 'closeChild']) {
    /* ADR0038:register:test */ g36CaseTest('L5473', 'registerAdapterRuntimeBoundaryTests', `ADR 0036 Child lifecycle: observed ${capability} failure stays failed`, { concurrency: false }, async () => {
      const result = await run({ rawBeforeCaptureCap: () => [{ kind: 'fail-next-capability-call', capability }] })
      terminal(result)
      assert.equal(result.owner.childLedger.chrome.stopFailed, true)
      assert.equal(result.owner.cleanupLedger.steps.get('browserStopped').result, 'failed')
      assert.equal(result.owner.terminalOutcome.observerGate, 'FAIL')
      assert.equal(result.owner.terminalOutcome.finding, 'observer-invalid')
    })
  }
  for (const role of ['vite', 'gateway']) {
    /* ADR0038:register:test */ g36CaseTest('L5483', 'registerAdapterRuntimeBoundaryTests', `ADR 0036 Readiness causal mutant: ${role} ANSI guard removal admits the identical wrapped line`, { concurrency: false }, async () => {
      const options = { readinessActions(ordinals) {
        return ['vite', 'gateway'].map(candidate => ({ kind: 'child-stdout', childOrdinal: ordinals[`${candidate}Ordinal`],
          bytes: encode(candidate === role ? '\u001b[32m' + lines[candidate] + '\u001b[0m' : lines[candidate]) }))
      } }
      const baseline = await run(options)
      terminal(baseline)
      assert.notEqual(baseline.owner.childLedger[role].readiness, 'seen-once')
      assert.equal(baseline.fixtureSnapshot.callCounts.pipe.writeDebugPipe, 0)
      const changed = await run(options, { name: `READINESS_${role.toUpperCase()}_ANSI_GUARD_REMOVED`,
        from: '    if (byte === 0x1b) {', to: `    if (child.role !== '${role}' && byte === 0x1b) {` })
      terminal(changed)
      assert.equal(changed.owner.childLedger[role].readiness, 'seen-once')
      assert.equal(changed.fixtureSnapshot.callCounts.pipe.writeDebugPipe, 6)
    })
  }
  for (const [role, ordinal, checkId] of [['chrome', 3, 'browserStopped'], ['vite', 1, 'devServerStopped'], ['gateway', 2, 'gatewayStopped']]) {
    /* ADR0038:register:test */ g36CaseTest('L5500', 'registerAdapterRuntimeBoundaryTests', `ADR 0036 Child lifecycle causal mutant: ${role} already-closed guard removal touches the retired handle`, { concurrency: false }, async () => {
      const options = { rawBeforeCaptureCap: () => [{ kind: 'child-close', childOrdinal: ordinal, code: 0, signal: null }] }
      const baseline = await run(options)
      terminal(baseline)
      assert.equal(baseline.owner.cleanupLedger.steps.get(checkId).result, 'unproven')
      assert.equal(baseline.fixtureSnapshot.callCounts.launcher.closeChild, 2)
      const changed = await run(options, { name: `CHILD_${role.toUpperCase()}_ALREADY_CLOSED_GUARD_REMOVED`,
        from: '  if (!child.closeAttempted && child.streamsTerminal !== true) {',
        to: `  if (!child.closeAttempted && (child.role === '${role}' || child.streamsTerminal !== true)) {` })
      terminal(changed)
      assert.equal(changed.owner.childLedger[role].stopFailed, true)
      assert.equal(changed.owner.cleanupLedger.steps.get(checkId).result, 'failed')
      assert.equal(changed.fixtureSnapshot.callCounts.launcher.closeChild, 3)
    })
  }
}

function registerAdapterCommandProfileTests({ test, assert, withAdapterCopy, runVirtualAdapterScenario, createSourcePlan }) {
  const commands = ['Target.getTargets', 'Target.attachToTarget', 'Network.enable', 'Runtime.evaluate', 'Network.disable', 'Target.detachFromTarget']
  const vectors = []
  for (let index = 0; index < commands.length; index += 1) {
    vectors.push({ name: `${commands[index]} extra params`, index, alter: '{ params: { ...intent.payload.params, forbiddenAdapterParameter: true } }' })
    vectors.push({ name: `${commands[index]} capture-arm mismatch`, index, alter: `{ captureArmIntentId: ${index === 3 ? 'intent.payload.captureArmIntentId + 1' : '123'} }` })
    vectors.push({ name: `${commands[index]} session mismatch`, index,
      alter: index === 5 ? "{ params: { sessionId: 'different-bound-session' } }" :
        index === 2 ? '{ sessionId: null }' : "{ sessionId: 'different-bound-session' }" })
  }
  for (const command of ['Runtime.callFunctionOn', 'Runtime.getProperties', 'Network.getResponseBody', 'Fetch.enable', 'Debugger.enable', 'Profiler.enable', 'Tracing.start']) {
    vectors.push({ name: `forbidden seventh command ${command}`, index: 0, alter: `{ command: '${command}' }` })
  }
  for (const [name, value] of [['zero', '0'], ['negative', '-1'], ['string', "'1'"], ['unsafe', '9007199254740992']]) {
    vectors.push({ name: `command ID ${name}`, index: 0, alter: `{ commandId: ${value} }` })
  }
  for (const vector of vectors) {
    /* ADR0038:register:test */ g36CaseTest('L5534', 'registerAdapterCommandProfileTests', `ADR 0036 Command profile: ${vector.name} stops before the corresponding raw write`, { concurrency: false }, async () => {
      const command = commands[vector.index]
      const mutation = {
        name: 'COMMAND_PROFILE_' + vector.name.toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
        from: '      return adapterExchange(owner, intent)',
        to: `      if (intent.kind === 'protocol-command-send' && intent.payload.command === '${command}') {\n        const changedIntent = { ...intent, payload: { ...intent.payload, ...${vector.alter} } }\n        adapterFreezeData(changedIntent)\n        return adapterExchange(owner, changedIntent)\n      }\n      return adapterExchange(owner, intent)`,
      }
      await withAdapterCopy('virtual-runtime-conformance', mutation, async namespace => {
        const result = await runVirtualAdapterScenario(namespace, {
          sourcePlan: await createSourcePlan(), scenario: vector.index === 0 ? 'first-command-rejected' : 'capture-cap',
        })
        assert.equal(result.outcome.kind, 'error')
        assert.equal(result.owner.runState, 'terminal')
        assert.equal(result.owner.ownerFinalizationCount, 1)
        assert.equal(result.owner.writerCallCount, 0)
        assert.equal(result.owner.hardViolation, true)
        assert.equal(result.fixtureSnapshot.callCounts.pipe.writeDebugPipe, vector.index)
        assert.equal(result.owner.wireLedger.operations[vector.index].acceptedFrameCount, 0)
        assert.equal(result.owner.wireLedger.operations[vector.index].ackCount, 0)
        for (let index = 0; index < vector.index; index += 1) assert.equal(result.owner.wireLedger.operations[index].acceptedFrameCount, 1)
        if (vector.index === 0) {
          assert.equal(result.owner.attemptStarted, false)
          assert.equal(result.owner.finalizationCount, 0)
          assert.equal(result.owner.terminalOutcome, null)
        } else {
          assert.equal(result.owner.terminalOutcome.observerGate, 'FAIL')
          assert.equal(result.owner.terminalOutcome.finding, 'observer-invalid')
        }
      })
    })
  }
}

function r0ReplaySeedFixture(fixture, overrides = new Map()) {
  const values = new Map([
    ['readDiagnosticRunIdEntropyBytes', new Uint8Array(17).fill(17)], ['readReplayContextIdEntropyBytes', new Uint8Array(15).fill(29)],
    ['readWallMilliseconds', 1789257600000], ['readTimeZone', 'UTC'], ['readProcessPlatform', 'win32'],
    ['readProcessArchitecture', 'x64'], ['readProcessVersion', 'v24.19.0'], ['readProcessExecutablePath', 'C:\\NodeFixture\\node.exe'],
    ['readProcessExecArguments', ['--experimental-vm-modules', '--no-warnings']], ['readWorkingDirectory', 'C:\\GoldenDawnFixture'],
  ])
  for (const name of ['NODE_OPTIONS','SystemRoot','WINDIR','ComSpec','PATHEXT','Path','TEMP','TMP','LOCALAPPDATA','ProgramFiles','ProgramFiles(x86)','ProgramW6432']) values.set('process-environment:' + name, name === 'TEMP' ? [{ name, value: 'C:\\GoldenDawnFixtureTemp' }] : [])
  for (const [source, replacement] of overrides) values.set(source, replacement)
  for (const [source, value] of values) fixture.controller.dispatch({ kind: 'source-return', source, value })
}
function r0ReplayNormativeRows(assert, rawFiles) {
  const bytes = rawFiles.get('docs/decisions/0033-browser-sync-transport-diagnostic-foundation-effects-protocol-boundary.md')
  assert.ok(bytes instanceof Uint8Array)
  const document = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes)
  const rows = [...document.matchAll(/^\| ([0-9]+) \| `([^`]+)` \| ([ARDC]) \| `([^`]+)` \|/gm)].map(match => {
    const number = Number(match[1])
    const historical = [24, 40].includes(number) ? match[4] === 'true' : [48, 52].includes(number) ? Number(match[4]) : match[4]
    return { number, fieldId: match[2], historical, basis: { A: 'historical-commit-artifact-sha256', R: 'historical-record-value', D: 'historical-record-closed-derivation', C: 'historical-commit-closed-derivation' }[match[3]] }
  })
  assert.equal(rows.length, 59)
  assert.deepEqual(rows.map(row => row.number), Array.from({ length: 59 }, (_, index) => index + 1))
  assert.equal(rows[52].historical.length, 6)
  assert.deepEqual([...rows[52].historical].map(value => value.charCodeAt(0)), [34,56,55,56,55,34])
  return rows
}
function registerAdapterR0ReplayTests({ test, assert, withAdapterCopy, runVirtualAdapterScenario, loadSourceFixtureFiles, createVirtualRuntimeFixture }) {
  let filesPromise = null, controlPromise = null
  const observedRawProofs = new WeakMap()
  const files = () => filesPromise ??= Promise.resolve().then(loadSourceFixtureFiles)
  /* ADR0038:register:test */ g36CaseTest('L5597', 'registerAdapterR0ReplayTests', 'ADR 0036 R0: caller-provided Foundation digest is rejected by both public factory and run arity',{concurrency:false},async()=>{
    await withAdapterCopy('virtual-runtime-conformance',null,async namespace=>{
      const fixture=createVirtualRuntimeFixture()
      const supplied=Object.freeze({foundationSha256:'d4cadf656bb50e2b062c9d0d66e3f895bc87649362ce995abfbdbe24a9f4e731'})
      const isStaticArgumentError=(error,prototype)=>Object.getPrototypeOf(error)===prototype&&Reflect.ownKeys(error).length===1&&error.message==='invalidBrowserSyncTransportRuntimeDiagnosticAdapterArguments'
      assert.throws(()=>namespace.createBrowserSyncTransportRuntimeDiagnosticAdapter(supplied),error=>isStaticArgumentError(error,TypeError.prototype))
      const owner=namespace.createBrowserSyncTransportRuntimeDiagnosticAdapterOwner(fixture.runtimeCapabilities)
      await assert.rejects(owner.api.run(supplied),error=>isStaticArgumentError(error,Error.prototype))
      assert.ok(Object.values(fixture.controller.snapshot().callCounts).every(group=>Object.values(group).every(count=>count===0)))
      assert.equal(owner.r0,null)
      assert.equal(owner.sourceState,null)
      assert.equal(owner.writerCallCount,0)
    })
  })
  const badR0 = [
    ...['WIN32','linux','win32 ',' win32',null,32].map(value => ['platform ' + JSON.stringify(value), 'readProcessPlatform', value]),
    ...['arm64','x86','X64','x64 ',null,64].map(value => ['architecture ' + JSON.stringify(value), 'readProcessArchitecture', value]),
    ...['24.19.0','vv24.19.0','V24.19.0','v24.19.0-rc.1','v24.19.0+build',' v24.19.0','v24.19.0 ','v024.19.0','v24.019.0','v24.19.00','v24.19.1','v24.20.0',null,24].map(value => ['Node version ' + JSON.stringify(value), 'readProcessVersion', value]),
    ...[-1, 0.5, Number.MAX_SAFE_INTEGER + 1, null, '1789257600000'].map(value => ['wall milliseconds ' + JSON.stringify(value), 'readWallMilliseconds', value]),
    ...['', 'Europe', 'UTC ', 'Europe/Berlin\0', null].map(value => ['timezone ' + JSON.stringify(value), 'readTimeZone', value]),
    ['NODE_OPTIONS is present', 'process-environment:NODE_OPTIONS', [{ name: 'NODE_OPTIONS', value: '--inspect' }]],
    ['case-ambiguous TEMP matches', 'process-environment:TEMP', [{ name: 'TEMP', value: 'C:\\A' }, { name: 'temp', value: 'C:\\B' }]],
    ['wrong environment name', 'process-environment:TEMP', [{ name: 'TMP', value: 'C:\\A' }]],
    ['nonstring environment value', 'process-environment:TEMP', [{ name: 'TEMP', value: 8787 }]],
    ['wrong exec argument', 'readProcessExecArguments', ['--experimental-vm-modules', '--inspect']],
    ['extra exec argument', 'readProcessExecArguments', ['--experimental-vm-modules', '--no-warnings', '--inspect']],
  ]
  for (const [name, source, value] of badR0) /* ADR0038:register:test */ g36CaseTest('L5624', 'registerAdapterR0ReplayTests', 'ADR 0036 R0: reject ' + name + ' before source or runtime effects', { concurrency: false }, async () => {
    await withAdapterCopy('virtual-runtime-conformance', null, async namespace => {
      const fixture = createVirtualRuntimeFixture()
      r0ReplaySeedFixture(fixture, new Map([[source, value]]))
      const owner = namespace.createBrowserSyncTransportRuntimeDiagnosticAdapterOwner(fixture.runtimeCapabilities)
      let outcome
      try { outcome = { kind: 'result', result: await owner.api.run() } } catch (error) { outcome = { kind: 'error', error } }
      sourceFixtureError(assert, outcome)
      const snapshot = fixture.controller.snapshot()
      for (const group of ['resources','scheduler','pipe','launcher']) assert.ok(Object.values(snapshot.callCounts[group]).every(count => count === 0))
      assert.equal(owner.r0, null)
      assert.equal(owner.sourceState, null)
      assert.equal(owner.ownerFinalizationCount, 1)
      assert.equal(owner.writerCallCount, 0)
    })
  })
  /* ADR0038:register:test */ g36CaseTest('L5640', 'registerAdapterR0ReplayTests', 'ADR 0036 R0: public factory also rejects a doubled Node version prefix before source reads', { concurrency: false }, async () => {
    await withAdapterCopy('virtual-runtime-conformance', null, async namespace => {
      const fixture = createVirtualRuntimeFixture()
      r0ReplaySeedFixture(fixture, new Map([['readProcessVersion', 'vv24.19.0']]))
      namespace.installBrowserSyncTransportRuntimeDiagnosticVirtualCapabilities(fixture.runtimeCapabilities)
      let outcome
      try { outcome = { kind: 'result', result: await namespace.createBrowserSyncTransportRuntimeDiagnosticAdapter().run() } } catch (error) { outcome = { kind: 'error', error } }
      sourceFixtureError(assert, outcome)
      const snapshot = fixture.controller.snapshot()
      assert.equal(snapshot.callCounts.runtime.readProcessVersion, 1)
      for (const group of ['resources','scheduler','pipe','launcher']) assert.ok(Object.values(snapshot.callCounts[group]).every(count => count === 0))
    })
  })
  async function full({ mutation = null, entry = 'owner', scenario = 'capture-cap' } = {}) {
    const sourcePlan = createAdapterSourceFixturePlan(await files())
    let imported = false, result, rawProof = null
    await withAdapterCopy('virtual-runtime-conformance', mutation, async namespace => {
      imported = true
      result = await runVirtualAdapterScenario(namespace, { entry, sourcePlan, scenario, assertAfterReadiness(owner) {
        if (owner === null) return
        assert.equal(rawProof, null)
        const matches = owner.childLedger.gateway.spawnProfile.environment.filter(record => record.name === 'GOLDENDAWN_SYNC_GATEWAY_PORT')
        assert.equal(matches.length, 1)
        rawProof = Object.freeze({ platform: owner.r0.platform, architecture: owner.r0.architecture,
          version: owner.r0.version, port: matches[0].value })
      } })
    })
    if (rawProof !== null) observedRawProofs.set(result, rawProof)
    assert.equal(imported, true)
    assert.equal(result.completedSourceEntries, sourcePlan.preflight.length)
    sourceFixtureError(assert, result.outcome)
    return result
  }
  function completed(result) {
    assert.equal(result.fixtureSnapshot.callCounts.launcher.spawnChild, 3)
    assert.equal(result.fixtureSnapshot.callCounts.pipe.writeDebugPipe, 6)
    assert.notEqual(result.owner.foundationProjection, null)
    assert.equal(result.owner.notificationCount, 1)
    assert.equal(result.owner.finalizationCount, 1)
    assert.equal(result.owner.writerCallCount, 0)
  }
  const control = () => controlPromise ??= full().then(result => { completed(result); return result })
  const freshControl = () => full().then(result => { completed(result); return result })
  const observed = new Set([1,2,3,4,5,6,7,8,11,17,41,42,43,44,45,46,47,48,49,50,51,52,53,54,56,57,58,59])
/* ADR0038:sync */let g36ReplayRowRole='control';/* ADR0038:end */  function assertRows(rows, result) {
    const comparisons = result.owner.foundationProjection.replay.equivalence.comparisons
    assert.equal(comparisons.length, 59)
    assert.equal(Object.isFrozen(comparisons), true)
    for (let index = 0; index < 59; index += 1) {
      const actual = comparisons[index], expected = rows[index], known = observed.has(index + 1)
      assert.deepEqual(Reflect.ownKeys(actual), ['fieldId','comparisonBasis','observationState','historicalValue','replayValue','result'])
      assert.equal(actual.fieldId, expected.fieldId)
      assert.equal(actual.comparisonBasis, expected.basis)
      assert.equal(actual.historicalValue, expected.historical)
      assert.equal(actual.observationState, known ? 'observed' : 'not-observed', 'operand ' + (index + 1))
      assert.equal(actual.replayValue, known ? expected.historical : null, 'operand ' + (index + 1))
      assert.equal(actual.result, known ? 'match' : 'unproven', 'operand ' + (index + 1))
      assert.equal(Object.isFrozen(actual), true)/* ADR0038:sync */;g36Variant('replay-normative-'+g36ReplayRowRole,index+1);/* ADR0038:end */
    }
    assert.equal(comparisons.filter(row => row.observationState === 'observed').length, 28)
  }
  /* ADR0038:register:test */ g36CaseTest('L5701', 'registerAdapterR0ReplayTests', 'ADR 0036 Replay: all59 independently pinned normative rows have exact observed or unavailable sources', { concurrency: false }, async () => {
    const result = await control()
    assertRows(r0ReplayNormativeRows(assert, await files()), result)
    const rawProof = observedRawProofs.get(result)
    assert.equal(rawProof.platform, 'win32')
    assert.equal(rawProof.architecture, 'x64')
    assert.equal(rawProof.version, 'v24.19.0')
    assert.equal(result.owner.r0, null)
    assert.equal(result.owner.foundationProjection.replay.equivalence.comparisons[16].replayValue, '24.19.0')
    assert.equal(result.owner.foundationProjection.replay.repositoryState, null)
    assert.equal(result.owner.terminalOutcome.evidenceStatus, 'NOT_EVIDENCE')
  })
  /* ADR0038:register:test */ g36CaseTest('L5713', 'registerAdapterR0ReplayTests', 'ADR 0036 Replay: public factory consumes the same closed59-operand boundary', { concurrency: false }, async () => {
    await control()
    const result = await full({ entry: 'factory' })
    assert.equal(result.owner, null)
    assert.equal(result.fixtureSnapshot.callCounts.launcher.spawnChild, 3)
    assert.equal(result.fixtureSnapshot.callCounts.pipe.writeDebugPipe, 6)
  })
  function rawPort(result) {
    const rawProof = observedRawProofs.get(result)
    assert.notEqual(rawProof, undefined, 'raw environment must be read from the genuine owner before terminal disposal')
    assert.equal(result.owner.childLedger.gateway.spawnProfile, null)
    const value = rawProof.port
    assert.equal(typeof value, 'string')
    assert.equal(value, '8787')
    assert.equal(value.length, 4)
    assert.deepEqual([...value].map(character => character.charCodeAt(0)), [56,55,56,55])
    return value
  }
  /* ADR0038:register:test */ g36CaseTest('L5731', 'registerAdapterR0ReplayTests', 'ADR 0036 Replay operand53: raw gateway8787 stays separate from the six-codeunit quoted comparison', { concurrency: false }, async () => {
    const result = await control(), raw = rawPort(result)
    const row = result.owner.foundationProjection.replay.equivalence.comparisons[52]
    assert.equal(row.fieldId, 'gateway.portEnvironmentValue')
    assert.equal(row.replayValue, '"8787"')
    assert.equal(row.replayValue.length, 6)
    assert.deepEqual([...row.replayValue].map(character => character.charCodeAt(0)), [34,56,55,56,55,34])
    assert.notEqual(row.replayValue, raw)
    assert.equal(row.result, 'match')
  })
  const row53Anchor = "values.set(53, '\"' + port + '\"')"
  for (const [name, expression, expected] of [
    ['raw port used as replay operand', 'port', '8787'],
    ['double quote wrapping', "'\"\"' + port + '\"\"'", '""8787""'],
    ['double JSON wrapping', 'adapterStringify(adapterStringify(port))', JSON.stringify(JSON.stringify('8787'))],
    ['whitespace normalization temptation', "'\" ' + port + ' \"'", '" 8787 "'],
    ['changed digit', "'\"8788\"'", '"8788"'],
  ]) /* ADR0038:register:test */ g36CaseTest('L5748', 'registerAdapterR0ReplayTests', 'ADR 0036 Replay operand53 causal specimen: ' + name, { concurrency: false }, async () => {
    const baseline = await freshControl()
    assert.equal(baseline.owner.foundationProjection.replay.equivalence.comparisons[52].result, 'match')
    const changed = await full({ mutation: { name: 'operand53-' + name.replaceAll(' ', '-'), from: row53Anchor, to: 'values.set(53, ' + expression + ')' } })
    completed(changed)
    rawPort(changed)
    const row = changed.owner.foundationProjection.replay.equivalence.comparisons[52]
    assert.equal(row.replayValue, expected)
    assert.equal(row.observationState, 'observed')
    assert.equal(row.result, 'mismatch')
    // ADR 0033: DIVERGED alone is not a confirmed observer violation.
    // ADR 0036 section 12 retains evidence demotion after hard-FAIL precedence.
    assert.equal(changed.owner.foundationProjection.replay.equivalence.result, 'DIVERGED')
    assert.equal(changed.owner.terminalOutcome.observerGate, 'UNPROVEN')
    assert.equal(changed.owner.terminalOutcome.finding, 'inconclusive')
    assert.equal(changed.owner.terminalOutcome.evidenceStatus, 'NOT_EVIDENCE')
  })
  for (const [name, expression] of [['numeric port', 'Number(port)'], ['null operand', 'null']]) /* ADR0038:register:test */ g36CaseTest('L5765', 'registerAdapterR0ReplayTests', 'ADR 0036 Replay operand53: ' + name + ' stops before Foundation invocation', { concurrency: false }, async () => {
    await freshControl()
    const changed = await full({ scenario: 'pre-foundation-rejection', mutation: { name: 'operand53-' + name.replaceAll(' ', '-'), from: row53Anchor, to: 'values.set(53, ' + expression + ')' } })
    rawPort(changed)
    assert.equal(changed.fixtureSnapshot.callCounts.launcher.spawnChild, 3)
    assert.equal(changed.fixtureSnapshot.callCounts.pipe.writeDebugPipe, 0)
    assert.equal(changed.owner.foundationInstance, null)
    assert.equal(changed.owner.foundationProjection, null)
    assert.equal(changed.owner.notificationCount, 0)
  })
  const portAnchor = "const port = '8787'"
  async function rejectedRawPort(value) {
    const specimenName = [...String(value)].map(character => character.charCodeAt(0).toString(16)).join('-')
    const result = await full({ mutation: { name: 'raw-gateway-port-' + specimenName, from: portAnchor, to: 'const port = ' + JSON.stringify(value) } })
    assert.equal(result.fixtureSnapshot.callCounts.launcher.spawnChild, 1)
    assert.equal(result.fixtureSnapshot.callCounts.pipe.writeDebugPipe, 0)
    assert.equal(result.owner.terminalOwnershipFacts.resources.find(row => row.name === 'vite').boundCount, 1)
    assert.equal(result.owner.childLedger.vite.handle, null)
    assert.equal(result.owner.childLedger.gateway.handle, null)
    assert.equal(result.owner.childLedger.gateway.creation, 'never-attempted')
    assert.equal(result.owner.childLedger.chrome.creation, 'never-attempted')
    assert.equal(result.owner.foundationInstance, null)
    assert.equal(result.owner.writerCallCount, 0)
    return result
  }
  for (const value of ['"8787"','""8787""',' 8787 ','8787\n',8787,'8788']) /* ADR0038:register:test */ g36CaseTest('L5790', 'registerAdapterR0ReplayTests', 'ADR 0036 Raw gateway environment: reject ' + JSON.stringify(value) + ' before gateway spawn', { concurrency: false }, async () => {
    await control()
    await rejectedRawPort(value)
  })
  for (const [name, value, normalize] of [
    ['trim-whitespace', ' 8787 ', 'port.trim()'],
    ['coerce-number', 8787, 'String(port)'],
    ['decode-quoted-raw', '"8787"', 'adapterParse(port)'],
  ]) /* ADR0038:register:test */ g36CaseTest('L5798', 'registerAdapterR0ReplayTests', 'ADR 0036 Raw gateway environment causal mutant: forbidden ' + name + ' changes the same invalid raw specimen into an accepted launch', { concurrency: false }, async () => {
    await freshControl()
    const rejected = await rejectedRawPort(value)
    const changed = await full({ mutation: { name: 'gateway-normalization-' + name, from: portAnchor, to: 'let port = ' + JSON.stringify(value) + '; port = ' + normalize } })
    completed(changed)
    rawPort(changed)
    assert.equal(rejected.fixtureSnapshot.callCounts.launcher.spawnChild, 1)
    assert.equal(changed.fixtureSnapshot.callCounts.launcher.spawnChild, 3)
    assert.equal(changed.owner.foundationProjection.replay.equivalence.comparisons[52].replayValue, '"8787"')
  })
  for (const [number, value] of [[9,'clean'],[13,'x64'],[18,'chrome'],[23,'visible'],[24,true],[25,'fresh-disposable'],[30,'inactive'],[32,'absent'],[37,'http://127.0.0.1:5173/'],[40,true],[55,'matches-frontend-origin']]) /* ADR0038:register:test */ g36CaseTest('L5808', 'registerAdapterR0ReplayTests', 'ADR 0036 Replay causal mutant: operand' + number + ' cannot gain an observation from static configuration', { concurrency: false }, async () => {
    const baseline = await freshControl()
    assert.equal(baseline.owner.foundationProjection.replay.equivalence.comparisons[number - 1].observationState, 'not-observed')
    const anchor = "values.set(11, 'windows')"
    const changed = await full({ mutation: { name: 'unobserved-replay-operand-' + number, from: anchor, to: anchor + '; values.set(' + number + ', ' + JSON.stringify(value) + ')' } })
    completed(changed)
    const row = changed.owner.foundationProjection.replay.equivalence.comparisons[number - 1]
    assert.equal(row.observationState, 'observed')
    assert.equal(row.replayValue, value)
    const rows = r0ReplayNormativeRows(assert, await files())
/* ADR0038:sync */g36ReplayRowRole='control';/* ADR0038:end */    assertRows(rows, baseline)
/* ADR0038:sync */g36ReplayRowRole='mutant';/* ADR0038:end */    assert.throws(() => assertRows(rows, changed), error => error?.name === 'AssertionError' && error.message.includes('operand ' + number))
  })
  return { r0NegativeCases: badR0.length + 1, normativeReplayRows: 59, operand53StringSpecimens: 5, operand53TypeCases: 2, rawPortCases: 6, rawNormalizationCausalCases: 3 }
}

function registerAdapterTerminalDisposalTests({ test, assert, withAdapterCopy, runVirtualAdapterScenario, loadSourceFixtureFiles }) {
  let filesPromise = null
  const files = () => filesPromise ??= Promise.resolve().then(loadSourceFixtureFiles)
  async function run(entry = 'owner', mutation = null) {
    const plan = createAdapterSourceFixturePlan(await files())
    let result, imported = false
    await withAdapterCopy('virtual-runtime-conformance', mutation, async namespace => {
      imported = true
      result = await runVirtualAdapterScenario(namespace, { entry, sourcePlan: plan, scenario: 'capture-cap' })
    })
    assert.equal(imported, true)
    assert.equal(result.completedSourceEntries, plan.preflight.length)
    assert.equal(result.fixtureSnapshot.callCounts.launcher.spawnChild, 3)
    assert.equal(result.fixtureSnapshot.callCounts.pipe.writeDebugPipe, 6)
    sourceFixtureError(assert, result.outcome)
    return result
  }
  function sourceDiscarded(owner) {
    assert.equal(owner.r0, null)
    assert.equal(owner.foundationInstance, null)
    const source = owner.sourceState
    assert.equal(source.profile, 'adr-0036-terminal-source-summary-v1')
    assert.equal(source.captureCompleted, true)
    assert.equal(source.loadCount, 1)
    assert.equal(source.loadVerified, true)
    assert.equal(source.instanceCreated, true)
    assert.equal(source.actualLoadedSha256, 'd4cadf656bb50e2b062c9d0d66e3f895bc87649362ce995abfbdbe24a9f4e731')
    for (const key of ['foundation','module','namespace','factory','factoryInstance']) assert.equal(source[key], null)
    for (const key of ['worktree','git','gitBaseline','snapshots','openResources','parentIdentities','evaluationString','repositoryRoot','nodeExecutable','chromeExecutable','artifactHashes','frontendPaths']) assert.equal(Object.hasOwn(source, key), false, 'discard source storage ' + key)
    const visit = value => {
      if (value === null || ['boolean','number'].includes(typeof value)) return
      if (typeof value === 'string') { assert.doesNotMatch(value, /[A-Za-z]:[\\/]|file:\/\/|data:text\/javascript/); return }
      assert.equal(typeof value, 'object')
      assert.equal(value instanceof Uint8Array, false)
      assert.equal(Object.isFrozen(value), true)
      assert.ok(Array.isArray(value) || Object.getPrototypeOf(value) === Object.prototype)
      for (const key of Object.keys(value)) visit(value[key])
    }
    visit(source)
  }
  function identifiersDiscarded(owner) {
    assert.equal(owner.pendingRawBindings.length, 0)
    assert.equal(owner.producerBindings.size, 0)
    assert.equal(owner.resourceLedger.handles.size, 0)
    assert.equal(owner.resourceLedger.operations.size, 0)
    assert.equal(owner.activeRunToken, null)
    assert.equal(owner.lastDequeuedSequence, null)
    for (const key of ['nextGeneration','nextResourceOperationId','nextIntentId','nextFifoSequence']) assert.equal(owner[key], 0)
    for (const cap of Object.values(owner.capLedger)) {
      assert.equal(cap.handle, null)
      assert.equal(cap.armIntentId, null)
      assert.equal(cap.generation, 0)
    }
    assert.equal(owner.pipeLedger.pair, null)
    for (const key of ['generation','activeWriteGeneration','terminalWriteGeneration']) assert.equal(owner.pipeLedger[key], 0)
    for (const child of Object.values(owner.childLedger)) {
      assert.equal(child.handle, null)
      assert.equal(child.generation, 0)
      assert.equal(child.spawnProfile, null)
    }
    for (const row of owner.wireLedger.operations) for (const key of ['commandId','sessionId','params']) assert.equal(row[key], null)
    for (const resource of [owner.resourceLedger.profile, owner.resourceLedger.temporaryRoot]) for (const key of ['handle','path','identity']) assert.equal(resource[key], null)
    assert.equal(owner.activeExchange, null)
    assert.equal(owner.waitingDequeueResolver, null)
    assert.equal(owner.lastDequeuedMaterial, null)
    assert.deepEqual(owner.fifo, [])
    assert.deepEqual(owner.pipeLedger.accumulator, [])
  }
  function completed(owner) {
    assert.equal(owner.notificationCount, 1)
    assert.equal(owner.finalizationCount, 1)
    assert.equal(owner.ownerFinalizationCount, 1)
    assert.notEqual(owner.foundationProjection, null)
    assert.notEqual(owner.adapterObservationSnapshot, null)
    assert.equal(owner.writerCallCount, 0)
    assert.equal(owner.runState, 'terminal')
    assert.equal(owner.terminalOutcome.evidenceStatus, 'NOT_EVIDENCE')
  }
  async function control() {
    const result = await run()
    completed(result.owner)
    sourceDiscarded(result.owner)
    identifiersDiscarded(result.owner)
    assert.equal(result.owner.terminalOutcome.observerGate, 'UNPROVEN')
    assert.equal(result.owner.terminalOwnershipFacts.capGenerationDistinctCount, 3)
    assert.equal(result.owner.terminalOwnershipFacts.profileResourceState, 'closed')
    assert.equal(result.owner.terminalOwnershipFacts.harnessResourceState, 'closed')
    return result
  }
  /* ADR0038:register:test */ g36CaseTest('L5913', 'registerAdapterTerminalDisposalTests', 'ADR 0036 Terminal disposal: actual owner retains only primitive terminal evidence after public settlement', { concurrency: false }, async () => {
    await control()
  })
  /* ADR0038:register:test */ g36CaseTest('L5916', 'registerAdapterTerminalDisposalTests', 'ADR 0036 Terminal disposal: public factory completes the same source and cleanup path with only a static rejection', { concurrency: false }, async () => {
    const result = await run('factory')
    assert.equal(result.owner, null)
    assert.deepEqual(Reflect.ownKeys(result.outcome.error), ['message'])
  })
  /* ADR0038:register:test */ g36CaseTest('L5921', 'registerAdapterTerminalDisposalTests', 'ADR 0036 Terminal disposal causal mutant: source and record-reference disposal cannot be omitted after finalization', { concurrency: false }, async () => {
    await control()
    const changed = await run('owner', { name: 'OMIT_TERMINAL_SOURCE_AND_RECORD_REFERENCE_DISPOSAL',
      from: '    adapterDiscardTerminalSources(owner)\n', to: '    void owner.sourceState\n' })
    completed(changed.owner)
    identifiersDiscarded(changed.owner)
    assert.equal(changed.owner.sourceState.worktree instanceof Map, true)
    assert.equal(changed.owner.sourceState.foundation.bytes instanceof Uint8Array, true)
    assert.equal(typeof changed.owner.sourceState.factory, 'function')
    assert.notEqual(changed.owner.foundationInstance, null)
    assert.throws(() => sourceDiscarded(changed.owner), { name: 'AssertionError' })
  })
  /* ADR0038:register:test */ g36CaseTest('L5933', 'registerAdapterTerminalDisposalTests', 'ADR 0036 Terminal disposal causal mutant: retained cap intent IDs set final FAIL before later disposal can hide them', { concurrency: false }, async () => {
    await control()
    const changed = await run('owner', { name: 'OMIT_PRE_A_FINAL_PROTOCOL_ID_DISPOSAL',
      from: '    cap.armIntentId = null\n', to: '    void cap.armIntentId\n' })
    completed(changed.owner)
    sourceDiscarded(changed.owner)
    assert.ok(Object.values(changed.owner.capLedger).some(cap => cap.armIntentId !== null))
    assert.equal(changed.owner.terminalOutcome.observerGate, 'FAIL')
    assert.equal(changed.owner.terminalOutcome.finding, 'observer-invalid')
    assert.throws(() => identifiersDiscarded(changed.owner), { name: 'AssertionError' })
  })
  return { actualOwnerControl: 1, publicFactoryControl: 1, terminalDisposalCausalMutants: 2 }
}

function registerAdapterCreationMatrixTests({ test, assert, withAdapterCopy, runVirtualAdapterScenario, createSourcePlan }) {
  const terminal = result => {
    assert.equal(result.outcome.kind, 'error')
    assert.equal(result.owner.runState, 'terminal')
    assert.equal(result.owner.attemptStarted, false)
    assert.equal(result.owner.finalizationCount, 0)
    assert.equal(result.owner.terminalOutcome, null)
    assert.equal(result.owner.ownerFinalizationCount, 1)
    assert.equal(result.owner.writerCallCount, 0)
    assert.equal(result.owner.activeExchange, null)
    assert.equal(result.owner.waitingDequeueResolver, null)
  }
  for (const [kind, spawns] of [['create-temporary-root', 0], ['create-directory-exclusive', 2]]) {
    /* ADR0038:register:test */ g36CaseTest('L5960', 'registerAdapterCreationMatrixTests', `ADR 0036 Creation matrix: asynchronous ${kind} failure preserves uncertain creation without an invented handle`, { concurrency: false }, async () => {
      await withAdapterCopy('virtual-runtime-conformance', null, async namespace => {
        const result = await runVirtualAdapterScenario(namespace, {
          sourcePlan: await createSourcePlan(), scenario: 'capture-cap',
          sourceScriptTransform(script, phase) {
            if (phase !== 'runtime-create') return script
            const index = script.findIndex(entry => entry.kind === kind)
            assert.ok(index >= 0)
            return script.slice(0, index + 1).map((entry, offset) => offset === index ? { ...entry, state: 'failed' } : entry)
          },
        })
        terminal(result)
        assert.equal(result.fixtureSnapshot.callCounts.launcher.spawnChild, spawns)
        assert.equal(result.fixtureSnapshot.callCounts.launcher.terminateChild, spawns)
        assert.equal(result.fixtureSnapshot.callCounts.launcher.closeChild, spawns)
        assert.equal(result.fixtureSnapshot.callCounts.pipe.openDebugPipe, 0)
        assert.equal(result.fixtureSnapshot.callCounts.pipe.writeDebugPipe, 0)
        assert.deepEqual(result.fixtureSnapshot.liveOrdinals.resources, [])
        assert.deepEqual(result.fixtureSnapshot.liveOrdinals.resourceOperations, [])
        const facts = result.owner.terminalOwnershipFacts
        const root = facts.resources.find(resource => resource.name === 'harness')
        const profile = facts.resources.find(resource => resource.name === 'profile')
        assert.equal(root.creationState, kind === 'create-temporary-root' ? 'may-exist' : 'bound')
        assert.equal(root.boundCount, kind === 'create-temporary-root' ? 0 : 1)
        assert.equal(profile.creationState, kind === 'create-temporary-root' ? 'never-attempted' : 'may-exist')
        assert.equal(profile.boundCount, 0)
        assert.equal(result.owner.childLedger.chrome.creation, 'never-attempted')
        assert.equal(facts.sourceResourceCount, facts.sourceResourceClosedCount)
        assert.equal(facts.sourceResourceUnknownCount, 0)
      })
    })
  }
  /* ADR0038:register:test */ g36CaseTest('L5992', 'registerAdapterCreationMatrixTests', 'ADR 0036 Creation matrix: first Vite spawn throw leaves profile create pending under the single cleanup cap', { concurrency: false }, async () => {
    await withAdapterCopy('virtual-runtime-conformance', null, async namespace => {
      const result = await runVirtualAdapterScenario(namespace, { sourcePlan: await createSourcePlan(), scenario: 'partial-vite' })
      terminal(result)
      assert.equal(result.fixtureSnapshot.callCounts.launcher.spawnChild, 1)
      assert.equal(result.fixtureSnapshot.callCounts.launcher.terminateChild, 0)
      assert.equal(result.fixtureSnapshot.callCounts.launcher.closeChild, 0)
      assert.equal(result.fixtureSnapshot.callCounts.pipe.openDebugPipe, 0)
      assert.equal(result.fixtureSnapshot.liveOrdinals.resourceOperations.length, 2)
      assert.equal(result.owner.childLedger.vite.creation, 'may-have-started')
      assert.equal(result.owner.childLedger.gateway.creation, 'never-attempted')
      assert.equal(result.owner.childLedger.chrome.creation, 'never-attempted')
      assert.equal(result.owner.cleanupLedger.steps.get('gatewayStopped').result, 'confirmed')
      assert.equal(result.owner.cleanupLedger.steps.get('browserStopped').result, 'confirmed')
      assert.equal(result.owner.cleanupLedger.steps.get('devServerStopped').result, 'unproven')
      assert.equal(result.owner.cleanupLedger.finalizeReason, 'cleanup-cap')
    })
  })
}

// Real Foundation requests and product-parsed raw CDP frames reach the 128/129
// boundary. The Foundation itself checks 129 only after fulfillment; the adapter
// must reject the request earlier, before selecting a frame or a resolver.
function registerAdr36DequeueLimitTests({ test, assert, withAdapterCopy, runVirtualAdapterScenario, createSourcePlan }) {
  const encoder = new TextEncoder();
  const benignFrames = count => encoder.encode(Array.from({ length: count }, (_, index) => JSON.stringify({
    method: 'Network.requestWillBeSent', sessionId: 'session-adr0036-fixture',
    params: { requestId: `dequeue-benign-${index}`, request: {
      url: 'http://127.0.0.1:9999/not-the-diagnostic-endpoint', method: 'GET',
    } },
  }) + '\u0000').join(''));
  const clocks = Array.from({ length: 132 }, (_, index) => 100 + 10 * index);
  const mutation = {
    name: 'DEQUEUE_129_ACCEPTED_BEFORE_FOUNDATION_LIMIT',
    from: '          owner.dequeueCount < 128 && owner.waitingDequeueResolver === null && !owner.awaitingDequeueClock)',
    to: '          owner.dequeueCount < 129 && owner.waitingDequeueResolver === null && !owner.awaitingDequeueClock)',
  };
  const countSamples = owner => owner.clockLedger.filter(row => row.reason.endsWith('dequeue-before-reflection')).length;
  const terminal = result => {
    assert.equal(result.outcome.kind, 'error');
    assert.equal(result.outcome.error.message, 'browserSyncTransportRuntimeDiagnosticAdapterFailed');
    if (result.owner === null) return;
    assert.equal(result.owner.runState, 'terminal');
    assert.equal(result.owner.ownerFinalizationCount, 1);
    assert.equal(result.owner.notificationCount, 1);
    assert.equal(result.owner.writerCallCount, 0);
    assert.equal(result.owner.activeExchange, null);
    assert.equal(result.owner.waitingDequeueResolver, null);
    assert.equal(result.owner.lastDequeuedMaterial, null);
    assert.equal(result.owner.fifo.length, 0);
    assert.equal(result.owner.fifoMaterialBytes, 0);
    assert.equal(result.owner.pipeLedger.violation, false);
  };
  const pending128 = (owner, snapshot) => {
    assert.equal(snapshot.callCounts.clock.readControllerNanoseconds, 128,
      'setup origin plus 127 allowed fulfilled observations, with no sample for pending128');
    if (owner === null) return;
    assert.equal(owner.dequeueCount, 128);
    assert.equal(countSamples(owner), 127);
    assert.equal(owner.phase, 'capture');
    assert.equal(owner.notificationCount, 0);
    assert.equal(owner.hardViolation, false);
    assert.equal(owner.pipeLedger.parseCount, 127);
    assert.equal(owner.fifo.length, 0);
    assert.equal(owner.lastDequeuedSequence, 127);
    assert.equal(owner.lastDequeuedMaterial, null);
    assert.equal(owner.awaitingDequeueClock, false);
    assert.equal(owner.activeExchange.kind, 'observation-dequeue');
    assert.equal(typeof owner.waitingDequeueResolver, 'function');
  };
  const rejected129 = (owner, snapshot, queued) => {
    assert.equal(owner.dequeueCount, 128, 'the real 129th request never consumes an adapter allowance');
    assert.equal(countSamples(owner), 128, 'only the 128 allowed fulfillments receive a controller sample');
    assert.equal(snapshot.callCounts.clock.readControllerNanoseconds, owner.clockLedger.length);
    assert.equal(owner.pipeLedger.parseCount, 128 + queued);
    assert.equal(owner.pipeLedger.violation, false);
    assert.equal(owner.notificationCount, 1, 'rejection closes the genuine Foundation observation before the saved Capture timer');
    assert.equal(owner.hardViolation, true);
    assert.equal(owner.waitingDequeueResolver, null, 'the forbidden request installs no resolver');
    assert.equal(owner.awaitingDequeueClock, false);
    assert.equal(owner.lastDequeuedMaterial, null);
    assert.equal(owner.lastDequeuedSequence, 128);
    assert.equal(owner.fifo.length, queued + 1,
      'the optional unread raw frame precedes the genuine first cleanup fact');
    if (queued === 1) {
      assert.equal(owner.fifo[0].sequence, 129);
      assert.equal(owner.fifo[0].value.kind, 'cdp-message');
      assert.ok(owner.fifo[0].materialBytes > 0);
      assert.equal(owner.fifo[0].value.value.params.requestId, 'dequeue-benign-125');
    }
    assert.equal(owner.fifo[queued].sequence, 129 + queued);
    assert.equal(owner.fifo[queued].materialBytes, 0);
    assert.deepEqual(owner.fifo[queued].value,
      { kind: 'cleanup-fact', checkId: 'debugPipeClosed', fact: true });
  };
  async function run(count, entry, changed, oracle) {
    let checkpointCount = 0;
    let checkpointFailure = null;
    let before = null;
    const bytes = benignFrames(count);
    assert.ok(bytes.byteLength <= 65536, 'one allowed raw chunk contains the complete bounded prefix');
    const result = await withAdapterCopy('virtual-runtime-conformance', changed, async namespace =>
      runVirtualAdapterScenario(namespace, { entry, sourcePlan: await createSourcePlan(), scenario: 'capture-cap',
        sourceSettlementOrder: 'post-settlement-first', controllerClockValues: clocks,
        rawBeforeCaptureCap: pipeOrdinal => [{ kind: 'pipe-chunk', pipeOrdinal, bytes }],
        rawAfterHookMicrotasks: 1024,
        assertBeforeCaptureCap(owner, snapshot) {
          checkpointCount += 1;
          if (owner !== null) before = {
            dequeueCount: owner.dequeueCount, sampleCount: countSamples(owner),
            resolverPresent: owner.waitingDequeueResolver !== null,
            awaitingClock: owner.awaitingDequeueClock, queued: owner.fifo.length,
            lastSequence: owner.lastDequeuedSequence, markerCount: owner.notificationCount,
            queue: owner.fifo.map(row => ({ sequence: row.sequence, materialBytes: row.materialBytes,
              kind: row.value.kind, checkId: row.value.checkId ?? null, fact: row.value.fact ?? null })),
          };
          try { oracle(owner, snapshot); } catch (error) { checkpointFailure = error; }
        },
      }));
    terminal(result);
    assert.equal(checkpointCount, 1);
    return { result, checkpointFailure, before };
  }
  for (const entry of ['owner', 'factory']) /* ADR0038:register:test */ g36CaseTest('L6115', 'registerAdr36DequeueLimitTests', `ADR 0036 Dequeue boundary: ${entry} accepts the 128th raw cap fulfillment`, async () => {
    const { result, checkpointFailure } = await run(124, entry, null, pending128);
    assert.equal(checkpointFailure, null);
    if (result.owner !== null) {
      assert.equal(result.owner.dequeueCount, 128);
      assert.equal(countSamples(result.owner), 128);
      assert.equal(result.owner.foundationProjection.timing.completion.observationCloseReason, 'capture-cap');
      assert.equal(result.owner.foundationProjection.timing.completion.captureWindowState, 'elapsed');
    }
  });
  for (const queued of [0, 1]) /* ADR0038:register:test */ g36CaseTest('L6125', 'registerAdr36DequeueLimitTests', `ADR 0036 Dequeue boundary causal mutant: real129 rejects before ${queued === 0 ? 'resolver installation' : 'taking an older parsed frame'}`, async () => {
    const oracle = (owner, snapshot) => rejected129(owner, snapshot, queued);
    const baseline = await run(125 + queued, 'owner', null, oracle);
    assert.equal(baseline.checkpointFailure, null);
    assert.equal(baseline.result.owner.foundationProjection.timing.completion.observationCloseReason, 'confirmed-violation');
    const changed = await run(125 + queued, 'owner', mutation, oracle);
    assert.equal(changed.checkpointFailure?.name, 'AssertionError');
    assert.equal(changed.before.dequeueCount, 129, 'the changed productive guard actually admitted request129');
    assert.equal(changed.before.sampleCount, 128, 'the unchanged Foundation prevents a 129th post-fulfillment sample');
    if (queued === 0) {
      assert.equal(changed.before.resolverPresent, true);
      assert.equal(changed.before.markerCount, 0);
    } else {
      // The mutant's admitted frame leaves no adapter rejection latch yet, so
      // Network.disable can ACK. Its outstanding reply requires a cleanup
      // dequeue, which rejects before an external cleanup step can add a fact.
      assert.equal(changed.before.queued, 0);
      assert.deepEqual(changed.before.queue, []);
      assert.equal(changed.before.lastSequence, 129);
      assert.equal(changed.before.awaitingClock, true);
    }
  });
}

function registerAdapterSourceActiveHandleTests({ test, assert, withAdapterCopy, runVirtualAdapterScenario, loadSourceFixtureFiles }) {
  let filesPromise = null
  const files = () => filesPromise ??= Promise.resolve().then(loadSourceFixtureFiles)
  function liveHandleInvariant(owner) {
    const source = owner.sourceState
    assert.equal(source.activeResourceHandles instanceof Set, true)
    const expected = new Set(source.openResources.filter(entry => !entry.closed).map(entry => entry.resourceHandle))
    const closed = source.openResources.filter(entry => entry.closed)
    assert.ok(expected.size > 0)
    assert.ok(closed.length > 0, 'confirmed closed loose objects must exist before the invariant is checked')
    assert.equal(source.activeResourceHandles.size, expected.size, 'only live source handles belong in the membership set')
    for (const handle of source.activeResourceHandles) assert.equal(expected.has(handle), true)
    for (const entry of closed) assert.equal(source.activeResourceHandles.has(entry.resourceHandle), false)
  }
  async function run(mutation = null, expectInvariantFailure = false, entry = 'owner') {
    const sourcePlan = createAdapterSourceFixturePlan(await files())
    let result, checks = 0, imported = false
    await withAdapterCopy('virtual-runtime-conformance', mutation, async namespace => {
      imported = true
      result = await runVirtualAdapterScenario(namespace, { entry, sourcePlan, scenario: 'capture-cap', assertAfterReadiness(owner) {
        if (owner === null) return
        if (expectInvariantFailure) assert.throws(() => liveHandleInvariant(owner), { name: 'AssertionError' })
        else liveHandleInvariant(owner)
        checks += 1
      } })
    })
    assert.equal(imported, true)
    assert.equal(checks, entry === 'owner' ? 1 : 0)
    assert.equal(result.completedSourceEntries, sourcePlan.preflight.length)
    assert.equal(result.fixtureSnapshot.callCounts.launcher.spawnChild, 3)
    assert.equal(result.fixtureSnapshot.callCounts.pipe.writeDebugPipe, 6)
    sourceFixtureError(assert, result.outcome)
    if (entry === 'owner') {
      assert.equal(result.owner.sourceState.profile, 'adr-0036-terminal-source-summary-v1')
      assert.equal(Object.hasOwn(result.owner.sourceState, 'activeResourceHandles'), false)
      assert.equal(result.owner.sourceState.sourceResourceUnknownCount, 0)
      assert.equal(result.owner.notificationCount, 1)
      assert.equal(result.owner.finalizationCount, 1)
      assert.equal(result.owner.terminalOutcome.observerGate, 'UNPROVEN')
    } else assert.equal(result.owner, null)
    return result
  }
  /* ADR0038:register:test */ g36CaseTest('L6191', 'registerAdapterSourceActiveHandleTests', 'ADR 0036 Source live handles: actual owner retains exactly still-open source identities', { concurrency: false }, async () => {
    await run()
  })
  /* ADR0038:register:test */ g36CaseTest('L6194', 'registerAdapterSourceActiveHandleTests', 'ADR 0036 Source live handles: public factory preserves full raw source and checkpoint path', { concurrency: false }, async () => {
    await run(null, false, 'factory')
  })
  /* ADR0038:register:test */ g36CaseTest('L6197', 'registerAdapterSourceActiveHandleTests', 'ADR 0036 Source live handles causal mutant: a confirmed close must remove its membership', { concurrency: false }, async () => {
    await run()
    await run({ name: 'OMIT_SOURCE_LIVE_HANDLE_DELETE',
      from: '  owner.sourceState.activeResourceHandles.delete(entry.resourceHandle)',
      to: '  void entry.resourceHandle' }, true)
  })
  return { sourceLiveHandleControls: 2, sourceLiveHandleCausalMutants: 1 }
}

function freeze(value) {
  if (value !== null && typeof value === 'object') {
    for (const item of Object.values(value)) freeze(item)
    Object.freeze(value)
  }
  return value
}
registerAdr36RecordDerivationTests({test, assert, freeze,
  loadRecordCopy: () => withAdapterCopy('derivation-conformance', null, namespace => namespace)})

registerAdapterSourceConformanceTests({test,assert,withAdapterCopy,runVirtualAdapterScenario,loadSourceFixtureFiles})
registerAdapterHarnessBaselineTests({test,assert,loadSourceFixtureFiles})
registerAdr36ClockContractTests({test,assert,withAdapterCopy,runVirtualAdapterScenario,
  createSourcePlan: async () => createAdapterSourceFixturePlan(await loadSourceFixtureFiles())})
registerAdapterParserQueueConformanceTests({test,assert,withAdapterCopy,runVirtualAdapterScenario,loadSourceFixtureFiles})

registerAdapterSourceCheckpointTests({test,assert,withAdapterCopy,runVirtualAdapterScenario,loadSourceFixtureFiles})
registerAdr36ObservationBindingTests({test,assert,withAdapterCopy,runVirtualAdapterScenario,createSourcePlan: async () => createAdapterSourceFixturePlan(await loadSourceFixtureFiles())})
registerAdr36DeadlineIntegrationTests({test,assert,withAdapterCopy,runVirtualAdapterScenario,createSourcePlan: async () => createAdapterSourceFixturePlan(await loadSourceFixtureFiles())})
registerAdapterWireLifecycleTests({test,assert,withAdapterCopy,runVirtualAdapterScenario,createSourcePlan: async () => createAdapterSourceFixturePlan(await loadSourceFixtureFiles())})
registerAdr36RecordMutationTests({test,assert,withAdapterCopy,freeze})

registerAdapterByteBoundaryTests({test,assert,withAdapterCopy,runVirtualAdapterScenario,loadSourceFixtureFiles,createVirtualRuntimeFixture})

registerAdr36ProducerCapTests({test,assert,withAdapterCopy,runVirtualAdapterScenario,createSourcePlan:async()=>createAdapterSourceFixturePlan(await loadSourceFixtureFiles())})
registerAdr36InvalidClockTests({test,assert,withAdapterCopy,runVirtualAdapterScenario,createSourcePlan:async()=>createAdapterSourceFixturePlan(await loadSourceFixtureFiles())})
registerAdr36CapabilityThrowTests({test,assert,withAdapterCopy,runVirtualAdapterScenario,createSourcePlan:async()=>createAdapterSourceFixturePlan(await loadSourceFixtureFiles())})
registerAdr36UnavailableCleanupCapTests({test,assert,withAdapterCopy,runVirtualAdapterScenario,createSourcePlan:async()=>createAdapterSourceFixturePlan(await loadSourceFixtureFiles())})
registerAdr36ReplayRecordMatrixTests({test,assert,withAdapterCopy,freeze})
registerAdr36EffectPortProfileTests({test,assert,withAdapterCopy,runVirtualAdapterScenario,createSourcePlan:async()=>createAdapterSourceFixturePlan(await loadSourceFixtureFiles())})
registerAdapterRuntimeBoundaryTests({test,assert,withAdapterCopy,runVirtualAdapterScenario,createSourcePlan:async()=>createAdapterSourceFixturePlan(await loadSourceFixtureFiles())})
registerAdapterCommandProfileTests({test,assert,withAdapterCopy,runVirtualAdapterScenario,createSourcePlan:async()=>createAdapterSourceFixturePlan(await loadSourceFixtureFiles())})
registerAdapterR0ReplayTests({test,assert,withAdapterCopy,runVirtualAdapterScenario,loadSourceFixtureFiles,createVirtualRuntimeFixture})

registerAdapterTerminalDisposalTests({test,assert,withAdapterCopy,runVirtualAdapterScenario,loadSourceFixtureFiles})
registerAdapterCreationMatrixTests({test,assert,withAdapterCopy,runVirtualAdapterScenario,createSourcePlan:async()=>createAdapterSourceFixturePlan(await loadSourceFixtureFiles())})
registerAdr36DequeueLimitTests({test,assert,withAdapterCopy,runVirtualAdapterScenario,createSourcePlan:async()=>createAdapterSourceFixturePlan(await loadSourceFixtureFiles())})

registerAdapterSourceActiveHandleTests({test,assert,withAdapterCopy,runVirtualAdapterScenario,loadSourceFixtureFiles})

// Additional creation, identity, wire and cleanup boundaries use only the
// productive adapter and closed virtual capabilities. Fault copies retain the
// same four-export profile and change one explicitly named productive source site.
function registerAdapterRemainingBoundaryCandidates({ test, assert, withAdapterCopy,
  runVirtualAdapterScenario, createSourcePlan }) {
  const run = async (options = {}, mutation = null) => {
    const sourcePlan = await createSourcePlan()
    return withAdapterCopy('virtual-runtime-conformance', mutation, namespace =>
      runVirtualAdapterScenario(namespace, { sourcePlan, scenario: 'capture-cap', ...options }))
  }
  const terminal = result => {
    assert.equal(result.outcome.kind, 'error')
    assert.equal(Object.getPrototypeOf(result.outcome.error), Error.prototype)
    assert.deepEqual(Reflect.ownKeys(result.outcome.error), ['message'])
    assert.equal(result.outcome.error.message, 'browserSyncTransportRuntimeDiagnosticAdapterFailed')
    if (result.owner === null) return
    assert.equal(result.owner.runState, 'terminal')
    assert.equal(result.owner.ownerFinalizationCount, 1)
    assert.equal(result.owner.writerCallCount, 0)
    assert.equal(result.owner.activeExchange, null)
    assert.equal(result.owner.waitingDequeueResolver, null)
  }
  const noProtocolStart = result => {
    terminal(result)
    assert.equal(result.fixtureSnapshot.callCounts.pipe.openDebugPipe, 0)
    assert.equal(result.fixtureSnapshot.callCounts.pipe.writeDebugPipe, 0)
    assert.deepEqual(result.fixtureSnapshot.liveOrdinals.resources, [])
    assert.deepEqual(result.fixtureSnapshot.liveOrdinals.resourceOperations, [])
    if (result.owner === null) return
    assert.equal(result.owner.attemptStarted, false)
    assert.equal(result.owner.notificationCount, 0)
    assert.equal(result.owner.finalizationCount, 0)
    assert.equal(result.owner.terminalOutcome, null)
  }
  const resourceFact = (owner, name) => owner.terminalOwnershipFacts.resources.find(row => row.name === name)

  // Existing prestart already injects the third (Chrome) spawn failure after
  // profile identity validation. The new assertions prove its exact ownership.
  for (const entry of ['owner', 'factory']) /* ADR0038:register:test */ g36CaseTest('L6284', 'registerAdapterRemainingBoundaryCandidates', `ADR 0036 Creation matrix: ${entry} Chrome spawn throw owns only Vite and Gateway`, { concurrency: false }, async () => {
    const result = await run({ entry, scenario: 'prestart' })
    noProtocolStart(result)
    assert.equal(result.fixtureSnapshot.callCounts.launcher.spawnChild, 3)
    assert.equal(result.fixtureSnapshot.callCounts.launcher.terminateChild, 2)
    assert.equal(result.fixtureSnapshot.callCounts.launcher.closeChild, 2)
    if (result.owner === null) return
    const owner = result.owner
    assert.equal(owner.childLedger.chrome.creation, 'may-have-started')
    assert.equal(resourceFact(owner, 'browser').boundCount, 0)
    for (const role of ['vite', 'gateway']) {
      assert.equal(owner.childLedger[role].creation, 'may-have-started')
      assert.equal(resourceFact(owner, role).boundCount, 1)
      assert.equal(owner.childLedger[role].terminateAttempted, true)
      assert.equal(owner.childLedger[role].closeAttempted, true)
    }
    for (const [name, state] of [['profile', 'profileResourceState'], ['harness', 'harnessResourceState']]) {
      assert.equal(resourceFact(owner, name).boundCount, 1)
      assert.equal(owner.terminalOwnershipFacts[state], 'closed')
      assert.equal(resourceFact(owner, name).terminalCount, 0, 'closing a handle is not path removal')
    }
    for (const id of ['browserStopped', 'devServerStopped', 'gatewayStopped', 'profileRemoved', 'harnessFragmentsRemoved']) {
      assert.equal(owner.cleanupLedger.steps.get(id).result, 'unproven')
    }
  })

  // A lazy completed control result proves the unchanged source/creation path
  // even when a diagnostic filter selects only a dependent negative case.
  // It does not cache a namespace, module, owner used for another run, or source
  // plan. Every negative and every actual load still uses a fresh copy/plan.
  let creationControlPromise = null
  const creationControl = () => creationControlPromise ??= run().then(result => {
    terminal(result)
    assert.equal(result.fixtureSnapshot.callCounts.launcher.spawnChild, 3)
    assert.equal(result.fixtureSnapshot.callCounts.pipe.writeDebugPipe, 6)
    assert.equal(result.owner.hardViolation, false)
    assert.equal(result.owner.terminalOutcome.observerGate, 'UNPROVEN')
    assert.equal(result.owner.cleanupViolation, false)
    assert.equal(result.owner.terminalOwnershipFacts.profileResourceState, 'closed')
    assert.equal(result.owner.terminalOwnershipFacts.harnessResourceState, 'closed')
    assert.deepEqual(result.owner.sourceState.checkpoints.map(row => [row.phase, row.state]),
      [['pre-o0', 'verified'], ['post-settlement', 'verified'], ['post-cleanup', 'verified']])
    return Object.freeze({ completed: true, closeResourceCount: result.fixtureSnapshot.callCounts.resources.closeResource })
  })
  const identityVectors = [
    ...['root-parent', 'profile-parent'].flatMap(target => [
      { target, field: 'fileId', value: '900099' },
      { target, field: 'reparsePoint', value: true },
    ]),
    ...['root-held', 'profile-held'].flatMap(target => [
      { target, field: 'fileId', value: '900099' },
      { target, field: 'volumeId', value: '900099' },
    ]),
  ]
  for (const vector of identityVectors) /* ADR0038:register:test */ g36CaseTest('L6338', 'registerAdapterRemainingBoundaryCandidates', `ADR 0036 Runtime identity: ${vector.target}/${vector.field} stops the next creation`, { concurrency: false }, async () => {
    await creationControl()
    let transformedCount = 0
    const rootFailure = vector.target.startsWith('root-')
    const result = await run({
      sourceScriptTransform(script, phase) {
        if (phase !== 'runtime-create') return script
        transformedCount += 1
        let index
        if (vector.target.endsWith('-parent')) {
          const candidates = script.map((entry, offset) => ({ entry, offset })).filter(({ entry }) =>
            entry.kind === 'inspect-path' && entry.path === 'C:\\GoldenDawnFixtureTemp')
          assert.equal(candidates.length, 3)
          index = candidates[rootFailure ? 1 : 2].offset
        } else {
          const candidates = script.map((entry, offset) => ({ entry, offset })).filter(({ entry }) => entry.kind === 'inspect-open-resource')
          assert.equal(candidates.length, 2)
          index = candidates[rootFailure ? 0 : 1].offset
        }
        return script.slice(0, index + 1).map((entry, offset) => offset === index
          ? { ...entry, result: { ...entry.result, [vector.field]: vector.value } } : entry)
      },
    })
    assert.equal(transformedCount, 1)
    noProtocolStart(result)
    assert.equal(result.fixtureSnapshot.callCounts.launcher.spawnChild, rootFailure ? 0 : 2)
    assert.equal(result.fixtureSnapshot.callCounts.launcher.terminateChild, rootFailure ? 0 : 2)
    assert.equal(result.fixtureSnapshot.callCounts.launcher.closeChild, rootFailure ? 0 : 2)
    const owner = result.owner
    assert.equal(owner.childLedger.chrome.creation, 'never-attempted')
    assert.equal(resourceFact(owner, 'harness').boundCount, 1)
    assert.equal(owner.terminalOwnershipFacts.harnessResourceState, 'closed')
    assert.equal(resourceFact(owner, 'profile').boundCount, rootFailure ? 0 : 1)
    assert.equal(owner.resourceLedger.profile.creation, rootFailure ? 'never-attempted' : 'may-exist')
    assert.equal(owner.terminalOwnershipFacts.profileResourceState, rootFailure ? 'unbound' : 'closed')
    assert.equal(owner.cleanupLedger.steps.get('browserStopped').result, 'confirmed')
  })

  for (const [role, ordinal, checkId] of [['chrome', 3, 'browserStopped'], ['vite', 1, 'devServerStopped'], ['gateway', 2, 'gatewayStopped']]) {
    /* ADR0038:register:test */ g36CaseTest('L6377', 'registerAdapterRemainingBoundaryCandidates', `ADR 0036 mandatory mutant: ${role} root exit is not process-tree success`, { concurrency: false }, async () => {
      const options = { rawBeforeCaptureCap: () => [{ kind: 'child-exit', childOrdinal: ordinal, code: 0, signal: null }] }
      const oracle = result => {
        terminal(result)
        assert.equal(result.owner.childLedger[role].rootState, 'terminal')
        assert.equal(result.owner.cleanupLedger.steps.get(checkId).result, 'unproven')
      }
      const baseline = await run(options)
      oracle(baseline)
      const changed = await run(options, {
        name: `ROOT_${role.toUpperCase()}_EXIT_AS_TREE_SUCCESS`,
        from: "  return child.stopFailed ? 'failed' : 'unproven'",
        to: `  return child.stopFailed ? 'failed' : child.role === '${role}' && child.rootState === 'terminal' ? 'confirmed' : 'unproven'`,
      })
      terminal(changed)
      assert.equal(changed.fixtureSnapshot.callCounts.launcher.terminateChild, baseline.fixtureSnapshot.callCounts.launcher.terminateChild)
      assert.equal(changed.fixtureSnapshot.callCounts.launcher.closeChild, baseline.fixtureSnapshot.callCounts.launcher.closeChild)
      assert.equal(changed.owner.cleanupLedger.steps.get(checkId).result, 'confirmed')
      assert.throws(() => oracle(changed), assert.AssertionError)
    })
  }

  // Actual early fulfillment, not merely an increment of an Ack counter. The
  // same partial raw write is supplied to both copies. The driver releases the
  // saved Setup timer only after the same fixed prefix in both runs.
  /* ADR0038:register:test */ g36CaseTest('L6402', 'registerAdapterRemainingBoundaryCandidates', 'ADR 0036 mandatory mutant: Ack before raw write cannot turn partial acceptance into a Foundation send', { concurrency: false }, async () => {
    const options = { scenario: 'rejection-quiescence', releaseFirstSetupCap: true }
    const oracle = result => {
      terminal(result)
      assert.equal(result.fixtureSnapshot.callCounts.pipe.writeDebugPipe, 1)
      assert.equal(result.owner.wireLedger.operations[0].acceptedFrameCount, 0)
      assert.equal(result.owner.wireLedger.operations[0].ackCount, 0)
      assert.equal(result.owner.foundationProjection.observer.protocolOperations[0].observedCountClass, 'unknown')
    }
    const baseline = await run(options)
    oracle(baseline)
    const changed = await run(options, {
      name: 'ACK_BEFORE_RAW_WRITE',
      from: "      } else if (kind === 'protocol-command-send') result = adapterSendCommand(owner, payload)",
      to: "      } else if (kind === 'protocol-command-send') {\n        if (payload.command === 'Target.getTargets') fulfill(adapterFreeze({ kind: 'protocol-command-send-result', commandId: payload.commandId, sendState: 'sent' }))\n        result = adapterSendCommand(owner, payload)\n      }",
    })
    terminal(changed)
    assert.equal(changed.fixtureSnapshot.callCounts.pipe.writeDebugPipe, 1)
    assert.equal(changed.owner.wireLedger.operations[0].acceptedFrameCount, 0)
    assert.equal(changed.owner.foundationProjection.observer.protocolOperations[0].observedCountClass, 'one')
    assert.throws(() => oracle(changed), assert.AssertionError)
  })

  // A check-before-path-delete mutant requests removal after actual canonical
  // and held-handle identity checks. The unchanged virtual grammar rejects the
  // unknown verb before a raw sink or host operation. This proves rejection of
  // a forbidden removal REQUEST, not execution or safety of native deletion.
  for (const method of ['rm', 'rmdir', 'unlink']) /* ADR0038:register:test */ g36CaseTest('L6429', 'registerAdapterRemainingBoundaryCandidates', `ADR 0036 mandatory mutant: checked path cannot authorize a ${method} resource request`, { concurrency: false }, async () => {
    const baseline = await creationControl()
    const oracle = result => {
      terminal(result)
      assert.equal(result.owner.terminalOwnershipFacts.profileResourceState, 'closed')
      assert.equal(result.owner.terminalOwnershipFacts.harnessResourceState, 'closed')
      assert.equal(result.owner.cleanupViolation, false)
    }
    const changed = await run({}, {
      name: `CHECK_BEFORE_PATH_${method.toUpperCase()}_REQUEST`,
      from: '        await closeBrowserSyncTransportRuntimeDiagnosticResource(owner, resource.handle)',
      to: `        await performBrowserSyncTransportRuntimeDiagnosticResourceOperation(owner, '${method}', { path: resource.path })`,
    })
    terminal(changed)
    assert.equal(changed.owner.capabilityError, true)
    assert.equal(changed.owner.cleanupViolation, true)
    assert.equal(changed.owner.terminalOutcome.observerGate, 'FAIL')
    assert.equal(changed.owner.terminalOutcome.finding, 'observer-invalid')
    assert.equal(changed.owner.terminalOwnershipFacts.profileResourceState, 'unknown')
    assert.equal(changed.owner.terminalOwnershipFacts.harnessResourceState, 'unknown')
    assert.equal(changed.fixtureSnapshot.callCounts.resources.closeResource, baseline.closeResourceCount - 2)
    assert.equal(changed.fixtureSnapshot.liveOrdinals.resources.length, 2)
    assert.deepEqual(changed.fixtureSnapshot.liveOrdinals.resourceOperations, [])
    assert.equal(changed.owner.notificationCount, 1)
    assert.equal(changed.owner.finalizationCount, 1)
    assert.deepEqual(changed.owner.sourceState.checkpoints.map(row => [row.phase, row.state]),
      [['pre-o0', 'verified'], ['post-settlement', 'verified'], ['post-cleanup', 'verified']])
    assert.throws(() => oracle(changed), assert.AssertionError)
  })

  // These copy faults alter the actual primitive passed by the productive
  // wrapper. They are malformed-input controls, not a second fixture protocol.
  const expressionCases = [
    ['byte drift', "intent.payload.params.expression.replace('const A', 'const B')"],
    ['UTF8 BOM drift', "'\\ufeff' + intent.payload.params.expression"],
    ['whitespace normalization drift', "intent.payload.params.expression.replace('const A', 'const\\tA')"],
    ['second literal string source', "'void 0'"],
  ]
  for (const [name, expression] of expressionCases) /* ADR0038:register:test */ g36CaseTest('L6467', 'registerAdapterRemainingBoundaryCandidates', `ADR 0036 Evaluation binding: ${name} rejects before raw Evaluate write`, { concurrency: false }, async () => {
    await creationControl()
    const changed = await run({}, {
      name: 'EVALUATION_INPUT_' + name.toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
      from: '      return adapterExchange(owner, intent)',
      to: `      if (intent.kind === 'protocol-command-send' && intent.payload.command === 'Runtime.evaluate') {\n        const changedIntent = { ...intent, payload: { ...intent.payload, params: { ...intent.payload.params, expression: ${expression} } } }\n        adapterFreezeData(changedIntent)\n        return adapterExchange(owner, changedIntent)\n      }\n      return adapterExchange(owner, intent)`,
    })
    terminal(changed)
    assert.equal(changed.owner.hardViolation, true)
    assert.equal(changed.fixtureSnapshot.callCounts.pipe.writeDebugPipe, 3)
    assert.equal(changed.owner.wireLedger.operations[3].acceptedFrameCount, 0)
    assert.equal(changed.owner.wireLedger.operations[3].ackCount, 0)
    assert.equal(changed.owner.captureOrigin, null)
    assert.equal(changed.owner.terminalOutcome.observerGate, 'FAIL')
  })

  let expressionWireControlPromise = null
  const expressionWireControl = () => expressionWireControlPromise ??= (async () => {
    const plan = await createSourcePlan()
    let expectedHash
    try {
      const expression = g36HarnessEvaluation(plan)
      expectedHash = g36HarnessHash(g36HarnessFrame({ id: 4, method: 'Runtime.evaluate',
        params: { expression, awaitPromise: true, returnByValue: true, generatePreview: false },
        sessionId: 'session-adr0036-fixture' }))
    } finally { disposeAdapterSourceFixturePlan(plan) }
    const baseline = await run()
    terminal(baseline)
    assert.equal(baseline.fixtureSnapshot.callCounts.pipe.writeDebugPipe, 6)
    assert.equal(baseline.owner.wireLedger.operations[3].frameSha256, expectedHash)
    assert.equal(baseline.owner.wireLedger.operations[3].acceptedFrameCount, 1)
    return Object.freeze({ expectedHash })
  })()
  for (const [name, replacement] of [['same-length-byte', "wire.params.expression.replace('const A', 'const B')"],
    ['second-string-after-validation', "wire.params.expression.slice(0, -1) + ' '"]]) {
    /* ADR0038:register:test */ g36CaseTest('L6502', 'registerAdapterRemainingBoundaryCandidates', `ADR 0036 Evaluation causal mutant: ${name} cannot hide behind the constant expression hash`, { concurrency: false }, async () => {
      const baseline = await expressionWireControl()
      const oracle = result => {
        terminal(result)
        assert.equal(result.fixtureSnapshot.callCounts.pipe.writeDebugPipe, 6)
        assert.equal(result.owner.wireLedger.operations[3].frameSha256, baseline.expectedHash)
      }
      const changed = await run({}, {
        name: 'EVALUATION_WIRE_' + name.toUpperCase().replaceAll('-', '_'),
        from: '  const serialized = adapterStringify(wire)',
        to: `  const serialized = adapterStringify(command === 'Runtime.evaluate' ? { ...wire, params: { ...wire.params, expression: ${replacement} } } : wire)`,
      })
      terminal(changed)
      assert.equal(changed.fixtureSnapshot.callCounts.pipe.writeDebugPipe, 6)
      assert.equal(changed.owner.wireLedger.operations[3].acceptedFrameCount, 1)
      assert.equal(changed.owner.wireLedger.operations[3].ackCount, 1)
      assert.equal(changed.owner.wireLedger.evaluationSha256, 'a623ffafee8dfcbc1d2ddc374cc35f0dbf800defd97619a3b58337d972090f7b')
      assert.notEqual(changed.owner.wireLedger.operations[3].frameSha256, baseline.expectedHash)
      assert.throws(() => oracle(changed), assert.AssertionError)
    })
  }
}

registerAdapterRemainingBoundaryCandidates({test,assert,withAdapterCopy,runVirtualAdapterScenario,
  createSourcePlan:async()=>createAdapterSourceFixturePlan(await loadSourceFixtureFiles())})
// ADR0038-BEGIN
export const adapterTestPlan = g36Registry.finish()
// ADR0038-END
