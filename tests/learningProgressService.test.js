import assert from 'node:assert/strict'
import test from 'node:test'

import { validateLearningProgress } from '../src/modules/learning-hub/learningProgressContract.js'
import { createLearningProgressService } from '../src/services/learningProgressService.js'

function cloneValue(value) {
  return structuredClone(value)
}

// Sämtliche Inhalte dieser Fixtures sind frei erfunden und synthetisch.
function createPrivateHub() {
  return {
    schemaVersion: 2,
    dataOrigin: 'private',
    modules: [
      {
        id: 'module-ember-map',
        title: 'Vertraulicher synthetischer Modultitel',
        position: 1,
        chapters: [
          {
            id: 'chapter-ember-signals',
            title: 'Vertraulicher synthetischer Kapiteltitel',
            position: 1,
            learningNodes: [
              {
                id: 'node-ember-pulse',
                title: 'Vertraulicher synthetischer Kartentitel',
                content: 'Vertraulicher synthetischer LearningNode-Inhalt.',
                position: 1,
              },
            ],
          },
          {
            id: 'chapter-ember-routes',
            title: 'Erfundene Glutrouten',
            position: 2,
            learningNodes: [],
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
            learningNodes: [],
          },
        ],
      },
    ],
  }
}

function createProgressEvent(overrides = {}) {
  return {
    id: 'learning-progress-event-ember-1',
    type: 'chapter.completed',
    moduleId: 'module-ember-map',
    chapterId: 'chapter-ember-signals',
    occurredAt: '2026-07-18T12:00:00.000Z',
    ...overrides,
  }
}

function createPrivateProgressLog(events = []) {
  return {
    schemaVersion: 1,
    dataOrigin: 'private',
    events,
  }
}

