import assert from 'node:assert/strict'
import test from 'node:test'

import { createLichtwaldLogController } from '../src/modules/lichtwald-log/lichtwaldLogController.js'
import { createLichtwaldLogView } from '../src/modules/lichtwald-log/lichtwaldLogView.js'
import { createLichtwaldLogDemoService } from '../src/services/lichtwaldLogDemoService.js'
import { createLichtwaldLogService } from '../src/services/lichtwaldLogService.js'
import { createLichtwaldLogDemoStorage } from '../src/storage/lichtwaldLogDemoStorage.js'
import {
  createLichtwaldLogStorage,
  LICHTWALD_LOG_STORAGE_KEY,
} from '../src/storage/lichtwaldLogStorage.js'
import { createStorageAdapter } from '../src/storage/storageAdapter.js'
import {
  createFakeDom,
  findAll,
  findByClass,
  findByTag,
} from './helpers/fakeDom.js'
import { FakeStorage } from './helpers/fakeStorage.js'

const PRIVATE_VIEW = 'private'
const DEMO_VIEW = 'demo'
const SHARED_ENTRY_ID = 'lichtwald-entry-shared-composition-id'
const PRIVATE_TITLE = '[Test] Privater synthetischer Isolationsanker'
const CREATED_DEMO_TITLE = '[Demo] Neue Papiermond-Station'
const UPDATED_DEMO_TITLE = '[Demo] Aktualisierte Papiermond-Station'
const FILTER_UPDATED_DEMO_TITLE = '[Demo] Aktualisierte Prismastation'
const DEMO_SEED_TITLES = [
  '[Demo] Ätherprisma im Wolkenarchiv',
  '[Demo] Wegweiser aus Mondglas',
  '[Demo] Mechanische Sternenblüte',
  '[Demo] Klangpost aus dem Nordlichtlabor',
  '[Demo] Miniaturhafen über den Wolken',
]

function createPrivateSnapshot() {
  return {
    schemaVersion: 1,
    dataOrigin: 'private',
    featuredEntryId: null,
    entries: [
      {
        id: SHARED_ENTRY_ID,
        calendarDate: '2044-02-03',
        title: PRIVATE_TITLE,
        text: 'Vollständig erfundener privater Testbestand für die Kompositionsgrenze.',
        tags: ['Testgrenze'],
      },
    ],
  }
}

class TrackingFakeStorage extends FakeStorage {
  constructor(initialEntries = []) {
    super(initialEntries)
    this.operations = []
  }

  getItem(key) {
    this.operations.push({ type: 'get', key: String(key) })
    return super.getItem(key)
  }

  setItem(key, value) {
    this.operations.push({ type: 'set', key: String(key) })
    return super.setItem(key, value)
  }

  removeItem(key) {
    this.operations.push({ type: 'remove', key: String(key) })
    return super.removeItem(key)
  }
}

function createPrivateBrowserStorage() {
  return new TrackingFakeStorage([
    [
      LICHTWALD_LOG_STORAGE_KEY,
      JSON.stringify(createPrivateSnapshot()),
    ],
    ['unrelated.synthetic.fixture.v1', '{"kept":true}'],
  ])
}

function createManualScheduler() {
  const tasks = []

  return {
    tasks,
    scheduleTask(callback) {
      const task = {
        callback,
        cancelCalls: 0,
        ran: false,
      }
      tasks.push(task)

      return () => {
        task.cancelCalls += 1
      }
    },
    run(index) {
      const task = tasks[index]
      assert.ok(task)
      assert.equal(task.ran, false)
      task.ran = true
      task.callback()
    },
    runNext() {
      const index = tasks.findIndex((task) => task.ran === false)
      assert.notEqual(index, -1)
      this.run(index)
      return index
    },
  }
}

