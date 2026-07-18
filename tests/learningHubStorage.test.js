import assert from 'node:assert/strict'
import test from 'node:test'

import { createStorageAdapter } from '../src/storage/storageAdapter.js'
import {
  createLearningHubStorage,
  LEARNING_HUB_STORAGE_KEY,
} from '../src/storage/learningHubStorage.js'
import { createStorageError, FakeStorage } from './helpers/fakeStorage.js'

function createPrivateHub() {
  return {
    schemaVersion: 2,
    dataOrigin: 'private',
    modules: [
      {
        id: 'test-module-orbit',
        title: 'Erfundenes Orbit-Modul',
        position: 1,
        chapters: [
          {
            id: 'test-chapter-signals',
            title: 'Synthetische Signale',
            position: 1,
            learningNodes: [
              {
                id: 'test-node-pattern',
                title: 'Erfundenes Muster',
                content: 'Ein unabhängig erfundener Text für den Storage-Test.',
                position: 1,
              },
            ],
          },
        ],
      },
    ],
  }
}

function createStorageSystem(initialValue) {
  const initialEntries =
    initialValue === undefined
      ? []
      : [[LEARNING_HUB_STORAGE_KEY, initialValue]]
  const fakeStorage = new FakeStorage(initialEntries)
  const learningHubStorage = createLearningHubStorage(
    createStorageAdapter(fakeStorage)
  )

  return {
    fakeStorage,
    learningHubStorage,
  }
}

test('verwendet ausschließlich den festen LearningHub-Storage-Key', () => {
  const readKeys = []
  const writeKeys = []
  const learningHubStorage = createLearningHubStorage({
    readJson(key) {
      readKeys.push(key)
      return { ok: true, status: 'missing' }
    },
    writeJson(key) {
      writeKeys.push(key)
      return { ok: true, status: 'saved' }
    },
  })

  const loadResult = learningHubStorage.loadLearningHub()
  const saveResult = learningHubStorage.saveLearningHub(createPrivateHub())

  assert.equal(
    LEARNING_HUB_STORAGE_KEY,
    'goldendawn.learningHub.content.v1'
  )
  assert.equal(loadResult.ok, true)
  assert.equal(saveResult.ok, true)
  assert.deepEqual(readKeys, [LEARNING_HUB_STORAGE_KEY])
  assert.deepEqual(writeKeys, [LEARNING_HUB_STORAGE_KEY])
})

test('liefert bei fehlendem Key jeweils einen frischen privaten Hub ohne Schreiben', () => {
  const { fakeStorage, learningHubStorage } = createStorageSystem()

  const firstResult = learningHubStorage.loadLearningHub()
  firstResult.hub.modules.push({ changedOnlyInResult: true })
  const secondResult = learningHubStorage.loadLearningHub()

  assert.deepEqual(secondResult, {
    ok: true,
    status: 'missing',
    hub: {
      schemaVersion: 2,
      dataOrigin: 'private',
      modules: [],
    },
  })
  assert.notStrictEqual(secondResult.hub, firstResult.hub)
  assert.notStrictEqual(secondResult.hub.modules, firstResult.hub.modules)
  assert.equal(fakeStorage.getItemCalls, 2)
  assert.equal(fakeStorage.setItemCalls, 0)
  assert.equal(fakeStorage.peek(LEARNING_HUB_STORAGE_KEY), null)
})

test('lädt einen gültigen privaten Hub vollständig und tief defensiv geklont', () => {
  const storedHub = createPrivateHub()
  const storedSnapshot = structuredClone(storedHub)
  const readKeys = []
  const learningHubStorage = createLearningHubStorage({
    readJson(key) {
      readKeys.push(key)
      return {
        ok: true,
        status: 'found',
        value: storedHub,
      }
    },
  })

  const result = learningHubStorage.loadLearningHub()

  assert.deepEqual(result, {
    ok: true,
    status: 'found',
    hub: storedSnapshot,
  })
  assert.deepEqual(readKeys, [LEARNING_HUB_STORAGE_KEY])
  assert.notStrictEqual(result.hub, storedHub)
  assert.notStrictEqual(result.hub.modules, storedHub.modules)
  assert.notStrictEqual(result.hub.modules[0], storedHub.modules[0])
  assert.notStrictEqual(
    result.hub.modules[0].chapters,
    storedHub.modules[0].chapters
  )
  assert.notStrictEqual(
    result.hub.modules[0].chapters[0].learningNodes[0],
    storedHub.modules[0].chapters[0].learningNodes[0]
  )

  result.hub.modules[0].chapters[0].learningNodes[0].content =
    'Nur die Rückgabe wurde verändert.'
  assert.deepEqual(storedHub, storedSnapshot)
})

