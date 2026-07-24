import assert from 'node:assert/strict'
import test from 'node:test'

import { LEARNING_HUB_DEMO } from '../src/data/mock/learningHubDemo.js'
import {
  LEARNING_HUB_ERROR_CODES,
  validateLearningHub,
} from '../src/modules/learning-hub/learningHubContract.js'

function createHub() {
  const hub = structuredClone(LEARNING_HUB_DEMO)

  hub.modules[0].chapters = [hub.modules[0].chapters[0]]
  hub.modules.push({
    id: 'contract-module-second',
    title: 'Zweites synthetisches Vertragsmodul',
    position: 2,
    chapters: [
      {
        id: 'contract-chapter-second',
        title: 'Leeres synthetisches Vertragskapitel',
        position: 1,
        learningNodes: [],
      },
    ],
  })

  return hub
}

function getChapter(hub, moduleIndex = 0, chapterIndex = 0) {
  return hub.modules[moduleIndex].chapters[chapterIndex]
}

function assertHasError(result, code, path) {
  assert.equal(result.ok, false)
  assert.ok(
    result.errors.some((error) => error.code === code && error.path === path),
    `Erwarteter Fehler ${code} an ${path}: ${JSON.stringify(result.errors)}`
  )
}

function assertDeepFrozen(value) {
  if (!value || typeof value !== 'object') return
  assert.equal(Object.isFrozen(value), true)
  Object.values(value).forEach(assertDeepFrozen)
}

test('akzeptiert den synthetischen Demo-Hub mit dem vollständigen KI-Modul', () => {
  assert.deepEqual(validateLearningHub(LEARNING_HUB_DEMO), {
    ok: true,
    errors: [],
  })
  assert.equal(LEARNING_HUB_DEMO.schemaVersion, 2)
  assert.equal(LEARNING_HUB_DEMO.dataOrigin, 'synthetic')
  assert.equal(LEARNING_HUB_DEMO.modules.length, 1)
  assert.equal(LEARNING_HUB_DEMO.modules[0].chapters.length, 3)
  assert.equal(
    LEARNING_HUB_DEMO.modules[0].chapters.reduce(
      (nodeCount, chapter) => nodeCount + chapter.learningNodes.length,
      0
    ),
    4
  )
})

test('akzeptiert einen neuen leeren LearningHub', () => {
  assert.deepEqual(
    validateLearningHub({ schemaVersion: 2, dataOrigin: 'private', modules: [] }),
    { ok: true, errors: [] }
  )
})

test('lehnt ein persistiertes Modul ohne Kapitel ab', () => {
  const hub = createHub()
  hub.modules[0].chapters = []

  assertHasError(
    validateLearningHub(hub),
    LEARNING_HUB_ERROR_CODES.MODULE_REQUIRES_CHAPTER,
    '$.modules[0].chapters'
  )
})

test('akzeptiert ein Kapitel ohne LearningNodes', () => {
  const hub = createHub()
  getChapter(hub).learningNodes = []

  assert.deepEqual(validateLearningHub(hub), { ok: true, errors: [] })
})

test('lehnt Schema 1 und unbekannte Schemaversionen ab', () => {
  for (const schemaVersion of [1, 3, '2', undefined]) {
    const hub = createHub()
    hub.schemaVersion = schemaVersion
    assertHasError(
      validateLearningHub(hub),
      LEARNING_HUB_ERROR_CODES.UNSUPPORTED_SCHEMA_VERSION,
      '$.schemaVersion'
    )
  }
})

test('akzeptiert nur synthetic und private als dataOrigin', () => {
  for (const dataOrigin of ['synthetic', 'private']) {
    const hub = createHub()
    hub.dataOrigin = dataOrigin
    assert.equal(validateLearningHub(hub).ok, true)
  }

  for (const dataOrigin of ['demo', '', null, undefined]) {
    const hub = createHub()
    hub.dataOrigin = dataOrigin
    assertHasError(
      validateLearningHub(hub),
      LEARNING_HUB_ERROR_CODES.INVALID_DATA_ORIGIN,
      '$.dataOrigin'
    )
  }
})

test('lehnt ungültige Root- und Arraystrukturen ab', () => {
  for (const learningHub of [null, [], 'hub']) {
    assertHasError(
      validateLearningHub(learningHub),
      LEARNING_HUB_ERROR_CODES.INVALID_LEARNING_HUB,
      '$'
    )
  }

  const cases = [
    ['modules', null, LEARNING_HUB_ERROR_CODES.INVALID_MODULES, '$.modules'],
    ['chapters', null, LEARNING_HUB_ERROR_CODES.INVALID_CHAPTERS, '$.modules[0].chapters'],
    ['learningNodes', null, LEARNING_HUB_ERROR_CODES.INVALID_LEARNING_NODES, '$.modules[0].chapters[0].learningNodes'],
  ]

  for (const [field, value, code, path] of cases) {
    const hub = createHub()
    if (field === 'modules') hub.modules = value
    if (field === 'chapters') hub.modules[0].chapters = value
    if (field === 'learningNodes') getChapter(hub).learningNodes = value
    assertHasError(validateLearningHub(hub), code, path)
  }
})

