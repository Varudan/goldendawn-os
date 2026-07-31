import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { createLichtwaldLogController } from '../src/modules/lichtwald-log/lichtwaldLogController.js'
import { createLichtwaldLogView } from '../src/modules/lichtwald-log/lichtwaldLogView.js'
import { createLichtwaldLogService } from '../src/services/lichtwaldLogService.js'
import {
  createLichtwaldLogStorage,
  LICHTWALD_LOG_STORAGE_KEY,
} from '../src/storage/lichtwaldLogStorage.js'
import { createStorageAdapter } from '../src/storage/storageAdapter.js'
import {
  createFakeDom,
  findByClass,
  findByTag,
} from './helpers/fakeDom.js'
import { FakeStorage } from './helpers/fakeStorage.js'

const SYNTHETIC_ENTRY_ID =
  'lichtwald-entry-composition-synthetic-1'

class TrackingFakeStorage extends FakeStorage {
  constructor(initialEntries = []) {
    super(initialEntries)
    this.operations = []
    this.writes = []
  }

  getItem(key) {
    this.operations.push({ type: 'get', key: String(key) })
    return super.getItem(key)
  }

  setItem(key, value) {
    const serializedValue = String(value)
    this.operations.push({
      type: 'set',
      key: String(key),
    })
    this.writes.push({
      key: String(key),
      serializedValue,
    })
    return super.setItem(key, serializedValue)
  }

  removeItem(key) {
    this.operations.push({ type: 'remove', key: String(key) })
    return super.removeItem(key)
  }
}

function createManualScheduler() {
  const tasks = []

  return {
    tasks,
    scheduleTask(task) {
      const record = { task, cancelCalls: 0 }
      tasks.push(record)

      return () => {
        record.cancelCalls += 1
      }
    },
    run(index = tasks.length - 1) {
      assert.ok(tasks[index])
      tasks[index].task()
    },
  }
}

function createStack(storage = new TrackingFakeStorage()) {
  const fakeDom = createFakeDom()
  const scheduler = createManualScheduler()
  const storageAdapter = createStorageAdapter(storage)
  const lichtwaldLogStorage = createLichtwaldLogStorage(storageAdapter)
  const lichtwaldLogService = createLichtwaldLogService({
    lichtwaldLogStorage,
    generateLichtwaldLogEntryId() {
      return SYNTHETIC_ENTRY_ID
    },
  })
  const lichtwaldLogView = createLichtwaldLogView(fakeDom.root)
  const lichtwaldLogController = createLichtwaldLogController({
    lichtwaldLogService,
    lichtwaldLogView,
    scheduleTask: scheduler.scheduleTask,
  })

  return {
    ...fakeDom,
    controller: lichtwaldLogController,
    scheduler,
    storage,
  }
}

function findButton(root, label) {
  return findByTag(root, 'button').find(
    (button) => button.textContent === label
  ) ?? null
}

function findControl(root, name) {
  return findByTag(root, 'input')
    .concat(findByTag(root, 'textarea'))
    .find((control) => control.name === name) ?? null
}

function updateFormField(root, fieldName, value) {
  const control = findControl(root, fieldName)
  assert.ok(control)
  control.value = value
  control.dispatchEvent({ type: 'input' })
}

function submitForm(root) {
  const form = findByTag(root, 'form')[0]
  assert.ok(form)
  assert.equal(form.dispatchEvent({ type: 'submit' }), false)
}

function readPersistedLog(storage) {
  const serializedLog = storage.peek(LICHTWALD_LOG_STORAGE_KEY)
  assert.equal(typeof serializedLog, 'string')
  return JSON.parse(serializedLog)
}

