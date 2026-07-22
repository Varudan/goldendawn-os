import assert from 'node:assert/strict'
import test from 'node:test'

import { createLearningHubController } from '../src/modules/learning-hub/learningHubController.js'

function createEmptyHub() {
  return {
    schemaVersion: 2,
    dataOrigin: 'private',
    modules: [],
  }
}

// Sämtliche Inhalte sind frei erfunden und ausschließlich synthetisch.
function createHubFixture() {
  return {
    schemaVersion: 2,
    dataOrigin: 'private',
    modules: [
      {
        id: 'module-orbit',
        title: 'Fiktive Orbitwerkstatt',
        position: 4,
        chapters: [
          {
            id: 'chapter-signals',
            title: 'Erfundene Signalmuster',
            position: 7,
            learningNodes: [
              {
                id: 'node-pulse',
                title: 'Synthetischer Puls',
                content: 'Ein frei erfundener Text über ein ruhiges Pulsmuster.',
                position: 3,
              },
            ],
          },
          {
            id: 'chapter-empty',
            title: 'Leeres Fantasiekapitel',
            position: 10,
            learningNodes: [],
          },
        ],
      },
      {
        id: 'module-garden',
        title: 'Synthetischer Glasgarten',
        position: 9,
        chapters: [
          {
            id: 'chapter-facets',
            title: 'Erfundene Facetten',
            position: 2,
            learningNodes: [],
          },
        ],
      },
    ],
  }
}

function createTestQuestion(overrides = {}) {
  return {
    id: 'question-pulse-1',
    moduleId: 'module-orbit',
    chapterId: 'chapter-signals',
    learningNodeId: 'node-pulse',
    type: 'singleChoice',
    prompt: 'Welche erfundene Farbe hat der ruhige Puls?',
    difficulty: 'medium',
    position: 1,
    revision: 1,
    createdAt: '2026-07-20T08:00:00.000Z',
    updatedAt: '2026-07-20T08:00:00.000Z',
    options: [
      { id: 'option-pulse-blue', label: 'Blau', position: 1 },
      { id: 'option-pulse-gold', label: 'Gold', position: 2 },
    ],
    correctOptionId: 'option-pulse-gold',
    explanation: 'Im frei erfundenen Beispiel leuchtet der Puls golden.',
    ...overrides,
  }
}

function createTestBank(questions = []) {
  return {
    schemaVersion: 1,
    dataOrigin: 'private',
    questions: cloneValue(questions),
  }
}

function createTestBankLoadSuccess(questions = []) {
  return {
    ok: true,
    status: questions.length === 0 ? 'empty' : 'loaded',
    changed: false,
    testBank: createTestBank(questions),
  }
}

function createPublicTestSession(question = createTestQuestion()) {
  return {
    id: 'session-pulse-1',
    moduleId: question.moduleId,
    startedAt: '2026-07-20T09:00:00.000Z',
    questions: [
      {
        id: question.id,
        learningNodeId: question.learningNodeId,
        type: question.type,
        prompt: question.prompt,
        difficulty: question.difficulty,
        options: [...question.options]
          .sort((left, right) => left.position - right.position)
          .map((option) => ({ id: option.id, label: option.label })),
      },
    ],
  }
}

function createPublicTestSessionForQuestions(questions) {
  return {
    id: 'session-pulse-many',
    moduleId: 'module-orbit',
    startedAt: '2026-07-20T09:00:00.000Z',
    questions: questions.map((question) => ({
      id: question.id,
      learningNodeId: question.learningNodeId,
      type: question.type,
      prompt: question.prompt,
      difficulty: question.difficulty,
      options: [...question.options]
        .sort((left, right) => left.position - right.position)
        .map((option) => ({ id: option.id, label: option.label })),
    })),
  }
}

function createCompletedTestSuccessForQuestions(questions) {
  const answers = questions.map((question) => ({
    questionId: question.id,
    questionRevision: question.revision,
    learningNodeId: question.learningNodeId,
    selectedOptionId: question.correctOptionId,
    correctOptionId: question.correctOptionId,
    isCorrect: true,
  }))

  return {
    ok: true,
    status: 'testCompleted',
    changed: true,
    result: {
      attemptId: 'attempt-pulse-many',
      moduleId: 'module-orbit',
      startedAt: '2026-07-20T09:00:00.000Z',
      completedAt: '2026-07-20T09:05:00.000Z',
      totalQuestionCount: questions.length,
      correctAnswerCount: questions.length,
      scorePercent: 100,
      answers,
      feedback: questions.map((question) => ({
        questionId: question.id,
        selectedOptionId: question.correctOptionId,
        correctOptionId: question.correctOptionId,
        isCorrect: true,
        explanation: question.explanation,
      })),
    },
  }
}

function createCompletedTestSuccess(question = createTestQuestion()) {
  return {
    ok: true,
    status: 'testCompleted',
    changed: true,
    result: {
      attemptId: 'attempt-pulse-1',
      moduleId: question.moduleId,
      startedAt: '2026-07-20T09:00:00.000Z',
      completedAt: '2026-07-20T09:05:00.000Z',
      totalQuestionCount: 1,
      correctAnswerCount: 1,
      scorePercent: 100,
      answers: [
        {
          questionId: question.id,
          questionRevision: question.revision,
          learningNodeId: question.learningNodeId,
          selectedOptionId: question.correctOptionId,
          correctOptionId: question.correctOptionId,
          isCorrect: true,
        },
      ],
      feedback: [
        {
          questionId: question.id,
          selectedOptionId: question.correctOptionId,
          correctOptionId: question.correctOptionId,
          isCorrect: true,
          explanation: question.explanation,
        },
      ],
    },
  }
}

function createAttemptHistorySuccess(question = createTestQuestion()) {
  const completed = createCompletedTestSuccess(question).result

  return {
    ok: true,
    status: 'attemptHistoryLoaded',
    changed: false,
    attempts: [
      {
        attemptId: completed.attemptId,
        moduleId: completed.moduleId,
        startedAt: completed.startedAt,
        completedAt: completed.completedAt,
        totalQuestionCount: completed.totalQuestionCount,
        correctAnswerCount: completed.correctAnswerCount,
        scorePercent: completed.scorePercent,
        answers: cloneValue(completed.answers),
      },
    ],
  }
}

function createRoundingHub(chapterCounts) {
  return {
    schemaVersion: 2,
    dataOrigin: 'private',
    modules: chapterCounts.map((totalChapterCount, moduleIndex) => {
      const moduleNumber = moduleIndex + 1

      return {
        id: `module-rounding-${moduleNumber}`,
        title: `Synthetisches Rundungsmodul ${moduleNumber}`,
        position: moduleNumber,
        chapters: Array.from(
          { length: totalChapterCount },
          (_, chapterIndex) => {
            const chapterNumber = chapterIndex + 1

            return {
              id: `chapter-rounding-${moduleNumber}-${chapterNumber}`,
              title: `Synthetisches Rundungskapitel ${chapterNumber}`,
              position: chapterNumber,
              learningNodes: [],
            }
          }
        ),
      }
    }),
  }
}

function createProgressProjection(
  hub,
  completedChapterIds = []
) {
  const completedChapterIdSet = new Set(completedChapterIds)

  return [...hub.modules]
    .sort((firstModule, secondModule) =>
      firstModule.position - secondModule.position
    )
    .map((learningModule) => {
      const chapters = [...learningModule.chapters]
        .sort((firstChapter, secondChapter) =>
          firstChapter.position - secondChapter.position
        )
        .map((chapter) => ({
          chapterId: chapter.id,
          isCompleted: completedChapterIdSet.has(chapter.id),
        }))
      const completedChapterCount = chapters.filter(
        (chapter) => chapter.isCompleted
      ).length
      const totalChapterCount = chapters.length

      return {
        moduleId: learningModule.id,
        completedChapterCount,
        totalChapterCount,
        progressPercent: totalChapterCount === 0
          ? 0
          : Math.round((completedChapterCount / totalChapterCount) * 100),
        isCompleted:
          totalChapterCount > 0 &&
          completedChapterCount === totalChapterCount,
        chapters,
      }
    })
}

function createProgressLoadSuccess(
  hub,
  completedChapterIds = [],
  status = 'loaded'
) {
  return {
    ok: true,
    status,
    changed: false,
    progressLog: {
      schemaVersion: 1,
      dataOrigin: 'private',
      events: [],
    },
    projection: createProgressProjection(hub, completedChapterIds),
  }
}

function createProgressMutationSuccess(
  status,
  changed,
  projection
) {
  return {
    ok: true,
    status,
    changed,
    progressLog: {
      schemaVersion: 1,
      dataOrigin: 'private',
      events: [],
    },
    projection: cloneValue(projection),
  }
}

function createArtifactHubFixture() {
  const hub = createHubFixture()

  hub.modules[0].chapters[0].learningNodes.push({
    id: 'node-echo',
    title: 'Synthetisches Echo',
    content: 'Ein frei erfundener Text über ein ruhiges Echo.',
    position: 6,
  })
  hub.modules[1].chapters[0].learningNodes.push({
    id: 'node-facet',
    title: 'Synthetische Facette',
    content: 'Ein frei erfundener Text über eine Glasfacette.',
    position: 2,
  })

  return hub
}

function createArtifact(overrides = {}) {
  return {
    id: 'artifact-pulse-note',
    type: 'note',
    moduleId: 'module-orbit',
    chapterId: 'chapter-signals',
    learningNodeId: 'node-pulse',
    content: 'Synthetische Notiz zum Pulsmuster.',
    createdAt: '2026-07-19T10:00:00.000Z',
    updatedAt: '2026-07-19T10:00:00.000Z',
    ...overrides,
  }
}

function createArtifactStore(artifacts = []) {
  return {
    schemaVersion: 1,
    dataOrigin: 'private',
    artifacts,
  }
}

function createArtifactLoadSuccess(
  artifactStore = createArtifactStore(),
  status = artifactStore.artifacts.length === 0 ? 'empty' : 'loaded'
) {
  return {
    ok: true,
    status,
    changed: false,
    artifactStore: cloneValue(artifactStore),
  }
}

function createArtifactMutationSuccess(
  status,
  changed,
  artifactStore
) {
  return {
    ok: true,
    status,
    changed,
    artifactStore: cloneValue(artifactStore),
  }
}

function cloneValue(value) {
  return structuredClone(value)
}

function createManualScheduler() {
  const tasks = []

  return {
    scheduleTask(task) {
      const scheduledTask = { task, cancelled: false }
      tasks.push(scheduledTask)
      return () => {
        scheduledTask.cancelled = true
      }
    },
    runNext() {
      const scheduledTask = tasks.shift()
      assert.ok(scheduledTask, 'Es wurde kein Ladevorgang geplant.')

      if (!scheduledTask.cancelled) {
        scheduledTask.task()
      }
    },
    get pendingCount() {
      return tasks.filter((task) => !task.cancelled).length
    },
  }
}

function createViewRecorder() {
  const renders = []
  let actions = null
  let unmountCalls = 0

  return {
    view: {
      render(viewState, nextActions) {
        renders.push(cloneValue(viewState))
        actions = nextActions
      },
      unmount() {
        unmountCalls += 1
      },
    },
    get actions() {
      return actions
    },
    get lastState() {
      return renders.at(-1)
    },
    get unmountCalls() {
      return unmountCalls
    },
    renders,
  }
}

function createServiceDouble({ loadResults, mutationHandlers = {} }) {
  const loadQueue = Array.isArray(loadResults)
    ? [...loadResults]
    : [loadResults]
  const calls = {
    loadHub: [],
    createModule: [],
    renameModule: [],
    addChapter: [],
    renameChapter: [],
    addLearningNode: [],
    updateLearningNode: [],
  }
  const service = {
    loadHub() {
      calls.loadHub.push(undefined)
      const result = loadQueue.length > 1
        ? loadQueue.shift()
        : loadQueue[0]
      return typeof result === 'function' ? result() : cloneValue(result)
    },
  }

  for (const methodName of Object.keys(calls).filter(
    (name) => name !== 'loadHub'
  )) {
    service[methodName] = (input) => {
      calls[methodName].push(cloneValue(input))
      const handler = mutationHandlers[methodName]

      if (typeof handler === 'function') {
        return handler(cloneValue(input))
      }

      return cloneValue(handler)
    }
  }

  return { calls, service }
}

function createProgressServiceDouble({
  loadResults,
  mutationHandlers = {},
}) {
  const loadQueue = Array.isArray(loadResults)
    ? [...loadResults]
    : [loadResults]
  const calls = {
    loadProgress: [],
    completeChapter: [],
    reopenChapter: [],
  }
  const service = {
    loadProgress() {
      calls.loadProgress.push(undefined)
      const result = loadQueue.length > 1
        ? loadQueue.shift()
        : loadQueue[0]
      return typeof result === 'function' ? result() : cloneValue(result)
    },
  }

  for (const methodName of ['completeChapter', 'reopenChapter']) {
    service[methodName] = (input) => {
      calls[methodName].push(cloneValue(input))
      const handler = mutationHandlers[methodName]

      if (typeof handler === 'function') {
        return handler(cloneValue(input))
      }

      return cloneValue(handler)
    }
  }

  return { calls, service }
}

function createArtifactServiceDouble({
  loadResults,
  mutationHandlers = {},
}) {
  const loadQueue = Array.isArray(loadResults)
    ? [...loadResults]
    : [loadResults]
  const calls = {
    loadArtifacts: [],
    saveNote: [],
    saveSummary: [],
    clearNote: [],
    clearSummary: [],
  }
  const service = {
    loadArtifacts() {
      calls.loadArtifacts.push(undefined)
      const result = loadQueue.length > 1
        ? loadQueue.shift()
        : loadQueue[0]
      return typeof result === 'function' ? result() : cloneValue(result)
    },
  }

  for (const methodName of [
    'saveNote',
    'saveSummary',
    'clearNote',
    'clearSummary',
  ]) {
    service[methodName] = (input) => {
      calls[methodName].push(cloneValue(input))
      const handler = mutationHandlers[methodName]

      if (typeof handler === 'function') {
        return handler(cloneValue(input))
      }

      return cloneValue(handler)
    }
  }

  return { calls, service }
}

function createTestServiceDouble({
  loadResults,
  methodHandlers = {},
} = {}) {
  const loadQueue = Array.isArray(loadResults)
    ? [...loadResults]
    : [loadResults ?? createTestBankLoadSuccess()]
  const methodNames = [
    'createQuestion',
    'updateQuestion',
    'startModuleTest',
    'submitModuleTest',
    'cancelModuleTest',
    'loadAttemptHistory',
  ]
  const calls = {
    loadTestBank: [],
    createQuestion: [],
    updateQuestion: [],
    startModuleTest: [],
    submitModuleTest: [],
    cancelModuleTest: [],
    loadAttemptHistory: [],
  }
  const service = {
    loadTestBank() {
      calls.loadTestBank.push(undefined)
      const result = loadQueue.length > 1
        ? loadQueue.shift()
        : loadQueue[0]
      return typeof result === 'function' ? result() : cloneValue(result)
    },
  }

  for (const methodName of methodNames) {
    service[methodName] = (input) => {
      calls[methodName].push(cloneValue(input))
      const handler = methodHandlers[methodName]

      if (typeof handler === 'function') {
        return handler(cloneValue(input))
      }

      if (typeof handler !== 'undefined') {
        return cloneValue(handler)
      }

      if (methodName === 'loadAttemptHistory') {
        return {
          ok: true,
          status: 'attemptHistoryEmpty',
          changed: false,
          attempts: [],
        }
      }

      return undefined
    }
  }

  return { calls, service }
}

function createControllerSystem({
  loadResults,
  mutationHandlers,
  progressLoadResults,
  progressMutationHandlers,
  artifactLoadResults,
  artifactMutationHandlers,
  testBankLoadResults,
  testMethodHandlers,
} = {}) {
  const scheduler = createManualScheduler()
  const viewRecorder = createViewRecorder()
  const hubLoadResults =
    loadResults ?? {
      ok: true,
      status: 'loaded',
      hub: createHubFixture(),
    }
  const serviceDouble = createServiceDouble({
    loadResults: hubLoadResults,
    mutationHandlers,
  })
  const successfulHubLoad = (
    Array.isArray(hubLoadResults) ? hubLoadResults : [hubLoadResults]
  ).find((loadResult) => loadResult?.ok === true && loadResult.hub)
  const initialProgressHub = successfulHubLoad?.hub ?? createHubFixture()
  const progressServiceDouble = createProgressServiceDouble({
    loadResults:
      progressLoadResults ??
      createProgressLoadSuccess(initialProgressHub),
    mutationHandlers: progressMutationHandlers,
  })
  const artifactServiceDouble = createArtifactServiceDouble({
    loadResults:
      artifactLoadResults ??
      createArtifactLoadSuccess(),
    mutationHandlers: artifactMutationHandlers,
  })
  const testServiceDouble = createTestServiceDouble({
    loadResults: testBankLoadResults,
    methodHandlers: testMethodHandlers,
  })
  const controller = createLearningHubController({
    learningHubService: serviceDouble.service,
    learningProgressService: progressServiceDouble.service,
    learningArtifactService: artifactServiceDouble.service,
    learningTestService: testServiceDouble.service,
    learningHubView: viewRecorder.view,
    scheduleTask: scheduler.scheduleTask,
  })

  return {
    controller,
    scheduler,
    serviceDouble,
    progressServiceDouble,
    artifactServiceDouble,
    testServiceDouble,
    viewRecorder,
  }
}

function openReadyController(system) {
  system.controller.open()
  assert.equal(system.viewRecorder.lastState.phase, 'loading')
  assert.equal(system.serviceDouble.calls.loadHub.length, 0)
  system.scheduler.runNext()
  return system.viewRecorder.actions
}

function selectArtifactNode(
  actions,
  {
    moduleId = 'module-orbit',
    chapterId = 'chapter-signals',
    learningNodeId = 'node-pulse',
  } = {}
) {
  actions.onSelectModule(moduleId)
  actions.onToggleChapter(moduleId, chapterId)
  actions.onSelectLearningNode(
    moduleId,
    chapterId,
    learningNodeId
  )
}

function createMutationSuccess(status, hub, extra = {}) {
  return {
    ok: true,
    status,
    hub: cloneValue(hub),
    ...cloneValue(extra),
  }
}

