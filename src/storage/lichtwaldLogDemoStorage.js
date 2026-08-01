import { createLichtwaldLogDemoSnapshot } from '../data/mock/lichtwaldLogDemo.js'
import { validateLichtwaldLog } from '../modules/lichtwald-log/lichtwaldLogContract.js'

const SYNTHETIC_DATA_ORIGIN = 'synthetic'
const MAX_SERIALIZED_LENGTH = 500_000

const FAILURE_DEFINITIONS = Object.freeze({
  invalidStoredData: Object.freeze({
    status: 'invalidStoredData',
    code: 'invalidLichtwaldLogDemoData',
    message: 'Die synthetischen LichtwaldLog-Demo-Daten sind ungültig.',
  }),
  invalidSaveData: Object.freeze({
    status: 'validationFailed',
    code: 'invalidLichtwaldLogDemoData',
    message: 'Die Demo-Änderung kann in dieser Form nicht übernommen werden.',
  }),
  storedOriginMismatch: Object.freeze({
    status: 'invalidStoredData',
    code: 'syntheticLichtwaldLogRequired',
    message: 'Die LichtwaldLog-Demo akzeptiert ausschließlich synthetische Daten.',
  }),
  saveOriginMismatch: Object.freeze({
    status: 'validationFailed',
    code: 'syntheticLichtwaldLogRequired',
    message: 'Die LichtwaldLog-Demo akzeptiert ausschließlich synthetische Daten.',
  }),
  serializationFailed: Object.freeze({
    status: 'serializationFailed',
    code: 'lichtwaldLogDemoSerializationFailed',
    message: 'Die LichtwaldLog-Demo-Daten konnten nicht sicher vorbereitet werden.',
  }),
  sizeLimitExceeded: Object.freeze({
    status: 'sizeLimitExceeded',
    code: 'lichtwaldLogDemoSizeLimitExceeded',
    message: 'Die LichtwaldLog-Demo-Daten überschreiten die zulässige Größe.',
  }),
})

function createFailure(failureName) {
  const failure = FAILURE_DEFINITIONS[failureName]

  return {
    ok: false,
    status: failure.status,
    error: {
      code: failure.code,
      message: failure.message,
    },
  }
}

function isValidLichtwaldLog(lichtwaldLog) {
  try {
    return validateLichtwaldLog(lichtwaldLog).ok === true
  } catch {
    return false
  }
}

function hasSyntheticDataOrigin(lichtwaldLog) {
  try {
    return lichtwaldLog.dataOrigin === SYNTHETIC_DATA_ORIGIN
  } catch {
    return false
  }
}

function cloneLichtwaldLog(lichtwaldLog) {
  try {
    return {
      ok: true,
      lichtwaldLog: structuredClone(lichtwaldLog),
    }
  } catch {
    return { ok: false }
  }
}

function createCanonicalRecord(properties) {
  const record = Object.create(null)

  properties.forEach(([propertyName, propertyValue]) => {
    record[propertyName] = propertyValue
  })

  return record
}

function createCanonicalArray(values) {
  const array = [...values]

  Object.defineProperty(array, 'toJSON', {
    configurable: false,
    enumerable: false,
    value: undefined,
    writable: false,
  })

  return array
}

function createCanonicalSerializationSnapshot(lichtwaldLog) {
  const entries = createCanonicalArray(
    lichtwaldLog.entries.map((entry) => createCanonicalRecord([
      ['id', entry.id],
      ['calendarDate', entry.calendarDate],
      ['title', entry.title],
      ['text', entry.text],
      ['tags', createCanonicalArray(entry.tags)],
    ]))
  )

  return createCanonicalRecord([
    ['schemaVersion', lichtwaldLog.schemaVersion],
    ['dataOrigin', lichtwaldLog.dataOrigin],
    ['featuredEntryId', lichtwaldLog.featuredEntryId],
    ['entries', entries],
  ])
}

