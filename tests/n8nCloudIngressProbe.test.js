import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { EventEmitter } from 'node:events'
import { readFileSync } from 'node:fs'
import http from 'node:http'
import { syncBuiltinESMExports } from 'node:module'
import https from 'node:https'
import net from 'node:net'
import tls from 'node:tls'
import { runInNewContext } from 'node:vm'
import {
  brotliDecompressSync,
  gunzipSync,
  inflateSync,
} from 'node:zlib'
import test from 'node:test'

import {
  N8N_CLOUD_INGRESS_PROBE_AUTHORIZATION_HEADER_PRESENCES,
  N8N_CLOUD_INGRESS_PROBE_CONTENT_ENCODING_OUTCOMES,
  N8N_CLOUD_INGRESS_PROBE_ENV,
  N8N_CLOUD_INGRESS_PROBE_GATES,
  N8N_CLOUD_INGRESS_PROBE_LIMITS,
  N8N_CLOUD_INGRESS_PROBE_STRICT_UTF8_OUTCOMES,
  N8N_CLOUD_INGRESS_PROBE_VECTOR_IDS,
  aggregateN8nCloudIngressProbeGates,
  createN8nCloudIngressEvidenceTemplate,
  createN8nCloudIngressProbe,
  getN8nCloudIngressProbeVectors,
  readN8nCloudIngressProbeRuntimeConfig,
  runN8nCloudIngressProbeCli,
  validateN8nCloudIngressEvidence,
} from '../scripts/n8n/n8nCloudIngressProbe.js'

const VALID_ENDPOINT = 'https://tenant.invalid/webhook-test/redacted-probe'
const VALID_SECRET = 'synthetic-secret-value-32-characters-minimum'
const REDACTION_SENTINEL = 'private-redaction-sentinel'

const LOCKED_VECTOR_METADATA = Object.freeze([
  ['valid-sync-test-json', 175, 'd2782eb7b3ebc5571b47951f59865d8baaad8476435752659bb643f1aebcbfcf', 'validExact'],
  ['invalid-json', 18, '364fec7ea1e2390060baf435a0270f4d9b80a14557a77928b0f9fea5e2a85841', 'validExact'],
  ['ascii', 26, '4a2c853fc24b4e89052dbf54f100ea592c1d5fcfd06082cf233f8bf5ae334d69', 'validExact'],
  ['multibyte-utf8', 25, 'df4447e4c1b8e0cf7b1a5e1ab1841bd061702a35d93f4e243a870014a4c79ad5', 'validExact'],
  ['four-byte-utf8', 21, '327653d11b0fbaf8460320d751952c6039b318ec8f1f9a641304378de766dd8f', 'validExact'],
  ['utf8-bom', 26, 'a59fc90a74d718b492a5988aae0da23b26438daee763b0daa017653dd72dd6c5', 'validExact'],
  ['unicode-nfc', 5, '73473dcc12b763085904a5279d048c4d5b3b008c46f1f32443b99de04aa83a14', 'validExact'],
  ['unicode-nfd', 6, 'c42cc7a1ca08364b6fd859fa50d2454730a8236290a423373cc630da77c6d711', 'validExact'],
  ['crlf-trailing-whitespace', 22, 'a76b24842ae247d63d2c933e94e3aed12252808e4b195f8f06dced7364261562', 'validExact'],
  ['embedded-nul', 11, 'd4aa5af26d0af5092a022557a748d6fdef3501efebcdb33008e14b11636f045f', 'validExact'],
  ['invalid-utf8-c3-28', 2, 'eddf68639913a3cb8331cdfe7f87559e0beccf2c289c0d90ac4d89b3204004f8', 'invalidRejected'],
  ['incomplete-utf8-e2-82', 2, 'eed0eb1f664e53388c1f00a4a9ba9b8da60fe792af9eb5f6f4b5ee852a91f03f', 'invalidRejected'],
  ['overlong-utf8-c0-af', 2, 'caf573f0daa6960ecb26f8eddbc4e2059277ad5afc6f72ffd59a0ecead602a22', 'invalidRejected'],
  ['isolated-utf8-continuation', 1, '76be8b528d0075f7aae98d6fa57a6d3c83ae480a8469e668d7b0af968995ac71', 'invalidRejected'],
  ['body-65535-bytes', 65_535, '51fecdc444f8748f49729feb8fb3c4fdcb84bd15b31e805c3f2280154a2489aa', 'validExact'],
  ['body-65536-bytes', 65_536, '156c38442089c1323d3e3ba549a6ac24341c47e8b6367bec4740c9b8c865826e', 'validExact'],
  ['body-65537-bytes', 65_537, 'ac72112c832fa4683b15ebff51a8f5f2ca08226c0d59bdb9ac739c2cdc28a05c', 'validExact'],
  ['multibyte-65536-bytes', 65_536, 'b2ee71c60a3af6320692121aded54971edfcc5b666b3640781d6bb23127780f1', 'validExact'],
  ['content-encoding-absent', 36, '5510572ebeb84c4caff215cae19d992b6eb46b4e834e7950f743b6ebc0684382', 'validExact'],
  ['content-encoding-identity', 36, '5510572ebeb84c4caff215cae19d992b6eb46b4e834e7950f743b6ebc0684382', 'validExact'],
  ['content-encoding-gzip', 56, 'b90bb6b478f08a8d78cc1e109944d3e7666fdc085a9ba03336522de769e840ce', 'invalidRejected'],
  ['content-encoding-deflate', 44, '5052d1562b588694b3f10a6707ea55292ee6833e9bbb2c9573b0aba4ef680288', 'invalidRejected'],
  ['content-encoding-br', 38, '9b4b9d6b99872650b7d87084f2215152f30ede851a3193337ac2bcc1e1e4262b', 'invalidRejected'],
  ['compressed-expands-65537', 98, '0cf32465b1bbda10c068a0ad100f2f5e4ac44357e1f3b2d7e1f57545913b743a', 'invalidRejected'],
  ['auth-missing', 24, '1396c6f101b7717a9a1416a498a2e89da50f6c2d389a2127b972ca8c15924290', 'validExact'],
  ['auth-wrong', 24, '1396c6f101b7717a9a1416a498a2e89da50f6c2d389a2127b972ca8c15924290', 'validExact'],
  ['auth-correct', 24, '1396c6f101b7717a9a1416a498a2e89da50f6c2d389a2127b972ca8c15924290', 'validExact'],
  ['auth-duplicate-equal', 24, '1396c6f101b7717a9a1416a498a2e89da50f6c2d389a2127b972ca8c15924290', 'validExact'],
  ['auth-duplicate-conflicting-correct-first-wrong-last', 24, '1396c6f101b7717a9a1416a498a2e89da50f6c2d389a2127b972ca8c15924290', 'validExact'],
  ['auth-duplicate-conflicting-wrong-first-correct-last', 24, '1396c6f101b7717a9a1416a498a2e89da50f6c2d389a2127b972ca8c15924290', 'validExact'],
  ['framing-content-length', 27, '5209da46c3c2b58cabc924c26edb2bd0089b6852c8a480f2f50c8cd32ebce6b2', 'validExact'],
  ['framing-chunked', 27, '5209da46c3c2b58cabc924c26edb2bd0089b6852c8a480f2f50c8cd32ebce6b2', 'validExact'],
])

const OBSERVER_OUTPUT_KEYS = Object.freeze([
  'probeId',
  'exactMatch',
  'receivedByteLength',
  'strictUtf8Outcome',
  'authorizationHeaderPresence',
  'contentEncodingOutcome',
])

