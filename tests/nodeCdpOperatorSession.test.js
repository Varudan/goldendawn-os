import { createNodeCdpOperatorSession, createNodeCdpOperatorSessionForTest, runNodeCdpOperatorSessionCli, SESSION_EVIDENCE_ROOT, SERVICE_FOLLOWUP_MS } from '../scripts/browser/nodeCdpOperatorSession.js'
import test from 'node:test'
import assert from 'node:assert/strict'
import * as realFs from 'node:fs'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, win32 } from 'node:path'
import { createHash } from 'node:crypto'
import { EventEmitter } from 'node:events'
import { runInNewContext } from 'node:vm'
import { createNodeCdpOperatorHost, createNodeCdpOperatorHostForTest,
  NODE_CDP_OPERATOR_DIRECTORY as ROOT } from '../scripts/browser/nodeCdpOperatorHost.js'

const MARKER = win32.join(ROOT, 'reservation.json')
const PROFILE = win32.join(ROOT, 'synthetic-profile')
const ENDPOINT = win32.join(PROFILE, 'DevToolsActivePort')
const EXE = 'C:\\Synthetic\\chrome.exe'
const EXE_BYTES = Buffer.from('synthetic executable bytes, never executed')
const CONFIG = { chromeExecutable: EXE, chromeSha256: createHash('sha256').update(EXE_BYTES).digest('hex') }
const CLARIFIED = { operator: 'Jan', decision: 'INITIAL_STATE_CLARIFIED', reference: 'synthetic-clarification-1' }
const VERSION = { protocolVersion: '1.3', product: 'Chrome/synthetic', revision: 'synthetic-r1',
  userAgent: 'synthetic-agent', jsVersion: 'synthetic-js' }
const URL = 'ws://127.0.0.1:9222/devtools/browser/synthetic-browser'
const ioError = (code = 'EIO') => Object.assign(new Error('synthetic IO error'), { code })

function fixture(settings = {}) {
  const files = settings.files ?? new Map([[EXE, Buffer.from(EXE_BYTES)]])
  const directories = settings.directories ?? new Set([ROOT, SESSION_EVIDENCE_ROOT])
  const descriptors = new Map(), queue = [], timers = new Map(), commands = [], sockets = [], effects = []
  const counts = { fs: 0, uuid: 0, spawn: 0, socket: 0, clock: 0, timer: 0, cancel: 0,
    adds: 0, removes: 0, childChecks: 0 }
  let now = 0, sequence = 0, timerSequence = 0, fdSequence = 0
  const h = { files, directories, descriptors, queue, timers, commands, sockets, effects, hooks: {},
    counts: () => ({ ...counts }), time: (value) => { now = value },
    flush() {
      let steps = 0
      while (queue.length) { assert.ok(++steps < 500, 'finite fake event queue'); queue.shift()() }
    },
    advance(value) {
      now = value
      let steps = 0
      while ([...timers.values()].some((entry) => entry.at <= now)) {
        assert.ok(++steps < 400, 'finite timer delivery')
        const [key, entry] = [...timers].filter(([, item]) => item.at <= now).sort((a, b) => a[1].at - b[1].at)[0]
        timers.delete(key); entry.callback(); h.flush()
      }
      h.flush()
    },
  }
  function stat(file, directory = false) {
    return { size: file?.length ?? 0, nlink: 1, isFile: () => !directory,
      isDirectory: () => directory, isSymbolicLink: () => false }
  }
  const implementation = {
    lstatSync(name) {
      if (directories.has(name)) return stat(null, true)
      if (!files.has(name)) throw ioError('ENOENT')
      return stat(files.get(name))
    },
    realpathSync: (name) => name,
    openSync(name, mode) {
      if (mode === 'wx+') {
        if (files.has(name)) throw ioError('EEXIST')
        files.set(name, Buffer.alloc(0))
      } else if (!files.has(name)) throw ioError('ENOENT')
      const descriptor = ++fdSequence
      descriptors.set(descriptor, name)
      h.hooks.opened?.(name, mode, descriptor)
      return descriptor
    },
    writeSync(descriptor, bytes, offset, length, position) {
      const name = descriptors.get(descriptor)
      const count = Math.min(length, settings.partialWrite ?? length)
      const result = Buffer.alloc(Math.max(files.get(name).length, position + count))
      files.get(name).copy(result); bytes.copy(result, position, offset, offset + count)
      files.set(name, result)
      return count
    },
    fsyncSync() {},
    fstatSync(descriptor) { return stat(files.get(descriptors.get(descriptor))) },
    readSync(descriptor, buffer, offset, length, position) {
      const bytes = files.get(descriptors.get(descriptor))
      const count = Math.max(0, Math.min(length, bytes.length - position))
      bytes.copy(buffer, offset, position, position + count)
      return count
    },
    closeSync(descriptor) { descriptors.delete(descriptor) },
    mkdirSync(name) { if (directories.has(name)) throw ioError('EEXIST'); directories.add(name) },
  }
  const fakeFs = Object.fromEntries(Object.entries(implementation).map(([method, fn]) => [method, (...args) => {
    counts.fs++; effects.push({ type: 'fs', method, name: typeof args[0] === 'string' ? args[0] : descriptors.get(args[0]) })
    const override = h.hooks.fs?.(method, args)
    if (override) return override.value
    return fn(...args)
  }]))
  class ProcessEvents extends EventEmitter {
    on(name, callback) { counts.adds++; h.hooks.processAdd?.(this, name); return super.on(name, callback) }
    removeListener(name, callback) {
      counts.removes++
      const override = h.hooks.processRemove?.(this, name)
      if (override) return override.value
      return super.removeListener(name, callback)
    }
  }
  class Child extends ProcessEvents {
    stdout = new ProcessEvents()
    stderr = new ProcessEvents()
    pid = 321
    exitCode = null
    signalCode = null
    killed = false
    spawnfile = EXE
  }
  class Socket {
    url = URL
    readyState = 0
    listeners = new Map()
    closes = 0
    addEventListener(name, callback) {
      counts.adds++
      if (!this.listeners.has(name)) this.listeners.set(name, new Set())
      this.listeners.get(name).add(callback)
      h.hooks.socketAdd?.(this, name)
    }
    removeEventListener(name, callback) {
      counts.removes++; h.hooks.socketRemove?.(this, name)
      this.listeners.get(name)?.delete(callback)
    }
    emit(name, value = {}) { for (const callback of [...(this.listeners.get(name) ?? [])]) callback(value) }
    packet(value) { this.emit('message', { data: JSON.stringify(value) }) }
    send(raw) {
      const command = JSON.parse(raw)
      commands.push(command)
      h.hooks.send?.(command, this)
      queue.push(() => {
        if (h.hooks.command?.(command, this) === true) return
        const answer = (result) => this.packet({ id: command.id, result,
          ...(command.sessionId ? { sessionId: command.sessionId } : {}) })
        const event = (method, params) => this.packet({ method, params })
        const target = { targetId: 'target-own', browserContextId: 'context-own', type: 'page', url: 'about:blank' }
        switch (command.method) {
          case 'Browser.getVersion': answer({ ...VERSION }); break
          case 'Target.getBrowserContexts': answer({ browserContextIds: this.disposed ? [] : ['foreign-context'] }); break
          case 'Target.setDiscoverTargets': answer({}); break
          case 'Target.createBrowserContext': answer({ browserContextId: target.browserContextId }); break
          case 'Target.createTarget': event('Target.targetCreated', { targetInfo: target }); answer({ targetId: target.targetId }); break
          case 'Target.getTargetInfo': answer({ targetInfo: target }); break
          case 'Target.attachToTarget':
            event('Target.attachedToTarget', { sessionId: 'session-own', targetInfo: target, waitingForDebugger: false })
            answer({ sessionId: 'session-own' }); break
          case 'Page.enable': answer({}); break
          case 'Page.getFrameTree': answer({ frameTree: { frame: { id: 'frame-own', loaderId: 'loader-own', url: 'about:blank' } } }); break
          case 'Target.disposeBrowserContext':
            this.disposed = true
            event('Target.targetDestroyed', { targetId: target.targetId })
            event('Target.detachedFromTarget', { sessionId: 'session-own', targetId: target.targetId })
            answer({}); break
          default: h.unexpectedCommands = (h.unexpectedCommands ?? 0) + 1
        }
      })
    }
    close() {
      this.closes++; h.hooks.close?.(this)
      if (settings.noClose) return
      this.readyState = 2
      queue.push(() => { this.readyState = 3; this.emit('close') })
    }
  }
  h.ports = { fs: fakeFs,
    uuid() { counts.uuid++; return h.hooks.uuid?.() ?? `synthetic-${++sequence}` },
    isChild(child) { counts.childChecks++; return child instanceof Child },
    spawn(executable, args, spawnOptions) {
      counts.spawn++; h.spawnArguments = { executable, args, spawnOptions }
      h.child = new Child()
      h.hooks.spawn?.(h.child)
      if (!settings.noSpawn) queue.push(() => {
        if (!settings.noEndpoint) files.set(ENDPOINT, Buffer.from(settings.endpoint ?? '9222\n/devtools/browser/synthetic-browser'))
        h.child.emit('spawn')
      })
      return h.child
    },
    createWebSocket(url) {
      counts.socket++
      const socket = new Socket(); socket.url = url
      sockets.push(socket)
      h.hooks.socket?.(socket)
      if (!settings.noOpen) queue.push(() => { socket.readyState = 1; socket.emit('open') })
      return socket
    },
    now() { counts.clock++; h.hooks.clock?.(); return now },
    schedule(callback, delay) {
      counts.timer++; h.hooks.schedule?.(delay)
      const handle = ++timerSequence; timers.set(handle, { callback, at: now + delay }); return handle
    },
    cancel(handle) { counts.cancel++; h.hooks.cancel?.(handle); timers.delete(handle) },
  }
  return h
}

const SESSION_CONFIG = { ...CONFIG, stateDecision: CLARIFIED.decision, stateReference: CLARIFIED.reference,
  networkDecision: 'ACCEPT_BROWSER_BACKGROUND_NETWORK', networkReference: 'synthetic-network-decision' }
