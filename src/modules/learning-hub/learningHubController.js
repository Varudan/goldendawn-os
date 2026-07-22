import { validateLearningHub } from './learningHubContract.js'
import {
  LEARNING_ARTIFACT_CONTENT_MAX_LENGTH,
  LEARNING_ARTIFACT_TYPES,
  validateLearningArtifactStore,
} from './learningArtifactContract.js'
import {
  LEARNING_TEST_BANK_SCHEMA_VERSION,
  LEARNING_TEST_DIFFICULTIES,
  LEARNING_TEST_EXPLANATION_MAX_LENGTH,
  LEARNING_TEST_MAX_OPTION_COUNT,
  LEARNING_TEST_MIN_OPTION_COUNT,
  LEARNING_TEST_OPTION_LABEL_MAX_LENGTH,
  LEARNING_TEST_PROMPT_MAX_LENGTH,
  LEARNING_TEST_QUESTION_TYPES,
  isCanonicalUtcTimestamp,
  validateLearningTestBank,
} from './learningTestBankContract.js'

const EMPTY_PRIVATE_HUB = Object.freeze({
  schemaVersion: 2,
  dataOrigin: 'private',
  modules: Object.freeze([]),
})

const FORM_TYPES = Object.freeze({
  CREATE_MODULE: 'createModule',
  RENAME_MODULE: 'renameModule',
  ADD_CHAPTER: 'addChapter',
  RENAME_CHAPTER: 'renameChapter',
  ADD_LEARNING_NODE: 'addLearningNode',
  UPDATE_LEARNING_NODE: 'updateLearningNode',
})

const FORM_FIELDS = Object.freeze({
  [FORM_TYPES.CREATE_MODULE]: Object.freeze([
    'title',
    'firstChapterTitle',
  ]),
  [FORM_TYPES.RENAME_MODULE]: Object.freeze(['title']),
  [FORM_TYPES.ADD_CHAPTER]: Object.freeze(['title']),
  [FORM_TYPES.RENAME_CHAPTER]: Object.freeze(['title']),
  [FORM_TYPES.ADD_LEARNING_NODE]: Object.freeze(['title', 'content']),
  [FORM_TYPES.UPDATE_LEARNING_NODE]: Object.freeze(['title', 'content']),
})

const SERVICE_METHODS = Object.freeze({
  [FORM_TYPES.CREATE_MODULE]: 'createModule',
  [FORM_TYPES.RENAME_MODULE]: 'renameModule',
  [FORM_TYPES.ADD_CHAPTER]: 'addChapter',
  [FORM_TYPES.RENAME_CHAPTER]: 'renameChapter',
  [FORM_TYPES.ADD_LEARNING_NODE]: 'addLearningNode',
  [FORM_TYPES.UPDATE_LEARNING_NODE]: 'updateLearningNode',
})

const SUCCESS_STATUSES = Object.freeze({
  [FORM_TYPES.CREATE_MODULE]: 'moduleCreated',
  [FORM_TYPES.RENAME_MODULE]: 'moduleRenamed',
  [FORM_TYPES.ADD_CHAPTER]: 'chapterAdded',
  [FORM_TYPES.RENAME_CHAPTER]: 'chapterRenamed',
  [FORM_TYPES.ADD_LEARNING_NODE]: 'learningNodeAdded',
  [FORM_TYPES.UPDATE_LEARNING_NODE]: 'learningNodeUpdated',
})

const SUCCESS_MESSAGES = Object.freeze({
  [FORM_TYPES.CREATE_MODULE]: 'Lernmodul wurde lokal erstellt.',
  [FORM_TYPES.RENAME_MODULE]: 'Lernmodul wurde lokal umbenannt.',
  [FORM_TYPES.ADD_CHAPTER]: 'Kapitel wurde lokal erstellt.',
  [FORM_TYPES.RENAME_CHAPTER]: 'Kapitel wurde lokal umbenannt.',
  [FORM_TYPES.ADD_LEARNING_NODE]: 'LearningNode wurde lokal erstellt.',
  [FORM_TYPES.UPDATE_LEARNING_NODE]: 'LearningNode wurde lokal aktualisiert.',
})

const PROGRESS_SUCCESS_RESULTS = Object.freeze({
  completeChapter: Object.freeze({
    chapterCompleted: true,
    chapterAlreadyCompleted: false,
  }),
  reopenChapter: Object.freeze({
    chapterReopened: true,
    chapterAlreadyOpen: false,
  }),
})

const PROGRESS_SUCCESS_MESSAGES = Object.freeze({
  completeChapter: 'Kapitel wurde als abgeschlossen markiert.',
  reopenChapter: 'Kapitel wurde wieder geöffnet.',
})

const PROGRESS_LOAD_ERROR_MESSAGE =
  'Der Kapitel- und Modulfortschritt ist derzeit nicht verfügbar. Inhalte können weiterhin bearbeitet werden.'
const PROGRESS_STALE_ERROR_MESSAGE =
  'Der Fortschritt ist nach der Inhaltsänderung nicht aktuell. Bitte lade ihn erneut.'
const PROGRESS_MUTATION_ERROR_MESSAGE =
  'Der Kapitelstatus konnte nicht gespeichert werden. Bitte versuche es erneut.'

const ARTIFACT_TYPES = Object.freeze([
  LEARNING_ARTIFACT_TYPES.NOTE,
  LEARNING_ARTIFACT_TYPES.SUMMARY,
])

const ARTIFACT_SAVE_METHODS = Object.freeze({
  [LEARNING_ARTIFACT_TYPES.NOTE]: 'saveNote',
  [LEARNING_ARTIFACT_TYPES.SUMMARY]: 'saveSummary',
})

const ARTIFACT_CLEAR_METHODS = Object.freeze({
  [LEARNING_ARTIFACT_TYPES.NOTE]: 'clearNote',
  [LEARNING_ARTIFACT_TYPES.SUMMARY]: 'clearSummary',
})

const ARTIFACT_LABELS = Object.freeze({
  [LEARNING_ARTIFACT_TYPES.NOTE]: 'Notiz',
  [LEARNING_ARTIFACT_TYPES.SUMMARY]: 'Zusammenfassung',
})

const ARTIFACT_SAVE_SUCCESS_RESULTS = Object.freeze({
  artifactCreated: true,
  artifactUpdated: true,
  artifactUnchanged: false,
})

const ARTIFACT_CLEAR_SUCCESS_RESULTS = Object.freeze({
  artifactCleared: true,
  artifactAlreadyEmpty: false,
})

const ARTIFACT_LOAD_ERROR_MESSAGE =
  'Notizen und Zusammenfassungen sind derzeit nicht verfügbar. Lerninhalte und Fortschritt bleiben bedienbar.'
const ARTIFACT_MUTATION_ERROR_MESSAGE =
  'Das Lernartefakt konnte nicht lokal gespeichert werden. Bitte versuche es erneut.'
const ARTIFACT_RESULT_ERROR_MESSAGE =
  'Das Ergebnis der Artefaktoperation konnte nicht sicher verarbeitet werden. Der letzte gültige Stand bleibt erhalten.'
const ARTIFACT_DIRTY_BLOCK_MESSAGE =
  'Es gibt einen ungespeicherten Entwurf. Speichere ihn oder brich die Bearbeitung ab, bevor du den Bereich wechselst.'

const TEST_BANK_LOAD_ERROR_MESSAGE =
  'Die lokalen Testfragen sind derzeit nicht verfügbar. Lerninhalte, Fortschritt und Lernartefakte bleiben bedienbar.'
const TEST_BANK_RESULT_ERROR_MESSAGE =
  'Das Ergebnis der Testfragenoperation konnte nicht sicher verarbeitet werden. Der letzte gültige Stand bleibt erhalten.'
const TEST_QUESTION_MUTATION_ERROR_MESSAGE =
  'Die Testfrage konnte nicht lokal gespeichert werden. Bitte versuche es erneut.'
const TEST_QUESTION_DIRTY_BLOCK_MESSAGE =
  'Der Testfragenentwurf enthält ungespeicherte Änderungen. Möchtest du weiterbearbeiten oder den Entwurf verwerfen?'
const TEST_START_ERROR_MESSAGE =
  'Der lokale Modultest konnte nicht sicher gestartet werden. Bitte versuche es erneut.'
const TEST_SUBMISSION_ERROR_MESSAGE =
  'Der lokale Modultest konnte nicht sicher ausgewertet werden. Deine Session und Antworten bleiben für einen Retry oder einen kontrollierten Abbruch erhalten.'
const TEST_RESULT_ERROR_MESSAGE =
  'Das Testergebnis konnte nicht sicher verarbeitet werden. Deine Session und Antworten bleiben erhalten.'
const TEST_CANCEL_ERROR_MESSAGE =
  'Die laufende Testsession konnte nicht sicher abgebrochen werden. Sie und ihre Antworten bleiben erhalten.'
const TEST_SESSION_RELEASED_MESSAGE =
  'Die lokale Testsession ist nicht mehr verfügbar. Der sichere Stand wurde abgeglichen; du kannst den Bereich wieder wechseln.'
const TEST_ACTIVE_BLOCK_MESSAGE =
  'Beende den laufenden lokalen Mock-Test oder brich ihn kontrolliert ab, bevor du den Bereich wechselst.'
const TEST_INTERACTION_BLOCK_MESSAGE =
  'Schließe zuerst das geöffnete Formular oder den Lernartefakt-Editor, bevor du den Modultest startest.'
const TEST_HISTORY_LOAD_ERROR_MESSAGE =
  'Die lokale Versuchshistorie ist derzeit nicht verfügbar. Testfragen und laufende Tests bleiben bedienbar.'

const TEST_DIFFICULTIES = Object.freeze(
  Object.values(LEARNING_TEST_DIFFICULTIES)
)

const QUESTION_SUCCESS_RESULTS = Object.freeze({
  questionCreated: true,
  questionUpdated: true,
  questionUnchanged: false,
})

function scheduleAfterPaint(callback) {
  if (
    typeof globalThis.requestAnimationFrame !== 'function' ||
    typeof globalThis.cancelAnimationFrame !== 'function'
  ) {
    const timeoutId = globalThis.setTimeout(callback, 0)
    return () => globalThis.clearTimeout(timeoutId)
  }

  let secondFrameId = null
  const firstFrameId = globalThis.requestAnimationFrame(() => {
    secondFrameId = globalThis.requestAnimationFrame(callback)
  })

  return () => {
    globalThis.cancelAnimationFrame(firstFrameId)

    if (secondFrameId !== null) {
      globalThis.cancelAnimationFrame(secondFrameId)
    }
  }
}

function isObjectRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPlainDataObject(value) {
  if (!isObjectRecord(value)) return false

  try {
    const prototype = Object.getPrototypeOf(value)
    return prototype === Object.prototype || prototype === null
  } catch {
    return false
  }
}

function snapshotPlainData(value, state = null) {
  const snapshotState = state ?? {
    seen: new Set(),
    remainingEntries: 10000,
  }

  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  ) {
    return { ok: true, value }
  }

  if (typeof value !== 'object' || snapshotState.seen.has(value)) {
    return { ok: false }
  }

  let prototype
  let descriptors

  try {
    prototype = Object.getPrototypeOf(value)
    descriptors = Object.getOwnPropertyDescriptors(value)
  } catch {
    return { ok: false }
  }

  const isArray = Array.isArray(value)

  if (
    (isArray && prototype !== Array.prototype) ||
    (!isArray && prototype !== Object.prototype && prototype !== null)
  ) {
    return { ok: false }
  }

  const propertyNames = Reflect.ownKeys(descriptors)
  if (propertyNames.some((propertyName) => typeof propertyName !== 'string')) {
    return { ok: false }
  }

  snapshotState.seen.add(value)

  if (isArray) {
    const lengthDescriptor = descriptors.length
    const length = lengthDescriptor?.value

    if (
      !Number.isSafeInteger(length) ||
      length < 0 ||
      propertyNames.length !== length + 1
    ) {
      snapshotState.seen.delete(value)
      return { ok: false }
    }

    const snapshot = []

    for (let index = 0; index < length; index += 1) {
      const descriptor = descriptors[String(index)]

      if (
        !descriptor ||
        !Object.hasOwn(descriptor, 'value') ||
        descriptor.enumerable !== true ||
        snapshotState.remainingEntries <= 0
      ) {
        snapshotState.seen.delete(value)
        return { ok: false }
      }

      snapshotState.remainingEntries -= 1
      const entrySnapshot = snapshotPlainData(
        descriptor.value,
        snapshotState
      )

      if (!entrySnapshot.ok) {
        snapshotState.seen.delete(value)
        return entrySnapshot
      }

      snapshot.push(entrySnapshot.value)
    }

    snapshotState.seen.delete(value)
    return { ok: true, value: snapshot }
  }

  const snapshot = Object.create(null)

  for (const propertyName of propertyNames) {
    const descriptor = descriptors[propertyName]

    if (
      !Object.hasOwn(descriptor, 'value') ||
      descriptor.enumerable !== true ||
      snapshotState.remainingEntries <= 0
    ) {
      snapshotState.seen.delete(value)
      return { ok: false }
    }

    snapshotState.remainingEntries -= 1
    const propertySnapshot = snapshotPlainData(
      descriptor.value,
      snapshotState
    )

    if (!propertySnapshot.ok) {
      snapshotState.seen.delete(value)
      return propertySnapshot
    }

    snapshot[propertyName] = propertySnapshot.value
  }

  snapshotState.seen.delete(value)
  return { ok: true, value: snapshot }
}

function deepFreezeData(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) {
    return value
  }

  Object.values(value).forEach(deepFreezeData)
  return Object.freeze(value)
}

function createFrozenSnapshot(value) {
  const snapshot = snapshotPlainData(value)
  return snapshot.ok ? deepFreezeData(snapshot.value) : null
}

function createTestSolutionSnapshot(moduleId, questions) {
  return createFrozenSnapshot({
    moduleId,
    questions: questions.map((question) => ({
      questionId: question.id,
      learningNodeId: question.learningNodeId,
      revision: question.revision,
      correctOptionId: question.correctOptionId,
      explanation: question.explanation,
      optionIds: sortByPosition(question.options).map(
        (option) => option.id
      ),
    })),
  })
}

function hasExactProperties(value, expectedProperties) {
  if (!isPlainDataObject(value)) return false

  let propertyNames

  try {
    propertyNames = Object.keys(value)
  } catch {
    return false
  }

  return (
    propertyNames.length === expectedProperties.length &&
    expectedProperties.every((propertyName) =>
      Object.hasOwn(value, propertyName)
    )
  )
}

function isTrimmedEntityId(value) {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value === value.trim()
  )
}

function arePlainValuesEqual(firstValue, secondValue) {
  if (Object.is(firstValue, secondValue)) return true

  if (Array.isArray(firstValue) || Array.isArray(secondValue)) {
    return (
      Array.isArray(firstValue) &&
      Array.isArray(secondValue) &&
      firstValue.length === secondValue.length &&
      firstValue.every((entry, index) =>
        arePlainValuesEqual(entry, secondValue[index])
      )
    )
  }

  if (!isPlainDataObject(firstValue) || !isPlainDataObject(secondValue)) {
    return false
  }

  const firstKeys = Object.keys(firstValue)
  const secondKeys = Object.keys(secondValue)

  return (
    firstKeys.length === secondKeys.length &&
    firstKeys.every((propertyName) => (
      Object.hasOwn(secondValue, propertyName) &&
      arePlainValuesEqual(
        firstValue[propertyName],
        secondValue[propertyName]
      )
    ))
  )
}

function readTestOperationFailure(result) {
  const resultSnapshot = snapshotPlainData(result)
  if (!resultSnapshot.ok) return null

  const snapshot = resultSnapshot.value

  if (
    !hasExactProperties(snapshot, ['ok', 'status', 'changed', 'error']) ||
    snapshot.ok !== false ||
    snapshot.changed !== false ||
    typeof snapshot.status !== 'string' ||
    !hasExactProperties(snapshot.error, ['code', 'message']) ||
    typeof snapshot.error.code !== 'string' ||
    typeof snapshot.error.message !== 'string'
  ) {
    return null
  }

  return {
    status: snapshot.status,
    code: snapshot.error.code,
  }
}

function isEvaluationFailure(failure) {
  return (
    failure?.status === 'evaluationFailed' &&
    failure.code === 'learningTestEvaluationFailed'
  )
}

function isMissingTestSessionFailure(failure) {
  return (
    failure?.status === 'notFound' &&
    failure.code === 'testSessionNotFound'
  )
}

function isPendingTestSubmissionConflict(failure) {
  return (
    failure?.status === 'conflict' &&
    [
      'learningTestSubmissionInProgress',
      'learningTestPendingSubmission',
    ].includes(failure.code)
  )
}

function hasArtifactResultShape(result) {
  try {
    return (
      isPlainDataObject(result) &&
      Object.hasOwn(result, 'ok') &&
      Object.hasOwn(result, 'status') &&
      Object.hasOwn(result, 'changed') &&
      Object.hasOwn(result, 'artifactStore')
    )
  } catch {
    return false
  }
}

function isEntityId(value) {
  return typeof value === 'string' && value.length > 0
}

