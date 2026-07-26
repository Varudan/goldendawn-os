import assert from 'node:assert/strict'
import test from 'node:test'

import { createStorageAdapter } from '../src/storage/storageAdapter.js'
import { createStorageError, FakeStorage } from './helpers/fakeStorage.js'

const INVALID_LIMIT_RESULT = {
  ok: false,
  status: 'invalidLimit',
  error: {
    code: 'invalidStorageLimit',
    message: 'Das Speicherlimit muss eine positive sichere Ganzzahl sein.',
  },
}

const SIZE_LIMIT_EXCEEDED_RESULT = {
  ok: false,
  status: 'sizeLimitExceeded',
  error: {
    code: 'storageSizeLimitExceeded',
    message: 'Die serialisierten Daten überschreiten das zulässige Speicherlimit.',
  },
}

function createErrorWithUnreadableName() {
  const error = new Error('private-storage-error-sentinel')

  Object.defineProperty(error, 'name', {
    configurable: true,
    get() {
      throw new Error('private-name-getter-sentinel')
    },
  })

  return error
}

test('unterscheidet fehlende, gültige und beschädigte JSON-Daten', () => {
  const fakeStorage = new FakeStorage()
  const storageAdapter = createStorageAdapter(fakeStorage)

  assert.deepEqual(storageAdapter.readJson('missing'), {
    ok: true,
    status: 'missing',
  })

  fakeStorage.setItem('valid', JSON.stringify({ value: 42 }))
  assert.deepEqual(storageAdapter.readJson('valid'), {
    ok: true,
    status: 'found',
    value: { value: 42 },
  })

  fakeStorage.setItem('broken', '{broken')
  const brokenResult = storageAdapter.readJson('broken')

  assert.equal(brokenResult.ok, false)
  assert.equal(brokenResult.status, 'invalidJson')
  assert.equal(brokenResult.error.code, 'invalidJson')
})

test('behält ohne Größenoption und mit undefined das bisherige Verhalten', () => {
  const storedValue = {
    schemaVersion: 1,
    label: 'synthetischer Altbestand',
  }
  const fakeStorage = new FakeStorage([
    ['legacy', JSON.stringify(storedValue)],
  ])
  const storageAdapter = createStorageAdapter(fakeStorage)

  assert.equal(storageAdapter.readJson.length, 1)
  assert.equal(storageAdapter.writeJson.length, 2)
  assert.deepEqual(storageAdapter.readJson('legacy'), {
    ok: true,
    status: 'found',
    value: storedValue,
  })
  assert.deepEqual(storageAdapter.readJson('legacy', undefined), {
    ok: true,
    status: 'found',
    value: storedValue,
  })
  assert.deepEqual(storageAdapter.writeJson('without-options', storedValue), {
    ok: true,
    status: 'saved',
  })
  assert.deepEqual(
    storageAdapter.writeJson('undefined-options', storedValue, undefined),
    {
      ok: true,
      status: 'saved',
    }
  )
  assert.equal(
    fakeStorage.peek('without-options'),
    JSON.stringify(storedValue)
  )
  assert.equal(
    fakeStorage.peek('undefined-options'),
    JSON.stringify(storedValue)
  )
})

test('liest und schreibt gültiges JSON exakt an der Größenbegrenzung', () => {
  const boundaryValue = 'abc'
  const serializedBoundaryValue = JSON.stringify(boundaryValue)
  const maxSerializedLength = serializedBoundaryValue.length
  const fakeStorage = new FakeStorage([
    ['read-boundary', serializedBoundaryValue],
  ])
  const storageAdapter = createStorageAdapter(fakeStorage)

  assert.equal(maxSerializedLength, 5)
  assert.deepEqual(
    storageAdapter.readJson('read-boundary', { maxSerializedLength }),
    {
      ok: true,
      status: 'found',
      value: boundaryValue,
    }
  )
  assert.deepEqual(
    storageAdapter.writeJson(
      'write-boundary',
      boundaryValue,
      { maxSerializedLength }
    ),
    {
      ok: true,
      status: 'saved',
    }
  )
  assert.equal(
    fakeStorage.peek('write-boundary'),
    serializedBoundaryValue
  )
  assert.equal(fakeStorage.getItemCalls, 1)
  assert.equal(fakeStorage.setItemCalls, 1)
})

