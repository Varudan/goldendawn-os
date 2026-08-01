import assert from 'node:assert/strict'
import test from 'node:test'

import { createLichtwaldLogController } from '../src/modules/lichtwald-log/lichtwaldLogController.js'
import { createLichtwaldLogService } from '../src/services/lichtwaldLogService.js'
import { createStorageAdapter } from '../src/storage/storageAdapter.js'
import {
  createLichtwaldLogStorage,
  LICHTWALD_LOG_MAX_SERIALIZED_LENGTH,
  LICHTWALD_LOG_STORAGE_KEY,
} from '../src/storage/lichtwaldLogStorage.js'
import { FakeStorage } from './helpers/fakeStorage.js'

const CONTROLLER_METHOD_NAMES = Object.freeze(['open', 'close'])
const ACTION_METHOD_NAMES = Object.freeze([
  'onRetryLoad',
  'onSelectEntry',
  'onBackToOverview',
  'onOpenCreateEntryForm',
  'onOpenUpdateEntryForm',
  'onUpdateFormField',
  'onSubmitForm',
  'onCancelForm',
  'onRequestDeleteEntry',
  'onCancelDeleteEntry',
  'onConfirmDeleteEntry',
  'onSetFeaturedEntry',
  'onChangeSearchQuery',
  'onChangeCalendarDateFilter',
  'onChangeTagFilter',
  'onResetFilters',
])
const VIEW_MODEL_PROPERTY_NAMES = Object.freeze([
  'runtimeMode',
  'phase',
  'entries',
  'visibleEntryIds',
  'availableTags',
  'searchQuery',
  'calendarDateFilter',
  'selectedTag',
  'hasActiveFilters',
  'filteredEmptyState',
  'featuredEntryId',
  'selectedEntryId',
  'form',
  'deleteState',
  'featuredState',
  'statusMessage',
  'statusMessageTone',
  'errorMessage',
  'focusTarget',
])

// Alle Fixtures sind vollständig neu erfunden. Auch private Snapshots enthalten
// ausschließlich synthetische Testinhalte und keine realen Erlebnisse oder Daten.
function createEntry(overrides = {}) {
  return {
    id: 'lichtwald-entry-prism-1',
    calendarDate: '2036-04-18',
    title: 'Erfundene Prismenkammer',
    text: 'Eine frei erfundene Notiz über farbige Formen im Testmodell.',
    tags: ['Prisma', 'Fiktiv'],
    ...overrides,
  }
}

function createSecondEntry(overrides = {}) {
  return createEntry({
    id: 'lichtwald-entry-comet-2',
    calendarDate: '2036-04-17',
    title: 'Synthetische Kometenkarte',
    text: 'Ein vollständig erfundener Text über eine imaginäre Kometenbahn.',
    tags: ['Komet', 'Modell'],
    ...overrides,
  })
}

function createPrivateLog(
  entries = [createEntry(), createSecondEntry()],
  overrides = {}
) {
  return {
    schemaVersion: 1,
    dataOrigin: 'private',
    featuredEntryId: null,
    entries,
    ...overrides,
  }
}

function createEmptyPrivateLog() {
  return createPrivateLog([], { featuredEntryId: null })
}

function createSyntheticLog(entries = [createEntry()], overrides = {}) {
  return createPrivateLog(entries, {
    dataOrigin: 'synthetic',
    ...overrides,
  })
}

function createEntryValues(entry = createEntry(), overrides = {}) {
  return {
    calendarDate: entry.calendarDate,
    title: entry.title,
    text: entry.text,
    tags: structuredClone(entry.tags),
    ...overrides,
  }
}

function createLoadSuccess(
  lichtwaldLog = createPrivateLog(),
  status = lichtwaldLog.entries.length === 0 ? 'empty' : 'loaded'
) {
  return {
    ok: true,
    status,
    initialized: false,
    lichtwaldLog,
  }
}

function createLoadFailure(
  status = 'readFailed',
  code = 'lichtwaldLogStorageReadFailed',
  message = 'fixture-private-load-error-sentinel'
) {
  return {
    ok: false,
    status,
    lichtwaldLog: null,
    error: { code, message },
  }
}

function createMutationFailure({
  status = 'writeFailed',
  code = 'lichtwaldLogStorageWriteFailed',
  lichtwaldLog = null,
  message = 'fixture-private-mutation-error-sentinel',
  fieldErrors,
} = {}) {
  const error = { code, message }

  if (fieldErrors !== undefined) {
    error.fieldErrors = fieldErrors
  }

  return {
    ok: false,
    status,
    changed: false,
    lichtwaldLog,
    error,
  }
}

function createCreateSuccess(
  lichtwaldLog,
  createdEntry = lichtwaldLog.entries.at(-1)
) {
  return {
    ok: true,
    status: 'entryCreated',
    changed: true,
    createdEntry: structuredClone(createdEntry),
    lichtwaldLog,
  }
}

function createUpdateSuccess(
  lichtwaldLog,
  entryId,
  changed = true
) {
  return {
    ok: true,
    status: 'entryUpdated',
    changed,
    updatedEntry: structuredClone(
      lichtwaldLog.entries.find(({ id }) => id === entryId)
    ),
    lichtwaldLog,
  }
}

function createDeleteSuccess(
  lichtwaldLog,
  deletedEntryId,
  focusCleared = false
) {
  return {
    ok: true,
    status: 'entryDeleted',
    changed: true,
    deletedEntryId,
    focusCleared,
    lichtwaldLog,
  }
}

function createFeaturedSuccess(
  lichtwaldLog,
  featuredEntryId,
  changed = true
) {
  return {
    ok: true,
    status: 'featuredEntryUpdated',
    changed,
    featuredEntryId,
    lichtwaldLog,
  }
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const propertyName of Reflect.ownKeys(value)) {
      deepFreeze(value[propertyName])
    }

    Object.freeze(value)
  }

  return value
}

function createManualScheduler({
  throwOnSchedule = false,
  throwOnCancel = false,
  effectiveCancel = false,
} = {}) {
  const tasks = []
  let scheduleCalls = 0
  let cancelCalls = 0

  function scheduleTask(task) {
    scheduleCalls += 1

    if (throwOnSchedule) {
      throw new Error('fixture-scheduler-exception-sentinel')
    }

    const record = { task, cancelled: false }
    tasks.push(record)

    return () => {
      cancelCalls += 1

      if (throwOnCancel) {
        throw new Error('fixture-cancel-exception-sentinel')
      }

      if (effectiveCancel) {
        record.cancelled = true
      }
    }
  }

  function run(index = tasks.length - 1) {
    const record = tasks[index]

    if (!record) {
      throw new Error(`Kein Scheduler-Task an Position ${index}.`)
    }

    // Absichtlich auch nach Cancel ausführbar: Die Controller-Tokens müssen
    // veraltete Callbacks selbst dann blockieren, wenn Cancel wirkungslos ist.
    record.task()
  }

  return {
    tasks,
    scheduleTask,
    run,
    get scheduleCalls() {
      return scheduleCalls
    },
    get cancelCalls() {
      return cancelCalls
    },
  }
}

function createViewRecorder({ renderHook, throwOnUnmount = false } = {}) {
  const renders = []
  let actions = null
  let unmountCalls = 0

  return {
    renders,
    render(viewModel, nextActions) {
      renders.push({ viewModel, actions: nextActions })
      actions = nextActions
      renderHook?.(viewModel, nextActions)
    },
    unmount() {
      unmountCalls += 1

      if (throwOnUnmount) {
        throw new Error('fixture-unmount-exception-sentinel')
      }
    },
    get actions() {
      return actions
    },
    get lastState() {
      return renders.at(-1)?.viewModel ?? null
    },
    get unmountCalls() {
      return unmountCalls
    },
  }
}

function resolveHandler(handler, fallback, args) {
  if (typeof handler === 'function') {
    return handler(...args)
  }

  return handler === undefined ? fallback : handler
}

function createServiceDouble({
  loadResult = createLoadSuccess(),
  createResult,
  updateResult,
  deleteResult,
  featuredResult,
} = {}) {
  const calls = {
    loadLog: [],
    createEntry: [],
    updateEntry: [],
    deleteEntry: [],
    setFeaturedEntry: [],
  }
  const service = {
    loadLog() {
      calls.loadLog.push([])
      return resolveHandler(loadResult, createLoadSuccess(), [])
    },
    createEntry(input) {
      calls.createEntry.push([input])
      return resolveHandler(
        createResult,
        createMutationFailure(),
        [input]
      )
    },
    updateEntry(entryId, input) {
      calls.updateEntry.push([entryId, input])
      return resolveHandler(
        updateResult,
        createMutationFailure(),
        [entryId, input]
      )
    },
    deleteEntry(entryId) {
      calls.deleteEntry.push([entryId])
      return resolveHandler(
        deleteResult,
        createMutationFailure(),
        [entryId]
      )
    },
    setFeaturedEntry(entryIdOrNull) {
      calls.setFeaturedEntry.push([entryIdOrNull])
      return resolveHandler(
        featuredResult,
        createMutationFailure(),
        [entryIdOrNull]
      )
    },
  }

  return { calls, service }
}

function createControllerSystem({
  serviceDouble,
  serviceOptions,
  scheduler = createManualScheduler(),
  view = createViewRecorder(),
  expectedDataOrigin,
} = {}) {
  const resolvedServiceDouble = serviceDouble ?? createServiceDouble(
    serviceOptions
  )
  const controller = createLichtwaldLogController({
    lichtwaldLogService: resolvedServiceDouble.service,
    lichtwaldLogView: view,
    scheduleTask: scheduler.scheduleTask,
    expectedDataOrigin,
  })

  return {
    controller,
    scheduler,
    serviceDouble: resolvedServiceDouble,
    view,
  }
}

function openAndFlush(system, taskIndex = system.scheduler.tasks.length) {
  system.controller.open()
  system.scheduler.run(taskIndex)
  return system.view.actions
}

function createSubmission(type, values, entryId) {
  return {
    type,
    ...(entryId === undefined ? {} : { entryId }),
    calendarDate: values.calendarDate,
    title: values.title,
    text: values.text,
    tags: structuredClone(values.tags),
  }
}

function getEntryIds(viewModel) {
  return viewModel.entries.map(({ id }) => id)
}

function assertExactOwnKeys(value, expectedPropertyNames) {
  assert.deepEqual(
    Reflect.ownKeys(value).sort(),
    [...expectedPropertyNames].sort()
  )
}

function assertDeepFrozen(value, seen = new Set()) {
  if (!value || typeof value !== 'object' || seen.has(value)) {
    return
  }

  seen.add(value)
  assert.equal(Object.isFrozen(value), true)

  for (const propertyName of Reflect.ownKeys(value)) {
    assertDeepFrozen(value[propertyName], seen)
  }
}

function assertViewModelContract(viewModel) {
  assertExactOwnKeys(viewModel, VIEW_MODEL_PROPERTY_NAMES)
  assert.ok([
    'loading',
    'empty',
    'ready',
    'loadError',
    'mutating',
  ].includes(viewModel.phase))
  assert.ok(['success', 'notice'].includes(viewModel.statusMessageTone))
  assert.ok(['private', 'syntheticDemo'].includes(viewModel.runtimeMode))
  assert.equal(Object.hasOwn(viewModel, 'schemaVersion'), false)
  assert.equal(Object.hasOwn(viewModel, 'dataOrigin'), false)
  assert.equal(Object.hasOwn(viewModel, 'lichtwaldLog'), false)
  assert.equal(Object.hasOwn(viewModel, 'selectedEntry'), false)
  assert.equal(Array.isArray(viewModel.visibleEntryIds), true)
  assert.equal(Array.isArray(viewModel.availableTags), true)
  assert.equal(typeof viewModel.searchQuery, 'string')
  assert.equal(typeof viewModel.calendarDateFilter, 'string')
  assert.equal(typeof viewModel.selectedTag, 'string')
  assert.equal(typeof viewModel.hasActiveFilters, 'boolean')
  assert.equal(typeof viewModel.filteredEmptyState, 'boolean')
  assert.equal(
    viewModel.visibleEntryIds.every((entryId) =>
      viewModel.entries.some((entry) => entry.id === entryId)
    ),
    true
  )
  assertExactOwnKeys(viewModel.deleteState, [
    'entryId',
    'isSubmitting',
    'errorMessage',
  ])
  assertExactOwnKeys(viewModel.featuredState, [
    'isSubmitting',
    'targetEntryId',
    'errorMessage',
  ])

  for (const entry of viewModel.entries) {
    assertExactOwnKeys(entry, [
      'id',
      'calendarDate',
      'title',
      'text',
      'tags',
    ])
    assert.equal(Object.hasOwn(entry, 'isFeatured'), false)
  }

  if (viewModel.form !== null) {
    assertExactOwnKeys(viewModel.form, [
      'type',
      'entryId',
      'values',
      'fieldErrors',
      'errorMessage',
      'isSubmitting',
      'isDirty',
    ])
    assertExactOwnKeys(viewModel.form.values, [
      'calendarDate',
      'title',
      'text',
      'tags',
    ])
  }

  assertDeepFrozen(viewModel)
}

function getFeedbackText(viewModel) {
  return JSON.stringify({
    statusMessage: viewModel.statusMessage,
    errorMessage: viewModel.errorMessage,
    formErrorMessage: viewModel.form?.errorMessage ?? '',
    fieldErrors: viewModel.form?.fieldErrors ?? {},
    deleteErrorMessage: viewModel.deleteState.errorMessage,
    featuredErrorMessage: viewModel.featuredState.errorMessage,
  })
}

function assertFeedbackIsRedacted(viewModel, markers) {
  const feedbackText = getFeedbackText(viewModel)

  for (const marker of markers) {
    assert.equal(
      feedbackText.includes(marker),
      false,
      `Feedback enthält redigierungspflichtigen Marker: ${marker}`
    )
  }
}

function assertNoMutationCalls(serviceDouble) {
  assert.equal(serviceDouble.calls.createEntry.length, 0)
  assert.equal(serviceDouble.calls.updateEntry.length, 0)
  assert.equal(serviceDouble.calls.deleteEntry.length, 0)
  assert.equal(serviceDouble.calls.setFeaturedEntry.length, 0)
}

function assertNonStringLoadStatusIsRejectedAndRetryable({
  status,
  retryLog,
  expectedRetryPhase,
  privateMarkers,
  getCoercionCalls = () => 0,
}) {
  const loadResults = [
    createLoadFailure(
      status,
      'lichtwaldLogStorageReadFailed',
      privateMarkers.at(-1)
    ),
    createLoadSuccess(retryLog),
  ]
  let loadResultIndex = 0
  const system = createControllerSystem({
    serviceOptions: {
      loadResult() {
        const result = loadResults[loadResultIndex] ?? loadResults.at(-1)
        loadResultIndex += 1
        return result
      },
    },
  })

  system.controller.open()

  assert.equal(system.view.lastState.phase, 'loading')
  assert.doesNotThrow(() => system.scheduler.run(0))
  assert.equal(system.serviceDouble.calls.loadLog.length, 1)
  assert.equal(getCoercionCalls(), 0)
  assert.equal(system.view.lastState.phase, 'loadError')
  assert.equal(
    system.view.lastState.errorMessage,
    'Das LichtwaldLog konnte nicht sicher geladen werden. Bitte versuche es erneut.'
  )
  assert.equal(system.view.lastState.statusMessage, '')
  assert.deepEqual(system.view.lastState.entries, [])
  assert.equal(system.view.lastState.featuredEntryId, null)
  assert.equal(system.view.lastState.selectedEntryId, null)
  assert.equal(system.view.lastState.form, null)
  assert.equal(system.view.lastState.deleteState.entryId, null)
  assert.equal(system.view.lastState.featuredState.targetEntryId, null)
  assertFeedbackIsRedacted(system.view.lastState, privateMarkers)
  assertViewModelContract(system.view.lastState)

  system.view.actions.onRetryLoad()

  assert.equal(system.view.lastState.phase, 'loading')
  assert.equal(system.view.lastState.searchQuery, '')
  assert.equal(system.view.lastState.calendarDateFilter, '')
  assert.equal(system.view.lastState.selectedTag, '')
  assert.deepEqual(system.view.lastState.availableTags, [])
  assert.deepEqual(system.view.lastState.visibleEntryIds, [])
  assert.equal(system.scheduler.scheduleCalls, 2)
  assert.equal(system.serviceDouble.calls.loadLog.length, 1)
  assert.equal(getCoercionCalls(), 0)
  system.view.actions.onRetryLoad()
  assert.equal(system.scheduler.scheduleCalls, 2)
  assert.doesNotThrow(() => system.scheduler.run(0))
  assert.equal(system.serviceDouble.calls.loadLog.length, 1)
  assert.doesNotThrow(() => system.scheduler.run(1))

  assert.equal(system.serviceDouble.calls.loadLog.length, 2)
  assert.equal(system.view.lastState.phase, expectedRetryPhase)
  assert.deepEqual(system.view.lastState.entries, retryLog.entries)
  assert.equal(system.view.lastState.featuredEntryId, retryLog.featuredEntryId)
  assert.equal(system.view.lastState.errorMessage, '')
  assert.equal(getCoercionCalls(), 0)
  assertFeedbackIsRedacted(system.view.lastState, privateMarkers)
  assertViewModelContract(system.view.lastState)
  assert.doesNotThrow(() => system.scheduler.run(1))
  assert.equal(system.serviceDouble.calls.loadLog.length, 2)
}

function assertUnsafeUpdateReferenceResultIsRejected(createUnsafeResult) {
  const targetEntry = createEntry()
  const remainingEntry = createSecondEntry()
  const updatedEntry = createEntry({
    title: 'Nicht zu übernehmender referenzgeteilter Update-Kandidat',
    text: 'Dieser vollständig erfundene Kandidat prüft Referenztrennung.',
    tags: ['Referenz', 'Update'],
  })
  const initialLog = createPrivateLog([targetEntry, remainingEntry])
  const resultLog = createPrivateLog([updatedEntry, remainingEntry])
  const unsafeResult = createUnsafeResult(resultLog, updatedEntry)
  const system = createControllerSystem({
    serviceOptions: {
      loadResult: createLoadSuccess(initialLog),
      updateResult: unsafeResult,
    },
  })
  const actions = openAndFlush(system)
  actions.onSelectEntry(targetEntry.id)
  actions.onOpenUpdateEntryForm(targetEntry.id)
  const submission = createSubmission(
    'updateEntry',
    createEntryValues(updatedEntry),
    targetEntry.id
  )

  actions.onSubmitForm(submission)

  assert.equal(system.serviceDouble.calls.updateEntry.length, 1)
  assert.equal(system.serviceDouble.calls.loadLog.length, 1)
  assert.deepEqual(system.view.lastState.entries, initialLog.entries)
  assert.equal(system.view.lastState.selectedEntryId, targetEntry.id)
  assert.equal(system.view.lastState.form.type, 'updateEntry')
  assert.equal(system.view.lastState.form.entryId, targetEntry.id)
  assert.deepEqual(system.view.lastState.form.values, {
    calendarDate: submission.calendarDate,
    title: submission.title,
    text: submission.text,
    tags: submission.tags,
  })
  assert.equal(
    system.view.lastState.form.errorMessage,
    'Der LichtwaldLog-Eintrag konnte nicht lokal aktualisiert werden. Deine Eingaben bleiben erhalten.'
  )
  assertFeedbackIsRedacted(system.view.lastState, [
    updatedEntry.id,
    updatedEntry.title,
    updatedEntry.text,
  ])
  assertDeepFrozen(system.view.lastState)
  assert.notStrictEqual(
    system.view.lastState.entries,
    unsafeResult.lichtwaldLog.entries
  )
  assert.notStrictEqual(
    system.view.lastState.entries[0],
    unsafeResult.lichtwaldLog.entries[0]
  )
  assert.notStrictEqual(
    system.view.lastState.entries[0].tags,
    unsafeResult.lichtwaldLog.entries[0].tags
  )
  const rejectedView = system.view.lastState

  unsafeResult.updatedEntry.title = 'Nachträglich mutiertes Resultat'
  unsafeResult.updatedEntry.tags[0] = 'Nachträglich mutierter Resultat-Tag'
  unsafeResult.lichtwaldLog.entries[0].text =
    'Nachträglich mutierter Snapshot-Text'
  unsafeResult.lichtwaldLog.entries[0].tags.push('Nachträglich')
  assert.throws(() => {
    rejectedView.entries[0].title = 'Unzulässige View-Mutation'
  }, TypeError)
  actions.onUpdateFormField('title', submission.title)

  assert.deepEqual(system.view.lastState.entries, initialLog.entries)
  assert.deepEqual(system.view.lastState.form.values, {
    calendarDate: submission.calendarDate,
    title: submission.title,
    text: submission.text,
    tags: submission.tags,
  })
  assert.equal(
    getFeedbackText(system.view.lastState).includes(
      unsafeResult.updatedEntry.title
    ),
    false
  )
  assertDeepFrozen(system.view.lastState)
}

test('stellt exakt die eingefrorene Controller- und Action-API bereit und lädt erst nach dem Scheduler-Callback', () => {
  const firstEntry = createEntry({
    tags: ['Zeta', 'Alpha', 'Omega'],
  })
  const secondEntry = createSecondEntry({
    tags: ['Drei', 'Eins', 'Zwei'],
  })
  const initialLog = createPrivateLog([firstEntry, secondEntry], {
    featuredEntryId: secondEntry.id,
  })
  const system = createControllerSystem({
    serviceOptions: { loadResult: createLoadSuccess(initialLog) },
  })

  assertExactOwnKeys(system.controller, CONTROLLER_METHOD_NAMES)
  assert.equal(Object.isFrozen(system.controller), true)

  system.controller.open()

  assert.equal(system.serviceDouble.calls.loadLog.length, 0)
  assert.equal(system.scheduler.scheduleCalls, 1)
  assert.equal(system.view.renders.length, 1)
  assert.equal(system.view.lastState.phase, 'loading')
  assert.deepEqual(system.view.lastState.visibleEntryIds, [])
  assert.deepEqual(system.view.lastState.availableTags, [])
  assert.equal(system.view.lastState.searchQuery, '')
  assert.equal(system.view.lastState.calendarDateFilter, '')
  assert.equal(system.view.lastState.selectedTag, '')
  assert.equal(system.view.lastState.hasActiveFilters, false)
  assert.equal(system.view.lastState.filteredEmptyState, false)
  assertViewModelContract(system.view.lastState)
  assertExactOwnKeys(system.view.actions, ACTION_METHOD_NAMES)
  assert.equal(Object.isFrozen(system.view.actions), true)
  const actionsReference = system.view.actions

  system.controller.open()

  assert.equal(system.scheduler.scheduleCalls, 1)
  assert.equal(system.view.renders.length, 1)

  system.scheduler.run(0)

  assert.equal(system.serviceDouble.calls.loadLog.length, 1)
  assert.equal(system.view.lastState.phase, 'ready')
  assert.equal(system.view.lastState.selectedEntryId, null)
  assert.equal(system.view.lastState.featuredEntryId, secondEntry.id)
  assert.deepEqual(getEntryIds(system.view.lastState), [
    firstEntry.id,
    secondEntry.id,
  ])
  assert.deepEqual(system.view.lastState.visibleEntryIds, [
    firstEntry.id,
    secondEntry.id,
  ])
  assert.deepEqual(system.view.lastState.availableTags, [
    'Zeta',
    'Alpha',
    'Omega',
    'Drei',
    'Eins',
    'Zwei',
  ])
  assert.deepEqual(system.view.lastState.entries[0].tags, [
    'Zeta',
    'Alpha',
    'Omega',
  ])
  assert.deepEqual(system.view.lastState.entries[1].tags, [
    'Drei',
    'Eins',
    'Zwei',
  ])
  assert.strictEqual(system.view.actions, actionsReference)
  assertViewModelContract(system.view.lastState)
})

test('unterscheidet fehlenden und absichtlich gespeicherten leeren Privatbestand ohne Auswahl', () => {
  for (const status of ['empty', 'loaded']) {
    const emptyLog = createEmptyPrivateLog()
    const system = createControllerSystem({
      serviceOptions: {
        loadResult: createLoadSuccess(emptyLog, status),
      },
    })

    openAndFlush(system)

    assert.equal(system.view.lastState.phase, 'empty')
    assert.deepEqual(system.view.lastState.entries, [])
    assert.equal(system.view.lastState.featuredEntryId, null)
    assert.equal(system.view.lastState.selectedEntryId, null)
    assert.equal(system.view.lastState.form, null)
    assert.equal(system.view.lastState.deleteState.entryId, null)
    assert.deepEqual(system.view.lastState.visibleEntryIds, [])
    assert.deepEqual(system.view.lastState.availableTags, [])
    assert.equal(system.view.lastState.searchQuery, '')
    assert.equal(system.view.lastState.calendarDateFilter, '')
    assert.equal(system.view.lastState.selectedTag, '')
    assert.equal(system.view.lastState.hasActiveFilters, false)
    assert.equal(system.view.lastState.filteredEmptyState, false)
    assertViewModelContract(system.view.lastState)
  }
})

