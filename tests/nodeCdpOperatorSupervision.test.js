import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { EventEmitter } from 'node:events'
import { win32 } from 'node:path'
import { createNodeCdpOperatorSupervision, createNodeCdpOperatorSupervisionForTest,
  runNodeCdpOperatorSupervisionCli, SUPERVISION_LIMITS } from '../scripts/browser/nodeCdpOperatorSupervision.js'
import { SESSION_EVIDENCE_ROOT, SERVICE_FOLLOWUP_MS } from '../scripts/browser/nodeCdpOperatorSession.js'
import { NODE_CDP_OPERATOR_DIRECTORY as ROOT } from '../scripts/browser/nodeCdpOperatorHost.js'

// Synthetic effect model copied locally from the protected session suite.
// All production Session / Host / Owner / Control modules remain the real ones.
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

function watchSessionCompletion(supervision) {
  const result = { pending: true }
  supervision.completed().then(report => { result.report = report; result.pending = false })
  return result
}

function sessionArchiveBytes(h) {
  return [...h.files].filter(([name]) => name.startsWith(SESSION_EVIDENCE_ROOT + '\\'))
    .map(([name, bytes]) => [name, bytes.toString('hex')])
}

async function checkClosedStart(h) {
  assert.equal(h.supervision.begin(h.io), false)
  await h.command('prepare'); await h.command('control'); await h.command('window')
  h.signals.emit('SIGINT')
  h.advance(SERVICE_FOLLOWUP_MS + SUPERVISION_LIMITS.intervalMs); await h.settle()
  const view = h.supervision.inspect()
  assert.equal(view.phase, 'CLOSED')
  assert.equal(view.resources.input, 'closed'); assert.equal(view.resources.remainingListeners, 0)
  assert.deepEqual(h.input.eventNames(), []); assert.deepEqual(h.signals.eventNames(), [])
  assert.equal(view.counts.addAttempts, 5); assert.equal(view.counts.removeAttempts, 5)
  assert.deepEqual(h.ioCounts, { adds: 5, removes: 5, pauses: 1 })
  assert.equal(view.resources.timer, 'notAttempted'); assert.equal(view.counts.timerAdds, 0)
  assert.equal(h.superCounts.schedules, 0); assert.equal(h.superCounts.cancels, 0)
  assert.equal(view.counts.commands, 0); assert.equal(h.timers.size, 0)
  assert.deepEqual(h.commands, []); assert.equal(h.counts().spawn, 0); assert.equal(h.counts().socket, 0)
  assert.equal(h.helperCount, 0); assert.equal(h.forbidden, 0)
  assert.deepEqual(h.observations.map(text => JSON.parse(text).role), ['NEGATIVE_TERMINAL'])
  assert.deepEqual(h.saved, h.observations)
  return view
}

for (const receipt of ['confirmed', 'unconfirmed', 'throws']) {
  test(`P2 first RESERVED output closes supervision with ${receipt} receipt and preserves Session completion`, async () => {
    const h = supervisionFixture(), watches = []
    let closeCalls = 0
    h.superHooks.output = () => {
      if (h.original.length === 1) {
        watches.push(watchSessionCompletion(h.supervision))
        closeCalls++
        h.supervision.close()
        watches.push(watchSessionCompletion(h.supervision))
        if (receipt === 'throws') throw ioError()
        return receipt === 'confirmed' ? true : undefined
      }
      return true
    }
    h.supervision.begin(h.io)
    watches.push(watchSessionCompletion(h.supervision))
    const initial = JSON.stringify({ phase: 'RESERVED', next: 'prepare', abortAvailable: true }) + '\n'
    assert.deepEqual(h.original, [initial]); assert.equal(closeCalls, 1)
    assert.deepEqual([...h.timers.values()].map(timer => timer.at), [100])
    assert.equal(h.superCounts.schedules, 0, 'only the Session owns this follow-up timer')
    h.advance(99); await h.settle()
    const pendingBeforePoll = watches.map(watch => watch.pending)
    h.advance(100); await h.settle()
    const archived = [...h.files].filter(([name]) => name.endsWith('-session-report.json'))
    assert.equal(archived.length, 1)
    const archivedReport = JSON.parse(archived[0][1]).value
    assert.equal(archivedReport.phase, 'FINAL')
    assert.equal([...h.files.keys()].filter(name => name.endsWith('-manifest.json')).length, 1)
    const archive = sessionArchiveBytes(h)
    const healthy = receipt === 'confirmed'
    assert.equal(h.original.length - 1, healthy ? 1 : 0, 'original terminal deliveries after the Session archived FINAL')
    assert.deepEqual(pendingBeforePoll, [true, true, true], 'completion queries must stay pending before the Session poll')
    assert.ok(watches.every(watch => !watch.pending), 'all queries settle with the real Session')
    const first = watches[0].report
    for (const watch of watches) assert.strictEqual(watch.report, first)
    assert.equal(first.phase, 'FINAL'); assert.ok(Object.isFrozen(first)); assert.ok(Object.isFrozen(first.followup))
    assert.deepEqual(first.transitions, archivedReport.transitions); assert.deepEqual(first.followup, archivedReport.followup)
    assert.equal(first.followup.deadlineMonotonic - first.followup.beganAtMonotonic, 120_000)
    assert.equal(first.followup.status, 'NOT_ATTEMPTED'); assert.equal(first.startsBlocked, true)
    assert.equal(first.resources.inputListeners, 'closed'); assert.equal(first.fileEvidence.status, 'PASS')
    const bytes = JSON.stringify(first)
    h.supervision.close(); h.supervision.close()
    const later = watchSessionCompletion(h.supervision), view = await checkClosedStart(h)
    assert.strictEqual(later.report, first); assert.equal(JSON.stringify(first), bytes)
    assert.deepEqual(sessionArchiveBytes(h), archive)
    assert.deepEqual(h.original, healthy ? [initial, bytes + '\n'] : [initial])
    assert.equal(view.resources.originalOutput, healthy ? 'CONFIRMED' : 'UNPROVEN')
    assert.equal(view.resources.output, healthy ? 'CONFIRMED' : 'UNPROVEN')
    assert.equal(view.resources.observationOutput, 'CONFIRMED'); assert.equal(view.resources.evidence, 'CONFIRMED')
    assert.equal(view.errors.includes('OUTPUT_LOST'), !healthy)
    assert.equal(view.originalSessionResourceStatus, first.resourceStatus)
    assert.equal(view.observation.startsBlocked, true); assert.equal(view.acceptance, null)
  })
}

test('P2 close during reservation preserves the allocated completion even when Session.begin refuses', async () => {
  const h = supervisionFixture()
  let during, closeCalls = 0
  h.hooks.opened = name => {
    if (!name.endsWith('-reservation.json')) return
    closeCalls++
    h.supervision.close()
    during = watchSessionCompletion(h.supervision)
  }
  assert.equal(h.supervision.begin(h.io), false)
  const after = watchSessionCompletion(h.supervision)
  assert.equal(closeCalls, 1); assert.deepEqual(h.original, [])
  assert.deepEqual([...h.timers.values()].map(timer => timer.at), [100])
  await h.settle()
  const pendingBeforePoll = [during.pending, after.pending]
  h.advance(100); await h.settle()
  const reservation = [...h.files].find(([name]) => name.endsWith('-reservation.json'))
  assert.equal(JSON.parse(reservation[1]).value.accepted, true)
  assert.equal(h.original.length, 1, 'the refused start still owes its original terminal report')
  assert.deepEqual(pendingBeforePoll, [true, true]); assert.equal(after.pending, false)
  const first = after.report
  assert.strictEqual(during.report, first); assert.ok(Object.isFrozen(first)); assert.equal(first.phase, 'FINAL')
  assert.ok(first.errors.includes('START_REFUSED')); assert.ok(first.errors.includes('ABORT'))
  assert.equal(first.fileEvidence.status, 'FAILED'); assert.equal(first.resources.inputListeners, 'notAttempted')
  assert.equal(first.startsBlocked, true); assert.deepEqual(h.original, [JSON.stringify(first) + '\n'])
  h.supervision.close()
  const archive = sessionArchiveBytes(h)
  await checkClosedStart(h)
  assert.strictEqual(await h.supervision.completed(), first)
  assert.deepEqual(sessionArchiveBytes(h), archive); assert.deepEqual(h.original, [JSON.stringify(first) + '\n'])
})

test('P2 normal start and control preserve one original terminal report across repeated close', async () => {
  const h = supervisionFixture()
  assert.equal(await h.supervision.completed(), null)
  await h.final()
  assert.equal(JSON.parse(h.original[0]).phase, 'RESERVED')
  assert.ok(Object.isFrozen(h.first)); assert.equal(h.first.fileEvidence.status, 'PASS')
  h.supervision.close(); h.supervision.close()
  assert.strictEqual(await h.supervision.completed(), h.first)
  assert.strictEqual(await h.supervision.completed(), h.first)
  h.originalUnchanged()
})

