import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { pathToFileURL } from 'node:url'
import { promisify, types as utilTypes } from 'node:util'
import vm from 'node:vm'

import {
  SYNC_CONTRACT_ACTIONS,
  SYNC_CONTRACT_DATA_ORIGINS,
  SYNC_CONTRACT_HANDLERS,
  SYNC_CONTRACT_RESPONSE_ERROR_PROFILES,
  SYNC_CONTRACT_SOURCES,
  SYNC_CONTRACT_VERSION,
  validateSyncRequest,
  validateSyncResponse,
} from '../src/contracts/syncContract.js'
import { createSyncService } from '../src/services/syncService.js'
import * as browserSyncTransportModule from
  '../src/transports/browserSyncTransport.js'

const { createBrowserSyncTransport } = browserSyncTransportModule

const FIXED_ENDPOINT = 'http://127.0.0.1:8787/api/sync-test'
const DEADLINE_MS = 5_000
const MAX_RESPONSE_BYTES = 16_384
const REQUEST_TIMESTAMP = '2031-04-05T10:20:30.000Z'
const RESPONSE_TIMESTAMP = '2031-04-05T10:20:30.125Z'
const REQUEST_ID = 'req_48be0e81-2ace-46df-b713-3d580f313b71'
const SECOND_REQUEST_ID = 'req_7a7816e5-2024-4e6c-86d8-06efbf621226'
const MAX_REQUEST_ID = `req_${'a'.repeat(60)}`
const TOO_LONG_REQUEST_ID = `req_${'a'.repeat(61)}`

const API_PROPERTY_NAMES = Object.freeze(['sendSyncRequest'])
const REQUEST_PROPERTY_NAMES = Object.freeze([
  'version',
  'action',
  'source',
  'requestId',
  'timestamp',
  'payload',
])
const REQUEST_INIT_PROPERTY_NAMES = Object.freeze([
  'method',
  'mode',
  'credentials',
  'cache',
  'redirect',
  'referrerPolicy',
  'keepalive',
  'headers',
  'body',
  'signal',
])
const REQUEST_HEADER_PROPERTY_NAMES = Object.freeze(['Content-Type'])
const TRANSPORT_ERROR_PROPERTY_NAMES = Object.freeze(['code', 'message'])
const SYNC_RESPONSE_PROPERTY_NAMES = Object.freeze([
  'version',
  'success',
  'requestId',
  'action',
  'handledBy',
  'timestamp',
  'data',
  'error',
  'warnings',
  'meta',
])

const EXPECTED_TRANSPORT_ERROR = Object.freeze({
  code: 'BROWSER_SYNC_TRANSPORT_FAILED',
  message: 'Der lokale Browser-SyncTransport ist fehlgeschlagen.',
})
const EXPECTED_FACTORY_ERROR =
  'Ungültige BrowserSyncTransport-Komposition.'

const IMPORTED_ARRAY_IS_ARRAY = Array.isArray
const IMPORTED_JSON_PARSE = JSON.parse
const IMPORTED_JSON_STRINGIFY = JSON.stringify
const IMPORTED_OBJECT_CREATE = Object.create
const IMPORTED_OBJECT_DEFINE_PROPERTY = Object.defineProperty
const IMPORTED_OBJECT_FREEZE = Object.freeze
const IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR =
  Object.getOwnPropertyDescriptor
const IMPORTED_OBJECT_GET_PROTOTYPE_OF = Object.getPrototypeOf
const IMPORTED_OBJECT_HAS_OWN = Object.hasOwn
const IMPORTED_OBJECT_IS_EXTENSIBLE = Object.isExtensible
const IMPORTED_OBJECT_IS_FROZEN = Object.isFrozen
const IMPORTED_OBJECT_IS_SEALED = Object.isSealed
const IMPORTED_OBJECT_SET_PROTOTYPE_OF = Object.setPrototypeOf
const IMPORTED_PROMISE = Promise
const IMPORTED_PROMISE_PROTOTYPE = Promise.prototype
const IMPORTED_REFLECT_APPLY = Reflect.apply
const IMPORTED_REFLECT_OWN_KEYS = Reflect.ownKeys
const IMPORTED_TEXT_ENCODER = TextEncoder
const IMPORTED_TEXT_ENCODER_ENCODE = TextEncoder.prototype.encode
const IMPORTED_SET_IMMEDIATE = setImmediate
const EXEC_FILE_ASYNC = promisify(execFile)

let freshImportNumber = 0

function createRequest(overrides = {}) {
  return {
    version: SYNC_CONTRACT_VERSION,
    action: SYNC_CONTRACT_ACTIONS[0],
    source: SYNC_CONTRACT_SOURCES[0],
    requestId: REQUEST_ID,
    timestamp: REQUEST_TIMESTAMP,
    payload: {},
    ...overrides,
  }
}

function createSyntheticSuccessResponse(request, overrides = {}) {
  return {
    version: SYNC_CONTRACT_VERSION,
    success: true,
    requestId: request.requestId,
    action: request.action,
    handledBy: SYNC_CONTRACT_HANDLERS[0],
    timestamp: RESPONSE_TIMESTAMP,
    data: {
      status: 'ok',
      dataOrigin: SYNC_CONTRACT_DATA_ORIGINS[0],
    },
    error: null,
    warnings: [],
    meta: {
      durationMs: 7,
      processedBy: [SYNC_CONTRACT_HANDLERS[0]],
    },
    ...overrides,
  }
}

function createSyntheticNormalErrorResponse(
  request,
  code = 'SERVICE_UNAVAILABLE'
) {
  const profile = SYNC_CONTRACT_RESPONSE_ERROR_PROFILES[code]

  return createSyntheticSuccessResponse(request, {
    success: false,
    data: null,
    error: {
      code: profile.code,
      message: profile.message,
      retryable: profile.retryable,
      details: [],
    },
  })
}

function createSyntheticGatewayErrorResponse() {
  const profile = SYNC_CONTRACT_RESPONSE_ERROR_PROFILES.INVALID_JSON

  return {
    version: SYNC_CONTRACT_VERSION,
    success: false,
    requestId: 'gateway_1fde999c-8ea6-4238-a5e7-158e4a106696',
    action: null,
    handledBy: null,
    timestamp: RESPONSE_TIMESTAMP,
    data: null,
    error: {
      code: profile.code,
      message: profile.message,
      retryable: profile.retryable,
      details: [],
    },
    warnings: [],
    meta: {
      durationMs: 3,
      processedBy: [],
    },
  }
}

function encodeFixture(value) {
  const encoder = new IMPORTED_TEXT_ENCODER()
  return IMPORTED_REFLECT_APPLY(
    IMPORTED_TEXT_ENCODER_ENCODE,
    encoder,
    [value]
  )
}

function stringifyFixture(value) {
  return IMPORTED_REFLECT_APPLY(IMPORTED_JSON_STRINGIFY, JSON, [value])
}

function parseFixture(value) {
  return IMPORTED_REFLECT_APPLY(IMPORTED_JSON_PARSE, JSON, [value])
}

function normalizeNativePromiseFixture(promise) {
  for (const propertyName of IMPORTED_REFLECT_OWN_KEYS(promise)) {
    const descriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
      promise,
      propertyName
    )

    assert.notEqual(descriptor, undefined)
    assert.equal(descriptor.configurable, true)
    assert.equal(Reflect.deleteProperty(promise, propertyName), true)
  }

  assert.deepEqual(IMPORTED_REFLECT_OWN_KEYS(promise), [])
  return promise
}

function createNativePromise(executor) {
  return normalizeNativePromiseFixture(new IMPORTED_PROMISE(executor))
}

function createResolvedNativePromise(value) {
  return createNativePromise((resolve) => resolve(value))
}

function createRejectedNativePromise(reason) {
  return createNativePromise((_resolve, reject) => reject(reason))
}

function createDeferred() {
  let resolve
  let reject
  const promise = createNativePromise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })

  return { promise, reject, resolve }
}

function createChunkResult(value) {
  return { value, done: false }
}

function createEofResult() {
  return { value: undefined, done: true }
}

function createReaderFixture({
  chunks,
  readResults,
  readImplementation,
  cancelImplementation,
  releaseLockImplementation,
} = {}) {
  const sourceChunks = chunks ?? [encodeFixture('null')]
  const queuedResults = readResults ?? [
    ...sourceChunks.map((chunk) => createChunkResult(chunk)),
    createEofResult(),
  ]
  const calls = {
    cancelMethod: [],
    cancelResolution: 0,
    readMethod: [],
    readResolution: 0,
    releaseLockMethod: [],
    releaseLockResolution: 0,
  }
  const reader = {}
  let readIndex = 0

  IMPORTED_OBJECT_DEFINE_PROPERTY(reader, 'read', {
    configurable: true,
    enumerable: true,
    get() {
      calls.readResolution += 1
      return function read() {
        calls.readMethod.push({ args: [...arguments], receiver: this })
        const callNumber = calls.readMethod.length

        if (readImplementation) {
          return readImplementation({ callNumber, reader })
        }

        const result = readIndex < queuedResults.length
          ? queuedResults[readIndex]
          : queuedResults.at(-1)
        readIndex += 1
        return createResolvedNativePromise(result)
      }
    },
  })
  IMPORTED_OBJECT_DEFINE_PROPERTY(reader, 'cancel', {
    configurable: true,
    enumerable: true,
    get() {
      calls.cancelResolution += 1
      return function cancel() {
        calls.cancelMethod.push({ args: [...arguments], receiver: this })

        if (cancelImplementation) {
          return cancelImplementation({
            args: [...arguments],
            callNumber: calls.cancelMethod.length,
            reader,
          })
        }

        return createResolvedNativePromise(undefined)
      }
    },
  })
  IMPORTED_OBJECT_DEFINE_PROPERTY(reader, 'releaseLock', {
    configurable: true,
    enumerable: true,
    get() {
      calls.releaseLockResolution += 1
      return function releaseLock() {
        calls.releaseLockMethod.push({
          args: [...arguments],
          receiver: this,
        })

        if (releaseLockImplementation) {
          return releaseLockImplementation({
            args: [...arguments],
            callNumber: calls.releaseLockMethod.length,
            reader,
          })
        }

        return undefined
      }
    },
  })

  return { calls, reader }
}

function createBodyFixture({ reader, getReaderImplementation } = {}) {
  const calls = {
    getReaderMethod: [],
    getReaderResolution: 0,
  }
  const body = {}

  IMPORTED_OBJECT_DEFINE_PROPERTY(body, 'getReader', {
    configurable: true,
    enumerable: true,
    get() {
      calls.getReaderResolution += 1
      return function getReader() {
        calls.getReaderMethod.push({
          args: [...arguments],
          receiver: this,
        })

        if (getReaderImplementation) {
          return getReaderImplementation({
            args: [...arguments],
            body,
            callNumber: calls.getReaderMethod.length,
          })
        }

        return reader
      }
    },
  })

  return { body, calls }
}

function createHeadersFixture({
  contentType = 'application/json; charset=utf-8',
  contentLength,
  contentEncoding = null,
  getImplementation,
} = {}) {
  const calls = {
    getMethod: [],
    getResolution: 0,
  }
  const headers = {}
  const values = {
    'content-type': contentType,
    'content-length': contentLength,
    'content-encoding': contentEncoding,
  }

  IMPORTED_OBJECT_DEFINE_PROPERTY(headers, 'get', {
    configurable: true,
    enumerable: true,
    get() {
      calls.getResolution += 1
      return function get(headerName) {
        calls.getMethod.push({
          args: [...arguments],
          headerName,
          receiver: this,
        })

        if (getImplementation) {
          return getImplementation({
            args: [...arguments],
            callNumber: calls.getMethod.length,
            headerName,
            headers,
            values,
          })
        }

        return values[headerName]
      }
    },
  })

  return { calls, headers, values }
}

function createResponseFixture({
  status = 200,
  redirected = false,
  url = FIXED_ENDPOINT,
  type = 'cors',
  bodyText = 'null',
  chunks,
  readResults,
  reader: suppliedReader,
  body: suppliedBody,
  headers: suppliedHeaders,
  contentType,
  contentLength,
  contentEncoding,
  omitContentLength = false,
  instrumentResponseGetters = false,
  readImplementation,
  cancelImplementation,
  releaseLockImplementation,
  getReaderImplementation,
  headerGetImplementation,
} = {}) {
  const hasExplicitContentLength = arguments.length === 1 &&
    arguments[0] !== null &&
    IMPORTED_OBJECT_HAS_OWN(arguments[0], 'contentLength')
  const responseBytes = encodeFixture(bodyText)
  const readerFixture = suppliedReader
    ? { calls: null, reader: suppliedReader }
    : createReaderFixture({
      chunks: chunks ?? [responseBytes],
      readResults,
      readImplementation,
      cancelImplementation,
      releaseLockImplementation,
    })
  const bodyFixture = suppliedBody
    ? { body: suppliedBody, calls: null }
    : createBodyFixture({
      reader: readerFixture.reader,
      getReaderImplementation,
    })
  const headersFixture = suppliedHeaders
    ? { calls: null, headers: suppliedHeaders }
    : createHeadersFixture({
      contentType,
      contentLength: omitContentLength
        ? undefined
        : hasExplicitContentLength
          ? contentLength
          : String(responseBytes.byteLength),
      contentEncoding,
      getImplementation: headerGetImplementation,
    })
  const responseValues = {
    status,
    redirected,
    url,
    type,
    headers: headersFixture.headers,
    body: bodyFixture.body,
  }
  const responseEvents = []
  let response

  if (instrumentResponseGetters) {
    response = {}

    for (const propertyName of [
      'status',
      'redirected',
      'url',
      'type',
      'headers',
      'body',
    ]) {
      IMPORTED_OBJECT_DEFINE_PROPERTY(response, propertyName, {
        configurable: true,
        enumerable: true,
        get() {
          responseEvents.push(propertyName)
          return responseValues[propertyName]
        },
      })
    }
  } else {
    response = responseValues
  }

  return {
    body: bodyFixture,
    bytes: responseBytes,
    headers: headersFixture,
    reader: readerFixture,
    response,
    responseEvents,
    responseValues,
  }
}

function createControllerFixture(controllerCalls, callNumber) {
  const signal = { callNumber }
  const controller = {}

  IMPORTED_OBJECT_DEFINE_PROPERTY(controller, 'signal', {
    configurable: true,
    enumerable: true,
    get() {
      controllerCalls.signalResolution.push({ callNumber, controller, signal })
      return signal
    },
  })
  IMPORTED_OBJECT_DEFINE_PROPERTY(controller, 'abort', {
    configurable: true,
    enumerable: true,
    get() {
      controllerCalls.abortResolution.push({ callNumber, controller })
      return function abort() {
        controllerCalls.abortMethod.push({
          args: [...arguments],
          callNumber,
          receiver: this,
        })
      }
    },
  })

  return { controller, signal }
}

function createTransportSystem({
  factory = createBrowserSyncTransport,
  fetchImplementation,
  controllerImplementation,
  timerImplementation,
  clearTimerImplementation,
} = {}) {
  const calls = {
    abortMethod: [],
    abortResolution: [],
    clearDeadlineTimer: [],
    createAbortController: [],
    fetchRequest: [],
    setDeadlineTimer: [],
    signalResolution: [],
  }
  const responseFixtures = []

  function fetchRequest(endpoint, requestInit) {
    const call = {
      args: [...arguments],
      endpoint,
      receiver: this,
      requestInit,
    }
    calls.fetchRequest.push(call)

    if (fetchImplementation) {
      return fetchImplementation({
        call,
        callNumber: calls.fetchRequest.length,
        calls,
        endpoint,
        requestInit,
      })
    }

    const responseFixture = createResponseFixture()
    responseFixtures.push(responseFixture)
    return createResolvedNativePromise(responseFixture.response)
  }

  function createAbortController() {
    const callNumber = calls.createAbortController.length + 1
    const call = { args: [...arguments], callNumber, receiver: this }
    calls.createAbortController.push(call)

    if (controllerImplementation) {
      return controllerImplementation({ call, callNumber, calls })
    }

    return createControllerFixture(calls, callNumber).controller
  }

  function setDeadlineTimer(onDeadline, milliseconds) {
    const callNumber = calls.setDeadlineTimer.length + 1
    const defaultHandle = { callNumber }
    const call = {
      args: [...arguments],
      callNumber,
      milliseconds,
      onDeadline,
      receiver: this,
    }
    calls.setDeadlineTimer.push(call)

    let timerHandle

    if (timerImplementation) {
      timerHandle = timerImplementation({
        call,
        callNumber,
        calls,
        defaultHandle,
        milliseconds,
        onDeadline,
      })
    } else {
      timerHandle = defaultHandle
    }

    call.returnedHandle = timerHandle
    return timerHandle
  }

  function clearDeadlineTimer(timerHandle) {
    const call = {
      args: [...arguments],
      callNumber: calls.clearDeadlineTimer.length + 1,
      receiver: this,
      timerHandle,
    }
    calls.clearDeadlineTimer.push(call)

    if (clearTimerImplementation) {
      return clearTimerImplementation({ call, calls, timerHandle })
    }

    return undefined
  }

  const composition = {
    fetchRequest,
    createAbortController,
    setDeadlineTimer,
    clearDeadlineTimer,
  }
  const transport = factory(composition)

  return {
    calls,
    composition,
    responseFixtures,
    transport,
  }
}

const ADR_0028_PROBE_PROPERTY =
  '__goldendawnBrowserSyncTransportAdr0028Probe__'

function createAdr0028Probe() {
  return {
    decodeCalls: 0,
    encodeCalls: 0,
    firstValidatorFrozen: null,
    firstValidatorPayloadFrozen: null,
    firstValidatorReference: null,
    firstValidatorRequest: null,
    order: '',
    policyCalls: 0,
    promiseThenCalls: 0,
    promiseThenTarget: null,
    promiseThenTargetCalls: 0,
    profileCalls: 0,
    parseCalls: 0,
    secondValidatorFrozen: null,
    secondValidatorPayloadFrozen: null,
    secondValidatorReference: null,
    secondValidatorRequest: null,
    stringifyCalls: 0,
    validatorCalls: 0,
    recordStage(stage) {
      this.order = this.order === '' ? stage : `${this.order}>${stage}`
    },
    recordValidator(request, referenceTimestamp) {
      this.validatorCalls += 1
      this.recordStage('validator')

      if (this.validatorCalls === 1) {
        this.firstValidatorRequest = request
        this.firstValidatorReference = referenceTimestamp
        this.firstValidatorFrozen = IMPORTED_OBJECT_IS_FROZEN(request)
        this.firstValidatorPayloadFrozen = IMPORTED_OBJECT_IS_FROZEN(
          request.payload
        )
      } else if (this.validatorCalls === 2) {
        this.secondValidatorRequest = request
        this.secondValidatorReference = referenceTimestamp
        this.secondValidatorFrozen = IMPORTED_OBJECT_IS_FROZEN(request)
        this.secondValidatorPayloadFrozen = IMPORTED_OBJECT_IS_FROZEN(
          request.payload
        )
      }
    },
    reset() {
      this.decodeCalls = 0
      this.encodeCalls = 0
      this.firstValidatorFrozen = null
      this.firstValidatorPayloadFrozen = null
      this.firstValidatorReference = null
      this.firstValidatorRequest = null
      this.order = ''
      this.policyCalls = 0
      this.promiseThenCalls = 0
      this.promiseThenTarget = null
      this.promiseThenTargetCalls = 0
      this.profileCalls = 0
      this.parseCalls = 0
      this.secondValidatorFrozen = null
      this.secondValidatorPayloadFrozen = null
      this.secondValidatorReference = null
      this.secondValidatorRequest = null
      this.stringifyCalls = 0
      this.validatorCalls = 0
    },
  }
}

function createScalarTransportSystem({
  factory = createBrowserSyncTransport,
  onStage,
  responseBodyText = 'null',
} = {}) {
  const responseBytes = encodeFixture(responseBodyText)
  const chunkResult = createChunkResult(responseBytes)
  const eofResult = createEofResult()
  const chunkPromise = createResolvedNativePromise(chunkResult)
  const eofPromise = createResolvedNativePromise(eofResult)
  const timerHandle = { fixture: 'adr-0028-scalar-timer' }
  const signal = { fixture: 'adr-0028-scalar-signal' }
  const calls = {
    abort: 0,
    cancel: 0,
    clear: 0,
    controller: 0,
    fetch: 0,
    getReader: 0,
    headerGet: 0,
    read: 0,
    release: 0,
    timer: 0,
  }
  let readNumber = 0

  function mark(stage) {
    if (onStage !== undefined) {
      onStage(stage)
    }
  }

  const reader = {
    read() {
      calls.read += 1
      readNumber += 1
      return readNumber === 1 ? chunkPromise : eofPromise
    },
    cancel() {
      calls.cancel += 1
      return undefined
    },
    releaseLock() {
      calls.release += 1
      return undefined
    },
  }
  const body = {
    getReader() {
      calls.getReader += 1
      return reader
    },
  }
  const headers = {
    get(headerName) {
      calls.headerGet += 1
      if (headerName === 'content-type') {
        return 'application/json; charset=utf-8'
      }
      if (headerName === 'content-length') {
        return `${responseBytes.byteLength}`
      }
      return null
    },
  }
  const response = {
    status: 200,
    redirected: false,
    url: FIXED_ENDPOINT,
    type: 'cors',
    headers,
    body,
  }
  const responsePromise = createResolvedNativePromise(response)
  const controller = {
    signal,
    abort() {
      calls.abort += 1
      return undefined
    },
  }
  const transport = factory({
    fetchRequest() {
      calls.fetch += 1
      mark('fetch')
      return responsePromise
    },
    createAbortController() {
      calls.controller += 1
      mark('controller')
      return controller
    },
    setDeadlineTimer() {
      calls.timer += 1
      mark('timer')
      return timerHandle
    },
    clearDeadlineTimer() {
      calls.clear += 1
      return undefined
    },
  })

  return { body, calls, controller, headers, reader, response, transport }
}

async function withInstrumentedAdr0028Transport({
  contractMutations = [],
  neutralizePolicy = false,
  transportMutations = [],
} = {}, callback) {
  const originalProbeDescriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
    globalThis,
    ADR_0028_PROBE_PROPERTY
  )
  const probe = createAdr0028Probe()
  const policyCallsite = [
    'if (!hasFixedV1WirePolicy(',
    '    internal.request,',
    '    internal.payload,',
    '    snapshot.timestamp',
    '  )) {',
  ].join('\n')
  const sourceMutations = [
    {
      label: 'ADR-0028 Promise-then-Instrumentierung',
      search: [
        'const capturedPromiseThen = captureProperty(',
        '  capturedPromisePrototype,',
        "  'then'",
        ')',
      ].join('\n'),
      replacement: [
        'const capturedNativePromiseThen = captureProperty(',
        '  capturedPromisePrototype,',
        "  'then'",
        ')',
        'const capturedPromiseThen = function (...args) {',
        `  globalThis.${ADR_0028_PROBE_PROPERTY}.promiseThenCalls += 1`,
        `  if (this === globalThis.${ADR_0028_PROBE_PROPERTY}.promiseThenTarget) {`,
        `    globalThis.${ADR_0028_PROBE_PROPERTY}.promiseThenTargetCalls += 1`,
        '  }',
        '  return capturedReflectApply(capturedNativePromiseThen, this, args)',
        '}',
      ].join('\n'),
    },
    {
      label: 'ADR-0028 Profilinstrumentierung',
      search: 'function hasExactFrozenRequestProfile(request, payload, snapshot) {\n  try {',
      replacement: [
        'function hasExactFrozenRequestProfile(request, payload, snapshot) {',
        `  globalThis.${ADR_0028_PROBE_PROPERTY}.profileCalls += 1`,
        `  globalThis.${ADR_0028_PROBE_PROPERTY}.recordStage('profile')`,
        '  try {',
      ].join('\n'),
    },
    {
      label: 'ADR-0028 Policyinstrumentierung',
      search: 'function hasFixedV1WirePolicy(request, payload, referenceTimestamp) {\n  try {',
      replacement: [
        'function hasFixedV1WirePolicy(request, payload, referenceTimestamp) {',
        `  globalThis.${ADR_0028_PROBE_PROPERTY}.policyCalls += 1`,
        `  globalThis.${ADR_0028_PROBE_PROPERTY}.recordStage('policy')`,
        '  try {',
      ].join('\n'),
    },
    {
      label: 'ADR-0028 Stringifyinstrumentierung',
      search: '  try {\n    const body = capturedReflectApply(\n      capturedJsonStringify,',
      replacement: [
        '  try {',
        `    globalThis.${ADR_0028_PROBE_PROPERTY}.stringifyCalls += 1`,
        `    globalThis.${ADR_0028_PROBE_PROPERTY}.recordStage('stringify')`,
        '    const body = capturedReflectApply(',
        '      capturedJsonStringify,',
      ].join('\n'),
    },
    {
      label: 'ADR-0028 Encodeinstrumentierung',
      search: '    const encodedRequest = capturedReflectApply(\n      capturedTextEncoderEncode,',
      replacement: [
        `    globalThis.${ADR_0028_PROBE_PROPERTY}.encodeCalls += 1`,
        `    globalThis.${ADR_0028_PROBE_PROPERTY}.recordStage('encode')`,
        '    const encodedRequest = capturedReflectApply(',
        '      capturedTextEncoderEncode,',
      ].join('\n'),
    },
    {
      label: 'ADR-0028 Decodeinstrumentierung',
      search: '      const decoded = capturedReflectApply(\n        capturedTextDecoderDecode,',
      replacement: [
        `      globalThis.${ADR_0028_PROBE_PROPERTY}.decodeCalls += 1`,
        '      const decoded = capturedReflectApply(',
        '        capturedTextDecoderDecode,',
      ].join('\n'),
    },
    {
      label: 'ADR-0028 Parseinstrumentierung',
      search: '      parsed = capturedReflectApply(capturedJsonParse, capturedJsonObject, [',
      replacement: [
        `      globalThis.${ADR_0028_PROBE_PROPERTY}.parseCalls += 1`,
        '      parsed = capturedReflectApply(capturedJsonParse, capturedJsonObject, [',
      ].join('\n'),
    },
    ...transportMutations,
  ]

  if (neutralizePolicy) {
    sourceMutations.push({
      label: 'ADR-0028 neutralisierter Policycallsite',
      search: policyCallsite,
      replacement: `if (false && !hasFixedV1WirePolicy(\n    internal.request,\n    internal.payload,\n    snapshot.timestamp\n  )) {`,
    })
  }

  try {
    IMPORTED_OBJECT_DEFINE_PROPERTY(globalThis, ADR_0028_PROBE_PROPERTY, {
      configurable: true,
      enumerable: false,
      value: probe,
      writable: false,
    })
    await withTemporaryBrowserSyncTransportSources({
      contractMutations: [
        {
          label: 'ADR-0028 Validatorinstrumentierung',
          search: 'export function validateSyncRequest(syncRequest, referenceTimestamp) {\n  const result =',
          replacement: [
            'export function validateSyncRequest(syncRequest, referenceTimestamp) {',
            `  globalThis.${ADR_0028_PROBE_PROPERTY}.recordValidator(`,
            '    syncRequest,',
            '    referenceTimestamp',
            '  )',
            '  const result =',
          ].join('\n'),
        },
        ...contractMutations,
      ],
      transportMutations: sourceMutations,
    }, async (factory) => {
      await callback({ factory, probe })
    })
  } finally {
    restoreOwnProperty(
      globalThis,
      ADR_0028_PROBE_PROPERTY,
      originalProbeDescriptor
    )
  }
}

async function runIsolatedNodeScript(source, label) {
  const temporaryRoot = await mkdtemp(
    path.join(tmpdir(), `goldendawn-browser-sync-${label}-`)
  )

  try {
    const scriptPath = path.join(temporaryRoot, 'probe.mjs')
    await writeFile(scriptPath, source, 'utf8')
    const result = await EXEC_FILE_ASYNC(process.execPath, [scriptPath], {
      encoding: 'utf8',
      timeout: 10_000,
      windowsHide: true,
    })
    assert.equal(result.stderr, '')
    return parseFixture(result.stdout.trim())
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true })
  }
}

function createIsolatedPromiseProbeSource({
  descriptorKind = null,
  rejected = false,
  stage,
}) {
  const transportModuleHref = new URL(
    '../src/transports/browserSyncTransport.js',
    import.meta.url
  ).href

  return `
const STAGE = ${JSON.stringify(stage)}
const DESCRIPTOR_KIND = ${JSON.stringify(descriptorKind)}
const REJECTED = ${JSON.stringify(rejected)}
const TRANSPORT_MODULE_HREF = ${JSON.stringify(transportModuleHref)}
const FIXED_ENDPOINT = ${JSON.stringify(FIXED_ENDPOINT)}
const REQUEST_TIMESTAMP = ${JSON.stringify(REQUEST_TIMESTAMP)}
const REQUEST_ID = ${JSON.stringify(REQUEST_ID)}
const MARKER = 'isolated-rejection-private-sentinel'

const nativeThenDescriptor = Object.getOwnPropertyDescriptor(
  Promise.prototype,
  'then'
)
const nativeThen = nativeThenDescriptor.value
const thenProbe = { calls: 0, target: null }
let createBrowserSyncTransport

try {
  Object.defineProperty(Promise.prototype, 'then', {
    ...nativeThenDescriptor,
    value: function (...args) {
      if (this === thenProbe.target) {
        thenProbe.calls += 1
      }
      return Reflect.apply(nativeThen, this, args)
    },
  })
  ;({ createBrowserSyncTransport } = await import(
    TRANSPORT_MODULE_HREF + '?isolated=' + encodeURIComponent(
      STAGE + ':' + String(DESCRIPTOR_KIND) + ':' + String(REJECTED)
    )
  ))
} finally {
  Object.defineProperty(
    Promise.prototype,
    'then',
    nativeThenDescriptor
  )
}

function normalizePromise(candidate) {
  for (const propertyName of Reflect.ownKeys(candidate)) {
    const descriptor = Object.getOwnPropertyDescriptor(
      candidate,
      propertyName
    )
    if (descriptor !== undefined && descriptor.configurable === true) {
      Reflect.deleteProperty(candidate, propertyName)
    }
  }
  return candidate
}

function resolved(value) {
  return normalizePromise(new Promise((resolve) => resolve(value)))
}

const bytes = new TextEncoder().encode('null')
const chunkResult = { value: bytes, done: false }
const eofResult = { value: undefined, done: true }
const calls = {
  abort: 0,
  cancel: 0,
  clear: 0,
  controller: 0,
  fetch: 0,
  mutation: 0,
  read: 0,
  release: 0,
  timer: 0,
}
let readNumber = 0
let candidate

const reader = {
  read() {
    calls.read += 1
    readNumber += 1
    if (STAGE === 'read' && readNumber === 1) {
      provideCandidate()
      return candidate
    }
    return resolved(readNumber === 1 ? chunkResult : eofResult)
  },
  cancel() {
    calls.cancel += 1
    return undefined
  },
  releaseLock() {
    calls.release += 1
    if (STAGE === 'cleanup') {
      provideCandidate()
      return candidate
    }
    return undefined
  },
}
const response = {
  status: 200,
  redirected: false,
  url: FIXED_ENDPOINT,
  type: 'cors',
  headers: {
    get(headerName) {
      if (headerName === 'content-type') {
        return 'application/json; charset=utf-8'
      }
      if (headerName === 'content-length') {
        return '4'
      }
      return null
    },
  },
  body: {
    getReader() {
      return reader
    },
  },
}

const markerReason = REJECTED ? new Error(MARKER) : null
let hostEventCount = 0
let hostReasonMatchedCount = 0

if (REJECTED) {
  process.on('unhandledRejection', (reason) => {
    hostEventCount += 1
    if (reason === markerReason) {
      hostReasonMatchedCount += 1
    }
  })
}

const candidateValue = STAGE === 'fetch'
  ? response
  : STAGE === 'read'
    ? chunkResult
    : undefined
candidate = normalizePromise(new Promise((resolve, reject) => {
  if (REJECTED) {
    reject(markerReason)
  } else {
    resolve(candidateValue)
  }
}))

if (REJECTED) {
  Object.defineProperty(candidate, 'malformed', {
    configurable: true,
    enumerable: true,
    value: true,
    writable: true,
  })
}

thenProbe.target = candidate
const candidateOwnKeyCount = Reflect.ownKeys(candidate).length
let irreversibleDescriptor
let irreversibleTarget
let irreversiblePropertyName

if (DESCRIPTOR_KIND === 'constructor') {
  irreversibleTarget = Promise.prototype
  irreversiblePropertyName = 'constructor'
  irreversibleDescriptor = Object.getOwnPropertyDescriptor(
    irreversibleTarget,
    irreversiblePropertyName
  )
} else if (DESCRIPTOR_KIND === 'species') {
  irreversibleTarget = Promise
  irreversiblePropertyName = Symbol.species
  irreversibleDescriptor = Object.getOwnPropertyDescriptor(
    irreversibleTarget,
    irreversiblePropertyName
  )
}

function provideCandidate() {
  if (DESCRIPTOR_KIND !== null && calls.mutation === 0) {
    calls.mutation += 1
    Object.defineProperty(
      irreversibleTarget,
      irreversiblePropertyName,
      { ...irreversibleDescriptor, configurable: false }
    )
  }
  return candidate
}

const transport = createBrowserSyncTransport({
  fetchRequest() {
    calls.fetch += 1
    if (STAGE === 'fetch') {
      return provideCandidate()
    }
    return resolved(response)
  },
  createAbortController() {
    calls.controller += 1
    return {
      signal: {},
      abort() {
        calls.abort += 1
        return undefined
      },
    }
  },
  setDeadlineTimer() {
    calls.timer += 1
    return {}
  },
  clearDeadlineTimer() {
    calls.clear += 1
    return undefined
  },
})
const request = {
  version: '1.0',
  action: 'syncTest',
  source: 'goldendawn-os',
  requestId: REQUEST_ID,
  timestamp: REQUEST_TIMESTAMP,
  payload: {},
}
let publicStatus
let publicCode = null
let publicMessage = null
let publicValueWasNull = false

try {
  const value = await transport.sendSyncRequest(request)
  publicStatus = 'fulfilled'
  publicValueWasNull = value === null
} catch (reason) {
  publicStatus = 'rejected'
  publicCode = reason === null ? null : reason.code
  publicMessage = reason === null ? null : reason.message
}

if (REJECTED) {
  await new Promise((resolve) => setImmediate(resolve))
  await new Promise((resolve) => setImmediate(resolve))
}

const publicProjection = JSON.stringify({
  publicCode,
  publicMessage,
  publicStatus,
  publicValueWasNull,
})
process.stdout.write(JSON.stringify({
  calls,
  candidateOwnKeyCount,
  currentDescriptorConfigurable: DESCRIPTOR_KIND === null
    ? null
    : Object.getOwnPropertyDescriptor(
        irreversibleTarget,
        irreversiblePropertyName
      ).configurable,
  descriptorKind: DESCRIPTOR_KIND,
  hostEventCount,
  hostReasonMatchedCount,
  nodeVersion: process.version,
  publicCode,
  publicContainsMarker: publicProjection.includes(MARKER),
  publicMessage,
  publicStatus,
  publicValueWasNull,
  rejectedFixture: REJECTED,
  stage: STAGE,
  targetThenCalls: thenProbe.calls,
}))
`
}

