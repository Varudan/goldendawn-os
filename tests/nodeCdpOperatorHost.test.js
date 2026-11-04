import test from 'node:test'
import assert from 'node:assert/strict'
import * as realFs from 'node:fs'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, win32 } from 'node:path'
import { createHash } from 'node:crypto'
import { EventEmitter } from 'node:events'
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
  const directories = settings.directories ?? new Set([ROOT])
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
  h.host = createNodeCdpOperatorHostForTest(CONFIG, h.ports)
  h.reserve = () => h.host.reserve({ ...CLARIFIED })
  h.prepare = async () => { const result = h.host.prepareService(); h.flush(); return result }
  h.ready = async () => { assert.equal(h.reserve(), true); assert.equal((await h.prepare()).status, 'READY') }
  h.request = (runId = 'control-1') => {
    const state = h.host.inspect()
    return { operator: 'Jan', decision: 'ALLOW_CONTROL_ONCE', runId,
      sessionId: state.sessionId, sessionGeneration: state.sessionGeneration,
      serviceId: state.serviceId, serviceGeneration: state.serviceGeneration }
  }
  h.run = async (runId = 'control-1', signal) => {
    const permission = h.host.authorizeControl(h.request(runId))
    const result = h.host.runControl({ permission, signal }); h.flush(); return result
  }
  h.signal = () => {
    const listeners = new Set()
    return { aborted: false,
      addEventListener(name, callback) { counts.adds++; listeners.add(callback) },
      removeEventListener(name, callback) { counts.removes++; listeners.delete(callback) },
      abort() { this.aborted = true; for (const callback of [...listeners]) callback() },
      size: () => listeners.size,
    }
  }
  return h
}

async function deniedWithoutEffects(h) {
  const before = h.counts()
  assert.equal(h.host.reserve(CLARIFIED), false)
  assert.equal((await h.host.prepareService()).status, 'NOT_RUN')
  assert.equal(h.host.authorizeControl(h.request('denied')), null)
  assert.equal((await h.host.runControl({ permission: {}, signal: h.signal() })).status, 'NOT_RUN')
  assert.deepEqual(h.counts(), before, 'no new filesystem, process, socket, clock, timer or registration effects')
}

test('production and test factories do not read options or effect ports', () => {
  let optionReads = 0, portReads = 0
  const options = new Proxy({}, { get() { optionReads++; throw ioError() }, getPrototypeOf() { optionReads++; throw ioError() } })
  const ports = new Proxy({}, { get() { portReads++; throw ioError() }, getPrototypeOf() { portReads++; throw ioError() } })
  const production = createNodeCdpOperatorHost(options)
  const simulated = createNodeCdpOperatorHostForTest(options, ports)
  assert.ok(Object.isFrozen(production) && Object.isFrozen(simulated))
  assert.equal(production.inspect().phase, 'NEW')
  assert.equal(optionReads, 0); assert.equal(portReads, 0)
  const h = fixture()
  assert.deepEqual(h.counts(), { fs: 0, uuid: 0, spawn: 0, socket: 0, clock: 0, timer: 0, cancel: 0, adds: 0, removes: 0, childChecks: 0 })
})

let importProbeSequence = 0, importLoaderRegistered = false
async function observeNativeImport(specifier) {
  const { default: filesystem } = await import('node:fs')
  const { default: processes } = await import('node:child_process')
  const { register, syncBuiltinESMExports } = await import('node:module')
  if (!importLoaderRegistered) {
    // Async customization hooks load in Node's separate loader thread. Delegate
    // unchanged bytes to the real file loader; evaluation stays in this guarded
    // thread. No main-thread filesystem call gets a loader exception. The hook
    // lives only in this test-file process (register has no cross-version undo).
    const loader = 'export async function load(url, context, nextLoad) { return nextLoad(url, context) }'
    register(`data:text/javascript,${encodeURIComponent(loader)}`, import.meta.url)
    importLoaderRegistered = true
  }
  const saved = [], calls = [], evaluations = []
  let loaded, host, error, phase = 'import'
  function trap(target, key, replacement) {
    const descriptor = Object.getOwnPropertyDescriptor(target, key)
    saved.push({ target, key, descriptor })
    Object.defineProperty(target, key, { configurable: true, writable: true,
      enumerable: descriptor?.enumerable ?? true,
      value: replacement ?? function () {
        calls.push(key)
        throw new Error(`Forbidden import effect: ${key}`)
      } })
  }
  try {
    const originalJoin = win32.join
    // These two initializers belong to the unchanged host's module body, not
    // its factory. Observe them only while import is pending. Unlike a different
    // export identity alone, this rejects even a previously cached query URL.
    trap(win32, 'join', function (...args) {
      if (phase === 'import' && args[0] === ROOT) evaluations.push(args.slice())
      return Reflect.apply(originalJoin, win32, args)
    })
    for (const key of ['openSync', 'readFileSync', 'writeSync', 'mkdirSync', 'fsyncSync']) trap(filesystem, key)
    trap(processes, 'spawn'); trap(globalThis, 'WebSocket'); trap(globalThis, 'setTimeout')
    syncBuiltinESMExports()
    loaded = await import(specifier)
    phase = 'factory'
    host = loaded.createNodeCdpOperatorHost(CONFIG)
  } catch (caught) { error = caught }
  finally {
    for (const { target, key, descriptor } of saved.toReversed()) {
      if (descriptor) Object.defineProperty(target, key, descriptor)
      else Reflect.deleteProperty(target, key)
    }
    syncBuiltinESMExports()
  }
  // Neither swallowed hook errors nor failed imports can satisfy these checks.
  for (const { target, key, descriptor } of saved) {
    assert.deepEqual(Object.getOwnPropertyDescriptor(target, key), descriptor, `restored ${key}`)
  }
  return { loaded, host, error, calls, evaluations }
}

function assertFreshNativeImport(observation, cached) {
  assert.equal(observation.error, undefined, 'import and factory must complete without loader/fixture errors')
  assert.deepEqual(observation.evaluations, [[ROOT, 'reservation.json'], [ROOT, 'synthetic-profile']],
    'fresh module evaluation required')
  assert.notEqual(observation.loaded, cached, 'fresh module namespace required')
  // A function declaration is instantiated anew by module evaluation. Reading
  // bytes alone cannot produce this witness; a cached namespace fails it.
  assert.notEqual(observation.loaded.createNodeCdpOperatorHost, cached.createNodeCdpOperatorHost,
    'fresh production factory identity required')
  assert.equal(observation.host.inspect().phase, 'NEW')
  assert.deepEqual(observation.calls, [], 'no native import or factory effects')
}

