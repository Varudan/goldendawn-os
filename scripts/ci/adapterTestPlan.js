import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, lstatSync, realpathSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

// ADR 0038: this module describes only the existing adapter test registrations.
// It never imports production capabilities or executes a test callback in plan mode.
export const ADAPTER_GROUPS = Object.freeze(['source', 'parser', 'record', 'boundary', 'lifecycle', 'timing'])
export const ADAPTER_BASELINE = Object.freeze({
  byteLength: 463641,
  sha256: 'cf8cd3802e2ae2904f6743a5c3ad7535b1dcd2d11029a1dbb59b19d8e704f6c7',
  cases: 1010,
  distinctNames: 1000,
})
export const ADAPTER_PLAN_BASELINE = Object.freeze({
  sha256: '1ec700dba82e0e93aa60c01968b717434fa22d4dd51e25d3cc4a0da576dc09a6',
  cases: 1010,
  groupCases: Object.freeze({ source: 193, parser: 122, record: 222, boundary: 318, lifecycle: 102, timing: 53 }),
  additionalVariants: 1312,
  obligations: 2322,
})
const suitePath = fileURLToPath(new URL('../../tests/browserSyncTransportRuntimeDiagnosticAdapter.test.js', import.meta.url))
const repositoryRoot = path.dirname(path.dirname(suitePath))
const hash = value => createHash('sha256').update(value).digest('hex')
const familyGroups = Object.freeze({
  fixture: 'boundary', publicBoundary: 'boundary',
  registerAdapterSourceConformanceTests: 'source',
  registerAdapterSourceCheckpointTests: 'source',
  registerAdapterSourceActiveHandleTests: 'source',
  registerAdapterParserQueueConformanceTests: 'parser',
  registerAdr36DequeueLimitTests: 'parser',
  registerAdr36RecordDerivationTests: 'record',
  registerAdr36RecordMutationTests: 'record',
  registerAdr36ReplayRecordMatrixTests: 'record',
  registerAdapterByteBoundaryTests: 'boundary',
  registerAdr36EffectPortProfileTests: 'boundary',
  registerAdapterCommandProfileTests: 'boundary',
  registerAdapterR0ReplayTests: 'boundary',
  registerAdapterHarnessBaselineTests: 'lifecycle',
  registerAdr36ObservationBindingTests: 'lifecycle',
  registerAdapterWireLifecycleTests: 'lifecycle',
  registerAdr36CapabilityThrowTests: 'lifecycle',
  registerAdapterRuntimeBoundaryTests: 'lifecycle',
  registerAdapterTerminalDisposalTests: 'lifecycle',
  registerAdapterCreationMatrixTests: 'lifecycle',
  registerAdapterRemainingBoundaryCandidates: 'lifecycle',
  registerAdr36ClockContractTests: 'timing',
  registerAdr36DeadlineIntegrationTests: 'timing',
  registerAdr36ProducerCapTests: 'timing',
  registerAdr36InvalidClockTests: 'timing',
  registerAdr36UnavailableCleanupCapTests: 'timing',
})

export function readAdapterSelection(environment = process.env) {
  assert.ok(Object.keys(environment).filter(name => name.startsWith('GD_ADAPTER_')).every(name =>
    ['GD_ADAPTER_GROUP', 'GD_ADAPTER_MODE', 'GD_ADAPTER_REPORT'].includes(name)), 'unknown adapter configuration')
  const group = environment.GD_ADAPTER_GROUP
  const mode = environment.GD_ADAPTER_MODE
  assert.ok(group === undefined || ADAPTER_GROUPS.includes(group), 'unknown or empty adapter group')
  assert.ok(mode === undefined || mode === 'plan', 'unknown adapter mode')
  assert.ok(mode !== 'plan' || group === undefined, 'plan mode cannot select a group')
  assert.ok(mode !== 'plan' || environment.GD_ADAPTER_REPORT === undefined, 'plan mode cannot write a result')
  if (environment.GD_ADAPTER_REPORT !== undefined) {
    assert.ok(environment.GD_ADAPTER_REPORT.length > 0 && path.isAbsolute(environment.GD_ADAPTER_REPORT), 'adapter report path must be absolute')
  }
  if (group !== undefined) {
    const flags = [...process.execArgv, environment.NODE_OPTIONS ?? ''].join(' ')
    assert.doesNotMatch(flags, /--test-(?:name-pattern|skip-pattern|only|shard)(?:[=\s]|$)/, 'adapter groups cannot be filtered or sharded')
  }
  return { group: group ?? 'all', planOnly: mode === 'plan' }
}

