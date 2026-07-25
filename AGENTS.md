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

Aktueller Stand: `v0.2.1 – LearningHub Local MVP funktional abgeschlossen und als Release Candidate geprüft`

Die abgeschlossene Basis `v0.2.0` umfasst:

- die umgesetzte responsive Command-Center-Shell;
- die umgesetzte PromptVault-Modulstruktur und den gemeinsamen
  Storage-Adapter für robuste lokale Speicherung;
- PromptVault als lokal nutzbares MVP-Modul mit Anzeigen, Erstellen,
  Bearbeiten, dauerhaftem Löschen, lokaler Textsuche, Kategorie-Filtern,
  persistenten Favoriten, unveränderlicher Versionierung und
  Wiederherstellung als neue Version.

`v0.2.0` ist abgeschlossen, mit den relevanten automatisierten Tests sowie dem
Produktions-Build geprüft und als Tag `v0.2.0` mit dem zugehörigen GitHub
Release veröffentlicht. Git-Aktionen für zukünftige Releases bleiben
vollständig manuell bei Jan. Der Meilenstein
`v0.2.1 – LearningHub Local MVP` ist funktional abgeschlossen und als lokaler
Release Candidate geprüft. Schema 2, lokale
Inhaltsservices und Persistenz sowie `LearningHubController` und die lokale
Inhaltsoberfläche für Module, Kapitel und LearningNodes sind umgesetzt. Der
getrennte Fortschrittsvertrag, seine Persistenz und Projektion sowie die
bedienbare Oberfläche für Kapitelabschluss und Modulfortschritt sind ebenfalls
umgesetzt. Der getrennte LearningArtifact-Vertrag, seine private lokale
Persistenz und sein referenzprüfender Service sind über den vorhandenen
`LearningHubController` und die `LearningHubView` als lokale Notizen und
Zusammenfassungen bedienbar. Die getrennte lokale LearningTest-Foundation aus
Testbank, append-only Attempts, reiner deterministischer Engine und
referenzprüfendem Service ist ebenfalls umgesetzt und über den vorhandenen
Controller und die View als sichtbarer `Lokaler Mock-Test` mit
Fragenverwaltung, Testdurchführung, Ergebnis und Versuchshistorie bedienbar.
Der Mock-Test verwendet weder KI noch externe Kommunikation. Tag, GitHub
Release und öffentliche Freigabe bleiben manuelle Schritte. Der nächste
geplante Meilenstein `v0.2.2 – LichtwaldLog Local MVP` ist noch nicht begonnen
oder implementiert.

Nicht Bestandteil des veröffentlichten `v0.2.0` waren:

- der LearningHub Local MVP aus `v0.2.1`;
- der LichtwaldLog Local MVP aus `v0.2.2`;
- Import oder Export von PromptVault-Daten;
- Synchronisierung, geräteübergreifende Speicherung oder automatische
  Cloud-Sicherung;
- Airtable-Integrationen;
- Webhooks oder die Anbindung des SyncAgent;
- echte LLM- oder Agentenlogik;
- Authentifizierung und Benutzerverwaltung;
- ein eigenes Backend;
- produktives Deployment;
- echte private oder gesundheitsbezogene Daten im Portfolio-Modus.

## Verbindliche Entwicklungsreihenfolge

Halte diese Reihenfolge der Hauptmeilensteine ein:

1. `v0.2.0`: lokales Command Center und PromptVault;
2. `v0.2.1`: LearningHub Local MVP;
3. `v0.2.2`: LichtwaldLog Local MVP;
4. `v0.3.0`: SyncService, Webhook und SyncAgent;
5. `v0.4.0`: DataAgent und Airtable;
6. `v0.5.0`: TestAgent und Lerntests;
7. `v0.6.0`: Integration der zuvor eingeführten lokalen und externen Bausteine;
8. `v1.0.0`: abgesicherte, dokumentierte Portfolio-Version.

Die gesamte Reihe `v0.2.x` bleibt bewusst lokal. `v0.3.0` markiert den Beginn
der externen Kommunikation. Zusätzliche Unterversionen dürfen zwischen den
Hauptmeilensteinen liegen, dürfen deren Reihenfolge und Architekturgrenzen aber
nicht verändern. Die technische Entwicklung folgt damit verbindlich dem Pfad
`Mock → Webhook → Airtable → Agentenlogik`.

Implementiere keine spätere Phase vorzeitig, sofern die Aufgabe dies nicht
ausdrücklich verlangt und die dafür notwendige Architekturentscheidung nicht
dokumentiert wurde.

## Lokale Modulgrenzen für v0.2.x

### LearningHub Local MVP in v0.2.1

- Der LearningHub ist kein allgemeines Learning-Management-System. Seine
  verbindliche Struktur lautet `LearningHub → LearningModule → LearningChapter
  → LearningNode`.
- Schema 2 unterstützt mehrere nutzerkonfigurierte LearningModules direkt im
  `modules`-Array. Ein neuer Hub darf leer sein; persistierbare Module besitzen
  mindestens ein Kapitel. Kapitel dürfen noch keine LearningNodes enthalten.
- Alle Kapitel sind implizit trackbar. LearningNodes sind selbst erstellte
  Textkarten; Course, Unit, Elternverweise, Knotentypen und `isTrackable` sind
  nicht Teil des Vertrags.
- Kapitelabschluss und daraus abgeleiteter Modulfortschritt verwenden einen vom
  Inhaltsvertrag getrennten Fortschrittsvertrag und sind lokal bedienbar.
  Testkompetenz bleibt ein eigenes späteres Konzept. 100-%-Module bleiben
  erhalten und bedienbar sowie später testbar.
