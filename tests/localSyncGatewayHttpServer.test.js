import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import http from 'node:http'
import net from 'node:net'
import path from 'node:path'
import test from 'node:test'
import { pathToFileURL } from 'node:url'

import {
  SYNC_CONTRACT_MAX_RAW_BODY_BYTES,
  validateSyncGatewayErrorResponse,
} from '../src/contracts/syncContract.js'
import {
  createSyncGatewayRequestBoundary,
} from '../src/gateways/syncGatewayRequestBoundary.js'
import * as localSyncGatewayHttpServerModule from
  '../server/localSyncGatewayHttpServer.js'
import * as localSyncGatewayRuntimeConfigModule from
  '../server/localSyncGatewayRuntimeConfig.js'

const {
  LOCAL_SYNC_GATEWAY_HTTP_LIMITS,
  createLocalSyncGatewayHttpServer,
} = localSyncGatewayHttpServerModule
const { readLocalSyncGatewayRuntimeConfig } =
  localSyncGatewayRuntimeConfigModule

const LOOPBACK_HOST = '127.0.0.1'
const GATEWAY_PATH = '/api/sync-test'
const ALLOWED_ORIGIN = 'http://localhost:4173'
const REFERENCE_TIMESTAMP = '2031-04-05T10:20:30.000Z'
const REQUEST_ID = 'req_48be0e81-2ace-46df-b713-3d580f313b71'
const GATEWAY_REQUEST_ID =
  'gateway_63bf9a18-177f-4f35-8a04-1b619bada742'
const TEST_TIMEOUT_MS = 4_000
const TEST_TIMEOUT_POLICY = Object.freeze({
  headersTimeoutMs: 250,
  requestTimeoutMs: 500,
  connectionsCheckingIntervalMs: 25,
})
const TEST_TIMER_SCHEDULING_TOLERANCE_MS = 250
const RAW_SOCKET_CLOSE_UPPER_BOUND_MS = 1_000

const LOCAL_HTTP_PROFILES = Object.freeze({
  invalidHttpRequest: Object.freeze({
    httpStatus: 400,
    status: 'invalidHttpRequest',
    code: 'invalidLocalSyncGatewayHttpRequest',
    message: 'Die lokale SyncGateway-HTTP-Anfrage ist ungültig.',
  }),
  originRejected: Object.freeze({
    httpStatus: 403,
    status: 'originRejected',
    code: 'localSyncGatewayOriginRejected',
    message: 'Die Anfrage ist für diese lokale Origin nicht erlaubt.',
  }),
  routeNotFound: Object.freeze({
    httpStatus: 404,
    status: 'routeNotFound',
    code: 'localSyncGatewayRouteNotFound',
    message:
      'Die angeforderte lokale SyncGateway-Route ist nicht verfügbar.',
  }),
  methodNotAllowed: Object.freeze({
    httpStatus: 405,
    status: 'methodNotAllowed',
    code: 'localSyncGatewayMethodNotAllowed',
    message:
      'Die HTTP-Methode ist für das lokale SyncGateway nicht erlaubt.',
  }),
  payloadTooLarge: Object.freeze({
    httpStatus: 413,
    status: 'payloadTooLarge',
    code: 'localSyncGatewayPayloadTooLarge',
    message:
      'Die lokale SyncGateway-Anfrage überschreitet die zulässige Größe.',
  }),
  unsupportedMediaType: Object.freeze({
    httpStatus: 415,
    status: 'unsupportedMediaType',
    code: 'localSyncGatewayUnsupportedMediaType',
    message:
      'Medientyp oder Inhaltskodierung der lokalen SyncGateway-Anfrage wird nicht unterstützt.',
  }),
  expectationRejected: Object.freeze({
    httpStatus: 417,
    status: 'expectationRejected',
    code: 'localSyncGatewayExpectationRejected',
    message:
      'Die HTTP-Erwartung wird vom lokalen SyncGateway nicht unterstützt.',
  }),
  requestHeadersTooLarge: Object.freeze({
    httpStatus: 431,
    status: 'requestHeadersTooLarge',
    code: 'localSyncGatewayRequestHeadersTooLarge',
    message:
      'Die HTTP-Header der lokalen SyncGateway-Anfrage überschreiten die zulässige Größe.',
  }),
  gatewayFailed: Object.freeze({
    httpStatus: 500,
    status: 'gatewayFailed',
    code: 'localSyncGatewayFailed',
    message:
      'Die lokale SyncGateway-Anfrage konnte nicht sicher verarbeitet werden.',
  }),
  upstreamUnavailable: Object.freeze({
    httpStatus: 503,
    status: 'upstreamUnavailable',
    code: 'localSyncGatewayUpstreamUnavailable',
    message: 'Der lokale SyncGateway-Upstream ist noch nicht implementiert.',
  }),
})

function createSyncRequest(overrides = {}) {
  return {
    version: '1.0',
    action: 'syncTest',
    source: 'goldendawn-os',
    requestId: REQUEST_ID,
    timestamp: REFERENCE_TIMESTAMP,
    payload: {},
    ...overrides,
  }
}

function createRawSyncRequest(overrides = {}) {
  return JSON.stringify(createSyncRequest(overrides))
}

function deepFreezeFixture(value, seen = new Set()) {
  if (
    value === null ||
    (typeof value !== 'object' && typeof value !== 'function') ||
    seen.has(value)
  ) {
    return value
  }

  seen.add(value)

  for (const propertyName of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, propertyName)

    if (descriptor && Object.hasOwn(descriptor, 'value')) {
      deepFreezeFixture(descriptor.value, seen)
    }
  }

  return Object.freeze(value)
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
  assert.equal(Object.isFrozen(value), true)

  for (const propertyName of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, propertyName)

    if (descriptor && Object.hasOwn(descriptor, 'value')) {
      assertDeepFrozen(descriptor.value, seen)
    }
  }
}

function assertExactOwnKeys(value, expectedKeys) {
  assert.deepEqual(Reflect.ownKeys(value), expectedKeys)

  for (const propertyName of expectedKeys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, propertyName)

    assert.ok(descriptor)
    assert.equal(descriptor.enumerable, true)
    assert.equal(Object.hasOwn(descriptor, 'value'), true)
  }
}

function createAcceptedBoundaryResult() {
  const syncRequest = createSyncRequest()

  deepFreezeFixture(syncRequest)

  return Object.freeze({
    ok: true,
    status: 'syncRequestAccepted',
    syncRequest,
    gatewayErrorResponse: null,
    error: null,
  })
}

function createLocalBoundaryFailure() {
  return deepFreezeFixture({
    ok: false,
    status: 'boundaryFailed',
    syncRequest: null,
    gatewayErrorResponse: null,
    error: {
      code: 'syncGatewayBoundaryFailed',
      message:
        'Die Sync-Anfrage konnte an der Gateway-Grenze nicht sicher verarbeitet werden.',
    },
  })
}

function createBoundaryProbe(implementation = () => (
  createAcceptedBoundaryResult()
)) {
  const calls = []
  const boundary = Object.freeze({
    processSyncRawBody(rawBody) {
      calls.push({ rawBody, receiver: this })
      return implementation({ callNumber: calls.length, rawBody })
    },
  })

  return { boundary, calls }
}

function createRealBoundaryProbe() {
  let gatewayIdNumber = 0
  const realBoundary = createSyncGatewayRequestBoundary({
    generateGatewayRequestId() {
      gatewayIdNumber += 1
      return gatewayIdNumber === 1
        ? GATEWAY_REQUEST_ID
        : `gateway_00000000-0000-4000-8000-${String(gatewayIdNumber).padStart(12, '0')}`
    },
    getCurrentTimestamp: () => REFERENCE_TIMESTAMP,
  })
  const calls = []
  const boundary = Object.freeze({
    processSyncRawBody(rawBody) {
      const result = realBoundary.processSyncRawBody(rawBody)
      calls.push({ rawBody, result, receiver: this })
      return result
    },
  })

  return { boundary, calls }
}

function createDecoderProbe({
  fatal = true,
  ignoreBOM = true,
  decodeImplementation,
} = {}) {
  const calls = {
    create: [],
    decode: [],
  }

  function createTextDecoder(...args) {
    calls.create.push({ args, receiver: this })
    const nativeDecoder = new TextDecoder('utf-8', {
      fatal: true,
      ignoreBOM: true,
    })

    return {
      fatal,
      ignoreBOM,
      decode(...decodeArguments) {
        calls.decode.push({ args: decodeArguments, receiver: this })

        if (decodeImplementation) {
          return decodeImplementation({
            decodeArguments,
            nativeDecoder,
          })
        }

        return Reflect.apply(
          nativeDecoder.decode,
          nativeDecoder,
          decodeArguments
        )
      },
    }
  }

  return { calls, createTextDecoder }
}

function buildRequestHeaders(port, bodyByteLength, overrides = {}) {
  return {
    Host: `${LOOPBACK_HOST}:${port}`,
    Origin: ALLOWED_ORIGIN,
    'Content-Type': 'application/json',
    'Content-Length': String(bodyByteLength),
    Connection: 'close',
    ...overrides,
  }
}

async function sendHttpRequest({
  port,
  method = 'POST',
  requestPath = GATEWAY_PATH,
  headers,
  bodyChunks = [],
}) {
  return new Promise((resolve, reject) => {
    let settled = false
    const request = http.request({
      agent: false,
      headers,
      host: LOOPBACK_HOST,
      method,
      path: requestPath,
      port,
    })
    const timeout = setTimeout(() => {
      request.destroy(new Error('fixture-http-client-timeout'))
    }, TEST_TIMEOUT_MS)

    function settle(callback, value) {
      if (settled) {
        return
      }

      settled = true
      clearTimeout(timeout)
      callback(value)
    }

    request.once('error', (error) => settle(reject, error))
    request.once('response', (response) => {
      const responseChunks = []

      response.on('data', (chunk) => responseChunks.push(chunk))
      response.once('error', (error) => settle(reject, error))
      response.once('end', () => {
        settle(resolve, {
          body: Buffer.concat(responseChunks),
          headers: response.headers,
          rawHeaders: response.rawHeaders,
          statusCode: response.statusCode,
        })
      })
    })

    for (const bodyChunk of bodyChunks) {
      request.write(bodyChunk)
    }

    request.end()
  })
}

function createRawHeaderBlock(requestLine, headerLines) {
  return Buffer.from(
    [requestLine, ...headerLines, '', ''].join('\r\n'),
    'latin1'
  )
}

async function sendRawSocketWrites(port, writeGroups) {
  const socket = net.createConnection({ host: LOOPBACK_HOST, port })
  const responseChunks = []
  let socketError = null
  let timeout

  socket.on('data', (chunk) => responseChunks.push(chunk))
  socket.on('error', (error) => {
    socketError = error
  })

  try {
    await Promise.race([
      once(socket, 'connect'),
      new Promise((_, reject) => {
        socket.once('error', reject)
      }),
    ])
    socket.setNoDelay(true)
    timeout = setTimeout(() => {
      socket.destroy(new Error('fixture-raw-client-timeout'))
    }, TEST_TIMEOUT_MS)

    for (const writeGroup of writeGroups) {
      if (socket.destroyed || !socket.writable) {
        break
      }

      await new Promise((resolveWrite) => {
        socket.write(writeGroup, () => resolveWrite())
      })
      await new Promise((resolveTurn) => setImmediate(resolveTurn))
    }

    if (!socket.destroyed && socket.writable) {
      socket.end()
    }

    if (!socket.destroyed) {
      await new Promise((resolveClose) => {
        socket.once('close', resolveClose)
      })
    }
  } finally {
    clearTimeout(timeout)
    socket.destroy()
  }

  const responseBuffer = Buffer.concat(responseChunks)

  return {
    ...parseRawHttpResponse(responseBuffer),
    socketError,
  }
}

async function sendDrippingRawSocket({
  port,
  initialWrite,
  dripWrite,
  dripIntervalMs = 40,
}) {
  const socket = net.createConnection({ host: LOOPBACK_HOST, port })
  const responseChunks = []
  let closeTimeout
  let dripInterval
  let socketError = null
  let dripWriteCount = 0

  socket.on('data', (chunk) => responseChunks.push(chunk))
  socket.on('error', (error) => {
    socketError = error
  })

  try {
    await Promise.race([
      once(socket, 'connect'),
      new Promise((_, reject) => {
        socket.once('error', reject)
      }),
    ])
    socket.setNoDelay(true)

    const connectedAt = performance.now()

    socket.write(initialWrite)
    dripInterval = setInterval(() => {
      if (socket.destroyed || !socket.writable) {
        return
      }

      dripWriteCount += 1
      socket.write(dripWrite)
    }, dripIntervalMs)

    await Promise.race([
      new Promise((resolveClose) => socket.once('close', resolveClose)),
      new Promise((_, reject) => {
        closeTimeout = setTimeout(() => {
          reject(new Error('fixture-drip-close-timeout'))
        }, TEST_TIMEOUT_MS)
      }),
    ])

    return {
      ...parseRawHttpResponse(Buffer.concat(responseChunks)),
      dripWriteCount,
      elapsedMs: performance.now() - connectedAt,
      socketError,
    }
  } finally {
    clearInterval(dripInterval)
    clearTimeout(closeTimeout)
    socket.destroy()
  }
}

async function sendHalfOpenRawSocket({
  port,
  initialWrite,
  dripWrite = null,
  dripIntervalMs = 20,
  endAfterWrite = false,
}) {
  const socket = net.createConnection({
    allowHalfOpen: true,
    host: LOOPBACK_HOST,
    port,
  })
  const responseChunks = []
  let closeTimeout
  let dripInterval
  let socketError = null
  let sawResponse = false
  let serverEnded = false
  let postResponseDripAttempts = 0

  function attemptPostResponseDrip() {
    if (socket.destroyed || !socket.writable || dripWrite === null) {
      return
    }

    postResponseDripAttempts += 1

    try {
      socket.write(dripWrite)
    } catch (error) {
      socketError ??= error
    }
  }

  function startPostResponseDrip() {
    if (dripWrite === null || dripInterval !== undefined) {
      return
    }

    attemptPostResponseDrip()
    dripInterval = setInterval(attemptPostResponseDrip, dripIntervalMs)
  }

  socket.on('data', (chunk) => {
    responseChunks.push(chunk)
    sawResponse = true
    startPostResponseDrip()
  })
  socket.on('end', () => {
    serverEnded = true
    startPostResponseDrip()
  })
  socket.on('error', (error) => {
    socketError = error
  })

  try {
    await Promise.race([
      once(socket, 'connect'),
      new Promise((_, reject) => {
        socket.once('error', reject)
      }),
    ])
    socket.setNoDelay(true)

    const connectedAt = performance.now()
    const closePromise = new Promise((resolveClose) => {
      socket.once('close', resolveClose)
    })

    if (endAfterWrite) {
      socket.end(initialWrite)
    } else {
      socket.write(initialWrite)
    }

    await Promise.race([
      closePromise,
      new Promise((_, reject) => {
        closeTimeout = setTimeout(() => {
          reject(new Error('fixture-half-open-close-timeout'))
        }, TEST_TIMEOUT_MS)
      }),
    ])

    return {
      ...parseRawHttpResponse(Buffer.concat(responseChunks)),
      elapsedMs: performance.now() - connectedAt,
      postResponseDripAttempts,
      sawResponse,
      serverEnded,
      socketError,
    }
  } finally {
    clearInterval(dripInterval)
    clearTimeout(closeTimeout)
    socket.destroy()
  }
}

function parseRawHttpResponse(responseBuffer) {
  const statusLineCount = (
    responseBuffer.toString('latin1').match(/HTTP\/1\.1 [0-9]{3}(?: |\r\n)/g)
      ?? []
  ).length
  const separator = responseBuffer.indexOf('\r\n\r\n')

  if (separator === -1) {
    return {
      body: Buffer.alloc(0),
      headers: new Map(),
      rawResponse: responseBuffer,
      statusCode: null,
      statusLineCount,
    }
  }

  const headerLines = responseBuffer
    .subarray(0, separator)
    .toString('latin1')
    .split('\r\n')
  const statusMatch = /^HTTP\/1\.1 ([0-9]{3})(?: |$)/.exec(headerLines[0])
  const headers = new Map()

  for (const headerLine of headerLines.slice(1)) {
    const colonIndex = headerLine.indexOf(':')

    if (colonIndex === -1) {
      continue
    }

    const name = headerLine.slice(0, colonIndex).toLowerCase()
    const value = headerLine.slice(colonIndex + 1).trim()
    const values = headers.get(name) ?? []

    values.push(value)
    headers.set(name, values)
  }

  return {
    body: responseBuffer.subarray(separator + 4),
    headers,
    rawResponse: responseBuffer,
    statusCode: statusMatch ? Number(statusMatch[1]) : null,
    statusLineCount,
  }
}