function sessionFixture(settings = {}) {
  const h = fixture(settings)
  h.helperCount = 0; h.forbidden = 0
  for (const key of ['rmSync', 'unlinkSync', 'rmdirSync']) h.ports.fs[key] = () => { h.forbidden++; throw ioError() }
  const originalSpawn = h.ports.spawn
  h.ports.spawn = (...args) => {
    const child = originalSpawn(...args)
    child.kill = () => { h.forbidden++; throw ioError() }
    child.unref = () => { h.forbidden++; throw ioError() }
    for (const stream of [child.stdout, child.stderr]) stream.destroy = () => { h.forbidden++; throw ioError() }
    return child
  }
  h.sessionPorts = { fs: h.ports.fs, now: h.ports.now, schedule: h.ports.schedule, cancel: h.ports.cancel,
    uuid: h.ports.uuid, utc: () => '2026-11-06T00:00:00.000Z',
    binding: () => ({ source: 'synthetic-bound-source', helper: 'synthetic-bound-helper' }),
    isChild: (child) => child instanceof EventEmitter,
    helperSpawn(observation) {
      h.helperCount++
      const child = new EventEmitter()
      child.stdout = new EventEmitter(); child.stderr = new EventEmitter()
      child.kill = () => { h.forbidden++; throw ioError() }
      for (const stream of [child.stdout, child.stderr]) stream.destroy = () => { h.forbidden++; throw ioError() }
      h.helper = child
      h.hooks.helper?.(child)
      if (!settings.helperPending) h.queue.push(() => {
        const answer = h.hooks.helperReply?.(observation) ?? { schema: 1, status: 'CANDIDATE', pid: observation.pid,
          executable: observation.executable, handle: '12345', processStartUtcTicks: '638000000000000000' }
        child.stdout.emit('data', Buffer.from(typeof answer === 'string' ? answer : JSON.stringify(answer)))
        child.emit('exit', 0, null); child.stdout.emit('close'); child.stderr.emit('close'); child.emit('close', 0, null)
      })
      return child
    },
  }
  h.session = createNodeCdpOperatorSessionForTest(SESSION_CONFIG, h.sessionPorts, h.ports)
  h.prepareSession = async () => { const pending = h.session.prepare(); h.flush(); return pending }
  h.readySession = async () => { assert.equal(h.session.begin(), true); assert.equal((await h.prepareSession()).status, 'READY') }
  h.allow = () => ({ operator: 'Jan', decision: 'ALLOW_CONTROL_ONCE', ...h.session.inspect().confirmation })
  h.runSession = async () => { const pending = h.session.controlOnce(h.allow()); h.flush(); return pending }
  h.closeService = () => {
    h.child.exitCode = 0; h.child.emit('exit', 0, null)
    h.child.stdout.emit('close'); h.child.stderr.emit('close'); h.child.emit('close', 0, null)
  }
  h.finish = async () => { h.closeService(); h.advance(100); return h.session.completed() }
  return h
}

test('factory and help do not read options, install input or call effect ports', () => {
  let reads = 0, calls = 0
  const poisoned = new Proxy({}, { get() { reads++; throw ioError() }, getPrototypeOf() { reads++; throw ioError() } })
  const a = createNodeCdpOperatorSession(poisoned)
  const b = createNodeCdpOperatorSessionForTest(poisoned, poisoned, poisoned)
  const output = []
  runNodeCdpOperatorSessionCli(['--help'], { output: value => output.push(value),
    get input() { calls++; throw ioError() }, get signals() { calls++; throw ioError() } })
  assert.equal(a.inspect().phase, 'NEW'); assert.equal(b.inspect().phase, 'NEW')
  assert.equal(reads, 0); assert.equal(calls, 0); assert.match(output[0], /kein Start ohne --run/)
})

test('fresh import, factory and help are inert under native effect guards', async () => {
  const { default: filesystem } = await import('node:fs')
  const { default: processes } = await import('node:child_process')
  const { register, syncBuiltinESMExports } = await import('node:module')
  register('data:text/javascript,' + encodeURIComponent('export async function load(u,c,n){return n(u,c)}'), import.meta.url)
  const saved = [], effects = []
  function trap(target, key) {
    saved.push([target, key, Object.getOwnPropertyDescriptor(target, key)])
    Object.defineProperty(target, key, { configurable: true, writable: true, value() { effects.push(key); throw ioError() } })
  }
  let fresh, session, error
  try {
    for (const key of ['openSync', 'readFileSync', 'writeSync', 'mkdirSync', 'fsyncSync']) trap(filesystem, key)
    trap(processes, 'spawn'); trap(globalThis, 'WebSocket'); trap(globalThis, 'setTimeout')
    trap(process.stdin, 'on'); trap(process, 'on')
    syncBuiltinESMExports()
    fresh = await import('../scripts/browser/nodeCdpOperatorSession.js?portable-inert-session')
    session = fresh.createNodeCdpOperatorSession(SESSION_CONFIG)
    fresh.runNodeCdpOperatorSessionCli(['--help'], { output() {} })
  } catch (caught) { error = caught }
  finally {
    for (const [target, key, d] of saved.reverse()) { if (d) Object.defineProperty(target, key, d); else Reflect.deleteProperty(target, key) }
    syncBuiltinESMExports()
  }
  assert.equal(error, undefined); assert.deepEqual(effects, [])
  assert.notEqual(fresh.createNodeCdpOperatorSession, createNodeCdpOperatorSession)
  assert.equal(session.inspect().phase, 'NEW')
})

test('actual CLI entry only prints help or rejects missing explicit arguments', async () => {
  const { spawnSync } = await import('node:child_process')
  const { fileURLToPath } = await import('node:url')
  for (const argv of [[], ['--help'], ['--run'], ['--chrome-executable', EXE]]) {
    const result = spawnSync(process.execPath, [fileURLToPath(new globalThis.URL('../scripts/browser/nodeCdpOperatorSession.js', import.meta.url)), ...argv],
      { encoding: 'utf8', windowsHide: true, timeout: 10_000 })
    assert.equal(result.error, undefined); assert.equal(result.status, 0); assert.equal(result.stderr, '')
    assert.match(result.stdout, argv.length < 2 && argv[0] !== '--run' ? /kein Start ohne --run/ : /START_REFUSED/)
  }
})

test('one real Host/Owner, separate READY authorization, unchanged report and private permission', async () => {
  const h = sessionFixture(); await h.readySession()
  assert.equal(h.counts().spawn, 1); assert.equal(h.counts().socket, 1)
  assert.equal(h.commands.length, 1)
  const ready = h.session.inspect(), confirmation = ready.confirmation
  assert.deepEqual(Object.keys(confirmation).sort(), ['confirmation', 'serviceGeneration', 'serviceId', 'sessionGeneration', 'sessionId'].sort())
  for (const key of ['sessionId', 'sessionGeneration', 'serviceId', 'serviceGeneration']) assert.equal(confirmation[key], ready.host[key])
  const report = await h.runSession()
  assert.equal(report.status, 'PASS'); assert.equal(report.evidenceSaved, true); assert.equal(report.contextReturned, true)
  assert.equal(h.session.report().control, report)
  assert.equal(h.session.inspect().host.ended, true); assert.equal(h.session.inspect().startsBlocked, true)
  assert.equal(h.counts().spawn, 1); assert.equal(h.counts().socket, 2)
  const final = await h.finish()
  assert.equal(final.followup.status, 'PASS'); assert.equal(final.fileEvidence.status, 'PASS')
  assert.equal(final.resources.file, 'closed'); assert.equal(final.resources.timer, 'closed')
  assert.ok(h.files.has(MARKER)); assert.ok(h.directories.has(PROFILE)); assert.equal(h.forbidden, 0)
  const text = [...h.files.entries()].filter(([p]) => p.startsWith(SESSION_EVIDENCE_ROOT)).map(([,b])=>b.toString()).join('')
  assert.doesNotMatch(text, /"permission"|rawPayload|synthetic executable bytes/)
  assert.equal(await h.session.controlOnce({ operator: 'Jan', decision: 'ALLOW_CONTROL_ONCE', ...confirmation }), null)
  assert.equal(h.counts().socket, 2); assert.equal(h.session.begin(), false)
})

for (const field of ['stateDecision', 'stateReference', 'networkDecision', 'networkReference']) {
  test(`no positive default for ${field}; no reservation or browser attempt`, async () => {
    const h = sessionFixture(), config = { ...SESSION_CONFIG }; delete config[field]
    h.session = createNodeCdpOperatorSessionForTest(config, h.sessionPorts, h.ports)
    assert.equal(h.session.begin(), false)
    assert.equal(h.files.has(MARKER), false); assert.equal(h.counts().spawn, 0)
    assert.equal((await h.session.completed()).phase, 'FINAL')
  })
}
test('closed schemas reject getters without invoking them and missing test ports never fall back', async () => {
  let reads = 0
  const value = { ...SESSION_CONFIG }
  Object.defineProperty(value, 'stateReference', { get() { reads++; return 'forbidden' } })
  const h = sessionFixture()
  assert.equal(createNodeCdpOperatorSessionForTest(value, h.sessionPorts, h.ports).begin(), false)
  for (const key of Object.keys(h.sessionPorts)) {
    const ports = { ...h.sessionPorts }; delete ports[key]
    assert.equal(createNodeCdpOperatorSessionForTest(SESSION_CONFIG, ports, h.ports).begin(), false)
  }
  assert.equal(reads, 0); assert.equal(h.counts().spawn, 0)
})

for (const field of ['confirmation', 'sessionId', 'sessionGeneration', 'serviceId', 'serviceGeneration', 'operator', 'decision']) {
  test(`stale or contradictory ${field} permanently refuses control`, async () => {
    const h = sessionFixture(); await h.readySession()
    assert.equal(await h.session.controlOnce({ ...h.allow(), [field]: 'stale' }), null)
    assert.equal(h.counts().socket, 1); assert.equal(h.session.inspect().host.ended, true)
    assert.equal(await h.session.controlOnce(h.allow()), null)
    await h.finish(); assert.equal(h.forbidden, 0)
  })
}
test('copied host permission is not a session confirmation; reentrant repeated control aborts only', async () => {
  const h = sessionFixture(); await h.readySession()
  const copied = { ...h.session.inspect().host, decision: 'ALLOW_CONTROL_ONCE' }
  assert.equal(await h.session.controlOnce(copied), null); assert.equal(h.counts().socket, 1)
  await h.finish()
  const q = sessionFixture(); await q.readySession(); const request = q.allow()
  const p = q.session.controlOnce(request)
  assert.equal(await q.session.controlOnce(request), null)
  assert.equal(q.session.inspect().host.ended, false)
  q.flush(); await p; await q.finish(); assert.equal(q.counts().socket, 2)
})

for (const phase of ['NEW', 'RESERVED', 'PREPARING', 'READY', 'CONTROLLING', 'FOLLOWUP']) {
  test(`abort/EOF/repeated signals during ${phase} preserve normal completion`, async () => {
    const h = sessionFixture({ noOpen: phase === 'PREPARING' })
    let pending
    if (phase !== 'NEW') assert.equal(h.session.begin(), true)
    if (phase === 'PREPARING') pending = h.session.prepare()
    if (['READY','CONTROLLING','FOLLOWUP'].includes(phase)) await h.prepareSession()
    if (phase === 'CONTROLLING') pending = h.session.controlOnce(h.allow())
    if (phase === 'FOLLOWUP') await h.runSession()
    h.session.stop('EOF'); h.session.stop('SIGINT'); h.session.stop('SIGTERM')
    if (phase === 'CONTROLLING') assert.equal(h.session.inspect().host.ended, false)
    h.flush(); if (pending) await pending
    if (h.child) await h.finish(); else if (phase !== 'NEW') h.advance(100)
    assert.equal(h.session.inspect().startsBlocked, true); assert.equal(h.forbidden, 0)
  })
}

test('control abort after document binding still disposes its context before host end', async () => {
  const h = sessionFixture(); await h.readySession()
  let endedDuringDispose
  h.hooks.send = (command) => {
    if (command.method === 'Page.getFrameTree') h.queue.push(() => h.session.stop())
    if (command.method === 'Target.disposeBrowserContext') endedDuringDispose = h.session.inspect().host.ended
  }
  const report = await h.runSession()
  assert.equal(endedDuringDispose, false); assert.equal(report.contextReturned, true)
  await h.finish(); assert.equal(h.forbidden, 0)
})

