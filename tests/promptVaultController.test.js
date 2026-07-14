import assert from 'node:assert/strict'
import test from 'node:test'

import { createPromptVaultController } from '../src/modules/prompt-vault/promptVaultController.js'

const examplePrompt = {
  id: 'prompt-example-001',
  title: 'Beispielprompt',
  description: 'Ein synthetischer Prompt für den Controller-Test.',
  category: 'Test',
  content: 'Prüfe [THEMA].',
  isFavorite: false,
}

const editableDemoPrompt = {
  ...examplePrompt,
  id: 'prompt-demo-edit-001',
  title: 'Bearbeitbarer Beispielprompt',
  category: 'Lernen',
  description: 'Die Herkunft bleibt beim Bearbeiten erhalten.',
  content: 'Erkläre [THEMA] sicher.',
  createdAt: '2026-07-11T08:00:00.000Z',
  updatedAt: '2026-07-12T08:00:00.000Z',
  isFavorite: true,
  isDemo: true,
}

function createPromptVersion(
  versionNumber,
  {
    title,
    category = 'Reflexion',
    description,
    content,
    createdAt,
    changeType,
    restoredFromVersion = null,
  }
) {
  return {
    versionNumber,
    title,
    category,
    description,
    content,
    createdAt,
    changeType,
    restoredFromVersion,
  }
}

const historyPrompt = {
  id: 'prompt-history-001',
  title: 'Aktueller gemeinsamer Stand',
  category: 'Reflexion',
  description: 'Aktuelle gemeinsame Beschreibung',
  content: 'Aktuelle gemeinsame Fassung',
  createdAt: '2026-07-10T08:00:00.000Z',
  updatedAt: '2026-07-12T08:00:00.000Z',
  isFavorite: true,
  isDemo: false,
  versions: [
    createPromptVersion(1, {
      title: 'Ausgangsfassung gemeinsam',
      description: 'Erste gemeinsame Beschreibung',
      content: 'Erste gemeinsame Fassung',
      createdAt: '2026-07-10T08:00:00.000Z',
      changeType: 'created',
    }),
    createPromptVersion(2, {
      title: 'Zwischenfassung gemeinsam',
      description: 'Zweite gemeinsame Beschreibung',
      content: 'Zweite gemeinsame Fassung',
      createdAt: '2026-07-11T08:00:00.000Z',
      changeType: 'edited',
    }),
    createPromptVersion(3, {
      title: 'Aktueller gemeinsamer Stand',
      description: 'Aktuelle gemeinsame Beschreibung',
      content: 'Aktuelle gemeinsame Fassung',
      createdAt: '2026-07-12T08:00:00.000Z',
      changeType: 'edited',
    }),
  ],
}

function createRestoredHistoryPrompt(overrides = {}) {
  const restoredAt = '2026-07-13T08:00:00.000Z'
  const selectedVersion = historyPrompt.versions[0]

  return {
    ...historyPrompt,
    title: selectedVersion.title,
    category: selectedVersion.category,
    description: selectedVersion.description,
    content: selectedVersion.content,
    updatedAt: restoredAt,
    versions: [
      ...historyPrompt.versions.map((version) => ({ ...version })),
      createPromptVersion(4, {
        title: selectedVersion.title,
        category: selectedVersion.category,
        description: selectedVersion.description,
        content: selectedVersion.content,
        createdAt: restoredAt,
        changeType: 'restored',
        restoredFromVersion: 1,
      }),
    ],
    ...overrides,
  }
}

const filterPromptsFixture = [
  {
    id: 'prompt-learning-001',
    title: 'Lernstoff verständlich erklären',
    description: 'Ein Leitfaden für anschauliche Erklärungen.',
    category: 'Lernen',
    content: 'Erkläre das Thema mit einem konkreten Beispiel.',
    isFavorite: true,
  },
  {
    id: 'prompt-automation-001',
    title: 'Automatisierung planen',
    description: 'Sichere Abläufe und kontrollierte Fehlerpfade entwerfen.',
    category: 'Automatisierung',
    content: 'Beschreibe Auslöser, Verarbeitung und erwartete Ausgaben.',
    isFavorite: false,
  },
  {
    id: 'prompt-reflection-001',
    title: 'Wochenrückblick',
    description: 'Fortschritte und offene Entscheidungen reflektieren.',
    category: 'Reflexion',
    content: 'Leite höchstens drei konkrete nächste Schritte ab.',
    isFavorite: true,
  },
  {
    id: 'prompt-without-category-001',
    title: 'Minimaler Prompt',
    description: '',
    category: '',
    content: 'Fasse das Ergebnis kompakt zusammen.',
    isFavorite: false,
  },
]

function createManualScheduler() {
  let scheduledTask = null

  return {
    scheduleTask(task) {
      scheduledTask = task

      return () => {
        scheduledTask = null
      }
    },
    run() {
      const task = scheduledTask
      scheduledTask = null
      task?.()
    },
  }
}

function createViewRecorder() {
  return {
    actions: null,
    states: [],
    render(viewState, actions) {
      this.states.push(structuredClone(viewState))
      this.actions = actions
    },
    lastState() {
      return this.states.at(-1)
    },
  }
}

function openReadyController({ prompts, promptService = {} }) {
  const scheduler = createManualScheduler()
  const promptVaultView = createViewRecorder()
  const service = {
    loadPrompts: () => ({ ok: true, status: 'loaded', prompts }),
    ...promptService,
  }
  const controller = createPromptVaultController({
    promptService: service,
    promptVaultView,
    scheduleTask: scheduler.scheduleTask,
  })

  controller.open()
  scheduler.run()

  return {
    controller,
    promptVaultView,
    promptService: service,
    scheduler,
  }
}

function getPromptIds(prompts) {
  return prompts.map(({ id }) => id)
}

function getEditableValues(prompt, overrides = {}) {
  return {
    title: prompt.title,
    category: prompt.category,
    description: prompt.description,
    content: prompt.content,
    ...overrides,
  }
}

test('rendert vor dem Service-Aufruf einen Ladezustand', () => {
  const scheduler = createManualScheduler()
  const promptVaultView = createViewRecorder()
  let loadCalls = 0
  const promptService = {
    loadPrompts() {
      loadCalls += 1
      return {
        ok: true,
        status: 'loaded',
        prompts: [examplePrompt],
      }
    },
  }
  const controller = createPromptVaultController({
    promptService,
    promptVaultView,
    scheduleTask: scheduler.scheduleTask,
  })

  controller.open()

  assert.equal(loadCalls, 0)
  assert.equal(promptVaultView.lastState().phase, 'loading')

  scheduler.run()

  assert.equal(loadCalls, 1)
  assert.equal(promptVaultView.lastState().phase, 'ready')
  assert.deepEqual(promptVaultView.lastState().prompts, [examplePrompt])
})

test('öffnet und schließt das Erstellformular ohne Service-Aufruf', () => {
  const scheduler = createManualScheduler()
  const promptVaultView = createViewRecorder()
  let createCalls = 0
  const promptService = {
    loadPrompts: () => ({ ok: true, prompts: [] }),
    createPrompt() {
      createCalls += 1
      return { ok: true, prompts: [] }
    },
  }
  const controller = createPromptVaultController({
    promptService,
    promptVaultView,
    scheduleTask: scheduler.scheduleTask,
  })
  controller.open()
  scheduler.run()

  promptVaultView.actions.onOpenCreateForm('empty')

  assert.equal(promptVaultView.lastState().createForm.isOpen, true)
  assert.equal(promptVaultView.lastState().createForm.openedFrom, 'empty')
  assert.deepEqual(promptVaultView.lastState().focusTarget, {
    type: 'createTitle',
  })

  promptVaultView.actions.onCancelCreateForm()

  assert.equal(createCalls, 0)
  assert.equal(promptVaultView.lastState().createForm.isOpen, false)
  assert.deepEqual(promptVaultView.lastState().focusTarget, {
    type: 'emptyCreateButton',
  })
})

test('übernimmt nach erfolgreicher Erstellung nur die Service-Liste', () => {
  const scheduler = createManualScheduler()
  const promptVaultView = createViewRecorder()
  const createdPrompt = {
    ...examplePrompt,
    id: 'prompt-own-001',
    title: 'Eigener Prompt',
    isDemo: false,
  }
  let receivedInput
  const promptService = {
    loadPrompts: () => ({ ok: true, prompts: [examplePrompt] }),
    createPrompt(input) {
      receivedInput = input
      return {
        ok: true,
        status: 'created',
        createdPrompt,
        prompts: [createdPrompt, examplePrompt],
      }
    },
  }
  const controller = createPromptVaultController({
    promptService,
    promptVaultView,
    scheduleTask: scheduler.scheduleTask,
  })
  controller.open()
  scheduler.run()
  promptVaultView.actions.onOpenCreateForm('header')

  const formValues = {
    title: 'Eigener Prompt',
    category: 'Planung',
    description: 'Beschreibung',
    content: 'Mehrzeiliger\nPrompt-Text',
  }
  promptVaultView.actions.onSubmitCreateForm(formValues)

  assert.deepEqual(receivedInput, formValues)
  assert.deepEqual(promptVaultView.lastState().prompts, [
    createdPrompt,
    examplePrompt,
  ])
  assert.equal(promptVaultView.lastState().createForm.isOpen, false)
  assert.equal(promptVaultView.lastState().statusMessage, 'Prompt erstellt')
  assert.deepEqual(promptVaultView.lastState().focusTarget, {
    type: 'promptTitle',
    id: createdPrompt.id,
  })
})

test('zeigt Validierungsfehler am Formular und erhält Eingaben', () => {
  const scheduler = createManualScheduler()
  const promptVaultView = createViewRecorder()
  const promptService = {
    loadPrompts: () => ({ ok: true, prompts: [examplePrompt] }),
    createPrompt: () => ({
      ok: false,
      status: 'validationFailed',
      prompts: [],
      error: {
        code: 'invalidPromptInput',
        message: 'Bitte korrigiere die markierten Felder.',
        fieldErrors: {
          title: 'Bitte gib einen Titel ein.',
          content: 'Bitte gib einen Prompt-Text ein.',
        },
      },
    }),
  }
  const controller = createPromptVaultController({
    promptService,
    promptVaultView,
    scheduleTask: scheduler.scheduleTask,
  })
  controller.open()
  scheduler.run()
  promptVaultView.actions.onOpenCreateForm('header')

  const formValues = {
    title: '   ',
    category: 'Lernen',
    description: 'Bleibt erhalten',
    content: '',
  }
  promptVaultView.actions.onSubmitCreateForm(formValues)

  const validationState = promptVaultView.lastState()
  assert.equal(validationState.createForm.isOpen, true)
  assert.deepEqual(validationState.createForm.values, formValues)
  assert.deepEqual(validationState.createForm.fieldErrors, {
    title: 'Bitte gib einen Titel ein.',
    content: 'Bitte gib einen Prompt-Text ein.',
  })
  assert.deepEqual(validationState.focusTarget, {
    type: 'createField',
    fieldName: 'title',
  })
  assert.deepEqual(validationState.prompts, [examplePrompt])
})