test('P2 close during outer registration before Session.begin yields no report or operating effects', async () => {
  const h = supervisionFixture()
  let during
  h.superHooks.add = () => { h.supervision.close(); during = h.supervision.completed() }
  assert.equal(h.supervision.begin(h.io), false)
  assert.equal(await during, null); assert.equal(await h.supervision.completed(), null)
  h.supervision.close(); assert.equal(h.supervision.begin(h.io), false)
  await h.command('prepare'); await h.command('control'); h.advance(SERVICE_FOLLOWUP_MS); await h.settle()
  assert.equal(await h.supervision.completed(), null); assert.deepEqual(h.original, [])
  assert.equal(h.counts().fs, 0); assert.equal(h.counts().spawn, 0); assert.equal(h.counts().socket, 0)
  assert.equal(h.helperCount, 0); assert.deepEqual(h.commands, []); assert.equal(h.counts().timer, 0)
  assert.equal(h.timers.size, 0); assert.deepEqual(sessionArchiveBytes(h), [])
  assert.deepEqual(h.ioCounts, { adds: 1, removes: 1, pauses: 1 }); assert.deepEqual(h.input.eventNames(), [])
})

// Review regressions: real composition, with all operating effects still injected.
for (const [index, name] of ['data', 'end', 'error', 'SIGINT', 'SIGTERM'].entries()) {
  test(`B1 newListener close before ${name} insertion defers removal and stops further setup`, async () => {
    const h = supervisionFixture(), target = index < 3 ? h.input : h.signals
    let during, beforeInsertion, triggered = 0
    const newListener = event => {
      if (event !== name || triggered++) return
      beforeInsertion = target.listenerCount(name)
      during = h.supervision.close()
    }
    EventEmitter.prototype.on.call(target, 'newListener', newListener)
    h.superHooks.remove = () => h.supervision.close()
    const started = h.supervision.begin(h.io)
    EventEmitter.prototype.removeListener.call(target, 'newListener', newListener)
    // The oracle includes the native EventEmitter inventory, not just CLOSED.
    for (const [emitter, names] of [[h.input, ['data', 'end', 'error']], [h.signals, ['SIGINT', 'SIGTERM']]]) {
      for (const event of names) assert.equal(emitter.listenerCount(event), 0, `${event} must actually be detached`)
    }
    assert.equal(beforeInsertion, 0)
    assert.equal(during.resources.input, 'possible', 'pending insertion cannot already be a confirmed removal')
    assert.equal(during.counts.removeAttempts, index, 'only previously settled registrations may be removed')
    const view = h.supervision.inspect()
    assert.equal(started, false); assert.equal(view.phase, 'CLOSED')
    assert.equal(view.counts.addAttempts, index + 1); assert.equal(h.ioCounts.adds, index + 1)
    assert.equal(view.counts.removeAttempts, index + 1); assert.equal(h.ioCounts.removes, index + 1)
    assert.equal(view.resources.remainingListeners, 0); assert.equal(view.resources.input, 'closed')
    assert.equal(h.ioCounts.pauses, 1); assert.equal(h.superCounts.schedules, 0)
    assert.equal(h.counts().fs, 0, 'closing during input setup never begins Session provisioning')
    const counts = { ...h.ioCounts }, observations = h.observations.length
    h.supervision.close(); assert.equal(h.supervision.begin(h.io), false)
    await h.command('prepare'); h.signals.emit('SIGINT'); h.advance(2000); await h.settle()
    assert.deepEqual(h.ioCounts, counts); assert.equal(h.observations.length, observations)
    assert.equal(h.counts().spawn, 0); assert.equal(h.counts().socket, 0); assert.equal(h.forbidden, 0)
  })
}

for (const failure of ['throw', 'unconfirmed']) {
  test(`B1 deferred listener removal ${failure} retains the actual remainder without retry`, () => {
    const h = supervisionFixture()
    h.input.removeListener = () => {
      h.ioCounts.removes++; h.supervision.close()
      if (failure === 'throw') throw ioError()
      return undefined
    }
    EventEmitter.prototype.on.call(h.input, 'newListener', event => {
      if (event === 'data') h.supervision.close()
    })
    assert.equal(h.supervision.begin(h.io), false)
    assert.equal(h.ioCounts.adds, 1, 'no later input or signal registrations after the pending close')
    assert.equal(h.input.listenerCount('data'), 1, 'unconfirmed cleanup keeps the genuine listener visible')
    const view = h.supervision.inspect()
    assert.equal(view.phase, 'CLOSED'); assert.equal(view.resources.input, 'possible')
    assert.equal(view.resources.remainingListeners, 1); assert.equal(view.counts.removeAttempts, 1)
    assert.ok(view.errors.includes('INPUT_CLOSE_UNCONFIRMED'))
    h.supervision.close(); h.supervision.close()
    assert.equal(h.ioCounts.removes, 1); assert.equal(h.superCounts.schedules, 0)
    assert.equal(h.counts().spawn, 0); assert.equal(h.forbidden, 0)
  })
}

for (const placement of ['initial', 'replacement']) {
  for (const cleanup of ['confirmed', 'throw', 'unconfirmed']) {
    test(`B1 ${placement} schedule closes before handle return with ${cleanup} cancellation`, async () => {
      const h = supervisionFixture(), handles = [], cancellations = [], callbacks = []
      const schedule = h.superPorts.schedule, cancel = h.superPorts.cancel
      const closeAt = placement === 'initial' ? 1 : 2
      let pendingClose
      h.superHooks.schedule = callback => {
        callbacks.push(callback)
        if (h.superCounts.schedules === closeAt) pendingClose = h.supervision.close()
      }
      h.superPorts.schedule = (...args) => { const handle = schedule(...args); handles.push(handle); return handle }
      h.superPorts.cancel = handle => {
        cancellations.push(handle); h.supervision.close()
        if (cleanup !== 'confirmed') {
          h.superCounts.cancels++
          if (cleanup === 'throw') throw ioError()
          return false
        }
        return cancel(handle)
      }
      const started = h.supervision.begin(h.io)
      if (placement === 'replacement') { assert.equal(started, true); h.advance(1000); await h.settle() }
      assert.deepEqual(cancellations, [handles.at(-1)], 'the late returned handle must be cancelled exactly once')
      assert.equal(h.timers.has(handles.at(-1)), cleanup !== 'confirmed', 'actual outstanding timer inventory')
      assert.equal(h.superCounts.schedules, closeAt); assert.equal(h.superCounts.cancels, 1)
      assert.equal(pendingClose.resources.timer, 'possible', 'the pending handle has no confirmed close yet')
      const view = h.supervision.inspect()
      assert.equal(view.phase, 'CLOSED'); assert.equal(view.resources.timer, cleanup === 'confirmed' ? 'closed' : 'possible')
      assert.equal(view.counts.timerAdds, closeAt); assert.equal(view.counts.timerRemoves, 1)
      assert.equal(view.counts.timerFirings, closeAt - 1)
      assert.equal(h.ioCounts.adds, 5); assert.equal(h.ioCounts.removes, 5)
      if (placement === 'initial') assert.equal(started, false)
      if (cleanup !== 'confirmed') assert.ok(view.errors.includes('TIMER_CLOSE_UNCONFIRMED'))
      const published = h.observations.length
      h.supervision.close(); h.supervision.close()
      for (const callback of callbacks) { callback(); callback() }
      h.advance(3000); await h.settle()
      assert.equal(h.superCounts.schedules, closeAt); assert.equal(h.superCounts.cancels, 1)
      assert.equal(h.observations.length, published, 'late or duplicate deliveries cannot reopen observation')
      assert.equal(h.counts().spawn, 0); assert.equal(h.counts().socket, 0); assert.equal(h.forbidden, 0)
    })
  }
}

test('B1 lawful timer replacement and settled listener close each balance actual resources once', async () => {
  const h = supervisionFixture(); h.start()
  assert.equal(h.timers.size, 1); h.advance(1000); await h.settle()
  assert.equal(h.superCounts.schedules, 2); assert.equal(h.superCounts.cancels, 0)
  assert.equal(h.timers.size, 1); assert.equal(h.input.listenerCount('data'), 1)
  const ownHandle = [...h.timers.keys()][0]
  const view = h.supervision.close()
  assert.equal(h.timers.has(ownHandle), false, 'only the supervision timer is owned here; Session followup may continue')
  assert.equal(h.input.listenerCount('data'), 0)
  assert.equal(view.counts.timerAdds, 2); assert.equal(view.counts.timerFirings, 1); assert.equal(view.counts.timerRemoves, 1)
  assert.equal(h.ioCounts.adds, 5); assert.equal(h.ioCounts.removes, 5)
  h.supervision.close(); assert.equal(h.ioCounts.removes, 5); assert.equal(h.superCounts.cancels, 1)
})

