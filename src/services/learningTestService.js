import { validateLearningHub } from '../modules/learning-hub/learningHubContract.js'
import {
  LEARNING_TEST_DIFFICULTIES,
  LEARNING_TEST_EXPLANATION_MAX_LENGTH,
  LEARNING_TEST_MAX_OPTION_COUNT,
  LEARNING_TEST_MIN_OPTION_COUNT,
  LEARNING_TEST_OPTION_LABEL_MAX_LENGTH,
  LEARNING_TEST_PROMPT_MAX_LENGTH,
  LEARNING_TEST_QUESTION_TYPES,
  isCanonicalUtcTimestamp,
  validateLearningTestBank,
} from '../modules/learning-hub/learningTestBankContract.js'
import {
  validateLearningTestAttemptLog,
} from '../modules/learning-hub/learningTestAttemptContract.js'
import {
  evaluateLearningTestAnswers,
  projectPublicTestQuestions,
  selectModuleTestQuestions,
} from '../modules/learning-hub/learningTestEngine.js'

const PRIVATE_DATA_ORIGIN = 'private'
const MAX_ID_GENERATION_ATTEMPTS = 5

const QUESTION_INPUT_FIELDS = Object.freeze([
  'moduleId',
  'chapterId',
  'learningNodeId',
  'prompt',
  'difficulty',
  'options',
  'correctOptionIndex',
  'explanation',
])

const LEARNING_TEST_ID_PREFIXES = Object.freeze({
  question: 'learning-test-question',
  option: 'learning-test-option',
  session: 'learning-test-session',
  attempt: 'learning-test-attempt',
})

const SUPPORTED_DIFFICULTIES = Object.freeze(
  Object.values(LEARNING_TEST_DIFFICULTIES)
)

const SAFE_HUB_FAILURES = Object.freeze({
  learningHubStorageUnavailable: new Set(['unavailable']),
  learningHubStorageReadFailed: new Set(['readFailed']),
  invalidStorageKey: new Set(['invalidKey']),
  storageUnavailable: new Set(['unavailable']),
  storageReadFailed: new Set(['readFailed']),
  invalidJson: new Set(['invalidJson']),
  storageAdapterUnavailable: new Set(['unavailable']),
  unexpectedStorageResult: new Set(['storageFailed']),
  invalidLearningHubData: new Set(['invalidStoredData']),
  invalidStoredLearningHub: new Set(['invalidStoredData']),
  privateLearningHubRequired: new Set(['invalidStoredData']),
})

const SAFE_BANK_FAILURES = Object.freeze({
  invalidStorageKey: new Set(['invalidKey']),
  storageUnavailable: new Set(['unavailable']),
  storageReadFailed: new Set(['readFailed']),
  invalidJson: new Set(['invalidJson']),
  storageAdapterUnavailable: new Set(['unavailable']),
  unexpectedStorageResult: new Set(['storageFailed']),
  invalidLearningTestBankData: new Set([
    'invalidStoredData',
    'validationFailed',
  ]),
  privateLearningTestBankRequired: new Set([
    'invalidStoredData',
    'validationFailed',
  ]),
  serializationFailed: new Set(['serializationFailed']),
  storageQuotaExceeded: new Set(['quotaExceeded']),
  storageWriteFailed: new Set(['writeFailed']),
})

const SAFE_ATTEMPT_FAILURES = Object.freeze({
  invalidStorageKey: new Set(['invalidKey']),
  storageUnavailable: new Set(['unavailable']),
  storageReadFailed: new Set(['readFailed']),
  invalidJson: new Set(['invalidJson']),
  storageAdapterUnavailable: new Set(['unavailable']),
  unexpectedStorageResult: new Set(['storageFailed']),
  invalidLearningTestAttemptLogData: new Set([
    'invalidStoredData',
    'validationFailed',
  ]),
  privateLearningTestAttemptsRequired: new Set([
    'invalidStoredData',
    'validationFailed',
  ]),
  learningTestAttemptPrefixMismatch: new Set(['conflict']),
  serializationFailed: new Set(['serializationFailed']),
  storageQuotaExceeded: new Set(['quotaExceeded']),
  storageWriteFailed: new Set(['writeFailed']),
})

function isObjectRecord(value) {
  try {
    return (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value)
    )
  } catch {
    return false
  }
}

function isPlainRecord(value) {
  try {
    if (!isObjectRecord(value)) {
      return false
    }

    const prototype = Object.getPrototypeOf(value)

    return prototype === Object.prototype || prototype === null
  } catch {
    return false
  }
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function isTrimmedNonEmptyString(value) {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value === value.trim()
  )
}

function cloneLearningNode(learningNode) {
  return { ...learningNode }
}

function cloneChapter(chapter) {
  return {
    ...chapter,
    learningNodes: chapter.learningNodes.map(cloneLearningNode),
  }
}

function cloneModule(learningModule) {
  return {
    ...learningModule,
    chapters: learningModule.chapters.map(cloneChapter),
  }
}

function cloneHub(learningHub) {
  return {
    ...learningHub,
    modules: learningHub.modules.map(cloneModule),
  }
}

function cloneOption(option) {
  return { ...option }
}

function cloneQuestion(question) {
  return {
    ...question,
    options: question.options.map(cloneOption),
  }
}

function cloneTestBank(testBank) {
  return {
    ...testBank,
    questions: testBank.questions.map(cloneQuestion),
  }
}

function cloneAttemptAnswer(answer) {
  return { ...answer }
}

function cloneAttempt(attempt) {
  return {
    ...attempt,
    answers: attempt.answers.map(cloneAttemptAnswer),
  }
}

function cloneAttemptLog(attemptLog) {
  return {
    ...attemptLog,
    attempts: attemptLog.attempts.map(cloneAttempt),
  }
}

function clonePublicQuestion(question) {
  return {
    ...question,
    options: question.options.map((option) => ({ ...option })),
  }
}

function clonePublicSession(testSession) {
  return {
    id: testSession.id,
    moduleId: testSession.moduleId,
    startedAt: testSession.startedAt,
    questions: testSession.questions.map(clonePublicQuestion),
  }
}

function cloneResultFeedback(feedback) {
  return feedback.map((answerFeedback) => ({ ...answerFeedback }))
}

function cloneCompletedResult(result) {
  return {
    ...result,
    answers: result.answers.map(cloneAttemptAnswer),
    feedback: cloneResultFeedback(result.feedback),
  }
}

function createFailure(status, code, message) {
  return {
    ok: false,
    status,
    changed: false,
    error: { code, message },
  }
}

function createInputFailure(fieldErrors, code = 'invalidLearningTestInput') {
  return {
    ok: false,
    status: 'validationFailed',
    changed: false,
    error: {
      code,
      message: 'Bitte korrigiere die markierten Felder.',
      fieldErrors: { ...fieldErrors },
    },
  }
}

function createUnsafeInputFailure(code = 'invalidLearningTestInput') {
  return createInputFailure(
    {
      input: 'Die Eingabe konnte nicht sicher verarbeitet werden.',
    },
    code
  )
}

function snapshotRecordFields(input, fieldNames) {
  if (!isPlainRecord(input)) {
    return { ok: false }
  }

  const snapshot = {}

  try {
    fieldNames.forEach((fieldName) => {
      snapshot[fieldName] = input[fieldName]
    })
  } catch {
    return { ok: false }
  }

  return { ok: true, snapshot }
}

function snapshotArray(
  arrayValue,
  snapshotEntry = (entry) => ({ ok: true, snapshot: entry }),
  maximumLength = null
) {
  let isArray
  let length
  let prototype

  try {
    isArray = Array.isArray(arrayValue)

    if (!isArray) {
      return { ok: true, snapshot: arrayValue }
    }

    prototype = Object.getPrototypeOf(arrayValue)
    length = arrayValue.length
  } catch {
    return { ok: false }
  }

  if (prototype !== Array.prototype) {
    return { ok: false }
  }

  if (
    !Number.isSafeInteger(length) ||
    length < 0
  ) {
    return { ok: false }
  }

  if (
    Number.isSafeInteger(maximumLength) &&
    length > maximumLength
  ) {
    return {
      ok: true,
      snapshot: new Array(maximumLength + 1),
    }
  }

  const snapshot = []

  for (let index = 0; index < length; index += 1) {
    let entry

    try {
      entry = arrayValue[index]
    } catch {
      return { ok: false }
    }

    const entrySnapshot = snapshotEntry(entry)

    if (!entrySnapshot.ok) {
      return { ok: false }
    }

    snapshot.push(entrySnapshot.snapshot)
  }

  return { ok: true, snapshot }
}

