import { createHash as adapterCreateHash } from 'node:crypto'

const AdapterPromise = Promise
const AdapterUint8Array = Uint8Array
const AdapterTextDecoder = TextDecoder
const AdapterTextEncoder = TextEncoder
const AdapterDate = Date
const adapterObjectPrototype = Object.prototype
const adapterArrayPrototype = Array.prototype
const adapterUint8ArrayPrototype = Uint8Array.prototype
const adapterPromisePrototype = Promise.prototype
const adapterArrayBufferPrototype = ArrayBuffer.prototype
const adapterApply = Reflect.apply
const adapterOwnKeys = Reflect.ownKeys
const adapterDelete = Reflect.deleteProperty
const adapterDescriptor = Object.getOwnPropertyDescriptor
const adapterPrototype = Object.getPrototypeOf
const adapterFreeze = Object.freeze
const adapterIsFrozen = Object.isFrozen
const adapterIsArray = Array.isArray
const adapterSafeInteger = Number.isSafeInteger
const adapterFinite = Number.isFinite
const adapterParse = JSON.parse
const adapterStringify = JSON.stringify
const adapterThen = Promise.prototype.then
const adapterTypedArrayPrototype = Object.getPrototypeOf(Uint8Array.prototype)
const adapterTypedLength = adapterDescriptor(adapterTypedArrayPrototype, 'length').get
const adapterTypedByteLength = adapterDescriptor(adapterTypedArrayPrototype, 'byteLength').get
const adapterTypedOffset = adapterDescriptor(adapterTypedArrayPrototype, 'byteOffset').get
const adapterTypedBuffer = adapterDescriptor(adapterTypedArrayPrototype, 'buffer').get
const adapterTypedName = adapterDescriptor(adapterTypedArrayPrototype, Symbol.toStringTag).get
const adapterTypedSet = adapterTypedArrayPrototype.set
const adapterBufferByteLength = adapterDescriptor(ArrayBuffer.prototype, 'byteLength').get
const adapterBufferResizable = adapterDescriptor(ArrayBuffer.prototype, 'resizable')?.get
const adapterOwners = new WeakSet()
const adapterCapabilityIdentities = new WeakSet()
const ADAPTER_FAILURE = 'browserSyncTransportRuntimeDiagnosticAdapterFailed'
const ADAPTER_ARGUMENTS = 'invalidBrowserSyncTransportRuntimeDiagnosticAdapterArguments'
const ADAPTER_USED = 'browserSyncTransportRuntimeDiagnosticAdapterAlreadyUsed'
const ADAPTER_EFFECT_FAILURE = 'browserSyncTransportRuntimeDiagnosticAdapterEffectFailed'
const ADAPTER_CAPABILITY_PROFILE = 'adr-0036-runtime-capabilities-v1'
const ADAPTER_EFFECT_PROFILE = 'adr-0033-foundation-effect-port-v1'
const ADAPTER_EFFECT_SET = 'clock-cap-send-dequeue-cleanup-v1'
const ADAPTER_EVALUATION_SHA256 = 'a623ffafee8dfcbc1d2ddc374cc35f0dbf800defd97619a3b58337d972090f7b'
const ADAPTER_CAPABILITY_GROUPS = adapterFreeze({
  entropy: adapterFreeze({ readDiagnosticRunIdEntropyBytes: 0, readReplayContextIdEntropyBytes: 0 }),
  clock: adapterFreeze({ readControllerNanoseconds: 0, readWallMilliseconds: 0, readTimeZone: 0 }),
  runtime: adapterFreeze({
    readProcessPlatform: 0, readProcessArchitecture: 0, readProcessVersion: 0,
    readProcessExecutablePath: 0, readProcessExecArguments: 0,
    readProcessEnvironmentMatches: 1, readWorkingDirectory: 0,
  }),
  scheduler: adapterFreeze({ armTimer: 2, cancelTimer: 1 }),
  pipe: adapterFreeze({ openDebugPipe: 2, writeDebugPipe: 3, closeDebugPipe: 1 }),
  launcher: adapterFreeze({ spawnChild: 2, terminateChild: 1, closeChild: 1 }),
  resources: adapterFreeze({ performResourceOperation: 2, closeResource: 2 }),
})
const ADAPTER_ENVIRONMENT_NAMES = adapterFreeze([
  'NODE_OPTIONS', 'SystemRoot', 'WINDIR', 'ComSpec', 'PATHEXT', 'Path',
  'TEMP', 'TMP', 'LOCALAPPDATA', 'ProgramFiles', 'ProgramFiles(x86)', 'ProgramW6432',
])
const ADAPTER_COMMANDS = adapterFreeze([
  'Target.getTargets', 'Target.attachToTarget', 'Network.enable',
  'Runtime.evaluate', 'Network.disable', 'Target.detachFromTarget',
])
const ADAPTER_CLEANUP_STEPS = adapterFreeze([
  ['debugPipeClosed', 'close-debug-pipe'],
  ['browserStopped', 'stop-browser'], ['devServerStopped', 'stop-dev-server'],
  ['gatewayStopped', 'stop-gateway'], ['profileRemoved', 'remove-profile'],
  ['harnessFragmentsRemoved', 'remove-harness-fragments'],
  ['permissionSiteCacheAndServiceWorkerStateCleared', 'clear-profile-site-state'],
  ['environmentRestored', 'restore-environment'], ['portsFree', 'verify-bound-ports-free'],
  ['repositoryAndIndexRestored', 'verify-repository-index-restored'],
  ['historicalEvidenceHashUnchanged', 'verify-historical-evidence-hash'],
  ['observerStorageLogAndTelemetryResidueAbsent', 'verify-observer-residue-absent'],
].map(adapterFreeze))

const adapterEvidenceEligible = true
const createSelectedBrowserSyncTransportRuntimeDiagnosticCapabilities =
  createBrowserSyncTransportRuntimeDiagnosticNodeCapabilities

function adapterFail(code = ADAPTER_FAILURE) {
  const error = new TypeError(code)
  delete error.stack
  throw error
}

function adapterError(code) {
  const error = new Error(code)
  delete error.stack
  return error
}

function adapterOwnedExchangePromise(executor) {
  const promise = new AdapterPromise(executor)
  // This is a newly constructed adapter object, never a foreign promise.
  // Host async diagnostics may attach configurable bookkeeping symbols.
  for (const key of adapterOwnKeys(promise)) {
    const descriptor = adapterDescriptor(promise, key)
    if (descriptor?.configurable === true) adapterDelete(promise, key)
  }
  adapterAssert(adapterPrototype(promise) === adapterPromisePrototype && adapterOwnKeys(promise).length === 0)
  return promise
}

function adapterAssert(condition) {
  if (!condition) adapterFail()
}

function adapterData(record, key) {
  const descriptor = adapterDescriptor(record, key)
  adapterAssert(descriptor !== undefined && Object.hasOwn(descriptor, 'value') &&
    descriptor.enumerable === true && !Object.hasOwn(descriptor, 'get') &&
    !Object.hasOwn(descriptor, 'set'))
  return descriptor.value
}

function adapterRecord(record, keys, frozen = false) {
  adapterAssert(record !== null && typeof record === 'object' &&
    adapterPrototype(record) === adapterObjectPrototype)
  const actual = adapterOwnKeys(record)
  adapterAssert(actual.length === keys.length && actual.every((key, index) => key === keys[index]))
  const values = keys.map(key => adapterData(record, key))
  if (frozen) adapterAssert(adapterIsFrozen(record))
  return values
}

function adapterArray(value, maximumLength, frozen = false) {
  adapterAssert(adapterIsArray(value) && adapterPrototype(value) === adapterArrayPrototype)
  const length = adapterDescriptor(value, 'length')
  adapterAssert(length !== undefined && Object.hasOwn(length, 'value') &&
    length.enumerable === false && length.configurable === false &&
    typeof length.writable === 'boolean' && adapterSafeInteger(length.value) &&
    length.value >= 0 && length.value <= maximumLength)
  const keys = adapterOwnKeys(value)
  adapterAssert(keys.length === length.value + 1 && keys[length.value] === 'length')
  const result = []
  for (let index = 0; index < length.value; index += 1) {
    adapterAssert(keys[index] === `${index}`)
    result.push(adapterData(value, `${index}`))
  }
  if (frozen) adapterAssert(adapterIsFrozen(value))
  return result
}

function adapterFreezeData(value) {
  if (value === null || typeof value !== 'object') return value
  const seen = new Set()
  const stack = [[value, false]]
  while (stack.length !== 0) {
    const [current, closing] = stack.pop()
    if (closing) {
      adapterFreeze(current)
      continue
    }
    adapterAssert(!seen.has(current))
    seen.add(current)
    adapterAssert(seen.size <= 16384)
    const array = adapterIsArray(current)
    adapterAssert(adapterPrototype(current) === (array ? adapterArrayPrototype : adapterObjectPrototype))
    stack.push([current, true])
    for (const key of adapterOwnKeys(current)) {
      if (array && key === 'length') continue
      adapterAssert(typeof key === 'string')
      const item = adapterData(current, key)
      if (item !== null && typeof item === 'object') stack.push([item, false])
      else adapterAssert(['undefined', 'string', 'number', 'boolean', 'function', 'bigint'].includes(typeof item) || item === null)
    }
  }
  return value
}

function adapterCopyBytes(value, maximumLength, exactLength = null) {
  adapterAssert(value !== null && typeof value === 'object' &&
    adapterPrototype(value) === adapterUint8ArrayPrototype &&
    adapterApply(adapterTypedName, value, []) === 'Uint8Array')
  const length = adapterApply(adapterTypedLength, value, [])
  const byteLength = adapterApply(adapterTypedByteLength, value, [])
  const offset = adapterApply(adapterTypedOffset, value, [])
  const buffer = adapterApply(adapterTypedBuffer, value, [])
  adapterAssert(adapterSafeInteger(length) && length >= 0 && length <= maximumLength &&
    byteLength === length && (exactLength === null || length === exactLength) && offset === 0 &&
    adapterPrototype(buffer) === adapterArrayBufferPrototype &&
    adapterApply(adapterBufferByteLength, buffer, []) === length &&
    (!adapterBufferResizable || adapterApply(adapterBufferResizable, buffer, []) === false))
  const keys = adapterOwnKeys(value)
  adapterAssert(keys.length === length)
  if (length !== 0) {
    const descriptor = adapterDescriptor(value, '0')
    adapterAssert(keys[0] === '0' && descriptor !== undefined &&
      Object.hasOwn(descriptor, 'value') && descriptor.enumerable === true &&
      descriptor.writable === true && descriptor.configurable === true)
  }
  // The exact native brand guarantees dense integer-indexed data descriptors;
  // ownKeys excludes all extra properties. The fresh view rejects detachment
  // and native set copies bytes without consulting foreign property readers.
  const source = new AdapterUint8Array(buffer, 0, length)
  const copy = new AdapterUint8Array(length)
  adapterApply(adapterTypedSet, copy, [source])
  return copy
}

function adapterAscii(value, maximumLength, nonempty = true) {
  return typeof value === 'string' && value.length <= maximumLength &&
    (!nonempty || value.length > 0) && /^[\x20-\x7e]*$/.test(value)
}

function adapterPathString(value) {
  return typeof value === 'string' && value.length > 0 &&
    value.length <= 32767 && !value.includes('\u0000')
}

function adapterHash(bytes) {
  return adapterCreateHash('sha256').update(bytes).digest('hex')
}

function adapterValidateCapabilities(value, consumeIdentity = false) {
  const keys = ['profile', ...Object.keys(ADAPTER_CAPABILITY_GROUPS)]
  const values = adapterRecord(value, keys, true)
  adapterAssert(values[0] === ADAPTER_CAPABILITY_PROFILE)
  for (let index = 1; index < keys.length; index += 1) {
    const group = ADAPTER_CAPABILITY_GROUPS[keys[index]]
    const names = Object.keys(group)
    const methods = adapterRecord(values[index], names, true)
    for (let methodIndex = 0; methodIndex < methods.length; methodIndex += 1) {
      const method = methods[methodIndex]
      adapterAssert(typeof method === 'function')
      const arity = adapterDescriptor(method, 'length')
      adapterAssert(arity !== undefined && Object.hasOwn(arity, 'value') &&
        arity.enumerable === false && arity.value === group[names[methodIndex]])
    }
  }
  if (consumeIdentity) {
    adapterAssert(!adapterCapabilityIdentities.has(value))
    adapterCapabilityIdentities.add(value)
  }
  return value
}

function adapterInvoke(owner, group, name, args) {
  adapterAssert(adapterOwners.has(owner) && owner.runState === 'active')
  const method = adapterData(adapterData(owner.runtimeCapabilities, group), name)
  adapterAssert(args.length === ADAPTER_CAPABILITY_GROUPS[group][name])
  owner.capabilityCallDepth += 1
  try {
    return adapterApply(method, undefined, args)
  } catch {
    owner.capabilityError = true
    adapterFail()
  } finally {
    owner.capabilityCallDepth -= 1
  }
}

function adapterBase32(bytes, bits) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz234567'
  let result = ''
  for (let offset = 0; offset < bits; offset += 5) {
    let value = 0
    for (let bit = 0; bit < 5; bit += 1) {
      const absolute = offset + bit
      value = value * 2 + ((bytes[Math.floor(absolute / 8)] >> (7 - absolute % 8)) & 1)
    }
    result += alphabet[value]
  }
  return result
}

function adapterReadR0(owner) {
  const runEntropy = adapterCopyBytes(adapterInvoke(owner, 'entropy', 'readDiagnosticRunIdEntropyBytes', []), 17, 17)
  const replayEntropy = adapterCopyBytes(adapterInvoke(owner, 'entropy', 'readReplayContextIdEntropyBytes', []), 15, 15)
  const diagnosticRunId = `diag-${adapterBase32(runEntropy, 130)}`
  const replayContextId = `replay-${adapterBase32(replayEntropy, 120)}`
  const wall = adapterInvoke(owner, 'clock', 'readWallMilliseconds', [])
  adapterAssert(adapterSafeInteger(wall) && wall >= 0)
  const observedAt = new AdapterDate(wall).toISOString()
  adapterAssert(observedAt.length === 24 && new AdapterDate(observedAt).getTime() === wall)
  const timeZone = adapterInvoke(owner, 'clock', 'readTimeZone', [])
  adapterAssert(adapterAscii(timeZone, 64) &&
    (timeZone === 'UTC' || /^[A-Za-z][A-Za-z0-9._+-]*(?:\/[A-Za-z0-9._+-]+)+$/.test(timeZone)))
  const platform = adapterInvoke(owner, 'runtime', 'readProcessPlatform', [])
  adapterAssert(adapterAscii(platform, 16) && platform === 'win32')
  const architecture = adapterInvoke(owner, 'runtime', 'readProcessArchitecture', [])
  adapterAssert(adapterAscii(architecture, 16) && architecture === 'x64')
  const version = adapterInvoke(owner, 'runtime', 'readProcessVersion', [])
  adapterAssert(adapterAscii(version, 32) && version === 'v24.19.0')
  const executablePath = adapterInvoke(owner, 'runtime', 'readProcessExecutablePath', [])
  adapterAssert(adapterPathString(executablePath))
  const execArguments = adapterArray(adapterInvoke(owner, 'runtime', 'readProcessExecArguments', []), 16)
  adapterAssert(execArguments.every(argument => typeof argument === 'string' &&
    new AdapterTextEncoder().encode(argument).length <= 1024) &&
    execArguments.length === 2 && execArguments[0] === '--experimental-vm-modules' &&
    execArguments[1] === '--no-warnings')
  const workingDirectory = adapterInvoke(owner, 'runtime', 'readWorkingDirectory', [])
  adapterAssert(adapterPathString(workingDirectory))
  const environment = []
  for (const name of ADAPTER_ENVIRONMENT_NAMES) {
    const matches = adapterArray(adapterInvoke(owner, 'runtime', 'readProcessEnvironmentMatches', [name]), 16)
    adapterAssert(matches.length <= 1)
    if (name === 'NODE_OPTIONS') adapterAssert(matches.length === 0)
    for (const match of matches) {
      const [rawName, value] = adapterRecord(match, ['name', 'value'])
      adapterAssert(typeof rawName === 'string' && rawName.length <= 256 && !rawName.includes('\u0000') &&
        rawName.toLowerCase() === name.toLowerCase() && typeof value === 'string' && value.length <= 32767)
      environment.push({ name, value })
    }
  }
  owner.r0 = adapterFreezeData({ diagnosticRunId, replayContextId, observedAt, timeZone,
    platform, architecture, version, executablePath, execArguments, workingDirectory, environment })
}