test('lädt einen gültigen Hub erst nach dem sichtbaren Ladezustand', () => {
  const hub = createHubFixture()
  const system = createControllerSystem({
    loadResults: { ok: true, status: 'loaded', hub },
  })

  system.controller.open()

  assert.equal(system.viewRecorder.renders.length, 1)
  assert.equal(system.viewRecorder.lastState.phase, 'loading')
  assert.deepEqual(system.viewRecorder.lastState.hub, createEmptyHub())
  assert.equal(system.serviceDouble.calls.loadHub.length, 0)

  system.scheduler.runNext()

  assert.equal(system.serviceDouble.calls.loadHub.length, 1)
  assert.equal(system.viewRecorder.lastState.phase, 'ready')
  assert.deepEqual(system.viewRecorder.lastState.hub, hub)
  assert.deepEqual(system.viewRecorder.lastState.focusTarget, {
    type: 'heading',
  })

  system.viewRecorder.lastState.hub.modules[0].title = 'Nur die View-Kopie'
  assert.equal(hub.modules[0].title, 'Fiktive Orbitwerkstatt')
})

test('behandelt einen fehlenden Storage-Eintrag als gültigen leeren Hub', () => {
  const system = createControllerSystem({
    loadResults: {
      ok: true,
      status: 'empty',
      initialized: false,
      hub: createEmptyHub(),
    },
  })

  openReadyController(system)

  assert.equal(system.viewRecorder.lastState.phase, 'empty')
  assert.deepEqual(system.viewRecorder.lastState.hub, createEmptyHub())
  assert.equal(system.viewRecorder.lastState.errorMessage, '')
  assert.equal(system.serviceDouble.calls.createModule.length, 0)
})

test('zeigt Ladefehler kontrolliert, redigiert private Meldungen und unterstützt Retry', () => {
  const privateSentinel = 'VERTRAULICHER-INHALT-DARF-NICHT-IN-DIE-VIEW'
  const system = createControllerSystem({
    loadResults: [
      {
        ok: false,
        status: 'invalidJson',
        error: {
          code: 'invalidJson',
          message: privateSentinel,
        },
      },
      {
        ok: true,
        status: 'empty',
        hub: createEmptyHub(),
      },
    ],
  })

  const actions = openReadyController(system)

  assert.equal(system.viewRecorder.lastState.phase, 'loadError')
  assert.match(
    system.viewRecorder.lastState.errorMessage,
    /nicht lesbar/
  )
  assert.equal(
    JSON.stringify(system.viewRecorder.lastState).includes(privateSentinel),
    false
  )
  assert.equal(system.viewRecorder.lastState.progress.phase, 'unavailable')
  assert.deepEqual(system.viewRecorder.lastState.progress.projection, [])
  assert.equal(system.viewRecorder.lastState.progress.errorMessage, '')

  actions.onRetryLoad()
  assert.equal(system.viewRecorder.lastState.phase, 'loading')
  assert.equal(system.scheduler.pendingCount, 1)
  system.scheduler.runNext()
  assert.equal(system.viewRecorder.lastState.phase, 'empty')
  assert.equal(system.serviceDouble.calls.loadHub.length, 2)
})

test('öffnet genau ein Modul, verwaltet Accordion und kehrt sauber zurück', () => {
  const system = createControllerSystem()
  const actions = openReadyController(system)

  actions.onSelectModule('module-does-not-exist')
  assert.equal(system.viewRecorder.lastState.selectedModuleId, null)

  actions.onSelectModule('module-orbit')
  assert.equal(system.viewRecorder.lastState.selectedModuleId, 'module-orbit')
  assert.deepEqual(system.viewRecorder.lastState.expandedChapterIds, [])

  actions.onToggleChapter('module-garden', 'chapter-signals')
  assert.deepEqual(system.viewRecorder.lastState.expandedChapterIds, [])

  actions.onToggleChapter('module-orbit', 'chapter-signals')
  assert.deepEqual(system.viewRecorder.lastState.expandedChapterIds, [
    'chapter-signals',
  ])
  actions.onSelectLearningNode(
    'module-orbit',
    'chapter-signals',
    'node-pulse'
  )
  assert.equal(
    system.viewRecorder.lastState.selectedLearningNodeId,
    'node-pulse'
  )

  actions.onToggleChapter('module-orbit', 'chapter-signals')
  assert.deepEqual(system.viewRecorder.lastState.expandedChapterIds, [])
  assert.equal(system.viewRecorder.lastState.selectedLearningNodeId, null)

  actions.onBackToOverview()
  assert.equal(system.viewRecorder.lastState.selectedModuleId, null)
  assert.deepEqual(system.viewRecorder.lastState.expandedChapterIds, [])
  assert.deepEqual(system.viewRecorder.lastState.focusTarget, {
    type: 'overviewHeading',
  })
})

test('liefert beim Öffnen und Abbrechen stabile Formular-Fokusziele', () => {
  const system = createControllerSystem()
  const actions = openReadyController(system)

  actions.onOpenCreateModuleForm()
  assert.deepEqual(system.viewRecorder.lastState.focusTarget, {
    type: 'formField',
    fieldName: 'title',
  })
  actions.onCancelForm()
  assert.deepEqual(system.viewRecorder.lastState.focusTarget, {
    type: 'formTrigger',
    formType: 'createModule',
    moduleId: null,
    chapterId: null,
    learningNodeId: null,
  })

  actions.onSelectModule('module-orbit')
  const cases = [
    ['renameModule', () => actions.onOpenRenameModuleForm('module-orbit'), {}],
    ['addChapter', () => actions.onOpenAddChapterForm('module-orbit'), {}],
    [
      'renameChapter',
      () => actions.onOpenRenameChapterForm('module-orbit', 'chapter-signals'),
      { chapterId: 'chapter-signals' },
    ],
    [
      'addLearningNode',
      () => actions.onOpenAddLearningNodeForm('module-orbit', 'chapter-signals'),
      { chapterId: 'chapter-signals' },
    ],
    [
      'updateLearningNode',
      () => actions.onOpenUpdateLearningNodeForm(
        'module-orbit',
        'chapter-signals',
        'node-pulse'
      ),
      { chapterId: 'chapter-signals', learningNodeId: 'node-pulse' },
    ],
  ]

  cases.forEach(([formType, openForm, target]) => {
    openForm()
    assert.deepEqual(system.viewRecorder.lastState.focusTarget, {
      type: 'formField',
      fieldName: 'title',
    })
    actions.onCancelForm()
    assert.deepEqual(system.viewRecorder.lastState.focusTarget, {
      type: 'formTrigger',
      formType,
      moduleId: 'module-orbit',
      chapterId: target.chapterId ?? null,
      learningNodeId: target.learningNodeId ?? null,
    })
  })
})

test('ignoriert manipulierte Formular-Ziel-IDs ohne Serviceaufruf oder Zustandsänderung', () => {
  const system = createControllerSystem()
  const actions = openReadyController(system)
  actions.onSelectModule('module-orbit')

  const stateBeforeInvalidOpen = cloneValue(system.viewRecorder.lastState)
  const invalidOpenActions = [
    () => actions.onOpenRenameModuleForm('module-garden'),
    () => actions.onOpenAddChapterForm('module-garden'),
    () => actions.onOpenRenameChapterForm('module-orbit', 'chapter-unknown'),
    () => actions.onOpenAddLearningNodeForm('module-orbit', 'chapter-unknown'),
    () => actions.onOpenUpdateLearningNodeForm(
      'module-orbit',
      'chapter-signals',
      'node-unknown'
    ),
  ]

  invalidOpenActions.forEach((openInvalidForm) => {
    openInvalidForm()
    assert.deepEqual(system.viewRecorder.lastState, stateBeforeInvalidOpen)
  })

  actions.onOpenUpdateLearningNodeForm(
    'module-orbit',
    'chapter-signals',
    'node-pulse'
  )
  const stateBeforeInvalidSubmit = cloneValue(system.viewRecorder.lastState)
  const baseSubmission = {
    type: 'updateLearningNode',
    moduleId: 'module-orbit',
    chapterId: 'chapter-signals',
    learningNodeId: 'node-pulse',
    title: 'Synthetischer Puls',
    content: 'Ein frei erfundener Text.',
  }
  const invalidSubmissions = [
    { ...baseSubmission, moduleId: 'module-garden' },
    { ...baseSubmission, chapterId: 'chapter-empty' },
    { ...baseSubmission, learningNodeId: 'node-unknown' },
  ]

  invalidSubmissions.forEach((submission) => {
    actions.onSubmitForm(submission)
    assert.equal(system.serviceDouble.calls.updateLearningNode.length, 0)
    assert.deepEqual(system.viewRecorder.lastState, stateBeforeInvalidSubmit)
  })
})

test('erstellt ein Modul atomar und reicht nur die vorgesehenen Eingaben weiter', () => {
  const createdHub = createEmptyHub()
  createdHub.modules.push({
    id: 'module-new',
    title: 'Neues Fantasiemodul',
    position: 1,
    chapters: [
      {
        id: 'chapter-new',
        title: 'Erstes Fantasiekapitel',
        position: 1,
        learningNodes: [],
      },
    ],
  })
  let system
  system = createControllerSystem({
    loadResults: {
      ok: true,
      status: 'empty',
      hub: createEmptyHub(),
    },
    mutationHandlers: {
      createModule() {
        system.viewRecorder.actions.onSubmitForm({
          type: 'createModule',
          title: 'Doppelter Aufruf',
          firstChapterTitle: 'Doppeltes Kapitel',
        })
        return createMutationSuccess('moduleCreated', createdHub, {
          createdModule: createdHub.modules[0],
        })
      },
    },
  })
  const actions = openReadyController(system)

  actions.onOpenCreateModuleForm()
  actions.onSubmitForm({
    type: 'createModule',
    title: '  Neues Fantasiemodul  ',
    firstChapterTitle: '  Erstes Fantasiekapitel  ',
    ignored: 'wird nicht weitergereicht',
  })

  assert.deepEqual(system.serviceDouble.calls.createModule, [
    {
      title: '  Neues Fantasiemodul  ',
      firstChapterTitle: '  Erstes Fantasiekapitel  ',
    },
  ])
  const submittingState = system.viewRecorder.renders
    .filter((viewState) => viewState.form?.isSubmitting)
    .at(-1)
  assert.equal(submittingState.phase, 'mutating')
  assert.equal(submittingState.form.isSubmitting, true)
  assert.equal(system.viewRecorder.lastState.phase, 'ready')
  assert.equal(system.viewRecorder.lastState.form, null)
  assert.equal(system.viewRecorder.lastState.selectedModuleId, null)
  assert.equal(
    system.viewRecorder.lastState.statusMessage,
    'Lernmodul wurde lokal erstellt.'
  )
})

test('benennt das ausgewählte Modul um und erhält die Detailauswahl', () => {
  const renamedHub = createHubFixture()
  renamedHub.modules[0].title = 'Umbenannte Orbitwerkstatt'
  const system = createControllerSystem({
    mutationHandlers: {
      renameModule: createMutationSuccess('moduleRenamed', renamedHub, {
        updatedModule: renamedHub.modules[0],
      }),
    },
  })
  const actions = openReadyController(system)
  actions.onSelectModule('module-orbit')
  actions.onOpenRenameModuleForm('module-orbit')
  actions.onSubmitForm({
    type: 'renameModule',
    moduleId: 'module-orbit',
    title: 'Umbenannte Orbitwerkstatt',
  })

  assert.deepEqual(system.serviceDouble.calls.renameModule, [
    {
      moduleId: 'module-orbit',
      title: 'Umbenannte Orbitwerkstatt',
    },
  ])
  assert.equal(system.viewRecorder.lastState.selectedModuleId, 'module-orbit')
  assert.equal(
    system.viewRecorder.lastState.hub.modules[0].title,
    'Umbenannte Orbitwerkstatt'
  )
})

test('erstellt und benennt Kapitel um, ohne Modul- und Accordion-Auswahl zu verlieren', () => {
  const hubWithChapter = createHubFixture()
  const createdChapter = {
    id: 'chapter-new',
    title: 'Neues Fantasiekapitel',
    position: 11,
    learningNodes: [],
  }
  hubWithChapter.modules[0].chapters.push(createdChapter)
  const renamedHub = cloneValue(hubWithChapter)
  renamedHub.modules[0].chapters[0].title = 'Umbenannte Signalmuster'
  const system = createControllerSystem({
    mutationHandlers: {
      addChapter: createMutationSuccess('chapterAdded', hubWithChapter, {
        createdChapter,
      }),
      renameChapter: createMutationSuccess('chapterRenamed', renamedHub, {
        updatedChapter: renamedHub.modules[0].chapters[0],
      }),
    },
  })
  const actions = openReadyController(system)
  actions.onSelectModule('module-orbit')
  actions.onToggleChapter('module-orbit', 'chapter-signals')

  actions.onOpenAddChapterForm('module-orbit')
  actions.onSubmitForm({
    type: 'addChapter',
    moduleId: 'module-orbit',
    title: 'Neues Fantasiekapitel',
  })

  assert.deepEqual(system.serviceDouble.calls.addChapter, [
    {
      moduleId: 'module-orbit',
      title: 'Neues Fantasiekapitel',
    },
  ])
  assert.equal(system.viewRecorder.lastState.selectedModuleId, 'module-orbit')
  assert.deepEqual(
    new Set(system.viewRecorder.lastState.expandedChapterIds),
    new Set(['chapter-signals', 'chapter-new'])
  )

  actions.onOpenRenameChapterForm('module-orbit', 'chapter-signals')
  actions.onSubmitForm({
    type: 'renameChapter',
    moduleId: 'module-orbit',
    chapterId: 'chapter-signals',
    title: 'Umbenannte Signalmuster',
  })

  assert.deepEqual(system.serviceDouble.calls.renameChapter, [
    {
      moduleId: 'module-orbit',
      chapterId: 'chapter-signals',
      title: 'Umbenannte Signalmuster',
    },
  ])
  assert.ok(
    system.viewRecorder.lastState.expandedChapterIds.includes(
      'chapter-signals'
    )
  )
})

test('erstellt und aktualisiert LearningNodes mit stabiler Modul-, Kapitel- und Node-Auswahl', () => {
  const hubWithNode = createHubFixture()
  const createdNode = {
    id: 'node-new',
    title: 'Neue synthetische Karte',
    content: 'Frei erfundener neuer Inhalt.',
    position: 4,
  }
  hubWithNode.modules[0].chapters[0].learningNodes.push(createdNode)
  const updatedHub = cloneValue(hubWithNode)
  updatedHub.modules[0].chapters[0].learningNodes[1] = {
    ...createdNode,
    title: 'Aktualisierte synthetische Karte',
    content: 'Frei erfundener aktualisierter Inhalt.',
  }
  const system = createControllerSystem({
    mutationHandlers: {
      addLearningNode: createMutationSuccess(
        'learningNodeAdded',
        hubWithNode,
        { createdLearningNode: createdNode }
      ),
      updateLearningNode: createMutationSuccess(
        'learningNodeUpdated',
        updatedHub,
        { updatedLearningNode: updatedHub.modules[0].chapters[0].learningNodes[1] }
      ),
    },
  })
  const actions = openReadyController(system)
  actions.onSelectModule('module-orbit')
  actions.onOpenAddLearningNodeForm('module-orbit', 'chapter-signals')
  actions.onSubmitForm({
    type: 'addLearningNode',
    moduleId: 'module-orbit',
    chapterId: 'chapter-signals',
    title: 'Neue synthetische Karte',
    content: 'Frei erfundener neuer Inhalt.',
  })

  assert.deepEqual(system.serviceDouble.calls.addLearningNode, [
    {
      moduleId: 'module-orbit',
      chapterId: 'chapter-signals',
      title: 'Neue synthetische Karte',
      content: 'Frei erfundener neuer Inhalt.',
    },
  ])
  assert.equal(system.viewRecorder.lastState.selectedModuleId, 'module-orbit')
  assert.ok(
    system.viewRecorder.lastState.expandedChapterIds.includes(
      'chapter-signals'
    )
  )
  assert.equal(
    system.viewRecorder.lastState.selectedLearningNodeId,
    'node-new'
  )

  actions.onOpenUpdateLearningNodeForm(
    'module-orbit',
    'chapter-signals',
    'node-new'
  )
  actions.onSubmitForm({
    type: 'updateLearningNode',
    moduleId: 'module-orbit',
    chapterId: 'chapter-signals',
    learningNodeId: 'node-new',
    title: 'Aktualisierte synthetische Karte',
    content: 'Frei erfundener aktualisierter Inhalt.',
  })

  assert.deepEqual(system.serviceDouble.calls.updateLearningNode, [
    {
      moduleId: 'module-orbit',
      chapterId: 'chapter-signals',
      learningNodeId: 'node-new',
      title: 'Aktualisierte synthetische Karte',
      content: 'Frei erfundener aktualisierter Inhalt.',
    },
  ])
  assert.equal(
    system.viewRecorder.lastState.selectedLearningNodeId,
    'node-new'
  )
})

test('bereinigt Auswahl- und Formular-IDs anhand eines neuen autoritativen Hubs', () => {
  const hubWithoutSelectedChapter = createHubFixture()
  hubWithoutSelectedChapter.modules[0].chapters = [
    hubWithoutSelectedChapter.modules[0].chapters[1],
  ]
  const hubWithoutSelectedModule = cloneValue(hubWithoutSelectedChapter)
  hubWithoutSelectedModule.modules = [hubWithoutSelectedModule.modules[1]]
  const system = createControllerSystem({
    mutationHandlers: {
      updateLearningNode: createMutationSuccess(
        'learningNodeUpdated',
        hubWithoutSelectedChapter,
        {
          updatedLearningNode: {
            id: 'node-replaced',
            title: 'Ersetzter Fantasieknoten',
            content: 'Synthetischer Ersatzinhalt.',
            position: 1,
          },
        }
      ),
      renameModule: createMutationSuccess(
        'moduleRenamed',
        hubWithoutSelectedModule,
        { updatedModule: hubWithoutSelectedModule.modules[0] }
      ),
    },
  })
  const actions = openReadyController(system)
  actions.onSelectModule('module-orbit')
  actions.onToggleChapter('module-orbit', 'chapter-signals')
  actions.onSelectLearningNode(
    'module-orbit',
    'chapter-signals',
    'node-pulse'
  )
  actions.onOpenUpdateLearningNodeForm(
    'module-orbit',
    'chapter-signals',
    'node-pulse'
  )
  actions.onSubmitForm({
    type: 'updateLearningNode',
    moduleId: 'module-orbit',
    chapterId: 'chapter-signals',
    learningNodeId: 'node-pulse',
    title: 'Ersetzter Fantasieknoten',
    content: 'Synthetischer Ersatzinhalt.',
  })

  assert.equal(system.viewRecorder.lastState.selectedModuleId, 'module-orbit')
  assert.deepEqual(system.viewRecorder.lastState.expandedChapterIds, [])
  assert.equal(system.viewRecorder.lastState.selectedLearningNodeId, null)
  assert.equal(system.viewRecorder.lastState.form, null)

  actions.onSelectLearningNode(
    'module-orbit',
    'chapter-signals',
    'node-does-not-exist'
  )
  assert.equal(system.viewRecorder.lastState.selectedLearningNodeId, null)

  actions.onOpenRenameModuleForm('module-orbit')
  actions.onSubmitForm({
    type: 'renameModule',
    moduleId: 'module-orbit',
    title: 'Nicht mehr vorhandenes Fantasiemodul',
  })

  assert.equal(system.viewRecorder.lastState.selectedModuleId, null)
  assert.deepEqual(system.viewRecorder.lastState.expandedChapterIds, [])
  assert.equal(system.viewRecorder.lastState.selectedLearningNodeId, null)
  assert.equal(system.viewRecorder.lastState.form, null)
})

