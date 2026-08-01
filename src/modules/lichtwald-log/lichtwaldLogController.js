import {
  isValidCalendarDate,
  validateLichtwaldLog,
} from './lichtwaldLogContract.js'
import {
  ALL_LICHTWALD_LOG_TAGS,
  LICHTWALD_LOG_SEARCH_QUERY_MAX_LENGTH,
  filterLichtwaldLogEntries,
  getLichtwaldLogFilterTags,
} from './lichtwaldLogSearch.js'

const PRIVATE_DATA_ORIGIN = 'private'

const FORM_TYPES = Object.freeze({
  CREATE: 'createEntry',
  UPDATE: 'updateEntry',
})
const FORM_FIELD_NAMES = Object.freeze([
  'calendarDate',
  'title',
  'text',
  'tags',
])
const FORM_FIELD_NAME_SET = new Set(FORM_FIELD_NAMES)

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

const LOAD_SUCCESS_PROPERTY_NAMES = Object.freeze([
  'ok',
  'status',
  'initialized',
  'lichtwaldLog',
])
const LOAD_FAILURE_PROPERTY_NAMES = Object.freeze([
  'ok',
  'status',
  'lichtwaldLog',
  'error',
])
const MUTATION_FAILURE_PROPERTY_NAMES = Object.freeze([
  'ok',
  'status',
  'changed',
  'lichtwaldLog',
  'error',
])
const ERROR_PROPERTY_NAMES = Object.freeze(['code', 'message'])
const ERROR_WITH_FIELDS_PROPERTY_NAMES = Object.freeze([
  'code',
  'message',
  'fieldErrors',
])

const CREATE_SUCCESS_PROPERTY_NAMES = Object.freeze([
  'ok',
  'status',
  'changed',
  'createdEntry',
  'lichtwaldLog',
])
const UPDATE_SUCCESS_PROPERTY_NAMES = Object.freeze([
  'ok',
  'status',
  'changed',
  'updatedEntry',
  'lichtwaldLog',
])
const DELETE_SUCCESS_PROPERTY_NAMES = Object.freeze([
  'ok',
  'status',
  'changed',
  'deletedEntryId',
  'focusCleared',
  'lichtwaldLog',
])
const FEATURED_SUCCESS_PROPERTY_NAMES = Object.freeze([
  'ok',
  'status',
  'changed',
  'featuredEntryId',
  'lichtwaldLog',
])

const STATIC_FIELD_ERRORS = Object.freeze({
  form: 'Die LichtwaldLog-Eingabe konnte nicht sicher verarbeitet werden.',
  calendarDate:
    'Bitte gib ein gültiges Kalenderdatum im Format YYYY-MM-DD ein.',
  title: 'Bitte gib einen Titel mit höchstens 120 Zeichen ein.',
  text: 'Bitte gib einen Text mit höchstens 10.000 Zeichen ein.',
  tags:
    'Bitte verwende höchstens acht eindeutige Tags mit jeweils höchstens 30 Zeichen.',
})

const LOAD_ERROR_MESSAGE =
  'Das LichtwaldLog konnte nicht sicher geladen werden. Bitte versuche es erneut.'
const MALFORMED_FORM_MESSAGE = STATIC_FIELD_ERRORS.form
const UNSAVED_FORM_MESSAGE =
  'Speichere den Eintrag oder brich das Formular ab, bevor du den Arbeitsbereich schließt.'
const GENERIC_MUTATION_MESSAGES = Object.freeze({
  create:
    'Der LichtwaldLog-Eintrag konnte nicht lokal gespeichert werden. Deine Eingaben bleiben erhalten.',
  update:
    'Der LichtwaldLog-Eintrag konnte nicht lokal aktualisiert werden. Deine Eingaben bleiben erhalten.',
  delete:
    'Der LichtwaldLog-Eintrag konnte nicht dauerhaft gelöscht werden. Der gespeicherte Zustand bleibt maßgeblich.',
  featured:
    'Der LichtwaldLog-Fokus konnte nicht gespeichert werden. Der gespeicherte Zustand bleibt maßgeblich.',
})
const SUCCESS_MESSAGES = Object.freeze({
  create: 'Der LichtwaldLog-Eintrag wurde lokal gespeichert.',
  update: 'Der LichtwaldLog-Eintrag wurde lokal aktualisiert.',
  delete: 'Der LichtwaldLog-Eintrag wurde dauerhaft gelöscht.',
  featuredSet: 'Der LichtwaldLog-Fokus wurde lokal gespeichert.',
  featuredCleared: 'Der LichtwaldLog-Fokus wurde entfernt.',
})
const NO_CHANGES_MESSAGE = 'Keine Änderungen erforderlich'

const SERVICE_FAILURE_PAIRS = Object.freeze({
  invalidInput: 'validationFailed\0invalidLichtwaldLogInput',
  limitReached: 'limitReached\0lichtwaldLogEntryLimitReached',
  notFound: 'notFound\0lichtwaldLogEntryNotFound',
  generationFailed: 'generationFailed\0lichtwaldLogEntryIdGenerationFailed',
  invalidState: 'validationFailed\0invalidLichtwaldLogState',
  unavailable: 'unavailable\0lichtwaldLogStorageUnavailable',
  readFailed: 'readFailed\0lichtwaldLogStorageReadFailed',
  writeFailed: 'writeFailed\0lichtwaldLogStorageWriteFailed',
  storageFailed: 'storageFailed\0unexpectedStorageResult',
})

const READ_STORAGE_FAILURE_PAIRS = Object.freeze([
  'invalidKey\0invalidStorageKey',
  'invalidLimit\0invalidStorageLimit',
  'unavailable\0storageAdapterUnavailable',
  'unavailable\0storageUnavailable',
  'readFailed\0storageReadFailed',
  'invalidJson\0invalidJson',
  'sizeLimitExceeded\0storageSizeLimitExceeded',
  'invalidStoredData\0invalidLichtwaldLogData',
  'invalidStoredData\0privateLichtwaldLogRequired',
  'storageFailed\0unexpectedStorageResult',
])
const WRITE_STORAGE_FAILURE_PAIRS = Object.freeze([
  ...READ_STORAGE_FAILURE_PAIRS,
  'serializationFailed\0serializationFailed',
  'quotaExceeded\0storageQuotaExceeded',
  'writeFailed\0storageWriteFailed',
  'validationFailed\0invalidLichtwaldLogData',
  'validationFailed\0privateLichtwaldLogRequired',
])

const LOAD_FAILURE_PAIR_SET = new Set([
  SERVICE_FAILURE_PAIRS.unavailable,
  SERVICE_FAILURE_PAIRS.readFailed,
  SERVICE_FAILURE_PAIRS.storageFailed,
  ...READ_STORAGE_FAILURE_PAIRS,
])
const COMMON_MUTATION_FAILURE_PAIRS = Object.freeze([
  SERVICE_FAILURE_PAIRS.invalidInput,
  SERVICE_FAILURE_PAIRS.invalidState,
  SERVICE_FAILURE_PAIRS.unavailable,
  SERVICE_FAILURE_PAIRS.readFailed,
  SERVICE_FAILURE_PAIRS.writeFailed,
  SERVICE_FAILURE_PAIRS.storageFailed,
  ...WRITE_STORAGE_FAILURE_PAIRS,
])
const MUTATION_FAILURE_PAIR_SETS = Object.freeze({
  create: new Set([
    ...COMMON_MUTATION_FAILURE_PAIRS,
    SERVICE_FAILURE_PAIRS.limitReached,
    SERVICE_FAILURE_PAIRS.generationFailed,
  ]),
  update: new Set([
    ...COMMON_MUTATION_FAILURE_PAIRS,
    SERVICE_FAILURE_PAIRS.notFound,
  ]),
  delete: new Set([
    ...COMMON_MUTATION_FAILURE_PAIRS,
    SERVICE_FAILURE_PAIRS.notFound,
  ]),
  featured: new Set([
    ...COMMON_MUTATION_FAILURE_PAIRS,
    SERVICE_FAILURE_PAIRS.notFound,
  ]),
})

