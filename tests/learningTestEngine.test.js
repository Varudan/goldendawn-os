import assert from 'node:assert/strict'
import test from 'node:test'

import {
  evaluateLearningTestAnswers,
  projectPublicTestQuestions,
  selectModuleTestQuestions,
} from '../src/modules/learning-hub/learningTestEngine.js'

function createLearningHub() {
  return {
    schemaVersion: 2,
    dataOrigin: 'private',
    modules: [
      {
        id: 'module-other',
        title: 'Erfundenes Nebenmodul',
        position: 2,
        chapters: [{
          id: 'chapter-other',
          title: 'Erfundenes Nebenkapitel',
          position: 1,
          learningNodes: [{
            id: 'node-other',
            title: 'Erfundene Nebenkarte',
            content: 'Synthetischer Nebeninhalt.',
            position: 1,
          }],
        }],
      },
      {
        id: 'module-constellation',
        title: 'Erfundener Sternenatlas',
        position: 1,
        chapters: [
          {
            id: 'chapter-constellation-second',
            title: 'Zweites erfundenes Kapitel',
            position: 2,
            learningNodes: [{
              id: 'node-constellation-third',
              title: 'Dritte erfundene Karte',
              content: 'Synthetischer Inhalt C.',
              position: 1,
            }],
          },
          {
            id: 'chapter-constellation-first',
            title: 'Erstes erfundenes Kapitel',
            position: 1,
            learningNodes: [
              {
                id: 'node-constellation-second',
                title: 'Zweite erfundene Karte',
                content: 'Synthetischer Inhalt B.',
                position: 2,
              },
              {
                id: 'node-constellation-first',
                title: 'Erste erfundene Karte',
                content: 'Synthetischer Inhalt A.',
                position: 1,
              },
            ],
          },
        ],
      },
    ],
  }
}

function createQuestion({
  id,
  moduleId = 'module-constellation',
  chapterId,
  learningNodeId,
  position,
  correctOptionId = `${id}-option-a`,
  optionOrder = [2, 1],
} = {}) {
  return {
    id,
    moduleId,
    chapterId,
    learningNodeId,
    type: 'singleChoice',
    prompt: `Welche erfundene Wahl gehört zu ${id}?`,
    difficulty: 'medium',
    position,
    revision: 3,
    createdAt: '2026-07-19T08:00:00.000Z',
    updatedAt: '2026-07-19T09:00:00.000Z',
    options: optionOrder.map((optionPosition) => ({
      id: `${id}-option-${optionPosition === 1 ? 'a' : 'b'}`,
      label: optionPosition === 1 ? 'Erste Wahl' : 'Zweite Wahl',
      position: optionPosition,
    })),
    correctOptionId,
    explanation: `Synthetische Erklärung für ${id}.`,
  }
}

function createTestBank() {
  return {
    schemaVersion: 1,
    dataOrigin: 'private',
    questions: [
      createQuestion({
        id: 'question-node-three',
        chapterId: 'chapter-constellation-second',
        learningNodeId: 'node-constellation-third',
        position: 1,
      }),
      createQuestion({
        id: 'question-node-one-second',
        chapterId: 'chapter-constellation-first',
        learningNodeId: 'node-constellation-first',
        position: 2,
      }),
      createQuestion({
        id: 'question-other-module',
        moduleId: 'module-other',
        chapterId: 'chapter-other',
        learningNodeId: 'node-other',
        position: 1,
      }),
      createQuestion({
        id: 'question-node-two',
        chapterId: 'chapter-constellation-first',
        learningNodeId: 'node-constellation-second',
        position: 1,
      }),
      createQuestion({
        id: 'question-node-one-first',
        chapterId: 'chapter-constellation-first',
        learningNodeId: 'node-constellation-first',
        position: 1,
      }),
      createQuestion({
        id: 'question-orphaned-node',
        chapterId: 'chapter-constellation-first',
        learningNodeId: 'node-not-in-current-hub',
        position: 1,
      }),
      createQuestion({
        id: 'question-wrong-parent-chain',
        chapterId: 'chapter-constellation-second',
        learningNodeId: 'node-constellation-first',
        position: 3,
      }),
    ],
  }
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze)
    Object.freeze(value)
  }

  return value
}

