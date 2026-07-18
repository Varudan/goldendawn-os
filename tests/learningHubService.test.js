import assert from 'node:assert/strict'
import test from 'node:test'

import { validateLearningHub } from '../src/modules/learning-hub/learningHubContract.js'
import { createLearningHubService } from '../src/services/learningHubService.js'
import { createStorageAdapter } from '../src/storage/storageAdapter.js'
import {
  createLearningHubStorage,
  LEARNING_HUB_STORAGE_KEY,
} from '../src/storage/learningHubStorage.js'
import { FakeStorage } from './helpers/fakeStorage.js'

const EMPTY_PRIVATE_HUB = Object.freeze({
  schemaVersion: 2,
  dataOrigin: 'private',
  modules: Object.freeze([]),
})

function cloneValue(value) {
  return structuredClone(value)
}

// Alle Inhalte dieser Fixtures sind frei erfunden und ausschließlich synthetisch.
function createPrivateHubFixture() {
  return {
    schemaVersion: 2,
    dataOrigin: 'private',
    modules: [
      {
        id: 'module-stellar-map',
        title: 'Synthetische Sternkarten',
        position: 2,
        chapters: [
          {
            id: 'chapter-coordinate-grid',
            title: 'Fiktives Koordinatengitter',
            position: 3,
            learningNodes: [
              {
                id: 'node-grid-axes',
                title: 'Erfundene Gitterachsen',
                content: 'Synthetischer Kartentext über zwei gedachte Achsen.',
                position: 2,
              },
              {
                id: 'node-grid-cells',
                title: 'Erfundene Gitterzellen',
                content: 'Synthetischer Kartentext über gleich große Felder.',
                position: 11,
              },
            ],
          },
          {
            id: 'chapter-signal-patterns',
            title: 'Fiktive Signalmuster',
            position: 8,
            learningNodes: [
              {
                id: 'node-signal-pulses',
                title: 'Erfundene Signalpulse',
                content: 'Synthetischer Text über ein regelmäßiges Pulsmuster.',
                position: 5,
              },
            ],
          },
        ],
      },
      {
        id: 'module-glass-garden',
        title: 'Fiktiver Glasgarten',
        position: 9,
        chapters: [
          {
            id: 'chapter-crystal-leaves',
            title: 'Erfundene Kristallblätter',
            position: 4,
            learningNodes: [
              {
                id: 'node-leaf-facets',
                title: 'Erfundene Blattfacetten',
                content: 'Synthetischer Text über spiegelnde geometrische Flächen.',
                position: 1,
              },
            ],
          },
        ],
      },
    ],
  }
}

function createIdGenerator(...generatedValues) {
  const calls = []
  let valueIndex = 0

  function generateLearningHubId(entityType) {
    calls.push(entityType)

    const value =
      valueIndex < generatedValues.length
        ? generatedValues[valueIndex]
        : generatedValues.at(-1)
    valueIndex += 1

    if (value instanceof Error) {
      throw value
    }

    return value
  }

  return { calls, generateLearningHubId }
}

function createStorageDouble({
  initialHub,
  loadResult,
  saveResult,
  throwOnLoad = false,
  throwOnSave = false,
} = {}) {
  let storedHub = initialHub === undefined ? null : cloneValue(initialHub)
  const state = {
    loadCalls: 0,
    saveCalls: 0,
    savedArguments: [],
  }

  const learningHubStorage = {
    loadLearningHub() {
      state.loadCalls += 1

      if (throwOnLoad) {
        throw new Error('Synthetischer Lesefehler')
      }

      if (loadResult !== undefined) {
        const result =
          typeof loadResult === 'function' ? loadResult() : loadResult
        return cloneValue(result)
      }

      if (storedHub === null) {
        return { ok: true, status: 'missing' }
      }

      // Absichtlich dieselbe Referenz: Der Service muss auch DI-Rückgaben
      // unverändert lassen und seine Rückgaben defensiv entkoppeln.
      return { ok: true, status: 'found', hub: storedHub }
    },

    saveLearningHub(learningHub) {
      state.saveCalls += 1
      state.savedArguments.push(learningHub)

      assert.deepEqual(validateLearningHub(learningHub), {
        ok: true,
        errors: [],
      })
      assert.equal(learningHub.dataOrigin, 'private')

      if (throwOnSave) {
        throw new Error('Synthetischer Schreibfehler')
      }

      const configuredResult =
        typeof saveResult === 'function'
          ? saveResult(learningHub)
          : saveResult

      if (configuredResult !== undefined) {
        const result = cloneValue(configuredResult)

        if (!result.ok) {
          return result
        }
      }

      storedHub = cloneValue(learningHub)
      return configuredResult === undefined
        ? { ok: true, status: 'saved' }
        : cloneValue(configuredResult)
    },
  }

  return {
    learningHubStorage,
    peekStoredHub() {
      return storedHub === null ? null : cloneValue(storedHub)
    },
    getStoredReference() {
      return storedHub
    },
    replaceStoredHub(learningHub) {
      storedHub = cloneValue(learningHub)
    },
    state,
  }
}

function createService(storageSystem, generatedIds = []) {
  const idGenerator = createIdGenerator(...generatedIds)
  const service = createLearningHubService({
    learningHubStorage: storageSystem.learningHubStorage,
    generateLearningHubId: idGenerator.generateLearningHubId,
  })

  return { idGenerator, service }
}

