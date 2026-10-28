import assert from 'node:assert/strict'
import test from 'node:test'
import { createNodeCdpContextControl } from '../scripts/browser/nodeCdpContextControl.js'

const BINDING = Object.freeze({ serviceId: 'synthetic-service',
  webSocketUrl: 'ws://127.0.0.1:9222/devtools/browser/synthetic-browser',
  version: Object.freeze({ protocolVersion: '1.3', product: 'Synthetic/1', revision: 'revision-1',
    userAgent: 'Synthetic', jsVersion: '1' }) })
const OWN_INFO = { targetId: 'target-own', browserContextId: 'context-own', type: 'page', url: 'about:blank' }
const FOREIGN_INFO = { targetId: 'target-foreign', browserContextId: 'context-foreign', type: 'page', url: 'private:omitted' }
const FRAME = { id: 'frame-own', loaderId: 'loader-own', url: 'about:blank' }

class Events {
  listeners = new Map()
  addEventListener(name, callback) {
    if (!this.listeners.has(name)) this.listeners.set(name, new Set())
    this.listeners.get(name).add(callback)
  }
  removeEventListener(name, callback) { this.listeners.get(name)?.delete(callback) }
  emit(name, event = {}) { for (const callback of [...(this.listeners.get(name) ?? [])]) callback(event) }
  count() { return [...this.listeners.values()].reduce((sum, callbacks) => sum + callbacks.size, 0) }
}

// External, operator-session owner. Factories do not own or reset this state.
function owner() {
  let held = null, blocked = false
  const knownLeases = new Set()
  const calls = []
  return {
    calls,
    get blocked() { return blocked },
    acquire(binding, runId) {
      calls.push('acquire')
      if (blocked || held) return null
      held = Object.freeze({ status: 'ACQUIRED', serviceId: binding.serviceId,
        webSocketUrl: binding.webSocketUrl, runId })
      knownLeases.add(held)
      return held
    },
    isCurrent(lease) { return lease === held },
    block(lease, finding) {
      assert.ok(knownLeases.has(lease))
      assert.ok(['FAIL', 'UNPROVEN'].includes(finding.resourceStatus))
      blocked = true; calls.push({ block: finding }); return true
    },
    complete(lease, report) {
      assert.equal(lease, held)
      calls.push({ complete: report })
      if (report.resourceStatus !== 'PASS') blocked = true
      if (!blocked) held = null
      return true
    },
  }
}

function harness(options = {}) {
  let time = 0, nextTimer = 0, socketsCreated = 0
  const timers = new Map(), queue = [], sent = [], saved = [], effects = []
  const gate = options.gate ?? owner()
  const signal = new Events()
  signal.aborted = false
  signal.abort = () => { signal.aborted = true; signal.emit('abort') }
  const h = {
    gate, signal, timers, sent, saved, effects,
    get time() { return time },
    get socketsCreated() { return socketsCreated },
    setTime(value) { time = value },
    enqueue(callback) { queue.push(callback) },
    flush() {
      let count = 0
      while (queue.length) {
        assert.ok(++count < 2_000, 'finite fake event queue')
        queue.shift()()
      }
    },
    advance(value) {
      time = value
      let count = 0
      while ([...timers.values()].some((entry) => entry.at <= time)) {
        assert.ok(++count < 100, 'finite deadline processing')
        const [id, entry] = [...timers.entries()].filter(([, timer]) => timer.at <= time)
          .sort((a, b) => a[1].at - b[1].at)[0]
        timers.delete(id)
        entry.callback()
        h.flush()
      }
      h.flush()
    },
    event(method, params, sessionId) {
      const packet = { method, params }
      if (sessionId !== undefined) packet.sessionId = sessionId
      h.raw(JSON.stringify(packet))
    },
    raw(data) { h.socket.emit('message', { data }) },
    answer(command, result, extra = {}) {
      const packet = { id: command.id, result, ...extra }
      if (command.sessionId !== undefined && !Object.hasOwn(extra, 'sessionId')) packet.sessionId = command.sessionId
      h.raw(JSON.stringify(packet))
    },
    defaults(command) {
      const { method } = command
      if (method === 'Browser.getVersion') h.answer(command, { ...BINDING.version })
      else if (method === 'Target.getBrowserContexts') h.answer(command,
        { browserContextIds: ['context-foreign'] })
      else if (method === 'Target.setDiscoverTargets') {
        h.event('Target.targetCreated', { targetInfo: FOREIGN_INFO })
        h.answer(command, {})
      } else if (method === 'Target.createBrowserContext') h.answer(command, { browserContextId: 'context-own' })
      else if (method === 'Target.createTarget') {
        h.event('Target.targetCreated', { targetInfo: OWN_INFO })
        h.answer(command, { targetId: 'target-own' })
      } else if (method === 'Target.getTargetInfo') h.answer(command, { targetInfo: OWN_INFO })
      else if (method === 'Target.attachToTarget') {
        h.event('Target.attachedToTarget', { sessionId: 'session-own', targetInfo: OWN_INFO, waitingForDebugger: false })
        h.answer(command, { sessionId: 'session-own' })
      } else if (method === 'Page.enable') {
        h.event('Page.frameNavigated', { frame: FRAME }, 'session-own')
        h.answer(command, {})
      } else if (method === 'Page.getFrameTree') h.answer(command, { frameTree: { frame: FRAME } })
      else if (method === 'Target.disposeBrowserContext') {
        h.event('Target.targetDestroyed', { targetId: 'target-own' })
        h.event('Target.detachedFromTarget', { sessionId: 'session-own', targetId: 'target-own' })
        h.answer(command, {})
      } else assert.fail(`Unexpected command: ${method}`)
    },
  }
  class Socket extends Events {
    url = BINDING.webSocketUrl
    readyState = 0
    closeCalls = 0
    send(raw) {
      assert.equal(this.readyState, 1)
      const command = JSON.parse(raw)
      sent.push(command)
      effects.push({ type: 'send', method: command.method, at: time })
      h.enqueue(() => {
        if (options.intercept?.(command, h) === true) return
        h.defaults(command)
      })
    }
    close() {
      ++this.closeCalls
      effects.push({ type: 'close', at: time })
      if (options.close === 'open') return
      this.readyState = 2
      if (options.close === 'missing') return
      h.enqueue(() => this.closed())
    }
    open() { this.readyState = 1; this.emit('open') }
    closed() { this.readyState = 3; this.emit('close') }
  }
  h.dependencies = {
    binding: options.binding ?? BINDING,
    createWebSocket(url) {
      ++socketsCreated; effects.push({ type: 'socket', at: time })
      assert.equal(url, BINDING.webSocketUrl)
      h.socket = new Socket()
      return h.socket
    },
    now() { effects.push({ type: 'clock', at: time }); return time },
    schedule(callback, delay) {
      effects.push({ type: 'timer', at: time })
      const id = ++nextTimer
      timers.set(id, { callback, at: time + delay })
      return id
    },
    cancel(id) { timers.delete(id) },
    startGate: gate,
    evidence: { save(snapshot) {
      saved.push(snapshot)
      return options.save ? options.save(snapshot, h) : true
    } },
  }
  h.create = () => createNodeCdpContextControl(h.dependencies)
  h.start = (runId = 'run-synthetic') => {
    h.control = h.create()
    h.result = h.control.runOnce({ runId, signal })
    if (h.socket && options.open !== false) { h.socket.open(); h.flush() }
    return h.result
  }
  h.settle = async () => {
    h.flush()
    if (timers.size) h.advance(Math.min(...[...timers.values()].map((entry) => entry.at)))
    if (timers.size) h.advance(Math.min(...[...timers.values()].map((entry) => entry.at)))
    if (timers.size) h.advance(Math.min(...[...timers.values()].map((entry) => entry.at)))
    return h.result
  }
  return h
}

