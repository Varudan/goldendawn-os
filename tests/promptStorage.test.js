import assert from 'node:assert/strict'
import test from 'node:test'

import { createStorageAdapter } from '../src/storage/storageAdapter.js'
import {
  createPromptStorage,
  PROMPT_SCHEMA_VERSION,
  PROMPT_STORAGE_KEY,
} from '../src/storage/promptStorage.js'
import { FakeStorage } from './helpers/fakeStorage.js'

const basePrompt = Object.freeze({
  id: 'prompt-storage-001',
  title: 'Storage-Vertrag prüfen',
  category: 'Test',
  description: 'Ein synthetischer Prompt für Storage-Tests.',
  content: 'Prüfe den lokalen Storage-Vertrag.',
  createdAt: '2026-07-10T08:00:00.000Z',
  updatedAt: '2026-07-10T09:00:00.000Z',
  isFavorite: false,
  isDemo: false,
})

function createVersion(prompt, overrides = {}) {
  return {
    versionNumber: 1,
    title: prompt.title,
    category: prompt.category,
    description: prompt.description,
    content: prompt.content,
    createdAt: prompt.createdAt,
    changeType: 'created',
    restoredFromVersion: null,
    ...overrides,
  }
}

function createSchemaTwoPrompt(overrides = {}) {
  const { versions, ...promptOverrides } = overrides
  const prompt = {
    ...basePrompt,
    ...promptOverrides,
  }

  return {
    ...prompt,
    versions: versions ?? [createVersion(prompt)],
  }
}

function createEditedPrompt() {
  const firstPrompt = createSchemaTwoPrompt()
  const editedValues = {
    title: 'Storage-Vertrag vollständig prüfen',
    category: 'Qualität',
    description: '',
    content: 'Prüfe Schema, Migration und Fehlerpfade.',
  }
  const editedAt = '2026-07-11T10:00:00.000Z'
  const editedPrompt = {
    ...firstPrompt,
    ...editedValues,
    updatedAt: editedAt,
  }

  return {
    ...editedPrompt,
    versions: [
      ...firstPrompt.versions,
      createVersion(editedPrompt, {
        versionNumber: 2,
        createdAt: editedAt,
        changeType: 'edited',
      }),
    ],
  }
}

function createEnvelope(schemaVersion, prompts) {
  return {
    schemaVersion,
    prompts,
  }
}

function createStorageSystem(envelope) {
  const rawValue = JSON.stringify(envelope)
  const fakeStorage = new FakeStorage([
    [PROMPT_STORAGE_KEY, rawValue],
  ])
  const promptStorage = createPromptStorage(
    createStorageAdapter(fakeStorage)
  )

  return {
    fakeStorage,
    promptStorage,
    rawValue,
  }
}

test('behält den Storage-Key und schreibt ausschließlich Envelope-Schema 2', () => {
  const fakeStorage = new FakeStorage()
  const promptStorage = createPromptStorage(
    createStorageAdapter(fakeStorage)
  )
  const prompt = createSchemaTwoPrompt()

  const result = promptStorage.savePromptCollection([prompt])

  assert.equal(PROMPT_STORAGE_KEY, 'goldendawn.promptVault.v1')
  assert.equal(PROMPT_SCHEMA_VERSION, 2)
  assert.equal(result.ok, true)
  assert.equal(result.status, 'saved')
  assert.deepEqual(JSON.parse(fakeStorage.peek(PROMPT_STORAGE_KEY)), {
    schemaVersion: 2,
    prompts: [prompt],
  })
})