test('actual fresh module import and production factory are inert for native effects', async () => {
  const cached = await import('../scripts/browser/nodeCdpOperatorHost.js')
  const source = new globalThis.URL('../scripts/browser/nodeCdpOperatorHost.js', import.meta.url)
  source.searchParams.set('inert-import', String(++importProbeSequence))
  assertFreshNativeImport(await observeNativeImport(source.href), cached)
})

test('import observation rejects a reused cache import at the freshness witness', async () => {
  const canonical = await import('../scripts/browser/nodeCdpOperatorHost.js')
  const source = new globalThis.URL('../scripts/browser/nodeCdpOperatorHost.js', import.meta.url)
  source.searchParams.set('inert-import', String(++importProbeSequence))
  const cached = await import(source.href)
  const observation = await observeNativeImport(source.href)
  assert.equal(observation.error, undefined)
  assert.equal(observation.loaded, cached)
  assert.equal(observation.loaded.createNodeCdpOperatorHost, cached.createNodeCdpOperatorHost)
  assert.notEqual(observation.loaded, canonical, 'a distinct namespace alone is insufficient')
  assert.deepEqual(observation.evaluations, [])
  assert.deepEqual(observation.calls, [])
  assert.throws(() => assertFreshNativeImport(observation, canonical),
    { code: 'ERR_ASSERTION', message: /fresh module evaluation required/ })
})

const importEffects = {
  // Read the very same file the loader needs: no path-based exception may leak.
  openSync: 'fs.openSync(new URL(import.meta.url), "r")',
  readFileSync: 'fs.readFileSync(new URL(import.meta.url))',
  writeSync: 'fs.writeSync(-1, "synthetic")',
  mkdirSync: 'fs.mkdirSync(null)',
  fsyncSync: 'fs.fsyncSync(-1)',
  // Invalid arguments also prevent real effects if a guard regresses.
  spawn: 'spawn()',
  WebSocket: 'new WebSocket("synthetic:forbidden")',
  setTimeout: 'setTimeout(null, 0)',
}
for (const [effect, expression] of Object.entries(importEffects)) {
  test(`import observation rejects swallowed ${effect} in evaluation and factory`, async (t) => {
    const { pathToFileURL } = await import('node:url')
    const cached = await import('../scripts/browser/nodeCdpOperatorHost.js')
    const directory = mkdtempSync(join(tmpdir(), 'goldendawn-import-guard-'))
    try {
      for (const phase of ['evaluation', 'factory']) {
        const attempt = `try { ${expression} } catch { /* deliberately swallowed */ }`
        const source = `import * as fs from 'node:fs'\nimport { spawn } from 'node:child_process'\n` +
          `import { win32 } from 'node:path'\n` +
          `win32.join(${JSON.stringify(ROOT)}, 'reservation.json')\n` +
          `win32.join(${JSON.stringify(ROOT)}, 'synthetic-profile')\n` +
          `${phase === 'evaluation' ? attempt : ''}\nexport const evaluated = true\n` +
          `export function createNodeCdpOperatorHost() {\n${phase === 'factory' ? attempt : ''}\n` +
          `return { inspect: () => ({ phase: 'NEW' }) }\n}\n`
        const file = join(directory, `${effect}-${phase}.mjs`)
        realFs.writeFileSync(file, source, { flag: 'wx' })
        // The complete tiny fixture and its raw hash are recorded before import.
        t.diagnostic(JSON.stringify({ effect, phase, file, source, bytes: Buffer.byteLength(source),
          sha256: createHash('sha256').update(source).digest('hex') }))
        const observation = await observeNativeImport(pathToFileURL(file).href)
        assert.equal(observation.error, undefined, 'not a loader, syntax or fixture rejection')
        assert.equal(observation.loaded.evaluated, true)
        assert.equal(observation.host.inspect().phase, 'NEW')
        assert.deepEqual(observation.calls, [effect], 'the intended guard must actually fire exactly once')
        assert.throws(() => assertFreshNativeImport(observation, cached),
          { code: 'ERR_ASSERTION', message: /no native import or factory effects/ })
      }
    } finally { rmSync(directory, { recursive: true, force: true }) }
  })
}

test('import observation restores an absent WebSocket property even after import failure', async () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'WebSocket')
  try {
    Reflect.deleteProperty(globalThis, 'WebSocket')
    const observation = await observeNativeImport('data:text/javascript,throw new Error("synthetic import failure")')
    assert.equal(observation.error?.message, 'synthetic import failure')
    assert.deepEqual(observation.calls, [])
    assert.equal(Object.hasOwn(globalThis, 'WebSocket'), false)
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'WebSocket', descriptor)
    else Reflect.deleteProperty(globalThis, 'WebSocket')
  }
})

test('missing history never grants initial clearance; malformed and asynchronous statements are refused', () => {
  let getters = 0
  const getter = { ...CLARIFIED }
  Object.defineProperty(getter, 'reference', { get() { getters++; return 'synthetic' } })
  for (const request of [undefined, {}, Promise.resolve(CLARIFIED), { ...CLARIFIED, status: 'CONFIRMED' },
    { ...CLARIFIED, operator: 'someone' }, { ...CLARIFIED, decision: 'CLEAR' }, getter]) {
    const h = fixture()
    assert.equal(h.host.reserve(request), false)
    assert.equal(h.counts().fs, 0)
    assert.equal(h.reserve(), false)
  }
  assert.equal(getters, 0)
})

test('exclusive create precedes every browser effect; full partial writes and readback are confirmed', () => {
  const h = fixture({ partialWrite: 7 })
  assert.equal(h.reserve(), true)
  const markerEffects = h.effects.filter((entry) => entry.name === MARKER)
  assert.equal(markerEffects[0].method, 'openSync')
  assert.ok(markerEffects.filter((entry) => entry.method === 'writeSync').length > 1)
  assert.deepEqual(markerEffects.slice(-4).map((entry) => entry.method), ['fsyncSync', 'fstatSync', 'readSync', 'closeSync'])
  const marker = JSON.parse(h.files.get(MARKER))
  assert.equal(marker.reference, CLARIFIED.reference)
  assert.equal(marker.directory, ROOT)
  assert.equal(h.descriptors.size, 0)
  assert.equal(h.counts().spawn, 0); assert.equal(h.counts().socket, 0); assert.equal(h.counts().timer, 0)
})

