import assert from 'node:assert/strict'
import test from 'node:test'

import { createStorageAdapter } from '../src/storage/storageAdapter.js'
import {
  createLearningTestAttemptStorage,
  LEARNING_TEST_ATTEMPT_STORAGE_KEY,
} from '../src/storage/learningTestAttemptStorage.js'
import { FakeStorage } from './helpers/fakeStorage.js'

function createAnswer(overrides = {}) {
  return {
    questionId: 'question-cedar-route-1',
    questionRevision: 1,
    learningNodeId: 'node-cedar-route',
    selectedOptionId: 'option-cedar-east',
    correctOptionId: 'option-cedar-east',
    isCorrect: true,
    ...overrides,
  }
}

function createAttempt(overrides = {}) {
  return {
    id: 'attempt-cedar-1',
    moduleId: 'module-cedar-atlas',
    startedAt: '2026-07-19T11:00:00.000Z',
    completedAt: '2026-07-19T11:05:00.000Z',
    totalQuestionCount: 1,
    correctAnswerCount: 1,
    scorePercent: 100,
    answers: [createAnswer()],
    ...overrides,
  }
}

function createPrivateAttemptLog(attempts = [createAttempt()]) {
  return {
    schemaVersion: 1,
    dataOrigin: 'private',
    attempts,
  }
}

function createStorageSystem(initialValue) {
  const initialEntries = initialValue === undefined
    ? []
    : [[LEARNING_TEST_ATTEMPT_STORAGE_KEY, initialValue]]
  const fakeStorage = new FakeStorage(initialEntries)
  const learningTestAttemptStorage = createLearningTestAttemptStorage(
    createStorageAdapter(fakeStorage)
  )

  return { fakeStorage, learningTestAttemptStorage }
}

test('verwendet nur den festen Attempt-Key und bietet keinen Überschreibpfad', () => {
  const readKeys = []
  const writeKeys = []
  const storage = createLearningTestAttemptStorage({
    readJson(key) {
      readKeys.push(key)
      return { ok: true, status: 'missing' }
    },
    writeJson(key) {
      writeKeys.push(key)
      return { ok: true, status: 'saved' }
    },
  })

  storage.loadLearningTestAttempts()
  const appendResult = storage.appendLearningTestAttempt(createAttempt())

  assert.equal(
    LEARNING_TEST_ATTEMPT_STORAGE_KEY,
    'goldendawn.learningHub.testAttempts.v1'
  )
  assert.equal(appendResult.ok, true)
  assert.equal(appendResult.status, 'appended')
  assert.deepEqual(readKeys, [
    LEARNING_TEST_ATTEMPT_STORAGE_KEY,
    LEARNING_TEST_ATTEMPT_STORAGE_KEY,
  ])
  assert.deepEqual(writeKeys, [LEARNING_TEST_ATTEMPT_STORAGE_KEY])
  assert.deepEqual(Object.keys(storage).sort(), [
    'appendLearningTestAttempt',
    'loadLearningTestAttempts',
  ])
  assert.equal(Object.isFrozen(storage), true)
  assert.equal('saveLearningTestAttempts' in storage, false)
})

test('liefert bei fehlendem Key frische private Leerzustände ohne Schreiben', () => {
  const { fakeStorage, learningTestAttemptStorage } = createStorageSystem()

  const firstResult = learningTestAttemptStorage.loadLearningTestAttempts()
  firstResult.attemptLog.attempts.push(createAttempt())
  const secondResult = learningTestAttemptStorage.loadLearningTestAttempts()

  assert.deepEqual(secondResult, {
    ok: true,
    status: 'missing',
    attemptLog: {
      schemaVersion: 1,
      dataOrigin: 'private',
      attempts: [],
    },
  })
  assert.notStrictEqual(firstResult.attemptLog, secondResult.attemptLog)
  assert.notStrictEqual(
    firstResult.attemptLog.attempts,
    secondResult.attemptLog.attempts
  )
  assert.equal(fakeStorage.getItemCalls, 2)
  assert.equal(fakeStorage.setItemCalls, 0)
  assert.equal(fakeStorage.peek(LEARNING_TEST_ATTEMPT_STORAGE_KEY), null)
})

