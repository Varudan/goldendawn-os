import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createPrivateLearningHubDemoSeed,
  LEARNING_ARTIFACT_DEMO,
  LEARNING_HUB_DEMO,
  LEARNING_HUB_DEMO_SEED,
  LEARNING_TEST_BANK_DEMO,
} from '../src/data/mock/learningHubDemo.js'
import {
  validateLearningArtifactStore,
} from '../src/modules/learning-hub/learningArtifactContract.js'
import {
  validateLearningHub,
} from '../src/modules/learning-hub/learningHubContract.js'
import {
  validateLearningTestBank,
} from '../src/modules/learning-hub/learningTestBankContract.js'
import {
  createLearningHubDemoInitializer,
} from '../src/services/learningHubDemoInitializer.js'
import { createLearningHubService } from '../src/services/learningHubService.js'
import { createLearningTestService } from '../src/services/learningTestService.js'
import {
  createLearningArtifactStorage,
  LEARNING_ARTIFACT_STORAGE_KEY,
} from '../src/storage/learningArtifactStorage.js'
import {
  createLearningHubDemoInitializationStorage,
  LEARNING_HUB_DEMO_INITIALIZATION_STORAGE_KEY,
} from '../src/storage/learningHubDemoInitializationStorage.js'
import {
  createLearningHubStorage,
  LEARNING_HUB_STORAGE_KEY,
} from '../src/storage/learningHubStorage.js'
import {
  LEARNING_PROGRESS_STORAGE_KEY,
} from '../src/storage/learningProgressStorage.js'
import {
  createLearningTestAttemptStorage,
  LEARNING_TEST_ATTEMPT_STORAGE_KEY,
} from '../src/storage/learningTestAttemptStorage.js'
import {
  createLearningTestBankStorage,
  LEARNING_TEST_BANK_STORAGE_KEY,
} from '../src/storage/learningTestBankStorage.js'
import { createStorageAdapter } from '../src/storage/storageAdapter.js'
import { createStorageError, FakeStorage } from './helpers/fakeStorage.js'

const DEMO_MODULE_ID = 'demo-module-ai-foundations'

const EXPECTED_STRUCTURE = Object.freeze([
  Object.freeze({
    title: 'KI einordnen',
    nodes: Object.freeze([
      'KI, Machine Learning und Deep Learning',
      'Schwache und starke KI',
    ]),
  }),
  Object.freeze({
    title: 'Datenqualität',
    nodes: Object.freeze(['Garbage in, garbage out']),
  }),
  Object.freeze({
    title: 'Transformer verstehen',
    nodes: Object.freeze(['Attention und Kontext']),
  }),
])

const EXPECTED_QUESTION_COUNTS = Object.freeze({
  'demo-node-ai-ml-dl': 2,
  'demo-node-weak-strong-ai': 1,
  'demo-node-garbage-in-out': 2,
  'demo-node-attention-context': 2,
})

function parseStoredValue(fakeStorage, storageKey) {
  const serializedValue = fakeStorage.peek(storageKey)

  return serializedValue === null ? null : JSON.parse(serializedValue)
}

function createSystem({
  initialEntries = [],
  fakeStorage = new FakeStorage(initialEntries),
  createDemoSeed,
} = {}) {
  const storageAdapter = createStorageAdapter(fakeStorage)
  const learningHubStorage = createLearningHubStorage(storageAdapter)
  const learningArtifactStorage = createLearningArtifactStorage(
    storageAdapter
  )
  const learningTestBankStorage = createLearningTestBankStorage(
    storageAdapter
  )
  const learningTestAttemptStorage = createLearningTestAttemptStorage(
    storageAdapter
  )
  const learningHubDemoInitializationStorage =
    createLearningHubDemoInitializationStorage(storageAdapter)
  const learningHubDemoInitializer = createLearningHubDemoInitializer({
    learningHubDemoInitializationStorage,
    learningHubStorage,
    learningArtifactStorage,
    learningTestBankStorage,
    ...(createDemoSeed ? { createDemoSeed } : {}),
  })
  const learningHubService = createLearningHubService({
    learningHubStorage,
  })
  const learningTestService = createLearningTestService({
    learningHubService,
    learningTestBankStorage,
    learningTestAttemptStorage,
  })

  return {
    fakeStorage,
    learningHubDemoInitializer,
    learningHubService,
    learningTestService,
  }
}

function initializeFreshSystem(options) {
  const system = createSystem(options)
  const result =
    system.learningHubDemoInitializer.initializeLearningHubDemo()

  assert.deepEqual(result, {
    ok: true,
    status: 'seeded',
    changed: true,
    seeded: true,
  })

  return system
}