function hasCompleteRawHttpResponse(response) {
  const contentLength = response.headers.get('content-length')?.[0]

  if (response.statusCode !== null && response.serverEnded === true) {
    return true
  }

  return (
    response.statusCode !== null &&
    typeof contentLength === 'string' &&
    /^[0-9]+$/.test(contentLength) &&
    response.body.byteLength === Number(contentLength)
  )
}

async function captureConsoleCalls(run) {
  const consoleMethods = ['log', 'info', 'warn', 'error', 'debug', 'trace']
  const consoleDescriptors = new Map(
    consoleMethods.map((methodName) => [
      methodName,
      Object.getOwnPropertyDescriptor(console, methodName),
    ])
  )
  const consoleCalls = []

  try {
    for (const methodName of consoleMethods) {
      Object.defineProperty(console, methodName, {
        ...consoleDescriptors.get(methodName),
        value(...args) {
          consoleCalls.push({ args, methodName })
        },
      })
    }

    await run()
  } finally {
    for (const methodName of consoleMethods) {
      Object.defineProperty(
        console,
        methodName,
        consoleDescriptors.get(methodName)
      )
    }
  }

  return consoleCalls
}

async function withNodeRequestLimitDisabled(run) {
  const listenDescriptor = Object.getOwnPropertyDescriptor(
    net.Server.prototype,
    'listen'
  )
  const emitDescriptor = Object.getOwnPropertyDescriptor(
    net.Server.prototype,
    'emit'
  )
  const originalEmit = net.Server.prototype.emit
  const observedRequestEvents = []
  let applicationRequestEventCount = 0
  let capturedServer = null
  let secondApplicationRequestObservation = null
  let secondRawHeadersAccessCount = 0

  try {
    Object.defineProperty(net.Server.prototype, 'listen', {
      ...listenDescriptor,
      value(...args) {
        capturedServer = this
        this.maxRequestsPerSocket = 0
        return Reflect.apply(listenDescriptor.value, this, args)
      },
    })
    Object.defineProperty(net.Server.prototype, 'emit', {
      configurable: true,
      enumerable: false,
      writable: true,
      value(eventName, ...args) {
        const isObservedRequestEvent =
          this === capturedServer &&
          [
            'request',
            'checkContinue',
            'checkExpectation',
            'dropRequest',
          ].includes(eventName)

        if (isObservedRequestEvent) {
          observedRequestEvents.push(eventName)
        }

        if (
          isObservedRequestEvent &&
          eventName !== 'dropRequest'
        ) {
          applicationRequestEventCount += 1
        }

        if (
          isObservedRequestEvent &&
          applicationRequestEventCount === 2 &&
          eventName !== 'dropRequest'
        ) {
          const request = args[0]
          const response = args[1]
          const requestSocket = request?.socket
          const rawHeadersDescriptor = Object.getOwnPropertyDescriptor(
            request,
            'rawHeaders'
          )
          let rawHeadersInstrumented = false
          let dispatchResult

          if (
            rawHeadersDescriptor?.configurable === true &&
            Object.hasOwn(rawHeadersDescriptor, 'value')
          ) {
            const rawHeadersValue = rawHeadersDescriptor.value

            Object.defineProperty(request, 'rawHeaders', {
              configurable: true,
              enumerable: rawHeadersDescriptor.enumerable,
              get() {
                secondRawHeadersAccessCount += 1
                return rawHeadersValue
              },
            })
            rawHeadersInstrumented = true
          }

          try {
            dispatchResult = Reflect.apply(
              originalEmit,
              this,
              [eventName, ...args]
            )
          } finally {
            secondApplicationRequestObservation = {
              eventName,
              rawHeadersInstrumented,
              responseDestroyed: response?.destroyed === true,
              socketDestroyed: requestSocket?.destroyed === true,
            }

            if (rawHeadersInstrumented) {
              Object.defineProperty(
                request,
                'rawHeaders',
                rawHeadersDescriptor
              )
            }
          }

          return dispatchResult
        }

        return Reflect.apply(originalEmit, this, [eventName, ...args])
      },
    })

    return await run({
      getCapturedServer: () => capturedServer,
      getSecondApplicationRequestObservation: () => (
        secondApplicationRequestObservation
      ),
      getSecondRawHeadersAccessCount: () => secondRawHeadersAccessCount,
      observedRequestEvents,
    })
  } finally {
    Object.defineProperty(
      net.Server.prototype,
      'listen',
      listenDescriptor
    )
    if (emitDescriptor === undefined) {
      delete net.Server.prototype.emit
    } else {
      Object.defineProperty(net.Server.prototype, 'emit', emitDescriptor)
    }
  }
}

function createChunkedWriteGroups(port, bodyFragments, extraHeaderLines = []) {
  const headerBlock = createRawHeaderBlock(
    `POST ${GATEWAY_PATH} HTTP/1.1`,
    [
      `Host: ${LOOPBACK_HOST}:${port}`,
      `Origin: ${ALLOWED_ORIGIN}`,
      'Content-Type: application/json',
      'Transfer-Encoding: chunked',
      'Connection: close',
      ...extraHeaderLines,
    ]
  )
  const groups = [headerBlock]

  for (const fragment of bodyFragments) {
    groups.push(Buffer.from(`${fragment.byteLength.toString(16)}\r\n`, 'ascii'))
    groups.push(fragment)
    groups.push(Buffer.from('\r\n', 'ascii'))
  }

  groups.push(Buffer.from('0\r\n\r\n', 'ascii'))
  return groups
}

function parseJsonBody(response) {
  return JSON.parse(response.body.toString('utf8'))
}

function createExpectedLocalHttpResponseBody(profileName) {
  const profile = LOCAL_HTTP_PROFILES[profileName]

  return Buffer.from(JSON.stringify({
    ok: false,
    status: profile.status,
    error: {
      code: profile.code,
      message: profile.message,
    },
  }), 'utf8')
}

function assertLocalHttpResponse(response, profileName, { cors = true } = {}) {
  const profile = LOCAL_HTTP_PROFILES[profileName]
  const expectedBody = createExpectedLocalHttpResponseBody(profileName)
  const contentLengthValues = response.headers instanceof Map
    ? response.headers.get('content-length') ?? []
    : [response.headers['content-length']].filter(
      (value) => typeof value === 'string'
    )

  assert.equal(response.statusCode, profile.httpStatus)
  assert.deepEqual(
    contentLengthValues,
    [String(expectedBody.byteLength)]
  )
  assert.deepEqual(response.body, expectedBody)
  assert.deepEqual(parseJsonBody(response), {
    ok: false,
    status: profile.status,
    error: {
      code: profile.code,
      message: profile.message,
    },
  })
  assert.equal(
    response.headers instanceof Map
      ? response.headers.get('content-type')?.[0]
      : response.headers['content-type'],
    'application/json; charset=utf-8'
  )
  assert.equal(
    response.headers instanceof Map
      ? response.headers.get('cache-control')?.[0]
      : response.headers['cache-control'],
    'no-store'
  )
  assert.equal(
    response.headers instanceof Map
      ? response.headers.get('x-content-type-options')?.[0]
      : response.headers['x-content-type-options'],
    'nosniff'
  )

  const allowOrigin = response.headers instanceof Map
    ? response.headers.get('access-control-allow-origin')?.[0]
    : response.headers['access-control-allow-origin']

  assert.equal(allowOrigin, cors ? ALLOWED_ORIGIN : undefined)
  assert.equal(
    response.headers instanceof Map
      ? response.headers.has('access-control-allow-credentials')
      : Object.hasOwn(response.headers, 'access-control-allow-credentials'),
    false
  )
  assert.equal(
    response.headers instanceof Map
      ? response.headers.has('server')
      : Object.hasOwn(response.headers, 'server'),
    false
  )
  assert.equal(
    response.headers instanceof Map
      ? response.headers.get('connection')?.[0]
      : response.headers.connection,
    'close'
  )
}

function assertSingleStaticInvalidHttpResponse(response) {
  const profile = LOCAL_HTTP_PROFILES.invalidHttpRequest

  assert.equal(response.statusLineCount, 1)
  assert.equal(response.statusCode, profile.httpStatus)
  assert.deepEqual(parseJsonBody(response), {
    ok: false,
    status: profile.status,
    error: {
      code: profile.code,
      message: profile.message,
    },
  })
  assert.equal(
    response.headers.get('content-type')?.[0],
    'application/json; charset=utf-8'
  )
  assert.equal(response.headers.get('cache-control')?.[0], 'no-store')
  assert.equal(response.headers.get('x-content-type-options')?.[0], 'nosniff')
  assert.equal(response.headers.get('connection')?.[0], 'close')
  assert.equal(response.headers.has('server'), false)
}

function assertPayloadTooLargeOrControlledReset(response) {
  if (response.statusCode === null) {
    assert.ok(response.socketError)
    assert.ok(['ECONNRESET', 'EPIPE'].includes(response.socketError.code))
    return
  }

  assertLocalHttpResponse(response, 'payloadTooLarge')
}

async function withStartedGateway({
  boundaryProbe = createBoundaryProbe(),
  createTextDecoder,
  useTestTimeoutPolicy = false,
} = {}, run) {
  const gateway = createLocalSyncGatewayHttpServer({
    allowedOrigin: ALLOWED_ORIGIN,
    createTextDecoder,
    port: 0,
    syncGatewayRequestBoundary: boundaryProbe.boundary,
    useTestTimeoutPolicy,
  })
  let startResult

  try {
    startResult = await gateway.start()
    assert.equal(startResult.ok, true)
    assert.equal(startResult.status, 'started')
    assert.equal(startResult.host, LOOPBACK_HOST)
    assert.ok(Number.isSafeInteger(startResult.port))
    assert.ok(startResult.port > 0)

    return await run({
      boundaryProbe,
      gateway,
      port: startResult.port,
      startResult,
    })
  } finally {
    if (startResult?.ok === true) {
      const stopResult = await gateway.stop()

      assert.equal(stopResult.ok, true)
      assert.equal(stopResult.status, 'stopped')
    }
  }
}

test('exportiert ausschließlich die vereinbarte Server- und Runtime-API mit kanonischen Ressourcenlimits', () => {
  assert.deepEqual(Object.keys(localSyncGatewayHttpServerModule), [
    'LOCAL_SYNC_GATEWAY_HTTP_LIMITS',
    'createLocalSyncGatewayHttpServer',
  ])
  assert.deepEqual(Object.keys(localSyncGatewayRuntimeConfigModule), [
    'readLocalSyncGatewayRuntimeConfig',
  ])
  assert.deepEqual(LOCAL_SYNC_GATEWAY_HTTP_LIMITS, {
    maxHeaderSize: 8_192,
    maxHeaderFields: 32,
    headersTimeoutMs: 5_000,
    requestTimeoutMs: 10_000,
    socketTimeoutMs: 10_000,
    connectionsCheckingIntervalMs: 100,
    keepAliveTimeoutMs: 1_000,
    maxRequestsPerSocket: 1,
  })
  assertDeepFrozen(LOCAL_SYNC_GATEWAY_HTTP_LIMITS)
})

test('der Import von Server und Startmodul startet keinen Listener', { concurrency: false }, async () => {
  const originalListenDescriptor = Object.getOwnPropertyDescriptor(
    net.Server.prototype,
    'listen'
  )
  let listenCalls = 0

  try {
    Object.defineProperty(net.Server.prototype, 'listen', {
      ...originalListenDescriptor,
      value(...args) {
        listenCalls += 1
        return Reflect.apply(originalListenDescriptor.value, this, args)
      },
    })
    const cacheKey = `import-side-effect-${Date.now()}`
    const serverUrl = pathToFileURL(
      path.resolve('server/localSyncGatewayHttpServer.js')
    )
    const startUrl = pathToFileURL(
      path.resolve('server/startLocalSyncGateway.js')
    )

    await import(`${serverUrl.href}?${cacheKey}`)
    await import(`${startUrl.href}?${cacheKey}`)
  } finally {
    Object.defineProperty(
      net.Server.prototype,
      'listen',
      originalListenDescriptor
    )
  }

  assert.equal(listenCalls, 0)
})

test('akzeptiert nur explizite kanonische produktive Runtime-Konfiguration und friert sie tief ein', () => {
  const validConfigurations = [
    {
      allowedOrigin: 'http://localhost:4173',
      port: 43123,
    },
    {
      allowedOrigin: 'https://127.0.0.1:8443',
      port: 65535,
    },
    {
      allowedOrigin: 'http://[::1]:4173',
      port: 1,
    },
  ]

  for (const fixture of validConfigurations) {
    const result = readLocalSyncGatewayRuntimeConfig({
      GOLDENDAWN_SYNC_GATEWAY_ALLOWED_ORIGIN: fixture.allowedOrigin,
      GOLDENDAWN_SYNC_GATEWAY_PORT: String(fixture.port),
    })

    assertExactOwnKeys(result, ['ok', 'status', 'config', 'error'])
    assert.equal(result.ok, true)
    assert.equal(result.status, 'runtimeConfigurationAccepted')
    assert.deepEqual(result.config, fixture)
    assert.equal(result.error, null)
    assertDeepFrozen(result)
  }
})

test('weist fehlende, Port-0-, VITE-, fremde und nichtkanonische Runtime-Konfiguration statisch zurück', () => {
  const privateMarker = 'fixture-runtime-private-sentinel'
  const invalidEnvironments = [
    {},
    { GOLDENDAWN_SYNC_GATEWAY_PORT: '43123' },
    { GOLDENDAWN_SYNC_GATEWAY_ALLOWED_ORIGIN: ALLOWED_ORIGIN },
    {
      VITE_GOLDENDAWN_SYNC_GATEWAY_ALLOWED_ORIGIN: ALLOWED_ORIGIN,
      VITE_GOLDENDAWN_SYNC_GATEWAY_PORT: '43123',
    },
    ...['', ' ', '0', '-1', '+1', '01', '1.5', '65536', privateMarker]
      .map((port) => ({
        GOLDENDAWN_SYNC_GATEWAY_ALLOWED_ORIGIN: ALLOWED_ORIGIN,
        GOLDENDAWN_SYNC_GATEWAY_PORT: port,
      })),
    ...[
      '*',
      'null',
      'http://example.test:4173',
      'http://192.168.1.10:4173',
      'ftp://localhost:4173',
      'http://user:pass@localhost:4173',
      'http://localhost:4173/',
      'http://localhost:4173/path',
      'http://localhost:4173?query=1',
      'http://localhost:4173#fragment',
      `http://localhost:4173,${privateMarker}`,
    ].map((origin) => ({
      GOLDENDAWN_SYNC_GATEWAY_ALLOWED_ORIGIN: origin,
      GOLDENDAWN_SYNC_GATEWAY_PORT: '43123',
    })),
    new Proxy({}, {
      get() {
        throw new Error(privateMarker)
      },
    }),
  ]

  for (const environment of invalidEnvironments) {
    const result = readLocalSyncGatewayRuntimeConfig(environment)

    assert.deepEqual(result, {
      ok: false,
      status: 'runtimeConfigurationRejected',
      config: null,
      error: {
        code: 'invalidLocalSyncGatewayRuntimeConfiguration',
        message:
          'Die lokale SyncGateway-Runtime-Konfiguration ist ungültig.',
      },
    })
    assert.equal(JSON.stringify(result).includes(privateMarker), false)
    assertDeepFrozen(result)
  }
})

