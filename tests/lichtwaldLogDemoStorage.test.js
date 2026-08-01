import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { createLichtwaldLogDemoSnapshot } from '../src/data/mock/lichtwaldLogDemo.js'
import * as lichtwaldLogDemoStorageModule from '../src/storage/lichtwaldLogDemoStorage.js'
import { validateLichtwaldLog } from '../src/modules/lichtwald-log/lichtwaldLogContract.js'

function createSyntheticEntry(index, overrides = {}) {
  return {
    id: `lichtwald-demo-boundary-${index}`,
    calendarDate: '2036-02-29',
    title: `[Demo] Synthetische Grenzfixture ${index}`,
    text: 'x',
    tags: ['Erfunden'],
    ...overrides,
  }
}

function createSyntheticLog(entries, overrides = {}) {
  const resolvedEntries = entries ?? [createSyntheticEntry(0)]

  return {
    schemaVersion: 1,
    dataOrigin: 'synthetic',
    featuredEntryId: resolvedEntries[0]?.id ?? null,
    entries: resolvedEntries,
    ...overrides,
  }
}

function createPrivateLog() {
  return {
    ...createSyntheticLog(),
    dataOrigin: 'private',
  }
}

function createLogWithSerializedLength(targetLength) {
  const entries = []
  const lichtwaldLog = createSyntheticLog(entries, {
    featuredEntryId: null,
  })

  for (let index = 0; index < 1000; index += 1) {
    const entry = createSyntheticEntry(index)
    entries.push(entry)

    if (index === 0) {
      lichtwaldLog.featuredEntryId = entry.id
    }

    const remainingLength = targetLength - JSON.stringify(lichtwaldLog).length

    if (remainingLength >= 0 && remainingLength <= 9999) {
      entry.text = 'x'.repeat(1 + remainingLength)
      assert.equal(JSON.stringify(lichtwaldLog).length, targetLength)
      assert.equal(validateLichtwaldLog(lichtwaldLog).ok, true)
      return lichtwaldLog
    }

    entry.text = 'x'.repeat(10000)
  }

  throw new Error('Die synthetische Größenfixture konnte nicht erzeugt werden.')
}

function assertFailure(result, status, code) {
  assert.equal(result.ok, false)
  assert.equal(result.status, status)
  assert.equal(result.error.code, code)
  assert.equal(typeof result.error.message, 'string')
  assert.ok(result.error.message.length > 0)
  assert.deepEqual(Object.keys(result), ['ok', 'status', 'error'])
  assert.deepEqual(Object.keys(result.error), ['code', 'message'])
}

function assertDoesNotContain(result, markers) {
  const serializedResult = JSON.stringify(result)

  markers.forEach((marker) => {
    assert.equal(serializedResult.includes(marker), false)
  })
}

function restorePropertyDescriptor(target, propertyName, descriptor) {
  if (descriptor) {
    Object.defineProperty(target, propertyName, descriptor)
    return
  }

  assert.equal(Reflect.deleteProperty(target, propertyName), true)
}

function replaceTextPrefix(lichtwaldLog, marker) {
  const entry = lichtwaldLog.entries[0]

  assert.ok(entry.text.length >= marker.length)
  entry.text = `${marker}${entry.text.slice(marker.length)}`
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Reflect.ownKeys(value).forEach((propertyName) => {
      deepFreeze(value[propertyName])
    })
    Object.freeze(value)
  }

  return value
}

test('exportiert ausschließlich die Demo-Storage-Factory', () => {
  assert.deepEqual(Object.keys(lichtwaldLogDemoStorageModule), [
    'createLichtwaldLogDemoStorage',
  ])
})

test('liefert eine exakt zweiteilige eingefrorene Operationsoberfläche', () => {
  const storage = lichtwaldLogDemoStorageModule.createLichtwaldLogDemoStorage()

  assert.deepEqual(Object.keys(storage), [
    'loadLichtwaldLog',
    'saveLichtwaldLog',
  ])
  assert.equal(Object.isFrozen(storage), true)

  for (const excludedPort of [
    'reset',
    'clear',
    'remove',
    'inspect',
    'getState',
    'debug',
    'migrate',
  ]) {
    assert.equal(Object.hasOwn(storage, excludedPort), false)
  }
})

