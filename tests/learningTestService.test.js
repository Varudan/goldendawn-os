import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createLearningTestService,
} from '../src/services/learningTestService.js'

const STARTED_AT = '2026-07-19T10:00:00.000Z'
const UPDATED_AT = '2026-07-19T10:15:00.000Z'
const COMPLETED_AT = '2026-07-19T10:30:00.000Z'

function createHub() {
  return {
    schemaVersion: 2,
    dataOrigin: 'private',
    modules: [
      {
        id: 'module-orbit',
        title: 'Synthetische Orbitnavigation',
        position: 1,
        chapters: [
          {
            id: 'chapter-orbit-basics',
            title: 'Erfundene Grundlagen',
            position: 1,
            learningNodes: [
              {
                id: 'node-orbit-vector',
                title: 'Fiktive Vektoren',
                content: 'Unabhängig erfundener Lerntext.',
                position: 1,
              },
              {
                id: 'node-orbit-window',
                title: 'Fiktive Fenster',
                content: 'Weiterer synthetischer Lerntext.',
                position: 2,
              },
            ],
          },
          {
            id: 'chapter-orbit-transfer',
            title: 'Erfundener Transfer',
            position: 2,
            learningNodes: [
              {
                id: 'node-orbit-burn',
                title: 'Fiktiver Impuls',
                content: 'Noch ein synthetischer Lerntext.',
                position: 1,
              },
            ],
          },
        ],
      },
      {
        id: 'module-garden',
        title: 'Synthetische Kristallgärten',
        position: 2,
        chapters: [
          {
            id: 'chapter-garden-light',
            title: 'Erfundenes Licht',
            position: 1,
            learningNodes: [
              {
                id: 'node-garden-prism',
                title: 'Fiktives Prisma',
                content: 'Synthetischer Demonstrationstext.',
                position: 1,
              },
            ],
          },
        ],
      },
    ],
  }
}

function createQuestion(overrides = {}) {
  return {
    id: 'question-vector-one',
    moduleId: 'module-orbit',
    chapterId: 'chapter-orbit-basics',
    learningNodeId: 'node-orbit-vector',
    type: 'singleChoice',
    prompt: 'Welche erfundene Richtung ist stabil?',
    difficulty: 'easy',
    position: 1,
    revision: 1,
    createdAt: STARTED_AT,
    updatedAt: STARTED_AT,
    options: [
      { id: 'option-vector-north', label: 'Nordbogen', position: 1 },
      { id: 'option-vector-south', label: 'Südbogen', position: 2 },
    ],
    correctOptionId: 'option-vector-north',
    explanation: 'Der Nordbogen ist im erfundenen Modell stabil.',
    ...overrides,
  }
}

function createBank(questions = []) {
  return {
    schemaVersion: 1,
    dataOrigin: 'private',
    questions,
  }
}

function createAttempt(overrides = {}) {
  return {
    id: 'attempt-orbit-one',
    moduleId: 'module-orbit',
    startedAt: STARTED_AT,
    completedAt: COMPLETED_AT,
    totalQuestionCount: 1,
    correctAnswerCount: 1,
    scorePercent: 100,
    answers: [
      {
        questionId: 'question-vector-one',
        questionRevision: 1,
        learningNodeId: 'node-orbit-vector',
        selectedOptionId: 'option-vector-north',
        correctOptionId: 'option-vector-north',
        isCorrect: true,
      },
    ],
    ...overrides,
  }
}

function createAttemptLog(attempts = []) {
  return {
    schemaVersion: 1,
    dataOrigin: 'private',
    attempts,
  }
}

function createServiceSystem({
  hub = createHub(),
  bank = createBank(),
  bankStatus = bank.questions.length === 0 ? 'missing' : 'found',
  attemptLog = createAttemptLog(),
  idValues = {},
  timestamps = [STARTED_AT, COMPLETED_AT],
  appendImplementation,
  idImplementation,
  nowImplementation,
} = {}) {
  let currentBank = structuredClone(bank)
  let currentAttemptLog = structuredClone(attemptLog)
  const idQueues = Object.fromEntries(
    Object.entries(idValues).map(([type, values]) => [type, [...values]])
  )
  const calls = {
    loadHub: 0,
    loadBank: 0,
    saveBank: 0,
    loadAttempts: 0,
    appendAttempt: 0,
    idTypes: [],
    now: 0,
  }
  let generatedIdCount = 0
  let timestampIndex = 0

  const learningHubService = {
    loadHub() {
      calls.loadHub += 1
      return {
        ok: true,
        status: hub.modules.length === 0 ? 'empty' : 'loaded',
        hub: structuredClone(hub),
      }
    },
  }
  const learningTestBankStorage = {
    loadLearningTestBank() {
      calls.loadBank += 1
      return {
        ok: true,
        status: bankStatus,
        testBank: structuredClone(currentBank),
      }
    },
    saveLearningTestBank(nextBank) {
      calls.saveBank += 1
      currentBank = structuredClone(nextBank)
      return { ok: true, status: 'saved' }
    },
  }
  const learningTestAttemptStorage = {
    loadLearningTestAttempts() {
      calls.loadAttempts += 1
      return {
        ok: true,
        status: currentAttemptLog.attempts.length === 0
          ? 'missing'
          : 'found',
        attemptLog: structuredClone(currentAttemptLog),
      }
    },
    appendLearningTestAttempt(attempt) {
      calls.appendAttempt += 1

      if (appendImplementation) {
        return appendImplementation({
          attempt: structuredClone(attempt),
          attemptLog: currentAttemptLog,
          setAttemptLog(nextLog) {
            currentAttemptLog = structuredClone(nextLog)
          },
          callNumber: calls.appendAttempt,
        })
      }

      currentAttemptLog = {
        ...currentAttemptLog,
        attempts: [...currentAttemptLog.attempts, structuredClone(attempt)],
      }

      return {
        ok: true,
        status: 'appended',
        attemptLog: structuredClone(currentAttemptLog),
      }
    },
  }
  const generateLearningTestId = (entityType) => {
    calls.idTypes.push(entityType)
    const queuedId = idQueues[entityType]?.shift()

    if (queuedId instanceof Error) {
      throw queuedId
    }

    if (idImplementation) {
      return idImplementation({
        callNumber: calls.idTypes.length,
        entityType,
        service,
        queuedId,
      })
    }

    if (queuedId !== undefined) {
      return queuedId
    }

    generatedIdCount += 1
    return `${entityType}-generated-${generatedIdCount}`
  }
  let service
  const now = () => {
    calls.now += 1
    const timestamp = timestamps[timestampIndex]
    timestampIndex += 1

    if (nowImplementation) {
      return nowImplementation({
        callNumber: calls.now,
        service,
        timestamp,
      })
    }

    return timestamp
  }
  service = createLearningTestService({
    learningHubService,
    learningTestBankStorage,
    learningTestAttemptStorage,
    generateLearningTestId,
    now,
  })

  return {
    service,
    calls,
    getBank: () => structuredClone(currentBank),
    getAttemptLog: () => structuredClone(currentAttemptLog),
  }
}

function createQuestionInput(overrides = {}) {
  return {
    moduleId: 'module-orbit',
    chapterId: 'chapter-orbit-basics',
    learningNodeId: 'node-orbit-vector',
    prompt: 'Welche erfundene Bahn ist korrekt?',
    difficulty: 'medium',
    options: ['Silberbahn', 'Kupferbahn'],
    correctOptionIndex: 0,
    explanation: 'Die Silberbahn gilt nur im synthetischen Beispiel.',
    ...overrides,
  }
}

test('lädt eine leere oder gefüllte Bank nur nach aktueller Hub- und Referenzprüfung', () => {
  const emptySystem = createServiceSystem()
  const emptyResult = emptySystem.service.loadTestBank()

  assert.deepEqual(emptyResult, {
    ok: true,
    status: 'empty',
    changed: false,
    testBank: createBank(),
  })
  assert.equal(emptySystem.calls.loadHub, 1)
  assert.equal(emptySystem.calls.loadBank, 1)

  const storedQuestion = createQuestion()
  const loadedSystem = createServiceSystem({
    bank: createBank([storedQuestion]),
  })
  const loadedResult = loadedSystem.service.loadTestBank()

  assert.equal(loadedResult.status, 'loaded')
  loadedResult.testBank.questions[0].prompt = 'Nur Rückgabe verändert.'
  assert.equal(loadedSystem.getBank().questions[0].prompt, storedQuestion.prompt)

  const privateMarker = 'private-orphaned-question-sentinel'
  const orphanedSystem = createServiceSystem({
    bank: createBank([
      createQuestion({
        moduleId: 'missing-module',
        prompt: privateMarker,
      }),
    ]),
  })
  const orphanedResult = orphanedSystem.service.loadTestBank()

  assert.equal(orphanedResult.ok, false)
  assert.equal(orphanedResult.status, 'invalidStoredData')
  assert.equal(
    orphanedResult.error.code,
    'orphanedTestQuestionModuleReference'
  )
  assert.equal(JSON.stringify(orphanedResult).includes(privateMarker), false)
})