// Only object member names are decoded here. Values remain lexical tokens until
// the single native parse and the independent bounded post-parse traversal.
function adapterScanJson(text) {
  adapterAssert(typeof text === 'string' && text.length > 0 && text.length <= 262144)
  let cursor = 0
  let nodes = 0
  let members = 0
  const whitespace = () => {
    while (cursor < text.length && [' ', '\t', '\r', '\n'].includes(text[cursor])) cursor += 1
  }
  const string = decode => {
    adapterAssert(text[cursor] === '"')
    cursor += 1
    let length = 0
    let decoded = ''
    let closed = false
    while (cursor < text.length) {
      let character = text[cursor++]
      if (character === '"') { closed = true; break }
      adapterAssert(character.charCodeAt(0) >= 32)
      if (character === '\\') {
        adapterAssert(cursor < text.length)
        const escaped = text[cursor++]
        if (escaped === 'u') {
          const digits = text.slice(cursor, cursor + 4)
          adapterAssert(digits.length === 4 && /^[0-9a-fA-F]{4}$/.test(digits))
          character = String.fromCharCode(Number.parseInt(digits, 16))
          cursor += 4
        } else {
          const escapes = { '"': '"', '\\': '\\', '/': '/', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' }
          adapterAssert(Object.hasOwn(escapes, escaped))
          character = escapes[escaped]
        }
      }
      length += 1
      adapterAssert(length <= 131072)
      if (decode) decoded += character
    }
    adapterAssert(closed)
    return decoded
  }
  const value = depth => {
    adapterAssert(depth <= 32 && ++nodes <= 4096)
    whitespace()
    const initial = text[cursor]
    if (initial === '{' || initial === '[') {
      const object = initial === '{'
      const end = object ? '}' : ']'
      const keys = new Set()
      cursor += 1
      whitespace()
      if (text[cursor] === end) { cursor += 1; return }
      while (cursor < text.length) {
        if (object) {
          whitespace()
          const key = string(true)
          adapterAssert(!keys.has(key) && ++members <= 8192)
          keys.add(key)
          whitespace()
          adapterAssert(text[cursor++] === ':')
        }
        value(depth + 1)
        whitespace()
        if (text[cursor] === end) { cursor += 1; keys.clear(); return }
        adapterAssert(text[cursor++] === ',')
      }
      adapterFail()
    } else if (initial === '"') {
      string(false)
    } else if (initial === '-' || (initial >= '0' && initial <= '9')) {
      const match = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/.exec(text.slice(cursor))
      adapterAssert(match !== null)
      cursor += match[0].length
    } else {
      const literal = ['true', 'false', 'null'].find(candidate => text.startsWith(candidate, cursor))
      adapterAssert(literal !== undefined)
      cursor += literal.length
    }
  }
  value(1)
  whitespace()
  adapterAssert(cursor === text.length)
  return { nodes, members }
}

function adapterParseFrame(owner, frame) {
  owner.pipeLedger.frameCount += 1
  adapterAssert(frame.length > 0 && frame.length <= 262144 &&
    !(frame.length >= 3 && frame[0] === 239 && frame[1] === 187 && frame[2] === 191))
  const text = new AdapterTextDecoder('utf-8', { fatal: true }).decode(frame)
  owner.pipeLedger.decodeCount += 1
  const scanned = adapterScanJson(text)
  owner.pipeLedger.scanCount += 1
  owner.pipeLedger.parseCount += 1
  const root = adapterParse(text)
  let nodes = 0
  let members = 0
  const stack = [[root, 1, false]]
  while (stack.length !== 0) {
    const [item, depth, closing] = stack.pop()
    if (closing) { adapterFreeze(item); continue }
    adapterAssert(depth <= 32 && ++nodes <= 4096)
    if (item === null || typeof item !== 'object') {
      adapterAssert(item === null || typeof item === 'boolean' ||
        (typeof item === 'number' && adapterFinite(item)) ||
        (typeof item === 'string' && item.length <= 131072))
      continue
    }
    const array = adapterIsArray(item)
    adapterAssert(adapterPrototype(item) === (array ? adapterArrayPrototype : adapterObjectPrototype))
    const keys = adapterOwnKeys(item)
    stack.push([item, depth, true])
    for (let index = keys.length - 1; index >= 0; index -= 1) {
      const key = keys[index]
      if (array && key === 'length') continue
      adapterAssert(typeof key === 'string' && key.length <= 131072)
      if (!array) adapterAssert(++members <= 8192)
      stack.push([adapterData(item, key), depth + 1, false])
    }
  }
  adapterAssert(nodes === scanned.nodes && members === scanned.members &&
    root !== null && typeof root === 'object' && !adapterIsArray(root))
  const keys = adapterOwnKeys(root)
  const has = name => keys.includes(name)
  if (has('id')) {
    adapterAssert(!has('method') && !has('params') && has('result') !== has('error') &&
      keys.every(key => ['id', 'sessionId', 'result', 'error'].includes(key)))
    const id = adapterData(root, 'id')
    adapterAssert(adapterSafeInteger(id) && id > 0)
  } else {
    adapterAssert(has('method') && has('params') &&
      keys.every(key => ['method', 'sessionId', 'params'].includes(key)))
    const method = adapterData(root, 'method')
    adapterAssert(typeof method === 'string' && method.length > 0)
  }
  if (has('sessionId')) {
    const sessionId = adapterData(root, 'sessionId')
    adapterAssert(typeof sessionId === 'string' && sessionId.length > 0)
  }
  adapterAssert(++owner.pipeLedger.messageCount <= 512)
  adapterQueue(owner, adapterFreeze({ kind: 'cdp-message', value: root }), frame.length)
}

function adapterReceiveChunk(owner, bytes) {
  const copy = adapterCopyBytes(bytes, 65536)
  const pipe = owner.pipeLedger
  adapterAssert(pipe.intakeState === 'open')
  for (const byte of copy) {
    if (byte === 0) {
      adapterAssert(pipe.accumulator.length + 1 <= 262145)
      const frame = new AdapterUint8Array(pipe.accumulator)
      pipe.accumulator = []
      adapterParseFrame(owner, frame)
    } else {
      adapterAssert(pipe.accumulator.length < 262144)
      pipe.accumulator.push(byte)
    }
  }
}

function adapterQueue(owner, value, materialBytes = 0) {
  adapterAssert(owner.runState === 'active' && owner.dispatcherState !== 'terminal' &&
    owner.fifo.length < 256 && owner.fifoMaterialBytes + materialBytes <= 1048576 &&
    adapterSafeInteger(owner.nextFifoSequence) && owner.nextFifoSequence > 0)
  const entry = { sequence: owner.nextFifoSequence++, value, materialBytes }
  owner.fifo.push(entry)
  owner.fifoMaterialBytes += materialBytes
  if (owner.waitingDequeueResolver !== null) adapterDeliverQueued(owner)
}

function adapterDeliverQueued(owner) {
  if (owner.waitingDequeueResolver === null || owner.fifo.length === 0) return
  const resolver = owner.waitingDequeueResolver
  const entry = owner.fifo.shift()
  owner.waitingDequeueResolver = null
  owner.fifoMaterialBytes -= entry.materialBytes
  owner.pipeLedger.dequeuedMaterialBytes += entry.materialBytes
  owner.lastDequeuedSequence = entry.sequence
  owner.awaitingDequeueClock = true
  owner.lastDequeuedMaterial = entry
  resolver(entry.value)
}

function adapterAccountDequeuedEnvelope(owner, entry) {
  if (entry.value.kind !== 'cdp-message') return
  const message = entry.value.value
  const idDescriptor = adapterDescriptor(message, 'id')
  if (idDescriptor === undefined) return
  const operation = owner.wireLedger.operations.find(row => row.commandId === idDescriptor.value)
  if (operation === undefined) return
  const session = adapterDescriptor(message, 'sessionId')?.value ?? null
  if (session !== operation.sessionId) return
  operation.replyCount += 1
  operation.replyState = 'correlated'
  // Only the two explicitly closed cleanup replies have adapter-side value
  // grammar. Observation semantics remain exclusively in the Foundation.
  if (operation.command === 'Network.disable' || operation.command === 'Target.detachFromTarget') {
    if (adapterDescriptor(message, 'error') !== undefined) operation.replyState = 'error'
    else {
      const value = adapterData(message, 'result')
      operation.replyState = value !== null && typeof value === 'object' &&
        adapterPrototype(value) === adapterObjectPrototype && adapterOwnKeys(value).length === 0 ? 'exact' : 'malformed'
    }
  }
}

function adapterOpaque(value) {
  return value !== null && (typeof value === 'object' || typeof value === 'function')
}

function adapterViolation(owner, domain) {
  owner.hardViolation = true
  owner.capabilityError = true
  if (domain === 'parser') owner.pipeLedger.violation = true
  if (domain === 'capability') owner.capabilityViolation = true
  if (domain === 'producer') owner.producerViolation = true
  if (owner.adapterObservationSnapshot !== null) owner.cleanupViolation = true
  for (const operation of owner.resourceLedger.operations.values()) {
    if (operation.reject !== null) {
      const reject = operation.reject
      operation.resolve = null
      operation.reject = null
      operation.state = 'terminal'
      const binding = owner.producerBindings.get(operation.handle)?.get('resource')
      if (binding) binding.active = false
      reject(adapterError(ADAPTER_FAILURE))
    }
  }
  owner.resourceLedger.operations.clear()
  if (owner.activeExchange !== null && owner.activeExchange.reject !== null) {
    const reject = owner.activeExchange.reject
    owner.activeExchange = null
    owner.waitingDequeueResolver = null
    reject(adapterError(ADAPTER_EFFECT_FAILURE))
  }
}

function adapterBindProducer(owner, producer, handle, generation) {
  adapterAssert(adapterOpaque(handle) && adapterSafeInteger(generation) && generation > 0)
  let roles = owner.producerBindings.get(handle)
  if (roles === undefined) {
    roles = new Map()
    owner.producerBindings.set(handle, roles)
  }
  adapterAssert(!roles.has(producer))
  const binding = { producer, handle, generation, active: true, ready: true }
  roles.set(producer, binding)
  return binding
}

function adapterMakeRawSink(owner, producer, pendingBinding) {
  owner.pendingRawBindings.push(pendingBinding)
  return function rawSignalSink(signal) {
    if (owner.runState !== 'active' || pendingBinding.terminal === true) return undefined
    if (pendingBinding.ready) {
      const roles = owner.producerBindings.get(pendingBinding.handle)
      const names = producer === 'debug-pipe' ? ['debug-pipe-read', 'debug-pipe-write'] :
        [producer === 'debug-pipe-completion' ? 'debug-pipe-write' : producer]
      if (names.every(name => {
        const binding = roles?.get(name)
        return binding !== undefined && (!binding.active || pendingBinding.generation < binding.generation)
      })) return undefined
      if (producer === 'debug-pipe-completion' && pendingBinding.writeGeneration <= owner.pipeLedger.terminalWriteGeneration) return undefined
    }
    if (!pendingBinding.ready || owner.capabilityCallDepth !== 0 || arguments.length !== 1) {
      adapterViolation(owner, 'capability')
      return undefined
    }
    try {
      let event
      let producerName = producer === 'debug-pipe-completion' ? 'debug-pipe-write' : producer
      if (producer === 'resource') {
        const [operationId, state, result] = adapterRecord(signal, ['operationId', 'state', 'result'], true)
        event = adapterFreeze({ kind: 'completion', operationId, state, result })
      } else if (producer === 'debug-pipe-completion') {
        const [state] = adapterRecord(signal, ['state'], true)
        event = adapterFreeze({ kind: 'completion', writeGeneration: pendingBinding.writeGeneration, state })
      } else {
        const kind = adapterData(signal, 'kind')
        if (producer === 'child') {
          const keys = kind === 'stdout' || kind === 'stderr' ? ['kind', 'bytes'] :
            kind === 'exit' || kind === 'close' ? ['kind', 'code', 'signal'] : ['kind']
          const values = adapterRecord(signal, keys, true)
          event = adapterFreeze(Object.fromEntries(keys.map((key, index) => [key, values[index]])))
        } else {
          const mapping = { 'read-chunk': 'chunk', 'read-eof': 'eof', 'read-error': 'error', drain: 'drain', 'write-error': 'error' }
          adapterAssert(Object.hasOwn(mapping, kind))
          producerName = kind === 'drain' || kind === 'write-error' ? 'debug-pipe-write' : 'debug-pipe-read'
          if (owner.producerBindings.get(pendingBinding.handle)?.get(producerName)?.active === false) return undefined
          const keys = kind === 'read-chunk' ? ['kind', 'bytes'] : ['kind']
          const values = adapterRecord(signal, keys, true)
          event = kind === 'read-chunk' ? adapterFreeze({ kind: 'chunk', bytes: values[1] }) : adapterFreeze({ kind: mapping[kind] })
        }
      }
      enqueueBrowserSyncTransportRuntimeDiagnosticAdapterEvent(owner, adapterFreeze({
        profile: 'adr-0036-producer-event-v1', producer: producerName,
        producerHandle: pendingBinding.handle, generation: pendingBinding.generation, event,
      }))
    } catch {
      adapterViolation(owner, 'producer')
    }
    return undefined
  }
}

function adapterPathIdentity(value, hasKind = true) {
  const fields = ['pathType', 'volumeId', 'fileId', 'byteLength',
    'modifiedTimeNanoseconds', 'changeTimeNanoseconds', 'reparsePoint']
  const keys = hasKind ? ['kind', ...fields] : fields
  const values = adapterRecord(value, keys)
  const record = Object.fromEntries(keys.map((key, index) => [key, values[index]]))
  adapterAssert(['regular-file', 'directory', 'other'].includes(record.pathType) &&
    adapterSafeInteger(record.byteLength) && record.byteLength >= 0 && typeof record.reparsePoint === 'boolean')
  for (const key of ['volumeId', 'fileId', 'modifiedTimeNanoseconds', 'changeTimeNanoseconds']) {
    adapterAssert(record[key] === null || (typeof record[key] === 'string' && /^(?:0|[1-9][0-9]{0,63})$/.test(record[key])))
  }
  return adapterFreeze(record)
}

function adapterProjectResourceResult(operation, result) {
  const resultKinds = {
    'canonicalize-path': 'canonical-path', 'inspect-path': 'path-identity',
    'open-resource': 'resource-opened', 'inspect-open-resource': 'open-resource-identity',
    'read-resource': 'resource-bytes', 'list-directory': 'directory-entries',
    'create-temporary-root': 'resource-created', 'create-directory-exclusive': 'resource-created',
    'create-file-exclusive': 'resource-created', 'passive-tcp-listeners': 'passive-tcp-listeners',
    'close-resource': 'resource-closed',
  }
  const kind = adapterData(result, 'kind')
  adapterAssert(kind === resultKinds[operation.kind])
  if (kind === 'canonical-path') {
    const [, path] = adapterRecord(result, ['kind', 'path'])
    adapterAssert(adapterPathString(path))
    return adapterFreeze({ kind, path })
  }
  if (kind === 'path-identity' || kind === 'open-resource-identity') return adapterPathIdentity(result)
  if (kind === 'resource-opened') {
    const [, resourceHandle] = adapterRecord(result, ['kind', 'resourceHandle'])
    adapterAssert(adapterOpaque(resourceHandle))
    return adapterFreeze({ kind, resourceHandle })
  }
  if (kind === 'resource-created') {
    const [, path, resourceHandle, identity] = adapterRecord(result, ['kind', 'path', 'resourceHandle', 'pathIdentity'])
    adapterAssert(adapterPathString(path) && adapterOpaque(resourceHandle))
    return adapterFreeze({ kind, path, resourceHandle, pathIdentity: adapterPathIdentity(identity, false) })
  }
  if (kind === 'resource-bytes') {
    const [, bytes, endOfFile] = adapterRecord(result, ['kind', 'bytes', 'endOfFile'])
    adapterAssert(typeof endOfFile === 'boolean')
    return adapterFreeze({ kind, bytes: adapterCopyBytes(bytes, operation.input.maximumByteLength), endOfFile })
  }
  if (kind === 'directory-entries') {
    const [, entries] = adapterRecord(result, ['kind', 'entries'])
    return adapterFreezeData({ kind, entries: adapterArray(entries, operation.input.maximumEntries).map(entry => {
      const [name, pathType, reparsePoint] = adapterRecord(entry, ['name', 'pathType', 'reparsePoint'])
      adapterAssert(typeof name === 'string' && !name.includes('\u0000') &&
        new AdapterTextEncoder().encode(name).length <= 1024 &&
        ['regular-file', 'directory', 'other'].includes(pathType) && typeof reparsePoint === 'boolean')
      return { name, pathType, reparsePoint }
    }) })
  }
  if (kind === 'passive-tcp-listeners') {
    const [, entries] = adapterRecord(result, ['kind', 'endpoints'])
    const endpoints = adapterArray(entries, 2)
    adapterAssert(endpoints.length === 2)
    return adapterFreezeData({ kind, endpoints: endpoints.map((entry, index) => {
      const [address, port, state] = adapterRecord(entry, ['address', 'port', 'state'])
      adapterAssert(address === '127.0.0.1' && port === [5173, 8787][index] && ['free', 'occupied', 'unavailable'].includes(state))
      return { address, port, state }
    }) })
  }
  adapterRecord(result, ['kind'])
  return adapterFreeze({ kind })
}

function adapterResourcePromise(owner, kind, input, handle = null) {
  return new AdapterPromise((resolve, reject) => {
    if (owner.capLedger.cleanup.state === 'fired' || owner.capLedger.cleanup.state === 'terminal-unknown') {
      reject(adapterError(ADAPTER_FAILURE))
      return
    }
    const operationId = owner.nextResourceOperationId++
    adapterAssert(adapterSafeInteger(operationId) && operationId > 0)
    const operation = { operationId, kind, input, resolve, reject, state: 'in-flight', handle: null, targetResourceHandle: handle }
    owner.resourceLedger.operations.set(operationId, operation)
    const pendingBinding = { handle: null, generation: operationId, ready: false, terminal: false }
    const sink = adapterMakeRawSink(owner, 'resource', pendingBinding)
    try {
      const token = kind === 'close-resource'
        ? adapterInvoke(owner, 'resources', 'closeResource', [handle, sink])
        : adapterInvoke(owner, 'resources', 'performResourceOperation', [
          adapterFreeze({ operationId, kind, input: adapterFreezeResourceInput(input) }), sink,
        ])
      adapterAssert(adapterOpaque(token) && !owner.capabilityViolation)
      operation.handle = token
      pendingBinding.handle = token
      adapterBindProducer(owner, 'resource', token, operationId)
      pendingBinding.ready = true
    } catch {
      owner.capabilityError = true
      pendingBinding.terminal = true
      operation.state = 'terminal'
      operation.resolve = null
      operation.reject = null
      owner.resourceLedger.operations.delete(operationId)
      reject(adapterError(ADAPTER_FAILURE))
    }
  })
}

function adapterFreezeResourceInput(input) {
  const result = {}
  for (const key of adapterOwnKeys(input)) {
    const value = adapterData(input, key)
    if (key === 'endpoints') result[key] = adapterFreezeData(value.map(entry => ({ ...entry })))
    else result[key] = value
  }
  return adapterFreeze(result)
}

function performBrowserSyncTransportRuntimeDiagnosticResourceOperation(owner, kind, input) {
  return adapterResourcePromise(owner, kind, input)
}

function closeBrowserSyncTransportRuntimeDiagnosticResource(owner, handle) {
  const resource = owner.resourceLedger.handles.get(handle)
  adapterAssert(resource !== undefined && resource.state === 'open')
  resource.state = 'closing'
  return adapterResourcePromise(owner, 'close-resource', {}, handle)
}

function adapterExpireCap(owner, cap) {
  if (cap.state === 'fired') return
  adapterAssert(cap.state === 'armed')
  cap.state = 'fired'
  if (cap.handle !== null) {
    const binding = owner.producerBindings.get(cap.handle)?.get('scheduler')
    adapterAssert(binding !== undefined && binding.generation === cap.generation)
    binding.active = false
  }
  if (cap.kind !== 'cleanup') return
  for (const operation of owner.resourceLedger.operations.values()) {
    const reject = operation.reject
    operation.resolve = null
    operation.reject = null
    operation.state = 'terminal'
    const resourceBinding = owner.producerBindings.get(operation.handle)?.get('resource')
    if (resourceBinding) resourceBinding.active = false
    if (reject !== null) reject(adapterError(ADAPTER_FAILURE))
  }
  owner.resourceLedger.operations.clear()
  if (owner.outerCleanupWaiting !== null) {
    const resolve = owner.outerCleanupWaiting
    owner.outerCleanupWaiting = null
    resolve()
  }
}

function adapterAbandonCleanupCap(owner) {
  const cap = owner.capLedger.cleanup
  cap.state = 'terminal-unknown'
  const timerBinding = owner.producerBindings.get(cap.handle)?.get('scheduler')
  if (timerBinding) timerBinding.active = false
  for (const operation of owner.resourceLedger.operations.values()) {
    const reject = operation.reject
    operation.resolve = null
    operation.reject = null
    operation.state = 'terminal'
    const binding = owner.producerBindings.get(operation.handle)?.get('resource')
    if (binding) binding.active = false
    if (reject !== null) reject(adapterError(ADAPTER_FAILURE))
  }
  owner.resourceLedger.operations.clear()
  if (owner.outerCleanupWaiting !== null) {
    const resolve = owner.outerCleanupWaiting
    owner.outerCleanupWaiting = null
    resolve()
  }
}

function adapterPrepareCleanupCap(owner) {
  const cap = owner.capLedger.cleanup
  if (cap.state !== 'absent') return
  owner.phase = 'cleanup'
  if (owner.firstCleanupSequence === null) owner.firstCleanupSequence = ++owner.lifecycleSequence
  try {
    if (owner.cleanupOrigin === null) adapterSampleClock(owner, 'cleanup-origin')
    adapterArmCap(owner, 'cleanup', null, owner.cleanupOrigin + 60000)
  } catch {
    owner.capabilityError = true
    owner.cleanupViolation = true
    adapterAbandonCleanupCap(owner)
  }
}

function enqueueBrowserSyncTransportRuntimeDiagnosticAdapterEvent(owner, producerEvent) {
  if (arguments.length !== 2 || !adapterOwners.has(owner)) adapterFail()
  if (owner.runState !== 'active' || owner.dispatcherState === 'terminal') return undefined
  if (owner.dispatcherState === 'dispatching') {
    adapterViolation(owner, 'producer')
    return undefined
  }
  let activeProducer = null
  let activeBinding = null
  try {
    const [profile, producer, handle, generation] = adapterRecord(producerEvent,
      ['profile', 'producer', 'producerHandle', 'generation', 'event'], true)
    adapterAssert(profile === 'adr-0036-producer-event-v1' && typeof producer === 'string' &&
      adapterSafeInteger(generation) && generation > 0)
    const roles = owner.producerBindings.get(handle)
    const binding = roles?.get(producer)
    if (binding === undefined || generation > binding.generation) {
      adapterViolation(owner, 'producer')
      return undefined
    }
    if (!binding.active || generation < binding.generation) return undefined
    activeProducer = producer
    activeBinding = binding
    owner.dispatcherState = 'dispatching'
    const event = adapterData(producerEvent, 'event')
    const kind = adapterData(event, 'kind')
    if (producer === 'scheduler') {
      adapterRecord(event, ['kind'], true)
      adapterAssert(kind === 'fired')
      const cap = Object.values(owner.capLedger).find(candidate => candidate.handle === handle && candidate.generation === generation)
      adapterAssert(cap !== undefined && cap.state === 'armed')
      adapterExpireCap(owner, cap)
      if (cap.armIntentId !== null && !owner.foundationSettled) {
        adapterQueue(owner, adapterFreeze({ kind: 'cap-fired', capKind: cap.kind, armIntentId: cap.armIntentId }))
      }
    } else if (producer === 'debug-pipe-read') {
      adapterRecord(event, kind === 'chunk' ? ['kind', 'bytes'] : ['kind'], true)
      if (kind === 'chunk') adapterReceiveChunk(owner, adapterData(event, 'bytes'))
      else if (kind === 'eof') {
        adapterAssert(owner.pipeLedger.intakeState === 'open' && owner.pipeLedger.accumulator.length === 0)
        owner.pipeLedger.intakeState = 'eof'
        adapterQueue(owner, adapterFreeze({ kind: 'connection-closed' }))
      } else {
        adapterAssert(kind === 'error')
        binding.active = false
        adapterViolation(owner, 'parser')
      }
    } else if (producer === 'debug-pipe-write') {
      adapterRecord(event, kind === 'completion' ? ['kind', 'writeGeneration', 'state'] : ['kind'], true)
      const pipe = owner.pipeLedger
      if (kind === 'drain') pipe.backpressure = false
      else if (kind === 'error') {
        adapterViolation(owner, 'parser')
        adapterClosePipe(owner)
      } else {
        adapterAssert(kind === 'completion')
        const writeGeneration = adapterData(event, 'writeGeneration')
        if (writeGeneration <= pipe.terminalWriteGeneration) return undefined
        adapterAssert(writeGeneration === pipe.activeWriteGeneration && pipe.writePending)
        const state = adapterData(event, 'state')
        adapterAssert(state === 'completed' || state === 'failed')
        pipe.terminalWriteGeneration = writeGeneration
        pipe.writePending = false
        pipe.writeByteLength = 0
        if (state === 'failed') adapterViolation(owner, 'parser')
      }
    } else if (producer === 'child') {
      const child = Object.values(owner.childLedger).find(candidate => candidate.handle === handle)
      adapterAssert(child !== undefined)
      if (kind === 'stdout' || kind === 'stderr') {
        adapterRecord(event, ['kind', 'bytes'], true)
        adapterReadChildOutput(owner, child, kind, adapterData(event, 'bytes'))
      } else if (kind === 'exit' || kind === 'close') {
        const [, code, signal] = adapterRecord(event, ['kind', 'code', 'signal'], true)
        adapterAssert((code === null || (Number.isInteger(code) && code >= -2147483648 && code <= 2147483647)) &&
          (signal === null || adapterAscii(signal, 32)))
        child.rootState = 'terminal'
        if (kind === 'close') {
          child.streamsTerminal = true
          binding.active = false
        }
      } else {
        adapterRecord(event, ['kind'], true)
        adapterAssert(kind === 'error')
        child.rootState = 'unknown'
        binding.active = false
        adapterViolation(owner, 'capability')
      }
    } else if (producer === 'resource') {
      const [, operationId, state, raw] = adapterRecord(event, ['kind', 'operationId', 'state', 'result'], true)
      adapterAssert(kind === 'completion' && adapterSafeInteger(operationId) && operationId > 0)
      const operation = owner.resourceLedger.operations.get(operationId)
      adapterAssert(operation !== undefined && operation.handle === handle && operation.state === 'in-flight')
      adapterAssert(state === 'completed' || state === 'failed')
      if (state === 'failed') adapterAssert(raw === null)
      const result = state === 'completed' ? adapterProjectResourceResult(operation, raw) : null
      binding.active = false
      operation.state = 'terminal'
      const resolve = operation.resolve
      const reject = operation.reject
      operation.resolve = null
      operation.reject = null
      owner.resourceLedger.operations.delete(operationId)
      if (result !== null && (result.kind === 'resource-opened' || result.kind === 'resource-created')) {
        adapterAssert(!owner.resourceLedger.handles.has(result.resourceHandle))
        owner.resourceLedger.handles.set(result.resourceHandle, { state: 'open', kind: operation.kind })
      }
      if (operation.kind === 'close-resource') {
        const resource = owner.resourceLedger.handles.get(operation.targetResourceHandle)
        if (resource) resource.state = state === 'completed' ? 'closed' : 'unknown'
      }
      if (state === 'completed') resolve(result)
      else reject(adapterError(ADAPTER_FAILURE))
    } else adapterFail()
  } catch {
    if (activeBinding !== null) activeBinding.active = false
    adapterViolation(owner, activeProducer === 'debug-pipe-read' || activeProducer === 'debug-pipe-write' ? 'parser' : 'producer')
    if (activeProducer === 'debug-pipe-read' || activeProducer === 'debug-pipe-write') adapterClosePipe(owner)
  } finally {
    if (owner.dispatcherState !== 'terminal') owner.dispatcherState = 'idle'
  }
  return undefined
}

function adapterReadChildOutput(owner, child, stream, bytes) {
  const copy = adapterCopyBytes(bytes, 65536)
  const previous = child[`${stream}Count`]
  const take = Math.min(copy.length, Math.max(0, 65536 - previous))
  child[`${stream}Count`] += copy.length
  if (previous + copy.length > 65536) {
    child.outputOverflow = true
    adapterViolation(owner, 'capability')
  }
  if (stream !== 'stdout' || child.role === 'chrome') return
  const expected = child.role === 'gateway'
    ? new AdapterTextEncoder().encode('Das lokale SyncGateway lauscht ausschließlich auf 127.0.0.1.\n')
    : new AdapterTextEncoder().encode('  ➜  Local:   http://127.0.0.1:5173/\n')
  // The prefix table contains only the fixed literal, never Childoutput.
  const prefixes = new Array(expected.length).fill(0)
  for (let index = 1, prefix = 0; index < expected.length; index += 1) {
    while (prefix > 0 && expected[index] !== expected[prefix]) prefix = prefixes[prefix - 1]
    if (expected[index] === expected[prefix]) prefix += 1
    prefixes[index] = prefix
  }
  for (let index = 0; index < take; index += 1) {
    const byte = copy[index]
    if (byte === 0x1b) {
      child.readiness = 'ambiguous'
      child.readinessMatchedBytes = 0
      continue
    }
    let prefix = child.readinessMatchedBytes
    while (prefix > 0 && byte !== expected[prefix]) prefix = prefixes[prefix - 1]
    if (byte === expected[prefix]) prefix += 1
    if (prefix === expected.length) {
      child.readiness = child.readiness === 'not-seen' ? 'seen-once' : 'ambiguous'
      prefix = prefixes[prefix - 1]
    }
    child.readinessMatchedBytes = prefix
  }
}

function adapterClosePipe(owner) {
  const pipe = owner.pipeLedger
  if (pipe.closeAttempted || pipe.pair === null) return
  pipe.closeAttempted = true
  for (const role of ['debug-pipe-read', 'debug-pipe-write']) {
    const binding = owner.producerBindings.get(pipe.pair)?.get(role)
    if (binding) binding.active = false
  }
  try {
    adapterAssert(adapterInvoke(owner, 'pipe', 'closeDebugPipe', [pipe.pair]) === undefined)
    pipe.closed = true
  } catch {
    owner.capabilityError = true
    pipe.closeFailed = true
    owner.cleanupViolation = true
  }
  pipe.intakeState = 'closed'
  pipe.accumulator = []
  pipe.writeByteLength = 0
  pipe.writePending = false
}

function adapterArmCap(owner, kind, armIntentId, deadline = null) {
  const cap = owner.capLedger[kind]
  adapterAssert(cap.state === 'absent')
  adapterAssert(kind === 'capture' ? deadline === null :
    adapterSafeInteger(deadline) && deadline >= 0)
  cap.armIntentId = armIntentId
  cap.generation = ++owner.nextGeneration
  cap.deadline = deadline
  cap.state = kind === 'capture' ? 'pending' : 'arm-pending'
  if (kind === 'capture') return
  adapterInstallTimer(owner, cap, kind === 'setup' ? 6000 : 60000)
}

function adapterInstallTimer(owner, cap, milliseconds) {
  const binding = { handle: null, generation: cap.generation, ready: false, terminal: false }
  owner.pendingRawBindings.push(binding)
  const callback = function timerCallback() {
    if (owner.runState !== 'active' || binding.terminal) return undefined
    if (!binding.ready || owner.capabilityCallDepth !== 0 || arguments.length !== 0) {
      adapterViolation(owner, 'capability')
      return undefined
    }
    try {
      enqueueBrowserSyncTransportRuntimeDiagnosticAdapterEvent(owner, adapterFreeze({
        profile: 'adr-0036-producer-event-v1', producer: 'scheduler',
        producerHandle: binding.handle, generation: binding.generation,
        event: adapterFreeze({ kind: 'fired' }),
      }))
    } catch { adapterViolation(owner, 'capability') }
    return undefined
  }
  const handle = adapterInvoke(owner, 'scheduler', 'armTimer', [callback, milliseconds])
  adapterAssert(adapterOpaque(handle) && !owner.capabilityViolation)
  adapterBindProducer(owner, 'scheduler', handle, cap.generation)
  cap.handle = handle
  cap.state = 'armed'
  binding.handle = handle
  binding.ready = true
}

function adapterCancelCap(owner, kind, armIntentId) {
  const cap = owner.capLedger[kind]
  adapterAssert(cap.armIntentId === armIntentId && !cap.cancelAttempted &&
    (cap.state === 'armed' || cap.state === 'pending'))
  cap.cancelAttempted = true
  const oldState = cap.state
  cap.state = 'cancel-pending'
  if (cap.handle !== null) {
    const binding = owner.producerBindings.get(cap.handle)?.get('scheduler')
    adapterAssert(binding !== undefined && binding.active)
    binding.active = false
    try {
      adapterAssert(adapterInvoke(owner, 'scheduler', 'cancelTimer', [cap.handle]) === undefined)
    } catch {
      owner.capabilityError = true
      cap.state = 'terminal-unknown'
      adapterFail()
    }
  } else adapterAssert(oldState === 'pending')
  cap.state = 'cancelled'
}

function adapterSampleClock(owner, reason) {
  const reasons = ['setup-origin', 'setup-dequeue-before-reflection',
    'capture-dequeue-before-reflection', 'cleanup-origin',
    'cleanup-dequeue-before-reflection', 'cleanup-completion-after-cap-cancel']
  adapterAssert(reasons.includes(reason))
  const dequeue = reason.endsWith('dequeue-before-reflection')
  adapterAssert(!dequeue || owner.awaitingDequeueClock)
  const raw = adapterInvoke(owner, 'clock', 'readControllerNanoseconds', [])
  adapterAssert(typeof raw === 'bigint' && raw >= 0n)
  const milliseconds = Number(raw / 1000000n)
  adapterAssert(adapterSafeInteger(milliseconds) && milliseconds >= 0 &&
    (owner.lastControllerClock === null || milliseconds >= owner.lastControllerClock))
  owner.lastControllerClock = milliseconds
  owner.clockReadCount += 1
  owner.clockLedger.push({ reason, milliseconds })
  adapterAssert(owner.clockLedger.length <= 132)
  if (dequeue) {
    owner.awaitingDequeueClock = false
    const entry = owner.lastDequeuedMaterial
    owner.lastDequeuedMaterial = null
    const deadline = owner.phase === 'setup' ? owner.capLedger.setup.deadline :
      owner.phase === 'cleanup' ? owner.capLedger.cleanup.deadline : null
    if (deadline !== null && milliseconds >= deadline) adapterExpireCap(owner, owner.capLedger[owner.phase])
    if (entry !== null && (deadline === null || milliseconds < deadline)) adapterAccountDequeuedEnvelope(owner, entry)
  }
  if (reason === 'setup-origin' || reason === 'cleanup-origin') {
    const kind = reason === 'setup-origin' ? 'setup' : 'cleanup'
    adapterAssert(owner[`${kind}Origin`] === null)
    owner[`${kind}Origin`] = milliseconds
    adapterAssert(adapterSafeInteger(milliseconds + (kind === 'setup' ? 6000 : 60000)))
  }
  return adapterFreeze({ kind: 'controller-clock-sample-result', reason, monotonicMilliseconds: milliseconds })
}

function adapterCommandPayload(owner, payload) {
  const [commandId, command, sessionId, captureArmIntentId, params] = adapterRecord(payload,
    ['commandId', 'command', 'sessionId', 'captureArmIntentId', 'params'], true)
  adapterAssert(adapterSafeInteger(commandId) && commandId > 0 && ADAPTER_COMMANDS.includes(command))
  const index = ADAPTER_COMMANDS.indexOf(command)
  const operation = owner.wireLedger.operations[index]
  adapterAssert(operation.intentCount === 0)
  const ordinarySession = typeof sessionId === 'string' && sessionId.length > 0 && sessionId.length <= 256
  let projectedParams
  if (command === 'Target.getTargets') {
    adapterAssert(owner.phase === 'setup' && sessionId === null && captureArmIntentId === null)
    adapterRecord(params, [], true)
    projectedParams = {}
  } else if (command === 'Target.attachToTarget') {
    adapterAssert(owner.phase === 'setup' && sessionId === null && captureArmIntentId === null &&
      owner.wireLedger.operations[0].ackCount === 1 && owner.wireLedger.operations[0].replyCount === 1)
    const [targetId, flatten] = adapterRecord(params, ['targetId', 'flatten'], true)
    adapterAssert(typeof targetId === 'string' && targetId.length > 0 && targetId.length <= 256 && flatten === true)
    projectedParams = { targetId, flatten }
  } else if (command === 'Network.enable' || command === 'Network.disable') {
    adapterAssert(ordinarySession && captureArmIntentId === null &&
      owner.phase === (command === 'Network.enable' ? 'setup' : 'cleanup'))
    if (command === 'Network.enable') adapterAssert(owner.wireLedger.operations[1].ackCount === 1 && owner.wireLedger.operations[1].replyCount === 1)
    else adapterAssert(owner.wireLedger.operations[2].intentCount === 1 && sessionId === owner.wireLedger.operations[2].sessionId)
    adapterRecord(params, [], true)
    projectedParams = {}
  } else if (command === 'Target.detachFromTarget') {
    adapterAssert(owner.phase === 'cleanup' && sessionId === null && captureArmIntentId === null && owner.wireLedger.operations[1].intentCount === 1)
    const [bound] = adapterRecord(params, ['sessionId'], true)
    adapterAssert(typeof bound === 'string' && bound.length > 0 && bound.length <= 256)
    adapterAssert(owner.wireLedger.operations[2].sessionId === null || bound === owner.wireLedger.operations[2].sessionId)
    projectedParams = { sessionId: bound }
  } else {
    adapterAssert(owner.phase === 'capture' && ordinarySession &&
      captureArmIntentId === owner.capLedger.capture.armIntentId && owner.capLedger.capture.state === 'pending' &&
      owner.wireLedger.operations[2].ackCount === 1 && owner.wireLedger.operations[2].replyCount === 1 &&
      sessionId === owner.wireLedger.operations[2].sessionId)
    const [expression, awaitPromise, returnByValue, generatePreview] = adapterRecord(params,
      ['expression', 'awaitPromise', 'returnByValue', 'generatePreview'], true)
    adapterAssert(typeof expression === 'string' && awaitPromise === true && returnByValue === true && generatePreview === false)
    const encodedExpression = new AdapterTextEncoder().encode(expression)
    adapterAssert(encodedExpression.length === 4259 && adapterHash(encodedExpression) === ADAPTER_EVALUATION_SHA256 &&
      expression === owner.sourceState.evaluationString)
    projectedParams = { expression, awaitPromise, returnByValue, generatePreview }
  }
  const wire = sessionId === null ? { id: commandId, method: command, params: projectedParams }
    : { id: commandId, method: command, params: projectedParams, sessionId }
  adapterFreezeData(wire)
  operation.intentCount += 1
  operation.commandId = commandId
  operation.sessionId = sessionId
  operation.params = projectedParams
  if (command === 'Target.getTargets') {
    owner.attemptStarted = true
    owner.trackerState = 'OBSERVATION_NO_AOBS'
  }
  return { operation, wire, commandId, command, captureArmIntentId }
}

function adapterSendCommand(owner, payload) {
  const { operation, wire, commandId, command } = adapterCommandPayload(owner, payload)
  const pipe = owner.pipeLedger
  adapterAssert(!owner.hardViolation && pipe.pair !== null && !pipe.closed &&
    !pipe.backpressure && !pipe.writePending && owner.childLedger.vite.readiness === 'seen-once' &&
    owner.childLedger.gateway.readiness === 'seen-once')
  const serialized = adapterStringify(wire)
  const encoded = new AdapterTextEncoder().encode(serialized)
  adapterAssert(encoded.length + 1 <= 65536)
  const frame = new AdapterUint8Array(encoded.length + 1)
  frame.set(encoded)
  pipe.activeWriteGeneration += 1
  pipe.writePending = true
  pipe.writeByteLength = frame.length
  const pendingBinding = { handle: pipe.pair, generation: pipe.generation,
    writeGeneration: pipe.activeWriteGeneration, ready: false, terminal: false }
  const completion = adapterMakeRawSink(owner, 'debug-pipe-completion', pendingBinding)
  try {
    const result = adapterInvoke(owner, 'pipe', 'writeDebugPipe', [pipe.pair, frame, completion])
    const [acceptedByteLength, backpressure] = adapterRecord(result, ['acceptedByteLength', 'backpressure'])
    adapterAssert(adapterSafeInteger(acceptedByteLength) && acceptedByteLength >= 0 &&
      acceptedByteLength <= frame.length && typeof backpressure === 'boolean' && !owner.capabilityViolation)
    pendingBinding.ready = true
    pipe.backpressure = backpressure
    adapterAssert(acceptedByteLength === frame.length)
    operation.acceptedFrameCount += 1
    operation.profileMatch = true
    operation.frameSha256 = adapterHash(frame)
    if (command === 'Runtime.evaluate') {
      const cap = owner.capLedger.capture
      try {
        adapterInstallTimer(owner, cap, 6000)
        adapterAssert(!owner.capabilityViolation)
      } catch {
        cap.state = 'activation-unknown'
        adapterClosePipe(owner)
        adapterFail()
      }
      // This causal origin is the one accepted-write/timer-arm commit. Capture
      // has a window, never an additional numeric clock sample or deadline.
      owner.captureOrigin = { commandId, armIntentId: cap.armIntentId, generation: cap.generation }
      owner.wireLedger.evaluationSha256 = ADAPTER_EVALUATION_SHA256
      owner.wireLedger.evaluationByteLength = 4259
      operation.ackCount += 1
      return adapterFreeze({ kind: 'protocol-command-send-result', commandId, sendState: 'sent-and-capture-cap-started' })
    }
    operation.ackCount += 1
    return adapterFreeze({ kind: 'protocol-command-send-result', commandId, sendState: 'sent' })
  } catch {
    operation.sendUnknown = true
    if (command === 'Runtime.evaluate' && operation.acceptedFrameCount !== 0 && operation.ackCount === 0) {
      owner.capLedger.capture.state = 'activation-unknown'
    }
    adapterFail()
  }
}

function adapterExchange(owner, intent) {
  return adapterOwnedExchangePromise((resolve, reject) => {
    if (owner.activeExchange !== null || owner.runState !== 'active' || owner.foundationSettled) {
      adapterViolation(owner, 'producer')
      reject(adapterError(ADAPTER_EFFECT_FAILURE))
      return
    }
    const exchange = { resolve, reject, intentId: null, kind: null }
    owner.activeExchange = exchange
    const fulfill = value => {
      if (owner.activeExchange !== exchange) return
      owner.activeExchange = null
      exchange.resolve = null
      exchange.reject = null
      resolve(value)
    }
    try {
      const [intentId, kind, payload] = adapterRecord(intent, ['intentId', 'kind', 'payload'], true)
      if (owner.phase === 'cleanup' && owner.firstCleanupSequence === null) owner.firstCleanupSequence = ++owner.lifecycleSequence
      adapterAssert(adapterSafeInteger(intentId) && intentId === owner.nextIntentId)
      owner.nextIntentId += 1
      exchange.intentId = intentId
      exchange.kind = kind
      let result
      if (kind === 'capability-probe') {
        const [profile] = adapterRecord(payload, ['profile'], true)
        adapterAssert(owner.phase === 'prestart' && !owner.probeConsumed && profile === ADAPTER_EFFECT_PROFILE)
        owner.probeConsumed = true
        adapterValidateCapabilities(owner.runtimeCapabilities)
        result = adapterFreeze({ kind: 'capability-probe-result', profile, capabilitySet: ADAPTER_EFFECT_SET })
      } else if (kind === 'controller-clock-sample') {
        const [reason] = adapterRecord(payload, ['reason'], true)
        if (reason === 'setup-origin') {
          adapterAssert(owner.phase === 'prestart' && owner.probeConsumed)
          owner.phase = 'setup'
        } else if (reason.startsWith('cleanup-')) adapterAssert(owner.phase === 'cleanup')
        else adapterAssert(reason.startsWith(`${owner.phase}-`))
        result = adapterSampleClock(owner, reason)
      } else if (kind === 'cap-arm') {
        const capKind = adapterData(payload, 'capKind')
        if (capKind === 'capture') {
          const [, mode, windowMilliseconds] = adapterRecord(payload, ['capKind', 'mode', 'windowMilliseconds'], true)
          adapterAssert(mode === 'pending-send-activation' && windowMilliseconds === 6000 &&
            owner.phase === 'setup' && owner.capLedger.setup.state === 'cancelled')
          owner.phase = 'capture'
          adapterArmCap(owner, 'capture', intentId)
          result = adapterFreeze({ kind: 'cap-arm-result', capKind, armState: 'pending' })
        } else {
          const [, mode, deadlineMilliseconds] = adapterRecord(payload, ['capKind', 'mode', 'deadlineMilliseconds'], true)
          adapterAssert(['setup', 'cleanup'].includes(capKind) && owner.phase === capKind &&
            mode === 'absolute-controller-monotonic' && adapterSafeInteger(deadlineMilliseconds) &&
            deadlineMilliseconds === owner[`${capKind}Origin`] + (capKind === 'setup' ? 6000 : 60000))
          adapterArmCap(owner, capKind, intentId, deadlineMilliseconds)
          result = adapterFreeze({ kind: 'cap-arm-result', capKind, armState: 'armed' })
        }
      } else if (kind === 'cap-cancel') {
        const [capKind, armIntentId] = adapterRecord(payload, ['capKind', 'armIntentId'], true)
        adapterAssert(['setup', 'capture', 'cleanup'].includes(capKind))
        adapterCancelCap(owner, capKind, armIntentId)
        result = adapterFreeze({ kind: 'cap-cancel-result', capKind, armIntentId, cancelState: 'cancelled' })
      } else if (kind === 'protocol-command-send') result = adapterSendCommand(owner, payload)
      else if (kind === 'observation-dequeue') {
        const [phase] = adapterRecord(payload, ['phase'], true)
        adapterAssert(phase === owner.phase && ['setup', 'capture', 'cleanup'].includes(phase) &&
          owner.dequeueCount < 128 && owner.waitingDequeueResolver === null && !owner.awaitingDequeueClock)
        owner.dequeueCount += 1
        adapterAssert(!owner.pipeLedger.violation && !owner.producerViolation)
        owner.waitingDequeueResolver = fulfill
        adapterDeliverQueued(owner)
        return
      } else if (kind === 'cleanup-step') {
        const [checkId, action] = adapterRecord(payload, ['checkId', 'action'], true)
        adapterAssert(owner.phase === 'cleanup' && !owner.cleanupLedger.steps.has(checkId) &&
          ADAPTER_CLEANUP_STEPS.some(pair => pair[0] === checkId && pair[1] === action))
        adapterStartCleanupStep(owner, checkId)
        result = adapterFreeze({ kind: 'cleanup-step-result', checkId, stepState: 'accepted' })
      } else adapterFail()
      fulfill(result)
    } catch {
      owner.capabilityError = true
      if (owner.activeExchange === exchange) owner.activeExchange = null
      owner.waitingDequeueResolver = null
      owner.hardViolation = true
      if (owner.phase === 'cleanup' &&
        ['arm-pending', 'terminal-unknown'].includes(owner.capLedger.cleanup.state)) adapterAbandonCleanupCap(owner)
      reject(adapterError(ADAPTER_EFFECT_FAILURE))
    }
  })
}

function adapterCreateCap(kind) {
  return { kind, armIntentId: null, generation: 0, state: 'absent', handle: null,
    deadline: null, cancelAttempted: false }
}

function adapterCreateChild(role) {
  return { role, creation: 'never-attempted', handle: null, rootState: 'absent',
    generation: 0, terminateAttempted: false, closeAttempted: false,
    stdoutCount: 0, stderrCount: 0, outputOverflow: false,
    readiness: 'not-seen', readinessMatchedBytes: 0, spawnProfile: null }
}

function createBrowserSyncTransportRuntimeDiagnosticAdapterOwner(runtimeCapabilities) {
  if (arguments.length !== 1) adapterFail(ADAPTER_ARGUMENTS)
  adapterValidateCapabilities(runtimeCapabilities, true)
  const owner = {
    api: null, ownerRunPromise: null, runState: 'unused', activeRunToken: null,
    phase: 'prestart', attemptStarted: false, activeExchange: null,
    waitingDequeueResolver: null, fifo: [], fifoMaterialBytes: 0,
    nextFifoSequence: 1, dispatcherState: 'idle',
    capLedger: { setup: adapterCreateCap('setup'), capture: adapterCreateCap('capture'), cleanup: adapterCreateCap('cleanup') },
    wireLedger: {
      operations: ADAPTER_COMMANDS.map(command => ({ command, intentCount: 0, acceptedFrameCount: 0,
        ackCount: 0, profileMatch: false, replyState: 'unobserved', replyCount: 0,
        commandId: null, sessionId: null, params: null, frameSha256: null, sendUnknown: false })),
      evaluationSha256: null, evaluationByteLength: 0,
    },
    pipeLedger: { pair: null, generation: 0, creation: 'never-attempted', intakeState: 'absent',
      accumulator: [], frameCount: 0, decodeCount: 0, scanCount: 0,
      parseCount: 0, messageCount: 0, dequeuedMaterialBytes: 0,
      violation: false, backpressure: false, writePending: false, writeByteLength: 0,
      activeWriteGeneration: 0, terminalWriteGeneration: 0, closeAttempted: false, closed: false, closeFailed: false },
    childLedger: { vite: adapterCreateChild('vite'), gateway: adapterCreateChild('gateway'), chrome: adapterCreateChild('chrome') },
    resourceLedger: { operations: new Map(), handles: new Map(),
      temporaryRoot: { creation: 'never-attempted', path: null, handle: null },
      profile: { creation: 'never-attempted', path: null, handle: null, pendingResult: null },
      fragments: { creation: 'never-attempted' } },
    foundationProjection: null, adapterObservationSnapshot: null,
    cleanupLedger: { steps: new Map(), result: 'unproven', terminal: false, finalizeReason: null },
    finalizationCount: 0, writerCallCount: 0,
    runtimeCapabilities, capabilityCallDepth: 0, capabilityViolation: false,
    capabilityError: false,
    producerViolation: false, hardViolation: false, cleanupViolation: false,
    producerBindings: new Map(), nextGeneration: 0, nextResourceOperationId: 1,
    nextIntentId: 1, dequeueCount: 0, awaitingDequeueClock: false,
    lastDequeuedSequence: null, lastDequeuedMaterial: null, lastControllerClock: null, clockReadCount: 0, clockLedger: [],
    setupOrigin: null, cleanupOrigin: null, captureOrigin: null, r0: null, sourceState: null,
    probeConsumed: false, foundationSettled: false, foundationSettlementObserved: false, foundationInstance: null,
    trackerState: 'PREATTEMPT', notificationCount: 0, notificationInvoking: false, notificationEntryActive: false,
    notificationViolation: false, outerCleanupWaiting: null, outerCleanupStarted: false,
    markerSequence: null, firstCleanupSequence: null, lifecycleSequence: 0,
    ownerFinalizationCount: 0, terminalOutcome: null, terminalOwnershipFacts: null, pendingRawBindings: [],
  }
  adapterOwners.add(owner)
  const run = function run() {
    if (owner.runState !== 'unused') return new AdapterPromise((resolve, reject) => reject(adapterError(ADAPTER_USED)))
    owner.runState = 'active'
    owner.activeRunToken = 1
    const arity = arguments.length
    owner.ownerRunPromise = new AdapterPromise((resolve, reject) => {
      if (arity !== 0) {
        owner.runState = 'terminal'
        owner.activeRunToken = null
        owner.runtimeCapabilities = null
        reject(adapterError(ADAPTER_ARGUMENTS))
        return
      }
      const task = adapterRunOwner(owner)
      adapterApply(adapterThen, task, [
        function success(record) { resolve(record); return undefined },
        function failure() { reject(adapterError(ADAPTER_FAILURE)); return undefined },
      ])
    })
    return owner.ownerRunPromise
  }
  adapterFreeze(run)
  owner.api = adapterFreeze({ run })
  return owner
}

export function createBrowserSyncTransportRuntimeDiagnosticAdapter() {
  if (arguments.length !== 0) adapterFail(ADAPTER_ARGUMENTS)
  const owner = createBrowserSyncTransportRuntimeDiagnosticAdapterOwner(
    createSelectedBrowserSyncTransportRuntimeDiagnosticCapabilities()
  )
  return owner.api
}

function adapterSpawn(owner, role) {
  const child = owner.childLedger[role]
  adapterAssert(child.creation === 'never-attempted')
  const source = owner.sourceState
  const environment = owner.r0.environment.map(entry => ({ name: entry.name, value: entry.value }))
  let args
  let entryPath
  if (role === 'vite') {
    args = ['--host', '127.0.0.1', '--port', '5173', '--strictPort']
    entryPath = source.viteEntryPath
    environment.push({ name: 'NO_COLOR', value: '1' })
  } else if (role === 'gateway') {
    args = []
    entryPath = source.gatewayEntryPath
    const port = '8787'
    adapterAssert(port.length === 4 && [...port].every((value, index) => value.charCodeAt(0) === [56, 55, 56, 55][index]))
    environment.push({ name: 'GOLDENDAWN_SYNC_GATEWAY_PORT', value: port })
    environment.push({ name: 'GOLDENDAWN_SYNC_GATEWAY_ALLOWED_ORIGIN', value: 'http://127.0.0.1:5173' })
  } else {
    args = ['--remote-debugging-pipe', `--user-data-dir=${owner.resourceLedger.profile.path}`,
      '--incognito', '--no-first-run', '--no-default-browser-check', '--new-window', 'http://127.0.0.1:5173/']
    entryPath = null
  }
  adapterAssert(args.length <= 16 && environment.length <= 16)
  const profile = adapterFreezeData({ role,
    executablePath: role === 'chrome' ? source.chromeExecutablePath : source.nodeExecutablePath,
    entryPath, arguments: args, workingDirectory: source.repositoryRoot, environment,
    stdioProfile: role === 'chrome' ? 'chrome-debug-pipe-v1' : 'node-readiness-v1',
    windowsHide: role !== 'chrome', shell: false, detached: false })
  adapterAssert(new AdapterTextEncoder().encode(adapterStringify({ arguments: args, environment })).length <= 65536)
  child.spawnProfile = profile
  child.creation = 'may-have-started'
  child.rootState = 'unknown'
  child.generation = ++owner.nextGeneration
  const pending = { handle: null, generation: child.generation, ready: false, terminal: false }
  const sink = adapterMakeRawSink(owner, 'child', pending)
  const handle = adapterInvoke(owner, 'launcher', 'spawnChild', [profile, sink])
  adapterAssert(adapterOpaque(handle) && !owner.capabilityViolation)
  adapterBindProducer(owner, 'child', handle, child.generation)
  child.handle = handle
  child.rootState = 'active'
  pending.handle = handle
  pending.ready = true
}

async function adapterCreateResourcesAndChildren(owner) {
  const environment = owner.r0.environment
  const temporaryParent = environment.find(entry => entry.name === 'TEMP')?.value
  adapterAssert(adapterPathString(temporaryParent))
  await sourceCanonicalChain(owner, temporaryParent, 'directory')
  const root = owner.resourceLedger.temporaryRoot
  root.creation = 'may-exist'
  const created = await performBrowserSyncTransportRuntimeDiagnosticResourceOperation(owner,
    'create-temporary-root', { parentPath: temporaryParent, prefix: 'goldendawn-diagnostic-' })
  adapterAssert(created.kind === 'resource-created' && created.pathIdentity.pathType === 'directory' &&
    !created.pathIdentity.reparsePoint && sourcePath.dirname(created.path) === temporaryParent &&
    sourcePath.basename(created.path).startsWith('goldendawn-diagnostic-'))
  root.path = created.path
  root.handle = created.resourceHandle
  root.identity = created.pathIdentity
  await sourceCanonicalChain(owner, root.path, 'directory')
  const rootIdentity = await performBrowserSyncTransportRuntimeDiagnosticResourceOperation(owner,
    'inspect-open-resource', { resourceHandle: root.handle })
  adapterAssert(sourceSameIdentity(root.identity, sourceIdentity(owner, rootIdentity, 'directory')))
  const profile = owner.resourceLedger.profile
  profile.creation = 'may-exist'
  const pendingProfile = performBrowserSyncTransportRuntimeDiagnosticResourceOperation(owner,
    'create-directory-exclusive', { parentHandle: root.handle, name: 'profile' })
  // The shared operation ledger owns this pending create during partial spawn
  // failure. Consume its rejection immediately, including during outer cleanup.
  const profileResult = adapterApply(adapterThen, pendingProfile, [
    function createdProfile(result) {
      adapterAssert(result.kind === 'resource-created' && result.pathIdentity.pathType === 'directory' &&
        !result.pathIdentity.reparsePoint && result.path === sourcePath.join(root.path, 'profile'))
      profile.path = result.path
      profile.handle = result.resourceHandle
      profile.identity = result.pathIdentity
      return result
    },
    function failedProfile() { return null },
  ])
  // Handle-validation errors are consumed immediately as well. This one
  // operation remains owned by the common cleanup cap on a partial spawn.
  profile.pendingResult = adapterApply(adapterThen, profileResult, [
    function acceptedProfile(result) { return result },
    function rejectedProfile() { owner.capabilityError = true; return null },
  ])
  await adapterSpawn(owner, 'vite')
  await adapterSpawn(owner, 'gateway')
  const madeProfile = await profile.pendingResult
  profile.pendingResult = null
  adapterAssert(madeProfile !== null)
  adapterAssert(madeProfile.kind === 'resource-created' && madeProfile.pathIdentity.pathType === 'directory' &&
    !madeProfile.pathIdentity.reparsePoint && madeProfile.path === sourcePath.join(root.path, 'profile'))
  profile.path = madeProfile.path
  profile.handle = madeProfile.resourceHandle
  profile.identity = madeProfile.pathIdentity
  await sourceCanonicalChain(owner, profile.path, 'directory')
  const profileIdentity = await performBrowserSyncTransportRuntimeDiagnosticResourceOperation(owner,
    'inspect-open-resource', { resourceHandle: profile.handle })
  adapterAssert(sourceSameIdentity(profile.identity, sourceIdentity(owner, profileIdentity, 'directory')))
  await adapterSpawn(owner, 'chrome')
  const pipe = owner.pipeLedger
  pipe.creation = 'may-exist'
  pipe.generation = ++owner.nextGeneration
  const pending = { handle: null, generation: pipe.generation, ready: false, terminal: false }
  const sink = adapterMakeRawSink(owner, 'debug-pipe', pending)
  const pair = adapterInvoke(owner, 'pipe', 'openDebugPipe', [owner.childLedger.chrome.handle, sink])
  adapterAssert(adapterOpaque(pair) && !owner.capabilityViolation)
  adapterBindProducer(owner, 'debug-pipe-read', pair, pipe.generation)
  adapterBindProducer(owner, 'debug-pipe-write', pair, pipe.generation)
  pipe.pair = pair
  pipe.intakeState = 'open'
  pending.handle = pair
  pending.ready = true
}

function adapterStopChild(owner, role) {
  const child = owner.childLedger[role]
  if (child.creation === 'never-attempted') return 'confirmed'
  if (child.handle === null) return 'unproven'
  if (!child.terminateAttempted && child.rootState !== 'terminal') {
    child.terminateAttempted = true
    try { adapterAssert(adapterInvoke(owner, 'launcher', 'terminateChild', [child.handle]) === undefined) }
    catch { owner.capabilityError = true; child.stopFailed = true }
  }
  if (!child.closeAttempted && child.streamsTerminal !== true) {
    child.closeAttempted = true
    try { adapterAssert(adapterInvoke(owner, 'launcher', 'closeChild', [child.handle]) === undefined) }
    catch { owner.capabilityError = true; child.stopFailed = true }
  }
  // The root handle is never promoted to evidence about process descendants.
  return child.stopFailed ? 'failed' : 'unproven'
}

function adapterFinishCleanupStep(owner, node, state) {
  if (node.state === 'terminal') return
  node.state = 'terminal'
  node.result = state
  if (state === 'failed') owner.cleanupViolation = true
  if (!owner.foundationSettled && owner.capLedger.cleanup.state !== 'fired') {
    try {
      adapterQueue(owner, adapterFreeze({ kind: 'cleanup-fact', checkId: node.checkId, fact: state !== 'failed' }))
    } catch {
      // A full FIFO is a terminal violation, including from an asynchronous
      // resource completion. Keep the owned cleanup continuation nonthrowing.
      adapterViolation(owner, 'parser')
      adapterClosePipe(owner)
    }
  }
  if (owner.outerCleanupWaiting !== null && [...owner.cleanupLedger.steps.values()].every(step => step.state === 'terminal')) {
    const resolve = owner.outerCleanupWaiting
    owner.outerCleanupWaiting = null
    resolve()
  }
}

function adapterStartCleanupStep(owner, checkId) {
  const existing = owner.cleanupLedger.steps.get(checkId)
  if (existing !== undefined) return existing
  const node = { checkId, state: 'in-flight', result: 'unproven' }
  owner.cleanupLedger.steps.set(checkId, node)
  let result = 'unproven'
  if (checkId === 'debugPipeClosed') {
    adapterClosePipe(owner)
    result = owner.pipeLedger.creation === 'never-attempted' || owner.pipeLedger.closed ? 'confirmed' :
      owner.pipeLedger.closeFailed ? 'failed' : 'unproven'
  } else if (checkId === 'browserStopped') result = adapterStopChild(owner, 'chrome')
  else if (checkId === 'devServerStopped') result = adapterStopChild(owner, 'vite')
  else if (checkId === 'gatewayStopped') result = adapterStopChild(owner, 'gateway')
  else if (checkId === 'profileRemoved') result = owner.resourceLedger.profile.creation === 'never-attempted' ? 'confirmed' : 'unproven'
  else if (checkId === 'harnessFragmentsRemoved') result = owner.resourceLedger.temporaryRoot.creation === 'never-attempted' ? 'confirmed' : 'unproven'
  else if (checkId === 'permissionSiteCacheAndServiceWorkerStateCleared') {
    result = owner.resourceLedger.profile.creation === 'never-attempted' &&
      owner.childLedger.chrome.creation === 'never-attempted' ? 'confirmed' : 'unproven'
  } else if (checkId === 'environmentRestored') result = 'confirmed'
  else if (checkId === 'portsFree') {
    const task = performBrowserSyncTransportRuntimeDiagnosticResourceOperation(owner,
      'passive-tcp-listeners', { endpoints: [{ address: '127.0.0.1', port: 5173 }, { address: '127.0.0.1', port: 8787 }] })
    adapterApply(adapterThen, task, [value => {
      const states = value.endpoints.map(endpoint => endpoint.state)
      adapterFinishCleanupStep(owner, node, states.includes('occupied') ? 'failed' : states.every(state => state === 'free') ? 'confirmed' : 'unproven')
      return undefined
    }, function failed() { adapterFinishCleanupStep(owner, node, 'unproven'); return undefined }])
    return node
  } else if (checkId === 'repositoryAndIndexRestored' || checkId === 'historicalEvidenceHashUnchanged') {
    // These become final only after the separate post-cleanup byte and identity check.
    result = 'unproven'
  } else if (checkId === 'observerStorageLogAndTelemetryResidueAbsent') {
    result = owner.resourceLedger.temporaryRoot.creation === 'never-attempted' ? 'confirmed' : 'unproven'
  }
  adapterFinishCleanupStep(owner, node, result)
  return node
}

async function adapterOuterCleanup(owner) {
  if (owner.outerCleanupStarted) return
  owner.outerCleanupStarted = true
  owner.phase = 'cleanup'
  if (owner.firstCleanupSequence === null) owner.firstCleanupSequence = ++owner.lifecycleSequence
  const cap = owner.capLedger.cleanup
  adapterPrepareCleanupCap(owner)
  for (const [checkId] of ADAPTER_CLEANUP_STEPS) adapterStartCleanupStep(owner, checkId)
  if (owner.sourceState?.captureCompleted) {
    try { await verifyBrowserSyncTransportRuntimeDiagnosticSources(owner, 'post-cleanup') }
    catch { if (cap.state !== 'fired' && owner.sourceState.violation) owner.cleanupViolation = true }
  }
  try { await closeBrowserSyncTransportRuntimeDiagnosticSources(owner) }
  catch (error) { if (cap.state !== 'fired' && !sourceUnavailableFailures.has(error)) owner.cleanupViolation = true }
  if (owner.resourceLedger.profile.pendingResult !== null) {
    await owner.resourceLedger.profile.pendingResult
    owner.resourceLedger.profile.pendingResult = null
  }
  for (const resource of [owner.resourceLedger.profile, owner.resourceLedger.temporaryRoot]) {
    if (cap.state === 'fired') break
    if (resource.handle !== null && owner.resourceLedger.handles.get(resource.handle)?.state === 'open') {
      try {
        await sourceCanonicalChain(owner, resource.path, 'directory')
        const identity = await performBrowserSyncTransportRuntimeDiagnosticResourceOperation(owner,
          'inspect-open-resource', { resourceHandle: resource.handle })
        adapterAssert(sourceSameIdentity(resource.identity, sourceIdentity(owner, identity, 'directory')))
        await closeBrowserSyncTransportRuntimeDiagnosticResource(owner, resource.handle)
      } catch (error) { if (cap.state !== 'fired' && !sourceUnavailableFailures.has(error)) owner.cleanupViolation = true }
    }
  }
  if (cap.state === 'armed' && [...owner.cleanupLedger.steps.values()].some(step => step.state !== 'terminal')) {
    await new AdapterPromise(resolve => { owner.outerCleanupWaiting = resolve })
  }
  if (cap.state === 'armed' && !cap.cancelAttempted) {
    try {
      adapterCancelCap(owner, 'cleanup', cap.armIntentId)
      adapterSampleClock(owner, 'cleanup-completion-after-cap-cancel')
    }
    catch { owner.capabilityError = true; owner.cleanupViolation = true }
  }
  for (const node of owner.cleanupLedger.steps.values()) {
    if (node.state !== 'terminal') { node.state = 'terminal'; node.result = 'unproven' }
  }
  for (const roles of owner.producerBindings.values()) for (const binding of roles.values()) binding.active = false
  for (const operation of owner.resourceLedger.operations.values()) {
    if (operation.reject !== null) operation.reject(adapterError(ADAPTER_FAILURE))
    operation.resolve = null
    operation.reject = null
    operation.state = 'terminal'
  }
  owner.resourceLedger.operations.clear()
  owner.waitingDequeueResolver = null
  owner.activeExchange = null
  owner.fifo = []
  owner.fifoMaterialBytes = 0
  owner.pipeLedger.accumulator = []
  owner.lastDequeuedMaterial = null
  for (const operation of owner.wireLedger.operations) {
    operation.commandId = null
    operation.sessionId = null
    operation.params = null
  }
  owner.cleanupLedger.terminal = true
  owner.cleanupLedger.result = owner.cleanupViolation ? 'failed' : 'unproven'
  owner.cleanupLedger.finalizeReason = cap.state === 'fired' ? 'cleanup-cap' :
    owner.cleanupViolation ? 'cleanup-terminal-failure' : 'all-steps-terminal'
  adapterDiscardTerminalOwnership(owner)
}

const ADAPTER_REPLAY_DEFINITIONS = adapterFreeze([
  ['artifact.transport.src/transports/browserSyncTransport.js.sha256', 'historical-commit-artifact-sha256', '3c41b17e1d80e94e4b05e7c76f019d3fd3af281b451e85c8f90d80fd25391c28', 'H64'],
  ['artifact.contract.src/contracts/syncContract.js.sha256', 'historical-commit-artifact-sha256', '96ad2c52fb4545d6e587d9b3fd86d76a4a735e8cb33e9b572a3d7d5f4e5a6aeb', 'H64'],
  ['artifact.gateway.server/startLocalSyncGateway.js.sha256', 'historical-commit-artifact-sha256', '677be5e9cace926ba0a1f3540e39926f5b5c54dd57440bd1ac53de6f255ca6d5', 'H64'],
  ['artifact.gateway.server/localSyncGatewayRuntimeConfig.js.sha256', 'historical-commit-artifact-sha256', 'e9a4419666e33b57d1ed5712e00f3d954a5b82c1cc7956b9a7582e0462743836', 'H64'],
  ['artifact.gateway.server/localSyncGatewayHttpServer.js.sha256', 'historical-commit-artifact-sha256', '70243e66f85448c23920ea30409a03be7ed349b6868535729f4a798f012fdbb8', 'H64'],
  ['artifact.gateway.src/gateways/syncGatewayRequestBoundary.js.sha256', 'historical-commit-artifact-sha256', 'b1e55f03283bfdd1d35562951503471b4a812ac61868af0b927a05623e597b79', 'H64'],
  ['artifact.gateway.src/agents/syncAgent.js.sha256', 'historical-commit-artifact-sha256', '899e06d3a80925cab8680749d133e9a8d87f30a2fd1d509cf7339eb1c8d65db0', 'H64'],
  ['artifact.frontend.runtime-source-set.sha256', 'historical-commit-artifact-sha256', '6f3d5740b043308b4d38df33b6293c9064d8dd1b3f0c5801d50844336c195591', 'H64'],
  ['repository.state', 'historical-record-value', 'clean', 'STATE'],
  ['hostRuntime.executionClass', 'historical-record-value', 'local-disposable', 'A64'],
  ['operatingSystem.family', 'historical-record-value', 'windows', 'A32'],
  ['operatingSystem.edition', 'historical-record-value', 'Windows 11 Home', 'A64'],
  ['operatingSystem.architecture', 'historical-record-value', 'x64', 'A16'],
  ['operatingSystem.version', 'historical-record-value', '25H2', 'A64'],
  ['operatingSystem.build', 'historical-record-value', '26200', 'A32'],
  ['operatingSystem.patch', 'historical-record-value', '9168', 'A32'],
  ['node.version', 'historical-record-value', '24.19.0', 'S32'],
  ['browser.product', 'historical-record-value', 'chrome', 'A32'],
  ['browser.channel', 'historical-record-value', 'stable', 'A32'],
  ['browser.version', 'historical-record-value', '151.0.7922.174', 'A64'],
  ['browser.engine', 'historical-record-value', 'blink', 'A32'],
  ['browser.engineBuild', 'historical-record-value', '@39c51c70dd5feca6b6aba5bb7997b595011c553d', 'A128'],
  ['browser.executionMode', 'historical-record-value', 'visible', 'A32'],
  ['browser.privateMode', 'historical-record-value', true, 'B'],
  ['profile.lifecycle', 'historical-record-value', 'fresh-disposable', 'A64'],
  ['profile.extensions', 'historical-record-value', 'none', 'A64'],
  ['profile.startParameters', 'historical-record-value', 'effective-non-bypassing', 'A128'],
  ['profile.featureFlags', 'historical-record-value', 'none-effective', 'A128'],
  ['profile.enterprisePolicies', 'historical-record-value', 'none-effective', 'A128'],
  ['networkEnvironment.proxy', 'historical-record-value', 'inactive', 'A32'],
  ['networkEnvironment.vpn', 'historical-record-value', 'inactive', 'A32'],
  ['initialState.serviceWorker', 'historical-record-value', 'absent', 'A64'],
  ['initialState.permission', 'historical-record-value', 'prompt', 'A64'],
  ['initialState.preflightCache', 'historical-record-value', 'empty-confirmed', 'A64'],
  ['initialState.siteCache', 'historical-record-value', 'empty-confirmed', 'A64'],
  ['bindingComparisonProfile', 'historical-record-value', 'ephemeral-exact-effective-context-comparison-without-retention', 'A128'],
  ['frontend.topLevelUrl', 'historical-record-value', 'http://127.0.0.1:5173/', 'A2048'],
  ['frontend.serializedOrigin', 'historical-record-value', 'http://127.0.0.1:5173', 'A2048'],
  ['frontend.contextKind', 'historical-record-value', 'top-level', 'A32'],
  ['frontend.isSecureContext', 'historical-record-value', true, 'B'],
  ['transportRequest.factoryProfile', 'historical-record-value', 'real-default-factory', 'A64'],
  ['transportRequest.compositionProfile', 'historical-record-value', 'transport-only', 'A64'],
  ['transportRequest.requestProfile', 'historical-record-value', 'synthetic-v1-syncTest-empty-payload', 'A128'],
  ['transportRequest.requestEqualityMethod', 'historical-record-value', 'ephemeral-full-value-comparison-without-retention', 'A128'],
  ['transportRequest.initialUrl', 'historical-record-value', 'http://127.0.0.1:8787/api/sync-test', 'A2048'],
  ['transportRequest.initialScheme', 'historical-record-value', 'http', 'A16'],
  ['transportRequest.initialHost', 'historical-record-value', '127.0.0.1', 'A256'],
  ['transportRequest.initialPort', 'historical-record-value', 8787, 'P'],
  ['transportRequest.initialPath', 'historical-record-value', '/api/sync-test', 'A1024'],
  ['transportRequest.requestInitProfile', 'historical-record-value', 'adr-0028-fixed', 'A64'],
  ['gateway.listenerHost', 'historical-record-value', '127.0.0.1', 'A256'],
  ['gateway.listenerPort', 'historical-record-value', 8787, 'P'],
  ['gateway.portEnvironmentValue', 'historical-record-value', '"8787"', 'A16'],
  ['gateway.allowedOrigin.value', 'historical-record-value', 'http://127.0.0.1:5173', 'A2048'],
  ['gateway.allowedOrigin.relationToFrontend', 'historical-record-value', 'matches-frontend-origin', 'A64'],
  ['gateway.endpoint', 'historical-record-value', 'http://127.0.0.1:8787/api/sync-test', 'A2048'],
  ['gateway.responderProfile', 'historical-record-value', 'production-gateway', 'A64'],
  ['gateway.responseProfile', 'historical-record-closed-derivation', 'adr-0020-options204-post200-syncresponse-v1', 'A128'],
  ['toolchain.vite.lockfileVersion', 'historical-commit-closed-derivation', '8.1.4', 'S32'],
].map(adapterFreeze))

function adapterBuildRunBinding(owner) {
  const source = owner.sourceState
  const values = new Map()
  const sourcePaths = ['src/transports/browserSyncTransport.js', 'src/contracts/syncContract.js',
    'server/startLocalSyncGateway.js', 'server/localSyncGatewayRuntimeConfig.js',
    'server/localSyncGatewayHttpServer.js', 'src/gateways/syncGatewayRequestBoundary.js', 'src/agents/syncAgent.js']
  for (let index = 0; index < sourcePaths.length; index += 1) values.set(index + 1, source.artifactHashes[sourcePaths[index]])
  values.set(8, source.frontendManifestHash)
  values.set(11, 'windows')
  values.set(17, owner.r0.version.slice(1))
  const expressionBound = source.evaluationHash === ADAPTER_EVALUATION_SHA256 && source.evaluationByteLength === 4259
  if (expressionBound) {
    for (const index of [41, 42, 43, 44, 45, 46, 47, 48, 49]) values.set(index, ADAPTER_REPLAY_DEFINITIONS[index - 1][2])
    if (sourcePaths.slice(0, 2).every(path => source.bindingMatches[path])) values.set(50, 'adr-0028-fixed')
  }
  const gateway = owner.childLedger.gateway
  if (gateway.handle !== null) {
    const environment = gateway.spawnProfile.environment
    const port = environment.find(entry => entry.name === 'GOLDENDAWN_SYNC_GATEWAY_PORT')?.value
    const origin = environment.find(entry => entry.name === 'GOLDENDAWN_SYNC_GATEWAY_ALLOWED_ORIGIN')?.value
    adapterAssert(typeof port === 'string' && /^[0-9]{4}$/.test(port))
    values.set(53, '"' + port + '"')
    values.set(54, origin)
    if (source.bindingMatches['server/localSyncGatewayRuntimeConfig.js']) {
      values.set(51, '127.0.0.1')
      values.set(52, Number(port))
      values.set(56, `http://127.0.0.1:${port}/api/sync-test`)
    }
    if (sourcePaths.slice(2).every(path => source.bindingMatches[path])) values.set(57, 'production-gateway')
  }
  if (sourcePaths.every(path => source.bindingMatches[path])) values.set(58, 'adr-0020-options204-post200-syncresponse-v1')
  if (source.viteRuntimeVersion === '8.1.4') values.set(59, '8.1.4')
  const replayOperands = ADAPTER_REPLAY_DEFINITIONS.map((definition, index) => {
    const value = values.get(index + 1)
    return { fieldId: definition[0], observationState: value === undefined ? 'not-observed' : 'observed',
      replayValue: value === undefined ? null : value }
  })
  return adapterFreezeData({ diagnosticRunId: owner.r0.diagnosticRunId, observedAt: owner.r0.observedAt,
    timeZone: owner.r0.timeZone, replayContextId: owner.r0.replayContextId, repositoryCommit: source.repositoryCommit,
    profileInstanceObservation: { newInstanceObserved: owner.resourceLedger.profile.handle !== null, historicalInstanceReuseObserved: false },
    unexplainedCausalDeviationObservation: { reviewCompleted: true, deviationObserved: source.violation === true },
    replayOperands, viteRuntimeVersionObservation: source.viteRuntimeVersion === '8.1.4' ? '8.1.4' : null })
}

function adapterObservationClosed(owner) {
  if (owner.runState !== 'active' || !owner.notificationEntryActive || owner.firstCleanupSequence !== null ||
    owner.notificationInvoking || owner.notificationCount !== 0 ||
    owner.trackerState !== 'OBSERVATION_NO_AOBS' || !owner.attemptStarted ||
    owner.foundationInstance === null || owner.sourceState?.factoryInstance !== owner.foundationInstance) {
    owner.notificationViolation = true
    owner.trackerState = 'TERMINAL_NO_RECORD'
    adapterViolation(owner, 'producer')
    return undefined
  }
  owner.notificationInvoking = true
  owner.notificationCount += 1
  try {
    owner.markerSequence = ++owner.lifecycleSequence
    const facts = adapterFreezeData(adapterBuildRecordLedger(owner, false))
    owner.adapterObservationSnapshot = freezeBrowserSyncTransportRuntimeDiagnosticRecordObservation(owner, facts)
    owner.trackerState = 'AOBS_BOUND'
    owner.phase = 'cleanup'
  } catch {
    owner.notificationViolation = true
    owner.trackerState = 'TERMINAL_NO_RECORD'
    owner.hardViolation = true
  } finally { owner.notificationInvoking = false }
  return undefined
}

// Terminal inventories preserve primitive observations while releasing the
// private capabilities, identifiers and immutable source storage they described.
function adapterCaptureTerminalOwnershipFacts(owner) {
  if (owner.terminalOwnershipFacts !== null) return owner.terminalOwnershipFacts
  const pipe = owner.pipeLedger
  const resources = []
  const origins = [pipe, owner.childLedger.chrome, owner.childLedger.vite,
    owner.childLedger.gateway, owner.resourceLedger.profile, owner.resourceLedger.temporaryRoot]
  const names = ['pipe', 'browser', 'vite', 'gateway', 'profile', 'harness']
  for (let index = 0; index < origins.length; index += 1) {
    const origin = origins[index]
    const bound = index === 0 ? origin.pair !== null : origin.handle !== null
    resources.push({ name: names[index], creationState: bound ? 'bound' : origin.creation,
      boundCount: bound ? 1 : 0,
      terminalCount: bound && (index === 0 ? origin.closed : index <= 3 && origin.rootState === 'terminal') ? 1 : 0,
      activeAfterCleanupCount: 0, foreignTouchCount: 0,
      failureCount: origin.closeFailed || origin.stopFailed ? 1 : 0 })
  }
  const caps = {}
  for (const kind of ['setup', 'capture', 'cleanup']) {
    const cap = owner.capLedger[kind]
    caps[kind] = { armCount: cap.generation === 0 ? 0 : 1, state: cap.state, deadline: cap.deadline,
      cancelCount: cap.cancelAttempted ? 1 : 0, cancelAckCount: cap.state === 'cancelled' ? 1 : 0 }
  }
  const children = Object.values(owner.childLedger).filter(child => child.handle !== null)
  const sourceResources = owner.sourceState?.openResources ?? []
  const closed = sourceResources.filter(entry => entry.closed === true).length
  owner.terminalOwnershipFacts = adapterFreezeData({
    resources, caps, consumedIntentCount: owner.nextIntentId - 1,
    capGenerationDistinctCount: new Set(Object.values(owner.capLedger).filter(cap => cap.generation !== 0).map(cap => cap.generation)).size,
    pipeOpenCount: pipe.pair === null ? 0 : 1,
    childStreamCount: children.length * 2,
    terminalChildStreamCount: children.filter(child => child.streamsTerminal === true).length * 2,
    captureState: owner.captureOrigin === null ? 'not-started' :
      owner.capLedger.capture.state === 'fired' ? 'elapsed' : 'truncated',
    sourceResourceCount: sourceResources.length,
    sourceResourceClosedCount: closed,
    sourceResourceUnknownCount: sourceResources.length - closed,
    profileResourceState: owner.resourceLedger.profile.handle === null ? 'unbound' :
      owner.resourceLedger.handles.get(owner.resourceLedger.profile.handle)?.state === 'closed' ? 'closed' : 'unknown',
    harnessResourceState: owner.resourceLedger.temporaryRoot.handle === null ? 'unbound' :
      owner.resourceLedger.handles.get(owner.resourceLedger.temporaryRoot.handle)?.state === 'closed' ? 'closed' : 'unknown',
  })
  return owner.terminalOwnershipFacts
}

function adapterDiscardTerminalOwnership(owner) {
  adapterCaptureTerminalOwnershipFacts(owner)
  // Invalidate the separate objects captured by raw sink closures as well as
  // the dispatcher lookup map. A late signal then stops before reflection.
  for (const pending of owner.pendingRawBindings) {
    pending.terminal = true
    pending.ready = false
    pending.handle = null
    pending.generation = 0
    pending.writeGeneration = 0
  }
  owner.pendingRawBindings = []
  for (const roles of owner.producerBindings.values()) for (const binding of roles.values()) {
    binding.active = false
    binding.handle = null
    binding.generation = 0
  }
  owner.producerBindings.clear()
  for (const operation of owner.resourceLedger.operations.values()) {
    if (operation.reject !== null) operation.reject(adapterError(ADAPTER_FAILURE))
    operation.resolve = null
    operation.reject = null
    operation.handle = null
    operation.operationId = null
    operation.input = null
    operation.targetResourceHandle = null
    operation.state = 'terminal'
  }
  owner.resourceLedger.operations.clear()
  owner.resourceLedger.handles.clear()
  if (owner.sourceState !== null) {
    owner.sourceState.activeResourceHandles.clear()
    for (const entry of owner.sourceState.openResources) entry.resourceHandle = null
    if (owner.sourceState.foundation !== null) owner.sourceState.foundation.resourceHandle = null
  }
  for (const resource of [owner.resourceLedger.profile, owner.resourceLedger.temporaryRoot]) {
    resource.path = null
    resource.handle = null
    resource.identity = null
    if (adapterDescriptor(resource, 'pendingResult') !== undefined) resource.pendingResult = null
  }
  for (const cap of Object.values(owner.capLedger)) {
    cap.handle = null
    cap.armIntentId = null
    cap.generation = 0
    cap.deadline = null
  }
  const pipe = owner.pipeLedger
  pipe.pair = null
  pipe.generation = 0
  pipe.activeWriteGeneration = 0
  pipe.terminalWriteGeneration = 0
  for (const child of Object.values(owner.childLedger)) {
    child.handle = null
    child.generation = 0
    child.spawnProfile = null
  }
  for (const operation of owner.wireLedger.operations) {
    operation.commandId = null
    operation.sessionId = null
    operation.params = null
  }
  owner.activeExchange = null
  owner.waitingDequeueResolver = null
  owner.outerCleanupWaiting = null
  owner.fifo = []
  owner.fifoMaterialBytes = 0
  pipe.accumulator = []
  owner.lastDequeuedMaterial = null
  owner.lastDequeuedSequence = null
  owner.captureOrigin = null
  owner.activeRunToken = null
  owner.nextGeneration = 0
  owner.nextResourceOperationId = 0
  owner.nextIntentId = 0
  owner.nextFifoSequence = 0
}

function adapterRetainedTerminalIdentifierCount(owner) {
  let count = owner.producerBindings.size + owner.pendingRawBindings.length +
    owner.resourceLedger.operations.size + owner.resourceLedger.handles.size
  if (owner.sourceState !== null) {
    count += owner.sourceState.activeResourceHandles.size
    for (const entry of owner.sourceState.openResources) if (entry.resourceHandle !== null) count += 1
    if (owner.sourceState.foundation?.resourceHandle !== null && owner.sourceState.foundation?.resourceHandle !== undefined) count += 1
  }
  for (const row of owner.wireLedger.operations) {
    if (row.commandId !== null) count += 1
    if (row.sessionId !== null) count += 1
    if (row.params !== null) count += 1
  }
  for (const cap of Object.values(owner.capLedger)) {
    if (cap.handle !== null) count += 1
    if (cap.armIntentId !== null) count += 1
    if (cap.generation !== 0) count += 1
  }
  for (const child of Object.values(owner.childLedger)) {
    if (child.handle !== null) count += 1
    if (child.generation !== 0) count += 1
  }
  for (const resource of [owner.resourceLedger.profile, owner.resourceLedger.temporaryRoot]) {
    if (resource.handle !== null) count += 1
    if (resource.path !== null) count += 1
    if (resource.identity !== null && resource.identity !== undefined) count += 1
  }
  const pipe = owner.pipeLedger
  if (pipe.pair !== null) count += 1
  for (const key of ['generation', 'activeWriteGeneration', 'terminalWriteGeneration']) if (pipe[key] !== 0) count += 1
  if (owner.activeRunToken !== null) count += 1
  if (owner.lastDequeuedSequence !== null) count += 1
  for (const key of ['nextGeneration', 'nextResourceOperationId', 'nextIntentId', 'nextFifoSequence']) if (owner[key] !== 0) count += 1
  return count
}

function adapterDiscardTerminalSources(owner) {
  const source = owner.sourceState
  if (source !== null) {
    const foundation = source.foundation
    const resources = source.openResources ?? []
    const closed = resources.filter(entry => entry.closed === true).length
    const summary = adapterFreezeData({
      profile: 'adr-0036-terminal-source-summary-v1',
      captureCompleted: source.captureCompleted === true,
      repositoryCommit: source.repositoryCommit ?? null,
      provenanceState: source.provenanceState ?? 'unproven',
      violation: source.violation === true,
      actualLoadedSha256: source.actualLoadedSha256 ?? null,
      foundationSha256: foundation?.sha256 ?? null,
      commitFoundationSha256: foundation?.entry.commitBlobMatches ? foundation.sha256 : null,
      loadCount: source.module === null ? 0 : 1,
      loadVerified: source.namespace !== null && source.factory !== null,
      instanceCreated: owner.foundationInstance !== null && source.factoryInstance === owner.foundationInstance,
      pathCheckCount: source.snapshots.length,
      pathRecheckCount: source.checkpoints.filter(check => check.state === 'verified').length,
      inventoryExpectedCount: source.git?.trackedPaths?.size ?? 0,
      inventoryCompletedCount: source.worktree.size,
      worktreeByteLength: source.worktreeByteLength ?? 0,
      sourceResourceCount: resources.length,
      sourceResourceClosedCount: closed,
      sourceResourceUnknownCount: resources.length - closed,
      foundationResourceState: foundation === null ? 'unbound' : foundation.entry.closed ? 'closed' : 'unknown',
      evaluationHash: source.evaluationHash ?? null,
      evaluationByteLength: source.evaluationByteLength ?? 0,
      frontendManifestHash: source.frontendManifestHash ?? null,
      frontendManifestByteLength: source.frontendManifestByteLength ?? 0,
      frontendManifestMatches: source.frontendManifestMatches === true,
      viteRuntimeVersion: source.viteRuntimeVersion ?? null,
      viteRuntimeVersionState: source.viteRuntimeVersionState ?? 'not-observed',
      checkpoints: source.checkpoints.map(check => ({ phase: check.phase, state: check.state })),
      foundation: null, module: null, namespace: null, factory: null, factoryInstance: null,
    })
    // Drop nested stores on the old object too: an already terminal continuation
    // cannot retain the former byte graph merely by having captured `state`.
    for (const key of adapterOwnKeys(source)) source[key] = null
    owner.sourceState = summary
  }
  owner.r0 = null
  owner.foundationInstance = null
  const binding = adr36RecordApply(adr36RecordWeakGet, adr36RecordOwners, [owner])
  if (binding !== undefined) {
    if (binding.ledger !== null) {
      const finalBinding = adr36RecordApply(adr36RecordWeakGet, adr36RecordFinalBindings, [binding.ledger])
      if (finalBinding !== undefined) {
        finalBinding.consumed = true
        finalBinding.owner = null
        finalBinding.foundationProjection = null
        finalBinding.observation = null
      }
    }
    binding.consumed = true
    binding.loadedFactory = null
    binding.observation = null
    binding.ledger = null
  }
}

function adapterBuildRecordLedger(owner, terminal) {
  const ledger = createBrowserSyncTransportRuntimeDiagnosticRecordLedgerTemplate()
  const source = owner.sourceState
  const ownership = terminal ? owner.terminalOwnershipFacts : null
  const s = ledger.sources
  s.capabilitySelectionCount = 1
  s.ownerCount = adapterOwners.has(owner) ? 1 : 0
  s.dispatcherCount = 1
  // The closed selector exposes exactly the declared capability set. An
  // ordinary capability error does not demonstrate an additional capability.
  s.extraCapabilityCount = 0
  if (source !== null) {
    s.foundationSha256 = source.foundation?.sha256 ?? null
    s.loadedFoundationSha256 = source.actualLoadedSha256 ?? null
    s.commitFoundationSha256 = source.foundation?.entry.commitBlobMatches ? source.foundation.sha256 : null
    s.loadCount = source.module === null ? 0 : 1
    s.loadKind = source.module === null ? 'none' : 'byte-owned-vm-source-text-module'
    s.pathCheckCount = source.snapshots.length
    s.pathRecheckCount = source.checkpoints.filter(check => check.state === 'verified').length
    s.mismatchCount = source.violation ? 1 : 0
    s.inventoryExpectedCount = source.git?.trackedPaths?.size ?? 0
    s.inventoryCompletedCount = source.worktree.size
  }
  s.runtimeActionCount = owner.wireLedger.operations[3].acceptedFrameCount
  for (let index = 0; index < ledger.wire.length; index += 1) {
    const row = owner.wireLedger.operations[index]
    for (const key of adapterOwnKeys(ledger.wire[index])) ledger.wire[index][key] =
      key === 'profileMatch' && row.intentCount === 0 ? true : row[key]
  }
  const p = ledger.parser
  const pipe = owner.pipeLedger
  p.frameCount = pipe.frameCount
  p.decodeCount = pipe.decodeCount
  p.scanCount = pipe.scanCount
  p.parseCount = pipe.parseCount
  p.parseFailureCount = pipe.violation ? 1 : 0
  p.queueEntries = owner.fifo.length
  p.queuedBytes = owner.fifoMaterialBytes
  p.dequeuedMaterialBytes = owner.lastDequeuedMaterial?.materialBytes ?? 0
  p.resolverCount = owner.waitingDequeueResolver === null ? 0 : 1
  p.pendingWriteCount = pipe.writePending ? 1 : 0
  for (const roles of owner.producerBindings.values()) for (const binding of roles.values()) {
    if (binding.active) p.liveCallbackCount += 1
  }
  p.retainedRawCount = pipe.accumulator.length > 0 ? 1 : 0
  if (owner.lastDequeuedMaterial !== null) p.retainedRawCount += 1
  p.retainedIdentifierCount = terminal ? adapterRetainedTerminalIdentifierCount(owner) :
    owner.wireLedger.operations.filter(row => row.commandId !== null || row.sessionId !== null).length
  p.violationCount = owner.hardViolation || pipe.violation || owner.producerViolation ? 1 : 0
  p.intakeState = pipe.intakeState === 'closed' || pipe.creation === 'never-attempted' ? 'closed' : 'open'
  p.pipeOpenCount = ownership === null ? (pipe.pair === null ? 0 : 1) : ownership.pipeOpenCount
  p.pipeReadOwnerCount = p.pipeOpenCount
  p.pipeWriteOwnerCount = p.pipeOpenCount
  if (p.pipeOpenCount !== 0) {
    p.inheritedReadDescriptor = 4
    p.inheritedWriteDescriptor = 3
  }
  const origins = [pipe, owner.childLedger.chrome, owner.childLedger.vite,
    owner.childLedger.gateway, owner.resourceLedger.profile, owner.resourceLedger.temporaryRoot]
  for (let index = 0; index < origins.length; index += 1) {
    const origin = origins[index]
    const row = ledger.resources[index]
    if (ownership !== null) {
      const historical = ownership.resources[index]
      for (const key of adapterOwnKeys(row)) row[key] = historical[key]
    } else {
      const bound = index === 0 ? origin.pair !== null : origin.handle !== null
      row.creationState = bound ? 'bound' : origin.creation
      row.boundCount = bound ? 1 : 0
      row.terminalCount = bound && (index === 0 ? origin.closed : index <= 3 && origin.rootState === 'terminal') ? 1 : 0
      row.failureCount = origin.closeFailed || origin.stopFailed ? 1 : 0
    }
  }
  const n = ledger.network
  n.acceptedEvaluationSha256 = owner.wireLedger.evaluationSha256
  n.acceptedEvaluationBytes = owner.wireLedger.evaluationByteLength
  n.captureState = ownership !== null ? ownership.captureState : owner.captureOrigin === null ? 'not-started' :
    owner.capLedger.capture.state === 'fired' ? 'elapsed' : 'truncated'
  // Correlation counts concern only the exact outgoing target/session binding;
  // the Foundation remains the sole source of inner target/value semantics.
  n.targetBindingCount = owner.wireLedger.operations[1].acceptedFrameCount
  n.sessionBindingCount = owner.wireLedger.operations[2].acceptedFrameCount
  const d = ledger.output
  d.writeCount = owner.writerCallCount
  const children = Object.values(owner.childLedger).filter(child => child.handle !== null)
  d.childStreamCount = ownership === null ? children.length * 2 : ownership.childStreamCount
  d.terminalChildStreamCount = ownership === null ? children.filter(child => child.streamsTerminal === true).length * 2 : ownership.terminalChildStreamCount
  d.inventoryExpectedCount = s.inventoryExpectedCount
  // A source inventory does not include the newly created profile and temp root.
  // It cannot stand in for a complete output/residue inventory.
  d.inventoryCompletedCount = owner.resourceLedger.temporaryRoot.creation === 'never-attempted' ? s.inventoryCompletedCount : 0
  if (source?.captureCompleted) {
    const manifest = [...source.worktree].map(([path, entry]) => `${path}\t${entry.bytes.length}\t${entry.sha256}\n`).join('')
    d.repositoryBaselineSha256 = adapterHash(new AdapterTextEncoder().encode(manifest))
    const final = source.checkpoints.find(check => check.phase === 'post-cleanup')
    if (final?.state === 'verified') d.repositoryFinalSha256 = d.repositoryBaselineSha256
    d.repositoryIdentityDifferenceCount = final?.state === 'violated' ? 1 : 0
    const historical = source.worktree.get('docs/evidence/browser-runtime-evidence.chrome-stable-windows-01.json')
    d.historicalBaselineSha256 = historical?.sha256 ?? null
    if (final?.state === 'verified') d.historicalFinalSha256 = d.historicalBaselineSha256
  }
  const c = ledger.completion
  const cap = owner.capLedger.cleanup
  c.markerCount = owner.notificationCount
  c.markerSequence = owner.markerSequence
  c.firstCleanupSequence = owner.firstCleanupSequence
  c.cleanupGeneration = ownership === null ? (cap.generation === 0 ? 0 : 1) : ownership.caps.cleanup.armCount
  c.violationCount = owner.notificationViolation || owner.cleanupViolation ? 1 : 0
  c.reason = owner.cleanupLedger.finalizeReason ?? 'cleanup-terminal-failure'
  c.capArmCount = ownership === null ? (cap.generation === 0 ? 0 : 1) : ownership.caps.cleanup.armCount
  c.capCancelCount = cap.cancelAttempted ? 1 : 0
  c.capCancelAckCount = cap.state === 'cancelled' ? 1 : 0
  const completion = owner.clockLedger.filter(row => row.reason === 'cleanup-completion-after-cap-cancel')
  c.completionClockCount = completion.length
  c.cleanupOrigin = owner.cleanupOrigin
  c.completionClock = completion[0]?.milliseconds ?? null
  c.terminalState = terminal && owner.cleanupLedger.terminal ? 'terminal' : 'pending'
  return ledger
}

async function adapterRunOwner(owner) {
  let output = null
  try {
    adapterReadR0(owner)
    await captureBrowserSyncTransportRuntimeDiagnosticSources(owner)
    const factory = await loadBrowserSyncTransportRuntimeDiagnosticFoundation(owner)
    await adapterCreateResourcesAndChildren(owner)
    await verifyBrowserSyncTransportRuntimeDiagnosticSources(owner, 'pre-o0')
    const runBinding = adapterBuildRunBinding(owner)
    const exchange = function exchange(intent) {
      if (arguments.length !== 1) {
        adapterViolation(owner, 'producer')
        return adapterOwnedExchangePromise((resolve, reject) => reject(adapterError(ADAPTER_EFFECT_FAILURE)))
      }
      return adapterExchange(owner, intent)
    }
    const observationClosed = function observationClosed() {
      if (arguments.length !== 0) {
        owner.notificationViolation = true
        owner.trackerState = 'TERMINAL_NO_RECORD'
        adapterViolation(owner, 'producer')
        return undefined
      }
      if (owner.notificationEntryActive) {
        owner.notificationViolation = true
        owner.trackerState = 'TERMINAL_NO_RECORD'
        adapterViolation(owner, 'producer')
        return undefined
      }
      owner.notificationEntryActive = true
      try {
      return adapterObservationClosed(owner)
      } finally { owner.notificationEntryActive = false }
    }
    const effectPort = adapterFreeze({ exchange, observationClosed })
    const instance = adapterApply(factory, undefined, [adapterFreeze({ effectPort, runBinding })])
    const [run] = adapterRecord(instance, ['run'], true)
    adapterAssert(typeof run === 'function' && adapterDescriptor(run, 'length')?.value === 0)
    owner.foundationInstance = instance
    owner.sourceState.factoryInstance = instance
    registerBrowserSyncTransportRuntimeDiagnosticRecordOwner(owner, factory)
    const promise = adapterApply(run, undefined, [])
    adapterAssert(adapterPrototype(promise) === adapterPromisePrototype)
    let result
    try {
      result = await promise
      owner.foundationSettlementObserved = true
    } catch {
      owner.foundationSettlementObserved = true
      adapterFail()
    }
    owner.foundationSettled = true
    owner.foundationProjection = validateBrowserSyncTransportRuntimeDiagnosticFoundationResult(result)
    if (owner.adapterObservationSnapshot === null || owner.notificationViolation) adapterFail()
  } catch {
    owner.capabilityError = true
    owner.foundationSettled = true
    if (owner.sourceState?.violation) owner.hardViolation = true
  }
  if (owner.foundationSettlementObserved && owner.sourceState?.captureCompleted) {
    adapterPrepareCleanupCap(owner)
    try { await verifyBrowserSyncTransportRuntimeDiagnosticSources(owner, 'post-settlement') }
    catch { if (owner.sourceState.violation) owner.hardViolation = true }
  }
  try {
    if (owner.r0 === null) {
      owner.cleanupLedger.terminal = true
      owner.cleanupLedger.finalizeReason = 'all-steps-terminal'
    } else await adapterOuterCleanup(owner)
  }
  catch { owner.cleanupViolation = true; owner.cleanupLedger.terminal = true }
  if (owner.terminalOwnershipFacts === null) adapterDiscardTerminalOwnership(owner)
  try {
    if (owner.foundationProjection !== null && owner.adapterObservationSnapshot !== null && !owner.notificationViolation) {
      const ledger = adapterFreezeData(adapterBuildRecordLedger(owner, true))
      bindBrowserSyncTransportRuntimeDiagnosticRecordLedger(owner, ledger)
      owner.finalizationCount += 1
      const result = finalizeBrowserSyncTransportRuntimeDiagnosticRecord(adapterFreeze({
        foundationProjection: owner.foundationProjection, adapterLedger: ledger,
      }))
      owner.terminalOutcome = { observerGate: result.observerGate, finding: result.finding, evidenceStatus: result.evidenceStatus }
      output = result.runtimeRecord
      owner.trackerState = output === null ? 'TERMINAL_NO_RECORD' : 'TERMINAL_ELIGIBLE'
    } else owner.trackerState = 'TERMINAL_NO_RECORD'
  } catch {
    owner.trackerState = 'TERMINAL_NO_RECORD'
  } finally {
    owner.ownerFinalizationCount += 1
    owner.activeRunToken = null
    owner.runState = 'terminal'
    owner.dispatcherState = 'terminal'
    owner.runtimeCapabilities = null
    for (const operation of owner.wireLedger.operations) {
      operation.commandId = null
      operation.sessionId = null
      operation.params = null
    }
    owner.captureOrigin = null
    adapterDiscardTerminalSources(owner)
  }
  if (output === null) adapterFail()
  return output
}

import * as g36NodeFs from 'node:fs'
import * as g36NodeCrypto from 'node:crypto'
import * as g36NodeChildProcess from 'node:child_process'
import * as g36NodePath from 'node:path'
import g36NodeProcess from 'node:process'

const g36NodeEnvironmentNames = Object.freeze([
  'NODE_OPTIONS', 'SystemRoot', 'WINDIR', 'ComSpec', 'PATHEXT', 'Path',
  'TEMP', 'TMP', 'LOCALAPPDATA', 'ProgramFiles', 'ProgramFiles(x86)', 'ProgramW6432',
])

function g36NodeCapabilityFailure() {
  throw new Error('browserSyncTransportRuntimeDiagnosticAdapterCapabilityFailed')
}

function g36NodeExactRecord(value, names) {
  if (value === null || typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype) return false
  const keys = Reflect.ownKeys(value)
  return keys.length === names.length && names.every((name, index) => {
    const descriptor = Object.getOwnPropertyDescriptor(value, name)
    return keys[index] === name && descriptor && Object.hasOwn(descriptor, 'value') && descriptor.enumerable
  })
}

function g36NodeByteView(value, maximum) {
  if (value === null || typeof value !== 'object' || Object.getPrototypeOf(value) !== Uint8Array.prototype) return false
  try {
    if (Object.getPrototypeOf(value.buffer) !== ArrayBuffer.prototype || value.buffer.resizable || value.byteOffset !== 0 ||
      value.byteLength !== value.buffer.byteLength || value.byteLength > maximum || Reflect.ownKeys(value).length !== value.byteLength) return false
    new Uint8Array(value.buffer, 0, 0)
    return true
  } catch { return false }
}

function g36NodeOwnArray(value, maximum) {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype || value.length > maximum) return false
  const keys = Reflect.ownKeys(value)
  return keys.length === value.length + 1 && keys[value.length] === 'length' && Array.from({ length: value.length }, (_, index) => {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index))
    return keys[index] === String(index) && descriptor && Object.hasOwn(descriptor, 'value') && descriptor.enumerable
  }).every(Boolean)
}