function snapshotQuestionInput(input, includeQuestionId) {
  const fieldNames = includeQuestionId
    ? [...QUESTION_INPUT_FIELDS, 'questionId']
    : QUESTION_INPUT_FIELDS
  const recordSnapshot = snapshotRecordFields(input, fieldNames)

  if (!recordSnapshot.ok) {
    return recordSnapshot
  }

  const optionsSnapshot = snapshotArray(
    recordSnapshot.snapshot.options,
    undefined,
    LEARNING_TEST_MAX_OPTION_COUNT
  )

  if (!optionsSnapshot.ok) {
    return { ok: false }
  }

  recordSnapshot.snapshot.options = optionsSnapshot.snapshot
  return recordSnapshot
}

function snapshotModuleInput(input) {
  return snapshotRecordFields(input, ['moduleId'])
}

function snapshotSubmissionTarget(input) {
  const targetSnapshot = snapshotRecordFields(input, ['testSessionId'])

  if (!targetSnapshot.ok) {
    return targetSnapshot
  }

  return {
    ok: true,
    source: input,
    testSessionId: targetSnapshot.snapshot.testSessionId,
  }
}

function snapshotSubmittedAnswer(answer) {
  if (!isPlainRecord(answer)) {
    return { ok: true, snapshot: answer }
  }

  let propertyNames

  try {
    propertyNames = Reflect.ownKeys(answer)
  } catch {
    return { ok: false }
  }

  const answerSnapshot = {}

  try {
    propertyNames.forEach((propertyName) => {
      if (
        propertyName === 'questionId' ||
        propertyName === 'selectedOptionId'
      ) {
        answerSnapshot[propertyName] = answer[propertyName]
        return
      }

      Object.defineProperty(answerSnapshot, propertyName, {
        configurable: true,
        enumerable: true,
        value: undefined,
        writable: true,
      })
    })
  } catch {
    return { ok: false }
  }

  return { ok: true, snapshot: answerSnapshot }
}

function snapshotSubmissionAnswers(submissionSource, expectedQuestionCount) {
  let answers

  try {
    answers = submissionSource.answers
  } catch {
    return { ok: false }
  }

  return snapshotArray(
    answers,
    snapshotSubmittedAnswer,
    expectedQuestionCount
  )
}

function snapshotAppendResult(appendResult) {
  const resultSnapshot = snapshotRecordFields(
    appendResult,
    ['ok', 'status', 'error', 'attemptLog']
  )

  if (!resultSnapshot.ok) {
    return resultSnapshot
  }

  if (resultSnapshot.snapshot.ok === false) {
    const errorSnapshot = snapshotRecordFields(
      resultSnapshot.snapshot.error,
      ['code', 'message']
    )

    if (!errorSnapshot.ok) {
      return { ok: false }
    }

    resultSnapshot.snapshot.error = errorSnapshot.snapshot
  }

  return resultSnapshot
}

function forwardDependencyFailure(
  dependencyResult,
  safeFailures,
  fallbackStatus,
  fallbackCode,
  safeMessage
) {
  const dependencyCode = dependencyResult?.error?.code
  const hasKnownDependencyCode = (
    isNonEmptyString(dependencyCode) &&
    Object.prototype.hasOwnProperty.call(safeFailures, dependencyCode)
  )
  const validStatuses = hasKnownDependencyCode
    ? safeFailures[dependencyCode]
    : null

  if (
    dependencyResult?.ok === false &&
    validStatuses?.has(dependencyResult.status) &&
    isNonEmptyString(dependencyResult.error?.message)
  ) {
    return createFailure(
      dependencyResult.status,
      dependencyCode,
      safeMessage
    )
  }

  return createFailure(
    fallbackStatus,
    fallbackCode,
    safeMessage
  )
}

function isValidPrivateHub(learningHub) {
  try {
    return (
      validateLearningHub(learningHub).ok &&
      learningHub.dataOrigin === PRIVATE_DATA_ORIGIN
    )
  } catch {
    return false
  }
}

function isValidPrivateTestBank(testBank) {
  try {
    return (
      validateLearningTestBank(testBank).ok &&
      testBank.dataOrigin === PRIVATE_DATA_ORIGIN
    )
  } catch {
    return false
  }
}

function isValidPrivateAttemptLog(attemptLog) {
  try {
    return (
      validateLearningTestAttemptLog(attemptLog).ok &&
      attemptLog.dataOrigin === PRIVATE_DATA_ORIGIN
    )
  } catch {
    return false
  }
}

function buildReferenceIndex(learningHub) {
  const modulesById = new Map()
  const chaptersById = new Map()
  const learningNodesById = new Map()

  learningHub.modules.forEach((learningModule) => {
    modulesById.set(learningModule.id, learningModule)

    learningModule.chapters.forEach((chapter) => {
      chaptersById.set(chapter.id, {
        moduleId: learningModule.id,
        chapter,
      })

      chapter.learningNodes.forEach((learningNode) => {
        learningNodesById.set(learningNode.id, {
          moduleId: learningModule.id,
          chapterId: chapter.id,
          learningNode,
        })
      })
    })
  })

  return { modulesById, chaptersById, learningNodesById }
}

function validateStoredQuestionReferences(testBank, referenceIndex) {
  for (const question of testBank.questions) {
    if (!referenceIndex.modulesById.has(question.moduleId)) {
      return {
        ok: false,
        code: 'orphanedTestQuestionModuleReference',
        message:
          'Eine gespeicherte Testfrage verweist auf kein vorhandenes LearningModule.',
      }
    }

    const chapterReference = referenceIndex.chaptersById.get(
      question.chapterId
    )

    if (!chapterReference) {
      return {
        ok: false,
        code: 'orphanedTestQuestionChapterReference',
        message:
          'Eine gespeicherte Testfrage verweist auf kein vorhandenes LearningChapter.',
      }
    }

    if (chapterReference.moduleId !== question.moduleId) {
      return {
        ok: false,
        code: 'testQuestionChapterModuleMismatch',
        message:
          'Eine gespeicherte Testfrage besitzt eine ungültige Modul-Kapitel-Zuordnung.',
      }
    }

    const learningNodeReference = referenceIndex.learningNodesById.get(
      question.learningNodeId
    )

    if (!learningNodeReference) {
      return {
        ok: false,
        code: 'orphanedTestQuestionLearningNodeReference',
        message:
          'Eine gespeicherte Testfrage verweist auf keinen vorhandenen LearningNode.',
      }
    }

    if (
      learningNodeReference.moduleId !== question.moduleId ||
      learningNodeReference.chapterId !== question.chapterId
    ) {
      return {
        ok: false,
        code: 'testQuestionLearningNodeChapterMismatch',
        message:
          'Eine gespeicherte Testfrage besitzt eine ungültige Kapitel-LearningNode-Zuordnung.',
      }
    }
  }

  return { ok: true }
}

function buildQuestionIndex(testBank) {
  return new Map(testBank.questions.map((question) => [question.id, question]))
}