for (const route of ['offer', 'JSONL inspect']) {
  for (const delayedAt of ['publication', 'final-read']) {
    for (const total of [999, 1000, 1001, 1200]) {
      test(`B2 ${route} cumulative ${total}ms including ${delayedAt} uses one strict budget`, async () => {
        const h = supervisionFixture(); await h.final()
        const base = h.ports.now(), firstDelay = delayedAt === 'publication' ? 600 : 400
        let elapsed = 0, reads = 0, saves = 0, outputs = 0, preliminaryBytes
        const delay = value => { elapsed += value; h.time(base + elapsed) }
        h.superHooks.utc = () => {
          reads++
          if (reads === 1) delay(firstDelay)
          if (reads === 2 && delayedAt === 'final-read') delay(total - 800)
          return '2026-11-14T12:00:00.000Z'
        }
        h.superHooks.save = text => {
          if (JSON.parse(text).role === 'PRELIMINARY') { saves++; delay(delayedAt === 'publication' ? 0 : 200) }
          return true
        }
        h.superHooks.observe = text => {
          if (JSON.parse(text).role === 'PRELIMINARY') {
            outputs++; preliminaryBytes = text
            delay(delayedAt === 'publication' ? total - 600 : 200)
          }
          return true
        }
        const result = route === 'offer' ? h.supervision.offer() : await h.command('inspect')
        assert.equal(elapsed, total); assert.equal(saves, 1); assert.equal(outputs, 1)
        const view = h.supervision.inspect(), valid = total < 1000
        if (route === 'offer') assert.equal(result !== null, valid, 'no offer may activate after the cumulative response deadline')
        assert.equal(view.errors.includes('RESPONSE_EXPIRED'), !valid, 'the final operation must account for all nested steps')
        assert.equal(view.observation.observationStatus, valid ? 'CONFIRMED' : 'UNPROVEN')
        if (!valid) {
          assert.equal(view.offer, null); assert.equal(view.acceptance, null)
          assert.equal(h.observations.map(text => JSON.parse(text)).filter(r => r.role === 'NEGATIVE_TERMINAL' && r.reason === 'RESPONSE_EXPIRED').length, 1)
        }
        assert.ok(h.saved.includes(preliminaryBytes)); assert.ok(h.observations.includes(preliminaryBytes), 'already emitted preliminary bytes are unchanged')
        assert.equal(JSON.parse(preliminaryBytes).role, 'PRELIMINARY')
        delete h.superHooks.utc; delete h.superHooks.save; delete h.superHooks.observe
        assert.equal(h.first.followup.deadlineMonotonic, 120_000)
        h.originalUnchanged(); h.supervision.close()
      })
    }
  }
}

for (const removal of ['unconfirmed', 'throw', 'closed', 'retained']) {
  test(`B3 real Host ${removal} service registrations have the correct clarification responsibility`, async () => {
    const h = supervisionFixture(); await h.final()
    const previousRemovals = h.counts().removes
    if (removal === 'unconfirmed') h.hooks.processRemove = () => ({ value: undefined })
    if (removal === 'throw') h.hooks.processRemove = () => { throw ioError() }
    if (removal !== 'retained') h.closeService()
    const offer = h.supervision.offer(); assert.ok(offer)
    const position = offer.binding.positions.find(p => p.name === 'service.registrations')
    const unresolved = ['unconfirmed', 'throw'].includes(removal)
    assert.equal(position.state, unresolved ? 'possible' : removal === 'closed' ? 'closed' : 'confirmed')
    if (unresolved) {
      assert.equal(position.observation, 'REGISTRATIONS_RETAINED')
      assert.ok(h.child.listenerCount('close') > 0, 'the uncertain genuine Host monitor remains attached')
      assert.ok(h.child.stdout.listenerCount('data') > 0)
      assert.ok(h.counts().removes > previousRemovals, 'the real Host attempted monitor removal')
    }
    const accepted = h.supervision.confirm(offer, h.decision()); assert.ok(accepted)
    assert.equal(accepted.clarificationResponsibility.includes('service.registrations'), unresolved,
      'a possible registration cannot be excluded merely because its label says retained')
    const view = h.supervision.inspect()
    assert.equal(view.observation.serviceResourcesClosed, removal === 'closed')
    assert.equal(accepted.resourceClosureConfirmed, false)
    assert.equal(view.observation.startsBlocked, true); assert.equal(view.originalSessionResourceStatus, 'FAIL')
    assert.equal(view.overallGate, 'FAIL'); assert.equal(view.causeStatus, 'CAUSE_NOT_PROVEN')
    if (removal === 'closed') { assert.equal(h.child.listenerCount('close'), 0); assert.equal(h.child.stdout.listenerCount('data'), 0) }
    h.originalUnchanged(); h.supervision.close()
  })
}

for (const failed of ['original', 'observation', 'both']) {
  for (const failure of ['throw', 'unconfirmed']) {
    for (const lostSave of [false, true]) {
      test(`B4 ${failed} ${failure} with ${lostSave ? 'failed' : 'healthy'} evidence keeps output channels separate`, async () => {
        const h = supervisionFixture(), calls = { original: 0, observation: 0, save: 0 }
        const reject = () => { if (failure === 'throw') throw ioError(); return undefined }
        h.superHooks.output = text => {
          if (JSON.parse(text).phase === 'FINAL' && failed !== 'observation') { calls.original++; return reject() }
          return true
        }
        h.superHooks.observe = text => {
          const record = JSON.parse(text)
          if (record.role === 'NEGATIVE_TERMINAL' || record.kind === 'offer') {
            calls.observation++
            if (failed !== 'original') return reject()
          }
          return true
        }
        h.superHooks.save = text => {
          if (JSON.parse(text).role === 'NEGATIVE_TERMINAL') { calls.save++; if (lostSave) return reject() }
          return true
        }
        await h.final()
        if (failed === 'observation') assert.equal(h.supervision.offer(), null)
        assert.equal(calls.original, failed === 'observation' ? 0 : 1)
        assert.equal(calls.observation, 1, 'healthy observation output must get its one negative attempt even after original output fails')
        assert.equal(calls.save, 1, 'the independent negative save is attempted once')
        const attemptedNotices = h.observations.map(text => JSON.parse(text)).filter(r => r.role === 'NEGATIVE_TERMINAL')
        assert.equal(attemptedNotices.length, failed === 'observation' ? 0 : 1)
        const notice = h.saved.map(text => JSON.parse(text)).find(r => r.role === 'NEGATIVE_TERMINAL')
        assert.ok(notice); assert.equal(notice.observation, 'UNPROVEN')
        assert.equal(notice.output, 'LOST'); assert.equal(notice.reason, 'OUTPUT_LOST')
        assert.equal(notice.originalOutput, failed === 'observation' ? 'RECEIPT_UNCONFIRMED' : 'LOST')
        assert.equal(notice.observationOutput, failed === 'observation' ? 'LOST' : 'RECEIPT_UNCONFIRMED')
        assert.ok(!Object.values(notice).includes('CONFIRMED'), 'negative bytes do not claim their own confirmed receipt or closure')
        const view = h.supervision.inspect()
        assert.equal(view.resources.originalOutput, failed === 'observation' ? 'CONFIRMED' : 'UNPROVEN')
        assert.equal(view.resources.observationOutput, failed === 'original' ? 'CONFIRMED' : 'UNPROVEN')
        assert.equal(view.resources.output, 'UNPROVEN')
        assert.equal(view.resources.evidence, lostSave ? 'UNPROVEN' : 'CONFIRMED')
        assert.equal(view.evidenceSaved, !lostSave); assert.equal(view.acceptance, null)
        assert.equal(view.observation.serviceResourcesClosed, false)
        const counts = { ...h.superCounts }, originalCalls = h.original.length
        delete h.superHooks.output; delete h.superHooks.observe; delete h.superHooks.save
        assert.equal(h.supervision.offer(), null); await h.command('inspect'); h.advance(121_000); await h.settle()
        const later = h.supervision.inspect()
        assert.equal(later.resources.originalOutput, view.resources.originalOutput)
        assert.equal(later.resources.observationOutput, view.resources.observationOutput)
        assert.equal(later.resources.evidence, view.resources.evidence)
        assert.equal(h.superCounts.observations, counts.observations); assert.equal(h.superCounts.saves, counts.saves)
        assert.equal(h.original.length, originalCalls)
        assert.equal(later.acceptance, null); assert.equal(later.observation.startsBlocked, true)
        h.originalUnchanged(); h.supervision.close()
      })
    }
  }
}

test('B4 healthy original, observation and save paths keep their independent real deliveries', async () => {
  const h = supervisionFixture(); await h.final()
  const offer = h.supervision.offer(); assert.ok(offer)
  assert.ok(h.supervision.confirm(offer, h.decision()))
  assert.equal(h.original.filter(text => text === h.firstBytes + '\n').length, 1)
  assert.ok(h.saved.some(text => JSON.parse(text).kind === 'acceptance-proposal'))
  assert.ok(h.observations.some(text => JSON.parse(text).kind === 'acceptance-proposal'))
  assert.equal(h.supervision.inspect().resources.output, 'CONFIRMED')
  h.originalUnchanged(); h.supervision.close()
})

