import { validateSyncRequest } from '../contracts/syncContract.js'

const FIXED_ENDPOINT = 'http://127.0.0.1:8787/api/sync-test'
const DEADLINE_MILLISECONDS = 5_000
const MAX_REQUEST_BODY_BYTES = 65_536
const MAX_RESPONSE_BODY_BYTES = 16_384

const FACTORY_ERROR_MESSAGE =
  'Ungültige BrowserSyncTransport-Komposition.'
const TRANSPORT_ERROR_CODE = 'BROWSER_SYNC_TRANSPORT_FAILED'
const TRANSPORT_ERROR_MESSAGE =
  'Der lokale Browser-SyncTransport ist fehlgeschlagen.'

const capturedGlobalThis = globalThis
const capturedReflectApply = Reflect.apply
const capturedReflectConstruct = Reflect.construct
const capturedReflectGet = Reflect.get
const capturedReflectOwnKeys = Reflect.ownKeys
const capturedObjectCreate = Object.create
const capturedObjectDefineProperty = Object.defineProperty
const capturedObjectFreeze = Object.freeze
const capturedObjectGetOwnPropertyDescriptor =
  Object.getOwnPropertyDescriptor
const capturedObjectGetPrototypeOf = Object.getPrototypeOf
const capturedObjectHasOwn = Object.hasOwn
const capturedObjectIsFrozen = Object.isFrozen
const capturedObjectPrototype = Object.prototype
const capturedArrayIsArray = Array.isArray
const capturedArrayPrototype = Array.prototype
const capturedNumberIsSafeInteger = Number.isSafeInteger
const capturedStringCharCodeAt = String.prototype.charCodeAt
const CapturedDate = Date
const capturedDatePrototype = CapturedDate.prototype
const capturedDateGetTime = captureProperty(capturedDatePrototype, 'getTime')
const capturedDateToISOString = captureProperty(
  capturedDatePrototype,
  'toISOString'
)
const CapturedTypeError = TypeError
const capturedSymbolSpecies = Symbol.species

const CapturedPromise = Promise
const capturedPromisePrototype = Promise.prototype
const capturedPromiseThen = captureProperty(
  capturedPromisePrototype,
  'then'
)
const capturedPromiseConstructorDescriptor = captureDescriptor(
  capturedPromisePrototype,
  'constructor'
)
const capturedPromiseSpeciesDescriptor = captureDescriptor(
  CapturedPromise,
  capturedSymbolSpecies
)

const capturedJsonObject = JSON
const capturedJsonStringify = captureProperty(capturedJsonObject, 'stringify')
const capturedJsonParse = captureProperty(capturedJsonObject, 'parse')

const CapturedUint8Array = Uint8Array
const capturedUint8ArrayPrototype = Uint8Array.prototype
const capturedTypedArrayPrototype = capturePrototype(
  capturedUint8ArrayPrototype
)
const capturedTypedArrayBufferGetter = captureGetter(
  capturedTypedArrayPrototype,
  'buffer'
)
const capturedTypedArrayByteLengthGetter = captureGetter(
  capturedTypedArrayPrototype,
  'byteLength'
)
const capturedTypedArrayTagGetter = captureGetter(
  capturedTypedArrayPrototype,
  Symbol.toStringTag
)
const capturedTypedArraySet = captureProperty(
  capturedTypedArrayPrototype,
  'set'
)

const CapturedArrayBuffer = ArrayBuffer
const capturedArrayBufferPrototype = ArrayBuffer.prototype
const capturedArrayBufferByteLengthGetter = captureGetter(
  capturedArrayBufferPrototype,
  'byteLength'
)
const capturedArrayBufferResizableGetter = captureOptionalGetter(
  capturedArrayBufferPrototype,
  'resizable'
)
const capturedArrayBufferDetachedGetter = captureOptionalGetter(
  capturedArrayBufferPrototype,
  'detached'
)

const CapturedTextEncoder = captureGlobalProperty('TextEncoder')
const capturedTextEncoderPrototype = captureProperty(
  CapturedTextEncoder,
  'prototype'
)
const capturedTextEncoderEncode = captureProperty(
  capturedTextEncoderPrototype,
  'encode'
)
const CapturedTextDecoder = captureGlobalProperty('TextDecoder')
const capturedTextDecoderPrototype = captureProperty(
  CapturedTextDecoder,
  'prototype'
)
const capturedTextDecoderDecode = captureProperty(
  capturedTextDecoderPrototype,
  'decode'
)

const capturedFetch = captureGlobalProperty('fetch')
const CapturedAbortController = captureGlobalProperty('AbortController')
const capturedSetTimeout = captureGlobalProperty('setTimeout')
const capturedClearTimeout = captureGlobalProperty('clearTimeout')

const COMPOSITION_PROPERTY_NAMES = freezeInternalArray([
  'fetchRequest',
  'createAbortController',
  'setDeadlineTimer',
  'clearDeadlineTimer',
])
const REQUEST_PROPERTY_NAMES = freezeInternalArray([
  'version',
  'action',
  'source',
  'requestId',
  'timestamp',
  'payload',
])
const VALIDATION_RESULT_PROPERTY_NAMES = freezeInternalArray([
  'ok',
  'errors',
])
const REQUEST_INIT_PROPERTY_NAMES = freezeInternalArray([
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
const REQUEST_HEADER_PROPERTY_NAMES = freezeInternalArray(['Content-Type'])

const BROWSER_SYNC_TRANSPORT_FAILURE = freezeOrdinaryRecord([
  ['code', TRANSPORT_ERROR_CODE],
  ['message', TRANSPORT_ERROR_MESSAGE],
])

function captureGlobalProperty(propertyName) {
  return captureProperty(capturedGlobalThis, propertyName)
}

function captureProperty(target, propertyName) {
  try {
    return capturedReflectGet(target, propertyName, target)
  } catch {
    return undefined
  }
}

function captureDescriptor(target, propertyName) {
  try {
    return capturedObjectGetOwnPropertyDescriptor(target, propertyName)
  } catch {
    return undefined
  }
}

function captureGetter(target, propertyName) {
  const descriptor = captureDescriptor(target, propertyName)

  return descriptor !== undefined &&
    capturedObjectHasOwn(descriptor, 'get') &&
    typeof descriptor.get === 'function'
    ? descriptor.get
    : undefined
}

function captureOptionalGetter(target, propertyName) {
  const descriptor = captureDescriptor(target, propertyName)

  if (descriptor === undefined) {
    return null
  }

  return capturedObjectHasOwn(descriptor, 'get') &&
    typeof descriptor.get === 'function'
    ? descriptor.get
    : undefined
}

function capturePrototype(value) {
  try {
    return capturedObjectGetPrototypeOf(value)
  } catch {
    return undefined
  }
}

function freezeInternalArray(values) {
  try {
    return capturedObjectFreeze(values)
  } catch {
    return values
  }
}

function defineEnumerableDataProperty(target, propertyName, value) {
  const descriptor = capturedObjectCreate(null)
  descriptor.configurable = true
  descriptor.enumerable = true
  descriptor.value = value
  descriptor.writable = true
  capturedObjectDefineProperty(target, propertyName, descriptor)
}

function createDataRecord(prototype, entries) {
  const record = capturedObjectCreate(prototype)

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index]
    defineEnumerableDataProperty(record, entry[0], entry[1])
  }

  return record
}