test('akzeptiert tief eingefrorene und null-prototypische private Load-Erfolge', () => {
  const nullPrototypeLog = Object.assign(
    Object.create(null),
    createPrivateLog()
  )
  const nullPrototypeResult = Object.assign(
    Object.create(null),
    createLoadSuccess(nullPrototypeLog)
  )

  for (const loadResult of [
    deepFreeze(createLoadSuccess(createPrivateLog())),
    nullPrototypeResult,
  ]) {
    const system = createControllerSystem({
      serviceOptions: { loadResult },
    })

    assert.doesNotThrow(() => openAndFlush(system))
    assert.equal(system.view.lastState.phase, 'ready')
    assert.deepEqual(getEntryIds(system.view.lastState), [
      createEntry().id,
      createSecondEntry().id,
    ])
    assertViewModelContract(system.view.lastState)
  }
})

test('retryt einen redigierten Loadfehler genau einmal und ignoriert alte sowie doppelte Callbacks', () => {
  const privateMarker = 'fixture-load-retry-private-sentinel'
  const successfulLog = createPrivateLog()
  let resultIndex = 0
  const results = [
    createLoadFailure(
      'readFailed',
      'lichtwaldLogStorageReadFailed',
      privateMarker
    ),
    createLoadSuccess(successfulLog),
  ]
  const system = createControllerSystem({
    serviceOptions: {
      loadResult() {
        const result = results[resultIndex] ?? results.at(-1)
        resultIndex += 1
        return result
      },
    },
  })

  system.controller.open()
  system.scheduler.run(0)

  assert.equal(system.view.lastState.phase, 'loadError')
  assert.equal(system.serviceDouble.calls.loadLog.length, 1)
  assertFeedbackIsRedacted(system.view.lastState, [privateMarker])

  system.scheduler.run(0)
  assert.equal(system.serviceDouble.calls.loadLog.length, 1)

  system.view.actions.onRetryLoad()

  assert.equal(system.view.lastState.phase, 'loading')
  assert.equal(system.scheduler.scheduleCalls, 2)
  system.view.actions.onRetryLoad()
  assert.equal(system.scheduler.scheduleCalls, 2)

  system.scheduler.run(0)
  assert.equal(system.serviceDouble.calls.loadLog.length, 1)

  system.scheduler.run(1)

  assert.equal(system.serviceDouble.calls.loadLog.length, 2)
  assert.equal(system.view.lastState.phase, 'ready')
  assert.deepEqual(system.view.lastState.visibleEntryIds, successfulLog.entries.map(
    ({ id }) => id
  ))
  system.scheduler.run(1)
  assert.equal(system.serviceDouble.calls.loadLog.length, 2)
})

test('weist einen Symbol-Loadstatus ohne Coercion zurück und retryt erfolgreich zu ready', () => {
  const statusMarker = 'synthetic-private-marker'
  const privateErrorMarker = 'fixture-symbol-load-error-sentinel'
  const status = Symbol(statusMarker)
  const retryLog = createPrivateLog([
    createEntry({
      id: 'lichtwald-entry-symbol-retry-3',
      title: 'Synthetischer Retry nach Symbol-Status',
    }),
  ])

  assert.equal(typeof status, 'symbol')
  assertNonStringLoadStatusIsRejectedAndRetryable({
    status,
    retryLog,
    expectedRetryPhase: 'ready',
    privateMarkers: [statusMarker, privateErrorMarker],
  })
})

test('konvertiert einen werfenden Loadstatus nie und retryt erfolgreich zu empty', () => {
  const statusMarker = 'fixture-hostile-load-status-sentinel'
  const coercionErrorMarker = 'fixture-status-coercion-error-sentinel'
  const privateErrorMarker = 'fixture-object-load-error-sentinel'
  let coercionCalls = 0
  const status = Object.freeze({
    privateMarker: statusMarker,
    [Symbol.toPrimitive]() {
      coercionCalls += 1
      throw new Error(coercionErrorMarker)
    },
  })

  assertNonStringLoadStatusIsRejectedAndRetryable({
    status,
    retryLog: createEmptyPrivateLog(),
    expectedRetryPhase: 'empty',
    privateMarkers: [
      statusMarker,
      coercionErrorMarker,
      privateErrorMarker,
    ],
    getCoercionCalls: () => coercionCalls,
  })
})

test('invalidiert wirkungslos gecancelte Callbacks über Close und einen neuen Open-Lifecycle', () => {
  const scheduler = createManualScheduler({ effectiveCancel: false })
  const system = createControllerSystem({ scheduler })

  system.controller.open()
  const firstLifecycleRenderCount = system.view.renders.length

  assert.equal(system.controller.close(), true)
  assert.equal(system.view.unmountCalls, 1)
  assert.equal(system.controller.close(), true)
  assert.equal(system.view.unmountCalls, 1)

  scheduler.run(0)
  assert.equal(system.serviceDouble.calls.loadLog.length, 0)
  assert.equal(system.view.renders.length, firstLifecycleRenderCount)

  system.controller.open()
  assert.equal(scheduler.scheduleCalls, 2)
  assert.equal(system.view.lastState.searchQuery, '')
  assert.deepEqual(system.view.lastState.visibleEntryIds, [])
  scheduler.run(0)
  assert.equal(system.serviceDouble.calls.loadLog.length, 0)
  assert.equal(system.view.lastState.searchQuery, '')
  assert.deepEqual(system.view.lastState.visibleEntryIds, [])
  scheduler.run(1)
  assert.equal(system.serviceDouble.calls.loadLog.length, 1)
  assert.equal(system.view.lastState.phase, 'ready')
  assert.deepEqual(system.view.lastState.visibleEntryIds, [
    createEntry().id,
    createSecondEntry().id,
  ])

  assert.equal(system.controller.close(), true)
  assert.equal(system.view.unmountCalls, 2)
})

test('übernimmt nach einem reentranten Close während loadLog kein veraltetes Ergebnis', () => {
  let controller
  let closeResult
  const view = createViewRecorder()
  const scheduler = createManualScheduler()
  const serviceDouble = createServiceDouble({
    loadResult() {
      closeResult = controller.close()
      return createLoadSuccess(createPrivateLog())
    },
  })
  controller = createLichtwaldLogController({
    lichtwaldLogService: serviceDouble.service,
    lichtwaldLogView: view,
    scheduleTask: scheduler.scheduleTask,
  })

  controller.open()
  scheduler.run(0)

  assert.equal(closeResult, true)
  assert.equal(serviceDouble.calls.loadLog.length, 1)
  assert.equal(view.renders.length, 1)
  assert.equal(view.lastState.phase, 'loading')
  assert.equal(view.unmountCalls, 1)
})

test('fängt fehlende, ungeeignete, getterbasierte und werfende View- sowie Scheduler-Ports ab', () => {
  const serviceDouble = createServiceDouble()
  const missingViewScheduler = createManualScheduler()
  const missingViewController = createLichtwaldLogController({
    lichtwaldLogService: serviceDouble.service,
    lichtwaldLogView: {},
    scheduleTask: missingViewScheduler.scheduleTask,
  })

  assert.doesNotThrow(() => {
    missingViewController.open()
    missingViewScheduler.run(0)
    missingViewController.close()
  })
  assert.equal(serviceDouble.calls.loadLog.length, 1)

  const getterView = {}
  Object.defineProperty(getterView, 'render', {
    configurable: true,
    get() {
      throw new Error('fixture-view-getter-exception-sentinel')
    },
  })
  Object.defineProperty(getterView, 'unmount', {
    configurable: true,
    get() {
      throw new Error('fixture-unmount-getter-exception-sentinel')
    },
  })
  const getterScheduler = createManualScheduler()
  const getterController = createLichtwaldLogController({
    lichtwaldLogService: serviceDouble.service,
    lichtwaldLogView: getterView,
    scheduleTask: getterScheduler.scheduleTask,
  })

  assert.doesNotThrow(() => {
    getterController.open()
    getterScheduler.run(0)
    getterController.close()
  })

  const throwingView = createViewRecorder({
    renderHook() {
      throw new Error('fixture-view-render-exception-sentinel')
    },
    throwOnUnmount: true,
  })
  const throwingViewScheduler = createManualScheduler()
  const throwingViewController = createLichtwaldLogController({
    lichtwaldLogService: serviceDouble.service,
    lichtwaldLogView: throwingView,
    scheduleTask: throwingViewScheduler.scheduleTask,
  })

  assert.doesNotThrow(() => {
    throwingViewController.open()
    throwingViewScheduler.run(0)
    throwingViewController.close()
  })

  const privateSchedulerMarker = 'fixture-scheduler-exception-sentinel'
  const retryScheduler = createManualScheduler()
  let scheduleAttempts = 0
  const throwingSchedulerSystem = createControllerSystem({
    scheduler: {
      scheduleTask(task) {
        scheduleAttempts += 1

        if (scheduleAttempts === 1) {
          throw new Error(privateSchedulerMarker)
        }

        return retryScheduler.scheduleTask(task)
      },
    },
  })
  assert.doesNotThrow(() => throwingSchedulerSystem.controller.open())
  assert.equal(throwingSchedulerSystem.serviceDouble.calls.loadLog.length, 0)
  assert.equal(throwingSchedulerSystem.view.lastState.phase, 'loadError')
  assert.equal(
    throwingSchedulerSystem.view.lastState.errorMessage,
    'Das LichtwaldLog konnte nicht sicher geladen werden. Bitte versuche es erneut.'
  )
  assertFeedbackIsRedacted(throwingSchedulerSystem.view.lastState, [
    privateSchedulerMarker,
  ])

  throwingSchedulerSystem.view.actions.onRetryLoad()

  assert.equal(throwingSchedulerSystem.view.lastState.phase, 'loading')
  assert.equal(scheduleAttempts, 2)
  retryScheduler.run(0)
  assert.equal(throwingSchedulerSystem.serviceDouble.calls.loadLog.length, 1)
  assert.equal(throwingSchedulerSystem.view.lastState.phase, 'ready')

  const throwingCancelSystem = createControllerSystem({
    scheduler: createManualScheduler({ throwOnCancel: true }),
  })
  throwingCancelSystem.controller.open()
  assert.doesNotThrow(() => throwingCancelSystem.controller.close())
})

test('normalisiert fehlende oder werfende loadLog-Methoden in statische Loadfehler', () => {
  const privateMarker = 'fixture-load-method-exception-sentinel'
  const services = [{}]
  const throwingGetterService = {}
  Object.defineProperty(throwingGetterService, 'loadLog', {
    configurable: true,
    get() {
      throw new Error(privateMarker)
    },
  })
  services.push(throwingGetterService, {
    loadLog() {
      throw new Error(privateMarker)
    },
  })

  for (const service of services) {
    const scheduler = createManualScheduler()
    const view = createViewRecorder()
    const controller = createLichtwaldLogController({
      lichtwaldLogService: service,
      lichtwaldLogView: view,
      scheduleTask: scheduler.scheduleTask,
    })

    assert.doesNotThrow(() => {
      controller.open()
      scheduler.run(0)
    })
    assert.equal(view.lastState.phase, 'loadError')
    assertFeedbackIsRedacted(view.lastState, [privateMarker])
  }
})

test('weist malformed, widersprüchliche, asynchrone und nicht-private Load-Ergebnisse redigiert zurück', () => {
  const privateMarker = 'fixture-malformed-load-result-sentinel'
  const getterResult = {
    status: 'loaded',
    initialized: false,
    lichtwaldLog: createPrivateLog(),
  }
  let okGetterCalls = 0
  Object.defineProperty(getterResult, 'ok', {
    enumerable: true,
    get() {
      okGetterCalls += 1
      throw new Error(privateMarker)
    },
  })
  const thenable = createLoadSuccess(createPrivateLog())
  let thenGetterCalls = 0
  Object.defineProperty(thenable, 'then', {
    enumerable: true,
    get() {
      thenGetterCalls += 1
      throw new Error(privateMarker)
    },
  })
  const symbolResult = createLoadSuccess(createPrivateLog())
  symbolResult[Symbol(privateMarker)] = privateMarker
  const customPrototypeResult = Object.assign(
    Object.create({ inheritedFixture: privateMarker }),
    createLoadSuccess(createPrivateLog())
  )
  const extraResult = {
    ...createLoadSuccess(createPrivateLog()),
    fixtureExtra: privateMarker,
  }
  const missingResult = createLoadSuccess(createPrivateLog())
  delete missingResult.initialized
  const invalidLog = createPrivateLog()
  invalidLog.entries[0].fixtureExtra = privateMarker
  const contradictoryEmpty = createLoadSuccess(
    createPrivateLog(),
    'empty'
  )
  const revoked = Proxy.revocable(
    createLoadSuccess(createPrivateLog()),
    {}
  )
  revoked.revoke()
  const malformedResults = [
    null,
    false,
    'loaded',
    [],
    Promise.resolve(createLoadSuccess(createPrivateLog())),
    thenable,
    getterResult,
    symbolResult,
    customPrototypeResult,
    extraResult,
    missingResult,
    createLoadSuccess(createSyntheticLog()),
    createLoadSuccess(invalidLog),
    contradictoryEmpty,
    {
      ok: true,
      status: 'empty',
      initialized: true,
      lichtwaldLog: createEmptyPrivateLog(),
    },
    revoked.proxy,
    new Proxy(createLoadSuccess(createPrivateLog()), {
      ownKeys() {
        throw new Error(privateMarker)
      },
    }),
    createLoadFailure('readFailed', 'unknownPrivateCode', privateMarker),
  ]

  for (const loadResult of malformedResults) {
    const system = createControllerSystem({
      serviceOptions: { loadResult },
    })

    assert.doesNotThrow(() => openAndFlush(system))
    assert.equal(system.view.lastState.phase, 'loadError')
    assert.deepEqual(system.view.lastState.entries, [])
    assertFeedbackIsRedacted(system.view.lastState, [privateMarker])
  }

  assert.equal(okGetterCalls, 0)
  assert.equal(thenGetterCalls, 0)
})

test('leitet lokale Suche, Datum und Tag per AND aus dem vollständigen Snapshot ab', () => {
  const firstEntry = createEntry({
    id: 'lichtwald-entry-filter-aurora-1',
    calendarDate: '2048-02-29',
    title: 'Erfundene Aurora-Karte',
    text: 'Ein vollständig synthetischer Kupferpfad.',
    tags: ['WÄLDCHEN', 'Gemeinsam'],
  })
  const secondEntry = createSecondEntry({
    id: 'lichtwald-entry-filter-aurora-2',
    calendarDate: '2048-02-29',
    title: 'Erfundene zweite Karte',
    text: 'Eine synthetische aurora erscheint im Text.',
    tags: ['Andere', 'gemeinsam'],
  })
  const thirdEntry = createEntry({
    id: 'lichtwald-entry-filter-aurora-3',
    calendarDate: '2048-03-01',
    title: 'AURORA im dritten Titel',
    text: 'Dritter frei erfundener Inhalt.',
    tags: ['Wa\u0308ldchen'],
  })
  const entries = [firstEntry, secondEntry, thirdEntry]
  const system = createControllerSystem({
    serviceOptions: {
      loadResult: createLoadSuccess(createPrivateLog(entries)),
    },
  })
  const actions = openAndFlush(system)
  const scheduleCalls = system.scheduler.scheduleCalls

  assert.deepEqual(system.view.lastState.entries, entries)
  assert.deepEqual(system.view.lastState.visibleEntryIds, entries.map(
    ({ id }) => id
  ))
  assert.deepEqual(system.view.lastState.availableTags, [
    'WÄLDCHEN',
    'Gemeinsam',
    'Andere',
  ])

  actions.onChangeSearchQuery('  aUrOrA  ')
  assert.equal(system.view.lastState.searchQuery, '  aUrOrA  ')
  assert.deepEqual(system.view.lastState.visibleEntryIds, entries.map(
    ({ id }) => id
  ))
  assert.equal(system.view.lastState.hasActiveFilters, true)
  assert.deepEqual(system.view.lastState.focusTarget, {
    type: 'searchInput',
  })

  actions.onChangeCalendarDateFilter('2048-02-29')
  assert.deepEqual(system.view.lastState.visibleEntryIds, [
    firstEntry.id,
    secondEntry.id,
  ])
  assert.deepEqual(system.view.lastState.focusTarget, {
    type: 'calendarDateFilter',
  })

  actions.onChangeTagFilter('WÄLDCHEN')
  assert.deepEqual(system.view.lastState.visibleEntryIds, [firstEntry.id])
  assert.equal(system.view.lastState.selectedTag, 'WÄLDCHEN')
  assert.equal(system.view.lastState.filteredEmptyState, false)
  assert.deepEqual(system.view.lastState.focusTarget, { type: 'tagFilter' })
  assert.deepEqual(system.view.lastState.entries, entries)

  actions.onResetFilters()
  assert.equal(system.view.lastState.searchQuery, '')
  assert.equal(system.view.lastState.calendarDateFilter, '')
  assert.equal(system.view.lastState.selectedTag, '')
  assert.equal(system.view.lastState.hasActiveFilters, false)
  assert.equal(system.view.lastState.filteredEmptyState, false)
  assert.deepEqual(system.view.lastState.visibleEntryIds, entries.map(
    ({ id }) => id
  ))
  assert.deepEqual(system.view.lastState.focusTarget, {
    type: 'searchInput',
  })

  actions.onChangeSearchQuery(' \t\n ')
  assert.equal(system.view.lastState.searchQuery, ' \t\n ')
  assert.equal(system.view.lastState.hasActiveFilters, false)
  assert.deepEqual(system.view.lastState.visibleEntryIds, entries.map(
    ({ id }) => id
  ))
  actions.onResetFilters()
  assert.equal(system.view.lastState.searchQuery, '')

  assert.equal(system.scheduler.scheduleCalls, scheduleCalls)
  assert.equal(system.serviceDouble.calls.loadLog.length, 1)
  assertNoMutationCalls(system.serviceDouble)
})

test('akzeptiert exakt 200 Query-Codeeinheiten und verwirft ungeeignete Filterwerte vollständig', () => {
  const system = createControllerSystem()
  const actions = openAndFlush(system)
  const acceptedQuery = 'x'.repeat(200)
  const scheduleCalls = system.scheduler.scheduleCalls

  actions.onChangeSearchQuery(acceptedQuery)
  assert.equal(system.view.lastState.searchQuery, acceptedQuery)
  assert.equal(system.view.lastState.phase, 'ready')
  assert.equal(system.view.lastState.filteredEmptyState, true)

  let renderCount = system.view.renders.length
  const acceptedState = system.view.lastState
  actions.onChangeSearchQuery('x'.repeat(201))
  assert.equal(system.view.renders.length, renderCount)
  assert.strictEqual(system.view.lastState, acceptedState)

  actions.onResetFilters()
  const hostileValue = {
    toString() {
      throw new Error('fixture-filter-coercion-sentinel')
    },
  }

  for (const invalidQuery of [null, undefined, false, 17, Symbol('query'), hostileValue]) {
    renderCount = system.view.renders.length
    assert.doesNotThrow(() => actions.onChangeSearchQuery(invalidQuery))
    assert.equal(system.view.renders.length, renderCount)
    assert.equal(system.view.lastState.searchQuery, '')
  }

  for (const invalidDate of [
    '2047-02-29',
    '0000-01-01',
    '2048-2-29',
    ' 2048-02-29 ',
    null,
    new Date('2048-02-29T00:00:00.000Z'),
    hostileValue,
  ]) {
    renderCount = system.view.renders.length
    assert.doesNotThrow(() =>
      actions.onChangeCalendarDateFilter(invalidDate)
    )
    assert.equal(system.view.renders.length, renderCount)
    assert.equal(system.view.lastState.calendarDateFilter, '')
  }

  for (const invalidTag of [
    'prisma',
    'Prisma ',
    'Unbekannt',
    null,
    false,
    hostileValue,
  ]) {
    renderCount = system.view.renders.length
    assert.doesNotThrow(() => actions.onChangeTagFilter(invalidTag))
    assert.equal(system.view.renders.length, renderCount)
    assert.equal(system.view.lastState.selectedTag, '')
  }

  actions.onChangeCalendarDateFilter('2048-02-29')
  assert.equal(system.view.lastState.calendarDateFilter, '2048-02-29')
  actions.onChangeCalendarDateFilter('')
  actions.onChangeTagFilter('Prisma')
  assert.equal(system.view.lastState.selectedTag, 'Prisma')

  renderCount = system.view.renders.length
  actions.onChangeTagFilter('prisma')
  assert.equal(system.view.renders.length, renderCount)
  assert.equal(system.view.lastState.selectedTag, 'Prisma')

  assert.equal(system.scheduler.scheduleCalls, scheduleCalls)
  assert.equal(system.serviceDouble.calls.loadLog.length, 1)
  assertNoMutationCalls(system.serviceDouble)
})

test('beschränkt Overview-Auswahl auf sichtbare IDs und bewahrt Filter durch Detail und Formulare', () => {
  const firstEntry = createEntry({
    title: 'Synthetischer sichtbarer Nebeltreffer',
  })
  const secondEntry = createSecondEntry({
    title: 'Synthetische verborgene Sonnenkarte',
  })
  const system = createControllerSystem({
    serviceOptions: {
      loadResult: createLoadSuccess(
        createPrivateLog([firstEntry, secondEntry])
      ),
    },
  })
  const actions = openAndFlush(system)

  actions.onChangeSearchQuery('Nebeltreffer')
  assert.deepEqual(system.view.lastState.visibleEntryIds, [firstEntry.id])

  let renderCount = system.view.renders.length
  actions.onSelectEntry(secondEntry.id)
  assert.equal(system.view.renders.length, renderCount)
  assert.equal(system.view.lastState.selectedEntryId, null)

  actions.onSelectEntry(firstEntry.id)
  assert.equal(system.view.lastState.selectedEntryId, firstEntry.id)
  assert.equal(system.view.lastState.searchQuery, 'Nebeltreffer')

  renderCount = system.view.renders.length
  actions.onSelectEntry(secondEntry.id)
  assert.equal(system.view.renders.length, renderCount)
  assert.equal(system.view.lastState.selectedEntryId, firstEntry.id)

  actions.onOpenUpdateEntryForm(firstEntry.id)
  assert.equal(system.view.lastState.form.type, 'updateEntry')
  assert.equal(system.view.lastState.searchQuery, 'Nebeltreffer')
  actions.onCancelForm()
  assert.equal(system.view.lastState.selectedEntryId, firstEntry.id)
  assert.equal(system.view.lastState.searchQuery, 'Nebeltreffer')
  actions.onBackToOverview()

  actions.onOpenCreateEntryForm()
  assert.equal(system.view.lastState.form.type, 'createEntry')
  assert.equal(system.view.lastState.searchQuery, 'Nebeltreffer')
  actions.onCancelForm()
  assert.equal(system.view.lastState.searchQuery, 'Nebeltreffer')
  assert.deepEqual(system.view.lastState.visibleEntryIds, [firstEntry.id])
  assert.equal(system.serviceDouble.calls.loadLog.length, 1)
  assertNoMutationCalls(system.serviceDouble)
})

test('verwaltet Auswahl exakt case-sensitive und blockiert konkurrierende Auswahlwechsel', () => {
  const firstEntry = createEntry()
  const secondEntry = createSecondEntry()
  const system = createControllerSystem({
    serviceOptions: {
      loadResult: createLoadSuccess(
        createPrivateLog([firstEntry, secondEntry])
      ),
    },
  })
  const actions = openAndFlush(system)

  for (const invalidId of [
    'unknown-entry',
    firstEntry.id.toUpperCase(),
    ' ' + firstEntry.id,
    firstEntry.id + ' ',
    null,
    undefined,
  ]) {
    const renderCount = system.view.renders.length
    actions.onSelectEntry(invalidId)
    assert.equal(system.view.renders.length, renderCount)
    assert.equal(system.view.lastState.selectedEntryId, null)
  }

  actions.onSelectEntry(firstEntry.id)
  assert.equal(system.view.lastState.selectedEntryId, firstEntry.id)
  assertNoMutationCalls(system.serviceDouble)

  actions.onOpenUpdateEntryForm(firstEntry.id)
  const formState = system.view.lastState.form
  actions.onSelectEntry(secondEntry.id)
  assert.equal(system.view.lastState.selectedEntryId, firstEntry.id)
  assert.deepEqual(system.view.lastState.form, formState)

  actions.onCancelForm()
  actions.onRequestDeleteEntry(firstEntry.id)
  actions.onSelectEntry(secondEntry.id)
  assert.equal(system.view.lastState.selectedEntryId, firstEntry.id)
  assert.equal(system.view.lastState.deleteState.entryId, firstEntry.id)

  actions.onCancelDeleteEntry()
  actions.onBackToOverview()
  assert.equal(system.view.lastState.selectedEntryId, null)
  assertNoMutationCalls(system.serviceDouble)
  assert.equal(system.serviceDouble.calls.loadLog.length, 1)
})

test('öffnet Create mit exakten Leerwerten und ändert alle Felder ohne fachliche Normalisierung', () => {
  const system = createControllerSystem()
  const actions = openAndFlush(system)

  actions.onOpenCreateEntryForm()

  assert.deepEqual(system.view.lastState.form, {
    type: 'createEntry',
    entryId: null,
    values: {
      calendarDate: '',
      title: '',
      text: '',
      tags: [],
    },
    fieldErrors: {},
    errorMessage: '',
    isSubmitting: false,
    isDirty: false,
  })
  assertViewModelContract(system.view.lastState)

  const tags = deepFreeze(['Beta', 'Alpha', 'Beta'])
  const fieldValues = {
    calendarDate: ' 2038-09-07 ',
    title: '  Ungetrimmter Fantasietitel  ',
    text: '  Zeile eins\nZeile zwei  ',
    tags,
  }

  for (const [fieldName, fieldValue] of Object.entries(fieldValues)) {
    actions.onUpdateFormField(fieldName, fieldValue)
  }

  assert.deepEqual(system.view.lastState.form.values, fieldValues)
  assert.equal(system.view.lastState.form.isDirty, true)
  assert.notStrictEqual(system.view.lastState.form.values.tags, tags)
  assert.deepEqual(tags, ['Beta', 'Alpha', 'Beta'])
  assertNoMutationCalls(system.serviceDouble)
})

