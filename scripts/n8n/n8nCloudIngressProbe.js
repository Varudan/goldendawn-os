import { createHash } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import { TextDecoder } from 'node:util'

const RUNTIME_CONFIG_ERROR = Object.freeze({
  code: 'invalidRuntimeConfig',
  message: 'Die n8n-Cloud-Probe-Konfiguration ist ungültig.',
})

const PROBE_FAILURE = Object.freeze({
  code: 'probeFailed',
  message: 'Die n8n-Cloud-Probe wurde statisch redigiert abgebrochen.',
})

const CLI_USAGE_MESSAGE =
  'Die n8n-Cloud-Probe startet ausschließlich explizit mit --run --vector <probe-id>.'

export const N8N_CLOUD_INGRESS_PROBE_ENV = Object.freeze({
  endpoint: 'GOLDENDAWN_N8N_CLOUD_PROBE_ENDPOINT',
  secret: 'GOLDENDAWN_N8N_CLOUD_PROBE_SECRET',
})

export const N8N_CLOUD_INGRESS_PROBE_LIMITS = Object.freeze({
  timeoutMs: 5_000,
  responseBytes: 16_384,
  endpointCharacters: 2_048,
  secretCharacters: 512,
})

export const N8N_CLOUD_INGRESS_PROBE_GATES = Object.freeze([
  'PASS',
  'FAIL',
  'UNPROVEN',
])

export const N8N_CLOUD_INGRESS_PROBE_STRICT_UTF8_OUTCOMES = Object.freeze([
  'validExact',
  'invalidRejected',
  'validMismatch',
  'invalidAccepted',
  'unavailable',
])

export const N8N_CLOUD_INGRESS_PROBE_AUTHORIZATION_HEADER_PRESENCES =
  Object.freeze(['absent', 'present', 'unavailable'])

export const N8N_CLOUD_INGRESS_PROBE_CONTENT_ENCODING_OUTCOMES = Object.freeze([
  'match',
  'mismatch',
  'unavailable',
])

export const N8N_CLOUD_INGRESS_PROBE_VECTOR_IDS = Object.freeze([
  'valid-sync-test-json',
  'invalid-json',
  'ascii',
  'multibyte-utf8',
  'four-byte-utf8',
  'utf8-bom',
  'unicode-nfc',
  'unicode-nfd',
  'crlf-trailing-whitespace',
  'embedded-nul',
  'invalid-utf8-c3-28',
  'incomplete-utf8-e2-82',
  'overlong-utf8-c0-af',
  'isolated-utf8-continuation',
  'body-65535-bytes',
  'body-65536-bytes',
  'body-65537-bytes',
  'multibyte-65536-bytes',
  'content-encoding-absent',
  'content-encoding-identity',
  'content-encoding-gzip',
  'content-encoding-deflate',
  'content-encoding-br',
  'compressed-expands-65537',
  'auth-missing',
  'auth-wrong',
  'auth-correct',
  'auth-duplicate-equal',
  'auth-duplicate-conflicting-correct-first-wrong-last',
  'auth-duplicate-conflicting-wrong-first-correct-last',
  'framing-content-length',
  'framing-chunked',
])

const OBSERVER_KEYS = Object.freeze([
  'probeId',
  'exactMatch',
  'receivedByteLength',
  'strictUtf8Outcome',
  'authorizationHeaderPresence',
  'contentEncodingOutcome',
])

