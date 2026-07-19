import assert from 'node:assert/strict'
import test from 'node:test'

import {
  validateLearningArtifactStore,
} from '../src/modules/learning-hub/learningArtifactContract.js'
import {
  createLearningArtifactService,
} from '../src/services/learningArtifactService.js'

function cloneValue(value) {
  return structuredClone(value)
}

// Sämtliche Texte dieser Fixtures sind kurz, frei erfunden und synthetisch.
function createPrivateHub() {
  return {
    schemaVersion: 2,
    dataOrigin: 'private',
    modules: [
      {
        id: 'module-ember-map',
        title: 'Erfundene Glutkarte',
        position: 1,
        chapters: [
          {
            id: 'chapter-ember-signals',
            title: 'Erfundene Glutsignale',
            position: 1,
            learningNodes: [
              {
                id: 'node-ember-pulse',
                title: 'Erfundener Glutpuls',
                content: 'Erfundener Quelltext über einen Glutpuls.',
                position: 1,
              },
            ],
          },
          {
            id: 'chapter-ember-routes',
            title: 'Erfundene Glutrouten',
            position: 2,
            learningNodes: [
              {
                id: 'node-ember-route',
                title: 'Erfundene Glutroute',
                content: 'Erfundener Quelltext über eine Glutroute.',
                position: 1,
              },
            ],
          },
        ],
      },
      {
        id: 'module-glass-orchard',
        title: 'Erfundener Glasgarten',
        position: 2,
        chapters: [
          {
            id: 'chapter-glass-leaves',
            title: 'Erfundene Glasblätter',
            position: 1,
            learningNodes: [
              {
                id: 'node-glass-leaf',
                title: 'Erfundenes Glasblatt',
                content: 'Erfundener Quelltext über ein Glasblatt.',
                position: 1,
              },
            ],
          },
        ],
      },
    ],
  }
}

function createArtifact(overrides = {}) {
  return {
    id: 'artifact-ember-note',
    type: 'note',
    moduleId: 'module-ember-map',
    chapterId: 'chapter-ember-signals',
    learningNodeId: 'node-ember-pulse',
    content: 'Erfundene Notiz über den Glutpuls.',
    createdAt: '2026-07-19T10:00:00.000Z',
    updatedAt: '2026-07-19T10:00:00.000Z',
    ...overrides,
  }
}

function createPrivateArtifactStore(artifacts = []) {
  return {
    schemaVersion: 1,
    dataOrigin: 'private',
    artifacts,
  }
}

function createHubServiceDouble({
  initialHub = createPrivateHub(),
  loadResult,
  throwOnLoad = false,
  trace = [],
} = {}) {
  let currentHub = cloneValue(initialHub)
  const state = { loadCalls: 0 }

  return {
    learningHubService: {
      loadHub() {
        trace.push('hubLoad')
        state.loadCalls += 1

        if (throwOnLoad) {
          throw new Error('Synthetischer Hub-Lesefehler')
        }

        if (loadResult !== undefined) {
          return typeof loadResult === 'function'
            ? loadResult()
            : loadResult
        }

        return {
          ok: true,
          status: currentHub.modules.length === 0 ? 'empty' : 'loaded',
          initialized: false,
          hub: currentHub,
        }
      },
    },
    getHubReference() {
      return currentHub
    },
    peekHub() {
      return cloneValue(currentHub)
    },
    replaceHub(nextHub) {
      currentHub = cloneValue(nextHub)
    },
    state,
  }
}

