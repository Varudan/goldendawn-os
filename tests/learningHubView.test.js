import assert from 'node:assert/strict'
import test from 'node:test'

import { createLearningHubView } from '../src/modules/learning-hub/learningHubView.js'
import {
  createFakeDom,
  findByClass,
  findByTag,
} from './helpers/fakeDom.js'

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
      {
        id: 'module-orbit',
        title: 'Fiktive Orbitwerkstatt',
        position: 2,
        chapters: [
          {
            id: 'chapter-empty',
            title: 'Leeres Fantasiekapitel',
            position: 8,
            learningNodes: [],
          },
          {
            id: 'chapter-signals',
            title: 'Erfundene Signalmuster',
            position: 1,
            learningNodes: [
              {
                id: 'node-second',
                title: 'Zweiter synthetischer Puls',
                content: 'Frei erfundener zweiter Inhalt.',
                position: 7,
              },
              {
                id: 'node-first',
                title: 'Erster synthetischer Puls',
                content:
                  'Frei erfundener erster Inhalt mit\nmehreren Textzeilen.',
                position: 3,
              },
            ],
          },
        ],
      },
    ],
  }
}

function createViewState(overrides = {}) {
  return {
    phase: 'empty',
    hub: createEmptyHub(),
    selectedModuleId: null,
    expandedChapterIds: [],
    selectedLearningNodeId: null,
    form: null,
    statusMessage: '',
    errorMessage: '',
    focusTarget: null,
    ...overrides,
  }
}

