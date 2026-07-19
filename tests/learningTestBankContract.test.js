import assert from 'node:assert/strict'
import test from 'node:test'

import {
  LEARNING_TEST_BANK_DATA_ORIGINS,
  LEARNING_TEST_BANK_ERROR_CODES,
  LEARNING_TEST_BANK_SCHEMA_VERSION,
  LEARNING_TEST_DIFFICULTIES,
  LEARNING_TEST_EXPLANATION_MAX_LENGTH,
  LEARNING_TEST_MAX_OPTION_COUNT,
  LEARNING_TEST_MIN_OPTION_COUNT,
  LEARNING_TEST_OPTION_LABEL_MAX_LENGTH,
  LEARNING_TEST_PROMPT_MAX_LENGTH,
  LEARNING_TEST_QUESTION_TYPES,
  isCanonicalUtcTimestamp,
  validateLearningTestBank,
} from '../src/modules/learning-hub/learningTestBankContract.js'

function createQuestion(overrides = {}) {
  const id = overrides.id ?? 'question-lumen-compass'
  const options = overrides.options ?? [
    { id: `${id}-option-north`, label: 'Nordlicht', position: 1 },
    { id: `${id}-option-south`, label: 'Südlicht', position: 2 },
  ]

  return {
    id,
    moduleId: 'module-lumen-atlas',
    chapterId: 'chapter-lumen-directions',
    learningNodeId: 'node-lumen-compass',
    type: 'singleChoice',
    prompt: 'Welches erfundene Signal zeigt nach Norden?',
    difficulty: 'medium',
    position: 1,
    revision: 1,
    createdAt: '2026-07-19T08:15:30.000Z',
    updatedAt: '2026-07-19T08:15:30.000Z',
    options,
    correctOptionId: overrides.correctOptionId ?? options[0]?.id,
    explanation: 'Das Nordlicht ist in diesem synthetischen Beispiel korrekt.',
    ...overrides,
  }
}

