import {
  createPrivateLearningHubDemoSeed,
} from '../data/mock/learningHubDemo.js'
import {
  validateLearningArtifactStore,
} from '../modules/learning-hub/learningArtifactContract.js'
import {
  validateLearningHub,
} from '../modules/learning-hub/learningHubContract.js'
import {
  validateLearningTestBank,
} from '../modules/learning-hub/learningTestBankContract.js'
import {
  LEARNING_ARTIFACT_STORAGE_KEY,
} from '../storage/learningArtifactStorage.js'
import { LEARNING_HUB_STORAGE_KEY } from '../storage/learningHubStorage.js'
import {
  LEARNING_HUB_DEMO_INITIALIZATION_DECISIONS,
} from '../storage/learningHubDemoInitializationStorage.js'
import {
  LEARNING_TEST_BANK_STORAGE_KEY,
} from '../storage/learningTestBankStorage.js'

const PRIVATE_DATA_ORIGIN = 'private'

function createFailure(status, code, message) {
  return {
    ok: false,
    status,
    changed: false,
    seeded: false,
    error: { code, message },
  }
}

function createDependencyFailure(fallbackCode, fallbackMessage) {
  return createFailure('storageFailed', fallbackCode, fallbackMessage)
}

function cloneSeed(seed) {
  try {
    return { ok: true, seed: structuredClone(seed) }
  } catch {
    return { ok: false }
  }
}

function validateSeedReferences(seed) {
  const modulesById = new Map()
  const chaptersById = new Map()
  const learningNodesById = new Map()

  seed.learningHub.modules.forEach((learningModule) => {
    modulesById.set(learningModule.id, learningModule)

    learningModule.chapters.forEach((chapter) => {
      chaptersById.set(chapter.id, {
        moduleId: learningModule.id,
      })

      chapter.learningNodes.forEach((learningNode) => {
        learningNodesById.set(learningNode.id, {
          moduleId: learningModule.id,
          chapterId: chapter.id,
        })
      })
    })
  })

  const referencesMatch = ({ moduleId, chapterId, learningNodeId }) => {
    const chapterReference = chaptersById.get(chapterId)
    const learningNodeReference = learningNodesById.get(learningNodeId)

    return (
      modulesById.has(moduleId) &&
      chapterReference?.moduleId === moduleId &&
      learningNodeReference?.moduleId === moduleId &&
      learningNodeReference?.chapterId === chapterId
    )
  }

  return (
    seed.artifactStore.artifacts.every(referencesMatch) &&
    seed.testBank.questions.every(referencesMatch)
  )
}

function prepareSeed(createDemoSeed) {
  let createdSeed

  try {
    createdSeed = createDemoSeed()
  } catch {
    return createFailure(
      'validationFailed',
      'invalidLearningHubDemoSeed',
      'Der lokale Demo-Datensatz konnte nicht sicher vorbereitet werden.'
    )
  }

  const clonedSeed = cloneSeed(createdSeed)

  if (!clonedSeed.ok) {
    return createFailure(
      'validationFailed',
      'invalidLearningHubDemoSeed',
      'Der lokale Demo-Datensatz konnte nicht sicher vorbereitet werden.'
    )
  }

  const seed = clonedSeed.seed
  let hubValidation
  let artifactValidation
  let testBankValidation

  try {
    hubValidation = validateLearningHub(seed?.learningHub)
    artifactValidation = validateLearningArtifactStore(seed?.artifactStore)
    testBankValidation = validateLearningTestBank(seed?.testBank)
  } catch {
    return createFailure(
      'validationFailed',
      'invalidLearningHubDemoSeed',
      'Der lokale Demo-Datensatz konnte nicht sicher validiert werden.'
    )
  }

  if (
    !hubValidation.ok ||
    !artifactValidation.ok ||
    !testBankValidation.ok ||
    seed.learningHub.dataOrigin !== PRIVATE_DATA_ORIGIN ||
    seed.artifactStore.dataOrigin !== PRIVATE_DATA_ORIGIN ||
    seed.testBank.dataOrigin !== PRIVATE_DATA_ORIGIN ||
    !validateSeedReferences(seed)
  ) {
    return createFailure(
      'validationFailed',
      'invalidLearningHubDemoSeed',
      'Der lokale Demo-Datensatz verletzt einen Produktionsvertrag.'
    )
  }

  return { ok: true, seed }
}

