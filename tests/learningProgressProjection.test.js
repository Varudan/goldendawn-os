import assert from 'node:assert/strict'
import test from 'node:test'

import {
  LEARNING_PROGRESS_EVENT_TYPES,
} from '../src/modules/learning-hub/learningProgressContract.js'
import {
  projectLearningProgress,
} from '../src/modules/learning-hub/learningProgressProjection.js'

function createChapter(id, position) {
  return {
    id,
    title: `Synthetisches Kapitel ${id}`,
    position,
    learningNodes: [
      {
        id: `node-${id}`,
        title: `Synthetische Karte ${id}`,
        content: 'Frei erfundener Karteninhalt für einen Projektionstest.',
        position: 1,
      },
    ],
  }
}

function createModule(id, position, chapterPositions) {
  return {
    id,
    title: `Synthetisches Modul ${id}`,
    position,
    chapters: chapterPositions.map((chapterPosition, index) =>
      createChapter(`${id}-chapter-${index + 1}`, chapterPosition)
    ),
  }
}

function createHub(modules = []) {
  return {
    schemaVersion: 2,
    dataOrigin: 'private',
    modules,
  }
}

function createProgressLog(events = []) {
  return {
    schemaVersion: 1,
    dataOrigin: 'private',
    events,
  }
}

function createProgressEvent({
  id,
  moduleId,
  chapterId,
  type = LEARNING_PROGRESS_EVENT_TYPES.CHAPTER_COMPLETED,
  occurredAt = '2026-07-18T12:00:00.000Z',
}) {
  return { id, type, moduleId, chapterId, occurredAt }
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze)
    Object.freeze(value)
  }

  return value
}

test('projiziert einen leeren Hub als leeres Modul-Array', () => {
  assert.deepEqual(
    projectLearningProgress(createHub(), createProgressLog()),
    []
  )
})

test('projiziert Kapitel ohne Ereignis als offen und kopiert keine Inhalte', () => {
  const learningHub = createHub([
    createModule('module-moon-garden', 1, [1, 2]),
  ])
  const projection = projectLearningProgress(
    learningHub,
    createProgressLog()
  )

  assert.deepEqual(projection, [
    {
      moduleId: 'module-moon-garden',
      completedChapterCount: 0,
      totalChapterCount: 2,
      progressPercent: 0,
      isCompleted: false,
      chapters: [
        {
          chapterId: 'module-moon-garden-chapter-1',
          isCompleted: false,
        },
        {
          chapterId: 'module-moon-garden-chapter-2',
          isCompleted: false,
        },
      ],
    },
  ])
  assert.equal(JSON.stringify(projection).includes('title'), false)
  assert.equal(JSON.stringify(projection).includes('content'), false)
  assert.equal(JSON.stringify(projection).includes('learningNodes'), false)
})

test('chapter.completed setzt genau das referenzierte Kapitel auf abgeschlossen', () => {
  const learningModule = createModule('module-cloud-lantern', 1, [1, 2])
  const completedChapter = learningModule.chapters[0]
  const projection = projectLearningProgress(
    createHub([learningModule]),
    createProgressLog([
      createProgressEvent({
        id: 'event-cloud-lantern-completed',
        moduleId: learningModule.id,
        chapterId: completedChapter.id,
      }),
    ])
  )

  assert.equal(projection[0].chapters[0].isCompleted, true)
  assert.equal(projection[0].chapters[1].isCompleted, false)
  assert.equal(projection[0].completedChapterCount, 1)
  assert.equal(projection[0].progressPercent, 50)
  assert.equal(projection[0].isCompleted, false)
})

test('completed gefolgt von reopened öffnet das Kapitel wieder', () => {
  const learningModule = createModule('module-silver-river', 1, [1])
  const chapterId = learningModule.chapters[0].id
  const projection = projectLearningProgress(
    createHub([learningModule]),
    createProgressLog([
      createProgressEvent({
        id: 'event-silver-river-completed',
        moduleId: learningModule.id,
        chapterId,
      }),
      createProgressEvent({
        id: 'event-silver-river-reopened',
        moduleId: learningModule.id,
        chapterId,
        type: LEARNING_PROGRESS_EVENT_TYPES.CHAPTER_REOPENED,
      }),
    ])
  )

  assert.equal(projection[0].chapters[0].isCompleted, false)
  assert.equal(projection[0].completedChapterCount, 0)
  assert.equal(projection[0].isCompleted, false)
})

test('completed, reopened und erneut completed schließt das Kapitel wieder', () => {
  const learningModule = createModule('module-quiet-comet', 1, [1])
  const chapterId = learningModule.chapters[0].id
  const events = [
    LEARNING_PROGRESS_EVENT_TYPES.CHAPTER_COMPLETED,
    LEARNING_PROGRESS_EVENT_TYPES.CHAPTER_REOPENED,
    LEARNING_PROGRESS_EVENT_TYPES.CHAPTER_COMPLETED,
  ].map((type, index) =>
    createProgressEvent({
      id: `event-quiet-comet-${index + 1}`,
      moduleId: learningModule.id,
      chapterId,
      type,
    })
  )
  const projection = projectLearningProgress(
    createHub([learningModule]),
    createProgressLog(events)
  )

  assert.equal(projection[0].chapters[0].isCompleted, true)
  assert.equal(projection[0].progressPercent, 100)
  assert.equal(projection[0].isCompleted, true)
})