test('selektiert nur die aktuelle vollständige Elternkette in Strukturreihenfolge', () => {
  const questions = selectModuleTestQuestions(
    createLearningHub(),
    createTestBank(),
    'module-constellation'
  )

  assert.deepEqual(questions.map((question) => question.id), [
    'question-node-one-first',
    'question-node-one-second',
    'question-node-two',
    'question-node-three',
  ])
  assert.ok(questions.every(
    (question) => question.moduleId === 'module-constellation'
  ))
  assert.deepEqual(questions[0].options.map((option) => option.position), [
    1,
    2,
  ])
})

test('liefert für ein unbekanntes Modul eine neue leere Auswahl', () => {
  const firstResult = selectModuleTestQuestions(
    createLearningHub(),
    createTestBank(),
    'module-not-found'
  )
  const secondResult = selectModuleTestQuestions(
    createLearningHub(),
    createTestBank(),
    'module-not-found'
  )

  assert.deepEqual(firstResult, [])
  assert.notStrictEqual(firstResult, secondResult)
})

test('selektiert ohne Mutation und gibt defensive Vollfragen-Snapshots zurück', () => {
  const learningHub = createLearningHub()
  const testBank = createTestBank()
  const hubSnapshot = structuredClone(learningHub)
  const bankSnapshot = structuredClone(testBank)
  const questions = selectModuleTestQuestions(
    deepFreeze(learningHub),
    deepFreeze(testBank),
    'module-constellation'
  )

  assert.deepEqual(learningHub, hubSnapshot)
  assert.deepEqual(testBank, bankSnapshot)
  assert.deepEqual(Object.keys(questions[0]), [
    'id',
    'moduleId',
    'chapterId',
    'learningNodeId',
    'type',
    'prompt',
    'difficulty',
    'position',
    'revision',
    'createdAt',
    'updatedAt',
    'options',
    'correctOptionId',
    'explanation',
  ])

  questions[0].prompt = 'Nur die Rückgabe wurde verändert.'
  questions[0].options[0].label = 'Nur die Rückgabeoption wurde verändert.'
  assert.deepEqual(testBank, bankSnapshot)
  assert.notEqual(
    selectModuleTestQuestions(
      learningHub,
      testBank,
      'module-constellation'
    )[0].prompt,
    questions[0].prompt
  )
})

test('projiziert minimale öffentliche Fragen ohne Lösung oder Erklärung', () => {
  const fullQuestions = selectModuleTestQuestions(
    createLearningHub(),
    createTestBank(),
    'module-constellation'
  )
  const publicQuestions = projectPublicTestQuestions(fullQuestions)
  const serializedProjection = JSON.stringify(publicQuestions)

  assert.deepEqual(Object.keys(publicQuestions[0]), [
    'id',
    'learningNodeId',
    'type',
    'prompt',
    'difficulty',
    'options',
  ])
  assert.deepEqual(Object.keys(publicQuestions[0].options[0]), ['id', 'label'])
  assert.deepEqual(publicQuestions[0].options.map((option) => option.id), [
    'question-node-one-first-option-a',
    'question-node-one-first-option-b',
  ])
  assert.equal(serializedProjection.includes('correctOptionId'), false)
  assert.equal(serializedProjection.includes('explanation'), false)
  assert.equal(serializedProjection.includes('Synthetische Erklärung'), false)

  publicQuestions[0].prompt = 'Nur die Projektion wurde verändert.'
  publicQuestions[0].options[0].label = 'Nur die Projektion wurde verändert.'
  assert.notEqual(fullQuestions[0].prompt, publicQuestions[0].prompt)
  assert.notEqual(
    fullQuestions[0].options[0].label,
    publicQuestions[0].options[0].label
  )
})

