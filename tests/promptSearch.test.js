import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ALL_CATEGORIES,
  filterPrompts,
} from '../src/modules/prompt-vault/promptSearch.js'

const prompts = Object.freeze([
  Object.freeze({
    id: 'prompt-learning-001',
    title: 'Lernstoff verständlich erklären',
    category: 'Lernen',
    description: 'Ein Leitfaden für anschauliche Erklärungen.',
    content: 'Erkläre das Thema mit einem konkreten Beispiel.',
    isFavorite: true,
  }),
  Object.freeze({
    id: 'prompt-automation-001',
    title: 'Automatisierung planen',
    category: 'Automatisierung',
    description: 'Sichere Abläufe und kontrollierte Fehlerpfade entwerfen.',
    content: 'Beschreibe Auslöser, Verarbeitung und erwartete Ausgaben.',
    isFavorite: false,
  }),
  Object.freeze({
    id: 'prompt-reflection-001',
    title: 'Wochenrückblick',
    category: 'Reflexion',
    description: 'Fortschritte und offene Entscheidungen reflektieren.',
    content: 'Leite höchstens drei konkrete nächste Schritte ab.',
    isFavorite: true,
  }),
  Object.freeze({
    id: 'prompt-without-optional-fields',
    title: 'Minimaler Prompt',
    content: 'Fasse das Ergebnis kompakt zusammen.',
  }),
])

function getPromptIds(filteredPrompts) {
  return filteredPrompts.map(({ id }) => id)
}

test('liefert bei leerer Suche alle Prompts in ihrer bisherigen Reihenfolge', () => {
  assert.deepEqual(filterPrompts(prompts, { query: '' }), [...prompts])
  assert.deepEqual(filterPrompts(prompts, { query: '   ' }), [...prompts])
  assert.deepEqual(filterPrompts(prompts), [...prompts])
})

test('findet Suchbegriffe in Titel, Kategorie, Beschreibung und Prompt-Text', () => {
  assert.deepEqual(getPromptIds(filterPrompts(prompts, { query: 'Lernstoff' })), [
    'prompt-learning-001',
  ])
  assert.deepEqual(getPromptIds(filterPrompts(prompts, { query: 'Reflexion' })), [
    'prompt-reflection-001',
  ])
  assert.deepEqual(
    getPromptIds(filterPrompts(prompts, { query: 'Fehlerpfade' })),
    ['prompt-automation-001']
  )
  assert.deepEqual(
    getPromptIds(filterPrompts(prompts, { query: 'drei konkrete nächste' })),
    ['prompt-reflection-001']
  )
})

test('ignoriert Groß- und Kleinschreibung sowie äußere Leerzeichen der Suche', () => {
  assert.deepEqual(
    getPromptIds(filterPrompts(prompts, { query: '  ERWARTETE AUSGABEN  ' })),
    ['prompt-automation-001']
  )
})

test('behandelt fehlende optionale Textfelder sicher', () => {
  assert.deepEqual(
    getPromptIds(filterPrompts(prompts, { query: 'kompakt zusammen' })),
    ['prompt-without-optional-fields']
  )
  assert.doesNotThrow(() =>
    filterPrompts(prompts, { query: 'nicht vorhanden' })
  )
})

test('filtert nach einer konkreten Kategorie oder zeigt alle Kategorien', () => {
  assert.deepEqual(
    getPromptIds(filterPrompts(prompts, { category: 'Lernen' })),
    ['prompt-learning-001']
  )
  assert.deepEqual(
    filterPrompts(prompts, { category: ALL_CATEGORIES }),
    [...prompts]
  )
})

test('zeigt im Favoritenfilter ausschließlich explizite Favoriten', () => {
  assert.deepEqual(
    getPromptIds(filterPrompts(prompts, { favoritesOnly: true })),
    ['prompt-learning-001', 'prompt-reflection-001']
  )
  assert.deepEqual(filterPrompts(prompts, { favoritesOnly: false }), [
    ...prompts,
  ])
})

test('kombiniert Suchtext, Kategorie und Favoritenfilter', () => {
  assert.deepEqual(
    getPromptIds(
      filterPrompts(prompts, {
        query: 'konkrete',
        category: 'Reflexion',
        favoritesOnly: true,
      })
    ),
    ['prompt-reflection-001']
  )

  assert.deepEqual(
    filterPrompts(prompts, {
      query: 'höchstens',
      category: 'Lernen',
      favoritesOnly: true,
    }),
    []
  )
})

test('liefert ohne Treffer ein leeres Array', () => {
  assert.deepEqual(filterPrompts(prompts, { query: 'nicht vorhanden' }), [])
})

test('verändert weder Eingabearray noch Prompt-Objekte', () => {
  const originalPromptReferences = [...prompts]
  const snapshot = structuredClone(prompts)

  const result = filterPrompts(prompts, {
    query: 'prompt',
    favoritesOnly: false,
  })

  assert.deepEqual(prompts, snapshot)
  assert.deepEqual([...prompts], originalPromptReferences)
  assert.ok(
    prompts.every(
      (prompt, index) => prompt === originalPromptReferences[index]
    )
  )
  assert.ok(result.every((prompt) => prompts.includes(prompt)))
})
