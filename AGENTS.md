# GoldenDawn OS – Projektanweisungen

## Geltungsbereich

Diese Datei gilt für das gesamte Repository. Eine tiefer liegende `AGENTS.md`
darf für ihren Verzeichnisbereich ergänzende oder speziellere Regeln definieren.

## Projektziel

GoldenDawn OS ist die Jan & Arisa Lichtwaldzentrale: ein persönliches Dashboard
für Lernen, Projekte, Prompt Engineering, Automatisierung, Reflexion und
Fortschritt sowie ein professionelles Portfolio-Projekt für ein späteres
Multi-Agenten-System.

Das System wird schrittweise von einem lokalen, stabilen MVP zu einer modularen
AI-Operations-Zentrale erweitert. Persönliche Nutzbarkeit, nachvollziehbare
Architekturentscheidungen, Sicherheit und Portfolio-Tauglichkeit sind
gleichwertige Ziele.

## Aktuelle Projektphase

Aktueller Stand: `v0.2.0 – Local Dashboard MVP in Arbeit`

In dieser Phase liegt der Fokus auf:

- dem bereits umgesetzten responsiven Command-Center-Shell;
- der bereits umgesetzten ersten PromptVault-Modulstruktur;
- dem bereits umgesetzten gemeinsamen Storage-Adapter für robuste lokale
  Speicherung;
- PromptVault als erstem lokal nutzbaren MVP-Modul mit Anzeigen, Erstellen,
  Bearbeiten, dauerhaftem Löschen, lokaler Textsuche, Kategorie-Filtern und
  persistenten Favoriten;
- dem weiteren PromptVault-Ausbau mit Versionierung als nächstem Schritt.

Noch nicht Teil dieser Phase sind:

- Airtable-Integrationen;
- Webhooks oder die Anbindung des SyncAgent;
- echte LLM- oder Agentenlogik;
- Authentifizierung und Benutzerverwaltung;
- ein eigenes Backend;
- produktives Deployment;
- echte private oder gesundheitsbezogene Daten im Portfolio-Modus.

## Verbindliche Entwicklungsreihenfolge

Halte diese Reihenfolge ein:

1. lokaler Mock und stabile Benutzeroberfläche;
2. standardisierter Sync-Vertrag;
3. n8n-Webhook und SyncAgent;
4. Airtable oder eine andere strukturierte Datenquelle;
5. DatenAgent und TestAgent als erste spezialisierte Agentenlogik;
6. getrennte private und öffentliche Deployments.

Implementiere keine spätere Phase vorzeitig, sofern die Aufgabe dies nicht
ausdrücklich verlangt und die dafür notwendige Architekturentscheidung nicht
dokumentiert wurde.

## Technischer Rahmen

- Verwende Vite mit Vanilla JavaScript, HTML und CSS.
- Führe React oder ein anderes Frontend-Framework nicht ohne dokumentierte
  Entscheidung ein.
- Führe zunächst kein eigenes Backend ein.
- Füge keine neue Abhängigkeit hinzu und ändere `package.json` nicht, sofern die
  Aufgabe dies nicht ausdrücklich erfordert.
- Bevorzuge Browser- und Plattformfunktionen gegenüber zusätzlichen Paketen.
- Verwende ES-Module.
- Halte Funktionen klein, eindeutig benannt und möglichst frei von verstecktem
  globalem Zustand.
- Vermeide vorzeitige Abstraktionen und generische Framework-Schichten ohne
  aktuellen Anwendungsfall.

## Zielarchitektur

Der vorgesehene Datenfluss lautet:

```text
UI-Komponente
  → Anwendungs- oder Modulservice
  → lokaler Storage-Adapter oder Sync-Service
  → SyncAgent in n8n
  → TestAgent oder DatenAgent
  → Airtable ausschließlich über den DatenAgent
```

Dabei gelten folgende Grenzen:

