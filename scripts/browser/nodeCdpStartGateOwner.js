// In-memory owner only. External attestations are trusted, synchronous inputs.
const VERSION_KEYS = ['protocolVersion', 'product', 'revision', 'userAgent', 'jsVersion']
const RESOURCE_NAMES = ['connection', 'context', 'target', 'session', 'document', 'registrations', 'timer']
const VERDICTS = ['PASS', 'UNPROVEN', 'FAIL']
const identifier = (value) => typeof value === 'string' && /^[A-Za-z0-9._:-]{1,128}$/.test(value)

// Read own data properties without invoking accessors or adopting/freezing inputs.
// Reflection on a Proxy can still run foreign code; public hooks guard reentrancy.
function fields(value, keys, exact = true) {
  if (value === null || typeof value !== 'object') return null
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) return null
  const names = Reflect.ownKeys(value)
  if (names.includes('then') || (exact && names.length !== keys.length)) return null
  const copy = Object.create(null)
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)
    if (!descriptor || !Object.hasOwn(descriptor, 'value')) return null
    copy[key] = descriptor.value
  }
  return copy
}

function copyBinding(value) {
  const binding = fields(value, ['serviceId', 'webSocketUrl', 'version'])
  if (!binding || !identifier(binding.serviceId) || typeof binding.webSocketUrl !== 'string') return null
  const match = /^ws:\/\/127\.0\.0\.1:([1-9][0-9]{0,4})\/devtools\/browser\/([A-Za-z0-9_-]{1,128})$/.exec(binding.webSocketUrl)
  if (!match || Number(match[1]) > 65_535) return null
  const version = fields(binding.version, VERSION_KEYS)
  if (!version || !VERSION_KEYS.every((key) =>
    typeof version[key] === 'string' && version[key].length > 0 && version[key].length <= 512)) return null
  return Object.freeze({ serviceId: binding.serviceId, webSocketUrl: binding.webSocketUrl,
    version: Object.freeze({ ...version }) })
}

function sameBinding(left, right) {
  return left.serviceId === right.serviceId && left.webSocketUrl === right.webSocketUrl &&
    VERSION_KEYS.every((key) => left.version[key] === right.version[key])
}

function identity(ports) {
  const session = fields(ports.readSession(), ['status', 'sessionId', 'generation', 'exclusive', 'continuity'])
  if (!session || session.status !== 'CONFIRMED' || session.exclusive !== true ||
      session.continuity !== 'CONFIRMED' || !identifier(session.sessionId) || !identifier(session.generation)) return null
  const service = fields(ports.readService(), ['status', 'sessionId', 'sessionGeneration', 'generation', 'binding'])
  if (!service || service.status !== 'CONFIRMED' || !identifier(service.generation) ||
      service.sessionId !== session.sessionId || service.sessionGeneration !== session.generation) return null
  const binding = copyBinding(service.binding)
  return binding ? { sessionId: session.sessionId, sessionGeneration: session.generation,
    serviceGeneration: service.generation, binding } : null
}

function sameIdentity(left, right) {
  return left.sessionId === right.sessionId && left.sessionGeneration === right.sessionGeneration &&
    left.serviceGeneration === right.serviceGeneration && sameBinding(left.binding, right.binding)
}

function validReport(value, lease) {
  // The owner validates the correlated resource projection, not CDP/time evidence.
  const report = fields(value, ['runId', 'serviceId', 'status', 'resourceStatus', 'resources',
    'evidenceSaved', 'contextReturned', 'connectionClosed', 'gateBlocked', 'gateAcknowledged', 'runtimeRecord'], false)
  if (!report || report.runId !== lease.runId || report.serviceId !== lease.serviceId ||
      !VERDICTS.includes(report.status) || !VERDICTS.includes(report.resourceStatus) ||
      VERDICTS.indexOf(report.status) < VERDICTS.indexOf(report.resourceStatus) || report.runtimeRecord !== null ||
      !['evidenceSaved', 'contextReturned', 'connectionClosed', 'gateBlocked', 'gateAcknowledged']
        .every((key) => typeof report[key] === 'boolean')) return null
  const resources = report.resources
  if (!Array.isArray(resources) || Object.getPrototypeOf(resources) !== Array.prototype) return null
  const length = Object.getOwnPropertyDescriptor(resources, 'length')
  if (!length || length.value !== RESOURCE_NAMES.length || Reflect.ownKeys(resources).length !== RESOURCE_NAMES.length + 1) return null
  const states = []
  for (let index = 0; index < RESOURCE_NAMES.length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(resources, String(index))
    const entry = descriptor && Object.hasOwn(descriptor, 'value') && fields(descriptor.value, ['name', 'state'])
    if (!entry || entry.name !== RESOURCE_NAMES[index] ||
        !['notAttempted', 'possible', 'confirmed', 'closed'].includes(entry.state)) return null
    states.push(entry.state)
  }
  if (report.resourceStatus === 'PASS' && (!report.evidenceSaved || !report.gateAcknowledged || report.gateBlocked ||
      states.some((state) => state !== 'closed' && state !== 'notAttempted') ||
      (states[0] === 'closed' && !report.connectionClosed) ||
      (states[1] === 'closed' && !report.contextReturned))) return null
  return report.resourceStatus
}