function freezeOrdinaryRecord(entries) {
  const record = createDataRecord(capturedObjectPrototype, entries)
  capturedObjectFreeze(record)
  return record
}

function isObjectLike(value) {
  return value !== null &&
    (typeof value === 'object' || typeof value === 'function')
}

function hasExactKeySet(actualKeys, expectedKeys) {
  if (actualKeys.length !== expectedKeys.length) {
    return false
  }

  for (let expectedIndex = 0;
    expectedIndex < expectedKeys.length;
    expectedIndex += 1) {
    let found = false

    for (let actualIndex = 0;
      actualIndex < actualKeys.length;
      actualIndex += 1) {
      if (actualKeys[actualIndex] === expectedKeys[expectedIndex]) {
        found = true
        break
      }
    }

    if (!found) {
      return false
    }
  }

  return true
}

function hasExactKeySequence(actualKeys, expectedKeys) {
  if (actualKeys.length !== expectedKeys.length) {
    return false
  }

  for (let index = 0; index < expectedKeys.length; index += 1) {
    if (actualKeys[index] !== expectedKeys[index]) {
      return false
    }
  }

  return true
}

function isEnumerableDataDescriptor(descriptor) {
  return descriptor !== undefined &&
    descriptor.enumerable === true &&
    capturedObjectHasOwn(descriptor, 'value') &&
    !capturedObjectHasOwn(descriptor, 'get') &&
    !capturedObjectHasOwn(descriptor, 'set')
}

function isFrozenDataDescriptor(descriptor) {
  return isEnumerableDataDescriptor(descriptor) &&
    descriptor.configurable === false &&
    descriptor.writable === false
}

function isFrozenDataDescriptorWithValue(descriptor, value) {
  return isFrozenDataDescriptor(descriptor) && descriptor.value === value
}

function hasCurrentOrdinaryObjectChain(value) {
  return capturedObjectGetPrototypeOf(value) === capturedObjectPrototype &&
    capturedObjectGetPrototypeOf(capturedObjectPrototype) === null
}

function hasCurrentArrayChain(value) {
  return capturedObjectGetPrototypeOf(value) === capturedArrayPrototype &&
    capturedObjectGetPrototypeOf(capturedArrayPrototype) ===
      capturedObjectPrototype &&
    capturedObjectGetPrototypeOf(capturedObjectPrototype) === null
}

function descriptorsAreEqual(current, original) {
  if (current === undefined || original === undefined) {
    return false
  }

  const currentIsData = capturedObjectHasOwn(current, 'value')
  const originalIsData = capturedObjectHasOwn(original, 'value')

  if (
    currentIsData !== originalIsData ||
    current.configurable !== original.configurable ||
    current.enumerable !== original.enumerable
  ) {
    return false
  }

  if (originalIsData) {
    return current.writable === original.writable &&
      current.value === original.value
  }

  return current.get === original.get && current.set === original.set
}

function NoopConstructor() {}

function isConstructor(value) {
  if (typeof value !== 'function') {
    return false
  }

  try {
    capturedReflectConstruct(NoopConstructor, [], value)
    return true
  } catch {
    return false
  }
}

function runtimeIntrinsicsAreUsable() {
  try {
    return (
      typeof capturedReflectApply === 'function' &&
      typeof capturedReflectConstruct === 'function' &&
      typeof capturedReflectGet === 'function' &&
      typeof capturedReflectOwnKeys === 'function' &&
      typeof capturedObjectCreate === 'function' &&
      typeof capturedObjectDefineProperty === 'function' &&
      typeof capturedObjectFreeze === 'function' &&
      typeof capturedObjectGetOwnPropertyDescriptor === 'function' &&
      typeof capturedObjectGetPrototypeOf === 'function' &&
      typeof capturedObjectHasOwn === 'function' &&
      typeof capturedObjectIsFrozen === 'function' &&
      typeof capturedArrayIsArray === 'function' &&
      typeof capturedNumberIsSafeInteger === 'function' &&
      typeof capturedStringCharCodeAt === 'function' &&
      typeof capturedDateGetTime === 'function' &&
      typeof capturedDateToISOString === 'function' &&
      typeof capturedPromiseThen === 'function' &&
      isConstructor(CapturedDate) &&
      isConstructor(CapturedPromise) &&
      isConstructor(CapturedUint8Array) &&
      isConstructor(CapturedArrayBuffer) &&
      isConstructor(CapturedTextEncoder) &&
      isConstructor(CapturedTextDecoder) &&
      typeof capturedTextEncoderEncode === 'function' &&
      typeof capturedTextDecoderDecode === 'function' &&
      typeof capturedJsonStringify === 'function' &&
      typeof capturedJsonParse === 'function' &&
      typeof capturedTypedArrayBufferGetter === 'function' &&
      typeof capturedTypedArrayByteLengthGetter === 'function' &&
      typeof capturedTypedArrayTagGetter === 'function' &&
      typeof capturedTypedArraySet === 'function' &&
      typeof capturedArrayBufferByteLengthGetter === 'function' &&
      capturedArrayBufferResizableGetter !== undefined &&
      capturedArrayBufferDetachedGetter !== undefined &&
      capturedPromiseConstructorDescriptor !== undefined &&
      capturedPromiseSpeciesDescriptor !== undefined &&
      capturedObjectGetPrototypeOf(capturedObjectPrototype) === null &&
      capturedObjectGetPrototypeOf(capturedArrayPrototype) ===
        capturedObjectPrototype &&
      capturedObjectGetPrototypeOf(capturedDatePrototype) ===
        capturedObjectPrototype &&
      capturedObjectGetPrototypeOf(capturedPromisePrototype) ===
        capturedObjectPrototype &&
      capturedObjectGetPrototypeOf(capturedUint8ArrayPrototype) ===
        capturedTypedArrayPrototype &&
      capturedObjectGetPrototypeOf(capturedTypedArrayPrototype) ===
        capturedObjectPrototype &&
      capturedObjectGetPrototypeOf(capturedArrayBufferPrototype) ===
        capturedObjectPrototype &&
      capturedObjectGetPrototypeOf(capturedTextEncoderPrototype) ===
        capturedObjectPrototype &&
      capturedObjectGetPrototypeOf(capturedTextDecoderPrototype) ===
        capturedObjectPrototype
    )
  } catch {
    return false
  }
}

