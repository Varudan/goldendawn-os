import assert from 'node:assert/strict'
import test from 'node:test'

import {
  LEARNING_ARTIFACT_CONTENT_MAX_LENGTH,
  LEARNING_ARTIFACT_DATA_ORIGINS,
  LEARNING_ARTIFACT_ERROR_CODES,
  LEARNING_ARTIFACT_SCHEMA_VERSION,
  LEARNING_ARTIFACT_TYPES,
  isCanonicalUtcTimestamp,
  validateLearningArtifactStore,
} from '../src/modules/learning-hub/learningArtifactContract.js'

function createArtifact(overrides = {}) {
  return {
    id: 'artifact-aurora-note',
    type: 'note',
    moduleId: 'module-aurora',
    chapterId: 'chapter-aurora-signals',
    learningNodeId: 'node-aurora-pulse',
    content: 'Erfundene Notiz über ein Lichtsignal.',
    createdAt: '2026-07-19T08:15:30.000Z',
    updatedAt: '2026-07-19T08:15:30.000Z',
    ...overrides,
  }
}

function createStore(artifacts = []) {
  return {
    schemaVersion: 1,
    dataOrigin: 'private',
    artifacts,
  }
}

function getErrorCodes(result) {
  return result.errors.map((error) => error.code)
}

test('exportiert den festen Schema-, Typ- und Inhaltsvertrag', () => {
  assert.equal(LEARNING_ARTIFACT_SCHEMA_VERSION, 1)
  assert.deepEqual(LEARNING_ARTIFACT_DATA_ORIGINS, [
    'synthetic',
    'private',
  ])
  assert.deepEqual(LEARNING_ARTIFACT_TYPES, {
    NOTE: 'note',
    SUMMARY: 'summary',
  })
  assert.equal(LEARNING_ARTIFACT_CONTENT_MAX_LENGTH, 10000)
  assert.equal(Object.isFrozen(LEARNING_ARTIFACT_DATA_ORIGINS), true)
  assert.equal(Object.isFrozen(LEARNING_ARTIFACT_TYPES), true)
  assert.equal(Object.isFrozen(LEARNING_ARTIFACT_ERROR_CODES), true)
})

test('akzeptiert einen leeren privaten oder synthetischen Store', () => {
  assert.deepEqual(validateLearningArtifactStore(createStore()), {
    ok: true,
    errors: [],
  })
  assert.deepEqual(validateLearningArtifactStore({
    ...createStore(),
    dataOrigin: 'synthetic',
  }), {
    ok: true,
    errors: [],
  })
})

test('akzeptiert genau eine note und summary für denselben LearningNode', () => {
  const store = createStore([
    createArtifact(),
    createArtifact({
      id: 'artifact-aurora-summary',
      type: 'summary',
      content: 'Erfundene Zusammenfassung eines Lichtsignals.',
    }),
  ])

  assert.deepEqual(validateLearningArtifactStore(store), {
    ok: true,
    errors: [],
  })
})

test('weist ungültige Wurzelwerte, Schemaversionen und Datenherkünfte zurück', () => {
  for (const rootValue of [null, [], 'store']) {
    assert.deepEqual(validateLearningArtifactStore(rootValue), {
      ok: false,
      errors: [
        {
          code: 'invalidLearningArtifactStore',
          path: '$',
          message: 'Der LearningArtifact-Store muss ein Objekt sein.',
        },
      ],
    })
  }

  const result = validateLearningArtifactStore({
    schemaVersion: 2,
    dataOrigin: 'external',
    artifacts: null,
  })

  assert.deepEqual(getErrorCodes(result), [
    'unsupportedSchemaVersion',
    'invalidDataOrigin',
    'invalidArtifacts',
  ])
  assert.deepEqual(result.errors.map((error) => error.path), [
    '$.schemaVersion',
    '$.dataOrigin',
    '$.artifacts',
  ])
})

test('weist unbekannte Artefakttypen und primitive Einträge zurück', () => {
  const result = validateLearningArtifactStore(createStore([
    createArtifact({ type: 'reflection' }),
    null,
  ]))

  assert.deepEqual(getErrorCodes(result), [
    'invalidArtifactType',
    'invalidArtifact',
  ])
  assert.deepEqual(result.errors.map((error) => error.path), [
    '$.artifacts[0].type',
    '$.artifacts[1]',
  ])
})