function assertExactFrozenOwnDataRecord(value, expectedPropertyNames, {
  prototype = Object.prototype,
} = {}) {
  assert.notEqual(value, null)
  assert.equal(typeof value, 'object')
  assert.equal(IMPORTED_ARRAY_IS_ARRAY(value), false)
  assert.strictEqual(IMPORTED_OBJECT_GET_PROTOTYPE_OF(value), prototype)
  assert.deepEqual(IMPORTED_REFLECT_OWN_KEYS(value), expectedPropertyNames)
  assert.equal(IMPORTED_OBJECT_IS_FROZEN(value), true)

  for (const propertyName of expectedPropertyNames) {
    const descriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
      value,
      propertyName
    )

    assert.notEqual(descriptor, undefined)
    assert.equal(IMPORTED_OBJECT_HAS_OWN(descriptor, 'value'), true)
    assert.equal(IMPORTED_OBJECT_HAS_OWN(descriptor, 'get'), false)
    assert.equal(IMPORTED_OBJECT_HAS_OWN(descriptor, 'set'), false)
    assert.equal(descriptor.enumerable, true)
    assert.equal(descriptor.configurable, false)
    assert.equal(descriptor.writable, false)
  }
}

function assertDeepFrozen(value, seen = new Set()) {
  if (
    value === null ||
    (typeof value !== 'object' && typeof value !== 'function') ||
    seen.has(value)
  ) {
    return
  }

  seen.add(value)
  assert.equal(IMPORTED_OBJECT_IS_FROZEN(value), true)

  for (const propertyName of IMPORTED_REFLECT_OWN_KEYS(value)) {
    const descriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
      value,
      propertyName
    )

    if (descriptor && IMPORTED_OBJECT_HAS_OWN(descriptor, 'value')) {
      assertDeepFrozen(descriptor.value, seen)
    }
  }
}

function captureOwnDataDescriptorGraph(rootValue) {
  const nodes = []
  const seen = new Set()

  function capture(value) {
    if (
      value === null ||
      (typeof value !== 'object' && typeof value !== 'function') ||
      seen.has(value)
    ) {
      return
    }

    seen.add(value)
    const ownKeys = IMPORTED_REFLECT_OWN_KEYS(value)
    const descriptors = ownKeys.map((propertyName) => {
      const descriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
        value,
        propertyName
      )
      assert.notEqual(descriptor, undefined)
      return { descriptor, propertyName }
    })

    nodes.push({
      descriptors,
      extensible: IMPORTED_OBJECT_IS_EXTENSIBLE(value),
      frozen: IMPORTED_OBJECT_IS_FROZEN(value),
      ownKeys,
      prototype: IMPORTED_OBJECT_GET_PROTOTYPE_OF(value),
      sealed: IMPORTED_OBJECT_IS_SEALED(value),
      value,
    })

    for (const { descriptor } of descriptors) {
      if (IMPORTED_OBJECT_HAS_OWN(descriptor, 'value')) {
        capture(descriptor.value)
      }
    }
  }

  capture(rootValue)
  return { nodes, rootValue }
}

function assertOwnDataDescriptorGraphUnchanged(snapshot) {
  for (const node of snapshot.nodes) {
    assert.strictEqual(
      IMPORTED_OBJECT_GET_PROTOTYPE_OF(node.value),
      node.prototype
    )
    assert.equal(
      IMPORTED_OBJECT_IS_EXTENSIBLE(node.value),
      node.extensible
    )
    assert.equal(IMPORTED_OBJECT_IS_SEALED(node.value), node.sealed)
    assert.equal(IMPORTED_OBJECT_IS_FROZEN(node.value), node.frozen)
    assert.deepEqual(IMPORTED_REFLECT_OWN_KEYS(node.value), node.ownKeys)

    for (const original of node.descriptors) {
      const current = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
        node.value,
        original.propertyName
      )
      const originalDescriptor = original.descriptor

      assert.notEqual(current, undefined)
      assert.equal(current.configurable, originalDescriptor.configurable)
      assert.equal(current.enumerable, originalDescriptor.enumerable)
      assert.equal(
        IMPORTED_OBJECT_HAS_OWN(current, 'value'),
        IMPORTED_OBJECT_HAS_OWN(originalDescriptor, 'value')
      )

      if (IMPORTED_OBJECT_HAS_OWN(originalDescriptor, 'value')) {
        assert.equal(current.writable, originalDescriptor.writable)
        assert.equal(Object.is(current.value, originalDescriptor.value), true)
      } else {
        assert.strictEqual(current.get, originalDescriptor.get)
        assert.strictEqual(current.set, originalDescriptor.set)
      }
    }
  }
}

function assertOwnDataGraphsAreDisjoint(firstRoot, secondRoot) {
  const firstObjects = new Set(
    captureOwnDataDescriptorGraph(firstRoot).nodes.map((node) => node.value)
  )
  const secondObjects = captureOwnDataDescriptorGraph(secondRoot).nodes
    .map((node) => node.value)

  for (const secondObject of secondObjects) {
    assert.equal(firstObjects.has(secondObject), false)
  }
}

function assertValueDoesNotContain(value, markers) {
  const seen = new Set()

  function inspect(candidate) {
    if (typeof candidate === 'string') {
      for (const marker of markers) {
        assert.equal(
          candidate.includes(marker),
          false,
          `Transportwert enthält redigierungspflichtigen Marker: ${marker}`
        )
      }
      return
    }

    if (typeof candidate === 'symbol') {
      inspect(candidate.description ?? '')
      return
    }

    if (
      candidate === null ||
      (typeof candidate !== 'object' && typeof candidate !== 'function') ||
      seen.has(candidate)
    ) {
      return
    }

    seen.add(candidate)

    for (const propertyName of IMPORTED_REFLECT_OWN_KEYS(candidate)) {
      inspect(
        typeof propertyName === 'string'
          ? propertyName
          : propertyName.description ?? ''
      )

      const descriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
        candidate,
        propertyName
      )

      if (descriptor && IMPORTED_OBJECT_HAS_OWN(descriptor, 'value')) {
        inspect(descriptor.value)
      }
    }
  }

  inspect(value)
}

function restoreOwnProperty(target, propertyName, descriptor) {
  if (descriptor === undefined) {
    Reflect.deleteProperty(target, propertyName)
    return
  }

  IMPORTED_OBJECT_DEFINE_PROPERTY(target, propertyName, descriptor)
}

function replaceSourceExactlyOnce(source, search, replacement, label) {
  let matchCount = 0
  let searchOffset = 0

  while (true) {
    const matchIndex = source.indexOf(search, searchOffset)

    if (matchIndex === -1) {
      break
    }

    matchCount += 1
    searchOffset = matchIndex + search.length
  }

  assert.equal(matchCount, 1, `${label} muss exakt einen Treffer besitzen`)
  return source.replace(search, replacement)
}

async function withTemporaryBrowserSyncTransportSources({
  contractMutations = [],
  transportMutations = [],
}, callback) {
  const temporaryRoot = await mkdtemp(
    path.join(tmpdir(), 'goldendawn-browser-sync-transport-regression-')
  )

  try {
    const transportDirectory = path.join(temporaryRoot, 'src', 'transports')
    const contractDirectory = path.join(temporaryRoot, 'src', 'contracts')
    let transportSource = await readFile(
      new URL('../src/transports/browserSyncTransport.js', import.meta.url),
      'utf8'
    )
    let contractSource = await readFile(
      new URL('../src/contracts/syncContract.js', import.meta.url),
      'utf8'
    )

    transportSource = transportSource.replaceAll('\r\n', '\n')
    contractSource = contractSource.replaceAll('\r\n', '\n')

    for (const mutation of transportMutations) {
      transportSource = replaceSourceExactlyOnce(
        transportSource,
        mutation.search,
        mutation.replacement,
        mutation.label
      )
    }

    for (const mutation of contractMutations) {
      contractSource = replaceSourceExactlyOnce(
        contractSource,
        mutation.search,
        mutation.replacement,
        mutation.label
      )
    }

    await mkdir(transportDirectory, { recursive: true })
    await mkdir(contractDirectory, { recursive: true })
    await writeFile(
      path.join(temporaryRoot, 'package.json'),
      '{"type":"module"}\n',
      'utf8'
    )
    await writeFile(
      path.join(transportDirectory, 'browserSyncTransport.js'),
      transportSource,
      'utf8'
    )
    await writeFile(
      path.join(contractDirectory, 'syncContract.js'),
      contractSource,
      'utf8'
    )

    const imported = await import(
      `${pathToFileURL(path.join(
        transportDirectory,
        'browserSyncTransport.js'
      )).href}?fixture=${freshImportNumber += 1}`
    )

    await callback(imported.createBrowserSyncTransport)
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true })
  }
}

async function withTemporaryBrowserSyncTransport(mutations, callback) {
  return withTemporaryBrowserSyncTransportSources({
    transportMutations: mutations,
  }, callback)
}

async function importFreshBrowserSyncTransport(label) {
  freshImportNumber += 1
  return import(
    `../src/transports/browserSyncTransport.js?${label}=${freshImportNumber}`
  )
}

function assertNativeTransportPromise(value) {
  assert.equal(utilTypes.isPromise(value), true)
  assert.strictEqual(
    IMPORTED_OBJECT_GET_PROTOTYPE_OF(value),
    IMPORTED_PROMISE_PROTOTYPE
  )
}

async function captureSettlement(promise) {
  try {
    return { status: 'fulfilled', value: await promise }
  } catch (reason) {
    return { reason, status: 'rejected' }
  }
}

function assertTransportErrorRecord(reason, markers = []) {
  assert.deepEqual(reason, EXPECTED_TRANSPORT_ERROR)
  assertExactFrozenOwnDataRecord(reason, TRANSPORT_ERROR_PROPERTY_NAMES)
  assertDeepFrozen(reason)
  assertValueDoesNotContain(reason, markers)
}

async function assertTransportFailure(promise, markers = []) {
  assertNativeTransportPromise(promise)
  const settlement = await captureSettlement(promise)

  assert.equal(settlement.status, 'rejected')
  assertTransportErrorRecord(settlement.reason, markers)
  return settlement.reason
}

async function assertTransportSuccess(promise, expectedValue) {
  assertNativeTransportPromise(promise)
  const settlement = await captureSettlement(promise)

  assert.equal(settlement.status, 'fulfilled')
  assert.deepEqual(settlement.value, expectedValue)
  return settlement.value
}

function assertNoRequestSideEffects(calls) {
  assert.equal(calls.createAbortController.length, 0)
  assert.equal(calls.setDeadlineTimer.length, 0)
  assert.equal(calls.fetchRequest.length, 0)
  assert.equal(calls.clearDeadlineTimer.length, 0)
  assert.equal(calls.abortMethod.length, 0)
}

function createCoercionProbe(label) {
  const calls = {
    symbolToPrimitive: 0,
    toString: 0,
    valueOf: 0,
  }
  const value = {
    toString() {
      calls.toString += 1
      throw new Error(`${label}-to-string-private-sentinel`)
    },
    valueOf() {
      calls.valueOf += 1
      throw new Error(`${label}-value-of-private-sentinel`)
    },
    [Symbol.toPrimitive]() {
      calls.symbolToPrimitive += 1
      throw new Error(`${label}-symbol-to-primitive-private-sentinel`)
    },
  }

  return { calls, value }
}

async function waitForCondition(predicate, label, maximumTurns = 40) {
  for (let turn = 0; turn < maximumTurns; turn += 1) {
    if (predicate()) {
      return
    }

    await createNativePromise((resolve) => {
      IMPORTED_SET_IMMEDIATE(resolve)
    })
  }

  assert.fail(`${label} wurde nicht rechtzeitig erreicht`)
}

async function captureConsoleCalls(run) {
  const methodNames = ['log', 'info', 'warn', 'error', 'debug', 'trace']
  const calls = []
  const descriptors = methodNames.map((methodName) => [
    methodName,
    IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(console, methodName),
  ])

  try {
    for (const methodName of methodNames) {
      IMPORTED_OBJECT_DEFINE_PROPERTY(console, methodName, {
        configurable: true,
        writable: true,
        value(...args) {
          calls.push({ args, methodName, receiver: this })
        },
      })
    }

    await run()
  } finally {
    for (const [methodName, descriptor] of descriptors) {
      restoreOwnProperty(console, methodName, descriptor)
    }
  }

  return calls
}

test('exportiert ausschließlich die frische eingefrorene BrowserSyncTransport-API', () => {
  assert.deepEqual(Object.keys(browserSyncTransportModule), [
    'createBrowserSyncTransport',
  ])
  assert.equal(Object.hasOwn(browserSyncTransportModule, 'default'), false)
  assert.equal(typeof createBrowserSyncTransport, 'function')
  assert.equal(createBrowserSyncTransport.length, 1)

  const first = createTransportSystem().transport
  const second = createTransportSystem().transport

  assert.notStrictEqual(first, second)
  assertExactFrozenOwnDataRecord(first, API_PROPERTY_NAMES)
  assertExactFrozenOwnDataRecord(second, API_PROPERTY_NAMES)
  assert.equal(first.sendSyncRequest.length, 1)
})

test('führt einen gültigen kontrollierten syncTest vollständig bis zum geparsten Wert', async () => {
  const system = createTransportSystem()

  await assertTransportSuccess(
    system.transport.sendSyncRequest(createRequest()),
    null
  )

  assert.equal(system.calls.createAbortController.length, 1)
  assert.equal(system.calls.setDeadlineTimer.length, 1)
  assert.equal(system.calls.fetchRequest.length, 1)
  assert.equal(system.calls.clearDeadlineTimer.length, 1)
  assert.equal(system.calls.abortMethod.length, 0)
})

test('bleibt bei Import und Factoryerzeugung laufzeitinaktiv und unkomponiert', { concurrency: false }, async () => {
  const source = await readFile(
    new URL('../src/transports/browserSyncTransport.js', import.meta.url),
    'utf8'
  )
  const mainSource = await readFile(
    new URL('../src/main.js', import.meta.url),
    'utf8'
  )
  const calls = []
  function TextEncoderProbe() {
    calls.push('TextEncoder')
  }
  TextEncoderProbe.prototype.encode = function encode() {}
  function TextDecoderProbe() {
    calls.push('TextDecoder')
  }
  TextDecoderProbe.prototype.decode = function decode() {}
  const replacements = [
    [globalThis, 'fetch', function fetchProbe() {
      calls.push('fetch')
    }],
    [globalThis, 'AbortController', function abortControllerProbe() {
      calls.push('AbortController')
    }],
    [globalThis, 'setTimeout', function setTimeoutProbe() {
      calls.push('setTimeout')
    }],
    [globalThis, 'clearTimeout', function clearTimeoutProbe() {
      calls.push('clearTimeout')
    }],
    [globalThis, 'TextEncoder', TextEncoderProbe],
    [globalThis, 'TextDecoder', TextDecoderProbe],
  ]
  const originals = []

  try {
    for (const [target, propertyName, value] of replacements) {
      const descriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
        target,
        propertyName
      )
      originals.push([target, propertyName, descriptor])
      IMPORTED_OBJECT_DEFINE_PROPERTY(target, propertyName, {
        ...descriptor,
        value,
      })
    }

    const imported = await importFreshBrowserSyncTransport('inactivity')
    const transport = imported.createBrowserSyncTransport()
    assertExactFrozenOwnDataRecord(transport, API_PROPERTY_NAMES)
  } finally {
    for (const [target, propertyName, descriptor] of originals.reverse()) {
      restoreOwnProperty(target, propertyName, descriptor)
    }
  }

  assert.deepEqual(calls, [])
  assert.match(source, /from '\.\.\/contracts\/syncContract\.js'/u)
  assert.doesNotMatch(source, /\bObject\.setPrototypeOf\b/u)
  assert.doesNotMatch(
    source,
    /(?:from\s+['"]node:|localStorage|sessionStorage|indexedDB|caches\.|CacheStorage|WebSocket|XMLHttpRequest|EventSource|BroadcastChannel|SharedWorker|ServiceWorker|sendBeacon|addEventListener|removeEventListener|navigator\.|document\.|window\.|process\.env|import\.meta\.env|console\.|Authorization|cookie|telemetr|OpenAI|Provider|n8n)/iu
  )
  assert.doesNotMatch(
    mainSource,
    /(?:browserSyncTransport\.js|createBrowserSyncTransport)/u
  )
})

test('verwendet den nullargumentigen Defaultpfad ausschließlich über importseitig erfasste Browserfunktionen und deren native Receiver', { concurrency: false }, async () => {
  const responseFixture = createResponseFixture()
  const responsePromise = createResolvedNativePromise(responseFixture.response)
  const timerHandle = { fixture: 'default-timer-handle' }
  const calls = {
    abortController: [],
    clearTimeout: [],
    fetch: [],
    setTimeout: [],
  }

  function FetchProbe(endpoint, requestInit) {
    calls.fetch.push({
      args: [...arguments],
      endpoint,
      receiver: this,
      requestInit,
    })
    return responsePromise
  }

  function AbortControllerProbe() {
    calls.abortController.push({
      args: [...arguments],
      newTarget: new.target,
    })
    this.signal = { fixture: 'default-signal' }
    this.abort = function abort() {}
  }

  function SetTimeoutProbe(onDeadline, milliseconds) {
    calls.setTimeout.push({
      args: [...arguments],
      milliseconds,
      onDeadline,
      receiver: this,
    })
    return timerHandle
  }

  function ClearTimeoutProbe(handle) {
    calls.clearTimeout.push({
      args: [...arguments],
      handle,
      receiver: this,
    })
  }

  const replacements = [
    [globalThis, 'fetch', FetchProbe],
    [globalThis, 'AbortController', AbortControllerProbe],
    [globalThis, 'setTimeout', SetTimeoutProbe],
    [globalThis, 'clearTimeout', ClearTimeoutProbe],
  ]
  const originals = replacements.map(([target, propertyName]) => [
    target,
    propertyName,
    IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(target, propertyName),
  ])
  let imported

  try {
    for (const [target, propertyName, value] of replacements) {
      const descriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
        target,
        propertyName
      )
      IMPORTED_OBJECT_DEFINE_PROPERTY(target, propertyName, {
        ...descriptor,
        value,
      })
    }
    imported = await importFreshBrowserSyncTransport('controlled-defaults')
  } finally {
    for (const [target, propertyName, descriptor] of originals.reverse()) {
      restoreOwnProperty(target, propertyName, descriptor)
    }
  }

  const transport = imported.createBrowserSyncTransport()
  assert.deepEqual(calls, {
    abortController: [],
    clearTimeout: [],
    fetch: [],
    setTimeout: [],
  })

  await assertTransportSuccess(transport.sendSyncRequest(createRequest()), null)

  assert.equal(calls.abortController.length, 1)
  assert.deepEqual(calls.abortController[0].args, [])
  assert.strictEqual(
    calls.abortController[0].newTarget,
    AbortControllerProbe
  )
  assert.equal(calls.setTimeout.length, 1)
  assert.strictEqual(calls.setTimeout[0].receiver, globalThis)
  assert.equal(calls.setTimeout[0].args.length, 2)
  assert.equal(calls.setTimeout[0].milliseconds, DEADLINE_MS)
  assert.equal(typeof calls.setTimeout[0].onDeadline, 'function')
  assert.equal(calls.fetch.length, 1)
  assert.strictEqual(calls.fetch[0].receiver, globalThis)
  assert.equal(calls.fetch[0].args.length, 2)
  assert.equal(calls.fetch[0].endpoint, FIXED_ENDPOINT)
  assert.equal(calls.clearTimeout.length, 1)
  assert.strictEqual(calls.clearTimeout[0].receiver, globalThis)
  assert.deepEqual(calls.clearTimeout[0].args, [timerHandle])
})

test('erfasst ausschließlich das exakte Vier-Felder-Compositionrecord descriptorbasiert ohne Factoryaufruf oder spätere Rereads', async () => {
  const events = []
  const invocations = {
    clearDeadlineTimer: 0,
    createAbortController: 0,
    fetchRequest: 0,
    setDeadlineTimer: 0,
  }
  const responseFixture = createResponseFixture()
  const controller = { signal: {} }
  controller.abort = function abort() {}
  const target = {
    fetchRequest() {
      invocations.fetchRequest += 1
      return createResolvedNativePromise(responseFixture.response)
    },
    createAbortController() {
      invocations.createAbortController += 1
      return controller
    },
    setDeadlineTimer() {
      invocations.setDeadlineTimer += 1
      return { fixture: 'captured-composition-handle' }
    },
    clearDeadlineTimer() {
      invocations.clearDeadlineTimer += 1
    },
  }
  const composition = new Proxy(target, {
    ownKeys(proxyTarget) {
      events.push('ownKeys')
      return IMPORTED_REFLECT_OWN_KEYS(proxyTarget)
    },
    getPrototypeOf(proxyTarget) {
      events.push('getPrototypeOf')
      return IMPORTED_OBJECT_GET_PROTOTYPE_OF(proxyTarget)
    },
    getOwnPropertyDescriptor(proxyTarget, propertyName) {
      events.push(`descriptor:${String(propertyName)}`)
      return IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
        proxyTarget,
        propertyName
      )
    },
    get() {
      assert.fail('Composition-Properties dürfen nicht frei gelesen werden')
    },
  })

  const transport = createBrowserSyncTransport(composition)

  assertExactFrozenOwnDataRecord(transport, API_PROPERTY_NAMES)
  assert.deepEqual(invocations, {
    clearDeadlineTimer: 0,
    createAbortController: 0,
    fetchRequest: 0,
    setDeadlineTimer: 0,
  })
  assert.deepEqual(events, [
    'ownKeys',
    'getPrototypeOf',
    'descriptor:fetchRequest',
    'descriptor:createAbortController',
    'descriptor:setDeadlineTimer',
    'descriptor:clearDeadlineTimer',
  ])

  for (const propertyName of Object.keys(target)) {
    target[propertyName] = function replacedCompositionSeam() {
      assert.fail(`Composition-Reread von ${propertyName}`)
    }
  }

  await assertTransportSuccess(transport.sendSyncRequest(createRequest()), null)
  assert.deepEqual(invocations, {
    clearDeadlineTimer: 1,
    createAbortController: 1,
    fetchRequest: 1,
    setDeadlineTimer: 1,
  })
  assert.deepEqual(events, [
    'ownKeys',
    'getPrototypeOf',
    'descriptor:fetchRequest',
    'descriptor:createAbortController',
    'descriptor:setDeadlineTimer',
    'descriptor:clearDeadlineTimer',
  ])
})

test('weist jede ungültige Factorykomposition statisch und redigiert vor API-Ausgabe zurück', { concurrency: false }, async (t) => {
  const validComposition = {
    fetchRequest() {},
    createAbortController() {},
    setDeadlineTimer() {},
    clearDeadlineTimer() {},
  }
  let accessorCalls = 0
  const accessorComposition = { ...validComposition }
  IMPORTED_OBJECT_DEFINE_PROPERTY(accessorComposition, 'fetchRequest', {
    configurable: true,
    enumerable: true,
    get() {
      accessorCalls += 1
      throw new Error('factory-accessor-private-sentinel')
    },
  })
  const missingComposition = { ...validComposition }
  delete missingComposition.clearDeadlineTimer
  const nonEnumerableComposition = { ...validComposition }
  IMPORTED_OBJECT_DEFINE_PROPERTY(
    nonEnumerableComposition,
    'clearDeadlineTimer',
    {
      configurable: true,
      enumerable: false,
      value: validComposition.clearDeadlineTimer,
      writable: true,
    }
  )
  const cases = [
    ['explizites undefined', () => createBrowserSyncTransport(undefined)],
    ['zusätzliches Argument', () => createBrowserSyncTransport(validComposition, {})],
    ['null', () => createBrowserSyncTransport(null)],
    ['Array', () => createBrowserSyncTransport([])],
    ['Null-Prototyp', () => createBrowserSyncTransport(Object.assign(
      Object.create(null),
      validComposition
    ))],
    ['tatsächlich fehlendes Feld', () => createBrowserSyncTransport(
      missingComposition
    )],
    ['nichtfunktionales Feld', () => createBrowserSyncTransport({
      ...validComposition,
      clearDeadlineTimer: undefined,
    })],
    ['nicht aufzählbares Feld', () => createBrowserSyncTransport(
      nonEnumerableComposition
    )],
    ['Zusatzfeld', () => createBrowserSyncTransport({
      ...validComposition,
      extra: true,
    })],
    ['Symbolfeld', () => createBrowserSyncTransport({
      ...validComposition,
      [Symbol('factory-private-sentinel')]: true,
    })],
    ['Accessor', () => createBrowserSyncTransport(accessorComposition)],
    ['Reflection-Throw', () => createBrowserSyncTransport(new Proxy(
      validComposition,
      { ownKeys() { throw new Error('factory-proxy-private-sentinel') } }
    ))],
    ['Prototyp-Reflection-Throw', () => createBrowserSyncTransport(new Proxy(
      validComposition,
      {
        getPrototypeOf() {
          throw new Error('factory-prototype-private-sentinel')
        },
      }
    ))],
    ['Descriptor-Reflection-Throw', () => createBrowserSyncTransport(new Proxy(
      validComposition,
      {
        getOwnPropertyDescriptor() {
          throw new Error('factory-descriptor-private-sentinel')
        },
      }
    ))],
  ]

  for (const [label, invoke] of cases) {
    await t.test(label, () => {
      assert.throws(invoke, (error) => (
        error instanceof TypeError && error.message === EXPECTED_FACTORY_ERROR
      ))
    })
  }

  assert.equal(accessorCalls, 0)

  const descriptorEvents = []
  const inconsistentComposition = new Proxy(validComposition, {
    ownKeys(target) {
      return IMPORTED_REFLECT_OWN_KEYS(target)
    },
    getPrototypeOf(target) {
      return IMPORTED_OBJECT_GET_PROTOTYPE_OF(target)
    },
    getOwnPropertyDescriptor(target, propertyName) {
      descriptorEvents.push(propertyName)
      if (propertyName === 'fetchRequest') {
        return undefined
      }
      return IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(target, propertyName)
    },
  })
  assert.throws(
    () => createBrowserSyncTransport(inconsistentComposition),
    { name: 'TypeError', message: EXPECTED_FACTORY_ERROR }
  )
  assert.deepEqual(descriptorEvents, [
    'fetchRequest',
    'createAbortController',
    'setDeadlineTimer',
    'clearDeadlineTimer',
  ])

  for (const propertyName of [
    'fetch',
    'AbortController',
    'setTimeout',
    'clearTimeout',
  ]) {
    await t.test(`fehlender Default ${propertyName}`, async () => {
      const original = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
        globalThis,
        propertyName
      )
      let imported

      try {
        IMPORTED_OBJECT_DEFINE_PROPERTY(globalThis, propertyName, {
          ...original,
          value: undefined,
        })
        imported = await importFreshBrowserSyncTransport(
          `missing-${propertyName}`
        )
      } finally {
        restoreOwnProperty(globalThis, propertyName, original)
      }

      assert.throws(
        () => imported.createBrowserSyncTransport(),
        { name: 'TypeError', message: EXPECTED_FACTORY_ERROR }
      )
    })
  }
})

test('liefert für jede Methodenarity sofort ein natives Promise und prüft falsche Arity vor Input und Seams', async () => {
  const system = createTransportSystem()
  let inputTrapCalls = 0
  const requestProxy = new Proxy(createRequest(), {
    ownKeys() {
      inputTrapCalls += 1
      throw new Error('arity-input-private-sentinel')
    },
  })
  const noArgumentResult = system.transport.sendSyncRequest()
  const additionalArgumentResult = system.transport.sendSyncRequest(
    requestProxy,
    'arity-extra-private-sentinel'
  )

  await assertTransportFailure(noArgumentResult, ['arity-input-private-sentinel'])
  await assertTransportFailure(additionalArgumentResult, [
    'arity-input-private-sentinel',
    'arity-extra-private-sentinel',
  ])
  assert.equal(inputTrapCalls, 0)
  assertNoRequestSideEffects(system.calls)
})

test('verwendet über unabhängige Factory- und Fehlerpfade exakt dieselbe statische Transportfehleridentität', async () => {
  const firstSystem = createTransportSystem()
  const secondSystem = createTransportSystem({
    fetchImplementation() {
      return createRejectedNativePromise(
        new Error('static-error-identity-private-sentinel')
      )
    },
  })
  const arityReason = await assertTransportFailure(
    firstSystem.transport.sendSyncRequest()
  )
  const requestReason = await assertTransportFailure(
    firstSystem.transport.sendSyncRequest(createRequest({ requestId: 'invalid' }))
  )
  const fetchReason = await assertTransportFailure(
    secondSystem.transport.sendSyncRequest(createRequest()),
    ['static-error-identity-private-sentinel']
  )

  assert.strictEqual(requestReason, arityReason)
  assert.strictEqual(fetchReason, arityReason)
})

test('erfasst Root und Payload genau einmal in der festgelegten Reflectionreihenfolge und liest keine Callerproperty frei', async () => {
  const events = []
  const payloadTarget = {}
  const payload = new Proxy(payloadTarget, {
    ownKeys(target) {
      events.push('payload:ownKeys')
      return IMPORTED_REFLECT_OWN_KEYS(target)
    },
    getPrototypeOf(target) {
      events.push('payload:getPrototypeOf')
      return IMPORTED_OBJECT_GET_PROTOTYPE_OF(target)
    },
    get() {
      assert.fail('Payload darf nicht frei gelesen werden')
    },
  })
  const requestTarget = createRequest({ payload })
  const request = new Proxy(requestTarget, {
    ownKeys(target) {
      events.push('root:ownKeys')
      return IMPORTED_REFLECT_OWN_KEYS(target)
    },
    getPrototypeOf(target) {
      events.push('root:getPrototypeOf')
      return IMPORTED_OBJECT_GET_PROTOTYPE_OF(target)
    },
    getOwnPropertyDescriptor(target, propertyName) {
      events.push(`root:descriptor:${String(propertyName)}`)
      return IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(target, propertyName)
    },
    get() {
      assert.fail('Request darf nicht frei gelesen werden')
    },
  })
  const before = captureOwnDataDescriptorGraph(requestTarget)
  events.length = 0
  const system = createTransportSystem()

  await assertTransportSuccess(system.transport.sendSyncRequest(request), null)

  assert.deepEqual(events, [
    'root:ownKeys',
    'root:getPrototypeOf',
    'root:descriptor:version',
    'root:descriptor:action',
    'root:descriptor:source',
    'root:descriptor:requestId',
    'root:descriptor:timestamp',
    'root:descriptor:payload',
    'payload:ownKeys',
    'payload:getPrototypeOf',
  ])
  assertOwnDataDescriptorGraphUnchanged(before)
  assert.equal(IMPORTED_OBJECT_IS_FROZEN(requestTarget), false)
  assert.equal(IMPORTED_OBJECT_IS_FROZEN(payloadTarget), false)

  const projectedRequest = parseFixture(
    system.calls.fetchRequest[0].requestInit.body
  )
  assert.deepEqual(projectedRequest, createRequest())
  assertOwnDataGraphsAreDisjoint(requestTarget, projectedRequest)
})