function createArtifactStorageDouble({
  initialArtifactStore,
  loadResult,
  saveResult,
  throwOnLoad = false,
  throwOnSave = false,
  trace = [],
} = {}) {
  let storedArtifactStore = initialArtifactStore === undefined
    ? null
    : cloneValue(initialArtifactStore)
  const state = {
    loadCalls: 0,
    saveCalls: 0,
    savedArguments: [],
  }

  return {
    learningArtifactStorage: {
      loadLearningArtifacts() {
        trace.push('artifactLoad')
        state.loadCalls += 1

        if (throwOnLoad) {
          throw new Error('Synthetischer Artefakt-Lesefehler')
        }

        if (loadResult !== undefined) {
          return typeof loadResult === 'function'
            ? loadResult()
            : loadResult
        }

        if (storedArtifactStore === null) {
          return {
            ok: true,
            status: 'missing',
            artifactStore: createPrivateArtifactStore(),
          }
        }

        return {
          ok: true,
          status: 'found',
          artifactStore: storedArtifactStore,
        }
      },

      saveLearningArtifacts(artifactStore) {
        trace.push('artifactSave')
        state.saveCalls += 1
        state.savedArguments.push(artifactStore)

        assert.deepEqual(validateLearningArtifactStore(artifactStore), {
          ok: true,
          errors: [],
        })
        assert.equal(artifactStore.dataOrigin, 'private')

        if (throwOnSave) {
          throw new Error('Synthetischer Artefakt-Schreibfehler')
        }

        const configuredResult = typeof saveResult === 'function'
          ? saveResult(artifactStore)
          : saveResult

        if (
          configuredResult !== undefined &&
          (
            configuredResult.ok !== true ||
            configuredResult.status !== 'saved'
          )
        ) {
          return configuredResult
        }

        storedArtifactStore = cloneValue(artifactStore)

        return configuredResult === undefined
          ? { ok: true, status: 'saved' }
          : configuredResult
      },
    },
    getStoredReference() {
      return storedArtifactStore
    },
    peekStoredArtifactStore() {
      return storedArtifactStore === null
        ? null
        : cloneValue(storedArtifactStore)
    },
    replaceArtifactStore(nextArtifactStore) {
      storedArtifactStore = nextArtifactStore === null
        ? null
        : cloneValue(nextArtifactStore)
    },
    state,
  }
}

function createIdGenerator(generatedValues, trace = []) {
  const calls = []
  let valueIndex = 0

  function generateLearningArtifactId() {
    trace.push('id')
    calls.push(true)
    const generatedValue = valueIndex < generatedValues.length
      ? generatedValues[valueIndex]
      : generatedValues.at(-1)
    valueIndex += 1

    if (generatedValue instanceof Error) {
      throw generatedValue
    }

    return generatedValue
  }

  return { calls, generateLearningArtifactId }
}

function createClock(timestamps, trace = []) {
  const calls = []
  let timestampIndex = 0

  function now() {
    trace.push('clock')
    calls.push(true)
    const timestamp = timestampIndex < timestamps.length
      ? timestamps[timestampIndex]
      : timestamps.at(-1)
    timestampIndex += 1

    if (timestamp instanceof Error) {
      throw timestamp
    }

    return timestamp
  }

  return { calls, now }
}

function createService({
  hubSystem,
  artifactSystem,
  generatedIds = ['artifact-generated-default'],
  timestamps = ['2026-07-19T11:00:00.000Z'],
  trace = [],
} = {}) {
  const resolvedHubSystem = hubSystem ?? createHubServiceDouble({ trace })
  const resolvedArtifactSystem = artifactSystem
    ?? createArtifactStorageDouble({ trace })
  const idGenerator = createIdGenerator(generatedIds, trace)
  const clock = createClock(timestamps, trace)
  const service = createLearningArtifactService({
    learningHubService: resolvedHubSystem.learningHubService,
    learningArtifactStorage:
      resolvedArtifactSystem.learningArtifactStorage,
    generateLearningArtifactId:
      idGenerator.generateLearningArtifactId,
    now: clock.now,
  })

  return {
    service,
    hubSystem: resolvedHubSystem,
    artifactSystem: resolvedArtifactSystem,
    idGenerator,
    clock,
    trace,
  }
}

function createTargetInput(overrides = {}) {
  return {
    moduleId: 'module-ember-map',
    chapterId: 'chapter-ember-signals',
    learningNodeId: 'node-ember-pulse',
    ...overrides,
  }
}

function createSaveInput(content = 'Erfundener neuer Artefakttext.') {
  return {
    ...createTargetInput(),
    content,
  }
}

test('lädt einen fehlenden Store schreibfrei als frischen Leerzustand', () => {
  const system = createService()
  const firstResult = system.service.loadArtifacts()

  assert.deepEqual(firstResult, {
    ok: true,
    status: 'empty',
    changed: false,
    artifactStore: createPrivateArtifactStore(),
  })
  assert.equal(system.hubSystem.state.loadCalls, 0)
  assert.equal(system.artifactSystem.state.loadCalls, 1)
  assert.equal(system.artifactSystem.state.saveCalls, 0)
  assert.equal(system.idGenerator.calls.length, 0)
  assert.equal(system.clock.calls.length, 0)
  assert.equal(Object.isFrozen(system.service), true)

  firstResult.artifactStore.artifacts.push(createArtifact())
  const secondResult = system.service.loadArtifacts()

  assert.deepEqual(secondResult.artifactStore.artifacts, [])
})