test('erhält Formularwerte und Liste bei einem Erstell-Schreibfehler', () => {
  const scheduler = createManualScheduler()
  const promptVaultView = createViewRecorder()
  const promptService = {
    loadPrompts: () => ({ ok: true, prompts: [examplePrompt] }),
    createPrompt: () => ({
      ok: false,
      status: 'quotaExceeded',
      prompts: [examplePrompt],
      error: {
        code: 'storageQuotaExceeded',
        message: 'Simulierter Fehler',
      },
    }),
  }
  const controller = createPromptVaultController({
    promptService,
    promptVaultView,
    scheduleTask: scheduler.scheduleTask,
  })
  controller.open()
  scheduler.run()
  promptVaultView.actions.onOpenCreateForm('header')

  const formValues = {
    title: 'Nicht gespeicherter Prompt',
    category: 'Test',
    description: 'Alle Werte bleiben erhalten.',
    content: 'Prompt-Inhalt',
  }
  promptVaultView.actions.onSubmitCreateForm(formValues)

  const errorState = promptVaultView.lastState()
  assert.equal(errorState.createForm.isOpen, true)
  assert.deepEqual(errorState.createForm.values, formValues)
  assert.match(errorState.createForm.errorMessage, /nicht gespeichert/)
  assert.deepEqual(errorState.prompts, [examplePrompt])
  assert.equal(errorState.statusMessage, '')
  assert.deepEqual(errorState.focusTarget, {
    type: 'createAlert',
  })
})

test('löscht erst nach der endgültigen Inline-Bestätigung', () => {
  const scheduler = createManualScheduler()
  const promptVaultView = createViewRecorder()
  let deleteCalls = 0
  const promptService = {
    loadPrompts: () => ({ ok: true, prompts: [examplePrompt] }),
    deletePrompt(promptId) {
      deleteCalls += 1
      assert.equal(promptId, examplePrompt.id)
      return {
        ok: true,
        status: 'deleted',
        deletedPromptId: promptId,
        prompts: [],
      }
    },
  }
  const controller = createPromptVaultController({
    promptService,
    promptVaultView,
    scheduleTask: scheduler.scheduleTask,
  })
  controller.open()
  scheduler.run()

  promptVaultView.actions.onRequestDelete(examplePrompt.id)

  assert.equal(deleteCalls, 0)
  assert.equal(
    promptVaultView.lastState().pendingDeleteId,
    examplePrompt.id
  )

  promptVaultView.actions.onConfirmDelete(examplePrompt.id)

  assert.equal(deleteCalls, 1)
  assert.deepEqual(promptVaultView.lastState().prompts, [])
  assert.equal(promptVaultView.lastState().pendingDeleteId, null)
  assert.equal(promptVaultView.lastState().statusMessage, 'Prompt gelöscht')
})

test('bricht die Löschbestätigung ohne Service-Aufruf ab', () => {
  const scheduler = createManualScheduler()
  const promptVaultView = createViewRecorder()
  let deleteCalls = 0
  const promptService = {
    loadPrompts: () => ({ ok: true, prompts: [examplePrompt] }),
    deletePrompt() {
      deleteCalls += 1
      return { ok: true, prompts: [] }
    },
  }
  const controller = createPromptVaultController({
    promptService,
    promptVaultView,
    scheduleTask: scheduler.scheduleTask,
  })
  controller.open()
  scheduler.run()

  promptVaultView.actions.onRequestDelete(examplePrompt.id)
  promptVaultView.actions.onCancelDelete()

  assert.equal(deleteCalls, 0)
  assert.equal(promptVaultView.lastState().pendingDeleteId, null)
  assert.deepEqual(promptVaultView.lastState().prompts, [examplePrompt])
})

test('behält bei einem Speicherfehler Prompt und Bestätigung bei', () => {
  const scheduler = createManualScheduler()
  const promptVaultView = createViewRecorder()
  const promptService = {
    loadPrompts: () => ({ ok: true, prompts: [examplePrompt] }),
    deletePrompt: () => ({
      ok: false,
      status: 'quotaExceeded',
      prompts: [examplePrompt],
      error: {
        code: 'storageQuotaExceeded',
        message: 'Simulierter Fehler',
      },
    }),
  }
  const controller = createPromptVaultController({
    promptService,
    promptVaultView,
    scheduleTask: scheduler.scheduleTask,
  })
  controller.open()
  scheduler.run()

  promptVaultView.actions.onRequestDelete(examplePrompt.id)
  promptVaultView.actions.onConfirmDelete(examplePrompt.id)

  const errorState = promptVaultView.lastState()
  assert.deepEqual(errorState.prompts, [examplePrompt])
  assert.equal(errorState.pendingDeleteId, examplePrompt.id)
  assert.equal(errorState.deleteErrorId, examplePrompt.id)
  assert.match(errorState.errorMessage, /nicht gelöscht/)
})

test('leitet initial die vollständige und sichtbare Promptliste sowie Kategorien ab', () => {
  const { promptVaultView } = openReadyController({
    prompts: filterPromptsFixture,
  })

  const readyState = promptVaultView.lastState()

  assert.deepEqual(readyState.prompts, filterPromptsFixture)
  assert.deepEqual(readyState.visiblePrompts, filterPromptsFixture)
  assert.deepEqual(readyState.categories, [
    'Lernen',
    'Automatisierung',
    'Reflexion',
  ])
  assert.equal(readyState.searchQuery, '')
  assert.equal(readyState.selectedCategory, '')
  assert.equal(readyState.favoritesOnly, false)
  assert.equal(readyState.hasActiveFilters, false)
  assert.equal(readyState.filteredEmptyState, null)
})

test('filtert lokal nach Suche, Kategorie und Favoriten sowie kombiniert', () => {
  const { promptVaultView } = openReadyController({
    prompts: filterPromptsFixture,
  })

  promptVaultView.actions.onChangeSearchQuery('Fehlerpfade', 2, 8)

  assert.deepEqual(
    getPromptIds(promptVaultView.lastState().visiblePrompts),
    ['prompt-automation-001']
  )
  assert.equal(promptVaultView.lastState().searchQuery, 'Fehlerpfade')
  assert.equal(promptVaultView.lastState().hasActiveFilters, true)
  assert.deepEqual(promptVaultView.lastState().focusTarget, {
    type: 'searchInput',
    selectionStart: 2,
    selectionEnd: 8,
  })

  promptVaultView.actions.onResetFilters()
  promptVaultView.actions.onChangeCategory('Reflexion')

  assert.deepEqual(
    getPromptIds(promptVaultView.lastState().visiblePrompts),
    ['prompt-reflection-001']
  )
  assert.deepEqual(promptVaultView.lastState().focusTarget, {
    type: 'categoryFilter',
  })

  promptVaultView.actions.onResetFilters()
  promptVaultView.actions.onChangeFavoritesOnly(true)

  assert.deepEqual(
    getPromptIds(promptVaultView.lastState().visiblePrompts),
    ['prompt-learning-001', 'prompt-reflection-001']
  )
  assert.deepEqual(promptVaultView.lastState().focusTarget, {
    type: 'favoritesFilter',
  })

  promptVaultView.actions.onChangeSearchQuery('nächste')
  promptVaultView.actions.onChangeCategory('Reflexion')

  const combinedState = promptVaultView.lastState()
  assert.deepEqual(getPromptIds(combinedState.visiblePrompts), [
    'prompt-reflection-001',
  ])
  assert.equal(combinedState.searchQuery, 'nächste')
  assert.equal(combinedState.selectedCategory, 'Reflexion')
  assert.equal(combinedState.favoritesOnly, true)
})

test('setzt alle Filter zurück und stellt die vollständige Liste wieder her', () => {
  const { promptVaultView } = openReadyController({
    prompts: filterPromptsFixture,
  })

  promptVaultView.actions.onChangeSearchQuery('nächste')
  promptVaultView.actions.onChangeCategory('Reflexion')
  promptVaultView.actions.onChangeFavoritesOnly(true)
  promptVaultView.actions.onResetFilters()

  const resetState = promptVaultView.lastState()
  assert.equal(resetState.searchQuery, '')
  assert.equal(resetState.selectedCategory, '')
  assert.equal(resetState.favoritesOnly, false)
  assert.equal(resetState.hasActiveFilters, false)
  assert.equal(resetState.filteredEmptyState, null)
  assert.deepEqual(resetState.visiblePrompts, filterPromptsFixture)
  assert.deepEqual(resetState.focusTarget, {
    type: 'searchInput',
    selectionStart: 0,
    selectionEnd: 0,
  })
})

test('unterscheidet keine Treffer, keine Favoriten und einen tatsächlich leeren Vault', () => {
  const filteredController = openReadyController({
    prompts: filterPromptsFixture,
  })

  filteredController.promptVaultView.actions.onChangeSearchQuery(
    'nicht vorhanden'
  )

  const noMatchesState = filteredController.promptVaultView.lastState()
  assert.equal(noMatchesState.prompts.length, filterPromptsFixture.length)
  assert.deepEqual(noMatchesState.visiblePrompts, [])
  assert.equal(noMatchesState.filteredEmptyState, 'noMatches')

  const promptsWithoutFavorites = filterPromptsFixture.map((prompt) => ({
    ...prompt,
    isFavorite: false,
  }))
  const favoritesController = openReadyController({
    prompts: promptsWithoutFavorites,
  })

  favoritesController.promptVaultView.actions.onChangeFavoritesOnly(true)

  const noFavoritesState = favoritesController.promptVaultView.lastState()
  assert.equal(
    noFavoritesState.prompts.length,
    promptsWithoutFavorites.length
  )
  assert.deepEqual(noFavoritesState.visiblePrompts, [])
  assert.equal(noFavoritesState.filteredEmptyState, 'noFavorites')

  const emptyController = openReadyController({ prompts: [] })
  const emptyState = emptyController.promptVaultView.lastState()

  assert.deepEqual(emptyState.prompts, [])
  assert.deepEqual(emptyState.visiblePrompts, [])
  assert.deepEqual(emptyState.categories, [])
  assert.equal(emptyState.hasActiveFilters, false)
  assert.equal(emptyState.filteredEmptyState, null)
})