test('speichert den vollständigen Schema-2-Hub direkt und ohne Eingabemutation', () => {
  const learningHub = createPrivateHub()
  const inputSnapshot = structuredClone(learningHub)
  let writtenKey
  let writtenHub
  let writeCalls = 0
  const learningHubStorage = createLearningHubStorage({
    writeJson(key, value) {
      writeCalls += 1
      writtenKey = key
      writtenHub = value
      return { ok: true, status: 'saved' }
    },
  })

  const result = learningHubStorage.saveLearningHub(learningHub)

  assert.deepEqual(result, { ok: true, status: 'saved' })
  assert.equal(writeCalls, 1)
  assert.equal(writtenKey, LEARNING_HUB_STORAGE_KEY)
  assert.deepEqual(writtenHub, learningHub)
  assert.equal(Object.hasOwn(writtenHub, 'hub'), false)
  assert.notStrictEqual(writtenHub, learningHub)
  assert.notStrictEqual(writtenHub.modules, learningHub.modules)
  assert.notStrictEqual(
    writtenHub.modules[0].chapters[0].learningNodes[0],
    learningHub.modules[0].chapters[0].learningNodes[0]
  )

  writtenHub.modules[0].title = 'Nur die Adapterkopie wurde verändert'
  assert.deepEqual(learningHub, inputSnapshot)
})

test('reicht beschädigtes JSON weiter, ohne den Rohwert zu überschreiben', () => {
  const corruptedJson = '{broken'
  const { fakeStorage, learningHubStorage } = createStorageSystem(
    corruptedJson
  )

  const result = learningHubStorage.loadLearningHub()

  assert.equal(result.ok, false)
  assert.equal(result.status, 'invalidJson')
  assert.equal(result.error.code, 'invalidJson')
  assert.equal(fakeStorage.peek(LEARNING_HUB_STORAGE_KEY), corruptedJson)
  assert.equal(fakeStorage.setItemCalls, 0)
  assert.equal(Object.hasOwn(result, 'hub'), false)
})

test('weist ungültige gespeicherte Schema-Daten ohne Reparatur zurück', () => {
  const moduleWithoutChapter = createPrivateHub()
  moduleWithoutChapter.modules[0].chapters = []
  const duplicateIdHub = createPrivateHub()
  duplicateIdHub.modules[0].chapters[0].id =
    duplicateIdHub.modules[0].id
  const testCases = [
    { ...createPrivateHub(), schemaVersion: 1 },
    { ...createPrivateHub(), schemaVersion: 3 },
    moduleWithoutChapter,
    duplicateIdHub,
  ]

  for (const invalidHub of testCases) {
    const rawValue = JSON.stringify(invalidHub)
    const { fakeStorage, learningHubStorage } = createStorageSystem(rawValue)

    const result = learningHubStorage.loadLearningHub()

    assert.equal(result.ok, false)
    assert.equal(result.status, 'invalidStoredData')
    assert.equal(result.error.code, 'invalidLearningHubData')
    assert.equal(fakeStorage.peek(LEARNING_HUB_STORAGE_KEY), rawValue)
    assert.equal(fakeStorage.setItemCalls, 0)
    assert.equal(Object.hasOwn(result, 'hub'), false)
  }
})

test('weist synthetische Daten an der privaten Storage-Grenze zurück', () => {
  const syntheticHub = {
    ...createPrivateHub(),
    dataOrigin: 'synthetic',
  }
  const rawValue = JSON.stringify(syntheticHub)
  const { fakeStorage, learningHubStorage } = createStorageSystem(rawValue)

  const loadResult = learningHubStorage.loadLearningHub()

  assert.equal(loadResult.ok, false)
  assert.equal(loadResult.status, 'invalidStoredData')
  assert.equal(loadResult.error.code, 'privateLearningHubRequired')
  assert.equal(fakeStorage.peek(LEARNING_HUB_STORAGE_KEY), rawValue)
  assert.equal(fakeStorage.setItemCalls, 0)

  const saveResult = learningHubStorage.saveLearningHub(syntheticHub)

  assert.equal(saveResult.ok, false)
  assert.equal(saveResult.status, 'validationFailed')
  assert.equal(saveResult.error.code, 'privateLearningHubRequired')
  assert.equal(fakeStorage.peek(LEARNING_HUB_STORAGE_KEY), rawValue)
  assert.equal(fakeStorage.setItemCalls, 0)
})

test('validiert den vollständigen Hub vor jedem Schreibzugriff', () => {
  const invalidHubs = [
    null,
    { schemaVersion: 2, dataOrigin: 'private', modules: null },
    (() => {
      const hub = createPrivateHub()
      hub.modules[0].chapters[0].learningNodes[0].content = '   '
      return hub
    })(),
    (() => {
      const hub = createPrivateHub()
      hub.modules[0].chapters[0].learningNodes[0].position = 0
      return hub
    })(),
  ]
  let writeCalls = 0
  const learningHubStorage = createLearningHubStorage({
    writeJson() {
      writeCalls += 1
      return { ok: true, status: 'saved' }
    },
  })

  for (const invalidHub of invalidHubs) {
    const snapshot = structuredClone(invalidHub)
    const result = learningHubStorage.saveLearningHub(invalidHub)

    assert.equal(result.ok, false)
    assert.equal(result.status, 'validationFailed')
    assert.equal(result.error.code, 'invalidLearningHubData')
    assert.deepEqual(invalidHub, snapshot)
  }

  assert.equal(writeCalls, 0)
})

