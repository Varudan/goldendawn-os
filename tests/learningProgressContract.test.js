import assert from 'node:assert/strict'
import test from 'node:test'

import {
  LEARNING_PROGRESS_DATA_ORIGINS,
  LEARNING_PROGRESS_ERROR_CODES,
  LEARNING_PROGRESS_EVENT_TYPES,
  LEARNING_PROGRESS_SCHEMA_VERSION,
  validateLearningProgress,
} from '../src/modules/learning-hub/learningProgressContract.js'

function createProgressLog(dataOrigin = 'private', events = []) {
  return {
    schemaVersion: 1,
    dataOrigin,
    events,
  }
}

function createProgressEvent(overrides = {}) {
  return {
    id: 'progress-event-aurora-1',
    type: 'chapter.completed',
    moduleId: 'module-aurora-atlas',
    chapterId: 'chapter-aurora-colors',
    occurredAt: '2026-07-18T10:15:30.000Z',
    ...overrides,
  }
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
    Object.values(value).forEach(deepFreeze)
    Object.freeze(value)
  }

  return value
}

test('exportiert die unveränderlichen Konstanten des Schema-1-Vertrags', () => {
  assert.equal(LEARNING_PROGRESS_SCHEMA_VERSION, 1)
  assert.deepEqual(LEARNING_PROGRESS_DATA_ORIGINS, ['synthetic', 'private'])
  assert.deepEqual(LEARNING_PROGRESS_EVENT_TYPES, {
    CHAPTER_COMPLETED: 'chapter.completed',
    CHAPTER_REOPENED: 'chapter.reopened',
  })
  assert.equal(Object.isFrozen(LEARNING_PROGRESS_DATA_ORIGINS), true)
  assert.equal(Object.isFrozen(LEARNING_PROGRESS_EVENT_TYPES), true)
  assert.equal(Object.isFrozen(LEARNING_PROGRESS_ERROR_CODES), true)
})

test('akzeptiert leere private und synthetische Fortschrittslogs', () => {
  for (const dataOrigin of ['private', 'synthetic']) {
    assert.deepEqual(validateLearningProgress(createProgressLog(dataOrigin)), {
      ok: true,
      errors: [],
    })
  }
})

test('akzeptiert beide Ereignistypen sowie nicht monotone und gleiche Zeitstempel', () => {
  const progressLog = createProgressLog('synthetic', [
    createProgressEvent({
      id: 'progress-event-aurora-completed',
      type: LEARNING_PROGRESS_EVENT_TYPES.CHAPTER_COMPLETED,
      occurredAt: '2026-07-18T12:00:00.000Z',
    }),
    createProgressEvent({
      id: 'progress-event-aurora-reopened',
      type: LEARNING_PROGRESS_EVENT_TYPES.CHAPTER_REOPENED,
      occurredAt: '2026-07-18T09:00:00.000Z',
    }),
    createProgressEvent({
      id: 'progress-event-aurora-other-chapter',
      chapterId: 'chapter-aurora-shapes',
      occurredAt: '2026-07-18T09:00:00.000Z',
    }),
  ])

  assert.deepEqual(validateLearningProgress(progressLog), {
    ok: true,
    errors: [],
  })
})

test('lehnt ungültige Root-, Event-Array- und Ereignisstrukturen ab', () => {
  for (const progressLog of [null, [], 'progress']) {
    assertHasError(
      validateLearningProgress(progressLog),
      LEARNING_PROGRESS_ERROR_CODES.INVALID_LEARNING_PROGRESS,
      '$'
    )
  }

  assertHasError(
    validateLearningProgress({
      schemaVersion: 1,
      dataOrigin: 'private',
      events: null,
    }),
    LEARNING_PROGRESS_ERROR_CODES.INVALID_EVENTS,
    '$.events'
  )

  const events = [null, [], 'event']
  events.length += 1
  const result = validateLearningProgress(createProgressLog('private', events))

  for (let index = 0; index < events.length; index += 1) {
    assertHasError(
      result,
      LEARNING_PROGRESS_ERROR_CODES.INVALID_EVENT,
      `$.events[${index}]`
    )
  }
})

test('lehnt unbekannte Schemaversionen und ungültige Datenherkünfte ab', () => {
  for (const schemaVersion of [0, 2, '1', null, undefined]) {
    const progressLog = createProgressLog()
    progressLog.schemaVersion = schemaVersion
    assertHasError(
      validateLearningProgress(progressLog),
      LEARNING_PROGRESS_ERROR_CODES.UNSUPPORTED_SCHEMA_VERSION,
      '$.schemaVersion'
    )
  }

  for (const dataOrigin of ['demo', '', ' private ', null, undefined]) {
    const progressLog = createProgressLog()
    progressLog.dataOrigin = dataOrigin

    assertHasError(
      validateLearningProgress(progressLog),
      LEARNING_PROGRESS_ERROR_CODES.INVALID_DATA_ORIGIN,
      '$.dataOrigin'
    )
  }
})

test('lehnt leere, ungetrimmte und typfremde Ereignisreferenzen ab', () => {
  const fieldCases = [
    ['id', '', '$.events[0].id'],
    ['moduleId', ' module-aurora-atlas ', '$.events[0].moduleId'],
    ['chapterId', 42, '$.events[0].chapterId'],
  ]

  for (const [field, value, path] of fieldCases) {
    const result = validateLearningProgress(
      createProgressLog('private', [createProgressEvent({ [field]: value })])
    )

    assertHasError(result, LEARNING_PROGRESS_ERROR_CODES.INVALID_ID, path)
  }
})

