import * as fs from 'node:fs'
import { createHash, randomUUID } from 'node:crypto'
import { spawn, ChildProcess } from 'node:child_process'
import { resolve, dirname, win32 } from 'node:path'
import { fileURLToPath } from 'node:url'
import { performance } from 'node:perf_hooks'
import { createNodeCdpOperatorHost, createNodeCdpOperatorHostForTest } from './nodeCdpOperatorHost.js'

export const SERVICE_FOLLOWUP_MS = 120_000
export const SESSION_EVIDENCE_ROOT = 'C:\\Users\\jslom\\Documents\\Projekte\\GoldenDawn-Pruefnachweise'
const POWERSHELL = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'
const HELPER = fileURLToPath(new URL('./readNodeCdpServiceWindow.ps1', import.meta.url))
const IDS = ['sessionId', 'sessionGeneration', 'serviceId', 'serviceGeneration']
const freeze = (value) => Object.freeze(value)
const identifier = (value) => typeof value === 'string' && /^[A-Za-z0-9._:-]{1,128}$/.test(value)
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex')
function fields(value, keys) {
  try {
    if (!value || typeof value !== 'object' || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) return null
    if (Reflect.ownKeys(value).length !== keys.length) return null
    const result = Object.create(null)
    for (const key of keys) {
      const d = Object.getOwnPropertyDescriptor(value, key)
      if (!d || !Object.hasOwn(d, 'value')) return null
      result[key] = d.value
    }
    return result
  } catch { return null }
}
function deepFreeze(value) {
  if (value && typeof value === 'object') { for (const item of Object.values(value)) deepFreeze(item); freeze(value) }
  return value
}
function fileBinding(name, limit = 134_217_728) {
  const stat = fs.lstatSync(name)
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > limit) throw new Error('BINDING')
  const bytes = fs.readFileSync(name)
  if (bytes.length !== stat.size) throw new Error('BINDING')
  return { path: name, bytes: bytes.length, sha256: sha(bytes) }
}
function nativeBinding(configuration) {
  if (process.platform !== 'win32' || typeof globalThis.WebSocket !== 'function') throw new Error('PLATFORM')
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
  const files = ['scripts/browser/nodeCdpOperatorSession.js', 'scripts/browser/nodeCdpOperatorHost.js',
    'scripts/browser/nodeCdpContextControl.js', 'scripts/browser/nodeCdpStartGateOwner.js',
    'scripts/browser/readNodeCdpServiceWindow.ps1', 'package.json', 'package-lock.json']
    .map((name) => fileBinding(resolve(root, name)))
  files.push(fileBinding(process.execPath), fileBinding(POWERSHELL))
  const executable = fileBinding(configuration.chromeExecutable, 536_870_912)
  if (executable.sha256 !== configuration.chromeSha256) throw new Error('CHROME_BINDING')
  files.push(executable)
  const environment = ['NODE_OPTIONS', 'NODE_PATH', 'PATH', 'PATHEXT', 'SystemRoot', 'TEMP', 'TMP']
    .map((name) => ({ name, present: Object.hasOwn(process.env, name),
      sha256: Object.hasOwn(process.env, name) ? sha(process.env[name]) : null }))
  if (process.env.NODE_OPTIONS || process.env.NODE_PATH) throw new Error('NODE_CONFIGURATION')
  return deepFreeze({ files, environment, nodeVersion: process.version, platform: process.platform,
    cwd: process.cwd(), helper: HELPER, powershell: POWERSHELL, dependencies: 'node-builtins-only' })
}
const nativePorts = {
  fs, now: () => performance.now(), utc: () => new Date().toISOString(), uuid: randomUUID,
  schedule: (callback, delay) => setTimeout(callback, delay), cancel: (timer) => clearTimeout(timer),
  binding: nativeBinding,
  helperSpawn: (observation) => spawn(POWERSHELL, ['-NoLogo', '-NoProfile', '-NonInteractive',
    '-File', HELPER, '-CandidatePid', String(observation.pid), '-ExpectedExecutable', observation.executable],
  { shell: false, detached: false, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }),
  isChild: (child) => child instanceof ChildProcess,
}

/** No option reads, file access, input registration or host construction here. */
export function createNodeCdpOperatorSession(options) { return createSession(options, nativePorts, null) }
/** Every effect port is mandatory. The actual Host/Owner/Control remain in use. */
export function createNodeCdpOperatorSessionForTest(options, ports, hostPorts) {
  return createSession(options, ports, { hostPorts })
}

