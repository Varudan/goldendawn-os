export const LEARNING_TEST_BANK_SCHEMA_VERSION = 1

export const LEARNING_TEST_BANK_DATA_ORIGINS = Object.freeze([
  'synthetic',
  'private',
])

export const LEARNING_TEST_QUESTION_TYPES = Object.freeze({
  SINGLE_CHOICE: 'singleChoice',
})

export const LEARNING_TEST_DIFFICULTIES = Object.freeze({
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
})

export const LEARNING_TEST_PROMPT_MAX_LENGTH = 500
export const LEARNING_TEST_OPTION_LABEL_MAX_LENGTH = 300
export const LEARNING_TEST_EXPLANATION_MAX_LENGTH = 2000
export const LEARNING_TEST_MIN_OPTION_COUNT = 2
export const LEARNING_TEST_MAX_OPTION_COUNT = 6

export const LEARNING_TEST_BANK_ERROR_CODES = Object.freeze({
  INVALID_LEARNING_TEST_BANK: 'invalidLearningTestBank',
  UNSUPPORTED_SCHEMA_VERSION: 'unsupportedSchemaVersion',
  INVALID_DATA_ORIGIN: 'invalidDataOrigin',
  INVALID_QUESTIONS: 'invalidQuestions',
  INVALID_QUESTION: 'invalidQuestion',
  UNKNOWN_PROPERTY: 'unknownProperty',
  MISSING_PROPERTY: 'missingProperty',
  INVALID_ID: 'invalidId',
  DUPLICATE_ID: 'duplicateId',
  INVALID_QUESTION_TYPE: 'invalidQuestionType',
  INVALID_PROMPT: 'invalidPrompt',
  PROMPT_TOO_LONG: 'promptTooLong',
  INVALID_DIFFICULTY: 'invalidDifficulty',
  INVALID_POSITION: 'invalidPosition',
  DUPLICATE_QUESTION_POSITION: 'duplicateQuestionPosition',
  INVALID_REVISION: 'invalidRevision',
  INVALID_CREATED_AT: 'invalidCreatedAt',
  INVALID_UPDATED_AT: 'invalidUpdatedAt',
  UPDATED_AT_BEFORE_CREATED_AT: 'updatedAtBeforeCreatedAt',
  INVALID_OPTIONS: 'invalidOptions',
  INVALID_OPTION_COUNT: 'invalidOptionCount',
  INVALID_OPTION: 'invalidOption',
  DUPLICATE_OPTION_POSITION: 'duplicateOptionPosition',
  INVALID_OPTION_LABEL: 'invalidOptionLabel',
  OPTION_LABEL_TOO_LONG: 'optionLabelTooLong',
  CORRECT_OPTION_NOT_FOUND: 'correctOptionNotFound',
  INVALID_EXPLANATION: 'invalidExplanation',
  EXPLANATION_TOO_LONG: 'explanationTooLong',
})

const CANONICAL_UTC_TIMESTAMP_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

const BANK_PROPERTY_NAMES = new Set([
  'schemaVersion',
  'dataOrigin',
  'questions',
])

const QUESTION_PROPERTY_NAMES = new Set([
  'id',
  'moduleId',
  'chapterId',
  'learningNodeId',
  'type',
  'prompt',
  'difficulty',
  'position',
  'revision',
  'createdAt',
  'updatedAt',
  'options',
  'correctOptionId',
  'explanation',
])

const OPTION_PROPERTY_NAMES = new Set([
  'id',
  'label',
  'position',
])

const SUPPORTED_QUESTION_TYPES = Object.freeze(
  Object.values(LEARNING_TEST_QUESTION_TYPES)
)

const SUPPORTED_DIFFICULTIES = Object.freeze(
  Object.values(LEARNING_TEST_DIFFICULTIES)
)

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

export function isCanonicalUtcTimestamp(value) {
  if (
    typeof value !== 'string' ||
    !CANONICAL_UTC_TIMESTAMP_PATTERN.test(value)
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
      LEARNING_TEST_BANK_ERROR_CODES.UNKNOWN_PROPERTY,
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
      LEARNING_TEST_BANK_ERROR_CODES.MISSING_PROPERTY,
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
    LEARNING_TEST_BANK_ERROR_CODES.INVALID_ID,
    path,
    'Die ID muss eine nicht leere, getrimmte Zeichenfolge sein.'
  )
  return false
}