function defaultsAreUsable() {
  return runtimeIntrinsicsAreUsable() &&
    typeof capturedFetch === 'function' &&
    isConstructor(CapturedAbortController) &&
    typeof capturedSetTimeout === 'function' &&
    typeof capturedClearTimeout === 'function'
}

function defaultFetchRequest(endpoint, requestInit) {
  return capturedReflectApply(capturedFetch, capturedGlobalThis, [
    endpoint,
    requestInit,
  ])
}

function defaultCreateAbortController() {
  return capturedReflectConstruct(CapturedAbortController, [])
}

function defaultSetDeadlineTimer(onDeadline, milliseconds) {
  return capturedReflectApply(capturedSetTimeout, capturedGlobalThis, [
    onDeadline,
    milliseconds,
  ])
}

function defaultClearDeadlineTimer(timerHandle) {
  return capturedReflectApply(capturedClearTimeout, capturedGlobalThis, [
    timerHandle,
  ])
}

function createDefaultSeams() {
  if (!defaultsAreUsable()) {
    return null
  }

  return freezeOrdinaryRecord([
    ['fetchRequest', defaultFetchRequest],
    ['createAbortController', defaultCreateAbortController],
    ['setDeadlineTimer', defaultSetDeadlineTimer],
    ['clearDeadlineTimer', defaultClearDeadlineTimer],
  ])
}

function snapshotComposition(composition) {
  try {
    if (!isObjectLike(composition)) {
      return null
    }

    const ownKeys = capturedReflectOwnKeys(composition)
    const prototype = capturedObjectGetPrototypeOf(composition)

    const descriptors = capturedObjectCreate(null)

    for (let index = 0;
      index < COMPOSITION_PROPERTY_NAMES.length;
      index += 1) {
      const propertyName = COMPOSITION_PROPERTY_NAMES[index]
      const descriptor = capturedObjectGetOwnPropertyDescriptor(
        composition,
        propertyName
      )

      defineEnumerableDataProperty(
        descriptors,
        propertyName,
        descriptor
      )
    }

    const values = capturedObjectCreate(null)
    let descriptorsValid = true

    for (let index = 0;
      index < COMPOSITION_PROPERTY_NAMES.length;
      index += 1) {
      const propertyName = COMPOSITION_PROPERTY_NAMES[index]
      const descriptor = descriptors[propertyName]

      if (
        !isEnumerableDataDescriptor(descriptor) ||
        typeof descriptor.value !== 'function'
      ) {
        descriptorsValid = false
        continue
      }

      defineEnumerableDataProperty(values, propertyName, descriptor.value)
    }

    if (
      !hasExactKeySet(ownKeys, COMPOSITION_PROPERTY_NAMES) ||
      prototype !== capturedObjectPrototype ||
      capturedObjectGetPrototypeOf(capturedObjectPrototype) !== null ||
      !descriptorsValid
    ) {
      return null
    }

    return freezeOrdinaryRecord([
      ['fetchRequest', values.fetchRequest],
      ['createAbortController', values.createAbortController],
      ['setDeadlineTimer', values.setDeadlineTimer],
      ['clearDeadlineTimer', values.clearDeadlineTimer],
    ])
  } catch {
    return null
  }
}

function createFactoryError() {
  return new CapturedTypeError(FACTORY_ERROR_MESSAGE)
}

function snapshotRequest(callerRequest) {
  try {
    if (!isObjectLike(callerRequest)) {
      return null
    }

    const rootOwnKeys = capturedReflectOwnKeys(callerRequest)
    const rootPrototype = capturedObjectGetPrototypeOf(callerRequest)
    const descriptors = capturedObjectCreate(null)

    for (let index = 0; index < REQUEST_PROPERTY_NAMES.length; index += 1) {
      const propertyName = REQUEST_PROPERTY_NAMES[index]
      const descriptor = capturedObjectGetOwnPropertyDescriptor(
        callerRequest,
        propertyName
      )

      defineEnumerableDataProperty(
        descriptors,
        propertyName,
        descriptor
      )
    }

    const values = capturedObjectCreate(null)
    let descriptorsValid = true

    for (let index = 0; index < REQUEST_PROPERTY_NAMES.length; index += 1) {
      const propertyName = REQUEST_PROPERTY_NAMES[index]
      const descriptor = descriptors[propertyName]

      if (!isEnumerableDataDescriptor(descriptor)) {
        descriptorsValid = false
        continue
      }

      defineEnumerableDataProperty(values, propertyName, descriptor.value)
    }

    if (!isEnumerableDataDescriptor(descriptors.payload)) {
      return null
    }

    const payload = values.payload
    const payloadOwnKeys = capturedReflectOwnKeys(payload)
    const payloadPrototype = capturedObjectGetPrototypeOf(payload)

    if (
      !hasExactKeySet(rootOwnKeys, REQUEST_PROPERTY_NAMES) ||
      rootPrototype !== capturedObjectPrototype ||
      capturedObjectGetPrototypeOf(capturedObjectPrototype) !== null ||
      !descriptorsValid ||
      typeof values.version !== 'string' ||
      typeof values.action !== 'string' ||
      typeof values.source !== 'string' ||
      typeof values.requestId !== 'string' ||
      typeof values.timestamp !== 'string' ||
      payloadOwnKeys.length !== 0 ||
      payloadPrototype !== capturedObjectPrototype
    ) {
      return null
    }

    return {
      action: values.action,
      requestId: values.requestId,
      source: values.source,
      timestamp: values.timestamp,
      version: values.version,
    }
  } catch {
    return null
  }
}

function readSuccessfulValidationResult(validationResult) {
  try {
    if (!isObjectLike(validationResult)) {
      return false
    }

    const ownKeys = capturedReflectOwnKeys(validationResult)
    const prototype = capturedObjectGetPrototypeOf(validationResult)
    const okDescriptor = capturedObjectGetOwnPropertyDescriptor(
      validationResult,
      'ok'
    )
    const errorsDescriptor = capturedObjectGetOwnPropertyDescriptor(
      validationResult,
      'errors'
    )

    if (
      !hasExactKeySet(ownKeys, VALIDATION_RESULT_PROPERTY_NAMES) ||
      prototype !== capturedObjectPrototype ||
      capturedObjectGetPrototypeOf(capturedObjectPrototype) !== null ||
      !isEnumerableDataDescriptor(okDescriptor) ||
      okDescriptor.value !== true ||
      !isEnumerableDataDescriptor(errorsDescriptor)
    ) {
      return false
    }

    const errors = errorsDescriptor.value
    const errorOwnKeys = capturedReflectOwnKeys(errors)
    const errorPrototype = capturedObjectGetPrototypeOf(errors)
    const lengthDescriptor = capturedObjectGetOwnPropertyDescriptor(
      errors,
      'length'
    )

    return capturedArrayIsArray(errors) &&
      errorPrototype === capturedArrayPrototype &&
      capturedObjectGetPrototypeOf(capturedArrayPrototype) ===
        capturedObjectPrototype &&
      capturedObjectGetPrototypeOf(capturedObjectPrototype) === null &&
      hasExactKeySequence(errorOwnKeys, ['length']) &&
      lengthDescriptor !== undefined &&
      lengthDescriptor.enumerable === false &&
      capturedObjectHasOwn(lengthDescriptor, 'value') &&
      lengthDescriptor.value === 0
  } catch {
    return false
  }
}

