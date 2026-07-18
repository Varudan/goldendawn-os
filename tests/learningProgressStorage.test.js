import assert from 'node:assert/strict'
import test from 'node:test'

import { createStorageAdapter } from '../src/storage/storageAdapter.js'
import {
  createLearningProgressStorage,
  LEARNING_PROGRESS_STORAGE_KEY,
} from '../src/storage/learningProgressStorage.js'
import { createStorageError, FakeStorage } from './helpers/fakeStorage.js'

function createProgressEvent(overrides = {}) {
  return {
    id: 'learning-progress-event-cobalt-1',
    type: 'chapter.completed',
    moduleId: 'module-cobalt-atlas',
    chapterId: 'chapter-cobalt-signals',
    occurredAt: '2026-07-18T12:00:00.000Z',
    ...overrides,
  }
}

function createPrivateProgressLog(events = [createProgressEvent()]) {
  return {
    schemaVersion: 1,
    dataOrigin: 'private',
    events,
  }
}

function createStorageSystem(initialValue) {
  const initialEntries = initialValue === undefined
    ? []
    : [[LEARNING_PROGRESS_STORAGE_KEY, initialValue]]
  const fakeStorage = new FakeStorage(initialEntries)
  const learningProgressStorage = createLearningProgressStorage(
    createStorageAdapter(fakeStorage)
  )

  return { fakeStorage, learningProgressStorage }
}

test('verwendet ausschließlich den festen LearningProgress-Storage-Key', () => {
  const readKeys = []
  const writeKeys = []
  const learningProgressStorage = createLearningProgressStorage({
    readJson(key) {
      readKeys.push(key)
      return { ok: true, status: 'missing' }
    },
    writeJson(key) {
      writeKeys.push(key)
      return { ok: true, status: 'saved' }
    },
  })

  const loadResult = learningProgressStorage.loadLearningProgress()
  const saveResult = learningProgressStorage.saveLearningProgress(
    createPrivateProgressLog()
  )

  assert.equal(
    LEARNING_PROGRESS_STORAGE_KEY,
    'goldendawn.learningHub.progress.v1'
  )
  assert.equal(loadResult.ok, true)
  assert.equal(saveResult.ok, true)
  assert.deepEqual(readKeys, [LEARNING_PROGRESS_STORAGE_KEY])
  assert.deepEqual(writeKeys, [LEARNING_PROGRESS_STORAGE_KEY])
  assert.equal(Object.isFrozen(learningProgressStorage), true)
})

test('liefert bei fehlendem Key jeweils einen frischen privaten Log ohne Schreiben', () => {
  const { fakeStorage, learningProgressStorage } = createStorageSystem()

  const firstResult = learningProgressStorage.loadLearningProgress()
  firstResult.progressLog.events.push(createProgressEvent())
  const secondResult = learningProgressStorage.loadLearningProgress()

  assert.deepEqual(secondResult, {
    ok: true,
    status: 'missing',
    progressLog: {
      schemaVersion: 1,
      dataOrigin: 'private',
      events: [],
    },
  })
  assert.notStrictEqual(secondResult.progressLog, firstResult.progressLog)
  assert.notStrictEqual(
    secondResult.progressLog.events,
    firstResult.progressLog.events
  )
  assert.equal(fakeStorage.getItemCalls, 2)
  assert.equal(fakeStorage.setItemCalls, 0)
  assert.equal(fakeStorage.peek(LEARNING_PROGRESS_STORAGE_KEY), null)
})

test('lädt einen gültigen privaten Log vollständig und tief defensiv geklont', () => {
  const storedProgressLog = createPrivateProgressLog()
  const storedSnapshot = structuredClone(storedProgressLog)
  const learningProgressStorage = createLearningProgressStorage({
    readJson() {
      return {
        ok: true,
        status: 'found',
        value: storedProgressLog,
      }
    },
  })

  const result = learningProgressStorage.loadLearningProgress()

  assert.deepEqual(result, {
    ok: true,
    status: 'found',
    progressLog: storedSnapshot,
  })
  assert.notStrictEqual(result.progressLog, storedProgressLog)
  assert.notStrictEqual(result.progressLog.events, storedProgressLog.events)
  assert.notStrictEqual(
    result.progressLog.events[0],
    storedProgressLog.events[0]
  )

  result.progressLog.events[0].chapterId = 'result-only-change'
  assert.deepEqual(storedProgressLog, storedSnapshot)
})

test('speichert den vollständigen Log ohne Eingabemutation oder Referenzkopplung', () => {
  const progressLog = createPrivateProgressLog()
  const inputSnapshot = structuredClone(progressLog)
  let writtenProgressLog
  let writeCalls = 0
  const learningProgressStorage = createLearningProgressStorage({
    writeJson(key, value) {
      writeCalls += 1
      assert.equal(key, LEARNING_PROGRESS_STORAGE_KEY)
      writtenProgressLog = value
      return { ok: true, status: 'saved' }
    },
  })

  const result = learningProgressStorage.saveLearningProgress(progressLog)

  assert.deepEqual(result, { ok: true, status: 'saved' })
  assert.equal(writeCalls, 1)
  assert.deepEqual(writtenProgressLog, progressLog)
  assert.notStrictEqual(writtenProgressLog, progressLog)
  assert.notStrictEqual(writtenProgressLog.events, progressLog.events)
  assert.notStrictEqual(writtenProgressLog.events[0], progressLog.events[0])

  writtenProgressLog.events[0].moduleId = 'adapter-only-change'
  assert.deepEqual(progressLog, inputSnapshot)
})