function createBank(questions = [], dataOrigin = 'private') {
  return {
    schemaVersion: 1,
    dataOrigin,
    questions,
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

test('exportiert den festen LearningTestBank-Vertrag', () => {
  assert.equal(LEARNING_TEST_BANK_SCHEMA_VERSION, 1)
  assert.deepEqual(LEARNING_TEST_BANK_DATA_ORIGINS, ['synthetic', 'private'])
  assert.deepEqual(LEARNING_TEST_QUESTION_TYPES, {
    SINGLE_CHOICE: 'singleChoice',
  })
  assert.deepEqual(LEARNING_TEST_DIFFICULTIES, {
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard',
  })
  assert.equal(LEARNING_TEST_PROMPT_MAX_LENGTH, 500)
  assert.equal(LEARNING_TEST_OPTION_LABEL_MAX_LENGTH, 300)
  assert.equal(LEARNING_TEST_EXPLANATION_MAX_LENGTH, 2000)
  assert.equal(LEARNING_TEST_MIN_OPTION_COUNT, 2)
  assert.equal(LEARNING_TEST_MAX_OPTION_COUNT, 6)
  assert.equal(Object.isFrozen(LEARNING_TEST_BANK_DATA_ORIGINS), true)
  assert.equal(Object.isFrozen(LEARNING_TEST_QUESTION_TYPES), true)
  assert.equal(Object.isFrozen(LEARNING_TEST_DIFFICULTIES), true)
  assert.equal(Object.isFrozen(LEARNING_TEST_BANK_ERROR_CODES), true)
})

test('akzeptiert leere und vollständig befüllte private oder synthetische Testbanken', () => {
  for (const dataOrigin of ['private', 'synthetic']) {
    assert.deepEqual(validateLearningTestBank(createBank([], dataOrigin)), {
      ok: true,
      errors: [],
    })
    assert.deepEqual(
      validateLearningTestBank(createBank([createQuestion()], dataOrigin)),
      { ok: true, errors: [] }
    )
  }
})

test('weist Root-, Schema-, Herkunfts- und Fragenarrayfehler stabil zurück', () => {
  for (const rootValue of [null, [], 'bank']) {
    assert.deepEqual(validateLearningTestBank(rootValue), {
      ok: false,
      errors: [{
        code: 'invalidLearningTestBank',
        path: '$',
        message: 'Die LearningTestBank muss ein Objekt sein.',
      }],
    })
  }

  const result = validateLearningTestBank({
    schemaVersion: 2,
    dataOrigin: 'remote',
    questions: null,
  })

  assert.deepEqual(getErrorCodes(result), [
    'unsupportedSchemaVersion',
    'invalidDataOrigin',
    'invalidQuestions',
  ])
})

test('fordert ausschließlich bekannte eigene Pflichtfelder ohne Rohwert-Leak', () => {
  const privateFieldMarker = 'private-bank-field-sentinel'
  const bank = createBank([createQuestion()])
  bank[privateFieldMarker] = 'private-bank-value-sentinel'
  bank.questions[0].privateQuestionField = 'private-question-value-sentinel'
  bank.questions[0].options[0].privateOptionField =
    'private-option-value-sentinel'
  delete bank.questions[0].prompt

  const result = validateLearningTestBank(bank)
  const serializedErrors = JSON.stringify(result.errors)

  assert.deepEqual(getErrorCodes(result).slice(0, 4), [
    'unknownProperty',
    'unknownProperty',
    'missingProperty',
    'invalidPrompt',
  ])
  assertHasError(result, 'unknownProperty', '$.questions[0].options[0].*')
  assertHasError(result, 'missingProperty', '$.questions[0].prompt')
  assert.equal(serializedErrors.includes(privateFieldMarker), false)
  assert.equal(serializedErrors.includes('private-bank-value-sentinel'), false)
  assert.equal(serializedErrors.includes('private-question-value-sentinel'), false)
  assert.equal(serializedErrors.includes('private-option-value-sentinel'), false)
})

test('weist Custom-Prototypes und geerbte Felder kontrolliert zurück', () => {
  const inheritedBank = Object.create(createBank())
  const inheritedQuestion = Object.assign(
    Object.create({ privateInheritedQuestion: 'private-value-sentinel' }),
    createQuestion()
  )
  const inheritedOption = Object.assign(
    Object.create({ privateInheritedOption: 'private-option-sentinel' }),
    createQuestion().options[0]
  )
  const throwingPrototypeOption = new Proxy(createQuestion().options[1], {
    getPrototypeOf() {
      throw new Error('private-prototype-error-sentinel')
    },
  })

  assert.deepEqual(getErrorCodes(validateLearningTestBank(inheritedBank)), [
    'invalidLearningTestBank',
  ])

  const questionResult = validateLearningTestBank(createBank([
    inheritedQuestion,
  ]))
  assert.deepEqual(getErrorCodes(questionResult), ['invalidQuestion'])

  const optionResult = validateLearningTestBank(createBank([
    createQuestion({ options: [inheritedOption, throwingPrototypeOption] }),
  ]))
  assert.deepEqual(getErrorCodes(optionResult), [
    'invalidOption',
    'invalidOption',
    'correctOptionNotFound',
  ])
  assert.equal(JSON.stringify(optionResult.errors).includes('private-'), false)
})

test('erlaubt null-Prototypes auf allen Vertragsobjekten', () => {
  const question = createQuestion()
  question.options = question.options.map((option) => Object.assign(
    Object.create(null),
    option
  ))
  const nullQuestion = Object.assign(Object.create(null), question)
  const nullBank = Object.assign(
    Object.create(null),
    createBank([nullQuestion])
  )

  assert.deepEqual(validateLearningTestBank(nullBank), {
    ok: true,
    errors: [],
  })
})

test('fordert bankweit eindeutige Frage- und Option-IDs', () => {
  const firstQuestion = createQuestion()
  const duplicateQuestion = createQuestion({
    position: 2,
    options: [
      { id: 'option-second-a', label: 'Erste Wahl', position: 1 },
      { id: 'option-second-b', label: 'Zweite Wahl', position: 2 },
    ],
    correctOptionId: 'option-second-a',
  })
  const duplicatedOptionAcrossQuestions = createQuestion({
    id: 'question-lumen-second',
    position: 3,
    options: [
      {
        id: firstQuestion.options[0].id,
        label: 'Wiederverwendete ID',
        position: 1,
      },
      { id: 'option-third-b', label: 'Andere Wahl', position: 2 },
    ],
    correctOptionId: firstQuestion.options[0].id,
  })
  const questionOptionCollision = createQuestion({
    id: 'question-lumen-third',
    learningNodeId: 'node-lumen-other',
    options: [
      { id: 'question-lumen-third', label: 'Kollision', position: 1 },
      { id: 'option-fourth-b', label: 'Andere Wahl', position: 2 },
    ],
    correctOptionId: 'question-lumen-third',
  })
  const result = validateLearningTestBank(createBank([
    firstQuestion,
    duplicateQuestion,
    duplicatedOptionAcrossQuestions,
    questionOptionCollision,
  ]))

  assert.deepEqual(getErrorCodes(result), [
    'duplicateId',
    'duplicateId',
    'duplicateId',
  ])
  assert.deepEqual(result.errors.map((error) => error.path), [
    '$.questions[1].id',
    '$.questions[2].options[0].id',
    '$.questions[3].options[0].id',
  ])
})

test('prüft positive und lokal eindeutige Positionen', () => {
  const firstQuestion = createQuestion()
  const sameNodePosition = createQuestion({
    id: 'question-lumen-same-node',
  })
  const otherNodeSamePosition = createQuestion({
    id: 'question-lumen-other-node',
    learningNodeId: 'node-lumen-other',
  })
  const result = validateLearningTestBank(createBank([
    firstQuestion,
    sameNodePosition,
    otherNodeSamePosition,
  ]))

  assert.deepEqual(getErrorCodes(result), ['duplicateQuestionPosition'])
  assert.equal(result.errors[0].path, '$.questions[1].position')

  const invalidResult = validateLearningTestBank(createBank([
    createQuestion({
      position: 0,
      options: [
        { id: 'option-position-a', label: 'A', position: 1 },
        { id: 'option-position-b', label: 'B', position: 1 },
      ],
      correctOptionId: 'option-position-a',
    }),
  ]))

  assert.deepEqual(getErrorCodes(invalidResult), [
    'invalidPosition',
    'duplicateOptionPosition',
  ])
})

test('begrenzt Optionen und fordert einen exakten lokalen Lösungsschlüssel', () => {
  for (const optionCount of [1, 7]) {
    const options = Array.from({ length: optionCount }, (_, index) => ({
      id: `option-count-${optionCount}-${index}`,
      label: `Wahl ${index + 1}`,
      position: index + 1,
    }))
    const result = validateLearningTestBank(createBank([
      createQuestion({ options, correctOptionId: options[0].id }),
    ]))

    assertHasError(result, 'invalidOptionCount', '$.questions[0].options')
  }

  const missingSolution = validateLearningTestBank(createBank([
    createQuestion({ correctOptionId: 'option-not-in-this-question' }),
  ]))
  assert.deepEqual(getErrorCodes(missingSolution), ['correctOptionNotFound'])
})

test('begrenzt Typ, Schwierigkeit, Revision und Textfelder exakt', () => {
  assert.equal(validateLearningTestBank(createBank([
    createQuestion({
      prompt: 'p'.repeat(500),
      explanation: '',
      options: [
        { id: 'option-boundary-a', label: 'a'.repeat(300), position: 1 },
        { id: 'option-boundary-b', label: 'B', position: 2 },
      ],
      correctOptionId: 'option-boundary-a',
    }),
  ])).ok, true)

  const result = validateLearningTestBank(createBank([
    createQuestion({
      type: 'multipleChoice',
      difficulty: 'expert',
      revision: 0,
      prompt: ` ${'p'.repeat(501)} `,
      explanation: ` ${'e'.repeat(2001)} `,
      options: [
        {
          id: 'option-invalid-text-a',
          label: ` ${'a'.repeat(301)} `,
          position: 1,
        },
        { id: 'option-invalid-text-b', label: 'B', position: 2 },
      ],
      correctOptionId: 'option-invalid-text-a',
    }),
  ]))

  assert.deepEqual(getErrorCodes(result), [
    'invalidQuestionType',
    'invalidPrompt',
    'promptTooLong',
    'invalidExplanation',
    'explanationTooLong',
    'invalidDifficulty',
    'invalidRevision',
    'invalidOptionLabel',
    'optionLabelTooLong',
  ])
})

test('prüft kanonische existente UTC-Zeitstempel und ihre Reihenfolge', () => {
  assert.equal(isCanonicalUtcTimestamp('2024-02-29T23:59:59.999Z'), true)

  for (const invalidTimestamp of [
    '2026-07-19T08:15:30Z',
    '2026-07-19T10:15:30.000+02:00',
    '2026-02-30T08:15:30.000Z',
    '2026-07-19T24:00:00.000Z',
    ' 2026-07-19T08:15:30.000Z ',
    null,
  ]) {
    assert.equal(isCanonicalUtcTimestamp(invalidTimestamp), false)
  }

  const result = validateLearningTestBank(createBank([
    createQuestion({
      createdAt: '2026-07-19T08:15:30.001Z',
      updatedAt: '2026-07-19T08:15:30.000Z',
    }),
  ]))

  assert.deepEqual(getErrorCodes(result), ['updatedAtBeforeCreatedAt'])
})

test('akkumuliert unabhängige Fehler stabil und ohne private Rohwerte', () => {
  const privateMarkers = [
    'private-question-id-sentinel',
    'private-prompt-sentinel',
    'private-time-sentinel',
  ]
  const result = validateLearningTestBank({
    schemaVersion: 7,
    dataOrigin: 'remote',
    questions: [
      createQuestion({
        id: ` ${privateMarkers[0]} `,
        moduleId: '',
        chapterId: 7,
        learningNodeId: null,
        type: 'essay',
        prompt: ` ${privateMarkers[1]} `,
        difficulty: 'unknown',
        position: 0,
        revision: 0,
        createdAt: privateMarkers[2],
        updatedAt: privateMarkers[2],
        explanation: 42,
        options: [null],
        correctOptionId: 'missing-option',
      }),
      null,
    ],
  })
  const serializedErrors = JSON.stringify(result.errors)

  assert.equal(result.ok, false)
  assert.ok(result.errors.length >= 15)
  result.errors.forEach((error) => {
    assert.deepEqual(Object.keys(error), ['code', 'path', 'message'])
  })
  privateMarkers.forEach((privateMarker) => {
    assert.equal(serializedErrors.includes(privateMarker), false)
  })
})

test('verändert gültige, fehlerhafte oder tief eingefrorene Eingaben nicht', () => {
  const validBank = createBank([createQuestion()])
  const invalidBank = createBank([
    createQuestion({ prompt: ' ungetrimmt ' }),
  ])
  const validSnapshot = structuredClone(validBank)
  const invalidSnapshot = structuredClone(invalidBank)

  validateLearningTestBank(validBank)
  validateLearningTestBank(invalidBank)

  assert.deepEqual(validBank, validSnapshot)
  assert.deepEqual(invalidBank, invalidSnapshot)
  assert.deepEqual(validateLearningTestBank(deepFreeze(validBank)), {
    ok: true,
    errors: [],
  })
})
