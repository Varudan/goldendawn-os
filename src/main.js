import './style.css'
import './modules/prompt-vault/promptVault.css'
import './modules/learning-hub/learningHub.css'

import { createLearningHubController } from './modules/learning-hub/learningHubController.js'
import { createLearningHubView } from './modules/learning-hub/learningHubView.js'
import { createPromptVaultController } from './modules/prompt-vault/promptVaultController.js'
import { createPromptVaultView } from './modules/prompt-vault/promptVaultView.js'
import { createLearningHubService } from './services/learningHubService.js'
import { createLearningProgressService } from './services/learningProgressService.js'
import { createPromptService } from './services/promptService.js'
import { createLearningHubStorage } from './storage/learningHubStorage.js'
import { createLearningProgressStorage } from './storage/learningProgressStorage.js'
import { createPromptStorage } from './storage/promptStorage.js'
import { createStorageAdapter } from './storage/storageAdapter.js'
import {
  ensureNavigationItemVisible,
  findActiveNavigationElements,
} from './navigationVisibility.js'

const VIEW_COMMAND_CENTER = 'command-center'
const VIEW_PROMPT_VAULT = 'prompt-vault'
const VIEW_LEARNING_HUB = 'learning-hub'

const modules = [
  {
    id: VIEW_COMMAND_CENTER,
    name: 'Command Center',
    description: 'Übersicht und Projektstatus',
    status: 'Aktiv',
    statusClass: 'active',
    isNavigable: true,
  },
  {
    id: VIEW_PROMPT_VAULT,
    name: 'PromptVault',
    description:
      'Prompts lokal anzeigen, erstellen, bearbeiten, löschen, durchsuchen, filtern, favorisieren, versionieren und wiederherstellen',
    status: 'Lokales MVP',
    statusClass: 'local',
    navigationState: 'Lokales MVP',
    isNavigable: true,
  },
  {
    id: VIEW_LEARNING_HUB,
    name: 'LearningHub',
    description:
      'Eigene Lernmodule, Kapitel, LearningNodes und Lernfortschritt lokal verwalten',
    status: 'In Arbeit',
    statusClass: 'next',
    navigationState: 'In Arbeit',
    isNavigable: true,
  },
  {
    id: 'agent-hub',
    name: 'Agent Hub',
    description: 'Agentenrollen und Abläufe überblicken',
    status: 'Geplant',
    statusClass: 'planned',
  },
  {
    id: 'automation-hub',
    name: 'Automation Hub',
    description: 'Automatisierungen zentral koordinieren',
    status: 'Geplant',
    statusClass: 'planned',
  },
  {
    id: 'lichtwald-log',
    name: 'LichtwaldLog',
    description: 'Erkenntnisse und Reflexionen festhalten',
    status: 'Geplant',
    statusClass: 'planned',
  },
  {
    id: 'weekly-review',
    name: 'Weekly Review',
    description: 'Die Woche bewusst auswerten',
    status: 'Geplant',
    statusClass: 'planned',
  },
]

function createNavigationItem(module) {
  const state = module.navigationState
    ? `<span class="nav-state">${module.navigationState}</span>`
    : ''
  const content = `
    <span class="nav-marker" aria-hidden="true"></span>
    <span>${module.name}</span>
    ${state}
  `

  if (module.isNavigable) {
    return `
      <li>
        <button
          type="button"
          class="nav-item nav-button"
          data-view="${module.id}"
        >
          ${content}
        </button>
      </li>
    `
  }

  return `
    <li>
      <span class="nav-item" aria-disabled="true">
        ${content}
      </span>
    </li>
  `
}

const navigation = modules.map(createNavigationItem).join('')

const moduleCards = modules
  .map(
    ({ name, description, status, statusClass }) => `
      <article class="module-card module-card--${statusClass}">
        <div class="module-card__heading">
          <h3>${name}</h3>
          <span class="status status--${statusClass}">${status}</span>
        </div>
        <p>${description}</p>
      </article>
    `
  )
  .join('')

const appRoot = document.querySelector('#app')

appRoot.innerHTML = `
  <div class="app-shell">
    <aside class="sidebar">
      <header class="brand">
        <span class="brand-mark" aria-hidden="true">GD</span>
        <div>
          <strong>GoldenDawn OS</strong>
          <span>Lichtwaldzentrale</span>
        </div>
        <span class="mobile-mode-status">
          <span aria-hidden="true"></span>
          Lokal
        </span>
      </header>

      <div class="mode-status">
        <span aria-hidden="true"></span>
        Lokaler Modus
      </div>

      <nav aria-label="Hauptnavigation">
        <p class="nav-label">Bereiche</p>
        <ul>
          ${navigation}
        </ul>
      </nav>

      <footer class="sidebar-footer">
        <span>Local Dashboard MVP</span>
        <strong>– v0.2.0</strong>
      </footer>
    </aside>

    <main class="main-content" id="view-outlet"></main>
  </div>
`

const viewOutlet = document.querySelector('#view-outlet')

let storageImplementation = null

try {
  storageImplementation = window.localStorage
} catch {
  storageImplementation = null
}