test('startet den Produktionseinstieg bei fehlender oder ungültiger Runtime-Konfiguration ohne Listen-Versuch nicht', async () => {
  const privateMarker = 'fixture-runtime-process-private-sentinel'
  const listenMarker = 'UNEXPECTED_LOCAL_SYNC_GATEWAY_LISTEN_CALL'
  const entryPath = path.resolve('server/startLocalSyncGateway.js')
  const listenProbeSource = [
    "import net from 'node:net'",
    'const originalListen = net.Server.prototype.listen',
    'net.Server.prototype.listen = function (...args) {',
    `  process.stderr.write('${listenMarker}\\n')`,
    '  return Reflect.apply(originalListen, this, args)',
    '}',
  ].join('\n')
  const listenProbeUrl = `data:text/javascript,${encodeURIComponent(
    listenProbeSource
  )}`
  const configurations = [
    {},
    {
      GOLDENDAWN_SYNC_GATEWAY_ALLOWED_ORIGIN: ALLOWED_ORIGIN,
      GOLDENDAWN_SYNC_GATEWAY_PORT: '0',
    },
    {
      GOLDENDAWN_SYNC_GATEWAY_ALLOWED_ORIGIN:
        `http://localhost:4173/${privateMarker}`,
      GOLDENDAWN_SYNC_GATEWAY_PORT: '43123',
    },
  ]

  for (const configuration of configurations) {
    const environment = { ...process.env }

    for (const environmentName of Object.keys(environment)) {
      const normalizedName = environmentName.toUpperCase()

      if (
        normalizedName === 'GOLDENDAWN_SYNC_GATEWAY_PORT' ||
        normalizedName === 'GOLDENDAWN_SYNC_GATEWAY_ALLOWED_ORIGIN'
      ) {
        delete environment[environmentName]
      }
    }

    Object.assign(environment, configuration)

    const child = spawn(
      process.execPath,
      ['--import', listenProbeUrl, entryPath],
      {
        cwd: path.resolve('.'),
        env: environment,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      }
    )
    const stdoutChunks = []
    const stderrChunks = []

    child.stdout.on('data', (chunk) => stdoutChunks.push(chunk))
    child.stderr.on('data', (chunk) => stderrChunks.push(chunk))

    const timeout = setTimeout(() => child.kill(), TEST_TIMEOUT_MS)
    let exitCode
    let signal

    try {
      ;[exitCode, signal] = await once(child, 'close')
    } finally {
      clearTimeout(timeout)
      if (child.exitCode === null && child.signalCode === null) {
        child.kill()
      }
    }

    const stdout = Buffer.concat(stdoutChunks).toString('utf8')
    const stderr = Buffer.concat(stderrChunks).toString('utf8')

    assert.equal(exitCode, 1)
    assert.equal(signal, null)
    assert.equal(stdout, '')
    assert.equal(
      stderr,
      'Das lokale SyncGateway wurde wegen ungültiger Runtime-Konfiguration nicht gestartet.\n'
    )
    assert.equal(stderr.includes(listenMarker), false)
    assert.equal(stderr.includes(privateMarker), false)
  }
})

test('beendet den Produktionseinstieg nach einem post-start Serverfehler genau einmal statisch und ohne weitere Verarbeitung', { concurrency: false }, async () => {
  const privateMarker = 'fixture-runtime-fatal-private-sentinel'
  const processingMarker = 'UNEXPECTED_POST_FATAL_BODY_PROCESSING'
  const entryPath = path.resolve('server/startLocalSyncGateway.js')
  const rawBody = JSON.stringify({
    ...createSyncRequest(),
    privateMarker,
  })
  const preloadSource = [
    "import net from 'node:net'",
    `const privateMarker = ${JSON.stringify(privateMarker)}`,
    `const processingMarker = ${JSON.stringify(processingMarker)}`,
    `const rawBody = ${JSON.stringify(rawBody)}`,
    'const originalJsonParse = JSON.parse',
    'const originalListen = net.Server.prototype.listen',
    'const originalClose = net.Server.prototype.close',
    'const originalAddress = net.Server.prototype.address',
    'const reportedPort = 1',
    'let gatewayServer = null',
    'let closeCalls = 0',
    'JSON.parse = function (value, ...args) {',
    "  if (typeof value === 'string' && value.includes(privateMarker)) {",
    "    process.stderr.write(`${processingMarker}\\n`)",
    '  }',
    '  return Reflect.apply(originalJsonParse, this, [value, ...args])',
    '}',
    'net.Server.prototype.close = function (...args) {',
    '  if (this === gatewayServer) {',
    '    closeCalls += 1',
    '    if (closeCalls === 1) {',
    '      throw new Error(privateMarker)',
    '    }',
    '  }',
    '  return Reflect.apply(originalClose, this, args)',
    '}',
    'net.Server.prototype.address = function (...args) {',
    '  const address = Reflect.apply(originalAddress, this, args)',
    '  if (this !== gatewayServer || typeof address !== \'object\' || address === null) {',
    '    return address',
    '  }',
    '  return { ...address, port: reportedPort }',
    '}',
    'net.Server.prototype.listen = function (options, ...args) {',
    '  gatewayServer = this',
    '  const listenOptions = { ...options, port: 0 }',
    '  const result = Reflect.apply(originalListen, this, [listenOptions, ...args])',
    "  this.once('listening', () => {",
    '    const address = Reflect.apply(originalAddress, this, [])',
    '    const request = [',
    "      'POST /api/sync-test HTTP/1.1',",
    "      `Host: 127.0.0.1:${reportedPort}`,",
    `      ${JSON.stringify(`Origin: ${ALLOWED_ORIGIN}`)},`,
    "      'Content-Type: application/json',",
    "      `Content-Length: ${Buffer.byteLength(rawBody, 'utf8')}`,",
    "      'Connection: close',",
    "      '',",
    "      rawBody,",
    "    ].join('\\r\\n')",
    '    const client = net.createConnection({',
    "      host: '127.0.0.1',",
    '      port: address.port,',
    '    })',
    "    client.on('error', () => {})",
    '    const clientGuard = setTimeout(() => client.destroy(), 1_000)',
    '    clientGuard.unref()',
    "    client.once('connect', () => {",
    '      this.emit(\'error\', new Error(privateMarker))',
    '      this.emit(\'error\', new Error(privateMarker))',
    '      try {',
    '        client.write(request)',
    '      } catch {',
    '        client.destroy()',
    '      }',
    '    })',
    '  })',
    '  return result',
    '}',
  ].join('\n')
  const preloadUrl = `data:text/javascript,${encodeURIComponent(
    preloadSource
  )}`
  const environment = { ...process.env }

  for (const environmentName of Object.keys(environment)) {
    const normalizedName = environmentName.toUpperCase()

    if (
      normalizedName === 'GOLDENDAWN_SYNC_GATEWAY_PORT' ||
      normalizedName === 'GOLDENDAWN_SYNC_GATEWAY_ALLOWED_ORIGIN'
    ) {
      delete environment[environmentName]
    }
  }

  Object.assign(environment, {
    GOLDENDAWN_SYNC_GATEWAY_ALLOWED_ORIGIN: ALLOWED_ORIGIN,
    GOLDENDAWN_SYNC_GATEWAY_PORT: '1',
  })

  const child = spawn(
    process.execPath,
    ['--import', preloadUrl, entryPath],
    {
      cwd: path.resolve('.'),
      env: environment,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    }
  )
  const stdoutChunks = []
  const stderrChunks = []

  child.stdout.on('data', (chunk) => stdoutChunks.push(chunk))
  child.stderr.on('data', (chunk) => stderrChunks.push(chunk))

  const timeout = setTimeout(() => child.kill(), TEST_TIMEOUT_MS)
  let exitCode
  let signal

  try {
    ;[exitCode, signal] = await once(child, 'close')
  } finally {
    clearTimeout(timeout)

    if (child.exitCode === null && child.signalCode === null) {
      child.kill()
    }
  }

  const stdout = Buffer.concat(stdoutChunks).toString('utf8')
  const stderr = Buffer.concat(stderrChunks).toString('utf8')

  assert.equal(exitCode, 1)
  assert.equal(signal, null)
  assert.equal(
    stdout,
    'Das lokale SyncGateway lauscht ausschließlich auf 127.0.0.1.\n'
  )
  assert.equal(
    stderr,
    'Das lokale SyncGateway wurde nach einem internen Serverfehler beendet.\n'
  )
  assert.equal(stdout.includes(privateMarker), false)
  assert.equal(stderr.includes(privateMarker), false)
  assert.equal(stdout.includes(processingMarker), false)
  assert.equal(stderr.includes(processingMarker), false)
})

test('liefert eine eingefrorene Zwei-Methoden-API und eindeutige Lifecycle-Resultate auf 127.0.0.1', async () => {
  const boundaryProbe = createBoundaryProbe()
  const gateway = createLocalSyncGatewayHttpServer({
    allowedOrigin: ALLOWED_ORIGIN,
    port: 0,
    syncGatewayRequestBoundary: boundaryProbe.boundary,
  })

  assertExactOwnKeys(gateway, ['start', 'stop'])
  assert.equal(Object.isFrozen(gateway), true)
  assert.equal(typeof gateway.start, 'function')
  assert.equal(typeof gateway.stop, 'function')

  const notStarted = await gateway.stop()
  assert.equal(notStarted.ok, false)
  assert.equal(notStarted.status, 'notStarted')
  assertDeepFrozen(notStarted)

  const started = await gateway.start()

  try {
    assert.deepEqual(
      Reflect.ownKeys(started),
      ['ok', 'status', 'host', 'port', 'error']
    )
    assert.equal(started.ok, true)
    assert.equal(started.status, 'started')
    assert.equal(started.host, LOOPBACK_HOST)
    assert.ok(started.port > 0)
    assert.equal(started.error, null)
    assertDeepFrozen(started)

    const duplicateStart = await gateway.start()
    assert.equal(duplicateStart.ok, false)
    assert.equal(duplicateStart.status, 'alreadyStarted')
    assert.deepEqual([duplicateStart.host, duplicateStart.port], [null, null])
    assertDeepFrozen(duplicateStart)
  } finally {
    const stopped = await gateway.stop()

    assert.equal(stopped.ok, true)
    assert.equal(stopped.status, 'stopped')
    assert.deepEqual([stopped.host, stopped.port, stopped.error], [null, null, null])
    assertDeepFrozen(stopped)
  }

  const duplicateStop = await gateway.stop()
  const restart = await gateway.start()

  assert.equal(duplicateStop.ok, false)
  assert.equal(duplicateStop.status, 'alreadyStopped')
  assert.equal(restart.ok, false)
  assert.equal(restart.status, 'alreadyStopped')
})

test('redigiert reale Startfehler und defensive Stopfehler mit exakten Lifecycle-Resultaten', { concurrency: false }, async () => {
  const boundaryProbe = createBoundaryProbe()
  const occupiedListener = net.createServer()
  let occupiedPort = null
  let startFailureGateway

  occupiedListener.listen({
    exclusive: true,
    host: LOOPBACK_HOST,
    port: 0,
  })
  await once(occupiedListener, 'listening')

  try {
    const occupiedAddress = occupiedListener.address()

    assert.equal(typeof occupiedAddress, 'object')
    assert.ok(occupiedAddress)
    occupiedPort = occupiedAddress.port
    startFailureGateway = createLocalSyncGatewayHttpServer({
      allowedOrigin: ALLOWED_ORIGIN,
      port: occupiedPort,
      syncGatewayRequestBoundary: boundaryProbe.boundary,
    })

    const startFailed = await startFailureGateway.start()

    assert.deepEqual(startFailed, {
      ok: false,
      status: 'startFailed',
      host: null,
      port: null,
      error: {
        code: 'localSyncGatewayStartFailed',
        message: 'Das lokale SyncGateway konnte nicht gestartet werden.',
      },
    })
    assertDeepFrozen(startFailed)
  } finally {
    await new Promise((resolveClose) => occupiedListener.close(resolveClose))

    if (startFailureGateway) {
      const cleanupResult = await startFailureGateway.stop()

      assert.equal(cleanupResult.ok, true)
      assert.equal(cleanupResult.status, 'stopped')
    }
  }

  const reboundListener = net.createServer()

  try {
    reboundListener.listen({
      exclusive: true,
      host: LOOPBACK_HOST,
      port: occupiedPort,
    })
    await once(reboundListener, 'listening')
    assert.equal(reboundListener.address()?.port, occupiedPort)
  } finally {
    if (reboundListener.listening) {
      await new Promise((resolveClose) => reboundListener.close(resolveClose))
    }
  }

  const stopFailureGateway = createLocalSyncGatewayHttpServer({
    allowedOrigin: ALLOWED_ORIGIN,
    port: 0,
    syncGatewayRequestBoundary: boundaryProbe.boundary,
  })
  const started = await stopFailureGateway.start()
  const closeDescriptor = Object.getOwnPropertyDescriptor(
    net.Server.prototype,
    'close'
  )
  const privateMarker = 'fixture-stop-private-sentinel'

  assert.equal(started.ok, true)

  try {
    Object.defineProperty(net.Server.prototype, 'close', {
      ...closeDescriptor,
      value(callback) {
        queueMicrotask(() => callback(new Error(privateMarker)))
        return this
      },
    })

    const stopFailed = await stopFailureGateway.stop()

    assert.deepEqual(stopFailed, {
      ok: false,
      status: 'stopFailed',
      host: null,
      port: null,
      error: {
        code: 'localSyncGatewayStopFailed',
        message:
          'Das lokale SyncGateway konnte nicht kontrolliert gestoppt werden.',
      },
    })
    assert.equal(JSON.stringify(stopFailed).includes(privateMarker), false)
    assertDeepFrozen(stopFailed)
  } finally {
    Object.defineProperty(
      net.Server.prototype,
      'close',
      closeDescriptor
    )

    const cleanupResult = await stopFailureGateway.stop()

    assert.equal(cleanupResult.ok, true)
    assert.equal(cleanupResult.status, 'stopped')
  }

  assert.equal(boundaryProbe.calls.length, 0)
})

test('vereinheitlicht auch einen defensiven Startsonderfall mit werfender Adressauflösung und Close im fail-closed Cleanup', { concurrency: false }, async () => {
  const listenDescriptor = Object.getOwnPropertyDescriptor(
    net.Server.prototype,
    'listen'
  )
  const addressDescriptor = Object.getOwnPropertyDescriptor(
    net.Server.prototype,
    'address'
  )
  const closeDescriptor = Object.getOwnPropertyDescriptor(
    net.Server.prototype,
    'close'
  )
  const addressMarker = 'fixture-start-address-private-sentinel'
  const closeMarker = 'fixture-start-close-private-sentinel'
  const boundaryProbe = createBoundaryProbe()
  let boundPort = null
  let capturedServer = null
  let cleanupResult = null
  let closeCalls = 0
  let fatalCalls = 0
  let gateway = null

  try {
    Object.defineProperty(net.Server.prototype, 'listen', {
      ...listenDescriptor,
      value(...args) {
        capturedServer = this
        return Reflect.apply(listenDescriptor.value, this, args)
      },
    })
    Object.defineProperty(net.Server.prototype, 'address', {
      ...addressDescriptor,
      value(...args) {
        const address = Reflect.apply(addressDescriptor.value, this, args)

        if (this === capturedServer) {
          boundPort = address?.port ?? null
          throw new Error(addressMarker)
        }

        return address
      },
    })
    Object.defineProperty(net.Server.prototype, 'close', {
      ...closeDescriptor,
      value(...args) {
        if (this === capturedServer) {
          closeCalls += 1

          if (closeCalls === 1) {
            throw new Error(closeMarker)
          }
        }

        return Reflect.apply(closeDescriptor.value, this, args)
      },
    })

    gateway = createLocalSyncGatewayHttpServer({
      allowedOrigin: ALLOWED_ORIGIN,
      onFatal() {
        fatalCalls += 1
      },
      port: 0,
      syncGatewayRequestBoundary: boundaryProbe.boundary,
    })
    const startFailed = await gateway.start()

    assert.deepEqual(startFailed, {
      ok: false,
      status: 'startFailed',
      host: null,
      port: null,
      error: {
        code: 'localSyncGatewayStartFailed',
        message: 'Das lokale SyncGateway konnte nicht gestartet werden.',
      },
    })
    assert.equal(JSON.stringify(startFailed).includes(addressMarker), false)
    assert.equal(JSON.stringify(startFailed).includes(closeMarker), false)
    assert.ok(Number.isSafeInteger(boundPort))
    assert.ok(boundPort > 0)
    assert.equal(closeCalls, 2)
    assert.equal(fatalCalls, 0)
    assert.equal(boundaryProbe.calls.length, 0)
    assert.equal(capturedServer.listening, false)
  } finally {
    Object.defineProperty(
      net.Server.prototype,
      'listen',
      listenDescriptor
    )
    Object.defineProperty(
      net.Server.prototype,
      'address',
      addressDescriptor
    )
    Object.defineProperty(
      net.Server.prototype,
      'close',
      closeDescriptor
    )

    if (gateway) {
      cleanupResult = await gateway.stop()
    }
  }

  assert.equal(cleanupResult?.ok, true)
  assert.equal(cleanupResult?.status, 'stopped')
  assert.equal(capturedServer.listening, false)

  const reboundListener = net.createServer()

  try {
    reboundListener.listen({
      exclusive: true,
      host: LOOPBACK_HOST,
      port: boundPort,
    })
    await once(reboundListener, 'listening')
    assert.equal(reboundListener.address()?.port, boundPort)
  } finally {
    if (reboundListener.listening) {
      await new Promise((resolveClose) => reboundListener.close(resolveClose))
    }
  }
})