test('overlapping reservations have exactly one winner while the first write is still pending', () => {
  const h = fixture()
  const other = createNodeCdpOperatorHostForTest(CONFIG, h.ports)
  let rivalResult, overlaps = 0
  h.hooks.opened = (name) => {
    if (name === MARKER && !overlaps++) rivalResult = other.reserve(CLARIFIED)
  }
  assert.equal(h.reserve(), true)
  assert.equal(rivalResult, false)
  assert.equal(other.inspect().blocked, true)
  assert.equal(h.counts().spawn, 0)
})

for (const initial of [Buffer.alloc(0), Buffer.from('{'), Buffer.from('{"status":"CLEAR"}'), Buffer.from('old complete reservation')]) {
  test(`pre-existing marker (${initial.length} bytes) is never repaired, adopted or removed`, async () => {
    const h = fixture(); h.files.set(MARKER, Buffer.from(initial))
    assert.equal(h.reserve(), false)
    assert.deepEqual(h.files.get(MARKER), initial)
    await deniedWithoutEffects(h)
  })
}

for (const operation of ['lstatSync', 'realpathSync', 'openSync', 'writeSync', 'fsyncSync', 'fstatSync', 'readSync', 'closeSync']) {
  test(`reservation ${operation} failure permanently denies subsequent attempts`, async () => {
    const h = fixture()
    h.hooks.fs = (method) => { if (method === operation) throw ioError() }
    assert.equal(h.reserve(), false)
    assert.equal(h.host.inspect().blocked, true)
    assert.equal(h.counts().spawn, 0)
    if (['writeSync', 'fsyncSync', 'fstatSync', 'readSync', 'closeSync'].includes(operation)) assert.ok(h.files.has(MARKER))
    await deniedWithoutEffects(h)
  })
}

for (const [label, operation, value] of [
  ['zero write', 'writeSync', 0], ['Promise write', 'writeSync', Promise.resolve(1)],
  ['oversize write', 'writeSync', 9_999], ['Promise flush', 'fsyncSync', Promise.resolve()],
  ['short readback', 'readSync', 0], ['Promise close', 'closeSync', Promise.resolve()],
  ['wrong root', 'realpathSync', 'C:\\somewhere-else'],
]) {
  test(`reservation rejects ${label}`, async () => {
    const h = fixture(); h.hooks.fs = (method) => method === operation ? { value } : undefined
    assert.equal(h.reserve(), false)
    await deniedWithoutEffects(h)
  })
}

test('real temporary filesystem preserves exclusive marker across host instances and host end', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'goldendawn-operator-host-test-'))
  try {
    const h = fixture()
    const map = (name) => name === ROOT ? directory : join(directory, win32.basename(name))
    const native = { ...realFs,
      lstatSync: (name) => realFs.lstatSync(map(name)),
      realpathSync: (name) => realFs.realpathSync(map(name)) === realFs.realpathSync(directory) ? ROOT : name,
      openSync: (name, mode) => realFs.openSync(map(name), mode),
    }
    const first = createNodeCdpOperatorHostForTest(CONFIG, { ...h.ports, fs: native })
    assert.equal(first.reserve(CLARIFIED), true)
    const before = realFs.readFileSync(join(directory, 'reservation.json'))
    first.end()
    const second = createNodeCdpOperatorHostForTest(CONFIG, { ...h.ports, fs: native })
    assert.equal(second.reserve({ ...CLARIFIED, decision: 'RESTART_CLEARED_ADR0041_6_4' }), false)
    assert.deepEqual(realFs.readFileSync(join(directory, 'reservation.json')), before)
    assert.equal(h.counts().spawn, 0)
  } finally { rmSync(directory, { recursive: true }) }
})

test('preparation uses bound executable and fresh profile, exactly one version connection and no control', async () => {
  const h = fixture(); await h.ready()
  const state = h.host.inspect(), report = state.preparation
  assert.deepEqual(state.binding.version, VERSION)
  assert.equal(state.binding.webSocketUrl, URL)
  assert.deepEqual(h.commands.map((entry) => entry.method), ['Browser.getVersion'])
  assert.equal(report.connectionsAttempted, 1); assert.equal(report.versionCommands, 1)
  assert.equal(report.connection, 'closed'); assert.equal(report.registrations, 'closed'); assert.equal(report.timer, 'closed')
  assert.equal(report.connectionClosed, true)
  assert.deepEqual(report.stages.map((entry) => entry.name), ['endpoint', 'connect', 'version', 'close'])
  assert.ok(report.stages.every((entry) => entry.confirmedAt < entry.deadline))
  assert.deepEqual(h.spawnArguments, { executable: EXE,
    args: [`--user-data-dir=${PROFILE}`, '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=0',
      '--no-first-run', '--no-default-browser-check', '--disable-extensions', 'about:blank'],
    spawnOptions: { shell: false, detached: false, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] } })
  assert.equal(h.timers.size, 0)
  assert.ok([...h.sockets[0].listeners.values()].every((set) => set.size === 0))
  assert.equal(h.host.readEvidence('control-1'), null)
  const before = h.counts()
  assert.equal((await h.host.prepareService()).status, 'NOT_RUN')
  assert.equal((await h.host.runControl({ permission: {} })).status, 'NOT_RUN')
  assert.deepEqual(h.counts(), before)
})

for (const [label, change] of [
  ['hash mismatch', (h) => h.files.set(EXE, Buffer.from('wrong executable'))],
  ['missing executable', (h) => h.files.delete(EXE)],
  ['existing profile', (h) => h.directories.add(PROFILE)],
  ['aliased executable', (h) => { h.hooks.fs = (op, args) => op === 'realpathSync' && args[0] === EXE ? { value: 'C:\\Other\\chrome.exe' } : undefined }],
  ['duplicate generation', (h) => { h.hooks.uuid = () => 'synthetic-1' }],
]) {
  test(`preparation rejects ${label} before spawn`, async () => {
    const h = fixture(); assert.equal(h.reserve(), true); change(h)
    assert.equal((await h.prepare()).status, 'FAILED')
    assert.equal(h.counts().spawn, 0)
    assert.ok(h.files.has(MARKER))
    await deniedWithoutEffects(h)
  })
}