- UI-Komponenten sind für Darstellung und Benutzerinteraktion zuständig.
- UI-Komponenten greifen nicht direkt auf `localStorage`, Airtable, n8n,
  OpenAI oder andere externe Dienste zu.
- Storage-Adapter kapseln die lokale Speicherung vollständig.
- Services koordinieren Validierung, Speicherung und Synchronisation.
- Der Sync-Service ist die einzige vorgesehene externe Kommunikationsschicht
  des Frontends.
- Der SyncAgent validiert, klassifiziert und routet externe Requests.
- Der SyncAgent greift nicht selbst auf Airtable zu, sobald der DatenAgent
  eingeführt wurde, sondern übergibt strukturierte Datenaufträge an ihn.
- Echte Agentenlogik lebt später in n8n oder einem Backend, nicht in
  Frontend-Komponenten.

## Agenten-Scope für Version 1

Version 1 verwendet ausschließlich diese drei Agentenrollen:

- `SyncAgent`: zentrale Kommunikations-, Validierungs- und Routing-Schicht. Er
  ist der einzige vorgesehene Einstiegspunkt des Dashboards in das
  Agentensystem und entscheidet, welcher Agent eine Anfrage verarbeitet.
- `TestAgent`: fachlich der Prüfer für das Lernen. Er erstellt strukturierte
  Lerntests, bewertet Antworten und liefert nachvollziehbare Ergebnisse und
  Wiederholungshinweise. Er speichert Ergebnisse nicht selbst in Airtable.
- `DatenAgent`: fachlich der Bibliothekar und zentrale Datenverwalter. Er
  verarbeitet strukturierte Lese- und Schreibaufträge und kapselt sämtliche
  Airtable-Zugriffe des Agentensystems.

Für Version 1 werden keine weiteren Agentenrollen geplant oder implementiert.
Neue Rollen werden erst nach Auswertung dieser drei Agenten in einer späteren
Version beschlossen und dokumentiert.

Der vorgesehene Ablauf für ein Lerntestergebnis lautet:

```text
Dashboard
  → SyncAgent
  → TestAgent
  → SyncAgent
  → DatenAgent
  → Airtable
```

Der `TestAgent` konzentriert sich auf Prüfungslogik, der `DatenAgent` auf
Datenzugriffe und der `SyncAgent` auf Kommunikation und Routing. Diese
Verantwortlichkeiten dürfen nicht vermischt werden.

Agentennamen verwenden PascalCase und enden mit `Agent`. Maschinenlesbare Typen
und Aktionen verwenden stabile englische Bezeichner in `camelCase` oder
`snake_case`; innerhalb eines Vertrags darf nicht zwischen beiden Stilen
gewechselt werden.

## Daten- und Sync-Verträge

Externe Requests müssen einem dokumentierten Vertrag folgen. Ein vorgesehener
Basis-Request lautet:

```json
{
  "version": "1.0",
  "action": "syncTest",
  "source": "goldendawn-os",
  "requestId": "optional-stable-id",
  "timestamp": "2026-07-11T12:00:00.000Z",
  "payload": {}
}
```

Regeln:

- Ändere Vertragsfelder nicht stillschweigend.
- Dokumentiere Verträge und Änderungen in `docs/data-contracts.md`.
- Validiere Pflichtfelder an Systemgrenzen.
- Behandle unbekannte Aktionen kontrolliert als `unknown` oder lehne sie mit
  einer verständlichen Fehlermeldung ab.
- Verwende ISO 8601 für Zeitstempel und UTC für systemübergreifende Ereignisse.
- Speichere reine Kalenderdaten als `YYYY-MM-DD` und formatiere sie erst für die
  Anzeige. Parse reine Datumswerte nicht unnötig mit `new Date(...)`, um
  Zeitzonenverschiebungen zu vermeiden.
- Verwende stabile IDs. Sichtbare Texte oder Array-Positionen sind keine
  dauerhaften IDs.

