import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { createLearningHubView } from '../src/modules/learning-hub/learningHubView.js'
import {
  createFakeDom,
  findAll,
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

function createProgressProjection(hub, completedChapterIds = []) {
  const completedIds = new Set(completedChapterIds)

  return hub.modules.map((learningModule) => {
    const chapters = learningModule.chapters.map((chapter) => ({
      chapterId: chapter.id,
      isCompleted: completedIds.has(chapter.id),
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
        totalChapterCount > 0 && completedChapterCount === totalChapterCount,
      chapters,
    }
  })
}

function createProgressState(hub, overrides = {}) {
  return {
    phase: 'ready',
    projection: createProgressProjection(hub),
    errorMessage: '',
    mutatingChapterId: null,
    ...overrides,
  }
}

function createArtifactState(overrides = {}) {
  return {
    phase: 'ready',
    values: {
      note: null,
      summary: null,
    },
    activeType: null,
    mode: 'view',
    draft: '',
    dirty: false,
    fieldError: '',
    errorMessage: '',
    statusMessage: '',
    feedbackType: null,
    mutatingType: null,
    interactionDisabled: false,
    ...overrides,
  }
}

function createTestsState(overrides = {}) {
  return {
    bank: {
      phase: 'ready',
      questions: [],
      totalQuestionCount: 0,
      errorMessage: '',
      statusMessage: '',
      ...overrides.bank,
    },
    editor: overrides.editor ?? null,
    runner: {
      phase: 'idle',
      questionCount: 0,
      testSession: null,
      answers: {},
      retryPending: false,
      errorMessage: '',
      statusMessage: '',
      cancelConfirmation: false,
      result: null,
      ...overrides.runner,
    },
    history: {
      phase: 'ready',
      attempts: [],
      errorMessage: '',
      ...overrides.history,
    },
  }
}

function createAuthorQuestionFixture(overrides = {}) {
  return {
    id: 'question-synthetic-one',
    prompt: 'Welche erfundene Farbe markiert den Nordbogen?',
    difficulty: 'easy',
    explanation: 'Im synthetischen Beispiel markiert Blau den Nordbogen.',
    options: [
      {
        id: 'option-synthetic-blue',
        label: 'Blau',
        isCorrect: true,
      },
      {
        id: 'option-synthetic-gold',
        label: 'Gold',
        isCorrect: false,
      },
    ],
    ...overrides,
  }
}

function createPublicTestSession(overrides = {}) {
  return {
    id: 'session-synthetic-one',
    moduleId: 'module-orbit',
    startedAt: '2026-07-20T08:00:00.000Z',
    questions: [
      {
        id: 'question-public-one',
        learningNodeId: 'node-first',
        type: 'singleChoice',
        prompt: 'Welche erfundene Form öffnet das Nordtor?',
        difficulty: 'medium',
        options: [
          { id: 'option-public-circle', label: 'Kreis' },
          { id: 'option-public-star', label: 'Stern' },
        ],
      },
      {
        id: 'question-public-two',
        learningNodeId: 'node-second',
        type: 'singleChoice',
        prompt: 'Welches Fantasiesignal beendet die Runde?',
        difficulty: 'hard',
        options: [
          { id: 'option-public-bell', label: 'Glocke' },
          { id: 'option-public-wave', label: 'Welle' },
        ],
      },
    ],
    ...overrides,
  }
}

function createCompletedTestResult(overrides = {}) {
  return {
    completedAt: '2026-07-20T08:05:00.000Z',
    totalQuestionCount: 1,
    correctAnswerCount: 1,
    scorePercent: 100,
    questions: [
      {
        prompt: 'Welche erfundene Form öffnet das Nordtor?',
        options: [
          { label: 'Kreis', isSelected: true, isCorrect: true },
          { label: 'Stern', isSelected: false, isCorrect: false },
        ],
        isCorrect: true,
        explanation: 'Im synthetischen Beispiel ist der Kreis korrekt.',
      },
    ],
    ...overrides,
  }
}

function createViewState(overrides = {}) {
  const hub = overrides.hub ?? createEmptyHub()

  return {
    phase: 'empty',
    hub,
    selectedModuleId: null,
    expandedChapterIds: [],
    selectedLearningNodeId: null,
    form: null,
    progress: createProgressState(hub),
    artifacts: createArtifactState(),
    tests: createTestsState(),
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

function findCompletionCheckboxes(root) {
  return findByTag(root, 'input').filter(
    (input) => input.type === 'checkbox'
  )
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

function createSelectedArtifactViewState(artifactOverrides = {}) {
  const hub = createHubFixture()
  return createViewState({
    phase: 'ready',
    hub,
    selectedModuleId: 'module-orbit',
    expandedChapterIds: ['chapter-signals'],
    selectedLearningNodeId: 'node-first',
    artifacts: createArtifactState(artifactOverrides),
  })
}

function createSelectedTestViewState(testOverrides = {}) {
  const hub = createHubFixture()
  return createViewState({
    phase: 'ready',
    hub,
    selectedModuleId: 'module-orbit',
    expandedChapterIds: ['chapter-signals'],
    selectedLearningNodeId: 'node-first',
    tests: createTestsState(testOverrides),
  })
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
        progress: createProgressState(createEmptyHub(), {
          phase: 'loading',
        }),
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
    assert.equal(root.getAttribute('aria-busy'), 'false')
    assert.equal(
      findByClass(root, 'learning-hub-progress-feedback').length,
      0
    )
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
      assert.ok(privacyNotice.textContent.includes('Inhalte und dein Fortschritt'))
      assert.ok(
        privacyNotice.textContent.includes('Notizen und Zusammenfassungen')
      )
      assert.ok(privacyNotice.textContent.includes('Testfragen'))
      assert.ok(privacyNotice.textContent.includes('abgeschlossenen Versuche'))
      assert.ok(privacyNotice.textContent.includes('aktuellen Browserprofil'))
      assert.ok(privacyNotice.textContent.includes('Cloud-Sicherung'))
      assert.ok(
        privacyNotice.textContent.includes(
          'geräteübergreifende Synchronisierung'
        )
      )
      assert.ok(privacyNotice.textContent.includes('localStorage ist unverschlüsselt'))
      assert.ok(privacyNotice.textContent.includes('derselben Origin'))
      assert.ok(privacyNotice.textContent.includes('nur im Arbeitsspeicher'))
      assert.ok(privacyNotice.textContent.includes('bei einem Reload verloren'))
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

test('zeigt 0 Prozent, Teilfortschritt und 100 Prozent nach Modul-IDs ohne abgeschlossene Module auszublenden', () => {
  withLearningHubView(({ root, view }) => {
    const hub = createHubFixture()
    hub.modules.push({
      id: 'module-zero',
      title: 'Erfundene Nullpunktwerkstatt',
      position: 1,
      chapters: [
        {
          id: 'chapter-zero',
          title: 'Synthetischer Anfang',
          position: 1,
          learningNodes: [],
        },
      ],
    })
    const projection = createProgressProjection(hub, [
      'chapter-signals',
      'chapter-facets',
    ]).reverse()
    const selectedIds = []

    view.render(
      createViewState({
        phase: 'ready',
        hub,
        progress: createProgressState(hub, { projection }),
      }),
      {
        onSelectModule(moduleId) {
          selectedIds.push(moduleId)
        },
      }
    )

    const moduleCards = findByClass(root, 'learning-hub-module-card')
    assert.equal(moduleCards.length, 3)
    assert.ok(
      moduleCards[0].textContent.includes(
        '0 von 1 Kapiteln abgeschlossen · 0 %'
      )
    )
    assert.ok(
      moduleCards[1].textContent.includes(
        '1 von 2 Kapiteln abgeschlossen · 50 %'
      )
    )
    assert.ok(
      moduleCards[2].textContent.includes(
        '1 von 1 Kapiteln abgeschlossen · 100 %'
      )
    )
    assert.ok(moduleCards[2].textContent.includes('Modul abgeschlossen'))
    const completedModuleButton = findButton(moduleCards[2], 'Modul öffnen')
    assert.equal(completedModuleButton.disabled, false)
    completedModuleButton.click()
    assert.deepEqual(selectedIds, ['module-garden'])
  })
})

test('rendert Detailfortschritt und Kapitelstatus mit exakten ARIA-Werten aus der Projektion', () => {
  withLearningHubView(({ root, view }) => {
    const hub = createHubFixture()
    const learningModule = hub.modules.find(
      (module) => module.id === 'module-orbit'
    )
    learningModule.chapters.push({
      id: 'chapter-between',
      title: 'Fiktives Zwischenkapitel',
      position: 5,
      learningNodes: [],
    })
    const projection = createProgressProjection(hub, [
      'chapter-signals',
      'chapter-empty',
    ]).reverse()

    view.render(
      createViewState({
        phase: 'ready',
        hub,
        selectedModuleId: learningModule.id,
        progress: createProgressState(hub, { projection }),
      })
    )

    assert.ok(
      root.textContent.includes(
        '2 von 3 Kapiteln abgeschlossen · 67 %'
      )
    )
    const progressBar = findByTag(root, 'div').find(
      (element) => element.getAttribute('role') === 'progressbar'
    )
    assert.ok(progressBar)
    assert.equal(
      progressBar.getAttribute('aria-labelledby'),
      'learning-hub-module-progress-label learning-hub-module-heading'
    )
    assert.equal(progressBar.getAttribute('aria-valuemin'), '0')
    assert.equal(progressBar.getAttribute('aria-valuemax'), '3')
    assert.equal(progressBar.getAttribute('aria-valuenow'), '2')
    assert.equal(
      progressBar.getAttribute('aria-valuetext'),
      '2 von 3 Kapiteln abgeschlossen, 67 Prozent'
    )
    assert.equal(
      findByClass(progressBar, 'learning-hub-progress-bar__value')[0]
        .getAttribute('style'),
      'width: 67%'
    )

    const checkboxes = findCompletionCheckboxes(root)
    assert.deepEqual(
      checkboxes.map((checkbox) => checkbox.checked),
      [true, false, true]
    )
    assert.ok(checkboxes.every((checkbox) => !checkbox.indeterminate))
  })
})

test('rendert beide gültigen Rundungsgrenzen ohne falschen Modulabschluss', () => {
  withLearningHubView(({ root, view }) => {
    const hub = createRoundingHub([201, 200])
    const completedChapterIds = [
      hub.modules[0].chapters[0].id,
      ...hub.modules[1].chapters.slice(0, 199).map((chapter) => chapter.id),
    ]
    const projection = createProgressProjection(hub, completedChapterIds)

    view.render(
      createViewState({
        phase: 'ready',
        hub,
        progress: createProgressState(hub, { projection }),
      })
    )

    const moduleCards = findByClass(root, 'learning-hub-module-card')
    assert.equal(moduleCards.length, 2)
    assert.ok(
      moduleCards[0].textContent.includes(
        '1 von 201 Kapiteln abgeschlossen · 0 %'
      )
    )
    assert.ok(
      moduleCards[1].textContent.includes(
        '199 von 200 Kapiteln abgeschlossen · 100 %'
      )
    )
    assert.ok(
      moduleCards.every(
        (moduleCard) => !moduleCard.textContent.includes('Modul abgeschlossen')
      )
    )
  })
})

test('verdrahtet native Kapitel-Checkbox genau einmal außerhalb des Accordion-Toggles', () => {
  withLearningHubView(({ root, view }) => {
    const hub = createHubFixture()
    const progress = createProgressState(hub, {
      projection: createProgressProjection(hub, ['chapter-signals']),
    })
    const completionCalls = []
    const accordionCalls = []

    view.render(
      createViewState({
        phase: 'ready',
        hub,
        selectedModuleId: 'module-orbit',
        progress,
      }),
      {
        onToggleChapterCompletion(moduleId, chapterId) {
          completionCalls.push([moduleId, chapterId])
        },
        onToggleChapter(moduleId, chapterId) {
          accordionCalls.push([moduleId, chapterId])
        },
      }
    )

    const chapters = findByClass(root, 'learning-hub-chapter')
    const firstHeading = findByTag(chapters[0], 'h3')[0]
    const toggle = findByClass(
      firstHeading,
      'learning-hub-chapter__toggle'
    )[0]
    const checkbox = findCompletionCheckboxes(chapters[0])[0]
    const label = findByTag(chapters[0], 'label').find(
      (entry) => entry.textContent === 'Kapitel abgeschlossen'
    )
    const visibleTitle = findByClass(
      chapters[0],
      'learning-hub-chapter__title'
    )[0]

    assert.equal(firstHeading.childElementCount, 1)
    assert.equal(firstHeading.children[0], toggle)
    assert.equal(label.getAttribute('for'), checkbox.id)
    assert.equal(checkbox.getAttribute('aria-describedby'), visibleTitle.id)
    assert.equal(checkbox.eventListeners.get('change').length, 1)
    checkbox.checked = false
    checkbox.dispatchEvent({ type: 'change' })
    assert.deepEqual(completionCalls, [
      ['module-orbit', 'chapter-signals'],
    ])
    assert.deepEqual(accordionCalls, [])
    assert.equal(toggle.getAttribute('aria-expanded'), 'false')
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

    assert.equal(findCompletionCheckboxes(root).length, 2)
    assert.ok(root.textContent.includes('0 von 2 Kapiteln abgeschlossen · 0 %'))
    assert.equal(
      root.textContent.includes(
        'Kapitelabschluss und Modulfortschritt werden in einem nächsten LearningHub-Schritt ergänzt.'
      ),
      false
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

test('kennzeichnet Lade-, Fehler- und veraltete Progresszustände ohne falsche Nullwerte und bietet gezielten Retry', () => {
  withLearningHubView(({ root, view }) => {
    const hub = createHubFixture()
    const baseState = {
      phase: 'ready',
      hub,
      selectedModuleId: 'module-orbit',
    }

    view.render(
      createViewState({
        ...baseState,
        progress: createProgressState(hub, {
          phase: 'loading',
          projection: [],
        }),
      })
    )
    const loadingFeedback = findByClass(
      root,
      'learning-hub-progress-feedback--loading'
    )[0]
    assert.equal(root.getAttribute('aria-busy'), 'true')
    assert.equal(loadingFeedback.getAttribute('role'), 'status')
    assert.equal(loadingFeedback.getAttribute('aria-busy'), 'true')
    assert.equal(
      findByClass(root, 'learning-hub-module-progress__count').length,
      0
    )
    assert.ok(
      findCompletionCheckboxes(root).every(
        (checkbox) => checkbox.disabled && checkbox.indeterminate
      )
    )

    let retryCalls = 0
    for (const progressPhase of ['unavailable', 'stale']) {
      view.render(
        createViewState({
          ...baseState,
          progress: createProgressState(hub, {
            phase: progressPhase,
            projection: createProgressProjection(hub, [
              'chapter-signals',
            ]),
            errorMessage:
              'Fortschritt konnte kontrolliert nicht geladen werden.',
          }),
        }),
        {
          onRetryProgressLoad() {
            retryCalls += 1
          },
        }
      )

      const progressAlert = findByClass(
        root,
        'learning-hub-progress-feedback--error'
      )[0]
      assert.equal(progressAlert.getAttribute('role'), 'alert')
      assert.ok(
        progressAlert.textContent.includes(
          'Fortschritt konnte kontrolliert nicht geladen werden.'
        )
      )
      assert.equal(
        findByClass(root, 'learning-hub-module-progress__count').length,
        0
      )
      assert.ok(
        findCompletionCheckboxes(root).every(
          (checkbox) => checkbox.disabled && checkbox.indeterminate
        )
      )
      assert.equal(findButton(root, 'Lernmodul umbenennen').disabled, false)
      findButton(root, 'Fortschritt erneut laden').click()
    }

    assert.equal(retryCalls, 2)
  })
})

test('rendert unvollständige Progressprojektionen nicht als 0 Prozent', () => {
  withLearningHubView(({ root, view }) => {
    const hub = createHubFixture()
    const malformedProjection = createProgressProjection(hub)
    const moduleProgress = malformedProjection.find(
      (entry) => entry.moduleId === 'module-orbit'
    )
    moduleProgress.chapters = moduleProgress.chapters.slice(0, 1)

    view.render(
      createViewState({
        phase: 'ready',
        hub,
        selectedModuleId: 'module-orbit',
        progress: createProgressState(hub, {
          projection: malformedProjection,
        }),
      })
    )

    assert.equal(
      findByClass(root, 'learning-hub-module-progress__count').length,
      0
    )
    assert.ok(root.textContent.includes('Fortschritt ist derzeit nicht verfügbar.'))
    assert.ok(
      findCompletionCheckboxes(root).every(
        (checkbox) => checkbox.disabled && checkbox.indeterminate
      )
    )
  })
})

test('rendert direkt übergebene inkonsistente Prozentprojektionen nicht als gültigen Fortschritt', () => {
  withLearningHubView(({ root, view }) => {
    const hub = createHubFixture()

    for (const incorrectPercent of [1, 49, 99]) {
      const projection = createProgressProjection(hub, ['chapter-signals'])
      const moduleProgress = projection.find(
        (entry) => entry.moduleId === 'module-orbit'
      )
      moduleProgress.progressPercent = incorrectPercent

      view.render(
        createViewState({
          phase: 'ready',
          hub,
          selectedModuleId: 'module-orbit',
          progress: createProgressState(hub, { projection }),
        })
      )

      assert.equal(
        findByClass(root, 'learning-hub-module-progress__count').length,
        0
      )
      assert.equal(
        findByTag(root, 'div').filter(
          (element) => element.getAttribute('role') === 'progressbar'
        ).length,
        0
      )
      assert.ok(
        root.textContent.includes('Fortschritt ist derzeit nicht verfügbar.')
      )
      assert.ok(
        findCompletionCheckboxes(root).every(
          (checkbox) => checkbox.disabled && checkbox.indeterminate
        )
      )
    }
  })
})

test('blockiert während einer Progressmutation sämtliche konkurrierenden Aktionen und Formularfelder', () => {
  withLearningHubView(({ root, view }) => {
    const hub = createHubFixture()
    const completionCalls = []
    const updateCalls = []
    const submitCalls = []
    const progress = createProgressState(hub, {
      phase: 'mutating',
      projection: createProgressProjection(hub, ['chapter-signals']),
      mutatingChapterId: 'chapter-signals',
    })

    view.render(
      createViewState({
        phase: 'ready',
        hub,
        selectedModuleId: 'module-orbit',
        form: createFormState('addChapter', {
          moduleId: 'module-orbit',
          values: { title: 'Offener synthetischer Formularwert' },
        }),
        progress,
      }),
      {
        onToggleChapterCompletion(...identifiers) {
          completionCalls.push(identifiers)
        },
        onUpdateFormField(...fieldUpdate) {
          updateCalls.push(fieldUpdate)
        },
        onSubmitForm(submission) {
          submitCalls.push(submission)
        },
      }
    )

    assert.equal(root.getAttribute('aria-busy'), 'true')
    assert.ok(findByTag(root, 'button').every((button) => button.disabled))
    assert.ok(findByTag(root, 'input').every((input) => input.disabled))
    const checkboxes = findCompletionCheckboxes(root)
    assert.equal(checkboxes[0].checked, true)
    assert.equal(checkboxes[0].indeterminate, false)
    const chapters = findByClass(root, 'learning-hub-chapter')
    assert.equal(chapters[0].getAttribute('aria-busy'), 'true')
    assert.equal(chapters[1].getAttribute('aria-busy'), 'false')
    const titleControl = findControl(root, 'title')
    titleControl.value = 'Nicht weitergereichter synthetischer Wert'
    titleControl.dispatchEvent({ type: 'input' })
    findByTag(root, 'form')[0].dispatchEvent({ type: 'submit' })
    checkboxes[0].dispatchEvent({ type: 'change' })
    assert.deepEqual(updateCalls, [])
    assert.deepEqual(submitCalls, [])
    assert.deepEqual(completionCalls, [])
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

test('rendert Notiz und Zusammenfassung getrennt und verdrahtet ihre Aktionen typgenau', () => {
  withLearningHubView(({ root, view }) => {
    const openCalls = []
    const clearCalls = []
    const summaryContent =
      'Synthetische Zusammenfassung mit\nzweiter Zeile.'

    view.render(
      createSelectedArtifactViewState({
        values: {
          note: null,
          summary: summaryContent,
        },
      }),
      {
        onOpenArtifactEditor(type) {
          openCalls.push(type)
        },
        onOpenArtifactClearConfirmation(type) {
          clearCalls.push(type)
        },
      }
    )

    const section = findByClass(root, 'learning-hub-artifacts')[0]
    assert.equal(section.getAttribute('aria-labelledby'), 'learning-hub-artifacts-title')
    assert.equal(section.getAttribute('aria-busy'), 'false')
    assert.equal(findByTag(section, 'h5')[0].textContent, 'Lernartefakte')
    const cards = findByClass(section, 'learning-hub-artifact-card')
    assert.equal(cards.length, 2)
    assert.deepEqual(
      cards.map((card) => findByTag(card, 'h6')[0].textContent),
      ['Notiz', 'Zusammenfassung']
    )
    assert.ok(cards[0].textContent.includes('Noch keine Notiz gespeichert.'))
    assert.ok(cards[0].textContent.includes('Nicht vorhanden'))
    assert.ok(cards[1].textContent.includes(summaryContent))
    assert.ok(cards[1].textContent.includes('Vorhanden'))
    assert.equal(findByClass(cards[1], 'learning-hub-artifact-card__content')[0].textContent, summaryContent)

    findButton(cards[0], 'Notiz erstellen').click()
    findButton(cards[1], 'Zusammenfassung bearbeiten').click()
    findButton(cards[1], 'Zusammenfassung leeren').click()

    assert.deepEqual(openCalls, ['note', 'summary'])
    assert.deepEqual(clearCalls, ['summary'])
  })
})

test('isoliert Laden und Ladefehler der Lernartefakte mit gezieltem Retry', () => {
  withLearningHubView(({ document, root, view }) => {
    view.render(
      createSelectedArtifactViewState({
        phase: 'loading',
      })
    )

    const loadingSection = findByClass(root, 'learning-hub-artifacts')[0]
    const loadingState = findByClass(
      loadingSection,
      'learning-hub-artifacts__load-state'
    )[0]
    assert.equal(root.getAttribute('aria-busy'), 'true')
    assert.equal(loadingSection.getAttribute('aria-busy'), 'true')
    assert.equal(loadingState.getAttribute('role'), 'status')
    assert.equal(loadingState.getAttribute('aria-live'), 'polite')
    assert.ok(root.textContent.includes('Frei erfundener erster Inhalt'))
    assert.equal(findCompletionCheckboxes(root).length, 2)

    let retryCalls = 0
    view.render(
      {
        ...createSelectedArtifactViewState({
          phase: 'unavailable',
          errorMessage:
            'Die synthetischen Lernartefakte konnten nicht geladen werden.',
        }),
        focusTarget: { type: 'artifactLoadAlert' },
      },
      {
        onRetryArtifactLoad() {
          retryCalls += 1
        },
      }
    )

    const unavailableSection = findByClass(root, 'learning-hub-artifacts')[0]
    const alert = findByClass(
      unavailableSection,
      'learning-hub-artifacts__load-state--error'
    )[0]
    assert.equal(root.getAttribute('aria-busy'), 'false')
    assert.equal(unavailableSection.getAttribute('aria-busy'), 'false')
    assert.equal(alert.getAttribute('role'), 'alert')
    assert.equal(document.activeElement, alert)
    assert.ok(root.textContent.includes('Frei erfundener erster Inhalt'))
    findButton(alert, 'Lernartefakte erneut laden').click()
    assert.equal(retryCalls, 1)
  })
})

test('Artefaktformular ist zugänglich, begrenzt und blockiert reinen Leerraum', () => {
  withLearningHubView(({ document, root, view }) => {
    const updates = []
    const saves = []
    const cancellations = []
    const actions = {
      onUpdateArtifactDraft(type, value) {
        updates.push([type, value])
      },
      onSaveArtifact(submission) {
        saves.push(submission)
      },
      onCancelArtifactEditor(type) {
        cancellations.push(type)
      },
    }

    view.render(
      {
        ...createSelectedArtifactViewState({
          activeType: 'note',
          mode: 'editing',
          draft: 'Synthetischer Notizentwurf',
          dirty: true,
        }),
        focusTarget: {
          type: 'artifactField',
          artifactType: 'note',
        },
      },
      actions
    )

    const form = findByClass(root, 'learning-hub-artifact-form')[0]
    const control = findControl(root, 'noteContent')
    const label = findByTag(form, 'label')[0]
    assert.equal(document.activeElement, control)
    assert.equal(label.getAttribute('for'), control.id)
    assert.equal(control.required, true)
    assert.equal(control.maxLength, 10000)
    assert.equal(control.getAttribute('maxlength'), '10000')
    assert.equal(control.getAttribute('autocomplete'), 'off')
    assert.equal(control.rows, 8)
    assert.ok(control.getAttribute('aria-describedby').includes('-hint'))
    const submitButton = findButton(form, 'Notiz speichern')
    control.value = '   '
    control.dispatchEvent({ type: 'input' })
    assert.equal(submitButton.disabled, true)
    control.value = 'x'.repeat(10001)
    control.dispatchEvent({ type: 'input' })
    assert.equal(submitButton.disabled, true)
    control.value = 'Aktualisierte synthetische Notiz\nmit zweiter Zeile.'
    control.dispatchEvent({ type: 'input' })
    assert.equal(submitButton.disabled, false)
    form.dispatchEvent({ type: 'submit' })
    findButton(form, 'Abbrechen').click()
    assert.equal(updates.length, 3)
    assert.deepEqual(updates.at(-1), [
      'note',
      'Aktualisierte synthetische Notiz\nmit zweiter Zeile.',
    ])
    assert.deepEqual(saves, [
      {
        type: 'note',
        content: 'Aktualisierte synthetische Notiz\nmit zweiter Zeile.',
      },
    ])
    assert.deepEqual(cancellations, ['note'])

    view.render(
      createSelectedArtifactViewState({
        activeType: 'summary',
        mode: 'editing',
        draft: '   \n  ',
      }),
      actions
    )
    const whitespaceForm = findByClass(
      root,
      'learning-hub-artifact-form'
    )[0]
    const whitespaceSubmit = findButton(
      whitespaceForm,
      'Zusammenfassung speichern'
    )
    assert.equal(whitespaceSubmit.disabled, true)
    whitespaceForm.dispatchEvent({ type: 'submit' })
    assert.equal(saves.length, 1)

    view.render({
      ...createSelectedArtifactViewState({
        activeType: 'summary',
        mode: 'editing',
        draft: 'Ungültiger synthetischer Entwurf',
        fieldError: 'Bitte gib einen Inhalt ein.',
      }),
      focusTarget: {
        type: 'artifactField',
        artifactType: 'summary',
      },
    })
    const invalidControl = findControl(root, 'summaryContent')
    assert.equal(invalidControl.getAttribute('aria-invalid'), 'true')
    assert.ok(invalidControl.getAttribute('aria-describedby').includes('-error'))
    assert.equal(document.activeElement, invalidControl)
  })
})

test('bewahrt einen Dirty-Draft bei gewöhnlichem Progress-Rerender', () => {
  withLearningHubView(({ root, view }) => {
    const dirtyDraft =
      'Synthetischer Dirty-Draft\nmit unveränderter zweiter Zeile.'
    const readyState = createSelectedArtifactViewState({
      activeType: 'summary',
      mode: 'editing',
      draft: dirtyDraft,
      dirty: true,
    })

    view.render(readyState)
    assert.equal(findControl(root, 'summaryContent').value, dirtyDraft)
    assert.equal(
      findByClass(
        root,
        'learning-hub-artifact-form__draft-status'
      )[0].textContent,
      'Ungespeicherte Änderungen.'
    )

    view.render({
      ...readyState,
      progress: {
        ...readyState.progress,
        phase: 'mutating',
        mutatingChapterId: 'chapter-signals',
      },
    })
    const rerenderedControl = findControl(root, 'summaryContent')
    assert.equal(rerenderedControl.value, dirtyDraft)
    assert.equal(rerenderedControl.disabled, true)
    assert.equal(
      findButton(root, 'Zusammenfassung speichern').disabled,
      true
    )
  })
})

test('Clear-Bestätigung bleibt privat, nicht blockierend und zeigt Busy-Feedback', () => {
  withLearningHubView(({ document, root, view }) => {
    const privateSentinel =
      '<script>private-artifact-sentinel</script>'
    const cancelCalls = []
    const confirmCalls = []
    const actions = {
      onCancelArtifactClearConfirmation(type) {
        cancelCalls.push(type)
      },
      onConfirmArtifactClear(type) {
        confirmCalls.push(type)
      },
    }

    view.render(
      {
        ...createSelectedArtifactViewState({
          values: {
            note: privateSentinel,
            summary: null,
          },
          activeType: 'note',
          mode: 'confirmClear',
        }),
        focusTarget: {
          type: 'artifactConfirmation',
          artifactType: 'note',
        },
      },
      actions
    )

    const confirmation = findByClass(
      root,
      'learning-hub-artifact-confirmation'
    )[0]
    const cancelButton = findButton(confirmation, 'Nicht leeren')
    assert.equal(findByTag(confirmation, 'fieldset').length, 1)
    assert.equal(findByTag(confirmation, 'legend')[0].textContent, 'Notiz wirklich leeren?')
    assert.equal(confirmation.textContent.includes(privateSentinel), false)
    assert.equal(document.activeElement, cancelButton)
    assert.equal(cancelButton.disabled, false)
    assert.equal(
      findButton(root, '← Zur Modulübersicht').disabled,
      true
    )
    assert.ok(
      findCompletionCheckboxes(root).every(
        (checkbox) => checkbox.disabled
      )
    )
    for (const element of findAll(
      confirmation,
      (node) => node.nodeType === 1
    )) {
      for (const attributeValue of element.attributes.values()) {
        assert.equal(attributeValue.includes(privateSentinel), false)
      }
    }
    cancelButton.click()
    findButton(confirmation, 'Notiz leeren').click()
    assert.deepEqual(cancelCalls, ['note'])
    assert.deepEqual(confirmCalls, ['note'])

    view.render(
      createSelectedArtifactViewState({
        phase: 'mutating',
        values: {
          note: privateSentinel,
          summary: null,
        },
        activeType: 'note',
        mode: 'confirmClear',
        mutatingType: 'note',
      }),
      actions
    )
    const busyCard = findByClass(root, 'learning-hub-artifact-card')[0]
    const busyConfirmation = findByClass(
      busyCard,
      'learning-hub-artifact-confirmation'
    )[0]
    assert.equal(root.getAttribute('aria-busy'), 'true')
    assert.equal(busyCard.getAttribute('aria-busy'), 'true')
    assert.equal(busyConfirmation.getAttribute('aria-busy'), 'true')
    assert.ok(
      findByTag(busyConfirmation, 'button').every(
        (button) => button.disabled
      )
    )
    assert.ok(busyCard.textContent.includes('Wird geleert'))
  })
})

test('Artefaktstatus und alle Fokusziele bleiben typbezogen', () => {
  withLearningHubView(({ document, root, view }) => {
    const values = {
      note: 'Synthetische Notiz',
      summary: 'Synthetische Zusammenfassung',
    }

    const cases = [
      {
        state: createSelectedArtifactViewState({ values }),
        focusTarget: { type: 'artifactHeading' },
        findExpected: () => findByTag(
          findByClass(root, 'learning-hub-artifacts')[0],
          'h5'
        )[0],
      },
      {
        state: createSelectedArtifactViewState({ values }),
        focusTarget: {
          type: 'artifactTrigger',
          artifactType: 'summary',
        },
        findExpected: () => findButton(root, 'Zusammenfassung bearbeiten'),
      },
      {
        state: createSelectedArtifactViewState({ values }),
        focusTarget: {
          type: 'artifactClearTrigger',
          artifactType: 'note',
        },
        findExpected: () => findButton(root, 'Notiz leeren'),
      },
    ]

    for (const focusCase of cases) {
      view.render({
        ...focusCase.state,
        focusTarget: focusCase.focusTarget,
      })
      assert.equal(document.activeElement, focusCase.findExpected())
    }

    view.render({
      ...createSelectedArtifactViewState({
        values,
        errorMessage:
          'Die synthetische Zusammenfassung konnte nicht gespeichert werden.',
        feedbackType: 'summary',
      }),
      focusTarget: {
        type: 'artifactAlert',
        artifactType: 'summary',
      },
    })
    const alert = findByClass(
      root,
      'learning-hub-artifact-feedback--error'
    )[0]
    assert.equal(alert.getAttribute('role'), 'alert')
    assert.equal(document.activeElement, alert)

    view.render(
      createSelectedArtifactViewState({
        values,
        statusMessage: 'Keine Änderungen an der Notiz.',
        feedbackType: 'note',
      })
    )
    const status = findByClass(
      root,
      'learning-hub-artifact-feedback--success'
    )[0]
    assert.equal(status.getAttribute('role'), 'status')
    assert.equal(status.getAttribute('aria-live'), 'polite')
    assert.equal(status.textContent, 'Keine Änderungen an der Notiz.')
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

test('stellt den Fokus nach Progresserfolg und -fehler auf das betroffene Markierungsfeld zurück', () => {
  withLearningHubView(({ document, root, view }) => {
    const hub = createHubFixture()
    const projection = createProgressProjection(hub, ['chapter-signals'])
    const focusTarget = {
      type: 'chapterCompletion',
      chapterId: 'chapter-signals',
    }

    view.render(
      createViewState({
        phase: 'ready',
        hub,
        selectedModuleId: 'module-orbit',
        expandedChapterIds: ['chapter-signals'],
        selectedLearningNodeId: 'node-first',
        statusMessage: 'Kapitel wurde als abgeschlossen markiert.',
        progress: createProgressState(hub, { projection }),
        focusTarget,
      })
    )
    let focusedCheckbox = findCompletionCheckboxes(root)[0]
    assert.equal(document.activeElement, focusedCheckbox)
    assert.equal(focusedCheckbox.checked, true)
    assert.equal(
      findByClass(root, 'learning-hub-feedback--success')[0]
        .getAttribute('role'),
      'status'
    )
    assert.equal(
      findByClass(root, 'learning-hub-chapter__panel')[0].hidden,
      false
    )
    assert.ok(root.textContent.includes('Erster synthetischer Puls'))

    view.render(
      createViewState({
        phase: 'ready',
        hub,
        selectedModuleId: 'module-orbit',
        expandedChapterIds: ['chapter-signals'],
        selectedLearningNodeId: 'node-first',
        progress: createProgressState(hub, {
          projection,
          errorMessage:
            'Der Kapitelstatus konnte nicht lokal gespeichert werden.',
        }),
        focusTarget,
      })
    )
    focusedCheckbox = findCompletionCheckboxes(root)[0]
    const progressAlert = findByClass(
      root,
      'learning-hub-progress-feedback--error'
    )[0]
    assert.equal(document.activeElement, focusedCheckbox)
    assert.equal(focusedCheckbox.checked, true)
    assert.equal(progressAlert.getAttribute('role'), 'alert')
    assert.equal(
      progressAlert.textContent,
      'Der Kapitelstatus konnte nicht lokal gespeichert werden.'
    )
    assert.equal(findButton(root, 'Fortschritt erneut laden'), null)
    assert.equal(
      findByClass(root, 'learning-hub-chapter__panel')[0].hidden,
      false
    )
    assert.ok(root.textContent.includes('Erster synthetischer Puls'))
  })
})

test('HTML-artige private Eingaben bleiben auf allen Ebenen sichtbarer Text', () => {
  withLearningHubView(({ root, view }) => {
    const moduleTitle = '<script>alert(1)</script>'
    const chapterTitle = '<img src=x onerror=alert(2)>'
    const nodeTitle = '<strong>Nur Text</strong>'
    const nodeContent =
      '<img src=x onerror=alert(3)>\n<script>alert(4)</script>'
    const noteContent =
      '<svg onload=alert(5)>Private synthetische Notiz</svg>'
    const summaryContent =
      '<a href=https://example.invalid/private>Private Zusammenfassung</a>\nmit zweiter Zeile'
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
        artifacts: createArtifactState({
          values: {
            note: noteContent,
            summary: summaryContent,
          },
        }),
      })
    )

    for (const privateText of [
      moduleTitle,
      chapterTitle,
      nodeTitle,
      nodeContent,
      noteContent,
      summaryContent,
    ]) {
      assert.ok(root.textContent.includes(privateText))
    }

    assert.equal(findByTag(root, 'script').length, 0)
    assert.equal(findByTag(root, 'img').length, 0)
    assert.equal(findByTag(root, 'svg').length, 0)
    assert.equal(findByTag(root, 'a').length, 0)
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

    view.render(
      createSelectedArtifactViewState({
        phase: 'mutating',
        values: {
          note: 'Synthetische Notiz',
          summary: null,
        },
        activeType: 'note',
        mode: 'editing',
        draft: 'Synthetischer Entwurf',
        mutatingType: 'note',
      })
    )
    assert.equal(root.getAttribute('aria-busy'), 'true')
    view.unmount()
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

    let oldCompletionCalls = 0
    let currentCompletionCalls = 0
    const hub = createHubFixture()
    const detailState = createViewState({
      phase: 'ready',
      hub,
      selectedModuleId: 'module-orbit',
    })
    view.render(detailState, {
      onToggleChapterCompletion() {
        oldCompletionCalls += 1
      },
    })
    view.render(detailState, {
      onToggleChapterCompletion() {
        currentCompletionCalls += 1
      },
    })
    const currentCheckbox = findCompletionCheckboxes(root)[0]
    assert.equal(currentCheckbox.eventListeners.get('change').length, 1)
    currentCheckbox.dispatchEvent({ type: 'change' })
    assert.equal(oldCompletionCalls, 0)
    assert.equal(currentCompletionCalls, 1)

    let oldArtifactOpenCalls = 0
    let currentArtifactOpenCalls = 0
    const artifactState = createSelectedArtifactViewState()
    view.render(artifactState, {
      onOpenArtifactEditor() {
        oldArtifactOpenCalls += 1
      },
    })
    view.render(artifactState, {
      onOpenArtifactEditor() {
        currentArtifactOpenCalls += 1
      },
    })
    const currentArtifactButton = findButton(root, 'Notiz erstellen')
    assert.equal(
      currentArtifactButton.eventListeners.get('click').length,
      1
    )
    currentArtifactButton.click()
    assert.equal(oldArtifactOpenCalls, 0)
    assert.equal(currentArtifactOpenCalls, 1)

    let oldArtifactSaveCalls = 0
    let currentArtifactSaveCalls = 0
    let currentArtifactUpdateCalls = 0
    const artifactFormState = createSelectedArtifactViewState({
      activeType: 'note',
      mode: 'editing',
      draft: 'Synthetischer Entwurf',
    })
    view.render(artifactFormState, {
      onSaveArtifact() {
        oldArtifactSaveCalls += 1
      },
    })
    view.render(artifactFormState, {
      onSaveArtifact() {
        currentArtifactSaveCalls += 1
      },
      onUpdateArtifactDraft() {
        currentArtifactUpdateCalls += 1
      },
    })
    const currentArtifactForm = findByClass(
      root,
      'learning-hub-artifact-form'
    )[0]
    const currentArtifactControl = findControl(root, 'noteContent')
    assert.equal(
      currentArtifactForm.eventListeners.get('submit').length,
      1
    )
    assert.equal(
      currentArtifactControl.eventListeners.get('input').length,
      1
    )
    currentArtifactControl.dispatchEvent({ type: 'input' })
    currentArtifactForm.dispatchEvent({ type: 'submit' })
    assert.equal(oldArtifactSaveCalls, 0)
    assert.equal(currentArtifactSaveCalls, 1)
    assert.equal(currentArtifactUpdateCalls, 1)
  })
})

test('isoliert Testbank-Laden und -Fehler und rendert Autorfragen in Service-Reihenfolge', () => {
  withLearningHubView(({ document, root, view }) => {
    view.render(createSelectedTestViewState({
      bank: {
        phase: 'loading',
      },
    }))

    const loadingSection = findByClass(
      root,
      'learning-hub-test-questions'
    )[0]
    assert.equal(loadingSection.getAttribute('aria-busy'), 'true')
    assert.equal(
      findByClass(
        loadingSection,
        'learning-hub-test-questions__load-state'
      )[0].getAttribute('role'),
      'status'
    )
    assert.ok(root.textContent.includes('Frei erfundener erster Inhalt'))
    assert.equal(findByClass(root, 'learning-hub-artifacts').length, 1)

    let retryCalls = 0
    view.render(
      {
        ...createSelectedTestViewState({
          bank: {
            phase: 'unavailable',
            errorMessage:
              'Die synthetische Testfragenbank konnte nicht geladen werden.',
          },
        }),
        focusTarget: { type: 'testBankAlert' },
      },
      {
        onRetryTestBankLoad() {
          retryCalls += 1
        },
      }
    )
    const alert = findByClass(
      root,
      'learning-hub-test-questions__load-state--error'
    )[0]
    assert.equal(alert.getAttribute('role'), 'alert')
    assert.equal(document.activeElement, alert)
    findButton(alert, 'Testfragen erneut laden').click()
    assert.equal(retryCalls, 1)
    assert.ok(root.textContent.includes('Frei erfundener erster Inhalt'))

    const firstQuestion = createAuthorQuestionFixture({
      id: 'question-author-first',
      prompt: 'Erste synthetische Autorfrage',
    })
    const secondQuestion = createAuthorQuestionFixture({
      id: 'question-author-second',
      prompt: 'Zweite synthetische Autorfrage',
      difficulty: 'hard',
      explanation: '',
    })
    const editCalls = []
    let createCalls = 0
    view.render(
      createSelectedTestViewState({
        bank: {
          questions: [secondQuestion, firstQuestion],
          totalQuestionCount: 2,
          statusMessage: 'Keine Änderungen an der Testfrage.',
        },
      }),
      {
        onOpenCreateQuestion() {
          createCalls += 1
        },
        onOpenEditQuestion(questionId) {
          editCalls.push(questionId)
        },
      }
    )
    const authorCards = findByClass(root, 'learning-hub-author-question')
    assert.deepEqual(
      authorCards.map((card) => findByTag(card, 'h6')[0].textContent),
      ['Zweite synthetische Autorfrage', 'Erste synthetische Autorfrage']
    )
    assert.ok(authorCards[0].textContent.includes('Schwierigkeit: Schwer'))
    assert.ok(authorCards[1].textContent.includes('Richtige Antwort'))
    assert.ok(authorCards[1].textContent.includes('Erklärung:'))
    assert.equal(findButton(root, 'Testfrage löschen'), null)
    assert.equal(findButton(root, 'Testfrage verschieben'), null)
    findByTag(root, 'button')
      .filter((button) => button.textContent === 'Testfrage bearbeiten')
      .forEach((button) => button.click())
    findButton(root, 'Testfrage erstellen').click()
    assert.deepEqual(editCalls, [
      'question-author-second',
      'question-author-first',
    ])
    assert.equal(createCalls, 1)
    assert.equal(
      findByClass(root, 'learning-hub-test-feedback--success')[0]
        .getAttribute('role'),
      'status'
    )
  })
})

test('Frageeditor verdrahtet Grenzen, native Korrekt-Radios, dynamische Optionen und Dirty-Verwerfen', () => {
  withLearningHubView(({ document, root, view }) => {
    const updates = []
    const removeCalls = []
    const correctCalls = []
    let addCalls = 0
    let submitCalls = 0
    let cancelCalls = 0
    const actions = {
      onUpdateQuestionField(fieldName, value, optionIndex) {
        updates.push([fieldName, value, optionIndex])
      },
      onAddQuestionOption() {
        addCalls += 1
      },
      onRemoveQuestionOption(optionIndex) {
        removeCalls.push(optionIndex)
      },
      onSelectCorrectQuestionOption(optionIndex) {
        correctCalls.push(optionIndex)
      },
      onSubmitQuestion() {
        submitCalls += 1
      },
      onCancelQuestionEditor() {
        cancelCalls += 1
      },
    }
    const editor = {
      mode: 'create',
      values: {
        prompt: 'Synthetische Frage',
        difficulty: 'medium',
        options: ['Erste Option', 'Zweite Option', 'Dritte Option'],
        correctOptionIndex: 1,
        explanation: 'Synthetische Erklärung',
      },
      fieldErrors: {
        'options.2': 'Bitte gib eine gültige dritte Option ein.',
      },
      errorMessage: 'Bitte korrigiere die markierten Felder.',
      isSubmitting: false,
      dirty: true,
      discardConfirmation: false,
    }
    view.render(
      {
        ...createSelectedTestViewState({ editor }),
        focusTarget: {
          type: 'questionEditorField',
          fieldName: 'options',
          optionIndex: 2,
        },
      },
      actions
    )

    const form = findByClass(root, 'learning-hub-question-form')[0]
    const prompt = findControl(form, 'prompt')
    const explanation = findControl(form, 'explanation')
    const difficulty = findByTag(form, 'select')[0]
    const optionInputs = findByTag(form, 'input').filter(
      (input) => input.type === 'text' && input.name.startsWith('option-')
    )
    const correctRadios = findByTag(form, 'input').filter(
      (input) => input.type === 'radio'
    )
    assert.equal(prompt.maxLength, 500)
    assert.equal(prompt.getAttribute('maxlength'), '500')
    assert.equal(explanation.maxLength, 2000)
    assert.equal(explanation.getAttribute('maxlength'), '2000')
    assert.equal(difficulty.value, 'medium')
    assert.deepEqual(
      findByTag(difficulty, 'option').map((option) => option.value),
      ['easy', 'medium', 'hard']
    )
    assert.equal(optionInputs.length, 3)
    assert.ok(optionInputs.every((input) => input.maxLength === 300))
    assert.equal(correctRadios.length, 3)
    assert.ok(correctRadios.every(
      (radio) => radio.name === 'learning-hub-question-correct-option'
    ))
    assert.equal(correctRadios[1].checked, true)
    assert.equal(optionInputs[2].getAttribute('aria-invalid'), 'true')
    assert.ok(optionInputs[2].getAttribute('aria-describedby').includes('-error'))
    assert.equal(document.activeElement, optionInputs[2])
    assert.equal(findByTag(form, 'fieldset').length, 1)
    assert.equal(findByTag(form, 'legend')[0].textContent, 'Antwortoptionen')

    prompt.value = 'Aktualisierte synthetische Frage'
    prompt.dispatchEvent({ type: 'input' })
    difficulty.value = 'hard'
    difficulty.dispatchEvent({ type: 'change' })
    optionInputs[1].value = 'Aktualisierte zweite Option'
    optionInputs[1].dispatchEvent({ type: 'input' })
    correctRadios[2].dispatchEvent({ type: 'change' })
    findButton(form, 'Antwortoption hinzufügen').click()
    findByTag(form, 'button')
      .filter((button) => button.textContent === 'Option entfernen')[1]
      .click()
    form.dispatchEvent({ type: 'submit' })
    form.dispatchEvent({ type: 'submit' })
    findButton(form, 'Abbrechen').click()
    assert.deepEqual(updates, [
      ['prompt', 'Aktualisierte synthetische Frage', undefined],
      ['difficulty', 'hard', undefined],
      ['options', 'Aktualisierte zweite Option', 1],
    ])
    assert.deepEqual(correctCalls, [2])
    assert.equal(addCalls, 1)
    assert.deepEqual(removeCalls, [1])
    assert.equal(submitCalls, 1)
    assert.equal(cancelCalls, 1)

    view.render(createSelectedTestViewState({
      editor: {
        ...editor,
        values: {
          ...editor.values,
          options: Array.from(
            { length: 6 },
            (_, optionIndex) => `Synthetische Option ${optionIndex + 1}`
          ),
          correctOptionIndex: 5,
        },
        fieldErrors: {},
        errorMessage: '',
      },
    }))
    assert.equal(
      findButton(root, 'Antwortoption hinzufügen').disabled,
      true
    )
    assert.ok(
      findByTag(root, 'button')
        .filter((button) => button.textContent === 'Option entfernen')
        .every((button) => button.disabled === false)
    )

    view.render(createSelectedTestViewState({
      editor: {
        ...editor,
        values: {
          ...editor.values,
          options: ['Erste Option', 'Zweite Option'],
          correctOptionIndex: 0,
        },
        fieldErrors: {},
        errorMessage: '',
      },
    }))
    assert.equal(
      findButton(root, 'Antwortoption hinzufügen').disabled,
      false
    )
    assert.ok(
      findByTag(root, 'button')
        .filter((button) => button.textContent === 'Option entfernen')
        .every((button) => button.disabled)
    )

    view.render({
      ...createSelectedTestViewState({
        editor: {
          ...editor,
          fieldErrors: {
            correctOptionIndex:
              'Markiere genau eine vorhandene Antwortoption als korrekt.',
          },
          errorMessage: '',
        },
      }),
      focusTarget: {
        type: 'questionEditorField',
        fieldName: 'correctOptionIndex',
      },
    })
    const focusedCorrectRadios = findByClass(
      root,
      'learning-hub-question-option__radio'
    )
    assert.equal(document.activeElement, focusedCorrectRadios[1])
    assert.ok(focusedCorrectRadios.every(
      (radio) => radio.getAttribute('aria-invalid') === 'true'
    ))
    assert.ok(focusedCorrectRadios.every(
      (radio) => radio.getAttribute('aria-describedby').includes(
        'learning-hub-question-correct-error'
      )
    ))

    let continueCalls = 0
    let discardCalls = 0
    view.render(
      {
        ...createSelectedTestViewState({
          editor: {
            ...editor,
            errorMessage: '',
            fieldErrors: {},
            discardConfirmation: true,
          },
        }),
        focusTarget: { type: 'questionDiscardConfirmation' },
      },
      {
        onContinueQuestionEditing() {
          continueCalls += 1
        },
        onDiscardQuestionDraft() {
          discardCalls += 1
        },
      }
    )
    const confirmation = findByClass(
      root,
      'learning-hub-question-discard'
    )[0]
    assert.equal(findByTag(confirmation, 'legend')[0].textContent, 'Ungespeicherte Frage verwerfen?')
    assert.equal(
      document.activeElement,
      findButton(confirmation, 'Weiter bearbeiten')
    )
    assert.ok(findByTag(form, 'input').every((input) => input.disabled === false))
    findButton(confirmation, 'Weiter bearbeiten').click()
    findButton(confirmation, 'Entwurf verwerfen').click()
    assert.equal(continueCalls, 1)
    assert.equal(discardCalls, 1)
    const disabledEditor = findByClass(root, 'learning-hub-question-form')[0]
    assert.ok(
      findByTag(disabledEditor, 'input')
        .concat(findByTag(disabledEditor, 'textarea'))
        .concat(findByTag(disabledEditor, 'select'))
        .every((control) => control.disabled)
    )
  })
})

test('Frageeditor übernimmt medium und hard erst nach dem Aufbau aller Select-Optionen', () => {
  withLearningHubView(({ document, root, view }) => {
    const originalCreateElement = document.createElement.bind(document)

    document.createElement = (tagName) => {
      const element = originalCreateElement(tagName)

      if (String(tagName).toLowerCase() !== 'select') return element

      const originalAppend = element.append.bind(element)
      element.append = (...nodes) => {
        originalAppend(...nodes)
        const options = element.children.filter(
          (child) => child.tagName === 'OPTION'
        )

        if (options.length > 0 && !options.some((option) => option.selected)) {
          options[0].selected = true
        }
      }
      Object.defineProperty(element, 'value', {
        configurable: true,
        get() {
          return element.children.find(
            (child) => child.tagName === 'OPTION' && child.selected
          )?.value ?? ''
        },
        set(nextValue) {
          const normalizedValue = String(nextValue)
          element.children
            .filter((child) => child.tagName === 'OPTION')
            .forEach((option) => {
              option.selected = option.value === normalizedValue
            })
        },
      })

      return element
    }

    for (const difficulty of ['medium', 'hard']) {
      view.render(createSelectedTestViewState({
        editor: {
          mode: 'create',
          values: {
            prompt: 'Synthetische Auswahlfrage',
            difficulty,
            options: ['Erste Option', 'Zweite Option'],
            correctOptionIndex: 0,
            explanation: '',
          },
          fieldErrors: {},
          errorMessage: '',
          isSubmitting: false,
          dirty: false,
          discardConfirmation: false,
        },
      }))

      const select = findByTag(root, 'select')[0]
      assert.equal(select.value, difficulty)
      assert.deepEqual(
        findByTag(select, 'option')
          .filter((option) => option.selected)
          .map((option) => option.value),
        [difficulty]
      )
    }
  })
})

test('Frageeditor verwendet die kanonischen LearningTest-Vertragskonstanten', () => {
  const viewSource = readFileSync(
    new URL(
      '../src/modules/learning-hub/learningHubView.js',
      import.meta.url
    ),
    'utf8'
  )
  const contractConstants = [
    'LEARNING_TEST_DIFFICULTIES',
    'LEARNING_TEST_EXPLANATION_MAX_LENGTH',
    'LEARNING_TEST_MAX_OPTION_COUNT',
    'LEARNING_TEST_MIN_OPTION_COUNT',
    'LEARNING_TEST_OPTION_LABEL_MAX_LENGTH',
    'LEARNING_TEST_PROMPT_MAX_LENGTH',
  ]

  assert.match(
    viewSource,
    /from '.\/learningTestBankContract\.js'/
  )
  contractConstants.forEach((constantName) => {
    assert.match(viewSource, new RegExp(`\\b${constantName}\\b`))
  })
  assert.doesNotMatch(
    viewSource,
    /const QUESTION_(?:PROMPT|OPTION|EXPLANATION)_MAX_LENGTH/
  )
  assert.doesNotMatch(
    viewSource,
    /const (?:MIN|MAX)_QUESTION_OPTION_COUNT/
  )
})

test('Frageeditor aktualisiert den Dirty-Status bei Zustandswechseln ohne Eingabeverlust', () => {
  withLearningHubView(({ document, root, view }) => {
    const initialPrompt = 'Unveränderte synthetische Frage'
    const preservedOption = 'Synthetische Antwort bleibt erhalten'
    const baselineValues = {
      prompt: initialPrompt,
      difficulty: 'medium',
      options: [preservedOption, 'Zweite Option'],
      correctOptionIndex: 0,
      explanation: '',
    }
    let editor = {
      mode: 'create',
      values: {
        ...baselineValues,
        options: [...baselineValues.options],
      },
      fieldErrors: {},
      errorMessage: '',
      isSubmitting: false,
      dirty: false,
      discardConfirmation: false,
    }

    function renderEditor(focusTarget = null) {
      view.render(
        {
          ...createSelectedTestViewState({ editor }),
          focusTarget,
        },
        {
          onUpdateQuestionField(fieldName, value) {
            const previousDirty = editor.dirty
            editor = {
              ...editor,
              values: {
                ...editor.values,
                [fieldName]: value,
              },
              dirty: value !== baselineValues[fieldName],
            }

            if (editor.dirty !== previousDirty) {
              renderEditor({
                type: 'questionEditorField',
                fieldName,
              })
            }
          },
        }
      )
    }

    renderEditor()

    let prompt = findControl(root, 'prompt')
    let draftStatus = findByClass(
      root,
      'learning-hub-question-form__draft-status'
    )[0]
    assert.equal(draftStatus.textContent, 'Keine ungespeicherten Änderungen.')

    prompt.value = 'Geänderte synthetische Frage'
    prompt.dispatchEvent({ type: 'input' })

    prompt = findControl(root, 'prompt')
    draftStatus = findByClass(
      root,
      'learning-hub-question-form__draft-status'
    )[0]
    assert.equal(draftStatus.textContent, 'Ungespeicherte Änderungen.')
    assert.equal(prompt.value, 'Geänderte synthetische Frage')
    assert.equal(findControl(root, 'option-0').value, preservedOption)
    assert.equal(document.activeElement, prompt)

    prompt.value = initialPrompt
    prompt.dispatchEvent({ type: 'input' })

    prompt = findControl(root, 'prompt')
    draftStatus = findByClass(
      root,
      'learning-hub-question-form__draft-status'
    )[0]
    assert.equal(draftStatus.textContent, 'Keine ungespeicherten Änderungen.')
    assert.equal(prompt.value, initialPrompt)
    assert.equal(findControl(root, 'option-0').value, preservedOption)
    assert.equal(document.activeElement, prompt)
  })
})

test('Frageeditor benennt Korrekt-Radios und Entfernen-Buttons eindeutig nach Optionsnummer', () => {
  withLearningHubView(({ root, view }) => {
    view.render(createSelectedTestViewState({
      editor: {
        mode: 'create',
        values: {
          prompt: 'Synthetische zugängliche Frage',
          difficulty: 'easy',
          options: ['Erste Option', 'Zweite Option', 'Dritte Option'],
          correctOptionIndex: 1,
          explanation: '',
        },
        fieldErrors: {},
        errorMessage: '',
        isSubmitting: false,
        dirty: false,
        discardConfirmation: false,
      },
    }))

    const correctRadios = findByClass(
      root,
      'learning-hub-question-option__radio'
    )
    const removeButtons = findByTag(root, 'button').filter(
      (button) => button.textContent === 'Option entfernen'
    )

    assert.deepEqual(
      correctRadios.map((radio) => radio.getAttribute('aria-label')),
      [
        'Option 1 als richtige Antwort markieren',
        'Option 2 als richtige Antwort markieren',
        'Option 3 als richtige Antwort markieren',
      ]
    )
    assert.deepEqual(
      removeButtons.map((button) => button.getAttribute('aria-label')),
      ['Option 1 entfernen', 'Option 2 entfernen', 'Option 3 entfernen']
    )
  })
})

test('correctOptionIndex-Fehler fokussiert die tatsächlich ausgewählte Option', () => {
  withLearningHubView(({ document, root, view }) => {
    view.render({
      ...createSelectedTestViewState({
        editor: {
          mode: 'edit',
          values: {
            prompt: 'Synthetische Fokusfrage',
            difficulty: 'hard',
            options: ['Erste Option', 'Zweite Option', 'Dritte Option'],
            correctOptionIndex: 2,
            explanation: '',
          },
          fieldErrors: {
            correctOptionIndex:
              'Markiere genau eine vorhandene Antwortoption als korrekt.',
          },
          errorMessage: 'Bitte korrigiere das markierte Feld.',
          isSubmitting: false,
          dirty: true,
          discardConfirmation: false,
        },
      }),
      focusTarget: {
        type: 'questionEditorField',
        fieldName: 'correctOptionIndex',
      },
    })

    const correctRadios = findByClass(
      root,
      'learning-hub-question-option__radio'
    )
    assert.equal(correctRadios[2].checked, true)
    assert.equal(document.activeElement, correctRadios[2])
  })
})

test('Runner nutzt nur die öffentliche Session, sperrt konkurrierende UI und verhindert doppelte Abgabe', () => {
  withLearningHubView(({ root, view }) => {
    const solutionSentinel = 'PRIVATE-SOLUTION-SENTINEL'
    const explanationSentinel = 'PRIVATE-EXPLANATION-SENTINEL'
    const authorSentinel = 'PRIVATE-AUTHOR-QUESTION-SENTINEL'
    const publicSession = createPublicTestSession()
    publicSession.correctOptionId = solutionSentinel
    publicSession.explanation = explanationSentinel
    publicSession.privateBankSnapshot = authorSentinel
    publicSession.questions[0].correctOptionId = solutionSentinel
    publicSession.questions[0].explanation = explanationSentinel
    publicSession.questions[0].options[0].isCorrect = true
    const answerCalls = []
    view.render(
      {
        ...createSelectedTestViewState({
          bank: {
            questions: [createAuthorQuestionFixture({ prompt: authorSentinel })],
            totalQuestionCount: 2,
          },
          runner: {
            phase: 'active',
            questionCount: 2,
            testSession: publicSession,
            answers: {
              'question-public-one': 'option-public-circle',
            },
          },
        }),
        focusTarget: {
          type: 'testAnswer',
          questionId: 'question-public-two',
          optionId: 'option-public-wave',
        },
      },
      {
        onSelectTestAnswer(questionId, optionId) {
          answerCalls.push([questionId, optionId])
        },
      }
    )

    assert.ok(root.textContent.includes('Lokaler Mock-Test'))
    assert.ok(root.textContent.includes('Laufender Modultest'))
    assert.equal(root.textContent.includes(solutionSentinel), false)
    assert.equal(root.textContent.includes(explanationSentinel), false)
    assert.equal(root.textContent.includes(authorSentinel), false)
    assert.equal(findByClass(root, 'learning-hub-author-question').length, 0)
    assert.ok(root.textContent.includes('Autorenansicht ist während'))
    const questionFieldsets = findByClass(
      root,
      'learning-hub-test-runner__question'
    )
    assert.equal(questionFieldsets.length, 2)
    assert.deepEqual(
      questionFieldsets.map(
        (fieldset) => findByTag(fieldset, 'legend')[0].textContent
      ),
      [
        'Welche erfundene Form öffnet das Nordtor?',
        'Welches Fantasiesignal beendet die Runde?',
      ]
    )
    const runnerRadios = findByClass(
      root,
      'learning-hub-test-runner__radio'
    )
    assert.equal(runnerRadios.length, 4)
    assert.ok(runnerRadios.every((radio) => radio.type === 'radio'))
    assert.equal(runnerRadios[0].checked, true)
    assert.equal(document.activeElement, runnerRadios[3])
    assert.ok(root.textContent.includes('1 von 2 Fragen beantwortet'))
    runnerRadios[3].dispatchEvent({ type: 'change' })
    assert.deepEqual(answerCalls, [[
      'question-public-two',
      'option-public-wave',
    ]])
    assert.equal(findButton(root, 'Test auswerten').disabled, true)
    assert.equal(findButton(root, '← Zur Modulübersicht').disabled, true)
    assert.ok(findCompletionCheckboxes(root).every((input) => input.disabled))
    assert.ok(
      findByClass(root, 'learning-hub-artifact-card')
        .flatMap((card) => findByTag(card, 'button'))
        .every((button) => button.disabled)
    )
    for (const element of findAll(
      root,
      (node) => node.nodeType === 1
    )) {
      for (const attributeValue of element.attributes.values()) {
        assert.equal(attributeValue.includes(solutionSentinel), false)
        assert.equal(attributeValue.includes(explanationSentinel), false)
        assert.equal(attributeValue.includes(authorSentinel), false)
      }
    }

    view.render(createSelectedTestViewState({
      bank: {
        questions: [createAuthorQuestionFixture({
          prompt: authorSentinel,
          explanation: explanationSentinel,
          options: [
            {
              id: 'option-author-private-one',
              label: solutionSentinel,
              isCorrect: true,
            },
            {
              id: 'option-author-private-two',
              label: 'Synthetische Schwesteroption',
              isCorrect: false,
            },
          ],
        })],
        totalQuestionCount: 2,
      },
      runner: {
        phase: 'starting',
        questionCount: 2,
      },
    }))
    assert.equal(root.textContent.includes(solutionSentinel), false)
    assert.equal(root.textContent.includes(explanationSentinel), false)
    assert.equal(root.textContent.includes(authorSentinel), false)
    assert.equal(findByClass(root, 'learning-hub-author-question').length, 0)

    let submissionCalls = 0
    view.render(
      createSelectedTestViewState({
        bank: {
          questions: [createAuthorQuestionFixture({ prompt: authorSentinel })],
          totalQuestionCount: 2,
        },
        runner: {
          phase: 'active',
          questionCount: 2,
          testSession: publicSession,
          answers: {
            'question-public-one': 'option-public-circle',
            'question-public-two': 'option-public-wave',
          },
        },
      }),
      {
        onSubmitModuleTest() {
          submissionCalls += 1
        },
      }
    )
    const runnerForm = findByClass(
      root,
      'learning-hub-test-runner__form'
    )[0]
    const submitButton = findButton(runnerForm, 'Test auswerten')
    assert.equal(submitButton.disabled, false)
    runnerForm.dispatchEvent({ type: 'submit' })
    runnerForm.dispatchEvent({ type: 'submit' })
    assert.equal(submissionCalls, 1)
    assert.equal(runnerForm.getAttribute('aria-busy'), 'true')
    assert.equal(submitButton.disabled, true)
    assert.ok(
      findByClass(runnerForm, 'learning-hub-test-runner__radio')
        .every((radio) => radio.disabled)
    )
  })
})

test('Lokaler Mock-Test zeigt Grenzen, Leerzustand und fokussierbaren Start', () => {
  withLearningHubView(({ document, root, view }) => {
    view.render(createSelectedTestViewState())
    const testCard = findByClass(root, 'learning-hub-local-test')[0]
    assert.equal(
      testCard.getAttribute('aria-labelledby'),
      'learning-hub-local-test-title'
    )
    assert.ok(testCard.textContent.includes('deterministischer Reihenfolge'))
    assert.ok(testCard.textContent.includes('keine KI'))
    assert.ok(testCard.textContent.includes('aktuellen Browserprofil'))
    assert.ok(testCard.textContent.includes('bei einem Reload verloren'))
    assert.ok(testCard.textContent.includes('0 verfügbare Fragen'))
    assert.ok(testCard.textContent.includes('noch keine Testfragen'))
    assert.equal(findButton(testCard, 'Modultest starten').disabled, true)
    assert.ok(testCard.textContent.includes('Noch keine abgeschlossenen Versuche'))

    let startCalls = 0
    view.render(
      {
        ...createSelectedTestViewState({
          bank: {
            totalQuestionCount: 2,
          },
          runner: {
            questionCount: 2,
          },
        }),
        focusTarget: { type: 'testStart' },
      },
      {
        onStartModuleTest() {
          startCalls += 1
        },
      }
    )
    const startButton = findButton(root, 'Modultest starten')
    assert.equal(document.activeElement, startButton)
    assert.equal(startButton.disabled, false)
    startButton.click()
    assert.equal(startCalls, 1)
    assert.ok(root.textContent.includes('2 verfügbare Fragen'))

    view.render(createSelectedTestViewState({
      bank: {
        totalQuestionCount: 2,
      },
      runner: {
        phase: 'starting',
        questionCount: 2,
      },
    }))
    assert.equal(root.getAttribute('aria-busy'), 'true')
    assert.equal(
      findButton(root, 'Modultest wird gestartet …').disabled,
      true
    )
  })
})

test('Abgabefehler erhält Antworten und Retry, Inline-Abbruch bleibt kontrolliert', () => {
  withLearningHubView(({ document, root, view }) => {
    const publicSession = createPublicTestSession()
    let submitCalls = 0
    let openCancelCalls = 0
    view.render(
      {
        ...createSelectedTestViewState({
          bank: { totalQuestionCount: 2 },
          runner: {
            phase: 'active',
            questionCount: 2,
            testSession: publicSession,
            answers: {
              'question-public-one': 'option-public-circle',
              'question-public-two': 'option-public-wave',
            },
            retryPending: true,
            errorMessage:
              'Der synthetische Versuch konnte nicht gespeichert werden.',
          },
        }),
        focusTarget: { type: 'testSubmissionAlert' },
      },
      {
        onSubmitModuleTest() {
          submitCalls += 1
        },
        onOpenTestCancelConfirmation() {
          openCancelCalls += 1
        },
      }
    )
    const submissionAlert = findByClass(
      root,
      'learning-hub-test-feedback--error'
    ).find((element) => element.textContent.includes('synthetische Versuch'))
    assert.equal(document.activeElement, submissionAlert)
    assert.equal(submissionAlert.getAttribute('role'), 'alert')
    assert.ok(
      findByClass(root, 'learning-hub-test-runner__radio')
        .filter((radio) => radio.checked)
        .length === 2
    )
    assert.equal(
      findButton(root, 'Auswertung erneut versuchen').disabled,
      false
    )
    const retryCancelButton = findButton(root, 'Test abbrechen')
    assert.equal(retryCancelButton.disabled, false)
    const retryNote = findByClass(
      root,
      'learning-hub-test-runner__retry-note'
    )[0]
    assert.ok(
      retryNote.textContent.includes(
        'Ein kontrollierter Abbruch kann angefragt werden'
      )
    )
    assert.equal(
      retryNote.textContent.includes('kann jetzt nicht abgebrochen werden'),
      false
    )
    retryCancelButton.click()
    assert.equal(openCancelCalls, 1)
    const retryForm = findByClass(
      root,
      'learning-hub-test-runner__form'
    )[0]
    retryForm.dispatchEvent({ type: 'submit' })
    retryForm.dispatchEvent({ type: 'submit' })
    assert.equal(submitCalls, 1)

    let continueCalls = 0
    let cancelCalls = 0
    view.render(
      {
        ...createSelectedTestViewState({
          bank: { totalQuestionCount: 2 },
          runner: {
            phase: 'active',
            questionCount: 2,
            testSession: publicSession,
            answers: {
              'question-public-one': 'option-public-circle',
              'question-public-two': 'option-public-wave',
            },
            cancelConfirmation: true,
          },
        }),
        focusTarget: { type: 'testCancelConfirmation' },
      },
      {
        onContinueModuleTest() {
          continueCalls += 1
        },
        onConfirmModuleTestCancel() {
          cancelCalls += 1
        },
      }
    )
    const confirmation = findByClass(root, 'learning-hub-test-cancel')[0]
    assert.equal(
      findByTag(confirmation, 'legend')[0].textContent,
      'Laufenden Test abbrechen?'
    )
    assert.equal(
      document.activeElement,
      findButton(confirmation, 'Test fortsetzen')
    )
    assert.ok(confirmation.textContent.includes('kein Versuch gespeichert'))
    assert.equal(findByTag(confirmation, 'fieldset').length, 1)
    assert.ok(
      findByClass(root, 'learning-hub-test-runner__radio')
        .every((radio) => radio.disabled)
    )
    assert.equal(findButton(root, 'Test abbrechen').disabled, true)
    findButton(confirmation, 'Test fortsetzen').click()
    findButton(confirmation, 'Test jetzt abbrechen').click()
    assert.equal(continueCalls, 1)
    assert.equal(cancelCalls, 1)

    for (const phase of ['submitting', 'cancelling']) {
      view.render(createSelectedTestViewState({
        bank: { totalQuestionCount: 2 },
        runner: {
          phase,
          questionCount: 2,
          testSession: publicSession,
          answers: {
            'question-public-one': 'option-public-circle',
            'question-public-two': 'option-public-wave',
          },
          retryPending: true,
        },
      }))
      assert.equal(
        findButton(root, 'Test abbrechen').disabled,
        true,
        phase
      )
    }
  })
})

test('Ergebnis und Versuchshistorie bleiben redigiert, sicher und unabhängig retrybar', () => {
  withLearningHubView(({ document, root, view }) => {
    const promptSentinel = '<script>synthetic-result-prompt</script>'
    const optionSentinel = '<img src=x onerror=synthetic-result-option>'
    const explanationSentinel = '<strong>synthetic-result-explanation</strong>'
    const hiddenAttemptId = 'attempt-private-sentinel'
    const hiddenAnswerSentinel = 'answer-private-sentinel'
    const result = createCompletedTestResult({
      questions: [
        {
          prompt: promptSentinel,
          options: [
            {
              label: optionSentinel,
              isSelected: true,
              isCorrect: false,
            },
            {
              label: 'Sichere synthetische Antwort',
              isSelected: false,
              isCorrect: true,
            },
          ],
          isCorrect: false,
          explanation: explanationSentinel,
        },
      ],
      correctAnswerCount: 0,
      scorePercent: 0,
    })
    const attempts = [
      {
        completedAt: '2026-07-20T08:05:00.000Z',
        correctAnswerCount: 0,
        totalQuestionCount: 1,
        scorePercent: 0,
        attemptId: hiddenAttemptId,
        answers: hiddenAnswerSentinel,
      },
      {
        completedAt: '2026-07-20T09:10:00.000Z',
        correctAnswerCount: 1,
        totalQuestionCount: 1,
        scorePercent: 100,
      },
    ]
    view.render({
      ...createSelectedTestViewState({
        bank: { totalQuestionCount: 1 },
        runner: {
          phase: 'completed',
          questionCount: 1,
          result,
        },
        history: {
          attempts,
        },
      }),
      focusTarget: { type: 'testResultHeading' },
    })
    const resultSection = findByClass(root, 'learning-hub-test-result')[0]
    const resultHeading = findByTag(resultSection, 'h3')[0]
    assert.equal(document.activeElement, resultHeading)
    assert.equal(resultSection.getAttribute('aria-live'), 'polite')
    assert.ok(resultSection.textContent.includes('0 von 1 richtig · 0 %'))
    assert.ok(resultSection.textContent.includes(promptSentinel))
    assert.ok(resultSection.textContent.includes(optionSentinel))
    assert.ok(resultSection.textContent.includes(explanationSentinel))
    assert.ok(resultSection.textContent.includes('Deine Auswahl'))
    assert.ok(resultSection.textContent.includes('Korrekte Auswahl'))
    assert.equal(findByTag(resultSection, 'script').length, 0)
    assert.equal(findByTag(resultSection, 'img').length, 0)
    assert.equal(findByTag(resultSection, 'strong').some(
      (element) => element.textContent === 'synthetic-result-explanation'
    ), false)
    const historyEntries = findByClass(
      root,
      'learning-hub-test-history__attempt'
    )
    assert.equal(historyEntries.length, 2)
    assert.ok(historyEntries[0].textContent.includes('0 von 1 richtig'))
    assert.ok(historyEntries[0].textContent.includes('0 %'))
    assert.ok(historyEntries[1].textContent.includes('1 von 1 richtig'))
    assert.ok(historyEntries[1].textContent.includes('100 %'))
    assert.equal(root.textContent.includes(hiddenAttemptId), false)
    assert.equal(root.textContent.includes(hiddenAnswerSentinel), false)

    view.render(createSelectedTestViewState({
      bank: { totalQuestionCount: 1 },
      runner: {
        phase: 'completed',
        questionCount: 1,
        result,
      },
      history: {
        phase: 'loading',
      },
    }))
    assert.equal(root.getAttribute('aria-busy'), 'true')
    assert.equal(findByClass(root, 'learning-hub-test-result').length, 1)
    assert.equal(
      findByClass(root, 'learning-hub-test-history__state')[0]
        .getAttribute('role'),
      'status'
    )

    let retryCalls = 0
    view.render(
      {
        ...createSelectedTestViewState({
          bank: { totalQuestionCount: 1 },
          runner: {
            phase: 'completed',
            questionCount: 1,
            result,
          },
          history: {
            phase: 'unavailable',
            errorMessage:
              'Die synthetische Versuchshistorie konnte nicht geladen werden.',
          },
        }),
        focusTarget: { type: 'attemptHistoryAlert' },
      },
      {
        onRetryAttemptHistory() {
          retryCalls += 1
        },
      }
    )
    const historyAlert = findByClass(
      root,
      'learning-hub-test-history__state--error'
    )[0]
    assert.equal(document.activeElement, historyAlert)
    assert.equal(historyAlert.getAttribute('role'), 'alert')
    assert.equal(findByClass(root, 'learning-hub-test-result').length, 1)
    findButton(historyAlert, 'Versuchshistorie erneut laden').click()
    assert.equal(retryCalls, 1)
  })
})

test('Artefakt-CSS definiert Zwei-Spalten-, Text- und 390px-Regeln', () => {
  const stylesheet = readFileSync(
    new URL(
      '../src/modules/learning-hub/learningHub.css',
      import.meta.url
    ),
    'utf8'
  )
  const tabletStart = stylesheet.indexOf('@media(max-width: 760px)')
  const mobileStart = stylesheet.indexOf('@media(max-width: 390px)')
  const reducedMotionStart = stylesheet.indexOf(
    '@media(prefers-reduced-motion: reduce)'
  )
  const tabletRules = stylesheet.slice(tabletStart, mobileStart)
  const mobileRules = stylesheet.slice(mobileStart, reducedMotionStart)

  assert.match(
    stylesheet,
    /\.learning-hub-artifact-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s
  )
  assert.match(
    stylesheet,
    /\.learning-hub-artifact-card__content,[^{]*\{[^}]*white-space:\s*pre-wrap;[^}]*overflow-wrap:\s*anywhere;[^}]*word-break:\s*break-word;/s
  )
  assert.ok(tabletStart >= 0)
  assert.match(tabletRules, /\.learning-hub-artifact-grid/)
  assert.match(
    tabletRules,
    /grid-template-columns:\s*minmax\(0,\s*1fr\);/
  )
  assert.ok(mobileStart >= 0)
  assert.match(mobileRules, /\.learning-hub-artifacts \.button/)
  assert.match(
    mobileRules,
    /\.learning-hub-artifact-form__control/
  )
  assert.match(mobileRules, /min-height:\s*44px;/)
  assert.match(
    mobileRules,
    /\.learning-hub-artifact-confirmation[^}]*max-width:\s*100%;/s
  )
})

test('LearningTest-CSS bewahrt Touch-Ziele, Umbruch und responsive Anordnung', () => {
  const stylesheet = readFileSync(
    new URL(
      '../src/modules/learning-hub/learningHub.css',
      import.meta.url
    ),
    'utf8'
  )
  const tabletStart = stylesheet.indexOf('@media(max-width: 760px)')
  const compactStart = stylesheet.indexOf('@media(max-width: 620px)')
  const mobileStart = stylesheet.indexOf('@media(max-width: 390px)')
  const reducedMotionStart = stylesheet.indexOf(
    '@media(prefers-reduced-motion: reduce)'
  )
  const tabletRules = stylesheet.slice(tabletStart, compactStart)
  const compactRules = stylesheet.slice(compactStart, mobileStart)
  const mobileRules = stylesheet.slice(mobileStart, reducedMotionStart)
  const reducedMotionRules = stylesheet.slice(reducedMotionStart)

  assert.match(stylesheet, /\.learning-hub-local-test\s*\{/)
  assert.match(
    stylesheet,
    /\.learning-hub-test-questions \.button,\s*\.learning-hub-local-test \.button\s*\{[^}]*min-height:\s*44px;/s
  )
  assert.match(
    stylesheet,
    /\.learning-hub-question-option__correct,\s*\.learning-hub-test-runner__option\s*\{[^}]*overflow-wrap:\s*anywhere;[^}]*word-break:\s*break-word;/s
  )
  assert.match(
    stylesheet,
    /\.learning-hub-author-question h6,\s*\.learning-hub-author-question__option,\s*\.learning-hub-author-question__explanation\s*\{[^}]*overflow-wrap:\s*anywhere;[^}]*word-break:\s*break-word;/s
  )

  assert.ok(tabletStart >= 0)
  assert.match(tabletRules, /\.learning-hub-local-test__facts/)
  assert.match(
    tabletRules,
    /grid-template-columns:\s*minmax\(0,\s*1fr\);/
  )

  assert.ok(compactStart >= 0)
  assert.match(
    compactRules,
    /\.learning-hub-local-test__start,[^{]*\.learning-hub-test-runner__actions,[^{]*\.learning-hub-test-cancel__actions[^{]*\{[^}]*flex-direction:\s*column;/s
  )
  assert.match(
    compactRules,
    /\.learning-hub-local-test__start \.button,[^{]*\.learning-hub-test-runner__actions \.button,[^{]*\.learning-hub-test-cancel__actions \.button[^{]*\{[^}]*width:\s*100%;/s
  )

  assert.ok(mobileStart >= 0)
  assert.match(
    mobileRules,
    /\.learning-hub-local-test \.button,[^{]*\.learning-hub-question-option__correct,[^{]*\.learning-hub-test-runner__option[^{]*\{[^}]*min-height:\s*44px;/s
  )
  assert.match(
    mobileRules,
    /\.learning-hub-test-questions,[^{]*\.learning-hub-local-test,[^{]*\.learning-hub-test-runner,[^{]*\.learning-hub-test-history[^{]*\{[^}]*width:\s*100%;[^}]*max-width:\s*100%;/s
  )
  assert.match(
    mobileRules,
    /\.learning-hub-local-test__header h2,[^{]*\.learning-hub-test-runner__option,[^{]*\.learning-hub-test-result-question__option,[^{]*\.learning-hub-test-history__attempt[^{]*\{[^}]*overflow-wrap:\s*anywhere;[^}]*word-break:\s*break-word;/s
  )

  assert.ok(reducedMotionStart >= 0)
  assert.match(
    reducedMotionRules,
    /\.learning-hub-loading-indicator\s*\{[^}]*animation:\s*none;/s
  )
})
