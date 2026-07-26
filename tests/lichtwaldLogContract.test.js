import assert from 'node:assert/strict'
import test from 'node:test'

import {
  LICHTWALD_LOG_DATA_ORIGINS,
  LICHTWALD_LOG_ERROR_CODES,
  LICHTWALD_LOG_ID_MAX_LENGTH,
  LICHTWALD_LOG_MAX_ENTRY_COUNT,
  LICHTWALD_LOG_MAX_TAG_COUNT,
  LICHTWALD_LOG_SCHEMA_VERSION,
  LICHTWALD_LOG_TAG_MAX_LENGTH,
  LICHTWALD_LOG_TEXT_MAX_LENGTH,
  LICHTWALD_LOG_TITLE_MAX_LENGTH,
  isValidCalendarDate,
  validateLichtwaldLog,
} from '../src/modules/lichtwald-log/lichtwaldLogContract.js'

function createEntry(overrides = {}) {
  return {
    id: 'lichtwald-entry-prisma',
    calendarDate: '2026-07-26',
    title: 'Vollständig synthetischer Prismamoment',
    text: 'Dieser LichtwaldLog-Inhalt wurde nur als Testfixture erfunden.',
    tags: ['Prisma', 'Ruhe'],
    ...overrides,
  }
}

function createLog(entries = [createEntry()], overrides = {}) {
  return {
    schemaVersion: 1,
    dataOrigin: 'synthetic',
    featuredEntryId: entries[0]?.id ?? null,
    entries,
    ...overrides,
  }
}

function getErrorCodes(result) {
  return result.errors.map((error) => error.code)
}

function assertHasError(result, code, path) {
  assert.equal(result.ok, false)
  assert.ok(
    result.errors.some((error) => error.code === code && error.path === path),
    `Erwarteter Fehler ${code} an ${path}: ${JSON.stringify(result.errors)}`
  )
}

function assertSingleError(result, code, path) {
  assert.equal(result.ok, false)
  assert.equal(result.errors.length, 1)
  assert.equal(result.errors[0].code, code)
  assert.equal(result.errors[0].path, path)
  assert.equal(typeof result.errors[0].message, 'string')
}

function assertErrorsDoNotContain(result, markers) {
  const serializedErrors = JSON.stringify(result.errors)

  for (const marker of markers) {
    assert.equal(serializedErrors.includes(marker), false)
  }
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Reflect.ownKeys(value).forEach((key) => deepFreeze(value[key]))
    Object.freeze(value)
  }

  return value
}

test('exportiert den festen LichtwaldLog-Schema-1-Vertrag', () => {
  assert.equal(LICHTWALD_LOG_SCHEMA_VERSION, 1)
  assert.deepEqual(LICHTWALD_LOG_DATA_ORIGINS, ['synthetic', 'private'])
  assert.equal(LICHTWALD_LOG_MAX_ENTRY_COUNT, 1000)
  assert.equal(LICHTWALD_LOG_ID_MAX_LENGTH, 100)
  assert.equal(LICHTWALD_LOG_TITLE_MAX_LENGTH, 120)
  assert.equal(LICHTWALD_LOG_TEXT_MAX_LENGTH, 10000)
  assert.equal(LICHTWALD_LOG_MAX_TAG_COUNT, 8)
  assert.equal(LICHTWALD_LOG_TAG_MAX_LENGTH, 30)
  assert.equal(Object.isFrozen(LICHTWALD_LOG_DATA_ORIGINS), true)
  assert.equal(Object.isFrozen(LICHTWALD_LOG_ERROR_CODES), true)
})

test('akzeptiert den leeren Zustand ausschließlich mit null-Fokus', () => {
  assert.deepEqual(validateLichtwaldLog(createLog([], {
    featuredEntryId: null,
  })), {
    ok: true,
    errors: [],
  })
})

test('akzeptiert private und synthetische Zustände', () => {
  for (const dataOrigin of ['private', 'synthetic']) {
    assert.deepEqual(validateLichtwaldLog(createLog(
      [createEntry()],
      { dataOrigin }
    )), {
      ok: true,
      errors: [],
    })
  }
})

test('akzeptiert einen einzelnen, mehrere oder keinen fokussierten Eintrag', () => {
  const entries = [
    createEntry(),
    createEntry({
      id: 'lichtwald-entry-spektrum',
      title: 'Synthetischer Spektrummoment',
      tags: ['Spektrum'],
    }),
  ]

  assert.equal(validateLichtwaldLog(createLog([entries[0]])).ok, true)
  assert.equal(validateLichtwaldLog(createLog(entries, {
    featuredEntryId: entries[1].id,
  })).ok, true)
  assert.equal(validateLichtwaldLog(createLog(entries, {
    featuredEntryId: null,
  })).ok, true)
})

test('akzeptiert exakte minimale und maximale Feldgrenzen', () => {
  const minimumEntry = createEntry({
    id: 'i',
    calendarDate: '0001-01-01',
    title: 'T',
    text: 'X',
    tags: ['Z'],
  })
  const maximumId = 'i'.repeat(100)
  const maximumEntry = createEntry({
    id: maximumId,
    calendarDate: '9999-12-31',
    title: 't'.repeat(120),
    text: 'x'.repeat(10000),
    tags: [
      'z'.repeat(30),
      'Tag zwei',
      'Tag drei',
      'Tag vier',
      'Tag fünf',
      'Tag sechs',
      'Tag sieben',
      'Tag acht',
    ],
  })

  assert.equal(validateLichtwaldLog(createLog([minimumEntry])).ok, true)
  assert.equal(validateLichtwaldLog(createLog([maximumEntry], {
    featuredEntryId: maximumId,
  })).ok, true)
})