test('weist fehlende zusätzliche symbolische accessorbasierte und prototypfremde Requestformen vor jeder Nebenwirkung zurück', async (t) => {
  let accessorCalls = 0
  const accessorRequest = createRequest()
  IMPORTED_OBJECT_DEFINE_PROPERTY(accessorRequest, 'requestId', {
    configurable: true,
    enumerable: true,
    get() {
      accessorCalls += 1
      throw new Error('request-accessor-private-sentinel')
    },
  })
  const payloadSymbol = createRequest()
  payloadSymbol.payload[Symbol('payload-private-sentinel')] = true
  const rootSymbol = createRequest()
  rootSymbol[Symbol('root-private-sentinel')] = true
  const missing = createRequest()
  delete missing.source
  const extra = createRequest({ extra: true })
  const nullPrototype = Object.assign(Object.create(null), createRequest())
  const nonEnumerableRoot = createRequest()
  IMPORTED_OBJECT_DEFINE_PROPERTY(nonEnumerableRoot, 'source', {
    configurable: true,
    enumerable: false,
    value: nonEnumerableRoot.source,
    writable: true,
  })
  const nonEnumerablePayload = createRequest()
  IMPORTED_OBJECT_DEFINE_PROPERTY(nonEnumerablePayload.payload, 'hidden', {
    configurable: true,
    enumerable: false,
    value: true,
    writable: true,
  })
  const rootToJson = createRequest()
  IMPORTED_OBJECT_DEFINE_PROPERTY(rootToJson, 'toJSON', {
    configurable: true,
    enumerable: false,
    value() { return null },
    writable: true,
  })
  const payloadToJson = createRequest()
  IMPORTED_OBJECT_DEFINE_PROPERTY(payloadToJson.payload, 'toJSON', {
    configurable: true,
    enumerable: false,
    value() { return null },
    writable: true,
  })
  const cases = [
    ['null', null],
    ['Array', []],
    ['Null-Prototyp-Root', nullPrototype],
    ['fehlendes Feld', missing],
    ['nicht aufzählbares Rootfeld', nonEnumerableRoot],
    ['Zusatzfeld', extra],
    ['Rootsymbol', rootSymbol],
    ['Rootaccessor', accessorRequest],
    ['null-Payload', createRequest({ payload: null })],
    ['Array-Payload', createRequest({ payload: [] })],
    ['Null-Prototyp-Payload', createRequest({ payload: Object.create(null) })],
    ['Payload-Zusatzfeld', createRequest({ payload: { extra: true } })],
    ['nicht aufzählbares Payloadfeld', nonEnumerablePayload],
    ['Payloadsymbol', payloadSymbol],
    ['eigene Root-toJSON-Property', rootToJson],
    ['eigene Payload-toJSON-Property', payloadToJson],
  ]

  for (const [label, request] of cases) {
    await t.test(label, async () => {
      const system = createTransportSystem()
      await assertTransportFailure(
        system.transport.sendSyncRequest(request),
        ['request-accessor-private-sentinel', 'payload-private-sentinel']
      )
      assertNoRequestSideEffects(system.calls)
    })
  }

  assert.equal(accessorCalls, 0)
})

test('behandelt stateful Requestdeskriptoren als einmaligen autoritativen Snapshot und weist Reflectionthrows sowie inkonsistente ABA-Beobachtungen früh zurück', async (t) => {
  await t.test('stateful Descriptor wird exakt einmal verwendet', async () => {
    const requestTarget = createRequest()
    const descriptorCounts = Object.create(null)
    const request = new Proxy(requestTarget, {
      ownKeys(target) {
        return IMPORTED_REFLECT_OWN_KEYS(target)
      },
      getPrototypeOf(target) {
        return IMPORTED_OBJECT_GET_PROTOTYPE_OF(target)
      },
      getOwnPropertyDescriptor(target, propertyName) {
        descriptorCounts[propertyName] =
          (descriptorCounts[propertyName] ?? 0) + 1
        const descriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
          target,
          propertyName
        )

        if (propertyName === 'requestId') {
          target.requestId = 'invalid-after-snapshot'
        }

        return descriptor
      },
      get() {
        assert.fail('Stateful Request darf nicht frei gelesen werden')
      },
    })
    const system = createTransportSystem()

    await assertTransportSuccess(system.transport.sendSyncRequest(request), null)
    assert.deepEqual(
      Object.fromEntries(Object.entries(descriptorCounts)),
      Object.fromEntries(REQUEST_PROPERTY_NAMES.map((propertyName) => [
        propertyName,
        1,
      ]))
    )
    assert.equal(
      parseFixture(system.calls.fetchRequest[0].requestInit.body).requestId,
      REQUEST_ID
    )
    assert.equal(requestTarget.requestId, 'invalid-after-snapshot')
  })

  await t.test('inkonsistente ABA-Deskriptoren werden vollständig einmal erfasst', async () => {
    const descriptorEvents = []
    const target = createRequest()
    const request = new Proxy(target, {
      ownKeys(proxyTarget) {
        return IMPORTED_REFLECT_OWN_KEYS(proxyTarget)
      },
      getPrototypeOf(proxyTarget) {
        return IMPORTED_OBJECT_GET_PROTOTYPE_OF(proxyTarget)
      },
      getOwnPropertyDescriptor(proxyTarget, propertyName) {
        descriptorEvents.push(propertyName)
        if (propertyName === 'source') {
          return undefined
        }
        return IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
          proxyTarget,
          propertyName
        )
      },
    })
    const system = createTransportSystem()

    await assertTransportFailure(system.transport.sendSyncRequest(request))
    assertNoRequestSideEffects(system.calls)
    assert.deepEqual(descriptorEvents, REQUEST_PROPERTY_NAMES)
  })

  const throwingCases = [
    ['Root-OwnKeys-Throw', new Proxy(createRequest(), {
      ownKeys() { throw new Error('request-own-keys-private-sentinel') },
    })],
    ['Root-Prototyp-Throw', new Proxy(createRequest(), {
      getPrototypeOf() {
        throw new Error('request-prototype-private-sentinel')
      },
    })],
    ['Root-Descriptor-Throw', new Proxy(createRequest(), {
      getOwnPropertyDescriptor(target, propertyName) {
        if (propertyName === 'source') {
          throw new Error('request-descriptor-private-sentinel')
        }
        return IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(target, propertyName)
      },
    })],
    ['Payload-OwnKeys-Throw', createRequest({
      payload: new Proxy({}, {
        ownKeys() { throw new Error('payload-own-keys-private-sentinel') },
      }),
    })],
    ['Payload-Prototyp-Throw', createRequest({
      payload: new Proxy({}, {
        getPrototypeOf() {
          throw new Error('payload-prototype-private-sentinel')
        },
      }),
    })],
  ]

  for (const [label, request] of throwingCases) {
    await t.test(label, async () => {
      const system = createTransportSystem()
      await assertTransportFailure(
        system.transport.sendSyncRequest(request),
        ['request-', 'payload-', 'private-sentinel']
      )
      assertNoRequestSideEffects(system.calls)
    })
  }
})

test('konvertiert primitive Requestfelder niemals und lehnt jede Contractabweichung vor Controller Timer und Fetch ab', async (t) => {
  const probes = REQUEST_PROPERTY_NAMES.slice(0, 5).map((propertyName) => ({
    propertyName,
    probe: createCoercionProbe(propertyName),
  }))
  const cases = [
    ...probes.map(({ propertyName, probe }) => [
      `nicht primitiver Wert ${propertyName}`,
      createRequest({ [propertyName]: probe.value }),
    ]),
    ['falsche Version', createRequest({ version: '2.0' })],
    ['falsche Aktion', createRequest({ action: 'futureAction' })],
    ['falsche Quelle', createRequest({ source: 'fixture-source' })],
    ['ungültige ID', createRequest({ requestId: 'fixture-id' })],
    ['nichtkanonische Zeit', createRequest({ timestamp: '2031-04-05' })],
  ]

  for (const [label, request] of cases) {
    await t.test(label, async () => {
      const system = createTransportSystem()
      await assertTransportFailure(system.transport.sendSyncRequest(request))
      assertNoRequestSideEffects(system.calls)
    })
  }

  for (const { probe } of probes) {
    assert.deepEqual(probe.calls, {
      symbolToPrimitive: 0,
      toString: 0,
      valueOf: 0,
    })
  }
})

test('validiert ausschließlich denselben frischen Requestgraph genau einmal vor und nach seinem Deep Freeze mit derselben Referenzzeit', { concurrency: false }, async () => {
  const originalDescriptorMethod = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
    Object,
    'getOwnPropertyDescriptor'
  )
  const originalStringifyDescriptor =
    IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(JSON, 'stringify')
  const originalDateParseDescriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
    Date,
    'parse'
  )
  const originalDescriptorFunction = originalDescriptorMethod.value
  const originalDateParse = originalDateParseDescriptor.value
  const validationTargets = []
  const stringifiedTargets = []
  const parsedTimestamps = []
  const caller = createRequest()
  let imported
  let result

  try {
    IMPORTED_OBJECT_DEFINE_PROPERTY(JSON, 'stringify', {
      ...originalStringifyDescriptor,
      value(value) {
        stringifiedTargets.push(value)
        return IMPORTED_REFLECT_APPLY(
          originalStringifyDescriptor.value,
          JSON,
          [...arguments]
        )
      },
    })
    imported = await importFreshBrowserSyncTransport(
      'validator-serialization-identity'
    )
  } finally {
    restoreOwnProperty(JSON, 'stringify', originalStringifyDescriptor)
  }

  const system = createTransportSystem({
    factory: imported.createBrowserSyncTransport,
  })

  try {
    IMPORTED_OBJECT_DEFINE_PROPERTY(Object, 'getOwnPropertyDescriptor', {
      ...originalDescriptorMethod,
      value(value, propertyName) {
        if (
          propertyName === 'version' &&
          value !== null &&
          typeof value === 'object'
        ) {
          const ownKeys = IMPORTED_REFLECT_OWN_KEYS(value)

          if (
            ownKeys.length === REQUEST_PROPERTY_NAMES.length &&
            REQUEST_PROPERTY_NAMES.every((name) => ownKeys.includes(name))
          ) {
            const payload = IMPORTED_REFLECT_APPLY(
              originalDescriptorFunction,
              Object,
              [value, 'payload']
            ).value
            validationTargets.push({
              frozen: IMPORTED_OBJECT_IS_FROZEN(value),
              payload,
              payloadFrozen: IMPORTED_OBJECT_IS_FROZEN(payload),
              payloadPrototype: IMPORTED_OBJECT_GET_PROTOTYPE_OF(payload),
              prototype: IMPORTED_OBJECT_GET_PROTOTYPE_OF(value),
              value,
            })
          }
        }

        return IMPORTED_REFLECT_APPLY(
          originalDescriptorFunction,
          Object,
          [value, propertyName]
        )
      },
    })
    IMPORTED_OBJECT_DEFINE_PROPERTY(Date, 'parse', {
      ...originalDateParseDescriptor,
      value(timestamp) {
        parsedTimestamps.push(timestamp)
        return IMPORTED_REFLECT_APPLY(originalDateParse, Date, [timestamp])
      },
    })

    result = await captureSettlement(system.transport.sendSyncRequest(caller))
  } finally {
    restoreOwnProperty(Date, 'parse', originalDateParseDescriptor)
    restoreOwnProperty(
      Object,
      'getOwnPropertyDescriptor',
      originalDescriptorMethod
    )
  }

  assert.equal(result.status, 'fulfilled')
  assert.equal(validationTargets.length, 2)
  assert.notStrictEqual(validationTargets[0].value, caller)
  assert.strictEqual(validationTargets[0].value, validationTargets[1].value)
  assert.notStrictEqual(validationTargets[0].payload, caller.payload)
  assert.strictEqual(
    validationTargets[0].payload,
    validationTargets[1].payload
  )
  assert.strictEqual(validationTargets[0].prototype, Object.prototype)
  assert.strictEqual(validationTargets[1].prototype, Object.prototype)
  assert.strictEqual(validationTargets[0].payloadPrototype, Object.prototype)
  assert.strictEqual(validationTargets[1].payloadPrototype, Object.prototype)
  assert.equal(stringifiedTargets.length, 1)
  assert.strictEqual(stringifiedTargets[0], validationTargets[0].value)
  assert.deepEqual(
    validationTargets.map(({ frozen, payloadFrozen }) => ({
      frozen,
      payloadFrozen,
    })),
    [
      { frozen: false, payloadFrozen: false },
      { frozen: true, payloadFrozen: true },
    ]
  )
  assert.deepEqual(parsedTimestamps, [
    REQUEST_TIMESTAMP,
    REQUEST_TIMESTAMP,
    REQUEST_TIMESTAMP,
    REQUEST_TIMESTAMP,
  ])
})

test('stringifiziert und codiert den frischen Request je exakt einmal mit den erfassten Methoden und richtigen Receivern', { concurrency: false }, async () => {
  const stringifyDescriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
    JSON,
    'stringify'
  )
  const encodeDescriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
    TextEncoder.prototype,
    'encode'
  )
  const stringifyCalls = []
  const encodeCalls = []
  let imported

  try {
    IMPORTED_OBJECT_DEFINE_PROPERTY(JSON, 'stringify', {
      ...stringifyDescriptor,
      value(...args) {
        stringifyCalls.push({ args, receiver: this })
        return IMPORTED_REFLECT_APPLY(
          stringifyDescriptor.value,
          JSON,
          args
        )
      },
    })
    IMPORTED_OBJECT_DEFINE_PROPERTY(TextEncoder.prototype, 'encode', {
      ...encodeDescriptor,
      value(...args) {
        encodeCalls.push({ args, receiver: this })
        return IMPORTED_REFLECT_APPLY(
          encodeDescriptor.value,
          this,
          args
        )
      },
    })
    imported = await importFreshBrowserSyncTransport('serialization-capture')
  } finally {
    restoreOwnProperty(TextEncoder.prototype, 'encode', encodeDescriptor)
    restoreOwnProperty(JSON, 'stringify', stringifyDescriptor)
  }

  const system = createTransportSystem({
    factory: imported.createBrowserSyncTransport,
  })
  await assertTransportSuccess(
    system.transport.sendSyncRequest(createRequest()),
    null
  )

  assert.equal(stringifyCalls.length, 1)
  assert.strictEqual(stringifyCalls[0].receiver, JSON)
  assert.equal(stringifyCalls[0].args.length, 1)
  assert.equal(encodeCalls.length, 1)
  assert.equal(encodeCalls[0].args.length, 1)
  assert.equal(encodeCalls[0].args[0], system.calls.fetchRequest[0].requestInit.body)
  assert.equal(encodeCalls[0].receiver instanceof TextEncoder, true)
})

test('führt den maximal gültigen 193-Byte-Request genau einmal bis Fetch und lehnt die 65-Zeichen-ID vor Serialisierung und Nebenwirkungen ab', { concurrency: false }, async () => {
  const stringifyDescriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
    JSON,
    'stringify'
  )
  const encodeDescriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
    TextEncoder.prototype,
    'encode'
  )
  let stringifyCalls = 0
  let encodeCalls = 0
  let imported

  try {
    IMPORTED_OBJECT_DEFINE_PROPERTY(JSON, 'stringify', {
      ...stringifyDescriptor,
      value(...args) {
        stringifyCalls += 1
        return IMPORTED_REFLECT_APPLY(stringifyDescriptor.value, JSON, args)
      },
    })
    IMPORTED_OBJECT_DEFINE_PROPERTY(TextEncoder.prototype, 'encode', {
      ...encodeDescriptor,
      value(...args) {
        encodeCalls += 1
        return IMPORTED_REFLECT_APPLY(encodeDescriptor.value, this, args)
      },
    })
    imported = await importFreshBrowserSyncTransport('request-boundary')
  } finally {
    restoreOwnProperty(TextEncoder.prototype, 'encode', encodeDescriptor)
    restoreOwnProperty(JSON, 'stringify', stringifyDescriptor)
  }

  const rejectedSystem = createTransportSystem({
    factory: imported.createBrowserSyncTransport,
  })
  const dateParseDescriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
    Date,
    'parse'
  )
  let contractTimestampChecks = 0

  try {
    IMPORTED_OBJECT_DEFINE_PROPERTY(Date, 'parse', {
      ...dateParseDescriptor,
      value(timestamp) {
        contractTimestampChecks += 1
        return IMPORTED_REFLECT_APPLY(
          dateParseDescriptor.value,
          Date,
          [timestamp]
        )
      },
    })
    await assertTransportFailure(
      rejectedSystem.transport.sendSyncRequest(createRequest({
        requestId: TOO_LONG_REQUEST_ID,
      }))
    )
  } finally {
    restoreOwnProperty(Date, 'parse', dateParseDescriptor)
  }

  assert.equal(contractTimestampChecks, 4)
  assert.equal(stringifyCalls, 0)
  assert.equal(encodeCalls, 0)
  assertNoRequestSideEffects(rejectedSystem.calls)

  const acceptedSystem = createTransportSystem({
    factory: imported.createBrowserSyncTransport,
  })
  await assertTransportSuccess(
    acceptedSystem.transport.sendSyncRequest(createRequest({
      requestId: MAX_REQUEST_ID,
    })),
    null
  )
  const body = acceptedSystem.calls.fetchRequest[0].requestInit.body
  assert.equal(MAX_REQUEST_ID.length, 64)
  assert.equal(TOO_LONG_REQUEST_ID.length, 65)
  assert.equal(encodeFixture(body).byteLength, 193)
  assert.equal(stringifyCalls, 1)
  assert.equal(encodeCalls, 1)
  assert.equal(acceptedSystem.calls.fetchRequest.length, 1)
})

test('belegt die private Requestcapverdrahtung mit 193 und 192 sowie mutationswirksamen Vergleichsgegenproben in bereinigten Quellkopien', { concurrency: false }, async () => {
  const capAnchor = 'const MAX_REQUEST_BODY_BYTES = 65_536'
  const comparisonAnchor =
    'requestBodyByteLength > MAX_REQUEST_BODY_BYTES'

  async function observeMaxRequest(factory) {
    const system = createTransportSystem({ factory })
    const settlement = await captureSettlement(
      system.transport.sendSyncRequest(createRequest({
        requestId: MAX_REQUEST_ID,
      }))
    )
    return { settlement, system }
  }

  async function assertAccepted(factory) {
    const observation = await observeMaxRequest(factory)
    assert.equal(observation.settlement.status, 'fulfilled')
    assert.equal(observation.system.calls.fetchRequest.length, 1)
    assert.equal(
      encodeFixture(
        observation.system.calls.fetchRequest[0].requestInit.body
      ).byteLength,
      193
    )
  }

  async function assertRejectedBeforeEffects(factory) {
    const observation = await observeMaxRequest(factory)
    assert.equal(observation.settlement.status, 'rejected')
    assertTransportErrorRecord(observation.settlement.reason)
    assertNoRequestSideEffects(observation.system.calls)
  }

  await withTemporaryBrowserSyncTransport([{
    label: 'Requestcap 193',
    search: capAnchor,
    replacement: 'const MAX_REQUEST_BODY_BYTES = 193',
  }], assertAccepted)

  await withTemporaryBrowserSyncTransport([{
    label: 'Requestcap 192',
    search: capAnchor,
    replacement: 'const MAX_REQUEST_BODY_BYTES = 192',
  }], assertRejectedBeforeEffects)

  await withTemporaryBrowserSyncTransport([
    {
      label: 'Requestcap 193 für falschen Operator',
      search: capAnchor,
      replacement: 'const MAX_REQUEST_BODY_BYTES = 193',
    },
    {
      label: 'falscher inklusiver Operator',
      search: comparisonAnchor,
      replacement: 'requestBodyByteLength >= MAX_REQUEST_BODY_BYTES',
    },
  ], async (factory) => {
    await assert.rejects(
      () => assertAccepted(factory),
      (error) => error instanceof assert.AssertionError
    )
  })

  await withTemporaryBrowserSyncTransport([
    {
      label: 'Requestcap 192 für Checkumgehung',
      search: capAnchor,
      replacement: 'const MAX_REQUEST_BODY_BYTES = 192',
    },
    {
      label: 'umgangene Capprüfung',
      search: comparisonAnchor,
      replacement: 'false',
    },
  ], async (factory) => {
    await assert.rejects(
      () => assertRejectedBeforeEffects(factory),
      (error) => error instanceof assert.AssertionError
    )
  })
})

test('erzeugt pro Aufruf den exakten eingefrorenen Fetchgraphen mit festen Werten und ausschließlich der einmal erfassten Signalidentität', async () => {
  const system = createTransportSystem()
  const request = createRequest()
  const callerSnapshot = captureOwnDataDescriptorGraph(request)

  await assertTransportSuccess(system.transport.sendSyncRequest(request), null)

  assert.equal(system.calls.createAbortController.length, 1)
  assert.strictEqual(system.calls.createAbortController[0].receiver, undefined)
  assert.equal(system.calls.createAbortController[0].args.length, 0)
  assert.equal(system.calls.signalResolution.length, 1)
  assert.equal(system.calls.abortResolution.length, 1)
  assert.equal(system.calls.setDeadlineTimer.length, 1)
  assert.strictEqual(system.calls.setDeadlineTimer[0].receiver, undefined)
  assert.equal(system.calls.setDeadlineTimer[0].args.length, 2)
  assert.equal(system.calls.setDeadlineTimer[0].milliseconds, DEADLINE_MS)
  assert.equal(system.calls.fetchRequest.length, 1)
  const fetchCall = system.calls.fetchRequest[0]
  const { requestInit } = fetchCall

  assert.strictEqual(fetchCall.receiver, undefined)
  assert.equal(fetchCall.args.length, 2)
  assert.equal(fetchCall.endpoint, FIXED_ENDPOINT)
  assert.equal(fetchCall.args[0], FIXED_ENDPOINT)
  assert.strictEqual(fetchCall.args[1], requestInit)

  assertExactFrozenOwnDataRecord(
    requestInit,
    REQUEST_INIT_PROPERTY_NAMES,
    { prototype: null }
  )
  assertExactFrozenOwnDataRecord(
    requestInit.headers,
    REQUEST_HEADER_PROPERTY_NAMES,
    { prototype: null }
  )
  assert.deepEqual({
    method: requestInit.method,
    mode: requestInit.mode,
    credentials: requestInit.credentials,
    cache: requestInit.cache,
    redirect: requestInit.redirect,
    referrerPolicy: requestInit.referrerPolicy,
    keepalive: requestInit.keepalive,
    headers: requestInit.headers,
    body: requestInit.body,
    signal: requestInit.signal,
  }, {
    method: 'POST',
    mode: 'cors',
    credentials: 'omit',
    cache: 'no-store',
    redirect: 'error',
    referrerPolicy: 'no-referrer',
    keepalive: false,
    headers: requestInit.headers,
    body: stringifyFixture(request),
    signal: requestInit.signal,
  })
  assert.equal(
    requestInit.headers['Content-Type'],
    'application/json; charset=utf-8'
  )
  assert.strictEqual(
    requestInit.signal,
    system.calls.signalResolution[0].signal
  )
  assert.equal(IMPORTED_OBJECT_IS_FROZEN(requestInit.signal), false)
  assertOwnDataDescriptorGraphUnchanged(callerSnapshot)
  assert.equal(system.calls.clearDeadlineTimer.length, 1)
  assert.strictEqual(system.calls.clearDeadlineTimer[0].receiver, undefined)
  assert.equal(system.calls.clearDeadlineTimer[0].args.length, 1)
  assert.strictEqual(
    system.calls.clearDeadlineTimer[0].timerHandle,
    system.calls.setDeadlineTimer[0].returnedHandle
  )
})

test('weist Controller-, Signal- und Abortauflösungsfehler vor Timer und Fetch statisch zurück', async (t) => {
  const cases = [
    {
      label: 'Controllerthrow',
      implementation() {
        throw new Error('controller-private-sentinel')
      },
    },
    {
      label: 'null-Controller',
      implementation() {
        return null
      },
    },
    {
      label: 'Signalgetterthrow',
      implementation() {
        const controller = { abort() {} }
        IMPORTED_OBJECT_DEFINE_PROPERTY(controller, 'signal', {
          get() { throw new Error('signal-private-sentinel') },
        })
        return controller
      },
    },
    {
      label: 'Abortgetterthrow',
      implementation() {
        const controller = { signal: {} }
        IMPORTED_OBJECT_DEFINE_PROPERTY(controller, 'abort', {
          get() { throw new Error('abort-private-sentinel') },
        })
        return controller
      },
    },
    {
      label: 'nichtfunktionales Abort',
      implementation() {
        return { signal: {}, abort: null }
      },
    },
  ]

  for (const fixture of cases) {
    await t.test(fixture.label, async () => {
      const system = createTransportSystem({
        controllerImplementation: fixture.implementation,
      })
      await assertTransportFailure(
        system.transport.sendSyncRequest(createRequest()),
        ['controller-private-sentinel', 'signal-private-sentinel', 'abort-private-sentinel']
      )
      assert.equal(system.calls.createAbortController.length, 1)
      assert.equal(system.calls.setDeadlineTimer.length, 0)
      assert.equal(system.calls.fetchRequest.length, 0)
      assert.equal(system.calls.clearDeadlineTimer.length, 0)
      assert.equal(system.calls.abortMethod.length, 0)
    })
  }
})

test('lässt eine synchron während der Timerregistrierung gewinnende Deadline vor Fetch terminieren und bereinigt den nachgereichten Handle einmal', async () => {
  const timerHandle = { id: 'deadline-synchronous-handle' }
  const system = createTransportSystem({
    timerImplementation({ onDeadline }) {
      onDeadline()
      return timerHandle
    },
  })

  await assertTransportFailure(
    system.transport.sendSyncRequest(createRequest())
  )

  assert.equal(system.calls.setDeadlineTimer.length, 1)
  assert.equal(system.calls.fetchRequest.length, 0)
  assert.equal(system.calls.abortMethod.length, 0)
  assert.equal(system.calls.clearDeadlineTimer.length, 1)
  assert.strictEqual(
    system.calls.clearDeadlineTimer[0].timerHandle,
    timerHandle
  )
})

test('ordnet Timerthrow und synchrone oder asynchrone Fetchfehler dem ersten terminalen Owner ohne Retry zu', async (t) => {
  const cases = [
    {
      label: 'Timerthrow',
      system: () => createTransportSystem({
        timerImplementation() {
          throw new Error('timer-private-sentinel')
        },
      }),
      expected: { abort: 0, clear: 0, fetch: 0 },
    },
    {
      label: 'synchroner Fetchthrow',
      system: () => createTransportSystem({
        fetchImplementation() {
          throw new Error('fetch-throw-private-sentinel')
        },
      }),
      expected: { abort: 1, clear: 1, fetch: 1 },
    },
    {
      label: 'Fetchrejection',
      system: () => createTransportSystem({
        fetchImplementation() {
          return createRejectedNativePromise(
            new Error('fetch-rejection-private-sentinel')
          )
        },
      }),
      expected: { abort: 1, clear: 1, fetch: 1 },
    },
  ]

  for (const fixture of cases) {
    await t.test(fixture.label, async () => {
      const system = fixture.system()
      await assertTransportFailure(
        system.transport.sendSyncRequest(createRequest()),
        ['timer-private-sentinel', 'fetch-throw-private-sentinel', 'fetch-rejection-private-sentinel']
      )
      assert.equal(system.calls.fetchRequest.length, fixture.expected.fetch)
      assert.equal(system.calls.abortMethod.length, fixture.expected.abort)
      assert.equal(system.calls.clearDeadlineTimer.length, fixture.expected.clear)
      assert.ok(system.calls.fetchRequest.length <= 1)
    })
  }
})

test('Deadline rejectet nie endenden Fetch sofort und ignoriert jedes späte Fetchsettlement ohne Responsezugriff', async () => {
  const fetchDeferred = createDeferred()
  const responseFixture = createResponseFixture({
    instrumentResponseGetters: true,
  })
  const system = createTransportSystem({
    fetchImplementation() {
      return fetchDeferred.promise
    },
  })
  const pending = system.transport.sendSyncRequest(createRequest())

  assert.equal(system.calls.fetchRequest.length, 1)
  system.calls.setDeadlineTimer[0].onDeadline()
  await assertTransportFailure(pending)
  assert.equal(system.calls.abortMethod.length, 1)
  assert.equal(system.calls.clearDeadlineTimer.length, 1)

  fetchDeferred.resolve(responseFixture.response)
  await createNativePromise((resolve) => IMPORTED_SET_IMMEDIATE(resolve))
  assert.deepEqual(responseFixture.responseEvents, [])
  assert.equal(system.calls.fetchRequest.length, 1)
  assert.equal(system.calls.abortMethod.length, 1)
})

test('Deadline beendet einen nie endenden Reader ohne auf Abort Cancel oder Release zu warten', async () => {
  const readDeferred = createDeferred()
  const responseFixture = createResponseFixture({
    readImplementation() {
      return readDeferred.promise
    },
  })
  const system = createTransportSystem({
    fetchImplementation() {
      return createResolvedNativePromise(responseFixture.response)
    },
  })
  const pending = system.transport.sendSyncRequest(createRequest())

  await waitForCondition(
    () => responseFixture.reader.calls.readMethod.length === 1,
    'erster Readeraufruf'
  )
  system.calls.setDeadlineTimer[0].onDeadline()
  await assertTransportFailure(pending)

  assert.equal(system.calls.abortMethod.length, 1)
  assert.equal(system.calls.clearDeadlineTimer.length, 1)
  assert.equal(responseFixture.reader.calls.cancelMethod.length, 1)
  assert.equal(responseFixture.reader.calls.releaseLockMethod.length, 1)
  assert.strictEqual(
    system.calls.abortMethod[0].receiver,
    system.calls.abortResolution[0].controller
  )
  assert.deepEqual(system.calls.abortMethod[0].args, [])
  assert.strictEqual(
    responseFixture.reader.calls.cancelMethod[0].receiver,
    responseFixture.reader.reader
  )
  assert.deepEqual(responseFixture.reader.calls.cancelMethod[0].args, [])
  assert.strictEqual(
    responseFixture.reader.calls.releaseLockMethod[0].receiver,
    responseFixture.reader.reader
  )
  assert.deepEqual(responseFixture.reader.calls.releaseLockMethod[0].args, [])
  readDeferred.resolve(createEofResult())
  await createNativePromise((resolve) => IMPORTED_SET_IMMEDIATE(resolve))
  assert.equal(responseFixture.reader.calls.readMethod.length, 1)
})

test('konsumiert Fetch- und Read-Promises auch dann wenn die Deadline synchron innerhalb des Aufrufs gewinnt', async (t) => {
  await t.test('synchron reentrantes Fetch mit später Rejection', async () => {
    const fetchDeferred = createDeferred()
    const system = createTransportSystem({
      fetchImplementation({ calls }) {
        calls.setDeadlineTimer[0].onDeadline()
        return fetchDeferred.promise
      },
    })

    await assertTransportFailure(
      system.transport.sendSyncRequest(createRequest())
    )
    fetchDeferred.reject(new Error('late-fetch-private-sentinel'))
    await createNativePromise((resolve) => IMPORTED_SET_IMMEDIATE(resolve))
    assert.equal(system.calls.fetchRequest.length, 1)
    assert.equal(system.calls.abortMethod.length, 1)
    assert.equal(system.calls.clearDeadlineTimer.length, 1)
  })

  await t.test('synchron reentrantes Read mit später Rejection', async () => {
    const readDeferred = createDeferred()
    let system
    const responseFixture = createResponseFixture({
      readImplementation() {
        system.calls.setDeadlineTimer[0].onDeadline()
        return readDeferred.promise
      },
    })
    system = createTransportSystem({
      fetchImplementation() {
        return createResolvedNativePromise(responseFixture.response)
      },
    })

    await assertTransportFailure(
      system.transport.sendSyncRequest(createRequest())
    )
    readDeferred.reject(new Error('late-read-private-sentinel'))
    await createNativePromise((resolve) => IMPORTED_SET_IMMEDIATE(resolve))
    assert.equal(responseFixture.reader.calls.readMethod.length, 1)
    assert.equal(responseFixture.reader.calls.cancelMethod.length, 1)
    assert.equal(responseFixture.reader.calls.releaseLockMethod.length, 1)
  })
})

test('bereinigt einen während getReader oder der Methodenauflösung synchron nach Deadline zurückgegebenen Reader best effort', async (t) => {
  await t.test('Deadline innerhalb getReader', async () => {
    let system
    let responseFixture
    responseFixture = createResponseFixture({
      getReaderImplementation() {
        system.calls.setDeadlineTimer[0].onDeadline()
        return responseFixture.reader.reader
      },
    })
    system = createTransportSystem({
      fetchImplementation() {
        return createResolvedNativePromise(responseFixture.response)
      },
    })

    await assertTransportFailure(
      system.transport.sendSyncRequest(createRequest())
    )
    assert.equal(responseFixture.body.calls.getReaderMethod.length, 1)
    assert.equal(responseFixture.reader.calls.readResolution, 1)
    assert.equal(responseFixture.reader.calls.cancelResolution, 1)
    assert.equal(responseFixture.reader.calls.releaseLockResolution, 1)
    assert.equal(responseFixture.reader.calls.readMethod.length, 0)
    assert.equal(responseFixture.reader.calls.cancelMethod.length, 1)
    assert.equal(responseFixture.reader.calls.releaseLockMethod.length, 1)
  })

  await t.test('Deadline innerhalb Read-Methodengetter', async () => {
    let system
    const responseFixture = createResponseFixture()
    IMPORTED_OBJECT_DEFINE_PROPERTY(responseFixture.reader.reader, 'read', {
      configurable: true,
      enumerable: true,
      get() {
        system.calls.setDeadlineTimer[0].onDeadline()
        return function readAfterDeadline() {
          assert.fail('Read darf nach gewonnener Deadline nicht starten')
        }
      },
    })
    system = createTransportSystem({
      fetchImplementation() {
        return createResolvedNativePromise(responseFixture.response)
      },
    })

    await assertTransportFailure(
      system.transport.sendSyncRequest(createRequest())
    )
    assert.equal(responseFixture.reader.calls.cancelResolution, 1)
    assert.equal(responseFixture.reader.calls.releaseLockResolution, 1)
    assert.equal(responseFixture.reader.calls.cancelMethod.length, 1)
    assert.equal(responseFixture.reader.calls.releaseLockMethod.length, 1)
  })
})