test('ruft durch Such- und Filteraktionen keinen Service erneut auf', () => {
  const serviceCalls = {
    load: 0,
    create: 0,
    delete: 0,
    favorite: 0,
    update: 0,
  }
  const { promptVaultView } = openReadyController({
    prompts: filterPromptsFixture,
    promptService: {
      loadPrompts() {
        serviceCalls.load += 1
        return { ok: true, status: 'loaded', prompts: filterPromptsFixture }
      },
      createPrompt() {
        serviceCalls.create += 1
        return { ok: true, prompts: filterPromptsFixture }
      },
      deletePrompt() {
        serviceCalls.delete += 1
        return { ok: true, prompts: filterPromptsFixture }
      },
      setPromptFavorite() {
        serviceCalls.favorite += 1
        return { ok: true, prompts: filterPromptsFixture }
      },
      updatePrompt() {
        serviceCalls.update += 1
        return { ok: true, prompts: filterPromptsFixture }
      },
    },
  })

  promptVaultView.actions.onChangeSearchQuery('Lernen')
  promptVaultView.actions.onChangeCategory('Lernen')
  promptVaultView.actions.onChangeFavoritesOnly(true)
  promptVaultView.actions.onResetFilters()

  assert.deepEqual(serviceCalls, {
    load: 1,
    create: 0,
    delete: 0,
    favorite: 0,
    update: 0,
  })
})

test('übergibt beim Favorisieren ID und expliziten Sollwert und übernimmt nur die Service-Liste', () => {
  const updatedAutomationPrompt = {
    ...filterPromptsFixture[1],
    title: 'Vom Service aktualisierte Automatisierung',
    isFavorite: true,
  }
  const servicePrompts = [
    filterPromptsFixture[2],
    updatedAutomationPrompt,
    filterPromptsFixture[0],
  ]
  const favoriteCalls = []
  const { promptVaultView } = openReadyController({
    prompts: filterPromptsFixture,
    promptService: {
      setPromptFavorite(promptId, isFavorite) {
        favoriteCalls.push([promptId, isFavorite])
        return {
          ok: true,
          status: 'favoriteUpdated',
          favoriteChanged: true,
          updatedPrompt: updatedAutomationPrompt,
          prompts: servicePrompts,
        }
      },
    },
  })

  promptVaultView.actions.onSetPromptFavorite(
    filterPromptsFixture[1].id,
    true
  )

  assert.deepEqual(favoriteCalls, [
    ['prompt-automation-001', true],
  ])
  const savingState = promptVaultView.states.at(-2)
  assert.equal(savingState.favoriteSavingId, 'prompt-automation-001')
  assert.equal(
    savingState.prompts.find(
      ({ id }) => id === 'prompt-automation-001'
    ).isFavorite,
    false
  )

  const successState = promptVaultView.lastState()
  assert.deepEqual(successState.prompts, servicePrompts)
  assert.deepEqual(successState.visiblePrompts, servicePrompts)
  assert.equal(successState.favoriteSavingId, null)
  assert.equal(successState.favoriteErrorId, null)
  assert.equal(successState.favoriteErrorMessage, '')
  assert.equal(successState.statusMessage, 'Zu Favoriten hinzugefügt')
  assert.deepEqual(successState.focusTarget, {
    type: 'favoriteButton',
    id: 'prompt-automation-001',
  })
})

test('bleibt bei einem identischen Favoriten-Servicezustand stabil', () => {
  const favoriteCalls = []
  const initialSnapshot = structuredClone(filterPromptsFixture)
  const { promptVaultView } = openReadyController({
    prompts: filterPromptsFixture,
    promptService: {
      setPromptFavorite(promptId, isFavorite) {
        favoriteCalls.push([promptId, isFavorite])
        return {
          ok: true,
          status: 'favoriteUpdated',
          favoriteChanged: false,
          updatedPrompt: filterPromptsFixture[0],
          prompts: filterPromptsFixture,
        }
      },
    },
  })

  promptVaultView.actions.onSetPromptFavorite(
    filterPromptsFixture[0].id,
    true
  )

  const stableState = promptVaultView.lastState()
  assert.deepEqual(favoriteCalls, [['prompt-learning-001', true]])
  assert.deepEqual(stableState.prompts, initialSnapshot)
  assert.deepEqual(stableState.visiblePrompts, initialSnapshot)
  assert.equal(stableState.favoriteSavingId, null)
  assert.equal(stableState.favoriteErrorId, null)
  assert.equal(stableState.statusMessage, 'Zu Favoriten hinzugefügt')
  assert.deepEqual(stableState.focusTarget, {
    type: 'favoriteButton',
    id: 'prompt-learning-001',
  })
  assert.deepEqual(filterPromptsFixture, initialSnapshot)
})

test('erhält bei einem Favoriten-Schreibfehler Liste, Filter und bisherigen Status', () => {
  const changedFailureList = filterPromptsFixture.map((prompt) =>
    prompt.id === 'prompt-learning-001'
      ? { ...prompt, isFavorite: false }
      : prompt
  )
  const { promptVaultView } = openReadyController({
    prompts: filterPromptsFixture,
    promptService: {
      setPromptFavorite: () => ({
        ok: false,
        status: 'quotaExceeded',
        prompts: changedFailureList,
        error: {
          code: 'storageQuotaExceeded',
          message: 'Simulierter Fehler',
        },
      }),
    },
  })

  promptVaultView.actions.onChangeSearchQuery('Lernstoff')
  promptVaultView.actions.onChangeCategory('Lernen')
  promptVaultView.actions.onChangeFavoritesOnly(true)
  const stateBeforeFailure = promptVaultView.lastState()

  promptVaultView.actions.onSetPromptFavorite(
    'prompt-learning-001',
    false
  )

  const savingState = promptVaultView.states.at(-2)
  assert.equal(savingState.favoriteSavingId, 'prompt-learning-001')
  assert.deepEqual(savingState.prompts, stateBeforeFailure.prompts)

  const errorState = promptVaultView.lastState()
  assert.deepEqual(errorState.prompts, stateBeforeFailure.prompts)
  assert.deepEqual(
    errorState.visiblePrompts,
    stateBeforeFailure.visiblePrompts
  )
  assert.equal(errorState.searchQuery, 'Lernstoff')
  assert.equal(errorState.selectedCategory, 'Lernen')
  assert.equal(errorState.favoritesOnly, true)
  assert.equal(
    errorState.prompts.find(
      ({ id }) => id === 'prompt-learning-001'
    ).isFavorite,
    true
  )
  assert.equal(errorState.favoriteSavingId, null)
  assert.equal(errorState.favoriteErrorId, 'prompt-learning-001')
  assert.match(errorState.favoriteErrorMessage, /freien Platz/)
  assert.equal(errorState.statusMessage, '')
  assert.deepEqual(errorState.focusTarget, {
    type: 'favoriteButton',
    id: 'prompt-learning-001',
  })
})

test('übersetzt blockierte und allgemeine Favoriten-Schreibfehler verständlich', () => {
  const errorCases = [
    {
      status: 'unavailable',
      errorCode: 'storageUnavailable',
      messagePattern: /nicht verfügbar/,
    },
    {
      status: 'writeFailed',
      errorCode: 'storageWriteFailed',
      messagePattern: /nicht lokal gespeichert/,
    },
  ]

  for (const errorCase of errorCases) {
    const initialPrompts = structuredClone(filterPromptsFixture)
    const { promptVaultView } = openReadyController({
      prompts: initialPrompts,
      promptService: {
        setPromptFavorite: () => ({
          ok: false,
          status: errorCase.status,
          prompts: initialPrompts,
          error: {
            code: errorCase.errorCode,
            message: 'Simulierter Fehler',
          },
        }),
      },
    })

    promptVaultView.actions.onSetPromptFavorite(
      'prompt-automation-001',
      true
    )

    const errorState = promptVaultView.lastState()
    assert.deepEqual(errorState.prompts, initialPrompts)
    assert.equal(errorState.favoriteErrorId, 'prompt-automation-001')
    assert.match(
      errorState.favoriteErrorMessage,
      errorCase.messagePattern
    )
    assert.deepEqual(errorState.focusTarget, {
      type: 'favoriteButton',
      id: 'prompt-automation-001',
    })
  }
})

test('entfernt einen Favoriten unter aktivem Favoritenfilter und setzt einen sinnvollen Fokus', () => {
  const remainingPrompts = filterPromptsFixture.map((prompt) => ({
    ...prompt,
    isFavorite: false,
  }))
  const { promptVaultView } = openReadyController({
    prompts: [
      filterPromptsFixture[0],
      {
        ...filterPromptsFixture[1],
        isFavorite: false,
      },
    ],
    promptService: {
      setPromptFavorite: () => ({
        ok: true,
        status: 'favoriteUpdated',
        favoriteChanged: true,
        updatedPrompt: {
          ...filterPromptsFixture[0],
          isFavorite: false,
        },
        prompts: remainingPrompts.slice(0, 2),
      }),
    },
  })

  promptVaultView.actions.onChangeFavoritesOnly(true)
  promptVaultView.actions.onSetPromptFavorite(
    'prompt-learning-001',
    false
  )

  const successState = promptVaultView.lastState()
  assert.deepEqual(successState.visiblePrompts, [])
  assert.equal(successState.filteredEmptyState, 'noFavorites')
  assert.equal(successState.statusMessage, 'Aus Favoriten entfernt')
  assert.deepEqual(successState.focusTarget, {
    type: 'favoritesFilter',
  })
})