function validateUniqueEntityId(value, path, context) {
  if (!validateId(value, path, context.errors)) {
    return
  }

  if (context.entityIds.has(value)) {
    addError(
      context.errors,
      LEARNING_TEST_BANK_ERROR_CODES.DUPLICATE_ID,
      path,
      'Frage- und Options-IDs müssen innerhalb der Testbank eindeutig sein.'
    )
    return
  }

  context.entityIds.add(value)
}

function validatePosition(value, path, errors) {
  if (Number.isInteger(value) && value > 0) {
    return true
  }

  addError(
    errors,
    LEARNING_TEST_BANK_ERROR_CODES.INVALID_POSITION,
    path,
    'Die Position muss eine positive Ganzzahl sein.'
  )
  return false
}

function validateQuestionPosition(question, path, context) {
  const hasValidPosition = validatePosition(
    question.position,
    `${path}.position`,
    context.errors
  )

  if (
    !hasValidPosition ||
    !isTrimmedNonEmptyString(question.learningNodeId)
  ) {
    return
  }

  let positions = context.questionPositionsByLearningNodeId.get(
    question.learningNodeId
  )

  if (!positions) {
    positions = new Set()
    context.questionPositionsByLearningNodeId.set(
      question.learningNodeId,
      positions
    )
  }

  if (positions.has(question.position)) {
    addError(
      context.errors,
      LEARNING_TEST_BANK_ERROR_CODES.DUPLICATE_QUESTION_POSITION,
      `${path}.position`,
      'Fragepositionen müssen innerhalb eines LearningNodes eindeutig sein.'
    )
    return
  }

  positions.add(question.position)
}

function validateQuestionText(question, path, errors) {
  if (!isTrimmedNonEmptyString(question.prompt)) {
    addError(
      errors,
      LEARNING_TEST_BANK_ERROR_CODES.INVALID_PROMPT,
      `${path}.prompt`,
      'Der Fragetext muss eine nicht leere, getrimmte Zeichenfolge sein.'
    )
  }

  if (
    typeof question.prompt === 'string' &&
    question.prompt.length > LEARNING_TEST_PROMPT_MAX_LENGTH
  ) {
    addError(
      errors,
      LEARNING_TEST_BANK_ERROR_CODES.PROMPT_TOO_LONG,
      `${path}.prompt`,
      'Der Fragetext überschreitet die zulässige Länge.'
    )
  }

  if (
    typeof question.explanation !== 'string' ||
    question.explanation !== question.explanation.trim()
  ) {
    addError(
      errors,
      LEARNING_TEST_BANK_ERROR_CODES.INVALID_EXPLANATION,
      `${path}.explanation`,
      'Die Erklärung muss eine getrimmte Zeichenfolge sein.'
    )
  }

  if (
    typeof question.explanation === 'string' &&
    question.explanation.length > LEARNING_TEST_EXPLANATION_MAX_LENGTH
  ) {
    addError(
      errors,
      LEARNING_TEST_BANK_ERROR_CODES.EXPLANATION_TOO_LONG,
      `${path}.explanation`,
      'Die Erklärung überschreitet die zulässige Länge.'
    )
  }
}

function validateQuestionTimestamps(question, path, errors) {
  const hasValidCreatedAt = isCanonicalUtcTimestamp(question.createdAt)
  const hasValidUpdatedAt = isCanonicalUtcTimestamp(question.updatedAt)

  if (!hasValidCreatedAt) {
    addError(
      errors,
      LEARNING_TEST_BANK_ERROR_CODES.INVALID_CREATED_AT,
      `${path}.createdAt`,
      'createdAt muss ein kanonischer ISO-8601-UTC-Zeitstempel sein.'
    )
  }

  if (!hasValidUpdatedAt) {
    addError(
      errors,
      LEARNING_TEST_BANK_ERROR_CODES.INVALID_UPDATED_AT,
      `${path}.updatedAt`,
      'updatedAt muss ein kanonischer ISO-8601-UTC-Zeitstempel sein.'
    )
  }

  if (
    hasValidCreatedAt &&
    hasValidUpdatedAt &&
    Date.parse(question.updatedAt) < Date.parse(question.createdAt)
  ) {
    addError(
      errors,
      LEARNING_TEST_BANK_ERROR_CODES.UPDATED_AT_BEFORE_CREATED_AT,
      `${path}.updatedAt`,
      'updatedAt darf nicht vor createdAt liegen.'
    )
  }
}