const count = (h, method) => h.sent.filter((command) => command.method === method).length
const resource = (report, name) => report.resources.find((entry) => entry.name === name)?.state
function bounded(h) {
  assert.equal(h.socketsCreated, 1)
  for (const method of ['Target.createBrowserContext', 'Target.createTarget', 'Target.disposeBrowserContext']) {
    assert.ok(count(h, method) <= 1, method)
  }
  assert.equal(h.socket.closeCalls, 1)
  assert.equal(h.socket.count(), 0)
  assert.equal(h.signal.count(), 0)
  assert.equal(h.timers.size, 0)
  assert.ok(h.sent.every((command) => !['Browser.close', 'Runtime.evaluate', 'Page.navigate',
    'Target.closeTarget', 'Target.detachFromTarget', 'Browser.setPermission'].includes(command.method)))
  assert.ok(h.sent.filter((command) => command.method === 'Target.disposeBrowserContext')
    .every((command) => command.params.browserContextId === 'context-own'))
}

test('fresh import and factory are effect-free; only runOnce is exported', async () => {
  const originals = new Map(['WebSocket', 'setTimeout', 'setInterval', 'fetch'].map((key) => [key, globalThis[key]]))
  try {
    for (const key of originals.keys()) globalThis[key] = () => assert.fail(`Unexpected global ${key}`)
    const module = await import('../scripts/browser/nodeCdpContextControl.js?inert-import')
    assert.deepEqual(Object.keys(module), ['createNodeCdpContextControl'])
    const h = harness()
    const control = module.createNodeCdpContextControl(h.dependencies)
    assert.deepEqual(Object.keys(control), ['runOnce'])
    assert.ok(Object.isFrozen(control))
    assert.deepEqual(h.effects, [])
    assert.deepEqual(h.gate.calls, [])
  } finally { for (const [key, value] of originals) globalThis[key] = value }
})

for (const url of ['wss://127.0.0.1:9222/devtools/browser/a', 'ws://localhost:9222/devtools/browser/a',
  'ws://[::1]:9222/devtools/browser/a', 'ws://127.0.0.1:09222/devtools/browser/a',
  'ws://127.0.0.1:0/devtools/browser/a', 'ws://127.0.0.1:65536/devtools/browser/a',
  'ws://user@127.0.0.1:9222/devtools/browser/a', 'ws://127.0.0.1:9222/devtools/browser/a?',
  'ws://127.0.0.1:9222/devtools/browser/a#', 'ws://127.0.0.1:9222/devtools/browser/%61',
  'ws://127.0.0.1:9222/devtools/page/a', ' ws://127.0.0.1:9222/devtools/browser/a',
  'ws://127.0.0.1:9222/devtools/browser/a/']) {
  test(`endpoint rejects without normalization: ${url}`, () => {
    const h = harness({ binding: { ...BINDING, webSocketUrl: url } })
    assert.throws(h.create, /Invalid Node CDP control composition/)
    assert.deepEqual(h.effects, [])
  })
}

for (const key of ['createWebSocket', 'now', 'schedule', 'cancel', 'startGate', 'evidence']) {
  test(`dependency ${key} has no fallback`, () => {
    const h = harness()
    delete h.dependencies[key]
    assert.throws(h.create, /Invalid Node CDP control composition/)
    assert.deepEqual(h.effects, [])
  })
}

for (const admission of [null, {}, { status: 'BLOCKED' }, { status: 'ACQUIRED', serviceId: 'wrong' }]) {
  test(`unclear or blocked external admission prevents all effects: ${JSON.stringify(admission)}`, async () => {
    const gate = owner()
    gate.acquire = () => admission
    const h = harness({ gate })
    const report = await h.start()
    assert.equal(report.status, 'NOT_RUN')
    assert.deepEqual(h.effects, [])
  })
}

test('complete lifecycle, early events, foreign inventory and own cleanup', async () => {
  const h = harness()
  const report = await h.start()
  assert.equal(report.status, 'PASS')
  assert.equal(report.resourceStatus, 'PASS')
  assert.equal(report.documentBound, true)
  assert.equal(report.contextReturned, true)
  assert.equal(report.evidenceSaved, true)
  assert.deepEqual(report.errors, [])
  assert.deepEqual(report.stages.map((entry) => entry.name), ['connection', 'binding', 'context', 'document'])
  assert.ok(report.stages.every((entry) => entry.deadline - entry.start === 5_000 && entry.confirmedAt < entry.deadline))
  assert.ok(report.resources.every((entry) => entry.state === 'closed'))
  assert.equal(h.saved.length, 1)
  assert.ok(Object.isFrozen(h.saved[0].document))
  assert.deepEqual(h.saved[0].document, { id: 'frame-own', loaderId: 'loader-own' })
  assert.ok(!JSON.stringify(report).includes('private:omitted'))
  assert.deepEqual(h.sent.map((command) => command.method), ['Browser.getVersion', 'Target.getBrowserContexts',
    'Target.setDiscoverTargets', 'Target.createBrowserContext', 'Target.createTarget', 'Target.getTargetInfo',
    'Target.attachToTarget', 'Page.enable', 'Page.getFrameTree', 'Target.disposeBrowserContext', 'Target.getBrowserContexts'])
  assert.deepEqual(h.sent.find((command) => command.method === 'Target.createTarget').params,
    { url: 'about:blank', browserContextId: 'context-own' })
  assert.ok(h.sent.filter((command) => command.method.startsWith('Page.'))
    .every((command) => command.sessionId === 'session-own'))
  bounded(h)
})

test('events after responses also complete the lifecycle', async () => {
  const h = harness({ intercept(command, h) {
    if (command.method === 'Target.createTarget') {
      h.answer(command, { targetId: 'target-own' })
      h.event('Target.targetCreated', { targetInfo: OWN_INFO }); return true
    }
    if (command.method === 'Target.attachToTarget') {
      h.answer(command, { sessionId: 'session-own' })
      h.event('Target.attachedToTarget', { sessionId: 'session-own', targetInfo: OWN_INFO }); return true
    }
    if (command.method === 'Target.disposeBrowserContext') {
      h.answer(command, {})
      h.event('Target.detachedFromTarget', { sessionId: 'session-own' })
      h.event('Target.targetDestroyed', { targetId: 'target-own' }); return true
    }
  } })
  assert.equal((await h.start()).status, 'PASS')
  bounded(h)
})