test('input processes abort while preparation Promise is pending and closes listeners separately', async () => {
  const h = sessionFixture({ noOpen: true }); assert.equal(h.session.begin(), true)
  const input = new EventEmitter(), signals = new EventEmitter(), output = []
  input.pause = () => input
  assert.equal(h.session.installInput(input, signals, value => output.push(value)), true)
  input.emit('data', Buffer.from('{"action":"prepare","value":null}\n'))
  assert.equal(h.session.inspect().phase, 'PREPARING')
  signals.emit('SIGINT'); signals.emit('SIGINT'); input.emit('end'); h.flush()
  await Promise.resolve(); await Promise.resolve()
  await h.finish()
  assert.equal(h.session.report().resources.inputListeners, 'closed')
  assert.equal(input.listenerCount('data'), 0); assert.equal(signals.listenerCount('SIGINT'), 0)
})

for (const mode of ['missing', 'ambiguous', 'foreign-pid', 'invalid', 'oversize', 'changed', 'timeout', 'stderr']) {
  test(`window observation refuses ${mode}, never recommends closing`, async () => {
    const h = sessionFixture({ helperPending: ['timeout','stderr'].includes(mode) }); await h.readySession()
    if (mode === 'invalid') h.hooks.helperReply = () => '{'
    if (mode === 'oversize') h.hooks.helperReply = () => 'x'.repeat(4097)
    if (['missing','ambiguous'].includes(mode)) h.hooks.helperReply = () => ({ status: mode })
    if (mode === 'foreign-pid') h.hooks.helperReply = () => ({ schema:1,status:'CANDIDATE',pid:999,
      executable:EXE,handle:'1',processStartUtcTicks:'1' })
    if (mode === 'changed') h.hooks.helper = () => { h.child.pid = 999 }
    const p = h.session.queryWindow(); h.flush()
    if (mode === 'timeout') h.advance(5000)
    if (mode === 'stderr') h.helper.stderr.emit('data', Buffer.from('private exception must not persist'))
    const result = await p
    assert.equal(result.status, 'UNPROVEN'); assert.equal(result.closeRecommendation, false)
    assert.equal(h.helperCount, 1); assert.equal(h.forbidden, 0)
    assert.doesNotMatch(JSON.stringify(h.session.report()), /private exception/)
    h.session.stop(); h.closeService(); h.advance(125001); await h.session.completed()
    assert.equal(h.forbidden, 0)
  })
}
test('two bounded candidate queries before and after end retain generation and refuse durable identity', async () => {
  const h = sessionFixture(); await h.readySession()
  const first = h.session.queryWindow(); h.flush(); const result = await first
  assert.equal(result.status, 'CANDIDATE'); assert.equal(result.closeRecommendation, false)
  h.session.stop(); const end = h.session.inspect().deadlineMonotonic
  const second = h.session.queryWindow(); h.flush(); const repeated = await second
  assert.equal(repeated.status, 'CANDIDATE'); assert.deepEqual(repeated.host, result.host)
  assert.equal(h.session.inspect().deadlineMonotonic, end); assert.equal(await h.session.queryWindow(), null)
  await h.finish(); assert.equal(h.helperCount, 2)
})

for (const missing of ['exit','close','stdout','stderr','registrations']) {
  test(`service followup needs separate ${missing} completion and never extends its deadline`, async () => {
    const h = sessionFixture(); await h.readySession(); await h.runSession()
    const deadline = h.session.inspect().deadlineMonotonic
    assert.equal(deadline, SERVICE_FOLLOWUP_MS)
    if (missing === 'registrations') h.hooks.processRemove = () => ({ value: undefined })
    if (missing !== 'exit') { h.child.exitCode = 0; h.child.emit('exit') }
    if (missing !== 'stdout') h.child.stdout.emit('close')
    if (missing !== 'stderr') h.child.stderr.emit('close')
    if (missing !== 'close') h.child.emit('close')
    h.advance(119999); h.session.stop('SIGTERM'); h.session.stop('EOF')
    assert.equal(h.session.inspect().deadlineMonotonic, deadline)
    h.advance(deadline)
    const result = await h.session.completed()
    assert.ok(['FAIL','UNPROVEN'].includes(result.followup.status))
    h.closeService(); assert.equal(h.session.report().followup, result.followup)
    assert.equal(h.forbidden, 0)
  })
}
test('late complete observations never become a timely PASS', async () => {
  const h = sessionFixture(); await h.readySession(); await h.runSession()
  h.time(SERVICE_FOLLOWUP_MS); h.closeService(); h.advance(SERVICE_FOLLOWUP_MS)
  assert.equal((await h.session.completed()).followup.status, 'UNPROVEN')
})

for (const mode of ['partial','flush','close-throw','close-unconfirmed','exists','readback']) {
  test(`file evidence ${mode} blocks starts, preserves control cleanup and original evidenceSaved`, async () => {
    const h = sessionFixture(); await h.readySession()
    h.hooks.fs = (method, args) => {
      if (method === 'openSync' && typeof args[0] === 'string' && args[0].startsWith(SESSION_EVIDENCE_ROOT) && mode === 'exists') throw ioError('EEXIST')
      if (method === 'writeSync' && mode === 'partial') return { value: 1 }
      if (method === 'fsyncSync' && mode === 'flush') throw ioError()
      if (method === 'closeSync' && mode === 'close-throw') throw ioError()
      if (method === 'closeSync' && mode === 'close-unconfirmed') return { value: Promise.resolve() }
      if (method === 'readSync' && mode === 'readback') return { value: 0 }
    }
    const control = await h.runSession()
    assert.equal(control.evidenceSaved, true); assert.equal(control.contextReturned, true)
    assert.equal(h.session.inspect().host.ended, true); assert.equal(h.session.inspect().fileEvidence, 'FAILED')
    assert.equal(h.session.report().control, control)
    await h.finish(); assert.equal(h.forbidden, 0)
  })
}
test('existing evidence directory and persistent marker cannot be adopted after a new factory', async () => {
  const h = sessionFixture(); h.directories.add(win32.join(SESSION_EVIDENCE_ROOT,'node-cdp-session-synthetic-1'))
  assert.equal(h.session.begin(), false); assert.equal(h.files.has(MARKER), false)
  const q = sessionFixture(); assert.equal(q.session.begin(), true); q.session.stop(); q.advance(100)
  const next = createNodeCdpOperatorSessionForTest(SESSION_CONFIG, q.sessionPorts, q.ports)
  assert.equal(next.begin(), false); assert.equal(q.counts().spawn, 0); assert.ok(q.files.has(MARKER))
})

test('real own temporary evidence files are exclusive, hashed, flushed and closed', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'goldendawn-session-files-'))
  try {
    const h = sessionFixture(), mem = h.ports.fs, nativeFds = new Set()
    const map = (name) => join(directory, win32.relative(SESSION_EVIDENCE_ROOT, name))
    const isEvidence = (name) => typeof name === 'string' && name.startsWith(SESSION_EVIDENCE_ROOT)
    const overlay = { ...mem,
      lstatSync: name => isEvidence(name) ? realFs.lstatSync(map(name)) : mem.lstatSync(name),
      realpathSync: name => isEvidence(name) ? (realFs.realpathSync(map(name)) && name) : mem.realpathSync(name),
      mkdirSync: name => isEvidence(name) ? realFs.mkdirSync(map(name)) : mem.mkdirSync(name),
      openSync(name, flags) { if (!isEvidence(name)) return mem.openSync(name,flags)
        const fd=realFs.openSync(map(name),flags); nativeFds.add(fd); return fd },
    }
    for (const key of ['writeSync','fsyncSync','fstatSync','readSync']) overlay[key] = (fd,...args) =>
      nativeFds.has(fd) ? realFs[key](fd,...args) : mem[key](fd,...args)
    overlay.closeSync = fd => { if (!nativeFds.has(fd)) return mem.closeSync(fd); realFs.closeSync(fd); nativeFds.delete(fd) }
    h.sessionPorts.fs = overlay
    h.session = createNodeCdpOperatorSessionForTest(SESSION_CONFIG,h.sessionPorts,h.ports)
    await h.readySession(); await h.runSession(); const result=await h.finish()
    assert.equal(result.fileEvidence.status,'PASS'); assert.equal(nativeFds.size,0)
    for(const entry of result.fileEvidence.files){
      const bytes=realFs.readFileSync(join(map(result.fileEvidence.directory),entry.name))
      assert.equal(bytes.length,entry.bytes); assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256)
      assert.throws(()=>realFs.openSync(join(map(result.fileEvidence.directory),entry.name),'wx'),{code:'EEXIST'})
    }
  } finally { rmSync(directory,{recursive:true,force:true}) }
})