const EVIDENCE_KEYS = Object.freeze([
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

const EXECUTION_DATA_SETTING_KEYS = Object.freeze([
  'saveDataErrorExecution',
  'saveDataSuccessExecution',
  'saveManualExecutions',
  'executionDataPruning',
  'readTimeRedaction',
])

const EVIDENCE_VECTOR_KEYS = Object.freeze([
  'probeId',
  'expectedByteLength',
  'observedByteLength',
  'expectedSha256',
  'httpStatus',
  'observerCallCount',
  'workflowExecutionCount',
  'uniqueVectorAttribution',
  'exactMatch',
  'strictUtf8Outcome',
  'authorizationHeaderPresence',
  'contentEncodingOutcome',
  'gate',
])

const PROBE_FACTORY_REQUIRED_KEYS = Object.freeze([
  'requestHttps',
  'runtimeConfig',
  'probeId',
])

const PROBE_FACTORY_OPTION_KEYS = Object.freeze([
  ...PROBE_FACTORY_REQUIRED_KEYS,
  'scheduleTimeout',
  'cancelTimeout',
])

const CLI_OPTION_KEYS = Object.freeze([
  'args',
  'resolveHttpsRequest',
  'stdout',
  'stderr',
  'scheduleTimeout',
  'cancelTimeout',
])

const VALID_SYNC_TEST_JSON =
  '{"version":"1.0","action":"syncTest","source":"goldendawn-os","requestId":"req_probe_00000000-0000-4000-8000-000000000000","timestamp":"2026-08-19T00:00:00.000Z","payload":{}}'
const CONTENT_ENCODING_SENTINEL = 'GoldenDawn-content-encoding-probe-v1'
const AUTH_SENTINEL = 'GoldenDawn-auth-probe-v1'
const FRAMING_SENTINEL = 'GoldenDawn-framing-probe-v1'
const WRONG_AUTH_SECRET = 'goldendawn-invalid-probe-credential'
const ALTERNATE_WRONG_AUTH_SECRET =
  'goldendawn-alternate-invalid-probe-credential'

const COMPRESSED_WIRE_BASE64 = Object.freeze({
  gzip:
    'H4sIAAAAAAAACnPPz0lJzXNJLM/TTc7PK0nNK9FNzUvOT8nMS9ctKMpPStUtMwQATfMEoiQAAAA=',
  deflate:
    'eJxzz89JSc1zSSzP003OzytJzSvRTc1Lzk/JzEvXLSjKT0rVLTMEAP9XDZk=',
  br: 'GyMA+AXqZDFdELpNyTbfjEY7IkoyBUkQgmHpYrs0nj+AqHwBxRk=',
  expands65537:
    'H4sIAAAAAAACCu3BgQAAAADDILb5S/0gVQEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMANrYbBPgEAAQA=',
})

const VECTOR_DEFINITIONS = Object.freeze([
  defineVector('valid-sync-test-json', () => utf8(VALID_SYNC_TEST_JSON)),
  defineVector('invalid-json', () => utf8('{"version":"1.0",}')),
  defineVector('ascii', () => utf8('GoldenDawn ASCII probe v1\n')),
  defineVector('multibyte-utf8', () => utf8('Grüße aus dem Lichtwald')),
  defineVector('four-byte-utf8', () => utf8('GoldenDawn 🌅 probe')),
  defineVector('utf8-bom', () =>
    Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), utf8('GoldenDawn BOM probe v1')]),
  ),
  defineVector('unicode-nfc', () => utf8('Café')),
  defineVector('unicode-nfd', () => utf8('Cafe\u0301')),
  defineVector('crlf-trailing-whitespace', () =>
    utf8('line-one\r\nline-two\r\n  '),
  ),
  defineVector('embedded-nul', () =>
    Buffer.concat([utf8('Golden'), Buffer.from([0]), utf8('Dawn')]),
  ),
  defineVector('invalid-utf8-c3-28', () => Buffer.from([0xc3, 0x28])),
  defineVector('incomplete-utf8-e2-82', () => Buffer.from([0xe2, 0x82])),
  defineVector('overlong-utf8-c0-af', () => Buffer.from([0xc0, 0xaf])),
  defineVector('isolated-utf8-continuation', () => Buffer.from([0x80])),
  defineVector('body-65535-bytes', () => Buffer.alloc(65_535, 0x41)),
  defineVector('body-65536-bytes', () => Buffer.alloc(65_536, 0x41)),
  defineVector('body-65537-bytes', () => Buffer.alloc(65_537, 0x41)),
  defineVector('multibyte-65536-bytes', () =>
    Buffer.from('ä'.repeat(32_768), 'utf8'),
  ),
  defineVector('content-encoding-absent', () =>
    utf8(CONTENT_ENCODING_SENTINEL),
  ),
  defineVector('content-encoding-identity', () =>
    utf8(CONTENT_ENCODING_SENTINEL), { contentEncoding: 'identity' },
  ),
  defineVector('content-encoding-gzip', () =>
    Buffer.from(COMPRESSED_WIRE_BASE64.gzip, 'base64'),
    { contentEncoding: 'gzip', gateKind: 'compressed' },
  ),
  defineVector('content-encoding-deflate', () =>
    Buffer.from(COMPRESSED_WIRE_BASE64.deflate, 'base64'),
    { contentEncoding: 'deflate', gateKind: 'compressed' },
  ),
  defineVector('content-encoding-br', () =>
    Buffer.from(COMPRESSED_WIRE_BASE64.br, 'base64'),
    { contentEncoding: 'br', gateKind: 'compressed' },
  ),
  defineVector('compressed-expands-65537', () =>
    Buffer.from(COMPRESSED_WIRE_BASE64.expands65537, 'base64'),
    { contentEncoding: 'gzip', gateKind: 'compressed' },
  ),
  defineVector('auth-missing', () => utf8(AUTH_SENTINEL), {
    authMode: 'missing', gateKind: 'authNegative',
  }),
  defineVector('auth-wrong', () => utf8(AUTH_SENTINEL), {
    authMode: 'wrong', gateKind: 'authNegative',
  }),
  defineVector('auth-correct', () => utf8(AUTH_SENTINEL), {
    gateKind: 'authCorrect',
  }),
  defineVector('auth-duplicate-equal', () => utf8(AUTH_SENTINEL), {
    authMode: 'duplicateEqual', gateKind: 'authNegative',
  }),
  defineVector('auth-duplicate-conflicting-correct-first-wrong-last', () =>
    utf8(AUTH_SENTINEL), {
      authMode: 'duplicateConflictingCorrectFirstWrongLast',
      gateKind: 'authNegative',
    },
  ),
  defineVector('auth-duplicate-conflicting-wrong-first-correct-last', () =>
    utf8(AUTH_SENTINEL), {
      authMode: 'duplicateConflictingWrongFirstCorrectLast',
      gateKind: 'authNegative',
    },
  ),
  defineVector('framing-content-length', () => utf8(FRAMING_SENTINEL)),
  defineVector('framing-chunked', () => utf8(FRAMING_SENTINEL), {
    framing: 'chunked',
  }),
])

function utf8(value) {
  return Buffer.from(value, 'utf8')
}

function defineVector(
  probeId,
  createBody,
  {
    contentEncoding = null,
    authMode = 'correct',
    framing = 'contentLength',
    gateKind = 'normal',
  } = {},
) {
  return Object.freeze({
    probeId,
    createBody,
    contentEncoding,
    authMode,
    framing,
    gateKind,
  })
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function classifyStrictUtf8(body) {
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true })
    const decoded = decoder.decode(body)
    return Buffer.from(decoded, 'utf8').equals(body)
      ? 'validExact'
      : 'validMismatch'
  } catch {
    return 'invalidRejected'
  }
}

function materializeVector(definition) {
  const body = definition.createBody()
  return Object.freeze({
    probeId: definition.probeId,
    body,
    expectedByteLength: body.byteLength,
    expectedSha256: sha256(body),
    expectedStrictUtf8Outcome: classifyStrictUtf8(body),
    contentEncoding: definition.contentEncoding,
    authMode: definition.authMode,
    framing: definition.framing,
    gateKind: definition.gateKind,
  })
}

export function getN8nCloudIngressProbeVectors() {
  return Object.freeze(VECTOR_DEFINITIONS.map(materializeVector))
}

function getN8nCloudIngressProbeVector(probeId) {
  const definition = VECTOR_DEFINITIONS.find((entry) => entry.probeId === probeId)
  return definition === undefined ? null : materializeVector(definition)
}

function staticFailure(profile) {
  return Object.freeze({
    ok: false,
    error: Object.freeze({ ...profile }),
  })
}

function hasPlainRecordPrototype(value) {
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function projectClosedDataRecord(value, expectedKeys) {
  try {
    if (
      typeof value !== 'object' || value === null || Array.isArray(value) ||
      !hasPlainRecordPrototype(value)
    ) {
      return null
    }
    const keys = Reflect.ownKeys(value)
    if (
      keys.length !== expectedKeys.length ||
      !keys.every((key) =>
        typeof key === 'string' && expectedKeys.includes(key))
    ) {
      return null
    }
    const projection = {}
    for (const key of expectedKeys) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key)
      if (
        descriptor === undefined || descriptor.enumerable !== true ||
        !Object.hasOwn(descriptor, 'value')
      ) {
        return null
      }
      projection[key] = descriptor.value
    }
    return Object.freeze(projection)
  } catch {
    return null
  }
}

function projectAllowedDataRecord(value, allowedKeys, requiredKeys = []) {
  try {
    if (
      typeof value !== 'object' || value === null || Array.isArray(value) ||
      !hasPlainRecordPrototype(value)
    ) {
      return null
    }
    const keys = Reflect.ownKeys(value)
    if (
      !keys.every((key) =>
        typeof key === 'string' && allowedKeys.includes(key)) ||
      !requiredKeys.every((key) => keys.includes(key))
    ) {
      return null
    }
    const projection = {}
    for (const key of keys) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key)
      if (
        descriptor === undefined || descriptor.enumerable !== true ||
        !Object.hasOwn(descriptor, 'value')
      ) {
        return null
      }
      projection[key] = descriptor.value
    }
    return Object.freeze(projection)
  } catch {
    return null
  }
}