for (const hostileAddressProperty of ['address', 'port']) {
  test(`behandelt einen werfenden ${hostileAddressProperty}-Getter des Listening-Adressresultats als redigierten Startfehler`, { concurrency: false }, async () => {
    const listenDescriptor = Object.getOwnPropertyDescriptor(
      net.Server.prototype,
      'listen'
    )
    const addressDescriptor = Object.getOwnPropertyDescriptor(
      net.Server.prototype,
      'address'
    )
    const privateMarker =
      `fixture-start-${hostileAddressProperty}-getter-private-sentinel`
    const boundaryProbe = createBoundaryProbe()
    let addressCalls = 0
    let boundPort = null
    let capturedServer = null
    let cleanupResult = null
    let fatalCalls = 0
    let gateway = null
    let hostileGetterCalls = 0
    let startResult = null

    try {
      Object.defineProperty(net.Server.prototype, 'listen', {
        ...listenDescriptor,
        value(...args) {
          capturedServer = this
          return Reflect.apply(listenDescriptor.value, this, args)
        },
      })
      Object.defineProperty(net.Server.prototype, 'address', {
        ...addressDescriptor,
        value(...args) {
          const address = Reflect.apply(addressDescriptor.value, this, args)

          if (this !== capturedServer) {
            return address
          }

          addressCalls += 1
          assert.equal(typeof address, 'object')
          assert.ok(address)
          boundPort = address.port

          const hostileAddress = {}
          const stableAddressDescriptor = {
            configurable: true,
            enumerable: true,
            value: address.address,
            writable: false,
          }
          const stablePortDescriptor = {
            configurable: true,
            enumerable: true,
            value: address.port,
            writable: false,
          }
          const throwingDescriptor = {
            configurable: true,
            enumerable: true,
            get() {
              hostileGetterCalls += 1
              throw new Error(privateMarker)
            },
          }

          Object.defineProperties(hostileAddress, {
            address: hostileAddressProperty === 'address'
              ? throwingDescriptor
              : stableAddressDescriptor,
            port: hostileAddressProperty === 'port'
              ? throwingDescriptor
              : stablePortDescriptor,
          })

          return hostileAddress
        },
      })

      const consoleCalls = await captureConsoleCalls(async () => {
        gateway = createLocalSyncGatewayHttpServer({
          allowedOrigin: ALLOWED_ORIGIN,
          onFatal() {
            fatalCalls += 1
          },
          port: 0,
          syncGatewayRequestBoundary: boundaryProbe.boundary,
        })
        let startTimeout

        try {
          startResult = await Promise.race([
            gateway.start(),
            new Promise((_, reject) => {
              startTimeout = setTimeout(() => {
                reject(new Error('fixture-start-getter-timeout'))
              }, TEST_TIMEOUT_MS)
            }),
          ])
        } finally {
          clearTimeout(startTimeout)
        }
      })

      assert.deepEqual(startResult, {
        ok: false,
        status: 'startFailed',
        host: null,
        port: null,
        error: {
          code: 'localSyncGatewayStartFailed',
          message: 'Das lokale SyncGateway konnte nicht gestartet werden.',
        },
      })
      assertDeepFrozen(startResult)
      assert.equal(JSON.stringify(startResult).includes(privateMarker), false)
      assert.deepEqual(consoleCalls, [])
      assert.equal(addressCalls, 1)
      assert.equal(hostileGetterCalls, 1)
      assert.ok(Number.isSafeInteger(boundPort))
      assert.ok(boundPort > 0)
      assert.equal(fatalCalls, 0)
      assert.equal(boundaryProbe.calls.length, 0)
      assert.equal(capturedServer.listening, false)
    } finally {
      Object.defineProperty(
        net.Server.prototype,
        'listen',
        listenDescriptor
      )
      Object.defineProperty(
        net.Server.prototype,
        'address',
        addressDescriptor
      )

      if (startResult !== null && gateway !== null) {
        cleanupResult = await gateway.stop()
      } else if (capturedServer?.listening) {
        await new Promise((resolveClose) => capturedServer.close(resolveClose))
      }
    }

    assert.equal(cleanupResult?.ok, true)
    assert.equal(cleanupResult?.status, 'stopped')

    const reboundListener = net.createServer()

    try {
      reboundListener.listen({
        exclusive: true,
        host: LOOPBACK_HOST,
        port: boundPort,
      })
      await once(reboundListener, 'listening')
      assert.equal(reboundListener.address()?.port, boundPort)
    } finally {
      if (reboundListener.listening) {
        await new Promise((resolveClose) => reboundListener.close(resolveClose))
      }
    }
  })
}

for (const reportedPortFixture of [
  {
    label: '0',
    reportedPort: 0,
  },
  {
    label: '-1',
    reportedPort: -1,
  },
  {
    label: '65536',
    reportedPort: 65_536,
  },
  {
    label: 'abweichenden gültigen Produktionsport',
    reportedPort: null,
  },
]) {
  test(`weist den vom Listener gemeldeten Bound-Port ${reportedPortFixture.label} redigiert und mit vollständigem Cleanup zurück`, { concurrency: false }, async () => {
    const listenDescriptor = Object.getOwnPropertyDescriptor(
      net.Server.prototype,
      'listen'
    )
    const addressDescriptor = Object.getOwnPropertyDescriptor(
      net.Server.prototype,
      'address'
    )
    const privateMarker =
      `fixture-reported-port-${reportedPortFixture.label}-private-sentinel`
    const boundaryProbe = createBoundaryProbe()
    let actualBoundPort = null
    let addressCalls = 0
    let addressPropertyCalls = 0
    let capturedServer = null
    let cleanupResult = null
    let factoryPort = 0
    let fatalCalls = 0
    let gateway = null
    let portPropertyCalls = 0
    let startResult = null

    if (reportedPortFixture.reportedPort === null) {
      const portAllocator = net.createServer()

      try {
        portAllocator.listen({
          exclusive: true,
          host: LOOPBACK_HOST,
          port: 0,
        })
        await once(portAllocator, 'listening')
        factoryPort = portAllocator.address()?.port ?? 0
        assert.ok(factoryPort > 0)
      } finally {
        if (portAllocator.listening) {
          await new Promise((resolveClose) => (
            portAllocator.close(resolveClose)
          ))
        }
      }
    }

    try {
      Object.defineProperty(net.Server.prototype, 'listen', {
        ...listenDescriptor,
        value(...args) {
          capturedServer = this
          return Reflect.apply(listenDescriptor.value, this, args)
        },
      })
      Object.defineProperty(net.Server.prototype, 'address', {
        ...addressDescriptor,
        value(...args) {
          const address = Reflect.apply(addressDescriptor.value, this, args)

          if (this !== capturedServer) {
            return address
          }

          addressCalls += 1
          assert.equal(typeof address, 'object')
          assert.ok(address)
          actualBoundPort = address.port

          const reportedPort = reportedPortFixture.reportedPort ?? (
            actualBoundPort === 65_535
              ? 65_534
              : actualBoundPort + 1
          )

          return Object.defineProperties({}, {
            address: {
              configurable: true,
              enumerable: true,
              get() {
                addressPropertyCalls += 1
                return LOOPBACK_HOST
              },
            },
            port: {
              configurable: true,
              enumerable: true,
              get() {
                portPropertyCalls += 1
                return reportedPort
              },
            },
            privateMarker: {
              configurable: true,
              enumerable: true,
              value: privateMarker,
              writable: false,
            },
          })
        },
      })

      const consoleCalls = await captureConsoleCalls(async () => {
        gateway = createLocalSyncGatewayHttpServer({
          allowedOrigin: ALLOWED_ORIGIN,
          onFatal() {
            fatalCalls += 1
          },
          port: factoryPort,
          syncGatewayRequestBoundary: boundaryProbe.boundary,
        })
        let startTimeout

        try {
          startResult = await Promise.race([
            gateway.start(),
            new Promise((_, reject) => {
              startTimeout = setTimeout(() => {
                reject(new Error('fixture-reported-port-start-timeout'))
              }, TEST_TIMEOUT_MS)
            }),
          ])
        } finally {
          clearTimeout(startTimeout)
        }
      })

      assert.deepEqual(startResult, {
        ok: false,
        status: 'startFailed',
        host: null,
        port: null,
        error: {
          code: 'localSyncGatewayStartFailed',
          message: 'Das lokale SyncGateway konnte nicht gestartet werden.',
        },
      })
      assertDeepFrozen(startResult)
      assert.equal(JSON.stringify(startResult).includes(privateMarker), false)
      assert.deepEqual(consoleCalls, [])
      assert.equal(addressCalls, 1)
      assert.equal(addressPropertyCalls, 1)
      assert.equal(portPropertyCalls, 1)
      assert.ok(Number.isSafeInteger(actualBoundPort))
      assert.ok(actualBoundPort > 0)
      assert.equal(fatalCalls, 0)
      assert.equal(boundaryProbe.calls.length, 0)
      assert.equal(capturedServer.listening, false)
    } finally {
      Object.defineProperty(
        net.Server.prototype,
        'listen',
        listenDescriptor
      )
      Object.defineProperty(
        net.Server.prototype,
        'address',
        addressDescriptor
      )

      if (startResult !== null && gateway !== null) {
        cleanupResult = await gateway.stop()
      } else if (capturedServer?.listening) {
        await new Promise((resolveClose) => capturedServer.close(resolveClose))
      }
    }

    assert.equal(cleanupResult?.ok, true)
    assert.equal(cleanupResult?.status, 'stopped')

    const reboundListener = net.createServer()

    try {
      reboundListener.listen({
        exclusive: true,
        host: LOOPBACK_HOST,
        port: actualBoundPort,
      })
      await once(reboundListener, 'listening')
      assert.equal(reboundListener.address()?.port, actualBoundPort)
    } finally {
      if (reboundListener.listening) {
        await new Promise((resolveClose) => reboundListener.close(resolveClose))
      }
    }
  })
}

test('schließt nach einem Serverfehler trotz werfendem Listener-Close fail closed und verarbeitet keine weitere Anfrage', { concurrency: false }, async () => {
  const listenDescriptor = Object.getOwnPropertyDescriptor(
    net.Server.prototype,
    'listen'
  )
  const closeDescriptor = Object.getOwnPropertyDescriptor(
    net.Server.prototype,
    'close'
  )
  const boundaryProbe = createBoundaryProbe()
  const decoderProbe = createDecoderProbe()
  const serverErrorMarker = 'fixture-server-error-private-sentinel'
  const closeErrorMarker = 'fixture-server-close-private-sentinel'
  const fatalCallbackMarker = 'fixture-fatal-callback-private-sentinel'
  const fatalCalls = []
  const unhandledRejections = []
  let capturedServer = null
  let closeCalls = 0
  let gateway = null
  let heldSocket = null
  let started = null

  function handleUnhandledRejection(reason) {
    unhandledRejections.push(reason)
  }

  try {
    process.on('unhandledRejection', handleUnhandledRejection)
    Object.defineProperty(net.Server.prototype, 'listen', {
      ...listenDescriptor,
      value(...args) {
        capturedServer = this
        return Reflect.apply(listenDescriptor.value, this, args)
      },
    })

    gateway = createLocalSyncGatewayHttpServer({
      allowedOrigin: ALLOWED_ORIGIN,
      createTextDecoder: decoderProbe.createTextDecoder,
      async onFatal(...args) {
        fatalCalls.push({ args, receiver: this })
        throw new Error(fatalCallbackMarker)
      },
      port: 0,
      syncGatewayRequestBoundary: boundaryProbe.boundary,
    })
    started = await gateway.start()

    assert.equal(started.ok, true)
    assert.ok(capturedServer instanceof net.Server)

    heldSocket = net.createConnection({
      host: LOOPBACK_HOST,
      port: started.port,
    })
    heldSocket.on('error', () => {})
    await once(heldSocket, 'connect')
    heldSocket.write(createRawHeaderBlock(
      `POST ${GATEWAY_PATH} HTTP/1.1`,
      [
        `Host: ${LOOPBACK_HOST}:${started.port}`,
        `Origin: ${ALLOWED_ORIGIN}`,
        'Content-Type: application/json',
        'Content-Length: 100',
        'Connection: close',
      ]
    ))
    heldSocket.write(Buffer.from('{', 'utf8'))
    await new Promise((resolveTurn) => setImmediate(resolveTurn))

    Object.defineProperty(net.Server.prototype, 'close', {
      ...closeDescriptor,
      value(...args) {
        if (this === capturedServer) {
          closeCalls += 1
          throw new Error(closeErrorMarker)
        }

        return Reflect.apply(closeDescriptor.value, this, args)
      },
    })

    const heldSocketClosed = new Promise((resolveClose) => {
      heldSocket.once('close', resolveClose)
    })

    assert.equal(
      capturedServer.emit('error', new Error(serverErrorMarker)),
      true
    )
    assert.equal(
      capturedServer.emit('error', new Error(serverErrorMarker)),
      true
    )
    await heldSocketClosed
    await new Promise((resolveTurn) => setImmediate(resolveTurn))
    await new Promise((resolveTurn) => setImmediate(resolveTurn))

    assert.equal(closeCalls, 1)
    assert.equal(fatalCalls.length, 1)
    assert.deepEqual(fatalCalls[0].args, [])
    assert.equal(fatalCalls[0].receiver, undefined)
    assert.deepEqual(unhandledRejections, [])
    assert.equal(capturedServer.listening, true)

    const rejectedAfterFailure = await sendRawSocketWrites(started.port, [
      Buffer.concat([
        createRawHeaderBlock(`POST ${GATEWAY_PATH} HTTP/1.1`, [
          `Host: ${LOOPBACK_HOST}:${started.port}`,
          `Origin: ${ALLOWED_ORIGIN}`,
          'Content-Type: application/json',
          'Content-Length: 2',
          'Connection: close',
        ]),
        Buffer.from('{}', 'utf8'),
      ]),
    ])
    const repeatedStart = await gateway.start()

    assert.equal(rejectedAfterFailure.statusLineCount, 0)
    assert.equal(
      rejectedAfterFailure.rawResponse.toString('utf8').includes(serverErrorMarker),
      false
    )
    assert.equal(
      rejectedAfterFailure.rawResponse.toString('utf8').includes(closeErrorMarker),
      false
    )
    assert.deepEqual(repeatedStart, {
      ok: false,
      status: 'startFailed',
      host: null,
      port: null,
      error: {
        code: 'localSyncGatewayStartFailed',
        message: 'Das lokale SyncGateway konnte nicht gestartet werden.',
      },
    })
    assert.equal(JSON.stringify(repeatedStart).includes(serverErrorMarker), false)
    assert.equal(JSON.stringify(repeatedStart).includes(closeErrorMarker), false)
    assert.equal(JSON.stringify(repeatedStart).includes(fatalCallbackMarker), false)
    assertDeepFrozen(repeatedStart)
    assert.equal(boundaryProbe.calls.length, 0)
    assert.equal(decoderProbe.calls.create.length, 0)
    assert.equal(decoderProbe.calls.decode.length, 0)
  } finally {
    process.off('unhandledRejection', handleUnhandledRejection)
    Object.defineProperty(
      net.Server.prototype,
      'listen',
      listenDescriptor
    )
    Object.defineProperty(
      net.Server.prototype,
      'close',
      closeDescriptor
    )
    heldSocket?.destroy()

    if (gateway && started?.ok === true) {
      const cleanupResult = await gateway.stop()

      assert.equal(cleanupResult.ok, true)
      assert.equal(cleanupResult.status, 'stopped')
    }
  }
})