function vectorMap() {
  return new Map(
    getN8nCloudIngressProbeVectors().map((vector) => [vector.probeId, vector]),
  )
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function headerValues(headers, name) {
  const values = []
  for (let index = 0; index < headers.length; index += 2) {
    if (String(headers[index]).toLowerCase() === name.toLowerCase()) {
      values.push(headers[index + 1])
    }
  }
  return values
}

function validRuntimeConfig(endpoint = VALID_ENDPOINT) {
  return Object.freeze({ endpoint, secret: VALID_SECRET })
}

function expectedContentEncoding(vector) {
  return vector.contentEncoding ?? null
}

function observerPayload(vector, overrides = {}) {
  return {
    probeId: vector.probeId,
    exactMatch: true,
    receivedByteLength: vector.expectedByteLength,
    strictUtf8Outcome: vector.expectedStrictUtf8Outcome,
    authorizationHeaderPresence: 'absent',
    contentEncodingOutcome: 'match',
    ...overrides,
  }
}

function createFakeHttpsRequest(createPlan) {
  const calls = []
  let activeRequests = 0
  let maximumActiveRequests = 0

  const requestHttps = (endpoint, options, callback) => {
    const request = new EventEmitter()
    const call = {
      endpoint,
      options,
      body: null,
      destroyCalls: 0,
      endCalls: 0,
      response: null,
    }
    calls.push(call)

    request.destroy = () => {
      call.destroyCalls += 1
    }
    request.end = (body) => {
      call.endCalls += 1
      call.body = Buffer.from(body)
      activeRequests += 1
      maximumActiveRequests = Math.max(maximumActiveRequests, activeRequests)

      queueMicrotask(() => {
        let plan
        try {
          plan = createPlan(call, calls.length - 1)
        } catch {
          activeRequests -= 1
          request.emit('error', new Error(REDACTION_SENTINEL))
          return
        }

        if (plan.kind === 'timeout') {
          activeRequests -= 1
          request.emit('timeout')
          return
        }
        if (plan.kind === 'requestError') {
          activeRequests -= 1
          request.emit('error', new Error(REDACTION_SENTINEL))
          return
        }

        const response = new EventEmitter()
        response.statusCode = plan.statusCode
        response.destroyCalls = 0
        response.destroy = () => {
          response.destroyCalls += 1
        }
        call.response = response
        callback(response)

        const chunks = plan.chunks ?? [Buffer.from(plan.body ?? '')]
        for (const chunk of chunks) response.emit('data', chunk)
        activeRequests -= 1
        if (plan.kind === 'aborted') response.emit('aborted')
        else if (plan.kind === 'responseError') {
          response.emit('error', new Error(REDACTION_SENTINEL))
        } else response.emit('end')
      })
    }
    return request
  }

  return {
    requestHttps,
    calls,
    get maximumActiveRequests() {
      return maximumActiveRequests
    },
  }
}

function createObserverTransport(createOverrides = () => ({}), statusCode = 200) {
  const vectors = vectorMap()
  return createFakeHttpsRequest((call) => {
    const probeId = headerValues(
      call.options.headers,
      'X-GoldenDawn-Probe-Id',
    )[0]
    const vector = vectors.get(probeId)
    return {
      statusCode,
      body: statusCode >= 200 && statusCode <= 299
        ? JSON.stringify(observerPayload(vector, createOverrides(vector, call)))
        : '',
    }
  })
}

async function runVector(
  probeId,
  transport,
  { endpoint = VALID_ENDPOINT, scheduleTimeout, cancelTimeout } = {},
) {
  const options = {
    requestHttps: transport.requestHttps,
    runtimeConfig: validRuntimeConfig(endpoint),
    probeId,
  }
  if (scheduleTimeout !== undefined) options.scheduleTimeout = scheduleTimeout
  if (cancelTimeout !== undefined) options.cancelTimeout = cancelTimeout
  return createN8nCloudIngressProbe(options).run()
}

function cloneTemplate() {
  return JSON.parse(JSON.stringify(createN8nCloudIngressEvidenceTemplate()))
}

function selectedEvidence(evidence, probeId) {
  return evidence.vectors.find((entry) => entry.probeId === probeId)
}

function replaceEvidenceVector(evidence, probeId, patch) {
  evidence.vectors = evidence.vectors.map((entry) =>
    entry.probeId === probeId ? { ...entry, ...patch } : entry,
  )
  return evidence
}

function applyCompleteTenantExecutionBinding(evidence) {
  Object.assign(evidence, {
    tenantAlias: 'tenant_test_01',
    observedAt: '2026-08-20T10:00:00.000Z',
    timezone: 'Europe/Berlin',
    n8nBuild: '2.35.4',
    webhookNodeTypeVersion: 2,
    secretFreeWorkflowSha256: 'a'.repeat(64),
  })
  return evidence
}

function createSuccessfulObserverVectorEvidence(
  evidenceVector,
  vector,
  observerCallCount,
  workflowExecutionCount,
) {
  return {
    ...evidenceVector,
    observedByteLength: vector.expectedByteLength,
    httpStatus: 200,
    observerCallCount,
    workflowExecutionCount,
    uniqueVectorAttribution: true,
    exactMatch: true,
    strictUtf8Outcome: vector.expectedStrictUtf8Outcome,
    authorizationHeaderPresence: 'absent',
    contentEncodingOutcome: 'match',
    gate: 'PASS',
  }
}

function createCompletePassingEvidence() {
  const evidence = applyCompleteTenantExecutionBinding(cloneTemplate())
  const vectors = vectorMap()
  evidence.vectors = evidence.vectors.map((entry) => {
    const vector = vectors.get(entry.probeId)
    if (vector.gateKind === 'authNegative') {
      return {
        ...entry,
        httpStatus: 401,
        observerCallCount: 0,
        workflowExecutionCount: 0,
        uniqueVectorAttribution: true,
        gate: 'PASS',
      }
    }
    return createSuccessfulObserverVectorEvidence(
      entry,
      vector,
      vector.gateKind === 'authCorrect' ? 1 : null,
      vector.gateKind === 'authCorrect' ? 1 : null,
    )
  })
  evidence.testUrlTenantMeasurementStatus = 'PASS'
  return evidence
}

function applyProviderPassPrerequisites(evidence) {
  evidence.executionDataSettings = {
    saveDataErrorExecution: 'none',
    saveDataSuccessExecution: 'none',
    saveManualExecutions: false,
    executionDataPruning: 'enabled',
    readTimeRedaction: 'enabled',
  }
  evidence.redactedProviderReference = 'provider-reference-redacted'
  evidence.cleanupConfirmed = true
  evidence.providerExecutionEvidenceStatus = 'PASS'
  return evidence
}

function createProviderPassEvidence() {
  const evidence = applyCompleteTenantExecutionBinding(cloneTemplate())
  const authCorrect = vectorMap().get('auth-correct')
  replaceEvidenceVector(
    evidence,
    authCorrect.probeId,
    createSuccessfulObserverVectorEvidence(
      selectedEvidence(evidence, authCorrect.probeId),
      authCorrect,
      1,
      1,
    ),
  )
  return applyProviderPassPrerequisites(evidence)
}

function captureEnvironmentDescriptors() {
  return new Map(
    Object.values(N8N_CLOUD_INGRESS_PROBE_ENV).map((propertyName) => [
      propertyName,
      Object.getOwnPropertyDescriptor(process.env, propertyName),
    ]),
  )
}

function restoreEnvironmentDescriptors(descriptors) {
  for (const [propertyName, descriptor] of descriptors) {
    if (descriptor === undefined) delete process.env[propertyName]
    else Object.defineProperty(process.env, propertyName, descriptor)
  }
}

function installValidEnvironment(endpoint = VALID_ENDPOINT) {
  process.env[N8N_CLOUD_INGRESS_PROBE_ENV.endpoint] = endpoint
  process.env[N8N_CLOUD_INGRESS_PROBE_ENV.secret] = VALID_SECRET
}

function evaluateObserver(overrides = {}) {
  const source = readFileSync(
    new URL('../scripts/n8n/n8nCloudIngressProbeObserver.js', import.meta.url),
    'utf8',
  )
  return runInNewContext(source, { TextDecoder, ...overrides })
}

function createObserverInput(probeId, headers = {}) {
  return {
    first() {
      return {
        json: {
          headers: {
            ...headers,
            'x-goldendawn-probe-id': probeId,
          },
        },
      }
    },
  }
}

async function observeVector(observer, vector, headers = {}, body = vector.body) {
  let helperCalls = 0
  const output = await observer.call({
    helpers: {
      async getBinaryDataBuffer(itemIndex, propertyName) {
        helperCalls += 1
        assert.equal(itemIndex, 0)
        assert.equal(propertyName, 'data')
        return Buffer.from(body)
      },
    },
  }, createObserverInput(vector.probeId, headers))
  return { output, helperCalls }
}

function parseRawHttpRequest(rawRequest) {
  const headEnd = rawRequest.indexOf(Buffer.from('\r\n\r\n'))
  assert.notEqual(headEnd, -1)
  const lines = rawRequest.subarray(0, headEnd).toString('latin1').split('\r\n')
  const [requestLine, ...headerLines] = lines
  const headers = headerLines.map((line) => {
    const separator = line.indexOf(':')
    assert.ok(separator > 0)
    return [line.slice(0, separator), line.slice(separator + 1).trimStart()]
  })
  const wireBody = rawRequest.subarray(headEnd + 4)
  const transferEncoding = headers.find(
    ([name]) => name.toLowerCase() === 'transfer-encoding',
  )?.[1]
  let body
  if (transferEncoding?.toLowerCase() === 'chunked') {
    const lengthEnd = wireBody.indexOf(Buffer.from('\r\n'))
    assert.notEqual(lengthEnd, -1)
    const chunkLength = Number.parseInt(
      wireBody.subarray(0, lengthEnd).toString('ascii'),
      16,
    )
    body = wireBody.subarray(lengthEnd + 2, lengthEnd + 2 + chunkLength)
    assert.equal(
      wireBody.subarray(lengthEnd + 2 + chunkLength).toString('ascii'),
      '\r\n0\r\n\r\n',
    )
  } else {
    body = wireBody
  }
  return { requestLine, headers, body }
}

function isCompleteRawHttpRequest(buffer) {
  const headEnd = buffer.indexOf(Buffer.from('\r\n\r\n'))
  if (headEnd === -1) return false
  const head = buffer.subarray(0, headEnd).toString('latin1')
  if (/\r\nTransfer-Encoding:\s*chunked\r\n/iu.test(`\r\n${head}\r\n`)) {
    return buffer.subarray(headEnd + 4).includes(Buffer.from('\r\n0\r\n\r\n'))
  }
  const match = /\r\nContent-Length:\s*(\d+)\r\n/iu.exec(`\r\n${head}\r\n`)
  return match !== null && buffer.byteLength >= headEnd + 4 + Number(match[1])
}

async function createRawLoopbackServer() {
  const rawRequests = []
  const sockets = new Set()
  const server = net.createServer((socket) => {
    sockets.add(socket)
    let received = Buffer.alloc(0)
    socket.on('close', () => sockets.delete(socket))
    socket.on('error', () => {})
    socket.on('data', (chunk) => {
      received = Buffer.concat([received, chunk])
      if (!isCompleteRawHttpRequest(received)) return
      rawRequests.push(Buffer.from(received))
      socket.end(
        'HTTP/1.1 400 Bad Request\r\nContent-Length: 0\r\nConnection: close\r\n\r\n',
      )
    })
  })
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const address = server.address()
  assert.equal(typeof address, 'object')
  assert.notEqual(address, null)
  return {
    port: address.port,
    rawRequests,
    sockets,
    server,
    async close() {
      for (const socket of sockets) socket.destroy()
      await new Promise((resolve) => server.close(resolve))
    },
  }
}

function createNodeHttpLoopbackAdapter(port) {
  const clientSockets = new Set()
  const requestHttps = (endpoint, options, callback) => {
    const url = new URL(endpoint)
    const request = http.request({
      host: '127.0.0.1',
      port,
      path: url.pathname,
      method: options.method,
      headers: options.headers,
      setHost: options.setHost,
      agent: false,
      timeout: options.timeout,
    }, callback)
    request.once('socket', (socket) => {
      clientSockets.add(socket)
      socket.once('close', () => clientSockets.delete(socket))
    })
    return request
  }
  return {
    requestHttps,
    close() {
      for (const socket of clientSockets) socket.destroy()
    },
  }
}

test('vector catalog locks exactly 32 ids, lengths, digests and UTF-8 outcomes', () => {
  const vectors = getN8nCloudIngressProbeVectors()
  assert.equal(vectors.length, 32)
  assert.deepEqual(
    N8N_CLOUD_INGRESS_PROBE_VECTOR_IDS,
    LOCKED_VECTOR_METADATA.map(([probeId]) => probeId),
  )
  assert.equal(
    N8N_CLOUD_INGRESS_PROBE_VECTOR_IDS.includes('auth-duplicate-conflicting'),
    false,
  )
  assert.deepEqual(
    vectors.map((vector) => [
      vector.probeId,
      vector.expectedByteLength,
      vector.expectedSha256,
      vector.expectedStrictUtf8Outcome,
    ]),
    LOCKED_VECTOR_METADATA,
  )
  for (const vector of vectors) {
    assert.deepEqual(Object.keys(vector), [
      'probeId',
      'body',
      'expectedByteLength',
      'expectedSha256',
      'expectedStrictUtf8Outcome',
      'contentEncoding',
      'authMode',
      'framing',
      'gateKind',
    ])
    assert.equal(vector.body.byteLength, vector.expectedByteLength)
    assert.equal(sha256(vector.body), vector.expectedSha256)
    assert.ok(Object.isFrozen(vector))
  }
  assert.deepEqual(N8N_CLOUD_INGRESS_PROBE_GATES, ['PASS', 'FAIL', 'UNPROVEN'])
  assert.deepEqual(N8N_CLOUD_INGRESS_PROBE_STRICT_UTF8_OUTCOMES, [
    'validExact',
    'invalidRejected',
    'validMismatch',
    'invalidAccepted',
    'unavailable',
  ])
  assert.deepEqual(N8N_CLOUD_INGRESS_PROBE_AUTHORIZATION_HEADER_PRESENCES, [
    'absent',
    'present',
    'unavailable',
  ])
  assert.deepEqual(N8N_CLOUD_INGRESS_PROBE_CONTENT_ENCODING_OUTCOMES, [
    'match',
    'mismatch',
    'unavailable',
  ])
})

test('isolated vector bodies share only the intentional byte fixtures', () => {
  const first = vectorMap()
  const second = vectorMap()
  for (const probeId of N8N_CLOUD_INGRESS_PROBE_VECTOR_IDS) {
    assert.notStrictEqual(first.get(probeId).body, second.get(probeId).body)
    assert.deepEqual(first.get(probeId).body, second.get(probeId).body)
  }

  const authIds = [
    'auth-missing',
    'auth-wrong',
    'auth-correct',
    'auth-duplicate-equal',
    'auth-duplicate-conflicting-correct-first-wrong-last',
    'auth-duplicate-conflicting-wrong-first-correct-last',
  ]
  for (const probeId of authIds.slice(1)) {
    assert.deepEqual(first.get(probeId).body, first.get(authIds[0]).body)
  }
  assert.deepEqual(
    first.get('content-encoding-absent').body,
    first.get('content-encoding-identity').body,
  )
  assert.deepEqual(
    first.get('framing-content-length').body,
    first.get('framing-chunked').body,
  )

  const body65535 = first.get('body-65535-bytes').body
  const body65536 = first.get('body-65536-bytes').body
  const body65537 = first.get('body-65537-bytes').body
  assert.ok(body65535.every((byte) => byte === 0x41))
  assert.ok(body65536.every((byte) => byte === 0x41))
  assert.ok(body65537.every((byte) => byte === 0x41))
  assert.deepEqual(body65536.subarray(0, body65535.length), body65535)
  assert.deepEqual(body65537.subarray(0, body65536.length), body65536)
})

test('gzip, deflate and Brotli wire fixtures decode locally to one sentinel', () => {
  const vectors = vectorMap()
  const expected = 'GoldenDawn-content-encoding-probe-v1'
  assert.equal(
    gunzipSync(vectors.get('content-encoding-gzip').body).toString('utf8'),
    expected,
  )
  assert.equal(
    inflateSync(vectors.get('content-encoding-deflate').body).toString('utf8'),
    expected,
  )
  assert.equal(
    brotliDecompressSync(vectors.get('content-encoding-br').body).toString('utf8'),
    expected,
  )
  assert.equal(
    gunzipSync(vectors.get('compressed-expands-65537').body).byteLength,
    65_537,
  )
})

test('standalone observer is inert and has 32-vector parity with one helper call', async () => {
  const observer = evaluateObserver()
  assert.equal(typeof observer, 'function')
  const vectors = getN8nCloudIngressProbeVectors()
  for (const vector of vectors) {
    const headers = vector.contentEncoding === null
      ? {}
      : { 'content-encoding': expectedContentEncoding(vector) }
    const { output, helperCalls } = await observeVector(
      observer,
      vector,
      headers,
    )
    assert.equal(helperCalls, 1)
    const normalized = JSON.parse(JSON.stringify(output))
    assert.equal(normalized.length, 1)
    assert.deepEqual(Object.keys(normalized[0]), ['json'])
    assert.deepEqual(Object.keys(normalized[0].json), OBSERVER_OUTPUT_KEYS)
    assert.deepEqual(normalized[0].json, {
      probeId: vector.probeId,
      exactMatch: true,
      receivedByteLength: vector.expectedByteLength,
      strictUtf8Outcome: vector.expectedStrictUtf8Outcome,
      authorizationHeaderPresence: 'absent',
      contentEncodingOutcome: 'match',
    })
  }
})

test('observer inspects Authorization descriptors without reading values or getters', async () => {
  const observer = evaluateObserver()
  const vector = vectorMap().get('auth-correct')
  let propertyGets = 0
  const headerTarget = {
    'x-goldendawn-probe-id': vector.probeId,
    authorization: REDACTION_SENTINEL,
  }
  const headers = new Proxy(headerTarget, {
    get() {
      propertyGets += 1
      throw new Error(REDACTION_SENTINEL)
    },
  })
  let helperCalls = 0
  const presentOutput = await observer.call({
    helpers: {
      async getBinaryDataBuffer() {
        helperCalls += 1
        return Buffer.from(vector.body)
      },
    },
  }, {
    first() {
      return { json: { headers } }
    },
  })
  assert.equal(helperCalls, 1)
  assert.equal(propertyGets, 0)
  assert.equal(presentOutput[0].json.authorizationHeaderPresence, 'present')
  assert.doesNotMatch(JSON.stringify(presentOutput), /private-redaction-sentinel/u)

  let getterCalls = 0
  const accessorHeaders = {
    'x-goldendawn-probe-id': vector.probeId,
  }
  Object.defineProperty(accessorHeaders, 'authorization', {
    enumerable: true,
    get() {
      getterCalls += 1
      throw new Error(REDACTION_SENTINEL)
    },
  })
  const unavailable = await observer.call({
    helpers: {
      async getBinaryDataBuffer() {
        return Buffer.from(vector.body)
      },
    },
  }, {
    first() {
      return { json: { headers: accessorHeaders } }
    },
  })
  assert.equal(getterCalls, 0)
  assert.equal(unavailable[0].json.authorizationHeaderPresence, 'unavailable')

  const absent = await observeVector(observer, vector)
  assert.equal(absent.output[0].json.authorizationHeaderPresence, 'absent')
})

test('observer reports content-encoding match, mismatch, unavailable and decompression contradiction', async () => {
  const observer = evaluateObserver()
  const vectors = vectorMap()
  const identity = vectors.get('content-encoding-identity')
  const matched = await observeVector(
    observer,
    identity,
    { 'content-encoding': 'identity' },
  )
  assert.equal(matched.output[0].json.contentEncodingOutcome, 'match')
  const mismatched = await observeVector(
    observer,
    identity,
    { 'content-encoding': 'gzip' },
  )
  assert.equal(mismatched.output[0].json.contentEncodingOutcome, 'mismatch')

  let encodingGetterCalls = 0
  const accessorHeaders = {
    'x-goldendawn-probe-id': identity.probeId,
  }
  Object.defineProperty(accessorHeaders, 'content-encoding', {
    enumerable: true,
    get() {
      encodingGetterCalls += 1
      throw new Error(REDACTION_SENTINEL)
    },
  })
  const unavailable = await observer.call({
    helpers: {
      async getBinaryDataBuffer() {
        return Buffer.from(identity.body)
      },
    },
  }, {
    first() {
      return { json: { headers: accessorHeaders } }
    },
  })
  assert.equal(encodingGetterCalls, 0)
  assert.equal(unavailable[0].json.contentEncodingOutcome, 'unavailable')

  const gzip = vectors.get('content-encoding-gzip')
  const decompressed = await observeVector(
    observer,
    gzip,
    { 'content-encoding': 'gzip' },
    gunzipSync(gzip.body),
  )
  assert.deepEqual(
    JSON.parse(JSON.stringify(decompressed.output[0].json)),
    {
      probeId: gzip.probeId,
      exactMatch: false,
      receivedByteLength: 36,
      strictUtf8Outcome: 'invalidAccepted',
      authorizationHeaderPresence: 'absent',
      contentEncodingOutcome: 'match',
    },
  )
})

test('observer rejects unknown context and helper failures with one static message', async () => {
  const observer = evaluateObserver()
  const context = {
    helpers: {
      async getBinaryDataBuffer() {
        throw new Error(REDACTION_SENTINEL)
      },
    },
  }
  await assert.rejects(
    observer.call(context, createObserverInput('unknown-private-id')),
    {
      message: 'Der n8n-Ingress-Probe-Observer konnte nicht sicher ausgeführt werden.',
    },
  )
  await assert.rejects(
    observer.call(context, createObserverInput('ascii')),
    {
      message: 'Der n8n-Ingress-Probe-Observer konnte nicht sicher ausgeführt werden.',
    },
  )
})

test('runtime config reads only two named process.env descriptors and redacts hostile proxies', { concurrency: false }, () => {
  const originalEnvironment = process.env
  const descriptorReads = []
  let propertyReads = 0
  let enumerations = 0
  try {
    const environment = new Proxy(Object.create(null), {
      getOwnPropertyDescriptor(_target, propertyName) {
        descriptorReads.push(propertyName)
        if (propertyName === N8N_CLOUD_INGRESS_PROBE_ENV.endpoint) {
          return {
            value: VALID_ENDPOINT,
            enumerable: true,
            configurable: true,
            writable: true,
          }
        }
        if (propertyName === N8N_CLOUD_INGRESS_PROBE_ENV.secret) {
          return {
            value: VALID_SECRET,
            enumerable: true,
            configurable: true,
            writable: true,
          }
        }
        return undefined
      },
      get() {
        propertyReads += 1
        throw new Error(REDACTION_SENTINEL)
      },
      ownKeys() {
        enumerations += 1
        throw new Error(REDACTION_SENTINEL)
      },
    })
    process.env = environment
    assert.deepEqual(readN8nCloudIngressProbeRuntimeConfig(), {
      ok: true,
      config: {
        endpoint: VALID_ENDPOINT,
        secret: VALID_SECRET,
      },
    })
    assert.deepEqual(descriptorReads, [
      N8N_CLOUD_INGRESS_PROBE_ENV.endpoint,
      N8N_CLOUD_INGRESS_PROBE_ENV.secret,
    ])
    assert.equal(propertyReads, 0)
    assert.equal(enumerations, 0)

    const revocable = Proxy.revocable(Object.create(null), {})
    revocable.revoke()
    process.env = revocable.proxy
    const revokedResult = readN8nCloudIngressProbeRuntimeConfig()
    assert.deepEqual(revokedResult, {
      ok: false,
      error: {
        code: 'invalidRuntimeConfig',
        message: 'Die n8n-Cloud-Probe-Konfiguration ist ungültig.',
      },
    })
    assert.doesNotMatch(JSON.stringify(revokedResult), /private-redaction-sentinel/u)
  } finally {
    process.env = originalEnvironment
  }
  assert.strictEqual(process.env, originalEnvironment)
})

test('actual process.env is read serially and restored exactly without transport resolution', { concurrency: false }, async () => {
  const before = captureEnvironmentDescriptors()
  let resolverCalls = 0
  try {
    installValidEnvironment()
    const runtime = readN8nCloudIngressProbeRuntimeConfig()
    assert.equal(runtime.ok, true)
    assert.deepEqual(runtime.config, validRuntimeConfig())
    const exitCode = await runN8nCloudIngressProbeCli({
      args: ['--run', '--vector', 'not-an-allowlisted-id'],
      resolveHttpsRequest: async () => {
        resolverCalls += 1
        throw new Error('must-not-resolve')
      },
      stdout: { write() {} },
      stderr: { write() {} },
    })
    assert.equal(exitCode, 1)
    assert.equal(resolverCalls, 0)
  } finally {
    restoreEnvironmentDescriptors(before)
  }
  for (const [propertyName, descriptor] of before) {
    assert.deepEqual(
      Object.getOwnPropertyDescriptor(process.env, propertyName),
      descriptor,
    )
  }
})

test('runtime endpoint requires a canonical safe /webhook-test/ path before transport resolution', { concurrency: false }, async () => {
  const before = captureEnvironmentDescriptors()
  try {
    process.env[N8N_CLOUD_INGRESS_PROBE_ENV.secret] = VALID_SECRET
    const invalidEndpoints = [
      'http://tenant.invalid/webhook-test/probe',
      'https://tenant.invalid/webhook/probe',
      'https://tenant.invalid/production-webhook/probe',
      'https://tenant.invalid/WEBHOOK-TEST/probe',
      'https://tenant.invalid/Webhook-Test/probe',
      'https://tenant.invalid/webhook-Test/probe',
      'https://tenant.invalid/webhook-test/',
      'https://tenant.invalid/other/webhook-test/probe',
      'https://user@tenant.invalid/webhook-test/probe',
      'https://@tenant.invalid/webhook-test/probe',
      'https://%65xample.com/webhook-test/probe',
      'https://example%2ecom/webhook-test/probe',
      'https://example%2Ecom/webhook-test/probe',
      'https://%31%32%37.0.0.1/webhook-test/probe',
      'https://tenant.invalid/webhook-test/probe?private=value',
      'https://tenant.invalid/webhook-test/probe#private',
      'https://tenant.invalid/webhook-test/probe\n',
      'https://tenant.invalid/webhook-test/%2fwebhook/prod',
      'https://tenant.invalid/webhook-test/%2Fwebhook/prod',
      'https://tenant.invalid/webhook-test/%5cwebhook/prod',
      'https://tenant.invalid/webhook-test/%5Cwebhook/prod',
      'https://tenant.invalid/webhook-test/%2e%2e/webhook/prod',
      'https://tenant.invalid/webhook-test/.%2e/webhook/prod',
      'https://tenant.invalid/webhook-test/%2e./webhook/prod',
      'https://tenant.invalid/webhook-test/%2e%2e%2fwebhook/prod',
      'https://tenant.invalid/webhook-test/%252fwebhook/prod',
      'https://tenant.invalid/webhook-test/%252e%252e/webhook/prod',
      'https://tenant.invalid/webhook-test/%70robe',
      'https://tenant.invalid/webhook-test/%00',
      'https://tenant.invalid/webhook-test/probe\\child',
      'https://tenant.invalid\\webhook-test\\probe',
      'https://tenant.invalid/webhook-test//probe',
      'https://tenant.invalid/webhook-test/probe/',
      'https://tenant.invalid/webhook-test/./probe',
      'https://tenant.invalid/webhook-test/../webhook/prod',
      'https://tenant.invalid/webhook-test/safe/../probe',
    ]
    for (const endpoint of invalidEndpoints) {
      process.env[N8N_CLOUD_INGRESS_PROBE_ENV.endpoint] = endpoint
      const result = readN8nCloudIngressProbeRuntimeConfig()
      assert.deepEqual(result, {
        ok: false,
        error: {
          code: 'invalidRuntimeConfig',
          message: 'Die n8n-Cloud-Probe-Konfiguration ist ungültig.',
        },
      }, endpoint)
      assert.doesNotMatch(JSON.stringify(result), /tenant\.invalid|private=value/u)

      let resolverCalls = 0
      let transportCalls = 0
      const stderr = []
      const exitCode = await runN8nCloudIngressProbeCli({
        args: ['--run', '--vector', 'ascii'],
        resolveHttpsRequest: async () => {
          resolverCalls += 1
          return () => {
            transportCalls += 1
            throw new Error('must-not-transport')
          }
        },
        stdout: { write() {} },
        stderr: { write(value) { stderr.push(value) } },
      })
      assert.equal(exitCode, 1, endpoint)
      assert.equal(resolverCalls, 0, endpoint)
      assert.equal(transportCalls, 0, endpoint)
      assert.deepEqual(stderr, [
        'Die n8n-Cloud-Probe-Konfiguration ist ungültig.\n',
      ], endpoint)
    }
    for (const endpoint of [
      'https://tenant.invalid/webhook-test/probe',
      'HTTPS://tenant.invalid/webhook-test/probe',
      'https://tenant.invalid/webhook-test/team_1/probe-2/ABC123',
      'https://tenant.invalid:8443/webhook-test/probe',
      'https://[2001:db8::1]:8443/webhook-test/probe',
    ]) {
      process.env[N8N_CLOUD_INGRESS_PROBE_ENV.endpoint] = endpoint
      assert.equal(readN8nCloudIngressProbeRuntimeConfig().ok, true, endpoint)
    }
  } finally {
    restoreEnvironmentDescriptors(before)
  }
})

test('factory requires explicit transport, is one-shot and keeps wrong credentials distinct', async () => {
  assert.throws(
    () => createN8nCloudIngressProbe({
      runtimeConfig: validRuntimeConfig(),
      probeId: 'ascii',
    }),
    /invalidN8nCloudIngressProbeDependencies/u,
  )
  const transport = createObserverTransport()
  const probe = createN8nCloudIngressProbe({
    requestHttps: transport.requestHttps,
    runtimeConfig: validRuntimeConfig(),
    probeId: 'ascii',
  })
  const first = await probe.run()
  const second = await probe.run()
  assert.equal(first.ok, true)
  assert.equal(first.vectorGate, 'PASS')
  assert.deepEqual(second, {
    ok: false,
    error: {
      code: 'probeFailed',
      message: 'Die n8n-Cloud-Probe wurde statisch redigiert abgebrochen.',
    },
  })
  assert.equal(transport.calls.length, 1)

  const collisionSecret = 'goldendawn-invalid-probe-credential'
  const collisionTransport = createFakeHttpsRequest(() => ({ statusCode: 403 }))
  const collisionProbe = createN8nCloudIngressProbe({
    requestHttps: collisionTransport.requestHttps,
    runtimeConfig: {
      endpoint: VALID_ENDPOINT,
      secret: collisionSecret,
    },
    probeId: 'auth-wrong',
  })
  const collisionResult = await collisionProbe.run()
  assert.equal(collisionResult.ok, true)
  assert.deepEqual(
    headerValues(collisionTransport.calls[0].options.headers, 'Authorization'),
    ['Bearer goldendawn-alternate-invalid-probe-credential'],
  )
  assert.notEqual(
    headerValues(collisionTransport.calls[0].options.headers, 'Authorization')[0],
    `Bearer ${collisionSecret}`,
  )
})

test('CLI accepts exactly --run --vector allowlisted-id and resolves one transport once', { concurrency: false }, async () => {
  const before = captureEnvironmentDescriptors()
  try {
    installValidEnvironment()
    for (const args of [
      [],
      ['--run'],
      ['--vector', 'ascii'],
      ['--run', '--vector'],
      ['--run', '--vector', 'unknown-id'],
      ['--run', '--vector', 'ascii', 'extra'],
      ['--vector', 'ascii', '--run'],
    ]) {
      let resolverCalls = 0
      const exitCode = await runN8nCloudIngressProbeCli({
        args,
        resolveHttpsRequest: async () => {
          resolverCalls += 1
          throw new Error('must-not-resolve')
        },
        stdout: { write() {} },
        stderr: { write() {} },
      })
      assert.equal(exitCode, 1)
      assert.equal(resolverCalls, 0)
    }

    delete process.env[N8N_CLOUD_INGRESS_PROBE_ENV.secret]
    let invalidConfigResolverCalls = 0
    const invalidConfigExit = await runN8nCloudIngressProbeCli({
      args: ['--run', '--vector', 'ascii'],
      resolveHttpsRequest: async () => {
        invalidConfigResolverCalls += 1
        throw new Error('must-not-resolve')
      },
      stdout: { write() {} },
      stderr: { write() {} },
    })
    assert.equal(invalidConfigExit, 1)
    assert.equal(invalidConfigResolverCalls, 0)

    installValidEnvironment()
    const transport = createObserverTransport()
    let resolverCalls = 0
    const stdout = []
    const stderr = []
    const exitCode = await runN8nCloudIngressProbeCli({
      args: ['--run', '--vector', 'ascii'],
      resolveHttpsRequest: async () => {
        resolverCalls += 1
        return transport.requestHttps
      },
      stdout: { write(value) { stdout.push(value) } },
      stderr: { write(value) { stderr.push(value) } },
    })
    assert.equal(exitCode, 0)
    assert.equal(resolverCalls, 1)
    assert.equal(transport.calls.length, 1)
    assert.equal(stdout.length, 1)
    assert.equal(stderr.length, 0)
    assert.equal(JSON.parse(stdout[0]).vectorGate, 'PASS')
    assert.doesNotMatch(
      `${stdout.join('')} ${stderr.join('')}`,
      /tenant\.invalid|synthetic-secret|Authorization|Bearer/u,
    )
  } finally {
    restoreEnvironmentDescriptors(before)
  }
})

test('redirect, request and absolute timeouts, and oversized valid responses never retry', async () => {
  const earlyTerminalCases = [
    createFakeHttpsRequest(() => ({ statusCode: 302, body: REDACTION_SENTINEL })),
    createFakeHttpsRequest(() => ({ kind: 'timeout' })),
  ]
  for (const transport of earlyTerminalCases) {
    const probe = createN8nCloudIngressProbe({
      requestHttps: transport.requestHttps,
      runtimeConfig: validRuntimeConfig(),
      probeId: 'ascii',
    })
    const result = await probe.run()
    const repeated = await probe.run()
    assert.equal(result.ok, true)
    assert.deepEqual(repeated, {
      ok: false,
      error: {
        code: 'probeFailed',
        message: 'Die n8n-Cloud-Probe wurde statisch redigiert abgebrochen.',
      },
    })
    assert.equal(transport.calls.length, 1)
    assert.equal(transport.calls[0].endCalls, 1)
    assert.equal(transport.calls[0].options.timeout, 5_000)
    assert.doesNotMatch(JSON.stringify(result), /private-redaction-sentinel/u)
  }

  const ascii = vectorMap().get('ascii')
  const observerJson = Buffer.from(
    JSON.stringify(observerPayload(ascii)),
    'utf8',
  )
  assert.ok(
    observerJson.byteLength < N8N_CLOUD_INGRESS_PROBE_LIMITS.responseBytes,
  )
  const maximumObserverBody = Buffer.concat([
    observerJson,
    Buffer.alloc(
      N8N_CLOUD_INGRESS_PROBE_LIMITS.responseBytes - observerJson.byteLength,
      0x20,
    ),
  ])
  assert.equal(
    maximumObserverBody.byteLength,
    N8N_CLOUD_INGRESS_PROBE_LIMITS.responseBytes,
  )
  assert.deepEqual(
    JSON.parse(maximumObserverBody.toString('utf8')),
    observerPayload(ascii),
  )
  const maximumTransport = createFakeHttpsRequest(() => ({
    statusCode: 200,
    chunks: [
      maximumObserverBody.subarray(
        0,
        N8N_CLOUD_INGRESS_PROBE_LIMITS.responseBytes - 1,
      ),
      maximumObserverBody.subarray(
        N8N_CLOUD_INGRESS_PROBE_LIMITS.responseBytes - 1,
      ),
    ],
  }))
  const maximumProbe = createN8nCloudIngressProbe({
    requestHttps: maximumTransport.requestHttps,
    runtimeConfig: validRuntimeConfig(),
    probeId: ascii.probeId,
  })
  const maximumResult = await maximumProbe.run()
  assert.equal(maximumResult.ok, true)
  assert.equal(maximumResult.vectorGate, 'PASS')
  assert.equal(
    selectedEvidence(
      maximumResult.evidence,
      ascii.probeId,
    ).uniqueVectorAttribution,
    true,
  )
  assert.equal(maximumTransport.calls.length, 1)
  assert.equal(maximumTransport.calls[0].endCalls, 1)
  assert.equal(maximumTransport.calls[0].destroyCalls, 0)
  assert.equal(maximumTransport.calls[0].response.destroyCalls, 0)
  assert.equal((await maximumProbe.run()).ok, false)
  assert.equal(maximumTransport.calls.length, 1)
  assert.equal(maximumTransport.calls[0].endCalls, 1)
  assert.equal(maximumTransport.calls[0].destroyCalls, 0)
  assert.equal(maximumTransport.calls[0].response.destroyCalls, 0)

  const oversizedObserverBody = Buffer.concat([
    observerJson,
    Buffer.alloc(
      N8N_CLOUD_INGRESS_PROBE_LIMITS.responseBytes + 1 - observerJson.byteLength,
      0x20,
    ),
  ])
  assert.equal(
    oversizedObserverBody.byteLength,
    N8N_CLOUD_INGRESS_PROBE_LIMITS.responseBytes + 1,
  )
  assert.deepEqual(
    JSON.parse(oversizedObserverBody.toString('utf8')),
    observerPayload(ascii),
  )
  const oversizedTransport = createFakeHttpsRequest(() => ({
    statusCode: 200,
    chunks: [
      oversizedObserverBody.subarray(
        0,
        N8N_CLOUD_INGRESS_PROBE_LIMITS.responseBytes,
      ),
      oversizedObserverBody.subarray(
        N8N_CLOUD_INGRESS_PROBE_LIMITS.responseBytes,
      ),
    ],
  }))
  const oversizedProbe = createN8nCloudIngressProbe({
    requestHttps: oversizedTransport.requestHttps,
    runtimeConfig: validRuntimeConfig(),
    probeId: ascii.probeId,
  })
  const oversizedResult = await oversizedProbe.run()
  assert.equal(oversizedResult.ok, true)
  assert.equal(oversizedResult.vectorGate, 'UNPROVEN')
  assert.equal(
    selectedEvidence(oversizedResult.evidence, ascii.probeId).httpStatus,
    200,
  )
  assert.equal(
    selectedEvidence(
      oversizedResult.evidence,
      ascii.probeId,
    ).uniqueVectorAttribution,
    null,
  )
  assert.equal(oversizedTransport.calls.length, 1)
  assert.equal(oversizedTransport.calls[0].endCalls, 1)
  assert.equal(oversizedTransport.calls[0].destroyCalls, 1)
  assert.equal(oversizedTransport.calls[0].response.destroyCalls, 1)
  assert.equal((await oversizedProbe.run()).ok, false)
  assert.equal(oversizedTransport.calls.length, 1)

  const deadlineTransport = createObserverTransport()
  let deadlineCallback = null
  let scheduleCalls = 0
  let unrefCalls = 0
  const cancelledHandles = []
  const deadlineHandle = {
    unref() {
      unrefCalls += 1
    },
  }
  const deadlineProbe = createN8nCloudIngressProbe({
    requestHttps: deadlineTransport.requestHttps,
    runtimeConfig: validRuntimeConfig(),
    probeId: ascii.probeId,
    scheduleTimeout(callback, delayMs) {
      scheduleCalls += 1
      deadlineCallback = callback
      assert.equal(delayMs, N8N_CLOUD_INGRESS_PROBE_LIMITS.timeoutMs)
      return deadlineHandle
    },
    cancelTimeout(handle) {
      cancelledHandles.push(handle)
    },
  })
  const pendingDeadlineResult = deadlineProbe.run()
  assert.equal(scheduleCalls, 1)
  assert.equal(typeof deadlineCallback, 'function')
  assert.equal(unrefCalls, 1)
  assert.equal(deadlineTransport.calls.length, 1)
  assert.equal(deadlineTransport.calls[0].endCalls, 1)
  deadlineCallback()
  const deadlineResult = await pendingDeadlineResult
  assert.equal(deadlineResult.ok, true)
  assert.equal(deadlineResult.vectorGate, 'UNPROVEN')
  assert.equal(
    selectedEvidence(deadlineResult.evidence, ascii.probeId).httpStatus,
    null,
  )
  assert.equal(deadlineTransport.calls[0].destroyCalls, 1)
  assert.deepEqual(cancelledHandles, [deadlineHandle])
  assert.equal((await deadlineProbe.run()).ok, false)
  assert.equal(deadlineTransport.calls.length, 1)
  assert.equal(deadlineTransport.calls[0].endCalls, 1)
  assert.deepEqual(cancelledHandles, [deadlineHandle])
})

test('request Host is emitted exactly once from URL.host for default, custom and IPv6 ports', async () => {
  for (const [endpoint, expectedHost] of [
    ['https://tenant.invalid:443/webhook-test/probe', 'tenant.invalid'],
    ['https://tenant.invalid:8443/webhook-test/probe', 'tenant.invalid:8443'],
    ['https://[2001:db8::1]:8443/webhook-test/probe', '[2001:db8::1]:8443'],
  ]) {
    const transport = createFakeHttpsRequest(() => ({ statusCode: 400 }))
    await runVector('ascii', transport, { endpoint })
    assert.equal(transport.calls.length, 1)
    assert.deepEqual(
      headerValues(transport.calls[0].options.headers, 'Host'),
      [expectedHost],
    )
    assert.equal(transport.calls[0].options.setHost, false)
  }
})

test('Node HTTP loopback wire preserves target, Host, duplicate auth order, framing and body bytes', { concurrency: false }, async () => {
  const loopback = await createRawLoopbackServer()
  const adapter = createNodeHttpLoopbackAdapter(loopback.port)
  const endpoint = 'https://synthetic.invalid/webhook-test/wire-evidence'
  const probeIds = [
    'auth-duplicate-conflicting-correct-first-wrong-last',
    'auth-duplicate-conflicting-wrong-first-correct-last',
    'framing-content-length',
    'framing-chunked',
  ]
  try {
    for (const probeId of probeIds) {
      const result = await runVector(probeId, adapter, { endpoint })
      assert.equal(result.ok, true)
    }
    assert.equal(loopback.rawRequests.length, probeIds.length)
    const parsedById = new Map(loopback.rawRequests.map((rawRequest) => {
      const parsed = parseRawHttpRequest(rawRequest)
      const probeId = parsed.headers.find(
        ([name]) => name.toLowerCase() === 'x-goldendawn-probe-id',
      )?.[1]
      return [probeId, parsed]
    }))
    const vectors = vectorMap()
    for (const probeId of probeIds) {
      const parsed = parsedById.get(probeId)
      assert.equal(parsed.requestLine, 'POST /webhook-test/wire-evidence HTTP/1.1')
      assert.deepEqual(
        parsed.headers.filter(([name]) => name.toLowerCase() === 'host'),
        [['Host', 'synthetic.invalid']],
      )
      assert.deepEqual(parsed.body, vectors.get(probeId).body)
    }
    const correct = `Bearer ${VALID_SECRET}`
    const wrong = 'Bearer goldendawn-invalid-probe-credential'
    assert.deepEqual(
      parsedById.get(
        'auth-duplicate-conflicting-correct-first-wrong-last',
      ).headers.filter(([name]) => name.toLowerCase() === 'authorization')
        .map(([, value]) => value),
      [correct, wrong],
    )
    assert.deepEqual(
      parsedById.get(
        'auth-duplicate-conflicting-wrong-first-correct-last',
      ).headers.filter(([name]) => name.toLowerCase() === 'authorization')
        .map(([, value]) => value),
      [wrong, correct],
    )
    const contentLength = parsedById.get('framing-content-length').headers
    assert.deepEqual(
      contentLength.filter(([name]) => name.toLowerCase() === 'content-length'),
      [['Content-Length', '27']],
    )
    assert.equal(
      contentLength.some(([name]) => name.toLowerCase() === 'transfer-encoding'),
      false,
    )
    const chunked = parsedById.get('framing-chunked').headers
    assert.deepEqual(
      chunked.filter(([name]) => name.toLowerCase() === 'transfer-encoding'),
      [['Transfer-Encoding', 'chunked']],
    )
    assert.equal(
      chunked.some(([name]) => name.toLowerCase() === 'content-length'),
      false,
    )
  } finally {
    adapter.close()
    await loopback.close()
  }
})

test('negative authentication vectors fail on 2xx and rejection alone remains UNPROVEN', async () => {
  const negativeIds = [
    'auth-missing',
    'auth-wrong',
    'auth-duplicate-equal',
    'auth-duplicate-conflicting-correct-first-wrong-last',
    'auth-duplicate-conflicting-wrong-first-correct-last',
  ]
  for (const probeId of negativeIds) {
    const accepted = await runVector(probeId, createObserverTransport())
    assert.equal(accepted.vectorGate, 'FAIL', probeId)
    assert.equal(
      selectedEvidence(accepted.evidence, probeId).gate,
      'FAIL',
      probeId,
    )
  }
  for (const statusCode of [400, 401, 403]) {
    const rejected = await runVector(
      'auth-missing',
      createFakeHttpsRequest(() => ({ statusCode })),
    )
    assert.equal(rejected.vectorGate, 'UNPROVEN')
    assert.equal(
      selectedEvidence(rejected.evidence, 'auth-missing').gate,
      'UNPROVEN',
    )
  }
})

test('negative authentication PASS requires zero calls and unique attribution', async () => {
  const rejected = await runVector(
    'auth-missing',
    createFakeHttpsRequest(() => ({ statusCode: 401 })),
  )
  const completed = JSON.parse(JSON.stringify(rejected.evidence))
  replaceEvidenceVector(completed, 'auth-missing', {
    observerCallCount: 0,
    workflowExecutionCount: 0,
    uniqueVectorAttribution: true,
    gate: 'PASS',
  })
  assert.deepEqual(validateN8nCloudIngressEvidence(completed), {
    ok: true,
    errors: [],
  })
  assert.equal(completed.testUrlTenantMeasurementStatus, 'UNPROVEN')

  const ambiguous = JSON.parse(JSON.stringify(completed))
  replaceEvidenceVector(ambiguous, 'auth-missing', {
    observerCallCount: 1,
    gate: 'PASS',
  })
  const validation = validateN8nCloudIngressEvidence(ambiguous)
  assert.equal(validation.ok, false)
  assert.ok(validation.errors.includes('inconsistentVectorGate'))
})

test('correct authentication requires one attributed execution and stripped header', async () => {
  const withoutCounts = await runVector(
    'auth-correct',
    createObserverTransport(() => ({ authorizationHeaderPresence: 'absent' })),
  )
  assert.equal(withoutCounts.vectorGate, 'UNPROVEN')

  const completed = JSON.parse(JSON.stringify(withoutCounts.evidence))
  replaceEvidenceVector(completed, 'auth-correct', {
    observerCallCount: 1,
    workflowExecutionCount: 1,
    uniqueVectorAttribution: true,
    gate: 'PASS',
  })
  assert.deepEqual(validateN8nCloudIngressEvidence(completed), {
    ok: true,
    errors: [],
  })

  const present = await runVector(
    'auth-correct',
    createObserverTransport(() => ({ authorizationHeaderPresence: 'present' })),
  )
  assert.equal(present.vectorGate, 'FAIL')
  assert.equal(present.evidence.providerExecutionEvidenceStatus, 'FAIL')
  assert.equal(validateN8nCloudIngressEvidence(present.evidence).ok, true)

  const unavailable = await runVector(
    'auth-correct',
    createObserverTransport(() => ({ authorizationHeaderPresence: 'unavailable' })),
  )
  assert.equal(unavailable.vectorGate, 'UNPROVEN')

  const nullHeader = JSON.parse(JSON.stringify(completed))
  replaceEvidenceVector(nullHeader, 'auth-correct', {
    authorizationHeaderPresence: null,
    gate: 'UNPROVEN',
  })
  assert.deepEqual(validateN8nCloudIngressEvidence(nullHeader), {
    ok: true,
    errors: [],
  })

  for (const statusCode of [401, 500]) {
    for (const authorizationHeaderPresence of [
      'present',
      'absent',
      null,
      'unavailable',
    ]) {
      const expectedVectorGate = authorizationHeaderPresence === 'present'
        ? 'FAIL'
        : 'UNPROVEN'
      const nonSuccess = applyCompleteTenantExecutionBinding(
        JSON.parse(JSON.stringify(completed)),
      )
      replaceEvidenceVector(nonSuccess, 'auth-correct', {
        httpStatus: statusCode,
        authorizationHeaderPresence,
        gate: expectedVectorGate,
      })
      nonSuccess.testUrlTenantMeasurementStatus = expectedVectorGate === 'FAIL'
        ? 'FAIL'
        : 'UNPROVEN'
      nonSuccess.providerExecutionEvidenceStatus = 'FAIL'
      const description = `${statusCode}:${authorizationHeaderPresence}`
      assert.deepEqual(validateN8nCloudIngressEvidence(nonSuccess), {
        ok: true,
        errors: [],
      }, description)

      const withoutBinding = JSON.parse(JSON.stringify(nonSuccess))
      withoutBinding.tenantAlias = null
      assert.deepEqual(validateN8nCloudIngressEvidence(withoutBinding), {
        ok: true,
        errors: [],
      }, `${description}: missing binding`)

      if (authorizationHeaderPresence === 'present') {
        for (const claimedGate of ['UNPROVEN', 'PASS']) {
          const inconsistentVector = JSON.parse(JSON.stringify(nonSuccess))
          replaceEvidenceVector(inconsistentVector, 'auth-correct', {
            gate: claimedGate,
          })
          assert.deepEqual(validateN8nCloudIngressEvidence(inconsistentVector), {
            ok: false,
            errors: ['inconsistentVectorGate'],
          }, `${description}: vector ${claimedGate}`)
        }

        for (const claimedTenantStatus of ['UNPROVEN', 'PASS']) {
          const inconsistentTenant = JSON.parse(JSON.stringify(nonSuccess))
          inconsistentTenant.testUrlTenantMeasurementStatus = claimedTenantStatus
          assert.deepEqual(validateN8nCloudIngressEvidence(inconsistentTenant), {
            ok: false,
            errors: ['inconsistentTestUrlTenantMeasurementStatus'],
          }, `${description}: tenant ${claimedTenantStatus}`)
        }

        for (const claimedProviderStatus of ['UNPROVEN', 'PASS']) {
          const inconsistentProvider = JSON.parse(JSON.stringify(nonSuccess))
          inconsistentProvider.providerExecutionEvidenceStatus =
            claimedProviderStatus
          assert.deepEqual(validateN8nCloudIngressEvidence(inconsistentProvider), {
            ok: false,
            errors: ['inconsistentProviderExecutionEvidenceStatus'],
          }, `${description}: provider ${claimedProviderStatus}`)
        }
      }
    }
  }

  const unknownStatusPresent = JSON.parse(JSON.stringify(completed))
  replaceEvidenceVector(unknownStatusPresent, 'auth-correct', {
    httpStatus: null,
    authorizationHeaderPresence: 'present',
    gate: 'FAIL',
  })
  unknownStatusPresent.testUrlTenantMeasurementStatus = 'FAIL'
  unknownStatusPresent.providerExecutionEvidenceStatus = 'UNPROVEN'
  assert.deepEqual(validateN8nCloudIngressEvidence(unknownStatusPresent), {
    ok: true,
    errors: [],
  })

  for (const [probeId, statusCode] of [
    ['ascii', 401],
    ['content-encoding-gzip', 500],
  ]) {
    const vector = vectorMap().get(probeId)
    const nonAuthCorrect = createProviderPassEvidence()
    replaceEvidenceVector(nonAuthCorrect, probeId, {
      ...createSuccessfulObserverVectorEvidence(
        selectedEvidence(nonAuthCorrect, probeId),
        vector,
        1,
        1,
      ),
      httpStatus: statusCode,
      authorizationHeaderPresence: 'present',
      gate: 'UNPROVEN',
    })
    assert.equal(nonAuthCorrect.testUrlTenantMeasurementStatus, 'UNPROVEN')
    assert.equal(nonAuthCorrect.providerExecutionEvidenceStatus, 'PASS')
    assert.deepEqual(validateN8nCloudIngressEvidence(nonAuthCorrect), {
      ok: true,
      errors: [],
    }, `${probeId}:${statusCode}: authCorrect-only precedence`)
  }
})

test('normal and compressed observer gates evaluate authorization, bytes, encoding and counts fail closed', async () => {
  for (const probeId of ['ascii', 'content-encoding-gzip']) {
    const absent = await runVector(probeId, createObserverTransport())
    assert.equal(absent.vectorGate, 'PASS', probeId)
    assert.equal(
      selectedEvidence(
        absent.evidence,
        probeId,
      ).authorizationHeaderPresence,
      'absent',
      probeId,
    )

    const present = await runVector(
      probeId,
      createObserverTransport(() => ({ authorizationHeaderPresence: 'present' })),
    )
    assert.equal(present.vectorGate, 'FAIL', probeId)
    assert.equal(present.evidence.testUrlTenantMeasurementStatus, 'FAIL', probeId)
    assert.equal(present.evidence.providerExecutionEvidenceStatus, 'FAIL', probeId)
    assert.deepEqual(validateN8nCloudIngressEvidence(present.evidence), {
      ok: true,
      errors: [],
    }, probeId)

    const unavailable = await runVector(
      probeId,
      createObserverTransport(() => ({
        authorizationHeaderPresence: 'unavailable',
      })),
    )
    assert.equal(unavailable.vectorGate, 'UNPROVEN', probeId)
    assert.equal(
      unavailable.evidence.providerExecutionEvidenceStatus,
      'UNPROVEN',
      probeId,
    )
    assert.deepEqual(validateN8nCloudIngressEvidence(unavailable.evidence), {
      ok: true,
      errors: [],
    }, probeId)

    const nullHeader = JSON.parse(JSON.stringify(absent.evidence))
    replaceEvidenceVector(nullHeader, probeId, {
      authorizationHeaderPresence: null,
      gate: 'UNPROVEN',
    })
    assert.deepEqual(validateN8nCloudIngressEvidence(nullHeader), {
      ok: true,
      errors: [],
    }, probeId)

    const claimedPass = JSON.parse(JSON.stringify(nullHeader))
    replaceEvidenceVector(claimedPass, probeId, { gate: 'PASS' })
    const validation = validateN8nCloudIngressEvidence(claimedPass)
    assert.equal(validation.ok, false, probeId)
    assert.ok(validation.errors.includes('inconsistentVectorGate'), probeId)
  }

  const unavailable = await runVector(
    'content-encoding-gzip',
    createObserverTransport(() => ({ contentEncodingOutcome: 'unavailable' })),
  )
  assert.equal(unavailable.vectorGate, 'UNPROVEN')

  const mismatched = await runVector(
    'content-encoding-gzip',
    createObserverTransport(() => ({ contentEncodingOutcome: 'mismatch' })),
  )
  assert.equal(mismatched.vectorGate, 'FAIL')

  const decompressed = await runVector(
    'content-encoding-gzip',
    createObserverTransport(() => ({
      exactMatch: false,
      receivedByteLength: 36,
      strictUtf8Outcome: 'invalidAccepted',
      contentEncodingOutcome: 'match',
    })),
  )
  assert.equal(decompressed.vectorGate, 'FAIL')

  for (const statusCode of [400, 415]) {
    const rejected = await runVector(
      'content-encoding-gzip',
      createFakeHttpsRequest(() => ({ statusCode })),
    )
    assert.equal(rejected.vectorGate, 'UNPROVEN')
    const completed = JSON.parse(JSON.stringify(rejected.evidence))
    replaceEvidenceVector(completed, 'content-encoding-gzip', {
      observerCallCount: 0,
      workflowExecutionCount: 0,
      uniqueVectorAttribution: true,
      gate: 'PASS',
    })
    assert.equal(validateN8nCloudIngressEvidence(completed).ok, true)

    const ambiguous = JSON.parse(JSON.stringify(completed))
    replaceEvidenceVector(ambiguous, 'content-encoding-gzip', {
      workflowExecutionCount: 1,
      gate: 'PASS',
    })
    const validation = validateN8nCloudIngressEvidence(ambiguous)
    assert.equal(validation.ok, false)
    assert.ok(validation.errors.includes('inconsistentVectorGate'))
  }

  for (const probeId of ['ascii', 'content-encoding-gzip']) {
    const exact = await runVector(probeId, createObserverTransport())
    assert.equal(exact.vectorGate, 'PASS', probeId)
    assert.equal(
      selectedEvidence(exact.evidence, probeId).observerCallCount,
      null,
      probeId,
    )
    assert.equal(
      selectedEvidence(exact.evidence, probeId).workflowExecutionCount,
      null,
      probeId,
    )
    assert.equal(validateN8nCloudIngressEvidence(exact.evidence).ok, true, probeId)

    for (const [observerCallCount, workflowExecutionCount] of [
      [0, 0],
      [0, null],
      [null, 0],
      [1, 0],
      [0, 1],
    ]) {
      const contradictory = JSON.parse(JSON.stringify(exact.evidence))
      replaceEvidenceVector(contradictory, probeId, {
        observerCallCount,
        workflowExecutionCount,
        authorizationHeaderPresence: null,
        gate: 'FAIL',
      })
      contradictory.testUrlTenantMeasurementStatus = 'FAIL'
      contradictory.providerExecutionEvidenceStatus = 'FAIL'
      assert.deepEqual(
        validateN8nCloudIngressEvidence(contradictory),
        { ok: true, errors: [] },
        `${probeId}: ${observerCallCount}/${workflowExecutionCount}`,
      )

      const claimedPass = JSON.parse(JSON.stringify(contradictory))
      replaceEvidenceVector(claimedPass, probeId, { gate: 'PASS' })
      claimedPass.testUrlTenantMeasurementStatus = 'UNPROVEN'
      const validation = validateN8nCloudIngressEvidence(claimedPass)
      assert.equal(validation.ok, false)
      assert.ok(
        validation.errors.includes('inconsistentVectorGate'),
        `${probeId}: ${observerCallCount}/${workflowExecutionCount}`,
      )
    }

    for (const [observerCallCount, workflowExecutionCount] of [
      [null, null],
      [1, 1],
      [1, null],
      [null, 1],
    ]) {
      const observable = JSON.parse(JSON.stringify(exact.evidence))
      replaceEvidenceVector(observable, probeId, {
        observerCallCount,
        workflowExecutionCount,
        authorizationHeaderPresence: 'absent',
        gate: 'PASS',
      })
      assert.equal(
        validateN8nCloudIngressEvidence(observable).ok,
        true,
        `${probeId}: ${observerCallCount}/${workflowExecutionCount}`,
      )

      const unobserved = JSON.parse(JSON.stringify(observable))
      replaceEvidenceVector(unobserved, probeId, {
        authorizationHeaderPresence: null,
        gate: 'UNPROVEN',
      })
      assert.deepEqual(
        validateN8nCloudIngressEvidence(unobserved),
        { ok: true, errors: [] },
        `${probeId}: null auth with ${observerCallCount}/${workflowExecutionCount}`,
      )
    }
  }
})

test('untrusted observer projections reject accessors, symbols and proxies without disclosure', { concurrency: false }, async () => {
  const originalParse = JSON.parse
  let accessorCalls = 0
  const base = observerPayload(vectorMap().get('ascii'))
  const accessor = { ...base }
  Object.defineProperty(accessor, 'exactMatch', {
    enumerable: true,
    get() {
      accessorCalls += 1
      throw new Error(REDACTION_SENTINEL)
    },
  })
  const symbolExtra = { ...base, [Symbol(REDACTION_SENTINEL)]: true }
  const revocable = Proxy.revocable({ ...base }, {})
  revocable.revoke()
  const values = [accessor, symbolExtra, revocable.proxy, [base]]
  try {
    for (const value of values) {
      JSON.parse = () => value
      const transport = createFakeHttpsRequest(() => ({
        statusCode: 200,
        body: REDACTION_SENTINEL,
      }))
      const result = await runVector('ascii', transport)
      assert.equal(result.ok, true)
      assert.equal(result.vectorGate, 'UNPROVEN')
      assert.doesNotMatch(JSON.stringify(result), /private-redaction-sentinel/u)
    }
  } finally {
    JSON.parse = originalParse
  }
  assert.equal(accessorCalls, 0)
})

test('gate aggregation has FAIL precedence and rejects hostile array shapes', () => {
  assert.equal(aggregateN8nCloudIngressProbeGates(['PASS']), 'PASS')
  assert.equal(aggregateN8nCloudIngressProbeGates(['PASS', 'UNPROVEN']), 'UNPROVEN')
  assert.equal(aggregateN8nCloudIngressProbeGates(['PASS', 'FAIL']), 'FAIL')
  assert.equal(aggregateN8nCloudIngressProbeGates([]), 'UNPROVEN')
  const withExtra = ['PASS']
  withExtra.extra = REDACTION_SENTINEL
  assert.equal(aggregateN8nCloudIngressProbeGates(withExtra), 'UNPROVEN')
  const revoked = Proxy.revocable(['PASS'], {})
  revoked.revoke()
  assert.equal(aggregateN8nCloudIngressProbeGates(revoked.proxy), 'UNPROVEN')
})

test('evidence schema fixes endpoint and source statuses without overallGate', async () => {
  const template = createN8nCloudIngressEvidenceTemplate()
  const fileTemplate = JSON.parse(readFileSync(
    new URL(
      '../docs/evidence/n8n-cloud-ingress-runtime-evidence.template.json',
      import.meta.url,
    ),
    'utf8',
  ))
  assert.deepEqual(fileTemplate, template)
  assert.deepEqual(Object.keys(template), [
    'schemaVersion',
    'endpointKind',
    'tenantAlias',
    'observedAt',
    'timezone',
    'plan',
    'region',
    'n8nBuild',
    'webhookNodeTypeVersion',
    'secretFreeWorkflowSha256',
    'executionDataSettings',
    'vectors',
    'testUrlTenantMeasurementStatus',
    'stableOssCompatibility',
    'providerExecutionEvidenceStatus',
    'productionUrlMeasurementStatus',
    'activationDecision',
    'redactedProviderReference',
    'cleanupConfirmed',
  ])
  assert.equal(Object.keys(template).length, 19)
  assert.equal(Object.keys(template.executionDataSettings).length, 5)
  assert.equal(template.vectors.length, 32)
  assert.equal(
    template.vectors.every((entry) => Object.keys(entry).length === 13),
    true,
  )
  assert.equal(Object.hasOwn(template, 'overallGate'), false)
  assert.equal(template.endpointKind, 'test')
  assert.equal(template.testUrlTenantMeasurementStatus, 'UNPROVEN')
  assert.equal(template.stableOssCompatibility, 'FAIL')
  assert.equal(template.providerExecutionEvidenceStatus, 'UNPROVEN')
  assert.equal(template.productionUrlMeasurementStatus, 'UNPROVEN')
  assert.equal(template.activationDecision, 'FAIL')
  assert.deepEqual(validateN8nCloudIngressEvidence(template), {
    ok: true,
    errors: [],
  })
  assert.deepEqual(validateN8nCloudIngressEvidence(fileTemplate), {
    ok: true,
    errors: [],
  })

  const onePass = await runVector('ascii', createObserverTransport())
  assert.equal(onePass.vectorGate, 'PASS')
  assert.equal(onePass.evidence.testUrlTenantMeasurementStatus, 'UNPROVEN')
  assert.equal(onePass.evidence.productionUrlMeasurementStatus, 'UNPROVEN')
  assert.equal(onePass.evidence.activationDecision, 'FAIL')
  assert.equal(validateN8nCloudIngressEvidence(onePass.evidence).ok, true)

  const completePass = createCompletePassingEvidence()
  assert.equal(completePass.vectors.length, 32)
  assert.equal(completePass.vectors.every((entry) => entry.gate === 'PASS'), true)
  assert.deepEqual(validateN8nCloudIngressEvidence(completePass), {
    ok: true,
    errors: [],
  })

  const contradictoryObserverCounts = JSON.parse(JSON.stringify(completePass))
  const successfulObserverProbeIds = [...vectorMap().values()]
    .filter((vector) => vector.gateKind === 'normal' || vector.gateKind === 'compressed')
    .map((vector) => vector.probeId)
  assert.equal(successfulObserverProbeIds.length, 26)
  for (const probeId of successfulObserverProbeIds) {
    replaceEvidenceVector(contradictoryObserverCounts, probeId, {
      observerCallCount: 0,
      workflowExecutionCount: 0,
      authorizationHeaderPresence: null,
      gate: 'PASS',
    })
  }
  assert.equal(contradictoryObserverCounts.vectors.length, 32)
  assert.equal(
    contradictoryObserverCounts.vectors.every((entry) => entry.gate === 'PASS'),
    true,
  )
  assert.equal(contradictoryObserverCounts.testUrlTenantMeasurementStatus, 'PASS')
  const contradictoryValidation = validateN8nCloudIngressEvidence(
    contradictoryObserverCounts,
  )
  assert.equal(contradictoryValidation.ok, false)
  assert.ok(contradictoryValidation.errors.includes('inconsistentVectorGate'))

  const correctedObserverCounts = JSON.parse(
    JSON.stringify(contradictoryObserverCounts),
  )
  for (const probeId of successfulObserverProbeIds) {
    replaceEvidenceVector(correctedObserverCounts, probeId, { gate: 'FAIL' })
  }
  correctedObserverCounts.testUrlTenantMeasurementStatus = 'FAIL'
  correctedObserverCounts.providerExecutionEvidenceStatus = 'FAIL'
  assert.equal(
    correctedObserverCounts.vectors.filter((entry) => entry.gate === 'FAIL').length,
    26,
  )
  assert.equal(
    correctedObserverCounts.vectors.filter((entry) => entry.gate === 'PASS').length,
    6,
  )
  assert.deepEqual(validateN8nCloudIngressEvidence(correctedObserverCounts), {
    ok: true,
    errors: [],
  })

  for (const [propertyName, invalidValue, expectedError] of [
    ['endpointKind', 'production', 'invalidEndpointKind'],
    ['stableOssCompatibility', 'PASS', 'invalidStableOssCompatibility'],
    ['productionUrlMeasurementStatus', 'PASS', 'invalidProductionUrlMeasurementStatus'],
    ['activationDecision', 'PASS', 'invalidActivationDecision'],
  ]) {
    const changed = cloneTemplate()
    changed[propertyName] = invalidValue
    const validation = validateN8nCloudIngressEvidence(changed)
    assert.equal(validation.ok, false)
    assert.ok(validation.errors.includes(expectedError))
  }
  const legacy = cloneTemplate()
  legacy.overallGate = 'FAIL'
  assert.deepEqual(validateN8nCloudIngressEvidence(legacy), {
    ok: false,
    errors: ['invalidEvidenceShape'],
  })
})

test('evidence rejects impossible calendar dates and accepts a real leap day', () => {
  for (const observedAt of [
    '2026-02-31T00:00:00Z',
    '2026-02-29T12:00:00Z',
    '2026-04-31T12:00:00Z',
    '2026-00-01T12:00:00Z',
    '2026-13-01T12:00:00Z',
    '2026-01-00T12:00:00Z',
  ]) {
    const evidence = cloneTemplate()
    evidence.observedAt = observedAt
    const validation = validateN8nCloudIngressEvidence(evidence)
    assert.equal(validation.ok, false, observedAt)
    assert.ok(validation.errors.includes('invalidObservedAt'))
  }
  const leapDay = cloneTemplate()
  leapDay.observedAt = '2024-02-29T23:59:59.000+14:00'
  assert.equal(validateN8nCloudIngressEvidence(leapDay).ok, true)
  const canonicalUtc = cloneTemplate()
  canonicalUtc.observedAt = '2026-08-20T00:00:00Z'
  assert.equal(validateN8nCloudIngressEvidence(canonicalUtc).ok, true)
})

test('evidence validation closes hostile records, array extras and accessors with static errors', () => {
  const hostileValues = []
  const extra = cloneTemplate()
  extra.privateValue = REDACTION_SENTINEL
  hostileValues.push(extra)

  const symbolExtra = cloneTemplate()
  symbolExtra[Symbol(REDACTION_SENTINEL)] = true
  hostileValues.push(symbolExtra)

  const nonEnumerable = cloneTemplate()
  Object.defineProperty(nonEnumerable, 'endpointKind', {
    value: 'test',
    enumerable: false,
    configurable: true,
  })
  hostileValues.push(nonEnumerable)

  let accessorCalls = 0
  const accessor = cloneTemplate()
  Object.defineProperty(accessor, 'tenantAlias', {
    enumerable: true,
    configurable: true,
    get() {
      accessorCalls += 1
      throw new Error(REDACTION_SENTINEL)
    },
  })
  hostileValues.push(accessor)
  hostileValues.push([])

  const revoked = Proxy.revocable(cloneTemplate(), {})
  revoked.revoke()
  hostileValues.push(revoked.proxy)

  for (const value of hostileValues) {
    const validation = validateN8nCloudIngressEvidence(value)
    assert.deepEqual(validation, {
      ok: false,
      errors: ['invalidEvidenceShape'],
    })
    assert.doesNotMatch(JSON.stringify(validation), /private-redaction-sentinel/u)
  }
  assert.equal(accessorCalls, 0)

  const vectorArrayExtra = cloneTemplate()
  vectorArrayExtra.vectors.extra = REDACTION_SENTINEL
  const arrayValidation = validateN8nCloudIngressEvidence(vectorArrayExtra)
  assert.equal(arrayValidation.ok, false)
  assert.ok(arrayValidation.errors.includes('invalidVectors'))
  assert.doesNotMatch(JSON.stringify(arrayValidation), /private-redaction-sentinel/u)
})

test('provider PASS requires complete binding while known unsafe evidence keeps FAIL precedence', () => {
  const complete = createProviderPassEvidence()
  assert.equal(complete.plan, null)
  assert.equal(complete.region, null)
  assert.deepEqual(validateN8nCloudIngressEvidence(complete), {
    ok: true,
    errors: [],
  })
  assert.deepEqual(
    complete.vectors
      .filter((entry) => entry.httpStatus >= 200 && entry.httpStatus <= 299)
      .map((entry) => entry.probeId),
    ['auth-correct'],
  )
  assert.equal(
    complete.vectors
      .filter((entry) => entry.probeId !== 'auth-correct')
      .every((entry) => entry.httpStatus === null),
    true,
  )

  const requiredBindingKeys = [
    'tenantAlias',
    'observedAt',
    'timezone',
    'n8nBuild',
    'webhookNodeTypeVersion',
    'secretFreeWorkflowSha256',
  ]
  for (const propertyName of requiredBindingKeys) {
    const unproven = JSON.parse(JSON.stringify(complete))
    unproven[propertyName] = null
    unproven.providerExecutionEvidenceStatus = 'UNPROVEN'
    assert.deepEqual(validateN8nCloudIngressEvidence(unproven), {
      ok: true,
      errors: [],
    }, propertyName)

    const manuallyClaimedPass = JSON.parse(JSON.stringify(unproven))
    manuallyClaimedPass.providerExecutionEvidenceStatus = 'PASS'
    const passValidation = validateN8nCloudIngressEvidence(manuallyClaimedPass)
    assert.equal(passValidation.ok, false, propertyName)
    assert.ok(
      passValidation.errors.includes(
        'inconsistentProviderExecutionEvidenceStatus',
      ),
      propertyName,
    )

    const missing = JSON.parse(JSON.stringify(complete))
    delete missing[propertyName]
    assert.deepEqual(validateN8nCloudIngressEvidence(missing), {
      ok: false,
      errors: ['invalidEvidenceShape'],
    }, propertyName)
  }

  const unsafeSetting = JSON.parse(JSON.stringify(complete))
  unsafeSetting.tenantAlias = null
  unsafeSetting.executionDataSettings.saveDataSuccessExecution = 'all'
  unsafeSetting.providerExecutionEvidenceStatus = 'FAIL'
  assert.equal(validateN8nCloudIngressEvidence(unsafeSetting).ok, true)

  for (const authPatch of [
    { authorizationHeaderPresence: 'present' },
    { observerCallCount: 0 },
    { uniqueVectorAttribution: false },
  ]) {
    const unsafeAuthEvidence = JSON.parse(JSON.stringify(complete))
    unsafeAuthEvidence.tenantAlias = null
    replaceEvidenceVector(unsafeAuthEvidence, 'auth-correct', {
      ...authPatch,
      gate: 'FAIL',
    })
    unsafeAuthEvidence.testUrlTenantMeasurementStatus = 'FAIL'
    unsafeAuthEvidence.providerExecutionEvidenceStatus = 'FAIL'
    assert.equal(validateN8nCloudIngressEvidence(unsafeAuthEvidence).ok, true)
  }

  const ascii = vectorMap().get('ascii')
  const gzip = vectorMap().get('content-encoding-gzip')
  const authCorrect = vectorMap().get('auth-correct')
  const attributionHeaderMatrix = [
    [null, 'present', 'FAIL', 'FAIL'],
    [null, 'absent', 'UNPROVEN', 'UNPROVEN'],
    [null, 'unavailable', 'UNPROVEN', 'UNPROVEN'],
    [null, null, 'UNPROVEN', 'UNPROVEN'],
    [true, 'present', 'FAIL', 'FAIL'],
    [true, 'absent', 'PASS', 'PASS'],
    [true, 'unavailable', 'UNPROVEN', 'UNPROVEN'],
    [true, null, 'UNPROVEN', 'UNPROVEN'],
    [false, 'present', 'FAIL', 'FAIL'],
    [false, 'absent', 'FAIL', 'FAIL'],
    [false, 'unavailable', 'FAIL', 'FAIL'],
    [false, null, 'FAIL', 'FAIL'],
  ]
  for (const vector of [ascii, gzip, authCorrect]) {
    for (const [
      uniqueVectorAttribution,
      authorizationHeaderPresence,
      vectorGate,
      providerStatus,
    ] of attributionHeaderMatrix) {
      const evidence = JSON.parse(JSON.stringify(complete))
      const requiredCount = vector.gateKind === 'authCorrect' ? 1 : null
      replaceEvidenceVector(evidence, vector.probeId, {
        ...createSuccessfulObserverVectorEvidence(
          selectedEvidence(evidence, vector.probeId),
          vector,
          requiredCount,
          requiredCount,
        ),
        uniqueVectorAttribution,
        authorizationHeaderPresence,
        gate: vectorGate,
      })
      evidence.testUrlTenantMeasurementStatus = vectorGate === 'FAIL'
        ? 'FAIL'
        : 'UNPROVEN'
      evidence.providerExecutionEvidenceStatus = providerStatus
      const description = [
        vector.probeId,
        uniqueVectorAttribution,
        authorizationHeaderPresence,
      ].map(String).join(':')
      assert.deepEqual(validateN8nCloudIngressEvidence(evidence), {
        ok: true,
        errors: [],
      }, description)

      if (providerStatus !== 'PASS') {
        const manuallyClaimedPass = JSON.parse(JSON.stringify(evidence))
        manuallyClaimedPass.providerExecutionEvidenceStatus = 'PASS'
        assert.deepEqual(validateN8nCloudIngressEvidence(manuallyClaimedPass), {
          ok: false,
          errors: ['inconsistentProviderExecutionEvidenceStatus'],
        }, description)
      }

      if (vectorGate !== 'PASS') {
        const falseVectorPass = JSON.parse(JSON.stringify(evidence))
        replaceEvidenceVector(falseVectorPass, vector.probeId, { gate: 'PASS' })
        const vectorValidation = validateN8nCloudIngressEvidence(falseVectorPass)
        assert.equal(vectorValidation.ok, false, description)
        assert.ok(
          vectorValidation.errors.includes('inconsistentVectorGate'),
          description,
        )
      }

      if (providerStatus === 'FAIL') {
        const withoutBinding = JSON.parse(JSON.stringify(evidence))
        withoutBinding.tenantAlias = null
        assert.deepEqual(validateN8nCloudIngressEvidence(withoutBinding), {
          ok: true,
          errors: [],
        }, `${description}: missing binding`)
      }
    }
  }

  const statusOnly2xx = JSON.parse(JSON.stringify(complete))
  replaceEvidenceVector(statusOnly2xx, ascii.probeId, {
    httpStatus: 200,
    gate: 'UNPROVEN',
  })
  statusOnly2xx.providerExecutionEvidenceStatus = 'UNPROVEN'
  assert.deepEqual(validateN8nCloudIngressEvidence(statusOnly2xx), {
    ok: true,
    errors: [],
  })
  const statusOnlyProviderPass = JSON.parse(JSON.stringify(statusOnly2xx))
  statusOnlyProviderPass.providerExecutionEvidenceStatus = 'PASS'
  assert.deepEqual(validateN8nCloudIngressEvidence(statusOnlyProviderPass), {
    ok: false,
    errors: ['inconsistentProviderExecutionEvidenceStatus'],
  })
  const statusOnlyVectorPass = JSON.parse(JSON.stringify(statusOnly2xx))
  replaceEvidenceVector(statusOnlyVectorPass, ascii.probeId, { gate: 'PASS' })
  assert.ok(
    validateN8nCloudIngressEvidence(statusOnlyVectorPass).errors.includes(
      'inconsistentVectorGate',
    ),
  )

  for (const [
    description,
    vector,
    observerCallCount,
    workflowExecutionCount,
    authorizationHeaderPresence,
  ] of [
    ['normal observer count zero', ascii, 0, null, 'absent'],
    ['compressed workflow count zero', gzip, null, 0, 'absent'],
    ['nullable header cannot hide observer count zero', ascii, 0, null, null],
    [
      'unknown header cannot hide workflow count zero',
      gzip,
      null,
      0,
      'unavailable',
    ],
  ]) {
    const contradiction = JSON.parse(JSON.stringify(complete))
    replaceEvidenceVector(contradiction, vector.probeId, {
      ...createSuccessfulObserverVectorEvidence(
        selectedEvidence(contradiction, vector.probeId),
        vector,
        observerCallCount,
        workflowExecutionCount,
      ),
      uniqueVectorAttribution: null,
      authorizationHeaderPresence,
      gate: 'FAIL',
    })
    contradiction.tenantAlias = null
    contradiction.testUrlTenantMeasurementStatus = 'FAIL'
    contradiction.providerExecutionEvidenceStatus = 'FAIL'
    assert.deepEqual(validateN8nCloudIngressEvidence(contradiction), {
      ok: true,
      errors: [],
    }, description)

    for (const claimedGate of ['UNPROVEN', 'PASS']) {
      const inconsistentVector = JSON.parse(JSON.stringify(contradiction))
      replaceEvidenceVector(inconsistentVector, vector.probeId, {
        gate: claimedGate,
      })
      assert.deepEqual(validateN8nCloudIngressEvidence(inconsistentVector), {
        ok: false,
        errors: ['inconsistentVectorGate'],
      }, `${description}: vector ${claimedGate}`)
    }

    for (const claimedTenantStatus of ['UNPROVEN', 'PASS']) {
      const inconsistentTenant = JSON.parse(JSON.stringify(contradiction))
      inconsistentTenant.testUrlTenantMeasurementStatus = claimedTenantStatus
      assert.deepEqual(validateN8nCloudIngressEvidence(inconsistentTenant), {
        ok: false,
        errors: ['inconsistentTestUrlTenantMeasurementStatus'],
      }, `${description}: tenant ${claimedTenantStatus}`)
    }

    const inconsistentProvider = JSON.parse(JSON.stringify(contradiction))
    inconsistentProvider.providerExecutionEvidenceStatus = 'PASS'
    assert.deepEqual(validateN8nCloudIngressEvidence(inconsistentProvider), {
      ok: false,
      errors: ['inconsistentProviderExecutionEvidenceStatus'],
    }, `${description}: provider PASS`)
  }

  for (const vector of [ascii, gzip]) {
    for (const [observerCallCount, workflowExecutionCount] of [
      [null, null],
      [1, null],
      [null, 1],
      [1, 1],
    ]) {
      const nullableCounts = JSON.parse(JSON.stringify(complete))
      replaceEvidenceVector(nullableCounts, vector.probeId, {
        ...createSuccessfulObserverVectorEvidence(
          selectedEvidence(nullableCounts, vector.probeId),
          vector,
          observerCallCount,
          workflowExecutionCount,
        ),
        uniqueVectorAttribution: null,
        gate: 'UNPROVEN',
      })
      nullableCounts.providerExecutionEvidenceStatus = 'UNPROVEN'
      assert.deepEqual(validateN8nCloudIngressEvidence(nullableCounts), {
        ok: true,
        errors: [],
      }, `${vector.probeId}: nullable ${observerCallCount}/${workflowExecutionCount}`)
    }
  }

  const statusOnlyCount = JSON.parse(JSON.stringify(complete))
  replaceEvidenceVector(statusOnlyCount, ascii.probeId, {
    httpStatus: 200,
    observerCallCount: 0,
    gate: 'UNPROVEN',
  })
  statusOnlyCount.providerExecutionEvidenceStatus = 'FAIL'
  assert.deepEqual(validateN8nCloudIngressEvidence(statusOnlyCount), {
    ok: true,
    errors: [],
  })

  const partialObserverResponse = JSON.parse(JSON.stringify(complete))
  replaceEvidenceVector(partialObserverResponse, ascii.probeId, {
    ...createSuccessfulObserverVectorEvidence(
      selectedEvidence(partialObserverResponse, ascii.probeId),
      ascii,
      0,
      null,
    ),
    uniqueVectorAttribution: null,
    contentEncodingOutcome: null,
    gate: 'UNPROVEN',
  })
  partialObserverResponse.providerExecutionEvidenceStatus = 'FAIL'
  assert.deepEqual(validateN8nCloudIngressEvidence(partialObserverResponse), {
    ok: true,
    errors: [],
  })

  const providerContradictions = [
    ['ascii observer count zero', ascii, { observerCallCount: 0 }],
    ['ascii workflow count zero', ascii, { workflowExecutionCount: 0 }],
    ['ascii observer count above one', ascii, { observerCallCount: 2 }],
    ['ascii attribution false', ascii, { uniqueVectorAttribution: false }],
    ['compressed workflow count zero', gzip, { workflowExecutionCount: 0 }],
  ]
  for (const [description, vector, contradiction] of providerContradictions) {
    const evidence = JSON.parse(JSON.stringify(complete))
    replaceEvidenceVector(evidence, vector.probeId, {
      ...createSuccessfulObserverVectorEvidence(
        selectedEvidence(evidence, vector.probeId),
        vector,
        null,
        null,
      ),
      ...contradiction,
      gate: 'FAIL',
    })
    evidence.testUrlTenantMeasurementStatus = 'FAIL'
    evidence.providerExecutionEvidenceStatus = 'FAIL'
    assert.deepEqual(validateN8nCloudIngressEvidence(evidence), {
      ok: true,
      errors: [],
    }, description)

    const withoutBinding = JSON.parse(JSON.stringify(evidence))
    withoutBinding.tenantAlias = null
    assert.deepEqual(validateN8nCloudIngressEvidence(withoutBinding), {
      ok: true,
      errors: [],
    }, `${description}: missing binding`)

    const manuallyClaimedPass = JSON.parse(JSON.stringify(withoutBinding))
    manuallyClaimedPass.providerExecutionEvidenceStatus = 'PASS'
    assert.deepEqual(validateN8nCloudIngressEvidence(manuallyClaimedPass), {
      ok: false,
      errors: ['inconsistentProviderExecutionEvidenceStatus'],
    }, description)
  }

  for (const [description, probeId, contradiction] of [
    [
      'normal non-2xx observer count above one',
      'ascii',
      { httpStatus: 500, observerCallCount: 2 },
    ],
    [
      'normal non-2xx workflow count above one',
      'ascii',
      { httpStatus: 500, workflowExecutionCount: 2 },
    ],
    [
      'normal non-2xx attribution false',
      'ascii',
      { httpStatus: 500, uniqueVectorAttribution: false },
    ],
    [
      'auth-negative observer count above zero',
      'auth-missing',
      {
        httpStatus: 401,
        observerCallCount: 1,
        workflowExecutionCount: 0,
        uniqueVectorAttribution: true,
      },
    ],
    [
      'auth-negative workflow count above zero',
      'auth-wrong',
      {
        httpStatus: 403,
        observerCallCount: 0,
        workflowExecutionCount: 1,
        uniqueVectorAttribution: true,
      },
    ],
    [
      'auth-negative count above zero at status 500',
      'auth-missing',
      {
        httpStatus: 500,
        observerCallCount: 1,
        uniqueVectorAttribution: true,
      },
    ],
    [
      'compressed 400 observer count above zero',
      'content-encoding-gzip',
      {
        httpStatus: 400,
        observerCallCount: 1,
        workflowExecutionCount: 0,
        uniqueVectorAttribution: true,
      },
    ],
    [
      'compressed 415 workflow count above zero',
      'content-encoding-gzip',
      {
        httpStatus: 415,
        observerCallCount: 0,
        workflowExecutionCount: 1,
        uniqueVectorAttribution: true,
      },
    ],
  ]) {
    const evidence = JSON.parse(JSON.stringify(complete))
    replaceEvidenceVector(evidence, probeId, {
      ...contradiction,
      gate: 'FAIL',
    })
    evidence.testUrlTenantMeasurementStatus = 'FAIL'
    evidence.providerExecutionEvidenceStatus = 'FAIL'
    assert.deepEqual(validateN8nCloudIngressEvidence(evidence), {
      ok: true,
      errors: [],
    }, description)

    const withoutBinding = JSON.parse(JSON.stringify(evidence))
    withoutBinding.tenantAlias = null
    assert.deepEqual(validateN8nCloudIngressEvidence(withoutBinding), {
      ok: true,
      errors: [],
    }, `${description}: missing binding`)

    const manuallyClaimedPass = JSON.parse(JSON.stringify(withoutBinding))
    manuallyClaimedPass.providerExecutionEvidenceStatus = 'PASS'
    assert.deepEqual(validateN8nCloudIngressEvidence(manuallyClaimedPass), {
      ok: false,
      errors: ['inconsistentProviderExecutionEvidenceStatus'],
    }, description)
  }

  for (const vector of [ascii, gzip]) {
    for (const [observerCallCount, workflowExecutionCount] of [
      [null, null],
      [1, null],
      [null, 1],
    ]) {
      const nullableCounts = JSON.parse(JSON.stringify(complete))
      replaceEvidenceVector(
        nullableCounts,
        vector.probeId,
        createSuccessfulObserverVectorEvidence(
          selectedEvidence(nullableCounts, vector.probeId),
          vector,
          observerCallCount,
          workflowExecutionCount,
        ),
      )
      assert.deepEqual(validateN8nCloudIngressEvidence(nullableCounts), {
        ok: true,
        errors: [],
      }, `${vector.probeId}:${observerCallCount}:${workflowExecutionCount}`)
    }
  }

  for (const [probeId, httpStatus] of [
    ['auth-missing', 401],
    ['content-encoding-gzip', 400],
    ['content-encoding-gzip', 415],
  ]) {
    const earlyRejection = JSON.parse(JSON.stringify(complete))
    replaceEvidenceVector(earlyRejection, probeId, {
      httpStatus,
      observerCallCount: 0,
      workflowExecutionCount: 0,
      uniqueVectorAttribution: true,
      gate: 'PASS',
    })
    assert.deepEqual(validateN8nCloudIngressEvidence(earlyRejection), {
      ok: true,
      errors: [],
    }, `${probeId}:${httpStatus}`)
  }

  for (const [vector, countPatch] of [
    [ascii, { observerCallCount: 1 }],
    [gzip, { workflowExecutionCount: 1 }],
  ]) {
    const nonEarlyNonSuccess = JSON.parse(JSON.stringify(complete))
    replaceEvidenceVector(nonEarlyNonSuccess, vector.probeId, {
      httpStatus: 500,
      ...countPatch,
      gate: 'UNPROVEN',
    })
    assert.deepEqual(validateN8nCloudIngressEvidence(nonEarlyNonSuccess), {
      ok: true,
      errors: [],
    }, `${vector.probeId}: non-2xx count one`)
  }

  for (const [description, measurementContradiction] of [
    ['byte mismatch', { observedByteLength: ascii.expectedByteLength + 1 }],
    ['UTF-8 mismatch', { strictUtf8Outcome: 'invalidRejected' }],
    ['encoding mismatch', { contentEncodingOutcome: 'mismatch' }],
  ]) {
    const measurementFailure = JSON.parse(JSON.stringify(complete))
    replaceEvidenceVector(measurementFailure, ascii.probeId, {
      ...createSuccessfulObserverVectorEvidence(
        selectedEvidence(measurementFailure, ascii.probeId),
        ascii,
        null,
        null,
      ),
      ...measurementContradiction,
      gate: 'FAIL',
    })
    measurementFailure.testUrlTenantMeasurementStatus = 'FAIL'
    assert.deepEqual(validateN8nCloudIngressEvidence(measurementFailure), {
      ok: true,
      errors: [],
    }, description)
  }

  const completeTenantAndProviderPass = applyProviderPassPrerequisites(
    createCompletePassingEvidence(),
  )
  const successfulAttributed = completeTenantAndProviderPass.vectors.filter(
    (entry) => (
      entry.httpStatus >= 200 && entry.httpStatus <= 299 &&
      entry.uniqueVectorAttribution === true
    ),
  )
  assert.equal(successfulAttributed.length, 27)
  assert.equal(
    successfulAttributed.every(
      (entry) => entry.authorizationHeaderPresence === 'absent',
    ),
    true,
  )
  assert.deepEqual(validateN8nCloudIngressEvidence(completeTenantAndProviderPass), {
    ok: true,
    errors: [],
  })

  const successfulNonAuthProbeIds = [...vectorMap().values()]
    .filter((vector) => (
      vector.gateKind === 'normal' || vector.gateKind === 'compressed'
    ))
    .map((vector) => vector.probeId)
  assert.equal(successfulNonAuthProbeIds.length, 26)
  assert.equal(
    successfulNonAuthProbeIds.every((probeId) => {
      const entry = selectedEvidence(completeTenantAndProviderPass, probeId)
      return (
        entry.observerCallCount === null &&
        entry.workflowExecutionCount === null
      )
    }),
    true,
  )
  const unattributedSuccessfulPaths = JSON.parse(
    JSON.stringify(completeTenantAndProviderPass),
  )
  for (const probeId of successfulNonAuthProbeIds) {
    replaceEvidenceVector(unattributedSuccessfulPaths, probeId, {
      uniqueVectorAttribution: null,
      authorizationHeaderPresence: 'absent',
      gate: 'UNPROVEN',
    })
  }
  unattributedSuccessfulPaths.testUrlTenantMeasurementStatus = 'UNPROVEN'
  unattributedSuccessfulPaths.providerExecutionEvidenceStatus = 'UNPROVEN'
  assert.equal(
    unattributedSuccessfulPaths.vectors.filter(
      (entry) => entry.gate === 'UNPROVEN',
    ).length,
    26,
  )
  assert.deepEqual(validateN8nCloudIngressEvidence(
    unattributedSuccessfulPaths,
  ), {
    ok: true,
    errors: [],
  })
  const unattributedProviderPass = JSON.parse(
    JSON.stringify(unattributedSuccessfulPaths),
  )
  unattributedProviderPass.providerExecutionEvidenceStatus = 'PASS'
  assert.deepEqual(validateN8nCloudIngressEvidence(
    unattributedProviderPass,
  ), {
    ok: false,
    errors: ['inconsistentProviderExecutionEvidenceStatus'],
  })
  const unattributedVectorPass = JSON.parse(
    JSON.stringify(unattributedSuccessfulPaths),
  )
  replaceEvidenceVector(unattributedVectorPass, ascii.probeId, { gate: 'PASS' })
  assert.ok(
    validateN8nCloudIngressEvidence(unattributedVectorPass).errors.includes(
      'inconsistentVectorGate',
    ),
  )

  const knownAttributionFailure = JSON.parse(
    JSON.stringify(completeTenantAndProviderPass),
  )
  for (const probeId of successfulNonAuthProbeIds) {
    replaceEvidenceVector(knownAttributionFailure, probeId, {
      authorizationHeaderPresence: 'present',
      uniqueVectorAttribution: false,
      gate: 'FAIL',
    })
  }
  knownAttributionFailure.testUrlTenantMeasurementStatus = 'FAIL'
  knownAttributionFailure.providerExecutionEvidenceStatus = 'FAIL'
  assert.equal(
    knownAttributionFailure.vectors.filter(
      (entry) => entry.gate === 'FAIL',
    ).length,
    26,
  )
  assert.equal(
    knownAttributionFailure.vectors.filter(
      (entry) => entry.gate === 'PASS',
    ).length,
    6,
  )
  assert.deepEqual(validateN8nCloudIngressEvidence(knownAttributionFailure), {
    ok: true,
    errors: [],
  })

  const falseTenantPass = JSON.parse(JSON.stringify(knownAttributionFailure))
  falseTenantPass.testUrlTenantMeasurementStatus = 'PASS'
  const tenantValidation = validateN8nCloudIngressEvidence(falseTenantPass)
  assert.equal(tenantValidation.ok, false)
  assert.ok(
    tenantValidation.errors.includes(
      'inconsistentTestUrlTenantMeasurementStatus',
    ),
  )

  const falseProviderPass = JSON.parse(JSON.stringify(knownAttributionFailure))
  falseProviderPass.providerExecutionEvidenceStatus = 'PASS'
  const providerValidation = validateN8nCloudIngressEvidence(falseProviderPass)
  assert.equal(providerValidation.ok, false)
  assert.ok(
    providerValidation.errors.includes(
      'inconsistentProviderExecutionEvidenceStatus',
    ),
  )

  const missing = cloneTemplate()
  assert.equal(missing.providerExecutionEvidenceStatus, 'UNPROVEN')
  assert.equal(validateN8nCloudIngressEvidence(missing).ok, true)
})

test('cache-busted import creates no HTTPS, TLS, net or fetch activity', { concurrency: false }, async () => {
  const originals = {
    httpsRequest: https.request,
    netConnect: net.connect,
    netCreateConnection: net.createConnection,
    tlsConnect: tls.connect,
    fetch: globalThis.fetch,
  }
  let calls = 0
  const forbidden = () => {
    calls += 1
    throw new Error('import-must-not-use-network')
  }
  try {
    https.request = forbidden
    net.connect = forbidden
    net.createConnection = forbidden
    tls.connect = forbidden
    globalThis.fetch = forbidden
    syncBuiltinESMExports()
    await import(
      `${new URL('../scripts/n8n/n8nCloudIngressProbe.js', import.meta.url).href}?inactive=${Date.now()}`
    )
    assert.equal(typeof evaluateObserver(), 'function')
    assert.equal(calls, 0)
  } finally {
    https.request = originals.httpsRequest
    net.connect = originals.netConnect
    net.createConnection = originals.netCreateConnection
    tls.connect = originals.tlsConnect
    if (originals.fetch === undefined) delete globalThis.fetch
    else globalThis.fetch = originals.fetch
    syncBuiltinESMExports()
  }
})