function inspectSerializedLength(lichtwaldLog) {
  let serializedLichtwaldLog

  try {
    serializedLichtwaldLog = JSON.stringify(
      createCanonicalSerializationSnapshot(lichtwaldLog)
    )
  } catch {
    return { ok: false, failureName: 'serializationFailed' }
  }

  if (typeof serializedLichtwaldLog !== 'string') {
    return { ok: false, failureName: 'serializationFailed' }
  }

  if (serializedLichtwaldLog.length > MAX_SERIALIZED_LENGTH) {
    return { ok: false, failureName: 'sizeLimitExceeded' }
  }

  return { ok: true }
}

function deepFreeze(value) {
  try {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Reflect.ownKeys(value).forEach((propertyName) => {
        deepFreeze(value[propertyName])
      })
      Object.freeze(value)
    }

    return { ok: true, value }
  } catch {
    return { ok: false }
  }
}

function prepareTrustedSnapshot(
  lichtwaldLog,
  invalidDataFailureName,
  originFailureName,
  freezeSnapshot = true
) {
  if (!isValidLichtwaldLog(lichtwaldLog)) {
    return { ok: false, failureName: invalidDataFailureName }
  }

  if (!hasSyntheticDataOrigin(lichtwaldLog)) {
    return { ok: false, failureName: originFailureName }
  }

  const clonedLichtwaldLog = cloneLichtwaldLog(lichtwaldLog)

  if (
    !clonedLichtwaldLog.ok ||
    !isValidLichtwaldLog(clonedLichtwaldLog.lichtwaldLog)
  ) {
    return { ok: false, failureName: invalidDataFailureName }
  }

  if (!hasSyntheticDataOrigin(clonedLichtwaldLog.lichtwaldLog)) {
    return { ok: false, failureName: originFailureName }
  }

  const sizeResult = inspectSerializedLength(clonedLichtwaldLog.lichtwaldLog)

  if (!sizeResult.ok) {
    return sizeResult
  }

  if (!freezeSnapshot) {
    return {
      ok: true,
      lichtwaldLog: clonedLichtwaldLog.lichtwaldLog,
    }
  }

  const freezeResult = deepFreeze(clonedLichtwaldLog.lichtwaldLog)

  if (!freezeResult.ok) {
    return { ok: false, failureName: invalidDataFailureName }
  }

  return {
    ok: true,
    lichtwaldLog: freezeResult.value,
  }
}

function prepareInitialSnapshot(createDemoSnapshot) {
  if (typeof createDemoSnapshot !== 'function') {
    return { ok: false, failureName: 'invalidStoredData' }
  }

  let demoSnapshot

  try {
    demoSnapshot = createDemoSnapshot()
  } catch {
    return { ok: false, failureName: 'invalidStoredData' }
  }

  return prepareTrustedSnapshot(
    demoSnapshot,
    'invalidStoredData',
    'storedOriginMismatch'
  )
}

export function createLichtwaldLogDemoStorage(
  createDemoSnapshot = createLichtwaldLogDemoSnapshot
) {
  const initialSnapshotResult = prepareInitialSnapshot(createDemoSnapshot)
  let trustedLichtwaldLog = initialSnapshotResult.ok
    ? initialSnapshotResult.lichtwaldLog
    : null
  const initializationFailureName = initialSnapshotResult.ok
    ? null
    : initialSnapshotResult.failureName

  function loadLichtwaldLog() {
    if (initializationFailureName !== null) {
      return createFailure(initializationFailureName)
    }

    const loadResult = prepareTrustedSnapshot(
      trustedLichtwaldLog,
      'invalidStoredData',
      'storedOriginMismatch',
      false
    )

    if (!loadResult.ok) {
      return createFailure(loadResult.failureName)
    }

    return {
      ok: true,
      status: 'found',
      lichtwaldLog: loadResult.lichtwaldLog,
    }
  }

  function saveLichtwaldLog(lichtwaldLog) {
    if (initializationFailureName !== null) {
      return createFailure(initializationFailureName)
    }

    const saveResult = prepareTrustedSnapshot(
      lichtwaldLog,
      'invalidSaveData',
      'saveOriginMismatch'
    )

    if (!saveResult.ok) {
      return createFailure(saveResult.failureName)
    }

    trustedLichtwaldLog = saveResult.lichtwaldLog

    return {
      ok: true,
      status: 'saved',
    }
  }

  return Object.freeze({
    loadLichtwaldLog,
    saveLichtwaldLog,
  })
}
