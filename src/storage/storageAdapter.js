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

function isSecurityError(error) {
  return error?.name === 'SecurityError'
}

function isQuotaExceededError(error) {
  return (
    error?.name === 'QuotaExceededError' ||
    error?.name === 'NS_ERROR_DOM_QUOTA_REACHED'
  )
}

export function createStorageAdapter(storageImplementation) {
  function readJson(key) {
    if (!isValidStorageKey(key)) {
      return createFailure(
        'invalidKey',
        'invalidStorageKey',
        'Der Storage-Key muss eine nicht leere Zeichenfolge sein.'
      )
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
      if (isSecurityError(error)) {
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

  function writeJson(key, value) {
    if (!isValidStorageKey(key)) {
      return createFailure(
        'invalidKey',
        'invalidStorageKey',
        'Der Storage-Key muss eine nicht leere Zeichenfolge sein.'
      )
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

    try {
      storageImplementation.setItem(key, serializedValue)
    } catch (error) {
      if (isQuotaExceededError(error)) {
        return createFailure(
          'quotaExceeded',
          'storageQuotaExceeded',
          'Der lokale Speicher hat nicht genügend freien Platz.'
        )
      }

      if (isSecurityError(error)) {
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

  return Object.freeze({
    readJson,
    writeJson,
  })
}
