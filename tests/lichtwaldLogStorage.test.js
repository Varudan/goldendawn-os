import assert from 'node:assert/strict'
import test from 'node:test'

import { createStorageAdapter } from '../src/storage/storageAdapter.js'
import {
  createLichtwaldLogStorage,
  LICHTWALD_LOG_MAX_SERIALIZED_LENGTH,
  LICHTWALD_LOG_STORAGE_KEY,
} from '../src/storage/lichtwaldLogStorage.js'
import { FakeStorage } from './helpers/fakeStorage.js'

function createEntry(overrides = {}) {
  return {
    id: 'fixture-entry-aurora-1',
    calendarDate: '2026-08-03',
    title: 'Erfundener Aurora-Testmoment',
    text: 'Diese Notiz ist eine vollständig erfundene Storage-Testfixture.',
    tags: ['Testnebel', 'Fiktiv'],
    ...overrides,
  }
}

function createPrivateLog(entries = [createEntry()], overrides = {}) {
  return {
    schemaVersion: 1,
    dataOrigin: 'private',
    featuredEntryId: entries[0]?.id ?? null,
    entries,
    ...overrides,
  }
}

function createSyntheticLog(entries = [createEntry()], overrides = {}) {
  return createPrivateLog(entries, {
    dataOrigin: 'synthetic',
    ...overrides,
  })
}

function createStorageSystem(initialRawValue) {
  const initialEntries = initialRawValue === undefined
    ? []
    : [[LICHTWALD_LOG_STORAGE_KEY, initialRawValue]]
  const fakeStorage = new FakeStorage(initialEntries)
  const lichtwaldLogStorage = createLichtwaldLogStorage(
    createStorageAdapter(fakeStorage)
  )

  return { fakeStorage, lichtwaldLogStorage }
}

function assertFailure(result, status, code) {
  assert.equal(result.ok, false)
  assert.equal(result.status, status)
  assert.equal(result.error.code, code)
  assert.equal(typeof result.error.message, 'string')
  assert.ok(result.error.message.length > 0)
}

function assertDoesNotContain(result, markers) {
  const serializedResult = JSON.stringify(result)

  for (const marker of markers) {
    assert.equal(
      serializedResult.includes(marker),
      false,
      `Fehlerresultat enthält redigierungspflichtigen Marker: ${marker}`
    )
  }
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Reflect.ownKeys(value).forEach((key) => deepFreeze(value[key]))
    Object.freeze(value)
  }

  return value
}

function createAdapterFailure(status, code, message) {
  return {
    ok: false,
    status,
    error: { code, message },
  }
}

function createUnexpectedResult() {
  return {
    ok: false,
    status: 'storageFailed',
    error: {
      code: 'unexpectedStorageResult',
      message: 'Der Storage-Adapter hat kein verwertbares Ergebnis geliefert.',
    },
  }
}

test('verwendet ausschließlich festen Key und Limit sowie eine eingefrorene Zwei-Methoden-API', () => {
  const readCalls = []
  const writeCalls = []
  const storage = createLichtwaldLogStorage({
    readJson(key, options) {
      readCalls.push({ key, options })
      return { ok: true, status: 'missing' }
    },
    writeJson(key, value, options) {
      writeCalls.push({ key, value, options })
      return { ok: true, status: 'saved' }
    },
  })

  const loadResult = storage.loadLichtwaldLog()
  const privateLog = createPrivateLog()
  const saveResult = storage.saveLichtwaldLog(privateLog)

  assert.equal(
    LICHTWALD_LOG_STORAGE_KEY,
    'goldendawn.lichtwaldLog.content.v1'
  )
  assert.equal(LICHTWALD_LOG_MAX_SERIALIZED_LENGTH, 500_000)
  assert.equal(loadResult.status, 'missing')
  assert.deepEqual(saveResult, { ok: true, status: 'saved' })
  assert.deepEqual(Object.keys(storage).sort(), [
    'loadLichtwaldLog',
    'saveLichtwaldLog',
  ])
  assert.equal(Object.isFrozen(storage), true)
  assert.equal(readCalls.length, 2)
  assert.equal(writeCalls.length, 1)

  for (const call of [...readCalls, ...writeCalls]) {
    assert.equal(call.key, LICHTWALD_LOG_STORAGE_KEY)
    assert.deepEqual(call.options, {
      maxSerializedLength: LICHTWALD_LOG_MAX_SERIALIZED_LENGTH,
    })
    assert.equal(Object.isFrozen(call.options), true)
  }

  assert.deepEqual(writeCalls[0].value, privateLog)
  assert.notStrictEqual(writeCalls[0].value, privateLog)
})