test('prüft Pflichtfelder früh und zeigt Servicefehler ohne private Inhalte', () => {
  const privateSentinel = 'PRIVATE-TITEL-ODER-INHALT'
  const system = createControllerSystem({
    mutationHandlers: {
      addLearningNode: {
        ok: false,
        status: 'validationFailed',
        hub: createHubFixture(),
        error: {
          code: 'invalidLearningHubInput',
          message: privateSentinel,
          fieldErrors: {
            title: privateSentinel,
            content: privateSentinel,
            secret: privateSentinel,
          },
        },
      },
    },
  })
  const actions = openReadyController(system)
  actions.onSelectModule('module-orbit')
  actions.onOpenAddLearningNodeForm('module-orbit', 'chapter-signals')

  actions.onSubmitForm({
    type: 'addLearningNode',
    moduleId: 'module-orbit',
    chapterId: 'chapter-signals',
    title: '   ',
    content: '',
  })

  assert.equal(system.serviceDouble.calls.addLearningNode.length, 0)
  assert.deepEqual(
    Object.keys(system.viewRecorder.lastState.form.fieldErrors),
    ['title', 'content']
  )

  actions.onSubmitForm({
    type: 'addLearningNode',
    moduleId: 'module-orbit',
    chapterId: 'chapter-signals',
    title: 'T'.repeat(121),
    content: 'I'.repeat(10001),
  })

  assert.equal(system.serviceDouble.calls.addLearningNode.length, 1)
  assert.deepEqual(
    Object.keys(system.viewRecorder.lastState.form.fieldErrors),
    ['title', 'content']
  )
  assert.equal(
    JSON.stringify(system.viewRecorder.lastState).includes(privateSentinel),
    false
  )
  assert.equal(system.viewRecorder.lastState.selectedModuleId, 'module-orbit')
  assert.equal(system.viewRecorder.lastState.form.isSubmitting, false)
})

test('normalisiert geworfene Mutationsfehler ohne Entwurf oder Auswahl zu verlieren', () => {
  const system = createControllerSystem({
    mutationHandlers: {
      renameModule() {
        throw new Error('PRIVATE-ROHE-EXCEPTION')
      },
    },
  })
  const actions = openReadyController(system)
  actions.onSelectModule('module-orbit')
  actions.onOpenRenameModuleForm('module-orbit')
  actions.onSubmitForm({
    type: 'renameModule',
    moduleId: 'module-orbit',
    title: 'Synthetischer Entwurf',
  })

  assert.equal(system.viewRecorder.lastState.phase, 'ready')
  assert.equal(system.viewRecorder.lastState.selectedModuleId, 'module-orbit')
  assert.equal(
    system.viewRecorder.lastState.form.values.title,
    'Synthetischer Entwurf'
  )
  assert.equal(
    JSON.stringify(system.viewRecorder.lastState).includes(
      'PRIVATE-ROHE-EXCEPTION'
    ),
    false
  )
})

test('close verwirft geplante Loads und open startet mit frischem UI-Zustand', () => {
  const system = createControllerSystem()

  system.controller.open()
  assert.equal(system.scheduler.pendingCount, 1)
  system.controller.close()
  assert.equal(system.scheduler.pendingCount, 0)
  assert.equal(system.viewRecorder.unmountCalls, 1)
  system.scheduler.runNext()
  assert.equal(system.serviceDouble.calls.loadHub.length, 0)

  system.controller.open()
  system.scheduler.runNext()
  const actions = system.viewRecorder.actions
  actions.onSelectModule('module-orbit')
  assert.equal(system.viewRecorder.lastState.selectedModuleId, 'module-orbit')

  system.controller.close()
  assert.equal(system.viewRecorder.unmountCalls, 2)
  system.controller.open()
  assert.equal(system.viewRecorder.lastState.phase, 'loading')
  assert.equal(system.viewRecorder.lastState.selectedModuleId, null)
  system.scheduler.runNext()
  assert.equal(system.serviceDouble.calls.loadHub.length, 2)
})

test('Controller benötigt weder Storage noch localStorage', () => {
  const originalDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    'localStorage'
  )
  let directStorageReads = 0

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      directStorageReads += 1
      throw new Error('Direkter Storage-Zugriff ist im Controller verboten.')
    },
  })

  try {
    const system = createControllerSystem()
    openReadyController(system)
    assert.equal(system.viewRecorder.lastState.phase, 'ready')
    assert.equal(directStorageReads, 0)
  } finally {
    if (originalDescriptor) {
      Object.defineProperty(globalThis, 'localStorage', originalDescriptor)
    } else {
      delete globalThis.localStorage
    }
  }
})

test('lädt und retryt die Testbank isoliert mit redigiertem Fehlerzustand', () => {
  const question = createTestQuestion()
  const system = createControllerSystem({
    testBankLoadResults: [
      {
        ok: false,
        status: 'readFailed',
        changed: false,
        error: { code: 'private-error', message: 'PRIVATE-BANK-DETAIL' },
      },
      createTestBankLoadSuccess([question]),
    ],
  })
  const actions = openReadyController(system)

  assert.equal(system.viewRecorder.lastState.tests.bank.phase, 'error')
  assert.equal(
    JSON.stringify(system.viewRecorder.lastState.tests).includes(
      'PRIVATE-BANK-DETAIL'
    ),
    false
  )
  actions.onRetryTestBankLoad()
  assert.equal(system.testServiceDouble.calls.loadTestBank.length, 2)
  assert.equal(system.viewRecorder.lastState.tests.bank.phase, 'ready')
})

test('integriert öffentliche Session, exakten Payload, Ergebnis und sanitisierte Historie ohne Lösungsleck', () => {
  const question = createTestQuestion()
  let historyLoadCount = 0
  const system = createControllerSystem({
    testBankLoadResults: createTestBankLoadSuccess([question]),
    testMethodHandlers: {
      startModuleTest: {
        ok: true,
        status: 'testStarted',
        changed: true,
        testSession: createPublicTestSession(question),
      },
      submitModuleTest: createCompletedTestSuccess(question),
      loadAttemptHistory() {
        historyLoadCount += 1
        return historyLoadCount === 1
          ? {
              ok: true,
              status: 'attemptHistoryEmpty',
              changed: false,
              attempts: [],
            }
          : createAttemptHistorySuccess(question)
      },
    },
  })
  const actions = openReadyController(system)
  selectArtifactNode(actions)
  actions.onStartModuleTest()

  const activeTests = system.viewRecorder.lastState.tests
  assert.equal(activeTests.runner.phase, 'active')
  assert.deepEqual(activeTests.bank.questions, [])
  assert.equal(JSON.stringify(activeTests).includes('correctOptionId'), false)
  assert.equal(
    JSON.stringify(activeTests).includes(question.explanation),
    false
  )

  actions.onSelectTestAnswer(question.id, question.correctOptionId)
  assert.deepEqual(system.viewRecorder.lastState.focusTarget, {
    type: 'testAnswer',
    questionId: question.id,
    optionId: question.correctOptionId,
  })
  assert.equal(
    system.viewRecorder.lastState.tests.runner.answers[0]
      .selectedOptionId,
    question.correctOptionId
  )
  actions.onSubmitModuleTest()
  actions.onSubmitModuleTest()

  assert.deepEqual(system.testServiceDouble.calls.submitModuleTest, [
    {
      testSessionId: 'session-pulse-1',
      answers: [{
        questionId: question.id,
        selectedOptionId: question.correctOptionId,
      }],
    },
  ])
  const completedTests = system.viewRecorder.lastState.tests
  assert.equal(completedTests.runner.phase, 'completed')
  assert.deepEqual(completedTests.history.attempts, [{
    completedAt: '2026-07-20T09:05:00.000Z',
    totalQuestionCount: 1,
    correctAnswerCount: 1,
    scorePercent: 100,
  }])
  assert.equal(
    JSON.stringify(completedTests.history).includes('attempt-pulse-1'),
    false
  )
  assert.equal(
    JSON.stringify(completedTests.history).includes('answers'),
    false
  )
})

test('retryt nach Abgabefehler exakt denselben eingefrorenen Payload', () => {
  const question = createTestQuestion()
  let submitCount = 0
  const system = createControllerSystem({
    testBankLoadResults: createTestBankLoadSuccess([question]),
    testMethodHandlers: {
      startModuleTest: {
        ok: true,
        status: 'testStarted',
        changed: true,
        testSession: createPublicTestSession(question),
      },
      submitModuleTest() {
        submitCount += 1
        return submitCount === 1
          ? {
              ok: false,
              status: 'writeFailed',
              changed: false,
              error: { code: 'write', message: 'PRIVATE-SUBMIT' },
            }
          : createCompletedTestSuccess(question)
      },
      cancelModuleTest: {
        ok: false,
        status: 'conflict',
        changed: false,
        error: {
          code: 'learningTestPendingSubmission',
          message: 'PRIVATE-PENDING-SUBMISSION',
        },
      },
    },
  })
  const actions = openReadyController(system)
  selectArtifactNode(actions)
  actions.onStartModuleTest()
  actions.onSelectTestAnswer(question.id, question.correctOptionId)
  actions.onSubmitModuleTest()

  assert.equal(system.viewRecorder.lastState.tests.runner.retryPending, true)
  assert.equal(
    JSON.stringify(system.viewRecorder.lastState.tests).includes(
      'PRIVATE-SUBMIT'
    ),
    false
  )
  actions.onOpenTestCancelConfirmation()
  actions.onConfirmModuleTestCancel()
  assert.deepEqual(system.testServiceDouble.calls.cancelModuleTest, [
    { testSessionId: 'session-pulse-1' },
  ])
  assert.equal(system.viewRecorder.lastState.tests.runner.phase, 'active')
  assert.equal(system.viewRecorder.lastState.tests.runner.retryPending, true)
  assert.equal(
    system.viewRecorder.lastState.tests.runner.cancelConfirmation,
    false
  )
  assert.equal(
    JSON.stringify(system.viewRecorder.lastState.tests).includes(
      'PRIVATE-PENDING-SUBMISSION'
    ),
    false
  )
  actions.onSelectTestAnswer(question.id, 'option-pulse-blue')
  actions.onSubmitModuleTest()

  assert.equal(system.testServiceDouble.calls.submitModuleTest.length, 2)
  assert.deepEqual(
    system.testServiceDouble.calls.submitModuleTest[1],
    system.testServiceDouble.calls.submitModuleTest[0]
  )
  assert.equal(system.viewRecorder.lastState.tests.runner.phase, 'completed')
})

test('blockiert close bis zum kontrollierten Session-Abbruch und schützt Dirty-Frageentwürfe', () => {
  const question = createTestQuestion()
  const system = createControllerSystem({
    testBankLoadResults: createTestBankLoadSuccess([question]),
    testMethodHandlers: {
      startModuleTest: {
        ok: true,
        status: 'testStarted',
        changed: true,
        testSession: createPublicTestSession(question),
      },
      cancelModuleTest: {
        ok: true,
        status: 'testCancelled',
        changed: true,
      },
    },
  })
  const actions = openReadyController(system)
  selectArtifactNode(actions)
  actions.onOpenEditQuestion(question.id)
  actions.onUpdateQuestionField('prompt', 'Geänderter Fantasietext')
  actions.onBackToOverview()
  assert.equal(
    system.viewRecorder.lastState.tests.editor.discardConfirmation,
    true
  )
  assert.equal(system.controller.close(), false)
  actions.onDiscardQuestionDraft()

  actions.onStartModuleTest()
  assert.equal(system.controller.close(), false)
  assert.equal(
    system.viewRecorder.lastState.tests.runner.cancelConfirmation,
    true
  )
  actions.onConfirmModuleTestCancel()
  assert.deepEqual(system.testServiceDouble.calls.cancelModuleTest, [
    { testSessionId: 'session-pulse-1' },
  ])
  assert.equal(system.viewRecorder.lastState.tests.runner.phase, 'idle')
  assert.equal(system.controller.close(), true)
})

test('erstellt, aktualisiert und erkennt Testfragen unverändert mit lokaler Trim- und Längenvalidierung', () => {
  const createdQuestion = createTestQuestion({
    id: 'question-created-1',
    prompt: 'Welche Farbe hat das erfundene Signal?',
    difficulty: 'easy',
    explanation: 'Das synthetische Signal ist golden.',
    options: [
      { id: 'option-created-blue', label: 'Blau', position: 1 },
      { id: 'option-created-gold', label: 'Gold', position: 2 },
    ],
    correctOptionId: 'option-created-gold',
  })
  const updatedQuestion = createTestQuestion({
    ...createdQuestion,
    prompt: 'Welche Farbe hat das aktualisierte Signal?',
    revision: 2,
    updatedAt: '2026-07-20T08:30:00.000Z',
  })
  let updateCount = 0
  const system = createControllerSystem({
    testBankLoadResults: createTestBankLoadSuccess(),
    testMethodHandlers: {
      createQuestion: {
        ok: true,
        status: 'questionCreated',
        changed: true,
        question: createdQuestion,
        testBank: createTestBank([createdQuestion]),
      },
      updateQuestion() {
        updateCount += 1

        return {
          ok: true,
          status: updateCount === 1
            ? 'questionUpdated'
            : 'questionUnchanged',
          changed: updateCount === 1,
          question: updatedQuestion,
          testBank: createTestBank([updatedQuestion]),
        }
      },
    },
  })
  const actions = openReadyController(system)
  selectArtifactNode(actions)

  actions.onOpenCreateQuestion()
  actions.onUpdateQuestionField(
    'prompt',
    '  Welche Farbe hat das erfundene Signal?  '
  )
  actions.onUpdateQuestionField('difficulty', 'easy')
  actions.onUpdateQuestionField('options', '  Blau  ', 0)
  actions.onUpdateQuestionField('options', '  Gold  ', 1)
  actions.onSelectCorrectQuestionOption(1)
  actions.onUpdateQuestionField(
    'explanation',
    '  Das synthetische Signal ist golden.  '
  )
  actions.onSubmitQuestion()

  assert.deepEqual(system.testServiceDouble.calls.createQuestion, [{
    moduleId: 'module-orbit',
    chapterId: 'chapter-signals',
    learningNodeId: 'node-pulse',
    prompt: createdQuestion.prompt,
    difficulty: 'easy',
    options: ['Blau', 'Gold'],
    correctOptionIndex: 1,
    explanation: createdQuestion.explanation,
  }])
  assert.equal(system.viewRecorder.lastState.tests.editor, null)
  assert.equal(system.viewRecorder.lastState.tests.bank.totalQuestionCount, 1)

  actions.onOpenEditQuestion(createdQuestion.id)
  actions.onUpdateQuestionField(
    'prompt',
    '  Welche Farbe hat das aktualisierte Signal?  '
  )
  actions.onSubmitQuestion()

  assert.equal(system.testServiceDouble.calls.updateQuestion.length, 1)
  assert.deepEqual(system.testServiceDouble.calls.updateQuestion[0], {
    moduleId: 'module-orbit',
    chapterId: 'chapter-signals',
    learningNodeId: 'node-pulse',
    prompt: updatedQuestion.prompt,
    difficulty: 'easy',
    options: ['Blau', 'Gold'],
    correctOptionIndex: 1,
    explanation: createdQuestion.explanation,
    questionId: createdQuestion.id,
  })
  assert.equal(system.viewRecorder.lastState.tests.editor, null)

  actions.onOpenEditQuestion(createdQuestion.id)
  actions.onSubmitQuestion()
  assert.equal(system.testServiceDouble.calls.updateQuestion.length, 2)
  assert.equal(system.viewRecorder.lastState.tests.editor, null)

  actions.onOpenEditQuestion(createdQuestion.id)
  actions.onUpdateQuestionField('prompt', '   ')
  actions.onUpdateQuestionField('options', 'x'.repeat(301), 0)
  actions.onUpdateQuestionField('explanation', 'x'.repeat(2001))
  actions.onSubmitQuestion()

  assert.equal(system.testServiceDouble.calls.updateQuestion.length, 2)
  assert.deepEqual(
    Object.keys(system.viewRecorder.lastState.tests.editor.fieldErrors),
    ['prompt', 'options', 'options.0', 'explanation']
  )
  assert.equal(system.viewRecorder.lastState.tests.editor.values.prompt, '')
  assert.equal(system.viewRecorder.lastState.focusTarget.type, 'questionEditorField')
  assert.equal(system.viewRecorder.lastState.focusTarget.fieldName, 'prompt')
})

test('startet ohne Fragen keinen Test und stellt in einer neuen Controllerinstanz keine alte Session wieder her', () => {
  const emptySystem = createControllerSystem({
    testBankLoadResults: createTestBankLoadSuccess(),
  })
  const emptyActions = openReadyController(emptySystem)
  emptyActions.onSelectModule('module-orbit')
  emptyActions.onStartModuleTest()

  assert.equal(emptySystem.testServiceDouble.calls.startModuleTest.length, 0)
  assert.equal(emptySystem.viewRecorder.lastState.tests.runner.phase, 'idle')
  assert.equal(emptySystem.viewRecorder.lastState.focusTarget.type, 'testStart')
  assert.match(
    emptySystem.viewRecorder.lastState.tests.runner.errorMessage,
    /keine Testfragen/i
  )

  const question = createTestQuestion()
  const firstSystem = createControllerSystem({
    testBankLoadResults: createTestBankLoadSuccess([question]),
    testMethodHandlers: {
      startModuleTest: {
        ok: true,
        status: 'testStarted',
        changed: true,
        testSession: createPublicTestSession(question),
      },
    },
  })
  const firstActions = openReadyController(firstSystem)
  firstActions.onSelectModule('module-orbit')
  firstActions.onStartModuleTest()
  assert.equal(firstSystem.viewRecorder.lastState.tests.runner.phase, 'active')

  const reloadedSystem = createControllerSystem({
    testBankLoadResults: createTestBankLoadSuccess([question]),
  })
  const reloadedActions = openReadyController(reloadedSystem)
  reloadedActions.onSelectModule('module-orbit')

  assert.equal(reloadedSystem.viewRecorder.lastState.tests.runner.phase, 'idle')
  assert.equal(reloadedSystem.viewRecorder.lastState.tests.runner.testSession, null)
  assert.deepEqual(reloadedSystem.viewRecorder.lastState.tests.runner.answers, [])
  assert.equal(reloadedSystem.testServiceDouble.calls.startModuleTest.length, 0)
})