test('weist null, Arrays und primitive Root-Werte kontrolliert zurück', () => {
  for (const rootValue of [null, [], 'log', 7, true]) {
    assert.deepEqual(validateLichtwaldLog(rootValue), {
      ok: false,
      errors: [{
        code: 'invalidLichtwaldLog',
        path: '$',
        message: 'Das LichtwaldLog muss ein Objekt sein.',
      }],
    })
  }
})

test('weist primitive, Array- und null-Einträge kontrolliert zurück', () => {
  const result = validateLichtwaldLog(createLog(
    [null, [], 'entry', 7],
    { featuredEntryId: null }
  ))

  assert.deepEqual(getErrorCodes(result), [
    'invalidEntry',
    'invalidEntry',
    'invalidEntry',
    'invalidEntry',
  ])
  assert.deepEqual(result.errors.map((error) => error.path), [
    '$.entries[0]',
    '$.entries[1]',
    '$.entries[2]',
    '$.entries[3]',
  ])
})

test('fordert alle vier Root-Felder als eigene Properties', () => {
  for (const propertyName of [
    'schemaVersion',
    'dataOrigin',
    'featuredEntryId',
    'entries',
  ]) {
    const log = createLog()
    delete log[propertyName]

    assertHasError(
      validateLichtwaldLog(log),
      LICHTWALD_LOG_ERROR_CODES.MISSING_PROPERTY,
      `$.${propertyName}`
    )
  }
})

test('fordert alle fünf Entry-Felder als eigene Properties', () => {
  for (const propertyName of ['id', 'calendarDate', 'title', 'text', 'tags']) {
    const entry = createEntry()
    delete entry[propertyName]

    assertHasError(
      validateLichtwaldLog(createLog([entry], { featuredEntryId: null })),
      LICHTWALD_LOG_ERROR_CODES.MISSING_PROPERTY,
      `$.entries[0].${propertyName}`
    )
  }
})

test('weist unbekannte Root- und Entry-Felder ohne Feldnamen-Leak zurück', () => {
  const privateRootField = 'private-root-field-sentinel'
  const privateEntryField = 'private-entry-field-sentinel'
  const log = createLog()
  log[privateRootField] = 'synthetischer Root-Wert'
  log.entries[0][privateEntryField] = 'synthetischer Entry-Wert'

  const result = validateLichtwaldLog(log)
  const serializedErrors = JSON.stringify(result.errors)

  assertHasError(result, 'unknownProperty', '$.*')
  assertHasError(result, 'unknownProperty', '$.entries[0].*')
  assert.equal(serializedErrors.includes(privateRootField), false)
  assert.equal(serializedErrors.includes(privateEntryField), false)
})

test('weist falsche Schemaversionen und unbekannte Datenherkünfte zurück', () => {
  for (const schemaVersion of [0, 2, '1', null, undefined]) {
    assertHasError(
      validateLichtwaldLog(createLog([], {
        schemaVersion,
        featuredEntryId: null,
      })),
      LICHTWALD_LOG_ERROR_CODES.UNSUPPORTED_SCHEMA_VERSION,
      '$.schemaVersion'
    )
  }

  for (const dataOrigin of ['demo', 'remote', '', ' private ', null]) {
    assertHasError(
      validateLichtwaldLog(createLog([], {
        dataOrigin,
        featuredEntryId: null,
      })),
      LICHTWALD_LOG_ERROR_CODES.INVALID_DATA_ORIGIN,
      '$.dataOrigin'
    )
  }
})

test('weist ein typfremdes entries-Feld zurück', () => {
  for (const entries of [null, {}, 'entries']) {
    assertHasError(
      validateLichtwaldLog(createLog([], {
        entries,
        featuredEntryId: null,
      })),
      LICHTWALD_LOG_ERROR_CODES.INVALID_ENTRIES,
      '$.entries'
    )
  }
})

test('akzeptiert gewöhnliche, tief eingefrorene und dichte Null-Prototyp-Arrays', () => {
  const regularLog = createLog([
    createEntry({ tags: ['Prisma', 'Fiktiv'] }),
  ])
  const nullPrototypeTags = ['Spektrum', 'Erfunden']
  const nullPrototypeEntries = [createEntry({
    id: 'lichtwald-entry-null-array-fixture',
    title: 'Synthetischer Null-Array-Moment',
    tags: nullPrototypeTags,
  })]

  Object.setPrototypeOf(nullPrototypeTags, null)
  Object.setPrototypeOf(nullPrototypeEntries, null)

  const nullPrototypeLog = createLog(nullPrototypeEntries)

  assert.deepEqual(validateLichtwaldLog(regularLog), {
    ok: true,
    errors: [],
  })
  assert.deepEqual(validateLichtwaldLog(deepFreeze(regularLog)), {
    ok: true,
    errors: [],
  })
  assert.deepEqual(validateLichtwaldLog(nullPrototypeLog), {
    ok: true,
    errors: [],
  })
  assert.equal(Object.getPrototypeOf(nullPrototypeEntries), null)
  assert.equal(Object.getPrototypeOf(nullPrototypeTags), null)
})