test('liefert bei missing immer einen frischen privaten Leerzustand ohne Schreibzugriff', () => {
  const { fakeStorage, lichtwaldLogStorage } = createStorageSystem()

  const firstResult = lichtwaldLogStorage.loadLichtwaldLog()
  firstResult.lichtwaldLog.entries.push(createEntry())
  firstResult.lichtwaldLog.featuredEntryId = 'fixture-mutated-focus'
  const secondResult = lichtwaldLogStorage.loadLichtwaldLog()

  assert.deepEqual(secondResult, {
    ok: true,
    status: 'missing',
    lichtwaldLog: {
      schemaVersion: 1,
      dataOrigin: 'private',
      featuredEntryId: null,
      entries: [],
    },
  })
  assert.notStrictEqual(firstResult.lichtwaldLog, secondResult.lichtwaldLog)
  assert.notStrictEqual(
    firstResult.lichtwaldLog.entries,
    secondResult.lichtwaldLog.entries
  )
  assert.equal(fakeStorage.getItemCalls, 2)
  assert.equal(fakeStorage.setItemCalls, 0)
  assert.equal(fakeStorage.peek(LICHTWALD_LOG_STORAGE_KEY), null)
})

test('lädt einen gültigen privaten Snapshot vollständig und tief defensiv geklont', () => {
  const storedLog = createPrivateLog([
    createEntry(),
    createEntry({
      id: 'fixture-entry-spectrum-2',
      calendarDate: '2026-08-04',
      title: 'Erfundener Spektrum-Testmoment',
      text: 'Auch dieser zweite Inhalt ist ausschließlich synthetisch erfunden.',
      tags: ['Spektrum', 'NurTest'],
    }),
  ])
  const storedSnapshot = structuredClone(storedLog)
  const storage = createLichtwaldLogStorage({
    readJson() {
      return { ok: true, status: 'found', value: storedLog }
    },
  })

  const result = storage.loadLichtwaldLog()

  assert.deepEqual(result, {
    ok: true,
    status: 'found',
    lichtwaldLog: storedSnapshot,
  })
  assert.notStrictEqual(result.lichtwaldLog, storedLog)
  assert.notStrictEqual(result.lichtwaldLog.entries, storedLog.entries)
  assert.notStrictEqual(result.lichtwaldLog.entries[0], storedLog.entries[0])
  assert.notStrictEqual(
    result.lichtwaldLog.entries[0].tags,
    storedLog.entries[0].tags
  )

  result.lichtwaldLog.featuredEntryId = null
  result.lichtwaldLog.entries[0].title = 'Nur die Rückgabekopie wurde geändert.'
  result.lichtwaldLog.entries[0].tags.push('NurRückgabe')
  assert.deepEqual(storedLog, storedSnapshot)
})

test('speichert den vollständigen tiefen Clone ohne Eingabemutation', () => {
  const privateLog = createPrivateLog()
  const inputSnapshot = structuredClone(privateLog)
  let writtenLog
  let readCalls = 0
  let writeCalls = 0
  const storage = createLichtwaldLogStorage({
    readJson() {
      readCalls += 1
      return { ok: true, status: 'missing' }
    },
    writeJson(key, value, options) {
      writeCalls += 1
      assert.equal(key, LICHTWALD_LOG_STORAGE_KEY)
      assert.equal(
        options.maxSerializedLength,
        LICHTWALD_LOG_MAX_SERIALIZED_LENGTH
      )
      writtenLog = value
      return { ok: true, status: 'saved' }
    },
  })

  const result = storage.saveLichtwaldLog(privateLog)

  assert.deepEqual(result, { ok: true, status: 'saved' })
  assert.equal(readCalls, 1)
  assert.equal(writeCalls, 1)
  assert.deepEqual(writtenLog, privateLog)
  assert.notStrictEqual(writtenLog, privateLog)
  assert.notStrictEqual(writtenLog.entries, privateLog.entries)
  assert.notStrictEqual(writtenLog.entries[0], privateLog.entries[0])
  assert.notStrictEqual(writtenLog.entries[0].tags, privateLog.entries[0].tags)

  writtenLog.featuredEntryId = null
  writtenLog.entries[0].text = 'Nur der an den Adapter gereichte Clone.'
  writtenLog.entries[0].tags.push('NurAdapter')
  assert.deepEqual(privateLog, inputSnapshot)
})