test('parallel factories share atomic external lease; one-shot API cannot restart', async () => {
  const gate = owner()
  const first = harness({ gate, open: false }), second = harness({ gate })
  first.start()
  assert.equal((await second.start('second-run')).status, 'NOT_RUN')
  assert.equal(second.socketsCreated, 0)
  await assert.rejects(first.control.runOnce({ runId: 'again' }), /already used/)
  first.socket.open(); first.flush()
  assert.equal((await first.result).status, 'PASS')
  bounded(first)
})

test('resource block survives new factory, run id and service binding', async () => {
  const gate = owner()
  const first = harness({ gate, open: false })
  first.start(); first.advance(5_000)
  const report = await first.result
  assert.equal(report.resourceStatus, 'UNPROVEN')
  assert.equal(gate.blocked, true)
  const second = harness({ gate, binding: { ...BINDING, serviceId: 'another-service' } })
  assert.equal((await second.start('another-run')).status, 'NOT_RUN')
  assert.equal(second.socketsCreated, 0)
})

const wrongCases = [
  ['service version', 'Browser.getVersion', (h, c) => h.answer(c, { ...BINDING.version, revision: 'wrong' }), 'VERSION_BINDING'],
  ['existing context', 'Target.createBrowserContext', (h, c) => h.answer(c, { browserContextId: 'context-foreign' }), 'CONTEXT_IDENTITY'],
  ['empty default context', 'Target.createBrowserContext', (h, c) => h.answer(c, { browserContextId: '' }), 'CONTEXT_IDENTITY'],
  ['existing target', 'Target.createTarget', (h, c) => h.answer(c, { targetId: 'target-foreign' }), 'TARGET_IDENTITY'],
  ['target context', 'Target.getTargetInfo', (h, c) => h.answer(c, { targetInfo: { ...OWN_INFO, browserContextId: 'wrong' } }), 'TARGET_BINDING'],
  ['target id', 'Target.getTargetInfo', (h, c) => h.answer(c, { targetInfo: { ...OWN_INFO, targetId: 'wrong' } }), 'TARGET_BINDING'],
  ['target URL', 'Target.getTargetInfo', (h, c) => h.answer(c, { targetInfo: { ...OWN_INFO, url: 'https://invalid.test/' } }), 'TARGET_BINDING'],
  ['session target', 'Target.attachToTarget', (h, c) => {
    h.event('Target.attachedToTarget', { sessionId: 'session-own', targetInfo: FOREIGN_INFO })
    h.answer(c, { sessionId: 'session-own' })
  }, 'SESSION_BINDING'],
  ['response session', 'Page.enable', (h, c) => h.answer(c, {}, { sessionId: 'foreign-session' }), 'RESPONSE_CORRELATION'],
  ['browser response session', 'Browser.getVersion', (h, c) => h.answer(c, BINDING.version, { sessionId: 'foreign-session' }), 'RESPONSE_CORRELATION'],
  ['response id', 'Browser.getVersion', (h) => h.raw('{"id":999,"result":{}}'), 'RESPONSE_CORRELATION'],
  ['frame id', 'Page.getFrameTree', (h, c) => h.answer(c, { frameTree: { frame: { ...FRAME, id: 'wrong' } } }), 'DOCUMENT_BINDING'],
  ['loader generation', 'Page.getFrameTree', (h, c) => h.answer(c, { frameTree: { frame: { ...FRAME, loaderId: 'wrong' } } }), 'DOCUMENT_BINDING'],
  ['document URL', 'Page.getFrameTree', (h, c) => h.answer(c, { frameTree: { frame: { ...FRAME, url: 'https://invalid.test/' } } }), 'DOCUMENT_BINDING'],
  ['subframe', 'Page.getFrameTree', (h, c) => h.answer(c, { frameTree: { frame: FRAME, childFrames: [{}] } }), 'DOCUMENT_BINDING'],
]
for (const [name, method, inject, code] of wrongCases) {
  test(`rejects incorrect ${name}`, async () => {
    const h = harness({ intercept(command, h) {
      if (command.method !== method) return false
      inject(h, command); return true
    } })
    h.start()
    const report = await h.settle()
    assert.equal(report.status, 'FAIL')
    assert.ok(report.errors.includes(code), JSON.stringify(report))
    if (method === 'Browser.getVersion') assert.equal(count(h, 'Target.createBrowserContext'), 0)
    if (name.includes('context')) assert.ok(h.sent.filter((c) => c.method === 'Target.disposeBrowserContext')
      .every((c) => c.params.browserContextId !== 'context-foreign'))
    bounded(h)
  })
}

for (const [name, inject, code] of [
  ['duplicate reply', (h, c) => { h.answer(c, BINDING.version); h.answer(c, BINDING.version) }, 'RESPONSE_CORRELATION'],
  ['protocol error', (h, c) => h.raw(JSON.stringify({ id: c.id, error: { code: -1, message: 'SECRET_EXCEPTION' } })), 'CDP_ERROR'],
  ['malformed JSON', (h) => h.raw('{'), 'MESSAGE_JSON'],
  ['binary', (h) => h.raw(new Uint8Array(2)), 'MESSAGE_SIZE_OR_TYPE'],
  ['byte overflow', (h) => h.raw('é'.repeat(32_769)), 'MESSAGE_SIZE_OR_TYPE'],
  ['ambiguous reply', (h, c) => h.raw(JSON.stringify({ id: c.id, result: {}, error: {} })), 'RESPONSE_CORRELATION'],
  ['event buffer', (h) => { for (let i = 0; i < 65; i++) h.event('Target.targetCreated',
    { targetInfo: { ...FOREIGN_INFO, targetId: `foreign-${i}` } }) }, 'TARGET_BUFFER_LIMIT'],
  ['event limit', (h) => { for (let i = 0; i < 129; i++) h.event('Page.unrelated', {}) }, 'EVENT_LIMIT'],
]) {
  test(`bounded protocol handling: ${name}`, async () => {
    const h = harness({ intercept(command, h) {
      if (command.method !== 'Browser.getVersion') return false
      inject(h, command); return true
    } })
    h.start()
    const report = await h.settle()
    assert.ok(report.errors.includes(code), JSON.stringify(report))
    assert.notEqual(report.status, 'PASS')
    assert.ok(!JSON.stringify(report).includes('SECRET_EXCEPTION'))
    bounded(h)
  })
}