test('weist manipulierte Ergebniszähler, Scores, Referenzen, Reihenfolgen und Feedbacks zurück', () => {
  const questions = [
    createTestQuestion(),
    createTestQuestion({
      id: 'question-pulse-2',
      prompt: 'Welche erfundene Form begleitet den zweiten Puls?',
      position: 2,
      options: [
        { id: 'option-pulse-circle', label: 'Kreis', position: 1 },
        { id: 'option-pulse-star', label: 'Stern', position: 2 },
      ],
      correctOptionId: 'option-pulse-star',
      explanation: 'Im synthetischen Beispiel erscheint ein Stern.',
    }),
  ]
  const resultMutations = [
    {
      name: 'questionCount',
      mutate(result) {
        result.result.totalQuestionCount = 3
      },
    },
    {
      name: 'scorePercent',
      mutate(result) {
        result.result.scorePercent = 99
      },
    },
    {
      name: 'moduleReference',
      mutate(result) {
        result.result.moduleId = 'module-private-foreign'
      },
    },
    {
      name: 'learningNodeReference',
      mutate(result) {
        result.result.answers[0].learningNodeId =
          'node-private-foreign'
      },
    },
    {
      name: 'correctOptionReference',
      mutate(result) {
        result.result.answers[0].correctOptionId =
          'option-private-foreign'
        result.result.feedback[0].correctOptionId =
          'option-private-foreign'
      },
    },
    {
      name: 'answerOrder',
      mutate(result) {
        result.result.answers.reverse()
      },
    },
    {
      name: 'feedbackSelection',
      mutate(result) {
        result.result.feedback[0].selectedOptionId =
          questions[0].options[0].id
      },
    },
    {
      name: 'existingButWrongCorrectOption',
      mutate(result) {
        const wrongCorrectOptionId = questions[0].options[0].id
        result.result.answers[0].correctOptionId = wrongCorrectOptionId
        result.result.answers[0].isCorrect = false
        result.result.feedback[0].correctOptionId = wrongCorrectOptionId
        result.result.feedback[0].isCorrect = false
        result.result.correctAnswerCount = 1
        result.result.scorePercent = 50
      },
    },
    {
      name: 'differentValidQuestionRevision',
      mutate(result) {
        result.result.answers[0].questionRevision =
          questions[0].revision + 1
      },
    },
    {
      name: 'differentValidExplanation',
      mutate(result) {
        result.result.feedback[0].explanation =
          'Eine andere, formal gültige synthetische Erklärung.'
      },
    },
  ]

  for (const scenario of resultMutations) {
    const malformedResult = cloneValue(
      createCompletedTestSuccessForQuestions(questions)
    )
    scenario.mutate(malformedResult)
    const system = createControllerSystem({
      testBankLoadResults: createTestBankLoadSuccess(questions),
      testMethodHandlers: {
        startModuleTest: {
          ok: true,
          status: 'testStarted',
          changed: true,
          testSession: createPublicTestSessionForQuestions(questions),
        },
        submitModuleTest: malformedResult,
      },
    })
    const actions = openReadyController(system)
    actions.onSelectModule('module-orbit')
    actions.onStartModuleTest()
    for (const question of questions) {
      actions.onSelectTestAnswer(question.id, question.correctOptionId)
    }
    actions.onSubmitModuleTest()

    const runner = system.viewRecorder.lastState.tests.runner
    assert.equal(runner.phase, 'active', scenario.name)
    assert.equal(runner.retryPending, true, scenario.name)
    assert.equal(runner.result, null, scenario.name)
    assert.equal(runner.testSession.questions.length, 2, scenario.name)
    assert.deepEqual(
      runner.answers.map((answer) => answer.selectedOptionId),
      questions.map((question) => question.correctOptionId),
      scenario.name
    )
    assert.equal(
      JSON.stringify(system.viewRecorder.lastState.tests)
        .includes('correctOptionId'),
      false,
      scenario.name
    )
    if (scenario.name === 'differentValidExplanation') {
      assert.equal(
        JSON.stringify(system.viewRecorder.lastState.tests).includes(
          'Eine andere, formal gültige synthetische Erklärung.'
        ),
        false
      )
    }
  }
})

test('ermöglicht nach evaluationFailed den autoritativen kontrollierten Session-Abbruch', () => {
  const question = createTestQuestion()
  const privateFailureMessage = 'PRIVATE-EVALUATION-DETAIL'
  const system = createControllerSystem({
    testBankLoadResults: createTestBankLoadSuccess([question]),
    testMethodHandlers: {
      startModuleTest: {
        ok: true,
        status: 'testStarted',
        changed: true,
        testSession: createPublicTestSession(question),
      },
      submitModuleTest: {
        ok: false,
        status: 'evaluationFailed',
        changed: false,
        error: {
          code: 'learningTestEvaluationFailed',
          message: privateFailureMessage,
        },
      },
      cancelModuleTest: {
        ok: true,
        status: 'testCancelled',
        changed: true,
      },
    },
  })
  const actions = openReadyController(system)
  actions.onSelectModule('module-orbit')
  actions.onStartModuleTest()
  actions.onSelectTestAnswer(question.id, question.correctOptionId)
  actions.onSubmitModuleTest()

  assert.equal(system.viewRecorder.lastState.tests.runner.phase, 'active')
  assert.equal(
    system.viewRecorder.lastState.tests.runner.retryPending,
    false
  )
  assert.equal(
    JSON.stringify(system.viewRecorder.lastState.tests).includes(
      privateFailureMessage
    ),
    false
  )

  actions.onOpenTestCancelConfirmation()
  assert.equal(
    system.viewRecorder.lastState.tests.runner.cancelConfirmation,
    true
  )
  actions.onConfirmModuleTestCancel()

  assert.deepEqual(system.testServiceDouble.calls.cancelModuleTest, [
    { testSessionId: 'session-pulse-1' },
  ])
  assert.equal(system.viewRecorder.lastState.tests.runner.phase, 'idle')
  assert.equal(system.viewRecorder.lastState.tests.runner.testSession, null)
  assert.deepEqual(system.viewRecorder.lastState.tests.runner.answers, [])

  actions.onSelectModule('module-garden')
  assert.equal(system.viewRecorder.lastState.selectedModuleId, 'module-garden')
})

test('reconciliert malformed testCompleted nach anschließendem notFound ohne zweiten Attempt oder UI-Lock', () => {
  const question = createTestQuestion()
  const persistedAttempts = createAttemptHistorySuccess(question).attempts
  const privateResultDetail = 'PRIVATE-MALFORMED-COMPLETION'
  let submitCount = 0
  let orbitHistoryLoadCount = 0
  const malformedCompletion = {
    ...createCompletedTestSuccess(question),
    unexpectedPrivateDetail: privateResultDetail,
  }
  const system = createControllerSystem({
    testBankLoadResults: createTestBankLoadSuccess([question]),
    testMethodHandlers: {
      startModuleTest: {
        ok: true,
        status: 'testStarted',
        changed: true,
        testSession: createPublicTestSession(question),
      },
      submitModuleTest() {
        submitCount += 1
        return submitCount === 1
          ? malformedCompletion
          : {
              ok: false,
              status: 'notFound',
              changed: false,
              error: {
                code: 'testSessionNotFound',
                message: 'PRIVATE-NOT-FOUND-DETAIL',
              },
            }
      },
      loadAttemptHistory({ moduleId }) {
        if (moduleId !== 'module-orbit') {
          return {
            ok: true,
            status: 'attemptHistoryEmpty',
            changed: false,
            attempts: [],
          }
        }

        orbitHistoryLoadCount += 1
        return orbitHistoryLoadCount < 3
          ? {
              ok: true,
              status: 'attemptHistoryEmpty',
              changed: false,
              attempts: [],
            }
          : {
              ok: true,
              status: 'attemptHistoryLoaded',
              changed: false,
              attempts: cloneValue(persistedAttempts),
            }
      },
    },
  })
  const actions = openReadyController(system)
  actions.onSelectModule('module-orbit')
  actions.onStartModuleTest()
  actions.onSelectTestAnswer(question.id, question.correctOptionId)
  actions.onSubmitModuleTest()

  assert.equal(system.viewRecorder.lastState.tests.runner.phase, 'active')
  assert.equal(system.viewRecorder.lastState.tests.runner.retryPending, true)
  assert.equal(system.viewRecorder.lastState.tests.runner.result, null)
  assert.equal(
    JSON.stringify(system.viewRecorder.lastState.tests).includes(
      privateResultDetail
    ),
    false
  )

  actions.onSubmitModuleTest()

  assert.equal(system.testServiceDouble.calls.submitModuleTest.length, 2)
  assert.deepEqual(
    system.testServiceDouble.calls.submitModuleTest[1],
    system.testServiceDouble.calls.submitModuleTest[0]
  )
  assert.equal(persistedAttempts.length, 1)
  assert.equal(system.viewRecorder.lastState.tests.runner.phase, 'completed')
  assert.equal(system.viewRecorder.lastState.tests.runner.retryPending, false)
  assert.equal(system.viewRecorder.lastState.tests.history.attempts.length, 1)
  assert.equal(
    JSON.stringify(system.viewRecorder.lastState.tests).includes(
      'PRIVATE-NOT-FOUND-DETAIL'
    ),
    false
  )

  actions.onSelectModule('module-garden')
  const gardenRunner = system.viewRecorder.lastState.tests.runner
  assert.equal(system.viewRecorder.lastState.selectedModuleId, 'module-garden')
  assert.equal(gardenRunner.phase, 'idle')
  assert.equal(gardenRunner.result, null)
  assert.equal(gardenRunner.errorMessage, '')
  assert.equal(gardenRunner.statusMessage, '')
})

test('reconciliert malformed Create-Erfolg per autoritativem Bank-Reload ohne doppelte Frage', () => {
  const privateMutationDetail = 'PRIVATE-CREATE-RESULT-DETAIL'
  const createdQuestion = createTestQuestion({
    id: 'question-created-reconciled',
    prompt: 'Welche Farbe trägt das synthetische Reconciliation-Signal?',
    difficulty: 'hard',
    options: [
      { id: 'option-created-silver', label: 'Silber', position: 1 },
      { id: 'option-created-violet', label: 'Violett', position: 2 },
    ],
    correctOptionId: 'option-created-violet',
    explanation: 'Das erfundene Signal trägt die Farbe Violett.',
  })
  const system = createControllerSystem({
    testBankLoadResults: [
      createTestBankLoadSuccess(),
      createTestBankLoadSuccess([createdQuestion]),
    ],
    testMethodHandlers: {
      createQuestion: {
        ok: true,
        status: 'questionCreated',
        changed: true,
        question: createdQuestion,
        testBank: createTestBank([createdQuestion]),
        unexpectedPrivateDetail: privateMutationDetail,
      },
    },
  })
  const actions = openReadyController(system)
  selectArtifactNode(actions)
  actions.onOpenCreateQuestion()
  actions.onUpdateQuestionField('prompt', createdQuestion.prompt)
  actions.onUpdateQuestionField('difficulty', createdQuestion.difficulty)
  actions.onUpdateQuestionField(
    'options',
    createdQuestion.options[0].label,
    0
  )
  actions.onUpdateQuestionField(
    'options',
    createdQuestion.options[1].label,
    1
  )
  actions.onSelectCorrectQuestionOption(1)
  actions.onUpdateQuestionField(
    'explanation',
    createdQuestion.explanation
  )
  actions.onSubmitQuestion()

  assert.equal(system.testServiceDouble.calls.createQuestion.length, 1)
  assert.equal(system.testServiceDouble.calls.loadTestBank.length, 2)
  assert.equal(system.viewRecorder.lastState.tests.bank.totalQuestionCount, 1)
  assert.equal(system.viewRecorder.lastState.tests.editor, null)
  assert.equal(
    JSON.stringify(system.viewRecorder.lastState.tests).includes(
      privateMutationDetail
    ),
    false
  )

  actions.onSubmitQuestion()
  assert.equal(system.testServiceDouble.calls.createQuestion.length, 1)
  actions.onOpenEditQuestion(createdQuestion.id)
  assert.equal(system.viewRecorder.lastState.tests.editor.mode, 'edit')
})

test('setzt terminalen Runnerzustand bei einem Modulwechsel vollständig zurück', () => {
  const question = createTestQuestion()
  let historyLoadCount = 0
  const completedSystem = createControllerSystem({
    testBankLoadResults: createTestBankLoadSuccess([question]),
    testMethodHandlers: {
      startModuleTest: {
        ok: true,
        status: 'testStarted',
        changed: true,
        testSession: createPublicTestSession(question),
      },
      submitModuleTest: createCompletedTestSuccess(question),
      loadAttemptHistory({ moduleId }) {
        if (moduleId !== 'module-orbit') {
          return {
            ok: true,
            status: 'attemptHistoryEmpty',
            changed: false,
            attempts: [],
          }
        }

        historyLoadCount += 1
        return historyLoadCount === 1
          ? {
              ok: true,
              status: 'attemptHistoryEmpty',
              changed: false,
              attempts: [],
            }
          : createAttemptHistorySuccess(question)
      },
    },
  })
  const completedActions = openReadyController(completedSystem)
  completedActions.onSelectModule('module-orbit')
  completedActions.onStartModuleTest()
  completedActions.onSelectTestAnswer(question.id, question.correctOptionId)
  completedActions.onSubmitModuleTest()
  assert.equal(
    completedSystem.viewRecorder.lastState.tests.runner.phase,
    'completed'
  )

  completedActions.onSelectModule('module-garden')
  const resetRunner = completedSystem.viewRecorder.lastState.tests.runner
  assert.equal(resetRunner.phase, 'idle')
  assert.equal(resetRunner.result, null)
  assert.equal(resetRunner.testSession, null)
  assert.deepEqual(resetRunner.answers, [])
  assert.equal(resetRunner.retryPending, false)
  assert.equal(resetRunner.errorMessage, '')
  assert.equal(resetRunner.statusMessage, '')

  const failedSystem = createControllerSystem({
    testBankLoadResults: createTestBankLoadSuccess([question]),
    testMethodHandlers: {
      startModuleTest: {
        ok: false,
        status: 'readFailed',
        changed: false,
        error: {
          code: 'learningTestStartFailed',
          message: 'PRIVATE-START-DETAIL',
        },
      },
    },
  })
  const failedActions = openReadyController(failedSystem)
  failedActions.onSelectModule('module-orbit')
  failedActions.onStartModuleTest()
  assert.notEqual(
    failedSystem.viewRecorder.lastState.tests.runner.errorMessage,
    ''
  )

  failedActions.onSelectModule('module-garden')
  const resetFailedRunner = failedSystem.viewRecorder.lastState.tests.runner
  assert.equal(resetFailedRunner.phase, 'idle')
  assert.equal(resetFailedRunner.result, null)
  assert.equal(resetFailedRunner.errorMessage, '')
  assert.equal(resetFailedRunner.statusMessage, '')
})

test('rendert Question-Dirty-Toggles in beide Richtungen ohne Nebenfelder zu verlieren', () => {
  const question = createTestQuestion()
  const system = createControllerSystem({
    testBankLoadResults: createTestBankLoadSuccess([question]),
  })
  const actions = openReadyController(system)
  selectArtifactNode(actions)
  actions.onOpenEditQuestion(question.id)
  const initialValues = cloneValue(
    system.viewRecorder.lastState.tests.editor.values
  )
  const renderCount = system.viewRecorder.renders.length

  actions.onUpdateQuestionField(
    'prompt',
    'Geänderte synthetische Dirty-Frage'
  )
  assert.equal(system.viewRecorder.renders.length, renderCount + 1)
  assert.equal(system.viewRecorder.lastState.tests.editor.dirty, true)
  assert.deepEqual(
    {
      ...system.viewRecorder.lastState.tests.editor.values,
      prompt: initialValues.prompt,
    },
    initialValues
  )

  actions.onUpdateQuestionField('prompt', initialValues.prompt)
  assert.equal(system.viewRecorder.renders.length, renderCount + 2)
  assert.equal(system.viewRecorder.lastState.tests.editor.dirty, false)
  assert.deepEqual(
    system.viewRecorder.lastState.tests.editor.values,
    initialValues
  )
})

test('isoliert einen History-Lesefehler und lädt ihn kontrolliert erneut', () => {
  const question = createTestQuestion()
  let historyLoadCount = 0
  const system = createControllerSystem({
    testBankLoadResults: createTestBankLoadSuccess([question]),
    testMethodHandlers: {
      loadAttemptHistory() {
        historyLoadCount += 1
        return historyLoadCount === 1
          ? {
              ok: false,
              status: 'readFailed',
              changed: false,
              error: {
                code: 'private-history-error',
                message: 'PRIVATE-HISTORY-DETAIL',
              },
            }
          : {
              ok: true,
              status: 'attemptHistoryEmpty',
              changed: false,
              attempts: [],
            }
      },
    },
  })
  const actions = openReadyController(system)
  actions.onSelectModule('module-orbit')

  assert.equal(system.viewRecorder.lastState.tests.history.phase, 'error')
  assert.equal(system.viewRecorder.lastState.tests.bank.phase, 'ready')
  assert.equal(
    JSON.stringify(system.viewRecorder.lastState.tests)
      .includes('PRIVATE-HISTORY-DETAIL'),
    false
  )

  actions.onToggleChapter('module-orbit', 'chapter-signals')
  actions.onSelectLearningNode(
    'module-orbit',
    'chapter-signals',
    'node-pulse'
  )
  actions.onOpenEditQuestion(question.id)
  assert.equal(system.viewRecorder.lastState.tests.editor.mode, 'edit')
  actions.onCancelQuestionEditor()

  actions.onRetryAttemptHistory()
  assert.equal(system.testServiceDouble.calls.loadAttemptHistory.length, 2)
  assert.equal(system.viewRecorder.lastState.tests.history.phase, 'ready')
  assert.deepEqual(system.viewRecorder.lastState.tests.history.attempts, [])
  assert.deepEqual(system.viewRecorder.lastState.focusTarget, {
    type: 'attemptHistoryAlert',
  })
})