test('frische Instanzen starten jeweils mit einem detached kanonischen Seed', () => {
  const firstStorage = lichtwaldLogDemoStorageModule.createLichtwaldLogDemoStorage()
  const secondStorage = lichtwaldLogDemoStorageModule.createLichtwaldLogDemoStorage()
  const canonicalSnapshot = createLichtwaldLogDemoSnapshot()
  const firstResult = firstStorage.loadLichtwaldLog()
  const secondResult = secondStorage.loadLichtwaldLog()

  assert.deepEqual(firstResult, {
    ok: true,
    status: 'found',
    lichtwaldLog: canonicalSnapshot,
  })
  assert.deepEqual(secondResult, firstResult)
  assert.notStrictEqual(firstResult.lichtwaldLog, secondResult.lichtwaldLog)
  assert.notStrictEqual(
    firstResult.lichtwaldLog.entries,
    secondResult.lichtwaldLog.entries
  )
})

test('bereitet den Seed pro Instanz genau einmal defensiv vor', () => {
  const seed = createLichtwaldLogDemoSnapshot()
  const expectedSeed = structuredClone(seed)
  let seedCalls = 0
  const storage = lichtwaldLogDemoStorageModule.createLichtwaldLogDemoStorage(
    () => {
      seedCalls += 1
      return seed
    }
  )

  seed.featuredEntryId = null
  seed.entries.reverse()
  seed.entries[0].tags.push('NurQuelle')

  assert.deepEqual(storage.loadLichtwaldLog().lichtwaldLog, expectedSeed)
  assert.deepEqual(storage.loadLichtwaldLog().lichtwaldLog, expectedSeed)
  assert.equal(seedCalls, 1)
})

test('dieselbe Instanz übernimmt ausschließlich bestätigte Full-Snapshot-Saves', () => {
  const storage = lichtwaldLogDemoStorageModule.createLichtwaldLogDemoStorage()
  const replacementEntries = [
    createSyntheticEntry(7, {
      title: '[Demo] Vollständig ersetzender Testmoment',
      tags: ['Vollersatz', 'Erfunden'],
    }),
    createSyntheticEntry(8, {
      title: '[Demo] Zweiter ersetzender Testmoment',
      tags: ['Folge', 'Erfunden'],
    }),
  ]
  const replacement = createSyntheticLog(replacementEntries, {
    featuredEntryId: replacementEntries[1].id,
  })

  assert.deepEqual(storage.saveLichtwaldLog(replacement), {
    ok: true,
    status: 'saved',
  })
  assert.deepEqual(storage.loadLichtwaldLog(), {
    ok: true,
    status: 'found',
    lichtwaldLog: replacement,
  })
})

test('Save-Eingaben und Load-Rückgaben sind vollständig tief entkoppelt', () => {
  const storage = lichtwaldLogDemoStorageModule.createLichtwaldLogDemoStorage()
  const replacement = createSyntheticLog([
    createSyntheticEntry(11, {
      tags: ['Detached', 'Erfunden'],
    }),
  ])
  const expectedReplacement = structuredClone(replacement)

  assert.deepEqual(storage.saveLichtwaldLog(replacement), {
    ok: true,
    status: 'saved',
  })

  replacement.featuredEntryId = null
  replacement.entries[0].title = '[Demo] Nur die Save-Eingabe'
  replacement.entries[0].tags.push('NurEingabe')

  const firstLoad = storage.loadLichtwaldLog()
  assert.deepEqual(firstLoad.lichtwaldLog, expectedReplacement)

  firstLoad.lichtwaldLog.featuredEntryId = null
  firstLoad.lichtwaldLog.entries[0].text = 'Nur die erste Rückgabe.'
  firstLoad.lichtwaldLog.entries[0].tags.push('NurRückgabe')

  const secondLoad = storage.loadLichtwaldLog()
  assert.deepEqual(secondLoad.lichtwaldLog, expectedReplacement)
  assert.notStrictEqual(firstLoad.lichtwaldLog, secondLoad.lichtwaldLog)
  assert.notStrictEqual(
    firstLoad.lichtwaldLog.entries[0],
    secondLoad.lichtwaldLog.entries[0]
  )
  assert.notStrictEqual(
    firstLoad.lichtwaldLog.entries[0].tags,
    secondLoad.lichtwaldLog.entries[0].tags
  )
})

test('akzeptiert tief eingefrorene synthetische Roots ohne Eingabemutation', () => {
  const storage = lichtwaldLogDemoStorageModule.createLichtwaldLogDemoStorage()
  const candidate = createSyntheticLog([
    createSyntheticEntry(12, {
      title: '[Demo] Eingefrorene Testfixture',
    }),
  ])
  const expectedCandidate = structuredClone(candidate)

  assert.deepEqual(storage.saveLichtwaldLog(deepFreeze(candidate)), {
    ok: true,
    status: 'saved',
  })
  assert.deepEqual(candidate, expectedCandidate)
  assert.deepEqual(storage.loadLichtwaldLog().lichtwaldLog, expectedCandidate)
})

