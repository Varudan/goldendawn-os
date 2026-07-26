import {
  LICHTWALD_LOG_ID_MAX_LENGTH,
  LICHTWALD_LOG_MAX_ENTRY_COUNT,
  LICHTWALD_LOG_MAX_TAG_COUNT,
  LICHTWALD_LOG_TAG_MAX_LENGTH,
  LICHTWALD_LOG_TEXT_MAX_LENGTH,
  LICHTWALD_LOG_TITLE_MAX_LENGTH,
  isValidCalendarDate,
  validateLichtwaldLog,
} from '../modules/lichtwald-log/lichtwaldLogContract.js'

const PRIVATE_DATA_ORIGIN = 'private'
const MAX_ID_GENERATION_ATTEMPTS = 5

const LOAD_SUCCESS_PROPERTY_NAMES = Object.freeze([
  'ok',
  'status',
  'lichtwaldLog',
])
const SAVE_SUCCESS_PROPERTY_NAMES = Object.freeze(['ok', 'status'])
const FAILURE_PROPERTY_NAMES = Object.freeze(['ok', 'status', 'error'])
const ERROR_PROPERTY_NAMES = Object.freeze(['code', 'message'])

const SERVICE_FAILURES = Object.freeze({
  invalidInput: Object.freeze({
    status: 'validationFailed',
    code: 'invalidLichtwaldLogInput',
    message: 'Bitte korrigiere die markierten LichtwaldLog-Felder.',
  }),
  limitReached: Object.freeze({
    status: 'limitReached',
    code: 'lichtwaldLogEntryLimitReached',
    message: 'Das LichtwaldLog kann keine weiteren Einträge aufnehmen.',
  }),
  entryNotFound: Object.freeze({
    status: 'notFound',
    code: 'lichtwaldLogEntryNotFound',
    message: 'Der angeforderte LichtwaldLog-Eintrag wurde nicht gefunden.',
  }),
  idGenerationFailed: Object.freeze({
    status: 'generationFailed',
    code: 'lichtwaldLogEntryIdGenerationFailed',
    message: 'Für den LichtwaldLog-Eintrag konnte keine gültige ID erzeugt werden.',
  }),
  invalidState: Object.freeze({
    status: 'validationFailed',
    code: 'invalidLichtwaldLogState',
    message: 'Die LichtwaldLog-Änderung ergibt keinen gültigen Gesamtzustand.',
  }),
  storageUnavailable: Object.freeze({
    status: 'unavailable',
    code: 'lichtwaldLogStorageUnavailable',
    message: 'Der LichtwaldLog-Speicher ist nicht verfügbar.',
  }),
  storageReadFailed: Object.freeze({
    status: 'readFailed',
    code: 'lichtwaldLogStorageReadFailed',
    message: 'Das LichtwaldLog konnte nicht gelesen werden.',
  }),
  storageWriteFailed: Object.freeze({
    status: 'writeFailed',
    code: 'lichtwaldLogStorageWriteFailed',
    message: 'Die LichtwaldLog-Änderung konnte nicht gespeichert werden.',
  }),
  unexpectedStorageResult: Object.freeze({
    status: 'storageFailed',
    code: 'unexpectedStorageResult',
    message: 'Der LichtwaldLog-Speicher hat kein verwertbares Ergebnis geliefert.',
  }),
})

function createStorageFailure(status, code, message) {
  return Object.freeze({ status, code, message })
}