/** See docs/node-cdp-start-gate-owner.md for the external attestation contract. */
export function createNodeCdpStartGateOwner(options) {
  // Deliberately do not even inspect options at factory time.
  const known = new WeakMap()
  let active = null, blocked = false, busy = false, blocking = false

  function checkCurrent(entry) {
    if (entry.lost || entry.completed) return false
    let observed = null
    try { observed = identity(entry.ports) } catch { /* Unknown is not current. */ }
    if (!observed || !sameIdentity(entry.identity, observed)) {
      entry.lost = true
      blocked = true
      return false
    }
    return true
  }

  function acquire(binding, runId) {
    if (busy || blocking || active || blocked) return null
    busy = true
    try {
      if (!identifier(runId)) return null
      const bound = copyBinding(binding)
      const ports = fields(options, ['readSession', 'readPermission', 'readService'])
      if (!bound || !ports || !Object.values(ports).every((port) => typeof port === 'function')) return null
      const observed = identity(ports)
      if (!observed || !sameBinding(bound, observed.binding)) return null
      const permission = fields(ports.readPermission(), ['sessionId', 'sessionGeneration', 'serviceId',
        'serviceGeneration', 'startAllowed', 'externalBlock'])
      if (!permission || permission.sessionId !== observed.sessionId ||
          permission.sessionGeneration !== observed.sessionGeneration || permission.serviceId !== bound.serviceId ||
          permission.serviceGeneration !== observed.serviceGeneration) return null
      if (permission.externalBlock === 'BLOCKED') blocked = true
      if (permission.startAllowed !== true || permission.externalBlock !== 'CLEAR' || blocked) return null
      // Check again after the permission callback; it must not silently change identity.
      const confirmed = identity(ports)
      if (!confirmed || !sameIdentity(observed, confirmed) || blocked) return null
      const lease = Object.freeze({ status: 'ACQUIRED', serviceId: bound.serviceId,
        webSocketUrl: bound.webSocketUrl, runId })
      active = { lease, ports, identity: observed, lost: false, completed: false }
      known.set(lease, active)
      return lease
    } catch { return null }
    finally { busy = false }
  }

  function isCurrent(lease) {
    if (busy || blocking || !active || active.lease !== lease) return false
    busy = true
    try { return checkCurrent(active) }
    finally { busy = false }
  }

  function block(lease, finding) {
    if (blocking || !known.has(lease)) return false
    // A known lease can block even inside another hook and after completion.
    blocking = true
    try {
      const record = fields(finding, ['runId', 'resourceStatus', 'code'])
      if (!record || record.runId !== lease.runId || !['FAIL', 'UNPROVEN'].includes(record.resourceStatus) ||
          !identifier(record.code)) return false
      blocked = true
      return true
    } catch { return false }
    finally { blocking = false }
  }

  function complete(lease, report) {
    if (busy || blocking || !active || active.lease !== lease || active.completed) return false
    busy = true
    try {
      const verdict = validReport(report, lease)
      if (verdict === null) return false
      if (verdict === 'PASS') {
        if (!checkCurrent(active)) return false
      } else blocked = true
      active.completed = true
      // A blocked reservation remains held; only an ordinary PASS can release it.
      if (!blocked) active = null
      return true
    } catch { return false }
    finally { busy = false }
  }

  return Object.freeze({ acquire, isCurrent, block, complete })
}
