import assert from 'node:assert/strict'
import test from 'node:test'
import { createNodeCdpStartGateOwner } from '../scripts/browser/nodeCdpStartGateOwner.js'
import { createNodeCdpContextControl } from '../scripts/browser/nodeCdpContextControl.js'

const binding = () => ({ serviceId: 'synthetic-service',
  webSocketUrl: 'ws://127.0.0.1:9222/devtools/browser/synthetic-browser',
  version: { protocolVersion: '1.3', product: 'Synthetic/1', revision: 'rev-1',
    userAgent: 'Synthetic', jsVersion: '1' } })
const names = ['connection', 'context', 'target', 'session', 'document', 'registrations', 'timer']
const finding = (lease, resourceStatus = 'UNPROVEN') => ({ runId: lease.runId, resourceStatus, code: 'SYNTHETIC_RESOURCE' })
const report = (lease, resourceStatus = 'PASS') => ({ runId: lease.runId, serviceId: lease.serviceId,
  status: resourceStatus, resourceStatus, evidenceSaved: true, contextReturned: true,
  connectionClosed: true, gateBlocked: resourceStatus !== 'PASS', gateAcknowledged: true,
  resources: names.map((name) => ({ name, state: 'closed' })), runtimeRecord: null })

function fixture() {
  const requested = binding()
  const session = { status: 'CONFIRMED', sessionId: 'operator-1', generation: 'session-generation-1',
    exclusive: true, continuity: 'CONFIRMED' }
  const service = { status: 'CONFIRMED', sessionId: session.sessionId, sessionGeneration: session.generation,
    generation: 'service-generation-1', binding: binding() }
  const permission = { sessionId: session.sessionId, sessionGeneration: session.generation,
    serviceId: requested.serviceId, serviceGeneration: service.generation, startAllowed: true, externalBlock: 'CLEAR' }
  const calls = []
  const ports = {
    readSession() { calls.push('session'); return session },
    readPermission() { calls.push('permission'); return permission },
    readService() { calls.push('service'); return service },
  }
  const gate = createNodeCdpStartGateOwner(ports)
  return { requested, session, service, permission, calls, ports, gate,
    acquire: (runId = 'run-1') => gate.acquire(requested, runId) }
}

test('fresh import and factory do not invoke dependencies, getters or platform effects', async () => {
  const globals = ['WebSocket', 'fetch', 'setTimeout', 'setInterval']
  const descriptors = globals.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)])
  try {
    for (const key of globals) Object.defineProperty(globalThis, key,
      { configurable: true, value: () => assert.fail(`Unexpected ${key}`) })
    const module = await import('../scripts/browser/nodeCdpStartGateOwner.js?inactivity')
    assert.deepEqual(Object.keys(module), ['createNodeCdpStartGateOwner'])
    const options = new Proxy({}, { get() { assert.fail('factory get') },
      getPrototypeOf() { assert.fail('factory reflection') } })
    const gate = module.createNodeCdpStartGateOwner(options)
    assert.deepEqual(Object.keys(gate), ['acquire', 'isCurrent', 'block', 'complete'])
    assert.ok(Object.isFrozen(gate))
    const f = fixture()
    assert.deepEqual(f.calls, [])
  } finally {
    for (const [key, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else delete globalThis[key]
    }
  }
})

test('explicit admission, defensive binding and normal release without modifying foreign objects', () => {
  const f = fixture()
  const before = structuredClone([f.requested, f.session, f.service, f.permission])
  const lease = f.acquire()
  assert.deepEqual(lease, { status: 'ACQUIRED', serviceId: f.requested.serviceId,
    webSocketUrl: f.requested.webSocketUrl, runId: 'run-1' })
  assert.ok(Object.isFrozen(lease))
  assert.equal(f.gate.isCurrent(lease), true)
  const result = report(lease)
  const resultBefore = structuredClone(result)
  assert.equal(f.gate.complete(lease, result), true)
  assert.deepEqual([f.requested, f.session, f.service, f.permission], before)
  assert.deepEqual(result, resultBefore)
  for (const value of [f.ports, f.requested, f.requested.version, f.session, f.service,
    f.service.binding, f.service.binding.version, f.permission, result, result.resources, result.resources[0]]) {
    assert.equal(Object.isFrozen(value), false)
  }
  const next = f.acquire('run-1')
  assert.ok(next)
  assert.notEqual(next, lease)
  assert.equal(f.gate.isCurrent(lease), false)
  assert.equal(f.gate.isCurrent(next), true)
})