test('führt vor einem Full-Snapshot-Write genau einen Read-Preflight aus', () => {
  const existingLog = createPrivateLog([
    createEntry({
      id: 'fixture-existing-entry-1',
      title: 'Erfundener bestehender Testmoment',
    }),
  ])
  const replacementLog = createPrivateLog([
    createEntry({
      id: 'fixture-replacement-entry-1',
      title: 'Erfundener ersetzender Testmoment',
    }),
  ])
  const calls = []
  let writtenLog
  const storage = createLichtwaldLogStorage({
    readJson(key, options) {
      calls.push(['read', key, options.maxSerializedLength])
      return { ok: true, status: 'found', value: existingLog }
    },
    writeJson(key, value, options) {
      calls.push(['write', key, options.maxSerializedLength])
      writtenLog = value
      return { ok: true, status: 'saved' }
    },
  })

  assert.deepEqual(storage.saveLichtwaldLog(replacementLog), {
    ok: true,
    status: 'saved',
  })
  assert.deepEqual(calls, [
    ['read', LICHTWALD_LOG_STORAGE_KEY, 500_000],
    ['write', LICHTWALD_LOG_STORAGE_KEY, 500_000],
  ])
  assert.deepEqual(writtenLog, replacementLog)
  assert.notStrictEqual(writtenLog, replacementLog)
})

test('weist synthetische Snapshots an Load- und Save-Grenze private-only zurück', () => {
  const syntheticLog = createSyntheticLog()
  const rawValue = JSON.stringify(syntheticLog)
  const { fakeStorage, lichtwaldLogStorage } = createStorageSystem(rawValue)

  const loadResult = lichtwaldLogStorage.loadLichtwaldLog()
  const saveResult = lichtwaldLogStorage.saveLichtwaldLog(syntheticLog)

  assertFailure(
    loadResult,
    'invalidStoredData',
    'privateLichtwaldLogRequired'
  )
  assertFailure(
    saveResult,
    'validationFailed',
    'privateLichtwaldLogRequired'
  )
  assert.equal(fakeStorage.peek(LICHTWALD_LOG_STORAGE_KEY), rawValue)
  assert.equal(fakeStorage.getItemCalls, 1)
  assert.equal(fakeStorage.setItemCalls, 0)
})

test('prüft die private Herkunft nach dem defensiven Clone erneut', () => {
  function createSwitchingLog() {
    const switchingLog = createPrivateLog()
    let originReads = 0

    Object.defineProperty(switchingLog, 'dataOrigin', {
      configurable: true,
      enumerable: true,
      get() {
        originReads += 1
        return originReads <= 2 ? 'private' : 'synthetic'
      },
    })

    return { switchingLog, getOriginReads: () => originReads }
  }

  const loadFixture = createSwitchingLog()
  const loadStorage = createLichtwaldLogStorage({
    readJson() {
      return {
        ok: true,
        status: 'found',
        value: loadFixture.switchingLog,
      }
    },
  })
  const loadResult = loadStorage.loadLichtwaldLog()

  assertFailure(
    loadResult,
    'invalidStoredData',
    'privateLichtwaldLogRequired'
  )
  assert.equal(loadFixture.getOriginReads(), 3)

  const saveFixture = createSwitchingLog()
  let readCalls = 0
  let writeCalls = 0
  const saveStorage = createLichtwaldLogStorage({
    readJson() {
      readCalls += 1
      return { ok: true, status: 'missing' }
    },
    writeJson() {
      writeCalls += 1
      return { ok: true, status: 'saved' }
    },
  })
  const saveResult = saveStorage.saveLichtwaldLog(saveFixture.switchingLog)

  assertFailure(
    saveResult,
    'validationFailed',
    'privateLichtwaldLogRequired'
  )
  assert.equal(saveFixture.getOriginReads(), 3)
  assert.equal(readCalls, 0)
  assert.equal(writeCalls, 0)
})

test('klassifiziert beschädigtes JSON, falsches Schema, Fokusfehler und Vertragsfehler stabil', () => {
  const invalidFocusLog = createPrivateLog([], {
    featuredEntryId: 'fixture-orphan-focus-sentinel',
  })
  const extraFieldLog = createPrivateLog()
  extraFieldLog.fixtureUnsupportedField = 'fixture-private-extra-sentinel'
  const cases = [
    {
      rawValue: '{fixture-broken-json-sentinel',
      status: 'invalidJson',
      code: 'invalidJson',
    },
    {
      rawValue: JSON.stringify(createPrivateLog([], {
        schemaVersion: 7,
        featuredEntryId: null,
      })),
      status: 'invalidStoredData',
      code: 'invalidLichtwaldLogData',
    },
    {
      rawValue: JSON.stringify(invalidFocusLog),
      status: 'invalidStoredData',
      code: 'invalidLichtwaldLogData',
    },
    {
      rawValue: JSON.stringify(extraFieldLog),
      status: 'invalidStoredData',
      code: 'invalidLichtwaldLogData',
    },
  ]

  for (const testCase of cases) {
    const { fakeStorage, lichtwaldLogStorage } = createStorageSystem(
      testCase.rawValue
    )
    const result = lichtwaldLogStorage.loadLichtwaldLog()

    assertFailure(result, testCase.status, testCase.code)
    assert.equal(
      fakeStorage.peek(LICHTWALD_LOG_STORAGE_KEY),
      testCase.rawValue
    )
    assert.equal(fakeStorage.setItemCalls, 0)
  }
})