test('ignoriert Deadlinecallbacks nach Erfolg oder Transportfehler und löscht nur tatsächlich gelieferte Timerhandles', async (t) => {
  await t.test('später Callback nach Erfolg', async () => {
    const system = createTransportSystem()
    await assertTransportSuccess(
      system.transport.sendSyncRequest(createRequest()),
      null
    )
    const before = {
      abort: system.calls.abortMethod.length,
      clear: system.calls.clearDeadlineTimer.length,
      fetch: system.calls.fetchRequest.length,
    }
    system.calls.setDeadlineTimer[0].onDeadline()
    system.calls.setDeadlineTimer[0].onDeadline()
    assert.deepEqual({
      abort: system.calls.abortMethod.length,
      clear: system.calls.clearDeadlineTimer.length,
      fetch: system.calls.fetchRequest.length,
    }, before)
  })

  await t.test('später Callback nach Transportfehler', async () => {
    const system = createTransportSystem({
      fetchImplementation() {
        return createRejectedNativePromise(
          new Error('terminal-owner-private-sentinel')
        )
      },
    })
    await assertTransportFailure(
      system.transport.sendSyncRequest(createRequest()),
      ['terminal-owner-private-sentinel']
    )
    const before = {
      abort: system.calls.abortMethod.length,
      clear: system.calls.clearDeadlineTimer.length,
      fetch: system.calls.fetchRequest.length,
    }
    system.calls.setDeadlineTimer[0].onDeadline()
    assert.deepEqual({
      abort: system.calls.abortMethod.length,
      clear: system.calls.clearDeadlineTimer.length,
      fetch: system.calls.fetchRequest.length,
    }, before)
  })

  await t.test('undefined ist kein erfundener Timerhandle', async () => {
    const system = createTransportSystem({
      timerImplementation() { return undefined },
    })
    await assertTransportSuccess(
      system.transport.sendSyncRequest(createRequest()),
      null
    )
    assert.equal(system.calls.setDeadlineTimer.length, 1)
    assert.strictEqual(system.calls.setDeadlineTimer[0].returnedHandle, undefined)
    assert.equal(system.calls.clearDeadlineTimer.length, 0)
  })
})

test('wartet bei terminalem Fehler nicht auf nie endende Abort Cancel Release oder Timer-Cleanup-Promises', async () => {
  const abortDeferred = createDeferred()
  const cancelDeferred = createDeferred()
  const releaseDeferred = createDeferred()
  const clearDeferred = createDeferred()
  const controller = {
    signal: {},
    abort() { return abortDeferred.promise },
  }
  const responseFixture = createResponseFixture({
    readResults: [null],
    cancelImplementation() { return cancelDeferred.promise },
    releaseLockImplementation() { return releaseDeferred.promise },
  })
  const system = createTransportSystem({
    controllerImplementation() { return controller },
    fetchImplementation() {
      return createResolvedNativePromise(responseFixture.response)
    },
    clearTimerImplementation() { return clearDeferred.promise },
  })

  await assertTransportFailure(system.transport.sendSyncRequest(createRequest()))
  assert.equal(responseFixture.reader.calls.cancelMethod.length, 1)
  assert.equal(responseFixture.reader.calls.releaseLockMethod.length, 1)
  assert.equal(system.calls.clearDeadlineTimer.length, 1)
})

test('lässt alle tatsächlich ausgeführten Settlement- und Cleanuphandler ausschließlich undefined zurückgeben', { concurrency: false }, async () => {
  const thenDescriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
    Promise.prototype,
    'then'
  )
  const handlerReturns = []
  let installedHandlerPairs = 0
  let imported

  try {
    IMPORTED_OBJECT_DEFINE_PROPERTY(Promise.prototype, 'then', {
      ...thenDescriptor,
      value(onFulfilled, onRejected) {
        const isRequiredPair =
          onFulfilled?.name === 'handleFulfillment' &&
          onRejected?.name === 'handleRejection'
        const isCleanupPair =
          onFulfilled?.name === 'consumeCleanupFulfillment' &&
          onRejected?.name === 'consumeCleanupRejection'

        if (!isRequiredPair && !isCleanupPair) {
          return IMPORTED_REFLECT_APPLY(thenDescriptor.value, this, [
            onFulfilled,
            onRejected,
          ])
        }

        installedHandlerPairs += 1
        const wrappedFulfillment = typeof onFulfilled === 'function'
          ? function recordFulfillment(value) {
              const result = onFulfilled(value)
              handlerReturns.push(result)
              return result
            }
          : onFulfilled
        const wrappedRejection = typeof onRejected === 'function'
          ? function recordRejection(reason) {
              const result = onRejected(reason)
              handlerReturns.push(result)
              return result
            }
          : onRejected
        return IMPORTED_REFLECT_APPLY(thenDescriptor.value, this, [
          wrappedFulfillment,
          wrappedRejection,
        ])
      },
    })
    imported = await importFreshBrowserSyncTransport(
      'settlement-handler-return-values'
    )
  } finally {
    restoreOwnProperty(Promise.prototype, 'then', thenDescriptor)
  }

  const cleanupRejection = new Error('handler-cleanup-private-sentinel')
  const successResponse = createResponseFixture({
    releaseLockImplementation() {
      return createRejectedNativePromise(cleanupRejection)
    },
  })
  const successSystem = createTransportSystem({
    factory: imported.createBrowserSyncTransport,
    fetchImplementation() {
      return createResolvedNativePromise(successResponse.response)
    },
    clearTimerImplementation() {
      return createResolvedNativePromise(
        'handler-cleanup-fulfillment-private-sentinel'
      )
    },
  })
  await assertTransportSuccess(
    successSystem.transport.sendSyncRequest(createRequest()),
    null
  )

  const rejectionSystem = createTransportSystem({
    factory: imported.createBrowserSyncTransport,
    fetchImplementation() {
      return createRejectedNativePromise(
        new Error('handler-fetch-private-sentinel')
      )
    },
  })
  await assertTransportFailure(
    rejectionSystem.transport.sendSyncRequest(createRequest()),
    ['handler-fetch-private-sentinel']
  )

  const lateDeferred = createDeferred()
  const lateSystem = createTransportSystem({
    factory: imported.createBrowserSyncTransport,
    fetchImplementation({ calls }) {
      calls.setDeadlineTimer[0].onDeadline()
      return lateDeferred.promise
    },
  })
  await assertTransportFailure(
    lateSystem.transport.sendSyncRequest(createRequest())
  )
  lateDeferred.resolve(createResponseFixture().response)
  await createNativePromise((resolve) => IMPORTED_SET_IMMEDIATE(resolve))

  assert.ok(installedHandlerPairs >= 6)
  assert.ok(handlerReturns.length >= 6)
  assert.equal(handlerReturns.every((value) => value === undefined), true)
})

test('akzeptiert lokale sowie vollständig vor Übergabe reprofiliierte native Promiseprofile und verarbeitet Fulfillment und Rejection kontrolliert', { concurrency: false }, async (t) => {
  const positiveFactories = [
    {
      label: 'lokales natives Promise',
      create(response) {
        return createResolvedNativePromise(response)
      },
    },
    {
      label: 'vollständig reprofiliertes VM-Promise',
      create(response) {
        const promise = vm.runInNewContext('Promise.resolve(value)', {
          value: response,
        })
        IMPORTED_OBJECT_SET_PROTOTYPE_OF(promise, IMPORTED_PROMISE_PROTOTYPE)
        return normalizeNativePromiseFixture(promise)
      },
    },
    {
      label: 'vollständig reprofilierte native Promise-Subclass',
      create(response) {
        class FixturePromise extends IMPORTED_PROMISE {}
        const promise = FixturePromise.resolve(response)
        IMPORTED_OBJECT_SET_PROTOTYPE_OF(promise, IMPORTED_PROMISE_PROTOTYPE)
        return normalizeNativePromiseFixture(promise)
      },
    },
  ]

  for (const fixture of positiveFactories) {
    await t.test(fixture.label, async () => {
      const responseFixture = createResponseFixture()
      const candidate = fixture.create(responseFixture.response)
      const system = createTransportSystem({
        fetchImplementation() { return candidate },
      })
      await assertTransportSuccess(
        system.transport.sendSyncRequest(createRequest()),
        null
      )
      assert.equal(system.calls.abortMethod.length, 0)
    })
  }

  await t.test('kontrollierte native Rejection', async () => {
    const marker = 'native-rejection-private-sentinel'
    const system = createTransportSystem({
      fetchImplementation() {
        return createRejectedNativePromise(new Error(marker))
      },
    })
    await assertTransportFailure(
      system.transport.sendSyncRequest(createRequest()),
      [marker]
    )
    assert.equal(system.calls.abortMethod.length, 1)
  })
})

test('weist Thenables Fakes Proxies sichtbare Subclassen fremde Promises und eigene Promisekeys ohne Assimilation zurück', { concurrency: false }, async (t) => {
  const response = createResponseFixture().response
  const cases = [
    {
      label: 'Thenable',
      create() {
        let thenCalls = 0
        return {
          candidate: { then() { thenCalls += 1 } },
          assertUnused() { assert.equal(thenCalls, 0) },
        }
      },
    },
    {
      label: 'Fake mit lokalem Prototyp',
      create() {
        return {
          candidate: Object.create(IMPORTED_PROMISE_PROTOTYPE),
          assertUnused() {},
        }
      },
    },
    {
      label: 'Proxy um echtes Promise',
      create() {
        return {
          candidate: new Proxy(createResolvedNativePromise(response), {}),
          assertUnused() {},
        }
      },
    },
    {
      label: 'unverändertes VM-Promise',
      create() {
        return {
          candidate: normalizeNativePromiseFixture(
            vm.runInNewContext('Promise.resolve(value)', {
              value: response,
            })
          ),
          assertUnused() {},
        }
      },
    },
    {
      label: 'sichtbare Promise-Subclass',
      create() {
        class FixturePromise extends IMPORTED_PROMISE {}
        return {
          candidate: normalizeNativePromiseFixture(
            FixturePromise.resolve(response)
          ),
          assertUnused() {},
        }
      },
    },
    {
      label: 'eigener Zusatzkey',
      create() {
        const candidate = createResolvedNativePromise(response)
        candidate.fixture = true
        return { candidate, assertUnused() {} }
      },
    },
    {
      label: 'eigener Symbolkey',
      create() {
        const candidate = createResolvedNativePromise(response)
        candidate[Symbol('promise-private-sentinel')] = true
        return { candidate, assertUnused() {} }
      },
    },
    {
      label: 'eigener Constructor-Accessor',
      create() {
        const candidate = createResolvedNativePromise(response)
        let accessorCalls = 0
        IMPORTED_OBJECT_DEFINE_PROPERTY(candidate, 'constructor', {
          configurable: true,
          get() {
            accessorCalls += 1
            throw new Error('constructor-accessor-private-sentinel')
          },
        })
        return {
          candidate,
          assertUnused() { assert.equal(accessorCalls, 0) },
        }
      },
    },
  ]

  for (const fixture of cases) {
    await t.test(fixture.label, async () => {
      const candidateFixture = fixture.create()
      const system = createTransportSystem({
        fetchImplementation() { return candidateFixture.candidate },
      })
      await assertTransportFailure(
        system.transport.sendSyncRequest(createRequest()),
        ['constructor-accessor-private-sentinel', 'promise-private-sentinel']
      )
      candidateFixture.assertUnused()
      assert.equal(system.calls.abortMethod.length, 1)
      assert.equal(system.calls.fetchRequest.length, 1)
    })
  }
})

test('bleibt von einer nach Modulevaluation ersetzten globalen then-Oberfläche unabhängig', { concurrency: false }, async () => {
  const thenDescriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
    Promise.prototype,
    'then'
  )
  const responseFixture = createResponseFixture()
  const fetchPromise = createResolvedNativePromise(responseFixture.response)
  let hostileThenCalls = 0
  const system = createTransportSystem({
    fetchImplementation() { return fetchPromise },
  })
  let settlement

  try {
    IMPORTED_OBJECT_DEFINE_PROPERTY(Promise.prototype, 'then', {
      ...thenDescriptor,
      value() {
        hostileThenCalls += 1
        throw new Error('hostile-then-private-sentinel')
      },
    })
    settlement = await captureSettlement(
      system.transport.sendSyncRequest(createRequest())
    )
  } finally {
    restoreOwnProperty(Promise.prototype, 'then', thenDescriptor)
  }

  assert.equal(settlement.status, 'fulfilled')
  assert.equal(settlement.value, null)
  assert.equal(hostileThenCalls, 0)
})

test('weist mutierte Promise-Constructor- und Speciesdescriptoren fail closed zurück ohne fremde Getter aufzurufen', { concurrency: false }, async (t) => {
  const constructorDescriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
    Promise.prototype,
    'constructor'
  )
  const speciesDescriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
    Promise,
    Symbol.species
  )
  let hostileGetterCalls = 0
  const cases = [
    {
      label: 'Constructoridentität',
      target: Promise.prototype,
      propertyName: 'constructor',
      descriptor: { ...constructorDescriptor, value: function OtherPromise() {} },
    },
    {
      label: 'Constructorgetter',
      target: Promise.prototype,
      propertyName: 'constructor',
      descriptor: {
        configurable: constructorDescriptor.configurable,
        enumerable: constructorDescriptor.enumerable,
        get() {
          hostileGetterCalls += 1
          throw new Error('constructor-getter-private-sentinel')
        },
      },
    },
    {
      label: 'Speciesgetter',
      target: Promise,
      propertyName: Symbol.species,
      descriptor: {
        ...speciesDescriptor,
        get() {
          hostileGetterCalls += 1
          throw new Error('species-getter-private-sentinel')
        },
      },
    },
  ]

  for (const fixture of cases) {
    await t.test(fixture.label, async () => {
      const original = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
        fixture.target,
        fixture.propertyName
      )
      const responseFixture = createResponseFixture()
      const candidate = createResolvedNativePromise(responseFixture.response)
      const system = createTransportSystem({
        fetchImplementation() { return candidate },
      })
      let transportPromise

      try {
        IMPORTED_OBJECT_DEFINE_PROPERTY(
          fixture.target,
          fixture.propertyName,
          fixture.descriptor
        )
        transportPromise = system.transport.sendSyncRequest(createRequest())
      } finally {
        restoreOwnProperty(fixture.target, fixture.propertyName, original)
      }

      const settlement = await captureSettlement(transportPromise)

      assert.equal(settlement.status, 'rejected')
      assertTransportErrorRecord(settlement.reason, [
        'constructor-getter-private-sentinel',
        'species-getter-private-sentinel',
      ])
      assert.equal(system.calls.abortMethod.length, 1)
    })
  }

  assert.equal(hostileGetterCalls, 0)
})

test('wendet Constructor- und Speciesdescriptorgrenzen ebenso auf Read- und Cleanup-Promises an', { concurrency: false }, async (t) => {
  await t.test('mutierter Constructor beim Read', async () => {
    const original = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
      Promise.prototype,
      'constructor'
    )
    const candidate = createResolvedNativePromise(
      createChunkResult(encodeFixture('null'))
    )
    let getterCalls = 0
    const responseFixture = createResponseFixture({
      readImplementation() {
        IMPORTED_OBJECT_DEFINE_PROPERTY(Promise.prototype, 'constructor', {
          configurable: original.configurable,
          enumerable: original.enumerable,
          get() {
            getterCalls += 1
            throw new Error('read-constructor-global-private-sentinel')
          },
        })
        return candidate
      },
    })
    const system = createTransportSystem({
      fetchImplementation() {
        return createResolvedNativePromise(responseFixture.response)
      },
    })

    try {
      await assertTransportFailure(
        system.transport.sendSyncRequest(createRequest()),
        ['read-constructor-global-private-sentinel']
      )
    } finally {
      restoreOwnProperty(Promise.prototype, 'constructor', original)
    }

    assert.equal(getterCalls, 0)
    assert.equal(responseFixture.reader.calls.readMethod.length, 1)
  })

  await t.test('mutierte Species beim Cleanup', async () => {
    const original = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
      Promise,
      Symbol.species
    )
    const candidate = createResolvedNativePromise(undefined)
    let getterCalls = 0
    const responseFixture = createResponseFixture({
      releaseLockImplementation() {
        IMPORTED_OBJECT_DEFINE_PROPERTY(Promise, Symbol.species, {
          ...original,
          get() {
            getterCalls += 1
            throw new Error('cleanup-species-global-private-sentinel')
          },
        })
        return candidate
      },
    })
    const system = createTransportSystem({
      fetchImplementation() {
        return createResolvedNativePromise(responseFixture.response)
      },
    })

    try {
      await assertTransportSuccess(
        system.transport.sendSyncRequest(createRequest()),
        null
      )
    } finally {
      restoreOwnProperty(Promise, Symbol.species, original)
    }

    assert.equal(getterCalls, 0)
    assert.equal(responseFixture.reader.calls.releaseLockMethod.length, 1)
  })
})

test('beobachtet Responsefelder fail-fast exakt in der Reihenfolge Status Redirect URL Typ Headers Body', async (t) => {
  const cases = [
    {
      label: 'Status',
      options: { status: 201 },
      expectedEvents: ['status'],
    },
    {
      label: 'Redirect',
      options: { redirected: true },
      expectedEvents: ['status', 'redirected'],
    },
    {
      label: 'finale URL',
      options: { url: 'http://localhost:8787/api/sync-test' },
      expectedEvents: ['status', 'redirected', 'url'],
    },
    {
      label: 'Response-Typ',
      options: { type: 'basic' },
      expectedEvents: ['status', 'redirected', 'url', 'type'],
    },
  ]

  for (const fixture of cases) {
    await t.test(fixture.label, async () => {
      const responseFixture = createResponseFixture({
        ...fixture.options,
        instrumentResponseGetters: true,
      })
      const system = createTransportSystem({
        fetchImplementation() {
          return createResolvedNativePromise(responseFixture.response)
        },
      })
      await assertTransportFailure(
        system.transport.sendSyncRequest(createRequest())
      )
      assert.deepEqual(responseFixture.responseEvents, fixture.expectedEvents)
      assert.equal(responseFixture.headers.calls.getResolution, 0)
      assert.equal(responseFixture.body.calls.getReaderResolution, 0)
      assert.equal(system.calls.abortMethod.length, 1)
    })
  }

  const successFixture = createResponseFixture({
    instrumentResponseGetters: true,
  })
  const successSystem = createTransportSystem({
    fetchImplementation() {
      return createResolvedNativePromise(successFixture.response)
    },
  })
  await assertTransportSuccess(
    successSystem.transport.sendSyncRequest(createRequest()),
    null
  )
  assert.deepEqual(successFixture.responseEvents, [
    'status',
    'redirected',
    'url',
    'type',
    'headers',
    'body',
  ])
})

test('löst Headers.get einmal auf und prüft die drei browserexponierten Header mit richtigem Receiver fail-fast', async () => {
  const responseFixture = createResponseFixture()
  const system = createTransportSystem({
    fetchImplementation() {
      return createResolvedNativePromise(responseFixture.response)
    },
  })

  await assertTransportSuccess(
    system.transport.sendSyncRequest(createRequest()),
    null
  )

  assert.equal(responseFixture.headers.calls.getResolution, 1)
  assert.deepEqual(
    responseFixture.headers.calls.getMethod.map((call) => call.headerName),
    ['content-type', 'content-length', 'content-encoding']
  )
  for (const call of responseFixture.headers.calls.getMethod) {
    assert.strictEqual(call.receiver, responseFixture.headers.headers)
    assert.equal(call.args.length, 1)
  }
})

test('weist ungeeignete Content-Type-, Content-Length- und sichtbare Content-Encoding-Werte vor Bodyzugriff zurück', async (t) => {
  const cases = [
    {
      label: 'Content-Type',
      options: { contentType: 'application/json' },
      expectedHeaders: ['content-type'],
    },
    ...[
      null,
      '',
      '00',
      '01',
      '+4',
      ' 4',
      '4 ',
      '4.0',
      '1e1',
      '-1',
      '16385',
    ].map((contentLength) => ({
      label: `Content-Length ${String(contentLength)}`,
      options: { contentLength },
      expectedHeaders: ['content-type', 'content-length'],
    })),
    {
      label: 'fehlende Content-Length',
      options: { omitContentLength: true },
      expectedHeaders: ['content-type', 'content-length'],
    },
    {
      label: 'sichtbares Content-Encoding',
      options: { contentEncoding: 'identity' },
      expectedHeaders: [
        'content-type',
        'content-length',
        'content-encoding',
      ],
    },
    {
      label: 'undefined Content-Encoding',
      options: {
        headerGetImplementation({ headerName, values }) {
          return headerName === 'content-encoding'
            ? undefined
            : values[headerName]
        },
      },
      expectedHeaders: [
        'content-type',
        'content-length',
        'content-encoding',
      ],
    },
  ]

  for (const fixture of cases) {
    await t.test(fixture.label, async () => {
      const responseFixture = createResponseFixture(fixture.options)
      const system = createTransportSystem({
        fetchImplementation() {
          return createResolvedNativePromise(responseFixture.response)
        },
      })
      await assertTransportFailure(
        system.transport.sendSyncRequest(createRequest())
      )
      assert.deepEqual(
        responseFixture.headers.calls.getMethod.map((call) => call.headerName),
        fixture.expectedHeaders
      )
      assert.equal(responseFixture.body.calls.getReaderResolution, 0)
      assert.equal(system.calls.abortMethod.length, 1)
    })
  }
})

test('akzeptiert die kanonische Content-Length 0 bis zur unveränderten leeren JSON-Parsegrenze', async () => {
  const responseFixture = createResponseFixture({
    bodyText: '',
    contentLength: '0',
    readResults: [createEofResult()],
  })
  const system = createTransportSystem({
    fetchImplementation() {
      return createResolvedNativePromise(responseFixture.response)
    },
  })

  await assertTransportFailure(system.transport.sendSyncRequest(createRequest()))
  assert.deepEqual(
    responseFixture.headers.calls.getMethod.map((call) => call.headerName),
    ['content-type', 'content-length', 'content-encoding']
  )
  assert.equal(responseFixture.body.calls.getReaderMethod.length, 1)
  assert.equal(responseFixture.reader.calls.readMethod.length, 1)
  assert.equal(responseFixture.reader.calls.releaseLockMethod.length, 1)
  assert.equal(system.calls.abortMethod.length, 1)
})

test('übernimmt Body und Reader mit exakt einmal aufgelösten Methoden und durchgehend richtigen Receivern', async () => {
  const responseFixture = createResponseFixture()
  const system = createTransportSystem({
    fetchImplementation() {
      return createResolvedNativePromise(responseFixture.response)
    },
  })

  await assertTransportSuccess(
    system.transport.sendSyncRequest(createRequest()),
    null
  )

  assert.equal(responseFixture.body.calls.getReaderResolution, 1)
  assert.equal(responseFixture.body.calls.getReaderMethod.length, 1)
  assert.strictEqual(
    responseFixture.body.calls.getReaderMethod[0].receiver,
    responseFixture.body.body
  )
  assert.deepEqual(responseFixture.body.calls.getReaderMethod[0].args, [])
  assert.equal(responseFixture.reader.calls.readResolution, 1)
  assert.equal(responseFixture.reader.calls.cancelResolution, 1)
  assert.equal(responseFixture.reader.calls.releaseLockResolution, 1)
  assert.equal(responseFixture.reader.calls.readMethod.length, 2)
  assert.equal(responseFixture.reader.calls.cancelMethod.length, 0)
  assert.equal(responseFixture.reader.calls.releaseLockMethod.length, 1)
  for (const call of responseFixture.reader.calls.readMethod) {
    assert.strictEqual(call.receiver, responseFixture.reader.reader)
    assert.deepEqual(call.args, [])
  }
  assert.strictEqual(
    responseFixture.reader.calls.releaseLockMethod[0].receiver,
    responseFixture.reader.reader
  )
  assert.deepEqual(
    responseFixture.reader.calls.releaseLockMethod[0].args,
    []
  )
})

test('snapshottet jedes Read-Result einmal mit nativer Keyreihenfolge und Descriptorreihenfolge done vor value', async () => {
  const events = []
  const bytes = encodeFixture('null')
  const resultTarget = createChunkResult(bytes)
  const result = new Proxy(resultTarget, {
    getPrototypeOf(target) {
      events.push('getPrototypeOf')
      return IMPORTED_OBJECT_GET_PROTOTYPE_OF(target)
    },
    ownKeys(target) {
      events.push('ownKeys')
      return IMPORTED_REFLECT_OWN_KEYS(target)
    },
    getOwnPropertyDescriptor(target, propertyName) {
      events.push(`descriptor:${String(propertyName)}`)
      return IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(target, propertyName)
    },
    get(target, propertyName, receiver) {
      if (propertyName === 'then') {
        return undefined
      }

      assert.fail('Read-Result darf nicht frei gelesen werden')
    },
  })
  const responseFixture = createResponseFixture({
    readResults: [result, createEofResult()],
  })
  const system = createTransportSystem({
    fetchImplementation() {
      return createResolvedNativePromise(responseFixture.response)
    },
  })

  await assertTransportSuccess(
    system.transport.sendSyncRequest(createRequest()),
    null
  )

  assert.deepEqual(events, [
    'getPrototypeOf',
    'ownKeys',
    'descriptor:done',
    'descriptor:value',
  ])
})

test('verwendet stateful Read-Result-Deskriptoren nur einmal und weist Proxythrows sowie inkonsistente ABA-Snapshots ohne Folgeread zurück', async (t) => {
  await t.test('stateful Resultmutation nach Deskriptorcapture', async () => {
    const originalBytes = encodeFixture('null')
    const target = createChunkResult(originalBytes)
    const descriptorCounts = { done: 0, value: 0 }
    const result = new Proxy(target, {
      getPrototypeOf(proxyTarget) {
        return IMPORTED_OBJECT_GET_PROTOTYPE_OF(proxyTarget)
      },
      ownKeys(proxyTarget) {
        return IMPORTED_REFLECT_OWN_KEYS(proxyTarget)
      },
      getOwnPropertyDescriptor(proxyTarget, propertyName) {
        descriptorCounts[propertyName] += 1
        const descriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
          proxyTarget,
          propertyName
        )

        if (propertyName === 'value') {
          proxyTarget.value = encodeFixture('1')
          proxyTarget.done = true
        }

        return descriptor
      },
      get(_proxyTarget, propertyName) {
        if (propertyName === 'then') {
          return undefined
        }
        assert.fail('Stateful Read-Result darf nicht frei gelesen werden')
      },
    })
    const responseFixture = createResponseFixture({
      readResults: [result, createEofResult()],
    })
    const system = createTransportSystem({
      fetchImplementation() {
        return createResolvedNativePromise(responseFixture.response)
      },
    })

    await assertTransportSuccess(system.transport.sendSyncRequest(createRequest()), null)
    assert.deepEqual(descriptorCounts, { done: 1, value: 1 })
    assert.equal(target.done, true)
    assert.equal(new TextDecoder().decode(target.value), '1')
  })

  const throwingCases = [
    ['Prototyp-Throw', {
      getPrototypeOf() {
        throw new Error('read-result-prototype-private-sentinel')
      },
    }],
    ['OwnKeys-Throw', {
      ownKeys() {
        throw new Error('read-result-own-keys-private-sentinel')
      },
    }],
    ['Descriptor-Throw', {
      getOwnPropertyDescriptor(target, propertyName) {
        if (propertyName === 'done') {
          throw new Error('read-result-descriptor-private-sentinel')
        }
        return IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(target, propertyName)
      },
    }],
  ]

  for (const [label, traps] of throwingCases) {
    await t.test(label, async () => {
      const target = createChunkResult(encodeFixture('null'))
      const result = new Proxy(target, {
        ...traps,
        get(proxyTarget, propertyName, receiver) {
          if (propertyName === 'then') {
            return undefined
          }
          return Reflect.get(proxyTarget, propertyName, receiver)
        },
      })
      const responseFixture = createResponseFixture({ readResults: [result] })
      const system = createTransportSystem({
        fetchImplementation() {
          return createResolvedNativePromise(responseFixture.response)
        },
      })

      await assertTransportFailure(
        system.transport.sendSyncRequest(createRequest()),
        ['read-result-', 'private-sentinel']
      )
      assert.equal(responseFixture.reader.calls.readMethod.length, 1)
    })
  }

  await t.test('inkonsistente Deskriptorbeobachtung', async () => {
    const descriptorEvents = []
    const target = createChunkResult(encodeFixture('null'))
    const result = new Proxy(target, {
      getPrototypeOf(proxyTarget) {
        return IMPORTED_OBJECT_GET_PROTOTYPE_OF(proxyTarget)
      },
      ownKeys() {
        return ['value', 'done']
      },
      getOwnPropertyDescriptor(proxyTarget, propertyName) {
        descriptorEvents.push(propertyName)
        if (propertyName === 'done') {
          return undefined
        }
        return IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
          proxyTarget,
          propertyName
        )
      },
      get(proxyTarget, propertyName, receiver) {
        if (propertyName === 'then') {
          return undefined
        }
        return Reflect.get(proxyTarget, propertyName, receiver)
      },
    })
    const responseFixture = createResponseFixture({ readResults: [result] })
    const system = createTransportSystem({
      fetchImplementation() {
        return createResolvedNativePromise(responseFixture.response)
      },
    })

    await assertTransportFailure(system.transport.sendSyncRequest(createRequest()))
    assert.deepEqual(descriptorEvents, ['done', 'value'])
    assert.equal(responseFixture.reader.calls.readMethod.length, 1)
  })
})

test('weist malformed accessorbasierte und inkonsistente Read-Resultformen nach genau einem Read fail closed zurück', async (t) => {
  let accessorCalls = 0
  const accessorResult = { done: false }
  IMPORTED_OBJECT_DEFINE_PROPERTY(accessorResult, 'value', {
    configurable: true,
    enumerable: true,
    get() {
      accessorCalls += 1
      throw new Error('read-result-accessor-private-sentinel')
    },
  })
  const wrongOrder = { done: false, value: encodeFixture('null') }
  const extra = {
    value: encodeFixture('null'),
    done: false,
    extra: true,
  }
  const symbolic = createChunkResult(encodeFixture('null'))
  symbolic[Symbol('read-result-private-sentinel')] = true
  const nonEnumerable = createChunkResult(encodeFixture('null'))
  IMPORTED_OBJECT_DEFINE_PROPERTY(nonEnumerable, 'done', {
    configurable: true,
    enumerable: false,
    value: false,
    writable: true,
  })
  const cases = [
    ['null', null],
    ['Primitive', 1],
    ['Array', []],
    ['Null-Prototyp', Object.assign(Object.create(null), createEofResult())],
    ['falsche Keyreihenfolge', wrongOrder],
    ['Zusatzfeld', extra],
    ['Symbolfeld', symbolic],
    ['nicht aufzählbares Datenfeld', nonEnumerable],
    ['Accessor', accessorResult],
    ['done nicht boolesch', { value: undefined, done: 'true' }],
    ['EOF mit Wert', { value: null, done: true }],
  ]

  for (const [label, readResult] of cases) {
    await t.test(label, async () => {
      const responseFixture = createResponseFixture({
        readResults: [readResult],
      })
      const system = createTransportSystem({
        fetchImplementation() {
          return createResolvedNativePromise(responseFixture.response)
        },
      })
      await assertTransportFailure(
        system.transport.sendSyncRequest(createRequest()),
        ['read-result-accessor-private-sentinel', 'read-result-private-sentinel']
      )
      assert.equal(responseFixture.reader.calls.readMethod.length, 1)
      assert.equal(system.calls.abortMethod.length, 1)
      assert.equal(responseFixture.reader.calls.cancelMethod.length, 1)
      assert.equal(responseFixture.reader.calls.releaseLockMethod.length, 1)
    })
  }

  assert.equal(accessorCalls, 0)
})

test('akzeptiert lokale und vollständig vor Übergabe reprofilierte echte VM-View-Buffer-Paare und verändert selbst keine Prototypen', { concurrency: false }, async () => {
  const foreignView = vm.runInNewContext(
    'new Uint8Array([110, 117, 108, 108])'
  )
  const foreignBuffer = foreignView.buffer
  IMPORTED_OBJECT_SET_PROTOTYPE_OF(
    foreignBuffer,
    ArrayBuffer.prototype
  )
  IMPORTED_OBJECT_SET_PROTOTYPE_OF(
    foreignView,
    Uint8Array.prototype
  )
  const setPrototypeDescriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
    Object,
    'setPrototypeOf'
  )
  let transportSetPrototypeCalls = 0
  const responseFixture = createResponseFixture({ chunks: [foreignView] })
  const system = createTransportSystem({
    fetchImplementation() {
      return createResolvedNativePromise(responseFixture.response)
    },
  })
  let settlement

  try {
    IMPORTED_OBJECT_DEFINE_PROPERTY(Object, 'setPrototypeOf', {
      ...setPrototypeDescriptor,
      value() {
        transportSetPrototypeCalls += 1
        throw new Error('transport-set-prototype-private-sentinel')
      },
    })
    settlement = await captureSettlement(
      system.transport.sendSyncRequest(createRequest())
    )
  } finally {
    restoreOwnProperty(Object, 'setPrototypeOf', setPrototypeDescriptor)
  }

  assert.equal(settlement.status, 'fulfilled')
  assert.equal(settlement.value, null)
  assert.equal(transportSetPrototypeCalls, 0)
  assert.strictEqual(
    IMPORTED_OBJECT_GET_PROTOTYPE_OF(foreignView),
    Uint8Array.prototype
  )
  assert.strictEqual(
    IMPORTED_OBJECT_GET_PROTOTYPE_OF(foreignBuffer),
    ArrayBuffer.prototype
  )
})