for (const [name, method] of [['connection', null], ['binding', 'Target.setDiscoverTargets'],
  ['context', 'Target.createBrowserContext'], ['document', 'Page.getFrameTree']]) {
  for (const offset of [-1, 0, 1]) {
    test(`${name} full confirmation at deadline ${offset}`, async () => {
      let held
      const h = harness({ open: method !== null, intercept(command) {
        if (command.method === method) { held = command; return true }
      } })
      h.start()
      h.setTime(5_000 + offset)
      if (method === null) h.socket.open()
      else h.defaults(held)
      h.flush()
      const report = await h.settle()
      if (offset < 0) assert.equal(report.status, 'PASS', JSON.stringify(report))
      else {
        assert.notEqual(report.status, 'PASS')
        assert.equal(report.t0, 5_000)
        assert.ok(report.errors.includes('SETUP_DEADLINE'))
      }
      bounded(h)
    })
  }
}

test('intermediate answers do not reset a stage deadline', async () => {
  let version, inventory
  const h = harness({ intercept(command) {
    if (command.method === 'Browser.getVersion') { version = command; return true }
    if (command.method === 'Target.getBrowserContexts') { inventory = command; return true }
  } })
  h.start(); h.setTime(4_999); h.defaults(version); h.flush()
  h.setTime(5_000); h.defaults(inventory); h.flush()
  const report = await h.settle()
  assert.equal(report.t0, 5_000)
  assert.equal(count(h, 'Target.createBrowserContext'), 0)
})

test('four separate setup budgets; cleanup clock starts at document binding', async () => {
  const held = []
  const h = harness({ open: false, close: 'missing', intercept(command) {
    if (['Target.setDiscoverTargets', 'Target.createBrowserContext', 'Page.getFrameTree'].includes(command.method)) {
      held.push(command); return true
    }
  } })
  h.start(); h.setTime(4_999); h.socket.open(); h.flush()
  h.setTime(9_998); h.defaults(held.shift()); h.flush()
  h.setTime(14_997); h.defaults(held.shift()); h.flush()
  h.setTime(19_996); h.defaults(held.shift()); h.flush()
  h.setTime(104_995); h.socket.closed(); h.flush()
  const report = await h.result
  assert.equal(report.t0, 19_996)
  assert.equal(report.status, 'PASS', JSON.stringify(report))
  assert.ok(report.finishedAt > 90_000)
  bounded(h)
})

test('late timer dispatch preserves original t0 and all overdue judgments', async () => {
  const h = harness({ open: false, close: 'missing' })
  h.start(); h.advance(100_000)
  const report = await h.result
  assert.equal(report.t0, 5_000)
  assert.ok(report.errors.includes('REPORT_DEADLINE'))
  assert.equal(report.resourceStatus, 'UNPROVEN')
  bounded(h)
})

test('missing creation id remains possible; inventory cannot grant ownership', async () => {
  const h = harness({ intercept(command) { return command.method === 'Target.createBrowserContext' } })
  h.start(); h.advance(5_000)
  const report = await h.settle()
  assert.equal(resource(report, 'context'), 'possible')
  assert.equal(count(h, 'Target.disposeBrowserContext'), 0)
  assert.equal(count(h, 'Target.createTarget'), 0)
  assert.equal(report.resourceStatus, 'UNPROVEN')
  bounded(h)
})

test('late own creation reply permits disposal only, never a target or upgrade', async () => {
  let held
  const h = harness({ intercept(command) {
    if (command.method === 'Target.createBrowserContext') { held = command; return true }
  } })
  h.start(); h.advance(5_000); h.setTime(5_001); h.defaults(held); h.flush()
  const report = await h.result
  assert.equal(report.t0, 5_000)
  assert.equal(report.resourceStatus, 'UNPROVEN')
  assert.equal(report.contextReturned, true)
  assert.equal(count(h, 'Target.createTarget'), 0)
  assert.equal(count(h, 'Target.disposeBrowserContext'), 1)
  assert.equal(h.gate.blocked, true)
  bounded(h)
})

for (const point of ['before', 'connection', 'context', 'document']) {
  test(`operator abort at ${point} creates no replacement`, async () => {
    const method = point === 'context' ? 'Target.createBrowserContext' : 'Page.getFrameTree'
    const h = harness({ open: point !== 'connection', intercept(command) {
      return (point === 'context' || point === 'document') && command.method === method
    } })
    if (point === 'before') h.signal.aborted = true
    h.start()
    if (point !== 'before') h.signal.abort()
    const report = await h.settle()
    assert.ok(report.errors.includes('OPERATOR_ABORT'))
    assert.notEqual(report.status, 'PASS')
    if (point === 'before') assert.equal(h.socketsCreated, 0)
    else bounded(h)
  })
}

for (const missing of ['disposal', 'recheck', 'target', 'session']) {
  test(`return requires every proof: missing ${missing}`, async () => {
    const h = harness({ intercept(command, h) {
      if (command.method === 'Target.disposeBrowserContext') {
        if (missing !== 'target') h.event('Target.targetDestroyed', { targetId: 'target-own' })
        if (missing !== 'session') h.event('Target.detachedFromTarget', { sessionId: 'session-own' })
        if (missing !== 'disposal') h.answer(command, {})
        return true
      }
      return missing === 'recheck' && command.method === 'Target.getBrowserContexts' &&
        h.sent.some((entry) => entry.method === 'Target.disposeBrowserContext')
    } })
    h.start()
    const report = await h.settle()
    assert.equal(report.resourceStatus, 'UNPROVEN')
    assert.equal(report.contextReturned, false)
    assert.equal(h.gate.blocked, true)
    bounded(h)
  })
}

test('confirmed remaining context is FAIL, despite disposal and target end', async () => {
  const h = harness({ intercept(command, h) {
    if (command.method === 'Target.getBrowserContexts' && count(h, 'Target.disposeBrowserContext')) {
      h.answer(command, { browserContextIds: ['context-foreign', 'context-own'] }); return true
    }
  } })
  h.start()
  const report = await h.settle()
  assert.equal(report.resourceStatus, 'FAIL')
  assert.ok(report.errors.includes('CONTEXT_REMAINS'))
  bounded(h)
})

for (const offset of [-1, 0, 1]) {
  test(`context return at t0+30s ${offset}`, async () => {
    let held
    const h = harness({ intercept(command, h) {
      if (command.method === 'Target.getBrowserContexts' && count(h, 'Target.disposeBrowserContext')) {
        held = command; return true
      }
    } })
    h.start(); h.setTime(30_000 + offset); h.defaults(held); h.flush()
    const report = await h.result
    assert.equal(report.resourceStatus, offset < 0 ? 'PASS' : 'UNPROVEN')
    bounded(h)
  })
  test(`connection close at t0+85s ${offset}`, async () => {
    const h = harness({ close: 'missing' })
    h.start(); h.setTime(85_000 + offset); h.socket.closed(); h.flush()
    const report = await h.result
    assert.equal(report.resourceStatus, offset < 0 ? 'PASS' : 'UNPROVEN')
    bounded(h)
  })
  test(`evidence save at t0+10s ${offset}`, async () => {
    const h = harness({ save(snapshot, h) { h.setTime(snapshot.t0 + 10_000 + offset); return true } })
    const report = await h.start()
    assert.equal(report.evidenceSaved, offset < 0)
    assert.equal(report.status, offset < 0 ? 'PASS' : 'UNPROVEN')
    assert.equal(h.gate.blocked, offset >= 0)
    bounded(h)
  })
}