test('lädt einen gültigen privaten Attempt-Log tief defensiv geklont', () => {
  const storedAttemptLog = createPrivateAttemptLog()
  const storedSnapshot = structuredClone(storedAttemptLog)
  const storage = createLearningTestAttemptStorage({
    readJson() {
      return {
        ok: true,
        status: 'found',
        value: storedAttemptLog,
      }
    },
  })

  const result = storage.loadLearningTestAttempts()

  assert.deepEqual(result, {
    ok: true,
    status: 'found',
    attemptLog: storedSnapshot,
  })
  assert.notStrictEqual(result.attemptLog, storedAttemptLog)
  assert.notStrictEqual(result.attemptLog.attempts, storedAttemptLog.attempts)
  assert.notStrictEqual(
    result.attemptLog.attempts[0].answers,
    storedAttemptLog.attempts[0].answers
  )

  result.attemptLog.attempts[0].answers[0].selectedOptionId =
    'result-only-option'
  assert.deepEqual(storedAttemptLog, storedSnapshot)
})

test('hängt an einen fehlenden Log genau einen defensiv geklonten Versuch an', () => {
  const attempt = createAttempt()
  const inputSnapshot = structuredClone(attempt)
  let writtenAttemptLog
  let readCalls = 0
  let writeCalls = 0
  const storage = createLearningTestAttemptStorage({
    readJson(key) {
      readCalls += 1
      assert.equal(key, LEARNING_TEST_ATTEMPT_STORAGE_KEY)
      return { ok: true, status: 'missing' }
    },
    writeJson(key, value) {
      writeCalls += 1
      assert.equal(key, LEARNING_TEST_ATTEMPT_STORAGE_KEY)
      writtenAttemptLog = value
      return { ok: true, status: 'saved' }
    },
  })

  const result = storage.appendLearningTestAttempt(attempt)

  assert.equal(readCalls, 1)
  assert.equal(writeCalls, 1)
  assert.deepEqual(result, {
    ok: true,
    status: 'appended',
    attemptLog: createPrivateAttemptLog(),
  })
  assert.deepEqual(writtenAttemptLog, createPrivateAttemptLog())
  assert.notStrictEqual(writtenAttemptLog.attempts[0], attempt)
  assert.notStrictEqual(writtenAttemptLog, result.attemptLog)
  assert.notStrictEqual(
    writtenAttemptLog.attempts[0],
    result.attemptLog.attempts[0]
  )

  writtenAttemptLog.attempts[0].answers[0].questionId = 'adapter-only-change'
  result.attemptLog.attempts[0].moduleId = 'result-only-change'
  assert.deepEqual(attempt, inputSnapshot)
})

test('bewahrt beim Anhängen den vollständigen gültigen Prefix unverändert und in Append-Reihenfolge', () => {
  const firstAttempt = createAttempt()
  const secondAttempt = createAttempt({
    id: 'attempt-cedar-2',
    startedAt: '2026-07-19T12:00:00.000Z',
    completedAt: '2026-07-19T12:04:00.000Z',
    correctAnswerCount: 0,
    scorePercent: 0,
    answers: [
      createAnswer({
        selectedOptionId: 'option-cedar-west',
        isCorrect: false,
      }),
    ],
  })
  const existingLog = createPrivateAttemptLog([firstAttempt])
  const existingSnapshot = structuredClone(existingLog)
  let writtenAttemptLog
  let writeCalls = 0
  const storage = createLearningTestAttemptStorage({
    readJson() {
      return {
        ok: true,
        status: 'found',
        value: existingLog,
      }
    },
    writeJson(key, value) {
      writeCalls += 1
      assert.equal(key, LEARNING_TEST_ATTEMPT_STORAGE_KEY)
      writtenAttemptLog = value
      return { ok: true, status: 'saved' }
    },
  })

  const result = storage.appendLearningTestAttempt(secondAttempt)

  assert.equal(result.ok, true)
  assert.equal(result.status, 'appended')
  assert.equal(writeCalls, 1)
  assert.equal(writtenAttemptLog.attempts.length, 2)
  assert.deepEqual(writtenAttemptLog.attempts[0], existingSnapshot.attempts[0])
  assert.deepEqual(writtenAttemptLog.attempts[1], secondAttempt)
  assert.deepEqual(result.attemptLog.attempts, [firstAttempt, secondAttempt])
  assert.deepEqual(existingLog, existingSnapshot)
})

test('verhindert doppelte Attempt-IDs nach dem Preflight ohne Prefix-Überschreibung', () => {
  const existingLog = createPrivateAttemptLog()
  const existingSnapshot = structuredClone(existingLog)
  let writeCalls = 0
  const storage = createLearningTestAttemptStorage({
    readJson() {
      return {
        ok: true,
        status: 'found',
        value: existingLog,
      }
    },
    writeJson() {
      writeCalls += 1
      return { ok: true, status: 'saved' }
    },
  })

  const result = storage.appendLearningTestAttempt(createAttempt())

  assert.equal(result.ok, false)
  assert.equal(result.status, 'validationFailed')
  assert.equal(result.error.code, 'invalidLearningTestAttemptLogData')
  assert.equal(writeCalls, 0)
  assert.deepEqual(existingLog, existingSnapshot)
})

