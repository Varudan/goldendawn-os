import {
  ALL_CATEGORIES,
  filterPrompts,
  getPromptCategories,
} from './promptSearch.js'

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

const FAVORITE_ERROR_MESSAGES = Object.freeze({
  notFound:
    'Der Prompt wurde nicht gefunden. Lade PromptVault erneut und versuche es noch einmal.',
  quotaExceeded:
    'Der Favoritenstatus konnte nicht gespeichert werden, weil der lokale Speicher keinen freien Platz hat.',
  unavailable:
    'Der lokale Speicher ist nicht verfügbar. Der Favoritenstatus blieb unverändert.',
  readFailed:
    'Die gespeicherten Prompts konnten vor der Favoritenänderung nicht gelesen werden.',
  writeFailed:
    'Der Favoritenstatus konnte nicht lokal gespeichert werden und blieb unverändert.',
  validationFailed:
    'Der Favoritenstatus konnte wegen ungültiger Angaben nicht geändert werden.',
  generationFailed:
    'Die Favoritenänderung konnte nicht für die lokale Speicherung vorbereitet werden.',
})

const EDIT_ERROR_MESSAGES = Object.freeze({
  notFound:
    'Der Prompt wurde nicht gefunden. Die Bearbeitung wurde beendet. Lade PromptVault erneut, um die Liste zu aktualisieren.',
  quotaExceeded:
    'Der Prompt konnte nicht aktualisiert werden, weil der lokale Speicher keinen freien Platz hat. Deine Eingaben bleiben erhalten.',
  unavailable:
    'Der lokale Speicher ist nicht verfügbar. Der Prompt wurde nicht aktualisiert und deine Eingaben bleiben erhalten.',
  readFailed:
    'Die gespeicherten Prompts konnten vor dem Bearbeiten nicht gelesen werden. Deine Eingaben bleiben erhalten.',
  writeFailed:
    'Der Prompt konnte nicht lokal aktualisiert werden. Deine Eingaben bleiben erhalten.',
  generationFailed:
    'Die Änderung konnte nicht mit einem gültigen Zeitstempel gespeichert werden. Deine Eingaben bleiben erhalten.',
  invalidJson:
    'Die lokal gespeicherten PromptVault-Daten sind beschädigt. Sie wurden nicht überschrieben und deine Eingaben bleiben erhalten.',
  invalidStoredData:
    'Die lokal gespeicherten PromptVault-Daten haben eine ungültige Struktur. Sie wurden nicht überschrieben und deine Eingaben bleiben erhalten.',
  unsupportedSchemaVersion:
    'Die lokal gespeicherte PromptVault-Version wird noch nicht unterstützt. Die Daten wurden nicht überschrieben und deine Eingaben bleiben erhalten.',
})

const RESTORE_ERROR_MESSAGES = Object.freeze({
  invalidPromptId:
    'Die Version konnte wegen einer ungültigen Prompt-Kennung nicht wiederhergestellt werden.',
  invalidPromptVersionNumber:
    'Die Version konnte wegen einer ungültigen Versionsnummer nicht wiederhergestellt werden.',
  promptNotFound:
    'Der Prompt wurde nicht gefunden. Die bisherige Historie bleibt sichtbar.',
  promptVersionNotFound:
    'Die ausgewählte Version wurde nicht gefunden. Die bisherige Historie bleibt sichtbar.',
  invalidJson:
    'Die lokal gespeicherten PromptVault-Daten sind beschädigt. Sie wurden nicht überschrieben.',
  invalidPromptData:
    'Die lokal gespeicherten PromptVault-Daten haben eine ungültige Struktur. Sie wurden nicht überschrieben.',
  unsupportedSchemaVersion:
    'Die lokal gespeicherte PromptVault-Version wird noch nicht unterstützt. Die Daten wurden nicht überschrieben.',
  promptTimestampGenerationFailed:
    'Die Wiederherstellung konnte nicht mit einem gültigen Zeitstempel gespeichert werden.',
  storageQuotaExceeded:
    'Die Version konnte nicht wiederhergestellt werden, weil der lokale Speicher keinen freien Platz hat.',
  storageUnavailable:
    'Der lokale Speicher ist nicht verfügbar oder wurde blockiert. Die Version wurde nicht wiederhergestellt.',
  storageReadFailed:
    'Die gespeicherten Prompts konnten vor der Wiederherstellung nicht gelesen werden.',
  storageWriteFailed:
    'Die Wiederherstellung konnte nicht lokal gespeichert werden.',
  serializationFailed:
    'Die Wiederherstellung konnte nicht für die lokale Speicherung vorbereitet werden.',
  promptStorageUnavailable:
    'Der lokale Prompt-Speicher ist nicht verfügbar. Die Version wurde nicht wiederhergestellt.',
  unexpectedStorageResult:
    'Die gespeicherten PromptVault-Daten konnten nicht verarbeitet werden.',
})