test('JSONL wire-only offer confirmation and subsequent historical receipt reject wrong generations and replay', async () => {
  const h = supervisionFixture(); await h.final()
  const emitted = () => h.observations.map(text => JSON.parse(text))
  const latestObservation = () => emitted().filter(r => r.kind === 'observation').at(-1).value
  const requestOffer = async () => {
    await h.command('offer')
    const record = emitted().filter(r => r.kind === 'offer').at(-1)
    assert.equal(record.role, 'PRELIMINARY')
    return record.value
  }
  const decision = offer => ({ operator: 'Jan', decision: 'ACCEPT_RESPONSIBILITY', offerId: offer.offerId,
    sessionId: offer.sessionId, sessionGeneration: offer.sessionGeneration,
    serviceId: offer.serviceId, serviceGeneration: offer.serviceGeneration })
  const wrongOffer = await requestOffer()
  await h.command('confirm', { ...decision(wrongOffer), serviceGeneration: 'wrong-generation' })
  await h.command('inspect')
  assert.equal(latestObservation().acceptance, null)
  assert.equal(emitted().filter(r => r.kind === 'acceptance-proposal').length, 0)
  const offer = await requestOffer()
  assert.notEqual(offer.offerId, wrongOffer.offerId)
  await h.command('confirm', decision(offer))
  const proposal = emitted().filter(r => r.kind === 'acceptance-proposal').at(-1)
  assert.equal(proposal.role, 'PRELIMINARY'); assert.equal(proposal.value.status, undefined)
  await h.command('inspect')
  const accepted = latestObservation().acceptance
  assert.equal(accepted?.status, 'CONFIRMED', 'only the later serialized historical acceptance satisfies success')
  assert.equal(accepted.responsibilityAccepted, true); assert.equal(accepted.historicalResponsibilityAccepted, true)
  assert.equal(accepted.offerId, offer.offerId)
  for (const key of ['sessionId', 'sessionGeneration', 'serviceId', 'serviceGeneration']) assert.equal(accepted.identity[key], offer[key])
  assert.equal(accepted.evidenceStatus, 'PROPOSAL_SAVED_FINAL_RECEIPT_NOT_PERSISTED')
  const proposalCount = emitted().filter(r => r.kind === 'acceptance-proposal').length
  await h.command('confirm', decision(offer)); await h.command('offer'); await h.command('inspect')
  assert.deepEqual(latestObservation().acceptance, accepted)
  assert.equal(emitted().filter(r => r.kind === 'acceptance-proposal').length, proposalCount)
  assert.equal(emitted().filter(r => r.kind === 'offer').length, 2)
  // No direct offer(), confirm() or inspect() participates in this oracle.
  h.originalUnchanged(); await h.command('close')
})

function supervisionFixture(settings = {}) {
  const h = sessionFixture(settings)
  h.superHooks = {}
  h.superCounts = { now: 0, uuid: 0, schedules: 0, cancels: 0, saves: 0, observations: 0 }
  h.original = []; h.observations = []; h.saved = []
  h.ioCounts = { adds: 0, removes: 0, pauses: 0 }
  class Input extends EventEmitter {
    on(name, callback) {
      h.ioCounts.adds++
      if (h.superHooks.add) h.superHooks.add(this, name)
      return super.on(name, callback)
    }
    removeListener(name, callback) {
      h.ioCounts.removes++
      if (h.superHooks.remove) h.superHooks.remove(this, name)
      return super.removeListener(name, callback)
    }
    pause() { h.ioCounts.pauses++; return h.superHooks.pause ? h.superHooks.pause(this) : this }
    resume() { return this }
  }
  h.input = new Input(); h.signals = new Input()
  h.superPorts = {
    now() { h.superCounts.now++; return h.superHooks.now ? h.superHooks.now() : h.ports.now() },
    utc() { return h.superHooks.utc ? h.superHooks.utc() : '2026-11-14T12:00:00.000Z' },
    uuid() { h.superCounts.uuid++; return `supervision-${h.superCounts.uuid}` },
    schedule(callback, delay) {
      h.superCounts.schedules++
      if (h.superHooks.schedule) h.superHooks.schedule(callback, delay)
      return h.ports.schedule(callback, delay)
    },
    cancel(handle) {
      h.superCounts.cancels++
      if (h.superHooks.cancel) h.superHooks.cancel(handle)
      return h.ports.cancel(handle)
    },
  }
  h.io = {
    input: h.input, signals: h.signals,
    output(text) { h.original.push(text); return h.superHooks.output ? h.superHooks.output(text) : true },
    observe(text) {
      h.superCounts.observations++; h.observations.push(text)
      return h.superHooks.observe ? h.superHooks.observe(text) : true
    },
    save(text) {
      h.superCounts.saves++; h.saved.push(text)
      return h.superHooks.save ? h.superHooks.save(text) : true
    },
  }
  h.supervision = createNodeCdpOperatorSupervisionForTest(SESSION_CONFIG, h.superPorts, h.sessionPorts, h.ports)
  h.settle = async () => { for (let i = 0; i < 10; i++) { h.flush(); await Promise.resolve() } }
  h.command = async (action, value = null) => {
    h.input.emit('data', JSON.stringify({ action, value }) + '\n'); await h.settle()
  }
  h.start = () => assert.equal(h.supervision.begin(h.io), true)
  h.ready = async () => {
    h.start(); await h.command('prepare')
    const ready = h.original.map(text => JSON.parse(text)).find(value => value.phase === 'READY')
    assert.ok(ready?.confirmation, 'original READY output survives unchanged')
    h.confirmation = ready.confirmation
    assert.equal(h.counts().spawn, 1); assert.equal(h.counts().socket, 1)
  }
  h.control = async () => {
    await h.command('control', { operator: 'Jan', decision: 'ALLOW_CONTROL_ONCE', ...h.confirmation })
  }
  h.final = async () => {
    await h.ready(); await h.control(); h.advance(SERVICE_FOLLOWUP_MS); await h.settle()
    h.first = await h.supervision.completed()
    assert.equal(h.first.phase, 'FINAL'); assert.equal(h.first.followup.status, 'FAIL')
    h.firstBytes = JSON.stringify(h.first)
    h.archive = [...h.files].filter(([name]) => name.startsWith(SESSION_EVIDENCE_ROOT))
      .map(([name, bytes]) => [name, bytes.toString('hex')])
    return h.first
  }
  h.decision = () => ({ operator: 'Jan', decision: 'ACCEPT_RESPONSIBILITY' })
  h.originalUnchanged = () => {
    assert.equal(JSON.stringify(h.first), h.firstBytes)
    assert.deepEqual([...h.files].filter(([name]) => name.startsWith(SESSION_EVIDENCE_ROOT))
      .map(([name, bytes]) => [name, bytes.toString('hex')]), h.archive)
    assert.equal(h.original.filter(text => text === h.firstBytes + '\n').length, 1)
    assert.equal(h.forbidden, 0)
  }
  return h
}

test('supervision factories do not read any caller option, dependency or input', () => {
  let attempts = 0
  const poison = new Proxy({}, { get() { attempts++; throw ioError() },
    getPrototypeOf() { attempts++; throw ioError() }, ownKeys() { attempts++; throw ioError() } })
  const native = createNodeCdpOperatorSupervision(poison)
  const fake = createNodeCdpOperatorSupervisionForTest(poison, poison, poison, poison)
  assert.equal(attempts, 0)
  assert.ok(Object.isFrozen(native)); assert.ok(Object.isFrozen(fake))
})

test('fresh supervision module evaluation has exercised native effect guards', async () => {
  const { default: filesystem } = await import('node:fs')
  const { default: processes } = await import('node:child_process')
  const { default: crypto } = await import('node:crypto')
  const { register, syncBuiltinESMExports } = await import('node:module')
  register('data:text/javascript,' + encodeURIComponent('export async function load(u,c,n){return n(u,c)}'), import.meta.url)
  const saved = [], effects = []
  function trap(target, key) {
    saved.push([target, key, Object.getOwnPropertyDescriptor(target, key)])
    Object.defineProperty(target, key, { configurable: true, writable: true,
      value() { effects.push(key); throw ioError() } })
  }
  let fresh, caught, effectiveness
  try {
    for (const key of ['openSync', 'readFileSync', 'writeSync', 'mkdirSync', 'fsyncSync']) trap(filesystem, key)
    trap(processes, 'spawn'); trap(crypto, 'randomUUID')
    trap(globalThis, 'WebSocket'); trap(globalThis, 'setTimeout')
    trap(process.stdin, 'on'); trap(process, 'on')
    syncBuiltinESMExports()
    // These are genuine guards: each hooked site must independently reject a call.
    for (const [target, key] of saved) assert.throws(() => target[key](), /synthetic/)
    effectiveness = effects.length; effects.length = 0
    fresh = await import('../scripts/browser/nodeCdpOperatorSupervision.js?fresh-guarded-supervision')
    fresh.createNodeCdpOperatorSupervision(SESSION_CONFIG)
    fresh.createNodeCdpOperatorSupervisionForTest({}, {}, {}, {})
  } catch (error) { caught = error }
  finally {
    for (const [target, key, descriptor] of saved.reverse()) {
      if (descriptor) Object.defineProperty(target, key, descriptor); else Reflect.deleteProperty(target, key)
    }
    syncBuiltinESMExports()
  }
  assert.equal(caught, undefined); assert.equal(effectiveness, saved.length)
  assert.deepEqual(effects, [])
  assert.notEqual(fresh.createNodeCdpOperatorSupervision, createNodeCdpOperatorSupervision)
})

