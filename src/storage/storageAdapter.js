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

function isValidStorageKey(key) {
  return typeof key === 'string' && key.trim().length > 0
}

function createInvalidLimitFailure() {
  return createFailure(
    'invalidLimit',
    'invalidStorageLimit',
    'Das Speicherlimit muss eine positive sichere Ganzzahl sein.'
  )
}

function createSizeLimitExceededFailure() {
  return createFailure(
    'sizeLimitExceeded',
    'storageSizeLimitExceeded',
    'Die serialisierten Daten überschreiten das zulässige Speicherlimit.'
  )
}

function resolveMaxSerializedLength(options) {
  if (options === undefined) {
    return {
      ok: true,
      maxSerializedLength: undefined,
    }
  }

  let maxSerializedLength

  try {
    maxSerializedLength = options?.maxSerializedLength
  } catch {
    return { ok: false }
  }

  if (
    !Number.isSafeInteger(maxSerializedLength) ||
    maxSerializedLength <= 0
  ) {
    return { ok: false }
  }

  return {
    ok: true,
    maxSerializedLength,
  }
}

function readErrorName(error) {
  try {
    return error?.name
  } catch {
    return undefined
  }
}

function isSecurityErrorName(errorName) {
  return errorName === 'SecurityError'
}

function isQuotaExceededErrorName(errorName) {
  return (
    errorName === 'QuotaExceededError' ||
    errorName === 'NS_ERROR_DOM_QUOTA_REACHED'
  )
}

