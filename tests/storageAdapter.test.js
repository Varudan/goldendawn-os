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
