import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
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
import * as lichtwaldLogDemoServiceModule from '../src/services/lichtwaldLogDemoService.js'
import { createLichtwaldLogService } from '../src/services/lichtwaldLogService.js'
import { createLichtwaldLogDemoStorage } from '../src/storage/lichtwaldLogDemoStorage.js'

const { createLichtwaldLogDemoService } = lichtwaldLogDemoServiceModule

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

function createEntry(overrides = {}) {
  return {
    id: 'lichtwald-demo-entry-prisma-1',
    calendarDate: '2084-04-12',
    title: '[Demo-Test] Erfundenes Prismafenster',
    text: 'Eine vollständig erfundene Lichtspur kreuzt das Testprisma.',
    tags: ['Prisma', 'Fiktiv'],
    ...overrides,
  }
}

function createLog(
  entries = [createEntry()],
  overrides = {}
) {
  return {
    schemaVersion: LICHTWALD_LOG_SCHEMA_VERSION,
    dataOrigin: 'synthetic',
    featuredEntryId: entries[0]?.id ?? null,
    entries,
    ...overrides,
  }
}

function createEmptyLog(origin = 'synthetic') {
  return createLog([], { dataOrigin: origin, featuredEntryId: null })
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
    id: `lichtwald-demo-entry-count-${index}`,
    calendarDate: index % 2 === 0 ? '2400-02-29' : '2098-11-30',
    title: `[Demo-Test] Erfundenes Zählfenster ${index}`,
    text: `Vollständig erfundene Zählfixture ${index}.`,
    tags: [],
  }))
}

