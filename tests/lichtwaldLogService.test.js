import assert from 'node:assert/strict'
import test from 'node:test'

import {
  LICHTWALD_LOG_ID_MAX_LENGTH,
  LICHTWALD_LOG_MAX_ENTRY_COUNT,
  LICHTWALD_LOG_MAX_TAG_COUNT,
  LICHTWALD_LOG_SCHEMA_VERSION,
  LICHTWALD_LOG_TAG_MAX_LENGTH,
  LICHTWALD_LOG_TEXT_MAX_LENGTH,
  LICHTWALD_LOG_TITLE_MAX_LENGTH,
  validateLichtwaldLog,
} from '../src/modules/lichtwald-log/lichtwaldLogContract.js'
import * as lichtwaldLogServiceModule from '../src/services/lichtwaldLogService.js'
import { createStorageAdapter } from '../src/storage/storageAdapter.js'
import {
  createLichtwaldLogStorage,
  LICHTWALD_LOG_STORAGE_KEY,
} from '../src/storage/lichtwaldLogStorage.js'
import { FakeStorage } from './helpers/fakeStorage.js'

const { createLichtwaldLogService } = lichtwaldLogServiceModule

function cloneValue(value) {
  return structuredClone(value)
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Reflect.ownKeys(value).forEach((key) => deepFreeze(value[key]))
    Object.freeze(value)
  }

  return value
}

// Alle Fixtures sind neu erfunden und enthalten ausschließlich synthetische
// Testinhalte, auch wenn der fachliche Storage-Pfad dataOrigin private verlangt.
function createEntry(overrides = {}) {
  return {
    id: 'lichtwald-entry-orbit-map-1',
    calendarDate: '2027-03-14',
    title: 'Erfundene Orbitalkarte',
    text: 'Eine frei erfundene Notiz über geometrische Bahnen im Testlabor.',
    tags: ['Orbital', 'Fiktiv'],
    ...overrides,
  }
}