test('erstellt eine normalisierte Frage an der nächsten freien Geschwisterposition und speichert genau einmal', () => {
  const existingQuestion = createQuestion({ position: 4 })
  const system = createServiceSystem({
    bank: createBank([existingQuestion]),
    idValues: {
      question: ['question-vector-two'],
      option: ['option-vector-silver', 'option-vector-copper'],
    },
    timestamps: [UPDATED_AT],
  })
  const input = createQuestionInput({
    prompt: '  Welche erfundene Bahn ist korrekt?  ',
    options: ['  Silberbahn ', 'Kupferbahn  '],
    explanation: '  Rein synthetische Erklärung.  ',
  })
  const inputSnapshot = structuredClone(input)
  const result = system.service.createQuestion(input)

  assert.equal(result.ok, true)
  assert.equal(result.status, 'questionCreated')
  assert.equal(result.changed, true)
  assert.equal(result.question.id, 'question-vector-two')
  assert.equal(result.question.position, 5)
  assert.equal(result.question.revision, 1)
  assert.equal(result.question.prompt, 'Welche erfundene Bahn ist korrekt?')
  assert.deepEqual(result.question.options, [
    { id: 'option-vector-silver', label: 'Silberbahn', position: 1 },
    { id: 'option-vector-copper', label: 'Kupferbahn', position: 2 },
  ])
  assert.equal(result.question.correctOptionId, 'option-vector-silver')
  assert.equal(result.question.explanation, 'Rein synthetische Erklärung.')
  assert.equal(result.question.createdAt, UPDATED_AT)
  assert.equal(result.question.updatedAt, UPDATED_AT)
  assert.deepEqual(system.calls.idTypes, ['question', 'option', 'option'])
  assert.equal(system.calls.now, 1)
  assert.equal(system.calls.saveBank, 1)
  assert.deepEqual(input, inputSnapshot)

  result.question.options[0].label = 'Nur Ergebnis verändert.'
  assert.equal(system.getBank().questions[1].options[0].label, 'Silberbahn')
})

test('weist ungültige Eingaben und falsche Elternketten vor ID, Uhr und Write zurück', () => {
  const system = createServiceSystem({ bank: createBank([createQuestion()]) })
  const invalidResult = system.service.createQuestion(createQuestionInput({
    prompt: ` ${'x'.repeat(501)} `,
    options: ['gültig', '   '],
    correctOptionIndex: 8,
    explanation: 12,
  }))
  const mismatchResult = system.service.createQuestion(createQuestionInput({
    chapterId: 'chapter-garden-light',
    learningNodeId: 'node-garden-prism',
  }))

  assert.equal(invalidResult.ok, false)
  assert.equal(invalidResult.status, 'validationFailed')
  assert.deepEqual(Object.keys(invalidResult.error.fieldErrors).sort(), [
    'correctOptionIndex',
    'explanation',
    'options',
    'prompt',
  ])
  assert.equal(mismatchResult.ok, false)
  assert.equal(mismatchResult.status, 'ownershipMismatch')
  assert.equal(mismatchResult.error.code, 'chapterModuleMismatch')
  assert.equal(system.calls.idTypes.length, 0)
  assert.equal(system.calls.now, 0)
  assert.equal(system.calls.saveBank, 0)
})

test('begrenzt ID-Kollisionen und Generatorfehler pro benötigter ID auf fünf Versuche', () => {
  const question = createQuestion()
  const system = createServiceSystem({
    bank: createBank([question]),
    idValues: {
      question: [
        new Error('private-generator-sentinel'),
        question.id,
        question.options[0].id,
        ' ',
        question.id,
        'would-not-be-used',
      ],
    },
    timestamps: [UPDATED_AT],
  })
  const result = system.service.createQuestion(createQuestionInput())

  assert.equal(result.ok, false)
  assert.equal(result.status, 'generationFailed')
  assert.equal(result.error.code, 'learningTestQuestionIdGenerationFailed')
  assert.deepEqual(system.calls.idTypes, Array(5).fill('question'))
  assert.equal(system.calls.now, 0)
  assert.equal(system.calls.saveBank, 0)
  assert.equal(JSON.stringify(result).includes('private-generator'), false)
})

test('führt normalisierte unveränderte Updates ohne ID, Uhr oder Schreibzugriff aus', () => {
  const question = createQuestion()
  const system = createServiceSystem({
    bank: createBank([question]),
    timestamps: [UPDATED_AT],
  })
  const input = {
    moduleId: question.moduleId,
    chapterId: question.chapterId,
    learningNodeId: question.learningNodeId,
    questionId: question.id,
    prompt: `  ${question.prompt}  `,
    difficulty: question.difficulty,
    options: question.options.map((option) => ` ${option.label} `),
    correctOptionIndex: 0,
    explanation: ` ${question.explanation} `,
  }
  const result = system.service.updateQuestion(input)

  assert.equal(result.ok, true)
  assert.equal(result.status, 'questionUnchanged')
  assert.equal(result.changed, false)
  assert.deepEqual(result.question, question)
  assert.equal(system.calls.idTypes.length, 0)
  assert.equal(system.calls.now, 0)
  assert.equal(system.calls.saveBank, 0)
})

test('erhält Option-IDs bei identischen Optionen und erhöht die Revision nur bei echter Änderung', () => {
  const question = createQuestion()
  const system = createServiceSystem({
    bank: createBank([question]),
    timestamps: [UPDATED_AT],
  })
  const result = system.service.updateQuestion({
    ...createQuestionInput(),
    moduleId: question.moduleId,
    chapterId: question.chapterId,
    learningNodeId: question.learningNodeId,
    questionId: question.id,
    prompt: 'Geänderter synthetischer Fragetext?',
    difficulty: question.difficulty,
    options: question.options.map((option) => option.label),
    correctOptionIndex: 1,
    explanation: question.explanation,
  })

  assert.equal(result.status, 'questionUpdated')
  assert.equal(result.question.id, question.id)
  assert.equal(result.question.createdAt, question.createdAt)
  assert.equal(result.question.position, question.position)
  assert.equal(result.question.revision, 2)
  assert.equal(result.question.updatedAt, UPDATED_AT)
  assert.deepEqual(result.question.options, question.options)
  assert.equal(result.question.correctOptionId, 'option-vector-south')
  assert.equal(system.calls.idTypes.length, 0)
  assert.equal(system.calls.now, 1)
  assert.equal(system.calls.saveBank, 1)
})

test('ordnet den korrekten Optionsindex bei einem gültigen unsortierten Bestandsarray nach Position zu', () => {
  const question = createQuestion({
    options: [
      { id: 'option-vector-south', label: 'Südbogen', position: 2 },
      { id: 'option-vector-north', label: 'Nordbogen', position: 1 },
    ],
    correctOptionId: 'option-vector-north',
  })
  const system = createServiceSystem({
    bank: createBank([question]),
    timestamps: [UPDATED_AT],
  })
  const result = system.service.updateQuestion({
    ...createQuestionInput(),
    moduleId: question.moduleId,
    chapterId: question.chapterId,
    learningNodeId: question.learningNodeId,
    questionId: question.id,
    prompt: 'Nur der synthetische Fragetext ändert sich.',
    difficulty: question.difficulty,
    options: ['Nordbogen', 'Südbogen'],
    correctOptionIndex: 0,
    explanation: question.explanation,
  })

  assert.equal(result.ok, true)
  assert.equal(result.status, 'questionUpdated')
  assert.equal(result.question.correctOptionId, 'option-vector-north')
  assert.deepEqual(result.question.options, question.options)
  assert.equal(system.calls.idTypes.length, 0)
  assert.equal(system.calls.saveBank, 1)
})

test('erzeugt für geänderte Optionsinhalte ausschließlich neue stabile Option-IDs und verhindert Verschieben', () => {
  const question = createQuestion()
  const system = createServiceSystem({
    bank: createBank([question]),
    idValues: {
      option: ['option-new-one', 'option-new-two', 'option-new-three'],
    },
    timestamps: [UPDATED_AT],
  })
  const updateResult = system.service.updateQuestion({
    ...createQuestionInput(),
    questionId: question.id,
    prompt: question.prompt,
    difficulty: question.difficulty,
    options: ['Neue Alphaoption', 'Neue Betaoption', 'Neue Gammaoption'],
    correctOptionIndex: 2,
    explanation: question.explanation,
  })

  assert.equal(updateResult.ok, true)
  assert.deepEqual(
    updateResult.question.options.map((option) => option.id),
    ['option-new-one', 'option-new-two', 'option-new-three']
  )
  assert.equal(updateResult.question.correctOptionId, 'option-new-three')
  assert.deepEqual(system.calls.idTypes, ['option', 'option', 'option'])

  const moveSystem = createServiceSystem({ bank: createBank([question]) })
  const moveResult = moveSystem.service.updateQuestion({
    ...createQuestionInput(),
    chapterId: 'chapter-orbit-transfer',
    learningNodeId: 'node-orbit-burn',
    questionId: question.id,
  })

  assert.equal(moveResult.ok, false)
  assert.equal(moveResult.status, 'ownershipMismatch')
  assert.equal(moveResult.error.code, 'questionLearningNodeMismatch')
  assert.equal(moveSystem.calls.idTypes.length, 0)
  assert.equal(moveSystem.calls.now, 0)
  assert.equal(moveSystem.calls.saveBank, 0)
})