test('blockiert Modul-, Kapitel-, Node-, Formular- und Übersichtswechsel während einer aktiven Testsession', () => {
  const hub = createArtifactHubFixture()
  const question = createTestQuestion()
  const system = createControllerSystem({
    loadResults: { ok: true, status: 'loaded', hub },
    testBankLoadResults: createTestBankLoadSuccess([question]),
    testMethodHandlers: {
      startModuleTest: {
        ok: true,
        status: 'testStarted',
        changed: true,
        testSession: createPublicTestSession(question),
      },
    },
  })
  const actions = openReadyController(system)
  selectArtifactNode(actions)
  actions.onStartModuleTest()

  const assertBlockedTransition = (transition) => {
    transition()
    const state = system.viewRecorder.lastState
    assert.equal(state.selectedModuleId, 'module-orbit')
    assert.deepEqual(state.expandedChapterIds, ['chapter-signals'])
    assert.equal(state.selectedLearningNodeId, 'node-pulse')
    assert.equal(state.form, null)
    assert.equal(state.tests.runner.phase, 'active')
    assert.equal(state.tests.runner.cancelConfirmation, true)
    assert.deepEqual(state.focusTarget, {
      type: 'testCancelConfirmation',
    })
    actions.onContinueModuleTest()
  }

  assertBlockedTransition(() => actions.onSelectModule('module-garden'))
  assertBlockedTransition(() => (
    actions.onToggleChapter('module-orbit', 'chapter-signals')
  ))
  assertBlockedTransition(() => actions.onSelectLearningNode(
    'module-orbit',
    'chapter-signals',
    'node-echo'
  ))
  assertBlockedTransition(() => actions.onOpenAddLearningNodeForm(
    'module-orbit',
    'chapter-signals'
  ))
  assertBlockedTransition(() => actions.onBackToOverview())

  assert.equal(system.testServiceDouble.calls.cancelModuleTest.length, 0)
  assert.equal(system.testServiceDouble.calls.loadAttemptHistory.length, 1)
})

test('lädt leeren und vorhandenen Fortschritt erst nach dem Inhalt und speichert keinen Roh-Log im UI-State', () => {
  const hub = createHubFixture()
  const completedChapterIds = ['chapter-signals', 'chapter-facets']
  let loadedSystem
  loadedSystem = createControllerSystem({
    loadResults: {
      ok: true,
      status: 'loaded',
      hub,
    },
    progressLoadResults() {
      assert.equal(loadedSystem.serviceDouble.calls.loadHub.length, 1)

      return {
        ...createProgressLoadSuccess(hub, completedChapterIds),
        progressLog: {
          schemaVersion: 1,
          dataOrigin: 'private',
          events: [
            {
              id: 'PRIVATE-EVENT-ID',
              type: 'chapter.completed',
              moduleId: 'module-orbit',
              chapterId: 'chapter-signals',
              occurredAt: '2026-07-18T10:00:00.000Z',
            },
          ],
        },
      }
    },
  })

  openReadyController(loadedSystem)

  assert.equal(loadedSystem.viewRecorder.lastState.progress.phase, 'ready')
  assert.deepEqual(
    loadedSystem.viewRecorder.lastState.progress.projection,
    createProgressProjection(hub, completedChapterIds)
  )
  assert.equal(
    JSON.stringify(loadedSystem.viewRecorder.lastState).includes(
      'PRIVATE-EVENT-ID'
    ),
    false
  )

  const emptyHub = createEmptyHub()
  const emptySystem = createControllerSystem({
    loadResults: {
      ok: true,
      status: 'empty',
      hub: emptyHub,
    },
    progressLoadResults: createProgressLoadSuccess(emptyHub, [], 'empty'),
  })

  openReadyController(emptySystem)

  assert.equal(emptySystem.viewRecorder.lastState.progress.phase, 'ready')
  assert.deepEqual(emptySystem.viewRecorder.lastState.progress.projection, [])
  assert.equal(emptySystem.progressServiceDouble.calls.loadProgress.length, 1)
})

test('isoliert einen Progress-Ladefehler vom Inhalt und erlaubt einen gezielten Retry', () => {
  const hub = createHubFixture()
  const privateSentinel = 'PRIVATE-PROGRESS-ROHDATEN'
  const system = createControllerSystem({
    progressLoadResults: [
      {
        ok: false,
        status: 'invalidStoredData',
        error: {
          code: privateSentinel,
          message: privateSentinel,
        },
      },
      createProgressLoadSuccess(hub, ['chapter-signals']),
    ],
  })
  const actions = openReadyController(system)

  assert.equal(system.viewRecorder.lastState.phase, 'ready')
  assert.equal(system.viewRecorder.lastState.progress.phase, 'unavailable')
  assert.deepEqual(system.viewRecorder.lastState.progress.projection, [])
  assert.match(
    system.viewRecorder.lastState.progress.errorMessage,
    /nicht verfügbar/
  )
  assert.equal(
    JSON.stringify(system.viewRecorder.lastState).includes(privateSentinel),
    false
  )

  actions.onSelectModule('module-orbit')
  assert.equal(system.viewRecorder.lastState.selectedModuleId, 'module-orbit')

  actions.onRetryProgressLoad()

  assert.equal(system.progressServiceDouble.calls.loadProgress.length, 2)
  assert.equal(system.viewRecorder.lastState.progress.phase, 'ready')
  assert.deepEqual(
    system.viewRecorder.lastState.progress.projection,
    createProgressProjection(hub, ['chapter-signals'])
  )
})

test('lehnt unvollständige, doppelte oder unplausible Progress-Projektionen vollständig ab', () => {
  const hub = createHubFixture()
  const validProjection = createProgressProjection(hub, ['chapter-signals'])
  const malformedProjections = []

  malformedProjections.push(validProjection.slice(0, 1))

  const duplicateModule = cloneValue(validProjection)
  duplicateModule[1] = cloneValue(duplicateModule[0])
  malformedProjections.push(duplicateModule)

  const missingChapter = cloneValue(validProjection)
  missingChapter[0].chapters.pop()
  malformedProjections.push(missingChapter)

  const duplicateChapter = cloneValue(validProjection)
  duplicateChapter[0].chapters[1] = cloneValue(
    duplicateChapter[0].chapters[0]
  )
  malformedProjections.push(duplicateChapter)

  const wrongCount = cloneValue(validProjection)
  wrongCount[0].completedChapterCount = 2
  malformedProjections.push(wrongCount)

  const wrongTotal = cloneValue(validProjection)
  wrongTotal[0].totalChapterCount = 99
  malformedProjections.push(wrongTotal)

  const wrongCompletion = cloneValue(validProjection)
  wrongCompletion[0].isCompleted = true
  malformedProjections.push(wrongCompletion)

  for (const incorrectPercent of [1, 49, 99, 100]) {
    const incorrectPercentProjection = cloneValue(validProjection)
    incorrectPercentProjection[0].progressPercent = incorrectPercent
    malformedProjections.push(incorrectPercentProjection)
  }

  malformedProjections.forEach((projection) => {
    const system = createControllerSystem({
      progressLoadResults: {
        ok: true,
        status: 'loaded',
        changed: false,
        projection,
      },
    })

    openReadyController(system)

    assert.equal(system.viewRecorder.lastState.progress.phase, 'unavailable')
    assert.deepEqual(system.viewRecorder.lastState.progress.projection, [])
  })
})

test('akzeptiert die exakten Math.round-Projektionen an beiden Rundungsgrenzen', () => {
  const roundingCases = [
    {
      totalChapterCount: 201,
      completedChapterCount: 1,
      progressPercent: 0,
    },
    {
      totalChapterCount: 200,
      completedChapterCount: 199,
      progressPercent: 100,
    },
  ]

  for (const roundingCase of roundingCases) {
    const hub = createRoundingHub([roundingCase.totalChapterCount])
    const completedChapterIds = hub.modules[0].chapters
      .slice(0, roundingCase.completedChapterCount)
      .map((chapter) => chapter.id)
    const projection = createProgressProjection(hub, completedChapterIds)
    const system = createControllerSystem({
      loadResults: {
        ok: true,
        status: 'loaded',
        hub,
      },
      progressLoadResults: createProgressLoadSuccess(
        hub,
        completedChapterIds
      ),
    })

    openReadyController(system)

    assert.equal(system.viewRecorder.lastState.progress.phase, 'ready')
    assert.deepEqual(
      system.viewRecorder.lastState.progress.projection,
      projection
    )
    assert.equal(projection[0].progressPercent, roundingCase.progressPercent)
    assert.equal(projection[0].isCompleted, false)
  }
})

test('validiert Module und Kapitel anhand ihrer IDs statt anhand von Arrayindizes', () => {
  const hub = createHubFixture()
  const reorderedProjection = createProgressProjection(
    hub,
    ['chapter-signals']
  ).reverse()
  reorderedProjection
    .find((moduleProgress) => moduleProgress.moduleId === 'module-orbit')
    .chapters
    .reverse()
  const system = createControllerSystem({
    progressLoadResults: {
      ok: true,
      status: 'loaded',
      changed: false,
      projection: reorderedProjection,
    },
  })

  openReadyController(system)

  assert.equal(system.viewRecorder.lastState.progress.phase, 'ready')
  assert.deepEqual(
    system.viewRecorder.lastState.progress.projection,
    reorderedProjection
  )
})

test('akzeptiert ausschließlich die vier semantisch passenden Progress-Erfolgsergebnisse', () => {
  const hub = createHubFixture()
  const cases = [
    {
      status: 'chapterCompleted',
      changed: true,
      initialCompletedChapterIds: [],
      resultCompletedChapterIds: ['chapter-signals'],
      serviceMethod: 'completeChapter',
      statusMessage: 'Kapitel wurde als abgeschlossen markiert.',
    },
    {
      status: 'chapterAlreadyCompleted',
      changed: false,
      initialCompletedChapterIds: [],
      resultCompletedChapterIds: ['chapter-signals'],
      serviceMethod: 'completeChapter',
      statusMessage: 'Kapitel wurde als abgeschlossen markiert.',
    },
    {
      status: 'chapterReopened',
      changed: true,
      initialCompletedChapterIds: ['chapter-signals'],
      resultCompletedChapterIds: [],
      serviceMethod: 'reopenChapter',
      statusMessage: 'Kapitel wurde wieder geöffnet.',
    },
    {
      status: 'chapterAlreadyOpen',
      changed: false,
      initialCompletedChapterIds: ['chapter-signals'],
      resultCompletedChapterIds: [],
      serviceMethod: 'reopenChapter',
      statusMessage: 'Kapitel wurde wieder geöffnet.',
    },
  ]

  cases.forEach((progressCase, caseIndex) => {
    const resultProjection = createProgressProjection(
      hub,
      progressCase.resultCompletedChapterIds
    )
    const system = createControllerSystem({
      progressLoadResults: createProgressLoadSuccess(
        hub,
        progressCase.initialCompletedChapterIds
      ),
      progressMutationHandlers: {
        [progressCase.serviceMethod]: createProgressMutationSuccess(
          progressCase.status,
          progressCase.changed,
          resultProjection
        ),
      },
    })
    const actions = openReadyController(system)
    actions.onSelectModule('module-orbit')

    if (caseIndex === 0) {
      actions.onToggleChapter('module-orbit', 'chapter-signals')
      actions.onSelectLearningNode(
        'module-orbit',
        'chapter-signals',
        'node-pulse'
      )
      actions.onOpenUpdateLearningNodeForm(
        'module-orbit',
        'chapter-signals',
        'node-pulse'
      )
      actions.onUpdateFormField('title', 'Synthetischer Formularentwurf')
    }

    actions.onToggleChapterCompletion(
      'module-orbit',
      'chapter-signals'
    )

    assert.deepEqual(
      system.progressServiceDouble.calls[progressCase.serviceMethod],
      [
        {
          moduleId: 'module-orbit',
          chapterId: 'chapter-signals',
        },
      ]
    )
    const unusedMethod = progressCase.serviceMethod === 'completeChapter'
      ? 'reopenChapter'
      : 'completeChapter'
    assert.equal(
      system.progressServiceDouble.calls[unusedMethod].length,
      0
    )
    assert.ok(
      system.viewRecorder.renders.some(
        (viewState) =>
          viewState.progress.phase === 'mutating' &&
          viewState.progress.mutatingChapterId === 'chapter-signals'
      )
    )
    assert.equal(system.viewRecorder.lastState.progress.phase, 'ready')
    assert.deepEqual(
      system.viewRecorder.lastState.progress.projection,
      resultProjection
    )
    assert.equal(
      system.viewRecorder.lastState.statusMessage,
      progressCase.statusMessage
    )
    assert.deepEqual(system.viewRecorder.lastState.focusTarget, {
      type: 'chapterCompletion',
      chapterId: 'chapter-signals',
    })

    if (caseIndex === 0) {
      assert.equal(
        system.viewRecorder.lastState.selectedModuleId,
        'module-orbit'
      )
      assert.deepEqual(
        system.viewRecorder.lastState.expandedChapterIds,
        ['chapter-signals']
      )
      assert.equal(
        system.viewRecorder.lastState.selectedLearningNodeId,
        'node-pulse'
      )
      assert.equal(
        system.viewRecorder.lastState.form.values.title,
        'Synthetischer Formularentwurf'
      )
    }
  })
})

test('bewahrt bei Progress-Servicefehler Projektion, Auswahl, Accordion, LearningNode und Formular und blockiert Mehrfachauslösung', () => {
  const hub = createHubFixture()
  const initialProjection = createProgressProjection(hub)
  const privateSentinel = 'PRIVATE-PROGRESS-FEHLERDETAILS'
  let system
  system = createControllerSystem({
    progressLoadResults: createProgressLoadSuccess(hub),
    progressMutationHandlers: {
      completeChapter() {
        system.viewRecorder.actions.onToggleChapterCompletion(
          'module-orbit',
          'chapter-signals'
        )
        system.viewRecorder.actions.onToggleChapter(
          'module-orbit',
          'chapter-signals'
        )
        system.viewRecorder.actions.onUpdateFormField(
          'title',
          'Darf nicht übernommen werden'
        )
        system.viewRecorder.actions.onRetryLoad()

        return {
          ok: false,
          status: 'writeFailed',
          changed: false,
          projection: createProgressProjection(hub, ['chapter-signals']),
          error: {
            code: privateSentinel,
            message:
              privateSentinel + ' 2026-07-18T10:00:00.000Z',
          },
        }
      },
    },
  })
  const actions = openReadyController(system)
  actions.onSelectModule('module-orbit')
  actions.onToggleChapter('module-orbit', 'chapter-signals')
  actions.onSelectLearningNode(
    'module-orbit',
    'chapter-signals',
    'node-pulse'
  )
  actions.onOpenUpdateLearningNodeForm(
    'module-orbit',
    'chapter-signals',
    'node-pulse'
  )
  actions.onUpdateFormField('title', 'Bewahrter synthetischer Entwurf')
  actions.onUpdateFormField('content', 'Bewahrter frei erfundener Inhalt.')

  actions.onToggleChapterCompletion('module-orbit', 'chapter-signals')

  assert.equal(
    system.progressServiceDouble.calls.completeChapter.length,
    1
  )
  assert.equal(system.scheduler.pendingCount, 0)
  assert.equal(system.viewRecorder.lastState.progress.phase, 'ready')
  assert.deepEqual(
    system.viewRecorder.lastState.progress.projection,
    initialProjection
  )
  assert.match(
    system.viewRecorder.lastState.progress.errorMessage,
    /konnte nicht gespeichert/
  )
  assert.equal(
    system.viewRecorder.lastState.progress.errorMessage.includes(
      privateSentinel
    ),
    false
  )
  assert.equal(system.viewRecorder.lastState.selectedModuleId, 'module-orbit')
  assert.deepEqual(system.viewRecorder.lastState.expandedChapterIds, [
    'chapter-signals',
  ])
  assert.equal(
    system.viewRecorder.lastState.selectedLearningNodeId,
    'node-pulse'
  )
  assert.deepEqual(system.viewRecorder.lastState.form.values, {
    title: 'Bewahrter synthetischer Entwurf',
    content: 'Bewahrter frei erfundener Inhalt.',
  })
  assert.deepEqual(system.viewRecorder.lastState.focusTarget, {
    type: 'chapterCompletion',
    chapterId: 'chapter-signals',
  })
})

test('behandelt formal erfolgreiche aber unpassende oder malformed Mutationsergebnisse als Fehler', () => {
  const hub = createHubFixture()
  const initialProjection = createProgressProjection(hub)
  const malformedProjection = createProgressProjection(
    hub,
    ['chapter-signals']
  ).slice(0, 1)
  const invalidResults = [
    createProgressMutationSuccess(
      'chapterReopened',
      true,
      createProgressProjection(hub, ['chapter-signals'])
    ),
    createProgressMutationSuccess(
      'chapterCompleted',
      false,
      createProgressProjection(hub, ['chapter-signals'])
    ),
    createProgressMutationSuccess(
      'chapterCompleted',
      true,
      malformedProjection
    ),
  ]

  invalidResults.forEach((invalidResult) => {
    const system = createControllerSystem({
      progressLoadResults: createProgressLoadSuccess(hub),
      progressMutationHandlers: {
        completeChapter: invalidResult,
      },
    })
    const actions = openReadyController(system)
    actions.onSelectModule('module-orbit')
    actions.onToggleChapterCompletion('module-orbit', 'chapter-signals')

    assert.equal(system.viewRecorder.lastState.progress.phase, 'ready')
    assert.deepEqual(
      system.viewRecorder.lastState.progress.projection,
      initialProjection
    )
    assert.notEqual(
      system.viewRecorder.lastState.progress.errorMessage,
      ''
    )
  })
})

