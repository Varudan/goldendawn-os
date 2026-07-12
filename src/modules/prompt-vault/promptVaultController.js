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

function getFavoriteErrorMessage(result) {
  return (
    FAVORITE_ERROR_MESSAGES[result?.status] ??
    'Der Favoritenstatus konnte nicht gespeichert werden und blieb unverändert.'
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

function clonePrompts(prompts) {
  return prompts.map((prompt) => ({ ...prompt }))
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
    onRequestDelete: requestDelete,
    onCancelDelete: cancelDelete,
    onConfirmDelete: confirmDelete,
    onChangeSearchQuery: changeSearchQuery,
    onChangeCategory: changeCategory,
    onChangeFavoritesOnly: changeFavoritesOnly,
    onResetFilters: resetFilters,
    onSetPromptFavorite: setPromptFavorite,
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
      viewState = derivePromptPresentation(
        {
          ...viewState,
          pendingDeleteId: null,
          deletingId: null,
          deleteErrorId: null,
          statusMessage: 'Prompt erstellt',
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
