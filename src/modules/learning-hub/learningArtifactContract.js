export const LEARNING_ARTIFACT_SCHEMA_VERSION = 1

export const LEARNING_ARTIFACT_DATA_ORIGINS = Object.freeze([
  'synthetic',
  'private',
])

export const LEARNING_ARTIFACT_TYPES = Object.freeze({
  NOTE: 'note',
  SUMMARY: 'summary',
})

export const LEARNING_ARTIFACT_CONTENT_MAX_LENGTH = 10000

export const LEARNING_ARTIFACT_ERROR_CODES = Object.freeze({
  INVALID_LEARNING_ARTIFACT_STORE: 'invalidLearningArtifactStore',
  UNSUPPORTED_SCHEMA_VERSION: 'unsupportedSchemaVersion',
  INVALID_DATA_ORIGIN: 'invalidDataOrigin',
  INVALID_ARTIFACTS: 'invalidArtifacts',
  INVALID_ARTIFACT: 'invalidArtifact',
  UNKNOWN_PROPERTY: 'unknownProperty',
  MISSING_PROPERTY: 'missingProperty',
  INVALID_ID: 'invalidId',
  DUPLICATE_ARTIFACT_ID: 'duplicateArtifactId',
  INVALID_ARTIFACT_TYPE: 'invalidArtifactType',
  DUPLICATE_LEARNING_NODE_ARTIFACT_TYPE:
    'duplicateLearningNodeArtifactType',
  INVALID_CONTENT: 'invalidContent',
  CONTENT_TOO_LONG: 'contentTooLong',
  INVALID_CREATED_AT: 'invalidCreatedAt',
  INVALID_UPDATED_AT: 'invalidUpdatedAt',
  UPDATED_AT_BEFORE_CREATED_AT: 'updatedAtBeforeCreatedAt',
})

const SUPPORTED_ARTIFACT_TYPES = Object.freeze(
  Object.values(LEARNING_ARTIFACT_TYPES)
)

const CANONICAL_UTC_TIMESTAMP_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

const STORE_PROPERTY_NAMES = new Set([
  'schemaVersion',
  'dataOrigin',
  'artifacts',
])

const ARTIFACT_PROPERTY_NAMES = new Set([
  'id',
  'type',
  'moduleId',
  'chapterId',
  'learningNodeId',
  'content',
  'createdAt',
  'updatedAt',
])

function isObjectRecord(value) {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    return false
  }

  let prototype

  try {
    prototype = Object.getPrototypeOf(value)
  } catch {
    return false
  }

  return prototype === Object.prototype || prototype === null
}

function isTrimmedNonEmptyString(value) {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value === value.trim()
  )
}

export function isCanonicalUtcTimestamp(value) {
  if (
    typeof value !== 'string' ||
    !CANONICAL_UTC_TIMESTAMP_PATTERN.test(value)
  ) {
    return false
  }

  const timestamp = new Date(value)

  return (
    !Number.isNaN(timestamp.getTime()) &&
    timestamp.toISOString() === value
  )
}

function addError(errors, code, path, message) {
  errors.push({ code, path, message })
}

function validateId(value, path, errors) {
  if (isTrimmedNonEmptyString(value)) {
    return true
  }

  addError(
    errors,
    LEARNING_ARTIFACT_ERROR_CODES.INVALID_ID,
    path,
    'Die ID muss eine nicht leere, getrimmte Zeichenfolge sein.'
  )
  return false
}

function validateArtifactId(artifact, path, context) {
  if (!validateId(artifact.id, `${path}.id`, context.errors)) {
    return
  }

  if (context.artifactIds.has(artifact.id)) {
    addError(
      context.errors,
      LEARNING_ARTIFACT_ERROR_CODES.DUPLICATE_ARTIFACT_ID,
      `${path}.id`,
      'Artefakt-IDs müssen innerhalb des Stores eindeutig sein.'
    )
    return
  }

  context.artifactIds.add(artifact.id)
}