function createInternalRequest(snapshot) {
  const payload = createDataRecord(capturedObjectPrototype, [])
  const request = createDataRecord(capturedObjectPrototype, [
    ['version', snapshot.version],
    ['action', snapshot.action],
    ['source', snapshot.source],
    ['requestId', snapshot.requestId],
    ['timestamp', snapshot.timestamp],
    ['payload', payload],
  ])

  return { payload, request }
}

function hasExactFrozenRequestProfile(request, payload, snapshot) {
  try {
    if (
      !hasCurrentOrdinaryObjectChain(request) ||
      !hasCurrentOrdinaryObjectChain(payload) ||
      !capturedObjectIsFrozen(request) ||
      !capturedObjectIsFrozen(payload) ||
      !hasExactKeySequence(
        capturedReflectOwnKeys(request),
        REQUEST_PROPERTY_NAMES
      ) ||
      capturedReflectOwnKeys(payload).length !== 0 ||
      capturedObjectGetOwnPropertyDescriptor(request, 'toJSON') !==
        undefined ||
      capturedObjectGetOwnPropertyDescriptor(payload, 'toJSON') !==
        undefined ||
      capturedObjectGetOwnPropertyDescriptor(
        capturedObjectPrototype,
        'toJSON'
      ) !== undefined
    ) {
      return false
    }

    const expectedValues = [
      snapshot.version,
      snapshot.action,
      snapshot.source,
      snapshot.requestId,
      snapshot.timestamp,
      payload,
    ]

    for (let index = 0; index < REQUEST_PROPERTY_NAMES.length; index += 1) {
      const descriptor = capturedObjectGetOwnPropertyDescriptor(
        request,
        REQUEST_PROPERTY_NAMES[index]
      )

      if (
        !isFrozenDataDescriptor(descriptor) ||
        descriptor.value !== expectedValues[index]
      ) {
        return false
      }
    }

    return true
  } catch {
    return false
  }
}

function isAsciiAlphaNumericCodeUnit(codeUnit) {
  return (codeUnit >= 48 && codeUnit <= 57) ||
    (codeUnit >= 65 && codeUnit <= 90) ||
    (codeUnit >= 97 && codeUnit <= 122)
}

function hasFixedV1RequestId(value) {
  if (
    typeof value !== 'string' ||
    value.length < 5 ||
    value.length > 64 ||
    capturedReflectApply(capturedStringCharCodeAt, value, [0]) !== 114 ||
    capturedReflectApply(capturedStringCharCodeAt, value, [1]) !== 101 ||
    capturedReflectApply(capturedStringCharCodeAt, value, [2]) !== 113 ||
    capturedReflectApply(capturedStringCharCodeAt, value, [3]) !== 95
  ) {
    return false
  }

  const firstFollowingCodeUnit = capturedReflectApply(
    capturedStringCharCodeAt,
    value,
    [4]
  )

  if (!isAsciiAlphaNumericCodeUnit(firstFollowingCodeUnit)) {
    return false
  }

  for (let index = 5; index < value.length; index += 1) {
    const codeUnit = capturedReflectApply(
      capturedStringCharCodeAt,
      value,
      [index]
    )

    if (
      !isAsciiAlphaNumericCodeUnit(codeUnit) &&
      codeUnit !== 45 &&
      codeUnit !== 95
    ) {
      return false
    }
  }

  return true
}

function hasAsciiDecimalCodeUnitAt(value, index) {
  const codeUnit = capturedReflectApply(
    capturedStringCharCodeAt,
    value,
    [index]
  )

  return codeUnit >= 48 && codeUnit <= 57
}

function readFixedV1TimestampMilliseconds(value) {
  if (
    typeof value !== 'string' ||
    value.length !== 24 ||
    capturedReflectApply(capturedStringCharCodeAt, value, [4]) !== 45 ||
    capturedReflectApply(capturedStringCharCodeAt, value, [7]) !== 45 ||
    capturedReflectApply(capturedStringCharCodeAt, value, [10]) !== 84 ||
    capturedReflectApply(capturedStringCharCodeAt, value, [13]) !== 58 ||
    capturedReflectApply(capturedStringCharCodeAt, value, [16]) !== 58 ||
    capturedReflectApply(capturedStringCharCodeAt, value, [19]) !== 46 ||
    capturedReflectApply(capturedStringCharCodeAt, value, [23]) !== 90 ||
    !hasAsciiDecimalCodeUnitAt(value, 0) ||
    !hasAsciiDecimalCodeUnitAt(value, 1) ||
    !hasAsciiDecimalCodeUnitAt(value, 2) ||
    !hasAsciiDecimalCodeUnitAt(value, 3) ||
    !hasAsciiDecimalCodeUnitAt(value, 5) ||
    !hasAsciiDecimalCodeUnitAt(value, 6) ||
    !hasAsciiDecimalCodeUnitAt(value, 8) ||
    !hasAsciiDecimalCodeUnitAt(value, 9) ||
    !hasAsciiDecimalCodeUnitAt(value, 11) ||
    !hasAsciiDecimalCodeUnitAt(value, 12) ||
    !hasAsciiDecimalCodeUnitAt(value, 14) ||
    !hasAsciiDecimalCodeUnitAt(value, 15) ||
    !hasAsciiDecimalCodeUnitAt(value, 17) ||
    !hasAsciiDecimalCodeUnitAt(value, 18) ||
    !hasAsciiDecimalCodeUnitAt(value, 20) ||
    !hasAsciiDecimalCodeUnitAt(value, 21) ||
    !hasAsciiDecimalCodeUnitAt(value, 22)
  ) {
    return null
  }

  const date = capturedReflectConstruct(CapturedDate, [value])

  if (
    capturedObjectGetPrototypeOf(date) !== capturedDatePrototype ||
    capturedObjectGetPrototypeOf(capturedDatePrototype) !==
      capturedObjectPrototype ||
    capturedObjectGetPrototypeOf(capturedObjectPrototype) !== null ||
    capturedReflectOwnKeys(date).length !== 0
  ) {
    return null
  }

  const milliseconds = capturedReflectApply(capturedDateGetTime, date, [])

  if (
    !capturedNumberIsSafeInteger(milliseconds) ||
    capturedReflectApply(capturedDateToISOString, date, []) !== value
  ) {
    return null
  }

  return milliseconds
}