test('übernimmt eine Erstellung unter aktiven Filtern auch bei unsichtbarem neuen Prompt', () => {
  const existingPrompt = filterPromptsFixture[0]
  const createdPrompt = {
    id: 'prompt-learning-hidden-002',
    title: 'Neuer Übungsprompt',
    description: 'Wird wegen der aktiven Suche zunächst nicht angezeigt.',
    category: 'Lernen',
    content: 'Erstelle fünf Übungsfragen.',
    isFavorite: false,
  }
  const servicePrompts = [createdPrompt, existingPrompt]
  const { promptVaultView } = openReadyController({
    prompts: [existingPrompt],
    promptService: {
      createPrompt: () => ({
        ok: true,
        status: 'created',
        createdPrompt,
        prompts: servicePrompts,
      }),
    },
  })

  promptVaultView.actions.onChangeSearchQuery('Lernstoff')
  promptVaultView.actions.onChangeCategory('Lernen')
  promptVaultView.actions.onOpenCreateForm('header')
  promptVaultView.actions.onSubmitCreateForm({
    title: createdPrompt.title,
    category: createdPrompt.category,
    description: createdPrompt.description,
    content: createdPrompt.content,
  })

  const createdState = promptVaultView.lastState()
  assert.deepEqual(createdState.prompts, servicePrompts)
  assert.deepEqual(createdState.visiblePrompts, [existingPrompt])
  assert.equal(createdState.searchQuery, 'Lernstoff')
  assert.equal(createdState.selectedCategory, 'Lernen')
  assert.equal(createdState.favoritesOnly, false)
  assert.equal(createdState.hasActiveFilters, true)
  assert.equal(createdState.statusMessage, 'Prompt erstellt')
  assert.equal(createdState.createForm.isOpen, false)
  assert.deepEqual(createdState.focusTarget, {
    type: 'contentHeading',
  })
})

test('löscht einen Favoriten unter aktivem Favoritenfilter aus der sichtbaren Liste', () => {
  const remainingPrompts = [
    filterPromptsFixture[1],
    filterPromptsFixture[2],
  ]
  const { promptVaultView } = openReadyController({
    prompts: filterPromptsFixture.slice(0, 3),
    promptService: {
      deletePrompt: () => ({
        ok: true,
        status: 'deleted',
        deletedPromptId: 'prompt-learning-001',
        prompts: remainingPrompts,
      }),
    },
  })

  promptVaultView.actions.onChangeFavoritesOnly(true)
  promptVaultView.actions.onRequestDelete('prompt-learning-001')
  promptVaultView.actions.onConfirmDelete('prompt-learning-001')

  const deletedState = promptVaultView.lastState()
  assert.deepEqual(deletedState.prompts, remainingPrompts)
  assert.deepEqual(getPromptIds(deletedState.visiblePrompts), [
    'prompt-reflection-001',
  ])
  assert.equal(deletedState.favoritesOnly, true)
  assert.equal(deletedState.hasActiveFilters, true)
  assert.equal(deletedState.statusMessage, 'Prompt gelöscht')
  assert.deepEqual(deletedState.focusTarget, {
    type: 'contentHeading',
  })
})

test('setzt eine verschwundene ausgewählte Kategorie nach dem Löschen zurück', () => {
  const remainingPrompts = [
    filterPromptsFixture[1],
    filterPromptsFixture[2],
  ]
  const { promptVaultView } = openReadyController({
    prompts: filterPromptsFixture.slice(0, 3),
    promptService: {
      deletePrompt: () => ({
        ok: true,
        status: 'deleted',
        deletedPromptId: 'prompt-learning-001',
        prompts: remainingPrompts,
      }),
    },
  })

  promptVaultView.actions.onChangeCategory('Lernen')
  promptVaultView.actions.onRequestDelete('prompt-learning-001')
  promptVaultView.actions.onConfirmDelete('prompt-learning-001')

  const deletedState = promptVaultView.lastState()
  assert.deepEqual(deletedState.prompts, remainingPrompts)
  assert.deepEqual(deletedState.categories, [
    'Automatisierung',
    'Reflexion',
  ])
  assert.equal(deletedState.selectedCategory, '')
  assert.equal(deletedState.hasActiveFilters, false)
  assert.deepEqual(deletedState.visiblePrompts, remainingPrompts)
  assert.equal(deletedState.filteredEmptyState, null)
})

test('stellt nach Schließen und erneutem Öffnen den lokalen Filterstandard her', () => {
  const {
    controller,
    promptVaultView,
    scheduler,
  } = openReadyController({
    prompts: filterPromptsFixture,
  })

  promptVaultView.actions.onChangeSearchQuery('nächste')
  promptVaultView.actions.onChangeCategory('Reflexion')
  promptVaultView.actions.onChangeFavoritesOnly(true)
  controller.close()
  controller.open()

  const loadingState = promptVaultView.lastState()
  assert.equal(loadingState.phase, 'loading')
  assert.equal(loadingState.searchQuery, '')
  assert.equal(loadingState.selectedCategory, '')
  assert.equal(loadingState.favoritesOnly, false)

  scheduler.run()

  const reopenedState = promptVaultView.lastState()
  assert.equal(reopenedState.phase, 'ready')
  assert.equal(reopenedState.searchQuery, '')
  assert.equal(reopenedState.selectedCategory, '')
  assert.equal(reopenedState.favoritesOnly, false)
  assert.equal(reopenedState.hasActiveFilters, false)
  assert.deepEqual(reopenedState.visiblePrompts, filterPromptsFixture)
})

test('öffnet und wechselt ein vorbelegtes Bearbeitungsformular ohne Service-Aufruf', () => {
  let updateCalls = 0
  const { promptVaultView } = openReadyController({
    prompts: [examplePrompt, editableDemoPrompt],
    promptService: {
      updatePrompt() {
        updateCalls += 1
        return { ok: true, prompts: [] }
      },
    },
  })

  promptVaultView.actions.onOpenEditForm(examplePrompt.id)

  const ownEditState = promptVaultView.lastState()
  assert.equal(ownEditState.editForm.isOpen, true)
  assert.equal(ownEditState.editForm.editingPromptId, examplePrompt.id)
  assert.deepEqual(
    ownEditState.editForm.values,
    getEditableValues(examplePrompt)
  )
  assert.deepEqual(Object.keys(ownEditState.editForm.values), [
    'title',
    'category',
    'description',
    'content',
  ])
  assert.deepEqual(ownEditState.focusTarget, {
    type: 'editTitle',
    id: examplePrompt.id,
  })

  promptVaultView.actions.onOpenEditForm(editableDemoPrompt.id)

  const demoEditState = promptVaultView.lastState()
  assert.equal(demoEditState.editForm.isOpen, true)
  assert.equal(
    demoEditState.editForm.editingPromptId,
    editableDemoPrompt.id
  )
  assert.deepEqual(
    demoEditState.editForm.values,
    getEditableValues(editableDemoPrompt)
  )
  assert.equal(
    Object.hasOwn(demoEditState.editForm.values, 'isDemo'),
    false
  )
  assert.equal(
    Object.hasOwn(demoEditState.editForm.values, 'isFavorite'),
    false
  )
  assert.equal(updateCalls, 0)
})

test('schließt Erstellen, Bearbeiten und Löschen gegenseitig kontrolliert aus', () => {
  const { promptVaultView } = openReadyController({
    prompts: [examplePrompt, editableDemoPrompt],
  })

  promptVaultView.actions.onOpenCreateForm('header')
  promptVaultView.actions.onOpenEditForm(editableDemoPrompt.id)

  let state = promptVaultView.lastState()
  assert.equal(state.createForm.isOpen, false)
  assert.equal(state.editForm.isOpen, true)
  assert.equal(state.pendingDeleteId, null)

  promptVaultView.actions.onRequestDelete(examplePrompt.id)

  state = promptVaultView.lastState()
  assert.equal(state.editForm.isOpen, false)
  assert.equal(state.createForm.isOpen, false)
  assert.equal(state.pendingDeleteId, examplePrompt.id)

  promptVaultView.actions.onOpenEditForm(editableDemoPrompt.id)

  state = promptVaultView.lastState()
  assert.equal(state.editForm.isOpen, true)
  assert.equal(state.pendingDeleteId, null)

  promptVaultView.actions.onOpenCreateForm('header')

  state = promptVaultView.lastState()
  assert.equal(state.createForm.isOpen, true)
  assert.equal(state.editForm.isOpen, false)
})

test('hält Filter und den aktuellen Favoriten während der Bearbeitung stabil', () => {
  let favoriteCalls = 0
  const { promptVaultView } = openReadyController({
    prompts: [editableDemoPrompt, examplePrompt],
    promptService: {
      setPromptFavorite() {
        favoriteCalls += 1
        return { ok: true, prompts: [] }
      },
    },
  })

  promptVaultView.actions.onChangeSearchQuery('Bearbeitbarer')
  promptVaultView.actions.onChangeCategory('Lernen')
  promptVaultView.actions.onChangeFavoritesOnly(true)
  promptVaultView.actions.onOpenEditForm(editableDemoPrompt.id)

  const renderCount = promptVaultView.states.length
  promptVaultView.actions.onChangeSearchQuery('Keine Treffer')
  promptVaultView.actions.onChangeCategory('Test')
  promptVaultView.actions.onChangeFavoritesOnly(false)
  promptVaultView.actions.onResetFilters()
  promptVaultView.actions.onSetPromptFavorite(
    editableDemoPrompt.id,
    false
  )

  const state = promptVaultView.lastState()
  assert.equal(promptVaultView.states.length, renderCount)
  assert.equal(favoriteCalls, 0)
  assert.equal(state.searchQuery, 'Bearbeitbarer')
  assert.equal(state.selectedCategory, 'Lernen')
  assert.equal(state.favoritesOnly, true)
  assert.deepEqual(state.visiblePrompts, [editableDemoPrompt])
  assert.equal(state.editForm.isOpen, true)
  assert.equal(
    state.editForm.editingPromptId,
    editableDemoPrompt.id
  )
})

test('bricht die Bearbeitung ohne Daten- oder Serviceänderung ab', () => {
  let updateCalls = 0
  const initialPrompts = [editableDemoPrompt, examplePrompt]
  const { promptVaultView } = openReadyController({
    prompts: initialPrompts,
    promptService: {
      updatePrompt() {
        updateCalls += 1
        return { ok: true, prompts: [] }
      },
    },
  })

  promptVaultView.actions.onOpenEditForm(editableDemoPrompt.id)
  promptVaultView.actions.onUpdateEditField(
    'title',
    'Nicht gespeicherter Titel'
  )
  promptVaultView.actions.onCancelEditForm()

  const cancelledState = promptVaultView.lastState()
  assert.equal(updateCalls, 0)
  assert.equal(cancelledState.editForm.isOpen, false)
  assert.equal(cancelledState.editForm.editingPromptId, null)
  assert.deepEqual(cancelledState.editForm.values, {
    title: '',
    category: '',
    description: '',
    content: '',
  })
  assert.deepEqual(cancelledState.prompts, initialPrompts)
  assert.deepEqual(cancelledState.focusTarget, {
    type: 'editButton',
    id: editableDemoPrompt.id,
  })
})