test('öffnet Update nur für eine exakte vorhandene ID und klont gespeicherte Werte defensiv', () => {
  const firstEntry = createEntry()
  const firstEntrySnapshot = structuredClone(firstEntry)
  const initialLog = createPrivateLog([firstEntry, createSecondEntry()])
  const system = createControllerSystem({
    serviceOptions: {
      loadResult: createLoadSuccess(initialLog),
    },
  })
  const actions = openAndFlush(system)

  for (const invalidId of [
    'missing',
    firstEntry.id.toUpperCase(),
    ' ' + firstEntry.id,
  ]) {
    const renderCount = system.view.renders.length
    actions.onOpenUpdateEntryForm(invalidId)
    assert.equal(system.view.renders.length, renderCount)
    assert.equal(system.view.lastState.form, null)
  }

  actions.onSelectEntry(firstEntry.id)
  actions.onOpenUpdateEntryForm(firstEntry.id)

  assert.equal(system.view.lastState.form.type, 'updateEntry')
  assert.equal(system.view.lastState.form.entryId, firstEntry.id)
  assert.deepEqual(
    system.view.lastState.form.values,
    createEntryValues(firstEntry)
  )
  assert.notStrictEqual(
    system.view.lastState.form.values,
    system.view.lastState.entries[0]
  )
  assert.notStrictEqual(
    system.view.lastState.form.values.tags,
    system.view.lastState.entries[0].tags
  )

  initialLog.entries[0].title = 'Nachträglich mutierter Dependency-Titel'
  initialLog.entries[0].tags[0] = 'Nachträglich mutierter Tag'

  assert.equal(
    system.view.lastState.entries[0].title,
    firstEntrySnapshot.title
  )
  assert.equal(
    system.view.lastState.form.values.title,
    firstEntrySnapshot.title
  )
  assert.deepEqual(
    system.view.lastState.form.values.tags,
    firstEntrySnapshot.tags
  )
  assertViewModelContract(system.view.lastState)
})

test('weist unsichere Formfeldnamen und Tag-Arrays kontrolliert ohne Draftmutation zurück', () => {
  const system = createControllerSystem()
  const actions = openAndFlush(system)
  actions.onOpenCreateEntryForm()
  actions.onUpdateFormField('title', 'Bewahrter synthetischer Entwurf')
  const expectedValues = structuredClone(system.view.lastState.form.values)

  const sparseTags = ['Eins']
  sparseTags.length = 2
  const tagsWithExtraProperty = ['Eins']
  tagsWithExtraProperty.fixtureExtra = 'fixture-tag-extra-sentinel'
  const tagsWithSymbol = ['Eins']
  tagsWithSymbol[Symbol('fixture-tag-symbol-sentinel')] = 'Zusatz'
  const customPrototypeTags = ['Eins']
  Object.setPrototypeOf(
    customPrototypeTags,
    Object.create(Array.prototype)
  )
  let tagGetterCalls = 0
  const accessorTags = ['Eins']
  Object.defineProperty(accessorTags, 0, {
    configurable: true,
    enumerable: true,
    get() {
      tagGetterCalls += 1
      throw new Error('fixture-tag-getter-sentinel')
    },
  })
  const revokedTags = Proxy.revocable(['Eins'], {})
  revokedTags.revoke()

  const invalidUpdates = [
    ['unknownField', 'Wert'],
    ['calendarDate', 20380907],
    ['title', null],
    ['text', {}],
    ['tags', 'Eins,Zwei'],
    ['tags', sparseTags],
    ['tags', tagsWithExtraProperty],
    ['tags', tagsWithSymbol],
    ['tags', customPrototypeTags],
    ['tags', accessorTags],
    ['tags', revokedTags.proxy],
  ]

  for (const [fieldName, fieldValue] of invalidUpdates) {
    assert.doesNotThrow(() => {
      actions.onUpdateFormField(fieldName, fieldValue)
    })
    assert.deepEqual(system.view.lastState.form.values, expectedValues)
  }

  assert.equal(tagGetterCalls, 0)
  assertNoMutationCalls(system.serviceDouble)
})

test('verwirft ein Formular explizit schreibfrei und blockiert Close nur bei fachlich geändertem Draft', () => {
  const unchangedSystem = createControllerSystem()
  const unchangedActions = openAndFlush(unchangedSystem)
  unchangedActions.onOpenCreateEntryForm()

  assert.equal(unchangedSystem.controller.close(), true)
  assert.equal(unchangedSystem.view.unmountCalls, 1)
  assertNoMutationCalls(unchangedSystem.serviceDouble)

  const dirtySystem = createControllerSystem()
  const dirtyActions = openAndFlush(dirtySystem)
  dirtyActions.onOpenCreateEntryForm()
  dirtyActions.onUpdateFormField(
    'text',
    'Vollständig erfundener, noch nicht gespeicherter Draft.'
  )
  const valuesBeforeClose = structuredClone(
    dirtySystem.view.lastState.form.values
  )

  assert.equal(dirtySystem.controller.close(), false)
  assert.equal(dirtySystem.view.unmountCalls, 0)
  assert.deepEqual(dirtySystem.view.lastState.form.values, valuesBeforeClose)
  assert.notEqual(dirtySystem.view.lastState.form.errorMessage, '')
  assertFeedbackIsRedacted(dirtySystem.view.lastState, [
    valuesBeforeClose.text,
  ])

  dirtyActions.onCancelForm()
  assert.equal(dirtySystem.view.lastState.form, null)
  assert.equal(dirtySystem.controller.close(), true)
  assert.equal(dirtySystem.view.unmountCalls, 1)
  assertNoMutationCalls(dirtySystem.serviceDouble)
})

test('bewahrt einen Dirty-Draft gegen Cancel und Close aus dem Close-Feedback-Render', () => {
  let system
  let feedbackHookArmed = false
  let feedbackHookCalls = 0
  let reentrantCloseResult
  const view = createViewRecorder({
    renderHook(viewModel, actions) {
      if (
        !feedbackHookArmed ||
        feedbackHookCalls > 0 ||
        !viewModel.form?.isDirty ||
        viewModel.form.errorMessage === ''
      ) {
        return
      }

      feedbackHookCalls += 1
      actions.onCancelForm()
      reentrantCloseResult = system.controller.close()
    },
  })
  system = createControllerSystem({ view })
  const actions = openAndFlush(system)
  actions.onOpenCreateEntryForm()
  actions.onUpdateFormField('calendarDate', '2043-07-09')
  actions.onUpdateFormField('title', 'Erfundener Dirty-Close-Draft')
  actions.onUpdateFormField(
    'text',
    'Dieser synthetische Draft muss vollständig aktiv erhalten bleiben.'
  )
  actions.onUpdateFormField('tags', ['Reentranz', 'Draft'])
  const draftBeforeClose = structuredClone(system.view.lastState.form)
  const renderCountBeforeClose = system.view.renders.length
  const scheduleCallsBeforeClose = system.scheduler.scheduleCalls
  feedbackHookArmed = true

  const outerCloseResult = system.controller.close()

  assert.equal(outerCloseResult, false)
  assert.equal(reentrantCloseResult, false)
  assert.equal(feedbackHookCalls, 1)
  assert.equal(system.view.unmountCalls, 0)
  assert.equal(system.view.renders.length, renderCountBeforeClose + 1)
  assert.equal(system.view.lastState.form.type, draftBeforeClose.type)
  assert.equal(system.view.lastState.form.entryId, draftBeforeClose.entryId)
  assert.deepEqual(
    system.view.lastState.form.values,
    draftBeforeClose.values
  )
  assert.deepEqual(
    system.view.lastState.form.fieldErrors,
    draftBeforeClose.fieldErrors
  )
  assert.equal(system.view.lastState.form.isDirty, true)
  assert.equal(system.view.lastState.form.isSubmitting, false)
  assert.notEqual(system.view.lastState.form.errorMessage, '')
  assertNoMutationCalls(system.serviceDouble)

  system.controller.open()
  assert.equal(system.scheduler.scheduleCalls, scheduleCallsBeforeClose)
  assert.equal(system.serviceDouble.calls.loadLog.length, 1)
  assert.equal(system.view.unmountCalls, 0)
})

test('verwirft eine reine Delete-Bestätigung beim Close und setzt transiente Zustände beim Reopen zurück', () => {
  const system = createControllerSystem()
  const actions = openAndFlush(system)
  const entryId = createEntry().id

  actions.onSelectEntry(entryId)
  actions.onRequestDeleteEntry(entryId)
  assert.equal(system.view.lastState.deleteState.entryId, entryId)

  assert.equal(system.controller.close(), true)
  assertNoMutationCalls(system.serviceDouble)

  system.controller.open()
  assert.equal(system.view.lastState.phase, 'loading')
  assert.equal(system.view.lastState.selectedEntryId, null)
  assert.equal(system.view.lastState.form, null)
  assert.equal(system.view.lastState.deleteState.entryId, null)
  assert.equal(system.view.lastState.featuredState.targetEntryId, null)
  assert.equal(system.view.lastState.statusMessage, '')
  assert.equal(system.view.lastState.errorMessage, '')
  assert.equal(system.view.lastState.focusTarget, null)
  system.scheduler.run(1)
  assert.equal(system.serviceDouble.calls.loadLog.length, 2)
})

test('behandelt Filter nicht als dirty und setzt sie bei Close und neuem Open-Lifecycle zurück', () => {
  const entries = [createEntry(), createSecondEntry()]
  const system = createControllerSystem({
    serviceOptions: {
      loadResult: createLoadSuccess(createPrivateLog(entries)),
    },
  })
  const actions = openAndFlush(system)

  actions.onChangeSearchQuery('Prismenkammer')
  actions.onChangeCalendarDateFilter(entries[0].calendarDate)
  actions.onChangeTagFilter('Prisma')
  assert.equal(system.view.lastState.hasActiveFilters, true)

  assert.equal(system.controller.close(), true)
  assert.equal(system.view.unmountCalls, 1)
  assertNoMutationCalls(system.serviceDouble)

  system.controller.open()
  assert.equal(system.view.lastState.phase, 'loading')
  assert.equal(system.view.lastState.searchQuery, '')
  assert.equal(system.view.lastState.calendarDateFilter, '')
  assert.equal(system.view.lastState.selectedTag, '')
  assert.deepEqual(system.view.lastState.availableTags, [])
  assert.deepEqual(system.view.lastState.visibleEntryIds, [])
  system.scheduler.run(1)

  assert.equal(system.view.lastState.phase, 'ready')
  assert.equal(system.view.lastState.hasActiveFilters, false)
  assert.deepEqual(system.view.lastState.visibleEntryIds, entries.map(
    ({ id }) => id
  ))
  assert.equal(system.serviceDouble.calls.loadLog.length, 2)
})

test('berechnet Dirty fachlich und erlaubt Close nach unveränderter oder zurückgesetzter Eingabe', () => {
  const createSystem = createControllerSystem()
  const createActions = openAndFlush(createSystem)
  createActions.onOpenCreateEntryForm()
  createActions.onUpdateFormField('title', '')
  assert.equal(createSystem.view.lastState.form.isDirty, false)
  createActions.onUpdateFormField('title', 'Temporärer Fantasietitel')
  assert.equal(createSystem.view.lastState.form.isDirty, true)
  createActions.onUpdateFormField('title', '')
  assert.equal(createSystem.view.lastState.form.isDirty, false)
  assert.equal(createSystem.controller.close(), true)

  const updateSystem = createControllerSystem()
  const updateActions = openAndFlush(updateSystem)
  const targetEntry = createEntry()
  updateActions.onSelectEntry(targetEntry.id)
  updateActions.onOpenUpdateEntryForm(targetEntry.id)
  updateActions.onUpdateFormField('tags', deepFreeze([...targetEntry.tags]))
  assert.equal(updateSystem.view.lastState.form.isDirty, false)
  updateActions.onUpdateFormField('tags', ['Temporär'])
  assert.equal(updateSystem.view.lastState.form.isDirty, true)
  updateActions.onUpdateFormField('tags', [...targetEntry.tags])
  assert.equal(updateSystem.view.lastState.form.isDirty, false)
  assert.equal(updateSystem.controller.close(), true)
})

test('hält Formular, Delete-Bestätigung und Fokusaktion gegenseitig ausschließlich', () => {
  const firstEntry = createEntry()
  const secondEntry = createSecondEntry()
  const system = createControllerSystem()
  const actions = openAndFlush(system)

  actions.onOpenCreateEntryForm()
  actions.onRequestDeleteEntry(firstEntry.id)
  actions.onSetFeaturedEntry(firstEntry.id)

  assert.equal(system.view.lastState.form.type, 'createEntry')
  assert.equal(system.view.lastState.deleteState.entryId, null)
  assert.equal(system.serviceDouble.calls.setFeaturedEntry.length, 0)

  actions.onCancelForm()
  actions.onRequestDeleteEntry(firstEntry.id)
  actions.onOpenCreateEntryForm()
  actions.onOpenUpdateEntryForm(secondEntry.id)
  actions.onSetFeaturedEntry(secondEntry.id)

  assert.equal(system.view.lastState.form, null)
  assert.equal(system.view.lastState.deleteState.entryId, firstEntry.id)
  assert.equal(system.serviceDouble.calls.setFeaturedEntry.length, 0)
  actions.onCancelDeleteEntry()
  assertNoMutationCalls(system.serviceDouble)
})

test('blockiert Filteraktionen in Detail, Formular, Delete-Bestätigung und laufender Mutation', () => {
  const firstEntry = createEntry()
  const initialLog = createPrivateLog([firstEntry, createSecondEntry()])
  const featuredLog = createPrivateLog(
    structuredClone(initialLog.entries),
    { featuredEntryId: firstEntry.id }
  )
  let system
  const serviceDouble = createServiceDouble({
    loadResult: createLoadSuccess(initialLog),
    featuredResult() {
      assert.equal(system.view.lastState.phase, 'mutating')
      const renderCount = system.view.renders.length
      system.view.actions.onChangeSearchQuery('Während Mutation')
      system.view.actions.onChangeCalendarDateFilter('2040-01-01')
      system.view.actions.onChangeTagFilter('Fiktiv')
      system.view.actions.onResetFilters()
      assert.equal(system.view.renders.length, renderCount)
      assert.equal(system.view.lastState.searchQuery, 'erfunden')
      return createFeaturedSuccess(featuredLog, firstEntry.id, true)
    },
  })
  system = createControllerSystem({ serviceDouble })
  const actions = openAndFlush(system)

  actions.onChangeSearchQuery('erfunden')
  actions.onSelectEntry(firstEntry.id)
  let renderCount = system.view.renders.length
  actions.onChangeSearchQuery('Detail')
  assert.equal(system.view.renders.length, renderCount)

  actions.onOpenUpdateEntryForm(firstEntry.id)
  renderCount = system.view.renders.length
  actions.onChangeCalendarDateFilter('2036-04-18')
  assert.equal(system.view.renders.length, renderCount)
  actions.onCancelForm()
  actions.onBackToOverview()

  actions.onRequestDeleteEntry(firstEntry.id)
  renderCount = system.view.renders.length
  actions.onChangeTagFilter('Prisma')
  actions.onResetFilters()
  assert.equal(system.view.renders.length, renderCount)
  actions.onCancelDeleteEntry()

  actions.onSetFeaturedEntry(firstEntry.id)
  assert.equal(system.serviceDouble.calls.setFeaturedEntry.length, 1)
  assert.equal(system.view.lastState.searchQuery, 'erfunden')
  assert.equal(system.view.lastState.featuredEntryId, firstEntry.id)
  assert.equal(system.view.lastState.phase, 'ready')
})

test('lässt malformed oder zielinkonsistente Submissions nie bis zum Service gelangen', () => {
  const privateMarker = 'fixture-submission-getter-sentinel'
  const system = createControllerSystem()
  const actions = openAndFlush(system)
  actions.onOpenCreateEntryForm()
  const values = createEntryValues()
  const typeGetterSubmission = { ...values }
  let typeGetterCalls = 0
  Object.defineProperty(typeGetterSubmission, 'type', {
    enumerable: true,
    get() {
      typeGetterCalls += 1
      throw new Error(privateMarker)
    },
  })
  const titleGetterSubmission = {
    type: 'createEntry',
    calendarDate: values.calendarDate,
    text: values.text,
    tags: values.tags,
  }
  let titleGetterCalls = 0
  Object.defineProperty(titleGetterSubmission, 'title', {
    enumerable: true,
    get() {
      titleGetterCalls += 1
      throw new Error(privateMarker)
    },
  })
  const sparseSubmission = createSubmission('createEntry', values)
  sparseSubmission.tags.length += 1
  const revokedSubmission = Proxy.revocable(
    createSubmission('createEntry', values),
    {}
  )
  revokedSubmission.revoke()
  const customPrototypeSubmission = Object.assign(
    Object.create({ inheritedFixture: privateMarker }),
    createSubmission('createEntry', values)
  )

  const malformedSubmissions = [
    null,
    [],
    'createEntry',
    { ...createSubmission('createEntry', values), type: 'updateEntry' },
    typeGetterSubmission,
    titleGetterSubmission,
    sparseSubmission,
    customPrototypeSubmission,
    revokedSubmission.proxy,
  ]

  for (const submission of malformedSubmissions) {
    assert.doesNotThrow(() => actions.onSubmitForm(submission))
    assert.equal(system.serviceDouble.calls.createEntry.length, 0)
    assert.equal(system.view.lastState.form.type, 'createEntry')
    assertFeedbackIsRedacted(system.view.lastState, [privateMarker])
  }

  assert.equal(typeGetterCalls, 0)
  assert.equal(titleGetterCalls, 0)

  actions.onCancelForm()
  actions.onSelectEntry(createEntry().id)
  actions.onOpenUpdateEntryForm(createEntry().id)
  actions.onSubmitForm(
    createSubmission(
      'updateEntry',
      createEntryValues(createEntry()),
      createSecondEntry().id
    )
  )

  assert.equal(system.serviceDouble.calls.updateEntry.length, 0)
  assert.equal(system.view.lastState.form.entryId, createEntry().id)
})

test('erstellt mit exakt einem Allowlist-Payload, Busy vor Service und blockierter Reentranz', () => {
  const initialEntry = createEntry()
  const createdEntry = createSecondEntry({
    id: 'lichtwald-entry-created-normalized',
    calendarDate: '2039-02-03',
    title: 'Normalisierte synthetische Karte',
    text: 'Normalisierter frei erfundener Inhalt.',
    tags: ['Normalisiert', 'Fiktiv'],
  })
  const resultLog = createPrivateLog(
    [initialEntry, createdEntry],
    { featuredEntryId: initialEntry.id }
  )
  let system
  let closeDuringMutation
  let extraGetterCalls = 0
  const submittedValues = {
    type: 'createEntry',
    calendarDate: ' 2039-02-03 ',
    title: '  Normalisierte synthetische Karte  ',
    text: '  Normalisierter frei erfundener Inhalt.  ',
    tags: deepFreeze([' Normalisiert ', ' Fiktiv ']),
    id: 'fixture-forged-entry-id',
    dataOrigin: 'synthetic',
  }
  Object.defineProperty(submittedValues, 'fixtureExtra', {
    enumerable: true,
    get() {
      extraGetterCalls += 1
      throw new Error('fixture-extra-submit-getter-sentinel')
    },
  })
  const submissionSnapshot = {
    type: submittedValues.type,
    calendarDate: submittedValues.calendarDate,
    title: submittedValues.title,
    text: submittedValues.text,
    tags: structuredClone(submittedValues.tags),
    id: submittedValues.id,
    dataOrigin: submittedValues.dataOrigin,
  }
  const serviceDouble = createServiceDouble({
    loadResult: createLoadSuccess(
      createPrivateLog([initialEntry], { featuredEntryId: initialEntry.id })
    ),
    createResult(input) {
      assert.equal(system.view.lastState.phase, 'mutating')
      assert.equal(system.view.lastState.form.isSubmitting, true)
      assert.deepEqual(system.view.lastState.entries, [initialEntry])
      closeDuringMutation = system.controller.close()
      system.view.actions.onSubmitForm(submittedValues)
      system.view.actions.onSetFeaturedEntry(initialEntry.id)
      system.view.actions.onRequestDeleteEntry(initialEntry.id)
      return createCreateSuccess(resultLog, createdEntry)
    },
  })
  system = createControllerSystem({ serviceDouble })
  const actions = openAndFlush(system)
  actions.onOpenCreateEntryForm()

  actions.onSubmitForm(submittedValues)

  assert.equal(closeDuringMutation, false)
  assert.equal(extraGetterCalls, 0)
  assert.equal(serviceDouble.calls.createEntry.length, 1)
  const receivedInput = serviceDouble.calls.createEntry[0][0]
  assert.deepEqual(receivedInput, {
    calendarDate: submittedValues.calendarDate,
    title: submittedValues.title,
    text: submittedValues.text,
    tags: submittedValues.tags,
  })
  assertExactOwnKeys(receivedInput, [
    'calendarDate',
    'title',
    'text',
    'tags',
  ])
  assert.notStrictEqual(receivedInput.tags, submittedValues.tags)
  assert.deepEqual(
    {
      type: submittedValues.type,
      calendarDate: submittedValues.calendarDate,
      title: submittedValues.title,
      text: submittedValues.text,
      tags: submittedValues.tags,
      id: submittedValues.id,
      dataOrigin: submittedValues.dataOrigin,
    },
    submissionSnapshot
  )
  assert.equal(serviceDouble.calls.setFeaturedEntry.length, 0)
  assert.equal(serviceDouble.calls.deleteEntry.length, 0)
  assert.equal(serviceDouble.calls.loadLog.length, 1)
  assert.equal(system.view.lastState.phase, 'ready')
  assert.equal(system.view.lastState.form, null)
  assert.equal(system.view.lastState.selectedEntryId, createdEntry.id)
  assert.deepEqual(system.view.lastState.entries, resultLog.entries)
  assert.equal(system.view.lastState.featuredEntryId, initialEntry.id)
  assert.notEqual(system.view.lastState.statusMessage, '')
  assert.equal(system.view.lastState.statusMessageTone, 'success')
})

test('bewahrt aktive Filter bei Create und zeigt einen nicht passenden neuen Eintrag nur im Detail', () => {
  const initialEntry = createEntry({
    title: 'Erfundener Trefferkern vor Create',
  })
  const createdEntry = createSecondEntry({
    id: 'lichtwald-entry-filter-created',
    title: 'Synthetische neue Sonnenkarte',
    text: 'Ein vollständig erfundener, nicht passender Create-Text.',
    tags: ['Neu', 'Sonne'],
  })
  const resultLog = createPrivateLog([initialEntry, createdEntry])
  let system
  const serviceDouble = createServiceDouble({
    loadResult: createLoadSuccess(createPrivateLog([initialEntry])),
    createResult() {
      assert.equal(system.view.lastState.phase, 'mutating')
      assert.deepEqual(system.view.lastState.entries, [initialEntry])
      assert.deepEqual(system.view.lastState.visibleEntryIds, [initialEntry.id])
      return createCreateSuccess(resultLog, createdEntry)
    },
  })
  system = createControllerSystem({ serviceDouble })
  const actions = openAndFlush(system)

  actions.onChangeSearchQuery('Trefferkern')
  actions.onOpenCreateEntryForm()
  actions.onSubmitForm(
    createSubmission('createEntry', createEntryValues(createdEntry))
  )

  assert.equal(system.view.lastState.selectedEntryId, createdEntry.id)
  assert.equal(system.view.lastState.searchQuery, 'Trefferkern')
  assert.deepEqual(system.view.lastState.entries, resultLog.entries)
  assert.deepEqual(system.view.lastState.visibleEntryIds, [initialEntry.id])
  assert.equal(system.view.lastState.filteredEmptyState, false)
  actions.onBackToOverview()
  assert.equal(system.view.lastState.selectedEntryId, null)
  assert.deepEqual(system.view.lastState.visibleEntryIds, [initialEntry.id])
  assert.equal(system.serviceDouble.calls.createEntry.length, 1)
  assert.equal(system.serviceDouble.calls.loadLog.length, 1)
})

