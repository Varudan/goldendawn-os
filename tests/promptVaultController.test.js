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
