import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import * as lichtwaldLogSearchModule from '../src/modules/lichtwald-log/lichtwaldLogSearch.js'

const {
  ALL_LICHTWALD_LOG_TAGS,
  LICHTWALD_LOG_SEARCH_QUERY_MAX_LENGTH,
  filterLichtwaldLogEntries,
  getLichtwaldLogFilterTags,
} = lichtwaldLogSearchModule

// Alle Einträge und IDs dieser Datei sind vollständig frei erfunden.
function createEntry(overrides = {}) {
  return {
    id: 'lichtwald-entry-invented-prism-1',
    calendarDate: '2041-02-03',
    title: 'Erfundene Ätherlaterne',
    text: 'Eine synthetische Notiz über geometrische Funken.',
    tags: ['Wald', 'Prisma'],
    ...overrides,
  }
}

function getEntryIds(entries) {
  return entries.map((entry) => entry.id)
}

function assertDenseArray(value) {
  assert.equal(Array.isArray(value), true)

  for (let index = 0; index < value.length; index += 1) {
    assert.equal(Object.hasOwn(value, index), true)
  }
}

function deepFreeze(value, seen = new Set()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return value

  seen.add(value)
  Reflect.ownKeys(value).forEach((propertyName) => {
    deepFreeze(value[propertyName], seen)
  })
  return Object.freeze(value)
}

test('exportiert ausschließlich die vereinbarte reine Such-API und feste Konstanten', () => {
  assert.deepEqual(Object.keys(lichtwaldLogSearchModule).sort(), [
    'ALL_LICHTWALD_LOG_TAGS',
    'LICHTWALD_LOG_SEARCH_QUERY_MAX_LENGTH',
    'filterLichtwaldLogEntries',
    'getLichtwaldLogFilterTags',
  ].sort())
  assert.equal(ALL_LICHTWALD_LOG_TAGS, '')
  assert.equal(LICHTWALD_LOG_SEARCH_QUERY_MAX_LENGTH, 200)
  assert.equal(typeof filterLichtwaldLogEntries, 'function')
  assert.equal(typeof getLichtwaldLogFilterTags, 'function')
})

test('liefert bei leerer oder nur äußerer Whitespace-Query alle Einträge unverändert geordnet', () => {
  const entries = [
    createEntry(),
    createEntry({
      id: 'lichtwald-entry-invented-comet-2',
      title: 'Synthetische Kometenkarte',
    }),
  ]

  for (const options of [undefined, {}, { query: '' }, { query: ' \t\n ' }]) {
    const result = filterLichtwaldLogEntries(entries, options)

    assert.deepEqual(result, entries)
    assert.notStrictEqual(result, entries)
    assert.strictEqual(result[0], entries[0])
    assert.strictEqual(result[1], entries[1])
    assertDenseArray(result)
  }
})

test('durchsucht ausschließlich Kalenderdatum, Titel, Text und jeden Tag', () => {
  const first = createEntry()
  const second = createEntry({
    id: 'lichtwald-entry-private-id-marker',
    calendarDate: '2038-11-27',
    title: 'Synthetische Orbitkarte',
    text: 'Eine vollständig erfundene Passage über blaue Spiralen.',
    tags: ['Komet', 'Modell'],
  })
  const entries = [first, second]

  assert.deepEqual(
    getEntryIds(filterLichtwaldLogEntries(entries, { query: '2041-02' })),
    [first.id]
  )
  assert.deepEqual(
    getEntryIds(filterLichtwaldLogEntries(entries, { query: 'orbitkarte' })),
    [second.id]
  )
  assert.deepEqual(
    getEntryIds(filterLichtwaldLogEntries(entries, { query: 'BLAUE SPIRALEN' })),
    [second.id]
  )
  assert.deepEqual(
    getEntryIds(filterLichtwaldLogEntries(entries, { query: 'prisma' })),
    [first.id]
  )
  assert.deepEqual(
    filterLichtwaldLogEntries(entries, {
      query: 'lichtwald-entry-private-id-marker',
    }),
    []
  )
  assert.deepEqual(
    filterLichtwaldLogEntries(entries, { query: 'private' }),
    []
  )
})