test('überschreibt beschädigte, synthetische oder inkompatible Bestände im Preflight nicht', () => {
  const protectedRawValues = [
    '{fixture-protected-broken-json',
    JSON.stringify(createSyntheticLog()),
    JSON.stringify(createPrivateLog([], {
      schemaVersion: 91,
      featuredEntryId: null,
    })),
    JSON.stringify(createPrivateLog([], {
      featuredEntryId: 'fixture-protected-orphan-focus',
    })),
  ]

  for (const protectedRawValue of protectedRawValues) {
    const { fakeStorage, lichtwaldLogStorage } = createStorageSystem(
      protectedRawValue
    )
    const result = lichtwaldLogStorage.saveLichtwaldLog(createPrivateLog())

    assert.equal(result.ok, false)
    assert.equal(
      ['invalidJson', 'invalidStoredData'].includes(result.status),
      true
    )
    assert.equal(
      fakeStorage.peek(LICHTWALD_LOG_STORAGE_KEY),
      protectedRawValue
    )
    assert.equal(fakeStorage.getItemCalls, 1)
    assert.equal(fakeStorage.setItemCalls, 0)
  }
})

test('parst oder überschreibt einen übergroßen Raw-Bestand weder beim Load noch im Save-Preflight', () => {
  const oversizedRawValue = `{${'x'.repeat(
    LICHTWALD_LOG_MAX_SERIALIZED_LENGTH
  )}`
  assert.equal(
    oversizedRawValue.length,
    LICHTWALD_LOG_MAX_SERIALIZED_LENGTH + 1
  )
  const { fakeStorage, lichtwaldLogStorage } = createStorageSystem(
    oversizedRawValue
  )

  const loadResult = lichtwaldLogStorage.loadLichtwaldLog()
  const saveResult = lichtwaldLogStorage.saveLichtwaldLog(createPrivateLog())

  for (const result of [loadResult, saveResult]) {
    assertFailure(
      result,
      'sizeLimitExceeded',
      'storageSizeLimitExceeded'
    )
  }
  assert.equal(fakeStorage.getItemCalls, 2)
  assert.equal(fakeStorage.setItemCalls, 0)
  assert.equal(
    fakeStorage.peek(LICHTWALD_LOG_STORAGE_KEY),
    oversizedRawValue
  )
})

test('sanitisiert alle bekannten Adapterfehler mit eigener statischer Meldung', () => {
  const foreignMessage = 'fixture-foreign-adapter-message-sentinel'
  const readFailures = [
    ['invalidKey', 'invalidStorageKey'],
    ['invalidLimit', 'invalidStorageLimit'],
    ['unavailable', 'storageUnavailable'],
    ['readFailed', 'storageReadFailed'],
    ['invalidJson', 'invalidJson'],
    ['sizeLimitExceeded', 'storageSizeLimitExceeded'],
  ]
  const writeFailures = [
    ['invalidKey', 'invalidStorageKey'],
    ['invalidLimit', 'invalidStorageLimit'],
    ['unavailable', 'storageUnavailable'],
    ['serializationFailed', 'serializationFailed'],
    ['sizeLimitExceeded', 'storageSizeLimitExceeded'],
    ['quotaExceeded', 'storageQuotaExceeded'],
    ['writeFailed', 'storageWriteFailed'],
  ]

  for (const [status, code] of readFailures) {
    const result = createLichtwaldLogStorage({
      readJson() {
        return createAdapterFailure(status, code, foreignMessage)
      },
    }).loadLichtwaldLog()

    assertFailure(result, status, code)
    assertDoesNotContain(result, [foreignMessage])
  }

  for (const [status, code] of writeFailures) {
    const result = createLichtwaldLogStorage({
      readJson() {
        return { ok: true, status: 'missing' }
      },
      writeJson() {
        return createAdapterFailure(status, code, foreignMessage)
      },
    }).saveLichtwaldLog(createPrivateLog())

    assertFailure(result, status, code)
    assertDoesNotContain(result, [foreignMessage])
  }
})