function validateStoredAttemptReferences(
  attemptLog,
  referenceIndex,
  questionIndex,
  learningHub,
  testBank
) {
  const questionOrderByModule = new Map()

  for (const attempt of attemptLog.attempts) {
    if (!referenceIndex.modulesById.has(attempt.moduleId)) {
      return {
        ok: false,
        code: 'orphanedTestAttemptModuleReference',
        message:
          'Ein gespeicherter Testversuch verweist auf kein vorhandenes LearningModule.',
      }
    }

    let orderedQuestionIndexes = questionOrderByModule.get(attempt.moduleId)

    if (!orderedQuestionIndexes) {
      const orderedQuestions = selectModuleTestQuestions(
        learningHub,
        testBank,
        attempt.moduleId
      )
      orderedQuestionIndexes = new Map(
        orderedQuestions.map((question, index) => [question.id, index])
      )
      questionOrderByModule.set(attempt.moduleId, orderedQuestionIndexes)
    }

    let previousQuestionIndex = -1

    for (const answer of attempt.answers) {
      const learningNodeReference = referenceIndex.learningNodesById.get(
        answer.learningNodeId
      )

      if (
        !learningNodeReference ||
        learningNodeReference.moduleId !== attempt.moduleId
      ) {
        return {
          ok: false,
          code: 'orphanedTestAttemptLearningNodeReference',
          message:
            'Ein gespeicherter Testversuch verweist auf keinen passenden LearningNode.',
        }
      }

      const question = questionIndex.get(answer.questionId)

      if (
        !question ||
        question.moduleId !== attempt.moduleId ||
        question.learningNodeId !== answer.learningNodeId ||
        answer.questionRevision > question.revision
      ) {
        return {
          ok: false,
          code: 'orphanedTestAttemptQuestionReference',
          message:
            'Ein gespeicherter Testversuch verweist auf keine passende Testfragenrevision.',
        }
      }

      const questionOrder = orderedQuestionIndexes.get(answer.questionId)

      if (
        !Number.isInteger(questionOrder) ||
        questionOrder <= previousQuestionIndex
      ) {
        return {
          ok: false,
          code: 'testAttemptQuestionOrderMismatch',
          message:
            'Ein gespeicherter Testversuch besitzt keine autoritative Fragenreihenfolge.',
        }
      }

      previousQuestionIndex = questionOrder
    }
  }

  return { ok: true }
}

function getTargetReference(
  referenceIndex,
  moduleId,
  chapterId,
  learningNodeId
) {
  if (!referenceIndex.modulesById.has(moduleId)) {
    return {
      ok: false,
      status: 'notFound',
      code: 'moduleNotFound',
      message: 'Das angeforderte LearningModule wurde nicht gefunden.',
    }
  }

  if (chapterId === undefined) {
    return { ok: true }
  }

  const chapterReference = referenceIndex.chaptersById.get(chapterId)

  if (!chapterReference) {
    return {
      ok: false,
      status: 'notFound',
      code: 'chapterNotFound',
      message: 'Das angeforderte LearningChapter wurde nicht gefunden.',
    }
  }

  if (chapterReference.moduleId !== moduleId) {
    return {
      ok: false,
      status: 'ownershipMismatch',
      code: 'chapterModuleMismatch',
      message:
        'Das LearningChapter gehört nicht zum angegebenen LearningModule.',
    }
  }

  if (learningNodeId === undefined) {
    return { ok: true }
  }

  const learningNodeReference = referenceIndex.learningNodesById.get(
    learningNodeId
  )

  if (!learningNodeReference) {
    return {
      ok: false,
      status: 'notFound',
      code: 'learningNodeNotFound',
      message: 'Der angeforderte LearningNode wurde nicht gefunden.',
    }
  }

  if (
    learningNodeReference.moduleId !== moduleId ||
    learningNodeReference.chapterId !== chapterId
  ) {
    return {
      ok: false,
      status: 'ownershipMismatch',
      code: 'learningNodeChapterMismatch',
      message:
        'Der LearningNode gehört nicht zum angegebenen LearningChapter.',
    }
  }

  return { ok: true }
}

function validateTargetId(value, fieldName, fieldErrors) {
  if (!isTrimmedNonEmptyString(value)) {
    fieldErrors[fieldName] =
      'Die ID muss eine nicht leere, getrimmte Zeichenfolge sein.'
    return ''
  }

  return value
}

function normalizeBoundedText(
  value,
  fieldName,
  maxLength,
  fieldErrors,
  { optional = false, label = 'Der Text' } = {}
) {
  const normalizedValue = typeof value === 'string' ? value.trim() : ''

  if (typeof value !== 'string' && !(optional && value === undefined)) {
    fieldErrors[fieldName] = `${label} muss eine Zeichenfolge sein.`
  } else if (!optional && !normalizedValue) {
    fieldErrors[fieldName] = `${label} darf nicht leer sein.`
  } else if (normalizedValue.length > maxLength) {
    fieldErrors[fieldName] = `${label} überschreitet die zulässige Länge.`
  }

  return normalizedValue
}

function validateOptionsInput(options, correctOptionIndex, fieldErrors) {
  if (!Array.isArray(options)) {
    fieldErrors.options = 'Optionen müssen als Array angegeben werden.'
    fieldErrors.correctOptionIndex =
      'Die korrekte Option muss eindeutig ausgewählt sein.'
    return []
  }

  if (
    options.length < LEARNING_TEST_MIN_OPTION_COUNT ||
    options.length > LEARNING_TEST_MAX_OPTION_COUNT
  ) {
    fieldErrors.options = 'Eine Frage benötigt zwei bis sechs Optionen.'
  }

  const normalizedOptions = options.map((option) => (
    typeof option === 'string' ? option.trim() : ''
  ))

  if (
    options.some((option, index) => (
      typeof option !== 'string' ||
      normalizedOptions[index].length === 0 ||
      normalizedOptions[index].length >
        LEARNING_TEST_OPTION_LABEL_MAX_LENGTH
    ))
  ) {
    fieldErrors.options =
      'Jede Option muss einen zulässigen, nicht leeren Text enthalten.'
  }

  if (
    !Number.isInteger(correctOptionIndex) ||
    correctOptionIndex < 0 ||
    correctOptionIndex >= options.length
  ) {
    fieldErrors.correctOptionIndex =
      'Die korrekte Option muss eindeutig ausgewählt sein.'
  }

  return normalizedOptions
}

function validateQuestionInput(input, includeQuestionId) {
  const fieldErrors = {}
  const values = {
    moduleId: validateTargetId(
      input.moduleId,
      'moduleId',
      fieldErrors
    ),
    chapterId: validateTargetId(
      input.chapterId,
      'chapterId',
      fieldErrors
    ),
    learningNodeId: validateTargetId(
      input.learningNodeId,
      'learningNodeId',
      fieldErrors
    ),
    prompt: normalizeBoundedText(
      input.prompt,
      'prompt',
      LEARNING_TEST_PROMPT_MAX_LENGTH,
      fieldErrors,
      { label: 'Der Fragetext' }
    ),
    difficulty: input.difficulty,
    options: validateOptionsInput(
      input.options,
      input.correctOptionIndex,
      fieldErrors
    ),
    correctOptionIndex: input.correctOptionIndex,
    explanation: normalizeBoundedText(
      input.explanation,
      'explanation',
      LEARNING_TEST_EXPLANATION_MAX_LENGTH,
      fieldErrors,
      { optional: true, label: 'Die Erklärung' }
    ),
  }

  if (!SUPPORTED_DIFFICULTIES.includes(input.difficulty)) {
    fieldErrors.difficulty =
      'Der Schwierigkeitsgrad wird nicht unterstützt.'
  }

  if (includeQuestionId) {
    values.questionId = validateTargetId(
      input.questionId,
      'questionId',
      fieldErrors
    )
  }

  return { values, fieldErrors }
}

function validateModuleInput(input) {
  const fieldErrors = {}

  return {
    moduleId: validateTargetId(
      input.moduleId,
      'moduleId',
      fieldErrors
    ),
    fieldErrors,
  }
}

function collectBankIds(testBank) {
  const ids = new Set()

  testBank.questions.forEach((question) => {
    ids.add(question.id)
    question.options.forEach((option) => ids.add(option.id))
  })

  return ids
}

function generateUniqueId(
  generateLearningTestId,
  entityType,
  reservedIds,
  liveReservedIds = null
) {
  for (
    let attempt = 0;
    attempt < MAX_ID_GENERATION_ATTEMPTS;
    attempt += 1
  ) {
    let generatedId

    try {
      generatedId = generateLearningTestId(entityType)
    } catch {
      continue
    }

    if (
      isTrimmedNonEmptyString(generatedId) &&
      !reservedIds.has(generatedId) &&
      !liveReservedIds?.has(generatedId)
    ) {
      reservedIds.add(generatedId)
      return generatedId
    }
  }

  return null
}

