import assert from 'node:assert/strict'
import test from 'node:test'

import { createStorageAdapter } from '../src/storage/storageAdapter.js'
import {
  createLearningArtifactStorage,
  LEARNING_ARTIFACT_STORAGE_KEY,
} from '../src/storage/learningArtifactStorage.js'
import { createStorageError, FakeStorage } from './helpers/fakeStorage.js'

function createArtifact(overrides = {}) {
  return {
    id: 'artifact-cinder-note',
    type: 'note',
    moduleId: 'module-cinder',
    chapterId: 'chapter-cinder-map',
    learningNodeId: 'node-cinder-route',
    content: 'Erfundene lokale Notiz.',
    createdAt: '2026-07-19T09:00:00.000Z',
    updatedAt: '2026-07-19T09:00:00.000Z',
    ...overrides,
  }
}

function createPrivateStore(artifacts = [createArtifact()]) {
  return {
    schemaVersion: 1,
    dataOrigin: 'private',
    artifacts,
  }
}

function createStorageSystem(initialValue) {
  const initialEntries = initialValue === undefined
    ? []
    : [[LEARNING_ARTIFACT_STORAGE_KEY, initialValue]]
  const fakeStorage = new FakeStorage(initialEntries)
  const learningArtifactStorage = createLearningArtifactStorage(
    createStorageAdapter(fakeStorage)
  )

  return { fakeStorage, learningArtifactStorage }
}

test('verwendet ausschließlich den festen LearningArtifact-Storage-Key', () => {
  const readKeys = []
  const writeKeys = []
  const storage = createLearningArtifactStorage({
    readJson(key) {
      readKeys.push(key)
      return { ok: true, status: 'missing' }
    },
    writeJson(key) {
      writeKeys.push(key)
      return { ok: true, status: 'saved' }
    },
  })

  storage.loadLearningArtifacts()
  storage.saveLearningArtifacts(createPrivateStore())

  assert.equal(
    LEARNING_ARTIFACT_STORAGE_KEY,
    'goldendawn.learningHub.artifacts.v1'
  )
  assert.deepEqual(readKeys, [
    LEARNING_ARTIFACT_STORAGE_KEY,
    LEARNING_ARTIFACT_STORAGE_KEY,
  ])
  assert.deepEqual(writeKeys, [LEARNING_ARTIFACT_STORAGE_KEY])
  assert.equal(Object.isFrozen(storage), true)
})

test('liefert bei fehlendem Key frische private Leerzustände ohne Schreiben', () => {
  const { fakeStorage, learningArtifactStorage } = createStorageSystem()

  const firstResult = learningArtifactStorage.loadLearningArtifacts()
  firstResult.artifactStore.artifacts.push(createArtifact())
  const secondResult = learningArtifactStorage.loadLearningArtifacts()

  assert.deepEqual(secondResult, {
    ok: true,
    status: 'missing',
    artifactStore: {
      schemaVersion: 1,
      dataOrigin: 'private',
      artifacts: [],
    },
  })
  assert.notStrictEqual(firstResult.artifactStore, secondResult.artifactStore)
  assert.notStrictEqual(
    firstResult.artifactStore.artifacts,
    secondResult.artifactStore.artifacts
  )
  assert.equal(fakeStorage.getItemCalls, 2)
  assert.equal(fakeStorage.setItemCalls, 0)
  assert.equal(fakeStorage.peek(LEARNING_ARTIFACT_STORAGE_KEY), null)
})

test('lädt einen gültigen privaten Store tief defensiv geklont', () => {
  const storedArtifactStore = createPrivateStore()
  const storedSnapshot = structuredClone(storedArtifactStore)
  const storage = createLearningArtifactStorage({
    readJson() {
      return {
        ok: true,
        status: 'found',
        value: storedArtifactStore,
      }
    },
  })

  const result = storage.loadLearningArtifacts()

  assert.deepEqual(result, {
    ok: true,
    status: 'found',
    artifactStore: storedSnapshot,
  })
  assert.notStrictEqual(result.artifactStore, storedArtifactStore)
  assert.notStrictEqual(result.artifactStore.artifacts, storedArtifactStore.artifacts)
  assert.notStrictEqual(
    result.artifactStore.artifacts[0],
    storedArtifactStore.artifacts[0]
  )

  result.artifactStore.artifacts[0].content = 'Nur die Rückgabe geändert.'
  assert.deepEqual(storedArtifactStore, storedSnapshot)
})