test('weist private Roots an Seed-, Load- und Save-Grenze fail-closed zurück', () => {
  const privateMarker = 'private-demo-storage-origin-sentinel'
  const privateLog = createPrivateLog()
  privateLog.entries[0].text = privateMarker
  const invalidSeedStorage =
    lichtwaldLogDemoStorageModule.createLichtwaldLogDemoStorage(
      () => privateLog
    )
  const validStorage = lichtwaldLogDemoStorageModule.createLichtwaldLogDemoStorage()
  const seedResult = invalidSeedStorage.loadLichtwaldLog()
  const saveResult = validStorage.saveLichtwaldLog(privateLog)

  assertFailure(
    seedResult,
    'invalidStoredData',
    'syntheticLichtwaldLogRequired'
  )
  assertFailure(
    saveResult,
    'validationFailed',
    'syntheticLichtwaldLogRequired'
  )
  assertDoesNotContain(seedResult, [privateMarker])
  assertDoesNotContain(saveResult, [privateMarker])
  assert.equal(Object.hasOwn(seedResult, 'lichtwaldLog'), false)
  assert.equal(Object.hasOwn(saveResult, 'lichtwaldLog'), false)
})

test('weist malformed Roots zurück und bewahrt den letzten vertrauenswürdigen Snapshot', () => {
  const storage = lichtwaldLogDemoStorageModule.createLichtwaldLogDemoStorage()
  const trustedSnapshot = storage.loadLichtwaldLog().lichtwaldLog
  const invalidCandidates = [
    null,
    [],
    { schemaVersion: 1 },
    createSyntheticLog([], { featuredEntryId: 'verwaist' }),
    {
      ...createSyntheticLog(),
      unsupportedField: 'private-unsupported-field-sentinel',
    },
  ]

  invalidCandidates.forEach((invalidCandidate) => {
    assertFailure(
      storage.saveLichtwaldLog(invalidCandidate),
      'validationFailed',
      'invalidLichtwaldLogDemoData'
    )
  })

  assert.deepEqual(storage.loadLichtwaldLog().lichtwaldLog, trustedSnapshot)
})

test('ein ungültiger oder werfender Seed bleibt statisch fehlerhaft ohne Fallback', () => {
  const privateMarker = 'private-demo-seed-exception-sentinel'
  let invalidSeedCalls = 0
  const invalidSeedStorage =
    lichtwaldLogDemoStorageModule.createLichtwaldLogDemoStorage(() => {
      invalidSeedCalls += 1
      return { schemaVersion: 1, privateMarker }
    })
  let throwingSeedCalls = 0
  const throwingSeedStorage =
    lichtwaldLogDemoStorageModule.createLichtwaldLogDemoStorage(() => {
      throwingSeedCalls += 1
      throw new Error(privateMarker)
    })

  for (const storage of [invalidSeedStorage, throwingSeedStorage]) {
    const firstResult = storage.loadLichtwaldLog()
    firstResult.error.message = privateMarker
    const secondResult = storage.loadLichtwaldLog()
    const saveResult = storage.saveLichtwaldLog(createSyntheticLog())

    assertFailure(
      secondResult,
      'invalidStoredData',
      'invalidLichtwaldLogDemoData'
    )
    assertFailure(
      saveResult,
      'invalidStoredData',
      'invalidLichtwaldLogDemoData'
    )
    assertDoesNotContain(secondResult, [privateMarker])
    assertDoesNotContain(saveResult, [privateMarker])
  }

  assert.equal(invalidSeedCalls, 1)
  assert.equal(throwingSeedCalls, 1)
})

test('bewahrt Fokusreferenz sowie Entry- und Tag-Reihenfolge unverändert', () => {
  const entries = [
    createSyntheticEntry(21, { tags: ['Zuerst', 'Danach'] }),
    createSyntheticEntry(22, { tags: ['Alpha', 'Omega'] }),
    createSyntheticEntry(23, { tags: ['Links', 'Rechts'] }),
  ]
  const candidate = createSyntheticLog(entries, {
    featuredEntryId: entries[1].id,
  })
  const storage = lichtwaldLogDemoStorageModule.createLichtwaldLogDemoStorage()

  assert.equal(storage.saveLichtwaldLog(candidate).ok, true)
  const loaded = storage.loadLichtwaldLog().lichtwaldLog

  assert.equal(loaded.featuredEntryId, entries[1].id)
  assert.deepEqual(
    loaded.entries.map((entry) => entry.id),
    entries.map((entry) => entry.id)
  )
  assert.deepEqual(
    loaded.entries.map((entry) => entry.tags),
    entries.map((entry) => entry.tags)
  )
})