test('requested binding is copied, not retained as a mutable authority', () => {
  const f = fixture(), lease = f.acquire()
  f.requested.version.product = 'changed caller value'
  f.requested.serviceId = 'changed-caller'
  assert.equal(f.gate.isCurrent(lease), true)
  assert.equal(f.gate.complete(lease, report(lease)), true)
})

for (const hook of ['readSession', 'readPermission', 'readService']) {
  for (const mode of ['missing', 'throws', 'undefined', 'promise', 'thenable', 'accessor']) {
    test(`${hook}: ${mode} cannot authorize and later fulfillment cannot reserve or release`, async () => {
      const f = fixture(), original = f.ports[hook]
      let resolve, thenCalls = 0, getterCalls = 0
      const positive = original()
      if (mode === 'missing') delete f.ports[hook]
      if (mode === 'throws') f.ports[hook] = () => { throw new Error('synthetic') }
      if (mode === 'undefined') f.ports[hook] = () => undefined
      if (mode === 'promise') f.ports[hook] = () => new Promise((done) => { resolve = done })
      if (mode === 'thenable') f.ports[hook] = () => ({ ...positive, then() { thenCalls++ } })
      if (mode === 'accessor') Object.defineProperty(f.ports, hook,
        { configurable: true, get() { getterCalls++; assert.fail('dependency getter executed') } })
      assert.equal(f.acquire(), null)
      assert.equal(getterCalls, 0, 'dependency getter stays inactive on first rejection')
      resolve?.(positive)
      await Promise.resolve()
      assert.equal(thenCalls, 0)
      assert.equal(f.acquire('run-2'), null)
      assert.equal(getterCalls, 0, 'dependency getter stays inactive on repeated rejection')
      Object.defineProperty(f.ports, hook, { configurable: true, enumerable: true, writable: true, value: original })
      // An explicit corrected synchronous admission is a new attempt, not Promise adoption.
      assert.ok(f.acquire('run-3'))
      assert.equal(getterCalls, 0, 'positive readmission does not hide earlier getter calls')
    })
  }
}

for (const [label, change] of [
  ['unconfirmed session', (f) => { f.session.status = 'UNKNOWN' }],
  ['missing session generation', (f) => { delete f.session.generation }],
  ['ambiguous owner', (f) => { f.session.exclusive = false }],
  ['truthy exclusive', (f) => { f.session.exclusive = 1 }],
  ['unknown restart binding', (f) => { f.session.continuity = 'UNKNOWN' }],
  ['missing start permission', (f) => { delete f.permission.startAllowed }],
  ['truthy start permission', (f) => { f.permission.startAllowed = 'true' }],
  ['unknown external block', (f) => { f.permission.externalBlock = 'UNKNOWN' }],
  ['contradictory permission session', (f) => { f.permission.sessionId = 'operator-other' }],
  ['contradictory permission generation', (f) => { f.permission.sessionGeneration = 'session-other' }],
  ['contradictory permission service', (f) => { f.permission.serviceId = 'service-other' }],
  ['contradictory permission service generation', (f) => { f.permission.serviceGeneration = 'service-other' }],
  ['unconfirmed service', (f) => { f.service.status = 'UNKNOWN' }],
  ['missing service generation', (f) => { delete f.service.generation }],
  ['contradictory service session', (f) => { f.service.sessionId = 'operator-other' }],
  ['contradictory service session generation', (f) => { f.service.sessionGeneration = 'session-other' }],
  ['different service binding', (f) => { f.service.binding.serviceId = 'service-other' }],
  ['different service endpoint', (f) => { f.service.binding.webSocketUrl += '-other' }],
]) {
  test(`admission rejects ${label}`, () => {
    const f = fixture()
    change(f)
    assert.equal(f.acquire(), null)
    assert.ok(fixture().acquire(), 'positive independent fixture')
  })
}