for (const operation of ['lstatSync', 'realpathSync', 'openSync', 'readSync', 'fstatSync', 'closeSync', 'mkdirSync']) {
  test(`preparation filesystem ${operation} failure retains reservation and denies restart`, async () => {
    const h = fixture(); assert.equal(h.reserve(), true)
    h.hooks.fs = (method) => { if (method === operation) throw ioError() }
    assert.equal((await h.prepare()).status, 'FAILED')
    assert.ok(h.files.has(MARKER)); assert.equal(h.counts().spawn, 0)
    await deniedWithoutEffects(h)
  })
}

for (const endpoint of ['', '9222', '0\n/devtools/browser/a', '65536\n/devtools/browser/a',
  '09222\n/devtools/browser/a', '9222\n/devtools/page/a', '9222\n/devtools/browser/a?b',
  '9222\n/devtools/browser/a\nextra', '9222\n/devtools/browser/ä', 'x'.repeat(257)]) {
  test(`bounded endpoint capture rejects ${JSON.stringify(endpoint.slice(0, 40))}`, async () => {
    const h = fixture({ endpoint }); assert.equal(h.reserve(), true)
    assert.equal((await h.prepare()).status, 'FAILED')
    assert.equal(h.counts().socket, 0)
    await deniedWithoutEffects(h)
  })
}

for (const operation of ['openSync', 'fstatSync', 'readSync', 'closeSync']) {
  test(`endpoint ${operation} error cannot create a version connection`, async () => {
    const h = fixture(); assert.equal(h.reserve(), true)
    h.hooks.fs = (method, args) => {
      const name = typeof args[0] === 'string' ? args[0] : h.descriptors.get(args[0])
      if (method === operation && name === ENDPOINT) throw ioError()
    }
    assert.equal((await h.prepare()).status, 'FAILED')
    assert.equal(h.counts().socket, 0)
    await deniedWithoutEffects(h)
  })
}

for (const packet of [{ id: 2, result: VERSION }, { id: 1, result: { ...VERSION, jsVersion: '' } },
  { id: 1, result: { ...VERSION, extra: true } }, { id: 1, result: VERSION, sessionId: 'foreign' },
  { id: 1, error: { code: -1 } }, { method: 'Target.created', params: {} },
  { id: 1, result: { ...VERSION, product: 'x'.repeat(513) } }]) {
  test(`version reply requires exact correlation and five bounded values: ${JSON.stringify(packet).slice(0, 90)}`, async () => {
    const h = fixture(); assert.equal(h.reserve(), true)
    h.hooks.command = (command, socket) => { socket.packet(packet); return true }
    const report = await h.prepare()
    assert.equal(report.status, 'FAILED'); assert.equal(h.commands.length, 1)
    assert.equal(h.sockets.length, 1); assert.equal(h.sockets[0].closes, 1)
    await deniedWithoutEffects(h)
  })
}

for (const value of [Buffer.from('{}'), '{', 'x'.repeat(8_193)]) {
  test(`nontext, malformed or oversized version input is bounded (${typeof value}, ${value.length})`, async () => {
    const h = fixture(); assert.equal(h.reserve(), true)
    h.hooks.command = (command, socket) => { socket.emit('message', { data: value }); return true }
    assert.equal((await h.prepare()).status, 'FAILED')
    await deniedWithoutEffects(h)
  })
}

test('duplicate version response prevents readiness without a second command or context', async () => {
  const h = fixture(); assert.equal(h.reserve(), true)
  h.hooks.command = (command, socket) => { socket.packet({ id: 1, result: VERSION }); socket.packet({ id: 1, result: VERSION }); return true }
  assert.equal((await h.prepare()).status, 'FAILED')
  assert.equal(h.commands.length, 1); assert.equal(h.counts().socket, 1)
})

for (const [stage, settings, hook, limit] of [
  ['endpoint', { noEndpoint: true }, null, 30_000],
  ['spawn', { noSpawn: true }, null, 30_000],
  ['connect', { noOpen: true }, null, 5_000],
  ['version', {}, (h) => { h.hooks.command = () => true }, 5_000],
  ['close', { noClose: true }, null, 5_000],
]) {
  for (const delta of [0, 1]) test(`${stage} absolute deadline + ${delta} refuses readiness and never retries`, async () => {
    const h = fixture(settings); assert.equal(h.reserve(), true); hook?.(h)
    const pending = h.host.prepareService(); h.flush()
    h.advance(limit + delta)
    h.flush()
    const report = await pending
    assert.equal(report.status, 'FAILED')
    assert.ok(report.endpointReads <= 301)
    assert.ok(h.counts().socket <= 1 && h.commands.length <= 1)
    await deniedWithoutEffects(h)
  })
}

test('endpoint polling does not renew its absolute deadline', async () => {
  const h = fixture({ noEndpoint: true }); assert.equal(h.reserve(), true)
  const pending = h.host.prepareService(); h.flush()
  for (let at = 100; at <= 30_000; at += 100) h.advance(at)
  assert.equal((await pending).status, 'FAILED')
  assert.equal(h.host.inspect().preparation.stages[0].deadline, 30_000)
  assert.ok(h.host.inspect().preparation.endpointReads <= 301)
  assert.equal(h.timers.size, 0)
})

for (const delta of [-1, 0, 1]) {
  test(`time consumed by close registration cleanup is counted at deadline ${delta}`, async () => {
    const h = fixture(); assert.equal(h.reserve(), true)
    h.hooks.socketRemove = () => h.time(5_000 + delta)
    const report = await h.prepare()
    assert.equal(report.status, delta < 0 ? 'READY' : 'FAILED')
    assert.equal(report.connectionClosed, true)
    assert.equal(report.registrations, 'closed')
  })
}

for (const hook of ['socketAdd', 'socketRemove', 'cancel', 'schedule', 'send', 'close', 'clock']) {
  test(`throwing ${hook} cannot confirm readiness or grant retries`, async () => {
    const h = fixture(); assert.equal(h.reserve(), true)
    h.hooks[hook] = () => { throw ioError() }
    const pending = h.host.prepareService(); h.flush()
    h.advance(40_000)
    const report = await pending
    assert.equal(report.status, 'FAILED')
    if (hook === 'socketRemove') assert.equal(report.registrations, 'possible')
    if (hook === 'cancel') assert.equal(report.timer, 'possible')
    await deniedWithoutEffects(h)
  })
}

