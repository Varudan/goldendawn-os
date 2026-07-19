import assert from 'node:assert/strict'
import test from 'node:test'

import { createStorageAdapter } from '../src/storage/storageAdapter.js'
import {
  createLearningTestBankStorage,
  LEARNING_TEST_BANK_STORAGE_KEY,
} from '../src/storage/learningTestBankStorage.js'
import { FakeStorage } from './helpers/fakeStorage.js'

function createQuestion(overrides = {}) {
  return {
    id: 'question-copper-signal-1',
    moduleId: 'module-copper-atlas',
    chapterId: 'chapter-copper-signals',
    learningNodeId: 'node-copper-pattern',
    type: 'singleChoice',
    prompt: 'Welche erfundene Markierung gehört zum Kupfersignal?',
    difficulty: 'easy',
    position: 1,
    revision: 1,
    createdAt: '2026-07-19T10:00:00.000Z',
    updatedAt: '2026-07-19T10:00:00.000Z',
    options: [
      {
        id: 'option-copper-amber',
        label: 'Die bernsteinfarbene Markierung',
        position: 1,
      },
      {
        id: 'option-copper-indigo',
        label: 'Die indigofarbene Markierung',
        position: 2,
      },
    ],
    correctOptionId: 'option-copper-indigo',
    explanation: 'Im synthetischen Szenario bezeichnet Indigo das Kupfersignal.',
    ...overrides,
  }
}

function createPrivateTestBank(questions = [createQuestion()]) {
  return {
    schemaVersion: 1,
    dataOrigin: 'private',
    questions,
  }
}

function createStorageSystem(initialValue) {
  const initialEntries = initialValue === undefined
    ? []
    : [[LEARNING_TEST_BANK_STORAGE_KEY, initialValue]]
  const fakeStorage = new FakeStorage(initialEntries)
  const learningTestBankStorage = createLearningTestBankStorage(
    createStorageAdapter(fakeStorage)
  )

  return { fakeStorage, learningTestBankStorage }
}

test('verwendet nur den festen Testbank-Key und bietet die fokussierte API', () => {
  const readKeys = []
  const writeKeys = []
  const storage = createLearningTestBankStorage({
    readJson(key) {
      readKeys.push(key)
      return { ok: true, status: 'missing' }
    },
    writeJson(key) {
      writeKeys.push(key)
      return { ok: true, status: 'saved' }
    },
  })

  const loadResult = storage.loadLearningTestBank()
  const saveResult = storage.saveLearningTestBank(createPrivateTestBank())

  assert.equal(
    LEARNING_TEST_BANK_STORAGE_KEY,
    'goldendawn.learningHub.testBank.v1'
  )
  assert.equal(loadResult.ok, true)
  assert.deepEqual(saveResult, { ok: true, status: 'saved' })
  assert.deepEqual(readKeys, [
    LEARNING_TEST_BANK_STORAGE_KEY,
    LEARNING_TEST_BANK_STORAGE_KEY,
  ])
  assert.deepEqual(writeKeys, [LEARNING_TEST_BANK_STORAGE_KEY])
  assert.deepEqual(Object.keys(storage).sort(), [
    'loadLearningTestBank',
    'saveLearningTestBank',
  ])
  assert.equal(Object.isFrozen(storage), true)
})

test('liefert bei fehlendem Key frische private Leerzustände ohne Schreiben', () => {
  const { fakeStorage, learningTestBankStorage } = createStorageSystem()

  const firstResult = learningTestBankStorage.loadLearningTestBank()
  firstResult.testBank.questions.push(createQuestion())
  const secondResult = learningTestBankStorage.loadLearningTestBank()

  assert.deepEqual(secondResult, {
    ok: true,
    status: 'missing',
    testBank: {
      schemaVersion: 1,
      dataOrigin: 'private',
      questions: [],
    },
  })
  assert.notStrictEqual(firstResult.testBank, secondResult.testBank)
  assert.notStrictEqual(
    firstResult.testBank.questions,
    secondResult.testBank.questions
  )
  assert.equal(fakeStorage.getItemCalls, 2)
  assert.equal(fakeStorage.setItemCalls, 0)
  assert.equal(fakeStorage.peek(LEARNING_TEST_BANK_STORAGE_KEY), null)
})