test('entfernt nur äußeren Query-Whitespace und bewahrt interne Spaces, Tabs und Zeilenumbrüche', () => {
  const entry = createEntry({
    text: 'Alpha  Beta\tGamma\nDelta',
  })

  assert.deepEqual(
    filterLichtwaldLogEntries([entry], { query: '  Alpha  Beta  ' }),
    [entry]
  )
  assert.deepEqual(
    filterLichtwaldLogEntries([entry], { query: '\tBeta\tGamma\n' }),
    [entry]
  )
  assert.deepEqual(
    filterLichtwaldLogEntries([entry], { query: 'Gamma\nDelta' }),
    [entry]
  )
  assert.deepEqual(
    filterLichtwaldLogEntries([entry], { query: 'Alpha Beta' }),
    []
  )
  assert.deepEqual(
    filterLichtwaldLogEntries([entry], { query: 'Beta Gamma' }),
    []
  )
})

test('vergleicht Groß- und Kleinschreibung einschließlich Ä/ä und ẞ/ß einheitlich', () => {
  const entry = createEntry({
    title: 'Ätherlaterne',
    text: 'Ein ẞymbol aus einer erfundenen Schrift.',
  })

  assert.deepEqual(
    filterLichtwaldLogEntries([entry], { query: 'äTHER' }),
    [entry]
  )
  assert.deepEqual(
    filterLichtwaldLogEntries([entry], { query: 'ßYMBOL' }),
    [entry]
  )
})

test('gleicht kanonisch äquivalente NFC-Schreibweisen an, aber entfernt keine Akzente oder Kompatibilitätsunterschiede', () => {
  const entry = createEntry({
    title: 'Cafe\u0301 im Vollmond',
    text: 'Eine Ｏｍｅｇａ-Figur im Testmodell.',
    tags: ['A\u0308ther'],
  })

  assert.deepEqual(
    filterLichtwaldLogEntries([entry], { query: 'CAFÉ' }),
    [entry]
  )
  assert.deepEqual(
    filterLichtwaldLogEntries([entry], { query: 'ÄTHER' }),
    [entry]
  )
  assert.deepEqual(
    filterLichtwaldLogEntries([entry], { query: 'cafe' }),
    []
  )
  assert.deepEqual(
    filterLichtwaldLogEntries([entry], { query: 'omega' }),
    []
  )
})

test('hält ß und ss bewusst verschieden', () => {
  const sharpS = createEntry({
    id: 'lichtwald-entry-invented-sharp-s',
    title: 'Erfundene Straße',
    text: 'Nur ein neutraler Testtext.',
    tags: ['Fluss'],
  })

  assert.deepEqual(
    filterLichtwaldLogEntries([sharpS], { query: 'straße' }),
    [sharpS]
  )
  assert.deepEqual(
    filterLichtwaldLogEntries([sharpS], { query: 'strasse' }),
    []
  )
})

test('behandelt Markup- und RegExp-Zeichen ausschließlich als literale Teilstrings', () => {
  const literal = createEntry({
    id: 'lichtwald-entry-invented-literals',
    title: 'Sichtbares <script>-Fragment',
    text: 'Die Zeichen .* und ? bleiben vollständig literal.',
    tags: ['[]'],
  })
  const ordinary = createEntry({
    id: 'lichtwald-entry-invented-ordinary',
    title: 'Gewöhnlicher Testeintrag',
    text: 'Dieser Text enthält keine Suchsyntax.',
    tags: ['Neutral'],
  })

  for (const query of ['<script>', '.*', '?', '[]']) {
    assert.deepEqual(
      filterLichtwaldLogEntries([ordinary, literal], { query }),
      [literal]
    )
  }
})