## Storage-Regeln

- Verwende für lokale MVP-Daten `localStorage` nur hinter einem Storage-Adapter.
- Jede Domäne erhält einen eindeutig benannten Storage-Key.
- Beschädigte oder unerwartete JSON-Daten dürfen die Anwendung nicht zum
  Absturz bringen.
- Verwende sichere Fallback-Werte und melde relevante Fehler nachvollziehbar.
- Vermische Daten verschiedener Module nicht in einem unstrukturierten
  Sammelobjekt.
- Speichere PromptVault-Suchbegriffe und -Filterzustände nicht. Persistente
  Favoriten verwenden ausschließlich den bestehenden Datenfluss über
  `PromptService`, `PromptStorage` und `StorageAdapter` sowie den Storage-Key
  `goldendawn.promptVault.v1`.
- Plane Migrationen ein, bevor ein bestehendes Datenformat geändert wird.
- Mock-Daten müssen klar als Mock- oder Demo-Daten erkennbar sein.

## Sicherheit und Datenschutz

- Speichere niemals API-Schlüssel, Tokens, Passwörter oder Credentials im
  Frontend, Repository oder in Beispieldaten.
- Behandle alle `VITE_*`-Variablen als öffentlich, da sie in den Frontend-Build
  gelangen können.
- Greife aus dem Frontend nicht direkt auf Airtable oder OpenAI zu.
- Committe keine produktiven Webhook-URLs, wenn sie als Zugang oder Schutzmerkmal
  dienen können.
- Validiere und begrenze Payloads im Frontend und erneut in n8n oder im Backend.
- Protokolliere keine Secrets oder unnötigen personenbezogenen Inhalte.
- Verwende für die spätere öffentliche Demo ausschließlich bereinigte,
  synthetische Seed-Daten.
- Private und öffentliche Daten benötigen getrennte Konfigurationen,
  Datenquellen und Deployments.
- Ergänze Sicherheitsentscheidungen in `docs/security.md`.

## UI- und Qualitätsprinzipien

- Gestalte ruhig, klar, responsiv und zugänglich.
- Verwende semantisches HTML und verständliche Beschriftungen.
- Tastaturbedienung und sichtbare Fokuszustände dürfen nicht verloren gehen.
- Lade-, Leer-, Erfolgs- und Fehlerzustände müssen bewusst gestaltet werden.
- Vermeide blockierende Browserdialoge, wenn ein zugänglicher UI-Zustand
  sinnvoller ist.
- Verwende UTF-8 und schreibe deutsche Umlaute nativ.
- Halte Design-Tokens und wiederkehrende Werte zentral, sobald echte
  Wiederverwendung entsteht.
- Behaupte in der Oberfläche oder Dokumentation keine Funktion als fertig, die
  nur geplant oder gemockt ist.

## Benennung und Struktur

- JavaScript-Variablen und Funktionen: `camelCase`.
- Konstanten mit globaler Bedeutung: `UPPER_SNAKE_CASE`.
- Agenten und fachliche Rollen: `PascalCase`.
- Modulordner: `kebab-case`.
- Service-Dateien: beispielsweise `syncService.js`.
- Storage-Dateien: beispielsweise `promptStorage.js` oder
  `storageAdapter.js`.
- Funktionen verwenden handlungsorientierte Namen wie `loadPrompts`,
  `savePrompt` oder `validateSyncRequest`.
- Vermeide nichtssagende Namen wie `data`, `item`, `handler` oder `utils`, wenn
  ein präziser fachlicher Name möglich ist.

## Dokumentation

- `README.md` beschreibt den öffentlich verständlichen Projektstand.
- `docs/architecture.md` beschreibt Komponenten, Datenfluss und Systemgrenzen.
- `docs/roadmap.md` enthält Phasen und überprüfbare Ergebnisse.
- `docs/security.md` dokumentiert Sicherheits- und Datenschutzregeln.
- `docs/data-contracts.md` enthält Request-, Response- und Datenformate.
- `docs/decisions/` enthält Architecture Decision Records für wesentliche
  Entscheidungen.