// The exact inverse makes assertion preservation independently checkable. Only
// the declared registration substitutions and synchronous ADR0038 additions are
// removed; every original source byte (including all helper/oracle code) remains.
export function reconstructAdapterBaseline(source) {
  assert.equal(typeof source, 'string')
  return source.replaceAll('\r\n', '\n')
    .replace(/\/\/ ADR0038-BEGIN\n[\s\S]*?\/\/ ADR0038-END\n/g, '')
    .replace(/\/\* ADR0038:register:(test|g36FixtureTest) \*\/ g36CaseTest\('L\d+', '[A-Za-z0-9]+', /g, '$1(')
    .replace(/\/\* ADR0038:sync \*\/[\s\S]*?\/\* ADR0038:end \*\//g, '')
}

export function verifyAdapterBaseline(source = readFileSync(suitePath, 'utf8')) {
  const reconstructed = reconstructAdapterBaseline(source)
  assert.equal(Buffer.byteLength(reconstructed), ADAPTER_BASELINE.byteLength, 'adapter baseline byte length changed')
  assert.equal(hash(reconstructed), ADAPTER_BASELINE.sha256, 'adapter baseline assertions or fixtures changed')
  return { ...ADAPTER_BASELINE, reconstructedSha256: hash(reconstructed) }
}

// This expectation is deliberately independent from the reconstructed source
// baseline and is not serialized into the plan that it authenticates.
export function verifyAdapterPlan(plan) {
  assert.equal(plan.cases.length, ADAPTER_PLAN_BASELINE.cases, 'adapter plan case count changed')
  const groupCases = Object.fromEntries(ADAPTER_GROUPS.map(group =>
    [group, plan.cases.filter(entry => entry.group === group).length]))
  assert.deepEqual(groupCases, ADAPTER_PLAN_BASELINE.groupCases, 'adapter plan group case counts changed')
  const obligations = plan.cases.reduce((count, entry) => count + entry.variants.length, 0)
  assert.equal(obligations - plan.cases.length, ADAPTER_PLAN_BASELINE.additionalVariants,
    'adapter plan additional variant count changed')
  assert.equal(obligations, ADAPTER_PLAN_BASELINE.obligations, 'adapter plan obligation count changed')
  assert.equal(hash(JSON.stringify(plan)), ADAPTER_PLAN_BASELINE.sha256, 'adapter plan identity changed')
  return plan
}

// Explicit source-bound iteration labels are generated from the same immutable
// literals used by the baseline; the 59-row matrix is exposed by registration.
function expectedVariants(site, name, bodySha256, details) {
  const variants = [`body:${bodySha256}`]
  const add = (domain, values) => variants.push(...values.map(value => `${domain}:${value}`))
  if (site === 'L1319') add('fixture-invalid-dispatch', ['null', 'array', 'number', 'empty-record', 'cdp-message', 'cap-fired', 'connection-closed', 'cleanup-fact', 'source-extra-key', 'environment-case', 'timer-zero', 'timer-fractional', 'kind-accessor'])
  if (site === 'L1336') {
    add('fixture-clock-enqueue', [100, 6099, 6100, 6101])
    add('fixture-clock-consume', [100, 6099, 6100, 6101])
  }
  if (site === 'L1696') add('fixture-byte-input', ['over-cap', 'nonwhole-buffer', 'shared-buffer', 'resizable-buffer', 'subclass', 'detached', 'proxy'])
  if (site === 'L1901') add('export-arity', ['createBrowserSyncTransportRuntimeDiagnosticAdapter', 'deriveBrowserSyncTransportRuntimeDiagnosticRecordGate', 'deriveBrowserSyncTransportRuntimeDiagnosticRecordFinding', 'finalizeBrowserSyncTransportRuntimeDiagnosticRecord'])
  if (site === 'L1934') add('finding-sequence', ['OPTIONS-204-POST-200-loadingFinished', 'other', 'incomplete', 'ambiguous'])
  if (site === 'L2047') add('protocol-close', name.endsWith('networkDomainClosed') ? [2, 4] : [1, 5])
  if (site === 'L2095') add('receipt-order', ['0', '-1', '1.5', '2', 'NaN', '9007199254740992', 'duplicate'])
  if (site === 'L3122') add('installer-arguments', ['empty', 'undefined', 'extra'])
  if (site === 'L3688') add('network-stage', ['preflight-request-observed', 'preflight-204-observed', 'post-request-observed'])
  if (site === 'L4636') add('byte-descriptor', ['buffer', 'byteLength', 'Symbol(Symbol.toStringTag)'])
  if (site === 'L5350') {
    add('caller-seam', ['effectPort', 'exchange', 'observationClosed', 'runBinding', 'clock', 'scheduler', 'pipe', 'launcher', 'resources', 'promise', 'then'])
    add('caller-input', ['seam', 'promise'])
  }
  if (site === 'L5204') {
    assert.equal(details.replayFields.length, 59)
    add('replay-control', details.replayFields)
    add('replay-mutant', details.replayFields)
  }
  if (site === 'L5701' || site === 'L5808') {
    assert.equal(details.replayFields.length, 59)
    add('replay-normative-control', Array.from({ length: 59 }, (_, index) => index + 1))
    if (site === 'L5808') {
      const operand = Number(name.match(/operand([0-9]+)/)[1])
      add('replay-normative-mutant', Array.from({ length: operand - 1 }, (_, index) => index + 1))
    }
  }
  return variants.sort()
}

const malformedFoundationKeys = ['historical-hash', 'duplicate-field-id', 'os-family', 'cleanup-id', 'integrity-count', 'request-budget', 'cause-status']
// The distinction is source-bound: input matrices get individual runtime marks;
// schema/property scans and driver loops retain every original assertion and
// schedule and are covered by the successful callback plus exact reconstruction.
// A property scan is not an additional independent input vector.
const internalIterationAudit = Object.freeze({
  finiteInputMatrices: [1326, 1349, 1350, 1709, 1936, 2098, 3126, 4637, 5354, 5358, 5208, 5211, 5688],
  additionallyMarkedSchemaRows: [1904, 2050, 3691],
  schemaAndStateEnumerations: [1289, 1292, 1301, 1306, 1308, 3001, 3024, 3073, 3138, 3250, 4250, 4270,
    4574, 4659, 5553, 5633, 5650, 5851, 5852, 5860, 5871, 5872, 5878, 5879, 5884, 5885, 6160, 6161, 6294, 6300, 6305],
  controlledScheduling: [366, 424, 439, 538, 543, 684, 721, 1630, 1632, 2405],
  unchangedInfrastructure: 'Remaining loops construct, encode, scan, copy, freeze or dispatch fixture data, or register the cases listed in the plan. No baseline loop or assertion is removed.',
})
let executableRegistryCreated = false

export function createAdapterTestRegistry({ nativeTest, after, sourceUrl }) {
  const selection = readAdapterSelection()
  if (!selection.planOnly) executableRegistryCreated = true
  const source = readFileSync(fileURLToPath(sourceUrl), 'utf8')
  const baseline = verifyAdapterBaseline(source)
  const cases = [], results = [], siteCounts = new Map(), ids = new Set()
  const details = { replayFields: [] }
  let active = null, finalized = false, registered = 0
  const cleanup = { created: 0, removed: 0, pending: 0, confirmed: true }
  let copyHasRoot = false
  function variant(domain, value) {
    assert.ok(active !== null && !selection.planOnly, 'variant outside an executing adapter case')
    const key = `${domain}:${String(value)}`
    if (!active.expected.has(key) || active.actual.has(key)) active.metadataViolation = true
    assert.ok(active.expected.has(key), `undeclared adapter variant ${key}`)
    assert.equal(active.actual.has(key), false, `duplicate adapter variant ${key}`)
    active.actual.add(key)
  }
  function test(site, family, name, ...argumentsList) {
    assert.equal(finalized, false)
    assert.match(site, /^L[1-9][0-9]*$/)
    assert.ok(Object.hasOwn(familyGroups, family), 'unknown registration family')
    assert.equal(typeof name, 'string')
    const callback = argumentsList.at(-1)
    assert.equal(typeof callback, 'function')
    assert.ok(argumentsList.length === 1 || argumentsList.length === 2)
    const options = argumentsList.length === 2 ? argumentsList[0] : {}
    assert.deepEqual(Object.keys(options), argumentsList.length === 2 ? ['concurrency'] : [])
    if (argumentsList.length === 2) assert.equal(options.concurrency, false)
    const occurrence = siteCounts.get(site) ?? 0
    siteCounts.set(site, occurrence + 1)
    let variantKey = name
    if (site === 'L2988') {
      assert.ok(occurrence < 8)
      variantKey = `${name.startsWith('adapter owner:') ? 'owner' : 'factory'}/${['undefined', 'null', 'run-binding-object', 'two-arguments'][occurrence % 4]}`
    } else if (site === 'L2079') {
      assert.ok(occurrence < malformedFoundationKeys.length)
      variantKey = malformedFoundationKeys[occurrence]
    }
    const bodySha256 = hash(reconstructAdapterBaseline(callback.toString()))
    const id = `${family}/${site}/${hash(variantKey)}`
    assert.equal(ids.has(id), false, 'duplicate adapter case identity')
    ids.add(id)
    const definition = { id, group: familyGroups[family], family, site, name, variantKey, bodySha256,
      variants: expectedVariants(site, name, bodySha256, details) }
    cases.push(definition)
    if (selection.planOnly || selection.group !== 'all' && selection.group !== definition.group) return
    registered += 1
    nativeTest(name, { concurrency: false }, async function adapterSerialCase(context) {
      assert.equal(active, null, 'adapter tests overlapped outside the copy helper')
      assert.equal(cleanup.pending, 0, 'previous copy lifecycle remains open')
      active = { expected: new Set(definition.variants), actual: new Set(), metadataViolation: false }
      let status = 'fail'
      try {
        await callback(context)
        assert.equal(cleanup.pending, 0, 'case completed before copy cleanup')
        assert.equal(cleanup.confirmed, true, 'copy cleanup was not confirmed')
        assert.equal(active.metadataViolation, false, 'variant failure cannot count as a causal mutant kill')
        active.actual.add(`body:${bodySha256}`)
        assert.deepEqual([...active.actual].sort(), definition.variants, 'internal adapter variant set incomplete')
        status = 'pass'
      } finally {
        results.push({ id, variants: [...active.actual].sort(), status })
        active = null
      }
    })
  }
  function finish() {
    assert.equal(finalized, false)
    finalized = true
    assert.equal(cases.length, ADAPTER_BASELINE.cases)
    assert.equal(new Set(cases.map(value => value.name)).size, ADAPTER_BASELINE.distinctNames)
    assert.equal(siteCounts.get('L2988'), 8)
    assert.equal(siteCounts.get('L2079'), 7)
    const plan = { schemaVersion: 1, groups: [...ADAPTER_GROUPS], baseline, familyGroups, internalIterationAudit, cases }
    verifyAdapterPlan(plan)
    if (!selection.planOnly) {
      assert.ok(registered > 0, 'empty adapter selection')
      after(() => {
        const passed = results.filter(result => result.status === 'pass').length
        const finalCleanup = { ...cleanup, confirmed: cleanup.confirmed && cleanup.pending === 0 && cleanup.created === cleanup.removed && active === null }
        const report = { schemaVersion: 1, group: selection.group, nodeVersion: process.versions.node,
          cases: results, completion: { registered, passed, failed: results.length - passed,
            cancelled: registered - results.length, skipped: 0, todo: 0, cleanup: finalCleanup },
          memory: { method: 'node-resource-usage', unit: 'KiB', scope: 'test-process',
            maxRss: process.resourceUsage().maxRSS, limitations: 'excludes-runner-and-descendants' } }
        if (process.env.GD_ADAPTER_REPORT !== undefined) {
          const target = path.resolve(process.env.GD_ADAPTER_REPORT)
          const parent = path.dirname(target)
          const relative = path.relative(repositoryRoot, target)
          assert.ok(path.isAbsolute(process.env.GD_ADAPTER_REPORT) && relative.startsWith(`..${path.sep}`), 'adapter report must be external')
          assert.equal(realpathSync(parent), parent)
          assert.ok(lstatSync(parent).isDirectory() && !lstatSync(parent).isSymbolicLink())
          writeFileSync(target, JSON.stringify(report) + '\n', { encoding: 'utf8', flag: 'wx' })
        }
        assert.equal(results.length, registered, 'missing adapter case completion')
        assert.equal(passed, registered, 'failed adapter case')
        assert.equal(finalCleanup.confirmed, true, 'adapter cleanup not confirmed')
      })
    }
    return plan
  }
  return {
    test, variant, finish,
    bindReplayFields(fields) { assert.deepEqual(details.replayFields, []); assert.equal(fields.length, 59); details.replayFields = [...fields] },
    assertExecutable() { assert.equal(selection.planOnly, false, 'plan mode cannot execute fixtures or copies') },
    copyBegin() { assert.ok(active !== null && !selection.planOnly); assert.equal(cleanup.pending, 0); cleanup.pending += 1; copyHasRoot = false },
    copyCreated() { assert.equal(cleanup.pending, 1); assert.equal(copyHasRoot, false); copyHasRoot = true; cleanup.created += 1 },
    copyRemoved() { assert.equal(cleanup.pending, 1); assert.equal(copyHasRoot, true); cleanup.removed += 1; copyHasRoot = false },
    copyEnd() { if (copyHasRoot || cleanup.pending !== 1) cleanup.confirmed = false; cleanup.pending -= 1 },
  }
}

let discoverySequence = 0
export async function discoverAdapterPlan() {
  assert.equal(executableRegistryCreated, false, 'cannot discover after importing an executable suite')
  const names = ['GD_ADAPTER_MODE', 'GD_ADAPTER_GROUP', 'GD_ADAPTER_REPORT']
  const previous = names.map(name => [name, process.env[name]])
  try {
    delete process.env.GD_ADAPTER_GROUP
    delete process.env.GD_ADAPTER_REPORT
    process.env.GD_ADAPTER_MODE = 'plan'
    const url = pathToFileURL(suitePath)
    url.searchParams.set('adr0038-plan', String(++discoverySequence))
    const namespace = await import(url.href)
    return verifyAdapterPlan(namespace.adapterTestPlan)
  } finally {
    for (const [name, value] of previous) {
      if (value === undefined) delete process.env[name]
      else process.env[name] = value
    }
  }
}