test('filtert Kalenderdaten exakt einschließlich Schaltjahr und Jahresgrenzen', () => {
  const firstYear = createEntry({
    id: 'lichtwald-entry-invented-first-year',
    calendarDate: '0001-01-01',
  })
  const leapDay = createEntry({
    id: 'lichtwald-entry-invented-leap-day',
    calendarDate: '2000-02-29',
  })
  const lastYear = createEntry({
    id: 'lichtwald-entry-invented-last-year',
    calendarDate: '9999-12-31',
  })
  const entries = [firstYear, leapDay, lastYear]

  assert.deepEqual(
    filterLichtwaldLogEntries(entries, { calendarDate: '' }),
    entries
  )
  assert.deepEqual(
    filterLichtwaldLogEntries(entries, { calendarDate: '0001-01-01' }),
    [firstYear]
  )
  assert.deepEqual(
    filterLichtwaldLogEntries(entries, { calendarDate: '2000-02-29' }),
    [leapDay]
  )
  assert.deepEqual(
    filterLichtwaldLogEntries(entries, { calendarDate: '9999-12-31' }),
    [lastYear]
  )
})

test('weist ungültige Kalenderdaten und typfremde Datumswerte ohne Date-Parsing oder Coercion zurück', () => {
  const entry = createEntry({ calendarDate: '2024-02-29' })
  let coercionCalls = 0
  const coercibleDate = {
    toString() {
      coercionCalls += 1
      return entry.calendarDate
    },
  }

  for (const calendarDate of [
    '0000-01-01',
    '10000-01-01',
    '1900-02-29',
    '2026-02-29',
    '2024-02-30',
    '2024-2-29',
    ' 2024-02-29 ',
    20240229,
    new Date('2024-02-29T00:00:00.000Z'),
    coercibleDate,
    null,
  ]) {
    assert.doesNotThrow(() => {
      assert.deepEqual(
        filterLichtwaldLogEntries([entry], { calendarDate }),
        []
      )
    })
  }

  assert.equal(coercionCalls, 0)
})

test('filtert Tags vollständig, NFC- und case-insensitiv statt per Teilstring', () => {
  const exact = createEntry({
    id: 'lichtwald-entry-invented-forest',
    tags: ['Wald', 'Äther'],
  })
  const longer = createEntry({
    id: 'lichtwald-entry-invented-forest-path',
    tags: ['Waldweg', 'Prisma'],
  })
  const entries = [longer, exact]

  assert.deepEqual(
    filterLichtwaldLogEntries(entries, { tag: 'wALD' }),
    [exact]
  )
  assert.deepEqual(
    filterLichtwaldLogEntries(entries, { tag: 'A\u0308THER' }),
    [exact]
  )
  assert.deepEqual(
    filterLichtwaldLogEntries(entries, { tag: ALL_LICHTWALD_LOG_TAGS }),
    entries
  )
})

test('leitet Tagoptionen NFC- und case-insensitiv mit erster Schreibweise und stabiler Reihenfolge ab', () => {
  const entries = [
    createEntry({ tags: ['Äther', 'Erste'] }),
    createEntry({
      id: 'lichtwald-entry-invented-second-tags',
      tags: ['A\u0308THER', 'ERSTE', 'Dritte'],
    }),
    createEntry({
      id: 'lichtwald-entry-invented-third-tags',
      tags: ['vierte', 'dritte'],
    }),
  ]

  const firstResult = getLichtwaldLogFilterTags(entries)
  const secondResult = getLichtwaldLogFilterTags(entries)

  assert.deepEqual(firstResult, ['Äther', 'Erste', 'Dritte', 'vierte'])
  assert.deepEqual(secondResult, firstResult)
  assert.notStrictEqual(firstResult, secondResult)
  assertDenseArray(firstResult)
})

test('kombiniert Query, Kalenderdatum und Tag mit logischem AND', () => {
  const matching = createEntry({
    id: 'lichtwald-entry-invented-and-match',
    calendarDate: '2050-06-07',
    title: 'Erfundener Funkenpfad',
    tags: ['Wald'],
  })
  const wrongDate = createEntry({
    id: 'lichtwald-entry-invented-wrong-date',
    calendarDate: '2050-06-08',
    title: 'Erfundener Funkenkreis',
    tags: ['Wald'],
  })
  const wrongTag = createEntry({
    id: 'lichtwald-entry-invented-wrong-tag',
    calendarDate: '2050-06-07',
    title: 'Erfundener Funkenbogen',
    tags: ['Komet'],
  })
  const wrongQuery = createEntry({
    id: 'lichtwald-entry-invented-wrong-query',
    calendarDate: '2050-06-07',
    title: 'Erfundener Nebelpfad',
    text: 'Eine neutrale Passage über eine imaginäre Wolke.',
    tags: ['Wald'],
  })

  assert.deepEqual(
    filterLichtwaldLogEntries(
      [wrongDate, matching, wrongTag, wrongQuery],
      {
        query: 'funken',
        calendarDate: '2050-06-07',
        tag: 'wald',
      }
    ),
    [matching]
  )
})