test('weist zusätzliche String- und Symbolfelder auf Vertragsarrays redigiert zurück', () => {
  const markers = [
    'fixture-enumerable-entry-array-field',
    'fixture-enumerable-tag-array-field',
    'fixture-hidden-entry-array-field',
    'fixture-hidden-tag-array-field',
    'fixture-entry-array-symbol',
    'fixture-tag-array-symbol',
    'fixture-array-private-value',
  ]
  const cases = [
    {
      path: '$.entries.*',
      createInvalidLog() {
        const entries = [createEntry()]
        entries[markers[0]] = markers[6]
        return createLog(entries)
      },
    },
    {
      path: '$.entries[0].tags.*',
      createInvalidLog() {
        const tags = ['Prisma']
        tags[markers[1]] = markers[6]
        return createLog([createEntry({ tags })])
      },
    },
    {
      path: '$.entries.*',
      createInvalidLog() {
        const entries = [createEntry()]
        Object.defineProperty(entries, '01', {
          configurable: true,
          value: markers[2],
        })
        return createLog(entries)
      },
    },
    {
      path: '$.entries[0].tags.*',
      createInvalidLog() {
        const tags = ['Prisma']
        Object.defineProperty(tags, '01', {
          configurable: true,
          value: markers[3],
        })
        return createLog([createEntry({ tags })])
      },
    },
    {
      path: '$.entries.*',
      createInvalidLog() {
        const entries = [createEntry()]
        entries[Symbol(markers[4])] = markers[6]
        return createLog(entries)
      },
    },
    {
      path: '$.entries[0].tags.*',
      createInvalidLog() {
        const tags = ['Prisma']
        tags[Symbol(markers[5])] = markers[6]
        return createLog([createEntry({ tags })])
      },
    },
  ]

  for (const testCase of cases) {
    const result = validateLichtwaldLog(testCase.createInvalidLog())

    assertSingleError(result, 'unknownProperty', testCase.path)
    assertErrorsDoNotContain(result, markers)
  }
})

test('meldet je malformed Array nur einen Shape-Fehler und liest Zusatzgetter nie', () => {
  const privateMarker = 'fixture-array-extra-getter-sentinel'
  let entriesGetterCalls = 0
  let tagsGetterCalls = 0
  const entries = [createEntry()]
  const tags = ['Prisma']

  Object.defineProperties(entries, {
    fixtureFirstExtra: {
      configurable: true,
      enumerable: true,
      get() {
        entriesGetterCalls += 1
        throw new Error(privateMarker)
      },
    },
    fixtureSecondExtra: {
      configurable: true,
      value: privateMarker,
    },
  })
  Object.defineProperties(tags, {
    fixtureFirstExtra: {
      configurable: true,
      enumerable: true,
      get() {
        tagsGetterCalls += 1
        throw new Error(privateMarker)
      },
    },
    fixtureSecondExtra: {
      configurable: true,
      value: privateMarker,
    },
  })

  const entriesResult = validateLichtwaldLog(createLog(entries))
  const tagsResult = validateLichtwaldLog(createLog([
    createEntry({ tags }),
  ]))

  assertSingleError(entriesResult, 'unknownProperty', '$.entries.*')
  assertSingleError(tagsResult, 'unknownProperty', '$.entries[0].tags.*')
  assert.equal(entriesGetterCalls, 0)
  assert.equal(tagsGetterCalls, 0)
  assertErrorsDoNotContain(entriesResult, [privateMarker])
  assertErrorsDoNotContain(tagsResult, [privateMarker])
})

test('weist dichte Arrays mit benutzerdefiniertem Prototyp auf Arrayebene zurück', () => {
  const entries = [createEntry()]
  const tags = ['Prisma']

  Object.setPrototypeOf(entries, Object.create(Array.prototype))
  Object.setPrototypeOf(tags, Object.create(Array.prototype))

  const entriesResult = validateLichtwaldLog(createLog([], {
    entries,
    featuredEntryId: entries[0].id,
  }))
  const tagsResult = validateLichtwaldLog(createLog([
    createEntry({ tags }),
  ]))

  assertSingleError(entriesResult, 'invalidEntries', '$.entries')
  assertSingleError(tagsResult, 'invalidTags', '$.entries[0].tags')
  assert.equal(
    getErrorCodes(entriesResult).includes('featuredEntryNotFound'),
    false
  )
})

test('geerbte Werte machen Sparse-Lücken nicht zu eigenen Arraypositionen', () => {
  const inheritedEntryIndex = '1'
  const inheritedTagIndex = '2'
  const previousEntryDescriptor = Object.getOwnPropertyDescriptor(
    Array.prototype,
    inheritedEntryIndex
  )
  const previousTagDescriptor = Object.getOwnPropertyDescriptor(
    Array.prototype,
    inheritedTagIndex
  )
  const inheritedEntry = createEntry({
    id: 'lichtwald-entry-inherited-fixture',
    title: 'Vollständig synthetischer geerbter Testmoment',
    tags: ['Geerbt', 'Erfunden'],
  })

  Object.defineProperty(Array.prototype, inheritedEntryIndex, {
    configurable: true,
    writable: true,
    value: inheritedEntry,
  })
  Object.defineProperty(Array.prototype, inheritedTagIndex, {
    configurable: true,
    writable: true,
    value: 'Vollständig synthetischer geerbter Tag',
  })

  try {
    const entries = [createEntry()]
    const tags = ['Prisma', 'Ruhe']
    entries.length = 2
    tags.length = 3

    const entriesResult = validateLichtwaldLog(createLog(entries, {
      featuredEntryId: inheritedEntry.id,
    }))
    const tagsResult = validateLichtwaldLog(createLog([
      createEntry({ tags }),
    ]))

    assertHasError(entriesResult, 'invalidEntry', '$.entries[1]')
    assertHasError(
      entriesResult,
      'featuredEntryNotFound',
      '$.featuredEntryId'
    )
    assertHasError(tagsResult, 'invalidTag', '$.entries[0].tags[2]')
  } finally {
    if (previousEntryDescriptor) {
      Object.defineProperty(
        Array.prototype,
        inheritedEntryIndex,
        previousEntryDescriptor
      )
    } else {
      delete Array.prototype[inheritedEntryIndex]
    }

    if (previousTagDescriptor) {
      Object.defineProperty(
        Array.prototype,
        inheritedTagIndex,
        previousTagDescriptor
      )
    } else {
      delete Array.prototype[inheritedTagIndex]
    }
  }
})