const RESTORE_STATUS_ERROR_MESSAGES = Object.freeze({
  validationFailed:
    'Die ausgewählte Version konnte wegen ungültiger Angaben nicht wiederhergestellt werden.',
  notFound:
    'Der Prompt oder die ausgewählte Version wurde nicht gefunden.',
  invalidJson:
    'Die lokal gespeicherten PromptVault-Daten sind beschädigt. Sie wurden nicht überschrieben.',
  invalidStoredData:
    'Die lokal gespeicherten PromptVault-Daten haben eine ungültige Struktur. Sie wurden nicht überschrieben.',
  unsupportedSchemaVersion:
    'Die lokal gespeicherte PromptVault-Version wird noch nicht unterstützt. Die Daten wurden nicht überschrieben.',
  generationFailed:
    'Die Wiederherstellung konnte nicht mit einem gültigen Zeitstempel gespeichert werden.',
  quotaExceeded:
    'Die Version konnte nicht wiederhergestellt werden, weil der lokale Speicher keinen freien Platz hat.',
  unavailable:
    'Der lokale Speicher ist nicht verfügbar oder wurde blockiert. Die Version wurde nicht wiederhergestellt.',
  readFailed:
    'Die gespeicherten Prompts konnten vor der Wiederherstellung nicht gelesen werden.',
  writeFailed:
    'Die Wiederherstellung konnte nicht lokal gespeichert werden.',
  serializationFailed:
    'Die Wiederherstellung konnte nicht für die lokale Speicherung vorbereitet werden.',
  storageFailed:
    'Die gespeicherten PromptVault-Daten konnten nicht verarbeitet werden.',
})

const UNSAVED_CREATE_DRAFT_MESSAGE =
  'Speichere den neuen Prompt oder brich die Erstellung ab, bevor du einen anderen Arbeitsbereich öffnest.'
const UNSAVED_EDIT_DRAFT_MESSAGE =
  'Speichere deine Änderungen oder brich die Bearbeitung ab, bevor du einen anderen Arbeitsbereich öffnest.'

