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

function createControllerSystem({
  loadResults,
  mutationHandlers,
  progressLoadResults,
  progressMutationHandlers,
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
  const controller = createLearningHubController({
    learningHubService: serviceDouble.service,
    learningProgressService: progressServiceDouble.service,
    learningHubView: viewRecorder.view,
    scheduleTask: scheduler.scheduleTask,
  })

  return {
    controller,
    scheduler,
    serviceDouble,
    progressServiceDouble,
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