test('komponiert LichtwaldLog in main über den gemeinsamen Adapter und schützt den View-Wechsel', () => {
  const mainSource = readFileSync(
    new URL('../src/main.js', import.meta.url),
    'utf8'
  )
  const expectedImports = [
    "import './modules/lichtwald-log/lichtwaldLog.css'",
    "import { createLichtwaldLogController } from './modules/lichtwald-log/lichtwaldLogController.js'",
    "import { createLichtwaldLogView } from './modules/lichtwald-log/lichtwaldLogView.js'",
    "import { createLichtwaldLogService } from './services/lichtwaldLogService.js'",
    "import { createLichtwaldLogStorage } from './storage/lichtwaldLogStorage.js'",
  ]

  for (const expectedImport of expectedImports) {
    assert.ok(mainSource.includes(expectedImport))
  }

  const lichtwaldImports = mainSource
    .split('\n')
    .filter((line) => line.startsWith('import') && /lichtwald/iu.test(line))
  assert.deepEqual(lichtwaldImports, expectedImports)
  assert.equal(
    (mainSource.match(/\bcreateStorageAdapter\s*\(/gu) ?? []).length,
    1
  )

  const compositionNeedles = [
    'const storageAdapter = createStorageAdapter(storageImplementation)',
    'const lichtwaldLogStorage = createLichtwaldLogStorage(storageAdapter)',
    'const lichtwaldLogService = createLichtwaldLogService({',
    'const lichtwaldLogView = createLichtwaldLogView(viewOutlet)',
    'const lichtwaldLogController = createLichtwaldLogController({',
  ]
  const compositionIndexes = compositionNeedles.map((needle) => (
    mainSource.indexOf(needle)
  ))
  assert.ok(compositionIndexes.every((index) => index >= 0))
  assert.deepEqual(
    [...compositionIndexes].sort((left, right) => left - right),
    compositionIndexes
  )

  const lichtwaldFactoryCalls = [...mainSource.matchAll(
    /\b(createLichtwaldLog[A-Z][A-Za-z]+)\s*\(/gu
  )].map((match) => match[1])
  assert.deepEqual(lichtwaldFactoryCalls, [
    'createLichtwaldLogStorage',
    'createLichtwaldLogService',
    'createLichtwaldLogView',
    'createLichtwaldLogController',
  ])
  assert.match(
    mainSource,
    /createLichtwaldLogService\(\{\s*lichtwaldLogStorage,\s*\}\)/u
  )
  assert.match(
    mainSource,
    /createLichtwaldLogController\(\{\s*lichtwaldLogService,\s*lichtwaldLogView,\s*\}\)/u
  )
  assert.doesNotMatch(mainSource, /generateLichtwaldLogEntryId/u)
  assert.doesNotMatch(
    mainSource,
    /createLichtwaldLog(?:Demo|Search|Filter|Sync|Agent|Network)[A-Za-z]*\s*\(/iu
  )
  assert.doesNotMatch(
    mainSource,
    /\blichtwaldLog(?:Demo|Search|Filter|Sync|Agent|Webhook|Network)[A-Za-z]*/u
  )
  assert.doesNotMatch(
    mainSource,
    /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\b/u
  )

  assert.match(
    mainSource,
    /const VIEW_LICHTWALD_LOG = 'lichtwald-log'/u
  )
  const moduleStart = mainSource.indexOf('id: VIEW_LICHTWALD_LOG')
  const moduleEnd = mainSource.indexOf('\n  },', moduleStart)
  assert.ok(moduleStart >= 0 && moduleEnd > moduleStart)
  const moduleSource = mainSource.slice(moduleStart, moduleEnd)
  assert.match(moduleSource, /status: 'In Arbeit'/u)
  assert.match(moduleSource, /statusClass: 'next'/u)
  assert.match(moduleSource, /navigationState: 'In Arbeit'/u)
  assert.match(moduleSource, /isNavigable: true/u)
  assert.doesNotMatch(moduleSource, /Suche|Filter|Demo/u)

  const showViewStart = mainSource.indexOf('function showView(')
  const showViewEnd = mainSource.indexOf(
    "\ndocument.querySelectorAll('.nav-button[data-view]')",
    showViewStart
  )
  assert.ok(showViewStart >= 0 && showViewEnd > showViewStart)
  const showViewSource = mainSource.slice(showViewStart, showViewEnd)
  const sameViewGuardIndex = showViewSource.indexOf(
    'if (viewName === activeView)'
  )
  const closeGuardIndex = showViewSource.indexOf(
    'activeView === VIEW_LICHTWALD_LOG'
  )
  const activeViewAssignmentIndex = showViewSource.indexOf(
    'activeView = viewName'
  )
  const navigationIndex = showViewSource.indexOf(
    'updateNavigation(activeView)'
  )

  assert.ok(sameViewGuardIndex >= 0)
  assert.match(
    showViewSource,
    /if \(viewName === activeView\)\s*\{\s*return\s*\}/u
  )
  assert.ok(sameViewGuardIndex < closeGuardIndex)
  assert.ok(closeGuardIndex < activeViewAssignmentIndex)
  assert.ok(closeGuardIndex < navigationIndex)
  assert.match(
    showViewSource,
    /activeView === VIEW_LICHTWALD_LOG\s*&&\s*lichtwaldLogController\.close\(\) === false\s*\)\s*\{\s*return/u
  )
  assert.match(
    showViewSource,
    /activeView === VIEW_LICHTWALD_LOG\)\s*\{\s*document\.title = 'GoldenDawn OS – LichtwaldLog'\s*lichtwaldLogController\.open\(\)/u
  )
})

test('bedient CRUD und Fokus durch den vollständigen lokalen Stack und lädt persistierte Wahrheit neu', () => {
  const stack = createStack()
  const {
    controller,
    restore,
    root,
    scheduler,
    storage,
  } = stack
  const createdEntry = {
    id: SYNTHETIC_ENTRY_ID,
    calendarDate: '2042-04-05',
    title: 'Synthetischer Kompositionsstern',
    text: 'Erfundene Zeile eins\nErfundene Zeile zwei',
    tags: ['Prisma, Blau', 'Fiktiver Orbit'],
  }
  const updatedEntry = {
    ...createdEntry,
    calendarDate: '2043-06-07',
    title: 'Aktualisierter synthetischer Kompositionsstern',
    text: 'Aktualisierte Zeile eins\nAktualisierte Zeile zwei',
    tags: ['Neues Prisma', 'Zweiter Orbit'],
  }

  try {
    controller.open()
    assert.equal(
      findByClass(root, 'lichtwald-log-state--loading').length,
      1
    )
    assert.equal(root.getAttribute('aria-busy'), 'true')
    assert.equal(storage.getItemCalls, 0)
    assert.equal(storage.setItemCalls, 0)

    scheduler.run(0)
    assert.equal(
      findByClass(root, 'lichtwald-log-state--empty').length,
      1
    )
    assert.equal(storage.getItemCalls, 1)
    assert.equal(storage.setItemCalls, 0)
    assert.equal(storage.peek(LICHTWALD_LOG_STORAGE_KEY), null)

    findButton(root, 'Neuen Eintrag erstellen').click()
    updateFormField(root, 'calendarDate', createdEntry.calendarDate)
    updateFormField(root, 'title', createdEntry.title)
    updateFormField(root, 'text', createdEntry.text)
    findButton(root, 'Tag hinzufügen').click()
    findButton(root, 'Tag hinzufügen').click()
    updateFormField(root, 'tag-0', createdEntry.tags[0])
    updateFormField(root, 'tag-1', createdEntry.tags[1])
    submitForm(root)

    let persistedLog = readPersistedLog(storage)
    assert.equal(persistedLog.schemaVersion, 1)
    assert.equal(persistedLog.dataOrigin, 'private')
    assert.equal(persistedLog.featuredEntryId, null)
    assert.deepEqual(persistedLog.entries, [createdEntry])
    assert.ok(root.textContent.includes(createdEntry.title))
    assert.ok(root.textContent.includes(createdEntry.text))
    assert.ok(root.textContent.includes(createdEntry.tags[0]))
    assert.ok(root.textContent.includes(createdEntry.tags[1]))

    findButton(root, 'Eintrag bearbeiten').click()
    updateFormField(root, 'calendarDate', updatedEntry.calendarDate)
    updateFormField(root, 'title', updatedEntry.title)
    updateFormField(root, 'text', updatedEntry.text)
    updateFormField(root, 'tag-0', updatedEntry.tags[0])
    updateFormField(root, 'tag-1', updatedEntry.tags[1])
    submitForm(root)

    persistedLog = readPersistedLog(storage)
    assert.deepEqual(persistedLog.entries, [updatedEntry])
    assert.equal(persistedLog.entries[0].id, createdEntry.id)

    findButton(root, 'Als Lichtwald-Fokus setzen').click()
    persistedLog = readPersistedLog(storage)
    assert.equal(persistedLog.featuredEntryId, updatedEntry.id)

    findButton(root, 'Lichtwald-Fokus entfernen').click()
    persistedLog = readPersistedLog(storage)
    assert.equal(persistedLog.featuredEntryId, null)

    assert.equal(controller.close(), true)
    assert.equal(root.children.length, 0)
    assert.equal(root.hasAttribute('aria-busy'), false)

    controller.open()
    assert.equal(
      findByClass(root, 'lichtwald-log-state--loading').length,
      1
    )
    scheduler.run(1)
    assert.ok(root.textContent.includes(updatedEntry.title))
    assert.ok(root.textContent.includes(updatedEntry.calendarDate))
    assert.ok(root.textContent.includes(updatedEntry.tags[0]))
    assert.ok(root.textContent.includes(updatedEntry.tags[1]))

    const entryCard = findByClass(root, 'lichtwald-log-entry-card')[0]
    assert.ok(entryCard)
    findButton(entryCard, 'Eintrag öffnen').click()
    assert.ok(root.textContent.includes(updatedEntry.text))

    findButton(root, 'Als Lichtwald-Fokus setzen').click()
    assert.equal(
      readPersistedLog(storage).featuredEntryId,
      updatedEntry.id
    )

    const writesBeforeDeleteRequest = storage.setItemCalls
    findButton(root, 'Eintrag dauerhaft löschen').click()
    assert.equal(storage.setItemCalls, writesBeforeDeleteRequest)
    assert.ok(root.textContent.includes(updatedEntry.title))

    findButton(root, 'Dauerhaft löschen').click()
    assert.equal(storage.setItemCalls, writesBeforeDeleteRequest + 1)
    const atomicDeleteSnapshot = JSON.parse(
      storage.writes.at(-1).serializedValue
    )
    assert.equal(atomicDeleteSnapshot.featuredEntryId, null)
    assert.deepEqual(atomicDeleteSnapshot.entries, [])
    assert.equal(
      findByClass(root, 'lichtwald-log-state--empty').length,
      1
    )

    const writesBeforeEmptyReload = storage.setItemCalls
    assert.equal(controller.close(), true)
    controller.open()
    scheduler.run(2)
    assert.equal(
      findByClass(root, 'lichtwald-log-state--empty').length,
      1
    )
    assert.equal(storage.setItemCalls, writesBeforeEmptyReload)
    assert.deepEqual(readPersistedLog(storage), atomicDeleteSnapshot)

    assert.ok(storage.operations.length > 0)
    assert.ok(storage.operations.every(
      ({ key }) => key === LICHTWALD_LOG_STORAGE_KEY
    ))
    assert.deepEqual(
      [...storage.entries.keys()],
      [LICHTWALD_LOG_STORAGE_KEY]
    )
    assert.equal(storage.removeItemCalls, 0)
  } finally {
    controller.close()
    restore()
  }
})

test('ignoriert einen trotz Abbruch ausgeführten veralteten Load vollständig', () => {
  const persistedEntry = {
    id: 'lichtwald-entry-stale-load-synthetic-1',
    calendarDate: '2045-08-09',
    title: 'Synthetischer persistierter Neustart',
    text: 'Ein vollständig erfundener Inhalt für den Lifecycle-Test.',
    tags: ['Lifecycle', 'Fiktiv'],
  }
  const storage = new TrackingFakeStorage([
    [
      LICHTWALD_LOG_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        dataOrigin: 'private',
        featuredEntryId: null,
        entries: [persistedEntry],
      }),
    ],
  ])
  const stack = createStack(storage)
  const {
    controller,
    restore,
    root,
    scheduler,
  } = stack

  try {
    controller.open()
    assert.equal(storage.getItemCalls, 0)
    assert.equal(scheduler.tasks.length, 1)

    assert.equal(controller.close(), true)
    assert.equal(scheduler.tasks[0].cancelCalls, 1)
    assert.equal(root.children.length, 0)
    assert.equal(root.hasAttribute('aria-busy'), false)

    controller.open()
    assert.equal(scheduler.tasks.length, 2)
    const currentLoadingTree = root.children[0]
    assert.ok(currentLoadingTree)

    scheduler.run(0)
    assert.equal(storage.getItemCalls, 0)
    assert.strictEqual(root.children[0], currentLoadingTree)
    assert.equal(
      findByClass(root, 'lichtwald-log-state--loading').length,
      1
    )
    assert.equal(root.textContent.includes(persistedEntry.title), false)

    scheduler.run(1)
    assert.equal(storage.getItemCalls, 1)
    assert.ok(root.textContent.includes(persistedEntry.title))
    assert.equal(
      findByClass(root, 'lichtwald-log-state--loading').length,
      0
    )
  } finally {
    controller.close()
    restore()
  }
})