const READ_STORAGE_FAILURES = new Map([
  [
    'invalidKey\0invalidStorageKey',
    createStorageFailure(
      'invalidKey',
      'invalidStorageKey',
      'Der lokale LichtwaldLog-Speicherpfad ist ungültig.'
    ),
  ],
  [
    'invalidLimit\0invalidStorageLimit',
    createStorageFailure(
      'invalidLimit',
      'invalidStorageLimit',
      'Die lokale LichtwaldLog-Speichergrenze ist ungültig.'
    ),
  ],
  [
    'unavailable\0storageAdapterUnavailable',
    createStorageFailure(
      'unavailable',
      'storageAdapterUnavailable',
      'Der Storage-Adapter ist nicht verfügbar.'
    ),
  ],
  [
    'unavailable\0storageUnavailable',
    createStorageFailure(
      'unavailable',
      'storageUnavailable',
      'Der lokale Speicher ist nicht verfügbar.'
    ),
  ],
  [
    'readFailed\0storageReadFailed',
    createStorageFailure(
      'readFailed',
      'storageReadFailed',
      'Das lokale LichtwaldLog konnte nicht gelesen werden.'
    ),
  ],
  [
    'invalidJson\0invalidJson',
    createStorageFailure(
      'invalidJson',
      'invalidJson',
      'Das gespeicherte LichtwaldLog enthält kein gültiges JSON.'
    ),
  ],
  [
    'sizeLimitExceeded\0storageSizeLimitExceeded',
    createStorageFailure(
      'sizeLimitExceeded',
      'storageSizeLimitExceeded',
      'Das lokale LichtwaldLog überschreitet die zulässige Speichergröße.'
    ),
  ],
  [
    'invalidStoredData\0invalidLichtwaldLogData',
    createStorageFailure(
      'invalidStoredData',
      'invalidLichtwaldLogData',
      'Das gespeicherte LichtwaldLog entspricht nicht dem gültigen Vertrag.'
    ),
  ],
  [
    'invalidStoredData\0privateLichtwaldLogRequired',
    createStorageFailure(
      'invalidStoredData',
      'privateLichtwaldLogRequired',
      'Der private LichtwaldLog-Speicher enthält Daten mit ungültiger Herkunft.'
    ),
  ],
  [
    'storageFailed\0unexpectedStorageResult',
    SERVICE_FAILURES.unexpectedStorageResult,
  ],
])

const SAVE_STORAGE_FAILURES = new Map([
  ...READ_STORAGE_FAILURES,
  [
    'serializationFailed\0serializationFailed',
    createStorageFailure(
      'serializationFailed',
      'serializationFailed',
      'Das LichtwaldLog konnte nicht für die Speicherung vorbereitet werden.'
    ),
  ],
  [
    'quotaExceeded\0storageQuotaExceeded',
    createStorageFailure(
      'quotaExceeded',
      'storageQuotaExceeded',
      'Der lokale Speicher hat nicht genügend freien Platz.'
    ),
  ],
  [
    'writeFailed\0storageWriteFailed',
    createStorageFailure(
      'writeFailed',
      'storageWriteFailed',
      'Das lokale LichtwaldLog konnte nicht gespeichert werden.'
    ),
  ],
  [
    'validationFailed\0invalidLichtwaldLogData',
    createStorageFailure(
      'validationFailed',
      'invalidLichtwaldLogData',
      'Das LichtwaldLog kann in dieser Form nicht gespeichert werden.'
    ),
  ],
  [
    'validationFailed\0privateLichtwaldLogRequired',
    createStorageFailure(
      'validationFailed',
      'privateLichtwaldLogRequired',
      'Der private LichtwaldLog-Speicher akzeptiert nur private Daten.'
    ),
  ],
])

const FIELD_ERROR_MESSAGES = Object.freeze({
  form: 'Die LichtwaldLog-Eingabe konnte nicht sicher gelesen werden.',
  calendarDate: 'Bitte gib ein gültiges Kalenderdatum im Format YYYY-MM-DD ein.',
  title: 'Bitte gib einen gültigen Titel ein.',
  text: 'Bitte gib einen gültigen Text ein.',
  tags: 'Bitte gib eine gültige Tag-Liste ein.',
  entryId: 'Bitte gib eine gültige LichtwaldLog-Eintrags-ID ein.',
  featuredEntryId: 'Bitte gib eine gültige Fokus-ID ein.',
})

function isObjectRecord(value) {
  try {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return false
    }

    const prototype = Object.getPrototypeOf(value)

    return prototype === Object.prototype || prototype === null
  } catch {
    return false
  }
}

function hasExactPropertyNames(ownKeys, expectedPropertyNames) {
  return (
    ownKeys.length === expectedPropertyNames.length &&
    ownKeys.every(
      (propertyName) => (
        typeof propertyName === 'string' &&
        expectedPropertyNames.includes(propertyName)
      )
    )
  )
}