test('lädt einen vorhandenen Store defensiv geklont', () => {
  const initialStore = createPrivateArtifactStore([createArtifact()])
  const artifactSystem = createArtifactStorageDouble({
    initialArtifactStore: initialStore,
  })
  const system = createService({ artifactSystem })
  const loadedReference = artifactSystem.getStoredReference()
  const result = system.service.loadArtifacts()

  assert.equal(result.ok, true)
  assert.equal(result.status, 'loaded')
  assert.equal(result.changed, false)
  assert.deepEqual(result.artifactStore, initialStore)
  assert.notStrictEqual(result.artifactStore, loadedReference)
  assert.notStrictEqual(result.artifactStore.artifacts, loadedReference.artifacts)

  result.artifactStore.artifacts[0].content = 'Nur die Rückgabe geändert.'
  assert.deepEqual(artifactSystem.peekStoredArtifactStore(), initialStore)
})

test('erstellt note und summary für denselben LearningNode getrennt', () => {
  const trace = []
  const system = createService({
    generatedIds: ['artifact-note-new', 'artifact-summary-new'],
    timestamps: [
      '2026-07-19T11:00:00.000Z',
      '2026-07-19T11:05:00.000Z',
    ],
    trace,
  })

  const noteResult = system.service.saveNote(
    createSaveInput('  Erfundene neue Notiz.  ')
  )
  const summaryResult = system.service.saveSummary(
    createSaveInput('Erfundene neue Zusammenfassung.')
  )

  assert.equal(noteResult.status, 'artifactCreated')
  assert.equal(noteResult.changed, true)
  assert.equal(summaryResult.status, 'artifactCreated')
  assert.equal(summaryResult.changed, true)
  assert.equal(summaryResult.artifactStore.artifacts.length, 2)
  assert.deepEqual(summaryResult.artifactStore.artifacts.map((artifact) => ({
    id: artifact.id,
    type: artifact.type,
    content: artifact.content,
    createdAt: artifact.createdAt,
    updatedAt: artifact.updatedAt,
  })), [
    {
      id: 'artifact-note-new',
      type: 'note',
      content: 'Erfundene neue Notiz.',
      createdAt: '2026-07-19T11:00:00.000Z',
      updatedAt: '2026-07-19T11:00:00.000Z',
    },
    {
      id: 'artifact-summary-new',
      type: 'summary',
      content: 'Erfundene neue Zusammenfassung.',
      createdAt: '2026-07-19T11:05:00.000Z',
      updatedAt: '2026-07-19T11:05:00.000Z',
    },
  ])
  assert.deepEqual(
    Object.keys(summaryResult.artifactStore.artifacts[0]),
    [
      'id',
      'type',
      'moduleId',
      'chapterId',
      'learningNodeId',
      'content',
      'createdAt',
      'updatedAt',
    ]
  )
  assert.equal(
    JSON.stringify(summaryResult.artifactStore).includes(
      'Erfundener Quelltext'
    ),
    false
  )
  assert.equal(system.artifactSystem.state.saveCalls, 2)
  assert.deepEqual(trace.slice(0, 5), [
    'hubLoad',
    'artifactLoad',
    'id',
    'clock',
    'artifactSave',
  ])
})

test('aktualisiert Inhalt bei stabiler ID, createdAt und Arrayposition', () => {
  const summary = createArtifact({
    id: 'artifact-summary-first',
    type: 'summary',
    content: 'Erfundene bestehende Zusammenfassung.',
  })
  const note = createArtifact()
  const routeNote = createArtifact({
    id: 'artifact-route-note',
    chapterId: 'chapter-ember-routes',
    learningNodeId: 'node-ember-route',
    content: 'Erfundene Routennotiz.',
  })
  const initialStore = createPrivateArtifactStore([
    summary,
    note,
    routeNote,
  ])
  const artifactSystem = createArtifactStorageDouble({
    initialArtifactStore: initialStore,
  })
  const system = createService({
    artifactSystem,
    timestamps: ['2026-07-19T12:00:00.000Z'],
  })

  const result = system.service.saveNote(
    createSaveInput('  Erfundene aktualisierte Notiz.  ')
  )

  assert.equal(result.ok, true)
  assert.equal(result.status, 'artifactUpdated')
  assert.equal(result.changed, true)
  assert.deepEqual(result.artifactStore.artifacts.map((artifact) => artifact.id), [
    'artifact-summary-first',
    'artifact-ember-note',
    'artifact-route-note',
  ])
  assert.deepEqual(result.artifactStore.artifacts[1], {
    ...note,
    content: 'Erfundene aktualisierte Notiz.',
    updatedAt: '2026-07-19T12:00:00.000Z',
  })
  assert.deepEqual(result.artifactStore.artifacts[0], summary)
  assert.deepEqual(result.artifactStore.artifacts[2], routeNote)
  assert.equal(system.idGenerator.calls.length, 0)
  assert.equal(system.clock.calls.length, 1)
  assert.equal(artifactSystem.state.saveCalls, 1)
})