test('speichert vollständig, tief geklont und ohne Eingabemutation', () => {
  const artifactStore = createPrivateStore()
  const inputSnapshot = structuredClone(artifactStore)
  let writtenStore
  let writeCalls = 0
  const storage = createLearningArtifactStorage({
    readJson() {
      return { ok: true, status: 'missing' }
    },
    writeJson(key, value) {
      writeCalls += 1
      assert.equal(key, LEARNING_ARTIFACT_STORAGE_KEY)
      writtenStore = value
      return { ok: true, status: 'saved' }
    },
  })

  const result = storage.saveLearningArtifacts(artifactStore)

  assert.deepEqual(result, { ok: true, status: 'saved' })
  assert.equal(writeCalls, 1)
  assert.deepEqual(writtenStore, artifactStore)
  assert.notStrictEqual(writtenStore, artifactStore)
  assert.notStrictEqual(writtenStore.artifacts, artifactStore.artifacts)
  assert.notStrictEqual(writtenStore.artifacts[0], artifactStore.artifacts[0])

  writtenStore.artifacts[0].content = 'Nur den Adapterwert geändert.'
  assert.deepEqual(artifactStore, inputSnapshot)
})

test('lässt beschädigtes JSON und ungültige Schema-Daten unangetastet', () => {
  const rawValues = [
    '{broken',
    JSON.stringify({ ...createPrivateStore(), schemaVersion: 2 }),
    JSON.stringify({ ...createPrivateStore(), artifacts: null }),
    JSON.stringify(createPrivateStore([
      createArtifact(),
      createArtifact({ id: 'artifact-cinder-second' }),
    ])),
  ]

  for (const rawValue of rawValues) {
    const { fakeStorage, learningArtifactStorage } = createStorageSystem(
      rawValue
    )
    const result = learningArtifactStorage.loadLearningArtifacts()

    assert.equal(result.ok, false)
    assert.equal(
      ['invalidJson', 'invalidStoredData'].includes(result.status),
      true
    )
    assert.equal(fakeStorage.peek(LEARNING_ARTIFACT_STORAGE_KEY), rawValue)
    assert.equal(fakeStorage.setItemCalls, 0)
    assert.equal(Object.hasOwn(result, 'artifactStore'), false)
  }
})

test('weist synthetische Daten an der privaten Storage-Grenze zurück', () => {
  const syntheticStore = {
    ...createPrivateStore(),
    dataOrigin: 'synthetic',
  }
  const rawValue = JSON.stringify(syntheticStore)
  const { fakeStorage, learningArtifactStorage } = createStorageSystem(rawValue)

  const loadResult = learningArtifactStorage.loadLearningArtifacts()
  const saveResult = learningArtifactStorage.saveLearningArtifacts(
    syntheticStore
  )

  assert.equal(loadResult.ok, false)
  assert.equal(loadResult.status, 'invalidStoredData')
  assert.equal(loadResult.error.code, 'privateLearningArtifactsRequired')
  assert.equal(saveResult.ok, false)
  assert.equal(saveResult.status, 'validationFailed')
  assert.equal(saveResult.error.code, 'privateLearningArtifactsRequired')
  assert.equal(fakeStorage.peek(LEARNING_ARTIFACT_STORAGE_KEY), rawValue)
  assert.equal(fakeStorage.setItemCalls, 0)
})

test('überschreibt keine vorhandenen beschädigten oder synthetischen Daten', () => {
  const protectedRawValues = [
    '{broken',
    JSON.stringify({
      ...createPrivateStore(),
      dataOrigin: 'synthetic',
    }),
    JSON.stringify({
      ...createPrivateStore(),
      schemaVersion: 7,
    }),
  ]

  for (const protectedRawValue of protectedRawValues) {
    const { fakeStorage, learningArtifactStorage } = createStorageSystem(
      protectedRawValue
    )
    const result = learningArtifactStorage.saveLearningArtifacts(
      createPrivateStore()
    )

    assert.equal(result.ok, false)
    assert.equal(
      ['invalidJson', 'invalidStoredData'].includes(result.status),
      true
    )
    assert.equal(
      fakeStorage.peek(LEARNING_ARTIFACT_STORAGE_KEY),
      protectedRawValue
    )
    assert.equal(fakeStorage.setItemCalls, 0)
  }
})

test('speichert nach gültigem privatem Save-Preflight exakt einmal', () => {
  const existingStore = createPrivateStore()
  const nextStore = createPrivateStore([
    createArtifact({
      content: 'Erfundener aktualisierter Artefakttext.',
      updatedAt: '2026-07-19T09:30:00.000Z',
    }),
  ])
  let readCalls = 0
  let writeCalls = 0
  let writtenStore
  const storage = createLearningArtifactStorage({
    readJson(key) {
      readCalls += 1
      assert.equal(key, LEARNING_ARTIFACT_STORAGE_KEY)
      return {
        ok: true,
        status: 'found',
        value: existingStore,
      }
    },
    writeJson(key, value) {
      writeCalls += 1
      assert.equal(key, LEARNING_ARTIFACT_STORAGE_KEY)
      writtenStore = value
      return { ok: true, status: 'saved' }
    },
  })

  const result = storage.saveLearningArtifacts(nextStore)

  assert.deepEqual(result, { ok: true, status: 'saved' })
  assert.equal(readCalls, 1)
  assert.equal(writeCalls, 1)
  assert.deepEqual(writtenStore, nextStore)
  assert.notStrictEqual(writtenStore, nextStore)
})