test('weist unbekannte String- und Symbolfelder in allen Adapterresultat-Ebenen zurück', () => {
  const privateMarker = 'fixture-unknown-result-field-sentinel'
  const readSymbol = Symbol('fixture-read-result-symbol-sentinel')
  const writeSymbol = Symbol('fixture-write-result-symbol-sentinel')
  const readResults = [
    {
      ok: true,
      status: 'missing',
      fixtureUnknown: privateMarker,
    },
    {
      ok: true,
      status: 'found',
      value: createPrivateLog(),
      [readSymbol]: privateMarker,
    },
    {
      ...createAdapterFailure(
        'readFailed',
        'storageReadFailed',
        privateMarker
      ),
      fixtureUnknown: privateMarker,
    },
    {
      ok: false,
      status: 'readFailed',
      error: {
        code: 'storageReadFailed',
        message: privateMarker,
        fixtureUnknown: privateMarker,
      },
    },
    {
      ok: false,
      status: 'readFailed',
      error: {
        code: 'storageReadFailed',
        message: privateMarker,
        [readSymbol]: privateMarker,
      },
    },
  ]

  for (const adapterResult of readResults) {
    const result = createLichtwaldLogStorage({
      readJson() {
        return adapterResult
      },
    }).loadLichtwaldLog()

    assert.deepEqual(result, createUnexpectedResult())
    assertDoesNotContain(result, [privateMarker])
  }

  const writeResults = [
    { ok: true, status: 'saved', fixtureUnknown: privateMarker },
    { ok: true, status: 'saved', [writeSymbol]: privateMarker },
    {
      ...createAdapterFailure(
        'writeFailed',
        'storageWriteFailed',
        privateMarker
      ),
      fixtureUnknown: privateMarker,
    },
    {
      ok: false,
      status: 'writeFailed',
      error: {
        code: 'storageWriteFailed',
        message: privateMarker,
        [writeSymbol]: privateMarker,
      },
    },
  ]

  for (const adapterResult of writeResults) {
    const result = createLichtwaldLogStorage({
      readJson() {
        return { ok: true, status: 'missing' }
      },
      writeJson() {
        return adapterResult
      },
    }).saveLichtwaldLog(createPrivateLog())

    assert.deepEqual(result, createUnexpectedResult())
    assertDoesNotContain(result, [privateMarker])
  }
})

test('weist operationsfremde bekannte Adapterfehler als unerwartet zurück', () => {
  const privateMarker = 'fixture-operation-mismatch-message-sentinel'
  const readForeignFailures = [
    ['serializationFailed', 'serializationFailed'],
    ['quotaExceeded', 'storageQuotaExceeded'],
    ['writeFailed', 'storageWriteFailed'],
  ]
  const writeForeignFailures = [
    ['readFailed', 'storageReadFailed'],
    ['invalidJson', 'invalidJson'],
  ]

  for (const [status, code] of readForeignFailures) {
    const result = createLichtwaldLogStorage({
      readJson() {
        return createAdapterFailure(status, code, privateMarker)
      },
    }).loadLichtwaldLog()

    assert.deepEqual(result, createUnexpectedResult())
    assertDoesNotContain(result, [privateMarker])
  }

  for (const [status, code] of writeForeignFailures) {
    const result = createLichtwaldLogStorage({
      readJson() {
        return { ok: true, status: 'missing' }
      },
      writeJson() {
        return createAdapterFailure(status, code, privateMarker)
      },
    }).saveLichtwaldLog(createPrivateLog())

    assert.deepEqual(result, createUnexpectedResult())
    assertDoesNotContain(result, [privateMarker])
  }
})

test('normalisiert geworfene, unbekannte und widersprüchliche Read-Resultate', () => {
  const privateMarker = 'fixture-malformed-read-adapter-sentinel'
  const inheritedResult = Object.create({ ok: true, status: 'missing' })
  const customPrototypeResult = Object.assign(
    Object.create({ inheritedFixture: true }),
    { ok: true, status: 'missing' }
  )
  const inheritedError = Object.create({
    code: 'storageReadFailed',
    message: privateMarker,
  })
  const malformedReaders = [
    () => {
      throw new Error(privateMarker)
    },
    () => null,
    () => ({ ok: true, status: 'found' }),
    () => ({ ok: true, status: 'missing', value: createPrivateLog() }),
    () => ({
      ok: true,
      status: 'missing',
      error: { code: 'storageReadFailed', message: privateMarker },
    }),
    () => createAdapterFailure(
      'readFailed',
      'fixtureUnknownAdapterCode',
      privateMarker
    ),
    () => createAdapterFailure(
      'quotaExceeded',
      'storageReadFailed',
      privateMarker
    ),
    () => ({
      ok: false,
      status: 'readFailed',
      error: inheritedError,
    }),
    () => ({
      ok: false,
      status: 'readFailed',
      error: { code: 'storageReadFailed' },
    }),
    () => inheritedResult,
    () => customPrototypeResult,
  ]

  for (const readJson of malformedReaders) {
    const result = createLichtwaldLogStorage({ readJson }).loadLichtwaldLog()

    assert.deepEqual(result, createUnexpectedResult())
    assertDoesNotContain(result, [privateMarker])
  }
})