for (const missing of ['now', 'utc', 'uuid', 'schedule', 'cancel']) {
  test(`missing supervision dependency ${missing} refuses before any Session effect`, () => {
    const h = supervisionFixture(), ports = { ...h.superPorts }; delete ports[missing]
    const supervision = createNodeCdpOperatorSupervisionForTest(SESSION_CONFIG, ports, h.sessionPorts, h.ports)
    assert.equal(supervision.begin(h.io), false)
    assert.equal(h.counts().fs, 0); assert.equal(h.counts().spawn, 0)
    assert.equal(h.counts().socket, 0)
  })
}

for (const missing of ['input', 'signals', 'output', 'observe', 'save']) {
  test(`missing supervision IO ${missing} never falls back to native IO`, () => {
    const h = supervisionFixture(), io = { ...h.io }; delete io[missing]
    assert.equal(h.supervision.begin(io), false)
    assert.equal(h.counts().fs, 0); assert.equal(h.counts().spawn, 0)
  })
}

test('closed composition schemas reject accessors without executing their getters', () => {
  const h = supervisionFixture(); let reads = 0
  Object.defineProperty(h.io, 'save', { get() { reads++; throw ioError() } })
  assert.equal(h.supervision.begin(h.io), false)
  assert.equal(reads, 0); assert.equal(h.counts().fs, 0)
})

test('missing nested Session and Host dependencies cannot reach guarded native effects', async () => {
  const { default: filesystem } = await import('node:fs')
  const { default: processes } = await import('node:child_process')
  const { syncBuiltinESMExports } = await import('node:module')
  const saved = [], attempts = []
  function trap(target, key) {
    saved.push([target, key, Object.getOwnPropertyDescriptor(target, key)])
    Object.defineProperty(target, key, { configurable: true, writable: true,
      value() { attempts.push(key); throw ioError() } })
  }
  let exercised = 0
  try {
    for (const key of ['openSync', 'mkdirSync', 'writeSync']) trap(filesystem, key)
    trap(processes, 'spawn'); trap(globalThis, 'WebSocket'); trap(globalThis, 'setTimeout')
    syncBuiltinESMExports()
    for (const layer of ['session', 'host']) {
      const sample = supervisionFixture(), keys = Object.keys(layer === 'session' ? sample.sessionPorts : sample.ports)
      for (const missing of keys) {
        const h = supervisionFixture(), sessionPorts = { ...h.sessionPorts }, hostPorts = { ...h.ports }
        delete (layer === 'session' ? sessionPorts : hostPorts)[missing]
        // Removal helpers added by the fixture are not required host dependencies.
        if (['rmSync', 'unlinkSync', 'rmdirSync'].includes(missing)) continue
        const supervision = createNodeCdpOperatorSupervisionForTest(SESSION_CONFIG, h.superPorts, sessionPorts, hostPorts)
        assert.equal(supervision.begin(h.io), false, `${layer}.${missing}`)
        assert.equal(h.counts().spawn, 0)
        supervision.close(); exercised++
      }
    }
  } finally {
    for (const [target, key, descriptor] of saved.reverse()) {
      if (descriptor) Object.defineProperty(target, key, descriptor); else Reflect.deleteProperty(target, key)
    }
    syncBuiltinESMExports()
  }
  assert.equal(exercised, 17)
  assert.deepEqual(attempts, [])
})

test('bounded native CLI subprocesses have active guards and never enter operating paths', async () => {
  const { spawnSync } = await import('node:child_process')
  const { fileURLToPath } = await import('node:url')
  const entry = fileURLToPath(new globalThis.URL('../scripts/browser/nodeCdpOperatorSupervision.js', import.meta.url))
  for (const args of [[], ['--help'], ['--run'], ['--unrecognized']]) {
    const script = `
      import fs from 'node:fs'; import cp from 'node:child_process';
      import { register, syncBuiltinESMExports } from 'node:module';
      import { pathToFileURL } from 'node:url';
      register('data:text/javascript,'+encodeURIComponent('export async function load(u,c,n){return n(u,c)}'),pathToFileURL(process.cwd()+'/'));
      const hits=[],nativeWrite=fs.writeSync;
      for (const [target, keys] of [[fs,['openSync','readFileSync','mkdirSync','writeSync']], [cp,['spawn']], [globalThis,['setTimeout','WebSocket']]]) {
        for (const key of keys) Object.defineProperty(target,key,{configurable:true,writable:true,value(...a){if(target===fs&&key==='writeSync'&&(a[0]===1||a[0]===2))return nativeWrite(...a);hits.push(key);throw Error('GUARDED')}});
      }
      let active=0;
      for(const probe of [()=>fs.openSync(),()=>cp.spawn(),()=>setTimeout(),()=>new WebSocket()])try{probe()}catch{active++}
      if(active!==4)throw Error('INACTIVE_GUARD');hits.length=0;
      syncBuiltinESMExports();
      process.argv=[process.execPath,${JSON.stringify(entry)},...${JSON.stringify(args)}];
      await import(pathToFileURL(${JSON.stringify(entry)}).href);
      if(hits.length)throw Error('NATIVE_EFFECTS:'+hits.join(','));
      process.stdout.write('GUARDS_ACTIVE_NO_EFFECTS\\n');
    `
    const result = spawnSync(process.execPath, ['--input-type=module', '--eval', script],
      { encoding: 'utf8', windowsHide: true, timeout: 10_000, maxBuffer: 65_536 })
    assert.equal(result.error, undefined)
    assert.equal(result.status, 0, result.stderr)
    assert.equal(result.stderr, '')
    assert.match(result.stdout, /GUARDS_ACTIVE_NO_EFFECTS/)
  }
})

test('original READY and control report are emitted once through the actual Session parser', async () => {
  const h = supervisionFixture(); await h.ready()
  assert.equal(h.commands.filter(c => c.method === 'Target.createBrowserContext').length, 0)
  await h.control()
  assert.equal(h.commands.filter(c => c.method === 'Target.createBrowserContext').length, 1)
  assert.equal(h.original.map(text => JSON.parse(text)).filter(value => value.control).length, 1)
  h.advance(SERVICE_FOLLOWUP_MS); await h.settle()
  const first = await h.supervision.completed()
  assert.equal(first.control.status, 'PASS')
  assert.equal(first.followup.status, 'FAIL')
  assert.equal(h.original.filter(text => text === JSON.stringify(first) + '\n').length, 1)
  const before = h.counts(), additions = h.ioCounts.adds
  await h.command('prepare'); await h.command('control', { operator: 'Jan', decision: 'ALLOW_CONTROL_ONCE', ...h.confirmation })
  assert.equal(h.counts().spawn, before.spawn); assert.equal(h.counts().socket, before.socket)
  assert.equal(h.ioCounts.adds, additions, 'no Session or supervision input is reactivated')
  h.supervision.close()
})

test('offers cannot substitute for provisioning or the separate control decision', async () => {
  const h = supervisionFixture()
  assert.equal(h.supervision.offer(), null)
  h.start(); assert.equal(h.supervision.offer(), null)
  await h.command('prepare'); assert.equal(h.supervision.offer(), null)
  assert.equal(h.commands.filter(c => c.method === 'Target.createBrowserContext').length, 0)
  await h.command('abort'); h.advance(120_000); await h.settle()
  h.supervision.close()
})

test('same held generation stays observable after FINAL without mutating terminal bytes or archive', async () => {
  const h = supervisionFixture(); await h.final()
  const firstView = h.supervision.inspect(), firstBytes = JSON.stringify(firstView)
  const initialCounts = h.counts(), initialAdds = h.ioCounts.adds
  for (const key of ['sessionId', 'sessionGeneration', 'serviceId', 'serviceGeneration']) {
    assert.ok(firstBytes.includes(JSON.stringify(h.first.followup.host[key])), key)
  }
  assert.ok(Object.isFrozen(firstView))
  h.time(121_000)
  const secondView = h.supervision.inspect()
  assert.notDeepEqual(secondView, firstView, 'new read has a fresh observation time')
  assert.equal(JSON.stringify(firstView), firstBytes)
  assert.equal(h.ioCounts.adds, initialAdds, 'read does not restore the detached Session input')
  assert.equal(h.counts().spawn, initialCounts.spawn); assert.equal(h.counts().socket, initialCounts.socket)
  assert.equal(h.counts().uuid, initialCounts.uuid, 'observation creates no replacement generation')
  h.originalUnchanged(); h.supervision.close()
})