function validateOption(option, path, context, positions) {
  validateKnownProperties(
    option,
    path,
    OPTION_PROPERTY_NAMES,
    context.errors
  )
  validateRequiredProperties(
    option,
    path,
    OPTION_PROPERTY_NAMES,
    context.errors
  )
  validateUniqueEntityId(option.id, `${path}.id`, context)

  if (!isTrimmedNonEmptyString(option.label)) {
    addError(
      context.errors,
      LEARNING_TEST_BANK_ERROR_CODES.INVALID_OPTION_LABEL,
      `${path}.label`,
      'Das Optionslabel muss eine nicht leere, getrimmte Zeichenfolge sein.'
    )
  }

  if (
    typeof option.label === 'string' &&
    option.label.length > LEARNING_TEST_OPTION_LABEL_MAX_LENGTH
  ) {
    addError(
      context.errors,
      LEARNING_TEST_BANK_ERROR_CODES.OPTION_LABEL_TOO_LONG,
      `${path}.label`,
      'Das Optionslabel überschreitet die zulässige Länge.'
    )
  }

  if (!validatePosition(option.position, `${path}.position`, context.errors)) {
    return
  }

  if (positions.has(option.position)) {
    addError(
      context.errors,
      LEARNING_TEST_BANK_ERROR_CODES.DUPLICATE_OPTION_POSITION,
      `${path}.position`,
      'Optionspositionen müssen innerhalb einer Frage eindeutig sein.'
    )
    return
  }

  positions.add(option.position)
}

function validateOptions(question, path, context) {
  if (!Array.isArray(question.options)) {
    addError(
      context.errors,
      LEARNING_TEST_BANK_ERROR_CODES.INVALID_OPTIONS,
      `${path}.options`,
      'options muss ein Array sein.'
    )
    return
  }

  if (
    question.options.length < LEARNING_TEST_MIN_OPTION_COUNT ||
    question.options.length > LEARNING_TEST_MAX_OPTION_COUNT
  ) {
    addError(
      context.errors,
      LEARNING_TEST_BANK_ERROR_CODES.INVALID_OPTION_COUNT,
      `${path}.options`,
      'Eine Frage muss zwischen zwei und sechs Optionen besitzen.'
    )
  }

  const positions = new Set()

  for (let index = 0; index < question.options.length; index += 1) {
    const option = question.options[index]
    const optionPath = `${path}.options[${index}]`

    if (!isObjectRecord(option)) {
      addError(
        context.errors,
        LEARNING_TEST_BANK_ERROR_CODES.INVALID_OPTION,
        optionPath,
        'Jede Antwortoption muss ein Objekt sein.'
      )
      continue
    }

    validateOption(option, optionPath, context, positions)
  }
}

function validateCorrectOption(question, path, errors) {
  const hasValidCorrectOptionId = validateId(
    question.correctOptionId,
    `${path}.correctOptionId`,
    errors
  )

  if (!hasValidCorrectOptionId || !Array.isArray(question.options)) {
    return
  }

  const matchingOptionCount = question.options.reduce((count, option) => (
    isObjectRecord(option) && option.id === question.correctOptionId
      ? count + 1
      : count
  ), 0)

  if (matchingOptionCount !== 1) {
    addError(
      errors,
      LEARNING_TEST_BANK_ERROR_CODES.CORRECT_OPTION_NOT_FOUND,
      `${path}.correctOptionId`,
      'correctOptionId muss exakt auf eine Option derselben Frage verweisen.'
    )
  }
}

