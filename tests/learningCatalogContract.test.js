import assert from 'node:assert/strict'
import test from 'node:test'

import { LEARNING_CATALOG_DEMO } from '../src/data/mock/learningCatalogDemo.js'
import {
  LEARNING_CATALOG_ERROR_CODES,
  validateLearningCatalog,
} from '../src/modules/learning-hub/learningCatalogContract.js'

function createCatalog() {
  return structuredClone(LEARNING_CATALOG_DEMO)
}

function getNodes(catalog, unitIndex = 0) {
  return catalog.course.modules[0].units[unitIndex].learningNodes
}

function assertHasError(result, code) {
  assert.equal(result.ok, false)
  assert.ok(result.errors.some((error) => error.code === code))
}

test('akzeptiert den synthetischen Demo-Katalog', () => {
  assert.deepEqual(validateLearningCatalog(LEARNING_CATALOG_DEMO), {
    ok: true,
    errors: [],
  })
})

test('lehnt eine unbekannte schemaVersion strukturiert ab', () => {
  const catalog = createCatalog()
  catalog.schemaVersion = 2

  assertHasError(
    validateLearningCatalog(catalog),
    LEARNING_CATALOG_ERROR_CODES.UNSUPPORTED_SCHEMA_VERSION
  )
})

test('lehnt ungültige dataOrigin-Werte ab', () => {
  const catalog = createCatalog()
  catalog.dataOrigin = 'demo'

  assertHasError(
    validateLearningCatalog(catalog),
    LEARNING_CATALOG_ERROR_CODES.INVALID_DATA_ORIGIN
  )
})

test('lehnt leere und nicht getrimmte IDs sowie Titel ab', () => {
  const catalog = createCatalog()
  catalog.course.id = ''
  catalog.course.modules[0].title = ' Nicht getrimmt '
  getNodes(catalog)[0].id = ' demo-chapter '
  getNodes(catalog)[1].title = ' '

  const result = validateLearningCatalog(catalog)

  assertHasError(result, LEARNING_CATALOG_ERROR_CODES.INVALID_ID)
  assertHasError(result, LEARNING_CATALOG_ERROR_CODES.INVALID_TITLE)
})

test('lehnt katalogweit doppelte IDs ab', () => {
  const catalog = createCatalog()
  getNodes(catalog)[0].id = catalog.course.id

  assertHasError(
    validateLearningCatalog(catalog),
    LEARNING_CATALOG_ERROR_CODES.DUPLICATE_ID
  )
})

test('lehnt ungültige Knotentypen ab', () => {
  const catalog = createCatalog()
  getNodes(catalog)[0].nodeType = 'topic'

  assertHasError(
    validateLearningCatalog(catalog),
    LEARNING_CATALOG_ERROR_CODES.INVALID_NODE_TYPE
  )
})

test('lehnt fehlende Elternknoten ab', () => {
  const catalog = createCatalog()
  getNodes(catalog)[1].parentId = 'demo-node-missing'

  assertHasError(
    validateLearningCatalog(catalog),
    LEARNING_CATALOG_ERROR_CODES.MISSING_PARENT
  )
})

test('lehnt falsche Eltern-Kind-Typen ab', () => {
  const catalog = createCatalog()
  getNodes(catalog)[2].parentId = getNodes(catalog)[0].id

  assertHasError(
    validateLearningCatalog(catalog),
    LEARNING_CATALOG_ERROR_CODES.INVALID_PARENT_TYPE
  )
})

test('lehnt Elternverweise über Unit-Grenzen ab', () => {
  const catalog = createCatalog()
  const secondUnit = {
    id: 'demo-unit-second',
    title: 'Demo-Unit: Zweiter Weg',
    position: 2,
    learningNodes: [
      {
        id: 'demo-section-cross-unit',
        nodeType: 'section',
        title: 'Demo-Abschnitt: Fremder Bezug',
        position: 1,
        parentId: getNodes(catalog)[0].id,
        isTrackable: false,
      },
    ],
  }
  catalog.course.modules[0].units.push(secondUnit)

  assertHasError(
    validateLearningCatalog(catalog),
    LEARNING_CATALOG_ERROR_CODES.CROSS_UNIT_PARENT
  )
})

test('lehnt ungültige und doppelte Geschwisterpositionen ab', () => {
  const catalog = createCatalog()
  const nodes = getNodes(catalog)
  nodes[0].position = 0
  nodes.push({
    id: 'demo-section-duplicate-position',
    nodeType: 'section',
    title: 'Demo-Abschnitt: Gleiche Position',
    position: nodes[1].position,
    parentId: nodes[1].parentId,
    isTrackable: false,
  })

  const result = validateLearningCatalog(catalog)

  assertHasError(result, LEARNING_CATALOG_ERROR_CODES.INVALID_POSITION)
  assertHasError(
    result,
    LEARNING_CATALOG_ERROR_CODES.DUPLICATE_SIBLING_POSITION
  )
})

test('lehnt ungültige Trackable-Kennzeichnungen ab', () => {
  const catalog = createCatalog()
  getNodes(catalog)[0].isTrackable = false
  getNodes(catalog)[1].isTrackable = true

  assertHasError(
    validateLearningCatalog(catalog),
    LEARNING_CATALOG_ERROR_CODES.INVALID_TRACKABLE
  )
})

test('lehnt chapter-Knoten mit parentId ab', () => {
  const catalog = createCatalog()
  getNodes(catalog)[0].parentId = getNodes(catalog)[1].id

  assertHasError(
    validateLearningCatalog(catalog),
    LEARNING_CATALOG_ERROR_CODES.INVALID_CHAPTER_PARENT
  )
})

test('lehnt Zyklen in Elternverweisen ab', () => {
  const catalog = createCatalog()
  const nodes = getNodes(catalog)
  nodes[0].parentId = nodes[2].id

  assertHasError(
    validateLearningCatalog(catalog),
    LEARNING_CATALOG_ERROR_CODES.CYCLE_DETECTED
  )
})

test('verändert die Eingabedaten während der Validierung nicht', () => {
  const catalog = createCatalog()
  const snapshot = structuredClone(catalog)

  validateLearningCatalog(catalog)

  assert.deepEqual(catalog, snapshot)
})

test('exportiert den Demo-Katalog tief unveränderlich', () => {
  assert.equal(Object.isFrozen(LEARNING_CATALOG_DEMO), true)
  assert.equal(Object.isFrozen(LEARNING_CATALOG_DEMO.course), true)
  assert.equal(Object.isFrozen(LEARNING_CATALOG_DEMO.course.modules), true)
  assert.equal(
    Object.isFrozen(LEARNING_CATALOG_DEMO.course.modules[0].units[0].learningNodes[0]),
    true
  )
  assert.throws(() => {
    LEARNING_CATALOG_DEMO.course.title = 'Verändert'
  }, TypeError)
})
