export const LEARNING_PROGRESS_SCHEMA_VERSION = 1

export const LEARNING_PROGRESS_DATA_ORIGINS = Object.freeze([
  'synthetic',
  'private',
])

// Schema 1 kennt bewusst nur Abschluss und Wiederöffnung. Ein späteres
// chapter.started benötigt eine versionierte Änderung des Vertrags.
export const LEARNING_PROGRESS_EVENT_TYPES = Object.freeze({
  CHAPTER_COMPLETED: 'chapter.completed',
  CHAPTER_REOPENED: 'chapter.reopened',
})

export const LEARNING_PROGRESS_ERROR_CODES = Object.freeze({
  INVALID_LEARNING_PROGRESS: 'invalidLearningProgress',
  UNSUPPORTED_SCHEMA_VERSION: 'unsupportedSchemaVersion',
  INVALID_DATA_ORIGIN: 'invalidDataOrigin',
  INVALID_EVENTS: 'invalidEvents',
  INVALID_EVENT: 'invalidEvent',
  INVALID_ID: 'invalidId',
  DUPLICATE_EVENT_ID: 'duplicateEventId',
  INVALID_EVENT_TYPE: 'invalidEventType',
  INVALID_OCCURRED_AT: 'invalidOccurredAt',
})

const SUPPORTED_EVENT_TYPES = Object.freeze(
  Object.values(LEARNING_PROGRESS_EVENT_TYPES)
)

function isObjectRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isTrimmedNonEmptyString(value) {
  return typeof value === 'string' && value.length > 0 && value === value.trim()
}

function isCanonicalUtcTimestamp(value) {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
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
    LEARNING_PROGRESS_ERROR_CODES.INVALID_ID,
    path,
    'Die ID muss eine nicht leere, getrimmte Zeichenfolge sein.'
  )
  return false
}

function validateEvent(progressEvent, path, context) {
  if (validateId(progressEvent.id, `${path}.id`, context.errors)) {
    if (context.eventIds.has(progressEvent.id)) {
      addError(
        context.errors,
        LEARNING_PROGRESS_ERROR_CODES.DUPLICATE_EVENT_ID,
        `${path}.id`,
        'Ereignis-IDs müssen innerhalb des Fortschrittslogs eindeutig sein.'
      )
    } else {
      context.eventIds.add(progressEvent.id)
    }
  }

  if (!SUPPORTED_EVENT_TYPES.includes(progressEvent.type)) {
    addError(
      context.errors,
      LEARNING_PROGRESS_ERROR_CODES.INVALID_EVENT_TYPE,
      `${path}.type`,
      'Der Ereignistyp wird in dieser Schemaversion nicht unterstützt.'
    )
  }

  validateId(progressEvent.moduleId, `${path}.moduleId`, context.errors)
  validateId(progressEvent.chapterId, `${path}.chapterId`, context.errors)

  if (!isCanonicalUtcTimestamp(progressEvent.occurredAt)) {
    addError(
      context.errors,
      LEARNING_PROGRESS_ERROR_CODES.INVALID_OCCURRED_AT,
      `${path}.occurredAt`,
      'occurredAt muss ein kanonischer ISO-8601-UTC-Zeitstempel sein.'
    )
  }
}

export function validateLearningProgress(progressLog) {
  const errors = []

  if (!isObjectRecord(progressLog)) {
    addError(
      errors,
      LEARNING_PROGRESS_ERROR_CODES.INVALID_LEARNING_PROGRESS,
      '$',
      'Der LearningProgress-Log muss ein Objekt sein.'
    )
    return { ok: false, errors }
  }

  if (progressLog.schemaVersion !== LEARNING_PROGRESS_SCHEMA_VERSION) {
    addError(
      errors,
      LEARNING_PROGRESS_ERROR_CODES.UNSUPPORTED_SCHEMA_VERSION,
      '$.schemaVersion',
      'Die LearningProgress-Schemaversion wird nicht unterstützt.'
    )
  }

  if (!LEARNING_PROGRESS_DATA_ORIGINS.includes(progressLog.dataOrigin)) {
    addError(
      errors,
      LEARNING_PROGRESS_ERROR_CODES.INVALID_DATA_ORIGIN,
      '$.dataOrigin',
      'dataOrigin muss synthetic oder private sein.'
    )
  }

  if (!Array.isArray(progressLog.events)) {
    addError(
      errors,
      LEARNING_PROGRESS_ERROR_CODES.INVALID_EVENTS,
      '$.events',
      'events muss ein Array sein.'
    )
  } else {
    const context = { errors, eventIds: new Set() }

    for (let index = 0; index < progressLog.events.length; index += 1) {
      const progressEvent = progressLog.events[index]
      const eventPath = `$.events[${index}]`

      if (!isObjectRecord(progressEvent)) {
        addError(
          errors,
          LEARNING_PROGRESS_ERROR_CODES.INVALID_EVENT,
          eventPath,
          'Jedes Fortschrittsereignis muss ein Objekt sein.'
        )
        continue
      }

      validateEvent(progressEvent, eventPath, context)
    }
  }

  return errors.length === 0 ? { ok: true, errors: [] } : { ok: false, errors }
}
