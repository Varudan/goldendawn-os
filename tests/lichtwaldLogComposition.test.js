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

function createStack(
  storage = new TrackingFakeStorage(),
  { generatedEntryIds = [SYNTHETIC_ENTRY_ID] } = {}
) {
  const fakeDom = createFakeDom()
  const scheduler = createManualScheduler()
  const storageAdapter = createStorageAdapter(storage)
  const lichtwaldLogStorage = createLichtwaldLogStorage(storageAdapter)
  let generatedEntryIdIndex = 0
  const lichtwaldLogService = createLichtwaldLogService({
    lichtwaldLogStorage,
    generateLichtwaldLogEntryId() {
      const generatedEntryId = generatedEntryIds[generatedEntryIdIndex]
      generatedEntryIdIndex += 1
      return generatedEntryId
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
    .concat(findByTag(root, 'select'))
    .find((control) => control.name === name) ?? null
}

function changeFilter(root, name, value, eventType) {
  const control = findControl(root, name)
  assert.ok(control)
  control.value = value
  control.dispatchEvent({ type: eventType })
}

function readOverviewTitles(root) {
  return findByClass(root, 'lichtwald-log-entry-card').map(
    (card) => findByTag(card, 'h3')[0].textContent
  )
}

function readStorageOperationCounts(storage) {
  return {
    getItemCalls: storage.getItemCalls,
    setItemCalls: storage.setItemCalls,
    removeItemCalls: storage.removeItemCalls,
    operationCount: storage.operations.length,
  }
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
  const packageMetadata = JSON.parse(readFileSync(
    new URL('../package.json', import.meta.url),
    'utf8'
  ))
  const expectedImports = [
    "import './modules/lichtwald-log/lichtwaldLog.css'",
    "import { createLichtwaldLogController } from './modules/lichtwald-log/lichtwaldLogController.js'",
    "import { createLichtwaldLogView } from './modules/lichtwald-log/lichtwaldLogView.js'",
    "import { createLichtwaldLogDemoService } from './services/lichtwaldLogDemoService.js'",
    "import { createLichtwaldLogService } from './services/lichtwaldLogService.js'",
    "import { createLichtwaldLogDemoStorage } from './storage/lichtwaldLogDemoStorage.js'",
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
  assert.equal(
    (mainSource.match(/\bwindow\.localStorage\b/gu) ?? []).length,
    1
  )
  assert.doesNotMatch(
    mainSource,
    /\b(?:sessionStorage|indexedDB|caches)\b/u
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
    'createLichtwaldLogDemoStorage',
    'createLichtwaldLogDemoService',
    'createLichtwaldLogView',
    'createLichtwaldLogController',
  ])
  assert.match(
    mainSource,
    /createLichtwaldLogService\(\{\s*lichtwaldLogStorage,\s*\}\)/u
  )
  assert.match(
    mainSource,
    /createLichtwaldLogController\(\{\s*lichtwaldLogService,\s*lichtwaldLogView,\s*expectedDataOrigin: 'private',\s*\}\)/u
  )
  assert.doesNotMatch(mainSource, /generateLichtwaldLogEntryId/u)
  assert.match(
    mainSource,
    /createLichtwaldLogDemoStorage\(\)/u
  )
  assert.match(
    mainSource,
    /createLichtwaldLogDemoService\(\{\s*lichtwaldLogDemoStorage,\s*\}\)/u
  )
  assert.match(
    mainSource,
    /createLichtwaldLogController\(\{\s*lichtwaldLogService: lichtwaldLogDemoService,\s*lichtwaldLogView: lichtwaldLogDemoView,\s*expectedDataOrigin: 'synthetic',\s*\}\)/u
  )
  const demoCompositionStart = mainSource.indexOf(
    'const lichtwaldLogDemoStorage = createLichtwaldLogDemoStorage()'
  )
  const demoCompositionEnd = mainSource.indexOf(
    'const promptStorage = createPromptStorage(storageAdapter)',
    demoCompositionStart
  )
  assert.ok(
    demoCompositionStart >= 0 &&
    demoCompositionEnd > demoCompositionStart
  )
  const demoCompositionSource = mainSource.slice(
    demoCompositionStart,
    demoCompositionEnd
  )
  assert.doesNotMatch(demoCompositionSource, /\bstorageAdapter\b/u)
  assert.doesNotMatch(demoCompositionSource, /\blichtwaldLogStorage\b/u)
  assert.doesNotMatch(
    demoCompositionSource,
    /\b(?:localStorage|sessionStorage|indexedDB|caches)\b/u
  )
  assert.doesNotMatch(
    mainSource,
    /\blichtwaldLogDemo(?:StorageKey|Key|Marker|Initializer|Initialization|Seeded)\b/iu
  )
  assert.doesNotMatch(
    mainSource,
    /\bgoldendawn\.lichtwaldLog\.[A-Za-z0-9._-]+\b/u
  )
  assert.doesNotMatch(
    mainSource,
    /\bcreateLichtwaldLog(?:Search|Filter|Sync|Agent|Webhook|Network)[A-Za-z]*/u
  )
  assert.doesNotMatch(
    mainSource,
    /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\b/u
  )

  assert.match(
    mainSource,
    /const VIEW_LICHTWALD_LOG = 'lichtwald-log'/u
  )
  assert.match(
    mainSource,
    /const VIEW_LICHTWALD_LOG_DEMO = 'lichtwald-log-demo'/u
  )
  const moduleStart = mainSource.indexOf('id: VIEW_LICHTWALD_LOG')
  const moduleEnd = mainSource.indexOf('\n  },', moduleStart)
  assert.ok(moduleStart >= 0 && moduleEnd > moduleStart)
  const moduleSource = mainSource.slice(moduleStart, moduleEnd)
  assert.match(moduleSource, /status: 'Lokales MVP'/u)
  assert.match(moduleSource, /statusClass: 'local'/u)
  assert.match(moduleSource, /navigationState: 'Lokales MVP'/u)
  assert.match(moduleSource, /isNavigable: true/u)
  assert.match(moduleSource, /Suche/u)
  assert.match(moduleSource, /Filter/u)
  assert.doesNotMatch(moduleSource, /Demo/u)

  const demoModuleStart = mainSource.indexOf(
    'id: VIEW_LICHTWALD_LOG_DEMO'
  )
  const demoModuleEnd = mainSource.indexOf('\n  },', demoModuleStart)
  assert.ok(demoModuleStart > moduleEnd && demoModuleEnd > demoModuleStart)
  const demoModuleSource = mainSource.slice(
    demoModuleStart,
    demoModuleEnd
  )
  assert.match(demoModuleSource, /name: 'LichtwaldLog Demo'/u)
  assert.match(demoModuleSource, /status: 'Synthetische Demo'/u)
  assert.match(demoModuleSource, /statusClass: 'local'/u)
  assert.match(demoModuleSource, /navigationState: 'Synthetische Demo'/u)
  assert.match(demoModuleSource, /vollständig erfundene/iu)
  assert.match(demoModuleSource, /isNavigable: true/u)

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
  const demoCloseGuardIndex = showViewSource.indexOf(
    'activeView === VIEW_LICHTWALD_LOG_DEMO'
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
  assert.ok(closeGuardIndex < demoCloseGuardIndex)
  assert.ok(demoCloseGuardIndex < activeViewAssignmentIndex)
  assert.ok(demoCloseGuardIndex < navigationIndex)
  assert.match(
    showViewSource,
    /activeView === VIEW_LICHTWALD_LOG\s*&&\s*lichtwaldLogController\.close\(\) === false\s*\)\s*\{\s*return/u
  )
  assert.match(
    showViewSource,
    /activeView === VIEW_LICHTWALD_LOG_DEMO\s*&&\s*lichtwaldLogDemoController\.close\(\) === false\s*\)\s*\{\s*return/u
  )
  assert.match(
    showViewSource,
    /activeView === VIEW_LICHTWALD_LOG\)\s*\{\s*document\.title = 'GoldenDawn OS – LichtwaldLog'\s*lichtwaldLogController\.open\(\)/u
  )
  assert.match(
    showViewSource,
    /activeView === VIEW_LICHTWALD_LOG_DEMO\)\s*\{\s*document\.title = 'GoldenDawn OS – LichtwaldLog Demo'\s*lichtwaldLogDemoController\.open\(\)/u
  )
  const privateOpenBranch = showViewSource.slice(
    showViewSource.indexOf(
      'activeView === VIEW_LICHTWALD_LOG)'
    ),
    showViewSource.indexOf(
      'activeView === VIEW_LICHTWALD_LOG_DEMO)'
    )
  )
  const demoBranchStart = showViewSource.indexOf(
    'activeView === VIEW_LICHTWALD_LOG_DEMO)'
  )
  const demoOpenBranch = showViewSource.slice(
    demoBranchStart,
    showViewSource.indexOf('\n  } else {', demoBranchStart)
  )
  assert.doesNotMatch(privateOpenBranch, /lichtwaldLogDemo/u)
  assert.doesNotMatch(demoOpenBranch, /lichtwaldLogController\.open/u)
  assert.doesNotMatch(
    mainSource,
    /lichtwaldLog(?:Demo)?Controller\.open\(\)[\s\S]{0,80}\b(?:fallback|catch)\b/iu
  )
  assert.match(
    mainSource,
    /v0\.3\.0 – Local SyncAgent and Transport Foundation/u
  )
  assert.match(
    mainSource,
    /<span>Status<\/span>\s*<strong>In Entwicklung<\/strong>/u
  )
  assert.match(
    mainSource,
    /<span>Veröffentlicht<\/span>\s*<strong>v0\.2\.2 – LichtwaldLog Local MVP<\/strong>/u
  )
  assert.match(
    mainSource,
    /ADR 0023 und die lokalen Sync-Foundations sind umgesetzt/u
  )
  assert.match(
    mainSource,
    /Der lokale SyncAgent-Kern ist noch nicht implementiert/u
  )
  assert.match(mainSource, /keinen externen Produktdatenfluss/u)
  assert.match(
    mainSource,
    /Optionale Provider folgen erst nach dem vollständig lokalen Pfad/u
  )
  assert.match(
    mainSource,
    /Lokaler modell- und providerfreier syncTest-SyncAgent-Kern/u
  )
  assert.match(mainSource, /status status--next">Als Nächstes/u)
  assert.match(mainSource, /<span>Release v0\.2\.2<\/span>/u)
  assert.match(
    mainSource,
    /<strong>· v0\.3\.0 in Entwicklung<\/strong>/u
  )
  assert.doesNotMatch(mainSource, /\bWebhook Foundation\b/iu)
  assert.doesNotMatch(
    mainSource,
    /v0\.3\.0[\s\S]{0,80}\bnoch nicht begonnen\b/iu
  )
  assert.doesNotMatch(
    mainSource,
    /\b(?:operativer|aktiver) SyncAgent\b/iu
  )
  assert.doesNotMatch(
    mainSource,
    /\bexterner Produktdatenfluss (?:ist|wurde) (?:aktiv|operativ|umgesetzt)\b/iu
  )
  assert.deepEqual(
    {
      version: packageMetadata.version,
      private: packageMetadata.private,
      license: packageMetadata.license,
    },
    {
      version: '0.2.2',
      private: true,
      license: 'UNLICENSED',
    }
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

test('durchsucht und filtert den realen privaten Stack rein transient und reconciliert autoritative Mutationen', () => {
  const initialEntries = [
    {
      id: 'lichtwald-entry-composition-prism-1',
      calendarDate: '2044-03-17',
      title: 'Erfundene Ätherlaterne',
      text: 'Eine synthetische Passage über kristallene Funken.',
      tags: ['Wald', 'Prisma'],
    },
    {
      id: 'lichtwald-entry-composition-orbit-2',
      calendarDate: '2039-11-05',
      title: 'Synthetische Orbitkarte',
      text: 'Eine frei erfundene Zeile über schwebenden Nebel.',
      tags: ['Waldweg', 'Fiktiv'],
    },
    {
      id: 'lichtwald-entry-composition-echo-3',
      calendarDate: '2044-03-17',
      title: 'Erfundenes Klangarchiv',
      text: 'Literalzeichen .* und <script> bleiben gewöhnlicher Text.',
      tags: ['Äther', 'Fiktiv'],
    },
  ]
  const initialRoot = {
    schemaVersion: 1,
    dataOrigin: 'private',
    featuredEntryId: null,
    entries: initialEntries,
  }
  const storage = new TrackingFakeStorage([
    [LICHTWALD_LOG_STORAGE_KEY, JSON.stringify(initialRoot)],
  ])
  const createdEntryId = 'lichtwald-entry-composition-moon-4'
  const stack = createStack(storage, {
    generatedEntryIds: [createdEntryId],
  })
  const {
    controller,
    restore,
    root,
    scheduler,
  } = stack
  const assertTitles = (expectedTitles) => {
    assert.deepEqual(readOverviewTitles(root), expectedTitles)
  }
  const resetFilters = () => {
    const resetButton = findButton(
      root,
      'Suche und Filter zurücksetzen'
    )
    assert.ok(resetButton)
    resetButton.click()
  }

  try {
    controller.open()
    scheduler.run(0)
    assertTitles(initialEntries.map((entry) => entry.title))
    assert.equal(
      findByClass(root, 'lichtwald-log-results-status')[0].textContent,
      '3 Einträge'
    )

    const serializedBeforeFilters = storage.peek(
      LICHTWALD_LOG_STORAGE_KEY
    )
    const operationCountsBeforeFilters = readStorageOperationCounts(storage)

    changeFilter(root, 'lichtwaldLogSearch', '2044-03-17', 'input')
    assertTitles([initialEntries[0].title, initialEntries[2].title])
    resetFilters()
    changeFilter(root, 'lichtwaldLogSearch', 'A\u0308THERLATERNE', 'input')
    assertTitles([initialEntries[0].title])
    resetFilters()
    changeFilter(root, 'lichtwaldLogSearch', 'schwebenden Nebel', 'input')
    assertTitles([initialEntries[1].title])
    resetFilters()
    changeFilter(root, 'lichtwaldLogSearch', 'prisma', 'input')
    assertTitles([initialEntries[0].title])
    resetFilters()
    changeFilter(root, 'lichtwaldLogSearch', '.*', 'input')
    assertTitles([initialEntries[2].title])
    resetFilters()
    changeFilter(root, 'lichtwaldLogSearch', '<SCRIPT>', 'input')
    assertTitles([initialEntries[2].title])
    resetFilters()

    changeFilter(
      root,
      'lichtwaldLogCalendarDateFilter',
      '2044-03-17',
      'change'
    )
    assertTitles([initialEntries[0].title, initialEntries[2].title])
    resetFilters()
    changeFilter(root, 'lichtwaldLogTagFilter', 'Wald', 'change')
    assertTitles([initialEntries[0].title])
    assert.equal(root.textContent.includes(initialEntries[1].title), false)
    resetFilters()

    changeFilter(root, 'lichtwaldLogSearch', 'erfunden', 'input')
    changeFilter(
      root,
      'lichtwaldLogCalendarDateFilter',
      '2044-03-17',
      'change'
    )
    changeFilter(root, 'lichtwaldLogTagFilter', 'Fiktiv', 'change')
    assertTitles([initialEntries[2].title])
    assert.equal(
      findByClass(root, 'lichtwald-log-results-status')[0].textContent,
      '1 von 3 Einträgen'
    )

    changeFilter(
      root,
      'lichtwaldLogSearch',
      'vollständig abwesende Suche',
      'input'
    )
    assertTitles([])
    assert.equal(
      findByClass(root, 'lichtwald-log-state--filtered-empty').length,
      1
    )
    assert.equal(
      findByClass(root, 'lichtwald-log-results-status')[0].textContent,
      '0 von 3 Einträgen'
    )
    resetFilters()
    assertTitles(initialEntries.map((entry) => entry.title))

    assert.equal(
      storage.peek(LICHTWALD_LOG_STORAGE_KEY),
      serializedBeforeFilters
    )
    assert.deepEqual(
      readStorageOperationCounts(storage),
      operationCountsBeforeFilters
    )
    assert.deepEqual(
      [...storage.entries.keys()],
      [LICHTWALD_LOG_STORAGE_KEY]
    )

    const staleCardButton = findButton(
      findByClass(root, 'lichtwald-log-entry-card')[0],
      'Eintrag öffnen'
    )
    const staleSearch = findControl(root, 'lichtwaldLogSearch')
    staleSearch.value = 'orbitkarte'
    staleSearch.dispatchEvent({ type: 'input' })
    assertTitles([initialEntries[1].title])
    staleSearch.value = 'prisma'
    staleSearch.dispatchEvent({ type: 'input' })
    staleCardButton.click()
    assertTitles([initialEntries[1].title])
    assert.equal(findByClass(root, 'lichtwald-log-detail').length, 0)
    resetFilters()

    changeFilter(root, 'lichtwaldLogSearch', 'kristallene', 'input')
    assertTitles([initialEntries[0].title])
    findButton(root, 'Eintrag öffnen').click()
    assert.equal(findByClass(root, 'lichtwald-log-detail').length, 1)
    assert.ok(root.textContent.includes(initialEntries[0].text))
    findButton(root, '← Zur Übersicht').click()
    assert.equal(findControl(root, 'lichtwaldLogSearch').value, 'kristallene')
    assertTitles([initialEntries[0].title])

    findButton(root, 'Eintrag öffnen').click()
    findButton(root, 'Eintrag bearbeiten').click()
    updateFormField(
      root,
      'text',
      'Eine autoritativ aktualisierte synthetische Passage.'
    )
    submitForm(root)
    assert.equal(findByClass(root, 'lichtwald-log-detail').length, 1)
    assert.ok(root.textContent.includes(initialEntries[0].title))
    findButton(root, '← Zur Übersicht').click()
    assertTitles([])
    assert.equal(
      findByClass(root, 'lichtwald-log-state--filtered-empty').length,
      1
    )
    resetFilters()

    changeFilter(root, 'lichtwaldLogTagFilter', 'Fiktiv', 'change')
    assertTitles([initialEntries[1].title, initialEntries[2].title])
    findButton(
      findByClass(root, 'lichtwald-log-entry-card')[0],
      'Eintrag öffnen'
    ).click()
    findButton(root, 'Als Lichtwald-Fokus setzen').click()
    assert.equal(
      readPersistedLog(storage).featuredEntryId,
      initialEntries[1].id
    )
    findButton(root, '← Zur Übersicht').click()
    assert.equal(findControl(root, 'lichtwaldLogTagFilter').value, 'Fiktiv')
    assertTitles([initialEntries[1].title, initialEntries[2].title])

    findButton(
      findByClass(root, 'lichtwald-log-entry-card')[0],
      'Eintrag öffnen'
    ).click()
    findButton(root, 'Eintrag dauerhaft löschen').click()
    findButton(root, 'Dauerhaft löschen').click()
    assert.equal(readPersistedLog(storage).featuredEntryId, null)
    assert.equal(findControl(root, 'lichtwaldLogTagFilter').value, 'Fiktiv')
    assertTitles([initialEntries[2].title])

    findButton(root, 'Neuen Eintrag erstellen').click()
    updateFormField(root, 'calendarDate', '2051-08-09')
    updateFormField(root, 'title', 'Synthetische Mondlaterne')
    updateFormField(root, 'text', 'Ein vollständig erfundener neuer Eintrag.')
    findButton(root, 'Tag hinzufügen').click()
    updateFormField(root, 'tag-0', 'Mondpfad')
    submitForm(root)
    assert.ok(root.textContent.includes('Synthetische Mondlaterne'))
    findButton(root, '← Zur Übersicht').click()
    assert.equal(findControl(root, 'lichtwaldLogTagFilter').value, 'Fiktiv')
    assertTitles([initialEntries[2].title])

    const persistedAfterMutations = readPersistedLog(storage)
    assert.equal(persistedAfterMutations.schemaVersion, 1)
    assert.equal(persistedAfterMutations.dataOrigin, 'private')
    assert.deepEqual(
      persistedAfterMutations.entries.map((entry) => entry.id),
      [initialEntries[0].id, initialEntries[2].id, createdEntryId]
    )
    for (const transientPropertyName of [
      'searchQuery',
      'calendarDateFilter',
      'selectedTag',
      'availableTags',
      'visibleEntryIds',
      'hasActiveFilters',
      'filteredEmptyState',
    ]) {
      assert.equal(
        Object.hasOwn(persistedAfterMutations, transientPropertyName),
        false
      )
    }

    assert.equal(controller.close(), true)
    controller.open()
    scheduler.run()
    assert.equal(findControl(root, 'lichtwaldLogSearch').value, '')
    assert.equal(
      findControl(root, 'lichtwaldLogCalendarDateFilter').value,
      ''
    )
    assert.equal(findControl(root, 'lichtwaldLogTagFilter').value, '')
    assertTitles([
      initialEntries[0].title,
      initialEntries[2].title,
      'Synthetische Mondlaterne',
    ])
    assert.deepEqual(readPersistedLog(storage), persistedAfterMutations)

    const serializedBeforeDirtyClose = storage.peek(
      LICHTWALD_LOG_STORAGE_KEY
    )
    findButton(root, 'Neuen Eintrag erstellen').click()
    updateFormField(root, 'title', 'Synthetischer schmutziger Entwurf')
    assert.equal(controller.close(), false)
    assert.equal(
      storage.peek(LICHTWALD_LOG_STORAGE_KEY),
      serializedBeforeDirtyClose
    )
    assert.ok(root.textContent.includes('Speichere den Eintrag'))
    findButton(root, 'Abbrechen').click()
    assert.equal(controller.close(), true)
    assert.equal(root.children.length, 0)

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
