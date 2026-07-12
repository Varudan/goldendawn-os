const LOAD_ERROR_MESSAGES = Object.freeze({
  invalidJson:
    'Die lokal gespeicherten PromptVault-Daten sind beschädigt. Sie wurden nicht überschrieben.',
  invalidStoredData:
    'Die lokal gespeicherten PromptVault-Daten haben eine ungültige Struktur. Sie wurden nicht überschrieben.',
  unsupportedSchemaVersion:
    'Die lokal gespeicherte PromptVault-Version wird noch nicht unterstützt. Die Daten wurden nicht überschrieben.',
  unavailable:
    'Der lokale Speicher ist nicht verfügbar. PromptVault kann die Daten deshalb gerade nicht laden.',
  readFailed:
    'Die lokal gespeicherten Prompts konnten nicht gelesen werden. Bitte versuche es erneut.',
  quotaExceeded:
    'Die Beispielprompts konnten nicht gespeichert werden, weil der lokale Speicher keinen freien Platz hat.',
  writeFailed:
    'Die Beispielprompts konnten nicht im lokalen Speicher angelegt werden.',
})

const DELETE_ERROR_MESSAGES = Object.freeze({
  notFound:
    'Der Prompt wurde nicht gefunden. Lade PromptVault erneut und versuche es noch einmal.',
  quotaExceeded:
    'Der Prompt konnte nicht gelöscht werden, weil der lokale Speicher keinen freien Platz hat.',
  unavailable:
    'Der lokale Speicher ist nicht verfügbar. Der Prompt wurde nicht gelöscht.',
  readFailed:
    'Die gespeicherten Prompts konnten vor dem Löschen nicht gelesen werden.',
  writeFailed:
    'Die Änderung konnte nicht gespeichert werden. Der Prompt wurde nicht gelöscht.',
  validationFailed:
    'Der Prompt konnte wegen einer ungültigen Kennung nicht gelöscht werden.',
})

const CREATE_ERROR_MESSAGES = Object.freeze({
  quotaExceeded:
    'Der Prompt konnte nicht gespeichert werden, weil der lokale Speicher keinen freien Platz hat. Deine Eingaben bleiben erhalten.',
  unavailable:
    'Der lokale Speicher ist nicht verfügbar. Der Prompt wurde nicht gespeichert und deine Eingaben bleiben erhalten.',
  readFailed:
    'Die gespeicherten Prompts konnten vor dem Erstellen nicht gelesen werden. Deine Eingaben bleiben erhalten.',
  writeFailed:
    'Der Prompt konnte nicht lokal gespeichert werden. Deine Eingaben bleiben erhalten.',
  generationFailed:
    'Der Prompt konnte nicht für die lokale Speicherung vorbereitet werden. Deine Eingaben bleiben erhalten.',
})

const CREATE_FORM_FIELDS = [
  'title',
  'category',
  'description',
  'content',
]

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

function getLoadErrorMessage(result) {
  return (
    LOAD_ERROR_MESSAGES[result?.status] ??
    'Die PromptVault-Daten konnten nicht geladen werden. Bitte versuche es erneut.'
  )
}

function getDeleteErrorMessage(result) {
  return (
    DELETE_ERROR_MESSAGES[result?.status] ??
    'Der Prompt konnte nicht dauerhaft gelöscht werden. Die gespeicherte Liste bleibt unverändert.'
  )
}

function getCreateErrorMessage(result) {
  return (
    CREATE_ERROR_MESSAGES[result?.status] ??
    'Der Prompt konnte nicht lokal gespeichert werden. Deine Eingaben bleiben erhalten.'
  )
}

function createFormValues() {
  return {
    title: '',
    category: '',
    description: '',
    content: '',
  }
}

function createFormState() {
  return {
    isOpen: false,
    isSubmitting: false,
    openedFrom: null,
    values: createFormValues(),
    fieldErrors: {},
    errorMessage: '',
  }
}

function createInitialState() {
  return {
    phase: 'loading',
    prompts: [],
    pendingDeleteId: null,
    deletingId: null,
    deleteErrorId: null,
    statusMessage: '',
    errorMessage: '',
    createForm: createFormState(),
  }
}

function cloneCreateForm(createForm) {
  return {
    ...createForm,
    values: { ...createForm.values },
    fieldErrors: { ...createForm.fieldErrors },
  }
}