function projectDenseArray(value, expectedLength = null) {
  try {
    if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) {
      return null
    }
    const keys = Reflect.ownKeys(value)
    const lengthDescriptor = Object.getOwnPropertyDescriptor(value, 'length')
    if (
      lengthDescriptor === undefined || lengthDescriptor.enumerable !== false ||
      !Object.hasOwn(lengthDescriptor, 'value') ||
      !Number.isSafeInteger(lengthDescriptor.value) ||
      lengthDescriptor.value < 0 ||
      (expectedLength !== null && lengthDescriptor.value !== expectedLength)
    ) {
      return null
    }
    const length = lengthDescriptor.value
    if (expectedLength === null && length > N8N_CLOUD_INGRESS_PROBE_VECTOR_IDS.length) {
      return null
    }
    const expectedKeys = Array.from({ length }, (_, index) => String(index))
    if (
      keys.length !== length + 1 || !keys.includes('length') ||
      !keys.every((key) => key === 'length' || expectedKeys.includes(key))
    ) {
      return null
    }
    const projection = []
    for (const key of expectedKeys) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key)
      if (
        descriptor === undefined || descriptor.enumerable !== true ||
        !Object.hasOwn(descriptor, 'value')
      ) {
        return null
      }
      projection.push(descriptor.value)
    }
    return Object.freeze(projection)
  } catch {
    return null
  }
}

function validateEndpoint(endpoint) {
  if (
    typeof endpoint !== 'string' || endpoint.length === 0 ||
    endpoint.length > N8N_CLOUD_INGRESS_PROBE_LIMITS.endpointCharacters ||
    /[\u0000-\u0020\u007f]/u.test(endpoint)
  ) {
    return null
  }
  const rawEndpointMatch =
    /^[Hh][Tt][Tt][Pp][Ss]:\/\/([^/?#]+)(\/webhook-test\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*)$/u.exec(
      endpoint,
    )
  if (
    rawEndpointMatch === null || rawEndpointMatch[1].includes('@') ||
    rawEndpointMatch[1].includes('\\') || rawEndpointMatch[1].includes('%')
  ) {
    return null
  }
  const rawPath = rawEndpointMatch[2]
  try {
    const parsed = new URL(endpoint)
    if (
      parsed.protocol !== 'https:' || parsed.username !== '' ||
      parsed.password !== '' || parsed.hash !== '' || parsed.search !== '' ||
      parsed.hostname === '' || parsed.pathname !== rawPath
    ) {
      return null
    }
    return endpoint
  } catch {
    return null
  }
}

function validateSecret(secret) {
  return (
    typeof secret === 'string' && secret.length >= 32 &&
    secret.length <= N8N_CLOUD_INGRESS_PROBE_LIMITS.secretCharacters &&
    /^[\x21-\x7e]+$/u.test(secret)
  ) ? secret : null
}

function projectRuntimeConfig(value) {
  const projected = projectClosedDataRecord(value, ['endpoint', 'secret'])
  if (projected === null) {
    return null
  }
  const endpoint = validateEndpoint(projected.endpoint)
  const secret = validateSecret(projected.secret)
  return endpoint === null || secret === null
    ? null
    : Object.freeze({ endpoint, secret })
}

function readNamedProcessEnvironmentValue(propertyName) {
  try {
    const descriptor = Object.getOwnPropertyDescriptor(process.env, propertyName)
    return descriptor !== undefined && Object.hasOwn(descriptor, 'value')
      ? descriptor.value
      : undefined
  } catch {
    return undefined
  }
}

export function readN8nCloudIngressProbeRuntimeConfig() {
  if (arguments.length !== 0) {
    return staticFailure(RUNTIME_CONFIG_ERROR)
  }
  const endpoint = validateEndpoint(
    readNamedProcessEnvironmentValue(N8N_CLOUD_INGRESS_PROBE_ENV.endpoint),
  )
  const secret = validateSecret(
    readNamedProcessEnvironmentValue(N8N_CLOUD_INGRESS_PROBE_ENV.secret),
  )
  if (endpoint === null || secret === null) {
    return staticFailure(RUNTIME_CONFIG_ERROR)
  }
  return Object.freeze({
    ok: true,
    config: Object.freeze({ endpoint, secret }),
  })
}

function buildRequestHeaders(vector, runtimeConfig) {
  const headers = [
    'Host', new URL(runtimeConfig.endpoint).host,
    'Accept', 'application/json',
    'Content-Type', 'application/octet-stream',
    'X-GoldenDawn-Probe-Id', vector.probeId,
  ]
  if (vector.contentEncoding !== null) {
    headers.push('Content-Encoding', vector.contentEncoding)
  }
  const correct = `Bearer ${runtimeConfig.secret}`
  const wrongSecret = runtimeConfig.secret === WRONG_AUTH_SECRET
    ? ALTERNATE_WRONG_AUTH_SECRET
    : WRONG_AUTH_SECRET
  const wrong = `Bearer ${wrongSecret}`
  if (vector.authMode === 'correct') {
    headers.push('Authorization', correct)
  } else if (vector.authMode === 'wrong') {
    headers.push('Authorization', wrong)
  } else if (vector.authMode === 'duplicateEqual') {
    headers.push('Authorization', correct, 'Authorization', correct)
  } else if (vector.authMode === 'duplicateConflictingCorrectFirstWrongLast') {
    headers.push('Authorization', correct, 'Authorization', wrong)
  } else if (vector.authMode === 'duplicateConflictingWrongFirstCorrectLast') {
    headers.push('Authorization', wrong, 'Authorization', correct)
  }
  if (vector.framing === 'chunked') {
    headers.push('Transfer-Encoding', 'chunked')
  } else {
    headers.push('Content-Length', String(vector.body.byteLength))
  }
  headers.push('Connection', 'close')
  return headers
}

function destroyQuietly(value) {
  try {
    if (value && typeof value.destroy === 'function') {
      value.destroy()
    }
  } catch {
    // Transport-specific failures are deliberately suppressed.
  }
}

function performHttpsRequest({
  requestHttps, runtimeConfig, vector, scheduleTimeout, cancelTimeout,
}) {
  return new Promise((resolve) => {
    let settled = false
    let request
    let timedOut = false
    let deadline = null
    const settle = (result) => {
      if (settled) return
      settled = true
      if (deadline !== null) {
        try { cancelTimeout(deadline) } catch { /* statically redacted */ }
      }
      resolve(Object.freeze(result))
    }
    try {
      deadline = scheduleTimeout(() => {
        timedOut = true
        destroyQuietly(request)
        settle({ kind: 'timeout', statusCode: null })
      }, N8N_CLOUD_INGRESS_PROBE_LIMITS.timeoutMs)
      if (settled) {
        try { cancelTimeout(deadline) } catch { /* statically redacted */ }
        return
      }
      try {
        if (deadline && typeof deadline.unref === 'function') deadline.unref()
      } catch {
        settle({ kind: 'requestFailed', statusCode: null })
        return
      }
      request = requestHttps(runtimeConfig.endpoint, {
        method: 'POST',
        headers: buildRequestHeaders(vector, runtimeConfig),
        setHost: false,
        agent: false,
        timeout: N8N_CLOUD_INGRESS_PROBE_LIMITS.timeoutMs,
      }, (response) => {
        const chunks = []
        let receivedBytes = 0
        let statusCode = null
        try {
          const candidate = response.statusCode
          statusCode = Number.isSafeInteger(candidate) && candidate >= 100 && candidate <= 599
            ? candidate : null
          response.on('data', (chunk) => {
            if (settled) return
            try {
              const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
              receivedBytes += bytes.byteLength
              if (receivedBytes > N8N_CLOUD_INGRESS_PROBE_LIMITS.responseBytes) {
                destroyQuietly(response)
                destroyQuietly(request)
                settle({ kind: 'responseTooLarge', statusCode })
                return
              }
              chunks.push(Buffer.from(bytes))
            } catch {
              destroyQuietly(response)
              destroyQuietly(request)
              settle({ kind: 'responseFailed', statusCode })
            }
          })
          response.once('end', () => {
            if (settled) return
            try {
              settle({
                kind: 'response', statusCode,
                body: Buffer.concat(chunks, receivedBytes),
              })
            } catch {
              settle({ kind: 'responseFailed', statusCode })
            }
          })
          response.once('aborted', () => settle({ kind: 'responseAborted', statusCode }))
          response.once('error', () => settle({ kind: 'responseFailed', statusCode }))
        } catch {
          destroyQuietly(response)
          destroyQuietly(request)
          settle({ kind: 'responseFailed', statusCode })
        }
      })
      request.once('timeout', () => {
        timedOut = true
        destroyQuietly(request)
        settle({ kind: 'timeout', statusCode: null })
      })
      request.once('error', () => settle({
        kind: timedOut ? 'timeout' : 'requestFailed', statusCode: null,
      }))
      request.end(vector.body)
    } catch {
      destroyQuietly(request)
      settle({ kind: 'requestFailed', statusCode: null })
    }
  })
}

function projectObserverResponse(value, expectedProbeId) {
  const projected = projectClosedDataRecord(value, OBSERVER_KEYS)
  if (
    projected === null || projected.probeId !== expectedProbeId ||
    typeof projected.exactMatch !== 'boolean' ||
    !Number.isSafeInteger(projected.receivedByteLength) ||
    projected.receivedByteLength < 0 ||
    !N8N_CLOUD_INGRESS_PROBE_STRICT_UTF8_OUTCOMES.includes(
      projected.strictUtf8Outcome,
    ) ||
    !N8N_CLOUD_INGRESS_PROBE_AUTHORIZATION_HEADER_PRESENCES.includes(
      projected.authorizationHeaderPresence,
    ) ||
    !N8N_CLOUD_INGRESS_PROBE_CONTENT_ENCODING_OUTCOMES.includes(
      projected.contentEncodingOutcome,
    )
  ) {
    return null
  }
  return projected
}

function parseObserverResponse(body, expectedProbeId) {
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true })
    return projectObserverResponse(JSON.parse(decoder.decode(body)), expectedProbeId)
  } catch {
    return null
  }
}