for (const key of Object.keys(binding().version)) {
  test(`complete service binding includes ${key}`, () => {
    const f = fixture()
    f.service.binding.version[key] += '-changed'
    assert.equal(f.acquire(), null)
    f.requested.version[key] = f.service.binding.version[key]
    const lease = f.acquire()
    assert.ok(lease)
    f.service.binding.version[key] += '-again'
    assert.equal(f.gate.isCurrent(lease), false)
  })
}

test('missing options, inherited fields, accessors, proxies and malformed binding fail closed', () => {
  assert.equal(createNodeCdpStartGateOwner().acquire(binding(), 'run'), null)
  const f = fixture()
  const original = f.session.generation
  Object.defineProperty(f.session, 'generation', { configurable: true, get() { assert.fail('getter') } })
  assert.equal(f.acquire(), null)
  Object.defineProperty(f.session, 'generation', { configurable: true, enumerable: true, value: original })
  const inherited = Object.create(f.requested)
  assert.equal(f.gate.acquire(inherited, 'run'), null)
  assert.equal(f.gate.acquire(new Proxy({}, { getPrototypeOf() { throw new Error('synthetic') } }), 'run'), null)
  for (const url of ['ws://localhost:9222/devtools/browser/a', 'ws://127.0.0.1:0/devtools/browser/a',
    'ws://127.0.0.1:65536/devtools/browser/a', 'ws://127.0.0.1:09222/devtools/browser/a',
    'ws://127.0.0.1:9222/devtools/browser/a?']) {
    assert.equal(f.gate.acquire({ ...binding(), webSocketUrl: url }, 'run'), null)
  }
  for (const runId of [null, '', 'a'.repeat(129), 'run with spaces']) assert.equal(f.gate.acquire(binding(), runId), null)
  assert.ok(f.acquire())
})

test('one active lease rejects concurrent runs, other bindings, copies and foreign owners', () => {
  const f = fixture(), lease = f.acquire(), foreign = fixture().acquire()
  assert.equal(f.acquire('run-2'), null)
  assert.equal(f.gate.acquire({ ...binding(), serviceId: 'another-service' }, 'run-3'), null)
  for (const fake of [{ ...lease }, Object.freeze({ ...lease }), foreign, null, undefined, 1]) {
    assert.equal(f.gate.isCurrent(fake), false)
    assert.equal(f.gate.block(fake, finding(lease)), false)
    assert.equal(f.gate.complete(fake, report(lease)), false)
    assert.equal(f.gate.isCurrent(lease), true)
    assert.equal(f.acquire('next'), null)
  }
})

for (const hook of ['readSession', 'readService', 'readPermission']) {
  test(`reentrant reservation from ${hook} cannot acquire twice`, () => {
    const f = fixture(), original = f.ports[hook]
    let nested = 0
    f.ports[hook] = () => {
      nested++
      assert.equal(f.acquire('nested'), null)
      return original()
    }
    const lease = f.acquire()
    assert.ok(lease)
    assert.ok(nested > 0)
    assert.equal(f.gate.isCurrent(lease), true)
  })
}

test('reentrant input reflection cannot reserve before the outer acquire', () => {
  const f = fixture()
  const input = new Proxy(f.requested, { getPrototypeOf(target) {
    assert.equal(f.acquire('nested'), null)
    return Object.getPrototypeOf(target)
  } })
  assert.ok(f.gate.acquire(input, 'outer'))
  assert.equal(f.acquire(), null)
})

test('identity changes during permission callback prevent admission', () => {
  const f = fixture(), original = f.ports.readPermission
  f.ports.readPermission = () => { f.service.generation = 'service-generation-2'; return original() }
  assert.equal(f.acquire(), null)
})