test('weist ungültige Factory-Konfiguration vor jedem Listen-Versuch statisch und ohne Wertspiegelung zurück', { concurrency: false }, () => {
  const originalListenDescriptor = Object.getOwnPropertyDescriptor(
    net.Server.prototype,
    'listen'
  )
  const privateMarker = 'fixture-composition-private-sentinel'
  let listenCalls = 0

  try {
    Object.defineProperty(net.Server.prototype, 'listen', {
      ...originalListenDescriptor,
      value(...args) {
        listenCalls += 1
        return Reflect.apply(originalListenDescriptor.value, this, args)
      },
    })

    for (const options of [
      undefined,
      {},
      { port: -1, allowedOrigin: ALLOWED_ORIGIN },
      { port: 65_536, allowedOrigin: ALLOWED_ORIGIN },
      { port: 0, allowedOrigin: privateMarker },
      {
        port: 0,
        allowedOrigin: ALLOWED_ORIGIN,
        syncGatewayRequestBoundary: {},
      },
      {
        port: 0,
        allowedOrigin: ALLOWED_ORIGIN,
        syncGatewayRequestBoundary: createBoundaryProbe().boundary,
        createTextDecoder: null,
      },
      {
        port: 0,
        allowedOrigin: ALLOWED_ORIGIN,
        onFatal: privateMarker,
      },
      {
        port: 1,
        allowedOrigin: ALLOWED_ORIGIN,
        useTestTimeoutPolicy: true,
      },
      {
        port: 0,
        allowedOrigin: ALLOWED_ORIGIN,
        useTestTimeoutPolicy: 'true',
      },
    ]) {
      assert.throws(
        () => createLocalSyncGatewayHttpServer(options),
        (error) => (
          error instanceof TypeError &&
          error.message === 'Die lokale SyncGateway-Komposition ist ungültig.' &&
          !error.message.includes(privateMarker)
        )
      )
    }
  } finally {
    Object.defineProperty(
      net.Server.prototype,
      'listen',
      originalListenDescriptor
    )
  }

  assert.equal(listenCalls, 0)
})

test('weist abweichende Pfade, Querystrings, absolute Targets, Hosts und Methoden vor der Boundary zurück', async () => {
  const boundaryProbe = createBoundaryProbe()

  await withStartedGateway({ boundaryProbe }, async ({ port }) => {
    for (const requestPath of ['/api/other', `${GATEWAY_PATH}?fixture=1`]) {
      const response = await sendHttpRequest({
        bodyChunks: [],
        headers: buildRequestHeaders(port, 0),
        port,
        requestPath,
      })

      assertLocalHttpResponse(response, 'routeNotFound')
    }

    const absoluteTarget = await sendRawSocketWrites(port, [
      createRawHeaderBlock(
        `POST http://${LOOPBACK_HOST}:${port}${GATEWAY_PATH} HTTP/1.1`,
        [
          `Host: ${LOOPBACK_HOST}:${port}`,
          `Origin: ${ALLOWED_ORIGIN}`,
          'Content-Type: application/json',
          'Content-Length: 0',
          'Connection: close',
        ]
      ),
    ])
    assertLocalHttpResponse(absoluteTarget, 'routeNotFound')

    const missingHostResponse = await sendRawSocketWrites(port, [
      createRawHeaderBlock(`POST ${GATEWAY_PATH} HTTP/1.1`, [
        `Origin: ${ALLOWED_ORIGIN}`,
        'Content-Type: application/json',
        'Content-Length: 0',
        'Connection: close',
      ]),
    ])

    assertLocalHttpResponse(missingHostResponse, 'invalidHttpRequest')

    for (const hostHeaderLines of [
      ['Host: localhost'],
      [`Host: ${LOOPBACK_HOST}`],
      [`Host: ${LOOPBACK_HOST}:${port}`, `Host: ${LOOPBACK_HOST}:${port}`],
    ]) {
      const response = await sendRawSocketWrites(port, [
        createRawHeaderBlock(`POST ${GATEWAY_PATH} HTTP/1.1`, [
          ...hostHeaderLines,
          `Origin: ${ALLOWED_ORIGIN}`,
          'Content-Type: application/json',
          'Content-Length: 0',
          'Connection: close',
        ]),
      ])

      assertLocalHttpResponse(response, 'invalidHttpRequest')
    }

    for (const method of ['GET', 'PUT', 'DELETE', 'PATCH']) {
      const response = await sendHttpRequest({
        headers: buildRequestHeaders(port, 0),
        method,
        port,
      })

      assertLocalHttpResponse(response, 'methodNotAllowed')
      assert.equal(response.headers.allow, 'POST, OPTIONS')
    }
  })

  assert.equal(boundaryProbe.calls.length, 0)
})

test('akzeptiert für logisch gebundenen Port 80 nur die beiden kanonischen Loopback-Autoritäten ohne realen Port-80-Bind', { concurrency: false }, async () => {
  const listenDescriptor = Object.getOwnPropertyDescriptor(
    net.Server.prototype,
    'listen'
  )
  const addressDescriptor = Object.getOwnPropertyDescriptor(
    net.Server.prototype,
    'address'
  )
  const boundaryProbe = createBoundaryProbe()
  let actualPort = null
  let capturedServer = null
  let gateway = null
  let started = null

  try {
    Object.defineProperty(net.Server.prototype, 'listen', {
      ...listenDescriptor,
      value(...args) {
        capturedServer = this
        return Reflect.apply(listenDescriptor.value, this, args)
      },
    })
    Object.defineProperty(net.Server.prototype, 'address', {
      ...addressDescriptor,
      value(...args) {
        const address = Reflect.apply(addressDescriptor.value, this, args)

        if (
          this === capturedServer &&
          typeof address === 'object' &&
          address !== null &&
          Number.isSafeInteger(address.port)
        ) {
          actualPort = address.port
          return { ...address, port: 80 }
        }

        return address
      },
    })

    gateway = createLocalSyncGatewayHttpServer({
      allowedOrigin: ALLOWED_ORIGIN,
      port: 0,
      syncGatewayRequestBoundary: boundaryProbe.boundary,
    })
    started = await gateway.start()

    assert.equal(started.ok, true)
    assert.equal(started.port, 80)
    assert.ok(Number.isSafeInteger(actualPort))
    assert.ok(actualPort > 0)
    assert.notEqual(actualPort, 80)

    Object.defineProperty(
      net.Server.prototype,
      'listen',
      listenDescriptor
    )
    Object.defineProperty(
      net.Server.prototype,
      'address',
      addressDescriptor
    )

    for (const host of [LOOPBACK_HOST, `${LOOPBACK_HOST}:80`]) {
      const response = await sendHttpRequest({
        headers: buildRequestHeaders(80, 0, { Host: host }),
        port: actualPort,
      })

      assertLocalHttpResponse(response, 'upstreamUnavailable')
    }

    for (const host of [
      `${LOOPBACK_HOST}:${actualPort}`,
      `${LOOPBACK_HOST}:080`,
      'localhost',
    ]) {
      const response = await sendHttpRequest({
        headers: buildRequestHeaders(80, 0, { Host: host }),
        port: actualPort,
      })

      assertLocalHttpResponse(response, 'invalidHttpRequest')
    }

    assert.equal(boundaryProbe.calls.length, 2)
  } finally {
    Object.defineProperty(
      net.Server.prototype,
      'listen',
      listenDescriptor
    )
    Object.defineProperty(
      net.Server.prototype,
      'address',
      addressDescriptor
    )

    if (gateway && started?.ok === true) {
      const cleanupResult = await gateway.stop()

      assert.equal(cleanupResult.ok, true)
      assert.equal(cleanupResult.status, 'stopped')
    }
  }
})

test('beantwortet ausschließlich den exakten CORS-Preflight mit 204 und ohne Syncfluss', async () => {
  const boundaryProbe = createBoundaryProbe()

  await withStartedGateway({ boundaryProbe }, async ({ port }) => {
    const response = await sendHttpRequest({
      headers: {
        Host: `${LOOPBACK_HOST}:${port}`,
        Origin: ALLOWED_ORIGIN,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
        'Content-Length': '0',
        Connection: 'close',
      },
      method: 'OPTIONS',
      port,
    })

    assert.equal(response.statusCode, 204)
    assert.equal(response.body.byteLength, 0)
    assert.equal(response.headers['access-control-allow-origin'], ALLOWED_ORIGIN)
    assert.equal(response.headers['access-control-allow-methods'], 'POST')
    assert.equal(response.headers['access-control-allow-headers'], 'Content-Type')
    assert.equal(response.headers['access-control-allow-credentials'], undefined)
    assert.equal(response.headers['cache-control'], 'no-store')
    assert.equal(response.headers['x-content-type-options'], 'nosniff')
  })

  assert.equal(boundaryProbe.calls.length, 0)
})