function isHubForView(learningHub) {
  if (learningHub?.dataOrigin !== 'private') return false

  try {
    return validateLearningHub(learningHub).ok
  } catch {
    return false
  }
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

function cloneTestQuestionOption(option) {
  return { ...option }
}

function cloneTestQuestion(question) {
  return {
    ...question,
    options: question.options.map(cloneTestQuestionOption),
  }
}

function cloneTestBank(testBank) {
  return {
    schemaVersion: testBank.schemaVersion,
    dataOrigin: testBank.dataOrigin,
    questions: testBank.questions.map(cloneTestQuestion),
  }
}

function sortByPosition(entries) {
  return [...entries].sort((left, right) => left.position - right.position)
}

function getOrderedModuleQuestions(learningHub, testBank, moduleId) {
  const learningModule = getModule(learningHub, moduleId)
  if (!learningModule || !testBank) return []

  const orderedQuestions = []

  sortByPosition(learningModule.chapters).forEach((chapter) => {
    sortByPosition(chapter.learningNodes).forEach((learningNode) => {
      sortByPosition(
        testBank.questions.filter((question) => (
          question.moduleId === learningModule.id &&
          question.chapterId === chapter.id &&
          question.learningNodeId === learningNode.id
        ))
      ).forEach((question) => orderedQuestions.push(question))
    })
  })

  return orderedQuestions
}

function isTestBankForHub(testBank, learningHub) {
  try {
    if (
      testBank?.schemaVersion !== LEARNING_TEST_BANK_SCHEMA_VERSION ||
      testBank?.dataOrigin !== 'private' ||
      validateLearningTestBank(testBank).ok !== true
    ) {
      return false
    }

    const questionIds = new Set()
    const optionIds = new Set()

    for (const question of testBank.questions) {
      const learningModule = getModule(learningHub, question.moduleId)
      const chapter = getChapter(learningModule, question.chapterId)
      const learningNode = getLearningNode(
        chapter,
        question.learningNodeId
      )

      if (
        !learningModule ||
        !chapter ||
        !learningNode ||
        questionIds.has(question.id) ||
        optionIds.has(question.id)
      ) {
        return false
      }

      questionIds.add(question.id)

      for (const option of question.options) {
        if (optionIds.has(option.id) || questionIds.has(option.id)) {
          return false
        }

        optionIds.add(option.id)
      }
    }

    return true
  } catch {
    return false
  }
}

function cloneValidatedTestBank(result, learningHub) {
  const resultSnapshot = snapshotPlainData(result)
  if (!resultSnapshot.ok) return null

  const snapshot = resultSnapshot.value

  if (
    snapshot.ok !== true ||
    !['empty', 'loaded'].includes(snapshot.status) ||
    snapshot.changed !== false ||
    !hasExactProperties(snapshot, [
      'ok',
      'status',
      'changed',
      'testBank',
    ]) ||
    !isTestBankForHub(snapshot.testBank, learningHub) ||
    (snapshot.status === 'empty' && snapshot.testBank.questions.length !== 0)
  ) {
    return null
  }

  return cloneTestBank(snapshot.testBank)
}

function areTestQuestionsEqual(firstQuestion, secondQuestion) {
  return arePlainValuesEqual(firstQuestion, secondQuestion)
}

function areTestBanksEqual(firstBank, secondBank) {
  return arePlainValuesEqual(firstBank, secondBank)
}

function createAuthorQuestionView(question) {
  const orderedOptions = sortByPosition(question.options)

  return {
    id: question.id,
    prompt: question.prompt,
    difficulty: question.difficulty,
    position: question.position,
    revision: question.revision,
    options: orderedOptions.map((option) => ({
      id: option.id,
      label: option.label,
      position: option.position,
      isCorrect: option.id === question.correctOptionId,
    })),
    correctOptionIndex: orderedOptions.findIndex(
      (option) => option.id === question.correctOptionId
    ),
    explanation: question.explanation,
  }
}

function createPublicTestSessionClone(testSession) {
  return {
    id: testSession.id,
    moduleId: testSession.moduleId,
    startedAt: testSession.startedAt,
    questions: testSession.questions.map((question) => ({
      id: question.id,
      learningNodeId: question.learningNodeId,
      type: question.type,
      prompt: question.prompt,
      difficulty: question.difficulty,
      options: question.options.map((option) => ({ ...option })),
    })),
  }
}

function isPublicSessionForStartResult(
  result,
  targetSnapshot,
  learningHub,
  testBank
) {
  const resultSnapshot = snapshotPlainData(result)
  if (!resultSnapshot.ok) return null

  const snapshot = resultSnapshot.value

  if (
    !hasExactProperties(snapshot, [
      'ok',
      'status',
      'changed',
      'testSession',
    ]) ||
    snapshot.ok !== true ||
    snapshot.status !== 'testStarted' ||
    snapshot.changed !== true
  ) {
    return null
  }

  const testSession = snapshot.testSession

  if (
    !hasExactProperties(testSession, [
      'id',
      'moduleId',
      'startedAt',
      'questions',
    ]) ||
    !isTrimmedEntityId(testSession.id) ||
    testSession.moduleId !== targetSnapshot.moduleId ||
    !isCanonicalUtcTimestamp(testSession.startedAt) ||
    !Array.isArray(testSession.questions)
  ) {
    return null
  }

  const expectedQuestions = getOrderedModuleQuestions(
    learningHub,
    testBank,
    targetSnapshot.moduleId
  )

  if (
    expectedQuestions.length === 0 ||
    testSession.questions.length !== expectedQuestions.length
  ) {
    return null
  }

  const questionIds = new Set()
  const optionIds = new Set()

  for (let index = 0; index < expectedQuestions.length; index += 1) {
    const question = testSession.questions[index]
    const expectedQuestion = expectedQuestions[index]
    const expectedOptions = sortByPosition(expectedQuestion.options)

    if (
      !hasExactProperties(question, [
        'id',
        'learningNodeId',
        'type',
        'prompt',
        'difficulty',
        'options',
      ]) ||
      question.id !== expectedQuestion.id ||
      question.learningNodeId !== expectedQuestion.learningNodeId ||
      question.type !== LEARNING_TEST_QUESTION_TYPES.SINGLE_CHOICE ||
      question.type !== expectedQuestion.type ||
      question.prompt !== expectedQuestion.prompt ||
      question.difficulty !== expectedQuestion.difficulty ||
      !Array.isArray(question.options) ||
      question.options.length !== expectedOptions.length ||
      questionIds.has(question.id)
    ) {
      return null
    }

    questionIds.add(question.id)

    for (
      let optionIndex = 0;
      optionIndex < expectedOptions.length;
      optionIndex += 1
    ) {
      const option = question.options[optionIndex]
      const expectedOption = expectedOptions[optionIndex]

      if (
        !hasExactProperties(option, ['id', 'label']) ||
        option.id !== expectedOption.id ||
        option.label !== expectedOption.label ||
        optionIds.has(option.id) ||
        questionIds.has(option.id)
      ) {
        return null
      }

      optionIds.add(option.id)
    }
  }

  return createPublicTestSessionClone(testSession)
}

function cloneProgressProjection(projection) {
  return projection.map((moduleProgress) => ({
    moduleId: moduleProgress.moduleId,
    completedChapterCount: moduleProgress.completedChapterCount,
    totalChapterCount: moduleProgress.totalChapterCount,
    progressPercent: moduleProgress.progressPercent,
    isCompleted: moduleProgress.isCompleted,
    chapters: moduleProgress.chapters.map((chapterProgress) => ({
      chapterId: chapterProgress.chapterId,
      isCompleted: chapterProgress.isCompleted,
    })),
  }))
}

function createInitialProgressState() {
  return {
    phase: 'loading',
    projection: [],
    errorMessage: '',
    mutatingChapterId: null,
  }
}

function cloneProgressState(progress) {
  return {
    ...progress,
    projection: cloneProgressProjection(progress.projection),
  }
}

function cloneArtifact(artifact) {
  return { ...artifact }
}

function cloneArtifactStore(artifactStore) {
  return {
    schemaVersion: artifactStore.schemaVersion,
    dataOrigin: artifactStore.dataOrigin,
    artifacts: artifactStore.artifacts.map(cloneArtifact),
  }
}

function createInitialArtifactState() {
  return {
    phase: 'loading',
    activeType: null,
    mode: 'view',
    draft: '',
    fieldError: '',
    errorMessage: '',
    statusMessage: '',
    feedbackType: null,
    mutatingType: null,
  }
}

function createInitialTestState() {
  return {
    bank: {
      phase: 'loading',
      errorMessage: '',
      statusMessage: '',
    },
    editor: null,
    runner: {
      phase: 'idle',
      questionCount: 0,
      testSession: null,
      answers: [],
      retryPending: false,
      errorMessage: '',
      statusMessage: '',
      cancelConfirmation: false,
      result: null,
    },
    history: {
      phase: 'idle',
      attempts: [],
      errorMessage: '',
    },
  }
}

function cloneQuestionEditor(editor) {
  if (!editor) return null

  return {
    ...editor,
    values: {
      ...editor.values,
      options: [...editor.values.options],
    },
    fieldErrors: { ...editor.fieldErrors },
  }
}

function cloneTestResult(result) {
  if (!result) return null

  return {
    ...result,
    questions: result.questions.map((question) => ({
      ...question,
      options: question.options.map((option) => ({ ...option })),
    })),
  }
}

function cloneTestRunner(runner) {
  return {
    ...runner,
    testSession: runner.testSession
      ? createPublicTestSessionClone(runner.testSession)
      : null,
    answers: runner.answers.map((answer) => ({ ...answer })),
    result: cloneTestResult(runner.result),
  }
}

function cloneTestHistory(history) {
  return {
    ...history,
    attempts: history.attempts.map((attempt) => ({ ...attempt })),
  }
}

function getDefaultQuestionValues() {
  return {
    prompt: '',
    difficulty: LEARNING_TEST_DIFFICULTIES.MEDIUM,
    options: ['', ''],
    correctOptionIndex: 0,
    explanation: '',
  }
}

function createQuestionEditor(mode, values, questionId = null) {
  return {
    mode,
    questionId,
    values: {
      ...values,
      options: [...values.options],
    },
    fieldErrors: {},
    errorMessage: '',
    isSubmitting: false,
    dirty: false,
    discardConfirmation: false,
  }
}

function areQuestionValuesEqual(firstValues, secondValues) {
  return (
    firstValues?.prompt === secondValues?.prompt &&
    firstValues?.difficulty === secondValues?.difficulty &&
    firstValues?.correctOptionIndex === secondValues?.correctOptionIndex &&
    firstValues?.explanation === secondValues?.explanation &&
    Array.isArray(firstValues?.options) &&
    Array.isArray(secondValues?.options) &&
    firstValues.options.length === secondValues.options.length &&
    firstValues.options.every(
      (option, index) => option === secondValues.options[index]
    )
  )
}

function isArtifactType(type) {
  return ARTIFACT_TYPES.includes(type)
}

function getArtifactIndex(artifactStore, type, references) {
  if (!artifactStore || !references) return -1

  return artifactStore.artifacts.findIndex((artifact) => (
    artifact.type === type &&
    artifact.moduleId === references.moduleId &&
    artifact.chapterId === references.chapterId &&
    artifact.learningNodeId === references.learningNodeId
  ))
}

function getArtifactContent(artifactStore, type, references) {
  const artifactIndex = getArtifactIndex(
    artifactStore,
    type,
    references
  )

  return artifactIndex === -1
    ? null
    : artifactStore.artifacts[artifactIndex].content
}

function createArtifactTargetSnapshot(type, references) {
  if (
    !isArtifactType(type) ||
    !isEntityId(references?.moduleId) ||
    !isEntityId(references?.chapterId) ||
    !isEntityId(references?.learningNodeId)
  ) {
    return null
  }

  return Object.freeze({
    moduleId: references.moduleId,
    chapterId: references.chapterId,
    learningNodeId: references.learningNodeId,
    type,
  })
}

function isValidArtifactTargetSnapshot(target) {
  try {
    if (!isPlainDataObject(target) || !Object.isFrozen(target)) {
      return false
    }

    return (
      Object.keys(target).length === 4 &&
      Object.hasOwn(target, 'moduleId') &&
      Object.hasOwn(target, 'chapterId') &&
      Object.hasOwn(target, 'learningNodeId') &&
      Object.hasOwn(target, 'type') &&
      isEntityId(target.moduleId) &&
      isEntityId(target.chapterId) &&
      isEntityId(target.learningNodeId) &&
      isArtifactType(target.type)
    )
  } catch {
    return false
  }
}

function getArtifactTargetReferences(target) {
  if (!isValidArtifactTargetSnapshot(target)) return null

  return {
    moduleId: target.moduleId,
    chapterId: target.chapterId,
    learningNodeId: target.learningNodeId,
  }
}

function doesArtifactTargetMatchSelection(
  target,
  type,
  references
) {
  return (
    isValidArtifactTargetSnapshot(target) &&
    target.type === type &&
    references !== null &&
    target.moduleId === references.moduleId &&
    target.chapterId === references.chapterId &&
    target.learningNodeId === references.learningNodeId
  )
}

function areArtifactsEqual(firstArtifact, secondArtifact) {
  return (
    firstArtifact?.id === secondArtifact?.id &&
    firstArtifact?.type === secondArtifact?.type &&
    firstArtifact?.moduleId === secondArtifact?.moduleId &&
    firstArtifact?.chapterId === secondArtifact?.chapterId &&
    firstArtifact?.learningNodeId === secondArtifact?.learningNodeId &&
    firstArtifact?.content === secondArtifact?.content &&
    firstArtifact?.createdAt === secondArtifact?.createdAt &&
    firstArtifact?.updatedAt === secondArtifact?.updatedAt
  )
}

function areArtifactStoresEqual(firstStore, secondStore) {
  return (
    firstStore?.schemaVersion === secondStore?.schemaVersion &&
    firstStore?.dataOrigin === secondStore?.dataOrigin &&
    Array.isArray(firstStore?.artifacts) &&
    Array.isArray(secondStore?.artifacts) &&
    firstStore.artifacts.length === secondStore.artifacts.length &&
    firstStore.artifacts.every((artifact, index) =>
      areArtifactsEqual(artifact, secondStore.artifacts[index])
    )
  )
}

function createEmptyHub() {
  return {
    ...EMPTY_PRIVATE_HUB,
    modules: [],
  }
}

function createInitialState() {
  return {
    phase: 'loading',
    hub: createEmptyHub(),
    selectedModuleId: null,
    expandedChapterIds: [],
    selectedLearningNodeId: null,
    form: null,
    statusMessage: '',
    errorMessage: '',
    progress: createInitialProgressState(),
  }
}

function createFormState(type, target = {}, values = {}) {
  const normalizedValues = {}

  for (const fieldName of FORM_FIELDS[type] ?? []) {
    normalizedValues[fieldName] =
      typeof values[fieldName] === 'string' ? values[fieldName] : ''
  }

  return {
    type,
    moduleId: target.moduleId ?? null,
    chapterId: target.chapterId ?? null,
    learningNodeId: target.learningNodeId ?? null,
    values: normalizedValues,
    fieldErrors: {},
    errorMessage: '',
    isSubmitting: false,
  }
}

function cloneForm(form) {
  if (!form) return null

  return {
    ...form,
    values: { ...form.values },
    fieldErrors: { ...form.fieldErrors },
  }
}

function getModule(learningHub, moduleId) {
  return learningHub.modules.find(
    (learningModule) => learningModule.id === moduleId
  ) ?? null
}

function getChapter(learningModule, chapterId) {
  return learningModule?.chapters.find(
    (chapter) => chapter.id === chapterId
  ) ?? null
}

function getLearningNode(chapter, learningNodeId) {
  return chapter?.learningNodes.find(
    (learningNode) => learningNode.id === learningNodeId
  ) ?? null
}

function getModuleProgress(projection, moduleId) {
  return projection.find(
    (moduleProgress) => moduleProgress.moduleId === moduleId
  ) ?? null
}

function getChapterProgress(moduleProgress, chapterId) {
  return moduleProgress?.chapters.find(
    (chapterProgress) => chapterProgress.chapterId === chapterId
  ) ?? null
}

function getLearningNodeLocation(learningModule, learningNodeId) {
  for (const chapter of learningModule?.chapters ?? []) {
    const learningNode = getLearningNode(chapter, learningNodeId)

    if (learningNode) {
      return { chapter, learningNode }
    }
  }

  return null
}

function getSelectedLearningNodeReferences(viewState) {
  const learningModule = getModule(
    viewState.hub,
    viewState.selectedModuleId
  )
  const location = getLearningNodeLocation(
    learningModule,
    viewState.selectedLearningNodeId
  )

  if (!learningModule || !location) return null

  return {
    moduleId: learningModule.id,
    chapterId: location.chapter.id,
    learningNodeId: location.learningNode.id,
  }
}

function isTestSessionOpen(runner) {
  return ['starting', 'active', 'submitting', 'cancelling'].includes(
    runner?.phase
  )
}

function createTestViewModel(
  viewState,
  testState,
  testBankSnapshot
) {
  const selectedReferences = getSelectedLearningNodeReferences(viewState)
  const selectedModuleId = viewState.selectedModuleId
  const shouldHideAuthorQuestions = isTestSessionOpen(testState.runner)
  const questions = (
    !shouldHideAuthorQuestions &&
    selectedReferences &&
    testBankSnapshot
  )
    ? sortByPosition(
        testBankSnapshot.questions.filter((question) => (
          question.moduleId === selectedReferences.moduleId &&
          question.chapterId === selectedReferences.chapterId &&
          question.learningNodeId === selectedReferences.learningNodeId
        ))
      ).map(createAuthorQuestionView)
    : []
  const totalQuestionCount = (
    typeof selectedModuleId === 'string' && testBankSnapshot
  )
    ? testBankSnapshot.questions.filter(
        (question) => question.moduleId === selectedModuleId
      ).length
    : 0

  return {
    bank: {
      ...testState.bank,
      questions,
      totalQuestionCount,
    },
    editor: cloneQuestionEditor(testState.editor),
    runner: {
      ...cloneTestRunner(testState.runner),
      questionCount: totalQuestionCount,
    },
    history: cloneTestHistory(testState.history),
  }
}

function isArtifactStoreForHub(artifactStore, learningHub) {
  try {
    if (
      artifactStore?.dataOrigin !== 'private' ||
      !validateLearningArtifactStore(artifactStore).ok
    ) {
      return false
    }

    for (const artifact of artifactStore.artifacts) {
      const learningModule = getModule(learningHub, artifact.moduleId)
      const chapter = getChapter(learningModule, artifact.chapterId)
      const learningNode = getLearningNode(
        chapter,
        artifact.learningNodeId
      )

      if (!learningModule || !chapter || !learningNode) {
        return false
      }
    }

    return true
  } catch {
    return false
  }
}

function readValidatedArtifactStore(result, learningHub) {
  let candidateStore

  try {
    if (!hasArtifactResultShape(result)) return null
    candidateStore = result?.artifactStore
  } catch {
    return null
  }

  if (
    !isObjectRecord(candidateStore) ||
    !isArtifactStoreForHub(candidateStore, learningHub)
  ) {
    return null
  }

  let artifactStore

  try {
    artifactStore = cloneArtifactStore(candidateStore)
  } catch {
    return null
  }

  return isArtifactStoreForHub(artifactStore, learningHub)
    ? artifactStore
    : null
}

function createArtifactViewModel(
  viewState,
  artifactState,
  artifactStoreSnapshot
) {
  const references = getSelectedLearningNodeReferences(viewState)
  const values = {
    [LEARNING_ARTIFACT_TYPES.NOTE]: references
      ? getArtifactContent(
          artifactStoreSnapshot,
          LEARNING_ARTIFACT_TYPES.NOTE,
          references
        )
      : null,
    [LEARNING_ARTIFACT_TYPES.SUMMARY]: references
      ? getArtifactContent(
          artifactStoreSnapshot,
          LEARNING_ARTIFACT_TYPES.SUMMARY,
          references
        )
      : null,
  }
  const persistedValue = artifactState.activeType
    ? values[artifactState.activeType] ?? ''
    : ''

  return {
    ...artifactState,
    values,
    dirty:
      artifactState.mode === 'editing' &&
      artifactState.draft.trim() !== persistedValue,
    interactionDisabled: viewState.form !== null,
  }
}

function getReadyPhase(learningHub) {
  return learningHub.modules.length === 0 ? 'empty' : 'ready'
}

function hasPlausibleModuleProgress(moduleProgress, learningModule) {
  if (
    !Number.isInteger(moduleProgress.completedChapterCount) ||
    !Number.isInteger(moduleProgress.totalChapterCount) ||
    !Number.isInteger(moduleProgress.progressPercent) ||
    moduleProgress.totalChapterCount !== learningModule.chapters.length ||
    moduleProgress.completedChapterCount < 0 ||
    moduleProgress.completedChapterCount > moduleProgress.totalChapterCount ||
    moduleProgress.progressPercent < 0 ||
    moduleProgress.progressPercent > 100 ||
    typeof moduleProgress.isCompleted !== 'boolean' ||
    !Array.isArray(moduleProgress.chapters) ||
    moduleProgress.chapters.length !== learningModule.chapters.length
  ) {
    return false
  }

  const chapterProgressById = new Map()

  for (const chapterProgress of moduleProgress.chapters) {
    if (
      !isObjectRecord(chapterProgress) ||
      !isEntityId(chapterProgress.chapterId) ||
      typeof chapterProgress.isCompleted !== 'boolean' ||
      chapterProgressById.has(chapterProgress.chapterId)
    ) {
      return false
    }

    chapterProgressById.set(chapterProgress.chapterId, chapterProgress)
  }

  let completedChapterCount = 0

  for (const chapter of learningModule.chapters) {
    const chapterProgress = chapterProgressById.get(chapter.id)

    if (!chapterProgress) return false

    if (chapterProgress.isCompleted) {
      completedChapterCount += 1
    }
  }

  const totalChapterCount = learningModule.chapters.length
  const expectedProgressPercent = totalChapterCount === 0
    ? 0
    : Math.round((completedChapterCount / totalChapterCount) * 100)
  const expectedIsCompleted =
    totalChapterCount > 0 && completedChapterCount === totalChapterCount

  return (
    chapterProgressById.size === totalChapterCount &&
    moduleProgress.totalChapterCount === totalChapterCount &&
    moduleProgress.completedChapterCount === completedChapterCount &&
    moduleProgress.progressPercent === expectedProgressPercent &&
    moduleProgress.isCompleted === expectedIsCompleted
  )
}

function isProgressProjectionForHub(projection, learningHub) {
  if (
    !Array.isArray(projection) ||
    projection.length !== learningHub.modules.length
  ) {
    return false
  }

  const moduleProgressById = new Map()

  for (const moduleProgress of projection) {
    if (
      !isObjectRecord(moduleProgress) ||
      !isEntityId(moduleProgress.moduleId) ||
      moduleProgressById.has(moduleProgress.moduleId)
    ) {
      return false
    }

    moduleProgressById.set(moduleProgress.moduleId, moduleProgress)
  }

  for (const learningModule of learningHub.modules) {
    const moduleProgress = moduleProgressById.get(learningModule.id)

    if (
      !moduleProgress ||
      !hasPlausibleModuleProgress(moduleProgress, learningModule)
    ) {
      return false
    }
  }

  return moduleProgressById.size === learningHub.modules.length
}

function formTargetExists(form, learningHub) {
  if (!form) return true
  if (form.type === FORM_TYPES.CREATE_MODULE) return true

  const learningModule = getModule(learningHub, form.moduleId)
  if (!learningModule) return false

  if (
    form.type === FORM_TYPES.RENAME_MODULE ||
    form.type === FORM_TYPES.ADD_CHAPTER
  ) {
    return true
  }

  const chapter = getChapter(learningModule, form.chapterId)
  if (!chapter) return false

  if (
    form.type === FORM_TYPES.RENAME_CHAPTER ||
    form.type === FORM_TYPES.ADD_LEARNING_NODE
  ) {
    return true
  }

  return Boolean(getLearningNode(chapter, form.learningNodeId))
}

function reconcileStateWithHub(state, learningHub) {
  const hub = cloneHub(learningHub)
  const selectedModule = getModule(hub, state.selectedModuleId)

  if (!selectedModule) {
    return {
      ...state,
      phase: getReadyPhase(hub),
      hub,
      selectedModuleId: null,
      expandedChapterIds: [],
      selectedLearningNodeId: null,
      form:
        state.form?.type === FORM_TYPES.CREATE_MODULE
          ? cloneForm(state.form)
          : null,
    }
  }

  const validChapterIds = new Set(
    selectedModule.chapters.map((chapter) => chapter.id)
  )
  const expandedChapterIds = [...new Set(state.expandedChapterIds)].filter(
    (chapterId) => validChapterIds.has(chapterId)
  )
  const selectedLearningNode = getLearningNodeLocation(
    selectedModule,
    state.selectedLearningNodeId
  )

  return {
    ...state,
    phase: getReadyPhase(hub),
    hub,
    expandedChapterIds,
    selectedLearningNodeId: selectedLearningNode
      ? state.selectedLearningNodeId
      : null,
    form: formTargetExists(state.form, hub) ? cloneForm(state.form) : null,
  }
}

function getLoadErrorMessage(result) {
  switch (result?.status) {
    case 'invalidJson':
    case 'invalidStoredData':
      return 'Die lokal gespeicherten LearningHub-Daten sind nicht lesbar. Sie wurden nicht überschrieben.'
    case 'unavailable':
      return 'Der lokale LearningHub-Speicher ist in diesem Browserprofil nicht verfügbar.'
    case 'readFailed':
      return 'Der LearningHub konnte lokal nicht gelesen werden. Bitte versuche es erneut.'
    default:
      return 'Der LearningHub konnte nicht geladen werden. Bitte versuche es erneut.'
  }
}

function getMutationErrorMessage(result) {
  switch (result?.status) {
    case 'validationFailed':
      return 'Bitte korrigiere die markierten Felder.'
    case 'quotaExceeded':
      return 'Der verfügbare lokale Speicherplatz reicht für diese Änderung nicht aus.'
    case 'unavailable':
      return 'Der lokale LearningHub-Speicher ist derzeit nicht verfügbar.'
    case 'notFound':
    case 'ownershipMismatch':
      return 'Das ausgewählte Ziel ist nicht mehr verfügbar. Lade den LearningHub neu und versuche es erneut.'
    case 'generationFailed':
      return 'Die Änderung konnte lokal nicht vorbereitet werden. Bitte versuche es erneut.'
    case 'writeFailed':
      return 'Die Änderung konnte nicht lokal gespeichert werden. Bitte versuche es erneut.'
    default:
      return 'Die LearningHub-Änderung konnte nicht gespeichert werden. Bitte versuche es erneut.'
  }
}

function getArtifactLoadErrorMessage(result) {
  switch (result?.status) {
    case 'invalidJson':
    case 'invalidStoredData':
      return 'Die lokal gespeicherten Lernartefakte sind nicht lesbar. Sie wurden nicht überschrieben.'
    case 'unavailable':
      return 'Der lokale Speicher für Notizen und Zusammenfassungen ist in diesem Browserprofil nicht verfügbar.'
    case 'readFailed':
      return 'Notizen und Zusammenfassungen konnten lokal nicht gelesen werden. Bitte versuche es erneut.'
    default:
      return ARTIFACT_LOAD_ERROR_MESSAGE
  }
}

function getArtifactMutationErrorMessage(result) {
  switch (result?.status) {
    case 'validationFailed':
      return 'Bitte korrigiere den Artefakttext.'
    case 'quotaExceeded':
      return 'Der verfügbare lokale Speicherplatz reicht für dieses Lernartefakt nicht aus.'
    case 'unavailable':
      return 'Der lokale Speicher für Notizen und Zusammenfassungen ist derzeit nicht verfügbar.'
    case 'invalidJson':
    case 'invalidStoredData':
      return 'Die gespeicherten Lernartefakte sind nicht lesbar und wurden nicht überschrieben.'
    case 'readFailed':
      return 'Die Lernartefakte konnten vor dem Speichern nicht sicher gelesen werden.'
    case 'notFound':
    case 'ownershipMismatch':
      return 'Der ausgewählte LearningNode ist nicht mehr verfügbar. Lade den LearningHub neu und versuche es erneut.'
    case 'generationFailed':
      return 'Das Lernartefakt konnte lokal nicht vorbereitet werden. Bitte versuche es erneut.'
    case 'writeFailed':
    case 'serializationFailed':
      return ARTIFACT_MUTATION_ERROR_MESSAGE
    default:
      return ARTIFACT_MUTATION_ERROR_MESSAGE
  }
}

function hasArtifactContentFieldError(result) {
  return (
    result?.status === 'validationFailed' &&
    isObjectRecord(result.error?.fieldErrors) &&
    Object.hasOwn(result.error.fieldErrors, 'content')
  )
}

function hasExpectedTargetArtifact(
  artifact,
  type,
  references,
  content
) {
  return (
    artifact?.type === type &&
    artifact?.moduleId === references.moduleId &&
    artifact?.chapterId === references.chapterId &&
    artifact?.learningNodeId === references.learningNodeId &&
    artifact?.content === content
  )
}

function isArtifactSaveResultConsistent(
  status,
  previousStore,
  updatedStore,
  type,
  references,
  content
) {
  const previousIndex = getArtifactIndex(
    previousStore,
    type,
    references
  )
  const updatedIndex = getArtifactIndex(
    updatedStore,
    type,
    references
  )

  if (status === 'artifactUnchanged') {
    return (
      previousIndex !== -1 &&
      previousStore.artifacts[previousIndex].content === content &&
      areArtifactStoresEqual(previousStore, updatedStore)
    )
  }

  if (status === 'artifactCreated') {
    if (
      previousIndex !== -1 ||
      updatedIndex !== previousStore.artifacts.length ||
      updatedStore.artifacts.length !==
        previousStore.artifacts.length + 1 ||
      previousStore.schemaVersion !== updatedStore.schemaVersion ||
      previousStore.dataOrigin !== updatedStore.dataOrigin ||
      !hasExpectedTargetArtifact(
        updatedStore.artifacts[updatedIndex],
        type,
        references,
        content
      )
    ) {
      return false
    }

    return previousStore.artifacts.every((artifact, index) =>
      areArtifactsEqual(artifact, updatedStore.artifacts[index])
    )
  }

  if (
    status !== 'artifactUpdated' ||
    previousIndex === -1 ||
    updatedIndex !== previousIndex ||
    updatedStore.artifacts.length !== previousStore.artifacts.length ||
    previousStore.schemaVersion !== updatedStore.schemaVersion ||
    previousStore.dataOrigin !== updatedStore.dataOrigin
  ) {
    return false
  }

  const previousArtifact = previousStore.artifacts[previousIndex]
  const updatedArtifact = updatedStore.artifacts[updatedIndex]

  if (
    previousArtifact.content === content ||
    previousArtifact.id !== updatedArtifact.id ||
    previousArtifact.createdAt !== updatedArtifact.createdAt ||
    !hasExpectedTargetArtifact(
      updatedArtifact,
      type,
      references,
      content
    )
  ) {
    return false
  }

  return previousStore.artifacts.every((artifact, index) =>
    index === previousIndex ||
    areArtifactsEqual(artifact, updatedStore.artifacts[index])
  )
}

function isArtifactClearResultConsistent(
  status,
  previousStore,
  updatedStore,
  type,
  references
) {
  const previousIndex = getArtifactIndex(
    previousStore,
    type,
    references
  )
  const updatedIndex = getArtifactIndex(
    updatedStore,
    type,
    references
  )

  if (status === 'artifactAlreadyEmpty') {
    if (updatedIndex !== -1) return false

    if (previousIndex === -1) {
      return areArtifactStoresEqual(previousStore, updatedStore)
    }

    return isExactArtifactRemoval(
      previousStore,
      updatedStore,
      previousIndex
    )
  }

  if (
    status !== 'artifactCleared' ||
    previousIndex === -1 ||
    updatedIndex !== -1
  ) {
    return false
  }

  return isExactArtifactRemoval(
    previousStore,
    updatedStore,
    previousIndex
  )
}

function isExactArtifactRemoval(
  previousStore,
  updatedStore,
  removedIndex
) {
  if (
    updatedStore.artifacts.length !== previousStore.artifacts.length - 1 ||
    previousStore.schemaVersion !== updatedStore.schemaVersion ||
    previousStore.dataOrigin !== updatedStore.dataOrigin
  ) {
    return false
  }

  const expectedArtifacts = previousStore.artifacts.filter(
    (_, index) => index !== removedIndex
  )

  return expectedArtifacts.every((artifact, index) =>
    areArtifactsEqual(artifact, updatedStore.artifacts[index])
  )
}

function getRequiredFieldErrors(formValues, fieldNames) {
  const fieldErrors = {}

  for (const fieldName of fieldNames) {
    const value = formValues[fieldName]

    if (typeof value !== 'string' || value.trim().length === 0) {
      if (fieldName === 'content') {
        fieldErrors[fieldName] = 'Bitte gib einen LearningNode-Inhalt ein.'
      } else if (fieldName === 'firstChapterTitle') {
        fieldErrors[fieldName] = 'Bitte gib den Titel des ersten Kapitels ein.'
      } else {
        fieldErrors[fieldName] = 'Bitte gib einen Titel ein.'
      }
    }
  }

  return fieldErrors
}

function getServiceFieldErrors(result, formType) {
  const fieldErrors = {}
  const allowedFields = FORM_FIELDS[formType] ?? []
  const serviceFieldErrors = result?.error?.fieldErrors

  if (!isObjectRecord(serviceFieldErrors)) return fieldErrors

  for (const fieldName of allowedFields) {
    if (!Object.hasOwn(serviceFieldErrors, fieldName)) continue

    if (fieldName === 'content') {
      fieldErrors[fieldName] =
        'Bitte gib einen Inhalt mit höchstens 10.000 Zeichen ein.'
    } else if (fieldName === 'firstChapterTitle') {
      fieldErrors[fieldName] =
        'Bitte gib einen Kapiteltitel mit höchstens 120 Zeichen ein.'
    } else {
      fieldErrors[fieldName] =
        'Bitte gib einen Titel mit höchstens 120 Zeichen ein.'
    }
  }

  return fieldErrors
}

function getFirstFieldError(fieldErrors, formType) {
  return (FORM_FIELDS[formType] ?? []).find((fieldName) =>
    Object.hasOwn(fieldErrors, fieldName)
  ) ?? null
}

function getSubmission(form, submittedValues) {
  if (!isObjectRecord(submittedValues) || submittedValues.type !== form.type) {
    return null
  }

  const targetFields = ['moduleId', 'chapterId', 'learningNodeId']

  for (const fieldName of targetFields) {
    if (
      form[fieldName] !== null &&
      submittedValues[fieldName] !== form[fieldName]
    ) {
      return null
    }
  }

  const values = {}
  for (const fieldName of FORM_FIELDS[form.type] ?? []) {
    values[fieldName] =
      typeof submittedValues[fieldName] === 'string'
        ? submittedValues[fieldName]
        : ''
  }

  const serviceInput = { ...values }
  for (const fieldName of targetFields) {
    if (form[fieldName] !== null) {
      serviceInput[fieldName] = form[fieldName]
    }
  }

  return { values, serviceInput }
}

function validateQuestionEditorValues(values) {
  const fieldErrors = {}
  const prompt = typeof values?.prompt === 'string'
    ? values.prompt.trim()
    : ''
  const difficulty = values?.difficulty
  const explanation = typeof values?.explanation === 'string'
    ? values.explanation.trim()
    : ''
  const options = Array.isArray(values?.options)
    ? values.options.map((option) => (
        typeof option === 'string' ? option.trim() : ''
      ))
    : []
  const correctOptionIndex = values?.correctOptionIndex

  if (!prompt || prompt.length > LEARNING_TEST_PROMPT_MAX_LENGTH) {
    fieldErrors.prompt = !prompt
      ? 'Bitte gib einen Fragetext ein.'
      : `Der Fragetext darf höchstens ${LEARNING_TEST_PROMPT_MAX_LENGTH} Zeichen enthalten.`
  }

  if (!TEST_DIFFICULTIES.includes(difficulty)) {
    fieldErrors.difficulty = 'Bitte wähle einen gültigen Schwierigkeitsgrad.'
  }

  if (
    options.length < LEARNING_TEST_MIN_OPTION_COUNT ||
    options.length > LEARNING_TEST_MAX_OPTION_COUNT
  ) {
    fieldErrors.options = 'Eine Frage benötigt zwei bis sechs Antwortoptionen.'
  } else if (
    options.some((option) => (
      option.length === 0 ||
      option.length > LEARNING_TEST_OPTION_LABEL_MAX_LENGTH
    ))
  ) {
    fieldErrors.options =
      `Jede Option benötigt einen Text mit höchstens ${LEARNING_TEST_OPTION_LABEL_MAX_LENGTH} Zeichen.`
    options.forEach((option, optionIndex) => {
      if (
        option.length === 0 ||
        option.length > LEARNING_TEST_OPTION_LABEL_MAX_LENGTH
      ) {
        fieldErrors[`options.${optionIndex}`] =
          `Option ${optionIndex + 1} benötigt einen zulässigen Text.`
      }
    })
  }

  if (
    !Number.isInteger(correctOptionIndex) ||
    correctOptionIndex < 0 ||
    correctOptionIndex >= options.length
  ) {
    fieldErrors.correctOptionIndex =
      'Markiere genau eine vorhandene Antwortoption als korrekt.'
  }

  if (explanation.length > LEARNING_TEST_EXPLANATION_MAX_LENGTH) {
    fieldErrors.explanation =
      `Die Erklärung darf höchstens ${LEARNING_TEST_EXPLANATION_MAX_LENGTH} Zeichen enthalten.`
  }

  return {
    values: {
      prompt,
      difficulty,
      options,
      correctOptionIndex,
      explanation,
    },
    fieldErrors,
  }
}

function getFirstQuestionFieldError(fieldErrors, values) {
  for (const fieldName of [
    'prompt',
    'difficulty',
    'options',
    'correctOptionIndex',
    'explanation',
  ]) {
    if (!Object.hasOwn(fieldErrors, fieldName)) continue

    return {
      type: 'questionEditorField',
      fieldName,
      optionIndex:
        fieldName === 'options'
          ? Math.max(
              0,
              values.options.findIndex((option) => (
                typeof option !== 'string' ||
                option.trim().length === 0 ||
                option.trim().length >
                  LEARNING_TEST_OPTION_LABEL_MAX_LENGTH
              ))
            )
          : undefined,
    }
  }

  return { type: 'questionEditorAlert' }
}

function doesQuestionMatchValues(question, values) {
  const orderedOptions = sortByPosition(question.options)

  return (
    question.prompt === values.prompt &&
    question.difficulty === values.difficulty &&
    question.explanation === values.explanation &&
    orderedOptions.length === values.options.length &&
    orderedOptions.every((option, index) => (
      option.label === values.options[index] &&
      option.position === index + 1
    )) &&
    orderedOptions[values.correctOptionIndex]?.id ===
      question.correctOptionId
  )
}

function readQuestionMutationResult({
  result,
  mode,
  targetSnapshot,
  previousBank,
  values,
  learningHub,
}) {
  const resultSnapshot = snapshotPlainData(result)
  if (!resultSnapshot.ok) return null

  const snapshot = resultSnapshot.value
  const allowedStatuses = mode === 'create'
    ? ['questionCreated']
    : ['questionUpdated', 'questionUnchanged']

  if (
    !hasExactProperties(snapshot, [
      'ok',
      'status',
      'changed',
      'question',
      'testBank',
    ]) ||
    snapshot.ok !== true ||
    !allowedStatuses.includes(snapshot.status) ||
    snapshot.changed !== QUESTION_SUCCESS_RESULTS[snapshot.status] ||
    !isTestBankForHub(snapshot.testBank, learningHub) ||
    snapshot.testBank.schemaVersion !== previousBank.schemaVersion ||
    snapshot.testBank.dataOrigin !== previousBank.dataOrigin
  ) {
    return null
  }

  const nextBank = cloneTestBank(snapshot.testBank)
  let targetQuestion = null

  if (mode === 'create') {
    if (nextBank.questions.length !== previousBank.questions.length + 1) {
      return null
    }

    if (
      !previousBank.questions.every((question, index) =>
        areTestQuestionsEqual(question, nextBank.questions[index])
      )
    ) {
      return null
    }

    targetQuestion = nextBank.questions.at(-1)
    const siblingPositions = previousBank.questions
      .filter((question) => (
        question.learningNodeId === targetSnapshot.learningNodeId
      ))
      .map((question) => question.position)
    const expectedPosition = siblingPositions.length === 0
      ? 1
      : Math.max(...siblingPositions) + 1

    if (
      targetQuestion.moduleId !== targetSnapshot.moduleId ||
      targetQuestion.chapterId !== targetSnapshot.chapterId ||
      targetQuestion.learningNodeId !== targetSnapshot.learningNodeId ||
      targetQuestion.type !== LEARNING_TEST_QUESTION_TYPES.SINGLE_CHOICE ||
      targetQuestion.position !== expectedPosition ||
      targetQuestion.revision !== 1 ||
      targetQuestion.createdAt !== targetQuestion.updatedAt ||
      !isCanonicalUtcTimestamp(targetQuestion.createdAt)
    ) {
      return null
    }
  } else {
    if (nextBank.questions.length !== previousBank.questions.length) {
      return null
    }

    const targetIndex = previousBank.questions.findIndex(
      (question) => question.id === targetSnapshot.questionId
    )

    if (targetIndex === -1) return null

    for (let index = 0; index < previousBank.questions.length; index += 1) {
      if (
        index !== targetIndex &&
        !areTestQuestionsEqual(
          previousBank.questions[index],
          nextBank.questions[index]
        )
      ) {
        return null
      }
    }

    const previousQuestion = previousBank.questions[targetIndex]
    targetQuestion = nextBank.questions[targetIndex]

    if (
      targetQuestion.id !== previousQuestion.id ||
      targetQuestion.moduleId !== targetSnapshot.moduleId ||
      targetQuestion.chapterId !== targetSnapshot.chapterId ||
      targetQuestion.learningNodeId !== targetSnapshot.learningNodeId ||
      targetQuestion.type !== previousQuestion.type ||
      targetQuestion.position !== previousQuestion.position ||
      targetQuestion.createdAt !== previousQuestion.createdAt
    ) {
      return null
    }

    if (snapshot.status === 'questionUnchanged') {
      if (
        !areTestBanksEqual(previousBank, nextBank) ||
        !areTestQuestionsEqual(previousQuestion, targetQuestion)
      ) {
        return null
      }
    } else {
      if (
        targetQuestion.revision !== previousQuestion.revision + 1 ||
        !isCanonicalUtcTimestamp(targetQuestion.updatedAt) ||
        Date.parse(targetQuestion.updatedAt) <
          Date.parse(previousQuestion.updatedAt)
      ) {
        return null
      }

      const previousOptions = sortByPosition(previousQuestion.options)
      const nextOptions = sortByPosition(targetQuestion.options)
      const optionLabelsUnchanged = (
        previousOptions.length === values.options.length &&
        previousOptions.every(
          (option, index) => option.label === values.options[index]
        )
      )

      if (
        optionLabelsUnchanged &&
        !previousOptions.every(
          (option, index) => option.id === nextOptions[index]?.id
        )
      ) {
        return null
      }

      if (
        !optionLabelsUnchanged &&
        nextOptions.some((option) =>
          previousOptions.some(
            (previousOption) => previousOption.id === option.id
          )
        )
      ) {
        return null
      }
    }
  }

  if (
    !targetQuestion ||
    !doesQuestionMatchValues(targetQuestion, values) ||
    !areTestQuestionsEqual(snapshot.question, targetQuestion)
  ) {
    return null
  }

  return {
    status: snapshot.status,
    changed: snapshot.changed,
    testBank: nextBank,
  }
}

function readQuestionMutationReconciliation({
  mode,
  targetSnapshot,
  previousBank,
  values,
  authoritativeBank,
  learningHub,
}) {
  const question = mode === 'create'
    ? authoritativeBank.questions.at(-1)
    : authoritativeBank.questions.find(
        (entry) => entry.id === targetSnapshot.questionId
      )

  if (!question) return null

  const status = mode === 'create'
    ? 'questionCreated'
    : areTestBanksEqual(previousBank, authoritativeBank)
      ? 'questionUnchanged'
      : 'questionUpdated'

  return readQuestionMutationResult({
    result: {
      ok: true,
      status,
      changed: QUESTION_SUCCESS_RESULTS[status],
      question,
      testBank: authoritativeBank,
    },
    mode,
    targetSnapshot,
    previousBank,
    values,
    learningHub,
  })
}

function createSubmissionSnapshot(
  activeSessionSnapshot,
  answers
) {
  if (
    !activeSessionSnapshot ||
    answers.length !== activeSessionSnapshot.questions.length
  ) {
    return null
  }

  const answerByQuestionId = new Map(
    answers.map((answer) => [answer.questionId, answer.selectedOptionId])
  )
  const orderedAnswers = []

  for (const question of activeSessionSnapshot.questions) {
    const selectedOptionId = answerByQuestionId.get(question.id)

    if (
      !isTrimmedEntityId(selectedOptionId) ||
      !question.options.some((option) => option.id === selectedOptionId)
    ) {
      return null
    }

    orderedAnswers.push({
      questionId: question.id,
      selectedOptionId,
    })
  }

  return createFrozenSnapshot({
    moduleId: activeSessionSnapshot.moduleId,
    testSessionId: activeSessionSnapshot.id,
    questions: activeSessionSnapshot.questions,
    payload: {
      testSessionId: activeSessionSnapshot.id,
      answers: orderedAnswers,
    },
  })
}

function readCompletedTestResult({
  result,
  sessionSnapshot,
  solutionSnapshot,
  submissionSnapshot,
}) {
  const resultSnapshot = snapshotPlainData(result)
  if (!resultSnapshot.ok) return null

  const snapshot = resultSnapshot.value

  if (
    !hasExactProperties(snapshot, [
      'ok',
      'status',
      'changed',
      'result',
    ]) ||
    snapshot.ok !== true ||
    snapshot.status !== 'testCompleted' ||
    snapshot.changed !== true
  ) {
    return null
  }

  const completedResult = snapshot.result

  if (
    solutionSnapshot?.moduleId !== submissionSnapshot.moduleId ||
    !Array.isArray(solutionSnapshot?.questions) ||
    !hasExactProperties(completedResult, [
      'attemptId',
      'moduleId',
      'startedAt',
      'completedAt',
      'totalQuestionCount',
      'correctAnswerCount',
      'scorePercent',
      'answers',
      'feedback',
    ]) ||
    !isTrimmedEntityId(completedResult.attemptId) ||
    completedResult.moduleId !== submissionSnapshot.moduleId ||
    completedResult.startedAt !== sessionSnapshot.startedAt ||
    !isCanonicalUtcTimestamp(completedResult.completedAt) ||
    Date.parse(completedResult.completedAt) <
      Date.parse(sessionSnapshot.startedAt) ||
    !Array.isArray(completedResult.answers) ||
    !Array.isArray(completedResult.feedback)
  ) {
    return null
  }

  const questions = submissionSnapshot.questions
  const solutions = solutionSnapshot.questions
  const submittedAnswers = submissionSnapshot.payload.answers

  if (
    solutions.length !== questions.length ||
    completedResult.answers.length !== questions.length ||
    completedResult.feedback.length !== questions.length ||
    completedResult.totalQuestionCount !== questions.length
  ) {
    return null
  }

  let correctAnswerCount = 0

  for (let index = 0; index < questions.length; index += 1) {
    const question = questions[index]
    const solution = solutions[index]
    const submittedAnswer = submittedAnswers[index]
    const answer = completedResult.answers[index]
    const feedback = completedResult.feedback[index]
    if (
      !hasExactProperties(solution, [
        'questionId',
        'learningNodeId',
        'revision',
        'correctOptionId',
        'explanation',
        'optionIds',
      ]) ||
      solution.questionId !== question.id ||
      !Number.isSafeInteger(solution.revision) ||
      solution.revision < 1 ||
      !Array.isArray(solution.optionIds) ||
      solution.optionIds.length !== question.options.length ||
      !solution.optionIds.every(
        (optionId, optionIndex) =>
          optionId === question.options[optionIndex]?.id
      ) ||
      !solution.optionIds.includes(solution.correctOptionId) ||
      typeof solution.explanation !== 'string' ||
      solution.explanation.length >
        LEARNING_TEST_EXPLANATION_MAX_LENGTH ||
      !hasExactProperties(answer, [
        'questionId',
        'questionRevision',
        'learningNodeId',
        'selectedOptionId',
        'correctOptionId',
        'isCorrect',
      ]) ||
      !hasExactProperties(feedback, [
        'questionId',
        'selectedOptionId',
        'correctOptionId',
        'isCorrect',
        'explanation',
      ]) ||
      answer.questionId !== question.id ||
      answer.questionRevision !== solution.revision ||
      answer.learningNodeId !== solution.learningNodeId ||
      answer.selectedOptionId !== submittedAnswer.selectedOptionId ||
      answer.correctOptionId !== solution.correctOptionId ||
      answer.isCorrect !==
        (answer.selectedOptionId === answer.correctOptionId) ||
      feedback.questionId !== answer.questionId ||
      feedback.selectedOptionId !== answer.selectedOptionId ||
      feedback.correctOptionId !== solution.correctOptionId ||
      feedback.isCorrect !== answer.isCorrect ||
      feedback.explanation !== solution.explanation ||
      !solution.optionIds.includes(answer.selectedOptionId)
    ) {
      return null
    }

    if (answer.isCorrect) correctAnswerCount += 1
  }

  const expectedScorePercent = questions.length === 0
    ? 0
    : Math.round((correctAnswerCount / questions.length) * 100)

  if (
    completedResult.correctAnswerCount !== correctAnswerCount ||
    completedResult.scorePercent !== expectedScorePercent
  ) {
    return null
  }

  return {
    viewResult: {
      completedAt: completedResult.completedAt,
      totalQuestionCount: questions.length,
      correctAnswerCount,
      scorePercent: expectedScorePercent,
      questions: questions.map((question, index) => {
        const answer = completedResult.answers[index]

        return {
          prompt: sessionSnapshot.questions[index].prompt,
          options: sessionSnapshot.questions[index].options.map((option) => ({
            label: option.label,
            isSelected: option.id === answer.selectedOptionId,
            isCorrect: option.id === answer.correctOptionId,
          })),
          isCorrect: answer.isCorrect,
          explanation: solutions[index].explanation,
        }
      }),
    },
    historyAttempt: {
      attemptId: completedResult.attemptId,
      moduleId: completedResult.moduleId,
      startedAt: completedResult.startedAt,
      completedAt: completedResult.completedAt,
      totalQuestionCount: completedResult.totalQuestionCount,
      correctAnswerCount: completedResult.correctAnswerCount,
      scorePercent: completedResult.scorePercent,
      answers: completedResult.answers.map((answer) => ({ ...answer })),
    },
  }
}

function readReconciledCompletedTestAttempt({
  attempt,
  sessionSnapshot,
  solutionSnapshot,
  submissionSnapshot,
}) {
  if (!isPlainDataObject(attempt)) return null

  const feedback = solutionSnapshot?.questions?.map(
    (solution, index) => {
      const selectedOptionId =
        attempt.answers?.[index]?.selectedOptionId

      return {
        questionId: solution.questionId,
        selectedOptionId,
        correctOptionId: solution.correctOptionId,
        isCorrect: selectedOptionId === solution.correctOptionId,
        explanation: solution.explanation,
      }
    }
  )

  if (!Array.isArray(feedback)) return null

  return readCompletedTestResult({
    result: {
      ok: true,
      status: 'testCompleted',
      changed: true,
      result: {
        attemptId: attempt.attemptId,
        moduleId: attempt.moduleId,
        startedAt: attempt.startedAt,
        completedAt: attempt.completedAt,
        totalQuestionCount: attempt.totalQuestionCount,
        correctAnswerCount: attempt.correctAnswerCount,
        scorePercent: attempt.scorePercent,
        answers: attempt.answers,
        feedback,
      },
    },
    sessionSnapshot,
    solutionSnapshot,
    submissionSnapshot,
  })
}

function readSanitizedAttemptHistory(
  result,
  targetSnapshot,
  learningHub,
  testBank
) {
  const resultSnapshot = snapshotPlainData(result)
  if (!resultSnapshot.ok) return null

  const snapshot = resultSnapshot.value

  if (
    !hasExactProperties(snapshot, [
      'ok',
      'status',
      'changed',
      'attempts',
    ]) ||
    snapshot.ok !== true ||
    !['attemptHistoryEmpty', 'attemptHistoryLoaded'].includes(
      snapshot.status
    ) ||
    snapshot.changed !== false ||
    !Array.isArray(snapshot.attempts) ||
    (snapshot.status === 'attemptHistoryEmpty' &&
      snapshot.attempts.length !== 0) ||
    (snapshot.status === 'attemptHistoryLoaded' &&
      snapshot.attempts.length === 0) ||
    !getModule(learningHub, targetSnapshot.moduleId)
  ) {
    return null
  }

  const orderedQuestions = getOrderedModuleQuestions(
    learningHub,
    testBank,
    targetSnapshot.moduleId
  )
  const questionOrder = new Map(
    orderedQuestions.map((question, index) => [question.id, index])
  )
  const questionsById = new Map(
    orderedQuestions.map((question) => [question.id, question])
  )
  const attemptIds = new Set()
  const sanitizedAttempts = []

  for (const attempt of snapshot.attempts) {
    if (
      !hasExactProperties(attempt, [
        'attemptId',
        'moduleId',
        'startedAt',
        'completedAt',
        'totalQuestionCount',
        'correctAnswerCount',
        'scorePercent',
        'answers',
      ]) ||
      !isTrimmedEntityId(attempt.attemptId) ||
      attemptIds.has(attempt.attemptId) ||
      attempt.moduleId !== targetSnapshot.moduleId ||
      !isCanonicalUtcTimestamp(attempt.startedAt) ||
      !isCanonicalUtcTimestamp(attempt.completedAt) ||
      Date.parse(attempt.completedAt) < Date.parse(attempt.startedAt) ||
      !Number.isSafeInteger(attempt.totalQuestionCount) ||
      attempt.totalQuestionCount <= 0 ||
      !Number.isSafeInteger(attempt.correctAnswerCount) ||
      attempt.correctAnswerCount < 0 ||
      attempt.correctAnswerCount > attempt.totalQuestionCount ||
      attempt.scorePercent !== Math.round(
        (attempt.correctAnswerCount / attempt.totalQuestionCount) * 100
      ) ||
      !Array.isArray(attempt.answers) ||
      attempt.answers.length !== attempt.totalQuestionCount
    ) {
      return null
    }

    attemptIds.add(attempt.attemptId)
    const answerQuestionIds = new Set()
    let previousQuestionOrder = -1
    let countedCorrectAnswers = 0

    for (const answer of attempt.answers) {
      const question = questionsById.get(answer?.questionId)
      const currentQuestionOrder = questionOrder.get(answer?.questionId)

      if (
        !hasExactProperties(answer, [
          'questionId',
          'questionRevision',
          'learningNodeId',
          'selectedOptionId',
          'correctOptionId',
          'isCorrect',
        ]) ||
        !question ||
        answerQuestionIds.has(answer.questionId) ||
        !Number.isSafeInteger(answer.questionRevision) ||
        answer.questionRevision < 1 ||
        answer.questionRevision > question.revision ||
        answer.learningNodeId !== question.learningNodeId ||
        !isTrimmedEntityId(answer.selectedOptionId) ||
        !isTrimmedEntityId(answer.correctOptionId) ||
        typeof answer.isCorrect !== 'boolean' ||
        answer.isCorrect !==
          (answer.selectedOptionId === answer.correctOptionId) ||
        !Number.isInteger(currentQuestionOrder) ||
        currentQuestionOrder <= previousQuestionOrder
      ) {
        return null
      }

      answerQuestionIds.add(answer.questionId)
      previousQuestionOrder = currentQuestionOrder
      if (answer.isCorrect) countedCorrectAnswers += 1
    }

    if (countedCorrectAnswers !== attempt.correctAnswerCount) {
      return null
    }

    sanitizedAttempts.push({
      completedAt: attempt.completedAt,
      totalQuestionCount: attempt.totalQuestionCount,
      correctAnswerCount: attempt.correctAnswerCount,
      scorePercent: attempt.scorePercent,
    })
  }

  const previousAttempts = Array.isArray(targetSnapshot.previousAttempts)
    ? targetSnapshot.previousAttempts
    : []
  const expectedAppends = Array.isArray(targetSnapshot.expectedAppends)
    ? targetSnapshot.expectedAppends
    : []

  if (targetSnapshot.hasPreviousSnapshot === true) {
    const expectedLength = previousAttempts.length +
      expectedAppends.length

    if (
      snapshot.attempts.length !== expectedLength ||
      !previousAttempts.every((attempt, index) =>
        arePlainValuesEqual(attempt, snapshot.attempts[index])
      ) ||
      !expectedAppends.every((attempt, index) =>
        arePlainValuesEqual(
          attempt,
          snapshot.attempts[previousAttempts.length + index]
        )
      )
    ) {
      return null
    }
  } else if (expectedAppends.length > 0) {
    const suffixStart = snapshot.attempts.length - expectedAppends.length

    if (
      suffixStart < 0 ||
      !expectedAppends.every((attempt, index) =>
        arePlainValuesEqual(
          attempt,
          snapshot.attempts[suffixStart + index]
        )
      )
    ) {
      return null
    }
  }

  return {
    rawAttempts: snapshot.attempts,
    attempts: sanitizedAttempts,
  }
}

export function createLearningHubController({
  learningHubService,
  learningProgressService,
  learningArtifactService,
  learningTestService,
  learningHubView,
  scheduleTask = scheduleAfterPaint,
} = {}) {
  let isActive = false
  let cancelScheduledLoad = null
  let viewState = createInitialState()
  let artifactState = createInitialArtifactState()
  let artifactStoreSnapshot = null
  let artifactTargetSnapshot = null
  let resumeArtifactEditingAfterClear = false
  let testState = createInitialTestState()
  let testBankSnapshot = null
  let testBankLoadTargetSnapshot = null
  let questionTargetSnapshot = null
  let questionBaselineSnapshot = null
  let questionMutationReconciliationSnapshot = null
  let testStartTargetSnapshot = null
  let activeTestSessionSnapshot = null
  let activeTestSolutionSnapshot = null
  let testSubmissionTargetSnapshot = null
  let testCancelTargetSnapshot = null
  let attemptHistoryTargetSnapshot = null
  let attemptHistorySnapshots = new Map()
  let pendingAttemptHistoryAppendSnapshots = new Map()

  const actions = Object.freeze({
    onRetryLoad: retryHubLoad,
    onRetryProgressLoad: retryProgressLoad,
    onRetryArtifactLoad: retryArtifactLoad,
    onSelectModule: selectModule,
    onBackToOverview: backToOverview,
    onToggleChapter: toggleChapter,
    onToggleChapterCompletion: toggleChapterCompletion,
    onSelectLearningNode: selectLearningNode,
    onOpenCreateModuleForm: openCreateModuleForm,
    onOpenRenameModuleForm: openRenameModuleForm,
    onOpenAddChapterForm: openAddChapterForm,
    onOpenRenameChapterForm: openRenameChapterForm,
    onOpenAddLearningNodeForm: openAddLearningNodeForm,
    onOpenUpdateLearningNodeForm: openUpdateLearningNodeForm,
    onUpdateFormField: updateFormField,
    onSubmitForm: submitForm,
    onCancelForm: cancelForm,
    onOpenArtifactEditor: openArtifactEditor,
    onUpdateArtifactDraft: updateArtifactDraft,
    onSaveArtifact: saveArtifact,
    onCancelArtifactEditor: cancelArtifactEditor,
    onOpenArtifactClearConfirmation:
      openArtifactClearConfirmation,
    onCancelArtifactClearConfirmation:
      cancelArtifactClearConfirmation,
    onConfirmArtifactClear: confirmArtifactClear,
    onRetryTestBankLoad: retryTestBankLoad,
    onOpenCreateQuestion: openCreateQuestion,
    onOpenEditQuestion: openEditQuestion,
    onUpdateQuestionField: updateQuestionField,
    onAddQuestionOption: addQuestionOption,
    onRemoveQuestionOption: removeQuestionOption,
    onSelectCorrectQuestionOption: selectCorrectQuestionOption,
    onSubmitQuestion: submitQuestion,
    onCancelQuestionEditor: cancelQuestionEditor,
    onContinueQuestionEditing: continueQuestionEditing,
    onDiscardQuestionDraft: discardQuestionDraft,
    onStartModuleTest: startModuleTest,
    onSelectTestAnswer: selectTestAnswer,
    onSubmitModuleTest: submitModuleTest,
    onOpenTestCancelConfirmation: openTestCancelConfirmation,
    onContinueModuleTest: continueModuleTest,
    onConfirmModuleTestCancel: confirmModuleTestCancel,
    onRetryAttemptHistory: retryAttemptHistory,
  })

  function render(focusTarget = null) {
    if (!isActive || typeof learningHubView?.render !== 'function') return

    learningHubView.render(
      {
        ...viewState,
        hub: cloneHub(viewState.hub),
        expandedChapterIds: [...viewState.expandedChapterIds],
        form: cloneForm(viewState.form),
        progress: cloneProgressState(viewState.progress),
        artifacts: createArtifactViewModel(
          viewState,
          artifactState,
          artifactStoreSnapshot
        ),
        tests: createTestViewModel(
          viewState,
          testState,
          testBankSnapshot
        ),
        focusTarget,
      },
      actions
    )
  }

  function cancelPendingLoad() {
    if (typeof cancelScheduledLoad === 'function') {
      cancelScheduledLoad()
    }

    cancelScheduledLoad = null
  }

  function readProgressProjection() {
    try {
      const result = learningProgressService?.loadProgress?.()

      if (
        result?.ok !== true ||
        !['empty', 'loaded'].includes(result.status) ||
        !isProgressProjectionForHub(result.projection, viewState.hub)
      ) {
        return null
      }

      return cloneProgressProjection(result.projection)
    } catch {
      return null
    }
  }

  function finishProgressLoading(failurePhase) {
    const projection = readProgressProjection()

    if (projection) {
      viewState = {
        ...viewState,
        progress: {
          phase: 'ready',
          projection,
          errorMessage: '',
          mutatingChapterId: null,
        },
      }
      return true
    }

    viewState = {
      ...viewState,
      progress: {
        phase: failurePhase,
        projection: [],
        errorMessage:
          failurePhase === 'stale'
            ? PROGRESS_STALE_ERROR_MESSAGE
            : PROGRESS_LOAD_ERROR_MESSAGE,
        mutatingChapterId: null,
      },
    }
    return false
  }

  function finishArtifactLoading() {
    let result

    try {
      result = learningArtifactService?.loadArtifacts?.()
    } catch {
      result = null
    }

    let artifactStore = null
    let resultStatus = null

    try {
      resultStatus = result?.status

      if (
        hasArtifactResultShape(result) &&
        result?.ok === true &&
        ['empty', 'loaded'].includes(resultStatus) &&
        result.changed === false
      ) {
        artifactStore = readValidatedArtifactStore(result, viewState.hub)
      }
    } catch {
      artifactStore = null
      resultStatus = null
    }

    const hasConsistentEmptyStatus =
      resultStatus !== 'empty' ||
      artifactStore?.artifacts.length === 0

    if (artifactStore && hasConsistentEmptyStatus) {
      artifactStoreSnapshot = artifactStore
      artifactTargetSnapshot = null
      resumeArtifactEditingAfterClear = false
      artifactState = {
        ...createInitialArtifactState(),
        phase: 'ready',
      }
      return true
    }

    artifactStoreSnapshot = null
    artifactTargetSnapshot = null
    resumeArtifactEditingAfterClear = false
    let errorMessage = ARTIFACT_LOAD_ERROR_MESSAGE

    try {
      errorMessage = getArtifactLoadErrorMessage(result)
    } catch {
      errorMessage = ARTIFACT_LOAD_ERROR_MESSAGE
    }

    artifactState = {
      ...createInitialArtifactState(),
      phase: 'unavailable',
      errorMessage,
    }
    return false
  }

  function resetPrivateTestState() {
    testState = createInitialTestState()
    testBankSnapshot = null
    testBankLoadTargetSnapshot = null
    questionTargetSnapshot = null
    questionBaselineSnapshot = null
    questionMutationReconciliationSnapshot = null
    testStartTargetSnapshot = null
    activeTestSessionSnapshot = null
    activeTestSolutionSnapshot = null
    testSubmissionTargetSnapshot = null
    testCancelTargetSnapshot = null
    attemptHistoryTargetSnapshot = null
    attemptHistorySnapshots = new Map()
    pendingAttemptHistoryAppendSnapshots = new Map()
  }

  function finishTestBankLoading(focusTarget = null) {
    const targetSnapshot = testBankLoadTargetSnapshot

    if (
      !isActive ||
      !targetSnapshot ||
      !arePlainValuesEqual(targetSnapshot.hub, viewState.hub)
    ) {
      return false
    }

    let result = null

    try {
      result = learningTestService?.loadTestBank?.()
    } catch {
      result = null
    }

    if (
      testBankLoadTargetSnapshot !== targetSnapshot ||
      !arePlainValuesEqual(targetSnapshot.hub, viewState.hub)
    ) {
      return false
    }

    const validatedBank = cloneValidatedTestBank(result, viewState.hub)

    if (validatedBank) {
      testBankSnapshot = deepFreezeData(validatedBank)
      testBankLoadTargetSnapshot = null
      testState = {
        ...testState,
        bank: {
          phase: 'ready',
          errorMessage: '',
          statusMessage: '',
        },
      }
      render(focusTarget)
      return true
    }

    testBankSnapshot = null
    testBankLoadTargetSnapshot = null
    testState = {
      ...testState,
      bank: {
        phase: 'error',
        errorMessage: TEST_BANK_LOAD_ERROR_MESSAGE,
        statusMessage: '',
      },
    }
    render(focusTarget ?? { type: 'testBankAlert' })
    return false
  }

  function loadTestBank(focusTarget = null) {
    const targetSnapshot = createFrozenSnapshot({
      hub: cloneHub(viewState.hub),
    })

    if (!targetSnapshot) return false

    testBankLoadTargetSnapshot = targetSnapshot
    testState = {
      ...testState,
      bank: {
        phase: 'loading',
        errorMessage: '',
        statusMessage: '',
      },
    }
    render()
    return finishTestBankLoading(focusTarget)
  }

  function finishLoading() {
    cancelScheduledLoad = null
    if (!isActive) return

    let result

    try {
      result = learningHubService?.loadHub?.()
    } catch {
      result = null
    }

    if (
      result?.ok === true &&
      ['empty', 'loaded'].includes(result.status) &&
      isHubForView(result.hub)
    ) {
      viewState = reconcileStateWithHub(
        {
          ...createInitialState(),
          statusMessage: '',
        },
        result.hub
      )
      artifactStoreSnapshot = null
      artifactTargetSnapshot = null
      artifactState = createInitialArtifactState()
      resumeArtifactEditingAfterClear = false
      render()
      finishProgressLoading('unavailable')
      render()
      finishArtifactLoading()
      render()
      loadTestBank({ type: 'heading' })
      return
    }

    artifactStoreSnapshot = null
    artifactTargetSnapshot = null
    resumeArtifactEditingAfterClear = false
    resetPrivateTestState()
    artifactState = {
      ...createInitialArtifactState(),
      phase: 'unavailable',
    }
    viewState = {
      ...createInitialState(),
      phase: 'loadError',
      errorMessage: getLoadErrorMessage(result),
      progress: {
        phase: 'unavailable',
        projection: [],
        errorMessage: '',
        mutatingChapterId: null,
      },
    }
    render({ type: 'heading' })
  }

  function loadHub() {
    if (!isActive) return

    cancelPendingLoad()
    viewState = createInitialState()
    artifactStoreSnapshot = null
    artifactTargetSnapshot = null
    artifactState = createInitialArtifactState()
    resumeArtifactEditingAfterClear = false
    resetPrivateTestState()
    render()
    cancelScheduledLoad = scheduleTask(finishLoading)
  }

  function retryHubLoad() {
    if (!isActive || viewState.phase !== 'loadError') return

    loadHub()
  }

  function getPersistedArtifactContent(type) {
    const references = getArtifactTargetReferences(
      artifactTargetSnapshot
    )
    return getArtifactContent(
      artifactStoreSnapshot,
      type,
      references
    ) ?? ''
  }

  function hasCurrentArtifactTarget(type) {
    return doesArtifactTargetMatchSelection(
      artifactTargetSnapshot,
      type,
      getSelectedLearningNodeReferences(viewState)
    )
  }

  function isArtifactEditorDirty() {
    if (
      artifactState.phase === 'ready' &&
      artifactState.mode === 'editing' &&
      isArtifactType(artifactState.activeType)
    ) {
      return (
        !hasCurrentArtifactTarget(artifactState.activeType) ||
        artifactState.draft.trim() !==
          getPersistedArtifactContent(artifactState.activeType)
      )
    }

    return false
  }

  function resetArtifactInteraction() {
    artifactTargetSnapshot = null
    resumeArtifactEditingAfterClear = false
    artifactState = {
      ...artifactState,
      activeType: null,
      mode: 'view',
      draft: '',
      fieldError: '',
      errorMessage: artifactState.phase === 'unavailable'
        ? artifactState.errorMessage
        : '',
      statusMessage: '',
      feedbackType: null,
      mutatingType: null,
    }
  }

  function rejectArtifactTargetMismatch(type) {
    const feedbackType = isArtifactType(type)
      ? type
      : artifactState.activeType

    resetArtifactInteraction()
    artifactState = {
      ...artifactState,
      errorMessage: ARTIFACT_RESULT_ERROR_MESSAGE,
      feedbackType,
    }
    render({
      type: 'artifactAlert',
      artifactType: feedbackType,
    })
  }

  function blockDirtyArtifactTransition() {
    if (!isArtifactEditorDirty()) return false

    artifactState = {
      ...artifactState,
      fieldError: '',
      errorMessage: ARTIFACT_DIRTY_BLOCK_MESSAGE,
      statusMessage: '',
      feedbackType: artifactState.activeType,
    }
    render({
      type: 'artifactField',
      artifactType: artifactState.activeType,
    })
    return true
  }

  function resetQuestionInteraction() {
    questionTargetSnapshot = null
    questionBaselineSnapshot = null
    questionMutationReconciliationSnapshot = null
    testState = {
      ...testState,
      editor: null,
    }
  }

  function blockDirtyQuestionTransition() {
    if (testState.editor?.isSubmitting) {
      render({ type: 'questionEditorAlert' })
      return true
    }

    if (!testState.editor?.dirty) return false

    testState = {
      ...testState,
      editor: {
        ...testState.editor,
        discardConfirmation: true,
        errorMessage: TEST_QUESTION_DIRTY_BLOCK_MESSAGE,
      },
    }
    render({ type: 'questionDiscardConfirmation' })
    return true
  }

  function blockActiveTestTransition() {
    if (!isTestSessionOpen(testState.runner)) return false

    if (
      testState.runner.phase === 'active' &&
      activeTestSessionSnapshot
    ) {
      testCancelTargetSnapshot = createFrozenSnapshot({
        moduleId: activeTestSessionSnapshot.moduleId,
        testSessionId: activeTestSessionSnapshot.id,
      })
      testState = {
        ...testState,
        runner: {
          ...testState.runner,
          cancelConfirmation: true,
          errorMessage: TEST_ACTIVE_BLOCK_MESSAGE,
          statusMessage: '',
        },
      }
      render({ type: 'testCancelConfirmation' })
      return true
    }

    testState = {
      ...testState,
      runner: {
        ...testState.runner,
        errorMessage: TEST_ACTIVE_BLOCK_MESSAGE,
        statusMessage: '',
      },
    }
    render({ type: 'testSubmissionAlert' })
    return true
  }

  function canUseReadyView() {
    return (
      isActive &&
      ['empty', 'ready'].includes(viewState.phase) &&
      !viewState.form?.isSubmitting &&
      viewState.progress.phase !== 'mutating' &&
      artifactState.phase !== 'mutating' &&
      artifactState.mode !== 'confirmClear' &&
      testState.editor?.isSubmitting !== true &&
      !isTestSessionOpen(testState.runner)
    )
  }

  function retryTestBankLoad() {
    if (
      !isActive ||
      !['empty', 'ready'].includes(viewState.phase) ||
      testState.bank.phase !== 'error' ||
      viewState.form !== null ||
      artifactState.mode !== 'view' ||
      testState.editor !== null ||
      isTestSessionOpen(testState.runner)
    ) {
      return
    }

    loadTestBank({ type: 'testBankAlert' })
  }

  function finishAttemptHistoryLoading(focusTarget = null) {
    const targetSnapshot = attemptHistoryTargetSnapshot

    if (
      !targetSnapshot ||
      targetSnapshot.moduleId !== viewState.selectedModuleId ||
      !testBankSnapshot
    ) {
      return false
    }

    let result = null

    try {
      result = learningTestService?.loadAttemptHistory?.({
        moduleId: targetSnapshot.moduleId,
      })
    } catch {
      result = null
    }

    if (
      attemptHistoryTargetSnapshot !== targetSnapshot ||
      targetSnapshot.moduleId !== viewState.selectedModuleId
    ) {
      return false
    }

    const historyResult = readSanitizedAttemptHistory(
      result,
      targetSnapshot,
      viewState.hub,
      testBankSnapshot
    )

    const historySnapshot = historyResult
      ? createFrozenSnapshot({
        rawAttempts: historyResult.rawAttempts,
        attempts: historyResult.attempts,
      })
      : null

    if (historyResult && historySnapshot) {
      attemptHistorySnapshots.set(
        targetSnapshot.moduleId,
        historySnapshot
      )
      pendingAttemptHistoryAppendSnapshots.delete(
        targetSnapshot.moduleId
      )
      attemptHistoryTargetSnapshot = null
      testState = {
        ...testState,
        history: {
          phase: 'ready',
          attempts: historyResult.attempts,
          errorMessage: '',
        },
      }
      render(focusTarget)
      return true
    }

    attemptHistoryTargetSnapshot = null
    const previousHistory = attemptHistorySnapshots.get(
      targetSnapshot.moduleId
    )
    testState = {
      ...testState,
      history: {
        phase: 'error',
        attempts: previousHistory
          ? previousHistory.attempts.map((attempt) => ({ ...attempt }))
          : testState.history.attempts,
        errorMessage: TEST_HISTORY_LOAD_ERROR_MESSAGE,
      },
    }
    render(focusTarget ?? { type: 'attemptHistoryAlert' })
    return false
  }

  function loadAttemptHistory(focusTarget = null) {
    if (
      !isEntityId(viewState.selectedModuleId) ||
      !getModule(viewState.hub, viewState.selectedModuleId)
    ) {
      return false
    }

    if (!testBankSnapshot) {
      testState = {
        ...testState,
        history: {
          phase: 'error',
          attempts: [...testState.history.attempts],
          errorMessage: TEST_HISTORY_LOAD_ERROR_MESSAGE,
        },
      }
      render(focusTarget ?? { type: 'attemptHistoryAlert' })
      return false
    }

    const previousHistory = attemptHistorySnapshots.get(
      viewState.selectedModuleId
    )
    const expectedAppends = pendingAttemptHistoryAppendSnapshots.get(
      viewState.selectedModuleId
    ) ?? []
    const targetSnapshot = createFrozenSnapshot({
      moduleId: viewState.selectedModuleId,
      hasPreviousSnapshot: Boolean(previousHistory),
      previousAttempts: previousHistory?.rawAttempts ?? [],
      expectedAppends,
    })
    if (!targetSnapshot) return false

    attemptHistoryTargetSnapshot = targetSnapshot
    testState = {
      ...testState,
      history: {
        phase: 'loading',
        attempts: previousHistory
          ? previousHistory.attempts.map((attempt) => ({ ...attempt }))
          : [],
        errorMessage: '',
      },
    }
    render()
    return finishAttemptHistoryLoading(focusTarget)
  }

  function retryAttemptHistory() {
    if (
      !isActive ||
      !['empty', 'ready'].includes(viewState.phase) ||
      testState.history.phase !== 'error' ||
      !isEntityId(viewState.selectedModuleId)
    ) {
      return
    }

    loadAttemptHistory({ type: 'attemptHistoryAlert' })
  }

  function retryProgressLoad() {
    if (
      !canUseReadyView() ||
      !['unavailable', 'stale'].includes(viewState.progress.phase)
    ) {
      return
    }

    viewState = {
      ...viewState,
      progress: createInitialProgressState(),
    }
    render()
    finishProgressLoading('unavailable')
    render()
  }

  function retryArtifactLoad() {
    if (
      !canUseReadyView() ||
      viewState.form !== null ||
      artifactState.phase !== 'unavailable'
    ) {
      return
    }

    artifactTargetSnapshot = null
    artifactState = createInitialArtifactState()
    render()
    finishArtifactLoading()
    render(
      artifactState.phase === 'ready'
        ? { type: 'artifactHeading' }
        : { type: 'artifactLoadAlert' }
    )
  }

  function selectModule(moduleId) {
    if (blockActiveTestTransition()) return
    if (!canUseReadyView()) return

    const learningModule = getModule(viewState.hub, moduleId)
    if (!learningModule) return
    if (moduleId === viewState.selectedModuleId) return
    if (blockDirtyQuestionTransition()) return
    if (blockDirtyArtifactTransition()) return

    resetQuestionInteraction()
    resetArtifactInteraction()
    resetActiveTestSession()
    attemptHistoryTargetSnapshot = null
    viewState = {
      ...viewState,
      selectedModuleId: learningModule.id,
      expandedChapterIds: [],
      selectedLearningNodeId: null,
      form: null,
      statusMessage: '',
      errorMessage: '',
    }
    testState = {
      ...testState,
      runner: {
        ...createInitialTestState().runner,
        questionCount: testBankSnapshot
          ? testBankSnapshot.questions.filter(
              (question) => question.moduleId === learningModule.id
            ).length
          : 0,
      },
      history: {
        phase: 'loading',
        attempts: [],
        errorMessage: '',
      },
    }
    render({ type: 'moduleHeading' })
    loadAttemptHistory({ type: 'moduleHeading' })
  }

  function backToOverview() {
    if (blockActiveTestTransition()) return
    if (!canUseReadyView() || viewState.selectedModuleId === null) return
    if (blockDirtyQuestionTransition()) return
    if (blockDirtyArtifactTransition()) return

    resetQuestionInteraction()
    resetArtifactInteraction()
    resetActiveTestSession()
    attemptHistoryTargetSnapshot = null
    testState = {
      ...testState,
      runner: createInitialTestState().runner,
      history: {
        phase: 'idle',
        attempts: [],
        errorMessage: '',
      },
    }
    viewState = {
      ...viewState,
      selectedModuleId: null,
      expandedChapterIds: [],
      selectedLearningNodeId: null,
      form: null,
      errorMessage: '',
    }
    render({ type: 'overviewHeading' })
  }

  function toggleChapter(moduleId, chapterId) {
    if (blockActiveTestTransition()) return
    if (!canUseReadyView() || moduleId !== viewState.selectedModuleId) return

    const learningModule = getModule(viewState.hub, moduleId)
    const chapter = getChapter(learningModule, chapterId)
    if (!chapter) return

    const isExpanded = viewState.expandedChapterIds.includes(chapterId)
    const expandedChapterIds = isExpanded
      ? viewState.expandedChapterIds.filter((id) => id !== chapterId)
      : [...viewState.expandedChapterIds, chapterId]
    const selectedLocation = getLearningNodeLocation(
      learningModule,
      viewState.selectedLearningNodeId
    )
    const willHideSelectedLearningNode =
      isExpanded && selectedLocation?.chapter.id === chapterId

    if (
      willHideSelectedLearningNode &&
      blockDirtyQuestionTransition()
    ) {
      return
    }

    if (
      willHideSelectedLearningNode &&
      blockDirtyArtifactTransition()
    ) {
      return
    }

    if (willHideSelectedLearningNode) {
      resetQuestionInteraction()
      resetArtifactInteraction()
    }

    viewState = {
      ...viewState,
      expandedChapterIds,
      selectedLearningNodeId:
        willHideSelectedLearningNode
          ? null
          : viewState.selectedLearningNodeId,
      form:
        isExpanded && viewState.form?.chapterId === chapterId
          ? null
          : viewState.form,
      errorMessage: '',
    }
    render({ type: 'chapterToggle', moduleId, chapterId })
  }

  function toggleChapterCompletion(moduleId, chapterId) {
    if (
      !canUseReadyView() ||
      viewState.progress.phase !== 'ready' ||
      moduleId !== viewState.selectedModuleId
    ) {
      return
    }

    const learningModule = getModule(viewState.hub, moduleId)
    const chapter = getChapter(learningModule, chapterId)
    const moduleProgress = getModuleProgress(
      viewState.progress.projection,
      moduleId
    )
    const chapterProgress = getChapterProgress(
      moduleProgress,
      chapterId
    )

    if (!chapter || !chapterProgress) return

    const serviceMethod = chapterProgress.isCompleted
      ? 'reopenChapter'
      : 'completeChapter'
    const previousProjection = cloneProgressProjection(
      viewState.progress.projection
    )

    viewState = {
      ...viewState,
      statusMessage: '',
      progress: {
        phase: 'mutating',
        projection: previousProjection,
        errorMessage: '',
        mutatingChapterId: chapterId,
      },
    }
    render()

    let result
    let nextProjection = null

    try {
      result = learningProgressService?.[serviceMethod]?.({
        moduleId,
        chapterId,
      })
      const expectedResults = PROGRESS_SUCCESS_RESULTS[serviceMethod]

      if (
        result?.ok === true &&
        Object.hasOwn(expectedResults, result.status) &&
        result.changed === expectedResults[result.status] &&
        isProgressProjectionForHub(result.projection, viewState.hub)
      ) {
        const nextModuleProgress = getModuleProgress(
          result.projection,
          moduleId
        )
        const nextChapterProgress = getChapterProgress(
          nextModuleProgress,
          chapterId
        )
        const expectedIsCompleted = serviceMethod === 'completeChapter'

        if (nextChapterProgress?.isCompleted === expectedIsCompleted) {
          nextProjection = cloneProgressProjection(result.projection)
        }
      }
    } catch {
      result = null
    }

    if (!nextProjection) {
      viewState = {
        ...viewState,
        progress: {
          phase: 'ready',
          projection: previousProjection,
          errorMessage: PROGRESS_MUTATION_ERROR_MESSAGE,
          mutatingChapterId: null,
        },
      }
      render({ type: 'chapterCompletion', chapterId })
      return
    }

    viewState = {
      ...viewState,
      statusMessage: PROGRESS_SUCCESS_MESSAGES[serviceMethod],
      errorMessage: '',
      progress: {
        phase: 'ready',
        projection: nextProjection,
        errorMessage: '',
        mutatingChapterId: null,
      },
    }
    render({ type: 'chapterCompletion', chapterId })
  }

  function selectLearningNode(moduleId, chapterId, learningNodeId) {
    if (blockActiveTestTransition()) return
    if (!canUseReadyView() || moduleId !== viewState.selectedModuleId) return

    const learningModule = getModule(viewState.hub, moduleId)
    const chapter = getChapter(learningModule, chapterId)
    const learningNode = getLearningNode(chapter, learningNodeId)
    if (!learningNode) return
    if (learningNodeId === viewState.selectedLearningNodeId) return
    if (blockDirtyQuestionTransition()) return
    if (blockDirtyArtifactTransition()) return

    resetQuestionInteraction()
    resetArtifactInteraction()
    viewState = {
      ...viewState,
      expandedChapterIds: [
        ...new Set([...viewState.expandedChapterIds, chapterId]),
      ],
      selectedLearningNodeId: learningNode.id,
      form: null,
      statusMessage: '',
      errorMessage: '',
    }
    render({
      type: 'learningNodeHeading',
      moduleId,
      chapterId,
      learningNodeId,
    })
  }

  function setForm(form, focusTarget, stateUpdates = {}) {
    if (blockActiveTestTransition()) return
    if (!canUseReadyView()) return
    if (blockDirtyQuestionTransition()) return
    if (blockDirtyArtifactTransition()) return

    resetQuestionInteraction()
    resetArtifactInteraction()
    viewState = {
      ...viewState,
      ...stateUpdates,
      form,
      statusMessage: '',
      errorMessage: '',
    }
    render(focusTarget)
  }

  function openCreateModuleForm() {
    if (viewState.selectedModuleId !== null) return
    setForm(
      createFormState(FORM_TYPES.CREATE_MODULE),
      { type: 'formField', fieldName: 'title' }
    )
  }

  function openRenameModuleForm(moduleId) {
    const learningModule = getModule(viewState.hub, moduleId)
    if (!learningModule || moduleId !== viewState.selectedModuleId) return

    setForm(
      createFormState(
        FORM_TYPES.RENAME_MODULE,
        { moduleId },
        { title: learningModule.title }
      ),
      { type: 'formField', fieldName: 'title' }
    )
  }

  function openAddChapterForm(moduleId) {
    if (
      moduleId !== viewState.selectedModuleId ||
      !getModule(viewState.hub, moduleId)
    ) return

    setForm(
      createFormState(FORM_TYPES.ADD_CHAPTER, { moduleId }),
      { type: 'formField', fieldName: 'title' }
    )
  }

  function openRenameChapterForm(moduleId, chapterId) {
    const learningModule = getModule(viewState.hub, moduleId)
    const chapter = getChapter(learningModule, chapterId)
    if (!chapter || moduleId !== viewState.selectedModuleId) return

    setForm(
      createFormState(
        FORM_TYPES.RENAME_CHAPTER,
        { moduleId, chapterId },
        { title: chapter.title }
      ),
      { type: 'formField', fieldName: 'title' }
    )
  }

  function openAddLearningNodeForm(moduleId, chapterId) {
    if (blockActiveTestTransition()) return
    if (!canUseReadyView()) return

    const learningModule = getModule(viewState.hub, moduleId)
    const chapter = getChapter(learningModule, chapterId)
    if (!chapter || moduleId !== viewState.selectedModuleId) return
    setForm(
      createFormState(FORM_TYPES.ADD_LEARNING_NODE, {
        moduleId,
        chapterId,
      }),
      { type: 'formField', fieldName: 'title' },
      {
        expandedChapterIds: [
          ...new Set([...viewState.expandedChapterIds, chapterId]),
        ],
      }
    )
  }

  function openUpdateLearningNodeForm(
    moduleId,
    chapterId,
    learningNodeId
  ) {
    if (blockActiveTestTransition()) return
    if (!canUseReadyView()) return

    const learningModule = getModule(viewState.hub, moduleId)
    const chapter = getChapter(learningModule, chapterId)
    const learningNode = getLearningNode(chapter, learningNodeId)
    if (!learningNode || moduleId !== viewState.selectedModuleId) return
    setForm(
      createFormState(
        FORM_TYPES.UPDATE_LEARNING_NODE,
        { moduleId, chapterId, learningNodeId },
        { title: learningNode.title, content: learningNode.content }
      ),
      { type: 'formField', fieldName: 'title' },
      {
        expandedChapterIds: [
          ...new Set([...viewState.expandedChapterIds, chapterId]),
        ],
        selectedLearningNodeId: learningNodeId,
      }
    )
  }

  function doesQuestionTargetMatchSelection(targetSnapshot) {
    const references = getSelectedLearningNodeReferences(viewState)

    return (
      targetSnapshot &&
      references &&
      targetSnapshot.moduleId === references.moduleId &&
      targetSnapshot.chapterId === references.chapterId &&
      targetSnapshot.learningNodeId === references.learningNodeId &&
      (
        targetSnapshot.mode === 'create' ||
        isTrimmedEntityId(targetSnapshot.questionId)
      )
    )
  }

  function canOpenQuestionEditor() {
    return (
      canUseReadyView() &&
      viewState.form === null &&
      testState.editor === null &&
      artifactState.mode === 'view' &&
      testState.bank.phase === 'ready' &&
      testBankSnapshot !== null &&
      getSelectedLearningNodeReferences(viewState) !== null
    )
  }

  function openCreateQuestion() {
    if (blockActiveTestTransition()) return

    if (testState.editor) {
      render({
        type: 'questionEditorField',
        fieldName: 'prompt',
      })
      return
    }

    if (!canOpenQuestionEditor()) return
    if (blockDirtyArtifactTransition()) return

    const references = getSelectedLearningNodeReferences(viewState)
    const targetSnapshot = createFrozenSnapshot({
      ...references,
      mode: 'create',
    })
    const baselineSnapshot = createFrozenSnapshot(
      getDefaultQuestionValues()
    )

    if (!targetSnapshot || !baselineSnapshot) return

    questionTargetSnapshot = targetSnapshot
    questionBaselineSnapshot = baselineSnapshot
    testState = {
      ...testState,
      bank: {
        ...testState.bank,
        errorMessage: '',
        statusMessage: '',
      },
      editor: createQuestionEditor(
        'create',
        getDefaultQuestionValues()
      ),
    }
    render({
      type: 'questionEditorField',
      fieldName: 'prompt',
    })
  }

  function openEditQuestion(questionId) {
    if (blockActiveTestTransition()) return
    if (!isTrimmedEntityId(questionId)) return

    if (testState.editor) {
      if (
        testState.editor.mode === 'edit' &&
        testState.editor.questionId === questionId
      ) {
        render({
          type: 'questionEditorField',
          fieldName: 'prompt',
        })
      }
      return
    }

    if (!canOpenQuestionEditor()) return
    if (blockDirtyArtifactTransition()) return

    const references = getSelectedLearningNodeReferences(viewState)
    const question = testBankSnapshot.questions.find(
      (candidateQuestion) => (
        candidateQuestion.id === questionId &&
        candidateQuestion.moduleId === references.moduleId &&
        candidateQuestion.chapterId === references.chapterId &&
        candidateQuestion.learningNodeId === references.learningNodeId
      )
    )
    if (!question) return

    const orderedOptions = sortByPosition(question.options)
    const values = {
      prompt: question.prompt,
      difficulty: question.difficulty,
      options: orderedOptions.map((option) => option.label),
      correctOptionIndex: orderedOptions.findIndex(
        (option) => option.id === question.correctOptionId
      ),
      explanation: question.explanation,
    }
    const targetSnapshot = createFrozenSnapshot({
      ...references,
      mode: 'edit',
      questionId: question.id,
    })
    const baselineSnapshot = createFrozenSnapshot(values)

    if (!targetSnapshot || !baselineSnapshot) return

    questionTargetSnapshot = targetSnapshot
    questionBaselineSnapshot = baselineSnapshot
    testState = {
      ...testState,
      bank: {
        ...testState.bank,
        errorMessage: '',
        statusMessage: '',
      },
      editor: createQuestionEditor('edit', values, question.id),
    }
    render({
      type: 'questionEditorField',
      fieldName: 'prompt',
    })
  }

  function updateQuestionEditorValues(
    nextValues,
    clearedFieldName,
    focusTarget = null
  ) {
    if (
      !testState.editor ||
      testState.editor.isSubmitting ||
      testState.editor.discardConfirmation ||
      !doesQuestionTargetMatchSelection(questionTargetSnapshot) ||
      !questionBaselineSnapshot
    ) {
      return false
    }

    const nextDirty = !areQuestionValuesEqual(
      nextValues,
      questionBaselineSnapshot
    )
    const shouldRender = Boolean(
      testState.editor.errorMessage ||
      testState.editor.dirty !== nextDirty ||
      Object.keys(testState.editor.fieldErrors).some(
        (fieldName) => (
          fieldName === clearedFieldName ||
          (
            clearedFieldName === 'options' &&
            fieldName.startsWith('options.')
          )
        )
      )
    )
    const fieldErrors = { ...testState.editor.fieldErrors }
    delete fieldErrors[clearedFieldName]
    if (clearedFieldName === 'options') {
      Object.keys(fieldErrors)
        .filter((fieldName) => fieldName.startsWith('options.'))
        .forEach((fieldName) => delete fieldErrors[fieldName])
    }

    testState = {
      ...testState,
      editor: {
        ...testState.editor,
        values: nextValues,
        fieldErrors,
        errorMessage: '',
        dirty: nextDirty,
      },
    }

    if (shouldRender) {
      render(focusTarget)
    }

    return shouldRender
  }

  function updateQuestionField(fieldName, value, optionIndex) {
    if (!testState.editor) return

    if (fieldName === 'options') {
      if (
        typeof value !== 'string' ||
        !Number.isInteger(optionIndex) ||
        optionIndex < 0 ||
        optionIndex >= testState.editor.values.options.length
      ) {
        return
      }

      const options = [...testState.editor.values.options]
      options[optionIndex] = value
      updateQuestionEditorValues(
        { ...testState.editor.values, options },
        'options',
        {
          type: 'questionEditorField',
          fieldName: 'options',
          optionIndex,
        }
      )
      return
    }

    if (
      !['prompt', 'difficulty', 'explanation'].includes(fieldName) ||
      typeof value !== 'string'
    ) {
      return
    }

    updateQuestionEditorValues(
      { ...testState.editor.values, [fieldName]: value },
      fieldName,
      { type: 'questionEditorField', fieldName }
    )
  }

  function addQuestionOption() {
    if (
      !testState.editor ||
      testState.editor.values.options.length >=
        LEARNING_TEST_MAX_OPTION_COUNT
    ) {
      return
    }

    const didRender = updateQuestionEditorValues(
      {
        ...testState.editor.values,
        options: [...testState.editor.values.options, ''],
      },
      'options',
      {
        type: 'questionEditorField',
        fieldName: 'options',
        optionIndex: testState.editor.values.options.length,
      }
    )
    if (!didRender) {
      render({
        type: 'questionEditorField',
        fieldName: 'options',
        optionIndex: testState.editor.values.options.length - 1,
      })
    }
  }

  function removeQuestionOption(optionIndex) {
    if (
      !testState.editor ||
      !Number.isInteger(optionIndex) ||
      testState.editor.values.options.length <=
        LEARNING_TEST_MIN_OPTION_COUNT ||
      optionIndex < 0 ||
      optionIndex >= testState.editor.values.options.length
    ) {
      return
    }

    const options = testState.editor.values.options.filter(
      (_, index) => index !== optionIndex
    )
    const previousCorrectIndex =
      testState.editor.values.correctOptionIndex
    const correctOptionIndex = previousCorrectIndex === optionIndex
      ? 0
      : previousCorrectIndex > optionIndex
        ? previousCorrectIndex - 1
        : previousCorrectIndex

    const didRender = updateQuestionEditorValues(
      {
        ...testState.editor.values,
        options,
        correctOptionIndex,
      },
      'options',
      {
        type: 'questionEditorField',
        fieldName: 'options',
        optionIndex: Math.min(optionIndex, options.length - 1),
      }
    )
    if (!didRender) {
      render({
        type: 'questionEditorField',
        fieldName: 'options',
        optionIndex: Math.min(optionIndex, options.length - 1),
      })
    }
  }

  function selectCorrectQuestionOption(optionIndex) {
    if (
      !testState.editor ||
      !Number.isInteger(optionIndex) ||
      optionIndex < 0 ||
      optionIndex >= testState.editor.values.options.length
    ) {
      return
    }

    updateQuestionEditorValues(
      {
        ...testState.editor.values,
        correctOptionIndex: optionIndex,
      },
      'correctOptionIndex',
      {
        type: 'questionEditorField',
        fieldName: 'correctOptionIndex',
      }
    )
  }

  function getQuestionEditorTrigger(editor, targetSnapshot) {
    return {
      type: 'questionEditorTrigger',
      mode: editor.mode,
      ...(editor.mode === 'edit'
        ? { questionId: targetSnapshot?.questionId }
        : {}),
    }
  }

  function cancelQuestionEditor() {
    if (!testState.editor || testState.editor.isSubmitting) return

    if (testState.editor.dirty) {
      blockDirtyQuestionTransition()
      return
    }

    const focusTarget = getQuestionEditorTrigger(
      testState.editor,
      questionTargetSnapshot
    )
    resetQuestionInteraction()
    render(focusTarget)
  }

  function continueQuestionEditing() {
    if (!testState.editor?.discardConfirmation) return

    testState = {
      ...testState,
      editor: {
        ...testState.editor,
        discardConfirmation: false,
        errorMessage: '',
      },
    }
    render({
      type: 'questionEditorField',
      fieldName: 'prompt',
    })
  }

  function discardQuestionDraft() {
    if (!testState.editor?.discardConfirmation) return

    const focusTarget = getQuestionEditorTrigger(
      testState.editor,
      questionTargetSnapshot
    )
    resetQuestionInteraction()
    render(focusTarget)
  }

  function finishQuestionMutation(validResult) {
    testBankSnapshot = deepFreezeData(validResult.testBank)
    questionTargetSnapshot = null
    questionBaselineSnapshot = null
    questionMutationReconciliationSnapshot = null
    testState = {
      ...testState,
      bank: {
        phase: 'ready',
        errorMessage: '',
        statusMessage:
          validResult.status === 'questionCreated'
            ? 'Testfrage wurde lokal erstellt.'
            : validResult.status === 'questionUpdated'
              ? 'Testfrage wurde lokal aktualisiert.'
              : 'Die Testfrage ist bereits aktuell.',
      },
      editor: null,
    }
    render({ type: 'testBankStatus' })
  }

  function getQuestionBaselineFromBank(
    mode,
    targetSnapshot,
    authoritativeBank
  ) {
    if (mode === 'create') return getDefaultQuestionValues()

    const question = authoritativeBank.questions.find(
      (candidateQuestion) =>
        candidateQuestion.id === targetSnapshot.questionId &&
        candidateQuestion.moduleId === targetSnapshot.moduleId &&
        candidateQuestion.chapterId === targetSnapshot.chapterId &&
        candidateQuestion.learningNodeId === targetSnapshot.learningNodeId
    )

    if (!question) return null

    const orderedOptions = sortByPosition(question.options)
    return {
      prompt: question.prompt,
      difficulty: question.difficulty,
      options: orderedOptions.map((option) => option.label),
      correctOptionIndex: orderedOptions.findIndex(
        (option) => option.id === question.correctOptionId
      ),
      explanation: question.explanation,
    }
  }

  function reconcileQuestionMutation() {
    const reconciliationAtEntry =
      questionMutationReconciliationSnapshot
    const targetAtEntry = questionTargetSnapshot

    if (
      !reconciliationAtEntry ||
      !targetAtEntry ||
      !testState.editor ||
      !doesQuestionTargetMatchSelection(targetAtEntry)
    ) {
      return false
    }

    testState = {
      ...testState,
      editor: {
        ...testState.editor,
        isSubmitting: true,
        fieldErrors: {},
        errorMessage: '',
      },
    }
    render()

    let loadResult = null

    try {
      loadResult = learningTestService?.loadTestBank?.()
    } catch {
      loadResult = null
    }

    if (
      questionMutationReconciliationSnapshot !==
        reconciliationAtEntry ||
      questionTargetSnapshot !== targetAtEntry ||
      !doesQuestionTargetMatchSelection(targetAtEntry) ||
      !testState.editor
    ) {
      return false
    }

    const authoritativeBank = cloneValidatedTestBank(
      loadResult,
      viewState.hub
    )

    if (!authoritativeBank) {
      testState = {
        ...testState,
        editor: {
          ...testState.editor,
          isSubmitting: false,
          fieldErrors: {},
          errorMessage: TEST_BANK_RESULT_ERROR_MESSAGE,
          dirty: true,
        },
      }
      render({ type: 'questionEditorAlert' })
      return false
    }

    const validResult = readQuestionMutationReconciliation({
      mode: reconciliationAtEntry.mode,
      targetSnapshot: reconciliationAtEntry.targetSnapshot,
      previousBank: reconciliationAtEntry.previousBank,
      values: reconciliationAtEntry.values,
      authoritativeBank,
      learningHub: viewState.hub,
    })

    if (validResult) {
      finishQuestionMutation(validResult)
      return true
    }

    testBankSnapshot = deepFreezeData(authoritativeBank)
    questionMutationReconciliationSnapshot = null
    const baselineValues = getQuestionBaselineFromBank(
      targetAtEntry.mode,
      targetAtEntry,
      authoritativeBank
    )
    const baselineSnapshot = baselineValues
      ? createFrozenSnapshot(baselineValues)
      : null

    if (baselineSnapshot) {
      questionBaselineSnapshot = baselineSnapshot
    }

    testState = {
      ...testState,
      bank: {
        phase: 'ready',
        errorMessage: '',
        statusMessage: '',
      },
      editor: {
        ...testState.editor,
        isSubmitting: false,
        fieldErrors: {},
        errorMessage: TEST_BANK_RESULT_ERROR_MESSAGE,
        dirty: !areQuestionValuesEqual(
          testState.editor.values,
          questionBaselineSnapshot
        ),
      },
    }
    render({ type: 'questionEditorAlert' })
    return false
  }

  function submitQuestion() {
    if (questionMutationReconciliationSnapshot) {
      reconcileQuestionMutation()
      return
    }

    const editorAtEntry = testState.editor
    const targetAtEntry = questionTargetSnapshot
    const baselineAtEntry = questionBaselineSnapshot

    if (
      !editorAtEntry ||
      editorAtEntry.isSubmitting ||
      editorAtEntry.discardConfirmation ||
      !targetAtEntry ||
      !baselineAtEntry ||
      !doesQuestionTargetMatchSelection(targetAtEntry) ||
      testState.bank.phase !== 'ready' ||
      !testBankSnapshot
    ) {
      return
    }

    const validation = validateQuestionEditorValues(editorAtEntry.values)

    if (Object.keys(validation.fieldErrors).length > 0) {
      testState = {
        ...testState,
        editor: {
          ...editorAtEntry,
          values: {
            ...validation.values,
            options: [...validation.values.options],
          },
          fieldErrors: validation.fieldErrors,
          errorMessage: 'Bitte korrigiere die markierten Felder.',
          dirty: true,
        },
      }
      render(
        getFirstQuestionFieldError(
          validation.fieldErrors,
          editorAtEntry.values
        )
      )
      return
    }

    const previousBank = cloneTestBank(testBankSnapshot)
    const serviceInput = {
      moduleId: targetAtEntry.moduleId,
      chapterId: targetAtEntry.chapterId,
      learningNodeId: targetAtEntry.learningNodeId,
      ...validation.values,
      ...(targetAtEntry.mode === 'edit'
        ? { questionId: targetAtEntry.questionId }
        : {}),
    }

    testState = {
      ...testState,
      editor: {
        ...editorAtEntry,
        values: {
          ...validation.values,
          options: [...validation.values.options],
        },
        fieldErrors: {},
        errorMessage: '',
        isSubmitting: true,
      },
    }
    render()

    let result = null

    try {
      const methodName = targetAtEntry.mode === 'create'
        ? 'createQuestion'
        : 'updateQuestion'
      result = learningTestService?.[methodName]?.({ ...serviceInput })
    } catch {
      result = null
    }

    if (
      questionTargetSnapshot !== targetAtEntry ||
      questionBaselineSnapshot !== baselineAtEntry ||
      !doesQuestionTargetMatchSelection(targetAtEntry) ||
      testState.editor !== null &&
        testState.editor.mode !== editorAtEntry.mode
    ) {
      testState = {
        ...testState,
        editor: testState.editor
          ? {
              ...testState.editor,
              isSubmitting: false,
              errorMessage: TEST_BANK_RESULT_ERROR_MESSAGE,
            }
          : null,
      }
      render({ type: 'questionEditorAlert' })
      return
    }

    const validResult = readQuestionMutationResult({
      result,
      mode: targetAtEntry.mode,
      targetSnapshot: targetAtEntry,
      previousBank,
      values: validation.values,
      learningHub: viewState.hub,
    })

    if (validResult) {
      finishQuestionMutation(validResult)
      return
    }

    const malformedSuccess = (() => {
      const snapshot = snapshotPlainData(result)
      return snapshot.ok && snapshot.value?.ok === true
    })()

    if (malformedSuccess) {
      const reconciliationSnapshot = createFrozenSnapshot({
        mode: targetAtEntry.mode,
        targetSnapshot: targetAtEntry,
        previousBank,
        values: validation.values,
      })

      if (reconciliationSnapshot) {
        questionMutationReconciliationSnapshot =
          reconciliationSnapshot
        reconcileQuestionMutation()
        return
      }
    }

    testState = {
      ...testState,
      editor: {
        ...testState.editor,
        isSubmitting: false,
        fieldErrors: {},
        errorMessage: malformedSuccess
          ? TEST_BANK_RESULT_ERROR_MESSAGE
          : TEST_QUESTION_MUTATION_ERROR_MESSAGE,
        dirty: true,
      },
    }
    render({ type: 'questionEditorAlert' })
  }

  function canUseArtifactEditor() {
    return (
      canUseReadyView() &&
      viewState.form === null &&
      testState.editor === null &&
      artifactState.phase === 'ready' &&
      artifactStoreSnapshot !== null &&
      getSelectedLearningNodeReferences(viewState) !== null
    )
  }

  function openArtifactEditor(type) {
    if (!isArtifactType(type) || !canUseArtifactEditor()) return

    if (
      artifactState.mode === 'editing' &&
      !hasCurrentArtifactTarget(artifactState.activeType)
    ) {
      rejectArtifactTargetMismatch(artifactState.activeType)
      return
    }

    if (
      artifactState.mode === 'editing' &&
      artifactState.activeType === type
    ) {
      render({ type: 'artifactField', artifactType: type })
      return
    }

    if (blockDirtyArtifactTransition()) return

    const references = getSelectedLearningNodeReferences(viewState)
    const targetSnapshot = createArtifactTargetSnapshot(
      type,
      references
    )
    if (targetSnapshot === null) return

    resetArtifactInteraction()
    artifactTargetSnapshot = targetSnapshot
    artifactState = {
      ...artifactState,
      activeType: type,
      mode: 'editing',
      draft: getArtifactContent(
        artifactStoreSnapshot,
        type,
        references
      ) ?? '',
    }
    render({ type: 'artifactField', artifactType: type })
  }

  function updateArtifactDraft(type, value) {
    if (
      !isArtifactType(type) ||
      typeof value !== 'string' ||
      artifactState.phase !== 'ready' ||
      artifactState.mode !== 'editing' ||
      artifactState.activeType !== type
    ) {
      return
    }

    if (!hasCurrentArtifactTarget(type)) {
      rejectArtifactTargetMismatch(type)
      return
    }

    const shouldRender = Boolean(
      artifactState.fieldError ||
      artifactState.errorMessage ||
      artifactState.statusMessage
    )
    artifactState = {
      ...artifactState,
      draft: value,
      fieldError: '',
      errorMessage: '',
      statusMessage: '',
      feedbackType: null,
    }

    if (shouldRender) {
      render({ type: 'artifactField', artifactType: type })
    }
  }

  function getArtifactFailureFeedback(result, malformedSuccess) {
    if (malformedSuccess) {
      return {
        fieldError: '',
        errorMessage: ARTIFACT_RESULT_ERROR_MESSAGE,
      }
    }

    try {
      const hasFieldError = hasArtifactContentFieldError(result)

      return {
        fieldError: hasFieldError
          ? 'Bitte gib einen Text mit höchstens 10.000 Zeichen ein.'
          : '',
        errorMessage: hasFieldError
          ? 'Bitte korrigiere den Artefakttext.'
          : getArtifactMutationErrorMessage(result),
      }
    } catch {
      return {
        fieldError: '',
        errorMessage: ARTIFACT_MUTATION_ERROR_MESSAGE,
      }
    }
  }

  function saveArtifact(submission) {
    const targetSnapshotAtEntry = artifactTargetSnapshot
    const interactionType = artifactState.activeType
    const references = getArtifactTargetReferences(
      targetSnapshotAtEntry
    )
    const selectedReferencesAtEntry =
      getSelectedLearningNodeReferences(viewState)
    const targetMatchedSelectionAtEntry =
      doesArtifactTargetMatchSelection(
        targetSnapshotAtEntry,
        interactionType,
        selectedReferencesAtEntry
      )

    if (
      artifactState.phase !== 'ready' ||
      artifactState.mode !== 'editing' ||
      !isArtifactType(interactionType)
    ) {
      return
    }

    if (
      references === null ||
      !targetMatchedSelectionAtEntry ||
      artifactTargetSnapshot !== targetSnapshotAtEntry
    ) {
      rejectArtifactTargetMismatch(interactionType)
      return
    }

    function isOriginalArtifactInteractionCurrent(
      submittedType = interactionType
    ) {
      const currentReferences =
        getSelectedLearningNodeReferences(viewState)
      const targetMatchesSelection =
        doesArtifactTargetMatchSelection(
          targetSnapshotAtEntry,
          interactionType,
          currentReferences
        )

      return (
        targetMatchesSelection &&
        artifactTargetSnapshot === targetSnapshotAtEntry &&
        artifactState.phase === 'ready' &&
        artifactState.mode === 'editing' &&
        artifactState.activeType === interactionType &&
        submittedType === interactionType
      )
    }

    const canUseEditor = canUseArtifactEditor()

    if (!isOriginalArtifactInteractionCurrent()) {
      rejectArtifactTargetMismatch(interactionType)
      return
    }

    if (!canUseEditor) return

    let isSubmissionPlain = false

    try {
      isSubmissionPlain = isPlainDataObject(submission)
    } catch {
      isSubmissionPlain = false
    }

    if (!isOriginalArtifactInteractionCurrent()) {
      rejectArtifactTargetMismatch(interactionType)
      return
    }

    if (!isSubmissionPlain) return

    let type

    try {
      type = submission.type
    } catch {
      if (!isOriginalArtifactInteractionCurrent()) {
        rejectArtifactTargetMismatch(interactionType)
      }
      return
    }

    if (!isOriginalArtifactInteractionCurrent(type)) {
      rejectArtifactTargetMismatch(interactionType)
      return
    }

    if (!isArtifactType(type)) return

    let content

    try {
      content = submission.content
    } catch {
      if (!isOriginalArtifactInteractionCurrent(type)) {
        rejectArtifactTargetMismatch(interactionType)
      }
      return
    }

    if (!isOriginalArtifactInteractionCurrent(type)) {
      rejectArtifactTargetMismatch(interactionType)
      return
    }

    if (typeof content !== 'string') return

    let normalizedContent

    try {
      normalizedContent = content.trim()
    } catch {
      if (!isOriginalArtifactInteractionCurrent(type)) {
        rejectArtifactTargetMismatch(interactionType)
      }
      return
    }

    if (!isOriginalArtifactInteractionCurrent(type)) {
      rejectArtifactTargetMismatch(interactionType)
      return
    }

    artifactState = {
      ...artifactState,
      draft: content,
      fieldError: '',
      errorMessage: '',
      statusMessage: '',
      feedbackType: type,
    }

    if (
      normalizedContent.length === 0 ||
      normalizedContent.length > LEARNING_ARTIFACT_CONTENT_MAX_LENGTH
    ) {
      artifactState = {
        ...artifactState,
        fieldError:
          normalizedContent.length === 0
            ? 'Bitte gib einen Text ein.'
            : 'Bitte gib einen Text mit höchstens 10.000 Zeichen ein.',
        errorMessage: 'Bitte korrigiere den Artefakttext.',
      }
      render({ type: 'artifactField', artifactType: type })
      return
    }

    const previousStore = cloneArtifactStore(artifactStoreSnapshot)
    artifactState = {
      ...artifactState,
      phase: 'mutating',
      mutatingType: type,
    }
    render()

    let result = null
    let updatedStore = null
    let isValidSuccess = false
    let malformedSuccess = false

    try {
      result = learningArtifactService?.[
        ARTIFACT_SAVE_METHODS[type]
      ]?.({
        ...references,
        content,
      })

      if (result?.ok === true) {
        malformedSuccess = true
        if (hasArtifactResultShape(result)) {
          const expectedChanged =
            ARTIFACT_SAVE_SUCCESS_RESULTS[result.status]
          updatedStore = readValidatedArtifactStore(result, viewState.hub)
          isValidSuccess = (
            Object.hasOwn(
              ARTIFACT_SAVE_SUCCESS_RESULTS,
              result.status
            ) &&
            result.changed === expectedChanged &&
            updatedStore !== null &&
            isArtifactSaveResultConsistent(
              result.status,
              previousStore,
              updatedStore,
              type,
              references,
              normalizedContent
            )
          )
        }
        malformedSuccess = !isValidSuccess
      }
    } catch {
      result = null
      updatedStore = null
      isValidSuccess = false
      malformedSuccess = false
    }

    if (isValidSuccess) {
      artifactStoreSnapshot = updatedStore
      artifactTargetSnapshot = null
      artifactState = {
        ...createInitialArtifactState(),
        phase: 'ready',
        statusMessage: result.status === 'artifactCreated'
          ? ARTIFACT_LABELS[type] + ' wurde lokal erstellt.'
          : result.status === 'artifactUpdated'
            ? ARTIFACT_LABELS[type] + ' wurde lokal aktualisiert.'
            : ARTIFACT_LABELS[type] + ' ist bereits aktuell.',
        feedbackType: type,
      }
      render({ type: 'artifactTrigger', artifactType: type })
      return
    }

    const feedback = getArtifactFailureFeedback(
      result,
      malformedSuccess
    )
    artifactState = {
      ...artifactState,
      phase: 'ready',
      mode: 'editing',
      activeType: type,
      draft: content,
      fieldError: feedback.fieldError,
      errorMessage: feedback.errorMessage,
      statusMessage: '',
      feedbackType: type,
      mutatingType: null,
    }
    render({
      type: feedback.fieldError ? 'artifactField' : 'artifactAlert',
      artifactType: type,
    })
  }

  function cancelArtifactEditor(type) {
    if (
      !isArtifactType(type) ||
      artifactState.phase !== 'ready' ||
      artifactState.mode !== 'editing' ||
      artifactState.activeType !== type
    ) {
      return
    }

    resetArtifactInteraction()
    render({ type: 'artifactTrigger', artifactType: type })
  }

  function canResolveArtifactClear(type) {
    return (
      isActive &&
      isArtifactType(type) &&
      ['empty', 'ready'].includes(viewState.phase) &&
      viewState.form === null &&
      viewState.progress.phase !== 'mutating' &&
      artifactState.phase === 'ready' &&
      artifactStoreSnapshot !== null &&
      getSelectedLearningNodeReferences(viewState) !== null
    )
  }

  function openArtifactClearConfirmation(type) {
    if (!canResolveArtifactClear(type)) return

    if (artifactState.mode === 'confirmClear') {
      if (
        artifactState.activeType !== type ||
        !hasCurrentArtifactTarget(type)
      ) {
        rejectArtifactTargetMismatch(artifactState.activeType)
        return
      }

      render({
        type: 'artifactConfirmation',
        artifactType: type,
      })
      return
    }

    const references = getSelectedLearningNodeReferences(viewState)
    const targetSnapshot = createArtifactTargetSnapshot(
      type,
      references
    )
    if (targetSnapshot === null) return

    if (artifactState.mode === 'editing') {
      if (!hasCurrentArtifactTarget(artifactState.activeType)) {
        rejectArtifactTargetMismatch(artifactState.activeType)
        return
      }

      if (
        artifactState.activeType !== type &&
        blockDirtyArtifactTransition()
      ) {
        return
      }
    }

    if (getArtifactContent(artifactStoreSnapshot, type, references) === null) {
      return
    }

    const shouldResumeArtifactEditing = (
      artifactState.mode === 'editing' &&
      artifactState.activeType === type
    )
    const preservedDraft = shouldResumeArtifactEditing
      ? artifactState.draft
      : ''

    if (!shouldResumeArtifactEditing) {
      resetArtifactInteraction()
    }

    artifactTargetSnapshot = targetSnapshot
    resumeArtifactEditingAfterClear = shouldResumeArtifactEditing
    artifactState = {
      ...artifactState,
      activeType: type,
      mode: 'confirmClear',
      draft: preservedDraft,
      fieldError: '',
      errorMessage: '',
      statusMessage: '',
      feedbackType: type,
      mutatingType: null,
    }
    render({
      type: 'artifactConfirmation',
      artifactType: type,
    })
  }

  function cancelArtifactClearConfirmation(type) {
    if (
      !isArtifactType(type) ||
      artifactState.phase !== 'ready' ||
      artifactState.mode !== 'confirmClear'
    ) {
      return
    }

    if (
      artifactState.activeType !== type ||
      !canResolveArtifactClear(type) ||
      !hasCurrentArtifactTarget(type)
    ) {
      rejectArtifactTargetMismatch(artifactState.activeType)
      return
    }

    if (resumeArtifactEditingAfterClear) {
      resumeArtifactEditingAfterClear = false
      artifactState = {
        ...artifactState,
        mode: 'editing',
        fieldError: '',
        errorMessage: '',
        statusMessage: '',
        feedbackType: null,
      }
      render({ type: 'artifactClearTrigger', artifactType: type })
      return
    }

    resetArtifactInteraction()
    render({ type: 'artifactClearTrigger', artifactType: type })
  }

  function confirmArtifactClear(type) {
    if (
      !isArtifactType(type) ||
      artifactState.phase !== 'ready' ||
      artifactState.mode !== 'confirmClear'
    ) {
      return
    }

    if (
      artifactState.activeType !== type ||
      !canResolveArtifactClear(type) ||
      !hasCurrentArtifactTarget(type)
    ) {
      rejectArtifactTargetMismatch(artifactState.activeType)
      return
    }

    const references = getArtifactTargetReferences(
      artifactTargetSnapshot
    )
    const previousStore = cloneArtifactStore(artifactStoreSnapshot)
    artifactState = {
      ...artifactState,
      phase: 'mutating',
      errorMessage: '',
      statusMessage: '',
      mutatingType: type,
    }
    render()

    let result = null
    let updatedStore = null
    let isValidSuccess = false
    let malformedSuccess = false

    try {
      result = learningArtifactService?.[
        ARTIFACT_CLEAR_METHODS[type]
      ]?.({ ...references })

      if (result?.ok === true) {
        malformedSuccess = true
        if (hasArtifactResultShape(result)) {
          const expectedChanged =
            ARTIFACT_CLEAR_SUCCESS_RESULTS[result.status]
          updatedStore = readValidatedArtifactStore(result, viewState.hub)
          isValidSuccess = (
            Object.hasOwn(
              ARTIFACT_CLEAR_SUCCESS_RESULTS,
              result.status
            ) &&
            result.changed === expectedChanged &&
            updatedStore !== null &&
            isArtifactClearResultConsistent(
              result.status,
              previousStore,
              updatedStore,
              type,
              references
            )
          )
        }
        malformedSuccess = !isValidSuccess
      }
    } catch {
      result = null
      updatedStore = null
      isValidSuccess = false
      malformedSuccess = false
    }

    if (isValidSuccess) {
      artifactStoreSnapshot = updatedStore
      artifactTargetSnapshot = null
      resumeArtifactEditingAfterClear = false
      artifactState = {
        ...createInitialArtifactState(),
        phase: 'ready',
        statusMessage: result.status === 'artifactCleared'
          ? ARTIFACT_LABELS[type] + ' wurde lokal geleert.'
          : ARTIFACT_LABELS[type] + ' war bereits leer.',
        feedbackType: type,
      }
      render({ type: 'artifactTrigger', artifactType: type })
      return
    }

    const feedback = getArtifactFailureFeedback(
      result,
      malformedSuccess
    )
    artifactState = {
      ...artifactState,
      phase: 'ready',
      mode: 'confirmClear',
      activeType: type,
      fieldError: '',
      errorMessage: feedback.errorMessage,
      statusMessage: '',
      feedbackType: type,
      mutatingType: null,
    }
    render({ type: 'artifactAlert', artifactType: type })
  }

  function resetActiveTestSession() {
    testStartTargetSnapshot = null
    activeTestSessionSnapshot = null
    activeTestSolutionSnapshot = null
    testSubmissionTargetSnapshot = null
    testCancelTargetSnapshot = null
  }

  function startModuleTest() {
    if (
      !isActive ||
      !['empty', 'ready'].includes(viewState.phase) ||
      isTestSessionOpen(testState.runner) ||
      testState.bank.phase !== 'ready' ||
      !testBankSnapshot ||
      !isEntityId(viewState.selectedModuleId)
    ) {
      return
    }

    if (
      viewState.form !== null ||
      artifactState.mode !== 'view' ||
      artifactState.phase === 'mutating' ||
      testState.editor !== null
    ) {
      testState = {
        ...testState,
        runner: {
          ...testState.runner,
          errorMessage: TEST_INTERACTION_BLOCK_MESSAGE,
          statusMessage: '',
        },
      }
      render({ type: 'testStart' })
      return
    }

    const moduleId = viewState.selectedModuleId
    const questions = getOrderedModuleQuestions(
      viewState.hub,
      testBankSnapshot,
      moduleId
    )

    if (questions.length === 0) {
      testState = {
        ...testState,
        runner: {
          ...testState.runner,
          phase: 'idle',
          errorMessage:
            'Für dieses Lernmodul sind noch keine Testfragen vorhanden.',
          statusMessage: '',
        },
      }
      render({ type: 'testStart' })
      return
    }

    const targetSnapshot = createFrozenSnapshot({
      moduleId,
      questions: questions.map(cloneTestQuestion),
    })
    if (!targetSnapshot) return

    resetActiveTestSession()
    testStartTargetSnapshot = targetSnapshot
    testState = {
      ...testState,
      runner: {
        phase: 'starting',
        questionCount: questions.length,
        testSession: null,
        answers: [],
        retryPending: false,
        errorMessage: '',
        statusMessage: 'Der lokale Modultest wird vorbereitet.',
        cancelConfirmation: false,
        result: null,
      },
    }
    render()

    let result = null

    try {
      result = learningTestService?.startModuleTest?.({ moduleId })
    } catch {
      result = null
    }

    if (
      testStartTargetSnapshot !== targetSnapshot ||
      viewState.selectedModuleId !== targetSnapshot.moduleId
    ) {
      testStartTargetSnapshot = null
      testState = {
        ...testState,
        runner: {
          ...createInitialTestState().runner,
          questionCount: questions.length,
          errorMessage: TEST_START_ERROR_MESSAGE,
        },
      }
      render({ type: 'testStart' })
      return
    }

    const publicSession = isPublicSessionForStartResult(
      result,
      targetSnapshot,
      viewState.hub,
      testBankSnapshot
    )

    if (!publicSession) {
      testStartTargetSnapshot = null
      testState = {
        ...testState,
        runner: {
          ...createInitialTestState().runner,
          questionCount: questions.length,
          errorMessage: TEST_START_ERROR_MESSAGE,
        },
      }
      render({ type: 'testStart' })
      return
    }

    const publicSessionSnapshot = createFrozenSnapshot(publicSession)
    const solutionSnapshot = createTestSolutionSnapshot(
      targetSnapshot.moduleId,
      targetSnapshot.questions
    )
    testStartTargetSnapshot = null

    if (!publicSessionSnapshot || !solutionSnapshot) {
      resetActiveTestSession()
      testState = {
        ...testState,
        runner: {
          ...createInitialTestState().runner,
          questionCount: questions.length,
          errorMessage: TEST_START_ERROR_MESSAGE,
        },
      }
      render({ type: 'testStart' })
      return
    }

    activeTestSessionSnapshot = publicSessionSnapshot
    activeTestSolutionSnapshot = solutionSnapshot

    testState = {
      ...testState,
      runner: {
        phase: 'active',
        questionCount: publicSession.questions.length,
        testSession: publicSession,
        answers: publicSession.questions.map((question) => ({
          questionId: question.id,
          selectedOptionId: null,
        })),
        retryPending: false,
        errorMessage: '',
        statusMessage: '',
        cancelConfirmation: false,
        result: null,
      },
    }
    render({ type: 'testRunnerHeading' })
  }

  function selectTestAnswer(questionId, optionId) {
    if (
      testState.runner.phase !== 'active' ||
      testState.runner.retryPending ||
      testState.runner.cancelConfirmation ||
      !activeTestSessionSnapshot ||
      !isTrimmedEntityId(questionId) ||
      !isTrimmedEntityId(optionId)
    ) {
      return
    }

    const question = activeTestSessionSnapshot.questions.find(
      (candidateQuestion) => candidateQuestion.id === questionId
    )

    if (
      !question ||
      !question.options.some((option) => option.id === optionId)
    ) {
      return
    }

    testState = {
      ...testState,
      runner: {
        ...testState.runner,
        answers: testState.runner.answers.map((answer) => (
          answer.questionId === questionId
            ? { ...answer, selectedOptionId: optionId }
            : answer
        )),
        errorMessage: '',
        statusMessage: '',
      },
    }
    render({ type: 'testAnswer', questionId, optionId })
  }

  function reconcilePersistedTestSubmission(
    sessionAtEntry,
    solutionAtEntry,
    submissionSnapshot
  ) {
    if (
      !sessionAtEntry ||
      !solutionAtEntry ||
      !submissionSnapshot ||
      sessionAtEntry.moduleId !== submissionSnapshot.moduleId ||
      solutionAtEntry.moduleId !== submissionSnapshot.moduleId ||
      !testBankSnapshot
    ) {
      return null
    }

    let result = null

    try {
      result = learningTestService?.loadAttemptHistory?.({
        moduleId: sessionAtEntry.moduleId,
      })
    } catch {
      result = null
    }

    if (
      activeTestSessionSnapshot !== sessionAtEntry ||
      activeTestSolutionSnapshot !== solutionAtEntry ||
      testSubmissionTargetSnapshot !== submissionSnapshot
    ) {
      return null
    }

    const historyResult = readSanitizedAttemptHistory(
      result,
      {
        moduleId: sessionAtEntry.moduleId,
        hasPreviousSnapshot: false,
        previousAttempts: [],
        expectedAppends: [],
      },
      viewState.hub,
      testBankSnapshot
    )

    if (!historyResult) return null

    const previousHistory = attemptHistorySnapshots.get(
      sessionAtEntry.moduleId
    )
    let candidates = historyResult.rawAttempts

    if (previousHistory) {
      const previousAttempts = previousHistory.rawAttempts

      if (
        historyResult.rawAttempts.length < previousAttempts.length ||
        historyResult.rawAttempts.length > previousAttempts.length + 1 ||
        !previousAttempts.every((attempt, index) =>
          arePlainValuesEqual(
            attempt,
            historyResult.rawAttempts[index]
          )
        )
      ) {
        return null
      }

      candidates = historyResult.rawAttempts.slice(
        previousAttempts.length
      )
    }

    const matches = candidates
      .map((attempt) => readReconciledCompletedTestAttempt({
        attempt,
        sessionSnapshot: sessionAtEntry,
        solutionSnapshot: solutionAtEntry,
        submissionSnapshot,
      }))
      .filter(Boolean)

    if (matches.length > 1) return null

    const historySnapshot = createFrozenSnapshot({
      rawAttempts: historyResult.rawAttempts,
      attempts: historyResult.attempts,
    })

    if (!historySnapshot) return null

    return {
      completedResult: matches[0] ?? null,
      historySnapshot,
      attempts: historyResult.attempts,
    }
  }

  function finishCompletedModuleTest(
    completedResult,
    reconciliation = null
  ) {
    const completedModuleId = completedResult.historyAttempt.moduleId
    const historyAttemptSnapshot = createFrozenSnapshot(
      completedResult.historyAttempt
    )

    if (!historyAttemptSnapshot) return false

    if (reconciliation?.historySnapshot) {
      attemptHistorySnapshots.set(
        completedModuleId,
        reconciliation.historySnapshot
      )
      pendingAttemptHistoryAppendSnapshots.delete(completedModuleId)
      testState = {
        ...testState,
        history: {
          phase: 'ready',
          attempts: reconciliation.attempts.map(
            (attempt) => ({ ...attempt })
          ),
          errorMessage: '',
        },
      }
    } else {
      const pendingAppends =
        pendingAttemptHistoryAppendSnapshots.get(completedModuleId) ?? []
      pendingAttemptHistoryAppendSnapshots.set(
        completedModuleId,
        deepFreezeData([...pendingAppends, historyAttemptSnapshot])
      )
    }

    resetActiveTestSession()
    testState = {
      ...testState,
      runner: {
        phase: 'completed',
        questionCount: completedResult.viewResult.totalQuestionCount,
        testSession: null,
        answers: [],
        retryPending: false,
        errorMessage: '',
        statusMessage: 'Der lokale Modultest wurde ausgewertet.',
        cancelConfirmation: false,
        result: completedResult.viewResult,
      },
    }
    render({ type: 'testResultHeading' })

    if (
      !reconciliation &&
      viewState.selectedModuleId === completedModuleId
    ) {
      loadAttemptHistory({ type: 'testResultHeading' })
    }

    return true
  }

  function releaseMissingTestSession(reconciliation = null) {
    if (reconciliation?.historySnapshot) {
      const moduleId = activeTestSessionSnapshot?.moduleId

      if (moduleId) {
        attemptHistorySnapshots.set(
          moduleId,
          reconciliation.historySnapshot
        )
        pendingAttemptHistoryAppendSnapshots.delete(moduleId)
      }

      testState = {
        ...testState,
        history: {
          phase: 'ready',
          attempts: reconciliation.attempts.map(
            (attempt) => ({ ...attempt })
          ),
          errorMessage: '',
        },
      }
    }

    resetActiveTestSession()
    testState = {
      ...testState,
      runner: {
        ...createInitialTestState().runner,
        questionCount: testBankSnapshot
          ? testBankSnapshot.questions.filter(
              (question) =>
                question.moduleId === viewState.selectedModuleId
            ).length
          : 0,
        statusMessage: TEST_SESSION_RELEASED_MESSAGE,
      },
    }
    render({ type: 'testStart' })
  }

  function submitModuleTest() {
    if (
      testState.runner.phase !== 'active' ||
      testState.runner.cancelConfirmation ||
      !activeTestSessionSnapshot ||
      !activeTestSolutionSnapshot
    ) {
      return
    }

    let submissionSnapshot = testSubmissionTargetSnapshot

    if (!testState.runner.retryPending) {
      submissionSnapshot = createSubmissionSnapshot(
        activeTestSessionSnapshot,
        testState.runner.answers
      )

      if (!submissionSnapshot) {
        const firstUnanswered = testState.runner.answers.find(
          (answer) => !isTrimmedEntityId(answer.selectedOptionId)
        )
        testState = {
          ...testState,
          runner: {
            ...testState.runner,
            errorMessage:
              'Bitte beantworte jede Testfrage, bevor du den Test auswertest.',
            statusMessage: '',
          },
        }
        render(
          firstUnanswered
            ? {
                type: 'testAnswer',
                questionId: firstUnanswered.questionId,
              }
            : { type: 'testSubmissionAlert' }
        )
        return
      }

      testSubmissionTargetSnapshot = submissionSnapshot
    }

    if (
      !submissionSnapshot ||
      submissionSnapshot.testSessionId !==
        activeTestSessionSnapshot.id
    ) {
      return
    }

    const sessionAtEntry = activeTestSessionSnapshot
    const solutionAtEntry = activeTestSolutionSnapshot
    testState = {
      ...testState,
      runner: {
        ...testState.runner,
        phase: 'submitting',
        errorMessage: '',
        statusMessage: 'Der lokale Modultest wird ausgewertet.',
        cancelConfirmation: false,
      },
    }
    render()

    let result = null

    try {
      result = learningTestService?.submitModuleTest?.({
        testSessionId: submissionSnapshot.payload.testSessionId,
        answers: submissionSnapshot.payload.answers.map((answer) => ({
          questionId: answer.questionId,
          selectedOptionId: answer.selectedOptionId,
        })),
      })
    } catch {
      result = null
    }

    if (
      activeTestSessionSnapshot !== sessionAtEntry ||
      activeTestSolutionSnapshot !== solutionAtEntry ||
      testSubmissionTargetSnapshot !== submissionSnapshot
    ) {
      testState = {
        ...testState,
        runner: {
          ...testState.runner,
          phase: 'active',
          retryPending: true,
          errorMessage: TEST_RESULT_ERROR_MESSAGE,
          statusMessage: '',
        },
      }
      render({ type: 'testSubmissionAlert' })
      return
    }

    const completedResult = readCompletedTestResult({
      result,
      sessionSnapshot: sessionAtEntry,
      solutionSnapshot: solutionAtEntry,
      submissionSnapshot,
    })

    if (completedResult) {
      if (finishCompletedModuleTest(completedResult)) return

      testState = {
        ...testState,
        runner: {
          ...testState.runner,
          phase: 'active',
          retryPending: true,
          errorMessage: TEST_RESULT_ERROR_MESSAGE,
          statusMessage: '',
        },
      }
      render({ type: 'testSubmissionAlert' })
      return
    }

    const failure = readTestOperationFailure(result)

    if (isMissingTestSessionFailure(failure)) {
      const reconciliation = reconcilePersistedTestSubmission(
        sessionAtEntry,
        solutionAtEntry,
        submissionSnapshot
      )

      if (
        reconciliation?.completedResult &&
        finishCompletedModuleTest(
          reconciliation.completedResult,
          reconciliation
        )
      ) {
        return
      }

      releaseMissingTestSession(reconciliation)
      return
    }

    const malformedSuccess = (() => {
      const snapshot = snapshotPlainData(result)
      return snapshot.ok && snapshot.value?.ok === true
    })()

    if (malformedSuccess) {
      const reconciliation = reconcilePersistedTestSubmission(
        sessionAtEntry,
        solutionAtEntry,
        submissionSnapshot
      )

      if (
        reconciliation?.completedResult &&
        finishCompletedModuleTest(
          reconciliation.completedResult,
          reconciliation
        )
      ) {
        return
      }
    }

    if (isEvaluationFailure(failure)) {
      testSubmissionTargetSnapshot = null
    }

    testState = {
      ...testState,
      runner: {
        ...testState.runner,
        phase: 'active',
        retryPending: !isEvaluationFailure(failure),
        errorMessage: malformedSuccess
          ? TEST_RESULT_ERROR_MESSAGE
          : TEST_SUBMISSION_ERROR_MESSAGE,
        statusMessage: '',
        cancelConfirmation: false,
      },
    }
    render({ type: 'testSubmissionAlert' })
  }

  function openTestCancelConfirmation() {
    if (
      testState.runner.phase !== 'active' ||
      !activeTestSessionSnapshot
    ) {
      return
    }

    const targetSnapshot = createFrozenSnapshot({
      moduleId: activeTestSessionSnapshot.moduleId,
      testSessionId: activeTestSessionSnapshot.id,
    })
    if (!targetSnapshot) return

    testCancelTargetSnapshot = targetSnapshot
    testState = {
      ...testState,
      runner: {
        ...testState.runner,
        cancelConfirmation: true,
        errorMessage: '',
        statusMessage: '',
      },
    }
    render({ type: 'testCancelConfirmation' })
  }

  function continueModuleTest() {
    if (
      testState.runner.phase !== 'active' ||
      !testState.runner.cancelConfirmation
    ) {
      return
    }

    testCancelTargetSnapshot = null
    testState = {
      ...testState,
      runner: {
        ...testState.runner,
        cancelConfirmation: false,
        errorMessage: '',
      },
    }
    render({ type: 'testRunnerHeading' })
  }

  function confirmModuleTestCancel() {
    const targetSnapshot = testCancelTargetSnapshot
    const sessionAtEntry = activeTestSessionSnapshot
    const solutionAtEntry = activeTestSolutionSnapshot
    const submissionAtEntry = testSubmissionTargetSnapshot

    if (
      testState.runner.phase !== 'active' ||
      !testState.runner.cancelConfirmation ||
      !targetSnapshot ||
      !sessionAtEntry ||
      targetSnapshot.moduleId !== sessionAtEntry.moduleId ||
      targetSnapshot.testSessionId !== sessionAtEntry.id
    ) {
      return
    }

    testState = {
      ...testState,
      runner: {
        ...testState.runner,
        phase: 'cancelling',
        errorMessage: '',
        statusMessage: 'Die lokale Testsession wird abgebrochen.',
      },
    }
    render()

    let result = null

    try {
      result = learningTestService?.cancelModuleTest?.({
        testSessionId: targetSnapshot.testSessionId,
      })
    } catch {
      result = null
    }

    if (
      activeTestSessionSnapshot !== sessionAtEntry ||
      activeTestSolutionSnapshot !== solutionAtEntry ||
      testSubmissionTargetSnapshot !== submissionAtEntry ||
      testCancelTargetSnapshot !== targetSnapshot
    ) {
      testState = {
        ...testState,
        runner: {
          ...testState.runner,
          phase: 'active',
          cancelConfirmation: true,
          errorMessage: TEST_CANCEL_ERROR_MESSAGE,
          statusMessage: '',
        },
      }
      render({ type: 'testCancelConfirmation' })
      return
    }

    const resultSnapshot = snapshotPlainData(result)
    const isValidSuccess = (
      resultSnapshot.ok &&
      hasExactProperties(resultSnapshot.value, [
        'ok',
        'status',
        'changed',
      ]) &&
      resultSnapshot.value.ok === true &&
      resultSnapshot.value.status === 'testCancelled' &&
      resultSnapshot.value.changed === true
    )

    if (!isValidSuccess) {
      const failure = readTestOperationFailure(result)

      if (isPendingTestSubmissionConflict(failure)) {
        testCancelTargetSnapshot = null
        testState = {
          ...testState,
          runner: {
            ...testState.runner,
            phase: 'active',
            retryPending: true,
            cancelConfirmation: false,
            errorMessage: TEST_SUBMISSION_ERROR_MESSAGE,
            statusMessage: '',
          },
        }
        render({ type: 'testSubmissionAlert' })
        return
      }

      if (isMissingTestSessionFailure(failure)) {
        const reconciliation = reconcilePersistedTestSubmission(
          sessionAtEntry,
          solutionAtEntry,
          submissionAtEntry
        )

        if (
          reconciliation?.completedResult &&
          finishCompletedModuleTest(
            reconciliation.completedResult,
            reconciliation
          )
        ) {
          return
        }

        releaseMissingTestSession(reconciliation)
        return
      }

      testState = {
        ...testState,
        runner: {
          ...testState.runner,
          phase: 'active',
          cancelConfirmation: true,
          errorMessage: TEST_CANCEL_ERROR_MESSAGE,
          statusMessage: '',
        },
      }
      render({ type: 'testCancelConfirmation' })
      return
    }

    resetActiveTestSession()
    testState = {
      ...testState,
      runner: {
        ...createInitialTestState().runner,
        questionCount: testBankSnapshot
          ? testBankSnapshot.questions.filter(
              (question) => question.moduleId === viewState.selectedModuleId
            ).length
          : 0,
        statusMessage: 'Die lokale Testsession wurde abgebrochen.',
      },
    }
    render({ type: 'testStart' })
  }

  function updateFormField(fieldName, value) {
    if (
      !canUseReadyView() ||
      !viewState.form ||
      !FORM_FIELDS[viewState.form.type]?.includes(fieldName) ||
      typeof value !== 'string'
    ) return

    const hadFieldError = Object.hasOwn(
      viewState.form.fieldErrors,
      fieldName
    )
    const fieldErrors = { ...viewState.form.fieldErrors }
    delete fieldErrors[fieldName]

    viewState = {
      ...viewState,
      form: {
        ...viewState.form,
        values: {
          ...viewState.form.values,
          [fieldName]: value,
        },
        fieldErrors,
        errorMessage: hadFieldError ? '' : viewState.form.errorMessage,
      },
    }

    if (hadFieldError) {
      render({ type: 'formField', fieldName })
    }
  }

  function cancelForm() {
    if (!canUseReadyView() || !viewState.form) return

    const cancelledForm = cloneForm(viewState.form)
    viewState = {
      ...viewState,
      form: null,
      errorMessage: '',
    }
    render({
      type: 'formTrigger',
      formType: cancelledForm.type,
      moduleId: cancelledForm.moduleId,
      chapterId: cancelledForm.chapterId,
      learningNodeId: cancelledForm.learningNodeId,
    })
  }

  function completeSuccessfulMutation(form, result) {
    let nextState = {
      ...viewState,
      phase: getReadyPhase(result.hub),
      form: null,
      statusMessage: SUCCESS_MESSAGES[form.type],
      errorMessage: '',
    }

    if (
      form.type === FORM_TYPES.ADD_CHAPTER &&
      isEntityId(result.createdChapter?.id)
    ) {
      nextState.expandedChapterIds = [
        ...new Set([
          ...nextState.expandedChapterIds,
          result.createdChapter.id,
        ]),
      ]
    }

    if (
      form.type === FORM_TYPES.ADD_LEARNING_NODE &&
      isEntityId(result.createdLearningNode?.id)
    ) {
      nextState.expandedChapterIds = [
        ...new Set([...nextState.expandedChapterIds, form.chapterId]),
      ]
      nextState.selectedLearningNodeId = result.createdLearningNode.id
    }

    nextState = reconcileStateWithHub(nextState, result.hub)
    viewState = nextState

    if (
      artifactStoreSnapshot &&
      !isArtifactStoreForHub(artifactStoreSnapshot, result.hub)
    ) {
      artifactStoreSnapshot = null
      artifactTargetSnapshot = null
      resumeArtifactEditingAfterClear = false
      artifactState = {
        ...createInitialArtifactState(),
        phase: 'unavailable',
        errorMessage: ARTIFACT_LOAD_ERROR_MESSAGE,
      }
    }

    if (
      [FORM_TYPES.CREATE_MODULE, FORM_TYPES.ADD_CHAPTER].includes(form.type)
    ) {
      viewState = {
        ...viewState,
        progress: createInitialProgressState(),
      }
      render()
      finishProgressLoading('stale')
    }

    render({ type: 'status' })
  }

  function submitForm(submittedValues) {
    if (
      !canUseReadyView() ||
      !viewState.form ||
      viewState.form.isSubmitting
    ) return

    const form = cloneForm(viewState.form)
    const submission = getSubmission(form, submittedValues)
    if (!submission) return

    const fieldErrors = getRequiredFieldErrors(
      submission.values,
      FORM_FIELDS[form.type]
    )

    if (Object.keys(fieldErrors).length > 0) {
      viewState = {
        ...viewState,
        form: {
          ...form,
          values: submission.values,
          fieldErrors,
          errorMessage: 'Bitte korrigiere die markierten Felder.',
        },
      }
      render({
        type: 'formField',
        fieldName: getFirstFieldError(fieldErrors, form.type),
      })
      return
    }

    viewState = {
      ...viewState,
      phase: 'mutating',
      statusMessage: '',
      errorMessage: '',
      form: {
        ...form,
        values: submission.values,
        fieldErrors: {},
        errorMessage: '',
        isSubmitting: true,
      },
    }
    render()

    let result
    const serviceMethod = SERVICE_METHODS[form.type]

    try {
      result = learningHubService?.[serviceMethod]?.({
        ...submission.serviceInput,
      })
    } catch {
      result = null
    }

    if (
      result?.ok === true &&
      result.status === SUCCESS_STATUSES[form.type] &&
      isHubForView(result.hub)
    ) {
      completeSuccessfulMutation(form, result)
      return
    }

    const serviceFieldErrors = getServiceFieldErrors(result, form.type)
    const firstInvalidField = getFirstFieldError(
      serviceFieldErrors,
      form.type
    )
    viewState = {
      ...viewState,
      phase: getReadyPhase(viewState.hub),
      form: {
        ...form,
        values: submission.values,
        fieldErrors: serviceFieldErrors,
        errorMessage: getMutationErrorMessage(result),
        isSubmitting: false,
      },
    }
    render(
      firstInvalidField
        ? { type: 'formField', fieldName: firstInvalidField }
        : { type: 'formAlert' }
    )
  }

  function open() {
    if (isActive) return

    isActive = true
    loadHub()
  }

  function close() {
    if (isActive && blockActiveTestTransition()) {
      return false
    }

    if (isActive && blockDirtyQuestionTransition()) {
      return false
    }

    if (
      isActive &&
      (
        artifactState.phase === 'mutating' ||
        artifactState.mode === 'confirmClear'
      )
    ) {
      render({
        type: artifactState.mode === 'confirmClear'
          ? 'artifactConfirmation'
          : 'artifactAlert',
        artifactType: artifactState.activeType,
      })
      return false
    }

    if (isActive && blockDirtyArtifactTransition()) {
      return false
    }

    isActive = false
    cancelPendingLoad()
    viewState = createInitialState()
    artifactState = createInitialArtifactState()
    artifactStoreSnapshot = null
    artifactTargetSnapshot = null
    resumeArtifactEditingAfterClear = false
    resetPrivateTestState()
    learningHubView?.unmount?.()
    return true
  }

  return Object.freeze({ open, close })
}
