import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import * as lichtwaldLogDemoModule from '../src/data/mock/lichtwaldLogDemo.js'
import { validateLichtwaldLog } from '../src/modules/lichtwald-log/lichtwaldLogContract.js'

const EXPECTED_ENTRY_SUMMARY = Object.freeze([
  Object.freeze({
    id: 'lichtwald-demo-entry-aether-prisma',
    calendarDate: '2034-05-20',
    title: '[Demo] Ätherprisma im Wolkenarchiv',
    tags: Object.freeze(['Äther', 'Wald', 'Erfunden']),
  }),
  Object.freeze({
    id: 'lichtwald-demo-entry-mondglas-wegweiser',
    calendarDate: '2034-05-20',
    title: '[Demo] Wegweiser aus Mondglas',
    tags: Object.freeze(['Waldweg', 'Mondglas', 'Erfunden']),
  }),
  Object.freeze({
    id: 'lichtwald-demo-entry-sternenbluete',
    calendarDate: '2034-06-03',
    title: '[Demo] Mechanische Sternenblüte',
    tags: Object.freeze(['Klanggarten', 'Wald', 'Erfunden']),
  }),
  Object.freeze({
    id: 'lichtwald-demo-entry-klangpost',
    calendarDate: '2034-07-14',
    title: '[Demo] Klangpost aus dem Nordlichtlabor',
    tags: Object.freeze(['Nordlicht', 'Klangkarte', 'Erfunden']),
  }),
  Object.freeze({
    id: 'lichtwald-demo-entry-wolkenhafen',
    calendarDate: '2035-01-09',
    title: '[Demo] Miniaturhafen über den Wolken',
    tags: Object.freeze(['Wolkenhafen', 'Papierboot', 'Erfunden']),
  }),
])

function summarizeEntries(entries) {
  return entries.map((entry) => ({
    id: entry.id,
    calendarDate: entry.calendarDate,
    title: entry.title,
    tags: [...entry.tags],
  }))
}

function assertDenseArray(arrayValue) {
  assert.equal(Array.isArray(arrayValue), true)

  for (let index = 0; index < arrayValue.length; index += 1) {
    assert.equal(Object.hasOwn(arrayValue, index), true)
  }
}

test('exportiert ausschließlich die kanonische Demo-Factory ohne Argumente', () => {
  assert.deepEqual(Object.keys(lichtwaldLogDemoModule), [
    'createLichtwaldLogDemoSnapshot',
  ])
  assert.equal(
    typeof lichtwaldLogDemoModule.createLichtwaldLogDemoSnapshot,
    'function'
  )
  assert.equal(
    lichtwaldLogDemoModule.createLichtwaldLogDemoSnapshot.length,
    0
  )
})

test('liefert exakt fünf deterministisch geordnete Schema-1-Demoeinträge', () => {
  const snapshot = lichtwaldLogDemoModule.createLichtwaldLogDemoSnapshot()

  assert.equal(snapshot.schemaVersion, 1)
  assert.equal(snapshot.dataOrigin, 'synthetic')
  assert.equal(snapshot.entries.length, 5)
  assert.deepEqual(summarizeEntries(snapshot.entries), EXPECTED_ENTRY_SUMMARY)
  assert.equal(
    snapshot.featuredEntryId,
    'lichtwald-demo-entry-aether-prisma'
  )
})

test('erfüllt den vollständigen unveränderten LichtwaldLog-Vertrag', () => {
  const snapshot = lichtwaldLogDemoModule.createLichtwaldLogDemoSnapshot()

  assert.deepEqual(validateLichtwaldLog(snapshot), {
    ok: true,
    errors: [],
  })
  assert.deepEqual(Object.keys(snapshot), [
    'schemaVersion',
    'dataOrigin',
    'featuredEntryId',
    'entries',
  ])

  snapshot.entries.forEach((entry) => {
    assert.deepEqual(Object.keys(entry), [
      'id',
      'calendarDate',
      'title',
      'text',
      'tags',
    ])
  })
})

test('verwendet eindeutige IDs, eine gültige Fokusreferenz und dichte Arrays', () => {
  const snapshot = lichtwaldLogDemoModule.createLichtwaldLogDemoSnapshot()
  const entryIds = snapshot.entries.map((entry) => entry.id)

  assert.equal(new Set(entryIds).size, 5)
  assert.equal(entryIds.includes(snapshot.featuredEntryId), true)
  assertDenseArray(snapshot.entries)
  snapshot.entries.forEach((entry) => assertDenseArray(entry.tags))
})

test('kennzeichnet jeden Titel sichtbar als Demo und nutzt nur zukünftige feste Daten', () => {
  const snapshot = lichtwaldLogDemoModule.createLichtwaldLogDemoSnapshot()

  snapshot.entries.forEach((entry) => {
    assert.equal(entry.title.startsWith('[Demo]'), true)
    assert.equal(entry.calendarDate > '2026-08-01', true)
  })
})