test('übergibt exakt ID und vier Felder und übernimmt nur die Service-Liste', () => {
  const updatedDemoPrompt = {
    ...editableDemoPrompt,
    title: 'Vom Service aktualisierter Beispielprompt',
    category: 'Reflexion',
    description: 'Aktualisierte Beschreibung',
    content: 'Aktualisierter Prompt-Text',
    updatedAt: '2026-07-13T08:00:00.000Z',
  }
  const servicePrompts = [updatedDemoPrompt, examplePrompt]
  const updateCalls = []
  const { promptVaultView } = openReadyController({
    prompts: [examplePrompt, editableDemoPrompt],
    promptService: {
      updatePrompt(promptId, values) {
        updateCalls.push([promptId, values])
        return {
          ok: true,
          status: 'updated',
          promptChanged: true,
          updatedPrompt: updatedDemoPrompt,
          prompts: servicePrompts,
        }
      },
    },
  })
  const submittedValues = {
    ...getEditableValues(updatedDemoPrompt),
    id: 'prompt-injected',
    isFavorite: false,
    isDemo: false,
    createdAt: '2000-01-01T00:00:00.000Z',
    updatedAt: '2099-01-01T00:00:00.000Z',
  }

  promptVaultView.actions.onOpenEditForm(editableDemoPrompt.id)
  promptVaultView.actions.onSubmitEditForm(
    editableDemoPrompt.id,
    submittedValues
  )

  assert.deepEqual(updateCalls, [
    [
      editableDemoPrompt.id,
      getEditableValues(updatedDemoPrompt),
    ],
  ])
  const savingState = promptVaultView.states.at(-2)
  assert.equal(savingState.editForm.isSubmitting, true)
  assert.deepEqual(savingState.prompts, [
    examplePrompt,
    editableDemoPrompt,
  ])

  const successState = promptVaultView.lastState()
  assert.deepEqual(successState.prompts, servicePrompts)
  assert.deepEqual(successState.visiblePrompts, servicePrompts)
  assert.equal(successState.editForm.isOpen, false)
  assert.equal(successState.statusMessage, 'Prompt aktualisiert')
  assert.equal(successState.prompts[0].id, editableDemoPrompt.id)
  assert.equal(successState.prompts[0].isFavorite, true)
  assert.equal(successState.prompts[0].isDemo, true)
  assert.equal(
    successState.prompts[0].createdAt,
    editableDemoPrompt.createdAt
  )
  assert.deepEqual(successState.focusTarget, {
    type: 'promptTitle',
    id: editableDemoPrompt.id,
  })
})

test('meldet einen erfolgreichen Bearbeitungs-No-op wahrheitsgemäß', () => {
  const initialPrompts = [editableDemoPrompt]
  const { promptVaultView } = openReadyController({
    prompts: initialPrompts,
    promptService: {
      updatePrompt: () => ({
        ok: true,
        status: 'updated',
        promptChanged: false,
        updatedPrompt: editableDemoPrompt,
        prompts: initialPrompts,
      }),
    },
  })

  promptVaultView.actions.onOpenEditForm(editableDemoPrompt.id)
  promptVaultView.actions.onSubmitEditForm(
    editableDemoPrompt.id,
    getEditableValues(editableDemoPrompt)
  )

  const noOpState = promptVaultView.lastState()
  assert.deepEqual(noOpState.prompts, initialPrompts)
  assert.equal(noOpState.editForm.isOpen, false)
  assert.equal(
    noOpState.statusMessage,
    'Keine Änderungen erforderlich'
  )
  assert.deepEqual(noOpState.focusTarget, {
    type: 'promptTitle',
    id: editableDemoPrompt.id,
  })
})

test('erhält Bearbeitungswerte und fokussiert den ersten Feldfehler', () => {
  const initialPrompts = [editableDemoPrompt, examplePrompt]
  const failurePrompts = [examplePrompt]
  const { promptVaultView } = openReadyController({
    prompts: initialPrompts,
    promptService: {
      updatePrompt: () => ({
        ok: false,
        status: 'validationFailed',
        prompts: failurePrompts,
        error: {
          code: 'invalidPromptInput',
          message: 'Bitte korrigiere die markierten Felder.',
          fieldErrors: {
            title: 'Bitte gib einen Titel ein.',
            content: 'Bitte gib einen Prompt-Text ein.',
            id: 'Darf nicht in die View gelangen.',
          },
        },
      }),
    },
  })
  const submittedValues = getEditableValues(editableDemoPrompt, {
    title: '   ',
    category: 'Lernen',
    description: '<script>bleibt als Text</script>',
    content: '',
  })

  promptVaultView.actions.onChangeCategory('Lernen')
  promptVaultView.actions.onOpenEditForm(editableDemoPrompt.id)
  promptVaultView.actions.onSubmitEditForm(
    editableDemoPrompt.id,
    submittedValues
  )

  const validationState = promptVaultView.lastState()
  assert.equal(validationState.editForm.isOpen, true)
  assert.equal(validationState.editForm.isSubmitting, false)
  assert.equal(
    validationState.editForm.editingPromptId,
    editableDemoPrompt.id
  )
  assert.deepEqual(validationState.editForm.values, submittedValues)
  assert.deepEqual(validationState.editForm.fieldErrors, {
    title: 'Bitte gib einen Titel ein.',
    content: 'Bitte gib einen Prompt-Text ein.',
  })
  assert.deepEqual(validationState.prompts, initialPrompts)
  assert.equal(validationState.selectedCategory, 'Lernen')
  assert.equal(validationState.statusMessage, '')
  assert.deepEqual(validationState.focusTarget, {
    type: 'editField',
    id: editableDemoPrompt.id,
    fieldName: 'title',
  })
})

test('erhält Formular, Liste und Filter bei Bearbeitungsfehlern', () => {
  const errorCases = [
    {
      status: 'quotaExceeded',
      errorCode: 'storageQuotaExceeded',
      messagePattern: /freien Platz/,
    },
    {
      status: 'unavailable',
      errorCode: 'storageUnavailable',
      messagePattern: /nicht verfügbar/,
    },
    {
      status: 'readFailed',
      errorCode: 'storageReadFailed',
      messagePattern: /nicht gelesen/,
    },
    {
      status: 'writeFailed',
      errorCode: 'storageWriteFailed',
      messagePattern: /nicht lokal aktualisiert/,
    },
    {
      status: 'generationFailed',
      errorCode: 'promptTimestampGenerationFailed',
      messagePattern: /Zeitstempel/,
    },
    {
      status: 'invalidJson',
      errorCode: 'invalidJson',
      messagePattern: /beschädigt/,
    },
    {
      status: 'invalidStoredData',
      errorCode: 'invalidPromptData',
      messagePattern: /ungültige Struktur/,
    },
    {
      status: 'unsupportedSchemaVersion',
      errorCode: 'unsupportedSchemaVersion',
      messagePattern: /noch nicht unterstützt/,
    },
  ]

  for (const errorCase of errorCases) {
    const initialPrompts = [editableDemoPrompt, examplePrompt]
    const { promptVaultView } = openReadyController({
      prompts: initialPrompts,
      promptService: {
        updatePrompt: () => ({
          ok: false,
          status: errorCase.status,
          prompts: [examplePrompt],
          error: {
            code: errorCase.errorCode,
            message: 'Simulierter Servicefehler',
          },
        }),
      },
    })
    const submittedValues = getEditableValues(editableDemoPrompt, {
      title: 'Nicht gespeicherte Änderung',
    })

    promptVaultView.actions.onChangeSearchQuery('Bearbeitbarer')
    promptVaultView.actions.onChangeCategory('Lernen')
    promptVaultView.actions.onChangeFavoritesOnly(true)
    promptVaultView.actions.onOpenEditForm(editableDemoPrompt.id)
    promptVaultView.actions.onSubmitEditForm(
      editableDemoPrompt.id,
      submittedValues
    )

    const errorState = promptVaultView.lastState()
    assert.deepEqual(errorState.prompts, initialPrompts)
    assert.deepEqual(errorState.visiblePrompts, [editableDemoPrompt])
    assert.equal(errorState.searchQuery, 'Bearbeitbarer')
    assert.equal(errorState.selectedCategory, 'Lernen')
    assert.equal(errorState.favoritesOnly, true)
    assert.equal(errorState.editForm.isOpen, true)
    assert.equal(errorState.editForm.isSubmitting, false)
    assert.deepEqual(errorState.editForm.values, submittedValues)
    assert.match(
      errorState.editForm.errorMessage,
      errorCase.messagePattern
    )
    assert.equal(errorState.statusMessage, '')
    assert.deepEqual(errorState.focusTarget, {
      type: 'editAlert',
      id: editableDemoPrompt.id,
    })
  }
})

test('beendet die Bearbeitung kontrolliert, wenn der Prompt nicht mehr existiert', () => {
  const { promptVaultView } = openReadyController({
    prompts: [editableDemoPrompt, examplePrompt],
    promptService: {
      updatePrompt: () => ({
        ok: false,
        status: 'notFound',
        prompts: [examplePrompt],
        error: {
          code: 'promptNotFound',
          message: 'Simulierter Fehler',
        },
      }),
    },
  })

  promptVaultView.actions.onOpenEditForm(editableDemoPrompt.id)
  promptVaultView.actions.onSubmitEditForm(
    editableDemoPrompt.id,
    getEditableValues(editableDemoPrompt, {
      title: 'Nicht mehr vorhandener Prompt',
    })
  )

  const notFoundState = promptVaultView.lastState()
  assert.equal(notFoundState.editForm.isOpen, false)
  assert.equal(notFoundState.editForm.editingPromptId, null)
  assert.deepEqual(notFoundState.prompts, [
    editableDemoPrompt,
    examplePrompt,
  ])
  assert.match(notFoundState.editErrorMessage, /nicht gefunden/)
  assert.equal(notFoundState.statusMessage, '')
  assert.deepEqual(notFoundState.focusTarget, {
    type: 'editGlobalAlert',
  })
})