function validateQuestion(question, path, context) {
  validateKnownProperties(
    question,
    path,
    QUESTION_PROPERTY_NAMES,
    context.errors
  )
  validateRequiredProperties(
    question,
    path,
    QUESTION_PROPERTY_NAMES,
    context.errors
  )
  validateUniqueEntityId(question.id, `${path}.id`, context)
  validateId(question.moduleId, `${path}.moduleId`, context.errors)
  validateId(question.chapterId, `${path}.chapterId`, context.errors)
  validateId(
    question.learningNodeId,
    `${path}.learningNodeId`,
    context.errors
  )

  if (!SUPPORTED_QUESTION_TYPES.includes(question.type)) {
    addError(
      context.errors,
      LEARNING_TEST_BANK_ERROR_CODES.INVALID_QUESTION_TYPE,
      `${path}.type`,
      'Der Fragetyp wird in dieser Schemaversion nicht unterstützt.'
    )
  }

  validateQuestionText(question, path, context.errors)

  if (!SUPPORTED_DIFFICULTIES.includes(question.difficulty)) {
    addError(
      context.errors,
      LEARNING_TEST_BANK_ERROR_CODES.INVALID_DIFFICULTY,
      `${path}.difficulty`,
      'Der Schwierigkeitsgrad wird in dieser Schemaversion nicht unterstützt.'
    )
  }

  validateQuestionPosition(question, path, context)

  if (!Number.isInteger(question.revision) || question.revision < 1) {
    addError(
      context.errors,
      LEARNING_TEST_BANK_ERROR_CODES.INVALID_REVISION,
      `${path}.revision`,
      'Die Revision muss eine positive Ganzzahl sein.'
    )
  }

  validateQuestionTimestamps(question, path, context.errors)
  validateOptions(question, path, context)
  validateCorrectOption(question, path, context.errors)
}

export function validateLearningTestBank(testBank) {
  const errors = []

  if (!isObjectRecord(testBank)) {
    addError(
      errors,
      LEARNING_TEST_BANK_ERROR_CODES.INVALID_LEARNING_TEST_BANK,
      '$',
      'Die LearningTestBank muss ein Objekt sein.'
    )
    return { ok: false, errors }
  }

  validateKnownProperties(testBank, '$', BANK_PROPERTY_NAMES, errors)
  validateRequiredProperties(testBank, '$', BANK_PROPERTY_NAMES, errors)

  if (testBank.schemaVersion !== LEARNING_TEST_BANK_SCHEMA_VERSION) {
    addError(
      errors,
      LEARNING_TEST_BANK_ERROR_CODES.UNSUPPORTED_SCHEMA_VERSION,
      '$.schemaVersion',
      'Die LearningTestBank-Schemaversion wird nicht unterstützt.'
    )
  }

  if (!LEARNING_TEST_BANK_DATA_ORIGINS.includes(testBank.dataOrigin)) {
    addError(
      errors,
      LEARNING_TEST_BANK_ERROR_CODES.INVALID_DATA_ORIGIN,
      '$.dataOrigin',
      'dataOrigin muss synthetic oder private sein.'
    )
  }

  if (!Array.isArray(testBank.questions)) {
    addError(
      errors,
      LEARNING_TEST_BANK_ERROR_CODES.INVALID_QUESTIONS,
      '$.questions',
      'questions muss ein Array sein.'
    )
  } else {
    const context = {
      errors,
      entityIds: new Set(),
      questionPositionsByLearningNodeId: new Map(),
    }

    for (let index = 0; index < testBank.questions.length; index += 1) {
      const question = testBank.questions[index]
      const questionPath = `$.questions[${index}]`

      if (!isObjectRecord(question)) {
        addError(
          errors,
          LEARNING_TEST_BANK_ERROR_CODES.INVALID_QUESTION,
          questionPath,
          'Jede LearningTest-Frage muss ein Objekt sein.'
        )
        continue
      }

      validateQuestion(question, questionPath, context)
    }
  }

  return errors.length === 0 ? { ok: true, errors: [] } : { ok: false, errors }
}