test('reentrancy during reservation and repeated preparation never spawn twice', async () => {
  const h = sessionFixture()
  let repeats = 0, accepted
  h.hooks.opened = (name) => {
    if (name === MARKER) { repeats++; accepted = h.session.begin(); h.session.stop('SIGINT') }
  }
  assert.equal(h.session.begin(), false); assert.equal(repeats, 1); assert.equal(accepted, false)
  h.advance(100); assert.equal(h.counts().spawn, 0)
  const q = sessionFixture(); await q.readySession()
  assert.equal(await q.session.prepare(), null)
  assert.equal(q.counts().spawn, 1); assert.equal(q.session.inspect().startsBlocked, true)
  await q.finish(); assert.equal(q.forbidden, 0)
})
test('READY confirmation getter is not invoked; early control cannot authorize a later start', async () => {
  const h = sessionFixture(); await h.readySession()
  let getters = 0
  const request = h.allow()
  Object.defineProperty(request, 'confirmation', { get() { getters++; return 'untrusted' } })
  assert.equal(await h.session.controlOnce(request), null); assert.equal(getters, 0)
  await h.finish()
  const q = sessionFixture(); assert.equal(q.session.begin(), true)
  assert.equal(await q.session.controlOnce({}), null); assert.equal(await q.session.prepare(), null)
  q.advance(100); assert.equal(q.counts().spawn, 0)
})
test('foreign session confirmation is rejected even with a plausible copied shape', async () => {
  const h = sessionFixture(), q = sessionFixture()
  q.sessionPorts.uuid = (() => { let n = 0; return () => `other-${++n}` })()
  await h.readySession(); await q.readySession()
  assert.equal(await h.session.controlOnce(q.allow()), null); assert.equal(h.counts().socket, 1)
  await h.finish(); q.session.stop(); await q.finish()
})
test('evidence failure before prepare never creates a browser; source binding failure never reserves', async () => {
  const h = sessionFixture()
  h.hooks.fs = (method) => method === 'writeSync' ? { value: 0 } : undefined
  assert.equal(h.session.begin(), false); assert.equal(h.files.has(MARKER), false)
  const q = sessionFixture(); q.sessionPorts.binding = () => { throw ioError() }
  assert.equal(q.session.begin(), false); assert.equal(q.files.has(MARKER), false)
  assert.equal(h.counts().spawn + q.counts().spawn, 0)
})
test('manifest close acknowledgment is required independently of earlier successful files', async () => {
  const h = sessionFixture(); await h.readySession(); await h.runSession()
  h.hooks.fs = (method,args) => {
    const name = h.descriptors.get(args[0])
    if (method === 'closeSync' && name?.endsWith('-manifest.json')) return { value: false }
  }
  const result = await h.finish()
  assert.equal(result.fileEvidence.status, 'FAILED')
  assert.equal(result.fileEvidence.files.at(-1).state, 'possible')
  assert.equal(result.resources.file, 'possible')
  assert.equal(result.control.evidenceSaved, true)
})
test('file work after control report consumes the already latched followup budget', async () => {
  const h = sessionFixture(); await h.readySession()
  h.hooks.fs = (method,args) => {
    if (method === 'openSync' && args[0].endsWith('-control-snapshot.json')) h.time(SERVICE_FOLLOWUP_MS)
  }
  await h.runSession()
  const result = await h.session.completed()
  assert.equal(result.followup.beganAtMonotonic, 0)
  assert.equal(result.followup.deadlineMonotonic, SERVICE_FOLLOWUP_MS)
  assert.equal(result.followup.status, 'FAIL'); assert.equal(h.forbidden, 0)
})
for (const kind of ['input-close', 'clock-backward', 'clock-throw']) {
  test(`composition ${kind} uncertainty cannot become a resource PASS`, async () => {
    const h = sessionFixture(); assert.equal(h.session.begin(), true)
    const input = new EventEmitter(), signals = new EventEmitter(); input.pause = () => input
    h.session.installInput(input, signals, () => {})
    await h.prepareSession(); await h.runSession()
    if (kind === 'input-close') input.removeListener = () => undefined
    if (kind === 'clock-backward') h.time(-1)
    if (kind === 'clock-throw') h.hooks.clock = () => { throw ioError() }
    h.closeService()
    if (kind.startsWith('clock')) {
      // Query is observational and drives the expired/error followup path.
      await h.session.queryWindow()
      h.advance(100)
    } else h.advance(100)
    const result = await h.session.completed()
    assert.notEqual(result.resourceStatus, 'PASS')
    assert.equal(h.forbidden, 0)
  })
}
test('unconfirmed cancellation retains the actual followup timer as possible', async () => {
  const h = sessionFixture(); await h.readySession()
  let cancellations = 0
  h.hooks.fs = (method, args) => {
    if (method === 'openSync' && args[0].endsWith('-control-snapshot.json')) {
      h.closeService()
      h.hooks.cancel = () => { cancellations++; throw ioError() }
    }
  }
  await h.runSession()
  const report = await h.session.completed()
  assert.equal(cancellations, 1)
  assert.equal(report.resources.timer, 'possible'); assert.equal(report.resourceStatus, 'UNPROVEN')
  assert.equal(h.timers.size, 1)
  h.advance(100)
  assert.equal(report.resources.timer, 'possible', 'late callback never repairs the frozen judgment')
})
test('window helper binding drift prevents process creation', async () => {
  const h = sessionFixture(); await h.readySession()
  // Mutate the returned binding through a hook on a fixed function, not a replaced port.
  const q = sessionFixture(); let changed = false
  q.sessionPorts.binding = () => ({ source: changed ? 'different' : 'original' })
  await q.readySession(); changed = true
  const result = await q.session.queryWindow()
  assert.equal(result.status, 'UNPROVEN'); assert.equal(q.helperCount, 0)
  h.session.stop(); q.session.stop(); await h.finish(); await q.finish()
})
test('helper registrations, both streams and process exit are necessary', async () => {
  for (const missing of ['exit','stdout','stderr','close','registration']) {
    const h = sessionFixture({helperPending:true}); await h.readySession()
    if (missing === 'registration') h.hooks.helper = child => { child.removeListener = () => undefined }
    const pending = h.session.queryWindow(), child = h.helper
    child.stdout.emit('data',Buffer.from(JSON.stringify({schema:1,status:'CANDIDATE',pid:321,executable:EXE,handle:'1',processStartUtcTicks:'1'})))
    if(missing !== 'exit') child.emit('exit',0,null)
    if(missing !== 'stdout') child.stdout.emit('close')
    if(missing !== 'stderr') child.stderr.emit('close')
    if(missing !== 'close') child.emit('close')
    h.advance(5000)
    assert.equal((await pending).status,'UNPROVEN')
    const result=h.session.report().resources.helpers[0]
    if(missing === 'registration') assert.equal(result.registrations,'possible')
    h.closeService(); h.advance(125000); await h.session.completed()
    assert.equal(h.forbidden,0)
  }
})
test('helper deadline is strict, an open timed-out helper cannot be replaced or killed', async () => {
  const h = sessionFixture({ helperPending:true }); await h.readySession()
  const pending=h.session.queryWindow(); h.time(5000)
  h.helper.stdout.emit('data',Buffer.from(JSON.stringify({schema:1,status:'CANDIDATE',pid:321,executable:EXE,handle:'1',processStartUtcTicks:'1'})))
  h.helper.emit('exit',0); h.helper.stdout.emit('close'); h.helper.stderr.emit('close'); h.helper.emit('close')
  assert.equal((await pending).status,'UNPROVEN')
  h.closeService(); h.advance(125000); await h.session.completed()
  const q=sessionFixture({helperPending:true}); await q.readySession()
  const timeout=q.session.queryWindow(); q.advance(5000); await timeout
  assert.equal(await q.session.queryWindow(),null); assert.equal(q.helperCount,1)
  q.closeService(); q.advance(125000); await q.session.completed(); assert.equal(q.forbidden,0)
})
test('no helper can start at or after the absolute service deadline', async () => {
  const h=sessionFixture(); await h.readySession(); await h.runSession()
  h.time(SERVICE_FOLLOWUP_MS)
  assert.equal(await h.session.queryWindow(),null); assert.equal(h.helperCount,0)
  assert.equal((await h.session.completed()).followup.status,'FAIL')
})
test('closed input grammar refuses oversize, unknown actions and extra fields', async () => {
  for(const line of ['x'.repeat(8193), '{"action":"shell","value":"anything"}\n',
    '{"action":"prepare","value":null,"extra":true}\n']) {
    const h=sessionFixture(); h.session.begin()
    const input=new EventEmitter(), signals=new EventEmitter(); input.pause=()=>input
    h.session.installInput(input,signals,()=>{}); input.emit('data',Buffer.from(line)); h.advance(100)
    assert.equal((await h.session.completed()).startsBlocked,true)
    assert.equal(h.counts().spawn,0)
  }
})
test('a rejected repeated begin permanently prevents a subsequent control', async () => {
  const h=sessionFixture(); await h.readySession(); const authorization=h.allow()
  assert.equal(h.session.begin(),false)
  assert.equal(await h.session.controlOnce(authorization),null)
  assert.equal(h.counts().socket,1); await h.finish()
})
test('abort decisions have bounded monotonic/UTC evidence and repeated signals do not extend followup', async () => {
  const h=sessionFixture(); await h.readySession(); h.session.stop('SIGINT')
  const deadline=h.session.inspect().deadlineMonotonic
  for(let n=0;n<40;n++) h.session.stop('SIGINT')
  h.session.stop('EOF')
  const report=h.session.report(), signals=report.decisions.filter(d=>d.action === 'SIGINT')
  assert.equal(signals.length,1); assert.equal(signals[0].monotonic,0)
  assert.equal(signals[0].utc,'2026-11-06T00:00:00.000Z'); assert.equal(report.stopCount,33)
  assert.equal(h.session.inspect().deadlineMonotonic,deadline); await h.finish()
})
test('reentrant stop at reservation decision prevents even the marker attempt', () => {
  const h=sessionFixture()
  let samples=0
  h.hooks.clock=()=>{ if(++samples === 2) h.session.stop('SIGINT') }
  assert.equal(h.session.begin(),false)
  assert.equal(h.files.has(MARKER),false); assert.equal(h.counts().spawn,0)
})

function closeWindowHelper(h) {
  h.helper.stdout.emit('data', Buffer.from(JSON.stringify({ schema: 1, status: 'CANDIDATE',
    pid: 321, executable: EXE, handle: '12345', processStartUtcTicks: '638000000000000000' })))
  h.helper.emit('exit', 0, null)
  h.helper.stdout.emit('close'); h.helper.stderr.emit('close'); h.helper.emit('close', 0, null)
}
function archiveBytes(h) {
  return (h.readEvidence ? h.readEvidence() : [...h.files]).filter(([name]) => name.startsWith(SESSION_EVIDENCE_ROOT))
    .map(([name, bytes]) => [name, bytes.toString('hex')])
}

function windowRecords(h, kind) {
  return (h.readEvidence ? h.readEvidence() : [...h.files])
    .filter(([name]) => name.startsWith(SESSION_EVIDENCE_ROOT) && name.endsWith(`-${kind}.json`))
    .map(([, bytes]) => JSON.parse(bytes.toString('utf8')))
}
function assertWindowPublication(value, status, preliminary = false) {
  assert.equal(value.status, status, 'published candidate verdict')
  assert.equal(value.closeRecommendation, false)
  assert.equal(value.evidenceRole, preliminary ? 'PRELIMINARY_WINDOW_OBSERVATION' : undefined, 'window evidence role')
  assert.equal(Object.hasOwn(value, 'evidenceRole'), preliminary)
  assert.deepEqual(value.candidate, status === 'CANDIDATE' ? {
    schema: 1, status: 'CANDIDATE', pid: 321, executable: EXE,
    handle: '12345', processStartUtcTicks: '638000000000000000',
  } : null, 'complete candidate projection including window handle')
  assert.equal(value.candidate?.handle, status === 'CANDIDATE' ? '12345' : undefined)
}
function assertWindowFiles(h, count = 1) {
  const windows = windowRecords(h, 'window')
  assert.equal(windows.length, count)
  for (const record of windows) {
    assert.equal(record.kind, 'window')
    assertWindowPublication(record.value, 'UNPROVEN', true)
  }
  return windows
}
function assertFinalWindowReports(h, final, windowCount = 1) {
  assert.equal(final.phase, 'FINAL'); assert.equal(Object.isFrozen(final), true)
  const saved = windowRecords(h, 'session-report')
  assert.equal(saved.length, 1)
  assert.equal(saved[0].value.phase, 'FINAL')
  for (const report of [h.session.report(), final, saved[0].value]) {
    assert.equal(report.resources.helpers.length, 1)
    assertWindowPublication(report.resources.helpers[0].result, 'UNPROVEN')
  }
  assert.equal(Object.isFrozen(final.resources.helpers[0].result), true)
  assertWindowFiles(h, windowCount)
  return saved[0].value
}