test('überschreibt keine beschädigten, synthetischen oder nicht unterstützten Logs', () => {
  const protectedRawValues = [
    '{broken',
    JSON.stringify({
      ...createPrivateAttemptLog(),
      dataOrigin: 'synthetic',
    }),
    JSON.stringify({
      ...createPrivateAttemptLog(),
      schemaVersion: 4,
    }),
    JSON.stringify({
      ...createPrivateAttemptLog(),
      attempts: null,
    }),
  ]
  const nextAttempt = createAttempt({ id: 'attempt-cedar-next' })

  for (const protectedRawValue of protectedRawValues) {
    const { fakeStorage, learningTestAttemptStorage } = createStorageSystem(
      protectedRawValue
    )
    const result = learningTestAttemptStorage.appendLearningTestAttempt(
      nextAttempt
    )

    assert.equal(result.ok, false)
    assert.equal(
      ['invalidJson', 'invalidStoredData'].includes(result.status),
      true
    )
    assert.equal(
      fakeStorage.peek(LEARNING_TEST_ATTEMPT_STORAGE_KEY),
      protectedRawValue
    )
    assert.equal(fakeStorage.getItemCalls, 1)
    assert.equal(fakeStorage.setItemCalls, 0)
  }
})

test('weist synthetische Logs an der privaten Lade- und Append-Grenze zurück', () => {
  const syntheticLog = {
    ...createPrivateAttemptLog(),
    dataOrigin: 'synthetic',
  }
  const rawValue = JSON.stringify(syntheticLog)
  const { fakeStorage, learningTestAttemptStorage } = createStorageSystem(
    rawValue
  )

  const loadResult = learningTestAttemptStorage.loadLearningTestAttempts()
  const appendResult = learningTestAttemptStorage.appendLearningTestAttempt(
    createAttempt({ id: 'attempt-cedar-next' })
  )

  for (const result of [loadResult, appendResult]) {
    assert.equal(result.ok, false)
    assert.equal(result.status, 'invalidStoredData')
    assert.equal(result.error.code, 'privateLearningTestAttemptsRequired')
  }
  assert.equal(fakeStorage.peek(LEARNING_TEST_ATTEMPT_STORAGE_KEY), rawValue)
  assert.equal(fakeStorage.setItemCalls, 0)
})

test('lehnt einen beim Klonen synthetisch wechselnden Attempt-Log beim Laden ab', () => {
  const switchingAttemptLog = createPrivateAttemptLog()
  let dataOriginReads = 0

  Object.defineProperty(switchingAttemptLog, 'dataOrigin', {
    configurable: true,
    enumerable: true,
    get() {
      dataOriginReads += 1
      return dataOriginReads <= 2 ? 'private' : 'synthetic'
    },
  })

  const storage = createLearningTestAttemptStorage({
    readJson() {
      return {
        ok: true,
        status: 'found',
        value: switchingAttemptLog,
      }
    },
  })

  const result = storage.loadLearningTestAttempts()

  assert.equal(result.ok, false)
  assert.equal(result.status, 'invalidStoredData')
  assert.equal(result.error.code, 'privateLearningTestAttemptsRequired')
  assert.equal('attemptLog' in result, false)
  assert.equal(dataOriginReads, 3)
})

test('bricht Append bei synthetisch wechselndem Preflight ohne Write ab', () => {
  const switchingAttemptLog = createPrivateAttemptLog()
  let dataOriginReads = 0
  let writeCalls = 0

  Object.defineProperty(switchingAttemptLog, 'dataOrigin', {
    configurable: true,
    enumerable: true,
    get() {
      dataOriginReads += 1
      return dataOriginReads <= 2 ? 'private' : 'synthetic'
    },
  })

  const storage = createLearningTestAttemptStorage({
    readJson() {
      return {
        ok: true,
        status: 'found',
        value: switchingAttemptLog,
      }
    },
    writeJson() {
      writeCalls += 1
      return { ok: true, status: 'saved' }
    },
  })

  const result = storage.appendLearningTestAttempt(
    createAttempt({ id: 'attempt-cedar-next' })
  )

  assert.equal(result.ok, false)
  assert.equal(result.status, 'invalidStoredData')
  assert.equal(result.error.code, 'privateLearningTestAttemptsRequired')
  assert.equal('attemptLog' in result, false)
  assert.equal(JSON.stringify(result).includes('synthetic'), false)
  assert.equal(writeCalls, 0)
  assert.equal(dataOriginReads, 3)
})