test('weist unvollständige, falsche, zusätzliche und doppelte Preflight-Felder ohne Boundary zurück', async () => {
  const boundaryProbe = createBoundaryProbe()

  await withStartedGateway({ boundaryProbe }, async ({ port }) => {
    const regularCases = [
      {},
      { 'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'Content-Type' },
      { 'Access-Control-Request-Method': 'POST' },
      { 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'Content-Type, X-Fixture' },
      { 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'Accept' },
    ]

    for (const requestHeaders of regularCases) {
      const response = await sendHttpRequest({
        headers: {
          Host: `${LOOPBACK_HOST}:${port}`,
          Origin: ALLOWED_ORIGIN,
          'Content-Length': '0',
          Connection: 'close',
          ...requestHeaders,
        },
        method: 'OPTIONS',
        port,
      })

      assertLocalHttpResponse(response, 'invalidHttpRequest')
    }

    for (const duplicatedLines of [
      [
        'Access-Control-Request-Method: POST',
        'Access-Control-Request-Method: POST',
        'Access-Control-Request-Headers: Content-Type',
      ],
      [
        'Access-Control-Request-Method: POST',
        'Access-Control-Request-Headers: Content-Type',
        'Access-Control-Request-Headers: Content-Type',
      ],
    ]) {
      const response = await sendRawSocketWrites(port, [
        createRawHeaderBlock(`OPTIONS ${GATEWAY_PATH} HTTP/1.1`, [
          `Host: ${LOOPBACK_HOST}:${port}`,
          `Origin: ${ALLOWED_ORIGIN}`,
          ...duplicatedLines,
          'Content-Length: 0',
          'Connection: close',
        ]),
      ])

      assertLocalHttpResponse(response, 'invalidHttpRequest')
    }
  })

  assert.equal(boundaryProbe.calls.length, 0)
})

test('verlangt genau eine exakt erlaubte Origin und gibt Ablehnungen nicht per CORS frei', async () => {
  const boundaryProbe = createBoundaryProbe()

  await withStartedGateway({ boundaryProbe }, async ({ port }) => {
    for (const origin of [undefined, 'http://localhost:4174', 'null']) {
      const headers = buildRequestHeaders(port, 0)

      if (origin === undefined) {
        delete headers.Origin
      } else {
        headers.Origin = origin
      }

      const response = await sendHttpRequest({ headers, port })
      assertLocalHttpResponse(response, 'originRejected', { cors: false })
    }

    const duplicatedOrigin = await sendRawSocketWrites(port, [
      createRawHeaderBlock(`POST ${GATEWAY_PATH} HTTP/1.1`, [
        `Host: ${LOOPBACK_HOST}:${port}`,
        `Origin: ${ALLOWED_ORIGIN}`,
        `Origin: ${ALLOWED_ORIGIN}`,
        'Content-Type: application/json',
        'Content-Length: 0',
        'Connection: close',
      ]),
    ])

    assertLocalHttpResponse(duplicatedOrigin, 'originRejected', {
      cors: false,
    })
  })

  assert.equal(boundaryProbe.calls.length, 0)
})

test('akzeptiert nur application/json mit optional genau charset=utf-8', async () => {
  const boundaryProbe = createBoundaryProbe()

  await withStartedGateway({ boundaryProbe }, async ({ port }) => {
    for (const contentType of [
      'application/json',
      'application/json;charset=utf-8',
      'Application/JSON ; Charset = UTF-8',
    ]) {
      const response = await sendHttpRequest({
        headers: buildRequestHeaders(port, 0, {
          'Content-Type': contentType,
        }),
        port,
      })

      assertLocalHttpResponse(response, 'upstreamUnavailable')
    }

    for (const contentType of [
      undefined,
      'text/plain',
      'application/json; charset=latin1',
      'application/json; profile=fixture',
      'application/json; charset=utf-8; charset=utf-8',
      'application/json; charset="utf-8"',
    ]) {
      const headers = buildRequestHeaders(port, 0)

      if (contentType === undefined) {
        delete headers['Content-Type']
      } else {
        headers['Content-Type'] = contentType
      }

      const response = await sendHttpRequest({ headers, port })
      assertLocalHttpResponse(response, 'unsupportedMediaType')
    }

    const duplicateContentType = await sendRawSocketWrites(port, [
      createRawHeaderBlock(`POST ${GATEWAY_PATH} HTTP/1.1`, [
        `Host: ${LOOPBACK_HOST}:${port}`,
        `Origin: ${ALLOWED_ORIGIN}`,
        'Content-Type: application/json',
        'Content-Type: application/json',
        'Content-Length: 0',
        'Connection: close',
      ]),
    ])

    assertLocalHttpResponse(duplicateContentType, 'unsupportedMediaType')
  })

  assert.equal(boundaryProbe.calls.length, 3)
})

test('erlaubt nur fehlendes oder eindeutiges identity Content-Encoding ohne Dekompression', async () => {
  const boundaryProbe = createBoundaryProbe()

  await withStartedGateway({ boundaryProbe }, async ({ port }) => {
    for (const contentEncoding of [undefined, 'identity', 'IDENTITY']) {
      const headers = buildRequestHeaders(port, 0)

      if (contentEncoding !== undefined) {
        headers['Content-Encoding'] = contentEncoding
      }

      const response = await sendHttpRequest({ headers, port })
      assertLocalHttpResponse(response, 'upstreamUnavailable')
    }

    for (const contentEncoding of ['gzip', 'br', 'identity, identity']) {
      const response = await sendHttpRequest({
        headers: buildRequestHeaders(port, 0, {
          'Content-Encoding': contentEncoding,
        }),
        port,
      })

      assertLocalHttpResponse(response, 'unsupportedMediaType')
    }

    const duplicateEncoding = await sendRawSocketWrites(port, [
      createRawHeaderBlock(`POST ${GATEWAY_PATH} HTTP/1.1`, [
        `Host: ${LOOPBACK_HOST}:${port}`,
        `Origin: ${ALLOWED_ORIGIN}`,
        'Content-Type: application/json',
        'Content-Encoding: identity',
        'Content-Encoding: identity',
        'Content-Length: 0',
        'Connection: close',
      ]),
    ])

    assertLocalHttpResponse(duplicateEncoding, 'unsupportedMediaType')
  })

  assert.equal(boundaryProbe.calls.length, 3)
})

test('behandelt Content-Length nur als frühes eindeutiges Signal und parserbedingte Mehrdeutigkeit fail closed', async () => {
  const boundaryProbe = createBoundaryProbe()

  await withStartedGateway({ boundaryProbe }, async ({ port }) => {
    const declaredOversize = await sendRawSocketWrites(port, [
      createRawHeaderBlock(`POST ${GATEWAY_PATH} HTTP/1.1`, [
        `Host: ${LOOPBACK_HOST}:${port}`,
        `Origin: ${ALLOWED_ORIGIN}`,
        'Content-Type: application/json',
        `Content-Length: ${SYNC_CONTRACT_MAX_RAW_BODY_BYTES + 1}`,
        'Connection: close',
      ]),
    ])
    assertLocalHttpResponse(declaredOversize, 'payloadTooLarge')

    for (const lengthValue of ['-1', '+1', '1.5', '9007199254740992']) {
      const response = await sendRawSocketWrites(port, [
        createRawHeaderBlock(`POST ${GATEWAY_PATH} HTTP/1.1`, [
          `Host: ${LOOPBACK_HOST}:${port}`,
          `Origin: ${ALLOWED_ORIGIN}`,
          'Content-Type: application/json',
          `Content-Length: ${lengthValue}`,
          'Connection: close',
        ]),
      ])

      assert.equal(response.statusCode, 400)
    }

    const parserCases = [
      [
        'Content-Length: 0',
        'Content-Length: 0',
      ],
      [
        'Content-Length: 0',
        'Transfer-Encoding: chunked',
      ],
    ]

    for (const specialHeaders of parserCases) {
      const response = await sendRawSocketWrites(port, [
        createRawHeaderBlock(`POST ${GATEWAY_PATH} HTTP/1.1`, [
          `Host: ${LOOPBACK_HOST}:${port}`,
          `Origin: ${ALLOWED_ORIGIN}`,
          'Content-Type: application/json',
          ...specialHeaders,
          'Connection: close',
        ]),
      ])

      assertLocalHttpResponse(response, 'invalidHttpRequest', {
        cors: false,
      })
    }
  })

  assert.equal(boundaryProbe.calls.length, 0)
})

test('antwortet bei nicht erlaubten Transfer-Encodings samt Body pro Socket exakt einmal und ohne Decoder oder Boundary', async () => {
  const boundaryProbe = createBoundaryProbe()
  const decoderProbe = createDecoderProbe()
  const privateMarker = 'fixture-transfer-encoding-private-sentinel'

  await withStartedGateway({
    boundaryProbe,
    createTextDecoder: decoderProbe.createTextDecoder,
  }, async ({ port }) => {
    for (const transferEncoding of [
      'gzip',
      'identity',
      'gzip, chunked, identity',
    ]) {
      const response = await sendRawSocketWrites(port, [
        Buffer.concat([
          createRawHeaderBlock(`POST ${GATEWAY_PATH} HTTP/1.1`, [
            `Host: ${LOOPBACK_HOST}:${port}`,
            `Origin: ${ALLOWED_ORIGIN}`,
            'Content-Type: application/json',
            `Transfer-Encoding: ${transferEncoding}`,
            'Connection: close',
          ]),
          Buffer.from(privateMarker, 'utf8'),
        ]),
      ])

      assertSingleStaticInvalidHttpResponse(response)
      assert.equal(response.rawResponse.toString('utf8').includes(privateMarker), false)
    }
  })

  assert.equal(boundaryProbe.calls.length, 0)
  assert.equal(decoderProbe.calls.create.length, 0)
  assert.equal(decoderProbe.calls.decode.length, 0)
})

test('liefert für einen Parserfehler vor Anwendungsübernahme genau eine kontrollierte Raw-Response', async () => {
  const boundaryProbe = createBoundaryProbe()
  const decoderProbe = createDecoderProbe()
  const privateMarker = 'fixture-parser-private-sentinel'

  await withStartedGateway({
    boundaryProbe,
    createTextDecoder: decoderProbe.createTextDecoder,
  }, async ({ port }) => {
    const malformedRequest = Buffer.from(
      [
        `G?T ${GATEWAY_PATH} HTTP/1.1`,
        `Host: ${LOOPBACK_HOST}:${port}`,
        `X-Private: ${privateMarker}`,
        '',
        privateMarker,
      ].join('\r\n'),
      'latin1'
    )
    const response = await sendRawSocketWrites(port, [malformedRequest])

    assertSingleStaticInvalidHttpResponse(response)
    assert.equal(response.rawResponse.toString('utf8').includes(privateMarker), false)
  })

  assert.equal(boundaryProbe.calls.length, 0)
  assert.equal(decoderProbe.calls.create.length, 0)
  assert.equal(decoderProbe.calls.decode.length, 0)
})

test('CONNECT, Upgrade und unerwartete Expect-Flows erreichen weder Decoder noch Boundary', async () => {
  const boundaryProbe = createBoundaryProbe()
  const decoderProbe = createDecoderProbe()

  await withStartedGateway({
    boundaryProbe,
    createTextDecoder: decoderProbe.createTextDecoder,
  }, async ({ port }) => {
    const connectResponse = await sendRawSocketWrites(port, [
      createRawHeaderBlock(`CONNECT ${GATEWAY_PATH} HTTP/1.1`, [
        `Host: ${LOOPBACK_HOST}:${port}`,
        'Connection: close',
      ]),
    ])
    assertLocalHttpResponse(connectResponse, 'methodNotAllowed', {
      cors: false,
    })
    assert.equal(connectResponse.headers.get('allow')?.[0], 'POST, OPTIONS')

    const upgradeResponse = await sendRawSocketWrites(port, [
      createRawHeaderBlock(`GET ${GATEWAY_PATH} HTTP/1.1`, [
        `Host: ${LOOPBACK_HOST}:${port}`,
        'Connection: Upgrade',
        'Upgrade: fixture-protocol',
      ]),
    ])
    assertLocalHttpResponse(upgradeResponse, 'invalidHttpRequest', {
      cors: false,
    })

    for (const expectation of ['100-continue', 'fixture-expectation']) {
      const expectResponse = await sendRawSocketWrites(port, [
        createRawHeaderBlock(`POST ${GATEWAY_PATH} HTTP/1.1`, [
          `Host: ${LOOPBACK_HOST}:${port}`,
          `Origin: ${ALLOWED_ORIGIN}`,
          'Content-Type: application/json',
          'Content-Length: 0',
          `Expect: ${expectation}`,
          'Connection: close',
        ]),
      ])

      assertLocalHttpResponse(expectResponse, 'expectationRejected')
    }
  })

  assert.equal(boundaryProbe.calls.length, 0)
  assert.equal(decoderProbe.calls.create.length, 0)
  assert.equal(decoderProbe.calls.decode.length, 0)
})

test('zerstört Half-Open-Sockets nach CONNECT-, Upgrade- und Parser-Raw-Responses auch bei weiterem Client-Drip zeitnah', async () => {
  const boundaryProbe = createBoundaryProbe()
  const decoderProbe = createDecoderProbe()
  const privateMarker = 'fixture-half-open-private-sentinel'

  await withStartedGateway({
    boundaryProbe,
    createTextDecoder: decoderProbe.createTextDecoder,
  }, async ({ port }) => {
    const cases = [
      {
        profileName: 'methodNotAllowed',
        request: createRawHeaderBlock(
          `CONNECT ${GATEWAY_PATH} HTTP/1.1`,
          [
            `Host: ${LOOPBACK_HOST}:${port}`,
            `X-Private: ${privateMarker}`,
            'Connection: close',
          ]
        ),
      },
      {
        profileName: 'invalidHttpRequest',
        request: createRawHeaderBlock(
          `GET ${GATEWAY_PATH} HTTP/1.1`,
          [
            `Host: ${LOOPBACK_HOST}:${port}`,
            `X-Private: ${privateMarker}`,
            'Connection: Upgrade',
            'Upgrade: fixture-protocol',
          ]
        ),
      },
      {
        profileName: 'invalidHttpRequest',
        request: Buffer.from(
          [
            `G?T ${GATEWAY_PATH} HTTP/1.1`,
            `Host: ${LOOPBACK_HOST}:${port}`,
            `X-Private: ${privateMarker}`,
            '',
            privateMarker,
          ].join('\r\n'),
          'latin1'
        ),
      },
    ]

    for (const fixture of cases) {
      const response = await sendHalfOpenRawSocket({
        dripWrite: Buffer.from(privateMarker, 'latin1'),
        initialWrite: fixture.request,
        port,
      })
      const rawResponse = response.rawResponse.toString('utf8')

      assert.equal(response.sawResponse, true)
      assert.ok(response.postResponseDripAttempts >= 1)
      assert.ok(
        response.elapsedMs <= RAW_SOCKET_CLOSE_UPPER_BOUND_MS,
        `Half-Open-Socket erst nach ${response.elapsedMs} ms geschlossen.`
      )
      assert.ok(response.statusLineCount <= 1)
      assert.equal(rawResponse.includes(privateMarker), false)

      if (hasCompleteRawHttpResponse(response)) {
        assertLocalHttpResponse(response, fixture.profileName, {
          cors: false,
        })

        if (fixture.profileName === 'methodNotAllowed') {
          assert.equal(response.headers.get('allow')?.[0], 'POST, OPTIONS')
        }
      }
    }
  })

  assert.equal(boundaryProbe.calls.length, 0)
  assert.equal(decoderProbe.calls.create.length, 0)
  assert.equal(decoderProbe.calls.decode.length, 0)
})

test('zerstört einen gedroppten zweiten Pipeline-Request synchron ohne Node-Zweitresponse oder zweite Boundary', { concurrency: false }, async () => {
  const emitDescriptor = Object.getOwnPropertyDescriptor(
    net.Server.prototype,
    'emit'
  )
  const originalEmit = net.Server.prototype.emit
  const boundaryProbe = createBoundaryProbe()
  const decoderProbe = createDecoderProbe()
  const privateMarker = 'fixture-drop-request-private-sentinel'
  const dropRequestObservations = []

  try {
    Object.defineProperty(net.Server.prototype, 'emit', {
      configurable: true,
      enumerable: false,
      writable: true,
      value(eventName, ...args) {
        const result = Reflect.apply(
          originalEmit,
          this,
          [eventName, ...args]
        )

        if (eventName === 'dropRequest') {
          dropRequestObservations.push({
            destroyedAfterDispatch: args[1]?.destroyed,
          })
        }

        return result
      },
    })

    await withStartedGateway({
      boundaryProbe,
      createTextDecoder: decoderProbe.createTextDecoder,
    }, async ({ port }) => {
      const firstBody = Buffer.from(createRawSyncRequest(), 'utf8')
      const secondBody = Buffer.from(createRawSyncRequest({
        requestId: 'req_00000000-0000-4000-8000-000000000002',
      }), 'utf8')
      const pipeline = Buffer.concat([
        createRawHeaderBlock(`POST ${GATEWAY_PATH} HTTP/1.1`, [
          `Host: ${LOOPBACK_HOST}:${port}`,
          `Origin: ${ALLOWED_ORIGIN}`,
          'Content-Type: application/json',
          `Content-Length: ${firstBody.byteLength}`,
          'Connection: keep-alive',
        ]),
        firstBody,
        createRawHeaderBlock(`POST ${GATEWAY_PATH} HTTP/1.1`, [
          `Host: ${LOOPBACK_HOST}:${port}`,
          `Origin: ${ALLOWED_ORIGIN}`,
          'Content-Type: application/json',
          `Content-Length: ${secondBody.byteLength}`,
          `X-Private: ${privateMarker}`,
          'Connection: close',
        ]),
        secondBody,
      ])
      const response = await sendHalfOpenRawSocket({
        endAfterWrite: true,
        initialWrite: pipeline,
        port,
      })
      const rawResponse = response.rawResponse.toString('utf8')

      assert.ok(
        response.elapsedMs <= RAW_SOCKET_CLOSE_UPPER_BOUND_MS,
        `Pipeline-Socket erst nach ${response.elapsedMs} ms geschlossen.`
      )
      assert.ok(response.statusLineCount <= 1)
      assert.equal(rawResponse.includes(privateMarker), false)
      assert.equal(rawResponse.includes('\r\n\r\nService Unavailable'), false)

      if (hasCompleteRawHttpResponse(response)) {
        assertLocalHttpResponse(response, 'upstreamUnavailable')
      }

      assert.ok(boundaryProbe.calls.length <= 1)

      if (boundaryProbe.calls.length === 1) {
        assert.equal(boundaryProbe.calls[0].rawBody, firstBody.toString('utf8'))
        assert.notEqual(
          boundaryProbe.calls[0].rawBody,
          secondBody.toString('utf8')
        )
      }
    })
  } finally {
    if (emitDescriptor === undefined) {
      delete net.Server.prototype.emit
    } else {
      Object.defineProperty(
        net.Server.prototype,
        'emit',
        emitDescriptor
      )
    }
  }

  assert.equal(dropRequestObservations.length, 1)
  assert.deepEqual(dropRequestObservations[0], {
    destroyedAfterDispatch: true,
  })
  assert.ok(decoderProbe.calls.create.length <= 1)
  assert.ok(decoderProbe.calls.decode.length <= 1)
})

test('führt ein hostloses OPTIONS und den folgenden gültigen POST gemeinsam durch Admission und Response-Owner', { concurrency: false }, async () => {
  const boundaryProbe = createBoundaryProbe()
  const decoderProbe = createDecoderProbe()
  const privateMarker = 'fixture-hostless-options-pipeline-private-sentinel'

  const consoleCalls = await captureConsoleCalls(async () => {
    await withNodeRequestLimitDisabled(async ({
      getCapturedServer,
      getSecondApplicationRequestObservation,
      getSecondRawHeadersAccessCount,
      observedRequestEvents,
    }) => {
      await withStartedGateway({
        boundaryProbe,
        createTextDecoder: decoderProbe.createTextDecoder,
      }, async ({ port }) => {
        const postBody = Buffer.from(createRawSyncRequest(), 'utf8')
        const pipeline = Buffer.concat([
          createRawHeaderBlock(`OPTIONS ${GATEWAY_PATH} HTTP/1.1`, [
            `Origin: ${ALLOWED_ORIGIN}`,
            'Access-Control-Request-Method: POST',
            'Access-Control-Request-Headers: Content-Type',
            'Connection: keep-alive',
            `X-Private: ${privateMarker}-options`,
          ]),
          createRawHeaderBlock(`POST ${GATEWAY_PATH} HTTP/1.1`, [
            `Host: ${LOOPBACK_HOST}:${port}`,
            `Origin: ${ALLOWED_ORIGIN}`,
            'Content-Type: application/json',
            `Content-Length: ${postBody.byteLength}`,
            'Connection: close',
            `X-Private: ${privateMarker}-post`,
          ]),
          postBody,
        ])
        const response = await sendHalfOpenRawSocket({
          endAfterWrite: true,
          initialWrite: pipeline,
          port,
        })
        const rawResponse = response.rawResponse.toString('utf8')
        const secondObservation =
          getSecondApplicationRequestObservation()

        assert.equal(getCapturedServer()?.maxRequestsPerSocket, 0)
        assert.deepEqual(observedRequestEvents, ['request', 'request'])
        assert.equal(getSecondRawHeadersAccessCount(), 0)
        assert.equal(secondObservation?.eventName, 'request')
        assert.equal(secondObservation?.rawHeadersInstrumented, true)
        assert.equal(
          secondObservation?.responseDestroyed === true ||
            secondObservation?.socketDestroyed === true,
          true
        )
        assert.ok(
          response.elapsedMs <= RAW_SOCKET_CLOSE_UPPER_BOUND_MS,
          `Hostlose OPTIONS-Pipeline erst nach ${response.elapsedMs} ms geschlossen.`
        )
        assert.ok(response.statusLineCount <= 1)
        assert.equal(rawResponse.includes(privateMarker), false)

        if (response.statusCode !== null) {
          const expectedBody = createExpectedLocalHttpResponseBody(
            'invalidHttpRequest'
          )

          assert.equal(
            response.statusCode,
            LOCAL_HTTP_PROFILES.invalidHttpRequest.httpStatus
          )
          assert.deepEqual(
            response.headers.get('content-length') ?? [],
            [String(expectedBody.byteLength)]
          )
          assert.ok(response.body.byteLength <= expectedBody.byteLength)
          assert.deepEqual(
            response.body,
            expectedBody.subarray(0, response.body.byteLength)
          )

          if (response.body.byteLength === expectedBody.byteLength) {
            assertLocalHttpResponse(response, 'invalidHttpRequest')
          }
        }
      })
    })
  })

  assert.equal(boundaryProbe.calls.length, 0)
  assert.equal(decoderProbe.calls.create.length, 0)
  assert.equal(decoderProbe.calls.decode.length, 0)
  assert.deepEqual(consoleCalls, [])
})

test('lehnt zehn gepipelinete HTTP/1.0-Keep-Alive-Requests vor Decoder und Boundary statisch ab', { concurrency: false }, async () => {
  const boundaryProbe = createBoundaryProbe()
  const decoderProbe = createDecoderProbe()
  const privateMarker = 'fixture-http-1-0-pipeline-private-sentinel'

  const consoleCalls = await captureConsoleCalls(async () => {
    await withStartedGateway({
      boundaryProbe,
      createTextDecoder: decoderProbe.createTextDecoder,
    }, async ({ port }) => {
      const pipelineParts = []

      for (let requestNumber = 1; requestNumber <= 10; requestNumber += 1) {
        const body = Buffer.from(createRawSyncRequest({
          requestId:
            `req_00000000-0000-4000-8000-${String(requestNumber).padStart(12, '0')}`,
        }), 'utf8')

        pipelineParts.push(
          createRawHeaderBlock(`POST ${GATEWAY_PATH} HTTP/1.0`, [
            `Host: ${LOOPBACK_HOST}:${port}`,
            `Origin: ${ALLOWED_ORIGIN}`,
            'Content-Type: application/json',
            `Content-Length: ${body.byteLength}`,
            'Connection: keep-alive',
            `X-Private: ${privateMarker}-${requestNumber}`,
          ]),
          body
        )
      }

      const response = await sendHalfOpenRawSocket({
        endAfterWrite: true,
        initialWrite: Buffer.concat(pipelineParts),
        port,
      })
      const rawResponse = response.rawResponse.toString('utf8')

      assert.ok(
        response.elapsedMs <= RAW_SOCKET_CLOSE_UPPER_BOUND_MS,
        `HTTP/1.0-Pipeline-Socket erst nach ${response.elapsedMs} ms geschlossen.`
      )
      assert.ok(response.statusLineCount <= 1)
      assert.equal(rawResponse.includes(privateMarker), false)

      if (hasCompleteRawHttpResponse(response)) {
        assertLocalHttpResponse(response, 'invalidHttpRequest', {
          cors: false,
        })
      }
    })
  })

  assert.equal(boundaryProbe.calls.length, 0)
  assert.equal(decoderProbe.calls.create.length, 0)
  assert.equal(decoderProbe.calls.decode.length, 0)
  assert.deepEqual(consoleCalls, [])
})

test('begrenzt mehrere HTTP/1.1-Requests auch ohne Nodes maxRequestsPerSocket anwendungsseitig auf einen', { concurrency: false }, async () => {
  const boundaryProbe = createBoundaryProbe()
  const decoderProbe = createDecoderProbe()
  const privateMarker = 'fixture-http-1-1-admission-private-sentinel'

  const consoleCalls = await captureConsoleCalls(async () => {
    await withNodeRequestLimitDisabled(async ({
      getCapturedServer,
      getSecondApplicationRequestObservation,
      getSecondRawHeadersAccessCount,
      observedRequestEvents,
    }) => {
      await withStartedGateway({
        boundaryProbe,
        createTextDecoder: decoderProbe.createTextDecoder,
      }, async ({ port }) => {
        const bodies = []
        const pipelineParts = []

        for (let requestNumber = 1; requestNumber <= 2; requestNumber += 1) {
          const body = Buffer.from(createRawSyncRequest({
            requestId:
              `req_10000000-0000-4000-8000-${String(requestNumber).padStart(12, '0')}`,
          }), 'utf8')

          bodies.push(body)
          pipelineParts.push(
            createRawHeaderBlock(`POST ${GATEWAY_PATH} HTTP/1.1`, [
              `Host: ${LOOPBACK_HOST}:${port}`,
              `Origin: ${ALLOWED_ORIGIN}`,
              'Content-Type: application/json',
              `Content-Length: ${body.byteLength}`,
              'Connection: keep-alive',
              `X-Private: ${privateMarker}-${requestNumber}`,
            ]),
            body
          )
        }

        const response = await sendHalfOpenRawSocket({
          endAfterWrite: true,
          initialWrite: Buffer.concat(pipelineParts),
          port,
        })
        const rawResponse = response.rawResponse.toString('utf8')
        const secondObservation =
          getSecondApplicationRequestObservation()

        assert.equal(getCapturedServer()?.maxRequestsPerSocket, 0)
        assert.deepEqual(observedRequestEvents, ['request', 'request'])
        assert.equal(getSecondRawHeadersAccessCount(), 0)
        assert.equal(secondObservation?.eventName, 'request')
        assert.equal(secondObservation?.rawHeadersInstrumented, true)
        assert.equal(
          secondObservation?.responseDestroyed === true ||
            secondObservation?.socketDestroyed === true,
          true
        )
        assert.ok(
          response.elapsedMs <= RAW_SOCKET_CLOSE_UPPER_BOUND_MS,
          `HTTP/1.1-Pipeline-Socket erst nach ${response.elapsedMs} ms geschlossen.`
        )
        assert.ok(response.statusLineCount <= 1)
        assert.equal(rawResponse.includes(privateMarker), false)

        if (hasCompleteRawHttpResponse(response)) {
          assertLocalHttpResponse(response, 'upstreamUnavailable')
        }

        assert.equal(boundaryProbe.calls.length, 1)
        assert.equal(decoderProbe.calls.create.length, 1)
        assert.equal(decoderProbe.calls.decode.length, 1)
        assert.equal(
          boundaryProbe.calls[0].rawBody,
          bodies[0].toString('utf8')
        )
      })
    })
  })

  assert.deepEqual(consoleCalls, [])
})

test('wendet dieselbe Socket-Admission auf checkContinue- und checkExpectation-Pipelines an', { concurrency: false }, async () => {
  const privateMarker = 'fixture-expect-admission-private-sentinel'
  const fixtures = [
    {
      eventName: 'checkContinue',
      expectation: '100-continue',
    },
    {
      eventName: 'checkExpectation',
      expectation: 'fixture-expectation',
    },
  ]

  const consoleCalls = await captureConsoleCalls(async () => {
    for (const fixture of fixtures) {
      const boundaryProbe = createBoundaryProbe()
      const decoderProbe = createDecoderProbe()

      await withNodeRequestLimitDisabled(async ({
        getCapturedServer,
        getSecondApplicationRequestObservation,
        getSecondRawHeadersAccessCount,
        observedRequestEvents,
      }) => {
        await withStartedGateway({
          boundaryProbe,
          createTextDecoder: decoderProbe.createTextDecoder,
        }, async ({ port }) => {
          const body = Buffer.from(createRawSyncRequest(), 'utf8')
          const pipelineParts = []

          for (let requestNumber = 1; requestNumber <= 2; requestNumber += 1) {
            pipelineParts.push(
              createRawHeaderBlock(`POST ${GATEWAY_PATH} HTTP/1.1`, [
                `Host: ${LOOPBACK_HOST}:${port}`,
                `Origin: ${ALLOWED_ORIGIN}`,
                'Content-Type: application/json',
                `Content-Length: ${body.byteLength}`,
                'Connection: keep-alive',
                `Expect: ${fixture.expectation}`,
                `X-Private: ${privateMarker}-${fixture.eventName}-${requestNumber}`,
              ]),
              body
            )
          }

          const response = await sendHalfOpenRawSocket({
            endAfterWrite: true,
            initialWrite: Buffer.concat(pipelineParts),
            port,
          })
          const rawResponse = response.rawResponse.toString('utf8')
          const secondObservation =
            getSecondApplicationRequestObservation()

          assert.equal(getCapturedServer()?.maxRequestsPerSocket, 0)
          assert.deepEqual(
            observedRequestEvents,
            [fixture.eventName, fixture.eventName]
          )
          assert.equal(getSecondRawHeadersAccessCount(), 0)
          assert.equal(secondObservation?.eventName, fixture.eventName)
          assert.equal(secondObservation?.rawHeadersInstrumented, true)
          assert.equal(
            secondObservation?.responseDestroyed === true ||
              secondObservation?.socketDestroyed === true,
            true
          )
          assert.ok(
            response.elapsedMs <= RAW_SOCKET_CLOSE_UPPER_BOUND_MS,
            `${fixture.eventName}-Pipeline-Socket erst nach ${response.elapsedMs} ms geschlossen.`
          )
          assert.ok(response.statusLineCount <= 1)
          assert.equal(rawResponse.includes(privateMarker), false)

          if (hasCompleteRawHttpResponse(response)) {
            assertLocalHttpResponse(response, 'expectationRejected')
          }

          assert.equal(boundaryProbe.calls.length, 0)
          assert.equal(decoderProbe.calls.create.length, 0)
          assert.equal(decoderProbe.calls.decode.length, 0)
        })
      })
    }
  })

  assert.deepEqual(consoleCalls, [])
})

test('akzeptiert exakt 65.536 tatsächliche Bytes und lehnt Byte 65.537 über mehrere Chunks ab', async () => {
  const boundaryProbe = createBoundaryProbe()
  const decoderProbe = createDecoderProbe()

  await withStartedGateway({
    boundaryProbe,
    createTextDecoder: decoderProbe.createTextDecoder,
  }, async ({ port }) => {
    const exactBody = Buffer.alloc(SYNC_CONTRACT_MAX_RAW_BODY_BYTES, 0x61)
    const exactResponse = await sendRawSocketWrites(
      port,
      createChunkedWriteGroups(port, [exactBody])
    )

    assertLocalHttpResponse(exactResponse, 'upstreamUnavailable')
    assert.equal(boundaryProbe.calls.length, 1)
    assert.equal(boundaryProbe.calls[0].rawBody.length, exactBody.length)
    assert.equal(decoderProbe.calls.create.length, 1)
    assert.equal(decoderProbe.calls.decode.length, 1)
    assert.equal(decoderProbe.calls.decode[0].args[0].byteLength, exactBody.length)

    const oversizedFragments = [
      Buffer.alloc(32_768, 0x61),
      Buffer.alloc(32_768, 0x62),
      Buffer.from('c'),
    ]
    const oversizedResponse = await sendRawSocketWrites(
      port,
      createChunkedWriteGroups(port, oversizedFragments)
    )

    assertPayloadTooLargeOrControlledReset(oversizedResponse)
  })

  assert.equal(boundaryProbe.calls.length, 1)
  assert.equal(decoderProbe.calls.create.length, 1)
  assert.equal(decoderProbe.calls.decode.length, 1)
})

test('weist 65.537 tatsächliche Bytes auch aus einem einzigen Client-Chunk vor Materialisierung und Boundary zurück', async () => {
  const boundaryProbe = createBoundaryProbe()
  const decoderProbe = createDecoderProbe()

  await withStartedGateway({
    boundaryProbe,
    createTextDecoder: decoderProbe.createTextDecoder,
  }, async ({ port }) => {
    const oversizedBody = Buffer.alloc(
      SYNC_CONTRACT_MAX_RAW_BODY_BYTES + 1,
      0x61
    )
    const response = await sendRawSocketWrites(
      port,
      createChunkedWriteGroups(port, [oversizedBody])
    )

    assertPayloadTooLargeOrControlledReset(response)
  })

  assert.equal(boundaryProbe.calls.length, 0)
  assert.equal(decoderProbe.calls.create.length, 0)
  assert.equal(decoderProbe.calls.decode.length, 0)
})

test('erzeugt niemals eine übergroße Gesamtpufferkopie', { concurrency: false }, async () => {
  const originalConcatDescriptor = Object.getOwnPropertyDescriptor(
    Buffer,
    'concat'
  )
  const originalConcat = originalConcatDescriptor.value
  const boundaryProbe = createBoundaryProbe()
  const decoderProbe = createDecoderProbe()
  const exactBody = Buffer.alloc(SYNC_CONTRACT_MAX_RAW_BODY_BYTES, 0x61)
  const oversizedBody = Buffer.alloc(
    SYNC_CONTRACT_MAX_RAW_BODY_BYTES + 1,
    0x62
  )
  const concatAttempts = []
  let oversizedAttemptStart = null

  try {
    Object.defineProperty(Buffer, 'concat', {
      ...originalConcatDescriptor,
      value(list, totalLength) {
        let calculatedLength = null

        if (Array.isArray(list)) {
          calculatedLength = list.reduce(
            (length, item) => length + (item?.byteLength ?? 0),
            0
          )
        }

        concatAttempts.push({ calculatedLength, totalLength })
        return Reflect.apply(originalConcat, Buffer, [list, totalLength])
      },
    })

    await withStartedGateway({
      boundaryProbe,
      createTextDecoder: decoderProbe.createTextDecoder,
    }, async ({ port }) => {
      const exactResponse = await sendRawSocketWrites(
        port,
        createChunkedWriteGroups(port, [exactBody])
      )

      assertLocalHttpResponse(exactResponse, 'upstreamUnavailable')
      oversizedAttemptStart = concatAttempts.length

      const oversizedResponse = await sendRawSocketWrites(
        port,
        createChunkedWriteGroups(port, [oversizedBody])
      )

      assertPayloadTooLargeOrControlledReset(oversizedResponse)
    })
  } finally {
    Object.defineProperty(Buffer, 'concat', originalConcatDescriptor)
  }

  assert.ok(
    concatAttempts.some(
      (attempt) => attempt.totalLength === SYNC_CONTRACT_MAX_RAW_BODY_BYTES
    )
  )
  assert.ok(Number.isSafeInteger(oversizedAttemptStart))

  for (const attempt of concatAttempts) {
    const attemptedLength = Number.isSafeInteger(attempt.totalLength)
      ? attempt.totalLength
      : attempt.calculatedLength

    assert.ok(attemptedLength <= SYNC_CONTRACT_MAX_RAW_BODY_BYTES)
  }

  for (const attempt of concatAttempts.slice(oversizedAttemptStart)) {
    assert.notEqual(
      attempt.totalLength,
      SYNC_CONTRACT_MAX_RAW_BODY_BYTES + 1
    )
    assert.notEqual(
      attempt.calculatedLength,
      SYNC_CONTRACT_MAX_RAW_BODY_BYTES + 1
    )
  }

  assert.equal(boundaryProbe.calls.length, 1)
  assert.equal(decoderProbe.calls.decode.length, 1)
})

test('dekodiert leere und gültige Bodies jeweils exakt einmal als Gesamtpuffer und ruft die Boundary exakt einmal auf', async () => {
  const boundaryProbe = createBoundaryProbe()
  const decoderProbe = createDecoderProbe()

  await withStartedGateway({
    boundaryProbe,
    createTextDecoder: decoderProbe.createTextDecoder,
  }, async ({ port }) => {
    const bodies = [
      Buffer.alloc(0),
      Buffer.from(createRawSyncRequest(), 'utf8'),
    ]

    for (const body of bodies) {
      const response = await sendHttpRequest({
        bodyChunks: body.byteLength === 0 ? [] : [body],
        headers: buildRequestHeaders(port, body.byteLength),
        port,
      })

      assertLocalHttpResponse(response, 'upstreamUnavailable')
    }

    assert.deepEqual(
      boundaryProbe.calls.map((call) => call.rawBody),
      ['', createRawSyncRequest()]
    )
    assert.deepEqual(
      decoderProbe.calls.decode.map((call) => call.args[0].byteLength),
      bodies.map((body) => body.byteLength)
    )
    assert.equal(decoderProbe.calls.create.length, 2)
    assert.equal(decoderProbe.calls.decode.length, 2)
    assert.ok(
      decoderProbe.calls.create.every((call) => call.args.length === 0)
    )
    assert.ok(
      decoderProbe.calls.decode.every((call) => call.args.length === 1)
    )
  })
})

test('lehnt ungültiges UTF-8 und eine unvollständige Mehrbytefolge ohne Boundary fail closed ab', async () => {
  const boundaryProbe = createBoundaryProbe()
  const decoderProbe = createDecoderProbe()

  await withStartedGateway({
    boundaryProbe,
    createTextDecoder: decoderProbe.createTextDecoder,
  }, async ({ port }) => {
    for (const body of [
      Buffer.from([0xc3, 0x28]),
      Buffer.from([0xe2, 0x82]),
    ]) {
      const response = await sendHttpRequest({
        bodyChunks: [body],
        headers: buildRequestHeaders(port, body.byteLength),
        port,
      })

      assertLocalHttpResponse(response, 'invalidHttpRequest')
    }
  })

  assert.equal(decoderProbe.calls.create.length, 2)
  assert.equal(decoderProbe.calls.decode.length, 2)
  assert.equal(boundaryProbe.calls.length, 0)
})

test('bewahrt eine gültige Mehrbytefolge über Chunkgrenzen ohne Per-Chunk-Decoding', async () => {
  const boundaryProbe = createBoundaryProbe()
  const decoderProbe = createDecoderProbe()
  const rawBody = '"fixture-🌲"'
  const bodyBytes = Buffer.from(rawBody, 'utf8')
  const treeIndex = bodyBytes.indexOf(Buffer.from('🌲', 'utf8'))
  const fragments = [
    bodyBytes.subarray(0, treeIndex + 1),
    bodyBytes.subarray(treeIndex + 1, treeIndex + 3),
    bodyBytes.subarray(treeIndex + 3),
  ]

  await withStartedGateway({
    boundaryProbe,
    createTextDecoder: decoderProbe.createTextDecoder,
  }, async ({ port }) => {
    const response = await sendRawSocketWrites(
      port,
      createChunkedWriteGroups(port, fragments)
    )

    assertLocalHttpResponse(response, 'upstreamUnavailable')
  })

  assert.equal(decoderProbe.calls.decode.length, 1)
  assert.equal(decoderProbe.calls.decode[0].args[0].byteLength, bodyBytes.length)
  assert.equal(boundaryProbe.calls.length, 1)
  assert.equal(boundaryProbe.calls[0].rawBody, rawBody)
})

test('erhält EF-BB-BF als U+FEFF und übergibt BOM plus JSON exakt einmal an die bestehende Boundary', async () => {
  const boundaryProbe = createRealBoundaryProbe()
  const decoderProbe = createDecoderProbe()
  const jsonBytes = Buffer.from(createRawSyncRequest(), 'utf8')
  const body = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), jsonBytes])

  await withStartedGateway({
    boundaryProbe,
    createTextDecoder: decoderProbe.createTextDecoder,
  }, async ({ port }) => {
    const response = await sendHttpRequest({
      bodyChunks: [body],
      headers: buildRequestHeaders(port, body.byteLength),
      port,
    })

    assert.equal(response.statusCode, 400)
    assert.equal(boundaryProbe.calls.length, 1)
    assert.equal(boundaryProbe.calls[0].rawBody, `\ufeff${createRawSyncRequest()}`)
    assert.equal(
      boundaryProbe.calls[0].result.gatewayErrorResponse.error.code,
      'INVALID_JSON'
    )
    assert.deepEqual(
      parseJsonBody(response),
      boundaryProbe.calls[0].result.gatewayErrorResponse
    )
    assert.deepEqual(
      validateSyncGatewayErrorResponse(parseJsonBody(response)),
      { ok: true, errors: [] }
    )
  })

  assert.equal(decoderProbe.calls.create.length, 1)
  assert.equal(decoderProbe.calls.decode.length, 1)
})