test('behält aktive Filter und meldet Erfolg bei unsichtbarer Bearbeitung', () => {
  const updatedPrompt = {
    ...editableDemoPrompt,
    title: 'Anderer Titel',
    description: 'Passt nicht mehr zur aktiven Suche.',
    content: 'Neuer Inhalt',
  }
  const servicePrompts = [updatedPrompt, examplePrompt]
  const { promptVaultView } = openReadyController({
    prompts: [editableDemoPrompt, examplePrompt],
    promptService: {
      updatePrompt: () => ({
        ok: true,
        status: 'updated',
        promptChanged: true,
        updatedPrompt,
        prompts: servicePrompts,
      }),
    },
  })

  promptVaultView.actions.onChangeSearchQuery('Bearbeitbarer')
  promptVaultView.actions.onChangeFavoritesOnly(true)
  promptVaultView.actions.onOpenEditForm(editableDemoPrompt.id)
  promptVaultView.actions.onSubmitEditForm(
    editableDemoPrompt.id,
    getEditableValues(updatedPrompt)
  )

  const successState = promptVaultView.lastState()
  assert.deepEqual(successState.prompts, servicePrompts)
  assert.deepEqual(successState.visiblePrompts, [])
  assert.equal(successState.searchQuery, 'Bearbeitbarer')
  assert.equal(successState.favoritesOnly, true)
  assert.equal(successState.hasActiveFilters, true)
  assert.equal(successState.filteredEmptyState, 'noMatches')
  assert.equal(successState.statusMessage, 'Prompt aktualisiert')
  assert.equal(successState.editForm.isOpen, false)
  assert.deepEqual(successState.focusTarget, {
    type: 'contentHeading',
  })
})

test('setzt eine durch Bearbeitung verschwundene Kategorie zurück', () => {
  const updatedPrompt = {
    ...editableDemoPrompt,
    category: 'Reflexion',
  }
  const servicePrompts = [updatedPrompt, examplePrompt]
  const { promptVaultView } = openReadyController({
    prompts: [editableDemoPrompt, examplePrompt],
    promptService: {
      updatePrompt: () => ({
        ok: true,
        status: 'updated',
        promptChanged: true,
        updatedPrompt,
        prompts: servicePrompts,
      }),
    },
  })

  promptVaultView.actions.onChangeCategory('Lernen')
  promptVaultView.actions.onOpenEditForm(editableDemoPrompt.id)
  promptVaultView.actions.onSubmitEditForm(
    editableDemoPrompt.id,
    getEditableValues(updatedPrompt)
  )

  const successState = promptVaultView.lastState()
  assert.deepEqual(successState.categories, ['Reflexion', 'Test'])
  assert.equal(successState.selectedCategory, '')
  assert.equal(successState.hasActiveFilters, false)
  assert.deepEqual(successState.visiblePrompts, servicePrompts)
  assert.equal(successState.statusMessage, 'Prompt aktualisiert')
})

test('behält eine weiterhin gültige Kategorie nach Bearbeitung aktiv', () => {
  const secondLearningPrompt = {
    ...filterPromptsFixture[0],
    id: 'prompt-learning-remaining-001',
  }
  const updatedPrompt = {
    ...editableDemoPrompt,
    category: 'Reflexion',
  }
  const servicePrompts = [
    updatedPrompt,
    secondLearningPrompt,
    examplePrompt,
  ]
  const { promptVaultView } = openReadyController({
    prompts: [
      editableDemoPrompt,
      secondLearningPrompt,
      examplePrompt,
    ],
    promptService: {
      updatePrompt: () => ({
        ok: true,
        status: 'updated',
        promptChanged: true,
        updatedPrompt,
        prompts: servicePrompts,
      }),
    },
  })

  promptVaultView.actions.onChangeCategory('Lernen')
  promptVaultView.actions.onOpenEditForm(editableDemoPrompt.id)
  promptVaultView.actions.onSubmitEditForm(
    editableDemoPrompt.id,
    getEditableValues(updatedPrompt)
  )

  const successState = promptVaultView.lastState()
  assert.equal(successState.selectedCategory, 'Lernen')
  assert.deepEqual(successState.visiblePrompts, [secondLearningPrompt])
  assert.equal(successState.statusMessage, 'Prompt aktualisiert')
  assert.deepEqual(successState.focusTarget, {
    type: 'contentHeading',
  })
})

test('verhindert einen mehrfachen Bearbeitungs-Submit im Speicherzustand', () => {
  let promptVaultView
  let updateCalls = 0
  const setup = openReadyController({
    prompts: [editableDemoPrompt],
    promptService: {
      updatePrompt(promptId, values) {
        updateCalls += 1
        promptVaultView.actions.onSubmitEditForm(promptId, values)

        return {
          ok: true,
          status: 'updated',
          promptChanged: true,
          updatedPrompt: {
            ...editableDemoPrompt,
            ...values,
          },
          prompts: [
            {
              ...editableDemoPrompt,
              ...values,
            },
          ],
        }
      },
    },
  })
  promptVaultView = setup.promptVaultView

  promptVaultView.actions.onOpenEditForm(editableDemoPrompt.id)
  promptVaultView.actions.onSubmitEditForm(
    editableDemoPrompt.id,
    getEditableValues(editableDemoPrompt, {
      title: 'Einmal gespeicherter Titel',
    })
  )

  assert.equal(updateCalls, 1)
  assert.equal(promptVaultView.lastState().editForm.isOpen, false)
})

test('setzt Bearbeitungszustände nach Schließen und Öffnen zurück', () => {
  const {
    controller,
    promptVaultView,
    scheduler,
  } = openReadyController({
    prompts: [editableDemoPrompt],
  })

  promptVaultView.actions.onOpenEditForm(editableDemoPrompt.id)
  promptVaultView.actions.onUpdateEditField(
    'title',
    'Nicht übernommener Entwurf'
  )
  controller.close()
  controller.open()

  const loadingState = promptVaultView.lastState()
  assert.equal(loadingState.phase, 'loading')
  assert.equal(loadingState.editForm.isOpen, false)
  assert.equal(loadingState.editForm.editingPromptId, null)
  assert.equal(loadingState.editErrorMessage, '')

  scheduler.run()

  const reopenedState = promptVaultView.lastState()
  assert.equal(reopenedState.phase, 'ready')
  assert.equal(reopenedState.editForm.isOpen, false)
  assert.deepEqual(reopenedState.editForm.values, {
    title: '',
    category: '',
    description: '',
    content: '',
  })
})

test('öffnet und schließt genau eine Historie mit defensiv geklonten Versionen', () => {
  const initialSnapshot = structuredClone(historyPrompt)
  let restoreCalls = 0
  const { promptVaultView } = openReadyController({
    prompts: [historyPrompt, examplePrompt],
    promptService: {
      restorePromptVersion() {
        restoreCalls += 1
        return { ok: true, prompts: [] }
      },
    },
  })

  promptVaultView.actions.onToggleVersionHistory(historyPrompt.id)

  let state = promptVaultView.lastState()
  assert.equal(state.historyPromptId, historyPrompt.id)
  assert.deepEqual(state.restoreState, {
    promptId: null,
    versionNumber: null,
    isSubmitting: false,
    errorMessage: '',
  })
  assert.deepEqual(state.focusTarget, {
    type: 'historyHeading',
    id: historyPrompt.id,
  })

  promptVaultView.actions.onToggleVersionHistory(historyPrompt.id)

  state = promptVaultView.lastState()
  assert.equal(state.historyPromptId, null)
  assert.deepEqual(state.focusTarget, {
    type: 'historyButton',
    id: historyPrompt.id,
  })
  assert.equal(restoreCalls, 0)
  assert.deepEqual(historyPrompt, initialSnapshot)
})

test('entkoppelt Versionsarrays und Versionsobjekte vollständig von der View', () => {
  const scheduler = createManualScheduler()
  const observedVersionNumbers = []
  let actions
  let mutatedReadyRender = false
  const promptSnapshot = structuredClone(historyPrompt)
  const promptVaultView = {
    render(viewState, renderedActions) {
      actions = renderedActions

      if (viewState.phase !== 'ready') {
        return
      }

      observedVersionNumbers.push(
        viewState.prompts[0].versions.map(
          ({ versionNumber }) => versionNumber
        )
      )

      if (!mutatedReadyRender) {
        mutatedReadyRender = true
        viewState.prompts[0].versions.reverse()
        viewState.prompts[0].versions[0].title =
          'Nur die View wurde verändert'
      }
    },
  }
  const controller = createPromptVaultController({
    promptService: {
      loadPrompts: () => ({
        ok: true,
        status: 'loaded',
        prompts: [historyPrompt],
      }),
    },
    promptVaultView,
    scheduleTask: scheduler.scheduleTask,
  })

  controller.open()
  scheduler.run()
  actions.onToggleVersionHistory(historyPrompt.id)

  assert.deepEqual(observedVersionNumbers, [
    [1, 2, 3],
    [1, 2, 3],
  ])
  assert.deepEqual(historyPrompt, promptSnapshot)
})

test('ordnet eine Restore-Bestätigung exakt zu und bricht ohne Service-Aufruf ab', () => {
  let restoreCalls = 0
  const { promptVaultView } = openReadyController({
    prompts: [historyPrompt],
    promptService: {
      restorePromptVersion() {
        restoreCalls += 1
        return { ok: true, prompts: [] }
      },
    },
  })

  promptVaultView.actions.onToggleVersionHistory(historyPrompt.id)
  const renderCount = promptVaultView.states.length
  promptVaultView.actions.onRequestRestore(historyPrompt.id, 3)
  promptVaultView.actions.onRequestRestore(historyPrompt.id, 99)
  promptVaultView.actions.onRequestRestore(historyPrompt.id, '1')

  assert.equal(promptVaultView.states.length, renderCount)

  promptVaultView.actions.onRequestRestore(historyPrompt.id, 1)

  let state = promptVaultView.lastState()
  assert.equal(state.historyPromptId, historyPrompt.id)
  assert.deepEqual(state.restoreState, {
    promptId: historyPrompt.id,
    versionNumber: 1,
    isSubmitting: false,
    errorMessage: '',
  })
  assert.deepEqual(state.focusTarget, {
    type: 'restoreCancelButton',
    id: historyPrompt.id,
    versionNumber: 1,
  })

  promptVaultView.actions.onCancelRestore()

  state = promptVaultView.lastState()
  assert.equal(state.historyPromptId, historyPrompt.id)
  assert.deepEqual(state.restoreState, {
    promptId: null,
    versionNumber: null,
    isSubmitting: false,
    errorMessage: '',
  })
  assert.deepEqual(state.focusTarget, {
    type: 'restoreButton',
    id: historyPrompt.id,
    versionNumber: 1,
  })
  assert.equal(restoreCalls, 0)
})