function g36NodePathValue(value) {
  return typeof value === 'string' && value.length <= 32767 && !value.includes('\0')
}

function g36NodePathIdentity(stat) {
  const number = (value) => typeof value === 'bigint' && value >= 0n && /^(0|[1-9][0-9]{0,63})$/.test(String(value)) ? String(value) : null
  if (stat.size < 0n || stat.size > BigInt(Number.MAX_SAFE_INTEGER)) g36NodeCapabilityFailure()
  return Object.freeze({
    pathType: stat.isFile() ? 'regular-file' : stat.isDirectory() ? 'directory' : 'other',
    volumeId: number(stat.dev), fileId: number(stat.ino), byteLength: Number(stat.size),
    modifiedTimeNanoseconds: number(stat.mtimeNs), changeTimeNanoseconds: number(stat.ctimeNs),
    reparsePoint: stat.isSymbolicLink(),
  })
}

function createBrowserSyncTransportRuntimeDiagnosticNodeCapabilities() {
  if (arguments.length !== 0) g36NodeCapabilityFailure()
  // Creating this graph allocates only local bookkeeping; no host source is read.
  const timers = new WeakMap()
  const children = new WeakMap()
  const pipes = new WeakMap()
  const resources = new WeakMap()
  const operations = new WeakMap()
  let nextOperationId = 0
  let chromeHandle = null
  let pipeOpened = false
  const spawnedRoles = new Set()
  const check = (condition) => { if (!condition) g36NodeCapabilityFailure() }
  const opaque = () => Object.create(null)
  const sinkProfile = (sink) => typeof sink === 'function' && sink.length === 1
  const bytesFrom = (value) => new Uint8Array(value)
  const signal = (sink, value) => { Reflect.apply(sink, undefined, [Object.freeze(value)]) }
  const boundedChunkSignal = (producerSink, kind, chunk) => {
    if (!Number.isSafeInteger(chunk.byteLength) || chunk.byteLength < 0 || chunk.byteLength > 65536) {
      signal(producerSink, { kind: kind === 'read-chunk' ? 'read-error' : 'error' })
      return
    }
    signal(producerSink, { kind, bytes: bytesFrom(chunk) })
  }
  const frozenContainers = (value, depth = 0) => {
    if (depth > 64) return false
    if (value === null || typeof value !== 'object') return typeof value !== 'function' && typeof value !== 'symbol'
    if (timers.has(value) || children.has(value) || pipes.has(value) || resources.has(value) || operations.has(value)) return true
    if (g36NodeByteView(value, 1048576)) return true
    if (!Object.isFrozen(value)) return false
    if (Array.isArray(value)) return g36NodeOwnArray(value, 4096) && value.every((entry) => frozenContainers(entry, depth + 1))
    if (Object.getPrototypeOf(value) !== Object.prototype) return false
    const keys = Reflect.ownKeys(value)
    return keys.length <= 4096 && keys.every((key) => {
      if (typeof key !== 'string') return false
      const descriptor = Object.getOwnPropertyDescriptor(value, key)
      return descriptor && Object.hasOwn(descriptor, 'value') && descriptor.enumerable && frozenContainers(descriptor.value, depth + 1)
    })
  }
  const entropy = Object.freeze({
    readDiagnosticRunIdEntropyBytes: function () {
      check(arguments.length === 0 && this === undefined)
      return bytesFrom(g36NodeCrypto.randomBytes(17))
    },
    readReplayContextIdEntropyBytes: function () {
      check(arguments.length === 0 && this === undefined)
      return bytesFrom(g36NodeCrypto.randomBytes(15))
    },
  })
  const clock = Object.freeze({
    readControllerNanoseconds: function () {
      check(arguments.length === 0 && this === undefined)
      return g36NodeProcess.hrtime.bigint()
    },
    readWallMilliseconds: function () {
      check(arguments.length === 0 && this === undefined)
      return Date.now()
    },
    readTimeZone: function () {
      check(arguments.length === 0 && this === undefined)
      const options = new Intl.DateTimeFormat().resolvedOptions()
      const descriptor = Object.getOwnPropertyDescriptor(options, 'timeZone')
      check(descriptor && Object.hasOwn(descriptor, 'value') && typeof descriptor.value === 'string')
      return descriptor.value
    },
  })
  const runtime = Object.freeze({
    readProcessPlatform: function () { check(arguments.length === 0 && this === undefined); return g36NodeProcess.platform },
    readProcessArchitecture: function () { check(arguments.length === 0 && this === undefined); return g36NodeProcess.arch },
    readProcessVersion: function () { check(arguments.length === 0 && this === undefined); return g36NodeProcess.version },
    readProcessExecutablePath: function () { check(arguments.length === 0 && this === undefined); return g36NodeProcess.execPath },
    readProcessExecArguments: function () {
      check(arguments.length === 0 && this === undefined)
      return Array.from(g36NodeProcess.execArgv)
    },
    readProcessEnvironmentMatches: function (name) {
      check(arguments.length === 1 && this === undefined && g36NodeEnvironmentNames.includes(name))
      const environment = g36NodeProcess.env
      const names = Object.getOwnPropertyNames(environment)
      check(names.length <= 256)
      const matches = []
      for (const key of names) {
        check(typeof key === 'string' && key.length <= 256 && !key.includes('\0'))
        if (key.toLowerCase() !== name.toLowerCase()) continue
        const descriptor = Object.getOwnPropertyDescriptor(environment, key)
        check(descriptor && Object.hasOwn(descriptor, 'value') && typeof descriptor.value === 'string' && descriptor.value.length <= 32767)
        matches.push({ name: key, value: descriptor.value })
        check(matches.length <= 16)
      }
      return matches
    },
    readWorkingDirectory: function () { check(arguments.length === 0 && this === undefined); return g36NodeProcess.cwd() },
  })
  const scheduler = Object.freeze({
    armTimer: function (callback, milliseconds) {
      check(arguments.length === 2 && this === undefined && typeof callback === 'function' && callback.length === 0 &&
        Number.isSafeInteger(milliseconds) && milliseconds >= 0 && milliseconds <= 60000)
      const handle = opaque()
      const entry = { active: true, native: null, cancelled: false }
      entry.native = setTimeout(() => {
        if (!entry.active) return
        entry.active = false
        Reflect.apply(callback, undefined, [])
      }, milliseconds)
      timers.set(handle, entry)
      return handle
    },
    cancelTimer: function (handle) {
      const entry = timers.get(handle)
      check(arguments.length === 1 && this === undefined && entry && entry.active && !entry.cancelled)
      entry.cancelled = true
      entry.active = false
      clearTimeout(entry.native)
      entry.native = null
      return undefined
    },
  })
  const pipe = Object.freeze({
    openDebugPipe: function (childHandle, producerSink) {
      check(arguments.length === 2 && this === undefined && childHandle === chromeHandle && !pipeOpened && sinkProfile(producerSink))
      const child = children.get(childHandle)
      check(child && child.active && child.native.stdio[3] && child.native.stdio[4])
      const handle = opaque()
      const entry = { active: true, reader: child.native.stdio[4], writer: child.native.stdio[3], loan: null }
      entry.reader.on('data', (chunk) => { if (entry.active) boundedChunkSignal(producerSink, 'read-chunk', chunk) })
      entry.reader.once('end', () => { if (entry.active) signal(producerSink, { kind: 'read-eof' }) })
      entry.reader.once('error', () => { if (entry.active) signal(producerSink, { kind: 'read-error' }) })
      entry.writer.on('drain', () => { if (entry.active) signal(producerSink, { kind: 'drain' }) })
      entry.writer.once('error', () => { if (entry.active) signal(producerSink, { kind: 'write-error' }) })
      pipes.set(handle, entry)
      pipeOpened = true
      return handle
    },
    writeDebugPipe: function (handle, bytes, completionSink) {
      const entry = pipes.get(handle)
      check(arguments.length === 3 && this === undefined && entry && entry.active && entry.loan === null &&
        g36NodeByteView(bytes, 65536) && sinkProfile(completionSink))
      const loan = { bytes, completed: false }
      entry.loan = loan
      let accepting = true
      let earlyCompletion = false
      const accepted = entry.writer.write(bytes, (error) => {
        if (accepting) { earlyCompletion = true; return }
        if (!entry.active || loan.completed) return
        loan.completed = true
        loan.bytes = null
        entry.loan = null
        signal(completionSink, { state: error ? 'failed' : 'completed' })
      })
      accepting = false
      check(!earlyCompletion)
      return { acceptedByteLength: bytes.byteLength, backpressure: !accepted }
    },
    closeDebugPipe: function (handle) {
      const entry = pipes.get(handle)
      check(arguments.length === 1 && this === undefined && entry && entry.active)
      entry.active = false
      if (entry.loan) { entry.loan.bytes = null; entry.loan.completed = true; entry.loan = null }
      entry.reader.destroy()
      entry.writer.destroy()
      return undefined
    },
  })
  const launcher = Object.freeze({
    spawnChild: function (profile, producerSink) {
      check(arguments.length === 2 && this === undefined && sinkProfile(producerSink) &&
        g36NodeExactRecord(profile, ['role', 'executablePath', 'entryPath', 'arguments', 'workingDirectory', 'environment', 'stdioProfile', 'windowsHide', 'shell', 'detached']) &&
        frozenContainers(profile) && ['vite', 'gateway', 'chrome'].includes(profile.role) && profile.shell === false && profile.detached === false &&
        g36NodePathValue(profile.executablePath) && g36NodePathValue(profile.workingDirectory) && g36NodeOwnArray(profile.arguments, 16) &&
        g36NodeOwnArray(profile.environment, 16))
      const isChrome = profile.role === 'chrome'
      check(profile.windowsHide === !isChrome && profile.stdioProfile === (isChrome ? 'chrome-debug-pipe-v1' : 'node-readiness-v1'))
      check(isChrome ? profile.entryPath === null && profile.executablePath === 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : g36NodePathValue(profile.entryPath))
      check(!isChrome || chromeHandle === null)
      check(!spawnedRoles.has(profile.role))
      const environment = Object.create(null)
      let byteLength = 0
      for (const argument of profile.arguments) {
        check(typeof argument === 'string' && !argument.includes('\0'))
        byteLength += Buffer.byteLength(argument, 'utf8')
      }
      for (const match of profile.environment) {
        check(g36NodeExactRecord(match, ['name', 'value']) && typeof match.name === 'string' && typeof match.value === 'string' &&
          !match.name.includes('\0') && !match.value.includes('\0') && !Object.hasOwn(environment, match.name))
        check(g36NodeEnvironmentNames.slice(1).includes(match.name) ||
          profile.role === 'vite' && match.name === 'NO_COLOR' && match.value === '1' ||
          profile.role === 'gateway' && match.name === 'GOLDENDAWN_SYNC_GATEWAY_PORT' && match.value === '8787' ||
          profile.role === 'gateway' && match.name === 'GOLDENDAWN_SYNC_GATEWAY_ALLOWED_ORIGIN' && match.value === 'http://127.0.0.1:5173')
        byteLength += Buffer.byteLength(match.name, 'utf8') + Buffer.byteLength(match.value, 'utf8')
        environment[match.name] = match.value
      }
      check(byteLength <= 65536)
      if (profile.role === 'vite') check(profile.entryPath === g36NodePath.join(profile.workingDirectory, 'node_modules', 'vite', 'bin', 'vite.js') &&
        JSON.stringify(profile.arguments) === JSON.stringify(['--host', '127.0.0.1', '--port', '5173', '--strictPort']) && environment.NO_COLOR === '1')
      if (profile.role === 'gateway') check(profile.entryPath === g36NodePath.join(profile.workingDirectory, 'server', 'startLocalSyncGateway.js') && profile.arguments.length === 0 &&
        environment.GOLDENDAWN_SYNC_GATEWAY_PORT === '8787' && environment.GOLDENDAWN_SYNC_GATEWAY_ALLOWED_ORIGIN === 'http://127.0.0.1:5173')
      if (isChrome) check(profile.arguments.length === 7 && profile.arguments[0] === '--remote-debugging-pipe' &&
        profile.arguments[1].startsWith('--user-data-dir=') && profile.arguments[1].length > 16 &&
        JSON.stringify(profile.arguments.slice(2)) === JSON.stringify(['--incognito', '--no-first-run', '--no-default-browser-check', '--new-window', 'http://127.0.0.1:5173/']))
      const handle = opaque()
      const entry = { active: true, native: null, terminated: false }
      entry.native = g36NodeChildProcess.spawn(profile.executablePath, isChrome ? [...profile.arguments] : [profile.entryPath, ...profile.arguments], {
        cwd: profile.workingDirectory, env: environment, stdio: isChrome ? ['ignore', 'pipe', 'pipe', 'pipe', 'pipe'] : ['ignore', 'pipe', 'pipe'],
        windowsHide: profile.windowsHide, shell: false, detached: false,
      })
      for (const kind of ['stdout', 'stderr']) entry.native[kind].on('data', (chunk) => { if (entry.active) boundedChunkSignal(producerSink, kind, chunk) })
      entry.native.once('exit', (code, nativeSignal) => { if (entry.active) signal(producerSink, { kind: 'exit', code, signal: nativeSignal }) })
      entry.native.once('close', (code, nativeSignal) => {
        if (!entry.active) return
        entry.active = false
        signal(producerSink, { kind: 'close', code, signal: nativeSignal })
      })
      entry.native.once('error', () => { if (entry.active) signal(producerSink, { kind: 'error' }) })
      children.set(handle, entry)
      spawnedRoles.add(profile.role)
      if (isChrome) chromeHandle = handle
      return handle
    },
    terminateChild: function (handle) {
      const entry = children.get(handle)
      check(arguments.length === 1 && this === undefined && entry && entry.active && !entry.terminated)
      entry.terminated = true
      entry.native.kill()
      return undefined
    },
    closeChild: function (handle) {
      const entry = children.get(handle)
      check(arguments.length === 1 && this === undefined && entry && entry.active)
      entry.active = false
      entry.native.stdout.destroy()
      entry.native.stderr.destroy()
      return undefined
    },
  })
  const resourcesCapability = Object.freeze({
    performResourceOperation: function (operation, producerSink) {
      check(arguments.length === 2 && this === undefined && sinkProfile(producerSink) &&
        g36NodeExactRecord(operation, ['operationId', 'kind', 'input']) && Object.isFrozen(operation) &&
        operation.operationId === nextOperationId + 1 && Number.isSafeInteger(operation.operationId))
      const inputKeys = {
        'canonicalize-path': ['path'], 'inspect-path': ['path'], 'open-resource': ['path', 'expectedType'],
        'inspect-open-resource': ['resourceHandle'], 'read-resource': ['resourceHandle', 'offset', 'maximumByteLength'],
        'list-directory': ['resourceHandle', 'maximumEntries'], 'create-temporary-root': ['parentPath', 'prefix'],
        'create-directory-exclusive': ['parentHandle', 'name'], 'create-file-exclusive': ['parentHandle', 'name', 'bytes'],
        'passive-tcp-listeners': ['endpoints'],
      }
      check(Object.hasOwn(inputKeys, operation.kind) && g36NodeExactRecord(operation.input, inputKeys[operation.kind]) && frozenContainers(operation.input))
      const input = operation.input
      if (Object.hasOwn(input, 'path')) check(g36NodePathValue(input.path))
      if (Object.hasOwn(input, 'parentPath')) check(g36NodePathValue(input.parentPath))
      if (Object.hasOwn(input, 'resourceHandle')) check(resources.get(input.resourceHandle)?.active)
      if (Object.hasOwn(input, 'parentHandle')) check(resources.get(input.parentHandle)?.active)
      if (Object.hasOwn(input, 'expectedType')) check(['regular-file', 'directory'].includes(input.expectedType))
      if (Object.hasOwn(input, 'name')) check(typeof input.name === 'string' && !['.', '..'].includes(input.name) &&
        !/[\0/\\]/.test(input.name) && Buffer.byteLength(input.name, 'utf8') >= 1 && Buffer.byteLength(input.name, 'utf8') <= 1024)
      if (Object.hasOwn(input, 'prefix')) check(typeof input.prefix === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(input.prefix))
      if (Object.hasOwn(input, 'offset')) check(Number.isSafeInteger(input.offset) && input.offset >= 0)
      if (Object.hasOwn(input, 'maximumByteLength')) check(Number.isSafeInteger(input.maximumByteLength) && input.maximumByteLength >= 0 && input.maximumByteLength <= 1048576)
      if (Object.hasOwn(input, 'maximumEntries')) check(Number.isSafeInteger(input.maximumEntries) && input.maximumEntries >= 0 && input.maximumEntries <= 4096)
      if (Object.hasOwn(input, 'bytes')) check(g36NodeByteView(input.bytes, 1048576))
      if (operation.kind === 'passive-tcp-listeners') check(Array.isArray(input.endpoints) && input.endpoints.length === 2 &&
        input.endpoints.every((endpoint, index) => g36NodeExactRecord(endpoint, ['address', 'port']) && endpoint.address === '127.0.0.1' && endpoint.port === [5173, 8787][index]))
      const token = opaque()
      const pending = { active: true }
      operations.set(token, pending)
      nextOperationId = operation.operationId
      queueMicrotask(async () => {
        let result
        try {
          if (operation.kind === 'canonicalize-path') result = { kind: 'canonical-path', path: await g36NodeFs.promises.realpath(input.path) }
          if (operation.kind === 'inspect-path') result = { kind: 'path-identity', ...g36NodePathIdentity(await g36NodeFs.promises.lstat(input.path, { bigint: true })) }
          if (operation.kind === 'open-resource') {
            const native = await g36NodeFs.promises.open(input.path, g36NodeFs.constants.O_RDONLY | (g36NodeFs.constants.O_NOFOLLOW ?? 0))
            const handle = opaque()
            resources.set(handle, { native, path: input.path, active: true })
            result = { kind: 'resource-opened', resourceHandle: handle }
          }
          if (operation.kind === 'inspect-open-resource') result = { kind: 'open-resource-identity', ...g36NodePathIdentity(await resources.get(input.resourceHandle).native.stat({ bigint: true })) }
          if (operation.kind === 'read-resource') {
            const bytes = new Uint8Array(input.maximumByteLength)
            const read = await resources.get(input.resourceHandle).native.read(bytes, 0, bytes.length, input.offset)
            const stat = await resources.get(input.resourceHandle).native.stat({ bigint: true })
            result = { kind: 'resource-bytes', bytes: bytes.slice(0, read.bytesRead), endOfFile: BigInt(input.offset + read.bytesRead) >= stat.size }
          }
          if (operation.kind === 'list-directory') {
            const directory = await g36NodeFs.promises.opendir(resources.get(input.resourceHandle).path)
            const entries = []
            try {
              for await (const entry of directory) {
                check(entries.length < input.maximumEntries)
                entries.push(Object.freeze({ name: entry.name, pathType: entry.isFile() ? 'regular-file' : entry.isDirectory() ? 'directory' : 'other', reparsePoint: entry.isSymbolicLink() }))
              }
            } finally { try { await directory.close() } catch {} }
            result = { kind: 'directory-entries', entries: Object.freeze(entries) }
          }
          if (['create-temporary-root', 'create-directory-exclusive', 'create-file-exclusive'].includes(operation.kind)) {
            let path
            let native
            if (operation.kind === 'create-temporary-root') path = await g36NodeFs.promises.mkdtemp(g36NodePath.join(input.parentPath, input.prefix))
            else {
              path = g36NodePath.join(resources.get(input.parentHandle).path, input.name)
              if (operation.kind === 'create-directory-exclusive') await g36NodeFs.promises.mkdir(path)
              else { native = await g36NodeFs.promises.open(path, 'wx+'); await native.writeFile(input.bytes) }
            }
            if (!native) native = await g36NodeFs.promises.open(path, 'r')
            const handle = opaque()
            resources.set(handle, { native, path, active: true })
            result = { kind: 'resource-created', path, resourceHandle: handle, pathIdentity: g36NodePathIdentity(await native.stat({ bigint: true })) }
          }
          if (operation.kind === 'passive-tcp-listeners') result = { kind: 'passive-tcp-listeners', endpoints: Object.freeze(input.endpoints.map(({ address, port }) => Object.freeze({ address, port, state: 'unavailable' }))) }
          check(result)
          if (pending.active) { pending.active = false; signal(producerSink, { operationId: operation.operationId, state: 'completed', result: Object.freeze(result) }) }
        } catch {
          if (pending.active) { pending.active = false; signal(producerSink, { operationId: operation.operationId, state: 'failed', result: null }) }
        }
      })
      return token
    },
    closeResource: function (handle, producerSink) {
      const resource = resources.get(handle)
      check(arguments.length === 2 && this === undefined && sinkProfile(producerSink) && resource && resource.active)
      const operationId = ++nextOperationId
      check(Number.isSafeInteger(operationId))
      const token = opaque()
      operations.set(token, { active: true })
      resource.active = false
      queueMicrotask(async () => {
        try {
          await resource.native.close()
          signal(producerSink, { operationId, state: 'completed', result: Object.freeze({ kind: 'resource-closed' }) })
        } catch { signal(producerSink, { operationId, state: 'failed', result: null }) }
      })
      return token
    },
  })
  return Object.freeze({ profile: 'adr-0036-runtime-capabilities-v1', entropy, clock, runtime, scheduler, pipe, launcher, resources: resourcesCapability })
}

