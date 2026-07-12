export const PROMPT_STORAGE_KEY = 'goldendawn.promptVault.v1'
export const PROMPT_SCHEMA_VERSION = 1

const REQUIRED_NON_EMPTY_PROMPT_FIELDS = [
  'id',
  'title',
  'content',
  'createdAt',
  'updatedAt',
]

const REQUIRED_STRING_PROMPT_FIELDS = ['description', 'category']

function createFailure(status, code, message) {
  return {
    ok: false,
    status,
    error: {
      code,
      message,
    },
  }
}

function isObjectRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function isUtcIsoTimestamp(value) {
  if (!isNonEmptyString(value)) {
    return false
  }

  const isoMatch = value.match(
    /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,3}))?Z$/
  )

  if (!isoMatch) {
    return false
  }

  const [, dateAndTime, fractionalSeconds = ''] = isoMatch
  const normalizedValue = `${dateAndTime}.${fractionalSeconds.padEnd(3, '0')}Z`
  const timestamp = new Date(value)

  return (
    !Number.isNaN(timestamp.getTime()) &&
    timestamp.toISOString() === normalizedValue
  )
}

function isValidPrompt(prompt, { allowMissingFavorite = false } = {}) {
  if (!isObjectRecord(prompt)) {
    return false
  }

  const hasFavorite = Object.prototype.hasOwnProperty.call(
    prompt,
    'isFavorite'
  )

  if (
    (!allowMissingFavorite || hasFavorite) &&
    typeof prompt.isFavorite !== 'boolean'
  ) {
    return false
  }

  if (
    !REQUIRED_NON_EMPTY_PROMPT_FIELDS.every((field) =>
      isNonEmptyString(prompt[field])
    )
  ) {
    return false
  }

  if (
    !REQUIRED_STRING_PROMPT_FIELDS.every(
      (field) => typeof prompt[field] === 'string'
    )
  ) {
    return false
  }

  if (prompt.id !== prompt.id.trim()) {
    return false
  }

  if (
    !isUtcIsoTimestamp(prompt.createdAt) ||
    !isUtcIsoTimestamp(prompt.updatedAt)
  ) {
    return false
  }

  return Date.parse(prompt.updatedAt) >= Date.parse(prompt.createdAt)
}

function isValidPromptCollection(prompts, validationOptions) {
  if (!Array.isArray(prompts)) {
    return false
  }

  const promptIds = new Set()

  for (const prompt of prompts) {
    if (
      !isValidPrompt(prompt, validationOptions) ||
      promptIds.has(prompt.id)
    ) {
      return false
    }

    promptIds.add(prompt.id)
  }

  return true
}

function clonePrompts(prompts) {
  return prompts.map((prompt) => ({ ...prompt }))
}

function normalizeStoredPrompts(prompts) {
  return prompts.map((prompt) => ({
    ...prompt,
    isFavorite: prompt.isFavorite === true,
  }))
}

function createAdapterUnavailableResult() {
  return createFailure(
    'unavailable',
    'storageAdapterUnavailable',
    'Der Storage-Adapter ist nicht verfügbar.'
  )
}

export function createPromptStorage(storageAdapter) {
  function loadPromptCollection() {
    if (typeof storageAdapter?.readJson !== 'function') {
      return createAdapterUnavailableResult()
    }

    const storageResult = storageAdapter.readJson(PROMPT_STORAGE_KEY)

    if (!storageResult.ok || storageResult.status === 'missing') {
      return storageResult
    }

    if (
      storageResult.status !== 'found' ||
      !isObjectRecord(storageResult.value)
    ) {
      return createFailure(
        'invalidStoredData',
        'invalidPromptData',
        'Die gespeicherten PromptVault-Daten haben eine ungültige Struktur.'
      )
    }

    const storedCollection = storageResult.value

    if (
      !Object.prototype.hasOwnProperty.call(
        storedCollection,
        'schemaVersion'
      )
    ) {
      return createFailure(
        'invalidStoredData',
        'invalidPromptData',
        'Die gespeicherten PromptVault-Daten haben eine ungültige Struktur.'
      )
    }

    if (storedCollection.schemaVersion !== PROMPT_SCHEMA_VERSION) {
      return createFailure(
        'unsupportedSchemaVersion',
        'unsupportedPromptSchemaVersion',
        'Die gespeicherte PromptVault-Version wird nicht unterstützt.'
      )
    }

    if (
      !isValidPromptCollection(storedCollection.prompts, {
        allowMissingFavorite: true,
      })
    ) {
      return createFailure(
        'invalidStoredData',
        'invalidPromptData',
        'Die gespeicherten PromptVault-Daten haben eine ungültige Struktur.'
      )
    }

    return {
      ok: true,
      status: 'found',
      prompts: normalizeStoredPrompts(storedCollection.prompts),
    }
  }

  function savePromptCollection(prompts) {
    if (!isValidPromptCollection(prompts)) {
      return createFailure(
        'validationFailed',
        'invalidPromptCollection',
        'Die Prompt-Liste kann in dieser Form nicht gespeichert werden.'
      )
    }

    if (typeof storageAdapter?.writeJson !== 'function') {
      return createAdapterUnavailableResult()
    }

    return storageAdapter.writeJson(PROMPT_STORAGE_KEY, {
      schemaVersion: PROMPT_SCHEMA_VERSION,
      prompts: clonePrompts(prompts),
    })
  }

  return Object.freeze({
    loadPromptCollection,
    savePromptCollection,
  })
}