test('weist fremde Teilprofile Fakes Proxies Subclassen Shared Memory und detached Buffer als Chunks zurück', { concurrency: false }, async (t) => {
  function createForeignView() {
    return vm.runInNewContext('new Uint8Array([110,117,108,108])')
  }

  const onlyView = createForeignView()
  IMPORTED_OBJECT_SET_PROTOTYPE_OF(onlyView, Uint8Array.prototype)
  const onlyBuffer = createForeignView()
  IMPORTED_OBJECT_SET_PROTOTYPE_OF(
    onlyBuffer.buffer,
    ArrayBuffer.prototype
  )
  class FixtureUint8Array extends Uint8Array {}
  const subclass = new FixtureUint8Array(encodeFixture('null'))
  const local = encodeFixture('null')
  const proxy = new Proxy(local, {})
  const fake = Object.create(Uint8Array.prototype)
  IMPORTED_OBJECT_DEFINE_PROPERTY(fake, 'byteLength', {
    configurable: true,
    enumerable: true,
    writable: true,
    value: 4,
  })
  IMPORTED_OBJECT_DEFINE_PROPERTY(fake, 'buffer', {
    configurable: true,
    enumerable: true,
    writable: true,
    value: new ArrayBuffer(4),
  })
  const detached = encodeFixture('null')
  structuredClone(detached.buffer, { transfer: [detached.buffer] })
  const cases = [
    ['unveränderte VM-View', createForeignView()],
    ['nur View reprofiliert', onlyView],
    ['nur Buffer reprofiliert', onlyBuffer],
    ['sichtbare Subclass', subclass],
    ['Proxy', proxy],
    ['Fake', fake],
    ['SharedArrayBuffer', new Uint8Array(new SharedArrayBuffer(4))],
    ['detached Buffer', detached],
    ['Nullchunk', null],
    ['leerer Chunk', new Uint8Array(0)],
  ]

  for (const [label, chunk] of cases) {
    await t.test(label, async () => {
      const responseFixture = createResponseFixture({ chunks: [chunk] })
      const system = createTransportSystem({
        fetchImplementation() {
          return createResolvedNativePromise(responseFixture.response)
        },
      })
      await assertTransportFailure(
        system.transport.sendSyncRequest(createRequest())
      )
      assert.equal(responseFixture.reader.calls.readMethod.length, 1)
      assert.equal(system.calls.abortMethod.length, 1)
      assert.equal(responseFixture.reader.calls.cancelMethod.length, 1)
      assert.equal(responseFixture.reader.calls.releaseLockMethod.length, 1)
    })
  }

  const resizableDescriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
    ArrayBuffer.prototype,
    'resizable'
  )

  if (resizableDescriptor === undefined) {
    assert.equal(resizableDescriptor, undefined)
  } else {
    const buffer = new ArrayBuffer(4, { maxByteLength: 8 })
    const responseFixture = createResponseFixture({
      chunks: [new Uint8Array(buffer)],
    })
    const system = createTransportSystem({
      fetchImplementation() {
        return createResolvedNativePromise(responseFixture.response)
      },
    })
    await assertTransportFailure(
      system.transport.sendSyncRequest(createRequest())
    )
  }

  const growableDescriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
    SharedArrayBuffer.prototype,
    'growable'
  )

  if (growableDescriptor === undefined) {
    assert.equal(growableDescriptor, undefined)
  } else {
    const buffer = new SharedArrayBuffer(4, { maxByteLength: 8 })
    const responseFixture = createResponseFixture({
      chunks: [new Uint8Array(buffer)],
    })
    const system = createTransportSystem({
      fetchImplementation() {
        return createResolvedNativePromise(responseFixture.response)
      },
    })
    await assertTransportFailure(
      system.transport.sendSyncRequest(createRequest())
    )
  }
})

test('kopiert wiederverwendete Fremdchunks sofort in den eigenen Puffer und bleibt gegen spätere Quellmutation stabil', async () => {
  const source = new Uint8Array([49])
  const secondRead = createDeferred()
  const eofRead = createDeferred()
  const responseFixture = createResponseFixture({
    bodyText: '12',
    readImplementation({ callNumber }) {
      if (callNumber === 1) {
        return createResolvedNativePromise(createChunkResult(source))
      }
      if (callNumber === 2) {
        return secondRead.promise
      }
      return eofRead.promise
    },
  })
  const system = createTransportSystem({
    fetchImplementation() {
      return createResolvedNativePromise(responseFixture.response)
    },
  })
  const pending = system.transport.sendSyncRequest(createRequest())

  await waitForCondition(
    () => responseFixture.reader.calls.readMethod.length === 2,
    'zweiter Read nach erster Kopie'
  )
  source[0] = 50
  secondRead.resolve(createChunkResult(source))
  await waitForCondition(
    () => responseFixture.reader.calls.readMethod.length === 3,
    'EOF-Read nach zweiter Kopie'
  )
  source[0] = 57
  eofRead.resolve(createEofResult())

  await assertTransportSuccess(pending, 12)
  assert.equal(source[0], 57)
})

test('allokiert exakt einen eigenen Responsepuffer und prüft jede Cap vor der ersten kontrollierten Kopie', { concurrency: false }, async () => {
  const uint8ArrayDescriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
    globalThis,
    'Uint8Array'
  )
  const NativeUint8Array = uint8ArrayDescriptor.value
  const typedArrayPrototype = IMPORTED_OBJECT_GET_PROTOTYPE_OF(
    NativeUint8Array.prototype
  )
  const setDescriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
    typedArrayPrototype,
    'set'
  )
  const allocations = []
  const setCalls = []

  function RecordingUint8Array() {
    const instance = Reflect.construct(
      NativeUint8Array,
      [...arguments],
      new.target
    )
    allocations.push({ args: [...arguments], instance })
    return instance
  }

  RecordingUint8Array.prototype = NativeUint8Array.prototype
  let imported

  try {
    IMPORTED_OBJECT_DEFINE_PROPERTY(globalThis, 'Uint8Array', {
      ...uint8ArrayDescriptor,
      value: RecordingUint8Array,
    })
    IMPORTED_OBJECT_DEFINE_PROPERTY(typedArrayPrototype, 'set', {
      ...setDescriptor,
      value() {
        setCalls.push({ args: [...arguments], receiver: this })
        return IMPORTED_REFLECT_APPLY(
          setDescriptor.value,
          this,
          [...arguments]
        )
      },
    })
    imported = await importFreshBrowserSyncTransport(
      'response-buffer-allocation-copy'
    )
  } finally {
    restoreOwnProperty(typedArrayPrototype, 'set', setDescriptor)
    restoreOwnProperty(globalThis, 'Uint8Array', uint8ArrayDescriptor)
  }

  allocations.length = 0
  setCalls.length = 0

  const validFixture = createResponseFixture({
    bodyText: 'null',
    chunks: [
      new NativeUint8Array([110, 117]),
      new NativeUint8Array([108, 108]),
    ],
  })
  const validSystem = createTransportSystem({
    factory: imported.createBrowserSyncTransport,
    fetchImplementation() {
      return createResolvedNativePromise(validFixture.response)
    },
  })
  await assertTransportSuccess(
    validSystem.transport.sendSyncRequest(createRequest()),
    null
  )

  assert.equal(allocations.length, 1)
  assert.deepEqual(allocations[0].args, [4])
  assert.equal(setCalls.length, 2)
  assert.strictEqual(setCalls[0].receiver, allocations[0].instance)
  assert.strictEqual(setCalls[1].receiver, allocations[0].instance)
  assert.deepEqual(setCalls.map((call) => call.args[1]), [0, 2])

  const copiesBeforeOversize = setCalls.length
  const oversizeFixture = createResponseFixture({
    bodyText: 'null',
    contentLength: '4',
    chunks: [new NativeUint8Array(5)],
  })
  const oversizeSystem = createTransportSystem({
    factory: imported.createBrowserSyncTransport,
    fetchImplementation() {
      return createResolvedNativePromise(oversizeFixture.response)
    },
  })
  await assertTransportFailure(
    oversizeSystem.transport.sendSyncRequest(createRequest())
  )
  assert.equal(allocations.length, 2)
  assert.deepEqual(allocations[1].args, [4])
  assert.equal(setCalls.length, copiesBeforeOversize)
  assert.equal(oversizeFixture.reader.calls.readMethod.length, 1)

  const allocationsBeforeBoundaryChunk = allocations.length
  const copiesBeforeBoundaryChunk = setCalls.length
  const boundaryChunkFixture = createResponseFixture({
    bodyText: 'null',
    contentLength: String(MAX_RESPONSE_BYTES),
    chunks: [new NativeUint8Array(MAX_RESPONSE_BYTES + 1)],
  })
  const boundaryChunkSystem = createTransportSystem({
    factory: imported.createBrowserSyncTransport,
    fetchImplementation() {
      return createResolvedNativePromise(boundaryChunkFixture.response)
    },
  })
  await assertTransportFailure(
    boundaryChunkSystem.transport.sendSyncRequest(createRequest())
  )
  assert.equal(allocations.length, allocationsBeforeBoundaryChunk + 1)
  assert.deepEqual(allocations.at(-1).args, [MAX_RESPONSE_BYTES])
  assert.equal(setCalls.length, copiesBeforeBoundaryChunk)
  assert.equal(boundaryChunkFixture.reader.calls.readMethod.length, 1)
  assert.equal(boundaryChunkFixture.reader.calls.cancelMethod.length, 1)
  assert.equal(boundaryChunkFixture.reader.calls.releaseLockMethod.length, 1)
  assert.equal(boundaryChunkSystem.calls.abortMethod.length, 1)
  assert.equal(boundaryChunkSystem.calls.clearDeadlineTimer.length, 1)
})

test('akzeptiert exakt 16.384 Responsebytes und weist Byte 16.385 sowie jede deklarierte-kopierte Längendrift zurück', async (t) => {
  const exactText = `"${'x'.repeat(MAX_RESPONSE_BYTES - 2)}"`
  const exactFixture = createResponseFixture({ bodyText: exactText })
  const exactSystem = createTransportSystem({
    fetchImplementation() {
      return createResolvedNativePromise(exactFixture.response)
    },
  })
  const exactResult = await assertTransportSuccess(
    exactSystem.transport.sendSyncRequest(createRequest()),
    'x'.repeat(MAX_RESPONSE_BYTES - 2)
  )
  assert.equal(exactResult.length, MAX_RESPONSE_BYTES - 2)
  assert.equal(exactFixture.bytes.byteLength, MAX_RESPONSE_BYTES)

  const cases = [
    {
      label: 'deklarierte 16.385 Bytes',
      fixture: () => createResponseFixture({
        bodyText: `"${'x'.repeat(MAX_RESPONSE_BYTES - 1)}"`,
      }),
      expectedReads: 0,
    },
    {
      label: 'Chunk über deklarierter Länge',
      fixture: () => createResponseFixture({
        bodyText: 'null',
        contentLength: '4',
        chunks: [new Uint8Array(5)],
      }),
      expectedReads: 1,
    },
    {
      label: 'EOF vor deklarierter Länge',
      fixture: () => createResponseFixture({
        bodyText: 'null',
        contentLength: '4',
        chunks: [new Uint8Array([110, 117, 108])],
      }),
      expectedReads: 2,
    },
    {
      label: 'Streambyte 16.385 trotz kleinerer Deklaration',
      fixture: () => createResponseFixture({
        bodyText: exactText,
        contentLength: String(MAX_RESPONSE_BYTES),
        chunks: [new Uint8Array(MAX_RESPONSE_BYTES + 1)],
      }),
      expectedReads: 1,
    },
  ]

  for (const fixture of cases) {
    await t.test(fixture.label, async () => {
      const responseFixture = fixture.fixture()
      const system = createTransportSystem({
        fetchImplementation() {
          return createResolvedNativePromise(responseFixture.response)
        },
      })
      await assertTransportFailure(
        system.transport.sendSyncRequest(createRequest())
      )
      assert.equal(system.calls.abortMethod.length, 1)
      assert.equal(
        responseFixture.reader.calls.readMethod.length,
        fixture.expectedReads
      )
    })
  }
})

test('führt Erfolgscleanup exakt einmal und Fehlercleanup höchstens einmal best effort ohne zweiten terminalen Owner aus', async (t) => {
  await t.test('Erfolg', async () => {
    const responseFixture = createResponseFixture()
    const system = createTransportSystem({
      fetchImplementation() {
        return createResolvedNativePromise(responseFixture.response)
      },
    })
    await assertTransportSuccess(
      system.transport.sendSyncRequest(createRequest()),
      null
    )
    assert.equal(responseFixture.reader.calls.cancelMethod.length, 0)
    assert.equal(responseFixture.reader.calls.releaseLockMethod.length, 1)
    assert.equal(system.calls.abortMethod.length, 0)
    assert.equal(system.calls.clearDeadlineTimer.length, 1)
  })

  await t.test('werfendes normales releaseLock verhindert Erfolg', async () => {
    const responseFixture = createResponseFixture({
      releaseLockImplementation() {
        throw new Error('release-success-private-sentinel')
      },
    })
    const system = createTransportSystem({
      fetchImplementation() {
        return createResolvedNativePromise(responseFixture.response)
      },
    })
    await assertTransportFailure(
      system.transport.sendSyncRequest(createRequest()),
      ['release-success-private-sentinel']
    )
    assert.equal(responseFixture.reader.calls.releaseLockMethod.length, 1)
    assert.equal(system.calls.abortMethod.length, 1)
    assert.equal(system.calls.clearDeadlineTimer.length, 1)
  })

  await t.test('Fehlercleanupthrow und -rejection', async () => {
    const responseFixture = createResponseFixture({
      readResults: [null],
      cancelImplementation() {
        return createRejectedNativePromise(
          new Error('cancel-rejection-private-sentinel')
        )
      },
      releaseLockImplementation() {
        throw new Error('release-error-private-sentinel')
      },
    })
    const system = createTransportSystem({
      fetchImplementation() {
        return createResolvedNativePromise(responseFixture.response)
      },
    })
    await assertTransportFailure(
      system.transport.sendSyncRequest(createRequest()),
      ['cancel-rejection-private-sentinel', 'release-error-private-sentinel']
    )
    await createNativePromise((resolve) => IMPORTED_SET_IMMEDIATE(resolve))
    assert.equal(responseFixture.reader.calls.cancelMethod.length, 1)
    assert.equal(responseFixture.reader.calls.releaseLockMethod.length, 1)
    assert.equal(system.calls.abortMethod.length, 1)
    assert.equal(system.calls.clearDeadlineTimer.length, 1)
  })

  await t.test('werfendes Abort und Timer-Cleanup bleiben best effort', async () => {
    const controller = { signal: {} }
    IMPORTED_OBJECT_DEFINE_PROPERTY(controller, 'abort', {
      value() { throw new Error('abort-cleanup-private-sentinel') },
    })
    const system = createTransportSystem({
      controllerImplementation() { return controller },
      fetchImplementation() {
        throw new Error('fetch-owner-private-sentinel')
      },
      clearTimerImplementation() {
        throw new Error('timer-cleanup-private-sentinel')
      },
    })
    await assertTransportFailure(
      system.transport.sendSyncRequest(createRequest()),
      [
        'abort-cleanup-private-sentinel',
        'fetch-owner-private-sentinel',
        'timer-cleanup-private-sentinel',
      ]
    )
    assert.equal(system.calls.fetchRequest.length, 1)
    assert.equal(system.calls.clearDeadlineTimer.length, 1)
  })
})

test('decodiert strikt als UTF-8 lässt eine BOM sichtbar und parst JSON exakt ohne Reparatur', async (t) => {
  const cases = [
    {
      label: 'ungültiges UTF-8',
      bodyText: 'xx',
      chunks: [new Uint8Array([0xc3, 0x28])],
    },
    {
      label: 'sichtbare BOM',
      bodyText: '\uFEFFnull',
      chunks: [encodeFixture('\uFEFFnull')],
    },
    {
      label: 'ungültiges JSON',
      bodyText: '{',
    },
  ]

  for (const fixture of cases) {
    await t.test(fixture.label, async () => {
      const responseFixture = createResponseFixture({
        bodyText: fixture.bodyText,
        chunks: fixture.chunks,
      })
      const system = createTransportSystem({
        fetchImplementation() {
          return createResolvedNativePromise(responseFixture.response)
        },
      })
      await assertTransportFailure(
        system.transport.sendSyncRequest(createRequest()),
        [fixture.bodyText]
      )
      assert.equal(system.calls.abortMethod.length, 1)
      assert.equal(responseFixture.reader.calls.releaseLockMethod.length, 1)
      assert.equal(system.calls.clearDeadlineTimer.length, 1)
    })
  }
})

test('konstruiert den Decoder exakt streng decodiert und parst genau einmal ohne Reviver nach deaktivierter Deadline', { concurrency: false }, async () => {
  const textDecoderDescriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
    globalThis,
    'TextDecoder'
  )
  const parseDescriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
    JSON,
    'parse'
  )
  const NativeTextDecoder = textDecoderDescriptor.value
  const nativeDecodeDescriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
    NativeTextDecoder.prototype,
    'decode'
  )
  const constructorCalls = []
  const decodeCalls = []
  const parseCalls = []
  const timerState = { callback: null, clearCount: 0 }

  function RecordingTextDecoder() {
    constructorCalls.push({
      args: [...arguments],
      clearCount: timerState.clearCount,
      newTarget: new.target,
    })
    timerState.callback?.()
    return Reflect.construct(
      NativeTextDecoder,
      [...arguments],
      new.target
    )
  }

  RecordingTextDecoder.prototype = Object.create(Object.prototype)
  IMPORTED_OBJECT_DEFINE_PROPERTY(
    RecordingTextDecoder.prototype,
    'decode',
    {
      configurable: true,
      enumerable: false,
      value() {
        decodeCalls.push({
          args: [...arguments],
          clearCount: timerState.clearCount,
          receiver: this,
        })
        timerState.callback?.()
        return IMPORTED_REFLECT_APPLY(
          nativeDecodeDescriptor.value,
          this,
          [...arguments]
        )
      },
      writable: true,
    }
  )
  let imported

  try {
    IMPORTED_OBJECT_DEFINE_PROPERTY(globalThis, 'TextDecoder', {
      ...textDecoderDescriptor,
      value: RecordingTextDecoder,
    })
    IMPORTED_OBJECT_DEFINE_PROPERTY(JSON, 'parse', {
      ...parseDescriptor,
      value() {
        parseCalls.push({
          args: [...arguments],
          clearCount: timerState.clearCount,
          receiver: this,
        })
        timerState.callback?.()
        return IMPORTED_REFLECT_APPLY(
          parseDescriptor.value,
          JSON,
          [...arguments]
        )
      },
    })
    imported = await importFreshBrowserSyncTransport(
      'decoder-parser-observation'
    )
  } finally {
    restoreOwnProperty(JSON, 'parse', parseDescriptor)
    restoreOwnProperty(globalThis, 'TextDecoder', textDecoderDescriptor)
  }

  const bodyText = '{"fixture":"decoder-profile"}'
  const responseFixture = createResponseFixture({ bodyText })
  const system = createTransportSystem({
    factory: imported.createBrowserSyncTransport,
    fetchImplementation() {
      return createResolvedNativePromise(responseFixture.response)
    },
    timerImplementation({ onDeadline, defaultHandle }) {
      timerState.callback = onDeadline
      return defaultHandle
    },
    clearTimerImplementation() {
      timerState.clearCount += 1
    },
  })

  await assertTransportSuccess(
    system.transport.sendSyncRequest(createRequest()),
    { fixture: 'decoder-profile' }
  )

  assert.equal(constructorCalls.length, 1)
  assert.strictEqual(
    constructorCalls[0].newTarget,
    RecordingTextDecoder
  )
  assert.equal(constructorCalls[0].args.length, 2)
  assert.equal(constructorCalls[0].args[0], 'utf-8')
  assertExactFrozenOwnDataRecord(
    constructorCalls[0].args[1],
    ['fatal', 'ignoreBOM']
  )
  assert.deepEqual({
    fatal: constructorCalls[0].args[1].fatal,
    ignoreBOM: constructorCalls[0].args[1].ignoreBOM,
  }, {
    fatal: true,
    ignoreBOM: true,
  })
  assert.equal(constructorCalls[0].clearCount, 1)
  assert.equal(decodeCalls.length, 1)
  assert.strictEqual(
    IMPORTED_OBJECT_GET_PROTOTYPE_OF(decodeCalls[0].receiver),
    RecordingTextDecoder.prototype
  )
  assert.equal(decodeCalls[0].args.length, 1)
  assert.equal(decodeCalls[0].args[0] instanceof Uint8Array, true)
  assert.equal(decodeCalls[0].clearCount, 1)
  assert.equal(parseCalls.length, 1)
  assert.strictEqual(parseCalls[0].receiver, JSON)
  assert.deepEqual(parseCalls[0].args, [bodyText])
  assert.equal(parseCalls[0].clearCount, 1)
  assert.equal(timerState.clearCount, 1)
  assert.equal(system.calls.abortMethod.length, 0)
})

test('erfüllt mit JSON-Primitiven gewöhnlichen Objekten und Arrays ohne semantische Responsevalidierung', async (t) => {
  const values = [
    null,
    true,
    false,
    0,
    7,
    'fixture-string',
    { fixture: 'object' },
    ['fixture', 'array'],
  ]

  for (const expectedValue of values) {
    await t.test(stringifyFixture(expectedValue), async () => {
      const responseFixture = createResponseFixture({
        bodyText: stringifyFixture(expectedValue),
      })
      const system = createTransportSystem({
        fetchImplementation() {
          return createResolvedNativePromise(responseFixture.response)
        },
      })
      await assertTransportSuccess(
        system.transport.sendSyncRequest(createRequest()),
        expectedValue
      )
    })
  }
})

test('erfüllt objektförmige Parsergebnisse ohne Clone exakt mit der einmal geparsten Identität', { concurrency: false }, async () => {
  const parseDescriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
    JSON,
    'parse'
  )
  const parsedIdentity = {
    fixture: 'parsed-identity',
    then: null,
  }
  let parseCalls = 0
  let imported

  try {
    IMPORTED_OBJECT_DEFINE_PROPERTY(JSON, 'parse', {
      ...parseDescriptor,
      value() {
        parseCalls += 1
        return parsedIdentity
      },
    })
    imported = await importFreshBrowserSyncTransport(
      'parsed-result-identity'
    )
  } finally {
    restoreOwnProperty(JSON, 'parse', parseDescriptor)
  }

  const system = createTransportSystem({
    factory: imported.createBrowserSyncTransport,
  })
  const result = await system.transport.sendSyncRequest(createRequest())

  assert.strictEqual(result, parsedIdentity)
  assert.equal(parseCalls, 1)
})

test('erlaubt nur eine eigene nicht aufrufbare then-Dateneigenschaft und blockiert geerbte Promiseassimilation', { concurrency: false }, async (t) => {
  await t.test('eigene nicht aufrufbare then-Dateneigenschaft', async () => {
    const expected = { then: 0, value: 'fixture' }
    const responseFixture = createResponseFixture({
      bodyText: stringifyFixture(expected),
    })
    const system = createTransportSystem({
      fetchImplementation() {
        return createResolvedNativePromise(responseFixture.response)
      },
    })
    await assertTransportSuccess(
      system.transport.sendSyncRequest(createRequest()),
      expected
    )
  })

  for (const [label, prototype, bodyText] of [
    ['Object.prototype.then', Object.prototype, '{}'],
    ['Array.prototype.then', Array.prototype, '[]'],
  ]) {
    await t.test(label, async () => {
      const descriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
        prototype,
        'then'
      )
      let hookCalls = 0
      const readPromises = [
        createResolvedNativePromise(
          createChunkResult(encodeFixture(bodyText))
        ),
        createResolvedNativePromise(createEofResult()),
      ]
      let readIndex = 0
      const responseFixture = createResponseFixture({
        bodyText,
        readImplementation() {
          const promise = readPromises[readIndex]
          readIndex += 1
          return promise
        },
      })
      const fetchPromise = createResolvedNativePromise(
        responseFixture.response
      )
      const system = createTransportSystem({
        fetchImplementation() {
          return fetchPromise
        },
      })
      const completion = createDeferred()
      let settlementStatus
      let settlementReason

      try {
        IMPORTED_OBJECT_DEFINE_PROPERTY(prototype, 'then', {
          configurable: true,
          enumerable: false,
          writable: true,
          value() {
            hookCalls += 1
            throw new Error('inherited-then-private-sentinel')
          },
        })
        const transportPromise = system.transport.sendSyncRequest(
          createRequest()
        )
        IMPORTED_REFLECT_APPLY(
          IMPORTED_PROMISE_PROTOTYPE.then,
          transportPromise,
          [
            (value) => {
              settlementStatus = 'fulfilled'
              settlementReason = value
              completion.resolve(undefined)
              return undefined
            },
            (reason) => {
              settlementStatus = 'rejected'
              settlementReason = reason
              completion.resolve(undefined)
              return undefined
            },
          ]
        )
        await completion.promise
      } finally {
        restoreOwnProperty(prototype, 'then', descriptor)
      }

      assert.equal(settlementStatus, 'rejected')
      assertTransportErrorRecord(settlementReason, [
        'inherited-then-private-sentinel',
      ])
      assert.equal(hookCalls, 0)
    })
  }
})

test('weist vom erfassten Parser gelieferte callable und accessorbasierte then-Werte sowie fremde Prototypen vor dem Promise-Handoff zurück', { concurrency: false }, async (t) => {
  const parseDescriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
    JSON,
    'parse'
  )
  let parsedThenGetterCalls = 0
  const fixtures = [
    {
      label: 'callable then',
      value() { return { then() {} } },
    },
    {
      label: 'then-Accessor',
      value() {
        const parsed = {}
        IMPORTED_OBJECT_DEFINE_PROPERTY(parsed, 'then', {
          configurable: true,
          enumerable: true,
          get() {
            parsedThenGetterCalls += 1
            throw new Error('parsed-then-private-sentinel')
          },
        })
        return parsed
      },
    },
    {
      label: 'Null-Prototyp',
      value() { return Object.create(null) },
    },
    {
      label: 'fremder VM-Prototyp',
      value() { return vm.runInNewContext('({ fixture: true })') },
    },
    {
      label: 'fremder VM-Arrayprototyp',
      value() { return vm.runInNewContext('["fixture"]') },
    },
  ]

  for (const fixture of fixtures) {
    await t.test(fixture.label, async () => {
      let imported

      try {
        IMPORTED_OBJECT_DEFINE_PROPERTY(JSON, 'parse', {
          ...parseDescriptor,
          value: fixture.value,
        })
        imported = await importFreshBrowserSyncTransport(
          `parsed-handoff-${fixture.label.replaceAll(' ', '-')}`
        )
      } finally {
        restoreOwnProperty(JSON, 'parse', parseDescriptor)
      }

      const system = createTransportSystem({
        factory: imported.createBrowserSyncTransport,
      })
      await assertTransportFailure(
        system.transport.sendSyncRequest(createRequest()),
        ['parsed-then-private-sentinel']
      )
    })
  }

  assert.equal(parsedThenGetterCalls, 0)
})

test('verwendet nach Beginn des Fetch ausschließlich die bei Modulevaluation erfassten JSON-, Decoder-, Reflection-, Freeze- und Buffer-Intrinsics', { concurrency: false }, async () => {
  const responseFixture = createResponseFixture()
  const responsePromise = createResolvedNativePromise(responseFixture.response)
  const descriptors = []
  let hostileCalls = 0
  let mutationsInstalled = false

  function replaceWithThrow(target, propertyName) {
    const descriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
      target,
      propertyName
    )

    if (descriptor === undefined || descriptor.configurable === false) {
      return
    }

    descriptors.push([target, propertyName, descriptor])
    const replacement = IMPORTED_OBJECT_HAS_OWN(descriptor, 'value')
      ? {
        ...descriptor,
        value() {
          hostileCalls += 1
          throw new Error('post-import-primordial-private-sentinel')
        },
      }
      : {
        ...descriptor,
        get() {
          hostileCalls += 1
          throw new Error('post-import-primordial-private-sentinel')
        },
      }
    IMPORTED_OBJECT_DEFINE_PROPERTY(target, propertyName, replacement)
  }

  function installMutations() {
    if (mutationsInstalled) {
      return
    }
    mutationsInstalled = true
    for (const [target, propertyName] of [
      [JSON, 'parse'],
      [TextDecoder.prototype, 'decode'],
      [Reflect, 'apply'],
      [Reflect, 'ownKeys'],
      [Object, 'freeze'],
      [Object, 'getOwnPropertyDescriptor'],
      [Object, 'getPrototypeOf'],
      [Object, 'hasOwn'],
      [Object, 'isFrozen'],
      [Array, 'isArray'],
      [Object.getPrototypeOf(Uint8Array.prototype), 'buffer'],
      [Object.getPrototypeOf(Uint8Array.prototype), 'byteLength'],
      [Object.getPrototypeOf(Uint8Array.prototype), 'set'],
      [ArrayBuffer.prototype, 'byteLength'],
      [ArrayBuffer.prototype, 'resizable'],
    ]) {
      replaceWithThrow(target, propertyName)
    }
  }

  const system = createTransportSystem({
    fetchImplementation() {
      installMutations()
      return responsePromise
    },
  })
  let settlement

  try {
    settlement = await captureSettlement(
      system.transport.sendSyncRequest(createRequest())
    )
  } finally {
    for (const [target, propertyName, descriptor] of descriptors.reverse()) {
      restoreOwnProperty(target, propertyName, descriptor)
    }
  }

  assert.equal(settlement.status, 'fulfilled')
  assert.equal(settlement.value, null)
  assert.equal(hostileCalls, 0)
})

test('isoliert sequenzielle und parallele Aufrufe mit frischen Controller-, RequestInit-, Header- und Readeridentitäten', async () => {
  const deferredResponses = [createDeferred(), createDeferred()]
  const responseFixtures = [
    createResponseFixture({ bodyText: '1' }),
    createResponseFixture({ bodyText: '2' }),
  ]
  const system = createTransportSystem({
    fetchImplementation({ callNumber }) {
      return deferredResponses[callNumber - 1].promise
    },
  })
  const firstPending = system.transport.sendSyncRequest(createRequest({
    requestId: REQUEST_ID,
  }))
  const secondPending = system.transport.sendSyncRequest(createRequest({
    requestId: SECOND_REQUEST_ID,
  }))

  assert.equal(system.calls.fetchRequest.length, 2)
  assert.notStrictEqual(
    system.calls.fetchRequest[0].requestInit,
    system.calls.fetchRequest[1].requestInit
  )
  assert.notStrictEqual(
    system.calls.fetchRequest[0].requestInit.headers,
    system.calls.fetchRequest[1].requestInit.headers
  )
  assert.notStrictEqual(
    system.calls.fetchRequest[0].requestInit.signal,
    system.calls.fetchRequest[1].requestInit.signal
  )

  deferredResponses[1].resolve(responseFixtures[1].response)
  await assertTransportSuccess(secondPending, 2)
  deferredResponses[0].resolve(responseFixtures[0].response)
  await assertTransportSuccess(firstPending, 1)

  assert.equal(system.calls.fetchRequest.length, 2)
  assert.equal(system.calls.createAbortController.length, 2)
  assert.equal(system.calls.setDeadlineTimer.length, 2)
  assert.equal(system.calls.clearDeadlineTimer.length, 2)
  assert.equal(system.calls.abortMethod.length, 0)
})

test('isoliert einen fehlgeschlagenen Aufruf vollständig von einem späteren Erfolg ohne Retry oder globalen Fehlerzustand', async () => {
  const responseFixture = createResponseFixture()
  const system = createTransportSystem({
    fetchImplementation({ callNumber }) {
      return callNumber === 1
        ? createRejectedNativePromise(
          new Error('isolated-failure-private-sentinel')
        )
        : createResolvedNativePromise(responseFixture.response)
    },
  })

  await assertTransportFailure(
    system.transport.sendSyncRequest(createRequest()),
    ['isolated-failure-private-sentinel']
  )
  await assertTransportSuccess(
    system.transport.sendSyncRequest(createRequest({
      requestId: SECOND_REQUEST_ID,
    })),
    null
  )

  assert.equal(system.calls.fetchRequest.length, 2)
  assert.equal(system.calls.abortMethod.length, 1)
  assert.equal(system.calls.clearDeadlineTimer.length, 2)
})

test('redigiert Request-, Dependency-, Header-, Reader-, Body- und Exceptionmarker vollständig und bleibt auf allen Fehlerpfaden Console-still', { concurrency: false }, async () => {
  const markers = [
    'request-private-sentinel',
    'fetch-private-sentinel',
    'header-private-sentinel',
    'reader-private-sentinel',
    'body-private-sentinel',
  ]
  const consoleCalls = await captureConsoleCalls(async () => {
    const systems = [
      createTransportSystem({
        fetchImplementation() {
          throw new Error(markers[1])
        },
      }),
      createTransportSystem({
        fetchImplementation() {
          const responseFixture = createResponseFixture({
            headerGetImplementation() {
              throw new Error(markers[2])
            },
          })
          return createResolvedNativePromise(responseFixture.response)
        },
      }),
      createTransportSystem({
        fetchImplementation() {
          const responseFixture = createResponseFixture({
            readImplementation() {
              return createRejectedNativePromise(new Error(markers[3]))
            },
          })
          return createResolvedNativePromise(responseFixture.response)
        },
      }),
      createTransportSystem({
        fetchImplementation() {
          const responseFixture = createResponseFixture({
            bodyText: `{"value":"${markers[4]}`,
          })
          return createResolvedNativePromise(responseFixture.response)
        },
      }),
    ]

    for (const system of systems) {
      await assertTransportFailure(
        system.transport.sendSyncRequest(createRequest({
          requestId: 'req_request-private-sentinel',
        })),
        markers
      )
      assert.ok(system.calls.fetchRequest.length <= 1)
    }
  })

  assert.deepEqual(consoleCalls, [])
})