// Evaluate the exact production CLI function with only its native factory replaced
// by the existing simulated Session/Host/Owner/Control. No positive native CLI run.
function publicationCli(h) {
  const source = realFs.readFileSync(new globalThis.URL('../scripts/browser/nodeCdpOperatorSession.js', import.meta.url), 'utf8')
  const start = source.indexOf('export function runNodeCdpOperatorSessionCli(')
  const end = source.indexOf('// Only the actual entry file', start)
  assert.ok(start >= 0 && end > start)
  const cli = runInNewContext(`(${source.slice(start, end).replace(/^export /, '')})`, {
    createNodeCdpOperatorSession: (values) => {
      assert.deepEqual(JSON.parse(JSON.stringify(values)), SESSION_CONFIG)
      return h.session
    },
    NODE_CDP_SESSION_HELP: '',
  })
  const input = new EventEmitter(), signals = new EventEmitter(), raw = []
  input.pause = () => input
  const args = ['--run', '--chrome-executable', EXE, '--chrome-sha256', CONFIG.chromeSha256,
    '--state-decision', SESSION_CONFIG.stateDecision, '--state-reference', SESSION_CONFIG.stateReference,
    '--network-decision', SESSION_CONFIG.networkDecision, '--network-reference', SESSION_CONFIG.networkReference]
  assert.equal(cli(args, { input, signals, output: line => raw.push(line) }), h.session)
  return { raw, input, signals, get output() { return raw.map(line => JSON.parse(line)) },
    line: (action, value = null) => input.emit('data', Buffer.from(JSON.stringify({ action, value }) + '\n')) }
}
async function assertCliFinal(h, io, windowCount) {
  const final = await h.session.completed()
  await pumpInput(h, () => io.output.some(value => value.phase === 'FINAL'))
  const serialized = io.output.filter(value => value.phase === 'FINAL')
  assert.equal(serialized.length, 1)
  assert.deepEqual(serialized[0], JSON.parse(JSON.stringify(final)), 'actual CLI completion serialization')
  assertWindowPublication(serialized[0].resources.helpers[0].result, 'UNPROVEN')
  assertFinalWindowReports(h, final, windowCount)
  return final
}

for (const offset of [-1, 0, 1]) {
  test(`P1 helper completion at service deadline ${offset} with delayed timers`, async () => {
    const h = sessionFixture({ helperPending: true }); await h.readySession(); await h.runSession()
    const deadline = h.session.inspect().deadlineMonotonic
    h.time(deadline - 2)
    const pending = h.session.queryWindow()
    h.time(deadline + offset); closeWindowHelper(h)
    const result = await pending
    assert.equal(result.status, offset < 0 ? 'CANDIDATE' : 'UNPROVEN')
    assert.equal(result.closeRecommendation, false)
    assertWindowPublication(result, offset < 0 ? 'CANDIDATE' : 'UNPROVEN')
    assertWindowPublication(h.session.report().resources.helpers[0].result, offset < 0 ? 'CANDIDATE' : 'UNPROVEN')
    assertWindowFiles(h)
    if (offset < 0) h.closeService()
    h.advance(deadline + 1); assertFinalWindowReports(h, await h.session.completed())
    assert.equal(h.forbidden, 0)
  })
}

test('P1 review sequence never returns a candidate after FINAL or writes to the closed archive', async () => {
  const h = sessionFixture({ helperPending: true }); await h.readySession(); await h.runSession()
  h.time(SERVICE_FOLLOWUP_MS - 1)
  const pending = h.session.queryWindow()
  h.advance(SERVICE_FOLLOWUP_MS)
  const final = await h.session.completed(), frozen = JSON.stringify(final), archive = archiveBytes(h)
  assert.equal(final.phase, 'FINAL')
  h.time(SERVICE_FOLLOWUP_MS + 1); closeWindowHelper(h)
  const result = await pending
  assert.equal(result.status, 'UNPROVEN'); assert.equal(result.candidate, null)
  assert.equal(result.closeRecommendation, false)
  assert.equal(JSON.stringify(final), frozen); assert.deepEqual(archiveBytes(h), archive)
  h.closeService(); h.advance(SERVICE_FOLLOWUP_MS + 5000)
  assert.equal(JSON.stringify(await h.session.completed()), frozen)
  assert.deepEqual(archiveBytes(h), archive); assert.equal(h.forbidden, 0)
})

test('P1 helper wait is capped at the absolute service deadline', async () => {
  const h = sessionFixture({ helperPending: true }); await h.readySession(); await h.runSession()
  h.time(SERVICE_FOLLOWUP_MS - 1)
  const before = new Set(h.timers.keys()), pending = h.session.queryWindow()
  const added = [...h.timers].filter(([id]) => !before.has(id))
  assert.equal(added.length, 1)
  assert.equal(added[0][1].at, SERVICE_FOLLOWUP_MS)
  h.advance(SERVICE_FOLLOWUP_MS)
  const result = await pending
  assert.equal(result.status, 'UNPROVEN')
  const final = await h.session.completed(), archive = archiveBytes(h)
  closeWindowHelper(h); h.closeService()
  assert.deepEqual(archiveBytes(h), archive)
  assert.equal((await h.session.completed()).followup, final.followup)
})

for (const transition of ['timer-cancel', 'listener-cleanup', 'promise-resume', 'archive-write']) {
  test(`P1 ${transition} time is included before candidate release`, async () => {
    const h = sessionFixture({ helperPending: true }); await h.readySession(); await h.runSession()
    h.time(SERVICE_FOLLOWUP_MS - 2)
    const pending = h.session.queryWindow()
    h.time(SERVICE_FOLLOWUP_MS - 1)
    if (transition === 'timer-cancel') h.hooks.cancel = () => h.time(SERVICE_FOLLOWUP_MS)
    if (transition === 'listener-cleanup') {
      const remove = h.helper.removeListener
      h.helper.removeListener = function (...args) { h.time(SERVICE_FOLLOWUP_MS); return remove.apply(this, args) }
    }
    if (transition === 'archive-write') h.hooks.fs = (method, args) => {
      if (method === 'openSync' && args[0].endsWith('-window.json')) h.time(SERVICE_FOLLOWUP_MS)
    }
    closeWindowHelper(h)
    if (transition === 'promise-resume') h.time(SERVICE_FOLLOWUP_MS)
    const result = await pending
    assert.equal(result.status, 'UNPROVEN'); assert.equal(result.candidate, null)
    assertWindowPublication(result, 'UNPROVEN')
    assertWindowPublication(h.session.report().resources.helpers[0].result, 'UNPROVEN')
    assertWindowFiles(h)
    h.advance(SERVICE_FOLLOWUP_MS); assertFinalWindowReports(h, await h.session.completed())
    assert.equal(h.forbidden, 0)
  })
}

test('P1 a timely helper settlement cannot escape when FINAL precedes its promise continuation', async () => {
  const h = sessionFixture({ helperPending: true }); await h.readySession(); await h.runSession()
  h.time(SERVICE_FOLLOWUP_MS - 2)
  const pending = h.session.queryWindow()
  h.time(SERVICE_FOLLOWUP_MS - 1); closeWindowHelper(h)
  h.advance(SERVICE_FOLLOWUP_MS)
  const final = await h.session.completed(), archive = archiveBytes(h)
  assert.equal(final.phase, 'FINAL')
  assert.equal((await pending).status, 'UNPROVEN')
  assertWindowPublication(await pending, 'UNPROVEN')
  assertFinalWindowReports(h, final, 0)
  assert.deepEqual(archiveBytes(h), archive)
})

for (const offset of [-1, 0, 1]) {
  test(`P1 READY retains its independent five-second budget at ${5000 + offset}`, async () => {
    const h = sessionFixture({ helperPending: true }); await h.readySession()
    const pending = h.session.queryWindow()
    assert.equal([...h.timers.values()].at(-1).at, 5000)
    h.time(5000 + offset); closeWindowHelper(h)
    assert.equal((await pending).status, offset < 0 ? 'CANDIDATE' : 'UNPROVEN')
    assertWindowPublication(await pending, offset < 0 ? 'CANDIDATE' : 'UNPROVEN')
    assertWindowPublication(h.session.report().resources.helpers[0].result, offset < 0 ? 'CANDIDATE' : 'UNPROVEN')
    assertWindowFiles(h)
    h.session.stop(); h.closeService(); h.advance(5200); await h.session.completed()
    assertFinalWindowReports(h, await h.session.completed())
    assert.equal(h.forbidden, 0)
  })
}

// Count attempts before invoking fallible hooks. Assertions run outside the
// session's guarded callbacks, keyed by target, event and callback identity.
function countRegistrations(target, label, ledger, hooks = {}) {
  const on = target.on, remove = target.removeListener
  target.on = function (name, callback) {
    let registration = ledger.find(r => r.target === target && r.name === name && r.callback === callback)
    if (!registration) {
      registration = { target, label, name, callback, adds: 0, removes: 0 }
      ledger.push(registration)
    }
    registration.adds++
    const result = on.call(this, name, callback)
    const override = hooks.add?.(registration)
    return override ? override.value : result
  }
  target.removeListener = function (name, callback) {
    let registration = ledger.find(r => r.target === target && r.name === name && r.callback === callback)
    if (!registration) {
      registration = { target, label, name, callback, adds: 0, removes: 0 }
      ledger.push(registration)
    }
    registration.removes++
    const override = hooks.remove?.(registration)
    return override ? override.value : remove.call(this, name, callback)
  }
  return target
}
function assertRegistrations(ledger, expectedNames, removals) {
  assert.deepEqual(ledger.map(r => `${r.label}:${r.name}`).sort(), [...expectedNames].sort())
  for (const r of ledger) {
    assert.equal(r.adds, 1, `${r.label}:${r.name} add attempts`)
    assert.equal(r.removes, removals, `${r.label}:${r.name} remove attempts`)
  }
}
const INPUT_REGISTRATIONS = ['input:data', 'input:end', 'input:error', 'signals:SIGINT', 'signals:SIGTERM']
const HELPER_REGISTRATIONS = ['helper:error', 'helper:exit', 'helper:close',
  'stdout:data', 'stdout:error', 'stdout:close', 'stderr:data', 'stderr:error', 'stderr:close']
function jsonInput(h, hooks = {}) {
  const ledger = [], output = []
  const input = countRegistrations(new EventEmitter(), 'input', ledger, hooks)
  const signals = countRegistrations(new EventEmitter(), 'signals', ledger, hooks)
  let pauses = 0
  input.pause = () => { pauses++; return input }
  const installed = h.session.installInput(input, signals, line => output.push(JSON.parse(line)))
  return { input, signals, ledger, output, installed, pauses: () => pauses,
    line: (action, value = null) => input.emit('data', Buffer.from(JSON.stringify({ action, value }) + '\n')) }
}
async function pumpInput(h, predicate) {
  for (let n = 0; n < 32 && !predicate(); n++) { h.flush(); await Promise.resolve() }
  assert.equal(predicate(), true, 'JSON dispatcher completed within the simulated microtask queue')
}
async function prepareJson(h, io) {
  io.line('prepare')
  await pumpInput(h, () => io.output.some(value => value.phase === 'READY'))
  const ready = io.output.find(value => value.phase === 'READY')
  assert.deepEqual(Object.keys(ready.confirmation).sort(),
    ['confirmation', 'sessionId', 'sessionGeneration', 'serviceId', 'serviceGeneration'].sort())
  assert.ok(Object.values(ready.confirmation).every(value => typeof value === 'string' && value.length > 0))
  return { operator: 'Jan', decision: 'ALLOW_CONTROL_ONCE', ...ready.confirmation }
}