test('behandelt nach Trim identischen Inhalt als vollständigen No-op', () => {
  const trace = []
  const artifactSystem = createArtifactStorageDouble({
    initialArtifactStore: createPrivateArtifactStore([createArtifact()]),
    trace,
  })
  const system = createService({ artifactSystem, trace })

  const result = system.service.saveNote(
    createSaveInput('  Erfundene Notiz über den Glutpuls.  ')
  )

  assert.equal(result.ok, true)
  assert.equal(result.status, 'artifactUnchanged')
  assert.equal(result.changed, false)
  assert.equal(system.idGenerator.calls.length, 0)
  assert.equal(system.clock.calls.length, 0)
  assert.equal(artifactSystem.state.saveCalls, 0)
  assert.deepEqual(trace, ['hubLoad', 'artifactLoad'])
})

test('wendet die 10.000-Zeichen-Grenze erst nach dem Trimmen an', () => {
  const acceptedSystem = createService({
    generatedIds: ['artifact-boundary'],
  })
  const acceptedResult = acceptedSystem.service.saveNote(
    createSaveInput(`  ${'x'.repeat(10000)}  `)
  )

  assert.equal(acceptedResult.ok, true)
  assert.equal(acceptedResult.status, 'artifactCreated')
  assert.equal(
    acceptedResult.artifactStore.artifacts[0].content.length,
    10000
  )

  for (const rejectedContent of [
    '   ',
    `  ${'x'.repeat(10001)}  `,
  ]) {
    const rejectedSystem = createService()
    const rejectedResult = rejectedSystem.service.saveNote(
      createSaveInput(rejectedContent)
    )

    assert.equal(rejectedResult.ok, false)
    assert.equal(rejectedResult.status, 'validationFailed')
    assert.equal(rejectedResult.changed, false)
    assert.equal(rejectedResult.error.code, 'invalidLearningArtifactInput')
    assert.equal(rejectedSystem.idGenerator.calls.length, 0)
    assert.equal(rejectedSystem.clock.calls.length, 0)
    assert.equal(rejectedSystem.artifactSystem.state.saveCalls, 0)
  }
})

test('prüft Modul, Kapitel und LearningNode entlang der vollständigen Kette', () => {
  const cases = [
    [
      createTargetInput({ moduleId: 'module-missing' }),
      'moduleNotFound',
    ],
    [
      createTargetInput({ chapterId: 'chapter-missing' }),
      'chapterNotFound',
    ],
    [
      createTargetInput({
        moduleId: 'module-glass-orchard',
      }),
      'chapterModuleMismatch',
    ],
    [
      createTargetInput({ learningNodeId: 'node-missing' }),
      'learningNodeNotFound',
    ],
    [
      createTargetInput({ learningNodeId: 'node-ember-route' }),
      'learningNodeChapterMismatch',
    ],
    [
      createTargetInput({
        moduleId: 'module-glass-orchard',
        chapterId: 'chapter-glass-leaves',
        learningNodeId: 'node-ember-pulse',
      }),
      'learningNodeChapterMismatch',
    ],
  ]

  for (const [references, expectedCode] of cases) {
    const system = createService()
    const result = system.service.clearNote(references)

    assert.equal(result.ok, false)
    assert.equal(result.error.code, expectedCode)
    assert.equal(result.changed, false)
    assert.equal(system.hubSystem.state.loadCalls, 1)
    assert.equal(system.artifactSystem.state.loadCalls, 0)
    assert.equal(system.artifactSystem.state.saveCalls, 0)
    assert.equal(system.idGenerator.calls.length, 0)
    assert.equal(system.clock.calls.length, 0)
  }
})

test('weist leere oder ungetrimmte Referenz-IDs vor dem Artifact-Load zurück', () => {
  const system = createService()
  const result = system.service.saveSummary({
    moduleId: ' module-ember-map ',
    chapterId: '',
    learningNodeId: null,
    content: 'Erfundener Text.',
  })

  assert.equal(result.ok, false)
  assert.equal(result.status, 'validationFailed')
  assert.deepEqual(Object.keys(result.error.fieldErrors), [
    'moduleId',
    'chapterId',
    'learningNodeId',
  ])
  assert.equal(system.hubSystem.state.loadCalls, 1)
  assert.equal(system.artifactSystem.state.loadCalls, 0)
  assert.equal(system.artifactSystem.state.saveCalls, 0)
})