test('startet deterministisch ohne Storage-Write und blendet Lösung sowie Erklärung aus', () => {
  const laterQuestion = createQuestion({
    id: 'question-vector-later',
    position: 2,
    options: [
      { id: 'option-later-a', label: 'Später A', position: 2 },
      { id: 'option-later-b', label: 'Später B', position: 1 },
    ],
    correctOptionId: 'option-later-b',
    explanation: 'Private Erklärung später.',
  })
  const earlierQuestion = createQuestion({
    id: 'question-vector-earlier',
    position: 1,
    options: [
      { id: 'option-earlier-a', label: 'Früher A', position: 1 },
      { id: 'option-earlier-b', label: 'Früher B', position: 2 },
    ],
    correctOptionId: 'option-earlier-a',
    explanation: 'Private Erklärung früher.',
  })
  const nextNodeQuestion = createQuestion({
    id: 'question-window',
    learningNodeId: 'node-orbit-window',
    position: 1,
    options: [
      { id: 'option-window-a', label: 'Fenster A', position: 1 },
      { id: 'option-window-b', label: 'Fenster B', position: 2 },
    ],
    correctOptionId: 'option-window-a',
    explanation: 'Private Fenstererklärung.',
  })
  const system = createServiceSystem({
    bank: createBank([laterQuestion, nextNodeQuestion, earlierQuestion]),
    idValues: { session: ['session-orbit-one'] },
    timestamps: [STARTED_AT],
  })
  const result = system.service.startModuleTest({ moduleId: 'module-orbit' })

  assert.equal(result.ok, true)
  assert.equal(result.status, 'testStarted')
  assert.equal(result.testSession.id, 'session-orbit-one')
  assert.deepEqual(
    result.testSession.questions.map((question) => question.id),
    ['question-vector-earlier', 'question-vector-later', 'question-window']
  )
  assert.deepEqual(
    result.testSession.questions[1].options.map((option) => option.id),
    ['option-later-b', 'option-later-a']
  )

  for (const question of result.testSession.questions) {
    assert.equal(Object.hasOwn(question, 'correctOptionId'), false)
    assert.equal(Object.hasOwn(question, 'explanation'), false)
    assert.equal(Object.hasOwn(question, 'revision'), false)
  }

  assert.equal(system.calls.saveBank, 0)
  assert.equal(system.calls.appendAttempt, 0)
  assert.deepEqual(system.calls.idTypes, ['session'])
  assert.equal(system.calls.now, 1)
})

test('startet ohne Fragen nicht und konsumiert dabei weder ID noch Zeitstempel', () => {
  const system = createServiceSystem({ bank: createBank() })
  const result = system.service.startModuleTest({ moduleId: 'module-orbit' })

  assert.equal(result.ok, false)
  assert.equal(result.status, 'empty')
  assert.equal(result.error.code, 'moduleTestHasNoQuestions')
  assert.equal(system.calls.idTypes.length, 0)
  assert.equal(system.calls.now, 0)
  assert.equal(system.calls.saveBank, 0)
  assert.equal(system.calls.appendAttempt, 0)
})

test('wertet den eingefrorenen Snapshot exakt aus und hängt genau einen konsistenten Attempt an', () => {
  const questions = [
    createQuestion(),
    createQuestion({
      id: 'question-window-one',
      learningNodeId: 'node-orbit-window',
      options: [
        { id: 'option-window-one', label: 'Eins', position: 1 },
        { id: 'option-window-two', label: 'Zwei', position: 2 },
      ],
      correctOptionId: 'option-window-two',
      explanation: 'Zwei ist im erfundenen Modell korrekt.',
    }),
    createQuestion({
      id: 'question-burn-one',
      chapterId: 'chapter-orbit-transfer',
      learningNodeId: 'node-orbit-burn',
      options: [
        { id: 'option-burn-one', label: 'Impuls Eins', position: 1 },
        { id: 'option-burn-two', label: 'Impuls Zwei', position: 2 },
      ],
      correctOptionId: 'option-burn-one',
      explanation: '',
    }),
  ]
  const system = createServiceSystem({
    bank: createBank(questions),
    idValues: {
      session: ['session-orbit-score'],
      attempt: ['attempt-orbit-score'],
    },
    timestamps: [STARTED_AT, COMPLETED_AT],
  })
  const startResult = system.service.startModuleTest({
    moduleId: 'module-orbit',
  })

  startResult.testSession.questions[0].options[0].id = 'mutated-public-id'
  const answers = [
    {
      questionId: 'question-burn-one',
      selectedOptionId: 'option-burn-one',
    },
    {
      questionId: 'question-vector-one',
      selectedOptionId: 'option-vector-south',
    },
    {
      questionId: 'question-window-one',
      selectedOptionId: 'option-window-two',
    },
  ]
  const inputSnapshot = structuredClone(answers)
  const result = system.service.submitModuleTest({
    testSessionId: 'session-orbit-score',
    answers,
  })

  assert.equal(result.ok, true)
  assert.equal(result.status, 'testCompleted')
  assert.equal(result.result.totalQuestionCount, 3)
  assert.equal(result.result.correctAnswerCount, 2)
  assert.equal(result.result.scorePercent, 67)
  assert.deepEqual(
    result.result.answers.map((answer) => answer.questionId),
    ['question-vector-one', 'question-window-one', 'question-burn-one']
  )
  assert.equal(result.result.feedback[0].correctOptionId, 'option-vector-north')
  assert.equal(
    result.result.feedback[0].explanation,
    questions[0].explanation
  )
  assert.equal(system.calls.appendAttempt, 1)
  assert.equal(system.calls.saveBank, 0)
  assert.deepEqual(system.calls.idTypes, ['session', 'attempt'])
  assert.equal(system.calls.now, 2)
  assert.deepEqual(answers, inputSnapshot)

  const storedAttempt = system.getAttemptLog().attempts[0]
  assert.equal(storedAttempt.id, 'attempt-orbit-score')
  assert.equal(Object.hasOwn(storedAttempt, 'feedback'), false)
  assert.equal(JSON.stringify(storedAttempt).includes('erfundenen Modell'), false)

  result.result.answers[0].selectedOptionId = 'mutated-result'
  assert.equal(
    system.getAttemptLog().attempts[0].answers[0].selectedOptionId,
    'option-vector-south'
  )
})

test('bewertet nach einer Bankrevision ausschließlich den beim Start eingefrorenen Fragensnapshot', () => {
  const originalQuestion = createQuestion()
  const system = createServiceSystem({
    bank: createBank([originalQuestion]),
    idValues: {
      session: ['session-frozen-bank'],
      option: ['option-revision-two-a', 'option-revision-two-b'],
      attempt: ['attempt-frozen-bank'],
    },
    timestamps: [STARTED_AT, UPDATED_AT, COMPLETED_AT],
  })
  const startResult = system.service.startModuleTest({
    moduleId: 'module-orbit',
  })
  const updateResult = system.service.updateQuestion({
    ...createQuestionInput(),
    questionId: originalQuestion.id,
    prompt: 'Welche neue synthetische Richtung gilt?',
    difficulty: originalQuestion.difficulty,
    options: ['Revision Zwei A', 'Revision Zwei B'],
    correctOptionIndex: 1,
    explanation: 'Nur die neue Revision verwendet diese Erklärung.',
  })
  const result = system.service.submitModuleTest({
    testSessionId: startResult.testSession.id,
    answers: [
      {
        questionId: originalQuestion.id,
        selectedOptionId: originalQuestion.correctOptionId,
      },
    ],
  })

  assert.equal(updateResult.question.revision, 2)
  assert.equal(updateResult.question.correctOptionId, 'option-revision-two-b')
  assert.equal(result.ok, true)
  assert.equal(result.result.correctAnswerCount, 1)
  assert.equal(result.result.scorePercent, 100)
  assert.equal(result.result.answers[0].questionRevision, 1)
  assert.equal(
    result.result.answers[0].correctOptionId,
    originalQuestion.correctOptionId
  )
  assert.equal(system.getBank().questions[0].revision, 2)
})

test('weist fehlende, doppelte, zusätzliche und unbekannte Antworten ohne Attempt-Mutation zurück', () => {
  const secondQuestion = createQuestion({
    id: 'question-window-one',
    learningNodeId: 'node-orbit-window',
    options: [
      { id: 'option-window-one', label: 'Eins', position: 1 },
      { id: 'option-window-two', label: 'Zwei', position: 2 },
    ],
    correctOptionId: 'option-window-two',
  })
  const malformedAnswers = [
    [
      {
        questionId: 'question-vector-one',
        selectedOptionId: 'option-vector-north',
      },
    ],
    [
      {
        questionId: 'question-vector-one',
        selectedOptionId: 'option-vector-north',
      },
      {
        questionId: 'question-vector-one',
        selectedOptionId: 'option-vector-south',
      },
    ],
    [
      {
        questionId: 'question-vector-one',
        selectedOptionId: 'option-vector-north',
      },
      {
        questionId: 'question-window-one',
        selectedOptionId: 'option-window-two',
      },
      {
        questionId: 'unknown-question',
        selectedOptionId: 'unknown-option',
      },
    ],
    [
      {
        questionId: 'question-vector-one',
        selectedOptionId: 'unknown-option',
      },
      {
        questionId: 'question-window-one',
        selectedOptionId: 'option-window-two',
      },
    ],
    [
      {
        questionId: 'question-vector-one',
        selectedOptionId: 'option-vector-north',
        correctOptionId: 'option-vector-north',
      },
      {
        questionId: 'question-window-one',
        selectedOptionId: 'option-window-two',
      },
    ],
  ]

  for (const [index, answers] of malformedAnswers.entries()) {
    const sessionId = `session-malformed-${index}`
    const system = createServiceSystem({
      bank: createBank([createQuestion(), secondQuestion]),
      idValues: { session: [sessionId] },
      timestamps: [STARTED_AT],
    })

    system.service.startModuleTest({ moduleId: 'module-orbit' })
    const result = system.service.submitModuleTest({
      testSessionId: sessionId,
      answers,
    })

    assert.equal(result.ok, false)
    assert.equal(result.status, 'validationFailed')
    assert.equal(result.error.code, 'invalidLearningTestAnswers')
    assert.equal(system.calls.loadAttempts, 0)
    assert.equal(system.calls.appendAttempt, 0)
    assert.deepEqual(system.calls.idTypes, ['session'])
    assert.equal(system.calls.now, 1)
  }
})