test('P2 JSON control forwards the emitted READY confirmation, reports one correlated run and completes', async () => {
  const h = sessionFixture(); assert.equal(h.session.begin(), true)
  const io = jsonInput(h); assert.equal(io.installed, true)
  const request = await prepareJson(h, io)
  assert.equal(h.counts().socket, 1)
  io.line('control', request)
  await pumpInput(h, () => io.output.some(value => Object.hasOwn(value, 'control')))
  const report = io.output.find(value => Object.hasOwn(value, 'control')).control
  assert.ok(report, 'dispatcher must forward the valid confirmation unchanged')
  assert.equal(report.status, 'PASS'); assert.equal(report.serviceId, request.serviceId)
  assert.deepEqual(report, h.session.report().control)
  assert.equal(report.runId, h.session.report().snapshot.runId)
  assert.equal(report.contextReturned, true); assert.equal(report.connectionClosed, true)
  assert.equal(h.session.inspect().host.ended, true)
  assert.equal(h.commands.filter(c => c.method === 'Target.createBrowserContext').length, 1)
  assert.equal(h.session.report().decisions.filter(d => d.action === 'ALLOW_CONTROL_ONCE').length, 1)
  assertRegistrations(io.ledger, INPUT_REGISTRATIONS, 0)
  io.line('control', request)
  await pumpInput(h, () => io.output.filter(value => Object.hasOwn(value, 'control')).length === 2)
  assert.equal(io.output.at(-1).control, null); assert.equal(h.counts().socket, 2)
  h.closeService(); h.advance(100)
  const final = await h.session.completed()
  assert.equal(final.phase, 'FINAL'); assert.equal(final.followup.status, 'PASS')
  assert.deepEqual(final.control, report); assert.equal(final.fileEvidence.status, 'PASS')
  assertRegistrations(io.ledger, INPUT_REGISTRATIONS, 1); assert.equal(io.pauses(), 1)
  assert.equal(h.forbidden, 0)
})

test('P2 JSON abort reaches the active control signal and drains control before host end', async () => {
  const h = sessionFixture(); assert.equal(h.session.begin(), true)
  const io = jsonInput(h), request = await prepareJson(h, io), observations = []
  h.hooks.send = command => {
    if (command.method === 'Page.getFrameTree') h.queue.push(() => {
      observations.push({ stage: 'before-abort', phase: h.session.inspect().phase, ended: h.session.inspect().host.ended })
      io.line('abort'); io.signals.emit('SIGINT'); io.signals.emit('SIGTERM')
      observations.push({ stage: 'after-abort', phase: h.session.inspect().phase, ended: h.session.inspect().host.ended })
    })
    if (command.method === 'Target.disposeBrowserContext') {
      observations.push({ stage: 'dispose', phase: h.session.inspect().phase, ended: h.session.inspect().host.ended })
    }
  }
  io.line('control', request)
  await pumpInput(h, () => io.output.some(value => Object.hasOwn(value, 'control')))
  const report = io.output.find(value => Object.hasOwn(value, 'control')).control
  assert.ok(report); assert.ok(report.errors.includes('OPERATOR_ABORT'), 'control must receive the AbortSignal')
  assert.deepEqual(observations, ['before-abort', 'dispose', 'after-abort'].map(stage => ({ stage, phase: 'CONTROLLING', ended: false })))
  assert.equal(report.serviceId, request.serviceId); assert.equal(report.runId, h.session.report().snapshot.runId)
  assert.equal(report.contextReturned, true); assert.equal(report.connectionClosed, true)
  assert.equal(report.gateAcknowledged, true); assert.equal(h.session.inspect().host.ended, true)
  assert.equal(h.counts().socket, 2)
  io.line('control', request)
  await pumpInput(h, () => io.output.filter(value => Object.hasOwn(value, 'control')).length === 2)
  assert.equal(io.output.at(-1).control, null); assert.equal(h.counts().socket, 2)
  h.closeService(); h.advance(100)
  const final = await h.session.completed()
  assert.deepEqual(final.control, report); assert.equal(final.followup.status, 'PASS')
  assertRegistrations(io.ledger, INPUT_REGISTRATIONS, 1); assert.equal(h.forbidden, 0)
})

for (const mode of ['normal', 'remove-throw', 'remove-unconfirmed', 'add-throw', 'add-unconfirmed', 'reentrant']) {
  test(`P2 input listener attempts stay single through ${mode}, repeated stop and final events`, async () => {
    const h = sessionFixture(); assert.equal(h.session.begin(), true)
    let io, reentered = false
    const hooks = {
      add(r) {
        if (r.name !== 'SIGTERM') return
        if (mode === 'add-throw') throw ioError()
        if (mode === 'add-unconfirmed') return { value: undefined }
      },
      remove(r) {
        if (r.label !== 'input' || r.name !== 'data') return
        if (mode === 'remove-throw') throw ioError()
        if (mode === 'remove-unconfirmed') return { value: undefined }
        if (mode === 'reentrant' && !reentered) {
          reentered = true; h.session.stop('SIGINT'); io.signals.emit('SIGTERM'); io.input.emit('end')
        }
      },
    }
    io = jsonInput(h, hooks)
    assert.equal(io.installed, !mode.startsWith('add-'))
    assertRegistrations(io.ledger, INPUT_REGISTRATIONS, 0)
    if (io.installed) { await h.prepareSession(); await h.runSession(); h.closeService() }
    h.advance(100)
    const final = await h.session.completed(), frozen = JSON.stringify(final)
    assertRegistrations(io.ledger, INPUT_REGISTRATIONS, 1); assert.equal(io.pauses(), 1)
    const state = mode.startsWith('remove-') ? 'possible' : 'closed'
    assert.equal(final.resources.inputListeners, state)
    for (let n = 0; n < 3; n++) {
      h.session.stop(); io.input.emit('end'); io.signals.emit('SIGINT'); io.signals.emit('SIGTERM')
      if (h.child) h.closeService()
      h.advance(200 + n)
    }
    assertRegistrations(io.ledger, INPUT_REGISTRATIONS, 1); assert.equal(io.pauses(), 1)
    assert.equal(h.session.report().resources.inputListeners, state)
    assert.equal(JSON.stringify(await h.session.completed()), frozen)
    assert.equal(reentered, mode === 'reentrant'); assert.equal(h.forbidden, 0)
  })
}

for (const mode of ['normal', 'timeout-late-close', 'remove-throw', 'remove-unconfirmed', 'add-throw', 'add-unconfirmed', 'reentrant']) {
  test(`P2 helper listener attempts stay single through ${mode} and repeated completion`, async () => {
    const h = sessionFixture({ helperPending: true }), ledger = []
    let reentered = false
    const hooks = {
      add(r) {
        if (r.label !== 'stderr' || r.name !== 'close') return
        if (mode === 'add-throw') throw ioError()
        if (mode === 'add-unconfirmed') return { value: undefined }
      },
      remove(r) {
        if (r.label !== 'helper' || r.name !== 'error') return
        if (mode === 'remove-throw') throw ioError()
        if (mode === 'remove-unconfirmed') return { value: undefined }
        if (mode === 'reentrant' && !reentered) {
          reentered = true
          h.helper.emit('close'); h.helper.stdout.emit('close'); h.helper.stderr.emit('close')
          h.session.stop('SIGINT')
        }
      },
    }
    h.hooks.helper = child => {
      countRegistrations(child, 'helper', ledger, hooks)
      countRegistrations(child.stdout, 'stdout', ledger, hooks)
      countRegistrations(child.stderr, 'stderr', ledger, hooks)
    }
    await h.readySession()
    const pending = h.session.queryWindow()
    assertRegistrations(ledger, HELPER_REGISTRATIONS, 0)
    if (mode === 'timeout-late-close') {
      h.advance(5000)
      const timedOut = await pending
      assert.equal(timedOut.status, 'UNPROVEN')
      assertRegistrations(ledger, HELPER_REGISTRATIONS, 0)
      assert.equal(h.session.report().resources.helpers[0].registrations, 'confirmed')
      h.time(5001)
    }
    closeWindowHelper(h)
    const result = await pending, frozen = JSON.stringify(result)
    assert.equal(result.status, mode === 'normal' ? 'CANDIDATE' : 'UNPROVEN')
    assertRegistrations(ledger, HELPER_REGISTRATIONS, 1)
    const state = mode.startsWith('remove-') ? 'possible' : 'closed'
    assert.equal(h.session.report().resources.helpers[0].registrations, state)
    for (let n = 0; n < 3; n++) {
      closeWindowHelper(h); h.session.stop('SIGTERM')
      // Deliver callbacks already queued before removal, not just emitter no-ops.
      for (const r of ledger.filter(r => r.name === 'close')) r.callback()
    }
    assertRegistrations(ledger, HELPER_REGISTRATIONS, 1)
    assert.equal(h.session.report().resources.helpers[0].registrations, state)
    assert.equal(JSON.stringify(await pending), frozen)
    h.closeService(); h.advance(5200)
    const final = await h.session.completed(), archive = archiveBytes(h)
    closeWindowHelper(h); h.session.stop(); h.closeService(); h.advance(6000)
    assertRegistrations(ledger, HELPER_REGISTRATIONS, 1)
    assert.equal(final.resources.helpers[0].registrations, state)
    assert.deepEqual(archiveBytes(h), archive)
    assert.equal(reentered, mode === 'reentrant'); assert.equal(h.forbidden, 0)
  })
}

test('P1 window dispatcher rechecks FINAL before its later JSON output callback', async () => {
  const h = sessionFixture({ helperPending: true }); assert.equal(h.session.begin(), true)
  const io = jsonInput(h); await prepareJson(h, io)
  h.session.stop(); h.time(SERVICE_FOLLOWUP_MS - 2)
  io.line('window')
  h.time(SERVICE_FOLLOWUP_MS - 1); closeWindowHelper(h)
  // queryWindow resumes first, then FINAL, then its dispatcher's .then callback.
  queueMicrotask(() => h.advance(SERVICE_FOLLOWUP_MS))
  await pumpInput(h, () => io.output.some(value => Object.hasOwn(value, 'status')))
  const output = io.output.find(value => Object.hasOwn(value, 'status'))
  assert.equal(h.session.inspect().phase, 'FINAL')
  assert.equal(output.status, 'UNPROVEN'); assert.equal(output.candidate, null)
  assert.equal(output.closeRecommendation, false)
  const final = await h.session.completed(), archive = archiveBytes(h)
  assertWindowPublication(output, 'UNPROVEN')
  assertFinalWindowReports(h, final)
  closeWindowHelper(h); h.closeService(); h.advance(SERVICE_FOLLOWUP_MS + 1)
  assert.deepEqual(archiveBytes(h), archive)
  assert.equal((await h.session.completed()).followup, final.followup)
})