test('lädt eine gültige private Testbank vollständig und tief defensiv geklont', () => {
  const storedTestBank = createPrivateTestBank()
  const storedSnapshot = structuredClone(storedTestBank)
  const storage = createLearningTestBankStorage({
    readJson() {
      return {
        ok: true,
        status: 'found',
        value: storedTestBank,
      }
    },
  })

  const result = storage.loadLearningTestBank()

  assert.deepEqual(result, {
    ok: true,
    status: 'found',
    testBank: storedSnapshot,
  })
  assert.notStrictEqual(result.testBank, storedTestBank)
  assert.notStrictEqual(result.testBank.questions, storedTestBank.questions)
  assert.notStrictEqual(
    result.testBank.questions[0].options,
    storedTestBank.questions[0].options
  )
  assert.notStrictEqual(
    result.testBank.questions[0].options[0],
    storedTestBank.questions[0].options[0]
  )

  result.testBank.questions[0].prompt = 'Nur die Rückgabe wurde verändert.'
  result.testBank.questions[0].options[0].label = 'Nur die Rückgabe'
  assert.deepEqual(storedTestBank, storedSnapshot)
})

test('speichert nach Read-Preflight exakt einmal, tief geklont und ohne Eingabemutation', () => {
  const testBank = createPrivateTestBank()
  const inputSnapshot = structuredClone(testBank)
  let writtenTestBank
  let readCalls = 0
  let writeCalls = 0
  const storage = createLearningTestBankStorage({
    readJson(key) {
      readCalls += 1
      assert.equal(key, LEARNING_TEST_BANK_STORAGE_KEY)
      return { ok: true, status: 'missing' }
    },
    writeJson(key, value) {
      writeCalls += 1
      assert.equal(key, LEARNING_TEST_BANK_STORAGE_KEY)
      writtenTestBank = value
      return { ok: true, status: 'saved' }
    },
  })

  const result = storage.saveLearningTestBank(testBank)

  assert.deepEqual(result, { ok: true, status: 'saved' })
  assert.equal(readCalls, 1)
  assert.equal(writeCalls, 1)
  assert.deepEqual(writtenTestBank, testBank)
  assert.notStrictEqual(writtenTestBank, testBank)
  assert.notStrictEqual(writtenTestBank.questions, testBank.questions)
  assert.notStrictEqual(
    writtenTestBank.questions[0].options,
    testBank.questions[0].options
  )

  writtenTestBank.questions[0].explanation = 'Nur Adapterkopie geändert.'
  assert.deepEqual(testBank, inputSnapshot)
})

test('überschreibt keine beschädigten, synthetischen oder nicht unterstützten Bestandswerte', () => {
  const protectedRawValues = [
    '{broken',
    JSON.stringify({
      ...createPrivateTestBank(),
      dataOrigin: 'synthetic',
    }),
    JSON.stringify({
      ...createPrivateTestBank(),
      schemaVersion: 9,
    }),
    JSON.stringify({
      ...createPrivateTestBank(),
      questions: null,
    }),
  ]

  for (const protectedRawValue of protectedRawValues) {
    const { fakeStorage, learningTestBankStorage } = createStorageSystem(
      protectedRawValue
    )

    const result = learningTestBankStorage.saveLearningTestBank(
      createPrivateTestBank()
    )

    assert.equal(result.ok, false)
    assert.equal(
      ['invalidJson', 'invalidStoredData'].includes(result.status),
      true
    )
    assert.equal(
      fakeStorage.peek(LEARNING_TEST_BANK_STORAGE_KEY),
      protectedRawValue
    )
    assert.equal(fakeStorage.getItemCalls, 1)
    assert.equal(fakeStorage.setItemCalls, 0)
  }
})