test('lehnt ungültige Objekte und Sparse-Array-Lücken auf jeder Ebene ab', () => {
  const hub = createHub()
  hub.modules.push(null)
  hub.modules.length += 1
  hub.modules[0].chapters.push([])
  hub.modules[0].chapters.length += 1
  getChapter(hub).learningNodes.push('node')
  getChapter(hub).learningNodes.length += 1

  const result = validateLearningHub(hub)

  assertHasError(result, LEARNING_HUB_ERROR_CODES.INVALID_MODULE, '$.modules[2]')
  assertHasError(result, LEARNING_HUB_ERROR_CODES.INVALID_MODULE, '$.modules[3]')
  assertHasError(result, LEARNING_HUB_ERROR_CODES.INVALID_CHAPTER, '$.modules[0].chapters[1]')
  assertHasError(result, LEARNING_HUB_ERROR_CODES.INVALID_CHAPTER, '$.modules[0].chapters[2]')
  assertHasError(
    result,
    LEARNING_HUB_ERROR_CODES.INVALID_LEARNING_NODE,
    '$.modules[0].chapters[0].learningNodes[2]'
  )
  assertHasError(
    result,
    LEARNING_HUB_ERROR_CODES.INVALID_LEARNING_NODE,
    '$.modules[0].chapters[0].learningNodes[3]'
  )
})

test('lehnt leere, ungetrimmte und typfremde IDs und Titel ab', () => {
  const hub = createHub()
  hub.modules[0].id = ''
  hub.modules[0].title = ' Modul '
  getChapter(hub).id = 42
  getChapter(hub).title = ' '
  getChapter(hub).learningNodes[0].id = null
  getChapter(hub).learningNodes[0].title = undefined

  const result = validateLearningHub(hub)

  assertHasError(result, LEARNING_HUB_ERROR_CODES.INVALID_ID, '$.modules[0].id')
  assertHasError(result, LEARNING_HUB_ERROR_CODES.INVALID_TITLE, '$.modules[0].title')
  assertHasError(result, LEARNING_HUB_ERROR_CODES.INVALID_ID, '$.modules[0].chapters[0].id')
  assertHasError(result, LEARNING_HUB_ERROR_CODES.INVALID_TITLE, '$.modules[0].chapters[0].title')
  assertHasError(
    result,
    LEARNING_HUB_ERROR_CODES.INVALID_ID,
    '$.modules[0].chapters[0].learningNodes[0].id'
  )
  assertHasError(
    result,
    LEARNING_HUB_ERROR_CODES.INVALID_TITLE,
    '$.modules[0].chapters[0].learningNodes[0].title'
  )
})

test('lehnt leere, ungetrimmte und typfremde LearningNode-Inhalte ab', () => {
  for (const content of ['', ' ', ' Nicht getrimmt ', null, 42, undefined]) {
    const hub = createHub()
    getChapter(hub).learningNodes[0].content = content
    assertHasError(
      validateLearningHub(hub),
      LEARNING_HUB_ERROR_CODES.INVALID_CONTENT,
      '$.modules[0].chapters[0].learningNodes[0].content'
    )
  }
})

test('lehnt global doppelte IDs über alle Hierarchieebenen ab', () => {
  const cases = [
    (hub) => { hub.modules[1].id = hub.modules[0].id },
    (hub) => { getChapter(hub, 1).id = hub.modules[0].id },
    (hub) => { getChapter(hub).learningNodes[0].id = hub.modules[0].id },
    (hub) => { getChapter(hub, 1).id = getChapter(hub).id },
    (hub) => { getChapter(hub).learningNodes[0].id = getChapter(hub).id },
    (hub) => {
      getChapter(hub, 1).learningNodes.push({
        ...getChapter(hub).learningNodes[0],
        position: 1,
      })
    },
  ]

  for (const arrange of cases) {
    const hub = createHub()
    arrange(hub)
    assert.ok(
      validateLearningHub(hub).errors.some(
        (error) => error.code === LEARNING_HUB_ERROR_CODES.DUPLICATE_ID
      )
    )
  }
})

test('lehnt ungültige Positionen auf jeder Ebene ab', () => {
  const values = [0, -1, 1.5, '1', null, undefined]

  for (const position of values) {
    const hub = createHub()
    hub.modules[0].position = position
    getChapter(hub).position = position
    getChapter(hub).learningNodes[0].position = position
    const result = validateLearningHub(hub)
    assertHasError(result, LEARNING_HUB_ERROR_CODES.INVALID_POSITION, '$.modules[0].position')
    assertHasError(result, LEARNING_HUB_ERROR_CODES.INVALID_POSITION, '$.modules[0].chapters[0].position')
    assertHasError(
      result,
      LEARNING_HUB_ERROR_CODES.INVALID_POSITION,
      '$.modules[0].chapters[0].learningNodes[0].position'
    )
  }
})