for (const method of ['writeSync', 'fsyncSync', 'fstatSync', 'readSync', 'closeSync']) {
  for (const offset of [-1, 0, 1]) {
    test(`P1 publication ${method} completes at service deadline ${offset}`, async () => {
      const h = sessionFixture({ helperPending: true }), io = publicationCli(h)
      await prepareJson(h, io); await h.runSession()
      const deadline = h.session.inspect().deadlineMonotonic
      h.time(deadline - 2)
      const pending = h.session.queryWindow()
      h.time(deadline - 1)
      let consumed = 0
      h.hooks.fs = (operation, args) => {
        if (operation === method && h.descriptors.get(args[0])?.endsWith('-window.json')) {
          consumed++; h.time(deadline + offset)
        }
      }
      closeWindowHelper(h)
      const result = await pending, expected = offset < 0 ? 'CANDIDATE' : 'UNPROVEN'
      assert.equal(consumed, 1, 'the intended evidence IO step was reached exactly once')
      assertWindowPublication(result, expected)
      assertWindowPublication(h.session.report().resources.helpers[0].result, expected)
      const written = assertWindowFiles(h)
      assert.equal(written[0].monotonic, deadline - 1, 'pre-IO timestamp cannot attest IO completion')
      assert.equal(h.descriptors.size, 0, 'flush/readback/close completed normally')
      h.closeService(); h.advance(deadline + 1)
      const final = await h.session.completed(), frozen = JSON.stringify(final), archive = archiveBytes(h)
      assertFinalWindowReports(h, final)
      await assertCliFinal(h, io, 1)
      for (let repeat = 0; repeat < 3; repeat++) {
        closeWindowHelper(h); h.closeService(); h.session.stop(); h.advance(deadline + 2 + repeat)
      }
      assert.equal(JSON.stringify(await h.session.completed()), frozen)
      assert.deepEqual(archiveBytes(h), archive)
      assert.equal(h.forbidden, 0)
    })
  }
}

for (const order of ['FINAL-before-resume', 'FINAL-before-JSON', 'JSON-before-FINAL']) {
  test(`P1 publication CLI ordering ${order}`, async (t) => {
    const h = sessionFixture({ helperPending: true }), io = publicationCli(h)
    const allow = await prepareJson(h, io)
    io.line('control', allow)
    await pumpInput(h, () => io.output.some(value => value.control))
    const deadline = h.session.inspect().deadlineMonotonic
    h.time(deadline - 2); io.line('window')
    h.time(deadline - 1); closeWindowHelper(h)
    if (order === 'FINAL-before-resume') h.advance(deadline)
    if (order === 'FINAL-before-JSON') queueMicrotask(() => h.advance(deadline))
    await pumpInput(h, () => io.output.some(value => Object.hasOwn(value, 'status')))
    const window = io.output.find(value => Object.hasOwn(value, 'status'))
    const timely = order === 'JSON-before-FINAL'
    assertWindowPublication(window, timely ? 'CANDIDATE' : 'UNPROVEN')
    const published = io.raw.find(line => Object.hasOwn(JSON.parse(line), 'status'))
    if (timely) h.advance(deadline)
    const count = order === 'FINAL-before-resume' ? 0 : 1
    const final = await assertCliFinal(h, io, count)
    const frozen = JSON.stringify(final), archive = archiveBytes(h), raw = [...io.raw]
    for (let repeat = 0; repeat < 3; repeat++) {
      closeWindowHelper(h); h.closeService(); h.session.stop(); io.signals.emit('SIGTERM')
      io.line('window'); h.advance(deadline + 1 + repeat)
    }
    await Promise.resolve()
    assert.deepEqual(io.raw, raw)
    assert.equal(JSON.stringify(await h.session.completed()), frozen)
    assert.deepEqual(archiveBytes(h), archive)
    assertWindowPublication(JSON.parse(published), timely ? 'CANDIDATE' : 'UNPROVEN')
    t.diagnostic(JSON.stringify({ order, window: JSON.parse(published),
      windowFiles: windowRecords(h, 'window'), savedHelper: windowRecords(h, 'session-report')[0].value.resources.helpers[0],
      completedHelper: final.resources.helpers[0], cliHelper: io.output.find(value => value.phase === 'FINAL').resources.helpers[0] }))
    assert.equal(h.forbidden, 0)
  })
}

for (const uncertainty of ['throw', 'backward', 'nonfinite']) {
  test(`P1 publication clock ${uncertainty} after IO stays rejected after clock recovery`, async () => {
    const h = sessionFixture({ helperPending: true }); await h.readySession(); await h.runSession()
    h.time(100)
    const pending = h.session.queryWindow()
    let observed = 0
    h.hooks.fs = (method, args) => {
      if (method === 'closeSync' && h.descriptors.get(args[0])?.endsWith('-window.json')) {
        h.hooks.clock = () => {
          observed++; h.hooks.clock = undefined
          if (uncertainty === 'throw') throw ioError()
          h.time(uncertainty === 'backward' ? 99 : NaN)
        }
      }
    }
    closeWindowHelper(h)
    assertWindowPublication(await pending, 'UNPROVEN')
    assert.equal(observed, 1)
    h.time(101)
    assertWindowPublication(h.session.report().resources.helpers[0].result, 'UNPROVEN')
    assertWindowFiles(h)
    h.closeService(); h.advance(200)
    const final = await h.session.completed()
    assertWindowPublication(final.resources.helpers[0].result, 'UNPROVEN')
    // Invalid timestamp observations can independently prevent file evidence.
    for (const record of windowRecords(h, 'session-report')) {
      assertWindowPublication(record.value.resources.helpers[0].result, 'UNPROVEN')
    }
    assert.equal(h.forbidden, 0)
  })
}

test('P1 publication timely READY and FOLLOWUP snapshots survive as history while normal resources PASS', async () => {
  for (const stage of ['READY', 'FOLLOWUP']) {
    const h = sessionFixture({ helperPending: true }), io = publicationCli(h)
    await prepareJson(h, io)
    if (stage === 'FOLLOWUP') await h.runSession()
    h.time(100)
    const pending = h.session.queryWindow()
    closeWindowHelper(h)
    const result = await pending, publicReport = h.session.report()
    assertWindowPublication(result, 'CANDIDATE')
    assertWindowPublication(publicReport.resources.helpers[0].result, 'CANDIDATE')
    const historical = JSON.stringify({ result, publicReport }), written = assertWindowFiles(h)
    assert.equal(written[0].monotonic, 100)
    if (stage === 'READY') await h.runSession()
    h.closeService(); h.advance(200)
    const final = await assertCliFinal(h, io, 1)
    assert.equal(final.resourceStatus, 'PASS', 'candidate invalidation must not falsify normal resource closure')
    assert.equal(final.followup.status, 'PASS')
    assert.equal(final.fileEvidence.status, 'PASS')
    assert.equal(windowRecords(h, 'session-report')[0].value.fileEvidence.status, 'OPEN')
    assert.deepEqual(final.errors, [])
    const archive = archiveBytes(h), frozen = JSON.stringify(final)
    assert.equal(await h.session.queryWindow(), null)
    h.session.stop(); closeWindowHelper(h); h.closeService(); h.advance(201)
    assert.equal(JSON.stringify({ result, publicReport }), historical)
    assert.equal(JSON.stringify(await h.session.completed()), frozen)
    assert.deepEqual(archiveBytes(h), archive)
    assert.equal(h.forbidden, 0)
  }
})

for (const stage of ['READY', 'FOLLOWUP']) {
  test(`P1 publication positive settlement control in ${stage}`, async () => {
    const h = sessionFixture({ helperPending: true }); await h.readySession()
    if (stage === 'FOLLOWUP') await h.runSession()
    const pending = h.session.queryWindow(); closeWindowHelper(h)
    assertWindowPublication(await pending, 'CANDIDATE')
    assert.equal(h.session.inspect().phase, stage)
    assert.equal(h.forbidden, 0)
    if (stage === 'READY') await h.runSession()
    h.closeService(); h.advance(100)
    assert.equal((await h.session.completed()).resourceStatus, 'PASS')
  })
}

for (const offset of [0, 1]) {
  test(`P1 publication READY JSON delayed to helper deadline ${offset}`, async () => {
    const h = sessionFixture({ helperPending: true }), io = publicationCli(h)
    await prepareJson(h, io)
    io.line('window'); h.time(4999); closeWindowHelper(h)
    queueMicrotask(() => h.time(5000 + offset))
    await pumpInput(h, () => io.output.some(value => Object.hasOwn(value, 'status')))
    assert.equal(h.session.inspect().phase, 'READY', 'timer processing has deliberately not run')
    assertWindowPublication(io.output.find(value => Object.hasOwn(value, 'status')), 'UNPROVEN')
    assertWindowPublication(h.session.report().resources.helpers[0].result, 'UNPROVEN')
    assertWindowFiles(h)
    h.session.stop(); h.closeService(); h.advance(5200)
    await assertCliFinal(h, io, 1)
    assert.equal(h.forbidden, 0)
  })
}

for (const method of ['openSync', 'writeSync', 'fsyncSync', 'fstatSync', 'readSync', 'closeSync']) {
  test(`P1 publication CLI window IO expiry in ${method}`, async () => {
    const h = sessionFixture({ helperPending: true }), io = publicationCli(h)
    await prepareJson(h, io); await h.runSession()
    const deadline = h.session.inspect().deadlineMonotonic
    h.time(deadline - 2); io.line('window'); h.time(deadline - 1)
    let consumed = 0
    h.hooks.fs = (operation, args) => {
      const name = typeof args[0] === 'string' ? args[0] : h.descriptors.get(args[0])
      if (operation === method && name?.endsWith('-window.json')) { consumed++; h.time(deadline) }
    }
    closeWindowHelper(h)
    await pumpInput(h, () => io.output.some(value => Object.hasOwn(value, 'status')))
    assert.equal(consumed, 1)
    assertWindowPublication(io.output.find(value => Object.hasOwn(value, 'status')), 'UNPROVEN')
    await assertCliFinal(h, io, 1)
    assert.equal(h.forbidden, 0)
  })
}

function physicalPublicationFiles(h, directory) {
  const mem = h.sessionPorts.fs, nativeFds = new Map(), steps = []
  const map = name => join(directory, win32.relative(SESSION_EVIDENCE_ROOT, name))
  const isEvidence = name => typeof name === 'string' && name.startsWith(SESSION_EVIDENCE_ROOT)
  const overlay = { ...mem,
    lstatSync: name => isEvidence(name) ? realFs.lstatSync(map(name)) : mem.lstatSync(name),
    realpathSync: name => isEvidence(name) ? (realFs.realpathSync(map(name)) && name) : mem.realpathSync(name),
    mkdirSync: name => isEvidence(name) ? realFs.mkdirSync(map(name)) : mem.mkdirSync(name),
    openSync(name, flags) {
      if (!isEvidence(name)) return mem.openSync(name, flags)
      const fd = realFs.openSync(map(name), flags)
      nativeFds.set(fd, name); steps.push({ method: 'openSync', name })
      return fd
    },
  }
  for (const method of ['writeSync', 'fsyncSync', 'fstatSync', 'readSync', 'closeSync']) {
    overlay[method] = (fd, ...args) => {
      if (!nativeFds.has(fd)) return mem[method](fd, ...args)
      const name = nativeFds.get(fd), result = realFs[method](fd, ...args)
      if (method === 'closeSync') nativeFds.delete(fd)
      steps.push({ method, name }); h.afterPhysicalIo?.(method, name)
      return result
    }
  }
  h.readEvidence = () => realFs.readdirSync(directory).flatMap(subdir =>
    realFs.readdirSync(join(directory, subdir)).map(name =>
      [win32.join(SESSION_EVIDENCE_ROOT, subdir, name), realFs.readFileSync(join(directory, subdir, name))]))
  h.sessionPorts.fs = overlay
  h.session = createNodeCdpOperatorSessionForTest(SESSION_CONFIG, h.sessionPorts, h.ports)
  return { nativeFds, steps }
}