test('weist synthetische Testbanken an beiden privaten Storage-Grenzen zurück', () => {
  const syntheticTestBank = {
    ...createPrivateTestBank(),
    dataOrigin: 'synthetic',
  }
  const rawValue = JSON.stringify(syntheticTestBank)
  const { fakeStorage, learningTestBankStorage } = createStorageSystem(rawValue)

  const loadResult = learningTestBankStorage.loadLearningTestBank()
  const saveResult = learningTestBankStorage.saveLearningTestBank(
    syntheticTestBank
  )

  assert.equal(loadResult.ok, false)
  assert.equal(loadResult.status, 'invalidStoredData')
  assert.equal(loadResult.error.code, 'privateLearningTestBankRequired')
  assert.equal(saveResult.ok, false)
  assert.equal(saveResult.status, 'validationFailed')
  assert.equal(saveResult.error.code, 'privateLearningTestBankRequired')
  assert.equal(fakeStorage.peek(LEARNING_TEST_BANK_STORAGE_KEY), rawValue)
  assert.equal(fakeStorage.setItemCalls, 0)
})

test('lehnt einen beim Klonen synthetisch wechselnden Bank-Snapshot beim Laden ab', () => {
  const switchingTestBank = createPrivateTestBank()
  let dataOriginReads = 0

  Object.defineProperty(switchingTestBank, 'dataOrigin', {
    configurable: true,
    enumerable: true,
    get() {
      dataOriginReads += 1
      return dataOriginReads <= 2 ? 'private' : 'synthetic'
    },
  })

  const storage = createLearningTestBankStorage({
    readJson() {
      return {
        ok: true,
        status: 'found',
        value: switchingTestBank,
      }
    },
  })

  const result = storage.loadLearningTestBank()

  assert.equal(result.ok, false)
  assert.equal(result.status, 'invalidStoredData')
  assert.equal(result.error.code, 'privateLearningTestBankRequired')
  assert.equal('testBank' in result, false)
  assert.equal(dataOriginReads, 3)
})

test('schreibt keinen beim Klonen synthetisch wechselnden Bank-Snapshot', () => {
  const switchingTestBank = createPrivateTestBank()
  let dataOriginReads = 0
  let readCalls = 0
  let writeCalls = 0

  Object.defineProperty(switchingTestBank, 'dataOrigin', {
    configurable: true,
    enumerable: true,
    get() {
      dataOriginReads += 1
      return dataOriginReads <= 2 ? 'private' : 'synthetic'
    },
  })

  const storage = createLearningTestBankStorage({
    readJson() {
      readCalls += 1
      return { ok: true, status: 'missing' }
    },
    writeJson() {
      writeCalls += 1
      return { ok: true, status: 'saved' }
    },
  })

  const result = storage.saveLearningTestBank(switchingTestBank)

  assert.equal(result.ok, false)
  assert.equal(result.status, 'validationFailed')
  assert.equal(result.error.code, 'privateLearningTestBankRequired')
  assert.equal(readCalls, 0)
  assert.equal(writeCalls, 0)
  assert.equal(dataOriginReads, 3)
})

test('validiert Original und Klon vollständig vor Lese- oder Schreibzugriffen', () => {
  const customPrototypeQuestion = Object.assign(
    Object.create({ inheritedMarker: 'private-inherited-sentinel' }),
    createQuestion()
  )
  const privateMarker = 'private-question-storage-sentinel'
  const invalidTestBanks = [
    null,
    { schemaVersion: 1, dataOrigin: 'private', questions: null },
    createPrivateTestBank([
      createQuestion({ prompt: privateMarker, extraField: 'unsupported' }),
    ]),
    createPrivateTestBank([customPrototypeQuestion]),
    {
      ...createPrivateTestBank(),
      ignoredCallback() {},
    },
  ]
  let readCalls = 0
  let writeCalls = 0
  const storage = createLearningTestBankStorage({
    readJson() {
      readCalls += 1
      return { ok: true, status: 'missing' }
    },
    writeJson() {
      writeCalls += 1
      return { ok: true, status: 'saved' }
    },
  })

  for (const invalidTestBank of invalidTestBanks) {
    const result = storage.saveLearningTestBank(invalidTestBank)

    assert.equal(result.ok, false)
    assert.equal(result.status, 'validationFailed')
    assert.equal(result.error.code, 'invalidLearningTestBankData')
    assert.equal(JSON.stringify(result).includes(privateMarker), false)
  }

  assert.equal(readCalls, 0)
  assert.equal(writeCalls, 0)
})