function getStoredSeed(system) {
  return {
    learningHub: parseStoredValue(
      system.fakeStorage,
      LEARNING_HUB_STORAGE_KEY
    ),
    artifactStore: parseStoredValue(
      system.fakeStorage,
      LEARNING_ARTIFACT_STORAGE_KEY
    ),
    testBank: parseStoredValue(
      system.fakeStorage,
      LEARNING_TEST_BANK_STORAGE_KEY
    ),
  }
}

function getAllNodes(learningHub) {
  return learningHub.modules.flatMap((learningModule) => (
    learningModule.chapters.flatMap((chapter) => chapter.learningNodes)
  ))
}

test('initialisiert einen vollständig fehlenden Zustand mit genau einem Demo-Modul', () => {
  const system = initializeFreshSystem()
  const storedSeed = getStoredSeed(system)
  const marker = parseStoredValue(
    system.fakeStorage,
    LEARNING_HUB_DEMO_INITIALIZATION_STORAGE_KEY
  )

  assert.equal(storedSeed.learningHub.modules.length, 1)
  assert.equal(
    storedSeed.learningHub.modules[0].title,
    '[Demo] KI-Grundlagen – vom Datensatz zum Transformer'
  )
  assert.deepEqual(marker, {
    schemaVersion: 1,
    initializationCompleted: true,
    decision: 'seeded',
  })
  assert.equal(
    system.fakeStorage.peek(LEARNING_PROGRESS_STORAGE_KEY),
    null
  )
  assert.equal(
    system.fakeStorage.peek(LEARNING_TEST_ATTEMPT_STORAGE_KEY),
    null
  )
})

test('speichert exakt drei Kapitel und vier Nodes in der festgelegten Reihenfolge', () => {
  const { learningHub } = getStoredSeed(initializeFreshSystem())
  const learningModule = learningHub.modules[0]

  assert.equal(learningModule.chapters.length, 3)
  assert.equal(getAllNodes(learningHub).length, 4)
  assert.deepEqual(
    learningModule.chapters.map((chapter) => ({
      title: chapter.title,
      nodes: chapter.learningNodes.map((learningNode) => learningNode.title),
    })),
    EXPECTED_STRUCTURE
  )
})

test('ordnet jedem Node genau eine ausgefüllte Notiz und Zusammenfassung zu', () => {
  const { learningHub, artifactStore } = getStoredSeed(
    initializeFreshSystem()
  )

  assert.equal(artifactStore.artifacts.length, 8)

  for (const learningNode of getAllNodes(learningHub)) {
    const artifacts = artifactStore.artifacts.filter(
      (artifact) => artifact.learningNodeId === learningNode.id
    )

    assert.deepEqual(
      artifacts.map((artifact) => artifact.type).sort(),
      ['note', 'summary']
    )
    assert.ok(artifacts.every((artifact) => artifact.content.length > 40))
  }
})

test('ordnet jedem Node genau die geforderte Zahl von Fragen zu', () => {
  const { learningHub, testBank } = getStoredSeed(initializeFreshSystem())

  for (const learningNode of getAllNodes(learningHub)) {
    assert.equal(
      testBank.questions.filter(
        (question) => question.learningNodeId === learningNode.id
      ).length,
      EXPECTED_QUESTION_COUNTS[learningNode.id]
    )
  }
})

test('speichert insgesamt exakt sieben Testfragen', () => {
  const { testBank } = getStoredSeed(initializeFreshSystem())

  assert.equal(testBank.questions.length, 7)
})

test('verwendet eindeutige IDs und vollständig konsistente Referenzen', () => {
  const { learningHub, artifactStore, testBank } = getStoredSeed(
    initializeFreshSystem()
  )
  const modulesById = new Map(
    learningHub.modules.map((learningModule) => [
      learningModule.id,
      learningModule,
    ])
  )
  const chapterReferences = new Map()
  const nodeReferences = new Map()
  const hubIds = new Set()

  learningHub.modules.forEach((learningModule) => {
    hubIds.add(learningModule.id)
    learningModule.chapters.forEach((chapter) => {
      hubIds.add(chapter.id)
      chapterReferences.set(chapter.id, learningModule.id)
      chapter.learningNodes.forEach((learningNode) => {
        hubIds.add(learningNode.id)
        nodeReferences.set(learningNode.id, {
          moduleId: learningModule.id,
          chapterId: chapter.id,
        })
      })
    })
  })

  assert.equal(hubIds.size, 8)
  assert.equal(
    new Set(artifactStore.artifacts.map((artifact) => artifact.id)).size,
    artifactStore.artifacts.length
  )

  const bankIds = testBank.questions.flatMap((question) => [
    question.id,
    ...question.options.map((option) => option.id),
  ])

  assert.equal(new Set(bankIds).size, bankIds.length)

  for (const entry of [...artifactStore.artifacts, ...testBank.questions]) {
    const nodeReference = nodeReferences.get(entry.learningNodeId)

    assert.equal(modulesById.has(entry.moduleId), true)
    assert.equal(chapterReferences.get(entry.chapterId), entry.moduleId)
    assert.deepEqual(nodeReference, {
      moduleId: entry.moduleId,
      chapterId: entry.chapterId,
    })
  }
})