test('reicht beschädigtes JSON weiter, ohne den Rohwert zu überschreiben', () => {
  const corruptedJson = '{broken'
  const { fakeStorage, learningProgressStorage } = createStorageSystem(
    corruptedJson
  )

  const result = learningProgressStorage.loadLearningProgress()

  assert.equal(result.ok, false)
  assert.equal(result.status, 'invalidJson')
  assert.equal(result.error.code, 'invalidJson')
  assert.equal(
    fakeStorage.peek(LEARNING_PROGRESS_STORAGE_KEY),
    corruptedJson
  )
  assert.equal(fakeStorage.setItemCalls, 0)
  assert.equal(Object.hasOwn(result, 'progressLog'), false)
})

test('weist ungültige gespeicherte Schema-Daten ohne Reparatur zurück', () => {
  const invalidLogs = [
    { ...createPrivateProgressLog(), schemaVersion: 2 },
    { ...createPrivateProgressLog(), events: null },
    createPrivateProgressLog([
      createProgressEvent({ occurredAt: '2026-07-18T12:00:00Z' }),
    ]),
    createPrivateProgressLog([
      createProgressEvent(),
      createProgressEvent({ type: 'chapter.reopened' }),
    ]),
  ]

  for (const invalidLog of invalidLogs) {
    const rawValue = JSON.stringify(invalidLog)
    const { fakeStorage, learningProgressStorage } = createStorageSystem(
      rawValue
    )

    const result = learningProgressStorage.loadLearningProgress()

    assert.equal(result.ok, false)
    assert.equal(result.status, 'invalidStoredData')
    assert.equal(result.error.code, 'invalidLearningProgressData')
    assert.equal(fakeStorage.peek(LEARNING_PROGRESS_STORAGE_KEY), rawValue)
    assert.equal(fakeStorage.setItemCalls, 0)
  }
})

test('weist synthetische Logs an der privaten Storage-Grenze zurück', () => {
  const syntheticLog = {
    ...createPrivateProgressLog(),
    dataOrigin: 'synthetic',
  }
  const rawValue = JSON.stringify(syntheticLog)
  const { fakeStorage, learningProgressStorage } = createStorageSystem(
    rawValue
  )

  const loadResult = learningProgressStorage.loadLearningProgress()
  const saveResult = learningProgressStorage.saveLearningProgress(syntheticLog)

  assert.equal(loadResult.ok, false)
  assert.equal(loadResult.status, 'invalidStoredData')
  assert.equal(loadResult.error.code, 'privateLearningProgressRequired')
  assert.equal(saveResult.ok, false)
  assert.equal(saveResult.status, 'validationFailed')
  assert.equal(saveResult.error.code, 'privateLearningProgressRequired')
  assert.equal(fakeStorage.peek(LEARNING_PROGRESS_STORAGE_KEY), rawValue)
  assert.equal(fakeStorage.setItemCalls, 0)
})

test('validiert den vollständigen Log vor jedem Schreibzugriff', () => {
  const invalidLogs = [
    null,
    { schemaVersion: 1, dataOrigin: 'private', events: null },
    createPrivateProgressLog([
      createProgressEvent({ id: ' untrimmed-event-id ' }),
    ]),
    createPrivateProgressLog([
      createProgressEvent({ type: 'chapter.started' }),
    ]),
  ]
  let writeCalls = 0
  const learningProgressStorage = createLearningProgressStorage({
    writeJson() {
      writeCalls += 1
      return { ok: true, status: 'saved' }
    },
  })

  for (const invalidLog of invalidLogs) {
    const snapshot = structuredClone(invalidLog)
    const result = learningProgressStorage.saveLearningProgress(invalidLog)

    assert.equal(result.ok, false)
    assert.equal(result.status, 'validationFailed')
    assert.equal(result.error.code, 'invalidLearningProgressData')
    assert.deepEqual(invalidLog, snapshot)
  }

  assert.equal(writeCalls, 0)
})

test('reicht strukturierte Adapterfehler kontrolliert weiter', () => {
  const readFailure = {
    ok: false,
    status: 'readFailed',
    error: {
      code: 'storageReadFailed',
      message: 'Synthetischer kontrollierter Lesefehler.',
    },
  }
  const writeFailure = {
    ok: false,
    status: 'quotaExceeded',
    error: {
      code: 'storageQuotaExceeded',
      message: 'Synthetischer kontrollierter Schreibfehler.',
    },
  }
  const learningProgressStorage = createLearningProgressStorage({
    readJson() {
      return readFailure
    },
    writeJson() {
      return writeFailure
    },
  })

  assert.deepEqual(
    learningProgressStorage.loadLearningProgress(),
    readFailure
  )
  assert.deepEqual(
    learningProgressStorage.saveLearningProgress(
      createPrivateProgressLog()
    ),
    writeFailure
  )
})

