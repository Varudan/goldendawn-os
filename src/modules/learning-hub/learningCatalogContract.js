export const LEARNING_CATALOG_SCHEMA_VERSION = 1

export const LEARNING_CATALOG_DATA_ORIGINS = Object.freeze([
  'synthetic',
  'private',
])

export const LEARNING_NODE_TYPES = Object.freeze([
  'chapter',
  'section',
  'subsection',
])

export const LEARNING_CATALOG_ERROR_CODES = Object.freeze({
  INVALID_CATALOG: 'invalidCatalog',
  UNSUPPORTED_SCHEMA_VERSION: 'unsupportedSchemaVersion',
  INVALID_DATA_ORIGIN: 'invalidDataOrigin',
  INVALID_COURSE: 'invalidCourse',
  INVALID_MODULES: 'invalidModules',
  INVALID_UNITS: 'invalidUnits',
  INVALID_LEARNING_NODES: 'invalidLearningNodes',
  INVALID_ID: 'invalidId',
  DUPLICATE_ID: 'duplicateId',
  INVALID_TITLE: 'invalidTitle',
  INVALID_POSITION: 'invalidPosition',
  DUPLICATE_SIBLING_POSITION: 'duplicateSiblingPosition',
  INVALID_NODE_TYPE: 'invalidNodeType',
  INVALID_TRACKABLE: 'invalidTrackable',
  INVALID_CHAPTER_PARENT: 'invalidChapterParent',
  MISSING_PARENT: 'missingParent',
  INVALID_PARENT_TYPE: 'invalidParentType',
  CROSS_UNIT_PARENT: 'crossUnitParent',
  CYCLE_DETECTED: 'cycleDetected',
})

const NODE_PARENT_TYPES = Object.freeze({
  chapter: null,
  section: 'chapter',
  subsection: 'section',
})

function isObjectRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
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

function validateIdentity(entity, path, context) {
  if (!isTrimmedNonEmptyString(entity.id)) {
    addError(
      context.errors,
      LEARNING_CATALOG_ERROR_CODES.INVALID_ID,
      `${path}.id`,
      'Die ID muss eine nicht leere, getrimmte Zeichenfolge sein.'
    )
  } else if (context.ids.has(entity.id)) {
    addError(
      context.errors,
      LEARNING_CATALOG_ERROR_CODES.DUPLICATE_ID,
      `${path}.id`,
      `Die ID "${entity.id}" kommt im Katalog mehrfach vor.`
    )
  } else {
    context.ids.add(entity.id)
  }

  if (!isTrimmedNonEmptyString(entity.title)) {
    addError(
      context.errors,
      LEARNING_CATALOG_ERROR_CODES.INVALID_TITLE,
      `${path}.title`,
      'Der Titel muss eine nicht leere, getrimmte Zeichenfolge sein.'
    )
  }
}

function validatePosition(entity, path, errors) {
  if (!Number.isInteger(entity.position) || entity.position < 1) {
    addError(
      errors,
      LEARNING_CATALOG_ERROR_CODES.INVALID_POSITION,
      `${path}.position`,
      'Die Position muss eine positive Ganzzahl sein.'
    )
  }
}

function validateSiblingPositions(entries, path, errors, getParentId) {
  const positionsByParent = new Map()

  entries.forEach((entry, index) => {
    if (!isObjectRecord(entry) || !Number.isInteger(entry.position)) return

    const parentKey = getParentId(entry)
    const positionKey = `${typeof parentKey}:${String(parentKey)}:${entry.position}`

    if (positionsByParent.has(positionKey)) {
      addError(
        errors,
        LEARNING_CATALOG_ERROR_CODES.DUPLICATE_SIBLING_POSITION,
        `${path}[${index}].position`,
        'Geschwister müssen innerhalb desselben Elternknotens eindeutige Positionen besitzen.'
      )
    } else {
      positionsByParent.set(positionKey, index)
    }
  })
}