test('verhindert Doppelsubmission und einen zweiten Attempt', () => {
  const system = createServiceSystem({
    bank: createBank([createQuestion()]),
    idValues: {
      session: ['session-single'],
      attempt: ['attempt-single'],
    },
    timestamps: [STARTED_AT, COMPLETED_AT],
  })
  system.service.startModuleTest({ moduleId: 'module-orbit' })
  const submission = {
    testSessionId: 'session-single',
    answers: [
      {
        questionId: 'question-vector-one',
        selectedOptionId: 'option-vector-north',
      },
    ],
  }
  const firstResult = system.service.submitModuleTest(submission)
  const secondResult = system.service.submitModuleTest(submission)

  assert.equal(firstResult.status, 'testCompleted')
  assert.equal(secondResult.ok, false)
  assert.equal(secondResult.status, 'notFound')
  assert.equal(secondResult.error.code, 'testSessionNotFound')
  assert.equal(system.calls.appendAttempt, 1)
  assert.equal(system.getAttemptLog().attempts.length, 1)
  assert.deepEqual(system.calls.idTypes, ['session', 'attempt'])
  assert.equal(system.calls.now, 2)
})

test('vergibt eine Session-ID während der Lebensdauer des Service nie erneut', () => {
  const system = createServiceSystem({
    bank: createBank([createQuestion()]),
    idValues: {
      session: [
        'session-lifetime',
        'session-lifetime',
        'session-lifetime-fresh',
      ],
      attempt: ['attempt-lifetime'],
    },
    timestamps: [
      STARTED_AT,
      COMPLETED_AT,
      '2026-07-19T11:00:00.000Z',
    ],
  })
  const firstStart = system.service.startModuleTest({
    moduleId: 'module-orbit',
  })
  system.service.submitModuleTest({
    testSessionId: firstStart.testSession.id,
    answers: [
      {
        questionId: 'question-vector-one',
        selectedOptionId: 'option-vector-north',
      },
    ],
  })
  const secondStart = system.service.startModuleTest({
    moduleId: 'module-orbit',
  })

  assert.equal(firstStart.testSession.id, 'session-lifetime')
  assert.equal(secondStart.testSession.id, 'session-lifetime-fresh')
  assert.deepEqual(system.calls.idTypes, [
    'session',
    'attempt',
    'session',
    'session',
  ])
})

test('reserviert eine reentrant erzeugte und abgebrochene Session-ID noch im ID-Generator', { timeout: 2_000 }, () => {
  let didReenter = false
  let reentrantStart
  let reentrantCancellation
  const system = createServiceSystem({
    bank: createBank([createQuestion()]),
    idValues: {
      session: [
        'session-generator-shared',
        'session-generator-shared',
        'session-after-generator-reentry',
      ],
    },
    timestamps: [STARTED_AT, UPDATED_AT],
    idImplementation({
      callNumber,
      entityType,
      service,
      queuedId,
    }) {
      if (
        !didReenter &&
        entityType === 'session' &&
        callNumber === 1
      ) {
        didReenter = true
        reentrantStart = service.startModuleTest({
          moduleId: 'module-orbit',
        })
        reentrantCancellation = service.cancelModuleTest({
          testSessionId: reentrantStart.testSession.id,
        })
      }

      return queuedId
    },
  })
  const outerStart = system.service.startModuleTest({
    moduleId: 'module-orbit',
  })

  assert.equal(reentrantStart.testSession.id, 'session-generator-shared')
  assert.deepEqual(reentrantCancellation, {
    ok: true,
    status: 'testCancelled',
    changed: true,
  })
  assert.equal(
    outerStart.testSession.id,
    'session-after-generator-reentry'
  )
  assert.deepEqual(system.calls.idTypes, [
    'session',
    'session',
    'session',
  ])
  assert.equal(system.calls.now, 2)
  assert.equal(didReenter, true)
})

test('reserviert eine akzeptierte Session-ID vor reentrantem now und erneutem Abbruch', { timeout: 2_000 }, () => {
  let didReenter = false
  let reentrantStart
  let reentrantCancellation
  const system = createServiceSystem({
    bank: createBank([createQuestion()]),
    idValues: {
      session: [
        'session-now-shared',
        'session-now-shared',
        'session-after-now-reentry',
      ],
    },
    timestamps: [STARTED_AT, UPDATED_AT],
    nowImplementation({ callNumber, service, timestamp }) {
      if (!didReenter && callNumber === 1) {
        didReenter = true
        reentrantStart = service.startModuleTest({
          moduleId: 'module-orbit',
        })
        reentrantCancellation = service.cancelModuleTest({
          testSessionId: reentrantStart.testSession.id,
        })
      }

      return timestamp
    },
  })
  const outerStart = system.service.startModuleTest({
    moduleId: 'module-orbit',
  })

  assert.equal(outerStart.testSession.id, 'session-now-shared')
  assert.equal(
    reentrantStart.testSession.id,
    'session-after-now-reentry'
  )
  assert.deepEqual(reentrantCancellation, {
    ok: true,
    status: 'testCancelled',
    changed: true,
  })
  assert.deepEqual(system.calls.idTypes, [
    'session',
    'session',
    'session',
  ])
  assert.equal(system.calls.now, 2)
  assert.equal(didReenter, true)
})

test('behält eine vor fehlerhaftem now reservierte Session-ID lebenslang gesperrt', () => {
  const system = createServiceSystem({
    bank: createBank([createQuestion()]),
    idValues: {
      session: [
        'session-before-invalid-now',
        'session-before-invalid-now',
        'session-after-invalid-now',
      ],
    },
    timestamps: ['invalid-private-timestamp', STARTED_AT],
  })
  const failedStart = system.service.startModuleTest({
    moduleId: 'module-orbit',
  })
  const successfulStart = system.service.startModuleTest({
    moduleId: 'module-orbit',
  })

  assert.equal(failedStart.ok, false)
  assert.equal(failedStart.status, 'generationFailed')
  assert.equal(failedStart.error.code, 'invalidLearningTestTimestamp')
  assert.equal(
    successfulStart.testSession.id,
    'session-after-invalid-now'
  )
  assert.deepEqual(system.calls.idTypes, [
    'session',
    'session',
    'session',
  ])
  assert.equal(system.calls.now, 2)
})

test('bricht eine sichere Session ohne weitere Seiteneffekte ab und vergibt ihre ID nie erneut', () => {
  const system = createServiceSystem({
    bank: createBank([createQuestion()]),
    idValues: {
      session: [
        'session-cancelled',
        'session-cancelled',
        'session-after-cancel',
      ],
    },
    timestamps: [STARTED_AT, UPDATED_AT],
  })
  const firstStart = system.service.startModuleTest({
    moduleId: 'module-orbit',
  })
  const cancellationInput = Object.create(null)
  let testSessionIdReads = 0

  Object.defineProperty(cancellationInput, 'testSessionId', {
    enumerable: true,
    get() {
      testSessionIdReads += 1
      return testSessionIdReads === 1
        ? firstStart.testSession.id
        : 'private-changing-session-sentinel'
    },
  })

  const callsBeforeCancellation = structuredClone(system.calls)
  const result = system.service.cancelModuleTest(cancellationInput)

  assert.deepEqual(result, {
    ok: true,
    status: 'testCancelled',
    changed: true,
  })
  assert.equal(testSessionIdReads, 1)
  assert.deepEqual(system.calls, callsBeforeCancellation)
  assert.equal(system.calls.loadAttempts, 0)
  assert.equal(system.calls.saveBank, 0)
  assert.equal(system.calls.appendAttempt, 0)
  assert.equal(system.getAttemptLog().attempts.length, 0)

  const repeatedCancellation = system.service.cancelModuleTest({
    testSessionId: firstStart.testSession.id,
  })

  assert.equal(repeatedCancellation.ok, false)
  assert.equal(repeatedCancellation.status, 'notFound')
  assert.equal(repeatedCancellation.changed, false)
  assert.equal(
    repeatedCancellation.error.code,
    'testSessionNotFound'
  )
  assert.deepEqual(system.calls, callsBeforeCancellation)

  const secondStart = system.service.startModuleTest({
    moduleId: 'module-orbit',
  })

  assert.equal(secondStart.testSession.id, 'session-after-cancel')
  assert.deepEqual(system.calls.idTypes, [
    'session',
    'session',
    'session',
  ])
  assert.equal(system.calls.now, 2)
})

test('meldet eine unbekannte Session redigiert ohne Dependency-Lesen', () => {
  const privateMarker = 'private-unknown-session-sentinel'
  const system = createServiceSystem({
    bank: createBank([createQuestion()]),
  })
  const callsBeforeCancellation = structuredClone(system.calls)
  const result = system.service.cancelModuleTest({
    testSessionId: privateMarker,
  })

  assert.equal(result.ok, false)
  assert.equal(result.status, 'notFound')
  assert.equal(result.changed, false)
  assert.equal(result.error.code, 'testSessionNotFound')
  assert.equal(JSON.stringify(result).includes(privateMarker), false)
  assert.deepEqual(system.calls, callsBeforeCancellation)
})