for (const event of ['error', 'exit', 'disconnect', 'close']) {
  test(`child ${event} revokes the same held generation permanently`, async () => {
    const h = fixture(); await h.ready()
    h.child.emit(event)
    assert.equal(h.host.inspect().serviceLost, true)
    h.child.exitCode = null; h.child.signalCode = null; h.child.killed = false
    await deniedWithoutEffects(h)
    assert.ok(h.files.has(MARKER))
  })
}

for (const [property, value] of [['pid', 654], ['exitCode', 0], ['signalCode', 'SIGTERM'], ['killed', true], ['spawnfile', 'C:\\Foreign\\chrome.exe']]) {
  test(`contradictory process ${property} cannot be healed with the original value`, async () => {
    const h = fixture(); await h.ready()
    const before = h.child[property]; h.child[property] = value
    assert.equal(h.host.authorizeControl(h.request()), null)
    h.child[property] = before
    assert.equal(h.host.inspect().serviceLost, true)
    await deniedWithoutEffects(h)
  })
}

test('process exit, stream close and child close are separately observed; monitors end only after all closes', async () => {
  const h = fixture(); await h.ready()
  h.child.emit('exit')
  assert.equal(h.host.inspect().processExited, true)
  assert.equal(h.host.inspect().outputClosed, false)
  assert.equal(h.host.inspect().processClosed, false)
  h.child.stdout.emit('close'); h.child.emit('close')
  assert.equal(h.host.inspect().processRegistrations, 'confirmed')
  h.child.stderr.emit('close')
  assert.equal(h.host.inspect().outputClosed, true)
  assert.equal(h.host.inspect().processRegistrations, 'closed')
  for (const emitter of [h.child, h.child.stdout, h.child.stderr]) assert.equal(emitter.eventNames().length, 0)
  await deniedWithoutEffects(h)
})

test('process registration failures and output bounds remain failed without raw output retention', async () => {
  const failed = fixture(); assert.equal(failed.reserve(), true)
  failed.hooks.processAdd = () => { throw ioError() }
  assert.equal((await failed.prepare()).status, 'FAILED')
  await deniedWithoutEffects(failed)
  const h = fixture(); await h.ready()
  h.child.stdout.emit('data', Buffer.alloc(65_536))
  assert.equal(h.host.inspect().serviceLost, false)
  h.child.stderr.emit('data', Buffer.alloc(1))
  assert.equal(h.host.inspect().serviceLost, true)
  await deniedWithoutEffects(h)
})

test('end before reserve and abort during preparation retain state and forbid automatic restarts', async () => {
  const fresh = fixture(); fresh.host.end(); await deniedWithoutEffects(fresh)
  const h = fixture({ noOpen: true }); assert.equal(h.reserve(), true)
  const pending = h.host.prepareService(); h.flush(); h.host.end(); h.flush()
  assert.equal((await pending).status, 'FAILED')
  assert.ok(h.files.has(MARKER)); await deniedWithoutEffects(h)
})

test('missing, forged, asynchronous and wrongly correlated permissions cause no control effects', async () => {
  const h = fixture(); await h.ready()
  let getters = 0
  const bad = h.request()
  Object.defineProperty(bad, 'serviceGeneration', { get() { getters++; return h.host.inspect().serviceGeneration } })
  const before = h.counts()
  for (const request of [{}, Promise.resolve(h.request()), { ...h.request(), decision: 'CONFIRMED' },
    { ...h.request(), sessionId: 'foreign' }, { ...h.request(), sessionGeneration: 'foreign' },
    { ...h.request(), serviceId: 'foreign' }, { ...h.request(), serviceGeneration: 'foreign' }, bad]) {
    assert.equal(h.host.authorizeControl(request), null)
  }
  assert.equal(getters, 0)
  assert.equal((await h.host.runControl({ permission: Promise.resolve(true) })).status, 'NOT_RUN')
  const permission = h.host.authorizeControl(h.request())
  assert.ok(permission)
  assert.equal((await h.host.runControl({ permission: { ...permission } })).status, 'NOT_RUN')
  assert.deepEqual(h.counts(), before)
})

test('two successful controls use fresh factories, consume permissions and retain the one session marker', async () => {
  const h = fixture(); await h.ready()
  const marker = Buffer.from(h.files.get(MARKER)), provisionCounts = h.counts()
  const signal = h.signal()
  const first = await h.run('run-1', signal)
  assert.equal(first.status, 'PASS'); assert.equal(first.resourceStatus, 'PASS')
  assert.equal(signal.size(), 0)
  assert.equal(first.runtimeRecord, null)
  assert.ok(first.resources.every((entry) => entry.state === 'closed'))
  assert.ok(Object.isFrozen(h.host.readEvidence('run-1')))
  assert.equal(h.host.authorizeControl(h.request('run-1')), null)
  const second = await h.run('run-2')
  assert.equal(second.status, 'PASS'); assert.equal(second.contextReturned, true)
  assert.equal(h.sockets.length, 3)
  assert.equal(h.counts().spawn, provisionCounts.spawn)
  assert.equal(h.counts().fs, provisionCounts.fs)
  assert.equal(h.timers.size, 0)
  assert.equal(h.unexpectedCommands ?? 0, 0)
  assert.ok(h.commands.every((entry) => !['Browser.close', 'Runtime.evaluate', 'Page.navigate'].includes(entry.method)))
  assert.deepEqual(h.files.get(MARKER), marker)
  assert.equal(h.host.inspect().processExited, false)
})

test('one active control across factories; blocked parallel call has no new registrations or timers', async () => {
  const h = fixture(); await h.ready()
  const permission = h.host.authorizeControl(h.request('run-1'))
  const pending = h.host.runControl({ permission, signal: h.signal() })
  const before = h.counts()
  assert.equal(h.host.authorizeControl(h.request('run-2')), null)
  assert.equal((await h.host.runControl({ permission, signal: h.signal() })).status, 'NOT_RUN')
  assert.deepEqual(h.counts(), before)
  h.flush(); assert.equal((await pending).status, 'PASS')
})

