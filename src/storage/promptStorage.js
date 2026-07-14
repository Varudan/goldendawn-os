export const PROMPT_STORAGE_KEY = 'goldendawn.promptVault.v1'
export const PROMPT_SCHEMA_VERSION = 2

const LEGACY_PROMPT_SCHEMA_VERSION = 1

const REQUIRED_NON_EMPTY_PROMPT_FIELDS = [
  'id',
  'title',
  'content',
  'createdAt',
  'updatedAt',
]

const REQUIRED_STRING_PROMPT_FIELDS = ['description', 'category']

const PROMPT_CONTENT_FIELDS = Object.freeze([
  'title',
  'category',
  'description',
  'content',
])

const PROMPT_VERSION_FIELDS = Object.freeze([
  'versionNumber',
  'title',
  'category',
  'description',
  'content',
  'createdAt',
  'changeType',
  'restoredFromVersion',
])

const PROMPT_VERSION_CHANGE_TYPES = new Set([
  'created',
  'migrated',
  'edited',
  'restored',
])

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

function createLoadFailure(status, code, message) {
  return {
    ...createFailure(status, code, message),
    prompts: [],
  }
}

function createValidationFailure(code, message) {
  return {
    ok: false,
    code,
    message,
  }
}

function createValidationSuccess() {
  return { ok: true }
}

function isObjectRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0
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

function validatePromptFields(
  prompt,
  {
    allowMissingFavorite = false,
    validateDemo = true,
  } = {}
) {
  if (!isObjectRecord(prompt)) {
    return createValidationFailure(
      'invalidPromptData',
      'Ein gespeicherter Prompt hat eine ungültige Struktur.'
    )
  }

  const hasFavorite = Object.prototype.hasOwnProperty.call(
    prompt,
    'isFavorite'
  )

  if (
    (!allowMissingFavorite || hasFavorite) &&
    typeof prompt.isFavorite !== 'boolean'
  ) {
    return createValidationFailure(
      'invalidPromptData',
      'Ein gespeicherter Prompt hat einen ungültigen Favoritenstatus.'
    )
  }

  if (validateDemo && typeof prompt.isDemo !== 'boolean') {
    return createValidationFailure(
      'invalidPromptData',
      'Ein gespeicherter Prompt hat eine ungültige Demo-Herkunft.'
    )
  }

  if (
    !REQUIRED_NON_EMPTY_PROMPT_FIELDS.every((field) =>
      isNonEmptyString(prompt[field])
    )
  ) {
    return createValidationFailure(
      'invalidPromptData',
      'Ein gespeicherter Prompt enthält ungültige Pflichtfelder.'
    )
  }

  if (
    !REQUIRED_STRING_PROMPT_FIELDS.every(
      (field) => typeof prompt[field] === 'string'
    )
  ) {
    return createValidationFailure(
      'invalidPromptData',
      'Ein gespeicherter Prompt enthält ungültige Textfelder.'
    )
  }

  if (prompt.id !== prompt.id.trim()) {
    return createValidationFailure(
      'invalidPromptData',
      'Eine gespeicherte Prompt-ID enthält ungültige Leerzeichen.'
    )
  }

  if (
    !isUtcIsoTimestamp(prompt.createdAt) ||
    !isUtcIsoTimestamp(prompt.updatedAt) ||
    Date.parse(prompt.updatedAt) < Date.parse(prompt.createdAt)
  ) {
    return createValidationFailure(
      'invalidPromptTimestamps',
      'Ein gespeicherter Prompt enthält ungültige Zeitstempel.'
    )
  }

  return createValidationSuccess()
}

function validateLegacyPrompt(prompt) {
  const promptValidation = validatePromptFields(prompt, {
    allowMissingFavorite: true,
    validateDemo: false,
  })

  if (!promptValidation.ok) {
    return promptValidation
  }

  const hasDemo = Object.prototype.hasOwnProperty.call(prompt, 'isDemo')

  if (hasDemo && typeof prompt.isDemo !== 'boolean') {
    return createValidationFailure(
      'invalidPromptData',
      'Ein gespeicherter Schema-1-Prompt hat eine ungültige Demo-Herkunft.'
    )
  }

  if (Object.prototype.hasOwnProperty.call(prompt, 'versions')) {
    return createValidationFailure(
      'unexpectedLegacyPromptVersions',
      'Ein gespeicherter Schema-1-Prompt enthält unerwartete Versionsdaten.'
    )
  }

  return createValidationSuccess()
}

