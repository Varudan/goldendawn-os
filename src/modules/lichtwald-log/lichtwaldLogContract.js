export const LICHTWALD_LOG_SCHEMA_VERSION = 1

export const LICHTWALD_LOG_DATA_ORIGINS = Object.freeze([
  'synthetic',
  'private',
])

export const LICHTWALD_LOG_MAX_ENTRY_COUNT = 1000
export const LICHTWALD_LOG_ID_MAX_LENGTH = 100
export const LICHTWALD_LOG_TITLE_MAX_LENGTH = 120
export const LICHTWALD_LOG_TEXT_MAX_LENGTH = 10000
export const LICHTWALD_LOG_MAX_TAG_COUNT = 8
export const LICHTWALD_LOG_TAG_MAX_LENGTH = 30

export const LICHTWALD_LOG_ERROR_CODES = Object.freeze({
  INVALID_LICHTWALD_LOG: 'invalidLichtwaldLog',
  UNSUPPORTED_SCHEMA_VERSION: 'unsupportedSchemaVersion',
  INVALID_DATA_ORIGIN: 'invalidDataOrigin',
  INVALID_ENTRIES: 'invalidEntries',
  ENTRY_LIMIT_EXCEEDED: 'entryLimitExceeded',
  INVALID_ENTRY: 'invalidEntry',
  UNKNOWN_PROPERTY: 'unknownProperty',
  MISSING_PROPERTY: 'missingProperty',
  INVALID_ID: 'invalidId',
  ID_TOO_LONG: 'idTooLong',
  DUPLICATE_ENTRY_ID: 'duplicateEntryId',
  INVALID_CALENDAR_DATE: 'invalidCalendarDate',
  INVALID_TITLE: 'invalidTitle',
  TITLE_TOO_LONG: 'titleTooLong',
  INVALID_TEXT: 'invalidText',
  TEXT_TOO_LONG: 'textTooLong',
  INVALID_TAGS: 'invalidTags',
  TAG_LIMIT_EXCEEDED: 'tagLimitExceeded',
  INVALID_TAG: 'invalidTag',
  TAG_TOO_LONG: 'tagTooLong',
  DUPLICATE_TAG: 'duplicateTag',
  FEATURED_ENTRY_NOT_FOUND: 'featuredEntryNotFound',
})

const LOG_PROPERTY_NAMES = Object.freeze([
  'schemaVersion',
  'dataOrigin',
  'featuredEntryId',
  'entries',
])

const ENTRY_PROPERTY_NAMES = Object.freeze([
  'id',
  'calendarDate',
  'title',
  'text',
  'tags',
])

const LOG_PROPERTY_NAME_SET = new Set(LOG_PROPERTY_NAMES)
const ENTRY_PROPERTY_NAME_SET = new Set(ENTRY_PROPERTY_NAMES)
const CALENDAR_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

function isArray(value) {
  try {
    return Array.isArray(value)
  } catch {
    return false
  }
}