test('ordnet den realen BrowserSyncTransport im bestehenden SyncService ausschließlich an dessen unveränderte Ergebnisgrenzen ein', async (t) => {
  async function runServiceCase({
    responseFactory,
    fetchFailure,
  }) {
    const responseFixtures = []
    const transportSystem = createTransportSystem({
      fetchImplementation({ requestInit }) {
        if (fetchFailure) {
          return createRejectedNativePromise(
            new Error('service-transport-private-sentinel')
          )
        }

        const request = parseFixture(requestInit.body)
        const responseValue = responseFactory(request)
        const responseFixture = createResponseFixture({
          bodyText: stringifyFixture(responseValue),
        })
        responseFixtures.push(responseFixture)
        return createResolvedNativePromise(responseFixture.response)
      },
    })
    const service = createSyncService({
      syncTransport: transportSystem.transport,
      generateRequestId: () => REQUEST_ID,
      getCurrentTimestamp: () => REQUEST_TIMESTAMP,
    })
    const result = await service.runSyncTest()

    return { result, responseFixtures, transportSystem }
  }

  await t.test('Transportrejection wird transportFailed', async () => {
    const system = await runServiceCase({ fetchFailure: true })
    assert.deepEqual(system.result, {
      ok: false,
      status: 'transportFailed',
      requestId: REQUEST_ID,
      syncResponse: null,
      error: {
        code: 'syncTransportFailed',
        message: 'Die Sync-Anfrage konnte nicht übermittelt werden.',
      },
    })
  })

  await t.test('malformed parsebares JSON wird invalidResponse', async () => {
    const system = await runServiceCase({
      responseFactory: () => ({}),
    })
    assert.equal(system.result.ok, false)
    assert.equal(system.result.status, 'invalidResponse')
    assert.equal(system.result.requestId, REQUEST_ID)
  })

  await t.test('unkorrelierte normale Response wird invalidResponse', async () => {
    const system = await runServiceCase({
      responseFactory: (request) => createSyntheticSuccessResponse(request, {
        requestId: SECOND_REQUEST_ID,
      }),
    })
    assert.equal(system.result.ok, false)
    assert.equal(system.result.status, 'invalidResponse')
  })

  await t.test('frühe Gatewayresponse unter HTTP 200 wird invalidResponse', async () => {
    const system = await runServiceCase({
      responseFactory: () => createSyntheticGatewayErrorResponse(),
    })
    assert.equal(system.result.ok, false)
    assert.equal(system.result.status, 'invalidResponse')
  })

  await t.test('vollständig korrelierter Erfolg bleibt erfolgreich', async () => {
    const system = await runServiceCase({
      responseFactory: (request) => createSyntheticSuccessResponse(request),
    })
    assert.equal(system.result.ok, true)
    assert.equal(system.result.status, 'syncResponseReceived')
    assert.equal(system.result.requestId, REQUEST_ID)
    assert.equal(system.result.syncResponse.success, true)
    assert.deepEqual(
      validateSyncResponse(
        system.result.syncResponse,
        parseFixture(
          system.transportSystem.calls.fetchRequest[0].requestInit.body
        )
      ),
      { ok: true, errors: [] }
    )
  })

  await t.test('gültige normale Contract-Fehlerresponse bleibt äußerlich ok true', async () => {
    const system = await runServiceCase({
      responseFactory: (request) => createSyntheticNormalErrorResponse(
        request,
        'SERVICE_UNAVAILABLE'
      ),
    })
    assert.equal(system.result.ok, true)
    assert.equal(system.result.status, 'syncResponseReceived')
    assert.equal(system.result.syncResponse.success, false)
    assert.equal(
      system.result.syncResponse.error.code,
      'SERVICE_UNAVAILABLE'
    )
  })
})

test('weist Response-, Header-, Body- und Reader-Methodenauflösungsfehler jeweils am frühesten Punkt ohne Folgezugriffe zurück', async (t) => {
  const cases = [
    {
      label: 'Statusgetterthrow',
      build() {
        const fixture = createResponseFixture({
          instrumentResponseGetters: true,
        })
        IMPORTED_OBJECT_DEFINE_PROPERTY(fixture.response, 'status', {
          configurable: true,
          enumerable: true,
          get() { throw new Error('status-getter-private-sentinel') },
        })
        return fixture
      },
    },
    {
      label: 'Headers-get-Accessorthrow',
      build() {
        const fixture = createResponseFixture()
        IMPORTED_OBJECT_DEFINE_PROPERTY(fixture.headers.headers, 'get', {
          configurable: true,
          enumerable: true,
          get() { throw new Error('headers-getter-private-sentinel') },
        })
        return fixture
      },
    },
    {
      label: 'nichtfunktionales Headers.get',
      build() {
        const fixture = createResponseFixture()
        IMPORTED_OBJECT_DEFINE_PROPERTY(fixture.headers.headers, 'get', {
          configurable: true,
          enumerable: true,
          value: null,
        })
        return fixture
      },
    },
    {
      label: 'fehlender Body',
      build() {
        const fixture = createResponseFixture()
        fixture.response.body = null
        return fixture
      },
    },
    {
      label: 'GetReader-Accessorthrow',
      build() {
        const fixture = createResponseFixture()
        IMPORTED_OBJECT_DEFINE_PROPERTY(fixture.body.body, 'getReader', {
          configurable: true,
          enumerable: true,
          get() { throw new Error('get-reader-private-sentinel') },
        })
        return fixture
      },
    },
    {
      label: 'nichtfunktionales getReader',
      build() {
        const fixture = createResponseFixture()
        IMPORTED_OBJECT_DEFINE_PROPERTY(fixture.body.body, 'getReader', {
          configurable: true,
          enumerable: true,
          value: null,
        })
        return fixture
      },
    },
    {
      label: 'Read-Accessorthrow',
      build() {
        const fixture = createResponseFixture()
        IMPORTED_OBJECT_DEFINE_PROPERTY(fixture.reader.reader, 'read', {
          configurable: true,
          enumerable: true,
          get() { throw new Error('read-getter-private-sentinel') },
        })
        return fixture
      },
    },
    {
      label: 'nichtfunktionales Read',
      build() {
        const fixture = createResponseFixture()
        IMPORTED_OBJECT_DEFINE_PROPERTY(fixture.reader.reader, 'read', {
          configurable: true,
          enumerable: true,
          value: null,
        })
        return fixture
      },
    },
    {
      label: 'nichtfunktionales Cancel',
      build() {
        const fixture = createResponseFixture()
        IMPORTED_OBJECT_DEFINE_PROPERTY(fixture.reader.reader, 'cancel', {
          configurable: true,
          enumerable: true,
          value: null,
        })
        return fixture
      },
    },
    {
      label: 'nichtfunktionales ReleaseLock',
      build() {
        const fixture = createResponseFixture()
        IMPORTED_OBJECT_DEFINE_PROPERTY(
          fixture.reader.reader,
          'releaseLock',
          {
            configurable: true,
            enumerable: true,
            value: null,
          }
        )
        return fixture
      },
    },
  ]

  for (const fixture of cases) {
    await t.test(fixture.label, async () => {
      const responseFixture = fixture.build()
      const system = createTransportSystem({
        fetchImplementation() {
          return createResolvedNativePromise(responseFixture.response)
        },
      })
      await assertTransportFailure(
        system.transport.sendSyncRequest(createRequest()),
        [
          'status-getter-private-sentinel',
          'headers-getter-private-sentinel',
          'get-reader-private-sentinel',
          'read-getter-private-sentinel',
        ]
      )
      assert.equal(system.calls.fetchRequest.length, 1)
      assert.equal(system.calls.abortMethod.length, 1)
      assert.ok(responseFixture.reader.calls.readMethod.length <= 1)
    })
  }
})

test('verarbeitet auch Reader-Promises ausschließlich über das geschlossene native Profil ohne Thenableassimilation', { concurrency: false }, async (t) => {
  await t.test('vollständig reprofiliertes VM-Read-Promise', async () => {
    const bytes = encodeFixture('null')
    let readNumber = 0
    const responseFixture = createResponseFixture({
      readImplementation() {
        readNumber += 1
        const value = readNumber === 1
          ? createChunkResult(bytes)
          : createEofResult()
        const promise = vm.runInNewContext('Promise.resolve(value)', { value })
        IMPORTED_OBJECT_SET_PROTOTYPE_OF(
          promise,
          IMPORTED_PROMISE_PROTOTYPE
        )
        return normalizeNativePromiseFixture(promise)
      },
    })
    const system = createTransportSystem({
      fetchImplementation() {
        return createResolvedNativePromise(responseFixture.response)
      },
    })
    await assertTransportSuccess(
      system.transport.sendSyncRequest(createRequest()),
      null
    )
  })

  await t.test('unverändertes VM-Read-Promise', async () => {
    const promise = normalizeNativePromiseFixture(
      vm.runInNewContext('Promise.resolve(value)', {
        value: createChunkResult(encodeFixture('null')),
      })
    )
    const responseFixture = createResponseFixture({
      readImplementation() { return promise },
    })
    const system = createTransportSystem({
      fetchImplementation() {
        return createResolvedNativePromise(responseFixture.response)
      },
    })
    await assertTransportFailure(
      system.transport.sendSyncRequest(createRequest())
    )
    assert.equal(responseFixture.reader.calls.readMethod.length, 1)
  })

  await t.test('Read-Thenable', async () => {
    let thenCalls = 0
    const responseFixture = createResponseFixture({
      readImplementation() {
        return { then() { thenCalls += 1 } }
      },
    })
    const system = createTransportSystem({
      fetchImplementation() {
        return createResolvedNativePromise(responseFixture.response)
      },
    })
    await assertTransportFailure(
      system.transport.sendSyncRequest(createRequest())
    )
    assert.equal(thenCalls, 0)
  })

  const invalidPromiseCases = [
    {
      label: 'Read-Fake mit lokalem Prototyp',
      create(value) {
        return {
          assertUnused() {},
          candidate: Object.create(IMPORTED_PROMISE_PROTOTYPE),
        }
      },
    },
    {
      label: 'Read-Proxy um echtes Promise',
      create(value) {
        return {
          assertUnused() {},
          candidate: new Proxy(createResolvedNativePromise(value), {}),
        }
      },
    },
    {
      label: 'sichtbare Read-Promise-Subclass',
      create(value) {
        class ReadFixturePromise extends IMPORTED_PROMISE {}
        return {
          assertUnused() {},
          candidate: normalizeNativePromiseFixture(
            ReadFixturePromise.resolve(value)
          ),
        }
      },
    },
    {
      label: 'Read-Promise mit eigenem Key',
      create(value) {
        const candidate = createResolvedNativePromise(value)
        candidate.fixture = true
        return { assertUnused() {}, candidate }
      },
    },
    {
      label: 'Read-Promise mit eigenem Symbol',
      create(value) {
        const candidate = createResolvedNativePromise(value)
        candidate[Symbol('read-promise-private-sentinel')] = true
        return { assertUnused() {}, candidate }
      },
    },
    {
      label: 'Read-Promise mit Constructor-Accessor',
      create(value) {
        const candidate = createResolvedNativePromise(value)
        let accessorCalls = 0
        IMPORTED_OBJECT_DEFINE_PROPERTY(candidate, 'constructor', {
          configurable: true,
          get() {
            accessorCalls += 1
            throw new Error('read-constructor-private-sentinel')
          },
        })
        return {
          assertUnused() { assert.equal(accessorCalls, 0) },
          candidate,
        }
      },
    },
  ]

  for (const fixture of invalidPromiseCases) {
    await t.test(fixture.label, async () => {
      const candidateFixture = fixture.create(
        createChunkResult(encodeFixture('null'))
      )
      const responseFixture = createResponseFixture({
        readImplementation() { return candidateFixture.candidate },
      })
      const system = createTransportSystem({
        fetchImplementation() {
          return createResolvedNativePromise(responseFixture.response)
        },
      })

      await assertTransportFailure(
        system.transport.sendSyncRequest(createRequest()),
        ['read-', 'private-sentinel']
      )
      candidateFixture.assertUnused()
      assert.equal(responseFixture.reader.calls.readMethod.length, 1)
    })
  }

  await t.test('kontrollierte native Read-Rejection', async () => {
    const responseFixture = createResponseFixture({
      readImplementation() {
        return createRejectedNativePromise(
          new Error('read-rejection-private-sentinel')
        )
      },
    })
    const system = createTransportSystem({
      fetchImplementation() {
        return createResolvedNativePromise(responseFixture.response)
      },
    })

    await assertTransportFailure(
      system.transport.sendSyncRequest(createRequest()),
      ['read-rejection-private-sentinel']
    )
    assert.equal(responseFixture.reader.calls.readMethod.length, 1)
  })
})

test('ignoriert fremde Cleanup-Thenables und konsumiert native Cleanup-Rejections ohne unhandled Rejection oder Ownerwechsel', async () => {
  let thenableCalls = 0
  const responseFixture = createResponseFixture({
    readResults: [null],
    cancelImplementation() {
      return { then() { thenableCalls += 1 } }
    },
    releaseLockImplementation() {
      return createRejectedNativePromise(
        new Error('release-cleanup-private-sentinel')
      )
    },
  })
  const system = createTransportSystem({
    fetchImplementation() {
      return createResolvedNativePromise(responseFixture.response)
    },
  })

  await assertTransportFailure(
    system.transport.sendSyncRequest(createRequest()),
    ['release-cleanup-private-sentinel']
  )
  await createNativePromise((resolve) => IMPORTED_SET_IMMEDIATE(resolve))
  assert.equal(thenableCalls, 0)
  assert.equal(responseFixture.reader.calls.cancelMethod.length, 1)
  assert.equal(responseFixture.reader.calls.releaseLockMethod.length, 1)
})

test('prüft Cleanup-Promises getrennt auf Fake Proxy Own-Key Subclass und Cross-Realm-Profil', { concurrency: false }, async (t) => {
  const cases = [
    {
      label: 'Cleanup-Thenable',
      create() {
        let thenCalls = 0
        return {
          assertUnused() { assert.equal(thenCalls, 0) },
          candidate: { then() { thenCalls += 1 } },
        }
      },
    },
    {
      label: 'Cleanup-Fake mit lokalem Prototyp',
      create() {
        return {
          assertUnused() {},
          candidate: Object.create(IMPORTED_PROMISE_PROTOTYPE),
        }
      },
    },
    {
      label: 'Cleanup-Proxy um echtes Promise',
      create() {
        return {
          assertUnused() {},
          candidate: new Proxy(createResolvedNativePromise(undefined), {}),
        }
      },
    },
    {
      label: 'sichtbare Cleanup-Promise-Subclass',
      create() {
        class CleanupFixturePromise extends IMPORTED_PROMISE {}
        return {
          assertUnused() {},
          candidate: normalizeNativePromiseFixture(
            CleanupFixturePromise.resolve(undefined)
          ),
        }
      },
    },
    {
      label: 'Cleanup-Promise mit eigenem Key',
      create() {
        const candidate = createResolvedNativePromise(undefined)
        candidate.fixture = true
        return { assertUnused() {}, candidate }
      },
    },
    {
      label: 'Cleanup-Promise mit Constructor-Accessor',
      create() {
        const candidate = createResolvedNativePromise(undefined)
        let accessorCalls = 0
        IMPORTED_OBJECT_DEFINE_PROPERTY(candidate, 'constructor', {
          configurable: true,
          get() {
            accessorCalls += 1
            throw new Error('cleanup-constructor-private-sentinel')
          },
        })
        return {
          assertUnused() { assert.equal(accessorCalls, 0) },
          candidate,
        }
      },
    },
    {
      label: 'unverändertes VM-Cleanup-Promise',
      create() {
        return {
          assertUnused() {},
          candidate: normalizeNativePromiseFixture(
            vm.runInNewContext('Promise.resolve(undefined)')
          ),
        }
      },
    },
  ]

  for (const fixture of cases) {
    await t.test(fixture.label, async () => {
      const candidateFixture = fixture.create()
      const responseFixture = createResponseFixture({
        releaseLockImplementation() { return candidateFixture.candidate },
      })
      const system = createTransportSystem({
        fetchImplementation() {
          return createResolvedNativePromise(responseFixture.response)
        },
      })

      await assertTransportSuccess(
        system.transport.sendSyncRequest(createRequest()),
        null
      )
      candidateFixture.assertUnused()
      assert.equal(responseFixture.reader.calls.releaseLockMethod.length, 1)
    })
  }

  await t.test('vollständig reprofiliertes ablehnendes VM-Cleanup-Promise', async () => {
    const marker = new Error('vm-cleanup-private-sentinel')
    const candidate = vm.runInNewContext('Promise.reject(reason)', {
      reason: marker,
    })
    IMPORTED_OBJECT_SET_PROTOTYPE_OF(candidate, IMPORTED_PROMISE_PROTOTYPE)
    normalizeNativePromiseFixture(candidate)
    const responseFixture = createResponseFixture({
      releaseLockImplementation() { return candidate },
    })
    const system = createTransportSystem({
      fetchImplementation() {
        return createResolvedNativePromise(responseFixture.response)
      },
    })

    await assertTransportSuccess(
      system.transport.sendSyncRequest(createRequest()),
      null
    )
    await createNativePromise((resolve) => IMPORTED_SET_IMMEDIATE(resolve))
  })
})

test('konsumiert zulässige native Abort- und Timer-Cleanup-Rejections ohne den ersten Owner zu ändern', async () => {
  const cleanupCalls = { abort: 0, clear: 0 }
  const controller = {
    signal: {},
    abort() {
      cleanupCalls.abort += 1
      return createRejectedNativePromise(
        new Error('abort-promise-private-sentinel')
      )
    },
  }
  const system = createTransportSystem({
    controllerImplementation() { return controller },
    fetchImplementation() {
      return createRejectedNativePromise(
        new Error('fetch-owner-private-sentinel')
      )
    },
    clearTimerImplementation() {
      cleanupCalls.clear += 1
      return createRejectedNativePromise(
        new Error('clear-promise-private-sentinel')
      )
    },
  })

  await assertTransportFailure(
    system.transport.sendSyncRequest(createRequest()),
    [
      'abort-promise-private-sentinel',
      'clear-promise-private-sentinel',
      'fetch-owner-private-sentinel',
    ]
  )
  await createNativePromise((resolve) => IMPORTED_SET_IMMEDIATE(resolve))
  assert.deepEqual(cleanupCalls, { abort: 1, clear: 1 })
  assert.equal(system.calls.fetchRequest.length, 1)
  assert.equal(system.calls.clearDeadlineTimer.length, 1)
})

test('bleibt bei post-import vergifteten Object-Descriptorhooks und numerischen Arrayprototype-Settern snapshotgetreu', { concurrency: false }, async (t) => {
  await t.test('Object.prototype get und set werden beim internen Recordbau nie gelesen', async () => {
    const originalGet = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
      Object.prototype,
      'get'
    )
    const originalSet = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
      Object.prototype,
      'set'
    )
    const system = createTransportSystem()
    let hostileGetCalls = 0
    let hostileSetCalls = 0
    let pending

    try {
      IMPORTED_OBJECT_DEFINE_PROPERTY(Object.prototype, 'get', {
        configurable: true,
        get() {
          if (
            IMPORTED_OBJECT_HAS_OWN(this, 'value') &&
            this.value === REQUEST_ID
          ) {
            hostileGetCalls += 1
          }
          return undefined
        },
      })
      IMPORTED_OBJECT_DEFINE_PROPERTY(Object.prototype, 'set', {
        configurable: true,
        get() {
          if (
            IMPORTED_OBJECT_HAS_OWN(this, 'value') &&
            this.value === REQUEST_ID
          ) {
            hostileSetCalls += 1
          }
          return undefined
        },
      })
      pending = system.transport.sendSyncRequest(createRequest())
    } finally {
      restoreOwnProperty(Object.prototype, 'set', originalSet)
      restoreOwnProperty(Object.prototype, 'get', originalGet)
    }

    const settlement = await captureSettlement(pending)
    assert.deepEqual(
      { hostileGetCalls, hostileSetCalls, status: settlement.status },
      { hostileGetCalls: 0, hostileSetCalls: 0, status: 'fulfilled' }
    )
    assert.deepEqual(settlement.value, null)
  })

  await t.test('Array.prototype Indexaccessors beeinflussen keine Snapshotwerte', async () => {
    const responseFixture = createResponseFixture()
    const responsePromise = createResolvedNativePromise(responseFixture.response)
    const controller = { signal: {}, abort() {} }
    let fetchCalls = 0
    let timerCalls = 0
    const transport = createBrowserSyncTransport({
      fetchRequest() {
        fetchCalls += 1
        return responsePromise
      },
      createAbortController() { return controller },
      setDeadlineTimer() {
        timerCalls += 1
        return { fixture: 'array-prototype-timer' }
      },
      clearDeadlineTimer() {},
    })
    const inheritedValues = [
      SYNC_CONTRACT_VERSION,
      SYNC_CONTRACT_ACTIONS[0],
      SYNC_CONTRACT_SOURCES[0],
      REQUEST_ID,
      REQUEST_TIMESTAMP,
      {},
    ]
    const originals = inheritedValues.map((_value, index) => (
      IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(Array.prototype, index)
    ))
    let hostileCalls = 0
    let pending

    try {
      for (let index = 0; index < inheritedValues.length; index += 1) {
        IMPORTED_OBJECT_DEFINE_PROPERTY(Array.prototype, index, {
          configurable: true,
          get() {
            hostileCalls += 1
            return inheritedValues[index]
          },
          set() {
            hostileCalls += 1
          },
        })
      }
      pending = transport.sendSyncRequest(createRequest())
    } finally {
      for (let index = inheritedValues.length - 1; index >= 0; index -= 1) {
        restoreOwnProperty(Array.prototype, index, originals[index])
      }
    }

    await assertTransportSuccess(pending, null)
    assert.equal(hostileCalls, 0)
    assert.equal(fetchCalls, 1)
    assert.equal(timerCalls, 1)
  })
})

test('weist interne Freeze Prototyp Descriptor und eigene toJSON-Mutationen vor Stringify und Nebenwirkungen zurück', { concurrency: false }, async (t) => {
  const freezeDescriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
    Object,
    'freeze'
  )
  const cases = [
    {
      label: 'eigene Root-toJSON-Mutation',
      expectedMutations: 1,
      mutate(value) {
        const keys = IMPORTED_REFLECT_OWN_KEYS(value)
        if (
          IMPORTED_OBJECT_GET_PROTOTYPE_OF(value) === Object.prototype &&
          keys.length === REQUEST_PROPERTY_NAMES.length &&
          REQUEST_PROPERTY_NAMES.every((propertyName) => keys.includes(
            propertyName
          ))
        ) {
          IMPORTED_OBJECT_DEFINE_PROPERTY(value, 'toJSON', {
            configurable: true,
            value() { return null },
          })
          return true
        }
        return false
      },
    },
    {
      label: 'eigene Payload-toJSON-Mutation',
      expectedMutations: 1,
      mutate(value) {
        if (
          IMPORTED_OBJECT_GET_PROTOTYPE_OF(value) === Object.prototype &&
          IMPORTED_REFLECT_OWN_KEYS(value).length === 0
        ) {
          IMPORTED_OBJECT_DEFINE_PROPERTY(value, 'toJSON', {
            configurable: true,
            value() { return null },
          })
          return true
        }
        return false
      },
    },
    {
      label: 'interne Root-Prototypmutation',
      expectedMutations: 1,
      mutate(value) {
        const keys = IMPORTED_REFLECT_OWN_KEYS(value)
        if (
          IMPORTED_OBJECT_GET_PROTOTYPE_OF(value) === Object.prototype &&
          keys.length === REQUEST_PROPERTY_NAMES.length &&
          REQUEST_PROPERTY_NAMES.every((propertyName) => keys.includes(
            propertyName
          ))
        ) {
          IMPORTED_OBJECT_SET_PROTOTYPE_OF(value, null)
          return true
        }
        return false
      },
    },
    {
      label: 'interne Root-Deskriptormutation',
      expectedMutations: 1,
      mutate(value) {
        const keys = IMPORTED_REFLECT_OWN_KEYS(value)
        if (
          IMPORTED_OBJECT_GET_PROTOTYPE_OF(value) === Object.prototype &&
          keys.length === REQUEST_PROPERTY_NAMES.length &&
          REQUEST_PROPERTY_NAMES.every((propertyName) => keys.includes(
            propertyName
          ))
        ) {
          const descriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
            value,
            'action'
          )
          IMPORTED_OBJECT_DEFINE_PROPERTY(value, 'action', {
            ...descriptor,
            enumerable: false,
          })
          return true
        }
        return false
      },
    },
    {
      label: 'umgangener interner Freeze',
      expectedMutations: 2,
      mutate(value) {
        const keys = IMPORTED_REFLECT_OWN_KEYS(value)
        const isPayload =
          IMPORTED_OBJECT_GET_PROTOTYPE_OF(value) === Object.prototype &&
          keys.length === 0
        const isRequest =
          IMPORTED_OBJECT_GET_PROTOTYPE_OF(value) === Object.prototype &&
          keys.length === REQUEST_PROPERTY_NAMES.length &&
          REQUEST_PROPERTY_NAMES.every((propertyName) => keys.includes(
            propertyName
          ))
        return isPayload || isRequest
      },
      bypassFreeze: true,
    },
  ]

  for (const fixture of cases) {
    await t.test(fixture.label, async () => {
      let mutations = 0
      let imported

      try {
        IMPORTED_OBJECT_DEFINE_PROPERTY(Object, 'freeze', {
          ...freezeDescriptor,
          value(value) {
            const mutated = fixture.mutate(value)
            if (mutated) {
              mutations += 1
              if (fixture.bypassFreeze) {
                return value
              }
            }
            return IMPORTED_REFLECT_APPLY(
              freezeDescriptor.value,
              Object,
              [value]
            )
          },
        })
        imported = await importFreshBrowserSyncTransport(
          `internal-freeze-${fixture.label.replaceAll(' ', '-')}`
        )
      } finally {
        restoreOwnProperty(Object, 'freeze', freezeDescriptor)
      }

      const system = createTransportSystem({
        factory: imported.createBrowserSyncTransport,
      })
      await assertTransportFailure(
        system.transport.sendSyncRequest(createRequest())
      )
      assert.equal(mutations, fixture.expectedMutations)
      assertNoRequestSideEffects(system.calls)
    })
  }
})

test('belegt die terminalen Root- und Payload-Prototyp-, Descriptor- und toJSON-Guards kausal mit temporären Source-Profilen', async (t) => {
  const descriptorCapture = [
    'const capturedObjectGetOwnPropertyDescriptor =',
    '  Object.getOwnPropertyDescriptor',
  ].join('\n')
  const prototypeCapture =
    'const capturedObjectGetPrototypeOf = Object.getPrototypeOf'
  const createDescriptorReplacement = ({ propertyName, keyCount }) => [
    'const capturedOriginalObjectGetOwnPropertyDescriptor =',
    '  Object.getOwnPropertyDescriptor',
    'const capturedObjectGetOwnPropertyDescriptor = function (',
    '  target,',
    '  observedPropertyName',
    ') {',
    '  const descriptor = Reflect.apply(',
    '    capturedOriginalObjectGetOwnPropertyDescriptor,',
    '    Object,',
    '    [target, observedPropertyName]',
    '  )',
    '  if (',
    `    observedPropertyName === '${propertyName}' &&`,
    '    Object.isFrozen(target) &&',
    `    Reflect.ownKeys(target).length === ${keyCount}`,
    '  ) {',
    propertyName === 'toJSON'
      ? '    return { configurable: false, enumerable: false, value: null, writable: false }'
      : '    return { ...descriptor, enumerable: false }',
    '  }',
    '  return descriptor',
    '}',
  ].join('\n')
  const createPrototypeReplacement = (keyCount) => [
    'const capturedOriginalObjectGetPrototypeOf = Object.getPrototypeOf',
    'const capturedObjectGetPrototypeOf = function (target) {',
    '  const prototype = Reflect.apply(',
    '    capturedOriginalObjectGetPrototypeOf,',
    '    Object,',
    '    [target]',
    '  )',
    '  if (',
    '    prototype === Object.prototype &&',
    '    Object.isFrozen(target) &&',
    `    Reflect.ownKeys(target).length === ${keyCount}`,
    '  ) {',
    '    return null',
    '  }',
    '  return prototype',
    '}',
  ].join('\n')
  const fixtures = [
    {
      label: 'Root-Prototypguard',
      search: prototypeCapture,
      replacement: createPrototypeReplacement(REQUEST_PROPERTY_NAMES.length),
    },
    {
      label: 'Payload-Prototypguard',
      search: prototypeCapture,
      replacement: createPrototypeReplacement(0),
    },
    {
      label: 'Root-toJSON-Guard',
      search: descriptorCapture,
      replacement: createDescriptorReplacement({
        keyCount: REQUEST_PROPERTY_NAMES.length,
        propertyName: 'toJSON',
      }),
    },
    {
      label: 'Payload-toJSON-Guard',
      search: descriptorCapture,
      replacement: createDescriptorReplacement({
        keyCount: 0,
        propertyName: 'toJSON',
      }),
    },
    {
      label: 'Root-Deskriptorguard',
      search: descriptorCapture,
      replacement: createDescriptorReplacement({
        keyCount: REQUEST_PROPERTY_NAMES.length,
        propertyName: 'action',
      }),
    },
  ]

  for (const fixture of fixtures) {
    await t.test(fixture.label, async () => {
      await withTemporaryBrowserSyncTransport(
        [{
          label: fixture.label,
          replacement: fixture.replacement,
          search: fixture.search,
        }],
        async (factory) => {
          const system = createTransportSystem({ factory })

          await assertTransportFailure(
            system.transport.sendSyncRequest(createRequest())
          )
          assertNoRequestSideEffects(system.calls)
        }
      )
    })
  }
})

test('bleibt bei post-import ersetztem Stringify Encoder und Freeze requestseitig unabhängig und stoppt eine spätere toJSON-Prototypmutation', { concurrency: false }, async () => {
  const stringifyDescriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
    JSON,
    'stringify'
  )
  const encodeDescriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
    TextEncoder.prototype,
    'encode'
  )
  const freezeDescriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
    Object,
    'freeze'
  )
  let hostileCalls = 0
  const successSystem = createTransportSystem()
  let settlement

  try {
    for (const [target, propertyName, descriptor] of [
      [JSON, 'stringify', stringifyDescriptor],
      [TextEncoder.prototype, 'encode', encodeDescriptor],
      [Object, 'freeze', freezeDescriptor],
    ]) {
      IMPORTED_OBJECT_DEFINE_PROPERTY(target, propertyName, {
        ...descriptor,
        value() {
          hostileCalls += 1
          throw new Error('request-primordial-private-sentinel')
        },
      })
    }
    settlement = await captureSettlement(
      successSystem.transport.sendSyncRequest(createRequest())
    )
  } finally {
    restoreOwnProperty(Object, 'freeze', freezeDescriptor)
    restoreOwnProperty(TextEncoder.prototype, 'encode', encodeDescriptor)
    restoreOwnProperty(JSON, 'stringify', stringifyDescriptor)
  }

  assert.equal(settlement.status, 'fulfilled')
  assert.equal(settlement.value, null)
  assert.equal(hostileCalls, 0)

  const toJsonDescriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
    Object.prototype,
    'toJSON'
  )
  let toJsonCalls = 0
  const rejectedSystem = createTransportSystem()

  try {
    IMPORTED_OBJECT_DEFINE_PROPERTY(Object.prototype, 'toJSON', {
      configurable: true,
      enumerable: false,
      writable: true,
      value() {
        toJsonCalls += 1
        throw new Error('to-json-private-sentinel')
      },
    })
    await assertTransportFailure(
      rejectedSystem.transport.sendSyncRequest(createRequest()),
      ['to-json-private-sentinel']
    )
  } finally {
    restoreOwnProperty(Object.prototype, 'toJSON', toJsonDescriptor)
  }

  assert.equal(toJsonCalls, 0)
  assertNoRequestSideEffects(rejectedSystem.calls)
})