test('lehnt doppelte Geschwisterpositionen auf jeder Ebene ab', () => {
  const hub = createHub()
  hub.modules[1].position = hub.modules[0].position
  hub.modules[0].chapters.push({
    id: 'demo-chapter-second',
    title: 'Zweites erfundenes Kapitel',
    position: getChapter(hub).position,
    learningNodes: [],
  })
  getChapter(hub).learningNodes[1].position = getChapter(hub).learningNodes[0].position

  const result = validateLearningHub(hub)

  assertHasError(result, LEARNING_HUB_ERROR_CODES.DUPLICATE_SIBLING_POSITION, '$.modules[1].position')
  assertHasError(result, LEARNING_HUB_ERROR_CODES.DUPLICATE_SIBLING_POSITION, '$.modules[0].chapters[1].position')
  assertHasError(
    result,
    LEARNING_HUB_ERROR_CODES.DUPLICATE_SIBLING_POSITION,
    '$.modules[0].chapters[0].learningNodes[1].position'
  )
})

test('akzeptiert gleiche Positionen unter verschiedenen Eltern', () => {
  const hub = createHub()
  getChapter(hub, 1).learningNodes.push({
    id: 'demo-node-other-parent',
    title: 'Karte unter anderem Kapitel',
    content: 'Diese unabhängig erfundene Karte besitzt lokal Position eins.',
    position: 1,
  })

  assert.equal(getChapter(hub).position, getChapter(hub, 1).position)
  assert.equal(getChapter(hub).learningNodes[0].position, getChapter(hub, 1).learningNodes[0].position)
  assert.deepEqual(validateLearningHub(hub), { ok: true, errors: [] })
})

test('sammelt Validierungsfehler vollständig in stabiler Form', () => {
  const hub = createHub()
  hub.schemaVersion = 1
  hub.dataOrigin = 'demo'
  hub.modules[0].id = ' module '
  hub.modules[0].title = ''
  hub.modules[0].position = 0
  hub.modules[0].chapters = []

  assert.deepEqual(validateLearningHub(hub), {
    ok: false,
    errors: [
      { code: 'unsupportedSchemaVersion', path: '$.schemaVersion', message: 'Die LearningHub-Schemaversion wird nicht unterstützt.' },
      { code: 'invalidDataOrigin', path: '$.dataOrigin', message: 'dataOrigin muss synthetic oder private sein.' },
      { code: 'invalidId', path: '$.modules[0].id', message: 'Die ID muss eine nicht leere, getrimmte Zeichenfolge sein.' },
      { code: 'invalidTitle', path: '$.modules[0].title', message: 'Der Titel muss eine nicht leere, getrimmte Zeichenfolge sein.' },
      { code: 'invalidPosition', path: '$.modules[0].position', message: 'Die Position muss eine positive Ganzzahl sein.' },
      { code: 'moduleRequiresChapter', path: '$.modules[0].chapters', message: 'Ein persistiertes LearningModule benötigt mindestens ein LearningChapter.' },
    ],
  })
})

test('gibt ausschließlich stabile Fehlerobjekte zurück', () => {
  const hub = createHub()
  hub.modules[0].chapters = [null]

  const result = validateLearningHub(hub)

  result.errors.forEach((error) => {
    assert.deepEqual(Object.keys(error), ['code', 'path', 'message'])
    assert.equal(typeof error.code, 'string')
    assert.equal(typeof error.path, 'string')
    assert.equal(typeof error.message, 'string')
  })
})

test('verändert gültige und ungültige Eingabedaten nicht', () => {
  const validHub = createHub()
  const validSnapshot = structuredClone(validHub)
  validateLearningHub(validHub)
  assert.deepEqual(validHub, validSnapshot)

  const invalidHub = createHub()
  invalidHub.modules[0].id = ' invalid '
  invalidHub.modules[0].chapters[0].learningNodes[0].content = ''
  const invalidSnapshot = structuredClone(invalidHub)
  validateLearningHub(invalidHub)
  assert.deepEqual(invalidHub, invalidSnapshot)
})

test('validiert auch tief eingefrorene Eingaben ohne Mutation', () => {
  assert.deepEqual(validateLearningHub(LEARNING_HUB_DEMO), {
    ok: true,
    errors: [],
  })
})

test('exportiert sämtliche Demo-Daten tief eingefroren', () => {
  assertDeepFrozen(LEARNING_HUB_DEMO)
  assert.throws(() => {
    LEARNING_HUB_DEMO.modules[0].title = 'Verändert'
  }, TypeError)
  assert.throws(() => {
    LEARNING_HUB_DEMO.modules.push({})
  }, TypeError)
})

test('enthält nur die Schema-2-Strukturdaten', () => {
  const serializedDemo = JSON.stringify(LEARNING_HUB_DEMO)
  const forbiddenFields = [
    'course',
    'units',
    'parentId',
    'nodeType',
    'isTrackable',
    'isCompleted',
    'isSelected',
    'progress',
    'status',
    'actions',
    'questions',
    'attempts',
    'competence',
    'timestamp',
    'versions',
  ]

  forbiddenFields.forEach((field) => {
    assert.equal(serializedDemo.includes(`${field}`), false)
  })
})