function hasFixedV1WirePolicy(request, payload, referenceTimestamp) {
  try {
    if (
      capturedObjectGetPrototypeOf(request) !== capturedObjectPrototype ||
      capturedObjectGetPrototypeOf(payload) !== capturedObjectPrototype ||
      capturedObjectGetPrototypeOf(capturedObjectPrototype) !== null ||
      !capturedObjectIsFrozen(request) ||
      !capturedObjectIsFrozen(payload)
    ) {
      return false
    }

    const requestOwnKeys = capturedReflectOwnKeys(request)
    const payloadOwnKeys = capturedReflectOwnKeys(payload)

    if (
      requestOwnKeys.length !== 6 ||
      requestOwnKeys[0] !== 'version' ||
      requestOwnKeys[1] !== 'action' ||
      requestOwnKeys[2] !== 'source' ||
      requestOwnKeys[3] !== 'requestId' ||
      requestOwnKeys[4] !== 'timestamp' ||
      requestOwnKeys[5] !== 'payload' ||
      payloadOwnKeys.length !== 0 ||
      capturedObjectGetOwnPropertyDescriptor(request, 'toJSON') !==
        undefined ||
      capturedObjectGetOwnPropertyDescriptor(payload, 'toJSON') !==
        undefined ||
      capturedObjectGetOwnPropertyDescriptor(
        capturedObjectPrototype,
        'toJSON'
      ) !== undefined
    ) {
      return false
    }

    const versionDescriptor = capturedObjectGetOwnPropertyDescriptor(
      request,
      'version'
    )
    const actionDescriptor = capturedObjectGetOwnPropertyDescriptor(
      request,
      'action'
    )
    const sourceDescriptor = capturedObjectGetOwnPropertyDescriptor(
      request,
      'source'
    )
    const requestIdDescriptor = capturedObjectGetOwnPropertyDescriptor(
      request,
      'requestId'
    )
    const timestampDescriptor = capturedObjectGetOwnPropertyDescriptor(
      request,
      'timestamp'
    )
    const payloadDescriptor = capturedObjectGetOwnPropertyDescriptor(
      request,
      'payload'
    )

    if (
      !isFrozenDataDescriptor(versionDescriptor) ||
      !isFrozenDataDescriptor(actionDescriptor) ||
      !isFrozenDataDescriptor(sourceDescriptor) ||
      !isFrozenDataDescriptor(requestIdDescriptor) ||
      !isFrozenDataDescriptor(timestampDescriptor) ||
      !isFrozenDataDescriptor(payloadDescriptor) ||
      versionDescriptor.value !== '1.0' ||
      actionDescriptor.value !== 'syncTest' ||
      sourceDescriptor.value !== 'goldendawn-os' ||
      payloadDescriptor.value !== payload ||
      !hasFixedV1RequestId(requestIdDescriptor.value)
    ) {
      return false
    }

    const requestMilliseconds = readFixedV1TimestampMilliseconds(
      timestampDescriptor.value
    )
    const referenceMilliseconds = readFixedV1TimestampMilliseconds(
      referenceTimestamp
    )

    if (
      requestMilliseconds === null ||
      referenceMilliseconds === null
    ) {
      return false
    }

    const differenceMilliseconds =
      requestMilliseconds - referenceMilliseconds

    return capturedNumberIsSafeInteger(differenceMilliseconds) &&
      differenceMilliseconds >= -300_000 &&
      differenceMilliseconds <= 300_000
  } catch {
    return false
  }
}

function inspectFixedUint8Array(value, requirePositiveLength) {
  try {
    if (!isObjectLike(value)) {
      return null
    }

    if (
      capturedObjectGetPrototypeOf(value) !== capturedUint8ArrayPrototype ||
      capturedObjectGetPrototypeOf(capturedUint8ArrayPrototype) !==
        capturedTypedArrayPrototype ||
      capturedObjectGetPrototypeOf(capturedTypedArrayPrototype) !==
        capturedObjectPrototype ||
      capturedObjectGetPrototypeOf(capturedObjectPrototype) !== null ||
      capturedReflectApply(capturedTypedArrayTagGetter, value, []) !==
        'Uint8Array'
    ) {
      return null
    }

    const byteLength = capturedReflectApply(
      capturedTypedArrayByteLengthGetter,
      value,
      []
    )
    const buffer = capturedReflectApply(
      capturedTypedArrayBufferGetter,
      value,
      []
    )
    const bufferByteLength = capturedReflectApply(
      capturedArrayBufferByteLengthGetter,
      buffer,
      []
    )

    if (
      capturedObjectGetPrototypeOf(buffer) !== capturedArrayBufferPrototype ||
      capturedObjectGetPrototypeOf(capturedArrayBufferPrototype) !==
        capturedObjectPrototype ||
      capturedObjectGetPrototypeOf(capturedObjectPrototype) !== null ||
      !capturedNumberIsSafeInteger(byteLength) ||
      byteLength < 0 ||
      (requirePositiveLength && byteLength === 0) ||
      !capturedNumberIsSafeInteger(bufferByteLength) ||
      bufferByteLength < byteLength
    ) {
      return null
    }

    if (
      capturedArrayBufferResizableGetter !== null &&
      capturedReflectApply(
        capturedArrayBufferResizableGetter,
        buffer,
        []
      ) !== false
    ) {
      return null
    }

    if (
      capturedArrayBufferDetachedGetter !== null &&
      capturedReflectApply(
        capturedArrayBufferDetachedGetter,
        buffer,
        []
      ) !== false
    ) {
      return null
    }

    return { buffer, byteLength }
  } catch {
    return null
  }
}

function createSerializedRequest(snapshot) {
  const internal = createInternalRequest(snapshot)
  let firstValidation
  let secondValidation

  try {
    firstValidation = validateSyncRequest(
      internal.request,
      snapshot.timestamp
    )
    capturedObjectFreeze(internal.payload)
    capturedObjectFreeze(internal.request)
    secondValidation = validateSyncRequest(
      internal.request,
      snapshot.timestamp
    )
  } catch {
    return null
  }

  if (
    !readSuccessfulValidationResult(firstValidation) ||
    !readSuccessfulValidationResult(secondValidation) ||
    !hasExactFrozenRequestProfile(
      internal.request,
      internal.payload,
      snapshot
    )
  ) {
    return null
  }

  if (!hasFixedV1WirePolicy(
    internal.request,
    internal.payload,
    snapshot.timestamp
  )) {
    return null
  }

  try {
    const body = capturedReflectApply(
      capturedJsonStringify,
      capturedJsonObject,
      [internal.request]
    )

    if (typeof body !== 'string') {
      return null
    }

    const encoder = capturedReflectConstruct(CapturedTextEncoder, [])

    if (
      capturedObjectGetPrototypeOf(encoder) !==
        capturedTextEncoderPrototype ||
      capturedObjectGetPrototypeOf(capturedTextEncoderPrototype) !==
        capturedObjectPrototype ||
      capturedObjectGetPrototypeOf(capturedObjectPrototype) !== null
    ) {
      return null
    }

    const encodedRequest = capturedReflectApply(
      capturedTextEncoderEncode,
      encoder,
      [body]
    )
    const encodedProfile = inspectFixedUint8Array(encodedRequest, true)
    const requestBodyByteLength = encodedProfile === null
      ? null
      : encodedProfile.byteLength

    if (
      encodedProfile === null ||
      requestBodyByteLength > MAX_REQUEST_BODY_BYTES
    ) {
      return null
    }

    return { body, internalRequest: internal.request }
  } catch {
    return null
  }
}