function isNullableCount(value) {
  return value === null || (Number.isSafeInteger(value) && value >= 0)
}

function isSuccessfulHttpStatus(statusCode) {
  return statusCode !== null && statusCode >= 200 && statusCode <= 299
}

function isSuccessfulAttributedObserverResponse(vectorEvidence) {
  return (
    isSuccessfulHttpStatus(vectorEvidence.httpStatus) &&
    vectorEvidence.uniqueVectorAttribution === true
  )
}

function hasContradictoryObserverMeasurements(vectorEvidence) {
  return (
    vectorEvidence.observedByteLength !== null ||
    vectorEvidence.exactMatch !== null ||
    vectorEvidence.strictUtf8Outcome !== null ||
    (vectorEvidence.authorizationHeaderPresence !== null &&
      vectorEvidence.authorizationHeaderPresence !== 'unavailable') ||
    (vectorEvidence.contentEncodingOutcome !== null &&
      vectorEvidence.contentEncodingOutcome !== 'unavailable')
  )
}

function hasContradictorySuccessfulObserverCounts(vectorEvidence) {
  const hasAdoptedObserverResponse = (
    isSuccessfulHttpStatus(vectorEvidence.httpStatus) &&
    vectorEvidence.observedByteLength !== null &&
    vectorEvidence.exactMatch !== null &&
    vectorEvidence.strictUtf8Outcome !== null &&
    vectorEvidence.contentEncodingOutcome !== null
  )
  return hasAdoptedObserverResponse && (
    (vectorEvidence.observerCallCount !== null &&
      vectorEvidence.observerCallCount !== 1) ||
    (vectorEvidence.workflowExecutionCount !== null &&
      vectorEvidence.workflowExecutionCount !== 1)
  )
}

function hasKnownProviderCountOrAttributionContradiction(
  vector,
  vectorEvidence,
) {
  const observerCount = vectorEvidence.observerCallCount
  const workflowCount = vectorEvidence.workflowExecutionCount
  if (
    vectorEvidence.uniqueVectorAttribution === false ||
    (observerCount !== null && observerCount > 1) ||
    (workflowCount !== null && workflowCount > 1)
  ) {
    return true
  }
  if (isSuccessfulHttpStatus(vectorEvidence.httpStatus)) {
    return (
      (observerCount !== null && observerCount !== 1) ||
      (workflowCount !== null && workflowCount !== 1)
    )
  }
  const isKnownEarlyRejection = (
    vector.gateKind === 'authNegative' ||
    (
      vector.gateKind === 'compressed' &&
      (vectorEvidence.httpStatus === 400 || vectorEvidence.httpStatus === 415)
    )
  )
  return isKnownEarlyRejection && (
    (observerCount !== null && observerCount > 0) ||
    (workflowCount !== null && workflowCount > 0)
  )
}