for (const order of ['FINAL-before-resume', 'IO-expiry', 'timely']) {
  test(`P1 publication physical files ${order}`, async (t) => {
    const directory = mkdtempSync(join(tmpdir(), 'goldendawn-p1-publication-'))
    try {
      const h = sessionFixture({ helperPending: true }), physical = physicalPublicationFiles(h, directory)
      const io = publicationCli(h)
      await prepareJson(h, io); await h.runSession()
      const deadline = h.session.inspect().deadlineMonotonic
      const observedAt = order === 'timely' ? 100 : deadline - 1
      h.time(observedAt - 1)
      const pending = h.session.queryWindow()
      h.time(observedAt)
      if (order === 'IO-expiry') h.afterPhysicalIo = (method, name) => {
        if (method === 'closeSync' && name.endsWith('-window.json')) h.time(deadline)
      }
      closeWindowHelper(h)
      if (order === 'FINAL-before-resume') h.advance(deadline)
      const result = await pending
      assertWindowPublication(result, order === 'timely' ? 'CANDIDATE' : 'UNPROVEN')
      assertWindowPublication(h.session.report().resources.helpers[0].result, order === 'timely' ? 'CANDIDATE' : 'UNPROVEN')
      const count = order === 'FINAL-before-resume' ? 0 : 1
      assertWindowFiles(h, count)
      assert.deepEqual(physical.steps.filter(step => step.name.endsWith('-window.json')).map(step => step.method),
        count ? ['openSync', 'writeSync', 'fsyncSync', 'fstatSync', 'readSync', 'closeSync'] : [])
      if (order === 'timely') { h.closeService(); h.advance(observedAt + 100) }
      const final = await assertCliFinal(h, io, count)
      if (order === 'timely') assert.equal(final.resourceStatus, 'PASS')
      assert.equal(physical.nativeFds.size, 0)
      const frozen = JSON.stringify(final), archive = archiveBytes(h)
      for (let repeat = 0; repeat < 3; repeat++) {
        closeWindowHelper(h); h.closeService(); h.session.stop(); h.advance(deadline + repeat)
      }
      assert.equal(JSON.stringify(await h.session.completed()), frozen)
      assert.deepEqual(archiveBytes(h), archive)
      const saved = windowRecords(h, 'session-report')[0]
      t.diagnostic(JSON.stringify({ physicalFiles: true, order, returned: result,
        windowFiles: windowRecords(h, 'window'), sessionFile: saved, cli: io.output.find(value => value.phase === 'FINAL') }))
      assert.equal(h.forbidden, 0)
    } finally {
      assert.ok(directory.startsWith(join(tmpdir(), 'goldendawn-p1-publication-')))
      assert.equal(realFs.lstatSync(directory).isSymbolicLink(), false)
      rmSync(directory, { recursive: true, force: true })
    }
  })
}

function closeGraphWindowHelper(h, handle) {
  h.helper.stdout.emit('data', Buffer.from(JSON.stringify({ schema: 1, status: 'CANDIDATE',
    pid: 321, executable: EXE, handle, processStartUtcTicks: '638000000000000000' })))
  h.helper.emit('exit', 0, null)
  h.helper.stdout.emit('close'); h.helper.stderr.emit('close'); h.helper.emit('close', 0, null)
}
function assertGraphWindow(value, status, handle) {
  assert.equal(value.status, status, 'the first published graph must reject every candidate after global clock uncertainty')
  assert.deepEqual(value.candidate, status === 'CANDIDATE' ? {
    schema: 1, status: 'CANDIDATE', pid: 321, executable: EXE,
    handle, processStartUtcTicks: '638000000000000000',
  } : null, 'complete independent candidate projection')
  assert.equal(value.candidate?.handle, status === 'CANDIDATE' ? handle : undefined)
  assert.equal(value.closeRecommendation, false)
  assert.equal(Object.hasOwn(value, 'evidenceRole'), false)
}
function assertGraphPair(report, statuses) {
  assert.equal(report.resources.helpers.length, 2)
  for (const [index, handle] of ['12345', '67890'].entries()) {
    assertGraphWindow(report.resources.helpers[index].result, statuses[index], handle)
  }
}
async function twoWindowGraphFixture(stage) {
  const h = sessionFixture({ helperPending: true }); await h.readySession()
  if (stage === 'FOLLOWUP') await h.runSession()
  const returned = []
  for (const [index, handle] of ['12345', '67890'].entries()) {
    h.time(index === 0 ? 100 : 1100)
    const pending = h.session.queryWindow()
    closeGraphWindowHelper(h, handle)
    returned.push(await pending)
    assertGraphWindow(returned[index], 'CANDIDATE', handle)
  }
  assert.equal(h.helperCount, 2)
  assert.notEqual(returned[0], returned[1], 'two independently settled queries')
  const historical = h.session.report()
  assertGraphPair(historical, ['CANDIDATE', 'CANDIDATE'])
  return { h, returned, historical }
}
async function closeGraphFixture(h) {
  h.hooks.clock = undefined; h.time(8000)
  h.closeService(); h.session.stop(); h.advance(8100)
  const final = await h.session.completed(), frozen = JSON.stringify(final), archive = archiveBytes(h)
  assert.equal(final.phase, 'FINAL')
  assertGraphPair(final, ['UNPROVEN', 'UNPROVEN'])
  for (const helper of final.resources.helpers) {
    assert.equal(helper.process, 'closed'); assert.equal(helper.exited, true); assert.equal(helper.closed, true)
    assert.equal(helper.stdout, 'closed'); assert.equal(helper.stderr, 'closed')
    assert.equal(helper.registrations, 'closed'); assert.equal(helper.remainingRegistrations, 0)
    assert.equal(helper.timer, 'closed')
  }
  assert.equal(h.timers.size, 0); assert.equal(h.descriptors.size, 0); assert.equal(h.forbidden, 0)
  h.closeService(); closeGraphWindowHelper(h, '67890'); h.session.stop(); h.advance(8200)
  assert.equal(JSON.stringify(await h.session.completed()), frozen)
  assert.deepEqual(archiveBytes(h), archive)
}

for (const stage of ['READY', 'FOLLOWUP']) {
  for (const uncertainty of ['throw', 'backward', 'nonfinite']) {
    test(`P1 graph ${stage}: second helper clock ${uncertainty} invalidates the first published report`, async (t) => {
      const { h, returned, historical } = await twoWindowGraphFixture(stage)
      const historyJSON = JSON.stringify({ returned, historical }), archive = archiveBytes(h)
      try {
        let calls = 0, injections = 0
        const observed = []
        h.hooks.clock = () => {
          calls++
          if (calls !== 2) { observed.push('valid-1100'); return }
          injections++; observed.push(uncertainty)
          if (uncertainty === 'throw') throw ioError()
          h.time(uncertainty === 'backward' ? 1099 : NaN)
        }
        const before = h.counts()
        const first = h.session.report()
        const serialized = JSON.stringify(first)
        const after = h.counts()
        // Evaluate these counters outside the callbacks before any later report.
        assert.equal(calls, 2, 'final graph invalidation must not read the clock again')
        assert.equal(injections, 1, 'uncertainty was injected only after the first valid helper check')
        assert.deepEqual(observed, ['valid-1100', uncertainty])
        assert.equal(after.clock - before.clock, 2)
        assert.deepEqual({ ...after, clock: before.clock }, before, 'no extra IO, timers or external effects')
        t.diagnostic(JSON.stringify({ stage, uncertainty, clockCalls: calls, injections, firstReportJSON: serialized }))
        assert.equal(first.phase, stage)
        assertGraphPair(first, ['UNPROVEN', 'UNPROVEN'])
        assertGraphPair(JSON.parse(serialized), ['UNPROVEN', 'UNPROVEN'])
        assert.doesNotMatch(serialized, /"handle"\s*:/)
        assert.equal(Object.isFrozen(first), true)
        assert.ok(first.resources.helpers.every(helper => Object.isFrozen(helper.result)))
        assert.deepEqual(archiveBytes(h), archive)

        let recoveredReads = 0
        h.time(1101); h.hooks.clock = () => { recoveredReads++ }
        const recovered = h.session.report()
        assertGraphPair(recovered, ['UNPROVEN', 'UNPROVEN'])
        assert.equal(recoveredReads, 0, 'latched uncertainty is not repaired by a plausible clock')
        assert.equal(JSON.stringify(first), serialized, 'the first error report is never repaired in place')
        assert.equal(JSON.stringify({ returned, historical }), historyJSON)
        assertGraphPair(historical, ['CANDIDATE', 'CANDIDATE'])
        assert.deepEqual(archiveBytes(h), archive)
      } finally {
        await closeGraphFixture(h)
        const finalArchive = new Map(archiveBytes(h))
        for (const [name, bytes] of archive) assert.equal(finalArchive.get(name), bytes, 'earlier archive bytes unchanged')
        assert.equal(JSON.stringify({ returned, historical }), historyJSON)
      }
    })
  }

  for (const observationTime of [1100, 5100]) {
    test(`P1 graph ${stage}: independent helper deadlines at ${observationTime}`, async () => {
      const { h, returned, historical } = await twoWindowGraphFixture(stage)
      const historyJSON = JSON.stringify({ returned, historical }), archive = archiveBytes(h)
      try {
        h.time(observationTime)
        let reads = 0
        h.hooks.clock = () => { reads++ }
        const first = h.session.report(), serialized = JSON.stringify(first)
        assert.equal(reads, 2)
        const expected = observationTime === 1100 ? ['CANDIDATE', 'CANDIDATE'] : ['UNPROVEN', 'CANDIDATE']
        assertGraphPair(first, expected); assertGraphPair(JSON.parse(serialized), expected)
        assert.equal(Object.isFrozen(first), true)
        assert.equal(JSON.stringify({ returned, historical }), historyJSON)
        assert.deepEqual(archiveBytes(h), archive)
        h.hooks.clock = undefined
        if (stage === 'READY') await h.runSession()
        h.closeService(); h.advance(7000)
        const final = await h.session.completed()
        assert.equal(final.resourceStatus, 'PASS', 'individual helper expiry does not falsify normal resource closure')
        assert.equal(final.followup.status, 'PASS')
        assertGraphPair(final, ['UNPROVEN', 'UNPROVEN'])
        assert.equal(JSON.stringify(first), serialized)
        assert.equal(JSON.stringify({ returned, historical }), historyJSON)
      } finally {
        await closeGraphFixture(h)
        const finalArchive = new Map(archiveBytes(h))
        for (const [name, bytes] of archive) assert.equal(finalArchive.get(name), bytes)
      }
    })
  }
}
