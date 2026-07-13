import { PROMPT_SEED_DATA } from '../modules/prompt-vault/promptSeedData.js'

const PROMPT_INPUT_LIMITS = Object.freeze({
  title: 120,
  category: 60,
  description: 240,
  content: 10000,
})

const PROMPT_EDITABLE_FIELDS = Object.freeze([
  'title',
  'category',
  'description',
  'content',
])

const MAX_ID_GENERATION_ATTEMPTS = 5

function clonePrompts(prompts) {
  return prompts.map((prompt) => ({ ...prompt }))
}

function createFailure(status, code, message, prompts = []) {
  return {
    ok: false,
    status,
    prompts: clonePrompts(prompts),
    error: {
      code,
      message,
    },
  }
}

function createInputFailure(fieldErrors, prompts = []) {
  return {
    ok: false,
    status: 'validationFailed',
    prompts: clonePrompts(prompts),
    error: {
      code: 'invalidPromptInput',
      message: 'Bitte korrigiere die markierten Felder.',
      fieldErrors: { ...fieldErrors },
    },
  }
}

function forwardFailure(result, prompts = []) {
  if (result?.error?.code && result?.error?.message) {
    return {
      ok: false,
      status: result.status ?? 'storageFailed',
      prompts: clonePrompts(prompts),
      error: { ...result.error },
    }
  }

  return createFailure(
    'storageFailed',
    'unexpectedStorageResult',
    'Die PromptVault-Daten konnten nicht verarbeitet werden.',
    prompts
  )
}

function isValidPromptId(promptId) {
  return (
    typeof promptId === 'string' &&
    promptId.trim().length > 0 &&
    promptId === promptId.trim()
  )
}

function isObjectRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validatePromptInput(input) {
  const promptInput = isObjectRecord(input) ? input : {}
  const fieldErrors = {}
  const title =
    typeof promptInput.title === 'string' ? promptInput.title.trim() : ''
  const content =
    typeof promptInput.content === 'string' ? promptInput.content.trim() : ''
  let category = ''
  let description = ''

  if (!title) {
    fieldErrors.title = 'Bitte gib einen Titel ein.'
  } else if (title.length > PROMPT_INPUT_LIMITS.title) {
    fieldErrors.title =
      'Der Titel darf höchstens 120 Zeichen lang sein.'
  }

  if (promptInput.category != null) {
    if (typeof promptInput.category !== 'string') {
      fieldErrors.category = 'Die Kategorie muss als Text angegeben werden.'
    } else {
      category = promptInput.category.trim()

      if (category.length > PROMPT_INPUT_LIMITS.category) {
        fieldErrors.category =
          'Die Kategorie darf höchstens 60 Zeichen lang sein.'
      }
    }
  }

  if (promptInput.description != null) {
    if (typeof promptInput.description !== 'string') {
      fieldErrors.description =
        'Die Beschreibung muss als Text angegeben werden.'
    } else {
      description = promptInput.description.trim()

      if (description.length > PROMPT_INPUT_LIMITS.description) {
        fieldErrors.description =
          'Die Beschreibung darf höchstens 240 Zeichen lang sein.'
      }
    }
  }

  if (!content) {
    fieldErrors.content = 'Bitte gib einen Prompt-Text ein.'
  } else if (content.length > PROMPT_INPUT_LIMITS.content) {
    fieldErrors.content =
      'Der Prompt-Text darf höchstens 10.000 Zeichen lang sein.'
  }

  return {
    values: {
      title,
      category,
      description,
      content,
    },
    fieldErrors,
  }
}

function generateDefaultPromptId() {
  if (typeof globalThis.crypto?.randomUUID !== 'function') {
    throw new Error('randomUUID unavailable')
  }

  return `prompt-${globalThis.crypto.randomUUID()}`
}

function getDefaultCurrentDate() {
  return new Date()
}

