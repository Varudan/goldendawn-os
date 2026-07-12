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

function createPromptSystem(fakeStorage, serviceDependencies = {}) {
  const storageAdapter = createStorageAdapter(fakeStorage)
  const promptStorage = createPromptStorage(storageAdapter)

  return {
    promptService: createPromptService({
      promptStorage,
      ...serviceDependencies,
    }),
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

  assert.equal(PROMPT_STORAGE_KEY, 'goldendawn.promptVault.v1')
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
  assert.ok(
    result.prompts.every(({ isFavorite }) => isFavorite === false)
  )
  assert.equal(fakeStorage.setItemCalls, 1)

  const storedEnvelope = JSON.parse(fakeStorage.peek(PROMPT_STORAGE_KEY))
  assert.equal(storedEnvelope.schemaVersion, 1)
  assert.equal(storedEnvelope.prompts.length, 3)
  assert.ok(
    storedEnvelope.prompts.every(
      ({ isFavorite }) => isFavorite === false
    )
  )
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

test('normalisiert einen alten Prompt ohne Favoritenfeld nur beim Laden', () => {
  const legacyEnvelope = createStoredEnvelope([customPrompt])
  const fakeStorage = new FakeStorage([
    [PROMPT_STORAGE_KEY, legacyEnvelope],
  ])
  const { promptService } = createPromptSystem(fakeStorage)

  const result = promptService.loadPrompts()

  assert.equal(result.ok, true)
  assert.deepEqual(result.prompts, [
    {
      ...customPrompt,
      isFavorite: false,
    },
  ])
  assert.equal(fakeStorage.peek(PROMPT_STORAGE_KEY), legacyEnvelope)
  assert.equal(fakeStorage.setItemCalls, 0)
})

test('weist einen vorhandenen ungültigen Favoritenwert kontrolliert zurück', () => {
  const invalidEnvelope = createStoredEnvelope([
    {
      ...customPrompt,
      isFavorite: 'true',
    },
  ])
  const fakeStorage = new FakeStorage([
    [PROMPT_STORAGE_KEY, invalidEnvelope],
  ])
  const { promptService } = createPromptSystem(fakeStorage)

  const result = promptService.loadPrompts()

  assert.equal(result.ok, false)
  assert.equal(result.status, 'invalidStoredData')
  assert.equal(result.error.code, 'invalidPromptData')
  assert.deepEqual(result.prompts, [])
  assert.equal(fakeStorage.peek(PROMPT_STORAGE_KEY), invalidEnvelope)
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

test('erstellt und speichert einen gültigen eigenen Prompt', () => {
  const fakeStorage = new FakeStorage([
    [PROMPT_STORAGE_KEY, createStoredEnvelope([])],
  ])
  let idCalls = 0
  let dateCalls = 0
  const { promptService } = createPromptSystem(fakeStorage, {
    generatePromptId() {
      idCalls += 1
      return 'prompt-own-001'
    },
    getCurrentDate() {
      dateCalls += 1
      return new Date('2026-07-12T09:30:00.000Z')
    },
  })

  const result = promptService.createPrompt({
    id: 'ignored-id',
    title: '  Eigener Prompt  ',
    category: '  Planung  ',
    description: '  Ein lokal erstellter Prompt.  ',
    content: '  Erste Zeile\nZweite Zeile  ',
    createdAt: '2000-01-01T00:00:00.000Z',
    updatedAt: '2000-01-01T00:00:00.000Z',
    isFavorite: true,
    isDemo: true,
  })

  assert.equal(result.ok, true)
  assert.equal(result.status, 'created')
  assert.deepEqual(result.createdPrompt, {
    id: 'prompt-own-001',
    title: 'Eigener Prompt',
    category: 'Planung',
    description: 'Ein lokal erstellter Prompt.',
    content: 'Erste Zeile\nZweite Zeile',
    createdAt: '2026-07-12T09:30:00.000Z',
    updatedAt: '2026-07-12T09:30:00.000Z',
    isFavorite: false,
    isDemo: false,
  })
  assert.deepEqual(result.prompts, [result.createdPrompt])
  assert.equal(idCalls, 1)
  assert.equal(dateCalls, 1)

  const storedEnvelope = JSON.parse(fakeStorage.peek(PROMPT_STORAGE_KEY))
  assert.equal(storedEnvelope.schemaVersion, PROMPT_SCHEMA_VERSION)
  assert.deepEqual(storedEnvelope.prompts, [result.createdPrompt])
})

test('lädt einen eigenen Prompt nach einer neuen Service-Instanz', () => {
  const fakeStorage = new FakeStorage([
    [PROMPT_STORAGE_KEY, createStoredEnvelope([])],
  ])
  const firstService = createPromptSystem(fakeStorage, {
    generatePromptId: () => 'prompt-persistent-001',
    getCurrentDate: () => new Date('2026-07-12T10:00:00.000Z'),
  }).promptService

  const createResult = firstService.createPrompt({
    title: 'Persistenter Prompt',
    category: 'Lernen',
    description: 'Bleibt nach einem Neustart erhalten.',
    content: 'Erkläre [THEMA] in drei Schritten.',
  })
  const restartedService = createPromptSystem(fakeStorage).promptService
  const loadResult = restartedService.loadPrompts()

  assert.equal(createResult.ok, true)
  assert.equal(loadResult.ok, true)
  assert.deepEqual(loadResult.prompts, [createResult.createdPrompt])
})

test('weist einen leeren Titel vor jedem Storage-Zugriff zurück', () => {
  const fakeStorage = new FakeStorage()
  let metadataCalls = 0
  const { promptService } = createPromptSystem(fakeStorage, {
    generatePromptId() {
      metadataCalls += 1
      return 'prompt-unused'
    },
    getCurrentDate() {
      metadataCalls += 1
      return new Date()
    },
  })

  const result = promptService.createPrompt({
    title: '   ',
    content: 'Gültiger Prompt-Text',
  })

  assert.equal(result.ok, false)
  assert.equal(result.status, 'validationFailed')
  assert.equal(result.error.code, 'invalidPromptInput')
  assert.equal(result.error.fieldErrors.title, 'Bitte gib einen Titel ein.')
  assert.equal(fakeStorage.getItemCalls, 0)
  assert.equal(fakeStorage.setItemCalls, 0)
  assert.equal(metadataCalls, 0)
})

test('weist einen leeren Prompt-Text vor jedem Storage-Zugriff zurück', () => {
  const fakeStorage = new FakeStorage()
  const { promptService } = createPromptSystem(fakeStorage)

  const result = promptService.createPrompt({
    title: 'Gültiger Titel',
    content: '\n   ',
  })

  assert.equal(result.ok, false)
  assert.equal(result.status, 'validationFailed')
  assert.equal(
    result.error.fieldErrors.content,
    'Bitte gib einen Prompt-Text ein.'
  )
  assert.equal(fakeStorage.getItemCalls, 0)
  assert.equal(fakeStorage.setItemCalls, 0)
})

test('validiert die maximale Länge aller Eingabefelder', () => {
  const testCases = [
    {
      field: 'title',
      value: 'T'.repeat(121),
      message: 'Der Titel darf höchstens 120 Zeichen lang sein.',
    },
    {
      field: 'category',
      value: 'K'.repeat(61),
      message: 'Die Kategorie darf höchstens 60 Zeichen lang sein.',
    },
    {
      field: 'description',
      value: 'B'.repeat(241),
      message: 'Die Beschreibung darf höchstens 240 Zeichen lang sein.',
    },
    {
      field: 'content',
      value: 'P'.repeat(10001),
      message: 'Der Prompt-Text darf höchstens 10.000 Zeichen lang sein.',
    },
  ]

  for (const testCase of testCases) {
    const fakeStorage = new FakeStorage()
    const { promptService } = createPromptSystem(fakeStorage)
    const input = {
      title: 'Gültiger Titel',
      category: '',
      description: '',
      content: 'Gültiger Prompt-Text',
      [testCase.field]: testCase.value,
    }

    const result = promptService.createPrompt(input)

    assert.equal(result.ok, false)
    assert.equal(result.status, 'validationFailed')
    assert.equal(result.error.fieldErrors[testCase.field], testCase.message)
    assert.equal(fakeStorage.getItemCalls, 0)
    assert.equal(fakeStorage.setItemCalls, 0)
  }
})

test('akzeptiert die exakten maximalen Feldlängen', () => {
  const fakeStorage = new FakeStorage([
    [PROMPT_STORAGE_KEY, createStoredEnvelope([])],
  ])
  const { promptService } = createPromptSystem(fakeStorage, {
    generatePromptId: () => 'prompt-max-length-001',
    getCurrentDate: () => new Date('2026-07-12T10:30:00.000Z'),
  })

  const result = promptService.createPrompt({
    title: 'T'.repeat(120),
    category: 'K'.repeat(60),
    description: 'B'.repeat(240),
    content: 'P'.repeat(10000),
  })

  assert.equal(result.ok, true)
  assert.equal(result.createdPrompt.title.length, 120)
  assert.equal(result.createdPrompt.category.length, 60)
  assert.equal(result.createdPrompt.description.length, 240)
  assert.equal(result.createdPrompt.content.length, 10000)
})

test('speichert optionale Kategorie und Beschreibung als leere Strings', () => {
  const fakeStorage = new FakeStorage([
    [PROMPT_STORAGE_KEY, createStoredEnvelope([])],
  ])
  const { promptService } = createPromptSystem(fakeStorage, {
    generatePromptId: () => 'prompt-optional-001',
    getCurrentDate: () => new Date('2026-07-12T11:00:00.000Z'),
  })

  const createResult = promptService.createPrompt({
    title: 'Minimaler Prompt',
    content: 'Bearbeite [AUFGABE].',
  })
  const restartedService = createPromptSystem(fakeStorage).promptService
  const loadResult = restartedService.loadPrompts()

  assert.equal(createResult.ok, true)
  assert.equal(createResult.createdPrompt.category, '')
  assert.equal(createResult.createdPrompt.description, '')
  assert.equal(createResult.createdPrompt.isFavorite, false)
  assert.equal(createResult.createdPrompt.isDemo, false)
  assert.deepEqual(loadResult.prompts, [createResult.createdPrompt])
})

test('täuscht bei einem Schreibfehler keinen erstellten Prompt vor', () => {
  const initialEnvelope = createStoredEnvelope([])
  const fakeStorage = new FakeStorage([
    [PROMPT_STORAGE_KEY, initialEnvelope],
  ])
  const { promptService } = createPromptSystem(fakeStorage, {
    generatePromptId: () => 'prompt-write-error-001',
    getCurrentDate: () => new Date('2026-07-12T11:30:00.000Z'),
  })
  fakeStorage.writeError = createStorageError('QuotaExceededError')

  const result = promptService.createPrompt({
    title: 'Nicht gespeicherter Prompt',
    content: 'Dieser Prompt darf nicht nur in der UI erscheinen.',
  })

  assert.equal(result.ok, false)
  assert.equal(result.status, 'quotaExceeded')
  assert.equal(result.error.code, 'storageQuotaExceeded')
  assert.equal(Object.hasOwn(result, 'createdPrompt'), false)
  assert.deepEqual(result.prompts, [])
  assert.equal(fakeStorage.peek(PROMPT_STORAGE_KEY), initialEnvelope)
})

test('erzeugt bei einer ID-Kollision eine neue eindeutige Prompt-ID', () => {
  const fakeStorage = new FakeStorage([
    [PROMPT_STORAGE_KEY, createStoredEnvelope([customPrompt])],
  ])
  const generatedIds = [customPrompt.id, 'prompt-unique-002']
  let generationIndex = 0
  const { promptService } = createPromptSystem(fakeStorage, {
    generatePromptId() {
      const promptId = generatedIds[generationIndex]
      generationIndex += 1
      return promptId
    },
    getCurrentDate: () => new Date('2026-07-12T12:00:00.000Z'),
  })

  const result = promptService.createPrompt({
    title: 'Prompt mit eindeutiger ID',
    content: 'Prüfe die Kollisionsbehandlung.',
  })

  assert.equal(result.ok, true)
  assert.equal(result.createdPrompt.id, 'prompt-unique-002')
  assert.equal(generationIndex, 2)
  assert.equal(new Set(result.prompts.map(({ id }) => id)).size, 2)
  assert.equal(result.prompts[0].id, 'prompt-unique-002')
  assert.equal(result.prompts[1].id, customPrompt.id)
})

test('behandelt eine erschöpfte ID-Erzeugung kontrolliert', () => {
  const initialEnvelope = createStoredEnvelope([])
  const fakeStorage = new FakeStorage([
    [PROMPT_STORAGE_KEY, initialEnvelope],
  ])
  let idCalls = 0
  let dateCalls = 0
  const { promptService } = createPromptSystem(fakeStorage, {
    generatePromptId() {
      idCalls += 1
      throw new Error('synthetischer ID-Fehler')
    },
    getCurrentDate() {
      dateCalls += 1
      return new Date()
    },
  })

  const result = promptService.createPrompt({
    title: 'Prompt ohne ID',
    content: 'Prüfe den kontrollierten Fehlerpfad.',
  })

  assert.equal(result.ok, false)
  assert.equal(result.status, 'generationFailed')
  assert.equal(result.error.code, 'promptIdGenerationFailed')
  assert.deepEqual(result.prompts, [])
  assert.equal(idCalls, 5)
  assert.equal(dateCalls, 0)
  assert.equal(fakeStorage.peek(PROMPT_STORAGE_KEY), initialEnvelope)
  assert.equal(fakeStorage.setItemCalls, 0)
})

test('behandelt einen nicht konvertierbaren Zeitwert kontrolliert', () => {
  const initialEnvelope = createStoredEnvelope([])
  const fakeStorage = new FakeStorage([
    [PROMPT_STORAGE_KEY, initialEnvelope],
  ])
  const { promptService } = createPromptSystem(fakeStorage, {
    generatePromptId: () => 'prompt-invalid-time-001',
    getCurrentDate: () => Symbol('ungültiger Zeitwert'),
  })
  let result

  assert.doesNotThrow(() => {
    result = promptService.createPrompt({
      title: 'Prompt ohne Zeitwert',
      content: 'Prüfe den kontrollierten Fehlerpfad.',
    })
  })

  assert.equal(result.ok, false)
  assert.equal(result.status, 'generationFailed')
  assert.equal(result.error.code, 'promptTimestampGenerationFailed')
  assert.deepEqual(result.prompts, [])
  assert.equal(fakeStorage.peek(PROMPT_STORAGE_KEY), initialEnvelope)
  assert.equal(fakeStorage.setItemCalls, 0)
})

test('erstellt bei beschädigten Storage-Daten keinen Prompt', () => {
  const corruptedJson = '{broken'
  const fakeStorage = new FakeStorage([
    [PROMPT_STORAGE_KEY, corruptedJson],
  ])
  let metadataCalls = 0
  const { promptService } = createPromptSystem(fakeStorage, {
    generatePromptId() {
      metadataCalls += 1
      return 'prompt-unused'
    },
    getCurrentDate() {
      metadataCalls += 1
      return new Date()
    },
  })

  const result = promptService.createPrompt({
    title: 'Prompt bei beschädigten Daten',
    content: 'Darf den vorhandenen Storage-Wert nicht überschreiben.',
  })

  assert.equal(result.ok, false)
  assert.equal(result.status, 'invalidJson')
  assert.equal(result.error.code, 'invalidJson')
  assert.deepEqual(result.prompts, [])
  assert.equal(metadataCalls, 0)
  assert.equal(fakeStorage.peek(PROMPT_STORAGE_KEY), corruptedJson)
  assert.equal(fakeStorage.setItemCalls, 0)
})

test('setzt einen Favoriten dauerhaft und erhält dessen Erstellzeit', () => {
  const initialPrompt = {
    ...customPrompt,
    isFavorite: false,
  }
  const unchangedPrompt = {
    ...customPrompt,
    id: 'prompt-custom-002',
    title: 'Unveränderter Prompt',
    isFavorite: false,
  }
  const fakeStorage = new FakeStorage([
    [
      PROMPT_STORAGE_KEY,
      createStoredEnvelope([initialPrompt, unchangedPrompt]),
    ],
  ])
  let dateCalls = 0
  const firstService = createPromptSystem(fakeStorage, {
    getCurrentDate() {
      dateCalls += 1
      return new Date('2026-07-12T13:00:00.000Z')
    },
  }).promptService

  const updateResult = firstService.setPromptFavorite(
    initialPrompt.id,
    true
  )

  assert.equal(updateResult.ok, true)
  assert.equal(updateResult.status, 'favoriteUpdated')
  assert.equal(updateResult.favoriteChanged, true)
  assert.deepEqual(updateResult.updatedPrompt, {
    ...initialPrompt,
    updatedAt: '2026-07-12T13:00:00.000Z',
    isFavorite: true,
  })
  assert.equal(
    updateResult.updatedPrompt.createdAt,
    initialPrompt.createdAt
  )
  assert.deepEqual(updateResult.prompts, [
    updateResult.updatedPrompt,
    unchangedPrompt,
  ])
  assert.equal(dateCalls, 1)
  assert.equal(fakeStorage.setItemCalls, 1)

  const storedEnvelope = JSON.parse(fakeStorage.peek(PROMPT_STORAGE_KEY))
  assert.deepEqual(storedEnvelope.prompts, [
    updateResult.updatedPrompt,
    unchangedPrompt,
  ])

  const restartedService = createPromptSystem(fakeStorage).promptService
  const reloadResult = restartedService.loadPrompts()

  assert.deepEqual(reloadResult.prompts, [
    updateResult.updatedPrompt,
    unchangedPrompt,
  ])
})

test('entfernt einen Favoriten dauerhaft', () => {
  const initialPrompt = {
    ...customPrompt,
    isFavorite: true,
  }
  const fakeStorage = new FakeStorage([
    [PROMPT_STORAGE_KEY, createStoredEnvelope([initialPrompt])],
  ])
  const firstService = createPromptSystem(fakeStorage, {
    getCurrentDate: () => new Date('2026-07-12T13:30:00.000Z'),
  }).promptService

  const updateResult = firstService.setPromptFavorite(
    initialPrompt.id,
    false
  )

  assert.equal(updateResult.ok, true)
  assert.equal(updateResult.favoriteChanged, true)
  assert.equal(updateResult.updatedPrompt.isFavorite, false)
  assert.equal(
    updateResult.updatedPrompt.updatedAt,
    '2026-07-12T13:30:00.000Z'
  )
  assert.equal(
    updateResult.updatedPrompt.createdAt,
    initialPrompt.createdAt
  )

  const restartedService = createPromptSystem(fakeStorage).promptService
  const reloadResult = restartedService.loadPrompts()

  assert.equal(reloadResult.prompts[0].isFavorite, false)
  assert.equal(
    reloadResult.prompts[0].updatedAt,
    '2026-07-12T13:30:00.000Z'
  )
})

test('wiederholt einen identischen Favoriten-Sollwert ohne Änderungen', () => {
  const initialPrompt = {
    ...customPrompt,
    isFavorite: false,
  }
  const fakeStorage = new FakeStorage([
    [PROMPT_STORAGE_KEY, createStoredEnvelope([initialPrompt])],
  ])
  let dateCalls = 0
  const { promptService } = createPromptSystem(fakeStorage, {
    getCurrentDate() {
      dateCalls += 1
      return new Date('2026-07-12T14:00:00.000Z')
    },
  })

  const firstResult = promptService.setPromptFavorite(
    initialPrompt.id,
    true
  )
  const storedAfterFirstUpdate = fakeStorage.peek(PROMPT_STORAGE_KEY)
  const result = promptService.setPromptFavorite(initialPrompt.id, true)

  assert.equal(firstResult.favoriteChanged, true)
  assert.equal(result.ok, true)
  assert.equal(result.status, 'favoriteUpdated')
  assert.equal(result.favoriteChanged, false)
  assert.deepEqual(result.updatedPrompt, firstResult.updatedPrompt)
  assert.deepEqual(result.prompts, firstResult.prompts)
  assert.equal(dateCalls, 1)
  assert.equal(fakeStorage.setItemCalls, 1)
  assert.equal(
    fakeStorage.peek(PROMPT_STORAGE_KEY),
    storedAfterFirstUpdate
  )
})

test('verhindert einen rückläufigen Favoriten-Zeitstempel', () => {
  const initialPrompt = {
    ...customPrompt,
    updatedAt: '2026-07-12T15:00:00.000Z',
    isFavorite: false,
  }
  const initialEnvelope = createStoredEnvelope([initialPrompt])
  const fakeStorage = new FakeStorage([
    [PROMPT_STORAGE_KEY, initialEnvelope],
  ])
  const { promptService } = createPromptSystem(fakeStorage, {
    getCurrentDate: () => new Date('2026-07-12T14:59:59.999Z'),
  })

  const result = promptService.setPromptFavorite(initialPrompt.id, true)

  assert.equal(result.ok, false)
  assert.equal(result.status, 'generationFailed')
  assert.equal(result.error.code, 'promptTimestampGenerationFailed')
  assert.deepEqual(result.prompts, [initialPrompt])
  assert.equal(fakeStorage.setItemCalls, 0)
  assert.equal(fakeStorage.peek(PROMPT_STORAGE_KEY), initialEnvelope)
})

test('weist ungültige Favoritenargumente vor jedem Storage-Zugriff zurück', () => {
  const testCases = [
    {
      promptId: '   ',
      isFavorite: true,
      errorCode: 'invalidPromptId',
    },
    {
      promptId: null,
      isFavorite: false,
      errorCode: 'invalidPromptId',
    },
    {
      promptId: customPrompt.id,
      isFavorite: 'true',
      errorCode: 'invalidPromptFavoriteValue',
    },
    {
      promptId: customPrompt.id,
      isFavorite: null,
      errorCode: 'invalidPromptFavoriteValue',
    },
  ]

  for (const testCase of testCases) {
    const fakeStorage = new FakeStorage()
    const { promptService } = createPromptSystem(fakeStorage)

    const result = promptService.setPromptFavorite(
      testCase.promptId,
      testCase.isFavorite
    )

    assert.equal(result.ok, false)
    assert.equal(result.status, 'validationFailed')
    assert.equal(result.error.code, testCase.errorCode)
    assert.deepEqual(result.prompts, [])
    assert.equal(fakeStorage.getItemCalls, 0)
    assert.equal(fakeStorage.setItemCalls, 0)
  }
})

test('behandelt eine unbekannte Favoriten-ID ohne Schreibzugriff', () => {
  const initialPrompt = {
    ...customPrompt,
    isFavorite: false,
  }
  const initialEnvelope = createStoredEnvelope([initialPrompt])
  const fakeStorage = new FakeStorage([
    [PROMPT_STORAGE_KEY, initialEnvelope],
  ])
  let dateCalls = 0
  const { promptService } = createPromptSystem(fakeStorage, {
    getCurrentDate() {
      dateCalls += 1
      return new Date()
    },
  })

  const result = promptService.setPromptFavorite(
    'prompt-unknown-999',
    true
  )

  assert.equal(result.ok, false)
  assert.equal(result.status, 'notFound')
  assert.equal(result.error.code, 'promptNotFound')
  assert.deepEqual(result.prompts, [initialPrompt])
  assert.equal(dateCalls, 0)
  assert.equal(fakeStorage.setItemCalls, 0)
  assert.equal(fakeStorage.peek(PROMPT_STORAGE_KEY), initialEnvelope)
})

test('erhält Favoritenstatus und Promptliste bei Schreibfehlern', () => {
  const errorCases = [
    {
      errorName: 'QuotaExceededError',
      status: 'quotaExceeded',
      errorCode: 'storageQuotaExceeded',
    },
    {
      errorName: 'SecurityError',
      status: 'unavailable',
      errorCode: 'storageUnavailable',
    },
    {
      errorName: 'Error',
      status: 'writeFailed',
      errorCode: 'storageWriteFailed',
    },
  ]

  for (const errorCase of errorCases) {
    const initialPrompt = {
      ...customPrompt,
      isFavorite: false,
    }
    const initialEnvelope = createStoredEnvelope([initialPrompt])
    const fakeStorage = new FakeStorage([
      [PROMPT_STORAGE_KEY, initialEnvelope],
    ])
    const { promptService } = createPromptSystem(fakeStorage, {
      getCurrentDate: () => new Date('2026-07-12T14:30:00.000Z'),
    })
    fakeStorage.writeError = createStorageError(errorCase.errorName)

    const result = promptService.setPromptFavorite(
      initialPrompt.id,
      true
    )

    assert.equal(result.ok, false)
    assert.equal(result.status, errorCase.status)
    assert.equal(result.error.code, errorCase.errorCode)
    assert.equal(Object.hasOwn(result, 'updatedPrompt'), false)
    assert.deepEqual(result.prompts, [initialPrompt])
    assert.equal(fakeStorage.peek(PROMPT_STORAGE_KEY), initialEnvelope)
    assert.equal(fakeStorage.setItemCalls, 1)

    fakeStorage.writeError = null
    const restartedService = createPromptSystem(fakeStorage).promptService
    const reloadResult = restartedService.loadPrompts()

    assert.deepEqual(reloadResult.prompts, [initialPrompt])
  }
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

test('speichert beim Löschen des letzten Prompts ein leeres Array', () => {
  const fakeStorage = new FakeStorage([
    [PROMPT_STORAGE_KEY, createStoredEnvelope([customPrompt])],
  ])
  const { promptService } = createPromptSystem(fakeStorage)

  const deleteResult = promptService.deletePrompt(customPrompt.id)

  assert.equal(deleteResult.ok, true)
  assert.deepEqual(deleteResult.prompts, [])

  const storedEnvelope = JSON.parse(fakeStorage.peek(PROMPT_STORAGE_KEY))
  assert.deepEqual(storedEnvelope.prompts, [])

  const restartedService = createPromptSystem(fakeStorage).promptService
  const reloadedResult = restartedService.loadPrompts()

  assert.equal(reloadedResult.ok, true)
  assert.equal(reloadedResult.status, 'loaded')
  assert.deepEqual(reloadedResult.prompts, [])
  assert.equal(fakeStorage.setItemCalls, 1)
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