test('verwendet ausschließlich die Arrayreihenfolge und sortiert nie nach occurredAt', () => {
  const learningModule = createModule('module-time-orchard', 1, [1])
  const chapterId = learningModule.chapters[0].id
  const projection = projectLearningProgress(
    createHub([learningModule]),
    createProgressLog([
      createProgressEvent({
        id: 'event-time-orchard-completed',
        moduleId: learningModule.id,
        chapterId,
        occurredAt: '2026-07-18T20:00:00.000Z',
      }),
      createProgressEvent({
        id: 'event-time-orchard-reopened',
        moduleId: learningModule.id,
        chapterId,
        type: LEARNING_PROGRESS_EVENT_TYPES.CHAPTER_REOPENED,
        occurredAt: '2026-07-18T08:00:00.000Z',
      }),
    ])
  )

  assert.equal(projection[0].chapters[0].isCompleted, false)
})

test('ordnet mehrere Module und Kapitel nach ihren Inhaltspositionen', () => {
  const laterModule = createModule('module-later', 9, [8, 2])
  const firstModule = createModule('module-first', 1, [7, 3])
  const projection = projectLearningProgress(
    createHub([laterModule, firstModule]),
    createProgressLog([
      createProgressEvent({
        id: 'event-later-first-array-chapter',
        moduleId: laterModule.id,
        chapterId: laterModule.chapters[0].id,
      }),
      createProgressEvent({
        id: 'event-first-second-array-chapter',
        moduleId: firstModule.id,
        chapterId: firstModule.chapters[1].id,
      }),
    ])
  )

  assert.deepEqual(projection.map((moduleProgress) => moduleProgress.moduleId), [
    'module-first',
    'module-later',
  ])
  assert.deepEqual(
    projection[0].chapters.map((chapterProgress) => chapterProgress.chapterId),
    ['module-first-chapter-2', 'module-first-chapter-1']
  )
  assert.deepEqual(
    projection[1].chapters.map((chapterProgress) => chapterProgress.chapterId),
    ['module-later-chapter-2', 'module-later-chapter-1']
  )
  assert.deepEqual(
    projection.map((moduleProgress) => moduleProgress.completedChapterCount),
    [1, 1]
  )
})

test('rundet Prozentwerte mit Math.round auf die nächste Ganzzahl', () => {
  const learningModule = createModule(
    'module-rounding-lab',
    1,
    [1, 2, 3, 4, 5, 6, 7, 8]
  )
  const completedChapterIds = learningModule.chapters
    .slice(0, 1)
    .map((chapter) => chapter.id)
  const projection = projectLearningProgress(
    createHub([learningModule]),
    createProgressLog(
      completedChapterIds.map((chapterId, index) =>
        createProgressEvent({
          id: `event-rounding-lab-${index + 1}`,
          moduleId: learningModule.id,
          chapterId,
        })
      )
    )
  )

  assert.equal((1 / 8) * 100, 12.5)
  assert.equal(projection[0].progressPercent, 13)
  assert.equal(Number.isInteger(projection[0].progressPercent), true)
})

test('erhält ein vollständiges 100-Prozent-Modul mit allen Kapiteln', () => {
  const learningModule = createModule('module-complete-atlas', 1, [1, 2, 3])
  const events = learningModule.chapters.map((chapter, index) =>
    createProgressEvent({
      id: `event-complete-atlas-${index + 1}`,
      moduleId: learningModule.id,
      chapterId: chapter.id,
    })
  )
  const projection = projectLearningProgress(
    createHub([learningModule]),
    createProgressLog(events)
  )

  assert.equal(projection.length, 1)
  assert.equal(projection[0].completedChapterCount, 3)
  assert.equal(projection[0].totalChapterCount, 3)
  assert.equal(projection[0].progressPercent, 100)
  assert.equal(projection[0].isCompleted, true)
  assert.equal(projection[0].chapters.length, 3)
  assert.ok(projection[0].chapters.every((chapter) => chapter.isCompleted))
})

test('berücksichtigt Modul- und Kapitelreferenz gemeinsam', () => {
  const firstModule = createModule('module-paired-first', 1, [1])
  const secondModule = createModule('module-paired-second', 2, [1])
  const projection = projectLearningProgress(
    createHub([firstModule, secondModule]),
    createProgressLog([
      createProgressEvent({
        id: 'event-mismatched-pair',
        moduleId: firstModule.id,
        chapterId: secondModule.chapters[0].id,
      }),
    ])
  )

  assert.ok(
    projection.every((moduleProgress) =>
      moduleProgress.chapters.every((chapter) => !chapter.isCompleted)
    )
  )
})

test('verändert Eingaben nicht und arbeitet mit tief eingefrorenen Zuständen', () => {
  const learningModule = createModule('module-frozen-cascade', 1, [2, 1])
  const learningHub = deepFreeze(createHub([learningModule]))
  const progressLog = deepFreeze(createProgressLog([
    createProgressEvent({
      id: 'event-frozen-cascade',
      moduleId: learningModule.id,
      chapterId: learningModule.chapters[0].id,
    }),
  ]))
  const hubSnapshot = structuredClone(learningHub)
  const progressSnapshot = structuredClone(progressLog)

  const firstProjection = projectLearningProgress(learningHub, progressLog)
  const secondProjection = projectLearningProgress(learningHub, progressLog)

  assert.deepEqual(firstProjection, secondProjection)
  assert.deepEqual(learningHub, hubSnapshot)
  assert.deepEqual(progressLog, progressSnapshot)

  firstProjection[0].chapters[0].isCompleted = true
  assert.deepEqual(learningHub, hubSnapshot)
  assert.deepEqual(progressLog, progressSnapshot)
  assert.deepEqual(secondProjection, projectLearningProgress(learningHub, progressLog))
})