test('blockiert bei bekanntem Lesefehler jeden Preflight-Schreibzugriff', () => {
  const privateDependencyMessage =
    'private-preflight-read-message-sentinel'
  let readCalls = 0
  let writeCalls = 0
  const storage = createLearningArtifactStorage({
    readJson() {
      readCalls += 1
      return {
        ok: false,
        status: 'readFailed',
        error: {
          code: 'storageReadFailed',
          message: privateDependencyMessage,
        },
      }
    },
    writeJson() {
      writeCalls += 1
      return { ok: true, status: 'saved' }
    },
  })

  const result = storage.saveLearningArtifacts(createPrivateStore())

  assert.equal(result.ok, false)
  assert.equal(result.status, 'readFailed')
  assert.equal(result.error.code, 'storageReadFailed')
  assert.equal(
    JSON.stringify(result.error).includes(privateDependencyMessage),
    false
  )
  assert.equal(readCalls, 1)
  assert.equal(writeCalls, 0)
})

test('validiert vor jedem Schreiben den vollständigen Store', () => {
  const invalidStores = [
    null,
    { schemaVersion: 1, dataOrigin: 'private', artifacts: null },
    createPrivateStore([createArtifact({ content: ' ungetrimmt ' })]),
    createPrivateStore([
      createArtifact(),
      createArtifact({ id: 'artifact-second' }),
    ]),
  ]
  let writeCalls = 0
  const storage = createLearningArtifactStorage({
    writeJson() {
      writeCalls += 1
      return { ok: true, status: 'saved' }
    },
  })

  for (const invalidStore of invalidStores) {
    const snapshot = structuredClone(invalidStore)
    const result = storage.saveLearningArtifacts(invalidStore)

    assert.equal(result.ok, false)
    assert.equal(result.status, 'validationFailed')
    assert.equal(result.error.code, 'invalidLearningArtifactData')
    assert.deepEqual(invalidStore, snapshot)
  }

  assert.equal(writeCalls, 0)
})

test('behandelt reale Lese-, Quota- und Schreibfehler kontrolliert', () => {
  const readStorage = new FakeStorage()
  readStorage.readError = createStorageError('SecurityError')
  const readResult = createLearningArtifactStorage(
    createStorageAdapter(readStorage)
  ).loadLearningArtifacts()

  assert.equal(readResult.ok, false)
  assert.equal(readResult.status, 'unavailable')
  assert.equal(readResult.error.code, 'storageUnavailable')
  assert.equal(readStorage.setItemCalls, 0)

  const writeCases = [
    ['QuotaExceededError', 'quotaExceeded', 'storageQuotaExceeded'],
    ['SecurityError', 'unavailable', 'storageUnavailable'],
    ['Error', 'writeFailed', 'storageWriteFailed'],
  ]

  for (const [errorName, status, errorCode] of writeCases) {
    const fakeStorage = new FakeStorage()
    fakeStorage.writeError = createStorageError(errorName)
    const result = createLearningArtifactStorage(
      createStorageAdapter(fakeStorage)
    ).saveLearningArtifacts(createPrivateStore())

    assert.equal(result.ok, false)
    assert.equal(result.status, status)
    assert.equal(result.error.code, errorCode)
    assert.equal(fakeStorage.setItemCalls, 1)
    assert.equal(fakeStorage.peek(LEARNING_ARTIFACT_STORAGE_KEY), null)
  }
})

test('meldet fehlende Adaptermethoden kontrolliert', () => {
  const results = [
    createLearningArtifactStorage().loadLearningArtifacts(),
    createLearningArtifactStorage().saveLearningArtifacts(
      createPrivateStore()
    ),
    createLearningArtifactStorage({
      writeJson() {
        return { ok: true, status: 'saved' }
      },
    }).loadLearningArtifacts(),
    createLearningArtifactStorage({
      readJson() {
        return { ok: true, status: 'missing' }
      },
    }).saveLearningArtifacts(createPrivateStore()),
  ]

  results.forEach((result) => {
    assert.equal(result.ok, false)
    assert.equal(result.status, 'unavailable')
    assert.equal(result.error.code, 'storageAdapterUnavailable')
  })
})

