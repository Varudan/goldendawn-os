import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import {
  LICHTWALD_LOG_MAX_TAG_COUNT,
  LICHTWALD_LOG_TAG_MAX_LENGTH,
  LICHTWALD_LOG_TEXT_MAX_LENGTH,
  LICHTWALD_LOG_TITLE_MAX_LENGTH,
} from '../src/modules/lichtwald-log/lichtwaldLogContract.js'
import { createLichtwaldLogController } from '../src/modules/lichtwald-log/lichtwaldLogController.js'
import { createLichtwaldLogView } from '../src/modules/lichtwald-log/lichtwaldLogView.js'
import {
  createFakeDom,
  findAll,
  findByClass,
  findByTag,
} from './helpers/fakeDom.js'

const ACTION_NAMES = Object.freeze([
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
])

// Alle Inhalte und IDs in dieser Datei sind vollständig frei erfunden.
function createEntry(overrides = {}) {
  return {
    id: 'lichtwald-entry-synthetic-prism-1',
    calendarDate: '2044-03-17',
    title: 'Synthetische Prismenkammer',
    text: 'Ein frei erfundener Journaleintrag über schwebende Formen.',
    tags: ['Prisma', 'Fiktiv'],
    ...overrides,
  }
}

function createSecondEntry(overrides = {}) {
  return createEntry({
    id: 'lichtwald-entry-synthetic-orbit-2',
    calendarDate: '2039-11-05',
    title: 'Erfundene Orbitkarte',
    text: 'Eine vollständig synthetische Notiz mit\nzwei Textzeilen.',
    tags: ['beta', 'ALPHA', 'beta'],
    ...overrides,
  })
}

function createForm(type = 'createEntry', overrides = {}) {
  const entry = createEntry()

  return {
    type,
    entryId: type === 'updateEntry' ? entry.id : null,
    values: {
      calendarDate: type === 'updateEntry' ? entry.calendarDate : '',
      title: type === 'updateEntry' ? entry.title : '',
      text: type === 'updateEntry' ? entry.text : '',
      tags: type === 'updateEntry' ? [...entry.tags] : [],
    },
    fieldErrors: {},
    errorMessage: '',
    isSubmitting: false,
    isDirty: false,
    ...overrides,
  }
}

function createViewModel(overrides = {}) {
  return {
    phase: 'ready',
    entries: [createEntry(), createSecondEntry()],
    featuredEntryId: null,
    selectedEntryId: null,
    form: null,
    deleteState: {
      entryId: null,
      isSubmitting: false,
      errorMessage: '',
    },
    featuredState: {
      isSubmitting: false,
      targetEntryId: null,
      errorMessage: '',
    },
    statusMessage: '',
    statusMessageTone: 'success',
    errorMessage: '',
    focusTarget: null,
    ...overrides,
  }
}

function createPrivateLog(entries, featuredEntryId = null) {
  return {
    schemaVersion: 1,
    dataOrigin: 'private',
    featuredEntryId,
    entries,
  }
}

function deepFreeze(value, seen = new Set()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return value

  seen.add(value)
  for (const propertyName of Reflect.ownKeys(value)) {
    deepFreeze(value[propertyName], seen)
  }

  return Object.freeze(value)
}

function createActionRecorder(overrides = {}) {
  const calls = Object.fromEntries(ACTION_NAMES.map((name) => [name, []]))
  const actions = {}

  for (const actionName of ACTION_NAMES) {
    actions[actionName] = (...args) => {
      calls[actionName].push(args)
      return overrides[actionName]?.(...args)
    }
  }

  return { actions: Object.freeze(actions), calls }
}