test('bewahrt Filter auch bei einem kontrollierten Mutationfehler mit autoritativem Snapshot', () => {
  const targetEntry = createEntry({
    title: 'Erfundener Fehlerfilter',
    tags: ['Fehleroption'],
  })
  const initialLog = createPrivateLog([targetEntry, createSecondEntry()])
  const system = createControllerSystem({
    serviceOptions: {
      loadResult: createLoadSuccess(initialLog),
      createResult: createMutationFailure({
        lichtwaldLog: structuredClone(initialLog),
      }),
    },
  })
  const actions = openAndFlush(system)

  actions.onChangeSearchQuery('Fehlerfilter')
  actions.onChangeCalendarDateFilter(targetEntry.calendarDate)
  actions.onChangeTagFilter('Fehleroption')
  actions.onOpenCreateEntryForm()
  actions.onSubmitForm(
    createSubmission('createEntry', createEntryValues(createSecondEntry()))
  )

  assert.equal(system.view.lastState.phase, 'ready')
  assert.equal(system.view.lastState.form.type, 'createEntry')
  assert.equal(system.view.lastState.form.isSubmitting, false)
  assert.equal(system.view.lastState.searchQuery, 'Fehlerfilter')
  assert.equal(
    system.view.lastState.calendarDateFilter,
    targetEntry.calendarDate
  )
  assert.equal(system.view.lastState.selectedTag, 'Fehleroption')
  assert.deepEqual(system.view.lastState.visibleEntryIds, [targetEntry.id])
  assert.equal(system.view.lastState.hasActiveFilters, true)
  assert.equal(system.serviceDouble.calls.createEntry.length, 1)
  assert.equal(system.serviceDouble.calls.loadLog.length, 1)
})

test('hält Create-Draft und Eingaben selbst gegen mutierende Service-Doubles getrennt', () => {
  const privateMarker = 'fixture-create-validation-private-sentinel'
  const initialLog = createPrivateLog()
  const submission = createSubmission('createEntry', {
    calendarDate: '2039-05-06',
    title: 'Bewahrter erfundener Create-Draft',
    text: 'Dieser synthetische Draft bleibt unverändert erhalten.',
    tags: ['Bewahrt', 'Fiktiv'],
  })
  const submissionSnapshot = structuredClone(submission)
  let receivedInput
  const system = createControllerSystem({
    serviceOptions: {
      loadResult: createLoadSuccess(initialLog),
      createResult(input) {
        receivedInput = input
        input.calendarDate = '9999-12-31'
        input.title = 'Vom fehlerhaften Double mutiert'
        input.text = 'Vom fehlerhaften Double mutiert'
        input.tags[0] = 'Mutiert'
        input.tags.push('Zusatz')
        return createMutationFailure({
          status: 'validationFailed',
          code: 'invalidLichtwaldLogInput',
          lichtwaldLog: structuredClone(initialLog),
          message: privateMarker,
          fieldErrors: {
            form: privateMarker,
            calendarDate: privateMarker,
            title: privateMarker,
            text: privateMarker,
            tags: privateMarker,
            fixtureUnknown: privateMarker,
          },
        })
      },
    },
  })
  const actions = openAndFlush(system)
  actions.onOpenCreateEntryForm()

  actions.onSubmitForm(deepFreeze(submission))

  assert.deepEqual(submission, submissionSnapshot)
  assert.notStrictEqual(receivedInput, submission)
  assert.notStrictEqual(receivedInput.tags, submission.tags)
  assert.deepEqual(system.view.lastState.form.values, {
    calendarDate: submission.calendarDate,
    title: submission.title,
    text: submission.text,
    tags: submission.tags,
  })
  assert.deepEqual(Object.keys(system.view.lastState.form.fieldErrors).sort(), [
    'calendarDate',
    'form',
    'tags',
    'text',
    'title',
  ])
  assertFeedbackIsRedacted(system.view.lastState, [privateMarker])
  assert.deepEqual(system.view.lastState.entries, initialLog.entries)
  assert.equal(system.serviceDouble.calls.createEntry.length, 1)
  assert.equal(system.serviceDouble.calls.loadLog.length, 1)
})

test('erhält Create-Drafts bei allen dokumentierten Validierungs- und Speicherfehlern', () => {
  const genericMessage =
    'Der LichtwaldLog-Eintrag konnte nicht lokal gespeichert werden. Deine Eingaben bleiben erhalten.'
  const inputMessage =
    'Bitte korrigiere die markierten LichtwaldLog-Felder.'
  const unavailableMessage =
    'Der lokale LichtwaldLog-Speicher ist derzeit nicht verfügbar.'
  const readMessage =
    'Der aktuelle LichtwaldLog-Bestand konnte nicht sicher gelesen werden.'
  const quotaMessage =
    'Der lokale Speicher besitzt nicht genügend freien Platz für diese Änderung.'
  const failureCases = [
    // Service-spezifische Paare der Create-Operation.
    ['validationFailed', 'invalidLichtwaldLogInput', inputMessage, true],
    [
      'limitReached',
      'lichtwaldLogEntryLimitReached',
      'Das LichtwaldLog kann keine weiteren Einträge aufnehmen.',
      false,
    ],
    [
      'generationFailed',
      'lichtwaldLogEntryIdGenerationFailed',
      'Für den LichtwaldLog-Eintrag konnte keine sichere ID erzeugt werden.',
      false,
    ],
    [
      'validationFailed',
      'invalidLichtwaldLogState',
      'Die LichtwaldLog-Änderung ergab keinen gültigen Gesamtzustand.',
      false,
    ],
    [
      'unavailable',
      'lichtwaldLogStorageUnavailable',
      unavailableMessage,
      false,
    ],
    ['readFailed', 'lichtwaldLogStorageReadFailed', readMessage, false],
    ['writeFailed', 'lichtwaldLogStorageWriteFailed', genericMessage, false],
    ['storageFailed', 'unexpectedStorageResult', genericMessage, false],
    // Alle weiteren eindeutigen Write-Storage-Paare. Das gemeinsame
    // storageFailed/unexpectedStorageResult steht bereits oben.
    ['invalidKey', 'invalidStorageKey', unavailableMessage, false],
    ['invalidLimit', 'invalidStorageLimit', unavailableMessage, false],
    [
      'unavailable',
      'storageAdapterUnavailable',
      unavailableMessage,
      false,
    ],
    ['unavailable', 'storageUnavailable', unavailableMessage, false],
    ['readFailed', 'storageReadFailed', readMessage, false],
    ['invalidJson', 'invalidJson', readMessage, false],
    [
      'sizeLimitExceeded',
      'storageSizeLimitExceeded',
      readMessage,
      false,
    ],
    [
      'invalidStoredData',
      'invalidLichtwaldLogData',
      readMessage,
      false,
    ],
    [
      'invalidStoredData',
      'privateLichtwaldLogRequired',
      readMessage,
      false,
    ],
    ['serializationFailed', 'serializationFailed', genericMessage, false],
    ['quotaExceeded', 'storageQuotaExceeded', quotaMessage, false],
    ['writeFailed', 'storageWriteFailed', genericMessage, false],
    [
      'validationFailed',
      'invalidLichtwaldLogData',
      genericMessage,
      false,
    ],
    [
      'validationFailed',
      'privateLichtwaldLogRequired',
      genericMessage,
      false,
    ],
  ]

  assert.equal(failureCases.length, 22)
  assert.equal(
    new Set(failureCases.map(([status, code]) => `${status}\0${code}`)).size,
    failureCases.length
  )

  for (const [
    status,
    code,
    expectedMessage,
    hasFieldError,
  ] of failureCases) {
    const privateMarker = `fixture-allowed-${status}-${code}`
    const initialLog = createPrivateLog([createEntry()])
    const acceptedSnapshotEntry = createSecondEntry({
      id: `lichtwald-entry-allowed-${failureCases.findIndex(
        ([candidateStatus, candidateCode]) =>
          candidateStatus === status && candidateCode === code
      )}`,
      title: `Erkennbar veränderter erlaubter Snapshot ${privateMarker}`,
    })
    const acceptedFailureLog = createPrivateLog([
      createEntry(),
      acceptedSnapshotEntry,
    ])
    const submission = createSubmission(
      'createEntry',
      createEntryValues(createSecondEntry())
    )
    const system = createControllerSystem({
      serviceOptions: {
        loadResult: createLoadSuccess(initialLog),
        createResult: createMutationFailure({
          status,
          code,
          lichtwaldLog: acceptedFailureLog,
          message: privateMarker,
          ...(hasFieldError
            ? { fieldErrors: { title: privateMarker } }
            : {}),
        }),
      },
    })
    const actions = openAndFlush(system)
    actions.onOpenCreateEntryForm()
    actions.onSubmitForm(submission)

    assert.equal(system.view.lastState.phase, 'ready')
    assert.equal(system.view.lastState.form.type, 'createEntry')
    assert.deepEqual(system.view.lastState.form.values, {
      calendarDate: submission.calendarDate,
      title: submission.title,
      text: submission.text,
      tags: submission.tags,
    })
    assert.deepEqual(
      system.view.lastState.entries,
      acceptedFailureLog.entries,
      `Erlaubtes Paar wurde nicht erkannt: ${status}/${code}`
    )
    assert.notStrictEqual(
      system.view.lastState.entries,
      acceptedFailureLog.entries
    )
    assert.equal(system.view.lastState.form.errorMessage, expectedMessage)
    assert.deepEqual(
      system.view.lastState.form.fieldErrors,
      hasFieldError
        ? { title: 'Bitte gib einen Titel mit höchstens 120 Zeichen ein.' }
        : {}
    )
    assertFeedbackIsRedacted(system.view.lastState, [privateMarker])
    assert.equal(system.serviceDouble.calls.createEntry.length, 1)
    assert.equal(system.serviceDouble.calls.loadLog.length, 1)
  }

  const rejectedPairs = [
    ['fixtureUnknownStatus', 'fixtureUnknownCode'],
    ['invalidKey', 'storageReadFailed'],
    ['quotaExceeded', 'storageWriteFailed'],
    ['unavailable', 'invalidStorageKey'],
  ]

  for (const [status, code] of rejectedPairs) {
    const privateMarker = `fixture-rejected-${status}-${code}`
    const initialLog = createPrivateLog([createEntry()])
    const rejectedSnapshotEntry = createSecondEntry({
      id: `lichtwald-entry-rejected-${rejectedPairs.findIndex(
        ([candidateStatus, candidateCode]) =>
          candidateStatus === status && candidateCode === code
      )}`,
      title: `Nicht zu übernehmender Snapshot ${privateMarker}`,
    })
    const rejectedFailureLog = createPrivateLog([
      createEntry(),
      rejectedSnapshotEntry,
    ])
    const submission = createSubmission(
      'createEntry',
      createEntryValues(createSecondEntry())
    )
    const system = createControllerSystem({
      serviceOptions: {
        loadResult: createLoadSuccess(initialLog),
        createResult: createMutationFailure({
          status,
          code,
          lichtwaldLog: rejectedFailureLog,
          message: privateMarker,
        }),
      },
    })
    const actions = openAndFlush(system)
    actions.onOpenCreateEntryForm()
    actions.onSubmitForm(submission)

    assert.deepEqual(system.view.lastState.entries, initialLog.entries)
    assert.equal(
      system.view.lastState.entries.some(
        ({ id }) => id === rejectedSnapshotEntry.id
      ),
      false,
      `Unzulässiges Paar wurde übernommen: ${status}/${code}`
    )
    assert.equal(system.view.lastState.form.type, 'createEntry')
    assert.deepEqual(system.view.lastState.form.values, {
      calendarDate: submission.calendarDate,
      title: submission.title,
      text: submission.text,
      tags: submission.tags,
    })
    assert.deepEqual(system.view.lastState.form.fieldErrors, {})
    assert.equal(system.view.lastState.form.errorMessage, genericMessage)
    assertFeedbackIsRedacted(system.view.lastState, [
      privateMarker,
      rejectedSnapshotEntry.title,
    ])
    assert.equal(system.serviceDouble.calls.createEntry.length, 1)
    assert.equal(system.serviceDouble.calls.loadLog.length, 1)
  }
})

test('behandelt bekannte, aber operationsfremde Status-Code-Paare wie unbekannte Resultate', () => {
  function getCreateFeedback(status, code) {
    const system = createControllerSystem({
      serviceOptions: {
        createResult: createMutationFailure({ status, code }),
      },
    })
    const actions = openAndFlush(system)
    actions.onOpenCreateEntryForm()
    actions.onSubmitForm(
      createSubmission('createEntry', createEntryValues())
    )
    return getFeedbackText(system.view.lastState)
  }

  function getUpdateFeedback(status, code) {
    const system = createControllerSystem({
      serviceOptions: {
        updateResult: createMutationFailure({ status, code }),
      },
    })
    const actions = openAndFlush(system)
    const targetEntry = createEntry()
    actions.onSelectEntry(targetEntry.id)
    actions.onOpenUpdateEntryForm(targetEntry.id)
    actions.onSubmitForm(
      createSubmission(
        'updateEntry',
        createEntryValues(targetEntry),
        targetEntry.id
      )
    )
    return getFeedbackText(system.view.lastState)
  }

  assert.equal(
    getCreateFeedback('notFound', 'lichtwaldLogEntryNotFound'),
    getCreateFeedback('fixtureUnknown', 'fixtureUnknownCode')
  )
  assert.equal(
    getUpdateFeedback(
      'generationFailed',
      'lichtwaldLogEntryIdGenerationFailed'
    ),
    getUpdateFeedback('fixtureUnknown', 'fixtureUnknownCode')
  )
})

test('ruft auch ein scheinbar identisches Update auf und zeigt changed false als Notice', () => {
  const targetEntry = createEntry()
  const initialLog = createPrivateLog([targetEntry, createSecondEntry()])
  let system
  let closeDuringMutation
  const serviceDouble = createServiceDouble({
    loadResult: createLoadSuccess(initialLog),
    updateResult(entryId, input) {
      assert.equal(system.view.lastState.phase, 'mutating')
      assert.equal(system.view.lastState.form.isSubmitting, true)
      closeDuringMutation = system.controller.close()
      system.view.actions.onSubmitForm(
        createSubmission('updateEntry', input, entryId)
      )
      return createUpdateSuccess(
        structuredClone(initialLog),
        targetEntry.id,
        false
      )
    },
  })
  system = createControllerSystem({ serviceDouble })
  const actions = openAndFlush(system)
  actions.onSelectEntry(targetEntry.id)
  actions.onOpenUpdateEntryForm(targetEntry.id)
  const identicalSubmission = createSubmission(
    'updateEntry',
    createEntryValues(targetEntry),
    targetEntry.id
  )
  identicalSubmission.fixtureIgnored = 'Sicheres Zusatzfeld'

  actions.onSubmitForm(identicalSubmission)

  assert.equal(closeDuringMutation, false)
  assert.equal(serviceDouble.calls.updateEntry.length, 1)
  assert.deepEqual(serviceDouble.calls.updateEntry[0], [
    targetEntry.id,
    createEntryValues(targetEntry),
  ])
  assert.equal(system.view.lastState.form, null)
  assert.equal(system.view.lastState.selectedEntryId, targetEntry.id)
  assert.equal(system.view.lastState.statusMessageTone, 'notice')
  assert.match(
    system.view.lastState.statusMessage,
    /Keine Änderungen erforderlich/
  )
  assert.equal(serviceDouble.calls.loadLog.length, 1)
})

test('ersetzt nach Update den gesamten autoritativen Snapshot und erhält die gültige Auswahl', () => {
  const targetEntry = createEntry()
  const otherEntry = createSecondEntry()
  const concurrentlyAddedEntry = createEntry({
    id: 'lichtwald-entry-concurrent-3',
    calendarDate: '2040-01-01',
    title: 'Parallel erfundene Karte',
    text: 'Eine zusätzlich geladene synthetische Karte.',
    tags: ['Parallel'],
  })
  const updatedTarget = createEntry({
    calendarDate: '2040-02-29',
    title: 'Normalisierte Update-Karte',
    text: 'Normalisierter synthetischer Update-Inhalt.',
    tags: ['Update', 'Normalisiert'],
  })
  const resultLog = createPrivateLog(
    [otherEntry, updatedTarget, concurrentlyAddedEntry],
    { featuredEntryId: concurrentlyAddedEntry.id }
  )
  const system = createControllerSystem({
    serviceOptions: {
      loadResult: createLoadSuccess(
        createPrivateLog([targetEntry, otherEntry])
      ),
      updateResult: createUpdateSuccess(
        resultLog,
        targetEntry.id,
        true
      ),
    },
  })
  const actions = openAndFlush(system)
  actions.onSelectEntry(targetEntry.id)
  actions.onOpenUpdateEntryForm(targetEntry.id)
  const submittedValues = createEntryValues(updatedTarget, {
    title: '  Normalisierte Update-Karte  ',
  })

  actions.onSubmitForm(
    createSubmission('updateEntry', submittedValues, targetEntry.id)
  )

  assert.equal(system.serviceDouble.calls.updateEntry.length, 1)
  assert.deepEqual(system.serviceDouble.calls.updateEntry[0], [
    targetEntry.id,
    submittedValues,
  ])
  assert.deepEqual(system.view.lastState.entries, resultLog.entries)
  assert.deepEqual(getEntryIds(system.view.lastState), [
    otherEntry.id,
    targetEntry.id,
    concurrentlyAddedEntry.id,
  ])
  assert.equal(system.view.lastState.featuredEntryId, concurrentlyAddedEntry.id)
  assert.equal(system.view.lastState.selectedEntryId, targetEntry.id)
  assert.equal(system.view.lastState.form, null)
  assert.equal(system.serviceDouble.calls.loadLog.length, 1)
})

test('hält ein aktualisiertes Detail sichtbar und entfernt es erst in der gefilterten Overview', () => {
  const targetEntry = createEntry({
    id: 'lichtwald-entry-filter-update-target',
    title: 'Erfundener Filterstern',
  })
  const otherEntry = createSecondEntry({
    id: 'lichtwald-entry-filter-update-other',
    title: 'Synthetische Sonnenkarte',
  })
  const updatedEntry = createEntry({
    id: targetEntry.id,
    calendarDate: targetEntry.calendarDate,
    title: 'Erfundene Karte ohne Suchwort',
    text: 'Der aktualisierte synthetische Text passt nicht mehr.',
    tags: ['Aktualisiert'],
  })
  const resultLog = createPrivateLog([updatedEntry, otherEntry])
  const system = createControllerSystem({
    serviceOptions: {
      loadResult: createLoadSuccess(
        createPrivateLog([targetEntry, otherEntry])
      ),
      updateResult: createUpdateSuccess(
        resultLog,
        targetEntry.id,
        true
      ),
    },
  })
  const actions = openAndFlush(system)

  actions.onChangeSearchQuery('Filterstern')
  actions.onSelectEntry(targetEntry.id)
  actions.onOpenUpdateEntryForm(targetEntry.id)
  actions.onSubmitForm(
    createSubmission(
      'updateEntry',
      createEntryValues(updatedEntry),
      targetEntry.id
    )
  )

  assert.equal(system.view.lastState.phase, 'ready')
  assert.equal(system.view.lastState.selectedEntryId, targetEntry.id)
  assert.equal(system.view.lastState.searchQuery, 'Filterstern')
  assert.deepEqual(system.view.lastState.entries, resultLog.entries)
  assert.deepEqual(system.view.lastState.visibleEntryIds, [])
  assert.equal(system.view.lastState.hasActiveFilters, true)
  assert.equal(system.view.lastState.filteredEmptyState, true)

  actions.onBackToOverview()
  assert.equal(system.view.lastState.selectedEntryId, null)
  assert.deepEqual(system.view.lastState.visibleEntryIds, [])
  assert.equal(system.view.lastState.phase, 'ready')
  assert.equal(system.serviceDouble.calls.updateEntry.length, 1)
  assert.equal(system.serviceDouble.calls.loadLog.length, 1)
})

test('erhält Update-Draft und alten Snapshot bei malformed oder synthetischen Erfolgen', () => {
  const privateMarker = 'fixture-malformed-update-private-sentinel'
  const targetEntry = createEntry()
  const initialLog = createPrivateLog([targetEntry, createSecondEntry()])
  const changedTarget = createEntry({
    title: 'Nicht bestätigter Update-Kandidat',
    text: 'Dieser synthetische Kandidat wurde nicht verlässlich bestätigt.',
  })
  const resultLog = createPrivateLog([changedTarget, createSecondEntry()])
  const validSuccess = createUpdateSuccess(
    resultLog,
    targetEntry.id,
    true
  )
  const missingUpdatedEntry = { ...validSuccess }
  delete missingUpdatedEntry.updatedEntry
  const extraResult = { ...validSuccess, fixtureExtra: privateMarker }
  const symbolResult = { ...validSuccess }
  symbolResult[Symbol(privateMarker)] = privateMarker
  const wrongTargetResult = {
    ...validSuccess,
    updatedEntry: createSecondEntry(),
  }
  const mismatchedEntryResult = {
    ...validSuccess,
    updatedEntry: {
      ...changedTarget,
      title: 'Abweichender Resultat-Titel',
    },
  }
  const syntheticResult = {
    ...validSuccess,
    lichtwaldLog: createSyntheticLog(resultLog.entries),
  }
  const malformedResults = [
    null,
    Promise.resolve(validSuccess),
    missingUpdatedEntry,
    extraResult,
    symbolResult,
    wrongTargetResult,
    mismatchedEntryResult,
    { ...validSuccess, changed: 'true' },
    syntheticResult,
    {
      ok: true,
      status: 'entryCreated',
      changed: true,
      createdEntry: structuredClone(changedTarget),
      lichtwaldLog: resultLog,
    },
  ]

  for (const updateResult of malformedResults) {
    const system = createControllerSystem({
      serviceOptions: {
        loadResult: createLoadSuccess(structuredClone(initialLog)),
        updateResult,
      },
    })
    const actions = openAndFlush(system)
    actions.onSelectEntry(targetEntry.id)
    actions.onOpenUpdateEntryForm(targetEntry.id)
    const submission = createSubmission(
      'updateEntry',
      createEntryValues(changedTarget),
      targetEntry.id
    )

    assert.doesNotThrow(() => actions.onSubmitForm(submission))

    assert.equal(system.serviceDouble.calls.updateEntry.length, 1)
    assert.deepEqual(system.view.lastState.entries, initialLog.entries)
    assert.equal(
      system.view.lastState.entries[0].title,
      targetEntry.title
    )
    assert.equal(system.view.lastState.form.type, 'updateEntry')
    assert.deepEqual(system.view.lastState.form.values, {
      calendarDate: submission.calendarDate,
      title: submission.title,
      text: submission.text,
      tags: submission.tags,
    })
    assert.equal(system.view.lastState.selectedEntryId, targetEntry.id)
    assertFeedbackIsRedacted(system.view.lastState, [privateMarker])
    assert.equal(system.serviceDouble.calls.loadLog.length, 1)
  }
})

test('weist einen Update-Erfolg mit identischem Resultat- und Snapshot-Entry zurück', () => {
  assertUnsafeUpdateReferenceResultIsRejected((resultLog) => {
    const unsafeResult = {
      ok: true,
      status: 'entryUpdated',
      changed: true,
      updatedEntry: resultLog.entries[0],
      lichtwaldLog: resultLog,
    }

    assert.strictEqual(
      unsafeResult.updatedEntry,
      unsafeResult.lichtwaldLog.entries[0]
    )
    return unsafeResult
  })
})

test('weist getrennte Update-Entries mit gemeinsamem Tags-Array zurück', () => {
  assertUnsafeUpdateReferenceResultIsRejected((resultLog, updatedEntry) => {
    const unsafeResult = {
      ok: true,
      status: 'entryUpdated',
      changed: true,
      updatedEntry: {
        ...updatedEntry,
        tags: resultLog.entries[0].tags,
      },
      lichtwaldLog: resultLog,
    }

    assert.notStrictEqual(
      unsafeResult.updatedEntry,
      unsafeResult.lichtwaldLog.entries[0]
    )
    assert.strictEqual(
      unsafeResult.updatedEntry.tags,
      unsafeResult.lichtwaldLog.entries[0].tags
    )
    return unsafeResult
  })
})

test('reconciled Auswahl gegen einen autoritativen Update-Fehlersnapshot und behält den Draft', () => {
  const targetEntry = createEntry()
  const remainingEntry = createSecondEntry()
  const initialLog = createPrivateLog([targetEntry, remainingEntry])
  const authoritativePreviousLog = createPrivateLog([remainingEntry])
  const privateMarker = 'fixture-update-not-found-private-sentinel'
  const system = createControllerSystem({
    serviceOptions: {
      loadResult: createLoadSuccess(initialLog),
      updateResult: createMutationFailure({
        status: 'notFound',
        code: 'lichtwaldLogEntryNotFound',
        lichtwaldLog: authoritativePreviousLog,
        message: privateMarker,
      }),
    },
  })
  const actions = openAndFlush(system)
  actions.onSelectEntry(targetEntry.id)
  actions.onOpenUpdateEntryForm(targetEntry.id)
  const submission = createSubmission(
    'updateEntry',
    createEntryValues(targetEntry, {
      title: 'Bewahrter Update-Draft nach parallelem Entfernen',
    }),
    targetEntry.id
  )

  actions.onSubmitForm(submission)

  assert.deepEqual(system.view.lastState.entries, [remainingEntry])
  assert.equal(system.view.lastState.selectedEntryId, null)
  assert.equal(system.view.lastState.form.type, 'updateEntry')
  assert.equal(system.view.lastState.form.entryId, targetEntry.id)
  assert.equal(
    system.view.lastState.form.values.title,
    submission.title
  )
  assertFeedbackIsRedacted(system.view.lastState, [privateMarker])
})