test('migriert gültiges Schema 1 deterministisch zu einer ehrlichen Baseline', () => {
  const legacyPrompt = {
    ...basePrompt,
  }
  delete legacyPrompt.isFavorite
  delete legacyPrompt.isDemo
  const { fakeStorage, promptStorage, rawValue } = createStorageSystem(
    createEnvelope(1, [legacyPrompt])
  )

  const firstResult = promptStorage.loadPromptCollection()
  const secondResult = promptStorage.loadPromptCollection()
  const expectedPrompt = {
    ...legacyPrompt,
    isFavorite: false,
    isDemo: false,
    versions: [
      {
        versionNumber: 1,
        title: legacyPrompt.title,
        category: legacyPrompt.category,
        description: legacyPrompt.description,
        content: legacyPrompt.content,
        createdAt: legacyPrompt.updatedAt,
        changeType: 'migrated',
        restoredFromVersion: null,
      },
    ],
  }

  assert.deepEqual(firstResult, {
    ok: true,
    status: 'found',
    prompts: [expectedPrompt],
    sourceSchemaVersion: 1,
    migrationNeeded: true,
  })
  assert.deepEqual(secondResult, firstResult)
  assert.notStrictEqual(secondResult.prompts, firstResult.prompts)
  assert.notStrictEqual(
    secondResult.prompts[0].versions,
    firstResult.prompts[0].versions
  )
  assert.equal(fakeStorage.peek(PROMPT_STORAGE_KEY), rawValue)
  assert.equal(fakeStorage.setItemCalls, 0)
})

test('bewahrt ein leeres Schema-1-Array beim reinen Laden unverändert', () => {
  const { fakeStorage, promptStorage, rawValue } = createStorageSystem(
    createEnvelope(1, [])
  )

  const result = promptStorage.loadPromptCollection()

  assert.equal(result.ok, true)
  assert.equal(result.sourceSchemaVersion, 1)
  assert.equal(result.migrationNeeded, true)
  assert.deepEqual(result.prompts, [])
  assert.equal(fakeStorage.peek(PROMPT_STORAGE_KEY), rawValue)
  assert.equal(fakeStorage.setItemCalls, 0)
})

test('weist persistierte Versionsdaten in Schema 1 ohne Überschreiben ab', () => {
  const injectedVersion = {
    versionNumber: 88,
    title: 'Erfundene Historie',
  }
  const legacyPrompt = {
    ...basePrompt,
    versions: [injectedVersion],
  }
  const { fakeStorage, promptStorage, rawValue } = createStorageSystem(
    createEnvelope(1, [legacyPrompt])
  )

  const result = promptStorage.loadPromptCollection()

  assert.equal(result.ok, false)
  assert.equal(result.status, 'invalidStoredData')
  assert.equal(result.error.code, 'unexpectedLegacyPromptVersions')
  assert.deepEqual(result.prompts, [])
  assert.equal(fakeStorage.peek(PROMPT_STORAGE_KEY), rawValue)
  assert.equal(fakeStorage.setItemCalls, 0)
})

test('weist ungültige Schema-1-Daten ohne Reparatur oder Schreibzugriff ab', () => {
  const testCases = [
    {
      prompt: {
        ...basePrompt,
        category: null,
      },
      errorCode: 'invalidPromptData',
    },
    {
      prompt: {
        ...basePrompt,
        isDemo: 'false',
      },
      errorCode: 'invalidPromptData',
    },
  ]

  for (const testCase of testCases) {
    const { fakeStorage, promptStorage, rawValue } = createStorageSystem(
      createEnvelope(1, [testCase.prompt])
    )
    const result = promptStorage.loadPromptCollection()

    assert.equal(result.ok, false)
    assert.equal(result.status, 'invalidStoredData')
    assert.equal(result.error.code, testCase.errorCode)
    assert.deepEqual(result.prompts, [])
    assert.equal(fakeStorage.peek(PROMPT_STORAGE_KEY), rawValue)
    assert.equal(fakeStorage.setItemCalls, 0)
  }
})