test('prüft fatal und ignoreBOM fail closed vor decode und Boundary', async () => {
  for (const decoderOptions of [
    { fatal: false, ignoreBOM: true },
    { fatal: true, ignoreBOM: false },
  ]) {
    const boundaryProbe = createBoundaryProbe()
    const decoderProbe = createDecoderProbe(decoderOptions)

    await withStartedGateway({
      boundaryProbe,
      createTextDecoder: decoderProbe.createTextDecoder,
    }, async ({ port }) => {
      const response = await sendHttpRequest({
        headers: buildRequestHeaders(port, 0),
        port,
      })

      assertLocalHttpResponse(response, 'gatewayFailed')
    })

    assert.equal(decoderProbe.calls.create.length, 1)
    assert.equal(decoderProbe.calls.decode.length, 0)
    assert.equal(boundaryProbe.calls.length, 0)
  }
})

test('redigiert werfende Decoder-Getter und ungeeignete Decoderresultate vor Boundary als 500', async () => {
  const privateMarker = 'fixture-decoder-getter-private-sentinel'
  const systems = [
    {
      createTextDecoder() {
        return {
          get fatal() {
            throw new Error(privateMarker)
          },
          ignoreBOM: true,
          decode() {
            throw new Error('fixture-unreachable-decode')
          },
        }
      },
    },
    {
      createTextDecoder() {
        return {
          fatal: true,
          ignoreBOM: true,
          decode() {
            return Buffer.from(privateMarker)
          },
        }
      },
    },
  ]

  for (const system of systems) {
    const boundaryProbe = createBoundaryProbe()

    await withStartedGateway({
      boundaryProbe,
      createTextDecoder: system.createTextDecoder,
    }, async ({ port }) => {
      const response = await sendHttpRequest({
        headers: buildRequestHeaders(port, 0),
        port,
      })

      assertLocalHttpResponse(response, 'gatewayFailed')
      assert.equal(response.body.toString('utf8').includes(privateMarker), false)
    })

    assert.equal(boundaryProbe.calls.length, 0)
  }
})