test('besitzt pro Frage genau eine vorhandene richtige Antwort', () => {
  const { testBank } = getStoredSeed(initializeFreshSystem())

  for (const question of testBank.questions) {
    assert.ok([3, 4].includes(question.options.length))
    assert.equal(
      question.options.filter(
        (option) => option.id === question.correctOptionId
      ).length,
      1
    )
    assert.ok(question.explanation.length > 30)
  }
})

test('enthält leichte, mittlere und schwere Verständnisfragen', () => {
  const { testBank } = getStoredSeed(initializeFreshSystem())
  const difficulties = new Set(
    testBank.questions.map((question) => question.difficulty)
  )

  assert.deepEqual([...difficulties].sort(), ['easy', 'hard', 'medium'])
})

test('lässt Versuchshistorie, Antworten und Ergebnisse vollständig leer', () => {
  const system = initializeFreshSystem()
  const historyResult = system.learningTestService.loadAttemptHistory({
    moduleId: DEMO_MODULE_ID,
  })

  assert.deepEqual(historyResult, {
    ok: true,
    status: 'attemptHistoryEmpty',
    changed: false,
    attempts: [],
  })
  assert.equal(
    system.fakeStorage.peek(LEARNING_TEST_ATTEMPT_STORAGE_KEY),
    null
  )
})

test('bleibt bei einem zweiten Initialisierungsaufruf bytegenau idempotent', () => {
  const system = initializeFreshSystem()
  const snapshot = new Map([
    [LEARNING_HUB_STORAGE_KEY, system.fakeStorage.peek(LEARNING_HUB_STORAGE_KEY)],
    [LEARNING_ARTIFACT_STORAGE_KEY, system.fakeStorage.peek(LEARNING_ARTIFACT_STORAGE_KEY)],
    [LEARNING_TEST_BANK_STORAGE_KEY, system.fakeStorage.peek(LEARNING_TEST_BANK_STORAGE_KEY)],
    [LEARNING_HUB_DEMO_INITIALIZATION_STORAGE_KEY, system.fakeStorage.peek(LEARNING_HUB_DEMO_INITIALIZATION_STORAGE_KEY)],
  ])
  const writeCalls = system.fakeStorage.setItemCalls
  const secondResult =
    system.learningHubDemoInitializer.initializeLearningHubDemo()

  assert.deepEqual(secondResult, {
    ok: true,
    status: 'alreadyInitialized',
    changed: false,
    seeded: false,
  })
  assert.equal(system.fakeStorage.setItemCalls, writeCalls)

  for (const [storageKey, serializedValue] of snapshot) {
    assert.equal(system.fakeStorage.peek(storageKey), serializedValue)
  }
})

test('erhält bearbeitete Demo-Inhalte bei einem späteren Neustart', () => {
  const system = initializeFreshSystem()
  const renameResult = system.learningHubService.renameModule({
    moduleId: DEMO_MODULE_ID,
    title: '[Demo] Eigene Bearbeitung bleibt erhalten',
  })

  assert.equal(renameResult.ok, true)
  const editedBytes = system.fakeStorage.peek(LEARNING_HUB_STORAGE_KEY)
  const restartResult =
    system.learningHubDemoInitializer.initializeLearningHubDemo()

  assert.equal(restartResult.status, 'alreadyInitialized')
  assert.equal(
    system.fakeStorage.peek(LEARNING_HUB_STORAGE_KEY),
    editedBytes
  )
  assert.equal(
    parseStoredValue(system.fakeStorage, LEARNING_HUB_STORAGE_KEY)
      .modules[0].title,
    '[Demo] Eigene Bearbeitung bleibt erhalten'
  )
})