function createRequestArguments(body, signal) {
  try {
    const headers = createDataRecord(null, [
      ['Content-Type', 'application/json; charset=utf-8'],
    ])
    capturedObjectFreeze(headers)

    const requestInit = createDataRecord(null, [
      ['method', 'POST'],
      ['mode', 'cors'],
      ['credentials', 'omit'],
      ['cache', 'no-store'],
      ['redirect', 'error'],
      ['referrerPolicy', 'no-referrer'],
      ['keepalive', false],
      ['headers', headers],
      ['body', body],
      ['signal', signal],
    ])
    capturedObjectFreeze(requestInit)

    const contentTypeDescriptor =
      capturedObjectGetOwnPropertyDescriptor(headers, 'Content-Type')
    const methodDescriptor =
      capturedObjectGetOwnPropertyDescriptor(requestInit, 'method')
    const modeDescriptor =
      capturedObjectGetOwnPropertyDescriptor(requestInit, 'mode')
    const credentialsDescriptor =
      capturedObjectGetOwnPropertyDescriptor(requestInit, 'credentials')
    const cacheDescriptor =
      capturedObjectGetOwnPropertyDescriptor(requestInit, 'cache')
    const redirectDescriptor =
      capturedObjectGetOwnPropertyDescriptor(requestInit, 'redirect')
    const referrerPolicyDescriptor =
      capturedObjectGetOwnPropertyDescriptor(requestInit, 'referrerPolicy')
    const keepaliveDescriptor =
      capturedObjectGetOwnPropertyDescriptor(requestInit, 'keepalive')
    const headersDescriptor =
      capturedObjectGetOwnPropertyDescriptor(requestInit, 'headers')
    const bodyDescriptor =
      capturedObjectGetOwnPropertyDescriptor(requestInit, 'body')
    const signalDescriptor =
      capturedObjectGetOwnPropertyDescriptor(requestInit, 'signal')

    if (
      capturedObjectGetPrototypeOf(headers) !== null ||
      capturedObjectGetPrototypeOf(requestInit) !== null ||
      !capturedObjectIsFrozen(headers) ||
      !capturedObjectIsFrozen(requestInit) ||
      !hasExactKeySequence(
        capturedReflectOwnKeys(headers),
        REQUEST_HEADER_PROPERTY_NAMES
      ) ||
      !hasExactKeySequence(
        capturedReflectOwnKeys(requestInit),
        REQUEST_INIT_PROPERTY_NAMES
      ) ||
      !isFrozenDataDescriptorWithValue(
        contentTypeDescriptor,
        'application/json; charset=utf-8'
      ) ||
      !isFrozenDataDescriptorWithValue(methodDescriptor, 'POST') ||
      !isFrozenDataDescriptorWithValue(modeDescriptor, 'cors') ||
      !isFrozenDataDescriptorWithValue(credentialsDescriptor, 'omit') ||
      !isFrozenDataDescriptorWithValue(cacheDescriptor, 'no-store') ||
      !isFrozenDataDescriptorWithValue(redirectDescriptor, 'error') ||
      !isFrozenDataDescriptorWithValue(
        referrerPolicyDescriptor,
        'no-referrer'
      ) ||
      !isFrozenDataDescriptorWithValue(keepaliveDescriptor, false) ||
      !isFrozenDataDescriptorWithValue(headersDescriptor, headers) ||
      !isFrozenDataDescriptorWithValue(bodyDescriptor, body) ||
      !isFrozenDataDescriptorWithValue(signalDescriptor, signal)
    ) {
      return null
    }

    return { requestInit }
  } catch {
    return null
  }
}

function hasClosedPromiseProfile(candidate) {
  try {
    return isObjectLike(candidate) &&
      capturedObjectGetPrototypeOf(candidate) ===
        capturedPromisePrototype &&
      capturedObjectGetPrototypeOf(capturedPromisePrototype) ===
        capturedObjectPrototype &&
      capturedObjectGetPrototypeOf(capturedObjectPrototype) === null &&
      capturedReflectOwnKeys(candidate).length === 0 &&
      descriptorsAreEqual(
        capturedObjectGetOwnPropertyDescriptor(
          capturedPromisePrototype,
          'constructor'
        ),
        capturedPromiseConstructorDescriptor
      ) &&
      descriptorsAreEqual(
        capturedObjectGetOwnPropertyDescriptor(
          CapturedPromise,
          capturedSymbolSpecies
        ),
        capturedPromiseSpeciesDescriptor
      )
  } catch {
    return false
  }
}

function parseCanonicalContentLength(value) {
  if (typeof value !== 'string') {
    return null
  }

  if (value === '0') {
    return 0
  }

  if (value.length === 0 || value.length > 5) {
    return null
  }

  let parsed = 0

  for (let index = 0; index < value.length; index += 1) {
    const code = capturedReflectApply(capturedStringCharCodeAt, value, [index])

    if (
      code < 48 ||
      code > 57 ||
      (index === 0 && code === 48)
    ) {
      return null
    }

    parsed = (parsed * 10) + (code - 48)
  }

  return capturedNumberIsSafeInteger(parsed) &&
    parsed <= MAX_RESPONSE_BODY_BYTES
    ? parsed
    : null
}

function hasSafeFulfillmentRoot(value) {
  try {
    if (
      value === null ||
      (typeof value !== 'object' && typeof value !== 'function')
    ) {
      return true
    }

    if (typeof value === 'function') {
      return false
    }

    const validChain = capturedArrayIsArray(value)
      ? hasCurrentArrayChain(value)
      : hasCurrentOrdinaryObjectChain(value)

    if (
      !validChain ||
      capturedObjectGetOwnPropertyDescriptor(
        capturedObjectPrototype,
        'then'
      ) !== undefined ||
      capturedObjectGetOwnPropertyDescriptor(
        capturedArrayPrototype,
        'then'
      ) !== undefined
    ) {
      return false
    }

    const thenDescriptor = capturedObjectGetOwnPropertyDescriptor(
      value,
      'then'
    )

    return thenDescriptor === undefined ||
      (
        capturedObjectHasOwn(thenDescriptor, 'value') &&
        typeof thenDescriptor.value !== 'function'
      )
  } catch {
    return false
  }
}