function getChapter(learningHub, moduleIndex = 0, chapterIndex = 0) {
  return learningHub.modules[moduleIndex].chapters[chapterIndex]
}

function getLearningNode(
  learningHub,
  moduleIndex = 0,
  chapterIndex = 0,
  learningNodeIndex = 0
) {
  return getChapter(learningHub, moduleIndex, chapterIndex).learningNodes[
    learningNodeIndex
  ]
}

test('liefert bei fehlendem Storage jedes Mal einen frischen privaten Hub ohne Schreibzugriff', () => {
  const storageSystem = createStorageDouble()
  const { service } = createService(storageSystem)

  const firstResult = service.loadHub()

  assert.deepEqual(firstResult, {
    ok: true,
    status: 'empty',
    initialized: false,
    hub: EMPTY_PRIVATE_HUB,
  })
  assert.equal(storageSystem.state.loadCalls, 1)
  assert.equal(storageSystem.state.saveCalls, 0)
  assert.equal(firstResult.hub.modules.length, 0)

  firstResult.hub.modules.push({
    id: 'local-only-change',
    title: 'Nur in der Rückgabe',
    position: 1,
    chapters: [],
  })

  const secondResult = service.loadHub()

  assert.deepEqual(secondResult.hub, EMPTY_PRIVATE_HUB)
  assert.notStrictEqual(secondResult.hub, firstResult.hub)
  assert.equal(storageSystem.state.loadCalls, 2)
  assert.equal(storageSystem.state.saveCalls, 0)
  assert.equal(Object.isFrozen(service), true)
})

test('lädt gültige private Daten defensiv und beobachtet über eine neue Instanz denselben persistenten Stand', () => {
  const initialHub = createPrivateHubFixture()
  const storageSystem = createStorageDouble({ initialHub })
  const firstService = createService(storageSystem).service

  const firstLoad = firstService.loadHub()

  assert.equal(firstLoad.ok, true)
  assert.equal(firstLoad.status, 'loaded')
  assert.equal(firstLoad.initialized, false)
  assert.deepEqual(firstLoad.hub, initialHub)

  firstLoad.hub.modules[0].chapters[0].learningNodes[0].content =
    'Nur die Service-Rückgabe wurde verändert.'

  const secondService = createService(storageSystem).service
  const secondLoad = secondService.loadHub()

  assert.deepEqual(secondLoad.hub, initialHub)
  assert.equal(storageSystem.state.saveCalls, 0)
})

test('persistiert eine Mutation so, dass eine neue Service- und Storage-Instanz sie erneut lädt', () => {
  const fakeStorage = new FakeStorage()
  const storageAdapter = createStorageAdapter(fakeStorage)
  const firstStorage = createLearningHubStorage(storageAdapter)
  const idGenerator = createIdGenerator(
    'module-persistent-synthetic',
    'chapter-persistent-synthetic'
  )
  const firstService = createLearningHubService({
    learningHubStorage: firstStorage,
    generateLearningHubId: idGenerator.generateLearningHubId,
  })

  const createResult = firstService.createModule({
    title: 'Persistentes Fantasiemodul',
    firstChapterTitle: 'Persistentes Fantasiekapitel',
  })

  assert.equal(createResult.ok, true)
  assert.equal(createResult.status, 'moduleCreated')
  assert.equal(fakeStorage.setItemCalls, 1)
  assert.notEqual(fakeStorage.peek(LEARNING_HUB_STORAGE_KEY), null)

  const secondStorage = createLearningHubStorage(
    createStorageAdapter(fakeStorage)
  )
  const secondService = createLearningHubService({
    learningHubStorage: secondStorage,
  })
  const reloadResult = secondService.loadHub()

  assert.equal(reloadResult.ok, true)
  assert.equal(reloadResult.status, 'loaded')
  assert.deepEqual(reloadResult.hub, createResult.hub)
})

test('weist ungültige und synthetische gespeicherte Zustände ohne Überschreiben ab', () => {
  const invalidHub = createPrivateHubFixture()
  invalidHub.modules[0].chapters = []
  const syntheticHub = createPrivateHubFixture()
  syntheticHub.dataOrigin = 'synthetic'

  const cases = [
    {
      expectedCode: 'invalidStoredLearningHub',
      hub: invalidHub,
    },
    {
      expectedCode: 'privateLearningHubRequired',
      hub: syntheticHub,
    },
  ]

  for (const errorCase of cases) {
    const storageSystem = createStorageDouble({
      loadResult: {
        ok: true,
        status: 'found',
        hub: errorCase.hub,
      },
    })
    const { service } = createService(storageSystem)

    const result = service.loadHub()

    assert.equal(result.ok, false)
    assert.equal(result.status, 'invalidStoredData')
    assert.equal(result.error.code, errorCase.expectedCode)
    assert.equal(result.hub, null)
    assert.equal(storageSystem.state.saveCalls, 0)
  }
})