function evaluateExactObserverGate(vector, vectorEvidence) {
  if (
    vectorEvidence.uniqueVectorAttribution === false ||
    vectorEvidence.exactMatch === false ||
    (vectorEvidence.observedByteLength !== null &&
      vectorEvidence.observedByteLength !== vector.expectedByteLength) ||
    (vectorEvidence.strictUtf8Outcome !== null &&
      vectorEvidence.strictUtf8Outcome !== 'unavailable' &&
      vectorEvidence.strictUtf8Outcome !== vector.expectedStrictUtf8Outcome) ||
    vectorEvidence.contentEncodingOutcome === 'mismatch'
  ) {
    return 'FAIL'
  }
  if (
    vectorEvidence.uniqueVectorAttribution !== true ||
    vectorEvidence.exactMatch !== true ||
    vectorEvidence.observedByteLength !== vector.expectedByteLength ||
    vectorEvidence.strictUtf8Outcome === null ||
    vectorEvidence.strictUtf8Outcome === 'unavailable' ||
    vectorEvidence.strictUtf8Outcome !== vector.expectedStrictUtf8Outcome ||
    vectorEvidence.contentEncodingOutcome === null ||
    vectorEvidence.contentEncodingOutcome === 'unavailable' ||
    vectorEvidence.authorizationHeaderPresence !== 'absent'
  ) {
    return 'UNPROVEN'
  }
  return 'PASS'
}

function evaluateVectorGate(vector, vectorEvidence) {
  const statusCode = vectorEvidence.httpStatus
  const observerCount = vectorEvidence.observerCallCount
  const workflowCount = vectorEvidence.workflowExecutionCount
  const attribution = vectorEvidence.uniqueVectorAttribution

  if (
    (observerCount !== null && observerCount > 1) ||
    (workflowCount !== null && workflowCount > 1) ||
    hasContradictorySuccessfulObserverCounts(vectorEvidence) ||
    (isSuccessfulHttpStatus(statusCode) &&
      vectorEvidence.authorizationHeaderPresence === 'present') ||
    attribution === false
  ) {
    return 'FAIL'
  }
  if (statusCode !== null && statusCode >= 300 && statusCode <= 399) {
    return 'FAIL'
  }

  if (vector.gateKind === 'authNegative') {
    if (
      (observerCount !== null && observerCount > 0) ||
      (workflowCount !== null && workflowCount > 0) ||
      isSuccessfulHttpStatus(statusCode) ||
      hasContradictoryObserverMeasurements(vectorEvidence)
    ) {
      return 'FAIL'
    }
    if (statusCode === 400 || statusCode === 401 || statusCode === 403) {
      if (
        observerCount === 0 && workflowCount === 0 && attribution === true &&
        !hasContradictoryObserverMeasurements(vectorEvidence)
      ) {
        return 'PASS'
      }
      return 'UNPROVEN'
    }
    return 'UNPROVEN'
  }

  if (vector.gateKind === 'authCorrect') {
    if (vectorEvidence.authorizationHeaderPresence === 'present') {
      return 'FAIL'
    }
    if (!isSuccessfulHttpStatus(statusCode)) {
      return 'UNPROVEN'
    }
    const exactGate = evaluateExactObserverGate(vector, vectorEvidence)
    if (exactGate !== 'PASS') {
      return exactGate
    }
    if (
      (observerCount !== null && observerCount !== 1) ||
      (workflowCount !== null && workflowCount !== 1)
    ) {
      return 'FAIL'
    }
    if (
      vectorEvidence.authorizationHeaderPresence !== 'absent' ||
      observerCount === null || workflowCount === null
    ) {
      return 'UNPROVEN'
    }
    return 'PASS'
  }

  if (vector.gateKind === 'compressed') {
    if (statusCode === 400 || statusCode === 415) {
      if (
        (observerCount !== null && observerCount > 0) ||
        (workflowCount !== null && workflowCount > 0) ||
        hasContradictoryObserverMeasurements(vectorEvidence)
      ) {
        return 'FAIL'
      }
      return observerCount === 0 && workflowCount === 0 && attribution === true
        ? 'PASS'
        : 'UNPROVEN'
    }
    return isSuccessfulHttpStatus(statusCode)
      ? evaluateExactObserverGate(vector, vectorEvidence)
      : 'UNPROVEN'
  }

  return isSuccessfulHttpStatus(statusCode)
    ? evaluateExactObserverGate(vector, vectorEvidence)
    : 'UNPROVEN'
}

function createUnprovenVectorEvidence(vector) {
  return Object.freeze({
    probeId: vector.probeId,
    expectedByteLength: vector.expectedByteLength,
    observedByteLength: null,
    expectedSha256: vector.expectedSha256,
    httpStatus: null,
    observerCallCount: null,
    workflowExecutionCount: null,
    uniqueVectorAttribution: null,
    exactMatch: null,
    strictUtf8Outcome: null,
    authorizationHeaderPresence: null,
    contentEncodingOutcome: null,
    gate: 'UNPROVEN',
  })
}

function createMeasuredVectorEvidence(vector, observation) {
  let httpStatus = null
  let observedByteLength = null
  let exactMatch = null
  let strictUtf8Outcome = null
  let authorizationHeaderPresence = 'unavailable'
  let contentEncodingOutcome = 'unavailable'
  let uniqueVectorAttribution = null

  if (
    observation !== null && typeof observation === 'object' &&
    Number.isSafeInteger(observation.statusCode) &&
    observation.statusCode >= 100 && observation.statusCode <= 599
  ) {
    httpStatus = observation.statusCode
  }
  if (observation?.kind === 'response' && isSuccessfulHttpStatus(httpStatus)) {
    const projected = parseObserverResponse(observation.body, vector.probeId)
    if (projected !== null) {
      observedByteLength = projected.receivedByteLength
      exactMatch = projected.exactMatch
      strictUtf8Outcome = projected.strictUtf8Outcome
      authorizationHeaderPresence = projected.authorizationHeaderPresence
      contentEncodingOutcome = projected.contentEncodingOutcome
      uniqueVectorAttribution = true
    }
  }

  const draft = {
    probeId: vector.probeId,
    expectedByteLength: vector.expectedByteLength,
    observedByteLength,
    expectedSha256: vector.expectedSha256,
    httpStatus,
    observerCallCount: null,
    workflowExecutionCount: null,
    uniqueVectorAttribution,
    exactMatch,
    strictUtf8Outcome,
    authorizationHeaderPresence,
    contentEncodingOutcome,
    gate: 'UNPROVEN',
  }
  draft.gate = evaluateVectorGate(vector, draft)
  return Object.freeze(draft)
}

export function aggregateN8nCloudIngressProbeGates(gates) {
  const projected = projectDenseArray(gates)
  if (projected === null || projected.length === 0) {
    return 'UNPROVEN'
  }
  if (projected.some((gate) => gate === 'FAIL')) {
    return 'FAIL'
  }
  return projected.every((gate) => gate === 'PASS') ? 'PASS' : 'UNPROVEN'
}

function createEmptyExecutionDataSettings() {
  return Object.freeze({
    saveDataErrorExecution: null,
    saveDataSuccessExecution: null,
    saveManualExecutions: null,
    executionDataPruning: null,
    readTimeRedaction: null,
  })
}