test('redigiert bekannte Adaptermeldungen in Load, Preflight und Write', () => {
  const privateMarker = 'private-adapter-bank-sentinel'
  const knownFailures = [
    {
      status: 'readFailed',
      code: 'storageReadFailed',
    },
    {
      status: 'quotaExceeded',
      code: 'storageQuotaExceeded',
    },
  ]

  const loadResult = createLearningTestBankStorage({
    readJson() {
      return {
        ok: false,
        status: knownFailures[0].status,
        error: {
          code: knownFailures[0].code,
          message: privateMarker,
        },
      }
    },
  }).loadLearningTestBank()

  let preflightWriteCalls = 0
  const preflightResult = createLearningTestBankStorage({
    readJson() {
      return {
        ok: false,
        status: knownFailures[0].status,
        error: {
          code: knownFailures[0].code,
          message: privateMarker,
        },
      }
    },
    writeJson() {
      preflightWriteCalls += 1
      return { ok: true, status: 'saved' }
    },
  }).saveLearningTestBank(createPrivateTestBank())

  const writeResult = createLearningTestBankStorage({
    readJson() {
      return { ok: true, status: 'missing' }
    },
    writeJson() {
      return {
        ok: false,
        status: knownFailures[1].status,
        error: {
          code: knownFailures[1].code,
          message: privateMarker,
        },
      }
    },
  }).saveLearningTestBank(createPrivateTestBank())

  assert.equal(loadResult.error.code, knownFailures[0].code)
  assert.equal(preflightResult.error.code, knownFailures[0].code)
  assert.equal(writeResult.error.code, knownFailures[1].code)
  assert.equal(preflightWriteCalls, 0)

  for (const result of [loadResult, preflightResult, writeResult]) {
    assert.equal(JSON.stringify(result.error).includes(privateMarker), false)
  }
})

test('normalisiert fehlende, geworfene und formal fremde Adapterresultate', () => {
  const privateMarker = 'private-malformed-bank-adapter-sentinel'
  const expectedResult = {
    ok: false,
    status: 'storageFailed',
    error: {
      code: 'unexpectedStorageResult',
      message: 'Der Storage-Adapter hat kein verwertbares Ergebnis geliefert.',
    },
  }
  const malformedResults = [
    createLearningTestBankStorage({
      readJson() {
        throw new Error(privateMarker)
      },
    }).loadLearningTestBank(),
    createLearningTestBankStorage({
      readJson() {
        return { ok: true, status: 'found' }
      },
    }).loadLearningTestBank(),
    createLearningTestBankStorage({
      readJson() {
        return {
          ok: false,
          status: 'readFailed',
          error: { code: 'unknownPrivateCode', message: privateMarker },
        }
      },
    }).loadLearningTestBank(),
    createLearningTestBankStorage({
      readJson() {
        return { ok: true, status: 'missing' }
      },
      writeJson() {
        return { ok: true, status: 'found' }
      },
    }).saveLearningTestBank(createPrivateTestBank()),
  ]

  for (const result of malformedResults) {
    assert.deepEqual(result, expectedResult)
    assert.equal(JSON.stringify(result).includes(privateMarker), false)
  }

  for (const result of [
    createLearningTestBankStorage().loadLearningTestBank(),
    createLearningTestBankStorage().saveLearningTestBank(
      createPrivateTestBank()
    ),
  ]) {
    assert.equal(result.ok, false)
    assert.equal(result.status, 'unavailable')
    assert.equal(result.error.code, 'storageAdapterUnavailable')
  }
})
