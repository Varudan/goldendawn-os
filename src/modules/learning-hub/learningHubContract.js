export const LEARNING_HUB_SCHEMA_VERSION = 2

export const LEARNING_HUB_DATA_ORIGINS = Object.freeze([
  'synthetic',
  'private',
])

export const LEARNING_HUB_ERROR_CODES = Object.freeze({
  INVALID_LEARNING_HUB: 'invalidLearningHub',
  UNSUPPORTED_SCHEMA_VERSION: 'unsupportedSchemaVersion',
  INVALID_DATA_ORIGIN: 'invalidDataOrigin',
  INVALID_MODULES: 'invalidModules',
  INVALID_MODULE: 'invalidModule',
  MODULE_REQUIRES_CHAPTER: 'moduleRequiresChapter',
  INVALID_CHAPTERS: 'invalidChapters',
  INVALID_CHAPTER: 'invalidChapter',
  INVALID_LEARNING_NODES: 'invalidLearningNodes',
  INVALID_LEARNING_NODE: 'invalidLearningNode',
  INVALID_ID: 'invalidId',
  DUPLICATE_ID: 'duplicateId',
  INVALID_TITLE: 'invalidTitle',
  INVALID_CONTENT: 'invalidContent',
  INVALID_POSITION: 'invalidPosition',
  DUPLICATE_SIBLING_POSITION: 'duplicateSiblingPosition',
})

function isObjectRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isTrimmedNonEmptyString(value) {
  return typeof value === 'string' && value.length > 0 && value === value.trim()
}

function addError(errors, code, path, message) {
  errors.push({ code, path, message })
}

function validateIdentity(entity, path, context) {
  if (!isTrimmedNonEmptyString(entity.id)) {
    addError(
      context.errors,
      LEARNING_HUB_ERROR_CODES.INVALID_ID,
      `${path}.id`,
      'Die ID muss eine nicht leere, getrimmte Zeichenfolge sein.'
    )
  } else if (context.ids.has(entity.id)) {
    addError(
      context.errors,
      LEARNING_HUB_ERROR_CODES.DUPLICATE_ID,
      `${path}.id`,
      `Die ID ${entity.id} kommt im LearningHub mehrfach vor.`
    )
  } else {
    context.ids.add(entity.id)
  }

  if (!isTrimmedNonEmptyString(entity.title)) {
    addError(
      context.errors,
      LEARNING_HUB_ERROR_CODES.INVALID_TITLE,
      `${path}.title`,
      'Der Titel muss eine nicht leere, getrimmte Zeichenfolge sein.'
    )
  }
}

function validatePosition(entity, path, errors) {
  if (!Number.isInteger(entity.position) || entity.position < 1) {
    addError(
      errors,
      LEARNING_HUB_ERROR_CODES.INVALID_POSITION,
      `${path}.position`,
      'Die Position muss eine positive Ganzzahl sein.'
    )
  }
}

function validateSiblingPositions(entries, path, errors) {
  const positions = new Set()

  entries.forEach((entry, index) => {
    if (
      !isObjectRecord(entry) ||
      !Number.isInteger(entry.position) ||
      entry.position < 1
    ) return

    if (positions.has(entry.position)) {
      addError(
        errors,
        LEARNING_HUB_ERROR_CODES.DUPLICATE_SIBLING_POSITION,
        `${path}[${index}].position`,
        'Geschwister müssen eindeutige Positionen besitzen.'
      )
    } else {
      positions.add(entry.position)
    }
  })
}

function validateLearningNode(learningNode, path, context) {
  validateIdentity(learningNode, path, context)
  validatePosition(learningNode, path, context.errors)

  if (!isTrimmedNonEmptyString(learningNode.content)) {
    addError(
      context.errors,
      LEARNING_HUB_ERROR_CODES.INVALID_CONTENT,
      `${path}.content`,
      'Der Inhalt muss eine nicht leere, getrimmte Zeichenfolge sein.'
    )
  }
}