export function createN8nCloudIngressEvidenceTemplate() {
  return Object.freeze({
    schemaVersion: 1,
    endpointKind: 'test',
    tenantAlias: null,
    observedAt: null,
    timezone: null,
    plan: null,
    region: null,
    n8nBuild: null,
    webhookNodeTypeVersion: null,
    secretFreeWorkflowSha256: null,
    executionDataSettings: createEmptyExecutionDataSettings(),
    vectors: Object.freeze(
      getN8nCloudIngressProbeVectors().map(createUnprovenVectorEvidence),
    ),
    testUrlTenantMeasurementStatus: 'UNPROVEN',
    stableOssCompatibility: 'FAIL',
    providerExecutionEvidenceStatus: 'UNPROVEN',
    productionUrlMeasurementStatus: 'UNPROVEN',
    activationDecision: 'FAIL',
    redactedProviderReference: null,
    cleanupConfirmed: false,
  })
}

function hasCompleteTenantExecutionBinding(evidence) {
  return (
    typeof evidence.tenantAlias === 'string' &&
    typeof evidence.observedAt === 'string' &&
    typeof evidence.timezone === 'string' &&
    typeof evidence.n8nBuild === 'string' &&
    typeof evidence.webhookNodeTypeVersion === 'number' &&
    typeof evidence.secretFreeWorkflowSha256 === 'string'
  )
}

function evaluateTestUrlTenantMeasurementStatus(evidence) {
  const vectorStatus = aggregateN8nCloudIngressProbeGates(
    evidence.vectors.map((entry) => entry.gate),
  )
  if (vectorStatus === 'FAIL') {
    return 'FAIL'
  }
  return vectorStatus === 'PASS' && hasCompleteTenantExecutionBinding(evidence)
    ? 'PASS'
    : 'UNPROVEN'
}

function evaluateProviderExecutionEvidenceStatus(evidence) {
  const settings = evidence.executionDataSettings
  if (
    (settings.saveDataErrorExecution !== null &&
      settings.saveDataErrorExecution !== 'none') ||
    (settings.saveDataSuccessExecution !== null &&
      settings.saveDataSuccessExecution !== 'none') ||
    (settings.saveManualExecutions !== null &&
      settings.saveManualExecutions !== false) ||
    (settings.executionDataPruning !== null &&
      settings.executionDataPruning !== 'enabled') ||
    (settings.readTimeRedaction !== null &&
      settings.readTimeRedaction !== 'enabled' &&
      settings.readTimeRedaction !== 'unavailable')
  ) {
    return 'FAIL'
  }

  const authCorrect = evidence.vectors.find(
    (entry) => entry.probeId === 'auth-correct',
  )
  const expectedVectors = getN8nCloudIngressProbeVectors()
  const hasKnownCountOrAttributionContradiction = evidence.vectors.some(
    (entry, index) => hasKnownProviderCountOrAttributionContradiction(
      expectedVectors[index],
      entry,
    ),
  )
  const successfulHttpPaths = evidence.vectors.filter(
    (entry) => isSuccessfulHttpStatus(entry.httpStatus),
  )
  if (
    authCorrect === undefined ||
    hasKnownCountOrAttributionContradiction ||
    successfulHttpPaths.some(
      (entry) => entry.authorizationHeaderPresence === 'present',
    ) ||
    (authCorrect.observerCallCount !== null &&
      authCorrect.observerCallCount !== 1) ||
    (authCorrect.workflowExecutionCount !== null &&
      authCorrect.workflowExecutionCount !== 1) ||
    authCorrect.uniqueVectorAttribution === false ||
    (authCorrect.httpStatus !== null &&
      !isSuccessfulHttpStatus(authCorrect.httpStatus))
  ) {
    return 'FAIL'
  }
  if (
    !hasCompleteTenantExecutionBinding(evidence) ||
    settings.saveDataErrorExecution !== 'none' ||
    settings.saveDataSuccessExecution !== 'none' ||
    settings.saveManualExecutions !== false ||
    settings.executionDataPruning !== 'enabled' ||
    settings.readTimeRedaction !== 'enabled' ||
    typeof evidence.redactedProviderReference !== 'string' ||
    evidence.cleanupConfirmed !== true ||
    successfulHttpPaths.some(
      (entry) => (
        entry.uniqueVectorAttribution !== true ||
        entry.authorizationHeaderPresence !== 'absent'
      ),
    ) ||
    authCorrect.authorizationHeaderPresence !== 'absent' ||
    authCorrect.observerCallCount !== 1 ||
    authCorrect.workflowExecutionCount !== 1 ||
    authCorrect.uniqueVectorAttribution !== true ||
    !isSuccessfulHttpStatus(authCorrect.httpStatus)
  ) {
    return 'UNPROVEN'
  }
  return 'PASS'
}

function createEvidenceDraft(selectedEvidence) {
  const template = createN8nCloudIngressEvidenceTemplate()
  const vectors = template.vectors.map((entry) =>
    entry.probeId === selectedEvidence.probeId ? selectedEvidence : entry,
  )
  const draft = { ...template, vectors: Object.freeze(vectors) }
  draft.testUrlTenantMeasurementStatus =
    evaluateTestUrlTenantMeasurementStatus(draft)
  draft.providerExecutionEvidenceStatus =
    evaluateProviderExecutionEvidenceStatus(draft)
  return Object.freeze(draft)
}

function projectProbeFactoryOptions(options) {
  const projected = projectAllowedDataRecord(
    options, PROBE_FACTORY_OPTION_KEYS, PROBE_FACTORY_REQUIRED_KEYS,
  )
  if (projected === null) return null
  const runtimeConfig = projectRuntimeConfig(projected.runtimeConfig)
  if (
    typeof projected.requestHttps !== 'function' || runtimeConfig === null ||
    typeof projected.probeId !== 'string' ||
    !N8N_CLOUD_INGRESS_PROBE_VECTOR_IDS.includes(projected.probeId)
  ) {
    return null
  }
  const scheduleTimeout = Object.hasOwn(projected, 'scheduleTimeout')
    ? projected.scheduleTimeout : setTimeout
  const cancelTimeout = Object.hasOwn(projected, 'cancelTimeout')
    ? projected.cancelTimeout : clearTimeout
  if (typeof scheduleTimeout !== 'function' || typeof cancelTimeout !== 'function') {
    return null
  }
  return Object.freeze({
    requestHttps: projected.requestHttps,
    runtimeConfig,
    probeId: projected.probeId,
    scheduleTimeout,
    cancelTimeout,
  })
}

