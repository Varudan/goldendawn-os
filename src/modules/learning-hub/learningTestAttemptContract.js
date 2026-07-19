import { isCanonicalUtcTimestamp } from './learningTestBankContract.js'

export const LEARNING_TEST_ATTEMPT_SCHEMA_VERSION = 1

export const LEARNING_TEST_ATTEMPT_DATA_ORIGINS = Object.freeze([
  'synthetic',
  'private',
])

export const LEARNING_TEST_ATTEMPT_ERROR_CODES = Object.freeze({
  INVALID_LEARNING_TEST_ATTEMPT_LOG: 'invalidLearningTestAttemptLog',
  UNSUPPORTED_SCHEMA_VERSION: 'unsupportedSchemaVersion',
  INVALID_DATA_ORIGIN: 'invalidDataOrigin',
  INVALID_ATTEMPTS: 'invalidAttempts',
  INVALID_ATTEMPT: 'invalidAttempt',
  UNKNOWN_PROPERTY: 'unknownProperty',
  MISSING_PROPERTY: 'missingProperty',
  INVALID_ID: 'invalidId',
  DUPLICATE_ATTEMPT_ID: 'duplicateAttemptId',
  INVALID_STARTED_AT: 'invalidStartedAt',
  INVALID_COMPLETED_AT: 'invalidCompletedAt',
  COMPLETED_AT_BEFORE_STARTED_AT: 'completedAtBeforeStartedAt',
  INVALID_TOTAL_QUESTION_COUNT: 'invalidTotalQuestionCount',
  INVALID_CORRECT_ANSWER_COUNT: 'invalidCorrectAnswerCount',
  INVALID_SCORE_PERCENT: 'invalidScorePercent',
  INVALID_ANSWERS: 'invalidAnswers',
  ATTEMPT_REQUIRES_ANSWER: 'attemptRequiresAnswer',
  INVALID_ANSWER: 'invalidAnswer',
  DUPLICATE_QUESTION_ID: 'duplicateQuestionId',
  INVALID_QUESTION_REVISION: 'invalidQuestionRevision',
  INVALID_IS_CORRECT: 'invalidIsCorrect',
  INCONSISTENT_IS_CORRECT: 'inconsistentIsCorrect',
  TOTAL_QUESTION_COUNT_MISMATCH: 'totalQuestionCountMismatch',
  CORRECT_ANSWER_COUNT_MISMATCH: 'correctAnswerCountMismatch',
  SCORE_PERCENT_MISMATCH: 'scorePercentMismatch',
})

const LOG_PROPERTY_NAMES = new Set([
  'schemaVersion',
  'dataOrigin',
  'attempts',
])

const ATTEMPT_PROPERTY_NAMES = new Set([
  'id',
  'moduleId',
  'startedAt',
  'completedAt',
  'totalQuestionCount',
  'correctAnswerCount',
  'scorePercent',
  'answers',
])

const ANSWER_PROPERTY_NAMES = new Set([
  'questionId',
  'questionRevision',
  'learningNodeId',
  'selectedOptionId',
  'correctOptionId',
  'isCorrect',
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

function addError(errors, code, path, message) {
  errors.push({ code, path, message })
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
      LEARNING_TEST_ATTEMPT_ERROR_CODES.UNKNOWN_PROPERTY,
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
      LEARNING_TEST_ATTEMPT_ERROR_CODES.MISSING_PROPERTY,
      `${path}.${propertyName}`,
      'Ein erforderliches Vertragsfeld fehlt.'
    )
  })
}

function validateId(value, path, errors) {
  if (isTrimmedNonEmptyString(value)) {
    return true
  }

  addError(
    errors,
    LEARNING_TEST_ATTEMPT_ERROR_CODES.INVALID_ID,
    path,
    'Die ID muss eine nicht leere, getrimmte Zeichenfolge sein.'
  )
  return false
}

