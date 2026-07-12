import assert from 'node:assert/strict'
import test from 'node:test'

import { createPromptVaultController } from '../src/modules/prompt-vault/promptVaultController.js'

const examplePrompt = {
  id: 'prompt-example-001',
  title: 'Beispielprompt',
  description: 'Ein synthetischer Prompt für den Controller-Test.',
  category: 'Test',
  content: 'Prüfe [THEMA].',
}

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
