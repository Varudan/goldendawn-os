import {
  LEARNING_ARTIFACT_STORAGE_KEY,
} from './learningArtifactStorage.js'
import { LEARNING_HUB_STORAGE_KEY } from './learningHubStorage.js'
import {
  LEARNING_TEST_BANK_STORAGE_KEY,
} from './learningTestBankStorage.js'

export const LEARNING_HUB_DEMO_INITIALIZATION_STORAGE_KEY =
  'goldendawn.learningHub.demoInitialization.v1'

export const LEARNING_HUB_DEMO_INITIALIZATION_DECISIONS = Object.freeze({
  SEEDED: 'seeded',
  SKIPPED_EXISTING_DATA: 'skippedExistingData',
})

const DOMAIN_STORAGE_KEYS = Object.freeze([
  LEARNING_HUB_STORAGE_KEY,
  LEARNING_ARTIFACT_STORAGE_KEY,
  LEARNING_TEST_BANK_STORAGE_KEY,
])

const SAFE_ADAPTER_FAILURES = Object.freeze({
  invalidStorageKey: Object.freeze({
    status: 'invalidKey',
    message: 'Der Initialisierungs-Key ist ungültig.',
  }),
  storageUnavailable: Object.freeze({
    status: 'unavailable',
    message: 'Der lokale Speicher ist nicht verfügbar.',
  }),
  storageReadFailed: Object.freeze({
    status: 'readFailed',
    message: 'Der lokale Initialisierungszustand konnte nicht gelesen werden.',
  }),
  serializationFailed: Object.freeze({
    status: 'serializationFailed',
    message: 'Der lokale Initialisierungszustand konnte nicht vorbereitet werden.',
  }),
  storageQuotaExceeded: Object.freeze({
    status: 'quotaExceeded',
    message: 'Der lokale Speicher hat nicht genügend freien Platz.',
  }),
  storageWriteFailed: Object.freeze({
    status: 'writeFailed',
    message: 'Der lokale Initialisierungszustand konnte nicht gespeichert werden.',
  }),
  storageValueChanged: Object.freeze({
    status: 'conflict',
    message: 'Der lokale Initialisierungszustand wurde zwischenzeitlich verändert.',
  }),
  storageRemoveFailed: Object.freeze({
    status: 'removeFailed',
    message: 'Der lokale Initialisierungszustand konnte nicht zurückgerollt werden.',
  }),
})

function createFailure(status, code, message) {
  return {
    ok: false,
    status,
    error: { code, message },
  }
}

function createUnexpectedAdapterResult() {
  return createFailure(
    'storageFailed',
    'unexpectedStorageResult',
    'Der Storage-Adapter hat kein verwertbares Ergebnis geliefert.'
  )
}

function normalizeAdapterFailure(result) {
  const adapterCode = result?.error?.code
  const safeFailure = Object.prototype.hasOwnProperty.call(
    SAFE_ADAPTER_FAILURES,
    adapterCode
  )
    ? SAFE_ADAPTER_FAILURES[adapterCode]
    : null

  if (
    result?.ok === false &&
    safeFailure &&
    result.status === safeFailure.status
  ) {
    return createFailure(
      safeFailure.status,
      adapterCode,
      safeFailure.message
    )
  }

  return createUnexpectedAdapterResult()
}

function createMarker(decision) {
  return {
    schemaVersion: 1,
    initializationCompleted: true,
    decision,
  }
}