test('reicht beschädigtes JSON mit sicherem Fallback ohne Überschreiben weiter', () => {
  const corruptedJson = '{broken'
  const fakeStorage = new FakeStorage([
    [PROMPT_STORAGE_KEY, corruptedJson],
  ])
  const promptStorage = createPromptStorage(
    createStorageAdapter(fakeStorage)
  )

  const result = promptStorage.loadPromptCollection()

  assert.equal(result.ok, false)
  assert.equal(result.status, 'invalidJson')
  assert.equal(result.error.code, 'invalidJson')
  assert.deepEqual(result.prompts, [])
  assert.equal(fakeStorage.peek(PROMPT_STORAGE_KEY), corruptedJson)
  assert.equal(fakeStorage.setItemCalls, 0)
})

test('lädt gültiges Schema 2 mit defensiv geklonter Historie', () => {
  const prompt = createEditedPrompt()
  const envelope = createEnvelope(2, [prompt])
  const storageAdapter = {
    readJson() {
      return {
        ok: true,
        status: 'found',
        value: envelope,
      }
    },
  }
  const promptStorage = createPromptStorage(storageAdapter)
  const snapshot = structuredClone(envelope)

  const result = promptStorage.loadPromptCollection()

  assert.equal(result.ok, true)
  assert.equal(result.sourceSchemaVersion, 2)
  assert.equal(result.migrationNeeded, false)
  assert.deepEqual(result.prompts, [prompt])
  assert.notStrictEqual(result.prompts[0], prompt)
  assert.notStrictEqual(result.prompts[0].versions, prompt.versions)
  assert.notStrictEqual(
    result.prompts[0].versions[0],
    prompt.versions[0]
  )

  result.prompts[0].versions[0].title = 'Nur die Rückgabe geändert'
  assert.deepEqual(envelope, snapshot)
})

test('akzeptiert restored als Vertragswert mit gültiger früherer Referenz', () => {
  const firstPrompt = createSchemaTwoPrompt()
  const restoredAt = '2026-07-11T11:00:00.000Z'
  const restoredPrompt = {
    ...firstPrompt,
    updatedAt: restoredAt,
    versions: [
      ...firstPrompt.versions,
      createVersion(firstPrompt, {
        versionNumber: 2,
        createdAt: restoredAt,
        changeType: 'restored',
        restoredFromVersion: 1,
      }),
    ],
  }
  const { promptStorage } = createStorageSystem(
    createEnvelope(2, [restoredPrompt])
  )

  const result = promptStorage.loadPromptCollection()

  assert.equal(result.ok, true)
  assert.deepEqual(result.prompts, [restoredPrompt])
})

test('weist fehlende, falsche und leere Versionshistorien präzise ab', () => {
  const promptWithoutVersions = { ...basePrompt }
  const testCases = [
    {
      prompt: promptWithoutVersions,
      errorCode: 'missingPromptVersions',
    },
    {
      prompt: { ...basePrompt, versions: null },
      errorCode: 'invalidPromptVersions',
    },
    {
      prompt: { ...basePrompt, versions: [] },
      errorCode: 'emptyPromptVersions',
    },
  ]

  for (const testCase of testCases) {
    const { fakeStorage, promptStorage, rawValue } = createStorageSystem(
      createEnvelope(2, [testCase.prompt])
    )
    const result = promptStorage.loadPromptCollection()

    assert.equal(result.ok, false)
    assert.equal(result.status, 'invalidStoredData')
    assert.equal(result.error.code, testCase.errorCode)
    assert.deepEqual(result.prompts, [])
    assert.equal(fakeStorage.peek(PROMPT_STORAGE_KEY), rawValue)
    assert.equal(fakeStorage.setItemCalls, 0)
  }
})