for (const close of ['missing', 'open']) {
  test(`missing connection end (${close}) is bounded and blocks owner`, async () => {
    const h = harness({ close })
    h.start()
    const report = await h.settle()
    assert.equal(report.resourceStatus, close === 'open' ? 'FAIL' : 'UNPROVEN')
    assert.equal(report.connectionClosed, false)
    assert.equal(h.gate.blocked, true)
    bounded(h)
    const snapshot = JSON.stringify(report)
    h.socket.closed()
    assert.equal(JSON.stringify(report), snapshot)
  })
}

test('connection loss never reuses ids or attempts another connection', async () => {
  const h = harness({ intercept(command, h) {
    if (command.method === 'Target.createTarget') { h.socket.closed(); return true }
  } })
  const report = await h.start()
  assert.equal(report.resourceStatus, 'UNPROVEN')
  assert.equal(count(h, 'Target.disposeBrowserContext'), 0)
  assert.equal(h.socketsCreated, 1)
  assert.equal(resource(report, 'target'), 'possible')
  assert.equal(h.socket.count(), 0)
})

test('external service binding loss prevents even cleanup commands using old ids', async () => {
  const gate = owner()
  let valid = true
  const original = gate.isCurrent
  gate.isCurrent = (lease) => valid && original(lease)
  const h = harness({ gate, intercept(command, h) {
    if (command.method === 'Target.createTarget') { valid = false; h.defaults(command); return true }
  } })
  const report = await h.start()
  assert.equal(count(h, 'Target.disposeBrowserContext'), 0)
  assert.equal(report.resourceStatus, 'UNPROVEN')
  bounded(h)
})

test('foreign destruction, detach and Page events cannot satisfy own proofs', async () => {
  const h = harness({ intercept(command, h) {
    if (command.method === 'Target.disposeBrowserContext') {
      h.event('Target.targetDestroyed', { targetId: 'target-foreign' })
      h.event('Target.detachedFromTarget', { sessionId: 'session-foreign' })
      h.event('Page.frameNavigated', { frame: FRAME }, 'session-foreign')
      h.answer(command, {}); return true
    }
  } })
  h.start()
  const report = await h.settle()
  assert.equal(report.contextReturned, false)
  assert.equal(report.resourceStatus, 'UNPROVEN')
  bounded(h)
})

test('throwing evidence sink is redacted and does not prevent normal cleanup', async () => {
  const h = harness({ save() { throw new Error('SECRET_EXCEPTION') } })
  const report = await h.start()
  assert.equal(report.status, 'UNPROVEN')
  assert.equal(report.contextReturned, true)
  assert.equal(report.resourceStatus, 'UNPROVEN')
  assert.equal(h.gate.blocked, true)
  assert.ok(!JSON.stringify(report).includes('SECRET_EXCEPTION'))
  bounded(h)
})

for (const offset of [-1, 0, 1]) {
  test(`final report and owner handoff at t0+90s ${offset}`, async () => {
    const gate = owner()
    const complete = gate.complete
    let h
    gate.complete = (lease, report) => {
      const acknowledged = complete(lease, report)
      h.setTime(report.t0 + 90_000 + offset)
      return acknowledged
    }
    h = harness({ gate })
    const report = await h.start()
    assert.equal(report.resourceStatus, offset < 0 ? 'PASS' : 'UNPROVEN')
    assert.equal(gate.blocked, offset >= 0)
    assert.equal(report.gateAcknowledged, true)
    assert.equal(report.errors.includes('REPORT_DEADLINE'), offset >= 0)
    bounded(h)
  })
}

test('timer cancellation failure keeps possible timer in ledger and cannot pass', async () => {
  const h = harness({ open: false })
  h.dependencies.cancel = () => { throw new Error('SECRET_TIMER') }
  h.start()
  h.socket.open(); h.flush()
  const report = await h.result
  assert.equal(report.resourceStatus, 'UNPROVEN')
  assert.equal(resource(report, 'timer'), 'possible')
  assert.ok(report.errors.includes('TIMER_CANCEL_FAILED'))
  assert.equal(h.gate.blocked, true)
  const before = JSON.stringify(report)
  h.advance(100_000)
  assert.equal(JSON.stringify(report), before)
  assert.ok(!before.includes('SECRET_TIMER'))
})

test('failed registration removal stays visible and blocks', async () => {
  const h = harness({ open: false })
  h.start()
  h.socket.removeEventListener = () => { throw new Error('SECRET_REGISTRATION') }
  h.socket.open(); h.flush()
  const report = await h.result
  assert.equal(report.resourceStatus, 'UNPROVEN')
  assert.equal(resource(report, 'registrations'), 'possible')
  assert.ok(h.socket.count() > 0)
  assert.equal(h.gate.blocked, true)
  assert.ok(!JSON.stringify(report).includes('SECRET_REGISTRATION'))
})

for (const dependency of ['now', 'schedule', 'createWebSocket']) {
  test(`throwing ${dependency} is bounded, redacted and fail-closed`, async () => {
    const h = harness()
    h.dependencies[dependency] = () => { throw new Error('SECRET_DEPENDENCY') }
    const report = await h.start()
    assert.equal(report.resourceStatus, 'UNPROVEN')
    assert.equal(h.gate.blocked, true)
    assert.ok(!JSON.stringify(report).includes('SECRET_DEPENDENCY'))
    assert.equal(count(h, 'Target.createBrowserContext'), 0)
  })
}

test('nonmonotone clock cannot create a time proof', async () => {
  const h = harness({ open: false })
  h.setTime(100); h.start(); h.setTime(99); h.socket.open(); h.flush()
  const report = await h.result
  assert.equal(report.resourceStatus, 'UNPROVEN')
  assert.equal(count(h, 'Target.createBrowserContext'), 0)
})

test('socket binding mismatch never sends a CDP command', async () => {
  const h = harness({ open: false })
  h.start(); h.socket.url = 'ws://127.0.0.1:9222/devtools/browser/wrong'
  h.socket.open(); h.flush()
  const report = await h.result
  assert.equal(report.status, 'FAIL')
  assert.equal(h.sent.length, 0)
  bounded(h)
})

test('missing target id retains target and document despite context absence', async () => {
  const h = harness({ intercept(command, h) {
    if (command.method === 'Target.createTarget') {
      h.event('Target.targetCreated', { targetInfo: OWN_INFO }); return true
    }
  } })
  h.start()
  const report = await h.settle()
  assert.equal(resource(report, 'target'), 'possible')
  assert.equal(resource(report, 'document'), 'possible')
  assert.equal(report.contextReturned, false)
  assert.equal(count(h, 'Target.disposeBrowserContext'), 1)
  assert.equal(report.resourceStatus, 'UNPROVEN')
  bounded(h)
})