test('weist widerrufene Array-Proxies kontrolliert und redigiert zurück', () => {
  const privateMarker = 'fixture-revoked-array-private-sentinel'
  const revokedEntries = Proxy.revocable([createEntry()], {})
  const revokedTags = Proxy.revocable(['Prisma'], {})
  const entriesLog = createLog([], {
    entries: revokedEntries.proxy,
    featuredEntryId: 'lichtwald-entry-prisma',
  })
  const tagsLog = createLog([
    createEntry({ tags: revokedTags.proxy }),
  ])

  revokedEntries.revoke()
  revokedTags.revoke()

  let entriesResult
  let tagsResult

  assert.doesNotThrow(() => {
    entriesResult = validateLichtwaldLog(entriesLog)
    tagsResult = validateLichtwaldLog(tagsLog)
  })

  assertSingleError(entriesResult, 'invalidEntries', '$.entries')
  assertSingleError(tagsResult, 'invalidTags', '$.entries[0].tags')
  assert.equal(
    getErrorCodes(entriesResult).includes('featuredEntryNotFound'),
    false
  )
  assertErrorsDoNotContain(entriesResult, [privateMarker, 'revoked'])
  assertErrorsDoNotContain(tagsResult, [privateMarker, 'revoked'])
})

test('fängt werfende Array-Reflection-Traps stabil und ohne Fremdmeldung ab', () => {
  const privateMarkers = [
    'fixture-array-prototype-trap-sentinel',
    'fixture-array-own-keys-trap-sentinel',
    'fixture-array-length-trap-sentinel',
  ]
  const proxyFactories = [
    (arrayValue) => new Proxy(arrayValue, {
      getPrototypeOf() {
        throw new Error(privateMarkers[0])
      },
    }),
    (arrayValue) => new Proxy(arrayValue, {
      ownKeys() {
        throw new Error(privateMarkers[1])
      },
    }),
    (arrayValue) => new Proxy(arrayValue, {
      get(target, propertyName, receiver) {
        if (propertyName === 'length') {
          throw new Error(privateMarkers[2])
        }

        return Reflect.get(target, propertyName, receiver)
      },
    }),
  ]

  for (const createProxy of proxyFactories) {
    const entries = createProxy([createEntry()])
    const tags = createProxy(['Prisma'])
    const entriesLog = createLog([], {
      entries,
      featuredEntryId: 'lichtwald-entry-prisma',
    })
    const tagsLog = createLog([createEntry({ tags })])
    let entriesResult
    let tagsResult

    assert.doesNotThrow(() => {
      entriesResult = validateLichtwaldLog(entriesLog)
      tagsResult = validateLichtwaldLog(tagsLog)
    })

    assertSingleError(entriesResult, 'invalidEntries', '$.entries')
    assertSingleError(tagsResult, 'invalidTags', '$.entries[0].tags')
    assert.equal(
      getErrorCodes(entriesResult).includes('featuredEntryNotFound'),
      false
    )
    assertErrorsDoNotContain(entriesResult, privateMarkers)
    assertErrorsDoNotContain(tagsResult, privateMarkers)
    assert.deepEqual(validateLichtwaldLog(entriesLog), entriesResult)
    assert.deepEqual(validateLichtwaldLog(tagsLog), tagsResult)
  }
})

test('unterdrückt bei werfendem Entry-Get-Trap nur den unbewiesenen Fokusfehler', () => {
  const privateMarker = 'fixture-entry-position-get-trap-sentinel'
  const focusedEntry = createEntry({
    id: 'lichtwald-entry-get-trap-focus-fixture',
    title: 'Vollständig synthetischer Get-Trap-Testmoment',
  })
  const entriesTarget = [focusedEntry]
  const targetSnapshot = structuredClone(entriesTarget)
  const directLog = createLog(entriesTarget, {
    dataOrigin: 'private',
    featuredEntryId: focusedEntry.id,
  })

  assert.deepEqual(validateLichtwaldLog(directLog), {
    ok: true,
    errors: [],
  })

  let positionGetCalls = 0
  const entries = new Proxy(entriesTarget, {
    get(target, propertyName, receiver) {
      if (propertyName === '0') {
        positionGetCalls += 1
        throw new Error(privateMarker)
      }

      return Reflect.get(target, propertyName, receiver)
    },
  })
  const log = createLog([], {
    dataOrigin: 'private',
    featuredEntryId: focusedEntry.id,
    entries,
  })
  let firstResult

  assert.doesNotThrow(() => {
    firstResult = validateLichtwaldLog(log)
  })

  const secondResult = validateLichtwaldLog(log)

  assertSingleError(firstResult, 'invalidEntry', '$.entries[0]')
  assert.equal(
    getErrorCodes(firstResult).includes('featuredEntryNotFound'),
    false
  )
  assertErrorsDoNotContain(firstResult, [privateMarker])
  assert.deepEqual(secondResult, firstResult)
  assert.equal(positionGetCalls, 2)
  assert.deepEqual(entriesTarget, targetSnapshot)
  assert.equal(Object.getPrototypeOf(entriesTarget), Array.prototype)
})

