import { isValidCalendarDate } from './lichtwaldLogContract.js'

export const ALL_LICHTWALD_LOG_TAGS = ''
export const LICHTWALD_LOG_SEARCH_QUERY_MAX_LENGTH = 200

const SEARCHABLE_ENTRY_FIELD_NAMES = Object.freeze([
  'calendarDate',
  'title',
  'text',
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

function readProperty(value, propertyName) {
  if (
    (typeof value !== 'object' || value === null) &&
    typeof value !== 'function'
  ) {
    return undefined
  }

  try {
    return value[propertyName]
  } catch {
    return undefined
  }
}

function readFilterOptions(options) {
  const candidate = typeof options === 'undefined' ? {} : options

  if (!isPlainObject(candidate)) return null

  let query
  let calendarDate
  let tag

  try {
    query = typeof candidate.query === 'undefined' ? '' : candidate.query
    calendarDate = typeof candidate.calendarDate === 'undefined'
      ? ''
      : candidate.calendarDate
    tag = typeof candidate.tag === 'undefined'
      ? ALL_LICHTWALD_LOG_TAGS
      : candidate.tag
  } catch {
    return null
  }

  if (
    typeof query !== 'string' ||
    typeof calendarDate !== 'string' ||
    typeof tag !== 'string' ||
    query.length > LICHTWALD_LOG_SEARCH_QUERY_MAX_LENGTH ||
    (calendarDate !== '' && !isValidCalendarDate(calendarDate))
  ) {
    return null
  }

  const normalizedQuery = normalizeQuery(query)
  const normalizedTag = tag === ALL_LICHTWALD_LOG_TAGS
    ? ALL_LICHTWALD_LOG_TAGS
    : normalizeComparableText(tag)

  if (normalizedQuery === null || normalizedTag === null) return null

  return { normalizedQuery, calendarDate, normalizedTag }
}

function normalizeQuery(value) {
  if (typeof value !== 'string') return null

  try {
    return value.trim().normalize('NFC').toLowerCase()
  } catch {
    return null
  }
}

function normalizeComparableText(value) {
  if (typeof value !== 'string') return null

  try {
    return value.normalize('NFC').toLowerCase()
  } catch {
    return null
  }
}

function getEntryTags(entry) {
  const tags = readProperty(entry, 'tags')
  return isArray(tags) ? tags : null
}

function matchesQuery(entry, normalizedQuery) {
  if (normalizedQuery.length === 0) return true

  for (const fieldName of SEARCHABLE_ENTRY_FIELD_NAMES) {
    const normalizedValue = normalizeComparableText(
      readProperty(entry, fieldName)
    )

    if (normalizedValue?.includes(normalizedQuery)) return true
  }

  const tags = getEntryTags(entry)

  if (!tags) return false

  try {
    for (let index = 0; index < tags.length; index += 1) {
      if (!Object.prototype.hasOwnProperty.call(tags, index)) continue

      const normalizedTag = normalizeComparableText(tags[index])

      if (normalizedTag?.includes(normalizedQuery)) return true
    }
  } catch {
    return false
  }

  return false
}

function matchesCalendarDate(entry, calendarDate) {
  return (
    calendarDate === '' ||
    readProperty(entry, 'calendarDate') === calendarDate
  )
}

function matchesTag(entry, normalizedSelectedTag) {
  if (normalizedSelectedTag === ALL_LICHTWALD_LOG_TAGS) return true

  const tags = getEntryTags(entry)

  if (!tags) return false

  try {
    for (let index = 0; index < tags.length; index += 1) {
      if (!Object.prototype.hasOwnProperty.call(tags, index)) continue

      if (normalizeComparableText(tags[index]) === normalizedSelectedTag) {
        return true
      }
    }
  } catch {
    return false
  }

  return false
}

export function getLichtwaldLogFilterTags(entries) {
  if (!isArray(entries)) return []

  const availableTags = []
  const knownTagIdentities = new Set()

  try {
    for (let entryIndex = 0; entryIndex < entries.length; entryIndex += 1) {
      if (!Object.prototype.hasOwnProperty.call(entries, entryIndex)) continue

      const tags = getEntryTags(entries[entryIndex])

      if (!tags) continue

      for (let tagIndex = 0; tagIndex < tags.length; tagIndex += 1) {
        if (!Object.prototype.hasOwnProperty.call(tags, tagIndex)) continue

        const tag = tags[tagIndex]
        const normalizedTag = normalizeComparableText(tag)

        if (
          normalizedTag === null ||
          normalizedTag.length === 0 ||
          knownTagIdentities.has(normalizedTag)
        ) {
          continue
        }

        knownTagIdentities.add(normalizedTag)
        availableTags.push(tag)
      }
    }
  } catch {
    return []
  }

  return availableTags
}

export function filterLichtwaldLogEntries(entries, options = {}) {
  if (!isArray(entries)) return []

  const filters = readFilterOptions(options)

  if (!filters) return []

  const filteredEntries = []

  try {
    for (let index = 0; index < entries.length; index += 1) {
      if (!Object.prototype.hasOwnProperty.call(entries, index)) continue

      const entry = entries[index]

      if (
        matchesQuery(entry, filters.normalizedQuery) &&
        matchesCalendarDate(entry, filters.calendarDate) &&
        matchesTag(entry, filters.normalizedTag)
      ) {
        filteredEntries.push(entry)
      }
    }
  } catch {
    return []
  }

  return filteredEntries
}