test('one owned input and signal registration set survives FINAL and is detached only once', async () => {
  const h = supervisionFixture(); await h.final()
  assert.equal(h.ioCounts.adds, 5, 'data,end,error,SIGINT,SIGTERM registered exactly once')
  assert.equal(h.ioCounts.removes, 0, 'FINAL only detaches Session proxy registrations')
  assert.equal(h.ioCounts.pauses, 0, 'FINAL does not pause the surviving observation input')
  assert.equal(h.input.listenerCount('data'), 1)
  assert.equal(h.signals.listenerCount('SIGINT'), 1)
  const before = h.observations.length
  await h.command('inspect')
  assert.ok(h.observations.length > before, 'post-FINAL command uses surviving observer')
  const closedView = h.supervision.close()
  assert.equal(h.ioCounts.removes, 5)
  assert.equal(h.ioCounts.pauses, 1, 'explicit supervision close stops its own input flow once')
  assert.equal(closedView.counts.timerAdds, closedView.counts.timerRemoves + closedView.counts.timerFirings,
    'every owned timer registration has one completion or confirmed cancellation')
  for (const [target, names] of [[h.input, ['data', 'end', 'error']], [h.signals, ['SIGINT', 'SIGTERM']]]) {
    for (const name of names) assert.equal(target.listenerCount(name), 0)
  }
  const counts = { ...h.superCounts }, adds = h.ioCounts.adds
  h.supervision.close(); h.supervision.begin(h.io)
  assert.equal(h.ioCounts.removes, 5); assert.equal(h.ioCounts.adds, adds)
  assert.equal(h.ioCounts.pauses, 1)
  assert.equal(h.superCounts.schedules, counts.schedules)
  assert.equal(h.superCounts.cancels, counts.cancels)
  // Only supervisor handles close: outstanding browser drains still exist.
  assert.ok(h.child.stdout.listenerCount('data') > 0)
  assert.ok(h.child.listenerCount('close') > 0)
  h.closeService()
  assert.equal(h.child.stdout.listenerCount('data'), 0)
  assert.equal(h.forbidden, 0)
  h.originalUnchanged()
})

test('valid takeover separates historical responsibility, current observation, clarification and closure', async () => {
  const h = supervisionFixture(); await h.final()
  const offer = h.supervision.offer()
  assert.ok(offer && Object.isFrozen(offer))
  assert.equal(offer.operator, 'Jan'); assert.equal(offer.expiresAtMonotonic, 135_000)
  for (const key of ['sessionId', 'sessionGeneration', 'serviceId', 'serviceGeneration']) {
    assert.equal(offer[key], h.first.followup.host[key])
  }
  assert.ok(offer.binding.positions.some(p => p.name === 'service.process' && p.state === 'confirmed'))
  for (const resource of h.first.control.resources) {
    const position = offer.binding.positions.find(p => p.name === `control.${resource.name}`)
    assert.equal(position?.state, resource.state)
    assert.equal(position?.observation, 'HISTORICAL_NOT_REOBSERVED')
  }
  for (const key of ['connection', 'registrations', 'timer']) {
    assert.equal(offer.binding.positions.find(p => p.name === `preparation.${key}`)?.state, h.first.preparation[key])
  }
  assert.ok(h.observations.some(text => JSON.parse(text).kind === 'offer'))
  const result = h.supervision.confirm(offer, h.decision())
  assert.equal(result?.responsibilityAccepted, true)
  assert.equal(result.serviceObservationConfirmed, true)
  assert.ok(result.clarificationResponsibility.includes('reservation'))
  assert.ok(result.clarificationResponsibility.includes('profile'))
  assert.equal(result.resourceClosureConfirmed, false)
  assert.equal(result.originalSessionResourceStatus, 'FAIL')
  assert.equal(h.supervision.confirm(offer, h.decision()), null)
  assert.equal(h.supervision.offer(), null, 'no second effective responsibility transition')
  const view = h.supervision.inspect()
  assert.equal(view.observation.startsBlocked, true)
  assert.equal(view.originalSessionResourceStatus, 'FAIL')
  assert.equal(view.overallGate, 'FAIL'); assert.equal(view.causeStatus, 'CAUSE_NOT_PROVEN')
  assert.equal(view.evidenceClass, 'NOT_EVIDENCE'); assert.equal(view.runtimeRecord, null)
  h.originalUnchanged(); h.supervision.close()
})

for (const [label, offset, valid] of [['before', 14_999, true], ['equal', 15_000, false], ['after', 15_001, false]]) {
  test(`offer absolute freshness ${label} expiry is enforced without extending Session followup`, async () => {
    const h = supervisionFixture(); await h.final()
    const offer = h.supervision.offer(); assert.ok(offer)
    h.time(120_000 + offset)
    const result = h.supervision.confirm(offer, h.decision())
    assert.equal(result !== null, valid)
    assert.equal(h.first.followup.deadlineMonotonic, 120_000)
    h.originalUnchanged(); h.supervision.close()
  })
}

for (const attack of ['copy', 'foreign', 'stale', 'operator', 'decision', 'extra', 'getter']) {
  test(`takeover refuses ${attack} without a new effective acceptance`, async () => {
    const h = supervisionFixture(); await h.final()
    let offer = h.supervision.offer(), decision = h.decision(), getterReads = 0
    if (attack === 'copy') offer = { ...offer }
    if (attack === 'foreign') {
      const other = supervisionFixture(); await other.final(); offer = other.supervision.offer(); other.supervision.close()
    }
    if (attack === 'stale') assert.ok(h.supervision.offer())
    if (attack === 'operator') decision.operator = 'Other'
    if (attack === 'decision') decision.decision = 'ALLOW_CONTROL_ONCE'
    if (attack === 'extra') decision.unexpected = true
    if (attack === 'getter') Object.defineProperty(decision, 'operator', { get() { getterReads++; return 'Jan' } })
    assert.equal(h.supervision.confirm(offer, decision), null)
    assert.equal(h.supervision.inspect().acceptance, null)
    assert.equal(getterReads, 0)
    h.originalUnchanged(); h.supervision.close()
  })
}

test('JSONL confirmation binds the active offer and refuses mismatched generation and replay', async () => {
  const h = supervisionFixture(); await h.final()
  let offer = h.supervision.offer()
  const wire = offered => ({ ...h.decision(), offerId: offered.offerId,
    sessionId: offered.sessionId, sessionGeneration: offered.sessionGeneration,
    serviceId: offered.serviceId, serviceGeneration: offered.serviceGeneration })
  await h.command('confirm', { ...wire(offer), serviceGeneration: 'foreign-generation' })
  assert.equal(h.supervision.inspect().acceptance, null)
  offer = h.supervision.offer(); await h.command('confirm', wire(offer))
  const accepted = h.supervision.inspect().acceptance
  assert.equal(accepted?.responsibilityAccepted, true)
  await h.command('confirm', wire(offer))
  assert.deepEqual(h.supervision.inspect().acceptance, accepted)
  h.originalUnchanged(); h.supervision.close()
})

for (const port of ['save', 'observe']) {
  for (const [label, elapsed, valid] of [['before', 999, true], ['equal', 1000, false], ['after', 1001, false]]) {
    test(`acceptance ${port} response ${label} strict deadline`, async () => {
      const h = supervisionFixture(); await h.final()
      const offer = h.supervision.offer(); let injected = 0
      h.superHooks[port] = text => {
        if (JSON.parse(text).kind === 'acceptance-proposal') { injected++; h.time(120_000 + elapsed) }
        return true
      }
      const result = h.supervision.confirm(offer, h.decision())
      assert.equal(injected, 1); assert.equal(result !== null, valid)
      if (!valid) assert.equal(h.supervision.inspect().acceptance, null)
      for (const text of h.saved.concat(h.observations)) {
        const record = JSON.parse(text)
        assert.ok(['PRELIMINARY', 'NEGATIVE_TERMINAL'].includes(record.role))
        if (record.kind === 'acceptance-proposal') assert.equal(record.role, 'PRELIMINARY')
      }
      h.originalUnchanged(); h.supervision.close()
    })
  }
}

for (const port of ['save', 'observe']) {
  for (const change of ['backward', 'nonfinite', 'throwing', 'identity', 'process-exit', 'reentry']) {
    test(`change ${change} during ${port} cannot publish a positive takeover`, async () => {
      const h = supervisionFixture(); await h.final()
      const offer = h.supervision.offer(); let injected = 0, reentrant
      h.superHooks[port] = text => {
        if (JSON.parse(text).kind !== 'acceptance-proposal') return true
        injected++
        if (change === 'backward') h.time(119_999)
        if (change === 'nonfinite') h.superHooks.now = () => NaN
        if (change === 'throwing') h.superHooks.now = () => { throw ioError() }
        if (change === 'identity') h.child.pid++
        if (change === 'process-exit') h.closeService()
        if (change === 'reentry') reentrant = h.supervision.confirm(offer, h.decision())
        return true
      }
      assert.equal(h.supervision.confirm(offer, h.decision()), null)
      assert.equal(injected, 1)
      if (change === 'reentry') assert.equal(reentrant, null)
      assert.equal(h.supervision.inspect().acceptance, null)
      h.originalUnchanged(); h.supervision.close()
    })
  }
}