function createSession(options, suppliedPorts, test) {
  let phase = 'NEW', ports, config, host, permission, aborter, runId, confirmation, binding
  let busy = false, stopped = false, stopCount = 0, lastTime = -1, deadline = null, followStart = null, timer
  let preparation = null, control = null, snapshot = null, followup = null, completion, resolveCompletion
  let archive = null, archiveOwned = false, archiveState = 'notAttempted', archiveSequence = 0, archiveBytes = 0
  let fileState = 'notAttempted', timerState = 'notAttempted', inputState = 'notAttempted'
  let inputCleanup = null, inputDetachAttempted = false, archiveBusy = false, clockBroken = false
  const errors = new Set(), records = [], files = [], helpers = [], decisions = []

  function time() {
    const value = ports.now()
    if (!Number.isFinite(value) || value < 0 || value < lastTime) { clockBroken = true; throw new Error('CLOCK') }
    lastTime = value
    return value
  }
  function stamp() {
    const monotonic = time(), utc = ports.utc()
    if (typeof utc !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(utc)) throw new Error('UTC')
    return { monotonic, utc }
  }
  function inspectHost() { return host?.inspect() ?? null }
  function cancelTimer() {
    if (timer === undefined) return
    const held = timer; timer = undefined
    try { if (ports.cancel(held) !== undefined) throw new Error('CANCEL'); timerState = 'closed' }
    catch { timerState = 'possible'; errors.add('TIMER_CLOSE_UNCONFIRMED') }
  }
  function change(next) {
    const previous = phase; phase = next
    if (records.length < 32) {
      try { records.push(freeze({ from: previous, to: next, ...stamp() })) }
      catch { errors.add('CLOCK'); clockBroken = true }
    }
  }
  function writeRecord(kind, value) {
    if (archiveState === 'FAILED' || !archiveOwned || archiveBusy) return false
    archiveBusy = true
    let fd, closeAttempted = false
    try {
      const bytes = Buffer.from(JSON.stringify({ sequence: archiveSequence + 1, kind, ...stamp(), value }) + '\n')
      if (bytes.length > 65_536 || archiveBytes + bytes.length > 524_288 || archiveSequence >= 24) throw new Error('LIMIT')
      const name = `${String(++archiveSequence).padStart(3, '0')}-${kind}.json`
      const entry = { name, bytes: bytes.length, sha256: sha(bytes), state: 'possible' }
      files.push(entry); fileState = 'possible'
      fd = ports.fs.openSync(win32.join(archive, name), 'wx+')
      // A short write is retained as partial evidence, never retried into PASS.
      if (ports.fs.writeSync(fd, bytes, 0, bytes.length, 0) !== bytes.length) throw new Error('WRITE')
      if (ports.fs.fsyncSync(fd) !== undefined) throw new Error('FLUSH')
      const stat = ports.fs.fstatSync(fd)
      if (!stat.isFile() || stat.size !== bytes.length || stat.nlink !== 1) throw new Error('STAT')
      const readback = Buffer.alloc(bytes.length + 1)
      if (ports.fs.readSync(fd, readback, 0, readback.length, 0) !== bytes.length ||
          !bytes.equals(readback.subarray(0, bytes.length))) throw new Error('READBACK')
      closeAttempted = true
      if (ports.fs.closeSync(fd) !== undefined) throw new Error('CLOSE')
      fd = undefined; fileState = 'closed'; entry.state = 'closed'; archiveBytes += bytes.length
      archiveState = 'OPEN'
      return true
    } catch {
      archiveState = 'FAILED'; errors.add('FILE_EVIDENCE_UNCONFIRMED'); stopped = true
      return false
    } finally {
      if (fd !== undefined && !closeAttempted) {
        try { if (ports.fs.closeSync(fd) === undefined) fileState = 'closed' } catch { /* Retained uncertainty. */ }
      }
      archiveBusy = false
    }
  }
  function openArchive() {
    archiveState = 'possible'
    const root = ports.fs.lstatSync(SESSION_EVIDENCE_ROOT)
    if (!root.isDirectory() || root.isSymbolicLink() ||
        ports.fs.realpathSync(SESSION_EVIDENCE_ROOT).toLowerCase() !== SESSION_EVIDENCE_ROOT.toLowerCase()) throw new Error('ROOT')
    const unique = ports.uuid()
    if (!identifier(unique)) throw new Error('UUID')
    archive = win32.join(SESSION_EVIDENCE_ROOT, `node-cdp-session-${unique}`)
    if (ports.fs.mkdirSync(archive) !== undefined) throw new Error('DIRECTORY')
    archiveOwned = true
    archiveState = 'OPEN'
    return writeRecord('binding', { sources: binding, configuration: config,
      followupMs: SERVICE_FOLLOWUP_MS, helperBudgetMs: 5_000, helperOutputBytes: 4_096 })
  }
  function recordDecision(action) {
    if (decisions.length >= 32) { errors.add('INPUT_LIMIT'); stopped = true; return false }
    decisions.push(freeze({ action, ...stamp() }))
    return true
  }
  function stop(reason = 'ABORT') {
    if (!['ABORT', 'EOF', 'SIGINT', 'SIGTERM', 'INPUT_ERROR', 'REJECTED', 'EVIDENCE_ERROR'].includes(reason)) reason = 'REJECTED'
    if (phase === 'FINAL') return false
    const first = !errors.has(reason)
    errors.add(reason); stopped = true
    stopCount = Math.min(33, stopCount + 1)
    if (first && ports && decisions.length < 32) {
      try { decisions.push(freeze({ action: reason, ...stamp() })) }
      catch { errors.add('CLOCK'); clockBroken = true }
    }
    // Never revoke the host session while its control owns a live lease.
    if (phase === 'CONTROLLING') { aborter?.abort(); return true }
    if (phase === 'PREPARING') { host.end(); return true }
    if (busy) return true
    if (phase === 'NEW') { phase = 'FINAL'; return true }
    startFollowup()
    return true
  }
  function begin() {
    if (phase !== 'NEW' || busy || stopped) { stop('REJECTED'); return false }
    busy = true; phase = 'STARTING'
    completion = new Promise((resolve) => { resolveCompletion = resolve })
    try {
      ports = fields(suppliedPorts, ['fs', 'now', 'utc', 'uuid', 'schedule', 'cancel', 'binding', 'helperSpawn', 'isChild'])
      if (!ports || !['now', 'utc', 'uuid', 'schedule', 'cancel', 'binding', 'helperSpawn', 'isChild']
        .every((key) => typeof ports[key] === 'function')) throw new Error('PORTS')
      config = fields(options, ['chromeExecutable', 'chromeSha256', 'stateDecision', 'stateReference', 'networkDecision', 'networkReference'])
      if (!config || typeof config.chromeExecutable !== 'string' || typeof config.chromeSha256 !== 'string' ||
          !/^[A-Za-z]:\\[^\r\n"<>|?*]+\.exe$/.test(config.chromeExecutable) ||
          win32.normalize(config.chromeExecutable) !== config.chromeExecutable ||
          !/^[a-f0-9]{64}$/.test(config.chromeSha256) || !identifier(config.stateReference) || !identifier(config.networkReference) ||
          !['INITIAL_STATE_CLARIFIED', 'RESTART_CLEARED_ADR0041_6_4'].includes(config.stateDecision) ||
          !['ACCEPT_BROWSER_BACKGROUND_NETWORK', 'PROTECTION_CONFIRMED'].includes(config.networkDecision)) throw new Error('INPUT')
      config = freeze({ ...config })
      binding = ports.binding(config)
      if (!binding || typeof binding !== 'object') throw new Error('BINDING')
      if (!openArchive() || stopped) throw new Error('EVIDENCE')
      const hostOptions = { chromeExecutable: config.chromeExecutable, chromeSha256: config.chromeSha256 }
      host = test ? createNodeCdpOperatorHostForTest(hostOptions, test.hostPorts) : createNodeCdpOperatorHost(hostOptions)
      if (!recordDecision('RESERVE') || stopped) throw new Error('STOPPED')
      const reserved = host.reserve({ operator: 'Jan', decision: config.stateDecision, reference: config.stateReference })
      writeRecord('reservation', { accepted: reserved, host: inspectHost() })
      if (!reserved || stopped) throw new Error('RESERVATION')
      change('RESERVED')
      return true
    } catch {
      if (archiveState !== 'notAttempted') archiveState = 'FAILED'
      errors.add('START_REFUSED'); stopped = true; return false
    }
    finally {
      busy = false
      if (stopped) startFollowup()
    }
  }
  async function prepare() {
    if (busy || stopped || phase !== 'RESERVED') { stop('REJECTED'); return null }
    change('PREPARING')
    try {
      if (!recordDecision('PREPARE') || stopped) throw new Error('STOPPED')
      preparation = await host.prepareService()
      const state = inspectHost()
      const ready = preparation.status === 'READY' && preparation.errors.length === 0 &&
        preparation.connectionsAttempted === 1 && preparation.versionCommands === 1 && preparation.connectionClosed === true &&
        ['connection', 'registrations', 'timer'].every((key) => preparation[key] === 'closed') &&
        state.phase === 'READY' && !state.blocked && !state.ended && !state.serviceLost &&
        state.processObservation.status === 'CONFIRMED' && IDS.every((key) => identifier(state[key]))
      if (!ready || stopped) { startFollowup(); writeRecord('preparation', preparation); return preparation }
      if (!writeRecord('preparation', preparation)) { startFollowup(); return preparation }
      const nonce = ports.uuid()
      if (!identifier(nonce)) throw new Error('CONFIRMATION')
      confirmation = freeze({ ...Object.fromEntries(IDS.map((key) => [key, state[key]])), confirmation: nonce })
      change('READY')
      return preparation
    } catch { errors.add('PREPARATION_UNCONFIRMED'); startFollowup(); return null }
  }
  async function controlOnce(request) {
    if (busy || stopped || phase !== 'READY' || helpers.some((h) => !h.settled)) { stop('REJECTED'); return null }
    busy = true
    try {
      const value = fields(request, ['operator', 'decision', 'confirmation', ...IDS])
      const state = inspectHost()
      if (!value || value.operator !== 'Jan' || value.decision !== 'ALLOW_CONTROL_ONCE' ||
          value.confirmation !== confirmation.confirmation || !IDS.every((key) => value[key] === confirmation[key] && value[key] === state[key]) ||
          state.blocked || state.ended || state.serviceLost || state.processObservation.status !== 'CONFIRMED') throw new Error('PERMISSION')
      if (!recordDecision('ALLOW_CONTROL_ONCE') || stopped) throw new Error('STOPPED')
      runId = ports.uuid()
      if (!identifier(runId)) throw new Error('RUN_ID')
      permission = host.authorizeControl({ operator: 'Jan', decision: 'ALLOW_CONTROL_ONCE', runId,
        ...Object.fromEntries(IDS.map((key) => [key, state[key]])) })
      if (!permission || stopped) throw new Error('PERMISSION')
      aborter = new AbortController()
      change('CONTROLLING')
      // Keep the original permission object private; no cloning or persistence.
      const pending = host.runControl({ permission, signal: aborter.signal })
      busy = false
      control = await pending
      // Latch deadline and revoke future starts before any fallible evidence copy.
      startFollowup()
      try { snapshot = host.readEvidence(runId) } catch { errors.add('SNAPSHOT_UNCONFIRMED') }
      writeRecord('control-snapshot', snapshot)
      writeRecord('control-report', control)
      poll()
      return control
    } catch { errors.add('CONTROL_REFUSED'); stopped = true; return null }
    finally {
      permission = null; busy = false
      if (phase !== 'FOLLOWUP' && phase !== 'FINAL') startFollowup()
    }
  }
  function serviceJudgment(state, expired) {
    if (!state) return 'NOT_ATTEMPTED'
    const r = state.resources
    if (r.process === 'notAttempted' && r.stdout === 'notAttempted' && r.stderr === 'notAttempted' &&
        r.processRegistrations === 'notAttempted') return 'NOT_ATTEMPTED'
    const closed = state.processExited && state.processClosed && r.stdout === 'closed' && r.stderr === 'closed' &&
      r.processRegistrations === 'closed' && r.remainingProcessRegistrations === 0
    if (closed && !expired && !clockBroken) return 'PASS'
    if (!expired && !clockBroken) return 'PENDING'
    return state.processObservation.status === 'CONFIRMED' ||
      ['stdout', 'stderr'].some((key) => r[key] === 'confirmed') ? 'FAIL' : 'UNPROVEN'
  }
  function startFollowup() {
    if (phase === 'FOLLOWUP' || phase === 'FINAL') return
    stopped = true
    try { followStart = time(); deadline = followStart + SERVICE_FOLLOWUP_MS }
    catch { clockBroken = true; errors.add('CLOCK') }
    // Retain this same host for observation after revoking its start permission.
    try { if (host && host.end() !== true) errors.add('END_UNCONFIRMED') } catch { errors.add('END_UNCONFIRMED') }
    change('FOLLOWUP')
    if (!host || clockBroken) poll()
    else armPoll()
  }
  function armPoll() {
    if (phase !== 'FOLLOWUP' || timer !== undefined) return
    try {
      const delay = Math.min(100, Math.max(0, deadline - time()))
      timerState = 'possible'
      timer = ports.schedule(() => { timer = undefined; timerState = 'closed'; poll() }, delay)
      if (timer === undefined || timer === null || typeof timer?.then === 'function') throw new Error('TIMER')
      timerState = 'confirmed'
    } catch { errors.add('TIMER_UNCONFIRMED'); clockBroken = true; poll() }
  }
  function poll() {
    if (phase !== 'FOLLOWUP') return
    let expired = true, state
    try { expired = clockBroken || time() >= deadline; state = inspectHost() }
    catch { clockBroken = true; errors.add('OBSERVATION_UNCONFIRMED') }
    const judgment = serviceJudgment(state, expired)
    const helperPending = helpers.some((h) => !h.settled)
    if (judgment === 'PENDING' || (helperPending && !expired)) { armPoll(); return }
    followup = deepFreeze({ status: judgment, beganAtMonotonic: followStart, deadlineMonotonic: deadline,
      observedAtMonotonic: lastTime, expired, host: state ?? null })
    finish()
  }
  // Every publication evaluates the same phase and strict helper/service budgets.
  // A window record is serialized before IO: it cannot certify its own timely
  // completion. Its explicit preliminary role therefore never carries a candidate.
  // Previously returned frozen snapshots remain historical; they are not mutated.
  function projectWindow(h, result = h?.result, preliminary = false) {
    if (!result) return result
    if (result.status === 'CANDIDATE') {
      let current = false
      if (!preliminary && !clockBroken && ['READY', 'FOLLOWUP'].includes(phase)) {
        try { current = h?.timely() === true }
        catch { clockBroken = true }
      }
      if (!current) result = deepFreeze({ ...result, status: 'UNPROVEN', code: 'HELPER_UNCONFIRMED', candidate: null })
    }
    return preliminary ? deepFreeze({ ...result, evidenceRole: 'PRELIMINARY_WINDOW_OBSERVATION' }) : result
  }
  function helperResource(h) {
    return { process: h.process, exited: h.exited, closed: h.closed, stdout: h.stdoutClosed ? 'closed' : 'possible',
      stderr: h.stderrClosed ? 'closed' : 'possible', registrations: h.registrationState,
      remainingRegistrations: h.listeners.filter((r) => r.state !== 'closed').length,
      timer: h.timerState, outputBytes: h.bytes, settled: h.settled, result: projectWindow(h) }
  }
  function report() {
    const helperReports = helpers.map(helperResource)
    // A later helper can invalidate the clock for this entire new graph.
    // With clockBroken latched, projectWindow performs no further time/effect calls.
    if (clockBroken) {
      for (const helper of helperReports) helper.result = projectWindow(null, helper.result)
    }
    const ownClosed = [fileState, timerState, inputState].every((state) => ['closed', 'notAttempted'].includes(state)) &&
      helpers.every((h) => h.exited && h.closed && h.stdoutClosed && h.stderrClosed && h.registrationState === 'closed' && h.timerState === 'closed')
    return deepFreeze({ phase, startsBlocked: stopped,
      resourceStatus: phase !== 'FINAL' ? 'PENDING' : followup?.status === 'FAIL' ? 'FAIL' :
        control?.resourceStatus === 'FAIL' ? 'FAIL' :
        ownClosed && ['PASS', 'NOT_ATTEMPTED'].includes(followup?.status) &&
        (!control || control.resourceStatus === 'PASS') && !errors.size ? 'PASS' : 'UNPROVEN',
      errors: [...errors], preparation, control, snapshot, followup,
      transitions: [...records], decisions: [...decisions], stopCount,
      fileEvidence: { status: archiveState, directory: archive, files: files.map((entry) => ({ ...entry })) },
      resources: { file: fileState, timer: timerState, inputListeners: inputState, helpers: helperReports },
      overallGate: 'FAIL', causeStatus: 'CAUSE_NOT_PROVEN', evidenceClass: 'NOT_EVIDENCE', runtimeRecord: null })
  }
  function finish() {
    if (phase === 'FINAL') return
    cancelTimer()
    if (inputCleanup && !inputDetachAttempted) {
      inputDetachAttempted = true
      try { if (inputCleanup() !== true) throw new Error('INPUT_CLOSE'); inputState = 'closed' }
      catch { inputState = 'possible'; errors.add('INPUT_CLOSE_UNCONFIRMED') }
    }
    change('FINAL')
    writeRecord('followup', followup)
    writeRecord('session-report', report())
    // Manifest confirms earlier files. It never attests its own close.
    if (writeRecord('manifest', { files: files.map((entry) => ({ ...entry })) }) && fileState === 'closed') archiveState = 'PASS'
    try { if (host && time() >= deadline) errors.add('SESSION_CLOSE_LATE') }
    catch { errors.add('CLOCK') }
    resolveCompletion?.(report())
  }

  async function queryWindow() {
    if (!['READY', 'FOLLOWUP'].includes(phase) || helpers.length >= 2 || helpers.some((h) => !h.settled || !h.closed)) return null
    let before, end
    function timely() {
      const now = time()
      return !clockBroken && ['READY', 'FOLLOWUP'].includes(phase) && now < end &&
        (deadline === null || now < deadline)
    }
    try {
      if (phase === 'FOLLOWUP' && time() >= deadline) { poll(); return null }
      before = inspectHost().processObservation
      if (before.status !== 'CONFIRMED' || !Number.isSafeInteger(before.pid) || before.pid <= 0 || before.pid > 0xffffffff) throw new Error('IDENTITY')
      if (JSON.stringify(ports.binding(config)) !== JSON.stringify(binding)) throw new Error('DRIFT')
    } catch { return deepFreeze({ status: 'UNPROVEN', code: 'HOST_BINDING_UNCONFIRMED', closeRecommendation: false }) }
    const h = { child: null, process: 'possible', exited: false, closed: false, stdoutClosed: false, stderrClosed: false,
      registrationState: 'notAttempted', listeners: [], timerState: 'notAttempted', bytes: 0, settled: false, result: null, timely }
    helpers.push(h)
    let result = await new Promise((resolveResult) => {
      let buffer = Buffer.alloc(0), invalid = false, helperTimer, exitCode, removalAttempted = false
      function cleanup() {
        if (removalAttempted || !h.closed || !h.stdoutClosed || !h.stderrClosed) return
        removalAttempted = true
        for (const r of h.listeners) {
          try { if (r.target.removeListener(r.name, r.callback) === r.target) r.state = 'closed' } catch { /* Retain. */ }
        }
        h.registrationState = h.listeners.every((r) => r.state === 'closed') ? 'closed' : 'possible'
      }
      function settle(code) {
        if (h.settled) return
        h.settled = true
        if (helperTimer !== undefined) {
          const held = helperTimer; helperTimer = undefined
          try { if (ports.cancel(held) !== undefined) throw new Error('CANCEL'); h.timerState = 'closed' }
          catch { h.timerState = 'possible'; invalid = true }
        }
        cleanup()
        let candidate = null
        try {
          if (code || invalid || !timely() || !h.exited || !h.closed || !h.stdoutClosed || !h.stderrClosed ||
              exitCode !== 0 || h.registrationState !== 'closed' || h.timerState !== 'closed') throw new Error('HELPER')
          const after = inspectHost().processObservation
          if (JSON.stringify(before) !== JSON.stringify(after) || after.status !== 'CONFIRMED') throw new Error('IDENTITY')
          const parsed = fields(JSON.parse(buffer.toString('utf8')), ['schema', 'status', 'pid', 'executable', 'handle', 'processStartUtcTicks'])
          if (!parsed || parsed.schema !== 1 || parsed.status !== 'CANDIDATE' || parsed.pid !== before.pid ||
              parsed.executable.toLowerCase() !== before.executable.toLowerCase() ||
              !/^[1-9][0-9]{0,19}$/.test(parsed.handle) || !/^[1-9][0-9]{0,19}$/.test(parsed.processStartUtcTicks)) throw new Error('REPLY')
          if (!timely()) throw new Error('HELPER_LATE')
          candidate = { ...parsed }
        } catch { invalid = true }
        h.result = deepFreeze({ status: candidate && !invalid ? 'CANDIDATE' : 'UNPROVEN',
          code: code ?? (invalid ? 'HELPER_UNCONFIRMED' : 'NO_DURABLE_WINDOW_IDENTITY'),
          host: before, candidate: candidate && !invalid ? candidate : null, closeRecommendation: false })
        resolveResult(h.result)
      }
      function listen(target, name, callback) {
        const r = { target, name, callback: (...args) => {
          try { callback(...args) } catch { invalid = true; settle('HELPER_EVENT') }
        }, state: 'possible' }
        h.listeners.push(r); h.registrationState = 'possible'
        if (target.on(name, r.callback) !== target) throw new Error('REGISTER')
      }
      function completed() { cleanup(); if (h.closed && h.stdoutClosed && h.stderrClosed) settle() }
      try {
        end = time() + 5_000
        const waitEnd = phase === 'FOLLOWUP' ? Math.min(end, deadline) : end
        if (!timely()) throw new Error('HELPER_LATE')
        h.timerState = 'possible'
        helperTimer = ports.schedule(() => { helperTimer = undefined; h.timerState = 'closed'; settle('HELPER_TIMEOUT') }, Math.max(0, waitEnd - time()))
        if (helperTimer === undefined || helperTimer === null || typeof helperTimer?.then === 'function') throw new Error('TIMER')
        h.timerState = 'confirmed'
        h.child = ports.helperSpawn(before)
        if (ports.isChild(h.child) !== true) throw new Error('PROCESS')
        h.process = 'confirmed'
        listen(h.child, 'error', () => { invalid = true; settle('HELPER_ERROR') })
        listen(h.child, 'exit', (code) => { h.exited = true; exitCode = code })
        listen(h.child, 'close', () => { h.closed = true; h.process = 'closed'; completed() })
        for (const name of ['stdout', 'stderr']) {
          const stream = h.child[name]
          listen(stream, 'data', (bytes) => {
            if (!Buffer.isBuffer(bytes)) { invalid = true; settle('HELPER_OUTPUT'); return }
            h.bytes = Math.min(4_097, h.bytes + bytes.length)
            if (h.bytes > 4_096 || name === 'stderr') { invalid = true; settle('HELPER_OUTPUT'); return }
            if (!h.settled) buffer = Buffer.concat([buffer, bytes])
          })
          listen(stream, 'error', () => { invalid = true; settle('HELPER_STREAM') })
          listen(stream, 'close', () => { h[`${name}Closed`] = true; completed() })
        }
        h.registrationState = 'confirmed'
        if (!timely()) settle('HELPER_TIMEOUT')
      } catch { invalid = true; settle('HELPER_SETUP') }
    })
    // Promise delivery, evidence IO and finalization consume the same budgets.
    result = projectWindow(h, result)
    if (phase !== 'FINAL' && !writeRecord('window', projectWindow(h, result, true))) stop('EVIDENCE_ERROR')
    result = projectWindow(h, result)
    if (result.status !== 'CANDIDATE') stop('REJECTED')
    if (phase === 'FOLLOWUP') poll()
    return projectWindow(h, result)
  }
  function installInput(input, signals, output) {
    if (phase !== 'RESERVED' || inputState !== 'notAttempted') return false
    const registrations = []
    let pending = '', commands = 0, detached = false
    inputState = 'possible'
    const send = (value) => { try { output(JSON.stringify(value) + '\n') } catch { stop('INPUT_ERROR') } }
    function detach() {
      if (detached) return inputState === 'closed'
      detached = true
      let confirmed = true
      for (const r of registrations) {
        try { if (r.target.removeListener(r.name, r.callback) !== r.target) confirmed = false } catch { confirmed = false }
      }
      try { if (input.pause() !== input) confirmed = false } catch { confirmed = false }
      return confirmed
    }
    inputCleanup = detach
    function dispatch(line) {
      if (++commands > 32) { stop('INPUT_ERROR'); return }
      let value
      try { value = JSON.parse(line) } catch { stop('REJECTED'); return }
      const envelope = fields(value, ['action', 'value'])
      if (!envelope) { stop('REJECTED'); return }
      const noValue = envelope.value === null
      if (envelope.action === 'abort' && noValue) { stop(); return }
      if (envelope.action === 'prepare' && noValue) {
        void prepare().then(() => send({ phase, confirmation: phase === 'READY' ? confirmation : null })); return
      }
      if (envelope.action === 'control') { void controlOnce(envelope.value).then((r) => send({ control: r })); return }
      if (envelope.action === 'window' && noValue) {
        const pending = queryWindow(), helper = helpers.at(-1)
        void pending.then((result) => send(projectWindow(helper, result)))
        return
      }
      stop('REJECTED')
    }
    function add(target, name, callback) {
      registrations.push({ target, name, callback })
      if (target.on(name, callback) !== target) throw new Error('REGISTER')
    }
    try {
      add(input, 'data', (chunk) => {
        try {
          if (detached || phase === 'FINAL') return
          if ((!Buffer.isBuffer(chunk) && typeof chunk !== 'string') || Buffer.byteLength(chunk) > 8_192) throw new Error('INPUT')
          pending += chunk.toString('utf8')
          if (Buffer.byteLength(pending) > 8_192) throw new Error('INPUT')
          while (pending.includes('\n') && !detached) {
            const at = pending.indexOf('\n'), line = pending.slice(0, at).replace(/\r$/, '')
            pending = pending.slice(at + 1); dispatch(line)
          }
        } catch { stop('INPUT_ERROR') }
      })
      add(input, 'end', () => stop('EOF')); add(input, 'error', () => stop('INPUT_ERROR'))
      add(signals, 'SIGINT', () => stop('SIGINT')); add(signals, 'SIGTERM', () => stop('SIGTERM'))
      inputState = 'confirmed'
      send({ phase, next: 'prepare', abortAvailable: true })
      return true
    } catch { errors.add('INPUT_REGISTRATION'); stop('INPUT_ERROR'); return false }
  }
  return freeze({ begin, prepare, controlOnce, stop, queryWindow, installInput,
    inspect: () => deepFreeze({ phase, startsBlocked: stopped, confirmation: phase === 'READY' ? confirmation : null,
      host: inspectHost(), deadlineMonotonic: deadline, fileEvidence: archiveState }),
    report, completed: () => completion ?? Promise.resolve(report()) })
}

export const NODE_CDP_SESSION_HELP = `Node-CDP Operatorsitzung (kein Start ohne --run).
--help: nur Hilfe. --run: sechs verpflichtende Argumentpaare:
--chrome-executable PATH --chrome-sha256 SHA256 --state-decision DECISION
--state-reference REF --network-decision DECISION --network-reference REF
Danach JSON-Zeilen: {"action":"prepare","value":null}, getrennte Kontrolle mit
aktueller READY-Bestaetigung; {"action":"window","value":null};
{"action":"abort","value":null}. EOF/SIGINT/SIGTERM brechen phasengerecht ab.
Fensterzuordnung ist eine Momentaufnahme; keine sichere Schliessempfehlung.
SAC bleibt aktiv. Keine automatische Bereinigung oder Wiederaufnahme.
`
export function runNodeCdpOperatorSessionCli(argv, io) {
  if (argv.length === 0 || (argv.length === 1 && argv[0] === '--help')) { io.output(NODE_CDP_SESSION_HELP); return null }
  const names = { '--chrome-executable': 'chromeExecutable', '--chrome-sha256': 'chromeSha256',
    '--state-decision': 'stateDecision', '--state-reference': 'stateReference',
    '--network-decision': 'networkDecision', '--network-reference': 'networkReference' }
  const values = {}
  if (argv[0] !== '--run' || argv.length !== 13) { io.output('START_REFUSED\n'); return null }
  for (let i = 1; i < argv.length; i += 2) {
    const key = names[argv[i]]
    if (!key || Object.hasOwn(values, key)) { io.output('START_REFUSED\n'); return null }
    values[key] = argv[i + 1]
  }
  const session = createNodeCdpOperatorSession(values)
  if (session.begin()) session.installInput(io.input, io.signals, io.output)
  void session.completed().then((result) => io.output(JSON.stringify(result) + '\n'))
  return session
}
// Only the actual entry file may interpret argv. No CLI execution on import.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runNodeCdpOperatorSessionCli(process.argv.slice(2), {
    input: process.stdin, signals: process, output: (text) => process.stdout.write(text),
  })
}