function isObjectRecord(value) {
  if (typeof value !== 'object' || value === null || isArray(value)) {
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

function addError(errors, code, path, message) {
  errors.push({ code, path, message })
}

function readProperty(value, propertyName) {
  try {
    return value[propertyName]
  } catch {
    return undefined
  }
}

function readArrayLength(value) {
  try {
    const length = value.length

    return Number.isSafeInteger(length) && length >= 0 ? length : null
  } catch {
    return null
  }
}

function readArrayEntry(value, index) {
  try {
    if (!Object.prototype.hasOwnProperty.call(value, index)) {
      return { ok: false, value: undefined }
    }

    return { ok: true, value: value[index] }
  } catch {
    return { ok: false, value: undefined }
  }
}

function validateObjectShape(
  value,
  path,
  propertyNames,
  propertyNameSet,
  errors,
  invalidCode,
  invalidMessage
) {
  let ownKeys

  try {
    ownKeys = Reflect.ownKeys(value)
  } catch {
    addError(errors, invalidCode, path, invalidMessage)
    return false
  }

  const ownStringKeys = new Set()

  ownKeys.forEach((propertyName) => {
    if (typeof propertyName === 'string') {
      ownStringKeys.add(propertyName)
    }

    if (
      typeof propertyName === 'string' &&
      propertyNameSet.has(propertyName)
    ) {
      return
    }

    addError(
      errors,
      LICHTWALD_LOG_ERROR_CODES.UNKNOWN_PROPERTY,
      `${path}.*`,
      'Der Vertrag enthält ein nicht unterstütztes Feld.'
    )
  })

  propertyNames.forEach((propertyName) => {
    if (ownStringKeys.has(propertyName)) {
      return
    }

    addError(
      errors,
      LICHTWALD_LOG_ERROR_CODES.MISSING_PROPERTY,
      `${path}.${propertyName}`,
      'Ein erforderliches Vertragsfeld fehlt.'
    )
  })

  return true
}

function validateId(value, path, errors) {
  const hasValidShape = isTrimmedNonEmptyString(value)

  if (!hasValidShape) {
    addError(
      errors,
      LICHTWALD_LOG_ERROR_CODES.INVALID_ID,
      path,
      'Die ID muss eine nicht leere, getrimmte Zeichenfolge sein.'
    )
  }

  const exceedsLength = (
    typeof value === 'string' &&
    value.length > LICHTWALD_LOG_ID_MAX_LENGTH
  )

  if (exceedsLength) {
    addError(
      errors,
      LICHTWALD_LOG_ERROR_CODES.ID_TOO_LONG,
      path,
      'Die ID überschreitet die zulässige Länge.'
    )
  }

  return hasValidShape && !exceedsLength
}

function validateEntryId(entryId, path, context) {
  if (!validateId(entryId, path, context.errors)) {
    return
  }

  if (context.entryIds.has(entryId)) {
    addError(
      context.errors,
      LICHTWALD_LOG_ERROR_CODES.DUPLICATE_ENTRY_ID,
      path,
      'Eintrags-IDs müssen innerhalb des LichtwaldLogs eindeutig sein.'
    )
    return
  }

  context.entryIds.add(entryId)
}

function isGregorianLeapYear(year) {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0)
}

export function isValidCalendarDate(value) {
  if (typeof value !== 'string' || value.length !== 10) {
    return false
  }

  const match = CALENDAR_DATE_PATTERN.exec(value)

  if (!match || match[0] !== value) {
    return false
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  if (year < 1 || year > 9999 || month < 1 || month > 12) {
    return false
  }

  const daysInMonth = [
    31,
    isGregorianLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ]

  return day >= 1 && day <= daysInMonth[month - 1]
}

function validateCalendarDate(value, path, errors) {
  if (isValidCalendarDate(value)) {
    return
  }

  addError(
    errors,
    LICHTWALD_LOG_ERROR_CODES.INVALID_CALENDAR_DATE,
    path,
    'calendarDate muss ein existierendes gregorianisches Kalenderdatum im Format YYYY-MM-DD sein.'
  )
}

function validateTitle(value, path, errors) {
  if (!isTrimmedNonEmptyString(value)) {
    addError(
      errors,
      LICHTWALD_LOG_ERROR_CODES.INVALID_TITLE,
      path,
      'Der Titel muss eine nicht leere, getrimmte Zeichenfolge sein.'
    )
  }

  if (
    typeof value === 'string' &&
    value.length > LICHTWALD_LOG_TITLE_MAX_LENGTH
  ) {
    addError(
      errors,
      LICHTWALD_LOG_ERROR_CODES.TITLE_TOO_LONG,
      path,
      'Der Titel überschreitet die zulässige Länge.'
    )
  }
}

function validateText(value, path, errors) {
  if (!isTrimmedNonEmptyString(value)) {
    addError(
      errors,
      LICHTWALD_LOG_ERROR_CODES.INVALID_TEXT,
      path,
      'Der Text muss eine nicht leere, getrimmte Zeichenfolge sein.'
    )
  }

  if (
    typeof value === 'string' &&
    value.length > LICHTWALD_LOG_TEXT_MAX_LENGTH
  ) {
    addError(
      errors,
      LICHTWALD_LOG_ERROR_CODES.TEXT_TOO_LONG,
      path,
      'Der Text überschreitet die zulässige Länge.'
    )
  }
}

function validateTag(tag, path, context) {
  const hasValidShape = isTrimmedNonEmptyString(tag)

  if (!hasValidShape) {
    addError(
      context.errors,
      LICHTWALD_LOG_ERROR_CODES.INVALID_TAG,
      path,
      'Jeder Tag muss eine nicht leere, getrimmte Zeichenfolge sein.'
    )
  }

  if (
    typeof tag === 'string' &&
    tag.length > LICHTWALD_LOG_TAG_MAX_LENGTH
  ) {
    addError(
      context.errors,
      LICHTWALD_LOG_ERROR_CODES.TAG_TOO_LONG,
      path,
      'Der Tag überschreitet die zulässige Länge.'
    )
  }

  if (!hasValidShape) {
    return
  }

  const comparisonKey = tag.toLowerCase()

  if (context.comparisonKeys.has(comparisonKey)) {
    addError(
      context.errors,
      LICHTWALD_LOG_ERROR_CODES.DUPLICATE_TAG,
      path,
      'Tags müssen ohne Beachtung der Groß- und Kleinschreibung eindeutig sein.'
    )
    return
  }

  context.comparisonKeys.add(comparisonKey)
}

function validateTags(tags, path, errors) {
  if (!isArray(tags)) {
    addError(
      errors,
      LICHTWALD_LOG_ERROR_CODES.INVALID_TAGS,
      path,
      'tags muss ein Array sein.'
    )
    return
  }

  const tagCount = readArrayLength(tags)

  if (tagCount === null) {
    addError(
      errors,
      LICHTWALD_LOG_ERROR_CODES.INVALID_TAGS,
      path,
      'tags muss ein Array sein.'
    )
    return
  }

  if (tagCount > LICHTWALD_LOG_MAX_TAG_COUNT) {
    addError(
      errors,
      LICHTWALD_LOG_ERROR_CODES.TAG_LIMIT_EXCEEDED,
      path,
      'Ein Eintrag darf höchstens acht Tags besitzen.'
    )
  }

  const context = { errors, comparisonKeys: new Set() }
  const tagPositionCount = Math.min(
    tagCount,
    LICHTWALD_LOG_MAX_TAG_COUNT
  )

  for (let index = 0; index < tagPositionCount; index += 1) {
    const tagResult = readArrayEntry(tags, index)
    const tagPath = `${path}[${index}]`

    validateTag(
      tagResult.ok ? tagResult.value : undefined,
      tagPath,
      context
    )
  }
}

function validateEntry(entry, path, context) {
  if (!isObjectRecord(entry)) {
    addError(
      context.errors,
      LICHTWALD_LOG_ERROR_CODES.INVALID_ENTRY,
      path,
      'Jeder LichtwaldLog-Eintrag muss ein Objekt sein.'
    )
    return
  }

  if (!validateObjectShape(
    entry,
    path,
    ENTRY_PROPERTY_NAMES,
    ENTRY_PROPERTY_NAME_SET,
    context.errors,
    LICHTWALD_LOG_ERROR_CODES.INVALID_ENTRY,
    'Jeder LichtwaldLog-Eintrag muss ein Objekt sein.'
  )) {
    return
  }

  validateEntryId(
    readProperty(entry, 'id'),
    `${path}.id`,
    context
  )
  validateCalendarDate(
    readProperty(entry, 'calendarDate'),
    `${path}.calendarDate`,
    context.errors
  )
  validateTitle(
    readProperty(entry, 'title'),
    `${path}.title`,
    context.errors
  )
  validateText(
    readProperty(entry, 'text'),
    `${path}.text`,
    context.errors
  )
  validateTags(
    readProperty(entry, 'tags'),
    `${path}.tags`,
    context.errors
  )
}

function validateEntries(entries, errors) {
  const context = { errors, entryIds: new Set() }

  if (!isArray(entries)) {
    addError(
      errors,
      LICHTWALD_LOG_ERROR_CODES.INVALID_ENTRIES,
      '$.entries',
      'entries muss ein Array sein.'
    )
    return context
  }

  const entryCount = readArrayLength(entries)

  if (entryCount === null) {
    addError(
      errors,
      LICHTWALD_LOG_ERROR_CODES.INVALID_ENTRIES,
      '$.entries',
      'entries muss ein Array sein.'
    )
    return context
  }

  if (entryCount > LICHTWALD_LOG_MAX_ENTRY_COUNT) {
    addError(
      errors,
      LICHTWALD_LOG_ERROR_CODES.ENTRY_LIMIT_EXCEEDED,
      '$.entries',
      'Das LichtwaldLog darf höchstens 1.000 Einträge besitzen.'
    )
  }

  const entryPositionCount = Math.min(
    entryCount,
    LICHTWALD_LOG_MAX_ENTRY_COUNT
  )

  for (let index = 0; index < entryPositionCount; index += 1) {
    const entryResult = readArrayEntry(entries, index)
    const entryPath = `$.entries[${index}]`

    validateEntry(
      entryResult.ok ? entryResult.value : undefined,
      entryPath,
      context
    )
  }

  return context
}

export function validateLichtwaldLog(lichtwaldLog) {
  const errors = []

  if (!isObjectRecord(lichtwaldLog)) {
    addError(
      errors,
      LICHTWALD_LOG_ERROR_CODES.INVALID_LICHTWALD_LOG,
      '$',
      'Das LichtwaldLog muss ein Objekt sein.'
    )
    return { ok: false, errors }
  }

  if (!validateObjectShape(
    lichtwaldLog,
    '$',
    LOG_PROPERTY_NAMES,
    LOG_PROPERTY_NAME_SET,
    errors,
    LICHTWALD_LOG_ERROR_CODES.INVALID_LICHTWALD_LOG,
    'Das LichtwaldLog muss ein Objekt sein.'
  )) {
    return { ok: false, errors }
  }

  const schemaVersion = readProperty(lichtwaldLog, 'schemaVersion')
  const dataOrigin = readProperty(lichtwaldLog, 'dataOrigin')
  const featuredEntryId = readProperty(lichtwaldLog, 'featuredEntryId')
  const entries = readProperty(lichtwaldLog, 'entries')

  if (schemaVersion !== LICHTWALD_LOG_SCHEMA_VERSION) {
    addError(
      errors,
      LICHTWALD_LOG_ERROR_CODES.UNSUPPORTED_SCHEMA_VERSION,
      '$.schemaVersion',
      'Die LichtwaldLog-Schemaversion wird nicht unterstützt.'
    )
  }

  if (!LICHTWALD_LOG_DATA_ORIGINS.includes(dataOrigin)) {
    addError(
      errors,
      LICHTWALD_LOG_ERROR_CODES.INVALID_DATA_ORIGIN,
      '$.dataOrigin',
      'dataOrigin muss synthetic oder private sein.'
    )
  }

  const hasValidFeaturedEntryId = (
    featuredEntryId === null ||
    validateId(featuredEntryId, '$.featuredEntryId', errors)
  )
  const entriesContext = validateEntries(entries, errors)

  if (
    featuredEntryId !== null &&
    hasValidFeaturedEntryId &&
    isArray(entries) &&
    !entriesContext.entryIds.has(featuredEntryId)
  ) {
    addError(
      errors,
      LICHTWALD_LOG_ERROR_CODES.FEATURED_ENTRY_NOT_FOUND,
      '$.featuredEntryId',
      'featuredEntryId muss exakt auf einen vorhandenen Eintrag verweisen.'
    )
  }

  return errors.length === 0 ? { ok: true, errors: [] } : { ok: false, errors }
}