test('later actual drain completion does not improve the first frozen FAIL or unlock starts', async () => {
  const h = supervisionFixture(); await h.final()
  const offer = h.supervision.offer(); assert.ok(h.supervision.confirm(offer, h.decision()))
  h.closeService(); h.time(121_000)
  const view = h.supervision.inspect()
  assert.equal(view.observation.serviceResourcesClosed, true)
  assert.equal(view.observation.serviceObservation, 'UNPROVEN')
  assert.equal(view.originalSessionResourceStatus, 'FAIL')
  assert.equal(view.observation.startsBlocked, true)
  assert.ok(view.openPositions.some(p => p.name === 'reservation'))
  assert.ok(view.openPositions.some(p => p.name === 'profile'))
  h.originalUnchanged(); h.supervision.close()
})

for (const port of ['save', 'observe']) {
  for (const failure of ['false', 'throw']) {
    test(`${port} ${failure} after an earlier successful publication is separately accounted`, async () => {
      const h = supervisionFixture(); await h.final()
      assert.ok(h.supervision.offer(), 'establishes an earlier successful save and output')
      let injected = 0
      h.superHooks[port] = () => { injected++; if (failure === 'throw') throw ioError(); return false }
      assert.equal(h.supervision.offer(), null)
      assert.equal(injected, 1)
      const view = h.supervision.inspect()
      assert.equal(view.acceptance, null)
      assert.ok(view.errors.includes(port === 'save' ? 'EVIDENCE_LOST' : 'OUTPUT_LOST'))
      assert.equal(view.resources[port === 'save' ? 'evidence' : 'output'], 'UNPROVEN')
      assert.equal(view.observationAvailable, true, 'IO loss is distinct from current service observation')
      assert.ok(h.child.stdout.listenerCount('data') > 0, 'drain is retained after IO failure')
      assert.equal(h.supervision.offer(), null)
      delete h.superHooks[port]
      h.advance(121_000); await h.settle()
      const later = h.supervision.inspect()
      assert.equal(later.resources[port === 'save' ? 'evidence' : 'output'], 'UNPROVEN', 'later IO never erases lost evidence or output')
      if (port === 'save') assert.equal(later.evidenceSaved, false)
      h.originalUnchanged(); h.supervision.close()
    })
  }
}

for (const event of ['end', 'error']) {
  test(`input ${event} preserves last identity and open positions but forbids acceptance`, async () => {
    const h = supervisionFixture(); await h.final()
    const before = h.supervision.inspect(), offer = h.supervision.offer()
    h.input.emit(event)
    assert.equal(h.supervision.confirm(offer, h.decision()), null)
    const after = h.supervision.inspect()
    assert.deepEqual(after.lastReliableIdentity, before.lastReliableIdentity)
    assert.ok(after.openPositions.some(p => p.name === 'service.process'))
    assert.ok(after.errors.includes('INPUT_LOST'))
    assert.ok(h.child.stdout.listenerCount('data') > 0)
    assert.equal(h.supervision.offer(), null)
    h.originalUnchanged(); h.supervision.close()
  })
}

for (const loss of ['pid', 'process-error', 'getter', 'clock-backward', 'clock-nonfinite', 'clock-throw']) {
  test(`observed ${loss} permanently degrades a fresh whole report without modifying history`, async () => {
    const h = supervisionFixture(); await h.final()
    const before = h.supervision.inspect(), bytes = JSON.stringify(before)
    if (loss === 'pid') h.child.pid++
    if (loss === 'process-error') h.child.emit('error', ioError())
    if (loss === 'getter') Object.defineProperty(h.child, 'pid', { get() { throw ioError() } })
    if (loss === 'clock-backward') h.time(119_999)
    if (loss === 'clock-nonfinite') h.superHooks.now = () => NaN
    if (loss === 'clock-throw') h.superHooks.now = () => { throw ioError() }
    const after = h.supervision.inspect()
    assert.equal(after.observation.observationStatus, 'UNPROVEN')
    assert.equal(after.observation.serviceObservation, 'UNPROVEN')
    assert.equal(after.observation.serviceResourcesClosed, false)
    assert.deepEqual(after.lastReliableIdentity, before.lastReliableIdentity)
    assert.ok(after.openPositions.every(p => p.observation === 'UNPROVEN'), 'no positive subprojection remains in the first uncertain graph')
    assert.ok(after.openPositions.some(p => p.name === 'service.process'))
    assert.equal(h.supervision.offer(), null, 'a new offer cannot rehabilitate the lost observation')
    assert.equal(JSON.stringify(before), bytes)
    h.originalUnchanged(); h.supervision.close()
  })
}

test('terminal Session output cannot reentrantly confirm before its output receipt', async () => {
  const h = supervisionFixture(); let attempts = 0, offered, accepted
  h.superHooks.output = text => {
    if (JSON.parse(text).phase === 'FINAL') {
      attempts++; offered = h.supervision.offer()
      accepted = h.supervision.confirm(offered, h.decision())
      return false
    }
    return true
  }
  await h.final()
  assert.equal(attempts, 1); assert.equal(offered, null); assert.equal(accepted, null)
  assert.equal(h.supervision.inspect().acceptance, null)
  assert.ok(h.supervision.inspect().errors.includes('OUTPUT_LOST'))
  h.originalUnchanged(); h.supervision.close()
})

test('offer publication cannot reentrantly confirm its still preliminary offer', async () => {
  const h = supervisionFixture(); await h.final(); let injected = 0, attempted
  h.superHooks.observe = text => {
    const record = JSON.parse(text)
    if (record.kind === 'offer') { injected++; attempted = h.supervision.confirm(record.value, h.decision()) }
    return true
  }
  assert.equal(h.supervision.offer(), null)
  assert.equal(attempted, null); assert.equal(injected, 1)
  assert.equal(h.supervision.inspect().acceptance, null)
  h.originalUnchanged(); h.supervision.close()
})

test('normal staggered exit and pipe close remain observable without replacing the instance', async () => {
  const h = supervisionFixture(); await h.final()
  h.child.exitCode = 0; h.child.emit('exit', 0, null)
  const exiting = h.supervision.inspect()
  assert.equal(exiting.observation.serviceResourcesClosed, false)
  assert.equal(exiting.observation.serviceObservation, 'UNPROVEN')
  h.child.stdout.emit('close')
  assert.equal(h.supervision.inspect().observation.serviceResourcesClosed, false)
  h.child.stderr.emit('close'); h.child.emit('close', 0, null)
  const closedView = h.supervision.inspect()
  assert.equal(closedView.observation.serviceResourcesClosed, true)
  assert.equal(closedView.observation.observationStatus, 'CONFIRMED')
  assert.equal(closedView.originalSessionResourceStatus, 'FAIL')
  assert.equal(h.counts().spawn, 1)
  h.originalUnchanged(); h.supervision.close()
})

test('service observation lost after READY but before first supervisor poll is never rehabilitated', async () => {
  const h = supervisionFixture(); await h.ready()
  h.child.pid++
  await h.command('abort')
  h.advance(120_000); await h.settle()
  const first = await h.supervision.completed()
  assert.equal(first.preparation.status, 'READY')
  const view = h.supervision.inspect()
  assert.equal(view.observation.observationStatus, 'UNPROVEN')
  assert.equal(view.observation.serviceObservation, 'UNPROVEN')
  assert.equal(h.supervision.offer(), null)
  assert.equal(h.counts().spawn, 1)
  assert.ok(h.child.stdout.listenerCount('data') > 0)
  h.supervision.close()
})

test('helper remainders are named independently from later service completion and stay reachable', async () => {
  const h = supervisionFixture({ helperPending: true }); await h.ready()
  await h.command('window'); await h.command('abort')
  h.advance(120_000); await h.settle()
  const first = await h.supervision.completed(), bytes = JSON.stringify(first)
  const offer = h.supervision.offer(); assert.ok(offer)
  assert.ok(offer.binding.positions.some(p => p.name === 'helper.0.process' && p.state !== 'closed'))
  const accepted = h.supervision.confirm(offer, h.decision())
  assert.ok(accepted.clarificationResponsibility.includes('helper.0.process'))
  h.closeService()
  const serviceDone = h.supervision.inspect()
  assert.equal(serviceDone.observation.serviceResourcesClosed, true)
  assert.ok(serviceDone.openPositions.some(p => p.name === 'helper.0.process'))
  assert.equal(serviceDone.acceptance.resourceClosureConfirmed, false)
  assert.ok(h.helper.stdout.listenerCount('data') > 0)
  h.helper.emit('exit', 0, null); h.helper.stdout.emit('close'); h.helper.stderr.emit('close'); h.helper.emit('close', 0, null)
  const drained = h.supervision.inspect()
  assert.equal(drained.openPositions.some(p => p.name.startsWith('helper.')), false)
  assert.equal(JSON.stringify(first), bytes)
  assert.equal(h.forbidden, 0); h.supervision.close()
})