test('weist ungültige, doppelte und lückenhafte Versionsnummern ab', () => {
  const validPrompt = createSchemaTwoPrompt()
  const testCases = [
    {
      versions: [
        {
          ...validPrompt.versions[0],
          versionNumber: 0,
        },
      ],
      errorCode: 'invalidPromptVersionNumber',
    },
    {
      versions: [
        validPrompt.versions[0],
        {
          ...validPrompt.versions[0],
          versionNumber: 1,
          changeType: 'edited',
        },
      ],
      errorCode: 'nonSequentialPromptVersions',
    },
    {
      versions: [
        validPrompt.versions[0],
        {
          ...validPrompt.versions[0],
          versionNumber: 3,
          changeType: 'edited',
        },
      ],
      errorCode: 'nonSequentialPromptVersions',
    },
  ]

  for (const testCase of testCases) {
    const prompt = createSchemaTwoPrompt({
      versions: testCase.versions,
    })
    const { promptStorage } = createStorageSystem(
      createEnvelope(2, [prompt])
    )
    const result = promptStorage.loadPromptCollection()

    assert.equal(result.ok, false)
    assert.equal(result.status, 'invalidStoredData')
    assert.equal(result.error.code, testCase.errorCode)
    assert.deepEqual(result.prompts, [])
  }
})

test('weist ungültige changeType- und restoredFromVersion-Werte ab', () => {
  const validPrompt = createSchemaTwoPrompt()
  const secondVersion = {
    ...validPrompt.versions[0],
    versionNumber: 2,
    createdAt: '2026-07-11T12:00:00.000Z',
    changeType: 'edited',
  }
  const testCases = [
    {
      versions: [
        {
          ...validPrompt.versions[0],
          changeType: 'renamed',
        },
      ],
      errorCode: 'invalidPromptVersionChangeType',
    },
    {
      versions: [
        validPrompt.versions[0],
        {
          ...secondVersion,
          restoredFromVersion: 1,
        },
      ],
      errorCode: 'invalidPromptRestoredFromVersion',
    },
    {
      versions: [
        validPrompt.versions[0],
        {
          ...secondVersion,
          changeType: 'restored',
          restoredFromVersion: 2,
        },
      ],
      errorCode: 'invalidPromptRestoredFromVersion',
    },
  ]

  for (const testCase of testCases) {
    const prompt = createSchemaTwoPrompt({
      updatedAt: '2026-07-11T12:00:00.000Z',
      versions: testCase.versions,
    })
    const { promptStorage } = createStorageSystem(
      createEnvelope(2, [prompt])
    )
    const result = promptStorage.loadPromptCollection()

    assert.equal(result.ok, false)
    assert.equal(result.status, 'invalidStoredData')
    assert.equal(result.error.code, testCase.errorCode)
    assert.deepEqual(result.prompts, [])
  }
})

test('weist abweichende aktuelle Fassung und letzte Version ab', () => {
  const prompt = createSchemaTwoPrompt({
    title: 'Abweichender aktueller Titel',
    versions: [createVersion(basePrompt)],
  })
  const { fakeStorage, promptStorage, rawValue } = createStorageSystem(
    createEnvelope(2, [prompt])
  )

  const result = promptStorage.loadPromptCollection()

  assert.equal(result.ok, false)
  assert.equal(result.status, 'invalidStoredData')
  assert.equal(result.error.code, 'promptVersionContentMismatch')
  assert.deepEqual(result.prompts, [])
  assert.equal(fakeStorage.peek(PROMPT_STORAGE_KEY), rawValue)
  assert.equal(fakeStorage.setItemCalls, 0)
})

test('weist ungültige Versionsfelder und Versionszeitpunkte ab', () => {
  const validPrompt = createSchemaTwoPrompt()
  const missingFieldVersion = { ...validPrompt.versions[0] }
  delete missingFieldVersion.restoredFromVersion
  const testCases = [
    {
      version: missingFieldVersion,
      errorCode: 'invalidPromptVersionFields',
    },
    {
      version: {
        ...validPrompt.versions[0],
        unexpected: true,
      },
      errorCode: 'invalidPromptVersionFields',
    },
    {
      version: {
        ...validPrompt.versions[0],
        createdAt: '2026-07-10T08:00:00+02:00',
      },
      errorCode: 'invalidPromptVersionTimestamp',
    },
  ]

  for (const testCase of testCases) {
    const prompt = createSchemaTwoPrompt({
      versions: [testCase.version],
    })
    const { promptStorage } = createStorageSystem(
      createEnvelope(2, [prompt])
    )
    const result = promptStorage.loadPromptCollection()

    assert.equal(result.ok, false)
    assert.equal(result.status, 'invalidStoredData')
    assert.equal(result.error.code, testCase.errorCode)
    assert.deepEqual(result.prompts, [])
  }
})