function normalizeFormValues(values) {
  const formValues =
    typeof values === 'object' && values !== null ? values : {}

  return Object.fromEntries(
    CREATE_FORM_FIELDS.map((fieldName) => [
      fieldName,
      typeof formValues[fieldName] === 'string'
        ? formValues[fieldName]
        : '',
    ])
  )
}

function getCreateFieldErrors(result) {
  const rawFieldErrors = result?.error?.fieldErrors

  if (
    typeof rawFieldErrors !== 'object' ||
    rawFieldErrors === null ||
    Array.isArray(rawFieldErrors)
  ) {
    return {}
  }

  return Object.fromEntries(
    CREATE_FORM_FIELDS.flatMap((fieldName) =>
      typeof rawFieldErrors[fieldName] === 'string'
        ? [[fieldName, rawFieldErrors[fieldName]]]
        : []
    )
  )
}

function getFirstInvalidField(fieldErrors) {
  return CREATE_FORM_FIELDS.find((fieldName) => fieldErrors[fieldName]) ?? null
}

export function createPromptVaultController({
  promptService,
  promptVaultView,
  scheduleTask = scheduleAfterPaint,
} = {}) {
  let isActive = false
  let cancelScheduledLoad = null
  let viewState = createInitialState()

  const actions = Object.freeze({
    onRetryLoad: loadPrompts,
    onOpenCreateForm: openCreateForm,
    onUpdateCreateField: updateCreateField,
    onSubmitCreateForm: submitCreateForm,
    onCancelCreateForm: cancelCreateForm,
    onRequestDelete: requestDelete,
    onCancelDelete: cancelDelete,
    onConfirmDelete: confirmDelete,
  })

  function render(focusTarget = null) {
    if (!isActive || typeof promptVaultView?.render !== 'function') {
      return
    }

    promptVaultView.render(
      {
        ...viewState,
        prompts: viewState.prompts.map((prompt) => ({ ...prompt })),
        createForm: cloneCreateForm(viewState.createForm),
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

  function finishLoading() {
    cancelScheduledLoad = null

    if (!isActive) {
      return
    }

    let result

    try {
      result = promptService?.loadPrompts?.()
    } catch {
      result = null
    }

    if (result?.ok === true && Array.isArray(result.prompts)) {
      viewState = {
        ...createInitialState(),
        phase: 'ready',
        prompts: result.prompts.map((prompt) => ({ ...prompt })),
      }
      render({ type: 'heading' })
      return
    }

    viewState = {
      ...createInitialState(),
      phase: 'loadError',
      errorMessage: getLoadErrorMessage(result),
    }
    render({ type: 'heading' })
  }

  function loadPrompts() {
    if (!isActive) {
      return
    }

    cancelPendingLoad()
    viewState = createInitialState()
    render()
    cancelScheduledLoad = scheduleTask(finishLoading)
  }

  function openCreateForm(openedFrom = 'header') {
    if (!isActive || viewState.phase !== 'ready') {
      return
    }

    viewState = {
      ...viewState,
      pendingDeleteId: null,
      deletingId: null,
      deleteErrorId: null,
      statusMessage: '',
      errorMessage: '',
      createForm: {
        ...createFormState(),
        isOpen: true,
        openedFrom: openedFrom === 'empty' ? 'empty' : 'header',
      },
    }
    render({ type: 'createTitle' })
  }

  function updateCreateField(fieldName, value) {
    if (
      !isActive ||
      !viewState.createForm.isOpen ||
      !CREATE_FORM_FIELDS.includes(fieldName) ||
      typeof value !== 'string'
    ) {
      return
    }

    viewState = {
      ...viewState,
      createForm: {
        ...viewState.createForm,
        values: {
          ...viewState.createForm.values,
          [fieldName]: value,
        },
      },
    }
  }

  function cancelCreateForm() {
    if (
      !isActive ||
      !viewState.createForm.isOpen ||
      viewState.createForm.isSubmitting
    ) {
      return
    }

    const openedFrom = viewState.createForm.openedFrom
    viewState = {
      ...viewState,
      createForm: createFormState(),
    }
    render({
      type:
        openedFrom === 'empty'
          ? 'emptyCreateButton'
          : 'headerCreateButton',
    })
  }

  function submitCreateForm(values) {
    if (
      !isActive ||
      viewState.phase !== 'ready' ||
      !viewState.createForm.isOpen ||
      viewState.createForm.isSubmitting
    ) {
      return
    }

    const formValues = normalizeFormValues(values)
    viewState = {
      ...viewState,
      statusMessage: '',
      createForm: {
        ...viewState.createForm,
        isSubmitting: true,
        values: formValues,
        fieldErrors: {},
        errorMessage: '',
      },
    }

    let result

    try {
      result = promptService?.createPrompt?.({ ...formValues })
    } catch {
      result = null
    }

    if (result?.ok === true && Array.isArray(result.prompts)) {
      const createdPromptId =
        typeof result.createdPrompt?.id === 'string'
          ? result.createdPrompt.id
          : null
      viewState = {
        ...viewState,
        prompts: result.prompts.map((prompt) => ({ ...prompt })),
        pendingDeleteId: null,
        deletingId: null,
        deleteErrorId: null,
        statusMessage: 'Prompt erstellt',
        errorMessage: '',
        createForm: createFormState(),
      }
      render(
        createdPromptId
          ? { type: 'promptTitle', id: createdPromptId }
          : { type: 'contentHeading' }
      )
      return
    }

    if (result?.status === 'validationFailed') {
      const fieldErrors = getCreateFieldErrors(result)
      const firstInvalidField = getFirstInvalidField(fieldErrors)
      viewState = {
        ...viewState,
        createForm: {
          ...viewState.createForm,
          isSubmitting: false,
          fieldErrors,
          errorMessage:
            result?.error?.message ??
            'Bitte korrigiere die markierten Felder.',
        },
      }
      render(
        firstInvalidField
          ? { type: 'createField', fieldName: firstInvalidField }
          : { type: 'createAlert' }
      )
      return
    }

    viewState = {
      ...viewState,
      createForm: {
        ...viewState.createForm,
        isSubmitting: false,
        fieldErrors: {},
        errorMessage: getCreateErrorMessage(result),
      },
    }
    render({ type: 'createAlert' })
  }

  function requestDelete(promptId) {
    const promptExists = viewState.prompts.some(
      (prompt) => prompt.id === promptId
    )

    if (!isActive || viewState.phase !== 'ready' || !promptExists) {
      return
    }

    viewState = {
      ...viewState,
      pendingDeleteId: promptId,
      deletingId: null,
      deleteErrorId: null,
      statusMessage: '',
      errorMessage: '',
    }
    render({ type: 'cancelButton', id: promptId })
  }

  function cancelDelete() {
    if (!isActive || viewState.phase !== 'ready' || viewState.deletingId) {
      return
    }

    const cancelledPromptId = viewState.pendingDeleteId

    if (!cancelledPromptId) {
      return
    }

    viewState = {
      ...viewState,
      pendingDeleteId: null,
      deleteErrorId: null,
      statusMessage: '',
      errorMessage: '',
    }
    render({ type: 'deleteButton', id: cancelledPromptId })
  }

  function confirmDelete(promptId) {
    if (
      !isActive ||
      viewState.phase !== 'ready' ||
      viewState.deletingId ||
      viewState.pendingDeleteId !== promptId
    ) {
      return
    }

    viewState = {
      ...viewState,
      deletingId: promptId,
      deleteErrorId: null,
      statusMessage: '',
      errorMessage: '',
    }
    render()

    let result

    try {
      result = promptService?.deletePrompt?.(promptId)
    } catch {
      result = null
    }

    if (result?.ok === true && Array.isArray(result.prompts)) {
      viewState = {
        ...viewState,
        prompts: result.prompts.map((prompt) => ({ ...prompt })),
        pendingDeleteId: null,
        deletingId: null,
        deleteErrorId: null,
        statusMessage: 'Prompt gelöscht',
        errorMessage: '',
      }
      render({ type: 'contentHeading' })
      return
    }

    viewState = {
      ...viewState,
      deletingId: null,
      deleteErrorId: promptId,
      errorMessage: getDeleteErrorMessage(result),
    }
    render({ type: 'deleteAlert', id: promptId })
  }

  function open() {
    isActive = true
    loadPrompts()
  }

  function close() {
    isActive = false
    cancelPendingLoad()
  }

  return Object.freeze({ open, close })
}