test('bricht nach einem Fehler vor der vorbereiteten Submission kontrolliert ab', () => {
  const system = createServiceSystem({
    bank: createBank([createQuestion()]),
    idValues: { session: ['session-preparation-failed'] },
    timestamps: [STARTED_AT],
  })
  const session = system.service.startModuleTest({
    moduleId: 'module-orbit',
  })
  const failedSubmission = system.service.submitModuleTest({
    testSessionId: session.testSession.id,
    answers: [
      {
        questionId: 'question-vector-one',
        selectedOptionId: 'unknown-option',
      },
    ],
  })
  const callsBeforeCancellation = structuredClone(system.calls)
  const cancellation = system.service.cancelModuleTest({
    testSessionId: session.testSession.id,
  })

  assert.equal(failedSubmission.ok, false)
  assert.equal(failedSubmission.status, 'validationFailed')
  assert.equal(
    failedSubmission.error.code,
    'invalidLearningTestAnswers'
  )
  assert.deepEqual(cancellation, {
    ok: true,
    status: 'testCancelled',
    changed: true,
  })
  assert.deepEqual(system.calls, callsBeforeCancellation)
  assert.equal(system.calls.loadAttempts, 0)
  assert.equal(system.calls.appendAttempt, 0)
  assert.equal(system.getAttemptLog().attempts.length, 0)
})

test('behält eine Session bei Write-Fehler und verwendet beim Retry denselben vorbereiteten Attempt', () => {
  const appendedIds = []
  const privateDependencyMessage = 'private-attempt-write-sentinel'
  const system = createServiceSystem({
    bank: createBank([createQuestion()]),
    idValues: {
      session: ['session-retry'],
      attempt: ['attempt-retry'],
    },
    timestamps: [STARTED_AT, COMPLETED_AT],
    appendImplementation({ attempt, attemptLog, setAttemptLog, callNumber }) {
      appendedIds.push(attempt.id)

      if (callNumber === 1) {
        return {
          ok: false,
          status: 'writeFailed',
          error: {
            code: 'storageWriteFailed',
            message: privateDependencyMessage,
          },
        }
      }

      const nextLog = {
        ...attemptLog,
        attempts: [...attemptLog.attempts, attempt],
      }
      setAttemptLog(nextLog)
      return { ok: true, status: 'appended', attemptLog: nextLog }
    },
  })
  system.service.startModuleTest({ moduleId: 'module-orbit' })
  const submission = {
    testSessionId: 'session-retry',
    answers: [
      {
        questionId: 'question-vector-one',
        selectedOptionId: 'option-vector-north',
      },
    ],
  }
  const firstResult = system.service.submitModuleTest(submission)
  const retryResult = system.service.submitModuleTest(submission)

  assert.equal(firstResult.ok, false)
  assert.equal(firstResult.status, 'writeFailed')
  assert.equal(JSON.stringify(firstResult).includes(privateDependencyMessage), false)
  assert.equal(retryResult.ok, true)
  assert.equal(retryResult.status, 'testCompleted')
  assert.deepEqual(appendedIds, ['attempt-retry', 'attempt-retry'])
  assert.deepEqual(system.calls.idTypes, ['session', 'attempt'])
  assert.equal(system.calls.now, 2)
  assert.equal(system.getAttemptLog().attempts.length, 1)
})

test('lehnt den Abbruch während einer laufenden Submission ohne Sessionmutation ab', () => {
  let cancellationResult
  const system = createServiceSystem({
    bank: createBank([createQuestion()]),
    idValues: {
      session: ['session-cancel-in-progress'],
      attempt: ['attempt-cancel-in-progress'],
    },
    timestamps: [STARTED_AT, COMPLETED_AT],
    nowImplementation({ callNumber, service, timestamp }) {
      if (callNumber === 2) {
        cancellationResult = service.cancelModuleTest({
          testSessionId: 'session-cancel-in-progress',
        })
      }

      return timestamp
    },
  })
  const session = system.service.startModuleTest({
    moduleId: 'module-orbit',
  })
  const completedResult = system.service.submitModuleTest({
    testSessionId: session.testSession.id,
    answers: [
      {
        questionId: 'question-vector-one',
        selectedOptionId: 'option-vector-north',
      },
    ],
  })

  assert.equal(cancellationResult.ok, false)
  assert.equal(cancellationResult.status, 'conflict')
  assert.equal(cancellationResult.changed, false)
  assert.equal(
    cancellationResult.error.code,
    'learningTestSubmissionInProgress'
  )
  assert.equal(completedResult.status, 'testCompleted')
  assert.equal(system.calls.appendAttempt, 1)
  assert.equal(system.getAttemptLog().attempts.length, 1)
})

test('hält eine möglicherweise persistierte pendingSubmission trotz Abbruchversuch retrybar', () => {
  const privateMarker = 'private-pending-session-sentinel'
  const system = createServiceSystem({
    bank: createBank([createQuestion()]),
    idValues: {
      session: ['session-pending-cancel'],
      attempt: ['attempt-pending-cancel'],
    },
    timestamps: [STARTED_AT, COMPLETED_AT],
    appendImplementation({ attempt, attemptLog, setAttemptLog }) {
      const nextLog = {
        ...attemptLog,
        attempts: [...attemptLog.attempts, attempt],
      }

      setAttemptLog(nextLog)
      return { ok: true, status: 'unexpected', privateMarker }
    },
  })
  const session = system.service.startModuleTest({
    moduleId: 'module-orbit',
  })
  const submission = {
    testSessionId: session.testSession.id,
    answers: [
      {
        questionId: 'question-vector-one',
        selectedOptionId: 'option-vector-north',
      },
    ],
  }
  const ambiguousResult = system.service.submitModuleTest(submission)
  const callsBeforeCancellation = structuredClone(system.calls)
  const cancellationResult = system.service.cancelModuleTest({
    testSessionId: session.testSession.id,
  })

  assert.equal(ambiguousResult.ok, false)
  assert.equal(ambiguousResult.status, 'storageFailed')
  assert.equal(cancellationResult.ok, false)
  assert.equal(cancellationResult.status, 'conflict')
  assert.equal(cancellationResult.changed, false)
  assert.equal(
    cancellationResult.error.code,
    'learningTestPendingSubmission'
  )
  assert.equal(
    JSON.stringify(cancellationResult).includes(privateMarker),
    false
  )
  assert.equal(
    JSON.stringify(cancellationResult).includes(session.testSession.id),
    false
  )
  assert.deepEqual(system.calls, callsBeforeCancellation)

  const retryResult = system.service.submitModuleTest(submission)

  assert.equal(retryResult.status, 'testCompleted')
  assert.equal(retryResult.result.attemptId, 'attempt-pending-cancel')
  assert.equal(system.calls.appendAttempt, 1)
  assert.equal(system.getAttemptLog().attempts.length, 1)
  assert.deepEqual(system.calls.idTypes, ['session', 'attempt'])
  assert.equal(system.calls.now, 2)
})

test('reserviert eine pending Attempt-ID gegenüber parallelen Sessions bis zum erfolgreichen Retry', () => {
  const system = createServiceSystem({
    bank: createBank([createQuestion()]),
    idValues: {
      session: ['session-pending-a', 'session-pending-b'],
      attempt: [
        'attempt-shared-pending',
        'attempt-shared-pending',
        'attempt-pending-b',
      ],
    },
    timestamps: [
      STARTED_AT,
      STARTED_AT,
      COMPLETED_AT,
      COMPLETED_AT,
    ],
    appendImplementation({ attempt, attemptLog, setAttemptLog, callNumber }) {
      if (callNumber === 1) {
        return {
          ok: false,
          status: 'writeFailed',
          error: {
            code: 'storageWriteFailed',
            message: 'Synthetischer Write-Fehler.',
          },
        }
      }

      const nextLog = {
        ...attemptLog,
        attempts: [...attemptLog.attempts, attempt],
      }
      setAttemptLog(nextLog)
      return { ok: true, status: 'appended', attemptLog: nextLog }
    },
  })
  const sessionA = system.service.startModuleTest({
    moduleId: 'module-orbit',
  })
  const sessionB = system.service.startModuleTest({
    moduleId: 'module-orbit',
  })
  const createSubmission = (testSessionId) => ({
    testSessionId,
    answers: [
      {
        questionId: 'question-vector-one',
        selectedOptionId: 'option-vector-north',
      },
    ],
  })
  const failedA = system.service.submitModuleTest(
    createSubmission(sessionA.testSession.id)
  )
  const completedB = system.service.submitModuleTest(
    createSubmission(sessionB.testSession.id)
  )
  const retriedA = system.service.submitModuleTest(
    createSubmission(sessionA.testSession.id)
  )

  assert.equal(failedA.ok, false)
  assert.equal(completedB.ok, true)
  assert.equal(completedB.result.attemptId, 'attempt-pending-b')
  assert.equal(retriedA.ok, true)
  assert.equal(retriedA.result.attemptId, 'attempt-shared-pending')
  assert.deepEqual(
    system.getAttemptLog().attempts.map((attempt) => attempt.id),
    ['attempt-pending-b', 'attempt-shared-pending']
  )
  assert.equal(system.calls.appendAttempt, 3)
})

