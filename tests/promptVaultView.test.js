import assert from 'node:assert/strict'
import test from 'node:test'

import { createPromptVaultView } from '../src/modules/prompt-vault/promptVaultView.js'
import {
  createFakeDom,
  findAll,
  findByClass,
  findByTag,
} from './helpers/fakeDom.js'

function createVersion(versionNumber, overrides = {}) {
  return {
    versionNumber,
    title: 'Titel Version ' + versionNumber,
    category: 'Test',
    description: 'Beschreibung Version ' + versionNumber,
    content: 'Prompt-Text Version ' + versionNumber,
    createdAt:
      '2026-07-1' + versionNumber + 'T10:00:00.000Z',
    changeType: versionNumber === 1 ? 'created' : 'edited',
    restoredFromVersion: null,
    ...overrides,
  }
}

function createVersionedPrompt(overrides = {}) {
  const versions = [
    createVersion(1, {
      category: '',
      description: '',
      content: 'Erste Zeile\nZweite Zeile',
    }),
    createVersion(2),
    createVersion(3, {
      changeType: 'restored',
      restoredFromVersion: 1,
    }),
    createVersion(4),
  ]
  const currentVersion = versions.at(-1)

  return {
    id: 'prompt-view-001',
    title: currentVersion.title,
    category: currentVersion.category,
    description: currentVersion.description,
    content: currentVersion.content,
    createdAt: '2026-07-11T09:00:00.000Z',
    updatedAt: currentVersion.createdAt,
    isFavorite: true,
    isDemo: false,
    versions,
    ...overrides,
  }
}

function createViewState(prompts, overrides = {}) {
  const createForm = {
    isOpen: false,
    isSubmitting: false,
    openedFrom: null,
    values: {
      title: '',
      category: '',
      description: '',
      content: '',
    },
    fieldErrors: {},
    errorMessage: '',
  }
  const editForm = {
    isOpen: false,
    editingPromptId: null,
    isSubmitting: false,
    values: {
      title: '',
      category: '',
      description: '',
      content: '',
    },
    fieldErrors: {},
    errorMessage: '',
  }
  const restoreState = {
    promptId: null,
    versionNumber: null,
    isSubmitting: false,
    errorMessage: '',
  }

  return {
    phase: 'ready',
    prompts,
    visiblePrompts: prompts,
    categories: [...new Set(prompts.map((prompt) => prompt.category))]
      .filter(Boolean),
    searchQuery: '',
    selectedCategory: '',
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
    restoreState: {
      ...restoreState,
      ...overrides.restoreState,
    },
    createForm: {
      ...createForm,
      ...overrides.createForm,
    },
    editForm: {
      ...editForm,
      ...overrides.editForm,
    },
    ...overrides,
  }
}

function findElementByText(root, tagName, text) {
  const normalizedTagName = tagName.toUpperCase()

  return findAll(
    root,
    (node) =>
      node.nodeType === 1 &&
      node.tagName === normalizedTagName &&
      node.textContent === text
  )[0]
}

function findAncestorByClass(node, className) {
  let currentNode = node

  while (currentNode) {
    if (currentNode.classList?.contains(className)) {
      return currentNode
    }

    currentNode = currentNode.parentNode
  }

  return null
}

function getVersionEntry(root, versionNumber) {
  const heading = findElementByText(
    root,
    'h5',
    'Version ' + versionNumber
  )

  return findAncestorByClass(heading, 'prompt-version')
}

function renderWithFakeDom(viewState, actions = {}) {
  const fakeDom = createFakeDom()
  const view = createPromptVaultView(fakeDom.root)
  view.render(viewState, actions)

  return { ...fakeDom, view }
}

test('rendert eindeutige History-Buttons mit Anzahl und ARIA-Verknüpfung', () => {
  const firstPrompt = createVersionedPrompt()
  const secondPrompt = createVersionedPrompt({
    id: 'prompt-view-002',
    title: 'Zweiter Prompt',
  })
  const toggleCalls = []
  const rendered = renderWithFakeDom(
    createViewState([firstPrompt, secondPrompt], {
      historyPromptId: firstPrompt.id,
    }),
    {
      onToggleVersionHistory(promptId) {
        toggleCalls.push(promptId)
      },
    }
  )

  try {
    const historyButtons = findByClass(
      rendered.root,
      'prompt-history-trigger'
    )

    assert.equal(historyButtons.length, 2)
    assert.ok(
      historyButtons.every(
        (button) =>
          button.tagName === 'BUTTON' &&
          button.type === 'button' &&
          button.textContent === 'Versionen (4)'
      )
    )
    assert.deepEqual(
      historyButtons.map((button) => button.getAttribute('aria-expanded')),
      ['true', 'false']
    )
    const controlledIds = historyButtons.map((button) =>
      button.getAttribute('aria-controls')
    )
    assert.equal(new Set(controlledIds).size, controlledIds.length)
    assert.equal(findByClass(rendered.root, 'prompt-version-history')[0].id, controlledIds[0])

    const elementIds = findAll(
      rendered.root,
      (node) => node.nodeType === 1 && node.id
    ).map((element) => element.id)
    assert.equal(new Set(elementIds).size, elementIds.length)

    historyButtons[1].click()
    assert.deepEqual(toggleCalls, [secondPrompt.id])
  } finally {
    rendered.restore()
  }
})