function validateArtifactType(artifact, path, errors) {
  if (SUPPORTED_ARTIFACT_TYPES.includes(artifact.type)) {
    return true
  }

  addError(
    errors,
    LEARNING_ARTIFACT_ERROR_CODES.INVALID_ARTIFACT_TYPE,
    `${path}.type`,
    'Der Artefakttyp wird in dieser Schemaversion nicht unterstützt.'
  )
  return false
}

function validateArtifactContent(artifact, path, errors) {
  if (!isTrimmedNonEmptyString(artifact.content)) {
    addError(
      errors,
      LEARNING_ARTIFACT_ERROR_CODES.INVALID_CONTENT,
      `${path}.content`,
      'Der Artefakttext muss eine nicht leere, getrimmte Zeichenfolge sein.'
    )
  }

  if (
    typeof artifact.content === 'string' &&
    artifact.content.length > LEARNING_ARTIFACT_CONTENT_MAX_LENGTH
  ) {
    addError(
      errors,
      LEARNING_ARTIFACT_ERROR_CODES.CONTENT_TOO_LONG,
      `${path}.content`,
      'Der Artefakttext überschreitet die zulässige Länge.'
    )
  }
}

function validateKnownProperties(value, path, propertyNames, errors) {
  Reflect.ownKeys(value).forEach((propertyName) => {
    if (
      typeof propertyName === 'string' &&
      propertyNames.has(propertyName)
    ) {
      return
    }

    addError(
      errors,
      LEARNING_ARTIFACT_ERROR_CODES.UNKNOWN_PROPERTY,
      `${path}.*`,
      'Der Vertrag enthält ein nicht unterstütztes Feld.'
    )
  })
}

function validateRequiredProperties(value, path, propertyNames, errors) {
  propertyNames.forEach((propertyName) => {
    if (Object.prototype.hasOwnProperty.call(value, propertyName)) {
      return
    }

    addError(
      errors,
      LEARNING_ARTIFACT_ERROR_CODES.MISSING_PROPERTY,
      `${path}.${propertyName}`,
      'Ein erforderliches Vertragsfeld fehlt.'
    )
  })
}

function validateArtifactTimestamps(artifact, path, errors) {
  const hasValidCreatedAt = isCanonicalUtcTimestamp(artifact.createdAt)
  const hasValidUpdatedAt = isCanonicalUtcTimestamp(artifact.updatedAt)

  if (!hasValidCreatedAt) {
    addError(
      errors,
      LEARNING_ARTIFACT_ERROR_CODES.INVALID_CREATED_AT,
      `${path}.createdAt`,
      'createdAt muss ein kanonischer ISO-8601-UTC-Zeitstempel sein.'
    )
  }

  if (!hasValidUpdatedAt) {
    addError(
      errors,
      LEARNING_ARTIFACT_ERROR_CODES.INVALID_UPDATED_AT,
      `${path}.updatedAt`,
      'updatedAt muss ein kanonischer ISO-8601-UTC-Zeitstempel sein.'
    )
  }

  if (
    hasValidCreatedAt &&
    hasValidUpdatedAt &&
    Date.parse(artifact.updatedAt) < Date.parse(artifact.createdAt)
  ) {
    addError(
      errors,
      LEARNING_ARTIFACT_ERROR_CODES.UPDATED_AT_BEFORE_CREATED_AT,
      `${path}.updatedAt`,
      'updatedAt darf nicht vor createdAt liegen.'
    )
  }
}