test('missing creation event cannot be replaced by target-info response', async () => {
  const h = harness({ intercept(command, h) {
    if (command.method === 'Target.createTarget') { h.answer(command, { targetId: 'target-own' }); return true }
  } })
  h.start()
  const report = await h.settle()
  assert.equal(report.documentBound, false)
  assert.equal(count(h, 'Target.getTargetInfo'), 0)
  assert.equal(report.resourceStatus, 'UNPROVEN')
  bounded(h)
})

test('wrong attachment session cannot be used as own session', async () => {
  const h = harness({ intercept(command, h) {
    if (command.method === 'Target.attachToTarget') {
      h.event('Target.attachedToTarget', { sessionId: 'wrong-session', targetInfo: OWN_INFO })
      h.answer(command, { sessionId: 'session-own' }); return true
    }
  } })
  h.start()
  const report = await h.settle()
  assert.equal(count(h, 'Page.enable'), 0)
  assert.equal(report.resourceStatus, 'UNPROVEN')
  bounded(h)
})

test('known target changing context before disposal cannot pass', async () => {
  const h = harness({ intercept(command, h) {
    if (command.method === 'Target.disposeBrowserContext') {
      h.event('Target.targetInfoChanged', { targetInfo: { ...OWN_INFO, browserContextId: 'wrong-context' } })
      h.defaults(command); return true
    }
  } })
  const report = await h.start()
  assert.equal(report.status, 'FAIL')
  assert.ok(report.errors.includes('TARGET_BINDING'))
  bounded(h)
})

test('own root navigation during return latches a generation failure', async () => {
  const h = harness({ intercept(command, h) {
    if (command.method === 'Target.disposeBrowserContext') {
      h.event('Page.frameNavigated', { frame: { ...FRAME, loaderId: 'new-loader' } }, 'session-own')
      h.defaults(command); return true
    }
  } })
  const report = await h.start()
  assert.equal(report.status, 'FAIL')
  assert.ok(report.errors.includes('DOCUMENT_GENERATION'))
  bounded(h)
})

test('exact 64-entry event inventory is accepted; foreign targets remain untouched', async () => {
  const h = harness({ intercept(command, h) {
    if (command.method === 'Target.setDiscoverTargets') {
      for (let i = 0; i < 63; i++) h.event('Target.targetCreated', { targetInfo: { ...FOREIGN_INFO, targetId: `foreign-${i}` } })
      h.answer(command, {}); return true
    }
  } })
  assert.equal((await h.start()).status, 'PASS')
  bounded(h)
})

test('outer completion failure is delivered as a blocking uncertainty', async () => {
  const gate = owner()
  gate.complete = () => { throw new Error('SECRET_OWNER') }
  const h = harness({ gate })
  const report = await h.start()
  assert.equal(report.resourceStatus, 'UNPROVEN')
  assert.ok(report.errors.includes('GATE_COMPLETE_UNCONFIRMED'))
  assert.equal(report.gateAcknowledged, false)
  assert.equal(gate.blocked, true)
  bounded(h)
})

test('detach with contradictory target cannot prove session end', async () => {
  const h = harness({ intercept(command, h) {
    if (command.method === 'Target.disposeBrowserContext') {
      h.event('Target.targetDestroyed', { targetId: 'target-own' })
      h.event('Target.detachedFromTarget', { sessionId: 'session-own', targetId: 'target-foreign' })
      h.answer(command, {}); return true
    }
  } })
  h.start()
  const report = await h.settle()
  assert.equal(report.contextReturned, false)
  assert.ok(report.errors.includes('DETACH_TARGET_BINDING'))
  bounded(h)
})

test('document end before frame-tree response cannot establish a live generation', async () => {
  const h = harness({ intercept(command, h) {
    if (command.method === 'Page.getFrameTree') {
      h.event('Page.frameDetached', { frameId: 'frame-own', reason: 'remove' }, 'session-own')
      h.defaults(command); return true
    }
  } })
  const report = await h.start()
  assert.equal(report.documentBound, false)
  assert.ok(report.errors.includes('EARLY_DOCUMENT_END'))
  bounded(h)
})

test('no new creation after deadline consumed inside external binding check', async () => {
  const gate = owner()
  const isCurrent = gate.isCurrent
  let expire = false, h
  gate.isCurrent = (lease) => {
    if (expire) { h.setTime(5_000); expire = false }
    return isCurrent(lease)
  }
  h = harness({ gate, intercept(command, h) {
    if (command.method === 'Target.setDiscoverTargets') {
      expire = true
      h.defaults(command); return true
    }
  } })
  h.start()
  const report = await h.settle()
  assert.equal(report.t0, 5_000)
  assert.equal(count(h, 'Target.createBrowserContext'), 0)
})

for (const cleanup of ['timer', 'listener']) {
  for (const offset of [-1, 0, 1]) {
    test(`B1: successful ${cleanup} cleanup finishes at control deadline ${offset}`, async () => {
      const h = harness({ close: 'missing' })
      let finishing = false
      const cancel = h.dependencies.cancel
      h.dependencies.cancel = (handle) => {
        cancel(handle)
        if (cleanup === 'timer' && finishing) h.setTime(85_000 + offset)
      }
      h.start()
      h.setTime(84_998)
      finishing = true
      const remove = h.socket.removeEventListener.bind(h.socket)
      if (cleanup === 'listener') h.socket.removeEventListener = (name, callback) => {
        remove(name, callback)
        h.setTime(85_000 + offset)
      }
      h.socket.closed(); h.flush()
      const report = await h.result
      assert.equal(report.t0, 0)
      assert.ok(report.resources.every((entry) => entry.state === 'closed'))
      assert.equal(report.finishedAt, 85_000 + offset)
      assert.equal(report.resourceStatus, offset < 0 ? 'PASS' : 'UNPROVEN')
      assert.equal(report.status, offset < 0 ? 'PASS' : 'UNPROVEN')
      assert.equal(report.errors.includes('CONTROL_DEADLINE'), offset >= 0)
      assert.equal(h.gate.blocked, offset >= 0)
      const snapshot = JSON.stringify(report)
      h.setTime(100_000); h.socket.closed(); h.signal.abort()
      assert.equal(JSON.stringify(report), snapshot)
      bounded(h)
    })
  }
}