function withLichtwaldLogView(runTest) {
  const fakeDom = createFakeDom()

  try {
    const view = createLichtwaldLogView(fakeDom.root)
    runTest({ ...fakeDom, view })
  } finally {
    fakeDom.restore()
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

function findTagControls(root) {
  return findByTag(root, 'input').filter(
    (control) => /^tag-\d+$/.test(control.name)
  )
}

function findHeading(root) {
  for (const tagName of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']) {
    const heading = findByTag(root, tagName)[0]
    if (heading) return heading
  }

  return null
}

function findRole(root, role) {
  return findAll(
    root,
    (node) => node.nodeType === 1 && node.getAttribute('role') === role
  )
}

function getControlType(control) {
  return control.type || control.getAttribute('type')
}

function assertOwnKeys(value, expectedKeys) {
  assert.deepEqual(
    Reflect.ownKeys(value).sort(),
    [...expectedKeys].sort()
  )
}

function assertElementDoesNotExpose(root, markers) {
  for (const element of findAll(root, (node) => node.nodeType === 1)) {
    const exposedValues = [
      element.id,
      element.className,
      typeof element.name === 'string' ? element.name : '',
      ...element.attributes.keys(),
      ...element.attributes.values(),
    ]

    for (const marker of markers) {
      assert.ok(
        exposedValues.every((value) => !String(value).includes(marker)),
        `DOM-Metadaten enthalten den geschützten Marker ${marker}.`
      )
    }
  }
}

function assertCurrentFocusIsInside(root, document) {
  assert.ok(document.activeElement)
  assert.equal(
    findAll(root, (node) => node === document.activeElement).length,
    1
  )
}

function normalizeAccessibleText(value) {
  return typeof value === 'string'
    ? value.replace(/\s+/gu, ' ').trim()
    : ''
}

function conveysLichtwaldFocusStatus(value, allowContextualState = false) {
  const normalizedValue = normalizeAccessibleText(value).normalize('NFC')

  if (
    /Lichtwald-Fokus\s*:\s*(?:nicht\s+)?ausgewählt(?![\p{L}\p{M}])/iu.test(
      normalizedValue
    )
  ) {
    return true
  }

  return (
    allowContextualState &&
    /^(?:nicht\s+)?ausgewählt[.!?]?$/iu.test(normalizedValue)
  )
}

function resolveDocumentIdReference(detail, documentRoot, referenceId) {
  const getElementById = detail.ownerDocument?.getElementById

  if (typeof getElementById === 'function') {
    const referencedElement = getElementById.call(
      detail.ownerDocument,
      referenceId
    )
    if (referencedElement) return referencedElement
  }

  return findAll(
    documentRoot,
    (node) => node.nodeType === 1 && node.id === referenceId
  )[0] ?? null
}

function assertSingleDetailFocusStatus(
  detail,
  expectedStatusText,
  documentRoot = detail
) {
  const statuses = findByClass(
    detail,
    'lichtwald-log-detail__featured-status'
  )
  const focusActions = findByTag(detail, 'button').filter(
    (button) => button.textContent.includes('Lichtwald-Fokus')
  )

  assert.equal(statuses.length, 1)
  assert.equal(statuses[0].textContent, expectedStatusText)
  assert.equal(
    findByClass(detail, 'lichtwald-log-featured-badge').length,
    0
  )
  assert.equal(
    detail.textContent.split(expectedStatusText).length - 1,
    1
  )
  assert.equal(
    (detail.textContent.match(/ausgewählt/giu) ?? []).length,
    1
  )
  assert.equal(
    (detail.textContent.match(/Lichtwald-Fokus/gu) ?? []).length,
    2
  )
  assert.equal(focusActions.length, 1)
  assert.notStrictEqual(statuses[0], focusActions[0])

  let additionalAssistiveMarkerCount = 0

  for (const node of findAll(detail, (candidate) => candidate.nodeType === 1)) {
    const isFocusContext = (
      node === statuses[0] || node === focusActions[0]
    )

    for (const attributeName of [
      'aria-label',
      'aria-description',
      'title',
    ]) {
      if (
        conveysLichtwaldFocusStatus(
          node.getAttribute(attributeName),
          isFocusContext
        )
      ) {
        additionalAssistiveMarkerCount += 1
      }
    }

    for (const attributeName of ['aria-labelledby', 'aria-describedby']) {
      const references = normalizeAccessibleText(
        node.getAttribute(attributeName)
      ).split(' ').filter(Boolean)
      const referencedTexts = []

      for (const referenceId of references) {
        const referencedElement = resolveDocumentIdReference(
          detail,
          documentRoot,
          referenceId
        )
        if (referencedElement) {
          referencedTexts.push(referencedElement.textContent)
        }
      }

      if (
        referencedTexts.some((referencedText) =>
          conveysLichtwaldFocusStatus(
            referencedText,
            isFocusContext
          )
        ) ||
        conveysLichtwaldFocusStatus(
          referencedTexts.join(' '),
          isFocusContext
        )
      ) {
        additionalAssistiveMarkerCount += 1
      }
    }
  }
  assert.equal(additionalAssistiveMarkerCount, 0)

  return {
    status: statuses[0],
    focusAction: focusActions[0],
  }
}

function renderDetailFocusStatusFixture({ document, root, view, isFeatured }) {
  const selectedEntry = createSecondEntry()
  const otherEntry = createEntry()
  const expectedStatusText = isFeatured
    ? 'Lichtwald-Fokus: ausgewählt'
    : 'Lichtwald-Fokus: nicht ausgewählt'

  view.render(createViewModel({
    entries: [otherEntry, selectedEntry],
    selectedEntryId: selectedEntry.id,
    featuredEntryId: isFeatured ? selectedEntry.id : otherEntry.id,
  }))

  const detail = findByClass(root, 'lichtwald-log-detail')[0]
  const focusState = assertSingleDetailFocusStatus(
    detail,
    expectedStatusText,
    root
  )

  return {
    detail,
    document,
    expectedStatusText,
    focusAction: focusState.focusAction,
    root,
    status: focusState.status,
  }
}

function createManualScheduler() {
  // Manueller Scheduler für die isolierte Controller-View-Integration.
  const tasks = []

  return {
    tasks,
    scheduleTask(task) {
      tasks.push(task)
      return () => {}
    },
    run(index = tasks.length - 1) {
      assert.ok(tasks[index])
      tasks[index]()
    },
  }
}

test('liefert eine exakt eingefrorene Data-API und weist ungeeignete Roots statisch zurück', () => {
  const fakeDom = createFakeDom()

  try {
    const view = createLichtwaldLogView(fakeDom.root)
    const descriptors = Object.getOwnPropertyDescriptors(view)

    assertOwnKeys(view, ['render', 'unmount'])
    assert.equal(Object.isFrozen(view), true)
    assert.equal(typeof descriptors.render.value, 'function')
    assert.equal(typeof descriptors.unmount.value, 'function')
    assert.equal(Object.hasOwn(descriptors.render, 'get'), false)
    assert.equal(Object.hasOwn(descriptors.unmount, 'get'), false)

    for (const invalidRoot of [null, undefined, {}, [], 'main']) {
      assert.throws(
        () => createLichtwaldLogView(invalidRoot),
        (error) => error instanceof TypeError && error.message.length > 0
      )
    }

    const privateMarker = 'synthetic-hostile-root-private-marker'
    const hostileRoot = {}
    Object.defineProperty(hostileRoot, 'ownerDocument', {
      configurable: true,
      get() {
        throw new Error(privateMarker)
      },
    })

    assert.throws(
      () => createLichtwaldLogView(hostileRoot),
      (error) => (
        error instanceof TypeError &&
        !error.message.includes(privateMarker)
      )
    )

    const revokedRoot = Proxy.revocable(fakeDom.root, {})
    revokedRoot.revoke()
    assert.throws(
      () => createLichtwaldLogView(revokedRoot.proxy),
      (error) => error instanceof TypeError && !error.message.includes('Proxy')
    )
  } finally {
    fakeDom.restore()
  }
})

test('ersetzt Renderbäume vollständig und unmountet private Inhalte idempotent', () => {
  withLichtwaldLogView(({ root, view }) => {
    const privateMarker = 'SYNTHETIC-PRIVATE-UNMOUNT-MARKER'
    const firstModel = deepFreeze(createViewModel({
      phase: 'ready',
      entries: [createEntry({ title: privateMarker })],
    }))
    const firstSnapshot = structuredClone(firstModel)

    view.render(firstModel)
    const oldTree = root.children[0]
    assert.ok(root.textContent.includes(privateMarker))
    assert.deepEqual(firstModel, firstSnapshot)

    view.render(deepFreeze(createViewModel({
      phase: 'empty',
      entries: [],
    })))
    assert.equal(root.children.includes(oldTree), false)
    assert.equal(oldTree.parentNode, null)
    assert.equal(root.textContent.includes(privateMarker), false)

    view.render(createViewModel({ phase: 'loading', entries: [] }))
    assert.equal(root.getAttribute('aria-busy'), 'true')
    view.unmount()
    assert.equal(root.children.length, 0)
    assert.equal(root.textContent, '')
    assert.equal(root.hasAttribute('aria-busy'), false)

    assert.doesNotThrow(() => view.unmount())
    assert.equal(root.children.length, 0)
    assert.equal(root.hasAttribute('aria-busy'), false)

    view.render(createViewModel({ phase: 'empty', entries: [] }))
    assert.equal(findByClass(root, 'lichtwald-log').length, 1)
    assert.ok(root.textContent.includes('LichtwaldLog'))
  })
})

test('invalidiert Handler früherer Render und registriert aktuelle Handler nur einmal', () => {
  withLichtwaldLogView(({ root, view }) => {
    let staleCalls = 0
    let currentCalls = 0
    const emptyModel = createViewModel({ phase: 'empty', entries: [] })

    view.render(emptyModel, {
      onOpenCreateEntryForm() {
        staleCalls += 1
      },
    })
    const staleButton = findButton(root, 'Neuen Eintrag erstellen')

    view.render(emptyModel, {
      onOpenCreateEntryForm() {
        currentCalls += 1
      },
    })
    const currentButton = findButton(root, 'Neuen Eintrag erstellen')

    assert.notStrictEqual(currentButton, staleButton)
    assert.equal(currentButton.eventListeners.get('click').length, 1)
    staleButton.click()
    assert.equal(staleCalls, 0)
    assert.equal(currentCalls, 0)
    currentButton.click()
    assert.equal(currentCalls, 1)

    view.unmount()
    currentButton.click()
    assert.equal(currentCalls, 1)
  })
})

test('liest für einen veralteten Tag-Add-Handler keine abgelösten Controls', () => {
  withLichtwaldLogView(({ root, view }) => {
    const recorder = createActionRecorder()
    const createTagFormModel = (tags) => createViewModel({
      phase: 'empty',
      entries: [],
      form: createForm('createEntry', {
        values: {
          calendarDate: '',
          title: '',
          text: '',
          tags,
        },
      }),
    })

    view.render(
      createTagFormModel(['Synthetischer alter Add-Tag']),
      recorder.actions
    )
    const staleControl = findControl(root, 'tag-0')
    const staleAddButton = findButton(root, 'Tag hinzufügen')

    view.render(
      createTagFormModel(['Synthetischer aktueller Add-Tag']),
      recorder.actions
    )
    const currentAddButton = findButton(root, 'Tag hinzufügen')
    let staleValueReads = 0
    Object.defineProperty(staleControl, 'value', {
      configurable: true,
      get() {
        staleValueReads += 1
        throw new Error('Synthetischer veralteter Add-Getter')
      },
    })

    assert.doesNotThrow(() => staleAddButton.click())
    assert.equal(staleValueReads, 0)
    assert.deepEqual(recorder.calls.onUpdateFormField, [])

    assert.doesNotThrow(() => currentAddButton.click())
    assert.deepEqual(recorder.calls.onUpdateFormField, [[
      'tags',
      ['Synthetischer aktueller Add-Tag', ''],
    ]])
  })
})

test('liest für einen veralteten Tag-Remove-Handler keine abgelösten Controls', () => {
  withLichtwaldLogView(({ root, view }) => {
    const recorder = createActionRecorder()
    const createTagFormModel = (tags) => createViewModel({
      phase: 'empty',
      entries: [],
      form: createForm('createEntry', {
        values: {
          calendarDate: '',
          title: '',
          text: '',
          tags,
        },
      }),
    })

    view.render(
      createTagFormModel([
        'Synthetischer alter Remove-Tag A',
        'Synthetischer alter Remove-Tag B',
      ]),
      recorder.actions
    )
    const staleControls = findTagControls(root)
    const staleRemoveButton = findButton(root, 'Tag 1 entfernen')

    view.render(
      createTagFormModel([
        'Synthetischer aktueller Remove-Tag A',
        'Synthetischer aktueller Remove-Tag B',
      ]),
      recorder.actions
    )
    const currentRemoveButton = findButton(root, 'Tag 1 entfernen')
    let staleValueReads = 0
    for (const staleControl of staleControls) {
      Object.defineProperty(staleControl, 'value', {
        configurable: true,
        get() {
          staleValueReads += 1
          throw new Error('Synthetischer veralteter Remove-Getter')
        },
      })
    }

    assert.doesNotThrow(() => staleRemoveButton.click())
    assert.equal(staleValueReads, 0)
    assert.deepEqual(recorder.calls.onUpdateFormField, [])

    assert.doesNotThrow(() => currentRemoveButton.click())
    assert.deepEqual(recorder.calls.onUpdateFormField, [[
      'tags',
      ['Synthetischer aktueller Remove-Tag B'],
    ]])
  })
})

test('behandelt fehlende oder nicht aufrufbare Actions kontrolliert als No-op', () => {
  withLichtwaldLogView(({ root, view }) => {
    view.render(createViewModel({ phase: 'empty', entries: [] }), {})
    assert.doesNotThrow(() => {
      findButton(root, 'Neuen Eintrag erstellen').click()
    })

    view.render(
      createViewModel({
        phase: 'loadError',
        entries: [],
        errorMessage: 'Statischer synthetischer Ladefehler.',
      }),
      { onRetryLoad: 'nicht-aufrufbar' }
    )
    assert.doesNotThrow(() => findButton(root, 'Erneut laden').click())

    view.render(
      createViewModel({
        form: createForm('createEntry'),
        entries: [],
        phase: 'empty',
      }),
      { onSubmitForm: null, onUpdateFormField: false }
    )
    const title = findControl(root, 'title')
    title.value = 'Synthetischer No-op-Entwurf'
    assert.doesNotThrow(() => title.dispatchEvent({ type: 'input' }))
    assert.doesNotThrow(() => {
      findByTag(root, 'form')[0].dispatchEvent({ type: 'submit' })
    })
    assert.equal(findRole(root, 'alert').length, 0)
  })
})

test('rendert alle Phasen mit statischem lokalem Datenschutz- und Speicherhinweis', () => {
  withLichtwaldLogView(({ root, view }) => {
    const phaseModels = [
      createViewModel({ phase: 'loading', entries: [] }),
      createViewModel({ phase: 'empty', entries: [] }),
      createViewModel({ phase: 'ready' }),
      createViewModel({
        phase: 'loadError',
        entries: [],
        errorMessage: 'Synthetischer statischer Ladefehler.',
      }),
      createViewModel({ phase: 'mutating' }),
    ]

    for (const viewModel of phaseModels) {
      view.render(viewModel)

      assert.equal(findByClass(root, 'lichtwald-log').length, 1)
      assert.equal(findByClass(root, 'lichtwald-log-header').length, 1)
      assert.equal(findByClass(root, 'lichtwald-log-introduction').length, 1)
      const heading = findByTag(root, 'h1')[0]
      assert.ok(heading)
      assert.ok(heading.tabIndex === -1 || heading.getAttribute('tabindex') === '-1')

      const privacy = findByClass(root, 'lichtwald-log-privacy')[0]
      assert.ok(privacy)
      const privacyText = privacy.textContent.toLowerCase()
      for (const expectedFragment of [
        'browserprofil',
        'synchron',
        'cloud',
        'localstorage',
        'unverschlüsselt',
        'origin',
        'browserdaten',
      ]) {
        assert.ok(
          privacyText.includes(expectedFragment),
          `${viewModel.phase}: Datenschutzhinweis enthält ${expectedFragment}.`
        )
      }
      assert.equal(privacyText.includes('verschlüsselt gespeichert'), false)
    }
  })
})

test('stellt Loading, LoadError und Empty semantisch und aktionsgenau dar', () => {
  withLichtwaldLogView(({ root, view }) => {
    const recorder = createActionRecorder()

    view.render(
      createViewModel({ phase: 'loading', entries: [] }),
      recorder.actions
    )
    const loading = findByClass(root, 'lichtwald-log-state--loading')[0]
    assert.ok(loading)
    assert.equal(root.getAttribute('aria-busy'), 'true')
    assert.equal(loading.getAttribute('aria-busy'), 'true')
    assert.equal(loading.getAttribute('role'), 'status')
    assert.equal(loading.getAttribute('aria-live'), 'polite')
    assert.equal(findByTag(root, 'button').length, 0)
    assert.equal(findByClass(root, 'lichtwald-log-overview').length, 0)
    assert.equal(findByClass(root, 'lichtwald-log-form').length, 0)

    const loadErrorMessage = 'Synthetischer kontrollierter Ladefehler.'
    view.render(
      createViewModel({
        phase: 'loadError',
        entries: [createEntry()],
        form: createForm(),
        errorMessage: loadErrorMessage,
      }),
      recorder.actions
    )
    const loadAlert = findByClass(root, 'lichtwald-log-state--error')[0]
    assert.ok(loadAlert)
    assert.equal(loadAlert.getAttribute('role'), 'alert')
    assert.equal(loadAlert.textContent.includes(loadErrorMessage), true)
    assert.equal(findButton(root, 'Erneut laden') !== null, true)
    assert.equal(
      findByTag(root, 'button').filter(
        (button) => button.textContent === 'Erneut laden'
      ).length,
      1
    )
    assert.equal(findByClass(root, 'lichtwald-log-entry-card').length, 0)
    assert.equal(findByClass(root, 'lichtwald-log-form').length, 0)
    findButton(root, 'Erneut laden').click()
    assert.deepEqual(recorder.calls.onRetryLoad, [[]])

    view.render(
      createViewModel({ phase: 'empty', entries: [] }),
      recorder.actions
    )
    const empty = findByClass(root, 'lichtwald-log-state--empty')[0]
    assert.ok(empty)
    assert.ok(empty.textContent.toLowerCase().includes('keine'))
    findButton(root, 'Neuen Eintrag erstellen').click()
    assert.deepEqual(recorder.calls.onOpenCreateEntryForm, [[]])
  })
})

test('priorisiert Form vor Detail und Detail vor Übersicht auch im Empty- und Mutating-Zustand', () => {
  withLichtwaldLogView(({ root, view }) => {
    const entry = createEntry()

    view.render(createViewModel({
      phase: 'empty',
      entries: [],
      form: createForm('createEntry'),
    }))
    assert.equal(findByClass(root, 'lichtwald-log-form').length, 1)
    assert.equal(findByClass(root, 'lichtwald-log-state--empty').length, 0)

    view.render(createViewModel({
      phase: 'ready',
      entries: [entry],
      selectedEntryId: entry.id,
    }))
    assert.equal(findByClass(root, 'lichtwald-log-detail').length, 1)
    assert.equal(findByClass(root, 'lichtwald-log-overview').length, 0)

    view.render(createViewModel({
      phase: 'mutating',
      entries: [entry],
      selectedEntryId: entry.id,
      form: createForm('updateEntry', {
        entryId: entry.id,
        isSubmitting: true,
      }),
    }))
    assert.equal(findByClass(root, 'lichtwald-log-form').length, 1)
    assert.equal(findByClass(root, 'lichtwald-log-detail').length, 0)
    assert.equal(root.getAttribute('aria-busy'), 'true')
  })
})

test('bewahrt Entry- und Tag-Reihenfolge und verdrahtet Übersichtskarten mit exakten IDs', () => {
  withLichtwaldLogView(({ root, view }) => {
    const first = createEntry({
      id: 'lichtwald-entry-order-zeta',
      calendarDate: '2050-12-31',
      title: 'Zuerst im Snapshot',
      tags: ['Zulu', 'alpha', 'Zulu'],
    })
    const second = createSecondEntry({
      id: 'lichtwald-entry-order-alpha',
      calendarDate: '1999-01-01',
      title: 'Zweitens im Snapshot',
      tags: ['Drei', 'Eins', 'Zwei'],
    })
    const third = createEntry({
      id: 'lichtwald-entry-order-middle',
      calendarDate: '2040-06-01',
      title: 'Drittens und fokussiert',
      tags: [],
    })
    const entries = deepFreeze([first, second, third])
    const snapshot = structuredClone(entries)
    const recorder = createActionRecorder()

    view.render(
      createViewModel({
        entries,
        featuredEntryId: third.id,
      }),
      recorder.actions
    )

    const cards = findByClass(root, 'lichtwald-log-entry-card')
    assert.equal(cards.length, 3)
    assert.deepEqual(
      cards.map((card) => findHeading(card).textContent),
      [first.title, second.title, third.title]
    )
    assert.ok(cards[0].textContent.includes(first.calendarDate))
    assert.ok(cards[1].textContent.includes(second.calendarDate))
    assert.equal(cards[0].textContent.includes(first.text), false)
    assert.equal(findByClass(cards[2], 'lichtwald-log-featured-badge').length, 1)
    assert.equal(findByClass(cards[0], 'lichtwald-log-featured-badge').length, 0)

    for (const [card, expectedTags] of [
      [cards[0], first.tags],
      [cards[1], second.tags],
    ]) {
      let previousIndex = -1
      for (const tag of expectedTags) {
        const nextIndex = card.textContent.indexOf(tag, previousIndex + 1)
        assert.ok(nextIndex > previousIndex)
        previousIndex = nextIndex
      }
    }

    findButton(cards[1], 'Eintrag öffnen').click()
    findButton(cards[0], 'Als Lichtwald-Fokus setzen').click()
    findButton(cards[2], 'Lichtwald-Fokus entfernen').click()
    assert.deepEqual(recorder.calls.onSelectEntry, [[second.id]])
    assert.deepEqual(recorder.calls.onSetFeaturedEntry, [[first.id], [null]])
    assert.deepEqual(entries, snapshot)
  })
})

test('rendert 1.000 synthetische Entries vollständig in unveränderter Reihenfolge', () => {
  withLichtwaldLogView(({ root, view }) => {
    const entries = Array.from({ length: 1_000 }, (_, index) => createEntry({
      id: `lichtwald-entry-boundary-${index}`,
      calendarDate: `2077-${String((index % 12) + 1).padStart(2, '0')}-15`,
      title: `Synthetische Grenzkarte ${index}`,
      text: `Frei erfundener Grenztext ${index}.`,
      tags: [`Tag-${index}`, 'Grenze'],
    }))
    const snapshot = structuredClone(entries)

    view.render(deepFreeze(createViewModel({ entries })))

    const cards = findByClass(root, 'lichtwald-log-entry-card')
    assert.equal(cards.length, 1_000)
    for (const index of [0, 499, 999]) {
      assert.equal(findHeading(cards[index]).textContent, entries[index].title)
    }
    assert.deepEqual(entries, snapshot)
  })
})

test('zeigt nur das exakt ausgewählte Detail und verdrahtet dessen Aktionen', () => {
  withLichtwaldLogView(({ root, view }) => {
    const first = createEntry()
    const second = createSecondEntry()
    const recorder = createActionRecorder()

    view.render(
      createViewModel({
        entries: [first, second],
        selectedEntryId: second.id,
        featuredEntryId: second.id,
      }),
      recorder.actions
    )
    const detail = findByClass(root, 'lichtwald-log-detail')[0]
    assert.ok(detail)
    assert.equal(findHeading(detail).textContent, second.title)
    assert.ok(detail.textContent.includes(second.calendarDate))
    assert.ok(detail.textContent.includes(second.text))
    assert.equal(detail.textContent.includes(first.title), false)
    assert.ok(detail.textContent.toLowerCase().includes('fokus'))

    findButton(detail, '← Zur Übersicht').click()
    findButton(detail, 'Eintrag bearbeiten').click()
    findButton(detail, 'Eintrag dauerhaft löschen').click()
    findButton(detail, 'Lichtwald-Fokus entfernen').click()
    assert.deepEqual(recorder.calls.onBackToOverview, [[]])
    assert.deepEqual(recorder.calls.onOpenUpdateEntryForm, [[second.id]])
    assert.deepEqual(recorder.calls.onRequestDeleteEntry, [[second.id]])
    assert.deepEqual(recorder.calls.onSetFeaturedEntry, [[null]])

    for (const selectedEntryId of [
      'missing-entry',
      second.id.toUpperCase(),
    ]) {
      view.render(createViewModel({
        entries: [first, second],
        selectedEntryId,
      }))
      assert.equal(findByClass(root, 'lichtwald-log-detail').length, 0)
      assert.equal(findByClass(root, 'lichtwald-log-overview').length, 1)
      assert.equal(findByClass(root, 'lichtwald-log-entry-card').length, 2)
    }
  })
})

test('trennt den autoritativen Detail-Fokusstatus von Auswahl, Aktion und Pending-Kontext', () => {
  withLichtwaldLogView(({ root, view }) => {
    const focused = createEntry()
    const selected = createSecondEntry()
    const recorder = createActionRecorder()

    view.render(createViewModel({
      entries: [focused, selected],
      featuredEntryId: focused.id,
      selectedEntryId: selected.id,
    }), recorder.actions)

    let detail = findByClass(root, 'lichtwald-log-detail')[0]
    let focusState = assertSingleDetailFocusStatus(
      detail,
      'Lichtwald-Fokus: nicht ausgewählt'
    )
    assert.equal(findHeading(detail).textContent, selected.title)
    assert.equal(detail.textContent.includes(focused.title), false)
    assert.equal(focusState.status.textContent.includes(focused.id), false)
    assert.equal(focusState.status.textContent.includes(selected.id), false)
    assert.equal(
      focusState.focusAction.textContent,
      'Als Lichtwald-Fokus setzen'
    )

    focusState.focusAction.click()
    assert.deepEqual(recorder.calls.onSetFeaturedEntry, [[selected.id]])
    assert.equal(
      focusState.status.textContent,
      'Lichtwald-Fokus: nicht ausgewählt'
    )

    view.render(createViewModel({
      phase: 'mutating',
      entries: [focused, selected],
      featuredEntryId: focused.id,
      selectedEntryId: selected.id,
      featuredState: {
        isSubmitting: true,
        targetEntryId: selected.id,
        errorMessage: '',
      },
    }), recorder.actions)
    detail = findByClass(root, 'lichtwald-log-detail')[0]
    focusState = assertSingleDetailFocusStatus(
      detail,
      'Lichtwald-Fokus: nicht ausgewählt'
    )
    assert.equal(
      focusState.focusAction.textContent,
      'Als Lichtwald-Fokus setzen'
    )
    assert.equal(focusState.focusAction.disabled, true)

    view.render(createViewModel({
      entries: [focused, selected],
      featuredEntryId: focused.id,
      selectedEntryId: focused.id,
    }), recorder.actions)
    detail = findByClass(root, 'lichtwald-log-detail')[0]
    focusState = assertSingleDetailFocusStatus(
      detail,
      'Lichtwald-Fokus: ausgewählt'
    )
    assert.equal(findHeading(detail).textContent, focused.title)
    assert.equal(
      focusState.focusAction.textContent,
      'Lichtwald-Fokus entfernen'
    )

    view.render(createViewModel({
      phase: 'mutating',
      entries: [focused, selected],
      featuredEntryId: focused.id,
      selectedEntryId: focused.id,
      featuredState: {
        isSubmitting: true,
        targetEntryId: null,
        errorMessage: '',
      },
    }), recorder.actions)
    detail = findByClass(root, 'lichtwald-log-detail')[0]
    focusState = assertSingleDetailFocusStatus(
      detail,
      'Lichtwald-Fokus: ausgewählt'
    )
    assert.equal(
      focusState.focusAction.textContent,
      'Lichtwald-Fokus entfernen'
    )
    assert.equal(focusState.focusAction.disabled, true)
  })
})

const DIRECT_FOCUS_ATTRIBUTE_MUTATIONS = [
  'aria-label',
  'aria-description',
  'title',
].flatMap((attributeName) =>
  ['status', 'action'].flatMap((targetName) =>
    [true, false].map((isFeatured) => ({
      attributeName,
      isFeatured,
      targetName,
    }))
  )
)

for (const mutationCase of DIRECT_FOCUS_ATTRIBUTE_MUTATIONS) {
  const stateLabel = mutationCase.isFeatured
    ? 'ausgewählt'
    : 'nicht ausgewählt'

  test(
    `erkennt direkten ${mutationCase.attributeName}-Status am ` +
      `${mutationCase.targetName} für ${stateLabel}`,
    () => {
      withLichtwaldLogView(({ document, root, view }) => {
        const fixture = renderDetailFocusStatusFixture({
          document,
          root,
          view,
          isFeatured: mutationCase.isFeatured,
        })
        const target = mutationCase.targetName === 'status'
          ? fixture.status
          : fixture.focusAction
        const stateOnlyText = mutationCase.isFeatured
          ? '  ausgewählt  '
          : '\n nicht   ausgewählt\t'
        const fullStatusText = mutationCase.isFeatured
          ? '  Lichtwald-Fokus :\t ausgewählt  '
          : '\nLichtwald-Fokus:  nicht   ausgewählt\t'
        const mutatedStatusText = (
          mutationCase.attributeName === 'aria-description'
            ? stateOnlyText
            : fullStatusText
        )

        assert.doesNotThrow(() => {
          assertSingleDetailFocusStatus(
            fixture.detail,
            fixture.expectedStatusText,
            fixture.root
          )
        })

        target.setAttribute(
          mutationCase.attributeName,
          mutatedStatusText
        )

        assert.throws(
          () => assertSingleDetailFocusStatus(
            fixture.detail,
            fixture.expectedStatusText,
            fixture.root
          ),
          { name: 'AssertionError' }
        )
      })
    }
  )
}

const IDREF_FOCUS_ATTRIBUTE_MUTATIONS = [
  {
    attributeName: 'aria-labelledby',
    targetName: 'status',
    isFeatured: true,
    multipleReferences: false,
    hiddenMarker: false,
  },
  {
    attributeName: 'aria-labelledby',
    targetName: 'status',
    isFeatured: false,
    multipleReferences: true,
    hiddenMarker: true,
  },
  {
    attributeName: 'aria-labelledby',
    targetName: 'action',
    isFeatured: true,
    multipleReferences: true,
    hiddenMarker: false,
  },
  {
    attributeName: 'aria-labelledby',
    targetName: 'action',
    isFeatured: false,
    multipleReferences: false,
    hiddenMarker: true,
  },
  {
    attributeName: 'aria-describedby',
    targetName: 'status',
    isFeatured: true,
    multipleReferences: true,
    hiddenMarker: true,
  },
  {
    attributeName: 'aria-describedby',
    targetName: 'status',
    isFeatured: false,
    multipleReferences: false,
    hiddenMarker: false,
  },
  {
    attributeName: 'aria-describedby',
    targetName: 'action',
    isFeatured: true,
    multipleReferences: false,
    hiddenMarker: true,
  },
  {
    attributeName: 'aria-describedby',
    targetName: 'action',
    isFeatured: false,
    multipleReferences: true,
    hiddenMarker: false,
  },
]

for (const [caseIndex, mutationCase] of (
  IDREF_FOCUS_ATTRIBUTE_MUTATIONS.entries()
)) {
  const stateLabel = mutationCase.isFeatured
    ? 'ausgewählt'
    : 'nicht ausgewählt'
  const referenceLabel = mutationCase.multipleReferences
    ? 'Mehrfachreferenz'
    : 'Einzelreferenz'
  const visibilityLabel = mutationCase.hiddenMarker
    ? 'versteckt'
    : 'außerhalb'

  test(
    `erkennt ${mutationCase.attributeName}-${referenceLabel} am ` +
      `${mutationCase.targetName} für ${stateLabel} ${visibilityLabel}`,
    () => {
      withLichtwaldLogView(({ document, root, view }) => {
        const fixture = renderDetailFocusStatusFixture({
          document,
          root,
          view,
          isFeatured: mutationCase.isFeatured,
        })
        const target = mutationCase.targetName === 'status'
          ? fixture.status
          : fixture.focusAction
        const markerId = `synthetic-a11y-focus-marker-${caseIndex}`
        const marker = document.createElement('span')
        marker.id = markerId
        marker.setAttribute('id', markerId)
        marker.textContent = mutationCase.attributeName === 'aria-describedby'
          ? stateLabel
          : fixture.expectedStatusText
        if (mutationCase.hiddenMarker) {
          marker.setAttribute('hidden', '')
        }

        const referenceIds = []
        if (mutationCase.multipleReferences) {
          const beforeId = `synthetic-a11y-neutral-before-${caseIndex}`
          const before = document.createElement('span')
          before.id = beforeId
          before.setAttribute('id', beforeId)
          before.textContent = 'Synthetischer neutraler Hilfstext davor.'
          root.append(before)
          referenceIds.push(beforeId)
        }

        root.append(marker)
        referenceIds.push(markerId)

        if (mutationCase.multipleReferences) {
          const afterId = `synthetic-a11y-neutral-after-${caseIndex}`
          const after = document.createElement('span')
          after.id = afterId
          after.setAttribute('id', afterId)
          after.textContent = 'Synthetischer neutraler Hilfstext danach.'
          root.append(after)
          referenceIds.push(afterId)
        }

        assert.doesNotThrow(() => {
          assertSingleDetailFocusStatus(
            fixture.detail,
            fixture.expectedStatusText,
            fixture.root
          )
        })
        assert.equal(
          findAll(fixture.detail, (node) => node === marker).length,
          0
        )
        if (mutationCase.hiddenMarker) {
          assert.equal(marker.getAttribute('hidden'), '')
        }

        target.setAttribute(
          mutationCase.attributeName,
          `  ${referenceIds.join('\t \n ')}  `
        )
        const parsedReferences = normalizeAccessibleText(
          target.getAttribute(mutationCase.attributeName)
        ).split(' ').filter(Boolean)
        assert.deepEqual(parsedReferences, referenceIds)
        assert.equal(
          parsedReferences.length,
          mutationCase.multipleReferences ? 3 : 1
        )
        if (mutationCase.multipleReferences) {
          assert.equal(parsedReferences[1], markerId)
        }

        assert.throws(
          () => assertSingleDetailFocusStatus(
            fixture.detail,
            fixture.expectedStatusText,
            fixture.root
          ),
          { name: 'AssertionError' }
        )
      })
    }
  )
}

const SPLIT_IDREF_FOCUS_STATUS_MUTATIONS = [
  {
    attributeName: 'aria-labelledby',
    isFeatured: true,
    targetName: 'status',
    statusSuffix: '\t: ausgewählt.\n',
  },
  {
    attributeName: 'aria-describedby',
    isFeatured: false,
    targetName: 'action',
    statusSuffix: ' :\n nicht ausgewählt !  ',
  },
]

for (const [caseIndex, mutationCase] of (
  SPLIT_IDREF_FOCUS_STATUS_MUTATIONS.entries()
)) {
  const stateLabel = mutationCase.isFeatured
    ? 'ausgewählt'
    : 'nicht ausgewählt'

  test(
    `erkennt zusammengesetzten ${mutationCase.attributeName}-Status ` +
      `für ${stateLabel}`,
    () => {
      withLichtwaldLogView(({ document, root, view }) => {
        const fixture = renderDetailFocusStatusFixture({
          document,
          root,
          view,
          isFeatured: mutationCase.isFeatured,
        })
        const target = mutationCase.targetName === 'status'
          ? fixture.status
          : fixture.focusAction
        const prefixId = `synthetic-split-focus-prefix-${caseIndex}`
        const suffixId = `synthetic-split-focus-suffix-${caseIndex}`
        const prefix = document.createElement('span')
        const suffix = document.createElement('span')
        prefix.id = prefixId
        prefix.setAttribute('id', prefixId)
        prefix.textContent = '  Lichtwald-Fokus\n'
        suffix.id = suffixId
        suffix.setAttribute('id', suffixId)
        suffix.setAttribute('hidden', '')
        suffix.textContent = mutationCase.statusSuffix
        root.append(suffix, prefix)
        const rootChildren = [...root.children]
        assert.ok(
          rootChildren.indexOf(suffix) < rootChildren.indexOf(prefix)
        )

        assert.doesNotThrow(() => {
          assertSingleDetailFocusStatus(
            fixture.detail,
            fixture.expectedStatusText,
            fixture.root
          )
        })
        assert.equal(
          findAll(fixture.detail, (node) => node === prefix).length,
          0
        )
        assert.equal(
          findAll(fixture.detail, (node) => node === suffix).length,
          0
        )

        const declaredReferences = [
          `synthetic-unresolved-before-${caseIndex}`,
          prefixId,
          `synthetic-unresolved-between-${caseIndex}`,
          suffixId,
          `synthetic-unresolved-after-${caseIndex}`,
        ]
        target.setAttribute(
          mutationCase.attributeName,
          ` \n ${declaredReferences.join('\t  \n')} \t`
        )
        assert.deepEqual(
          normalizeAccessibleText(
            target.getAttribute(mutationCase.attributeName)
          ).split(' ').filter(Boolean),
          declaredReferences
        )

        assert.throws(
          () => assertSingleDetailFocusStatus(
            fixture.detail,
            fixture.expectedStatusText,
            fixture.root
          ),
          { name: 'AssertionError' }
        )
      })
    }
  )
}

const NFD_FOCUS_STATUS_MUTATIONS = [
  {
    attributeName: 'aria-label',
    isFeatured: true,
    path: 'direct',
    targetName: 'status',
    value: 'Lichtwald-Fokus: ausgewa\u0308hlt',
  },
  {
    attributeName: 'aria-describedby',
    isFeatured: false,
    path: 'idref',
    targetName: 'action',
    value: 'Lichtwald-Fokus: nicht ausgewa\u0308hlt',
  },
]

for (const [caseIndex, mutationCase] of (
  NFD_FOCUS_STATUS_MUTATIONS.entries()
)) {
  test(
    `erkennt NFD-Status ${caseIndex + 1} über ${mutationCase.path}`,
    () => {
      withLichtwaldLogView(({ document, root, view }) => {
        const fixture = renderDetailFocusStatusFixture({
          document,
          root,
          view,
          isFeatured: mutationCase.isFeatured,
        })
        const target = mutationCase.targetName === 'status'
          ? fixture.status
          : fixture.focusAction

        assert.notEqual(
          mutationCase.value,
          mutationCase.value.normalize('NFC')
        )
        assert.equal(
          mutationCase.value,
          mutationCase.value.normalize('NFD')
        )
        assert.doesNotThrow(() => {
          assertSingleDetailFocusStatus(
            fixture.detail,
            fixture.expectedStatusText,
            fixture.root
          )
        })

        if (mutationCase.path === 'direct') {
          target.setAttribute(
            mutationCase.attributeName,
            mutationCase.value
          )
          assert.equal(
            target.getAttribute(mutationCase.attributeName),
            mutationCase.value
          )
        } else {
          const markerId = `synthetic-nfd-focus-marker-${caseIndex}`
          const marker = document.createElement('span')
          marker.id = markerId
          marker.setAttribute('id', markerId)
          marker.setAttribute('hidden', '')
          marker.textContent = mutationCase.value
          root.append(marker)
          target.setAttribute(mutationCase.attributeName, markerId)
          assert.equal(
            target.getAttribute(mutationCase.attributeName),
            markerId
          )
          assert.equal(
            findAll(fixture.detail, (node) => node === marker).length,
            0
          )
        }

        assert.throws(
          () => assertSingleDetailFocusStatus(
            fixture.detail,
            fixture.expectedStatusText,
            fixture.root
          ),
          { name: 'AssertionError' }
        )
      })
    }
  )
}

const NON_STATUS_UNICODE_BOUNDARY_MUTATIONS = [
  {
    attributeName: 'aria-label',
    isFeatured: true,
    targetName: 'status',
    value: 'Lichtwald-Fokus: ausgewählten Eintrag öffnen',
  },
  {
    attributeName: 'aria-description',
    isFeatured: false,
    targetName: 'action',
    value: 'Lichtwald-Fokus: nicht ausgewählten Eintrag öffnen',
  },
  {
    attributeName: 'title',
    isFeatured: true,
    targetName: 'status',
    value: 'Lichtwald-Fokus: ausgewählt\u0301',
  },
  {
    attributeName: 'aria-label',
    isFeatured: false,
    targetName: 'action',
    value: 'Lichtwald-Fokus: nicht ausgewählt\u0308',
  },
]

for (const [caseIndex, mutationCase] of (
  NON_STATUS_UNICODE_BOUNDARY_MUTATIONS.entries()
)) {
  test(
    `akzeptiert Unicode-Gegenbeispiel ${caseIndex + 1} ohne Status-False-Positive`,
    () => {
      withLichtwaldLogView(({ document, root, view }) => {
        const fixture = renderDetailFocusStatusFixture({
          document,
          root,
          view,
          isFeatured: mutationCase.isFeatured,
        })
        const target = mutationCase.targetName === 'status'
          ? fixture.status
          : fixture.focusAction

        assert.doesNotThrow(() => {
          assertSingleDetailFocusStatus(
            fixture.detail,
            fixture.expectedStatusText,
            fixture.root
          )
        })

        target.setAttribute(mutationCase.attributeName, mutationCase.value)

        assert.doesNotThrow(() => {
          assertSingleDetailFocusStatus(
            fixture.detail,
            fixture.expectedStatusText,
            fixture.root
          )
        })
      })
    }
  )
}

test('rendert Create- und Updateformulare mit kanonischen Grenzen und sicheren Labels', () => {
  withLichtwaldLogView(({ root, view }) => {
    const entry = createEntry({
      tags: ['Eins,mit Komma', '  Leerraum  ', 'Duplikat', 'Duplikat'],
    })
    const updateForm = deepFreeze(createForm('updateEntry', {
      entryId: entry.id,
      values: {
        calendarDate: entry.calendarDate,
        title: entry.title,
        text: entry.text,
        tags: entry.tags,
      },
    }))
    const updateSnapshot = structuredClone(updateForm)

    view.render(createViewModel({
      entries: [entry],
      selectedEntryId: entry.id,
      form: updateForm,
    }))

    const form = findByClass(root, 'lichtwald-log-form')[0]
    const calendarDate = findControl(form, 'calendarDate')
    const title = findControl(form, 'title')
    const text = findControl(form, 'text')
    const tagControls = findTagControls(form)

    assert.ok(form)
    assert.equal(form.noValidate, true)
    assert.equal(getControlType(calendarDate), 'text')
    assert.equal(calendarDate.value, entry.calendarDate)
    assert.ok(
      String(calendarDate.placeholder || calendarDate.getAttribute('placeholder'))
        .includes('YYYY-MM-DD')
    )
    assert.ok(
      ['numeric', 'text'].includes(
        calendarDate.inputMode || calendarDate.getAttribute('inputmode')
      )
    )
    assert.equal(title.value, entry.title)
    assert.equal(title.maxLength, LICHTWALD_LOG_TITLE_MAX_LENGTH)
    assert.equal(
      title.getAttribute('maxlength'),
      String(LICHTWALD_LOG_TITLE_MAX_LENGTH)
    )
    assert.equal(text.tagName, 'TEXTAREA')
    assert.equal(text.value, entry.text)
    assert.equal(text.maxLength, LICHTWALD_LOG_TEXT_MAX_LENGTH)
    assert.equal(
      text.getAttribute('maxlength'),
      String(LICHTWALD_LOG_TEXT_MAX_LENGTH)
    )
    assert.deepEqual(tagControls.map((control) => control.value), entry.tags)
    assert.ok(
      tagControls.every(
        (control) => control.maxLength === LICHTWALD_LOG_TAG_MAX_LENGTH
      )
    )
    const tagFieldset = findByClass(form, 'lichtwald-log-tags-editor')[0]
    assert.equal(tagFieldset.tagName, 'FIELDSET')
    assert.ok(findByTag(tagFieldset, 'legend')[0].textContent.includes('Tags'))

    const elementsById = new Map(
      findAll(form, (node) => node.nodeType === 1 && node.id !== '')
        .map((element) => [element.id, element])
    )
    const labels = findByTag(form, 'label')
    assert.ok(labels.length >= 3 + entry.tags.length)
    for (const label of labels) {
      const controlledId = label.getAttribute('for')
      assert.ok(controlledId)
      assert.ok(elementsById.has(controlledId))
    }

    for (const control of [calendarDate, title, text, ...tagControls]) {
      const describedBy = control.getAttribute('aria-describedby')
      assert.ok(describedBy)
      for (const descriptionId of describedBy.split(/\s+/)) {
        assert.ok(elementsById.has(descriptionId))
      }
    }

    assert.equal(
      findByTag(form, 'input').some(
        (control) => ['entryId', 'id', 'dataOrigin'].includes(control.name)
      ),
      false
    )
    assert.deepEqual(updateForm, updateSnapshot)

    view.render(createViewModel({
      phase: 'empty',
      entries: [],
      form: deepFreeze(createForm('createEntry')),
    }))
    assert.equal(findControl(root, 'calendarDate').value, '')
    assert.equal(findControl(root, 'title').value, '')
    assert.equal(findControl(root, 'text').value, '')
    assert.equal(findTagControls(root).length, 0)
    assert.equal(findButton(root, 'Eintrag erstellen') !== null, true)
  })
})

test('reicht skalare Formwerte unverändert und pro Event genau einmal weiter', () => {
  withLichtwaldLogView(({ root, view }) => {
    const recorder = createActionRecorder()
    view.render(
      createViewModel({
        phase: 'empty',
        entries: [],
        form: createForm('createEntry'),
      }),
      recorder.actions
    )

    const values = {
      calendarDate: ' 2400-02-29 ',
      title: '  <script>synthetic-title</script>  ',
      text: '  Zeile eins\nZeile zwei ${synthetic-template}  ',
    }

    for (const [fieldName, value] of Object.entries(values)) {
      const control = findControl(root, fieldName)
      control.value = value
      control.dispatchEvent({ type: 'input' })
    }

    assert.deepEqual(recorder.calls.onUpdateFormField, [
      ['calendarDate', values.calendarDate],
      ['title', values.title],
      ['text', values.text],
    ])
  })
})

test('bearbeitet, ergänzt und entfernt Tags verlustfrei mit frischen dichten Arrays', () => {
  withLichtwaldLogView(({ root, view }) => {
    const originalTags = deepFreeze([
      'Eins,mit Komma',
      '  Leerraum  ',
      'Duplikat',
      'Duplikat',
      '',
    ])
    const recorder = createActionRecorder()

    function renderTags(tags) {
      view.render(
        createViewModel({
          phase: 'empty',
          entries: [],
          form: createForm('createEntry', {
            values: {
              calendarDate: '',
              title: '',
              text: '',
              tags,
            },
          }),
        }),
        recorder.actions
      )
    }

    renderTags(originalTags)
    const editedValue = '  NEU,mit Komma  '
    const editedControl = findControl(root, 'tag-1')
    editedControl.value = editedValue
    editedControl.dispatchEvent({ type: 'input' })
    const editCall = recorder.calls.onUpdateFormField.at(-1)
    assert.equal(editCall[0], 'tags')
    assert.deepEqual(editCall[1], [
      'Eins,mit Komma',
      editedValue,
      'Duplikat',
      'Duplikat',
      '',
    ])
    assert.notStrictEqual(editCall[1], originalTags)
    assert.strictEqual(Object.getPrototypeOf(editCall[1]), Array.prototype)
    assert.deepEqual(Object.keys(editCall[1]), ['0', '1', '2', '3', '4'])

    renderTags(originalTags)
    findButton(root, 'Tag hinzufügen').click()
    const addCall = recorder.calls.onUpdateFormField.at(-1)
    assert.deepEqual(addCall, ['tags', [...originalTags, '']])
    assert.notStrictEqual(addCall[1], originalTags)

    renderTags(originalTags)
    findButton(root, 'Tag 3 entfernen').click()
    const removeCall = recorder.calls.onUpdateFormField.at(-1)
    assert.deepEqual(removeCall, [
      'tags',
      ['Eins,mit Komma', '  Leerraum  ', 'Duplikat', ''],
    ])
    assert.notStrictEqual(removeCall[1], originalTags)
    assert.deepEqual(originalTags, [
      'Eins,mit Komma',
      '  Leerraum  ',
      'Duplikat',
      'Duplikat',
      '',
    ])

    const maximumTags = deepFreeze(
      Array.from(
        { length: LICHTWALD_LOG_MAX_TAG_COUNT },
        (_, index) => `Tag ${index + 1}`
      )
    )
    renderTags(maximumTags)
    assert.equal(findTagControls(root).length, LICHTWALD_LOG_MAX_TAG_COUNT)
    assert.equal(findButton(root, 'Tag hinzufügen').disabled, true)
    assert.deepEqual(
      findByTag(root, 'button')
        .filter((button) => /^Tag \d+ entfernen$/.test(button.textContent))
        .map((button) => button.textContent),
      Array.from(
        { length: LICHTWALD_LOG_MAX_TAG_COUNT },
        (_, index) => `Tag ${index + 1} entfernen`
      )
    )
  })
})

test('verknüpft Feldfehler, Formularalert und Dirty-Hinweis ohne doppelte Meldung', () => {
  withLichtwaldLogView(({ root, view }) => {
    const sharedMessage = 'Bitte korrigiere die synthetischen Formularfelder.'
    const fieldErrors = {
      form: sharedMessage,
      calendarDate: 'Synthetischer Datumsfehler.',
      title: 'Synthetischer Titelfehler.',
      text: 'Synthetischer Textfehler.',
      tags: 'Synthetischer Tagfehler.',
    }

    view.render(createViewModel({
      phase: 'empty',
      entries: [],
      form: createForm('createEntry', {
        values: {
          calendarDate: 'ungültig',
          title: 'Fehlerentwurf',
          text: 'Synthetischer Entwurf',
          tags: [''],
        },
        fieldErrors,
        errorMessage: sharedMessage,
        isDirty: true,
      }),
    }))

    const alert = findRole(root, 'alert').find(
      (element) => element.textContent.includes(sharedMessage)
    )
    assert.ok(alert)
    assert.equal(
      root.textContent.split(sharedMessage).length - 1,
      1
    )
    assert.ok(root.textContent.toLowerCase().includes('ungespeichert'))

    for (const fieldName of ['calendarDate', 'title', 'text', 'tag-0']) {
      const control = findControl(root, fieldName)
      assert.equal(control.getAttribute('aria-invalid'), 'true')
      assert.ok(control.getAttribute('aria-describedby').includes('error'))
    }
  })
})

test('deaktiviert während Formular-Busy alle Interaktionen und behält den Draft sichtbar', () => {
  withLichtwaldLogView(({ root, view }) => {
    const recorder = createActionRecorder()
    const draftMarker = 'Synthetischer sichtbarer Busy-Draft'
    view.render(
      createViewModel({
        phase: 'mutating',
        entries: [createEntry()],
        form: createForm('createEntry', {
          values: {
            calendarDate: '2048-08-08',
            title: draftMarker,
            text: 'Fiktiver Busy-Text',
            tags: ['Busy'],
          },
          isSubmitting: true,
          isDirty: true,
        }),
      }),
      recorder.actions
    )

    const form = findByClass(root, 'lichtwald-log-form')[0]
    assert.equal(root.getAttribute('aria-busy'), 'true')
    assert.equal(form.getAttribute('aria-busy'), 'true')
    assert.equal(findControl(form, 'title').value, draftMarker)
    assert.ok(
      findByTag(form, 'input')
        .concat(findByTag(form, 'textarea'))
        .every((control) => control.disabled)
    )
    assert.ok(findByTag(form, 'button').every((button) => button.disabled))

    findControl(form, 'title').dispatchEvent({ type: 'input' })
    findByTag(form, 'form')[0]?.dispatchEvent({ type: 'submit' })
    form.dispatchEvent({ type: 'submit' })
    findButton(form, 'Abbrechen').click()
    assert.deepEqual(recorder.calls.onUpdateFormField, [])
    assert.deepEqual(recorder.calls.onSubmitForm, [])
    assert.deepEqual(recorder.calls.onCancelForm, [])
  })
})

test('sendet Create und Update exakt flach aus aktuellen Controls und cancelt ohne Payload', () => {
  withLichtwaldLogView(({ root, view }) => {
    const recorder = createActionRecorder()
    const createModel = deepFreeze(createViewModel({
      phase: 'empty',
      entries: [],
      form: createForm('createEntry', {
        values: {
          calendarDate: '2046-01-02',
          title: 'Alter synthetischer Create-Titel',
          text: 'Alter synthetischer Create-Text',
          tags: ['Alt', 'Tag'],
        },
      }),
    }))
    const createSnapshot = structuredClone(createModel)

    view.render(createModel, recorder.actions)
    findControl(root, 'calendarDate').value = ' 2046-02-03 '
    findControl(root, 'title').value = '  Neuer Create-Titel  '
    findControl(root, 'text').value = 'Neue Zeile eins\nNeue Zeile zwei'
    findControl(root, 'tag-0').value = 'Tag,mit Komma'
    findControl(root, 'tag-1').value = '  Tag zwei  '
    const createFormElement = findByTag(root, 'form')[0]

    assert.equal(
      createFormElement.dispatchEvent({ type: 'submit' }),
      false
    )
    assert.equal(recorder.calls.onSubmitForm.length, 1)
    const createSubmission = recorder.calls.onSubmitForm[0][0]
    assert.deepEqual(createSubmission, {
      type: 'createEntry',
      calendarDate: ' 2046-02-03 ',
      title: '  Neuer Create-Titel  ',
      text: 'Neue Zeile eins\nNeue Zeile zwei',
      tags: ['Tag,mit Komma', '  Tag zwei  '],
    })
    assertOwnKeys(createSubmission, [
      'type',
      'calendarDate',
      'title',
      'text',
      'tags',
    ])
    assert.equal(Object.hasOwn(createSubmission, 'entryId'), false)
    assert.equal(Object.hasOwn(createSubmission, 'values'), false)
    assert.notStrictEqual(createSubmission.tags, createModel.form.values.tags)
    assert.deepEqual(recorder.calls.onUpdateFormField, [])
    assert.deepEqual(createModel, createSnapshot)

    findButton(root, 'Abbrechen').click()
    assert.deepEqual(recorder.calls.onCancelForm, [[]])

    const target = createEntry()
    const updateModel = deepFreeze(createViewModel({
      entries: [target],
      selectedEntryId: target.id,
      form: createForm('updateEntry', {
        entryId: target.id,
        values: {
          calendarDate: target.calendarDate,
          title: target.title,
          text: target.text,
          tags: target.tags,
        },
      }),
    }))
    view.render(updateModel, recorder.actions)
    findControl(root, 'title').value = target.title
    const updateFormElement = findByTag(root, 'form')[0]
    assert.equal(updateFormElement.dispatchEvent({ type: 'submit' }), false)

    const updateSubmission = recorder.calls.onSubmitForm.at(-1)[0]
    assert.deepEqual(updateSubmission, {
      type: 'updateEntry',
      entryId: target.id,
      calendarDate: target.calendarDate,
      title: target.title,
      text: target.text,
      tags: target.tags,
    })
    assertOwnKeys(updateSubmission, [
      'type',
      'entryId',
      'calendarDate',
      'title',
      'text',
      'tags',
    ])
    assert.equal(Object.hasOwn(updateSubmission, 'values'), false)
    assert.equal(
      findByTag(root, 'input').some(
        (control) => control.value === target.id
      ),
      false
    )

    for (const button of findByTag(root, 'button')) {
      const expectedType = button.textContent === 'Änderungen speichern'
        ? 'submit'
        : 'button'
      assert.equal(getControlType(button), expectedType)
    }
  })
})

test('stellt Fokus und Caret nach synchronem Controller-Rerender flüchtig wieder her', () => {
  withLichtwaldLogView(({ document, root, view }) => {
    let currentModel = createViewModel({
      phase: 'empty',
      entries: [],
      form: createForm('createEntry', {
        values: {
          calendarDate: '',
          title: 'Synthetischer Caret-Titel',
          text: '',
          tags: ['Erster Tag', 'Zweiter synthetischer Tag'],
        },
      }),
    })
    let recorder
    recorder = createActionRecorder({
      onUpdateFormField(fieldName, value) {
        currentModel = {
          ...currentModel,
          form: {
            ...currentModel.form,
            values: {
              ...currentModel.form.values,
              [fieldName]: fieldName === 'tags' ? [...value] : value,
            },
          },
          focusTarget: { type: 'formField', fieldName },
        }
        view.render(deepFreeze(currentModel), recorder.actions)
      },
    })

    view.render(deepFreeze(currentModel), recorder.actions)
    let title = findControl(root, 'title')
    title.focus()
    title.setSelectionRange(4, 11)
    title.value = 'Synthetischer aktualisierter Caret-Titel'
    title.dispatchEvent({ type: 'input' })

    title = findControl(root, 'title')
    assert.equal(document.activeElement, title)
    assert.equal(title.selectionStart, 4)
    assert.equal(title.selectionEnd, 11)
    assert.equal(title.value, 'Synthetischer aktualisierter Caret-Titel')

    let secondTag = findControl(root, 'tag-1')
    secondTag.focus()
    secondTag.setSelectionRange(3, 9)
    secondTag.value = 'Zweiter aktualisierter Tag'
    secondTag.dispatchEvent({ type: 'input' })

    secondTag = findControl(root, 'tag-1')
    assert.equal(document.activeElement, secondTag)
    assert.equal(secondTag.selectionStart, 3)
    assert.equal(secondTag.selectionEnd, 9)
    assert.equal(secondTag.value, 'Zweiter aktualisierter Tag')
    assert.deepEqual(recorder.calls.onUpdateFormField.at(-1), [
      'tags',
      ['Erster Tag', 'Zweiter aktualisierter Tag'],
    ])
  })
})

test('verwirft ungenutzte Caret-Metadaten bei unmount und fokussiert danach nur die Taggruppe', () => {
  withLichtwaldLogView(({ document, root, view }) => {
    const model = createViewModel({
      phase: 'empty',
      entries: [],
      form: createForm('createEntry', {
        values: {
          calendarDate: '',
          title: '',
          text: '',
          tags: ['Erster Tag', 'Zweiter Tag'],
        },
      }),
    })
    const recorder = createActionRecorder()
    view.render(model, recorder.actions)
    const secondTag = findControl(root, 'tag-1')
    secondTag.focus()
    secondTag.setSelectionRange(2, 5)
    secondTag.value = 'Nicht wiederherzustellender Draft'
    secondTag.dispatchEvent({ type: 'input' })

    view.unmount()
    view.render({
      ...model,
      focusTarget: { type: 'formField', fieldName: 'tags' },
    })

    const tagGroup = findByClass(root, 'lichtwald-log-tags-editor')[0]
    assert.equal(document.activeElement, tagGroup)
    assert.notEqual(document.activeElement, findControl(root, 'tag-1'))
  })
})

test('bindet die Inline-Delete-Bestätigung statisch und ohne optimistische Entfernung', () => {
  withLichtwaldLogView(({ root, view }) => {
    const target = createEntry()
    const other = createSecondEntry()
    const recorder = createActionRecorder()

    view.render(
      createViewModel({
        entries: [target, other],
        selectedEntryId: target.id,
      }),
      recorder.actions
    )
    findButton(root, 'Eintrag dauerhaft löschen').click()
    assert.deepEqual(recorder.calls.onRequestDeleteEntry, [[target.id]])
    assert.ok(root.textContent.includes(target.title))
    assert.equal(findByClass(root, 'lichtwald-log-detail').length, 1)

    const deleteState = {
      entryId: target.id,
      isSubmitting: false,
      errorMessage: '',
    }
    const mutableModel = createViewModel({
      entries: [target, other],
      selectedEntryId: target.id,
      deleteState,
    })
    view.render(mutableModel, recorder.actions)
    const confirmation = findByClass(root, 'lichtwald-log-confirmation')[0]
    assert.ok(confirmation)
    assert.equal(findByTag(confirmation, 'fieldset').length, 1)
    assert.ok(findByTag(confirmation, 'legend')[0])
    assert.equal(confirmation.textContent.includes(target.id), false)
    assert.equal(confirmation.textContent.includes(target.title), false)
    assert.equal(findByTag(root, 'dialog').length, 0)

    deleteState.entryId = other.id
    findButton(confirmation, 'Nicht löschen').click()
    findButton(confirmation, 'Dauerhaft löschen').click()
    assert.deepEqual(recorder.calls.onCancelDeleteEntry, [[]])
    assert.deepEqual(recorder.calls.onConfirmDeleteEntry, [[target.id]])
    assert.ok(root.textContent.includes(target.title))
  })
})

test('hält Delete-Bestätigung und Fehler während Busy sichtbar und deaktiviert Konkurrenz', () => {
  withLichtwaldLogView(({ root, view }) => {
    const target = createEntry()
    const recorder = createActionRecorder()
    const errorMessage = 'Der synthetische Eintrag konnte nicht gelöscht werden.'

    view.render(
      createViewModel({
        entries: [target],
        selectedEntryId: target.id,
        deleteState: {
          entryId: target.id,
          isSubmitting: false,
          errorMessage,
        },
        focusTarget: { type: 'deleteAlert', entryId: target.id },
      }),
      recorder.actions
    )
    let confirmation = findByClass(root, 'lichtwald-log-confirmation')[0]
    const alert = findRole(confirmation, 'alert')[0]
    assert.equal(alert.textContent, errorMessage)

    view.render(
      createViewModel({
        phase: 'mutating',
        entries: [target],
        selectedEntryId: target.id,
        deleteState: {
          entryId: target.id,
          isSubmitting: true,
          errorMessage: '',
        },
      }),
      recorder.actions
    )
    confirmation = findByClass(root, 'lichtwald-log-confirmation')[0]
    assert.ok(confirmation)
    assert.equal(root.getAttribute('aria-busy'), 'true')
    assert.equal(confirmation.getAttribute('aria-busy'), 'true')
    assert.ok(findByTag(root, 'button').every((button) => button.disabled))
    findButton(confirmation, 'Nicht löschen').click()
    findButton(confirmation, 'Wird dauerhaft gelöscht …').click()
    assert.deepEqual(recorder.calls.onCancelDeleteEntry, [])
    assert.deepEqual(recorder.calls.onConfirmDeleteEntry, [])
    assert.ok(root.textContent.includes(target.title))
  })
})

test('bildet Lichtwald-Fokus explizit auf ID oder null ab und hält den Badge autoritativ', () => {
  withLichtwaldLogView(({ root, view }) => {
    const focused = createEntry()
    const other = createSecondEntry()
    const recorder = createActionRecorder()

    view.render(
      createViewModel({
        entries: [focused, other],
        featuredEntryId: focused.id,
      }),
      recorder.actions
    )
    const cards = findByClass(root, 'lichtwald-log-entry-card')
    findButton(cards[0], 'Lichtwald-Fokus entfernen').click()
    findButton(cards[1], 'Als Lichtwald-Fokus setzen').click()
    assert.deepEqual(recorder.calls.onSetFeaturedEntry, [[null], [other.id]])

    view.render(createViewModel({
      phase: 'mutating',
      entries: [focused, other],
      featuredEntryId: focused.id,
      featuredState: {
        isSubmitting: true,
        targetEntryId: null,
        errorMessage: '',
      },
    }), recorder.actions)
    const busyCards = findByClass(root, 'lichtwald-log-entry-card')
    assert.equal(
      findByClass(busyCards[0], 'lichtwald-log-featured-badge').length,
      1
    )
    assert.equal(
      findByClass(busyCards[1], 'lichtwald-log-featured-badge').length,
      0
    )
    const featuredBusy = findByClass(root, 'lichtwald-log-featured-state')[0]
    assert.ok(featuredBusy)
    assert.equal(featuredBusy.getAttribute('aria-busy'), 'true')
    assert.ok(featuredBusy.textContent.toLowerCase().includes('entfern'))
    assert.ok(findByTag(root, 'button').every((button) => button.disabled))

    view.render(createViewModel({
      entries: [focused, other],
      featuredEntryId: focused.id,
      selectedEntryId: other.id,
      featuredState: {
        isSubmitting: false,
        targetEntryId: other.id,
        errorMessage: 'Der synthetische Fokus konnte nicht gespeichert werden.',
      },
      focusTarget: { type: 'featuredAlert' },
    }))
    const focusAlert = findRole(root, 'alert').find(
      (element) => element.textContent.includes('synthetische Fokus')
    )
    assert.ok(focusAlert)
    assert.equal(findByClass(root, 'lichtwald-log-detail').length, 1)
    assert.ok(root.textContent.includes(other.title))
  })
})

test('rendert Success und Notice als feste Statusregion und interpoliert keinen fremden Tone', () => {
  withLichtwaldLogView(({ root, view }) => {
    for (const [tone, expectedClass] of [
      ['success', 'lichtwald-log-feedback--success'],
      ['notice', 'lichtwald-log-feedback--notice'],
    ]) {
      view.render(createViewModel({
        statusMessage: `Statische synthetische ${tone}-Meldung.`,
        statusMessageTone: tone,
      }))
      const status = findRole(root, 'status').find(
        (element) => element.textContent.includes(`synthetische ${tone}`)
      )
      assert.ok(status)
      assert.equal(status.getAttribute('aria-live'), 'polite')
      assert.equal(status.getAttribute('aria-atomic'), 'true')
      assert.equal(status.classList.contains(expectedClass), true)
    }

    const privateToneMarker = 'synthetic-private-tone-marker'
    view.render(createViewModel({
      statusMessage: 'Statische Meldung mit unbekanntem Tone.',
      statusMessageTone: privateToneMarker,
    }))
    assertElementDoesNotExpose(root, [privateToneMarker])
  })
})

test('löst die vollständige Controller-Fokusmatrix erst im neuen DOM auf', () => {
  withLichtwaldLogView(({ document, root, view }) => {
    const entry = createEntry()
    const formError = 'Synthetischer allgemeiner Formularfehler.'
    const deleteError = 'Synthetischer Delete-Fehler.'
    const featuredError = 'Synthetischer Fokus-Fehler.'
    const statusMessage = 'Synthetischer Erfolgsstatus.'
    const cases = [
      {
        label: 'heading',
        model: createViewModel({
          entries: [],
          phase: 'empty',
          focusTarget: { type: 'heading' },
        }),
        findExpected: () => findByTag(root, 'h1')[0],
      },
      {
        label: 'entry overview',
        model: createViewModel({
          entries: [entry],
          focusTarget: { type: 'entry', entryId: entry.id },
        }),
        findExpected: () => findHeading(
          findByClass(root, 'lichtwald-log-entry-card')[0]
        ),
      },
      {
        label: 'entry detail',
        model: createViewModel({
          entries: [entry],
          selectedEntryId: entry.id,
          focusTarget: { type: 'entry', entryId: entry.id },
        }),
        findExpected: () => findHeading(
          findByClass(root, 'lichtwald-log-detail')[0]
        ),
      },
      ...['calendarDate', 'title', 'text'].map((fieldName) => ({
        label: `formField ${fieldName}`,
        model: createViewModel({
          phase: 'empty',
          entries: [],
          form: createForm('createEntry'),
          focusTarget: { type: 'formField', fieldName },
        }),
        findExpected: () => findControl(root, fieldName),
      })),
      {
        label: 'formField tags',
        model: createViewModel({
          phase: 'empty',
          entries: [],
          form: createForm('createEntry'),
          focusTarget: { type: 'formField', fieldName: 'tags' },
        }),
        findExpected: () => findByClass(root, 'lichtwald-log-tags-editor')[0],
      },
      {
        label: 'formAlert',
        model: createViewModel({
          phase: 'empty',
          entries: [],
          form: createForm('createEntry', { errorMessage: formError }),
          focusTarget: { type: 'formAlert' },
        }),
        findExpected: () => findRole(root, 'alert').find(
          (element) => element.textContent.includes(formError)
        ),
      },
      {
        label: 'formTrigger create',
        model: createViewModel({
          phase: 'empty',
          entries: [],
          focusTarget: { type: 'formTrigger' },
        }),
        findExpected: () => findButton(root, 'Neuen Eintrag erstellen'),
      },
      {
        label: 'formTrigger update',
        model: createViewModel({
          entries: [entry],
          selectedEntryId: entry.id,
          focusTarget: { type: 'formTrigger', entryId: entry.id },
        }),
        findExpected: () => findButton(root, 'Eintrag bearbeiten'),
      },
      {
        label: 'deleteConfirmation',
        model: createViewModel({
          entries: [entry],
          selectedEntryId: entry.id,
          deleteState: {
            entryId: entry.id,
            isSubmitting: false,
            errorMessage: '',
          },
          focusTarget: {
            type: 'deleteConfirmation',
            entryId: entry.id,
          },
        }),
        findExpected: () => findButton(root, 'Nicht löschen'),
      },
      {
        label: 'deleteAlert',
        model: createViewModel({
          entries: [entry],
          selectedEntryId: entry.id,
          deleteState: {
            entryId: entry.id,
            isSubmitting: false,
            errorMessage: deleteError,
          },
          focusTarget: { type: 'deleteAlert', entryId: entry.id },
        }),
        findExpected: () => findRole(root, 'alert').find(
          (element) => element.textContent.includes(deleteError)
        ),
      },
      {
        label: 'featuredAlert',
        model: createViewModel({
          entries: [entry],
          featuredState: {
            isSubmitting: false,
            targetEntryId: entry.id,
            errorMessage: featuredError,
          },
          focusTarget: { type: 'featuredAlert' },
        }),
        findExpected: () => findRole(root, 'alert').find(
          (element) => element.textContent.includes(featuredError)
        ),
      },
      {
        label: 'status',
        model: createViewModel({
          entries: [entry],
          statusMessage,
          focusTarget: { type: 'status' },
        }),
        findExpected: () => findRole(root, 'status').find(
          (element) => element.textContent.includes(statusMessage)
        ),
      },
    ]

    for (const focusCase of cases) {
      document.activeElement = null
      view.render(deepFreeze(focusCase.model))
      const expectedElement = focusCase.findExpected()
      assert.ok(expectedElement, focusCase.label)
      assert.equal(document.activeElement, expectedElement, focusCase.label)
      assertCurrentFocusIsInside(root, document)
    }
  })
})

test('stiehlt bei null keinen Fokus und fällt bei unbekannten Zielen kontrolliert auf die Überschrift zurück', () => {
  withLichtwaldLogView(({ document, root, view }) => {
    const externalFocus = document.createElement('button')
    externalFocus.focus()
    view.render(createViewModel({ focusTarget: null }))
    assert.equal(document.activeElement, externalFocus)

    const fallbackCases = [
      { type: 'unknownSyntheticTarget' },
      { type: 'entry', entryId: 'missing-entry' },
      {
        type: 'entry',
        entryId: createEntry().id.toUpperCase(),
      },
      { type: 'formField', fieldName: 'unknownField' },
      { type: 'formTrigger', entryId: 'missing-entry' },
    ]

    for (const focusTarget of fallbackCases) {
      view.render(createViewModel({ focusTarget }))
      assert.equal(document.activeElement, findByTag(root, 'h1')[0])
    }
  })
})

test('setzt Fokus nach replaceChildren und fängt Fokusfehler ohne fremde Meldung ab', () => {
  const fakeDom = createFakeDom()
  const privateMarker = 'synthetic-focus-exception-private-marker'
  let replaceCompleted = false
  let focusCalls = 0
  const originalReplaceChildren = fakeDom.root.replaceChildren.bind(fakeDom.root)
  const originalCreateElement = fakeDom.document.createElement.bind(
    fakeDom.document
  )

  fakeDom.root.replaceChildren = (...nodes) => {
    originalReplaceChildren(...nodes)
    replaceCompleted = true
  }
  fakeDom.document.createElement = (tagName) => {
    const element = originalCreateElement(tagName)

    if (String(tagName).toLowerCase() === 'h1') {
      element.focus = () => {
        focusCalls += 1
        assert.equal(replaceCompleted, true)
        throw new Error(privateMarker)
      }
    }

    return element
  }

  try {
    const view = createLichtwaldLogView(fakeDom.root)
    assert.doesNotThrow(() => {
      view.render(createViewModel({ focusTarget: { type: 'heading' } }))
    })
    assert.equal(focusCalls, 1)
    assert.equal(fakeDom.root.textContent.includes(privateMarker), false)
    assert.equal(findByClass(fakeDom.root, 'lichtwald-log').length, 1)
  } finally {
    fakeDom.restore()
  }
})

test('behandelt Markup-Sentinels vollständig als Plain Text und erzeugt keine Markup-Elemente', () => {
  withLichtwaldLogView(({ root, view }) => {
    const title = '<script>synthetic-title-marker</script>'
    const text = [
      '<img onerror=synthetic-image-marker>',
      '<svg onload=synthetic-svg-marker></svg>',
      '</textarea>',
      '<!-- synthetic-comment-marker -->',
      '${synthetic-template-marker}',
    ].join('\n')
    const tags = [
      '<a href=https://invalid.example>synthetic-link-marker</a>',
      '<style>synthetic-style-marker</style>',
    ]
    const entry = createEntry({ title, text, tags })

    view.render(deepFreeze(createViewModel({
      entries: [entry],
      selectedEntryId: entry.id,
    })))

    for (const privateText of [title, text, ...tags]) {
      assert.ok(root.textContent.includes(privateText))
    }
    for (const forbiddenTag of [
      'script',
      'img',
      'svg',
      'a',
      'style',
      'template',
    ]) {
      assert.equal(findByTag(root, forbiddenTag).length, 0)
    }
    assertElementDoesNotExpose(root, [title, text, ...tags])

    view.render(createViewModel({
      phase: 'empty',
      entries: [],
      form: createForm('createEntry', {
        values: {
          calendarDate: '</textarea>',
          title,
          text,
          tags,
        },
      }),
    }))
    assert.equal(findControl(root, 'calendarDate').value, '</textarea>')
    assert.equal(findControl(root, 'title').value, title)
    assert.equal(findControl(root, 'text').value, text)
    assert.deepEqual(findTagControls(root).map(({ value }) => value), tags)
    assert.equal(findByTag(root, 'script').length, 0)
    assert.equal(findByTag(root, 'img').length, 0)
    assert.equal(findByTag(root, 'svg').length, 0)
  })
})

test('hält Entry-IDs ausschließlich in Closures und positionsbasierten Maps', () => {
  withLichtwaldLogView(({ root, view }) => {
    const privateId = 'entry-][data-private=SYNTHETIC-ID-MARKER]#fragment'
    const entry = createEntry({ id: privateId })
    const recorder = createActionRecorder()

    view.render(createViewModel({ entries: [entry] }), recorder.actions)
    const card = findByClass(root, 'lichtwald-log-entry-card')[0]
    assert.equal(root.textContent.includes(privateId), false)
    assertElementDoesNotExpose(root, [privateId])
    assert.equal(
      findAll(root, (node) => (
        node.nodeType === 1 &&
        [...node.attributes.keys()].some((name) => name.startsWith('data-'))
      )).length,
      0
    )
    findButton(card, 'Eintrag öffnen').click()
    findButton(card, 'Als Lichtwald-Fokus setzen').click()
    assert.deepEqual(recorder.calls.onSelectEntry, [[privateId]])
    assert.deepEqual(recorder.calls.onSetFeaturedEntry, [[privateId]])

    view.render(createViewModel({
      entries: [entry],
      selectedEntryId: privateId,
    }), recorder.actions)
    findButton(root, 'Eintrag bearbeiten').click()
    findButton(root, 'Eintrag dauerhaft löschen').click()
    assert.deepEqual(recorder.calls.onOpenUpdateEntryForm, [[privateId]])
    assert.deepEqual(recorder.calls.onRequestDeleteEntry, [[privateId]])
    assert.equal(root.textContent.includes(privateId), false)
    assertElementDoesNotExpose(root, [privateId])
  })
})

test('kopiert private Inhalte nie in Feedback oder Delete-Bestätigungen', () => {
  withLichtwaldLogView(({ root, view }) => {
    const markers = [
      'lichtwald-entry-private-feedback-sentinel',
      'SYNTHETIC-PRIVATE-TITLE-FEEDBACK-MARKER',
      'SYNTHETIC-PRIVATE-TEXT-FEEDBACK-MARKER',
      'SYNTHETIC-PRIVATE-TAG-FEEDBACK-MARKER',
    ]
    const entry = createEntry({
      id: markers[0],
      title: markers[1],
      text: markers[2],
      tags: [markers[3]],
    })

    view.render(createViewModel({
      entries: [entry],
      selectedEntryId: entry.id,
      deleteState: {
        entryId: entry.id,
        isSubmitting: false,
        errorMessage: 'Statische Delete-Fehlermeldung.',
      },
      featuredState: {
        isSubmitting: false,
        targetEntryId: entry.id,
        errorMessage: 'Statische Fokus-Fehlermeldung.',
      },
      statusMessage: 'Statische Erfolgsmeldung.',
      errorMessage: 'Statische globale Fehlermeldung.',
    }))

    const protectedRegions = [
      ...findRole(root, 'alert'),
      ...findRole(root, 'status'),
      ...findByClass(root, 'lichtwald-log-confirmation'),
      ...findByClass(root, 'lichtwald-log-featured-state'),
    ]
    for (const region of protectedRegions) {
      for (const marker of markers) {
        assert.equal(region.textContent.includes(marker), false)
      }
    }
  })
})

test('berührt weder localStorage noch fremde Ports oder Consolemethoden', () => {
  const storageDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    'localStorage'
  )
  const methods = ['log', 'warn', 'error', 'info', 'debug', 'trace']
  const descriptors = new Map()
  let storageCalls = 0
  let foreignCalls = 0
  let consoleCalls = 0
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      storageCalls += 1
      throw new Error('synthetic-storage-marker')
    },
  })
  for (const name of methods) {
    descriptors.set(name, Object.getOwnPropertyDescriptor(console, name))
    Object.defineProperty(console, name, {
      configurable: true,
      writable: true,
      value() {
        consoleCalls += 1
      },
    })
  }

  const fakeDom = createFakeDom()
  try {
    const actions = { onOpenCreateEntryForm() {} }
    for (const name of ['service', 'storageAdapter', 'network']) {
      Object.defineProperty(actions, name, {
        get() {
          foreignCalls += 1
          throw new Error('synthetic-foreign-port-marker')
        },
      })
    }
    const view = createLichtwaldLogView(fakeDom.root)
    view.render(createViewModel({ phase: 'empty', entries: [] }), actions)
    findButton(fakeDom.root, 'Neuen Eintrag erstellen').click()
    view.unmount()
    assert.equal(storageCalls, 0)
    assert.equal(foreignCalls, 0)
    assert.equal(consoleCalls, 0)
  } finally {
    fakeDom.restore()
    if (storageDescriptor) {
      Object.defineProperty(globalThis, 'localStorage', storageDescriptor)
    } else {
      delete globalThis.localStorage
    }
    for (const [name, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(console, name, descriptor)
      else delete console[name]
    }
  }
})