test('validiert genau einen vollständigen Versuch vor Storage-Zugriffen', () => {
  const privateMarker = 'private-attempt-answer-sentinel'
  const customPrototypeAttempt = Object.assign(
    Object.create({ inheritedMarker: privateMarker }),
    createAttempt({ id: 'attempt-custom-prototype' })
  )
  const invalidAttempts = [
    null,
    [createAttempt()],
    createAttempt({ answers: [] }),
    createAttempt({
      answers: [
        createAnswer({ selectedOptionId: privateMarker, isCorrect: true }),
      ],
    }),
    createAttempt({ extraAttemptField: privateMarker }),
    customPrototypeAttempt,
  ]
  let readCalls = 0
  let writeCalls = 0
  const storage = createLearningTestAttemptStorage({
    readJson() {
      readCalls += 1
      return { ok: true, status: 'missing' }
    },
    writeJson() {
      writeCalls += 1
      return { ok: true, status: 'saved' }
    },
  })

  for (const invalidAttempt of invalidAttempts) {
    const result = storage.appendLearningTestAttempt(invalidAttempt)

    assert.equal(result.ok, false)
    assert.equal(result.status, 'validationFailed')
    assert.equal(result.error.code, 'invalidLearningTestAttemptLogData')
    assert.equal(JSON.stringify(result).includes(privateMarker), false)
  }

  assert.equal(readCalls, 0)
  assert.equal(writeCalls, 0)
})

test('redigiert Adaptermeldungen und blockiert Schreibzugriffe nach Preflight-Fehlern', () => {
  const privateMarker = 'private-attempt-adapter-sentinel'
  let writeCalls = 0
  const preflightResult = createLearningTestAttemptStorage({
    readJson() {
      return {
        ok: false,
        status: 'readFailed',
        error: {
          code: 'storageReadFailed',
          message: privateMarker,
        },
      }
    },
    writeJson() {
      writeCalls += 1
      return { ok: true, status: 'saved' }
    },
  }).appendLearningTestAttempt(createAttempt())

  const writeResult = createLearningTestAttemptStorage({
    readJson() {
      return { ok: true, status: 'missing' }
    },
    writeJson() {
      return {
        ok: false,
        status: 'quotaExceeded',
        error: {
          code: 'storageQuotaExceeded',
          message: privateMarker,
        },
      }
    },
  }).appendLearningTestAttempt(createAttempt())

  assert.equal(preflightResult.error.code, 'storageReadFailed')
  assert.equal(writeResult.error.code, 'storageQuotaExceeded')
  assert.equal(writeCalls, 0)
  assert.equal(JSON.stringify(preflightResult).includes(privateMarker), false)
  assert.equal(JSON.stringify(writeResult).includes(privateMarker), false)
})

test('normalisiert fehlende, geworfene und fremde Adapterresultate inhaltsfrei', () => {
  const privateMarker = 'private-malformed-attempt-adapter-sentinel'
  const expectedResult = {
    ok: false,
    status: 'storageFailed',
    error: {
      code: 'unexpectedStorageResult',
      message: 'Der Storage-Adapter hat kein verwertbares Ergebnis geliefert.',
    },
  }
  const malformedResults = [
    createLearningTestAttemptStorage({
      readJson() {
        throw new Error(privateMarker)
      },
    }).loadLearningTestAttempts(),
    createLearningTestAttemptStorage({
      readJson() {
        return { ok: true, status: 'found' }
      },
    }).loadLearningTestAttempts(),
    createLearningTestAttemptStorage({
      readJson() {
        return {
          ok: false,
          status: 'readFailed',
          error: { code: 'unknownPrivateCode', message: privateMarker },
        }
      },
    }).loadLearningTestAttempts(),
    createLearningTestAttemptStorage({
      readJson() {
        return { ok: true, status: 'missing' }
      },
      writeJson() {
        return { ok: true, status: 'found' }
      },
    }).appendLearningTestAttempt(createAttempt()),
  ]

  for (const result of malformedResults) {
    assert.deepEqual(result, expectedResult)
    assert.equal(JSON.stringify(result).includes(privateMarker), false)
  }

  for (const result of [
    createLearningTestAttemptStorage().loadLearningTestAttempts(),
    createLearningTestAttemptStorage().appendLearningTestAttempt(
      createAttempt()
    ),
  ]) {
    assert.equal(result.ok, false)
    assert.equal(result.status, 'unavailable')
    assert.equal(result.error.code, 'storageAdapterUnavailable')
  }
})