for (const offset of [-1, 0, 1]) {
  test(`B2: first connection gate returns at setup deadline ${offset}`, async () => {
    const gate = owner(), isCurrent = gate.isCurrent
    let checks = 0, h
    gate.isCurrent = (lease) => {
      if (++checks === 2) h.setTime(5_000 + offset)
      return isCurrent(lease)
    }
    h = harness({ gate, open: false })
    h.start()
    if (offset < 0) { h.socket.open(); h.flush() }
    const report = await h.settle()
    assert.equal(h.socketsCreated, offset < 0 ? 1 : 0)
    if (offset < 0) {
      assert.equal(h.effects.find((entry) => entry.type === 'socket').at, 4_999)
      assert.equal(report.status, 'PASS')
      bounded(h)
    } else {
      assert.equal(report.t0, 5_000)
      assert.equal(report.resourceStatus, 'UNPROVEN')
      assert.ok(report.errors.includes('SETUP_DEADLINE'))
      assert.equal(resource(report, 'connection'), 'notAttempted')
      assert.equal(resource(report, 'registrations'), 'closed')
      assert.equal(h.saved.length, 1)
      assert.equal(h.sent.length, 0)
      assert.equal(h.signal.count(), 0)
      assert.equal(h.timers.size, 0)
    }
  })
}

for (const consistent of [false, true]) {
  test(`B3: two early frame generations remain ${consistent ? 'consistent' : 'contradictory'}`, async () => {
    const second = { ...FRAME, loaderId: consistent ? FRAME.loaderId : 'second-loader' }
    let earlyFrames = 0
    const h = harness({ intercept(command, h) {
      if (command.method === 'Page.enable') {
        h.event('Page.frameNavigated', { frame: FRAME }, 'session-own'); ++earlyFrames
        h.answer(command, {}); return true
      }
      if (command.method === 'Page.getFrameTree') {
        h.event('Page.frameNavigated', { frame: second }, 'session-own'); ++earlyFrames
        h.answer(command, { frameTree: { frame: second } }); return true
      }
    } })
    const report = await h.start()
    assert.equal(earlyFrames, 2)
    assert.equal(count(h, 'Page.getFrameTree'), 1)
    assert.equal(report.status, consistent ? 'PASS' : 'FAIL')
    assert.equal(report.errors.includes('DOCUMENT_GENERATION'), !consistent)
    assert.equal(report.documentBound, consistent)
    assert.equal(report.contextReturned, true)
    bounded(h)
  })
}

for (const phase of ['binding', 'document']) {
  test(`B4: successful timer cancellation starts ${phase} cleanup immediately`, async () => {
    let expire = false, cancellations = 0
    const h = harness({ open: false, intercept(command) {
      return command.method === (phase === 'binding' ? 'Browser.getVersion' : 'Page.getFrameTree')
    } })
    const cancel = h.dependencies.cancel
    h.dependencies.cancel = (handle) => {
      cancel(handle)
      if (expire) { expire = false; ++cancellations; h.setTime(5_000) }
    }
    h.start()
    if (phase === 'binding') { expire = true; h.socket.open() }
    else {
      h.socket.open(); h.flush(); expire = true
      h.event('Page.unrelated', {})
    }
    // No further browser event, timer advance, or flush may initiate the cleanup.
    assert.equal(cancellations, 1)
    assert.equal(h.time, 5_000)
    assert.equal(h.saved.length, 1, 'evidence starts in the timer-change dispatch')
    assert.equal(h.saved[0].t0, 5_000)
    if (phase === 'binding') assert.equal(h.socket.closeCalls, 1)
    else assert.equal(count(h, 'Target.disposeBrowserContext'), 1)
    h.flush()
    const report = await h.result
    assert.equal(report.t0, 5_000)
    assert.equal(report.finishedAt, 5_000)
    assert.equal(report.evidenceSaved, true)
    assert.equal(report.errors.includes('EVIDENCE_DEADLINE'), false)
    assert.equal(report.resourceStatus, 'UNPROVEN')
    assert.equal(report.contextReturned, phase === 'document')
    bounded(h)
  })
}

test('B5: failed listener removal survives clock failure and repeated finalization', async () => {
  const h = harness({ open: false })
  const now = h.dependencies.now
  let clockFails = false, clockFailures = 0, removals = 0
  h.dependencies.now = () => {
    if (clockFails) { ++clockFailures; throw new Error('SECRET_CLOCK_AFTER_REMOVAL') }
    return now()
  }
  h.start()
  h.socket.removeEventListener = () => {
    ++removals; clockFails = true
    throw new Error('SECRET_REGISTRATION_REMAINS')
  }
  h.socket.open(); h.flush()
  const report = await h.result
  assert.equal(clockFailures, 1)
  assert.equal(removals, 4, 'each registration removal is attempted only once')
  assert.equal(h.socket.count(), 4)
  assert.equal(resource(report, 'registrations'), 'possible')
  assert.equal(resource(report, 'timer'), 'closed')
  assert.ok(report.resources.filter((entry) => entry.name !== 'registrations')
    .every((entry) => entry.state === 'closed'))
  assert.equal(report.resourceStatus, 'UNPROVEN')
  assert.ok(report.errors.includes('LISTENER_REMOVE_FAILED'))
  assert.ok(report.errors.includes('CONTROL_DEPENDENCY_FAILED'))
  assert.equal(h.gate.calls.filter((entry) => entry.complete).length, 1)
  assert.equal(h.gate.blocked, true)
  assert.equal(h.socket.closeCalls, 1)
  assert.equal(h.signal.count(), 0)
  assert.equal(h.timers.size, 0)
  const snapshot = JSON.stringify(report), effects = h.effects.length
  clockFails = false
  h.socket.closed(); h.raw('{'); h.advance(100_000)
  assert.equal(JSON.stringify(report), snapshot)
  assert.equal(h.effects.length, effects)
  assert.equal(removals, 4)
  assert.ok(!snapshot.includes('SECRET_'))
})

test('gaps: throwing acquire denies admission without any resource effect', async () => {
  const gate = owner()
  let attempts = 0
  gate.acquire = () => { ++attempts; throw new Error('SECRET_ACQUIRE') }
  const h = harness({ gate })
  const report = await h.start()
  assert.equal(attempts, 1)
  assert.equal(report.status, 'NOT_RUN')
  assert.equal(report.resourceStatus, 'NOT_RUN')
  assert.equal(report.t0, null)
  assert.deepEqual(report.errors, ['START_GATE'])
  assert.deepEqual(report.resources, [])
  assert.deepEqual(h.effects, [])
  assert.deepEqual(gate.calls, [])
  assert.equal(h.socketsCreated, 0)
  assert.equal(h.signal.count(), 0)
  assert.equal(h.timers.size, 0)
  assert.ok(!JSON.stringify(report).includes('SECRET_'))
})