test('verwirft einen Nicht-NotFound-Updatefehler, dessen Snapshot die Ziel-ID entfernt', () => {
  const targetEntry = createEntry()
  const remainingEntry = createSecondEntry()
  const untrustedEntry = createEntry({
    id: 'lichtwald-entry-rejected-update-failure-3',
    title: 'Nicht zu übernehmender Update-Fehlersnapshot',
    text: 'Dieser frei erfundene Widerspruch bleibt außerhalb der Projektion.',
    tags: ['Widerspruch', 'Update'],
  })
  const initialLog = createPrivateLog([targetEntry, remainingEntry])
  const contradictoryFailureLog = createPrivateLog([
    remainingEntry,
    untrustedEntry,
  ])
  const privateMarker = 'fixture-update-target-correlation-sentinel'
  const system = createControllerSystem({
    serviceOptions: {
      loadResult: createLoadSuccess(initialLog),
      updateResult: createMutationFailure({
        status: 'writeFailed',
        code: 'lichtwaldLogStorageWriteFailed',
        lichtwaldLog: contradictoryFailureLog,
        message: privateMarker,
      }),
    },
  })
  const actions = openAndFlush(system)
  actions.onSelectEntry(targetEntry.id)
  actions.onOpenUpdateEntryForm(targetEntry.id)
  const submission = createSubmission(
    'updateEntry',
    createEntryValues(targetEntry, {
      title: 'Bewahrter Draft bei widersprüchlichem Fehlersnapshot',
    }),
    targetEntry.id
  )

  actions.onSubmitForm(submission)

  assert.deepEqual(system.view.lastState.entries, initialLog.entries)
  assert.equal(
    system.view.lastState.entries.some(({ id }) => id === targetEntry.id),
    true
  )
  assert.equal(
    system.view.lastState.entries.some(({ id }) => id === untrustedEntry.id),
    false
  )
  assert.equal(system.view.lastState.selectedEntryId, targetEntry.id)
  assert.equal(system.view.lastState.form.type, 'updateEntry')
  assert.equal(system.view.lastState.form.entryId, targetEntry.id)
  assert.deepEqual(system.view.lastState.form.values, {
    calendarDate: submission.calendarDate,
    title: submission.title,
    text: submission.text,
    tags: submission.tags,
  })
  assert.equal(
    system.view.lastState.form.errorMessage,
    'Der LichtwaldLog-Eintrag konnte nicht lokal aktualisiert werden. Deine Eingaben bleiben erhalten.'
  )
  assertFeedbackIsRedacted(system.view.lastState, [
    privateMarker,
    targetEntry.id,
    untrustedEntry.id,
    untrustedEntry.title,
    untrustedEntry.text,
  ])
  assert.equal(system.serviceDouble.calls.updateEntry.length, 1)
  assert.equal(system.serviceDouble.calls.loadLog.length, 1)
})

test('weist malformed Mutationsergebnisse und unbekannte Fehlerpaare ohne Snapshotersetzung zurück', () => {
  const privateMarker = 'fixture-malformed-mutation-result-sentinel'
  const initialLog = createPrivateLog()
  const changedLog = createPrivateLog([
    createEntry({ title: 'Nicht bestätigter fremder Zustand' }),
    createSecondEntry(),
  ])
  const errorWithGetter = {
    message: privateMarker,
  }
  let codeGetterCalls = 0
  Object.defineProperty(errorWithGetter, 'code', {
    enumerable: true,
    get() {
      codeGetterCalls += 1
      throw new Error(privateMarker)
    },
  })
  const malformedResults = [
    createMutationFailure({
      status: 'writeFailed',
      code: 'unknownPrivateCode',
      lichtwaldLog: changedLog,
      message: privateMarker,
    }),
    {
      ok: false,
      status: 'writeFailed',
      changed: true,
      lichtwaldLog: changedLog,
      error: {
        code: 'lichtwaldLogStorageWriteFailed',
        message: privateMarker,
      },
    },
    {
      ok: false,
      status: 'writeFailed',
      changed: false,
      lichtwaldLog: createSyntheticLog(),
      error: {
        code: 'lichtwaldLogStorageWriteFailed',
        message: privateMarker,
      },
    },
    {
      ok: false,
      status: 'writeFailed',
      changed: false,
      lichtwaldLog: changedLog,
      error: errorWithGetter,
    },
  ]

  for (const updateResult of malformedResults) {
    const system = createControllerSystem({
      serviceOptions: {
        loadResult: createLoadSuccess(structuredClone(initialLog)),
        updateResult,
      },
    })
    const actions = openAndFlush(system)
    const targetEntry = initialLog.entries[0]
    actions.onSelectEntry(targetEntry.id)
    actions.onOpenUpdateEntryForm(targetEntry.id)
    actions.onSubmitForm(
      createSubmission(
        'updateEntry',
        createEntryValues(targetEntry, {
          title: 'Bewahrter synthetischer Draft',
        }),
        targetEntry.id
      )
    )

    assert.deepEqual(system.view.lastState.entries, initialLog.entries)
    assert.equal(system.view.lastState.form.type, 'updateEntry')
    assertFeedbackIsRedacted(system.view.lastState, [privateMarker])
  }

  assert.equal(codeGetterCalls, 0)
})

test('verwirft fieldErrors bei einem Nicht-invalidInput-Fehler ohne Snapshotübernahme', () => {
  const privateMarker = 'fixture-forbidden-field-errors-sentinel'
  const targetEntry = createEntry()
  const secondEntry = createSecondEntry()
  const initialLog = createPrivateLog([targetEntry, secondEntry])
  const changedSnapshot = createPrivateLog([
    createEntry({
      title: 'Nicht zu übernehmender autoritativer Scheinsnapshot',
      text: 'Dieser valide, aber unbestätigte Zustand bleibt unsichtbar.',
    }),
    secondEntry,
  ])
  const resultWithForbiddenFieldErrors = {
    ok: false,
    status: 'writeFailed',
    changed: false,
    lichtwaldLog: changedSnapshot,
    error: {
      code: 'lichtwaldLogStorageWriteFailed',
      message: privateMarker,
      fieldErrors: {},
    },
  }

  function submitUpdate(updateResult) {
    const system = createControllerSystem({
      serviceOptions: {
        loadResult: createLoadSuccess(structuredClone(initialLog)),
        updateResult,
      },
    })
    const actions = openAndFlush(system)
    actions.onSelectEntry(targetEntry.id)
    actions.onOpenUpdateEntryForm(targetEntry.id)
    const submission = createSubmission(
      'updateEntry',
      createEntryValues(targetEntry, {
        title: 'Bewahrter Draft bei unzulässigen fieldErrors',
      }),
      targetEntry.id
    )
    actions.onSubmitForm(submission)
    return { submission, system }
  }

  const malformedSystem = submitUpdate(
    resultWithForbiddenFieldErrors
  )
  const genericSystem = submitUpdate(null)

  assert.deepEqual(
    malformedSystem.system.view.lastState.entries,
    initialLog.entries
  )
  assert.equal(
    malformedSystem.system.view.lastState.selectedEntryId,
    targetEntry.id
  )
  assert.equal(
    malformedSystem.system.view.lastState.form.type,
    'updateEntry'
  )
  assert.deepEqual(
    malformedSystem.system.view.lastState.form.values,
    {
      calendarDate: malformedSystem.submission.calendarDate,
      title: malformedSystem.submission.title,
      text: malformedSystem.submission.text,
      tags: malformedSystem.submission.tags,
    }
  )
  assert.deepEqual(
    malformedSystem.system.view.lastState.form.fieldErrors,
    {}
  )
  assert.equal(
    malformedSystem.system.view.lastState.form.errorMessage,
    genericSystem.system.view.lastState.form.errorMessage
  )
  assert.notEqual(
    malformedSystem.system.view.lastState.form.errorMessage,
    ''
  )
  assertFeedbackIsRedacted(
    malformedSystem.system.view.lastState,
    [
      privateMarker,
      changedSnapshot.entries[0].title,
      changedSnapshot.entries[0].text,
    ]
  )
  assert.equal(
    malformedSystem.system.serviceDouble.calls.updateEntry.length,
    1
  )
  assert.equal(
    malformedSystem.system.serviceDouble.calls.loadLog.length,
    1
  )
})

test('akzeptiert null-prototypische und tief eingefrorene Mutationserfolge sowie Fehler', () => {
  const targetEntry = createEntry()
  const updatedEntry = createEntry({
    title: 'Tief eingefrorene synthetische Aktualisierung',
  })
  const initialLog = createPrivateLog([targetEntry, createSecondEntry()])
  const updatedLog = createPrivateLog([updatedEntry, createSecondEntry()])
  const frozenSuccess = deepFreeze(
    createUpdateSuccess(updatedLog, targetEntry.id, true)
  )
  const successSystem = createControllerSystem({
    serviceOptions: {
      loadResult: createLoadSuccess(initialLog),
      updateResult: frozenSuccess,
    },
  })
  const successActions = openAndFlush(successSystem)
  successActions.onSelectEntry(targetEntry.id)
  successActions.onOpenUpdateEntryForm(targetEntry.id)
  successActions.onSubmitForm(
    createSubmission(
      'updateEntry',
      createEntryValues(updatedEntry),
      targetEntry.id
    )
  )

  assert.deepEqual(successSystem.view.lastState.entries, updatedLog.entries)
  assert.equal(successSystem.view.lastState.form, null)

  const nullPrototypeError = Object.assign(Object.create(null), {
    code: 'lichtwaldLogStorageWriteFailed',
    message: 'fixture-null-prototype-error-sentinel',
  })
  const nullPrototypeFailure = Object.assign(Object.create(null), {
    ok: false,
    status: 'writeFailed',
    changed: false,
    lichtwaldLog: Object.assign(
      Object.create(null),
      structuredClone(initialLog)
    ),
    error: nullPrototypeError,
  })
  deepFreeze(nullPrototypeFailure)
  const failureSystem = createControllerSystem({
    serviceOptions: {
      loadResult: createLoadSuccess(structuredClone(initialLog)),
      updateResult: nullPrototypeFailure,
    },
  })
  const failureActions = openAndFlush(failureSystem)
  failureActions.onSelectEntry(targetEntry.id)
  failureActions.onOpenUpdateEntryForm(targetEntry.id)
  failureActions.onSubmitForm(
    createSubmission(
      'updateEntry',
      createEntryValues(updatedEntry),
      targetEntry.id
    )
  )

  assert.deepEqual(failureSystem.view.lastState.entries, initialLog.entries)
  assert.equal(failureSystem.view.lastState.form.type, 'updateEntry')
  assertFeedbackIsRedacted(failureSystem.view.lastState, [
    'fixture-null-prototype-error-sentinel',
  ])
})

test('führt Getter oder Proxies in error und fieldErrors niemals aus oder in Feedback über', () => {
  const privateMarker = 'fixture-field-error-getter-sentinel'
  const initialLog = createPrivateLog()
  let messageGetterCalls = 0
  const accessorError = {
    code: 'lichtwaldLogStorageWriteFailed',
  }
  Object.defineProperty(accessorError, 'message', {
    enumerable: true,
    get() {
      messageGetterCalls += 1
      throw new Error(privateMarker)
    },
  })
  let fieldGetterCalls = 0
  const accessorFieldErrors = {
    title: privateMarker,
  }
  Object.defineProperty(accessorFieldErrors, 'fixtureUnknown', {
    enumerable: true,
    get() {
      fieldGetterCalls += 1
      throw new Error(privateMarker)
    },
  })
  const revokedFieldErrors = Proxy.revocable(
    { title: privateMarker },
    {}
  )
  revokedFieldErrors.revoke()
  const hostileResults = [
    {
      ok: false,
      status: 'writeFailed',
      changed: false,
      lichtwaldLog: structuredClone(initialLog),
      error: accessorError,
    },
    createMutationFailure({
      status: 'validationFailed',
      code: 'invalidLichtwaldLogInput',
      lichtwaldLog: structuredClone(initialLog),
      message: privateMarker,
      fieldErrors: accessorFieldErrors,
    }),
    createMutationFailure({
      status: 'validationFailed',
      code: 'invalidLichtwaldLogInput',
      lichtwaldLog: structuredClone(initialLog),
      message: privateMarker,
      fieldErrors: revokedFieldErrors.proxy,
    }),
    {
      ...createMutationFailure({
        lichtwaldLog: structuredClone(initialLog),
        message: privateMarker,
      }),
      error: {
        code: 'lichtwaldLogStorageWriteFailed',
        message: privateMarker,
        fixtureExtra: privateMarker,
      },
    },
  ]

  for (const updateResult of hostileResults) {
    const system = createControllerSystem({
      serviceOptions: {
        loadResult: createLoadSuccess(structuredClone(initialLog)),
        updateResult,
      },
    })
    const actions = openAndFlush(system)
    const targetEntry = createEntry()
    actions.onSelectEntry(targetEntry.id)
    actions.onOpenUpdateEntryForm(targetEntry.id)

    assert.doesNotThrow(() => {
      actions.onSubmitForm(
        createSubmission(
          'updateEntry',
          createEntryValues(targetEntry, {
            title: 'Bewahrter Draft bei feindlichem Error',
          }),
          targetEntry.id
        )
      )
    })
    assert.deepEqual(system.view.lastState.entries, initialLog.entries)
    assert.equal(system.view.lastState.form.type, 'updateEntry')
    assertFeedbackIsRedacted(system.view.lastState, [privateMarker])
  }

  assert.equal(messageGetterCalls, 0)
  assert.equal(fieldGetterCalls, 0)
})

test('fängt fehlende und werfende Mutationsmethoden ohne fremde Meldungen ab', () => {
  const privateMarker = 'fixture-mutation-method-exception-sentinel'
  const services = [
    {
      loadLog() {
        return createLoadSuccess(createPrivateLog())
      },
    },
    {
      loadLog() {
        return createLoadSuccess(createPrivateLog())
      },
      createEntry() {
        throw new Error(privateMarker)
      },
    },
  ]
  const getterService = {
    loadLog() {
      return createLoadSuccess(createPrivateLog())
    },
  }
  Object.defineProperty(getterService, 'createEntry', {
    configurable: true,
    get() {
      throw new Error(privateMarker)
    },
  })
  services.push(getterService)

  for (const service of services) {
    const scheduler = createManualScheduler()
    const view = createViewRecorder()
    const controller = createLichtwaldLogController({
      lichtwaldLogService: service,
      lichtwaldLogView: view,
      scheduleTask: scheduler.scheduleTask,
    })
    controller.open()
    scheduler.run(0)
    view.actions.onOpenCreateEntryForm()

    assert.doesNotThrow(() => {
      view.actions.onSubmitForm(
        createSubmission('createEntry', createEntryValues())
      )
    })
    assert.equal(view.lastState.form.type, 'createEntry')
    assertFeedbackIsRedacted(view.lastState, [privateMarker])
  }
})

test('bindet und verwirft Delete-Bestätigungen ausschließlich schreibfrei an exakte IDs', () => {
  const firstEntry = createEntry()
  const secondEntry = createSecondEntry()
  const system = createControllerSystem()
  const actions = openAndFlush(system)

  for (const invalidId of [
    'missing-entry',
    firstEntry.id.toUpperCase(),
    ' ' + firstEntry.id,
  ]) {
    actions.onRequestDeleteEntry(invalidId)
    assert.equal(system.view.lastState.deleteState.entryId, null)
  }

  actions.onRequestDeleteEntry(firstEntry.id)

  assert.equal(system.view.lastState.deleteState.entryId, firstEntry.id)
  assert.equal(system.view.lastState.deleteState.isSubmitting, false)
  assert.equal(system.serviceDouble.calls.deleteEntry.length, 0)

  actions.onRequestDeleteEntry(secondEntry.id)
  assert.equal(system.view.lastState.deleteState.entryId, firstEntry.id)

  actions.onConfirmDeleteEntry(secondEntry.id)
  assert.equal(system.serviceDouble.calls.deleteEntry.length, 0)
  assert.equal(system.view.lastState.deleteState.entryId, firstEntry.id)

  actions.onCancelDeleteEntry()
  assert.equal(system.view.lastState.deleteState.entryId, null)
  assert.equal(system.serviceDouble.calls.deleteEntry.length, 0)
  assert.equal(system.serviceDouble.calls.loadLog.length, 1)
})

test('löscht fokussiert atomar mit Busy vor genau einem Serviceaufruf und ohne verwaisten Zwischenzustand', () => {
  const targetEntry = createEntry()
  const remainingEntry = createSecondEntry()
  const initialLog = createPrivateLog(
    [targetEntry, remainingEntry],
    { featuredEntryId: targetEntry.id }
  )
  const resultLog = createPrivateLog(
    [remainingEntry],
    { featuredEntryId: null }
  )
  let system
  let closeDuringMutation
  const serviceDouble = createServiceDouble({
    loadResult: createLoadSuccess(initialLog),
    deleteResult(entryId) {
      assert.equal(system.view.lastState.phase, 'mutating')
      assert.equal(system.view.lastState.deleteState.entryId, targetEntry.id)
      assert.equal(system.view.lastState.deleteState.isSubmitting, true)
      assert.deepEqual(system.view.lastState.entries, initialLog.entries)
      assert.equal(system.view.lastState.featuredEntryId, targetEntry.id)
      closeDuringMutation = system.controller.close()
      system.view.actions.onConfirmDeleteEntry(entryId)
      system.view.actions.onSetFeaturedEntry(null)
      return createDeleteSuccess(resultLog, targetEntry.id, true)
    },
  })
  system = createControllerSystem({ serviceDouble })
  const actions = openAndFlush(system)
  actions.onSelectEntry(targetEntry.id)
  actions.onRequestDeleteEntry(targetEntry.id)

  actions.onConfirmDeleteEntry(targetEntry.id)

  assert.equal(closeDuringMutation, false)
  assert.deepEqual(serviceDouble.calls.deleteEntry, [[targetEntry.id]])
  assert.equal(serviceDouble.calls.setFeaturedEntry.length, 0)
  assert.equal(serviceDouble.calls.loadLog.length, 1)
  assert.equal(system.view.lastState.phase, 'ready')
  assert.deepEqual(system.view.lastState.entries, [remainingEntry])
  assert.equal(system.view.lastState.featuredEntryId, null)
  assert.equal(system.view.lastState.selectedEntryId, null)
  assert.equal(system.view.lastState.deleteState.entryId, null)
  assert.notEqual(system.view.lastState.statusMessage, '')
  assert.equal(system.view.lastState.statusMessageTone, 'success')
})

test('reconciled Tag-Schreibweise nach Fokusmutation und fällt nach Delete auf alle Tags zurück', () => {
  const targetEntry = createEntry({
    id: 'lichtwald-entry-filter-tag-target',
    tags: ['WALD'],
  })
  const remainingEntry = createSecondEntry({
    id: 'lichtwald-entry-filter-tag-remaining',
    tags: ['Andere'],
  })
  const initialLog = createPrivateLog([targetEntry, remainingEntry])
  const recasedTarget = createEntry({
    ...targetEntry,
    tags: ['wald'],
  })
  const featuredLog = createPrivateLog(
    [recasedTarget, remainingEntry],
    { featuredEntryId: targetEntry.id }
  )
  const deleteLog = createPrivateLog([remainingEntry])
  const system = createControllerSystem({
    serviceOptions: {
      loadResult: createLoadSuccess(initialLog),
      featuredResult: createFeaturedSuccess(
        featuredLog,
        targetEntry.id,
        true
      ),
      deleteResult: createDeleteSuccess(
        deleteLog,
        targetEntry.id,
        true
      ),
    },
  })
  const actions = openAndFlush(system)

  actions.onChangeTagFilter('WALD')
  assert.deepEqual(system.view.lastState.visibleEntryIds, [targetEntry.id])
  actions.onSetFeaturedEntry(targetEntry.id)

  assert.equal(system.view.lastState.selectedTag, 'wald')
  assert.deepEqual(system.view.lastState.availableTags, ['wald', 'Andere'])
  assert.deepEqual(system.view.lastState.visibleEntryIds, [targetEntry.id])
  assert.equal(system.view.lastState.hasActiveFilters, true)

  actions.onRequestDeleteEntry(targetEntry.id)
  actions.onConfirmDeleteEntry(targetEntry.id)

  assert.equal(system.view.lastState.phase, 'ready')
  assert.equal(system.view.lastState.selectedTag, '')
  assert.deepEqual(system.view.lastState.availableTags, ['Andere'])
  assert.deepEqual(system.view.lastState.visibleEntryIds, [remainingEntry.id])
  assert.equal(system.view.lastState.hasActiveFilters, false)
  assert.equal(system.view.lastState.filteredEmptyState, false)
  assert.equal(system.serviceDouble.calls.setFeaturedEntry.length, 1)
  assert.equal(system.serviceDouble.calls.deleteEntry.length, 1)
  assert.equal(system.serviceDouble.calls.loadLog.length, 1)
})

test('setzt Filter beim autoritativen Übergang zu einem wirklich leeren Snapshot zurück', () => {
  const targetEntry = createEntry({ tags: ['Leerziel'] })
  const emptyLog = createEmptyPrivateLog()
  const system = createControllerSystem({
    serviceOptions: {
      loadResult: createLoadSuccess(createPrivateLog([targetEntry])),
      deleteResult: createDeleteSuccess(emptyLog, targetEntry.id, false),
    },
  })
  const actions = openAndFlush(system)

  actions.onChangeSearchQuery('Prismenkammer')
  actions.onChangeCalendarDateFilter(targetEntry.calendarDate)
  actions.onChangeTagFilter('Leerziel')
  actions.onRequestDeleteEntry(targetEntry.id)
  actions.onConfirmDeleteEntry(targetEntry.id)

  assert.equal(system.view.lastState.phase, 'empty')
  assert.deepEqual(system.view.lastState.entries, [])
  assert.deepEqual(system.view.lastState.visibleEntryIds, [])
  assert.deepEqual(system.view.lastState.availableTags, [])
  assert.equal(system.view.lastState.searchQuery, '')
  assert.equal(system.view.lastState.calendarDateFilter, '')
  assert.equal(system.view.lastState.selectedTag, '')
  assert.equal(system.view.lastState.hasActiveFilters, false)
  assert.equal(system.view.lastState.filteredEmptyState, false)
})

test('erhält bei Delete eines nicht ausgewählten Eintrags eine weiterhin vorhandene Auswahl', () => {
  const deletedEntry = createEntry()
  const selectedEntry = createSecondEntry()
  const initialLog = createPrivateLog([deletedEntry, selectedEntry])
  const resultLog = createPrivateLog([selectedEntry])
  const system = createControllerSystem({
    serviceOptions: {
      loadResult: createLoadSuccess(initialLog),
      deleteResult: createDeleteSuccess(
        resultLog,
        deletedEntry.id,
        false
      ),
    },
  })
  const actions = openAndFlush(system)
  actions.onSelectEntry(selectedEntry.id)
  actions.onRequestDeleteEntry(deletedEntry.id)
  actions.onConfirmDeleteEntry(deletedEntry.id)

  assert.equal(system.view.lastState.selectedEntryId, selectedEntry.id)
  assert.deepEqual(system.view.lastState.entries, [selectedEntry])
  assert.equal(system.serviceDouble.calls.deleteEntry.length, 1)
})

test('behält eine Delete-Bestätigung bei retryfähigem Fehler und redigiert fremde Meldungen', () => {
  const privateMarker = 'fixture-delete-write-error-sentinel'
  const targetEntry = createEntry()
  const initialLog = createPrivateLog()
  const system = createControllerSystem({
    serviceOptions: {
      loadResult: createLoadSuccess(initialLog),
      deleteResult: createMutationFailure({
        status: 'quotaExceeded',
        code: 'storageQuotaExceeded',
        lichtwaldLog: structuredClone(initialLog),
        message: privateMarker,
      }),
    },
  })
  const actions = openAndFlush(system)
  actions.onRequestDeleteEntry(targetEntry.id)
  actions.onConfirmDeleteEntry(targetEntry.id)

  assert.equal(system.view.lastState.phase, 'ready')
  assert.equal(system.view.lastState.deleteState.entryId, targetEntry.id)
  assert.equal(system.view.lastState.deleteState.isSubmitting, false)
  assert.notEqual(system.view.lastState.deleteState.errorMessage, '')
  assert.deepEqual(system.view.lastState.entries, initialLog.entries)
  assertFeedbackIsRedacted(system.view.lastState, [privateMarker])
  assert.equal(system.serviceDouble.calls.deleteEntry.length, 1)
  assert.equal(system.serviceDouble.calls.loadLog.length, 1)
})