export function createN8nCloudIngressProbe(options) {
  const dependencies = projectProbeFactoryOptions(options)
  if (dependencies === null) {
    throw new TypeError('invalidN8nCloudIngressProbeDependencies')
  }
  const vector = getN8nCloudIngressProbeVector(dependencies.probeId)
  if (vector === null) {
    throw new TypeError('invalidN8nCloudIngressProbeDependencies')
  }
  let consumed = false

  async function run() {
    if (arguments.length !== 0 || consumed) {
      return staticFailure(PROBE_FAILURE)
    }
    consumed = true
    try {
      const observation = await performHttpsRequest({
        requestHttps: dependencies.requestHttps,
        runtimeConfig: dependencies.runtimeConfig,
        vector,
        scheduleTimeout: dependencies.scheduleTimeout,
        cancelTimeout: dependencies.cancelTimeout,
      })
      const selectedEvidence = createMeasuredVectorEvidence(vector, observation)
      return Object.freeze({
        ok: true,
        vectorGate: selectedEvidence.gate,
        evidence: createEvidenceDraft(selectedEvidence),
      })
    } catch {
      return staticFailure(PROBE_FAILURE)
    }
  }
  return Object.freeze({ run })
}

function pushEvidenceError(errors, code) {
  if (!errors.includes(code)) errors.push(code)
}

function isNullableSafeLabel(value, maxLength = 120) {
  return value === null || (
    typeof value === 'string' && value.length >= 1 && value.length <= maxLength &&
    /^[A-Za-z0-9][A-Za-z0-9 ._+:-]*$/u.test(value)
  )
}

function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}

function isStrictObservedAt(value) {
  if (typeof value !== 'string') return false
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{3}))?(Z|([+-])(\d{2}):(\d{2}))$/u.exec(value)
  if (match === null) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])
  const second = Number(match[6])
  if (
    year < 1 || month < 1 || month > 12 || hour > 23 ||
    minute > 59 || second > 59
  ) {
    return false
  }
  const daysPerMonth = [
    31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30,
    31, 31, 30, 31, 30, 31,
  ]
  if (day < 1 || day > daysPerMonth[month - 1]) return false
  if (match[8] !== 'Z') {
    const offsetHour = Number(match[10])
    const offsetMinute = Number(match[11])
    if (
      offsetHour > 14 || offsetMinute > 59 ||
      (offsetHour === 14 && offsetMinute !== 0)
    ) {
      return false
    }
  }
  return true
}

function validateExecutionDataSettings(value) {
  const settings = projectClosedDataRecord(value, EXECUTION_DATA_SETTING_KEYS)
  if (
    settings === null ||
    ![null, 'all', 'none'].includes(settings.saveDataErrorExecution) ||
    ![null, 'all', 'none'].includes(settings.saveDataSuccessExecution) ||
    ![null, true, false].includes(settings.saveManualExecutions) ||
    ![null, 'enabled', 'disabled'].includes(settings.executionDataPruning) ||
    ![null, 'enabled', 'disabled', 'unavailable'].includes(
      settings.readTimeRedaction,
    )
  ) {
    return null
  }
  return settings
}

function projectEvidenceVector(value, expectedVector) {
  const vector = projectClosedDataRecord(value, EVIDENCE_VECTOR_KEYS)
  if (
    vector === null || vector.probeId !== expectedVector.probeId ||
    vector.expectedByteLength !== expectedVector.expectedByteLength ||
    vector.expectedSha256 !== expectedVector.expectedSha256 ||
    !(vector.observedByteLength === null || (
      Number.isSafeInteger(vector.observedByteLength) &&
      vector.observedByteLength >= 0
    )) ||
    !(vector.httpStatus === null || (
      Number.isSafeInteger(vector.httpStatus) &&
      vector.httpStatus >= 100 && vector.httpStatus <= 599
    )) ||
    !isNullableCount(vector.observerCallCount) ||
    !isNullableCount(vector.workflowExecutionCount) ||
    ![null, true, false].includes(vector.uniqueVectorAttribution) ||
    ![null, true, false].includes(vector.exactMatch) ||
    ![null, ...N8N_CLOUD_INGRESS_PROBE_STRICT_UTF8_OUTCOMES].includes(
      vector.strictUtf8Outcome,
    ) ||
    ![null, ...N8N_CLOUD_INGRESS_PROBE_AUTHORIZATION_HEADER_PRESENCES].includes(
      vector.authorizationHeaderPresence,
    ) ||
    ![null, ...N8N_CLOUD_INGRESS_PROBE_CONTENT_ENCODING_OUTCOMES].includes(
      vector.contentEncodingOutcome,
    ) ||
    !N8N_CLOUD_INGRESS_PROBE_GATES.includes(vector.gate)
  ) {
    return null
  }
  return vector
}

