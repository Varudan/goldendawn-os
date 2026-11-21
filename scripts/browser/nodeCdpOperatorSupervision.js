import { EventEmitter } from 'node:events'
import * as fs from 'node:fs'
import { randomUUID } from 'node:crypto'
import { performance } from 'node:perf_hooks'
import { resolve, isAbsolute, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createNodeCdpOperatorSession, createNodeCdpOperatorSessionForTest } from './nodeCdpOperatorSession.js'

export const SUPERVISION_LIMITS = Object.freeze({
  inputBytes: 8_192, commands: 128, intervalMs: 1_000, lifetimeMs: 1_800_000,
  offerMs: 15_000, responseMs: 1_000, offers: 32, records: 2_048,
  recordBytes: 16_384, totalBytes: 8_388_608,
})
const IDS = ['sessionId', 'sessionGeneration', 'serviceId', 'serviceGeneration']
const nativePorts = {
  now: () => performance.now(), utc: () => new Date().toISOString(), uuid: randomUUID,
  schedule: (callback, delay) => setTimeout(callback, delay), cancel: (timer) => clearTimeout(timer),
}
const identifier = (value) => typeof value === 'string' && /^[A-Za-z0-9._:-]{1,128}$/.test(value)
function fields(value, names) {
  try {
    if (!value || ![Object.prototype, null].includes(Object.getPrototypeOf(value)) || Reflect.ownKeys(value).length !== names.length) return null
    const result = Object.create(null)
    for (const name of names) {
      const descriptor = Object.getOwnPropertyDescriptor(value, name)
      if (!descriptor || !Object.hasOwn(descriptor, 'value')) return null
      result[name] = descriptor.value
    }
    return result
  } catch { return null }
}
function freeze(value) {
  if (value && typeof value === 'object') { for (const child of Object.values(value)) freeze(child); Object.freeze(value) }
  return value
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const closed = (value) => value === 'closed' || value === 'notAttempted'

/** No option/port reads, Session construction, registration or IO at factory time. */
export function createNodeCdpOperatorSupervision(options) { return createSupervision(options, nativePorts, null) }
/** Explicit simulated composition. Missing dependencies never select native ports. */
export function createNodeCdpOperatorSupervisionForTest(options, ports, sessionPorts, hostPorts) {
  return createSupervision(options, ports, { sessionPorts, hostPorts })
}

function createSupervision(options, suppliedPorts, test) {
  let phase = 'NEW', ports, io, session, sessionInput, sessionSignals, completion, original = null
  let sessionBeginCalled = false
  let busy = false, lastTime = -1, beganAt = null, expiresAt = null, timer, activeOffer = null, acceptance = null
  let timerEpoch = 0, decisionEpoch = 0, arming = false, inputExhausted = false
  let noticePending = false, noticeSent = false, publishing = false, inputPauseAttempted = false, inputPauseUnconfirmed = false
  let latest = null, lastIdentity = null, retainedPositions = [], pending = '', terminalSent = false
  let inputState = 'notAttempted', timerState = 'notAttempted', evidenceState = 'notAttempted'
  let originalOutputState = 'notAttempted', observationOutputState = 'notAttempted'
  let sessionOutputBytes = 0, sessionOutputCount = 0, originalStopSent = false, everObservedService = false
  const errors = new Set(), registrations = [], offerIds = new Set()
  const counts = { commands: 0, offers: 0, records: 0, bytes: 0, addAttempts: 0, removeAttempts: 0,
    timerAdds: 0, timerRemoves: 0, timerFirings: 0, observations: 0, inputPauseAttempts: 0 }

  function fail(code) {
    errors.add(code); activeOffer = null; noticePending = true
    if (!originalStopSent && session) {
      originalStopSent = true
      try { session.stop(code === 'INPUT_LOST' ? 'INPUT_ERROR' : 'EVIDENCE_ERROR') } catch { errors.add('SESSION_STOP_UNCONFIRMED') }
    }
  }
  function time() {
    let value
    try { value = ports.now() } catch { fail('CLOCK_UNCERTAIN'); throw new Error('CLOCK') }
    if (!Number.isFinite(value) || value < 0 || value < lastTime) { fail('CLOCK_UNCERTAIN'); throw new Error('CLOCK') }
    lastTime = value
    return value
  }
  function within(start, offer = null) {
    time()
    return timeValid(start, offer)
  }
  function timeValid(start, offer = null) {
    if (lastTime >= start + SUPERVISION_LIMITS.responseMs) { fail('RESPONSE_EXPIRED'); return false }
    if (lastTime >= expiresAt) { fail('OBSERVATION_LIMIT'); return false }
    return !offer || lastTime < offer.expiresAtMonotonic
  }
  function outputStatus() {
    if (originalOutputState === 'UNPROVEN' || observationOutputState === 'UNPROVEN') return 'UNPROVEN'
    return originalOutputState === 'CONFIRMED' || observationOutputState === 'CONFIRMED' ? 'CONFIRMED' : 'notAttempted'
  }
  function originalOutput(text) {
    if (originalOutputState === 'UNPROVEN') return false
    const wasBusy = busy, wasPublishing = publishing; busy = true; publishing = true
    try {
      const size = Buffer.byteLength(text)
      if (typeof text !== 'string' || size > 262_144 || ++sessionOutputCount > 64 || sessionOutputBytes + size > 1_048_576) throw new Error('LIMIT')
      sessionOutputBytes += size
      if (io.output(text) !== true) throw new Error('OUTPUT')
      originalOutputState = 'CONFIRMED'
      return true
    } catch { originalOutputState = 'UNPROVEN'; fail('OUTPUT_LOST'); return false }
    finally { publishing = wasPublishing; busy = wasBusy; terminalNotice() }
  }
  function identity(state) {
    if (!state.host) return null
    const result = Object.fromEntries(IDS.map((key) => [key, state.host[key]]))
    for (const key of IDS) {
      if (result[key] !== null && !identifier(result[key])) throw new Error('IDENTITY')
      if (state.host.processObservation[key] !== result[key]) throw new Error('IDENTITY')
    }
    if ((result.serviceId === null) !== (result.serviceGeneration === null)) throw new Error('IDENTITY')
    return result
  }
  function positions(state, report) {
    const result = [], host = state.host
    const add = (name, value, observation, location = null) => result.push({ name, state: value, observation, location })
    if (host) {
      const r = host.resources
      if (host.reserved) add('reservation', 'retained', 'NOT_REOBSERVED', `${host.directory}\\reservation.json`)
      else if (host.phase === 'FAILED') {
        add('reservation', 'possible', 'UNPROVEN', `${host.directory}\\reservation.json`)
        add('reservation.fileHandle', 'possible', 'UNPROVEN')
      }
      if (r.profile.state !== 'notAttempted') add('profile', r.profile.state, 'NOT_REOBSERVED', r.profile.path)
      add('service.process', r.process, host.processObservation.status)
      add('service.stdout', r.stdout, r.stdout === 'confirmed' ? 'DRAIN_ATTACHED' : r.stdout === 'closed' ? 'CLOSE_OBSERVED' : 'UNPROVEN')
      add('service.stderr', r.stderr, r.stderr === 'confirmed' ? 'DRAIN_ATTACHED' : r.stderr === 'closed' ? 'CLOSE_OBSERVED' : 'UNPROVEN')
      add('service.registrations', r.processRegistrations,
        r.remainingProcessRegistrations === 0 && closed(r.processRegistrations) ? 'CLOSE_OBSERVED' : 'REGISTRATIONS_RETAINED')
    }
    if (report.preparation) {
      for (const key of ['connection', 'registrations', 'timer']) {
        if (Object.hasOwn(report.preparation, key)) add(`preparation.${key}`, report.preparation[key], 'HISTORICAL_NOT_REOBSERVED')
      }
    }
    if (report.control) {
      if (Array.isArray(report.control.resources)) {
        for (const entry of report.control.resources) add(`control.${entry.name}`, entry.state, 'HISTORICAL_NOT_REOBSERVED')
      } else if (report.control.resourceStatus === 'UNPROVEN' || report.control.resourceStatus === 'FAIL') {
        add('control.unresolved', 'possible', 'UNPROVEN')
      }
    }
    for (const key of ['file', 'timer', 'inputListeners']) add(`session.${key}`, report.resources[key], 'SESSION_REPORT')
    report.resources.helpers.forEach((helper, index) => {
      for (const key of ['process', 'stdout', 'stderr', 'registrations', 'timer']) add(`helper.${index}.${key}`, helper[key], 'SESSION_REPORT')
    })
    return result
  }
  function read(operationStart = null) {
    counts.observations++
    let stamp = null, utc = null, projected = null
    try {
      stamp = time(); utc = ports.utc()
      const start = operationStart ?? stamp
      if (typeof utc !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(utc)) throw new Error('TIME')
      const before = session.inspect(), first = identity(before), report = session.report()
      if (!within(start)) throw new Error('TIME')
      // No external clock/IO call is made between this final identity read and
      // construction of the result. Earlier now hooks cannot stale this identity.
      const after = session.inspect(), current = identity(after)
      if (!same(first, current) || (lastIdentity && IDS.some((key) => lastIdentity[key] !== null && lastIdentity[key] !== current?.[key]))) {
        fail('IDENTITY_UNCERTAIN'); throw new Error('IDENTITY')
      }
      if (report.errors.includes('CLOCK')) { fail('CLOCK_UNCERTAIN'); throw new Error('CLOCK') }
      const inventory = positions(after, report), host = after.host
      const liveClosed = !!host && host.processExited && host.processClosed &&
        closed(host.resources.stdout) && closed(host.resources.stderr) && host.resources.processRegistrations === 'closed' &&
        host.resources.remainingProcessRegistrations === 0
      const ending = host?.processExited || host?.processClosed
      const previouslyConfirmed = everObservedService || report.preparation?.status === 'READY'
      if (previouslyConfirmed && host?.processObservation.status !== 'CONFIRMED' && !ending) {
        fail('OBSERVATION_LOST')
      }
      if (host?.processObservation.status === 'CONFIRMED') everObservedService = true
      projected = { observedAtMonotonic: stamp, observedAtUtc: utc, sessionPhase: after.phase,
        identity: current, startsBlocked: after.startsBlocked || !!host?.blocked,
        serviceObservation: host?.processObservation.status ?? 'NOT_ATTEMPTED',
        processReferenceHeld: host?.resources.processReferenceHeld ?? false,
        serviceResourcesClosed: liveClosed, positions: inventory,
        sessionResourceStatus: original?.resourceStatus ?? report.resourceStatus,
        sessionFileEvidence: original?.fileEvidence.status ?? after.fileEvidence }
      // No earlier positive subprojection survives uncertainty anywhere in this read.
      if (!errors.has('CLOCK_UNCERTAIN') && !errors.has('IDENTITY_UNCERTAIN') && !errors.has('OBSERVATION_LOST') && !errors.has('RESPONSE_EXPIRED')) {
        lastIdentity = current ? freeze({ ...current }) : lastIdentity
        retainedPositions = freeze(inventory.filter((entry) => !closed(entry.state)).map((entry) => ({ ...entry })))
      }
    } catch { fail('OBSERVATION_LOST') }
    const uncertain = errors.has('CLOCK_UNCERTAIN') || errors.has('IDENTITY_UNCERTAIN') || errors.has('OBSERVATION_LOST') || errors.has('RESPONSE_EXPIRED')
    if (!projected || uncertain) projected = {
      observedAtMonotonic: stamp, observedAtUtc: utc, sessionPhase: projected?.sessionPhase ?? latest?.sessionPhase ?? 'UNKNOWN',
      identity: lastIdentity, startsBlocked: true, serviceObservation: 'UNPROVEN', processReferenceHeld: latest?.processReferenceHeld ?? false,
      serviceResourcesClosed: false, positions: retainedPositions.map((entry) => ({ ...entry, observation: 'UNPROVEN' })),
      sessionResourceStatus: original?.resourceStatus ?? latest?.sessionResourceStatus ?? 'UNPROVEN',
      sessionFileEvidence: original?.fileEvidence.status ?? latest?.sessionFileEvidence ?? 'UNPROVEN',
    }
    latest = freeze({ ...projected, observationStatus: uncertain ? 'UNPROVEN' : 'CONFIRMED' })
    return latest
  }
  function summary(observation = latest) {
    if (observation && ['CLOCK_UNCERTAIN', 'IDENTITY_UNCERTAIN', 'OBSERVATION_LOST', 'RESPONSE_EXPIRED'].some((code) => errors.has(code))) {
      observation = { ...observation, observationStatus: 'UNPROVEN', serviceObservation: 'UNPROVEN',
        serviceResourcesClosed: false, positions: observation.positions.map((entry) => ({ ...entry, observation: 'UNPROVEN' })) }
    }
    const currentAcceptance = acceptance ? { ...acceptance,
      serviceObservationConfirmed: observation?.observationStatus === 'CONFIRMED' && observation.serviceObservation === 'CONFIRMED',
      resourceClosureConfirmed: observation?.observationStatus === 'CONFIRMED' && observation.positions.every((entry) => closed(entry.state)),
      historicalResponsibilityAccepted: true } : null
    const openPositions = observation?.observationStatus === 'UNPROVEN'
      ? retainedPositions.map((entry) => ({ ...entry, observation: 'UNPROVEN' })) : retainedPositions
    return freeze({ phase, observation, lastReliableIdentity: lastIdentity, openPositions,
      offer: activeOffer, acceptance: currentAcceptance, errors: [...errors],
      observationAvailable: !!observation && observation.observationStatus === 'CONFIRMED',
      evidenceSaved: evidenceState === 'CONFIRMED' && !errors.has('EVIDENCE_LOST'),
      resources: { input: inputState, timer: timerState, output: outputStatus(),
        originalOutput: originalOutputState, observationOutput: observationOutputState, evidence: evidenceState,
        evidenceHandles: evidenceState === 'UNPROVEN' ? 'possible' : evidenceState === 'CONFIRMED' ? 'closed' : 'notAttempted',
        remainingListeners: registrations.filter((entry) => entry.state !== 'closed').length },
      counts: { ...counts }, originalSessionResourceStatus: original?.resourceStatus ?? null,
      overallGate: 'FAIL', causeStatus: 'CAUSE_NOT_PROVEN', evidenceClass: 'NOT_EVIDENCE', runtimeRecord: null })
  }
  function enter() {
    if (busy) { fail('REENTRANT'); return false }
    busy = true; return true
  }
  function inspect() {
    if (phase === 'NEW') return summary()
    if (!enter()) return summary()
    try {
      let start
      try { start = time() } catch { terminalNotice(); return summary() }
      terminalNotice()
      let observation = session ? read(start) : latest
      if (noticePending && !noticeSent) {
        terminalNotice()
        observation = session ? read(start) : latest
      }
      // No effect follows construction of a fresh positive returned graph.
      return summary(observation)
    } finally { busy = false }
  }
  function terminalNotice() {
    if (!io || !noticePending || noticeSent || publishing) return
    // The one reserved negative record is consumed before callbacks. It never
    // claims a fresh observation, successful close, or a persisted IO receipt.
    noticeSent = true; noticePending = false
    const text = JSON.stringify({ type: 'node-cdp-supervision', role: 'NEGATIVE_TERMINAL',
      status: phase === 'CLOSED' ? 'OBSERVATION_STOPPED' : 'UNPROVEN', phase,
      reason: [...errors][0] ?? 'EXPLICIT_CLOSE', observation: 'UNPROVEN',
      evidence: evidenceState === 'UNPROVEN' ? 'LOST' : 'RECEIPT_UNCONFIRMED',
      output: outputStatus() === 'UNPROVEN' ? 'LOST' : 'RECEIPT_UNCONFIRMED',
      originalOutput: originalOutputState === 'UNPROVEN' ? 'LOST' : 'RECEIPT_UNCONFIRMED',
      observationOutput: observationOutputState === 'UNPROVEN' ? 'LOST' : 'RECEIPT_UNCONFIRMED',
      remainingListeners: registrations.filter((entry) => entry.state !== 'closed').length,
      timer: timerState, input: inputState,
      counts: { addAttempts: counts.addAttempts, removeAttempts: counts.removeAttempts,
        timerAdds: counts.timerAdds, timerRemoves: counts.timerRemoves, timerFirings: counts.timerFirings,
        inputPauseAttempts: counts.inputPauseAttempts } }) + '\n'
    const bytes = Buffer.byteLength(text)
    if (bytes > 1_024 || counts.records >= SUPERVISION_LIMITS.records || counts.bytes + bytes > SUPERVISION_LIMITS.totalBytes) {
      errors.add('NEGATIVE_NOTICE_UNCONFIRMED'); return
    }
    counts.records++; counts.bytes += bytes
    const wasBusy = busy; busy = true; publishing = true
    try {
      if (evidenceState !== 'UNPROVEN') {
        try {
          if (io.save(text) !== true) throw new Error('SAVE')
          evidenceState = 'CONFIRMED'
        } catch { evidenceState = 'UNPROVEN'; fail('EVIDENCE_LOST') }
      }
      if (observationOutputState !== 'UNPROVEN') {
        try {
          if (io.observe(text) !== true) throw new Error('OUTPUT')
          observationOutputState = 'CONFIRMED'
        } catch { observationOutputState = 'UNPROVEN'; fail('OUTPUT_LOST') }
      }
    } finally { publishing = false; busy = wasBusy }
  }
  function publish(kind, value, operationStart = null) {
    let start, text, stage = 'before'
    const wasPublishing = publishing; publishing = true
    try {
      // A lost channel is never silently reconnected or promoted by a later call.
      if (evidenceState === 'UNPROVEN' || outputStatus() === 'UNPROVEN') return false
      start = operationStart ?? time()
      if (!within(start)) return false
      // This is deliberately a proposal/captured observation, never an IO receipt.
      text = JSON.stringify({ type: 'node-cdp-supervision', role: 'PRELIMINARY', kind,
        sequence: counts.records + 1, value }) + '\n'
      const bytes = Buffer.byteLength(text)
      if (bytes > SUPERVISION_LIMITS.recordBytes || counts.records >= SUPERVISION_LIMITS.records - 1 ||
          counts.bytes + bytes > SUPERVISION_LIMITS.totalBytes - 1_024) { fail('OUTPUT_LIMIT'); return false }
      counts.records++; counts.bytes += bytes
      stage = 'save'
      if (io.save(text) !== true) { evidenceState = 'UNPROVEN'; fail('EVIDENCE_LOST'); return false }
      evidenceState = 'CONFIRMED'
      if (!within(start)) return false
      stage = 'output'
      if (io.observe(text) !== true) { observationOutputState = 'UNPROVEN'; fail('OUTPUT_LOST'); return false }
      observationOutputState = 'CONFIRMED'
      return within(start)
    } catch {
      if (stage === 'save') { evidenceState = 'UNPROVEN'; fail('EVIDENCE_LOST') }
      else if (stage === 'output') { observationOutputState = 'UNPROVEN'; fail('OUTPUT_LOST') }
      else fail('OBSERVATION_LOST')
      return false
    } finally { publishing = wasPublishing; terminalNotice() }
  }
  function acceptable(observation) {
    return phase === 'ACTIVE' && errors.size === 0 && original && terminalSent &&
      observation.observationStatus === 'CONFIRMED' && observation.sessionPhase === 'FINAL' &&
      observation.identity && identifier(observation.identity.sessionId) && identifier(observation.identity.sessionGeneration)
  }
  function binding(observation) {
    return { identity: observation.identity, positions: observation.positions, serviceObservation: observation.serviceObservation,
      serviceResourcesClosed: observation.serviceResourcesClosed, sessionResourceStatus: observation.sessionResourceStatus,
      sessionFileEvidence: observation.sessionFileEvidence, startsBlocked: observation.startsBlocked,
      supervisionResources: { input: inputState, timer: timerState, output: outputStatus(),
        originalOutput: originalOutputState, observationOutput: observationOutputState,
        evidence: evidenceState, evidenceHandles: evidenceState === 'UNPROVEN' ? 'possible' : 'closed',
        observationPath: 'same-process-supervision.inspect' } }
  }
  function offer() {
    if (!enter()) return null
    try {
      if (phase !== 'ACTIVE' || acceptance) return null
      activeOffer = null
      if (counts.offers >= SUPERVISION_LIMITS.offers) { fail('OFFER_LIMIT'); return null }
      const epoch = decisionEpoch, start = time(), before = read(start)
      if (!acceptable(before)) return null
      const id = ports.uuid()
      if (!identifier(id) || offerIds.has(id)) { fail('OFFER_ID_UNCERTAIN'); return null }
      offerIds.add(id); counts.offers++
      const candidate = freeze({ offerId: id, ...before.identity, operator: 'Jan',
        observationPath: 'same-process-supervision.inspect', observedAtMonotonic: before.observedAtMonotonic,
        observedAtUtc: before.observedAtUtc, expiresAtMonotonic: before.observedAtMonotonic + SUPERVISION_LIMITS.offerMs,
        binding: binding(before) })
      if (!publish('offer', candidate, start)) return null
      const after = read(start)
      if (epoch !== decisionEpoch || !acceptable(after) || !timeValid(start, candidate) || !same(candidate.binding, binding(after))) return null
      activeOffer = candidate
      return candidate
    } catch { fail('OBSERVATION_LOST'); return null }
    finally { busy = false; terminalNotice() }
  }
  function confirm(candidate, decision) {
    if (!enter()) return null
    try {
      const offered = activeOffer
      // Consume before any caller-provided code or observable IO; no retry/reentry.
      activeOffer = null
      const request = fields(decision, ['operator', 'decision'])
      if (!offered || candidate !== offered || acceptance || !request || request.operator !== 'Jan' || request.decision !== 'ACCEPT_RESPONSIBILITY') return null
      const epoch = decisionEpoch, start = time(), before = read(start)
      if (!acceptable(before) || !within(start, offered) || !same(offered.binding, binding(before))) return null
      const proposed = freeze({ offerId: offered.offerId, identity: before.identity, operator: 'Jan',
        observationPath: offered.observationPath, responsibilityAccepted: true,
        serviceObservationConfirmed: before.serviceObservation === 'CONFIRMED',
        clarificationResponsibility: before.positions.filter((entry) => !closed(entry.state) &&
          (entry.state === 'possible' || !['CONFIRMED', 'DRAIN_ATTACHED', 'REGISTRATIONS_RETAINED'].includes(entry.observation))).map((entry) => entry.name),
        resourceClosureConfirmed: before.positions.every((entry) => closed(entry.state)),
        originalSessionResourceStatus: original.resourceStatus, observedAtMonotonic: before.observedAtMonotonic })
      if (!publish('acceptance-proposal', proposed, start)) return null
      const after = read(start)
      if (epoch !== decisionEpoch || !acceptable(after) || !timeValid(start, offered) || !same(offered.binding, binding(after))) return null
      acceptance = freeze({ ...proposed, acceptedAtMonotonic: lastTime, status: 'CONFIRMED',
        evidenceStatus: 'PROPOSAL_SAVED_FINAL_RECEIPT_NOT_PERSISTED' })
      return acceptance
    } catch { fail('OBSERVATION_LOST'); return null }
    finally { busy = false; terminalNotice() }
  }
  function cancelTimer() {
    // A pending installation has no handle yet. Its settled continuation owns
    // the one removal attempt, including when close() ran inside schedule().
    if (timer === undefined || timer.installing || timer.attempted || timer.handle === undefined) return
    const held = timer; held.attempted = true; timerEpoch++; counts.timerRemoves++
    try {
      if (ports.cancel(held.handle) !== undefined) throw new Error('CANCEL')
      timer = undefined; timerState = 'closed'
    }
    catch { timerState = 'possible'; fail('TIMER_CLOSE_UNCONFIRMED') }
  }
  function removeRegistration(entry) {
    if (entry.installing || entry.attempted) return
    entry.attempted = true; counts.removeAttempts++
    try { if (entry.target.removeListener(entry.name, entry.callback) !== entry.target) throw new Error('REMOVE'); entry.state = 'closed' }
    catch { entry.state = 'possible'; fail('INPUT_CLOSE_UNCONFIRMED') }
  }
  function inputClosureState() {
    inputState = !inputPauseUnconfirmed && registrations.every((entry) => entry.state === 'closed') ? 'closed' : 'possible'
  }
  function close() {
    if (phase === 'CLOSED') return summary()
    phase = 'CLOSED'; activeOffer = null
    if (session) { try { session.stop('ABORT') } catch { fail('SESSION_STOP_UNCONFIRMED') } }
    cancelTimer()
    for (const entry of registrations) removeRegistration(entry)
    inputClosureState()
    if (io?.input && !inputPauseAttempted) {
      inputPauseAttempted = true; counts.inputPauseAttempts++
      try { if (io.input.pause() !== io.input) throw new Error('PAUSE') }
      catch { inputPauseUnconfirmed = true; inputState = 'possible'; fail('INPUT_CLOSE_UNCONFIRMED') }
    }
    pending = ''
    noticePending = true; terminalNotice()
    return summary()
  }
  function arm() {
    if (phase !== 'ACTIVE' || timer !== undefined) return
    try {
      const now = time()
      if (phase !== 'ACTIVE') return
      if (now >= expiresAt || counts.records >= SUPERVISION_LIMITS.records) { fail('OBSERVATION_LIMIT'); close(); return }
      counts.timerAdds++; timerState = 'possible'; const epoch = ++timerEpoch
      const held = { handle: undefined, installing: true, attempted: false }
      timer = held
      arming = true
      try { held.handle = ports.schedule(() => {
        if (phase !== 'ACTIVE' || epoch !== timerEpoch) return
        if (arming) { fail('TIMER_REENTRANT'); return }
        timerEpoch++
        timer = undefined; counts.timerFirings++; timerState = 'closed'
        if (phase !== 'ACTIVE') return
        if (enter()) {
          try { const start = time(), observation = read(start); publish('observation', summary(observation), start); read(start) }
          catch { fail('OBSERVATION_LOST') }
          finally { busy = false; terminalNotice() }
        }
        arm()
      }, Math.min(SUPERVISION_LIMITS.intervalMs, expiresAt - now)) }
      finally { arming = false; held.installing = false }
      if (held.handle === undefined || held.handle === null || typeof held.handle?.then === 'function') throw new Error('TIMER')
      if (phase !== 'ACTIVE' || errors.has('TIMER_REENTRANT')) { cancelTimer(); return }
      timerState = 'confirmed'
    } catch { arming = false; timerState = 'possible'; fail('TIMER_UNCONFIRMED') }
  }
  function dispatch(line) {
    counts.commands = Math.min(SUPERVISION_LIMITS.commands + 1, counts.commands + 1)
    if (counts.commands > SUPERVISION_LIMITS.commands) {
      inputExhausted = true; pending = ''; inputState = 'UNPROVEN'; fail('INPUT_LIMIT'); return
    }
    let request
    try { request = fields(JSON.parse(line), ['action', 'value']) } catch { /* Rejected below. */ }
    if (!request) { fail('INPUT_LOST'); return }
    if (request.action === 'inspect' && request.value === null) {
      if (!enter()) return
      try { const start = time(); publish('observation', summary(read(start)), start); read(start) }
      finally { busy = false; terminalNotice() }
      return
    }
    if (request.action === 'offer' && request.value === null) { offer(); return }
    if (request.action === 'confirm') {
      const value = fields(request.value, ['operator', 'decision', 'offerId', ...IDS])
      const candidate = activeOffer
      if (!value || !candidate || value.offerId !== candidate.offerId || !IDS.every((key) => value[key] === candidate[key])) { activeOffer = null; return }
      confirm(candidate, { operator: value.operator, decision: value.decision }); return
    }
    if (request.action === 'close' && request.value === null) { close(); return }
    if (!['prepare', 'control', 'window', 'abort'].includes(request.action)) { fail('INPUT_LOST'); return }
    if (request.action === 'abort') { decisionEpoch++; activeOffer = null }
    if (session.inspect().phase === 'FINAL') return
    sessionInput.emit('data', line + '\n')
  }
  function completed() {
    if (!sessionBeginCalled) return Promise.resolve(null)
    if (!completion) {
      completion = session.completed().then((report) => {
        original = report
        if (!terminalSent) terminalSent = originalOutput(JSON.stringify(report) + '\n')
        return report
      })
    }
    return completion
  }
  function begin(suppliedIo) {
    if (phase !== 'NEW' || busy) return false
    phase = 'STARTING'; busy = true
    try {
      ports = fields(suppliedPorts, ['now', 'utc', 'uuid', 'schedule', 'cancel'])
      io = fields(suppliedIo, ['input', 'signals', 'output', 'observe', 'save'])
      if (!ports || !Object.values(ports).every((port) => typeof port === 'function') || !io ||
          !['output', 'observe', 'save'].every((key) => typeof io[key] === 'function')) throw new Error('PORTS')
      if (phase !== 'STARTING') return false
      beganAt = time(); expiresAt = beganAt + SUPERVISION_LIMITS.lifetimeMs
      if (phase !== 'STARTING') return false
      session = test ? createNodeCdpOperatorSessionForTest(options, test.sessionPorts, test.hostPorts) : createNodeCdpOperatorSession(options)
      sessionInput = new EventEmitter(); sessionInput.pause = () => sessionInput
      sessionSignals = new EventEmitter()
      function add(target, name, callback) {
        const entry = { target, name, callback, state: 'possible', attempted: false, installing: true }
        registrations.push(entry); counts.addAttempts++; inputState = 'possible'
        try {
          if (target.on(name, callback) !== target) throw new Error('REGISTER')
          entry.state = 'confirmed'
        } finally {
          entry.installing = false
          if (phase === 'CLOSED') { removeRegistration(entry); inputClosureState() }
        }
        return phase === 'STARTING'
      }
      if (!add(io.input, 'data', (chunk) => {
        if (phase !== 'ACTIVE' || inputExhausted) return
        if (busy) { fail('REENTRANT'); return }
        try {
          if ((!Buffer.isBuffer(chunk) && typeof chunk !== 'string') || Buffer.byteLength(chunk) > SUPERVISION_LIMITS.inputBytes) throw new Error('INPUT')
          pending += chunk.toString('utf8')
          if (Buffer.byteLength(pending) > SUPERVISION_LIMITS.inputBytes) throw new Error('INPUT')
          while (pending.includes('\n') && phase === 'ACTIVE') {
            const at = pending.indexOf('\n'), line = pending.slice(0, at).replace(/\r$/, '')
            pending = pending.slice(at + 1); dispatch(line)
          }
        } catch { pending = ''; inputState = 'UNPROVEN'; fail('INPUT_LOST') }
        finally { terminalNotice() }
      })) return false
      if (!add(io.input, 'end', () => { inputState = 'UNPROVEN'; fail('INPUT_LOST'); terminalNotice() })) return false
      if (!add(io.input, 'error', () => { inputState = 'UNPROVEN'; fail('INPUT_LOST'); terminalNotice() })) return false
      for (const name of ['SIGINT', 'SIGTERM']) if (!add(io.signals, name, () => {
        if (phase !== 'ACTIVE') return
        decisionEpoch++
        if (session.inspect().phase !== 'FINAL') sessionSignals.emit(name)
        activeOffer = null
      })) return false
      inputState = 'confirmed'; phase = 'ACTIVE'
      // Session.begin creates its completion before invoking any effect port.
      // Such a port can close supervision and query completed() before begin returns.
      sessionBeginCalled = true
      const started = session.begin()
      completed()
      if (phase !== 'ACTIVE') return false
      if (started && !session.installInput(sessionInput, sessionSignals, originalOutput)) fail('SESSION_INPUT_UNCONFIRMED')
      if (phase !== 'ACTIVE') return false
      if (!started) fail('SESSION_START_REFUSED')
      const start = time()
      read(start)
      if (phase !== 'ACTIVE') return false
      publish('observation', summary(latest), start)
      if (phase !== 'ACTIVE') return false
      read(start); arm()
      return phase === 'ACTIVE' && started && errors.size === 0
    } catch { fail('START_REFUSED'); close(); return false }
    finally { busy = false; terminalNotice() }
  }
  return Object.freeze({ begin, inspect, offer, confirm, close, completed })
}

export const NODE_CDP_SUPERVISION_HELP = `Node-CDP Betriebsaufsatz (kein Start ohne --run).
Sechs Sessionargumentpaare plus --journal-prefix ABSOLUTER_DATEIPRAEFIX.
Vorhandenes Elternverzeichnis; neue exklusive nummerierte JSON-Dateien.
Session-JSON bleibt auf stdout; PRELIMINARY-Betriebsbelege auf stderr.
Zusaetzliche JSON-Zeilen: inspect/offer/confirm/close, jeweils action und value.
Uebernahme ist lokale Verantwortung, keine Entsperrung oder Betriebsfreigabe.
SAC bleibt aktiv; aeussere Betreuung durch Jan bleibt erforderlich.
`

function nativeJournal(prefix) {
  let sequence = 0, bytesWritten = 0, failed = false
  const uncertainDescriptors = []
  return (text) => {
    if (failed || sequence >= SUPERVISION_LIMITS.records || Buffer.byteLength(text) > SUPERVISION_LIMITS.recordBytes ||
        bytesWritten + Buffer.byteLength(text) > SUPERVISION_LIMITS.totalBytes) return false
    let descriptor, attempted = false
    try {
      const parent = fs.lstatSync(dirname(prefix))
      if (!parent.isDirectory() || parent.isSymbolicLink() || fs.realpathSync(dirname(prefix)) !== dirname(prefix)) throw new Error('DIRECTORY')
      const bytes = Buffer.from(text), name = `${prefix}-${String(++sequence).padStart(4, '0')}.json`
      descriptor = fs.openSync(name, 'wx+')
      if (fs.writeSync(descriptor, bytes, 0, bytes.length, 0) !== bytes.length || fs.fsyncSync(descriptor) !== undefined) throw new Error('WRITE')
      const stat = fs.fstatSync(descriptor), readback = Buffer.alloc(bytes.length + 1)
      if (!stat.isFile() || stat.size !== bytes.length || stat.nlink !== 1 ||
          fs.readSync(descriptor, readback, 0, readback.length, 0) !== bytes.length || !bytes.equals(readback.subarray(0, bytes.length))) throw new Error('READBACK')
      attempted = true
      if (fs.closeSync(descriptor) !== undefined) throw new Error('CLOSE')
      descriptor = undefined; bytesWritten += bytes.length
      return true
    } catch { failed = true; return false }
    finally {
      if (descriptor !== undefined) {
        if (!attempted) { try { if (fs.closeSync(descriptor) === undefined) descriptor = undefined } catch { /* Retain uncertain handle. */ } }
        if (descriptor !== undefined) uncertainDescriptors.push(descriptor)
      }
    }
  }
}

/** Help/rejection are inert; only --run constructs and explicitly begins production. */
export function runNodeCdpOperatorSupervisionCli(argv, io) {
  if (!argv.length || (argv.length === 1 && argv[0] === '--help')) { io.output(NODE_CDP_SUPERVISION_HELP); return null }
  const names = { '--chrome-executable': 'chromeExecutable', '--chrome-sha256': 'chromeSha256',
    '--state-decision': 'stateDecision', '--state-reference': 'stateReference',
    '--network-decision': 'networkDecision', '--network-reference': 'networkReference', '--journal-prefix': 'journal' }
  const values = {}
  if (argv[0] !== '--run' || argv.length !== 15) { io.output('START_REFUSED\n'); return null }
  for (let i = 1; i < argv.length; i += 2) {
    const name = names[argv[i]]
    if (!name || Object.hasOwn(values, name)) { io.output('START_REFUSED\n'); return null }
    values[name] = argv[i + 1]
  }
  if (!isAbsolute(values.journal) || resolve(values.journal) !== values.journal) { io.output('START_REFUSED\n'); return null }
  const { journal, ...options } = values
  const supervision = createNodeCdpOperatorSupervision(options)
  supervision.begin({ input: io.input, signals: io.signals, output: io.output, observe: io.observe, save: nativeJournal(journal) })
  return supervision
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const write = (descriptor, text) => {
    const bytes = Buffer.from(text)
    return fs.writeSync(descriptor, bytes, 0, bytes.length) === bytes.length
  }
  runNodeCdpOperatorSupervisionCli(process.argv.slice(2), {
    input: process.stdin, signals: process,
    output: (text) => write(1, text), observe: (text) => write(2, text),
  })
}