test('schließt eine durch den Fehlersnapshot unsichtbar gewordene Delete-Bestätigung', () => {
  const query = 'synthetisches-nebelzeichen'
  const privateMarker = 'fixture-filtered-delete-error-sentinel'
  const targetEntry = createEntry({
    title: `Erfundenes ${query}`,
  })
  const changedTargetEntry = createEntry({
    title: 'Erfundene aktualisierte Laterne',
    text: 'Der autoritative Fehlersnapshot enthält nur neutrale Testwörter.',
    tags: ['Prisma', 'Modell'],
  })
  const remainingEntry = createSecondEntry()
  const initialLog = createPrivateLog([targetEntry, remainingEntry])
  const failureLog = createPrivateLog([changedTargetEntry, remainingEntry])
  const system = createControllerSystem({
    serviceOptions: {
      loadResult: createLoadSuccess(initialLog),
      deleteResult: createMutationFailure({
        status: 'writeFailed',
        code: 'lichtwaldLogStorageWriteFailed',
        lichtwaldLog: failureLog,
        message: privateMarker,
      }),
    },
  })
  const actions = openAndFlush(system)
  actions.onChangeSearchQuery(query)
  actions.onRequestDeleteEntry(targetEntry.id)
  actions.onConfirmDeleteEntry(targetEntry.id)

  assert.deepEqual(system.view.lastState.entries, failureLog.entries)
  assert.deepEqual(system.view.lastState.visibleEntryIds, [])
  assert.equal(system.view.lastState.filteredEmptyState, true)
  assert.equal(system.view.lastState.deleteState.entryId, null)
  assert.equal(system.view.lastState.deleteState.isSubmitting, false)
  assert.equal(system.view.lastState.deleteState.errorMessage, '')
  assert.notEqual(system.view.lastState.errorMessage, '')
  assert.deepEqual(system.view.lastState.focusTarget, { type: 'heading' })
  assertFeedbackIsRedacted(system.view.lastState, [
    privateMarker,
    query,
    targetEntry.id,
    changedTargetEntry.title,
    changedTargetEntry.text,
  ])

  actions.onResetFilters()
  assert.deepEqual(
    system.view.lastState.visibleEntryIds,
    failureLog.entries.map(({ id }) => id)
  )
  actions.onRequestDeleteEntry(targetEntry.id)
  assert.equal(system.view.lastState.deleteState.entryId, targetEntry.id)
  assert.equal(system.serviceDouble.calls.deleteEntry.length, 1)
  assert.equal(system.serviceDouble.calls.loadLog.length, 1)
})

test('schließt eine überholte Delete-Bestätigung anhand eines autoritativen NotFound-Snapshots', () => {
  const targetEntry = createEntry()
  const remainingEntry = createSecondEntry()
  const initialLog = createPrivateLog([targetEntry, remainingEntry])
  const authoritativePreviousLog = createPrivateLog([remainingEntry])
  const privateMarker = 'fixture-delete-not-found-sentinel'
  const system = createControllerSystem({
    serviceOptions: {
      loadResult: createLoadSuccess(initialLog),
      deleteResult: createMutationFailure({
        status: 'notFound',
        code: 'lichtwaldLogEntryNotFound',
        lichtwaldLog: authoritativePreviousLog,
        message: privateMarker,
      }),
    },
  })
  const actions = openAndFlush(system)
  actions.onSelectEntry(targetEntry.id)
  actions.onRequestDeleteEntry(targetEntry.id)
  actions.onConfirmDeleteEntry(targetEntry.id)

  assert.deepEqual(system.view.lastState.entries, [remainingEntry])
  assert.equal(system.view.lastState.selectedEntryId, null)
  assert.equal(system.view.lastState.deleteState.entryId, null)
  assertFeedbackIsRedacted(system.view.lastState, [privateMarker])
})

test('verwirft einen Nicht-NotFound-Deletefehler, dessen Snapshot die Ziel-ID entfernt', () => {
  const targetEntry = createEntry()
  const remainingEntry = createSecondEntry()
  const untrustedEntry = createEntry({
    id: 'lichtwald-entry-rejected-delete-failure-3',
    title: 'Nicht zu übernehmender Delete-Fehlersnapshot',
    text: 'Dieser erfundene Löschwiderspruch bleibt unsichtbar.',
    tags: ['Widerspruch', 'Delete'],
  })
  const initialLog = createPrivateLog([targetEntry, remainingEntry])
  const contradictoryFailureLog = createPrivateLog([
    remainingEntry,
    untrustedEntry,
  ])
  const privateMarker = 'fixture-delete-target-correlation-sentinel'
  const system = createControllerSystem({
    serviceOptions: {
      loadResult: createLoadSuccess(initialLog),
      deleteResult: createMutationFailure({
        status: 'writeFailed',
        code: 'lichtwaldLogStorageWriteFailed',
        lichtwaldLog: contradictoryFailureLog,
        message: privateMarker,
      }),
    },
  })
  const actions = openAndFlush(system)
  actions.onSelectEntry(targetEntry.id)
  actions.onRequestDeleteEntry(targetEntry.id)

  actions.onConfirmDeleteEntry(targetEntry.id)

  assert.deepEqual(system.view.lastState.entries, initialLog.entries)
  assert.equal(
    system.view.lastState.entries.some(({ id }) => id === targetEntry.id),
    true
  )
  assert.equal(
    system.view.lastState.entries.some(({ id }) => id === untrustedEntry.id),
    false
  )
  assert.equal(system.view.lastState.selectedEntryId, targetEntry.id)
  assert.equal(system.view.lastState.deleteState.entryId, targetEntry.id)
  assert.equal(system.view.lastState.deleteState.isSubmitting, false)
  assert.equal(
    system.view.lastState.deleteState.errorMessage,
    'Der LichtwaldLog-Eintrag konnte nicht dauerhaft gelöscht werden. Der gespeicherte Zustand bleibt maßgeblich.'
  )
  assert.equal(system.view.lastState.errorMessage, '')
  assertFeedbackIsRedacted(system.view.lastState, [
    privateMarker,
    targetEntry.id,
    untrustedEntry.id,
    untrustedEntry.title,
    untrustedEntry.text,
  ])
  assert.equal(system.serviceDouble.calls.deleteEntry.length, 1)
  assert.equal(system.serviceDouble.calls.loadLog.length, 1)
})

test('weist inkonsistente Delete-Erfolge zurück und rendert keinen unbestätigten Kandidaten', () => {
  const targetEntry = createEntry()
  const remainingEntry = createSecondEntry()
  const initialLog = createPrivateLog(
    [targetEntry, remainingEntry],
    { featuredEntryId: targetEntry.id }
  )
  const validResultLog = createPrivateLog(
    [remainingEntry],
    { featuredEntryId: null }
  )
  const validSuccess = createDeleteSuccess(
    validResultLog,
    targetEntry.id,
    true
  )
  const malformedResults = [
    { ...validSuccess, deletedEntryId: remainingEntry.id },
    { ...validSuccess, focusCleared: 'true' },
    {
      ...validSuccess,
      lichtwaldLog: createPrivateLog(
        [targetEntry, remainingEntry],
        { featuredEntryId: targetEntry.id }
      ),
    },
    {
      ...validSuccess,
      focusCleared: true,
      lichtwaldLog: createPrivateLog(
        [remainingEntry],
        { featuredEntryId: remainingEntry.id }
      ),
    },
    {
      ...validSuccess,
      lichtwaldLog: createSyntheticLog([remainingEntry]),
    },
    { ...validSuccess, fixtureExtra: 'fixture-delete-extra-sentinel' },
  ]

  for (const deleteResult of malformedResults) {
    const system = createControllerSystem({
      serviceOptions: {
        loadResult: createLoadSuccess(structuredClone(initialLog)),
        deleteResult,
      },
    })
    const actions = openAndFlush(system)
    actions.onRequestDeleteEntry(targetEntry.id)
    actions.onConfirmDeleteEntry(targetEntry.id)

    assert.deepEqual(system.view.lastState.entries, initialLog.entries)
    assert.equal(system.view.lastState.featuredEntryId, targetEntry.id)
    assert.equal(system.view.lastState.deleteState.entryId, targetEntry.id)
    assert.equal(system.serviceDouble.calls.deleteEntry.length, 1)
    assert.equal(system.serviceDouble.calls.loadLog.length, 1)
  }
})

test('leitet einen bereits sichtbaren identischen Fokus trotzdem exakt einmal als Endzustand weiter', () => {
  const targetEntry = createEntry()
  const initialLog = createPrivateLog(
    [targetEntry, createSecondEntry()],
    { featuredEntryId: targetEntry.id }
  )
  let system
  let closeDuringMutation
  const serviceDouble = createServiceDouble({
    loadResult: createLoadSuccess(initialLog),
    featuredResult(entryId) {
      assert.equal(system.view.lastState.phase, 'mutating')
      assert.equal(system.view.lastState.featuredState.isSubmitting, true)
      assert.equal(
        system.view.lastState.featuredState.targetEntryId,
        targetEntry.id
      )
      assert.equal(system.view.lastState.featuredEntryId, targetEntry.id)
      closeDuringMutation = system.controller.close()
      system.view.actions.onSetFeaturedEntry(entryId)
      system.view.actions.onRequestDeleteEntry(targetEntry.id)
      return createFeaturedSuccess(
        structuredClone(initialLog),
        targetEntry.id,
        false
      )
    },
  })
  system = createControllerSystem({ serviceDouble })
  const actions = openAndFlush(system)
  actions.onSelectEntry(createSecondEntry().id)

  actions.onSetFeaturedEntry(targetEntry.id)

  assert.equal(closeDuringMutation, false)
  assert.deepEqual(serviceDouble.calls.setFeaturedEntry, [[targetEntry.id]])
  assert.equal(serviceDouble.calls.deleteEntry.length, 0)
  assert.equal(serviceDouble.calls.loadLog.length, 1)
  assert.equal(system.view.lastState.featuredEntryId, targetEntry.id)
  assert.equal(
    system.view.lastState.selectedEntryId,
    createSecondEntry().id
  )
  assert.equal(system.view.lastState.statusMessageTone, 'notice')
  assert.match(
    system.view.lastState.statusMessage,
    /Keine Änderungen erforderlich/
  )
})

test('leitet auch bereits sichtbares null als expliziten Fokusendzustand weiter', () => {
  const initialLog = createPrivateLog()
  const system = createControllerSystem({
    serviceOptions: {
      loadResult: createLoadSuccess(initialLog),
      featuredResult: createFeaturedSuccess(
        structuredClone(initialLog),
        null,
        false
      ),
    },
  })
  const actions = openAndFlush(system)

  actions.onSetFeaturedEntry(null)

  assert.deepEqual(system.serviceDouble.calls.setFeaturedEntry, [[null]])
  assert.equal(system.view.lastState.featuredEntryId, null)
  assert.equal(system.view.lastState.statusMessageTone, 'notice')
  assert.match(
    system.view.lastState.statusMessage,
    /Keine Änderungen erforderlich/
  )
})

test('entfernt einen gesetzten Fokus über null mit changed true', () => {
  const focusedEntry = createEntry()
  const selectedEntry = createSecondEntry()
  const initialLog = createPrivateLog(
    [focusedEntry, selectedEntry],
    { featuredEntryId: focusedEntry.id }
  )
  const resultLog = createPrivateLog(
    [focusedEntry, selectedEntry],
    { featuredEntryId: null }
  )
  const system = createControllerSystem({
    serviceOptions: {
      loadResult: createLoadSuccess(initialLog),
      featuredResult: createFeaturedSuccess(resultLog, null, true),
    },
  })
  const actions = openAndFlush(system)
  actions.onSelectEntry(selectedEntry.id)

  actions.onSetFeaturedEntry(null)

  assert.deepEqual(system.serviceDouble.calls.setFeaturedEntry, [[null]])
  assert.equal(system.serviceDouble.calls.loadLog.length, 1)
  assert.deepEqual(system.view.lastState.entries, resultLog.entries)
  assert.equal(system.view.lastState.featuredEntryId, null)
  assert.equal(system.view.lastState.selectedEntryId, selectedEntry.id)
  assert.equal(system.view.lastState.statusMessageTone, 'success')
  assert.equal(
    system.view.lastState.statusMessage,
    'Der LichtwaldLog-Fokus wurde entfernt.'
  )
  assert.equal(system.view.lastState.featuredState.isSubmitting, false)
  assert.equal(system.view.lastState.featuredState.targetEntryId, null)
  assert.equal(system.view.lastState.featuredState.errorMessage, '')
})

test('setzt Fokus ohne Toggle oder optimistische Änderung und übernimmt nur den Ergebnis-Snapshot', () => {
  const firstEntry = createEntry()
  const secondEntry = createSecondEntry()
  const concurrentEntry = createEntry({
    id: 'lichtwald-entry-focus-concurrent-3',
    calendarDate: '2041-06-08',
    title: 'Erfundene Fokus-Zusatzkarte',
    text: 'Ein frei erfundener zusätzlicher Inhalt.',
    tags: ['Fokus', 'Parallel'],
  })
  const initialLog = createPrivateLog([firstEntry, secondEntry])
  const resultLog = createPrivateLog(
    [secondEntry, concurrentEntry, firstEntry],
    { featuredEntryId: secondEntry.id }
  )
  let observedFocusDuringCall
  const system = createControllerSystem({
    serviceOptions: {
      loadResult: createLoadSuccess(initialLog),
      featuredResult() {
        observedFocusDuringCall =
          system.view.lastState.featuredEntryId
        return createFeaturedSuccess(resultLog, secondEntry.id, true)
      },
    },
  })
  const actions = openAndFlush(system)
  actions.onSelectEntry(firstEntry.id)

  for (const invalidId of [
    'missing',
    secondEntry.id.toUpperCase(),
    ' ' + secondEntry.id,
    undefined,
    false,
  ]) {
    const callCount = system.serviceDouble.calls.setFeaturedEntry.length
    actions.onSetFeaturedEntry(invalidId)
    assert.equal(
      system.serviceDouble.calls.setFeaturedEntry.length,
      callCount
    )
  }

  actions.onSetFeaturedEntry(secondEntry.id)

  assert.equal(observedFocusDuringCall, null)
  assert.deepEqual(system.serviceDouble.calls.setFeaturedEntry, [
    [secondEntry.id],
  ])
  assert.equal(system.view.lastState.featuredEntryId, secondEntry.id)
  assert.deepEqual(system.view.lastState.entries, resultLog.entries)
  assert.deepEqual(getEntryIds(system.view.lastState), [
    secondEntry.id,
    concurrentEntry.id,
    firstEntry.id,
  ])
  assert.equal(system.view.lastState.selectedEntryId, firstEntry.id)
  assert.equal(
    system.view.lastState.entries.some((entry) =>
      Object.hasOwn(entry, 'isFeatured')
    ),
    false
  )
  assert.equal(system.serviceDouble.calls.loadLog.length, 1)
})

test('erhält Fokus und Auswahl bei dokumentierten Fokusfehlern ohne Optimismus', () => {
  const failurePairs = [
    ['notFound', 'lichtwaldLogEntryNotFound'],
    ['readFailed', 'lichtwaldLogStorageReadFailed'],
    ['writeFailed', 'lichtwaldLogStorageWriteFailed'],
    ['quotaExceeded', 'storageQuotaExceeded'],
    ['storageFailed', 'unexpectedStorageResult'],
  ]
  const firstEntry = createEntry()
  const secondEntry = createSecondEntry()
  const initialLog = createPrivateLog(
    [firstEntry, secondEntry],
    { featuredEntryId: firstEntry.id }
  )

  for (const [status, code] of failurePairs) {
    const privateMarker = 'fixture-featured-' + status + '-' + code
    const system = createControllerSystem({
      serviceOptions: {
        loadResult: createLoadSuccess(structuredClone(initialLog)),
        featuredResult: createMutationFailure({
          status,
          code,
          lichtwaldLog: structuredClone(initialLog),
          message: privateMarker,
        }),
      },
    })
    const actions = openAndFlush(system)
    actions.onSelectEntry(firstEntry.id)
    actions.onSetFeaturedEntry(secondEntry.id)

    assert.equal(system.view.lastState.featuredEntryId, firstEntry.id)
    assert.equal(system.view.lastState.selectedEntryId, firstEntry.id)
    assert.deepEqual(system.view.lastState.entries, initialLog.entries)
    assert.equal(system.view.lastState.featuredState.isSubmitting, false)
    assert.notEqual(system.view.lastState.featuredState.errorMessage, '')
    assertFeedbackIsRedacted(system.view.lastState, [privateMarker])
    assert.equal(system.serviceDouble.calls.setFeaturedEntry.length, 1)
    assert.equal(system.serviceDouble.calls.loadLog.length, 1)
  }
})

test('reconciled einen entfernten Fokusziel-Entry aus autoritativem NotFound-Fehlersnapshot', () => {
  const firstEntry = createEntry()
  const targetEntry = createSecondEntry()
  const initialLog = createPrivateLog(
    [firstEntry, targetEntry],
    { featuredEntryId: firstEntry.id }
  )
  const authoritativePreviousLog = createPrivateLog(
    [firstEntry],
    { featuredEntryId: firstEntry.id }
  )
  const system = createControllerSystem({
    serviceOptions: {
      loadResult: createLoadSuccess(initialLog),
      featuredResult: createMutationFailure({
        status: 'notFound',
        code: 'lichtwaldLogEntryNotFound',
        lichtwaldLog: authoritativePreviousLog,
      }),
    },
  })
  const actions = openAndFlush(system)
  actions.onSelectEntry(targetEntry.id)
  actions.onSetFeaturedEntry(targetEntry.id)

  assert.deepEqual(system.view.lastState.entries, [firstEntry])
  assert.equal(system.view.lastState.featuredEntryId, firstEntry.id)
  assert.equal(system.view.lastState.selectedEntryId, null)
  assert.equal(system.view.lastState.featuredState.isSubmitting, false)
})

test('verwirft einen Nicht-NotFound-Fokusfehler, dessen Snapshot die Ziel-ID entfernt', () => {
  const focusedEntry = createEntry()
  const targetEntry = createSecondEntry()
  const untrustedEntry = createEntry({
    id: 'lichtwald-entry-rejected-featured-failure-3',
    title: 'Nicht zu übernehmender Fokus-Fehlersnapshot',
    text: 'Dieser frei erfundene Fokuswiderspruch bleibt unsichtbar.',
    tags: ['Widerspruch', 'Fokus'],
  })
  const initialLog = createPrivateLog(
    [focusedEntry, targetEntry],
    { featuredEntryId: focusedEntry.id }
  )
  const contradictoryFailureLog = createPrivateLog(
    [focusedEntry, untrustedEntry],
    { featuredEntryId: focusedEntry.id }
  )
  const privateMarker = 'fixture-featured-target-correlation-sentinel'
  const system = createControllerSystem({
    serviceOptions: {
      loadResult: createLoadSuccess(initialLog),
      featuredResult: createMutationFailure({
        status: 'writeFailed',
        code: 'lichtwaldLogStorageWriteFailed',
        lichtwaldLog: contradictoryFailureLog,
        message: privateMarker,
      }),
    },
  })
  const actions = openAndFlush(system)
  actions.onSelectEntry(targetEntry.id)

  actions.onSetFeaturedEntry(targetEntry.id)

  assert.deepEqual(system.view.lastState.entries, initialLog.entries)
  assert.equal(
    system.view.lastState.entries.some(({ id }) => id === targetEntry.id),
    true
  )
  assert.equal(
    system.view.lastState.entries.some(({ id }) => id === untrustedEntry.id),
    false
  )
  assert.equal(system.view.lastState.featuredEntryId, focusedEntry.id)
  assert.equal(system.view.lastState.selectedEntryId, targetEntry.id)
  assert.equal(system.view.lastState.featuredState.isSubmitting, false)
  assert.equal(system.view.lastState.featuredState.targetEntryId, targetEntry.id)
  assert.equal(
    system.view.lastState.featuredState.errorMessage,
    'Der LichtwaldLog-Fokus konnte nicht gespeichert werden. Der gespeicherte Zustand bleibt maßgeblich.'
  )
  assertFeedbackIsRedacted(system.view.lastState, [
    privateMarker,
    targetEntry.id,
    untrustedEntry.id,
    untrustedEntry.title,
    untrustedEntry.text,
  ])
  assert.equal(system.serviceDouble.calls.setFeaturedEntry.length, 1)
  assert.equal(system.serviceDouble.calls.loadLog.length, 1)
})

test('weist inkonsistente und malformed Fokuserfolge ohne Snapshotmutation zurück', () => {
  const firstEntry = createEntry()
  const targetEntry = createSecondEntry()
  const initialLog = createPrivateLog(
    [firstEntry, targetEntry],
    { featuredEntryId: firstEntry.id }
  )
  const validResultLog = createPrivateLog(
    [firstEntry, targetEntry],
    { featuredEntryId: targetEntry.id }
  )
  const validSuccess = createFeaturedSuccess(
    validResultLog,
    targetEntry.id,
    true
  )
  const malformedResults = [
    { ...validSuccess, featuredEntryId: firstEntry.id },
    {
      ...validSuccess,
      lichtwaldLog: createPrivateLog(
        [firstEntry, targetEntry],
        { featuredEntryId: firstEntry.id }
      ),
    },
    {
      ...validSuccess,
      lichtwaldLog: createPrivateLog(
        [firstEntry],
        { featuredEntryId: firstEntry.id }
      ),
    },
    {
      ...validSuccess,
      lichtwaldLog: createSyntheticLog(
        [firstEntry, targetEntry],
        { featuredEntryId: targetEntry.id }
      ),
    },
    { ...validSuccess, changed: 'true' },
    { ...validSuccess, fixtureExtra: 'fixture-focus-extra-sentinel' },
    Promise.resolve(validSuccess),
  ]

  for (const featuredResult of malformedResults) {
    const system = createControllerSystem({
      serviceOptions: {
        loadResult: createLoadSuccess(structuredClone(initialLog)),
        featuredResult,
      },
    })
    const actions = openAndFlush(system)
    actions.onSetFeaturedEntry(targetEntry.id)

    assert.deepEqual(system.view.lastState.entries, initialLog.entries)
    assert.equal(system.view.lastState.featuredEntryId, firstEntry.id)
    assert.equal(system.serviceDouble.calls.setFeaturedEntry.length, 1)
    assert.equal(system.serviceDouble.calls.loadLog.length, 1)
  }
})

test('weist malformed Create-Erfolge einschließlich geteilter Resultatreferenzen zurück', () => {
  const initialEntry = createEntry()
  const createdEntry = createSecondEntry()
  const initialLog = createPrivateLog([initialEntry])
  const resultLog = createPrivateLog([initialEntry, createdEntry])
  const validSuccess = createCreateSuccess(resultLog, createdEntry)
  const sharedEntryResult = {
    ok: true,
    status: 'entryCreated',
    changed: true,
    createdEntry: resultLog.entries.at(-1),
    lichtwaldLog: resultLog,
  }
  const detachedEntryWithSharedTags = {
    ...validSuccess,
    createdEntry: {
      ...createdEntry,
      tags: resultLog.entries.at(-1).tags,
    },
  }
  const malformedResults = [
    { ...validSuccess, changed: false },
    { ...validSuccess, createdEntry: initialEntry },
    {
      ...validSuccess,
      createdEntry: {
        ...createdEntry,
        title: 'Abweichender Created-Resultat-Titel',
      },
    },
    {
      ...validSuccess,
      lichtwaldLog: createSyntheticLog([initialEntry, createdEntry]),
    },
    { ...validSuccess, fixtureExtra: 'fixture-create-extra-sentinel' },
    sharedEntryResult,
    detachedEntryWithSharedTags,
    Promise.resolve(validSuccess),
  ]

  for (const createResult of malformedResults) {
    const system = createControllerSystem({
      serviceOptions: {
        loadResult: createLoadSuccess(structuredClone(initialLog)),
        createResult,
      },
    })
    const actions = openAndFlush(system)
    actions.onOpenCreateEntryForm()
    const submission = createSubmission(
      'createEntry',
      createEntryValues(createdEntry)
    )
    actions.onSubmitForm(submission)

    assert.deepEqual(system.view.lastState.entries, initialLog.entries)
    assert.equal(system.view.lastState.selectedEntryId, null)
    assert.equal(system.view.lastState.form.type, 'createEntry')
    assert.deepEqual(system.view.lastState.form.values, {
      calendarDate: submission.calendarDate,
      title: submission.title,
      text: submission.text,
      tags: submission.tags,
    })
    assert.equal(system.serviceDouble.calls.createEntry.length, 1)
    assert.equal(system.serviceDouble.calls.loadLog.length, 1)
  }
})

test('entkoppelt Serviceergebnisse dauerhaft von interner Projektion und späteren Rendern', () => {
  const initialLog = createPrivateLog()
  const loadResult = createLoadSuccess(initialLog)
  const system = createControllerSystem({
    serviceOptions: { loadResult },
  })
  const actions = openAndFlush(system)
  const firstReadyView = system.view.lastState

  initialLog.entries[0].title = 'Nachträglich mutierter Load-Titel'
  initialLog.entries[0].tags[0] = 'Nachträglich mutierter Load-Tag'
  loadResult.status = 'empty'
  actions.onSelectEntry(createEntry().id)
  const selectedView = system.view.lastState

  assert.equal(selectedView.entries[0].title, createEntry().title)
  assert.deepEqual(selectedView.entries[0].tags, createEntry().tags)
  assert.notStrictEqual(selectedView, firstReadyView)
  assert.notStrictEqual(selectedView.entries, firstReadyView.entries)
  assert.notStrictEqual(
    selectedView.visibleEntryIds,
    firstReadyView.visibleEntryIds
  )
  assert.notStrictEqual(
    selectedView.availableTags,
    firstReadyView.availableTags
  )
  assert.notStrictEqual(selectedView.entries[0], firstReadyView.entries[0])
  assert.notStrictEqual(
    selectedView.entries[0].tags,
    firstReadyView.entries[0].tags
  )
  assert.notStrictEqual(
    selectedView.deleteState,
    firstReadyView.deleteState
  )
  assert.notStrictEqual(
    selectedView.featuredState,
    firstReadyView.featuredState
  )

  actions.onOpenUpdateEntryForm(createEntry().id)
  const firstFormView = system.view.lastState
  actions.onUpdateFormField('title', 'Neuer synthetischer Draft-Titel')
  const secondFormView = system.view.lastState

  assert.notStrictEqual(secondFormView.form, firstFormView.form)
  assert.notStrictEqual(secondFormView.form.values, firstFormView.form.values)
  assert.notStrictEqual(
    secondFormView.form.values.tags,
    firstFormView.form.values.tags
  )
  assert.deepEqual(firstFormView.form.values, createEntryValues(createEntry()))
  assertViewModelContract(firstReadyView)
  assertViewModelContract(selectedView)
  assertViewModelContract(firstFormView)
  assertViewModelContract(secondFormView)
})