function readOwnDataProperties(value, expectedPropertySets) {
  if (!isObjectRecord(value)) {
    return { ok: false }
  }

  try {
    const ownKeys = Reflect.ownKeys(value)
    const propertyNames = expectedPropertySets.find(
      (expectedPropertyNames) => (
        hasExactPropertyNames(ownKeys, expectedPropertyNames)
      )
    )

    if (!propertyNames) {
      return { ok: false }
    }

    const properties = Object.create(null)

    for (const propertyName of propertyNames) {
      const descriptor = Object.getOwnPropertyDescriptor(value, propertyName)

      if (!descriptor || !Object.hasOwn(descriptor, 'value')) {
        return { ok: false }
      }

      properties[propertyName] = descriptor.value
    }

    return { ok: true, properties, propertyNames }
  } catch {
    return { ok: false }
  }
}

function readOwnDataProperty(value, propertyName) {
  try {
    const descriptor = Object.getOwnPropertyDescriptor(value, propertyName)

    if (!descriptor || !Object.hasOwn(descriptor, 'value')) {
      return { ok: false }
    }

    return { ok: true, value: descriptor.value }
  } catch {
    return { ok: false }
  }
}

function cloneEntry(entry) {
  const tags = []

  for (let index = 0; index < entry.tags.length; index += 1) {
    tags.push(entry.tags[index])
  }

  return {
    id: entry.id,
    calendarDate: entry.calendarDate,
    title: entry.title,
    text: entry.text,
    tags,
  }
}

function cloneLichtwaldLog(lichtwaldLog) {
  const entries = []

  for (let index = 0; index < lichtwaldLog.entries.length; index += 1) {
    entries.push(cloneEntry(lichtwaldLog.entries[index]))
  }

  return {
    schemaVersion: lichtwaldLog.schemaVersion,
    dataOrigin: lichtwaldLog.dataOrigin,
    featuredEntryId: lichtwaldLog.featuredEntryId,
    entries,
  }
}

function isValidPrivateLichtwaldLog(lichtwaldLog) {
  try {
    return (
      validateLichtwaldLog(lichtwaldLog).ok === true &&
      lichtwaldLog.dataOrigin === PRIVATE_DATA_ORIGIN
    )
  } catch {
    return false
  }
}

function validateAndClonePrivateLichtwaldLog(lichtwaldLog) {
  if (!isValidPrivateLichtwaldLog(lichtwaldLog)) {
    return { ok: false }
  }

  let clonedLichtwaldLog

  try {
    clonedLichtwaldLog = structuredClone(lichtwaldLog)
  } catch {
    return { ok: false }
  }

  if (!isValidPrivateLichtwaldLog(clonedLichtwaldLog)) {
    return { ok: false }
  }

  try {
    return {
      ok: true,
      lichtwaldLog: cloneLichtwaldLog(clonedLichtwaldLog),
    }
  } catch {
    return { ok: false }
  }
}

function createError(failure, fieldErrors) {
  const error = {
    code: failure.code,
    message: failure.message,
  }

  if (fieldErrors) {
    error.fieldErrors = { ...fieldErrors }
  }

  return error
}

function createLoadFailure(failure) {
  return {
    ok: false,
    status: failure.status,
    lichtwaldLog: null,
    error: createError(failure),
  }
}

function createMutationFailure(
  failure,
  previousLichtwaldLog = null,
  fieldErrors = null
) {
  return {
    ok: false,
    status: failure.status,
    changed: false,
    lichtwaldLog: previousLichtwaldLog
      ? cloneLichtwaldLog(previousLichtwaldLog)
      : null,
    error: createError(failure, fieldErrors),
  }
}

function createInputFailure(fieldErrors) {
  return createMutationFailure(
    SERVICE_FAILURES.invalidInput,
    null,
    fieldErrors
  )
}