test('weist getterbasierte Adapterresultate zurück, ohne Getter auszuführen', () => {
  const privateMarker = 'fixture-result-getter-message-sentinel'
  let okGetterCalls = 0
  const okGetterResult = { status: 'missing' }
  Object.defineProperty(okGetterResult, 'ok', {
    enumerable: true,
    get() {
      okGetterCalls += 1
      return true
    },
  })

  let valueGetterCalls = 0
  const valueGetterResult = { ok: true, status: 'found' }
  Object.defineProperty(valueGetterResult, 'value', {
    enumerable: true,
    get() {
      valueGetterCalls += 1
      throw new Error(privateMarker)
    },
  })

  let codeGetterCalls = 0
  const getterError = { message: privateMarker }
  Object.defineProperty(getterError, 'code', {
    enumerable: true,
    get() {
      codeGetterCalls += 1
      return 'storageReadFailed'
    },
  })
  const errorGetterResult = {
    ok: false,
    status: 'readFailed',
    error: getterError,
  }

  for (const adapterResult of [
    okGetterResult,
    valueGetterResult,
    errorGetterResult,
  ]) {
    const result = createLichtwaldLogStorage({
      readJson() {
        return adapterResult
      },
    }).loadLichtwaldLog()

    assert.deepEqual(result, createUnexpectedResult())
    assertDoesNotContain(result, [privateMarker])
  }

  assert.equal(okGetterCalls, 0)
  assert.equal(valueGetterCalls, 0)
  assert.equal(codeGetterCalls, 0)
})

test('lässt aus einem widerrufenen Proxy-Adapterresultat keine Exception entkommen', () => {
  const revocableResult = Proxy.revocable(
    { ok: true, status: 'missing' },
    {}
  )
  revocableResult.revoke()
  let result

  assert.doesNotThrow(() => {
    result = createLichtwaldLogStorage({
      readJson() {
        return revocableResult.proxy
      },
    }).loadLichtwaldLog()
  })
  assert.deepEqual(result, createUnexpectedResult())
})

test('normalisiert geworfene und formal widersprüchliche Write-Resultate', () => {
  const privateMarker = 'fixture-malformed-write-adapter-sentinel'
  const inheritedError = Object.create({
    code: 'storageWriteFailed',
    message: privateMarker,
  })
  const malformedWriters = [
    () => {
      throw new Error(privateMarker)
    },
    () => null,
    () => ({ ok: true, status: 'found' }),
    () => ({ ok: true, status: 'saved', value: createPrivateLog() }),
    () => ({
      ok: true,
      status: 'saved',
      error: { code: 'storageWriteFailed', message: privateMarker },
    }),
    () => ({
      ok: false,
      status: 'writeFailed',
      value: createPrivateLog(),
      error: { code: 'storageWriteFailed', message: privateMarker },
    }),
    () => createAdapterFailure(
      'readFailed',
      'storageWriteFailed',
      privateMarker
    ),
    () => ({
      ok: false,
      status: 'writeFailed',
      error: inheritedError,
    }),
    () => Object.create({ ok: true, status: 'saved' }),
  ]

  for (const writeJson of malformedWriters) {
    const result = createLichtwaldLogStorage({
      readJson() {
        return { ok: true, status: 'missing' }
      },
      writeJson,
    }).saveLichtwaldLog(createPrivateLog())

    assert.deepEqual(result, createUnexpectedResult())
    assertDoesNotContain(result, [privateMarker])
  }
})

test('weist getterbasierte Write-Resultate zurück, ohne Getter auszuführen', () => {
  const privateMarker = 'fixture-write-getter-message-sentinel'
  let statusGetterCalls = 0
  const statusGetterResult = { ok: true }
  Object.defineProperty(statusGetterResult, 'status', {
    enumerable: true,
    get() {
      statusGetterCalls += 1
      return 'saved'
    },
  })

  let errorGetterCalls = 0
  const errorGetterResult = { ok: false, status: 'writeFailed' }
  Object.defineProperty(errorGetterResult, 'error', {
    enumerable: true,
    get() {
      errorGetterCalls += 1
      throw new Error(privateMarker)
    },
  })

  let messageGetterCalls = 0
  const messageGetterError = { code: 'storageWriteFailed' }
  Object.defineProperty(messageGetterError, 'message', {
    enumerable: true,
    get() {
      messageGetterCalls += 1
      return privateMarker
    },
  })
  const messageGetterResult = {
    ok: false,
    status: 'writeFailed',
    error: messageGetterError,
  }

  for (const adapterResult of [
    statusGetterResult,
    errorGetterResult,
    messageGetterResult,
  ]) {
    const result = createLichtwaldLogStorage({
      readJson() {
        return { ok: true, status: 'missing' }
      },
      writeJson() {
        return adapterResult
      },
    }).saveLichtwaldLog(createPrivateLog())

    assert.deepEqual(result, createUnexpectedResult())
    assertDoesNotContain(result, [privateMarker])
  }

  assert.equal(statusGetterCalls, 0)
  assert.equal(errorGetterCalls, 0)
  assert.equal(messageGetterCalls, 0)
})