test('bewertet strikt nach IDs und erzeugt Attempts in autoritativer Fragenreihenfolge', () => {
  const questions = selectModuleTestQuestions(
    createLearningHub(),
    createTestBank(),
    'module-constellation'
  ).slice(0, 3)
  const answers = [
    {
      questionId: questions[2].id,
      selectedOptionId: questions[2].correctOptionId,
    },
    {
      questionId: questions[0].id,
      selectedOptionId: questions[0].correctOptionId,
    },
    {
      questionId: questions[1].id,
      selectedOptionId: `${questions[1].correctOptionId}-wrong`,
    },
  ]
  const result = evaluateLearningTestAnswers(questions, answers)

  assert.deepEqual(result.answers.map((answer) => answer.questionId),
    questions.map((question) => question.id))
  assert.deepEqual(result.answers.map((answer) => answer.isCorrect), [
    true,
    false,
    true,
  ])
  assert.equal(result.totalQuestionCount, 3)
  assert.equal(result.correctAnswerCount, 2)
  assert.equal(result.scorePercent, 67)
  assert.deepEqual(result.answers[0], {
    questionId: questions[0].id,
    questionRevision: questions[0].revision,
    learningNodeId: questions[0].learningNodeId,
    selectedOptionId: questions[0].correctOptionId,
    correctOptionId: questions[0].correctOptionId,
    isCorrect: true,
  })
})

test('verwendet strikte Gleichheit auch bei ähnlich wirkenden ID-Typen', () => {
  const question = createQuestion({
    id: 'question-strict-id',
    chapterId: 'chapter-constellation-first',
    learningNodeId: 'node-constellation-first',
    position: 1,
    correctOptionId: '7',
  })
  const result = evaluateLearningTestAnswers([question], [{
    questionId: question.id,
    selectedOptionId: 7,
  }])

  assert.equal(result.correctAnswerCount, 0)
  assert.equal(result.scorePercent, 0)
  assert.equal(result.answers[0].isCorrect, false)
})

test('berechnet Prozentwerte ausschließlich ganzzahlig mit Math.round', () => {
  const questions = Array.from({ length: 6 }, (_, index) => createQuestion({
    id: `question-rounding-${index + 1}`,
    chapterId: 'chapter-constellation-first',
    learningNodeId: 'node-constellation-first',
    position: index + 1,
  }))
  const answers = questions.map((question, index) => ({
    questionId: question.id,
    selectedOptionId: index === 0
      ? question.correctOptionId
      : `${question.correctOptionId}-wrong`,
  }))
  const result = evaluateLearningTestAnswers(questions, answers)

  assert.equal(result.correctAnswerCount, 1)
  assert.equal(result.totalQuestionCount, 6)
  assert.equal(result.scorePercent, 17)
  assert.deepEqual(evaluateLearningTestAnswers([], []), {
    answers: [],
    totalQuestionCount: 0,
    correctAnswerCount: 0,
    scorePercent: 0,
  })
})

test('mutiert weder Fragen noch Antworten bei der Auswertung', () => {
  const questions = deepFreeze(selectModuleTestQuestions(
    createLearningHub(),
    createTestBank(),
    'module-constellation'
  ))
  const answers = deepFreeze(questions.map((question) => ({
    questionId: question.id,
    selectedOptionId: question.correctOptionId,
  })))
  const questionSnapshot = structuredClone(questions)
  const answerSnapshot = structuredClone(answers)
  const result = evaluateLearningTestAnswers(questions, answers)

  assert.deepEqual(questions, questionSnapshot)
  assert.deepEqual(answers, answerSnapshot)
  result.answers[0].selectedOptionId = 'Nur die Rückgabe wurde verändert.'
  assert.deepEqual(questions, questionSnapshot)
  assert.deepEqual(answers, answerSnapshot)
})

test('verwendet für Auswahl, Projektion und Bewertung keinen Zufall', () => {
  const originalRandom = Math.random
  Math.random = () => {
    throw new Error('Math.random darf die Engine nicht verwenden.')
  }

  try {
    const questions = selectModuleTestQuestions(
      createLearningHub(),
      createTestBank(),
      'module-constellation'
    )
    const publicQuestions = projectPublicTestQuestions(questions)
    const result = evaluateLearningTestAnswers(questions, questions.map(
      (question) => ({
        questionId: question.id,
        selectedOptionId: question.correctOptionId,
      })
    ))

    assert.equal(publicQuestions.length, 4)
    assert.equal(result.scorePercent, 100)
  } finally {
    Math.random = originalRandom
  }
})