test('akzeptiert exakt 500.000 serialisierte UTF-16-Codeeinheiten', () => {
  const boundarySnapshot = createLogWithSerializedLength(500_000)
  const storage = lichtwaldLogDemoStorageModule.createLichtwaldLogDemoStorage()

  assert.equal(JSON.stringify(boundarySnapshot).length, 500_000)
  assert.deepEqual(storage.saveLichtwaldLog(boundarySnapshot), {
    ok: true,
    status: 'saved',
  })
  assert.deepEqual(
    storage.loadLichtwaldLog().lichtwaldLog,
    boundarySnapshot
  )
})

test('lehnt 500.001 Codeeinheiten ab und erhält den vorherigen Snapshot', () => {
  const trustedSnapshot = createSyntheticLog([
    createSyntheticEntry(31, {
      title: '[Demo] Vertrauenswürdiger Zustand vor Größenfehler',
    }),
  ])
  const oversizedSnapshot = createLogWithSerializedLength(500_001)
  const storage = lichtwaldLogDemoStorageModule.createLichtwaldLogDemoStorage()

  assert.equal(storage.saveLichtwaldLog(trustedSnapshot).ok, true)
  assert.equal(JSON.stringify(oversizedSnapshot).length, 500_001)
  assertFailure(
    storage.saveLichtwaldLog(oversizedSnapshot),
    'sizeLimitExceeded',
    'lichtwaldLogDemoSizeLimitExceeded'
  )
  assert.deepEqual(storage.loadLichtwaldLog().lichtwaldLog, trustedSnapshot)
})

test('ignoriert verkürzendes Object.prototype.toJSON bei der kanonischen Größenmessung', () => {
  const privateMarker = 'private-object-tojson-value-sentinel'
  const foreignMarker = 'foreign-object-tojson-message-sentinel'
  const boundarySnapshot = createLogWithSerializedLength(500_000)
  const oversizedSnapshot = createLogWithSerializedLength(500_001)
  const storage = lichtwaldLogDemoStorageModule.createLichtwaldLogDemoStorage()
  const previousDescriptor = Object.getOwnPropertyDescriptor(
    Object.prototype,
    'toJSON'
  )
  let hookCalls = 0
  let boundaryResult
  let oversizedResult

  replaceTextPrefix(oversizedSnapshot, privateMarker)
  assert.equal(JSON.stringify(oversizedSnapshot).length, 500_001)

  try {
    Object.defineProperty(Object.prototype, 'toJSON', {
      configurable: true,
      value() {
        hookCalls += 1
        return { foreignMessage: foreignMarker }
      },
      writable: true,
    })

    assert.ok(JSON.stringify(oversizedSnapshot).length < 500_000)
    assert.ok(hookCalls > 0)
    hookCalls = 0

    boundaryResult = storage.saveLichtwaldLog(boundarySnapshot)
    oversizedResult = storage.saveLichtwaldLog(oversizedSnapshot)

    assert.equal(hookCalls, 0)
  } finally {
    restorePropertyDescriptor(
      Object.prototype,
      'toJSON',
      previousDescriptor
    )
  }

  assert.deepEqual(
    Object.getOwnPropertyDescriptor(Object.prototype, 'toJSON'),
    previousDescriptor
  )
  assert.deepEqual(boundaryResult, { ok: true, status: 'saved' })
  assertFailure(
    oversizedResult,
    'sizeLimitExceeded',
    'lichtwaldLogDemoSizeLimitExceeded'
  )
  assertDoesNotContain(oversizedResult, [privateMarker, foreignMarker])
  assert.deepEqual(
    storage.loadLichtwaldLog().lichtwaldLog,
    boundarySnapshot
  )
})