test('reconciliert einen trotz unbrauchbarer Rückgabe persistierten Attempt genau einmal und beendet die Session', () => {
  const system = createServiceSystem({
    bank: createBank([createQuestion()]),
    idValues: {
      session: ['session-ambiguous'],
      attempt: ['attempt-ambiguous'],
    },
    timestamps: [STARTED_AT, COMPLETED_AT],
    appendImplementation({ attempt, attemptLog, setAttemptLog }) {
      const nextLog = {
        ...attemptLog,
        attempts: [...attemptLog.attempts, attempt],
      }
      setAttemptLog(nextLog)
      return { ok: true, status: 'unexpected' }
    },
  })
  system.service.startModuleTest({ moduleId: 'module-orbit' })
  const submission = {
    testSessionId: 'session-ambiguous',
    answers: [
      {
        questionId: 'question-vector-one',
        selectedOptionId: 'option-vector-north',
      },
    ],
  }
  const ambiguousResult = system.service.submitModuleTest(submission)
  const conflictingResult = system.service.submitModuleTest({
    ...submission,
    answers: [
      {
        questionId: 'question-vector-one',
        selectedOptionId: 'option-vector-south',
      },
    ],
  })
  const recoveredResult = system.service.submitModuleTest(submission)
  const submissionAfterReconciliation = system.service.submitModuleTest(
    submission
  )
  const cancellationAfterReconciliation = system.service.cancelModuleTest({
    testSessionId: submission.testSessionId,
  })

  assert.equal(ambiguousResult.ok, false)
  assert.equal(ambiguousResult.status, 'storageFailed')
  assert.equal(conflictingResult.ok, false)
  assert.equal(conflictingResult.status, 'conflict')
  assert.equal(
    conflictingResult.error.code,
    'learningTestSubmissionConflict'
  )
  assert.equal(recoveredResult.ok, true)
  assert.equal(recoveredResult.status, 'testCompleted')
  assert.equal(submissionAfterReconciliation.ok, false)
  assert.equal(submissionAfterReconciliation.status, 'notFound')
  assert.equal(
    submissionAfterReconciliation.error.code,
    'testSessionNotFound'
  )
  assert.equal(cancellationAfterReconciliation.ok, false)
  assert.equal(cancellationAfterReconciliation.status, 'notFound')
  assert.equal(
    cancellationAfterReconciliation.error.code,
    'testSessionNotFound'
  )
  assert.equal(system.calls.appendAttempt, 1)
  assert.equal(system.getAttemptLog().attempts.length, 1)
})

test('filtert die Historie nur nach Modul und bewahrt die Append-Reihenfolge defensiv ohne Texte', () => {
  const question = createQuestion()
  const gardenQuestion = createQuestion({
    id: 'question-garden-one',
    moduleId: 'module-garden',
    chapterId: 'chapter-garden-light',
    learningNodeId: 'node-garden-prism',
    options: [
      { id: 'option-garden-one', label: 'Prisma Eins', position: 1 },
      { id: 'option-garden-two', label: 'Prisma Zwei', position: 2 },
    ],
    correctOptionId: 'option-garden-one',
  })
  const firstAttempt = createAttempt({
    id: 'attempt-orbit-first',
    startedAt: '2026-07-19T12:00:00.000Z',
    completedAt: '2026-07-19T12:05:00.000Z',
  })
  const gardenAttempt = createAttempt({
    id: 'attempt-garden',
    moduleId: 'module-garden',
    answers: [
      {
        questionId: 'question-garden-one',
        questionRevision: 1,
        learningNodeId: 'node-garden-prism',
        selectedOptionId: 'option-garden-one',
        correctOptionId: 'option-garden-one',
        isCorrect: true,
      },
    ],
  })
  const secondAttempt = createAttempt({
    id: 'attempt-orbit-second',
    startedAt: '2026-07-19T08:00:00.000Z',
    completedAt: '2026-07-19T08:05:00.000Z',
  })
  const system = createServiceSystem({
    bank: createBank([question, gardenQuestion]),
    attemptLog: createAttemptLog([
      firstAttempt,
      gardenAttempt,
      secondAttempt,
    ]),
  })
  const result = system.service.loadAttemptHistory({
    moduleId: 'module-orbit',
  })

  assert.equal(result.ok, true)
  assert.equal(result.status, 'attemptHistoryLoaded')
  assert.deepEqual(
    result.attempts.map((attempt) => attempt.attemptId),
    ['attempt-orbit-first', 'attempt-orbit-second']
  )
  assert.equal(JSON.stringify(result).includes(question.prompt), false)
  assert.equal(JSON.stringify(result).includes(question.explanation), false)
  assert.equal(JSON.stringify(result).includes('Fiktive Vektoren'), false)

  result.attempts[0].answers[0].questionId = 'mutated-history-result'
  assert.equal(
    system.getAttemptLog().attempts[0].answers[0].questionId,
    'question-vector-one'
  )

  const emptyResult = system.service.loadAttemptHistory({
    moduleId: 'module-garden',
  })
  assert.equal(emptyResult.status, 'attemptHistoryLoaded')
})

test('weist verwaiste Attempt-Referenzen und ungefilterte Dependency-Meldungen kontrolliert zurück', () => {
  const privateMarker = 'private-dependency-message-sentinel'
  const invalidAttempt = createAttempt({
    answers: [
      {
        ...createAttempt().answers[0],
        learningNodeId: 'missing-learning-node',
      },
    ],
  })
  const referenceSystem = createServiceSystem({
    bank: createBank([createQuestion()]),
    attemptLog: createAttemptLog([invalidAttempt]),
  })
  const referenceResult = referenceSystem.service.loadAttemptHistory({
    moduleId: 'module-orbit',
  })

  assert.equal(referenceResult.ok, false)
  assert.equal(referenceResult.status, 'invalidStoredData')
  assert.equal(
    referenceResult.error.code,
    'orphanedTestAttemptLearningNodeReference'
  )

  const service = createLearningTestService({
    learningHubService: {
      loadHub() {
        return { ok: true, status: 'loaded', hub: createHub() }
      },
    },
    learningTestBankStorage: {
      loadLearningTestBank() {
        return {
          ok: false,
          status: 'readFailed',
          error: {
            code: 'storageReadFailed',
            message: privateMarker,
          },
        }
      },
    },
  })
  const dependencyResult = service.loadTestBank()

  assert.equal(dependencyResult.ok, false)
  assert.equal(dependencyResult.status, 'readFailed')
  assert.equal(dependencyResult.error.code, 'storageReadFailed')
  assert.equal(JSON.stringify(dependencyResult).includes(privateMarker), false)
})

test('liefert für ein Modul ohne Attempts einen eindeutigen leeren Historienstatus', () => {
  const system = createServiceSystem({
    bank: createBank([createQuestion()]),
    attemptLog: createAttemptLog(),
  })
  const result = system.service.loadAttemptHistory({
    moduleId: 'module-orbit',
  })

  assert.deepEqual(result, {
    ok: true,
    status: 'attemptHistoryEmpty',
    changed: false,
    attempts: [],
  })
})

test('weist eine manipulierte Attempt-Antwortfolge außerhalb der autoritativen Testreihenfolge zurück', () => {
  const secondQuestion = createQuestion({
    id: 'question-window-order',
    learningNodeId: 'node-orbit-window',
    options: [
      { id: 'option-window-order-a', label: 'Fenster A', position: 1 },
      { id: 'option-window-order-b', label: 'Fenster B', position: 2 },
    ],
    correctOptionId: 'option-window-order-a',
  })
  const reorderedAttempt = createAttempt({
    totalQuestionCount: 2,
    correctAnswerCount: 2,
    scorePercent: 100,
    answers: [
      {
        questionId: 'question-window-order',
        questionRevision: 1,
        learningNodeId: 'node-orbit-window',
        selectedOptionId: 'option-window-order-a',
        correctOptionId: 'option-window-order-a',
        isCorrect: true,
      },
      createAttempt().answers[0],
    ],
  })
  const system = createServiceSystem({
    bank: createBank([createQuestion(), secondQuestion]),
    attemptLog: createAttemptLog([reorderedAttempt]),
  })
  const result = system.service.loadAttemptHistory({
    moduleId: 'module-orbit',
  })

  assert.equal(result.ok, false)
  assert.equal(result.status, 'invalidStoredData')
  assert.equal(result.error.code, 'testAttemptQuestionOrderMismatch')
})