const FOCUS_TARGET_TYPES = new Set([
  'heading',
  'searchInput',
  'calendarDateFilter',
  'tagFilter',
  'formField',
  'formAlert',
  'formTrigger',
  'deleteConfirmation',
  'deleteAlert',
  'featuredAlert',
  'status',
  'entry',
])

function isArray(value) {
  try {
    return Array.isArray(value)
  } catch {
    return false
  }
}

function isPlainObject(value) {
  if (typeof value !== 'object' || value === null || isArray(value)) {
    return false
  }

  try {
    const prototype = Object.getPrototypeOf(value)
    return prototype === Object.prototype || prototype === null
  } catch {
    return false
  }
}

function hasExactNames(ownKeys, expectedPropertyNames) {
  return (
    ownKeys.length === expectedPropertyNames.length &&
    ownKeys.every(
      (propertyName) =>
        typeof propertyName === 'string' &&
        expectedPropertyNames.includes(propertyName)
    )
  )
}

function readExactDataObject(value, expectedPropertyNames) {
  if (!isPlainObject(value)) return { ok: false }

  try {
    const ownKeys = Reflect.ownKeys(value)

    if (!hasExactNames(ownKeys, expectedPropertyNames)) {
      return { ok: false }
    }

    const properties = Object.create(null)

    for (const propertyName of expectedPropertyNames) {
      const descriptor = Object.getOwnPropertyDescriptor(value, propertyName)

      if (!descriptor || !Object.hasOwn(descriptor, 'value')) {
        return { ok: false }
      }

      properties[propertyName] = descriptor.value
    }

    return { ok: true, properties }
  } catch {
    return { ok: false }
  }
}

