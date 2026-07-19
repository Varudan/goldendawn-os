import assert from 'node:assert/strict'
import test from 'node:test'

import {
  LEARNING_TEST_ATTEMPT_DATA_ORIGINS,
  LEARNING_TEST_ATTEMPT_ERROR_CODES,
  LEARNING_TEST_ATTEMPT_SCHEMA_VERSION,
  validateLearningTestAttemptLog,
} from '../src/modules/learning-hub/learningTestAttemptContract.js'

function createAnswer(overrides = {}) {
  return {
    questionId: 'question-prism-route',
    questionRevision: 1,
    learningNodeId: 'node-prism-route',
    selectedOptionId: 'option-prism-blue',
    correctOptionId: 'option-prism-blue',
    isCorrect: true,
    ...overrides,
  }
}

function createAttempt(overrides = {}) {
  const answers = overrides.answers ?? [createAnswer()]
  const correctAnswerCount = answers.filter(
    (answer) => answer?.isCorrect === true
  ).length

  return {
    id: 'attempt-prism-route',
    moduleId: 'module-prism-atlas',
    startedAt: '2026-07-19T09:00:00.000Z',
    completedAt: '2026-07-19T09:05:00.000Z',
    totalQuestionCount: answers.length,
    correctAnswerCount,
    scorePercent: answers.length === 0
      ? 0
      : Math.round(correctAnswerCount / answers.length * 100),
    answers,
    ...overrides,
  }
}

function createAttemptLog(attempts = [], dataOrigin = 'private') {
  return {
    schemaVersion: 1,
    dataOrigin,
    attempts,
  }
}

function getErrorCodes(result) {
  return result.errors.map((error) => error.code)
}

function assertHasError(result, code, path) {
  assert.equal(result.ok, false)
  assert.ok(
    result.errors.some((error) => error.code === code && error.path === path),
    `Erwarteter Fehler ${code} an ${path}: ${JSON.stringify(result.errors)}`
  )
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Reflect.ownKeys(value).forEach((key) => deepFreeze(value[key]))
    Object.freeze(value)
  }

  return value
}

test('exportiert den festen LearningTestAttemptLog-Vertrag', () => {
  assert.equal(LEARNING_TEST_ATTEMPT_SCHEMA_VERSION, 1)
  assert.deepEqual(LEARNING_TEST_ATTEMPT_DATA_ORIGINS, [
    'synthetic',
    'private',
  ])
  assert.equal(Object.isFrozen(LEARNING_TEST_ATTEMPT_DATA_ORIGINS), true)
  assert.equal(Object.isFrozen(LEARNING_TEST_ATTEMPT_ERROR_CODES), true)
})

test('akzeptiert leere Logs und konsistente Attempts beider Datenherkünfte', () => {
  for (const dataOrigin of ['private', 'synthetic']) {
    assert.deepEqual(
      validateLearningTestAttemptLog(createAttemptLog([], dataOrigin)),
      { ok: true, errors: [] }
    )
  }

  const answers = [
    createAnswer(),
    createAnswer({
      questionId: 'question-prism-second',
      selectedOptionId: 'option-prism-wrong',
      isCorrect: false,
    }),
    createAnswer({ questionId: 'question-prism-third' }),
  ]
  const attempt = createAttempt({
    answers,
    totalQuestionCount: 3,
    correctAnswerCount: 2,
    scorePercent: 67,
  })

  assert.deepEqual(
    validateLearningTestAttemptLog(createAttemptLog([attempt])),
    { ok: true, errors: [] }
  )
})

test('weist Root-, Schema-, Herkunfts- und Attempts-Arrayfehler zurück', () => {
  for (const rootValue of [null, [], 'attempt-log']) {
    assert.deepEqual(validateLearningTestAttemptLog(rootValue), {
      ok: false,
      errors: [{
        code: 'invalidLearningTestAttemptLog',
        path: '$',
        message: 'Der LearningTestAttemptLog muss ein Objekt sein.',
      }],
    })
  }

  const result = validateLearningTestAttemptLog({
    schemaVersion: 2,
    dataOrigin: 'remote',
    attempts: null,
  })

  assert.deepEqual(getErrorCodes(result), [
    'unsupportedSchemaVersion',
    'invalidDataOrigin',
    'invalidAttempts',
  ])
})

test('fordert bekannte eigene Pflichtfelder und verbietet kopierte Texte', () => {
  const privateFieldMarker = 'private-attempt-field-sentinel'
  const log = createAttemptLog([createAttempt()])
  log[privateFieldMarker] = 'private-root-value-sentinel'
  log.attempts[0].privateAttemptField = 'private-attempt-value-sentinel'
  log.attempts[0].answers[0].prompt = 'private-question-text-sentinel'
  delete log.attempts[0].answers[0].questionRevision

  const result = validateLearningTestAttemptLog(log)
  const serializedErrors = JSON.stringify(result.errors)

  assertHasError(result, 'unknownProperty', '$.*')
  assertHasError(result, 'unknownProperty', '$.attempts[0].*')
  assertHasError(result, 'unknownProperty', '$.attempts[0].answers[0].*')
  assertHasError(
    result,
    'missingProperty',
    '$.attempts[0].answers[0].questionRevision'
  )
  assertHasError(
    result,
    'invalidQuestionRevision',
    '$.attempts[0].answers[0].questionRevision'
  )
  assert.equal(serializedErrors.includes(privateFieldMarker), false)
  assert.equal(serializedErrors.includes('private-question-text-sentinel'), false)
})

