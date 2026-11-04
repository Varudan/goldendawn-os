import * as fs from 'node:fs'
import { createHash, randomUUID } from 'node:crypto'
import { ChildProcess, spawn } from 'node:child_process'
import { win32 as path } from 'node:path'
import { performance } from 'node:perf_hooks'
import { createNodeCdpStartGateOwner } from './nodeCdpStartGateOwner.js'
import { createNodeCdpContextControl } from './nodeCdpContextControl.js'

// One installation-wide location, never derived from a run, service or caller.
export const NODE_CDP_OPERATOR_DIRECTORY = 'C:\\Users\\jslom\\AppData\\Local\\GoldenDawn\\NodeCdpOperator'
const MARKER = path.join(NODE_CDP_OPERATOR_DIRECTORY, 'reservation.json')
const PROFILE = path.join(NODE_CDP_OPERATOR_DIRECTORY, 'synthetic-profile')
const VERSION_KEYS = ['protocolVersion', 'product', 'revision', 'userAgent', 'jsVersion']
const MAX_RUNS = 64
const id = (value) => typeof value === 'string' && /^[A-Za-z0-9._:-]{1,128}$/.test(value)
const hash = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
const frozen = (value) => Object.freeze(value)

function fields(value, required, optional = []) {
  if (!value || typeof value !== 'object') return null
  const proto = Object.getPrototypeOf(value)
  if (proto !== Object.prototype && proto !== null) return null
  const keys = Reflect.ownKeys(value)
  if (keys.some((key) => !required.includes(key) && !optional.includes(key))) return null
  const copy = Object.create(null)
  for (const key of [...required, ...optional]) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)
    if (!descriptor) { if (required.includes(key)) return null; continue }
    if (!Object.hasOwn(descriptor, 'value')) return null
    copy[key] = descriptor.value
  }
  return copy
}

const nativePorts = {
  fs, spawn, uuid: randomUUID, isChild: (child) => child instanceof ChildProcess,
  createWebSocket: (url) => new WebSocket(url), now: () => performance.now(),
  schedule: (callback, delay) => setTimeout(callback, delay), cancel: (timer) => clearTimeout(timer),
}

/** No option reads or effects until an explicit method call. No CLI/autostart. */
export function createNodeCdpOperatorHost(options) {
  return createHost(options, nativePorts)
}

/** Explicit trusted test composition; every effect is required, no native fallback.
 * Tests map the fixed paths into their own memory/temporary filesystem.
 */
export function createNodeCdpOperatorHostForTest(options, ports) {
  return createHost(options, ports)
}