test('erstellt LearningModule und erstes LearningChapter atomar mit normalisierten Eingaben', () => {
  const storageSystem = createStorageDouble()
  const { idGenerator, service } = createService(storageSystem, [
    'module-aurora-synthetic',
    'chapter-aurora-intro-synthetic',
  ])
  const input = {
    title: '  Fiktive Aurorakarten  ',
    firstChapterTitle: '  Erfundene Farbbänder  ',
  }
  const inputSnapshot = cloneValue(input)

  const result = service.createModule(input)

  assert.equal(result.ok, true)
  assert.equal(result.status, 'moduleCreated')
  assert.deepEqual(result.createdModule, {
    id: 'module-aurora-synthetic',
    title: 'Fiktive Aurorakarten',
    position: 1,
    chapters: [
      {
        id: 'chapter-aurora-intro-synthetic',
        title: 'Erfundene Farbbänder',
        position: 1,
        learningNodes: [],
      },
    ],
  })
  assert.deepEqual(result.hub.modules, [result.createdModule])
  assert.notStrictEqual(result.hub.modules[0], result.createdModule)
  assert.deepEqual(input, inputSnapshot)
  assert.deepEqual(idGenerator.calls, ['module', 'chapter'])
  assert.equal(storageSystem.state.loadCalls, 1)
  assert.equal(storageSystem.state.saveCalls, 1)
  assert.deepEqual(storageSystem.peekStoredHub(), result.hub)
})

test('unterstützt mehrere unabhängig persistierte Module', () => {
  const storageSystem = createStorageDouble()
  const { service } = createService(storageSystem, [
    'module-one-synthetic',
    'chapter-one-synthetic',
    'module-two-synthetic',
    'chapter-two-synthetic',
  ])

  const firstResult = service.createModule({
    title: 'Erstes Fantasiemodul',
    firstChapterTitle: 'Erstes Fantasiekapitel',
  })
  const secondResult = service.createModule({
    title: 'Zweites Fantasiemodul',
    firstChapterTitle: 'Zweites Fantasiekapitel',
  })

  assert.equal(firstResult.ok, true)
  assert.equal(secondResult.ok, true)
  assert.deepEqual(
    secondResult.hub.modules.map((learningModule) => ({
      id: learningModule.id,
      position: learningModule.position,
      chapterCount: learningModule.chapters.length,
    })),
    [
      {
        id: 'module-one-synthetic',
        position: 1,
        chapterCount: 1,
      },
      {
        id: 'module-two-synthetic',
        position: 2,
        chapterCount: 1,
      },
    ]
  )
  assert.equal(storageSystem.state.loadCalls, 2)
  assert.equal(storageSystem.state.saveCalls, 2)
})

test('fügt Kapitel und LearningNode ausschließlich dem angegebenen Elternobjekt hinzu', () => {
  const initialHub = createPrivateHubFixture()
  const storageSystem = createStorageDouble({ initialHub })
  const { service } = createService(storageSystem, [
    'chapter-glass-reflections-synthetic',
    'node-glass-angle-synthetic',
  ])

  const chapterResult = service.addChapter({
    moduleId: 'module-glass-garden',
    title: '  Erfundene Glasreflexionen  ',
  })

  assert.equal(chapterResult.ok, true)
  assert.equal(chapterResult.status, 'chapterAdded')
  assert.deepEqual(chapterResult.hub.modules[0], initialHub.modules[0])
  assert.equal(chapterResult.hub.modules[1].chapters.length, 2)
  assert.deepEqual(chapterResult.createdChapter, {
    id: 'chapter-glass-reflections-synthetic',
    title: 'Erfundene Glasreflexionen',
    position: 5,
    learningNodes: [],
  })

  const nodeInput = {
    moduleId: 'module-glass-garden',
    chapterId: 'chapter-glass-reflections-synthetic',
    title: '  Fiktiver Reflexionswinkel  ',
    content: '  Rein synthetischer Inhalt über eine gedachte Glasfläche.  ',
  }
  const nodeInputSnapshot = cloneValue(nodeInput)
  const nodeResult = service.addLearningNode(nodeInput)

  assert.equal(nodeResult.ok, true)
  assert.equal(nodeResult.status, 'learningNodeAdded')
  assert.deepEqual(nodeInput, nodeInputSnapshot)
  assert.deepEqual(nodeResult.createdLearningNode, {
    id: 'node-glass-angle-synthetic',
    title: 'Fiktiver Reflexionswinkel',
    content: 'Rein synthetischer Inhalt über eine gedachte Glasfläche.',
    position: 1,
  })
  assert.equal(
    nodeResult.hub.modules[1].chapters[0].learningNodes.length,
    initialHub.modules[1].chapters[0].learningNodes.length
  )
  assert.deepEqual(
    nodeResult.hub.modules[1].chapters[1].learningNodes,
    [nodeResult.createdLearningNode]
  )
})