function createIdGenerator(...generatedValues) {
  const calls = []
  let valueIndex = 0

  function generateLichtwaldLogDemoEntryId() {
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

  return { calls, generateLichtwaldLogDemoEntryId }
}

function isExactSavedResult(result) {
  try {
    if (
      result === null ||
      typeof result !== 'object' ||
      Object.getPrototypeOf(result) !== Object.prototype
    ) {
      return false
    }

    const ownKeys = Reflect.ownKeys(result)
    const okDescriptor = Object.getOwnPropertyDescriptor(result, 'ok')
    const statusDescriptor = Object.getOwnPropertyDescriptor(result, 'status')

    return (
      ownKeys.length === 2 &&
      ownKeys.includes('ok') &&
      ownKeys.includes('status') &&
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
  initialLog = createLog(),
  loadResult,
  saveResult,
  throwOnLoad = false,
  throwOnSave = false,
} = {}) {
  let storedLog = cloneValue(initialLog)
  const state = {
    loadCalls: 0,
    saveCalls: 0,
    savedArguments: [],
  }

  const lichtwaldLogDemoStorage = {
    loadLichtwaldLog() {
      state.loadCalls += 1

      if (throwOnLoad) {
        throw new Error('fixture-demo-load-foreign-message')
      }

      if (loadResult !== undefined) {
        return typeof loadResult === 'function'
          ? loadResult()
          : loadResult
      }

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
      assert.equal(lichtwaldLog.dataOrigin, 'synthetic')

      if (throwOnSave) {
        throw new Error('fixture-demo-save-foreign-message')
      }

      const configuredResult = typeof saveResult === 'function'
        ? saveResult(lichtwaldLog)
        : saveResult

      if (configuredResult !== undefined) {
        if (isExactSavedResult(configuredResult)) {
          storedLog = cloneValue(lichtwaldLog)
        }

        return configuredResult
      }

      storedLog = cloneValue(lichtwaldLog)
      return { ok: true, status: 'saved' }
    },
  }

  return {
    lichtwaldLogDemoStorage,
    state,
    getStoredReference() {
      return storedLog
    },
    peekStoredLog() {
      return cloneValue(storedLog)
    },
    replaceStoredLog(lichtwaldLog) {
      storedLog = cloneValue(lichtwaldLog)
    },
  }
}

function createService(storageSystem, generatedIds = []) {
  const idGenerator = createIdGenerator(...generatedIds)
  const service = createLichtwaldLogDemoService({
    lichtwaldLogDemoStorage: storageSystem.lichtwaldLogDemoStorage,
    generateLichtwaldLogDemoEntryId:
      idGenerator.generateLichtwaldLogDemoEntryId,
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

  if (expectedField) {
    assert.equal(typeof result.error.fieldErrors[expectedField], 'string')
  }
}

function assertErrorDoesNotContain(result, markers) {
  const serializedError = JSON.stringify(result.error)

  for (const marker of markers) {
    assert.equal(serializedError.includes(marker), false)
  }
}

function normalizeResultOrigin(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeResultOrigin)
  }

  if (value && typeof value === 'object') {
    const normalized = {}

    for (const [propertyName, propertyValue] of Object.entries(value)) {
      normalized[propertyName] = propertyName === 'dataOrigin'
        ? 'normalized-origin'
        : normalizeResultOrigin(propertyValue)
    }

    return normalized
  }

  return value
}

test('exportiert ausschließlich die Factory und liefert die exakt eingefrorene Fünf-Methoden-API', () => {
  const service = createService(createStorageDouble()).service

  assert.deepEqual(Object.keys(lichtwaldLogDemoServiceModule), [
    'createLichtwaldLogDemoService',
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

test('lädt ausschließlich synthetische Snapshots mit controllerkompatibler Shape tief entkoppelt und ohne Cache', () => {
  const initialLog = createLog([
    createEntry(),
    createEntry({
      id: 'lichtwald-demo-entry-spektrum-2',
      calendarDate: '2085-05-13',
      title: '[Demo-Test] Erfundenes Spektrumfenster',
      tags: ['Spektrum'],
    }),
  ])
  const storageSystem = createStorageDouble({ initialLog })
  const storedReference = storageSystem.getStoredReference()
  const service = createService(storageSystem).service

  const firstResult = service.loadLog()

  assert.deepEqual(Object.keys(firstResult).sort(), [
    'initialized',
    'lichtwaldLog',
    'ok',
    'status',
  ])
  assert.equal(firstResult.ok, true)
  assert.equal(firstResult.status, 'loaded')
  assert.equal(firstResult.initialized, false)
  assert.equal(firstResult.lichtwaldLog.dataOrigin, 'synthetic')
  assert.deepEqual(firstResult.lichtwaldLog, initialLog)
  assert.notStrictEqual(firstResult.lichtwaldLog, storedReference)
  assert.notStrictEqual(firstResult.lichtwaldLog.entries, storedReference.entries)
  assert.notStrictEqual(
    firstResult.lichtwaldLog.entries[0].tags,
    storedReference.entries[0].tags
  )

  firstResult.lichtwaldLog.entries[0].text = 'Nur die erste Rückgabe.'
  firstResult.lichtwaldLog.entries[0].tags.push('NurRückgabe')
  const replacement = createLog([
    createEntry({
      id: 'lichtwald-demo-entry-ersatz-3',
      title: '[Demo-Test] Erfundenes Ersatzfenster',
    }),
  ])
  storageSystem.replaceStoredLog(replacement)

  const secondResult = service.loadLog()

  assert.deepEqual(secondResult.lichtwaldLog, replacement)
  assert.equal(storageSystem.state.loadCalls, 2)
  assert.equal(storageSystem.state.saveCalls, 0)
})

test('weist private, malformed und origin-falsche Storage-Snapshots fail-closed ohne Save zurück', () => {
  const markers = [
    'fixture-private-origin-sentinel',
    'fixture-malformed-demo-sentinel',
    'fixture-hostile-demo-sentinel',
  ]
  const privateLog = createLog([
    createEntry({ text: markers[0] }),
  ], { dataOrigin: 'private' })
  const malformedLog = createLog([
    createEntry({ title: ` ${markers[1]} ` }),
  ])
  const hostileLog = new Proxy(createLog(), {
    getPrototypeOf() {
      throw new Error(markers[2])
    },
  })

  for (const lichtwaldLog of [privateLog, malformedLog, hostileLog]) {
    const storageSystem = createStorageDouble({
      loadResult: { ok: true, status: 'found', lichtwaldLog },
    })
    let result

    assert.doesNotThrow(() => {
      result = createService(storageSystem).service.loadLog()
    })
    assertFailure(result, 'storageFailed', 'unexpectedStorageResult')
    assert.equal(result.lichtwaldLog, null)
    assert.equal(storageSystem.state.loadCalls, 1)
    assert.equal(storageSystem.state.saveCalls, 0)
    assertErrorDoesNotContain(result, markers)
  }
})

test('normalisiert fehlende, werfende und unbrauchbare Load-Abhängigkeiten auf statische Fehler', () => {
  const missingResult = createLichtwaldLogDemoService().loadLog()

  assertFailure(
    missingResult,
    'unavailable',
    'lichtwaldLogStorageUnavailable'
  )
  assert.equal(missingResult.lichtwaldLog, null)

  const thrownResult = createService(createStorageDouble({
    throwOnLoad: true,
  })).service.loadLog()

  assertFailure(thrownResult, 'readFailed', 'lichtwaldLogStorageReadFailed')
  assertErrorDoesNotContain(thrownResult, [
    'fixture-demo-load-foreign-message',
  ])

  const malformedResults = [
    null,
    { ok: true, status: 'missing', lichtwaldLog: createEmptyLog() },
    { ok: true, status: 'found' },
    { ok: 'true', status: 'found', lichtwaldLog: createLog() },
    {
      ok: true,
      status: 'found',
      lichtwaldLog: createLog(),
      unknown: 'fixture-extra-result-field',
    },
  ]

  for (const loadResult of malformedResults) {
    const result = createService(createStorageDouble({ loadResult }))
      .service.loadLog()

    assertFailure(result, 'storageFailed', 'unexpectedStorageResult')
  }
})

test('weist accessor- und proxybasierte Load-Resultate ohne Ausführung oder Rohtext zurück', () => {
  const marker = 'fixture-hostile-load-result-message'
  let getterCalls = 0
  const getterResult = {
    status: 'found',
    lichtwaldLog: createLog(),
  }
  Object.defineProperty(getterResult, 'ok', {
    enumerable: true,
    get() {
      getterCalls += 1
      throw new Error(marker)
    },
  })
  const revoked = Proxy.revocable({
    ok: true,
    status: 'found',
    lichtwaldLog: createLog(),
  }, {})
  revoked.revoke()

  for (const loadResult of [getterResult, revoked.proxy]) {
    let result

    assert.doesNotThrow(() => {
      result = createService(createStorageDouble({ loadResult }))
        .service.loadLog()
    })
    assertFailure(result, 'storageFailed', 'unexpectedStorageResult')
    assertErrorDoesNotContain(result, [marker])
  }

  assert.equal(getterCalls, 0)
})

test('validiert Form- und Ziel-ID-Eingaben vor Load, Save und Generator', () => {
  const invalidCreateCases = [
    [null, 'form'],
    [{ calendarDate: '2084-02-30', title: 'Titel', text: 'Text', tags: [] }, 'calendarDate'],
    [{ calendarDate: '2084-02-29', title: ' ', text: 'Text', tags: [] }, 'title'],
    [{ calendarDate: '2084-02-29', title: 'T'.repeat(LICHTWALD_LOG_TITLE_MAX_LENGTH + 1), text: 'Text', tags: [] }, 'title'],
    [{ calendarDate: '2084-02-29', title: 'Titel', text: '\n ', tags: [] }, 'text'],
    [{ calendarDate: '2084-02-29', title: 'Titel', text: 'X'.repeat(LICHTWALD_LOG_TEXT_MAX_LENGTH + 1), tags: [] }, 'text'],
    [{ calendarDate: '2084-02-29', title: 'Titel', text: 'Text', tags: 'Tag' }, 'tags'],
    [{ calendarDate: '2084-02-29', title: 'Titel', text: 'Text', tags: Array.from({ length: LICHTWALD_LOG_MAX_TAG_COUNT + 1 }, (_, index) => `Tag ${index}`) }, 'tags'],
    [{ calendarDate: '2084-02-29', title: 'Titel', text: 'Text', tags: ['A', ' a '] }, 'tags'],
    [{ calendarDate: '2084-02-29', title: 'Titel', text: 'Text', tags: ['Z'.repeat(LICHTWALD_LOG_TAG_MAX_LENGTH + 1)] }, 'tags'],
  ]

  for (const [input, expectedField] of invalidCreateCases) {
    const storageSystem = createStorageDouble()
    const { idGenerator, service } = createService(storageSystem, [
      'lichtwald-demo-entry-unused',
    ])
    const result = service.createEntry(input)

    assertInputFailure(result, expectedField)
    assert.equal(storageSystem.state.loadCalls, 0)
    assert.equal(storageSystem.state.saveCalls, 0)
    assert.equal(idGenerator.calls.length, 0)
  }

  const invalidTargets = [
    (service) => service.updateEntry(' id ', createEntryInput()),
    (service) => service.deleteEntry(''),
    (service) => service.deleteEntry(Symbol('id')),
    (service) => service.setFeaturedEntry(false),
    (service) => service.setFeaturedEntry('i'.repeat(LICHTWALD_LOG_ID_MAX_LENGTH + 1)),
  ]

  for (const runOperation of invalidTargets) {
    const storageSystem = createStorageDouble()
    const { idGenerator, service } = createService(storageSystem)
    const result = runOperation(service)

    assertInputFailure(result)
    assert.equal(storageSystem.state.loadCalls, 0)
    assert.equal(storageSystem.state.saveCalls, 0)
    assert.equal(idGenerator.calls.length, 0)
  }
})

test('weist feindliche Form- und Tagstrukturen kontrolliert vor Storage zurück', () => {
  const marker = 'fixture-hostile-demo-input-message'
  let titleGetterCalls = 0
  const getterInput = createEntryInput()
  Object.defineProperty(getterInput, 'title', {
    enumerable: true,
    get() {
      titleGetterCalls += 1
      throw new Error(marker)
    },
  })
  const sparseTags = ['Prisma']
  sparseTags.length = 2
  const extraTags = ['Prisma']
  extraTags.fixtureExtra = marker
  const throwingTags = ['Prisma']
  Object.defineProperty(throwingTags, '0', {
    enumerable: true,
    get() {
      throw new Error(marker)
    },
  })
  const revokedInput = Proxy.revocable(createEntryInput(), {})
  revokedInput.revoke()

  const inputs = [
    getterInput,
    revokedInput.proxy,
    createEntryInput(createEntry(), { tags: sparseTags }),
    createEntryInput(createEntry(), { tags: extraTags }),
    createEntryInput(createEntry(), { tags: throwingTags }),
  ]

  for (const input of inputs) {
    const storageSystem = createStorageDouble()
    const result = createService(storageSystem).service.createEntry(input)

    assertInputFailure(result)
    assertErrorDoesNotContain(result, [marker])
    assert.equal(storageSystem.state.loadCalls, 0)
    assert.equal(storageSystem.state.saveCalls, 0)
  }

  assert.ok(titleGetterCalls <= 1)
})

test('normalisiert nur äußere Ränder und erhält interne Whitespaces, Zeilenumbrüche und Tag-Reihenfolge', () => {
  const storageSystem = createStorageDouble({ initialLog: createEmptyLog() })
  const input = deepFreeze({
    calendarDate: ' 2400-02-29 ',
    title: ` ${'T'.repeat(LICHTWALD_LOG_TITLE_MAX_LENGTH)} `,
    text: '  Erste vollständig erfundene Zeile\n  zweite Zeile.  ',
    tags: ['  Zeta  ', ' Alpha ', 'Wald, Licht'],
  })
  const inputSnapshot = cloneValue(input)
  const result = createService(storageSystem, [
    'i'.repeat(LICHTWALD_LOG_ID_MAX_LENGTH),
  ]).service.createEntry(input)

  assert.equal(result.ok, true)
  assert.deepEqual(result.createdEntry, {
    id: 'i'.repeat(LICHTWALD_LOG_ID_MAX_LENGTH),
    calendarDate: '2400-02-29',
    title: 'T'.repeat(LICHTWALD_LOG_TITLE_MAX_LENGTH),
    text: 'Erste vollständig erfundene Zeile\n  zweite Zeile.',
    tags: ['Zeta', 'Alpha', 'Wald, Licht'],
  })
  assert.deepEqual(input, inputSnapshot)
})

test('Create hängt ohne Sortierung an, bewahrt den Fokus und speichert genau einen synthetischen Vollzustand', () => {
  const entries = [
    createEntry({
      id: 'lichtwald-demo-entry-spaet',
      calendarDate: '2099-12-31',
    }),
    createEntry({
      id: 'lichtwald-demo-entry-frueh',
      calendarDate: '2080-01-01',
      title: '[Demo-Test] Erfundenes frühes Fenster',
    }),
  ]
  const initialLog = createLog(entries, { featuredEntryId: entries[1].id })
  const storageSystem = createStorageDouble({ initialLog })
  const input = {
    calendarDate: ' 2088-08-08 ',
    title: ' [Demo-Test] Erfundenes mittleres Fenster ',
    text: ' Vollständig erfundener Inhalt. ',
    tags: [' Neu ', 'Fiktiv'],
  }
  const result = createService(storageSystem, [
    'lichtwald-demo-entry-neu',
  ]).service.createEntry(input)

  assert.deepEqual(Object.keys(result).sort(), [
    'changed',
    'createdEntry',
    'lichtwaldLog',
    'ok',
    'status',
  ])
  assert.equal(result.ok, true)
  assert.equal(result.status, 'entryCreated')
  assert.equal(result.changed, true)
  assert.deepEqual(result.lichtwaldLog.entries.map(({ id }) => id), [
    entries[0].id,
    entries[1].id,
    'lichtwald-demo-entry-neu',
  ])
  assert.equal(result.lichtwaldLog.featuredEntryId, entries[1].id)
  assert.equal(result.lichtwaldLog.dataOrigin, 'synthetic')
  assert.equal(storageSystem.state.loadCalls, 1)
  assert.equal(storageSystem.state.saveCalls, 1)
  assert.deepEqual(storageSystem.state.savedArguments[0], result.lichtwaldLog)
})

test('Update erhält ID, Position, Fokus und synthetische Herkunft', () => {
  const entries = [
    createEntry({ id: 'lichtwald-demo-entry-vorher' }),
    createEntry({
      id: 'lichtwald-demo-entry-ziel',
      title: '[Demo-Test] Erfundenes Ziel',
    }),
    createEntry({
      id: 'lichtwald-demo-entry-nachher',
      title: '[Demo-Test] Erfundenes Folgefenster',
    }),
  ]
  const initialLog = createLog(entries, { featuredEntryId: entries[1].id })
  const storageSystem = createStorageDouble({ initialLog })
  const input = {
    calendarDate: ' 2089-09-09 ',
    title: ' [Demo-Test] Aktualisiertes Ziel ',
    text: ' Vollständig erfundener Ersatztext. ',
    tags: ['Neu'],
    id: 'nicht-zu-übernehmende-id',
  }
  const result = createService(storageSystem).service.updateEntry(
    entries[1].id,
    input
  )

  assert.equal(result.ok, true)
  assert.equal(result.status, 'entryUpdated')
  assert.equal(result.changed, true)
  assert.equal(result.updatedEntry.id, entries[1].id)
  assert.deepEqual(result.lichtwaldLog.entries.map(({ id }) => id),
    entries.map(({ id }) => id))
  assert.equal(result.lichtwaldLog.featuredEntryId, entries[1].id)
  assert.equal(result.lichtwaldLog.dataOrigin, 'synthetic')
  assert.equal(storageSystem.state.loadCalls, 1)
  assert.equal(storageSystem.state.saveCalls, 1)
})

test('normalisiert identisches Update als schreibfreien No-op mit entkoppelten Rückgaben', () => {
  const initialLog = createLog()
  const storageSystem = createStorageDouble({ initialLog })
  const entry = initialLog.entries[0]
  const result = createService(storageSystem).service.updateEntry(
    entry.id,
    {
      calendarDate: ` ${entry.calendarDate} `,
      title: ` ${entry.title} `,
      text: ` ${entry.text} `,
      tags: entry.tags.map((tag) => ` ${tag} `),
    }
  )

  assert.equal(result.ok, true)
  assert.equal(result.status, 'entryUpdated')
  assert.equal(result.changed, false)
  assert.deepEqual(result.updatedEntry, entry)
  assert.notStrictEqual(result.updatedEntry, result.lichtwaldLog.entries[0])
  assert.notStrictEqual(result.updatedEntry.tags, result.lichtwaldLog.entries[0].tags)
  assert.equal(storageSystem.state.loadCalls, 1)
  assert.equal(storageSystem.state.saveCalls, 0)
})

test('Delete bewahrt Reihenfolge und löscht einen gesetzten Fokus atomar im selben Save-Kandidaten', () => {
  const entries = [
    createEntry({ id: 'lichtwald-demo-entry-keep-a' }),
    createEntry({
      id: 'lichtwald-demo-entry-delete',
      title: '[Demo-Test] Erfundenes Löschziel',
    }),
    createEntry({
      id: 'lichtwald-demo-entry-keep-b',
      title: '[Demo-Test] Erfundenes Schlussfenster',
    }),
  ]
  const initialLog = createLog(entries, { featuredEntryId: entries[1].id })
  let observedCandidate
  const storageSystem = createStorageDouble({
    initialLog,
    saveResult(candidate) {
      observedCandidate = cloneValue(candidate)
      return { ok: true, status: 'saved' }
    },
  })
  const result = createService(storageSystem).service.deleteEntry(entries[1].id)

  assert.deepEqual(Object.keys(result).sort(), [
    'changed',
    'deletedEntryId',
    'focusCleared',
    'lichtwaldLog',
    'ok',
    'status',
  ])
  assert.equal(result.ok, true)
  assert.equal(result.status, 'entryDeleted')
  assert.equal(result.focusCleared, true)
  assert.equal(result.lichtwaldLog.featuredEntryId, null)
  assert.deepEqual(result.lichtwaldLog.entries.map(({ id }) => id), [
    entries[0].id,
    entries[2].id,
  ])
  assert.deepEqual(observedCandidate, result.lichtwaldLog)
  assert.equal(observedCandidate.dataOrigin, 'synthetic')
  assert.equal(storageSystem.state.saveCalls, 1)
})

test('Delete eines nicht fokussierten Eintrags erhält Fokus und Reihenfolge der übrigen Einträge', () => {
  const entries = [
    createEntry({ id: 'lichtwald-demo-entry-delete-keep-focus' }),
    createEntry({
      id: 'lichtwald-demo-entry-delete-middle',
      title: '[Demo-Test] Erfundenes mittleres Löschfenster',
    }),
    createEntry({
      id: 'lichtwald-demo-entry-delete-keep-last',
      title: '[Demo-Test] Erfundenes letztes Löschfenster',
    }),
  ]
  const initialLog = createLog(entries, { featuredEntryId: entries[0].id })
  const storageSystem = createStorageDouble({ initialLog })
  const result = createService(storageSystem).service.deleteEntry(entries[1].id)

  assert.equal(result.ok, true)
  assert.equal(result.focusCleared, false)
  assert.equal(result.lichtwaldLog.featuredEntryId, entries[0].id)
  assert.deepEqual(result.lichtwaldLog.entries.map(({ id }) => id), [
    entries[0].id,
    entries[2].id,
  ])
  assert.equal(storageSystem.state.saveCalls, 1)
})

test('setzt, wechselt und entfernt den Fokus mit schreibfreien gleichen und leeren No-ops', () => {
  const entries = [
    createEntry({ id: 'lichtwald-demo-entry-focus-a' }),
    createEntry({
      id: 'lichtwald-demo-entry-focus-b',
      title: '[Demo-Test] Erfundenes Fokusfenster B',
    }),
  ]
  const storageSystem = createStorageDouble({
    initialLog: createLog(entries, { featuredEntryId: null }),
  })
  const service = createService(storageSystem).service

  const setA = service.setFeaturedEntry(entries[0].id)
  const setB = service.setFeaturedEntry(entries[1].id)
  const repeatB = service.setFeaturedEntry(entries[1].id)
  const clear = service.setFeaturedEntry(null)
  const repeatClear = service.setFeaturedEntry(null)

  assert.deepEqual(
    [setA.changed, setB.changed, repeatB.changed, clear.changed, repeatClear.changed],
    [true, true, false, true, false]
  )
  for (const result of [setA, setB, repeatB, clear, repeatClear]) {
    assert.equal(result.ok, true)
    assert.equal(result.status, 'featuredEntryUpdated')
    assert.equal(result.lichtwaldLog.dataOrigin, 'synthetic')
  }
  assert.equal(storageSystem.state.loadCalls, 5)
  assert.equal(storageSystem.state.saveCalls, 3)
})

test('Not-found-Ziele bleiben exakt case-sensitive, schreibfrei und zeigen keine Ziel-ID im Fehler', () => {
  const initialLog = createLog([
    createEntry({ id: 'lichtwald-demo-entry-CaseTarget' }),
  ])
  const marker = 'lichtwald-demo-entry-casetarget'
  const operations = [
    (service) => service.updateEntry(marker, createEntryInput()),
    (service) => service.deleteEntry('lichtwald-demo-entry-missing-sentinel'),
    (service) => service.setFeaturedEntry('LICHTWALD-DEMO-ENTRY-CASETARGET'),
  ]

  for (const runOperation of operations) {
    const storageSystem = createStorageDouble({ initialLog })
    const result = runOperation(createService(storageSystem).service)

    assertFailure(result, 'notFound', 'lichtwaldLogEntryNotFound', {
      mutation: true,
    })
    assert.deepEqual(result.lichtwaldLog, initialLog)
    assert.equal(storageSystem.state.loadCalls, 1)
    assert.equal(storageSystem.state.saveCalls, 0)
    assertErrorDoesNotContain(result, [
      marker,
      'lichtwald-demo-entry-missing-sentinel',
      'LICHTWALD-DEMO-ENTRY-CASETARGET',
    ])
  }
})

test('erlaubt 999 → 1.000 und ruft bei 1.000 weder Generator noch Save auf', () => {
  const entriesAt999 = createManyEntries(LICHTWALD_LOG_MAX_ENTRY_COUNT - 1)
  const successStorage = createStorageDouble({
    initialLog: createLog(entriesAt999, { featuredEntryId: null }),
  })
  const successSystem = createService(successStorage, [
    'lichtwald-demo-entry-count-final',
  ])
  const successResult = successSystem.service.createEntry(createEntryInput())

  assert.equal(successResult.ok, true)
  assert.equal(
    successResult.lichtwaldLog.entries.length,
    LICHTWALD_LOG_MAX_ENTRY_COUNT
  )
  assert.equal(successSystem.idGenerator.calls.length, 1)
  assert.equal(successStorage.state.saveCalls, 1)

  const fullStorage = createStorageDouble({
    initialLog: successResult.lichtwaldLog,
  })
  const fullSystem = createService(fullStorage, [
    'lichtwald-demo-entry-must-not-generate',
  ])
  const fullResult = fullSystem.service.createEntry(createEntryInput())

  assertFailure(
    fullResult,
    'limitReached',
    'lichtwaldLogEntryLimitReached',
    { mutation: true }
  )
  assert.equal(fullStorage.state.loadCalls, 1)
  assert.equal(fullStorage.state.saveCalls, 0)
  assert.equal(fullSystem.idGenerator.calls.length, 0)
})

test('begrenzt Kollision, Typ, Whitespace, Länge und Throw gemeinsam auf fünf ID-Versuche', () => {
  const initialLog = createLog()
  const marker = 'fixture-demo-generator-foreign-message'
  const storageSystem = createStorageDouble({ initialLog })
  const { idGenerator, service } = createService(storageSystem, [
    initialLog.entries[0].id,
    42,
    ' ungetrimmte-demo-id ',
    'i'.repeat(LICHTWALD_LOG_ID_MAX_LENGTH + 1),
    new Error(marker),
  ])
  const result = service.createEntry(createEntryInput())

  assertFailure(
    result,
    'generationFailed',
    'lichtwaldLogEntryIdGenerationFailed',
    { mutation: true }
  )
  assert.equal(idGenerator.calls.length, 5)
  assert.equal(storageSystem.state.saveCalls, 0)
  assert.deepEqual(result.lichtwaldLog, initialLog)
  assertErrorDoesNotContain(result, [marker, 'ungetrimmte-demo-id'])
})

test('akzeptiert die fünfte eindeutige ID case-sensitive', () => {
  const initialEntry = createEntry({ id: 'Lichtwald-Demo-Entry-Case' })
  const storageSystem = createStorageDouble({
    initialLog: createLog([initialEntry]),
  })
  const { idGenerator, service } = createService(storageSystem, [
    initialEntry.id,
    '',
    ' invalid ',
    'i'.repeat(LICHTWALD_LOG_ID_MAX_LENGTH + 1),
    'lichtwald-demo-entry-case',
  ])
  const result = service.createEntry(createEntryInput())

  assert.equal(result.ok, true)
  assert.equal(result.createdEntry.id, 'lichtwald-demo-entry-case')
  assert.equal(idGenerator.calls.length, 5)
  assert.equal(new Set(result.lichtwaldLog.entries.map(({ id }) => id)).size, 2)
})

test('verwendet ohne Generator-Injektion ausschließlich das synthetische randomUUID-Präfix', () => {
  const storageSystem = createStorageDouble({ initialLog: createEmptyLog() })
  const service = createLichtwaldLogDemoService({
    lichtwaldLogDemoStorage: storageSystem.lichtwaldLogDemoStorage,
  })
  const result = service.createEntry(createEntryInput())

  assert.equal(result.ok, true)
  assert.match(
    result.createdEntry.id,
    /^lichtwald-demo-entry-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  )
})

test('jede echte Mutation lädt und speichert höchstens einmal einen vollständigen synthetischen Kandidaten', () => {
  const cases = [
    {
      initialLog: createEmptyLog(),
      ids: ['lichtwald-demo-entry-count-create'],
      run(service) {
        return service.createEntry(createEntryInput())
      },
    },
    {
      initialLog: createLog(),
      ids: [],
      run(service, initialLog) {
        return service.updateEntry(
          initialLog.entries[0].id,
          createEntryInput(initialLog.entries[0], {
            title: '[Demo-Test] Geändertes Zählfenster',
          })
        )
      },
    },
    {
      initialLog: createLog(),
      ids: [],
      run(service) {
        return service.setFeaturedEntry(null)
      },
    },
    {
      initialLog: createLog(),
      ids: [],
      run(service, initialLog) {
        return service.deleteEntry(initialLog.entries[0].id)
      },
    },
  ]

  for (const mutationCase of cases) {
    const storageSystem = createStorageDouble({
      initialLog: mutationCase.initialLog,
    })
    const result = mutationCase.run(
      createService(storageSystem, mutationCase.ids).service,
      mutationCase.initialLog
    )

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
      'synthetic'
    )
  }
})

test('Save-Fehler bewahren ausschließlich den vorherigen vertrauenswürdigen Snapshot', () => {
  const initialLog = createLog()
  const marker = 'fixture-demo-save-private-value-sentinel'
  const storageSystem = createStorageDouble({
    initialLog,
    saveResult: createStorageFailure(
      'validationFailed',
      'invalidLichtwaldLogDemoData',
      marker
    ),
  })
  const loadedReference = storageSystem.getStoredReference()
  const result = createService(storageSystem).service.updateEntry(
    initialLog.entries[0].id,
    createEntryInput(initialLog.entries[0], {
      title: '[Demo-Test] Nicht autoritatives Kandidatenfenster',
    })
  )

  assertFailure(
    result,
    'validationFailed',
    'invalidLichtwaldLogDemoData',
    { mutation: true }
  )
  assert.deepEqual(result.lichtwaldLog, initialLog)
  assert.notStrictEqual(result.lichtwaldLog, loadedReference)
  assert.equal(Object.hasOwn(result, 'updatedEntry'), false)
  assert.deepEqual(storageSystem.peekStoredLog(), initialLog)
  assert.equal(storageSystem.state.savedArguments[0].entries[0].title,
    '[Demo-Test] Nicht autoritatives Kandidatenfenster')
  assertErrorDoesNotContain(result, [marker])
})

test('allowlistet Demo-Storage-Fehlerpaare mit eigenen statischen Meldungen', () => {
  const markerA = 'fixture-demo-storage-message-a'
  const markerB = 'fixture-demo-storage-message-b'
  const loadPairs = [
    ['invalidStoredData', 'invalidLichtwaldLogDemoData'],
    ['invalidStoredData', 'syntheticLichtwaldLogRequired'],
    ['serializationFailed', 'lichtwaldLogDemoSerializationFailed'],
    ['sizeLimitExceeded', 'lichtwaldLogDemoSizeLimitExceeded'],
  ]

  for (const [status, code] of loadPairs) {
    const first = createService(createStorageDouble({
      loadResult: createStorageFailure(status, code, markerA),
    })).service.loadLog()
    const second = createService(createStorageDouble({
      loadResult: createStorageFailure(status, code, markerB),
    })).service.loadLog()

    assertFailure(first, status, code)
    assert.deepEqual(first.error, second.error)
    assertErrorDoesNotContain(first, [markerA, markerB])
  }

  const savePairs = [
    ['validationFailed', 'invalidLichtwaldLogDemoData'],
    ['validationFailed', 'syntheticLichtwaldLogRequired'],
  ]

  for (const [status, code] of savePairs) {
    const storageSystem = createStorageDouble({
      saveResult: createStorageFailure(status, code, markerA),
    })
    const result = createService(storageSystem).service.setFeaturedEntry(null)

    assertFailure(result, status, code, { mutation: true })
    assertErrorDoesNotContain(result, [markerA])
  }
})

test('weist unbekannte, widersprüchliche und getterbasierte Save-Resultate kontrolliert zurück', () => {
  const marker = 'fixture-hostile-demo-save-result-message'
  let getterCalls = 0
  const getterResult = { ok: true }
  Object.defineProperty(getterResult, 'status', {
    enumerable: true,
    get() {
      getterCalls += 1
      throw new Error(marker)
    },
  })
  const cases = [
    null,
    { ok: true, status: 'found' },
    { ok: 'true', status: 'saved' },
    createStorageFailure('unknown', 'unknown', marker),
    getterResult,
  ]

  for (const saveResult of cases) {
    const storageSystem = createStorageDouble({ saveResult })
    let result

    assert.doesNotThrow(() => {
      result = createService(storageSystem).service.setFeaturedEntry(null)
    })
    assertFailure(result, 'storageFailed', 'unexpectedStorageResult', {
      mutation: true,
    })
    assert.deepEqual(result.lichtwaldLog, createLog())
    assertErrorDoesNotContain(result, [marker])
  }

  assert.equal(getterCalls, 0)
})

test('entkoppelt Eingabe, Load-Resultat, Save-Argument, Einzel- und Snapshot-Rückgaben vollständig', () => {
  const initialLog = createLog()
  const storageSystem = createStorageDouble({ initialLog })
  const loadedReference = storageSystem.getStoredReference()
  const loadedSnapshot = cloneValue(loadedReference)
  const input = {
    calendarDate: '2090-10-10',
    title: '[Demo-Test] Erfundenes Clone-Fenster',
    text: 'Vollständig erfundener Text zur Referenzentkopplung.',
    tags: ['Clone', 'Fiktiv'],
  }
  const inputSnapshot = cloneValue(input)
  const { service } = createService(storageSystem, [
    'lichtwald-demo-entry-clone',
  ])

  const result = service.createEntry(input)
  const savedArgument = storageSystem.state.savedArguments[0]
  const persistedSnapshot = storageSystem.peekStoredLog()
  const createdInLog = result.lichtwaldLog.entries.at(-1)

  assert.deepEqual(input, inputSnapshot)
  assert.deepEqual(loadedReference, loadedSnapshot)
  assert.notStrictEqual(result.lichtwaldLog, savedArgument)
  assert.notStrictEqual(result.createdEntry, createdInLog)
  assert.notStrictEqual(result.createdEntry.tags, createdInLog.tags)
  assert.notStrictEqual(createdInLog.tags, savedArgument.entries.at(-1).tags)

  result.createdEntry.tags.push('NurEinzelrückgabe')
  createdInLog.text = 'Nur Snapshot-Rückgabe.'
  savedArgument.entries.at(-1).title = 'Nur Save-Argument.'
  input.title = 'Nur die spätere Eingabemutation.'
  input.tags.push('NurEingabe')

  assert.deepEqual(storageSystem.peekStoredLog(), persistedSnapshot)
  assert.equal(
    service.loadLog().lichtwaldLog.entries.at(-1).title,
    '[Demo-Test] Erfundenes Clone-Fenster'
  )
})

test('Fehlerobjekte und vorherige Zustände sind zwischen Aufrufen defensiv entkoppelt', () => {
  const marker = 'fixture-invalid-demo-date'
  const service = createService(createStorageDouble()).service
  const first = service.createEntry({
    calendarDate: marker,
    title: 'Titel',
    text: 'Text',
    tags: [],
  })

  first.error.message = marker
  first.error.fieldErrors.calendarDate = marker

  const second = service.createEntry({
    calendarDate: marker,
    title: 'Titel',
    text: 'Text',
    tags: [],
  })

  assert.equal(second.error.message.includes(marker), false)
  assert.equal(second.error.fieldErrors.calendarDate.includes(marker), false)
})

test('fachliche Erfolgsresultate bleiben zum privaten Service nach reiner Origin-Normalisierung paritätisch', () => {
  const entries = [
    createEntry({ id: 'lichtwald-shared-parity-a' }),
    createEntry({
      id: 'lichtwald-shared-parity-b',
      title: '[Demo-Test] Erfundenes Paritätsfenster B',
    }),
  ]
  const syntheticLog = createLog(entries, { featuredEntryId: entries[0].id })
  const privateLog = createLog(cloneValue(entries), {
    dataOrigin: 'private',
    featuredEntryId: entries[0].id,
  })
  const demoStorage = createStorageDouble({ initialLog: syntheticLog })
  const privateStorage = createStorageDouble({ initialLog: privateLog })
  const sharedGeneratedId = 'lichtwald-shared-parity-created'
  const demoService = createLichtwaldLogDemoService({
    lichtwaldLogDemoStorage: demoStorage.lichtwaldLogDemoStorage,
    generateLichtwaldLogDemoEntryId: () => sharedGeneratedId,
  })
  const privateService = createLichtwaldLogService({
    lichtwaldLogStorage: {
      loadLichtwaldLog: privateStorage.lichtwaldLogDemoStorage.loadLichtwaldLog,
      saveLichtwaldLog(candidate) {
        const syntheticCandidate = cloneValue(candidate)
        syntheticCandidate.dataOrigin = 'synthetic'
        const storageResult = privateStorage.lichtwaldLogDemoStorage
          .saveLichtwaldLog(syntheticCandidate)

        if (storageResult.ok === true) {
          privateStorage.replaceStoredLog(candidate)
        }

        return storageResult
      },
    },
    generateLichtwaldLogEntryId: () => sharedGeneratedId,
  })
  const operations = [
    (service) => service.loadLog(),
    (service) => service.createEntry({
      calendarDate: '2091-11-11',
      title: '[Demo-Test] Erfundenes Paritätsfenster C',
      text: 'Vollständig erfundener Paritätsinhalt.',
      tags: ['Parität'],
    }),
    (service) => service.updateEntry(entries[1].id, {
      calendarDate: '2092-12-12',
      title: '[Demo-Test] Aktualisiertes Paritätsfenster B',
      text: 'Vollständig erfundener aktualisierter Paritätsinhalt.',
      tags: ['Parität', 'Update'],
    }),
    (service) => service.setFeaturedEntry(entries[1].id),
    (service) => service.deleteEntry(entries[0].id),
    (service) => service.setFeaturedEntry(null),
  ]

  for (const runOperation of operations) {
    const privateResult = runOperation(privateService)
    const demoResult = runOperation(demoService)

    assert.deepEqual(
      normalizeResultOrigin(demoResult),
      normalizeResultOrigin(privateResult)
    )
  }
})

test('arbeitet mit dem realen flüchtigen Demo-Storage und hält dessen Instanzwahrheit ohne eigenen Cache', () => {
  const firstStorage = createLichtwaldLogDemoStorage()
  const firstService = createLichtwaldLogDemoService({
    lichtwaldLogDemoStorage: firstStorage,
    generateLichtwaldLogDemoEntryId: () =>
      'lichtwald-demo-entry-real-stack',
  })
  const canonicalResult = firstService.loadLog()
  const createResult = firstService.createEntry({
    calendarDate: '2093-03-13',
    title: '[Demo-Test] Erfundenes In-Memory-Fenster',
    text: 'Vollständig erfundener Inhalt im realen Demo-Service-Stack.',
    tags: ['InMemory', 'Fiktiv'],
  })

  assert.equal(canonicalResult.ok, true)
  assert.equal(canonicalResult.lichtwaldLog.entries.length, 5)
  assert.equal(createResult.ok, true)
  assert.equal(createResult.lichtwaldLog.entries.length, 6)
  assert.equal(firstService.loadLog().lichtwaldLog.entries.length, 6)

  const secondStorage = createLichtwaldLogDemoStorage()
  const secondService = createLichtwaldLogDemoService({
    lichtwaldLogDemoStorage: secondStorage,
  })
  const recomposedResult = secondService.loadLog()

  assert.equal(recomposedResult.ok, true)
  assert.deepEqual(recomposedResult.lichtwaldLog, canonicalResult.lichtwaldLog)
  assert.equal(recomposedResult.lichtwaldLog.entries.length, 5)
})

test('Produktionsquelle importiert keinen privaten Pfad und enthält keine Persistenz-, Console- oder Netzwerkzugriffe', () => {
  const source = readFileSync(
    new URL('../src/services/lichtwaldLogDemoService.js', import.meta.url),
    'utf8'
  )

  assert.equal(source.includes("./lichtwaldLogService.js"), false)
  assert.equal(source.includes("../storage/lichtwaldLogStorage.js"), false)
  assert.equal(source.includes("../storage/storageAdapter.js"), false)
  assert.doesNotMatch(
    source,
    /localStorage|sessionStorage|indexedDB|\bcaches\b|document\.|console\.|fetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon/
  )
})