function validateLearningNodeShape(node, path, context, unitId) {
  validateIdentity(node, path, context)
  validatePosition(node, path, context.errors)

  if (!LEARNING_NODE_TYPES.includes(node.nodeType)) {
    addError(
      context.errors,
      LEARNING_CATALOG_ERROR_CODES.INVALID_NODE_TYPE,
      `${path}.nodeType`,
      'Der Knotentyp muss chapter, section oder subsection sein.'
    )
  }

  if (typeof node.isTrackable !== 'boolean') {
    addError(
      context.errors,
      LEARNING_CATALOG_ERROR_CODES.INVALID_TRACKABLE,
      `${path}.isTrackable`,
      'isTrackable muss ein boolescher Wert sein.'
    )
  } else if (node.isTrackable !== (node.nodeType === 'chapter')) {
    addError(
      context.errors,
      LEARNING_CATALOG_ERROR_CODES.INVALID_TRACKABLE,
      `${path}.isTrackable`,
      'In Schema 1 sind ausschließlich chapter-Knoten trackbar.'
    )
  }

  if (node.nodeType === 'chapter' && node.parentId !== null) {
    addError(
      context.errors,
      LEARNING_CATALOG_ERROR_CODES.INVALID_CHAPTER_PARENT,
      `${path}.parentId`,
      'Ein chapter-Knoten muss parentId null besitzen.'
    )
  }

  if (isTrimmedNonEmptyString(node.id)) {
    context.nodes.set(node.id, { node, path, unitId })
  }
}

function validateParentReferences(context) {
  for (const { node, path, unitId } of context.nodes.values()) {
    const expectedParentType = NODE_PARENT_TYPES[node.nodeType]

    if (expectedParentType === undefined || expectedParentType === null) continue

    if (!isTrimmedNonEmptyString(node.parentId)) {
      addError(
        context.errors,
        LEARNING_CATALOG_ERROR_CODES.MISSING_PARENT,
        `${path}.parentId`,
        'Der Knoten muss auf einen vorhandenen Elternknoten verweisen.'
      )
      continue
    }

    const parentEntry = context.nodes.get(node.parentId)

    if (!parentEntry) {
      addError(
        context.errors,
        LEARNING_CATALOG_ERROR_CODES.MISSING_PARENT,
        `${path}.parentId`,
        'Der referenzierte Elternknoten ist nicht vorhanden.'
      )
    } else if (parentEntry.unitId !== unitId) {
      addError(
        context.errors,
        LEARNING_CATALOG_ERROR_CODES.CROSS_UNIT_PARENT,
        `${path}.parentId`,
        'Elternverweise dürfen keine Unit-Grenze überschreiten.'
      )
    } else if (parentEntry.node.nodeType !== expectedParentType) {
      addError(
        context.errors,
        LEARNING_CATALOG_ERROR_CODES.INVALID_PARENT_TYPE,
        `${path}.parentId`,
        `Ein ${node.nodeType}-Knoten muss auf einen ${expectedParentType}-Knoten verweisen.`
      )
    }
  }
}

function validateCycles(context) {
  for (const [nodeId, nodeEntry] of context.nodes) {
    const visited = new Set([nodeId])
    let currentEntry = nodeEntry

    while (isTrimmedNonEmptyString(currentEntry.node.parentId)) {
      const parentEntry = context.nodes.get(currentEntry.node.parentId)
      if (!parentEntry || parentEntry.unitId !== nodeEntry.unitId) break

      if (visited.has(parentEntry.node.id)) {
        addError(
          context.errors,
          LEARNING_CATALOG_ERROR_CODES.CYCLE_DETECTED,
          `${nodeEntry.path}.parentId`,
          'LearningNode-Elternverweise dürfen keinen Zyklus bilden.'
        )
        break
      }

      visited.add(parentEntry.node.id)
      currentEntry = parentEntry
    }
  }
}