function hasExactVersionFields(version) {
  const versionFields = Object.keys(version)

  return (
    versionFields.length === PROMPT_VERSION_FIELDS.length &&
    PROMPT_VERSION_FIELDS.every((field) =>
      Object.prototype.hasOwnProperty.call(version, field)
    )
  )
}

function validatePromptVersion(
  version,
  expectedVersionNumber,
  previousVersionNumbers
) {
  if (!isObjectRecord(version)) {
    return createValidationFailure(
      'invalidPromptVersion',
      'Eine gespeicherte Prompt-Version hat eine ungültige Struktur.'
    )
  }

  if (!hasExactVersionFields(version)) {
    return createValidationFailure(
      'invalidPromptVersionFields',
      'Eine gespeicherte Prompt-Version enthält unerwartete Felder.'
    )
  }

  if (!isPositiveInteger(version.versionNumber)) {
    return createValidationFailure(
      'invalidPromptVersionNumber',
      'Eine gespeicherte Prompt-Version hat keine positive Versionsnummer.'
    )
  }

  if (version.versionNumber !== expectedVersionNumber) {
    return createValidationFailure(
      'nonSequentialPromptVersions',
      'Die gespeicherten Prompt-Versionen sind nicht lückenlos aufsteigend.'
    )
  }

  if (
    !isNonEmptyString(version.title) ||
    typeof version.category !== 'string' ||
    typeof version.description !== 'string' ||
    !isNonEmptyString(version.content)
  ) {
    return createValidationFailure(
      'invalidPromptVersionContent',
      'Eine gespeicherte Prompt-Version enthält ungültige Inhaltsfelder.'
    )
  }

  if (!isUtcIsoTimestamp(version.createdAt)) {
    return createValidationFailure(
      'invalidPromptVersionTimestamp',
      'Eine gespeicherte Prompt-Version enthält keinen gültigen UTC-Zeitpunkt.'
    )
  }

  if (!PROMPT_VERSION_CHANGE_TYPES.has(version.changeType)) {
    return createValidationFailure(
      'invalidPromptVersionChangeType',
      'Eine gespeicherte Prompt-Version enthält einen unbekannten Änderungstyp.'
    )
  }

  if (version.changeType === 'restored') {
    if (
      !isPositiveInteger(version.restoredFromVersion) ||
      version.restoredFromVersion >= version.versionNumber ||
      !previousVersionNumbers.has(version.restoredFromVersion)
    ) {
      return createValidationFailure(
        'invalidPromptRestoredFromVersion',
        'Eine wiederhergestellte Prompt-Version verweist auf keine gültige frühere Version.'
      )
    }
  } else if (version.restoredFromVersion !== null) {
    return createValidationFailure(
      'invalidPromptRestoredFromVersion',
      'Nur wiederhergestellte Prompt-Versionen dürfen eine Ursprungsversion angeben.'
    )
  }

  return createValidationSuccess()
}

function validateSchemaTwoPrompt(prompt) {
  const promptValidation = validatePromptFields(prompt)

  if (!promptValidation.ok) {
    return promptValidation
  }

  if (!Object.prototype.hasOwnProperty.call(prompt, 'versions')) {
    return createValidationFailure(
      'missingPromptVersions',
      'Ein gespeicherter Prompt enthält keine Versionshistorie.'
    )
  }

  if (!Array.isArray(prompt.versions)) {
    return createValidationFailure(
      'invalidPromptVersions',
      'Die gespeicherte Prompt-Versionshistorie ist kein Array.'
    )
  }

  if (prompt.versions.length === 0) {
    return createValidationFailure(
      'emptyPromptVersions',
      'Die gespeicherte Prompt-Versionshistorie darf nicht leer sein.'
    )
  }

  const previousVersionNumbers = new Set()

  for (const [index, version] of prompt.versions.entries()) {
    const versionValidation = validatePromptVersion(
      version,
      index + 1,
      previousVersionNumbers
    )

    if (!versionValidation.ok) {
      return versionValidation
    }

    previousVersionNumbers.add(version.versionNumber)
  }

  const currentVersion = prompt.versions.at(-1)
  const currentContentMatches = PROMPT_CONTENT_FIELDS.every(
    (field) => currentVersion[field] === prompt[field]
  )

  if (!currentContentMatches) {
    return createValidationFailure(
      'promptVersionContentMismatch',
      'Die aktuelle Prompt-Fassung entspricht nicht der letzten Version.'
    )
  }

  return createValidationSuccess()
}