test('stellt exakt über den Service wieder her und übernimmt ausschließlich dessen Liste', () => {
  const restoredPrompt = createRestoredHistoryPrompt()
  const servicePrompts = [examplePrompt, restoredPrompt]
  const restoreCalls = []
  const { promptVaultView } = openReadyController({
    prompts: [historyPrompt, examplePrompt],
    promptService: {
      restorePromptVersion(promptId, versionNumber) {
        restoreCalls.push([promptId, versionNumber])
        return {
          ok: true,
          status: 'restored',
          promptChanged: true,
          restoredFromVersion: versionNumber,
          updatedPrompt: {
            ...restoredPrompt,
            id: 'darf-nicht-separat-übernommen-werden',
          },
          prompts: servicePrompts,
        }
      },
    },
  })

  promptVaultView.actions.onToggleVersionHistory(historyPrompt.id)
  promptVaultView.actions.onRequestRestore(historyPrompt.id, 1)
  promptVaultView.actions.onConfirmRestore(historyPrompt.id, 1)

  assert.deepEqual(restoreCalls, [[historyPrompt.id, 1]])
  const savingState = promptVaultView.states.at(-2)
  assert.equal(savingState.restoreState.isSubmitting, true)
  assert.deepEqual(savingState.prompts, [historyPrompt, examplePrompt])

  const successState = promptVaultView.lastState()
  assert.deepEqual(successState.prompts, servicePrompts)
  assert.deepEqual(
    getPromptIds(successState.prompts),
    getPromptIds(servicePrompts)
  )
  assert.equal(successState.historyPromptId, historyPrompt.id)
  assert.equal(successState.prompts[1].versions.length, 4)
  assert.equal(
    successState.prompts[1].versions.at(-1).changeType,
    'restored'
  )
  assert.equal(
    successState.prompts[1].versions.at(-1).restoredFromVersion,
    1
  )
  assert.deepEqual(successState.restoreState, {
    promptId: null,
    versionNumber: null,
    isSubmitting: false,
    errorMessage: '',
  })
  assert.equal(successState.statusMessage, 'Version wiederhergestellt')
  assert.equal(successState.statusMessageTone, 'success')
  assert.deepEqual(successState.focusTarget, {
    type: 'statusMessage',
  })
})

test('meldet einen Restore-No-op ohne vorgetäuschte neue Version', () => {
  const noOpPrompts = [
    {
      ...historyPrompt,
      storageMetadata: 'ausschließlich aus result.prompts',
    },
  ]
  const { promptVaultView } = openReadyController({
    prompts: [historyPrompt],
    promptService: {
      restorePromptVersion: () => ({
        ok: true,
        status: 'unchanged',
        promptChanged: false,
        restoredFromVersion: 1,
        updatedPrompt: historyPrompt,
        prompts: noOpPrompts,
      }),
    },
  })

  promptVaultView.actions.onToggleVersionHistory(historyPrompt.id)
  promptVaultView.actions.onRequestRestore(historyPrompt.id, 1)
  promptVaultView.actions.onConfirmRestore(historyPrompt.id, 1)

  const noOpState = promptVaultView.lastState()
  assert.deepEqual(noOpState.prompts, noOpPrompts)
  assert.equal(noOpState.prompts[0].versions.length, 3)
  assert.equal(noOpState.historyPromptId, historyPrompt.id)
  assert.equal(
    noOpState.statusMessage,
    'Diese Fassung entspricht bereits dem aktuellen Stand.'
  )
  assert.equal(noOpState.statusMessageTone, 'notice')
  assert.deepEqual(noOpState.restoreState, {
    promptId: null,
    versionNumber: null,
    isSubmitting: false,
    errorMessage: '',
  })
  assert.deepEqual(noOpState.focusTarget, {
    type: 'restoreButton',
    id: historyPrompt.id,
    versionNumber: 1,
  })
})

test('ordnet Restore-Fehler verständlich zu, bewahrt den Zustand und erlaubt einen Retry', () => {
  const errorCases = [
    {
      result: {
        ok: false,
        status: 'validationFailed',
        error: { code: 'invalidPromptId' },
      },
      pattern: /Prompt-Kennung/,
    },
    {
      result: {
        ok: false,
        status: 'validationFailed',
        error: { code: 'invalidPromptVersionNumber' },
      },
      pattern: /Versionsnummer/,
    },
    {
      result: {
        ok: false,
        status: 'notFound',
        error: { code: 'promptNotFound' },
      },
      pattern: /Prompt wurde nicht gefunden/,
    },
    {
      result: {
        ok: false,
        status: 'notFound',
        error: { code: 'promptVersionNotFound' },
      },
      pattern: /Version wurde nicht gefunden/,
    },
    {
      result: {
        ok: false,
        status: 'invalidJson',
        error: { code: 'invalidJson' },
      },
      pattern: /beschädigt/,
    },
    {
      result: {
        ok: false,
        status: 'invalidStoredData',
        error: { code: 'invalidPromptData' },
      },
      pattern: /ungültige Struktur/,
    },
    {
      result: {
        ok: false,
        status: 'unsupportedSchemaVersion',
        error: { code: 'unsupportedSchemaVersion' },
      },
      pattern: /noch nicht unterstützt/,
    },
    {
      result: {
        ok: false,
        status: 'generationFailed',
        error: { code: 'promptTimestampGenerationFailed' },
      },
      pattern: /Zeitstempel/,
    },
    {
      result: {
        ok: false,
        status: 'quotaExceeded',
        error: { code: 'storageQuotaExceeded' },
      },
      pattern: /freien Platz/,
    },
    {
      result: {
        ok: false,
        status: 'unavailable',
        error: { code: 'storageUnavailable' },
      },
      pattern: /blockiert/,
    },
    {
      result: {
        ok: false,
        status: 'readFailed',
        error: { code: 'storageReadFailed' },
      },
      pattern: /nicht gelesen/,
    },
    {
      result: {
        ok: false,
        status: 'writeFailed',
        error: { code: 'storageWriteFailed' },
      },
      pattern: /nicht lokal gespeichert/,
    },
    {
      result: {
        ok: false,
        status: 'serializationFailed',
        error: { code: 'serializationFailed' },
      },
      pattern: /vorbereitet/,
    },
    {
      result: {
        ok: false,
        status: 'storageFailed',
        error: { code: 'unexpectedStorageResult' },
      },
      pattern: /verarbeitet/,
    },
    {
      result: null,
      pattern: /konnte nicht wiederhergestellt werden/,
    },
  ]

  for (const errorCase of errorCases) {
    const initialPrompts = [historyPrompt, examplePrompt]
    const restoredPrompt = createRestoredHistoryPrompt()
    let restoreCalls = 0
    const { promptVaultView } = openReadyController({
      prompts: initialPrompts,
      promptService: {
        restorePromptVersion() {
          restoreCalls += 1

          if (restoreCalls === 1) {
            return errorCase.result === null
              ? null
              : {
                  ...errorCase.result,
                  prompts: [examplePrompt],
                }
          }

          return {
            ok: true,
            status: 'restored',
            prompts: [restoredPrompt, examplePrompt],
          }
        },
      },
    })

    promptVaultView.actions.onChangeSearchQuery('gemeinsam')
    promptVaultView.actions.onChangeCategory('Reflexion')
    promptVaultView.actions.onChangeFavoritesOnly(true)
    promptVaultView.actions.onToggleVersionHistory(historyPrompt.id)
    promptVaultView.actions.onRequestRestore(historyPrompt.id, 1)
    promptVaultView.actions.onConfirmRestore(historyPrompt.id, 1)

    const errorState = promptVaultView.lastState()
    assert.deepEqual(errorState.prompts, initialPrompts)
    assert.deepEqual(errorState.visiblePrompts, [historyPrompt])
    assert.equal(errorState.searchQuery, 'gemeinsam')
    assert.equal(errorState.selectedCategory, 'Reflexion')
    assert.equal(errorState.favoritesOnly, true)
    assert.equal(errorState.historyPromptId, historyPrompt.id)
    assert.equal(errorState.restoreState.promptId, historyPrompt.id)
    assert.equal(errorState.restoreState.versionNumber, 1)
    assert.equal(errorState.restoreState.isSubmitting, false)
    assert.match(errorState.restoreState.errorMessage, errorCase.pattern)
    assert.deepEqual(errorState.focusTarget, {
      type: 'restoreAlert',
      id: historyPrompt.id,
      versionNumber: 1,
    })

    promptVaultView.actions.onConfirmRestore(historyPrompt.id, 1)

    const retryState = promptVaultView.lastState()
    assert.equal(restoreCalls, 2)
    assert.equal(retryState.statusMessage, 'Version wiederhergestellt')
    assert.equal(retryState.historyPromptId, historyPrompt.id)
    assert.equal(retryState.restoreState.promptId, null)
  }
})

test('blockiert Filter und Favoriten, solange eine Restore-Bestätigung offen ist', () => {
  let favoriteCalls = 0
  const { promptVaultView } = openReadyController({
    prompts: [historyPrompt, examplePrompt],
    promptService: {
      setPromptFavorite() {
        favoriteCalls += 1
        return { ok: true, prompts: [] }
      },
    },
  })

  promptVaultView.actions.onChangeSearchQuery('gemeinsam')
  promptVaultView.actions.onChangeCategory('Reflexion')
  promptVaultView.actions.onChangeFavoritesOnly(true)
  promptVaultView.actions.onToggleVersionHistory(historyPrompt.id)
  promptVaultView.actions.onRequestRestore(historyPrompt.id, 1)
  const pendingState = promptVaultView.lastState()
  const renderCount = promptVaultView.states.length

  promptVaultView.actions.onChangeSearchQuery('anderer Suchtext')
  promptVaultView.actions.onChangeCategory('Test')
  promptVaultView.actions.onChangeFavoritesOnly(false)
  promptVaultView.actions.onResetFilters()
  promptVaultView.actions.onSetPromptFavorite(historyPrompt.id, false)

  assert.equal(promptVaultView.states.length, renderCount)
  assert.equal(favoriteCalls, 0)
  assert.deepEqual(promptVaultView.lastState(), pendingState)
})

test('schließt eine Restore-Bestätigung kontrolliert für andere Arbeitszustände', () => {
  const { promptVaultView } = openReadyController({
    prompts: [historyPrompt, examplePrompt],
  })

  promptVaultView.actions.onToggleVersionHistory(historyPrompt.id)
  promptVaultView.actions.onRequestRestore(historyPrompt.id, 1)
  promptVaultView.actions.onOpenCreateForm('header')

  let state = promptVaultView.lastState()
  assert.equal(state.createForm.isOpen, true)
  assert.equal(state.restoreState.promptId, null)
  assert.equal(state.historyPromptId, historyPrompt.id)

  promptVaultView.actions.onCancelCreateForm()
  promptVaultView.actions.onRequestRestore(historyPrompt.id, 1)
  promptVaultView.actions.onOpenEditForm(historyPrompt.id)

  state = promptVaultView.lastState()
  assert.equal(state.editForm.isOpen, true)
  assert.equal(state.restoreState.promptId, null)

  promptVaultView.actions.onCancelEditForm()
  promptVaultView.actions.onRequestRestore(historyPrompt.id, 1)
  promptVaultView.actions.onRequestDelete(examplePrompt.id)

  state = promptVaultView.lastState()
  assert.equal(state.pendingDeleteId, examplePrompt.id)
  assert.equal(state.restoreState.promptId, null)
})