for (const [label, change] of [
  ['session generation', (f) => { f.session.generation = 'session-generation-2'; f.service.sessionGeneration = f.session.generation }],
  ['service generation with identical versions', (f) => { f.service.generation = 'service-generation-2' }],
  ['session identity', (f) => { f.session.sessionId = 'operator-2'; f.service.sessionId = f.session.sessionId }],
  ['exclusive responsibility', (f) => { f.session.exclusive = false }],
  ['continuity', (f) => { f.session.continuity = 'UNKNOWN' }],
  ['complete binding', (f) => { f.service.binding.webSocketUrl += '-new' }],
]) {
  test(`observed loss of ${label} cannot heal or release through PASS`, () => {
    const f = fixture(), lease = f.acquire()
    const savedSession = structuredClone(f.session), savedService = structuredClone(f.service)
    change(f)
    assert.equal(f.gate.isCurrent(lease), false)
    Object.assign(f.session, savedSession)
    Object.assign(f.service, savedService)
    assert.equal(f.gate.isCurrent(lease), false)
    assert.equal(f.gate.complete(lease, report(lease)), false)
    assert.equal(f.gate.complete(lease, report(lease, 'UNPROVEN')), true)
    assert.equal(f.acquire('later'), null)
  })
}

for (const hook of ['readSession', 'readService']) {
  for (const mode of ['throws', 'promise', 'missing']) {
    test(`active ${hook} ${mode} is a permanent observed loss`, async () => {
      const f = fixture(), original = f.ports[hook]
      let bad = false, resolve
      f.ports[hook] = () => {
        if (!bad) return original()
        if (mode === 'throws') throw new Error('synthetic')
        if (mode === 'promise') return new Promise((done) => { resolve = done })
        return undefined
      }
      const lease = f.acquire()
      bad = true
      assert.equal(f.gate.isCurrent(lease), false)
      resolve?.(original())
      await Promise.resolve()
      bad = false
      assert.equal(f.gate.isCurrent(lease), false)
      assert.equal(f.gate.complete(lease, report(lease)), false)
      assert.equal(f.acquire('later'), null)
    })
  }
}

test('complete rechecks identity even when caller did not call isCurrent', () => {
  const f = fixture(), lease = f.acquire()
  f.service.generation = 'service-generation-2'
  assert.equal(f.gate.complete(lease, report(lease)), false)
  f.service.generation = 'service-generation-1'
  assert.equal(f.gate.isCurrent(lease), false)
})

for (const verdict of ['FAIL', 'UNPROVEN']) {
  test(`${verdict} block retains a current lease and survives all later changes`, () => {
    const f = fixture(), lease = f.acquire(), notice = finding(lease, verdict)
    assert.equal(f.gate.block(lease, notice), true)
    assert.equal(Object.isFrozen(notice), false)
    f.permission.startAllowed = false
    f.permission.externalBlock = 'BLOCKED'
    assert.equal(f.gate.isCurrent(lease), true)
    assert.equal(f.gate.complete(lease, report(lease, verdict)), true)
    assert.equal(f.gate.complete(lease, report(lease)), false)
    assert.equal(f.gate.block(lease, finding(lease, 'UNPROVEN')), true)
    Object.assign(f.permission, { startAllowed: true, externalBlock: 'CLEAR', serviceId: 'new-service', serviceGeneration: 'new-generation' })
    f.service.generation = 'new-generation'
    f.service.binding.serviceId = 'new-service'
    assert.equal(f.gate.acquire(f.service.binding, 'new-run'), null)
  })
  test(`${verdict} complete sets a block without an earlier block call`, () => {
    const f = fixture(), lease = f.acquire()
    assert.equal(f.gate.complete(lease, report(lease, verdict)), true)
    assert.equal(f.acquire('new-run'), null)
    assert.equal(f.gate.block(lease, finding(lease)), true)
  })
}

test('external start permission is not needed for current cleanup or resource PASS', () => {
  const f = fixture(), lease = f.acquire()
  f.ports.readPermission = () => { assert.fail('cleanup requested admission') }
  assert.equal(f.gate.isCurrent(lease), true)
  assert.equal(f.gate.complete(lease, report(lease)), true)
})