test('enthält die gezielten Such- und Filterkontraste', () => {
  const snapshot = lichtwaldLogDemoModule.createLichtwaldLogDemoSnapshot()
  const allTags = snapshot.entries.flatMap((entry) => entry.tags)
  const dates = snapshot.entries.map((entry) => entry.calendarDate)

  assert.equal(dates.filter((date) => date === '2034-05-20').length, 2)
  assert.equal(allTags.filter((tag) => tag === 'Erfunden').length, 5)
  assert.equal(allTags.includes('Wald'), true)
  assert.equal(allTags.includes('Waldweg'), true)
  assert.equal(allTags.includes('Äther'), true)
  assert.equal('Äther'.normalize('NFC'), 'Äther')
  assert.notEqual('A\u0308ther', 'Äther')
  assert.equal('A\u0308ther'.normalize('NFC'), 'Äther')
})

test('bietet Trefferwerte getrennt in Datum, Titel, Text und Tags', () => {
  const snapshot = lichtwaldLogDemoModule.createLichtwaldLogDemoSnapshot()

  assert.equal(
    snapshot.entries.some((entry) => entry.calendarDate === '2035-01-09'),
    true
  )
  assert.equal(
    snapshot.entries.some((entry) => entry.title.includes('Sternenblüte')),
    true
  )
  assert.equal(
    snapshot.entries.some((entry) => entry.text.includes('Papierprisma')),
    true
  )
  assert.equal(
    snapshot.entries.some((entry) => entry.tags.includes('Klangkarte')),
    true
  )
})

test('liefert bei jedem Aufruf einen vollständig tief entkoppelten Snapshot', () => {
  const firstSnapshot = lichtwaldLogDemoModule.createLichtwaldLogDemoSnapshot()
  const secondSnapshot = lichtwaldLogDemoModule.createLichtwaldLogDemoSnapshot()

  assert.deepEqual(firstSnapshot, secondSnapshot)
  assert.notStrictEqual(firstSnapshot, secondSnapshot)
  assert.notStrictEqual(firstSnapshot.entries, secondSnapshot.entries)

  firstSnapshot.entries.forEach((entry, index) => {
    assert.notStrictEqual(entry, secondSnapshot.entries[index])
    assert.notStrictEqual(entry.tags, secondSnapshot.entries[index].tags)
  })
})

test('Mutation einer Rückgabe verändert weder spätere Rückgaben noch die kanonische Quelle', () => {
  const mutatedSnapshot = lichtwaldLogDemoModule.createLichtwaldLogDemoSnapshot()

  mutatedSnapshot.featuredEntryId = null
  mutatedSnapshot.entries.reverse()
  mutatedSnapshot.entries[0].title = '[Demo] Nur die Rückgabekopie'
  mutatedSnapshot.entries[0].tags.push('NurRückgabe')

  const freshSnapshot = lichtwaldLogDemoModule.createLichtwaldLogDemoSnapshot()

  assert.deepEqual(summarizeEntries(freshSnapshot.entries), EXPECTED_ENTRY_SUMMARY)
  assert.equal(
    freshSnapshot.featuredEntryId,
    'lichtwald-demo-entry-aether-prisma'
  )
})

test('serialisiert über beliebig viele Aufrufe bytegleich und laufzeitunabhängig', () => {
  const serializedSnapshots = Array.from(
    { length: 5 },
    () => JSON.stringify(
      lichtwaldLogDemoModule.createLichtwaldLogDemoSnapshot()
    )
  )

  assert.equal(new Set(serializedSnapshots).size, 1)
})

test('enthält keine privaten Themen, realen Nutzungsdaten oder abgeleiteten Reflexionen', () => {
  const serializedSnapshot = JSON.stringify(
    lichtwaldLogDemoModule.createLichtwaldLogDemoSnapshot()
  ).toLowerCase()
  const excludedTerms = [
    'jan',
    'matcha',
    'calisthenics',
    'meditation',
    'gesundheit',
    'training',
    'ernährung',
    'weekly review',
    'airtable',
    'webhook',
  ]

  excludedTerms.forEach((excludedTerm) => {
    assert.equal(serializedSnapshot.includes(excludedTerm), false)
  })
})

test('enthält keine URLs, Binärdaten, Secrets oder lokalen Absolutpfade', () => {
  const serializedSnapshot = JSON.stringify(
    lichtwaldLogDemoModule.createLichtwaldLogDemoSnapshot()
  )
  const excludedPatterns = [
    /https?:\/\//iu,
    /(?:data|blob):/iu,
    /base64/iu,
    /api[_-]?key/iu,
    /bearer\s+/iu,
    /secret/iu,
    /token/iu,
    /[A-Za-z]:\\/u,
    /\/Users\//u,
  ]

  excludedPatterns.forEach((excludedPattern) => {
    assert.equal(excludedPattern.test(serializedSnapshot), false)
  })
})

test('Produktionsquelle verwendet keine Zeit-, Zufalls-, Storage-, DOM-, Console- oder Netzwerkquelle', async () => {
  const source = await readFile(
    new URL('../src/data/mock/lichtwaldLogDemo.js', import.meta.url),
    'utf8'
  )
  const excludedPatterns = [
    /\bnew\s+Date\b/u,
    /\bDate\s*\./u,
    /Math\.random/u,
    /randomUUID/u,
    /localStorage/u,
    /sessionStorage/u,
    /indexedDB/u,
    /\bcaches\b/u,
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
  assert.match(source, /deepFreeze\(/u)
  assert.match(source, /Object\.freeze\(/u)
})