test('weist unsichere Eingaben aller sechs Schreib- und Leseoperationen vor jeder Dependency redigiert zurück', () => {
  const privateMarker = 'private-input-getter-sentinel'
  const createSystem = createServiceSystem()
  const createInput = createQuestionInput()

  Object.defineProperty(createInput, 'prompt', {
    enumerable: true,
    get() {
      throw new Error(privateMarker)
    },
  })

  const createResult = createSystem.service.createQuestion(createInput)
  class CustomOptions extends Array {}
  const customArraySystem = createServiceSystem()
  const customArrayResult = customArraySystem.service.createQuestion(
    createQuestionInput({
      options: new CustomOptions('Erste Option', 'Zweite Option'),
    })
  )
  const updateSystem = createServiceSystem({
    bank: createBank([createQuestion()]),
  })
  const updateProxy = Proxy.revocable(
    createQuestionInput({ questionId: 'question-vector-one' }),
    {}
  )

  updateProxy.revoke()
  const updateResult = updateSystem.service.updateQuestion(updateProxy.proxy)
  const startSystem = createServiceSystem({
    bank: createBank([createQuestion()]),
  })
  const startInput = {}

  Object.defineProperty(startInput, 'moduleId', {
    enumerable: true,
    get() {
      throw new Error(privateMarker)
    },
  })

  const startResult = startSystem.service.startModuleTest(startInput)
  const historySystem = createServiceSystem({
    bank: createBank([createQuestion()]),
  })
  const historyProxy = Proxy.revocable({ moduleId: 'module-orbit' }, {})

  historyProxy.revoke()
  const historyResult = historySystem.service.loadAttemptHistory(
    historyProxy.proxy
  )
  const cancelSystem = createServiceSystem({
    bank: createBank([createQuestion()]),
  })
  const cancelInput = {}

  Object.defineProperty(cancelInput, 'testSessionId', {
    enumerable: true,
    get() {
      throw new Error(privateMarker)
    },
  })

  const cancelResult = cancelSystem.service.cancelModuleTest(cancelInput)

  for (const [result, system] of [
    [createResult, createSystem],
    [customArrayResult, customArraySystem],
    [updateResult, updateSystem],
    [startResult, startSystem],
    [historyResult, historySystem],
    [cancelResult, cancelSystem],
  ]) {
    assert.equal(result.ok, false)
    assert.equal(result.status, 'validationFailed')
    assert.equal(JSON.stringify(result).includes(privateMarker), false)
    assert.equal(system.calls.loadHub, 0)
    assert.equal(system.calls.loadBank, 0)
    assert.equal(system.calls.loadAttempts, 0)
    assert.equal(system.calls.saveBank, 0)
    assert.equal(system.calls.appendAttempt, 0)
    assert.deepEqual(system.calls.idTypes, [])
    assert.equal(system.calls.now, 0)
  }

  const submitSystem = createServiceSystem({
    bank: createBank([createQuestion()]),
    idValues: {
      session: ['session-unsafe-answers'],
      attempt: ['attempt-after-unsafe-answers'],
    },
    timestamps: [STARTED_AT, COMPLETED_AT],
  })
  submitSystem.service.startModuleTest({ moduleId: 'module-orbit' })
  const baselineCalls = structuredClone(submitSystem.calls)
  const unsafeSubmission = { testSessionId: 'session-unsafe-answers' }

  Object.defineProperty(unsafeSubmission, 'answers', {
    enumerable: true,
    get() {
      throw new Error(privateMarker)
    },
  })

  const unsafeSubmitResult = submitSystem.service.submitModuleTest(
    unsafeSubmission
  )

  assert.equal(unsafeSubmitResult.ok, false)
  assert.equal(unsafeSubmitResult.status, 'validationFailed')
  assert.equal(
    JSON.stringify(unsafeSubmitResult).includes(privateMarker),
    false
  )
  assert.deepEqual(submitSystem.calls, baselineCalls)

  class CustomAnswers extends Array {}
  const customAnswersResult = submitSystem.service.submitModuleTest({
    testSessionId: 'session-unsafe-answers',
    answers: new CustomAnswers({
      questionId: 'question-vector-one',
      selectedOptionId: 'option-vector-north',
    }),
  })

  assert.equal(customAnswersResult.status, 'validationFailed')
  assert.deepEqual(submitSystem.calls, baselineCalls)

  const completedResult = submitSystem.service.submitModuleTest({
    testSessionId: 'session-unsafe-answers',
    answers: [
      {
        questionId: 'question-vector-one',
        selectedOptionId: 'option-vector-north',
      },
    ],
  })

  assert.equal(completedResult.status, 'testCompleted')
  assert.equal(submitSystem.calls.appendAttempt, 1)
  assert.deepEqual(
    submitSystem.calls.idTypes,
    ['session', 'attempt']
  )
})

test('bindet wechselnde Fragenfelder und Optionswerte an genau einen sicheren Snapshot', () => {
  const createSystem = createServiceSystem({
    idValues: {
      question: ['question-snapshot'],
      option: ['option-snapshot-a', 'option-snapshot-b'],
    },
    timestamps: [UPDATED_AT],
  })
  const createInput = createQuestionInput()
  const options = ['Silberbahn', 'Kupferbahn']
  let firstOptionReads = 0

  Object.defineProperty(options, '0', {
    configurable: true,
    enumerable: true,
    get() {
      firstOptionReads += 1
      return firstOptionReads === 1 ? 'Silberbahn' : 'Wechselwert'
    },
  })
  createInput.options = options

  const createResult = createSystem.service.createQuestion(createInput)

  assert.equal(createResult.status, 'questionCreated')
  assert.equal(createResult.question.options[0].label, 'Silberbahn')
  assert.equal(firstOptionReads, 1)

  const question = createQuestion()
  const updateSystem = createServiceSystem({
    bank: createBank([question]),
    timestamps: [UPDATED_AT],
  })
  const updateInput = {
    ...createQuestionInput(),
    questionId: question.id,
    prompt: 'Snapshot-Frage mit geänderter Auswahl?',
    difficulty: question.difficulty,
    options: question.options.map((option) => option.label),
    explanation: question.explanation,
  }
  let correctOptionIndexReads = 0

  Object.defineProperty(updateInput, 'correctOptionIndex', {
    configurable: true,
    enumerable: true,
    get() {
      correctOptionIndexReads += 1
      return correctOptionIndexReads === 1 ? 1 : 0
    },
  })

  const updateResult = updateSystem.service.updateQuestion(updateInput)

  assert.equal(updateResult.status, 'questionUpdated')
  assert.equal(updateResult.question.correctOptionId, 'option-vector-south')
  assert.equal(correctOptionIndexReads, 1)
})

test('liest moduleId für Start und Historie jeweils genau einmal und akzeptiert null-prototypische Eingaben', () => {
  const startSystem = createServiceSystem({
    bank: createBank([createQuestion()]),
    idValues: { session: ['session-null-prototype'] },
    timestamps: [STARTED_AT],
  })
  const startInput = Object.create(null)
  let startModuleReads = 0

  Object.defineProperty(startInput, 'moduleId', {
    enumerable: true,
    get() {
      startModuleReads += 1
      return startModuleReads === 1 ? 'module-orbit' : 'module-garden'
    },
  })

  const startResult = startSystem.service.startModuleTest(startInput)

  assert.equal(startResult.status, 'testStarted')
  assert.equal(startResult.testSession.moduleId, 'module-orbit')
  assert.equal(startModuleReads, 1)

  const historySystem = createServiceSystem({
    bank: createBank([createQuestion()]),
  })
  const historyInput = Object.create(null)
  let historyModuleReads = 0

  Object.defineProperty(historyInput, 'moduleId', {
    enumerable: true,
    get() {
      historyModuleReads += 1
      return historyModuleReads === 1 ? 'module-orbit' : 'module-garden'
    },
  })

  const historyResult = historySystem.service.loadAttemptHistory(historyInput)

  assert.equal(historyResult.status, 'attemptHistoryEmpty')
  assert.equal(historyModuleReads, 1)
})

test('bindet wechselnde Session-, Answer- und Optionseingaben jeweils an den ersten Snapshotwert', () => {
  const system = createServiceSystem({
    bank: createBank([createQuestion()]),
    idValues: {
      session: ['session-submission-snapshot'],
      attempt: ['attempt-submission-snapshot'],
    },
    timestamps: [STARTED_AT, COMPLETED_AT],
  })
  system.service.startModuleTest({ moduleId: 'module-orbit' })
  const answer = Object.create(null)
  let selectedOptionReads = 0

  answer.questionId = 'question-vector-one'
  Object.defineProperty(answer, 'selectedOptionId', {
    enumerable: true,
    get() {
      selectedOptionReads += 1
      return selectedOptionReads === 1
        ? 'option-vector-north'
        : 'option-vector-south'
    },
  })

  const submission = Object.create(null)
  let testSessionIdReads = 0
  let answersReads = 0

  Object.defineProperty(submission, 'testSessionId', {
    enumerable: true,
    get() {
      testSessionIdReads += 1
      return testSessionIdReads === 1
        ? 'session-submission-snapshot'
        : 'session-other'
    },
  })
  Object.defineProperty(submission, 'answers', {
    enumerable: true,
    get() {
      answersReads += 1
      return answersReads === 1
        ? [answer]
        : [{
            questionId: 'question-vector-one',
            selectedOptionId: 'option-vector-south',
          }]
    },
  })

  const result = system.service.submitModuleTest(submission)

  assert.equal(result.status, 'testCompleted')
  assert.equal(result.result.correctAnswerCount, 1)
  assert.equal(testSessionIdReads, 1)
  assert.equal(answersReads, 1)
  assert.equal(selectedOptionReads, 1)
})

test('blockiert eine reentrante Submission derselben Session vor ID, Uhr und Append', () => {
  const privateMarker = 'private-reentrant-sentinel'
  let submission
  let reentrantResult
  const system = createServiceSystem({
    bank: createBank([createQuestion()]),
    idValues: {
      session: ['session-reentrant'],
      attempt: ['attempt-reentrant'],
    },
    timestamps: [STARTED_AT, COMPLETED_AT],
    nowImplementation({ callNumber, service, timestamp }) {
      if (callNumber === 2) {
        reentrantResult = service.submitModuleTest(submission)
      }

      return timestamp
    },
  })
  system.service.startModuleTest({ moduleId: 'module-orbit' })
  submission = {
    testSessionId: 'session-reentrant',
    answers: [
      {
        questionId: 'question-vector-one',
        selectedOptionId: 'option-vector-north',
      },
    ],
    privateMarker,
  }

  const result = system.service.submitModuleTest(submission)

  assert.equal(result.status, 'testCompleted')
  assert.equal(reentrantResult.ok, false)
  assert.equal(reentrantResult.status, 'conflict')
  assert.equal(reentrantResult.changed, false)
  assert.equal(
    reentrantResult.error.code,
    'learningTestSubmissionInProgress'
  )
  assert.equal(system.calls.appendAttempt, 1)
  assert.equal(system.calls.now, 2)
  assert.deepEqual(system.calls.idTypes, ['session', 'attempt'])
  assert.equal(system.getAttemptLog().attempts.length, 1)
  const serializedError = JSON.stringify(reentrantResult)

  assert.equal(serializedError.includes(privateMarker), false)
  assert.equal(serializedError.includes('session-reentrant'), false)
  assert.equal(serializedError.includes('option-vector-north'), false)
})