test('lehnt semantisch widersprüchliche Complete- und Reopen-Ergebnisse mit vollständigem Rollback ab', () => {
  const hub = createHubFixture()
  const mutationCases = [
    {
      serviceMethod: 'completeChapter',
      status: 'chapterCompleted',
      changed: true,
      initialCompletedChapterIds: [],
      resultCompletedChapterIds: ['chapter-empty'],
    },
    {
      serviceMethod: 'completeChapter',
      status: 'chapterAlreadyCompleted',
      changed: false,
      initialCompletedChapterIds: [],
      resultCompletedChapterIds: [],
    },
    {
      serviceMethod: 'reopenChapter',
      status: 'chapterReopened',
      changed: true,
      initialCompletedChapterIds: [
        'chapter-signals',
        'chapter-empty',
      ],
      resultCompletedChapterIds: ['chapter-signals'],
    },
    {
      serviceMethod: 'reopenChapter',
      status: 'chapterAlreadyOpen',
      changed: false,
      initialCompletedChapterIds: ['chapter-signals'],
      resultCompletedChapterIds: ['chapter-signals'],
    },
  ]

  for (const mutationCase of mutationCases) {
    const previousProjection = createProgressProjection(
      hub,
      mutationCase.initialCompletedChapterIds
    )
    const resultProjection = createProgressProjection(
      hub,
      mutationCase.resultCompletedChapterIds
    )
    const system = createControllerSystem({
      progressLoadResults: createProgressLoadSuccess(
        hub,
        mutationCase.initialCompletedChapterIds
      ),
      progressMutationHandlers: {
        [mutationCase.serviceMethod]: createProgressMutationSuccess(
          mutationCase.status,
          mutationCase.changed,
          resultProjection
        ),
      },
    })
    const actions = openReadyController(system)
    actions.onSelectModule('module-orbit')

    actions.onToggleChapterCompletion(
      'module-orbit',
      'chapter-signals'
    )

    assert.equal(system.viewRecorder.lastState.progress.phase, 'ready')
    assert.equal(
      system.viewRecorder.lastState.progress.mutatingChapterId,
      null
    )
    assert.deepEqual(
      system.viewRecorder.lastState.progress.projection,
      previousProjection
    )
    assert.equal(
      system.viewRecorder.lastState.progress.errorMessage,
      'Der Kapitelstatus konnte nicht gespeichert werden. Bitte versuche es erneut.'
    )
    assert.equal(system.viewRecorder.lastState.statusMessage, '')
    assert.deepEqual(system.viewRecorder.lastState.focusTarget, {
      type: 'chapterCompletion',
      chapterId: 'chapter-signals',
    })
  }
})

test('lädt Progress nach createModule anhand des erfolgreichen neuen Inhaltsstands neu', () => {
  const emptyHub = createEmptyHub()
  const createdHub = createEmptyHub()
  const createdModule = {
    id: 'module-aurora',
    title: 'Fiktives Auroramodul',
    position: 1,
    chapters: [
      {
        id: 'chapter-aurora',
        title: 'Synthetisches Aurorakapitel',
        position: 1,
        learningNodes: [],
      },
    ],
  }
  createdHub.modules.push(createdModule)
  const system = createControllerSystem({
    loadResults: {
      ok: true,
      status: 'empty',
      hub: emptyHub,
    },
    mutationHandlers: {
      createModule: createMutationSuccess('moduleCreated', createdHub, {
        createdModule,
      }),
    },
    progressLoadResults: [
      createProgressLoadSuccess(emptyHub, [], 'empty'),
      createProgressLoadSuccess(createdHub, [], 'loaded'),
    ],
  })
  const actions = openReadyController(system)
  actions.onOpenCreateModuleForm()
  actions.onSubmitForm({
    type: 'createModule',
    title: 'Fiktives Auroramodul',
    firstChapterTitle: 'Synthetisches Aurorakapitel',
  })

  assert.equal(system.progressServiceDouble.calls.loadProgress.length, 2)
  assert.equal(system.viewRecorder.lastState.phase, 'ready')
  assert.deepEqual(system.viewRecorder.lastState.hub, createdHub)
  assert.equal(system.viewRecorder.lastState.progress.phase, 'ready')
  assert.deepEqual(
    system.viewRecorder.lastState.progress.projection,
    createProgressProjection(createdHub)
  )
  assert.equal(
    system.viewRecorder.lastState.statusMessage,
    'Lernmodul wurde lokal erstellt.'
  )
})

test('aktualisiert ein abgeschlossenes Modul nach addChapter von 100 auf 50 Prozent', () => {
  const initialHub = createHubFixture()
  initialHub.modules = [initialHub.modules[0]]
  initialHub.modules[0].chapters = [initialHub.modules[0].chapters[0]]
  const updatedHub = cloneValue(initialHub)
  const createdChapter = {
    id: 'chapter-horizon',
    title: 'Erfundener Horizont',
    position: 8,
    learningNodes: [],
  }
  updatedHub.modules[0].chapters.push(createdChapter)
  const system = createControllerSystem({
    loadResults: {
      ok: true,
      status: 'loaded',
      hub: initialHub,
    },
    mutationHandlers: {
      addChapter: createMutationSuccess('chapterAdded', updatedHub, {
        createdChapter,
      }),
    },
    progressLoadResults: [
      createProgressLoadSuccess(initialHub, ['chapter-signals']),
      createProgressLoadSuccess(updatedHub, ['chapter-signals']),
    ],
  })
  const actions = openReadyController(system)

  assert.equal(
    system.viewRecorder.lastState.progress.projection[0].progressPercent,
    100
  )
  assert.equal(
    system.viewRecorder.lastState.progress.projection[0].isCompleted,
    true
  )

  actions.onSelectModule('module-orbit')
  actions.onOpenAddChapterForm('module-orbit')
  actions.onSubmitForm({
    type: 'addChapter',
    moduleId: 'module-orbit',
    title: 'Erfundener Horizont',
  })

  const moduleProgress =
    system.viewRecorder.lastState.progress.projection[0]
  assert.equal(system.progressServiceDouble.calls.loadProgress.length, 2)
  assert.equal(moduleProgress.completedChapterCount, 1)
  assert.equal(moduleProgress.totalChapterCount, 2)
  assert.equal(moduleProgress.progressPercent, 50)
  assert.equal(moduleProgress.isCompleted, false)
  assert.equal(system.viewRecorder.lastState.selectedModuleId, 'module-orbit')
  assert.ok(
    system.viewRecorder.lastState.expandedChapterIds.includes(
      'chapter-horizon'
    )
  )
})

test('behält eine erfolgreiche Inhaltsmutation bei fehlgeschlagenem Progress-Refresh und markiert Fortschritt als stale', () => {
  const initialHub = createHubFixture()
  const updatedHub = cloneValue(initialHub)
  const createdChapter = {
    id: 'chapter-lantern',
    title: 'Synthetische Laternenkunde',
    position: 11,
    learningNodes: [],
  }
  updatedHub.modules[0].chapters.push(createdChapter)
  const privateSentinel = 'PRIVATE-REFRESH-FEHLER'
  const system = createControllerSystem({
    mutationHandlers: {
      addChapter: createMutationSuccess('chapterAdded', updatedHub, {
        createdChapter,
      }),
    },
    progressLoadResults: [
      createProgressLoadSuccess(initialHub, ['chapter-signals']),
      {
        ok: false,
        status: 'readFailed',
        error: {
          code: privateSentinel,
          message: privateSentinel,
        },
      },
      createProgressLoadSuccess(updatedHub, ['chapter-signals']),
    ],
  })
  const actions = openReadyController(system)
  actions.onSelectModule('module-orbit')
  actions.onOpenAddChapterForm('module-orbit')
  actions.onSubmitForm({
    type: 'addChapter',
    moduleId: 'module-orbit',
    title: 'Synthetische Laternenkunde',
  })

  assert.equal(system.viewRecorder.lastState.progress.phase, 'stale')
  assert.deepEqual(system.viewRecorder.lastState.progress.projection, [])
  assert.match(
    system.viewRecorder.lastState.progress.errorMessage,
    /nicht aktuell/
  )
  assert.equal(
    system.viewRecorder.lastState.progress.errorMessage.includes(
      privateSentinel
    ),
    false
  )
  assert.deepEqual(system.viewRecorder.lastState.hub, updatedHub)
  assert.equal(
    system.viewRecorder.lastState.statusMessage,
    'Kapitel wurde lokal erstellt.'
  )
  assert.equal(system.viewRecorder.lastState.selectedModuleId, 'module-orbit')

  actions.onRetryProgressLoad()

  assert.equal(system.progressServiceDouble.calls.loadProgress.length, 3)
  assert.equal(system.viewRecorder.lastState.progress.phase, 'ready')
  assert.deepEqual(
    system.viewRecorder.lastState.progress.projection,
    createProgressProjection(updatedHub, ['chapter-signals'])
  )
})

test('erhält die Progress-Projektion bei Rename- und LearningNode-Mutationen ohne Refresh', () => {
  const initialHub = createHubFixture()
  const initialProjection = createProgressProjection(
    initialHub,
    ['chapter-signals']
  )
  const moduleRenamedHub = cloneValue(initialHub)
  moduleRenamedHub.modules[0].title = 'Umbenannte synthetische Werkstatt'
  const chapterRenamedHub = cloneValue(moduleRenamedHub)
  chapterRenamedHub.modules[0].chapters[0].title =
    'Umbenannte synthetische Signale'
  const nodeAddedHub = cloneValue(chapterRenamedHub)
  const createdLearningNode = {
    id: 'node-lantern',
    title: 'Synthetische Laternenkarte',
    content: 'Vollständig frei erfundener Karteninhalt.',
    position: 4,
  }
  nodeAddedHub.modules[0].chapters[0].learningNodes.push(
    createdLearningNode
  )
  const nodeUpdatedHub = cloneValue(nodeAddedHub)
  nodeUpdatedHub.modules[0].chapters[0].learningNodes[1] = {
    ...createdLearningNode,
    title: 'Aktualisierte Laternenkarte',
  }
  const system = createControllerSystem({
    mutationHandlers: {
      renameModule: createMutationSuccess(
        'moduleRenamed',
        moduleRenamedHub,
        { updatedModule: moduleRenamedHub.modules[0] }
      ),
      renameChapter: createMutationSuccess(
        'chapterRenamed',
        chapterRenamedHub,
        { updatedChapter: chapterRenamedHub.modules[0].chapters[0] }
      ),
      addLearningNode: createMutationSuccess(
        'learningNodeAdded',
        nodeAddedHub,
        { createdLearningNode }
      ),
      updateLearningNode: createMutationSuccess(
        'learningNodeUpdated',
        nodeUpdatedHub,
        {
          updatedLearningNode:
            nodeUpdatedHub.modules[0].chapters[0].learningNodes[1],
        }
      ),
    },
    progressLoadResults: createProgressLoadSuccess(
      initialHub,
      ['chapter-signals']
    ),
  })
  const actions = openReadyController(system)
  actions.onSelectModule('module-orbit')

  actions.onOpenRenameModuleForm('module-orbit')
  actions.onSubmitForm({
    type: 'renameModule',
    moduleId: 'module-orbit',
    title: 'Umbenannte synthetische Werkstatt',
  })
  assert.deepEqual(
    system.viewRecorder.lastState.progress.projection,
    initialProjection
  )

  actions.onOpenRenameChapterForm('module-orbit', 'chapter-signals')
  actions.onSubmitForm({
    type: 'renameChapter',
    moduleId: 'module-orbit',
    chapterId: 'chapter-signals',
    title: 'Umbenannte synthetische Signale',
  })
  assert.deepEqual(
    system.viewRecorder.lastState.progress.projection,
    initialProjection
  )

  actions.onOpenAddLearningNodeForm('module-orbit', 'chapter-signals')
  actions.onSubmitForm({
    type: 'addLearningNode',
    moduleId: 'module-orbit',
    chapterId: 'chapter-signals',
    title: 'Synthetische Laternenkarte',
    content: 'Vollständig frei erfundener Karteninhalt.',
  })
  assert.deepEqual(
    system.viewRecorder.lastState.progress.projection,
    initialProjection
  )

  actions.onOpenUpdateLearningNodeForm(
    'module-orbit',
    'chapter-signals',
    'node-lantern'
  )
  actions.onSubmitForm({
    type: 'updateLearningNode',
    moduleId: 'module-orbit',
    chapterId: 'chapter-signals',
    learningNodeId: 'node-lantern',
    title: 'Aktualisierte Laternenkarte',
    content: 'Vollständig frei erfundener Karteninhalt.',
  })

  assert.deepEqual(
    system.viewRecorder.lastState.progress.projection,
    initialProjection
  )
  assert.equal(system.progressServiceDouble.calls.loadProgress.length, 1)
})

test('projiziert leere und vorhandene Lernartefakte ohne Rohstore, IDs oder Zeitstempel', () => {
  const emptySystem = createControllerSystem()
  const emptyActions = openReadyController(emptySystem)
  selectArtifactNode(emptyActions)

  assert.equal(emptySystem.viewRecorder.lastState.artifacts.phase, 'ready')
  assert.deepEqual(emptySystem.viewRecorder.lastState.artifacts.values, {
    note: null,
    summary: null,
  })
  assert.equal(
    Object.hasOwn(
      emptySystem.viewRecorder.lastState.artifacts,
      'artifactStore'
    ),
    false
  )
  assert.equal(
    emptySystem.artifactServiceDouble.calls.loadArtifacts.length,
    1
  )

  const note = createArtifact()
  const summary = createArtifact({
    id: 'artifact-pulse-summary',
    type: 'summary',
    content: 'Synthetische Zusammenfassung zum Pulsmuster.',
    createdAt: '2026-07-19T10:05:00.000Z',
    updatedAt: '2026-07-19T10:05:00.000Z',
  })
  const loadedSystem = createControllerSystem({
    artifactLoadResults: createArtifactLoadSuccess(
      createArtifactStore([note, summary])
    ),
  })
  const loadedActions = openReadyController(loadedSystem)
  selectArtifactNode(loadedActions)

  assert.equal(loadedSystem.viewRecorder.lastState.artifacts.phase, 'ready')
  assert.deepEqual(loadedSystem.viewRecorder.lastState.artifacts.values, {
    note: note.content,
    summary: summary.content,
  })
  assert.deepEqual(
    Object.keys(loadedSystem.viewRecorder.lastState.artifacts).sort(),
    [
      'activeType',
      'dirty',
      'draft',
      'errorMessage',
      'feedbackType',
      'fieldError',
      'interactionDisabled',
      'mode',
      'mutatingType',
      'phase',
      'statusMessage',
      'values',
    ].sort()
  )

  const serializedProjection = JSON.stringify(
    loadedSystem.viewRecorder.lastState.artifacts
  )
  assert.equal(serializedProjection.includes(note.id), false)
  assert.equal(serializedProjection.includes(summary.id), false)
  assert.equal(serializedProjection.includes(note.createdAt), false)
  assert.equal(serializedProjection.includes(summary.updatedAt), false)
})

test('ordnet Notiz und Zusammenfassung dem ausgewählten LearningNode ohne Cross-Node-Leak zu', () => {
  const hub = createArtifactHubFixture()
  const artifacts = [
    createArtifact(),
    createArtifact({
      id: 'artifact-pulse-summary',
      type: 'summary',
      content: 'Zusammenfassung nur für den synthetischen Puls.',
      createdAt: '2026-07-19T10:01:00.000Z',
      updatedAt: '2026-07-19T10:01:00.000Z',
    }),
    createArtifact({
      id: 'artifact-echo-note',
      learningNodeId: 'node-echo',
      content: 'Notiz nur für das synthetische Echo.',
      createdAt: '2026-07-19T10:02:00.000Z',
      updatedAt: '2026-07-19T10:02:00.000Z',
    }),
    createArtifact({
      id: 'artifact-echo-summary',
      type: 'summary',
      learningNodeId: 'node-echo',
      content: 'Zusammenfassung nur für das synthetische Echo.',
      createdAt: '2026-07-19T10:03:00.000Z',
      updatedAt: '2026-07-19T10:03:00.000Z',
    }),
  ]
  const system = createControllerSystem({
    loadResults: { ok: true, status: 'loaded', hub },
    artifactLoadResults: createArtifactLoadSuccess(
      createArtifactStore(artifacts)
    ),
  })
  const actions = openReadyController(system)
  selectArtifactNode(actions)

  assert.deepEqual(system.viewRecorder.lastState.artifacts.values, {
    note: 'Synthetische Notiz zum Pulsmuster.',
    summary: 'Zusammenfassung nur für den synthetischen Puls.',
  })

  actions.onSelectLearningNode(
    'module-orbit',
    'chapter-signals',
    'node-echo'
  )
  assert.deepEqual(system.viewRecorder.lastState.artifacts.values, {
    note: 'Notiz nur für das synthetische Echo.',
    summary: 'Zusammenfassung nur für das synthetische Echo.',
  })
  assert.equal(
    JSON.stringify(system.viewRecorder.lastState.artifacts).includes(
      'nur für den synthetischen Puls'
    ),
    false
  )

  actions.onSelectModule('module-garden')
  actions.onToggleChapter('module-garden', 'chapter-facets')
  actions.onSelectLearningNode(
    'module-garden',
    'chapter-facets',
    'node-facet'
  )
  assert.deepEqual(system.viewRecorder.lastState.artifacts.values, {
    note: null,
    summary: null,
  })
})