const storageAdapter = createStorageAdapter(storageImplementation)
const promptStorage = createPromptStorage(storageAdapter)
const promptService = createPromptService({ promptStorage })
const promptVaultView = createPromptVaultView(viewOutlet)
const promptVaultController = createPromptVaultController({
  promptService,
  promptVaultView,
})
const learningHubStorage = createLearningHubStorage(storageAdapter)
const learningHubService = createLearningHubService({ learningHubStorage })
const learningProgressStorage = createLearningProgressStorage(storageAdapter)
const learningProgressService = createLearningProgressService({
  learningProgressStorage,
  learningHubService,
})
const learningHubView = createLearningHubView(viewOutlet)
const learningHubController = createLearningHubController({
  learningHubService,
  learningProgressService,
  learningHubView,
})

function renderCommandCenter() {
  viewOutlet.innerHTML = `
    <header class="topbar">
      <div>
        <span class="eyebrow">Command Center</span>
        <h1 tabindex="-1">Willkommen zurück, Jan</h1>
      </div>
      <span class="system-state">
        <span aria-hidden="true"></span>
        Lokaler Modus
      </span>
    </header>

    <section class="focus-panel" aria-labelledby="focus-title">
      <div>
        <span class="eyebrow">Aktueller Fokus</span>
        <h2 id="focus-title">v0.2.1 – LearningHub Local MVP in Arbeit</h2>
        <p>Command Center und PromptVault bleiben lokal nutzbar. Im LearningHub sind die private Inhaltsverwaltung für Module, Kapitel und LearningNodes sowie Kapitelabschluss und Modulfortschritt jetzt bedienbar. Notizen, Zusammenfassungen und der lokale Mock-Test folgen in weiteren, getrennten Arbeitsschritten.</p>
      </div>
      <div class="phase-progress">
        <div class="progress-meta">
          <span>Aktueller Teilstand</span>
          <strong>Lokale Inhalte und Fortschritt bedienbar</strong>
        </div>
        <small>LearningHub-Inhalte und -Fortschritt bleiben im aktuellen Browserprofil. Es gibt keine Cloud-Sicherung oder geräteübergreifende Synchronisierung.</small>
      </div>
    </section>

    <aside class="milestone" aria-labelledby="milestone-title">
      <span class="milestone-icon" aria-hidden="true">→</span>
      <div>
        <span class="eyebrow">Nächster Ausbauschritt</span>
        <h2 id="milestone-title">Notizen und Zusammenfassungen</h2>
        <p>Als Nächstes ergänzen wir lokale Notizen und Zusammenfassungen hinter eigenen Service- und Storage-Grenzen. Der lokale Mock-Test folgt später und bleibt davon getrennt.</p>
      </div>
      <span class="status status--next">Als Nächstes</span>
    </aside>

    <section class="modules-section" aria-labelledby="modules-title">
      <div class="section-heading">
        <div>
          <span class="eyebrow">Systemübersicht</span>
          <h2 id="modules-title">Module</h2>
        </div>
        <p>Ein klarer Blick auf den aktuellen Ausbau.</p>
      </div>
      <div class="module-grid">
        ${moduleCards}
      </div>
    </section>
  `
}

let pendingNavigationVisibilityFrame = null

function scheduleActiveNavigationVisibility() {
  const runVisibilityCheck = () => {
    pendingNavigationVisibilityFrame = null
    const { navigationElement, activeItem } =
      findActiveNavigationElements(document)
    const prefersReducedMotion =
      typeof globalThis.matchMedia === 'function' &&
      globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches

    ensureNavigationItemVisible(navigationElement, activeItem, {
      prefersReducedMotion,
    })
  }

  if (
    pendingNavigationVisibilityFrame !== null &&
    typeof globalThis.cancelAnimationFrame === 'function'
  ) {
    globalThis.cancelAnimationFrame(pendingNavigationVisibilityFrame)
  }

  if (typeof globalThis.requestAnimationFrame === 'function') {
    pendingNavigationVisibilityFrame =
      globalThis.requestAnimationFrame(runVisibilityCheck)
  } else {
    runVisibilityCheck()
  }
}

function updateNavigation(activeView) {
  document.querySelectorAll('.nav-button[data-view]').forEach((button) => {
    const isActive = button.dataset.view === activeView
    button.classList.toggle('is-active', isActive)

    if (isActive) {
      button.setAttribute('aria-current', 'page')
    } else {
      button.removeAttribute('aria-current')
    }
  })

  scheduleActiveNavigationVisibility()
}

function focusViewHeading() {
  const heading = viewOutlet.querySelector('h1')

  if (typeof heading?.focus === 'function') {
    heading.focus({ preventScroll: true })
  }
}

let activeView = null

function showView(viewName, { moveFocus = false } = {}) {
  if (viewName === activeView) {
    return
  }

  promptVaultController.close()
  learningHubController.close()
  activeView = viewName
  updateNavigation(activeView)

  if (activeView === VIEW_PROMPT_VAULT) {
    document.title = 'GoldenDawn OS – PromptVault'
    promptVaultController.open()
  } else if (activeView === VIEW_LEARNING_HUB) {
    document.title = 'GoldenDawn OS – LearningHub'
    learningHubController.open()
  } else {
    document.title = 'GoldenDawn OS – Command Center'
    renderCommandCenter()
  }

  if (moveFocus && activeView === VIEW_COMMAND_CENTER) {
    focusViewHeading()
  }
}

document.querySelectorAll('.nav-button[data-view]').forEach((button) => {
  button.addEventListener('click', () => {
    showView(button.dataset.view, { moveFocus: true })
  })
})

showView(VIEW_COMMAND_CENTER)