function validateAttemptId(attempt, path, context) {
  if (!validateId(attempt.id, `${path}.id`, context.errors)) {
    return
  }

  if (context.attemptIds.has(attempt.id)) {
    addError(
      context.errors,
      LEARNING_TEST_ATTEMPT_ERROR_CODES.DUPLICATE_ATTEMPT_ID,
      `${path}.id`,
      'Attempt-IDs müssen innerhalb des Logs eindeutig sein.'
    )
    return
  }

  context.attemptIds.add(attempt.id)
}

function validateAttemptTimestamps(attempt, path, errors) {
  const hasValidStartedAt = isCanonicalUtcTimestamp(attempt.startedAt)
  const hasValidCompletedAt = isCanonicalUtcTimestamp(attempt.completedAt)

  if (!hasValidStartedAt) {
    addError(
      errors,
      LEARNING_TEST_ATTEMPT_ERROR_CODES.INVALID_STARTED_AT,
      `${path}.startedAt`,
      'startedAt muss ein kanonischer ISO-8601-UTC-Zeitstempel sein.'
    )
  }

  if (!hasValidCompletedAt) {
    addError(
      errors,
      LEARNING_TEST_ATTEMPT_ERROR_CODES.INVALID_COMPLETED_AT,
      `${path}.completedAt`,
      'completedAt muss ein kanonischer ISO-8601-UTC-Zeitstempel sein.'
    )
  }

  if (
    hasValidStartedAt &&
    hasValidCompletedAt &&
    Date.parse(attempt.completedAt) < Date.parse(attempt.startedAt)
  ) {
    addError(
      errors,
      LEARNING_TEST_ATTEMPT_ERROR_CODES.COMPLETED_AT_BEFORE_STARTED_AT,
      `${path}.completedAt`,
      'completedAt darf nicht vor startedAt liegen.'
    )
  }
}

function validateAttemptNumbers(attempt, path, errors) {
  const hasValidTotalQuestionCount = (
    Number.isInteger(attempt.totalQuestionCount) &&
    attempt.totalQuestionCount > 0
  )

  if (!hasValidTotalQuestionCount) {
    addError(
      errors,
      LEARNING_TEST_ATTEMPT_ERROR_CODES.INVALID_TOTAL_QUESTION_COUNT,
      `${path}.totalQuestionCount`,
      'totalQuestionCount muss eine positive Ganzzahl sein.'
    )
  }

  const hasValidCorrectAnswerCount = (
    Number.isInteger(attempt.correctAnswerCount) &&
    attempt.correctAnswerCount >= 0 &&
    (
      !hasValidTotalQuestionCount ||
      attempt.correctAnswerCount <= attempt.totalQuestionCount
    )
  )

  if (!hasValidCorrectAnswerCount) {
    addError(
      errors,
      LEARNING_TEST_ATTEMPT_ERROR_CODES.INVALID_CORRECT_ANSWER_COUNT,
      `${path}.correctAnswerCount`,
      'correctAnswerCount muss eine gültige nicht negative Ganzzahl sein.'
    )
  }

  const hasValidScorePercent = (
    Number.isInteger(attempt.scorePercent) &&
    attempt.scorePercent >= 0 &&
    attempt.scorePercent <= 100
  )

  if (!hasValidScorePercent) {
    addError(
      errors,
      LEARNING_TEST_ATTEMPT_ERROR_CODES.INVALID_SCORE_PERCENT,
      `${path}.scorePercent`,
      'scorePercent muss eine Ganzzahl zwischen 0 und 100 sein.'
    )
  }

  return {
    hasValidTotalQuestionCount,
    hasValidCorrectAnswerCount,
    hasValidScorePercent,
  }
}

