import { PROMPT_SEED_DATA } from '../modules/prompt-vault/promptSeedData.js'

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

export function createPromptService({
  promptStorage,
} = {}) {
  function loadPrompts() {
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

    const initialPrompts = clonePrompts(PROMPT_SEED_DATA)
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

  return Object.freeze({
    loadPrompts,
    deletePrompt,
  })
}