function readStorageFailure(resultProperties, failureAllowlist) {
  if (resultProperties.ok !== false) {
    return SERVICE_FAILURES.unexpectedStorageResult
  }

  const errorShape = readOwnDataProperties(
    resultProperties.error,
    [ERROR_PROPERTY_NAMES]
  )

  if (!errorShape.ok) {
    return SERVICE_FAILURES.unexpectedStorageResult
  }

  const { status } = resultProperties
  const { code, message } = errorShape.properties

  if (
    typeof status !== 'string' ||
    typeof code !== 'string' ||
    typeof message !== 'string' ||
    message.trim().length === 0
  ) {
    return SERVICE_FAILURES.unexpectedStorageResult
  }

  return failureAllowlist.get(`${status}\0${code}`) ??
    SERVICE_FAILURES.unexpectedStorageResult
}

function parseLoadResult(storageResult) {
  const resultShape = readOwnDataProperties(
    storageResult,
    [LOAD_SUCCESS_PROPERTY_NAMES, FAILURE_PROPERTY_NAMES]
  )

  if (!resultShape.ok) {
    return { ok: false, failure: SERVICE_FAILURES.unexpectedStorageResult }
  }

  if (resultShape.propertyNames === FAILURE_PROPERTY_NAMES) {
    return {
      ok: false,
      failure: readStorageFailure(
        resultShape.properties,
        READ_STORAGE_FAILURES
      ),
    }
  }

  const { ok, status, lichtwaldLog } = resultShape.properties

  if (ok !== true || (status !== 'missing' && status !== 'found')) {
    return { ok: false, failure: SERVICE_FAILURES.unexpectedStorageResult }
  }

  const clonedResult = validateAndClonePrivateLichtwaldLog(lichtwaldLog)

  if (!clonedResult.ok) {
    return { ok: false, failure: SERVICE_FAILURES.unexpectedStorageResult }
  }

  if (
    status === 'missing' &&
    (
      clonedResult.lichtwaldLog.entries.length !== 0 ||
      clonedResult.lichtwaldLog.featuredEntryId !== null
    )
  ) {
    return { ok: false, failure: SERVICE_FAILURES.unexpectedStorageResult }
  }

  return {
    ok: true,
    status,
    lichtwaldLog: clonedResult.lichtwaldLog,
  }
}

function parseSaveResult(storageResult) {
  const resultShape = readOwnDataProperties(
    storageResult,
    [SAVE_SUCCESS_PROPERTY_NAMES, FAILURE_PROPERTY_NAMES]
  )

  if (!resultShape.ok) {
    return { ok: false, failure: SERVICE_FAILURES.unexpectedStorageResult }
  }

  if (resultShape.propertyNames === FAILURE_PROPERTY_NAMES) {
    return {
      ok: false,
      failure: readStorageFailure(
        resultShape.properties,
        SAVE_STORAGE_FAILURES
      ),
    }
  }

  if (
    resultShape.properties.ok !== true ||
    resultShape.properties.status !== 'saved'
  ) {
    return { ok: false, failure: SERVICE_FAILURES.unexpectedStorageResult }
  }

  return { ok: true }
}

function normalizeRequiredString(
  propertyResult,
  maximumLength,
  fieldName,
  fieldErrors
) {
  if (!propertyResult.ok || typeof propertyResult.value !== 'string') {
    fieldErrors[fieldName] = FIELD_ERROR_MESSAGES[fieldName]
    return ''
  }

  const normalizedValue = propertyResult.value.trim()

  if (
    normalizedValue.length === 0 ||
    normalizedValue.length > maximumLength
  ) {
    fieldErrors[fieldName] = FIELD_ERROR_MESSAGES[fieldName]
  }

  return normalizedValue
}

function normalizeCalendarDate(propertyResult, fieldErrors) {
  if (!propertyResult.ok || typeof propertyResult.value !== 'string') {
    fieldErrors.calendarDate = FIELD_ERROR_MESSAGES.calendarDate
    return ''
  }

  const normalizedValue = propertyResult.value.trim()

  if (!isValidCalendarDate(normalizedValue)) {
    fieldErrors.calendarDate = FIELD_ERROR_MESSAGES.calendarDate
  }

  return normalizedValue
}