test('versucht bei Kollisionen höchstens fünfmal eine Artefakt-ID', () => {
  const artifactSystem = createArtifactStorageDouble({
    initialArtifactStore: createPrivateArtifactStore([createArtifact()]),
  })
  const system = createService({
    artifactSystem,
    generatedIds: Array(5).fill('artifact-ember-note'),
  })

  const result = system.service.saveNote({
    ...createTargetInput({
      chapterId: 'chapter-ember-routes',
      learningNodeId: 'node-ember-route',
    }),
    content: 'Erfundene Routennotiz.',
  })

  assert.equal(result.ok, false)
  assert.equal(result.status, 'generationFailed')
  assert.equal(result.error.code, 'learningArtifactIdGenerationFailed')
  assert.equal(system.idGenerator.calls.length, 5)
  assert.equal(system.clock.calls.length, 0)
  assert.equal(artifactSystem.state.saveCalls, 0)
})

test('behandelt geworfene und ungültige ID-Versuche kontrolliert', () => {
  const system = createService({
    generatedIds: [
      new Error('Synthetischer Generatorfehler'),
      '',
      ' ungetrimmt ',
      'artifact-generated-after-errors',
    ],
  })

  const result = system.service.saveSummary(
    createSaveInput('Erfundene Zusammenfassung nach Generatorfehlern.')
  )

  assert.equal(result.ok, true)
  assert.equal(result.status, 'artifactCreated')
  assert.equal(result.artifactStore.artifacts[0].id, 'artifact-generated-after-errors')
  assert.equal(system.idGenerator.calls.length, 4)
  assert.equal(system.clock.calls.length, 1)
  assert.equal(system.artifactSystem.state.saveCalls, 1)
})

test('behandelt Zeitgeneratorfehler und nicht kanonische Zeiten kontrolliert', () => {
  const clockCases = [
    [new Error('Synthetischer Uhrfehler'), 'learningArtifactClockFailed'],
    ['2026-07-19T11:00:00Z', 'invalidLearningArtifactTimestamp'],
    ['2026-02-30T11:00:00.000Z', 'invalidLearningArtifactTimestamp'],
    [null, 'invalidLearningArtifactTimestamp'],
  ]

  for (const [timestamp, expectedCode] of clockCases) {
    const system = createService({ timestamps: [timestamp] })
    const result = system.service.saveNote(createSaveInput())

    assert.equal(result.ok, false)
    assert.equal(result.status, 'generationFailed')
    assert.equal(result.error.code, expectedCode)
    assert.equal(system.idGenerator.calls.length, 1)
    assert.equal(system.clock.calls.length, 1)
    assert.equal(system.artifactSystem.state.saveCalls, 0)
  }
})

test('weist einen rückläufigen Aktualisierungszeitpunkt zurück', () => {
  const existingArtifact = createArtifact({
    createdAt: '2026-07-19T10:00:00.000Z',
    updatedAt: '2026-07-19T12:00:00.000Z',
  })
  const artifactSystem = createArtifactStorageDouble({
    initialArtifactStore: createPrivateArtifactStore([existingArtifact]),
  })
  const system = createService({
    artifactSystem,
    timestamps: ['2026-07-19T11:59:59.999Z'],
  })

  const result = system.service.saveNote(
    createSaveInput('Erfundener geänderter Text.')
  )

  assert.equal(result.ok, false)
  assert.equal(result.status, 'generationFailed')
  assert.equal(result.error.code, 'learningArtifactTimestampMovedBackward')
  assert.deepEqual(result.artifactStore, createPrivateArtifactStore([
    existingArtifact,
  ]))
  assert.equal(system.idGenerator.calls.length, 0)
  assert.equal(system.clock.calls.length, 1)
  assert.equal(artifactSystem.state.saveCalls, 0)
})

test('erlaubt beim Update einen gleichen, aber nicht rückläufigen Zeitpunkt', () => {
  const existingArtifact = createArtifact()
  const artifactSystem = createArtifactStorageDouble({
    initialArtifactStore: createPrivateArtifactStore([existingArtifact]),
  })
  const system = createService({
    artifactSystem,
    timestamps: [existingArtifact.updatedAt],
  })

  const result = system.service.saveNote(
    createSaveInput('Erfundener Text bei gleichem Zeitwert.')
  )

  assert.equal(result.ok, true)
  assert.equal(result.status, 'artifactUpdated')
  assert.equal(result.artifactStore.artifacts[0].updatedAt, existingArtifact.updatedAt)
  assert.equal(artifactSystem.state.saveCalls, 1)
})