test('normalisiert geworfene, fremde und formal unbrauchbare Adapterresultate', () => {
  const privateMarker = 'private-adapter-message-sentinel'
  const throwingStorage = createLearningArtifactStorage({
    readJson() {
      throw new Error(privateMarker)
    },
    writeJson() {
      throw new Error(privateMarker)
    },
  })

  for (const result of [
    throwingStorage.loadLearningArtifacts(),
    throwingStorage.saveLearningArtifacts(createPrivateStore()),
    createLearningArtifactStorage({
      readJson() {
        return { ok: true, status: 'found' }
      },
    }).loadLearningArtifacts(),
    createLearningArtifactStorage({
      readJson() {
        return { ok: true, status: 'missing' }
      },
      writeJson() {
        return { ok: true, status: 'found' }
      },
    }).saveLearningArtifacts(createPrivateStore()),
    createLearningArtifactStorage({
      readJson() {
        return {
          ok: false,
          status: 'readFailed',
          error: { code: 'privateUnknownCode', message: privateMarker },
        }
      },
    }).loadLearningArtifacts(),
    createLearningArtifactStorage({
      readJson() {
        return {
          ok: false,
          status: 'readFailed',
          error: { code: 'storageReadFailed' },
        }
      },
    }).loadLearningArtifacts(),
  ]) {
    assert.equal(result.ok, false)
    assert.equal(result.status, 'storageFailed')
    assert.equal(result.error.code, 'unexpectedStorageResult')
    assert.equal(JSON.stringify(result.error).includes(privateMarker), false)
  }
})

test('sanitisiert bekannte Adapterfehler und gibt keine fremde Nachricht weiter', () => {
  const privateMarker = 'private-quota-message-sentinel'
  const storage = createLearningArtifactStorage({
    readJson() {
      return { ok: true, status: 'missing' }
    },
    writeJson() {
      return {
        ok: false,
        status: 'quotaExceeded',
        error: {
          code: 'storageQuotaExceeded',
          message: privateMarker,
        },
      }
    },
  })

  const result = storage.saveLearningArtifacts(createPrivateStore())

  assert.equal(result.status, 'quotaExceeded')
  assert.equal(result.error.code, 'storageQuotaExceeded')
  assert.equal(JSON.stringify(result.error).includes(privateMarker), false)
})

test('weist geerbte Pflichtfelder und prototypische Fehlercodes zurück', () => {
  const inheritedStore = Object.create(createPrivateStore())
  let writeCalls = 0
  const storage = createLearningArtifactStorage({
    readJson() {
      return { ok: true, status: 'missing' }
    },
    writeJson() {
      writeCalls += 1
      return { ok: true, status: 'saved' }
    },
  })
  const inheritedResult = storage.saveLearningArtifacts(inheritedStore)
  const prototypeCodeResult = createLearningArtifactStorage({
    readJson() {
      return {
        ok: false,
        status: 'readFailed',
        error: {
          code: 'constructor',
          message: 'private-prototype-message-sentinel',
        },
      }
    },
  }).loadLearningArtifacts()

  assert.equal(inheritedResult.ok, false)
  assert.equal(inheritedResult.status, 'validationFailed')
  assert.equal(writeCalls, 0)
  assert.equal(prototypeCodeResult.ok, false)
  assert.equal(prototypeCodeResult.status, 'storageFailed')
  assert.equal(prototypeCodeResult.error.code, 'unexpectedStorageResult')
  assert.equal(
    JSON.stringify(prototypeCodeResult).includes('private-prototype'),
    false
  )
})

test('weist nicht klonbare Werte ohne private Rohdaten oder Schreibzugriff zurück', () => {
  const privateMarker = 'private-unclonable-sentinel'
  const unclonableStore = {
    ...createPrivateStore(),
    ignoredCallback() {},
    privateMarker,
  }
  let writeCalls = 0
  const storage = createLearningArtifactStorage({
    readJson() {
      return {
        ok: true,
        status: 'found',
        value: unclonableStore,
      }
    },
    writeJson() {
      writeCalls += 1
      return { ok: true, status: 'saved' }
    },
  })

  const loadResult = storage.loadLearningArtifacts()
  const saveResult = storage.saveLearningArtifacts(unclonableStore)

  assert.equal(loadResult.ok, false)
  assert.equal(loadResult.status, 'invalidStoredData')
  assert.equal(saveResult.ok, false)
  assert.equal(saveResult.status, 'validationFailed')
  assert.equal(writeCalls, 0)
  assert.equal(JSON.stringify(loadResult).includes(privateMarker), false)
  assert.equal(JSON.stringify(saveResult).includes(privateMarker), false)
})