function readOwnDataProperty(value, propertyName) {
  if (!isPlainObject(value)) return { ok: false }

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

function readDenseDataArray(
  value,
  { stringsOnly = false, allowNullPrototype = true } = {}
) {
  if (!isArray(value)) return { ok: false }

  try {
    const prototype = Object.getPrototypeOf(value)

    if (
      prototype !== Array.prototype &&
      (!allowNullPrototype || prototype !== null)
    ) {
      return { ok: false }
    }

    const lengthDescriptor = Object.getOwnPropertyDescriptor(value, 'length')

    if (
      !lengthDescriptor ||
      !Object.hasOwn(lengthDescriptor, 'value') ||
      !Number.isSafeInteger(lengthDescriptor.value) ||
      lengthDescriptor.value < 0
    ) {
      return { ok: false }
    }

    const length = lengthDescriptor.value
    const ownKeys = Reflect.ownKeys(value)

    if (ownKeys.length !== length + 1 || !ownKeys.includes('length')) {
      return { ok: false }
    }

    const values = []

    for (let index = 0; index < length; index += 1) {
      const propertyName = String(index)

      if (!ownKeys.includes(propertyName)) return { ok: false }

      const descriptor = Object.getOwnPropertyDescriptor(value, propertyName)

      if (!descriptor || !Object.hasOwn(descriptor, 'value')) {
        return { ok: false }
      }

      if (stringsOnly && typeof descriptor.value !== 'string') {
        return { ok: false }
      }

      values.push(descriptor.value)
    }

    return { ok: true, values }
  } catch {
    return { ok: false }
  }
}

function cloneEntry(entry) {
  return {
    id: entry.id,
    calendarDate: entry.calendarDate,
    title: entry.title,
    text: entry.text,
    tags: [...entry.tags],
  }
}

function deepFreeze(value, seen = new Set()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return value

  seen.add(value)

  try {
    for (const propertyName of Reflect.ownKeys(value)) {
      deepFreeze(value[propertyName], seen)
    }

    Object.freeze(value)
  } catch {
    return value
  }

  return value
}

function readEntrySnapshot(value) {
  const shape = readExactDataObject(value, ENTRY_PROPERTY_NAMES)

  if (!shape.ok) return { ok: false }

  const tagsShape = readDenseDataArray(shape.properties.tags, {
    stringsOnly: true,
  })

  if (!tagsShape.ok) return { ok: false }

  return {
    ok: true,
    value: {
      id: shape.properties.id,
      calendarDate: shape.properties.calendarDate,
      title: shape.properties.title,
      text: shape.properties.text,
      tags: tagsShape.values,
    },
    rawTags: shape.properties.tags,
  }
}

function readPrivateLogSnapshot(value) {
  const shape = readExactDataObject(value, LOG_PROPERTY_NAMES)

  if (!shape.ok) return { ok: false }

  const entriesShape = readDenseDataArray(shape.properties.entries)

  if (!entriesShape.ok) return { ok: false }

  const entries = []
  const rawTagArrays = []

  for (const rawEntry of entriesShape.values) {
    const entryShape = readEntrySnapshot(rawEntry)

    if (!entryShape.ok) return { ok: false }

    entries.push(entryShape.value)
    rawTagArrays.push(entryShape.rawTags)
  }

  const snapshot = {
    schemaVersion: shape.properties.schemaVersion,
    dataOrigin: shape.properties.dataOrigin,
    featuredEntryId: shape.properties.featuredEntryId,
    entries,
  }

  try {
    if (
      validateLichtwaldLog(snapshot).ok !== true ||
      snapshot.dataOrigin !== PRIVATE_DATA_ORIGIN
    ) {
      return { ok: false }
    }
  } catch {
    return { ok: false }
  }

  return {
    ok: true,
    value: deepFreeze(snapshot),
    rawEntries: entriesShape.values,
    rawTagArrays,
  }
}

function haveEqualTags(leftTags, rightTags) {
  return (
    leftTags.length === rightTags.length &&
    leftTags.every((tag, index) => tag === rightTags[index])
  )
}

function haveEqualEntries(leftEntry, rightEntry) {
  return (
    leftEntry.id === rightEntry.id &&
    leftEntry.calendarDate === rightEntry.calendarDate &&
    leftEntry.title === rightEntry.title &&
    leftEntry.text === rightEntry.text &&
    haveEqualTags(leftEntry.tags, rightEntry.tags)
  )
}

function findEntry(lichtwaldLog, entryId) {
  return lichtwaldLog?.entries.find((entry) => entry.id === entryId) ?? null
}

function hasEntry(lichtwaldLog, entryId) {
  return findEntry(lichtwaldLog, entryId) !== null
}

function createEmptyFormValues() {
  return {
    calendarDate: '',
    title: '',
    text: '',
    tags: [],
  }
}

function cloneFormValues(values) {
  return {
    calendarDate: values.calendarDate,
    title: values.title,
    text: values.text,
    tags: [...values.tags],
  }
}

function haveEqualFormValues(leftValues, rightValues) {
  return (
    leftValues.calendarDate === rightValues.calendarDate &&
    leftValues.title === rightValues.title &&
    leftValues.text === rightValues.text &&
    haveEqualTags(leftValues.tags, rightValues.tags)
  )
}

function createInitialState() {
  return {
    phase: 'loading',
    snapshot: null,
    searchQuery: '',
    calendarDateFilter: '',
    selectedTag: ALL_LICHTWALD_LOG_TAGS,
    availableTags: [],
    visibleEntryIds: [],
    hasActiveFilters: false,
    filteredEmptyState: false,
    selectedEntryId: null,
    form: null,
    deleteState: {
      entryId: null,
      isSubmitting: false,
      errorMessage: '',
    },
    featuredState: {
      isSubmitting: false,
      targetEntryId: null,
      errorMessage: '',
    },
    statusMessage: '',
    statusMessageTone: 'success',
    errorMessage: '',
  }
}

function normalizeFilterComparison(value) {
  return value.normalize('NFC').toLowerCase()
}

function hasActiveSearchQuery(searchQuery) {
  return normalizeFilterComparison(searchQuery.trim()).length > 0
}

function reconcileSelectedTag(selectedTag, availableTags) {
  if (selectedTag === ALL_LICHTWALD_LOG_TAGS) {
    return ALL_LICHTWALD_LOG_TAGS
  }

  const normalizedSelectedTag = normalizeFilterComparison(selectedTag)
  return availableTags.find(
    (tag) => normalizeFilterComparison(tag) === normalizedSelectedTag
  ) ?? ALL_LICHTWALD_LOG_TAGS
}

function deriveFilterState(
  snapshot,
  {
    searchQuery = '',
    calendarDateFilter = '',
    selectedTag = ALL_LICHTWALD_LOG_TAGS,
  } = {}
) {
  if (!snapshot || snapshot.entries.length === 0) {
    return {
      searchQuery: '',
      calendarDateFilter: '',
      selectedTag: ALL_LICHTWALD_LOG_TAGS,
      availableTags: [],
      visibleEntryIds: [],
      hasActiveFilters: false,
      filteredEmptyState: false,
    }
  }

  const availableTags = getLichtwaldLogFilterTags(snapshot.entries)
  const reconciledSelectedTag = reconcileSelectedTag(
    selectedTag,
    availableTags
  )
  const visibleEntries = filterLichtwaldLogEntries(snapshot.entries, {
    query: searchQuery,
    calendarDate: calendarDateFilter,
    tag: reconciledSelectedTag,
  })
  const visibleEntryIds = visibleEntries.map((entry) => entry.id)
  const hasActiveFilters = (
    hasActiveSearchQuery(searchQuery) ||
    calendarDateFilter !== '' ||
    reconciledSelectedTag !== ALL_LICHTWALD_LOG_TAGS
  )

  return {
    searchQuery,
    calendarDateFilter,
    selectedTag: reconciledSelectedTag,
    availableTags,
    visibleEntryIds,
    hasActiveFilters,
    filteredEmptyState:
      hasActiveFilters && visibleEntryIds.length === 0,
  }
}

function cloneFieldErrors(fieldErrors) {
  const clone = {}

  for (const fieldName of Object.keys(fieldErrors)) {
    if (Object.hasOwn(STATIC_FIELD_ERRORS, fieldName)) {
      clone[fieldName] = fieldErrors[fieldName]
    }
  }

  return clone
}

function cloneForm(form) {
  if (!form) return null

  return {
    type: form.type,
    entryId: form.entryId,
    values: cloneFormValues(form.values),
    fieldErrors: cloneFieldErrors(form.fieldErrors),
    errorMessage: form.errorMessage,
    isSubmitting: form.isSubmitting,
    isDirty: form.isDirty,
  }
}

function derivePhase(snapshot) {
  return snapshot?.entries.length > 0 ? 'ready' : 'empty'
}

function readPortMethod(port, methodName) {
  if ((typeof port !== 'object' && typeof port !== 'function') || port === null) {
    return null
  }

  try {
    const descriptor = Object.getOwnPropertyDescriptor(port, methodName)

    return descriptor &&
      Object.hasOwn(descriptor, 'value') &&
      typeof descriptor.value === 'function'
      ? descriptor.value
      : null
  } catch {
    return null
  }
}

function callPortMethod(port, methodName, args) {
  const method = readPortMethod(port, methodName)

  if (!method) return { ok: false }

  try {
    return { ok: true, value: Reflect.apply(method, port, args) }
  } catch {
    return { ok: false }
  }
}

function readFieldErrorNames(value) {
  if (!isPlainObject(value)) return { ok: false }

  try {
    const ownKeys = Reflect.ownKeys(value)

    if (ownKeys.some((propertyName) => typeof propertyName !== 'string')) {
      return { ok: false }
    }

    for (const propertyName of ownKeys) {
      const descriptor = Object.getOwnPropertyDescriptor(value, propertyName)

      if (!descriptor || !Object.hasOwn(descriptor, 'value')) {
        return { ok: false }
      }
    }

    return { ok: true, names: ownKeys }
  } catch {
    return { ok: false }
  }
}

function readFailureError(value, allowFieldErrors) {
  let shape = readExactDataObject(value, ERROR_PROPERTY_NAMES)

  if (!shape.ok && allowFieldErrors) {
    shape = readExactDataObject(value, ERROR_WITH_FIELDS_PROPERTY_NAMES)
  }

  if (
    !shape.ok ||
    typeof shape.properties.code !== 'string' ||
    typeof shape.properties.message !== 'string' ||
    shape.properties.message.length === 0
  ) {
    return { ok: false }
  }

  let fieldNames = []

  if (Object.hasOwn(shape.properties, 'fieldErrors')) {
    const fieldShape = readFieldErrorNames(shape.properties.fieldErrors)

    if (!fieldShape.ok) return { ok: false }
    fieldNames = fieldShape.names
  }

  return {
    ok: true,
    code: shape.properties.code,
    fieldNames,
    hasFieldErrors: Object.hasOwn(shape.properties, 'fieldErrors'),
  }
}

function parseLoadResult(result) {
  const successShape = readExactDataObject(
    result,
    LOAD_SUCCESS_PROPERTY_NAMES
  )

  if (successShape.ok) {
    const { ok, status, initialized, lichtwaldLog } = successShape.properties
    const logShape = readPrivateLogSnapshot(lichtwaldLog)

    if (
      ok !== true ||
      initialized !== false ||
      (status !== 'empty' && status !== 'loaded') ||
      !logShape.ok ||
      (
        status === 'empty' &&
        (
          logShape.value.entries.length !== 0 ||
          logShape.value.featuredEntryId !== null
        )
      )
    ) {
      return { ok: false }
    }

    return { ok: true, snapshot: logShape.value }
  }

  const failureShape = readExactDataObject(
    result,
    LOAD_FAILURE_PROPERTY_NAMES
  )

  if (!failureShape.ok) return { ok: false }

  const { ok, status, lichtwaldLog, error } = failureShape.properties

  if (
    ok !== false ||
    lichtwaldLog !== null ||
    typeof status !== 'string'
  ) {
    return { ok: false }
  }

  const errorShape = readFailureError(error, false)

  if (!errorShape.ok) return { ok: false }

  const pair = `${status}\0${errorShape.code}`

  if (!LOAD_FAILURE_PAIR_SET.has(pair)) return { ok: false }

  return { ok: false, recognizedFailure: true }
}

function parseMutationFailure(result, operation, targetEntryId) {
  const shape = readExactDataObject(result, MUTATION_FAILURE_PROPERTY_NAMES)

  if (!shape.ok) return null

  const { ok, status, changed, lichtwaldLog, error } = shape.properties
  const basicErrorShape = readFailureError(error, true)

  if (
    ok !== false ||
    changed !== false ||
    typeof status !== 'string' ||
    !basicErrorShape.ok
  ) {
    return null
  }

  const pair = `${status}\0${basicErrorShape.code}`
  const allowedPairs = MUTATION_FAILURE_PAIR_SETS[operation]

  if (!allowedPairs?.has(pair)) return null

  if (
    basicErrorShape.hasFieldErrors &&
    pair !== SERVICE_FAILURE_PAIRS.invalidInput
  ) {
    return null
  }

  let snapshot = null

  if (lichtwaldLog !== null) {
    const logShape = readPrivateLogSnapshot(lichtwaldLog)

    if (!logShape.ok) return null
    snapshot = logShape.value
  }

  if (
    pair === SERVICE_FAILURE_PAIRS.notFound &&
    (
      typeof targetEntryId !== 'string' ||
      (snapshot !== null && hasEntry(snapshot, targetEntryId))
    )
  ) {
    return null
  }

  const requiresExistingTarget = (
    operation === 'update' ||
    operation === 'delete' ||
    (operation === 'featured' && typeof targetEntryId === 'string')
  )

  if (
    pair !== SERVICE_FAILURE_PAIRS.notFound &&
    snapshot !== null &&
    requiresExistingTarget &&
    !hasEntry(snapshot, targetEntryId)
  ) {
    return null
  }

  return {
    pair,
    snapshot,
    fieldNames: basicErrorShape.fieldNames,
  }
}

function parseCreateSuccess(result) {
  const shape = readExactDataObject(result, CREATE_SUCCESS_PROPERTY_NAMES)

  if (!shape.ok) return null

  const { ok, status, changed, createdEntry, lichtwaldLog } = shape.properties
  const entryShape = readEntrySnapshot(createdEntry)
  const logShape = readPrivateLogSnapshot(lichtwaldLog)

  if (
    ok !== true ||
    status !== 'entryCreated' ||
    changed !== true ||
    !entryShape.ok ||
    !logShape.ok ||
    logShape.value.entries.length === 0
  ) {
    return null
  }

  const lastIndex = logShape.value.entries.length - 1
  const lastEntry = logShape.value.entries[lastIndex]

  if (
    !haveEqualEntries(entryShape.value, lastEntry) ||
    createdEntry === logShape.rawEntries[lastIndex] ||
    entryShape.rawTags === logShape.rawTagArrays[lastIndex]
  ) {
    return null
  }

  return {
    snapshot: logShape.value,
    entryId: entryShape.value.id,
  }
}

function parseUpdateSuccess(result, targetEntryId) {
  const shape = readExactDataObject(result, UPDATE_SUCCESS_PROPERTY_NAMES)

  if (!shape.ok) return null

  const { ok, status, changed, updatedEntry, lichtwaldLog } = shape.properties
  const entryShape = readEntrySnapshot(updatedEntry)
  const logShape = readPrivateLogSnapshot(lichtwaldLog)

  if (
    ok !== true ||
    status !== 'entryUpdated' ||
    typeof changed !== 'boolean' ||
    !entryShape.ok ||
    !logShape.ok ||
    entryShape.value.id !== targetEntryId
  ) {
    return null
  }

  const storedEntryIndex = logShape.value.entries.findIndex(
    (entry) => entry.id === targetEntryId
  )
  const storedEntry = logShape.value.entries[storedEntryIndex]

  if (
    !storedEntry ||
    !haveEqualEntries(entryShape.value, storedEntry) ||
    updatedEntry === logShape.rawEntries[storedEntryIndex] ||
    entryShape.rawTags === logShape.rawTagArrays[storedEntryIndex]
  ) {
    return null
  }

  return { snapshot: logShape.value, changed }
}

function parseDeleteSuccess(result, targetEntryId) {
  const shape = readExactDataObject(result, DELETE_SUCCESS_PROPERTY_NAMES)

  if (!shape.ok) return null

  const {
    ok,
    status,
    changed,
    deletedEntryId,
    focusCleared,
    lichtwaldLog,
  } = shape.properties
  const logShape = readPrivateLogSnapshot(lichtwaldLog)

  if (
    ok !== true ||
    status !== 'entryDeleted' ||
    changed !== true ||
    deletedEntryId !== targetEntryId ||
    typeof focusCleared !== 'boolean' ||
    !logShape.ok ||
    hasEntry(logShape.value, targetEntryId) ||
    (focusCleared && logShape.value.featuredEntryId !== null)
  ) {
    return null
  }

  return { snapshot: logShape.value }
}

function parseFeaturedSuccess(result, requestedEntryId) {
  const shape = readExactDataObject(result, FEATURED_SUCCESS_PROPERTY_NAMES)

  if (!shape.ok) return null

  const {
    ok,
    status,
    changed,
    featuredEntryId,
    lichtwaldLog,
  } = shape.properties
  const logShape = readPrivateLogSnapshot(lichtwaldLog)

  if (
    ok !== true ||
    status !== 'featuredEntryUpdated' ||
    typeof changed !== 'boolean' ||
    featuredEntryId !== requestedEntryId ||
    !logShape.ok ||
    logShape.value.featuredEntryId !== requestedEntryId ||
    (
      requestedEntryId !== null &&
      !hasEntry(logShape.value, requestedEntryId)
    )
  ) {
    return null
  }

  return { snapshot: logShape.value, changed }
}

function getMutationErrorMessage(operation, failure) {
  if (!failure) return GENERIC_MUTATION_MESSAGES[operation]

  if (failure.pair === SERVICE_FAILURE_PAIRS.limitReached) {
    return 'Das LichtwaldLog kann keine weiteren Einträge aufnehmen.'
  }

  if (failure.pair === SERVICE_FAILURE_PAIRS.generationFailed) {
    return 'Für den LichtwaldLog-Eintrag konnte keine sichere ID erzeugt werden.'
  }

  if (failure.pair === SERVICE_FAILURE_PAIRS.notFound) {
    return 'Der angeforderte LichtwaldLog-Eintrag ist nicht mehr vorhanden.'
  }

  if (failure.pair === SERVICE_FAILURE_PAIRS.invalidState) {
    return 'Die LichtwaldLog-Änderung ergab keinen gültigen Gesamtzustand.'
  }

  if (
    failure.pair.includes('quotaExceeded') ||
    failure.pair.includes('storageQuotaExceeded')
  ) {
    return 'Der lokale Speicher besitzt nicht genügend freien Platz für diese Änderung.'
  }

  if (
    failure.pair.includes('readFailed') ||
    failure.pair.includes('invalidJson') ||
    failure.pair.includes('invalidStoredData') ||
    failure.pair.includes('sizeLimitExceeded')
  ) {
    return 'Der aktuelle LichtwaldLog-Bestand konnte nicht sicher gelesen werden.'
  }

  if (
    failure.pair.includes('unavailable') ||
    failure.pair.includes('invalidKey') ||
    failure.pair.includes('invalidLimit')
  ) {
    return 'Der lokale LichtwaldLog-Speicher ist derzeit nicht verfügbar.'
  }

  return GENERIC_MUTATION_MESSAGES[operation]
}

function getStaticFieldErrors(fieldNames) {
  const fieldErrors = {}

  for (const fieldName of fieldNames) {
    if (Object.hasOwn(STATIC_FIELD_ERRORS, fieldName)) {
      fieldErrors[fieldName] = STATIC_FIELD_ERRORS[fieldName]
    }
  }

  return fieldErrors
}

function getCallableGlobal(propertyName) {
  try {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, propertyName)
    return descriptor &&
      Object.hasOwn(descriptor, 'value') &&
      typeof descriptor.value === 'function'
      ? descriptor.value
      : null
  } catch {
    return null
  }
}