test('legt nach späterem Löschen bei erhaltenem Marker kein Demo erneut an', () => {
  const system = initializeFreshSystem()

  system.fakeStorage.removeItem(LEARNING_HUB_STORAGE_KEY)
  system.fakeStorage.removeItem(LEARNING_ARTIFACT_STORAGE_KEY)
  system.fakeStorage.removeItem(LEARNING_TEST_BANK_STORAGE_KEY)

  const restartResult =
    system.learningHubDemoInitializer.initializeLearningHubDemo()

  assert.equal(restartResult.status, 'alreadyInitialized')
  assert.equal(system.fakeStorage.peek(LEARNING_HUB_STORAGE_KEY), null)
  assert.equal(system.fakeStorage.peek(LEARNING_ARTIFACT_STORAGE_KEY), null)
  assert.equal(system.fakeStorage.peek(LEARNING_TEST_BANK_STORAGE_KEY), null)
  assert.notEqual(
    system.fakeStorage.peek(
      LEARNING_HUB_DEMO_INITIALIZATION_STORAGE_KEY
    ),
    null
  )
})

test('ein bereits vorhandener selbst leerer LearningHub verhindert das Seeding', () => {
  const existingHub = JSON.stringify({
    schemaVersion: 2,
    dataOrigin: 'private',
    modules: [],
  })
  const system = createSystem({
    initialEntries: [[LEARNING_HUB_STORAGE_KEY, existingHub]],
  })
  const result =
    system.learningHubDemoInitializer.initializeLearningHubDemo()

  assert.equal(result.status, 'skippedExistingData')
  assert.equal(system.fakeStorage.peek(LEARNING_HUB_STORAGE_KEY), existingHub)
  assert.equal(system.fakeStorage.peek(LEARNING_ARTIFACT_STORAGE_KEY), null)
  assert.equal(system.fakeStorage.peek(LEARNING_TEST_BANK_STORAGE_KEY), null)
})

test('ein bereits vorhandener selbst leerer Artifact-Store verhindert das Seeding', () => {
  const existingArtifacts = JSON.stringify({
    schemaVersion: 1,
    dataOrigin: 'private',
    artifacts: [],
  })
  const system = createSystem({
    initialEntries: [[LEARNING_ARTIFACT_STORAGE_KEY, existingArtifacts]],
  })
  const result =
    system.learningHubDemoInitializer.initializeLearningHubDemo()

  assert.equal(result.status, 'skippedExistingData')
  assert.equal(
    system.fakeStorage.peek(LEARNING_ARTIFACT_STORAGE_KEY),
    existingArtifacts
  )
  assert.equal(system.fakeStorage.peek(LEARNING_HUB_STORAGE_KEY), null)
  assert.equal(system.fakeStorage.peek(LEARNING_TEST_BANK_STORAGE_KEY), null)
})

test('eine bereits vorhandene selbst leere Testbank verhindert das Seeding', () => {
  const existingTestBank = JSON.stringify({
    schemaVersion: 1,
    dataOrigin: 'private',
    questions: [],
  })
  const system = createSystem({
    initialEntries: [[LEARNING_TEST_BANK_STORAGE_KEY, existingTestBank]],
  })
  const result =
    system.learningHubDemoInitializer.initializeLearningHubDemo()

  assert.equal(result.status, 'skippedExistingData')
  assert.equal(
    system.fakeStorage.peek(LEARNING_TEST_BANK_STORAGE_KEY),
    existingTestBank
  )
  assert.equal(system.fakeStorage.peek(LEARNING_HUB_STORAGE_KEY), null)
  assert.equal(system.fakeStorage.peek(LEARNING_ARTIFACT_STORAGE_KEY), null)
})

test('jeder vorhandene Marker gilt ohne erneutes Seeding als abgeschlossene Entscheidung', () => {
  const existingMarker = '{nicht-mehr-auswertbarer-marker'
  const system = createSystem({
    initialEntries: [[
      LEARNING_HUB_DEMO_INITIALIZATION_STORAGE_KEY,
      existingMarker,
    ]],
  })
  const result =
    system.learningHubDemoInitializer.initializeLearningHubDemo()

  assert.deepEqual(result, {
    ok: true,
    status: 'alreadyInitialized',
    changed: false,
    seeded: false,
  })
  assert.equal(
    system.fakeStorage.peek(
      LEARNING_HUB_DEMO_INITIALIZATION_STORAGE_KEY
    ),
    existingMarker
  )
  assert.equal(system.fakeStorage.setItemCalls, 0)
})