function generateDefaultLearningTestId(entityType) {
  const prefix = LEARNING_TEST_ID_PREFIXES[entityType]

  if (!prefix || typeof globalThis.crypto?.randomUUID !== 'function') {
    throw new Error('randomUUID unavailable')
  }

  return `${prefix}-${globalThis.crypto.randomUUID()}`
}

function getDefaultNow() {
  return new Date().toISOString()
}

function getTimestamp(now, previousTimestamp = null) {
  let timestamp

  try {
    timestamp = now()
  } catch {
    return {
      ok: false,
      code: 'learningTestClockFailed',
      message: 'Der LearningTest-Zeitpunkt konnte nicht bestimmt werden.',
    }
  }

  if (!isCanonicalUtcTimestamp(timestamp)) {
    return {
      ok: false,
      code: 'invalidLearningTestTimestamp',
      message:
        'Der LearningTest-Zeitpunkt ist kein gültiger kanonischer UTC-Zeitstempel.',
    }
  }

  if (
    previousTimestamp !== null &&
    Date.parse(timestamp) < Date.parse(previousTimestamp)
  ) {
    return {
      ok: false,
      code: 'learningTestTimestampMovedBackward',
      message: 'Der LearningTest-Zeitpunkt darf nicht rückläufig sein.',
    }
  }

  return { ok: true, timestamp }
}

function getNextQuestionPosition(testBank, learningNodeId) {
  let highestPosition = 0

  testBank.questions.forEach((question) => {
    if (
      question.learningNodeId === learningNodeId &&
      question.position > highestPosition
    ) {
      highestPosition = question.position
    }
  })

  if (
    !Number.isSafeInteger(highestPosition) ||
    highestPosition >= Number.MAX_SAFE_INTEGER
  ) {
    return null
  }

  return highestPosition + 1
}

function sortOptionsByPosition(options) {
  return [...options].sort((left, right) => left.position - right.position)
}

function optionLabelsAreEqual(existingOptions, normalizedOptions) {
  const orderedOptions = sortOptionsByPosition(existingOptions)

  return (
    orderedOptions.length === normalizedOptions.length &&
    orderedOptions.every((option, index) => (
      option.label === normalizedOptions[index]
    ))
  )
}

function createGeneratedOptions(
  normalizedOptions,
  generateLearningTestId,
  reservedIds
) {
  const options = []

  for (let index = 0; index < normalizedOptions.length; index += 1) {
    const optionId = generateUniqueId(
      generateLearningTestId,
      'option',
      reservedIds
    )

    if (!optionId) {
      return null
    }

    options.push({
      id: optionId,
      label: normalizedOptions[index],
      position: index + 1,
    })
  }

  return options
}

function createHistoryProjection(attempt) {
  return {
    attemptId: attempt.id,
    moduleId: attempt.moduleId,
    startedAt: attempt.startedAt,
    completedAt: attempt.completedAt,
    totalQuestionCount: attempt.totalQuestionCount,
    correctAnswerCount: attempt.correctAnswerCount,
    scorePercent: attempt.scorePercent,
    answers: attempt.answers.map(cloneAttemptAnswer),
  }
}

function cloneHistoryProjection(projection) {
  return {
    ...projection,
    answers: projection.answers.map(cloneAttemptAnswer),
  }
}

function haveSameSubmittedAnswers(leftAnswers, rightAnswers) {
  return (
    leftAnswers.length === rightAnswers.length &&
    leftAnswers.every((answer, index) => (
      answer.questionId === rightAnswers[index].questionId &&
      answer.selectedOptionId === rightAnswers[index].selectedOptionId
    ))
  )
}

function areAttemptsEqual(leftAttempt, rightAttempt) {
  return (
    leftAttempt.id === rightAttempt.id &&
    leftAttempt.moduleId === rightAttempt.moduleId &&
    leftAttempt.startedAt === rightAttempt.startedAt &&
    leftAttempt.completedAt === rightAttempt.completedAt &&
    leftAttempt.totalQuestionCount === rightAttempt.totalQuestionCount &&
    leftAttempt.correctAnswerCount === rightAttempt.correctAnswerCount &&
    leftAttempt.scorePercent === rightAttempt.scorePercent &&
    leftAttempt.answers.length === rightAttempt.answers.length &&
    leftAttempt.answers.every((answer, index) => {
      const otherAnswer = rightAttempt.answers[index]

      return (
        answer.questionId === otherAnswer.questionId &&
        answer.questionRevision === otherAnswer.questionRevision &&
        answer.learningNodeId === otherAnswer.learningNodeId &&
        answer.selectedOptionId === otherAnswer.selectedOptionId &&
        answer.correctOptionId === otherAnswer.correctOptionId &&
        answer.isCorrect === otherAnswer.isCorrect
      )
    })
  )
}

function areAttemptLogsEqual(leftAttemptLog, rightAttemptLog) {
  return (
    leftAttemptLog.schemaVersion === rightAttemptLog.schemaVersion &&
    leftAttemptLog.dataOrigin === rightAttemptLog.dataOrigin &&
    leftAttemptLog.attempts.length === rightAttemptLog.attempts.length &&
    leftAttemptLog.attempts.every((attempt, index) => (
      areAttemptsEqual(attempt, rightAttemptLog.attempts[index])
    ))
  )
}

function validateSubmittedAnswers(answers, sessionQuestions) {
  const fieldErrors = {}

  if (!Array.isArray(answers)) {
    return {
      ok: false,
      fieldErrors: {
        answers: 'Antworten müssen vollständig als Array angegeben werden.',
      },
    }
  }

  const questionsById = new Map(
    sessionQuestions.map((question) => [question.id, question])
  )
  const submittedAnswersByQuestionId = new Map()

  for (const answer of answers) {
    if (!isPlainRecord(answer)) {
      fieldErrors.answers =
        'Jede Antwort muss genau eine bekannte Frage und Option enthalten.'
      continue
    }

    let propertyNames

    try {
      propertyNames = Reflect.ownKeys(answer)
    } catch {
      propertyNames = []
    }

    if (
      propertyNames.length !== 2 ||
      !Object.prototype.hasOwnProperty.call(answer, 'questionId') ||
      !Object.prototype.hasOwnProperty.call(answer, 'selectedOptionId') ||
      propertyNames.some((propertyName) => (
        propertyName !== 'questionId' && propertyName !== 'selectedOptionId'
      ))
    ) {
      fieldErrors.answers =
        'Jede Antwort muss genau eine bekannte Frage und Option enthalten.'
      continue
    }

    let questionId
    let selectedOptionId

    try {
      questionId = answer.questionId
      selectedOptionId = answer.selectedOptionId
    } catch {
      fieldErrors.answers =
        'Jede Antwort muss genau eine bekannte Frage und Option enthalten.'
      continue
    }

    if (
      !isTrimmedNonEmptyString(questionId) ||
      !isTrimmedNonEmptyString(selectedOptionId)
    ) {
      fieldErrors.answers =
        'Jede Antwort muss genau eine bekannte Frage und Option enthalten.'
      continue
    }

    const question = questionsById.get(questionId)

    if (
      !question ||
      submittedAnswersByQuestionId.has(questionId) ||
      !question.options.some((option) => option.id === selectedOptionId)
    ) {
      fieldErrors.answers =
        'Die Antworten passen nicht vollständig zur gestarteten Testsession.'
      continue
    }

    submittedAnswersByQuestionId.set(questionId, {
      questionId,
      selectedOptionId,
    })
  }

  if (
    answers.length !== sessionQuestions.length ||
    submittedAnswersByQuestionId.size !== sessionQuestions.length
  ) {
    fieldErrors.answers =
      'Für jede Sessionfrage ist genau eine bekannte Antwort erforderlich.'
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors }
  }

  return {
    ok: true,
    answers: sessionQuestions.map((question) => (
      submittedAnswersByQuestionId.get(question.id)
    )),
  }
}

