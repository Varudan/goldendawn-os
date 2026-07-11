import assert from 'node:assert/strict'
import test from 'node:test'

import { createPromptService } from '../src/services/promptService.js'
import { createStorageAdapter } from '../src/storage/storageAdapter.js'
import {
  createPromptStorage,
  PROMPT_SCHEMA_VERSION,
  PROMPT_STORAGE_KEY,
} from '../src/storage/promptStorage.js'
import { createStorageError, FakeStorage } from './helpers/fakeStorage.js'

function createPromptSystem(fakeStorage) {
  const storageAdapter = createStorageAdapter(fakeStorage)
  const promptStorage = createPromptStorage(storageAdapter)

  return {
    promptService: createPromptService({ promptStorage }),
    promptStorage,
  }
}

function createStoredEnvelope(prompts) {
  return JSON.stringify({
    schemaVersion: PROMPT_SCHEMA_VERSION,
    prompts,
  })
}

const customPrompt = {
  id: 'prompt-custom-001',
  title: 'Eigener Beispielprompt',
  description: 'Ein gültiger synthetischer Prompt für den Ladetest.',
  category: 'Lernen',
  content: 'Strukturiere [THEMA] passend zu [ZIEL].',
  createdAt: '2026-07-10T10:00:00Z',
  updatedAt: '2026-07-10T10:15:00Z',
  isDemo: true,
}

test('initialisiert bei fehlendem Key genau drei Seed-Prompts', () => {
  const fakeStorage = new FakeStorage()
  const { promptService } = createPromptSystem(fakeStorage)

  const result = promptService.loadPrompts()

  assert.equal(result.ok, true)
  assert.equal(result.status, 'initialized')
  assert.equal(result.initialized, true)
  assert.equal(result.prompts.length, 3)
  assert.deepEqual(
    result.prompts.map(({ title, category }) => ({ title, category })),
    [
      { title: 'Lernstoff verständlich erklären', category: 'Lernen' },
      {
        title: 'KI-Automatisierung planen',
        category: 'Automatisierung',
      },
      { title: 'Wöchentliche Reflexion', category: 'Reflexion' },
    ]
  )
  assert.equal(new Set(result.prompts.map(({ id }) => id)).size, 3)
  assert.ok(result.prompts.every(({ isDemo }) => isDemo === true))
  assert.equal(fakeStorage.setItemCalls, 1)

  const storedEnvelope = JSON.parse(fakeStorage.peek(PROMPT_STORAGE_KEY))
  assert.equal(storedEnvelope.schemaVersion, 1)
  assert.equal(storedEnvelope.prompts.length, 3)
})

test('erneutes Laden dupliziert oder überschreibt die Seeds nicht', () => {
  const fakeStorage = new FakeStorage()
  const firstService = createPromptSystem(fakeStorage).promptService
  const firstResult = firstService.loadPrompts()

  const restartedService = createPromptSystem(fakeStorage).promptService
  const secondResult = restartedService.loadPrompts()

  assert.equal(secondResult.ok, true)
  assert.equal(secondResult.status, 'loaded')
  assert.equal(secondResult.initialized, false)
  assert.deepEqual(
    secondResult.prompts.map(({ id }) => id),
    firstResult.prompts.map(({ id }) => id)
  )
  assert.equal(fakeStorage.setItemCalls, 1)
})

test('bewahrt ein bewusst leer gespeichertes Prompt-Array', () => {
  const fakeStorage = new FakeStorage([
    [PROMPT_STORAGE_KEY, createStoredEnvelope([])],
  ])
  const { promptService } = createPromptSystem(fakeStorage)

  const result = promptService.loadPrompts()

  assert.equal(result.ok, true)
  assert.equal(result.status, 'loaded')
  assert.deepEqual(result.prompts, [])
  assert.equal(fakeStorage.setItemCalls, 0)
})

test('lädt gültige gespeicherte Prompt-Daten unverändert', () => {
  const fakeStorage = new FakeStorage([
    [PROMPT_STORAGE_KEY, createStoredEnvelope([customPrompt])],
  ])
  const { promptService } = createPromptSystem(fakeStorage)

  const result = promptService.loadPrompts()

  assert.equal(result.ok, true)
  assert.deepEqual(result.prompts, [customPrompt])
  assert.equal(fakeStorage.setItemCalls, 0)
})

test('meldet beschädigtes JSON ohne Absturz oder Überschreiben', () => {
  const corruptedJson = '{broken'
  const fakeStorage = new FakeStorage([
    [PROMPT_STORAGE_KEY, corruptedJson],
  ])
  const { promptService } = createPromptSystem(fakeStorage)
  let result

  assert.doesNotThrow(() => {
    result = promptService.loadPrompts()
  })

  assert.equal(result.ok, false)
  assert.equal(result.status, 'invalidJson')
  assert.equal(result.error.code, 'invalidJson')
  assert.deepEqual(result.prompts, [])
  assert.equal(fakeStorage.peek(PROMPT_STORAGE_KEY), corruptedJson)
  assert.equal(fakeStorage.setItemCalls, 0)
})

