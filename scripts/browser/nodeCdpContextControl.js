// Preparation only: no defaults, launcher, CLI, persistence or public CDP port.
const WAIT_MS = 5_000
const MAX_MESSAGE_BYTES = 65_536
const MAX_MESSAGES = 512
const MAX_EVENTS = 128
const MAX_ENTRIES = 64
const VERSION_KEYS = ['protocolVersion', 'product', 'revision', 'userAgent', 'jsVersion']
const ID = /^[A-Za-z0-9._:-]{1,128}$/
const own = (value, key) => Object.hasOwn(value, key)
const record = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const identifier = (value) => typeof value === 'string' && ID.test(value)
const empty = (value) => record(value) && Object.keys(value).length === 0
const freeze = (value) => {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child)
    Object.freeze(value)
  }
  return value
}

function endpoint(value) {
  if (typeof value !== 'string') return false
  const match = /^ws:\/\/127\.0\.0\.1:([1-9][0-9]{0,4})\/devtools\/browser\/([A-Za-z0-9_-]{1,128})$/.exec(value)
  return !!match && Number(match[1]) <= 65_535
}

function contextList(value) {
  if (!Array.isArray(value) || value.length > MAX_ENTRIES || !value.every(identifier)) return null
  return new Set(value).size === value.length ? new Set(value) : null
}

function targetInfo(value) {
  if (!record(value) || !identifier(value.targetId) || typeof value.type !== 'string' ||
      typeof value.url !== 'string' || value.url.length > 2_048 ||
      (own(value, 'browserContextId') && !identifier(value.browserContextId))) return null
  return { targetId: value.targetId, browserContextId: value.browserContextId,
    type: value.type, url: value.url }
}

/** All dependencies are trusted, synchronous and supplied by the composition.
 * schedule(callback, delayMs) must enqueue, never invoke inline; cancel must
 * synchronously cancel its handle. See docs/node-cdp-context-control.md.
 */