test('integriert echte View und echten Controller ohne zusätzlichen Load oder Direktzugriff', () => {
  const fakeDom = createFakeDom()
  const storageDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    'localStorage'
  )
  let storageGetterCalls = 0
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      storageGetterCalls += 1
      throw new Error('synthetic-integration-storage-marker')
    },
  })

  try {
    const initialEntry = createEntry({
      id: 'lichtwald-entry-controller-view-integration',
      title: 'Synthetischer Integrationstitel',
      text: 'Synthetischer Integrationstext.',
      tags: ['Integration', 'Alt'],
    })
    const nextValues = {
      calendarDate: initialEntry.calendarDate,
      title: 'Aktualisierter synthetischer Integrationstitel',
      text: 'Aktualisierter synthetischer Integrationstext.',
      tags: ['Integration', 'Neu'],
    }
    const updatedEntry = { id: initialEntry.id, ...nextValues }
    const initialLog = createPrivateLog([initialEntry])
    const updatedLog = createPrivateLog([structuredClone(updatedEntry)])
    const calls = { loadLog: 0, updateEntry: [] }
    let rootWasBusyDuringService = false
    const service = {
      loadLog() {
        calls.loadLog += 1
        return {
          ok: true,
          status: 'loaded',
          initialized: false,
          lichtwaldLog: structuredClone(initialLog),
        }
      },
      createEntry() {
        throw new Error('Nicht erwarteter synthetischer Create-Aufruf.')
      },
      updateEntry(entryId, values) {
        calls.updateEntry.push([entryId, structuredClone(values)])
        const form = findByClass(fakeDom.root, 'lichtwald-log-form')[0]
        rootWasBusyDuringService = (
          fakeDom.root.getAttribute('aria-busy') === 'true' &&
          form?.getAttribute('aria-busy') === 'true' &&
          findByTag(form, 'input')
            .concat(findByTag(form, 'textarea'))
            .every((control) => control.disabled)
        )
        assert.equal(
          fakeDom.root.textContent.includes(updatedEntry.title),
          false
        )
        return {
          ok: true,
          status: 'entryUpdated',
          changed: true,
          updatedEntry: structuredClone(updatedEntry),
          lichtwaldLog: updatedLog,
        }
      },
      deleteEntry() {
        throw new Error('Nicht erwarteter synthetischer Delete-Aufruf.')
      },
      setFeaturedEntry() {
        throw new Error('Nicht erwarteter synthetischer Fokus-Aufruf.')
      },
    }
    const scheduler = createManualScheduler()
    const view = createLichtwaldLogView(fakeDom.root)
    const controller = createLichtwaldLogController({
      lichtwaldLogService: service,
      lichtwaldLogView: view,
      scheduleTask: scheduler.scheduleTask,
    })

    controller.open()
    assert.equal(findByClass(fakeDom.root, 'lichtwald-log-state--loading').length, 1)
    assert.equal(calls.loadLog, 0)
    scheduler.run(0)
    assert.equal(calls.loadLog, 1)
    const card = findByClass(fakeDom.root, 'lichtwald-log-entry-card')[0]
    findButton(card, 'Eintrag öffnen').click()
    assert.ok(findByClass(fakeDom.root, 'lichtwald-log-detail')[0])
    assert.ok(fakeDom.root.textContent.includes(initialEntry.title))

    findButton(fakeDom.root, 'Eintrag bearbeiten').click()
    assert.equal(findControl(fakeDom.root, 'title').value, initialEntry.title)
    assert.equal(findControl(fakeDom.root, 'text').value, initialEntry.text)
    assert.deepEqual(
      findTagControls(fakeDom.root).map(({ value }) => value),
      initialEntry.tags
    )

    for (const [fieldName, value] of [
      ['title', nextValues.title],
      ['text', nextValues.text],
      ['tag-1', nextValues.tags[1]],
    ]) {
      const control = findControl(fakeDom.root, fieldName)
      control.value = value
      control.dispatchEvent({ type: 'input' })
    }
    findByTag(fakeDom.root, 'form')[0].dispatchEvent({ type: 'submit' })

    assert.equal(rootWasBusyDuringService, true)
    assert.deepEqual(calls.updateEntry, [[initialEntry.id, nextValues]])
    assertOwnKeys(calls.updateEntry[0][1], [
      'calendarDate',
      'title',
      'text',
      'tags',
    ])
    assert.equal(calls.loadLog, 1)
    assert.equal(findByClass(fakeDom.root, 'lichtwald-log-form').length, 0)
    assert.equal(findByClass(fakeDom.root, 'lichtwald-log-detail').length, 1)
    assert.ok(fakeDom.root.textContent.includes(updatedEntry.title))
    assert.ok(findRole(fakeDom.root, 'status').length >= 1)
    assert.equal(storageGetterCalls, 0)

    assert.equal(controller.close(), true)
    assert.equal(fakeDom.root.children.length, 0)
    assert.equal(fakeDom.root.hasAttribute('aria-busy'), false)
  } finally {
    fakeDom.restore()
    if (storageDescriptor) {
      Object.defineProperty(globalThis, 'localStorage', storageDescriptor)
    } else {
      delete globalThis.localStorage
    }
  }
})