test('observed external BLOCKED is sticky even if external state later says CLEAR', () => {
  const f = fixture()
  f.permission.externalBlock = 'BLOCKED'
  assert.equal(f.acquire(), null)
  f.permission.externalBlock = 'CLEAR'
  assert.equal(f.acquire('later'), null)
})

test('known completed lease can block a newer reservation without releasing it', () => {
  const f = fixture(), old = f.acquire()
  assert.equal(f.gate.complete(old, report(old)), true)
  const current = f.acquire('run-2')
  assert.equal(f.gate.complete(old, report(old)), false)
  assert.equal(f.gate.block(old, finding(old, 'FAIL')), true)
  assert.equal(f.gate.block(old, finding(old)), true)
  assert.equal(f.gate.isCurrent(current), true)
  assert.equal(f.gate.complete(current, report(current)), true)
  assert.equal(f.gate.complete(current, report(current)), false)
  assert.equal(f.gate.isCurrent(current), false)
  assert.equal(f.acquire('run-3'), null)
})

test('block after successful complete prevents a later run with same or changed binding', () => {
  const f = fixture(), lease = f.acquire()
  assert.equal(f.gate.complete(lease, report(lease)), true)
  assert.equal(f.gate.block(lease, finding(lease)), true)
  assert.equal(f.acquire('run-2'), null)
  f.service.binding = { ...binding(), serviceId: 'service-2' }
  assert.equal(f.gate.acquire(f.service.binding, 'run-3'), null)
})

test('reentrant block during admission is acknowledged and prevents the outer reservation', () => {
  const f = fixture(), old = f.acquire()
  assert.equal(f.gate.complete(old, report(old)), true)
  f.ports.readPermission = () => {
    assert.equal(f.gate.block(old, finding(old)), true)
    return f.permission
  }
  assert.equal(f.acquire('run-2'), null)
})

test('reentrant block during PASS complete cannot be overwritten by release', () => {
  const f = fixture()
  let lease, finishing = false
  f.ports.readSession = () => {
    if (finishing) assert.equal(f.gate.block(lease, finding(lease)), true)
    return f.session
  }
  lease = f.acquire()
  finishing = true
  assert.equal(f.gate.complete(lease, report(lease)), true)
  assert.equal(f.acquire('later'), null)
})

test('reentrant report reflection cannot complete twice or reserve a replacement', () => {
  const f = fixture(), lease = f.acquire(), valid = report(lease)
  const input = new Proxy(valid, { getPrototypeOf(target) {
    assert.equal(f.gate.complete(lease, valid), false)
    assert.equal(f.acquire('nested'), null)
    return Object.getPrototypeOf(target)
  } })
  assert.equal(f.gate.complete(lease, input), true)
  assert.equal(f.gate.complete(lease, valid), false)
  assert.ok(f.acquire('later'))
})

test('frozen foreign inputs are accepted without granting copied lease provenance', () => {
  const f = fixture()
  for (const value of [f.requested.version, f.requested, f.service.binding.version,
    f.service.binding, f.service, f.session, f.permission, f.ports]) Object.freeze(value)
  const lease = f.acquire()
  assert.ok(lease)
  assert.equal(f.gate.isCurrent(Object.freeze({ ...lease })), false)
  const result = report(lease)
  result.resources.forEach(Object.freeze)
  Object.freeze(result.resources)
  Object.freeze(result)
  assert.equal(f.gate.complete(lease, result), true)
})

