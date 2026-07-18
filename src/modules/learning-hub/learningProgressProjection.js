import {
  LEARNING_PROGRESS_EVENT_TYPES,
} from './learningProgressContract.js'

function sortByPosition(entries) {
  return [...entries].sort(
    (firstEntry, secondEntry) => firstEntry.position - secondEntry.position
  )
}

function deriveChapterStates(progressLog) {
  const chapterStatesByModule = new Map()

  progressLog.events.forEach((progressEvent) => {
    let moduleChapterStates = chapterStatesByModule.get(progressEvent.moduleId)

    if (!moduleChapterStates) {
      moduleChapterStates = new Map()
      chapterStatesByModule.set(progressEvent.moduleId, moduleChapterStates)
    }

    moduleChapterStates.set(
      progressEvent.chapterId,
      progressEvent.type === LEARNING_PROGRESS_EVENT_TYPES.CHAPTER_COMPLETED
    )
  })

  return chapterStatesByModule
}

export function projectLearningProgress(learningHub, progressLog) {
  const chapterStatesByModule = deriveChapterStates(progressLog)

  return sortByPosition(learningHub.modules).map((learningModule) => {
    const moduleChapterStates =
      chapterStatesByModule.get(learningModule.id) ?? new Map()
    const chapters = sortByPosition(learningModule.chapters).map((chapter) => ({
      chapterId: chapter.id,
      isCompleted: moduleChapterStates.get(chapter.id) === true,
    }))
    const totalChapterCount = chapters.length
    const completedChapterCount = chapters.reduce(
      (completedCount, chapter) =>
        completedCount + (chapter.isCompleted ? 1 : 0),
      0
    )

    // Prozentwerte werden auf die nächste Ganzzahl gerundet. Bei exakt .5
    // gilt die für nicht negative Werte aufwärts gerichtete Math.round-Regel.
    const progressPercent = totalChapterCount === 0
      ? 0
      : Math.round((completedChapterCount / totalChapterCount) * 100)

    return {
      moduleId: learningModule.id,
      completedChapterCount,
      totalChapterCount,
      progressPercent,
      isCompleted:
        totalChapterCount > 0 && completedChapterCount === totalChapterCount,
      chapters,
    }
  })
}