function createHost(options, suppliedPorts) {
  let ports, configuration, session, service, permission, activeRun
  let phase = 'NEW', blocked = false, busy = false, reserved = false, ended = false
  let preparationStop, preparationReport = null
  let profileState = 'notAttempted', processState = 'notAttempted'
  const outputStates = { stdout: 'notAttempted', stderr: 'notAttempted' }
  const leases = new Map(), evidence = new Map(), usedRuns = new Set()

  function serviceResources() {
    return frozen({ profile: frozen({ path: PROFILE, state: profileState }),
      process: processState, processReferenceHeld: !!service?.reference,
      stdout: outputStates.stdout, stderr: outputStates.stderr,
      processRegistrations: service?.monitorState ?? 'notAttempted',
      remainingProcessRegistrations: service?.monitors.filter((entry) => entry.state !== 'closed').length ?? 0 })
  }

  function serviceCurrent() {
    if (!service || service.lost) return false
    try {
      const child = service.child
      if (!child || child !== service.reference || !service.spawned ||
          child.pid !== service.pid || child.spawnfile !== configuration.chromeExecutable ||
          child.exitCode !== null || child.signalCode !== null || child.killed !== false ||
          service.processExited || service.processClosed || service.outputClosed) {
        loseService('SERVICE_IDENTITY_LOST')
        return false
      }
      return true
    } catch { loseService('SERVICE_OBSERVATION_FAILED'); return false }
  }

  const owner = createNodeCdpStartGateOwner({
    readSession: () => reserved && !ended ? {
      status: 'CONFIRMED', sessionId: session.id, generation: session.generation,
      exclusive: true, continuity: 'CONFIRMED',
    } : null,
    readService: () => phase === 'READY' && serviceCurrent() ? {
      status: 'CONFIRMED', sessionId: session.id, sessionGeneration: session.generation,
      generation: service.generation, binding: service.binding,
    } : null,
    readPermission: () => permission && activeRun === permission.runId ? {
      sessionId: session.id, sessionGeneration: session.generation,
      serviceId: service.id, serviceGeneration: service.generation,
      startAllowed: true, externalBlock: blocked ? 'BLOCKED' : 'CLEAR',
    } : null,
  })
  // This adapter never replaces the one owner; it also retains known leases for
  // late resource findings after a control factory has completed.
  const gate = frozen({
    acquire(binding, runId) {
      const lease = owner.acquire(binding, runId)
      if (lease) leases.set(runId, lease)
      return lease
    },
    isCurrent: (lease) => owner.isCurrent(lease),
    block(lease, finding) {
      const accepted = owner.block(lease, finding)
      if (accepted) blocked = true
      return accepted
    },
    complete(lease, report) {
      const accepted = owner.complete(lease, report)
      if (!accepted || report.resourceStatus !== 'PASS') blocked = true
      return accepted
    },
  })

  function loseService(code) {
    if (service) service.lost = true
    blocked = true
    preparationStop?.(code)
  }

  function reserve(request) {
    if (phase !== 'NEW' || busy || ended) return false
    // Every attempt is terminal, including invalid clarification and IO failure.
    phase = 'RESERVING'; busy = true
    let descriptor
    try {
      const clarification = fields(request, ['operator', 'decision', 'reference'])
      if (!clarification || clarification.operator !== 'Jan' || !id(clarification.reference) ||
          !['INITIAL_STATE_CLARIFIED', 'RESTART_CLEARED_ADR0041_6_4'].includes(clarification.decision)) return false
      configuration = fields(options, ['chromeExecutable', 'chromeSha256'])
      if (ended || !configuration || typeof configuration.chromeExecutable !== 'string' ||
          !/^[A-Za-z]:\\[^\r\n"<>|?*]+\.exe$/.test(configuration.chromeExecutable) ||
          path.normalize(configuration.chromeExecutable) !== configuration.chromeExecutable ||
          !hash(configuration.chromeSha256)) return false
      ports = fields(suppliedPorts, ['fs', 'spawn', 'uuid', 'isChild', 'createWebSocket', 'now', 'schedule', 'cancel'])
      if (!ports || !['spawn', 'uuid', 'isChild', 'createWebSocket', 'now', 'schedule', 'cancel']
        .every((key) => typeof ports[key] === 'function')) return false
      const sessionId = ports.uuid(), generation = ports.uuid()
      if (!id(sessionId) || !id(generation) || sessionId === generation) return false
      session = frozen({ id: sessionId, generation, clarification: clarification.reference })
      const root = ports.fs.lstatSync(NODE_CDP_OPERATOR_DIRECTORY)
      if (!root.isDirectory() || root.isSymbolicLink() ||
          ports.fs.realpathSync(NODE_CDP_OPERATOR_DIRECTORY).toLowerCase() !== NODE_CDP_OPERATOR_DIRECTORY.toLowerCase()) return false
      const bytes = Buffer.from(JSON.stringify({ schema: 1, sessionId, generation,
        operator: 'Jan', decision: clarification.decision, reference: clarification.reference,
        directory: NODE_CDP_OPERATOR_DIRECTORY, disposition: 'RETAIN_UNTIL_SEPARATE_CLARIFICATION' }) + '\n')
      // No exists/access/stat check of the marker before this exclusive create.
      descriptor = ports.fs.openSync(MARKER, 'wx+')
      let offset = 0
      while (offset < bytes.length) {
        const count = ports.fs.writeSync(descriptor, bytes, offset, bytes.length - offset, offset)
        if (!Number.isInteger(count) || count <= 0 || count > bytes.length - offset) throw new Error('WRITE')
        offset += count
      }
      if (ports.fs.fsyncSync(descriptor) !== undefined) throw new Error('FLUSH')
      const stat = ports.fs.fstatSync(descriptor)
      if (!stat.isFile() || stat.size !== bytes.length || stat.nlink !== 1) throw new Error('MARKER')
      const readback = Buffer.alloc(bytes.length + 1)
      const read = ports.fs.readSync(descriptor, readback, 0, readback.length, 0)
      if (read !== bytes.length || !bytes.equals(readback.subarray(0, read))) throw new Error('READBACK')
      const closing = descriptor; descriptor = undefined
      if (ports.fs.closeSync(closing) !== undefined) throw new Error('CLOSE')
      reserved = true; phase = 'RESERVED'
      return true
    } catch { return false }
    finally {
      if (descriptor !== undefined) { try { ports.fs.closeSync(descriptor) } catch { /* Mark retained. */ } }
      if (!reserved) { phase = 'FAILED'; blocked = true }
      busy = false
    }
  }

  function verifyExecutable() {
    const executable = configuration.chromeExecutable
    const stat = ports.fs.lstatSync(executable)
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size <= 0 || stat.size > 536_870_912 ||
        ports.fs.realpathSync(executable).toLowerCase() !== executable.toLowerCase()) throw new Error('EXECUTABLE')
    const descriptor = ports.fs.openSync(executable, 'r')
    try {
      const digest = createHash('sha256'), chunk = Buffer.alloc(65_536)
      let position = 0
      while (position < stat.size) {
        const size = Math.min(chunk.length, stat.size - position)
        const count = ports.fs.readSync(descriptor, chunk, 0, size, position)
        if (!Number.isInteger(count) || count <= 0 || count > size) throw new Error('EXECUTABLE_READ')
        digest.update(chunk.subarray(0, count)); position += count
      }
      if (ports.fs.fstatSync(descriptor).size !== stat.size ||
          digest.digest('hex') !== configuration.chromeSha256) throw new Error('EXECUTABLE_HASH')
    } finally { if (ports.fs.closeSync(descriptor) !== undefined) throw new Error('EXECUTABLE_CLOSE') }
  }

  function readEndpoint() {
    let descriptor
    try { descriptor = ports.fs.openSync(path.join(PROFILE, 'DevToolsActivePort'), 'r') }
    catch (error) { if (error?.code === 'ENOENT') return null; throw error }
    try {
      const stat = ports.fs.fstatSync(descriptor)
      if (!stat.isFile() || stat.size < 1 || stat.size > 256 || stat.nlink !== 1) throw new Error('ENDPOINT_FILE')
      const bytes = Buffer.alloc(257)
      const count = ports.fs.readSync(descriptor, bytes, 0, bytes.length, 0)
      if (count !== stat.size || ports.fs.fstatSync(descriptor).size !== stat.size) throw new Error('ENDPOINT_READ')
      const value = bytes.subarray(0, count).toString('ascii')
      if (bytes.subarray(0, count).some((byte) => byte > 127)) throw new Error('ENDPOINT_ENCODING')
      const match = /^([1-9][0-9]{0,4})\n(\/devtools\/browser\/[A-Za-z0-9_-]{1,128})\n?$/.exec(value)
      if (!match || Number(match[1]) > 65_535) throw new Error('ENDPOINT_FORMAT')
      return `ws://127.0.0.1:${match[1]}${match[2]}`
    } finally { if (ports.fs.closeSync(descriptor) !== undefined) throw new Error('ENDPOINT_CLOSE') }
  }

  function prepareService() {
    if (phase !== 'RESERVED' || busy || blocked || ended) return Promise.resolve(frozen({ status: 'NOT_RUN' }))
    phase = 'PREPARING'
    return new Promise((resolve) => {
      let stage = 'endpoint', deadline, lastTime = -1, timer, socket, version
      let done = false, closing = false, closed = false, stopCode = null, stoppedAt = null, endpointReads = 0
      let commandSent = false, messages = 0, clockBroken = false, driving = false, timerUncertain = false
      let connection = 'notAttempted', registrations = 'notAttempted', timerState = 'notAttempted'
      const listeners = [], stages = [], errors = new Set()
      function time() {
        let value
        try { value = ports.now() } catch { clockBroken = true; throw new Error('CLOCK') }
        if (!Number.isFinite(value) || value < 0 || value < lastTime) { clockBroken = true; throw new Error('CLOCK') }
        lastTime = value
        return value
      }
      function within() {
        if (time() >= deadline) throw new Error('DEADLINE')
        if (ended || blocked || (service && service.lost)) throw new Error('SERVICE_LOST')
      }
      function cancelTimer() {
        if (timer === undefined) return
        const held = timer; timer = undefined
        try {
          if (ports.cancel(held) !== undefined) throw new Error('TIMER_CANCEL')
          timerState = timerUncertain ? 'possible' : 'closed'
        } catch { timerUncertain = true; timerState = 'possible'; throw new Error('TIMER_CANCEL') }
      }
      function arm(delay) {
        timerState = 'possible'
        timer = ports.schedule(() => { timer = undefined; timerState = 'closed'; drive() }, delay)
        if (timer === undefined || timer === null || typeof timer?.then === 'function') throw new Error('TIMER')
        timerState = 'confirmed'
        within()
      }
      function enter(next) {
        within(); cancelTimer(); within()
        stages[stages.length - 1].confirmedAt = lastTime
        stage = next; deadline = lastTime + 5_000
        stages.push({ name: stage, start: lastTime, deadline, confirmedAt: null })
        arm(5_000)
      }
      function finish() {
        if (done) return
        done = true
        preparationStop = null
        try { cancelTimer() } catch { errors.add('TIMER_CANCEL') }
        let removed = true
        for (const entry of listeners) {
          try {
            if (entry.target.removeEventListener(entry.name, entry.callback) !== undefined) throw new Error('REMOVE')
          } catch { removed = false; errors.add('REGISTRATION_CLOSE') }
        }
        if (listeners.length) registrations = removed ? 'closed' : 'possible'
        if (timerUncertain) timerState = 'possible'
        try { if (time() >= deadline) errors.add('DEADLINE') } catch { errors.add('CLOCK') }
        const ready = !stopCode && !errors.size && closed && version && serviceCurrent() &&
          connection === 'closed' && registrations === 'closed' && timerState === 'closed' && !ended
        if (ready) {
          stages[stages.length - 1].confirmedAt = lastTime
          service.binding = frozen({ serviceId: service.id, webSocketUrl: service.endpoint, version })
          phase = 'READY'
        } else { phase = 'FAILED'; blocked = true; if (service) service.lost = true }
        preparationReport = frozen({ status: ready ? 'READY' : 'FAILED',
          errors: frozen([...errors]), connection, registrations, timer: timerState,
          endpointReads, connectionsAttempted: socket ? 1 : (connection === 'possible' ? 1 : 0),
          versionCommands: commandSent ? 1 : 0, connectionClosed: closed,
          stages: frozen(stages.map((entry) => frozen({ ...entry }))), resources: serviceResources(), runtimeRecord: null })
        socket = null
        resolve(preparationReport)
      }
      function fail(code) {
        if (done) return
        if (!stopCode) {
          stopCode = code; errors.add(code); blocked = true
          // Capture once, before cancellation or any other close operation.
          // An already expired phase keeps its earlier absolute stop time.
          try { stoppedAt = Math.min(time(), deadline) } catch { errors.add('CLOCK') }
        }
        if (!socket || closed || clockBroken) {
          if (socket && !closed && !closing) { closing = true; try { socket.close() } catch { errors.add('CLOSE') } }
          finish(); return
        }
        if (!closing) {
          closing = true
          stage = 'close'; deadline = stoppedAt + 5_000
          stages.push({ name: stage, start: stoppedAt, deadline, confirmedAt: null })
          // A failure gets one bounded normal close, never another connection.
          try {
            cancelTimer()
            if (done) return
            if (time() >= deadline) {
              errors.add('CLOSE_DEADLINE')
              socket.close()
              finish(); return
            }
            timerState = 'possible'
            timer = ports.schedule(() => { timer = undefined; timerState = 'closed'; errors.add('CLOSE_DEADLINE'); finish() }, deadline - lastTime)
            if (timer === undefined || timer === null || typeof timer?.then === 'function') throw new Error('TIMER')
            timerState = 'confirmed'
            socket.close()
            if (time() >= deadline) { errors.add('CLOSE_DEADLINE'); finish() }
          } catch { errors.add('CLOSE'); finish() }
        } else { finish() }
      }
      function guarded(callback) {
        return (...args) => {
          if (done) return
          try { callback(...args) } catch { fail('PREPARATION_FAILED') }
        }
      }
      function listen(name, callback) {
        registrations = 'possible'
        const entry = { target: socket, name, callback: guarded(callback) }
        listeners.push(entry)
        if (socket.addEventListener(name, entry.callback) !== undefined) throw new Error('REGISTER')
        registrations = 'confirmed'
        within()
      }
      function connect() {
        enter('connect'); within()
        connection = 'possible'
        socket = ports.createWebSocket(service.endpoint)
        if (!socket || socket.url !== service.endpoint || socket.readyState !== 0 ||
            !['send', 'close', 'addEventListener', 'removeEventListener'].every((key) => typeof socket[key] === 'function')) throw new Error('SOCKET')
        within()
        listen('close', () => {
          closed = true; connection = 'closed'
          if (!closing || socket.readyState !== 3) { errors.add('UNEXPECTED_CLOSE'); stopCode ||= 'UNEXPECTED_CLOSE' }
          finish()
        })
        listen('error', () => fail('SOCKET_ERROR'))
        listen('message', (event) => {
          within()
          if (++messages > 1 || stage !== 'version' || !commandSent || typeof event.data !== 'string' ||
              Buffer.byteLength(event.data, 'utf8') > 8_192) throw new Error('VERSION_MESSAGE')
          const packet = fields(JSON.parse(event.data), ['id', 'result'])
          const values = packet && packet.id === 1 && fields(packet.result, VERSION_KEYS)
          if (!values || !VERSION_KEYS.every((key) => typeof values[key] === 'string' && values[key].length > 0 && values[key].length <= 512)) throw new Error('VERSION')
          version = frozen({ ...values })
          enter('close'); within()
          closing = true
          socket.close()
          within()
        })
        listen('open', () => {
          within()
          if (stage !== 'connect' || socket.readyState !== 1 || socket.url !== service.endpoint || !serviceCurrent()) throw new Error('OPEN')
          connection = 'confirmed'
          enter('version'); within()
          commandSent = true
          socket.send(JSON.stringify({ id: 1, method: 'Browser.getVersion', params: {} }))
          within()
        })
      }
      function drive() {
        if (done || driving) return
        driving = true
        try {
          within()
          if (stage !== 'endpoint') throw new Error('DEADLINE')
          if (service?.spawned) {
            if (!serviceCurrent() || ++endpointReads > 301) throw new Error('ENDPOINT_LIMIT')
            const endpoint = readEndpoint(); within()
            if (endpoint) { service.endpoint = endpoint; connect(); return }
          }
          cancelTimer(); within()
          arm(Math.min(100, deadline - lastTime))
        } catch { fail('PREPARATION_FAILED') }
        finally { driving = false }
      }
      preparationStop = fail
      try {
        deadline = time() + 30_000
        stages.push({ name: stage, start: lastTime, deadline, confirmedAt: null })
        verifyExecutable(); within()
        // Non-recursive exclusive creation. Existing profiles are never reused.
        profileState = 'possible'
        if (ports.fs.mkdirSync(PROFILE) !== undefined) throw new Error('PROFILE')
        profileState = 'confirmed'
        within()
        const serviceId = ports.uuid(), generation = ports.uuid()
        if (!id(serviceId) || !id(generation) || new Set([serviceId, generation, session.id, session.generation]).size !== 4) throw new Error('GENERATION')
        service = { id: serviceId, generation, child: null, reference: null, spawned: false,
          lost: false, processExited: false, processClosed: false, outputClosed: false,
          stdoutClosed: false, stderrClosed: false, outputBytes: 0, monitorState: 'notAttempted', monitors: [] }
        within()
        processState = 'possible'; outputStates.stdout = 'possible'; outputStates.stderr = 'possible'
        const child = ports.spawn(configuration.chromeExecutable, [
          `--user-data-dir=${PROFILE}`, '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=0',
          '--no-first-run', '--no-default-browser-check', '--disable-extensions', 'about:blank',
        ], { shell: false, detached: false, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
        if (ports.isChild(child) !== true) throw new Error('PROCESS')
        service.child = child; service.reference = child; service.startedAt = lastTime
        processState = 'confirmed'
        const monitors = service.monitors
        let monitorCloseAttempted = false
        function monitor(target, name, callback) {
          const listener = (...args) => { try { callback(...args) } catch { loseService('PROCESS_OBSERVATION_FAILED') } }
          const entry = { target, name, listener, state: 'possible' }
          monitors.push(entry); service.monitorState = 'possible'
          if (target.on(name, listener) !== target) throw new Error('PROCESS_REGISTER')
          entry.state = 'confirmed'
        }
        function closeMonitors() {
          if (monitorCloseAttempted || !service.processClosed || !service.stdoutClosed || !service.stderrClosed) return
          // Set before external calls; failed positions survive repetition/reentry.
          monitorCloseAttempted = true
          service.monitorState = 'possible'
          for (const entry of monitors) {
            entry.state = 'possible'
            try {
              if (entry.target.removeListener(entry.name, entry.listener) === entry.target) entry.state = 'closed'
            } catch { /* Retain the unconfirmed registration and its identity. */ }
          }
          service.monitorState = monitors.every((entry) => entry.state === 'closed') ? 'closed' : 'possible'
        }
        monitor(child, 'error', () => loseService('PROCESS_ERROR'))
        monitor(child, 'exit', () => { service.processExited = true; loseService('PROCESS_EXIT') })
        monitor(child, 'close', () => { service.processClosed = true; processState = 'closed'; loseService('PROCESS_CLOSE'); closeMonitors() })
        monitor(child, 'disconnect', () => loseService('PROCESS_DISCONNECT'))
        monitor(child, 'spawn', () => {
          if (service.spawned || !Number.isSafeInteger(child.pid) || child.pid <= 0) { loseService('PROCESS_GENERATION'); return }
          service.spawned = true; service.pid = child.pid
          drive()
        })
        let outputsComplete = true
        for (const name of ['stdout', 'stderr']) {
          // Inspect both pipes independently, after the process error/close hooks.
          // One missing pipe must not discard observation of the other pipe.
          try {
            const stream = child[name]
            if (!stream) { outputStates[name] = 'missing'; outputsComplete = false; continue }
            if (typeof stream.on !== 'function' || typeof stream.removeListener !== 'function') throw new Error('OUTPUT')
            outputStates[name] = 'confirmed'
            monitor(stream, 'data', (chunk) => {
              // Drain but never retain raw browser output, including after failure.
              if (!Buffer.isBuffer(chunk)) { loseService('OUTPUT_TYPE'); return }
              service.outputBytes = Math.min(65_537, service.outputBytes + chunk.length)
              if (service.outputBytes > 65_536) loseService('OUTPUT_LIMIT')
            })
            monitor(stream, 'error', () => loseService('OUTPUT_ERROR'))
            monitor(stream, 'close', () => {
              service[`${name}Closed`] = true
              outputStates[name] = 'closed'
              service.outputClosed = service.stdoutClosed && service.stderrClosed
              loseService('OUTPUT_CLOSE'); closeMonitors()
            })
          } catch { outputsComplete = false }
        }
        service.monitorState = monitors.every((entry) => entry.state === 'confirmed') ? 'confirmed' : 'possible'
        if (!outputsComplete) throw new Error('OUTPUT')
        within(); drive()
      } catch { fail('PREPARATION_FAILED') }
    })
  }

  function authorizeControl(request) {
    if (busy || phase !== 'READY' || blocked || ended || activeRun || permission || usedRuns.size >= MAX_RUNS) return null
    busy = true
    try {
      const entry = fields(request, ['operator', 'decision', 'runId', 'sessionId', 'sessionGeneration', 'serviceId', 'serviceGeneration'])
      if (!entry || entry.operator !== 'Jan' || entry.decision !== 'ALLOW_CONTROL_ONCE' || !id(entry.runId) ||
          usedRuns.has(entry.runId) || entry.sessionId !== session.id || entry.sessionGeneration !== session.generation ||
          entry.serviceId !== service.id || entry.serviceGeneration !== service.generation || !serviceCurrent()) return null
      permission = frozen({ runId: entry.runId, sessionId: session.id, sessionGeneration: session.generation,
        serviceId: service.id, serviceGeneration: service.generation })
      return permission
    } catch { return null }
    finally { busy = false }
  }

  function runControl(request) {
    const denied = () => Promise.resolve(frozen({ status: 'NOT_RUN', resourceStatus: 'NOT_RUN' }))
    if (busy || phase !== 'READY' || blocked || ended || activeRun || !permission) return denied()
    busy = true
    try {
      const entry = fields(request, ['permission'], ['signal'])
      if (!entry || entry.permission !== permission || !serviceCurrent()) return denied()
      activeRun = permission.runId
      usedRuns.add(activeRun)
      const runId = activeRun
      const control = createNodeCdpContextControl({ binding: service.binding, startGate: gate,
        createWebSocket: ports.createWebSocket, now: ports.now, schedule: ports.schedule, cancel: ports.cancel,
        evidence: { save(snapshot) { evidence.set(runId, snapshot); return true } } })
      return control.runOnce({ runId, signal: entry.signal }).then((report) => {
        if (report.resourceStatus !== 'PASS') blocked = true
        activeRun = null; permission = null
        return report
      }, () => {
        blocked = true; activeRun = null; permission = null
        return frozen({ status: 'FAILED', resourceStatus: 'UNPROVEN', runtimeRecord: null })
      })
    } catch { blocked = true; activeRun = null; permission = null; return denied() }
    finally { busy = false }
  }

  function reportResourceFinding(request) {
    try {
      const entry = fields(request, ['runId', 'resourceStatus', 'code'])
      const lease = entry && leases.get(entry.runId)
      return !!lease && gate.block(lease, entry)
    } catch { return false }
  }

  function end() {
    ended = true; blocked = true
    preparationStop?.('HOST_ENDED')
    // No kill, deletion, automatic cleanup, process adoption, restart or unlock.
    return true
  }

  function inspect() {
    if (phase === 'READY') serviceCurrent()
    return frozen({ phase, blocked, ended, reserved, directory: NODE_CDP_OPERATOR_DIRECTORY,
      sessionId: session?.id ?? null, sessionGeneration: session?.generation ?? null,
      serviceId: service?.id ?? null, serviceGeneration: service?.generation ?? null,
      serviceLost: service?.lost ?? false, processExited: service?.processExited ?? false,
      processClosed: service?.processClosed ?? false, outputClosed: service?.outputClosed ?? false,
      processRegistrations: service?.monitorState ?? 'notAttempted',
      resources: serviceResources(),
      binding: service?.binding ?? null, preparation: preparationReport, activeRun: activeRun ?? null })
  }

  return frozen({ reserve, prepareService, authorizeControl, runControl, reportResourceFinding, end, inspect,
    readEvidence: (runId) => evidence.get(runId) ?? null })
}