test('lässt aus feindlichen Proxy-Resultaten im Write-Pfad keine Exception entkommen', () => {
  const privateMarker = 'fixture-write-proxy-exception-sentinel'
  const revocableResult = Proxy.revocable(
    { ok: true, status: 'saved' },
    {}
  )
  revocableResult.revoke()
  const ownKeysThrowingResult = new Proxy(
    { ok: true, status: 'saved' },
    {
      ownKeys() {
        throw new Error(privateMarker)
      },
    }
  )
  const descriptorThrowingResult = new Proxy(
    { ok: true, status: 'saved' },
    {
      getOwnPropertyDescriptor() {
        throw new Error(privateMarker)
      },
    }
  )

  for (const adapterResult of [
    revocableResult.proxy,
    ownKeysThrowingResult,
    descriptorThrowingResult,
  ]) {
    let result

    assert.doesNotThrow(() => {
      result = createLichtwaldLogStorage({
        readJson() {
          return { ok: true, status: 'missing' }
        },
        writeJson() {
          return adapterResult
        },
      }).saveLichtwaldLog(createPrivateLog())
    })
    assert.deepEqual(result, createUnexpectedResult())
    assertDoesNotContain(result, [privateMarker])
  }
})

test('meldet fehlende Adaptermethoden erst nach vollständiger Kandidatenvalidierung', () => {
  const validLog = createPrivateLog()
  const invalidLog = createPrivateLog()
  invalidLog.fixtureExtraField = 'fixture-invalid-before-adapter-sentinel'
  let readCalls = 0
  const readOnlyAdapter = {
    readJson() {
      readCalls += 1
      return { ok: true, status: 'missing' }
    },
  }

  const missingLoadResult = createLichtwaldLogStorage().loadLichtwaldLog()
  const missingSaveResult = createLichtwaldLogStorage(
    readOnlyAdapter
  ).saveLichtwaldLog(validLog)
  const invalidSaveResult = createLichtwaldLogStorage().saveLichtwaldLog(
    invalidLog
  )

  assertFailure(
    missingLoadResult,
    'unavailable',
    'storageAdapterUnavailable'
  )
  assertFailure(
    missingSaveResult,
    'unavailable',
    'storageAdapterUnavailable'
  )
  assertFailure(
    invalidSaveResult,
    'validationFailed',
    'invalidLichtwaldLogData'
  )
  assert.equal(readCalls, 0)
})

test('weist zusätzliche Felder, Custom-Prototypen und Sparse Arrays ohne Adapterzugriff zurück', () => {
  const extraRootField = createPrivateLog()
  extraRootField.fixtureExtraRoot = 'fixture-private-root-extra-sentinel'

  const extraEntryField = createPrivateLog()
  extraEntryField.entries[0].fixtureExtraEntry =
    'fixture-private-entry-extra-sentinel'

  const customPrototypeLog = Object.assign(
    Object.create({ inheritedFixture: 'fixture-inherited-root-sentinel' }),
    createPrivateLog()
  )
  const customPrototypeEntry = Object.assign(
    Object.create({ inheritedFixture: 'fixture-inherited-entry-sentinel' }),
    createEntry()
  )
  const logWithCustomEntry = createPrivateLog([customPrototypeEntry])

  const sparseEntries = [createEntry()]
  sparseEntries.length = 2
  const logWithSparseEntries = createPrivateLog(sparseEntries)

  const sparseTags = ['Testnebel']
  sparseTags.length = 2
  const logWithSparseTags = createPrivateLog([
    createEntry({ tags: sparseTags }),
  ])

  let readCalls = 0
  let writeCalls = 0
  const storage = createLichtwaldLogStorage({
    readJson() {
      readCalls += 1
      return { ok: true, status: 'missing' }
    },
    writeJson() {
      writeCalls += 1
      return { ok: true, status: 'saved' }
    },
  })

  for (const invalidLog of [
    extraRootField,
    extraEntryField,
    customPrototypeLog,
    logWithCustomEntry,
    logWithSparseEntries,
    logWithSparseTags,
  ]) {
    const result = storage.saveLichtwaldLog(invalidLog)

    assertFailure(
      result,
      'validationFailed',
      'invalidLichtwaldLogData'
    )
  }

  assert.equal(readCalls, 0)
  assert.equal(writeCalls, 0)
})