test('clearNote entfernt keine summary und erzeugt weder ID noch Zeit', () => {
  const note = createArtifact()
  const summary = createArtifact({
    id: 'artifact-ember-summary',
    type: 'summary',
    content: 'Erfundene Zusammenfassung.',
  })
  const artifactSystem = createArtifactStorageDouble({
    initialArtifactStore: createPrivateArtifactStore([note, summary]),
  })
  const system = createService({ artifactSystem })

  const result = system.service.clearNote(createTargetInput())

  assert.equal(result.ok, true)
  assert.equal(result.status, 'artifactCleared')
  assert.equal(result.changed, true)
  assert.deepEqual(result.artifactStore.artifacts, [summary])
  assert.equal(system.idGenerator.calls.length, 0)
  assert.equal(system.clock.calls.length, 0)
  assert.equal(artifactSystem.state.saveCalls, 1)
})

test('clearSummary entfernt keine note', () => {
  const note = createArtifact()
  const summary = createArtifact({
    id: 'artifact-ember-summary',
    type: 'summary',
    content: 'Erfundene Zusammenfassung.',
  })
  const artifactSystem = createArtifactStorageDouble({
    initialArtifactStore: createPrivateArtifactStore([note, summary]),
  })
  const system = createService({ artifactSystem })

  const result = system.service.clearSummary(createTargetInput())

  assert.equal(result.ok, true)
  assert.equal(result.status, 'artifactCleared')
  assert.deepEqual(result.artifactStore.artifacts, [note])
  assert.equal(artifactSystem.state.saveCalls, 1)
})

test('leert ein nicht vorhandenes Artefakt als vollständigen No-op', () => {
  const summary = createArtifact({
    id: 'artifact-ember-summary',
    type: 'summary',
    content: 'Erfundene Zusammenfassung.',
  })
  const artifactSystem = createArtifactStorageDouble({
    initialArtifactStore: createPrivateArtifactStore([summary]),
  })
  const system = createService({ artifactSystem })

  const result = system.service.clearNote(createTargetInput())

  assert.equal(result.ok, true)
  assert.equal(result.status, 'artifactAlreadyEmpty')
  assert.equal(result.changed, false)
  assert.deepEqual(result.artifactStore.artifacts, [summary])
  assert.equal(system.idGenerator.calls.length, 0)
  assert.equal(system.clock.calls.length, 0)
  assert.equal(artifactSystem.state.saveCalls, 0)
})

test('überschreibt keine strukturell beschädigten oder synthetischen Stores', () => {
  const invalidStores = [
    { ...createPrivateArtifactStore(), schemaVersion: 2 },
    { ...createPrivateArtifactStore(), dataOrigin: 'synthetic' },
    createPrivateArtifactStore([
      createArtifact({ content: ' ungetrimmt ' }),
    ]),
  ]

  for (const invalidStore of invalidStores) {
    const artifactSystem = createArtifactStorageDouble({
      loadResult: {
        ok: true,
        status: 'found',
        artifactStore: invalidStore,
      },
    })
    const system = createService({ artifactSystem })
    const result = system.service.saveNote(createSaveInput())

    assert.equal(result.ok, false)
    assert.equal(result.status, 'invalidStoredData')
    assert.equal(result.changed, false)
    assert.equal(artifactSystem.state.saveCalls, 0)
    assert.equal(system.idGenerator.calls.length, 0)
    assert.equal(system.clock.calls.length, 0)
  }
})

test('überschreibt keine verwaisten oder falsch zugeordneten Referenzen', () => {
  const invalidReferences = [
    { moduleId: 'module-orphaned' },
    { chapterId: 'chapter-orphaned' },
    { learningNodeId: 'node-orphaned' },
    {
      moduleId: 'module-glass-orchard',
    },
    {
      chapterId: 'chapter-ember-routes',
    },
  ]

  for (const referenceOverrides of invalidReferences) {
    const artifactSystem = createArtifactStorageDouble({
      initialArtifactStore: createPrivateArtifactStore([
        createArtifact(referenceOverrides),
      ]),
    })
    const system = createService({ artifactSystem })
    const result = system.service.saveSummary(createSaveInput())

    assert.equal(result.ok, false)
    assert.equal(result.status, 'invalidStoredData')
    assert.equal(result.changed, false)
    assert.equal(artifactSystem.state.saveCalls, 0)
    assert.equal(system.idGenerator.calls.length, 0)
    assert.equal(system.clock.calls.length, 0)
  }
})

