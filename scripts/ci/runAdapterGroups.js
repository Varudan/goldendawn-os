import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { createHash, randomUUID } from 'node:crypto'
import { spawn, execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { discoverAdapterPlan } from './adapterTestPlan.js'
import { aggregateResults, validateGroupResult, readResultFile } from './adapterResults.js'

// ADR 0038 only: one fresh, serial test process per invocation. No local sweep.
const root = fileURLToPath(new URL('../../', import.meta.url))
const adapterFile = 'tests/browserSyncTransportRuntimeDiagnosticAdapter.test.js'
const flags = ['--experimental-vm-modules', '--no-warnings', '--test-concurrency=1', '--test-reporter=tap']
const ciVersions = ['20.19.0', '22.12.0']
const maxLogBytes = 64 * 1024 * 1024
const statusDocuments = new Set(['AGENTS.md', 'CHANGELOG.md', 'docs/architecture.md',
  'docs/data-contracts.md', 'docs/security.md', 'docs/decisions/README.md'])
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const jsonHash = value => sha256(Buffer.from(JSON.stringify(value)))
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }).trim()

function contained(parent, child) {
  const relative = path.relative(parent, child)
  return relative !== '' && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)
}

function ordinaryPath(file, directory = false) {
  const absolute = path.resolve(file)
  assert.equal(fs.realpathSync(absolute), absolute, 'noncanonical or linked path')
  const stat = fs.lstatSync(absolute)
  assert.equal(stat.isSymbolicLink(), false)
  assert.equal(directory ? stat.isDirectory() : stat.isFile(), true)
  return absolute
}