test('ignoriert umformendes Array.prototype.toJSON und erhält den vertrauenswürdigen Snapshot', () => {
  const privateMarker = 'private-array-tojson-value-sentinel'
  const foreignMarker = 'foreign-array-tojson-message-sentinel'
  const trustedSnapshot = createSyntheticLog([
    createSyntheticEntry(32, {
      title: '[Demo] Vertrauenswürdig vor Array-Hook',
    }),
  ])
  const oversizedSnapshot = createLogWithSerializedLength(500_001)
  const storage = lichtwaldLogDemoStorageModule.createLichtwaldLogDemoStorage()
  const previousDescriptor = Object.getOwnPropertyDescriptor(
    Array.prototype,
    'toJSON'
  )
  let hookCalls = 0
  let oversizedResult

  replaceTextPrefix(oversizedSnapshot, privateMarker)
  assert.equal(storage.saveLichtwaldLog(trustedSnapshot).ok, true)
  assert.equal(JSON.stringify(oversizedSnapshot).length, 500_001)

  try {
    Object.defineProperty(Array.prototype, 'toJSON', {
      configurable: true,
      value() {
        hookCalls += 1
        return [foreignMarker]
      },
      writable: true,
    })

    assert.ok(JSON.stringify(oversizedSnapshot).length < 500_000)
    assert.ok(hookCalls > 0)
    hookCalls = 0

    oversizedResult = storage.saveLichtwaldLog(oversizedSnapshot)

    assert.equal(hookCalls, 0)
  } finally {
    restorePropertyDescriptor(
      Array.prototype,
      'toJSON',
      previousDescriptor
    )
  }

  assert.deepEqual(
    Object.getOwnPropertyDescriptor(Array.prototype, 'toJSON'),
    previousDescriptor
  )
  assertFailure(
    oversizedResult,
    'sizeLimitExceeded',
    'lichtwaldLogDemoSizeLimitExceeded'
  )
  assertDoesNotContain(oversizedResult, [privateMarker, foreignMarker])
  assert.deepEqual(storage.loadLichtwaldLog().lichtwaldLog, trustedSnapshot)
})

test('wendet dieselbe Grenze auf den Seed an und repariert ihn nicht', () => {
  const boundarySnapshot = createLogWithSerializedLength(500_000)
  const oversizedSnapshot = createLogWithSerializedLength(500_001)
  const boundaryStorage =
    lichtwaldLogDemoStorageModule.createLichtwaldLogDemoStorage(
      () => boundarySnapshot
    )
  const oversizedStorage =
    lichtwaldLogDemoStorageModule.createLichtwaldLogDemoStorage(
      () => oversizedSnapshot
    )

  assert.deepEqual(
    boundaryStorage.loadLichtwaldLog().lichtwaldLog,
    boundarySnapshot
  )
  assertFailure(
    oversizedStorage.loadLichtwaldLog(),
    'sizeLimitExceeded',
    'lichtwaldLogDemoSizeLimitExceeded'
  )
  assertFailure(
    oversizedStorage.saveLichtwaldLog(createSyntheticLog()),
    'sizeLimitExceeded',
    'lichtwaldLogDemoSizeLimitExceeded'
  )
})

test('fängt Proxies, Accessors und Symbolfelder kontrolliert und redigiert ab', () => {
  const privateMarkers = [
    'private-transparent-proxy-sentinel',
    'private-accessor-sentinel',
    'private-symbol-sentinel',
  ]
  const transparentProxy = new Proxy(createSyntheticLog([
    createSyntheticEntry(41, { text: privateMarkers[0] }),
  ]), {})
  const accessorRoot = createSyntheticLog()
  Object.defineProperty(accessorRoot, 'dataOrigin', {
    configurable: true,
    enumerable: true,
    get() {
      throw new Error(privateMarkers[1])
    },
  })
  const symbolRoot = createSyntheticLog()
  symbolRoot[Symbol(privateMarkers[2])] = privateMarkers[2]
  const storage = lichtwaldLogDemoStorageModule.createLichtwaldLogDemoStorage()

  for (const hostileRoot of [transparentProxy, accessorRoot, symbolRoot]) {
    let result

    assert.doesNotThrow(() => {
      result = storage.saveLichtwaldLog(hostileRoot)
    })
    assertFailure(
      result,
      'validationFailed',
      'invalidLichtwaldLogDemoData'
    )
    assertDoesNotContain(result, privateMarkers)
  }
})