test('late finding from a completed lease blocks starts but permits active normal disposal and completion', async () => {
  const h = fixture(); await h.ready()
  assert.equal((await h.run('old')).resourceStatus, 'PASS')
  let blocks = 0, accepted = false
  h.hooks.command = (command) => {
    if (command.method === 'Target.disposeBrowserContext') {
      blocks++
      accepted = h.host.reportResourceFinding({ runId: 'old', resourceStatus: 'UNPROVEN', code: 'LATE_REST' })
    }
    return false
  }
  const report = await h.run('active')
  assert.equal(blocks, 1); assert.equal(accepted, true)
  assert.equal(report.resourceStatus, 'PASS')
  assert.equal(report.contextReturned, true); assert.equal(report.connectionClosed, true)
  assert.equal(report.gateAcknowledged, true)
  assert.ok(!report.errors.includes('SERVICE_BINDING_LOST'))
  await deniedWithoutEffects(h)
})

test('resource failure persists after new run IDs and permissions; a new host cannot bypass its marker', async () => {
  const h = fixture(); await h.ready()
  h.hooks.command = (command, socket) => {
    if (command.method === 'Target.disposeBrowserContext') { socket.packet({ id: command.id, error: { code: -1 } }); return true }
    return false
  }
  const permission = h.host.authorizeControl(h.request())
  const pending = h.host.runControl({ permission }); h.flush(); h.advance(30_000); h.advance(85_000)
  const report = await pending
  assert.notEqual(report.resourceStatus, 'PASS')
  assert.equal(report.gateBlocked, true)
  await deniedWithoutEffects(h)
  const restarted = createNodeCdpOperatorHostForTest(CONFIG, h.ports)
  assert.equal(restarted.reserve({ ...CLARIFIED, decision: 'RESTART_CLEARED_ADR0041_6_4' }), false)
})

test('service loss during an active control cannot be healed and forbids reuse of old context identifiers', async () => {
  const h = fixture(); await h.ready()
  let fired = 0
  h.hooks.command = (command) => {
    if (command.method === 'Target.createBrowserContext') { fired++; h.child.emit('exit') }
    return false
  }
  const permission = h.host.authorizeControl(h.request())
  const pending = h.host.runControl({ permission }); h.flush(); h.advance(30_000); h.advance(85_000)
  const report = await pending
  assert.equal(fired, 1)
  assert.notEqual(report.resourceStatus, 'PASS')
  assert.ok(report.errors.includes('SERVICE_BINDING_LOST'))
  assert.equal(h.commands.filter((entry) => entry.method === 'Target.disposeBrowserContext').length, 0)
  await deniedWithoutEffects(h)
})

test('delayed connection timeout cannot move the failure-close budget or create another timer', async () => {
  const h = fixture({ noOpen: true }); assert.equal(h.reserve(), true)
  const pending = h.host.prepareService(); h.flush()
  const before = h.counts()
  h.advance(20_000)
  const report = await pending
  assert.equal(report.status, 'FAILED')
  assert.equal(report.stages.at(-1).start, 5_000)
  assert.equal(report.stages.at(-1).deadline, 10_000)
  assert.ok(report.errors.includes('CLOSE_DEADLINE'))
  assert.equal(h.counts().timer, before.timer)
  assert.equal(h.sockets[0].closes, 1)
  await deniedWithoutEffects(h)
})

test('timer cancellation uncertainty survives a later successful close timer and connection close', async () => {
  const h = fixture(); assert.equal(h.reserve(), true)
  let failures = 0
  h.hooks.cancel = () => { if (h.sockets.length && !failures++) throw ioError() }
  const report = await h.prepare()
  assert.equal(report.status, 'FAILED')
  assert.equal(report.connectionClosed, true)
  assert.equal(report.timer, 'possible')
  assert.ok(failures > 0)
  await deniedWithoutEffects(h)
})

for (const delta of [-1, 0, 1]) {
  test(`time consumed before first socket at endpoint deadline ${delta} is checked before connection`, async () => {
    const h = fixture(); assert.equal(h.reserve(), true)
    let consumed = false
    h.hooks.cancel = () => { if (!consumed) { consumed = true; h.time(30_000 + delta) } }
    const report = await h.prepare()
    assert.equal(report.status, delta < 0 ? 'READY' : 'FAILED')
    assert.equal(h.counts().socket, delta < 0 ? 1 : 0)
    if (delta >= 0) await deniedWithoutEffects(h)
  })
}

for (const delta of [-1, 0, 1]) {
  test(`version response at absolute deadline ${delta} cannot renew the reply budget`, async () => {
    const h = fixture(); assert.equal(h.reserve(), true)
    h.hooks.command = (command, socket) => {
      h.time(5_000 + delta); socket.packet({ id: command.id, result: VERSION }); return true
    }
    const report = await h.prepare()
    assert.equal(report.status, delta < 0 ? 'READY' : 'FAILED')
    assert.equal(h.commands.length, 1)
    if (delta >= 0) await deniedWithoutEffects(h)
  })
}

test('process loss during version binding invalidates readiness despite a complete version reply', async () => {
  const h = fixture(); assert.equal(h.reserve(), true)
  h.hooks.command = (command, socket) => {
    h.child.emit('exit'); socket.packet({ id: command.id, result: VERSION }); return true
  }
  const report = await h.prepare()
  assert.equal(report.status, 'FAILED')
  assert.equal(h.host.inspect().serviceLost, true)
  assert.equal(h.host.inspect().binding, null)
  await deniedWithoutEffects(h)
})

test('uncertain process monitor removal remains visible after all close events', async () => {
  const h = fixture(); await h.ready()
  let failed = 0
  h.hooks.processRemove = () => { failed++; throw ioError() }
  h.child.emit('exit'); h.child.stdout.emit('close'); h.child.stderr.emit('close'); h.child.emit('close')
  assert.ok(failed > 0)
  assert.equal(h.host.inspect().processRegistrations, 'possible')
  const attempts = failed
  h.child.emit('close'); h.child.stdout.emit('close'); h.child.stderr.emit('close')
  assert.equal(h.host.inspect().processRegistrations, 'possible')
  assert.equal(failed, attempts)
  await deniedWithoutEffects(h)
})