function validateN8nCloudIngressEvidenceInternal(value) {
  const errors = []
  const evidence = projectClosedDataRecord(value, EVIDENCE_KEYS)
  if (evidence === null) {
    return Object.freeze({
      ok: false,
      errors: Object.freeze(['invalidEvidenceShape']),
    })
  }

  if (evidence.schemaVersion !== 1) pushEvidenceError(errors, 'invalidSchemaVersion')
  if (evidence.endpointKind !== 'test') pushEvidenceError(errors, 'invalidEndpointKind')
  if (
    evidence.tenantAlias !== null && (
      typeof evidence.tenantAlias !== 'string' ||
      !/^[A-Za-z0-9][A-Za-z0-9_-]{7,63}$/u.test(evidence.tenantAlias)
    )
  ) pushEvidenceError(errors, 'invalidTenantAlias')
  if (evidence.observedAt !== null && !isStrictObservedAt(evidence.observedAt)) {
    pushEvidenceError(errors, 'invalidObservedAt')
  }
  if (
    evidence.timezone !== null && (
      typeof evidence.timezone !== 'string' ||
      !/^(?:UTC|[A-Za-z_+-]+(?:\/[A-Za-z0-9_+-]+)+)$/u.test(evidence.timezone)
    )
  ) pushEvidenceError(errors, 'invalidTimezone')
  if (!isNullableSafeLabel(evidence.plan, 80)) pushEvidenceError(errors, 'invalidPlan')
  if (!isNullableSafeLabel(evidence.region, 80)) pushEvidenceError(errors, 'invalidRegion')
  if (!isNullableSafeLabel(evidence.n8nBuild, 120)) pushEvidenceError(errors, 'invalidN8nBuild')
  if (
    evidence.webhookNodeTypeVersion !== null && (
      typeof evidence.webhookNodeTypeVersion !== 'number' ||
      !Number.isFinite(evidence.webhookNodeTypeVersion) ||
      evidence.webhookNodeTypeVersion <= 0
    )
  ) pushEvidenceError(errors, 'invalidWebhookNodeTypeVersion')
  if (
    evidence.secretFreeWorkflowSha256 !== null && (
      typeof evidence.secretFreeWorkflowSha256 !== 'string' ||
      !/^[a-f0-9]{64}$/u.test(evidence.secretFreeWorkflowSha256)
    )
  ) pushEvidenceError(errors, 'invalidWorkflowHash')

  const settings = validateExecutionDataSettings(evidence.executionDataSettings)
  if (settings === null) pushEvidenceError(errors, 'invalidExecutionDataSettings')

  const expectedVectors = getN8nCloudIngressProbeVectors()
  const vectorValues = projectDenseArray(evidence.vectors, expectedVectors.length)
  const vectors = []
  if (vectorValues === null) {
    pushEvidenceError(errors, 'invalidVectors')
  } else {
    for (let index = 0; index < expectedVectors.length; index += 1) {
      const vector = projectEvidenceVector(vectorValues[index], expectedVectors[index])
      if (vector === null) {
        pushEvidenceError(errors, 'invalidVectors')
        continue
      }
      if (vector.gate !== evaluateVectorGate(expectedVectors[index], vector)) {
        pushEvidenceError(errors, 'inconsistentVectorGate')
      }
      vectors.push(vector)
    }
  }

  if (!N8N_CLOUD_INGRESS_PROBE_GATES.includes(
    evidence.testUrlTenantMeasurementStatus,
  )) pushEvidenceError(errors, 'invalidTestUrlTenantMeasurementStatus')
  if (evidence.stableOssCompatibility !== 'FAIL') {
    pushEvidenceError(errors, 'invalidStableOssCompatibility')
  }
  if (!N8N_CLOUD_INGRESS_PROBE_GATES.includes(
    evidence.providerExecutionEvidenceStatus,
  )) pushEvidenceError(errors, 'invalidProviderExecutionEvidenceStatus')
  if (evidence.productionUrlMeasurementStatus !== 'UNPROVEN') {
    pushEvidenceError(errors, 'invalidProductionUrlMeasurementStatus')
  }
  if (evidence.activationDecision !== 'FAIL') {
    pushEvidenceError(errors, 'invalidActivationDecision')
  }
  if (
    evidence.redactedProviderReference !== null &&
    !isNullableSafeLabel(evidence.redactedProviderReference, 160)
  ) pushEvidenceError(errors, 'invalidProviderReference')
  if (typeof evidence.cleanupConfirmed !== 'boolean') {
    pushEvidenceError(errors, 'invalidCleanupConfirmation')
  }

  if (
    errors.length === 0 && settings !== null &&
    vectors.length === expectedVectors.length
  ) {
    const projectedEvidence = {
      ...evidence,
      executionDataSettings: settings,
      vectors,
    }
    if (
      evidence.testUrlTenantMeasurementStatus !==
      evaluateTestUrlTenantMeasurementStatus(projectedEvidence)
    ) pushEvidenceError(errors, 'inconsistentTestUrlTenantMeasurementStatus')
    if (
      evidence.providerExecutionEvidenceStatus !==
      evaluateProviderExecutionEvidenceStatus(projectedEvidence)
    ) pushEvidenceError(errors, 'inconsistentProviderExecutionEvidenceStatus')
  }

  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors),
  })
}

export function validateN8nCloudIngressEvidence(value) {
  try {
    return validateN8nCloudIngressEvidenceInternal(value)
  } catch {
    return Object.freeze({
      ok: false,
      errors: Object.freeze(['invalidEvidenceShape']),
    })
  }
}

function writeSafely(stream, value) {
  try {
    const write = stream?.write
    if (typeof write !== 'function') return false
    Reflect.apply(write, stream, [value])
    return true
  } catch {
    return false
  }
}

async function resolveDefaultHttpsRequest() {
  const https = await import('node:https')
  return https.request
}

function projectCliOptions(options) {
  return options === undefined
    ? Object.freeze({})
    : projectAllowedDataRecord(options, CLI_OPTION_KEYS)
}

function parseCliProbeId(args) {
  const projected = projectDenseArray(args, 3)
  if (
    projected === null || projected[0] !== '--run' ||
    projected[1] !== '--vector' || typeof projected[2] !== 'string' ||
    !N8N_CLOUD_INGRESS_PROBE_VECTOR_IDS.includes(projected[2])
  ) {
    return null
  }
  return projected[2]
}

export async function runN8nCloudIngressProbeCli(options) {
  const projected = projectCliOptions(options)
  const stdout = projected?.stdout ?? process.stdout
  const stderr = projected?.stderr ?? process.stderr
  if (projected === null) {
    writeSafely(stderr, `${CLI_USAGE_MESSAGE}\n`)
    return 1
  }

  const args = Object.hasOwn(projected, 'args')
    ? projected.args
    : process.argv.slice(2)
  const probeId = parseCliProbeId(args)
  if (probeId === null) {
    writeSafely(stderr, `${CLI_USAGE_MESSAGE}\n`)
    return 1
  }

  const runtime = readN8nCloudIngressProbeRuntimeConfig()
  if (!runtime.ok) {
    writeSafely(stderr, `${RUNTIME_CONFIG_ERROR.message}\n`)
    return 1
  }

  const resolver = Object.hasOwn(projected, 'resolveHttpsRequest')
    ? projected.resolveHttpsRequest
    : resolveDefaultHttpsRequest
  if (typeof resolver !== 'function') {
    writeSafely(stderr, `${PROBE_FAILURE.message}\n`)
    return 1
  }
  let requestHttps
  try {
    requestHttps = await resolver()
  } catch {
    writeSafely(stderr, `${PROBE_FAILURE.message}\n`)
    return 1
  }
  if (typeof requestHttps !== 'function') {
    writeSafely(stderr, `${PROBE_FAILURE.message}\n`)
    return 1
  }

  const factoryOptions = {
    requestHttps,
    runtimeConfig: runtime.config,
    probeId,
  }
  if (Object.hasOwn(projected, 'scheduleTimeout')) {
    factoryOptions.scheduleTimeout = projected.scheduleTimeout
  }
  if (Object.hasOwn(projected, 'cancelTimeout')) {
    factoryOptions.cancelTimeout = projected.cancelTimeout
  }

  let result
  try {
    result = await createN8nCloudIngressProbe(factoryOptions).run()
  } catch {
    result = staticFailure(PROBE_FAILURE)
  }
  if (!result.ok) {
    writeSafely(stderr, `${PROBE_FAILURE.message}\n`)
    return 1
  }
  if (!writeSafely(stdout, `${JSON.stringify(result, null, 2)}\n`)) return 1
  return result.vectorGate === 'PASS' ? 0 : 1
}

function isDirectExecution() {
  if (typeof process.argv[1] !== 'string') return false
  try {
    return pathToFileURL(process.argv[1]).href === import.meta.url
  } catch {
    return false
  }
}

if (isDirectExecution()) {
  process.exitCode = await runN8nCloudIngressProbeCli({
    args: process.argv.slice(2),
  })
}