test('lehnt Ereignis-ID-Duplikate im vollständigen Log ab', () => {
  const result = validateLearningProgress(
    createProgressLog('private', [
      createProgressEvent(),
      createProgressEvent({
        type: 'chapter.reopened',
        occurredAt: '2026-07-18T10:20:00.000Z',
      }),
    ])
  )

  assertHasError(
    result,
    LEARNING_PROGRESS_ERROR_CODES.DUPLICATE_EVENT_ID,
    '$.events[1].id'
  )
})

test('lehnt unbekannte Ereignistypen einschließlich chapter.started ab', () => {
  for (const type of ['chapter.started', 'chapter.finished', '', null]) {
    const result = validateLearningProgress(
      createProgressLog('private', [createProgressEvent({ type })])
    )

    assertHasError(
      result,
      LEARNING_PROGRESS_ERROR_CODES.INVALID_EVENT_TYPE,
      '$.events[0].type'
    )
  }
})

test('akzeptiert nur gültige kanonische ISO-8601-UTC-Zeitstempel', () => {
  assert.deepEqual(
    validateLearningProgress(
      createProgressLog('private', [
        createProgressEvent({ occurredAt: '2024-02-29T23:59:59.999Z' }),
      ])
    ),
    { ok: true, errors: [] }
  )

  const invalidTimestamps = [
    '2026-07-18T10:15:30Z',
    '2026-07-18T10:15:30.00Z',
    '2026-07-18T10:15:30.000+00:00',
    '2026-07-18T10:15:30.000z',
    '2026-02-30T10:15:30.000Z',
    '2026-07-18T24:00:00.000Z',
    ' 2026-07-18T10:15:30.000Z ',
    null,
  ]

  for (const occurredAt of invalidTimestamps) {
    assertHasError(
      validateLearningProgress(
        createProgressLog('private', [createProgressEvent({ occurredAt })])
      ),
      LEARNING_PROGRESS_ERROR_CODES.INVALID_OCCURRED_AT,
      '$.events[0].occurredAt'
    )
  }
})

test('sammelt alle Validierungsfehler vollständig und in stabiler Form', () => {
  const progressLog = {
    schemaVersion: 2,
    dataOrigin: 'demo',
    events: [
      {
        id: ' progress-event-invalid ',
        type: 'chapter.started',
        moduleId: '',
        chapterId: 7,
        occurredAt: '2026-07-18T10:15:30Z',
      },
      null,
    ],
  }

  assert.deepEqual(validateLearningProgress(progressLog), {
    ok: false,
    errors: [
      {
        code: 'unsupportedSchemaVersion',
        path: '$.schemaVersion',
        message: 'Die LearningProgress-Schemaversion wird nicht unterstützt.',
      },
      {
        code: 'invalidDataOrigin',
        path: '$.dataOrigin',
        message: 'dataOrigin muss synthetic oder private sein.',
      },
      {
        code: 'invalidId',
        path: '$.events[0].id',
        message: 'Die ID muss eine nicht leere, getrimmte Zeichenfolge sein.',
      },
      {
        code: 'invalidEventType',
        path: '$.events[0].type',
        message: 'Der Ereignistyp wird in dieser Schemaversion nicht unterstützt.',
      },
      {
        code: 'invalidId',
        path: '$.events[0].moduleId',
        message: 'Die ID muss eine nicht leere, getrimmte Zeichenfolge sein.',
      },
      {
        code: 'invalidId',
        path: '$.events[0].chapterId',
        message: 'Die ID muss eine nicht leere, getrimmte Zeichenfolge sein.',
      },
      {
        code: 'invalidOccurredAt',
        path: '$.events[0].occurredAt',
        message: 'occurredAt muss ein kanonischer ISO-8601-UTC-Zeitstempel sein.',
      },
      {
        code: 'invalidEvent',
        path: '$.events[1]',
        message: 'Jedes Fortschrittsereignis muss ein Objekt sein.',
      },
    ],
  })
})

test('verändert gültige, ungültige und tief eingefrorene Eingaben nicht', () => {
  const validLog = createProgressLog('private', [createProgressEvent()])
  const validSnapshot = structuredClone(validLog)
  validateLearningProgress(validLog)
  assert.deepEqual(validLog, validSnapshot)

  const invalidLog = createProgressLog('private', [
    createProgressEvent({ moduleId: ' invalid ' }),
  ])
  const invalidSnapshot = structuredClone(invalidLog)
  validateLearningProgress(invalidLog)
  assert.deepEqual(invalidLog, invalidSnapshot)

  const frozenLog = deepFreeze(createProgressLog('synthetic', [
    createProgressEvent(),
  ]))
  assert.deepEqual(validateLearningProgress(frozenLog), {
    ok: true,
    errors: [],
  })
})

test('gibt ausschließlich stabile Fehlerobjekte zurück', () => {
  const result = validateLearningProgress({})

  result.errors.forEach((error) => {
    assert.deepEqual(Object.keys(error), ['code', 'path', 'message'])
    assert.equal(typeof error.code, 'string')
    assert.equal(typeof error.path, 'string')
    assert.equal(typeof error.message, 'string')
  })
})