test('erhält bei Quota-, Schreib- und geworfenen Save-Fehlern den alten Store', () => {
  const cases = [
    {
      saveResult: {
        ok: false,
        status: 'quotaExceeded',
        error: {
          code: 'storageQuotaExceeded',
          message: 'private-storage-message-sentinel',
        },
      },
      status: 'quotaExceeded',
      code: 'storageQuotaExceeded',
    },
    {
      saveResult: { ok: true, status: 'found' },
      status: 'storageFailed',
      code: 'unexpectedStorageResult',
    },
    {
      throwOnSave: true,
      status: 'writeFailed',
      code: 'learningArtifactStorageWriteFailed',
    },
  ]

  for (const writeCase of cases) {
    const initialStore = createPrivateArtifactStore([createArtifact()])
    const artifactSystem = createArtifactStorageDouble({
      initialArtifactStore: initialStore,
      saveResult: writeCase.saveResult,
      throwOnSave: writeCase.throwOnSave,
    })
    const system = createService({ artifactSystem })
    const result = system.service.saveNote(
      createSaveInput('Erfundener geänderter Artefakttext.')
    )

    assert.equal(result.ok, false)
    assert.equal(result.status, writeCase.status)
    assert.equal(result.error.code, writeCase.code)
    assert.equal(result.changed, false)
    assert.deepEqual(result.artifactStore, initialStore)
    assert.deepEqual(artifactSystem.peekStoredArtifactStore(), initialStore)
    assert.equal(artifactSystem.state.saveCalls, 1)
    assert.equal(
      JSON.stringify(result.error).includes('private-storage-message'),
      false
    )
  }
})

test('normalisiert fehlende, geworfene und malformed Abhängigkeiten', () => {
  const missingHubResult = createLearningArtifactService({
    learningArtifactStorage: createArtifactStorageDouble()
      .learningArtifactStorage,
  }).saveNote(createSaveInput())
  assert.equal(missingHubResult.status, 'unavailable')
  assert.equal(missingHubResult.error.code, 'learningHubServiceUnavailable')

  const thrownHubResult = createService({
    hubSystem: createHubServiceDouble({ throwOnLoad: true }),
  }).service.saveNote(createSaveInput())
  assert.equal(thrownHubResult.status, 'readFailed')
  assert.equal(thrownHubResult.error.code, 'learningHubServiceReadFailed')

  const malformedHubResult = createService({
    hubSystem: createHubServiceDouble({
      loadResult: { ok: 'true', status: 'loaded', hub: createPrivateHub() },
    }),
  }).service.saveNote(createSaveInput())
  assert.equal(malformedHubResult.status, 'serviceFailed')
  assert.equal(malformedHubResult.error.code, 'unexpectedLearningHubResult')

  const thrownStorageResult = createService({
    artifactSystem: createArtifactStorageDouble({ throwOnLoad: true }),
  }).service.loadArtifacts()
  assert.equal(thrownStorageResult.status, 'readFailed')
  assert.equal(
    thrownStorageResult.error.code,
    'learningArtifactStorageReadFailed'
  )

  const malformedStorageResult = createService({
    artifactSystem: createArtifactStorageDouble({
      loadResult: { ok: true, status: 'found' },
    }),
  }).service.loadArtifacts()
  assert.equal(malformedStorageResult.status, 'storageFailed')
  assert.equal(malformedStorageResult.error.code, 'unexpectedStorageResult')

  const incompleteStorageFailure = createService({
    artifactSystem: createArtifactStorageDouble({
      loadResult: {
        ok: false,
        status: 'readFailed',
        error: { code: 'storageReadFailed' },
      },
    }),
  }).service.loadArtifacts()
  assert.equal(incompleteStorageFailure.status, 'readFailed')
  assert.equal(
    incompleteStorageFailure.error.code,
    'learningArtifactStorageReadFailed'
  )
})