test('unterdrückt bei werfendem Entry-Descriptor-Trap nur den unbewiesenen Fokusfehler', () => {
  const privateMarker = 'fixture-entry-position-descriptor-trap-sentinel'
  const focusedEntry = createEntry({
    id: 'lichtwald-entry-descriptor-trap-focus-fixture',
    title: 'Vollständig synthetischer Descriptor-Trap-Testmoment',
  })
  const entriesTarget = [focusedEntry]
  const targetSnapshot = structuredClone(entriesTarget)
  const directLog = createLog(entriesTarget, {
    dataOrigin: 'private',
    featuredEntryId: focusedEntry.id,
  })

  assert.deepEqual(validateLichtwaldLog(directLog), {
    ok: true,
    errors: [],
  })

  let positionDescriptorCalls = 0
  const entries = new Proxy(entriesTarget, {
    getOwnPropertyDescriptor(target, propertyName) {
      if (propertyName === '0') {
        positionDescriptorCalls += 1
        throw new Error(privateMarker)
      }

      return Reflect.getOwnPropertyDescriptor(target, propertyName)
    },
  })
  const log = createLog([], {
    dataOrigin: 'private',
    featuredEntryId: focusedEntry.id,
    entries,
  })
  let firstResult

  assert.doesNotThrow(() => {
    firstResult = validateLichtwaldLog(log)
  })

  const secondResult = validateLichtwaldLog(log)

  assertSingleError(firstResult, 'invalidEntry', '$.entries[0]')
  assert.equal(
    getErrorCodes(firstResult).includes('featuredEntryNotFound'),
    false
  )
  assertErrorsDoNotContain(firstResult, [privateMarker])
  assert.deepEqual(secondResult, firstResult)
  assert.equal(positionDescriptorCalls, 2)
  assert.deepEqual(entriesTarget, targetSnapshot)
  assert.equal(Object.getPrototypeOf(entriesTarget), Array.prototype)
})

test('erkennt Sparse-Array-Lücken im entries-Array', () => {
  const entries = [createEntry()]
  entries.length = 3
  const result = validateLichtwaldLog(createLog(entries))

  assertHasError(result, 'invalidEntry', '$.entries[1]')
  assertHasError(result, 'invalidEntry', '$.entries[2]')
})

test('akzeptiert 1.000 Einträge und weist 1.001 Einträge zurück', () => {
  const entries = Array.from({ length: 1001 }, (_, index) => createEntry({
    id: `lichtwald-entry-count-${index}`,
    title: `Synthetischer Zählmoment ${index}`,
    tags: [],
  }))

  assert.equal(validateLichtwaldLog(createLog(entries.slice(0, 1000))).ok, true)

  const result = validateLichtwaldLog(createLog(entries))
  assert.deepEqual(getErrorCodes(result), ['entryLimitExceeded'])
  assert.equal(result.errors[0].path, '$.entries')
})

test('begrenzt die Prüfung eines deutlich überlangen Sparse-Entry-Arrays', () => {
  const entries = [createEntry()]
  const declaredEntryCount = 10000
  entries.length = declaredEntryCount

  const result = validateLichtwaldLog(createLog(entries))

  assert.equal(entries.length, declaredEntryCount)
  assert.equal(Object.hasOwn(entries, 1), false)
  assert.equal(result.errors.length, LICHTWALD_LOG_MAX_ENTRY_COUNT)
  assert.deepEqual(getErrorCodes(result).slice(0, 2), [
    'entryLimitExceeded',
    'invalidEntry',
  ])
  assert.equal(result.errors[1].path, '$.entries[1]')
  assert.equal(
    result.errors[result.errors.length - 1].path,
    `$.entries[${LICHTWALD_LOG_MAX_ENTRY_COUNT - 1}]`
  )
  assert.equal(result.errors.some(
    (error) => error.path === `$.entries[${LICHTWALD_LOG_MAX_ENTRY_COUNT}]`
  ), false)
})

test('weist leere, ungetrimmte, typfremde und überlange Entry-IDs zurück', () => {
  const cases = [
    ['', 'invalidId'],
    ['   ', 'invalidId'],
    [' entry ', 'invalidId'],
    [42, 'invalidId'],
    ['i'.repeat(101), 'idTooLong'],
  ]

  for (const [id, expectedCode] of cases) {
    const result = validateLichtwaldLog(createLog(
      [createEntry({ id })],
      { featuredEntryId: null }
    ))

    assertHasError(result, expectedCode, '$.entries[0].id')
  }
})

test('weist exakt doppelte Entry-IDs zurück', () => {
  const result = validateLichtwaldLog(createLog([
    createEntry(),
    createEntry({ title: 'Zweiter synthetischer Moment' }),
  ]))

  assert.deepEqual(getErrorCodes(result), ['duplicateEntryId'])
  assert.equal(result.errors[0].path, '$.entries[1].id')
})

test('behandelt Entry-IDs case-sensitive und löst den Fokus exakt auf', () => {
  const entries = [
    createEntry({ id: 'lichtwald-entry-case' }),
    createEntry({
      id: 'Lichtwald-entry-case',
      title: 'Synthetischer Großschreibungsmoment',
    }),
  ]

  assert.equal(validateLichtwaldLog(createLog(entries, {
    featuredEntryId: 'Lichtwald-entry-case',
  })).ok, true)
})

test('fordert featuredEntryId als null oder gültige bereits getrimmte ID', () => {
  const invalidCases = [
    ['', 'invalidId'],
    [' featured ', 'invalidId'],
    [42, 'invalidId'],
    ['f'.repeat(101), 'idTooLong'],
  ]

  for (const [featuredEntryId, expectedCode] of invalidCases) {
    assertHasError(
      validateLichtwaldLog(createLog([], { featuredEntryId })),
      expectedCode,
      '$.featuredEntryId'
    )
  }
})

test('weist verwaiste und nur case-insensitiv passende Fokusreferenzen zurück', () => {
  for (const featuredEntryId of [
    'lichtwald-entry-unbekannt',
    'LICHTWALD-ENTRY-PRISMA',
  ]) {
    assertHasError(
      validateLichtwaldLog(createLog([createEntry()], { featuredEntryId })),
      LICHTWALD_LOG_ERROR_CODES.FEATURED_ENTRY_NOT_FOUND,
      '$.featuredEntryId'
    )
  }

  assertHasError(
    validateLichtwaldLog(createLog([], {
      featuredEntryId: 'lichtwald-entry-ohne-log',
    })),
    LICHTWALD_LOG_ERROR_CODES.FEATURED_ENTRY_NOT_FOUND,
    '$.featuredEntryId'
  )
})