export function createLearningTestService({
  learningHubService,
  learningTestBankStorage,
  learningTestAttemptStorage,
  generateLearningTestId = generateDefaultLearningTestId,
  now = getDefaultNow,
} = {}) {
  const sessions = new Map()
  const issuedSessionIds = new Set()
  const issuedAttemptIds = new Set()

  function readHubState() {
    if (typeof learningHubService?.loadHub !== 'function') {
      return createFailure(
        'unavailable',
        'learningHubServiceUnavailable',
        'Der LearningHub-Service ist nicht verfügbar.'
      )
    }

    let loadResult

    try {
      loadResult = learningHubService.loadHub()
    } catch {
      return createFailure(
        'readFailed',
        'learningHubServiceReadFailed',
        'Der aktuelle LearningHub konnte nicht gelesen werden.'
      )
    }

    if (loadResult?.ok === false) {
      return forwardDependencyFailure(
        loadResult,
        SAFE_HUB_FAILURES,
        'readFailed',
        'learningHubServiceReadFailed',
        'Der aktuelle LearningHub konnte nicht gelesen werden.'
      )
    }

    if (
      loadResult?.ok !== true ||
      !['empty', 'loaded'].includes(loadResult.status) ||
      !isObjectRecord(loadResult.hub)
    ) {
      return createFailure(
        'serviceFailed',
        'unexpectedLearningHubResult',
        'Der LearningHub-Service hat kein verwertbares Ergebnis geliefert.'
      )
    }

    let hub

    try {
      hub = cloneHub(loadResult.hub)
    } catch {
      return createFailure(
        'invalidStoredData',
        'invalidStoredLearningHub',
        'Der aktuelle LearningHub entspricht nicht dem gültigen privaten Inhaltsvertrag.'
      )
    }

    if (!isValidPrivateHub(hub)) {
      return createFailure(
        'invalidStoredData',
        'invalidStoredLearningHub',
        'Der aktuelle LearningHub entspricht nicht dem gültigen privaten Inhaltsvertrag.'
      )
    }

    return { ok: true, hub, referenceIndex: buildReferenceIndex(hub) }
  }

  function readBankState() {
    if (
      typeof learningTestBankStorage?.loadLearningTestBank !== 'function'
    ) {
      return createFailure(
        'unavailable',
        'learningTestBankStorageUnavailable',
        'Der LearningTest-Fragenspeicher ist nicht verfügbar.'
      )
    }

    let loadResult

    try {
      loadResult = learningTestBankStorage.loadLearningTestBank()
    } catch {
      return createFailure(
        'readFailed',
        'learningTestBankStorageReadFailed',
        'Die LearningTest-Fragen konnten nicht gelesen werden.'
      )
    }

    if (loadResult?.ok === false) {
      return forwardDependencyFailure(
        loadResult,
        SAFE_BANK_FAILURES,
        'readFailed',
        'learningTestBankStorageReadFailed',
        'Die LearningTest-Fragen konnten nicht gelesen werden.'
      )
    }

    if (
      loadResult?.ok !== true ||
      !['missing', 'found'].includes(loadResult.status) ||
      !isObjectRecord(loadResult.testBank)
    ) {
      return createFailure(
        'storageFailed',
        'unexpectedStorageResult',
        'Die LearningTest-Fragen konnten nicht verarbeitet werden.'
      )
    }

    let testBank

    try {
      testBank = cloneTestBank(loadResult.testBank)
    } catch {
      return createFailure(
        'invalidStoredData',
        'invalidStoredLearningTestBank',
        'Die gespeicherten LearningTest-Fragen sind ungültig.'
      )
    }

    if (!isValidPrivateTestBank(testBank)) {
      return createFailure(
        'invalidStoredData',
        'invalidStoredLearningTestBank',
        'Die gespeicherten LearningTest-Fragen sind ungültig.'
      )
    }

    return {
      ok: true,
      storageStatus: loadResult.status,
      testBank,
    }
  }

  function readCurrentTestState() {
    const hubResult = readHubState()

    if (!hubResult.ok) {
      return hubResult
    }

    const bankResult = readBankState()

    if (!bankResult.ok) {
      return bankResult
    }

    const referenceValidation = validateStoredQuestionReferences(
      bankResult.testBank,
      hubResult.referenceIndex
    )

    if (!referenceValidation.ok) {
      return createFailure(
        'invalidStoredData',
        referenceValidation.code,
        referenceValidation.message
      )
    }

    return {
      ok: true,
      hub: hubResult.hub,
      referenceIndex: hubResult.referenceIndex,
      testBank: bankResult.testBank,
      bankStorageStatus: bankResult.storageStatus,
    }
  }

  function readAttemptState(currentState) {
    if (
      typeof learningTestAttemptStorage?.loadLearningTestAttempts !==
        'function'
    ) {
      return createFailure(
        'unavailable',
        'learningTestAttemptStorageUnavailable',
        'Der LearningTest-Versuchsspeicher ist nicht verfügbar.'
      )
    }

    let loadResult

    try {
      loadResult = learningTestAttemptStorage.loadLearningTestAttempts()
    } catch {
      return createFailure(
        'readFailed',
        'learningTestAttemptStorageReadFailed',
        'Die LearningTest-Versuche konnten nicht gelesen werden.'
      )
    }

    if (loadResult?.ok === false) {
      return forwardDependencyFailure(
        loadResult,
        SAFE_ATTEMPT_FAILURES,
        'readFailed',
        'learningTestAttemptStorageReadFailed',
        'Die LearningTest-Versuche konnten nicht gelesen werden.'
      )
    }

    if (
      loadResult?.ok !== true ||
      !['missing', 'found'].includes(loadResult.status) ||
      !isObjectRecord(loadResult.attemptLog)
    ) {
      return createFailure(
        'storageFailed',
        'unexpectedStorageResult',
        'Die LearningTest-Versuche konnten nicht verarbeitet werden.'
      )
    }

    let attemptLog

    try {
      attemptLog = cloneAttemptLog(loadResult.attemptLog)
    } catch {
      return createFailure(
        'invalidStoredData',
        'invalidStoredLearningTestAttempts',
        'Die gespeicherten LearningTest-Versuche sind ungültig.'
      )
    }

    if (!isValidPrivateAttemptLog(attemptLog)) {
      return createFailure(
        'invalidStoredData',
        'invalidStoredLearningTestAttempts',
        'Die gespeicherten LearningTest-Versuche sind ungültig.'
      )
    }

    const referenceValidation = validateStoredAttemptReferences(
      attemptLog,
      currentState.referenceIndex,
      buildQuestionIndex(currentState.testBank),
      currentState.hub,
      currentState.testBank
    )

    if (!referenceValidation.ok) {
      return createFailure(
        'invalidStoredData',
        referenceValidation.code,
        referenceValidation.message
      )
    }

    return {
      ok: true,
      storageStatus: loadResult.status,
      attemptLog,
    }
  }

  function persistTestBank(updatedBank) {
    if (!isValidPrivateTestBank(updatedBank)) {
      return createFailure(
        'validationFailed',
        'invalidLearningTestBankState',
        'Die Fragenänderung ergibt keinen gültigen Gesamtzustand.'
      )
    }

    if (
      typeof learningTestBankStorage?.saveLearningTestBank !== 'function'
    ) {
      return createFailure(
        'unavailable',
        'learningTestBankStorageUnavailable',
        'Der LearningTest-Fragenspeicher ist nicht verfügbar.'
      )
    }

    let saveResult

    try {
      saveResult = learningTestBankStorage.saveLearningTestBank(
        cloneTestBank(updatedBank)
      )
    } catch {
      return createFailure(
        'writeFailed',
        'learningTestBankStorageWriteFailed',
        'Die LearningTest-Frage konnte nicht gespeichert werden.'
      )
    }

    if (saveResult?.ok === false) {
      return forwardDependencyFailure(
        saveResult,
        SAFE_BANK_FAILURES,
        'writeFailed',
        'learningTestBankStorageWriteFailed',
        'Die LearningTest-Frage konnte nicht gespeichert werden.'
      )
    }

    if (saveResult?.ok !== true || saveResult.status !== 'saved') {
      return createFailure(
        'storageFailed',
        'unexpectedStorageResult',
        'Die LearningTest-Frage konnte nicht gespeichert werden.'
      )
    }

    return { ok: true }
  }

  function appendAttempt(attempt, previousAttemptLog) {
    let expectedAttemptLog

    try {
      expectedAttemptLog = {
        schemaVersion: previousAttemptLog.schemaVersion,
        dataOrigin: previousAttemptLog.dataOrigin,
        attempts: [
          ...previousAttemptLog.attempts.map(cloneAttempt),
          cloneAttempt(attempt),
        ],
      }
    } catch {
      return createFailure(
        'validationFailed',
        'invalidLearningTestAttemptState',
        'Die Testauswertung ergibt keinen gültigen Versuch.'
      )
    }

    if (!isValidPrivateAttemptLog(expectedAttemptLog)) {
      return createFailure(
        'validationFailed',
        'invalidLearningTestAttemptState',
        'Die Testauswertung ergibt keinen gültigen Versuch.'
      )
    }

    if (
      typeof learningTestAttemptStorage?.appendLearningTestAttempt !==
        'function'
    ) {
      return createFailure(
        'unavailable',
        'learningTestAttemptStorageUnavailable',
        'Der LearningTest-Versuchsspeicher ist nicht verfügbar.'
      )
    }

    let appendResult

    try {
      appendResult = learningTestAttemptStorage.appendLearningTestAttempt(
        cloneAttempt(attempt)
      )
    } catch {
      return createFailure(
        'writeFailed',
        'learningTestAttemptStorageWriteFailed',
        'Der LearningTest-Versuch konnte nicht gespeichert werden.'
      )
    }

    const appendResultSnapshot = snapshotAppendResult(appendResult)

    if (!appendResultSnapshot.ok) {
      return createFailure(
        'storageFailed',
        'unexpectedStorageResult',
        'Der LearningTest-Versuch konnte nicht gespeichert werden.'
      )
    }

    appendResult = appendResultSnapshot.snapshot

    if (appendResult?.ok === false) {
      return forwardDependencyFailure(
        appendResult,
        SAFE_ATTEMPT_FAILURES,
        'writeFailed',
        'learningTestAttemptStorageWriteFailed',
        'Der LearningTest-Versuch konnte nicht gespeichert werden.'
      )
    }

    if (
      appendResult?.ok !== true ||
      appendResult.status !== 'appended' ||
      !isPlainRecord(appendResult.attemptLog) ||
      !isValidPrivateAttemptLog(appendResult.attemptLog)
    ) {
      return createFailure(
        'storageFailed',
        'unexpectedStorageResult',
        'Der LearningTest-Versuch konnte nicht gespeichert werden.'
      )
    }

    let attemptLog

    try {
      attemptLog = cloneAttemptLog(appendResult.attemptLog)
    } catch {
      return createFailure(
        'storageFailed',
        'unexpectedStorageResult',
        'Der LearningTest-Versuch konnte nicht gespeichert werden.'
      )
    }

    if (
      !isValidPrivateAttemptLog(attemptLog) ||
      !areAttemptLogsEqual(attemptLog, expectedAttemptLog)
    ) {
      return createFailure(
        'storageFailed',
        'unexpectedStorageResult',
        'Der LearningTest-Versuch konnte nicht gespeichert werden.'
      )
    }

    return { ok: true }
  }

  function loadTestBank() {
    const currentState = readCurrentTestState()

    if (!currentState.ok) {
      return currentState
    }

    return {
      ok: true,
      status:
        currentState.bankStorageStatus === 'missing' ? 'empty' : 'loaded',
      changed: false,
      testBank: cloneTestBank(currentState.testBank),
    }
  }

  function createQuestion(input) {
    const inputSnapshot = snapshotQuestionInput(input, false)

    if (!inputSnapshot.ok) {
      return createUnsafeInputFailure()
    }

    const inputValidation = validateQuestionInput(inputSnapshot.snapshot, false)

    if (Object.keys(inputValidation.fieldErrors).length > 0) {
      return createInputFailure(inputValidation.fieldErrors)
    }

    const currentState = readCurrentTestState()

    if (!currentState.ok) {
      return currentState
    }

    const targetReference = getTargetReference(
      currentState.referenceIndex,
      inputValidation.values.moduleId,
      inputValidation.values.chapterId,
      inputValidation.values.learningNodeId
    )

    if (!targetReference.ok) {
      return createFailure(
        targetReference.status,
        targetReference.code,
        targetReference.message
      )
    }

    const position = getNextQuestionPosition(
      currentState.testBank,
      inputValidation.values.learningNodeId
    )

    if (!position) {
      return createFailure(
        'generationFailed',
        'learningTestQuestionPositionGenerationFailed',
        'Die nächste Testfragenposition konnte nicht bestimmt werden.'
      )
    }

    const reservedIds = collectBankIds(currentState.testBank)
    const questionId = generateUniqueId(
      generateLearningTestId,
      'question',
      reservedIds
    )

    if (!questionId) {
      return createFailure(
        'generationFailed',
        'learningTestQuestionIdGenerationFailed',
        'Die Testfrage konnte nicht eindeutig vorbereitet werden.'
      )
    }

    const options = createGeneratedOptions(
      inputValidation.values.options,
      generateLearningTestId,
      reservedIds
    )

    if (!options) {
      return createFailure(
        'generationFailed',
        'learningTestOptionIdGenerationFailed',
        'Die Antwortoptionen konnten nicht eindeutig vorbereitet werden.'
      )
    }

    const timestampResult = getTimestamp(now)

    if (!timestampResult.ok) {
      return createFailure(
        'generationFailed',
        timestampResult.code,
        timestampResult.message
      )
    }

    const question = {
      id: questionId,
      moduleId: inputValidation.values.moduleId,
      chapterId: inputValidation.values.chapterId,
      learningNodeId: inputValidation.values.learningNodeId,
      type: LEARNING_TEST_QUESTION_TYPES.SINGLE_CHOICE,
      prompt: inputValidation.values.prompt,
      difficulty: inputValidation.values.difficulty,
      position,
      revision: 1,
      createdAt: timestampResult.timestamp,
      updatedAt: timestampResult.timestamp,
      options,
      correctOptionId:
        options[inputValidation.values.correctOptionIndex].id,
      explanation: inputValidation.values.explanation,
    }
    const updatedBank = {
      ...currentState.testBank,
      questions: [...currentState.testBank.questions, question],
    }

    if (
      !isValidPrivateTestBank(updatedBank) ||
      !validateStoredQuestionReferences(
        updatedBank,
        currentState.referenceIndex
      ).ok
    ) {
      return createFailure(
        'validationFailed',
        'invalidLearningTestBankState',
        'Die Fragenänderung ergibt keinen gültigen Gesamtzustand.'
      )
    }

    const persistResult = persistTestBank(updatedBank)

    if (!persistResult.ok) {
      return persistResult
    }

    return {
      ok: true,
      status: 'questionCreated',
      changed: true,
      question: cloneQuestion(question),
      testBank: cloneTestBank(updatedBank),
    }
  }

  function updateQuestion(input) {
    const inputSnapshot = snapshotQuestionInput(input, true)

    if (!inputSnapshot.ok) {
      return createUnsafeInputFailure()
    }

    const inputValidation = validateQuestionInput(inputSnapshot.snapshot, true)

    if (Object.keys(inputValidation.fieldErrors).length > 0) {
      return createInputFailure(inputValidation.fieldErrors)
    }

    const currentState = readCurrentTestState()

    if (!currentState.ok) {
      return currentState
    }

    const targetReference = getTargetReference(
      currentState.referenceIndex,
      inputValidation.values.moduleId,
      inputValidation.values.chapterId,
      inputValidation.values.learningNodeId
    )

    if (!targetReference.ok) {
      return createFailure(
        targetReference.status,
        targetReference.code,
        targetReference.message
      )
    }

    const questionIndex = currentState.testBank.questions.findIndex(
      (question) => question.id === inputValidation.values.questionId
    )

    if (questionIndex === -1) {
      return createFailure(
        'notFound',
        'questionNotFound',
        'Die angeforderte Testfrage wurde nicht gefunden.'
      )
    }

    const existingQuestion = currentState.testBank.questions[questionIndex]

    if (
      existingQuestion.moduleId !== inputValidation.values.moduleId ||
      existingQuestion.chapterId !== inputValidation.values.chapterId ||
      existingQuestion.learningNodeId !==
        inputValidation.values.learningNodeId
    ) {
      return createFailure(
        'ownershipMismatch',
        'questionLearningNodeMismatch',
        'Die Testfrage gehört nicht zum angegebenen LearningNode.'
      )
    }

    const optionsUnchanged = optionLabelsAreEqual(
      existingQuestion.options,
      inputValidation.values.options
    )
    const selectedCorrectOption = sortOptionsByPosition(
      existingQuestion.options
    )[inputValidation.values.correctOptionIndex]
    const unchanged = (
      existingQuestion.prompt === inputValidation.values.prompt &&
      existingQuestion.difficulty === inputValidation.values.difficulty &&
      existingQuestion.explanation === inputValidation.values.explanation &&
      optionsUnchanged &&
      selectedCorrectOption?.id === existingQuestion.correctOptionId
    )

    if (unchanged) {
      return {
        ok: true,
        status: 'questionUnchanged',
        changed: false,
        question: cloneQuestion(existingQuestion),
        testBank: cloneTestBank(currentState.testBank),
      }
    }

    if (
      !Number.isSafeInteger(existingQuestion.revision) ||
      existingQuestion.revision >= Number.MAX_SAFE_INTEGER
    ) {
      return createFailure(
        'generationFailed',
        'learningTestQuestionRevisionGenerationFailed',
        'Die nächste Testfragenrevision konnte nicht bestimmt werden.'
      )
    }

    let options

    if (optionsUnchanged) {
      options = existingQuestion.options.map(cloneOption)
    } else {
      options = createGeneratedOptions(
        inputValidation.values.options,
        generateLearningTestId,
        collectBankIds(currentState.testBank)
      )

      if (!options) {
        return createFailure(
          'generationFailed',
          'learningTestOptionIdGenerationFailed',
          'Die Antwortoptionen konnten nicht eindeutig vorbereitet werden.'
        )
      }
    }

    const timestampResult = getTimestamp(now, existingQuestion.updatedAt)

    if (!timestampResult.ok) {
      return createFailure(
        'generationFailed',
        timestampResult.code,
        timestampResult.message
      )
    }

    const updatedQuestion = {
      ...existingQuestion,
      prompt: inputValidation.values.prompt,
      difficulty: inputValidation.values.difficulty,
      revision: existingQuestion.revision + 1,
      updatedAt: timestampResult.timestamp,
      options,
      correctOptionId:
        sortOptionsByPosition(options)[
          inputValidation.values.correctOptionIndex
        ].id,
      explanation: inputValidation.values.explanation,
    }
    const updatedBank = {
      ...currentState.testBank,
      questions: currentState.testBank.questions.map((question, index) => (
        index === questionIndex ? updatedQuestion : question
      )),
    }

    if (
      !isValidPrivateTestBank(updatedBank) ||
      !validateStoredQuestionReferences(
        updatedBank,
        currentState.referenceIndex
      ).ok
    ) {
      return createFailure(
        'validationFailed',
        'invalidLearningTestBankState',
        'Die Fragenänderung ergibt keinen gültigen Gesamtzustand.'
      )
    }

    const persistResult = persistTestBank(updatedBank)

    if (!persistResult.ok) {
      return persistResult
    }

    return {
      ok: true,
      status: 'questionUpdated',
      changed: true,
      question: cloneQuestion(updatedQuestion),
      testBank: cloneTestBank(updatedBank),
    }
  }

  function startModuleTest(input) {
    const inputSnapshot = snapshotModuleInput(input)

    if (!inputSnapshot.ok) {
      return createUnsafeInputFailure()
    }

    const inputValidation = validateModuleInput(inputSnapshot.snapshot)

    if (Object.keys(inputValidation.fieldErrors).length > 0) {
      return createInputFailure(inputValidation.fieldErrors)
    }

    const currentState = readCurrentTestState()

    if (!currentState.ok) {
      return currentState
    }

    const targetReference = getTargetReference(
      currentState.referenceIndex,
      inputValidation.moduleId
    )

    if (!targetReference.ok) {
      return createFailure(
        targetReference.status,
        targetReference.code,
        targetReference.message
      )
    }

    let questions
    let publicQuestions

    try {
      questions = selectModuleTestQuestions(
        currentState.hub,
        currentState.testBank,
        inputValidation.moduleId
      )
      publicQuestions = projectPublicTestQuestions(questions)
    } catch {
      return createFailure(
        'projectionFailed',
        'learningTestProjectionFailed',
        'Der LearningTest konnte nicht vorbereitet werden.'
      )
    }

    const expectedQuestionCount = currentState.testBank.questions.filter(
      (question) => question.moduleId === inputValidation.moduleId
    ).length

    if (
      !Array.isArray(questions) ||
      !Array.isArray(publicQuestions) ||
      questions.length !== expectedQuestionCount ||
      publicQuestions.length !== questions.length
    ) {
      return createFailure(
        'projectionFailed',
        'learningTestProjectionFailed',
        'Der LearningTest konnte nicht vorbereitet werden.'
      )
    }

    if (questions.length === 0) {
      return createFailure(
        'empty',
        'moduleTestHasNoQuestions',
        'Für dieses LearningModule sind noch keine Testfragen vorhanden.'
      )
    }

    const sessionId = generateUniqueId(
      generateLearningTestId,
      'session',
      issuedSessionIds
    )

    if (!sessionId) {
      return createFailure(
        'generationFailed',
        'learningTestSessionIdGenerationFailed',
        'Die Testsession konnte nicht eindeutig vorbereitet werden.'
      )
    }

    const timestampResult = getTimestamp(now)

    if (!timestampResult.ok) {
      return createFailure(
        'generationFailed',
        timestampResult.code,
        timestampResult.message
      )
    }

    const privateSession = {
      id: sessionId,
      moduleId: inputValidation.moduleId,
      startedAt: timestampResult.timestamp,
      questions: questions.map(cloneQuestion),
      publicQuestions: publicQuestions.map(clonePublicQuestion),
      pendingSubmission: null,
      submissionInProgress: false,
    }

    sessions.set(sessionId, privateSession)

    return {
      ok: true,
      status: 'testStarted',
      changed: true,
      testSession: clonePublicSession({
        ...privateSession,
        questions: privateSession.publicQuestions,
      }),
    }
  }

  function cancelModuleTest(input) {
    const inputSnapshot = snapshotRecordFields(input, ['testSessionId'])

    if (!inputSnapshot.ok) {
      return createUnsafeInputFailure('invalidLearningTestCancellation')
    }

    const fieldErrors = {}
    const testSessionId = validateTargetId(
      inputSnapshot.snapshot.testSessionId,
      'testSessionId',
      fieldErrors
    )

    if (Object.keys(fieldErrors).length > 0) {
      return createInputFailure(
        fieldErrors,
        'invalidLearningTestCancellation'
      )
    }

    const privateSession = sessions.get(testSessionId)

    if (!privateSession) {
      return createFailure(
        'notFound',
        'testSessionNotFound',
        'Die Testsession ist nicht mehr verfügbar.'
      )
    }

    if (privateSession.submissionInProgress) {
      return createFailure(
        'conflict',
        'learningTestSubmissionInProgress',
        'Die Testsession wird bereits sicher verarbeitet.'
      )
    }

    if (privateSession.pendingSubmission) {
      return createFailure(
        'conflict',
        'learningTestPendingSubmission',
        'Die vorbereitete Testabgabe muss sicher abgeschlossen werden.'
      )
    }

    sessions.delete(testSessionId)

    return {
      ok: true,
      status: 'testCancelled',
      changed: true,
    }
  }

  function createCompletedProjection(attempt, questions) {
    const questionsById = new Map(
      questions.map((question) => [question.id, question])
    )

    return {
      attemptId: attempt.id,
      moduleId: attempt.moduleId,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
      totalQuestionCount: attempt.totalQuestionCount,
      correctAnswerCount: attempt.correctAnswerCount,
      scorePercent: attempt.scorePercent,
      answers: attempt.answers.map(cloneAttemptAnswer),
      feedback: attempt.answers.map((answer) => ({
        questionId: answer.questionId,
        selectedOptionId: answer.selectedOptionId,
        correctOptionId: answer.correctOptionId,
        isCorrect: answer.isCorrect,
        explanation: questionsById.get(answer.questionId)?.explanation ?? '',
      })),
    }
  }

  function completePersistedSession(sessionId, pendingSubmission) {
    sessions.delete(sessionId)

    return {
      ok: true,
      status: 'testCompleted',
      changed: true,
      result: cloneCompletedResult(pendingSubmission.result),
    }
  }

  function submitModuleTest(input) {
    const submissionTarget = snapshotSubmissionTarget(input)

    if (!submissionTarget.ok) {
      return createUnsafeInputFailure('invalidLearningTestSubmission')
    }

    const fieldErrors = {}
    const testSessionId = validateTargetId(
      submissionTarget.testSessionId,
      'testSessionId',
      fieldErrors
    )

    if (Object.keys(fieldErrors).length > 0) {
      return createInputFailure(fieldErrors, 'invalidLearningTestSubmission')
    }

    const privateSession = sessions.get(testSessionId)

    if (!privateSession) {
      const currentState = readCurrentTestState()

      if (!currentState.ok) {
        return currentState
      }

      return createFailure(
        'notFound',
        'testSessionNotFound',
        'Die Testsession ist nicht mehr verfügbar.'
      )
    }

    if (privateSession.submissionInProgress) {
      return createFailure(
        'conflict',
        'learningTestSubmissionInProgress',
        'Die Testsession wird bereits sicher verarbeitet.'
      )
    }

    privateSession.submissionInProgress = true

    try {
      const answersSnapshot = snapshotSubmissionAnswers(
        submissionTarget.source,
        privateSession.questions.length
      )

      if (!answersSnapshot.ok) {
        return createUnsafeInputFailure('invalidLearningTestSubmission')
      }

      const answerValidation = validateSubmittedAnswers(
        answersSnapshot.snapshot,
        privateSession.questions
      )

      if (!answerValidation.ok) {
        return createInputFailure(
          answerValidation.fieldErrors,
          'invalidLearningTestAnswers'
        )
      }

      const currentState = readCurrentTestState()

      if (!currentState.ok) {
        return currentState
      }

      const attemptState = readAttemptState(currentState)

      if (!attemptState.ok) {
        return attemptState
      }

      if (privateSession.pendingSubmission) {
        if (
          !haveSameSubmittedAnswers(
            answerValidation.answers,
            privateSession.pendingSubmission.submittedAnswers
          )
        ) {
          return createFailure(
            'conflict',
            'learningTestSubmissionConflict',
            'Eine bereits vorbereitete Testabgabe kann nicht verändert werden.'
          )
        }

        const persistedAttempt = attemptState.attemptLog.attempts.find(
          (attempt) => (
            attempt.id === privateSession.pendingSubmission.attempt.id
          )
        )

        if (persistedAttempt) {
          if (
            !areAttemptsEqual(
              persistedAttempt,
              privateSession.pendingSubmission.attempt
            )
          ) {
            return createFailure(
              'invalidStoredData',
              'conflictingLearningTestAttempt',
              'Der vorbereitete LearningTest-Versuch ist bereits widersprüchlich gespeichert.'
            )
          }

          return completePersistedSession(
            testSessionId,
            privateSession.pendingSubmission
          )
        }

        const appendResult = appendAttempt(
          privateSession.pendingSubmission.attempt,
          attemptState.attemptLog
        )

        if (!appendResult.ok) {
          return appendResult
        }

        return completePersistedSession(
          testSessionId,
          privateSession.pendingSubmission
        )
      }

      let evaluation

      try {
        evaluation = evaluateLearningTestAnswers(
          privateSession.questions,
          answerValidation.answers
        )
      } catch {
        return createFailure(
          'evaluationFailed',
          'learningTestEvaluationFailed',
          'Die Testantworten konnten nicht ausgewertet werden.'
        )
      }

      if (
        !isObjectRecord(evaluation) ||
        !Array.isArray(evaluation.answers) ||
        evaluation.answers.length !== privateSession.questions.length
      ) {
        return createFailure(
          'evaluationFailed',
          'learningTestEvaluationFailed',
          'Die Testantworten konnten nicht ausgewertet werden.'
        )
      }

      const attemptId = generateUniqueId(
        generateLearningTestId,
        'attempt',
        new Set(
          [
            ...issuedAttemptIds,
            ...attemptState.attemptLog.attempts.map((attempt) => attempt.id),
          ]
        ),
        issuedAttemptIds
      )

      if (!attemptId) {
        return createFailure(
          'generationFailed',
          'learningTestAttemptIdGenerationFailed',
          'Der Testversuch konnte nicht eindeutig vorbereitet werden.'
        )
      }

      issuedAttemptIds.add(attemptId)

      const timestampResult = getTimestamp(now, privateSession.startedAt)

      if (!timestampResult.ok) {
        return createFailure(
          'generationFailed',
          timestampResult.code,
          timestampResult.message
        )
      }

      const attempt = {
        id: attemptId,
        moduleId: privateSession.moduleId,
        startedAt: privateSession.startedAt,
        completedAt: timestampResult.timestamp,
        totalQuestionCount: evaluation.totalQuestionCount,
        correctAnswerCount: evaluation.correctAnswerCount,
        scorePercent: evaluation.scorePercent,
        answers: evaluation.answers.map(cloneAttemptAnswer),
      }
      const candidateLog = {
        ...attemptState.attemptLog,
        attempts: [...attemptState.attemptLog.attempts, attempt],
      }

      if (!isValidPrivateAttemptLog(candidateLog)) {
        return createFailure(
          'validationFailed',
          'invalidLearningTestAttemptState',
          'Die Testauswertung ergibt keinen gültigen Versuch.',
        )
      }

      const pendingSubmission = {
        attempt: cloneAttempt(attempt),
        submittedAnswers: answerValidation.answers.map((answer) => ({
          ...answer,
        })),
        result: createCompletedProjection(
          attempt,
          privateSession.questions
        ),
      }

      privateSession.pendingSubmission = pendingSubmission

      const appendResult = appendAttempt(attempt, attemptState.attemptLog)

      if (!appendResult.ok) {
        return appendResult
      }

      return completePersistedSession(testSessionId, pendingSubmission)
    } finally {
      privateSession.submissionInProgress = false
    }
  }

  function loadAttemptHistory(input) {
    const inputSnapshot = snapshotModuleInput(input)

    if (!inputSnapshot.ok) {
      return createUnsafeInputFailure()
    }

    const inputValidation = validateModuleInput(inputSnapshot.snapshot)

    if (Object.keys(inputValidation.fieldErrors).length > 0) {
      return createInputFailure(inputValidation.fieldErrors)
    }

    const currentState = readCurrentTestState()

    if (!currentState.ok) {
      return currentState
    }

    const targetReference = getTargetReference(
      currentState.referenceIndex,
      inputValidation.moduleId
    )

    if (!targetReference.ok) {
      return createFailure(
        targetReference.status,
        targetReference.code,
        targetReference.message
      )
    }

    const attemptState = readAttemptState(currentState)

    if (!attemptState.ok) {
      return attemptState
    }

    const attempts = attemptState.attemptLog.attempts
      .filter((attempt) => attempt.moduleId === inputValidation.moduleId)
      .map(createHistoryProjection)

    return {
      ok: true,
      status:
        attempts.length === 0
          ? 'attemptHistoryEmpty'
          : 'attemptHistoryLoaded',
      changed: false,
      attempts: attempts.map(cloneHistoryProjection),
    }
  }

  return Object.freeze({
    loadTestBank,
    createQuestion,
    updateQuestion,
    startModuleTest,
    cancelModuleTest,
    submitModuleTest,
    loadAttemptHistory,
  })
}
