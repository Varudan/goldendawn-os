import {
  LEARNING_HUB_SCHEMA_VERSION,
  validateLearningHub,
} from '../modules/learning-hub/learningHubContract.js'

const LEARNING_HUB_INPUT_LIMITS = Object.freeze({
  title: 120,
  content: 10000,
})

const LEARNING_HUB_ID_PREFIXES = Object.freeze({
  module: 'learning-module',
  chapter: 'learning-chapter',
  learningNode: 'learning-node',
})

const MAX_ID_GENERATION_ATTEMPTS = 5

function isObjectRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function createEmptyPrivateHub() {
  return {
    schemaVersion: LEARNING_HUB_SCHEMA_VERSION,
    dataOrigin: 'private',
    modules: [],
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

function createFailure(status, code, message, learningHub = null) {
  return {
    ok: false,
    status,
    hub: learningHub ? cloneHub(learningHub) : null,
    error: {
      code,
      message,
    },
  }
}

function createInputFailure(fieldErrors, learningHub) {
  return {
    ok: false,
    status: 'validationFailed',
    hub: cloneHub(learningHub),
    error: {
      code: 'invalidLearningHubInput',
      message: 'Bitte korrigiere die markierten Felder.',
      fieldErrors: { ...fieldErrors },
    },
  }
}

function forwardStorageFailure(
  storageResult,
  learningHub = null,
  fallbackStatus = 'storageFailed',
  fallbackCode = 'unexpectedStorageResult',
  fallbackMessage = 'Die LearningHub-Daten konnten nicht verarbeitet werden.'
) {
  if (
    storageResult?.ok === false &&
    isNonEmptyString(storageResult.status) &&
    isNonEmptyString(storageResult.error?.code) &&
    isNonEmptyString(storageResult.error?.message)
  ) {
    return createFailure(
      storageResult.status,
      storageResult.error.code,
      storageResult.error.message,
      learningHub
    )
  }

  return createFailure(
    fallbackStatus,
    fallbackCode,
    fallbackMessage,
    learningHub
  )
}

function validateStoredHub(learningHub) {
  const validationResult = validateLearningHub(learningHub)

  if (!validationResult.ok) {
    return createFailure(
      'invalidStoredData',
      'invalidStoredLearningHub',
      'Die gespeicherten LearningHub-Daten sind ungültig.'
    )
  }

  if (learningHub.dataOrigin !== 'private') {
    return createFailure(
      'invalidStoredData',
      'privateLearningHubRequired',
      'Der private LearningHub-Speicher enthält Daten mit ungültiger Herkunft.'
    )
  }

  return { ok: true }
}

function validateTitle(value, fieldName, fieldErrors) {
  const normalizedValue = typeof value === 'string' ? value.trim() : ''

  if (!normalizedValue) {
    fieldErrors[fieldName] = 'Bitte gib einen Titel ein.'
  } else if (normalizedValue.length > LEARNING_HUB_INPUT_LIMITS.title) {
    fieldErrors[fieldName] = 'Der Titel darf höchstens 120 Zeichen lang sein.'
  }

  return normalizedValue
}

function validateContent(value, fieldErrors) {
  const normalizedValue = typeof value === 'string' ? value.trim() : ''

  if (!normalizedValue) {
    fieldErrors.content = 'Bitte gib einen LearningNode-Inhalt ein.'
  } else if (normalizedValue.length > LEARNING_HUB_INPUT_LIMITS.content) {
    fieldErrors.content =
      'Der LearningNode-Inhalt darf höchstens 10.000 Zeichen lang sein.'
  }

  return normalizedValue
}

function validateTargetId(value, fieldName, fieldErrors) {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value !== value.trim()
  ) {
    fieldErrors[fieldName] = 'Die ID muss eine nicht leere, getrimmte Zeichenfolge sein.'
    return ''
  }

  return value
}

function validateCreateModuleInput(input) {
  const moduleInput = isObjectRecord(input) ? input : {}
  const fieldErrors = {}

  return {
    values: {
      title: validateTitle(moduleInput.title, 'title', fieldErrors),
      firstChapterTitle: validateTitle(
        moduleInput.firstChapterTitle,
        'firstChapterTitle',
        fieldErrors
      ),
    },
    fieldErrors,
  }
}

function validateModuleTitleInput(input) {
  const moduleInput = isObjectRecord(input) ? input : {}
  const fieldErrors = {}

  return {
    values: {
      moduleId: validateTargetId(
        moduleInput.moduleId,
        'moduleId',
        fieldErrors
      ),
      title: validateTitle(moduleInput.title, 'title', fieldErrors),
    },
    fieldErrors,
  }
}

function validateChapterTitleInput(input, includeChapterId) {
  const chapterInput = isObjectRecord(input) ? input : {}
  const fieldErrors = {}
  const values = {
    moduleId: validateTargetId(
      chapterInput.moduleId,
      'moduleId',
      fieldErrors
    ),
    title: validateTitle(chapterInput.title, 'title', fieldErrors),
  }

  if (includeChapterId) {
    values.chapterId = validateTargetId(
      chapterInput.chapterId,
      'chapterId',
      fieldErrors
    )
  }

  return { values, fieldErrors }
}

function validateLearningNodeInput(input, includeLearningNodeId) {
  const learningNodeInput = isObjectRecord(input) ? input : {}
  const fieldErrors = {}
  const values = {
    moduleId: validateTargetId(
      learningNodeInput.moduleId,
      'moduleId',
      fieldErrors
    ),
    chapterId: validateTargetId(
      learningNodeInput.chapterId,
      'chapterId',
      fieldErrors
    ),
    title: validateTitle(learningNodeInput.title, 'title', fieldErrors),
    content: validateContent(learningNodeInput.content, fieldErrors),
  }

  if (includeLearningNodeId) {
    values.learningNodeId = validateTargetId(
      learningNodeInput.learningNodeId,
      'learningNodeId',
      fieldErrors
    )
  }

  return { values, fieldErrors }
}

function collectHubIds(learningHub) {
  const ids = new Set()

  learningHub.modules.forEach((learningModule) => {
    ids.add(learningModule.id)

    learningModule.chapters.forEach((chapter) => {
      ids.add(chapter.id)
      chapter.learningNodes.forEach((learningNode) => {
        ids.add(learningNode.id)
      })
    })
  })

  return ids
}

function isValidGeneratedId(generatedId) {
  return (
    typeof generatedId === 'string' &&
    generatedId.length > 0 &&
    generatedId === generatedId.trim()
  )
}

function generateUniqueId(generateLearningHubId, entityType, reservedIds) {
  for (
    let attempt = 0;
    attempt < MAX_ID_GENERATION_ATTEMPTS;
    attempt += 1
  ) {
    let generatedId

    try {
      generatedId = generateLearningHubId(entityType)
    } catch {
      continue
    }

    if (isValidGeneratedId(generatedId) && !reservedIds.has(generatedId)) {
      reservedIds.add(generatedId)
      return generatedId
    }
  }

  return null
}

function getNextPosition(siblings) {
  let highestPosition = 0

  siblings.forEach((sibling) => {
    if (sibling.position > highestPosition) {
      highestPosition = sibling.position
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

function findChapterLocation(learningHub, chapterId) {
  for (
    let moduleIndex = 0;
    moduleIndex < learningHub.modules.length;
    moduleIndex += 1
  ) {
    const chapterIndex = learningHub.modules[moduleIndex].chapters.findIndex(
      (chapter) => chapter.id === chapterId
    )

    if (chapterIndex !== -1) {
      return { moduleIndex, chapterIndex }
    }
  }

  return null
}

function findLearningNodeLocation(learningHub, learningNodeId) {
  for (
    let moduleIndex = 0;
    moduleIndex < learningHub.modules.length;
    moduleIndex += 1
  ) {
    const chapters = learningHub.modules[moduleIndex].chapters

    for (
      let chapterIndex = 0;
      chapterIndex < chapters.length;
      chapterIndex += 1
    ) {
      const learningNodeIndex = chapters[chapterIndex].learningNodes.findIndex(
        (learningNode) => learningNode.id === learningNodeId
      )

      if (learningNodeIndex !== -1) {
        return { moduleIndex, chapterIndex, learningNodeIndex }
      }
    }
  }

  return null
}

function generateDefaultLearningHubId(entityType) {
  const prefix = LEARNING_HUB_ID_PREFIXES[entityType]

  if (!prefix || typeof globalThis.crypto?.randomUUID !== 'function') {
    throw new Error('randomUUID unavailable')
  }

  return `${prefix}-${globalThis.crypto.randomUUID()}`
}

export function createLearningHubService({
  learningHubStorage,
  generateLearningHubId = generateDefaultLearningHubId,
} = {}) {
  function readHubState() {
    if (typeof learningHubStorage?.loadLearningHub !== 'function') {
      return createFailure(
        'unavailable',
        'learningHubStorageUnavailable',
        'Der LearningHub-Speicher ist nicht verfügbar.'
      )
    }

    let loadResult

    try {
      loadResult = learningHubStorage.loadLearningHub()
    } catch {
      return createFailure(
        'readFailed',
        'learningHubStorageReadFailed',
        'Die LearningHub-Daten konnten nicht gelesen werden.'
      )
    }

    if (loadResult?.ok === false) {
      return forwardStorageFailure(loadResult)
    }

    if (loadResult?.ok !== true) {
      return createFailure(
        'storageFailed',
        'unexpectedStorageResult',
        'Die LearningHub-Daten konnten nicht verarbeitet werden.'
      )
    }

    if (loadResult.status === 'missing') {
      return {
        ok: true,
        status: 'missing',
        hub: createEmptyPrivateHub(),
      }
    }

    if (loadResult.status !== 'found' || !isObjectRecord(loadResult.hub)) {
      return createFailure(
        'storageFailed',
        'unexpectedStorageResult',
        'Die LearningHub-Daten konnten nicht verarbeitet werden.'
      )
    }

    const storedHubValidation = validateStoredHub(loadResult.hub)

    if (!storedHubValidation.ok) {
      return storedHubValidation
    }

    return {
      ok: true,
      status: 'found',
      hub: cloneHub(loadResult.hub),
    }
  }

  function persistUpdatedHub(previousHub, updatedHub) {
    const validationResult = validateLearningHub(updatedHub)

    if (!validationResult.ok || updatedHub.dataOrigin !== 'private') {
      return createFailure(
        'validationFailed',
        'invalidLearningHubState',
        'Die LearningHub-Änderung ergibt keinen gültigen Gesamtzustand.',
        previousHub
      )
    }

    if (typeof learningHubStorage?.saveLearningHub !== 'function') {
      return createFailure(
        'unavailable',
        'learningHubStorageUnavailable',
        'Der LearningHub-Speicher ist nicht verfügbar.',
        previousHub
      )
    }

    let saveResult

    try {
      saveResult = learningHubStorage.saveLearningHub(cloneHub(updatedHub))
    } catch {
      return createFailure(
        'writeFailed',
        'learningHubStorageWriteFailed',
        'Die LearningHub-Änderung konnte nicht gespeichert werden.',
        previousHub
      )
    }

    if (saveResult?.ok === false) {
      return forwardStorageFailure(
        saveResult,
        previousHub,
        'writeFailed',
        'learningHubStorageWriteFailed',
        'Die LearningHub-Änderung konnte nicht gespeichert werden.'
      )
    }

    if (saveResult?.ok !== true) {
      return createFailure(
        'storageFailed',
        'unexpectedStorageResult',
        'Die LearningHub-Änderung konnte nicht gespeichert werden.',
        previousHub
      )
    }

    if (saveResult.status !== 'saved') {
      return createFailure(
        'storageFailed',
        'unexpectedStorageResult',
        'Die LearningHub-Änderung konnte nicht gespeichert werden.',
        previousHub
      )
    }

    return { ok: true }
  }

  function createGenerationFailure(previousHub, code, message) {
    return createFailure(
      'generationFailed',
      code,
      message,
      previousHub
    )
  }

  function getModuleTarget(learningHub, moduleId) {
    const moduleIndex = learningHub.modules.findIndex(
      (learningModule) => learningModule.id === moduleId
    )

    if (moduleIndex === -1) {
      return createFailure(
        'notFound',
        'moduleNotFound',
        'Das angeforderte LearningModule wurde nicht gefunden.',
        learningHub
      )
    }

    return { ok: true, moduleIndex }
  }

  function getChapterTarget(learningHub, moduleId, chapterId) {
    const moduleTarget = getModuleTarget(learningHub, moduleId)

    if (!moduleTarget.ok) {
      return moduleTarget
    }

    const chapterLocation = findChapterLocation(learningHub, chapterId)

    if (!chapterLocation) {
      return createFailure(
        'notFound',
        'chapterNotFound',
        'Das angeforderte LearningChapter wurde nicht gefunden.',
        learningHub
      )
    }

    if (chapterLocation.moduleIndex !== moduleTarget.moduleIndex) {
      return createFailure(
        'ownershipMismatch',
        'chapterModuleMismatch',
        'Das LearningChapter gehört nicht zum angegebenen LearningModule.',
        learningHub
      )
    }

    return {
      ok: true,
      moduleIndex: moduleTarget.moduleIndex,
      chapterIndex: chapterLocation.chapterIndex,
    }
  }

  function getLearningNodeTarget(
    learningHub,
    moduleId,
    chapterId,
    learningNodeId
  ) {
    const chapterTarget = getChapterTarget(
      learningHub,
      moduleId,
      chapterId
    )

    if (!chapterTarget.ok) {
      return chapterTarget
    }

    const learningNodeLocation = findLearningNodeLocation(
      learningHub,
      learningNodeId
    )

    if (!learningNodeLocation) {
      return createFailure(
        'notFound',
        'learningNodeNotFound',
        'Der angeforderte LearningNode wurde nicht gefunden.',
        learningHub
      )
    }

    if (
      learningNodeLocation.moduleIndex !== chapterTarget.moduleIndex ||
      learningNodeLocation.chapterIndex !== chapterTarget.chapterIndex
    ) {
      return createFailure(
        'ownershipMismatch',
        'learningNodeChapterMismatch',
        'Der LearningNode gehört nicht zum angegebenen LearningChapter.',
        learningHub
      )
    }

    return {
      ok: true,
      ...chapterTarget,
      learningNodeIndex: learningNodeLocation.learningNodeIndex,
    }
  }

  function loadHub() {
    const loadResult = readHubState()

    if (!loadResult.ok) {
      return loadResult
    }

    return {
      ok: true,
      status: loadResult.status === 'missing' ? 'empty' : 'loaded',
      initialized: false,
      hub: cloneHub(loadResult.hub),
    }
  }

  function createModule(input) {
    const loadResult = readHubState()

    if (!loadResult.ok) {
      return loadResult
    }

    const inputValidation = validateCreateModuleInput(input)

    if (Object.keys(inputValidation.fieldErrors).length > 0) {
      return createInputFailure(
        inputValidation.fieldErrors,
        loadResult.hub
      )
    }

    const reservedIds = collectHubIds(loadResult.hub)
    const moduleId = generateUniqueId(
      generateLearningHubId,
      'module',
      reservedIds
    )

    if (!moduleId) {
      return createGenerationFailure(
        loadResult.hub,
        'learningHubIdGenerationFailed',
        'Das LearningModule konnte nicht für die lokale Speicherung vorbereitet werden.'
      )
    }

    const chapterId = generateUniqueId(
      generateLearningHubId,
      'chapter',
      reservedIds
    )

    if (!chapterId) {
      return createGenerationFailure(
        loadResult.hub,
        'learningHubIdGenerationFailed',
        'Das erste LearningChapter konnte nicht für die lokale Speicherung vorbereitet werden.'
      )
    }

    const modulePosition = getNextPosition(loadResult.hub.modules)

    if (!modulePosition) {
      return createGenerationFailure(
        loadResult.hub,
        'learningHubPositionGenerationFailed',
        'Die nächste LearningModule-Position konnte nicht bestimmt werden.'
      )
    }

    const firstChapter = {
      id: chapterId,
      title: inputValidation.values.firstChapterTitle,
      position: 1,
      learningNodes: [],
    }
    const newModule = {
      id: moduleId,
      title: inputValidation.values.title,
      position: modulePosition,
      chapters: [firstChapter],
    }
    const updatedHub = {
      ...loadResult.hub,
      modules: [...loadResult.hub.modules, newModule],
    }
    const persistResult = persistUpdatedHub(loadResult.hub, updatedHub)

    if (!persistResult.ok) {
      return persistResult
    }

    return {
      ok: true,
      status: 'moduleCreated',
      createdModule: cloneModule(newModule),
      hub: cloneHub(updatedHub),
    }
  }

  function renameModule(input) {
    const loadResult = readHubState()

    if (!loadResult.ok) {
      return loadResult
    }

    const inputValidation = validateModuleTitleInput(input)

    if (Object.keys(inputValidation.fieldErrors).length > 0) {
      return createInputFailure(
        inputValidation.fieldErrors,
        loadResult.hub
      )
    }

    const moduleTarget = getModuleTarget(
      loadResult.hub,
      inputValidation.values.moduleId
    )

    if (!moduleTarget.ok) {
      return moduleTarget
    }

    const currentModule = loadResult.hub.modules[moduleTarget.moduleIndex]
    const renamedModule = {
      ...currentModule,
      title: inputValidation.values.title,
    }
    const updatedHub = {
      ...loadResult.hub,
      modules: loadResult.hub.modules.map((learningModule, moduleIndex) =>
        moduleIndex === moduleTarget.moduleIndex
          ? renamedModule
          : learningModule
      ),
    }
    const persistResult = persistUpdatedHub(loadResult.hub, updatedHub)

    if (!persistResult.ok) {
      return persistResult
    }

    return {
      ok: true,
      status: 'moduleRenamed',
      updatedModule: cloneModule(renamedModule),
      hub: cloneHub(updatedHub),
    }
  }

  function addChapter(input) {
    const loadResult = readHubState()

    if (!loadResult.ok) {
      return loadResult
    }

    const inputValidation = validateChapterTitleInput(input, false)

    if (Object.keys(inputValidation.fieldErrors).length > 0) {
      return createInputFailure(
        inputValidation.fieldErrors,
        loadResult.hub
      )
    }

    const moduleTarget = getModuleTarget(
      loadResult.hub,
      inputValidation.values.moduleId
    )

    if (!moduleTarget.ok) {
      return moduleTarget
    }

    const currentModule = loadResult.hub.modules[moduleTarget.moduleIndex]
    const chapterPosition = getNextPosition(currentModule.chapters)

    if (!chapterPosition) {
      return createGenerationFailure(
        loadResult.hub,
        'learningHubPositionGenerationFailed',
        'Die nächste LearningChapter-Position konnte nicht bestimmt werden.'
      )
    }

    const chapterId = generateUniqueId(
      generateLearningHubId,
      'chapter',
      collectHubIds(loadResult.hub)
    )

    if (!chapterId) {
      return createGenerationFailure(
        loadResult.hub,
        'learningHubIdGenerationFailed',
        'Das LearningChapter konnte nicht für die lokale Speicherung vorbereitet werden.'
      )
    }

    const newChapter = {
      id: chapterId,
      title: inputValidation.values.title,
      position: chapterPosition,
      learningNodes: [],
    }
    const updatedModule = {
      ...currentModule,
      chapters: [...currentModule.chapters, newChapter],
    }
    const updatedHub = {
      ...loadResult.hub,
      modules: loadResult.hub.modules.map((learningModule, moduleIndex) =>
        moduleIndex === moduleTarget.moduleIndex
          ? updatedModule
          : learningModule
      ),
    }
    const persistResult = persistUpdatedHub(loadResult.hub, updatedHub)

    if (!persistResult.ok) {
      return persistResult
    }

    return {
      ok: true,
      status: 'chapterAdded',
      createdChapter: cloneChapter(newChapter),
      hub: cloneHub(updatedHub),
    }
  }

  function renameChapter(input) {
    const loadResult = readHubState()

    if (!loadResult.ok) {
      return loadResult
    }

    const inputValidation = validateChapterTitleInput(input, true)

    if (Object.keys(inputValidation.fieldErrors).length > 0) {
      return createInputFailure(
        inputValidation.fieldErrors,
        loadResult.hub
      )
    }

    const chapterTarget = getChapterTarget(
      loadResult.hub,
      inputValidation.values.moduleId,
      inputValidation.values.chapterId
    )

    if (!chapterTarget.ok) {
      return chapterTarget
    }

    const currentModule = loadResult.hub.modules[chapterTarget.moduleIndex]
    const currentChapter = currentModule.chapters[chapterTarget.chapterIndex]
    const renamedChapter = {
      ...currentChapter,
      title: inputValidation.values.title,
    }
    const updatedModule = {
      ...currentModule,
      chapters: currentModule.chapters.map((chapter, chapterIndex) =>
        chapterIndex === chapterTarget.chapterIndex
          ? renamedChapter
          : chapter
      ),
    }
    const updatedHub = {
      ...loadResult.hub,
      modules: loadResult.hub.modules.map((learningModule, moduleIndex) =>
        moduleIndex === chapterTarget.moduleIndex
          ? updatedModule
          : learningModule
      ),
    }
    const persistResult = persistUpdatedHub(loadResult.hub, updatedHub)

    if (!persistResult.ok) {
      return persistResult
    }

    return {
      ok: true,
      status: 'chapterRenamed',
      updatedChapter: cloneChapter(renamedChapter),
      hub: cloneHub(updatedHub),
    }
  }

  function addLearningNode(input) {
    const loadResult = readHubState()

    if (!loadResult.ok) {
      return loadResult
    }

    const inputValidation = validateLearningNodeInput(input, false)

    if (Object.keys(inputValidation.fieldErrors).length > 0) {
      return createInputFailure(
        inputValidation.fieldErrors,
        loadResult.hub
      )
    }

    const chapterTarget = getChapterTarget(
      loadResult.hub,
      inputValidation.values.moduleId,
      inputValidation.values.chapterId
    )

    if (!chapterTarget.ok) {
      return chapterTarget
    }

    const currentModule = loadResult.hub.modules[chapterTarget.moduleIndex]
    const currentChapter = currentModule.chapters[chapterTarget.chapterIndex]
    const learningNodePosition = getNextPosition(
      currentChapter.learningNodes
    )

    if (!learningNodePosition) {
      return createGenerationFailure(
        loadResult.hub,
        'learningHubPositionGenerationFailed',
        'Die nächste LearningNode-Position konnte nicht bestimmt werden.'
      )
    }

    const learningNodeId = generateUniqueId(
      generateLearningHubId,
      'learningNode',
      collectHubIds(loadResult.hub)
    )

    if (!learningNodeId) {
      return createGenerationFailure(
        loadResult.hub,
        'learningHubIdGenerationFailed',
        'Der LearningNode konnte nicht für die lokale Speicherung vorbereitet werden.'
      )
    }

    const newLearningNode = {
      id: learningNodeId,
      title: inputValidation.values.title,
      content: inputValidation.values.content,
      position: learningNodePosition,
    }
    const updatedChapter = {
      ...currentChapter,
      learningNodes: [
        ...currentChapter.learningNodes,
        newLearningNode,
      ],
    }
    const updatedModule = {
      ...currentModule,
      chapters: currentModule.chapters.map((chapter, chapterIndex) =>
        chapterIndex === chapterTarget.chapterIndex
          ? updatedChapter
          : chapter
      ),
    }
    const updatedHub = {
      ...loadResult.hub,
      modules: loadResult.hub.modules.map((learningModule, moduleIndex) =>
        moduleIndex === chapterTarget.moduleIndex
          ? updatedModule
          : learningModule
      ),
    }
    const persistResult = persistUpdatedHub(loadResult.hub, updatedHub)

    if (!persistResult.ok) {
      return persistResult
    }

    return {
      ok: true,
      status: 'learningNodeAdded',
      createdLearningNode: cloneLearningNode(newLearningNode),
      hub: cloneHub(updatedHub),
    }
  }

  function updateLearningNode(input) {
    const loadResult = readHubState()

    if (!loadResult.ok) {
      return loadResult
    }

    const inputValidation = validateLearningNodeInput(input, true)

    if (Object.keys(inputValidation.fieldErrors).length > 0) {
      return createInputFailure(
        inputValidation.fieldErrors,
        loadResult.hub
      )
    }

    const learningNodeTarget = getLearningNodeTarget(
      loadResult.hub,
      inputValidation.values.moduleId,
      inputValidation.values.chapterId,
      inputValidation.values.learningNodeId
    )

    if (!learningNodeTarget.ok) {
      return learningNodeTarget
    }

    const currentModule =
      loadResult.hub.modules[learningNodeTarget.moduleIndex]
    const currentChapter =
      currentModule.chapters[learningNodeTarget.chapterIndex]
    const currentLearningNode =
      currentChapter.learningNodes[learningNodeTarget.learningNodeIndex]
    const updatedLearningNode = {
      ...currentLearningNode,
      title: inputValidation.values.title,
      content: inputValidation.values.content,
    }
    const updatedChapter = {
      ...currentChapter,
      learningNodes: currentChapter.learningNodes.map(
        (learningNode, learningNodeIndex) =>
          learningNodeIndex === learningNodeTarget.learningNodeIndex
            ? updatedLearningNode
            : learningNode
      ),
    }
    const updatedModule = {
      ...currentModule,
      chapters: currentModule.chapters.map((chapter, chapterIndex) =>
        chapterIndex === learningNodeTarget.chapterIndex
          ? updatedChapter
          : chapter
      ),
    }
    const updatedHub = {
      ...loadResult.hub,
      modules: loadResult.hub.modules.map((learningModule, moduleIndex) =>
        moduleIndex === learningNodeTarget.moduleIndex
          ? updatedModule
          : learningModule
      ),
    }
    const persistResult = persistUpdatedHub(loadResult.hub, updatedHub)

    if (!persistResult.ok) {
      return persistResult
    }

    return {
      ok: true,
      status: 'learningNodeUpdated',
      updatedLearningNode: cloneLearningNode(updatedLearningNode),
      hub: cloneHub(updatedHub),
    }
  }

  return Object.freeze({
    loadHub,
    createModule,
    renameModule,
    addChapter,
    renameChapter,
    addLearningNode,
    updateLearningNode,
  })
}