test('bewahrt bei Treffern exakt Snapshot-Reihenfolge und ursprüngliche Entry-Referenzen', () => {
  const first = createEntry({
    id: 'lichtwald-entry-invented-order-3',
    tags: ['Treffer'],
  })
  const second = createEntry({
    id: 'lichtwald-entry-invented-order-1',
    tags: ['Ohne'],
  })
  const third = createEntry({
    id: 'lichtwald-entry-invented-order-2',
    tags: ['TREFFER'],
  })

  const result = filterLichtwaldLogEntries(
    [first, second, third],
    { tag: 'treffer' }
  )

  assert.deepEqual(getEntryIds(result), [first.id, third.id])
  assert.strictEqual(result[0], first)
  assert.strictEqual(result[1], third)
})

test('verarbeitet 1.000 Einträge kontrolliert und in unveränderter Reihenfolge', () => {
  const entries = Array.from({ length: 1000 }, (_unused, index) =>
    createEntry({
      id: 'lichtwald-entry-invented-scale-' + String(index),
      title: index % 10 === 0
        ? 'Synthetischer Skalentreffer'
        : 'Synthetischer Skaleneintrag',
      tags: [index % 2 === 0 ? 'Gerade' : 'Ungerade'],
    })
  )

  const result = filterLichtwaldLogEntries(entries, {
    query: 'skalentreffer',
    tag: 'gerade',
  })

  assert.equal(result.length, 100)
  assert.deepEqual(
    getEntryIds(result),
    Array.from(
      { length: 100 },
      (_unused, index) => 'lichtwald-entry-invented-scale-' + String(index * 10)
    )
  )
  assert.deepEqual(getLichtwaldLogFilterTags(entries), ['Gerade', 'Ungerade'])
  assertDenseArray(result)
})

test('verändert weder Entry-, Tag-, Options- noch Containerwerte', () => {
  const entries = deepFreeze([
    createEntry(),
    createEntry({
      id: 'lichtwald-entry-invented-immutable-2',
      tags: ['Komet'],
    }),
  ])
  const options = deepFreeze({
    query: '  WALD  ',
    calendarDate: '2041-02-03',
    tag: 'wald',
  })
  const snapshot = structuredClone(entries)

  const filteredEntries = filterLichtwaldLogEntries(entries, options)
  const availableTags = getLichtwaldLogFilterTags(entries)

  assert.deepEqual(entries, snapshot)
  assert.deepEqual(options, {
    query: '  WALD  ',
    calendarDate: '2041-02-03',
    tag: 'wald',
  })
  assert.notStrictEqual(filteredEntries, entries)
  assert.strictEqual(filteredEntries[0], entries[0])
  assert.deepEqual(availableTags, ['Wald', 'Prisma', 'Komet'])

  filteredEntries.push(createEntry({ id: 'temporary-result-only-entry' }))
  availableTags.push('Nur im Ergebnis')

  assert.equal(entries.length, 2)
  assert.deepEqual(entries[0].tags, ['Wald', 'Prisma'])
})

