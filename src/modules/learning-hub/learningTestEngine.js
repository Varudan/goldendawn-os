function sortByPosition(entries) {
  return [...entries].sort((left, right) => left.position - right.position)
}

function cloneOption(option) {
  return {
    id: option.id,
    label: option.label,
    position: option.position,
  }
}

function cloneQuestion(question) {
  return {
    id: question.id,
    moduleId: question.moduleId,
    chapterId: question.chapterId,
    learningNodeId: question.learningNodeId,
    type: question.type,
    prompt: question.prompt,
    difficulty: question.difficulty,
    position: question.position,
    revision: question.revision,
    createdAt: question.createdAt,
    updatedAt: question.updatedAt,
    options: sortByPosition(question.options).map(cloneOption),
    correctOptionId: question.correctOptionId,
    explanation: question.explanation,
  }
}

export function selectModuleTestQuestions(learningHub, testBank, moduleId) {
  const learningModule = learningHub.modules.find(
    (candidateModule) => candidateModule.id === moduleId
  )

  if (!learningModule) {
    return []
  }

  const selectedQuestions = []

  sortByPosition(learningModule.chapters).forEach((chapter) => {
    sortByPosition(chapter.learningNodes).forEach((learningNode) => {
      const learningNodeQuestions = testBank.questions.filter((question) => (
        question.moduleId === learningModule.id &&
        question.chapterId === chapter.id &&
        question.learningNodeId === learningNode.id
      ))

      sortByPosition(learningNodeQuestions).forEach((question) => {
        selectedQuestions.push(cloneQuestion(question))
      })
    })
  })

  return selectedQuestions
}

export function projectPublicTestQuestions(questions) {
  return questions.map((question) => ({
    id: question.id,
    learningNodeId: question.learningNodeId,
    type: question.type,
    prompt: question.prompt,
    difficulty: question.difficulty,
    options: sortByPosition(question.options).map((option) => ({
      id: option.id,
      label: option.label,
    })),
  }))
}

export function evaluateLearningTestAnswers(questions, answers) {
  const answersByQuestionId = new Map()

  answers.forEach((answer) => {
    if (!answersByQuestionId.has(answer.questionId)) {
      answersByQuestionId.set(answer.questionId, answer)
    }
  })

  const evaluatedAnswers = questions.map((question) => {
    const submittedAnswer = answersByQuestionId.get(question.id)
    const selectedOptionId = submittedAnswer?.selectedOptionId
    const isCorrect = selectedOptionId === question.correctOptionId

    return {
      questionId: question.id,
      questionRevision: question.revision,
      learningNodeId: question.learningNodeId,
      selectedOptionId,
      correctOptionId: question.correctOptionId,
      isCorrect,
    }
  })
  const totalQuestionCount = evaluatedAnswers.length
  const correctAnswerCount = evaluatedAnswers.reduce(
    (count, answer) => count + (answer.isCorrect ? 1 : 0),
    0
  )
  const scorePercent = totalQuestionCount === 0
    ? 0
    : Math.round(correctAnswerCount / totalQuestionCount * 100)

  return {
    answers: evaluatedAnswers,
    totalQuestionCount,
    correctAnswerCount,
    scorePercent,
  }
}