test('blockiert verschiedene Sessions nicht und reserviert Attempt-IDs vor reentrantem now', () => {
  let sessionBSubmission
  let sessionBResult
  const system = createServiceSystem({
    bank: createBank([createQuestion()]),
    idValues: {
      session: ['session-reentrant-a', 'session-reentrant-b'],
      attempt: [
        'attempt-reentrant-shared',
        'attempt-reentrant-shared',
        'attempt-reentrant-b',
      ],
    },
    timestamps: [
      STARTED_AT,
      STARTED_AT,
      COMPLETED_AT,
      COMPLETED_AT,
    ],
    nowImplementation({ callNumber, service, timestamp }) {
      if (callNumber === 3) {
        sessionBResult = service.submitModuleTest(sessionBSubmission)
      }

      return timestamp
    },
  })
  const sessionA = system.service.startModuleTest({
    moduleId: 'module-orbit',
  })
  const sessionB = system.service.startModuleTest({
    moduleId: 'module-orbit',
  })
  const createSubmission = (testSessionId) => ({
    testSessionId,
    answers: [
      {
        questionId: 'question-vector-one',
        selectedOptionId: 'option-vector-north',
      },
    ],
  })

  sessionBSubmission = createSubmission(sessionB.testSession.id)
  const firstSessionAResult = system.service.submitModuleTest(
    createSubmission(sessionA.testSession.id)
  )
  const retriedSessionAResult = system.service.submitModuleTest(
    createSubmission(sessionA.testSession.id)
  )

  assert.equal(sessionBResult.status, 'testCompleted')
  assert.equal(firstSessionAResult.status, 'storageFailed')
  assert.equal(retriedSessionAResult.status, 'testCompleted')
  assert.deepEqual(
    system.getAttemptLog().attempts.map((attempt) => attempt.id),
    ['attempt-reentrant-b', 'attempt-reentrant-shared']
  )
  assert.equal(new Set(
    system.getAttemptLog().attempts.map((attempt) => attempt.id)
  ).size, 2)
  assert.equal(system.calls.appendAttempt, 2)
  assert.equal(system.calls.now, 4)
  assert.deepEqual(system.calls.idTypes, [
    'session',
    'session',
    'attempt',
    'attempt',
    'attempt',
  ])
})

test('weist jede Abweichung vom validierten Attempt-Präfix plus exakt neuem Attempt zurück', () => {
  const prefixAttempts = [
    createAttempt({
      id: 'attempt-prefix-a',
      startedAt: '2026-07-19T08:00:00.000Z',
      completedAt: '2026-07-19T08:05:00.000Z',
    }),
    createAttempt({
      id: 'attempt-prefix-b',
      startedAt: '2026-07-19T09:00:00.000Z',
      completedAt: '2026-07-19T09:05:00.000Z',
    }),
  ]
  const changedAnswerAttempt = structuredClone(prefixAttempts[0])

  changedAnswerAttempt.correctAnswerCount = 0
  changedAnswerAttempt.scorePercent = 0
  changedAnswerAttempt.answers[0].selectedOptionId = 'option-vector-south'
  changedAnswerAttempt.answers[0].isCorrect = false

  const mismatchCases = [
    {
      name: 'zusätzlicher Präfixeintrag',
      createReturnedAttempts(attempt) {
        return [
          ...prefixAttempts,
          createAttempt({
            id: 'attempt-prefix-extra',
            startedAt: '2026-07-19T09:15:00.000Z',
            completedAt: '2026-07-19T09:20:00.000Z',
          }),
          attempt,
        ]
      },
    },
    {
      name: 'entfernter Präfixeintrag',
      createReturnedAttempts(attempt) {
        return [prefixAttempts[1], attempt]
      },
    },
    {
      name: 'umsortierter Präfix',
      createReturnedAttempts(attempt) {
        return [prefixAttempts[1], prefixAttempts[0], attempt]
      },
    },
    {
      name: 'verändertes Schwester-Attempt',
      createReturnedAttempts(attempt) {
        return [
          {
            ...prefixAttempts[0],
            completedAt: '2026-07-19T08:06:00.000Z',
          },
          prefixAttempts[1],
          attempt,
        ]
      },
    },
    {
      name: 'verändertes Answer-Feld im Präfix',
      createReturnedAttempts(attempt) {
        return [changedAnswerAttempt, prefixAttempts[1], attempt]
      },
    },
  ]

  for (const mismatchCase of mismatchCases) {
    const system = createServiceSystem({
      bank: createBank([createQuestion()]),
      attemptLog: createAttemptLog(prefixAttempts),
      idValues: {
        session: [`session-prefix-${mismatchCase.name}`],
        attempt: [`attempt-new-${mismatchCase.name}`],
      },
      timestamps: [STARTED_AT, COMPLETED_AT],
      appendImplementation({ attempt }) {
        return {
          ok: true,
          status: 'appended',
          attemptLog: createAttemptLog(
            mismatchCase.createReturnedAttempts(attempt)
          ),
        }
      },
    })
    const session = system.service.startModuleTest({
      moduleId: 'module-orbit',
    })
    const result = system.service.submitModuleTest({
      testSessionId: session.testSession.id,
      answers: [
        {
          questionId: 'question-vector-one',
          selectedOptionId: 'option-vector-north',
        },
      ],
    })

    assert.equal(result.ok, false, mismatchCase.name)
    assert.equal(result.status, 'storageFailed', mismatchCase.name)
    assert.equal(result.changed, false, mismatchCase.name)
    assert.equal(
      result.error.code,
      'unexpectedStorageResult',
      mismatchCase.name
    )
    assert.equal(system.calls.appendAttempt, 1, mismatchCase.name)
    assert.equal(
      JSON.stringify(result).includes(mismatchCase.name),
      false,
      mismatchCase.name
    )
  }

  const exactSystem = createServiceSystem({
    bank: createBank([createQuestion()]),
    attemptLog: createAttemptLog(prefixAttempts),
    idValues: {
      session: ['session-prefix-exact'],
      attempt: ['attempt-prefix-exact'],
    },
    timestamps: [STARTED_AT, COMPLETED_AT],
    appendImplementation({ attempt, attemptLog, setAttemptLog }) {
      const exactLog = {
        ...attemptLog,
        attempts: [...attemptLog.attempts, attempt],
      }

      setAttemptLog(exactLog)
      return {
        ok: true,
        status: 'appended',
        attemptLog: structuredClone(exactLog),
      }
    },
  })
  const exactSession = exactSystem.service.startModuleTest({
    moduleId: 'module-orbit',
  })
  const exactResult = exactSystem.service.submitModuleTest({
    testSessionId: exactSession.testSession.id,
    answers: [
      {
        questionId: 'question-vector-one',
        selectedOptionId: 'option-vector-north',
      },
    ],
  })

  assert.equal(exactResult.status, 'testCompleted')
  assert.deepEqual(
    exactSystem.getAttemptLog().attempts.map((attempt) => attempt.id),
    ['attempt-prefix-a', 'attempt-prefix-b', 'attempt-prefix-exact']
  )
  assert.equal(exactSystem.calls.appendAttempt, 1)
})

test('hält einen Write mit unsicherer Append-Rückgabe retrybar und schreibt nie ein zweites Mal', () => {
  const privateMarker = 'private-append-return-sentinel'
  const returnVariants = [
    {
      name: 'werfender attemptLog-Getter',
      createResult(nextLog) {
        const appendResult = {
          ok: true,
          status: 'appended',
        }

        Object.defineProperty(appendResult, 'attemptLog', {
          enumerable: true,
          get() {
            throw new Error(privateMarker)
          },
        })
        return appendResult
      },
    },
    {
      name: 'revoked attemptLog-Proxy',
      createResult(nextLog) {
        const attemptLogProxy = Proxy.revocable(nextLog, {})

        attemptLogProxy.revoke()
        return {
          ok: true,
          status: 'appended',
          attemptLog: attemptLogProxy.proxy,
        }
      },
    },
    {
      name: 'attemptLog mit benutzerdefiniertem Prototyp',
      createResult(nextLog) {
        return {
          ok: true,
          status: 'appended',
          attemptLog: Object.assign(
            Object.create({ unsafePrototype: true }),
            nextLog
          ),
        }
      },
    },
  ]

  for (const returnVariant of returnVariants) {
    const system = createServiceSystem({
      bank: createBank([createQuestion()]),
      idValues: {
        session: [`session-unsafe-return-${returnVariant.name}`],
        attempt: [`attempt-unsafe-return-${returnVariant.name}`],
      },
      timestamps: [STARTED_AT, COMPLETED_AT],
      appendImplementation({ attempt, attemptLog, setAttemptLog }) {
        const nextLog = {
          ...attemptLog,
          attempts: [...attemptLog.attempts, attempt],
        }

        setAttemptLog(nextLog)
        return returnVariant.createResult(nextLog)
      },
    })
    const session = system.service.startModuleTest({
      moduleId: 'module-orbit',
    })
    const submission = {
      testSessionId: session.testSession.id,
      answers: [
        {
          questionId: 'question-vector-one',
          selectedOptionId: 'option-vector-north',
        },
      ],
    }
    const ambiguousResult = system.service.submitModuleTest(submission)
    const retryResult = system.service.submitModuleTest(submission)

    assert.equal(ambiguousResult.ok, false, returnVariant.name)
    assert.equal(ambiguousResult.status, 'storageFailed', returnVariant.name)
    assert.equal(
      JSON.stringify(ambiguousResult).includes(privateMarker),
      false,
      returnVariant.name
    )
    assert.equal(retryResult.status, 'testCompleted', returnVariant.name)
    assert.equal(system.calls.appendAttempt, 1, returnVariant.name)
    assert.equal(system.getAttemptLog().attempts.length, 1, returnVariant.name)
    assert.deepEqual(
      system.calls.idTypes,
      ['session', 'attempt'],
      returnVariant.name
    )
    assert.equal(system.calls.now, 2, returnVariant.name)
  }
})