function generateUniquePromptId(generatePromptId, prompts) {
  const promptIds = new Set(prompts.map((prompt) => prompt.id))

  for (
    let attempt = 0;
    attempt < MAX_ID_GENERATION_ATTEMPTS;
    attempt += 1
  ) {
    let promptId

    try {
      promptId = generatePromptId()
    } catch {
      continue
    }

    if (isValidPromptId(promptId) && !promptIds.has(promptId)) {
      return promptId
    }
  }

  return null
}

function createUtcTimestamp(getCurrentDate) {
  try {
    const currentDate = getCurrentDate()
    const date =
      currentDate instanceof Date ? currentDate : new Date(currentDate)

    if (Number.isNaN(date.getTime())) {
      return null
    }

    return date.toISOString()
  } catch {
    return null
  }
}

function createPromptUpdateTimestamp(getCurrentDate, currentPrompt) {
  const timestamp = createUtcTimestamp(getCurrentDate)

  if (
    !timestamp ||
    Date.parse(timestamp) < Date.parse(currentPrompt.createdAt) ||
    Date.parse(timestamp) < Date.parse(currentPrompt.updatedAt)
  ) {
    return null
  }

  return timestamp
}

function hasPromptContentChanged(currentPrompt, promptValues) {
  return PROMPT_EDITABLE_FIELDS.some(
    (field) => currentPrompt[field] !== promptValues[field]
  )
}