// ADR-0036 private source/loader fragment. All external reads use the owner resource boundary.
import { createHash as sourceCreateHash } from 'node:crypto'
import { inflateSync as sourceInflateSync } from 'node:zlib'
import * as sourceVm from 'node:vm'
import { win32 as sourcePath } from 'node:path'
import { pathToFileURL as sourceFileUrl } from 'node:url'

const sourceLimits = Object.freeze({ chunk:1048576, blob:1048576, index:16777216, pack:536870912, objects:4096, expanded:67108864, delta:32, paths:4096, path:1024, file:16777216, worktree:268435456 })
const sourceFoundationPath = 'scripts/browser/browserSyncTransportRuntimeDiagnosticObserver.js'
const sourceFoundationHash = 'd4cadf656bb50e2b062c9d0d66e3f895bc87649362ce995abfbdbe24a9f4e731'
const sourceEvidencePath = 'docs/evidence/browser-runtime-evidence.chrome-stable-windows-01.json'
const sourceBindings = Object.freeze({
  'src/transports/browserSyncTransport.js':'3c41b17e1d80e94e4b05e7c76f019d3fd3af281b451e85c8f90d80fd25391c28',
  'src/contracts/syncContract.js':'96ad2c52fb4545d6e587d9b3fd86d76a4a735e8cb33e9b572a3d7d5f4e5a6aeb',
  'server/startLocalSyncGateway.js':'677be5e9cace926ba0a1f3540e39926f5b5c54dd57440bd1ac53de6f255ca6d5',
  'server/localSyncGatewayRuntimeConfig.js':'e9a4419666e33b57d1ed5712e00f3d954a5b82c1cc7956b9a7582e0462743836',
  'server/localSyncGatewayHttpServer.js':'70243e66f85448c23920ea30409a03be7ed349b6868535729f4a798f012fdbb8',
  'src/gateways/syncGatewayRequestBoundary.js':'b1e55f03283bfdd1d35562951503471b4a812ac61868af0b927a05623e597b79',
  'src/agents/syncAgent.js':'899e06d3a80925cab8680749d133e9a8d87f30a2fd1d509cf7339eb1c8d65db0',
  [sourceFoundationPath]:sourceFoundationHash,
  'tests/browserSyncTransportRuntimeDiagnosticObserver.test.js':'4cf2698fa2af48750a71a5effbc23e059ef51133e0646c3e0333bb93d633cb64',
  'docs/decisions/0032-browser-sync-transport-diagnostic-determinism-boundary.md':'0f7264b6d1b0d796d92bc8d5cbef243f374b0c923d9d924337e0f6af01333515',
  'docs/decisions/0033-browser-sync-transport-diagnostic-foundation-effects-protocol-boundary.md':'ebbcb6e30a139e71a4dbb7aea2dbdd16158d745983ae3ebaff81f4c98a383dc3',
  'docs/decisions/0034-browser-sync-transport-diagnostic-foundation-grammar-derivation-and-testability-boundary.md':'4d0816046a83982ed49bbc8505d504166fe4f1f38eaa26f97fe5861f4f4e6f9f',
  'docs/decisions/0035-browser-sync-transport-diagnostic-foundation-join-and-internal-transition-testability-boundary.md':'ab433eafee9c78b2196e664deebf25edd390ca01e44cdb811bb99130b476b197',
  'docs/decisions/0037-browser-sync-transport-diagnostic-foundation-observation-close-notification.md':'0b15c4cfbf864740e3acc0aa8a3d5c9d3d93ad833112b5a936c4592eabfcd680',
  [sourceEvidencePath]:'ffad6b1de2e0c32ec5c2cdc3e88bfd455b14adc2eb4dd45f0d81e911e1a64b33'
})
const sourceDecodeUtf8 = new TextDecoder('utf-8', { fatal:true, ignoreBOM:true })
const sourceEncodeUtf8 = new TextEncoder()
const sourceIdentityKeys = Object.freeze(['pathType','volumeId','fileId','byteLength','modifiedTimeNanoseconds','changeTimeNanoseconds','reparsePoint'])
const sourceUnavailableFailures = new WeakSet()
const sourceImportDenials = new WeakSet()
function sourceRejectFoundationImport() {
  const error = adapterError(ADAPTER_FAILURE)
  sourceImportDenials.add(error)
  throw error
}
function sourceStop(owner, violation = false) {
  if (owner.sourceState) {
    if (violation) owner.sourceState.violation = true
    owner.sourceState.provenanceState = owner.sourceState.violation ? 'violated' : 'unproven'
  }
  const error = new TypeError('browserSyncTransportRuntimeDiagnosticAdapterFailed')
  if (!owner.sourceState?.violation && !violation) sourceUnavailableFailures.add(error)
  throw error
}
function sourceRequire(owner, condition, violation = false) { if (!condition) sourceStop(owner, violation) }
function sourceHash(bytes, algorithm = 'sha256') { return sourceCreateHash(algorithm).update(bytes).digest('hex') }
function sourceBytesEqual(left, right) {
  if (left.length !== right.length) return false
  for (let index = 0; index < left.length; index += 1) if (left[index] !== right[index]) return false
  return true
}
function sourceAscii(owner, bytes) {
  for (let index = 0; index < bytes.length; index += 1) sourceRequire(owner, bytes[index] <= 127)
  return sourceDecodeUtf8.decode(bytes)
}
function sourceText(owner, bytes) { try { return sourceDecodeUtf8.decode(bytes) } catch { return sourceStop(owner) } }
function sourceU32(owner, bytes, offset) {
  sourceRequire(owner, offset >= 0 && offset + 4 <= bytes.length)
  return bytes[offset] * 16777216 + bytes[offset + 1] * 65536 + bytes[offset + 2] * 256 + bytes[offset + 3]
}
function sourceHex(bytes) { let text = ''; for (const byte of bytes) text += byte.toString(16).padStart(2,'0'); return text }
function sourceValidOid(value) { return typeof value === 'string' && /^[0-9a-f]{40}$/.test(value) }
function sourceSafeRelative(owner, literal) {
  sourceRequire(owner, typeof literal === 'string' && literal.length > 0 && sourceEncodeUtf8.encode(literal).length <= sourceLimits.path && !/[\u0000-\u001f\u007f\\:]/.test(literal))
  for (const part of literal.split('/')) sourceRequire(owner, part !== '' && part !== '.' && part !== '..' && !/[. ]$/.test(part) && !/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part))
  return literal
}
function sourceJoin(owner, root, literal) {
  sourceSafeRelative(owner, literal)
  const path = sourcePath.join(root, ...literal.split('/'))
  sourceRequire(owner, path.startsWith(root.endsWith('\\') ? root : root + '\\'))
  return path
}
async function sourceOperation(owner, kind, input) {
  try { return await performBrowserSyncTransportRuntimeDiagnosticResourceOperation(owner, kind, input) }
  catch { return sourceStop(owner) }
}
function sourceIdentity(owner, value, expectedType) {
  sourceRequire(owner, value && value.pathType === expectedType && value.reparsePoint === false && Number.isSafeInteger(value.byteLength) && value.byteLength >= 0)
  const identity = {}
  for (const key of sourceIdentityKeys) identity[key] = value[key]
  for (const key of ['volumeId','fileId','modifiedTimeNanoseconds','changeTimeNanoseconds']) sourceRequire(owner, typeof identity[key] === 'string' && /^(0|[1-9][0-9]{0,63})$/.test(identity[key]))
  return Object.freeze(identity)
}
function sourceSameIdentity(left, right) { return sourceIdentityKeys.every(key => left[key] === right[key]) }
function sourceSameObject(left, right) { return left.pathType === right.pathType && left.volumeId === right.volumeId && left.fileId === right.fileId && left.reparsePoint === right.reparsePoint }
async function sourceCanonicalChain(owner, path, expectedType) {
  sourceRequire(owner, typeof path === 'string' && path.length <= 32767 && !path.includes('\0') && sourcePath.isAbsolute(path) && sourcePath.normalize(path) === path && !path.startsWith('\\\\'))
  const root = sourcePath.parse(path).root
  const parts = path.slice(root.length).split('\\').filter(Boolean)
  const chain = []
  let current = root
  for (let index = -1; index < parts.length; index += 1) {
    if (index >= 0) current = sourcePath.join(current,parts[index])
    const canonical = await sourceOperation(owner,'canonicalize-path',{path:current})
    sourceRequire(owner, canonical.kind === 'canonical-path' && canonical.path === current, true)
    const result = await sourceOperation(owner,'inspect-path',{path:current})
    sourceRequire(owner, result.kind === 'path-identity')
    const prior = owner.sourceState.parentIdentities.get(current)
    if (prior) sourceRequire(owner, result.pathType === prior.pathType && result.reparsePoint === prior.reparsePoint, true)
    const identity = sourceIdentity(owner,result,index === parts.length - 1 ? expectedType : 'directory')
    if (prior) sourceRequire(owner, prior.pathType === 'regular-file' ? sourceSameIdentity(prior,identity) : sourceSameObject(prior,identity), true)
    else owner.sourceState.parentIdentities.set(current,identity)
    chain.push(Object.freeze({path:current,identity}))
  }
  return Object.freeze(chain)
}
async function sourceOpen(owner, path, expectedType, cap) {
  const chain = await sourceCanonicalChain(owner,path,expectedType)
  const identity = chain[chain.length - 1].identity
  sourceRequire(owner, expectedType !== 'regular-file' || identity.byteLength <= cap)
  const opened = await sourceOperation(owner,'open-resource',{path,expectedType})
  sourceRequire(owner, opened.kind === 'resource-opened' && opened.resourceHandle !== null && opened.resourceHandle !== undefined)
  sourceRequire(owner,!owner.sourceState.activeResourceHandles.has(opened.resourceHandle),true)
  const entry = {path,resourceHandle:opened.resourceHandle,identity,cap,closed:false,bytes:null,sha256:null}
  owner.sourceState.openResources.push(entry)
  owner.sourceState.activeResourceHandles.add(entry.resourceHandle)
  const held = await sourceOperation(owner,'inspect-open-resource',{resourceHandle:entry.resourceHandle})
  sourceRequire(owner, held.kind === 'open-resource-identity')
  sourceRequire(owner, sourceSameIdentity(identity,sourceIdentity(owner,held,expectedType)), true)
  return entry
}
async function sourceReadHeld(owner, entry) {
  sourceRequire(owner, !entry.closed && entry.identity.byteLength <= entry.cap)
  let bytes = null
  let offset = 0
  do {
    const requested = Math.min(sourceLimits.chunk,Math.max(1,entry.identity.byteLength - offset))
    const result = await sourceOperation(owner,'read-resource',{resourceHandle:entry.resourceHandle,offset,maximumByteLength:requested})
    sourceRequire(owner, result.kind === 'resource-bytes' && result.bytes instanceof Uint8Array && result.bytes.length <= requested && typeof result.endOfFile === 'boolean')
    sourceRequire(owner, offset + result.bytes.length <= entry.identity.byteLength, true)
    if (bytes === null && result.bytes.length === entry.identity.byteLength) bytes = result.bytes
    else {
      if (bytes === null) bytes = new Uint8Array(entry.identity.byteLength)
      bytes.set(result.bytes,offset)
    }
    offset += result.bytes.length
    sourceRequire(owner, result.endOfFile === (offset === entry.identity.byteLength), true)
    if (offset === entry.identity.byteLength) break
    sourceRequire(owner, result.bytes.length > 0)
  } while (offset < entry.identity.byteLength)
  const held = await sourceOperation(owner,'inspect-open-resource',{resourceHandle:entry.resourceHandle})
  sourceRequire(owner, held.kind === 'open-resource-identity' && sourceSameIdentity(entry.identity,sourceIdentity(owner,held,'regular-file')), true)
  return bytes
}
async function sourceReadFile(owner,path,cap,retain = true) {
  const entry = await sourceOpen(owner,path,'regular-file',cap)
  entry.bytes = await sourceReadHeld(owner,entry)
  entry.sha256 = sourceHash(entry.bytes)
  owner.sourceState.snapshots.push(entry)
  if (!retain) await sourceClose(owner,entry)
  return entry
}
async function sourceClose(owner, entry) {
  if (entry.closed) return
  await sourceCanonicalChain(owner,entry.path,entry.identity.pathType)
  try { await closeBrowserSyncTransportRuntimeDiagnosticResource(owner,entry.resourceHandle) }
  catch { return sourceStop(owner) }
  entry.closed = true
  owner.sourceState.activeResourceHandles.delete(entry.resourceHandle)
}
async function sourceDirectory(owner,path) {
  const entry = await sourceOpen(owner,path,'directory',0)
  const result = await sourceOperation(owner,'list-directory',{resourceHandle:entry.resourceHandle,maximumEntries:4096})
  sourceRequire(owner,result.kind === 'directory-entries' && Array.isArray(result.entries) && result.entries.length <= 4096)
  const names = new Map()
  const foldedNames = new Set()
  for (const item of result.entries) {
    sourceRequire(owner, item && typeof item.name === 'string' && item.name.length > 0 && sourceEncodeUtf8.encode(item.name).length <= 1024 && !/[\u0000\\/]/.test(item.name) && item.name !== '.' && item.name !== '..' && item.reparsePoint === false && ['regular-file','directory'].includes(item.pathType))
    const foldedName = item.name.toLowerCase()
    sourceRequire(owner,!names.has(item.name) && !foldedNames.has(foldedName))
    foldedNames.add(foldedName)
    names.set(item.name,Object.freeze({name:item.name,pathType:item.pathType,reparsePoint:false}))
  }
  await sourceClose(owner,entry)
  return names
}
function sourceInflate(owner, bytes, cap) {
  let result
  try { result = sourceInflateSync(bytes,{maxOutputLength:Math.max(1,cap),info:true}) } catch { return sourceStop(owner) }
  sourceRequire(owner, result && result.buffer instanceof Uint8Array && result.buffer.length <= cap && result.engine.bytesWritten === bytes.length)
  return new Uint8Array(result.buffer)
}
function sourceObjectDigest(type,bytes) { return sourceCreateHash('sha1').update(sourceEncodeUtf8.encode(type + ' ' + bytes.length + '\0')).update(bytes).digest('hex') }
function sourceChargeObject(owner, expandedLength) {
  const git = owner.sourceState.git
  sourceRequire(owner,git.objectsRead < sourceLimits.objects && expandedLength >= 0 && expandedLength <= sourceLimits.expanded - git.expandedBytes)
  git.objectsRead += 1
  git.expandedBytes += expandedLength
}
function sourceCrc32(bytes) {
  let crc = 0xffffffff
  for (let index=0;index<bytes.length;index+=1) {
    crc ^= bytes[index]
    for(let bit=0;bit<8;bit+=1) crc=(crc >>> 1)^((crc & 1)?0xedb88320:0)
  }
  return (crc ^ 0xffffffff) >>> 0
}
function sourcePackIndex(owner, bytes) {
  sourceRequire(owner,bytes.length >= 1072 && bytes.length <= sourceLimits.index && sourceU32(owner,bytes,0) === 0xff744f63 && sourceU32(owner,bytes,4) === 2)
  const fanout=[]
  for(let index=0;index<256;index+=1) { const value=sourceU32(owner,bytes,8+4*index); sourceRequire(owner,index===0 || value>=fanout[index-1]); fanout.push(value) }
  const count=fanout[255]
  sourceRequire(owner,count <= Math.floor((bytes.length - 1072) / 28))
  const namesAt=1032, crcAt=namesAt+count*20, offsetsAt=crcAt+count*4, largeAt=offsetsAt+count*4
  sourceRequire(owner,largeAt+40<=bytes.length && (bytes.length-largeAt-40)%8===0)
  const largeCount=(bytes.length-largeAt-40)/8
  sourceRequire(owner,largeCount<=count && sourceHash(bytes.subarray(0,bytes.length-20),'sha1')===sourceHex(bytes.subarray(bytes.length-20)))
  const records=[], offsets=new Set(), usedLarge=new Set(), histogram=new Array(256).fill(0)
  let previous=''
  for(let index=0;index<count;index+=1) {
    const oid=sourceHex(bytes.subarray(namesAt+20*index,namesAt+20*(index+1)))
    sourceRequire(owner,index===0 || oid>previous); previous=oid
    histogram[bytes[namesAt+20*index]]+=1
    const stored=sourceU32(owner,bytes,offsetsAt+4*index)
    let offset=stored
    if(stored>=2147483648) {
      const largeIndex=stored-2147483648
      sourceRequire(owner,largeIndex<largeCount && !usedLarge.has(largeIndex)); usedLarge.add(largeIndex)
      const high=sourceU32(owner,bytes,largeAt+largeIndex*8), low=sourceU32(owner,bytes,largeAt+largeIndex*8+4)
      offset=high*4294967296+low
    }
    sourceRequire(owner,Number.isSafeInteger(offset) && offset>=12 && offset<sourceLimits.pack && !offsets.has(offset)); offsets.add(offset)
    records.push({oid,offset,crc:sourceU32(owner,bytes,crcAt+4*index)})
  }
  let cumulative=0
  for(let index=0;index<256;index+=1) { cumulative+=histogram[index]; sourceRequire(owner,fanout[index]===cumulative) }
  sourceRequire(owner,usedLarge.size===largeCount)
  return {records,count,packHash:sourceHex(bytes.subarray(bytes.length-40,bytes.length-20))}
}
function sourceVarint(owner,bytes,cursor,limit) {
  let value=0, factor=1, byte, count=0
  do { sourceRequire(owner,cursor.value<bytes.length && count<8); byte=bytes[cursor.value++]; value+=(byte&127)*factor; sourceRequire(owner,Number.isSafeInteger(value)&&value<=limit); factor*=128; count+=1 } while(byte&128)
  return value
}
function sourceApplyDelta(owner,base,delta,outputCap=sourceLimits.expanded) {
  const cursor={value:0}
  const baseLength=sourceVarint(owner,delta,cursor,sourceLimits.expanded)
  const outputLength=sourceVarint(owner,delta,cursor,outputCap)
  sourceRequire(owner,baseLength===base.length && outputLength<=sourceLimits.expanded-owner.sourceState.git.expandedBytes)
  const output=new Uint8Array(outputLength)
  let written=0
  while(cursor.value<delta.length) {
    const opcode=delta[cursor.value++]
    if(opcode&128) {
      let offset=0,length=0
      for(let byte=0;byte<4;byte+=1) if(opcode&(1<<byte)) { sourceRequire(owner,cursor.value<delta.length); offset+=delta[cursor.value++]*2**(8*byte) }
      for(let byte=0;byte<3;byte+=1) if(opcode&(16<<byte)) { sourceRequire(owner,cursor.value<delta.length); length+=delta[cursor.value++]*2**(8*byte) }
      if(length===0) length=65536
      sourceRequire(owner,offset+length<=base.length && written+length<=output.length)
      output.set(base.subarray(offset,offset+length),written); written+=length
    } else {
      sourceRequire(owner,opcode!==0 && cursor.value+opcode<=delta.length && written+opcode<=output.length)
      output.set(delta.subarray(cursor.value,cursor.value+opcode),written); cursor.value+=opcode; written+=opcode
    }
  }
  sourceRequire(owner,written===outputLength)
  return output
}
async function sourceReadPackedObject(owner,pack,record,depth,ancestors) {
  const git=owner.sourceState.git
  const cacheKey=pack.name+':'+record.offset
  if(git.packedCache.has(cacheKey)) return git.packedCache.get(cacheKey)
  sourceRequire(owner,git.objectsRead<sourceLimits.objects)
  sourceRequire(owner,depth<=sourceLimits.delta && !ancestors.has(cacheKey))
  const branch=new Set(ancestors); branch.add(cacheKey)
  if(!pack.bytes) {
    const entry=await sourceReadFile(owner,sourceJoin(owner,git.objectsRoot,'pack/'+pack.name+'.pack'),sourceLimits.pack,false)
    sourceRequire(owner,entry.bytes.length>=32 && entry.bytes.length<=sourceLimits.pack-git.addressedPackBytes)
    const bytes=entry.bytes
    sourceRequire(owner,sourceAscii(owner,bytes.subarray(0,4))==='PACK' && [2,3].includes(sourceU32(owner,bytes,4)) && sourceU32(owner,bytes,8)===pack.index.count)
    sourceRequire(owner,sourceHash(bytes.subarray(0,bytes.length-20),'sha1')===sourceHex(bytes.subarray(bytes.length-20)) && pack.index.packHash===sourceHex(bytes.subarray(bytes.length-20)))
    const ordered=[...pack.index.records].sort((left,right)=>left.offset-right.offset)
    sourceRequire(owner,ordered.length===0 ? bytes.length===32 : ordered[0].offset===12)
    pack.byOffset=new Map()
    for(let index=0;index<ordered.length;index+=1) {
      const candidate=ordered[index]
      candidate.end=index+1<ordered.length?ordered[index+1].offset:bytes.length-20
      sourceRequire(owner,candidate.offset<candidate.end && candidate.end<=bytes.length-20)
      sourceRequire(owner,sourceCrc32(bytes.subarray(candidate.offset,candidate.end))===candidate.crc)
      pack.byOffset.set(candidate.offset,candidate)
    }
    git.addressedPackBytes+=bytes.length
    pack.bytes=bytes
  }
  const bytes=pack.bytes
  let cursor=record.offset, initial=bytes[cursor++], typeCode=(initial>>>4)&7, size=initial&15, factor=16, headerBytes=1
  while(initial&128) {
    sourceRequire(owner,cursor<record.end && headerBytes<9)
    initial=bytes[cursor++]; size+=(initial&127)*factor; factor*=128; headerBytes+=1
    sourceRequire(owner,Number.isSafeInteger(size) && size<=sourceLimits.expanded)
  }
  sourceRequire(owner,[1,2,3,6,7].includes(typeCode) && size<=sourceLimits.expanded-git.expandedBytes)
  let baseRecord=null,baseOid=null
  if(typeCode===6) {
    sourceRequire(owner,cursor<record.end)
    let byte=bytes[cursor++], distance=byte&127, count=1
    while(byte&128) {
      sourceRequire(owner,cursor<record.end && count<8)
      byte=bytes[cursor++]; distance=(distance+1)*128+(byte&127); count+=1
      sourceRequire(owner,Number.isSafeInteger(distance) && distance<=record.offset-12)
    }
    sourceRequire(owner,distance>0)
    baseRecord=pack.byOffset.get(record.offset-distance)
    sourceRequire(owner,baseRecord!==undefined)
  } else if(typeCode===7) {
    sourceRequire(owner,cursor+20<record.end)
    baseOid=sourceHex(bytes.subarray(cursor,cursor+20)); cursor+=20
  }
  sourceRequire(owner,cursor<record.end)
  sourceRequire(owner,typeCode!==3 || size<=sourceLimits.blob)
  const inflated=sourceInflate(owner,bytes.subarray(cursor,record.end),size)
  sourceRequire(owner,inflated.length===size)
  sourceChargeObject(owner,inflated.length)
  let type,body
  if(typeCode===6 || typeCode===7) {
    const base=typeCode===6?await sourceReadPackedObject(owner,pack,baseRecord,depth+1,branch):await sourceReadGitObject(owner,baseOid,depth+1,branch)
    type=base.type; body=sourceApplyDelta(owner,base.bytes,inflated,base.type==='blob'?sourceLimits.blob:sourceLimits.expanded)
    sourceRequire(owner,body.length<=sourceLimits.expanded-git.expandedBytes)
    git.expandedBytes+=body.length
  } else { type=typeCode===1?'commit':typeCode===2?'tree':'blob'; body=inflated }
  sourceRequire(owner,type!=='blob' || body.length<=sourceLimits.blob)
  sourceRequire(owner,sourceObjectDigest(type,body)===record.oid)
  const object=Object.freeze({type,bytes:body,oid:record.oid})
  git.packedCache.set(cacheKey,object)
  return object
}
async function sourceReadGitObject(owner,oid,depth=0,ancestors=new Set()) {
  const git=owner.sourceState.git
  sourceRequire(owner,sourceValidOid(oid) && depth<=sourceLimits.delta)
  if(git.objectCache.has(oid)) return git.objectCache.get(oid)
  sourceRequire(owner,git.objectsRead<sourceLimits.objects)
  sourceRequire(owner,!ancestors.has('oid:'+oid))
  const branch=new Set(ancestors); branch.add('oid:'+oid)
  let object=null
  if(git.objectDirectories.has(oid.slice(0,2))) {
    let entries=git.looseDirectories.get(oid.slice(0,2))
    if(!entries) {
      entries=await sourceDirectory(owner,sourceJoin(owner,git.objectsRoot,oid.slice(0,2)))
      for(const item of entries.values()) sourceRequire(owner,/^[0-9a-f]{38}$/.test(item.name) && item.pathType==='regular-file')
      git.looseDirectories.set(oid.slice(0,2),entries)
    }
    if(entries.has(oid.slice(2))) {
      const entry=await sourceReadFile(owner,sourceJoin(owner,git.objectsRoot,oid.slice(0,2)+'/'+oid.slice(2)),sourceLimits.expanded,false)
      const inflated=sourceInflate(owner,entry.bytes,sourceLimits.expanded-git.expandedBytes)
      const nul=inflated.indexOf(0)
      sourceRequire(owner,nul>0 && nul<=64)
      const match=/^(commit|tree|blob) (0|[1-9][0-9]*)$/.exec(sourceAscii(owner,inflated.subarray(0,nul)))
      sourceRequire(owner,match!==null)
      const length=Number(match[2]),body=inflated.subarray(nul+1)
      sourceRequire(owner,Number.isSafeInteger(length) && length===body.length && (match[1]!=='blob'||length<=sourceLimits.blob) && sourceHash(inflated,'sha1')===oid)
      sourceChargeObject(owner,inflated.length)
      object=Object.freeze({type:match[1],bytes:new Uint8Array(body),oid})
    }
  }
  if(!object) {
    const candidates=git.packObjects.get(oid)
    sourceRequire(owner,candidates && candidates.length>0)
    for(const candidate of candidates) {
      const resolved=await sourceReadPackedObject(owner,candidate.pack,candidate.record,depth,branch)
      if(object) sourceRequire(owner,object.type===resolved.type && sourceBytesEqual(object.bytes,resolved.bytes))
      else object=resolved
    }
  }
  git.objectCache.set(oid,object)
  return object
}
function sourceConfig(owner,bytes) {
  const text=sourceText(owner,bytes)
  sourceRequire(owner,text.length<=1048576 && !text.includes('\0'))
  let section='',format=null,bare=false
  const seen=new Set()
  for(const raw of text.split(/\r?\n/)) {
    const line=raw.trim()
    if(line===''||line.startsWith('#')||line.startsWith(';')) continue
    if(line.startsWith('[')) {
      const header=/^\[([A-Za-z][A-Za-z0-9.-]*)(?:\s+"([^"\r\n]*)")?\]$/.exec(line)
      sourceRequire(owner,header!==null)
      section=header[1].toLowerCase()
      sourceRequire(owner,!['include','includeif'].includes(section))
      if(section==='extensions') sourceRequire(owner,header[2]===undefined)
      continue
    }
    const member=/^([A-Za-z][A-Za-z0-9-]*)\s*(?:=\s*(.*))?$/.exec(line)
    sourceRequire(owner,member!==null && section!=='')
    const key=member[1].toLowerCase(),value=member[2]===undefined?'true':member[2].trim()
    sourceRequire(owner,!(section==='remote' && ['promisor','partialclonefilter'].includes(key)))
    if(section==='extensions') {
      sourceRequire(owner,key==='objectformat' && value==='sha1' && !seen.has('extensions.objectformat'))
      seen.add('extensions.objectformat')
    }
    if(section==='core'&&['repositoryformatversion','bare','worktree','sparsecheckout','sparsecheckoutcone'].includes(key)) {
      sourceRequire(owner,!seen.has('core.'+key)); seen.add('core.'+key)
      if(key==='repositoryformatversion') { sourceRequire(owner,value==='0'||value==='1'); format=Number(value) }
      else if(key==='bare') { sourceRequire(owner,value==='false'); bare=false }
      else sourceRequire(owner,false)
    }
  }
  sourceRequire(owner,format!==null && bare===false)
}
function sourceIndexShape(owner,bytes) {
  sourceRequire(owner,bytes.length>=32 && sourceAscii(owner,bytes.subarray(0,4))==='DIRC')
  const version=sourceU32(owner,bytes,4),count=sourceU32(owner,bytes,8)
  sourceRequire(owner,[2,3].includes(version) && count<=4096 && sourceHash(bytes.subarray(0,bytes.length-20),'sha1')===sourceHex(bytes.subarray(bytes.length-20)))
  let cursor=12
  for(let index=0;index<count;index+=1) {
    const start=cursor
    sourceRequire(owner,cursor+62<bytes.length-20)
    sourceRequire(owner,[33188,33261].includes(sourceU32(owner,bytes,cursor+24)))
    const flags=bytes[cursor+60]*256+bytes[cursor+61]
    cursor+=62
    if(flags&0x4000) { sourceRequire(owner,version===3 && cursor+2<bytes.length-20); const extended=bytes[cursor]*256+bytes[cursor+1]; sourceRequire(owner,(extended&0x9fff)===0); cursor+=2 }
    const nul=bytes.indexOf(0,cursor)
    sourceRequire(owner,nul>=cursor && nul<bytes.length-20 && nul-cursor<=1024)
    sourceSafeRelative(owner,sourceText(owner,bytes.subarray(cursor,nul)))
    sourceRequire(owner,(flags&0x0fff)===0x0fff || (flags&0x0fff)===nul-cursor)
    cursor=nul+1
    while((cursor-start)%8!==0) { sourceRequire(owner,cursor<bytes.length-20 && bytes[cursor]===0); cursor+=1 }
  }
  while(cursor<bytes.length-20) {
    sourceRequire(owner,cursor+8<=bytes.length-20)
    const signature=sourceAscii(owner,bytes.subarray(cursor,cursor+4)),length=sourceU32(owner,bytes,cursor+4)
    // Known optional cache/resolve extensions are retained as raw bytes, never used as a clean-state oracle.
    sourceRequire(owner,['TREE','REUC','UNTR','FSMN','EOIE','IEOT'].includes(signature) && cursor+8+length<=bytes.length-20)
    cursor+=8+length
  }
  sourceRequire(owner,cursor===bytes.length-20)
}
async function sourceResolveRepository(owner) {
  const state=owner.sourceState
  const rootResult=await sourceOperation(owner,'canonicalize-path',{path:owner.r0.workingDirectory})
  sourceRequire(owner,rootResult.kind==='canonical-path' && rootResult.path===owner.r0.workingDirectory)
  state.repositoryRoot=rootResult.path
  await sourceCanonicalChain(owner,state.repositoryRoot,'directory')
  const rootEntries=await sourceDirectory(owner,state.repositoryRoot)
  sourceRequire(owner,rootEntries.has('.git') && rootEntries.get('.git').pathType==='directory')
  const gitRoot=sourceJoin(owner,state.repositoryRoot,'.git'),entries=await sourceDirectory(owner,gitRoot)
  state.git={root:gitRoot,objectsRoot:sourceJoin(owner,gitRoot,'objects'),objectsRead:0,expandedBytes:0,addressedPackBytes:0,objectCache:new Map(),packedCache:new Map(),looseDirectories:new Map(),packObjects:new Map(),packs:[],objectDirectories:new Map(),trackedPaths:new Map()}
  for(const forbidden of ['commondir','gitdir','shallow','worktrees']) sourceRequire(owner,!entries.has(forbidden))
  for(const required of ['HEAD','config','index']) sourceRequire(owner,entries.has(required) && entries.get(required).pathType==='regular-file')
  const config=await sourceReadFile(owner,sourceJoin(owner,gitRoot,'config'),1048576)
  sourceConfig(owner,config.bytes); state.gitBaseline.push(config)
  state.git.packedRefsPresent=entries.has('packed-refs')
  if(state.git.packedRefsPresent) {
    sourceRequire(owner,entries.get('packed-refs').pathType==='regular-file')
    const packed=await sourceReadFile(owner,sourceJoin(owner,gitRoot,'packed-refs'),sourceLimits.index)
    state.gitBaseline.push(packed); state.git.packedRefs=sourcePackedRefs(owner,packed.bytes)
  } else state.git.packedRefs=new Map()
  const head=await sourceReadFile(owner,sourceJoin(owner,gitRoot,'HEAD'),4096)
  state.gitBaseline.push(head)
  const headText=sourceAscii(owner,head.bytes)
  let commit
  if(/^[0-9a-f]{40}\n?$/.test(headText)) commit=headText.endsWith('\n')?headText.slice(0,-1):headText
  else {
    const match=/^ref: (refs\/[A-Za-z0-9_./-]+)\n?$/.exec(headText)
    sourceRequire(owner,match!==null)
    const ref=sourceSafeRelative(owner,match[1]); sourceRequire(owner,!ref.includes('..') && !ref.endsWith('.lock') && !ref.startsWith('refs/replace/'))
    let parts=ref.split('/'),directory=gitRoot,exists=true
    for(let index=0;index<parts.length;index+=1) {
      const contents=await sourceDirectory(owner,directory),item=contents.get(parts[index])
      if(!item) { exists=false; break }
      sourceRequire(owner,item.pathType===(index===parts.length-1?'regular-file':'directory'))
      directory=sourceJoin(owner,directory,parts[index])
    }
    if(exists) {
      const reference=await sourceReadFile(owner,sourceJoin(owner,gitRoot,ref),4096)
      state.gitBaseline.push(reference)
      const raw=sourceAscii(owner,reference.bytes)
      sourceRequire(owner,/^[0-9a-f]{40}\n?$/.test(raw)); commit=raw.endsWith('\n')?raw.slice(0,-1):raw
    } else {
      sourceRequire(owner,state.git.packedRefsPresent)
      commit=state.git.packedRefs.get(ref)
      sourceRequire(owner,sourceValidOid(commit))
    }
  }
  sourceRequire(owner,sourceValidOid(commit)); state.repositoryCommit=commit
  const index=await sourceReadFile(owner,sourceJoin(owner,gitRoot,'index'),sourceLimits.index)
  sourceIndexShape(owner,index.bytes); state.gitBaseline.push(index)
  if(entries.has('info')) {
    const info=await sourceDirectory(owner,sourceJoin(owner,gitRoot,'info'))
    sourceRequire(owner,!info.has('grafts') && !info.has('sparse-checkout'))
  }
  if(entries.has('refs')) {
    const refs=await sourceDirectory(owner,sourceJoin(owner,gitRoot,'refs'))
    sourceRequire(owner,!refs.has('replace'))
  }
  const objects=await sourceDirectory(owner,state.git.objectsRoot)
  for(const item of objects.values()) {
    sourceRequire(owner,item.pathType==='directory' && (item.name==='info'||item.name==='pack'||/^[0-9a-f]{2}$/.test(item.name)))
    if(/^[0-9a-f]{2}$/.test(item.name)) state.git.objectDirectories.set(item.name,item)
  }
  if(objects.has('info')) {
    const info=await sourceDirectory(owner,sourceJoin(owner,state.git.objectsRoot,'info'))
    sourceRequire(owner,!info.has('alternates') && !info.has('http-alternates'))
  }
  if(objects.has('pack')) {
    const packs=await sourceDirectory(owner,sourceJoin(owner,state.git.objectsRoot,'pack'))
    for(const item of packs.values()) sourceRequire(owner,item.pathType==='regular-file' && /^pack-[0-9a-f]{40}\.(?:idx|pack|keep|rev|bitmap)$/.test(item.name))
    for(const item of packs.values()) if(item.name.endsWith('.idx')) {
      const name=item.name.slice(0,-4)
      sourceRequire(owner,packs.has(name+'.pack'))
      const entry=await sourceReadFile(owner,sourceJoin(owner,state.git.objectsRoot,'pack/'+item.name),sourceLimits.index,false)
      const parsed=sourcePackIndex(owner,entry.bytes)
      sourceRequire(owner,name==='pack-'+parsed.packHash)
      const pack={name,index:parsed,bytes:null,byOffset:null}; state.git.packs.push(pack)
      for(const record of parsed.records) {
        const list=state.git.packObjects.get(record.oid)||[]; list.push({pack,record}); state.git.packObjects.set(record.oid,list)
      }
    }
    for(const item of packs.values()) if(item.name.endsWith('.pack')) sourceRequire(owner,packs.has(item.name.slice(0,-5)+'.idx'))
  }
  const commitObject=await sourceReadGitObject(owner,commit)
  sourceRequire(owner,commitObject.type==='commit')
  const commitText=sourceText(owner,commitObject.bytes),headerEnd=commitText.indexOf('\n\n')
  sourceRequire(owner,headerEnd>=0)
  const headers=commitText.slice(0,headerEnd).split('\n'),treeHeaders=headers.filter(line=>line.startsWith('tree '))
  sourceRequire(owner,headers[0]===treeHeaders[0] && treeHeaders.length===1 && /^tree [0-9a-f]{40}$/.test(treeHeaders[0]))
  state.git.commitTree=treeHeaders[0].slice(5)
  await sourceWalkTree(owner,state.git.commitTree,'',new Set())
}
async function sourceWalkTree(owner,oid,prefix,ancestors) {
  sourceRequire(owner,!ancestors.has(oid) && prefix.split('/').length<=128)
  const branch=new Set(ancestors); branch.add(oid)
  const object=await sourceReadGitObject(owner,oid)
  sourceRequire(owner,object.type==='tree')
  const bytes=object.bytes,names=new Set()
  let cursor=0,previous=null
  while(cursor<bytes.length) {
    const space=bytes.indexOf(32,cursor),nul=bytes.indexOf(0,space+1)
    sourceRequire(owner,space>cursor && nul>space+1 && nul+21<=bytes.length)
    const mode=sourceAscii(owner,bytes.subarray(cursor,space)),name=sourceText(owner,bytes.subarray(space+1,nul))
    sourceRequire(owner,['40000','100644','100755'].includes(mode) && !name.includes('/') && !names.has(name.toLowerCase()))
    names.add(name.toLowerCase())
    const literal=sourceSafeRelative(owner,prefix+name),sortKey=sourceEncodeUtf8.encode(name+(mode==='40000'?'/':''))
    if(previous) {
      let compare=0
      for(let index=0;index<Math.min(previous.length,sortKey.length);index+=1) if(previous[index]!==sortKey[index]) { compare=previous[index]<sortKey[index]?-1:1; break }
      if(compare===0) compare=previous.length<sortKey.length?-1:previous.length===sortKey.length?0:1
      sourceRequire(owner,compare<0)
    }
    previous=sortKey
    const child=sourceHex(bytes.subarray(nul+1,nul+21)); cursor=nul+21
    if(mode==='40000') await sourceWalkTree(owner,child,literal+'/',branch)
    else {
      sourceRequire(owner,owner.sourceState.git.trackedPaths.size<4096)
      owner.sourceState.git.trackedPaths.set(literal,Object.freeze({oid:child,mode}))
    }
  }
}
async function readBrowserSyncTransportRuntimeDiagnosticGitBlob(owner,literalPath,blobCap=1048576) {
  sourceSafeRelative(owner,literalPath)
  sourceRequire(owner,Number.isSafeInteger(blobCap) && blobCap>=0 && blobCap<=sourceLimits.blob)
  const tracked=owner.sourceState.git.trackedPaths.get(literalPath)
  sourceRequire(owner,tracked!==undefined)
  const object=await sourceReadGitObject(owner,tracked.oid)
  sourceRequire(owner,object.type==='blob' && object.bytes.length<=blobCap)
  return new Uint8Array(object.bytes)
}
function sourceJson(owner,text) {
  sourceRequire(owner,sourceEncodeUtf8.encode(text).length<=1048576)
  let cursor=0,nodes=0
  const whitespace=()=>{ while(cursor<text.length && /[ \t\r\n]/.test(text[cursor])) cursor+=1 }
  const string=()=>{
    sourceRequire(owner,text[cursor++]==='"')
    let value=''
    while(cursor<text.length) {
      const character=text[cursor++]
      if(character==='"') return value
      sourceRequire(owner,character.charCodeAt(0)>=32)
      if(character!=='\\') { value+=character; continue }
      sourceRequire(owner,cursor<text.length)
      const escaped=text[cursor++]
      if(escaped==='u') {
        const hex=text.slice(cursor,cursor+4); sourceRequire(owner,/^[0-9a-fA-F]{4}$/.test(hex))
        value+=String.fromCharCode(Number.parseInt(hex,16)); cursor+=4
      } else {
        const escapedKeys='"\\/bfnrt',decoded=['"','\\','/','\b','\f','\n','\r','\t'],index=escapedKeys.indexOf(escaped)
        sourceRequire(owner,index>=0); value+=decoded[index]
      }
    }
    return sourceStop(owner)
  }
  const value=depth=>{
    nodes+=1; sourceRequire(owner,depth<=128 && nodes<=262144); whitespace()
    const token=text[cursor]
    if(token==='"') { string(); return }
    if(token==='{'||token==='[') {
      const object=token==='{',closing=object?'}':']',keys=new Set()
      cursor+=1; whitespace()
      if(text[cursor]===closing) { cursor+=1; return }
      while(true) {
        if(object) {
          sourceRequire(owner,text[cursor]==='"')
          const key=string(); sourceRequire(owner,!keys.has(key)); keys.add(key)
          whitespace(); sourceRequire(owner,text[cursor++]===':')
        }
        value(depth+1); whitespace()
        if(text[cursor]===closing) { cursor+=1; return }
        sourceRequire(owner,text[cursor++ ]===','); whitespace()
      }
    }
    for(const literal of ['true','false','null']) if(text.startsWith(literal,cursor)) { cursor+=literal.length; return }
    const number=/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/.exec(text.slice(cursor))
    sourceRequire(owner,number!==null); cursor+=number[0].length
  }
  value(0); whitespace(); sourceRequire(owner,cursor===text.length)
  try { return JSON.parse(text) } catch { return sourceStop(owner) }
}
function sourceData(owner,record,key) {
  sourceRequire(owner,record!==null && typeof record==='object' && !Array.isArray(record))
  const descriptor=Object.getOwnPropertyDescriptor(record,key)
  sourceRequire(owner,descriptor && Object.hasOwn(descriptor,'value') && descriptor.enumerable===true)
  return descriptor.value
}
function sourceByteCompare(left,right) {
  const first=sourceEncodeUtf8.encode(left),second=sourceEncodeUtf8.encode(right)
  for(let index=0;index<Math.min(first.length,second.length);index+=1) if(first[index]!==second[index]) return first[index]-second[index]
  return first.length-second.length
}
async function sourceCaptureVite(owner) {
  const state=owner.sourceState
  state.viteRuntimeVersion=null
  state.viteRuntimeVersionState='not-observed'
  const lock=state.worktree.get('package-lock.json')
  sourceRequire(owner,lock && lock.bytes.length<=1048576)
  const manifest=await sourceReadFile(owner,sourceJoin(owner,state.repositoryRoot,'node_modules/vite/package.json'),1048576)
  const lockValue=sourceJson(owner,sourceText(owner,lock.bytes)),manifestValue=sourceJson(owner,sourceText(owner,manifest.bytes))
  const lockVersion=sourceData(owner,lockValue,'lockfileVersion'),packages=sourceData(owner,lockValue,'packages')
  const packageEntry=sourceData(owner,packages,'node_modules/vite'),lockVite=sourceData(owner,packageEntry,'version')
  const installedVite=sourceData(owner,manifestValue,'version'),bin=sourceData(owner,manifestValue,'bin'),binVite=sourceData(owner,bin,'vite')
  const expectedPath=sourceJoin(owner,state.repositoryRoot,'node_modules/vite/bin/vite.js')
  sourceRequire(owner,lockVersion===3 && typeof lockVite==='string' && /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/.test(lockVite) && lockVite===installedVite && binVite==='bin/vite.js')
  const entry=await sourceReadFile(owner,expectedPath,1048576)
  state.viteEntryPath=entry.path
  state.viteEntry=entry
  state.vitePackage=manifest
  if(lockVite==='8.1.4') { state.viteRuntimeVersion='8.1.4'; state.viteRuntimeVersionState='observed' }
  else state.viteRuntimeVersionState='ambiguous'
}
function sourceExtractEvaluation(owner) {
  const state=owner.sourceState
  const document=state.worktree.get('docs/decisions/0033-browser-sync-transport-diagnostic-foundation-effects-protocol-boundary.md')
  sourceRequire(owner,document && document.sha256===sourceBindings['docs/decisions/0033-browser-sync-transport-diagnostic-foundation-effects-protocol-boundary.md'])
  const text=sourceText(owner,document.bytes),section='### 8. Exakter private Evaluationtext'
  const start=text.indexOf(section)
  sourceRequire(owner,start>=0 && start===text.lastIndexOf(section))
  const end=text.indexOf('\n### ',start+section.length),body=text.slice(start,end<0?text.length:end)
  const marker='```javascript\n',opening=body.indexOf(marker)
  sourceRequire(owner,opening>=0 && opening===body.lastIndexOf(marker))
  const closing=body.indexOf('\n```',opening+marker.length)
  sourceRequire(owner,closing>=0)
  const evaluation=body.slice(opening+marker.length,closing),bytes=sourceEncodeUtf8.encode(evaluation)
  sourceRequire(owner,bytes.length===4259 && !/[\r\n]/.test(evaluation) && sourceHash(bytes)==='a623ffafee8dfcbc1d2ddc374cc35f0dbf800defd97619a3b58337d972090f7b',true)
  state.evaluationString=evaluation
  state.evaluationHash=sourceHash(bytes)
  state.evaluationByteLength=bytes.length
}
async function captureBrowserSyncTransportRuntimeDiagnosticSources(owner) {
  sourceRequire(owner,!owner.sourceState)
  owner.sourceState={repositoryRoot:null,repositoryCommit:null,foundation:null,artifactHashes:Object.create(null),bindingMatches:Object.create(null),frontendManifestHash:null,viteRuntimeVersion:null,repositoryState:'not-observed',parentIdentities:new Map(),openResources:[],activeResourceHandles:new Set(),snapshots:[],gitBaseline:[],worktree:new Map(),worktreeByteLength:0,provenanceState:'unproven',violation:false,checkpoints:[],module:null,namespace:null,factory:null,factoryInstance:null,git:null}
  const state=owner.sourceState
  try {
    await sourceResolveRepository(owner)
    for(const [literal,tracked] of state.git.trackedPaths) {
      const path=sourceJoin(owner,state.repositoryRoot,literal)
      const entry=await sourceReadFile(owner,path,Math.min(literal===sourceFoundationPath||literal==='package-lock.json'?sourceLimits.blob:sourceLimits.file,sourceLimits.worktree-state.worktreeByteLength))
      sourceRequire(owner,entry.bytes.length<=sourceLimits.worktree-state.worktreeByteLength)
      state.worktreeByteLength+=entry.bytes.length
      entry.literalPath=literal; entry.blobOid=tracked.oid
      const blob=await readBrowserSyncTransportRuntimeDiagnosticGitBlob(owner,literal)
      entry.commitBlobMatches=sourceBytesEqual(entry.bytes,blob)
      state.worktree.set(literal,entry)
      // A checkout/commit mismatch is retained as an observed source violation, never a clean-state claim.
      if(!entry.commitBlobMatches) { state.violation=true; state.provenanceState='violated' }
    }
    for(const [literal,expected] of Object.entries(sourceBindings)) {
      const entry=state.worktree.get(literal)
      sourceRequire(owner,entry!==undefined)
      state.artifactHashes[literal]=entry.sha256
      state.bindingMatches[literal]=entry.sha256===expected && entry.commitBlobMatches
    }
    const foundation=state.worktree.get(sourceFoundationPath)
    sourceRequire(owner,foundation && foundation.bytes.length<=1048576 && foundation.sha256===sourceFoundationHash && foundation.commitBlobMatches,true)
    state.foundation={bytes:foundation.bytes,sha256:foundation.sha256,path:foundation.path,url:sourceFileUrl(foundation.path,{windows:true}).href,resourceHandle:foundation.resourceHandle,entry:foundation}
    const frontendPaths=[...state.git.trackedPaths.keys()].filter(path=>path==='index.html'||path==='package.json'||path==='package-lock.json'||path.startsWith('src/')).sort(sourceByteCompare)
    let manifest='goldendawn-frontend-runtime-source-set-v1\n'
    for(const path of frontendPaths) {
      const entry=state.worktree.get(path)
      manifest+=path+'\t'+entry.bytes.length+'\t'+entry.sha256+'\n'
    }
    const manifestBytes=sourceEncodeUtf8.encode(manifest)
    state.frontendManifestHash=sourceHash(manifestBytes)
    state.frontendManifestByteLength=manifestBytes.length
    state.frontendPaths=Object.freeze([...frontendPaths])
    state.frontendManifestMatches=frontendPaths.length===51 && manifestBytes.length===5606 && state.frontendManifestHash==='6f3d5740b043308b4d38df33b6293c9064d8dd1b3f0c5801d50844336c195591'
    sourceExtractEvaluation(owner)
    await sourceCaptureVite(owner)
    const node=await sourceReadFile(owner,owner.r0.executablePath,sourceLimits.pack)
    const chrome=await sourceReadFile(owner,'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',sourceLimits.pack)
    state.nodeExecutablePath=node.path; state.nodeExecutable=node
    state.chromeExecutablePath=chrome.path; state.chromeExecutable=chrome
    state.gatewayEntryPath=state.worktree.get('server/startLocalSyncGateway.js').path
    state.gatewayEntry=state.worktree.get('server/startLocalSyncGateway.js')
    state.provenanceState=state.violation?'violated':'verified'
    state.captureCompleted=true
    return state
  } catch { return sourceStop(owner) }
}
async function loadBrowserSyncTransportRuntimeDiagnosticFoundation(owner) {
  const state=owner.sourceState
  sourceRequire(owner,state && state.captureCompleted===true && state.module===null && state.foundation!==null)
  sourceRequire(owner,sourceHash(state.foundation.bytes)===sourceFoundationHash && typeof sourceVm.SourceTextModule==='function',true)
  try {
    const text=sourceText(owner,state.foundation.bytes)
    const module=new sourceVm.SourceTextModule(text,{identifier:state.foundation.url,importModuleDynamically:sourceRejectFoundationImport})
    state.module=module
    sourceRequire(owner,module.identifier===state.foundation.url && module.dependencySpecifiers.length===0,true)
    await module.link(sourceRejectFoundationImport)
    await module.evaluate()
    const namespace=module.namespace,keys=Object.getOwnPropertyNames(namespace)
    sourceRequire(owner,keys.length===1 && keys[0]==='createBrowserSyncTransportRuntimeDiagnosticObserver',true)
    const descriptor=Object.getOwnPropertyDescriptor(namespace,keys[0])
    sourceRequire(owner,descriptor && Object.hasOwn(descriptor,'value') && typeof descriptor.value==='function' && descriptor.value.length===1,true)
    state.namespace=namespace; state.factory=descriptor.value
    state.actualLoadedSha256=sourceHash(state.foundation.bytes)
    sourceRequire(owner,state.actualLoadedSha256===sourceFoundationHash,true)
    return state.factory
  } catch (error) { return sourceStop(owner,sourceImportDenials.has(error)) }
}
async function sourceVerifyRepositoryFeatures(owner) {
  const state=owner.sourceState,git=state.git
  const entries=await sourceDirectory(owner,git.root)
  sourceRequire(owner,entries.has('packed-refs')===git.packedRefsPresent,true)
  for(const forbidden of ['commondir','gitdir','shallow','worktrees']) sourceRequire(owner,!entries.has(forbidden),true)
  if(entries.has('info')) { const info=await sourceDirectory(owner,sourceJoin(owner,git.root,'info')); sourceRequire(owner,!info.has('grafts')&&!info.has('sparse-checkout'),true) }
  if(entries.has('refs')) { const refs=await sourceDirectory(owner,sourceJoin(owner,git.root,'refs')); sourceRequire(owner,!refs.has('replace'),true) }
  const objects=await sourceDirectory(owner,git.objectsRoot)
  if(objects.has('info')) { const info=await sourceDirectory(owner,sourceJoin(owner,git.objectsRoot,'info')); sourceRequire(owner,!info.has('alternates')&&!info.has('http-alternates'),true) }
  if(objects.has('pack')) {
    const packs=await sourceDirectory(owner,sourceJoin(owner,git.objectsRoot,'pack'))
    for(const item of packs.values()) sourceRequire(owner,item.pathType==='regular-file' && /^pack-[0-9a-f]{40}\.(?:idx|pack|keep|rev|bitmap)$/.test(item.name),true)
  }
}
async function verifyBrowserSyncTransportRuntimeDiagnosticSources(owner,phase) {
  const state=owner.sourceState
  sourceRequire(owner,state && state.captureCompleted===true && ['pre-o0','post-settlement','post-cleanup'].includes(phase))
  const checkpoint={phase,state:'unproven'}
  state.checkpoints.push(checkpoint)
  try {
    await sourceVerifyRepositoryFeatures(owner)
    const snapshots=[...state.snapshots]
    for(const entry of snapshots) {
      await sourceCanonicalChain(owner,entry.path,'regular-file')
      let current=entry
      if(entry.closed) current=await sourceOpen(owner,entry.path,'regular-file',entry.cap)
      const identity=await sourceOperation(owner,'inspect-open-resource',{resourceHandle:current.resourceHandle})
      sourceRequire(owner,identity.kind==='open-resource-identity' && sourceSameIdentity(entry.identity,sourceIdentity(owner,identity,'regular-file')),true)
      const held=await sourceReadHeld(owner,current)
      sourceRequire(owner,sourceBytesEqual(entry.bytes,held) && sourceHash(held)===entry.sha256,true)
      const fresh=await sourceOpen(owner,entry.path,'regular-file',entry.cap)
      sourceRequire(owner,sourceSameIdentity(entry.identity,fresh.identity),true)
      const freshBytes=await sourceReadHeld(owner,fresh)
      sourceRequire(owner,sourceBytesEqual(entry.bytes,freshBytes),true)
      await sourceClose(owner,fresh)
      if(current!==entry) await sourceClose(owner,current)
    }
    // The unchanged raw SHA-1 object/pack snapshots are the same inputs rechecked above.
    // Reconstruct and check every recorded commit blob again from those verified bytes.
    for(const [literal,entry] of state.worktree) {
      const object=state.git.objectCache.get(entry.blobOid)
      sourceRequire(owner,object && object.type==='blob' && sourceObjectDigest('blob',object.bytes)===entry.blobOid,true)
      sourceRequire(owner,sourceBytesEqual(entry.bytes,object.bytes)===entry.commitBlobMatches,true)
      if(literal===sourceFoundationPath) sourceRequire(owner,sourceHash(entry.bytes)===sourceFoundationHash && entry.commitBlobMatches,true)
    }
    sourceRequire(owner,sourceHash(state.foundation.bytes)===sourceFoundationHash,true)
    checkpoint.state='verified'
    return true
  } catch { checkpoint.state=state.violation?'violated':'unproven'; return sourceStop(owner) }
}
async function closeBrowserSyncTransportRuntimeDiagnosticSources(owner) {
  if(!owner.sourceState) return
  for(const entry of owner.sourceState.openResources) if(!entry.closed) await sourceClose(owner,entry)
}
function sourcePackedRefs(owner,bytes) {
  const refs=new Map(); let previousRef=null
  for(const line of sourceAscii(owner,bytes).split('\n')) {
    if(line===''||line.startsWith('#')) continue
    if(line.startsWith('^')) { sourceRequire(owner,previousRef!==null && /^\^[0-9a-f]{40}$/.test(line)); previousRef=null; continue }
    const row=/^([0-9a-f]{40}) (refs\/[A-Za-z0-9_./-]+)$/.exec(line)
    sourceRequire(owner,row!==null && !refs.has(row[2]) && !row[2].startsWith('refs/replace/'))
    sourceSafeRelative(owner,row[2]); refs.set(row[2],row[1]); previousRef=row[2]
  }
  return refs
}