const PROMPT_FORM_FIELDS = [
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

function getFavoriteErrorMessage(result) {
  return (
    FAVORITE_ERROR_MESSAGES[result?.status] ??
    'Der Favoritenstatus konnte nicht gespeichert werden und blieb unverändert.'
  )
}

function getEditErrorMessage(result) {
  return (
    EDIT_ERROR_MESSAGES[result?.status] ??
    'Der Prompt konnte nicht lokal aktualisiert werden. Deine Eingaben bleiben erhalten.'
  )
}

function getRestoreErrorMessage(result) {
  const errorCode = result?.error?.code

  return (
    RESTORE_ERROR_MESSAGES[errorCode] ??
    RESTORE_STATUS_ERROR_MESSAGES[result?.status] ??
    'Die ausgewählte Version konnte nicht wiederhergestellt werden. Die bisherige Historie bleibt unverändert.'
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

function createEditFormState() {
  return {
    isOpen: false,
    editingPromptId: null,
    isSubmitting: false,
    values: createFormValues(),
    fieldErrors: {},
    errorMessage: '',
  }
}

function createRestoreState() {
  return {
    promptId: null,
    versionNumber: null,
    isSubmitting: false,
    errorMessage: '',
  }
}

function createInitialState() {
  return {
    phase: 'loading',
    prompts: [],
    visiblePrompts: [],
    categories: [],
    searchQuery: '',
    selectedCategory: ALL_CATEGORIES,
    favoritesOnly: false,
    hasActiveFilters: false,
    filteredEmptyState: null,
    pendingDeleteId: null,
    deletingId: null,
    deleteErrorId: null,
    favoriteSavingId: null,
    favoriteErrorId: null,
    favoriteErrorMessage: '',
    statusMessage: '',
    statusMessageTone: 'success',
    errorMessage: '',
    editErrorMessage: '',
    historyPromptId: null,
    restoreState: createRestoreState(),
    createForm: createFormState(),
    editForm: createEditFormState(),
  }
}

function cloneFormState(formState) {
  return {
    ...formState,
    values: { ...formState.values },
    fieldErrors: { ...formState.fieldErrors },
  }
}

function normalizeFormValues(values) {
  const formValues =
    typeof values === 'object' && values !== null ? values : {}

  return Object.fromEntries(
    PROMPT_FORM_FIELDS.map((fieldName) => [
      fieldName,
      typeof formValues[fieldName] === 'string'
        ? formValues[fieldName]
        : '',
    ])
  )
}

function getFormFieldErrors(result) {
  const rawFieldErrors = result?.error?.fieldErrors

  if (
    typeof rawFieldErrors !== 'object' ||
    rawFieldErrors === null ||
    Array.isArray(rawFieldErrors)
  ) {
    return {}
  }

  return Object.fromEntries(
    PROMPT_FORM_FIELDS.flatMap((fieldName) =>
      typeof rawFieldErrors[fieldName] === 'string'
        ? [[fieldName, rawFieldErrors[fieldName]]]
        : []
    )
  )
}

function getFirstInvalidField(fieldErrors) {
  return PROMPT_FORM_FIELDS.find((fieldName) => fieldErrors[fieldName]) ?? null
}

function clonePrompt(prompt) {
  const clonedPrompt = { ...prompt }

  if (Array.isArray(prompt.versions)) {
    clonedPrompt.versions = prompt.versions.map((version) => ({
      ...version,
    }))
  }

  return clonedPrompt
}

function clonePrompts(prompts) {
  return prompts.map(clonePrompt)
}

function hasChangedFormValues(values, baselineValues) {
  return PROMPT_FORM_FIELDS.some(
    (fieldName) => values[fieldName] !== baselineValues[fieldName]
  )
}

function hasUnsavedCreateDraft(state) {
  return (
    state.createForm.isOpen &&
    hasChangedFormValues(state.createForm.values, createFormValues())
  )
}

function hasUnsavedEditDraft(state) {
  if (!state.editForm.isOpen) {
    return false
  }

  const prompt = state.prompts.find(
    (storedPrompt) => storedPrompt.id === state.editForm.editingPromptId
  )

  if (!prompt) {
    return true
  }

  return hasChangedFormValues(
    state.editForm.values,
    normalizeFormValues(prompt)
  )
}

function derivePromptPresentation(state, servicePrompts = state.prompts) {
  const prompts = Array.isArray(servicePrompts)
    ? clonePrompts(servicePrompts)
    : []
  const categories = getPromptCategories(prompts)
  const selectedCategory =
    state.selectedCategory === ALL_CATEGORIES ||
    categories.includes(state.selectedCategory)
      ? state.selectedCategory
      : ALL_CATEGORIES
  const searchQuery =
    typeof state.searchQuery === 'string' ? state.searchQuery : ''
  const favoritesOnly = state.favoritesOnly === true
  const visiblePrompts = filterPrompts(prompts, {
    query: searchQuery,
    category: selectedCategory,
    favoritesOnly,
  })
  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedCategory !== ALL_CATEGORIES ||
    favoritesOnly
  let filteredEmptyState = null

  if (prompts.length > 0 && visiblePrompts.length === 0) {
    const hasFavoritePrompt = prompts.some(
      (prompt) => prompt.isFavorite === true
    )
    filteredEmptyState =
      favoritesOnly && !hasFavoritePrompt ? 'noFavorites' : 'noMatches'
  }

  return {
    ...state,
    prompts,
    visiblePrompts,
    categories,
    searchQuery,
    selectedCategory,
    favoritesOnly,
    hasActiveFilters,
    filteredEmptyState,
  }
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
    onOpenEditForm: openEditForm,
    onUpdateEditField: updateEditField,
    onSubmitEditForm: submitEditForm,
    onCancelEditForm: cancelEditForm,
    onRequestDelete: requestDelete,
    onCancelDelete: cancelDelete,
    onConfirmDelete: confirmDelete,
    onChangeSearchQuery: changeSearchQuery,
    onChangeCategory: changeCategory,
    onChangeFavoritesOnly: changeFavoritesOnly,
    onResetFilters: resetFilters,
    onSetPromptFavorite: setPromptFavorite,
    onToggleVersionHistory: toggleVersionHistory,
    onRequestRestore: requestRestore,
    onCancelRestore: cancelRestore,
    onConfirmRestore: confirmRestore,
  })

  function render(focusTarget = null) {
    if (!isActive || typeof promptVaultView?.render !== 'function') {
      return
    }

    promptVaultView.render(
      {
        ...viewState,
        prompts: clonePrompts(viewState.prompts),
        visiblePrompts: clonePrompts(viewState.visiblePrompts),
        categories: [...viewState.categories],
        createForm: cloneFormState(viewState.createForm),
        editForm: cloneFormState(viewState.editForm),
        restoreState: { ...viewState.restoreState },
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

  function preserveUnsavedDraft() {
    if (hasUnsavedCreateDraft(viewState)) {
      viewState = {
        ...viewState,
        createForm: {
          ...viewState.createForm,
          errorMessage: UNSAVED_CREATE_DRAFT_MESSAGE,
        },
      }
      render({ type: 'createAlert' })
      return true
    }

    if (hasUnsavedEditDraft(viewState)) {
      const editingPromptId = viewState.editForm.editingPromptId
      viewState = {
        ...viewState,
        editForm: {
          ...viewState.editForm,
          errorMessage: UNSAVED_EDIT_DRAFT_MESSAGE,
        },
      }
      render({ type: 'editAlert', id: editingPromptId })
      return true
    }

    return false
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
      viewState = derivePromptPresentation(
        {
          ...createInitialState(),
          phase: 'ready',
        },
        result.prompts
      )
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

  function changeSearchQuery(searchQuery, selectionStart, selectionEnd) {
    if (
      !isActive ||
      viewState.phase !== 'ready' ||
      viewState.editForm.isOpen ||
      viewState.restoreState.promptId !== null ||
      typeof searchQuery !== 'string'
    ) {
      return
    }

    const fallbackPosition = searchQuery.length
    const normalizedSelectionStart = Number.isInteger(selectionStart)
      ? Math.min(Math.max(selectionStart, 0), searchQuery.length)
      : fallbackPosition
    const normalizedSelectionEnd = Number.isInteger(selectionEnd)
      ? Math.min(Math.max(selectionEnd, 0), searchQuery.length)
      : normalizedSelectionStart
    viewState = derivePromptPresentation({
      ...viewState,
      searchQuery,
      statusMessage: '',
    })
    render({
      type: 'searchInput',
      selectionStart: normalizedSelectionStart,
      selectionEnd: normalizedSelectionEnd,
    })
  }

  function changeCategory(category) {
    if (
      !isActive ||
      viewState.phase !== 'ready' ||
      viewState.editForm.isOpen ||
      viewState.restoreState.promptId !== null ||
      typeof category !== 'string' ||
      (category !== ALL_CATEGORIES &&
        !viewState.categories.includes(category))
    ) {
      return
    }

    viewState = derivePromptPresentation({
      ...viewState,
      selectedCategory: category,
      statusMessage: '',
    })
    render({ type: 'categoryFilter' })
  }

  function changeFavoritesOnly(favoritesOnly) {
    if (
      !isActive ||
      viewState.phase !== 'ready' ||
      viewState.editForm.isOpen ||
      viewState.restoreState.promptId !== null ||
      typeof favoritesOnly !== 'boolean'
    ) {
      return
    }

    viewState = derivePromptPresentation({
      ...viewState,
      favoritesOnly,
      statusMessage: '',
    })
    render({ type: 'favoritesFilter' })
  }

  function resetFilters() {
    if (
      !isActive ||
      viewState.phase !== 'ready' ||
      viewState.editForm.isOpen ||
      viewState.restoreState.promptId !== null ||
      !viewState.hasActiveFilters
    ) {
      return
    }

    viewState = derivePromptPresentation({
      ...viewState,
      searchQuery: '',
      selectedCategory: ALL_CATEGORIES,
      favoritesOnly: false,
      statusMessage: '',
    })
    render({
      type: 'searchInput',
      selectionStart: 0,
      selectionEnd: 0,
    })
  }

  function setPromptFavorite(promptId, isFavorite) {
    const promptExists = viewState.prompts.some(
      (prompt) => prompt.id === promptId
    )

    if (
      !isActive ||
      viewState.phase !== 'ready' ||
      viewState.favoriteSavingId ||
      viewState.restoreState.promptId !== null ||
      (viewState.editForm.isOpen &&
        viewState.editForm.editingPromptId === promptId) ||
      !promptExists ||
      typeof isFavorite !== 'boolean'
    ) {
      return
    }

    viewState = {
      ...viewState,
      favoriteSavingId: promptId,
      favoriteErrorId: null,
      favoriteErrorMessage: '',
      statusMessage: '',
      statusMessageTone: 'success',
    }
    render()

    let result

    try {
      result = promptService?.setPromptFavorite?.(promptId, isFavorite)
    } catch {
      result = null
    }

    if (result?.ok === true && Array.isArray(result.prompts)) {
      viewState = derivePromptPresentation(
        {
          ...viewState,
          favoriteSavingId: null,
          favoriteErrorId: null,
          favoriteErrorMessage: '',
          statusMessage: isFavorite
            ? 'Zu Favoriten hinzugefügt'
            : 'Aus Favoriten entfernt',
          statusMessageTone: 'success',
        },
        result.prompts
      )
      const promptRemainsVisible = viewState.visiblePrompts.some(
        (prompt) => prompt.id === promptId
      )
      render(
        promptRemainsVisible
          ? { type: 'favoriteButton', id: promptId }
          : { type: 'favoritesFilter' }
      )
      return
    }

    viewState = {
      ...viewState,
      favoriteSavingId: null,
      favoriteErrorId: promptId,
      favoriteErrorMessage: getFavoriteErrorMessage(result),
      statusMessage: '',
    }
    render({ type: 'favoriteButton', id: promptId })
  }

  function openCreateForm(openedFrom = 'header') {
    if (
      !isActive ||
      viewState.phase !== 'ready' ||
      viewState.editForm.isSubmitting ||
      viewState.restoreState.isSubmitting
    ) {
      return
    }

    if (preserveUnsavedDraft()) {
      return
    }

    viewState = {
      ...viewState,
      pendingDeleteId: null,
      deletingId: null,
      deleteErrorId: null,
      statusMessage: '',
      statusMessageTone: 'success',
      errorMessage: '',
      editErrorMessage: '',
      restoreState: createRestoreState(),
      createForm: {
        ...createFormState(),
        isOpen: true,
        openedFrom: openedFrom === 'empty' ? 'empty' : 'header',
      },
      editForm: createEditFormState(),
    }
    render({ type: 'createTitle' })
  }

  function updateCreateField(fieldName, value) {
    if (
      !isActive ||
      !viewState.createForm.isOpen ||
      !PROMPT_FORM_FIELDS.includes(fieldName) ||
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
      viewState = derivePromptPresentation(
        {
          ...viewState,
          pendingDeleteId: null,
          deletingId: null,
          deleteErrorId: null,
          statusMessage: 'Prompt erstellt',
          statusMessageTone: 'success',
          errorMessage: '',
          createForm: createFormState(),
        },
        result.prompts
      )
      const createdPromptIsVisible =
        createdPromptId !== null &&
        viewState.visiblePrompts.some(
          (prompt) => prompt.id === createdPromptId
        )
      render(
        createdPromptIsVisible
          ? { type: 'promptTitle', id: createdPromptId }
          : { type: 'contentHeading' }
      )
      return
    }

    if (result?.status === 'validationFailed') {
      const fieldErrors = getFormFieldErrors(result)
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

  function openEditForm(promptId) {
    if (
      !isActive ||
      viewState.phase !== 'ready' ||
      viewState.editForm.isSubmitting ||
      viewState.restoreState.isSubmitting
    ) {
      return
    }

    if (preserveUnsavedDraft()) {
      return
    }

    const prompt = viewState.prompts.find(
      (storedPrompt) => storedPrompt.id === promptId
    )

    if (!prompt) {
      return
    }

    viewState = {
      ...viewState,
      pendingDeleteId: null,
      deletingId: null,
      deleteErrorId: null,
      statusMessage: '',
      statusMessageTone: 'success',
      errorMessage: '',
      editErrorMessage: '',
      restoreState: createRestoreState(),
      createForm: createFormState(),
      editForm: {
        ...createEditFormState(),
        isOpen: true,
        editingPromptId: promptId,
        values: normalizeFormValues(prompt),
      },
    }
    render({ type: 'editTitle', id: promptId })
  }

  function updateEditField(fieldName, value) {
    if (
      !isActive ||
      !viewState.editForm.isOpen ||
      !PROMPT_FORM_FIELDS.includes(fieldName) ||
      typeof value !== 'string'
    ) {
      return
    }

    viewState = {
      ...viewState,
      editForm: {
        ...viewState.editForm,
        values: {
          ...viewState.editForm.values,
          [fieldName]: value,
        },
      },
    }
  }

  function cancelEditForm() {
    if (
      !isActive ||
      !viewState.editForm.isOpen ||
      viewState.editForm.isSubmitting
    ) {
      return
    }

    const editingPromptId = viewState.editForm.editingPromptId
    viewState = {
      ...viewState,
      editErrorMessage: '',
      editForm: createEditFormState(),
    }
    render({ type: 'editButton', id: editingPromptId })
  }

  function submitEditForm(promptId, values) {
    if (
      !isActive ||
      viewState.phase !== 'ready' ||
      !viewState.editForm.isOpen ||
      viewState.editForm.isSubmitting ||
      viewState.editForm.editingPromptId !== promptId
    ) {
      return
    }

    const promptExists = viewState.prompts.some(
      (prompt) => prompt.id === promptId
    )

    if (!promptExists) {
      viewState = {
        ...viewState,
        statusMessage: '',
        editErrorMessage: EDIT_ERROR_MESSAGES.notFound,
        editForm: createEditFormState(),
      }
      render({ type: 'editGlobalAlert' })
      return
    }

    const formValues = normalizeFormValues(values)
    viewState = {
      ...viewState,
      statusMessage: '',
      editErrorMessage: '',
      editForm: {
        ...viewState.editForm,
        isSubmitting: true,
        values: formValues,
        fieldErrors: {},
        errorMessage: '',
      },
    }
    render()

    let result

    try {
      result = promptService?.updatePrompt?.(promptId, {
        ...formValues,
      })
    } catch {
      result = null
    }

    if (result?.ok === true && Array.isArray(result.prompts)) {
      viewState = derivePromptPresentation(
        {
          ...viewState,
          statusMessage:
            result.promptChanged === false
              ? 'Keine Änderungen erforderlich'
              : 'Prompt aktualisiert',
          statusMessageTone:
            result.promptChanged === false ? 'notice' : 'success',
          editErrorMessage: '',
          editForm: createEditFormState(),
        },
        result.prompts
      )
      const promptRemainsVisible = viewState.visiblePrompts.some(
        (prompt) => prompt.id === promptId
      )
      render(
        promptRemainsVisible
          ? { type: 'promptTitle', id: promptId }
          : { type: 'contentHeading' }
      )
      return
    }

    if (result?.status === 'validationFailed') {
      const fieldErrors = getFormFieldErrors(result)
      const firstInvalidField = getFirstInvalidField(fieldErrors)
      viewState = {
        ...viewState,
        editForm: {
          ...viewState.editForm,
          isSubmitting: false,
          fieldErrors,
          errorMessage:
            result?.error?.message ??
            'Bitte korrigiere die markierten Felder.',
        },
      }
      render(
        firstInvalidField
          ? {
              type: 'editField',
              id: promptId,
              fieldName: firstInvalidField,
            }
          : { type: 'editAlert', id: promptId }
      )
      return
    }

    if (result?.status === 'notFound') {
      viewState = {
        ...viewState,
        statusMessage: '',
        editErrorMessage: getEditErrorMessage(result),
        editForm: createEditFormState(),
      }
      render({ type: 'editGlobalAlert' })
      return
    }

    viewState = {
      ...viewState,
      editForm: {
        ...viewState.editForm,
        isSubmitting: false,
        fieldErrors: {},
        errorMessage: getEditErrorMessage(result),
      },
    }
    render({ type: 'editAlert', id: promptId })
  }

  function requestDelete(promptId) {
    const promptExists = viewState.prompts.some(
      (prompt) => prompt.id === promptId
    )

    if (
      !isActive ||
      viewState.phase !== 'ready' ||
      viewState.editForm.isSubmitting ||
      viewState.restoreState.isSubmitting ||
      !promptExists
    ) {
      return
    }

    if (preserveUnsavedDraft()) {
      return
    }

    viewState = {
      ...viewState,
      pendingDeleteId: promptId,
      deletingId: null,
      deleteErrorId: null,
      statusMessage: '',
      statusMessageTone: 'success',
      errorMessage: '',
      editErrorMessage: '',
      restoreState: createRestoreState(),
      createForm: createFormState(),
      editForm: createEditFormState(),
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
      statusMessageTone: 'success',
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
      const removedFavoriteError =
        viewState.favoriteErrorId === promptId
      viewState = derivePromptPresentation(
        {
          ...viewState,
          pendingDeleteId: null,
          deletingId: null,
          deleteErrorId: null,
          favoriteErrorId: removedFavoriteError
            ? null
            : viewState.favoriteErrorId,
          favoriteErrorMessage: removedFavoriteError
            ? ''
            : viewState.favoriteErrorMessage,
          statusMessage: 'Prompt gelöscht',
          statusMessageTone: 'success',
          errorMessage: '',
        },
        result.prompts
      )
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

  function toggleVersionHistory(promptId) {
    const promptIsVisible = viewState.visiblePrompts.some(
      (prompt) => prompt.id === promptId
    )

    if (
      !isActive ||
      viewState.phase !== 'ready' ||
      viewState.restoreState.isSubmitting ||
      !promptIsVisible
    ) {
      return
    }

    const historyIsOpen = viewState.historyPromptId === promptId
    viewState = {
      ...viewState,
      historyPromptId: historyIsOpen ? null : promptId,
      restoreState:
        historyIsOpen || viewState.restoreState.promptId !== promptId
          ? createRestoreState()
          : viewState.restoreState,
    }
    render({
      type: historyIsOpen ? 'historyButton' : 'historyHeading',
      id: promptId,
    })
  }

  function requestRestore(promptId, versionNumber) {
    if (
      !isActive ||
      viewState.phase !== 'ready' ||
      viewState.restoreState.isSubmitting ||
      viewState.historyPromptId !== promptId ||
      !Number.isInteger(versionNumber) ||
      versionNumber <= 0
    ) {
      return
    }

    const prompt = viewState.prompts.find(
      (storedPrompt) => storedPrompt.id === promptId
    )
    const versions = Array.isArray(prompt?.versions) ? prompt.versions : []
    const selectedVersion = versions.find(
      (version) => version.versionNumber === versionNumber
    )
    const currentVersion = versions.at(-1)

    if (
      !selectedVersion ||
      selectedVersion.versionNumber === currentVersion?.versionNumber
    ) {
      return
    }

    if (preserveUnsavedDraft()) {
      return
    }

    viewState = {
      ...viewState,
      pendingDeleteId: null,
      deletingId: null,
      deleteErrorId: null,
      statusMessage: '',
      statusMessageTone: 'success',
      errorMessage: '',
      editErrorMessage: '',
      createForm: createFormState(),
      editForm: createEditFormState(),
      restoreState: {
        promptId,
        versionNumber,
        isSubmitting: false,
        errorMessage: '',
      },
    }
    render({ type: 'restoreCancelButton', id: promptId, versionNumber })
  }

  function cancelRestore() {
    if (
      !isActive ||
      viewState.phase !== 'ready' ||
      viewState.restoreState.isSubmitting ||
      viewState.restoreState.promptId === null
    ) {
      return
    }

    const { promptId, versionNumber } = viewState.restoreState
    viewState = {
      ...viewState,
      restoreState: createRestoreState(),
    }
    render({ type: 'restoreButton', id: promptId, versionNumber })
  }

  function confirmRestore(promptId, versionNumber) {
    if (
      !isActive ||
      viewState.phase !== 'ready' ||
      viewState.restoreState.isSubmitting ||
      viewState.restoreState.promptId !== promptId ||
      viewState.restoreState.versionNumber !== versionNumber
    ) {
      return
    }

    viewState = {
      ...viewState,
      statusMessage: '',
      statusMessageTone: 'success',
      restoreState: {
        ...viewState.restoreState,
        isSubmitting: true,
        errorMessage: '',
      },
    }
    render()

    let result

    try {
      result = promptService?.restorePromptVersion?.(
        promptId,
        versionNumber
      )
    } catch {
      result = null
    }

    if (
      result?.ok === true &&
      Array.isArray(result.prompts) &&
      (result.status === 'restored' || result.status === 'unchanged')
    ) {
      const isUnchanged = result.status === 'unchanged'
      const derivedState = derivePromptPresentation(
        {
          ...viewState,
          statusMessage: isUnchanged
            ? 'Diese Fassung entspricht bereits dem aktuellen Stand.'
            : 'Version wiederhergestellt',
          statusMessageTone: isUnchanged ? 'notice' : 'success',
          restoreState: createRestoreState(),
        },
        result.prompts
      )
      const promptRemainsVisible = derivedState.visiblePrompts.some(
        (prompt) => prompt.id === promptId
      )
      viewState = {
        ...derivedState,
        historyPromptId: promptRemainsVisible ? promptId : null,
      }
      render(
        isUnchanged && promptRemainsVisible
          ? { type: 'restoreButton', id: promptId, versionNumber }
          : { type: 'statusMessage' }
      )
      return
    }

    viewState = {
      ...viewState,
      statusMessage: '',
      statusMessageTone: 'success',
      restoreState: {
        ...viewState.restoreState,
        isSubmitting: false,
        errorMessage: getRestoreErrorMessage(result),
      },
    }
    render({ type: 'restoreAlert', id: promptId, versionNumber })
  }

  function open() {
    isActive = true
    loadPrompts()
  }

  function close() {
    isActive = false
    cancelPendingLoad()
    viewState = createInitialState()
  }

  return Object.freeze({ open, close })
}