export function createPromptService({
  promptStorage,
  generatePromptId = generateDefaultPromptId,
  getCurrentDate = getDefaultCurrentDate,
} = {}) {
  function readPromptCollectionState() {
    if (typeof promptStorage?.loadPromptCollection !== 'function') {
      return createFailure(
        'unavailable',
        'promptStorageUnavailable',
        'Der Prompt-Speicher ist nicht verfügbar.'
      )
    }

    const loadResult = promptStorage.loadPromptCollection()

    if (!loadResult.ok) {
      return forwardFailure(loadResult)
    }

    if (loadResult.status === 'found') {
      if (!Array.isArray(loadResult.prompts)) {
        return createFailure(
          'storageFailed',
          'unexpectedStorageResult',
          'Die PromptVault-Daten konnten nicht verarbeitet werden.'
        )
      }

      return {
        ok: true,
        status: 'found',
        prompts: clonePrompts(loadResult.prompts),
      }
    }

    if (loadResult.status !== 'missing') {
      return createFailure(
        'storageFailed',
        'unexpectedStorageResult',
        'Die PromptVault-Daten konnten nicht verarbeitet werden.'
      )
    }

    return {
      ok: true,
      status: 'missing',
      prompts: clonePrompts(PROMPT_SEED_DATA),
    }
  }

  function loadPrompts() {
    const loadResult = readPromptCollectionState()

    if (!loadResult.ok) {
      return loadResult
    }

    if (loadResult.status === 'found') {
      return {
        ok: true,
        status: 'loaded',
        initialized: false,
        prompts: clonePrompts(loadResult.prompts),
      }
    }

    if (loadResult.status !== 'missing') {
      return createFailure(
        'storageFailed',
        'unexpectedStorageResult',
        'Die PromptVault-Daten konnten nicht verarbeitet werden.'
      )
    }

    if (typeof promptStorage.savePromptCollection !== 'function') {
      return createFailure(
        'unavailable',
        'promptStorageUnavailable',
        'Der Prompt-Speicher ist nicht verfügbar.'
      )
    }

    const initialPrompts = clonePrompts(loadResult.prompts)
    const saveResult = promptStorage.savePromptCollection(initialPrompts)

    if (!saveResult.ok) {
      return forwardFailure(saveResult)
    }

    return {
      ok: true,
      status: 'initialized',
      initialized: true,
      prompts: clonePrompts(initialPrompts),
    }
  }

  function createPrompt(input) {
    const validationResult = validatePromptInput(input)

    if (Object.keys(validationResult.fieldErrors).length > 0) {
      return createInputFailure(validationResult.fieldErrors)
    }

    const loadResult = loadPrompts()

    if (!loadResult.ok) {
      return loadResult
    }

    if (typeof promptStorage?.savePromptCollection !== 'function') {
      return createFailure(
        'unavailable',
        'promptStorageUnavailable',
        'Der Prompt-Speicher ist nicht verfügbar.',
        loadResult.prompts
      )
    }

    const promptId = generateUniquePromptId(
      generatePromptId,
      loadResult.prompts
    )

    if (!promptId) {
      return createFailure(
        'generationFailed',
        'promptIdGenerationFailed',
        'Der Prompt konnte nicht für die lokale Speicherung vorbereitet werden.',
        loadResult.prompts
      )
    }

    const timestamp = createUtcTimestamp(getCurrentDate)

    if (!timestamp) {
      return createFailure(
        'generationFailed',
        'promptTimestampGenerationFailed',
        'Der Prompt konnte nicht für die lokale Speicherung vorbereitet werden.',
        loadResult.prompts
      )
    }

    const newPrompt = {
      id: promptId,
      ...validationResult.values,
      createdAt: timestamp,
      updatedAt: timestamp,
      isFavorite: false,
      isDemo: false,
    }
    const updatedPrompts = [newPrompt, ...loadResult.prompts]
    const saveResult = promptStorage.savePromptCollection(updatedPrompts)

    if (!saveResult.ok) {
      return forwardFailure(saveResult, loadResult.prompts)
    }

    return {
      ok: true,
      status: 'created',
      createdPrompt: { ...newPrompt },
      prompts: clonePrompts(updatedPrompts),
    }
  }

  function deletePrompt(promptId) {
    if (!isValidPromptId(promptId)) {
      return createFailure(
        'validationFailed',
        'invalidPromptId',
        'Für das Löschen wird eine gültige Prompt-ID benötigt.'
      )
    }

    const loadResult = loadPrompts()

    if (!loadResult.ok) {
      return loadResult
    }

    const promptExists = loadResult.prompts.some(
      (prompt) => prompt.id === promptId
    )

    if (!promptExists) {
      return createFailure(
        'notFound',
        'promptNotFound',
        'Der angeforderte Prompt wurde nicht gefunden.',
        loadResult.prompts
      )
    }

    const remainingPrompts = loadResult.prompts.filter(
      (prompt) => prompt.id !== promptId
    )
    const saveResult = promptStorage.savePromptCollection(remainingPrompts)

    if (!saveResult.ok) {
      return forwardFailure(saveResult, loadResult.prompts)
    }

    return {
      ok: true,
      status: 'deleted',
      deletedPromptId: promptId,
      prompts: clonePrompts(remainingPrompts),
    }
  }

  function setPromptFavorite(promptId, isFavorite) {
    if (!isValidPromptId(promptId)) {
      return createFailure(
        'validationFailed',
        'invalidPromptId',
        'Für die Favoritenmarkierung wird eine gültige Prompt-ID benötigt.'
      )
    }

    if (typeof isFavorite !== 'boolean') {
      return createFailure(
        'validationFailed',
        'invalidPromptFavoriteValue',
        'Der Favoritenstatus muss als Wahrheitswert angegeben werden.'
      )
    }

    const loadResult = loadPrompts()

    if (!loadResult.ok) {
      return loadResult
    }

    const promptIndex = loadResult.prompts.findIndex(
      (prompt) => prompt.id === promptId
    )

    if (promptIndex === -1) {
      return createFailure(
        'notFound',
        'promptNotFound',
        'Der angeforderte Prompt wurde nicht gefunden.',
        loadResult.prompts
      )
    }

    const currentPrompt = loadResult.prompts[promptIndex]

    if (currentPrompt.isFavorite === isFavorite) {
      return {
        ok: true,
        status: 'favoriteUpdated',
        favoriteChanged: false,
        updatedPrompt: { ...currentPrompt },
        prompts: clonePrompts(loadResult.prompts),
      }
    }

    if (typeof promptStorage?.savePromptCollection !== 'function') {
      return createFailure(
        'unavailable',
        'promptStorageUnavailable',
        'Der Prompt-Speicher ist nicht verfügbar.',
        loadResult.prompts
      )
    }

    const timestamp = createPromptUpdateTimestamp(
      getCurrentDate,
      currentPrompt
    )

    if (!timestamp) {
      return createFailure(
        'generationFailed',
        'promptTimestampGenerationFailed',
        'Der Prompt konnte nicht für die lokale Speicherung vorbereitet werden.',
        loadResult.prompts
      )
    }

    const updatedPrompt = {
      ...currentPrompt,
      isFavorite,
      updatedAt: timestamp,
    }
    const updatedPrompts = loadResult.prompts.map((prompt, index) =>
      index === promptIndex ? updatedPrompt : prompt
    )
    const saveResult = promptStorage.savePromptCollection(updatedPrompts)

    if (!saveResult.ok) {
      return forwardFailure(saveResult, loadResult.prompts)
    }

    return {
      ok: true,
      status: 'favoriteUpdated',
      favoriteChanged: true,
      updatedPrompt: { ...updatedPrompt },
      prompts: clonePrompts(updatedPrompts),
    }
  }

  function updatePrompt(promptId, input) {
    if (!isValidPromptId(promptId)) {
      return createFailure(
        'validationFailed',
        'invalidPromptId',
        'Für das Bearbeiten wird eine gültige Prompt-ID benötigt.'
      )
    }

    const validationResult = validatePromptInput(input)
    const loadResult = readPromptCollectionState()

    if (!loadResult.ok) {
      return loadResult
    }

    if (Object.keys(validationResult.fieldErrors).length > 0) {
      return createInputFailure(
        validationResult.fieldErrors,
        loadResult.prompts
      )
    }

    const promptIndex = loadResult.prompts.findIndex(
      (prompt) => prompt.id === promptId
    )

    if (promptIndex === -1) {
      return createFailure(
        'notFound',
        'promptNotFound',
        'Der angeforderte Prompt wurde nicht gefunden.',
        loadResult.prompts
      )
    }

    const currentPrompt = loadResult.prompts[promptIndex]

    if (
      !hasPromptContentChanged(currentPrompt, validationResult.values)
    ) {
      return {
        ok: true,
        status: 'updated',
        promptChanged: false,
        updatedPrompt: { ...currentPrompt },
        prompts: clonePrompts(loadResult.prompts),
      }
    }

    if (typeof promptStorage?.savePromptCollection !== 'function') {
      return createFailure(
        'unavailable',
        'promptStorageUnavailable',
        'Der Prompt-Speicher ist nicht verfügbar.',
        loadResult.prompts
      )
    }

    const timestamp = createPromptUpdateTimestamp(
      getCurrentDate,
      currentPrompt
    )

    if (!timestamp) {
      return createFailure(
        'generationFailed',
        'promptTimestampGenerationFailed',
        'Der Prompt konnte nicht für die lokale Speicherung vorbereitet werden.',
        loadResult.prompts
      )
    }

    const updatedPrompt = {
      ...currentPrompt,
      ...validationResult.values,
      updatedAt: timestamp,
    }
    const updatedPrompts = loadResult.prompts.map((prompt, index) =>
      index === promptIndex ? updatedPrompt : prompt
    )
    const saveResult = promptStorage.savePromptCollection(updatedPrompts)

    if (!saveResult.ok) {
      return forwardFailure(saveResult, loadResult.prompts)
    }

    return {
      ok: true,
      status: 'updated',
      promptChanged: true,
      updatedPrompt: { ...updatedPrompt },
      prompts: clonePrompts(updatedPrompts),
    }
  }

  return Object.freeze({
    loadPrompts,
    createPrompt,
    deletePrompt,
    setPromptFavorite,
    updatePrompt,
  })
}