test('weist ungültige Prompt-Zeitfolge und unbekannte Schemas ohne Schreiben ab', () => {
  const testCases = [
    {
      envelope: createEnvelope(2, [
        createSchemaTwoPrompt({
          createdAt: '2026-07-12T08:00:00.000Z',
          updatedAt: '2026-07-11T08:00:00.000Z',
        }),
      ]),
      status: 'invalidStoredData',
      errorCode: 'invalidPromptTimestamps',
    },
    {
      envelope: createEnvelope(99, []),
      status: 'unsupportedSchemaVersion',
      errorCode: 'unsupportedPromptSchemaVersion',
    },
  ]

  for (const testCase of testCases) {
    const { fakeStorage, promptStorage, rawValue } = createStorageSystem(
      testCase.envelope
    )
    const result = promptStorage.loadPromptCollection()

    assert.equal(result.ok, false)
    assert.equal(result.status, testCase.status)
    assert.equal(result.error.code, testCase.errorCode)
    assert.deepEqual(result.prompts, [])
    assert.equal(fakeStorage.peek(PROMPT_STORAGE_KEY), rawValue)
    assert.equal(fakeStorage.setItemCalls, 0)
  }
})

test('speichert auch ein leeres Array als gültigen persistenten Schema-2-Zustand', () => {
  const fakeStorage = new FakeStorage()
  const promptStorage = createPromptStorage(
    createStorageAdapter(fakeStorage)
  )

  const saveResult = promptStorage.savePromptCollection([])
  const loadResult = promptStorage.loadPromptCollection()

  assert.equal(saveResult.ok, true)
  assert.equal(loadResult.ok, true)
  assert.equal(loadResult.sourceSchemaVersion, 2)
  assert.deepEqual(loadResult.prompts, [])
  assert.deepEqual(JSON.parse(fakeStorage.peek(PROMPT_STORAGE_KEY)), {
    schemaVersion: 2,
    prompts: [],
  })
})

test('mutiert beim Speichern weder Prompt noch bestehende Versionen', () => {
  const fakeStorage = new FakeStorage()
  const promptStorage = createPromptStorage(
    createStorageAdapter(fakeStorage)
  )
  const prompts = [createEditedPrompt()]
  const snapshot = structuredClone(prompts)
  const promptReference = prompts[0]
  const versionsReference = prompts[0].versions
  const firstVersionReference = prompts[0].versions[0]

  const result = promptStorage.savePromptCollection(prompts)

  assert.equal(result.ok, true)
  assert.deepEqual(prompts, snapshot)
  assert.strictEqual(prompts[0], promptReference)
  assert.strictEqual(prompts[0].versions, versionsReference)
  assert.strictEqual(prompts[0].versions[0], firstVersionReference)
})

test('weist ungültige Save-Eingaben vor jedem Schreibzugriff ab', () => {
  const fakeStorage = new FakeStorage()
  const promptStorage = createPromptStorage(
    createStorageAdapter(fakeStorage)
  )
  const invalidPrompt = {
    ...basePrompt,
    versions: [],
  }

  const result = promptStorage.savePromptCollection([invalidPrompt])

  assert.equal(result.ok, false)
  assert.equal(result.status, 'validationFailed')
  assert.equal(result.error.code, 'invalidPromptCollection')
  assert.equal(fakeStorage.setItemCalls, 0)
  assert.equal(fakeStorage.peek(PROMPT_STORAGE_KEY), null)
})