function createDualComposition({
  privateStorage = createPrivateBrowserStorage(),
  demoEntryIds = [SHARED_ENTRY_ID],
} = {}) {
  const fakeDom = createFakeDom()
  const scheduler = createManualScheduler()
  const storageAdapter = createStorageAdapter(privateStorage)
  const privateDomainStorage = createLichtwaldLogStorage(storageAdapter)
  const privateService = createLichtwaldLogService({
    lichtwaldLogStorage: privateDomainStorage,
    generateLichtwaldLogEntryId() {
      return 'lichtwald-entry-private-unused'
    },
  })
  const demoStorage = createLichtwaldLogDemoStorage()
  let demoEntryIdIndex = 0
  const demoService = createLichtwaldLogDemoService({
    lichtwaldLogDemoStorage: demoStorage,
    generateLichtwaldLogDemoEntryId() {
      const generatedId = demoEntryIds[demoEntryIdIndex]
      demoEntryIdIndex += 1
      return generatedId
    },
  })
  const privateView = createLichtwaldLogView(fakeDom.root)
  const demoView = createLichtwaldLogView(fakeDom.root)
  const privateController = createLichtwaldLogController({
    lichtwaldLogService: privateService,
    lichtwaldLogView: privateView,
    scheduleTask: scheduler.scheduleTask,
    expectedDataOrigin: 'private',
  })
  const demoController = createLichtwaldLogController({
    lichtwaldLogService: demoService,
    lichtwaldLogView: demoView,
    scheduleTask: scheduler.scheduleTask,
    expectedDataOrigin: 'synthetic',
  })
  let activeView = null

  function showView(viewName) {
    if (viewName === activeView) {
      return true
    }

    if (
      activeView === PRIVATE_VIEW &&
      privateController.close() === false
    ) {
      return false
    }

    if (
      activeView === DEMO_VIEW &&
      demoController.close() === false
    ) {
      return false
    }

    activeView = viewName

    if (activeView === PRIVATE_VIEW) {
      privateController.open()
    } else if (activeView === DEMO_VIEW) {
      demoController.open()
    }

    return true
  }

  function close() {
    if (activeView === PRIVATE_VIEW) {
      privateController.close()
    } else if (activeView === DEMO_VIEW) {
      demoController.close()
    }

    activeView = null
  }

  return {
    ...fakeDom,
    activeView() {
      return activeView
    },
    close,
    demoController,
    demoService,
    demoStorage,
    demoView,
    privateController,
    privateDomainStorage,
    privateService,
    privateStorage,
    privateView,
    scheduler,
    showView,
    storageAdapter,
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

function readOverviewTitles(root) {
  return findByClass(root, 'lichtwald-log-entry-card').map(
    (card) => findByTag(card, 'h3')[0].textContent
  )
}

function findCardByTitle(root, title) {
  return findByClass(root, 'lichtwald-log-entry-card').find((card) => (
    findByTag(card, 'h3')[0]?.textContent === title
  )) ?? null
}

function capturePrivateBrowserState(storage) {
  return {
    entries: [...storage.entries.entries()],
    getItemCalls: storage.getItemCalls,
    setItemCalls: storage.setItemCalls,
    removeItemCalls: storage.removeItemCalls,
    operations: storage.operations.map((operation) => ({ ...operation })),
  }
}

function readDemoSnapshot(demoStorage) {
  const result = demoStorage.loadLichtwaldLog()
  assert.equal(result.ok, true)
  assert.equal(result.status, 'found')
  return result.lichtwaldLog
}

function changeFilter(root, name, value) {
  const control = findControl(root, name)
  assert.ok(control)
  control.value = value
  control.dispatchEvent({
    type: name === 'lichtwaldLogSearch' ? 'input' : 'change',
  })
}

function readResultStatus(root) {
  const status = findByClass(root, 'lichtwald-log-results-status')[0]
  assert.ok(status)
  return status.textContent
}

function assertPrivateBrowserStateUnchanged(storage, expectedState) {
  assert.deepEqual(capturePrivateBrowserState(storage), expectedState)
}

function assertSyntheticDemoSnapshot(demoStorage) {
  const snapshot = readDemoSnapshot(demoStorage)
  assert.equal(snapshot.dataOrigin, 'synthetic')
  return snapshot
}

function assertEntryIdsAbsentFromDom(root, entryIds) {
  const elements = findAll(
    root,
    (node) => node.nodeType === 1
  )

  for (const entryId of entryIds) {
    assert.equal(root.textContent.includes(entryId), false)

    for (const element of elements) {
      for (const attributeValue of element.attributes.values()) {
        assert.equal(attributeValue.includes(entryId), false)
      }

      assert.notEqual(element.value, entryId)
    }
  }
}

function installRuntimeInteractionProbe() {
  const calls = {
    console: [],
    network: [],
  }
  const restoreCallbacks = []

  function replaceProperty(target, propertyName, replacement) {
    const descriptor = Object.getOwnPropertyDescriptor(
      target,
      propertyName
    )

    if (descriptor?.configurable === false) {
      if (!Object.hasOwn(descriptor, 'value') || descriptor.writable !== true) {
        return false
      }

      const originalValue = target[propertyName]
      target[propertyName] = replacement
      restoreCallbacks.push(() => {
        target[propertyName] = originalValue
      })
      return true
    }

    Object.defineProperty(target, propertyName, {
      configurable: true,
      writable: true,
      value: replacement,
    })
    restoreCallbacks.push(() => {
      if (descriptor) {
        Object.defineProperty(target, propertyName, descriptor)
      } else {
        delete target[propertyName]
      }
    })
    return true
  }

  for (const methodName of ['debug', 'error', 'info', 'log', 'warn']) {
    assert.equal(
      replaceProperty(console, methodName, (...args) => {
        calls.console.push({ methodName, args })
      }),
      true
    )
  }

  for (
    const networkName of [
      'fetch',
      'XMLHttpRequest',
      'WebSocket',
      'EventSource',
    ]
  ) {
    const replacement = function networkInteractionProbe(...args) {
      calls.network.push({ networkName, args })

      if (networkName === 'fetch') {
        return Promise.resolve({ ok: false })
      }

      return undefined
    }

    assert.equal(
      replaceProperty(globalThis, networkName, replacement),
      true
    )
  }

  if (globalThis.navigator) {
    assert.equal(
      replaceProperty(
        globalThis.navigator,
        'sendBeacon',
        (...args) => {
          calls.network.push({ networkName: 'sendBeacon', args })
          return true
        }
      ),
      true
    )
  }

  return {
    calls,
    restore() {
      restoreCallbacks.reverse().forEach((restore) => restore())
    },
  }
}

test('hält private und synthetische Stacks trotz gleicher Entry-ID vollständig getrennt und setzt nur die Demo bei neuer Komposition zurück', () => {
  const privateStorage = createPrivateBrowserStorage()
  const first = createDualComposition({ privateStorage })
  let canonicalRemovedTitle

  try {
    assert.notEqual(first.privateController, first.demoController)
    assert.notEqual(first.privateView, first.demoView)
    assert.notEqual(first.privateService, first.demoService)
    assert.notEqual(first.privateDomainStorage, first.demoStorage)
    assert.equal(
      JSON.parse(privateStorage.peek(LICHTWALD_LOG_STORAGE_KEY)).dataOrigin,
      'private'
    )

    assert.equal(first.showView(PRIVATE_VIEW), true)
    first.scheduler.runNext()
    assert.deepEqual(readOverviewTitles(first.root), [PRIVATE_TITLE])
    const stalePrivateOpen = findButton(first.root, 'Eintrag öffnen')
    assert.ok(stalePrivateOpen)
    const privateStateBeforeDemo = capturePrivateBrowserState(
      privateStorage
    )

    assert.equal(first.showView(DEMO_VIEW), true)
    first.scheduler.runNext()
    assert.ok(first.root.textContent.includes('LichtwaldLog Demo'))
    assert.ok(first.root.textContent.includes('Demo · nur für diese Sitzung'))
    assert.ok(first.root.textContent.includes('vollständig erfunden'))
    assert.deepEqual(readOverviewTitles(first.root), DEMO_SEED_TITLES)
    assertSyntheticDemoSnapshot(first.demoStorage)
    assert.equal(first.root.textContent.includes(PRIVATE_TITLE), false)

    const demoDomBeforeStaleAction = first.root.textContent
    stalePrivateOpen.click()
    assert.equal(first.root.textContent, demoDomBeforeStaleAction)

    findButton(first.root, 'Neuen Demo-Eintrag erstellen').click()
    updateFormField(first.root, 'calendarDate', '2045-03-04')
    updateFormField(first.root, 'title', CREATED_DEMO_TITLE)
    updateFormField(
      first.root,
      'text',
      'Eine vollständig erfundene Papiermond-Station schwebt über einem geometrischen Hafen.'
    )
    findButton(first.root, 'Tag hinzufügen').click()
    updateFormField(first.root, 'tag-0', 'Papiermond')
    submitForm(first.root)
    assert.equal(
      assertSyntheticDemoSnapshot(first.demoStorage).entries.length,
      6
    )

    findButton(first.root, 'Demo-Eintrag bearbeiten').click()
    updateFormField(first.root, 'calendarDate', '2046-04-05')
    updateFormField(first.root, 'title', UPDATED_DEMO_TITLE)
    updateFormField(
      first.root,
      'text',
      'Die aktualisierte erfundene Papiermond-Station sendet prismatische Karten in den Wolkenhafen.'
    )
    updateFormField(first.root, 'tag-0', 'Prismakarte')
    submitForm(first.root)
    assert.equal(
      assertSyntheticDemoSnapshot(first.demoStorage).entries.length,
      6
    )
    findButton(first.root, 'Als Demo-Fokus setzen').click()
    assert.equal(
      assertSyntheticDemoSnapshot(first.demoStorage).featuredEntryId,
      SHARED_ENTRY_ID
    )
    assert.ok(first.root.textContent.includes('Demo-Fokus: ausgewählt'))
    findButton(first.root, '← Zur Übersicht').click()

    const mutatedDemoSnapshot = readDemoSnapshot(first.demoStorage)
    const createdDemoEntry = mutatedDemoSnapshot.entries.find(
      (entry) => entry.title === UPDATED_DEMO_TITLE
    )
    assert.ok(createdDemoEntry)
    assert.equal(createdDemoEntry.id, SHARED_ENTRY_ID)
    assert.equal(createPrivateSnapshot().entries[0].id, SHARED_ENTRY_ID)
    assert.equal(mutatedDemoSnapshot.featuredEntryId, SHARED_ENTRY_ID)

    canonicalRemovedTitle = readOverviewTitles(first.root).find(
      (title) => title !== UPDATED_DEMO_TITLE
    )
    assert.equal(typeof canonicalRemovedTitle, 'string')
    const canonicalCard = findCardByTitle(
      first.root,
      canonicalRemovedTitle
    )
    assert.ok(canonicalCard)
    findButton(canonicalCard, 'Demo-Eintrag öffnen').click()
    findButton(first.root, 'Demo-Eintrag entfernen').click()
    findButton(first.root, 'Aus Sitzung entfernen').click()
    assert.equal(
      assertSyntheticDemoSnapshot(first.demoStorage).entries.length,
      5
    )
    assert.equal(first.root.textContent.includes(canonicalRemovedTitle), false)
    assert.deepEqual(
      capturePrivateBrowserState(privateStorage),
      privateStateBeforeDemo
    )

    assert.equal(first.showView(PRIVATE_VIEW), true)
    first.scheduler.runNext()
    assert.deepEqual(readOverviewTitles(first.root), [PRIVATE_TITLE])
    assert.equal(first.root.textContent.includes(UPDATED_DEMO_TITLE), false)
    assert.equal(
      privateStorage.peek(LICHTWALD_LOG_STORAGE_KEY),
      privateStateBeforeDemo.entries.find(
        ([key]) => key === LICHTWALD_LOG_STORAGE_KEY
      )[1]
    )
    assert.equal(privateStorage.setItemCalls, 0)

    assert.equal(first.showView(DEMO_VIEW), true)
    first.scheduler.runNext()
    const reopenedTitles = readOverviewTitles(first.root)
    assert.equal(reopenedTitles.includes(UPDATED_DEMO_TITLE), true)
    assert.equal(reopenedTitles.includes(canonicalRemovedTitle), false)
    assert.equal(reopenedTitles.length, 5)

    findButton(
      findCardByTitle(first.root, UPDATED_DEMO_TITLE),
      'Demo-Eintrag öffnen'
    ).click()
    assert.equal(
      findByClass(first.root, 'lichtwald-log-detail').length,
      1
    )
    assert.equal(first.showView(PRIVATE_VIEW), true)
    first.scheduler.runNext()
    assert.equal(first.showView(DEMO_VIEW), true)
    first.scheduler.runNext()
    assert.equal(
      findByClass(first.root, 'lichtwald-log-detail').length,
      0
    )
    assert.equal(
      findControl(first.root, 'lichtwaldLogSearch').value,
      ''
    )
    assert.equal(
      readOverviewTitles(first.root).includes(UPDATED_DEMO_TITLE),
      true
    )
  } finally {
    first.close()
    first.restore()
  }

  const second = createDualComposition({ privateStorage })

  try {
    const privateStateBeforeFreshDemo = capturePrivateBrowserState(
      privateStorage
    )
    assert.equal(second.showView(DEMO_VIEW), true)
    second.scheduler.runNext()
    const freshTitles = readOverviewTitles(second.root)
    assert.deepEqual(freshTitles, DEMO_SEED_TITLES)
    assert.equal(freshTitles.includes(UPDATED_DEMO_TITLE), false)
    assert.equal(freshTitles.includes(canonicalRemovedTitle), true)
    assert.deepEqual(
      assertSyntheticDemoSnapshot(second.demoStorage).entries.map(
        (entry) => entry.title
      ),
      DEMO_SEED_TITLES
    )
    assert.deepEqual(
      capturePrivateBrowserState(privateStorage),
      privateStateBeforeFreshDemo
    )

    assert.equal(second.showView(PRIVATE_VIEW), true)
    second.scheduler.runNext()
    assert.deepEqual(readOverviewTitles(second.root), [PRIVATE_TITLE])
    assert.equal(privateStorage.setItemCalls, 0)
    assert.deepEqual(
      [...privateStorage.entries.keys()],
      [
        LICHTWALD_LOG_STORAGE_KEY,
        'unrelated.synthetic.fixture.v1',
      ]
    )
  } finally {
    second.close()
    second.restore()
  }
})

test('durchsucht und filtert den kanonischen Demo-Seed literal, normalisiert und in stabiler Reihenfolge', () => {
  const composition = createDualComposition()

  try {
    const privateStateBeforeDemo = capturePrivateBrowserState(
      composition.privateStorage
    )
    assert.equal(composition.showView(DEMO_VIEW), true)
    composition.scheduler.runNext()
    const canonicalDemoSnapshot = assertSyntheticDemoSnapshot(
      composition.demoStorage
    )

    assert.deepEqual(readOverviewTitles(composition.root), DEMO_SEED_TITLES)
    assert.equal(readResultStatus(composition.root), '5 Einträge')

    const searchCases = [
      {
        query: '2035-01-09',
        titles: [DEMO_SEED_TITLES[4]],
      },
      {
        query: 'WEGWEISER AUS MONDGLAS',
        titles: [DEMO_SEED_TITLES[1]],
      },
      {
        query: 'messingMASCHINE',
        titles: [DEMO_SEED_TITLES[3]],
      },
      {
        query: 'klangGARTEN',
        titles: [DEMO_SEED_TITLES[2]],
      },
      {
        query: 'A\u0308THERPRISMA',
        titles: [DEMO_SEED_TITLES[0]],
      },
      {
        query: '[Demo]',
        titles: DEMO_SEED_TITLES,
      },
    ]

    for (const { query, titles } of searchCases) {
      changeFilter(
        composition.root,
        'lichtwaldLogSearch',
        query
      )
      assert.deepEqual(readOverviewTitles(composition.root), titles)
      assert.equal(
        readResultStatus(composition.root),
        `${titles.length} von 5 Einträgen`
      )
      assert.deepEqual(
        assertSyntheticDemoSnapshot(composition.demoStorage),
        canonicalDemoSnapshot
      )
      assertPrivateBrowserStateUnchanged(
        composition.privateStorage,
        privateStateBeforeDemo
      )
    }

    changeFilter(
      composition.root,
      'lichtwaldLogSearch',
      'nicht-vorhandenes-papiergestirn'
    )
    assert.deepEqual(readOverviewTitles(composition.root), [])
    assert.equal(readResultStatus(composition.root), '0 von 5 Einträgen')
    assert.ok(
      findByClass(
        composition.root,
        'lichtwald-log-state--filtered-empty'
      )[0]
    )
    findButton(
      composition.root,
      'Suche und Filter zurücksetzen'
    ).click()
    assert.deepEqual(readOverviewTitles(composition.root), DEMO_SEED_TITLES)
    assert.equal(readResultStatus(composition.root), '5 Einträge')

    changeFilter(
      composition.root,
      'lichtwaldLogCalendarDateFilter',
      '2034-05-20'
    )
    assert.deepEqual(
      readOverviewTitles(composition.root),
      DEMO_SEED_TITLES.slice(0, 2)
    )
    assert.equal(readResultStatus(composition.root), '2 von 5 Einträgen')
    findButton(
      composition.root,
      'Suche und Filter zurücksetzen'
    ).click()

    changeFilter(
      composition.root,
      'lichtwaldLogTagFilter',
      'Wald'
    )
    assert.deepEqual(
      readOverviewTitles(composition.root),
      [DEMO_SEED_TITLES[0], DEMO_SEED_TITLES[2]]
    )
    assert.equal(
      readOverviewTitles(composition.root).includes(DEMO_SEED_TITLES[1]),
      false
    )
    assert.equal(readResultStatus(composition.root), '2 von 5 Einträgen')
    findButton(
      composition.root,
      'Suche und Filter zurücksetzen'
    ).click()

    changeFilter(
      composition.root,
      'lichtwaldLogSearch',
      'ERFUNDEN'
    )
    assert.deepEqual(readOverviewTitles(composition.root), DEMO_SEED_TITLES)
    changeFilter(
      composition.root,
      'lichtwaldLogCalendarDateFilter',
      '2034-05-20'
    )
    assert.deepEqual(
      readOverviewTitles(composition.root),
      DEMO_SEED_TITLES.slice(0, 2)
    )
    changeFilter(
      composition.root,
      'lichtwaldLogTagFilter',
      'Wald'
    )
    assert.deepEqual(
      readOverviewTitles(composition.root),
      [DEMO_SEED_TITLES[0]]
    )
    assert.equal(readResultStatus(composition.root), '1 von 5 Einträgen')

    findButton(
      findCardByTitle(composition.root, DEMO_SEED_TITLES[0]),
      'Demo-Eintrag öffnen'
    ).click()
    assert.ok(composition.root.textContent.includes(DEMO_SEED_TITLES[0]))
    findButton(composition.root, '← Zur Übersicht').click()
    assert.equal(
      findControl(composition.root, 'lichtwaldLogSearch').value,
      'ERFUNDEN'
    )
    assert.equal(
      findControl(
        composition.root,
        'lichtwaldLogCalendarDateFilter'
      ).value,
      '2034-05-20'
    )
    assert.equal(
      findControl(composition.root, 'lichtwaldLogTagFilter').value,
      'Wald'
    )
    assert.deepEqual(
      readOverviewTitles(composition.root),
      [DEMO_SEED_TITLES[0]]
    )

    findButton(
      composition.root,
      'Suche und Filter zurücksetzen'
    ).click()
    assert.deepEqual(readOverviewTitles(composition.root), DEMO_SEED_TITLES)
    assert.equal(readResultStatus(composition.root), '5 Einträge')
    assert.deepEqual(
      assertSyntheticDemoSnapshot(composition.demoStorage),
      canonicalDemoSnapshot
    )
    assertPrivateBrowserStateUnchanged(
      composition.privateStorage,
      privateStateBeforeDemo
    )
  } finally {
    composition.close()
    composition.restore()
  }
})

test('behält aktive Filter über echte Demo-CRUD- und Fokusmutationen ohne Browserzugriff bei', () => {
  const runtimeProbe = installRuntimeInteractionProbe()
  const composition = createDualComposition()

  try {
    const privateStateBeforeDemo = capturePrivateBrowserState(
      composition.privateStorage
    )
    const privateMarkers = [
      PRIVATE_TITLE,
      'Vollständig erfundener privater Testbestand für die Kompositionsgrenze.',
      'Testgrenze',
      LICHTWALD_LOG_STORAGE_KEY,
    ]

    assert.equal(composition.showView(DEMO_VIEW), true)
    composition.scheduler.runNext()
    assert.deepEqual(readOverviewTitles(composition.root), DEMO_SEED_TITLES)
    assertPrivateBrowserStateUnchanged(
      composition.privateStorage,
      privateStateBeforeDemo
    )

    changeFilter(
      composition.root,
      'lichtwaldLogSearch',
      'Papiermond'
    )
    assert.deepEqual(readOverviewTitles(composition.root), [])
    assert.equal(readResultStatus(composition.root), '0 von 5 Einträgen')
    assertPrivateBrowserStateUnchanged(
      composition.privateStorage,
      privateStateBeforeDemo
    )

    findButton(
      composition.root,
      'Neuen Demo-Eintrag erstellen'
    ).click()
    updateFormField(composition.root, 'calendarDate', '2045-03-04')
    updateFormField(composition.root, 'title', CREATED_DEMO_TITLE)
    updateFormField(
      composition.root,
      'text',
      'Eine vollständig erfundene Papiermond-Station schwebt über einem geometrischen Hafen.'
    )
    findButton(composition.root, 'Tag hinzufügen').click()
    updateFormField(composition.root, 'tag-0', 'Papiermond')
    submitForm(composition.root)

    let demoSnapshot = assertSyntheticDemoSnapshot(
      composition.demoStorage
    )
    assert.equal(demoSnapshot.entries.length, 6)
    assert.equal(
      demoSnapshot.entries.at(-1).title,
      CREATED_DEMO_TITLE
    )
    assert.equal(demoSnapshot.entries.at(-1).id, SHARED_ENTRY_ID)
    assertEntryIdsAbsentFromDom(
      composition.root,
      demoSnapshot.entries.map((entry) => entry.id)
    )
    assertPrivateBrowserStateUnchanged(
      composition.privateStorage,
      privateStateBeforeDemo
    )

    findButton(composition.root, 'Als Demo-Fokus setzen').click()
    demoSnapshot = assertSyntheticDemoSnapshot(composition.demoStorage)
    assert.equal(demoSnapshot.featuredEntryId, SHARED_ENTRY_ID)
    assertPrivateBrowserStateUnchanged(
      composition.privateStorage,
      privateStateBeforeDemo
    )

    findButton(composition.root, '← Zur Übersicht').click()
    assert.equal(
      findControl(composition.root, 'lichtwaldLogSearch').value,
      'Papiermond'
    )
    assert.deepEqual(
      readOverviewTitles(composition.root),
      [CREATED_DEMO_TITLE]
    )
    assert.equal(readResultStatus(composition.root), '1 von 6 Einträgen')
    assertEntryIdsAbsentFromDom(
      composition.root,
      demoSnapshot.entries.map((entry) => entry.id)
    )

    findButton(
      findCardByTitle(composition.root, CREATED_DEMO_TITLE),
      'Demo-Eintrag öffnen'
    ).click()
    findButton(composition.root, 'Demo-Eintrag bearbeiten').click()
    updateFormField(composition.root, 'calendarDate', '2046-04-05')
    updateFormField(
      composition.root,
      'title',
      FILTER_UPDATED_DEMO_TITLE
    )
    updateFormField(
      composition.root,
      'text',
      'Die aktualisierte erfundene Prismastation sendet geometrische Karten in den Wolkenhafen.'
    )
    updateFormField(composition.root, 'tag-0', 'Prismakarte')
    submitForm(composition.root)

    demoSnapshot = assertSyntheticDemoSnapshot(composition.demoStorage)
    const updatedEntry = demoSnapshot.entries.at(-1)
    assert.equal(updatedEntry.id, SHARED_ENTRY_ID)
    assert.equal(updatedEntry.title, FILTER_UPDATED_DEMO_TITLE)
    assert.equal(demoSnapshot.featuredEntryId, SHARED_ENTRY_ID)
    assertPrivateBrowserStateUnchanged(
      composition.privateStorage,
      privateStateBeforeDemo
    )

    findButton(composition.root, '← Zur Übersicht').click()
    assert.equal(
      findControl(composition.root, 'lichtwaldLogSearch').value,
      'Papiermond'
    )
    assert.deepEqual(readOverviewTitles(composition.root), [])
    assert.equal(readResultStatus(composition.root), '0 von 6 Einträgen')

    changeFilter(
      composition.root,
      'lichtwaldLogSearch',
      'PRISMASTATION'
    )
    assert.deepEqual(
      readOverviewTitles(composition.root),
      [FILTER_UPDATED_DEMO_TITLE]
    )
    findButton(
      findCardByTitle(composition.root, FILTER_UPDATED_DEMO_TITLE),
      'Demo-Eintrag öffnen'
    ).click()
    findButton(composition.root, 'Demo-Eintrag entfernen').click()
    findButton(composition.root, 'Aus Sitzung entfernen').click()

    demoSnapshot = assertSyntheticDemoSnapshot(composition.demoStorage)
    assert.equal(demoSnapshot.entries.length, 5)
    assert.equal(
      demoSnapshot.entries.some((entry) => entry.id === SHARED_ENTRY_ID),
      false
    )
    assert.equal(demoSnapshot.featuredEntryId, null)
    assert.equal(
      findControl(composition.root, 'lichtwaldLogSearch').value,
      'PRISMASTATION'
    )
    assert.deepEqual(readOverviewTitles(composition.root), [])
    assert.equal(readResultStatus(composition.root), '0 von 5 Einträgen')
    assertPrivateBrowserStateUnchanged(
      composition.privateStorage,
      privateStateBeforeDemo
    )

    const renderedFeedback = findByClass(
      composition.root,
      'lichtwald-log-feedback'
    ).map((element) => element.textContent).join(' ')
    for (const privateMarker of privateMarkers) {
      assert.equal(composition.root.textContent.includes(privateMarker), false)
      assert.equal(renderedFeedback.includes(privateMarker), false)
    }

    assertEntryIdsAbsentFromDom(
      composition.root,
      [
        SHARED_ENTRY_ID,
        ...demoSnapshot.entries.map((entry) => entry.id),
      ]
    )
    assert.deepEqual(runtimeProbe.calls.console, [])
    assert.deepEqual(runtimeProbe.calls.network, [])
  } finally {
    composition.close()
    composition.restore()
    runtimeProbe.restore()
  }
})

test('lässt private Aktionen den Demo-Snapshot unverändert und wahrt beide Origins', () => {
  const privateStorage = createPrivateBrowserStorage()
  const composition = createDualComposition({ privateStorage })

  try {
    assert.equal(composition.showView(DEMO_VIEW), true)
    composition.scheduler.runNext()
    const demoSnapshotBeforePrivateAction = assertSyntheticDemoSnapshot(
      composition.demoStorage
    )

    assert.equal(composition.showView(PRIVATE_VIEW), true)
    composition.scheduler.runNext()
    findButton(composition.root, 'Eintrag öffnen').click()
    findButton(
      composition.root,
      'Als Lichtwald-Fokus setzen'
    ).click()
    assertEntryIdsAbsentFromDom(
      composition.root,
      [SHARED_ENTRY_ID]
    )

    const privateSnapshot = JSON.parse(
      composition.privateStorage.peek(LICHTWALD_LOG_STORAGE_KEY)
    )
    assert.equal(privateSnapshot.dataOrigin, 'private')
    assert.equal(privateSnapshot.featuredEntryId, SHARED_ENTRY_ID)
    assert.deepEqual(
      assertSyntheticDemoSnapshot(composition.demoStorage),
      demoSnapshotBeforePrivateAction
    )

    const privateStateBeforeDemoAction = capturePrivateBrowserState(
      composition.privateStorage
    )
    assert.equal(composition.showView(DEMO_VIEW), true)
    composition.scheduler.runNext()
    assert.deepEqual(readOverviewTitles(composition.root), DEMO_SEED_TITLES)
    const focusedDemoCard = findCardByTitle(
      composition.root,
      DEMO_SEED_TITLES[0]
    )
    assert.ok(focusedDemoCard)
    findButton(focusedDemoCard, 'Demo-Eintrag öffnen').click()
    findButton(composition.root, 'Demo-Fokus entfernen').click()

    assert.equal(
      assertSyntheticDemoSnapshot(
        composition.demoStorage
      ).featuredEntryId,
      null
    )
    assertPrivateBrowserStateUnchanged(
      composition.privateStorage,
      privateStateBeforeDemoAction
    )
    assert.equal(composition.root.textContent.includes(PRIVATE_TITLE), false)
  } finally {
    composition.close()
    composition.restore()
  }

  const recomposed = createDualComposition({ privateStorage })

  try {
    assert.equal(recomposed.showView(PRIVATE_VIEW), true)
    recomposed.scheduler.runNext()
    findButton(recomposed.root, 'Eintrag öffnen').click()
    assert.ok(
      recomposed.root.textContent.includes(
        'Lichtwald-Fokus: ausgewählt'
      )
    )
    assert.equal(
      JSON.parse(
        privateStorage.peek(LICHTWALD_LOG_STORAGE_KEY)
      ).featuredEntryId,
      SHARED_ENTRY_ID
    )
  } finally {
    recomposed.close()
    recomposed.restore()
  }
})

test('respektiert Dirty Guards in beide Richtungen und verwirft flüchtige Demo-Auswahl, Filter und Handler beim Wechsel', () => {
  const composition = createDualComposition()

  try {
    assert.equal(composition.showView(PRIVATE_VIEW), true)
    composition.scheduler.runNext()
    findButton(composition.root, 'Neuen Eintrag erstellen').click()
    updateFormField(
      composition.root,
      'title',
      '[Test] Noch nicht gespeicherter privater Entwurf'
    )
    const taskCountBeforeBlockedPrivateClose =
      composition.scheduler.tasks.length
    assert.equal(composition.showView(DEMO_VIEW), false)
    assert.equal(composition.activeView(), PRIVATE_VIEW)
    assert.equal(
      composition.scheduler.tasks.length,
      taskCountBeforeBlockedPrivateClose
    )
    assert.ok(composition.root.textContent.includes('Ungespeicherte Änderungen'))
    assert.equal(composition.root.textContent.includes('LichtwaldLog Demo'), false)

    updateFormField(composition.root, 'title', '')
    assert.equal(composition.showView(DEMO_VIEW), true)
    composition.scheduler.runNext()
    findButton(composition.root, 'Neuen Demo-Eintrag erstellen').click()
    updateFormField(
      composition.root,
      'title',
      '[Demo] Noch nicht übernommener Entwurf'
    )
    const privateReadsBeforeBlockedDemoClose =
      composition.privateStorage.getItemCalls
    assert.equal(composition.showView(PRIVATE_VIEW), false)
    assert.equal(composition.activeView(), DEMO_VIEW)
    assert.equal(
      composition.privateStorage.getItemCalls,
      privateReadsBeforeBlockedDemoClose
    )
    assert.ok(
      composition.root.textContent.includes(
        'Noch nicht übernommene Demo-Änderungen'
      )
    )

    updateFormField(composition.root, 'title', '')
    assert.equal(composition.showView(PRIVATE_VIEW), true)
    composition.scheduler.runNext()
    const sameViewTaskCount = composition.scheduler.tasks.length
    const sameViewDom = composition.root.textContent
    assert.equal(composition.showView(PRIVATE_VIEW), true)
    assert.equal(composition.scheduler.tasks.length, sameViewTaskCount)
    assert.equal(composition.root.textContent, sameViewDom)

    assert.equal(composition.showView(DEMO_VIEW), true)
    composition.scheduler.runNext()
    const searchInput = findControl(
      composition.root,
      'lichtwaldLogSearch'
    )
    assert.ok(searchInput)
    searchInput.value = 'Äther'
    searchInput.dispatchEvent({ type: 'input' })
    assert.equal(readOverviewTitles(composition.root).length, 1)
    const staleDemoOpen = findButton(
      composition.root,
      'Demo-Eintrag öffnen'
    )
    assert.ok(staleDemoOpen)

    assert.equal(composition.showView(PRIVATE_VIEW), true)
    composition.scheduler.runNext()
    const privateDomBeforeStaleDemoAction = composition.root.textContent
    staleDemoOpen.click()
    assert.equal(
      composition.root.textContent,
      privateDomBeforeStaleDemoAction
    )
    assert.deepEqual(readOverviewTitles(composition.root), [PRIVATE_TITLE])

    assert.equal(composition.showView(DEMO_VIEW), true)
    composition.scheduler.runNext()
    assert.equal(
      findControl(composition.root, 'lichtwaldLogSearch').value,
      ''
    )
    assert.equal(readOverviewTitles(composition.root).length, 5)
    assert.equal(
      findByClass(composition.root, 'lichtwald-log-detail').length,
      0
    )
  } finally {
    composition.close()
    composition.restore()
  }
})

test('macht alte Demo-Karten-, Formular- und Filterhandler nach dem Wechsel vollständig wirkungslos', () => {
  const composition = createDualComposition()

  try {
    assert.equal(composition.showView(DEMO_VIEW), true)
    composition.scheduler.runNext()
    changeFilter(
      composition.root,
      'lichtwaldLogSearch',
      'Äther'
    )

    const staleSearch = findControl(
      composition.root,
      'lichtwaldLogSearch'
    )
    const staleCalendarDate = findControl(
      composition.root,
      'lichtwaldLogCalendarDateFilter'
    )
    const staleTag = findControl(
      composition.root,
      'lichtwaldLogTagFilter'
    )
    const staleReset = findButton(
      composition.root,
      'Suche und Filter zurücksetzen'
    )
    const staleCardOpen = findButton(
      findCardByTitle(composition.root, DEMO_SEED_TITLES[0]),
      'Demo-Eintrag öffnen'
    )
    assert.ok(staleSearch)
    assert.ok(staleCalendarDate)
    assert.ok(staleTag)
    assert.ok(staleReset)
    assert.ok(staleCardOpen)

    findButton(
      composition.root,
      'Neuen Demo-Eintrag erstellen'
    ).click()
    const staleForm = findByTag(composition.root, 'form')[0]
    const staleTitle = findControl(composition.root, 'title')
    const staleAddTag = findButton(composition.root, 'Tag hinzufügen')
    assert.ok(staleForm)
    assert.ok(staleTitle)
    assert.ok(staleAddTag)
    const demoSnapshotBeforeStaleActions = assertSyntheticDemoSnapshot(
      composition.demoStorage
    )

    assert.equal(composition.showView(PRIVATE_VIEW), true)
    composition.scheduler.runNext()
    const privateDomBeforeStaleActions = composition.root.textContent
    const privateStateBeforeStaleActions = capturePrivateBrowserState(
      composition.privateStorage
    )
    const schedulerTaskCountBeforeStaleActions =
      composition.scheduler.tasks.length

    staleSearch.value = 'Wolkenhafen'
    staleSearch.dispatchEvent({ type: 'input' })
    staleCalendarDate.value = '2035-01-09'
    staleCalendarDate.dispatchEvent({ type: 'change' })
    staleTag.value = 'Waldweg'
    staleTag.dispatchEvent({ type: 'change' })
    staleReset.click()
    staleCardOpen.click()
    staleTitle.value = '[Demo] Veralteter Formularhandler'
    staleTitle.dispatchEvent({ type: 'input' })
    staleAddTag.click()
    assert.equal(
      staleForm.dispatchEvent({ type: 'submit' }),
      false
    )

    assert.equal(composition.activeView(), PRIVATE_VIEW)
    assert.equal(composition.root.textContent, privateDomBeforeStaleActions)
    assert.deepEqual(readOverviewTitles(composition.root), [PRIVATE_TITLE])
    assert.equal(
      composition.root.textContent.includes(DEMO_SEED_TITLES[0]),
      false
    )
    assert.equal(
      composition.scheduler.tasks.length,
      schedulerTaskCountBeforeStaleActions
    )
    assert.deepEqual(
      assertSyntheticDemoSnapshot(composition.demoStorage),
      demoSnapshotBeforeStaleActions
    )
    assertPrivateBrowserStateUnchanged(
      composition.privateStorage,
      privateStateBeforeStaleActions
    )
  } finally {
    composition.close()
    composition.restore()
  }
})

test('ignoriert abgebrochene veraltete Loads beider Controller und montiert immer nur den aktiven Stack', () => {
  const composition = createDualComposition()

  try {
    const privateStateBeforeLoads = capturePrivateBrowserState(
      composition.privateStorage
    )
    assert.equal(composition.showView(PRIVATE_VIEW), true)
    assert.equal(composition.scheduler.tasks.length, 1)
    assert.ok(composition.root.textContent.includes('LichtwaldLog wird geladen'))

    assert.equal(composition.showView(DEMO_VIEW), true)
    assert.equal(composition.scheduler.tasks[0].cancelCalls, 1)
    assert.equal(composition.scheduler.tasks.length, 2)
    assert.ok(composition.root.textContent.includes('LichtwaldLog Demo'))
    assert.ok(composition.root.textContent.includes('wird vorbereitet'))
    assert.equal(composition.root.textContent.includes(PRIVATE_TITLE), false)

    composition.scheduler.run(0)
    assert.deepEqual(
      capturePrivateBrowserState(composition.privateStorage),
      privateStateBeforeLoads
    )
    assert.ok(composition.root.textContent.includes('LichtwaldLog Demo'))
    assert.equal(readOverviewTitles(composition.root).length, 0)

    composition.scheduler.run(1)
    assert.equal(readOverviewTitles(composition.root).length, 5)
    const staleDemoOpen = findButton(
      composition.root,
      'Demo-Eintrag öffnen'
    )
    assert.ok(staleDemoOpen)

    assert.equal(composition.showView(PRIVATE_VIEW), true)
    assert.equal(composition.scheduler.tasks[1].cancelCalls, 0)
    assert.ok(composition.root.textContent.includes('LichtwaldLog wird geladen'))
    staleDemoOpen.click()
    assert.ok(composition.root.textContent.includes('LichtwaldLog wird geladen'))
    assert.equal(composition.root.textContent.includes('LichtwaldLog Demo'), false)

    composition.scheduler.run(2)
    assert.deepEqual(readOverviewTitles(composition.root), [PRIVATE_TITLE])
    assert.equal(
      findByClass(composition.root, 'lichtwald-log--synthetic-demo').length,
      0
    )
    assert.equal(composition.root.textContent.includes('Synthetische Demo'), false)

    const privateStateBeforeStaleDemoLoad =
      capturePrivateBrowserState(composition.privateStorage)
    assert.equal(composition.showView(DEMO_VIEW), true)
    assert.equal(composition.scheduler.tasks.length, 4)
    assert.ok(composition.root.textContent.includes('wird vorbereitet'))
    assert.equal(composition.showView(PRIVATE_VIEW), true)
    assert.equal(composition.scheduler.tasks[3].cancelCalls, 1)
    assert.equal(composition.scheduler.tasks.length, 5)
    assert.ok(composition.root.textContent.includes('LichtwaldLog wird geladen'))

    composition.scheduler.run(3)
    assert.ok(composition.root.textContent.includes('LichtwaldLog wird geladen'))
    assert.equal(composition.root.textContent.includes('LichtwaldLog Demo'), false)
    assert.equal(readOverviewTitles(composition.root).length, 0)
    assertPrivateBrowserStateUnchanged(
      composition.privateStorage,
      privateStateBeforeStaleDemoLoad
    )

    composition.scheduler.run(4)
    assert.deepEqual(readOverviewTitles(composition.root), [PRIVATE_TITLE])
  } finally {
    composition.close()
    composition.restore()
  }
})