function walk(relative) {
  const result = []
  for (const entry of fs.readdirSync(path.join(root, relative), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
    assert.equal(entry.isSymbolicLink(), false, 'linked source')
    const name = `${relative}/${entry.name}`
    if (entry.isDirectory()) result.push(...walk(name))
    else { assert.equal(entry.isFile(), true); result.push(name) }
  }
  return result
}

export function bindSources() {
  const tracked = git('ls-files', '-z').split('\0').filter(Boolean)
  const sourcePaths = [...new Set([...tracked, ...walk('src'), ...walk('tests'), ...walk('scripts/ci')])]
    .filter(name => !statusDocuments.has(name)).sort()
  const files = sourcePaths.map(name => {
    assert.ok(!name.includes('..') && !path.isAbsolute(name))
    const bytes = fs.readFileSync(ordinaryPath(path.join(root, name)))
    return { path: name, bytes: bytes.length, sha256: sha256(bytes) }
  })
  const changed = new Set([...git('diff', '--name-only', 'HEAD', '--').split('\n'),
    ...git('ls-files', '--others', '--exclude-standard').split('\n')].filter(Boolean))
  return {
    head: git('rev-parse', 'HEAD'),
    uncommitted: sourcePaths.filter(name => changed.has(name)), files,
    configuration: { flags, ciVersions, adapterFile, workflow: '.github/workflows/ci.yml',
      repository: process.env.GITHUB_ACTIONS === 'true' ? process.env.GITHUB_REPOSITORY : 'local',
      workflowRef: process.env.GITHUB_ACTIONS === 'true' ? process.env.GITHUB_WORKFLOW_REF : 'local' },
  }
}

function ciContext() {
  assert.equal(process.env.GITHUB_ACTIONS, 'true', 'CI environment required')
  for (const key of ['GITHUB_RUN_ID', 'GITHUB_RUN_ATTEMPT']) assert.match(process.env[key] ?? '', /^[1-9][0-9]*$/)
  assert.ok(process.env.GITHUB_REPOSITORY && process.env.GITHUB_WORKFLOW_REF)
  assert.equal(git('rev-parse', 'HEAD'), process.env.GITHUB_SHA, 'checkout differs from workflow SHA')
  return { kind: 'ci', runId: process.env.GITHUB_RUN_ID, attempt: process.env.GITHUB_RUN_ATTEMPT }
}

async function contextFor(file) {
  if (process.env.GITHUB_ACTIONS === 'true') { assert.equal(file, undefined); return ciContext() }
  assert.ok(file, 'local verification requires an explicit context file')
  const context = await readResultFile(file)
  assert.deepEqual(Object.keys(context).sort(), ['attempt', 'kind', 'runId'])
  assert.equal(context.kind, 'local')
  assert.match(context.runId, /^adr0038-[0-9a-f-]{36}$/)
  assert.equal(context.attempt, '1')
  return context
}

function exclusiveOutput(directory) {
  const output = path.resolve(directory)
  const parent = ordinaryPath(path.dirname(output), true)
  assert.ok(output !== root && !contained(root, output), 'evidence belongs outside checkout')
  assert.ok(contained(parent, output))
  fs.mkdirSync(output) // EEXIST is a failure; never reuse another attempt's files.
  return ordinaryPath(output, true)
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' })
}

export function parseFooter(stdout, { reference = false } = {}) {
  assert.equal(typeof stdout, 'string')
  assert.equal(typeof reference, 'boolean')
  const normalized = stdout.replaceAll('\r\n', '\n')
  assert.doesNotMatch(normalized, /\r/, 'invalid native TAP line ending')
  const lines = normalized.split('\n')
  if (lines.at(-1) === '') lines.pop()

  const headerIndexes = lines.flatMap((line, index) => /^TAP version(?: |$)/.test(line) ? [index] : [])
  assert.equal(headerIndexes.length, 1, 'missing or repeated native TAP header')
  const headerIndex = headerIndexes[0]
  assert.equal(lines[headerIndex], 'TAP version 13', 'wrong native TAP header')
  if (reference) {
    const preamble = lines.slice(0, headerIndex).join('\n')
    assert.ok(preamble === '' || /^(?:\n)?> [^\n]+\n> [^\n]+\n$/.test(preamble), 'invalid reference npm banner')
  } else assert.equal(headerIndex, 0, 'native group TAP header must be first')

  const rootPlans = lines.flatMap((line, index) => /^1\.\./.test(line) ? [index] : [])
  assert.equal(rootPlans.length, 1, 'missing or repeated native root plan')
  assert.equal(rootPlans[0], lines.length - 9, 'native root plan and footer must be terminal')
  const terminal = lines.slice(-9)
  const rootMatch = terminal[0].match(/^1\.\.([0-9]+)$/)
  assert.ok(rootMatch, 'invalid native root plan')

  const labels = ['tests', 'suites', 'pass', 'fail', 'cancelled', 'skipped', 'todo', 'duration_ms']
  for (const label of labels) {
    assert.equal(lines.filter(line => new RegExp(`^# ${label}(?: |$)`).test(line)).length, 1,
      `missing or repeated native ${label} footer`)
  }
  const values = Object.fromEntries(labels.map((label, index) => {
    const match = terminal[index + 1].match(new RegExp(`^# ${label} ([^ ]+)$`))
    assert.ok(match, `invalid or misplaced native ${label} footer`)
    return [label, match[1]]
  }))
  const natural = (value, label) => {
    assert.match(value, /^(?:0|[1-9][0-9]*)$/, `invalid native ${label} count`)
    const count = Number(value)
    assert.ok(Number.isSafeInteger(count), `unsafe native ${label} count`)
    return count
  }
  const rootPlan = natural(rootMatch[1], 'root plan')
  assert.ok(rootPlan > 0, 'empty native root plan')
  const counts = Object.fromEntries(labels.slice(0, -1).map(label => [label, natural(values[label], label)]))
  assert.match(values.duration_ms, /^(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?$/,
    'invalid native duration')
  const duration = Number(values.duration_ms)
  assert.ok(Number.isFinite(duration) && duration >= 0, 'invalid native duration')
  assert.equal(counts.tests, counts.pass)
  for (const field of ['fail', 'cancelled', 'skipped', 'todo']) assert.equal(counts[field], 0)
  if (reference) assert.ok(rootPlan <= counts.tests, 'reference root plan exceeds native test count')
  else assert.equal(rootPlan, counts.tests, 'native group root plan differs from test count')
  return { tests: counts.tests, passed: counts.pass, failed: counts.fail,
    cancelled: counts.cancelled, skipped: counts.skipped, todo: counts.todo }
}

async function execute(args, output, env, reference) {
  const startedAt = new Date().toISOString()
  const started = process.hrtime.bigint()
  const descriptors = ['stdout', 'stderr'].map(name => fs.openSync(path.join(output, `${name}.log`), 'wx'))
  const sizes = [0, 0]
  let overflow = false
  const child = spawn(process.execPath, args, { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true })
  let spawnError = null
  child.on('error', error => { spawnError = error.code ?? 'SPAWN_ERROR' })
  for (const [index, stream] of [child.stdout, child.stderr].entries()) stream.on('data', chunk => {
    sizes[index] += chunk.length
    if (sizes[index] <= maxLogBytes) fs.writeSync(descriptors[index], chunk)
    else { overflow = true; child.kill() }
  })
  const native = await new Promise(resolve => child.on('close', (exitCode, signal) => resolve({ exitCode, signal, timedOut: false })))
  for (const descriptor of descriptors) fs.closeSync(descriptor)
  const endedAt = new Date().toISOString()
  const durationMs = Number(process.hrtime.bigint() - started) / 1e6
  const logs = Object.fromEntries(['stdout', 'stderr'].map(name => {
    const bytes = fs.readFileSync(path.join(output, `${name}.log`))
    return [name, { bytes: bytes.length, sha256: sha256(bytes) }]
  }))
  // This record is written by the surviving parent only AFTER native close.
  writeJson(path.join(output, 'native.json'), { executable: process.execPath, args, nodeVersion: process.versions.node,
    environment: { platform: process.platform, arch: process.arch, osRelease: os.release() },
    startedAt, endedAt, durationMs, native, spawnError, overflow, logs })
  assert.equal(spawnError, null)
  assert.equal(overflow, false, 'bounded raw log overflow')
  assert.deepEqual(native, { exitCode: 0, signal: null, timedOut: false }, 'native process failure')
  return { startedAt, endedAt, durationMs, native, logs,
    footer: parseFooter(fs.readFileSync(path.join(output, 'stdout.log'), 'utf8'), { reference }) }
}

async function runGroup(group, directory, contextFile, reference = false) {
  for (const key of Object.keys(process.env)) assert.ok(!key.startsWith('GD_ADAPTER_'), 'conflicting adapter selection environment')
  assert.equal(process.env.NODE_OPTIONS ?? '', '', 'implicit Node options are not part of this configuration')
  const context = await contextFor(contextFile)
  const plan = await discoverAdapterPlan()
  assert.ok(reference || plan.groups.includes(group), 'unknown group')
  const sources = bindSources()
  if (context.kind === 'ci') { assert.ok(ciVersions.includes(process.versions.node)); assert.deepEqual(sources.uncommitted, []) }
  const planSha256 = jsonHash(plan)
  const output = exclusiveOutput(directory)
  writeJson(path.join(output, 'binding.json'), { context, sources, plan, planSha256, nodeVersion: process.versions.node })
  const env = { ...process.env, GD_ADAPTER_REPORT: path.join(output, 'child.json') }
  if (!reference) env.GD_ADAPTER_GROUP = group
  let args = ['--test', ...flags, adapterFile]
  if (reference) {
    // Use npm's unchanged test script; the portable node entry avoids cmd quoting.
    const npmCli = path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js')
    ordinaryPath(npmCli)
    args = [npmCli, 'test', '--', ...flags]
  }
  const result = await execute(args, output, env, reference)
  assert.deepEqual(bindSources(), sources, 'source drift during test process')
  const child = await readResultFile(path.join(output, 'child.json'))
  assert.deepEqual(Object.keys(child).sort(), ['cases', 'completion', 'group', 'memory', 'nodeVersion', 'schemaVersion'])
  assert.equal(child.schemaVersion, 1)
  assert.equal(child.nodeVersion, process.versions.node)
  assert.equal(child.group, reference ? 'all' : group)
  const artifact = { schemaVersion: 1, context, sources, planSha256, nodeVersion: process.versions.node,
    group: child.group, cases: child.cases, completion: child.completion, memory: child.memory, ...result }
  if (reference) {
    const referencePlan = { ...plan, groups: ['all'], cases: plan.cases.map(entry => ({ ...entry, group: 'all' })) }
    validateGroupResult({ ...artifact, footer: { ...result.footer, tests: child.cases.length, passed: child.cases.length } },
      { context, sources, plan: referencePlan, planSha256, nodeVersions: [process.versions.node] })
    assert.ok(result.footer.tests > child.cases.length, 'reference must cover remaining suites')
    writeJson(path.join(output, 'reference.json'), artifact)
  } else {
    validateGroupResult(artifact, { context, sources, plan, planSha256, nodeVersions: [process.versions.node] })
    writeJson(path.join(output, 'result.json'), artifact)
  }
  console.log(JSON.stringify({ status: 'pass', group: child.group, nodeVersion: process.versions.node,
    cases: child.cases.length, tests: result.footer.tests, durationMs: result.durationMs, memory: child.memory, output }))
}

async function verifyLogs(directory, result) {
  for (const name of ['stdout', 'stderr']) {
    const file = ordinaryPath(path.join(directory, `${name}.log`))
    const stat = fs.statSync(file)
    assert.ok(stat.size <= maxLogBytes)
    const bytes = fs.readFileSync(file)
    assert.deepEqual({ bytes: bytes.length, sha256: sha256(bytes) }, result.logs[name], 'raw log binding mismatch')
  }
  const reference = result.group === 'all'
  assert.deepEqual(parseFooter(fs.readFileSync(path.join(directory, 'stdout.log'), 'utf8'), { reference }), result.footer)
  const native = await readResultFile(path.join(directory, 'native.json'))
  assert.deepEqual(Object.keys(native).sort(), ['args', 'durationMs', 'endedAt', 'environment', 'executable',
    'logs', 'native', 'nodeVersion', 'overflow', 'spawnError', 'startedAt'])
  for (const key of ['native', 'startedAt', 'endedAt', 'durationMs', 'logs', 'nodeVersion']) assert.deepEqual(native[key], result[key])
  const expectedArgs = reference
    ? [path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js'), 'test', '--', ...flags]
    : ['--test', ...flags, adapterFile]
  assert.deepEqual(native.args, expectedArgs, 'native command/configuration mismatch')
  assert.equal(typeof native.executable, 'string')
  assert.deepEqual(Object.keys(native.environment).sort(), ['arch', 'osRelease', 'platform'])
  assert.equal(typeof native.environment.osRelease, 'string')
  assert.ok(native.environment.osRelease.length > 0 && native.environment.osRelease.length <= 256)
  if (result.context.kind === 'ci') {
    assert.ok(path.posix.isAbsolute(native.executable) && path.posix.basename(native.executable) === 'node')
    assert.equal(native.environment.platform, 'linux')
    assert.equal(native.environment.arch, 'x64')
  } else {
    assert.equal(native.executable, process.execPath)
    assert.deepEqual(native.environment, { platform: process.platform, arch: process.arch, osRelease: os.release() })
  }
  assert.equal(native.spawnError, null)
  assert.equal(native.overflow, false)
  const child = await readResultFile(path.join(directory, 'child.json'))
  assert.deepEqual(Object.keys(child).sort(), ['cases', 'completion', 'group', 'memory', 'nodeVersion', 'schemaVersion'])
  for (const key of ['schemaVersion', 'group', 'nodeVersion', 'cases', 'completion', 'memory']) assert.deepEqual(child[key], result[key])
}

async function aggregate(directory, contextFile, referenceDirectory) {
  const context = await contextFor(contextFile)
  const plan = await discoverAdapterPlan()
  const sources = bindSources()
  const expected = { context, sources, plan, planSha256: jsonHash(plan),
    nodeVersions: context.kind === 'ci' ? ciVersions : [process.versions.node] }
  const parent = ordinaryPath(directory, true)
  const entries = fs.readdirSync(parent, { withFileTypes: true })
  assert.equal(entries.length, plan.groups.length * expected.nodeVersions.length, 'unexpected artifact directory count')
  const results = []
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
    assert.ok(entry.isDirectory() && !entry.isSymbolicLink(), 'artifact must be a direct directory')
    const childDirectory = ordinaryPath(path.join(parent, entry.name), true)
    const names = fs.readdirSync(childDirectory).sort()
    assert.deepEqual(names, ['binding.json', 'child.json', 'native.json', 'result.json', 'stderr.log', 'stdout.log'])
    const result = await readResultFile(path.join(childDirectory, 'result.json'))
    validateGroupResult(result, expected)
    const binding = await readResultFile(path.join(childDirectory, 'binding.json'))
    assert.deepEqual(binding, { context, sources, plan, planSha256: expected.planSha256, nodeVersion: result.nodeVersion })
    await verifyLogs(childDirectory, result)
    results.push(result)
  }
  const summary = aggregateResults(results, expected)
  if (referenceDirectory !== undefined) {
    assert.equal(context.kind, 'local')
    const reference = await readResultFile(path.join(ordinaryPath(referenceDirectory, true), 'reference.json'))
    for (const key of ['context', 'sources', 'planSha256']) assert.deepEqual(reference[key], expected[key])
    assert.equal(reference.nodeVersion, process.versions.node)
    assert.ok(reference.footer.tests > plan.cases.length, 'reference must include the remaining suites')
    await verifyLogs(referenceDirectory, reference)
    const referencePlan = { ...plan, groups: ['all'], cases: plan.cases.map(entry => ({ ...entry, group: 'all' })) }
    validateGroupResult({ ...reference, footer: { ...reference.footer, tests: plan.cases.length, passed: plan.cases.length } },
      { ...expected, plan: referencePlan })
    const byId = values => values.slice().sort((a, b) => a.id.localeCompare(b.id, 'en'))
    assert.deepEqual(byId(results.flatMap(result => result.cases)), byId(reference.cases), 'group/reference case or variant difference')
    summary.referenceCompared = true
  }
  console.log(JSON.stringify(summary))
}

async function main(argv) {
  assert.equal(path.resolve(process.cwd()), path.resolve(root), 'run from checkout root')
  const [command, ...args] = argv
  if (command === 'context') {
    assert.equal(args.length, 1); assert.notEqual(process.env.GITHUB_ACTIONS, 'true')
    const file = path.resolve(args[0]); ordinaryPath(path.dirname(file), true)
    assert.ok(!contained(root, file))
    writeJson(file, { kind: 'local', runId: `adr0038-${randomUUID()}`, attempt: '1' })
  } else if (command === 'plan') {
    assert.equal(args.length, 0)
    console.log(JSON.stringify(await discoverAdapterPlan()))
  } else if (command === 'group') {
    assert.ok(args.length === 2 || args.length === 3)
    await runGroup(args[0], args[1], args[2])
  } else if (command === 'reference') {
    assert.equal(args.length, 2); assert.notEqual(process.env.GITHUB_ACTIONS, 'true')
    await runGroup('all', args[0], args[1], true)
  } else if (command === 'aggregate') {
    assert.ok(args.length >= 1 && args.length <= 3)
    await aggregate(...args)
  } else if (command === 'remaining') {
    assert.equal(args.length, 0)
    for (const key of Object.keys(process.env)) assert.ok(!key.startsWith('GD_ADAPTER_'))
    const files = walk('tests').filter(name => name.endsWith('.test.js') && name !== adapterFile).sort()
    assert.ok(files.length > 0)
    const child = spawn(process.execPath, ['--test', ...flags, ...files], { cwd: root, stdio: 'inherit', windowsHide: true })
    const native = await new Promise((resolve, reject) => { child.on('error', reject); child.on('close', (code, signal) => resolve({ code, signal })) })
    assert.deepEqual(native, { code: 0, signal: null })
  } else throw new Error('expected context, plan, group, reference, aggregate or remaining')
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch(error => { console.error(error); process.exitCode = 1 })
}