export function createLearningHubDemoInitializationStorage(storageAdapter) {
  function inspectKey(key) {
    if (typeof storageAdapter?.readJson !== 'function') {
      return createFailure(
        'unavailable',
        'storageAdapterUnavailable',
        'Der Storage-Adapter ist nicht verfügbar.'
      )
    }

    let result

    try {
      result = storageAdapter.readJson(key)
    } catch {
      return createUnexpectedAdapterResult()
    }

    if (result?.ok === true && result.status === 'missing') {
      return { ok: true, status: 'missing' }
    }

    if (result?.ok === true && result.status === 'found') {
      return { ok: true, status: 'present' }
    }

    if (
      result?.ok === false &&
      result.status === 'invalidJson' &&
      result.error?.code === 'invalidJson'
    ) {
      return { ok: true, status: 'present' }
    }

    return normalizeAdapterFailure(result)
  }

  function inspectInitializationState() {
    const markerResult = inspectKey(
      LEARNING_HUB_DEMO_INITIALIZATION_STORAGE_KEY
    )

    if (!markerResult.ok) {
      return markerResult
    }

    if (markerResult.status === 'present') {
      return {
        ok: true,
        status: 'initialized',
        existingStoreKeys: [],
      }
    }

    const existingStoreKeys = []

    for (const storageKey of DOMAIN_STORAGE_KEYS) {
      const storeResult = inspectKey(storageKey)

      if (!storeResult.ok) {
        return storeResult
      }

      if (storeResult.status === 'present') {
        existingStoreKeys.push(storageKey)
      }
    }

    return {
      ok: true,
      status:
        existingStoreKeys.length > 0
          ? 'existingData'
          : 'uninitialized',
      existingStoreKeys,
    }
  }

  function inspectDomainStore(storageKey) {
    if (!DOMAIN_STORAGE_KEYS.includes(storageKey)) {
      return createFailure(
        'invalidKey',
        'invalidLearningHubDemoStorageKey',
        'Der Initialisierungs-Key gehört zu keinem Demo-Fachstore.'
      )
    }

    return inspectKey(storageKey)
  }

  function saveInitializationMarker(decision) {
    if (
      !Object.values(
        LEARNING_HUB_DEMO_INITIALIZATION_DECISIONS
      ).includes(decision)
    ) {
      return createFailure(
        'validationFailed',
        'invalidLearningHubDemoInitializationDecision',
        'Die Demo-Initialisierungsentscheidung ist ungültig.'
      )
    }

    if (
      typeof storageAdapter?.readJson !== 'function' ||
      typeof storageAdapter?.writeJson !== 'function'
    ) {
      return createFailure(
        'unavailable',
        'storageAdapterUnavailable',
        'Der Storage-Adapter ist nicht verfügbar.'
      )
    }

    const existingMarker = inspectKey(
      LEARNING_HUB_DEMO_INITIALIZATION_STORAGE_KEY
    )

    if (!existingMarker.ok) {
      return existingMarker
    }

    if (existingMarker.status === 'present') {
      return { ok: true, status: 'alreadyInitialized' }
    }

    let result

    try {
      result = storageAdapter.writeJson(
        LEARNING_HUB_DEMO_INITIALIZATION_STORAGE_KEY,
        createMarker(decision)
      )
    } catch {
      return createUnexpectedAdapterResult()
    }

    if (result?.ok === true && result.status === 'saved') {
      return { ok: true, status: 'saved' }
    }

    return normalizeAdapterFailure(result)
  }

  function rollbackSeedValue(storageKey, expectedValue) {
    if (!DOMAIN_STORAGE_KEYS.includes(storageKey)) {
      return createFailure(
        'invalidKey',
        'invalidLearningHubDemoStorageKey',
        'Der Rollback-Key gehört zu keinem Demo-Fachstore.'
      )
    }

    if (typeof storageAdapter?.removeJsonIfUnchanged !== 'function') {
      return createFailure(
        'unavailable',
        'storageAdapterUnavailable',
        'Der Storage-Adapter unterstützt keinen sicheren Rollback.'
      )
    }

    let result

    try {
      result = storageAdapter.removeJsonIfUnchanged(
        storageKey,
        expectedValue
      )
    } catch {
      return createUnexpectedAdapterResult()
    }

    if (
      result?.ok === true &&
      ['missing', 'removed'].includes(result.status)
    ) {
      return { ok: true, status: result.status }
    }

    return normalizeAdapterFailure(result)
  }

  return Object.freeze({
    inspectInitializationState,
    inspectDomainStore,
    saveInitializationMarker,
    rollbackSeedValue,
  })
}