// ADR-0036 record derivation. No I/O capability is reachable from this section.
const adr36RecordObjectPrototype = Object.prototype;
const adr36RecordArrayPrototype = Array.prototype;
const adr36RecordOwnKeys = Reflect.ownKeys;
const adr36RecordDescriptor = Object.getOwnPropertyDescriptor;
const adr36RecordPrototype = Object.getPrototypeOf;
const adr36RecordIsArray = Array.isArray;
const adr36RecordIsFrozen = Object.isFrozen;
const adr36RecordCharCodeAt = String.prototype.charCodeAt;
const adr36RecordStringSplit = String.prototype.split;
const adr36RecordStringEndsWith = String.prototype.endsWith;
const adr36RecordRegExpTest = RegExp.prototype.test;
const Adr36RecordDate = Date;
const Adr36RecordString = String;
const Adr36RecordTypeError = TypeError;
const adr36RecordDateToISOString = Date.prototype.toISOString;
const adr36RecordFreeze = Object.freeze;
const adr36RecordDefine = Object.defineProperty;
const adr36RecordApply = Reflect.apply;
const adr36RecordWeakMap = WeakMap;
const adr36RecordWeakGet = WeakMap.prototype.get;
const adr36RecordWeakSet = WeakMap.prototype.set;
const adr36RecordWeakHas = WeakMap.prototype.has;
const adr36RecordOwners = new adr36RecordWeakMap();
const adr36RecordFinalBindings = new adr36RecordWeakMap();
const adr36RecordCommands = adr36RecordFreeze(['Target.getTargets', 'Target.attachToTarget', 'Network.enable', 'Runtime.evaluate', 'Network.disable', 'Target.detachFromTarget']);
const adr36RecordIntegrityIds = adr36RecordFreeze(['sourceUnmodified', 'instrumentedSourceCopyAbsent', 'compositionSeamsAbsent', 'protocolAllowlistOnly', 'runtimeSurfaceMutationAbsent', 'fetchInterceptionAbsent', 'debuggerBreakpointsAndSteppingAbsent', 'profilerAndTracingAbsent', 'responseBodyReadAbsent', 'freeRawInspectionAbsent', 'additionalNativeFetchAbsent', 'observerProductEndpointRequestAbsent', 'rawPersistenceAbsent', 'observerDiagnosticDuringRunOutputAbsent', 'closedPrimitiveProjectionConfirmed', 'singleTargetAndSessionConfirmed', 'singleMainWorldEvaluationConfirmed']);
const adr36RecordCleanupIds = adr36RecordFreeze(['cleanupStarted', 'networkDomainClosed', 'targetSessionClosed', 'debugPipeClosed', 'controllerObservationClosed', 'browserStopped', 'devServerStopped', 'gatewayStopped', 'profileRemoved', 'harnessFragmentsRemoved', 'objectGroupsAbsentOrReleased', 'rawEventsDiscarded', 'ephemeralIdentifiersDiscarded', 'permissionSiteCacheAndServiceWorkerStateCleared', 'environmentRestored', 'portsFree', 'repositoryAndIndexRestored', 'historicalEvidenceHashUnchanged', 'observerStorageLogAndTelemetryResidueAbsent', 'cleanupCompleted']);
const adr36RecordProjectionKeys = adr36RecordFreeze(['schemaVersion', 'projectionType', 'diagnosticRunId', 'observedAt', 'timeZone', 'historicalEvidence', 'replay', 'observer', 'requestBudget', 'publicSettlement', 'stages', 'timing', 'cleanup', 'adr0029OverallGate', 'candidateObserverGate', 'candidateFinding', 'causeStatus']);
const adr36RecordRootKeys = adr36RecordFreeze(['schemaVersion', 'recordType', 'diagnosticRunId', 'observedAt', 'timeZone', 'historicalEvidence', 'replay', 'observer', 'requestBudget', 'publicSettlement', 'stages', 'timing', 'cleanup', 'adr0029OverallGate', 'observerGate', 'finding', 'causeStatus']);
const adr36RecordFoundationHash = 'd4cadf656bb50e2b062c9d0d66e3f895bc87649362ce995abfbdbe24a9f4e731';
const adr36RecordEvaluationHash = 'a623ffafee8dfcbc1d2ddc374cc35f0dbf800defd97619a3b58337d972090f7b';
const adr36RecordHistoricalHash = 'ffad6b1de2e0c32ec5c2cdc3e88bfd455b14adc2eb4dd45f0d81e911e1a64b33';