function isCanonicalArrayPosition(propertyName, arrayLength) {
  if (typeof propertyName !== 'string' || propertyName.length === 0) {
    return false
  }

  const index = Number(propertyName)

  return (
    Number.isSafeInteger(index) &&
    index >= 0 &&
    index < arrayLength &&
    String(index) === propertyName
  )
}

function normalizeTags(propertyResult, fieldErrors) {
  if (!propertyResult.ok) {
    fieldErrors.tags = FIELD_ERROR_MESSAGES.tags
    return []
  }

  const tagsInput = propertyResult.value
  let tagCount
  let ownKeys

  try {
    if (!Array.isArray(tagsInput)) {
      fieldErrors.tags = FIELD_ERROR_MESSAGES.tags
      return []
    }

    const prototype = Object.getPrototypeOf(tagsInput)

    if (prototype !== Array.prototype && prototype !== null) {
      fieldErrors.tags = FIELD_ERROR_MESSAGES.tags
      return []
    }

    const lengthDescriptor = Object.getOwnPropertyDescriptor(
      tagsInput,
      'length'
    )

    if (
      !lengthDescriptor ||
      !Object.hasOwn(lengthDescriptor, 'value') ||
      !Number.isSafeInteger(lengthDescriptor.value) ||
      lengthDescriptor.value < 0 ||
      lengthDescriptor.value > LICHTWALD_LOG_MAX_TAG_COUNT
    ) {
      fieldErrors.tags = FIELD_ERROR_MESSAGES.tags
      return []
    }

    tagCount = lengthDescriptor.value
    ownKeys = Reflect.ownKeys(tagsInput)

    if (
      ownKeys.length !== tagCount + 1 ||
      !ownKeys.includes('length') ||
      ownKeys.some(
        (propertyName) => (
          propertyName !== 'length' &&
          !isCanonicalArrayPosition(propertyName, tagCount)
        )
      )
    ) {
      fieldErrors.tags = FIELD_ERROR_MESSAGES.tags
      return []
    }
  } catch {
    fieldErrors.tags = FIELD_ERROR_MESSAGES.tags
    return []
  }

  const normalizedTags = []
  const comparisonKeys = new Set()

  for (let index = 0; index < tagCount; index += 1) {
    const tagResult = readOwnDataProperty(tagsInput, String(index))

    if (!tagResult.ok || typeof tagResult.value !== 'string') {
      fieldErrors.tags = FIELD_ERROR_MESSAGES.tags
      return []
    }

    const normalizedTag = tagResult.value.trim()
    const comparisonKey = normalizedTag.toLowerCase()

    if (
      normalizedTag.length === 0 ||
      normalizedTag.length > LICHTWALD_LOG_TAG_MAX_LENGTH ||
      comparisonKeys.has(comparisonKey)
    ) {
      fieldErrors.tags = FIELD_ERROR_MESSAGES.tags
      return []
    }

    comparisonKeys.add(comparisonKey)
    normalizedTags.push(normalizedTag)
  }

  return normalizedTags
}

function validateEntryInput(input) {
  const fieldErrors = {}

  if (!isObjectRecord(input)) {
    fieldErrors.form = FIELD_ERROR_MESSAGES.form
    return { values: null, fieldErrors }
  }

  const calendarDate = normalizeCalendarDate(
    readOwnDataProperty(input, 'calendarDate'),
    fieldErrors
  )
  const title = normalizeRequiredString(
    readOwnDataProperty(input, 'title'),
    LICHTWALD_LOG_TITLE_MAX_LENGTH,
    'title',
    fieldErrors
  )
  const text = normalizeRequiredString(
    readOwnDataProperty(input, 'text'),
    LICHTWALD_LOG_TEXT_MAX_LENGTH,
    'text',
    fieldErrors
  )
  const tags = normalizeTags(
    readOwnDataProperty(input, 'tags'),
    fieldErrors
  )

  return {
    values: { calendarDate, title, text, tags },
    fieldErrors,
  }
}

function validateTargetId(value, fieldName, fieldErrors) {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > LICHTWALD_LOG_ID_MAX_LENGTH ||
    value !== value.trim()
  ) {
    fieldErrors[fieldName] = FIELD_ERROR_MESSAGES[fieldName]
    return ''
  }

  return value
}