test('behandelt nicht klonbare, aber zunächst validierbare Werte kontrolliert', () => {
  const privateMarker = 'fixture-unclonable-proxy-sentinel'
  const sourceLog = createPrivateLog([
    createEntry({ text: privateMarker }),
  ])
  const unclonableProxy = new Proxy(sourceLog, {})
  let readCalls = 0
  let writeCalls = 0
  const saveStorage = createLichtwaldLogStorage({
    readJson() {
      readCalls += 1
      return { ok: true, status: 'missing' }
    },
    writeJson() {
      writeCalls += 1
      return { ok: true, status: 'saved' }
    },
  })

  const saveResult = saveStorage.saveLichtwaldLog(unclonableProxy)
  const loadResult = createLichtwaldLogStorage({
    readJson() {
      return { ok: true, status: 'found', value: unclonableProxy }
    },
  }).loadLichtwaldLog()

  assertFailure(
    saveResult,
    'validationFailed',
    'invalidLichtwaldLogData'
  )
  assertFailure(
    loadResult,
    'invalidStoredData',
    'invalidLichtwaldLogData'
  )
  assertDoesNotContain(saveResult, [privateMarker])
  assertDoesNotContain(loadResult, [privateMarker])
  assert.equal(readCalls, 0)
  assert.equal(writeCalls, 0)
})

test('mutiert gültige, ungültige und tief eingefrorene Eingaben nicht', () => {
  const validLog = createPrivateLog()
  const invalidLog = createPrivateLog([
    createEntry({ title: ' fixture-ungetrimmter-titel-sentinel ' }),
  ])
  const validSnapshot = structuredClone(validLog)
  const invalidSnapshot = structuredClone(invalidLog)
  let writtenLog
  const storage = createLichtwaldLogStorage({
    readJson() {
      return { ok: true, status: 'missing' }
    },
    writeJson(key, value) {
      writtenLog = value
      return { ok: true, status: 'saved' }
    },
  })

  assert.deepEqual(storage.saveLichtwaldLog(deepFreeze(validLog)), {
    ok: true,
    status: 'saved',
  })
  assertFailure(
    storage.saveLichtwaldLog(deepFreeze(invalidLog)),
    'validationFailed',
    'invalidLichtwaldLogData'
  )
  assert.deepEqual(validLog, validSnapshot)
  assert.deepEqual(invalidLog, invalidSnapshot)
  assert.notStrictEqual(writtenLog, validLog)
})

test('gibt IDs, Fokus, Titel, Texte, Tags und fremde Exceptions nie in Fehlern aus', () => {
  const privateMarkers = [
    'fixture-private-id-redaction-sentinel',
    'fixture-private-focus-redaction-sentinel',
    'fixture-private-title-redaction-sentinel',
    'fixture-private-text-redaction-sentinel',
    'fixture-private-tag-redaction-sentinel',
    'fixture-private-exception-redaction-sentinel',
    'fixture-private-adapter-redaction-sentinel',
  ]
  const invalidLog = createPrivateLog([
    createEntry({
      id: ` ${privateMarkers[0]} `,
      title: ` ${privateMarkers[2]} `,
      text: ` ${privateMarkers[3]} `,
      tags: [` ${privateMarkers[4]} `],
    }),
  ], {
    featuredEntryId: ` ${privateMarkers[1]} `,
  })
  const validationResult = createLichtwaldLogStorage().saveLichtwaldLog(
    invalidLog
  )
  const thrownResult = createLichtwaldLogStorage({
    readJson() {
      throw new Error(privateMarkers[5])
    },
  }).loadLichtwaldLog()
  const adapterResult = createLichtwaldLogStorage({
    readJson() {
      return createAdapterFailure(
        'readFailed',
        'storageReadFailed',
        privateMarkers[6]
      )
    },
  }).loadLichtwaldLog()

  assertFailure(
    validationResult,
    'validationFailed',
    'invalidLichtwaldLogData'
  )
  assert.deepEqual(thrownResult, createUnexpectedResult())
  assertFailure(adapterResult, 'readFailed', 'storageReadFailed')

  for (const result of [validationResult, thrownResult, adapterResult]) {
    assertDoesNotContain(result, privateMarkers)
    assert.equal('lichtwaldLog' in result, false)
  }
})