test('lehnt Lesen und Schreiben bei Grenze plus eins kontrolliert ab', () => {
  const oversizedValue = 'abcd'
  const serializedOversizedValue = JSON.stringify(oversizedValue)
  const maxSerializedLength = serializedOversizedValue.length - 1
  const readStorage = new FakeStorage([
    ['oversized', serializedOversizedValue],
  ])

  assert.deepEqual(
    createStorageAdapter(readStorage).readJson('oversized', {
      maxSerializedLength,
    }),
    SIZE_LIMIT_EXCEEDED_RESULT
  )

  let toJsonCalls = 0
  const writeValue = {
    toJSON() {
      toJsonCalls += 1
      return oversizedValue
    },
  }
  const writeStorage = new FakeStorage()
  const writeResult = createStorageAdapter(writeStorage).writeJson(
    'oversized',
    writeValue,
    { maxSerializedLength }
  )

  assert.deepEqual(writeResult, SIZE_LIMIT_EXCEEDED_RESULT)
  assert.equal(toJsonCalls, 1)
  assert.equal(writeStorage.setItemCalls, 0)
  assert.equal(writeStorage.peek('oversized'), null)
})

test('prüft übergroßes ungültiges JSON vor dem Parsen', () => {
  const invalidJson = '{broken'
  const fakeStorage = new FakeStorage([['broken', invalidJson]])
  const storageAdapter = createStorageAdapter(fakeStorage)

  assert.deepEqual(
    storageAdapter.readJson('broken', {
      maxSerializedLength: invalidJson.length - 1,
    }),
    SIZE_LIMIT_EXCEEDED_RESULT
  )

  const unlimitedResult = storageAdapter.readJson('broken')

  assert.equal(unlimitedResult.ok, false)
  assert.equal(unlimitedResult.status, 'invalidJson')
  assert.equal(unlimitedResult.error.code, 'invalidJson')
})

test('weist ungültige Größenlimits vor Storage und Serialisierung zurück', () => {
  const throwingOptions = {}
  Object.defineProperty(throwingOptions, 'maxSerializedLength', {
    get() {
      throw new Error('private-limit-getter-sentinel')
    },
  })
  const invalidOptions = [
    null,
    {},
    { maxSerializedLength: undefined },
    { maxSerializedLength: 0 },
    { maxSerializedLength: -1 },
    { maxSerializedLength: 1.5 },
    { maxSerializedLength: Number.NaN },
    { maxSerializedLength: Number.POSITIVE_INFINITY },
    { maxSerializedLength: Number.MAX_SAFE_INTEGER + 1 },
    { maxSerializedLength: '5' },
    { maxSerializedLength: 5n },
    throwingOptions,
  ]

  for (const options of invalidOptions) {
    const fakeStorage = new FakeStorage()
    const storageAdapter = createStorageAdapter(fakeStorage)
    let toJsonCalls = 0
    const value = {
      toJSON() {
        toJsonCalls += 1
        return 'nicht serialisieren'
      },
    }

    assert.deepEqual(
      storageAdapter.readJson('limited', options),
      INVALID_LIMIT_RESULT
    )
    assert.deepEqual(
      storageAdapter.writeJson('limited', value, options),
      INVALID_LIMIT_RESULT
    )
    assert.equal(fakeStorage.getItemCalls, 0)
    assert.equal(fakeStorage.setItemCalls, 0)
    assert.equal(toJsonCalls, 0)
  }

  let storageMethodReads = 0
  const guardedStorage = {}
  Object.defineProperties(guardedStorage, {
    getItem: {
      get() {
        storageMethodReads += 1
        return () => null
      },
    },
    setItem: {
      get() {
        storageMethodReads += 1
        return () => {}
      },
    },
  })
  const guardedAdapter = createStorageAdapter(guardedStorage)

  assert.deepEqual(guardedAdapter.readJson('limited', {}), INVALID_LIMIT_RESULT)
  assert.deepEqual(
    guardedAdapter.writeJson('limited', 'value', {}),
    INVALID_LIMIT_RESULT
  )
  assert.equal(storageMethodReads, 0)
})

test('misst die serialisierte UTF-16-Länge einschließlich JSON-Escaping', () => {
  const escapedValue = '\n'
  const serializedEscapedValue = JSON.stringify(escapedValue)
  const escapedStorage = new FakeStorage()

  assert.equal(escapedValue.length, 1)
  assert.equal(serializedEscapedValue.length, 4)
  assert.deepEqual(
    createStorageAdapter(escapedStorage).writeJson(
      'escaped',
      escapedValue,
      { maxSerializedLength: 3 }
    ),
    SIZE_LIMIT_EXCEEDED_RESULT
  )
  assert.equal(escapedStorage.setItemCalls, 0)

  const utf16Value = '🌲'
  const serializedUtf16Value = JSON.stringify(utf16Value)
  const utf16Storage = new FakeStorage()

  assert.equal(utf16Value.length, 2)
  assert.equal(serializedUtf16Value.length, 4)
  assert.deepEqual(
    createStorageAdapter(utf16Storage).writeJson(
      'utf16',
      utf16Value,
      { maxSerializedLength: 4 }
    ),
    {
      ok: true,
      status: 'saved',
    }
  )
  assert.equal(utf16Storage.peek('utf16'), serializedUtf16Value)
})

