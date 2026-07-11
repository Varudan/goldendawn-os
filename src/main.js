import './style.css'

const modules = [
  ['Command Center', 'Übersicht und Projektstatus', 'Aktiv', 'active'],
  ['PromptVault', 'Prompts sammeln, ordnen und weiterentwickeln', 'Als Nächstes', 'next'],
  ['Learning Core', 'Lernziele und Fortschritt bündeln', 'Geplant', 'planned'],
  ['Agent Hub', 'Agentenrollen und Abläufe überblicken', 'Geplant', 'planned'],
  ['Automation Hub', 'Automatisierungen zentral koordinieren', 'Geplant', 'planned'],
  ['Lichtwald Log', 'Erkenntnisse und Reflexionen festhalten', 'Geplant', 'planned'],
  ['Weekly Review', 'Die Woche bewusst auswerten', 'Geplant', 'planned'],
]
const navigation = modules.map(([name], index) => `<li><span class="nav-item${index === 0 ? ' is-active' : ''}"${index === 0 ? ' aria-current="page"' : ''}><span class="nav-marker" aria-hidden="true"></span>${name}${index > 0 ? `<span class="nav-state">${index === 1 ? 'Als Nächstes' : 'Geplant'}</span>` : ''}</span></li>`).join('')
const moduleCards = modules.map(([name, description, status, statusClass]) => `<article class="module-card module-card--${statusClass}"><div class="module-card__heading"><h3>${name}</h3><span class="status status--${statusClass}">${status}</span></div><p>${description}</p></article>`).join('')

document.querySelector('#app').innerHTML = `
<div class="app-shell"><aside class="sidebar"><header class="brand"><span class="brand-mark" aria-hidden="true">GD</span><div><strong>GoldenDawn OS</strong><span>Lichtwaldzentrale</span></div><span class="mobile-mode-status"><span aria-hidden="true"></span>Lokal</span></header><div class="mode-status"><span aria-hidden="true"></span>Lokaler Modus</div><nav aria-label="Hauptnavigation"><p class="nav-label">Bereiche</p><ul>${navigation}</ul></nav><footer class="sidebar-footer"><span>Local Dashboard MVP</span><strong>– v0.2.0</strong></footer></aside>
<main class="main-content"><header class="topbar"><div><span class="eyebrow">Command Center</span><h1>Willkommen zurück, Jan</h1></div><span class="system-state"><span aria-hidden="true"></span>Lokaler Modus</span></header>
<section class="focus-panel" aria-labelledby="focus-title"><div><span class="eyebrow">Aktueller Fokus</span><h2 id="focus-title">v0.2.0 – Local Dashboard MVP</h2><p>Das Command Center steht. Als nächster Schritt entsteht mit PromptVault das erste lokal nutzbare Modul.</p></div><div class="phase-progress"><div class="progress-meta"><span>Fortschritt der Phase</span><strong>1 von 2 Kernbereichen</strong></div><div class="progress-track" role="progressbar" aria-label="Fortschritt der aktuellen Phase" aria-valuemin="0" aria-valuemax="2" aria-valuenow="1"><span></span></div><small>Command Center aktiv · PromptVault als Nächstes</small></div></section>
<section class="modules-section" aria-labelledby="modules-title"><div class="section-heading"><div><span class="eyebrow">Systemübersicht</span><h2 id="modules-title">Module</h2></div><p>Ein klarer Blick auf den aktuellen Ausbau.</p></div><div class="module-grid">${moduleCards}</div></section>
<aside class="milestone" aria-labelledby="milestone-title"><span class="milestone-icon" aria-hidden="true">→</span><div><span class="eyebrow">Nächster Meilenstein</span><h2 id="milestone-title">PromptVault</h2><p>Eine lokale Bibliothek zum Erfassen, Strukturieren und Weiterentwickeln von Prompts.</p></div><span class="status status--next">Als Nächstes</span></aside></main></div>`