test('bewahrt einen geänderten Erstellungsentwurf bei konkurrierenden Aktionen', () => {
  let restoreCalls = 0
  const { promptVaultView } = openReadyController({
    prompts: [historyPrompt, examplePrompt],
    promptService: {
      restorePromptVersion() {
        restoreCalls += 1
        return { ok: true, prompts: [] }
      },
    },
  })

  promptVaultView.actions.onToggleVersionHistory(historyPrompt.id)
  promptVaultView.actions.onOpenCreateForm('header')
  promptVaultView.actions.onUpdateCreateField(
    'title',
    'Ungespeicherter neuer Prompt'
  )
  promptVaultView.actions.onOpenEditForm(examplePrompt.id)
  promptVaultView.actions.onRequestDelete(examplePrompt.id)
  promptVaultView.actions.onRequestRestore(historyPrompt.id, 1)
  promptVaultView.actions.onOpenCreateForm('header')

  const state = promptVaultView.lastState()
  assert.equal(state.createForm.isOpen, true)
  assert.equal(
    state.createForm.values.title,
    'Ungespeicherter neuer Prompt'
  )
  assert.match(state.createForm.errorMessage, /Speichere den neuen Prompt/)
  assert.equal(state.editForm.isOpen, false)
  assert.equal(state.pendingDeleteId, null)
  assert.equal(state.restoreState.promptId, null)
  assert.equal(restoreCalls, 0)
  assert.deepEqual(state.focusTarget, {
    type: 'createAlert',
  })
})

test('bewahrt einen geänderten Bearbeitungsentwurf bei konkurrierenden Aktionen', () => {
  let restoreCalls = 0
  const { promptVaultView } = openReadyController({
    prompts: [historyPrompt, examplePrompt],
    promptService: {
      restorePromptVersion() {
        restoreCalls += 1
        return { ok: true, prompts: [] }
      },
    },
  })

  promptVaultView.actions.onToggleVersionHistory(historyPrompt.id)
  promptVaultView.actions.onOpenEditForm(historyPrompt.id)
  promptVaultView.actions.onUpdateEditField(
    'content',
    'Ungespeicherter bearbeiteter Inhalt'
  )
  promptVaultView.actions.onOpenCreateForm('header')
  promptVaultView.actions.onRequestDelete(examplePrompt.id)
  promptVaultView.actions.onRequestRestore(historyPrompt.id, 1)
  promptVaultView.actions.onOpenEditForm(examplePrompt.id)

  const state = promptVaultView.lastState()
  assert.equal(state.createForm.isOpen, false)
  assert.equal(state.editForm.isOpen, true)
  assert.equal(state.editForm.editingPromptId, historyPrompt.id)
  assert.equal(
    state.editForm.values.content,
    'Ungespeicherter bearbeiteter Inhalt'
  )
  assert.match(
    state.editForm.errorMessage,
    /Speichere deine Änderungen/
  )
  assert.equal(state.pendingDeleteId, null)
  assert.equal(state.restoreState.promptId, null)
  assert.equal(restoreCalls, 0)
  assert.deepEqual(state.focusTarget, {
    type: 'editAlert',
    id: historyPrompt.id,
  })
})

test('behält Suche, Kategorie- und Favoritenfilter bei sichtbarem Restore bei', () => {
  const restoredPrompt = createRestoredHistoryPrompt()
  const { promptVaultView } = openReadyController({
    prompts: [historyPrompt, examplePrompt],
    promptService: {
      restorePromptVersion: () => ({
        ok: true,
        status: 'restored',
        prompts: [restoredPrompt, examplePrompt],
      }),
    },
  })

  promptVaultView.actions.onChangeSearchQuery('gemeinsam')
  promptVaultView.actions.onChangeCategory('Reflexion')
  promptVaultView.actions.onChangeFavoritesOnly(true)
  promptVaultView.actions.onToggleVersionHistory(historyPrompt.id)
  promptVaultView.actions.onRequestRestore(historyPrompt.id, 1)
  promptVaultView.actions.onConfirmRestore(historyPrompt.id, 1)

  const state = promptVaultView.lastState()
  assert.equal(state.searchQuery, 'gemeinsam')
  assert.equal(state.selectedCategory, 'Reflexion')
  assert.equal(state.favoritesOnly, true)
  assert.deepEqual(state.visiblePrompts, [restoredPrompt])
  assert.equal(state.historyPromptId, historyPrompt.id)
  assert.equal(state.statusMessage, 'Version wiederhergestellt')
})

test('schließt die Historie, wenn der Prompt nach Restore aus der Filteransicht verschwindet', () => {
  const remainingReflectionPrompt = {
    ...examplePrompt,
    id: 'prompt-reflection-visible-category-001',
    category: 'Reflexion',
    isFavorite: false,
  }
  const restoredPrompt = createRestoredHistoryPrompt()
  const { promptVaultView } = openReadyController({
    prompts: [historyPrompt, remainingReflectionPrompt],
    promptService: {
      restorePromptVersion: () => ({
        ok: true,
        status: 'restored',
        prompts: [restoredPrompt, remainingReflectionPrompt],
      }),
    },
  })

  promptVaultView.actions.onChangeSearchQuery(
    'Aktueller gemeinsamer Stand'
  )
  promptVaultView.actions.onChangeCategory('Reflexion')
  promptVaultView.actions.onChangeFavoritesOnly(true)
  promptVaultView.actions.onToggleVersionHistory(historyPrompt.id)
  promptVaultView.actions.onRequestRestore(historyPrompt.id, 1)
  promptVaultView.actions.onConfirmRestore(historyPrompt.id, 1)

  const state = promptVaultView.lastState()
  assert.equal(state.searchQuery, 'Aktueller gemeinsamer Stand')
  assert.equal(state.selectedCategory, 'Reflexion')
  assert.equal(state.favoritesOnly, true)
  assert.deepEqual(state.visiblePrompts, [])
  assert.equal(state.filteredEmptyState, 'noMatches')
  assert.equal(state.historyPromptId, null)
  assert.equal(state.statusMessage, 'Version wiederhergestellt')
  assert.deepEqual(state.focusTarget, {
    type: 'statusMessage',
  })
})

test('setzt eine durch Restore verschwundene Kategorie mit der bestehenden Ableitung zurück', () => {
  const categoryChangingPrompt = structuredClone(historyPrompt)
  categoryChangingPrompt.versions[0].category = 'Lernen'
  const selectedVersion = categoryChangingPrompt.versions[0]
  const restoredAt = '2026-07-13T09:00:00.000Z'
  const restoredPrompt = {
    ...categoryChangingPrompt,
    title: selectedVersion.title,
    category: selectedVersion.category,
    description: selectedVersion.description,
    content: selectedVersion.content,
    updatedAt: restoredAt,
    versions: [
      ...categoryChangingPrompt.versions,
      createPromptVersion(4, {
        title: selectedVersion.title,
        category: selectedVersion.category,
        description: selectedVersion.description,
        content: selectedVersion.content,
        createdAt: restoredAt,
        changeType: 'restored',
        restoredFromVersion: 1,
      }),
    ],
  }
  const { promptVaultView } = openReadyController({
    prompts: [categoryChangingPrompt],
    promptService: {
      restorePromptVersion: () => ({
        ok: true,
        status: 'restored',
        prompts: [restoredPrompt],
      }),
    },
  })

  promptVaultView.actions.onChangeCategory('Reflexion')
  promptVaultView.actions.onToggleVersionHistory(categoryChangingPrompt.id)
  promptVaultView.actions.onRequestRestore(categoryChangingPrompt.id, 1)
  promptVaultView.actions.onConfirmRestore(
    categoryChangingPrompt.id,
    1
  )

  const state = promptVaultView.lastState()
  assert.deepEqual(state.categories, ['Lernen'])
  assert.equal(state.selectedCategory, '')
  assert.equal(state.hasActiveFilters, false)
  assert.deepEqual(state.visiblePrompts, [restoredPrompt])
  assert.equal(state.historyPromptId, categoryChangingPrompt.id)
})

test('verhindert einen mehrfachen Restore-Submit im Speicherzustand', () => {
  let promptVaultView
  let restoreCalls = 0
  const restoredPrompt = createRestoredHistoryPrompt()
  const setup = openReadyController({
    prompts: [historyPrompt],
    promptService: {
      restorePromptVersion(promptId, versionNumber) {
        restoreCalls += 1
        promptVaultView.actions.onConfirmRestore(
          promptId,
          versionNumber
        )

        return {
          ok: true,
          status: 'restored',
          prompts: [restoredPrompt],
        }
      },
    },
  })
  promptVaultView = setup.promptVaultView

  promptVaultView.actions.onToggleVersionHistory(historyPrompt.id)
  promptVaultView.actions.onRequestRestore(historyPrompt.id, 1)
  promptVaultView.actions.onConfirmRestore(historyPrompt.id, 1)

  assert.equal(restoreCalls, 1)
  assert.equal(
    promptVaultView.lastState().statusMessage,
    'Version wiederhergestellt'
  )
})

test('setzt Historien- und Restore-Zustände nach Schließen und Öffnen zurück', () => {
  const {
    controller,
    promptVaultView,
    scheduler,
  } = openReadyController({
    prompts: [historyPrompt],
  })

  promptVaultView.actions.onToggleVersionHistory(historyPrompt.id)
  promptVaultView.actions.onRequestRestore(historyPrompt.id, 1)
  controller.close()
  controller.open()

  let state = promptVaultView.lastState()
  assert.equal(state.phase, 'loading')
  assert.equal(state.historyPromptId, null)
  assert.deepEqual(state.restoreState, {
    promptId: null,
    versionNumber: null,
    isSubmitting: false,
    errorMessage: '',
  })

  scheduler.run()

  state = promptVaultView.lastState()
  assert.equal(state.phase, 'ready')
  assert.equal(state.historyPromptId, null)
  assert.equal(state.restoreState.promptId, null)
})