function validatePromptCollection(prompts, validatePrompt) {
  if (!Array.isArray(prompts)) {
    return createValidationFailure(
      'invalidPromptData',
      'Die gespeicherte Prompt-Liste ist kein Array.'
    )
  }

  const promptIds = new Set()

  for (const prompt of prompts) {
    const promptValidation = validatePrompt(prompt)

    if (!promptValidation.ok) {
      return promptValidation
    }

    if (promptIds.has(prompt.id)) {
      return createValidationFailure(
        'duplicatePromptId',
        'Die gespeicherte Prompt-Liste enthält doppelte IDs.'
      )
    }

    promptIds.add(prompt.id)
  }

  return createValidationSuccess()
}

function clonePrompt(prompt) {
  return {
    ...prompt,
    versions: prompt.versions.map((version) => ({ ...version })),
  }
}

function clonePrompts(prompts) {
  return prompts.map(clonePrompt)
}

function createMigratedVersion(prompt) {
  return {
    versionNumber: 1,
    title: prompt.title,
    category: prompt.category,
    description: prompt.description,
    content: prompt.content,
    createdAt: prompt.updatedAt,
    changeType: 'migrated',
    restoredFromVersion: null,
  }
}

function normalizeLegacyPrompts(prompts) {
  return prompts.map((prompt) => ({
    ...prompt,
    isFavorite: prompt.isFavorite === true,
    isDemo: prompt.isDemo === true,
    versions: [createMigratedVersion(prompt)],
  }))
}

function createStoredDataFailure(validationResult) {
  return createLoadFailure(
    'invalidStoredData',
    validationResult.code,
    validationResult.message
  )
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
      return {
        ...createAdapterUnavailableResult(),
        prompts: [],
      }
    }

    const storageResult = storageAdapter.readJson(PROMPT_STORAGE_KEY)

    if (!storageResult.ok) {
      return {
        ...storageResult,
        prompts: [],
      }
    }

    if (storageResult.status === 'missing') {
      return storageResult
    }

    if (
      storageResult.status !== 'found' ||
      !isObjectRecord(storageResult.value)
    ) {
      return createLoadFailure(
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
      return createLoadFailure(
        'invalidStoredData',
        'invalidPromptData',
        'Die gespeicherten PromptVault-Daten haben eine ungültige Struktur.'
      )
    }

    if (storedCollection.schemaVersion === LEGACY_PROMPT_SCHEMA_VERSION) {
      const validationResult = validatePromptCollection(
        storedCollection.prompts,
        validateLegacyPrompt
      )

      if (!validationResult.ok) {
        return createStoredDataFailure(validationResult)
      }

      return {
        ok: true,
        status: 'found',
        prompts: normalizeLegacyPrompts(storedCollection.prompts),
        sourceSchemaVersion: LEGACY_PROMPT_SCHEMA_VERSION,
        migrationNeeded: true,
      }
    }

    if (storedCollection.schemaVersion === PROMPT_SCHEMA_VERSION) {
      const validationResult = validatePromptCollection(
        storedCollection.prompts,
        validateSchemaTwoPrompt
      )

      if (!validationResult.ok) {
        return createStoredDataFailure(validationResult)
      }

      return {
        ok: true,
        status: 'found',
        prompts: clonePrompts(storedCollection.prompts),
        sourceSchemaVersion: PROMPT_SCHEMA_VERSION,
        migrationNeeded: false,
      }
    }

    return createLoadFailure(
      'unsupportedSchemaVersion',
      'unsupportedPromptSchemaVersion',
      'Die gespeicherte PromptVault-Version wird nicht unterstützt.'
    )
  }

  function savePromptCollection(prompts) {
    const validationResult = validatePromptCollection(
      prompts,
      validateSchemaTwoPrompt
    )

    if (!validationResult.ok) {
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