test('weist Custom-Prototypes und geerbte Felder kontrolliert zurück', () => {
  const inheritedLog = Object.create(createAttemptLog())
  const inheritedAttempt = Object.assign(
    Object.create({ privateAttempt: 'private-attempt-sentinel' }),
    createAttempt()
  )
  const inheritedAnswer = Object.assign(
    Object.create({ privateAnswer: 'private-answer-sentinel' }),
    createAnswer()
  )
  const throwingAnswer = new Proxy(createAnswer(), {
    getPrototypeOf() {
      throw new Error('private-prototype-error-sentinel')
    },
  })

  assert.deepEqual(
    getErrorCodes(validateLearningTestAttemptLog(inheritedLog)),
    ['invalidLearningTestAttemptLog']
  )
  assert.deepEqual(getErrorCodes(validateLearningTestAttemptLog(
    createAttemptLog([inheritedAttempt])
  )), ['invalidAttempt'])

  const answerResult = validateLearningTestAttemptLog(createAttemptLog([
    createAttempt({
      answers: [inheritedAnswer, throwingAnswer],
      totalQuestionCount: 2,
      correctAnswerCount: 2,
      scorePercent: 100,
    }),
  ]))

  assert.deepEqual(getErrorCodes(answerResult), [
    'invalidAnswer',
    'invalidAnswer',
  ])
  assert.equal(JSON.stringify(answerResult.errors).includes('private-'), false)
})

test('erlaubt null-Prototypes auf allen Vertragsobjekten', () => {
  const nullAnswer = Object.assign(Object.create(null), createAnswer())
  const nullAttempt = Object.assign(
    Object.create(null),
    createAttempt({ answers: [nullAnswer] })
  )
  const nullLog = Object.assign(
    Object.create(null),
    createAttemptLog([nullAttempt])
  )

  assert.deepEqual(validateLearningTestAttemptLog(nullLog), {
    ok: true,
    errors: [],
  })
})

test('fordert logweit eindeutige Attempt-IDs und je Attempt eindeutige Fragen', () => {
  const firstAttempt = createAttempt()
  const duplicateAttempt = createAttempt({
    moduleId: 'module-prism-second',
    answers: [createAnswer({ questionId: 'question-other-attempt' })],
  })
  const duplicateQuestionAttempt = createAttempt({
    id: 'attempt-prism-second',
    answers: [
      createAnswer(),
      createAnswer({ selectedOptionId: 'option-prism-wrong', isCorrect: false }),
    ],
    totalQuestionCount: 2,
    correctAnswerCount: 1,
    scorePercent: 50,
  })
  const result = validateLearningTestAttemptLog(createAttemptLog([
    firstAttempt,
    duplicateAttempt,
    duplicateQuestionAttempt,
  ]))

  assert.deepEqual(getErrorCodes(result), [
    'duplicateAttemptId',
    'duplicateQuestionId',
  ])
})

test('fordert mindestens eine strukturierte Antwort und positive Revisionen', () => {
  const sparseAnswers = [null, [], 'answer']
  sparseAnswers.length += 1
  const malformedResult = validateLearningTestAttemptLog(createAttemptLog([
    createAttempt({
      answers: sparseAnswers,
      totalQuestionCount: 4,
      correctAnswerCount: 0,
      scorePercent: 0,
    }),
  ]))

  assert.deepEqual(getErrorCodes(malformedResult), [
    'invalidAnswer',
    'invalidAnswer',
    'invalidAnswer',
    'invalidAnswer',
  ])

  const emptyResult = validateLearningTestAttemptLog(createAttemptLog([
    createAttempt({
      answers: [],
      totalQuestionCount: 0,
      correctAnswerCount: 0,
      scorePercent: 0,
    }),
  ]))

  assert.deepEqual(getErrorCodes(emptyResult), [
    'invalidTotalQuestionCount',
    'attemptRequiresAnswer',
  ])

  const revisionResult = validateLearningTestAttemptLog(createAttemptLog([
    createAttempt({ answers: [createAnswer({ questionRevision: 0 })] }),
  ]))
  assertHasError(
    revisionResult,
    'invalidQuestionRevision',
    '$.attempts[0].answers[0].questionRevision'
  )
})

test('fordert getrimmte IDs und exakt konsistente boolesche Auswertungen', () => {
  const result = validateLearningTestAttemptLog(createAttemptLog([
    createAttempt({
      id: ' attempt ',
      moduleId: '',
      answers: [createAnswer({
        questionId: 7,
        learningNodeId: ' node ',
        selectedOptionId: 'option-a',
        correctOptionId: 'option-b',
        isCorrect: true,
      })],
    }),
  ]))

  assert.deepEqual(getErrorCodes(result), [
    'invalidId',
    'invalidId',
    'invalidId',
    'invalidId',
    'inconsistentIsCorrect',
  ])

  const invalidBooleanResult = validateLearningTestAttemptLog(createAttemptLog([
    createAttempt({
      answers: [createAnswer({ isCorrect: 'true' })],
      correctAnswerCount: 0,
      scorePercent: 0,
    }),
  ]))
  assert.deepEqual(getErrorCodes(invalidBooleanResult), ['invalidIsCorrect'])
})