test('liefert aus nicht-arrayförmigen Containern und malformed Kriterien kontrolliert frische leere Arrays', () => {
  const entry = createEntry()
  const malformedContainers = [undefined, null, {}, 'entries', 7, true]

  for (const container of malformedContainers) {
    const firstFiltered = filterLichtwaldLogEntries(container)
    const secondFiltered = filterLichtwaldLogEntries(container)
    const firstTags = getLichtwaldLogFilterTags(container)
    const secondTags = getLichtwaldLogFilterTags(container)

    assert.deepEqual(firstFiltered, [])
    assert.deepEqual(firstTags, [])
    assert.notStrictEqual(firstFiltered, secondFiltered)
    assert.notStrictEqual(firstTags, secondTags)
  }

  for (const options of [
    null,
    [],
    'filters',
    { query: null },
    { query: 7 },
    { calendarDate: false },
    { tag: Symbol('tag') },
  ]) {
    assert.doesNotThrow(() => {
      assert.deepEqual(filterLichtwaldLogEntries([entry], options), [])
    })
  }
})

test('liest einfache malformed Entries und Tags kontrolliert ohne String-Coercion', () => {
  let coercionCalls = 0
  const coercionTrap = {
    toString() {
      coercionCalls += 1
      return 'Treffer'
    },
  }
  const partialMatch = {
    title: 'Ein partieller Treffer',
    tags: [null, coercionTrap, 'Sicherer Tag'],
  }
  const entries = [
    null,
    7,
    {},
    { calendarDate: coercionTrap, title: null, text: false, tags: null },
    partialMatch,
  ]

  assert.doesNotThrow(() => {
    assert.deepEqual(
      filterLichtwaldLogEntries(entries, { query: 'partieller' }),
      [partialMatch]
    )
    assert.deepEqual(
      filterLichtwaldLogEntries(entries, { query: 'sicherer tag' }),
      [partialMatch]
    )
    assert.deepEqual(getLichtwaldLogFilterTags(entries), ['Sicherer Tag'])
  })
  assert.equal(coercionCalls, 0)
})

test('gibt auch für sparse Eingaben ausschließlich neue dichte Ergebnis- und Optionsarrays zurück', () => {
  const first = createEntry({
    id: 'lichtwald-entry-invented-sparse-first',
    tags: ['Erster Tag'],
  })
  const second = createEntry({
    id: 'lichtwald-entry-invented-sparse-second',
    tags: ['Zweiter Tag'],
  })
  const sparseEntries = []
  sparseEntries[1] = first
  sparseEntries[4] = second

  const filteredEntries = filterLichtwaldLogEntries(sparseEntries)
  const availableTags = getLichtwaldLogFilterTags(sparseEntries)

  assert.deepEqual(filteredEntries, [first, second])
  assert.deepEqual(availableTags, ['Erster Tag', 'Zweiter Tag'])
  assertDenseArray(filteredEntries)
  assertDenseArray(availableTags)
})

test('akzeptiert exakt 200 UTF-16-Codeeinheiten und weist 201 fail-closed zurück', () => {
  const acceptedQuery = '😀'.repeat(100)
  const rejectedQuery = acceptedQuery + 'x'
  const entry = createEntry({
    text: 'Anfang ' + rejectedQuery + ' Ende',
  })

  assert.equal(acceptedQuery.length, 200)
  assert.equal(rejectedQuery.length, 201)
  assert.deepEqual(
    filterLichtwaldLogEntries([entry], { query: acceptedQuery }),
    [entry]
  )
  assert.deepEqual(
    filterLichtwaldLogEntries([entry], { query: rejectedQuery }),
    []
  )
})

test('führt keine Service-, Storage-, DOM-, Netzwerk-, Date- oder RegExp-Logik ein', () => {
  const source = readFileSync(
    new URL(
      '../src/modules/lichtwald-log/lichtwaldLogSearch.js',
      import.meta.url
    ),
    'utf8'
  )

  for (const forbiddenPattern of [
    /\blocalStorage\b/u,
    /\bsessionStorage\b/u,
    /\bfetch\b/u,
    /\bXMLHttpRequest\b/u,
    /\bdocument\b/u,
    /\bwindow\b/u,
    /\bconsole\b/u,
    /\bnew\s+Date\b/u,
    /\bDate\.parse\b/u,
    /\bnew\s+RegExp\b/u,
  ]) {
    assert.doesNotMatch(source, forbiddenPattern)
  }

  assert.match(
    source,
    /import \{ isValidCalendarDate \} from '\.\/lichtwaldLogContract\.js'/u
  )
})