test('ermittelt neue Positionen anhand des Maximums statt anhand der Array-Länge', () => {
  const storageSystem = createStorageDouble({
    initialHub: createPrivateHubFixture(),
  })
  const { service } = createService(storageSystem, [
    'module-position-synthetic',
    'chapter-position-first-synthetic',
    'chapter-position-next-synthetic',
    'node-position-next-synthetic',
  ])

  const moduleResult = service.createModule({
    title: 'Fiktives Positionsmodul',
    firstChapterTitle: 'Fiktives Startkapitel',
  })
  const chapterResult = service.addChapter({
    moduleId: 'module-stellar-map',
    title: 'Fiktives Anschlusskapitel',
  })
  const nodeResult = service.addLearningNode({
    moduleId: 'module-stellar-map',
    chapterId: 'chapter-coordinate-grid',
    title: 'Fiktiver Anschlussknoten',
    content: 'Synthetischer Anschlussinhalt.',
  })

  assert.equal(moduleResult.createdModule.position, 10)
  assert.equal(chapterResult.createdChapter.position, 9)
  assert.equal(nodeResult.createdLearningNode.position, 12)
  assert.equal(
    new Set(nodeResult.hub.modules.map(({ position }) => position)).size,
    nodeResult.hub.modules.length
  )
  assert.equal(
    new Set(
      nodeResult.hub.modules[0].chapters.map(({ position }) => position)
    ).size,
    nodeResult.hub.modules[0].chapters.length
  )
  assert.equal(
    new Set(
      getChapter(nodeResult.hub).learningNodes.map(({ position }) => position)
    ).size,
    getChapter(nodeResult.hub).learningNodes.length
  )
})

test('lehnt nicht mehr fortschreibbare Maximalpositionen kontrolliert ohne Save ab', () => {
  const cases = [
    {
      generatedIds: ['module-overflow', 'chapter-overflow'],
      mutateHub(learningHub) {
        learningHub.modules[1].position = Number.MAX_SAFE_INTEGER
      },
      run(service) {
        return service.createModule({
          title: 'Fiktives Grenzmodul',
          firstChapterTitle: 'Fiktives Grenzkapitel',
        })
      },
    },
    {
      generatedIds: ['chapter-overflow'],
      mutateHub(learningHub) {
        learningHub.modules[0].chapters[1].position = Number.MAX_SAFE_INTEGER
      },
      run(service) {
        return service.addChapter({
          moduleId: 'module-stellar-map',
          title: 'Fiktives Grenzkapitel',
        })
      },
    },
    {
      generatedIds: ['node-overflow'],
      mutateHub(learningHub) {
        getChapter(learningHub).learningNodes[1].position =
          Number.MAX_SAFE_INTEGER
      },
      run(service) {
        return service.addLearningNode({
          moduleId: 'module-stellar-map',
          chapterId: 'chapter-coordinate-grid',
          title: 'Fiktiver Grenzknoten',
          content: 'Synthetischer Grenzinhalt.',
        })
      },
    },
  ]

  for (const positionCase of cases) {
    const hub = createPrivateHubFixture()
    positionCase.mutateHub(hub)
    assert.equal(validateLearningHub(hub).ok, true)
    const storageSystem = createStorageDouble({ initialHub: hub })
    const { service } = createService(
      storageSystem,
      positionCase.generatedIds
    )

    const result = positionCase.run(service)

    assert.equal(result.ok, false)
    assert.equal(result.status, 'generationFailed')
    assert.equal(result.error.code, 'learningHubPositionGenerationFailed')
    assert.equal(storageSystem.state.saveCalls, 0)
    assert.deepEqual(storageSystem.peekStoredHub(), hub)
  }
})

test('Umbenennungen und Node-Update erhalten IDs, Positionen und Kindstrukturen', () => {
  const initialHub = createPrivateHubFixture()
  const storageSystem = createStorageDouble({ initialHub })
  const { service } = createService(storageSystem)

  const moduleInput = {
    moduleId: 'module-stellar-map',
    title: '  Umbenannte Fantasiesternkarten  ',
  }
  const moduleInputSnapshot = cloneValue(moduleInput)
  const moduleResult = service.renameModule(moduleInput)

  assert.equal(moduleResult.ok, true)
  assert.equal(moduleResult.status, 'moduleRenamed')
  assert.equal(moduleResult.updatedModule.id, initialHub.modules[0].id)
  assert.equal(
    moduleResult.updatedModule.position,
    initialHub.modules[0].position
  )
  assert.equal(moduleResult.updatedModule.title, 'Umbenannte Fantasiesternkarten')
  assert.deepEqual(
    moduleResult.updatedModule.chapters,
    initialHub.modules[0].chapters
  )
  assert.deepEqual(moduleInput, moduleInputSnapshot)

  const chapterInput = {
    moduleId: 'module-stellar-map',
    chapterId: 'chapter-coordinate-grid',
    title: '  Umbenanntes Fantasiegitter  ',
  }
  const chapterInputSnapshot = cloneValue(chapterInput)
  const chapterResult = service.renameChapter(chapterInput)

  assert.equal(chapterResult.ok, true)
  assert.equal(chapterResult.status, 'chapterRenamed')
  assert.equal(chapterResult.updatedChapter.id, 'chapter-coordinate-grid')
  assert.equal(chapterResult.updatedChapter.position, 3)
  assert.equal(chapterResult.updatedChapter.title, 'Umbenanntes Fantasiegitter')
  assert.deepEqual(
    chapterResult.updatedChapter.learningNodes,
    initialHub.modules[0].chapters[0].learningNodes
  )
  assert.deepEqual(chapterInput, chapterInputSnapshot)

  const nodeInput = {
    moduleId: 'module-stellar-map',
    chapterId: 'chapter-coordinate-grid',
    learningNodeId: 'node-grid-axes',
    title: '  Umbenannte Fantasieachsen  ',
    content: '  Rein synthetischer aktualisierter Achseninhalt.  ',
  }
  const nodeInputSnapshot = cloneValue(nodeInput)
  const nodeResult = service.updateLearningNode(nodeInput)

  assert.equal(nodeResult.ok, true)
  assert.equal(nodeResult.status, 'learningNodeUpdated')
  assert.deepEqual(nodeResult.updatedLearningNode, {
    id: 'node-grid-axes',
    title: 'Umbenannte Fantasieachsen',
    content: 'Rein synthetischer aktualisierter Achseninhalt.',
    position: 2,
  })
  assert.deepEqual(nodeInput, nodeInputSnapshot)
  assert.deepEqual(nodeResult.hub.modules[1], initialHub.modules[1])
})