- Aktualisiere Dokumentation, wenn eine Änderung Architektur, Verträge,
  Sicherheit, Setup oder sichtbaren Projektstatus betrifft.
- Dokumentiere Entscheidungen und Gründe, nicht nur das Endergebnis.

## Arbeitsweise für Coding-Agenten

Vor einer Änderung:

1. Lies die relevanten Dateien und prüfe den aktuellen Projektstand.
2. Berücksichtige vorhandene Nutzeränderungen und fasse sie nicht ohne Grund an.
3. Bestimme die kleinste zusammenhängende Änderung, die die Aufgabe erfüllt.
4. Weise auf einen Konflikt mit diesen Regeln hin, bevor du davon abweichst.

Während einer Änderung:

1. Ändere nur Dateien, die für die Aufgabe notwendig sind.
2. Führe keine unaufgeforderten Großrefactorings durch.
3. Bewahre bestehendes Verhalten, sofern die Aufgabe keine Änderung verlangt.
4. Kapsle neue Datenzugriffe hinter Services oder Adaptern.
5. Ergänze robuste Fehler- und Leerzustände.

Nach einer Änderung:

1. Führe mindestens `npm run build` aus.
2. Führe vorhandene relevante Tests und statische Prüfungen aus.
3. Prüfe `git diff` und `git status` auf unbeabsichtigte Änderungen.
4. Berichte knapp über geänderte Dateien, Verhalten, Prüfungen und verbleibende
   Grenzen.
5. Schlage bei Bedarf einen Branch-Namen, eine Commit-Nachricht und die
   passenden Git-Befehle vor, führe sie aber nicht selbst aus.

## Git-Konventionen

- Git-Operationen mit Repository-Wirkung bleiben manuell bei Jan.
- Coding-Agenten führen niemals selbstständig `git commit`, `git push`,
  `gh pr create`, Merge-, Tag- oder Release-Befehle aus.
- Coding-Agenten dürfen lesende Befehle wie `git status`, `git diff` und
  `git log` zur Prüfung verwenden.
- Nach einer fertigen Änderung berichtet der Coding-Agent den geprüften Stand
  und schlägt passende manuelle Befehle vor.
- Arbeite für zusammenhängende Änderungen in einem eigenen Branch.
- Verwende kleine, thematisch klare Commits.
- Bevorzuge Conventional-Commit-Präfixe:
  `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.
- Vermische Dokumentation, Refactoring und neue Funktionalität nicht unnötig in
  einem Commit.
- Nutze Pull Requests, um Zweck, Änderungen, Tests und Grenzen sichtbar zu
  machen.
- Committe keine generierten Secrets, lokalen Konfigurationen, Logs oder
  persönlichen Daten.

## Definition of Done

Eine Aufgabe ist erst abgeschlossen, wenn:

- die beschriebenen Anforderungen erfüllt sind;
- die Architekturgrenzen eingehalten wurden;
- keine Secrets oder privaten Echtdaten hinzugefügt wurden;
- Fehler-, Leer- und relevante Randzustände berücksichtigt wurden;
- UTF-8 und stabile Datenformate erhalten bleiben;
- der Produktions-Build erfolgreich ist;
- relevante Tests oder manuelle Prüfungen dokumentiert sind;
- betroffene Dokumentation aktualisiert wurde;
- keine unbeabsichtigten oder sachfremden Änderungen enthalten sind;
- der Abschlussbericht den tatsächlichen Stand ehrlich wiedergibt.

## Leitgedanke

GoldenDawn OS wächst durch kleine, stabile und nachvollziehbare Schritte. Jede
Änderung soll heute nützlich sein und gleichzeitig eine sichere Grundlage für
die nächste Entwicklungsstufe schaffen.