for (const [label, change] of [
  ['run correlation', (r) => { r.runId = 'wrong' }],
  ['service correlation', (r) => { r.serviceId = 'wrong' }],
  ['missing resource status', (r) => { delete r.resourceStatus }],
  ['unknown resource status', (r) => { r.resourceStatus = 'NOT_RUN' }],
  ['contradictory status', (r) => { r.resourceStatus = 'FAIL' }],
  ['incomplete inventory', (r) => { r.resources.pop() }],
  ['duplicate resource', (r) => { r.resources[1].name = 'connection' }],
  ['remaining resource', (r) => { r.resources[1].state = 'confirmed' }],
  ['unknown resource', (r) => { r.resources[0].state = 'UNKNOWN' }],
  ['missing evidence', (r) => { r.evidenceSaved = false }],
  ['unconfirmed context', (r) => { r.contextReturned = false }],
  ['unconfirmed connection', (r) => { r.connectionClosed = false }],
  ['unconfirmed acknowledgement', (r) => { r.gateAcknowledged = false }],
  ['contradictory PASS block', (r) => { r.gateBlocked = true }],
  ['runtime claim', (r) => { r.runtimeRecord = {} }],
  ['thenable', (r) => { r.then = () => assert.fail('then called') }],
  ['accessor', (r, calls) => { Object.defineProperty(r, 'runId', { get() { calls.report++; assert.fail('getter called') } }) }],
  ['array accessor', (r, calls) => { Object.defineProperty(r.resources, '0', { get() { calls.array++; assert.fail('array getter called') } }) }],
]) {
  test(`invalid report: ${label} leaves the reservation held`, () => {
    const f = fixture(), lease = f.acquire(), invalid = report(lease)
    const getterCalls = { report: 0, array: 0 }
    change(invalid, getterCalls)
    assert.equal(f.gate.complete(lease, invalid), false)
    assert.deepEqual(getterCalls, { report: 0, array: 0 }, 'report and array getters stay inactive')
    if (label === 'accessor' || label === 'array accessor') {
      assert.equal(f.gate.complete(lease, invalid), false)
      assert.deepEqual(getterCalls, { report: 0, array: 0 }, 'repeated rejection does not execute getters')
    }
    assert.equal(f.acquire('later'), null)
    assert.equal(f.gate.isCurrent(lease), true)
    assert.equal(f.gate.complete(lease, report(lease)), true)
    assert.ok(f.acquire('later'))
    assert.deepEqual(getterCalls, { report: 0, array: 0 }, 'positive completion does not hide earlier getter calls')
  })
}

test('Promise reports/findings are not acknowledgements; fulfillment never frees a reservation', async () => {
  const f = fixture(), lease = f.acquire()
  let resolveReport, resolveFinding
  assert.equal(f.gate.complete(lease, new Promise((resolve) => { resolveReport = resolve })), false)
  assert.equal(f.gate.block(lease, new Promise((resolve) => { resolveFinding = resolve })), false)
  resolveReport(report(lease)); resolveFinding(finding(lease))
  await Promise.resolve()
  assert.equal(f.acquire('later'), null)
  assert.equal(f.gate.isCurrent(lease), true)
  assert.equal(f.gate.complete(lease, report(lease)), true)
  assert.ok(f.acquire('later'))
})

test('invalid findings cannot acknowledge a block or change a held reservation', () => {
  const f = fixture(), lease = f.acquire()
  for (const invalid of [undefined, {}, { ...finding(lease), runId: 'other' },
    { ...finding(lease), resourceStatus: 'PASS' }, { ...finding(lease), code: '' },
    new Proxy({}, { getPrototypeOf() { throw new Error('synthetic') } })]) {
    assert.equal(f.gate.block(lease, invalid), false)
    assert.equal(f.gate.isCurrent(lease), true)
    assert.equal(f.acquire('later'), null)
  }
  assert.equal(f.gate.complete(lease, report(lease)), true)
  assert.ok(f.acquire('later'))
})

test('new owner requires explicit restart continuity; existence does not inherit clearance', () => {
  const f = fixture(), lease = f.acquire()
  assert.equal(f.gate.block(lease, finding(lease)), true)
  f.session.continuity = 'UNKNOWN'
  const restarted = createNodeCdpStartGateOwner(f.ports)
  assert.equal(restarted.acquire(binding(), 'new-run'), null)
  assert.equal(restarted.block(lease, finding(lease)), false)
  f.session.continuity = 'CONFIRMED'
  f.permission.externalBlock = 'BLOCKED'
  assert.equal(restarted.acquire(binding(), 'new-run'), null)
  assert.equal(createNodeCdpStartGateOwner().acquire(binding(), 'new-run'), null)
})