function scheduleAfterPaint(callback) {
  const requestFrame = getCallableGlobal('requestAnimationFrame')
  const cancelFrame = getCallableGlobal('cancelAnimationFrame')

  if (requestFrame && cancelFrame) {
    let secondFrameId = null
    const firstFrameId = Reflect.apply(requestFrame, globalThis, [() => {
      try {
        secondFrameId = Reflect.apply(requestFrame, globalThis, [callback])
      } catch {
        try {
          callback()
        } catch {
          return
        }
      }
    }])

    return () => {
      try {
        Reflect.apply(cancelFrame, globalThis, [firstFrameId])

        if (secondFrameId !== null) {
          Reflect.apply(cancelFrame, globalThis, [secondFrameId])
        }
      } catch {
        return undefined
      }

      return undefined
    }
  }

  const setTimeoutMethod = getCallableGlobal('setTimeout')
  const clearTimeoutMethod = getCallableGlobal('clearTimeout')

  if (!setTimeoutMethod || !clearTimeoutMethod) {
    throw new Error('schedulerUnavailable')
  }

  const timeoutId = Reflect.apply(setTimeoutMethod, globalThis, [callback, 0])

  return () => {
    try {
      Reflect.apply(clearTimeoutMethod, globalThis, [timeoutId])
    } catch {
      return undefined
    }

    return undefined
  }
}