test('weist werfende oder malformed erfasste Stringify- und Encoderresultate vor Controller Timer und Fetch zurück', { concurrency: false }, async (t) => {
  const stringifyDescriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
    JSON,
    'stringify'
  )
  const encodeDescriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
    TextEncoder.prototype,
    'encode'
  )
  const fixtures = [
    {
      label: 'Stringifythrow',
      target: JSON,
      propertyName: 'stringify',
      descriptor: stringifyDescriptor,
      replacement() { throw new Error('stringify-private-sentinel') },
    },
    {
      label: 'Stringify-Nichtstring',
      target: JSON,
      propertyName: 'stringify',
      descriptor: stringifyDescriptor,
      replacement() { return {} },
    },
    {
      label: 'Encoderthrow',
      target: TextEncoder.prototype,
      propertyName: 'encode',
      descriptor: encodeDescriptor,
      marker: 'encoder-private-sentinel',
      replacement() { throw new Error('encoder-private-sentinel') },
    },
    {
      label: 'Encoderfake',
      target: TextEncoder.prototype,
      propertyName: 'encode',
      descriptor: encodeDescriptor,
      replacement() {
        const fake = Object.create(Uint8Array.prototype)
        IMPORTED_OBJECT_DEFINE_PROPERTY(fake, 'byteLength', {
          configurable: true,
          enumerable: true,
          value: 1,
          writable: true,
        })
        return fake
      },
    },
  ]

  for (const fixture of fixtures) {
    await t.test(fixture.label, async () => {
      let imported

      try {
        IMPORTED_OBJECT_DEFINE_PROPERTY(
          fixture.target,
          fixture.propertyName,
          { ...fixture.descriptor, value: fixture.replacement }
        )
        imported = await importFreshBrowserSyncTransport(
          `malformed-${fixture.label}`
        )
      } finally {
        restoreOwnProperty(
          fixture.target,
          fixture.propertyName,
          fixture.descriptor
        )
      }

      const system = createTransportSystem({
        factory: imported.createBrowserSyncTransport,
      })
      await assertTransportFailure(
        system.transport.sendSyncRequest(createRequest()),
        [
          'stringify-private-sentinel',
          ...(fixture.marker === undefined ? [] : [fixture.marker]),
        ]
      )
      assertNoRequestSideEffects(system.calls)
    })
  }
})

test('belegt die ADR-0028-Reihenfolge mit exakt zwei Validatoren demselben Graphen einer Policy und einem Fetch', { concurrency: false }, async (t) => {
  const validRequests = [
    ['minimale ID', createRequest({ requestId: 'req_A' })],
    ['gemischte ID', createRequest({ requestId: 'req_Az09_-' })],
    ['64 Zeichen', createRequest({ requestId: MAX_REQUEST_ID })],
    ['echter Schalttag', createRequest({
      requestId: 'req_leap',
      timestamp: '2032-02-29T23:59:59.999Z',
    })],
  ]

  await withInstrumentedAdr0028Transport({}, async ({ factory, probe }) => {
    for (const [label, request] of validRequests) {
      await t.test(label, async () => {
        probe.reset()
        const system = createScalarTransportSystem({
          factory,
          onStage(stage) { probe.recordStage(stage) },
        })

        await assertTransportSuccess(
          system.transport.sendSyncRequest(request),
          null
        )

        assert.equal(probe.validatorCalls, 2)
        assert.notStrictEqual(probe.firstValidatorRequest, request)
        assert.strictEqual(
          probe.firstValidatorRequest,
          probe.secondValidatorRequest
        )
        assert.equal(probe.firstValidatorFrozen, false)
        assert.equal(probe.firstValidatorPayloadFrozen, false)
        assert.equal(probe.secondValidatorFrozen, true)
        assert.equal(probe.secondValidatorPayloadFrozen, true)
        assert.equal(probe.firstValidatorReference, request.timestamp)
        assert.equal(probe.secondValidatorReference, request.timestamp)
        assert.equal(probe.profileCalls, 1)
        assert.equal(probe.policyCalls, 1)
        assert.equal(probe.stringifyCalls, 1)
        assert.equal(probe.encodeCalls, 1)
        assert.equal(system.calls.controller, 1)
        assert.equal(system.calls.timer, 1)
        assert.equal(system.calls.fetch, 1)
        assert.equal(
          probe.order,
          'validator>validator>profile>policy>stringify>encode>controller>timer>fetch'
        )
      })
    }
  })
})

test('schließt post-import Validatorbypässe vor Stringify Encoding Controller Timer und Fetch', { concurrency: false }, async (t) => {
  function assertPolicyStop(probe, system) {
    assert.equal(probe.validatorCalls, 2)
    assert.equal(probe.profileCalls, 1)
    assert.equal(probe.policyCalls, 1)
    assert.equal(probe.stringifyCalls, 0)
    assert.equal(probe.encodeCalls, 0)
    assert.equal(system.calls.controller, 0)
    assert.equal(system.calls.timer, 0)
    assert.equal(system.calls.fetch, 0)
    assert.equal(system.calls.abort, 0)
    assert.equal(system.calls.clear, 0)
  }

  await withInstrumentedAdr0028Transport({}, async ({ factory, probe }) => {
    await t.test('Object.getOwnPropertyDescriptor spiegelt Version 1.0', async () => {
      probe.reset()
      const system = createScalarTransportSystem({ factory })
      const request = createRequest({ version: '2.0' })
      const original = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
        Object,
        'getOwnPropertyDescriptor'
      )
      let bypassCalls = 0
      let pending

      try {
        IMPORTED_OBJECT_DEFINE_PROPERTY(Object, 'getOwnPropertyDescriptor', {
          ...original,
          value(value, propertyName) {
            const descriptor = IMPORTED_REFLECT_APPLY(
              original.value,
              Object,
              [value, propertyName]
            )
            if (
              propertyName === 'version' &&
              descriptor !== undefined &&
              descriptor.value === '2.0'
            ) {
              bypassCalls += 1
              return { ...descriptor, value: '1.0' }
            }
            return descriptor
          },
        })
        pending = system.transport.sendSyncRequest(request)
      } finally {
        restoreOwnProperty(Object, 'getOwnPropertyDescriptor', original)
      }

      await assertTransportFailure(pending)
      assert.equal(bypassCalls, 2)
      assertPolicyStop(probe, system)
    })

    await t.test('Array.prototype.push unterdrückt Validatorfehler', async () => {
      probe.reset()
      const system = createScalarTransportSystem({ factory })
      const request = createRequest({ version: '2.0' })
      const original = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
        Array.prototype,
        'push'
      )
      let bypassCalls = 0
      let pending

      try {
        IMPORTED_OBJECT_DEFINE_PROPERTY(Array.prototype, 'push', {
          ...original,
          value() {
            bypassCalls += 1
            return this.length
          },
        })
        pending = system.transport.sendSyncRequest(request)
      } finally {
        restoreOwnProperty(Array.prototype, 'push', original)
      }

      await assertTransportFailure(pending)
      assert.equal(bypassCalls, 2)
      assertPolicyStop(probe, system)
    })

    await t.test('Array.prototype.includes akzeptiert falsche Aktion und Quelle', async () => {
      probe.reset()
      const system = createScalarTransportSystem({ factory })
      const request = createRequest({
        action: 'futureAction',
        source: 'future-source',
      })
      const original = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
        Array.prototype,
        'includes'
      )
      let bypassCalls = 0
      let pending

      try {
        IMPORTED_OBJECT_DEFINE_PROPERTY(Array.prototype, 'includes', {
          ...original,
          value() {
            bypassCalls += 1
            return true
          },
        })
        pending = system.transport.sendSyncRequest(request)
      } finally {
        restoreOwnProperty(Array.prototype, 'includes', original)
      }

      await assertTransportFailure(pending)
      assert.equal(bypassCalls, 4)
      assertPolicyStop(probe, system)
    })

    await t.test('RegExp.prototype.test akzeptiert eine ungültige Request-ID', async () => {
      probe.reset()
      const system = createScalarTransportSystem({ factory })
      const request = createRequest({ requestId: 'req_!' })
      const original = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
        RegExp.prototype,
        'test'
      )
      let bypassCalls = 0
      let pending

      try {
        IMPORTED_OBJECT_DEFINE_PROPERTY(RegExp.prototype, 'test', {
          ...original,
          value() {
            bypassCalls += 1
            return true
          },
        })
        pending = system.transport.sendSyncRequest(request)
      } finally {
        restoreOwnProperty(RegExp.prototype, 'test', original)
      }

      await assertTransportFailure(pending)
      assert.ok(bypassCalls >= 2)
      assertPolicyStop(probe, system)
    })

    for (const [label, propertyName, replacement] of [
      ['Map.prototype.has = false', 'has', function has() { return false }],
      ['Map.prototype.set als No-op', 'set', function set() { return this }],
    ]) {
      await t.test(label, async () => {
        probe.reset()
        const system = createScalarTransportSystem({ factory })
        const request = createRequest({ version: '2.0' })
        const original = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
          Map.prototype,
          propertyName
        )
        let bypassCalls = 0
        let pending

        try {
          IMPORTED_OBJECT_DEFINE_PROPERTY(Map.prototype, propertyName, {
            ...original,
            value(...args) {
              bypassCalls += 1
              return IMPORTED_REFLECT_APPLY(replacement, this, args)
            },
          })
          pending = system.transport.sendSyncRequest(request)
        } finally {
          restoreOwnProperty(Map.prototype, propertyName, original)
        }

        await assertTransportFailure(pending)
        assert.ok(bypassCalls > 0)
        assertPolicyStop(probe, system)
      })
    }

    await t.test('leerer Arrayiterator überspringt Validatoriteration', async () => {
      probe.reset()
      const system = createScalarTransportSystem({ factory })
      const request = createRequest({ version: '2.0' })
      const original = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
        Array.prototype,
        Symbol.iterator
      )
      let bypassCalls = 0
      let pending

      try {
        IMPORTED_OBJECT_DEFINE_PROPERTY(Array.prototype, Symbol.iterator, {
          ...original,
          value: function * emptyIterator() {
            bypassCalls += 1
          },
        })
        pending = system.transport.sendSyncRequest(request)
      } finally {
        restoreOwnProperty(Array.prototype, Symbol.iterator, original)
      }

      await assertTransportFailure(pending)
      assert.ok(bypassCalls > 0)
      assertPolicyStop(probe, system)
    })

    await t.test('live String.charCodeAt bleibt trotz Regexbypass unbenutzt', async () => {
      probe.reset()
      const system = createScalarTransportSystem({ factory })
      const request = createRequest({ requestId: 'req_!' })
      const charCodeDescriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
        String.prototype,
        'charCodeAt'
      )
      const testDescriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
        RegExp.prototype,
        'test'
      )
      let hostileStringCalls = 0
      let regexpBypassCalls = 0
      let pending

      try {
        IMPORTED_OBJECT_DEFINE_PROPERTY(String.prototype, 'charCodeAt', {
          ...charCodeDescriptor,
          value() {
            hostileStringCalls += 1
            return 65
          },
        })
        IMPORTED_OBJECT_DEFINE_PROPERTY(RegExp.prototype, 'test', {
          ...testDescriptor,
          value() {
            regexpBypassCalls += 1
            return true
          },
        })
        pending = system.transport.sendSyncRequest(request)
      } finally {
        restoreOwnProperty(RegExp.prototype, 'test', testDescriptor)
        restoreOwnProperty(
          String.prototype,
          'charCodeAt',
          charCodeDescriptor
        )
      }

      await assertTransportFailure(pending)
      assert.ok(regexpBypassCalls > 0)
      assert.equal(hostileStringCalls, 0)
      assertPolicyStop(probe, system)
    })

    await t.test('live Date.parse und Date.toISOString akzeptieren einen falschen Schalttag', async () => {
      probe.reset()
      const system = createScalarTransportSystem({ factory })
      const request = createRequest({
        timestamp: '2031-02-29T23:59:59.999Z',
      })
      const parseDescriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
        Date,
        'parse'
      )
      const isoDescriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
        Date.prototype,
        'toISOString'
      )
      const fixedMilliseconds = parseDescriptor.value(REQUEST_TIMESTAMP)
      let parseCalls = 0
      let isoCalls = 0
      let pending

      try {
        IMPORTED_OBJECT_DEFINE_PROPERTY(Date, 'parse', {
          ...parseDescriptor,
          value() {
            parseCalls += 1
            return fixedMilliseconds
          },
        })
        IMPORTED_OBJECT_DEFINE_PROPERTY(Date.prototype, 'toISOString', {
          ...isoDescriptor,
          value() {
            isoCalls += 1
            return request.timestamp
          },
        })
        pending = system.transport.sendSyncRequest(request)
      } finally {
        restoreOwnProperty(Date.prototype, 'toISOString', isoDescriptor)
        restoreOwnProperty(Date, 'parse', parseDescriptor)
      }

      await assertTransportFailure(pending)
      assert.ok(parseCalls >= 4)
      assert.ok(isoCalls >= 4)
      assertPolicyStop(probe, system)
    })

    await t.test('live Number.isFinite und Date.toISOString akzeptieren NaN', async () => {
      probe.reset()
      const system = createScalarTransportSystem({ factory })
      const request = createRequest({
        timestamp: '2031-99-99T99:99:99.999Z',
      })
      const finiteDescriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
        Number,
        'isFinite'
      )
      const isoDescriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
        Date.prototype,
        'toISOString'
      )
      let finiteCalls = 0
      let isoCalls = 0
      let pending

      try {
        IMPORTED_OBJECT_DEFINE_PROPERTY(Number, 'isFinite', {
          ...finiteDescriptor,
          value() {
            finiteCalls += 1
            return true
          },
        })
        IMPORTED_OBJECT_DEFINE_PROPERTY(Date.prototype, 'toISOString', {
          ...isoDescriptor,
          value() {
            isoCalls += 1
            return request.timestamp
          },
        })
        pending = system.transport.sendSyncRequest(request)
      } finally {
        restoreOwnProperty(Date.prototype, 'toISOString', isoDescriptor)
        restoreOwnProperty(Number, 'isFinite', finiteDescriptor)
      }

      await assertTransportFailure(pending)
      assert.ok(finiteCalls >= 4)
      assert.ok(isoCalls >= 4)
      assertPolicyStop(probe, system)
    })
  })
})

test('beweist die konkrete Lückenschließung durch Neutralisieren ausschließlich des Policycallsite', { concurrency: false }, async () => {
  async function runCase(neutralizePolicy) {
    await withInstrumentedAdr0028Transport(
      { neutralizePolicy },
      async ({ factory, probe }) => {
        const system = createScalarTransportSystem({ factory })
        const request = createRequest({ version: '2.0' })
        const original = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
          Object,
          'getOwnPropertyDescriptor'
        )
        let bypassCalls = 0
        let pending

        try {
          IMPORTED_OBJECT_DEFINE_PROPERTY(Object, 'getOwnPropertyDescriptor', {
            ...original,
            value(value, propertyName) {
              const descriptor = IMPORTED_REFLECT_APPLY(
                original.value,
                Object,
                [value, propertyName]
              )
              if (
                propertyName === 'version' &&
                descriptor?.value === '2.0'
              ) {
                bypassCalls += 1
                return { ...descriptor, value: '1.0' }
              }
              return descriptor
            },
          })
          pending = system.transport.sendSyncRequest(request)
        } finally {
          restoreOwnProperty(Object, 'getOwnPropertyDescriptor', original)
        }

        if (neutralizePolicy) {
          await assertTransportSuccess(pending, null)
          assert.equal(probe.policyCalls, 0)
          assert.equal(probe.stringifyCalls, 1)
          assert.equal(probe.encodeCalls, 1)
          assert.equal(system.calls.controller, 1)
          assert.equal(system.calls.timer, 1)
          assert.equal(system.calls.fetch, 1)
        } else {
          await assertTransportFailure(pending)
          assert.equal(probe.policyCalls, 1)
          assert.equal(probe.stringifyCalls, 0)
          assert.equal(system.calls.fetch, 0)
        }
        assert.equal(bypassCalls, 2)
        assert.equal(probe.validatorCalls, 2)
      }
    )
  }

  await runCase(false)
  await runCase(true)
})

test('erzwingt die feste Request-ID- und vollständige Timestampmatrix trotz aktivem Validatorbypass', { concurrency: false }, async (t) => {
  const invalidRequestIds = [
    ['kein Folgezeichen', 'req_'],
    ['Unterstrich als erstes Folgezeichen', 'req__'],
    ['Bindestrich als erstes Folgezeichen', 'req_-'],
    ['nicht ASCII am Anfang', 'req_ä'],
    ['nicht ASCII später', 'req_Aä'],
    ['astrales Zeichen', 'req_A🌲'],
    ['Ausrufezeichen', 'req_A!'],
    ['Punkt', 'req_A.'],
    ['Slash', 'req_A/'],
    ['Doppelpunkt', 'req_A:'],
    ['Leerzeichen', 'req_A '],
    ['65 Zeichen', TOO_LONG_REQUEST_ID],
  ]
  const separatorPositions = [4, 7, 10, 13, 16, 19, 23]
  const digitPositions = [
    0, 1, 2, 3, 5, 6, 8, 9, 11, 12, 14, 15, 17, 18, 20, 21, 22,
  ]
  const invalidTimestamps = [
    ['Länge 23', REQUEST_TIMESTAMP.slice(0, -1)],
    ['Länge 25', `${REQUEST_TIMESTAMP}0`],
    ['Fullwidth-Ziffer', `２${REQUEST_TIMESTAMP.slice(1)}`],
    ['Monat 00', '2031-00-05T10:20:30.000Z'],
    ['Monat 13', '2031-13-05T10:20:30.000Z'],
    ['Tag 00', '2031-04-00T10:20:30.000Z'],
    ['31. April', '2031-04-31T10:20:30.000Z'],
    ['falscher Schalttag', '2031-02-29T10:20:30.000Z'],
    ['Stunde 24', '2031-04-05T24:20:30.000Z'],
    ['Minute 60', '2031-04-05T10:60:30.000Z'],
    ['Sekunde 60', '2031-04-05T10:20:60.000Z'],
    ['Rollover-Tag', '2031-11-31T10:20:30.000Z'],
  ]

  function replaceCodeUnit(value, index, replacement) {
    return `${value.slice(0, index)}${replacement}${value.slice(index + 1)}`
  }

  for (const position of separatorPositions) {
    invalidTimestamps.push([
      `Separatorposition ${position}`,
      replaceCodeUnit(REQUEST_TIMESTAMP, position, 'X'),
    ])
  }
  for (const position of digitPositions) {
    invalidTimestamps.push([
      `Zifferposition ${position}`,
      replaceCodeUnit(REQUEST_TIMESTAMP, position, 'X'),
    ])
  }

  await withInstrumentedAdr0028Transport({}, async ({ factory, probe }) => {
    async function assertRejectedWithPushBypass(request) {
      probe.reset()
      const system = createScalarTransportSystem({ factory })
      const pushDescriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
        Array.prototype,
        'push'
      )
      let bypassCalls = 0
      let pending

      try {
        IMPORTED_OBJECT_DEFINE_PROPERTY(Array.prototype, 'push', {
          ...pushDescriptor,
          value() {
            bypassCalls += 1
            return this.length
          },
        })
        pending = system.transport.sendSyncRequest(request)
      } finally {
        restoreOwnProperty(Array.prototype, 'push', pushDescriptor)
      }

      await assertTransportFailure(pending)
      assert.ok(bypassCalls > 0)
      assert.equal(probe.validatorCalls, 2)
      assert.equal(probe.profileCalls, 1)
      assert.equal(probe.policyCalls, 1)
      assert.equal(probe.stringifyCalls, 0)
      assert.equal(probe.encodeCalls, 0)
      assert.equal(system.calls.controller, 0)
      assert.equal(system.calls.timer, 0)
      assert.equal(system.calls.fetch, 0)
    }

    for (const [label, requestId] of invalidRequestIds) {
      await t.test(`Request-ID ${label}`, async () => {
        await assertRejectedWithPushBypass(createRequest({ requestId }))
      })
    }

    for (const [label, timestamp] of invalidTimestamps) {
      await t.test(`Timestamp ${label}`, async () => {
        await assertRejectedWithPushBypass(createRequest({ timestamp }))
      })
    }
  })
})

test('prüft die interne Zeittoleranz exakt bei plus und minus 300000 sowie 300001 Millisekunden', { concurrency: false }, async (t) => {
  const policyCallsite = [
    'if (!hasFixedV1WirePolicy(',
    '    internal.request,',
    '    internal.payload,',
    '    snapshot.timestamp',
    '  )) {',
  ].join('\n')
  const cases = [
    ['plus 300000', '2031-04-05T10:15:30.000Z', true],
    ['minus 300000', '2031-04-05T10:25:30.000Z', true],
    ['plus 300001', '2031-04-05T10:15:29.999Z', false],
    ['minus 300001', '2031-04-05T10:25:30.001Z', false],
  ]

  for (const [label, referenceTimestamp, accepted] of cases) {
    await t.test(label, async () => {
      await withInstrumentedAdr0028Transport({
        transportMutations: [{
          label: `ADR-0028 Policyreferenz ${label}`,
          search: policyCallsite,
          replacement: [
            'if (!hasFixedV1WirePolicy(',
            '    internal.request,',
            '    internal.payload,',
            `    '${referenceTimestamp}'`,
            '  )) {',
          ].join('\n'),
        }],
      }, async ({ factory, probe }) => {
        const system = createScalarTransportSystem({ factory })
        const pending = system.transport.sendSyncRequest(createRequest())

        if (accepted) {
          await assertTransportSuccess(pending, null)
          assert.equal(system.calls.fetch, 1)
          assert.equal(probe.stringifyCalls, 1)
        } else {
          await assertTransportFailure(pending)
          assert.equal(system.calls.fetch, 0)
          assert.equal(probe.stringifyCalls, 0)
        }
        assert.equal(probe.validatorCalls, 2)
        assert.equal(probe.policyCalls, 1)
      })
    })
  }
})

test('weist einen durch manipuliertes Math.abs verdeckten 300001-ms-Abstand in der festen Policy zurück', { concurrency: false }, async () => {
  const referenceTimestamp = '2031-04-05T10:25:30.001Z'
  const firstValidation = [
    'firstValidation = validateSyncRequest(',
    '      internal.request,',
    '      snapshot.timestamp',
    '    )',
  ].join('\n')
  const secondValidation = [
    'secondValidation = validateSyncRequest(',
    '      internal.request,',
    '      snapshot.timestamp',
    '    )',
  ].join('\n')
  const policyCallsite = [
    'if (!hasFixedV1WirePolicy(',
    '    internal.request,',
    '    internal.payload,',
    '    snapshot.timestamp',
    '  )) {',
  ].join('\n')

  await withInstrumentedAdr0028Transport({
    transportMutations: [
      {
        label: 'ADR-0028 erste ferne Validatorreferenz',
        search: firstValidation,
        replacement: [
          'firstValidation = validateSyncRequest(',
          '      internal.request,',
          `      '${referenceTimestamp}'`,
          '    )',
        ].join('\n'),
      },
      {
        label: 'ADR-0028 zweite ferne Validatorreferenz',
        search: secondValidation,
        replacement: [
          'secondValidation = validateSyncRequest(',
          '      internal.request,',
          `      '${referenceTimestamp}'`,
          '    )',
        ].join('\n'),
      },
      {
        label: 'ADR-0028 ferne Policyreferenz',
        search: policyCallsite,
        replacement: [
          'if (!hasFixedV1WirePolicy(',
          '    internal.request,',
          '    internal.payload,',
          `    '${referenceTimestamp}'`,
          '  )) {',
        ].join('\n'),
      },
    ],
  }, async ({ factory, probe }) => {
    const system = createScalarTransportSystem({ factory })
    const descriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(Math, 'abs')
    let bypassCalls = 0
    let pending

    try {
      IMPORTED_OBJECT_DEFINE_PROPERTY(Math, 'abs', {
        ...descriptor,
        value() {
          bypassCalls += 1
          return 0
        },
      })
      pending = system.transport.sendSyncRequest(createRequest())
    } finally {
      restoreOwnProperty(Math, 'abs', descriptor)
    }

    await assertTransportFailure(pending)
    assert.equal(bypassCalls, 2)
    assert.equal(probe.validatorCalls, 2)
    assert.equal(probe.policyCalls, 1)
    assert.equal(probe.stringifyCalls, 0)
    assert.equal(system.calls.fetch, 0)
  })
})

test('weist fehlerhafte interne Graphen selbständig bei neutralisiertem terminalem Profilguard zurück', { concurrency: false }, async (t) => {
  const profileCallsite = [
    '!hasExactFrozenRequestProfile(',
    '      internal.request,',
    '      internal.payload,',
    '      snapshot',
    '    )',
  ].join('\n')
  const fixedValidatorResult = {
    label: 'ADR-0028 kontrollierter erfolgreicher Contractmutant',
    search: '  const result = validateRequestStructure(\n    syncRequest,',
    replacement: [
      '  return { ok: true, errors: [] }',
      '  const result = validateRequestStructure(',
      '    syncRequest,',
    ].join('\n'),
  }
  const neutralizedProfile = {
    label: 'ADR-0028 neutralisierter terminaler Profilguard',
    search: profileCallsite,
    replacement: 'false',
  }
  const internalReturnAnchor = '  ])\n\n  return { payload, request }'
  const cases = [
    {
      label: 'zusätzliches Rootfeld',
      mutation: {
        search: "    ['payload', payload],",
        replacement: "    ['payload', payload],\n    ['extra', true],",
      },
    },
    {
      label: 'fehlendes Rootfeld',
      mutation: {
        search: "    ['source', snapshot.source],\n",
        replacement: '',
      },
    },
    {
      label: 'nicht aufzählbares Rootfeld',
      mutation: {
        search: internalReturnAnchor,
        replacement: [
          '  ])',
          '',
          "  capturedObjectDefineProperty(request, 'source', {",
          '    configurable: true,',
          '    enumerable: false,',
          '    value: snapshot.source,',
          '    writable: true,',
          '  })',
          '',
          '  return { payload, request }',
        ].join('\n'),
      },
    },
    {
      label: 'nicht gefrorener Root',
      mutation: {
        search: '    capturedObjectFreeze(internal.request)',
        replacement: '    internal.request',
      },
    },
    {
      label: 'falsche Rootprototypkette',
      mutation: {
        search: '  const request = createDataRecord(capturedObjectPrototype, [',
        replacement: '  const request = createDataRecord(null, [',
      },
    },
    {
      label: 'zusätzliches Payloadfeld',
      mutation: {
        search: '  const payload = createDataRecord(capturedObjectPrototype, [])',
        replacement: "  const payload = createDataRecord(capturedObjectPrototype, [['extra', true]])",
      },
    },
    {
      label: 'nicht gefrorenes Payload',
      mutation: {
        search: '    capturedObjectFreeze(internal.payload)',
        replacement: '    internal.payload',
      },
    },
    {
      label: 'falsche Payloadprototypkette',
      mutation: {
        search: '  const payload = createDataRecord(capturedObjectPrototype, [])',
        replacement: '  const payload = createDataRecord(null, [])',
      },
    },
    {
      label: 'eigenes Root-toJSON',
      mutation: {
        search: "    ['payload', payload],",
        replacement: "    ['payload', payload],\n    ['toJSON', null],",
      },
    },
    {
      label: 'eigenes Payload-toJSON',
      mutation: {
        search: '  const payload = createDataRecord(capturedObjectPrototype, [])',
        replacement: "  const payload = createDataRecord(capturedObjectPrototype, [['toJSON', null]])",
      },
    },
    {
      label: 'andere leere Frozen-Payloadidentität im Rootdeskriptor',
      mutation: {
        search: "    ['payload', payload],",
        replacement: [
          "    ['payload', capturedObjectFreeze(",
          '      createDataRecord(capturedObjectPrototype, [])',
          '    )],',
        ].join('\n'),
      },
    },
  ]

  for (const fixture of cases) {
    await t.test(fixture.label, async () => {
      await withInstrumentedAdr0028Transport({
        contractMutations: [fixedValidatorResult],
        transportMutations: [
          neutralizedProfile,
          {
            label: `ADR-0028 interner Graph ${fixture.label}`,
            ...fixture.mutation,
          },
        ],
      }, async ({ factory, probe }) => {
        const system = createScalarTransportSystem({ factory })
        await assertTransportFailure(
          system.transport.sendSyncRequest(createRequest())
        )
        assert.equal(probe.validatorCalls, 2)
        assert.equal(probe.profileCalls, 0)
        assert.equal(probe.policyCalls, 1)
        assert.equal(probe.stringifyCalls, 0)
        assert.equal(probe.encodeCalls, 0)
        assert.equal(system.calls.controller, 0)
        assert.equal(system.calls.timer, 0)
        assert.equal(system.calls.fetch, 0)
      })
    })
  }

  await t.test('eigenes Object.prototype.toJSON', async () => {
    await withInstrumentedAdr0028Transport({
      contractMutations: [fixedValidatorResult],
      transportMutations: [neutralizedProfile],
    }, async ({ factory, probe }) => {
      const system = createScalarTransportSystem({ factory })
      const descriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
        Object.prototype,
        'toJSON'
      )
      let hookCalls = 0
      let pending

      try {
        IMPORTED_OBJECT_DEFINE_PROPERTY(Object.prototype, 'toJSON', {
          configurable: true,
          enumerable: false,
          value() {
            hookCalls += 1
            return null
          },
          writable: true,
        })
        pending = system.transport.sendSyncRequest(createRequest())
      } finally {
        restoreOwnProperty(Object.prototype, 'toJSON', descriptor)
      }

      await assertTransportFailure(pending)
      assert.equal(hookCalls, 0)
      assert.equal(probe.profileCalls, 0)
      assert.equal(probe.policyCalls, 1)
      assert.equal(probe.stringifyCalls, 0)
      assert.equal(system.calls.fetch, 0)
    })
  })
})

test('blockiert persistent vergiftete private Validator-Regex- und Setinstanzen aus verworfenen Quellkopien', { concurrency: false }, async (t) => {
  await t.test('private Request-ID-Regex', async () => {
    await withInstrumentedAdr0028Transport({
      contractMutations: [{
        label: 'ADR-0028 private Validator-Regexvergiftung',
        search: 'const REQUEST_ID_PATTERN = /^req_[A-Za-z0-9][A-Za-z0-9_-]*$/',
        replacement: [
          'const REQUEST_ID_PATTERN = /^req_[A-Za-z0-9][A-Za-z0-9_-]*$/',
          'REQUEST_ID_PATTERN.test = function () {',
          `  globalThis.${ADR_0028_PROBE_PROPERTY}.privateRegexCalls += 1`,
          '  return true',
          '}',
        ].join('\n'),
      }],
    }, async ({ factory, probe }) => {
      probe.privateRegexCalls = 0
      const system = createScalarTransportSystem({ factory })
      await assertTransportFailure(
        system.transport.sendSyncRequest(createRequest({ requestId: 'req_!' }))
      )
      assert.equal(probe.privateRegexCalls, 2)
      assert.equal(probe.policyCalls, 1)
      assert.equal(probe.stringifyCalls, 0)
      assert.equal(system.calls.fetch, 0)
    })
  })

  await t.test('private Empty-Payload-Set-Allowlist', async () => {
    const profileCallsite = [
      '!hasExactFrozenRequestProfile(',
      '      internal.request,',
      '      internal.payload,',
      '      snapshot',
      '    )',
    ].join('\n')
    await withInstrumentedAdr0028Transport({
      contractMutations: [{
        label: 'ADR-0028 private Validator-Setvergiftung',
        search: 'const EMPTY_PROPERTY_NAME_SET = new Set()',
        replacement: [
          'const EMPTY_PROPERTY_NAME_SET = new Set()',
          'EMPTY_PROPERTY_NAME_SET.has = function () {',
          `  globalThis.${ADR_0028_PROBE_PROPERTY}.privateSetCalls += 1`,
          '  return true',
          '}',
        ].join('\n'),
      }],
      transportMutations: [
        {
          label: 'ADR-0028 neutralisierter Profilguard für Private-Set-Probe',
          search: profileCallsite,
          replacement: 'false',
        },
        {
          label: 'ADR-0028 zusätzliches internes Payloadfeld für Private-Set-Probe',
          search: '  const payload = createDataRecord(capturedObjectPrototype, [])',
          replacement: "  const payload = createDataRecord(capturedObjectPrototype, [['extra', true]])",
        },
      ],
    }, async ({ factory, probe }) => {
      probe.privateSetCalls = 0
      const system = createScalarTransportSystem({ factory })
      await assertTransportFailure(
        system.transport.sendSyncRequest(createRequest())
      )
      assert.equal(probe.privateSetCalls, 2)
      assert.equal(probe.validatorCalls, 2)
      assert.equal(probe.profileCalls, 0)
      assert.equal(probe.policyCalls, 1)
      assert.equal(probe.stringifyCalls, 0)
      assert.equal(system.calls.fetch, 0)
    })
  })
})

test('weist eine echte Content-Length null vor Content-Encoding Body Reader und Chunk zurück', async () => {
  const responseFixture = createResponseFixture({
    contentLength: null,
    instrumentResponseGetters: true,
  })
  const system = createTransportSystem({
    fetchImplementation() {
      return createResolvedNativePromise(responseFixture.response)
    },
  })

  await assertTransportFailure(system.transport.sendSyncRequest(createRequest()))
  assert.deepEqual(responseFixture.responseEvents, [
    'status',
    'redirected',
    'url',
    'type',
    'headers',
  ])
  assert.deepEqual(
    responseFixture.headers.calls.getMethod.map((call) => call.headerName),
    ['content-type', 'content-length']
  )
  assert.equal(responseFixture.body.calls.getReaderResolution, 0)
  assert.equal(responseFixture.body.calls.getReaderMethod.length, 0)
  assert.equal(responseFixture.reader.calls.readResolution, 0)
  assert.equal(responseFixture.reader.calls.readMethod.length, 0)
  assert.equal(responseFixture.reader.calls.cancelMethod.length, 0)
  assert.equal(responseFixture.reader.calls.releaseLockMethod.length, 0)
  assert.equal(system.calls.abortMethod.length, 1)
  assert.equal(system.calls.clearDeadlineTimer.length, 1)
})