test('prüft Counts und scorePercent mit der exakten Math.round-Regel', () => {
  const answers = [
    createAnswer({ questionId: 'question-rounding-one' }),
    createAnswer({
      questionId: 'question-rounding-two',
      selectedOptionId: 'option-wrong',
      isCorrect: false,
    }),
    createAnswer({
      questionId: 'question-rounding-three',
      selectedOptionId: 'option-wrong',
      isCorrect: false,
    }),
  ]
  const validAttempt = createAttempt({
    answers,
    totalQuestionCount: 3,
    correctAnswerCount: 1,
    scorePercent: 33,
  })
  assert.equal(validateLearningTestAttemptLog(
    createAttemptLog([validAttempt])
  ).ok, true)

  const mismatchResult = validateLearningTestAttemptLog(createAttemptLog([
    createAttempt({
      answers,
      totalQuestionCount: 4,
      correctAnswerCount: 2,
      scorePercent: 49,
    }),
  ]))

  assert.deepEqual(getErrorCodes(mismatchResult), [
    'totalQuestionCountMismatch',
    'correctAnswerCountMismatch',
    'scorePercentMismatch',
  ])

  const invalidNumbersResult = validateLearningTestAttemptLog(createAttemptLog([
    createAttempt({
      totalQuestionCount: 1.5,
      correctAnswerCount: -1,
      scorePercent: 101,
    }),
  ]))
  assert.deepEqual(getErrorCodes(invalidNumbersResult), [
    'invalidTotalQuestionCount',
    'invalidCorrectAnswerCount',
    'invalidScorePercent',
  ])
})

test('prüft Attempt-Zeitspannen, sortiert den Log aber nicht nach Zeiten', () => {
  const laterAttempt = createAttempt({
    startedAt: '2026-07-19T12:00:00.000Z',
    completedAt: '2026-07-19T12:05:00.000Z',
  })
  const earlierAttempt = createAttempt({
    id: 'attempt-prism-earlier-appended-later',
    startedAt: '2026-07-19T08:00:00.000Z',
    completedAt: '2026-07-19T08:05:00.000Z',
  })
  assert.equal(validateLearningTestAttemptLog(createAttemptLog([
    laterAttempt,
    earlierAttempt,
  ])).ok, true)

  const reversedResult = validateLearningTestAttemptLog(createAttemptLog([
    createAttempt({
      startedAt: '2026-07-19T09:05:00.001Z',
      completedAt: '2026-07-19T09:05:00.000Z',
    }),
  ]))
  assert.deepEqual(getErrorCodes(reversedResult), [
    'completedAtBeforeStartedAt',
  ])

  const invalidResult = validateLearningTestAttemptLog(createAttemptLog([
    createAttempt({
      startedAt: '2026-07-19T09:00:00Z',
      completedAt: '2026-02-30T09:05:00.000Z',
    }),
  ]))
  assert.deepEqual(getErrorCodes(invalidResult), [
    'invalidStartedAt',
    'invalidCompletedAt',
  ])
})

test('akkumuliert Fehler stabil, redigiert Rohwerte und verändert nichts', () => {
  const privateMarkers = [
    'private-attempt-id-sentinel',
    'private-question-id-sentinel',
    'private-time-sentinel',
  ]
  const invalidLog = {
    schemaVersion: 9,
    dataOrigin: 'remote',
    attempts: [
      createAttempt({
        id: ` ${privateMarkers[0]} `,
        moduleId: '',
        startedAt: privateMarkers[2],
        completedAt: privateMarkers[2],
        totalQuestionCount: 2,
        correctAnswerCount: 2,
        scorePercent: 1,
        answers: [createAnswer({
          questionId: ` ${privateMarkers[1]} `,
          questionRevision: 0,
          learningNodeId: '',
          selectedOptionId: ' option ',
          correctOptionId: null,
          isCorrect: null,
        })],
      }),
      null,
    ],
  }
  const snapshot = structuredClone(invalidLog)
  const result = validateLearningTestAttemptLog(invalidLog)
  const serializedErrors = JSON.stringify(result.errors)

  assert.equal(result.ok, false)
  assert.ok(result.errors.length >= 15)
  result.errors.forEach((error) => {
    assert.deepEqual(Object.keys(error), ['code', 'path', 'message'])
  })
  privateMarkers.forEach((privateMarker) => {
    assert.equal(serializedErrors.includes(privateMarker), false)
  })
  assert.deepEqual(invalidLog, snapshot)

  const frozenLog = deepFreeze(createAttemptLog([createAttempt()]))
  assert.deepEqual(validateLearningTestAttemptLog(frozenLog), {
    ok: true,
    errors: [],
  })
})