function isSafelyPassablePrimitive(value) {
  return (
    value === null ||
    ['string', 'number', 'boolean', 'bigint', 'undefined'].includes(
      typeof value
    )
  )
}

function readSubmittedField(value, propertyName) {
  const propertyResult = readOwnDataProperty(value, propertyName)

  if (!propertyResult.ok) return { ok: false }

  const fieldValue = propertyResult.value

  if (isSafelyPassablePrimitive(fieldValue)) {
    return { ok: true, value: fieldValue }
  }

  if (propertyName !== 'tags') return { ok: false }

  const tagsShape = readDenseDataArray(fieldValue, {
    allowNullPrototype: false,
  })

  if (
    !tagsShape.ok ||
    tagsShape.values.some((tag) => !isSafelyPassablePrimitive(tag))
  ) {
    return { ok: false }
  }

  return { ok: true, value: tagsShape.values }
}

function readFormSubmission(submittedValues, form) {
  if (!isPlainObject(submittedValues) || !form) return { ok: false }

  const typeResult = readOwnDataProperty(submittedValues, 'type')

  if (!typeResult.ok || typeResult.value !== form.type) {
    return { ok: false }
  }

  if (form.type === FORM_TYPES.UPDATE) {
    const entryIdResult = readOwnDataProperty(submittedValues, 'entryId')

    if (!entryIdResult.ok || entryIdResult.value !== form.entryId) {
      return { ok: false }
    }
  }

  const serviceValues = Object.create(null)

  for (const fieldName of FORM_FIELD_NAMES) {
    const fieldResult = readSubmittedField(submittedValues, fieldName)

    if (!fieldResult.ok) return { ok: false }
    serviceValues[fieldName] = fieldResult.value
  }

  const projectedValues = cloneFormValues(form.values)

  for (const fieldName of ['calendarDate', 'title', 'text']) {
    if (typeof serviceValues[fieldName] === 'string') {
      projectedValues[fieldName] = serviceValues[fieldName]
    }
  }

  if (
    isArray(serviceValues.tags) &&
    serviceValues.tags.every((tag) => typeof tag === 'string')
  ) {
    projectedValues.tags = [...serviceValues.tags]
  }

  return {
    ok: true,
    serviceInput: {
      calendarDate: serviceValues.calendarDate,
      title: serviceValues.title,
      text: serviceValues.text,
      tags: isArray(serviceValues.tags)
        ? [...serviceValues.tags]
        : serviceValues.tags,
    },
    projectedValues,
  }
}

function cloneServiceInput(serviceInput) {
  return {
    calendarDate: serviceInput.calendarDate,
    title: serviceInput.title,
    text: serviceInput.text,
    tags: isArray(serviceInput.tags)
      ? [...serviceInput.tags]
      : serviceInput.tags,
  }
}

function readControllerOption(options, propertyName) {
  if (!isPlainObject(options)) {
    return { present: false, valid: false }
  }

  try {
    const descriptor = Object.getOwnPropertyDescriptor(options, propertyName)

    if (!descriptor) return { present: false, valid: true }

    if (!Object.hasOwn(descriptor, 'value')) {
      return { present: true, valid: false }
    }

    return { present: true, valid: true, value: descriptor.value }
  } catch {
    return { present: true, valid: false }
  }
}

