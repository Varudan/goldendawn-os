/*
 * Standalone observer for the temporary n8n Cloud ingress evidence probe.
 * Bind this expression to a local constant inside the later Code node.
 */
(function() {
  "use strict";

  const PROBE_ID_HEADER_NAME = 'x-goldendawn-probe-id'
  const AUTHORIZATION_HEADER_NAME = 'authorization'
  const CONTENT_ENCODING_HEADER_NAME = 'content-encoding'
  const MAX_EXPECTED_BYTE_LENGTH = 65_537
  const OBSERVER_FAILURE_MESSAGE =
    'Der n8n-Ingress-Probe-Observer konnte nicht sicher ausgeführt werden.'
  const VALID_SYNC_TEST_JSON =
    '{"version":"1.0","action":"syncTest","source":"goldendawn-os","requestId":"req_probe_00000000-0000-4000-8000-000000000000","timestamp":"2026-08-19T00:00:00.000Z","payload":{}}'

  const PROBE_IDS = Object.freeze([
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
  const PROBE_ID_SET = new Set(PROBE_IDS)

  const GZIP_WIRE_BYTES = Object.freeze([
    31, 139, 8, 0, 0, 0, 0, 0, 0, 10, 115, 207, 207, 73, 73, 205,
    115, 73, 44, 207, 211, 77, 206, 207, 43, 73, 205, 43, 209, 77, 205,
    75, 206, 79, 201, 204, 75, 215, 45, 40, 202, 79, 74, 213, 45, 51,
    4, 0, 77, 243, 4, 162, 36, 0, 0, 0,
  ])
  const DEFLATE_WIRE_BYTES = Object.freeze([
    120, 156, 115, 207, 207, 73, 73, 205, 115, 73, 44, 207, 211, 77,
    206, 207, 43, 73, 205, 43, 209, 77, 205, 75, 206, 79, 201, 204,
    75, 215, 45, 40, 202, 79, 74, 213, 45, 51, 4, 0, 255, 87, 13,
    153,
  ])
  const BROTLI_WIRE_BYTES = Object.freeze([
    27, 35, 0, 248, 5, 234, 100, 49, 93, 16, 186, 77, 201, 54, 223,
    140, 70, 59, 34, 74, 50, 5, 73, 16, 130, 97, 233, 98, 187, 52,
    158, 63, 128, 168, 124, 1, 197, 25,
  ])
  const EXPANDING_GZIP_WIRE_BYTES = Object.freeze([
    31, 139, 8, 0, 0, 0, 0, 0, 2, 10, 237, 193, 129, 0, 0, 0,
    0, 195, 32, 182, 249, 75, 253, 32, 85, 1, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 192, 13, 173, 134, 193, 62, 1, 0,
    1, 0,
  ])

  function createObserverFailure() {
    return new Error(OBSERVER_FAILURE_MESSAGE)
  }

  function readOwnEnumerableDataValue(record, propertyName) {
    if (
      typeof record !== 'object' ||
      record === null ||
      Array.isArray(record)
    ) {
      return { ok: false }
    }

    const descriptor = Object.getOwnPropertyDescriptor(record, propertyName)

    if (
      descriptor === undefined ||
      descriptor.enumerable !== true ||
      !Object.hasOwn(descriptor, 'value')
    ) {
      return { ok: false }
    }

    return { ok: true, value: descriptor.value }
  }

  function readProbeContext(n8nInput) {
    if (
      typeof n8nInput !== 'object' ||
      n8nInput === null ||
      typeof n8nInput.first !== 'function'
    ) {
      return null
    }

    const firstItem = n8nInput.first()
    const json = readOwnEnumerableDataValue(firstItem, 'json')

    if (!json.ok) {
      return null
    }

    const headers = readOwnEnumerableDataValue(json.value, 'headers')

    if (!headers.ok) {
      return null
    }

    const probeId = readOwnEnumerableDataValue(
      headers.value,
      PROBE_ID_HEADER_NAME
    )

    const acceptedProbeId = (
      probeId.ok &&
      typeof probeId.value === 'string' &&
      PROBE_ID_SET.has(probeId.value)
    )

    return acceptedProbeId
      ? { probeId: probeId.value, headers: headers.value }
      : null
  }

  function classifyAuthorizationHeaderPresence(headers) {
    try {
      const descriptor = Object.getOwnPropertyDescriptor(
        headers,
        AUTHORIZATION_HEADER_NAME
      )

      if (descriptor === undefined) {
        return 'absent'
      }

      return Object.hasOwn(descriptor, 'value')
        ? 'present'
        : 'unavailable'
    } catch {
      return 'unavailable'
    }
  }

  function getExpectedContentEncoding(probeId) {
    switch (probeId) {
      case 'content-encoding-identity':
        return 'identity'
      case 'content-encoding-gzip':
      case 'compressed-expands-65537':
        return 'gzip'
      case 'content-encoding-deflate':
        return 'deflate'
      case 'content-encoding-br':
        return 'br'
      default:
        return 'absent'
    }
  }

  function classifyContentEncoding(headers, expectedContentEncoding) {
    try {
      const descriptor = Object.getOwnPropertyDescriptor(
        headers,
        CONTENT_ENCODING_HEADER_NAME
      )

      if (descriptor === undefined) {
        return expectedContentEncoding === 'absent'
          ? 'match'
          : 'mismatch'
      }

      if (
        descriptor.enumerable !== true ||
        !Object.hasOwn(descriptor, 'value')
      ) {
        return 'unavailable'
      }

      return (
        expectedContentEncoding !== 'absent' &&
        typeof descriptor.value === 'string' &&
        descriptor.value === expectedContentEncoding
      )
        ? 'match'
        : 'mismatch'
    } catch {
      return 'unavailable'
    }
  }

  function createAsciiBytes(value) {
    const bytes = new Uint8Array(value.length)

    for (let index = 0; index < value.length; index += 1) {
      const codeUnit = value.charCodeAt(index)

      if (codeUnit > 0x7f) {
        throw createObserverFailure()
      }

      bytes[index] = codeUnit
    }

    return bytes
  }

  function createLiteralBytes(values) {
    return new Uint8Array(values)
  }

  function createRepeatedBytes(byteValue, byteLength) {
    const bytes = new Uint8Array(byteLength)
    bytes.fill(byteValue)
    return bytes
  }

  function createMultibyteLimitBytes() {
    const bytes = new Uint8Array(65_536)

    for (let index = 0; index < bytes.length; index += 2) {
      bytes[index] = 0xc3
      bytes[index + 1] = 0xa4
    }

    return bytes
  }

  function createValidExpectation(bytes, expectedText) {
    return {
      bytes,
      expectedText,
      expectsValidUtf8: true,
    }
  }

  function createInvalidExpectation(bytes) {
    return {
      bytes,
      expectedText: null,
      expectsValidUtf8: false,
    }
  }

  function createExpectedProbe(probeId) {
    switch (probeId) {
      case 'valid-sync-test-json':
        return createValidExpectation(
          createAsciiBytes(VALID_SYNC_TEST_JSON),
          VALID_SYNC_TEST_JSON
        )
      case 'invalid-json':
        return createValidExpectation(
          createAsciiBytes('{"version":"1.0",}'),
          '{"version":"1.0",}'
        )
      case 'ascii':
        return createValidExpectation(
          createAsciiBytes('GoldenDawn ASCII probe v1\n'),
          'GoldenDawn ASCII probe v1\n'
        )
      case 'multibyte-utf8':
        return createValidExpectation(
          createLiteralBytes([
            71, 114, 195, 188, 195, 159, 101, 32, 97, 117, 115, 32,
            100, 101, 109, 32, 76, 105, 99, 104, 116, 119, 97, 108, 100,
          ]),
          'Grüße aus dem Lichtwald'
        )
      case 'four-byte-utf8':
        return createValidExpectation(
          createLiteralBytes([
            71, 111, 108, 100, 101, 110, 68, 97, 119, 110, 32, 240, 159,
            140, 133, 32, 112, 114, 111, 98, 101,
          ]),
          'GoldenDawn 🌅 probe'
        )
      case 'utf8-bom':
        return createValidExpectation(
          createLiteralBytes([
            239, 187, 191, 71, 111, 108, 100, 101, 110, 68, 97, 119, 110,
            32, 66, 79, 77, 32, 112, 114, 111, 98, 101, 32, 118, 49,
          ]),
          '\ufeffGoldenDawn BOM probe v1'
        )
      case 'unicode-nfc':
        return createValidExpectation(
          createLiteralBytes([67, 97, 102, 195, 169]),
          'Café'
        )
      case 'unicode-nfd':
        return createValidExpectation(
          createLiteralBytes([67, 97, 102, 101, 204, 129]),
          'Cafe\u0301'
        )
      case 'crlf-trailing-whitespace':
        return createValidExpectation(
          createAsciiBytes('line-one\r\nline-two\r\n  '),
          'line-one\r\nline-two\r\n  '
        )
      case 'embedded-nul':
        return createValidExpectation(
          createLiteralBytes([
            71, 111, 108, 100, 101, 110, 0, 68, 97, 119, 110,
          ]),
          'Golden\u0000Dawn'
        )
      case 'invalid-utf8-c3-28':
        return createInvalidExpectation(createLiteralBytes([0xc3, 0x28]))
      case 'incomplete-utf8-e2-82':
        return createInvalidExpectation(createLiteralBytes([0xe2, 0x82]))
      case 'overlong-utf8-c0-af':
        return createInvalidExpectation(createLiteralBytes([0xc0, 0xaf]))
      case 'isolated-utf8-continuation':
        return createInvalidExpectation(createLiteralBytes([0x80]))
      case 'body-65535-bytes':
        return createValidExpectation(
          createRepeatedBytes(0x41, 65_535),
          'A'.repeat(65_535)
        )
      case 'body-65536-bytes':
        return createValidExpectation(
          createRepeatedBytes(0x41, 65_536),
          'A'.repeat(65_536)
        )
      case 'body-65537-bytes':
        return createValidExpectation(
          createRepeatedBytes(0x41, 65_537),
          'A'.repeat(65_537)
        )
      case 'multibyte-65536-bytes':
        return createValidExpectation(
          createMultibyteLimitBytes(),
          'ä'.repeat(32_768)
        )
      case 'content-encoding-absent':
      case 'content-encoding-identity':
        return createValidExpectation(
          createAsciiBytes('GoldenDawn-content-encoding-probe-v1'),
          'GoldenDawn-content-encoding-probe-v1'
        )
      case 'content-encoding-gzip':
        return createInvalidExpectation(createLiteralBytes(GZIP_WIRE_BYTES))
      case 'content-encoding-deflate':
        return createInvalidExpectation(
          createLiteralBytes(DEFLATE_WIRE_BYTES)
        )
      case 'content-encoding-br':
        return createInvalidExpectation(createLiteralBytes(BROTLI_WIRE_BYTES))
      case 'compressed-expands-65537':
        return createInvalidExpectation(
          createLiteralBytes(EXPANDING_GZIP_WIRE_BYTES)
        )
      case 'auth-missing':
      case 'auth-wrong':
      case 'auth-correct':
      case 'auth-duplicate-equal':
      case 'auth-duplicate-conflicting-correct-first-wrong-last':
      case 'auth-duplicate-conflicting-wrong-first-correct-last':
        return createValidExpectation(
          createAsciiBytes('GoldenDawn-auth-probe-v1'),
          'GoldenDawn-auth-probe-v1'
        )
      case 'framing-content-length':
      case 'framing-chunked':
        return createValidExpectation(
          createAsciiBytes('GoldenDawn-framing-probe-v1'),
          'GoldenDawn-framing-probe-v1'
        )
      default:
        throw createObserverFailure()
    }
  }

  function hasExactBytes(receivedBytes, expectedBytes) {
    if (receivedBytes.byteLength !== expectedBytes.byteLength) {
      return false
    }

    for (let index = 0; index < expectedBytes.byteLength; index += 1) {
      if (receivedBytes[index] !== expectedBytes[index]) {
        return false
      }
    }

    return true
  }

  function resolveStrictTextDecoder() {
    try {
      const TextDecoderConstructor = globalThis.TextDecoder

      if (typeof TextDecoderConstructor !== 'function') {
        return null
      }

      const options = { fatal: true, ignoreBOM: true }
      const decoder = new TextDecoderConstructor('utf-8', options)

      if (
        decoder.encoding !== 'utf-8' ||
        decoder.fatal !== true ||
        decoder.ignoreBOM !== true ||
        typeof decoder.decode !== 'function'
      ) {
        return null
      }

      const bomDecoder = new TextDecoderConstructor('utf-8', options)
      const bomResult = bomDecoder.decode(
        createLiteralBytes([0xef, 0xbb, 0xbf, 0x41])
      )

      if (bomResult !== '\ufeffA') {
        return null
      }

      const invalidDecoder = new TextDecoderConstructor('utf-8', options)
      let invalidSequenceRejected = false

      try {
        invalidDecoder.decode(createLiteralBytes([0xc3, 0x28]))
      } catch {
        invalidSequenceRejected = true
      }

      return invalidSequenceRejected ? decoder : null
    } catch {
      return null
    }
  }

  function classifyStrictUtf8(receivedBytes, expectedProbe) {
    if (receivedBytes.byteLength > MAX_EXPECTED_BYTE_LENGTH) {
      return 'unavailable'
    }

    const decoder = resolveStrictTextDecoder()

    if (decoder === null) {
      return 'unavailable'
    }

    let decodedText

    try {
      decodedText = decoder.decode(receivedBytes)
    } catch {
      return expectedProbe.expectsValidUtf8
        ? 'validMismatch'
        : 'invalidRejected'
    }

    if (!expectedProbe.expectsValidUtf8) {
      return 'invalidAccepted'
    }

    return decodedText === expectedProbe.expectedText
      ? 'validExact'
      : 'validMismatch'
  }

  function createObserverOutput(
    probeId,
    exactMatch,
    receivedByteLength,
    strictUtf8Outcome,
    authorizationHeaderPresence,
    contentEncodingOutcome
  ) {
    return [{
      json: {
        probeId,
        exactMatch,
        receivedByteLength,
        strictUtf8Outcome,
        authorizationHeaderPresence,
        contentEncodingOutcome,
      },
    }]
  }

  return async function observeN8nCloudIngressProbe(n8nInput) {
    try {
      if (arguments.length !== 1) {
        throw createObserverFailure()
      }

      const probeContext = readProbeContext(n8nInput)

      if (probeContext === null) {
        throw createObserverFailure()
      }

      const { probeId, headers } = probeContext
      const expectedProbe = createExpectedProbe(probeId)
      const receivedBytes =
        await this.helpers.getBinaryDataBuffer(0, 'data')

      if (
        !ArrayBuffer.isView(receivedBytes) ||
        receivedBytes.BYTES_PER_ELEMENT !== 1 ||
        !Number.isSafeInteger(receivedBytes.byteLength) ||
        receivedBytes.byteLength < 0 ||
        receivedBytes.length !== receivedBytes.byteLength
      ) {
        throw createObserverFailure()
      }

      const exactMatch = hasExactBytes(
        receivedBytes,
        expectedProbe.bytes
      )
      const strictUtf8Outcome = classifyStrictUtf8(
        receivedBytes,
        expectedProbe
      )
      const authorizationHeaderPresence =
        classifyAuthorizationHeaderPresence(headers)
      const contentEncodingOutcome = classifyContentEncoding(
        headers,
        getExpectedContentEncoding(probeId)
      )

      return createObserverOutput(
        probeId,
        exactMatch,
        receivedBytes.byteLength,
        strictUtf8Outcome,
        authorizationHeaderPresence,
        contentEncodingOutcome
      )
    } catch {
      throw createObserverFailure()
    }
  }
})()