test('bleibt nach nachträglicher Mutation eines erfolgreichen Serviceergebnisses unverändert', () => {
  const initialEntry = createEntry()
  const createdEntry = createSecondEntry({
    id: 'lichtwald-entry-result-detached-2',
  })
  const resultLog = createPrivateLog([initialEntry, createdEntry])
  const createResult = createCreateSuccess(resultLog, createdEntry)
  const expectedEntries = structuredClone(resultLog.entries)
  const system = createControllerSystem({
    serviceOptions: {
      loadResult: createLoadSuccess(createPrivateLog([initialEntry])),
      createResult,
    },
  })
  const actions = openAndFlush(system)
  actions.onOpenCreateEntryForm()
  actions.onSubmitForm(
    createSubmission('createEntry', createEntryValues(createdEntry))
  )

  createResult.createdEntry.title = 'Nachträglich mutierter Resultat-Titel'
  createResult.createdEntry.tags[0] = 'Nachträglich mutiert'
  createResult.lichtwaldLog.entries[0].text =
    'Nachträglich mutierter Bestandstext'
  createResult.lichtwaldLog.entries[1].title =
    'Nachträglich mutierter Log-Titel'
  createResult.lichtwaldLog.entries[1].tags.push('Nachträglich')
  actions.onBackToOverview()

  assert.deepEqual(system.view.lastState.entries, expectedEntries)
  assert.deepEqual(system.view.lastState.visibleEntryIds, expectedEntries.map(
    ({ id }) => id
  ))
  assert.deepEqual(system.view.lastState.availableTags, [
    'Prisma',
    'Fiktiv',
    'Komet',
    'Modell',
  ])
  assert.equal(system.view.lastState.selectedEntryId, null)
  assert.notStrictEqual(
    system.view.lastState.entries,
    createResult.lichtwaldLog.entries
  )
  assert.notStrictEqual(
    system.view.lastState.entries[1].tags,
    createResult.lichtwaldLog.entries[1].tags
  )
})

test('wehrt Mutationsversuche eines View-Ports auf Einträge, Tags, Formular und Fokusziel ab', () => {
  const mutationErrors = []
  const view = createViewRecorder({
    renderHook(viewModel) {
      const attempts = [
        () => viewModel.entries.push(createSecondEntry()),
        () => viewModel.visibleEntryIds.push('view-visible-id-mutation'),
        () => viewModel.availableTags.push('View-Filter-Tag-Mutation'),
        () => {
          viewModel.searchQuery = 'View-Query-Mutation'
        },
        () => {
          viewModel.hasActiveFilters = false
        },
        () => {
          if (viewModel.entries[0]) {
            viewModel.entries[0].title = 'View-Mutation'
          }
        },
        () => {
          if (viewModel.entries[0]?.tags[0]) {
            viewModel.entries[0].tags[0] = 'View-Tag-Mutation'
          }
        },
        () => {
          if (viewModel.form) {
            viewModel.form.values.title = 'View-Form-Mutation'
          }
        },
        () => {
          if (viewModel.form) {
            viewModel.form.values.tags.push('View-Form-Tag')
          }
        },
        () => {
          if (viewModel.focusTarget) {
            viewModel.focusTarget.type = 'viewMutation'
          }
        },
      ]

      for (const attempt of attempts) {
        try {
          attempt()
        } catch (error) {
          mutationErrors.push(error)
        }
      }
    },
  })
  const updatedEntry = createEntry({
    title: 'Vom Controller bewahrter Draft-Titel',
  })
  const resultLog = createPrivateLog([
    updatedEntry,
    createSecondEntry(),
  ])
  const system = createControllerSystem({
    view,
    serviceOptions: {
      updateResult: createUpdateSuccess(
        resultLog,
        updatedEntry.id,
        true
      ),
    },
  })
  const actions = openAndFlush(system)
  actions.onSelectEntry(updatedEntry.id)
  actions.onOpenUpdateEntryForm(updatedEntry.id)
  actions.onUpdateFormField('title', updatedEntry.title)

  assert.equal(
    view.renders.some(({ viewModel }) => viewModel.focusTarget !== null),
    true
  )

  actions.onSubmitForm(
    createSubmission(
      'updateEntry',
      system.view.lastState.form.values,
      updatedEntry.id
    )
  )

  assert.ok(mutationErrors.length > 0)
  assert.equal(system.serviceDouble.calls.updateEntry.length, 1)
  assert.equal(
    system.serviceDouble.calls.updateEntry[0][1].title,
    updatedEntry.title
  )
  assert.deepEqual(system.view.lastState.entries, resultLog.entries)
  assert.equal(system.view.lastState.form, null)
})

test('entfernt Success- oder Notice-Feedback bei Filteränderungen ohne private Werte zu spiegeln', () => {
  const privateQuery = 'SYNTHETIC-PRIVATE-FILTER-QUERY-MARKER'
  const privateTag = 'SYNTH-PRIVATE-FILTER-TAG'
  const privateId = 'lichtwald-entry-private-filter-feedback-marker'
  const entry = createEntry({
    id: privateId,
    title: privateQuery,
    tags: [privateTag],
  })
  const initialLog = createPrivateLog([entry])
  const system = createControllerSystem({
    serviceOptions: {
      loadResult: createLoadSuccess(initialLog),
      featuredResult: createFeaturedSuccess(initialLog, null, false),
    },
  })
  const actions = openAndFlush(system)

  actions.onSetFeaturedEntry(null)
  assert.notEqual(system.view.lastState.statusMessage, '')
  assert.equal(system.view.lastState.statusMessageTone, 'notice')

  actions.onChangeSearchQuery(privateQuery)
  assert.equal(system.view.lastState.statusMessage, '')
  actions.onChangeCalendarDateFilter(entry.calendarDate)
  actions.onChangeTagFilter(privateTag)

  const protectedProjection = JSON.stringify({
    statusMessage: system.view.lastState.statusMessage,
    errorMessage: system.view.lastState.errorMessage,
    focusTarget: system.view.lastState.focusTarget,
    formError: system.view.lastState.form?.errorMessage ?? '',
    deleteError: system.view.lastState.deleteState.errorMessage,
    featuredError: system.view.lastState.featuredState.errorMessage,
  })
  for (const privateMarker of [
    privateQuery,
    privateTag,
    entry.calendarDate,
    privateId,
  ]) {
    assert.equal(protectedProjection.includes(privateMarker), false)
  }
  assert.deepEqual(system.view.lastState.focusTarget, { type: 'tagFilter' })
  assert.equal(system.serviceDouble.calls.loadLog.length, 1)
  assert.equal(system.serviceDouble.calls.setFeaturedEntry.length, 1)
})

test('behandelt markupähnlichen Inhalt ausschließlich als opaken Plain Text und protokolliert nichts', () => {
  const markupText =
    '<script>fixture-markup-private-sentinel</script> & <b>Nur Text</b>'
  const markupEntry = createEntry({ text: markupText })
  const consoleMethods = ['log', 'warn', 'error', 'info', 'debug', 'trace']
  const originalDescriptors = new Map()
  let consoleCalls = 0

  for (const methodName of consoleMethods) {
    originalDescriptors.set(
      methodName,
      Object.getOwnPropertyDescriptor(console, methodName)
    )
    Object.defineProperty(console, methodName, {
      configurable: true,
      writable: true,
      value() {
        consoleCalls += 1
      },
    })
  }

  try {
    const system = createControllerSystem({
      serviceOptions: {
        loadResult: createLoadSuccess(createPrivateLog([markupEntry])),
      },
    })
    const actions = openAndFlush(system)
    actions.onSelectEntry(markupEntry.id)
    actions.onOpenUpdateEntryForm(markupEntry.id)

    assert.equal(system.view.lastState.entries[0].text, markupText)
    assert.equal(system.view.lastState.form.values.text, markupText)
    assertFeedbackIsRedacted(system.view.lastState, [markupText])
    assert.equal(consoleCalls, 0)
  } finally {
    for (const [methodName, descriptor] of originalDescriptors) {
      if (descriptor) {
        Object.defineProperty(console, methodName, descriptor)
      } else {
        delete console[methodName]
      }
    }
  }
})

test('berührt weder globalThis.localStorage noch fremde Service-, Storage- oder Adapterports', () => {
  const privateMarker = 'fixture-forbidden-port-access-sentinel'
  const localStorageDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    'localStorage'
  )
  let localStorageGetterCalls = 0
  const forbiddenGetterCalls = []
  const service = {
    loadLog() {
      return createLoadSuccess(createPrivateLog())
    },
  }

  for (const propertyName of [
    'lichtwaldLogStorage',
    'storageAdapter',
    'readJson',
    'writeJson',
    'saveLichtwaldLog',
    'fixtureForeignMethod',
  ]) {
    Object.defineProperty(service, propertyName, {
      configurable: true,
      get() {
        forbiddenGetterCalls.push(propertyName)
        throw new Error(privateMarker)
      },
    })
  }

  if (!localStorageDescriptor?.configurable) {
    assert.equal(localStorageDescriptor, undefined)
  }

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      localStorageGetterCalls += 1
      throw new Error(privateMarker)
    },
  })

  try {
    const scheduler = createManualScheduler()
    const view = createViewRecorder()
    const controller = createLichtwaldLogController({
      lichtwaldLogService: service,
      lichtwaldLogView: view,
      scheduleTask: scheduler.scheduleTask,
    })

    assert.doesNotThrow(() => {
      controller.open()
      scheduler.run(0)
      const scheduleCalls = scheduler.scheduleCalls
      view.actions.onChangeSearchQuery('Prismenkammer')
      view.actions.onChangeCalendarDateFilter(createEntry().calendarDate)
      view.actions.onChangeTagFilter('Prisma')
      view.actions.onResetFilters()
      assert.equal(scheduler.scheduleCalls, scheduleCalls)
      view.actions.onSelectEntry(createEntry().id)
      view.actions.onBackToOverview()
      controller.close()
    })
    assert.equal(localStorageGetterCalls, 0)
    assert.deepEqual(forbiddenGetterCalls, [])
    assertFeedbackIsRedacted(view.lastState, [privateMarker])
  } finally {
    if (localStorageDescriptor) {
      Object.defineProperty(
        globalThis,
        'localStorage',
        localStorageDescriptor
      )
    } else {
      delete globalThis.localStorage
    }
  }
})

function createRealControllerSystem(fakeStorage, generatedIds = []) {
  let generatedIdIndex = 0
  const storageAdapter = createStorageAdapter(fakeStorage)
  const lichtwaldLogStorage = createLichtwaldLogStorage(storageAdapter)
  const lichtwaldLogService = createLichtwaldLogService({
    lichtwaldLogStorage,
    generateLichtwaldLogEntryId() {
      const generatedId = generatedIds[generatedIdIndex]
      generatedIdIndex += 1
      return generatedId
    },
  })
  const scheduler = createManualScheduler()
  const view = createViewRecorder()
  const controller = createLichtwaldLogController({
    lichtwaldLogService,
    lichtwaldLogView: view,
    scheduleTask: scheduler.scheduleTask,
  })

  return {
    controller,
    lichtwaldLogService,
    lichtwaldLogStorage,
    scheduler,
    storageAdapter,
    view,
  }
}

test('persistiert den realen In-Memory-Fluss ausschließlich über Service, Storage und Adapter', () => {
  const fakeStorage = new FakeStorage()

  const missingSystem = createRealControllerSystem(fakeStorage)
  const missingActions = openAndFlush(missingSystem)

  assert.equal(missingSystem.view.lastState.phase, 'empty')
  assert.equal(fakeStorage.setItemCalls, 0)
  assert.equal(fakeStorage.peek(LICHTWALD_LOG_STORAGE_KEY), null)
  missingActions.onRetryLoad()
  missingActions.onOpenCreateEntryForm()
  missingActions.onCancelForm()
  assert.equal(missingSystem.controller.close(), true)
  assert.equal(fakeStorage.setItemCalls, 0)
  assert.equal(fakeStorage.peek(LICHTWALD_LOG_STORAGE_KEY), null)

  const entryId = 'lichtwald-entry-real-in-memory-1'
  const createValues = {
    calendarDate: '2042-03-15',
    title: 'Erfundene In-Memory-Prismenkarte',
    text: 'Vollständig synthetischer persistenter Testinhalt.',
    tags: ['Integration', 'Prisma'],
  }
  const createSystem = createRealControllerSystem(
    fakeStorage,
    [entryId]
  )
  const createActions = openAndFlush(createSystem)
  createActions.onOpenCreateEntryForm()
  createActions.onSubmitForm(
    createSubmission('createEntry', createValues)
  )

  assert.equal(createSystem.view.lastState.phase, 'ready')
  assert.equal(createSystem.view.lastState.selectedEntryId, entryId)
  assert.deepEqual(createSystem.view.lastState.entries, [
    { id: entryId, ...createValues },
  ])
  assert.equal(fakeStorage.setItemCalls, 1)
  assert.notEqual(fakeStorage.peek(LICHTWALD_LOG_STORAGE_KEY), null)
  assert.equal(createSystem.controller.close(), true)

  const updateSystem = createRealControllerSystem(fakeStorage)
  const updateActions = openAndFlush(updateSystem)

  assert.equal(updateSystem.view.lastState.selectedEntryId, null)
  assert.equal(updateSystem.view.lastState.form, null)
  assert.equal(updateSystem.view.lastState.deleteState.entryId, null)
  assert.equal(updateSystem.view.lastState.statusMessage, '')
  assert.equal(updateSystem.view.lastState.errorMessage, '')
  assert.equal(
    updateSystem.view.lastState.focusTarget?.entryId ?? null,
    null
  )
  assert.deepEqual(updateSystem.view.lastState.entries, [
    { id: entryId, ...createValues },
  ])

  const updateValues = {
    calendarDate: '2400-02-29',
    title: 'Aktualisierte erfundene In-Memory-Karte',
    text: 'Ein dauerhaft aktualisierter, frei erfundener Testinhalt.',
    tags: ['Aktualisiert', 'Integration'],
  }
  updateActions.onChangeSearchQuery(createValues.title)
  updateActions.onChangeCalendarDateFilter(createValues.calendarDate)
  updateActions.onChangeTagFilter(createValues.tags[0])
  updateActions.onSelectEntry(entryId)
  updateActions.onOpenUpdateEntryForm(entryId)
  updateActions.onSubmitForm(
    createSubmission('updateEntry', updateValues, entryId)
  )
  updateActions.onSetFeaturedEntry(entryId)

  assert.deepEqual(updateSystem.view.lastState.entries, [
    { id: entryId, ...updateValues },
  ])
  assert.equal(updateSystem.view.lastState.featuredEntryId, entryId)
  assert.equal(updateSystem.view.lastState.selectedEntryId, entryId)
  assert.equal(updateSystem.controller.close(), true)

  const storedRootAfterUpdate = JSON.parse(
    fakeStorage.peek(LICHTWALD_LOG_STORAGE_KEY)
  )
  assertExactOwnKeys(storedRootAfterUpdate, [
    'schemaVersion',
    'dataOrigin',
    'featuredEntryId',
    'entries',
  ])
  assert.equal(storedRootAfterUpdate.schemaVersion, 1)
  assert.equal(storedRootAfterUpdate.dataOrigin, 'private')
  assert.equal(storedRootAfterUpdate.featuredEntryId, entryId)
  assert.deepEqual(storedRootAfterUpdate.entries, [
    { id: entryId, ...updateValues },
  ])
  assert.equal(Object.hasOwn(storedRootAfterUpdate, 'selectedEntryId'), false)
  assert.equal(Object.hasOwn(storedRootAfterUpdate, 'form'), false)
  assert.equal(Object.hasOwn(storedRootAfterUpdate, 'deleteState'), false)
  assert.equal(Object.hasOwn(storedRootAfterUpdate, 'statusMessage'), false)
  assert.equal(Object.hasOwn(storedRootAfterUpdate, 'focusTarget'), false)
  for (const transientFilterProperty of [
    'searchQuery',
    'calendarDateFilter',
    'selectedTag',
    'availableTags',
    'visibleEntryIds',
    'hasActiveFilters',
    'filteredEmptyState',
  ]) {
    assert.equal(
      Object.hasOwn(storedRootAfterUpdate, transientFilterProperty),
      false
    )
  }

  const confirmationSystem = createRealControllerSystem(fakeStorage)
  const confirmationActions = openAndFlush(confirmationSystem)
  assert.deepEqual(confirmationSystem.view.lastState.entries, [
    { id: entryId, ...updateValues },
  ])
  assert.equal(
    confirmationSystem.view.lastState.featuredEntryId,
    entryId
  )
  assert.equal(confirmationSystem.view.lastState.selectedEntryId, null)
  assert.equal(confirmationSystem.view.lastState.statusMessage, '')
  confirmationActions.onRequestDeleteEntry(entryId)
  assert.equal(
    confirmationSystem.view.lastState.deleteState.entryId,
    entryId
  )
  assert.equal(confirmationSystem.controller.close(), true)

  const deleteSystem = createRealControllerSystem(fakeStorage)
  const deleteActions = openAndFlush(deleteSystem)
  assert.equal(deleteSystem.view.lastState.deleteState.entryId, null)
  assert.equal(deleteSystem.view.lastState.featuredEntryId, entryId)
  deleteActions.onRequestDeleteEntry(entryId)
  deleteActions.onConfirmDeleteEntry(entryId)

  assert.equal(deleteSystem.view.lastState.phase, 'empty')
  assert.deepEqual(deleteSystem.view.lastState.entries, [])
  assert.equal(deleteSystem.view.lastState.featuredEntryId, null)
  assert.equal(deleteSystem.view.lastState.selectedEntryId, null)
  assert.equal(deleteSystem.view.lastState.deleteState.entryId, null)
  assert.equal(deleteSystem.controller.close(), true)

  const finalSystem = createRealControllerSystem(fakeStorage)
  openAndFlush(finalSystem)
  assert.equal(finalSystem.view.lastState.phase, 'empty')
  assert.deepEqual(finalSystem.view.lastState.entries, [])
  assert.equal(finalSystem.view.lastState.featuredEntryId, null)
  assert.equal(finalSystem.view.lastState.selectedEntryId, null)
  assert.equal(finalSystem.view.lastState.form, null)
  assert.equal(finalSystem.view.lastState.deleteState.entryId, null)
  assert.equal(finalSystem.view.lastState.statusMessage, '')
  assert.equal(
    finalSystem.view.lastState.focusTarget?.entryId ?? null,
    null
  )

  const finalStoredRoot = JSON.parse(
    fakeStorage.peek(LICHTWALD_LOG_STORAGE_KEY)
  )
  assert.deepEqual(finalStoredRoot, createEmptyPrivateLog())
  assert.equal(LICHTWALD_LOG_STORAGE_KEY, 'goldendawn.lichtwaldLog.content.v1')
  assert.equal(LICHTWALD_LOG_MAX_SERIALIZED_LENGTH, 500_000)
})

test('verwirft ein Tags-Update, wenn ein Proxy das Formular während der Reflection abbricht', () => {
  const system = createControllerSystem()
  const actions = openAndFlush(system)
  actions.onOpenCreateEntryForm()
  actions.onUpdateFormField(
    'title',
    'Bewahrter synthetischer Reentranz-Draft'
  )
  const renderCountBeforeProxy = system.view.renders.length
  let prototypeTrapCalls = 0
  const tagsTarget = ['Reentranz', 'Fiktiv']
  const reentrantTags = new Proxy(tagsTarget, {
    getPrototypeOf(target) {
      prototypeTrapCalls += 1
      actions.onCancelForm()
      return Reflect.getPrototypeOf(target)
    },
  })

  assert.doesNotThrow(() => {
    actions.onUpdateFormField('tags', reentrantTags)
  })

  assert.equal(prototypeTrapCalls, 1)
  assert.equal(system.view.renders.length, renderCountBeforeProxy + 1)
  assert.equal(system.view.lastState.phase, 'ready')
  assert.equal(system.view.lastState.form, null)
  assertNoMutationCalls(system.serviceDouble)
  assert.equal(system.serviceDouble.calls.loadLog.length, 1)

  actions.onOpenCreateEntryForm()
  assert.deepEqual(system.view.lastState.form.values, {
    calendarDate: '',
    title: '',
    text: '',
    tags: [],
  })
})

test('lässt einen reentranten Load-Result-Proxy keinen neuen Lifecycle mit altem Snapshot überschreiben', () => {
  const staleEntry = createEntry({
    id: 'lichtwald-entry-stale-load-reflection',
    title: 'Veraltete erfundene Reflection-Karte',
  })
  const freshEntry = createSecondEntry({
    id: 'lichtwald-entry-fresh-load-reflection',
    title: 'Neue erfundene Reflection-Karte',
  })
  const staleResultTarget = createLoadSuccess(
    createPrivateLog([staleEntry])
  )
  let system
  let lifecycleReentered = false
  let closeResult
  const staleResultProxy = new Proxy(staleResultTarget, {
    getPrototypeOf(target) {
      if (!lifecycleReentered) {
        lifecycleReentered = true
        closeResult = system.controller.close()
        system.controller.open()
      }

      return Reflect.getPrototypeOf(target)
    },
  })
  const serviceDouble = createServiceDouble({
    loadResult() {
      return serviceDouble.calls.loadLog.length === 1
        ? staleResultProxy
        : createLoadSuccess(createPrivateLog([freshEntry]))
    },
  })
  system = createControllerSystem({ serviceDouble })
  system.controller.open()

  assert.doesNotThrow(() => system.scheduler.run(0))

  assert.equal(lifecycleReentered, true)
  assert.equal(closeResult, true)
  assert.equal(system.view.unmountCalls, 1)
  assert.equal(system.scheduler.scheduleCalls, 2)
  assert.equal(serviceDouble.calls.loadLog.length, 1)
  assert.equal(system.view.lastState.phase, 'loading')
  assert.deepEqual(system.view.lastState.entries, [])

  system.scheduler.run(1)

  assert.equal(serviceDouble.calls.loadLog.length, 2)
  assert.equal(system.view.lastState.phase, 'ready')
  assert.deepEqual(system.view.lastState.entries, [freshEntry])
  assert.equal(
    system.view.lastState.entries.some(({ id }) => id === staleEntry.id),
    false
  )
})

test('verwirft Submit-Proxies nach reentrantem Cancel oder Close-Reopen vor jedem Serviceaufruf', () => {
  const cancelSystem = createControllerSystem()
  const cancelActions = openAndFlush(cancelSystem)
  cancelActions.onOpenCreateEntryForm()
  const cancelSubmissionTarget = createSubmission(
    'createEntry',
    createEntryValues(createSecondEntry())
  )
  let cancelTrapCalls = 0
  const cancellingSubmission = new Proxy(cancelSubmissionTarget, {
    getPrototypeOf(target) {
      cancelTrapCalls += 1

      if (cancelTrapCalls === 1) {
        cancelActions.onCancelForm()
      }

      return Reflect.getPrototypeOf(target)
    },
  })

  assert.doesNotThrow(() => {
    cancelActions.onSubmitForm(cancellingSubmission)
  })
  assert.ok(cancelTrapCalls >= 1)
  assert.equal(cancelSystem.view.lastState.phase, 'ready')
  assert.equal(cancelSystem.view.lastState.form, null)
  assert.equal(cancelSystem.serviceDouble.calls.createEntry.length, 0)
  assert.equal(cancelSystem.serviceDouble.calls.loadLog.length, 1)

  const initialEntry = createEntry()
  const freshEntry = createSecondEntry({
    id: 'lichtwald-entry-fresh-submit-lifecycle',
  })
  let reopenSystem
  let loadResultIndex = 0
  let closeResult
  const reopenServiceDouble = createServiceDouble({
    loadResult() {
      loadResultIndex += 1
      return createLoadSuccess(
        createPrivateLog([
          loadResultIndex === 1 ? initialEntry : freshEntry,
        ])
      )
    },
  })
  reopenSystem = createControllerSystem({
    serviceDouble: reopenServiceDouble,
  })
  const reopenActions = openAndFlush(reopenSystem)
  reopenActions.onOpenCreateEntryForm()
  const reopenSubmissionTarget = createSubmission(
    'createEntry',
    createEntryValues(createSecondEntry())
  )
  let reopenTrapCalls = 0
  const reopeningSubmission = new Proxy(reopenSubmissionTarget, {
    getPrototypeOf(target) {
      reopenTrapCalls += 1

      if (reopenTrapCalls === 1) {
        closeResult = reopenSystem.controller.close()
        reopenSystem.controller.open()
      }

      return Reflect.getPrototypeOf(target)
    },
  })

  assert.doesNotThrow(() => {
    reopenActions.onSubmitForm(reopeningSubmission)
  })

  assert.ok(reopenTrapCalls >= 1)
  assert.equal(closeResult, true)
  assert.equal(reopenSystem.view.unmountCalls, 1)
  assert.equal(reopenSystem.view.lastState.phase, 'loading')
  assert.deepEqual(reopenSystem.view.lastState.entries, [])
  assert.equal(reopenServiceDouble.calls.createEntry.length, 0)
  assert.equal(reopenServiceDouble.calls.loadLog.length, 1)
  assert.equal(reopenSystem.scheduler.scheduleCalls, 2)

  reopenSystem.scheduler.run(1)
  assert.equal(reopenServiceDouble.calls.loadLog.length, 2)
  assert.equal(reopenSystem.view.lastState.phase, 'ready')
  assert.deepEqual(reopenSystem.view.lastState.entries, [freshEntry])
})