// Independent small simulator: no existing test harness is imported or executed.
function controlFixture(f, onSave = () => true) {
  const queue = [], sent = [], timers = new Map(), sockets = [], saved = []
  let timerId = 0, clockCalls = 0, timerCalls = 0
  let signalAdds = 0, signalRemoves = 0, socketAdds = 0, socketRemoves = 0
  const signalListeners = new Map()
  const signal = { aborted: false, listeners: signalListeners,
    addEventListener(name, callback) {
      signalAdds++
      if (!signalListeners.has(name)) signalListeners.set(name, new Set())
      signalListeners.get(name).add(callback)
    },
    removeEventListener(name, callback) { signalRemoves++; signalListeners.get(name)?.delete(callback) },
    abort() {
      if (signal.aborted) return
      signal.aborted = true
      for (const callback of [...(signalListeners.get('abort') ?? [])]) callback()
    },
  }
  const target = { targetId: 'own-target', browserContextId: 'own-context', type: 'page', url: 'about:blank' }
  const frame = { id: 'own-frame', loaderId: 'own-loader', url: 'about:blank' }
  function socket(url) {
    const listeners = new Map()
    let disposed = false
    const ws = { url, readyState: 0, closes: 0, listeners,
      addEventListener(name, callback) {
        socketAdds++
        if (!listeners.has(name)) listeners.set(name, new Set())
        listeners.get(name).add(callback)
      },
      removeEventListener(name, callback) { socketRemoves++; listeners.get(name)?.delete(callback) },
      emit(name, value = {}) { for (const callback of [...(listeners.get(name) ?? [])]) callback(value) },
      packet(value) { ws.emit('message', { data: JSON.stringify(value) }) },
      send(raw) {
        const command = JSON.parse(raw)
        sent.push(command)
        queue.push(() => {
          const answer = (result) => ws.packet({ id: command.id, result,
            ...(command.sessionId ? { sessionId: command.sessionId } : {}) })
          const event = (method, params) => ws.packet({ method, params })
          switch (command.method) {
            case 'Browser.getVersion': answer({ ...f.service.binding.version }); break
            case 'Target.getBrowserContexts': answer({ browserContextIds: disposed ? [] : ['foreign-context'] }); break
            case 'Target.setDiscoverTargets': answer({}); break
            case 'Target.createBrowserContext': answer({ browserContextId: target.browserContextId }); break
            case 'Target.createTarget':
              event('Target.targetCreated', { targetInfo: target }); answer({ targetId: target.targetId }); break
            case 'Target.getTargetInfo': answer({ targetInfo: target }); break
            case 'Target.attachToTarget':
              event('Target.attachedToTarget', { sessionId: 'own-session', targetInfo: target, waitingForDebugger: false })
              answer({ sessionId: 'own-session' }); break
            case 'Page.enable': answer({}); break
            case 'Page.getFrameTree': answer({ frameTree: { frame } }); break
            case 'Target.disposeBrowserContext':
              disposed = true
              event('Target.targetDestroyed', { targetId: target.targetId })
              event('Target.detachedFromTarget', { sessionId: 'own-session', targetId: target.targetId })
              answer({}); break
            default: assert.fail(`Unexpected command ${command.method}`)
          }
        })
      },
      close() { ws.closes++; ws.readyState = 2; queue.push(() => { ws.readyState = 3; ws.emit('close') }) },
    }
    sockets.push(ws)
    queue.push(() => { ws.readyState = 1; ws.emit('open') })
    return ws
  }
  const h = { sent, timers, sockets, saved, signal,
    counters: () => ({ sockets: sockets.length, timers: timerCalls, clocks: clockCalls,
      signalAdds, signalRemoves, socketAdds, socketRemoves }),
    async run(runId) {
      const control = createNodeCdpContextControl({ binding: f.service.binding, startGate: f.gate,
        createWebSocket: socket, now() { clockCalls++; return 100 },
        schedule(callback, delay) { timerCalls++; timers.set(++timerId, { callback, delay }); return timerId },
        cancel(id) { timers.delete(id) },
        evidence: { save(snapshot) { saved.push(snapshot); return onSave(snapshot) } } })
      const result = control.runOnce({ runId, signal })
      let steps = 0
      while (queue.length) { assert.ok(++steps < 100, 'finite simulated event queue'); queue.shift()() }
      assert.equal(timers.size, 0, 'normal cleanup finishes without real waiting')
      return result
    },
  }
  return h
}