test('akzeptiert einen echten syncTest nur lokal und endet ohne SyncAgent-Behauptung statisch mit 503', async () => {
  const boundaryProbe = createRealBoundaryProbe()
  const privateRequestId =
    'req_fixture-accepted-http-private-sentinel'
  const rawBody = createRawSyncRequest({ requestId: privateRequestId })
  const body = Buffer.from(rawBody, 'utf8')

  await withStartedGateway({ boundaryProbe }, async ({ port }) => {
    const response = await sendHttpRequest({
      bodyChunks: [body],
      headers: buildRequestHeaders(port, body.byteLength),
      port,
    })

    assertLocalHttpResponse(response, 'upstreamUnavailable')
    const serializedResponse = response.body.toString('utf8')

    assert.equal(serializedResponse.includes(privateRequestId), false)
    assert.equal(serializedResponse.includes('SyncAgent'), false)
    assert.equal(serializedResponse.includes('handledBy'), false)
    assert.equal(serializedResponse.includes('processedBy'), false)
    assert.equal(boundaryProbe.calls.length, 1)
    assert.equal(boundaryProbe.calls[0].result.ok, true)
  })
})

test('serialisiert kontrollierte Boundary-Ablehnungen unverändert und getrennt vom lokalen Envelope', async () => {
  const fixtures = [
    { rawBody: '{', code: 'INVALID_JSON' },
    { rawBody: 'null', code: 'VALIDATION_ERROR' },
    {
      rawBody: createRawSyncRequest({ version: '2.0' }),
      code: 'UNSUPPORTED_VERSION',
    },
    {
      rawBody: createRawSyncRequest({ action: 'fixtureUnknownAction' }),
      code: 'UNKNOWN_ACTION',
    },
  ]
  const boundaryProbe = createRealBoundaryProbe()

  await withStartedGateway({ boundaryProbe }, async ({ port }) => {
    for (const fixture of fixtures) {
      const body = Buffer.from(fixture.rawBody, 'utf8')
      const response = await sendHttpRequest({
        bodyChunks: [body],
        headers: buildRequestHeaders(port, body.byteLength),
        port,
      })
      const boundaryResult = boundaryProbe.calls.at(-1).result

      assert.equal(response.statusCode, 400)
      assert.equal(boundaryResult.status, 'syncRequestRejected')
      assert.equal(boundaryResult.gatewayErrorResponse.error.code, fixture.code)
      assert.deepEqual(parseJsonBody(response), boundaryResult.gatewayErrorResponse)
      assert.equal(Object.hasOwn(parseJsonBody(response), 'ok'), false)
      assert.equal(response.headers['cache-control'], 'no-store')
      assert.equal(response.headers['x-content-type-options'], 'nosniff')
      assert.equal(response.headers['access-control-allow-origin'], ALLOWED_ORIGIN)
    }
  })

  assert.equal(boundaryProbe.calls.length, fixtures.length)
})

test('redigiert lokale Boundary-, Decoder- und fremde Exceptionfehler statisch als 500', async () => {
  const privateMarkers = [
    'fixture-boundary-private-sentinel',
    'fixture-decoder-private-sentinel',
  ]
  const systems = [
    {
      boundaryProbe: createBoundaryProbe(() => createLocalBoundaryFailure()),
    },
    {
      boundaryProbe: createBoundaryProbe(() => {
        throw new Error(privateMarkers[0])
      }),
    },
    {
      boundaryProbe: createBoundaryProbe(),
      createTextDecoder() {
        throw new Error(privateMarkers[1])
      },
    },
  ]

  for (const system of systems) {
    await withStartedGateway(system, async ({ port }) => {
      const response = await sendHttpRequest({
        headers: buildRequestHeaders(port, 0),
        port,
      })

      assertLocalHttpResponse(response, 'gatewayFailed')
      const serializedResponse = response.body.toString('utf8')

      for (const marker of privateMarkers) {
        assert.equal(serializedResponse.includes(marker), false)
      }
      assert.equal(serializedResponse.includes('stack'), false)
    })
  }
})

test('weist malformed und nicht validierte Boundary-Resultate statisch als 500 zurück', async () => {
  const privateMarker = 'fixture-malformed-boundary-private-sentinel'
  const malformedResults = [
    null,
    {},
    {
      ok: true,
      status: 'syncRequestAccepted',
      syncRequest: null,
      gatewayErrorResponse: null,
      error: null,
    },
    {
      ok: true,
      status: 'syncRequestAccepted',
      syncRequest: privateMarker,
      gatewayErrorResponse: null,
      error: null,
    },
    {
      ok: true,
      status: 'syncRequestAccepted',
      syncRequest: createSyncRequest(),
      gatewayErrorResponse: null,
      error: null,
    },
    {
      ok: true,
      status: 'syncRequestAccepted',
      syncRequest: Object.freeze(createSyncRequest()),
      gatewayErrorResponse: null,
      error: null,
    },
    {
      ok: true,
      status: 'syncRequestAccepted',
      syncRequest: deepFreezeFixture(createSyncRequest({
        action: privateMarker,
      })),
      gatewayErrorResponse: null,
      error: null,
    },
    {
      ok: false,
      status: 'syncRequestRejected',
      syncRequest: null,
      gatewayErrorResponse: {
        fixturePrivateField: privateMarker,
      },
      error: null,
    },
  ]

  for (const malformedResult of malformedResults) {
    const boundaryProbe = createBoundaryProbe(() => malformedResult)

    await withStartedGateway({ boundaryProbe }, async ({ port }) => {
      const response = await sendHttpRequest({
        headers: buildRequestHeaders(port, 0),
        port,
      })

      assertLocalHttpResponse(response, 'gatewayFailed')
      assert.equal(response.body.toString('utf8').includes(privateMarker), false)
    })

    assert.equal(boundaryProbe.calls.length, 1)
  }
})

test('begrenzt Headerfeldzahl und rohe Headerbytes vor Decoder und Boundary', async () => {
  const boundaryProbe = createBoundaryProbe()
  const decoderProbe = createDecoderProbe()

  await withStartedGateway({
    boundaryProbe,
    createTextDecoder: decoderProbe.createTextDecoder,
  }, async ({ port }) => {
    const tooManyHeaders = []

    for (let index = 0; index < 28; index += 1) {
      tooManyHeaders.push(`X-Fixture-${index}: value`)
    }

    const countResponse = await sendRawSocketWrites(port, [
      createRawHeaderBlock(`POST ${GATEWAY_PATH} HTTP/1.1`, [
        `Host: ${LOOPBACK_HOST}:${port}`,
        `Origin: ${ALLOWED_ORIGIN}`,
        'Content-Type: application/json',
        'Content-Length: 0',
        'Connection: close',
        ...tooManyHeaders,
      ]),
    ])
    assertLocalHttpResponse(countResponse, 'requestHeadersTooLarge', {
      cors: false,
    })

    const overflowResponse = await sendRawSocketWrites(port, [
      createRawHeaderBlock(`POST ${GATEWAY_PATH} HTTP/1.1`, [
        `Host: ${LOOPBACK_HOST}:${port}`,
        `X-Oversized: ${'x'.repeat(LOCAL_SYNC_GATEWAY_HTTP_LIMITS.maxHeaderSize)}`,
        'Connection: close',
      ]),
    ])
    assertLocalHttpResponse(overflowResponse, 'requestHeadersTooLarge', {
      cors: false,
    })
  })

  assert.equal(boundaryProbe.calls.length, 0)
  assert.equal(decoderProbe.calls.create.length, 0)
})

test('schließt regelmäßig tröpfelnde unvollständige Header und Bodies innerhalb der Testdeadline plus Prüf- und Timer-Toleranz', async () => {
  const boundaryProbe = createBoundaryProbe()
  const decoderProbe = createDecoderProbe()

  await withStartedGateway({
    boundaryProbe,
    createTextDecoder: decoderProbe.createTextDecoder,
    useTestTimeoutPolicy: true,
  }, async ({ port }) => {
    const incompleteHeaders = await sendDrippingRawSocket({
      dripWrite: Buffer.from('x', 'ascii'),
      initialWrite: Buffer.from(
        [
          `POST ${GATEWAY_PATH} HTTP/1.1`,
          `Host: ${LOOPBACK_HOST}:${port}`,
          'X-Fixture: ',
        ].join('\r\n'),
        'latin1'
      ),
      port,
    })
    const headerUpperBound =
      TEST_TIMEOUT_POLICY.headersTimeoutMs +
      TEST_TIMEOUT_POLICY.connectionsCheckingIntervalMs +
      TEST_TIMER_SCHEDULING_TOLERANCE_MS

    assert.ok(incompleteHeaders.dripWriteCount >= 3)
    assert.ok(
      incompleteHeaders.elapsedMs <= headerUpperBound,
      `Header-Socket erst nach ${incompleteHeaders.elapsedMs} ms geschlossen; Obergrenze ${headerUpperBound} ms.`
    )

    const partialBody = await sendDrippingRawSocket({
      dripWrite: Buffer.from('x', 'ascii'),
      initialWrite: Buffer.concat([
        createRawHeaderBlock(`POST ${GATEWAY_PATH} HTTP/1.1`, [
          `Host: ${LOOPBACK_HOST}:${port}`,
          `Origin: ${ALLOWED_ORIGIN}`,
          'Content-Type: application/json',
          'Content-Length: 1000',
          'Connection: close',
        ]),
        Buffer.from('x', 'ascii'),
      ]),
      port,
    })
    const bodyUpperBound =
      TEST_TIMEOUT_POLICY.requestTimeoutMs +
      TEST_TIMEOUT_POLICY.connectionsCheckingIntervalMs +
      TEST_TIMER_SCHEDULING_TOLERANCE_MS

    assert.ok(partialBody.dripWriteCount >= 6)
    assert.ok(
      partialBody.elapsedMs <= bodyUpperBound,
      `Body-Socket erst nach ${partialBody.elapsedMs} ms geschlossen; Obergrenze ${bodyUpperBound} ms.`
    )
  })

  assert.equal(boundaryProbe.calls.length, 0)
  assert.equal(decoderProbe.calls.create.length, 0)
  assert.equal(decoderProbe.calls.decode.length, 0)
})

test('verwendet request.setEncoding niemals und bleibt auf normalen Pfaden Console-still', { concurrency: false }, async () => {
  const setEncodingDescriptor = Object.getOwnPropertyDescriptor(
    http.IncomingMessage.prototype,
    'setEncoding'
  )
  const originalSetEncoding = http.IncomingMessage.prototype.setEncoding
  const consoleMethods = ['log', 'info', 'warn', 'error', 'debug', 'trace']
  const consoleDescriptors = new Map(
    consoleMethods.map((methodName) => [
      methodName,
      Object.getOwnPropertyDescriptor(console, methodName),
    ])
  )
  let setEncodingCalls = 0
  const consoleCalls = []

  try {
    Object.defineProperty(http.IncomingMessage.prototype, 'setEncoding', {
      configurable: true,
      enumerable: false,
      writable: true,
      value(...args) {
        setEncodingCalls += 1
        return Reflect.apply(originalSetEncoding, this, args)
      },
    })
    for (const methodName of consoleMethods) {
      Object.defineProperty(console, methodName, {
        ...consoleDescriptors.get(methodName),
        value(...args) {
          consoleCalls.push({ args, methodName })
        },
      })
    }

    const boundaryProbe = createRealBoundaryProbe()

    await withStartedGateway({ boundaryProbe }, async ({ port }) => {
      const validBody = Buffer.from(createRawSyncRequest(), 'utf8')
      const responses = [
        await sendHttpRequest({
          bodyChunks: [validBody],
          headers: buildRequestHeaders(port, validBody.byteLength),
          port,
        }),
        await sendHttpRequest({
          headers: buildRequestHeaders(port, 0, {
            Origin: 'http://localhost:9999',
          }),
          port,
        }),
        await sendHttpRequest({
          bodyChunks: [Buffer.from('{', 'utf8')],
          headers: buildRequestHeaders(port, 1),
          port,
        }),
      ]

      assert.deepEqual(
        responses.map((response) => response.statusCode),
        [503, 403, 400]
      )
    })
  } finally {
    if (setEncodingDescriptor === undefined) {
      delete http.IncomingMessage.prototype.setEncoding
    } else {
      Object.defineProperty(
        http.IncomingMessage.prototype,
        'setEncoding',
        setEncodingDescriptor
      )
    }
    for (const methodName of consoleMethods) {
      Object.defineProperty(
        console,
        methodName,
        consoleDescriptors.get(methodName)
      )
    }
  }

  assert.equal(setEncodingCalls, 0)
  assert.deepEqual(consoleCalls, [])
})