function adr36RecordFailure() { throw new Adr36RecordTypeError('browserSyncTransportRuntimeDiagnosticAdapterFailed'); }
function adr36RecordAssert(value) { if (value !== true) adr36RecordFailure(); }
function adr36RecordEnum(value, choices) {
  for (let i = 0; i < choices.length; i += 1) if (value === choices[i]) return true;
  return false;
}
function adr36RecordKeys(value, expected) {
  adr36RecordAssert(value !== null && typeof value === 'object' && !adr36RecordIsArray(value));
  const keys = adr36RecordOwnKeys(value);
  adr36RecordAssert(keys.length === expected.length);
  for (let i = 0; i < keys.length; i += 1) adr36RecordAssert(keys[i] === expected[i]);
}
function adr36RecordSafeCount(value) { return typeof value === 'number' && value >= 0 && value <= 9007199254740991 && value % 1 === 0; }
function adr36RecordFinite(value) { return typeof value === 'number' && value >= 0 && value <= 9007199254740991; }
function adr36RecordHash(value) {
  if (typeof value !== 'string' || value.length !== 64) return false;
  for (let i = 0; i < value.length; i += 1) {
    const code = adr36RecordApply(adr36RecordCharCodeAt, value, [i]);
    if (!((code >= 48 && code <= 57) || (code >= 97 && code <= 102))) return false;
  }
  return true;
}
function adr36RecordPattern(value, pattern) { return typeof value === 'string' && adr36RecordApply(adr36RecordRegExpTest, pattern, [value]); }
function adr36RecordAscii(value, maximum) {
  if (typeof value !== 'string' || value.length < 1 || value.length > maximum) return false;
  for (let i = 0; i < value.length; i += 1) { const code = adr36RecordApply(adr36RecordCharCodeAt, value, [i]); if (code < 32 || code > 126) return false; }
  return true;
}
function adr36RecordScalar(value, type) {
  if (type === 'H64') return adr36RecordHash(value);
  if (type === 'B') return typeof value === 'boolean';
  if (type === 'P') return adr36RecordSafeCount(value) && value <= 65535;
  if (type === 'STATE') return adr36RecordEnum(value, ['clean', 'dirty', 'unknown']);
  if (type === 'S32') return adr36RecordAscii(value, 32) && adr36RecordPattern(value, /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/);
  const maxima = { A16: 16, A32: 32, A64: 64, A128: 128, A256: 256, A1024: 1024, A2048: 2048 };
  return typeof maxima[type] === 'number' && adr36RecordAscii(value, maxima[type]);
}
function adr36RecordFrozenTree(value, permitNullRoot = false) {
  const seen = new adr36RecordWeakMap();
  let nodes = 0;
  const visit = (node, depth) => {
    if (node === null || typeof node === 'boolean') return node;
    if (typeof node === 'string') { adr36RecordAssert(node.length <= 262144); return node; }
    if (typeof node === 'number') { adr36RecordAssert(adr36RecordFinite(node)); return node; }
    adr36RecordAssert(typeof node === 'object' && depth <= 32 && ++nodes <= 4096);
    adr36RecordAssert(!adr36RecordApply(adr36RecordWeakHas, seen, [node]));
    adr36RecordApply(adr36RecordWeakSet, seen, [node, true]);
    const array = adr36RecordIsArray(node);
    const prototype = adr36RecordPrototype(node);
    adr36RecordAssert(prototype === (array ? adr36RecordArrayPrototype : adr36RecordObjectPrototype) || (depth === 0 && permitNullRoot && prototype === null));
    adr36RecordAssert(adr36RecordIsFrozen(node));
    const keys = adr36RecordOwnKeys(node);
    const result = array ? [] : {};
    let count = keys.length;
    if (array) {
      const length = adr36RecordDescriptor(node, 'length');
      adr36RecordAssert(length !== undefined && length.enumerable === false && length.configurable === false && length.writable === false && adr36RecordSafeCount(length.value));
      count = length.value;
      adr36RecordAssert(count <= 4096 && keys.length === count + 1 && keys[count] === 'length');
    }
    for (let i = 0; i < count; i += 1) {
      const key = keys[i];
      adr36RecordAssert(typeof key === 'string' && key !== 'then' && key !== 'toJSON' && key !== '__proto__' && (!array || key === Adr36RecordString(i)));
      const descriptor = adr36RecordDescriptor(node, key);
      adr36RecordAssert(descriptor !== undefined && descriptor.enumerable === true && descriptor.configurable === false && descriptor.writable === false && adr36RecordDescriptor(descriptor, 'value') !== undefined && adr36RecordDescriptor(descriptor, 'get') === undefined && adr36RecordDescriptor(descriptor, 'set') === undefined);
      adr36RecordDefine(result, key, { value: visit(descriptor.value, depth + 1), enumerable: true, writable: true, configurable: true });
    }
    return result;
  };
  return visit(value, 0);
}
function adr36RecordDeepFreeze(value) {
  if (value !== null && typeof value === 'object') {
    const keys = adr36RecordOwnKeys(value);
    for (let i = 0; i < keys.length; i += 1) {
      const descriptor = adr36RecordDescriptor(value, keys[i]);
      if (descriptor !== undefined && adr36RecordDescriptor(descriptor, 'value') !== undefined) adr36RecordDeepFreeze(descriptor.value);
    }
    adr36RecordFreeze(value);
  }
  return value;
}
function adr36RecordCheckEnum(value, choices) { adr36RecordAssert(adr36RecordEnum(value, choices)); }

