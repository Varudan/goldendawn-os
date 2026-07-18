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

function createControllerSystem({ loadResults, mutationHandlers } = {}) {
  const scheduler = createManualScheduler()
  const viewRecorder = createViewRecorder()
  const serviceDouble = createServiceDouble({
    loadResults:
      loadResults ?? {
        ok: true,
        status: 'loaded',
        hub: createHubFixture(),
      },
    mutationHandlers,
  })
  const controller = createLearningHubController({
    learningHubService: serviceDouble.service,
    learningHubView: viewRecorder.view,
    scheduleTask: scheduler.scheduleTask,
  })

  return {
    controller,
    scheduler,
    serviceDouble,
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
  assert.equal(system.viewRecorder.renders.at(-2).phase, 'mutating')
  assert.equal(
    system.viewRecorder.renders.at(-2).form.isSubmitting,
    true
  )
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