test('fordert getrimmte nicht leere Artefakt- und Referenz-IDs', () => {
  const result = validateLearningArtifactStore(createStore([
    createArtifact({
      id: ' artifact ',
      moduleId: '',
      chapterId: ' chapter ',
      learningNodeId: 42,
    }),
  ]))

  assert.deepEqual(getErrorCodes(result), [
    'invalidId',
    'invalidId',
    'invalidId',
    'invalidId',
  ])
  assert.deepEqual(result.errors.map((error) => error.path), [
    '$.artifacts[0].id',
    '$.artifacts[0].moduleId',
    '$.artifacts[0].chapterId',
    '$.artifacts[0].learningNodeId',
  ])
})

test('fordert global eindeutige Artefakt-IDs', () => {
  const result = validateLearningArtifactStore(createStore([
    createArtifact(),
    createArtifact({
      type: 'summary',
      learningNodeId: 'node-aurora-second',
      content: 'Erfundener zweiter Text.',
    }),
  ]))

  assert.deepEqual(getErrorCodes(result), ['duplicateArtifactId'])
  assert.equal(result.errors[0].path, '$.artifacts[1].id')
})

test('fordert die Eindeutigkeit von learningNodeId und type', () => {
  const result = validateLearningArtifactStore(createStore([
    createArtifact(),
    createArtifact({
      id: 'artifact-aurora-note-second',
      moduleId: 'module-other',
      chapterId: 'chapter-other',
      content: 'Erfundene zweite Notiz.',
    }),
  ]))

  assert.deepEqual(getErrorCodes(result), [
    'duplicateLearningNodeArtifactType',
  ])
  assert.equal(result.errors[0].path, '$.artifacts[1].type')
})

test('weist zusätzliche Felder und Custom-Prototype-Stores ohne Rohwert-Leak zurück', () => {
  const privatePropertyMarker = 'private-property-name-sentinel'
  const artifactWithCopiedSource = createArtifact()
  artifactWithCopiedSource[privatePropertyMarker] =
    'Erfundener kopierter Quellinhalt.'
  const inheritedStore = Object.create(createStore())
  const extraFieldResult = validateLearningArtifactStore(createStore([
    artifactWithCopiedSource,
  ]))
  const inheritedResult = validateLearningArtifactStore(inheritedStore)

  assert.equal(extraFieldResult.ok, false)
  assert.equal(extraFieldResult.errors[0].code, 'unknownProperty')
  assert.equal(extraFieldResult.errors[0].path, '$.artifacts[0].*')
  assert.equal(
    JSON.stringify(extraFieldResult.errors).includes(privatePropertyMarker),
    false
  )
  assert.equal(inheritedResult.ok, false)
  assert.deepEqual(getErrorCodes(inheritedResult), [
    'invalidLearningArtifactStore',
  ])
})

test('weist Artefakte mit privaten geerbten Feldern ohne Sentinel-Leak zurück', () => {
  const privateInheritedField = 'private-inherited-field-sentinel'
  const privateInheritedValue = 'private-inherited-value-sentinel'
  const customPrototypeArtifact = Object.assign(
    Object.create({
      [privateInheritedField]: privateInheritedValue,
    }),
    createArtifact()
  )
  const result = validateLearningArtifactStore(createStore([
    customPrototypeArtifact,
  ]))
  const serializedErrors = JSON.stringify(result.errors)

  assert.equal(result.ok, false)
  assert.deepEqual(getErrorCodes(result), ['invalidArtifact'])
  assert.equal(result.errors[0].path, '$.artifacts[0]')
  assert.equal(serializedErrors.includes(privateInheritedField), false)
  assert.equal(serializedErrors.includes(privateInheritedValue), false)
})

test('erlaubt null-Prototypes und behandelt Prototype-Fehler kontrolliert', () => {
  const nullPrototypeArtifact = Object.assign(
    Object.create(null),
    createArtifact()
  )
  const privatePrototypeError = 'private-prototype-error-sentinel'
  const throwingPrototypeArtifact = new Proxy(createArtifact(), {
    getPrototypeOf() {
      throw new Error(privatePrototypeError)
    },
  })
  const validResult = validateLearningArtifactStore(createStore([
    nullPrototypeArtifact,
  ]))
  const invalidResult = validateLearningArtifactStore(createStore([
    throwingPrototypeArtifact,
  ]))

  assert.equal(validResult.ok, true)
  assert.deepEqual(getErrorCodes(invalidResult), ['invalidArtifact'])
  assert.equal(
    JSON.stringify(invalidResult.errors).includes(privatePrototypeError),
    false
  )
})