test('weist ungültige Datumsformate und fehlende Nullauffüllung zurück', () => {
  const invalidDates = [
    '2026-7-01',
    '2026-07-1',
    '026-07-01',
    '2026/07/01',
    '2026-07-01T00:00:00.000Z',
    ' 2026-07-01 ',
    '2026-07-01\n',
    null,
  ]

  for (const calendarDate of invalidDates) {
    assert.equal(isValidCalendarDate(calendarDate), false)
    assertHasError(
      validateLichtwaldLog(createLog([
        createEntry({ calendarDate }),
      ])),
      LICHTWALD_LOG_ERROR_CODES.INVALID_CALENDAR_DATE,
      '$.entries[0].calendarDate'
    )
  }
})

test('weist Jahr null, Monat 00 und 13 sowie ungültige Monatslängen zurück', () => {
  for (const calendarDate of [
    '0000-01-01',
    '2026-00-01',
    '2026-13-01',
    '2026-01-00',
    '2026-04-31',
    '2026-06-31',
    '2026-09-31',
    '2026-11-31',
    '2026-02-30',
  ]) {
    assert.equal(isValidCalendarDate(calendarDate), false)
  }
})

test('wendet die gregorianischen Schaltjahrregeln exakt an', () => {
  assert.equal(isValidCalendarDate('2000-02-29'), true)
  assert.equal(isValidCalendarDate('2024-02-29'), true)
  assert.equal(isValidCalendarDate('2026-02-29'), false)
  assert.equal(isValidCalendarDate('1900-02-29'), false)

  assert.equal(validateLichtwaldLog(createLog([
    createEntry({ calendarDate: '2000-02-29' }),
  ])).ok, true)
  assertHasError(
    validateLichtwaldLog(createLog([
      createEntry({ calendarDate: '1900-02-29' }),
    ])),
    'invalidCalendarDate',
    '$.entries[0].calendarDate'
  )
})

test('akzeptiert gültige zukünftige reine Kalenderdaten ohne UTC-Umwandlung', () => {
  for (const calendarDate of ['2099-12-31', '2400-02-29', '9999-12-31']) {
    assert.equal(isValidCalendarDate(calendarDate), true)
    assert.equal(validateLichtwaldLog(createLog([
      createEntry({ calendarDate }),
    ])).ok, true)
  }
})

test('weist leere, ungetrimmte, typfremde und überlange Titel zurück', () => {
  const cases = [
    ['', 'invalidTitle'],
    ['   ', 'invalidTitle'],
    [' Titel ', 'invalidTitle'],
    [42, 'invalidTitle'],
    ['t'.repeat(121), 'titleTooLong'],
  ]

  for (const [title, expectedCode] of cases) {
    assertHasError(
      validateLichtwaldLog(createLog([createEntry({ title })])),
      expectedCode,
      '$.entries[0].title'
    )
  }
})

test('weist leere, ungetrimmte, typfremde und überlange Texte zurück', () => {
  const cases = [
    ['', 'invalidText'],
    ['   ', 'invalidText'],
    [' Text ', 'invalidText'],
    [42, 'invalidText'],
    ['x'.repeat(10001), 'textTooLong'],
  ]

  for (const [text, expectedCode] of cases) {
    assertHasError(
      validateLichtwaldLog(createLog([createEntry({ text })])),
      expectedCode,
      '$.entries[0].text'
    )
  }
})

test('akzeptiert Zeilenumbrüche und HTML- oder Script-Sentinels unverändert als Text', () => {
  const text = '<script>syntheticSentinel()</script>\n<section>Erfundener Text</section>'
  const log = createLog([createEntry({ text })])
  const snapshot = structuredClone(log)

  assert.deepEqual(validateLichtwaldLog(log), { ok: true, errors: [] })
  assert.equal(log.entries[0].text, text)
  assert.deepEqual(log, snapshot)
})

test('akzeptiert acht Tags und weist neun Tags zurück', () => {
  const eightTags = Array.from({ length: 8 }, (_, index) => `Tag ${index + 1}`)
  const nineTags = [...eightTags, 'Tag 9']

  assert.equal(validateLichtwaldLog(createLog([
    createEntry({ tags: eightTags }),
  ])).ok, true)

  const result = validateLichtwaldLog(createLog([
    createEntry({ tags: nineTags }),
  ]))
  assert.deepEqual(getErrorCodes(result), ['tagLimitExceeded'])
  assert.equal(result.errors[0].path, '$.entries[0].tags')
})

test('begrenzt die Prüfung eines deutlich überlangen Sparse-Tag-Arrays', () => {
  const tags = ['Prisma']
  const declaredTagCount = 10000
  tags.length = declaredTagCount

  const result = validateLichtwaldLog(createLog([createEntry({ tags })]))

  assert.equal(tags.length, declaredTagCount)
  assert.equal(Object.hasOwn(tags, 1), false)
  assert.equal(result.errors.length, LICHTWALD_LOG_MAX_TAG_COUNT)
  assert.deepEqual(getErrorCodes(result).slice(0, 2), [
    'tagLimitExceeded',
    'invalidTag',
  ])
  assert.equal(result.errors[1].path, '$.entries[0].tags[1]')
  assert.equal(
    result.errors[result.errors.length - 1].path,
    `$.entries[0].tags[${LICHTWALD_LOG_MAX_TAG_COUNT - 1}]`
  )
  assert.equal(result.errors.some(
    (error) => (
      error.path === `$.entries[0].tags[${LICHTWALD_LOG_MAX_TAG_COUNT}]`
    )
  ), false)
})