export function createLichtwaldLogController(options = {}) {
  const serviceOption = readControllerOption(
    options,
    'lichtwaldLogService'
  )
  const viewOption = readControllerOption(options, 'lichtwaldLogView')
  const scheduleOption = readControllerOption(options, 'scheduleTask')
  const lichtwaldLogService = serviceOption.valid
    ? serviceOption.value
    : undefined
  const lichtwaldLogView = viewOption.valid
    ? viewOption.value
    : undefined
  const scheduleTask = (
    !scheduleOption.present ||
    (scheduleOption.valid && scheduleOption.value === undefined)
  )
    ? scheduleAfterPaint
    : (
        scheduleOption.valid
          ? scheduleOption.value
          : null
      )
  let isActive = false
  let isClosing = false
  let state = createInitialState()
  let formBaseline = null
  let lifecycleSequence = 0
  let activeLifecycleToken = 0
  let loadSequence = 0
  let activeLoadToken = 0
  let operationSequence = 0
  let activeOperationToken = 0
  let cancelScheduledLoad = null

  const actions = Object.freeze({
    onRetryLoad: retryLoad,
    onSelectEntry: selectEntry,
    onBackToOverview: backToOverview,
    onOpenCreateEntryForm: openCreateEntryForm,
    onOpenUpdateEntryForm: openUpdateEntryForm,
    onUpdateFormField: updateFormField,
    onSubmitForm: submitForm,
    onCancelForm: cancelForm,
    onRequestDeleteEntry: requestDeleteEntry,
    onCancelDeleteEntry: cancelDeleteEntry,
    onConfirmDeleteEntry: confirmDeleteEntry,
    onSetFeaturedEntry: setFeaturedEntry,
    onChangeSearchQuery: changeSearchQuery,
    onChangeCalendarDateFilter: changeCalendarDateFilter,
    onChangeTagFilter: changeTagFilter,
    onResetFilters: resetFilters,
  })

  function createSafeFocusTarget(focusTarget) {
    if (
      !focusTarget ||
      typeof focusTarget.type !== 'string' ||
      !FOCUS_TARGET_TYPES.has(focusTarget.type)
    ) {
      return null
    }

    const safeTarget = { type: focusTarget.type }

    if (
      typeof focusTarget.fieldName === 'string' &&
      Object.hasOwn(STATIC_FIELD_ERRORS, focusTarget.fieldName)
    ) {
      safeTarget.fieldName = focusTarget.fieldName
    }

    if (
      typeof focusTarget.entryId === 'string' &&
      state.snapshot &&
      hasEntry(state.snapshot, focusTarget.entryId)
    ) {
      safeTarget.entryId = focusTarget.entryId
    }

    return safeTarget
  }

  function createViewModel(focusTarget) {
    const entries = state.snapshot
      ? state.snapshot.entries.map(cloneEntry)
      : []

    return deepFreeze({
      phase: state.phase,
      entries,
      visibleEntryIds: [...state.visibleEntryIds],
      availableTags: [...state.availableTags],
      searchQuery: state.searchQuery,
      calendarDateFilter: state.calendarDateFilter,
      selectedTag: state.selectedTag,
      hasActiveFilters: state.hasActiveFilters,
      filteredEmptyState: state.filteredEmptyState,
      featuredEntryId: state.snapshot?.featuredEntryId ?? null,
      selectedEntryId: state.selectedEntryId,
      form: cloneForm(state.form),
      deleteState: {
        entryId: state.deleteState.entryId,
        isSubmitting: state.deleteState.isSubmitting,
        errorMessage: state.deleteState.errorMessage,
      },
      featuredState: {
        isSubmitting: state.featuredState.isSubmitting,
        targetEntryId: state.featuredState.targetEntryId,
        errorMessage: state.featuredState.errorMessage,
      },
      statusMessage: state.statusMessage,
      statusMessageTone: state.statusMessageTone,
      errorMessage: state.errorMessage,
      focusTarget: createSafeFocusTarget(focusTarget),
    })
  }

  function render(focusTarget = null) {
    if (!isActive) return

    const viewModel = createViewModel(focusTarget)
    callPortMethod(lichtwaldLogView, 'render', [viewModel, actions])
  }

  function callService(methodName, args) {
    return callPortMethod(lichtwaldLogService, methodName, args).value ?? null
  }

  function safelyCancelScheduledLoad() {
    const cancel = cancelScheduledLoad
    cancelScheduledLoad = null
    activeLoadToken = 0

    if (typeof cancel !== 'function') return

    try {
      Reflect.apply(cancel, undefined, [])
    } catch {
      return
    }
  }

  function reconcileStateWithSnapshot(
    snapshot,
    { resetFilters = false } = {}
  ) {
    const selectedEntryId = (
      state.selectedEntryId !== null &&
      hasEntry(snapshot, state.selectedEntryId)
    )
      ? state.selectedEntryId
      : null
    const hasDeleteTarget = (
      state.deleteState.entryId !== null &&
      hasEntry(snapshot, state.deleteState.entryId)
    )
    const hasFeaturedTarget = (
      state.featuredState.targetEntryId !== null &&
      hasEntry(snapshot, state.featuredState.targetEntryId)
    )
    const filterState = deriveFilterState(
      snapshot,
      resetFilters
        ? undefined
        : {
            searchQuery: state.searchQuery,
            calendarDateFilter: state.calendarDateFilter,
            selectedTag: state.selectedTag,
          }
    )

    state = {
      ...state,
      snapshot,
      ...filterState,
      selectedEntryId,
      deleteState: hasDeleteTarget
        ? { ...state.deleteState }
        : {
            entryId: null,
            isSubmitting: false,
            errorMessage: '',
          },
      featuredState: hasFeaturedTarget
        ? { ...state.featuredState }
        : {
            ...state.featuredState,
            targetEntryId: null,
          },
    }
  }

  function finishLoad(lifecycleToken, loadToken, callbackState) {
    if (callbackState.consumed) return
    callbackState.consumed = true

    if (
      !isActive ||
      activeLifecycleToken !== lifecycleToken ||
      activeLoadToken !== loadToken
    ) {
      return
    }

    cancelScheduledLoad = null
    activeLoadToken = 0
    const result = callService('loadLog', [])

    if (
      !isActive ||
      activeLifecycleToken !== lifecycleToken ||
      activeLoadToken !== 0
    ) {
      return
    }

    const parsedResult = parseLoadResult(result)

    if (
      !isActive ||
      activeLifecycleToken !== lifecycleToken ||
      activeLoadToken !== 0
    ) {
      return
    }

    if (parsedResult.ok) {
      state = {
        ...createInitialState(),
        phase: derivePhase(parsedResult.snapshot),
      }
      reconcileStateWithSnapshot(parsedResult.snapshot, {
        resetFilters: true,
      })
      formBaseline = null
      render({ type: 'heading' })
      return
    }

    state = {
      ...createInitialState(),
      phase: 'loadError',
      errorMessage: LOAD_ERROR_MESSAGE,
    }
    formBaseline = null
    render({ type: 'heading' })
  }

  function beginLoad() {
    const lifecycleToken = activeLifecycleToken
    const loadToken = ++loadSequence
    safelyCancelScheduledLoad()

    if (
      !isActive ||
      activeLifecycleToken !== lifecycleToken ||
      loadSequence !== loadToken
    ) {
      return
    }

    activeLoadToken = loadToken
    state = createInitialState()
    formBaseline = null
    render()

    if (
      !isActive ||
      activeLifecycleToken !== lifecycleToken ||
      activeLoadToken !== loadToken
    ) {
      return
    }

    const callbackState = { consumed: false }
    const callback = () => finishLoad(
      lifecycleToken,
      loadToken,
      callbackState
    )
    let scheduledCancel

    try {
      if (typeof scheduleTask !== 'function') {
        throw new TypeError('schedulerUnavailable')
      }

      scheduledCancel = scheduleTask(callback)
    } catch {
      if (
        !callbackState.consumed &&
        isActive &&
        activeLifecycleToken === lifecycleToken &&
        activeLoadToken === loadToken
      ) {
        activeLoadToken = 0
        state = {
          ...createInitialState(),
          phase: 'loadError',
          errorMessage: LOAD_ERROR_MESSAGE,
        }
        render({ type: 'heading' })
      }

      return
    }

    if (
      !callbackState.consumed &&
      isActive &&
      activeLifecycleToken === lifecycleToken &&
      activeLoadToken === loadToken &&
      typeof scheduledCancel === 'function'
    ) {
      cancelScheduledLoad = scheduledCancel
    }
  }

  function retryLoad() {
    if (!isActive || isClosing || state.phase !== 'loadError') return
    beginLoad()
  }

  function canUseSnapshot() {
    return (
      isActive &&
      !isClosing &&
      state.snapshot !== null &&
      (state.phase === 'ready' || state.phase === 'empty') &&
      activeOperationToken === 0
    )
  }

  function hasBlockingInteraction() {
    return (
      state.form !== null ||
      state.deleteState.entryId !== null ||
      state.featuredState.isSubmitting
    )
  }

  function canChangeFilters() {
    return (
      canUseSnapshot() &&
      state.snapshot.entries.length > 0 &&
      state.selectedEntryId === null &&
      !hasBlockingInteraction()
    )
  }

  function applyFilterState(nextFilterState, focusType) {
    state = {
      ...state,
      ...deriveFilterState(state.snapshot, nextFilterState),
      statusMessage: '',
    }
    render({ type: focusType })
  }

  function changeSearchQuery(searchQuery) {
    if (
      !canChangeFilters() ||
      typeof searchQuery !== 'string' ||
      searchQuery.length > LICHTWALD_LOG_SEARCH_QUERY_MAX_LENGTH ||
      searchQuery === state.searchQuery
    ) {
      return
    }

    applyFilterState(
      {
        searchQuery,
        calendarDateFilter: state.calendarDateFilter,
        selectedTag: state.selectedTag,
      },
      'searchInput'
    )
  }

  function changeCalendarDateFilter(calendarDateOrEmpty) {
    if (
      !canChangeFilters() ||
      typeof calendarDateOrEmpty !== 'string' ||
      (
        calendarDateOrEmpty !== '' &&
        !isValidCalendarDate(calendarDateOrEmpty)
      ) ||
      calendarDateOrEmpty === state.calendarDateFilter
    ) {
      return
    }

    applyFilterState(
      {
        searchQuery: state.searchQuery,
        calendarDateFilter: calendarDateOrEmpty,
        selectedTag: state.selectedTag,
      },
      'calendarDateFilter'
    )
  }

  function changeTagFilter(tagOrAllTags) {
    if (
      !canChangeFilters() ||
      typeof tagOrAllTags !== 'string' ||
      (
        tagOrAllTags !== ALL_LICHTWALD_LOG_TAGS &&
        !state.availableTags.includes(tagOrAllTags)
      ) ||
      tagOrAllTags === state.selectedTag
    ) {
      return
    }

    applyFilterState(
      {
        searchQuery: state.searchQuery,
        calendarDateFilter: state.calendarDateFilter,
        selectedTag: tagOrAllTags,
      },
      'tagFilter'
    )
  }

  function resetFilters() {
    if (
      !canChangeFilters() ||
      (
        state.searchQuery === '' &&
        state.calendarDateFilter === '' &&
        state.selectedTag === ALL_LICHTWALD_LOG_TAGS
      )
    ) {
      return
    }

    applyFilterState(
      {
        searchQuery: '',
        calendarDateFilter: '',
        selectedTag: ALL_LICHTWALD_LOG_TAGS,
      },
      'searchInput'
    )
  }

  function selectEntry(entryId) {
    if (
      !canUseSnapshot() ||
      hasBlockingInteraction() ||
      state.selectedEntryId !== null ||
      typeof entryId !== 'string' ||
      !hasEntry(state.snapshot, entryId) ||
      !state.visibleEntryIds.includes(entryId)
    ) {
      return
    }

    state = { ...state, selectedEntryId: entryId }
    render({ type: 'entry', entryId })
  }

  function backToOverview() {
    if (
      !canUseSnapshot() ||
      hasBlockingInteraction() ||
      state.selectedEntryId === null
    ) {
      return
    }

    state = { ...state, selectedEntryId: null }
    render({ type: 'heading' })
  }

  function createForm(type, entryId, values) {
    return {
      type,
      entryId,
      values: cloneFormValues(values),
      fieldErrors: {},
      errorMessage: '',
      isSubmitting: false,
      isDirty: false,
    }
  }

  function openCreateEntryForm() {
    if (!canUseSnapshot() || hasBlockingInteraction()) return

    const values = createEmptyFormValues()
    formBaseline = deepFreeze(cloneFormValues(values))
    state = {
      ...state,
      form: createForm(FORM_TYPES.CREATE, null, values),
      statusMessage: '',
      errorMessage: '',
      featuredState: {
        isSubmitting: false,
        targetEntryId: null,
        errorMessage: '',
      },
    }
    render({ type: 'formField', fieldName: 'calendarDate' })
  }

  function openUpdateEntryForm(entryId) {
    if (
      !canUseSnapshot() ||
      hasBlockingInteraction() ||
      typeof entryId !== 'string'
    ) {
      return
    }

    const entry = findEntry(state.snapshot, entryId)

    if (!entry) return

    const values = {
      calendarDate: entry.calendarDate,
      title: entry.title,
      text: entry.text,
      tags: [...entry.tags],
    }
    formBaseline = deepFreeze(cloneFormValues(values))
    state = {
      ...state,
      form: createForm(FORM_TYPES.UPDATE, entryId, values),
      statusMessage: '',
      errorMessage: '',
      featuredState: {
        isSubmitting: false,
        targetEntryId: null,
        errorMessage: '',
      },
    }
    render({ type: 'formField', fieldName: 'calendarDate' })
  }

  function readUpdatedFieldValue(fieldName, value) {
    if (fieldName === 'tags') {
      return readDenseDataArray(value, {
        stringsOnly: true,
        allowNullPrototype: false,
      })
    }

    return typeof value === 'string'
      ? { ok: true, values: value }
      : { ok: false }
  }

  function updateFormField(fieldName, value) {
    if (
      !canUseSnapshot() ||
      !state.form ||
      state.form.isSubmitting ||
      !FORM_FIELD_NAME_SET.has(fieldName)
    ) {
      return
    }

    const lifecycleToken = activeLifecycleToken
    const formAtEntry = state.form
    const valueResult = readUpdatedFieldValue(fieldName, value)

    if (!valueResult.ok) return

    if (
      !canUseSnapshot() ||
      activeLifecycleToken !== lifecycleToken ||
      state.form !== formAtEntry
    ) {
      return
    }

    const nextValue = fieldName === 'tags'
      ? [...valueResult.values]
      : valueResult.values
    const values = {
      ...cloneFormValues(state.form.values),
      [fieldName]: nextValue,
    }
    const fieldErrors = cloneFieldErrors(state.form.fieldErrors)
    delete fieldErrors[fieldName]
    delete fieldErrors.form
    state = {
      ...state,
      form: {
        ...state.form,
        values,
        fieldErrors,
        errorMessage: '',
        isDirty: !haveEqualFormValues(values, formBaseline),
      },
    }
    render({ type: 'formField', fieldName })
  }

  function cancelForm() {
    if (
      !canUseSnapshot() ||
      !state.form ||
      state.form.isSubmitting
    ) {
      return
    }

    const cancelledForm = state.form
    formBaseline = null
    state = {
      ...state,
      form: null,
      errorMessage: '',
    }
    render(
      cancelledForm.entryId && hasEntry(state.snapshot, cancelledForm.entryId)
        ? { type: 'formTrigger', entryId: cancelledForm.entryId }
        : { type: 'formTrigger' }
    )
  }

  function beginOperation(updateBusyState) {
    const operationToken = ++operationSequence
    activeOperationToken = operationToken
    state = updateBusyState(state)
    render()
    return operationToken
  }

  function isCurrentOperation(operationToken) {
    return isActive && activeOperationToken === operationToken
  }

  function finishOperation(operationToken) {
    if (!isCurrentOperation(operationToken)) return false
    activeOperationToken = 0
    return true
  }

  function restoreReadyPhase() {
    state = {
      ...state,
      phase: derivePhase(state.snapshot),
    }
  }

  function adoptFailureSnapshot(failure) {
    if (failure?.snapshot) {
      reconcileStateWithSnapshot(failure.snapshot)
    }
  }

  function setMalformedFormFeedback() {
    if (!state.form) return

    state = {
      ...state,
      form: {
        ...state.form,
        fieldErrors: { form: MALFORMED_FORM_MESSAGE },
        errorMessage: MALFORMED_FORM_MESSAGE,
        isSubmitting: false,
      },
    }
    render({ type: 'formAlert' })
  }

  function submitForm(submittedValues) {
    if (
      !canUseSnapshot() ||
      !state.form ||
      state.form.isSubmitting
    ) {
      return
    }

    if (
      state.form.type === FORM_TYPES.UPDATE &&
      !hasEntry(state.snapshot, state.form.entryId)
    ) {
      setMalformedFormFeedback()
      return
    }

    const lifecycleToken = activeLifecycleToken
    const formAtEntry = state.form
    const submission = readFormSubmission(submittedValues, formAtEntry)

    if (!submission.ok) {
      if (
        !isActive ||
        activeLifecycleToken !== lifecycleToken ||
        state.form !== formAtEntry
      ) {
        return
      }

      setMalformedFormFeedback()
      return
    }

    if (
      !canUseSnapshot() ||
      activeLifecycleToken !== lifecycleToken ||
      state.form !== formAtEntry
    ) {
      return
    }

    const submittedForm = {
      ...state.form,
      values: cloneFormValues(submission.projectedValues),
      fieldErrors: {},
      errorMessage: '',
      isDirty: !haveEqualFormValues(
        submission.projectedValues,
        formBaseline
      ),
    }
    const operationForm = cloneForm(submittedForm)
    const operationToken = beginOperation((currentState) => ({
      ...currentState,
      phase: 'mutating',
      form: {
        ...submittedForm,
        isSubmitting: true,
      },
      statusMessage: '',
      errorMessage: '',
    }))
    const serviceInput = cloneServiceInput(submission.serviceInput)
    const result = operationForm.type === FORM_TYPES.CREATE
      ? callService('createEntry', [serviceInput])
      : callService('updateEntry', [
          operationForm.entryId,
          serviceInput,
        ])

    if (!finishOperation(operationToken)) return

    if (operationForm.type === FORM_TYPES.CREATE) {
      const success = parseCreateSuccess(result)

      if (success) {
        state = {
          ...state,
          form: null,
          deleteState: {
            entryId: null,
            isSubmitting: false,
            errorMessage: '',
          },
          featuredState: {
            isSubmitting: false,
            targetEntryId: null,
            errorMessage: '',
          },
          statusMessage: SUCCESS_MESSAGES.create,
          statusMessageTone: 'success',
          errorMessage: '',
        }
        reconcileStateWithSnapshot(success.snapshot)
        state = {
          ...state,
          phase: derivePhase(success.snapshot),
          selectedEntryId: success.entryId,
        }
        formBaseline = null
        render({ type: 'entry', entryId: success.entryId })
        return
      }

      completeFormFailure(
        operationToken,
        operationForm,
        result,
        'create'
      )
      return
    }

    const success = parseUpdateSuccess(result, operationForm.entryId)

    if (success) {
      state = {
        ...state,
        form: null,
        deleteState: {
          entryId: null,
          isSubmitting: false,
          errorMessage: '',
        },
        featuredState: {
          isSubmitting: false,
          targetEntryId: null,
          errorMessage: '',
        },
        statusMessage: success.changed
          ? SUCCESS_MESSAGES.update
          : NO_CHANGES_MESSAGE,
        statusMessageTone: success.changed ? 'success' : 'notice',
        errorMessage: '',
      }
      reconcileStateWithSnapshot(success.snapshot)
      state = {
        ...state,
        phase: derivePhase(success.snapshot),
      }
      formBaseline = null
      render({ type: 'status' })
      return
    }

    completeFormFailure(
      operationToken,
      operationForm,
      result,
      'update'
    )
  }

  function completeFormFailure(
    operationToken,
    operationForm,
    result,
    operation
  ) {
    if (activeOperationToken !== 0 || operationToken <= 0) return

    const failure = parseMutationFailure(
      result,
      operation,
      operationForm.entryId
    )
    adoptFailureSnapshot(failure)
    const fieldErrors = failure?.pair === SERVICE_FAILURE_PAIRS.invalidInput
      ? getStaticFieldErrors(failure.fieldNames)
      : {}
    const hasFieldErrors = Object.keys(fieldErrors).length > 0
    state = {
      ...state,
      form: {
        ...operationForm,
        values: cloneFormValues(operationForm.values),
        fieldErrors,
        errorMessage: hasFieldErrors
          ? 'Bitte korrigiere die markierten LichtwaldLog-Felder.'
          : getMutationErrorMessage(operation, failure),
        isSubmitting: false,
      },
      statusMessage: '',
      errorMessage: '',
    }
    restoreReadyPhase()
    const firstFieldName = FORM_FIELD_NAMES.find((fieldName) =>
      Object.hasOwn(fieldErrors, fieldName)
    )
    render(
      firstFieldName
        ? { type: 'formField', fieldName: firstFieldName }
        : { type: 'formAlert' }
    )
  }

  function requestDeleteEntry(entryId) {
    if (
      !canUseSnapshot() ||
      state.form ||
      state.deleteState.entryId !== null ||
      state.featuredState.isSubmitting ||
      typeof entryId !== 'string' ||
      !hasEntry(state.snapshot, entryId)
    ) {
      return
    }

    state = {
      ...state,
      deleteState: {
        entryId,
        isSubmitting: false,
        errorMessage: '',
      },
      statusMessage: '',
      errorMessage: '',
    }
    render({ type: 'deleteConfirmation', entryId })
  }

  function cancelDeleteEntry() {
    if (
      !canUseSnapshot() ||
      state.deleteState.entryId === null ||
      state.deleteState.isSubmitting
    ) {
      return
    }

    const entryId = state.deleteState.entryId
    state = {
      ...state,
      deleteState: {
        entryId: null,
        isSubmitting: false,
        errorMessage: '',
      },
    }
    render(
      hasEntry(state.snapshot, entryId)
        ? { type: 'entry', entryId }
        : { type: 'heading' }
    )
  }

  function confirmDeleteEntry(entryId) {
    if (
      !canUseSnapshot() ||
      state.form ||
      state.deleteState.entryId === null ||
      state.deleteState.isSubmitting ||
      entryId !== state.deleteState.entryId ||
      !hasEntry(state.snapshot, entryId)
    ) {
      return
    }

    const operationToken = beginOperation((currentState) => ({
      ...currentState,
      phase: 'mutating',
      deleteState: {
        entryId,
        isSubmitting: true,
        errorMessage: '',
      },
      statusMessage: '',
      errorMessage: '',
    }))
    const result = callService('deleteEntry', [entryId])

    if (!finishOperation(operationToken)) return

    const success = parseDeleteSuccess(result, entryId)

    if (success) {
      state = {
        ...state,
        deleteState: {
          entryId: null,
          isSubmitting: false,
          errorMessage: '',
        },
        featuredState: {
          isSubmitting: false,
          targetEntryId: null,
          errorMessage: '',
        },
        statusMessage: SUCCESS_MESSAGES.delete,
        statusMessageTone: 'success',
        errorMessage: '',
      }
      reconcileStateWithSnapshot(success.snapshot)
      state = {
        ...state,
        phase: derivePhase(success.snapshot),
      }
      render({ type: 'status' })
      return
    }

    const failure = parseMutationFailure(result, 'delete', entryId)
    adoptFailureSnapshot(failure)
    const targetStillExists = hasEntry(state.snapshot, entryId)
    const targetRemainsActionable = (
      targetStillExists &&
      (
        state.selectedEntryId === entryId ||
        state.visibleEntryIds.includes(entryId)
      )
    )
    const errorMessage = getMutationErrorMessage('delete', failure)
    state = {
      ...state,
      deleteState: targetRemainsActionable
        ? {
            entryId,
            isSubmitting: false,
            errorMessage,
          }
        : {
            entryId: null,
            isSubmitting: false,
            errorMessage: '',
          },
      statusMessage: '',
      errorMessage: targetRemainsActionable ? '' : errorMessage,
    }
    restoreReadyPhase()
    render(
      targetRemainsActionable
        ? { type: 'deleteAlert', entryId }
        : { type: 'heading' }
    )
  }

  function setFeaturedEntry(entryIdOrNull) {
    const hasValidTarget = (
      entryIdOrNull === null ||
      (
        typeof entryIdOrNull === 'string' &&
        hasEntry(state.snapshot, entryIdOrNull)
      )
    )

    if (
      !canUseSnapshot() ||
      state.form ||
      state.deleteState.entryId !== null ||
      state.featuredState.isSubmitting ||
      !hasValidTarget
    ) {
      return
    }

    const operationToken = beginOperation((currentState) => ({
      ...currentState,
      phase: 'mutating',
      featuredState: {
        isSubmitting: true,
        targetEntryId: entryIdOrNull,
        errorMessage: '',
      },
      statusMessage: '',
      errorMessage: '',
    }))
    const result = callService('setFeaturedEntry', [entryIdOrNull])

    if (!finishOperation(operationToken)) return

    const success = parseFeaturedSuccess(result, entryIdOrNull)

    if (success) {
      state = {
        ...state,
        featuredState: {
          isSubmitting: false,
          targetEntryId: null,
          errorMessage: '',
        },
        statusMessage: success.changed
          ? (
              entryIdOrNull === null
                ? SUCCESS_MESSAGES.featuredCleared
                : SUCCESS_MESSAGES.featuredSet
            )
          : NO_CHANGES_MESSAGE,
        statusMessageTone: success.changed ? 'success' : 'notice',
        errorMessage: '',
      }
      reconcileStateWithSnapshot(success.snapshot)
      state = {
        ...state,
        phase: derivePhase(success.snapshot),
      }
      render({ type: 'status' })
      return
    }

    const failure = parseMutationFailure(
      result,
      'featured',
      entryIdOrNull
    )
    adoptFailureSnapshot(failure)
    const retainedTarget = (
      typeof entryIdOrNull === 'string' &&
      hasEntry(state.snapshot, entryIdOrNull)
    )
      ? entryIdOrNull
      : null
    state = {
      ...state,
      featuredState: {
        isSubmitting: false,
        targetEntryId: retainedTarget,
        errorMessage: getMutationErrorMessage('featured', failure),
      },
      statusMessage: '',
      errorMessage: '',
    }
    restoreReadyPhase()
    render({ type: 'featuredAlert' })
  }

  function open() {
    if (isActive || isClosing) return

    isActive = true
    activeLifecycleToken = ++lifecycleSequence
    activeOperationToken = 0
    beginLoad()
  }

  function close() {
    if (isClosing) return false
    if (!isActive) return true

    if (activeOperationToken !== 0 || state.phase === 'mutating') {
      return false
    }

    if (state.form?.isDirty) {
      isClosing = true
      state = {
        ...state,
        form: {
          ...state.form,
          errorMessage: UNSAVED_FORM_MESSAGE,
        },
      }
      render({ type: 'formAlert' })
      isClosing = false
      return false
    }

    isClosing = true
    isActive = false
    activeLifecycleToken = ++lifecycleSequence
    safelyCancelScheduledLoad()
    activeOperationToken = 0
    operationSequence += 1
    state = createInitialState()
    formBaseline = null
    callPortMethod(lichtwaldLogView, 'unmount', [])
    isClosing = false
    return true
  }

  return Object.freeze({ open, close })
}