export function createNodeCdpContextControl(options) {
  const { binding, createWebSocket, now, schedule, cancel, startGate, evidence } = options ?? {}
  if (!record(binding) || !identifier(binding.serviceId) || !endpoint(binding.webSocketUrl) ||
      !record(binding.version) || !VERSION_KEYS.every((key) =>
        typeof binding.version[key] === 'string' && binding.version[key].length > 0 &&
        binding.version[key].length <= 512) ||
      ![createWebSocket, now, schedule, cancel, startGate?.acquire, startGate?.isCurrent,
        startGate?.block, startGate?.complete, evidence?.save].every((value) => typeof value === 'function')) {
    throw new TypeError('Invalid Node CDP control composition.')
  }
  const bound = freeze({ serviceId: binding.serviceId, webSocketUrl: binding.webSocketUrl,
    version: Object.fromEntries(VERSION_KEYS.map((key) => [key, binding.version[key]])) })
  let used = false

  function runOnce({ runId, signal } = {}) {
    if (used) return Promise.reject(new Error('Node CDP control already used.'))
    used = true
    if (!identifier(runId) || (signal !== undefined &&
        (typeof signal.aborted !== 'boolean' || typeof signal.addEventListener !== 'function' ||
          typeof signal.removeEventListener !== 'function'))) {
      return Promise.reject(new TypeError('Invalid Node CDP run.'))
    }
    const denied = (code) => freeze({ runId, serviceId: bound.serviceId, status: 'NOT_RUN',
      resourceStatus: 'NOT_RUN', errors: [code], resources: [], t0: null })
    // Atomic external acquisition precedes clock, socket, timer and registration.
    let lease
    try { lease = startGate.acquire(bound, runId) } catch { return Promise.resolve(denied('START_GATE')) }
    if (!record(lease) || lease.status !== 'ACQUIRED' || lease.serviceId !== bound.serviceId ||
        lease.webSocketUrl !== bound.webSocketUrl || lease.runId !== runId) {
      return Promise.resolve(denied('START_DENIED'))
    }

    return new Promise((resolve) => {
      const resources = Object.fromEntries(['connection', 'context', 'target', 'session', 'document',
        'registrations', 'timer'].map((name) => [name, 'notAttempted']))
      const commands = new Map()
      const targets = new Map()
      const attachments = new Map()
      const destroyed = new Set()
      const detached = new Set()
      const listeners = []
      const errors = new Set()
      const stages = []
      let socket, timer, stage, stageEnd, t0 = null, lastTime = null
      let resolveReport = resolve
      let sequence = 0, messageCount = 0, eventCount = 0
      let contextId, targetId, sessionId, frame, observedFrame
      let preContexts, preTargets, versionOK = false, discoveryOK = false
      let targetOK = false, pageEnabled = false, documentBound = false
      let disposalOK = false, absent = false, contextReturned = false
      let connected = false, connectionClosed = false, closeRequested = false, lost = false
      let evidenceAttempted = false, evidenceSaved = false, evidenceSnapshot
      let contextDeadlineChecked = false, controlsDeadlineChecked = false
      let finished = false, driving = false, rerun = false, clockBroken = false
      let controlCleanupAttempted = false
      let controlCleanupDone = false, timerUncertain = false, gateBlocked = false, gateAcknowledged = true
      let resourceStatus = 'PASS', status = 'PASS'

      const worsen = (previous, next) => previous === 'FAIL' || next === 'FAIL' ? 'FAIL' : 'UNPROVEN'
      function readTime() {
        const value = now()
        if (!Number.isFinite(value) || value < 0 || (lastTime !== null && value < lastTime)) {
          throw new Error('CLOCK')
        }
        lastTime = value
        return value
      }
      function block(verdict, code) {
        resourceStatus = worsen(resourceStatus, verdict)
        errors.add(code)
        // The owner must retain the block across factories, runs and service changes.
        try {
          if (startGate.block(lease, freeze({ runId, resourceStatus, code })) === true) {
            gateBlocked = true
          } else {
            gateAcknowledged = false
            errors.add('GATE_BLOCK_UNCONFIRMED')
          }
        } catch { gateAcknowledged = false; errors.add('GATE_BLOCK_UNCONFIRMED') }
      }
      function stop(code, verdict = 'UNPROVEN', at) {
        if (at === undefined) {
          // A synchronous dependency may have consumed the remaining stage time.
          if (!clockBroken) checkTime()
          at = lastTime ?? 0
        }
        if (code) { errors.add(code); status = worsen(status, verdict) }
        if (t0 === null) { t0 = at; stage = 'closing'; stageEnd = null }
      }
      function fault(code, verdict = 'FAIL') {
        stop(code, verdict)
        if (resources.context !== 'notAttempted' && !contextReturned) block('UNPROVEN', code)
      }
      function current() {
        try {
          if (startGate.isCurrent(lease) === true) return true
        } catch { /* A throwing owner is not proof of the original service. */ }
        lost = true
        fault('SERVICE_BINDING_LOST', 'UNPROVEN')
        block('UNPROVEN', 'SERVICE_BINDING_LOST')
        return false
      }
      function enter(next) {
        stage = next
        const start = readTime()
        stageEnd = start + WAIT_MS
        stages.push({ name: next, start, deadline: stageEnd, confirmedAt: null })
      }
      function completeStage() {
        checkTime()
        if (t0 !== null) return false
        stages[stages.length - 1].confirmedAt = lastTime
        return true
      }
      function checkTime() {
        const time = readTime()
        if (t0 === null && stageEnd !== undefined && time >= stageEnd) {
          const deadline = stageEnd
          stop('SETUP_DEADLINE', 'UNPROVEN', deadline)
          block('UNPROVEN', 'SETUP_DEADLINE')
        }
        if (t0 !== null) {
          if (!evidenceSaved && time >= t0 + 10_000) {
            errors.add('EVIDENCE_DEADLINE'); status = worsen(status, 'UNPROVEN')
          }
          if (!contextDeadlineChecked && time >= t0 + 30_000) {
            contextDeadlineChecked = true
            if (!contextReturned && resources.context !== 'notAttempted') block('UNPROVEN', 'CONTEXT_DEADLINE')
          }
          if (!controlsDeadlineChecked && time >= t0 + 85_000) {
            controlsDeadlineChecked = true
            if (!connectionClosed || !controlCleanupDone) {
              const definitelyOpen = socket?.readyState === 1 && !connectionClosed
              block(definitelyOpen ? 'FAIL' : 'UNPROVEN', 'CONTROL_DEADLINE')
            }
          }
          if (time >= t0 + 90_000) block('UNPROVEN', 'REPORT_DEADLINE')
        }
        return time
      }
      function attempt(name) { resources[name] = 'possible' }
      function addListener(target, name, listener) {
        attempt('registrations')
        // Retain even a possibly installed listener if registration throws.
        listeners.push({ target, name, listener })
        target.addEventListener(name, listener)
        resources.registrations = 'confirmed'
      }
      function closeConnection() {
        if (closeRequested || connectionClosed || !socket) return
        closeRequested = true
        try { socket.close() } catch { block('UNPROVEN', 'CONNECTION_CLOSE_FAILED') }
      }
      function cancelTimer() {
        if (timer === undefined) return !timerUncertain
        const handle = timer
        timer = undefined
        try { cancel(handle); resources.timer = timerUncertain ? 'possible' : 'closed' }
        catch {
          timerUncertain = true
          resources.timer = 'possible'
          block('UNPROVEN', 'TIMER_CANCEL_FAILED')
        }
        return !timerUncertain
      }
      function finish() {
        if (finished) return
        if (!controlCleanupAttempted) {
          controlCleanupAttempted = true
          cancelTimer()
          for (const entry of listeners.splice(0)) {
            try { entry.target.removeEventListener(entry.name, entry.listener) }
            catch {
              listeners.push(entry)
              block('UNPROVEN', 'LISTENER_REMOVE_FAILED')
            }
          }
          if (resources.registrations !== 'notAttempted') {
            resources.registrations = listeners.length === 0 ? 'closed' : 'possible'
          }
        }
        // Latch lateness after all cleanup hooks, before claiming timely completion.
        // A clock failure may re-enter finish; never retry or erase uncertain removals.
        if (!clockBroken) checkTime()
        controlCleanupDone = listeners.length === 0 && !timerUncertain && resources.timer !== 'possible'
        if (!['closed', 'notAttempted'].includes(resources.connection)) block('UNPROVEN', 'CONNECTION_UNCONFIRMED')
        if (resources.context !== 'notAttempted' && !contextReturned) block('UNPROVEN', 'RETURN_UNCONFIRMED')
        if (!evidenceSaved) { status = worsen(status, 'UNPROVEN'); block('UNPROVEN', 'EVIDENCE_UNCONFIRMED') }
        const report = () => freeze({ runId, serviceId: bound.serviceId,
          status: resourceStatus === 'FAIL' || status === 'FAIL' ? 'FAIL' :
            resourceStatus === 'UNPROVEN' || status === 'UNPROVEN' ? 'UNPROVEN' : 'PASS',
          resourceStatus, t0, finishedAt: lastTime, stages: stages.map((entry) => ({ ...entry })),
          documentBound, evidenceSaved, contextReturned, connectionClosed,
          gateBlocked, gateAcknowledged, errors: [...errors],
          resources: Object.entries(resources).map(([name, state]) => ({ name, state })),
          notApplicable: ['gateway', 'fixtures'], runtimeRecord: null })
        // No callback may improve a latched verdict or restart this run.
        finished = true
        commands.clear(); targets.clear(); attachments.clear(); destroyed.clear(); detached.clear()
        frame = observedFrame = preContexts = preTargets = evidenceSnapshot = undefined
        contextId = targetId = sessionId = undefined
        socket = undefined
        try {
          if (startGate.complete(lease, report()) !== true) throw new Error('ACK')
        } catch { gateAcknowledged = false; block('UNPROVEN', 'GATE_COMPLETE_UNCONFIRMED') }
        // Include time consumed by the synchronous external completion hook.
        if (!clockBroken) {
          try { checkTime() } catch { clockBroken = true; block('UNPROVEN', 'CLOCK_UNRELIABLE') }
        }
        const complete = resolveReport
        resolveReport = undefined
        complete(report())
      }
      function dispatch(action) {
        if (finished) return
        try { checkTime(); action(); pump() }
        catch {
          clockBroken = true
          stop('CONTROL_DEPENDENCY_FAILED', 'UNPROVEN', lastTime ?? 0)
          block('UNPROVEN', 'CONTROL_DEPENDENCY_FAILED')
          closeConnection()
          finish()
        }
      }
      function send(key, method, params, onResult, session) {
        if (commands.has(key) || lost || !connected || connectionClosed || !current()) return
        checkTime()
        if (t0 !== null && key !== 'dispose' && key !== 'recheck') return
        const id = ++sequence
        const command = { id, method, session, onResult, answered: false }
        commands.set(key, command)
        const packet = { id, method, params }
        if (session !== undefined) packet.sessionId = session
        try { socket.send(JSON.stringify(packet)) }
        catch { fault('COMMAND_SEND_FAILED', 'UNPROVEN') }
      }
      function isOwnTarget(info) {
        return info && info.targetId === targetId && info.browserContextId === contextId &&
          info.type === 'page' && info.url === 'about:blank'
      }
      function acceptFrame(value) {
        if (!record(value) || !identifier(value.id) || !identifier(value.loaderId) ||
            own(value, 'parentId') || value.url !== 'about:blank') return null
        return { id: value.id, loaderId: value.loaderId }
      }
      function handleEvent(packet) {
        if (++eventCount > MAX_EVENTS) { fault('EVENT_LIMIT'); return }
        const p = packet.params
        if (!record(p)) { fault('EVENT_SHAPE'); return }
        if (packet.method.startsWith('Target.') && own(packet, 'sessionId')) {
          fault('EVENT_SESSION'); return
        }
        if (packet.method === 'Target.targetCreated' || packet.method === 'Target.targetInfoChanged') {
          const info = targetInfo(p.targetInfo)
          if (!info) { fault('TARGET_INFO'); return }
          if (!targets.has(info.targetId) && targets.size >= MAX_ENTRIES) { fault('TARGET_BUFFER_LIMIT'); return }
          targets.set(info.targetId, info)
          if (targetId === info.targetId && !isOwnTarget(info)) fault('TARGET_BINDING')
          if (contextId && info.browserContextId === contextId &&
              (info.type !== 'page' || info.url !== 'about:blank' ||
                (targetId && info.targetId !== targetId))) fault('UNEXPECTED_OWN_TARGET')
        } else if (packet.method === 'Target.attachedToTarget') {
          const info = targetInfo(p.targetInfo)
          if (!identifier(p.sessionId) || !info) { fault('ATTACH_EVENT'); return }
          if (attachments.has(p.sessionId) || attachments.size >= MAX_ENTRIES) {
            fault('SESSION_BUFFER_LIMIT'); return
          }
          attachments.set(p.sessionId, info)
        } else if (packet.method === 'Target.targetDestroyed') {
          if (!identifier(p.targetId) || destroyed.size >= MAX_ENTRIES) { fault('DESTROY_EVENT'); return }
          destroyed.add(p.targetId)
          if (p.targetId === targetId && t0 === null) fault('EARLY_TARGET_END')
        } else if (packet.method === 'Target.detachedFromTarget') {
          if (!identifier(p.sessionId) || detached.size >= MAX_ENTRIES) { fault('DETACH_EVENT'); return }
          if (p.sessionId === sessionId && own(p, 'targetId') && p.targetId !== targetId) {
            fault('DETACH_TARGET_BINDING'); return
          }
          detached.add(p.sessionId)
          if (p.sessionId === sessionId && t0 === null) fault('EARLY_SESSION_END')
        } else if (packet.method === 'Page.frameDetached' && packet.sessionId === sessionId && sessionId) {
          if (t0 === null) fault('EARLY_DOCUMENT_END')
        } else if (packet.method === 'Page.navigatedWithinDocument' && packet.sessionId === sessionId && sessionId) {
          fault('DOCUMENT_GENERATION')
        } else if (packet.method === 'Page.frameNavigated' && packet.sessionId === sessionId && sessionId) {
          const candidate = acceptFrame(p.frame)
          const previous = frame ?? observedFrame
          if (!candidate || (previous && (candidate.id !== previous.id || candidate.loaderId !== previous.loaderId))) {
            fault('DOCUMENT_GENERATION'); return
          }
          observedFrame = candidate
        }
        // Other bounded events (including foreign Page events) never prove success.
      }
      function receive(event) {
        if (lost || connectionClosed) return
        if (!current()) return
        if (++messageCount > MAX_MESSAGES) { fault('MESSAGE_LIMIT'); lost = true; return }
        const raw = event.data
        if (typeof raw !== 'string' || raw.length > MAX_MESSAGE_BYTES ||
            Buffer.byteLength(raw, 'utf8') > MAX_MESSAGE_BYTES) { fault('MESSAGE_SIZE_OR_TYPE'); return }
        let packet
        try { packet = JSON.parse(raw) } catch { fault('MESSAGE_JSON'); return }
        if (!record(packet)) { fault('MESSAGE_SHAPE'); return }
        if (own(packet, 'id')) {
          const command = [...commands.values()].find((entry) => entry.id === packet.id)
          if (!Number.isSafeInteger(packet.id) || !command || command.answered || own(packet, 'method') ||
              packet.sessionId !== command.session ||
              (command.session === undefined && own(packet, 'sessionId')) ||
              own(packet, 'result') === own(packet, 'error')) { fault('RESPONSE_CORRELATION'); return }
          command.answered = true
          if (own(packet, 'error')) { fault('CDP_ERROR'); return }
          if (!record(packet.result)) { fault('RESULT_SHAPE'); return }
          command.onResult(packet.result)
        } else if (typeof packet.method === 'string' && !own(packet, 'result') && !own(packet, 'error')) {
          handleEvent(packet)
        } else fault('MESSAGE_SHAPE')
      }
      function saveEvidence() {
        if (evidenceAttempted) return
        evidenceAttempted = true
        evidenceSnapshot = freeze({ runId, serviceId: bound.serviceId, t0,
          versionMatched: versionOK, documentBound,
          context: contextId ?? null, target: targetId ?? null, session: sessionId ?? null,
          document: frame ? { ...frame } : null, errors: [...errors],
          resources: Object.entries(resources).map(([name, state]) => ({ name, state })) })
        let saved = false
        try { saved = evidence.save(evidenceSnapshot) === true }
        catch { errors.add('EVIDENCE_SAVE_FAILED') }
        checkTime()
        evidenceSaved = saved && lastTime < t0 + 10_000
        if (!evidenceSaved) { status = worsen(status, 'UNPROVEN'); block('UNPROVEN', 'EVIDENCE_UNCONFIRMED') }
      }
      function closing() {
        saveEvidence()
        if (contextId && !lost && !connectionClosed) {
          send('dispose', 'Target.disposeBrowserContext', { browserContextId: contextId }, (result) => {
            if (!empty(result)) { fault('DISPOSAL_RESULT'); return }
            disposalOK = true
          })
          if (disposalOK) send('recheck', 'Target.getBrowserContexts', {}, (result) => {
            const contexts = contextList(result.browserContextIds)
            if (!contexts) { fault('CONTEXT_RECHECK'); return }
            if (contexts.has(contextId)) { block('FAIL', 'CONTEXT_REMAINS'); return }
            absent = true
          })
          const targetEnded = resources.target === 'notAttempted' ||
            (targetId && destroyed.has(targetId))
          const sessionEnded = resources.session === 'notAttempted' ||
            (sessionId && detached.has(sessionId))
          if (!contextReturned && disposalOK && absent && targetEnded && sessionEnded) {
            checkTime()
            if (lastTime >= t0 + 30_000) block('UNPROVEN', 'LATE_CONTEXT_RETURN')
            contextReturned = true
            for (const name of ['context', 'target', 'session', 'document']) {
              if (resources[name] !== 'notAttempted') resources[name] = 'closed'
            }
          }
        }
        if (contextReturned || resources.context === 'notAttempted' || lost || contextDeadlineChecked) closeConnection()
        if (connectionClosed || resources.connection === 'notAttempted' || controlsDeadlineChecked || clockBroken) finish()
      }
      function advance() {
        checkTime()
        if (t0 !== null) { closing(); return }
        if (stage === 'connection' && connected && completeStage()) enter('binding')
        if (stage === 'binding') {
          send('version', 'Browser.getVersion', {}, (result) => {
            if (!VERSION_KEYS.every((key) => result[key] === bound.version[key])) { fault('VERSION_BINDING'); return }
            versionOK = true
          })
          if (versionOK) send('inventory', 'Target.getBrowserContexts', {}, (result) => {
            preContexts = contextList(result.browserContextIds)
            if (!preContexts) fault('CONTEXT_INVENTORY')
          })
          if (preContexts) send('discover', 'Target.setDiscoverTargets', { discover: true }, (result) => {
            if (!empty(result)) { fault('DISCOVERY_RESULT'); return }
            discoveryOK = true
          })
          if (discoveryOK && completeStage()) {
            preTargets = new Set(targets.keys())
            enter('context')
          }
        }
        if (stage === 'context') {
          if (!commands.has('createContext')) {
            attempt('context')
            send('createContext', 'Target.createBrowserContext', {}, (result) => {
              if (!identifier(result.browserContextId) || preContexts.has(result.browserContextId)) {
                fault('CONTEXT_IDENTITY'); return
              }
              contextId = result.browserContextId
              resources.context = 'confirmed'
            })
          }
          if (contextId && completeStage()) enter('document')
        }
        if (stage === 'document') {
          if (!commands.has('createTarget')) {
            attempt('target'); attempt('document')
            send('createTarget', 'Target.createTarget', { url: 'about:blank', browserContextId: contextId }, (result) => {
              if (!identifier(result.targetId) || preTargets.has(result.targetId) || destroyed.has(result.targetId)) {
                fault('TARGET_IDENTITY'); return
              }
              targetId = result.targetId
              resources.target = 'confirmed'
            })
          }
          if (targetId && targets.has(targetId)) {
            if (!isOwnTarget(targets.get(targetId)) || [...targets.values()].some((info) =>
              info.browserContextId === contextId && info.targetId !== targetId)) { fault('TARGET_BINDING'); return }
            send('targetInfo', 'Target.getTargetInfo', { targetId }, (result) => {
              if (!isOwnTarget(targetInfo(result.targetInfo))) { fault('TARGET_BINDING'); return }
              targetOK = true
            })
          }
          if (targetOK && !commands.has('attach')) {
            attempt('session')
            send('attach', 'Target.attachToTarget', { targetId, flatten: true }, (result) => {
              if (!identifier(result.sessionId) || detached.has(result.sessionId)) { fault('SESSION_IDENTITY'); return }
              sessionId = result.sessionId
              resources.session = 'confirmed'
            })
          }
          if (sessionId && attachments.has(sessionId)) {
            if (!isOwnTarget(attachments.get(sessionId)) || [...attachments.entries()].some(([id, info]) =>
              info.targetId === targetId && id !== sessionId)) { fault('SESSION_BINDING'); return }
            send('page', 'Page.enable', {}, (result) => {
              if (!empty(result)) { fault('PAGE_ENABLE'); return }
              pageEnabled = true
            }, sessionId)
          }
          if (pageEnabled) send('frame', 'Page.getFrameTree', {}, (result) => {
            const tree = result.frameTree
            const candidate = record(tree) && acceptFrame(tree.frame)
            if (!candidate || (own(tree, 'childFrames') &&
                (!Array.isArray(tree.childFrames) || tree.childFrames.length !== 0)) ||
                (observedFrame && (observedFrame.id !== candidate.id || observedFrame.loaderId !== candidate.loaderId))) {
              fault('DOCUMENT_BINDING'); return
            }
            frame = candidate
            resources.document = 'confirmed'
            if (completeStage()) { documentBound = true; stop(null) }
          }, sessionId)
        }
      }
      function arm() {
        if (!cancelTimer()) {
          stop('TIMER_CANCEL_FAILED', 'UNPROVEN')
          closeConnection()
          finish()
          return
        }
        if (finished) return
        checkTime()
        // Cancellation can consume the setup budget; begin cleanup in this dispatch.
        if (t0 !== null) {
          closing()
          if (finished) return
        }
        const deadline = t0 === null ? stageEnd :
          !contextDeadlineChecked ? t0 + 30_000 : t0 + 85_000
        attempt('timer')
        timer = schedule(() => {
          if (finished) return
          timer = undefined
          resources.timer = 'closed'
          dispatch(() => {})
        }, Math.max(0, deadline - lastTime))
        if (timer === undefined || timer === null) throw new Error('TIMER')
        resources.timer = 'confirmed'
      }
      function pump() {
        if (finished) return
        if (driving) { rerun = true; return }
        driving = true
        try {
          do {
            rerun = false
            const before = `${stage}:${commands.size}:${t0}`
            advance()
            if (before !== `${stage}:${commands.size}:${t0}`) rerun = true
          } while (rerun && !finished)
          if (!finished) arm()
        } finally { driving = false }
      }

      dispatch(() => {
        if (!current()) return
        if (signal?.aborted) { stop('OPERATOR_ABORT', 'UNPROVEN'); return }
        enter('connection')
        if (signal) addListener(signal, 'abort', () => dispatch(() => stop('OPERATOR_ABORT', 'UNPROVEN')))
        checkTime()
        if (t0 !== null || !current()) return
        checkTime()
        if (t0 !== null) return
        attempt('connection')
        socket = createWebSocket(bound.webSocketUrl)
        if (!socket || socket.url !== bound.webSocketUrl || socket.readyState !== 0) {
          fault('CONNECTION_BINDING'); return
        }
        addListener(socket, 'open', () => dispatch(() => {
          if (connected || connectionClosed || socket.readyState !== 1 || socket.url !== bound.webSocketUrl) {
            fault('CONNECTION_BINDING'); return
          }
          connected = true; resources.connection = 'confirmed'
        }))
        addListener(socket, 'message', (event) => dispatch(() => receive(event)))
        addListener(socket, 'error', () => dispatch(() => fault('WEBSOCKET_ERROR', 'UNPROVEN')))
        addListener(socket, 'close', () => dispatch(() => {
          connectionClosed = true; resources.connection = 'closed'
          if (!closeRequested) {
            lost = true; fault('CONNECTION_LOST', 'UNPROVEN')
            if (resources.context !== 'notAttempted' && !contextReturned) block('UNPROVEN', 'CONNECTION_LOST')
          }
        }))
      })
    })
  }
  return Object.freeze({ runOnce })
}