test('zeigt Versionen neueste zuerst, übersetzt Typen und mutiert die Historie nicht', () => {
  const prompt = createVersionedPrompt()
  const versionsSnapshot = structuredClone(prompt.versions)
  const rendered = renderWithFakeDom(
    createViewState([prompt], { historyPromptId: prompt.id })
  )

  try {
    assert.deepEqual(
      findByClass(rendered.root, 'prompt-version__title').map(
        (heading) => heading.textContent
      ),
      ['Version 4', 'Version 3', 'Version 2', 'Version 1']
    )
    assert.deepEqual(prompt.versions, versionsSnapshot)
    assert.deepEqual(
      findByClass(rendered.root, 'prompt-version__change-type').map(
        (label) => label.textContent
      ),
      ['Bearbeitet', 'Wiederhergestellt', 'Bearbeitet', 'Erstellt']
    )
    assert.equal(
      findByClass(rendered.root, 'prompt-version__current-label')[0]
        .textContent,
      'Aktuelle Version'
    )
    assert.equal(
      findByClass(rendered.root, 'prompt-version__restored-from')[0]
        .textContent,
      'Wiederhergestellt aus Version 1'
    )
    assert.equal(findByClass(rendered.root, 'prompt-version__restore-button').length, 3)
    assert.equal(
      findByClass(getVersionEntry(rendered.root, 4), 'prompt-version__restore-button').length,
      0
    )
    assert.equal(findByTag(rendered.root, 'details').length, 5)
    assert.equal(findByTag(rendered.root, 'summary').length, 5)
    assert.deepEqual(
      findByTag(rendered.root, 'time').map((time) =>
        time.getAttribute('datetime')
      ),
      prompt.versions
        .map((version) => version.createdAt)
        .reverse()
    )

    const migratedPrompt = createVersionedPrompt({
      id: 'prompt-migrated-001',
      versions: [
        createVersion(1, {
          changeType: 'migrated',
        }),
      ],
    })
    migratedPrompt.title = migratedPrompt.versions[0].title
    migratedPrompt.category = migratedPrompt.versions[0].category
    migratedPrompt.description = migratedPrompt.versions[0].description
    migratedPrompt.content = migratedPrompt.versions[0].content
    rendered.view.render(
      createViewState([migratedPrompt], {
        historyPromptId: migratedPrompt.id,
      })
    )
    assert.equal(
      findByClass(rendered.root, 'prompt-version__change-type')[0]
        .textContent,
      'Als Ausgangsversion übernommen'
    )
  } finally {
    rendered.restore()
  }
})

test('gibt gespeicherte HTML-Strings und Zeilenumbrüche ausschließlich als Text aus', () => {
  const prompt = createVersionedPrompt()
  const maliciousTitle = '<script>globalThis.compromised = true</script>'
  const maliciousContent =
    'Zeile 1\n<img src=x onerror=globalThis.compromised=true>\nZeile 3'
  prompt.versions[0] = {
    ...prompt.versions[0],
    title: maliciousTitle,
    category: '',
    description: '',
    content: maliciousContent,
  }
  const rendered = renderWithFakeDom(
    createViewState([prompt], { historyPromptId: prompt.id })
  )

  try {
    const firstVersionEntry = getVersionEntry(rendered.root, 1)
    assert.ok(firstVersionEntry.textContent.includes(maliciousTitle))
    assert.ok(firstVersionEntry.textContent.includes(maliciousContent))
    assert.equal(findByTag(rendered.root, 'script').length, 0)
    assert.equal(findByTag(rendered.root, 'img').length, 0)
    assert.ok(firstVersionEntry.textContent.includes('Keine Kategorie'))
    assert.ok(firstVersionEntry.textContent.includes('Keine Beschreibung'))
    assert.equal(
      findByClass(
        firstVersionEntry,
        'prompt-version-field__value--prompt'
      )[0].textContent,
      maliciousContent
    )
  } finally {
    rendered.restore()
  }
})