test('liest feindliche Factory-Options weder über Getter noch ungeschützte Proxy-Reflection', () => {
  const privateMarker = 'fixture-controller-options-sentinel'
  let proxyGetCalls = 0
  let proxyPrototypeCalls = 0
  const throwingOptionsProxy = new Proxy({}, {
    get() {
      proxyGetCalls += 1
      throw new Error(privateMarker)
    },
    getPrototypeOf() {
      proxyPrototypeCalls += 1
      throw new Error(privateMarker)
    },
  })
  let proxyController

  assert.doesNotThrow(() => {
    proxyController = createLichtwaldLogController(throwingOptionsProxy)
  })
  assert.equal(proxyGetCalls, 0)
  assert.ok(proxyPrototypeCalls >= 1)
  assertExactOwnKeys(proxyController, CONTROLLER_METHOD_NAMES)
  assert.doesNotThrow(() => proxyController.open())
  assert.doesNotThrow(() => {
    assert.equal(proxyController.close(), true)
  })
  assert.equal(proxyGetCalls, 0)

  let optionGetterCalls = 0
  const getterOptions = {}

  for (const propertyName of [
    'lichtwaldLogService',
    'lichtwaldLogView',
    'scheduleTask',
  ]) {
    Object.defineProperty(getterOptions, propertyName, {
      configurable: true,
      enumerable: true,
      get() {
        optionGetterCalls += 1
        throw new Error(privateMarker)
      },
    })
  }

  let getterController
  assert.doesNotThrow(() => {
    getterController = createLichtwaldLogController(getterOptions)
    getterController.open()
  })
  assert.equal(optionGetterCalls, 0)
  assert.doesNotThrow(() => {
    assert.equal(getterController.close(), true)
  })
  assert.equal(optionGetterCalls, 0)
})

test('fängt einen werfenden zweiten requestAnimationFrame-Aufruf im Default-Scheduler einmalig ab', () => {
  const requestFrameDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    'requestAnimationFrame'
  )
  const cancelFrameDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    'cancelAnimationFrame'
  )
  const privateMarker = 'fixture-second-animation-frame-sentinel'
  const scheduledFrameCallbacks = []
  const cancelledFrameIds = []
  let requestFrameCalls = 0

  Object.defineProperty(globalThis, 'requestAnimationFrame', {
    configurable: true,
    writable: true,
    value(callback) {
      requestFrameCalls += 1

      if (requestFrameCalls === 1) {
        scheduledFrameCallbacks.push(callback)
        return 701
      }

      throw new Error(privateMarker)
    },
  })
  Object.defineProperty(globalThis, 'cancelAnimationFrame', {
    configurable: true,
    writable: true,
    value(frameId) {
      cancelledFrameIds.push(frameId)
    },
  })

  try {
    const serviceDouble = createServiceDouble({
      loadResult: createLoadSuccess(createPrivateLog()),
    })
    const view = createViewRecorder()
    const controller = createLichtwaldLogController({
      lichtwaldLogService: serviceDouble.service,
      lichtwaldLogView: view,
    })

    assert.doesNotThrow(() => controller.open())
    assert.equal(requestFrameCalls, 1)
    assert.equal(scheduledFrameCallbacks.length, 1)
    assert.equal(serviceDouble.calls.loadLog.length, 0)
    assert.equal(view.lastState.phase, 'loading')

    assert.doesNotThrow(() => scheduledFrameCallbacks[0]())

    assert.equal(requestFrameCalls, 2)
    assert.equal(serviceDouble.calls.loadLog.length, 1)
    assert.equal(view.lastState.phase, 'ready')
    assert.deepEqual(view.lastState.entries, createPrivateLog().entries)
    const renderCountAfterLoad = view.renders.length

    assert.doesNotThrow(() => scheduledFrameCallbacks[0]())
    assert.equal(requestFrameCalls, 3)
    assert.equal(serviceDouble.calls.loadLog.length, 1)
    assert.equal(view.renders.length, renderCountAfterLoad)
    assert.doesNotThrow(() => {
      assert.equal(controller.close(), true)
    })
    assert.deepEqual(cancelledFrameIds, [])
  } finally {
    if (requestFrameDescriptor) {
      Object.defineProperty(
        globalThis,
        'requestAnimationFrame',
        requestFrameDescriptor
      )
    } else {
      delete globalThis.requestAnimationFrame
    }

    if (cancelFrameDescriptor) {
      Object.defineProperty(
        globalThis,
        'cancelAnimationFrame',
        cancelFrameDescriptor
      )
    } else {
      delete globalThis.cancelAnimationFrame
    }
  }
})

test('verdrahtet Default, private und synthetic construction-time-only mit exaktem runtimeMode', () => {
  const privateLog = createPrivateLog()
  const syntheticLog = createSyntheticLog([
    createEntry({ title: '[Demo] Synthetische Ursprungskarte' }),
  ])
  const missingOriginScheduler = createManualScheduler()
  const missingOriginView = createViewRecorder()
  const missingOriginService = createServiceDouble({
    loadResult: createLoadSuccess(privateLog),
  })
  const missingOriginController = createLichtwaldLogController({
    lichtwaldLogService: missingOriginService.service,
    lichtwaldLogView: missingOriginView,
    scheduleTask: missingOriginScheduler.scheduleTask,
  })

  missingOriginController.open()
  missingOriginScheduler.run()
  assert.equal(missingOriginView.lastState.phase, 'ready')
  assert.equal(missingOriginView.lastState.runtimeMode, 'private')

  const explicitPrivate = createControllerSystem({
    expectedDataOrigin: 'private',
    serviceOptions: { loadResult: createLoadSuccess(privateLog) },
  })
  openAndFlush(explicitPrivate)
  assert.equal(explicitPrivate.view.lastState.runtimeMode, 'private')
  assert.deepEqual(explicitPrivate.view.lastState.entries, privateLog.entries)

  const synthetic = createControllerSystem({
    expectedDataOrigin: 'synthetic',
    serviceOptions: { loadResult: createLoadSuccess(syntheticLog) },
  })
  synthetic.controller.open()
  const firstSyntheticModel = synthetic.view.lastState
  const actionsReference = synthetic.view.actions
  synthetic.scheduler.run()
  assert.equal(synthetic.view.lastState.phase, 'ready')
  assert.equal(synthetic.view.lastState.runtimeMode, 'syntheticDemo')
  assert.notStrictEqual(synthetic.view.lastState, firstSyntheticModel)
  assert.strictEqual(synthetic.view.actions, actionsReference)
  assertExactOwnKeys(synthetic.controller, CONTROLLER_METHOD_NAMES)
  assertExactOwnKeys(synthetic.view.actions, ACTION_METHOD_NAMES)
  assertViewModelContract(synthetic.view.lastState)
  assert.equal(Object.hasOwn(syntheticLog, 'runtimeMode'), false)

  const privateRejectsSynthetic = createControllerSystem({
    expectedDataOrigin: 'private',
    serviceOptions: { loadResult: createLoadSuccess(syntheticLog) },
  })
  openAndFlush(privateRejectsSynthetic)
  assert.equal(privateRejectsSynthetic.view.lastState.phase, 'loadError')
  assert.equal(privateRejectsSynthetic.view.lastState.runtimeMode, 'private')
  assert.deepEqual(privateRejectsSynthetic.view.lastState.entries, [])

  const syntheticRejectsPrivate = createControllerSystem({
    expectedDataOrigin: 'synthetic',
    serviceOptions: { loadResult: createLoadSuccess(privateLog) },
  })
  openAndFlush(syntheticRejectsPrivate)
  assert.equal(syntheticRejectsPrivate.view.lastState.phase, 'loadError')
  assert.equal(
    syntheticRejectsPrivate.view.lastState.runtimeMode,
    'syntheticDemo'
  )
  assert.equal(
    syntheticRejectsPrivate.view.lastState.errorMessage,
    'Die LichtwaldLog-Demo konnte nicht sicher geladen werden. Bitte versuche es erneut.'
  )
  assert.deepEqual(syntheticRejectsPrivate.view.lastState.entries, [])
})

test('weist ungültige, accessorbasierte und feindliche Origin-Konfiguration ohne Coercion fail-closed zurück', () => {
  let coercionCalls = 0
  const hostileValue = Object.freeze({
    [Symbol.toPrimitive]() {
      coercionCalls += 1
      throw new Error('fixture-origin-coercion-sentinel')
    },
  })

  for (const expectedDataOrigin of [
    null,
    true,
    1,
    Symbol('synthetic'),
    'Synthetic',
    'syntheticDemo',
    hostileValue,
  ]) {
    const system = createControllerSystem({
      expectedDataOrigin,
      serviceOptions: {
        loadResult: createLoadSuccess(createPrivateLog()),
      },
    })

    assert.doesNotThrow(() => openAndFlush(system))
    assert.equal(system.serviceDouble.calls.loadLog.length, 0)
    assert.equal(system.view.lastState.phase, 'loadError')
    assert.equal(system.view.lastState.runtimeMode, 'private')
    assert.deepEqual(system.view.lastState.entries, [])
  }

  const expectedOriginGetterMarker = 'fixture-origin-getter-sentinel'
  let expectedOriginGetterCalls = 0
  const serviceDouble = createServiceDouble({
    loadResult: createLoadSuccess(createPrivateLog()),
  })
  const scheduler = createManualScheduler()
  const view = createViewRecorder()
  const accessorOptions = {
    lichtwaldLogService: serviceDouble.service,
    lichtwaldLogView: view,
    scheduleTask: scheduler.scheduleTask,
  }
  Object.defineProperty(accessorOptions, 'expectedDataOrigin', {
    enumerable: true,
    get() {
      expectedOriginGetterCalls += 1
      throw new Error(expectedOriginGetterMarker)
    },
  })
  const accessorController = createLichtwaldLogController(accessorOptions)
  accessorController.open()
  scheduler.run()
  assert.equal(expectedOriginGetterCalls, 0)
  assert.equal(serviceDouble.calls.loadLog.length, 0)
  assert.equal(view.lastState.phase, 'loadError')
  assertFeedbackIsRedacted(view.lastState, [expectedOriginGetterMarker])

  let originDescriptorCalls = 0
  const proxyScheduler = createManualScheduler()
  const proxyView = createViewRecorder()
  const proxyService = createServiceDouble()
  const proxyOptions = new Proxy({
    lichtwaldLogService: proxyService.service,
    lichtwaldLogView: proxyView,
    scheduleTask: proxyScheduler.scheduleTask,
  }, {
    getOwnPropertyDescriptor(target, propertyName) {
      if (propertyName === 'expectedDataOrigin') {
        originDescriptorCalls += 1
        throw new Error('fixture-origin-proxy-sentinel')
      }

      return Reflect.getOwnPropertyDescriptor(target, propertyName)
    },
  })
  const proxyController = createLichtwaldLogController(proxyOptions)
  proxyController.open()
  proxyScheduler.run()
  assert.equal(originDescriptorCalls, 1)
  assert.equal(proxyService.calls.loadLog.length, 0)
  assert.equal(proxyView.lastState.phase, 'loadError')
  assert.equal(coercionCalls, 0)
})

test('liest expectedDataOrigin nur bei der Konstruktion und errät ihn nie aus späteren Ergebnissen', () => {
  const syntheticLog = createSyntheticLog()
  const scheduler = createManualScheduler()
  const view = createViewRecorder()
  const serviceDouble = createServiceDouble({
    loadResult: createLoadSuccess(syntheticLog),
  })
  const options = {
    lichtwaldLogService: serviceDouble.service,
    lichtwaldLogView: view,
    scheduleTask: scheduler.scheduleTask,
    expectedDataOrigin: 'synthetic',
  }
  const controller = createLichtwaldLogController(options)

  options.expectedDataOrigin = 'private'
  controller.open()
  scheduler.run()

  assert.equal(view.lastState.phase, 'ready')
  assert.equal(view.lastState.runtimeMode, 'syntheticDemo')
  assert.deepEqual(view.lastState.entries, syntheticLog.entries)
  assert.equal(controller.close(), true)

  options.expectedDataOrigin = 'invalid-after-construction'
  controller.open()
  scheduler.run(1)
  assert.equal(view.lastState.phase, 'ready')
  assert.equal(view.lastState.runtimeMode, 'syntheticDemo')
  assert.equal(serviceDouble.calls.loadLog.length, 2)
})

test('verwendet für Demo-CRUD und Fokus ausschließlich statische Sitzungstexte', () => {
  const initialEntry = createEntry({
    id: 'lichtwald-demo-shared-id',
    title: '[Demo] Ausgangskarte',
  })
  let currentLog = createSyntheticLog([initialEntry])
  const createdEntryId = 'lichtwald-demo-created-id'
  const privateMarkers = [
    'fixture-demo-private-title-sentinel',
    'fixture-demo-private-text-sentinel',
    createdEntryId,
  ]
  const serviceDouble = createServiceDouble({
    loadResult: () => createLoadSuccess(structuredClone(currentLog)),
    createResult(input) {
      const createdEntry = { id: createdEntryId, ...structuredClone(input) }
      currentLog = {
        ...structuredClone(currentLog),
        entries: [...structuredClone(currentLog.entries), createdEntry],
      }
      return createCreateSuccess(structuredClone(currentLog))
    },
    updateResult(entryId, input) {
      currentLog = {
        ...structuredClone(currentLog),
        entries: currentLog.entries.map((entry) => (
          entry.id === entryId
            ? { id: entryId, ...structuredClone(input) }
            : structuredClone(entry)
        )),
      }
      return createUpdateSuccess(structuredClone(currentLog), entryId)
    },
    featuredResult(entryIdOrNull) {
      currentLog = {
        ...structuredClone(currentLog),
        featuredEntryId: entryIdOrNull,
      }
      return createFeaturedSuccess(
        structuredClone(currentLog),
        entryIdOrNull
      )
    },
    deleteResult(entryId) {
      currentLog = {
        ...structuredClone(currentLog),
        featuredEntryId:
          currentLog.featuredEntryId === entryId
            ? null
            : currentLog.featuredEntryId,
        entries: currentLog.entries
          .filter((entry) => entry.id !== entryId)
          .map((entry) => structuredClone(entry)),
      }
      return createDeleteSuccess(
        structuredClone(currentLog),
        entryId,
        true
      )
    },
  })
  const system = createControllerSystem({
    expectedDataOrigin: 'synthetic',
    serviceDouble,
  })
  const actions = openAndFlush(system)
  actions.onOpenCreateEntryForm()
  actions.onSubmitForm(createSubmission('createEntry', {
    calendarDate: '2048-08-12',
    title: privateMarkers[0],
    text: privateMarkers[1],
    tags: ['Demo', 'Sitzung'],
  }))

  assert.equal(
    system.view.lastState.statusMessage,
    'Der Demo-Eintrag wurde für diese Sitzung hinzugefügt.'
  )
  assert.equal(system.view.lastState.runtimeMode, 'syntheticDemo')
  assert.equal(
    Object.hasOwn(serviceDouble.calls.createEntry[0][0], 'runtimeMode'),
    false
  )
  assertFeedbackIsRedacted(system.view.lastState, privateMarkers)

  actions.onOpenUpdateEntryForm(createdEntryId)
  actions.onSubmitForm(createSubmission(
    'updateEntry',
    {
      calendarDate: '2048-08-13',
      title: privateMarkers[0],
      text: privateMarkers[1],
      tags: ['Demo', 'Aktualisiert'],
    },
    createdEntryId
  ))
  assert.equal(
    system.view.lastState.statusMessage,
    'Der Demo-Eintrag wurde für diese Sitzung aktualisiert.'
  )
  assertFeedbackIsRedacted(system.view.lastState, privateMarkers)

  actions.onSetFeaturedEntry(createdEntryId)
  assert.equal(
    system.view.lastState.statusMessage,
    'Der Demo-Fokus wurde für diese Sitzung gespeichert.'
  )
  actions.onSetFeaturedEntry(null)
  assert.equal(
    system.view.lastState.statusMessage,
    'Der Demo-Fokus wurde für diese Sitzung entfernt.'
  )

  actions.onRequestDeleteEntry(createdEntryId)
  actions.onConfirmDeleteEntry(createdEntryId)
  assert.equal(
    system.view.lastState.statusMessage,
    'Der Demo-Eintrag wurde aus dieser Sitzung entfernt.'
  )
  assertFeedbackIsRedacted(system.view.lastState, privateMarkers)
  assert.equal(currentLog.dataOrigin, 'synthetic')
  assert.equal(Object.hasOwn(currentLog, 'runtimeMode'), false)
})

test('hält Demo-Controller mit gleicher Entry-ID isoliert und setzt nur flüchtige UI-Zustände zurück', () => {
  const sharedEntryId = 'lichtwald-demo-shared-isolation-id'
  const firstEntry = createEntry({
    id: sharedEntryId,
    title: '[Demo] Erste isolierte Karte',
    tags: ['Geteilt', 'Erste'],
  })
  const secondEntry = createEntry({
    id: sharedEntryId,
    title: '[Demo] Zweite isolierte Karte',
    tags: ['Geteilt', 'Zweite'],
  })
  let firstLog = createSyntheticLog([firstEntry])
  const secondLog = createSyntheticLog([secondEntry])
  const firstService = createServiceDouble({
    loadResult: () => createLoadSuccess(structuredClone(firstLog)),
    createResult(input) {
      const createdEntry = {
        id: 'lichtwald-demo-isolated-created-id',
        ...structuredClone(input),
      }
      firstLog = {
        ...structuredClone(firstLog),
        entries: [...structuredClone(firstLog.entries), createdEntry],
      }
      return createCreateSuccess(structuredClone(firstLog))
    },
  })
  const secondService = createServiceDouble({
    loadResult: createLoadSuccess(secondLog),
  })
  const firstSystem = createControllerSystem({
    expectedDataOrigin: 'synthetic',
    serviceDouble: firstService,
  })
  const secondSystem = createControllerSystem({
    expectedDataOrigin: 'synthetic',
    serviceDouble: secondService,
  })
  const firstActions = openAndFlush(firstSystem)
  const secondActions = openAndFlush(secondSystem)
  const staleFirstActions = firstActions

  firstActions.onChangeSearchQuery('erste')
  assert.equal(firstSystem.view.lastState.searchQuery, 'erste')
  assert.equal(secondSystem.view.lastState.searchQuery, '')
  firstActions.onOpenCreateEntryForm()
  firstActions.onSubmitForm(createSubmission('createEntry', {
    calendarDate: '2049-02-03',
    title: '[Demo] Nur im ersten Controller',
    text: 'Vollständig erfundener Isolationstest.',
    tags: ['Isolation'],
  }))
  assert.equal(firstSystem.view.lastState.searchQuery, 'erste')
  assert.equal(firstSystem.view.lastState.entries.length, 2)
  assert.equal(secondSystem.view.lastState.entries.length, 1)
  assert.equal(secondSystem.view.lastState.entries[0].title, secondEntry.title)

  assert.equal(firstSystem.controller.close(), true)
  staleFirstActions.onResetFilters()
  staleFirstActions.onSelectEntry(sharedEntryId)
  assert.equal(secondSystem.view.lastState.selectedEntryId, null)
  assert.equal(secondService.calls.loadLog.length, 1)

  firstSystem.controller.open()
  firstSystem.scheduler.run(1)
  assert.equal(firstSystem.view.lastState.searchQuery, '')
  assert.equal(firstSystem.view.lastState.selectedEntryId, null)
  assert.equal(firstSystem.view.lastState.entries.length, 2)
  assert.equal(firstService.calls.loadLog.length, 2)

  secondActions.onSelectEntry(sharedEntryId)
  assert.equal(secondSystem.view.lastState.selectedEntryId, sharedEntryId)
  assert.equal(firstSystem.view.lastState.selectedEntryId, null)

  firstSystem.view.actions.onOpenCreateEntryForm()
  firstSystem.view.actions.onUpdateFormField(
    'title',
    'Noch nicht übernommener Demo-Draft'
  )
  assert.equal(firstSystem.controller.close(), false)
  assert.equal(
    firstSystem.view.lastState.form.errorMessage,
    'Übernimm den Demo-Eintrag für diese Sitzung oder brich das Formular ab, bevor du den Arbeitsbereich schließt.'
  )
  assert.equal(
    firstSystem.view.lastState.form.errorMessage.includes('Speichere'),
    false
  )
  firstSystem.view.actions.onCancelForm()
  assert.equal(firstSystem.controller.close(), true)
  assert.equal(firstLog.entries.length, 2)
})

test('verwirft bei jeder Demo-Mutation private Erfolgs- und Fehlersnapshots ohne Umklassifizierung', () => {
  const target = createEntry({
    id: 'lichtwald-demo-origin-target',
    title: '[Demo] Herkunftsziel',
  })
  const syntheticLog = createSyntheticLog([target])
  const privateCreated = createEntry({
    id: 'lichtwald-private-origin-created',
    title: 'Nicht freizugebender privater Kandidat',
  })
  const privateCreateLog = createPrivateLog([target, privateCreated])
  const createSystem = createControllerSystem({
    expectedDataOrigin: 'synthetic',
    serviceOptions: {
      loadResult: createLoadSuccess(syntheticLog),
      createResult: createCreateSuccess(privateCreateLog, privateCreated),
    },
  })
  let actions = openAndFlush(createSystem)
  actions.onOpenCreateEntryForm()
  actions.onSubmitForm(createSubmission('createEntry', {
    calendarDate: '2050-01-01',
    title: 'Nicht freizugebender Demo-Draft',
    text: 'Ein vollständig erfundener Origin-Mismatch-Draft.',
    tags: ['Mismatch'],
  }))
  assert.deepEqual(createSystem.view.lastState.entries, syntheticLog.entries)
  assert.equal(
    createSystem.view.lastState.form.errorMessage,
    'Die Demo-Änderung konnte nicht übernommen werden. Deine Eingaben bleiben erhalten.'
  )

  const privateUpdated = createEntry({
    ...target,
    title: 'Nicht freizugebender privater Update-Kandidat',
  })
  const updateSystem = createControllerSystem({
    expectedDataOrigin: 'synthetic',
    serviceOptions: {
      loadResult: createLoadSuccess(syntheticLog),
      updateResult: createUpdateSuccess(
        createPrivateLog([privateUpdated]),
        target.id
      ),
    },
  })
  actions = openAndFlush(updateSystem)
  actions.onOpenUpdateEntryForm(target.id)
  actions.onSubmitForm(createSubmission(
    'updateEntry',
    createEntryValues(privateUpdated),
    target.id
  ))
  assert.deepEqual(updateSystem.view.lastState.entries, syntheticLog.entries)
  assert.equal(
    updateSystem.view.lastState.form.errorMessage,
    'Die Demo-Änderung konnte nicht übernommen werden. Deine Eingaben bleiben erhalten.'
  )

  const deleteSystem = createControllerSystem({
    expectedDataOrigin: 'synthetic',
    serviceOptions: {
      loadResult: createLoadSuccess(syntheticLog),
      deleteResult: createDeleteSuccess(
        createEmptyPrivateLog(),
        target.id
      ),
    },
  })
  actions = openAndFlush(deleteSystem)
  actions.onRequestDeleteEntry(target.id)
  actions.onConfirmDeleteEntry(target.id)
  assert.deepEqual(deleteSystem.view.lastState.entries, syntheticLog.entries)
  assert.equal(
    deleteSystem.view.lastState.deleteState.errorMessage,
    'Die Demo-Änderung konnte nicht übernommen werden.'
  )

  const featuredSystem = createControllerSystem({
    expectedDataOrigin: 'synthetic',
    serviceOptions: {
      loadResult: createLoadSuccess(syntheticLog),
      featuredResult: createMutationFailure({
        lichtwaldLog: createPrivateLog([target]),
      }),
    },
  })
  actions = openAndFlush(featuredSystem)
  actions.onSetFeaturedEntry(target.id)
  assert.deepEqual(featuredSystem.view.lastState.entries, syntheticLog.entries)
  assert.equal(
    featuredSystem.view.lastState.featuredState.errorMessage,
    'Die Demo-Änderung konnte nicht übernommen werden.'
  )

  for (const system of [
    createSystem,
    updateSystem,
    deleteSystem,
    featuredSystem,
  ]) {
    assert.equal(system.view.lastState.runtimeMode, 'syntheticDemo')
    assert.equal(system.view.lastState.entries[0].dataOrigin, undefined)
    const feedback = getFeedbackText(system.view.lastState).toLowerCase()
    assert.equal(feedback.includes('localstorage'), false)
    assert.equal(feedback.includes('dauerhaft'), false)
    assert.equal(feedback.includes(privateCreated.id.toLowerCase()), false)
  }
})