test('reicht strukturierte Adapter-Lese- und Schreibfehler unverändert weiter', () => {
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
  const learningHubStorage = createLearningHubStorage({
    readJson() {
      return readFailure
    },
    writeJson() {
      return writeFailure
    },
  })

  assert.deepEqual(learningHubStorage.loadLearningHub(), readFailure)
  assert.deepEqual(
    learningHubStorage.saveLearningHub(createPrivateHub()),
    writeFailure
  )
})

test('klassifiziert reale Adapter-Lese- und Schreibfehler weiterhin präzise', () => {
  const readCases = [
    {
      errorName: 'SecurityError',
      status: 'unavailable',
      errorCode: 'storageUnavailable',
    },
    {
      errorName: 'Error',
      status: 'readFailed',
      errorCode: 'storageReadFailed',
    },
  ]

  for (const testCase of readCases) {
    const fakeStorage = new FakeStorage()
    fakeStorage.readError = createStorageError(testCase.errorName)
    const learningHubStorage = createLearningHubStorage(
      createStorageAdapter(fakeStorage)
    )
    const result = learningHubStorage.loadLearningHub()

    assert.equal(result.ok, false)
    assert.equal(result.status, testCase.status)
    assert.equal(result.error.code, testCase.errorCode)
    assert.equal(fakeStorage.setItemCalls, 0)
  }

  const writeCases = [
    {
      errorName: 'QuotaExceededError',
      status: 'quotaExceeded',
      errorCode: 'storageQuotaExceeded',
    },
    {
      errorName: 'SecurityError',
      status: 'unavailable',
      errorCode: 'storageUnavailable',
    },
    {
      errorName: 'Error',
      status: 'writeFailed',
      errorCode: 'storageWriteFailed',
    },
  ]

  for (const testCase of writeCases) {
    const fakeStorage = new FakeStorage()
    fakeStorage.writeError = createStorageError(testCase.errorName)
    const learningHubStorage = createLearningHubStorage(
      createStorageAdapter(fakeStorage)
    )
    const result = learningHubStorage.saveLearningHub(createPrivateHub())

    assert.equal(result.ok, false)
    assert.equal(result.status, testCase.status)
    assert.equal(result.error.code, testCase.errorCode)
    assert.equal(fakeStorage.setItemCalls, 1)
    assert.equal(fakeStorage.peek(LEARNING_HUB_STORAGE_KEY), null)
  }
})

test('meldet fehlende Adapter-Schnittstellen kontrolliert', () => {
  const validHub = createPrivateHub()

  const missingReadResult = createLearningHubStorage({
    writeJson() {
      return { ok: true, status: 'saved' }
    },
  }).loadLearningHub()
  const missingWriteResult = createLearningHubStorage({
    readJson() {
      return { ok: true, status: 'missing' }
    },
  }).saveLearningHub(validHub)
  const missingAdapterStorage = createLearningHubStorage()

  for (const result of [
    missingReadResult,
    missingWriteResult,
    missingAdapterStorage.loadLearningHub(),
    missingAdapterStorage.saveLearningHub(validHub),
  ]) {
    assert.equal(result.ok, false)
    assert.equal(result.status, 'unavailable')
    assert.equal(result.error.code, 'storageAdapterUnavailable')
  }
})

test('normalisiert geworfene und formal unbrauchbare Adapterresultate', () => {
  const unexpectedResult = {
    ok: false,
    status: 'storageFailed',
    error: {
      code: 'unexpectedStorageResult',
      message: 'Der Storage-Adapter hat kein verwertbares Ergebnis geliefert.',
    },
  }
  const thrownReadStorage = createLearningHubStorage({
    readJson() {
      throw new Error('synthetischer roher Lesefehler')
    },
  })
  const thrownWriteStorage = createLearningHubStorage({
    writeJson() {
      throw new Error('synthetischer roher Schreibfehler')
    },
  })

  assert.deepEqual(thrownReadStorage.loadLearningHub(), unexpectedResult)
  assert.deepEqual(
    thrownWriteStorage.saveLearningHub(createPrivateHub()),
    unexpectedResult
  )

  const malformedReadResults = [
    null,
    { ok: true, status: 'unknown' },
    { ok: true, status: 'found' },
    { ok: false, status: 'readFailed', error: {} },
  ]

  for (const malformedResult of malformedReadResults) {
    const learningHubStorage = createLearningHubStorage({
      readJson() {
        return malformedResult
      },
    })

    assert.deepEqual(
      learningHubStorage.loadLearningHub(),
      unexpectedResult
    )
  }

  const malformedWriteResults = [
    undefined,
    { ok: true, status: 'found' },
    { ok: false, status: 'writeFailed', error: { code: '' } },
  ]

  for (const malformedResult of malformedWriteResults) {
    const learningHubStorage = createLearningHubStorage({
      writeJson() {
        return malformedResult
      },
    })

    assert.deepEqual(
      learningHubStorage.saveLearningHub(createPrivateHub()),
      unexpectedResult
    )
  }
})