test('behandelt blockierten oder nicht vorhandenen Storage als nicht verfügbar', () => {
  const unavailableResult = createStorageAdapter(null).readJson('prompts')

  assert.equal(unavailableResult.ok, false)
  assert.equal(unavailableResult.error.code, 'storageUnavailable')

  const fakeStorage = new FakeStorage()
  fakeStorage.readError = createStorageError('SecurityError')

  const blockedReadResult = createStorageAdapter(fakeStorage).readJson('prompts')

  assert.equal(blockedReadResult.ok, false)
  assert.equal(blockedReadResult.status, 'unavailable')
  assert.equal(blockedReadResult.error.code, 'storageUnavailable')
})

test('klassifiziert Security- und Quota-Fehler beim Schreiben getrennt', () => {
  const fakeStorage = new FakeStorage()
  const storageAdapter = createStorageAdapter(fakeStorage)

  fakeStorage.writeError = createStorageError('SecurityError')
  const blockedWriteResult = storageAdapter.writeJson('prompts', [])

  assert.equal(blockedWriteResult.ok, false)
  assert.equal(blockedWriteResult.status, 'unavailable')
  assert.equal(blockedWriteResult.error.code, 'storageUnavailable')

  fakeStorage.writeError = createStorageError('QuotaExceededError')
  const quotaResult = storageAdapter.writeJson('prompts', [])

  assert.equal(quotaResult.ok, false)
  assert.equal(quotaResult.status, 'quotaExceeded')
  assert.equal(quotaResult.error.code, 'storageQuotaExceeded')
})

test('gibt Serialisierungsfehler strukturiert zurück, ohne Storage aufzurufen', () => {
  const fakeStorage = new FakeStorage()
  const storageAdapter = createStorageAdapter(fakeStorage)
  const circularValue = {}
  circularValue.self = circularValue

  const result = storageAdapter.writeJson('prompts', circularValue)

  assert.equal(result.ok, false)
  assert.equal(result.status, 'serializationFailed')
  assert.equal(result.error.code, 'serializationFailed')
  assert.equal(fakeStorage.setItemCalls, 0)
})

test('klassifiziert allgemeine Lese- und Schreibfehler getrennt', () => {
  const fakeStorage = new FakeStorage()
  const storageAdapter = createStorageAdapter(fakeStorage)

  fakeStorage.readError = createStorageError('Error')
  const readResult = storageAdapter.readJson('prompts')

  assert.equal(readResult.ok, false)
  assert.equal(readResult.status, 'readFailed')
  assert.equal(readResult.error.code, 'storageReadFailed')

  fakeStorage.readError = null
  fakeStorage.writeError = createStorageError('Error')
  const writeResult = storageAdapter.writeJson('prompts', [])

  assert.equal(writeResult.ok, false)
  assert.equal(writeResult.status, 'writeFailed')
  assert.equal(writeResult.error.code, 'storageWriteFailed')
})

test('lässt werfende name-Getter beim Lesen, Schreiben und Entfernen nicht entkommen', () => {
  const expectedValue = {
    schemaVersion: 1,
    values: ['synthetischer Rollback'],
  }

  const readStorage = new FakeStorage()
  readStorage.readError = createErrorWithUnreadableName()
  const readResult = createStorageAdapter(readStorage).readJson('entry')

  assert.deepEqual(readResult, {
    ok: false,
    status: 'readFailed',
    error: {
      code: 'storageReadFailed',
      message: 'Die lokalen Daten konnten nicht gelesen werden.',
    },
  })
  assert.equal(readStorage.getItemCalls, 1)

  const writeStorage = new FakeStorage()
  writeStorage.writeError = createErrorWithUnreadableName()
  const writeResult = createStorageAdapter(writeStorage).writeJson(
    'entry',
    expectedValue
  )

  assert.deepEqual(writeResult, {
    ok: false,
    status: 'writeFailed',
    error: {
      code: 'storageWriteFailed',
      message: 'Die lokalen Daten konnten nicht gespeichert werden.',
    },
  })
  assert.equal(writeStorage.setItemCalls, 1)

  const comparisonStorage = new FakeStorage()
  comparisonStorage.readError = createErrorWithUnreadableName()
  const comparisonResult = createStorageAdapter(
    comparisonStorage
  ).removeJsonIfUnchanged('entry', expectedValue)

  assert.deepEqual(comparisonResult, {
    ok: false,
    status: 'readFailed',
    error: {
      code: 'storageReadFailed',
      message: 'Die lokalen Daten konnten nicht abgeglichen werden.',
    },
  })
  assert.equal(comparisonStorage.getItemCalls, 1)
  assert.equal(comparisonStorage.removeItemCalls, 0)

  const removeStorage = new FakeStorage([
    ['entry', JSON.stringify(expectedValue)],
  ])
  removeStorage.removeError = createErrorWithUnreadableName()
  const removeResult = createStorageAdapter(
    removeStorage
  ).removeJsonIfUnchanged('entry', expectedValue)

  assert.deepEqual(removeResult, {
    ok: false,
    status: 'removeFailed',
    error: {
      code: 'storageRemoveFailed',
      message: 'Die lokalen Daten konnten nicht entfernt werden.',
    },
  })
  assert.equal(removeStorage.getItemCalls, 1)
  assert.equal(removeStorage.removeItemCalls, 1)

  for (const result of [
    readResult,
    writeResult,
    comparisonResult,
    removeResult,
  ]) {
    assert.equal(JSON.stringify(result).includes('private-'), false)
  }
})