function validateUnit(unit, path, context) {
  validateIdentity(unit, path, context)
  validatePosition(unit, path, context.errors)

  if (!Array.isArray(unit.learningNodes)) {
    addError(
      context.errors,
      LEARNING_CATALOG_ERROR_CODES.INVALID_LEARNING_NODES,
      `${path}.learningNodes`,
      'learningNodes muss ein Array sein.'
    )
    return
  }

  unit.learningNodes.forEach((node, index) => {
    const nodePath = `${path}.learningNodes[${index}]`
    if (!isObjectRecord(node)) {
      addError(
        context.errors,
        LEARNING_CATALOG_ERROR_CODES.INVALID_LEARNING_NODES,
        nodePath,
        'Jeder LearningNode muss ein Objekt sein.'
      )
      return
    }
    validateLearningNodeShape(node, nodePath, context, unit.id)
  })

  validateSiblingPositions(
    unit.learningNodes,
    `${path}.learningNodes`,
    context.errors,
    (node) => node.parentId
  )
}

function validateModule(module, path, context) {
  validateIdentity(module, path, context)
  validatePosition(module, path, context.errors)

  if (!Array.isArray(module.units)) {
    addError(
      context.errors,
      LEARNING_CATALOG_ERROR_CODES.INVALID_UNITS,
      `${path}.units`,
      'units muss ein Array sein.'
    )
    return
  }

  module.units.forEach((unit, index) => {
    const unitPath = `${path}.units[${index}]`
    if (!isObjectRecord(unit)) {
      addError(
        context.errors,
        LEARNING_CATALOG_ERROR_CODES.INVALID_UNITS,
        unitPath,
        'Jede Unit muss ein Objekt sein.'
      )
      return
    }
    validateUnit(unit, unitPath, context)
  })

  validateSiblingPositions(module.units, `${path}.units`, context.errors, () => module.id)
}

export function validateLearningCatalog(catalog) {
  const errors = []
  const context = { errors, ids: new Set(), nodes: new Map() }

  if (!isObjectRecord(catalog)) {
    addError(
      errors,
      LEARNING_CATALOG_ERROR_CODES.INVALID_CATALOG,
      '$',
      'Der LearningHub-Katalog muss ein Objekt sein.'
    )
    return { ok: false, errors }
  }

  if (catalog.schemaVersion !== LEARNING_CATALOG_SCHEMA_VERSION) {
    addError(
      errors,
      LEARNING_CATALOG_ERROR_CODES.UNSUPPORTED_SCHEMA_VERSION,
      '$.schemaVersion',
      'Die Katalog-Schemaversion wird nicht unterstützt.'
    )
  }

  if (!LEARNING_CATALOG_DATA_ORIGINS.includes(catalog.dataOrigin)) {
    addError(
      errors,
      LEARNING_CATALOG_ERROR_CODES.INVALID_DATA_ORIGIN,
      '$.dataOrigin',
      'dataOrigin muss synthetic oder private sein.'
    )
  }

  if (!isObjectRecord(catalog.course)) {
    addError(
      errors,
      LEARNING_CATALOG_ERROR_CODES.INVALID_COURSE,
      '$.course',
      'Der Katalog muss genau ein course-Objekt enthalten.'
    )
    return { ok: false, errors }
  }

  validateIdentity(catalog.course, '$.course', context)

  if (!Array.isArray(catalog.course.modules)) {
    addError(
      errors,
      LEARNING_CATALOG_ERROR_CODES.INVALID_MODULES,
      '$.course.modules',
      'modules muss ein Array sein.'
    )
  } else {
    catalog.course.modules.forEach((module, index) => {
      const modulePath = `$.course.modules[${index}]`
      if (!isObjectRecord(module)) {
        addError(
          errors,
          LEARNING_CATALOG_ERROR_CODES.INVALID_MODULES,
          modulePath,
          'Jedes Modul muss ein Objekt sein.'
        )
        return
      }
      validateModule(module, modulePath, context)
    })

    validateSiblingPositions(
      catalog.course.modules,
      '$.course.modules',
      errors,
      () => catalog.course.id
    )
  }

  validateParentReferences(context)
  validateCycles(context)

  return errors.length === 0 ? { ok: true, errors: [] } : { ok: false, errors }
}