test('akzeptiert exakte Eingabegrenzen und speichert normalisierte Werte', () => {
  const storageSystem = createStorageDouble({
    initialHub: createPrivateHubFixture(),
  })
  const { service } = createService(storageSystem, ['node-limit-synthetic'])
  const title = 'T'.repeat(120)
  const content = 'I'.repeat(10000)
  const input = {
    moduleId: 'module-stellar-map',
    chapterId: 'chapter-coordinate-grid',
    title,
    content,
  }
  const inputSnapshot = cloneValue(input)

  const result = service.addLearningNode(input)

  assert.equal(result.ok, true)
  assert.equal(result.createdLearningNode.title.length, 120)
  assert.equal(result.createdLearningNode.content.length, 10000)
  assert.deepEqual(input, inputSnapshot)
})

test('weist leere, typfremde und zu lange Eingaben vor jedem Schreibzugriff ab', () => {
  const cases = [
    {
      expectedField: 'title',
      run(service) {
        return service.createModule({
          title: '   ',
          firstChapterTitle: 'Fiktives Kapitel',
        })
      },
    },
    {
      expectedField: 'firstChapterTitle',
      run(service) {
        return service.createModule({
          title: 'Fiktives Modul',
          firstChapterTitle: null,
        })
      },
    },
    {
      expectedField: 'title',
      run(service) {
        return service.renameModule({
          moduleId: 'module-stellar-map',
          title: 'T'.repeat(121),
        })
      },
    },
    {
      expectedField: 'content',
      run(service) {
        return service.addLearningNode({
          moduleId: 'module-stellar-map',
          chapterId: 'chapter-coordinate-grid',
          title: 'Fiktiver Knoten',
          content: '   ',
        })
      },
    },
    {
      expectedField: 'content',
      run(service) {
        return service.updateLearningNode({
          moduleId: 'module-stellar-map',
          chapterId: 'chapter-coordinate-grid',
          learningNodeId: 'node-grid-axes',
          title: 'Fiktiver Knoten',
          content: 'I'.repeat(10001),
        })
      },
    },
  ]

  for (const inputCase of cases) {
    const storageSystem = createStorageDouble({
      initialHub: createPrivateHubFixture(),
    })
    const { service } = createService(storageSystem)

    const result = inputCase.run(service)

    assert.equal(result.ok, false)
    assert.equal(result.status, 'validationFailed')
    assert.equal(result.error.code, 'invalidLearningHubInput')
    assert.ok(result.error.fieldErrors[inputCase.expectedField])
    assert.equal(storageSystem.state.loadCalls, 1)
    assert.equal(storageSystem.state.saveCalls, 0)
  }
})

test('behandelt nicht gefundene Ziele und falsche Elternzuordnungen kontrolliert', () => {
  const cases = [
    {
      expectedStatus: 'notFound',
      expectedCode: 'moduleNotFound',
      run(service) {
        return service.renameModule({
          moduleId: 'module-does-not-exist',
          title: 'Fiktiver Titel',
        })
      },
    },
    {
      expectedStatus: 'notFound',
      expectedCode: 'chapterNotFound',
      run(service) {
        return service.renameChapter({
          moduleId: 'module-stellar-map',
          chapterId: 'chapter-does-not-exist',
          title: 'Fiktiver Titel',
        })
      },
    },
    {
      expectedStatus: 'ownershipMismatch',
      expectedCode: 'chapterModuleMismatch',
      run(service) {
        return service.addLearningNode({
          moduleId: 'module-glass-garden',
          chapterId: 'chapter-coordinate-grid',
          title: 'Fiktiver Knoten',
          content: 'Synthetischer Inhalt.',
        })
      },
    },
    {
      expectedStatus: 'notFound',
      expectedCode: 'learningNodeNotFound',
      run(service) {
        return service.updateLearningNode({
          moduleId: 'module-stellar-map',
          chapterId: 'chapter-coordinate-grid',
          learningNodeId: 'node-does-not-exist',
          title: 'Fiktiver Knoten',
          content: 'Synthetischer Inhalt.',
        })
      },
    },
    {
      expectedStatus: 'ownershipMismatch',
      expectedCode: 'learningNodeChapterMismatch',
      run(service) {
        return service.updateLearningNode({
          moduleId: 'module-stellar-map',
          chapterId: 'chapter-signal-patterns',
          learningNodeId: 'node-grid-axes',
          title: 'Fiktiver Knoten',
          content: 'Synthetischer Inhalt.',
        })
      },
    },
  ]

  for (const targetCase of cases) {
    const initialHub = createPrivateHubFixture()
    const storageSystem = createStorageDouble({ initialHub })
    const { service } = createService(storageSystem)

    const result = targetCase.run(service)

    assert.equal(result.ok, false)
    assert.equal(result.status, targetCase.expectedStatus)
    assert.equal(result.error.code, targetCase.expectedCode)
    assert.deepEqual(result.hub, initialHub)
    assert.equal(storageSystem.state.saveCalls, 0)
  }
})

