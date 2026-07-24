import assert from 'node:assert/strict'
import test from 'node:test'

import { createStorageAdapter } from '../src/storage/storageAdapter.js'
import { createStorageError, FakeStorage } from './helpers/fakeStorage.js'

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
  const value = {
    schemaVersion: 2,
    prompts: [],
  }

  const result = storageAdapter.writeJson('prompts', value)

  assert.deepEqual(result, {
    ok: true,
    status: 'saved',
  })
  assert.equal(fakeStorage.setItemCalls, 1)
  assert.equal(fakeStorage.peek('prompts'), JSON.stringify(value))
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