test('überschreibt einen gültigen, aber unerwarteten Datenumschlag nicht', () => {
  const unsupportedEnvelope = JSON.stringify({
    schemaVersion: 2,
    prompts: [],
  })
  const fakeStorage = new FakeStorage([
    [PROMPT_STORAGE_KEY, unsupportedEnvelope],
  ])
  const { promptService } = createPromptSystem(fakeStorage)

  const result = promptService.loadPrompts()

  assert.equal(result.ok, false)
  assert.equal(result.status, 'unsupportedSchemaVersion')
  assert.equal(result.error.code, 'unsupportedPromptSchemaVersion')
  assert.equal(fakeStorage.peek(PROMPT_STORAGE_KEY), unsupportedEnvelope)
  assert.equal(fakeStorage.setItemCalls, 0)
})

test('löscht einen vorhandenen Prompt dauerhaft', () => {
  const fakeStorage = new FakeStorage()
  const firstService = createPromptSystem(fakeStorage).promptService
  const initialResult = firstService.loadPrompts()
  const deletedPromptId = initialResult.prompts[0].id

  const deleteResult = firstService.deletePrompt(deletedPromptId)

  assert.equal(deleteResult.ok, true)
  assert.equal(deleteResult.status, 'deleted')
  assert.equal(deleteResult.deletedPromptId, deletedPromptId)
  assert.equal(deleteResult.prompts.length, 2)
  assert.ok(
    deleteResult.prompts.every(({ id }) => id !== deletedPromptId)
  )

  const restartedService = createPromptSystem(fakeStorage).promptService
  const reloadedResult = restartedService.loadPrompts()

  assert.equal(reloadedResult.ok, true)
  assert.equal(reloadedResult.prompts.length, 2)
  assert.ok(reloadedResult.prompts.every(({ id }) => id !== deletedPromptId))
  assert.equal(fakeStorage.setItemCalls, 2)
})

test('behandelt eine unbekannte Prompt-ID kontrolliert und ohne Schreibzugriff', () => {
  const fakeStorage = new FakeStorage()
  const { promptService } = createPromptSystem(fakeStorage)
  promptService.loadPrompts()
  const storedValue = fakeStorage.peek(PROMPT_STORAGE_KEY)
  const writeCount = fakeStorage.setItemCalls

  const result = promptService.deletePrompt('prompt-unknown-999')

  assert.equal(result.ok, false)
  assert.equal(result.status, 'notFound')
  assert.equal(result.error.code, 'promptNotFound')
  assert.equal(result.prompts.length, 3)
  assert.equal(fakeStorage.peek(PROMPT_STORAGE_KEY), storedValue)
  assert.equal(fakeStorage.setItemCalls, writeCount)
})

test('gibt einen simulierten Schreibfehler zurück und erhält den Prompt', () => {
  const fakeStorage = new FakeStorage()
  const { promptService } = createPromptSystem(fakeStorage)
  const initialResult = promptService.loadPrompts()
  const promptId = initialResult.prompts[0].id
  const storedValue = fakeStorage.peek(PROMPT_STORAGE_KEY)

  fakeStorage.writeError = createStorageError('QuotaExceededError')
  const deleteResult = promptService.deletePrompt(promptId)

  assert.equal(deleteResult.ok, false)
  assert.equal(deleteResult.status, 'quotaExceeded')
  assert.equal(deleteResult.error.code, 'storageQuotaExceeded')
  assert.equal(deleteResult.prompts.length, 3)
  assert.equal(fakeStorage.peek(PROMPT_STORAGE_KEY), storedValue)

  fakeStorage.writeError = null
  const restartedService = createPromptSystem(fakeStorage).promptService
  const reloadedResult = restartedService.loadPrompts()

  assert.ok(reloadedResult.prompts.some(({ id }) => id === promptId))
})

test('weist eine ungültige Prompt-ID vor einem Storage-Zugriff zurück', () => {
  const fakeStorage = new FakeStorage()
  const { promptService } = createPromptSystem(fakeStorage)

  const result = promptService.deletePrompt('   ')

  assert.equal(result.ok, false)
  assert.equal(result.status, 'validationFailed')
  assert.equal(result.error.code, 'invalidPromptId')
  assert.equal(fakeStorage.getItemCalls, 0)
  assert.equal(fakeStorage.setItemCalls, 0)
})