function assertCleanup(h, result) {
  assert.equal(result.contextReturned, true)
  assert.equal(result.connectionClosed, true)
  assert.equal(result.gateAcknowledged, true)
  assert.equal(result.runtimeRecord, null)
  assert.ok(result.resources.every((entry) => entry.state === 'closed'))
  assert.equal(h.timers.size, 0)
  assert.ok(h.sockets.every((ws) => ws.closes === 1 && [...ws.listeners.values()].every((set) => set.size === 0)))
  assert.ok([...h.signal.listeners.values()].every((set) => set.size === 0))
  const registrations = h.counters()
  assert.ok(registrations.signalAdds > 0 && registrations.socketAdds > 0, 'allowed runs register listeners')
  assert.equal(registrations.signalAdds, h.sockets.length, 'one abort registration per allowed run')
  assert.equal(registrations.socketAdds, 4 * h.sockets.length, 'four WebSocket registrations per allowed run')
  assert.equal(registrations.signalRemoves, registrations.signalAdds, 'every abort registration is removed')
  assert.equal(registrations.socketRemoves, registrations.socketAdds, 'every WebSocket registration is removed')
  assert.ok(h.sent.some((command) => command.method === 'Target.disposeBrowserContext'))
  assert.ok(h.sent.every((command) => !['Browser.close', 'Runtime.evaluate', 'Page.navigate'].includes(command.method)))
}

test('integration: unchanged control and owner complete successfully and allow a new factory', async () => {
  const f = fixture(), h = controlFixture(f)
  const first = await h.run('control-1')
  assert.equal(first.status, 'PASS')
  assert.equal(first.resourceStatus, 'PASS')
  assertCleanup(h, first)
  const second = await h.run('control-2')
  assert.equal(second.status, 'PASS')
  assertCleanup(h, second)
  assert.equal(h.sockets.length, 2)
})

test('integration: resource block survives new factories, runs and service bindings with zero new effects', async () => {
  const f = fixture(), h = controlFixture(f, () => false)
  const first = await h.run('control-1')
  assert.equal(first.resourceStatus, 'UNPROVEN')
  assert.equal(first.gateBlocked, true)
  assertCleanup(h, first)
  const before = h.counters()
  assert.equal((await h.run('control-2')).status, 'NOT_RUN')
  assert.deepEqual(h.counters(), before)
  f.service.binding = { ...binding(), serviceId: 'new-service',
    webSocketUrl: 'ws://127.0.0.1:9223/devtools/browser/new-browser' }
  f.service.generation = 'new-generation'
  f.permission.serviceId = 'new-service'; f.permission.serviceGeneration = 'new-generation'
  assert.equal((await h.run('control-3')).status, 'NOT_RUN')
  assert.deepEqual(h.counters(), before)
})

test('integration: normal disposal and completion remain possible despite a late block from an old lease', async () => {
  const f = fixture(), old = f.acquire('previous-run')
  assert.equal(f.gate.complete(old, report(old)), true)
  const h = controlFixture(f, () => {
    assert.equal(f.gate.block(old, finding(old)), true)
    f.permission.externalBlock = 'BLOCKED'
    return true
  })
  const result = await h.run('control-cleanup')
  assert.equal(result.resourceStatus, 'PASS')
  assert.equal(result.errors.includes('SERVICE_BINDING_LOST'), false)
  assert.equal(result.errors.includes('GATE_COMPLETE_UNCONFIRMED'), false)
  assertCleanup(h, result)
  const before = h.counters()
  assert.equal((await h.run('denied')).status, 'NOT_RUN')
  assert.deepEqual(h.counters(), before)
})