test('erkennt auch den Firefox-Quota-Fehler', () => {
  const fakeStorage = new FakeStorage()
  fakeStorage.writeError = createStorageError(
    'NS_ERROR_DOM_QUOTA_REACHED'
  )
  const storageAdapter = createStorageAdapter(fakeStorage)

  const result = storageAdapter.writeJson('prompts', [])

  assert.equal(result.ok, false)
  assert.equal(result.status, 'quotaExceeded')
  assert.equal(result.error.code, 'storageQuotaExceeded')
})

test('weist leere und typfremde Storage-Keys ohne Zugriff zurück', () => {
  const fakeStorage = new FakeStorage()
  const storageAdapter = createStorageAdapter(fakeStorage)

  for (const key of ['', '   ', null, 42]) {
    const readResult = storageAdapter.readJson(key)
    const writeResult = storageAdapter.writeJson(key, [])

    assert.equal(readResult.ok, false)
    assert.equal(readResult.status, 'invalidKey')
    assert.equal(readResult.error.code, 'invalidStorageKey')
    assert.equal(writeResult.ok, false)
    assert.equal(writeResult.status, 'invalidKey')
    assert.equal(writeResult.error.code, 'invalidStorageKey')
  }

  assert.equal(fakeStorage.getItemCalls, 0)
  assert.equal(fakeStorage.setItemCalls, 0)
})

test('serialisiert einen erfolgreichen Schreibzugriff genau einmal', () => {
  const fakeStorage = new FakeStorage()
  const storageAdapter = createStorageAdapter(fakeStorage)
  const serializedValue = JSON.stringify({
    schemaVersion: 2,
    prompts: [],
  })
  let toJsonCalls = 0
  const value = {
    toJSON() {
      toJsonCalls += 1
      return {
        schemaVersion: 2,
        prompts: [],
      }
    },
  }

  const result = storageAdapter.writeJson('prompts', value)

  assert.deepEqual(result, {
    ok: true,
    status: 'saved',
  })
  assert.equal(toJsonCalls, 1)
  assert.equal(fakeStorage.setItemCalls, 1)
  assert.equal(fakeStorage.peek('prompts'), serializedValue)
})

test('entfernt beim Rollback ausschließlich einen bytegleich erwarteten JSON-Wert', () => {
  const expectedValue = {
    schemaVersion: 1,
    values: ['synthetisch'],
  }
  const fakeStorage = new FakeStorage([
    ['seed', JSON.stringify(expectedValue)],
  ])
  const storageAdapter = createStorageAdapter(fakeStorage)

  const result = storageAdapter.removeJsonIfUnchanged(
    'seed',
    expectedValue
  )

  assert.deepEqual(result, { ok: true, status: 'removed' })
  assert.equal(fakeStorage.peek('seed'), null)
  assert.equal(fakeStorage.getItemCalls, 1)
  assert.equal(fakeStorage.removeItemCalls, 1)
})

test('erhält beim Rollback einen zwischenzeitlich veränderten Wert unverändert', () => {
  const currentValue = JSON.stringify({ value: 'Nutzerdaten' })
  const fakeStorage = new FakeStorage([['seed', currentValue]])
  const storageAdapter = createStorageAdapter(fakeStorage)

  const result = storageAdapter.removeJsonIfUnchanged('seed', {
    value: 'Demo',
  })

  assert.equal(result.ok, false)
  assert.equal(result.status, 'conflict')
  assert.equal(result.error.code, 'storageValueChanged')
  assert.equal(fakeStorage.peek('seed'), currentValue)
  assert.equal(fakeStorage.removeItemCalls, 0)
})

test('behandelt einen bereits fehlenden Rollback-Wert als sicheren No-op', () => {
  const fakeStorage = new FakeStorage()
  const storageAdapter = createStorageAdapter(fakeStorage)

  const result = storageAdapter.removeJsonIfUnchanged('seed', {
    value: 'Demo',
  })

  assert.deepEqual(result, { ok: true, status: 'missing' })
  assert.equal(fakeStorage.removeItemCalls, 0)
})