test('last clock callback during acceptance cannot change live identity unnoticed', async () => {
  const positive = supervisionFixture(); await positive.final()
  const positiveOffer = positive.supervision.offer()
  const initialCalls = positive.superCounts.now
  assert.ok(positive.supervision.confirm(positiveOffer, positive.decision()))
  const lastClock = positive.superCounts.now - initialCalls
  positive.supervision.close()
  const h = supervisionFixture(); await h.final(); const offer = h.supervision.offer()
  let calls = 0, injections = 0
  h.superHooks.now = () => {
    if (++calls === lastClock) { h.child.pid++; injections++ }
    return h.ports.now()
  }
  assert.equal(h.supervision.confirm(offer, h.decision()), null)
  assert.equal(injections, 1)
  assert.equal(h.supervision.inspect().acceptance, null)
  h.originalUnchanged(); h.supervision.close()
})

test('own listener removal failure stays possible and is never retried into confirmed closure', async () => {
  const h = supervisionFixture(); await h.final()
  h.superHooks.remove = () => { throw ioError() }
  const closedView = h.supervision.close()
  assert.equal(closedView.resources.input, 'possible')
  assert.equal(closedView.resources.remainingListeners, 5)
  assert.ok(closedView.errors.includes('INPUT_CLOSE_UNCONFIRMED'))
  assert.equal(h.ioCounts.removes, 5)
  h.supervision.close(); assert.equal(h.ioCounts.removes, 5)
  assert.ok(h.child.stdout.listenerCount('data') > 0)
})

test('own timer cancellation failure is retained separately from Session and service drains', async () => {
  const h = supervisionFixture(); await h.final()
  h.superHooks.cancel = () => { throw ioError() }
  const view = h.supervision.close()
  assert.equal(view.resources.timer, 'possible')
  assert.ok(view.errors.includes('TIMER_CLOSE_UNCONFIRMED'))
  assert.equal(h.superCounts.cancels, 1)
  h.supervision.close(); assert.equal(h.superCounts.cancels, 1)
  h.advance(121_000); await h.settle()
  assert.equal(h.superCounts.schedules, view.counts.timerAdds)
})

test('own input pause failure cannot be reported as a confirmed input close', async () => {
  const h = supervisionFixture(); await h.final()
  h.superHooks.pause = () => { throw ioError() }
  const view = h.supervision.close()
  assert.equal(view.resources.input, 'possible')
  assert.equal(h.ioCounts.pauses, 1)
  h.supervision.close(); assert.equal(h.ioCounts.pauses, 1)
  assert.equal(h.forbidden, 0)
})

test('stale and duplicate timer deliveries cannot re-register observation or reach the Session', async () => {
  const h = supervisionFixture(), callbacks = []
  h.superHooks.schedule = callback => callbacks.push(callback)
  await h.final()
  const before = h.supervision.inspect(), output = h.observations.length
  callbacks[0](); callbacks[0]()
  assert.equal(h.supervision.inspect().counts.timerFirings, before.counts.timerFirings)
  assert.equal(h.observations.length, output)
  const last = callbacks.at(-1)
  h.supervision.close()
  const adds = h.superCounts.schedules, closedOutput = h.observations.length
  last(); last()
  assert.equal(h.superCounts.schedules, adds)
  assert.equal(h.observations.length, closedOutput)
  assert.equal(h.counts().spawn, 1); assert.equal(h.counts().socket, 2)
})

test('synchronous timer callback is recognized as reentrant and never recursively arms timers', async () => {
  const h = supervisionFixture()
  h.superHooks.schedule = callback => callback()
  assert.equal(h.supervision.begin(h.io), false)
  assert.equal(h.superCounts.schedules, 1)
  assert.ok(h.supervision.inspect().errors.includes('TIMER_REENTRANT'))
  assert.equal(h.counts().spawn, 0)
  h.supervision.close()
})

test('offer count exhaustion is explicit and cannot manufacture resource completion', async () => {
  const h = supervisionFixture(); await h.final()
  for (let i = 0; i < 32; i++) assert.ok(h.supervision.offer())
  assert.equal(h.supervision.offer(), null)
  const view = h.supervision.inspect()
  assert.equal(view.counts.offers, 32); assert.ok(view.errors.includes('OFFER_LIMIT'))
  assert.equal(view.observation.serviceResourcesClosed, false)
  assert.equal(view.originalSessionResourceStatus, 'FAIL')
  h.originalUnchanged(); h.supervision.close()
})

test('input count and byte limits reject with retained observation and bounded buffers', async () => {
  for (const mode of ['commands', 'chunk', 'pending']) {
    const h = supervisionFixture(); await h.final()
    if (mode === 'commands') {
      for (let i = 0; i < 130; i++) await h.command('inspect')
    } else if (mode === 'chunk') h.input.emit('data', 'x'.repeat(8193))
    else { h.input.emit('data', 'x'.repeat(8192)); h.input.emit('data', 'x') }
    const view = h.supervision.inspect()
    assert.ok(view.errors.includes(mode === 'commands' ? 'INPUT_LIMIT' : 'INPUT_LOST'))
    assert.equal(h.supervision.offer(), null)
    assert.equal(view.observation.serviceResourcesClosed, false)
    assert.ok(view.counts.commands <= 129)
    h.originalUnchanged(); h.supervision.close()
  }
})

test('bounded observation lifetime and output capacity never silently close a live service', async () => {
  const h = supervisionFixture(); await h.final()
  for (let now = 121_000; now <= 1_800_000; now += 1000) h.advance(now)
  const view = h.supervision.inspect()
  assert.equal(view.phase, 'CLOSED')
  assert.ok(view.errors.includes('OBSERVATION_LIMIT'))
  assert.ok(view.counts.records <= 2048)
  assert.ok(view.counts.bytes <= 8_388_608)
  assert.ok(h.observations.every(text => Buffer.byteLength(text) <= 16_384))
  assert.equal(view.observation.serviceResourcesClosed, false)
  assert.equal(view.originalSessionResourceStatus, 'FAIL')
  assert.equal(h.ioCounts.adds, 5); assert.equal(h.ioCounts.removes, 5)
  const terminal = h.observations.map(text => JSON.parse(text)).filter(record => record.role === 'NEGATIVE_TERMINAL')
  assert.equal(terminal.length, 1, 'bounded negative end is observable even after the normal observation budget expires')
  assert.ok(['OBSERVATION_LIMIT', 'OUTPUT_LIMIT'].includes(terminal[0].reason))
  assert.ok(Buffer.byteLength(JSON.stringify(terminal[0]) + '\n') <= 1024)
  assert.ok(h.child.stdout.listenerCount('data') > 0)
  h.originalUnchanged()
})

for (const phase of ['RESERVED', 'PREPARING', 'READY', 'CONTROLLING', 'FOLLOWUP', 'FINAL']) {
  for (const route of ['abort', 'SIGINT', 'SIGTERM']) {
    test(`same composed Session receives ${route} once in ${phase}`, async () => {
      const h = supervisionFixture(phase === 'PREPARING' ? { noSpawn: true } : {})
      if (['READY', 'CONTROLLING', 'FOLLOWUP', 'FINAL'].includes(phase)) await h.ready()
      else h.start()
      if (phase === 'PREPARING') await h.command('prepare')
      if (phase === 'CONTROLLING') {
        h.hooks.command = (command) => command.method === 'Target.createBrowserContext'
        await h.control()
      }
      if (phase === 'FOLLOWUP' || phase === 'FINAL') await h.control()
      if (phase === 'FINAL') { h.advance(SERVICE_FOLLOWUP_MS); await h.settle() }
      const creates = h.commands.filter(c => c.method === 'Target.createBrowserContext').length
      if (route === 'abort') await h.command('abort')
      else { h.signals.emit(route); await h.settle() }
      h.advance(300_000); await h.settle()
      h.advance(500_000); await h.settle()
      const final = await h.supervision.completed()
      assert.equal(final.phase, 'FINAL'); assert.equal(final.startsBlocked, true)
      assert.equal(final.overallGate, 'FAIL'); assert.equal(final.runtimeRecord, null)
      assert.equal(final.stopCount, phase === 'FINAL' ? 0 : 1, 'one signal/command has one Session consumer')
      assert.equal(h.commands.filter(c => c.method === 'Target.createBrowserContext').length, creates)
      assert.equal(h.forbidden, 0)
      h.supervision.close()
    })
  }
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
  // Supervisor creates the single actual session through its public factory.
  h.closeService = () => {
    h.child.exitCode = 0; h.child.emit('exit', 0, null)
    h.child.stdout.emit('close'); h.child.stderr.emit('close'); h.child.emit('close', 0, null)
  }
  return h
}