test('akzeptiert Create, Update und Unchanged für Notiz und Zusammenfassung mit exakten Serviceeingaben', () => {
  const saveCases = [
    {
      status: 'artifactCreated',
      changed: true,
      statusSuffix: 'wurde lokal erstellt.',
    },
    {
      status: 'artifactUpdated',
      changed: true,
      statusSuffix: 'wurde lokal aktualisiert.',
    },
    {
      status: 'artifactUnchanged',
      changed: false,
      statusSuffix: 'ist bereits aktuell.',
    },
  ]
  const typeCases = [
    {
      type: 'note',
      label: 'Notiz',
      saveMethod: 'saveNote',
      otherSaveMethod: 'saveSummary',
    },
    {
      type: 'summary',
      label: 'Zusammenfassung',
      saveMethod: 'saveSummary',
      otherSaveMethod: 'saveNote',
    },
  ]

  for (const typeCase of typeCases) {
    for (const saveCase of saveCases) {
      const persistedContent =
        `Persistierter synthetischer ${typeCase.type}-Text.`
      const submittedContent = saveCase.status === 'artifactUnchanged'
        ? persistedContent
        : `Neuer synthetischer ${typeCase.type}-Text.`
      const targetBefore = createArtifact({
        id: `artifact-pulse-${typeCase.type}`,
        type: typeCase.type,
        content: persistedContent,
      })
      const counterpartType =
        typeCase.type === 'note' ? 'summary' : 'note'
      const counterpart = createArtifact({
        id: `artifact-pulse-${counterpartType}`,
        type: counterpartType,
        content: `Persistierter synthetischer ${counterpartType}-Text.`,
        createdAt: '2026-07-19T10:05:00.000Z',
        updatedAt: '2026-07-19T10:05:00.000Z',
      })
      const initialArtifacts = saveCase.status === 'artifactCreated'
        ? [counterpart]
        : [targetBefore, counterpart]
      const targetAfter = createArtifact({
        ...targetBefore,
        content: submittedContent,
        createdAt: saveCase.status === 'artifactCreated'
          ? '2026-07-19T11:00:00.000Z'
          : targetBefore.createdAt,
        updatedAt: saveCase.status === 'artifactUpdated'
          ? '2026-07-19T11:00:00.000Z'
          : saveCase.status === 'artifactCreated'
            ? '2026-07-19T11:00:00.000Z'
            : targetBefore.updatedAt,
      })
      const resultArtifacts =
        saveCase.status === 'artifactCreated'
          ? [...initialArtifacts, targetAfter]
          : saveCase.status === 'artifactUpdated'
            ? [targetAfter, counterpart]
            : initialArtifacts
      const system = createControllerSystem({
        artifactLoadResults: createArtifactLoadSuccess(
          createArtifactStore(initialArtifacts)
        ),
        artifactMutationHandlers: {
          [typeCase.saveMethod]: createArtifactMutationSuccess(
            saveCase.status,
            saveCase.changed,
            createArtifactStore(resultArtifacts)
          ),
        },
      })
      const actions = openReadyController(system)
      selectArtifactNode(actions)

      actions.onOpenArtifactEditor(typeCase.type)
      assert.deepEqual(system.viewRecorder.lastState.focusTarget, {
        type: 'artifactField',
        artifactType: typeCase.type,
      })
      actions.onSaveArtifact({
        type: typeCase.type,
        content: submittedContent,
      })

      assert.deepEqual(
        system.artifactServiceDouble.calls[typeCase.saveMethod],
        [
          {
            moduleId: 'module-orbit',
            chapterId: 'chapter-signals',
            learningNodeId: 'node-pulse',
            content: submittedContent,
          },
        ]
      )
      assert.equal(
        system.artifactServiceDouble.calls[
          typeCase.otherSaveMethod
        ].length,
        0
      )
      assert.ok(
        system.viewRecorder.renders.some(
          (viewState) =>
            viewState.artifacts.phase === 'mutating' &&
            viewState.artifacts.mutatingType === typeCase.type
        )
      )
      assert.equal(
        system.viewRecorder.lastState.artifacts.values[typeCase.type],
        submittedContent
      )
      assert.equal(
        system.viewRecorder.lastState.artifacts.values[counterpartType],
        counterpart.content
      )
      assert.equal(system.viewRecorder.lastState.artifacts.mode, 'view')
      assert.equal(system.viewRecorder.lastState.artifacts.dirty, false)
      assert.equal(
        system.viewRecorder.lastState.artifacts.statusMessage,
        `${typeCase.label} ${saveCase.statusSuffix}`
      )
      assert.deepEqual(system.viewRecorder.lastState.focusTarget, {
        type: 'artifactTrigger',
        artifactType: typeCase.type,
      })
    }
  }
})

test('weist Whitespace und überlange Artefaktentwürfe ohne Serviceaufruf zurück', () => {
  const system = createControllerSystem()
  const actions = openReadyController(system)
  selectArtifactNode(actions)

  actions.onOpenArtifactEditor('note')
  actions.onSaveArtifact({
    type: 'note',
    content: '   \n\t ',
  })

  assert.equal(system.artifactServiceDouble.calls.saveNote.length, 0)
  assert.match(
    system.viewRecorder.lastState.artifacts.fieldError,
    /Text ein/
  )
  assert.equal(system.viewRecorder.lastState.artifacts.mode, 'editing')
  assert.deepEqual(system.viewRecorder.lastState.focusTarget, {
    type: 'artifactField',
    artifactType: 'note',
  })

  actions.onCancelArtifactEditor('note')
  actions.onOpenArtifactEditor('summary')
  actions.onSaveArtifact({
    type: 'summary',
    content: 'S'.repeat(10001),
  })

  assert.equal(system.artifactServiceDouble.calls.saveSummary.length, 0)
  assert.match(
    system.viewRecorder.lastState.artifacts.fieldError,
    /10\.000/
  )
  assert.equal(
    system.viewRecorder.lastState.artifacts.draft.length,
    10001
  )
  assert.deepEqual(system.viewRecorder.lastState.focusTarget, {
    type: 'artifactField',
    artifactType: 'summary',
  })
})

test('verwirft Cancel ausschließlich den Entwurf und stellt beide persistierten Texte wieder her', () => {
  const note = createArtifact()
  const summary = createArtifact({
    id: 'artifact-pulse-summary',
    type: 'summary',
    content: 'Persistierte synthetische Zusammenfassung.',
    createdAt: '2026-07-19T10:05:00.000Z',
    updatedAt: '2026-07-19T10:05:00.000Z',
  })
  const system = createControllerSystem({
    artifactLoadResults: createArtifactLoadSuccess(
      createArtifactStore([note, summary])
    ),
  })
  const actions = openReadyController(system)
  selectArtifactNode(actions)

  for (const artifact of [note, summary]) {
    actions.onOpenArtifactEditor(artifact.type)
    assert.equal(
      system.viewRecorder.lastState.artifacts.draft,
      artifact.content
    )
    actions.onUpdateArtifactDraft(
      artifact.type,
      `Ungespeicherter ${artifact.type}-Entwurf.`
    )
    actions.onCancelArtifactEditor(artifact.type)

    assert.equal(system.viewRecorder.lastState.artifacts.mode, 'view')
    assert.equal(system.viewRecorder.lastState.artifacts.draft, '')
    assert.equal(
      system.viewRecorder.lastState.artifacts.values[artifact.type],
      artifact.content
    )
    assert.deepEqual(system.viewRecorder.lastState.focusTarget, {
      type: 'artifactTrigger',
      artifactType: artifact.type,
    })

    actions.onOpenArtifactEditor(artifact.type)
    assert.equal(
      system.viewRecorder.lastState.artifacts.draft,
      artifact.content
    )
    actions.onCancelArtifactEditor(artifact.type)
  }

  assert.equal(system.artifactServiceDouble.calls.saveNote.length, 0)
  assert.equal(system.artifactServiceDouble.calls.saveSummary.length, 0)
})

test('leert beide Artefakttypen erst nach Inline-Bestätigung und erhält Entwürfe beim Abbruch', () => {
  const typeCases = [
    {
      type: 'note',
      clearMethod: 'clearNote',
      otherClearMethod: 'clearSummary',
      label: 'Notiz',
    },
    {
      type: 'summary',
      clearMethod: 'clearSummary',
      otherClearMethod: 'clearNote',
      label: 'Zusammenfassung',
    },
  ]

  for (const typeCase of typeCases) {
    const counterpartType =
      typeCase.type === 'note' ? 'summary' : 'note'
    const target = createArtifact({
      id: `artifact-pulse-${typeCase.type}`,
      type: typeCase.type,
      content: `Persistierter ${typeCase.type}-Text.`,
    })
    const counterpart = createArtifact({
      id: `artifact-pulse-${counterpartType}`,
      type: counterpartType,
      content: `Persistierter ${counterpartType}-Text.`,
      createdAt: '2026-07-19T10:05:00.000Z',
      updatedAt: '2026-07-19T10:05:00.000Z',
    })
    const system = createControllerSystem({
      artifactLoadResults: createArtifactLoadSuccess(
        createArtifactStore([target, counterpart])
      ),
      artifactMutationHandlers: {
        [typeCase.clearMethod]: createArtifactMutationSuccess(
          'artifactCleared',
          true,
          createArtifactStore([counterpart])
        ),
      },
    })
    const actions = openReadyController(system)
    selectArtifactNode(actions)

    const dirtyDraft = `Ungespeicherter ${typeCase.type}-Entwurf.`
    actions.onOpenArtifactEditor(typeCase.type)
    actions.onUpdateArtifactDraft(typeCase.type, dirtyDraft)
    actions.onOpenArtifactClearConfirmation(typeCase.type)

    assert.equal(
      system.viewRecorder.lastState.artifacts.mode,
      'confirmClear'
    )
    assert.equal(
      system.viewRecorder.lastState.artifacts.draft,
      dirtyDraft
    )
    assert.deepEqual(system.viewRecorder.lastState.focusTarget, {
      type: 'artifactConfirmation',
      artifactType: typeCase.type,
    })

    actions.onCancelArtifactClearConfirmation(typeCase.type)
    assert.equal(
      system.artifactServiceDouble.calls[typeCase.clearMethod].length,
      0
    )
    assert.equal(system.viewRecorder.lastState.artifacts.mode, 'editing')
    assert.equal(
      system.viewRecorder.lastState.artifacts.draft,
      dirtyDraft
    )
    assert.equal(system.viewRecorder.lastState.artifacts.dirty, true)
    assert.deepEqual(system.viewRecorder.lastState.focusTarget, {
      type: 'artifactClearTrigger',
      artifactType: typeCase.type,
    })

    actions.onCancelArtifactEditor(typeCase.type)
    actions.onOpenArtifactClearConfirmation(typeCase.type)
    actions.onConfirmArtifactClear(typeCase.type)

    assert.deepEqual(
      system.artifactServiceDouble.calls[typeCase.clearMethod],
      [
        {
          moduleId: 'module-orbit',
          chapterId: 'chapter-signals',
          learningNodeId: 'node-pulse',
        },
      ]
    )
    assert.equal(
      system.artifactServiceDouble.calls[
        typeCase.otherClearMethod
      ].length,
      0
    )
    assert.equal(
      system.viewRecorder.lastState.artifacts.values[typeCase.type],
      null
    )
    assert.equal(
      system.viewRecorder.lastState.artifacts.values[counterpartType],
      counterpart.content
    )
    assert.equal(
      system.viewRecorder.lastState.artifacts.statusMessage,
      `${typeCase.label} wurde lokal geleert.`
    )
    assert.deepEqual(system.viewRecorder.lastState.focusTarget, {
      type: 'artifactTrigger',
      artifactType: typeCase.type,
    })
  }
})

test('isoliert Artefakt-Ladefehler, redigiert private Details und lädt nur Artefakte erneut', () => {
  const privateSentinel =
    'PRIVATE-ARTEFAKT-LADEMELDUNG-DARF-NICHT-IN-DIE-VIEW'
  const note = createArtifact()
  const orphanedArtifact = createArtifact({
    id: 'artifact-orphan-note',
    learningNodeId: 'node-does-not-exist',
    content: privateSentinel,
  })
  const system = createControllerSystem({
    artifactLoadResults: [
      {
        ok: false,
        status: 'readFailed',
        error: {
          code: 'readFailed',
          message: privateSentinel,
        },
      },
      createArtifactLoadSuccess(
        createArtifactStore([orphanedArtifact])
      ),
      createArtifactLoadSuccess(createArtifactStore([note])),
    ],
  })
  const actions = openReadyController(system)

  assert.equal(system.viewRecorder.lastState.phase, 'ready')
  assert.equal(
    system.viewRecorder.lastState.progress.phase,
    'ready'
  )
  selectArtifactNode(actions)
  assert.equal(
    system.viewRecorder.lastState.artifacts.phase,
    'unavailable'
  )
  assert.match(
    system.viewRecorder.lastState.artifacts.errorMessage,
    /nicht gelesen/
  )
  assert.equal(
    JSON.stringify(system.viewRecorder.lastState).includes(
      privateSentinel
    ),
    false
  )

  actions.onRetryArtifactLoad()

  assert.equal(system.serviceDouble.calls.loadHub.length, 1)
  assert.equal(system.progressServiceDouble.calls.loadProgress.length, 1)
  assert.equal(
    system.artifactServiceDouble.calls.loadArtifacts.length,
    2
  )
  assert.equal(
    system.viewRecorder.lastState.artifacts.phase,
    'unavailable'
  )
  assert.equal(
    JSON.stringify(system.viewRecorder.lastState).includes(
      privateSentinel
    ),
    false
  )
  assert.deepEqual(system.viewRecorder.lastState.focusTarget, {
    type: 'artifactLoadAlert',
  })

  actions.onRetryArtifactLoad()

  assert.equal(system.serviceDouble.calls.loadHub.length, 1)
  assert.equal(system.progressServiceDouble.calls.loadProgress.length, 1)
  assert.equal(
    system.artifactServiceDouble.calls.loadArtifacts.length,
    3
  )
  assert.equal(system.viewRecorder.lastState.artifacts.phase, 'ready')
  assert.equal(
    system.viewRecorder.lastState.artifacts.values.note,
    note.content
  )
  assert.equal(
    system.viewRecorder.lastState.selectedLearningNodeId,
    'node-pulse'
  )
  assert.deepEqual(system.viewRecorder.lastState.focusTarget, {
    type: 'artifactHeading',
  })
})

test('bewahrt bei Artefakt-Mutationsfehler den gültigen Snapshot und Entwurf ohne private Fehlerdetails', () => {
  const privateSentinel =
    'PRIVATE-ARTEFAKT-SCHREIBFEHLER-DARF-NICHT-IN-DIE-VIEW'
  const note = createArtifact()
  const summary = createArtifact({
    id: 'artifact-pulse-summary',
    type: 'summary',
    content: 'Persistierte synthetische Zusammenfassung.',
    createdAt: '2026-07-19T10:05:00.000Z',
    updatedAt: '2026-07-19T10:05:00.000Z',
  })
  const system = createControllerSystem({
    artifactLoadResults: createArtifactLoadSuccess(
      createArtifactStore([note, summary])
    ),
    artifactMutationHandlers: {
      saveNote: {
        ok: false,
        status: 'writeFailed',
        error: {
          code: 'writeFailed',
          message: privateSentinel,
          privateField: privateSentinel,
        },
      },
    },
  })
  const actions = openReadyController(system)
  selectArtifactNode(actions)
  const dirtyDraft = 'Ungespeicherter synthetischer Notizentwurf.'

  actions.onOpenArtifactEditor('note')
  actions.onUpdateArtifactDraft('note', dirtyDraft)
  actions.onSaveArtifact({ type: 'note', content: dirtyDraft })

  assert.equal(system.artifactServiceDouble.calls.saveNote.length, 1)
  assert.deepEqual(system.viewRecorder.lastState.artifacts.values, {
    note: note.content,
    summary: summary.content,
  })
  assert.equal(system.viewRecorder.lastState.artifacts.mode, 'editing')
  assert.equal(system.viewRecorder.lastState.artifacts.draft, dirtyDraft)
  assert.equal(system.viewRecorder.lastState.artifacts.dirty, true)
  assert.match(
    system.viewRecorder.lastState.artifacts.errorMessage,
    /nicht lokal gespeichert/
  )
  assert.equal(
    JSON.stringify(system.viewRecorder.lastState).includes(
      privateSentinel
    ),
    false
  )
  assert.deepEqual(system.viewRecorder.lastState.focusTarget, {
    type: 'artifactAlert',
    artifactType: 'note',
  })
})

test('lehnt malformed und widersprüchliche Artefakt-Success-Ergebnisse mit vollständigem UI-Rollback ab', () => {
  const privateSentinel =
    'PRIVATE-WIDERSPRUCH-DARF-NICHT-IN-DIE-VIEW'
  const initialNote = createArtifact()
  const initialSummary = createArtifact({
    id: 'artifact-pulse-summary',
    type: 'summary',
    content: 'Persistierte synthetische Zusammenfassung.',
    createdAt: '2026-07-19T10:05:00.000Z',
    updatedAt: '2026-07-19T10:05:00.000Z',
  })
  const initialStore = createArtifactStore([
    initialNote,
    initialSummary,
  ])
  const cases = [
    {
      type: 'note',
      saveMethod: 'saveNote',
      result: {
        ok: true,
        status: 'artifactUpdated',
        changed: true,
        privateResultDetail: privateSentinel,
      },
    },
    {
      type: 'summary',
      saveMethod: 'saveSummary',
      result: createArtifactMutationSuccess(
        'artifactUpdated',
        true,
        createArtifactStore([
          {
            ...initialNote,
            content: privateSentinel,
            updatedAt: '2026-07-19T11:00:00.000Z',
          },
          {
            ...initialSummary,
            content: 'Neuer synthetischer summary-Entwurf.',
            updatedAt: '2026-07-19T11:00:00.000Z',
          },
        ])
      ),
    },
  ]

  for (const malformedCase of cases) {
    const system = createControllerSystem({
      artifactLoadResults: createArtifactLoadSuccess(initialStore),
      artifactMutationHandlers: {
        [malformedCase.saveMethod]: malformedCase.result,
      },
    })
    const actions = openReadyController(system)
    selectArtifactNode(actions)
    const dirtyDraft =
      `Neuer synthetischer ${malformedCase.type}-Entwurf.`

    actions.onOpenArtifactEditor(malformedCase.type)
    actions.onUpdateArtifactDraft(malformedCase.type, dirtyDraft)
    actions.onSaveArtifact({
      type: malformedCase.type,
      content: dirtyDraft,
    })

    assert.equal(
      system.artifactServiceDouble.calls[
        malformedCase.saveMethod
      ].length,
      1
    )
    assert.deepEqual(system.viewRecorder.lastState.artifacts.values, {
      note: initialNote.content,
      summary: initialSummary.content,
    })
    assert.equal(system.viewRecorder.lastState.artifacts.mode, 'editing')
    assert.equal(
      system.viewRecorder.lastState.artifacts.draft,
      dirtyDraft
    )
    assert.match(
      system.viewRecorder.lastState.artifacts.errorMessage,
      /nicht sicher verarbeitet/
    )
    assert.equal(
      JSON.stringify(system.viewRecorder.lastState).includes(
        privateSentinel
      ),
      false
    )
    assert.deepEqual(system.viewRecorder.lastState.focusTarget, {
      type: 'artifactAlert',
      artifactType: malformedCase.type,
    })
  }
})