test('weist ungetrimmte Ziel-IDs als Eingabefehler ohne Save ab', () => {
  const storageSystem = createStorageDouble({
    initialHub: createPrivateHubFixture(),
  })
  const { service } = createService(storageSystem)

  const result = service.addChapter({
    moduleId: ' module-stellar-map ',
    title: 'Fiktives Kapitel',
  })

  assert.equal(result.ok, false)
  assert.equal(result.status, 'validationFailed')
  assert.equal(result.error.code, 'invalidLearningHubInput')
  assert.ok(result.error.fieldErrors.moduleId)
  assert.equal(storageSystem.state.saveCalls, 0)
})

test('löst globale ID-Kollisionen über alle Entitätsebenen kontrolliert auf', () => {
  const storageSystem = createStorageDouble({
    initialHub: createPrivateHubFixture(),
  })
  const { idGenerator, service } = createService(storageSystem, [
    'node-grid-axes',
    'chapter-unique-after-global-collision',
  ])

  const result = service.addChapter({
    moduleId: 'module-stellar-map',
    title: 'Fiktives Kollisionskapitel',
  })

  assert.equal(result.ok, true)
  assert.equal(
    result.createdChapter.id,
    'chapter-unique-after-global-collision'
  )
  assert.deepEqual(idGenerator.calls, ['chapter', 'chapter'])
  assert.equal(storageSystem.state.saveCalls, 1)
})

test('begrenzt erschöpfte ID-Kollisionen deterministisch und speichert keinen Teilzustand', () => {
  const initialHub = createPrivateHubFixture()
  const storageSystem = createStorageDouble({ initialHub })
  const { idGenerator, service } = createService(storageSystem, [
    'module-stellar-map',
  ])

  const result = service.addLearningNode({
    moduleId: 'module-stellar-map',
    chapterId: 'chapter-coordinate-grid',
    title: 'Fiktiver Kollisionsknoten',
    content: 'Synthetischer Kollisionsinhalt.',
  })

  assert.equal(result.ok, false)
  assert.equal(result.status, 'generationFailed')
  assert.equal(result.error.code, 'learningHubIdGenerationFailed')
  assert.equal(idGenerator.calls.length, 5)
  assert.ok(idGenerator.calls.every((entityType) => entityType === 'learningNode'))
  assert.equal(storageSystem.state.saveCalls, 0)
  assert.deepEqual(storageSystem.peekStoredHub(), initialHub)
})

test('reserviert bei atomarer Modulerstellung die neue Modul-ID bereits für die Kapitel-ID', () => {
  const storageSystem = createStorageDouble()
  const { idGenerator, service } = createService(storageSystem, [
    'shared-new-id',
  ])

  const result = service.createModule({
    title: 'Fiktives Reservierungsmodul',
    firstChapterTitle: 'Fiktives Reservierungskapitel',
  })

  assert.equal(result.ok, false)
  assert.equal(result.status, 'generationFailed')
  assert.equal(result.error.code, 'learningHubIdGenerationFailed')
  assert.deepEqual(idGenerator.calls, [
    'module',
    'chapter',
    'chapter',
    'chapter',
    'chapter',
    'chapter',
  ])
  assert.equal(storageSystem.state.saveCalls, 0)
  assert.equal(storageSystem.peekStoredHub(), null)
})

test('validiert jeden vollständigen neuen Hub vor dem einzigen Storage-Save', () => {
  const initialHub = createPrivateHubFixture()
  let observedHub = null
  const storageSystem = createStorageDouble({
    initialHub,
    saveResult(learningHub) {
      observedHub = cloneValue(learningHub)
      return { ok: true, status: 'saved' }
    },
  })
  const { service } = createService(storageSystem, [
    'chapter-validation-synthetic',
  ])

  const result = service.addChapter({
    moduleId: 'module-stellar-map',
    title: 'Fiktives Validierungskapitel',
  })

  assert.equal(result.ok, true)
  assert.deepEqual(validateLearningHub(observedHub), {
    ok: true,
    errors: [],
  })
  assert.deepEqual(observedHub, result.hub)
  assert.equal(storageSystem.state.loadCalls, 1)
  assert.equal(storageSystem.state.saveCalls, 1)
})

test('reicht kontrollierte Lesefehler weiter und ruft weder Generator noch Save auf', () => {
  const cases = [
    {
      status: 'invalidJson',
      code: 'invalidJson',
    },
    {
      status: 'readFailed',
      code: 'storageReadFailed',
    },
    {
      status: 'unavailable',
      code: 'storageUnavailable',
    },
  ]

  for (const readCase of cases) {
    const storageSystem = createStorageDouble({
      loadResult: {
        ok: false,
        status: readCase.status,
        error: {
          code: readCase.code,
          message: 'Synthetischer kontrollierter Lesefehler.',
        },
      },
    })
    const { idGenerator, service } = createService(storageSystem, [
      'unused-module-id',
    ])

    const result = service.createModule({
      title: 'Fiktives Modul',
      firstChapterTitle: 'Fiktives Kapitel',
    })

    assert.equal(result.ok, false)
    assert.equal(result.status, readCase.status)
    assert.equal(result.error.code, readCase.code)
    assert.equal(result.hub, null)
    assert.equal(idGenerator.calls.length, 0)
    assert.equal(storageSystem.state.saveCalls, 0)
  }
})