function deriveBrowserSyncTransportRuntimeDiagnosticRecordGate(input) {
  try {
  adr36RecordAssert(arguments.length === 1);
  const value = adr36RecordFrozenTree(input);
  adr36RecordKeys(value, ['hardViolation', 'proofIncomplete']);
  adr36RecordAssert(typeof value.hardViolation === 'boolean' && typeof value.proofIncomplete === 'boolean');
  if (value.hardViolation) return 'FAIL';
  if (value.proofIncomplete) return 'UNPROVEN';
  return 'PASS';
  } catch { adr36RecordFailure(); }
}
function deriveBrowserSyncTransportRuntimeDiagnosticRecordFinding(input) {
  try {
  adr36RecordAssert(arguments.length === 1);
  const value = adr36RecordFrozenTree(input);
  adr36RecordKeys(value, ['candidateObserverGate', 'replayResult', 'stimulusCount', 'requestSequence', 'settlementOutcome', 'settlementStaticProfileResult']);
  adr36RecordCheckEnum(value.candidateObserverGate, ['FAIL', 'UNPROVEN', 'PASS']);
  adr36RecordCheckEnum(value.replayResult, ['EQUIVALENT', 'DIVERGED', 'UNPROVEN']);
  adr36RecordCheckEnum(value.stimulusCount, ['zero', 'one', 'multiple', 'unknown']);
  adr36RecordCheckEnum(value.requestSequence, ['OPTIONS-204-POST-200-loadingFinished', 'other', 'incomplete', 'ambiguous']);
  adr36RecordCheckEnum(value.settlementOutcome, ['fulfilled', 'static-redacted-rejection', 'other-rejection', 'unknown']);
  adr36RecordCheckEnum(value.settlementStaticProfileResult, ['match', 'mismatch', 'unproven', 'not-applicable']);
  if (value.candidateObserverGate === 'FAIL') return 'observer-invalid';
  if (value.candidateObserverGate === 'UNPROVEN' || value.replayResult !== 'EQUIVALENT' || value.stimulusCount !== 'one') return 'inconclusive';
  if (value.requestSequence === 'other') return 'network-signature-diverged';
  if (value.requestSequence !== 'OPTIONS-204-POST-200-loadingFinished') return 'inconclusive';
  if (value.settlementOutcome === 'static-redacted-rejection' && value.settlementStaticProfileResult === 'match') return 'static-rejection-reproduced-after-http200';
  if (value.settlementOutcome === 'fulfilled' && value.settlementStaticProfileResult === 'not-applicable') return 'original-failure-not-reproduced';
  return 'inconclusive';
  } catch { adr36RecordFailure(); }
}

const adr36RecordReplayDefinitions = adr36RecordDeepFreeze([
  ['artifact.transport.src/transports/browserSyncTransport.js.sha256', 'historical-commit-artifact-sha256', '3c41b17e1d80e94e4b05e7c76f019d3fd3af281b451e85c8f90d80fd25391c28', 'H64'],
  ['artifact.contract.src/contracts/syncContract.js.sha256', 'historical-commit-artifact-sha256', '96ad2c52fb4545d6e587d9b3fd86d76a4a735e8cb33e9b572a3d7d5f4e5a6aeb', 'H64'],
  ['artifact.gateway.server/startLocalSyncGateway.js.sha256', 'historical-commit-artifact-sha256', '677be5e9cace926ba0a1f3540e39926f5b5c54dd57440bd1ac53de6f255ca6d5', 'H64'],
  ['artifact.gateway.server/localSyncGatewayRuntimeConfig.js.sha256', 'historical-commit-artifact-sha256', 'e9a4419666e33b57d1ed5712e00f3d954a5b82c1cc7956b9a7582e0462743836', 'H64'],
  ['artifact.gateway.server/localSyncGatewayHttpServer.js.sha256', 'historical-commit-artifact-sha256', '70243e66f85448c23920ea30409a03be7ed349b6868535729f4a798f012fdbb8', 'H64'],
  ['artifact.gateway.src/gateways/syncGatewayRequestBoundary.js.sha256', 'historical-commit-artifact-sha256', 'b1e55f03283bfdd1d35562951503471b4a812ac61868af0b927a05623e597b79', 'H64'],
  ['artifact.gateway.src/agents/syncAgent.js.sha256', 'historical-commit-artifact-sha256', '899e06d3a80925cab8680749d133e9a8d87f30a2fd1d509cf7339eb1c8d65db0', 'H64'],
  ['artifact.frontend.runtime-source-set.sha256', 'historical-commit-artifact-sha256', '6f3d5740b043308b4d38df33b6293c9064d8dd1b3f0c5801d50844336c195591', 'H64'],
  ['repository.state', 'historical-record-value', 'clean', 'STATE'],
  ['hostRuntime.executionClass', 'historical-record-value', 'local-disposable', 'A64'],
  ['operatingSystem.family', 'historical-record-value', 'windows', 'A32'],
  ['operatingSystem.edition', 'historical-record-value', 'Windows 11 Home', 'A64'],
  ['operatingSystem.architecture', 'historical-record-value', 'x64', 'A16'],
  ['operatingSystem.version', 'historical-record-value', '25H2', 'A64'],
  ['operatingSystem.build', 'historical-record-value', '26200', 'A32'],
  ['operatingSystem.patch', 'historical-record-value', '9168', 'A32'],
  ['node.version', 'historical-record-value', '24.19.0', 'S32'],
  ['browser.product', 'historical-record-value', 'chrome', 'A32'],
  ['browser.channel', 'historical-record-value', 'stable', 'A32'],
  ['browser.version', 'historical-record-value', '151.0.7922.174', 'A64'],
  ['browser.engine', 'historical-record-value', 'blink', 'A32'],
  ['browser.engineBuild', 'historical-record-value', '@39c51c70dd5feca6b6aba5bb7997b595011c553d', 'A128'],
  ['browser.executionMode', 'historical-record-value', 'visible', 'A32'],
  ['browser.privateMode', 'historical-record-value', true, 'B'],
  ['profile.lifecycle', 'historical-record-value', 'fresh-disposable', 'A64'],
  ['profile.extensions', 'historical-record-value', 'none', 'A64'],
  ['profile.startParameters', 'historical-record-value', 'effective-non-bypassing', 'A128'],
  ['profile.featureFlags', 'historical-record-value', 'none-effective', 'A128'],
  ['profile.enterprisePolicies', 'historical-record-value', 'none-effective', 'A128'],
  ['networkEnvironment.proxy', 'historical-record-value', 'inactive', 'A32'],
  ['networkEnvironment.vpn', 'historical-record-value', 'inactive', 'A32'],
  ['initialState.serviceWorker', 'historical-record-value', 'absent', 'A64'],
  ['initialState.permission', 'historical-record-value', 'prompt', 'A64'],
  ['initialState.preflightCache', 'historical-record-value', 'empty-confirmed', 'A64'],
  ['initialState.siteCache', 'historical-record-value', 'empty-confirmed', 'A64'],
  ['bindingComparisonProfile', 'historical-record-value', 'ephemeral-exact-effective-context-comparison-without-retention', 'A128'],
  ['frontend.topLevelUrl', 'historical-record-value', 'http://127.0.0.1:5173/', 'A2048'],
  ['frontend.serializedOrigin', 'historical-record-value', 'http://127.0.0.1:5173', 'A2048'],
  ['frontend.contextKind', 'historical-record-value', 'top-level', 'A32'],
  ['frontend.isSecureContext', 'historical-record-value', true, 'B'],
  ['transportRequest.factoryProfile', 'historical-record-value', 'real-default-factory', 'A64'],
  ['transportRequest.compositionProfile', 'historical-record-value', 'transport-only', 'A64'],
  ['transportRequest.requestProfile', 'historical-record-value', 'synthetic-v1-syncTest-empty-payload', 'A128'],
  ['transportRequest.requestEqualityMethod', 'historical-record-value', 'ephemeral-full-value-comparison-without-retention', 'A128'],
  ['transportRequest.initialUrl', 'historical-record-value', 'http://127.0.0.1:8787/api/sync-test', 'A2048'],
  ['transportRequest.initialScheme', 'historical-record-value', 'http', 'A16'],
  ['transportRequest.initialHost', 'historical-record-value', '127.0.0.1', 'A256'],
  ['transportRequest.initialPort', 'historical-record-value', 8787, 'P'],
  ['transportRequest.initialPath', 'historical-record-value', '/api/sync-test', 'A1024'],
  ['transportRequest.requestInitProfile', 'historical-record-value', 'adr-0028-fixed', 'A64'],
  ['gateway.listenerHost', 'historical-record-value', '127.0.0.1', 'A256'],
  ['gateway.listenerPort', 'historical-record-value', 8787, 'P'],
  ['gateway.portEnvironmentValue', 'historical-record-value', '"8787"', 'A16'],
  ['gateway.allowedOrigin.value', 'historical-record-value', 'http://127.0.0.1:5173', 'A2048'],
  ['gateway.allowedOrigin.relationToFrontend', 'historical-record-value', 'matches-frontend-origin', 'A64'],
  ['gateway.endpoint', 'historical-record-value', 'http://127.0.0.1:8787/api/sync-test', 'A2048'],
  ['gateway.responderProfile', 'historical-record-value', 'production-gateway', 'A64'],
  ['gateway.responseProfile', 'historical-record-closed-derivation', 'adr-0020-options204-post200-syncresponse-v1', 'A128'],
  ['toolchain.vite.lockfileVersion', 'historical-commit-closed-derivation', '8.1.4', 'S32'],
])

function adr36RecordValidateProjectionShape(f, record = false) {
  adr36RecordKeys(f, record ? adr36RecordRootKeys : adr36RecordProjectionKeys);
  adr36RecordAssert(f.schemaVersion === 1 && f.causeStatus === 'CAUSE_NOT_PROVEN');
  adr36RecordAssert(record ? f.recordType === 'browser-transport-diagnostic' : f.projectionType === 'browser-transport-diagnostic-foundation-projection');
  adr36RecordCheckEnum(record ? f.observerGate : f.candidateObserverGate, ['FAIL', 'UNPROVEN', 'PASS']);
  adr36RecordCheckEnum(record ? f.finding : f.candidateFinding, ['static-rejection-reproduced-after-http200', 'original-failure-not-reproduced', 'network-signature-diverged', 'observer-invalid', 'inconclusive']);
  for (const key of ['diagnosticRunId', 'observedAt', 'timeZone']) adr36RecordAssert(typeof f[key] === 'string' && f[key].length > 0);
  adr36RecordAssert(adr36RecordPattern(f.diagnosticRunId, /^[a-z0-9-]{1,32}$/) && adr36RecordPattern(f.observedAt, /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/) && f.timeZone.length <= 64 && (f.timeZone === 'UTC' || adr36RecordPattern(f.timeZone, /^[A-Za-z][A-Za-z0-9._+-]*(\/[A-Za-z][A-Za-z0-9._+-]*)+$/)));
  try { adr36RecordAssert(adr36RecordApply(adr36RecordDateToISOString, new Adr36RecordDate(f.observedAt), []) === f.observedAt); } catch { adr36RecordFailure(); }
  adr36RecordKeys(f.historicalEvidence, ['recordPath', 'recordSha256', 'measurementRunId', 'baseContextId', 'overallGate']);
  adr36RecordAssert(f.historicalEvidence.recordPath === 'docs/evidence/browser-runtime-evidence.chrome-stable-windows-01.json' && f.historicalEvidence.recordSha256 === adr36RecordHistoricalHash && f.historicalEvidence.measurementRunId === 'chrome-stable-win-01' && f.historicalEvidence.baseContextId === 'chrome-stable-win-t0-01' && f.historicalEvidence.overallGate === 'FAIL');
  adr36RecordKeys(f.adr0029OverallGate, ['before', 'after', 'unchanged']);
  adr36RecordAssert(f.adr0029OverallGate.before === 'FAIL' && f.adr0029OverallGate.after === 'FAIL' && f.adr0029OverallGate.unchanged === true);
  adr36RecordKeys(f.replay, ['replayContextId', 'repositoryCommit', 'repositoryState', 'profileInstanceBinding', 'causalContext', 'equivalence']);
  adr36RecordAssert(adr36RecordPattern(f.replay.replayContextId, /^[a-z0-9-]{1,32}$/) && f.replay.replayContextId !== 'chrome-stable-win-t0-01' && adr36RecordPattern(f.replay.repositoryCommit, /^[a-f0-9]{40}$/));
  adr36RecordAssert(f.replay.repositoryState === null || adr36RecordEnum(f.replay.repositoryState, ['clean', 'dirty', 'unknown']));
  adr36RecordKeys(f.replay.profileInstanceBinding, ['lifecycle', 'newInstanceConfirmed', 'historicalInstanceReused']);
  adr36RecordCheckEnum(f.replay.profileInstanceBinding.lifecycle, ['fresh-disposable-new-instance-confirmed', 'reused', 'unknown']);
  adr36RecordAssert(typeof f.replay.profileInstanceBinding.newInstanceConfirmed === 'boolean' && typeof f.replay.profileInstanceBinding.historicalInstanceReused === 'boolean' && !(f.replay.profileInstanceBinding.newInstanceConfirmed && f.replay.profileInstanceBinding.historicalInstanceReused));
  const pb = f.replay.profileInstanceBinding;
  adr36RecordAssert(pb.lifecycle === 'unknown' ? !pb.newInstanceConfirmed && !pb.historicalInstanceReused : pb.lifecycle === 'reused' ? !pb.newInstanceConfirmed && pb.historicalInstanceReused : pb.newInstanceConfirmed && !pb.historicalInstanceReused);
  const context = f.replay.causalContext;
  adr36RecordKeys(context, ['hostRuntime', 'operatingSystem', 'node', 'browser', 'profile', 'networkEnvironment', 'initialState', 'bindingComparisonProfile', 'frontend', 'transportRequest', 'gateway', 'toolchain']);
  adr36RecordKeys(context.hostRuntime, ['executionClass']);
  adr36RecordKeys(context.operatingSystem, ['family', 'edition', 'architecture', 'version', 'build', 'patch']);
  adr36RecordKeys(context.node, ['version']);
  adr36RecordKeys(context.browser, ['product', 'channel', 'version', 'engine', 'engineBuild', 'executionMode', 'privateMode']);
  adr36RecordKeys(context.profile, ['lifecycle', 'extensions', 'startParameters', 'featureFlags', 'enterprisePolicies']);
  adr36RecordKeys(context.networkEnvironment, ['proxy', 'vpn']);
  adr36RecordKeys(context.initialState, ['serviceWorker', 'permission', 'preflightCache', 'siteCache']);
  adr36RecordKeys(context.frontend, ['topLevelUrl', 'serializedOrigin', 'contextKind', 'isSecureContext']);
  adr36RecordKeys(context.transportRequest, ['factoryProfile', 'compositionProfile', 'requestProfile', 'requestEqualityMethod', 'initialUrl', 'initialScheme', 'initialHost', 'initialPort', 'initialPath', 'requestInitProfile']);
  adr36RecordKeys(context.gateway, ['listenerHost', 'listenerPort', 'portEnvironmentValue', 'allowedOrigin', 'endpoint', 'responderProfile', 'responseProfile']);
  adr36RecordKeys(context.gateway.allowedOrigin, ['value', 'relationToFrontend']);
  adr36RecordKeys(context.toolchain, ['vite']);
  adr36RecordKeys(context.toolchain.vite, ['lockfileVersion', 'runtimeVersion']);
  const equivalence = f.replay.equivalence;
  adr36RecordKeys(equivalence, ['relationId', 'comparisons', 'noUnexplainedCausalDeviation', 'result']);
  adr36RecordAssert(equivalence.relationId === 'adr-0032-causal-replay-v2' && adr36RecordIsArray(equivalence.comparisons) && equivalence.comparisons.length === 59);
  adr36RecordCheckEnum(equivalence.noUnexplainedCausalDeviation, ['confirmed', 'contradicted', 'unproven']);
  adr36RecordCheckEnum(equivalence.result, ['EQUIVALENT', 'DIVERGED', 'UNPROVEN']);
  const fields = [];
  for (let i = 0; i < equivalence.comparisons.length; i += 1) {
    const row = equivalence.comparisons[i];
    adr36RecordKeys(row, ['fieldId', 'comparisonBasis', 'observationState', 'historicalValue', 'replayValue', 'result']);
    const definition = adr36RecordReplayDefinitions[i];
    adr36RecordAssert(row.fieldId === definition[0] && row.comparisonBasis === definition[1] && row.historicalValue === definition[2]);
    for (let j = 0; j < fields.length; j += 1) adr36RecordAssert(fields[j] !== row.fieldId);
    fields[fields.length] = row.fieldId;
    adr36RecordCheckEnum(row.comparisonBasis, ['historical-record-value', 'historical-record-closed-derivation', 'historical-commit-artifact-sha256', 'historical-commit-closed-derivation']);
    adr36RecordCheckEnum(row.observationState, ['observed', 'not-observed', 'ambiguous']);
    adr36RecordCheckEnum(row.result, ['match', 'mismatch', 'unproven']);
    if (row.observationState !== 'observed') adr36RecordAssert(row.replayValue === null && row.result === 'unproven');
    else adr36RecordAssert(row.replayValue !== null && adr36RecordScalar(row.replayValue, definition[3]) && row.result === (row.replayValue === row.historicalValue ? 'match' : 'mismatch'));
    if (i === 8) adr36RecordAssert(f.replay.repositoryState === row.replayValue);
    if (i >= 9) {
      const path = adr36RecordApply(adr36RecordStringSplit, definition[0], ['.']);
      let leaf = context;
      for (let j = 0; j < path.length; j += 1) leaf = leaf[path[j]];
      adr36RecordAssert(leaf === row.replayValue);
    }
  }
  const comparisons = equivalence.comparisons;
  const replayValue = index => comparisons[index].replayValue;
  const invariant = (indices, predicate) => { for (let i = 0; i < indices.length; i += 1) if (comparisons[indices[i]].observationState !== 'observed') return 'unproven'; return predicate() ? 'match' : 'mismatch'; };
  const invariants = [
    invariant([36, 37], () => replayValue(36) === replayValue(37) + '/'),
    invariant([44, 45, 46, 47, 48], () => replayValue(44) === replayValue(45) + '://' + replayValue(46) + ':' + replayValue(47) + replayValue(48)),
    invariant([45, 46, 47, 48, 50, 51, 52, 55], () => replayValue(46) === '127.0.0.1' && replayValue(50) === '127.0.0.1' && replayValue(47) === replayValue(51) && replayValue(52) === '"' + replayValue(51) + '"' && replayValue(55) === replayValue(45) + '://' + replayValue(50) + ':' + replayValue(51) + replayValue(48)),
    invariant([37, 53, 54], () => replayValue(54) === 'matches-frontend-origin' && replayValue(53) === replayValue(37)),
    invariant([44, 55], () => replayValue(44) === replayValue(55)),
    comparisons[58].observationState === 'observed' && context.toolchain.vite.runtimeVersion !== null ? replayValue(58) === context.toolchain.vite.runtimeVersion ? 'match' : 'mismatch' : 'unproven',
    comparisons[24].observationState === 'observed' ? replayValue(24) === 'fresh-disposable' && pb.newInstanceConfirmed ? 'match' : pb.lifecycle !== 'unknown' ? 'mismatch' : 'unproven' : 'unproven',
  ];
  adr36RecordAssert(context.toolchain.vite.runtimeVersion === null || adr36RecordScalar(context.toolchain.vite.runtimeVersion, 'S32'));
  let mismatch = equivalence.noUnexplainedCausalDeviation === 'contradicted', unknown = equivalence.noUnexplainedCausalDeviation === 'unproven';
  for (let i = 0; i < comparisons.length; i += 1) { mismatch = mismatch || comparisons[i].result === 'mismatch'; unknown = unknown || comparisons[i].result === 'unproven'; }
  for (let i = 0; i < invariants.length; i += 1) { mismatch = mismatch || invariants[i] === 'mismatch'; unknown = unknown || invariants[i] === 'unproven'; }
  adr36RecordAssert(equivalence.result === (mismatch ? 'DIVERGED' : unknown ? 'UNPROVEN' : 'EQUIVALENT'));
  const observer = f.observer;
  adr36RecordKeys(observer, ['deltaProfile', 'controllerExclusivity', 'connectionProfile', 'targetProfile', 'foundationSha256', 'evaluationSha256', 'controllerEvaluateIntentCount', 'protocolOperations', 'mainWorldEvaluationCount', 'transportFactoryCallCount', 'primitiveProjectionProfile', 'integrityChecks', 'interferenceObservation']);
  adr36RecordAssert(observer.deltaProfile === 'adr-0030-passive-external-observer-v1' && observer.primitiveProjectionProfile === 'immediate-closed-by-value-pretransport-context-and-settlement-v2-no-handle');
  adr36RecordCheckEnum(observer.controllerExclusivity, ['exclusive', 'not-exclusive', 'unknown']);
  adr36RecordCheckEnum(observer.connectionProfile, ['remote-debugging-pipe', 'other-prohibited', 'unknown']);
  adr36RecordCheckEnum(observer.targetProfile, ['single-goldendawn-top-level', 'other', 'unknown']);
  adr36RecordAssert(observer.foundationSha256 === null || adr36RecordHash(observer.foundationSha256));
  adr36RecordAssert(observer.evaluationSha256 === null || observer.evaluationSha256 === adr36RecordEvaluationHash);
  if (!record) adr36RecordAssert(observer.foundationSha256 === null);
  adr36RecordCheckEnum(observer.controllerEvaluateIntentCount, ['zero', 'one']);
  for (const key of ['mainWorldEvaluationCount', 'transportFactoryCallCount']) adr36RecordCheckEnum(observer[key], ['zero', 'one', 'multiple', 'unknown']);
  adr36RecordAssert(adr36RecordIsArray(observer.protocolOperations) && observer.protocolOperations.length === 6);
  for (let i = 0; i < 6; i += 1) {
    const operation = observer.protocolOperations[i];
    adr36RecordKeys(operation, ['command', 'allowedMaximum', 'observedCountClass', 'result']);
    adr36RecordAssert(operation.command === adr36RecordCommands[i] && operation.allowedMaximum === 1);
    adr36RecordCheckEnum(operation.observedCountClass, ['zero', 'one', 'multiple', 'unknown']);
    adr36RecordCheckEnum(operation.result, ['match', 'mismatch', 'unproven']);
    if (!record && operation.observedCountClass === 'one') adr36RecordAssert(operation.result === 'match');
    if (operation.observedCountClass === 'multiple') adr36RecordAssert(operation.result === 'mismatch');
    if (!record && operation.observedCountClass === 'unknown') adr36RecordAssert(operation.result === 'unproven');
  }
  adr36RecordValidateChecks(observer.integrityChecks, adr36RecordIntegrityIds, ['confirmed', 'violated', 'unproven']);
  adr36RecordCheckEnum(observer.interferenceObservation, ['contract-visible-detected', 'none-contract-visible-detected', 'unknown']);
  let integrityViolation = false, integrityMissing = false;
  for (let i = 0; i < 17; i += 1) {
    const result = observer.integrityChecks[i].result;
    integrityViolation = integrityViolation || result === 'violated'; integrityMissing = integrityMissing || result === 'unproven';
    if (!record) {
      if (i === 3) adr36RecordAssert(result === 'confirmed');
      else if (i === 14 || i === 15) adr36RecordAssert(adr36RecordEnum(result, ['confirmed', 'violated', 'unproven']));
      else if (i === 16) adr36RecordAssert(result === 'violated' || result === 'unproven');
      else adr36RecordAssert(result === 'unproven');
    }
  }
  adr36RecordAssert(observer.interferenceObservation === (integrityViolation ? 'contract-visible-detected' : integrityMissing ? 'unknown' : 'none-contract-visible-detected'));
  if (!record) {
    adr36RecordAssert(f.candidateObserverGate !== 'PASS' && f.candidateFinding === (f.candidateObserverGate === 'FAIL' ? 'observer-invalid' : 'inconclusive'));
    if (integrityViolation) adr36RecordAssert(f.candidateObserverGate === 'FAIL');
    adr36RecordAssert(observer.controllerExclusivity === 'unknown' && observer.connectionProfile === 'unknown');
    const evaluation = observer.protocolOperations[3];
    adr36RecordAssert(observer.evaluationSha256 === (evaluation.observedCountClass === 'one' && evaluation.result === 'match' ? adr36RecordEvaluationHash : null));
    adr36RecordAssert(observer.controllerEvaluateIntentCount === 'zero' ? evaluation.observedCountClass === 'zero' && evaluation.result === 'match' : evaluation.observedCountClass !== 'zero');
  }
  adr36RecordValidateBudget(f.requestBudget);
  if (f.publicSettlement !== null) {
    adr36RecordKeys(f.publicSettlement, ['observationState', 'outcome', 'staticProfileResult', 'deadlineRelation', 'internalStage', 'internalOwner']);
    adr36RecordCheckEnum(f.publicSettlement.observationState, ['observed', 'not-observed', 'ambiguous']);
    adr36RecordCheckEnum(f.publicSettlement.outcome, ['fulfilled', 'static-redacted-rejection', 'other-rejection', 'unknown']);
    adr36RecordCheckEnum(f.publicSettlement.staticProfileResult, ['match', 'mismatch', 'unproven', 'not-applicable']);
    adr36RecordCheckEnum(f.publicSettlement.deadlineRelation, ['deadline-compatible', 'no-causal-classification', 'unknown']);
    adr36RecordAssert(f.publicSettlement.internalStage === 'unknown' && f.publicSettlement.internalOwner === 'unknown');
    const settlement = f.publicSettlement;
    if (settlement.observationState !== 'observed') adr36RecordAssert(settlement.outcome === 'unknown' && settlement.staticProfileResult === 'unproven' && settlement.deadlineRelation === 'unknown');
    else adr36RecordAssert(settlement.outcome === 'fulfilled' ? settlement.staticProfileResult === 'not-applicable' : settlement.outcome === 'static-redacted-rejection' ? settlement.staticProfileResult === 'match' : settlement.outcome === 'other-rejection' && settlement.staticProfileResult === 'mismatch');
  }
  const stageNames = ['observer-armed', 'transport-call-dispatched', 'preflight-request-observed', 'preflight-204-observed', 'post-request-observed', 'post-response-200-observed', null, 'public-promise-settled', 'cleanup-started', 'cleanup-completed'];
  const orders = { controller: [], 'javascript-main-world': [], 'browser-network': [], cleanup: [] };
  adr36RecordAssert(adr36RecordIsArray(f.stages) && f.stages.length === 10);
  for (let i = 0; i < 10; i += 1) {
    const stage = f.stages[i];
    adr36RecordKeys(stage, ['stageId', 'layer', 'observationState', 'receiptOrder', 'result', 'clockDomain', 'relativeMilliseconds', 'timingState']);
    adr36RecordAssert(i === 6 ? adr36RecordEnum(stage.stageId, ['post-loading-finished', 'post-loading-failed', 'post-loading-terminal']) : stage.stageId === stageNames[i]);
    const layer = i === 0 ? 'controller' : i === 1 || i === 7 ? 'javascript-main-world' : i >= 8 ? 'cleanup' : 'browser-network';
    adr36RecordAssert(stage.layer === layer && stage.clockDomain === (layer === 'cleanup' || layer === 'controller' ? 'controller-monotonic' : layer));
    adr36RecordCheckEnum(stage.observationState, ['observed', 'not-observed', 'ambiguous']);
    adr36RecordCheckEnum(stage.result, ['match', 'mismatch', 'unproven']);
    adr36RecordCheckEnum(stage.timingState, ['measured', 'at-or-above-cap', 'unavailable']);
    if (stage.observationState === 'observed') {
      adr36RecordAssert(adr36RecordSafeCount(stage.receiptOrder) && stage.receiptOrder > 0);
      const layerOrders = orders[layer];
      for (let j = 0; j < layerOrders.length; j += 1) adr36RecordAssert(layerOrders[j] !== stage.receiptOrder);
      layerOrders[layerOrders.length] = stage.receiptOrder;
    }
    else adr36RecordAssert(stage.receiptOrder === null && stage.result === 'unproven' && stage.relativeMilliseconds === null && stage.timingState === 'unavailable');
    if (stage.timingState === 'unavailable') adr36RecordAssert(stage.relativeMilliseconds === null);
    else adr36RecordAssert(adr36RecordSafeCount(stage.relativeMilliseconds) && stage.relativeMilliseconds % 10 === 0 && (stage.timingState === 'at-or-above-cap' ? stage.relativeMilliseconds === 60000 : stage.relativeMilliseconds < 60000));
  }
  // Stage slots are fixed; their per-layer arrival orders are unique and dense.
  for (const layer of ['controller', 'javascript-main-world', 'browser-network', 'cleanup']) {
    const layerOrders = orders[layer];
    for (let i = 0; i < layerOrders.length; i += 1) adr36RecordAssert(layerOrders[i] <= layerOrders.length);
  }
  const timing = f.timing;
  adr36RecordKeys(timing, ['roundingMilliseconds', 'durationCapMilliseconds', 'setupWindowMilliseconds', 'captureWindowMilliseconds', 'clockDomains', 'calibration', 'crossDomainComparison', 'completion']);
  adr36RecordAssert(timing.roundingMilliseconds === 10 && timing.durationCapMilliseconds === 60000 && timing.setupWindowMilliseconds === 6000 && timing.captureWindowMilliseconds === 6000 && timing.calibration === 'none' && timing.crossDomainComparison === 'forbidden');
  adr36RecordAssert(adr36RecordIsArray(timing.clockDomains) && timing.clockDomains.length === 3);
  const domains = [['controller-monotonic', 'controller-monotonic-fixed-v1', 'setup-observation-and-cleanup-only'], ['javascript-main-world', 'window.performance.now', 'transport-dispatch-and-public-settlement-only'], ['browser-network', 'cdp-network-monotonic-time', 'endpoint-network-events-only']];
  for (let i = 0; i < 3; i += 1) { adr36RecordKeys(timing.clockDomains[i], ['clockDomain', 'source', 'comparisonScope']); adr36RecordAssert(timing.clockDomains[i].clockDomain === domains[i][0] && timing.clockDomains[i].source === domains[i][1] && timing.clockDomains[i].comparisonScope === domains[i][2]); }
  const completion = timing.completion;
  adr36RecordKeys(completion, ['productEvidenceComplete', 'observationCloseReason', 'observationClosed', 'captureWindowState', 'evaluateReplyCountClass', 'requestBudgetFinalized', 'cleanupFinalizeReason', 'cleanupFinalized']);
  adr36RecordAssert(typeof completion.productEvidenceComplete === 'boolean' && completion.observationClosed === true && completion.requestBudgetFinalized === true && completion.cleanupFinalized === true);
  adr36RecordCheckEnum(completion.observationCloseReason, ['setup-cap', 'setup-terminal-unproven', 'capture-cap', 'capture-terminal-unproven', 'confirmed-violation']);
  adr36RecordCheckEnum(completion.captureWindowState, ['not-started', 'elapsed', 'truncated']);
  adr36RecordCheckEnum(completion.evaluateReplyCountClass, ['zero', 'one', 'multiple', 'unknown']);
  adr36RecordCheckEnum(completion.cleanupFinalizeReason, ['all-steps-terminal', 'cleanup-cap', 'cleanup-terminal-failure']);
  adr36RecordKeys(f.cleanup, ['observationClosedBeforeCleanup', 'checks', 'result', record ? 'recordMaterializedAfterCleanup' : 'projectionMaterializedAfterCleanup']);
  adr36RecordAssert(f.cleanup.observationClosedBeforeCleanup === true && (record ? f.cleanup.recordMaterializedAfterCleanup : f.cleanup.projectionMaterializedAfterCleanup) === true);
  adr36RecordValidateChecks(f.cleanup.checks, adr36RecordCleanupIds, ['confirmed', 'failed', 'unproven']);
  adr36RecordCheckEnum(f.cleanup.result, ['FAIL', 'UNPROVEN', 'PASS']);
  let cleanupFailed = false, cleanupMissing = false;
  for (let i = 0; i < 20; i += 1) { cleanupFailed = cleanupFailed || f.cleanup.checks[i].result === 'failed'; cleanupMissing = cleanupMissing || f.cleanup.checks[i].result === 'unproven'; }
  adr36RecordAssert(cleanupFailed ? f.cleanup.result === 'FAIL' : f.cleanup.result === 'FAIL' || f.cleanup.result === (cleanupMissing ? 'UNPROVEN' : 'PASS'));
  if (!record && cleanupFailed) adr36RecordAssert(f.candidateObserverGate === 'FAIL');
  return f;
}
function adr36RecordValidateChecks(checks, ids, values) {
  adr36RecordAssert(adr36RecordIsArray(checks) && checks.length === ids.length);
  for (let i = 0; i < ids.length; i += 1) { adr36RecordKeys(checks[i], ['checkId', 'result']); adr36RecordAssert(checks[i].checkId === ids[i]); adr36RecordCheckEnum(checks[i].result, values); }
}
function adr36RecordValidateBudget(budget) {
  const keys = ['defaultTransportCalls', 'retries', 'directDiagnosticFetches', 'negativeOriginRuns', 'redirectRuns', 'observerProductEndpointRequests', 'endpointOptions', 'endpointPosts', 'endpointOtherMethods', 'sequence'];
  adr36RecordKeys(budget, keys);
  for (let i = 0; i < 9; i += 1) adr36RecordCheckEnum(budget[keys[i]], ['zero', 'one', 'multiple', 'unknown']);
  adr36RecordCheckEnum(budget.sequence, ['OPTIONS-204-POST-200-loadingFinished', 'other', 'incomplete', 'ambiguous']);
}
function validateBrowserSyncTransportRuntimeDiagnosticFoundationResult(result) {
  try {
  adr36RecordAssert(arguments.length === 1 && adr36RecordPrototype(result) === null);
  const checked = adr36RecordFrozenTree(result, true);
  adr36RecordKeys(checked, ['ok', 'resultType', 'evidenceStatus', 'runtimeAuthorized', 'persistenceAuthorized', 'recordProjection', 'error']);
  adr36RecordAssert(checked.resultType === 'browser-transport-diagnostic-foundation-run-v1' && checked.evidenceStatus === 'NOT_EVIDENCE' && checked.runtimeAuthorized === false && checked.persistenceAuthorized === false);
  if (checked.ok === false) {
    adr36RecordAssert(checked.recordProjection === null);
    adr36RecordKeys(checked.error, ['code', 'message']);
    adr36RecordAssert(checked.error.code === 'BROWSER_TRANSPORT_DIAGNOSTIC_FOUNDATION_FAILED' && checked.error.message === 'Die Browser-Transport-Diagnosefoundation ist fehlgeschlagen.');
    return null;
  }
  adr36RecordAssert(checked.ok === true && checked.error === null);
  adr36RecordValidateProjectionShape(checked.recordProjection);
  return adr36RecordDescriptor(result, 'recordProjection').value;
  } catch { adr36RecordFailure(); }
}