function createPrivateLog(entries = [createEntry()], overrides = {}) {
  return {
    schemaVersion: LICHTWALD_LOG_SCHEMA_VERSION,
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

function createEmptyPrivateLog() {
  return createPrivateLog([], { featuredEntryId: null })
}

function createEntryInput(entry = createEntry(), overrides = {}) {
  return {
    calendarDate: entry.calendarDate,
    title: entry.title,
    text: entry.text,
    tags: cloneValue(entry.tags),
    ...overrides,
  }
}

function createManyEntries(count) {
  return Array.from({ length: count }, (_, index) => createEntry({
    id: `lichtwald-entry-count-${index}`,
    calendarDate: index % 2 === 0 ? '2400-02-29' : '2099-12-31',
    title: `Erfundener Zählkartenmoment ${index}`,
    text: `Synthetische Zählkartenfixture Nummer ${index}.`,
    tags: [],
  }))
}

function createIdGenerator(...generatedValues) {
  const calls = []
  let valueIndex = 0

  function generateLichtwaldLogEntryId() {
    calls.push('entry')
    const generatedValue = valueIndex < generatedValues.length
      ? generatedValues[valueIndex]
      : generatedValues.at(-1)
    valueIndex += 1

    if (generatedValue instanceof Error) {
      throw generatedValue
    }

    return generatedValue
  }

  return { calls, generateLichtwaldLogEntryId }
}

function isExactSavedStorageResult(storageResult) {
  try {
    if (typeof storageResult !== 'object' || storageResult === null) {
      return false
    }

    const prototype = Object.getPrototypeOf(storageResult)
    const ownKeys = Reflect.ownKeys(storageResult)

    if (
      (prototype !== Object.prototype && prototype !== null) ||
      ownKeys.length !== 2 ||
      !ownKeys.includes('ok') ||
      !ownKeys.includes('status')
    ) {
      return false
    }

    const okDescriptor = Object.getOwnPropertyDescriptor(storageResult, 'ok')
    const statusDescriptor = Object.getOwnPropertyDescriptor(
      storageResult,
      'status'
    )

    return (
      Object.hasOwn(okDescriptor ?? {}, 'value') &&
      Object.hasOwn(statusDescriptor ?? {}, 'value') &&
      okDescriptor.value === true &&
      statusDescriptor.value === 'saved'
    )
  } catch {
    return false
  }
}

function createStorageDouble({
  initialLog,
  loadResult,
  saveResult,
  throwOnLoad = false,
  throwOnSave = false,
} = {}) {
  let storedLog = initialLog === undefined ? null : cloneValue(initialLog)
  const state = {
    loadCalls: 0,
    saveCalls: 0,
    savedArguments: [],
  }

  const lichtwaldLogStorage = {
    loadLichtwaldLog() {
      state.loadCalls += 1

      if (throwOnLoad) {
        throw new Error('fixture-thrown-load-private-sentinel')
      }

      if (loadResult !== undefined) {
        return typeof loadResult === 'function'
          ? loadResult()
          : loadResult
      }

      if (storedLog === null) {
        return {
          ok: true,
          status: 'missing',
          lichtwaldLog: createEmptyPrivateLog(),
        }
      }

      // Absichtlich dieselbe Referenz: Der Service muss Dependency-Rückgaben
      // unverändert lassen und alle weiteren Grenzen defensiv entkoppeln.
      return {
        ok: true,
        status: 'found',
        lichtwaldLog: storedLog,
      }
    },

    saveLichtwaldLog(lichtwaldLog) {
      state.saveCalls += 1
      state.savedArguments.push(lichtwaldLog)

      assert.deepEqual(validateLichtwaldLog(lichtwaldLog), {
        ok: true,
        errors: [],
      })
      assert.equal(lichtwaldLog.dataOrigin, 'private')

      if (throwOnSave) {
        throw new Error('fixture-thrown-save-private-sentinel')
      }

      const configuredResult = typeof saveResult === 'function'
        ? saveResult(lichtwaldLog)
        : saveResult

      if (configuredResult !== undefined) {
        if (isExactSavedStorageResult(configuredResult)) {
          storedLog = cloneValue(lichtwaldLog)
        }

        return configuredResult
      }

      storedLog = cloneValue(lichtwaldLog)
      return { ok: true, status: 'saved' }
    },
  }

  return {
    lichtwaldLogStorage,
    state,
    getStoredReference() {
      return storedLog
    },
    peekStoredLog() {
      return storedLog === null ? null : cloneValue(storedLog)
    },
    replaceStoredLog(lichtwaldLog) {
      storedLog = cloneValue(lichtwaldLog)
    },
  }
}

function createService(storageSystem, generatedIds = []) {
  const idGenerator = createIdGenerator(...generatedIds)
  const service = createLichtwaldLogService({
    lichtwaldLogStorage: storageSystem.lichtwaldLogStorage,
    generateLichtwaldLogEntryId:
      idGenerator.generateLichtwaldLogEntryId,
  })

  return { idGenerator, service }
}

function createStorageFailure(status, code, message) {
  return {
    ok: false,
    status,
    error: { code, message },
  }
}

function assertFailure(result, status, code, { mutation = false } = {}) {
  assert.equal(result.ok, false)
  assert.equal(result.status, status)
  assert.equal(result.error.code, code)
  assert.equal(typeof result.error.message, 'string')
  assert.ok(result.error.message.length > 0)

  if (mutation) {
    assert.equal(result.changed, false)
  }
}

function assertInputFailure(result, expectedField) {
  assertFailure(
    result,
    'validationFailed',
    'invalidLichtwaldLogInput',
    { mutation: true }
  )
  assert.equal(result.lichtwaldLog, null)
  assert.equal(typeof result.error.fieldErrors, 'object')
  assert.ok(Object.keys(result.error.fieldErrors).length > 0)

  if (expectedField) {
    assert.equal(
      typeof result.error.fieldErrors[expectedField],
      'string'
    )
  }
}

function assertErrorDoesNotContain(result, markers) {
  const serializedError = JSON.stringify(result.error)

  for (const marker of markers) {
    assert.equal(
      serializedError.includes(marker),
      false,
      `Servicefehler enthält redigierungspflichtigen Marker: ${marker}`
    )
  }
}

test('exportiert ausschließlich die Factory und liefert eine exakt eingefrorene Fünf-Methoden-API', () => {
  const storageSystem = createStorageDouble()
  const service = createService(storageSystem).service

  assert.deepEqual(Object.keys(lichtwaldLogServiceModule), [
    'createLichtwaldLogService',
  ])
  assert.deepEqual(Object.keys(service).sort(), [
    'createEntry',
    'deleteEntry',
    'loadLog',
    'setFeaturedEntry',
    'updateEntry',
  ])
  assert.equal(Object.isFrozen(service), true)
  Object.values(service).forEach((method) => {
    assert.equal(typeof method, 'function')
  })
})


test('liefert einen fehlenden Store wiederholt als frischen privaten Leerzustand ohne Save', () => {
  const storageSystem = createStorageDouble()
  const service = createService(storageSystem).service

  const firstResult = service.loadLog()

  assert.deepEqual(firstResult, {
    ok: true,
    status: 'empty',
    initialized: false,
    lichtwaldLog: createEmptyPrivateLog(),
  })
  firstResult.lichtwaldLog.entries.push(createEntry())
  firstResult.lichtwaldLog.featuredEntryId = createEntry().id

  const secondResult = service.loadLog()

  assert.deepEqual(secondResult.lichtwaldLog, createEmptyPrivateLog())
  assert.notStrictEqual(secondResult.lichtwaldLog, firstResult.lichtwaldLog)
  assert.notStrictEqual(
    secondResult.lichtwaldLog.entries,
    firstResult.lichtwaldLog.entries
  )
  assert.equal(storageSystem.state.loadCalls, 2)
  assert.equal(storageSystem.state.saveCalls, 0)
})

test('lädt einen gültigen privaten Snapshot tief entkoppelt und ohne Cache', () => {
  const firstStoredLog = createPrivateLog([
    createEntry(),
    createEntry({
      id: 'lichtwald-entry-spectrum-map-2',
      calendarDate: '2028-04-17',
      title: 'Erfundene Spektrumkarte',
      text: 'Ein zweiter frei erfundener Inhalt für den Service-Ladetest.',
      tags: ['Spektrum', 'Test'],
    }),
  ])
  const storageSystem = createStorageDouble({ initialLog: firstStoredLog })
  const storedReference = storageSystem.getStoredReference()
  const storedSnapshot = cloneValue(storedReference)
  const service = createService(storageSystem).service

  const firstResult = service.loadLog()

  assert.equal(firstResult.ok, true)
  assert.equal(firstResult.status, 'loaded')
  assert.equal(firstResult.initialized, false)
  assert.deepEqual(firstResult.lichtwaldLog, storedSnapshot)
  assert.notStrictEqual(firstResult.lichtwaldLog, storedReference)
  assert.notStrictEqual(firstResult.lichtwaldLog.entries, storedReference.entries)
  assert.notStrictEqual(
    firstResult.lichtwaldLog.entries[0].tags,
    storedReference.entries[0].tags
  )

  firstResult.lichtwaldLog.entries[0].tags.push('NurRückgabe')
  firstResult.lichtwaldLog.entries[0].text = 'Nur die Rückgabe.'
  assert.deepEqual(storedReference, storedSnapshot)

  const externallyChangedLog = createPrivateLog([
    createEntry({
      id: 'lichtwald-entry-external-map-3',
      calendarDate: '2029-05-18',
      title: 'Extern ersetzte Fantasiekarte',
      text: 'Dieser Zustand simuliert nur eine externe lokale Änderung.',
      tags: ['Extern', 'Synthetisch'],
    }),
  ])
  storageSystem.replaceStoredLog(externallyChangedLog)

  const secondResult = service.loadLog()

  assert.deepEqual(secondResult.lichtwaldLog, externallyChangedLog)
  assert.equal(storageSystem.state.loadCalls, 2)
  assert.equal(storageSystem.state.saveCalls, 0)
})

test('akzeptiert tief eingefrorene private Storage-Snapshots ohne Mutation', () => {
  const frozenLog = deepFreeze(createPrivateLog())
  const snapshot = cloneValue(frozenLog)
  const service = createLichtwaldLogService({
    lichtwaldLogStorage: {
      loadLichtwaldLog() {
        return { ok: true, status: 'found', lichtwaldLog: frozenLog }
      },
    },
  })

  const result = service.loadLog()

  assert.equal(result.ok, true)
  assert.deepEqual(result.lichtwaldLog, snapshot)
  assert.deepEqual(frozenLog, snapshot)
  assert.notStrictEqual(result.lichtwaldLog, frozenLog)
  assert.notStrictEqual(result.lichtwaldLog.entries[0].tags, frozenLog.entries[0].tags)
})

test('weist ungültige und synthetische Load-Snapshots kontrolliert ohne Save zurück', () => {
  const privateMarkers = [
    'fixture-invalid-snapshot-sentinel',
    'fixture-synthetic-snapshot-sentinel',
    'fixture-storage-success-sentinel',
    'fixture-proxy-snapshot-sentinel',
  ]
  const invalidPrivateLog = createPrivateLog([
    createEntry({ title: ` ${privateMarkers[0]} ` }),
  ])
  const syntheticFoundLog = createSyntheticLog([
    createEntry({ text: privateMarkers[1] }),
  ])
  const syntheticMissingLog = createSyntheticLog([], {
    featuredEntryId: null,
  })
  syntheticMissingLog[privateMarkers[2]] = privateMarkers[2]
  const hostileProxySnapshot = new Proxy(
    createPrivateLog([
      createEntry({ text: privateMarkers[3] }),
    ]),
    {
      getPrototypeOf() {
        throw new Error(privateMarkers[3])
      },
    }
  )
  const cases = [
    { status: 'found', lichtwaldLog: invalidPrivateLog },
    { status: 'found', lichtwaldLog: syntheticFoundLog },
    { status: 'missing', lichtwaldLog: syntheticMissingLog },
    { status: 'found', lichtwaldLog: hostileProxySnapshot },
  ]

  for (const testCase of cases) {
    const storageSystem = createStorageDouble({
      loadResult: {
        ok: true,
        status: testCase.status,
        lichtwaldLog: testCase.lichtwaldLog,
      },
    })
    const result = createService(storageSystem).service.loadLog()

    assertFailure(result, 'storageFailed', 'unexpectedStorageResult')
    assert.equal(result.lichtwaldLog, null)
    assert.equal(result.changed, undefined)
    assert.equal(storageSystem.state.loadCalls, 1)
    assert.equal(storageSystem.state.saveCalls, 0)
    assertErrorDoesNotContain(result, privateMarkers)
  }
})

test('validiert alle Form- und Ziel-ID-Eingaben vor Load, Save und Generator', () => {
  const invalidCreateCases = [
    [null, null],
    [{ calendarDate: null, title: 'Titel', text: 'Text', tags: [] }, 'calendarDate'],
    [{ calendarDate: '2026-02-29', title: 'Titel', text: 'Text', tags: [] }, 'calendarDate'],
    [{ calendarDate: '2027-01-01', title: '   ', text: 'Text', tags: [] }, 'title'],
    [{ calendarDate: '2027-01-01', title: 42, text: 'Text', tags: [] }, 'title'],
    [{ calendarDate: '2027-01-01', title: 'T'.repeat(LICHTWALD_LOG_TITLE_MAX_LENGTH + 1), text: 'Text', tags: [] }, 'title'],
    [{ calendarDate: '2027-01-01', title: 'Titel', text: '\n  ', tags: [] }, 'text'],
    [{ calendarDate: '2027-01-01', title: 'Titel', text: false, tags: [] }, 'text'],
    [{ calendarDate: '2027-01-01', title: 'Titel', text: 'X'.repeat(LICHTWALD_LOG_TEXT_MAX_LENGTH + 1), tags: [] }, 'text'],
    [{ calendarDate: '2027-01-01', title: 'Titel', text: 'Text', tags: 'Tag, Zwei' }, 'tags'],
    [{ calendarDate: '2027-01-01', title: 'Titel', text: 'Text', tags: Array.from({ length: LICHTWALD_LOG_MAX_TAG_COUNT + 1 }, (_, index) => `Tag ${index}`) }, 'tags'],
    [{ calendarDate: '2027-01-01', title: 'Titel', text: 'Text', tags: ['   '] }, 'tags'],
    [{ calendarDate: '2027-01-01', title: 'Titel', text: 'Text', tags: ['Z'.repeat(LICHTWALD_LOG_TAG_MAX_LENGTH + 1)] }, 'tags'],
    [{ calendarDate: '2027-01-01', title: 'Titel', text: 'Text', tags: ['Prisma', ' pRiSmA '] }, 'tags'],
  ]

  for (const [input, expectedField] of invalidCreateCases) {
    const storageSystem = createStorageDouble()
    const { idGenerator, service } = createService(storageSystem, [
      'lichtwald-entry-unused-input-id',
    ])
    const result = service.createEntry(input)

    assertInputFailure(result, expectedField)
    assert.equal(storageSystem.state.loadCalls, 0)
    assert.equal(storageSystem.state.saveCalls, 0)
    assert.equal(idGenerator.calls.length, 0)
  }

  const invalidTargetCases = [
    (service) => service.updateEntry(' entry ', createEntryInput()),
    (service) => service.updateEntry('i'.repeat(LICHTWALD_LOG_ID_MAX_LENGTH + 1), createEntryInput()),
    (service) => service.deleteEntry(''),
    (service) => service.deleteEntry(42),
    (service) => service.setFeaturedEntry('   '),
    (service) => service.setFeaturedEntry(false),
  ]

  for (const runOperation of invalidTargetCases) {
    const storageSystem = createStorageDouble({ initialLog: createPrivateLog() })
    const { idGenerator, service } = createService(storageSystem, [
      'lichtwald-entry-unused-target-id',
    ])
    const result = runOperation(service)

    assertInputFailure(result)
    assert.equal(storageSystem.state.loadCalls, 0)
    assert.equal(storageSystem.state.saveCalls, 0)
    assert.equal(idGenerator.calls.length, 0)
  }
})

test('weist feindliche Formobjekte und unsichere Pflichtfelder kontrolliert vor Storage zurück', () => {
  const privateMarkers = [
    'fixture-form-getter-private-sentinel',
    'fixture-form-proxy-private-sentinel',
  ]
  let getterCalls = 0
  const getterInput = createEntryInput()
  Object.defineProperty(getterInput, 'title', {
    enumerable: true,
    get() {
      getterCalls += 1
      throw new Error(privateMarkers[0])
    },
  })

  const customPrototypeInput = Object.assign(
    Object.create({ inheritedFixture: true }),
    createEntryInput()
  )
  const prototypeThrowingInput = new Proxy(createEntryInput(), {
    getPrototypeOf() {
      throw new Error(privateMarkers[1])
    },
  })
  const revokedInput = Proxy.revocable(createEntryInput(), {})
  revokedInput.revoke()

  for (const input of [
    getterInput,
    customPrototypeInput,
    prototypeThrowingInput,
    revokedInput.proxy,
  ]) {
    const storageSystem = createStorageDouble()
    const { idGenerator, service } = createService(storageSystem, [
      'lichtwald-entry-unused-hostile-form',
    ])
    let result

    assert.doesNotThrow(() => {
      result = service.createEntry(input)
    })
    assertInputFailure(result)
    assertErrorDoesNotContain(result, privateMarkers)
    assert.equal(storageSystem.state.loadCalls, 0)
    assert.equal(storageSystem.state.saveCalls, 0)
    assert.equal(idGenerator.calls.length, 0)
  }

  assert.ok(getterCalls <= 1)
})

test('ignoriert zusätzliche Formfelder vollständig und persistiert nur die Entry-Allowlist', () => {
  const privateMarker = 'fixture-unused-extra-form-getter-sentinel'
  let extraGetterCalls = 0
  const input = createEntryInput(createEntry(), {
    id: 'fixture-injected-id-must-not-persist',
    dataOrigin: 'synthetic',
    schemaVersion: 91,
    featuredEntryId: 'fixture-injected-focus',
    unknownPlainField: 'fixture-ignored-value',
  })
  Object.defineProperty(input, 'unknownGetterField', {
    enumerable: true,
    get() {
      extraGetterCalls += 1
      throw new Error(privateMarker)
    },
  })
  const storageSystem = createStorageDouble()
  const { service } = createService(storageSystem, [
    'lichtwald-entry-allowlist-result',
  ])

  const result = service.createEntry(input)

  assert.equal(result.ok, true)
  assert.equal(extraGetterCalls, 0)
  assert.deepEqual(Object.keys(result.createdEntry).sort(), [
    'calendarDate',
    'id',
    'tags',
    'text',
    'title',
  ])
  assert.equal(result.createdEntry.id, 'lichtwald-entry-allowlist-result')
  assert.equal(Object.hasOwn(result.createdEntry, 'dataOrigin'), false)
  assert.equal(Object.hasOwn(result.createdEntry, 'unknownPlainField'), false)
})

test('weist Sparse-, Zusatzfeld-, Custom-Prototyp- und feindliche Tag-Arrays vor Storage zurück', () => {
  const privateMarker = 'fixture-hostile-tags-private-sentinel'

  function createSparseTags() {
    const tags = ['Prisma']
    tags.length = 2
    return tags
  }

  function createExtraFieldTags() {
    const tags = ['Prisma']
    tags.fixtureExtra = privateMarker
    return tags
  }

  function createExtraSymbolTags() {
    const tags = ['Prisma']
    tags[Symbol(privateMarker)] = privateMarker
    return tags
  }

  function createCustomPrototypeTags() {
    const tags = ['Prisma']
    Object.setPrototypeOf(tags, Object.create(Array.prototype))
    return tags
  }

  function createThrowingPositionTags() {
    const tags = ['Prisma']
    Object.defineProperty(tags, '0', {
      configurable: true,
      enumerable: true,
      get() {
        throw new Error(privateMarker)
      },
    })
    return tags
  }

  function createOwnKeysThrowingTags() {
    return new Proxy(['Prisma'], {
      ownKeys() {
        throw new Error(privateMarker)
      },
    })
  }

  function createPrototypeThrowingTags() {
    return new Proxy(['Prisma'], {
      getPrototypeOf() {
        throw new Error(privateMarker)
      },
    })
  }

  function createRevokedTags() {
    const revocableTags = Proxy.revocable(['Prisma'], {})
    revocableTags.revoke()
    return revocableTags.proxy
  }

  const tagFactories = [
    createSparseTags,
    createExtraFieldTags,
    createExtraSymbolTags,
    createCustomPrototypeTags,
    createThrowingPositionTags,
    createOwnKeysThrowingTags,
    createPrototypeThrowingTags,
    createRevokedTags,
  ]

  for (const createTags of tagFactories) {
    const storageSystem = createStorageDouble()
    const { idGenerator, service } = createService(storageSystem, [
      'lichtwald-entry-unused-hostile-tags',
    ])
    let result

    assert.doesNotThrow(() => {
      result = service.createEntry(createEntryInput(createEntry(), {
        tags: createTags(),
      }))
    })
    assertInputFailure(result, 'tags')
    assertErrorDoesNotContain(result, [privateMarker])
    assert.equal(storageSystem.state.loadCalls, 0)
    assert.equal(storageSystem.state.saveCalls, 0)
    assert.equal(idGenerator.calls.length, 0)
  }
})

test('behandelt geerbte Ersatzpositionen nicht als dichte eigene Tagwerte', () => {
  const inheritedIndex = '1'
  const previousDescriptor = Object.getOwnPropertyDescriptor(
    Array.prototype,
    inheritedIndex
  )
  const privateMarker = 'fixture-inherited-tag-private-sentinel'

  Object.defineProperty(Array.prototype, inheritedIndex, {
    configurable: true,
    writable: true,
    value: privateMarker,
  })

  try {
    const tags = ['Prisma']
    tags.length = 2
    const storageSystem = createStorageDouble()
    const { idGenerator, service } = createService(storageSystem, [
      'lichtwald-entry-unused-inherited-tag',
    ])

    const result = service.createEntry(createEntryInput(createEntry(), {
      tags,
    }))

    assertInputFailure(result, 'tags')
    assertErrorDoesNotContain(result, [privateMarker])
    assert.equal(storageSystem.state.loadCalls, 0)
    assert.equal(storageSystem.state.saveCalls, 0)
    assert.equal(idGenerator.calls.length, 0)
  } finally {
    if (previousDescriptor) {
      Object.defineProperty(
        Array.prototype,
        inheritedIndex,
        previousDescriptor
      )
    } else {
      delete Array.prototype[inheritedIndex]
    }
  }
})

test('akzeptiert exakte Feld- und Taggrenzen, Null-Prototyp-Arrays und gültige Kalenderdaten', () => {
  const tags = Array.from(
    { length: LICHTWALD_LOG_MAX_TAG_COUNT },
    (_, index) => `${index}${'Z'.repeat(LICHTWALD_LOG_TAG_MAX_LENGTH - 1)}`
  )
  Object.setPrototypeOf(tags, null)
  const input = Object.assign(Object.create(null), {
    calendarDate: ' 2400-02-29 ',
    title: ` ${'T'.repeat(LICHTWALD_LOG_TITLE_MAX_LENGTH)} `,
    text: ` ${'X'.repeat(LICHTWALD_LOG_TEXT_MAX_LENGTH)} `,
    tags,
  })
  const inputValuesSnapshot = {
    calendarDate: input.calendarDate,
    title: input.title,
    text: input.text,
    tags: Array.from(input.tags),
  }
  const maximumId = 'i'.repeat(LICHTWALD_LOG_ID_MAX_LENGTH)
  const storageSystem = createStorageDouble()
  const { service } = createService(storageSystem, [maximumId])

  const result = service.createEntry(deepFreeze(input))

  assert.equal(result.ok, true)
  assert.equal(result.createdEntry.id, maximumId)
  assert.equal(result.createdEntry.calendarDate, '2400-02-29')
  assert.equal(result.createdEntry.title.length, LICHTWALD_LOG_TITLE_MAX_LENGTH)
  assert.equal(result.createdEntry.text.length, LICHTWALD_LOG_TEXT_MAX_LENGTH)
  assert.equal(result.createdEntry.tags.length, LICHTWALD_LOG_MAX_TAG_COUNT)
  assert.equal(input.calendarDate, inputValuesSnapshot.calendarDate)
  assert.equal(input.title, inputValuesSnapshot.title)
  assert.equal(input.text, inputValuesSnapshot.text)
  assert.deepEqual(Array.from(input.tags), inputValuesSnapshot.tags)
  assert.equal(Object.getPrototypeOf(input), null)
  assert.equal(Object.getPrototypeOf(input.tags), null)
  assert.equal(storageSystem.state.loadCalls, 1)
  assert.equal(storageSystem.state.saveCalls, 1)

  const futureStorage = createStorageDouble()
  const futureService = createService(futureStorage, [
    'lichtwald-entry-future-calendar',
  ]).service
  const futureResult = futureService.createEntry(createEntryInput(createEntry(), {
    calendarDate: '9999-12-31',
    tags: ['Wald, Licht', 'Ruhe & Fokus', '#Synthetisch'],
  }))

  assert.equal(futureResult.ok, true)
  assert.deepEqual(futureResult.createdEntry.tags, [
    'Wald, Licht',
    'Ruhe & Fokus',
    '#Synthetisch',
  ])
})

test('normalisiert nur äußere Whitespaces und erhält interne Zeilenumbrüche sowie Tag-Reihenfolge', () => {
  const storageSystem = createStorageDouble()
  const { service } = createService(storageSystem, [
    'lichtwald-entry-normalized-content',
  ])
  const input = {
    calendarDate: ' 2027-06-05 ',
    title: '  Erfundene  Doppelpuls-Karte  ',
    text: '  Erste synthetische Zeile\n  zweite Zeile mit Einzug.  ',
    tags: ['  Zeta  ', ' Alpha ', 'Wald, Licht'],
  }
  const snapshot = cloneValue(input)

  const result = service.createEntry(input)

  assert.deepEqual(result.createdEntry, {
    id: 'lichtwald-entry-normalized-content',
    calendarDate: '2027-06-05',
    title: 'Erfundene  Doppelpuls-Karte',
    text: 'Erste synthetische Zeile\n  zweite Zeile mit Einzug.',
    tags: ['Zeta', 'Alpha', 'Wald, Licht'],
  })
  assert.deepEqual(input, snapshot)
})

test('normalisiert fehlende und geworfene Storage-Abhängigkeiten ohne rohe Exception', () => {
  const missingResult = createLichtwaldLogService().loadLog()

  assertFailure(
    missingResult,
    'unavailable',
    'lichtwaldLogStorageUnavailable'
  )
  assert.equal(missingResult.lichtwaldLog, null)

  const throwingSystem = createStorageDouble({ throwOnLoad: true })
  const throwingResult = createService(throwingSystem).service.loadLog()

  assertFailure(
    throwingResult,
    'readFailed',
    'lichtwaldLogStorageReadFailed'
  )
  assert.equal(throwingResult.lichtwaldLog, null)
  assertErrorDoesNotContain(throwingResult, [
    'fixture-thrown-load-private-sentinel',
  ])

  const privateMarker = 'fixture-load-method-getter-sentinel'
  const getterStorage = {}
  Object.defineProperty(getterStorage, 'loadLichtwaldLog', {
    get() {
      throw new Error(privateMarker)
    },
  })
  let getterResult

  assert.doesNotThrow(() => {
    getterResult = createLichtwaldLogService({
      lichtwaldLogStorage: getterStorage,
    }).loadLog()
  })
  assertFailure(
    getterResult,
    'readFailed',
    'lichtwaldLogStorageReadFailed'
  )
  assertErrorDoesNotContain(getterResult, [privateMarker])
})

test('akzeptiert nur exakt geformte dokumentierte Load-Erfolge', () => {
  const privateMarker = 'fixture-malformed-load-result-sentinel'
  const inheritedResult = Object.create({
    ok: true,
    status: 'missing',
    lichtwaldLog: createEmptyPrivateLog(),
  })
  const customPrototypeResult = Object.assign(
    Object.create({ inheritedFixture: true }),
    {
      ok: true,
      status: 'missing',
      lichtwaldLog: createEmptyPrivateLog(),
    }
  )
  const malformedResults = [
    null,
    { ok: 'true', status: 'missing', lichtwaldLog: createEmptyPrivateLog() },
    { ok: true, status: 'missing', lichtwaldLog: createPrivateLog() },
    { ok: true, status: 'missing' },
    { ok: true, status: 'found' },
    { ok: true, status: 'saved', lichtwaldLog: createEmptyPrivateLog() },
    {
      ok: false,
      status: Symbol(privateMarker),
      error: {
        code: 'storageReadFailed',
        message: privateMarker,
      },
    },
    {
      ok: true,
      status: 'missing',
      lichtwaldLog: createEmptyPrivateLog(),
      fixtureUnknown: privateMarker,
    },
    {
      ok: true,
      status: 'missing',
      lichtwaldLog: createEmptyPrivateLog(),
      error: { code: 'storageReadFailed', message: privateMarker },
    },
    inheritedResult,
    customPrototypeResult,
  ]

  for (const storageResult of malformedResults) {
    const storageSystem = createStorageDouble({ loadResult: storageResult })
    const result = createService(storageSystem).service.loadLog()

    assertFailure(result, 'storageFailed', 'unexpectedStorageResult')
    assert.equal(result.lichtwaldLog, null)
    assert.equal(storageSystem.state.saveCalls, 0)
    assertErrorDoesNotContain(result, [privateMarker])
  }
})

test('weist getterbasierte und Proxy-Load-Resultate kontrolliert zurück', () => {
  const privateMarker = 'fixture-load-result-getter-proxy-sentinel'
  let okGetterCalls = 0
  const okGetterResult = {
    status: 'missing',
    lichtwaldLog: createEmptyPrivateLog(),
  }
  Object.defineProperty(okGetterResult, 'ok', {
    enumerable: true,
    get() {
      okGetterCalls += 1
      return true
    },
  })

  let logGetterCalls = 0
  const logGetterResult = { ok: true, status: 'found' }
  Object.defineProperty(logGetterResult, 'lichtwaldLog', {
    enumerable: true,
    get() {
      logGetterCalls += 1
      throw new Error(privateMarker)
    },
  })

  const revokedResult = Proxy.revocable({
    ok: true,
    status: 'missing',
    lichtwaldLog: createEmptyPrivateLog(),
  }, {})
  revokedResult.revoke()
  const ownKeysThrowingResult = new Proxy({
    ok: true,
    status: 'missing',
    lichtwaldLog: createEmptyPrivateLog(),
  }, {
    ownKeys() {
      throw new Error(privateMarker)
    },
  })

  for (const storageResult of [
    okGetterResult,
    logGetterResult,
    revokedResult.proxy,
    ownKeysThrowingResult,
  ]) {
    let result

    assert.doesNotThrow(() => {
      result = createService(createStorageDouble({
        loadResult: storageResult,
      })).service.loadLog()
    })
    assertFailure(result, 'storageFailed', 'unexpectedStorageResult')
    assertErrorDoesNotContain(result, [privateMarker])
  }

  assert.equal(okGetterCalls, 0)
  assert.equal(logGetterCalls, 0)
})

test('reicht nur erlaubte Load-Status-Code-Paare mit eigenen statischen Meldungen weiter', () => {
  const foreignMessages = [
    'fixture-first-foreign-storage-message',
    'fixture-second-foreign-storage-message',
  ]
  const allowedFailures = [
    ['invalidKey', 'invalidStorageKey'],
    ['invalidLimit', 'invalidStorageLimit'],
    ['unavailable', 'storageAdapterUnavailable'],
    ['unavailable', 'storageUnavailable'],
    ['readFailed', 'storageReadFailed'],
    ['invalidJson', 'invalidJson'],
    ['sizeLimitExceeded', 'storageSizeLimitExceeded'],
    ['invalidStoredData', 'invalidLichtwaldLogData'],
    ['invalidStoredData', 'privateLichtwaldLogRequired'],
  ]

  for (const [status, code] of allowedFailures) {
    const errors = foreignMessages.map((message) => {
      const result = createService(createStorageDouble({
        loadResult: createStorageFailure(status, code, message),
      })).service.loadLog()

      assertFailure(result, status, code)
      assert.equal(result.lichtwaldLog, null)
      assertErrorDoesNotContain(result, foreignMessages)
      return result.error
    })

    assert.deepEqual(errors[0], errors[1])
  }

  const malformedFailures = [
    createStorageFailure('quotaExceeded', 'storageQuotaExceeded', foreignMessages[0]),
    createStorageFailure('readFailed', 'storageWriteFailed', foreignMessages[0]),
    createStorageFailure('unknownStatus', 'unknownCode', foreignMessages[0]),
    {
      ...createStorageFailure('readFailed', 'storageReadFailed', foreignMessages[0]),
      fixtureExtra: true,
    },
    {
      ok: false,
      status: 'readFailed',
      error: {
        code: 'storageReadFailed',
        message: foreignMessages[0],
        fixtureExtra: true,
      },
    },
  ]

  for (const storageResult of malformedFailures) {
    const result = createService(createStorageDouble({
      loadResult: storageResult,
    })).service.loadLog()

    assertFailure(result, 'storageFailed', 'unexpectedStorageResult')
    assertErrorDoesNotContain(result, foreignMessages)
  }
})

test('erstellt normalisiert am Arrayende ohne Datumssortierung und verändert den Fokus nicht', () => {
  const initialEntries = [
    createEntry({
      id: 'lichtwald-entry-existing-later',
      calendarDate: '2031-12-20',
    }),
    createEntry({
      id: 'lichtwald-entry-existing-earlier',
      calendarDate: '2022-01-02',
      title: 'Erfundene frühe Karte',
    }),
  ]
  const initialLog = createPrivateLog(initialEntries, {
    featuredEntryId: initialEntries[1].id,
  })
  const storageSystem = createStorageDouble({ initialLog })
  const { idGenerator, service } = createService(storageSystem, [
    'lichtwald-entry-appended-middle-date',
  ])
  const input = {
    calendarDate: ' 2027-07-07 ',
    title: '  Erfundene mittlere Karte  ',
    text: '  Synthetischer Inhalt.  ',
    tags: ['  Zeta ', 'Alpha  '],
  }
  const inputSnapshot = cloneValue(input)

  const result = service.createEntry(input)

  assert.equal(result.ok, true)
  assert.equal(result.status, 'entryCreated')
  assert.equal(result.changed, true)
  assert.deepEqual(result.createdEntry, {
    id: 'lichtwald-entry-appended-middle-date',
    calendarDate: '2027-07-07',
    title: 'Erfundene mittlere Karte',
    text: 'Synthetischer Inhalt.',
    tags: ['Zeta', 'Alpha'],
  })
  assert.deepEqual(
    result.lichtwaldLog.entries.map(({ id }) => id),
    [
      initialEntries[0].id,
      initialEntries[1].id,
      'lichtwald-entry-appended-middle-date',
    ]
  )
  assert.equal(result.lichtwaldLog.featuredEntryId, initialEntries[1].id)
  assert.deepEqual(input, inputSnapshot)
  assert.deepEqual(idGenerator.calls, ['entry'])
  assert.equal(storageSystem.state.loadCalls, 1)
  assert.equal(storageSystem.state.saveCalls, 1)
  assert.deepEqual(storageSystem.peekStoredLog(), result.lichtwaldLog)
})

test('erstellt aus missing und gefundenem privaten Leerzustand mit unverändertem null-Fokus', () => {
  const cases = [
    { name: 'missing', initialLog: undefined },
    { name: 'found-empty', initialLog: createEmptyPrivateLog() },
  ]

  for (const testCase of cases) {
    const storageSystem = createStorageDouble({
      initialLog: testCase.initialLog,
    })
    const { service } = createService(storageSystem, [
      `lichtwald-entry-empty-${testCase.name}`,
    ])

    const result = service.createEntry({
      calendarDate: '2033-03-03',
      title: 'Erfundene leere Ausgangskarte',
      text: 'Synthetischer Create-Test aus einem leeren Ausgangszustand.',
      tags: ['Leerzustand', 'Test'],
    })
    const savedCandidate = storageSystem.state.savedArguments[0]

    assert.equal(result.ok, true)
    assert.equal(result.status, 'entryCreated')
    assert.equal(result.changed, true)
    assert.equal(savedCandidate.featuredEntryId, null)
    assert.equal(result.lichtwaldLog.featuredEntryId, null)
    assert.equal(storageSystem.state.loadCalls, 1)
    assert.equal(storageSystem.state.saveCalls, 1)
  }
})

test('begrenzt ID-Erzeugung gemeinsam für Kollision, Typ, Whitespace, Länge und Throw auf fünf Versuche', () => {
  const initialLog = createPrivateLog()
  const privateMarker = 'fixture-generator-private-sentinel'
  const generatedValues = [
    initialLog.entries[0].id,
    42,
    ' ungetrimmte-id ',
    'i'.repeat(LICHTWALD_LOG_ID_MAX_LENGTH + 1),
    new Error(privateMarker),
  ]
  const storageSystem = createStorageDouble({ initialLog })
  const { idGenerator, service } = createService(
    storageSystem,
    generatedValues
  )

  const result = service.createEntry(createEntryInput())

  assertFailure(
    result,
    'generationFailed',
    'lichtwaldLogEntryIdGenerationFailed',
    { mutation: true }
  )
  assert.deepEqual(result.lichtwaldLog, initialLog)
  assert.equal(idGenerator.calls.length, 5)
  assert.equal(storageSystem.state.loadCalls, 1)
  assert.equal(storageSystem.state.saveCalls, 0)
  assertErrorDoesNotContain(result, [privateMarker, 'ungetrimmte-id'])
})

test('akzeptiert die fünfte eindeutige ID und behandelt IDs case-sensitive', () => {
  const initialEntry = createEntry({ id: 'Lichtwald-Entry-Case' })
  const storageSystem = createStorageDouble({
    initialLog: createPrivateLog([initialEntry]),
  })
  const { idGenerator, service } = createService(storageSystem, [
    initialEntry.id,
    '',
    ' invalid ',
    'i'.repeat(101),
    'lichtwald-entry-case',
  ])

  const result = service.createEntry(createEntryInput())

  assert.equal(result.ok, true)
  assert.equal(result.createdEntry.id, 'lichtwald-entry-case')
  assert.equal(idGenerator.calls.length, 5)
  assert.equal(
    new Set(result.lichtwaldLog.entries.map(({ id }) => id)).size,
    2
  )
})

test('verwendet standardmäßig das dokumentierte randomUUID-Präfix', () => {
  const storageSystem = createStorageDouble()
  const service = createLichtwaldLogService({
    lichtwaldLogStorage: storageSystem.lichtwaldLogStorage,
  })

  const result = service.createEntry(createEntryInput())

  assert.equal(result.ok, true)
  assert.match(
    result.createdEntry.id,
    /^lichtwald-entry-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  )
})

test('erlaubt den 1.000. Eintrag und lehnt einen weiteren vor Generator und Save ab', () => {
  const entriesAt999 = createManyEntries(LICHTWALD_LOG_MAX_ENTRY_COUNT - 1)
  const successStorage = createStorageDouble({
    initialLog: createPrivateLog(entriesAt999, { featuredEntryId: null }),
  })
  const successSystem = createService(successStorage, [
    'lichtwald-entry-count-999-final',
  ])

  const successResult = successSystem.service.createEntry(createEntryInput())

  assert.equal(successResult.ok, true)
  assert.equal(
    successResult.lichtwaldLog.entries.length,
    LICHTWALD_LOG_MAX_ENTRY_COUNT
  )
  assert.equal(successSystem.idGenerator.calls.length, 1)
  assert.equal(successStorage.state.saveCalls, 1)

  const fullLog = successResult.lichtwaldLog
  const fullStorage = createStorageDouble({ initialLog: fullLog })
  const fullSystem = createService(fullStorage, [
    'lichtwald-entry-must-not-be-generated',
  ])
  const fullResult = fullSystem.service.createEntry(createEntryInput())

  assertFailure(
    fullResult,
    'limitReached',
    'lichtwaldLogEntryLimitReached',
    { mutation: true }
  )
  assert.deepEqual(fullResult.lichtwaldLog, fullLog)
  assert.equal(fullStorage.state.loadCalls, 1)
  assert.equal(fullStorage.state.saveCalls, 0)
  assert.equal(fullSystem.idGenerator.calls.length, 0)
})

test('aktualisiert vollständig an derselben Position mit stabiler ID und Fokusreferenz', () => {
  const entries = [
    createEntry({ id: 'lichtwald-entry-before-update' }),
    createEntry({
      id: 'lichtwald-entry-update-target',
      calendarDate: '2028-08-08',
      title: 'Erfundene Zielkarte',
      text: 'Synthetischer Ausgangstext.',
      tags: ['Alt'],
    }),
    createEntry({
      id: 'lichtwald-entry-after-update',
      title: 'Erfundene Folgekarte',
    }),
  ]
  const initialLog = createPrivateLog(entries, {
    featuredEntryId: entries[1].id,
  })
  const storageSystem = createStorageDouble({ initialLog })
  const { idGenerator, service } = createService(storageSystem)
  const input = {
    calendarDate: ' 2400-02-29 ',
    title: '  Aktualisierte Fantasiekarte  ',
    text: '  Vollständig ersetzter synthetischer Text.  ',
    tags: [' Neu ', 'Fiktiv'],
    id: 'fixture-injected-update-id',
  }
  const inputSnapshot = cloneValue(input)

  const result = service.updateEntry(entries[1].id, input)

  assert.equal(result.ok, true)
  assert.equal(result.status, 'entryUpdated')
  assert.equal(result.changed, true)
  assert.deepEqual(result.updatedEntry, {
    id: entries[1].id,
    calendarDate: '2400-02-29',
    title: 'Aktualisierte Fantasiekarte',
    text: 'Vollständig ersetzter synthetischer Text.',
    tags: ['Neu', 'Fiktiv'],
  })
  assert.deepEqual(
    result.lichtwaldLog.entries.map(({ id }) => id),
    entries.map(({ id }) => id)
  )
  assert.equal(result.lichtwaldLog.featuredEntryId, entries[1].id)
  assert.deepEqual(input, inputSnapshot)
  assert.deepEqual(idGenerator.calls, [])
  assert.equal(storageSystem.state.loadCalls, 1)
  assert.equal(storageSystem.state.saveCalls, 1)
})

test('behandelt eine normalisiert identische Aktualisierung als schreibfreien No-op', () => {
  const initialLog = createPrivateLog()
  const storageSystem = createStorageDouble({ initialLog })
  const { idGenerator, service } = createService(storageSystem)
  const input = createEntryInput(initialLog.entries[0], {
    calendarDate: ` ${initialLog.entries[0].calendarDate} `,
    title: ` ${initialLog.entries[0].title} `,
    text: ` ${initialLog.entries[0].text} `,
    tags: initialLog.entries[0].tags.map((tag) => ` ${tag} `),
  })

  const result = service.updateEntry(initialLog.entries[0].id, input)

  assert.equal(result.ok, true)
  assert.equal(result.status, 'entryUpdated')
  assert.equal(result.changed, false)
  assert.deepEqual(result.updatedEntry, initialLog.entries[0])
  assert.deepEqual(result.lichtwaldLog, initialLog)
  assert.notStrictEqual(result.updatedEntry, result.lichtwaldLog.entries[0])
  assert.notStrictEqual(result.updatedEntry.tags, result.lichtwaldLog.entries[0].tags)
  assert.equal(storageSystem.state.loadCalls, 1)
  assert.equal(storageSystem.state.saveCalls, 0)
  assert.equal(idGenerator.calls.length, 0)
})

test('löscht einen nicht fokussierten Eintrag positionsstabil und erhält den Fokus', () => {
  const entries = [
    createEntry({ id: 'lichtwald-entry-delete-first' }),
    createEntry({ id: 'lichtwald-entry-delete-middle', title: 'Erfundene Mittelkarte' }),
    createEntry({ id: 'lichtwald-entry-delete-last', title: 'Erfundene Endkarte' }),
  ]
  const initialLog = createPrivateLog(entries, {
    featuredEntryId: entries[0].id,
  })
  const storageSystem = createStorageDouble({ initialLog })
  const service = createService(storageSystem).service

  const result = service.deleteEntry(entries[1].id)

  assert.deepEqual(result, {
    ok: true,
    status: 'entryDeleted',
    changed: true,
    deletedEntryId: entries[1].id,
    focusCleared: false,
    lichtwaldLog: createPrivateLog([entries[0], entries[2]], {
      featuredEntryId: entries[0].id,
    }),
  })
  assert.equal(storageSystem.state.loadCalls, 1)
  assert.equal(storageSystem.state.saveCalls, 1)
})

test('löscht fokussierten Eintrag und Fokus atomar in genau einem gültigen Save-Kandidaten', () => {
  const entries = [
    createEntry({ id: 'lichtwald-entry-atomic-keep' }),
    createEntry({
      id: 'lichtwald-entry-atomic-delete',
      title: 'Erfundene atomare Zielkarte',
    }),
  ]
  const initialLog = createPrivateLog(entries, {
    featuredEntryId: entries[1].id,
  })
  let observedCandidate
  const storageSystem = createStorageDouble({
    initialLog,
    saveResult(candidate) {
      observedCandidate = cloneValue(candidate)
      return { ok: true, status: 'saved' }
    },
  })
  const service = createService(storageSystem).service

  const result = service.deleteEntry(entries[1].id)

  assert.equal(result.ok, true)
  assert.equal(result.focusCleared, true)
  assert.equal(result.lichtwaldLog.featuredEntryId, null)
  assert.deepEqual(result.lichtwaldLog.entries, [entries[0]])
  assert.deepEqual(observedCandidate, result.lichtwaldLog)
  assert.deepEqual(validateLichtwaldLog(observedCandidate), {
    ok: true,
    errors: [],
  })
  assert.equal(storageSystem.state.loadCalls, 1)
  assert.equal(storageSystem.state.saveCalls, 1)
})

test('setzt, wiederholt, entfernt und wiederholt den Fokus mit write-freien No-ops', () => {
  const entries = [
    createEntry({ id: 'lichtwald-entry-focus-a' }),
    createEntry({ id: 'lichtwald-entry-focus-b', title: 'Erfundene Fokuskarte B' }),
  ]
  const storageSystem = createStorageDouble({
    initialLog: createPrivateLog(entries, { featuredEntryId: null }),
  })
  const service = createService(storageSystem).service

  const setResult = service.setFeaturedEntry(entries[1].id)
  const repeatedSetResult = service.setFeaturedEntry(entries[1].id)
  const clearResult = service.setFeaturedEntry(null)
  const repeatedClearResult = service.setFeaturedEntry(null)

  assert.deepEqual(
    [setResult.changed, repeatedSetResult.changed, clearResult.changed, repeatedClearResult.changed],
    [true, false, true, false]
  )
  for (const result of [
    setResult,
    repeatedSetResult,
    clearResult,
    repeatedClearResult,
  ]) {
    assert.equal(result.ok, true)
    assert.equal(result.status, 'featuredEntryUpdated')
  }
  assert.equal(setResult.featuredEntryId, entries[1].id)
  assert.equal(repeatedSetResult.featuredEntryId, entries[1].id)
  assert.equal(clearResult.featuredEntryId, null)
  assert.equal(repeatedClearResult.featuredEntryId, null)
  assert.equal(storageSystem.state.loadCalls, 4)
  assert.equal(storageSystem.state.saveCalls, 2)
})

test('behandelt unbekannte und nur case-insensitiv passende Ziele ohne Save', () => {
  const initialEntry = createEntry({ id: 'lichtwald-entry-CaseTarget' })
  const operations = [
    (service) => service.updateEntry(
      'lichtwald-entry-casetarget',
      createEntryInput(initialEntry)
    ),
    (service) => service.deleteEntry('lichtwald-entry-missing'),
    (service) => service.setFeaturedEntry('LICHTWALD-ENTRY-CASETARGET'),
  ]

  for (const runOperation of operations) {
    const initialLog = createPrivateLog([initialEntry])
    const storageSystem = createStorageDouble({ initialLog })
    const service = createService(storageSystem).service
    const result = runOperation(service)

    assertFailure(
      result,
      'notFound',
      'lichtwaldLogEntryNotFound',
      { mutation: true }
    )
    assert.deepEqual(result.lichtwaldLog, initialLog)
    assert.equal(storageSystem.state.loadCalls, 1)
    assert.equal(storageSystem.state.saveCalls, 0)
  }
})

test('No-op-Operationen benötigen keine Save-Schnittstelle', () => {
  const initialLog = createPrivateLog()
  let loadCalls = 0
  const service = createLichtwaldLogService({
    lichtwaldLogStorage: {
      loadLichtwaldLog() {
        loadCalls += 1
        return {
          ok: true,
          status: 'found',
          lichtwaldLog: initialLog,
        }
      },
    },
  })

  const updateResult = service.updateEntry(
    initialLog.entries[0].id,
    createEntryInput(initialLog.entries[0])
  )
  const focusResult = service.setFeaturedEntry(initialLog.featuredEntryId)

  assert.equal(updateResult.ok, true)
  assert.equal(updateResult.changed, false)
  assert.equal(focusResult.ok, true)
  assert.equal(focusResult.changed, false)
  assert.equal(loadCalls, 2)
})

test('jede echte Mutation validiert einen privaten Vollzustand und nutzt genau einen Service-Load und -Save', () => {
  const mutationCases = [
    {
      initialLog: createEmptyPrivateLog(),
      generatedIds: ['lichtwald-entry-count-create'],
      run(service) {
        return service.createEntry(createEntryInput())
      },
    },
    {
      initialLog: createPrivateLog(),
      generatedIds: [],
      run(service, initialLog) {
        return service.updateEntry(
          initialLog.entries[0].id,
          createEntryInput(initialLog.entries[0], {
            title: 'Geänderte synthetische Zählkarte',
          })
        )
      },
    },
    {
      initialLog: createPrivateLog(),
      generatedIds: [],
      run(service, initialLog) {
        return service.setFeaturedEntry(null)
      },
    },
    {
      initialLog: createPrivateLog(),
      generatedIds: [],
      run(service, initialLog) {
        return service.deleteEntry(initialLog.entries[0].id)
      },
    },
  ]

  for (const mutationCase of mutationCases) {
    const storageSystem = createStorageDouble({
      initialLog: mutationCase.initialLog,
    })
    const service = createService(
      storageSystem,
      mutationCase.generatedIds
    ).service
    const result = mutationCase.run(service, mutationCase.initialLog)

    assert.equal(result.ok, true)
    assert.equal(result.changed, true)
    assert.equal(storageSystem.state.loadCalls, 1)
    assert.equal(storageSystem.state.saveCalls, 1)
    assert.deepEqual(
      validateLichtwaldLog(storageSystem.state.savedArguments[0]),
      { ok: true, errors: [] }
    )
    assert.equal(
      storageSystem.state.savedArguments[0].dataOrigin,
      'private'
    )
  }
})

test('normalisiert fehlende, geworfene und malformed Save-Ergebnisse mit vorherigem vertrauenswürdigem Snapshot', () => {
  const initialLog = createPrivateLog()
  const privateMarker = 'fixture-malformed-save-private-sentinel'
  const cases = [
    {
      storage: {
        loadLichtwaldLog() {
          return { ok: true, status: 'found', lichtwaldLog: initialLog }
        },
      },
      expectedStatus: 'unavailable',
      expectedCode: 'lichtwaldLogStorageUnavailable',
    },
    {
      storageSystem: createStorageDouble({
        initialLog,
        throwOnSave: true,
      }),
      expectedStatus: 'writeFailed',
      expectedCode: 'lichtwaldLogStorageWriteFailed',
    },
    ...[
      null,
      { ok: true, status: 'found' },
      { ok: 'true', status: 'saved' },
      { ok: true, status: 'saved', fixtureExtra: privateMarker },
      {
        ok: true,
        status: 'saved',
        error: { code: 'storageWriteFailed', message: privateMarker },
      },
      createStorageFailure('readFailed', 'storageWriteFailed', privateMarker),
    ].map((saveResult) => ({
      storageSystem: createStorageDouble({ initialLog, saveResult }),
      expectedStatus: 'storageFailed',
      expectedCode: 'unexpectedStorageResult',
    })),
  ]

  for (const testCase of cases) {
    const storageSystem = testCase.storageSystem
    const service = createLichtwaldLogService({
      lichtwaldLogStorage:
        testCase.storage ?? storageSystem.lichtwaldLogStorage,
    })
    const result = service.updateEntry(
      initialLog.entries[0].id,
      createEntryInput(initialLog.entries[0], {
        title: 'Nicht persistierte synthetische Änderung',
      })
    )

    assertFailure(
      result,
      testCase.expectedStatus,
      testCase.expectedCode,
      { mutation: true }
    )
    assert.deepEqual(result.lichtwaldLog, initialLog)
    assert.equal(Object.hasOwn(result, 'updatedEntry'), false)
    assertErrorDoesNotContain(result, [
      privateMarker,
      'fixture-thrown-save-private-sentinel',
    ])

    if (storageSystem) {
      assert.deepEqual(storageSystem.peekStoredLog(), initialLog)
    }
  }
})

test('weist getterbasierte und Proxy-Save-Resultate kontrolliert zurück, ohne Getter auszuführen', () => {
  const initialLog = createPrivateLog()
  const privateMarker = 'fixture-save-result-getter-proxy-sentinel'
  let statusGetterCalls = 0
  const statusGetterResult = { ok: true }
  Object.defineProperty(statusGetterResult, 'status', {
    enumerable: true,
    get() {
      statusGetterCalls += 1
      return 'saved'
    },
  })
  const revokedResult = Proxy.revocable({ ok: true, status: 'saved' }, {})
  revokedResult.revoke()
  const descriptorThrowingResult = new Proxy(
    { ok: true, status: 'saved' },
    {
      getOwnPropertyDescriptor() {
        throw new Error(privateMarker)
      },
    }
  )

  for (const saveResult of [
    statusGetterResult,
    revokedResult.proxy,
    descriptorThrowingResult,
  ]) {
    const storageSystem = createStorageDouble({ initialLog, saveResult })
    let result

    assert.doesNotThrow(() => {
      result = createService(storageSystem).service.setFeaturedEntry(null)
    })
    assertFailure(result, 'storageFailed', 'unexpectedStorageResult', {
      mutation: true,
    })
    assert.deepEqual(result.lichtwaldLog, initialLog)
    assertErrorDoesNotContain(result, [privateMarker])
  }

  assert.equal(statusGetterCalls, 0)
})

test('reicht bekannte Save-Fehler nur als erlaubte Paare mit statischer redigierter Meldung weiter', () => {
  const initialLog = createPrivateLog()
  const privateMarker = 'fixture-foreign-save-message-sentinel'
  const failures = [
    ['invalidKey', 'invalidStorageKey'],
    ['invalidLimit', 'invalidStorageLimit'],
    ['unavailable', 'storageAdapterUnavailable'],
    ['unavailable', 'storageUnavailable'],
    ['readFailed', 'storageReadFailed'],
    ['invalidJson', 'invalidJson'],
    ['sizeLimitExceeded', 'storageSizeLimitExceeded'],
    ['invalidStoredData', 'invalidLichtwaldLogData'],
    ['serializationFailed', 'serializationFailed'],
    ['quotaExceeded', 'storageQuotaExceeded'],
    ['writeFailed', 'storageWriteFailed'],
    ['validationFailed', 'privateLichtwaldLogRequired'],
  ]

  for (const [status, code] of failures) {
    const storageSystem = createStorageDouble({
      initialLog,
      saveResult: createStorageFailure(status, code, privateMarker),
    })
    const result = createService(storageSystem).service.setFeaturedEntry(null)

    assertFailure(result, status, code, { mutation: true })
    assert.deepEqual(result.lichtwaldLog, initialLog)
    assert.deepEqual(storageSystem.peekStoredLog(), initialLog)
    assert.equal(storageSystem.state.loadCalls, 1)
    assert.equal(storageSystem.state.saveCalls, 1)
    assertErrorDoesNotContain(result, [privateMarker])
  }
})

test('entkoppelt Eingabe, Load-Resultat, Save-Argument, Einzel- und Snapshot-Rückgaben vollständig', () => {
  const initialLog = createPrivateLog()
  const storageSystem = createStorageDouble({ initialLog })
  const loadedReference = storageSystem.getStoredReference()
  const loadedSnapshot = cloneValue(loadedReference)
  const { service } = createService(storageSystem, [
    'lichtwald-entry-clone-matrix',
  ])
  const input = deepFreeze({
    calendarDate: '2030-10-10',
    title: 'Erfundene Clone-Matrix-Karte',
    text: 'Synthetischer Text zur vollständigen Referenzentkopplung.',
    tags: ['Clone', 'Matrix'],
  })
  const inputSnapshot = cloneValue(input)

  const result = service.createEntry(input)

  assert.equal(result.ok, true)
  assert.deepEqual(input, inputSnapshot)
  assert.deepEqual(loadedReference, loadedSnapshot)
  const savedArgument = storageSystem.state.savedArguments[0]
  const persistedSnapshot = storageSystem.peekStoredLog()
  const createdInLog = result.lichtwaldLog.entries.at(-1)

  assert.notStrictEqual(result.lichtwaldLog, savedArgument)
  assert.notStrictEqual(result.createdEntry, createdInLog)
  assert.notStrictEqual(result.createdEntry.tags, createdInLog.tags)
  assert.notStrictEqual(createdInLog.tags, savedArgument.entries.at(-1).tags)

  result.createdEntry.tags.push('NurEinzelrückgabe')
  createdInLog.text = 'Nur die Snapshot-Rückgabe.'
  savedArgument.entries.at(-1).title = 'Nur das Save-Argument.'

  assert.deepEqual(storageSystem.peekStoredLog(), persistedSnapshot)
  assert.equal(
    service.loadLog().lichtwaldLog.entries.at(-1).title,
    'Erfundene Clone-Matrix-Karte'
  )
})

test('liefert auch nach Save-Fehler einen entkoppelten vorherigen Snapshot statt des Kandidaten', () => {
  const initialLog = createPrivateLog()
  const storageSystem = createStorageDouble({
    initialLog,
    saveResult: createStorageFailure(
      'quotaExceeded',
      'storageQuotaExceeded',
      'fixture-quota-foreign-message'
    ),
  })
  const loadedReference = storageSystem.getStoredReference()
  const result = createService(storageSystem).service.updateEntry(
    initialLog.entries[0].id,
    createEntryInput(initialLog.entries[0], {
      title: 'Nicht persistierter Kandidatentitel',
    })
  )

  assert.deepEqual(result.lichtwaldLog, initialLog)
  assert.notStrictEqual(result.lichtwaldLog, loadedReference)
  result.lichtwaldLog.entries[0].tags.push('NurFehlerrückgabe')
  assert.deepEqual(loadedReference, initialLog)
  assert.deepEqual(storageSystem.peekStoredLog(), initialLog)
})

test('liefert statische Fehler ohne Input-, ID-, Tag-, Generator- oder Fremdmeldungs-Leaks', () => {
  const privateMarkers = [
    'fixture-private-title-marker',
    'fixture-private-text-marker',
    'fixture-private-tag-marker',
    'fixture-private-id-marker',
    'fixture-private-generator-marker',
    'fixture-private-storage-marker',
  ]
  const invalidInputResult = createService(createStorageDouble()).service
    .createEntry({
      calendarDate: 'fixture-invalid-date-marker',
      title: ` ${privateMarkers[0]} `,
      text: ` ${privateMarkers[1]} `,
      tags: [` ${privateMarkers[2]} `],
    })
  const invalidIdResult = createService(createStorageDouble()).service
    .deleteEntry(` ${privateMarkers[3]} `)
  const generatorSystem = createStorageDouble()
  const generatorResult = createService(generatorSystem, [
    new Error(privateMarkers[4]),
  ]).service.createEntry(createEntryInput())
  const storageResult = createService(createStorageDouble({
    loadResult: createStorageFailure(
      'readFailed',
      'storageReadFailed',
      privateMarkers[5]
    ),
  })).service.loadLog()

  for (const result of [
    invalidInputResult,
    invalidIdResult,
    generatorResult,
    storageResult,
  ]) {
    assertErrorDoesNotContain(result, privateMarkers)
  }

  const repeatedA = createService(createStorageDouble()).service.deleteEntry(' ')
  const repeatedB = createService(createStorageDouble()).service.deleteEntry('\n')
  assert.deepEqual(repeatedA.error, repeatedB.error)
})

test('persistiert Create, Update, Fokus und atomaren Delete über neue reale In-Memory-Instanzen', () => {
  const fakeStorage = new FakeStorage()
  const firstStorage = createLichtwaldLogStorage(
    createStorageAdapter(fakeStorage)
  )
  const generatedIds = [
    'lichtwald-entry-integration-a',
    'lichtwald-entry-integration-b',
  ]
  const idGenerator = createIdGenerator(...generatedIds)
  const firstService = createLichtwaldLogService({
    lichtwaldLogStorage: firstStorage,
    generateLichtwaldLogEntryId:
      idGenerator.generateLichtwaldLogEntryId,
  })

  const firstCreate = firstService.createEntry({
    calendarDate: '2032-01-12',
    title: 'Erfundene Integrationskarte A',
    text: 'Synthetischer persistenter Inhalt A.',
    tags: ['Integration', 'A'],
  })
  const secondCreate = firstService.createEntry({
    calendarDate: '2032-01-11',
    title: 'Erfundene Integrationskarte B',
    text: 'Synthetischer persistenter Inhalt B.',
    tags: ['Integration', 'B'],
  })

  assert.equal(firstCreate.ok, true)
  assert.equal(secondCreate.ok, true)
  assert.deepEqual(
    secondCreate.lichtwaldLog.entries.map(({ id }) => id),
    generatedIds
  )
  assert.notEqual(fakeStorage.peek(LICHTWALD_LOG_STORAGE_KEY), null)

  const secondStorage = createLichtwaldLogStorage(
    createStorageAdapter(fakeStorage)
  )
  const secondService = createLichtwaldLogService({
    lichtwaldLogStorage: secondStorage,
  })
  const reloadedAfterCreate = secondService.loadLog()

  assert.equal(reloadedAfterCreate.ok, true)
  assert.equal(reloadedAfterCreate.status, 'loaded')
  assert.deepEqual(reloadedAfterCreate.lichtwaldLog, secondCreate.lichtwaldLog)

  const updateResult = secondService.updateEntry(generatedIds[0], {
    calendarDate: '2400-02-29',
    title: 'Aktualisierte erfundene Integrationskarte A',
    text: 'Synthetischer dauerhaft aktualisierter Inhalt A.',
    tags: ['Aktualisiert', 'A'],
  })
  const focusResult = secondService.setFeaturedEntry(generatedIds[1])
  const deleteResult = secondService.deleteEntry(generatedIds[1])

  assert.equal(updateResult.ok, true)
  assert.equal(focusResult.ok, true)
  assert.equal(deleteResult.ok, true)
  assert.equal(deleteResult.focusCleared, true)
  assert.equal(deleteResult.lichtwaldLog.featuredEntryId, null)

  const thirdStorage = createLichtwaldLogStorage(
    createStorageAdapter(fakeStorage)
  )
  const thirdService = createLichtwaldLogService({
    lichtwaldLogStorage: thirdStorage,
  })
  const finalLoad = thirdService.loadLog()

  assert.equal(finalLoad.ok, true)
  assert.deepEqual(finalLoad.lichtwaldLog, deleteResult.lichtwaldLog)
  assert.equal(finalLoad.lichtwaldLog.entries.length, 1)
  assert.equal(finalLoad.lichtwaldLog.entries[0].id, generatedIds[0])
  assert.equal(
    finalLoad.lichtwaldLog.entries[0].title,
    'Aktualisierte erfundene Integrationskarte A'
  )
  assert.equal(finalLoad.lichtwaldLog.featuredEntryId, null)
  assert.deepEqual(validateLichtwaldLog(finalLoad.lichtwaldLog), {
    ok: true,
    errors: [],
  })
})

test('erhält bei kontrollierten Create-Save-Fehlern exakt den vorherigen vertrauenswürdigen Snapshot', () => {
  const failureCases = [
    ['validationFailed', 'invalidLichtwaldLogData'],
    ['invalidStoredData', 'privateLichtwaldLogRequired'],
    ['storageFailed', 'unexpectedStorageResult'],
  ]

  for (const [status, code] of failureCases) {
    const privateMarker = `fixture-create-save-${status}-${code}-sentinel`
    const initialLog = createPrivateLog([
      createEntry({
        id: `lichtwald-entry-trusted-${status}`,
        text: `Synthetischer vertrauenswürdiger Ausgangstext ${status}.`,
      }),
    ])
    const storageSystem = createStorageDouble({
      initialLog,
      saveResult: createStorageFailure(status, code, privateMarker),
    })
    const loadedReference = storageSystem.getStoredReference()
    const loadedSnapshot = cloneValue(loadedReference)
    const frozenInput = deepFreeze({
      calendarDate: '2034-04-04',
      title: 'Erfundener fehlgeschlagener Create-Kandidat',
      text: 'Dieser synthetische Kandidat darf nicht autoritativ werden.',
      tags: ['Create', 'Fehlerpfad'],
    })
    const inputSnapshot = cloneValue(frozenInput)
    const { service } = createService(storageSystem, [
      `lichtwald-entry-candidate-${status}`,
    ])

    const result = service.createEntry(frozenInput)
    const savedCandidate = storageSystem.state.savedArguments[0]

    assertFailure(result, status, code, { mutation: true })
    assert.equal(result.ok, false)
    assert.equal(result.changed, false)
    assert.equal(storageSystem.state.loadCalls, 1)
    assert.equal(storageSystem.state.saveCalls, 1)
    assert.deepEqual(result.lichtwaldLog, initialLog)
    assert.notStrictEqual(result.lichtwaldLog, loadedReference)
    assert.equal(result.lichtwaldLog.entries.length, 1)
    assert.equal(savedCandidate.entries.length, 2)
    assert.equal(
      result.lichtwaldLog.entries.some(
        ({ id }) => id === `lichtwald-entry-candidate-${status}`
      ),
      false
    )
    assert.equal(Object.hasOwn(result, 'createdEntry'), false)
    assertErrorDoesNotContain(result, [privateMarker])
    assert.deepEqual(loadedReference, loadedSnapshot)
    assert.deepEqual(storageSystem.peekStoredLog(), loadedSnapshot)
    assert.deepEqual(frozenInput, inputSnapshot)
    assert.equal(Object.isFrozen(frozenInput), true)
    assert.equal(Object.isFrozen(frozenInput.tags), true)
  }
})