test('erhält Dirty-Drafts über Progress-Rerender und blockiert alle verlustreichen Bereichswechsel bis Cancel', () => {
  const hub = createArtifactHubFixture()
  const note = createArtifact()
  const completedProjection = createProgressProjection(
    hub,
    ['chapter-signals']
  )
  const system = createControllerSystem({
    loadResults: { ok: true, status: 'loaded', hub },
    progressLoadResults: createProgressLoadSuccess(hub),
    progressMutationHandlers: {
      completeChapter: createProgressMutationSuccess(
        'chapterCompleted',
        true,
        completedProjection
      ),
    },
    artifactLoadResults: createArtifactLoadSuccess(
      createArtifactStore([note])
    ),
  })
  const actions = openReadyController(system)
  selectArtifactNode(actions)
  const dirtyDraft =
    'Ungespeicherter synthetischer Entwurf über ein ruhiges Signal.'

  actions.onOpenArtifactEditor('note')
  actions.onUpdateArtifactDraft('note', dirtyDraft)
  actions.onToggleChapterCompletion(
    'module-orbit',
    'chapter-signals'
  )

  assert.equal(
    system.progressServiceDouble.calls.completeChapter.length,
    1
  )
  assert.deepEqual(
    system.viewRecorder.lastState.progress.projection,
    completedProjection
  )
  assert.equal(system.viewRecorder.lastState.artifacts.draft, dirtyDraft)
  assert.equal(system.viewRecorder.lastState.artifacts.dirty, true)
  assert.equal(
    system.viewRecorder.lastState.artifacts.values.note,
    note.content
  )

  actions.onSelectLearningNode(
    'module-orbit',
    'chapter-signals',
    'node-echo'
  )
  assert.equal(
    system.viewRecorder.lastState.selectedLearningNodeId,
    'node-pulse'
  )
  assert.deepEqual(system.viewRecorder.lastState.focusTarget, {
    type: 'artifactField',
    artifactType: 'note',
  })

  actions.onToggleChapter('module-orbit', 'chapter-signals')
  assert.deepEqual(
    system.viewRecorder.lastState.expandedChapterIds,
    ['chapter-signals']
  )

  actions.onBackToOverview()
  assert.equal(
    system.viewRecorder.lastState.selectedModuleId,
    'module-orbit'
  )

  actions.onOpenAddLearningNodeForm(
    'module-orbit',
    'chapter-signals'
  )
  assert.equal(system.viewRecorder.lastState.form, null)

  actions.onSelectModule('module-garden')
  assert.equal(
    system.viewRecorder.lastState.selectedModuleId,
    'module-orbit'
  )
  assert.match(
    system.viewRecorder.lastState.artifacts.errorMessage,
    /ungespeicherten Entwurf/
  )
  assert.equal(system.viewRecorder.lastState.artifacts.draft, dirtyDraft)

  assert.equal(system.controller.close(), false)
  assert.equal(system.viewRecorder.unmountCalls, 0)
  assert.equal(system.viewRecorder.lastState.artifacts.draft, dirtyDraft)
  assert.deepEqual(system.viewRecorder.lastState.focusTarget, {
    type: 'artifactField',
    artifactType: 'note',
  })

  actions.onCancelArtifactEditor('note')
  assert.deepEqual(system.viewRecorder.lastState.focusTarget, {
    type: 'artifactTrigger',
    artifactType: 'note',
  })
  actions.onSelectLearningNode(
    'module-orbit',
    'chapter-signals',
    'node-echo'
  )
  assert.equal(
    system.viewRecorder.lastState.selectedLearningNodeId,
    'node-echo'
  )
  assert.deepEqual(system.viewRecorder.lastState.artifacts.values, {
    note: null,
    summary: null,
  })
  assert.deepEqual(system.viewRecorder.lastState.focusTarget, {
    type: 'learningNodeHeading',
    moduleId: 'module-orbit',
    chapterId: 'chapter-signals',
    learningNodeId: 'node-echo',
  })

  assert.equal(system.controller.close(), true)
  assert.equal(system.viewRecorder.unmountCalls, 1)
})

test('öffnet das Inhaltsformular für Node B atomar nach einem sauberen Artifact-Editor von Node A', () => {
  const hub = createArtifactHubFixture()
  const noteA = createArtifact({
    content: 'Persistierte synthetische Notiz für Node A.',
  })
  const noteB = createArtifact({
    id: 'artifact-echo-note',
    learningNodeId: 'node-echo',
    content: 'Persistierte synthetische Notiz für Node B.',
    createdAt: '2026-07-19T10:05:00.000Z',
    updatedAt: '2026-07-19T10:05:00.000Z',
  })
  const initialStore = createArtifactStore([noteA, noteB])
  const system = createControllerSystem({
    loadResults: { ok: true, status: 'loaded', hub },
    artifactLoadResults: createArtifactLoadSuccess(initialStore),
    artifactMutationHandlers: {
      saveNote: createArtifactMutationSuccess(
        'artifactUnchanged',
        false,
        initialStore
      ),
    },
  })
  const actions = openReadyController(system)
  selectArtifactNode(actions)

  actions.onOpenArtifactEditor('note')
  assert.equal(system.viewRecorder.lastState.artifacts.draft, noteA.content)

  actions.onOpenUpdateLearningNodeForm(
    'module-orbit',
    'chapter-signals',
    'node-echo'
  )

  assert.equal(
    system.viewRecorder.lastState.selectedLearningNodeId,
    'node-echo'
  )
  assert.equal(
    system.viewRecorder.lastState.form.type,
    'updateLearningNode'
  )
  assert.equal(
    system.viewRecorder.lastState.form.learningNodeId,
    'node-echo'
  )
  assert.equal(system.viewRecorder.lastState.artifacts.mode, 'view')
  assert.equal(system.viewRecorder.lastState.artifacts.activeType, null)
  assert.equal(system.viewRecorder.lastState.artifacts.draft, '')
  assert.equal(
    system.viewRecorder.lastState.artifacts.values.note,
    noteB.content
  )
  assert.equal(
    JSON.stringify(system.viewRecorder.lastState.artifacts).includes(
      noteA.content
    ),
    false
  )

  actions.onSaveArtifact({
    type: 'note',
    content: noteA.content,
  })
  actions.onConfirmArtifactClear('note')

  assert.equal(system.artifactServiceDouble.calls.saveNote.length, 0)
  assert.equal(system.artifactServiceDouble.calls.clearNote.length, 0)

  actions.onCancelForm()
  actions.onOpenArtifactEditor('note')
  assert.equal(system.viewRecorder.lastState.artifacts.draft, noteB.content)
  actions.onSaveArtifact({
    type: 'note',
    content: noteB.content,
  })
  assert.deepEqual(system.artifactServiceDouble.calls.saveNote, [
    {
      moduleId: 'module-orbit',
      chapterId: 'chapter-signals',
      learningNodeId: 'node-echo',
      content: noteB.content,
    },
  ])
})

test('blockiert das Inhaltsformular für Node B vollständig bei einem Dirty-Draft von Node A', () => {
  const hub = createArtifactHubFixture()
  const noteA = createArtifact()
  const noteB = createArtifact({
    id: 'artifact-echo-note',
    learningNodeId: 'node-echo',
    content: 'Persistierte synthetische Notiz für Node B.',
    createdAt: '2026-07-19T10:05:00.000Z',
    updatedAt: '2026-07-19T10:05:00.000Z',
  })
  const system = createControllerSystem({
    loadResults: { ok: true, status: 'loaded', hub },
    artifactLoadResults: createArtifactLoadSuccess(
      createArtifactStore([noteA, noteB])
    ),
  })
  const actions = openReadyController(system)
  selectArtifactNode(actions)
  const dirtyDraft =
    'Ungespeicherter synthetischer Notizentwurf für Node A.'

  actions.onOpenArtifactEditor('note')
  actions.onUpdateArtifactDraft('note', dirtyDraft)
  actions.onOpenUpdateLearningNodeForm(
    'module-orbit',
    'chapter-signals',
    'node-echo'
  )

  assert.equal(
    system.viewRecorder.lastState.selectedLearningNodeId,
    'node-pulse'
  )
  assert.equal(system.viewRecorder.lastState.form, null)
  assert.equal(system.viewRecorder.lastState.artifacts.mode, 'editing')
  assert.equal(system.viewRecorder.lastState.artifacts.draft, dirtyDraft)
  assert.equal(system.viewRecorder.lastState.artifacts.dirty, true)
  assert.match(
    system.viewRecorder.lastState.artifacts.errorMessage,
    /ungespeicherten Entwurf/
  )
  assert.deepEqual(system.viewRecorder.lastState.focusTarget, {
    type: 'artifactField',
    artifactType: 'note',
  })
  assert.equal(system.serviceDouble.calls.updateLearningNode.length, 0)

  for (const methodName of [
    'saveNote',
    'saveSummary',
    'clearNote',
    'clearSummary',
  ]) {
    assert.equal(
      system.artifactServiceDouble.calls[methodName].length,
      0
    )
  }
})

test('verwirft widersprüchliche private Artifact-Ziele vor Save und Clear ohne Snapshot-Mutation', () => {
  const privateContent =
    'PRIVATE-NODE-A-NOTIZ-DARF-NICHT-IN-DIE-FEHLERMELDUNG'
  const hub = createArtifactHubFixture()
  const noteA = createArtifact({
    content: privateContent,
  })
  const noteB = createArtifact({
    id: 'artifact-echo-note',
    learningNodeId: 'node-echo',
    content: 'Persistierte synthetische Notiz für Node B.',
    createdAt: '2026-07-19T10:05:00.000Z',
    updatedAt: '2026-07-19T10:05:00.000Z',
  })
  const initialStore = createArtifactStore([noteA, noteB])
  const unsafeUpdatedNoteB = {
    ...noteB,
    content: privateContent,
    updatedAt: '2026-07-19T11:00:00.000Z',
  }
  const system = createControllerSystem({
    loadResults: { ok: true, status: 'loaded', hub },
    artifactLoadResults: createArtifactLoadSuccess(initialStore),
    artifactMutationHandlers: {
      saveNote: createArtifactMutationSuccess(
        'artifactUpdated',
        true,
        createArtifactStore([noteA, unsafeUpdatedNoteB])
      ),
    },
  })
  const actions = openReadyController(system)
  selectArtifactNode(actions)
  actions.onOpenArtifactEditor('note')

  const reentrantSubmission = { type: 'note' }
  Object.defineProperty(reentrantSubmission, 'content', {
    enumerable: true,
    get() {
      actions.onSelectLearningNode(
        'module-orbit',
        'chapter-signals',
        'node-echo'
      )
      actions.onOpenArtifactEditor('note')
      return noteA.content
    },
  })

  actions.onSaveArtifact(reentrantSubmission)

  assert.equal(
    system.viewRecorder.lastState.selectedLearningNodeId,
    'node-echo'
  )
  assert.equal(system.artifactServiceDouble.calls.saveNote.length, 0)
  assert.equal(system.artifactServiceDouble.calls.saveSummary.length, 0)
  assert.equal(system.viewRecorder.lastState.artifacts.mode, 'view')
  assert.equal(system.viewRecorder.lastState.artifacts.activeType, null)
  assert.equal(system.viewRecorder.lastState.artifacts.draft, '')
  assert.equal(
    system.viewRecorder.lastState.artifacts.values.note,
    noteB.content
  )
  assert.match(
    system.viewRecorder.lastState.artifacts.errorMessage,
    /nicht sicher verarbeitet/
  )

  for (const privateErrorDetail of [
    privateContent,
    'module-orbit',
    'chapter-signals',
    'node-pulse',
    'node-echo',
  ]) {
    assert.equal(
      system.viewRecorder.lastState.artifacts.errorMessage.includes(
        privateErrorDetail
      ),
      false
    )
  }

  assert.equal(
    JSON.stringify(system.viewRecorder.lastState.artifacts).includes(
      privateContent
    ),
    false
  )

  actions.onSelectLearningNode(
    'module-orbit',
    'chapter-signals',
    'node-pulse'
  )
  assert.equal(
    system.viewRecorder.lastState.artifacts.values.note,
    noteA.content
  )

  actions.onOpenArtifactClearConfirmation('note')
  const originalArrayFind = Array.prototype.find
  let selectedNodeLookupCount = 0

  try {
    Array.prototype.find = function findWithContradictorySelection(
      predicate,
      thisArg
    ) {
      const isTargetNodeCollection = (
        Array.isArray(this) &&
        this.some((entry) => entry?.id === 'node-pulse') &&
        this.some((entry) => entry?.id === 'node-echo')
      )

      if (isTargetNodeCollection) {
        selectedNodeLookupCount += 1

        if (selectedNodeLookupCount === 2) {
          return originalArrayFind.call(
            this,
            (entry) => entry?.id === 'node-echo'
          )
        }
      }

      return originalArrayFind.call(this, predicate, thisArg)
    }

    actions.onConfirmArtifactClear('note')
  } finally {
    Array.prototype.find = originalArrayFind
  }

  assert.equal(system.artifactServiceDouble.calls.clearNote.length, 0)
  assert.equal(system.artifactServiceDouble.calls.clearSummary.length, 0)
  assert.equal(
    system.viewRecorder.lastState.selectedLearningNodeId,
    'node-pulse'
  )
  assert.equal(system.viewRecorder.lastState.artifacts.mode, 'view')
  assert.equal(
    system.viewRecorder.lastState.artifacts.values.note,
    noteA.content
  )
  assert.match(
    system.viewRecorder.lastState.artifacts.errorMessage,
    /nicht sicher verarbeitet/
  )
})

test('akzeptiert artifactAlreadyEmpty bei ausschließlich zwischenzeitlich entferntem Ziel', () => {
  const hub = createArtifactHubFixture()
  const summary = createArtifact({
    id: 'artifact-pulse-summary',
    type: 'summary',
    content: 'Persistierte synthetische Schwesterzusammenfassung.',
    createdAt: '2026-07-19T10:01:00.000Z',
    updatedAt: '2026-07-19T10:01:00.000Z',
  })
  const target = createArtifact()
  const echoNote = createArtifact({
    id: 'artifact-echo-note',
    learningNodeId: 'node-echo',
    content: 'Persistierte synthetische Echo-Notiz.',
    createdAt: '2026-07-19T10:02:00.000Z',
    updatedAt: '2026-07-19T10:02:00.000Z',
  })
  const system = createControllerSystem({
    loadResults: { ok: true, status: 'loaded', hub },
    artifactLoadResults: createArtifactLoadSuccess(
      createArtifactStore([summary, target, echoNote])
    ),
    artifactMutationHandlers: {
      clearNote: createArtifactMutationSuccess(
        'artifactAlreadyEmpty',
        false,
        createArtifactStore([summary, echoNote])
      ),
    },
  })
  const actions = openReadyController(system)
  selectArtifactNode(actions)

  actions.onOpenArtifactClearConfirmation('note')
  actions.onConfirmArtifactClear('note')

  assert.deepEqual(system.artifactServiceDouble.calls.clearNote, [
    {
      moduleId: 'module-orbit',
      chapterId: 'chapter-signals',
      learningNodeId: 'node-pulse',
    },
  ])
  assert.equal(system.viewRecorder.lastState.artifacts.values.note, null)
  assert.equal(
    system.viewRecorder.lastState.artifacts.values.summary,
    summary.content
  )
  assert.equal(system.viewRecorder.lastState.artifacts.mode, 'view')
  assert.equal(
    system.viewRecorder.lastState.artifacts.statusMessage,
    'Notiz war bereits leer.'
  )

  actions.onSelectLearningNode(
    'module-orbit',
    'chapter-signals',
    'node-echo'
  )
  assert.equal(
    system.viewRecorder.lastState.artifacts.values.note,
    echoNote.content
  )
})

test('lehnt widersprüchliche artifactAlreadyEmpty-Ergebnisse ohne privaten Ergebnis-Leak ab', () => {
  const privateSentinel =
    'PRIVATE-ALREADY-EMPTY-ERGEBNISDETAILS-DÜRFEN-NICHT-IN-DIE-VIEW'
  const hub = createArtifactHubFixture()
  const target = createArtifact()
  const sibling = createArtifact({
    id: 'artifact-pulse-summary',
    type: 'summary',
    content: 'Persistierte synthetische Schwesterzusammenfassung.',
    createdAt: '2026-07-19T10:01:00.000Z',
    updatedAt: '2026-07-19T10:01:00.000Z',
  })
  const initialStore = createArtifactStore([target, sibling])
  const removedTargetStore = createArtifactStore([sibling])
  const unsafeCases = [
    {
      name: 'weiterhin vorhandenes Ziel',
      status: 'artifactAlreadyEmpty',
      changed: false,
      artifactStore: initialStore,
    },
    {
      name: 'falscher changed-Wert',
      status: 'artifactAlreadyEmpty',
      changed: true,
      artifactStore: removedTargetStore,
    },
    {
      name: 'verändertes Schwesterartefakt',
      status: 'artifactAlreadyEmpty',
      changed: false,
      artifactStore: createArtifactStore([
        {
          ...sibling,
          content: privateSentinel,
          updatedAt: '2026-07-19T12:00:00.000Z',
        },
      ]),
    },
    {
      name: 'falsche Zielreferenz',
      status: 'artifactAlreadyEmpty',
      changed: false,
      artifactStore: createArtifactStore([
        {
          ...target,
          id: 'artifact-facet-note',
          moduleId: 'module-garden',
          chapterId: 'chapter-facets',
          learningNodeId: 'node-facet',
        },
        sibling,
      ]),
    },
    {
      name: 'unbekannter Erfolgsstatus',
      status: 'artifactDisappeared',
      changed: false,
      artifactStore: removedTargetStore,
    },
  ]

  for (const unsafeCase of unsafeCases) {
    const system = createControllerSystem({
      loadResults: { ok: true, status: 'loaded', hub },
      artifactLoadResults: createArtifactLoadSuccess(initialStore),
      artifactMutationHandlers: {
        clearNote: createArtifactMutationSuccess(
          unsafeCase.status,
          unsafeCase.changed,
          unsafeCase.artifactStore
        ),
      },
    })
    const actions = openReadyController(system)
    selectArtifactNode(actions)

    actions.onOpenArtifactClearConfirmation('note')
    actions.onConfirmArtifactClear('note')

    assert.equal(
      system.artifactServiceDouble.calls.clearNote.length,
      1,
      unsafeCase.name
    )
    assert.equal(
      system.viewRecorder.lastState.artifacts.values.note,
      target.content,
      unsafeCase.name
    )
    assert.equal(
      system.viewRecorder.lastState.artifacts.values.summary,
      sibling.content,
      unsafeCase.name
    )
    assert.equal(
      system.viewRecorder.lastState.artifacts.mode,
      'confirmClear',
      unsafeCase.name
    )
    assert.match(
      system.viewRecorder.lastState.artifacts.errorMessage,
      /nicht sicher verarbeitet/,
      unsafeCase.name
    )
    assert.deepEqual(
      system.viewRecorder.lastState.focusTarget,
      {
        type: 'artifactAlert',
        artifactType: 'note',
      },
      unsafeCase.name
    )
    assert.equal(
      JSON.stringify(system.viewRecorder.lastState).includes(
        privateSentinel
      ),
      false,
      unsafeCase.name
    )
  }
})