test('überspringt Own-Key-Reflection überlanger Arrays, prüft aber ihren Prototyp', () => {
  const privateMarker = 'fixture-overlong-array-own-keys-sentinel'
  let entriesOwnKeysCalls = 0
  let tagsOwnKeysCalls = 0
  const entriesTarget = [createEntry()]
  const tagsTarget = ['Prisma']
  entriesTarget.length = 10000
  tagsTarget.length = 10000

  const entries = new Proxy(entriesTarget, {
    ownKeys() {
      entriesOwnKeysCalls += 1
      throw new Error(privateMarker)
    },
  })
  const tags = new Proxy(tagsTarget, {
    ownKeys() {
      tagsOwnKeysCalls += 1
      throw new Error(privateMarker)
    },
  })

  const entriesResult = validateLichtwaldLog(createLog([], {
    entries,
    featuredEntryId: null,
  }))
  const tagsResult = validateLichtwaldLog(createLog([
    createEntry({ tags }),
  ]))

  assert.equal(entriesOwnKeysCalls, 0)
  assert.equal(tagsOwnKeysCalls, 0)
  assertHasError(entriesResult, 'entryLimitExceeded', '$.entries')
  assertHasError(tagsResult, 'tagLimitExceeded', '$.entries[0].tags')
  assertErrorsDoNotContain(entriesResult, [privateMarker])
  assertErrorsDoNotContain(tagsResult, [privateMarker])

  const customEntries = [createEntry()]
  const customTags = ['Prisma']
  customEntries.length = 10000
  customTags.length = 10000
  Object.setPrototypeOf(customEntries, Object.create(Array.prototype))
  Object.setPrototypeOf(customTags, Object.create(Array.prototype))

  assertSingleError(
    validateLichtwaldLog(createLog([], {
      entries: customEntries,
      featuredEntryId: null,
    })),
    'invalidEntries',
    '$.entries'
  )
  assertSingleError(
    validateLichtwaldLog(createLog([createEntry({ tags: customTags })])),
    'invalidTags',
    '$.entries[0].tags'
  )
})

test('weist ein typfremdes tags-Feld kontrolliert zurück', () => {
  for (const tags of [null, {}, 'tags', 7]) {
    assertHasError(
      validateLichtwaldLog(createLog([createEntry({ tags })])),
      LICHTWALD_LOG_ERROR_CODES.INVALID_TAGS,
      '$.entries[0].tags'
    )
  }
})

test('erkennt Sparse-Array-Lücken im tags-Array', () => {
  const tags = ['Prisma']
  tags.length = 3
  const result = validateLichtwaldLog(createLog([createEntry({ tags })]))

  assertHasError(result, 'invalidTag', '$.entries[0].tags[1]')
  assertHasError(result, 'invalidTag', '$.entries[0].tags[2]')
})

test('weist leere, ungetrimmte, typfremde und überlange Tags zurück', () => {
  const cases = [
    ['', 'invalidTag'],
    ['   ', 'invalidTag'],
    [' Tag ', 'invalidTag'],
    [42, 'invalidTag'],
    ['t'.repeat(31), 'tagTooLong'],
  ]

  for (const [tag, expectedCode] of cases) {
    assertHasError(
      validateLichtwaldLog(createLog([createEntry({ tags: [tag] })])),
      expectedCode,
      '$.entries[0].tags[0]'
    )
  }
})

test('weist Tag-Duplikate ohne Beachtung der Groß- und Kleinschreibung zurück', () => {
  const tags = ['Natur', 'nAtUr']
  const result = validateLichtwaldLog(createLog([createEntry({ tags })]))

  assert.deepEqual(getErrorCodes(result), ['duplicateTag'])
  assert.equal(result.errors[0].path, '$.entries[0].tags[1]')
  assert.deepEqual(tags, ['Natur', 'nAtUr'])
})

test('erlaubt Tags ohne zusätzliche Zeichen-Whitelist oder Komma-Parsing', () => {
  const tags = ['Wald, Licht', 'Ruhe & Fokus', 'Äther/Gold', '#Synthetisch']
  assert.deepEqual(validateLichtwaldLog(createLog([
    createEntry({ tags }),
  ])), {
    ok: true,
    errors: [],
  })
})

test('akkumuliert mehrere Fehler in stabiler Reihenfolge', () => {
  const result = validateLichtwaldLog({
    schemaVersion: 2,
    dataOrigin: 'remote',
    featuredEntryId: ' focus ',
    entries: [
      createEntry({
        id: ' entry ',
        calendarDate: '2026-02-29',
        title: ' ',
        text: ' text ',
        tags: ['Ruhe', 'ruhe', null],
      }),
      null,
    ],
  })

  assert.deepEqual(getErrorCodes(result), [
    'unsupportedSchemaVersion',
    'invalidDataOrigin',
    'invalidId',
    'invalidId',
    'invalidCalendarDate',
    'invalidTitle',
    'invalidText',
    'duplicateTag',
    'invalidTag',
    'invalidEntry',
  ])
  assert.deepEqual(result.errors.map((error) => error.path), [
    '$.schemaVersion',
    '$.dataOrigin',
    '$.featuredEntryId',
    '$.entries[0].id',
    '$.entries[0].calendarDate',
    '$.entries[0].title',
    '$.entries[0].text',
    '$.entries[0].tags[1]',
    '$.entries[0].tags[2]',
    '$.entries[1]',
  ])
})

test('liefert bei Wiederholung dieselbe deterministische Fehlerfolge', () => {
  const invalidLog = createLog([
    createEntry({
      calendarDate: '2026-04-31',
      tags: ['Prisma', 'PRISMA'],
    }),
    null,
  ], {
    featuredEntryId: 'nicht-vorhanden',
  })

  assert.deepEqual(
    validateLichtwaldLog(invalidLog),
    validateLichtwaldLog(invalidLog)
  )
})

test('verändert gültige, ungültige und tief eingefrorene Eingaben nicht', () => {
  const validLog = createLog()
  const invalidLog = createLog([
    createEntry({ title: ' ungetrimmt ' }),
  ])
  const validSnapshot = structuredClone(validLog)
  const invalidSnapshot = structuredClone(invalidLog)

  validateLichtwaldLog(validLog)
  validateLichtwaldLog(invalidLog)

  assert.deepEqual(validLog, validSnapshot)
  assert.deepEqual(invalidLog, invalidSnapshot)
  assert.deepEqual(validateLichtwaldLog(deepFreeze(validLog)), {
    ok: true,
    errors: [],
  })
})