test('erhält in allen Skip-Fällen sämtliche vorhandenen Fachstores bytegleich', () => {
  const existingEntries = [
    [LEARNING_HUB_STORAGE_KEY, ' {"vorhanden":"hub"} '],
    [LEARNING_ARTIFACT_STORAGE_KEY, '{broken-artifacts'],
    [LEARNING_TEST_BANK_STORAGE_KEY, '["bestehende","bank"]'],
  ]
  const system = createSystem({ initialEntries: existingEntries })
  const result =
    system.learningHubDemoInitializer.initializeLearningHubDemo()

  assert.equal(result.status, 'skippedExistingData')

  for (const [storageKey, rawValue] of existingEntries) {
    assert.equal(system.fakeStorage.peek(storageKey), rawValue)
  }

  assert.deepEqual(
    parseStoredValue(
      system.fakeStorage,
      LEARNING_HUB_DEMO_INITIALIZATION_STORAGE_KEY
    ),
    {
      schemaVersion: 1,
      initializationCompleted: true,
      decision: 'skippedExistingData',
    }
  )
})

test('rollt einen simulierten Fehler während der koordinierten Speicherung vollständig zurück', () => {
  class FailingTestBankStorage extends FakeStorage {
    setItem(key, value) {
      if (String(key) === LEARNING_TEST_BANK_STORAGE_KEY) {
        this.setItemCalls += 1
        throw createStorageError('QuotaExceededError')
      }

      super.setItem(key, value)
    }
  }

  const fakeStorage = new FailingTestBankStorage()
  const system = createSystem({ fakeStorage })
  const result =
    system.learningHubDemoInitializer.initializeLearningHubDemo()

  assert.equal(result.ok, false)
  assert.equal(result.status, 'storageFailed')
  assert.equal(result.error.code, 'learningHubDemoInitializationWriteFailed')
  assert.equal(fakeStorage.peek(LEARNING_HUB_STORAGE_KEY), null)
  assert.equal(fakeStorage.peek(LEARNING_ARTIFACT_STORAGE_KEY), null)
  assert.equal(fakeStorage.peek(LEARNING_TEST_BANK_STORAGE_KEY), null)
  assert.equal(
    fakeStorage.peek(LEARNING_HUB_DEMO_INITIALIZATION_STORAGE_KEY),
    null
  )
  assert.equal(fakeStorage.removeItemCalls, 2)
})

test('besteht mit synthetischer Quelle und privater Arbeitskopie alle Produktionsvalidatoren', () => {
  assert.deepEqual(validateLearningHub(LEARNING_HUB_DEMO), {
    ok: true,
    errors: [],
  })
  assert.deepEqual(validateLearningArtifactStore(LEARNING_ARTIFACT_DEMO), {
    ok: true,
    errors: [],
  })
  assert.deepEqual(validateLearningTestBank(LEARNING_TEST_BANK_DEMO), {
    ok: true,
    errors: [],
  })

  const privateSeed = createPrivateLearningHubDemoSeed()

  assert.deepEqual(validateLearningHub(privateSeed.learningHub), {
    ok: true,
    errors: [],
  })
  assert.deepEqual(
    validateLearningArtifactStore(privateSeed.artifactStore),
    { ok: true, errors: [] }
  )
  assert.deepEqual(validateLearningTestBank(privateSeed.testBank), {
    ok: true,
    errors: [],
  })
  assert.equal(Object.isFrozen(LEARNING_HUB_DEMO_SEED), true)
})

test('validiert den vollständigen Seed vor dem ersten Schreibzugriff', () => {
  const invalidSeed = createPrivateLearningHubDemoSeed()

  invalidSeed.testBank.questions[0].correctOptionId =
    'demo-option-does-not-exist'

  const system = createSystem({
    createDemoSeed() {
      return invalidSeed
    },
  })
  const result =
    system.learningHubDemoInitializer.initializeLearningHubDemo()

  assert.equal(result.ok, false)
  assert.equal(result.status, 'validationFailed')
  assert.equal(result.error.code, 'invalidLearningHubDemoSeed')
  assert.equal(system.fakeStorage.setItemCalls, 0)
  assert.equal(system.fakeStorage.peek(LEARNING_HUB_STORAGE_KEY), null)
  assert.equal(system.fakeStorage.peek(LEARNING_ARTIFACT_STORAGE_KEY), null)
  assert.equal(system.fakeStorage.peek(LEARNING_TEST_BANK_STORAGE_KEY), null)
  assert.equal(
    system.fakeStorage.peek(
      LEARNING_HUB_DEMO_INITIALIZATION_STORAGE_KEY
    ),
    null
  )
})