test('prüft kanonische und tatsächlich existierende UTC-Zeitstempel', () => {
  assert.equal(isCanonicalUtcTimestamp('2024-02-29T23:59:59.999Z'), true)

  for (const invalidTimestamp of [
    '2026-07-19T08:15:30Z',
    '2026-07-19T10:15:30.000+02:00',
    '2026-07-19T08:15:30.000z',
    '2026-02-30T08:15:30.000Z',
    '2026-07-19T24:00:00.000Z',
    ' 2026-07-19T08:15:30.000Z ',
    null,
  ]) {
    assert.equal(isCanonicalUtcTimestamp(invalidTimestamp), false)
  }

  const result = validateLearningArtifactStore(createStore([
    createArtifact({
      createdAt: '2026-07-19T08:15:30Z',
      updatedAt: '2026-07-19T10:15:30.000+02:00',
    }),
  ]))

  assert.deepEqual(getErrorCodes(result), [
    'invalidCreatedAt',
    'invalidUpdatedAt',
  ])
})

test('weist updatedAt vor createdAt zurück und erlaubt Gleichstand', () => {
  const invalidResult = validateLearningArtifactStore(createStore([
    createArtifact({
      createdAt: '2026-07-19T08:15:30.001Z',
      updatedAt: '2026-07-19T08:15:30.000Z',
    }),
  ]))

  assert.deepEqual(getErrorCodes(invalidResult), [
    'updatedAtBeforeCreatedAt',
  ])
  assert.deepEqual(validateLearningArtifactStore(createStore([
    createArtifact(),
  ])), {
    ok: true,
    errors: [],
  })
})

test('weist leeren, ungetrimmten und zu langen Inhalt zurück', () => {
  const cases = [
    ['', 'invalidContent'],
    ['   ', 'invalidContent'],
    [' ungetrimmt ', 'invalidContent'],
    [42, 'invalidContent'],
    ['x'.repeat(10001), 'contentTooLong'],
  ]

  for (const [content, expectedCode] of cases) {
    const result = validateLearningArtifactStore(createStore([
      createArtifact({ content }),
    ]))

    assert.deepEqual(getErrorCodes(result), [expectedCode])
    assert.equal(result.errors[0].path, '$.artifacts[0].content')
  }

  assert.equal(validateLearningArtifactStore(createStore([
    createArtifact({ content: 'x'.repeat(10000) }),
  ])).ok, true)

  assert.deepEqual(getErrorCodes(validateLearningArtifactStore(createStore([
    createArtifact({ content: ` ${'x'.repeat(10001)} ` }),
  ]))), ['invalidContent', 'contentTooLong'])
})

test('akkumuliert alle unabhängigen Fehler in stabiler Reihenfolge', () => {
  const result = validateLearningArtifactStore({
    schemaVersion: 9,
    dataOrigin: 'remote',
    artifacts: [
      createArtifact({
        id: '',
        type: 'unknown',
        moduleId: ' module ',
        chapterId: null,
        learningNodeId: '',
        content: ' content ',
        createdAt: 'invalid-created',
        updatedAt: 'invalid-updated',
      }),
      null,
    ],
  })

  assert.deepEqual(getErrorCodes(result), [
    'unsupportedSchemaVersion',
    'invalidDataOrigin',
    'invalidId',
    'invalidArtifactType',
    'invalidId',
    'invalidId',
    'invalidId',
    'invalidContent',
    'invalidCreatedAt',
    'invalidUpdatedAt',
    'invalidArtifact',
  ])
  result.errors.forEach((error) => {
    assert.deepEqual(Object.keys(error), ['code', 'path', 'message'])
  })
})

test('verändert Eingabedaten bei erfolgreicher oder fehlerhafter Validierung nicht', () => {
  const validStore = createStore([createArtifact()])
  const invalidStore = createStore([
    createArtifact({ content: ' ungetrimmt ' }),
  ])
  const validSnapshot = structuredClone(validStore)
  const invalidSnapshot = structuredClone(invalidStore)

  validateLearningArtifactStore(validStore)
  validateLearningArtifactStore(invalidStore)

  assert.deepEqual(validStore, validSnapshot)
  assert.deepEqual(invalidStore, invalidSnapshot)
})

test('nimmt keine privaten Rohwerte in Vertragsfehler auf', () => {
  const privateMarkers = [
    'private-artifact-sentinel',
    'private-node-sentinel',
    'private-content-sentinel',
    'private-time-sentinel',
  ]
  const result = validateLearningArtifactStore(createStore([
    createArtifact({
      id: ` ${privateMarkers[0]} `,
      learningNodeId: ` ${privateMarkers[1]} `,
      content: ` ${privateMarkers[2]} `,
      createdAt: privateMarkers[3],
      updatedAt: privateMarkers[3],
    }),
  ]))
  const serializedErrors = JSON.stringify(result.errors)

  privateMarkers.forEach((privateMarker) => {
    assert.equal(serializedErrors.includes(privateMarker), false)
  })
})