for (const failureAt of [1, 2, 3]) {
  test(`gaps: throwing isCurrent check ${failureAt} preserves the resource boundary`, async () => {
    const gate = owner(), isCurrent = gate.isCurrent
    let checks = 0
    gate.isCurrent = (lease) => {
      if (++checks === failureAt) throw new Error('SECRET_CURRENT')
      return isCurrent(lease)
    }
    const h = harness({ gate })
    const report = await h.start()
    assert.equal(checks, failureAt)
    assert.equal(report.status, 'UNPROVEN')
    assert.equal(report.resourceStatus, 'UNPROVEN')
    assert.ok(report.errors.includes('SERVICE_BINDING_LOST'))
    assert.equal(report.gateBlocked, true)
    assert.equal(report.gateAcknowledged, true)
    assert.equal(gate.blocked, true)
    assert.equal(h.socketsCreated, failureAt === 3 ? 1 : 0)
    assert.equal(h.sent.length, 0)
    assert.equal(resource(report, 'context'), 'notAttempted')
    assert.equal(resource(report, 'connection'), failureAt === 3 ? 'closed' : 'notAttempted')
    assert.equal(resource(report, 'registrations'), failureAt === 1 ? 'notAttempted' : 'closed')
    assert.equal(h.saved.length, 1)
    assert.equal(h.signal.count(), 0)
    assert.equal(h.timers.size, 0)
    assert.equal(gate.calls.filter((entry) => entry.complete).length, 1)
    assert.ok(!JSON.stringify(report).includes('SECRET_'))
    if (failureAt === 3) bounded(h)
  })
}

const unconfirmedHooks = [
  ['false', () => false], ['undefined', () => undefined], ['null', () => null],
  ['truthy number', () => 1], ['truthy string', () => 'true'],
  ['Promise', () => Promise.resolve(true)],
]
for (const [name, result] of [...unconfirmedHooks,
  ['throw', () => { throw new Error('SECRET_BLOCK') }]]) {
  test(`gaps: block ${name} is an attempt, never a confirmed external block`, async () => {
    const gate = owner()
    let attempts = 0, completions = 0
    gate.block = (lease, finding) => {
      ++attempts
      assert.equal(lease.runId, 'run-synthetic')
      assert.equal(finding.resourceStatus, 'UNPROVEN')
      return result()
    }
    // A completion receipt cannot substitute for the failed external block.
    gate.complete = () => { ++completions; return true }
    const h = harness({ gate, open: false })
    h.start(); h.advance(5_000)
    const report = await h.result
    assert.ok(attempts > 0)
    assert.equal(completions, 1)
    assert.equal(gate.blocked, false)
    assert.equal(report.resourceStatus, 'UNPROVEN')
    assert.equal(report.status, 'UNPROVEN')
    assert.equal(report.gateBlocked, false)
    assert.equal(report.gateAcknowledged, false)
    assert.ok(report.errors.includes('GATE_BLOCK_UNCONFIRMED'))
    assert.ok(report.errors.includes('SETUP_DEADLINE'))
    assert.equal(report.t0, 5_000)
    assert.equal(report.finishedAt, 5_000)
    assert.equal(resource(report, 'connection'), 'closed')
    assert.equal(resource(report, 'context'), 'notAttempted')
    assert.equal(resource(report, 'registrations'), 'closed')
    assert.equal(resource(report, 'timer'), 'closed')
    assert.equal(h.sent.length, 0)
    assert.equal(h.saved.length, 1)
    const snapshot = JSON.stringify(report)
    await Promise.resolve()
    assert.equal(JSON.stringify(report), snapshot)
    assert.ok(!snapshot.includes('SECRET_'))
    bounded(h)
  })
}

for (const [name, result] of unconfirmedHooks) {
  test(`gaps: complete ${name} cannot confirm the synchronous handoff`, async () => {
    const gate = owner()
    let attempts = 0
    gate.complete = () => { ++attempts; return result() }
    const h = harness({ gate })
    const report = await h.start()
    assert.equal(attempts, 1)
    assert.equal(report.resourceStatus, 'UNPROVEN')
    assert.equal(report.status, 'UNPROVEN')
    assert.equal(report.gateAcknowledged, false)
    assert.equal(report.gateBlocked, true)
    assert.equal(gate.blocked, true)
    assert.ok(report.errors.includes('GATE_COMPLETE_UNCONFIRMED'))
    assert.ok(report.resources.every((entry) => entry.state === 'closed'))
    assert.equal(report.contextReturned, true)
    assert.equal(report.evidenceSaved, true)
    assert.equal(h.saved.length, 1)
    const snapshot = JSON.stringify(report)
    await Promise.resolve()
    h.socket.closed(); h.signal.abort()
    assert.equal(JSON.stringify(report), snapshot)
    assert.ok(!snapshot.includes('SECRET_'))
    bounded(h)
  })
}

for (const limit of [512, 513]) {
  test(`gaps: message ${limit} tests the total counter before payload evaluation`, async () => {
    const h = harness({ close: 'missing', intercept(command) {
      return command.method === 'Page.getFrameTree'
    } })
    const raw = h.raw
    let received = 0, payloadReads = 0
    h.raw = (data) => { ++received; raw(data) }
    h.start()
    assert.ok(received > 0 && received < 511, 'count includes every setup response and event')
    // Correlation failures keep the connection observable; they consume no event slots.
    // Do not flush pending disposal replies: they would add uncounted messages here.
    while (received < 511) h.raw('{"id":999999,"result":{}}')
    const probe = { get data() { ++payloadReads; return '{"id":999999,"result":{}}' } }
    ++received; h.socket.emit('message', probe)
    assert.equal(received, 512)
    assert.equal(payloadReads, 1, 'message 512 still reaches payload evaluation')
    if (limit === 513) {
      ++received; h.socket.emit('message', probe)
      assert.equal(received, 513)
      assert.equal(payloadReads, 1, 'message 513 is rejected before reading data')
      const sentBefore = h.sent.length
      h.socket.emit('message', probe)
      assert.equal(payloadReads, 1, 'later messages cannot resume evaluation')
      assert.equal(h.sent.length, sentBefore)
    }
    h.socket.closed()
    const report = await h.result
    assert.ok(report.errors.includes('RESPONSE_CORRELATION'))
    assert.equal(report.status, 'FAIL', 'the earlier protocol fault is not a PASS at 512')
    assert.equal(report.errors.includes('MESSAGE_LIMIT'), limit === 513)
    assert.equal(report.errors.includes('EVENT_LIMIT'), false)
    assert.equal(report.errors.includes('MESSAGE_JSON'), false)
    assert.equal(report.contextReturned, false)
    assert.equal(resource(report, 'context'), 'confirmed')
    assert.equal(resource(report, 'document'), 'possible')
    assert.equal(resource(report, 'connection'), 'closed')
    assert.equal(resource(report, 'registrations'), 'closed')
    assert.equal(resource(report, 'timer'), 'closed')
    assert.equal(h.socketsCreated, 1)
    assert.equal(count(h, 'Target.disposeBrowserContext'), 1)
    assert.equal(h.socket.count(), 0)
    assert.equal(h.signal.count(), 0)
    assert.equal(h.timers.size, 0)
    const snapshot = JSON.stringify(report)
    h.flush()
    assert.equal(JSON.stringify(report), snapshot)
    assert.equal(h.socketsCreated, 1)
  })
}