- Lokale Notizen und Zusammenfassungen gehören zum LearningHub-MVP, sind über
  den vorhandenen Controller und die View bedienbar und bleiben hinter den
  vorgesehenen Service- und Storage-Grenzen.
- Private Lerninhalte und synthetische Portfolio-Demos bleiben klar getrennt.
  Öffentliche Beispieldaten dürfen keine privaten Inhalte ableiten oder
  nachbilden.
- Der implementierte lokale LearningTest-Fluss lautet:

```text
LearningHubView
  → LearningHubController
      → LearningTestService
          ├→ LearningHubService                Referenzprüfung
          ├→ LearningTestBankStorage
          │    → StorageAdapter
          │    → localStorage
          ├→ LearningTestAttemptStorage
          │    → StorageAdapter
          │    → localStorage
          └→ LearningTestEngine                reine Deterministik
```

Die `LearningTestEngine` arbeitet rein und deterministisch mit den vollständig
validierten Fragen der getrennten LearningTestBank. Automatisierte Tests
verwenden ausschließlich unabhängig erfundene synthetische Inhalte; private
Produktionsfragen werden nicht als Demo-Daten bereitgestellt. Die Oberfläche
kennzeichnet diesen Zustand sichtbar als `Lokaler Mock-Test`; er verwendet
keine KI und darf nicht als KI-Test beschrieben werden. Laufende Sessions
bleiben nur im Arbeitsspeicher. `cancelModuleTest` entfernt ausschließlich eine
sicher abbrechbare Session mit `status: testCancelled` und `changed: true`; der
Abbruch erzeugt keinen Attempt und führt weder Storage-, ID-, Uhr- noch
Dependency-Zugriffe aus. Unbekannte Sessions liefern `notFound` /
`testSessionNotFound`, laufende oder bereits vorbereitete Abgaben `conflict` /
`learningTestSubmissionInProgress` beziehungsweise
`learningTestPendingSubmission`, jeweils mit `changed: false` und ohne
Sessionmutation. Einmal vergebene Session-IDs bleiben auch nach einem Abbruch
für die Lebensdauer der Serviceinstanz reserviert. Der spätere externe
Testfluss lautet:

```text
LearningTestService
  → SyncService
  → SyncAgent
  → TestAgent
```

Freitextbewertung und die Anbindung des TestAgent gehören erst zu `v0.5.0`.

### LichtwaldLog Local MVP in v0.2.2

- LichtwaldLog bleibt ein lokales Journal-Modul mit CRUD für Einträge aus
  Titel, reinem Kalenderdatum, Text und Tags sowie lokaler Suche und Filtern.
- Kalenderdaten werden als `YYYY-MM-DD` gespeichert.
- Bilder werden nicht als Base64 in localStorage gespeichert.
- Private Einträge und synthetische Demo-Einträge müssen getrennt und sichtbar
  unterscheidbar bleiben.
- Synchronisierung, Agentenanbindung und Weekly Review gehören nicht zu
  `v0.2.2` und dürfen für diesen Meilenstein nicht als umgesetzt dargestellt
  werden.

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
  → TestAgent oder DataAgent
  → Airtable ausschließlich über den DataAgent
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
- Der SyncAgent greift nicht selbst auf Airtable zu, sobald der DataAgent
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
- `DataAgent`: fachlich der Bibliothekar und zentrale Datenverwalter. Er
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
  → DataAgent
  → Airtable
```

Der `TestAgent` konzentriert sich auf Prüfungslogik, der `DataAgent` auf
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
  Favoriten, Inhaltsänderungen und Wiederherstellungen verwenden ausschließlich
  den bestehenden Datenfluss über `PromptService`, `PromptStorage` und
  `StorageAdapter` sowie den Storage-Key `goldendawn.promptVault.v1`.
- PromptVault verwendet für neue Schreibvorgänge den Envelope mit
  `schemaVersion: 2`. Das Versionsarray bleibt fachlich unveränderlich und wird
  nur um neue Versionen ergänzt; eine Wiederherstellung überschreibt keine
  frühere Fassung.
- Normalisiere gültige Schema-1-Daten nur im Arbeitsspeicher. Schreibe den
  Schema-2-Envelope erst bei einer erfolgreichen Mutation und rekonstruiere
  keine unbekannte frühere Historie.
- Plane Migrationen ein, bevor ein bestehendes Datenformat geändert wird.
- Behandle lokale Browserdaten nicht als Synchronisierung, geräteübergreifende
  Speicherung oder Cloud-Sicherung.
- Mock-Daten müssen klar als Mock- oder Demo-Daten erkennbar sein.

## Sicherheit und Datenschutz

- Das Repository enthält ausschließlich Quellcode, Dokumentation und klar
  gekennzeichnete synthetische Demo-Daten.
- Private Lern-, Prompt-, Reflexions-, Gesundheits- oder andere persönliche
  Nutzerdaten gehören nicht in das Repository. Lokale Nutzerinhalte bleiben im
  aktuellen Browserprofil und werden nicht synchronisiert.
- `localStorage` ist unverschlüsselt und weder Secret-Store noch
  Cloud-Sicherung oder geräteübergreifende Speicherung.
- Ein öffentlich sichtbares Repository enthält keine produktiven Webhooks,
  Credentials, privaten Airtable-IDs oder persönlichen Daten.
- Öffentliche Vite-Konfiguration darf nur nicht-sensitive Werte enthalten;
  jeder `VITE_*`-Wert ist im Browser-Build öffentlich.
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