function validateAnswer(answer, path, context) {
  validateKnownProperties(
    answer,
    path,
    ANSWER_PROPERTY_NAMES,
    context.errors
  )
  validateRequiredProperties(
    answer,
    path,
    ANSWER_PROPERTY_NAMES,
    context.errors
  )

  if (validateId(answer.questionId, `${path}.questionId`, context.errors)) {
    if (context.questionIds.has(answer.questionId)) {
      addError(
        context.errors,
        LEARNING_TEST_ATTEMPT_ERROR_CODES.DUPLICATE_QUESTION_ID,
        `${path}.questionId`,
        'Jede questionId darf innerhalb eines Attempts nur einmal vorkommen.'
      )
    } else {
      context.questionIds.add(answer.questionId)
    }
  }

  if (
    !Number.isInteger(answer.questionRevision) ||
    answer.questionRevision < 1
  ) {
    addError(
      context.errors,
      LEARNING_TEST_ATTEMPT_ERROR_CODES.INVALID_QUESTION_REVISION,
      `${path}.questionRevision`,
      'questionRevision muss eine positive Ganzzahl sein.'
    )
  }

  validateId(
    answer.learningNodeId,
    `${path}.learningNodeId`,
    context.errors
  )
  validateId(
    answer.selectedOptionId,
    `${path}.selectedOptionId`,
    context.errors
  )
  validateId(
    answer.correctOptionId,
    `${path}.correctOptionId`,
    context.errors
  )

  if (typeof answer.isCorrect !== 'boolean') {
    addError(
      context.errors,
      LEARNING_TEST_ATTEMPT_ERROR_CODES.INVALID_IS_CORRECT,
      `${path}.isCorrect`,
      'isCorrect muss ein boolescher Wert sein.'
    )
    context.answersAreCountable = false
    return
  }

  if (answer.isCorrect) {
    context.computedCorrectAnswerCount += 1
  }

  if (
    answer.isCorrect !==
    (answer.selectedOptionId === answer.correctOptionId)
  ) {
    addError(
      context.errors,
      LEARNING_TEST_ATTEMPT_ERROR_CODES.INCONSISTENT_IS_CORRECT,
      `${path}.isCorrect`,
      'isCorrect muss der strikten Gleichheit der Options-IDs entsprechen.'
    )
  }
}

function validateAnswers(attempt, path, context) {
  if (!Array.isArray(attempt.answers)) {
    addError(
      context.errors,
      LEARNING_TEST_ATTEMPT_ERROR_CODES.INVALID_ANSWERS,
      `${path}.answers`,
      'answers muss ein Array sein.'
    )
    return null
  }

  if (attempt.answers.length === 0) {
    addError(
      context.errors,
      LEARNING_TEST_ATTEMPT_ERROR_CODES.ATTEMPT_REQUIRES_ANSWER,
      `${path}.answers`,
      'Ein abgeschlossener Attempt benötigt mindestens eine Antwort.'
    )
  }

  const answerContext = {
    errors: context.errors,
    questionIds: new Set(),
    computedCorrectAnswerCount: 0,
    answersAreCountable: true,
  }

  for (let index = 0; index < attempt.answers.length; index += 1) {
    const answer = attempt.answers[index]
    const answerPath = `${path}.answers[${index}]`

    if (!isObjectRecord(answer)) {
      addError(
        context.errors,
        LEARNING_TEST_ATTEMPT_ERROR_CODES.INVALID_ANSWER,
        answerPath,
        'Jede LearningTest-Antwort muss ein Objekt sein.'
      )
      answerContext.answersAreCountable = false
      continue
    }

    validateAnswer(answer, answerPath, answerContext)
  }

  return answerContext
}