function hasFieldErrors(fieldErrors) {
  return Object.keys(fieldErrors).length > 0
}

function findEntryIndex(lichtwaldLog, entryId) {
  for (let index = 0; index < lichtwaldLog.entries.length; index += 1) {
    if (lichtwaldLog.entries[index].id === entryId) {
      return index
    }
  }

  return -1
}

function haveEqualTags(leftTags, rightTags) {
  if (leftTags.length !== rightTags.length) {
    return false
  }

  for (let index = 0; index < leftTags.length; index += 1) {
    if (leftTags[index] !== rightTags[index]) {
      return false
    }
  }

  return true
}

function hasEqualEntryContent(entry, values) {
  return (
    entry.calendarDate === values.calendarDate &&
    entry.title === values.title &&
    entry.text === values.text &&
    haveEqualTags(entry.tags, values.tags)
  )
}

function generateDefaultLichtwaldLogEntryId() {
  if (typeof globalThis.crypto?.randomUUID !== 'function') {
    throw new Error('randomUUID unavailable')
  }

  return `lichtwald-entry-${globalThis.crypto.randomUUID()}`
}

function generateUniqueEntryId(generateEntryId, lichtwaldLog) {
  const existingEntryIds = new Set()

  for (let index = 0; index < lichtwaldLog.entries.length; index += 1) {
    existingEntryIds.add(lichtwaldLog.entries[index].id)
  }

  for (
    let attempt = 0;
    attempt < MAX_ID_GENERATION_ATTEMPTS;
    attempt += 1
  ) {
    let generatedId

    try {
      generatedId = generateEntryId()
    } catch {
      continue
    }

    if (
      typeof generatedId === 'string' &&
      generatedId.length > 0 &&
      generatedId.length <= LICHTWALD_LOG_ID_MAX_LENGTH &&
      generatedId === generatedId.trim() &&
      !existingEntryIds.has(generatedId)
    ) {
      return generatedId
    }
  }

  return null
}