test('lässt aus widerrufenen Seed- und Save-Proxies keine Exception entkommen', () => {
  const revokedSeed = Proxy.revocable(() => createSyntheticLog(), {})
  revokedSeed.revoke()
  let seedStorage

  assert.doesNotThrow(() => {
    seedStorage = lichtwaldLogDemoStorageModule.createLichtwaldLogDemoStorage(
      revokedSeed.proxy
    )
  })
  assertFailure(
    seedStorage.loadLichtwaldLog(),
    'invalidStoredData',
    'invalidLichtwaldLogDemoData'
  )

  const revokedCandidate = Proxy.revocable(createSyntheticLog(), {})
  revokedCandidate.revoke()
  const storage = lichtwaldLogDemoStorageModule.createLichtwaldLogDemoStorage()
  let saveResult

  assert.doesNotThrow(() => {
    saveResult = storage.saveLichtwaldLog(revokedCandidate.proxy)
  })
  assertFailure(
    saveResult,
    'validationFailed',
    'invalidLichtwaldLogDemoData'
  )
})

test('fängt werfende Serialisierung ab und bewahrt den vorherigen Snapshot', () => {
  const privateMarker = 'private-demo-serialization-sentinel'
  const trustedSnapshot = createSyntheticLog([
    createSyntheticEntry(51),
  ])
  const storage = lichtwaldLogDemoStorageModule.createLichtwaldLogDemoStorage()
  const previousDescriptor = Object.getOwnPropertyDescriptor(
    JSON,
    'stringify'
  )

  assert.equal(storage.saveLichtwaldLog(trustedSnapshot).ok, true)

  let serializationResult
  try {
    Object.defineProperty(JSON, 'stringify', {
      configurable: true,
      value() {
        throw new Error(privateMarker)
      },
      writable: true,
    })

    assert.doesNotThrow(() => {
      serializationResult = storage.saveLichtwaldLog(createSyntheticLog())
    })
  } finally {
    restorePropertyDescriptor(JSON, 'stringify', previousDescriptor)
  }

  assert.deepEqual(
    Object.getOwnPropertyDescriptor(JSON, 'stringify'),
    previousDescriptor
  )
  assertFailure(
    serializationResult,
    'serializationFailed',
    'lichtwaldLogDemoSerializationFailed'
  )
  assertDoesNotContain(serializationResult, [privateMarker])
  assert.deepEqual(storage.loadLichtwaldLog().lichtwaldLog, trustedSnapshot)
})

test('gibt private Werte, IDs und fremde Exceptions nie in Fehlerresultaten aus', () => {
  const privateMarkers = [
    'private-demo-id-redaction-sentinel',
    'private-demo-title-redaction-sentinel',
    'private-demo-text-redaction-sentinel',
    'private-demo-tag-redaction-sentinel',
    'private-demo-exception-redaction-sentinel',
  ]
  const invalidRoot = createSyntheticLog([
    createSyntheticEntry(61, {
      id: ` ${privateMarkers[0]} `,
      title: ` ${privateMarkers[1]} `,
      text: ` ${privateMarkers[2]} `,
      tags: [` ${privateMarkers[3]} `],
    }),
  ])
  const validationResult =
    lichtwaldLogDemoStorageModule.createLichtwaldLogDemoStorage()
      .saveLichtwaldLog(invalidRoot)
  const seedResult =
    lichtwaldLogDemoStorageModule.createLichtwaldLogDemoStorage(() => {
      throw new Error(privateMarkers[4])
    }).loadLichtwaldLog()

  assertFailure(
    validationResult,
    'validationFailed',
    'invalidLichtwaldLogDemoData'
  )
  assertFailure(
    seedResult,
    'invalidStoredData',
    'invalidLichtwaldLogDemoData'
  )
  assertDoesNotContain(validationResult, privateMarkers)
  assertDoesNotContain(seedResult, privateMarkers)
})

test('Produktionsquelle besitzt keinen Key und keinen Browser-, Adapter-, DOM-, Console- oder Netzwerkzugriff', async () => {
  const source = await readFile(
    new URL('../src/storage/lichtwaldLogDemoStorage.js', import.meta.url),
    'utf8'
  )
  const excludedPatterns = [
    /goldendawn\./u,
    /lichtwaldLogStorage\.js/u,
    /storageAdapter\.js/u,
    /localStorage/u,
    /sessionStorage/u,
    /indexedDB/u,
    /\bcaches\b/u,
    /document\.cookie/u,
    /\bdocument\b/u,
    /\bwindow\b/u,
    /\bconsole\b/u,
    /\bfetch\b/u,
    /XMLHttpRequest/u,
    /WebSocket/u,
    /EventSource/u,
    /sendBeacon/u,
  ]

  excludedPatterns.forEach((excludedPattern) => {
    assert.equal(excludedPattern.test(source), false)
  })
})