function validateCountConsistency(
  attempt,
  path,
  numberValidation,
  answerContext,
  errors
) {
  if (!answerContext) {
    return
  }

  if (
    numberValidation.hasValidTotalQuestionCount &&
    attempt.totalQuestionCount !== attempt.answers.length
  ) {
    addError(
      errors,
      LEARNING_TEST_ATTEMPT_ERROR_CODES.TOTAL_QUESTION_COUNT_MISMATCH,
      `${path}.totalQuestionCount`,
      'totalQuestionCount muss der Anzahl der Antworten entsprechen.'
    )
  }

  if (
    numberValidation.hasValidCorrectAnswerCount &&
    answerContext.answersAreCountable &&
    attempt.correctAnswerCount !== answerContext.computedCorrectAnswerCount
  ) {
    addError(
      errors,
      LEARNING_TEST_ATTEMPT_ERROR_CODES.CORRECT_ANSWER_COUNT_MISMATCH,
      `${path}.correctAnswerCount`,
      'correctAnswerCount muss der Anzahl korrekter Antworten entsprechen.'
    )
  }

  if (
    numberValidation.hasValidTotalQuestionCount &&
    numberValidation.hasValidCorrectAnswerCount &&
    numberValidation.hasValidScorePercent
  ) {
    const expectedScore = Math.round(
      attempt.correctAnswerCount / attempt.totalQuestionCount * 100
    )

    if (attempt.scorePercent !== expectedScore) {
      addError(
        errors,
        LEARNING_TEST_ATTEMPT_ERROR_CODES.SCORE_PERCENT_MISMATCH,
        `${path}.scorePercent`,
        'scorePercent entspricht nicht der festgelegten Rundungsregel.'
      )
    }
  }
}

function validateAttempt(attempt, path, context) {
  validateKnownProperties(
    attempt,
    path,
    ATTEMPT_PROPERTY_NAMES,
    context.errors
  )
  validateRequiredProperties(
    attempt,
    path,
    ATTEMPT_PROPERTY_NAMES,
    context.errors
  )
  validateAttemptId(attempt, path, context)
  validateId(attempt.moduleId, `${path}.moduleId`, context.errors)
  validateAttemptTimestamps(attempt, path, context.errors)
  const numberValidation = validateAttemptNumbers(
    attempt,
    path,
    context.errors
  )
  const answerContext = validateAnswers(attempt, path, context)
  validateCountConsistency(
    attempt,
    path,
    numberValidation,
    answerContext,
    context.errors
  )
}

export function validateLearningTestAttemptLog(attemptLog) {
  const errors = []

  if (!isObjectRecord(attemptLog)) {
    addError(
      errors,
      LEARNING_TEST_ATTEMPT_ERROR_CODES.INVALID_LEARNING_TEST_ATTEMPT_LOG,
      '$',
      'Der LearningTestAttemptLog muss ein Objekt sein.'
    )
    return { ok: false, errors }
  }

  validateKnownProperties(attemptLog, '$', LOG_PROPERTY_NAMES, errors)
  validateRequiredProperties(attemptLog, '$', LOG_PROPERTY_NAMES, errors)

  if (attemptLog.schemaVersion !== LEARNING_TEST_ATTEMPT_SCHEMA_VERSION) {
    addError(
      errors,
      LEARNING_TEST_ATTEMPT_ERROR_CODES.UNSUPPORTED_SCHEMA_VERSION,
      '$.schemaVersion',
      'Die LearningTestAttemptLog-Schemaversion wird nicht unterstützt.'
    )
  }

  if (!LEARNING_TEST_ATTEMPT_DATA_ORIGINS.includes(attemptLog.dataOrigin)) {
    addError(
      errors,
      LEARNING_TEST_ATTEMPT_ERROR_CODES.INVALID_DATA_ORIGIN,
      '$.dataOrigin',
      'dataOrigin muss synthetic oder private sein.'
    )
  }

  if (!Array.isArray(attemptLog.attempts)) {
    addError(
      errors,
      LEARNING_TEST_ATTEMPT_ERROR_CODES.INVALID_ATTEMPTS,
      '$.attempts',
      'attempts muss ein Array sein.'
    )
  } else {
    const context = { errors, attemptIds: new Set() }

    for (let index = 0; index < attemptLog.attempts.length; index += 1) {
      const attempt = attemptLog.attempts[index]
      const attemptPath = `$.attempts[${index}]`

      if (!isObjectRecord(attempt)) {
        addError(
          errors,
          LEARNING_TEST_ATTEMPT_ERROR_CODES.INVALID_ATTEMPT,
          attemptPath,
          'Jeder LearningTest-Attempt muss ein Objekt sein.'
        )
        continue
      }

      validateAttempt(attempt, attemptPath, context)
    }
  }

  return errors.length === 0 ? { ok: true, errors: [] } : { ok: false, errors }
}