test('lässt eine synchron gewinnende Deadline mit anschließendem Timerthrow ohne Handle weder Fetch Abort noch Clear erreichen', async () => {
  const system = createTransportSystem({
    timerImplementation({ onDeadline }) {
      onDeadline()
      throw new Error('deadline-then-timer-throw-private-sentinel')
    },
  })

  await assertTransportFailure(
    system.transport.sendSyncRequest(createRequest()),
    ['deadline-then-timer-throw-private-sentinel']
  )
  assert.equal(system.calls.setDeadlineTimer.length, 1)
  assert.equal(system.calls.fetchRequest.length, 0)
  assert.equal(system.calls.abortMethod.length, 0)
  assert.equal(system.calls.clearDeadlineTimer.length, 0)
})

test('stoppt ersatzdecodierbar ungültiges UTF-8 vor JSON.parse und zählt echte Mehrbytebytes exakt', { concurrency: false }, async (t) => {
  await t.test('ungültige Bytes ergeben keinen Parseversuch', async () => {
    const parseDescriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
      JSON,
      'parse'
    )
    let parseCalls = 0
    let imported

    try {
      IMPORTED_OBJECT_DEFINE_PROPERTY(JSON, 'parse', {
        ...parseDescriptor,
        value(...args) {
          parseCalls += 1
          return IMPORTED_REFLECT_APPLY(parseDescriptor.value, JSON, args)
        },
      })
      imported = await importFreshBrowserSyncTransport(
        'adr-0028-invalid-utf8-no-parse'
      )
    } finally {
      restoreOwnProperty(JSON, 'parse', parseDescriptor)
    }

    const responseFixture = createResponseFixture({
      bodyText: '"x"',
      contentLength: '3',
      chunks: [new Uint8Array([0x22, 0x80, 0x22])],
    })
    const system = createTransportSystem({
      factory: imported.createBrowserSyncTransport,
      fetchImplementation() {
        return createResolvedNativePromise(responseFixture.response)
      },
    })

    await assertTransportFailure(
      system.transport.sendSyncRequest(createRequest())
    )
    assert.equal(parseCalls, 0)
    assert.equal(responseFixture.reader.calls.readMethod.length, 2)
    assert.equal(responseFixture.reader.calls.releaseLockMethod.length, 1)
    assert.equal(system.calls.clearDeadlineTimer.length, 1)
    assert.equal(system.calls.abortMethod.length, 1)
  })

  await t.test('Umlaut und Emoji verwenden den exakten UTF-8-Bytecount', async () => {
    const expected = 'Grüße 🌲'
    const bodyText = stringifyFixture(expected)
    const expectedBytes = encodeFixture(bodyText)
    const responseFixture = createResponseFixture({ bodyText })
    const system = createTransportSystem({
      fetchImplementation() {
        return createResolvedNativePromise(responseFixture.response)
      },
    })

    await assertTransportSuccess(
      system.transport.sendSyncRequest(createRequest()),
      expected
    )
    assert.equal(responseFixture.bytes.byteLength, expectedBytes.byteLength)
    assert.equal(
      responseFixture.headers.values['content-length'],
      String(expectedBytes.byteLength)
    )
    assert.ok(expectedBytes.byteLength > bodyText.length)
  })
})

test('coerciert weder Responsefelder noch browserexponierte Header und stoppt jeweils stagegenau', async (t) => {
  const responseCases = [
    ['status', ['status']],
    ['redirected', ['status', 'redirected']],
    ['url', ['status', 'redirected', 'url']],
    ['type', ['status', 'redirected', 'url', 'type']],
    ['headers', ['status', 'redirected', 'url', 'type', 'headers']],
    ['body', ['status', 'redirected', 'url', 'type', 'headers', 'body']],
  ]

  for (const [propertyName, expectedEvents] of responseCases) {
    await t.test(`Responsefeld ${propertyName}`, async () => {
      const probe = createCoercionProbe(`response-${propertyName}`)
      const responseFixture = createResponseFixture({
        instrumentResponseGetters: true,
      })
      responseFixture.responseValues[propertyName] = probe.value
      const system = createTransportSystem({
        fetchImplementation() {
          return createResolvedNativePromise(responseFixture.response)
        },
      })

      await assertTransportFailure(
        system.transport.sendSyncRequest(createRequest())
      )
      assert.deepEqual(probe.calls, {
        symbolToPrimitive: 0,
        toString: 0,
        valueOf: 0,
      })
      assert.deepEqual(responseFixture.responseEvents, expectedEvents)
      if (propertyName !== 'body') {
        assert.equal(responseFixture.body.calls.getReaderResolution, 0)
      }
    })
  }

  for (const [headerName, expectedHeaders] of [
    ['content-type', ['content-type']],
    ['content-length', ['content-type', 'content-length']],
    [
      'content-encoding',
      ['content-type', 'content-length', 'content-encoding'],
    ],
  ]) {
    await t.test(`Header ${headerName}`, async () => {
      const probe = createCoercionProbe(`header-${headerName}`)
      const responseFixture = createResponseFixture({
        headerGetImplementation({ headerName: observedName, values }) {
          return observedName === headerName
            ? probe.value
            : values[observedName]
        },
      })
      const system = createTransportSystem({
        fetchImplementation() {
          return createResolvedNativePromise(responseFixture.response)
        },
      })

      await assertTransportFailure(
        system.transport.sendSyncRequest(createRequest())
      )
      assert.deepEqual(probe.calls, {
        symbolToPrimitive: 0,
        toString: 0,
        valueOf: 0,
      })
      assert.deepEqual(
        responseFixture.headers.calls.getMethod.map((call) => call.headerName),
        expectedHeaders
      )
      assert.equal(responseFixture.body.calls.getReaderResolution, 0)
    })
  }
})

test('schärft Headers-get GetReader Read Cancel und ReleaseLock für Getter Nichtfunktion und Callthrow stagegenau', async (t) => {
  const cases = [
    {
      label: 'Headers.get Getterthrow',
      build() {
        const fixture = createResponseFixture()
        IMPORTED_OBJECT_DEFINE_PROPERTY(fixture.headers.headers, 'get', {
          configurable: true,
          get() { throw new Error('stage-headers-getter-private-sentinel') },
        })
        return fixture
      },
      expected: { headerResolution: 0, headerCalls: 0, getReader: 0, read: 0, cancel: 0, release: 0 },
    },
    {
      label: 'Headers.get nichtfunktional',
      build() {
        const fixture = createResponseFixture()
        IMPORTED_OBJECT_DEFINE_PROPERTY(fixture.headers.headers, 'get', {
          configurable: true,
          value: null,
        })
        return fixture
      },
      expected: { headerResolution: 0, headerCalls: 0, getReader: 0, read: 0, cancel: 0, release: 0 },
    },
    {
      label: 'Headers.get Callthrow',
      build() {
        return createResponseFixture({
          headerGetImplementation() {
            throw new Error('stage-headers-call-private-sentinel')
          },
        })
      },
      expected: { headerResolution: 1, headerCalls: 1, getReader: 0, read: 0, cancel: 0, release: 0 },
    },
    {
      label: 'getReader Getterthrow',
      build() {
        const fixture = createResponseFixture()
        IMPORTED_OBJECT_DEFINE_PROPERTY(fixture.body.body, 'getReader', {
          configurable: true,
          get() { throw new Error('stage-get-reader-getter-private-sentinel') },
        })
        return fixture
      },
      expected: { headerResolution: 1, headerCalls: 3, getReader: 0, read: 0, cancel: 0, release: 0 },
    },
    {
      label: 'getReader nichtfunktional',
      build() {
        const fixture = createResponseFixture()
        IMPORTED_OBJECT_DEFINE_PROPERTY(fixture.body.body, 'getReader', {
          configurable: true,
          value: null,
        })
        return fixture
      },
      expected: { headerResolution: 1, headerCalls: 3, getReader: 0, read: 0, cancel: 0, release: 0 },
    },
    {
      label: 'getReader Callthrow',
      build() {
        return createResponseFixture({
          getReaderImplementation() {
            throw new Error('stage-get-reader-call-private-sentinel')
          },
        })
      },
      expected: { headerResolution: 1, headerCalls: 3, getReader: 1, read: 0, cancel: 0, release: 0 },
    },
    {
      label: 'read Getterthrow',
      build() {
        const fixture = createResponseFixture()
        IMPORTED_OBJECT_DEFINE_PROPERTY(fixture.reader.reader, 'read', {
          configurable: true,
          get() { throw new Error('stage-read-getter-private-sentinel') },
        })
        return fixture
      },
      expected: { headerResolution: 1, headerCalls: 3, getReader: 1, read: 0, cancel: 1, release: 1 },
    },
    {
      label: 'read nichtfunktional',
      build() {
        const fixture = createResponseFixture()
        IMPORTED_OBJECT_DEFINE_PROPERTY(fixture.reader.reader, 'read', {
          configurable: true,
          value: null,
        })
        return fixture
      },
      expected: { headerResolution: 1, headerCalls: 3, getReader: 1, read: 0, cancel: 1, release: 1 },
    },
    {
      label: 'read Callthrow',
      build() {
        return createResponseFixture({
          readImplementation() {
            throw new Error('stage-read-call-private-sentinel')
          },
        })
      },
      expected: { headerResolution: 1, headerCalls: 3, getReader: 1, read: 1, cancel: 1, release: 1 },
    },
    {
      label: 'cancel Getterthrow',
      build() {
        const fixture = createResponseFixture()
        IMPORTED_OBJECT_DEFINE_PROPERTY(fixture.reader.reader, 'cancel', {
          configurable: true,
          get() { throw new Error('stage-cancel-getter-private-sentinel') },
        })
        return fixture
      },
      expected: { headerResolution: 1, headerCalls: 3, getReader: 1, read: 0, cancel: 0, release: 1 },
    },
    {
      label: 'cancel nichtfunktional',
      build() {
        const fixture = createResponseFixture()
        IMPORTED_OBJECT_DEFINE_PROPERTY(fixture.reader.reader, 'cancel', {
          configurable: true,
          value: null,
        })
        return fixture
      },
      expected: { headerResolution: 1, headerCalls: 3, getReader: 1, read: 0, cancel: 0, release: 1 },
    },
    {
      label: 'cancel Callthrow',
      build() {
        return createResponseFixture({
          readResults: [null],
          cancelImplementation() {
            throw new Error('stage-cancel-call-private-sentinel')
          },
        })
      },
      expected: { headerResolution: 1, headerCalls: 3, getReader: 1, read: 1, cancel: 1, release: 1 },
    },
    {
      label: 'releaseLock Getterthrow',
      build() {
        const fixture = createResponseFixture()
        IMPORTED_OBJECT_DEFINE_PROPERTY(fixture.reader.reader, 'releaseLock', {
          configurable: true,
          get() { throw new Error('stage-release-getter-private-sentinel') },
        })
        return fixture
      },
      expected: { headerResolution: 1, headerCalls: 3, getReader: 1, read: 0, cancel: 1, release: 0 },
    },
    {
      label: 'releaseLock nichtfunktional',
      build() {
        const fixture = createResponseFixture()
        IMPORTED_OBJECT_DEFINE_PROPERTY(fixture.reader.reader, 'releaseLock', {
          configurable: true,
          value: null,
        })
        return fixture
      },
      expected: { headerResolution: 1, headerCalls: 3, getReader: 1, read: 0, cancel: 1, release: 0 },
    },
    {
      label: 'releaseLock Callthrow',
      build() {
        return createResponseFixture({
          releaseLockImplementation() {
            throw new Error('stage-release-call-private-sentinel')
          },
        })
      },
      expected: { headerResolution: 1, headerCalls: 3, getReader: 1, read: 2, cancel: 1, release: 1 },
    },
  ]

  for (const fixture of cases) {
    await t.test(fixture.label, async () => {
      const responseFixture = fixture.build()
      const system = createTransportSystem({
        fetchImplementation() {
          return createResolvedNativePromise(responseFixture.response)
        },
      })

      await assertTransportFailure(
        system.transport.sendSyncRequest(createRequest()),
        ['stage-', 'private-sentinel']
      )
      assert.equal(
        responseFixture.headers.calls.getResolution,
        fixture.expected.headerResolution
      )
      assert.equal(
        responseFixture.headers.calls.getMethod.length,
        fixture.expected.headerCalls
      )
      assert.equal(
        responseFixture.body.calls.getReaderMethod.length,
        fixture.expected.getReader
      )
      assert.equal(
        responseFixture.reader.calls.readMethod.length,
        fixture.expected.read
      )
      assert.equal(
        responseFixture.reader.calls.cancelMethod.length,
        fixture.expected.cancel
      )
      assert.equal(
        responseFixture.reader.calls.releaseLockMethod.length,
        fixture.expected.release
      )
      assert.equal(system.calls.fetchRequest.length, 1)
      assert.equal(system.calls.abortMethod.length, 1)
      assert.equal(system.calls.clearDeadlineTimer.length, 1)
    })
  }
})

test('weist post-import Prototypkettenabweichungen an der jeweils frühesten Integritätsstufe zurück', { concurrency: false }, async (t) => {
  function deviateForSynchronousSend(target, send) {
    const originalPrototype = IMPORTED_OBJECT_GET_PROTOTYPE_OF(target)
    let pending

    try {
      IMPORTED_OBJECT_SET_PROTOTYPE_OF(target, null)
      pending = send()
    } finally {
      IMPORTED_OBJECT_SET_PROTOTYPE_OF(target, originalPrototype)
    }

    return pending
  }

  await withInstrumentedAdr0028Transport({}, async ({ factory, probe }) => {
    await t.test('Array.prototype stoppt nach beiden Validatoren vor dem Terminalprofil', async () => {
      probe.reset()
      const system = createScalarTransportSystem({ factory })
      const pending = deviateForSynchronousSend(
        Array.prototype,
        () => system.transport.sendSyncRequest(createRequest())
      )

      await assertTransportFailure(pending)
      assert.equal(probe.validatorCalls, 2)
      assert.equal(probe.profileCalls, 0)
      assert.equal(probe.policyCalls, 0)
      assert.equal(probe.stringifyCalls, 0)
      assert.equal(probe.encodeCalls, 0)
      assert.equal(system.calls.controller, 0)
      assert.equal(system.calls.timer, 0)
      assert.equal(system.calls.fetch, 0)
    })

    await t.test('Date.prototype stoppt in der festen Policy', async () => {
      probe.reset()
      const system = createScalarTransportSystem({ factory })
      const pending = deviateForSynchronousSend(
        Date.prototype,
        () => system.transport.sendSyncRequest(createRequest())
      )

      await assertTransportFailure(pending)
      assert.equal(probe.validatorCalls, 2)
      assert.equal(probe.profileCalls, 1)
      assert.equal(probe.policyCalls, 1)
      assert.equal(probe.stringifyCalls, 0)
      assert.equal(probe.encodeCalls, 0)
      assert.equal(system.calls.controller, 0)
      assert.equal(system.calls.timer, 0)
      assert.equal(system.calls.fetch, 0)
    })

    await t.test('TextEncoder.prototype stoppt nach Stringify vor Encode', async () => {
      probe.reset()
      const system = createScalarTransportSystem({ factory })
      const pending = deviateForSynchronousSend(
        TextEncoder.prototype,
        () => system.transport.sendSyncRequest(createRequest())
      )

      await assertTransportFailure(pending)
      assert.equal(probe.validatorCalls, 2)
      assert.equal(probe.policyCalls, 1)
      assert.equal(probe.stringifyCalls, 1)
      assert.equal(probe.encodeCalls, 0)
      assert.equal(system.calls.controller, 0)
      assert.equal(system.calls.timer, 0)
      assert.equal(system.calls.fetch, 0)
    })

    const typedArrayPrototype = IMPORTED_OBJECT_GET_PROTOTYPE_OF(
      Uint8Array.prototype
    )
    const encodingProfileCases = [
      ['Uint8Array.prototype', Uint8Array.prototype],
      ['%TypedArray%.prototype', typedArrayPrototype],
      ['ArrayBuffer.prototype', ArrayBuffer.prototype],
    ]

    for (const [label, target] of encodingProfileCases) {
      await t.test(`${label} stoppt nach Encode vor Controller`, async () => {
        probe.reset()
        const system = createScalarTransportSystem({ factory })
        const pending = deviateForSynchronousSend(
          target,
          () => system.transport.sendSyncRequest(createRequest())
        )

        await assertTransportFailure(pending)
        assert.equal(probe.validatorCalls, 2)
        assert.equal(probe.policyCalls, 1)
        assert.equal(probe.stringifyCalls, 1)
        assert.equal(probe.encodeCalls, 1)
        assert.equal(system.calls.controller, 0)
        assert.equal(system.calls.timer, 0)
        assert.equal(system.calls.fetch, 0)
      })
    }

    await t.test('Promise.prototype stoppt nach Fetch vor erfasstem then', async () => {
      probe.reset()
      const system = createScalarTransportSystem({ factory })
      const pending = deviateForSynchronousSend(
        Promise.prototype,
        () => system.transport.sendSyncRequest(createRequest())
      )

      await assertTransportFailure(pending)
      assert.equal(probe.validatorCalls, 2)
      assert.equal(probe.policyCalls, 1)
      assert.equal(probe.stringifyCalls, 1)
      assert.equal(probe.encodeCalls, 1)
      assert.equal(probe.promiseThenCalls, 0)
      assert.equal(system.calls.controller, 1)
      assert.equal(system.calls.timer, 1)
      assert.equal(system.calls.fetch, 1)
      assert.equal(system.calls.abort, 1)
      assert.equal(system.calls.clear, 1)
    })

    await t.test('TextDecoder.prototype stoppt nach Readerfreigabe vor Decode und Parse', async () => {
      probe.reset()
      const system = createScalarTransportSystem({ factory })
      const originalPrototype = IMPORTED_OBJECT_GET_PROTOTYPE_OF(
        TextDecoder.prototype
      )
      let settlement

      try {
        IMPORTED_OBJECT_SET_PROTOTYPE_OF(TextDecoder.prototype, null)
        settlement = await captureSettlement(
          system.transport.sendSyncRequest(createRequest())
        )
      } finally {
        IMPORTED_OBJECT_SET_PROTOTYPE_OF(
          TextDecoder.prototype,
          originalPrototype
        )
      }

      assert.equal(settlement.status, 'rejected')
      assertTransportErrorRecord(settlement.reason)
      assert.equal(probe.validatorCalls, 2)
      assert.equal(probe.policyCalls, 1)
      assert.equal(probe.stringifyCalls, 1)
      assert.equal(probe.encodeCalls, 1)
      assert.equal(probe.decodeCalls, 0)
      assert.equal(probe.parseCalls, 0)
      assert.equal(system.calls.fetch, 1)
      assert.equal(system.calls.read, 2)
      assert.equal(system.calls.release, 1)
      assert.equal(system.calls.abort, 1)
      assert.equal(system.calls.cancel, 1)
      assert.equal(system.calls.clear, 1)
    })
  })
})

test('verwendet für die Date-Policy nur die bei Modulevaluation erfassten Methoden', { concurrency: false }, async () => {
  await withInstrumentedAdr0028Transport({}, async ({ factory, probe }) => {
    const getTimeDescriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
      Date.prototype,
      'getTime'
    )
    const toISOStringDescriptor = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
      Date.prototype,
      'toISOString'
    )
    const system = createScalarTransportSystem({ factory })
    let liveGetTimeCalls = 0
    let liveToISOStringCalls = 0
    let pending

    try {
      IMPORTED_OBJECT_DEFINE_PROPERTY(Date.prototype, 'getTime', {
        ...getTimeDescriptor,
        value() {
          liveGetTimeCalls += 1
          throw new Error('live-date-get-time-private-sentinel')
        },
      })
      IMPORTED_OBJECT_DEFINE_PROPERTY(Date.prototype, 'toISOString', {
        ...toISOStringDescriptor,
        value() {
          liveToISOStringCalls += 1
          return REQUEST_TIMESTAMP
        },
      })
      pending = system.transport.sendSyncRequest(createRequest())
    } finally {
      restoreOwnProperty(
        Date.prototype,
        'toISOString',
        toISOStringDescriptor
      )
      restoreOwnProperty(Date.prototype, 'getTime', getTimeDescriptor)
    }

    await assertTransportSuccess(pending, null)
    assert.equal(liveGetTimeCalls, 0)
    assert.equal(liveToISOStringCalls, 4)
    assert.equal(probe.validatorCalls, 2)
    assert.equal(probe.policyCalls, 1)
    assert.equal(probe.stringifyCalls, 1)
    assert.equal(system.calls.fetch, 1)
  })
})

test('simuliert die hostseitig unveränderliche Object.prototype-Kette mit einem privaten veränderlichen Capture', { concurrency: false }, async () => {
  const objectPrototypeCapture = [
    'const capturedObjectPrototype = Object.prototype',
  ].join('\n')
  const runtimeGuard = [
    '      if (!runtimeIntrinsicsAreUsable()) {',
    '        throw createFactoryError()',
    '      }',
  ].join('\n')
  const controlledValidator = {
    label: 'ADR-0028 kontrollierter Validator für Object-Prototypsimulation',
    search: '  const result = validateRequestStructure(\n    syncRequest,',
    replacement: [
      '  return { ok: true, errors: [] }',
      '  const result = validateRequestStructure(',
      '    syncRequest,',
    ].join('\n'),
  }

  await withInstrumentedAdr0028Transport({
    contractMutations: [controlledValidator],
    transportMutations: [
      {
        label: 'ADR-0028 privates veränderliches Object-Prototypcapture',
        search: objectPrototypeCapture,
        replacement: [
          'const capturedObjectPrototype = capturedObjectCreate(null)',
          `globalThis.${ADR_0028_PROBE_PROPERTY}.mutableObjectPrototype =`,
          '  capturedObjectPrototype',
        ].join('\n'),
      },
      {
        label: 'ADR-0028 isoliert neutralisiertes Factory-Runtimegate',
        search: runtimeGuard,
        replacement: [
          '      if (false && !runtimeIntrinsicsAreUsable()) {',
          '        throw createFactoryError()',
          '      }',
        ].join('\n'),
      },
    ],
  }, async ({ factory, probe }) => {
    const capturedPrototype = probe.mutableObjectPrototype
    const composition = IMPORTED_OBJECT_CREATE(capturedPrototype)
    const calls = {
      controller: 0,
      fetch: 0,
      timer: 0,
    }

    for (const [propertyName, value] of [
      ['fetchRequest', function () { calls.fetch += 1 }],
      ['createAbortController', function () { calls.controller += 1 }],
      ['setDeadlineTimer', function () { calls.timer += 1 }],
      ['clearDeadlineTimer', function () {}],
    ]) {
      IMPORTED_OBJECT_DEFINE_PROPERTY(composition, propertyName, {
        configurable: true,
        enumerable: true,
        value,
        writable: true,
      })
    }

    const payload = IMPORTED_OBJECT_CREATE(capturedPrototype)
    const request = IMPORTED_OBJECT_CREATE(capturedPrototype)

    for (const [propertyName, value] of [
      ['version', '1.0'],
      ['action', 'syncTest'],
      ['source', 'goldendawn-os'],
      ['requestId', REQUEST_ID],
      ['timestamp', REQUEST_TIMESTAMP],
      ['payload', payload],
    ]) {
      IMPORTED_OBJECT_DEFINE_PROPERTY(request, propertyName, {
        configurable: true,
        enumerable: true,
        value,
        writable: true,
      })
    }

    const transport = factory(composition)
    const hostileParent = IMPORTED_OBJECT_CREATE(null)
    let pending

    try {
      IMPORTED_OBJECT_SET_PROTOTYPE_OF(capturedPrototype, hostileParent)
      pending = transport.sendSyncRequest(request)
    } finally {
      IMPORTED_OBJECT_SET_PROTOTYPE_OF(capturedPrototype, null)
    }

    const settlement = await captureSettlement(pending)
    assert.equal(settlement.status, 'rejected')
    assert.equal(settlement.reason.code, EXPECTED_TRANSPORT_ERROR.code)
    assert.equal(settlement.reason.message, EXPECTED_TRANSPORT_ERROR.message)
    assert.equal(probe.validatorCalls, 0)
    assert.equal(probe.policyCalls, 0)
    assert.equal(probe.stringifyCalls, 0)
    assert.deepEqual(calls, { controller: 0, fetch: 0, timer: 0 })
  })
})

test('prüft reversible Constructor- und Species-Descriptorflag-Abweichungen getrennt bei Fetch Read und Cleanup', { concurrency: false }, async (t) => {
  const descriptorFixtures = [
    {
      flagName: 'enumerable',
      label: 'Constructor enumerable',
      propertyName: 'constructor',
      target: Promise.prototype,
    },
    {
      flagName: 'writable',
      label: 'Constructor writable',
      propertyName: 'constructor',
      target: Promise.prototype,
    },
    {
      flagName: 'enumerable',
      label: 'Species enumerable',
      propertyName: Symbol.species,
      target: Promise,
    },
  ]

  await withInstrumentedAdr0028Transport({}, async ({ factory, probe }) => {
    for (const descriptorFixture of descriptorFixtures) {
      const original = IMPORTED_OBJECT_GET_OWN_PROPERTY_DESCRIPTOR(
        descriptorFixture.target,
        descriptorFixture.propertyName
      )
      const deviating = {
        ...original,
        [descriptorFixture.flagName]:
          !original[descriptorFixture.flagName],
      }

      await t.test(`${descriptorFixture.label} beim Fetch`, async () => {
        probe.reset()
        const responseFixture = createResponseFixture()
        const candidate = createResolvedNativePromise(responseFixture.response)
        const system = createTransportSystem({
          factory,
          fetchImplementation() { return candidate },
        })
        probe.promiseThenTarget = candidate
        let pending

        try {
          IMPORTED_OBJECT_DEFINE_PROPERTY(
            descriptorFixture.target,
            descriptorFixture.propertyName,
            deviating
          )
          pending = system.transport.sendSyncRequest(createRequest())
        } finally {
          restoreOwnProperty(
            descriptorFixture.target,
            descriptorFixture.propertyName,
            original
          )
        }

        await assertTransportFailure(pending)
        assert.equal(probe.promiseThenTargetCalls, 0)
        assert.equal(system.calls.fetchRequest.length, 1)
        assert.equal(responseFixture.body.calls.getReaderResolution, 0)
        assert.equal(system.calls.abortMethod.length, 1)
        assert.equal(system.calls.clearDeadlineTimer.length, 1)
      })

      await t.test(`${descriptorFixture.label} beim Read`, async () => {
        probe.reset()
        const candidate = createResolvedNativePromise(
          createChunkResult(encodeFixture('null'))
        )
        const responseFixture = createResponseFixture({
          cancelImplementation() { return undefined },
          readImplementation() {
            IMPORTED_OBJECT_DEFINE_PROPERTY(
              descriptorFixture.target,
              descriptorFixture.propertyName,
              deviating
            )
            return candidate
          },
        })
        const system = createTransportSystem({
          factory,
          fetchImplementation() {
            return createResolvedNativePromise(responseFixture.response)
          },
        })
        probe.promiseThenTarget = candidate
        let settlement

        try {
          settlement = await captureSettlement(
            system.transport.sendSyncRequest(createRequest())
          )
        } finally {
          restoreOwnProperty(
            descriptorFixture.target,
            descriptorFixture.propertyName,
            original
          )
        }

        assert.equal(settlement.status, 'rejected')
        assertTransportErrorRecord(settlement.reason)
        assert.equal(probe.promiseThenTargetCalls, 0)
        assert.equal(probe.promiseThenCalls, 1)
        assert.equal(responseFixture.reader.calls.readMethod.length, 1)
        assert.equal(responseFixture.reader.calls.cancelMethod.length, 1)
        assert.equal(
          responseFixture.reader.calls.releaseLockMethod.length,
          1
        )
        assert.equal(system.calls.abortMethod.length, 1)
        assert.equal(system.calls.clearDeadlineTimer.length, 1)
      })

      await t.test(`${descriptorFixture.label} beim Cleanup`, async () => {
        probe.reset()
        const candidate = createResolvedNativePromise(undefined)
        const responseFixture = createResponseFixture({
          releaseLockImplementation() {
            IMPORTED_OBJECT_DEFINE_PROPERTY(
              descriptorFixture.target,
              descriptorFixture.propertyName,
              deviating
            )
            return candidate
          },
        })
        const system = createTransportSystem({
          factory,
          fetchImplementation() {
            return createResolvedNativePromise(responseFixture.response)
          },
        })
        probe.promiseThenTarget = candidate
        let settlement

        try {
          settlement = await captureSettlement(
            system.transport.sendSyncRequest(createRequest())
          )
        } finally {
          restoreOwnProperty(
            descriptorFixture.target,
            descriptorFixture.propertyName,
            original
          )
        }

        assert.equal(settlement.status, 'fulfilled')
        assert.equal(settlement.value, null)
        assert.equal(probe.promiseThenTargetCalls, 0)
        assert.equal(probe.promiseThenCalls, 3)
        assert.equal(responseFixture.reader.calls.readMethod.length, 2)
        assert.equal(
          responseFixture.reader.calls.releaseLockMethod.length,
          1
        )
        assert.equal(system.calls.abortMethod.length, 0)
        assert.equal(system.calls.clearDeadlineTimer.length, 1)
      })
    }
  })
})

test('isoliert irreversible Constructor- und Species-Descriptorflags bei Fetch Read und Cleanup in Kindprozessen', { concurrency: false }, async (t) => {
  const expectedCallsByStage = {
    fetch: {
      abort: 1,
      cancel: 0,
      clear: 1,
      controller: 1,
      fetch: 1,
      mutation: 1,
      read: 0,
      release: 0,
      timer: 1,
    },
    read: {
      abort: 1,
      cancel: 1,
      clear: 1,
      controller: 1,
      fetch: 1,
      mutation: 1,
      read: 1,
      release: 1,
      timer: 1,
    },
    cleanup: {
      abort: 0,
      cancel: 0,
      clear: 1,
      controller: 1,
      fetch: 1,
      mutation: 1,
      read: 2,
      release: 1,
      timer: 1,
    },
  }

  for (const descriptorKind of ['constructor', 'species']) {
    for (const stage of ['fetch', 'read', 'cleanup']) {
      await t.test(`${descriptorKind} ${stage}`, async () => {
        const result = await runIsolatedNodeScript(
          createIsolatedPromiseProbeSource({ descriptorKind, stage }),
          `irreversible-${descriptorKind}-${stage}`
        )

        assert.equal(result.descriptorKind, descriptorKind)
        assert.equal(result.stage, stage)
        assert.equal(result.rejectedFixture, false)
        assert.equal(result.candidateOwnKeyCount, 0)
        assert.equal(result.currentDescriptorConfigurable, false)
        assert.equal(result.targetThenCalls, 0)
        assert.equal(result.hostEventCount, 0)
        assert.equal(result.hostReasonMatchedCount, 0)
        assert.equal(result.publicContainsMarker, false)
        assert.deepEqual(result.calls, expectedCallsByStage[stage])

        if (stage === 'cleanup') {
          assert.equal(result.publicStatus, 'fulfilled')
          assert.equal(result.publicValueWasNull, true)
          assert.equal(result.publicCode, null)
          assert.equal(result.publicMessage, null)
        } else {
          assert.equal(result.publicStatus, 'rejected')
          assert.equal(result.publicValueWasNull, false)
          assert.equal(result.publicCode, EXPECTED_TRANSPORT_ERROR.code)
          assert.equal(result.publicMessage, EXPECTED_TRANSPORT_ERROR.message)
        }
      })
    }
  }
})

test('charakterisiert abgelehnte malformed Promises im aktuellen wegwerfbaren Node-Kindprozess ohne Assimilation oder öffentliche Grundausgabe', { concurrency: false }, async (t) => {
  const expectedCallsByStage = {
    fetch: {
      abort: 1,
      cancel: 0,
      clear: 1,
      controller: 1,
      fetch: 1,
      mutation: 0,
      read: 0,
      release: 0,
      timer: 1,
    },
    read: {
      abort: 1,
      cancel: 1,
      clear: 1,
      controller: 1,
      fetch: 1,
      mutation: 0,
      read: 1,
      release: 1,
      timer: 1,
    },
    cleanup: {
      abort: 0,
      cancel: 0,
      clear: 1,
      controller: 1,
      fetch: 1,
      mutation: 0,
      read: 2,
      release: 1,
      timer: 1,
    },
  }

  for (const stage of ['fetch', 'read', 'cleanup']) {
    await t.test(stage, async () => {
      const result = await runIsolatedNodeScript(
        createIsolatedPromiseProbeSource({ rejected: true, stage }),
        `rejected-malformed-${stage}`
      )

      assert.equal(result.descriptorKind, null)
      assert.equal(result.stage, stage)
      assert.equal(result.rejectedFixture, true)
      assert.equal(result.candidateOwnKeyCount, 1)
      assert.equal(result.currentDescriptorConfigurable, null)
      assert.equal(result.targetThenCalls, 0)
      assert.equal(result.publicContainsMarker, false)
      assert.equal(result.hostEventCount, 1)
      assert.equal(result.hostReasonMatchedCount, 1)
      assert.match(result.nodeVersion, /^v\d+\.\d+\.\d+/)
      assert.equal(
        stringifyFixture(result).includes(
          'isolated-rejection-private-sentinel'
        ),
        false
      )
      assert.deepEqual(result.calls, expectedCallsByStage[stage])

      if (stage === 'cleanup') {
        assert.equal(result.publicStatus, 'fulfilled')
        assert.equal(result.publicValueWasNull, true)
        assert.equal(result.publicCode, null)
        assert.equal(result.publicMessage, null)
      } else {
        assert.equal(result.publicStatus, 'rejected')
        assert.equal(result.publicValueWasNull, false)
        assert.equal(result.publicCode, EXPECTED_TRANSPORT_ERROR.code)
        assert.equal(result.publicMessage, EXPECTED_TRANSPORT_ERROR.message)
      }
    })
  }
})