test('weist malformed Storage-Erfolge und leere Fehlerfelder kontrolliert zurück', () => {
  const initialHub = createPrivateHubFixture()
  const malformedLoadService = createLearningHubService({
    learningHubStorage: {
      loadLearningHub() {
        return {
          ok: 'true',
          status: 'found',
          hub: cloneValue(initialHub),
        }
      },
    },
  })
  const malformedLoadResult = malformedLoadService.loadHub()

  assert.equal(malformedLoadResult.ok, false)
  assert.equal(malformedLoadResult.status, 'storageFailed')
  assert.equal(
    malformedLoadResult.error.code,
    'unexpectedStorageResult'
  )

  let saveCalls = 0
  const malformedSaveService = createLearningHubService({
    learningHubStorage: {
      loadLearningHub() {
        return {
          ok: true,
          status: 'found',
          hub: cloneValue(initialHub),
        }
      },
      saveLearningHub() {
        saveCalls += 1
        return { ok: 'true', status: 'saved' }
      },
    },
  })
  const malformedSaveResult = malformedSaveService.renameModule({
    moduleId: 'module-stellar-map',
    title: 'Nicht bestätigter Fantasietitel',
  })

  assert.equal(malformedSaveResult.ok, false)
  assert.equal(malformedSaveResult.status, 'storageFailed')
  assert.equal(
    malformedSaveResult.error.code,
    'unexpectedStorageResult'
  )
  assert.deepEqual(malformedSaveResult.hub, initialHub)
  assert.equal(saveCalls, 1)

  const malformedFailures = [
    {
      ok: false,
      status: '',
      error: { code: 'storageReadFailed', message: 'Synthetischer Fehler.' },
    },
    {
      ok: false,
      status: 'readFailed',
      error: { code: ' ', message: 'Synthetischer Fehler.' },
    },
    {
      ok: false,
      status: 'readFailed',
      error: { code: 'storageReadFailed', message: '' },
    },
  ]

  for (const malformedFailure of malformedFailures) {
    const service = createLearningHubService({
      learningHubStorage: {
        loadLearningHub() {
          return cloneValue(malformedFailure)
        },
      },
    })
    const result = service.loadHub()

    assert.equal(result.ok, false)
    assert.equal(result.status, 'storageFailed')
    assert.equal(result.error.code, 'unexpectedStorageResult')
  }
})

test('normalisiert geworfene Storage-Lese- und Schreibfehler ohne rohe Exception', () => {
  const readSystem = createStorageDouble({ throwOnLoad: true })
  const readService = createService(readSystem).service

  const readResult = readService.loadHub()

  assert.equal(readResult.ok, false)
  assert.equal(readResult.status, 'readFailed')
  assert.equal(readResult.error.code, 'learningHubStorageReadFailed')

  const initialHub = createPrivateHubFixture()
  const writeSystem = createStorageDouble({
    initialHub,
    throwOnSave: true,
  })
  const writeService = createService(writeSystem).service

  const writeResult = writeService.renameModule({
    moduleId: 'module-stellar-map',
    title: 'Nicht persistierter Fantasietitel',
  })

  assert.equal(writeResult.ok, false)
  assert.equal(writeResult.status, 'writeFailed')
  assert.equal(writeResult.error.code, 'learningHubStorageWriteFailed')
  assert.deepEqual(writeResult.hub, initialHub)
  assert.deepEqual(writeSystem.peekStoredHub(), initialHub)
})

test('erhält bei Schreib- und Quota-Fehlern den vorherigen Hub ohne Teilpersistenz', () => {
  const cases = [
    {
      status: 'writeFailed',
      code: 'storageWriteFailed',
    },
    {
      status: 'quotaExceeded',
      code: 'storageQuotaExceeded',
    },
  ]

  for (const writeCase of cases) {
    const initialHub = createPrivateHubFixture()
    const storageSystem = createStorageDouble({
      initialHub,
      saveResult: {
        ok: false,
        status: writeCase.status,
        error: {
          code: writeCase.code,
          message: 'Synthetischer kontrollierter Schreibfehler.',
        },
      },
    })
    const { service } = createService(storageSystem)

    const result = service.renameChapter({
      moduleId: 'module-stellar-map',
      chapterId: 'chapter-coordinate-grid',
      title: 'Nicht persistierter Fantasietitel',
    })

    assert.equal(result.ok, false)
    assert.equal(result.status, writeCase.status)
    assert.equal(result.error.code, writeCase.code)
    assert.deepEqual(result.hub, initialHub)
    assert.deepEqual(storageSystem.peekStoredHub(), initialHub)
    assert.equal(storageSystem.state.loadCalls, 1)
    assert.equal(storageSystem.state.saveCalls, 1)
  }
})