// A caller-supplied ledger has no membership in either private identity map.
function registerBrowserSyncTransportRuntimeDiagnosticRecordOwner(owner, loadedFactory) {
  adr36RecordAssert(arguments.length === 2 && owner !== null && typeof owner === 'object' && typeof loadedFactory === 'function' && owner.sourceState.factory === loadedFactory);
  adr36RecordAssert(!adr36RecordApply(adr36RecordWeakHas, adr36RecordOwners, [owner]));
  adr36RecordApply(adr36RecordWeakSet, adr36RecordOwners, [owner, { loadedFactory, observation: null, ledger: null, consumed: false }]);
}
function freezeBrowserSyncTransportRuntimeDiagnosticRecordObservation(owner, facts) {
  adr36RecordAssert(arguments.length === 2);
  const binding = adr36RecordApply(adr36RecordWeakGet, adr36RecordOwners, [owner]);
  adr36RecordAssert(binding !== undefined && binding.consumed !== true && binding.loadedFactory === owner.sourceState.factory && binding.observation === null && owner.attemptStarted === true && owner.adapterObservationSnapshot === null);
  // The owner calls this only from its captured, argumentless Foundation marker.
  const snapshot = adr36RecordDeepFreeze(adr36RecordFrozenTree(facts));
  binding.observation = snapshot;
  return snapshot;
}
function bindBrowserSyncTransportRuntimeDiagnosticRecordLedger(owner, ledger) {
  adr36RecordAssert(arguments.length === 2);
  const binding = adr36RecordApply(adr36RecordWeakGet, adr36RecordOwners, [owner]);
  adr36RecordAssert(binding !== undefined && binding.consumed !== true && binding.loadedFactory === owner.sourceState.factory && binding.observation !== null && owner.adapterObservationSnapshot === binding.observation && binding.ledger === null && owner.foundationProjection !== null);
  adr36RecordAssert(owner.phase === 'cleanup' && owner.cleanupLedger.terminal === true);
  adr36RecordValidateLedger(adr36RecordFrozenTree(ledger));
  binding.ledger = ledger;
  adr36RecordApply(adr36RecordWeakSet, adr36RecordFinalBindings, [ledger, { owner, foundationProjection: owner.foundationProjection, observation: binding.observation, consumed: false }]);
}

// Root projects these facts from its actual monotone source/wire/producer ledgers.
// 'null' means missing measurement. A fixture may never supply these records.
function createBrowserSyncTransportRuntimeDiagnosticRecordLedgerTemplate() {
  const wire = [];
  for (let i = 0; i < 6; i += 1) wire[i] = { command: adr36RecordCommands[i], intentCount: 0, acceptedFrameCount: 0, ackCount: 0, profileMatch: true, replyState: 'unobserved', replyCount: 0 };
  const resources = [];
  const names = ['pipe', 'browser', 'vite', 'gateway', 'profile', 'harness', 'environment', 'observer-output'];
  for (let i = 0; i < names.length; i += 1) resources[i] = { name: names[i], creationState: 'never-attempted', boundCount: 0, terminalCount: 0, activeAfterCleanupCount: 0, foreignTouchCount: 0, failureCount: 0 };
  return {
    profile: 'adr-0036-terminal-adapter-ledger-v1',
    sources: { foundationSha256: null, loadedFoundationSha256: null, commitFoundationSha256: null, loadCount: 0, importCount: 0, loadKind: 'none', pathCheckCount: 0, pathRecheckCount: 0, mismatchCount: 0, inventoryExpectedCount: 0, inventoryCompletedCount: 0, extraTransportLoadCount: 0, capabilitySelectionCount: 0, ownerCount: 0, dispatcherCount: 0, extraCapabilityCount: 0, runtimeActionCount: 0, interceptionCount: 0, debuggerOperationCount: 0, profilerTracingOperationCount: 0, retryCount: 0, directFetchCount: 0, negativeOriginRunCount: 0, redirectRunCount: 0 },
    wire,
    parser: { frameCount: 0, decodeCount: 0, scanCount: 0, parseCount: 0, parseFailureCount: 0, duplicateKeyCount: 0, filterCount: 0, reorderCount: 0, bodyReadCount: 0, freeInspectionCount: 0, queueEntries: 0, queuedBytes: 0, dequeuedMaterialBytes: 0, resolverCount: 0, pendingWriteCount: 0, liveCallbackCount: 0, retainedRawCount: 0, retainedIdentifierCount: 0, postObservationCount: 0, violationCount: 0, intakeState: 'open', pipeOpenCount: 0, pipeReadOwnerCount: 0, pipeWriteOwnerCount: 0, inheritedReadDescriptor: null, inheritedWriteDescriptor: null, debugPortArgumentCount: 0, objectGroupCount: 0, remoteObjectHandleCount: 0 },
    resources,
    network: { endpointOptions: null, endpointPosts: null, endpointOtherMethods: null, unattributedCount: 0, observerRequestCount: 0, additionalFetchCount: 0, sequence: 'incomplete', targetBindingCount: 0, sessionBindingCount: 0, targetContradictionCount: 0, evaluateCorrelationContradictionCount: 0, captureState: 'not-started', acceptedEvaluationSha256: null, acceptedEvaluationBytes: 0 },
    output: { writeCount: 0, rawWriteCount: 0, diagnosticWriteCount: 0, childStreamCount: 0, terminalChildStreamCount: 0, inventoryExpectedCount: 0, inventoryCompletedCount: 0, residueCount: 0, repositoryBaselineSha256: null, repositoryFinalSha256: null, repositoryIdentityDifferenceCount: 0, historicalBaselineSha256: null, historicalFinalSha256: null, historicalIdentityDifferenceCount: 0, passivePortsSourceState: 'unavailable', listener5173Count: null, listener8787Count: null, environmentDifferenceCount: 0 },
    completion: { markerCount: 0, markerSequence: null, firstCleanupSequence: null, cleanupGeneration: 0, violationCount: 0, reason: 'cleanup-terminal-failure', capArmCount: 0, capCancelCount: 0, capCancelAckCount: 0, completionClockCount: 0, cleanupOrigin: null, completionClock: null, terminalState: 'pending' },
  };
}
function adr36RecordValidateLedger(ledger) {
  const template = createBrowserSyncTransportRuntimeDiagnosticRecordLedgerTemplate();
  adr36RecordKeys(ledger, adr36RecordOwnKeys(template));
  adr36RecordAssert(ledger.profile === template.profile);
  for (const key of ['sources', 'parser', 'network', 'output', 'completion']) adr36RecordKeys(ledger[key], adr36RecordOwnKeys(template[key]));
  for (const group of ['sources', 'parser', 'output', 'completion']) {
    const keys = adr36RecordOwnKeys(ledger[group]);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      if (typeof template[group][key] === 'number') adr36RecordAssert(adr36RecordSafeCount(ledger[group][key]));
      if (adr36RecordApply(adr36RecordStringEndsWith, key, ['Sha256'])) adr36RecordAssert(ledger[group][key] === null || adr36RecordHash(ledger[group][key]));
    }
  }
  adr36RecordCheckEnum(ledger.sources.loadKind, ['none', 'byte-owned-vm-source-text-module']);
  adr36RecordCheckEnum(ledger.parser.intakeState, ['open', 'closed']);
  adr36RecordAssert(ledger.parser.inheritedReadDescriptor === null || ledger.parser.inheritedReadDescriptor === 4);
  adr36RecordAssert(ledger.parser.inheritedWriteDescriptor === null || ledger.parser.inheritedWriteDescriptor === 3);
  adr36RecordCheckEnum(ledger.output.passivePortsSourceState, ['unavailable', 'bound-before-cleanup']);
  for (const key of ['listener5173Count', 'listener8787Count']) adr36RecordAssert(ledger.output[key] === null || adr36RecordSafeCount(ledger.output[key]));
  adr36RecordCheckEnum(ledger.completion.reason, ['all-steps-terminal', 'cleanup-cap', 'cleanup-terminal-failure']);
  adr36RecordCheckEnum(ledger.completion.terminalState, ['pending', 'terminal']);
  for (const key of ['markerSequence', 'firstCleanupSequence']) adr36RecordAssert(ledger.completion[key] === null || adr36RecordSafeCount(ledger.completion[key]));
  for (const key of ['cleanupOrigin', 'completionClock']) adr36RecordAssert(ledger.completion[key] === null || adr36RecordFinite(ledger.completion[key]));
  adr36RecordAssert(adr36RecordIsArray(ledger.wire) && ledger.wire.length === 6);
  for (let i = 0; i < 6; i += 1) {
    const row = ledger.wire[i];
    adr36RecordKeys(row, adr36RecordOwnKeys(template.wire[i]));
    adr36RecordAssert(row.command === adr36RecordCommands[i] && typeof row.profileMatch === 'boolean');
    for (const key of ['intentCount', 'acceptedFrameCount', 'ackCount', 'replyCount']) adr36RecordAssert(adr36RecordSafeCount(row[key]));
    adr36RecordCheckEnum(row.replyState, ['unobserved', 'correlated', 'exact', 'error', 'malformed', 'ambiguous']);
  }
  adr36RecordAssert(adr36RecordIsArray(ledger.resources) && ledger.resources.length === 8);
  for (let i = 0; i < 8; i += 1) {
    const row = ledger.resources[i];
    adr36RecordKeys(row, adr36RecordOwnKeys(template.resources[i]));
    adr36RecordAssert(row.name === template.resources[i].name);
    adr36RecordCheckEnum(row.creationState, ['never-attempted', 'may-exist', 'bound']);
    for (const key of ['boundCount', 'terminalCount', 'activeAfterCleanupCount', 'foreignTouchCount', 'failureCount']) adr36RecordAssert(adr36RecordSafeCount(row[key]));
    adr36RecordAssert(row.terminalCount <= row.boundCount);
    if (row.creationState === 'never-attempted') adr36RecordAssert(row.boundCount === 0 && row.terminalCount === 0 && row.activeAfterCleanupCount === 0);
    if (row.creationState === 'bound') adr36RecordAssert(row.boundCount > 0);
  }
  const n = ledger.network;
  for (const key of ['endpointOptions', 'endpointPosts', 'endpointOtherMethods']) adr36RecordAssert(n[key] === null || adr36RecordSafeCount(n[key]));
  for (const key of ['unattributedCount', 'observerRequestCount', 'additionalFetchCount', 'targetBindingCount', 'sessionBindingCount', 'targetContradictionCount', 'evaluateCorrelationContradictionCount', 'acceptedEvaluationBytes']) adr36RecordAssert(adr36RecordSafeCount(n[key]));
  adr36RecordCheckEnum(n.sequence, ['OPTIONS-204-POST-200-loadingFinished', 'other', 'incomplete', 'ambiguous']);
  adr36RecordCheckEnum(n.captureState, ['not-started', 'elapsed', 'truncated']);
  adr36RecordAssert(n.acceptedEvaluationSha256 === null || adr36RecordHash(n.acceptedEvaluationSha256));
  return ledger;
}

function adr36RecordCountClass(count) { return count === null ? 'unknown' : count === 0 ? 'zero' : count === 1 ? 'one' : 'multiple'; }
function adr36RecordInventoryComplete(expected, completed) { return expected > 0 && completed === expected; }
function adr36RecordResourceResult(resource, terminalPositive) {
  if (resource.activeAfterCleanupCount > 0 || resource.foreignTouchCount > 0 || resource.failureCount > 0) return 'failed';
  if (resource.creationState === 'never-attempted') return 'confirmed';
  if (terminalPositive && resource.creationState === 'bound' && resource.terminalCount === resource.boundCount) return 'confirmed';
  return 'unproven';
}

function finalizeBrowserSyncTransportRuntimeDiagnosticRecord(input) {
  try {
  adr36RecordAssert(arguments.length === 1);
  // Validate the input wrapper once without cloning away the identity binding.
  adr36RecordAssert(input !== null && typeof input === 'object' && adr36RecordPrototype(input) === adr36RecordObjectPrototype && adr36RecordIsFrozen(input));
  adr36RecordKeys(input, ['foundationProjection', 'adapterLedger']);
  const fd = adr36RecordDescriptor(input, 'foundationProjection');
  const ad = adr36RecordDescriptor(input, 'adapterLedger');
  for (const descriptor of [fd, ad]) adr36RecordAssert(descriptor !== undefined && descriptor.enumerable === true && descriptor.writable === false && descriptor.configurable === false && adr36RecordDescriptor(descriptor, 'value') !== undefined);
  const originalF = fd.value;
  const originalA = ad.value;
  const f = adr36RecordValidateProjectionShape(adr36RecordFrozenTree(originalF));
  const a = adr36RecordValidateLedger(adr36RecordFrozenTree(originalA));
  const binding = adr36RecordApply(adr36RecordWeakGet, adr36RecordFinalBindings, [originalA]);
  const authentic = binding !== undefined && !binding.consumed && binding.foundationProjection === originalF && binding.owner.adapterObservationSnapshot === binding.observation && binding.owner.cleanupLedger.terminal === true;
  if (binding !== undefined) { adr36RecordAssert(authentic); binding.consumed = true; }
  const s = a.sources, p = a.parser, n = a.network, d = a.output, c = a.completion;
  let hardViolation = f.candidateObserverGate === 'FAIL' || f.cleanup.result === 'FAIL' || c.violationCount > 0 || p.violationCount > 0;
  let proofIncomplete = !authentic || adapterEvidenceEligible !== true || c.terminalState !== 'terminal' || f.replay.equivalence.result !== 'EQUIVALENT';
  const markerValid = authentic && c.markerCount === 1 && c.markerSequence !== null && c.firstCleanupSequence !== null && c.markerSequence < c.firstCleanupSequence && c.cleanupGeneration === 1;
  if (c.markerCount > 1 || (c.markerSequence !== null && c.firstCleanupSequence !== null && c.markerSequence >= c.firstCleanupSequence)) hardViolation = true;
  const sourceKnown = s.foundationSha256 === adr36RecordFoundationHash && s.loadedFoundationSha256 === s.foundationSha256 && s.commitFoundationSha256 === s.foundationSha256 && s.loadCount === 1 && s.importCount === 0 && s.loadKind === 'byte-owned-vm-source-text-module' && s.pathCheckCount > 0 && s.pathRecheckCount >= 3;
  const sourceBad = s.mismatchCount > 0 || s.loadCount > 1 || s.importCount > 0 || (s.foundationSha256 !== null && s.foundationSha256 !== adr36RecordFoundationHash) || (s.loadedFoundationSha256 !== null && s.foundationSha256 !== null && s.loadedFoundationSha256 !== s.foundationSha256) || (s.commitFoundationSha256 !== null && s.foundationSha256 !== null && s.commitFoundationSha256 !== s.foundationSha256);
  const capabilitiesKnown = s.capabilitySelectionCount === 1 && s.ownerCount === 1 && s.dispatcherCount === 1 && s.extraCapabilityCount === 0;
  const capabilitiesBad = s.capabilitySelectionCount > 1 || s.ownerCount > 1 || s.dispatcherCount > 1 || s.extraCapabilityCount > 0;
  const inventoryKnown = adr36RecordInventoryComplete(s.inventoryExpectedCount, s.inventoryCompletedCount) && adr36RecordInventoryComplete(d.inventoryExpectedCount, d.inventoryCompletedCount);
  const parserKnown = p.frameCount === p.decodeCount && p.decodeCount === p.scanCount && p.scanCount === p.parseCount && p.parseFailureCount === 0 && p.duplicateKeyCount === 0;
  const parserBad = p.filterCount > 0 || p.reorderCount > 0 || p.parseCount > p.scanCount || p.scanCount > p.decodeCount || p.decodeCount > p.frameCount || p.duplicateKeyCount > 0 || p.parseFailureCount > 0;
  const pipeKnown = p.pipeOpenCount === 1 && p.pipeReadOwnerCount === 1 && p.pipeWriteOwnerCount === 1 && p.inheritedReadDescriptor === 4 && p.inheritedWriteDescriptor === 3 && p.debugPortArgumentCount === 0;
  const pipeBad = p.pipeOpenCount > 1 || p.pipeReadOwnerCount > 1 || p.pipeWriteOwnerCount > 1 || p.debugPortArgumentCount > 0;
  if (pipeBad) hardViolation = true;
  let wireKnown = true, wireBad = false;
  const operations = [];
  for (let i = 0; i < 6; i += 1) {
    const w = a.wire[i];
    let count = w.intentCount === 0 ? 'zero' : w.acceptedFrameCount === 0 || w.acceptedFrameCount !== w.ackCount ? 'unknown' : adr36RecordCountClass(w.acceptedFrameCount);
    let result = count === 'unknown' ? 'unproven' : count === 'multiple' ? 'mismatch' : 'match';
    if (!w.profileMatch || w.intentCount > 1 || w.acceptedFrameCount > 1 || w.ackCount > 1 || w.ackCount > w.acceptedFrameCount || w.acceptedFrameCount > w.intentCount) { wireBad = true; result = 'mismatch'; }
    if (w.intentCount > 0 && (w.acceptedFrameCount !== w.ackCount || w.acceptedFrameCount === 0)) wireKnown = false;
    // Zero cleanup operations are proven only from their upstream creation latch.
    if (i === 4 && w.intentCount === 0 && a.wire[2].intentCount > 0) result = 'unproven';
    if (i === 5 && w.intentCount === 0 && a.wire[1].intentCount > 0) result = 'unproven';
    const expected = f.observer.protocolOperations[i];
    const countKnown = count !== 'unknown' && expected.observedCountClass !== 'unknown';
    if ((countKnown && count !== expected.observedCountClass) || (result !== 'unproven' && expected.result !== 'unproven' && result !== expected.result)) { wireBad = true; result = 'mismatch'; }
    else if (count === 'unknown' || expected.observedCountClass === 'unknown' || result === 'unproven' || expected.result === 'unproven') { wireKnown = false; result = 'unproven'; }
    operations[i] = { command: w.command, allowedMaximum: 1, observedCountClass: count, result };
  }
  const evalKnown = a.wire[3].acceptedFrameCount === 1 && a.wire[3].ackCount === 1 && n.acceptedEvaluationSha256 === adr36RecordEvaluationHash && n.acceptedEvaluationBytes === 4259;
  const evalBad = (n.acceptedEvaluationSha256 !== null && n.acceptedEvaluationSha256 !== adr36RecordEvaluationHash) || (a.wire[3].acceptedFrameCount > 0 && n.acceptedEvaluationBytes !== 4259);
  const actualEvaluationHash = evalKnown ? adr36RecordEvaluationHash : null;
  if (actualEvaluationHash !== null && f.observer.evaluationSha256 !== null && f.observer.evaluationSha256 !== actualEvaluationHash) wireBad = true;
  if (actualEvaluationHash === null || f.observer.evaluationSha256 === null) wireKnown = false;
  const networkKnown = evalKnown && parserKnown && n.unattributedCount === 0 && n.captureState === 'elapsed' && n.endpointOptions !== null && n.endpointPosts !== null && n.endpointOtherMethods !== null;
  // The Foundation alone classifies CDP/v2 semantics. These actual syntactic
  // sources authenticate its closed classification; this is no second parser.
  const mainWorldKnown = sourceKnown && evalKnown && parserKnown && pipeKnown && a.wire[3].replyCount === 1 && adr36RecordEnum(a.wire[3].replyState, ['correlated', 'exact']) && f.timing.completion.evaluateReplyCountClass === 'one' && f.observer.mainWorldEvaluationCount === 'one';
  const safelyAbsentEvaluation = a.wire[3].intentCount === 0 && a.wire[3].acceptedFrameCount === 0 && a.wire[3].ackCount === 0;
  const stimulus = safelyAbsentEvaluation ? 'zero' : mainWorldKnown && networkKnown ? f.requestBudget.defaultTransportCalls : 'unknown';
  const mainWorldCount = safelyAbsentEvaluation ? 'zero' : a.wire[3].replyCount > 1 ? 'multiple' : mainWorldKnown ? f.observer.mainWorldEvaluationCount : 'unknown';
  const factoryCount = safelyAbsentEvaluation ? 'zero' : mainWorldKnown ? f.observer.transportFactoryCallCount : 'unknown';
  if ((mainWorldCount !== 'unknown' && f.observer.mainWorldEvaluationCount !== 'unknown' && mainWorldCount !== f.observer.mainWorldEvaluationCount) || (factoryCount !== 'unknown' && f.observer.transportFactoryCallCount !== 'unknown' && factoryCount !== f.observer.transportFactoryCallCount) || (a.wire[3].intentCount === 0 ? 'zero' : 'one') !== f.observer.controllerEvaluateIntentCount) wireBad = true;
  const targetKnown = pipeKnown && parserKnown && n.targetBindingCount === 1 && n.sessionBindingCount === 1 && a.wire[1].acceptedFrameCount === 1 && adr36RecordEnum(a.wire[1].replyState, ['correlated', 'exact']) && a.wire[1].replyCount === 1;
  const integrity = [];
  const setIntegrity = (index, bad, known) => { const result = bad ? 'violated' : authentic && known ? 'confirmed' : 'unproven'; integrity[index] = { checkId: adr36RecordIntegrityIds[index], result }; if (bad) hardViolation = true; if (result !== 'confirmed') proofIncomplete = true; };
  setIntegrity(0, sourceBad, sourceKnown);
  setIntegrity(1, s.extraTransportLoadCount > 0, sourceKnown && inventoryKnown);
  setIntegrity(2, sourceBad || capabilitiesBad || wireBad, sourceKnown && capabilitiesKnown && evalKnown && wireKnown);
  setIntegrity(3, wireBad, wireKnown && capabilitiesKnown && pipeKnown);
  setIntegrity(4, s.runtimeActionCount > 1 || evalBad, sourceKnown && evalKnown && s.runtimeActionCount === 1);
  setIntegrity(5, s.interceptionCount > 0 || capabilitiesBad, sourceKnown && capabilitiesKnown && pipeKnown && evalKnown);
  setIntegrity(6, s.debuggerOperationCount > 0, sourceKnown && capabilitiesKnown && wireKnown && pipeKnown);
  setIntegrity(7, s.profilerTracingOperationCount > 0, sourceKnown && capabilitiesKnown && wireKnown && pipeKnown);
  setIntegrity(8, p.bodyReadCount > 0, wireKnown && pipeKnown && parserKnown);
  // Self-loaded adapter bytes are no independent parser attestation root.
  setIntegrity(9, p.freeInspectionCount > 0 || parserBad, false);
  setIntegrity(10, n.additionalFetchCount > 0 || s.directFetchCount > 0, sourceKnown && mainWorldKnown && networkKnown && stimulus === 'one');
  setIntegrity(11, n.observerRequestCount > 0, capabilitiesKnown && networkKnown && stimulus === 'one');
  setIntegrity(12, d.rawWriteCount > 0 || d.residueCount > 0, sourceKnown && capabilitiesKnown && inventoryKnown && d.writeCount === 0);
  // Schema 1 has no independent adapter stdout/stderr owner.
  setIntegrity(13, d.diagnosticWriteCount > 0, false);
  setIntegrity(14, false, true);
  setIntegrity(15, n.targetContradictionCount > 0 || n.sessionBindingCount > 1, targetKnown);
  setIntegrity(16, a.wire[3].replyCount > 1 || n.evaluateCorrelationContradictionCount > 0 || evalBad, mainWorldKnown);
  const budget = {
    defaultTransportCalls: stimulus,
    retries: capabilitiesKnown ? adr36RecordCountClass(s.retryCount) : 'unknown',
    directDiagnosticFetches: capabilitiesKnown ? adr36RecordCountClass(s.directFetchCount) : 'unknown',
    negativeOriginRuns: capabilitiesKnown ? adr36RecordCountClass(s.negativeOriginRunCount) : 'unknown',
    redirectRuns: capabilitiesKnown ? adr36RecordCountClass(s.redirectRunCount) : 'unknown',
    observerProductEndpointRequests: networkKnown ? adr36RecordCountClass(n.observerRequestCount) : 'unknown',
    endpointOptions: networkKnown ? adr36RecordCountClass(n.endpointOptions) : 'unknown',
    endpointPosts: networkKnown ? adr36RecordCountClass(n.endpointPosts) : 'unknown',
    endpointOtherMethods: networkKnown ? adr36RecordCountClass(n.endpointOtherMethods) : 'unknown',
    sequence: n.unattributedCount > 0 ? 'ambiguous' : networkKnown ? n.sequence : 'incomplete',
  };
  if (s.retryCount > 0 || s.directFetchCount > 0 || s.negativeOriginRunCount > 0 || s.redirectRunCount > 0 || n.observerRequestCount > 0 || n.additionalFetchCount > 0 || (n.endpointPosts !== null && n.endpointPosts > 1)) hardViolation = true;
  if (networkKnown && (budget.endpointOptions !== f.requestBudget.endpointOptions || budget.endpointPosts !== f.requestBudget.endpointPosts || budget.endpointOtherMethods !== f.requestBudget.endpointOtherMethods || budget.sequence !== f.requestBudget.sequence)) hardViolation = true;
  for (const key of adr36RecordOwnKeys(budget)) if (budget[key] === 'unknown' || budget[key] === 'incomplete' || budget[key] === 'ambiguous') proofIncomplete = true;
  if (stimulus !== 'one') proofIncomplete = true;
  const checks = [];
  const setCleanup = (index, result) => { checks[index] = { checkId: adr36RecordCleanupIds[index], result: !authentic && result === 'confirmed' ? 'unproven' : result }; if (result === 'failed') hardViolation = true; if (checks[index].result !== 'confirmed') proofIncomplete = true; };
  const protocolClosed = (opening, closing) => opening.intentCount === 0 ? 'confirmed' : closing.replyCount === 1 && closing.replyState === 'exact' && closing.acceptedFrameCount === 1 ? 'confirmed' : closing.replyCount === 1 && (closing.replyState === 'error' || closing.replyState === 'malformed') ? 'failed' : 'unproven';
  setCleanup(0, markerValid ? 'confirmed' : c.markerCount !== 1 || (c.markerSequence !== null && c.firstCleanupSequence !== null && c.markerSequence >= c.firstCleanupSequence) ? 'failed' : 'unproven');
  setCleanup(1, protocolClosed(a.wire[2], a.wire[4]));
  setCleanup(2, protocolClosed(a.wire[1], a.wire[5]));
  setCleanup(3, adr36RecordResourceResult(a.resources[0], p.liveCallbackCount === 0 && p.pendingWriteCount === 0));
  setCleanup(4, p.postObservationCount > 0 ? 'failed' : p.intakeState === 'closed' && p.resolverCount === 0 && p.liveCallbackCount === 0 ? 'confirmed' : 'unproven');
  setCleanup(5, adr36RecordResourceResult(a.resources[1], false));
  setCleanup(6, adr36RecordResourceResult(a.resources[2], false));
  setCleanup(7, adr36RecordResourceResult(a.resources[3], false));
  setCleanup(8, adr36RecordResourceResult(a.resources[4], false));
  setCleanup(9, adr36RecordResourceResult(a.resources[5], false));
  setCleanup(10, p.objectGroupCount > 0 || p.remoteObjectHandleCount > 0 ? 'failed' : sourceKnown && evalKnown && parserKnown ? 'confirmed' : 'unproven');
  setCleanup(11, p.retainedRawCount > 0 || p.queueEntries > 0 || p.queuedBytes > 0 || p.dequeuedMaterialBytes > 0 ? 'failed' : p.intakeState === 'closed' && p.liveCallbackCount === 0 ? 'confirmed' : 'unproven');
  setCleanup(12, p.retainedIdentifierCount > 0 || d.rawWriteCount > 0 ? 'failed' : p.intakeState === 'closed' && p.liveCallbackCount === 0 ? 'confirmed' : 'unproven');
  setCleanup(13, a.resources[4].activeAfterCleanupCount > 0 ? 'failed' : a.resources[4].creationState === 'never-attempted' && a.resources[1].creationState === 'never-attempted' ? 'confirmed' : 'unproven');
  setCleanup(14, d.environmentDifferenceCount > 0 ? 'failed' : a.resources[6].creationState === 'never-attempted' ? 'confirmed' : 'unproven');
  setCleanup(15, d.passivePortsSourceState === 'bound-before-cleanup' && d.listener5173Count !== null && d.listener8787Count !== null ? d.listener5173Count + d.listener8787Count === 0 ? 'confirmed' : 'failed' : 'unproven');
  setCleanup(16, d.repositoryIdentityDifferenceCount > 0 || (d.repositoryBaselineSha256 !== null && d.repositoryFinalSha256 !== null && d.repositoryBaselineSha256 !== d.repositoryFinalSha256) ? 'failed' : d.repositoryBaselineSha256 !== null && d.repositoryBaselineSha256 === d.repositoryFinalSha256 && inventoryKnown ? 'confirmed' : 'unproven');
  setCleanup(17, d.historicalIdentityDifferenceCount > 0 || (d.historicalBaselineSha256 !== null && d.historicalBaselineSha256 !== adr36RecordHistoricalHash) || (d.historicalFinalSha256 !== null && d.historicalFinalSha256 !== adr36RecordHistoricalHash) ? 'failed' : d.historicalBaselineSha256 === adr36RecordHistoricalHash && d.historicalFinalSha256 === adr36RecordHistoricalHash ? 'confirmed' : 'unproven');
  setCleanup(18, d.residueCount > 0 || d.rawWriteCount > 0 ? 'failed' : capabilitiesKnown && d.writeCount === 0 && a.resources[7].creationState === 'never-attempted' ? 'confirmed' : inventoryKnown && d.residueCount === 0 ? 'confirmed' : 'unproven');
  const completionValid = c.reason === 'all-steps-terminal' && c.terminalState === 'terminal' && c.capArmCount === 1 && c.capCancelCount === 1 && c.capCancelAckCount === 1 && c.completionClockCount === 1 && c.cleanupOrigin !== null && c.completionClock !== null && c.completionClock >= c.cleanupOrigin && c.violationCount === 0;
  const completionBad = c.reason === 'cleanup-terminal-failure' || c.violationCount > 0 || c.capCancelCount > 1 || c.capCancelAckCount > 1 || c.completionClockCount > 1 || (c.completionClock !== null && c.cleanupOrigin !== null && c.completionClock < c.cleanupOrigin);
  setCleanup(19, completionBad ? 'failed' : completionValid ? 'confirmed' : 'unproven');
  let cleanupResult = 'PASS', interference = 'none-contract-visible-detected';
  for (let i = 0; i < checks.length; i += 1) { if (checks[i].result === 'failed') cleanupResult = 'FAIL'; else if (checks[i].result === 'unproven' && cleanupResult !== 'FAIL') cleanupResult = 'UNPROVEN'; }
  for (let i = 0; i < integrity.length; i += 1) { if (integrity[i].result === 'violated') interference = 'contract-visible-detected'; else if (integrity[i].result === 'unproven' && interference !== 'contract-visible-detected') interference = 'unknown'; }
  if (c.violationCount > 0 || p.violationCount > 0) cleanupResult = 'FAIL';
  const settlementOutcome = mainWorldKnown && f.publicSettlement !== null ? f.publicSettlement.outcome : 'unknown';
  const settlementStaticProfileResult = mainWorldKnown && f.publicSettlement !== null ? f.publicSettlement.staticProfileResult : 'unproven';
  const gate = deriveBrowserSyncTransportRuntimeDiagnosticRecordGate(adr36RecordDeepFreeze({ hardViolation, proofIncomplete }));
  const finding = deriveBrowserSyncTransportRuntimeDiagnosticRecordFinding(adr36RecordDeepFreeze({ candidateObserverGate: gate, replayResult: f.replay.equivalence.result, stimulusCount: stimulus, requestSequence: budget.sequence, settlementOutcome, settlementStaticProfileResult }));
  const observer = { deltaProfile: f.observer.deltaProfile, controllerExclusivity: capabilitiesBad || pipeBad ? 'not-exclusive' : authentic && capabilitiesKnown && pipeKnown ? 'exclusive' : 'unknown', connectionProfile: pipeBad ? 'other-prohibited' : authentic && pipeKnown ? 'remote-debugging-pipe' : 'unknown', targetProfile: targetKnown && f.observer.targetProfile === 'single-goldendawn-top-level' ? f.observer.targetProfile : f.observer.targetProfile === 'other' ? 'other' : 'unknown', foundationSha256: authentic && sourceKnown ? adr36RecordFoundationHash : null, evaluationSha256: authentic ? actualEvaluationHash : null, controllerEvaluateIntentCount: a.wire[3].intentCount === 0 ? 'zero' : 'one', protocolOperations: operations, mainWorldEvaluationCount: mainWorldCount, transportFactoryCallCount: factoryCount, primitiveProjectionProfile: f.observer.primitiveProjectionProfile, integrityChecks: integrity, interferenceObservation: interference };
  f.timing.completion.cleanupFinalizeReason = c.reason;
  f.timing.completion.cleanupFinalized = c.terminalState === 'terminal';
  // Cleanup stage facts use the same terminal cap/clock ledger as check 20.
  f.stages[8].relativeMilliseconds = c.cleanupOrigin === null ? null : 0;
  f.stages[8].timingState = c.cleanupOrigin === null ? 'unavailable' : 'measured';
  const lastStage = f.stages[9];
  if (c.reason === 'cleanup-cap' || (!completionValid && !completionBad)) { lastStage.observationState = 'not-observed'; lastStage.receiptOrder = null; lastStage.result = 'unproven'; lastStage.relativeMilliseconds = null; lastStage.timingState = 'unavailable'; }
  else if (completionBad) { lastStage.observationState = 'observed'; lastStage.receiptOrder = 2; lastStage.result = 'mismatch'; lastStage.relativeMilliseconds = null; lastStage.timingState = 'unavailable'; }
  else { const duration = c.completionClock - c.cleanupOrigin; lastStage.observationState = 'observed'; lastStage.receiptOrder = 2; lastStage.result = 'match'; lastStage.relativeMilliseconds = duration >= 60000 ? 60000 : duration - duration % 10; lastStage.timingState = duration >= 60000 ? 'at-or-above-cap' : 'measured'; }
  // No actual Record exists on either conformance-copy path or without A_obs.
  if (adapterEvidenceEligible !== true || !authentic || !markerValid || c.terminalState !== 'terminal') return adr36RecordDeepFreeze({ evidenceStatus: 'NOT_EVIDENCE', observerGate: gate, finding, runtimeRecord: null });
  const record = { schemaVersion: 1, recordType: 'browser-transport-diagnostic', diagnosticRunId: f.diagnosticRunId, observedAt: f.observedAt, timeZone: f.timeZone, historicalEvidence: f.historicalEvidence, replay: f.replay, observer, requestBudget: budget, publicSettlement: f.publicSettlement, stages: f.stages, timing: f.timing, cleanup: { observationClosedBeforeCleanup: markerValid, checks, result: cleanupResult, recordMaterializedAfterCleanup: true }, adr0029OverallGate: f.adr0029OverallGate, observerGate: gate, finding, causeStatus: 'CAUSE_NOT_PROVEN' };
  adr36RecordDeepFreeze(record);
  adr36RecordValidateProjectionShape(adr36RecordFrozenTree(record), true);
  return adr36RecordDeepFreeze({ evidenceStatus: 'RUNTIME_EVIDENCE', observerGate: gate, finding, runtimeRecord: record });
  } catch { adr36RecordFailure(); }
}

// ADR-0036-ADAPTER-TESTCOPY-EXPORT-ANCHOR-V1