export function createLichtwaldLogService({
  lichtwaldLogStorage,
  generateLichtwaldLogEntryId = generateDefaultLichtwaldLogEntryId,
} = {}) {
  function readCurrentLichtwaldLog() {
    let loadMethod

    try {
      loadMethod = lichtwaldLogStorage?.loadLichtwaldLog
    } catch {
      return { ok: false, failure: SERVICE_FAILURES.storageReadFailed }
    }

    if (typeof loadMethod !== 'function') {
      return { ok: false, failure: SERVICE_FAILURES.storageUnavailable }
    }

    let storageResult

    try {
      storageResult = loadMethod.call(lichtwaldLogStorage)
    } catch {
      return { ok: false, failure: SERVICE_FAILURES.storageReadFailed }
    }

    return parseLoadResult(storageResult)
  }

  function persistLichtwaldLog(previousLichtwaldLog, candidateLichtwaldLog) {
    if (!isValidPrivateLichtwaldLog(candidateLichtwaldLog)) {
      return { ok: false, failure: SERVICE_FAILURES.invalidState }
    }

    let saveMethod

    try {
      saveMethod = lichtwaldLogStorage?.saveLichtwaldLog
    } catch {
      return { ok: false, failure: SERVICE_FAILURES.storageWriteFailed }
    }

    if (typeof saveMethod !== 'function') {
      return { ok: false, failure: SERVICE_FAILURES.storageUnavailable }
    }

    let storageResult

    try {
      storageResult = saveMethod.call(
        lichtwaldLogStorage,
        cloneLichtwaldLog(candidateLichtwaldLog)
      )
    } catch {
      return { ok: false, failure: SERVICE_FAILURES.storageWriteFailed }
    }

    const parsedResult = parseSaveResult(storageResult)

    if (!parsedResult.ok) {
      return parsedResult
    }

    return { ok: true, previousLichtwaldLog }
  }

  function loadLog() {
    const loadResult = readCurrentLichtwaldLog()

    if (!loadResult.ok) {
      return createLoadFailure(loadResult.failure)
    }

    return {
      ok: true,
      status: loadResult.status === 'missing' ? 'empty' : 'loaded',
      initialized: false,
      lichtwaldLog: cloneLichtwaldLog(loadResult.lichtwaldLog),
    }
  }

  function createEntry(input) {
    const inputValidation = validateEntryInput(input)

    if (hasFieldErrors(inputValidation.fieldErrors)) {
      return createInputFailure(inputValidation.fieldErrors)
    }

    const loadResult = readCurrentLichtwaldLog()

    if (!loadResult.ok) {
      return createMutationFailure(loadResult.failure)
    }

    if (loadResult.lichtwaldLog.entries.length >= LICHTWALD_LOG_MAX_ENTRY_COUNT) {
      return createMutationFailure(
        SERVICE_FAILURES.limitReached,
        loadResult.lichtwaldLog
      )
    }

    const entryId = generateUniqueEntryId(
      generateLichtwaldLogEntryId,
      loadResult.lichtwaldLog
    )

    if (!entryId) {
      return createMutationFailure(
        SERVICE_FAILURES.idGenerationFailed,
        loadResult.lichtwaldLog
      )
    }

    const createdEntry = {
      id: entryId,
      calendarDate: inputValidation.values.calendarDate,
      title: inputValidation.values.title,
      text: inputValidation.values.text,
      tags: [...inputValidation.values.tags],
    }
    const candidateLichtwaldLog = cloneLichtwaldLog(
      loadResult.lichtwaldLog
    )
    candidateLichtwaldLog.entries.push(cloneEntry(createdEntry))

    const persistResult = persistLichtwaldLog(
      loadResult.lichtwaldLog,
      candidateLichtwaldLog
    )

    if (!persistResult.ok) {
      return createMutationFailure(
        persistResult.failure,
        loadResult.lichtwaldLog
      )
    }

    return {
      ok: true,
      status: 'entryCreated',
      changed: true,
      createdEntry: cloneEntry(createdEntry),
      lichtwaldLog: cloneLichtwaldLog(candidateLichtwaldLog),
    }
  }

  function updateEntry(entryId, input) {
    const fieldErrors = {}
    const normalizedEntryId = validateTargetId(
      entryId,
      'entryId',
      fieldErrors
    )
    const inputValidation = validateEntryInput(input)
    Object.assign(fieldErrors, inputValidation.fieldErrors)

    if (hasFieldErrors(fieldErrors)) {
      return createInputFailure(fieldErrors)
    }

    const loadResult = readCurrentLichtwaldLog()

    if (!loadResult.ok) {
      return createMutationFailure(loadResult.failure)
    }

    const entryIndex = findEntryIndex(
      loadResult.lichtwaldLog,
      normalizedEntryId
    )

    if (entryIndex === -1) {
      return createMutationFailure(
        SERVICE_FAILURES.entryNotFound,
        loadResult.lichtwaldLog
      )
    }

    const currentEntry = loadResult.lichtwaldLog.entries[entryIndex]

    if (hasEqualEntryContent(currentEntry, inputValidation.values)) {
      return {
        ok: true,
        status: 'entryUpdated',
        changed: false,
        updatedEntry: cloneEntry(currentEntry),
        lichtwaldLog: cloneLichtwaldLog(loadResult.lichtwaldLog),
      }
    }

    const updatedEntry = {
      id: currentEntry.id,
      calendarDate: inputValidation.values.calendarDate,
      title: inputValidation.values.title,
      text: inputValidation.values.text,
      tags: [...inputValidation.values.tags],
    }
    const candidateLichtwaldLog = cloneLichtwaldLog(
      loadResult.lichtwaldLog
    )
    candidateLichtwaldLog.entries[entryIndex] = cloneEntry(updatedEntry)

    const persistResult = persistLichtwaldLog(
      loadResult.lichtwaldLog,
      candidateLichtwaldLog
    )

    if (!persistResult.ok) {
      return createMutationFailure(
        persistResult.failure,
        loadResult.lichtwaldLog
      )
    }

    return {
      ok: true,
      status: 'entryUpdated',
      changed: true,
      updatedEntry: cloneEntry(updatedEntry),
      lichtwaldLog: cloneLichtwaldLog(candidateLichtwaldLog),
    }
  }

  function deleteEntry(entryId) {
    const fieldErrors = {}
    const normalizedEntryId = validateTargetId(
      entryId,
      'entryId',
      fieldErrors
    )

    if (hasFieldErrors(fieldErrors)) {
      return createInputFailure(fieldErrors)
    }

    const loadResult = readCurrentLichtwaldLog()

    if (!loadResult.ok) {
      return createMutationFailure(loadResult.failure)
    }

    const entryIndex = findEntryIndex(
      loadResult.lichtwaldLog,
      normalizedEntryId
    )

    if (entryIndex === -1) {
      return createMutationFailure(
        SERVICE_FAILURES.entryNotFound,
        loadResult.lichtwaldLog
      )
    }

    const focusCleared = (
      loadResult.lichtwaldLog.featuredEntryId === normalizedEntryId
    )
    const candidateLichtwaldLog = {
      schemaVersion: loadResult.lichtwaldLog.schemaVersion,
      dataOrigin: loadResult.lichtwaldLog.dataOrigin,
      featuredEntryId: focusCleared
        ? null
        : loadResult.lichtwaldLog.featuredEntryId,
      entries: [],
    }

    for (
      let index = 0;
      index < loadResult.lichtwaldLog.entries.length;
      index += 1
    ) {
      if (index !== entryIndex) {
        candidateLichtwaldLog.entries.push(
          cloneEntry(loadResult.lichtwaldLog.entries[index])
        )
      }
    }

    const persistResult = persistLichtwaldLog(
      loadResult.lichtwaldLog,
      candidateLichtwaldLog
    )

    if (!persistResult.ok) {
      return createMutationFailure(
        persistResult.failure,
        loadResult.lichtwaldLog
      )
    }

    return {
      ok: true,
      status: 'entryDeleted',
      changed: true,
      deletedEntryId: normalizedEntryId,
      focusCleared,
      lichtwaldLog: cloneLichtwaldLog(candidateLichtwaldLog),
    }
  }

  function setFeaturedEntry(entryIdOrNull) {
    const fieldErrors = {}
    const featuredEntryId = entryIdOrNull === null
      ? null
      : validateTargetId(
          entryIdOrNull,
          'featuredEntryId',
          fieldErrors
        )

    if (hasFieldErrors(fieldErrors)) {
      return createInputFailure(fieldErrors)
    }

    const loadResult = readCurrentLichtwaldLog()

    if (!loadResult.ok) {
      return createMutationFailure(loadResult.failure)
    }

    if (
      featuredEntryId !== null &&
      findEntryIndex(loadResult.lichtwaldLog, featuredEntryId) === -1
    ) {
      return createMutationFailure(
        SERVICE_FAILURES.entryNotFound,
        loadResult.lichtwaldLog
      )
    }

    if (loadResult.lichtwaldLog.featuredEntryId === featuredEntryId) {
      return {
        ok: true,
        status: 'featuredEntryUpdated',
        changed: false,
        featuredEntryId,
        lichtwaldLog: cloneLichtwaldLog(loadResult.lichtwaldLog),
      }
    }

    const candidateLichtwaldLog = cloneLichtwaldLog(
      loadResult.lichtwaldLog
    )
    candidateLichtwaldLog.featuredEntryId = featuredEntryId

    const persistResult = persistLichtwaldLog(
      loadResult.lichtwaldLog,
      candidateLichtwaldLog
    )

    if (!persistResult.ok) {
      return createMutationFailure(
        persistResult.failure,
        loadResult.lichtwaldLog
      )
    }

    return {
      ok: true,
      status: 'featuredEntryUpdated',
      changed: true,
      featuredEntryId,
      lichtwaldLog: cloneLichtwaldLog(candidateLichtwaldLog),
    }
  }

  return Object.freeze({
    loadLog,
    createEntry,
    updateEntry,
    deleteEntry,
    setFeaturedEntry,
  })
}
