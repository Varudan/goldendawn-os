import './style.css'
import './modules/prompt-vault/promptVault.css'

import { createPromptVaultController } from './modules/prompt-vault/promptVaultController.js'
import { createPromptVaultView } from './modules/prompt-vault/promptVaultView.js'
import { createPromptService } from './services/promptService.js'
import { createPromptStorage } from './storage/promptStorage.js'
import { createStorageAdapter } from './storage/storageAdapter.js'

const VIEW_COMMAND_CENTER = 'command-center'
const VIEW_PROMPT_VAULT = 'prompt-vault'

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
      'Prompts lokal durchsuchen, nach Kategorie filtern und favorisieren',
    status: 'Lokales MVP',
    statusClass: 'local',
    navigationState: 'Lokales MVP',
    isNavigable: true,
  },
  {
    id: 'learning-core',
    name: 'Learning Core',
    description: 'Lernziele und Fortschritt bündeln',
    status: 'Geplant',
    statusClass: 'planned',
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
    name: 'Lichtwald Log',
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
        <h2 id="focus-title">v0.2.0 – Local Dashboard MVP</h2>
        <p>Das Command Center und PromptVault mit lokaler Suche, Kategorie-Filtern und persistenten Favoriten sind nutzbar. Bearbeiten und Versionierung bleiben geplant.</p>
      </div>
      <div class="phase-progress">
        <div class="progress-meta">
          <span>Fortschritt der Phase</span>
          <strong>3 von 5 Ausbauschritten</strong>
        </div>
        <div
          class="progress-track"
          role="progressbar"
          aria-label="Fortschritt der aktuellen Phase"
          aria-valuemin="0"
          aria-valuemax="5"
          aria-valuenow="3"
        >
          <span></span>
        </div>
        <small>Command Center aktiv · Suche und Favoriten lokal nutzbar · Bearbeiten geplant</small>
      </div>
    </section>

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

    <aside class="milestone" aria-labelledby="milestone-title">
      <span class="milestone-icon" aria-hidden="true">→</span>
      <div>
        <span class="eyebrow">Nächster Meilenstein</span>
        <h2 id="milestone-title">Prompts bearbeiten</h2>
        <p>Als nächster PromptVault-Ausbauschritt ist das Bearbeiten vorhandener Prompts geplant. Versionierung folgt erst danach.</p>
      </div>
      <span class="status status--planned">Geplant</span>
    </aside>
  `
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
  activeView = viewName
  updateNavigation(activeView)

  if (activeView === VIEW_PROMPT_VAULT) {
    document.title = 'GoldenDawn OS – PromptVault'
    promptVaultController.open()
  } else {
    document.title = 'GoldenDawn OS – Command Center'
    renderCommandCenter()
  }

  if (moveFocus && activeView !== VIEW_PROMPT_VAULT) {
    focusViewHeading()
  }
}

document.querySelectorAll('.nav-button[data-view]').forEach((button) => {
  button.addEventListener('click', () => {
    showView(button.dataset.view, { moveFocus: true })
  })
})

showView(VIEW_COMMAND_CENTER)