function createFormState(type, overrides = {}) {
  return {
    type,
    moduleId: null,
    chapterId: null,
    learningNodeId: null,
    values: {},
    fieldErrors: {},
    errorMessage: '',
    isSubmitting: false,
    ...overrides,
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

function getHeadingText(root, className, tagName) {
  return findByClass(root, className).map((element) => {
    const heading = findByTag(element, tagName)[0]
    return heading?.textContent ?? ''
  })
}

function withLearningHubView(runTest) {
  const fakeDom = createFakeDom()

  try {
    const view = createLearningHubView(fakeDom.root)
    runTest({ ...fakeDom, view })
  } finally {
    fakeDom.restore()
  }
}

test('rendert Lade-, Fehler- und Leerzustand mit zugänglichen Rückmeldungen', () => {
  withLearningHubView(({ root, view }) => {
    view.render(createViewState({ phase: 'loading' }))

    assert.equal(root.getAttribute('aria-busy'), 'true')
    const loadingState = findByClass(
      root,
      'learning-hub-state--loading'
    )[0]
    assert.equal(loadingState.getAttribute('role'), 'status')
    assert.equal(loadingState.getAttribute('aria-live'), 'polite')
    view.unmount()
    assert.equal(root.hasAttribute('aria-busy'), false)

    let retryCalls = 0
    view.render(
      createViewState({
        phase: 'loadError',
        errorMessage: 'Kontrollierter synthetischer Ladefehler.',
      }),
      {
        onRetryLoad() {
          retryCalls += 1
        },
      }
    )
    const loadError = findByClass(
      root,
      'learning-hub-state--error'
    )[0]
    assert.equal(loadError.getAttribute('role'), 'alert')
    findButton(root, 'Erneut laden').click()
    assert.equal(retryCalls, 1)

    let createCalls = 0
    view.render(createViewState(), {
      onOpenCreateModuleForm() {
        createCalls += 1
      },
    })
    assert.ok(root.textContent.includes('Noch keine Lernmodule'))
    findButton(root, 'Neues Lernmodul erstellen').click()
    assert.equal(createCalls, 1)
  })
})

test('zeigt den sachlichen Datenschutzhinweis in allen LearningHub-Zuständen', () => {
  withLearningHubView(({ root, view }) => {
    const states = [
      createViewState({ phase: 'loading' }),
      createViewState({ phase: 'empty' }),
      createViewState({
        phase: 'loadError',
        errorMessage: 'Kontrollierter synthetischer Ladefehler.',
      }),
      createViewState({ phase: 'ready', hub: createHubFixture() }),
      createViewState({
        phase: 'mutating',
        hub: createHubFixture(),
        selectedModuleId: 'module-orbit',
      }),
      createViewState({
        phase: 'ready',
        hub: createHubFixture(),
        statusMessage: 'Lernmodul wurde lokal erstellt.',
      }),
    ]

    states.forEach((viewState) => {
      view.render(viewState)
      const privacyNotice = findByClass(root, 'learning-hub-privacy')[0]
      assert.ok(privacyNotice.textContent.includes('aktuellen Browserprofil'))
      assert.ok(privacyNotice.textContent.includes('Cloud-Sicherung'))
      assert.ok(
        privacyNotice.textContent.includes(
          'geräteübergreifende Synchronisierung'
        )
      )
      assert.ok(
        privacyNotice.textContent.includes('unverschlüsselte localStorage')
      )
      assert.ok(privacyNotice.textContent.includes('derselben Origin'))
    })
  })
})

test('sortiert mehrere Module stabil nach position und öffnet die richtige ID', () => {
  withLearningHubView(({ root, view }) => {
    const hub = createHubFixture()
    const snapshot = structuredClone(hub)
    const selectedIds = []

    view.render(
      createViewState({ phase: 'ready', hub }),
      {
        onSelectModule(moduleId) {
          selectedIds.push(moduleId)
        },
      }
    )

    const moduleCards = findByClass(root, 'learning-hub-module-card')
    assert.deepEqual(
      getHeadingText(root, 'learning-hub-module-card', 'h3'),
      ['Fiktive Orbitwerkstatt', 'Synthetischer Glasgarten']
    )
    assert.ok(moduleCards[0].textContent.includes('2 Kapitel'))
    assert.ok(moduleCards[1].textContent.includes('1 Kapitel'))

    findButton(moduleCards[0], 'Modul öffnen').click()
    findButton(moduleCards[1], 'Modul öffnen').click()
    assert.deepEqual(selectedIds, ['module-orbit', 'module-garden'])

    const headingIds = moduleCards.map(
      (card) => findByTag(card, 'h3')[0].id
    )
    assert.equal(new Set(headingIds).size, 2)
    assert.deepEqual(hub, snapshot)
  })
})

test('rendert Moduldetail und Accordion semantisch korrekt in Positionsreihenfolge', () => {
  withLearningHubView(({ root, view }) => {
    const toggleCalls = []
    const backCalls = []
    const renameCalls = []
    const addChapterCalls = []

    view.render(
      createViewState({
        phase: 'ready',
        hub: createHubFixture(),
        selectedModuleId: 'module-orbit',
      }),
      {
        onBackToOverview() {
          backCalls.push(true)
        },
        onToggleChapter(moduleId, chapterId) {
          toggleCalls.push([moduleId, chapterId])
        },
        onOpenRenameModuleForm(moduleId) {
          renameCalls.push(moduleId)
        },
        onOpenAddChapterForm(moduleId) {
          addChapterCalls.push(moduleId)
        },
      }
    )

    assert.ok(root.textContent.includes('Fiktive Orbitwerkstatt'))
    assert.equal(root.textContent.includes('Synthetischer Glasgarten'), false)
    const toggles = findByClass(root, 'learning-hub-chapter__toggle')
    assert.equal(toggles.length, 2)
    assert.ok(toggles[0].textContent.includes('Erfundene Signalmuster'))
    assert.ok(toggles[1].textContent.includes('Leeres Fantasiekapitel'))
    assert.ok(toggles[0].textContent.includes('2 LearningNodes'))
    assert.ok(toggles[1].textContent.includes('0 LearningNodes'))

    const toggleIds = new Set()
    toggles.forEach((toggle, index) => {
      assert.equal(toggle.getAttribute('aria-expanded'), 'false')
      assert.notEqual(toggle.id, '')
      assert.equal(toggleIds.has(toggle.id), false)
      toggleIds.add(toggle.id)
      const controlledPanelId = toggle.getAttribute('aria-controls')
      const panel = findByClass(root, 'learning-hub-chapter__panel')[index]
      assert.equal(controlledPanelId, panel.id)
      assert.equal(panel.getAttribute('aria-labelledby'), toggle.id)
      assert.equal(panel.hidden, true)
    })

    toggles[0].click()
    assert.deepEqual(toggleCalls, [['module-orbit', 'chapter-signals']])
    findButton(root, '← Zur Modulübersicht').click()
    findButton(root, 'Lernmodul umbenennen').click()
    findButton(root, 'Kapitel erstellen').click()
    assert.equal(backCalls.length, 1)
    assert.deepEqual(renameCalls, ['module-orbit'])
    assert.deepEqual(addChapterCalls, ['module-orbit'])

    assert.equal(findByTag(root, 'input').length, 0)
    assert.equal(/\d+\s*%/.test(root.textContent), false)
    assert.ok(
      root.textContent.includes(
        'Kapitelabschluss und Modulfortschritt werden in einem nächsten LearningHub-Schritt ergänzt.'
      )
    )

    view.render(
      createViewState({
        phase: 'ready',
        hub: createHubFixture(),
        selectedModuleId: 'module-orbit',
        expandedChapterIds: ['chapter-signals'],
      })
    )
    const expandedToggles = findByClass(
      root,
      'learning-hub-chapter__toggle'
    )
    const expandedPanels = findByClass(
      root,
      'learning-hub-chapter__panel'
    )
    assert.equal(expandedToggles[0].getAttribute('aria-expanded'), 'true')
    assert.equal(expandedPanels[0].hidden, false)
    assert.equal(
      expandedToggles[0].getAttribute('aria-controls'),
      expandedPanels[0].id
    )
    assert.equal(
      expandedPanels[0].getAttribute('aria-labelledby'),
      expandedToggles[0].id
    )
    assert.equal(expandedToggles[1].getAttribute('aria-expanded'), 'false')
    assert.equal(expandedPanels[1].hidden, true)
  })
})

test('zeigt leere Kapitel und mehrere Nodes mit richtiger Auswahl- und Aktionsverdrahtung', () => {
  withLearningHubView(({ root, view }) => {
    const actionCalls = {
      select: [],
      edit: [],
      add: [],
      renameChapter: [],
    }

    view.render(
      createViewState({
        phase: 'ready',
        hub: createHubFixture(),
        selectedModuleId: 'module-orbit',
        expandedChapterIds: ['chapter-signals', 'chapter-empty'],
        selectedLearningNodeId: 'node-first',
      }),
      {
        onSelectLearningNode(...identifiers) {
          actionCalls.select.push(identifiers)
        },
        onOpenUpdateLearningNodeForm(...identifiers) {
          actionCalls.edit.push(identifiers)
        },
        onOpenAddLearningNodeForm(...identifiers) {
          actionCalls.add.push(identifiers)
        },
        onOpenRenameChapterForm(...identifiers) {
          actionCalls.renameChapter.push(identifiers)
        },
      }
    )

    const panels = findByClass(root, 'learning-hub-chapter__panel')
    assert.ok(panels.every((panel) => panel.hidden === false))
    assert.ok(root.textContent.includes('Noch keine LearningNodes'))
    assert.ok(root.textContent.includes('Ersten LearningNode erstellen'))
    const chapterTitles = findByClass(root, 'learning-hub-chapter__title')
    const renameChapterButtons = findByTag(root, 'button').filter(
      (button) => button.textContent === 'Kapitel umbenennen'
    )
    const createNodeButtons = findByTag(root, 'button').filter((button) =>
      ['LearningNode erstellen', 'Ersten LearningNode erstellen'].includes(
        button.textContent
      )
    )
    chapterTitles.forEach((chapterTitle, index) => {
      assert.equal(
        renameChapterButtons[index].getAttribute('aria-describedby'),
        chapterTitle.id
      )
      assert.equal(
        createNodeButtons[index].getAttribute('aria-describedby'),
        chapterTitle.id
      )
    })

    const nodeCards = findByClass(root, 'learning-hub-node-card')
    assert.equal(nodeCards.length, 2)
    assert.ok(nodeCards[0].textContent.includes('Erster synthetischer Puls'))
    assert.ok(nodeCards[1].textContent.includes('Zweiter synthetischer Puls'))
    assert.equal(nodeCards[0].getAttribute('aria-current'), 'true')
    assert.ok(nodeCards[0].textContent.includes('Ausgewählt'))

    const selectedDetail = findByClass(root, 'learning-hub-node-detail')[0]
    assert.ok(
      selectedDetail.textContent.includes(
        'Frei erfundener erster Inhalt mit\nmehreren Textzeilen.'
      )
    )

    findButton(nodeCards[1], 'LearningNode auswählen').click()
    findButton(nodeCards[1], 'LearningNode bearbeiten').click()
    createNodeButtons.forEach((button) => button.click())
    findButton(root, 'Kapitel umbenennen').click()

    assert.deepEqual(actionCalls.select, [
      ['module-orbit', 'chapter-signals', 'node-second'],
    ])
    assert.deepEqual(actionCalls.edit, [
      ['module-orbit', 'chapter-signals', 'node-second'],
    ])
    assert.deepEqual(actionCalls.add, [
      ['module-orbit', 'chapter-signals'],
      ['module-orbit', 'chapter-empty'],
    ])
    assert.deepEqual(actionCalls.renameChapter, [
      ['module-orbit', 'chapter-signals'],
    ])
  })
})

test('Create-Formular besitzt Labels, Hilfen, Grenzen und reicht aktuelle Werte weiter', () => {
  withLearningHubView(({ document, root, view }) => {
    const updates = []
    const submissions = []
    let cancelCalls = 0
    const formState = createFormState('createModule', {
      values: { title: '', firstChapterTitle: '' },
    })

    view.render(
      createViewState({
        phase: 'empty',
        form: formState,
        focusTarget: { type: 'formField', fieldName: 'title' },
      }),
      {
        onUpdateFormField(name, value) {
          updates.push([name, value])
        },
        onSubmitForm(submission) {
          submissions.push(submission)
        },
        onCancelForm() {
          cancelCalls += 1
        },
      }
    )

    const title = findControl(root, 'title')
    const firstChapterTitle = findControl(root, 'firstChapterTitle')
    assert.equal(document.activeElement, title)
    assert.equal(title.required, true)
    assert.equal(title.maxLength, 120)
    assert.equal(title.getAttribute('maxlength'), '120')
    assert.equal(title.getAttribute('autocomplete'), 'off')
    assert.equal(firstChapterTitle.required, true)
    assert.equal(firstChapterTitle.maxLength, 120)
    assert.equal(firstChapterTitle.getAttribute('autocomplete'), 'off')

    const labels = findByTag(root, 'label')
    assert.deepEqual(
      labels.map((label) => label.getAttribute('for')),
      [title.id, firstChapterTitle.id]
    )

    title.value = 'Fiktives Modul'
    title.dispatchEvent({ type: 'input' })
    firstChapterTitle.value = 'Fiktives Startkapitel'
    firstChapterTitle.dispatchEvent({ type: 'input' })
    assert.deepEqual(updates, [
      ['title', 'Fiktives Modul'],
      ['firstChapterTitle', 'Fiktives Startkapitel'],
    ])

    const form = findByTag(root, 'form')[0]
    assert.equal(form.getAttribute('autocomplete'), 'off')
    assert.equal(form.dispatchEvent({ type: 'submit' }), false)
    assert.deepEqual(submissions, [
      {
        type: 'createModule',
        title: 'Fiktives Modul',
        firstChapterTitle: 'Fiktives Startkapitel',
      },
    ])
    findButton(root, 'Abbrechen').click()
    assert.equal(cancelCalls, 1)

    view.render(
      createViewState({
        focusTarget: {
          type: 'formTrigger',
          formType: 'createModule',
          moduleId: null,
          chapterId: null,
          learningNodeId: null,
        },
      })
    )
    assert.equal(
      document.activeElement,
      findButton(root, 'Neues Lernmodul erstellen')
    )
  })
})

test('stellt den Fokus nach Abbruch für alle sechs Formtypen auf den richtigen Auslöser zurück', () => {
  withLearningHubView(({ document, root, view }) => {
    const hub = createHubFixture()
    const detailState = {
      phase: 'ready',
      hub,
      selectedModuleId: 'module-orbit',
    }
    const cases = [
      {
        focusTarget: {
          type: 'formTrigger',
          formType: 'createModule',
          moduleId: null,
          chapterId: null,
          learningNodeId: null,
        },
        viewState: createViewState({ phase: 'ready', hub }),
        findTrigger: () => findButton(root, 'Neues Lernmodul erstellen'),
      },
      {
        focusTarget: {
          type: 'formTrigger',
          formType: 'renameModule',
          moduleId: 'module-orbit',
          chapterId: null,
          learningNodeId: null,
        },
        viewState: createViewState(detailState),
        findTrigger: () => findButton(root, 'Lernmodul umbenennen'),
      },
      {
        focusTarget: {
          type: 'formTrigger',
          formType: 'addChapter',
          moduleId: 'module-orbit',
          chapterId: null,
          learningNodeId: null,
        },
        viewState: createViewState(detailState),
        findTrigger: () => findButton(root, 'Kapitel erstellen'),
      },
      {
        focusTarget: {
          type: 'formTrigger',
          formType: 'renameChapter',
          moduleId: 'module-orbit',
          chapterId: 'chapter-signals',
          learningNodeId: null,
        },
        viewState: createViewState(detailState),
        findTrigger: () => findButton(
          findByClass(root, 'learning-hub-chapter')[0],
          'Kapitel umbenennen'
        ),
      },
      {
        focusTarget: {
          type: 'formTrigger',
          formType: 'addLearningNode',
          moduleId: 'module-orbit',
          chapterId: 'chapter-signals',
          learningNodeId: null,
        },
        viewState: createViewState({
          ...detailState,
          expandedChapterIds: ['chapter-signals'],
        }),
        findTrigger: () => findButton(
          findByClass(root, 'learning-hub-chapter')[0],
          'LearningNode erstellen'
        ),
      },
      {
        focusTarget: {
          type: 'formTrigger',
          formType: 'updateLearningNode',
          moduleId: 'module-orbit',
          chapterId: 'chapter-signals',
          learningNodeId: 'node-first',
        },
        viewState: createViewState({
          ...detailState,
          expandedChapterIds: ['chapter-signals'],
          selectedLearningNodeId: 'node-first',
        }),
        findTrigger: () => findButton(
          findByClass(root, 'learning-hub-node-card')[0],
          'LearningNode bearbeiten'
        ),
      },
    ]

    cases.forEach((focusCase) => {
      view.render({
        ...focusCase.viewState,
        focusTarget: focusCase.focusTarget,
      })
      const expectedTrigger = focusCase.findTrigger()
      assert.ok(expectedTrigger)
      assert.equal(document.activeElement, expectedTrigger)
    })
  })
})

test('Node-Formular reicht Ziel-IDs und Textwerte korrekt weiter', () => {
  withLearningHubView(({ root, view }) => {
    const submissions = []
    const formState = createFormState('updateLearningNode', {
      moduleId: 'module-orbit',
      chapterId: 'chapter-signals',
      learningNodeId: 'node-first',
      values: {
        title: 'Erster synthetischer Puls',
        content: 'Frei erfundener erster Inhalt.',
      },
    })

    view.render(
      createViewState({
        phase: 'ready',
        hub: createHubFixture(),
        selectedModuleId: 'module-orbit',
        expandedChapterIds: ['chapter-signals'],
        selectedLearningNodeId: 'node-first',
        form: formState,
      }),
      {
        onSubmitForm(submission) {
          submissions.push(submission)
        },
      }
    )

    const title = findControl(root, 'title')
    const content = findControl(root, 'content')
    assert.equal(content.tagName, 'TEXTAREA')
    assert.equal(content.required, true)
    assert.equal(content.maxLength, 10000)
    assert.equal(content.getAttribute('autocomplete'), 'off')
    assert.equal(content.rows, 10)
    title.value = 'Aktualisierter Fantasiepuls'
    content.value = 'Aktualisierter frei erfundener Text.'
    findByTag(root, 'form')[0].dispatchEvent({ type: 'submit' })

    assert.deepEqual(submissions, [
      {
        type: 'updateLearningNode',
        moduleId: 'module-orbit',
        chapterId: 'chapter-signals',
        learningNodeId: 'node-first',
        title: 'Aktualisierter Fantasiepuls',
        content: 'Aktualisierter frei erfundener Text.',
      },
    ])
  })
})

test('alle sechs Formulartypen werden nur im passenden UI-Kontext gerendert', () => {
  withLearningHubView(({ root, view }) => {
    const hub = createHubFixture()
    const cases = [
      {
        type: 'createModule',
        selectedModuleId: null,
        expandedChapterIds: [],
        values: { title: '', firstChapterTitle: '' },
        heading: 'Neues Lernmodul erstellen',
      },
      {
        type: 'renameModule',
        selectedModuleId: 'module-orbit',
        moduleId: 'module-orbit',
        expandedChapterIds: [],
        values: { title: 'Fiktive Orbitwerkstatt' },
        heading: 'Lernmodul umbenennen',
      },
      {
        type: 'addChapter',
        selectedModuleId: 'module-orbit',
        moduleId: 'module-orbit',
        expandedChapterIds: [],
        values: { title: '' },
        heading: 'Neues Kapitel erstellen',
      },
      {
        type: 'renameChapter',
        selectedModuleId: 'module-orbit',
        moduleId: 'module-orbit',
        chapterId: 'chapter-signals',
        expandedChapterIds: [],
        values: { title: 'Erfundene Signalmuster' },
        heading: 'Kapitel umbenennen',
      },
      {
        type: 'addLearningNode',
        selectedModuleId: 'module-orbit',
        moduleId: 'module-orbit',
        chapterId: 'chapter-signals',
        expandedChapterIds: ['chapter-signals'],
        values: { title: '', content: '' },
        heading: 'Neuen LearningNode erstellen',
      },
      {
        type: 'updateLearningNode',
        selectedModuleId: 'module-orbit',
        moduleId: 'module-orbit',
        chapterId: 'chapter-signals',
        learningNodeId: 'node-first',
        expandedChapterIds: ['chapter-signals'],
        values: {
          title: 'Erster synthetischer Puls',
          content: 'Frei erfundener erster Inhalt.',
        },
        heading: 'LearningNode bearbeiten',
      },
    ]

    cases.forEach((formCase) => {
      const submissions = []
      view.render(
        createViewState({
          phase: hub.modules.length > 0 ? 'ready' : 'empty',
          hub,
          selectedModuleId: formCase.selectedModuleId,
          expandedChapterIds: formCase.expandedChapterIds,
          form: createFormState(formCase.type, {
            moduleId: formCase.moduleId ?? null,
            chapterId: formCase.chapterId ?? null,
            learningNodeId: formCase.learningNodeId ?? null,
            values: formCase.values,
          }),
        }),
        {
          onSubmitForm(submission) {
            submissions.push(submission)
          },
        }
      )

      assert.equal(findByTag(root, 'form').length, 1)
      assert.ok(root.textContent.includes(formCase.heading))
      const expectedHeadingTag = [
        'renameChapter',
        'addLearningNode',
        'updateLearningNode',
      ].includes(formCase.type)
        ? 'h4'
        : 'h3'
      assert.ok(
        findByTag(root, expectedHeadingTag).some(
          (heading) => heading.textContent === formCase.heading
        )
      )
      Object.keys(formCase.values).forEach((fieldName) => {
        const control = findControl(root, fieldName)
        assert.equal(control.required, true)
        assert.equal(
          control.maxLength,
          fieldName === 'content' ? 10000 : 120
        )
      })
      findByTag(root, 'form')[0].dispatchEvent({ type: 'submit' })

      const expectedSubmission = { type: formCase.type }
      for (const identifier of [
        'moduleId',
        'chapterId',
        'learningNodeId',
      ]) {
        if (formCase[identifier]) {
          expectedSubmission[identifier] = formCase[identifier]
        }
      }
      Object.assign(expectedSubmission, formCase.values)
      assert.deepEqual(submissions, [expectedSubmission])
    })
  })
})

test('zeigt Formularfehler, Mutation und Erfolg über zugängliche Zustände mit Fokusführung', () => {
  withLearningHubView(({ document, root, view }) => {
    const errorForm = createFormState('addChapter', {
      moduleId: 'module-orbit',
      values: { title: 'Fehlerhafter Fantasieentwurf' },
      fieldErrors: { title: 'Bitte gib einen gültigen Titel ein.' },
      errorMessage: 'Bitte korrigiere die markierten Felder.',
    })

    view.render(
      createViewState({
        phase: 'ready',
        hub: createHubFixture(),
        selectedModuleId: 'module-orbit',
        form: errorForm,
        focusTarget: { type: 'formField', fieldName: 'title' },
      })
    )
    const title = findControl(root, 'title')
    assert.equal(title.getAttribute('aria-invalid'), 'true')
    assert.ok(title.getAttribute('aria-describedby').includes('-error'))
    assert.equal(document.activeElement, title)
    const formAlert = findByClass(root, 'learning-hub-form__error')[0]
    assert.equal(formAlert.getAttribute('role'), 'alert')

    let blockedSubmissions = 0
    view.render(
      createViewState({
        phase: 'mutating',
        hub: createHubFixture(),
        selectedModuleId: 'module-orbit',
        form: {
          ...errorForm,
          fieldErrors: {},
          errorMessage: '',
          isSubmitting: true,
        },
      }),
      {
        onSubmitForm() {
          blockedSubmissions += 1
        },
      }
    )
    assert.equal(root.getAttribute('aria-busy'), 'true')
    const submittingForm = findByTag(root, 'form')[0]
    assert.equal(submittingForm.getAttribute('aria-busy'), 'true')
    assert.ok(
      findByTag(submittingForm, 'input')
        .concat(findByTag(submittingForm, 'textarea'))
        .every((control) => control.disabled)
    )
    assert.ok(
      findByTag(submittingForm, 'button')
        .filter((button) =>
          ['Abbrechen', 'Wird gespeichert …'].includes(button.textContent)
        )
        .every((button) => button.disabled)
    )
    submittingForm.dispatchEvent({ type: 'submit' })
    assert.equal(blockedSubmissions, 0)

    view.render(
      createViewState({
        phase: 'ready',
        hub: createHubFixture(),
        selectedModuleId: 'module-orbit',
        focusTarget: {
          type: 'formTrigger',
          formType: 'addChapter',
          moduleId: 'module-orbit',
          chapterId: null,
          learningNodeId: null,
        },
      })
    )
    assert.equal(document.activeElement, findButton(root, 'Kapitel erstellen'))

    view.render(
      createViewState({
        phase: 'ready',
        hub: createHubFixture(),
        statusMessage: 'Kapitel wurde lokal erstellt.',
        focusTarget: { type: 'status' },
      })
    )
    const status = findByClass(
      root,
      'learning-hub-feedback--success'
    )[0]
    assert.equal(status.getAttribute('role'), 'status')
    assert.equal(status.getAttribute('aria-live'), 'polite')
    assert.equal(document.activeElement, status)
  })
})

test('HTML-artige private Eingaben bleiben auf allen Ebenen sichtbarer Text', () => {
  withLearningHubView(({ root, view }) => {
    const moduleTitle = '<script>alert(1)</script>'
    const chapterTitle = '<img src=x onerror=alert(2)>'
    const nodeTitle = '<strong>Nur Text</strong>'
    const nodeContent =
      '<img src=x onerror=alert(3)>\n<script>alert(4)</script>'
    const hub = createHubFixture()
    const learningModule = hub.modules.find(
      (module) => module.id === 'module-orbit'
    )
    const chapter = learningModule.chapters.find(
      (entry) => entry.id === 'chapter-signals'
    )
    learningModule.title = moduleTitle
    chapter.title = chapterTitle
    chapter.learningNodes[0].title = nodeTitle
    chapter.learningNodes[0].content = nodeContent

    view.render(
      createViewState({
        phase: 'ready',
        hub,
        selectedModuleId: 'module-orbit',
        expandedChapterIds: ['chapter-signals'],
        selectedLearningNodeId: chapter.learningNodes[0].id,
      })
    )

    for (const privateText of [
      moduleTitle,
      chapterTitle,
      nodeTitle,
      nodeContent,
    ]) {
      assert.ok(root.textContent.includes(privateText))
    }

    assert.equal(findByTag(root, 'script').length, 0)
    assert.equal(findByTag(root, 'img').length, 0)
    assert.equal(findByTag(root, 'strong').some(
      (element) => element.textContent === 'Nur Text'
    ), false)
  })
})

test('unmount entfernt den transienten Root-Status idempotent', () => {
  withLearningHubView(({ root, view }) => {
    view.render(createViewState({ phase: 'loading' }))
    assert.equal(root.getAttribute('aria-busy'), 'true')

    view.unmount()
    assert.equal(root.hasAttribute('aria-busy'), false)

    view.unmount()
    assert.equal(root.hasAttribute('aria-busy'), false)
  })
})

test('wiederholtes Rendern registriert keine mehrfach wirksamen Handler', () => {
  withLearningHubView(({ root, view }) => {
    let firstCreateCalls = 0
    let currentCreateCalls = 0
    const state = createViewState()

    view.render(state, {
      onOpenCreateModuleForm() {
        firstCreateCalls += 1
      },
    })
    view.render(state, {
      onOpenCreateModuleForm() {
        currentCreateCalls += 1
      },
    })
    view.render(state, {
      onOpenCreateModuleForm() {
        currentCreateCalls += 1
      },
    })

    const currentButton = findButton(root, 'Neues Lernmodul erstellen')
    assert.equal(currentButton.eventListeners.get('click').length, 1)
    currentButton.click()
    assert.equal(firstCreateCalls, 0)
    assert.equal(currentCreateCalls, 1)

    let oldSubmitCalls = 0
    let currentSubmitCalls = 0
    const formState = createViewState({
      form: createFormState('createModule', {
        values: { title: 'Modul', firstChapterTitle: 'Kapitel' },
      }),
    })
    view.render(formState, {
      onSubmitForm() {
        oldSubmitCalls += 1
      },
    })
    view.render(formState, {
      onSubmitForm() {
        currentSubmitCalls += 1
      },
    })
    const currentForm = findByTag(root, 'form')[0]
    assert.equal(currentForm.eventListeners.get('submit').length, 1)
    currentForm.dispatchEvent({ type: 'submit' })
    assert.equal(oldSubmitCalls, 0)
    assert.equal(currentSubmitCalls, 1)
  })
})