function validateChapter(chapter, path, context) {
  validateIdentity(chapter, path, context)
  validatePosition(chapter, path, context.errors)

  if (!Array.isArray(chapter.learningNodes)) {
    addError(
      context.errors,
      LEARNING_HUB_ERROR_CODES.INVALID_LEARNING_NODES,
      `${path}.learningNodes`,
      'learningNodes muss ein Array sein.'
    )
    return
  }

  for (let index = 0; index < chapter.learningNodes.length; index += 1) {
    const learningNode = chapter.learningNodes[index]
    const learningNodePath = `${path}.learningNodes[${index}]`
    if (!isObjectRecord(learningNode)) {
      addError(
        context.errors,
        LEARNING_HUB_ERROR_CODES.INVALID_LEARNING_NODE,
        learningNodePath,
        'Jeder LearningNode muss ein Objekt sein.'
      )
      continue
    }
    validateLearningNode(learningNode, learningNodePath, context)
  }

  validateSiblingPositions(
    chapter.learningNodes,
    `${path}.learningNodes`,
    context.errors
  )
}

function validateModule(learningModule, path, context) {
  validateIdentity(learningModule, path, context)
  validatePosition(learningModule, path, context.errors)

  if (!Array.isArray(learningModule.chapters)) {
    addError(
      context.errors,
      LEARNING_HUB_ERROR_CODES.INVALID_CHAPTERS,
      `${path}.chapters`,
      'chapters muss ein Array sein.'
    )
    return
  }

  if (learningModule.chapters.length === 0) {
    addError(
      context.errors,
      LEARNING_HUB_ERROR_CODES.MODULE_REQUIRES_CHAPTER,
      `${path}.chapters`,
      'Ein persistiertes LearningModule benötigt mindestens ein LearningChapter.'
    )
  }

  for (let index = 0; index < learningModule.chapters.length; index += 1) {
    const chapter = learningModule.chapters[index]
    const chapterPath = `${path}.chapters[${index}]`
    if (!isObjectRecord(chapter)) {
      addError(
        context.errors,
        LEARNING_HUB_ERROR_CODES.INVALID_CHAPTER,
        chapterPath,
        'Jedes LearningChapter muss ein Objekt sein.'
      )
      continue
    }
    validateChapter(chapter, chapterPath, context)
  }

  validateSiblingPositions(
    learningModule.chapters,
    `${path}.chapters`,
    context.errors
  )
}

export function validateLearningHub(learningHub) {
  const errors = []
  const context = { errors, ids: new Set() }

  if (!isObjectRecord(learningHub)) {
    addError(
      errors,
      LEARNING_HUB_ERROR_CODES.INVALID_LEARNING_HUB,
      '$',
      'Der LearningHub muss ein Objekt sein.'
    )
    return { ok: false, errors }
  }

  if (learningHub.schemaVersion !== LEARNING_HUB_SCHEMA_VERSION) {
    addError(
      errors,
      LEARNING_HUB_ERROR_CODES.UNSUPPORTED_SCHEMA_VERSION,
      '$.schemaVersion',
      'Die LearningHub-Schemaversion wird nicht unterstützt.'
    )
  }

  if (!LEARNING_HUB_DATA_ORIGINS.includes(learningHub.dataOrigin)) {
    addError(
      errors,
      LEARNING_HUB_ERROR_CODES.INVALID_DATA_ORIGIN,
      '$.dataOrigin',
      'dataOrigin muss synthetic oder private sein.'
    )
  }

  if (!Array.isArray(learningHub.modules)) {
    addError(
      errors,
      LEARNING_HUB_ERROR_CODES.INVALID_MODULES,
      '$.modules',
      'modules muss ein Array sein.'
    )
  } else {
    for (let index = 0; index < learningHub.modules.length; index += 1) {
      const learningModule = learningHub.modules[index]
      const modulePath = `$.modules[${index}]`
      if (!isObjectRecord(learningModule)) {
        addError(
          errors,
          LEARNING_HUB_ERROR_CODES.INVALID_MODULE,
          modulePath,
          'Jedes LearningModule muss ein Objekt sein.'
        )
        continue
      }
      validateModule(learningModule, modulePath, context)
    }

    validateSiblingPositions(learningHub.modules, '$.modules', errors)
  }

  return errors.length === 0 ? { ok: true, errors: [] } : { ok: false, errors }
}