test('verändert Array-Keys, Deskriptoren und Prototypen nicht', () => {
  const arraySymbol = Symbol('fixture-array-nonmutation-symbol')
  const tags = ['Prisma']
  const entries = [createEntry({ tags })]

  Object.defineProperty(entries, 'fixtureHiddenField', {
    configurable: true,
    value: 'Vollständig synthetischer unveränderter Wert',
  })
  Object.defineProperty(tags, arraySymbol, {
    configurable: true,
    value: 'Vollständig synthetischer Symbolwert',
  })

  const entriesKeys = Reflect.ownKeys(entries)
  const tagsKeys = Reflect.ownKeys(tags)
  const entriesDescriptors = Object.getOwnPropertyDescriptors(entries)
  const tagsDescriptors = Object.getOwnPropertyDescriptors(tags)
  const entriesPrototype = Object.getPrototypeOf(entries)
  const tagsPrototype = Object.getPrototypeOf(tags)

  validateLichtwaldLog(createLog(entries))

  assert.deepEqual(Reflect.ownKeys(entries), entriesKeys)
  assert.deepEqual(Reflect.ownKeys(tags), tagsKeys)
  assert.deepEqual(
    Object.getOwnPropertyDescriptors(entries),
    entriesDescriptors
  )
  assert.deepEqual(Object.getOwnPropertyDescriptors(tags), tagsDescriptors)
  assert.equal(Object.getPrototypeOf(entries), entriesPrototype)
  assert.equal(Object.getPrototypeOf(tags), tagsPrototype)
})

test('bewahrt einen gültigen synthetischen Standard-Snapshot im JSON-Roundtrip', () => {
  const entries = [
    createEntry(),
    createEntry({
      id: 'lichtwald-entry-json-spektrum',
      calendarDate: '2026-08-03',
      title: 'Vollständig synthetischer Spektrummoment',
      text: 'Ein frei erfundener Fixture-Text für den JSON-Roundtrip.',
      tags: ['Spektrum', 'Erfunden'],
    }),
  ]
  const snapshot = createLog(entries, {
    featuredEntryId: entries[1].id,
  })
  const roundTrippedSnapshot = JSON.parse(JSON.stringify(snapshot))

  assert.deepEqual(roundTrippedSnapshot, snapshot)
  assert.deepEqual(validateLichtwaldLog(snapshot), {
    ok: true,
    errors: [],
  })
  assert.deepEqual(validateLichtwaldLog(roundTrippedSnapshot), {
    ok: true,
    errors: [],
  })
})

test('nimmt keine privaten Rohwerte oder unbekannten Feldnamen in Fehler auf', () => {
  const privateMarkers = [
    'private-focus-sentinel',
    'private-id-sentinel',
    'private-date-sentinel',
    'private-title-sentinel',
    'private-text-sentinel',
    'private-tag-sentinel',
    'private-property-sentinel',
  ]
  const log = createLog([
    createEntry({
      id: ` ${privateMarkers[1]} `,
      calendarDate: privateMarkers[2],
      title: ` ${privateMarkers[3]} `,
      text: ` ${privateMarkers[4]} `,
      tags: [` ${privateMarkers[5]} `],
    }),
  ], {
    featuredEntryId: ` ${privateMarkers[0]} `,
  })
  log.entries[0][privateMarkers[6]] = 'synthetischer Markerwert'

  const serializedErrors = JSON.stringify(validateLichtwaldLog(log).errors)

  privateMarkers.forEach((privateMarker) => {
    assert.equal(serializedErrors.includes(privateMarker), false)
  })
})

test('erlaubt null-Prototypes und weist Custom-Prototypes kontrolliert zurück', () => {
  const nullPrototypeEntry = Object.assign(
    Object.create(null),
    createEntry()
  )
  const nullPrototypeLog = Object.assign(
    Object.create(null),
    createLog([nullPrototypeEntry])
  )

  assert.deepEqual(validateLichtwaldLog(nullPrototypeLog), {
    ok: true,
    errors: [],
  })

  const inheritedLog = Object.create(createLog())
  const inheritedEntry = Object.assign(
    Object.create({ inheritedSyntheticField: 'synthetic' }),
    createEntry()
  )

  assert.deepEqual(getErrorCodes(validateLichtwaldLog(inheritedLog)), [
    'invalidLichtwaldLog',
  ])
  assert.deepEqual(getErrorCodes(validateLichtwaldLog(createLog([
    inheritedEntry,
  ]))), ['invalidEntry', 'featuredEntryNotFound'])
})

test('behandelt fehlerwerfende Teilstrukturen ohne ungefangene Exception', () => {
  const privateErrorMarker = 'private-contract-getter-error-sentinel'
  const entry = createEntry()
  Object.defineProperty(entry, 'text', {
    enumerable: true,
    get() {
      throw new Error(privateErrorMarker)
    },
  })

  let result
  assert.doesNotThrow(() => {
    result = validateLichtwaldLog(createLog([entry]))
  })

  assertHasError(result, 'invalidText', '$.entries[0].text')
  assert.equal(JSON.stringify(result.errors).includes(privateErrorMarker), false)
})

test('gibt ausschließlich stabile Fehlerobjekte zurück', () => {
  const result = validateLichtwaldLog({})

  result.errors.forEach((error) => {
    assert.deepEqual(Object.keys(error), ['code', 'path', 'message'])
    assert.equal(typeof error.code, 'string')
    assert.equal(typeof error.path, 'string')
    assert.equal(typeof error.message, 'string')
  })
})