export function createStorageAdapter(storageImplementation) {
  function readJson(key, options = undefined) {
    if (!isValidStorageKey(key)) {
      return createFailure(
        'invalidKey',
        'invalidStorageKey',
        'Der Storage-Key muss eine nicht leere Zeichenfolge sein.'
      )
    }

    const limitResult = resolveMaxSerializedLength(options)

    if (!limitResult.ok) {
      return createInvalidLimitFailure()
    }

    if (typeof storageImplementation?.getItem !== 'function') {
      return createFailure(
        'unavailable',
        'storageUnavailable',
        'Der lokale Speicher ist nicht verfügbar.'
      )
    }

    let serializedValue

    try {
      serializedValue = storageImplementation.getItem(key)
    } catch (error) {
      const errorName = readErrorName(error)

      if (isSecurityErrorName(errorName)) {
        return createFailure(
          'unavailable',
          'storageUnavailable',
          'Der Zugriff auf den lokalen Speicher wurde blockiert.'
        )
      }

      return createFailure(
        'readFailed',
        'storageReadFailed',
        'Die lokalen Daten konnten nicht gelesen werden.'
      )
    }

    if (serializedValue === null) {
      return {
        ok: true,
        status: 'missing',
      }
    }

    if (typeof serializedValue !== 'string') {
      return createFailure(
        'invalidJson',
        'invalidJson',
        'Die gespeicherten Daten enthalten kein gültiges JSON.'
      )
    }

    if (
      limitResult.maxSerializedLength !== undefined &&
      serializedValue.length > limitResult.maxSerializedLength
    ) {
      return createSizeLimitExceededFailure()
    }

    try {
      return {
        ok: true,
        status: 'found',
        value: JSON.parse(serializedValue),
      }
    } catch {
      return createFailure(
        'invalidJson',
        'invalidJson',
        'Die gespeicherten Daten enthalten kein gültiges JSON.'
      )
    }
  }

  function writeJson(key, value, options = undefined) {
    if (!isValidStorageKey(key)) {
      return createFailure(
        'invalidKey',
        'invalidStorageKey',
        'Der Storage-Key muss eine nicht leere Zeichenfolge sein.'
      )
    }

    const limitResult = resolveMaxSerializedLength(options)

    if (!limitResult.ok) {
      return createInvalidLimitFailure()
    }

    if (typeof storageImplementation?.setItem !== 'function') {
      return createFailure(
        'unavailable',
        'storageUnavailable',
        'Der lokale Speicher ist nicht verfügbar.'
      )
    }

    let serializedValue

    try {
      serializedValue = JSON.stringify(value)
    } catch {
      return createFailure(
        'serializationFailed',
        'serializationFailed',
        'Die Daten konnten nicht für die Speicherung vorbereitet werden.'
      )
    }

    if (serializedValue === undefined) {
      return createFailure(
        'serializationFailed',
        'serializationFailed',
        'Die Daten konnten nicht für die Speicherung vorbereitet werden.'
      )
    }

    if (
      limitResult.maxSerializedLength !== undefined &&
      serializedValue.length > limitResult.maxSerializedLength
    ) {
      return createSizeLimitExceededFailure()
    }

    try {
      storageImplementation.setItem(key, serializedValue)
    } catch (error) {
      const errorName = readErrorName(error)

      if (isQuotaExceededErrorName(errorName)) {
        return createFailure(
          'quotaExceeded',
          'storageQuotaExceeded',
          'Der lokale Speicher hat nicht genügend freien Platz.'
        )
      }

      if (isSecurityErrorName(errorName)) {
        return createFailure(
          'unavailable',
          'storageUnavailable',
          'Der Zugriff auf den lokalen Speicher wurde blockiert.'
        )
      }

      return createFailure(
        'writeFailed',
        'storageWriteFailed',
        'Die lokalen Daten konnten nicht gespeichert werden.'
      )
    }

    return {
      ok: true,
      status: 'saved',
    }
  }

  function removeJsonIfUnchanged(key, expectedValue) {
    if (!isValidStorageKey(key)) {
      return createFailure(
        'invalidKey',
        'invalidStorageKey',
        'Der Storage-Key muss eine nicht leere Zeichenfolge sein.'
      )
    }

    if (
      typeof storageImplementation?.getItem !== 'function' ||
      typeof storageImplementation?.removeItem !== 'function'
    ) {
      return createFailure(
        'unavailable',
        'storageUnavailable',
        'Der lokale Speicher ist nicht verfügbar.'
      )
    }

    let expectedSerializedValue

    try {
      expectedSerializedValue = JSON.stringify(expectedValue)
    } catch {
      return createFailure(
        'serializationFailed',
        'serializationFailed',
        'Die Daten konnten nicht für den Abgleich vorbereitet werden.'
      )
    }

    if (expectedSerializedValue === undefined) {
      return createFailure(
        'serializationFailed',
        'serializationFailed',
        'Die Daten konnten nicht für den Abgleich vorbereitet werden.'
      )
    }

    let currentSerializedValue

    try {
      currentSerializedValue = storageImplementation.getItem(key)
    } catch (error) {
      const errorName = readErrorName(error)

      if (isSecurityErrorName(errorName)) {
        return createFailure(
          'unavailable',
          'storageUnavailable',
          'Der Zugriff auf den lokalen Speicher wurde blockiert.'
        )
      }

      return createFailure(
        'readFailed',
        'storageReadFailed',
        'Die lokalen Daten konnten nicht abgeglichen werden.'
      )
    }

    if (currentSerializedValue === null) {
      return {
        ok: true,
        status: 'missing',
      }
    }

    if (currentSerializedValue !== expectedSerializedValue) {
      return createFailure(
        'conflict',
        'storageValueChanged',
        'Der lokale Wert wurde zwischenzeitlich verändert.'
      )
    }

    try {
      storageImplementation.removeItem(key)
    } catch (error) {
      const errorName = readErrorName(error)

      if (isSecurityErrorName(errorName)) {
        return createFailure(
          'unavailable',
          'storageUnavailable',
          'Der Zugriff auf den lokalen Speicher wurde blockiert.'
        )
      }

      return createFailure(
        'removeFailed',
        'storageRemoveFailed',
        'Die lokalen Daten konnten nicht entfernt werden.'
      )
    }

    return {
      ok: true,
      status: 'removed',
    }
  }

  return Object.freeze({
    readJson,
    writeJson,
    removeJsonIfUnchanged,
  })
}