test('Produktionsquelle verwendet nur Safe-DOM, Contractgrenzen und die zwölf Actions', () => {
  const source = readFileSync(
    new URL(
      '../src/modules/lichtwald-log/lichtwaldLogView.js',
      import.meta.url
    ),
    'utf8'
  )
  const usedActionNames = [...new Set(
    source.match(/\bon[A-Z][A-Za-z]+\b/g) ?? []
  )].filter((name) => name !== 'onClick').sort()

  assert.deepEqual(usedActionNames, [...ACTION_NAMES].sort())
  for (const constantName of [
    'LICHTWALD_LOG_TITLE_MAX_LENGTH',
    'LICHTWALD_LOG_TEXT_MAX_LENGTH',
    'LICHTWALD_LOG_MAX_TAG_COUNT',
    'LICHTWALD_LOG_TAG_MAX_LENGTH',
  ]) {
    assert.match(source, new RegExp(`\\b${constantName}\\b`))
  }
  assert.match(source, /from '.\/lichtwaldLogContract\.js'/)
  assert.doesNotMatch(
    source,
    /innerHTML|outerHTML|insertAdjacentHTML|DOMParser|document\.write|createContextualFragment/
  )
  assert.doesNotMatch(source, /\beval\s*\(|\bFunction\s*\(/)
  assert.doesNotMatch(
    source,
    /new\s+Date\s*\(|Date\.parse|Intl\.DateTimeFormat|\.sort\s*\(/
  )
  assert.doesNotMatch(source, /querySelector|querySelectorAll/)
  assert.doesNotMatch(
    source,
    /(?:globalThis|window)\.localStorage|fetch\s*\(|XMLHttpRequest|WebSocket/
  )
  assert.doesNotMatch(source, /console\.(?:log|warn|error|info|debug|trace)/)
  assert.doesNotMatch(source, /import\s+[']\.\/lichtwaldLog\.css[']/)
})

test('Modul-CSS kapselt sichere responsive, Fokus- und Reduced-Motion-Regeln', () => {
  const stylesheet = readFileSync(
    new URL(
      '../src/modules/lichtwald-log/lichtwaldLog.css',
      import.meta.url
    ),
    'utf8'
  )

  assert.match(stylesheet, /\.lichtwald-log\s*\{/)
  assert.match(stylesheet, /min-width:\s*0;/)
  assert.match(stylesheet, /minmax\(0,\s*1fr\)/)
  assert.match(stylesheet, /max-width:\s*100%;/)
  assert.match(stylesheet, /overflow-wrap:\s*anywhere;/)
  assert.match(stylesheet, /word-break:\s*break-word;/)
  assert.match(
    stylesheet,
    /\.lichtwald-log-detail__text\s*\{[^}]*white-space:\s*pre-wrap;/s
  )
  assert.match(stylesheet, /resize:\s*vertical;/)
  assert.match(stylesheet, /:focus-visible/)
  assert.match(stylesheet, /@media\s*\(max-width:\s*760px\)/)
  assert.match(stylesheet, /@media\s*\(max-width:\s*620px\)/)
  assert.match(stylesheet, /@media\s*\(max-width:\s*390px\)/)
  assert.match(stylesheet, /min-height:\s*44px;/)
  assert.match(
    stylesheet,
    /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*animation:\s*none;/
  )
  assert.doesNotMatch(stylesheet, /url\s*\(|@import/i)
})