for (const fault of ['type', 'size', 'links', 'readback']) {
  test(`reservation refuses inconsistent ${fault} after exclusive write and flush`, async () => {
    const h = fixture()
    h.hooks.fs = (method, args) => {
      if (method === 'readSync' && fault === 'readback') {
        args[1].fill(120); return { value: h.files.get(MARKER).length }
      }
      if (method === 'fstatSync' && fault !== 'readback') return { value: {
        isFile: () => fault !== 'type', size: h.files.get(MARKER).length + (fault === 'size' ? 1 : 0),
        nlink: fault === 'links' ? 2 : 1,
      } }
    }
    assert.equal(h.reserve(), false)
    assert.ok(h.files.has(MARKER))
    await deniedWithoutEffects(h)
  })
}

test('configuration and port accessors are never used as confirmations; input mutations cannot rebind an accepted executable', async () => {
  const h = fixture()
  let getters = 0
  const bad = { ...CONFIG }
  Object.defineProperty(bad, 'chromeSha256', { get() { getters++; return CONFIG.chromeSha256 } })
  const rejected = createNodeCdpOperatorHostForTest(bad, h.ports)
  assert.equal(rejected.reserve(CLARIFIED), false)
  assert.equal(getters, 0)
  assert.equal(h.counts().fs, 0)
  const badPorts = { ...h.ports }
  Object.defineProperty(badPorts, 'uuid', { get() { getters++; return h.ports.uuid } })
  assert.equal(createNodeCdpOperatorHostForTest(CONFIG, badPorts).reserve(CLARIFIED), false)
  assert.equal(getters, 0)
  assert.equal(h.counts().fs, 0)
  const options = { ...CONFIG }, host = createNodeCdpOperatorHostForTest(options, h.ports)
  assert.equal(host.reserve(CLARIFIED), true)
  options.chromeExecutable = 'C:\\Foreign\\chrome.exe'; options.chromeSha256 = '0'.repeat(64)
  const pending = host.prepareService(); h.flush()
  assert.equal((await pending).status, 'READY')
  assert.equal(h.spawnArguments.executable, EXE)
})

test('an already aborted control consumes its permission without any browser start or profile creation', async () => {
  const h = fixture(); await h.ready()
  const before = h.counts(), signal = h.signal(); signal.abort()
  const report = await h.run('aborted', signal)
  assert.equal(report.status, 'UNPROVEN')
  assert.equal(h.counts().spawn, before.spawn)
  assert.equal(h.counts().fs, before.fs)
  assert.ok(h.files.has(MARKER))
  assert.equal(h.host.authorizeControl(h.request('aborted')), null)
})

for (const missing of [['stdout'], ['stderr'], ['stdout', 'stderr']]) {
  test(`B1 missing ${missing.join('+')} retains process error and close observation`, async () => {
    const h = fixture(); assert.equal(h.reserve(), true)
    h.hooks.spawn = (child) => { for (const field of missing) child[field] = null }
    const report = await h.prepare()
    assert.equal(report.status, 'FAILED')
    let escaped = null
    try { h.child.emit('error', ioError()) } catch (error) { escaped = error }
    h.child.emit('exit'); h.child.emit('close')
    for (const field of ['stdout', 'stderr']) h.child[field]?.emit('close')
    assert.equal(escaped, null, 'process error must be handled despite missing pipes')
    const state = h.host.inspect()
    assert.equal(state.processExited, true); assert.equal(state.processClosed, true)
    assert.equal(state.resources.processReferenceHeld, true)
    assert.equal(state.resources.process, 'closed')
    for (const field of ['stdout', 'stderr']) {
      assert.equal(report.resources[field], missing.includes(field) ? 'missing' : 'confirmed')
      assert.equal(state.resources[field], missing.includes(field) ? 'missing' : 'closed')
    }
    assert.equal(state.outputClosed, false, 'missing pipe is not an observed close')
    assert.equal(h.counts().socket, 0)
    await deniedWithoutEffects(h)
  })
}

test('B1 complete pipes retain successful provisioning and separate process/stream closure', async () => {
  const h = fixture(); await h.ready()
  assert.equal((await h.run('complete-pipes')).resourceStatus, 'PASS')
  h.child.emit('exit'); h.child.emit('close')
  assert.equal(h.host.inspect().outputClosed, false)
  h.child.stdout.emit('close'); h.child.stderr.emit('close')
  assert.equal(h.host.inspect().processRegistrations, 'closed')
  await deniedWithoutEffects(h)
})

for (const fault of ['deadline', 'invalid-generation', 'duplicate-generation']) {
  test(`B2 created profile remains accounted after ${fault} before service creation`, async () => {
    const h = fixture(); assert.equal(h.reserve(), true)
    let attempts = 0
    h.hooks.fs = (method, args) => {
      if (method === 'mkdirSync') {
        attempts++; h.directories.add(args[0])
        if (fault === 'deadline') h.time(30_000)
        return { value: undefined }
      }
    }
    if (fault !== 'deadline') h.hooks.uuid = () => fault === 'invalid-generation' ? '' : h.host.inspect().sessionId
    const report = await h.prepare()
    assert.equal(report.status, 'FAILED')
    assert.equal(attempts, 1); assert.equal(h.directories.has(PROFILE), true)
    assert.equal(h.host.inspect().serviceId, null)
    assert.deepEqual(report.resources?.profile, { path: PROFILE, state: 'confirmed' }, 'created profile needs its own retained position')
    assert.deepEqual(h.host.inspect().resources.profile, report.resources.profile)
    assert.equal(report.resources.process, 'notAttempted')
    assert.equal(report.resources.stdout, 'notAttempted'); assert.equal(report.resources.stderr, 'notAttempted')
    assert.equal(report.resources.processRegistrations, 'notAttempted')
    assert.equal(h.counts().spawn, 0)
    h.host.end(); await deniedWithoutEffects(h)
    assert.equal(h.directories.has(PROFILE), true)
  })
}