export function createLearningHubDemoInitializer({
  learningHubDemoInitializationStorage,
  learningHubStorage,
  learningArtifactStorage,
  learningTestBankStorage,
  createDemoSeed = createPrivateLearningHubDemoSeed,
} = {}) {
  function rollbackOperations(operations) {
    let rollbackCompleted = true

    for (const operation of [...operations].reverse()) {
      let rollbackResult

      try {
        rollbackResult =
          learningHubDemoInitializationStorage.rollbackSeedValue(
            operation.storageKey,
            operation.value
          )
      } catch {
        rollbackCompleted = false
        continue
      }

      if (
        rollbackResult?.ok !== true ||
        !['missing', 'removed'].includes(rollbackResult.status)
      ) {
        rollbackCompleted = false
      }
    }

    return rollbackCompleted
  }

  function rollbackOrFailure(operations, failure) {
    if (rollbackOperations(operations)) {
      return failure
    }

    return createFailure(
      'rollbackFailed',
      'learningHubDemoRollbackFailed',
      'Die Demo-Initialisierung ist fehlgeschlagen und konnte nicht vollständig zurückgerollt werden.'
    )
  }

  function saveSkippedDecision() {
    let markerResult

    try {
      markerResult =
        learningHubDemoInitializationStorage.saveInitializationMarker(
          LEARNING_HUB_DEMO_INITIALIZATION_DECISIONS
            .SKIPPED_EXISTING_DATA
        )
    } catch {
      return createDependencyFailure(
        'learningHubDemoMarkerWriteFailed',
        'Die Demo-Initialisierungsentscheidung konnte nicht gespeichert werden.'
      )
    }

    if (
      markerResult?.ok === true &&
      markerResult.status === 'alreadyInitialized'
    ) {
      return {
        ok: true,
        status: 'alreadyInitialized',
        changed: false,
        seeded: false,
      }
    }

    if (markerResult?.ok !== true || markerResult.status !== 'saved') {
      return createDependencyFailure(
        'learningHubDemoMarkerWriteFailed',
        'Die Demo-Initialisierungsentscheidung konnte nicht gespeichert werden.'
      )
    }

    return {
      ok: true,
      status: 'skippedExistingData',
      changed: true,
      seeded: false,
    }
  }

  function initializeLearningHubDemo() {
    if (
      typeof learningHubDemoInitializationStorage
        ?.inspectInitializationState !== 'function' ||
      typeof learningHubDemoInitializationStorage
        ?.inspectDomainStore !== 'function' ||
      typeof learningHubDemoInitializationStorage
        ?.saveInitializationMarker !== 'function' ||
      typeof learningHubDemoInitializationStorage
        ?.rollbackSeedValue !== 'function'
    ) {
      return createFailure(
        'unavailable',
        'learningHubDemoInitializationStorageUnavailable',
        'Der Demo-Initialisierungsspeicher ist nicht verfügbar.'
      )
    }

    let initializationState

    try {
      initializationState =
        learningHubDemoInitializationStorage.inspectInitializationState()
    } catch {
      return createDependencyFailure(
        'learningHubDemoInitializationReadFailed',
        'Der Demo-Initialisierungszustand konnte nicht gelesen werden.'
      )
    }

    if (initializationState?.ok !== true) {
      return createDependencyFailure(
        'learningHubDemoInitializationReadFailed',
        'Der Demo-Initialisierungszustand konnte nicht gelesen werden.'
      )
    }

    if (initializationState.status === 'initialized') {
      return {
        ok: true,
        status: 'alreadyInitialized',
        changed: false,
        seeded: false,
      }
    }

    if (initializationState.status === 'existingData') {
      return saveSkippedDecision()
    }

    if (initializationState.status !== 'uninitialized') {
      return createDependencyFailure(
        'unexpectedLearningHubDemoInitializationState',
        'Der Demo-Initialisierungszustand ist nicht verwertbar.'
      )
    }

    if (
      typeof learningHubStorage?.saveLearningHub !== 'function' ||
      typeof learningArtifactStorage?.saveLearningArtifacts !== 'function' ||
      typeof learningTestBankStorage?.saveLearningTestBank !== 'function'
    ) {
      return createFailure(
        'unavailable',
        'learningHubDemoDomainStorageUnavailable',
        'Ein Fachspeicher für die Demo-Initialisierung ist nicht verfügbar.'
      )
    }

    const seedResult = prepareSeed(createDemoSeed)

    if (!seedResult.ok) {
      return seedResult
    }

    const operations = [
      {
        storageKey: LEARNING_HUB_STORAGE_KEY,
        value: seedResult.seed.learningHub,
        save() {
          return learningHubStorage.saveLearningHub(
            structuredClone(seedResult.seed.learningHub)
          )
        },
      },
      {
        storageKey: LEARNING_ARTIFACT_STORAGE_KEY,
        value: seedResult.seed.artifactStore,
        save() {
          return learningArtifactStorage.saveLearningArtifacts(
            structuredClone(seedResult.seed.artifactStore)
          )
        },
      },
      {
        storageKey: LEARNING_TEST_BANK_STORAGE_KEY,
        value: seedResult.seed.testBank,
        save() {
          return learningTestBankStorage.saveLearningTestBank(
            structuredClone(seedResult.seed.testBank)
          )
        },
      },
    ]
    const attemptedOperations = []

    for (const operation of operations) {
      let currentStoreState

      try {
        currentStoreState =
          learningHubDemoInitializationStorage.inspectDomainStore(
            operation.storageKey
          )
      } catch {
        return rollbackOrFailure(
          attemptedOperations,
          createDependencyFailure(
            'learningHubDemoInitializationReadFailed',
            'Ein Demo-Fachstore konnte nicht sicher geprüft werden.'
          )
        )
      }

      if (currentStoreState?.ok !== true) {
        return rollbackOrFailure(
          attemptedOperations,
          createDependencyFailure(
            'learningHubDemoInitializationReadFailed',
            'Ein Demo-Fachstore konnte nicht sicher geprüft werden.'
          )
        )
      }

      if (currentStoreState.status === 'present') {
        if (!rollbackOperations(attemptedOperations)) {
          return createFailure(
            'rollbackFailed',
            'learningHubDemoRollbackFailed',
            'Die Demo-Initialisierung konnte nach einer zwischenzeitlichen Änderung nicht vollständig zurückgerollt werden.'
          )
        }

        return saveSkippedDecision()
      }

      if (currentStoreState.status !== 'missing') {
        return rollbackOrFailure(
          attemptedOperations,
          createDependencyFailure(
            'unexpectedLearningHubDemoInitializationState',
            'Ein Demo-Fachstore lieferte keinen verwertbaren Zustand.'
          )
        )
      }

      attemptedOperations.push(operation)
      let saveResult

      try {
        saveResult = operation.save()
      } catch {
        return rollbackOrFailure(
          attemptedOperations,
          createDependencyFailure(
            'learningHubDemoInitializationWriteFailed',
            'Der Demo-Datensatz konnte nicht vollständig gespeichert werden.'
          )
        )
      }

      if (saveResult?.ok !== true || saveResult.status !== 'saved') {
        return rollbackOrFailure(
          attemptedOperations,
          createDependencyFailure(
            'learningHubDemoInitializationWriteFailed',
            'Der Demo-Datensatz konnte nicht vollständig gespeichert werden.'
          )
        )
      }
    }

    let markerResult

    try {
      markerResult =
        learningHubDemoInitializationStorage.saveInitializationMarker(
          LEARNING_HUB_DEMO_INITIALIZATION_DECISIONS.SEEDED
        )
    } catch {
      return rollbackOrFailure(
        attemptedOperations,
        createDependencyFailure(
          'learningHubDemoMarkerWriteFailed',
          'Der Abschluss der Demo-Initialisierung konnte nicht gespeichert werden.'
        )
      )
    }

    if (
      markerResult?.ok === true &&
      markerResult.status === 'alreadyInitialized'
    ) {
      if (!rollbackOperations(attemptedOperations)) {
        return createFailure(
          'rollbackFailed',
          'learningHubDemoRollbackFailed',
          'Die Demo-Initialisierung konnte nach einer zwischenzeitlichen Entscheidung nicht vollständig zurückgerollt werden.'
        )
      }

      return {
        ok: true,
        status: 'alreadyInitialized',
        changed: false,
        seeded: false,
      }
    }

    if (markerResult?.ok !== true || markerResult.status !== 'saved') {
      return rollbackOrFailure(
        attemptedOperations,
        createDependencyFailure(
          'learningHubDemoMarkerWriteFailed',
          'Der Abschluss der Demo-Initialisierung konnte nicht gespeichert werden.'
        )
      )
    }

    return {
      ok: true,
      status: 'seeded',
      changed: true,
      seeded: true,
    }
  }

  return Object.freeze({ initializeLearningHubDemo })
}