test('ordnet Restore-Aktion und Inline-Bestätigung exakt der Version zu', () => {
  const prompt = createVersionedPrompt()
  const requestCalls = []
  const confirmCalls = []
  let cancelCalls = 0
  const actions = {
    onRequestRestore(promptId, versionNumber) {
      requestCalls.push([promptId, versionNumber])
    },
    onCancelRestore() {
      cancelCalls += 1
    },
    onConfirmRestore(promptId, versionNumber) {
      confirmCalls.push([promptId, versionNumber])
    },
  }
  const rendered = renderWithFakeDom(
    createViewState([prompt], { historyPromptId: prompt.id }),
    actions
  )

  try {
    findByClass(
      getVersionEntry(rendered.root, 1),
      'prompt-version__restore-button'
    )[0].click()
    assert.deepEqual(requestCalls, [[prompt.id, 1]])

    rendered.view.render(
      createViewState([prompt], {
        historyPromptId: prompt.id,
        restoreState: {
          promptId: prompt.id,
          versionNumber: 1,
          isSubmitting: false,
          errorMessage: '',
        },
      }),
      actions
    )
    const confirmation = findByClass(
      rendered.root,
      'restore-confirmation'
    )[0]
    assert.ok(
      confirmation.textContent.includes(
        'Version 1 wirklich wiederherstellen?'
      )
    )
    assert.ok(
      confirmation.textContent.includes(
        'Der aktuelle Stand bleibt in der Historie erhalten.'
      )
    )
    const cancelButton = findElementByText(
      confirmation,
      'button',
      'Abbrechen'
    )
    const confirmButton = findElementByText(
      confirmation,
      'button',
      'Als neue Version wiederherstellen'
    )
    cancelButton.click()
    confirmButton.click()
    assert.equal(cancelCalls, 1)
    assert.deepEqual(confirmCalls, [[prompt.id, 1]])

    rendered.view.render(
      createViewState([prompt], {
        historyPromptId: prompt.id,
        restoreState: {
          promptId: prompt.id,
          versionNumber: 1,
          isSubmitting: true,
          errorMessage: '',
        },
      }),
      actions
    )
    const busyConfirmation = findByClass(
      rendered.root,
      'restore-confirmation'
    )[0]
    assert.equal(busyConfirmation.getAttribute('aria-busy'), 'true')
    assert.ok(
      findByTag(busyConfirmation, 'button').every(
        (button) => button.disabled
      )
    )
  } finally {
    rendered.restore()
  }
})

test('fokussiert Historie, Bestätigung, Fehler, Restore-Button und Live-Status', () => {
  const prompt = createVersionedPrompt()
  const rendered = renderWithFakeDom(
    createViewState([prompt], {
      historyPromptId: prompt.id,
      focusTarget: { type: 'historyHeading', id: prompt.id },
    })
  )

  try {
    assert.equal(rendered.document.activeElement.textContent, 'Versionshistorie')

    rendered.view.render(
      createViewState([prompt], {
        historyPromptId: prompt.id,
        restoreState: {
          promptId: prompt.id,
          versionNumber: 1,
          isSubmitting: false,
          errorMessage: '',
        },
        focusTarget: {
          type: 'restoreCancelButton',
          id: prompt.id,
          versionNumber: 1,
        },
      })
    )
    assert.equal(rendered.document.activeElement.textContent, 'Abbrechen')

    rendered.view.render(
      createViewState([prompt], {
        historyPromptId: prompt.id,
        focusTarget: {
          type: 'restoreButton',
          id: prompt.id,
          versionNumber: 1,
        },
      })
    )
    assert.equal(
      rendered.document.activeElement.textContent,
      'Diese Version wiederherstellen'
    )

    rendered.view.render(
      createViewState([prompt], {
        historyPromptId: prompt.id,
        restoreState: {
          promptId: prompt.id,
          versionNumber: 1,
          isSubmitting: false,
          errorMessage: 'Wiederherstellung fehlgeschlagen.',
        },
        focusTarget: {
          type: 'restoreAlert',
          id: prompt.id,
          versionNumber: 1,
        },
      })
    )
    assert.equal(
      rendered.document.activeElement.getAttribute('role'),
      'alert'
    )
    assert.equal(
      rendered.document.activeElement.textContent,
      'Wiederherstellung fehlgeschlagen.'
    )

    rendered.view.render(
      createViewState([prompt], {
        statusMessage:
          'Diese Fassung entspricht bereits dem aktuellen Stand.',
        statusMessageTone: 'notice',
        focusTarget: { type: 'statusMessage' },
      })
    )
    assert.equal(
      rendered.document.activeElement.textContent,
      'Diese Fassung entspricht bereits dem aktuellen Stand.'
    )
    assert.equal(
      rendered.document.activeElement.classList.contains(
        'prompt-feedback--notice'
      ),
      true
    )
  } finally {
    rendered.restore()
  }
})