function createHubServiceDouble({
  initialHub = createPrivateHub(),
  loadResult,
  throwOnLoad = false,
} = {}) {
  let currentHub = cloneValue(initialHub)
  const state = { loadCalls: 0 }

  return {
    learningHubService: {
      loadHub() {
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
    replaceHub(nextHub) {
      currentHub = cloneValue(nextHub)
    },
    state,
  }
}

function createProgressStorageDouble({
  initialProgressLog,
  loadResult,
  saveResult,
  throwOnLoad = false,
  throwOnSave = false,
} = {}) {
  let storedProgressLog = initialProgressLog === undefined
    ? null
    : cloneValue(initialProgressLog)
  const state = {
    loadCalls: 0,
    saveCalls: 0,
    savedArguments: [],
  }

  return {
    learningProgressStorage: {
      loadLearningProgress() {
        state.loadCalls += 1

        if (throwOnLoad) {
          throw new Error('Synthetischer Progress-Lesefehler')
        }

        if (loadResult !== undefined) {
          return typeof loadResult === 'function'
            ? loadResult()
            : loadResult
        }

        if (storedProgressLog === null) {
          return {
            ok: true,
            status: 'missing',
            progressLog: createPrivateProgressLog(),
          }
        }

        return {
          ok: true,
          status: 'found',
          progressLog: storedProgressLog,
        }
      },

      saveLearningProgress(progressLog) {
        state.saveCalls += 1
        state.savedArguments.push(progressLog)

        assert.deepEqual(validateLearningProgress(progressLog), {
          ok: true,
          errors: [],
        })
        assert.equal(progressLog.dataOrigin, 'private')

        if (throwOnSave) {
          throw new Error('Synthetischer Progress-Schreibfehler')
        }

        const configuredResult = typeof saveResult === 'function'
          ? saveResult(progressLog)
          : saveResult

        if (configuredResult !== undefined && configuredResult.ok !== true) {
          return configuredResult
        }

        storedProgressLog = cloneValue(progressLog)
        return configuredResult === undefined
          ? { ok: true, status: 'saved' }
          : configuredResult
      },
    },
    getStoredReference() {
      return storedProgressLog
    },
    peekStoredProgressLog() {
      return storedProgressLog === null
        ? null
        : cloneValue(storedProgressLog)
    },
    replaceProgressLog(nextProgressLog) {
      storedProgressLog = nextProgressLog === null
        ? null
        : cloneValue(nextProgressLog)
    },
    state,
  }
}

function createIdGenerator(...generatedValues) {
  const calls = []
  let valueIndex = 0

  function generateLearningProgressEventId() {
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

  return { calls, generateLearningProgressEventId }
}

function createClock(...timestamps) {
  const calls = []
  let timestampIndex = 0

  function now() {
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
  hubSystem = createHubServiceDouble(),
  progressSystem = createProgressStorageDouble(),
  generatedIds = ['learning-progress-event-default'],
  timestamps = ['2026-07-18T14:30:00.000Z'],
} = {}) {
  const idGenerator = createIdGenerator(...generatedIds)
  const clock = createClock(...timestamps)
  const service = createLearningProgressService({
    learningHubService: hubSystem.learningHubService,
    learningProgressStorage: progressSystem.learningProgressStorage,
    generateLearningProgressEventId:
      idGenerator.generateLearningProgressEventId,
    now: clock.now,
  })

  return { service, hubSystem, progressSystem, idGenerator, clock }
}

function createTargetInput() {
  return {
    moduleId: 'module-ember-map',
    chapterId: 'chapter-ember-signals',
  }
}

test('lädt einen fehlenden Log schreibfrei als leeren privaten Fortschritt', () => {
  const system = createService()

  const firstResult = system.service.loadProgress()

  assert.equal(firstResult.ok, true)
  assert.equal(firstResult.status, 'empty')
  assert.equal(firstResult.changed, false)
  assert.deepEqual(firstResult.progressLog, createPrivateProgressLog())
  assert.deepEqual(firstResult.projection.map((moduleProgress) => ({
    moduleId: moduleProgress.moduleId,
    completedChapterCount: moduleProgress.completedChapterCount,
    progressPercent: moduleProgress.progressPercent,
  })), [
    {
      moduleId: 'module-ember-map',
      completedChapterCount: 0,
      progressPercent: 0,
    },
    {
      moduleId: 'module-glass-orchard',
      completedChapterCount: 0,
      progressPercent: 0,
    },
  ])
  assert.equal(system.hubSystem.state.loadCalls, 1)
  assert.equal(system.progressSystem.state.loadCalls, 1)
  assert.equal(system.progressSystem.state.saveCalls, 0)
  assert.equal(system.idGenerator.calls.length, 0)
  assert.equal(system.clock.calls.length, 0)
  assert.equal(Object.isFrozen(system.service), true)

  firstResult.progressLog.events.push(createProgressEvent())
  firstResult.projection[0].chapters[0].isCompleted = true
  const secondResult = system.service.loadProgress()

  assert.deepEqual(secondResult.progressLog.events, [])
  assert.equal(secondResult.projection[0].chapters[0].isCompleted, false)
  assert.equal(system.progressSystem.state.saveCalls, 0)
})

test('lädt einen validen Log und liefert eine inhaltsfreie Projektion', () => {
  const progressSystem = createProgressStorageDouble({
    initialProgressLog: createPrivateProgressLog([
      createProgressEvent(),
    ]),
  })
  const system = createService({ progressSystem })

  const result = system.service.loadProgress()
  const serializedProjection = JSON.stringify(result.projection)

  assert.equal(result.ok, true)
  assert.equal(result.status, 'loaded')
  assert.equal(result.changed, false)
  assert.equal(result.projection[0].chapters[0].isCompleted, true)
  assert.equal(result.projection[0].progressPercent, 50)
  assert.equal(serializedProjection.includes('title'), false)
  assert.equal(serializedProjection.includes('content'), false)
  assert.equal(serializedProjection.includes('learningNodes'), false)
})

test('hängt bei completeChapter genau ein unverändertes Ereignis an', () => {
  const hubSystem = createHubServiceDouble()
  const loadedHubReference = hubSystem.getHubReference()
  const hubSnapshot = cloneValue(loadedHubReference)
  const progressSystem = createProgressStorageDouble({
    initialProgressLog: createPrivateProgressLog(),
  })
  const loadedProgressReference = progressSystem.getStoredReference()
  const progressSnapshot = cloneValue(loadedProgressReference)
  const system = createService({
    hubSystem,
    progressSystem,
    generatedIds: ['learning-progress-event-complete-1'],
    timestamps: ['2026-07-18T15:00:00.000Z'],
  })
  const input = createTargetInput()
  const inputSnapshot = cloneValue(input)

  const result = system.service.completeChapter(input)

  assert.equal(result.ok, true)
  assert.equal(result.status, 'chapterCompleted')
  assert.equal(result.changed, true)
  assert.deepEqual(result.progressLog.events, [
    {
      id: 'learning-progress-event-complete-1',
      type: 'chapter.completed',
      moduleId: 'module-ember-map',
      chapterId: 'chapter-ember-signals',
      occurredAt: '2026-07-18T15:00:00.000Z',
    },
  ])
  assert.equal(result.projection[0].chapters[0].isCompleted, true)
  assert.equal(result.projection[0].progressPercent, 50)
  assert.deepEqual(input, inputSnapshot)
  assert.deepEqual(loadedHubReference, hubSnapshot)
  assert.deepEqual(loadedProgressReference, progressSnapshot)
  assert.equal(hubSystem.state.loadCalls, 1)
  assert.equal(progressSystem.state.loadCalls, 1)
  assert.equal(progressSystem.state.saveCalls, 1)
  assert.equal(system.idGenerator.calls.length, 1)
  assert.equal(system.clock.calls.length, 1)

  const savedArgument = progressSystem.state.savedArguments[0]
  const savedSnapshot = cloneValue(savedArgument)
  assert.notStrictEqual(result.progressLog, savedArgument)
  assert.notStrictEqual(result.progressLog.events, savedArgument.events)
  assert.notStrictEqual(result.progressLog.events[0], savedArgument.events[0])
  result.progressLog.events[0].type = 'chapter.reopened'
  assert.deepEqual(savedArgument, savedSnapshot)
})

test('completeChapter ist für ein abgeschlossenes Kapitel ein vollständiger No-op', () => {
  const initialLog = createPrivateProgressLog([createProgressEvent()])
  const progressSystem = createProgressStorageDouble({
    initialProgressLog: initialLog,
  })
  const system = createService({ progressSystem })

  const result = system.service.completeChapter(createTargetInput())

  assert.equal(result.ok, true)
  assert.equal(result.status, 'chapterAlreadyCompleted')
  assert.equal(result.changed, false)
  assert.deepEqual(result.progressLog, initialLog)
  assert.equal(result.projection[0].chapters[0].isCompleted, true)
  assert.equal(progressSystem.state.saveCalls, 0)
  assert.equal(system.idGenerator.calls.length, 0)
  assert.equal(system.clock.calls.length, 0)
})

test('reopenChapter ist für ein offenes Kapitel ein vollständiger No-op', () => {
  const progressSystem = createProgressStorageDouble({
    initialProgressLog: createPrivateProgressLog(),
  })
  const system = createService({ progressSystem })

  const result = system.service.reopenChapter(createTargetInput())

  assert.equal(result.ok, true)
  assert.equal(result.status, 'chapterAlreadyOpen')
  assert.equal(result.changed, false)
  assert.deepEqual(result.progressLog.events, [])
  assert.equal(result.projection[0].chapters[0].isCompleted, false)
  assert.equal(progressSystem.state.saveCalls, 0)
  assert.equal(system.idGenerator.calls.length, 0)
  assert.equal(system.clock.calls.length, 0)
})

test('unterstützt completed, reopened und erneut completed append-only', () => {
  const progressSystem = createProgressStorageDouble({
    initialProgressLog: createPrivateProgressLog(),
  })
  const system = createService({
    progressSystem,
    generatedIds: [
      'learning-progress-event-sequence-1',
      'learning-progress-event-sequence-2',
      'learning-progress-event-sequence-3',
    ],
    timestamps: [
      '2026-07-18T18:00:00.000Z',
      '2026-07-18T17:00:00.000Z',
      '2026-07-18T16:00:00.000Z',
    ],
  })

  const firstResult = system.service.completeChapter(createTargetInput())
  const secondResult = system.service.reopenChapter(createTargetInput())
  const thirdResult = system.service.completeChapter(createTargetInput())

  assert.equal(firstResult.status, 'chapterCompleted')
  assert.equal(secondResult.status, 'chapterReopened')
  assert.equal(secondResult.projection[0].chapters[0].isCompleted, false)
  assert.equal(thirdResult.status, 'chapterCompleted')
  assert.equal(thirdResult.projection[0].chapters[0].isCompleted, true)
  assert.deepEqual(
    thirdResult.progressLog.events.map(({ type }) => type),
    ['chapter.completed', 'chapter.reopened', 'chapter.completed']
  )
  assert.deepEqual(
    thirdResult.progressLog.events.map(({ occurredAt }) => occurredAt),
    [
      '2026-07-18T18:00:00.000Z',
      '2026-07-18T17:00:00.000Z',
      '2026-07-18T16:00:00.000Z',
    ]
  )
  assert.equal(progressSystem.state.loadCalls, 3)
  assert.equal(progressSystem.state.saveCalls, 3)
})

test('lädt Hub und Log bei jeder Mutation neu als autoritative Wahrheiten', () => {
  const hubSystem = createHubServiceDouble()
  const progressSystem = createProgressStorageDouble()
  const system = createService({
    hubSystem,
    progressSystem,
    generatedIds: ['learning-progress-event-after-external-change'],
  })

  const emptyLoad = system.service.loadProgress()
  assert.equal(emptyLoad.status, 'empty')

  progressSystem.replaceProgressLog(createPrivateProgressLog())
  const changedHub = createPrivateHub()
  changedHub.modules[0].title = 'Extern veränderter synthetischer Titel'
  hubSystem.replaceHub(changedHub)

  const mutationResult = system.service.completeChapter(createTargetInput())

  assert.equal(mutationResult.ok, true)
  assert.equal(hubSystem.state.loadCalls, 2)
  assert.equal(progressSystem.state.loadCalls, 2)
  assert.equal(progressSystem.state.saveCalls, 1)
})

test('prüft Zielreferenzen und Modul-Kapitel-Zugehörigkeit ohne Save', () => {
  const cases = [
    {
      input: {
        moduleId: 'module-does-not-exist',
        chapterId: 'chapter-ember-signals',
      },
      status: 'notFound',
      code: 'moduleNotFound',
    },
    {
      input: {
        moduleId: 'module-ember-map',
        chapterId: 'chapter-does-not-exist',
      },
      status: 'notFound',
      code: 'chapterNotFound',
    },
    {
      input: {
        moduleId: 'module-glass-orchard',
        chapterId: 'chapter-ember-signals',
      },
      status: 'ownershipMismatch',
      code: 'chapterModuleMismatch',
    },
  ]

  for (const referenceCase of cases) {
    const progressSystem = createProgressStorageDouble({
      initialProgressLog: createPrivateProgressLog(),
    })
    const system = createService({ progressSystem })
    const result = system.service.completeChapter(referenceCase.input)

    assert.equal(result.ok, false)
    assert.equal(result.status, referenceCase.status)
    assert.equal(result.error.code, referenceCase.code)
    assert.equal(result.changed, false)
    assert.deepEqual(result.progressLog.events, [])
    assert.ok(Array.isArray(result.projection))
    assert.equal(progressSystem.state.saveCalls, 0)
    assert.equal(system.idGenerator.calls.length, 0)
    assert.equal(system.clock.calls.length, 0)
  }
})

test('weist leere, typfremde und ungetrimmte Ziel-IDs nach beiden Loads zurück', () => {
  const cases = [
    null,
    { moduleId: ' module-ember-map ', chapterId: 'chapter-ember-signals' },
    { moduleId: 'module-ember-map', chapterId: 42 },
  ]

  for (const input of cases) {
    const system = createService()
    const inputSnapshot = cloneValue(input)
    const result = system.service.completeChapter(input)

    assert.equal(result.ok, false)
    assert.equal(result.status, 'validationFailed')
    assert.equal(result.error.code, 'invalidLearningProgressInput')
    assert.ok(Object.keys(result.error.fieldErrors).length > 0)
    assert.deepEqual(input, inputSnapshot)
    assert.equal(system.hubSystem.state.loadCalls, 1)
    assert.equal(system.progressSystem.state.loadCalls, 1)
    assert.equal(system.progressSystem.state.saveCalls, 0)
  }
})

test('lehnt verwaiste und falsch zugeordnete gespeicherte Ereignisse ab', () => {
  const cases = [
    {
      event: createProgressEvent({ moduleId: 'module-orphaned' }),
      code: 'orphanedProgressModuleReference',
    },
    {
      event: createProgressEvent({ chapterId: 'chapter-orphaned' }),
      code: 'orphanedProgressChapterReference',
    },
    {
      event: createProgressEvent({
        moduleId: 'module-glass-orchard',
        chapterId: 'chapter-ember-signals',
      }),
      code: 'progressChapterModuleMismatch',
    },
  ]

  for (const referenceCase of cases) {
    const progressSystem = createProgressStorageDouble({
      initialProgressLog: createPrivateProgressLog([referenceCase.event]),
    })
    const system = createService({ progressSystem })

    const result = system.service.completeChapter({
      moduleId: ' invalid-target ',
      chapterId: '',
    })

    assert.equal(result.ok, false)
    assert.equal(result.status, 'invalidStoredData')
    assert.equal(result.error.code, referenceCase.code)
    assert.equal(result.projection, null)
    assert.equal(progressSystem.state.saveCalls, 0)
    assert.equal(system.idGenerator.calls.length, 0)
    assert.equal(system.clock.calls.length, 0)
  }
})

test('validiert Hub und Log vollständig und akzeptiert nur private Zustände', () => {
  const invalidHub = createPrivateHub()
  invalidHub.modules[0].chapters = []
  const syntheticHub = createPrivateHub()
  syntheticHub.dataOrigin = 'synthetic'

  for (const hub of [invalidHub, syntheticHub]) {
    const hubSystem = createHubServiceDouble({ initialHub: hub })
    const system = createService({ hubSystem })
    const result = system.service.completeChapter(createTargetInput())

    assert.equal(result.ok, false)
    assert.equal(result.status, 'invalidStoredData')
    assert.equal(result.error.code, 'invalidStoredLearningHub')
    assert.equal(system.progressSystem.state.loadCalls, 0)
    assert.equal(system.progressSystem.state.saveCalls, 0)
  }

  const invalidLog = createPrivateProgressLog([
    createProgressEvent({ type: 'chapter.started' }),
  ])
  const syntheticLog = {
    ...createPrivateProgressLog(),
    dataOrigin: 'synthetic',
  }

  for (const progressLog of [invalidLog, syntheticLog]) {
    const progressSystem = createProgressStorageDouble({
      initialProgressLog: progressLog,
    })
    const system = createService({ progressSystem })
    const result = system.service.completeChapter(createTargetInput())

    assert.equal(result.ok, false)
    assert.equal(result.status, 'invalidStoredData')
    assert.equal(result.error.code, 'invalidStoredLearningProgress')
    assert.equal(progressSystem.state.saveCalls, 0)
  }
})

test('löst ID-Kollisionen auf und begrenzt die Erzeugung auf fünf Versuche', () => {
  const initialLog = createPrivateProgressLog([
    createProgressEvent({ id: 'event-collision' }),
  ])
  const collisionSystem = createService({
    progressSystem: createProgressStorageDouble({
      initialProgressLog: initialLog,
    }),
    generatedIds: ['event-collision', 'event-unique'],
  })

  const collisionResult = collisionSystem.service.completeChapter({
    moduleId: 'module-ember-map',
    chapterId: 'chapter-ember-routes',
  })

  assert.equal(collisionResult.ok, true)
  assert.equal(collisionResult.progressLog.events.at(-1).id, 'event-unique')
  assert.equal(collisionSystem.idGenerator.calls.length, 2)

  const exhaustedSystem = createService({
    progressSystem: createProgressStorageDouble({
      initialProgressLog: createPrivateProgressLog(),
    }),
    generatedIds: [' ', ' ', ' ', ' ', ' '],
  })
  const exhaustedResult = exhaustedSystem.service.completeChapter(
    createTargetInput()
  )

  assert.equal(exhaustedResult.ok, false)
  assert.equal(exhaustedResult.status, 'generationFailed')
  assert.equal(
    exhaustedResult.error.code,
    'learningProgressEventIdGenerationFailed'
  )
  assert.equal(exhaustedSystem.idGenerator.calls.length, 5)
  assert.equal(exhaustedSystem.clock.calls.length, 0)
  assert.equal(exhaustedSystem.progressSystem.state.saveCalls, 0)
})

test('behandelt fehlschlagende Generatorversuche kontrolliert', () => {
  const system = createService({
    progressSystem: createProgressStorageDouble({
      initialProgressLog: createPrivateProgressLog(),
    }),
    generatedIds: [new Error('Synthetischer Generatorfehler')],
  })

  const result = system.service.completeChapter(createTargetInput())

  assert.equal(result.ok, false)
  assert.equal(result.status, 'generationFailed')
  assert.equal(
    result.error.code,
    'learningProgressEventIdGenerationFailed'
  )
  assert.equal(system.idGenerator.calls.length, 5)
  assert.equal(system.clock.calls.length, 0)
  assert.equal(system.progressSystem.state.saveCalls, 0)
})

test('weist fehlschlagende und nicht kanonische Uhren ohne Save zurück', () => {
  const clockCases = [
    {
      timestamp: new Error('Synthetischer Uhrfehler'),
      code: 'learningProgressClockFailed',
    },
    {
      timestamp: '2026-07-18T12:00:00Z',
      code: 'invalidLearningProgressTimestamp',
    },
    {
      timestamp: '2026-07-18T12:00:00.000+00:00',
      code: 'invalidLearningProgressTimestamp',
    },
    {
      timestamp: '2026-02-30T12:00:00.000Z',
      code: 'invalidLearningProgressTimestamp',
    },
    {
      timestamp: null,
      code: 'invalidLearningProgressTimestamp',
    },
  ]

  for (const clockCase of clockCases) {
    const system = createService({
      progressSystem: createProgressStorageDouble({
        initialProgressLog: createPrivateProgressLog(),
      }),
      generatedIds: ['learning-progress-event-clock-test'],
      timestamps: [clockCase.timestamp],
    })
    const result = system.service.completeChapter(createTargetInput())

    assert.equal(result.ok, false)
    assert.equal(result.status, 'generationFailed')
    assert.equal(result.error.code, clockCase.code)
    assert.equal(system.idGenerator.calls.length, 1)
    assert.equal(system.clock.calls.length, 1)
    assert.equal(system.progressSystem.state.saveCalls, 0)
    assert.deepEqual(result.progressLog.events, [])
  }
})

test('erhält bei Schreib-, Quota- und geworfenen Fehlern den vorherigen Log', () => {
  const cases = [
    {
      saveResult: {
        ok: false,
        status: 'quotaExceeded',
        error: {
          code: 'storageQuotaExceeded',
          message: 'Synthetischer kontrollierter Quota-Fehler.',
        },
      },
      status: 'quotaExceeded',
      code: 'storageQuotaExceeded',
    },
    {
      saveResult: { ok: 'true', status: 'saved' },
      status: 'storageFailed',
      code: 'unexpectedStorageResult',
    },
    {
      throwOnSave: true,
      status: 'writeFailed',
      code: 'learningProgressStorageWriteFailed',
    },
  ]

  for (const writeCase of cases) {
    const initialLog = createPrivateProgressLog()
    const progressSystem = createProgressStorageDouble({
      initialProgressLog: initialLog,
      saveResult: writeCase.saveResult,
      throwOnSave: writeCase.throwOnSave,
    })
    const system = createService({ progressSystem })
    const result = system.service.completeChapter(createTargetInput())

    assert.equal(result.ok, false)
    assert.equal(result.status, writeCase.status)
    assert.equal(result.error.code, writeCase.code)
    assert.equal(result.changed, false)
    assert.deepEqual(result.progressLog, initialLog)
    assert.equal(result.projection[0].chapters[0].isCompleted, false)
    assert.deepEqual(progressSystem.peekStoredProgressLog(), initialLog)
    assert.equal(progressSystem.state.saveCalls, 1)
  }
})

test('normalisiert fehlende, geworfene und malformed Abhängigkeitsergebnisse', () => {
  const missingHubResult = createLearningProgressService({
    learningProgressStorage: createProgressStorageDouble()
      .learningProgressStorage,
  }).loadProgress()
  assert.equal(missingHubResult.status, 'unavailable')
  assert.equal(missingHubResult.error.code, 'learningHubServiceUnavailable')

  const thrownHubSystem = createHubServiceDouble({ throwOnLoad: true })
  const thrownHubResult = createService({
    hubSystem: thrownHubSystem,
  }).service.loadProgress()
  assert.equal(thrownHubResult.status, 'readFailed')
  assert.equal(
    thrownHubResult.error.code,
    'learningHubServiceReadFailed'
  )

  const malformedHubSystem = createHubServiceDouble({
    loadResult: { ok: 'true', status: 'loaded', hub: createPrivateHub() },
  })
  const malformedHubResult = createService({
    hubSystem: malformedHubSystem,
  }).service.loadProgress()
  assert.equal(malformedHubResult.status, 'serviceFailed')
  assert.equal(
    malformedHubResult.error.code,
    'unexpectedLearningHubResult'
  )

  const thrownProgressSystem = createProgressStorageDouble({
    throwOnLoad: true,
  })
  const thrownProgressResult = createService({
    progressSystem: thrownProgressSystem,
  }).service.loadProgress()
  assert.equal(thrownProgressResult.status, 'readFailed')
  assert.equal(
    thrownProgressResult.error.code,
    'learningProgressStorageReadFailed'
  )

  const malformedProgressSystem = createProgressStorageDouble({
    loadResult: { ok: true, status: 'found' },
  })
  const malformedProgressResult = createService({
    progressSystem: malformedProgressSystem,
  }).service.loadProgress()
  assert.equal(malformedProgressResult.status, 'storageFailed')
  assert.equal(
    malformedProgressResult.error.code,
    'unexpectedStorageResult'
  )
})

test('Fehlertexte enthalten keine privaten Titel oder LearningNode-Inhalte', () => {
  const hub = createPrivateHub()
  const privateMarkers = [
    hub.modules[0].title,
    hub.modules[0].chapters[0].title,
    hub.modules[0].chapters[0].learningNodes[0].title,
    hub.modules[0].chapters[0].learningNodes[0].content,
  ]
  const hubSystem = createHubServiceDouble({ initialHub: hub })
  const progressSystem = createProgressStorageDouble({
    initialProgressLog: createPrivateProgressLog([
      createProgressEvent({ moduleId: 'module-orphaned' }),
    ]),
  })
  const result = createService({
    hubSystem,
    progressSystem,
  }).service.loadProgress()
  const serializedError = JSON.stringify(result.error)

  assert.equal(result.ok, false)
  privateMarkers.forEach((privateMarker) => {
    assert.equal(serializedError.includes(privateMarker), false)
  })
})