test('übernimmt invalidLearningHubData ohne fremde private Fehlermeldung', () => {
  const privateDependencyMessage =
    'private-learning-hub-storage-message-sentinel'
  const input = createSaveInput('Erfundener unveränderlicher Text.')
  const inputSnapshot = cloneValue(input)
  const hubSystem = createHubServiceDouble({
    loadResult: {
      ok: false,
      status: 'invalidStoredData',
      error: {
        code: 'invalidLearningHubData',
        message: privateDependencyMessage,
      },
    },
  })
  const artifactSystem = createArtifactStorageDouble()
  const system = createService({ hubSystem, artifactSystem })

  const result = system.service.saveNote(input)

  assert.equal(result.ok, false)
  assert.equal(result.status, 'invalidStoredData')
  assert.equal(result.changed, false)
  assert.equal(result.artifactStore, null)
  assert.equal(result.error.code, 'invalidLearningHubData')
  assert.equal(
    JSON.stringify(result.error).includes(privateDependencyMessage),
    false
  )
  assert.deepEqual(input, inputSnapshot)
  assert.equal(hubSystem.state.loadCalls, 1)
  assert.equal(artifactSystem.state.loadCalls, 0)
  assert.equal(artifactSystem.state.saveCalls, 0)
  assert.equal(system.idGenerator.calls.length, 0)
  assert.equal(system.clock.calls.length, 0)
})

test('mutiert weder Eingaben noch geladene Zustände oder frühere Rückgaben', () => {
  const hubSystem = createHubServiceDouble()
  const initialStore = createPrivateArtifactStore([createArtifact()])
  const artifactSystem = createArtifactStorageDouble({
    initialArtifactStore: initialStore,
  })
  const hubSnapshot = hubSystem.peekHub()
  const input = createSaveInput('Erfundene unveränderliche Eingabe.')
  const inputSnapshot = cloneValue(input)
  const system = createService({
    hubSystem,
    artifactSystem,
    timestamps: ['2026-07-19T12:30:00.000Z'],
  })

  const result = system.service.saveNote(input)
  const storedAfterSave = artifactSystem.peekStoredArtifactStore()

  assert.equal(result.ok, true)
  assert.deepEqual(input, inputSnapshot)
  assert.deepEqual(hubSystem.peekHub(), hubSnapshot)
  assert.deepEqual(initialStore, createPrivateArtifactStore([createArtifact()]))
  assert.notStrictEqual(
    artifactSystem.state.savedArguments[0],
    artifactSystem.getStoredReference()
  )

  result.artifactStore.artifacts[0].content = 'Nur Rückgabe mutiert.'
  artifactSystem.state.savedArguments[0].artifacts[0].content =
    'Nur Save-Argument mutiert.'
  assert.deepEqual(artifactSystem.peekStoredArtifactStore(), storedAfterSave)
})

test('Fehler enthalten keine privaten Texte, IDs, Ketten oder Zeitwerte', () => {
  const hub = createPrivateHub()
  hub.modules[0].title = 'private-module-title-sentinel'
  hub.modules[0].chapters[0].title = 'private-chapter-title-sentinel'
  hub.modules[0].chapters[0].learningNodes[0].title =
    'private-node-title-sentinel'
  hub.modules[0].chapters[0].learningNodes[0].content =
    'private-node-content-sentinel'
  const artifact = createArtifact({
    content: 'private-artifact-content-sentinel',
    updatedAt: '2026-07-19T12:00:00.000Z',
  })
  const privateMarkers = [
    hub.modules[0].title,
    hub.modules[0].chapters[0].title,
    hub.modules[0].chapters[0].learningNodes[0].title,
    hub.modules[0].chapters[0].learningNodes[0].content,
    artifact.id,
    artifact.moduleId,
    artifact.chapterId,
    artifact.learningNodeId,
    artifact.content,
    artifact.createdAt,
    artifact.updatedAt,
  ]
  const hubSystem = createHubServiceDouble({ initialHub: hub })
  const artifactSystem = createArtifactStorageDouble({
    initialArtifactStore: createPrivateArtifactStore([artifact]),
  })
  const result = createService({
    hubSystem,
    artifactSystem,
    timestamps: ['2026-07-19T11:00:00.000Z'],
  }).service.saveNote(createSaveInput('Erfundener Ersatztext.'))
  const serializedError = JSON.stringify(result.error)

  assert.equal(result.ok, false)
  privateMarkers.forEach((privateMarker) => {
    assert.equal(serializedError.includes(privateMarker), false)
  })

  const dependencyMarker = 'private-dependency-code-sentinel'
  const dependencyResult = createService({
    artifactSystem: createArtifactStorageDouble({
      loadResult: {
        ok: false,
        status: 'private-status-sentinel',
        error: {
          code: dependencyMarker,
          message: 'private-dependency-message-sentinel',
        },
      },
    }),
  }).service.loadArtifacts()

  assert.equal(dependencyResult.status, 'readFailed')
  assert.equal(
    dependencyResult.error.code,
    'learningArtifactStorageReadFailed'
  )
  assert.equal(JSON.stringify(dependencyResult.error).includes('private-'), false)
})