function validateArtifactUniqueness(
  artifact,
  path,
  context,
  hasValidType,
  hasValidLearningNodeId
) {
  if (!hasValidType || !hasValidLearningNodeId) {
    return
  }

  let artifactTypes = context.artifactTypesByLearningNodeId.get(
    artifact.learningNodeId
  )

  if (!artifactTypes) {
    artifactTypes = new Set()
    context.artifactTypesByLearningNodeId.set(
      artifact.learningNodeId,
      artifactTypes
    )
  }

  if (artifactTypes.has(artifact.type)) {
    addError(
      context.errors,
      LEARNING_ARTIFACT_ERROR_CODES
        .DUPLICATE_LEARNING_NODE_ARTIFACT_TYPE,
      `${path}.type`,
      'Pro LearningNode darf jeder Artefakttyp höchstens einmal vorkommen.'
    )
    return
  }

  artifactTypes.add(artifact.type)
}

function validateArtifact(artifact, path, context) {
  validateKnownProperties(
    artifact,
    path,
    ARTIFACT_PROPERTY_NAMES,
    context.errors
  )
  validateRequiredProperties(
    artifact,
    path,
    ARTIFACT_PROPERTY_NAMES,
    context.errors
  )
  validateArtifactId(artifact, path, context)
  const hasValidType = validateArtifactType(
    artifact,
    path,
    context.errors
  )

  validateId(artifact.moduleId, `${path}.moduleId`, context.errors)
  validateId(artifact.chapterId, `${path}.chapterId`, context.errors)
  const hasValidLearningNodeId = validateId(
    artifact.learningNodeId,
    `${path}.learningNodeId`,
    context.errors
  )

  validateArtifactUniqueness(
    artifact,
    path,
    context,
    hasValidType,
    hasValidLearningNodeId
  )
  validateArtifactContent(artifact, path, context.errors)
  validateArtifactTimestamps(artifact, path, context.errors)
}

export function validateLearningArtifactStore(artifactStore) {
  const errors = []

  if (!isObjectRecord(artifactStore)) {
    addError(
      errors,
      LEARNING_ARTIFACT_ERROR_CODES.INVALID_LEARNING_ARTIFACT_STORE,
      '$',
      'Der LearningArtifact-Store muss ein Objekt sein.'
    )
    return { ok: false, errors }
  }

  validateKnownProperties(
    artifactStore,
    '$',
    STORE_PROPERTY_NAMES,
    errors
  )
  validateRequiredProperties(
    artifactStore,
    '$',
    STORE_PROPERTY_NAMES,
    errors
  )

  if (artifactStore.schemaVersion !== LEARNING_ARTIFACT_SCHEMA_VERSION) {
    addError(
      errors,
      LEARNING_ARTIFACT_ERROR_CODES.UNSUPPORTED_SCHEMA_VERSION,
      '$.schemaVersion',
      'Die LearningArtifact-Schemaversion wird nicht unterstützt.'
    )
  }

  if (!LEARNING_ARTIFACT_DATA_ORIGINS.includes(artifactStore.dataOrigin)) {
    addError(
      errors,
      LEARNING_ARTIFACT_ERROR_CODES.INVALID_DATA_ORIGIN,
      '$.dataOrigin',
      'dataOrigin muss synthetic oder private sein.'
    )
  }

  if (!Array.isArray(artifactStore.artifacts)) {
    addError(
      errors,
      LEARNING_ARTIFACT_ERROR_CODES.INVALID_ARTIFACTS,
      '$.artifacts',
      'artifacts muss ein Array sein.'
    )
  } else {
    const context = {
      errors,
      artifactIds: new Set(),
      artifactTypesByLearningNodeId: new Map(),
    }

    for (let index = 0; index < artifactStore.artifacts.length; index += 1) {
      const artifact = artifactStore.artifacts[index]
      const artifactPath = `$.artifacts[${index}]`

      if (!isObjectRecord(artifact)) {
        addError(
          errors,
          LEARNING_ARTIFACT_ERROR_CODES.INVALID_ARTIFACT,
          artifactPath,
          'Jedes LearningArtifact muss ein Objekt sein.'
        )
        continue
      }

      validateArtifact(artifact, artifactPath, context)
    }
  }

  return errors.length === 0 ? { ok: true, errors: [] } : { ok: false, errors }
}