test('verwendet den Storage als einzige veränderliche Wahrheit bei jeder Mutation', () => {
  const storageSystem = createStorageDouble()
  const { service } = createService(storageSystem, [
    'chapter-observed-after-external-change',
  ])

  const emptyResult = service.loadHub()
  assert.equal(emptyResult.status, 'empty')

  const externallyChangedHub = createPrivateHubFixture()
  storageSystem.replaceStoredHub(externallyChangedHub)

  const mutationResult = service.addChapter({
    moduleId: 'module-glass-garden',
    title: 'Nach externer Änderung beobachtetes Fantasiekapitel',
  })

  assert.equal(mutationResult.ok, true)
  assert.equal(mutationResult.status, 'chapterAdded')
  assert.equal(mutationResult.hub.modules.length, 2)
  assert.equal(mutationResult.hub.modules[1].chapters.length, 2)
  assert.equal(storageSystem.state.loadCalls, 2)
  assert.equal(storageSystem.state.saveCalls, 1)
})

test('entkoppelt Eingabe, vorherigen Zustand, Save-Argument und tiefe Rückgaben vollständig', () => {
  const initialHub = createPrivateHubFixture()
  const storageSystem = createStorageDouble({ initialHub })
  const loadedReference = storageSystem.getStoredReference()
  const loadedSnapshot = cloneValue(loadedReference)
  const { service } = createService(storageSystem)
  const input = {
    moduleId: 'module-stellar-map',
    chapterId: 'chapter-coordinate-grid',
    learningNodeId: 'node-grid-axes',
    title: '  Entkoppelter Fantasieknoten  ',
    content: '  Synthetischer entkoppelter Inhalt.  ',
  }
  const inputSnapshot = cloneValue(input)

  const result = service.updateLearningNode(input)

  assert.equal(result.ok, true)
  assert.deepEqual(input, inputSnapshot)
  assert.deepEqual(loadedReference, loadedSnapshot)

  const savedArgument = storageSystem.state.savedArguments[0]
  const savedSnapshot = cloneValue(savedArgument)
  assert.notStrictEqual(result.hub, savedArgument)
  assert.notStrictEqual(
    getLearningNode(result.hub),
    result.updatedLearningNode
  )

  result.updatedLearningNode.content = 'Nur die Einzelrückgabe.'
  assert.equal(
    getLearningNode(result.hub).content,
    'Synthetischer entkoppelter Inhalt.'
  )
  assert.deepEqual(savedArgument, savedSnapshot)

  getLearningNode(result.hub).content = 'Nur die Hub-Rückgabe.'
  assert.deepEqual(savedArgument, savedSnapshot)

  savedArgument.modules[0].chapters[0].learningNodes[0].content =
    'Nur das Save-Argument.'
  assert.equal(
    storageSystem.peekStoredHub().modules[0].chapters[0].learningNodes[0]
      .content,
    'Synthetischer entkoppelter Inhalt.'
  )

  const reloadResult = service.loadHub()
  assert.equal(
    getLearningNode(reloadResult.hub).content,
    'Synthetischer entkoppelter Inhalt.'
  )
})

test('lädt und speichert bei jeder erfolgreichen Mutation exakt einmal', () => {
  const mutationCases = [
    {
      initialHub: undefined,
      generatedIds: ['module-count-synthetic', 'chapter-count-synthetic'],
      run(service) {
        return service.createModule({
          title: 'Fiktives Zählmodul',
          firstChapterTitle: 'Fiktives Zählkapitel',
        })
      },
    },
    {
      initialHub: createPrivateHubFixture(),
      generatedIds: [],
      run(service) {
        return service.renameModule({
          moduleId: 'module-stellar-map',
          title: 'Fiktiver Zähltitel',
        })
      },
    },
    {
      initialHub: createPrivateHubFixture(),
      generatedIds: ['chapter-count-synthetic'],
      run(service) {
        return service.addChapter({
          moduleId: 'module-stellar-map',
          title: 'Fiktives Zählkapitel',
        })
      },
    },
    {
      initialHub: createPrivateHubFixture(),
      generatedIds: [],
      run(service) {
        return service.renameChapter({
          moduleId: 'module-stellar-map',
          chapterId: 'chapter-coordinate-grid',
          title: 'Fiktiver Zähltitel',
        })
      },
    },
    {
      initialHub: createPrivateHubFixture(),
      generatedIds: ['node-count-synthetic'],
      run(service) {
        return service.addLearningNode({
          moduleId: 'module-stellar-map',
          chapterId: 'chapter-coordinate-grid',
          title: 'Fiktiver Zählknoten',
          content: 'Synthetischer Zählinhalt.',
        })
      },
    },
    {
      initialHub: createPrivateHubFixture(),
      generatedIds: [],
      run(service) {
        return service.updateLearningNode({
          moduleId: 'module-stellar-map',
          chapterId: 'chapter-coordinate-grid',
          learningNodeId: 'node-grid-axes',
          title: 'Fiktiver Zählknoten',
          content: 'Synthetischer aktualisierter Zählinhalt.',
        })
      },
    },
  ]

  for (const mutationCase of mutationCases) {
    const storageSystem = createStorageDouble({
      initialHub: mutationCase.initialHub,
    })
    const { service } = createService(
      storageSystem,
      mutationCase.generatedIds
    )

    const result = mutationCase.run(service)

    assert.equal(result.ok, true)
    assert.equal(storageSystem.state.loadCalls, 1)
    assert.equal(storageSystem.state.saveCalls, 1)
  }
})