function runSyncRequest(syncRequest, seams, resolve, reject) {
  let owner = 'active'
  let deadlineEnabled = false
  let timerHandle
  let hasTimerHandle = false
  let timerCleared = false
  let fetchStarted = false
  let controller
  let abortMethod
  let abortAttempted = false
  let reader
  let readMethod
  let cancelMethod
  let releaseLockMethod
  let readerOwned = false
  let cancelAttempted = false
  let releaseAttempted = false
  let declaredByteLength = 0
  let copiedByteLength = 0
  let responseBuffer

  function observeCleanupPromise(candidate) {
    try {
      if (!hasClosedPromiseProfile(candidate)) {
        return
      }

      capturedReflectApply(capturedPromiseThen, candidate, [
        function consumeCleanupFulfillment() {
          return undefined
        },
        function consumeCleanupRejection() {
          return undefined
        },
      ])
    } catch {
      return undefined
    }
  }

  function clearTimerOnce() {
    if (!hasTimerHandle || timerCleared) {
      return
    }

    timerCleared = true

    try {
      const cleanup = capturedReflectApply(
        seams.clearDeadlineTimer,
        undefined,
        [timerHandle]
      )
      observeCleanupPromise(cleanup)
    } catch {
      return undefined
    }
  }

  function abortOnce() {
    if (!fetchStarted || abortAttempted || typeof abortMethod !== 'function') {
      return
    }

    abortAttempted = true

    try {
      const cleanup = capturedReflectApply(abortMethod, controller, [])
      observeCleanupPromise(cleanup)
    } catch {
      return undefined
    }
  }

  function cancelOnce() {
    if (!readerOwned || cancelAttempted || typeof cancelMethod !== 'function') {
      return
    }

    cancelAttempted = true

    try {
      const cleanup = capturedReflectApply(cancelMethod, reader, [])
      observeCleanupPromise(cleanup)
    } catch {
      return undefined
    }
  }

  function releaseOnceBestEffort() {
    if (
      !readerOwned ||
      releaseAttempted ||
      typeof releaseLockMethod !== 'function'
    ) {
      return
    }

    releaseAttempted = true

    try {
      const cleanup = capturedReflectApply(releaseLockMethod, reader, [])
      observeCleanupPromise(cleanup)
    } catch {
      return undefined
    }
  }

  function transitionToFailure(nextOwner) {
    if (owner !== 'active') {
      return false
    }

    owner = nextOwner
    deadlineEnabled = false

    try {
      reject(BROWSER_SYNC_TRANSPORT_FAILURE)
    } catch {
      // The captured native reject function is not expected to throw.
    }

    abortOnce()
    cancelOnce()
    releaseOnceBestEffort()
    clearTimerOnce()
    return true
  }

  function fail() {
    try {
      transitionToFailure('transportFailure')
    } catch {
      return undefined
    }
  }

  function onDeadline() {
    try {
      if (owner === 'active' && deadlineEnabled) {
        transitionToFailure('deadline')
      }
    } catch {
      fail()
    }

    return undefined
  }

  function observeRequiredPromise(candidate, onFulfilled) {
    if (!hasClosedPromiseProfile(candidate)) {
      return false
    }

    try {
      capturedReflectApply(capturedPromiseThen, candidate, [
        function handleFulfillment(value) {
          if (owner !== 'active') {
            return undefined
          }

          try {
            onFulfilled(value)
          } catch {
            fail()
          }

          return undefined
        },
        function handleRejection() {
          if (owner !== 'active') {
            return undefined
          }

          try {
            fail()
          } catch {
            // The handler must always return a primitive value.
          }

          return undefined
        },
      ])
      return true
    } catch {
      return false
    }
  }

  function finishStream() {
    if (owner !== 'active') {
      return
    }

    let releaseCleanup
    releaseAttempted = true

    try {
      releaseCleanup = capturedReflectApply(
        releaseLockMethod,
        reader,
        []
      )
    } catch {
      fail()
      return
    }

    deadlineEnabled = false
    clearTimerOnce()
    observeCleanupPromise(releaseCleanup)

    if (owner !== 'active') {
      return
    }

    let parsed

    try {
      const decoderOptions = createDataRecord(capturedObjectPrototype, [
        ['fatal', true],
        ['ignoreBOM', true],
      ])
      capturedObjectFreeze(decoderOptions)
      const decoder = capturedReflectConstruct(CapturedTextDecoder, [
        'utf-8',
        decoderOptions,
      ])

      if (
        capturedObjectGetPrototypeOf(decoder) !==
          capturedTextDecoderPrototype ||
        capturedObjectGetPrototypeOf(capturedTextDecoderPrototype) !==
          capturedObjectPrototype ||
        capturedObjectGetPrototypeOf(capturedObjectPrototype) !== null
      ) {
        fail()
        return
      }

      const decoded = capturedReflectApply(
        capturedTextDecoderDecode,
        decoder,
        [responseBuffer]
      )

      if (typeof decoded !== 'string') {
        fail()
        return
      }

      parsed = capturedReflectApply(capturedJsonParse, capturedJsonObject, [
        decoded,
      ])
    } catch {
      fail()
      return
    }

    if (owner !== 'active' || !hasSafeFulfillmentRoot(parsed)) {
      fail()
      return
    }

    owner = 'success'

    try {
      resolve(parsed)
    } catch {
      // The guarded native resolution path is terminal.
    }
  }

  function handleReadResult(readResult) {
    if (owner !== 'active') {
      return
    }

    try {
      if (!isObjectLike(readResult)) {
        fail()
        return
      }

      const resultPrototype = capturedObjectGetPrototypeOf(readResult)
      if (owner !== 'active') return
      const resultOwnKeys = capturedReflectOwnKeys(readResult)

      if (
        owner !== 'active' ||
        resultPrototype !== capturedObjectPrototype ||
        capturedObjectGetPrototypeOf(capturedObjectPrototype) !== null ||
        !hasExactKeySequence(resultOwnKeys, ['value', 'done'])
      ) {
        fail()
        return
      }

      const doneDescriptor = capturedObjectGetOwnPropertyDescriptor(
        readResult,
        'done'
      )
      if (owner !== 'active') return
      const valueDescriptor = capturedObjectGetOwnPropertyDescriptor(
        readResult,
        'value'
      )

      if (
        owner !== 'active' ||
        !isEnumerableDataDescriptor(doneDescriptor) ||
        !isEnumerableDataDescriptor(valueDescriptor)
      ) {
        fail()
        return
      }

      if (doneDescriptor.value === true) {
        if (
          valueDescriptor.value !== undefined ||
          copiedByteLength !== declaredByteLength
        ) {
          fail()
          return
        }

        finishStream()
        return
      }

      if (doneDescriptor.value !== false) {
        fail()
        return
      }

      const chunkProfile = inspectFixedUint8Array(
        valueDescriptor.value,
        true
      )

      if (
        owner !== 'active' ||
        chunkProfile === null ||
        chunkProfile.byteLength > MAX_RESPONSE_BODY_BYTES ||
        chunkProfile.byteLength >
          (MAX_RESPONSE_BODY_BYTES - copiedByteLength) ||
        chunkProfile.byteLength >
          (declaredByteLength - copiedByteLength)
      ) {
        fail()
        return
      }

      capturedReflectApply(capturedTypedArraySet, responseBuffer, [
        valueDescriptor.value,
        copiedByteLength,
      ])
      copiedByteLength += chunkProfile.byteLength
      requestNextRead()
    } catch {
      fail()
    }
  }

  function requestNextRead() {
    if (owner !== 'active') {
      return
    }

    let readPromise

    try {
      readPromise = capturedReflectApply(readMethod, reader, [])
    } catch {
      fail()
      return
    }

    if (!observeRequiredPromise(readPromise, handleReadResult)) {
      if (owner === 'active') {
        fail()
      }
    }
  }

  function handleResponse(response) {
    if (owner !== 'active') {
      return
    }

    try {
      const status = capturedReflectGet(response, 'status', response)
      if (owner !== 'active') return
      if (status !== 200) {
        fail()
        return
      }

      const redirected = capturedReflectGet(response, 'redirected', response)
      if (owner !== 'active') return
      if (redirected !== false) {
        fail()
        return
      }

      const url = capturedReflectGet(response, 'url', response)
      if (owner !== 'active') return
      if (url !== FIXED_ENDPOINT) {
        fail()
        return
      }

      const type = capturedReflectGet(response, 'type', response)
      if (owner !== 'active') return
      if (type !== 'cors') {
        fail()
        return
      }

      const headers = capturedReflectGet(response, 'headers', response)
      if (owner !== 'active') return
      const headerGet = capturedReflectGet(headers, 'get', headers)
      if (owner !== 'active') return
      if (typeof headerGet !== 'function') {
        fail()
        return
      }

      const contentType = capturedReflectApply(headerGet, headers, [
        'content-type',
      ])
      if (owner !== 'active') return
      if (contentType !== 'application/json; charset=utf-8') {
        fail()
        return
      }

      const contentLengthValue = capturedReflectApply(headerGet, headers, [
        'content-length',
      ])
      if (owner !== 'active') return
      const parsedContentLength = parseCanonicalContentLength(
        contentLengthValue
      )
      if (parsedContentLength === null) {
        fail()
        return
      }

      const contentEncoding = capturedReflectApply(headerGet, headers, [
        'content-encoding',
      ])
      if (owner !== 'active') return
      if (contentEncoding !== null) {
        fail()
        return
      }

      const body = capturedReflectGet(response, 'body', response)
      if (owner !== 'active') return
      const getReader = capturedReflectGet(body, 'getReader', body)
      if (owner !== 'active') return
      if (typeof getReader !== 'function') {
        fail()
        return
      }

      const candidateReader = capturedReflectApply(getReader, body, [])
      reader = candidateReader
      readerOwned = true
      let methodResolutionFailed = false

      try {
        readMethod = capturedReflectGet(reader, 'read', reader)
      } catch {
        methodResolutionFailed = true
      }

      try {
        cancelMethod = capturedReflectGet(reader, 'cancel', reader)
      } catch {
        methodResolutionFailed = true
      }

      try {
        releaseLockMethod = capturedReflectGet(
          reader,
          'releaseLock',
          reader
        )
      } catch {
        methodResolutionFailed = true
      }

      if (
        methodResolutionFailed ||
        typeof readMethod !== 'function' ||
        typeof cancelMethod !== 'function' ||
        typeof releaseLockMethod !== 'function'
      ) {
        if (owner === 'active') {
          fail()
        } else {
          cancelOnce()
          releaseOnceBestEffort()
        }
        return
      }

      if (owner !== 'active') {
        cancelOnce()
        releaseOnceBestEffort()
        return
      }

      declaredByteLength = parsedContentLength
      responseBuffer = capturedReflectConstruct(CapturedUint8Array, [
        declaredByteLength,
      ])

      if (
        inspectFixedUint8Array(
          responseBuffer,
          declaredByteLength > 0
        ) === null
      ) {
        fail()
        return
      }

      requestNextRead()
    } catch {
      fail()
    }
  }

  const snapshot = snapshotRequest(syncRequest)

  if (snapshot === null) {
    fail()
    return
  }

  const serializedRequest = createSerializedRequest(snapshot)

  if (serializedRequest === null) {
    fail()
    return
  }

  try {
    controller = capturedReflectApply(
      seams.createAbortController,
      undefined,
      []
    )
    const signal = capturedReflectGet(controller, 'signal', controller)
    abortMethod = capturedReflectGet(controller, 'abort', controller)

    if (typeof abortMethod !== 'function') {
      fail()
      return
    }

    const requestArguments = createRequestArguments(
      serializedRequest.body,
      signal
    )

    if (requestArguments === null) {
      fail()
      return
    }

    deadlineEnabled = true

    try {
      timerHandle = capturedReflectApply(
        seams.setDeadlineTimer,
        undefined,
        [onDeadline, DEADLINE_MILLISECONDS]
      )

      if (timerHandle !== undefined) {
        hasTimerHandle = true
      }
    } catch {
      if (owner === 'active') {
        fail()
      }
      return
    }

    if (owner !== 'active') {
      clearTimerOnce()
      return
    }

    let fetchPromise

    try {
      fetchStarted = true
      fetchPromise = capturedReflectApply(
        seams.fetchRequest,
        undefined,
        [FIXED_ENDPOINT, requestArguments.requestInit]
      )
    } catch {
      if (owner === 'active') {
        fail()
      }
      return
    }

    if (!observeRequiredPromise(fetchPromise, handleResponse)) {
      if (owner === 'active') {
        fail()
      }
    }
  } catch {
    fail()
  }
}

export function createBrowserSyncTransport(composition) {
  let seams

  try {
    if (arguments.length === 0) {
      seams = createDefaultSeams()
    } else if (arguments.length === 1 && composition !== undefined) {
      if (!runtimeIntrinsicsAreUsable()) {
        throw createFactoryError()
      }

      seams = snapshotComposition(composition)
    } else {
      throw createFactoryError()
    }

    if (seams === null) {
      throw createFactoryError()
    }
  } catch {
    throw createFactoryError()
  }

  function sendSyncRequest(syncRequest) {
    const argumentCount = arguments.length

    return new CapturedPromise((resolve, reject) => {
      try {
        if (argumentCount !== 1) {
          reject(BROWSER_SYNC_TRANSPORT_FAILURE)
          return
        }

        runSyncRequest(syncRequest, seams, resolve, reject)
      } catch {
        reject(BROWSER_SYNC_TRANSPORT_FAILURE)
      }
    })
  }

  try {
    return freezeOrdinaryRecord([
      ['sendSyncRequest', sendSyncRequest],
    ])
  } catch {
    throw createFactoryError()
  }
}