for (const outcome of ['throw-before', 'throw-after', 'unconfirmed-return']) {
  test(`B2 unconfirmed profile creation remains possible: ${outcome}`, async () => {
    const h = fixture(); assert.equal(h.reserve(), true)
    let attempts = 0
    h.hooks.fs = (method, args) => {
      if (method !== 'mkdirSync') return
      attempts++
      if (outcome !== 'throw-before') h.directories.add(args[0])
      if (outcome !== 'unconfirmed-return') throw ioError()
      return { value: true }
    }
    const report = await h.prepare()
    assert.equal(report.status, 'FAILED'); assert.equal(attempts, 1)
    assert.equal(h.directories.has(PROFILE), outcome !== 'throw-before')
    assert.deepEqual(report.resources?.profile, { path: PROFILE, state: 'possible' }, 'unconfirmed creation must remain visible')
    assert.deepEqual(h.host.inspect().resources.profile, report.resources.profile)
    assert.equal(h.counts().spawn, 0)
    await deniedWithoutEffects(h)
  })
}

test('B2 executable rejection before mkdir cannot claim profile creation', async () => {
  const h = fixture(); assert.equal(h.reserve(), true)
  h.files.set(EXE, Buffer.from('different executable'))
  const report = await h.prepare()
  assert.equal(report.status, 'FAILED'); assert.equal(h.directories.has(PROFILE), false)
  assert.equal(h.effects.filter((entry) => entry.method === 'mkdirSync').length, 0)
  assert.deepEqual(report.resources?.profile, { path: PROFILE, state: 'notAttempted' })
  assert.deepEqual(h.host.inspect().resources.profile, report.resources.profile)
})

test('B2 process creation uncertainty preserves separate profile, process, channel and registration positions', async () => {
  const h = fixture(); assert.equal(h.reserve(), true)
  h.hooks.spawn = () => { throw ioError() }
  const report = await h.prepare()
  assert.equal(report.status, 'FAILED'); assert.equal(h.counts().spawn, 1)
  assert.equal(h.directories.has(PROFILE), true)
  assert.equal(report.resources?.profile.state, 'confirmed')
  assert.equal(report.resources.process, 'possible')
  assert.equal(report.resources.stdout, 'possible'); assert.equal(report.resources.stderr, 'possible')
  assert.equal(report.resources.processRegistrations, 'notAttempted')
  assert.equal(report.resources.processReferenceHeld, false)
  await deniedWithoutEffects(h)
})

for (const delta of [-1, 0, 1]) {
  test(`B3 first socket error anchors close at 6000 despite cancellation time, close ${delta}`, async () => {
    const h = fixture({ noOpen: true, noClose: true }); assert.equal(h.reserve(), true)
    const pending = h.host.prepareService(); h.flush()
    let cancellations = 0
    h.hooks.cancel = () => { if (++cancellations === 1) h.time(4_000) }
    h.time(1_000); h.sockets[0].emit('error')
    h.time(6_000 + delta); h.sockets[0].readyState = 3; h.sockets[0].emit('close')
    const report = await pending
    assert.equal(cancellations, 2)
    assert.equal(report.stages.at(-1).start, 1_000, 'first stop precedes timer removal')
    assert.equal(report.stages.at(-1).deadline, 6_000, 'cancellation must not renew the budget')
    assert.equal(report.errors.includes('DEADLINE'), delta >= 0)
    assert.equal(report.connectionClosed, true); assert.equal(report.registrations, 'closed')
    assert.equal(report.status, 'FAILED'); assert.ok(report.errors.includes('SOCKET_ERROR'))
    assert.equal(h.sockets[0].closes, 1); assert.equal(h.timers.size, 0)
    await deniedWithoutEffects(h)
  })
}

test('B3 reentrant failure during cancellation cannot replace the first stop or schedule after finish', async () => {
  const h = fixture({ noOpen: true, noClose: true }); assert.equal(h.reserve(), true)
  const pending = h.host.prepareService(); h.flush()
  const timersBefore = h.counts().timer
  let cancellations = 0
  h.hooks.cancel = () => {
    if (++cancellations === 1) { h.time(4_000); h.sockets[0].emit('error') }
  }
  h.time(1_000); h.sockets[0].emit('error')
  const report = await pending
  assert.equal(report.stages.at(-1).deadline, 6_000)
  assert.equal(report.status, 'FAILED'); assert.equal(cancellations, 1)
  assert.equal(h.counts().timer, timersBefore); assert.equal(h.timers.size, 0)
  await deniedWithoutEffects(h)
})

for (const fault of ['backward', 'throw']) {
  test(`B3 unreliable clock at first stop cannot confirm success: ${fault}`, async () => {
    const h = fixture({ noOpen: true }); assert.equal(h.reserve(), true)
    const pending = h.host.prepareService(); h.flush()
    if (fault === 'backward') h.time(-1)
    else h.hooks.clock = () => { throw ioError() }
    h.sockets[0].emit('error'); h.flush()
    const report = await pending
    assert.equal(report.status, 'FAILED'); assert.ok(report.errors.includes('CLOCK'))
    assert.ok(report.stages.every((entry) => entry.name !== 'close'))
    await deniedWithoutEffects(h)
  })
}

for (const outcome of ['throw', 'unconfirmed', 'success']) {
  for (const reentrant of [false, true]) {
    test(`B4 process monitor removal ${outcome}, reentrant=${reentrant}, survives repeated closes`, async () => {
      const h = fixture(); await h.ready()
      const emitters = [h.child, h.child.stdout, h.child.stderr]
      const listeners = () => emitters.reduce((sum, emitter) => sum + emitter.eventNames()
        .reduce((count, name) => count + emitter.listenerCount(name), 0), 0)
      assert.equal(listeners(), 11)
      const before = h.counts().removes
      let attempts = 0, nested = false
      h.hooks.processRemove = () => {
        attempts++
        if (reentrant && !nested) {
          nested = true
          for (const emitter of emitters) emitter.emit('close')
        }
        if (outcome === 'throw') throw ioError()
        if (outcome === 'unconfirmed') return { value: undefined }
      }
      h.child.emit('exit'); h.child.stdout.emit('close'); h.child.stderr.emit('close'); h.child.emit('close')
      assert.equal(h.host.inspect().processRegistrations, outcome === 'success' ? 'closed' : 'possible')
      for (const emitter of emitters) { emitter.emit('close'); emitter.emit('close') }
      assert.equal(h.host.inspect().processRegistrations, outcome === 'success' ? 'closed' : 'possible', 'repeated closes must not erase failed removals')
      assert.equal(attempts, 11); assert.equal(h.counts().removes - before, 11)
      assert.equal(listeners(), outcome === 'success' ? 0 : 11)
      await deniedWithoutEffects(h)
    })
  }
}