test('klassifiziert reale Adapter-Lese-, Quota- und Schreibfehler präzise', () => {
  const readStorage = new FakeStorage()
  readStorage.readError = createStorageError('SecurityError')
  const readResult = createLearningProgressStorage(
    createStorageAdapter(readStorage)
  ).loadLearningProgress()

  assert.equal(readResult.ok, false)
  assert.equal(readResult.status, 'unavailable')
  assert.equal(readResult.error.code, 'storageUnavailable')
  assert.equal(readStorage.setItemCalls, 0)

  const writeCases = [
    ['QuotaExceededError', 'quotaExceeded', 'storageQuotaExceeded'],
    ['SecurityError', 'unavailable', 'storageUnavailable'],
    ['Error', 'writeFailed', 'storageWriteFailed'],
  ]

  for (const [errorName, status, errorCode] of writeCases) {
    const fakeStorage = new FakeStorage()
    fakeStorage.writeError = createStorageError(errorName)
    const result = createLearningProgressStorage(
      createStorageAdapter(fakeStorage)
    ).saveLearningProgress(createPrivateProgressLog())

    assert.equal(result.ok, false)
    assert.equal(result.status, status)
    assert.equal(result.error.code, errorCode)
    assert.equal(fakeStorage.setItemCalls, 1)
    assert.equal(fakeStorage.peek(LEARNING_PROGRESS_STORAGE_KEY), null)
  }
})

test('meldet fehlende Adapter-Schnittstellen kontrolliert', () => {
  const validLog = createPrivateProgressLog()
  const results = [
    createLearningProgressStorage().loadLearningProgress(),
    createLearningProgressStorage().saveLearningProgress(validLog),
    createLearningProgressStorage({
      writeJson() {
        return { ok: true, status: 'saved' }
      },
    }).loadLearningProgress(),
    createLearningProgressStorage({
      readJson() {
        return { ok: true, status: 'missing' }
      },
    }).saveLearningProgress(validLog),
  ]

  for (const result of results) {
    assert.equal(result.ok, false)
    assert.equal(result.status, 'unavailable')
    assert.equal(result.error.code, 'storageAdapterUnavailable')
  }
})

test('normalisiert geworfene und formal unbrauchbare Adapterresultate', () => {
  const expectedResult = {
    ok: false,
    status: 'storageFailed',
    error: {
      code: 'unexpectedStorageResult',
      message: 'Der Storage-Adapter hat kein verwertbares Ergebnis geliefert.',
    },
  }
  const throwingStorage = createLearningProgressStorage({
    readJson() {
      throw new Error('Synthetischer roher Lesefehler')
    },
    writeJson() {
      throw new Error('Synthetischer roher Schreibfehler')
    },
  })

  assert.deepEqual(
    throwingStorage.loadLearningProgress(),
    expectedResult
  )
  assert.deepEqual(
    throwingStorage.saveLearningProgress(createPrivateProgressLog()),
    expectedResult
  )

  for (const malformedResult of [
    null,
    { ok: true, status: 'found' },
    { ok: true, status: 'unknown' },
    { ok: false, status: 'readFailed', error: {} },
  ]) {
    const result = createLearningProgressStorage({
      readJson() {
        return malformedResult
      },
    }).loadLearningProgress()

    assert.deepEqual(result, expectedResult)
  }

  for (const malformedResult of [
    undefined,
    { ok: true, status: 'found' },
    { ok: false, status: 'writeFailed', error: { code: '' } },
  ]) {
    const result = createLearningProgressStorage({
      writeJson() {
        return malformedResult
      },
    }).saveLearningProgress(createPrivateProgressLog())

    assert.deepEqual(result, expectedResult)
  }
})

test('gibt bei nicht klonbaren Adapterwerten kontrollierte inhaltsfreie Fehler zurück', () => {
  const privateMarker = 'vertraulicher-synthetischer-marker'
  const unclonableProgressLog = {
    ...createPrivateProgressLog(),
    ignoredCallback() {},
    privateMarker,
  }
  let writeCalls = 0
  const learningProgressStorage = createLearningProgressStorage({
    readJson() {
      return {
        ok: true,
        status: 'found',
        value: unclonableProgressLog,
      }
    },
    writeJson() {
      writeCalls += 1
      return { ok: true, status: 'saved' }
    },
  })

  const loadResult = learningProgressStorage.loadLearningProgress()
  const saveResult = learningProgressStorage.saveLearningProgress(
    unclonableProgressLog
  )

  assert.equal(loadResult.ok, false)
  assert.equal(loadResult.status, 'invalidStoredData')
  assert.equal(saveResult.ok, false)
  assert.equal(saveResult.status, 'validationFailed')
  assert.equal(writeCalls, 0)
  assert.equal(JSON.stringify(loadResult).includes(privateMarker), false)
  assert.equal(JSON.stringify(saveResult).includes(privateMarker), false)
})
