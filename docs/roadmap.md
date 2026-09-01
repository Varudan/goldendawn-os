# GoldenDawn OS – Roadmap

## Dokumentstatus

| Feld | Wert |
| --- | --- |
| Projektphase | `v0.3.0 – ADR 0031 angenommen; Chrome-151-Runtimegate weiterhin FAIL; Ursache CAUSE_NOT_PROVEN; nächster Slice: netzwerkfreie passive Diagnosefoundation` |
| Zielrelease | `v1.0.0 – Portfolio Release` |
| Agenten-Scope | SyncAgent, DataAgent und TestAgent |
| Status | Paketversion `0.2.2`; neuestes veröffentlichtes Release und Tag `v0.2.2`; ADR-0025-In-Process-Komposition, isolierter BrowserSyncTransport und feste transportlokale v1-Wire-Policy für den leeren synthetischen `syncTest` implementiert; der einmalige Schema-1-Lauf `chrome-stable-win-01` bleibt wegen des Widerspruchs zwischen vollständig beobachteter HTTP-200-Response und statisch zurückgewiesenem Transport-Promise mit `overallGate: FAIL` dokumentiert; Ursache `CAUSE_NOT_PROVEN`, PNA/LNA und nicht ausgeführte Negativkontrollen `UNPROVEN`, Cleanup `PASS`; ADR 0031 ersetzt ADR 0030 formal und entscheidet die korrigierte separate passive Diagnosegrenze, implementiert oder autorisiert sie aber nicht; der Transport bleibt weder mit dem SyncService noch in `src/main.js` komponiert; Browser-End-to-End-Fluss fehlt; n8n/OpenAI/lokales Modell nicht autorisiert; kein Cloudaufruf; Tenant-, Provider-/Execution- und Production-Evidenz `UNPROVEN`; n8n Stable OSS und Aktivierung `FAIL` |
| Letzte Aktualisierung | 2026-08-30 |

Diese Roadmap übersetzt die Vision und Architektur von GoldenDawn OS in kleine,
überprüfbare Entwicklungsstufen. Sie definiert Ergebnisse und Qualitätsgrenzen,
nicht starre Kalendertermine.

## Roadmap-Prinzipien

- Jede Version liefert ein sichtbares und lokal überprüfbares Ergebnis.
- Eine neue Phase beginnt erst, wenn die Abnahmekriterien der vorherigen Phase
  erfüllt sind.
- Die aktuelle Implementierungsreihenfolge lautet: **ADR 0027 – beobachtbare
  Browser-SyncTransport-Nachweisgrenzen ✅ → isolierte BrowserSyncTransport-
  Implementierung und netzwerkfreie Unit-Tests ✅ → ADR 0028 – feste
  Validator-Integritätsgrenze für v1 ✅ → transportlokale v1-Wire-Policy und
  mutationswirksame Tests ✅ → ADR 0029 – geschlossenes Local Browser Runtime
  Evidence Gate ✅ → einmaliger umgebungsgebundener Chrome-151-Nachweis
  `FAIL` → ADR 0030 – passive Diagnosegrenze ✅ → ADR 0031 – korrigierte
  Envelope- und Observation-Completion-Grenze ✅ → netzwerkfreie
  Diagnosefoundation → gesondert autorisierter sichtbarer Diagnoselauf → nur
  bei ausreichendem Befund eigener Produkt-ADR und eigener
  Implementierungsslice → vollständig neuer ADR-0029-Lauf nur nach gesonderter
  Autorisierung → getrennte Browserkomposition erst nach Gesamt-`PASS` →
  getrennter lokaler End-to-End-`syncTest` → globale/systemweite Missbrauchs-, Parallelitäts-, Zeit- und
  Ressourcenlimits → getrennte Providerentscheidungen**.
- Die Reihe `v0.2.x` ist bewusst lokalen GoldenDawn-OS-Modulen vorbehalten.
  `v0.3.0` bereitet die erste lokale prozessübergreifende Kommunikation mit dem
  Agentensystem zunächst mit einem transportneutralen Vertrag, einer
  transportneutralen Servicegrenze und einer synchronen Request Boundary für
  bereits materialisierte Raw-Body-Werte vor.
  ADR 0020 implementiert den separaten Loopback-Server, HTTP-Handler sowie die
  Raw-Wire- und Decodergrenze. ADR 0021 ergänzt das eigenständige Boundary-
  Derivat und sein deterministisches SHA-256-Integritätsgate. ADR 0022 bewahrt
  die lokale, standardmäßig netzwerkinaktive n8n-Cloud-Ingress- und Runtime-
  Evidence-Gate-Foundation; es wurde kein Cloudrequest ausgeführt, die
  Tenantmessung bleibt `UNPROVEN`, und das ursprüngliche Aktivierungsgate ist
  wegen negativer commitgebundener Stable-OSS-Befunde `FAIL`. ADR 0023 ersetzt
  ADR 0002 und ADR 0019 und setzt den lokalen SyncAgent als verbindliche
  Agenten- und Providergrenze vor alle optionalen Provider. Die durch ADR 0025
  entschiedene lokale Komposition ist implementiert. ADR 0027 ersetzt ADR 0026
  und übernimmt den festen Browser-SyncTransport-Vertrag mit zwei korrigierten
  Nachweisgrenzen; die isolierte Transportimplementierung samt netzwerkfreier
  Unit-Suite ist abgeschlossen. ADR 0028 ersetzt ADR 0027 formal und
  entscheidet gegen die damals bestätigte Validator-Integritätslücke genau
  eine feste transportlokale v1-Wire-Policy. Die Policy und ihre
  mutationswirksame Matrix sind implementiert und schließen die Transportlücke
  bei unverändertem Contractvalidator. ADR 0029 operationalisiert das
  Runtimegate an `T₀`, die zwei allowlisteten Negativdeltas, zehn Pflichtgates,
  Restore und Cleanup. Der einmalig autorisierte Chrome-151-Lauf erreichte
  `overallGate: FAIL`; PNA/LNA und die stopregelkonform nicht ausgeführten
  Negativkontrollen bleiben `UNPROVEN`, Cleanup ist `PASS`; die Ursache bleibt
  `CAUSE_NOT_PROVEN`. ADR 0031 ersetzt ADR 0030 formal und entscheidet nur die
  korrigierte separate passive Diagnosegrenze. Browserkomposition, Browser-End-to-End-Fluss und
  Provideradapter fehlen, und der aktuelle Stand kommuniziert nicht extern.
- Weitere Unterversionen dürfen ergänzt werden, wenn neue, klar abgegrenzte
  Arbeitspakete entstehen.
- Version 1 bleibt auf `SyncAgent`, `DataAgent` und `TestAgent` begrenzt.
- Neue Abhängigkeiten, Agenten oder Infrastruktur benötigen eine dokumentierte
  Entscheidung.
- Git-Aktionen einschließlich Commits, Pushes, Pull Requests, Merges sowie
  aller Tags und Releases bleiben auch für zukünftige Releases vollständig
  manuell bei Jan.
- Dokumentation beschreibt immer den tatsächlichen Stand und kennzeichnet
  geplante Funktionen ausdrücklich.

## Statuslegende

| Symbol | Bedeutung |
| --- | --- |
| ✅ | Abgeschlossen |
| 🟡 | In Arbeit |
| ⬜ | Geplant |
| ⏸️ | Bewusst zurückgestellt |

## Gesamtübersicht

| Version | Schwerpunkt | Ergebnis | Status |
| --- | --- | --- | --- |
| `v0.1.0` | Fundament | Dokumentation, Regeln und stabile Projektbasis | ✅ |
| `v0.2.0` | Local Dashboard MVP | Command Center und PromptVault implementiert, geprüft und veröffentlicht | ✅ |
| `v0.2.1` | LearningHub Local MVP | Vollständig geprüft und veröffentlicht | ✅ |
| `v0.2.2` | LichtwaldLog Local MVP | Vollständig geprüft und veröffentlicht | ✅ |
| `v0.3.0` | Local SyncAgent and Transport Foundation | In Arbeit: lokale Foundations, modellfreier `syncTest`-Kern, ADR-0025-In-Process-Komposition mit lokalem HTTP `200`, isolierter BrowserSyncTransport und feste v1-Wire-Policy samt mutationswirksamer ADR-0028-Matrix implementiert; der einmalige Chrome-151-Runtime-Evidence-Lauf bleibt mit Gesamt-`FAIL`, Ursache `CAUSE_NOT_PROVEN`, PNA/LNA und Negativkontrollen `UNPROVEN` sowie Cleanup `PASS` dokumentiert; ADR 0031 ersetzt ADR 0030 formal und entscheidet die noch nicht implementierte korrigierte passive Diagnosegrenze, als Nächstes folgt ausschließlich ihre netzwerkfreie Foundation; Browserkomposition und End-to-End-Fluss erst nach einem späteren vollständig neuen ADR-0029-Gesamt-`PASS`, Provideradapter später, das ursprüngliche n8n-Gate `FAIL`/`UNPROVEN` und geschlossen | 🟡 |
| `v0.4.0` | DataAgent and Airtable Integration | Kontrollierter Airtable-Lese- und Schreibfluss | ⬜ |
| `v0.5.0` | TestAgent and Learning Tests | Lerntests erstellen, bewerten und speichern | ⬜ |
| `v0.6.0` | Multi-Agent Integration | Stabiler End-to-End-Fluss und Demo-Trennung | ⬜ |
| `v1.0.0` | Portfolio Release | Dokumentierte und deployte Drei-Agenten-Demo | ⬜ |

## v0.1.0 – Foundation

### Ziel der Foundation

Eine vertrauenswürdige technische und organisatorische Grundlage schaffen,
bevor neue Produktfunktionen implementiert werden.

### Umfang der Foundation

- ✅ Vite mit Vanilla JavaScript initialisieren.
- ✅ Privates GitHub-Repository erstellen.
- ✅ Manuellen Branch-, Pull-Request- und Squash-Merge-Workflow etablieren.
- ✅ Projektvision und Übersicht in `README.md` dokumentieren.
- ✅ Verbindliche Coding-Agent-Regeln in `AGENTS.md` festhalten.
- ✅ Zielarchitektur in `docs/architecture.md` dokumentieren.
- ✅ Detaillierte Roadmap in `docs/roadmap.md` festhalten.
- ✅ Sicherheitsmodell in `docs/security.md` konkretisieren.
- ✅ Sync-Verträge in `docs/data-contracts.md` definieren.
- ✅ Erste Architecture Decision Records anlegen.
- ✅ Einheitliche Zeilenenden und Editor-Grundeinstellungen festlegen.
- ✅ Produktions-Build erfolgreich ausführen.
- ✅ Dokumentation, Git-Status und Zeilenenden abschließend prüfen.

### Abnahmekriterien für v0.1.0

- `npm install` und `npm run build` funktionieren in einem frischen Clone.
- `main` ist sauber und enthält keine unbeabsichtigten Änderungen.
- README, AGENTS.md, Architektur und Roadmap widersprechen sich nicht.
- Es befinden sich keine Secrets oder privaten Echtdaten im Repository.
- Die drei Agentenrollen und ihre Grenzen sind eindeutig dokumentiert.
- Der manuelle Git-Workflow ist in `AGENTS.md` verbindlich festgehalten.

### Portfolio-Nachweis für v0.1.0

- öffentliche oder bereinigte Architekturübersicht;
- nachvollziehbare Pull-Request-Historie;
- dokumentierte Scope- und Sicherheitsentscheidungen.

## v0.2.0 – Local Dashboard MVP

### Ziel des lokalen MVP

Ein vollständig lokal nutzbares Dashboard mit einem ersten echten Modul
bereitstellen. Externe Systeme sind für diese Version nicht erforderlich.

### Umfang des lokalen MVP

- ✅ Vite-Demooberfläche durch das GoldenDawn-OS-Grundlayout ersetzen.
- ✅ Command Center mit Navigation, Projektstatus und Modulübersicht erstellen.
- ✅ Erste benötigte Modul-, Service- und Storage-Struktur für PromptVault
  anlegen.
- ✅ Gemeinsamen Storage-Adapter für robuste lokale Speicherung implementieren.
- ✅ PromptVault als erstes lokal nutzbares MVP-Modul mit Anzeigen, Erstellen
  und Löschen implementieren.
- ✅ Prompt-Suche, Kategorie-Filter und persistente Favoriten bereitstellen;
  Such- und Filterzustände bleiben flüchtig, Favoriten verwenden den bestehenden
  Service- und Storage-Datenfluss sowie `goldendawn.promptVault.v1`.
- ✅ Prompt-Detailansicht mit vollständigem Prompt-Text erstellen.
- ✅ Prompts nach zugänglicher Inline-Bestätigung dauerhaft lokal löschen.
- ✅ Prompts lokal erstellen, validieren und dauerhaft speichern.
- ✅ Vorhandene Prompts über den bestehenden Service- und Storage-Datenfluss
  bearbeiten; Identität, Erstellungsmetadaten und Favoritenstatus bleiben dabei
  ebenso erhalten wie die Kennzeichnung der Beispielprompt-Herkunft.
- ✅ Unveränderliche Prompt-Versionen mit zugänglicher Historie bereitstellen
  und historische Fassungen ausschließlich als neue Version wiederherstellen.
- ✅ Lade-, Leer-, Validierungs-, Erfolgs- und Speicherfehlerzustände gestalten.
- ✅ Responsive Darstellung und Tastaturbedienung prüfen.

### Abnahmekriterien für v0.2.0

- Das Dashboard startet ohne Webhook oder externe Konfiguration.
- PromptVault ist nach einem Browser-Neustart weiterhin nutzbar.
- UI-Komponenten greifen nicht direkt auf `localStorage` zu.
- Beschädigte lokale JSON-Daten bringen die Anwendung nicht zum Absturz.
- Erstellen erzeugt Version 1, Bearbeiten ergänzt eine neue Inhaltsversion und
  Wiederherstellen erhält jede frühere Fassung unverändert.
- Favoriten erzeugen keine Inhaltsversion; Löschen entfernt den Prompt und
  seine vollständige Historie.
- Der Produktions-Build ist erfolgreich.
- Die Oberfläche kennzeichnet lokale und gemockte Daten korrekt.
- Die Oberfläche macht deutlich, dass lokale Browserdaten weder
  geräteübergreifend synchronisiert noch automatisch in der Cloud gesichert
  werden.

### Portfolio-Nachweis für v0.2.0

- Screenshot oder kurze Bildschirmaufnahme des Command Centers;
- demonstrierbarer PromptVault-Workflow;
- dokumentierte Trennung von UI, Service und Storage.

## v0.2.1 – LearningHub Local MVP

### Ziel des LearningHub Local MVP

LearningHub als lokal nutzbares Modul mit nutzerkonfigurierten Modulen,
trackbaren Kapiteln und selbst erstellten Textkarten bereitstellen. Die
Schema-2-Foundation definiert zunächst nur Struktur und Validierung. Externe
Bewertung und echte Agentenlogik sind nicht Teil dieses lokalen MVP.

### Fachliche Abgrenzung und Schema-2-Foundation

- Die verbindliche Hierarchie lautet **LearningHub → LearningModule →
  LearningChapter → LearningNode**.
- Das Schema-2-`modules`-Array unterstützt mehrere Module und darf für einen
  neuen Hub leer sein. Persistierbare Module besitzen mindestens ein Kapitel.
- Alle Kapitel sind implizit trackbar und dürfen noch keine LearningNodes
  enthalten. LearningNodes sind selbst erstellte Textkarten.
- Course, Unit, Elternverweise, Knotentypen und `isTrackable` sind nicht Teil
  des Vertrags.
- Kapitelabschluss und Fortschritt sind in einem separaten
  LearningProgress-Schema-1-Vertrag modelliert; Modulfortschritt wird aus der
  Ereignisreihenfolge der Kapitel abgeleitet. Abgeschlossene 100-%-Module
  bleiben erhalten und testbar.
- Notizen und Zusammenfassungen verwenden einen dritten, getrennten
  LearningArtifact-Schema-1-Vertrag. Pro LearningNode ist höchstens ein
  aktueller Arbeitsstand je Typ erlaubt; Artefakte sind editierbar, besitzen
  noch keine Versionshistorie und verändern nicht das append-only
  Progress-Modell.
- Fortschritt und spätere Testkompetenz sind getrennte Konzepte.
- Nutzerkonfigurierte Single-Choice-Fragen verwenden eine getrennte
  veränderbare LearningTestBank; abgeschlossene Versuche einen getrennten
  append-only LearningTestAttemptLog. Beide Verträge verwenden
  `schemaVersion: 1` und eigene Storage-Keys.
- Laufende Testsessionen bleiben flüchtig und werden nach einem Reload neu
  begonnen. Ein lokaler Score erzeugt weder Progress-Ereignisse noch einen
  Kompetenzstand.
- Confidence, Hinweise, Freitext-Rubriken und Testkompetenz bleiben mögliche
  spätere versionierte Erweiterungen; Schema 1 reserviert keine Felder dafür.
- Private Lerninhalte bleiben außerhalb des Repositorys. Die Demo-Daten sind
  unabhängig erfunden, synthetisch und vollständig tief eingefroren.
- Die abgeschlossene Schema-2-Foundation selbst enthält keine UI, Persistenz,
  Storage-, Fortschritts- oder Testlogik. Getrennte nachfolgende Arbeitspakete
  haben Service, Storage, Controller und Inhalts-UI sowie die weiterhin
  eigenständige Progress-, LearningArtifact- und LearningTest-Foundation
  ergänzt, ohne diese Vertragsgrenzen zu vermischen. Progress und
  LearningArtifacts und der lokale deterministische Mock-Test sind über den
  vorhandenen Controller und die View bedienbar.

### Umfang des LearningHub Local MVP

- ✅ Schema-2-Strukturvertrag für mehrere LearningModules, LearningChapters und
  LearningNodes sowie eine kanonische synthetische Demoquelle mit genau einem
  Modul, drei Kapiteln und vier LearningNodes bereitstellen.
- ✅ `createLearningHubStorage` mit `loadLearningHub` und `saveLearningHub`
  hinter dem gemeinsamen `StorageAdapter` sowie dem festen Key
  `goldendawn.learningHub.content.v1` bereitstellen.
- ✅ `createLearningHubService` mit `loadHub`, `createModule`, `renameModule`,
  `addChapter`, `renameChapter`, `addLearningNode` und `updateLearningNode`
  bereitstellen.
- ✅ Fehlende Fachkeys über die einzelnen Inhalts-, Progress-, Artifact-,
  Testbank- und Attempt-Loads weiterhin als schreibfreie private Leerzustände
  behandeln.
- ✅ Einen vorgeschalteten Demo-Initializer bereitstellen, der genau einmal nur
  bei gemeinsam fehlendem Inhalts-, Artifact-, Testbank- und Marker-Key das
  synthetische Demo-Modul mit acht LearningArtifacts und sieben Fragen seedet.
- ✅ Immutable und atomare Inhaltsmutationen mit vollständiger Schema-2-
  Validierung, injizierbarer begrenzter ID-Erzeugung und kontrollierten
  Storage-Fehlern automatisiert prüfen.
- ✅ `LearningHubController` und sichere lokale Inhalts-UI für Erstellen und
  Umbenennen von Modulen und Kapiteln sowie Erstellen und Bearbeiten von
  LearningNodes bereitstellen.
- ✅ LearningHub in die bestehende Command-Center-Navigation integrieren und
  Moduldetail, zugängliches Kapitel-Accordion sowie Node-Auswahl anbieten.
- ✅ Separaten append-only LearningProgress-Schema-1-Vertrag, lokale
  Progress-Persistenz, referenzprüfenden Service und reine Modulprojektion
  bereitstellen, ohne Schema 2 zu verändern oder Testkompetenz einzumischen.
- ✅ Progress-Service in LearningHubController und LearningHubView anbinden und
  Kapitelabschluss sowie Modulfortschritt zugänglich darstellen.
- ✅ Getrennten LearningArtifact-Schema-1-Vertrag, privaten lokalen Storage
  unter `goldendawn.learningHub.artifacts.v1` und referenzprüfenden Service für
  aktuelle Notizen und Zusammenfassungen bereitstellen.
- ✅ LearningArtifactService in `LearningHubController` und
  `LearningHubView` anbinden und Notizen sowie Zusammenfassungen lokal
  bedienbar machen.
- ✅ Getrennte LearningTestBank- und LearningTestAttempt-Verträge, private
  Storages, reine deterministische Engine und referenzprüfenden
  `LearningTestService` bereitstellen.
- ✅ Nutzerkonfigurierte Single-Choice-Fragen stabil mit LearningNodes
  verknüpfen, Lösungen vor der Abgabe ausblenden und abgeschlossene Attempts
  append-only hinter Service- und Storage-Grenzen speichern.
- ✅ LearningTestService in `LearningHubController` und `LearningHubView`
  anbinden und den Ablauf sichtbar als **„Lokalen Mock-Test“** kennzeichnen.
- ✅ Lade-, Leer-, Inhalts-, Mutations-, Erfolgs- und Fehlerzustände zugänglich
  gestalten.

Der implementierte LearningArtifact-Datenfluss lautet:

```text
LearningHubView
  → LearningHubController
  → LearningArtifactService
      ├→ LearningHubService
      │   → LearningHubStorage
      │   → StorageAdapter
      │
      └→ LearningArtifactStorage
          → StorageAdapter
          → localStorage
```

Der Inhaltsservice besitzt keine Rückabhängigkeit auf den Artifact-Service.
Der Service prüft die vollständige Modul-, Kapitel- und LearningNode-Kette,
speichert höchstens je eine aktuelle `note` und `summary` pro LearningNode und
behandelt identische Saves sowie bereits leere Clear-Ziele ohne ID-, Zeit- oder
Schreibzugriff. Artefakttexte sind auf 10.000 Zeichen begrenzt; stabile
Referenz-IDs ersetzen Kopien von Titeln oder LearningNode-Inhalten. Der
Controller reicht nur eine sichere UI-Projektion ohne Artefakt-IDs,
Referenzketten oder Zeitstempel weiter. Isolierte Ladefehler bieten Retry,
identische Saves bleiben sichtbare No-ops und das Leeren verwendet eine
zugängliche Inline-Bestätigung.

Der implementierte Progress-Datenfluss lautet:

```text
LearningProgressService
  ├→ LearningHubService
  │   → LearningHubStorage
  │   → StorageAdapter
  │
  └→ LearningProgressStorage
      → StorageAdapter
      → localStorage
```

Der Inhaltsvertrag bleibt bei `schemaVersion: 2` und
`goldendawn.learningHub.content.v1`. Der Fortschrittsvertrag verwendet getrennt
`schemaVersion: 1` und `goldendawn.learningHub.progress.v1`. Unterstützt sind
nur `chapter.completed` und `chapter.reopened`; `chapter.started` bleibt offen
und benötigt später eine versionierte Vertragsänderung. Die Projektion folgt
der Ereignisreihenfolge, behält 100-%-Module bei und kopiert keine Titel oder
LearningNode-Inhalte.

Der bestehende `LearningHubController` und die View verwenden davon
ausschließlich die validierte Projektion. Kapitelabschluss und Wiederöffnung
sind über native Markierungsfelder bedienbar; Modulübersicht und -detail zeigen
Zähler, Prozentwert und Abschlussstatus. Ein isolierter Progress-Fehler lässt
die Inhaltsverwaltung verfügbar, zeigt keine falschen 0-Prozent-Werte und kann
nicht destruktiv erneut geladen werden. Append-only ist eine Service-Regel über
technisch vollständig geschriebene `localStorage`-Snapshots, keine
kryptografische Manipulationssperre. Das Modell ist xAPI-inspiriert, aber nicht
xAPI-konform; es gibt weder ein LRS noch vollständiges Event Sourcing. Eine
spätere Archivierung muss Ereignisse erhalten, und dauerhaftes Löschen benötigt
eine gesonderte Referenz- und Löschrichtlinie.

Die implementierte LearningTest-UI verwendet diesen lokalen Datenfluss:

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

Die veränderbare Testbank liegt unter
`goldendawn.learningHub.testBank.v1`, der append-only Attempt-Log getrennt
unter `goldendawn.learningHub.testAttempts.v1`. Fragen werden nachvollziehbar
nach Kapitel-, LearningNode- und Frageposition geordnet; Optionen folgen ihrer
Position. Es gibt keine Zufallsauswahl. Vor der Abgabe enthält die öffentliche
Projektion weder korrekte Options-ID noch Erklärung. Laufende Sessions bleiben
im Servicezustand flüchtig und schreiben erst bei einer vollständigen
erfolgreichen Abgabe genau einen Attempt. Ein sicherer Abbruch entfernt die
Session ohne Attempt; laufende oder bereits vorbereitete Abgaben bleiben für
Retry beziehungsweise Reconciliation erhalten.

Die reine `LearningTestEngine` präzisiert und ersetzt für diese Foundation den
früher geplanten Provider-Platzhalter. Sie verwendet nutzerkonfigurierte
Single-Choice-Fragen, behauptet weder KI-Auswertung noch semantische
Freitextbewertung und benötigt keine externe Kommunikation. Controller und
View kennzeichnen den Ablauf sichtbar als „Lokaler Mock-Test“ und bieten
Fragenverwaltung, Testdurchführung, Ergebnis sowie redigierte
Versuchshistorie.

Der spätere Zielpfad bleibt:

```text
LearningTestService
  → SyncService
  → künftiger lokaler SyncTransport
  → lokales SyncGateway auf GD-WS01 (aktuell nur syncTest-Foundation)
  → lokaler SyncAgent
  → TestAgent
```

Semantische Freitextbewertung und echte `TestAgent`-Logik bleiben für `v0.5.0`
geplant. ADR 0023 autorisiert ausschließlich die Entscheidung für den lokalen,
synthetischen, leeren und nebenwirkungsfreien `syncTest`, nicht diesen späteren
privaten Lernpfad oder einen ModelProvider beziehungsweise WorkflowProvider.

### Abnahmekriterien für v0.2.1

- LearningHub unterstützt mehrere nutzerkonfigurierte Module mit mindestens
  einem Kapitel; Kapitel dürfen ohne LearningNodes bestehen.
- Private LearningHub-Inhalte werden über `LearningHubService`,
  `LearningHubStorage` und `StorageAdapter` unter dem festen Namespace
  `goldendawn.learningHub.content.v1` gespeichert; ein reines Laden des leeren
  Initialzustands schreibt weiterhin nichts.
- Ein vollständig uninitialisierter Erststart erhält genau einmal das
  synthetische Modul
  `[Demo] KI-Grundlagen – vom Datensatz zum Transformer` mit drei Kapiteln,
  vier LearningNodes, acht ausgefüllten Artefakten und sieben Fragen. Sobald
  Inhaltsstore, Artifact-Store, Testbank oder Initialisierungsmarker existieren,
  werden keine Demo-Daten ergänzt oder überschrieben.
- Der koordinierte Seed validiert alle Fachverträge und Referenzen vor dem
  ersten Write, schreibt den Marker zuletzt und rollt bei Fehlern ausschließlich
  noch bytegleiche Seed-Werte zurück. Wiederholte Aufrufe, Bearbeitungen und
  spätere Löschungen bei erhaltenem Marker lösen keinen neuen Seed aus;
  Attempt- und Progress-Stores bleiben uninitialisiert.
- Inhaltsmutationen validieren den vollständigen neuen Hub vor genau einem
  Schreibzugriff und speichern weder ungültige Module ohne Kapitel noch
  Teilzustände.
- Alle Kapitel sind trackbar. Kapitelabschluss und daraus abgeleiteter
  Modulfortschritt bleiben vom Inhaltsvertrag und von Testkompetenz getrennt.
- Der Progress-Service prüft alle gespeicherten und angeforderten Modul- und
  Kapitelreferenzen gegen den jeweils aktuellen LearningHub; verwaiste oder
  falsch zugeordnete Ereignisse werden ohne Reparaturwrite abgelehnt.
- Eine echte Zustandsänderung hängt genau ein Ereignis an und speichert genau
  einmal. Ein bereits erreichter Zielzustand bleibt ein erfolgreicher
  schreibfreier No-op ohne neue ID oder Uhrabfrage.
- LearningNodes sind selbst erstellte Textkarten innerhalb eines Kapitels;
  Aktionen darauf bleiben Controller- und UI-Fähigkeiten.
- Notizen und Zusammenfassungen bleiben im getrennten
  LearningArtifact-Schema-1-Store lokal; pro LearningNode existiert höchstens
  ein aktueller Stand je Typ, und jede Mutation prüft die vollständige
  Quellenreferenzkette.
- Die Artefakt-UI verwendet ausschließlich die vorgesehenen Controller-,
  Service- und Storage-Grenzen; View und Controller greifen nicht direkt auf
  `localStorage` zu. LearningTestBank und Attempts halten dieselbe Grenze über
  ihre fachlichen Storages und den gemeinsamen `StorageAdapter` ein; der
  vorhandene Controller gibt nur defensive Testprojektionen an die View weiter.
- Artifact-Ladefehler lassen Inhalt und Fortschritt bedienbar und bieten einen
  nicht destruktiven Retry. No-ops schreiben nicht; das Leeren einer Notiz oder
  Zusammenfassung verwendet eine zugängliche Inline-Bestätigung.
- Fragen werden über die vollständige aktuelle Elternkette referenzgeprüft und
  ohne Zufall nach Kapitel-, LearningNode- und Frageposition ausgewählt.
  Öffentliche Testfragen enthalten vor der Abgabe keine Lösung oder Erklärung.
- Eine vollständige gültige Abgabe hängt genau einen konsistenten Attempt an;
  malformed oder doppelte Antworten und Doppelsubmissionen erzeugen keinen
  zweiten Datensatz. Historische Attempts bleiben in Append-Reihenfolge.
- In-Progress-Sessions bleiben flüchtig. Fortschritt, Artifacts, Attempts und
  eine mögliche spätere Testkompetenz werden nicht vermischt.
- Ein sicherer Session-Abbruch erzeugt keinen Attempt, keine ID und keine
  Uhrzeit; laufende oder pending Abgaben werden nicht verworfen.
- Der lokale Mock-Test ist eindeutig gekennzeichnet, reproduzierbar und ohne
  KI-Auswertung eindeutig auswertbar.
- Private Kursinhalte gelangen nicht in das Repository; eine öffentliche Demo
  verwendet ausschließlich synthetische Inhalte.
- Das Modul funktioniert ohne Webhook, Airtable oder Agentenlogik.

### Portfolio-Nachweis für v0.2.1

- eine kanonische, tief eingefrorene synthetische Demo-Definition mit einem
  vollständigen KI-Modul, acht Artefakten und sieben Fragen;
- umfassende Schema-2-Vertrags-, Service- und Storage-Tests sowie Controller-
  und View-Tests für den durchgängigen lokalen Inhaltsfluss;
- dokumentierte Persistenzgrenze mit schreibfreien einzelnen Leerzuständen,
  einmaligem koordiniertem Erststartmarker, Nichtüberschreibung und bedingtem
  Rollback über drei getrennte Fachstores;
- Vertrags-, Projektions-, Storage- und Service-Tests der separaten
  Progress-Foundation einschließlich Referenzfehlern, No-ops und
  unveränderlichen Eingaben;
- Vertrags-, Storage- und Service-Tests der separaten Artifact-Foundation
  einschließlich Typ- und Eindeutigkeitsregeln, vollständiger Referenzprüfung,
  Generatorgrenzen, No-ops und unveränderlichen Eingaben;
- Controller- und View-Tests für sichere Artefaktprojektion, isolierte
  Retry-Zustände, No-op-Rückmeldungen, Inline-Clear-Bestätigung und
  Fokusführung;
- sichere Textdarstellung HTML-artiger Eingaben, zugängliche Accordions und
  responsive Inhaltsverwaltung ohne direkte Storage-Zugriffe aus UI-Schichten;
- nachvollziehbare, deterministische Ableitung des Modulfortschritts aus der
  Ereignisreihenfolge sowie zugängliche Kapitel-Markierungsfelder,
  Fortschrittsanzeigen und isolierte Retry-Zustände;
- Vertrags-, Engine-, Storage- und Service-Tests der LearningTest-Foundation
  einschließlich vollständiger Fehlerakkumulation, Referenzprüfung,
  deterministischer Reihenfolge, Lösungsausblendung, No-ops,
  Präfixschutz, flüchtiger Sessions und exakter Single-Choice-Auswertung;
- Controller- und View-Tests für Frageneditor, lösungsfreie öffentliche
  Sessions, Abgabe und Retry, Ergebnisvalidierung, sicheren Abbruch,
  redigierte Versuchshistorie, Fokusführung und 390-Pixel-Schutzregeln;
- reproduzierbarer lokaler Mock-Test ohne behauptete KI-Funktion.

## v0.2.2 – LichtwaldLog Local MVP

### Ziel des LichtwaldLog Local MVP

Ein vollständig lokales Modul für persönliche Reflexions- und
Erkenntniseinträge bereitstellen. Synchronisierte, automatisierte oder
agentengestützte Prozesse sind nicht Teil dieser Version.

### Umfang des LichtwaldLog Local MVP

- ✅ Contract Foundation mit Schema-1-Vertrag, reinem Validator, synthetischen
  Contract-Tests und ADR 0013 bereitstellen.
- ✅ Private Storage-Foundation mit festem Key, begrenztem
  Schema-1-Full-Snapshot, vollständiger Validierung, defensiven Klonen,
  schreibfreiem Missing-Zustand und Read-Preflight gemäß ADR 0014
  bereitstellen.
- ✅ Service-Foundation mit der exakt fünfteiligen API `loadLog`,
  `createEntry`, `updateEntry`, `deleteEntry` und `setFeaturedEntry`
  für private Einträge aus Kalenderdatum, Titel, Text und Tags bereitstellen.
- ✅ LichtwaldLog-Datenzugriffe vollständig hinter
  `LichtwaldLogService`, `LichtwaldLogStorage` und gemeinsamem
  `StorageAdapter` kapseln.
- ✅ Controller-Foundation mit eingefrorener `{ open, close }`-API, exakt
  sechzehnteiliger Action-API, vollständig geprüften privaten Service-Snapshots
  und flüchtigen Lade-, Leer-, Auswahl-, Formular-, Bestätigungs-, Busy-,
  Erfolgs- und Fehlerzuständen bereitstellen.
- ✅ Isolierte View- und CSS-Foundation mit eingefrorener
  `{ render, unmount }`-API, Safe-DOM-Ausgabe, verlustfreier Mehrfeld-Tag-UI,
  zugänglichen Zuständen, vollständiger Fokuszielauflösung, DOM-Unmount-Grenze,
  statischem lokalen Speicherhinweis sowie responsiven und
  Reduced-Motion-Regeln bereitstellen.
- ✅ View und CSS in `src/main.js` einbinden, die Navigation ergänzen und den
  vollständigen über GoldenDawn OS bedienbaren CRUD- und Fokusfluss
  bereitstellen.
- ✅ Den autoritativ über `featuredEntryId` fokussierten Eintrag in Übersicht
  und Detail als `Besonderer Lichtwaldmoment` präsentieren; diese Hervorhebung
  bleibt eine reine View-/CSS-Projektion ohne zweiten Zustand, neue API,
  Persistenz oder Dashboard-Redesign und erhält im synthetischen Modus die
  sichtbaren Herkunfts- und Reload-Hinweise.
- ✅ Die eingebundene Oberfläche in einem frischen temporären Browserkontext
  auf Desktop und bei exakt `390 × 844` real prüfen.
- ✅ Reine lokale Textsuche über Kalenderdatum, Titel, Text und Tags sowie
  exakte Kalenderdatum- und Tagfilter mit logischer AND-Kombination,
  unveränderter Snapshot-Reihenfolge und ausschließlich flüchtigem,
  nicht persistiertem Controllerzustand bereitstellen.
- ✅ Eine klar getrennte synthetische öffentliche Demo-Runtime als eigenen
  In-Memory-Storage-, Service-, Controller- und View-Stack bereitstellen, ohne
  private Daten, private Ports oder Browser-Storage zu übernehmen.
- ✅ Bilder nicht als Base64-Daten in `localStorage` speichern.

Der implementierte private lokale Pfad lautet:

```text
LichtwaldLogView
  → LichtwaldLogController
  → LichtwaldLogService
  → LichtwaldLogStorage
  → StorageAdapter
  → localStorage
```

Der getrennte synthetische Demo-Pfad lautet:

```text
LichtwaldLogView
  → LichtwaldLogController(expectedDataOrigin: synthetic)
  → LichtwaldLogDemoService
  → LichtwaldLogDemoStorage
  → In-Memory-Full-Snapshot
  → kanonische Demo-Factory
```

Die Demo enthält genau fünf vollständig erfundene, als `[Demo]` markierte
Einträge. Mutationen bleiben bei Navigation innerhalb des aktuellen Dokuments
erhalten, ein Reload beziehungsweise eine neue Komposition stellt den
kanonischen Seed wieder her. Sie verwendet keinen `StorageAdapter`, keinen
Browser-Key und keinen privaten Service oder Storage. Private und synthetische
Stacks besitzen getrennte Instanzen und keinen Fallback oder Datentransfer.

Der Controller hält ausschließlich eine flüchtige, defensiv entkoppelte
UI-Projektion und verwendet pro akzeptierter Lade- oder Mutationsintention exakt
eine passende Serviceoperation. Such- und Filteraktionen bleiben dagegen ohne
Service-, Storage-, Adapter-, ID-Generator- oder Schedulerzugriff. Nach
Mutationen lädt er nicht zusätzlich und nimmt keine
optimistischen Inhalts-, Delete- oder Fokusänderungen vor. Auswahl,
Formularbearbeitung und -abbruch sowie Anfordern und Abbrechen einer
Löschbestätigung bleiben service- und schreibfrei; Update- und Fokus-No-ops
entscheidet weiterhin ausschließlich der Service. Ziel-IDs bleiben exakt und
case-sensitive, der Fokusendzustand wird ausdrücklich als ID oder `null`
übergeben, und die Entry- sowie Tag-Reihenfolge bleibt unverändert.

Die isolierte View- und CSS-Foundation implementiert den injizierten View-Port
mit sicherer Plain-Text-DOM-Ausgabe, verlustfreien Tagcontrols, zugänglichen
Zuständen, vollständiger Fokuszielauflösung und einer privaten
DOM-Unmount-Grenze. Sie bewahrt die Controller-Projektion und führt keine
eigene fachliche oder persistente Wahrheit ein. `src/main.js` komponiert sie
über den gemeinsamen `StorageAdapter`; Navigation und der vollständig über
GoldenDawn OS bedienbare lokale CRUD-, Fokus-, Such- und Filterfluss ist
implementiert. Der autoritativ über `featuredEntryId` fokussierte Eintrag wird
in Übersicht und Detail rein durch View und CSS als
`Besonderer Lichtwaldmoment` präsentiert. Dies ergänzt weder einen zweiten
Zustand noch eine API oder Persistenz und verändert die Dashboard-Shell nicht.
Im synthetischen Modus bleiben Herkunft und Reload-Verhalten sichtbar. Die
reale Browserprüfung war in einem frischen isolierten temporären Chrome-Profil
auf Desktop mit `1440 × 1000` sowie bei exakt `390 × 844` erfolgreich. Der
vollständige lokale Navigations-, CRUD-, Fokus-, Dirty-Guard-, Delete- und
Reload-Fluss, Tastaturfokus, Live-Regionen, der sichtbare `3px`-Fokusrahmen und
fehlender horizontaler Seitenoverflow wurden bestätigt. Es gab 0
Console-Warnungen oder -Fehler, 0 Runtime-Exceptions und 0 externe Requests.
Die lokale Textsuche und die exakten Kalenderdatum- und Tagfilter wurden
einschließlich literalem Matching, AND-Verknüpfung, Leerzustand, Reset,
Caretfokus, gefilterten Mutationsflüssen und ausbleibenden
Storage-Schreiboperationen real im Browser geprüft und sind permanent
automatisiert abgedeckt. Der Controller leitet Query,
Datum, Tagoptionen und sichtbare IDs ausschließlich flüchtig aus seiner
vollständigen privaten UI-Projektion ab. Diese Werte gehören nicht zu Schema 1
und werden nicht persistiert; Service-, Storage- und Adapter-APIs bleiben
unverändert. Die getrennte synthetische Demo ist unmittelbar nach dem privaten
Modul navigierbar, in jedem Zustand sichtbar als Sitzung gekennzeichnet und
vollständig bedienbar. Der geplante Implementierungsumfang ist vollständig
abgeschlossen, geprüft und veröffentlicht.
Storage und Service bleiben die autoritativen fachlichen Grenzen.
Read-Preflight, 500.000-Codeeinheiten-Limit, Browser-Quota, TOCTOU- und
Multi-Tab-Verhalten ändern sich durch Anwendungskomposition, Controller und
View nicht.

`v0.2.2` enthält keine Synchronisierung und keine Agentenlogik. Auch der Weekly
Review gehört nicht zu diesem lokalen MVP. Agentengestützte, synchronisierte
oder automatisierte LichtwaldLog-Prozesse sowie der Weekly Review bleiben für
eine spätere Phase geplant.

### Abnahmekriterien für v0.2.2

- LichtwaldLog unterstützt den vollständigen lokalen CRUD-Fluss für Titel,
  Datum, Text und Tags.
- Suche und Filter funktionieren ohne externe Kommunikation.
- UI-Komponenten greifen nicht direkt auf `localStorage` zu.
- Private lokale Daten und synthetische Demo-Daten bleiben getrennt.
- Demo-CRUD, Fokus, Suche und Filter verändern weder den privaten
  LichtwaldLog-Key noch andere Browser-Storage-Keys; Navigation erhält den
  In-Memory-Demostand, Reload setzt nur die Demo auf den Seed zurück.
- In `localStorage` werden keine Bilder als Base64-Daten abgelegt.
- Das Modul enthält weder Sync- oder Agentenlogik noch einen Weekly Review.

### Portfolio-Nachweis für v0.2.2

- synthetischer lokaler CRUD-Workflow;
- demonstrierbare lokale Suche und Filterung;
- dokumentierte Trennung von privaten lokalen und öffentlichen Demo-Daten.

## v0.3.0 – Local SyncAgent and Transport Foundation

### Aktueller Stand

`v0.3.0` ist **in Arbeit – ADR 0031 angenommen; gebundenes Chrome-151-
Runtimegate weiterhin `FAIL`; Ursache `CAUSE_NOT_PROVEN`; nächster Slice:
ausschließlich die netzwerkfreie passive Diagnosefoundation**.
Die SyncContract Foundation für Version `1.0`, die Aktion
`syncTest` und den Handler `SyncAgent`, die asynchrone SyncService Foundation,
die synchrone transportneutrale SyncGateway Request Boundary, der separate
lokale Raw-Wire-/HTTP-Hop aus ADR 0020 und das reproduzierbar generierte
Boundary-Derivat aus ADR 0021 bleiben implementiert. ADR 0022 ergänzt jetzt
eine lokale, importseitig und standardmäßig netzwerkinaktive Evidence-
Foundation; sie hat keinen n8n-Cloud-Aufruf ausgeführt und keinen Tenant
verändert.

ADR 0023 ist als reine Dokumentationsentscheidung angenommen und ersetzt ADR
0002 sowie ADR 0019. ADR 0024 ergänzt diese Topologie um den implementierten,
vollständig lokalen, synchronen, importinaktiven und modellfreien
`syncTest`-SyncAgent-Kern. Der lokale SyncAgent ist die verbindliche Policy-,
Validierungs-, Routing- und Antwortgrenze des Agentensystems hinter dem lokalen
SyncGateway. Der für den ersten Agentenslice entschiedene `syncTest` wird
vollständig lokal, deterministisch, modellfrei und providerfrei ohne eigene
fachliche, Provider- oder Persistenzwirkung beantwortet. n8n Cloud,
self-hosted n8n, OpenAI und lokale Modelle sind ausschließlich optionale
spätere Provider; keiner ihrer Adapter ist autorisiert oder implementiert.
Browser-, UI-, Caller- und Requestwerte wählen weder Provider, Modell,
Workflow, Endpoint noch Umgebung; ADR 0027 übernimmt das einzige feste
Transportziel als privaten Modulwert aus ADR 0026. Die durch ADR 0025
entschiedene lokale Gateway-/SyncAgent-Komposition ist im bestehenden Prozess
implementiert. ADR 0027 ersetzt ADR 0026 formal, übernimmt alle nicht
ausdrücklich korrigierten Entscheidungen unverändert und ändert ausschließlich
zwei Nachweisgrenzen des Browser-SyncTransport-Vertrags. Der Transport ist nun
isoliert in `src/transports/browserSyncTransport.js` implementiert und durch
`tests/browserSyncTransport.test.js` ohne reale Browser-, externe Netzwerk- oder
Gatewayzugriffe geprüft. Er ist weiterhin weder mit dem SyncService noch in
`src/main.js` komponiert; der Browser-End-to-End-Fluss fehlt.

ADR 0028 ersetzt ADR 0027 formal und übernimmt dessen beide Korrekturen
vollständig. Der bestätigte Produktfehler lag in der damaligen Wirefreigabe:
Beide erforderlichen `validateSyncRequest`-Aufrufe verwenden live
manipulierbare Laufzeitfunktionen, während die terminale Prüfung Shape, Freeze
und Snapshotidentität, aber keine unabhängigen festen v1-Werte bestätigt.
Kontrollierte netzwerkfreie Proben konnten deshalb vertragswidrige Versionen,
Aktionen, Quellen und Request-IDs bis zu Serialisierung, Controller, Timer und
Fetch-Seam gelangen lassen. Die damaligen 1604/1604 Tests bewiesen die
Schließung dieser Lücke nicht.

ADR 0028 entscheidet unmittelbar vor `JSON.stringify` genau eine private,
nicht exportierte feste v1-Wire-Policy nach den weiterhin exakt zwei
Contractvalidatoraufrufen und der bestehenden terminalen Shape-/Freeze-
Prüfung. Ein dritter `validateSyncRequest`-Aufruf und weitere generische oder
alternative Validatorpfade bleiben verboten. Die Policy bindet ausschließlich
die festen v1-Werte, Request-ID, kanonischen gültigen UTC-Timestamp, interne
300.000-ms-Zeitkonsistenz und den exakten normalen eingefrorenen
Sechs-Felder-Graphen ohne `toJSON` und mit leerem Payload über erfasste
Intrinsics. Callerwerte werden nicht erneut gelesen. Sie ist nun implementiert
und schließt die Transportlücke; der Contractvalidator selbst wurde nicht
gehärtet. Contract, API, Seams, Dependencies, Endpoint, Caps, Bundle, Manifest,
Generator und Content-Length-Entscheidung bleiben unverändert.

Die kausale ADR-0028-Matrix weist die aktive Policy sowie den Fetch-Durchtritt
desselben Validatorbypasses bei gezielt neutralisiertem Policy-Callsite nach.
Die Verifikation besteht mit 423/423, 466/466, 735/735 und 1755/1755 Tests bei
`Δ = 151` und jeweils 0 Fehlschlägen, Abbrüchen, Skips und Todos; der Build
transformiert weiterhin exakt 46 Module und `bundle:n8n:check` ist driftfrei.
ADR 0029 ergänzt ADR 0020 und ADR 0028, operationalisiert die fortgeltenden
ADR-0026-/ADR-0027-Runtimeanforderungen und ersetzt keinen ADR. Alle positiven
Pflichtbeobachtungen sind an das unveränderliche Basistupel `T₀` gebunden; die
Origin- und Redirect-Negativkontrollen verwenden ausschließlich ihre
allowlisteten Deltas `Δ_origin` und `Δ_redirect`. Der Entscheidungsslice selbst
führte keinen Runtimevorgang aus. Der danach einmalig autorisierte Lauf unter
`chrome-stable-win-t0-01` beobachtete genau einen gewöhnlichen `OPTIONS 204`,
danach einen vollständig beantworteten `POST 200` und die erwarteten
JavaScript-sichtbaren Responsewerte. Das öffentliche BrowserSyncTransport-
Promise wies dennoch statisch redigiert zurück.
`normalSyntheticTransport` und das Gesamtgate sind deshalb `FAIL`; PNA/LNA,
der positive Vektor nach der geschlossenen Vektorgrammatik und die nicht
ausgeführten Negativvektoren bleiben `UNPROVEN`. Cleanup ist `PASS`; die
Ursache bleibt `CAUSE_NOT_PROVEN`. ADR 0031 ersetzt ADR 0030 formal und
entscheidet ausschließlich die davon unabhängige korrigierte passive
Diagnosegrenze. Als Nächstes folgt deren
netzwerkfreie Foundationimplementierung und -prüfung. Ein sichtbarer
Diagnoselauf benötigt danach eine neue ausdrückliche Autorisierung;
Browserkomposition und lokaler Browser-End-to-End-`syncTest` bleiben bis zu
einem späteren vollständig neuen ADR-0029-Gesamt-`PASS` geschlossen.

Der erste Implementierungsversuch wurde vor jeder Dateiänderung hart gestoppt.
Working Tree, Index und die beiden geplanten Zielpfade blieben unverändert; es
gab keinen echten Browser-, Netzwerk- oder Gatewayzugriff. Der Stop entstand
aus einer nicht beweisbaren Realm-Provenienzanforderung für fremde native
Promises, TypedArrays und ArrayBuffer sowie einer unter SyncContract v1 nicht
öffentlich erreichbaren 65.536-Byte-Requestgrenze, nicht aus einer festgestellten
Produktlücke. Es wurden weder zusätzliche API, Dependency, Produktionsseam
noch Contracterweiterung benötigt. Nach dem Merge von ADR 0027 wurde der
korrigierte Vertrag im nun abgeschlossenen isolierten Slice umgesetzt.

ADR 0027 ersetzt Realm-Provenienz durch das zum Prüfzeitpunkt beobachtbare,
geschlossene native Brand-, lokale Prototyp-, Own-Key-, Constructor- und
Species-Profil. Unveränderte Cross-Realm-Werte bleiben wegen ihrer
Prototypidentität unzulässig; vollständig fixtureseitig umprototypisierte echte
Promises beziehungsweise echte View und echter fester Backing-Buffer können
ihre historische Realm mit öffentlichen Prüfungen nicht mehr beweisbar machen.
Der Transport verändert keine fremden Prototypen und kopiert akzeptierte Bytes
weiterhin sofort in seinen eigenen lokalen Buffer. Realm bleibt ohne
Authentisierungs-, Autorisierungs-, Identitäts-, Datenschutz- oder
Vertrauensbedeutung.

Der private Requestcap bleibt unverändert 65.536 UTF-8-Bytes und Byte 65.537
scheitert weiterhin vor Controller, Timer und Fetch. Der größte öffentlich
gültige, kanonisch projizierte v1-Request umfasst wegen der festen Contractwerte,
des leeren Payloads, des kanonischen Timestamps und der höchstens 64 ASCII-
Zeichen langen `requestId` aktuell exakt 193 UTF-8-Bytes. Eine 65 Zeichen lange
ID scheitert bereits vor Serialisierung und Encoding. Die Unit-Suite belegt
die private Capverdrahtung zusätzlich in temporären Source-Kopien mit 193 und
192; sie behauptet keinen öffentlich erreichbaren 65.536/65.537-Requestfall. Die
reale Gateway-Raw-Wire-Grenze 65.536/65.537 und die erreichbare Responsegrenze
16.384/16.385 bleiben unverändert und getrennt.

Der Request-Payload ist exakt leer; erfolgreiche Responses sind auf
`dataOrigin: "synthetic"` begrenzt. Dieser Wert ist nur eine
Vertragsklassifikation und kein Herkunfts- oder Datenschutzbeweis. Der lokale
Server bindet ausschließlich an `127.0.0.1`, stellt exakt
`/api/sync-test` bereit, setzt die feste POST-/OPTIONS-/Host-/Origin-/Content-
und Ressourcenpolicy durch, begrenzt tatsächliche Wire-Bytes auf die
kanonischen 65.536 Bytes, dekodiert exakt einmal streng als UTF-8 und ruft die
bestehende Boundary exakt einmal auf. Eine kontrollierte Boundary-Ablehnung
bleibt ihre validierte `gatewayErrorResponse` über HTTP `400`; lokale
HTTP-Fehler verwenden einen getrennten statischen Envelope. Ein akzeptierter
Request erreicht synchron höchstens einmal den injizierten lokalen SyncAgent;
nur der vollständig abgesicherte exakte ADR-0024-Erfolg ergibt HTTP `200`.

Die Foundation trennt dokumentierte Plattformgarantien, commitgebundene
offizielle OSS-Beobachtungen, Messungen im konkreten Cloud-Tenant und
workflowseitig nicht beobachtbare Provider-/Ingress-Eigenschaften. Der
tenantgebundene Messstatus bleibt `UNPROVEN`. Für das am `2026-08-19` aktuelle
Stable-Release
[`n8n@2.35.4`](https://github.com/n8n-io/n8n/releases/tag/n8n%402.35.4)
am Commit `d2ce3c084c228622c2ffe7c245d25870430e18a9` ist die Kompatibilität bereits
negativ: Der
[offizielle Body-Reader](https://github.com/n8n-io/n8n/blob/d2ce3c084c228622c2ffe7c245d25870430e18a9/packages/cli/src/middlewares/body-parser.ts)
schaltet `gzip` und `deflate` vor die Materialisierung von `req.rawBody`, und
die Kombination aus
[Header Authentication](https://github.com/n8n-io/n8n/blob/d2ce3c084c228622c2ffe7c245d25870430e18a9/packages/nodes-base/nodes/Webhook/utils.ts)
und
[Standard-Webhook-Output](https://github.com/n8n-io/n8n/blob/d2ce3c084c228622c2ffe7c245d25870430e18a9/packages/nodes-base/nodes/Webhook/Webhook.node.ts)
reicht den erfolgreich geprüften Headerwert in Runtime-Execution-Daten weiter.
Beide commitgebundenen Teilgates und damit das aktuelle Aktivierungsgate sind
`FAIL`; sie behaupten keinen konkreten Cloud-Tenant-Build. `FAIL` und
`UNPROVEN` halten das Gate gleichermaßen geschlossen.

Nicht implementiert oder komponiert sind Browserkomposition und Browser-End-
to-End-Fluss, eine über den Produktbrowser erreichbare normale SyncResponse,
ModelProvider- oder
WorkflowProvider-Adapter, produktiver oder komponierter
Cloudtransport, n8n-Webhook oder -Workflow, produktives Credential oder Secret,
Boundary-Bundle-Komposition, Rate Limits, Retries, Replay-, Idempotenz- oder
Deduplizierungsschicht, Hub-UI, Persistenz, Requestlogs, Telemetrie und
`src/main.js`-Komposition. Der SyncAgent ist ausschließlich über den explizit
gestarteten lokalen Gateway-Prozess für den leeren synthetischen `syncTest`
erreichbar. Es existiert außerdem ausschließlich der standardmäßig
netzwerkinaktive synthetische Test-URL-Probeadapter als technische Mechanik;
seine Existenz ist keine Ausführungsfreigabe. Bis zum vollständigen Vorabgate
und den nachgelagerten Einzelfreigaben darf er keinen externen Request senden.
Bislang wurde kein Cloudrequest ausgeführt und es entsteht kein
Produktdatenfluss. Paketversion, Tag und Release bleiben `0.2.2`/`v0.2.2`.

ADR 0023 autorisiert keinen Cloudzugriff und keine Tenantmessung. Vor jeglicher
Vorbereitung oder Ausführung einer neuen n8n-Tenantmessung müssen ein neuer
n8n-Adapter-ADR angenommen und eine neue adapterbezogene Evidenz-Schemaversion
festgelegt sein. Erst danach benötigen die Anlage eines temporären Workflows,
ein Wegwerfcredential, jeder einzelne synthetische Test-URL-One-shot sowie der
vorab definierte Cleanup und die Entfernung der Cloudartefakte jeweils eine
eigene ausdrückliche Freigabe. Jede Supportanfrage ist unabhängig davon separat
freizugeben und darf nur eine spätere Entscheidung vorbereiten; sie autorisiert
weder Workflow, Credential, Tenantvorbereitung oder -ausführung,
Adapteraktivierung noch Productionlauf. Ohne angenommenen ADR und festgelegte
Schemaversion gibt es keinen Workflow, kein Credential und keinen Test-URL-
Verkehr. Ein Production-URL-Runner oder -Messpfad existiert nicht. Evidence-
Schema 1 bleibt unverändert mit `stableOssCompatibility: FAIL`,
`productionUrlMeasurementStatus: UNPROVEN`, `activationDecision: FAIL` und ohne
`overallGate`.

Eine GoldenDawn-seitige Kopie späteren Credentialmaterials liegt ausschließlich
in der vertrauenswürdigen Laufzeitkonfiguration oder Secretverwaltung des
konkreten serverseitigen Adapters auf GD-WS01. Etwaiges providerseitiges Prüf-
oder Credentialmaterial liegt ausschließlich im Credential-/Secret-Store des
Providers. Beide Seiten sind getrennte Vertrauens- und Betriebsgrenzen;
Providerablage beweist weder Redaction, Retention noch Nichtweitergabe, und
Same-Realm-Komposition ist keine technische Secret-Isolation. Für n8n sind
Header Authentication, Bearer-Secret, konkreter Headername, JWT, HMAC,
asymmetrisches Verfahren, Credentialformat und Rotationsmechanismus nicht
entschieden. Der ADR-0022-Befund bleibt ein Blocker, keine gewählte Lösung.

### Abgeschlossene Grundlage: SyncContract Foundation

- ✅ Exakt sechs Request-Felder, kein vorgesehenes Inhalts- oder Freitextfeld
  und exakt leeres `syncTest.payload` festgelegt.
- ✅ `requestId` rein syntaktisch und den Request-`timestamp` strukturell,
  kanonisch sowie zeitlich gegen die explizite Referenzzeit geprüft. Diese
  Prüfungen beweisen weder semantische Herkunft noch die Abwesenheit privater
  oder nutzergenerierter Informationen.
- ✅ Der Contract-Kern liest, persistiert oder exportiert keine privaten lokalen
  Bestände. `synthetic` bleibt eine Vertragsklassifikation, kein Beweis
  tatsächlicher Herkunft oder Datenschutzkonformität.
- ✅ Erfolg, normal korrelierten Fehler und frühen Gateway-Fehler als getrennte
  exakte Response-Profile definiert.
- ✅ Statische redigierte Fehlerprofile, geschlossene Allowlists und exakte
  Korrelation von Version, Aktion und `requestId` festgelegt.
- ✅ Reine Größenprüfung eines bereits vorliegenden Strings bis einschließlich
  65.536 UTF-8-Bytes umgesetzt; sie serialisiert keine Objekte und setzt ohne
  Transport kein Webhook-Limit durch.
- ✅ Deterministische Validierung für stabile, seiteneffektfreie gewöhnliche
  Records, Arrays und Strings umgesetzt. Der
  Validator schreibt selbst keine Properties und liest gewöhnliche eigene
  Accessors nicht als Werte; Proxy-Reflection kann jedoch Traps und
  Descriptor-Getter auslösen, die Eingaben oder externen Zustand verändern.
  Same-Realm-Proxy-Traps sind beliebiger JavaScript-Code und können globale
  Laufzeitobjekte verändern, die Ausführung blockieren oder spätere Operationen
  zum Werfen bringen. Reflection-Catches können solche Wirkungen weder
  verhindern noch rückgängig machen.
- ✅ ADR 0016 sowie Architektur-, Vertrags-, Roadmap- und Sicherheitsgrenzen
  dokumentiert.

### Abgeschlossene Grundlage: SyncService Foundation

- ✅ Eingefrorene Service-API mit exakt der immer Promise-basierten Methode
  `runSyncTest` und fail-closed abgelehnten zusätzlichen Argumenten
  bereitgestellt.
- ✅ `syncTransport.sendSyncRequest` vor dem Request-Build genau einmal sicher
  aufgelöst. Bei fehlender, nicht funktionaler oder werfend aufgelöster Methode
  werden Generator und Clock nicht ausgewertet.
- ✅ Erst nach erfolgreicher Methodenauflösung den kontrollierten Request-
  Builder mit genau einmal ausgewertetem ID-Generator und Clock, frischem exakt
  leerem Payload sowie vollständiger SyncContract-Validierung eingeführt.
- ✅ `req_ + crypto.randomUUID()` als einzigen Standard-ID-Pfad ohne
  `Math.random`-, Timestamp- oder anderen schwächeren Fallback festgelegt.
- ✅ Transportrequest und interne Korrelationsgrundlage als getrennte, tief
  eingefrorene Snapshots umgesetzt.
- ✅ `syncTransport.sendSyncRequest(syncRequest)` als einzige asynchron nutzbare
  Portmethode festgelegt und erst nach vollständiger Requestvalidierung
  höchstens einmal aufgerufen; kein Retry, Backoff, Timeout oder zweiter
  Aufruf.
- ✅ Transportantworten defensiv allowlist-basiert projiziert und ausschließlich
  als vollständig validierte normale SyncResponses akzeptiert. Frühe
  Gateway-Fehler bleiben außerhalb des Profils.
- ✅ Exakten lokalen Fünf-Felder-Result mit statischer redigierter
  Fehler-Allowlist von der normalen SyncResponse getrennt.
- ✅ Deterministischen In-Memory-Erfolgsfluss ausschließlich als klar
  gekennzeichnetes Test-Double vorgesehen; kein Transport-Mock in `src/`.
- ✅ Dependency-, Function-Proxy-, Promise- und Thenable-Grenzen sowie die
  fehlende rückwirkende Kontrolle bereits ausgelöster Seiteneffekte in ADR
  0017 und den Sicherheitsgrenzen dokumentiert.

### Abgeschlossene Grundlage: SyncGateway Request Boundary Foundation

- ✅ `createSyncGatewayRequestBoundary({ generateGatewayRequestId,
  getCurrentTimestamp })` als einzige Factory und eine eingefrorene gewöhnliche
  API exakt mit der synchronen Methode `processSyncRawBody` bereitgestellt.
- ✅ Exakt einen Aufrufwert verlangt; fehlende oder zusätzliche Argumente ohne
  Inspektion, Konvertierung, Größenprüfung, Parsing, Clock- oder
  Generatorzugriff als statischen lokalen `invalidInvocation`-Result
  abgelehnt.
- ✅ Jeden Aufruf auf den tief eingefrorenen exakten Fünf-Felder-Result
  `ok`, `status`, `syncRequest`, `gatewayErrorResponse` und `error`
  begrenzt; lokale Fehler strikt von SyncContract-Responses getrennt.
- ✅ Unveränderten Einzelwert zuerst mit `validateSyncRawBodySize` geprüft und
  nur einen bestandenen String exakt einmal nativ ohne Reviver geparst.
  Übergröße besitzt Vorrang vor JSON-Syntax.
- ✅ Unveränderten Parsed-Wert vor jeder Projektion vollständig gegen den
  bestehenden geschlossenen SyncContract validiert. Zusatzfelder werden nicht
  zuerst entfernt; es gibt keine Reparatur, Normalisierung, Trimmung, Merge-
  oder Stringify-/Parse-Roundtrip.
- ✅ Descriptor-basiert eine neue Sechs-Felder-Projektion mit frischem exakt
  leerem Payload erzeugt, mit derselben einmal erfassten Referenzzeit erneut
  validiert, tief eingefroren und final nochmals validiert. Parsed-Original und
  Ausgabe teilen keine mutablen Recordidentitäten.
- ✅ Statische Fehlerzuordnung umgesetzt: `rawBodyTooLarge` zu
  `PAYLOAD_TOO_LARGE`, andere reguläre Raw-Body-Fehler zu
  `VALIDATION_ERROR`, Parser-Throw zu `INVALID_JSON`, alleinige
  Versions-/Aktionsfehler zum spezifischen Profil und sonstige oder gemischte
  Requestfehler zu `VALIDATION_ERROR`.
- ✅ `invalidReferenceTimestamp` sowie unerwartete Builder-, Projektions-,
  Freeze- oder Validatorinkonsistenzen als statischen lokalen
  `boundaryFailed`-Pfad ohne Gateway-Response behandelt. `FORBIDDEN`,
  `SERVICE_UNAVAILABLE` und `INTERNAL_ERROR` werden an dieser Grenze nicht
  erfunden.
- ✅ Jede beherrschte Ablehnung als neue vollständig validierte und tief
  eingefrorene frühe Gateway-Fehlerresponse mit kontrollierter `gateway_`-ID,
  `action: null`, `handledBy: null`, leerer Verarbeitungskette und statischem
  `durationMs: 0` erzeugt; eingehende `req_`-IDs werden nie gespiegelt.
- ✅ Clock bei einem akzeptierten Request oder einer ausgegebenen
  Gateway-Fehlerresponse jeweils exakt einmal ausgewertet. Generator nur für
  eine tatsächlich benötigte Ablehnung verwendet; Default ausschließlich
  `gateway_ + crypto.randomUUID()` ohne schwächeren Fallback.
- ✅ Native Last-Key-Wins-Semantik doppelter JSON-Membernamen und die
  Single-Parser-Grenze dokumentiert; kein eigener Parser, Reviver,
  Duplicate-Key-Scanner oder kanonisches JSON behauptet.
- ✅ Materialisierte Stringgrenze von der späteren Wire-Grenze getrennt:
  tatsächliche Raw Bytes müssen an der späteren Transportgrenze vor
  String-Materialisierung und kontrollierter Decodierung begrenzt werden. Die
  Boundary ist keine HTTP-, Webhook-, Body-Allokations- oder DoS-Durchsetzung.
- ✅ Function-, Function-Proxy-, Reflection-, Intrinsic- und Deep-Freeze-
  Grenzen sowie die fehlende rückwirkende Kontrolle ausgelöster
  Seiteneffekte in ADR 0018 dokumentiert.

### Abgeschlossener Entscheidungsslice: ADR 0019 – Local SyncGateway before n8n Cloud Decision

ADR 0019 ist seit `2026-08-21` durch ADR 0023 ersetzt. Die folgenden Punkte
dokumentieren den damaligen Entscheidungsstand und werden nicht rückwirkend als
aktuelle Zieltopologie gelesen.

- ✅ ADR 0019 als angenommene Architektur- und Sicherheitsentscheidung
  dokumentiert, ohne ADR 0002, ADR 0005 oder ADR 0016–0018 zu ersetzen.
- ✅ Den Zielpfad
  `Browser → SyncService → künftiger lokaler SyncTransport → künftiges lokales
  SyncGateway auf GD-WS01 → authentisierter n8n-Cloud-Webhook → SyncAgent`
  sowie die Trust Zones A, B und C festgelegt.
- ✅ Lokale HTTP-, Raw-Wire-, UTF-8-, Boundary-, Capability-, Secret-, Cloud-,
  Response-, Timeout-, Rate-Limit-, Privacy- und Retention-Grenzen entschieden
  beziehungsweise ausdrücklich als spätere Gates gekennzeichnet.
- ✅ Den n8n-Plattformbefund vom 2026-08-15 und die Strategie eines
  reproduzierbar generierten, integritäts-, paritäts- und
  mutationsgeprüften Boundary-Artefakts dokumentiert.
- ✅ Zum damaligen Entscheidungsstand alle Komponenten dieses Zielpfads als
  geplant und nicht implementiert ausgewiesen; Vertrag, Service, Boundary,
  Paketversion und veröffentlichtes Release blieben unverändert. Diese
  historische Aussage wird durch den nachfolgenden Implementierungsslice nicht
  rückwirkend verändert.

### Abgeschlossener Slice: Local SyncGateway Raw-Wire and HTTP Foundation

Produktionscode, Tests, Dokumentation und Build dieses Slices sind vollständig
implementiert und verifiziert:

- ✅ Die drei getrennten Module
  `server/localSyncGatewayRuntimeConfig.js`,
  `server/localSyncGatewayHttpServer.js` und
  `server/startLocalSyncGateway.js` sowie das explizite Paket-Script
  `gateway:local` sind vorhanden. Modulimporte starten keinen Listener.
- ✅ Runtime-Konfiguration akzeptiert ausschließlich
  `GOLDENDAWN_SYNC_GATEWAY_PORT` mit `1` bis `65535` und eine exakte
  Loopback-HTTP(S)-Origin aus
  `GOLDENDAWN_SYNC_GATEWAY_ALLOWED_ORIGIN`. Port `0` bleibt ausschließlich der
  direkten Factory für Tests vorbehalten.
- ✅ Der Server bindet unabhängig von Eingaben fest an `127.0.0.1`; Route und
  Host sind exakt `/api/sync-test` und bei Port `80` ausschließlich
  `127.0.0.1` beziehungsweise `127.0.0.1:80`, bei allen anderen Ports exakt
  `127.0.0.1:<tatsächlich gebundener Port>`. Die interne Node-Option
  `requireHostHeader: false` deaktiviert nur die vorgezogene automatische
  Hostantwort und öffnet keinen akzeptierenden Pfad. Im ansonsten regulären
  Requestpfad, sofern keine frühere fail-closed Target- oder
  Sonderpfadablehnung greift, bleiben fehlende, doppelte und falsche Hostwerte
  verpflichtend und werden nach Admission unter dem eigenen Response-Owner als
  statischer `invalidHttpRequest`-Envelope abgelehnt.
- ✅ Die öffentliche HTTP-Moduloberfläche ist auf den eingefrorenen
  `LOCAL_SYNC_GATEWAY_HTTP_LIMITS`-Record und
  `createLocalSyncGatewayHttpServer` begrenzt. Die Factory liefert exakt die
  eingefrorene, argumentlose, Promise-basierte API `{ start, stop }`.
- ✅ Lifecycle-Results besitzen exakt `{ ok, status, host, port, error }` und
  trennen `started`/`stopped` von `alreadyStarted`, `startFailed`,
  `notStarted`, `alreadyStopped` und `stopFailed` mit statischen redigierten
  Profilen. Der Listening-Handler kapselt den vollständigen Zugriff auf
  `server.address()` einschließlich des jeweils einmaligen Lesens von
  `address` und `port`; ein werfender Getter führt über den normalen
  `startFailed`-Cleanup und löst kein `onFatal` aus. Erfolgreich sind nur
  gemeldete Safe-Integer-Ports von `1` bis `65535`; ein Produktionsport muss
  exakt dem angeforderten Port entsprechen, während Factory-Port `0` jeden
  tatsächlich gebundenen Port dieses Bereichs akzeptiert. Gemeldete Werte
  `0`, `-1`, `65536` oder ein abweichender Produktionsport führen ebenfalls
  vollständig zum redigierten Start-Cleanup ohne Fatal-Aufruf. Ein
  Serverfehler nach dem Start verwirft den gebundenen Port sofort, setzt den
  Zustand auf fehlgeschlagen, schließt den Listener defensiv, zerstört alle
  verfolgten Sockets und sperrt weitere Request-, Decoder- und
  Boundary-Verarbeitung ohne Exception-Leak. Der interne Port
  `onFatal = () => {}` signalisiert diesen
  Zustand payloadlos und höchstens einmal, konsumiert Throws sowie Rejections
  und erweitert die öffentliche `{ start, stop }`-API nicht.
- ✅ `rawHeaders`, höchstens 32 Headerfelder plus Feld-33-Sentinel, exakter
  Host, `POST`/`OPTIONS`, sicherheitsrelevante Duplikate, Origin, Content-Type,
  Content-Encoding, Content-Length, Transfer-Encoding, Connection, Expect,
  Upgrade und Trailer werden nach fester fail-closed Policy behandelt. Das
  Gateway unterstützt ausschließlich HTTP/1.1; HTTP/1.0 wird statisch als
  `invalidHttpRequest` abgelehnt, bevor Raw-Header-Projektion, Decoder oder
  Boundary erreicht werden.
- ✅ Ein exakt bestandener bodyfreier Preflight antwortet `204`, ohne Decoder
  oder Boundary aufzurufen. Die exakte Origin wird ohne Wildcard oder
  Credentials freigegeben; CORS und Loopback bleiben ohne Identitäts- oder
  Autorisierungswirkung.
- ✅ Der lokale Prozess setzt 8.192 Headerbytes, 32 Headerfelder,
  5.000 ms Headerzeit, 10.000 ms Requestzeit, 10.000 ms Socketzeit,
  einen festen 100-ms-`connectionsCheckingInterval`, 1.000 ms Keep-Alive,
  höchstens einen Request pro Socket und `Connection: close` durch. Bei
  responsivem Eventloop werden Header- und Requestfrist höchstens 100 ms nach
  der nominellen Frist erkannt; Scheduling kann den beobachteten Abschluss
  zusätzlich verzögern. Die feste Testpolicy 250/500/500/25 ms ist nur mit
  `useTestTimeoutPolicy: true` und Factory-Port `0`, nie über die beiden
  Runtime-Umgebungsvariablen erreichbar. Dies ist keine Kernel-,
  Vorallokations- oder DoS-Garantie; Rate Limits bleiben geplant.
- ✅ Eine factory-lokale Request-Admission ist vom Response-Owner getrennt und
  bildet den ersten gemeinsamen Anwendungsschritt für `request`,
  `checkContinue` und `checkExpectation`. Nur der erste Request eines
  physischen Sockets wird weiterverarbeitet; jedes Folgeereignis beansprucht
  den terminalen Response-Owner, pausiert und zerstört den Socket ohne zweite
  Response vor HTTP-Version, Headerprojektion, Decoder und Boundary.
  `maxRequestsPerSocket: 1` und `dropRequest` bleiben zusätzliche
  Defense-in-Depth. Die mutationswirksame Reihenfolge verlangt beim ersten
  gültigen HTTP/1.1-Request exakt einen Decoderfactory-, Decode- und
  Boundary-Aufruf mit dessen Raw Body; jedes zweite reguläre oder Expect-
  Ereignis liest `rawHeaders` kein einziges Mal und endet terminal.
- ✅ Tatsächlich empfangene Bufferbytes werden gegen die importierte
  kanonische Grenze von 65.536 Bytes gezählt. Beim Übergang zu Byte 65.537 wird
  die begrenzte Chunkliste geleert, der Request pausiert und `413` gesendet,
  ohne einen übergroßen Gesamtbuffer zusammenzufügen.
- ✅ Der vollständige begrenzte Buffer wird mit einem verifizierten
  `TextDecoder('utf-8', { fatal: true, ignoreBOM: true })` exakt einmal
  dekodiert. Ungültiges UTF-8 wird fail-closed abgelehnt; U+FEFF bleibt
  erhalten. Es gibt keine Normalisierung, Trimmung oder Reparatur.
- ✅ Nur der resultierende String gelangt exakt einmal an die bestehende
  Boundary. Das HTTP-Modul besitzt keinen JSON-Parser. Eine kontrollierte
  Boundary-Ablehnung bleibt ausschließlich ihre nochmals validierte
  `gatewayErrorResponse` über HTTP `400`; sie wird nicht zum lokalen Envelope.
- ✅ Lokale HTTP-Fehler verwenden exakt
  `{ ok: false, status, error: { code, message } }` und ausschließlich die
  Statuswerte `400`, `403`, `404`, `405`, `413`, `415`, `417`, `431`,
  `500` und `503`. Boundary-Akzeptanz endet statisch mit lokalem `503`, nicht
  mit einer gespiegelten Projektion oder normalen SyncResponse.
- ✅ Pro physischem Socket kann genau ein Anwendungs- oder Raw-Socket-Pfad
  Responsebesitz übernehmen. Danach schreibt `clientError` keine zweite
  Response; Parserfehler vor einer Übernahme erhalten weiterhin genau eine
  kontrollierte, statisch redigierte Raw-Response. Raw-Pfade schreiben diese
  best effort, konsumieren asynchrone Schreibfehler und zerstören den Socket
  danach zuverlässig; bei bereits beanspruchtem Owner erfolgt ohne Write der
  unmittelbare Destroy. Der synchrone `dropRequest`-Handler zerstört einen von
  Node zusätzlich verworfenen Folgerequest ohne weitere
  Node- oder Gateway-Response.
- ✅ Browser-SyncTransport, Cloud-Upstream, n8n-Webhook und -Workflow,
  generiertes Boundary-Bundle, Authentisierungsheader, Secret, operativer
  `SyncAgent`, Normalresponse, Persistenz, Requestlogs, Telemetrie, Rate Limit
  und `src/main.js`-Komposition bleiben außerhalb dieses Slices.
- ✅ Regressionen decken zehn gepipelinete HTTP/1.0-Keep-Alive-Requests,
  mehrere HTTP/1.1-Requests, Expect-/`checkContinue`-/`checkExpectation`-
  Pipelines sowie werfende `address`- und `port`-Getter beim Start ab. Eine
  zusätzliche Pipeline aus hostlosem HTTP/1.1-`OPTIONS` und gültigem POST
  beobachtet bei deaktiviertem Node-Requestlimit exakt zwei
  Anwendungsereignisse, kein `dropRequest`, null Decoder-/Boundary-Aufrufe und
  den eigenen statischen Hostfehler. Die reguläre HTTP/1.1-Regression belegt
  den ersten Raw Body und exakt je einen Decoderfactory-, Decode- und
  Boundary-Aufruf; beim zweiten regulären sowie bei zweiten Expect-Ereignissen
  bleibt der instrumentierte `rawHeaders`-Zugriff exakt null und der Zustand
  terminal. Gemeldete Ports `0`, `-1`, `65536` sowie ein abweichender gültiger
  Produktionsport enden mit `startFailed`, vollständigem Cleanup und ohne
  `onFatal`. Globale Instrumentierungen laufen mit `concurrency: false` und
  vollständigem `finally`-Restore. Pro Socket erscheint höchstens eine
  Statuszeile; private Marker werden weder gespiegelt noch geloggt.
- ✅ Die gezielte Local-SyncGateway-Suite besteht mit 50/50 Tests, die
  kombinierte Suite mit Boundary, SyncContract und SyncService mit 192/192 und
  die vollständige serielle Suite mit 1125/1125 Tests. Alle Läufe besitzen 0
  Fehlschläge, 0 Skips und 0 Todos. Der Produktions-Build ist erfolgreich und
  transformiert weiterhin exakt 46 Browsermodule.

### Abgeschlossener Slice: Generated n8n Boundary Bundle Foundation

- ✅ ADR 0021 als Implementierungsentscheidung angenommen, ohne ADR 0016 bis
  ADR 0020 rückwirkend zu verändern.
- ✅ `src/contracts/syncContract.js` und
  `src/gateways/syncGatewayRequestBoundary.js` bleiben unverändert die einzigen
  fachlich kanonischen Quellen. Der Entry ist eine kleine explizit gepflegte,
  manifestierte nichtfachliche Glue- und Quelldatei; der Generator ist
  gepflegtes Repository-Tooling. Ausschließlich Bundle und Manifest sind
  reproduzierbar generierte Derivate.
- ✅ Den minimalen Entry `scripts/n8n/syncGatewayBoundaryBundleEntry.js` und den
  deterministischen Generator
  `scripts/n8n/generateSyncGatewayBoundaryBundle.js` ergänzt. Die vorhandene
  lockfile-gebundene Vite-`8.1.4`-/Rolldown-Toolchain wird ohne neue Dependency
  verwendet.
- ✅ `npm run bundle:n8n:generate` zum Aktualisieren und
  `npm run bundle:n8n:check` als schreibfreien Driftcheck bereitgestellt.
- ✅ Ein eigenständiges Artefakt aus statischem Header und direkt bindbarem
  Expression-IIFE ohne Top-Level-`var` oder Globalmutation erzeugt.
  `"use strict";` ist dessen erster IIFE-Body-Prolog und kein
  Top-Level-Statement; nach dem Ausdruck folgt kein separates
  Semikolon-Statement. Die unveränderten Artefaktbytes sind direkt hinter
  `const boundaryBundle =` bindbar und ihre Auswertung liefert exakt die
  eingefrorene API `{ createSyncGatewayRequestBoundary }`. Die
  Factory-API bleibt exakt `{ processSyncRawBody }`; das Laden verarbeitet
  keinen Request und mutiert keinen globalen Namespace.
- ✅ Laufzeitimports, Source Map, Netzwerk-, Dateisystem-, Prozess-,
  Environment-, Credential-, Secret-, Log-, Telemetrie- und n8n-Inputpfade aus
  dem Artefakt ausgeschlossen.
- ✅ Ein deterministisches Manifest mit fester Schema- und Propertyreihenfolge,
  SHA-256 über die exakten Artefaktbytes und die geordneten Contract-,
  Boundary- und Entrybytes ergänzt. Zeit, Locale, Host und absolute Pfade gehen
  nicht in Artefakt- oder Manifestbytes ein.
- ✅ Contract, Boundary und Entry jeweils exakt einmal über sichere FileHandles
  gelesen; SHA-256 und Vite-Virtualmodule aus demselben danach unveränderlichen
  In-Memory-Snapshot erzeugt und die ABA-Grenze automatisiert geprüft.
- ✅ Kanonischen Repository-Root, Zielordner und feste Outputpfade vor Writes
  auf Containment, von Node erkannte symbolische Links und Junctions sowie
  `realpath`-Abweichungen geprüft; unvorhersagbar benannte exklusive
  Tempdateien im verifizierten Zielordner, Identitäts- und Byteprüfung,
  Artefakt-Replace vor Manifest-Replace, abschließende Paarprüfung und
  identitätsgebundenes Tempcleanup umgesetzt. Weder atomare Paarupdates noch
  Power-Loss-/Single-Writer-Sicherheit, vollständige Erkennung aller
  Windows-Reparse-Tags oder Schutz gegen bösartige gleichzeitige
  Reparse-Rennen werden behauptet.
- ✅ Reproduzierbarkeit, eingecheckte Integrität und anforderungsbezogene,
  strukturgenaue Boundary-Parität einschließlich Prototypen, Freeze, Identitäten,
  Dependencygrenzen, Redaction und Console-Stille automatisiert abgedeckt.
- ✅ Temporäre Mutationstests für Artefaktbyte, Quelldrift, semantische
  Abweichung und entfernte API-/Freeze-Garantie ergänzt, ohne kanonische Dateien
  zu verändern.
- ✅ Kein Workflow, Webhook, Credential, Secret, Authentisierungsheader,
  Browser- oder Cloudtransport, Cloudaufruf, operativer `SyncAgent`, normaler
  Upstream, UI oder externer Datenfluss eingeführt. Zum damaligen ADR-0019-
  Zielpfad blieb der versions- und tenantgebundene n8n-Raw-Body-Nachweis
  Voraussetzung jeder Aktivierung. ADR 0023 verlangt diesen Nachweis nicht für
  ursprüngliche Browserbytes im späteren nachgelagerten, sanitisierten
  Adapterpfad; Bundle und Manifest bleiben korrekt, unkomponiert und inaktiv.
- ✅ Die gezielte Bundle-Suite besteht mit 61/61 Tests; Bundle zusammen mit der
  SyncGateway Request Boundary besteht mit 115/115 Tests.
- ✅ SyncContract, SyncService, Boundary, Local SyncGateway und Bundle bestehen
  kombiniert mit 253/253 Tests; die vollständige serielle Suite besteht mit
  1186/1186 Tests. Alle Läufe besitzen 0 Fehlschläge, 0 Skips und 0 Todos. Der
  Produktions-Build transformiert weiterhin exakt 46 Browsermodule; der
  Bundle-Check meldet keinen Drift.

### Abgeschlossener lokaler Slice: n8n Cloud Ingress & Runtime Evidence Gate Foundation

- ✅ ADR 0022 mit den exakten Gatezuständen `PASS`, `FAIL` und `UNPROVEN`,
  `FAIL`-Präzedenz, vollständiger Bindungspflicht und vier strikt getrennten
  Evidenzklassen angenommen.
- ✅ Die vier getrennten Dateien
  `scripts/n8n/n8nCloudIngressProbe.js`,
  `scripts/n8n/n8nCloudIngressProbeObserver.js`,
  `tests/n8nCloudIngressProbe.test.js` und
  `docs/evidence/n8n-cloud-ingress-runtime-evidence.template.json` ergänzt.
- ✅ Exakt 32 feste synthetische Vektoren für JSON- und Textbytes,
  gültiges und ungültiges UTF-8, BOM, NFC/NFD, CRLF/Whitespace, NUL,
  65.535-/65.536-/65.537-Byte-Grenzen, fehlendes und fünf konkrete
  Content-Encoding-/Kompressionsprofile, Header Authentication einschließlich
  gleicher Duplikate sowie beider Reihenfolgen widersprüchlicher Duplikate und
  `Content-Length`-/Chunked-Framing festgelegt. Der alte
  `auth-duplicate-conflicting` entfällt; verbindlich sind
  `auth-duplicate-conflicting-correct-first-wrong-last` und
  `auth-duplicate-conflicting-wrong-first-correct-last`.
- ✅ Identische Auth-Bodies, identische absent-/identity-Bodies, identische
  `Content-Length`-/Chunked-Bodies, A-Präfix-kompatible Größenfixtures, einen
  gemeinsamen dekomprimierten Sentinel für `gzip`/`deflate`/`br` und einen
  getrennten 65.537-Byte-Expansionsvektor als Kataloginvarianten festgelegt.
- ✅ `npm run probe:n8n:cloud:test -- --vector <probeId>` als kanonischen und
  vorgesehenen Operator-Laufweg für einen One-shot festgelegt. Das Paket-
  Script bindet intern exakt
  `node scripts/n8n/n8nCloudIngressProbe.js --run`. Import, bloße Factory-
  Erzeugung, Build, Dev-Server und Bundle-Check binden keinen Real-HTTPS-
  Transport; Tests nutzen ausschließlich Doubles und für den HTTP/1.1-
  Wirenachweis kontrolliertes TCP-Loopback auf `127.0.0.1`, niemals einen
  externen Endpoint.
  Endpoint und Wegwerfsecret kommen ausschließlich aus
  `GOLDENDAWN_N8N_CLOUD_PROBE_ENDPOINT` und
  `GOLDENDAWN_N8N_CLOUD_PROBE_SECRET`.
- ✅ HTTPS-only ohne URL-Userinfo, Query oder Fragment und ausschließlich für
  kanonische Pfade der Form `/webhook-test/<segment>[/<segment>…]` festgelegt.
  Jedes nicht leere Suffixsegment verwendet nur ASCII-Buchstaben, Ziffern,
  Bindestrich oder Unterstrich; Prozentkodierungen, rohe oder kodierte
  Backslashes, Steuerzeichen, leere Segmente sowie `.` und `..` werden vor der
  Transportauflösung abgelehnt. Hinzu kommen eine feste 5.000-ms-Deadline,
  höchstens 16 KiB Responsebytes sowie keine Redirects oder automatischen
  Retries. Ein Lauf validiert genau eine allowlist-basierte ID, sendet genau
  einen Request und stoppt. Vor jedem weiteren Vektor muss der Operator den
  Test-Webhook manuell neu registrieren beziehungsweise in Listening
  versetzen. Sweep, Autoregister und Production-URL-Runner sind ausgeschlossen.
  Die Factory verwendet nur einen explizit injizierten Transport; Real-HTTPS
  wird erst im CLI-Adapter nach vollständiger Argument-, Konfigurations- und
  ID-Validierung gebunden.
- ✅ Den menschenprüfbaren importfreien Code-Node-Observer ausschließlich auf
  die offiziell dokumentierte Binary-Buffer-API
  [`this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName)`](https://docs.n8n.io/build/code-in-n8n/cookbook/code-node/get-the-binary-data-buffer/)
  und die geschlossene Sechs-Felder-Response einschließlich
  `authorizationHeaderPresence` und `contentEncodingOutcome` begrenzt. Er bindet weder
  SyncContract, Request Boundary, Boundary-Bundle noch `SyncAgent` ein.
- ✅ Geschlossene Observer-, Runner- und Evidenzverträge mit defensiver
  Projektion und statischer Redaction umgesetzt. Endpoint, Tenantdomain,
  URL-Pfad, Secret, Credential-/Authorization-Werte und -Header, Bodies,
  Binärbytes und Base64 gelangen nicht in Ausgabe oder Evidenz. Die
  `executionDataSettings` umfassen exakt die Save-/Pruning-Felder und
  `readTimeRedaction`. Read-time-Redaction ist notwendig, aber nicht
  hinreichend und verändert laut
  [offizieller Dokumentation](https://docs.n8n.io/deploy/host-n8n/configure-n8n/security/redact-execution-data/)
  gespeicherte Daten nicht. Unsichere beobachtete Einstellungen sind `FAIL`,
  fehlende Einstellungen `UNPROVEN`. Provider-`PASS` verlangt zusätzlich
  nicht-nullische `tenantAlias`, `observedAt`, `timezone`, `n8nBuild`,
  `webhookNodeTypeVersion` und `secretFreeWorkflowSha256`; `plan` und `region`
  dürfen `null` bleiben. Fehlt eine Pflichtbindung, ist der Providerstatus ohne
  bekannten Widerspruch `UNPROVEN`; bekannte unsichere Setting-, Header-,
  Count- oder Attributionswerte behalten `FAIL`-Präzedenz.
- ✅ Das persistierbare Schema 1 ohne `overallGate` auf getrennte Felder
  festgelegt: `endpointKind: test`, `testUrlTenantMeasurementStatus`,
  `stableOssCompatibility: FAIL`, `providerExecutionEvidenceStatus`,
  `productionUrlMeasurementStatus: UNPROVEN` und
  `activationDecision: FAIL`. Die beiden variablen Statusfelder bleiben ohne
  Lauf `UNPROVEN`; `activationDecision: PASS` ist in Schema 1 ausgeschlossen.
  Eine Änderung der festen OSS-, Production- oder Aktivierungswerte benötigt
  einen neuen ADR und eine neue Schemaversion. Ein One-shot-Vektor-`PASS` kann
  nie den Tenantgesamtstatus oder eine Aktivierung öffnen.
- ✅ Pro Vektor die 13 geschlossenen Felder von `probeId` bis `gate`
  einschließlich nullable `httpStatus`, `observerCallCount`,
  `workflowExecutionCount`, `uniqueVectorAttribution`,
  `authorizationHeaderPresence` und `contentEncodingOutcome` festgelegt.
  Counts werden nie aus HTTP-Antworten erfunden. Nach einer übernommenen
  geschlossenen erfolgreichen `2xx`-Observerresponse muss jeder bekannte Count
  exakt `1` sein; `0` oder größer als `1` ist `FAIL`. `null` bleibt bei
  normalen und komprimierten Erfolgswegen zulässig, sofern das Einzelgate den
  Count nicht verlangt. Frühe eindeutig gebundene Auth-Ablehnungen mit `400`,
  `401` oder `403` und Encoding-Ablehnungen mit `400` oder `415` dürfen
  weiterhin 0/0 verwenden; `auth-correct` verlangt unverändert 1/1 und
  eindeutige Zuordnung gemäß ADR 0022.
- ✅ Die negativen commitgebundenen Stable-OSS-Befunde für
  `gzip`/`deflate` vor `req.rawBody` und den Header-Auth-Wert im Standard-
  Webhook-Output als `FAIL` dokumentiert. Kein Cloudrequest wurde ausgeführt;
  der konkrete Tenant bleibt `UNPROVEN`, das resultierende Aktivierungsgate
  `FAIL` und geschlossen.
- ✅ Den commitgebundenen
  [Test-Webhook-Lifecycle-Quellanker](https://github.com/n8n-io/n8n/blob/d2ce3c084c228622c2ffe7c245d25870430e18a9/packages/cli/src/webhooks/test-webhooks.ts)
  dokumentiert, ohne daraus unbenannte Symbol-, Zeilen- oder Tenantgarantien
  abzuleiten.
- ✅ Keine Boundary-Bundle-Komposition, keinen Workflow, Webhook, Tenant,
  Credential, Cloud-Upstream oder operativen `SyncAgent` eingeführt. Lokal
  akzeptierte Requests enden weiterhin statisch mit HTTP `503`.
- ✅ Die gezielte Evidence-Suite besteht mit 26/26 Tests, Bundle und Boundary
  unverändert mit 115/115 und die kombinierte Sync-Suite einschließlich der
  Evidence-Foundation mit 279/279 Tests. Die vollständige serielle Gesamtsuite
  besteht mit 1212/1212 Tests; alle Läufe besitzen 0 Fehlschläge, 0 Skips und
  0 Todos. Beide neuen Skripte bestehen die Syntaxprüfung, der Produktions-
  Build transformiert weiterhin exakt 46 Browsermodule und der schreibfreie
  Bundle-Check meldet keinen Drift.

ADR 0022 bleibt unverändert angenommen und dokumentiert den gescheiterten
beziehungsweise unbewiesenen ursprünglichen n8n-Ingresspfad. Seine Evidenz ist
keine Freigabe eines optionalen WorkflowProvider-Adapters.

### Abgeschlossene Grundlage: Local Model-free SyncAgent Core / ADR 0024

- ✅ `src/agents/syncAgent.js` exportiert ausschließlich
  `createSyncAgent({ getCurrentTimestamp = defaultUtcClock } = {})`; die
  frische eingefrorene API enthält exakt die synchrone Einargumentmethode
  `processSyncRequest`.
- ✅ Jeder beherrschte Aufruf liefert einen frischen tief eingefrorenen
  Vier-Felder-Result.
  Erfolg verwendet `syncResponseCreated`; `invalidInvocation`,
  `syncRequestRejected` und `agentFailed` bleiben getrennte statische lokale
  Profile ohne Request-ID-, Validator- oder Exceptionleak.
- ✅ Die Clock wird auf jedem zulässigen Einargumentpfad exakt einmal als
  primitiver String erfasst. Eine ungültige Referenzzeit besitzt Vorrang;
  `durationMs: 0` ist statisch und ungemessen.
- ✅ Der unveränderte Input wird zuerst validiert. Danach entsteht eine frische
  descriptorbasierte Sechs-Felder-Projektion mit neuem leerem Payload, die vor
  und nach ihrem Deep Freeze erneut validiert wird. Calleridentitäten werden
  weder übernommen noch eingefroren.
- ✅ Die private Allowlist enthält ausschließlich `syncTest`. Die neue
  korrelierte synthetische Erfolgsresponse wird vor und nach ihrem Deep Freeze
  gegen denselben internen Request validiert und enthält exakt
  `handledBy: "SyncAgent"`, `warnings: []`, `dataOrigin: "synthetic"`,
  `durationMs: 0` und `processedBy: ["SyncAgent"]`.
- ✅ Bei erfolgreicher Modulevaluation erfasste private Referenzen auf
  `Object.freeze`, `Object.isFrozen`, `Object.getPrototypeOf`,
  `Object.getOwnPropertyDescriptor`, `Object.hasOwn` und `Reflect.ownKeys` sowie
  die `Object.prototype`-Identität sichern den terminalen Verifier für Factory-
  API, Errorrecords, Failure- und Success-Results sowie sämtliche tatsächlichen
  Frozen-Prüfungen ab. Interne Request-/Response-Reflection und
  `Object.freeze` bleiben live; ein beobachteter Reflection-/Freeze-Throw,
  No-op, eine Mutation oder Inkonsistenz endet redigiert mit `agentFailed`.
- ✅ Der Modulimport startet nichts. Die Factory ruft die aufgelöste
  Clockfunktion nicht auf und startet selbst kein I/O, keinen Timer und keinen
  Providerpfad. Ihre Parameterdestrukturierung löst jedoch die
  vertrauenswürdige Composition-Property `getCurrentTimestamp` auf; ein
  Accessor oder Proxy im Container kann deshalb während der Factory-Erzeugung
  ausgeführt werden oder werfen, außerhalb des Methoden-Resultvertrags. Erst
  `processSyncRequest` mit exakt einem Argument ruft die aufgelöste
  Clockfunktion genau einmal auf. Es gibt keine `src/main.js`- oder Gateway-
  Komposition.
- ✅ Bereits vor der Modulevaluation kompromittierte Primordials, veränderter
  Modulcode oder lexikalische Bindungen, eine kompromittierte JavaScript-
  Engine, OOM oder Prozessabbruch sowie beliebig koordinierte Manipulation
  sämtlicher Reflection-Intrinsics bleiben ausdrücklich außerhalb der
  Garantie. Same-Realm-Ausführung und Deep Freeze sind keine Sandbox.
- ✅ Die gezielte neue Suite besteht mit 103/103 Tests, die vier kombinierten
  Sync-Suites mit 245/245 Tests und die vollständige serielle Suite mit
  1315/1315 Tests, jeweils bei 0 Fehlschlägen, 0 Skips und 0 Todos. Der
  Produktions-Build transformiert weiterhin exakt 46 Module; der schreibfreie
  n8n-Bundle-Driftcheck besteht.

### Portfolio-Nachweis des isolierten SyncAgent-Kerns

- synchroner modell- und providerfreier `syncTest`-Kern mit klarer öffentlicher
  API und statischen lokalen Resultprofilen;
- mutationswirksame Nachweise für Arity, Clock, Originalvalidierung,
  Projektion, Korrelation, Freeze, Revalidierung, Redaction und disjunkte
  Objektgraphen;
- kein externer Datenfluss und keine operative Erreichbarkeit: Der HTTP-Pfad
  bleibt bis zur nächsten getrennten Komposition bei `503`.

### Abgeschlossener Entscheidungsslice: Local SyncGateway–SyncAgent Composition / ADR 0025

- ✅ ADR 0025 am `2026-08-23` angenommen. Er ergänzt ADR 0023, erfüllt das von
  ADR 0024 verlangte Entscheidungsgate und lässt ADR 0016, ADR 0017, ADR 0018,
  ADR 0020 sowie ADR 0023 und ADR 0024 unverändert.
- ✅ Die spätere Komposition ausschließlich im bestehenden Gateway-Prozess auf
  GD-WS01 entschieden. `server/startLocalSyncGateway.js` bleibt der einzige
  Produktions-Kompositionsroot und injiziert später genau eine lokale
  SyncAgent-Instanz pro HTTP-Server-Factory als erforderliche Dependency ohne
  versteckten Agentendefault.
- ✅ Ausschließlich die exakte defensive Boundary-Requestidentität darf den
  Agenten synchron, mit einem Argument und pro akzeptiertem Pfad höchstens
  einmal erreichen. Raw-/HTTP-/Socketmaterial, Secrets, private Modulwerte und
  Fehlerresponses bleiben vor der Agentengrenze.
- ✅ Das Agentenresultat als unvertrauenswürdig festgelegt. Nur der exakte
  tief eingefrorene ADR-0024-Erfolg darf nach Originalvalidierung in einen
  frischen disjunkten Zehn-Felder-Responsegraphen projiziert, revalidiert, tief
  eingefroren, final revalidiert und genau einmal vorab serialisiert werden.
- ✅ Die terminale Grenze auf bei Gateway-Modulevaluation erfasste Object-/
  Array-Prototypen, Reflection-, Freeze-/Frozen-Funktionen, `Array.isArray` und
  `JSON.stringify` begrenzt. Nach der letzten untrusted Reflection müssen
  exakte Prototypen, Own-Data-Properties und Freeze sowie danach mit der
  erfassten `Object.getPrototypeOf`-Referenz exakt
  `capturedGetPrototypeOf(capturedArrayPrototype) === capturedObjectPrototype`
  und anschließend
  `capturedGetPrototypeOf(capturedObjectPrototype) === null` bestehen. Zulässig
  sind ausschließlich `Response-Record → capturedObjectPrototype → null` und
  `Response-Array → capturedArrayPrototype → capturedObjectPrototype → null`.
  Erst danach werden der erfasste Array- und anschließend der
  erfasste Object-Prototyp auf eine eigene `toJSON`-Property geprüft; dann darf
  die erfasste Erfolgsserialisierung genau einmal laufen. Eine Kettenabweichung
  ergibt vor Responsebesitz statisch `500 gatewayFailed`, null Aufrufe dieser
  Serialisierung und keinen serialisierten kompromittierten Graphen. Fremder
  Body, Sentinel und Exceptiontext werden nicht ausgegeben; eine zweite
  Response entsteht nicht.
- ✅ Den synchronen Handoff als Nicht-Assimilationsgrenze präzisiert: kein
  `await`, `Promise.resolve` oder Promise-/Thenable-Auflösen. Echte Promises,
  Results mit zusätzlicher eigener `then`-Property sowie anderweitig malformed
  Results scheitern an der exakten Form; geerbtes oder virtuell angebotenes
  `then` wird
  nicht eigens gelesen und keine universelle Erkennung behauptet.
- ✅ Das Gateway bleibt alleiniger HTTP-, CORS-, Response-, Socket- und
  Cleanup-Owner. Ein späterer exakter Erfolg ergibt HTTP `200`; Agenten-,
  Response-, Projektions-, terminale Shape-/Prototype-/Freeze-/`toJSON`-,
  Revalidierungs- und Vorabserialisierungsfehler ergeben statisch
  `500 gatewayFailed` und keine neue `400`-, `502`-, `503`- oder
  `504`-Zuordnung.
- ✅ Den engen Phase-0-/EU-Tor-A-Nachweis als vorläufige Nicht-KI-
  Arbeitshypothese ausschließlich für diesen bei stabilem Request und Clockwert
  deterministischen Slice dokumentiert: kein Modell, keine modell-, lern- oder
  statistikbasierte Inferenz, kein Training, Lernen oder Adaptieren, sondern
  feste Validierungs-, Projektions-, Korrelations- und Mappingregeln. Das
  Inhalts-Payload ist bestimmungsgemäß exakt leer und der Pfad greift nicht auf
  PromptVault, LearningHub, LichtwaldLog oder GoldenDawn-Vault zu und
  verarbeitet oder überträgt bestimmungsgemäß keine privaten Inhalte;
  Metadaten können dennoch private Bedeutung codieren, weshalb weder
  Nicht-Privatheit noch Datenschutz bewiesen sind. Die Einordnung ist keine
  Rechtsberatung,
  Gesamtklassifikation oder ein Compliance-Siegel; Phase 1 bis Phase 3 und die
  festgelegten Neubewertungstrigger bleiben offen.
- ✅ Direkte spätere lokale Abhängigkeiten aus ADR 0016, ADR 0018, ADR 0020 und
  ADR 0024, Node.js und der lockfilegebundenen Repository-Baseline vom
  Referenzcommit dokumentiert; ADR 0017 bleibt die noch nicht browserseitig
  komponierte Servicegrenze. Jan erteilt als Projektowner Implementierungs-
  sowie lokale Start-/Betriebsfreigaben ausdrücklich; ADR, Import oder
  Codex-Lauf starten nichts, und Nutzung durch andere, Hosting oder externer
  Betrieb bleiben unfreigegeben.
- ✅ Für den späteren Implementierungsslice mutationswirksame Regressionen zu
  post-import ersetztem `JSON.stringify`, beiden Prototype-`toJSON`-Hooks,
  Sentinelfreiheit und einem zwischen die erfassten Array-/Object-Prototypen
  eingeschobenen `toJSON`-Objekt mit privatem Test-Sentinel vorgesehen. Die
  bisherigen direkten Prototyp- und Own-`toJSON`-Prüfungen bestehen dabei; die
  neue Kettenprüfung ergibt statisch `500` vor Erfolgsserialisierung und
  Responsebesitz sowie null Aufrufe der erfassten Erfolgsserialisierung. Eine
  saubere Kontrollprobe
  bestätigt `Response-Array → capturedArrayPrototype`,
  `capturedArrayPrototype → capturedObjectPrototype`,
  `capturedObjectPrototype → null` und genau einen erfassten
  Erfolgsserialisierungsaufruf. `concurrency: false` und vollständiger Restore
  der ursprünglichen Prototypkette, globalen Funktionen und Descriptoren im
  `finally` sind verbindlich. In diesem Korrekturslice werden weder Code noch
  Tests implementiert.
- ✅ Keinen Kompositionscode, keine Factory-, `503`-, Contract-, Schema-,
  Paket- oder Evidence-Änderung umgesetzt. Ein lokaler HTTP-Erfolgspfad
  existiert noch nicht; akzeptierte Requests enden weiterhin mit `503`.
- ✅ ADR 0021, ADR 0022 und Evidence-Schema 1 bleiben unkomponiert und inaktiv:
  `stableOssCompatibility: FAIL`, Tenant-, Provider-/Execution- und Production-Evidenz
  `UNPROVEN`, `activationDecision: FAIL` und kein `overallGate`.

### Abgeschlossener Implementierungsslice: Local SyncGateway–SyncAgent Composition

- ✅ `server/startLocalSyncGateway.js` erzeugt nach gültiger
  Runtime-Konfiguration genau eine lokale SyncAgent-Instanz pro HTTP-Server-
  Factory und injiziert sie als erforderliche Dependency. Ungültige
  Konfiguration erzeugt weder Agent noch Server; Import bleibt inaktiv.
- ✅ Die HTTP-Factory besitzt keinen Agentendefault, löst
  `syncAgent.processSyncRequest` vor dem Listener genau einmal sicher auf und
  verwendet danach die erfasste Methode mit demselben Receiver. Ihre
  eingefrorene öffentliche API bleibt exakt `{ start, stop }`.
- ✅ Ausschließlich die exakte defensive Boundary-Requestidentität erreicht den
  Agenten synchron, mit genau einem Argument und pro akzeptiertem Pfad höchstens
  einmal. Es gibt kein `await`, `Promise.resolve`, Retry oder Thenable-
  Assimilation.
- ✅ Nur der exakte tief eingefrorene ADR-0024-Erfolg wird unverändert gegen
  denselben Request validiert. Danach entsteht ein frischer disjunkter exakter
  Zehn-Felder-Responsegraph, der erneut validiert, tief eingefroren, final
  revalidiert, terminal gegen erfasste Primordials geprüft und exakt einmal
  vorab serialisiert wird. Nur dieser Pfad ergibt HTTP `200`.
- ✅ Agenten-Throws, Fehlerresults, echte Promises, zusätzliche eigene
  `then`-Properties, malformed oder ungeeignete Responses sowie Projektions-,
  Freeze-, Revalidierungs-, terminale Shape-/Prototype-/Prototypketten-/
  `toJSON`- und Vorabserialisierungsfehler ergeben ausschließlich das statische
  `500 gatewayFailed`. Sie lösen weder `onFatal` noch einen Serverstop, fremde
  Details oder eine zweite Response aus. Das frühere
  `503 upstreamUnavailable`-Serverprofil ist entfernt.
- ✅ Der Umfang bleibt ausschließlich der leere synthetische `syncTest` im
  lokalen Prozess. Browser-SyncTransport, Browser-End-to-End-Fluss, Provider,
  Modelle, n8n-Aktivierung, private Inhalte, externe Kommunikation,
  Persistenz, Logging und Telemetrie bleiben außerhalb.
- ✅ Die enge vorläufige Phase-0-/Nicht-KI-Arbeitshypothese bleibt ausschließlich
  auf diesen deterministischen modellfreien lokalen Slice begrenzt und ist kein
  Compliance-Siegel. Die fokussierte Local-SyncGateway-Suite besteht mit 67/67
  Tests, die kombinierte serielle Sync-Suite mit 312/312 und die vollständige
  serielle Gesamtsuite mit 1332/1332 Tests; alle drei Läufe haben 0
  Fehlschläge, 0 Skips und 0 Todos. Der Produktions-Build transformiert exakt
  46 Browsermodule; der schreibfreie Bundle-Check meldet keinen Drift.

### Abgeschlossener Implementierungsslice: Isolierter BrowserSyncTransport gemäß ADR 0027

- ✅ Ausschließlich `src/transports/browserSyncTransport.js` und
  `tests/browserSyncTransport.test.js` neu angelegt. Der Transport exportiert
  nur `createBrowserSyncTransport`; seine frische eingefrorene API enthält
  exakt `sendSyncRequest`. Es entstand keine neue Dependency, API oder
  Produktionsseam.
- ✅ Den fortgeltenden ADR-0026-Vertrag mit den Korrekturen aus ADR 0027
  umgesetzt: geschlossene Factory-/Arity-/Compositiongrenzen,
  descriptorbasierter Requestsnapshot, frischer disjunkter und zweimal
  validierter Frozen-Requestgraph, einmalige JSON-/UTF-8-Serialisierung, fester
  Loopbackendpoint, eingefrorene Header-/RequestInit-Records, höchstens ein
  Fetch, 5.000-ms-First-Terminal-Owner-Deadline, best-effort Cleanup,
  beobachtbare Promise-/TypedArray-/Bufferprofile, unmittelbare lokale Kopie,
  striktes UTF-8-/JSON-Handoff und statische Redaction.
- ✅ Den größten öffentlich gültigen v1-Request mit exakt 193 UTF-8-Bytes bis
  zu genau einem Fetch-Seam geführt; eine 65 Zeichen lange `requestId` scheitert
  vor Serialisierung und Nebenwirkungen. Die private Requestcap-Verdrahtung mit
  vollständig bereinigten temporären Quellkopien für Cap 193 und 192
  mutationswirksam belegt. Die getrennte Responsegrenze 16.384/16.385 bleibt
  öffentlich erreichbar geprüft.
- ✅ Cross-Realm-, Hostile-Hook-, Promise-, Reader-, Cleanup-, Header-, Stream-,
  Buffer-, Deadline-, Race-, Freeze-, Descriptor-, Cap- und Source-Mutationen
  ausschließlich mit `node:vm`, kontrollierten Doubles und temporären
  Quellkopien geprüft. Es gab keinen echten Browser-, Netzwerk-, Gateway-,
  Cloud-, n8n-, Provider-, Credential- oder Vaultzugriff.
- ✅ Verifikation: 272/272 fokussierte BrowserSyncTransport-Tests, 315/315
  SyncService-/BrowserSyncTransport-Tests, 584/584 Tests der sechs seriellen
  Sync-Suites und 1604/1604 Tests der vollständigen seriellen Gesamtsuite;
  jeweils 0 Fehlschläge, Abbrüche, Skips und Todos. Der Produktions-Build
  transformiert exakt 46 Browsermodule; der schreibfreie n8n-Bundle-Check ist
  driftfrei.
- ✅ Phase 0/Tor A anhand des tatsächlichen Codes erneut eng bestätigt: kein
  Modell, keine statistische Inferenz, kein Provider oder Workflow, keine
  Credentials, keine privaten Inhalts-Payloads, kein Logging, Storage oder
  Telemetrie und keine Rechts- oder Complianceklassifikation. Das ist ein
  enger technischer Arbeitsbefund, kein Runtime-, Datenschutz- oder
  Compliancebeweis.
- ✅ Slice-Grenze eingehalten: Der BrowserSyncTransport ist weder mit dem
  SyncService noch in `src/main.js` komponiert; Browser-End-to-End-Fluss,
  Runtimefreigabe, Provider und globale Betriebsgrenzen bleiben geschlossen.
  Als nächster Slice folgt ausschließlich das getrennte reale, kontext- und
  versionsgebundene PNA-/LNA-/Mixed-Content-Runtimegate einschließlich der
  übrigen CORS-, Berechtigungs-, Loopback-, Redirect-, Header- und
  Responsebeobachtungen. Erst dessen gebundenes `PASS` kann die getrennte
  Browserkomposition öffnen.

### Abgeschlossener Entscheidungsslice: Browser SyncTransport Validator Integrity Boundary / ADR 0028

- ✅ ADR 0028 am `2026-08-29` angenommen und ADR 0027 formal ersetzt. Beide
  ADR-0027-Korrekturen sowie alle nicht ausdrücklich geänderten ADR-0026-/
  ADR-0027-Regeln bleiben verbindlich. ADR 0026 bleibt unverändert durch ADR
  0027 ersetzt; nur die ADR-0027-Statuszeile verweist nun auf ADR 0028, während
  ihr Body ab `## Kontext` bytegleich bleibt.
- ✅ Den zum Entscheidungszeitpunkt noch nicht behobenen Produktfehler dokumentiert: Zwei
  erforderliche Contractvalidatorausführungen verwenden live manipulierbare
  Runtimeoberflächen; die terminale Prüfung bestätigt Shape, Freeze und
  Snapshotidentität, aber keine unabhängigen festen v1-Werte. Kontrollierte
  netzwerkfreie Proben ließen vertragswidrige Versionen, Aktionen, Quellen und
  Request-IDs bis zu Serialisierung, Controller, Timer und Fetch-Seam gelangen.
  Die bestehende grüne Suite beweist die Lückenschließung nicht.
- ✅ Die spätere Reihenfolge festgelegt: descriptorbasierter Snapshot,
  frischer interner Graph, `validateSyncRequest` #1, Deep Freeze,
  `validateSyncRequest` #2, bestehende terminale Shape-/Freeze-Prüfung, genau
  eine feste v1-Wire-Policy, Stringify, UTF-8-Encoding, Controller, Timer und
  Fetch. Derselbe Graph bleibt exakt zweimal Validatorinput; ein dritter
  Aufruf sowie jeder weitere generische oder alternative Validatorpfad bleiben
  verboten.
- ✅ Die private nicht exportierte Policy fest auf Version `1.0`, Aktion
  `syncTest`, Quelle `goldendawn-os`, das geschlossene ASCII-Request-ID-Profil,
  den exakt 24 Zeichen langen kanonischen und tatsächlich gültigen UTC-
  Timestamp, dessen identische Rückprojektion und höchstens 300.000 ms interne
  Referenzdifferenz sowie den normalen eingefrorenen Sechs-Felder-Graphen ohne
  `toJSON` und mit leerem eingefrorenem Payload begrenzt. Sie liest nur den
  internen Graphen über erfasste Intrinsics und daneben die bereits erfasste
  primitive Referenzzeit; Callerroot und Callerpayload werden nicht erneut
  gelesen.
- ✅ Jede Policyabweichung vor transportgesteuertem Stringify, Encoding,
  Controller, Timer und Fetch an den bestehenden statischen Transportfehler
  gebunden. Die Policy verhindert keine bereits ausgelösten Same-Realm-
  Nebenwirkungen; Same-Realm bleibt keine Sandbox. Neue Versionen, Aktionen
  oder Quellen benötigen eine eigene Entscheidung und einen eigenen
  Implementierungsnachweis.
- ✅ Die unveränderten Grenzen bestätigt: geschlossene API, Arity und vier
  Seams, fester Endpoint, Snapshot und frischer Graph, zwei
  Contractvalidierungen, einmalige Serialisierung, private 65.536-Byte-
  Requestgrenze, ADR-0027-Nachweis 193/192, höchstens ein Fetch, Promise-/
  Bufferprofile, Deadline, Abort, Cleanup, Responseheader, Content-Length,
  16.384/16.385-Responsekante, Streamcopy, UTF-8, JSON, Redaction,
  SyncService-Korrelation und fehlende Browserkomposition.
- ✅ Die Promise-/Host-Restgrenze dokumentiert: keine freie `.then`-Auflösung,
  kein `Promise.resolve`, kein erfasstes natives `then` vor bestandenem Profil
  und kein fremder Rejectiongrund im Transportfehler. Ein bereits abgelehntes
  ungültig profiliertes Promise kann dennoch später einen hostabhängigen
  `unhandled*`-Kanal auslösen; weder Eintritt noch Zeitpunkt oder
  Prozessfortsetzung werden allgemein behauptet.
- ✅ Content-Length unverändert belassen: fehlend oder `null` scheitert vor
  `content-encoding`, Body und Reader; `16.384` bleibt inklusive, deklarierte
  `16.385` scheitert während der Headerprüfung. Ein 16.385-Byte-Chunk bei
  deklarierter Länge 16.384 verletzt Restlänge und absoluten Cap zugleich und
  ist kein isolierter Nachweis nur der Capkante.
- ✅ Die spätere netzwerkfreie Matrix um kausale Validator-, Allowlist-,
  Reflection-, Collection-, Regex-, Iterator-, Date-/UTC-, Request-ID-,
  Prototype-, Constructor-/Species-, Deadline-, UTF-8-, Coercion-, Header-,
  Stream- und Promise-/Host-Mutationen erweitert. Die gültige Kontrolle muss
  zwei Validatoraufrufe, eine Policyprüfung und einen Fetch zeigen; die
  Neutralisierung oder Umgehung der Policy in einer temporären Quellkopie muss
  mindestens einen Bypass wieder bis Fetch öffnen.
- ✅ Dieser damalige Slice dokumentierte ausschließlich die Entscheidung.
  Produkt- und Testcode, SyncContract, Exports, Bundle, Manifest, Generator,
  Browser, Netzwerk, Gateway, Provider, Credentials und private Daten blieben
  außerhalb. Der anschließend getrennt ausgeführte Implementierungsslice ist
  nachfolgend dokumentiert.

### Abgeschlossener Implementierungsslice: feste v1-Wire-Policy / ADR 0028

- ✅ Die private feste v1-Wire-Policy transportlokal implementiert. Derselbe
  frische interne Graph erreicht `validateSyncRequest` weiterhin exakt zweimal
  vor und nach Deep Freeze; die Policy läuft danach nach dem bestehenden
  terminalen Profilguard und vor `JSON.stringify` exakt einmal. Der
  Contractvalidator selbst wurde nicht gehärtet.
- ✅ Feste v1-Werte, Request-ID, kanonischen gültigen UTC-Timestamp,
  300.000-ms-Konsistenz sowie die normalen eingefrorenen Root-/Payloadprofile
  unabhängig gebunden und damit die bestätigte Transportlücke geschlossen.
- ✅ Die vollständige netzwerkfreie mutationswirksame Matrix umgesetzt. Der
  kausale Haupttest stoppt denselben Validatorbypass mit aktiver Policy vor
  Stringify und Fetch und lässt ihn bei gezielt neutralisiertem
  Policy-Callsite exakt einen Fetch erreichen.
- ✅ Verifikation: 423/423 fokussierte BrowserSyncTransport-Tests, 466/466
  SyncService-/BrowserSyncTransport-Tests, 735/735 Tests der sechs seriellen
  Sync-Suites und 1755/1755 Tests der vollständigen seriellen Gesamtsuite;
  `Δ = 151`, jeweils 0 Fehlschläge, Abbrüche, Skips und Todos. Der
  Produktions-Build transformiert weiterhin exakt 46 Browsermodule;
  `bundle:n8n:check` ist driftfrei.
- ✅ API, Seams, Dependencies, Endpoint, Caps, Contract, Bundle, Manifest und
  Generator unverändert belassen. Der Browsertransport bleibt unkomponiert;
  ein Browser-End-to-End-Fluss wurde nicht geschaffen.
- ✅ Phase 0/Tor A anhand der tatsächlichen Implementierung erneut bestätigt:
  keine Modelle, Inferenz, Provider, Credentials, privaten Inhalts-Payloads,
  Logs, Storage oder Telemetrie; kein realer Browser-, externer Netzwerk-,
  Gateway-, Cloud-, n8n-, Provider-, Credential- oder Vaultzugriff.
- ✅ Die Promise-/Host-Restgrenze unverändert bewahrt: Keine Assimilation oder
  öffentliche Grundausgabe eines ungültig profilierten bereits abgelehnten
  Promise; ein späterer getrennter Hostkanal bleibt möglich, ohne
  hostübergreifende Garantie für Eintritt, Zeitpunkt, Häufigkeit oder
  Prozessfortsetzung.

### Abgeschlossener Entscheidungsslice: Local Browser Runtime Evidence Gate / ADR 0029

- ✅ ADR 0029 am `2026-08-30` als reinen Dokumentations- und
  Entscheidungsslice angenommen. Er ergänzt ADR 0020 und ADR 0028,
  operationalisiert die fortgeltenden ADR-0026-/ADR-0027-
  Runtimeanforderungen und ersetzt keinen ADR.
- ✅ Das vollständige unveränderliche Basistupel `T₀` für alle positiven
  Pflichtbeobachtungen und die exakt zwei geschlossen allowlisteten
  Negativtupel `T_origin = T₀ + Δ_origin` sowie
  `T_redirect = T₀ + Δ_redirect` festgelegt. Jede andere Abweichung bleibt
  `UNPROVEN` oder ergibt bei beobachteter Grenzverletzung `FAIL`.
- ✅ Zehn Pflichtgates, getrennte Beobachtungsebenen, browser- und
  versionsgebundene Statusaggregation, vollständigen Restore nach jedem
  Negativvektor, vektorlokalen Cleanup und abschließenden Cleanup entschieden.
- ✅ Den sanitisierten, allowlist-basierten Evidence-Record geschlossen in
  `docs/data-contracts.md` definiert; kein Template oder ausgefülltes
  Evidenzartefakt angelegt.
- ✅ Keinen Browser, Gateway, Devserver, Port, realen Request,
  Permissionzustand, Harness oder Fixture verwendet oder verändert. Produkt-
  und Testcode, Endpoint, Header, Konfiguration, Komposition, Browser-E2E,
  private Daten, Cloud, Provider, n8n und Vault blieben außerhalb. Der
  tatsächliche Runtimegate-Status war am Ende dieses Entscheidungsslices
  `UNPROVEN`.
- ✅ Der anschließend gesondert autorisierte reale Lauf ist als eigener Slice
  nachfolgend dokumentiert; er verändert ADR 0029 nicht.

### Durchgeführter Runtime-Evidence-Slice: Chrome Stable unter Windows

- ✅ Den einmaligen sichtbaren Chrome-Stable-Lauf unter
  `chrome-stable-win-t0-01` mit Chrome `151.0.7922.174`, Windows 11 Home 25H2
  Build `26200.9168`, Node `24.19.0`, Frontend-Origin
  `http://127.0.0.1:5173` und dem festen Gatewayendpoint ausgeführt.
- ❌ `normalSyntheticTransport` und `overallGate` sind `FAIL`: Der einzige
  gestartete Vektor `positive-default` erreichte einen gewöhnlichen
  `OPTIONS 204`, danach einen vollständig beantworteten `POST 200` und die
  erwarteten JavaScript-sichtbaren Responsewerte; das öffentliche
  BrowserSyncTransport-Promise wies dennoch statisch redigiert zurück. Der
  Record erfindet weder eine Korrelationsabweichung noch eine Fehlerursache.
- ⬜ `pnaLnaPermission` bleibt wegen unbekanntem Zieladressraum `UNPROVEN`.
  `negative-origin` und `redirect-error` wurden nach der Stopregel ohne Retry
  nicht ausgeführt und bleiben einschließlich ihrer Restores `UNPROVEN`; der
  positive Vektor bleibt nach der geschlossenen Vektorgrammatik ebenfalls
  `UNPROVEN`.
- ✅ Jan beobachtete keinen Local-Network-/Loopback-Dialog und führte keine
  Browserinteraktion aus. Alle selbst gestarteten Prozesse wurden
  kontrolliert beendet, Ports freigegeben sowie Profil, Harness und Fragmente
  entfernt; `cleanupRedaction` ist `PASS` und Top-Level-`cleanupConfirmed`
  `true`.
- ✅ Den geschlossenen Record unter
  `docs/evidence/browser-runtime-evidence.chrome-stable-windows-01.json`
  angelegt. Er gilt ausschließlich für sein exaktes `T₀` und ist weder
  Browserkomposition noch Browser-E2E oder allgemeiner Kompatibilitätsnachweis.
- ✅ Der danach geforderte Architekturentscheidungsslice wurde mit ADR 0030
  abgeschlossen und anschließend durch ADR 0031 formal korrigiert. ADR 0020,
  die Produktions-Gateway-Baseline, der historische Befund, das Gesamt-`FAIL`
  und `CAUSE_NOT_PROVEN` bleiben unverändert. Ein neuer Runtime-Evidence-Lauf
  bleibt ohne neue ausdrückliche Autorisierung gesperrt.

### Abgeschlossener Entscheidungsslice: BrowserSyncTransport Runtime Diagnostic Observer Boundary / ADR 0030

- ✅ ADR 0030 am `2026-08-30` als reinen Dokumentationsslice angenommen. Er
  ergänzt ADR 0028 und ADR 0029, ersetzt keinen ADR und lässt ADR 0020 als
  erneut bewertete Produktions-Gateway-Baseline unverändert. Die Diagnose ist
  weder vierter ADR-0029-Vektor noch zusätzliches Gate oder Erweiterung des
  `BrowserRuntimeEvidenceRecord`.
- ✅ Ausschließlich `T_replay ≡R T₀` und
  `T_diag = T_replay + Δ_observer` zugelassen. `T_replay` ist eine vollständig
  neue Bindung und kein observerfreier Kontrolllauf. Neue Run-ID, Messzeit,
  Repositorycommit und Wegwerfprofilinstanz werden getrennt gebunden. Die
  geschlossene Relation vergleicht nur historisch persistierte
  Klassifikationen und aus dem historischen Git-Tree ableitbare
  Einzelartefakthashes.
- ✅ `Δ_observer` auf einen exklusiven lokalen Pipe-Controller, genau ein
  Top-Level-Target, eine Session, eine minimale Target-/Runtime-/Network-
  Allowlist, eine Main-World-Auswertung, eine argumentlose Factoryerzeugung und
  genau einen gültigen synthetischen v1-`syncTest` begrenzt. Passiv ist nur die
  anschließende externe Beobachtung ohne Produktmutation oder Zusatzrequest;
  absolute Nichtbeeinflussung wird nicht behauptet.
- ✅ Genau zehn externe Stages, getrennte Clock-Domänen und ein geschlossenes
  Requestbudget entschieden. `internalStage` und `internalOwner` bleiben
  `unknown`; `Network.loadingFinished` beweist keinen JavaScript-
  Streamabschluss und Timing höchstens `deadline-compatible`.
- ✅ Den unabhängigen `BrowserTransportDiagnosticRecord` mit historischem
  Evidence-Hash, `T_replay`, `≡R`, Observerintegrität, targetgebundenen
  Requestcounts, öffentlichem Settlement, externen Stages, begrenzten Zeiten
  und vollständigem Cleanup festgelegt. `observerGate` ist kein Runtimegate;
  jedes Finding behält `causeStatus: CAUSE_NOT_PROVEN`, und das ADR-0029-
  `overallGate` bleibt davor und danach `FAIL`.
- ✅ Sourceinstrumentierung, Composition-Seams, Runtimeoberflächenmutation,
  Fetch-Interception, Debugger/Profiler/Tracing, Responsebody-Lesen, freie
  Rohinspektion, Zusatzrequests, Rohpersistenz und Observerausgabe während des
  Laufs verboten. Der persistierbare Record entsteht erst nach vollständigem
  Cleanup und enthält keine persönlichen, Request-, Rohnetzwerk-, Fehler-,
  privaten oder Credentialdaten.
- ✅ In diesem Slice weder Recordvorlage noch Record, Controller, Harness,
  Fixture, Observer oder Diagnosefoundation erstellt und keinen Browser-,
  Vite-, Gateway-, Listener-, Port-, Request-, Permission- oder Diagnoselauf
  ausgeführt.
- ⬜ Nächster Slice: ausschließlich die passive Diagnosefoundation in einem
  vollständig netzwerkfreien Implementierungsslice erstellen und testen. Erst
  danach können Zielbrowser, `T_replay`, Observer, der einzelne Request,
  Benutzerinteraktion und Cleanup gesondert autorisiert werden.

### Abgeschlossener Korrekturentscheidungsslice: Diagnostic Envelope and Observation Completion Boundary / ADR 0031

- ✅ ADR 0031 am `2026-08-30` als reinen Dokumentationsslice angenommen. Er
  ersetzt ADR 0030 formal und übernimmt alle nicht ausdrücklich korrigierten
  Regeln; Foundation und Lauf bleiben nicht implementiert und nicht
  autorisiert.
- ✅ Exakt die bestehenden 20 Cleanup-Check-IDs bestätigt. Eine 21. ID wird
  nicht ergänzt; Schema 1 und Recordtyp bleiben unverändert.
- ✅ Die technisch unvermeidbare flüchtige `Runtime.RemoteObject`-By-Value-
  Hülle ohne Handle, Preview, Exceptiondetails, alternative Serialisierung,
  Folgeinspektion oder Rohpersistenz zugelassen. Nur die exakt geschlossene
  Vier-Felder-Projektion und drei outcome/profile-Paare dürfen übernommen
  werden; verbotene Felder werden nur auf Own-Presence geprüft.
- ✅ Die gemeinsame controllerlokale Abschlussbarriere exakt als
  `observationClosed := (S && N) || C` festgelegt. Erst nach atomarem Freeze
  beginnt Cleanup; sein endgültiger Status folgt getrennt aus den 20 Checks.
  Späte Ereignisse bleiben verworfen und bestätigte Verletzungen besitzen
  `FAIL`-Präzedenz.
- ✅ ADR-0029-`overallGate: FAIL`, `CAUSE_NOT_PROVEN`, Replayrelation,
  Observerdelta, Requestbudget, sechs CDP-Kommandos, vier Networkeventklassen,
  zehn externe Stages, Clock-Domänen und Redaction unverändert gelassen.
- ⬜ Nächster Slice bleibt ausschließlich die vollständig netzwerkfreie
  Implementierung und Prüfung der passiven Diagnosefoundation. Ein sichtbarer
  Lauf benötigt danach eine eigene ausdrückliche Autorisierung.

Der folgende ADR-0027-Entscheidungsslice und der anschließende ADR-0026-Block
bleiben als damalige Entscheidungs- und Vorimplementierungshistorie
unverändert.

### Abgeschlossener Entscheidungsslice: Beobachtbare Browser-SyncTransport-Nachweisgrenzen / ADR 0027

- ✅ ADR 0027 am `2026-08-27` angenommen. **ADR 0027 ersetzt ADR 0026.** Die
  formale Supersession ist erforderlich, weil zwei zuvor bindende
  Nachweisanforderungen geändert werden; angenommene ADRs werden nicht
  nachträglich inhaltlich umgeschrieben.
- ✅ Den ersten Implementierungsversuch als harten, dateilosen Stop vor jeder
  Dateiänderung dokumentiert. Working Tree, Index sowie
  `src/transports/browserSyncTransport.js` und
  `tests/browserSyncTransport.test.js` blieben unverändert beziehungsweise
  nicht vorhanden. Es gab keinen Browser-, Netzwerk- oder Gatewayzugriff. Die
  Pause folgt aus zwei widersprüchlichen beziehungsweise öffentlich nicht
  erfüllbaren Nachweisforderungen, nicht aus einer Produktlücke, und benötigt
  keine neue API, Dependency oder Produktionsseam.
- ✅ Sämtliche nicht ausdrücklich ersetzten Entscheidungen aus ADR 0026
  unverändert übernommen: Modulort und Export, Factory-/API-/Arityvertrag,
  exakt vier Composition-Seams, feste Loopback-URL, descriptor-basierter
  Snapshot, frischer disjunkter und zweimal validierter Requestgraph,
  einmalige Serialisierung und UTF-8-Messung, privater Requestcap, exakte
  RequestInit-/Headerpolicy, höchstens ein Fetch ohne Retry oder Fallback,
  Constructor-/Species-Prüfungen, 5.000-ms-Deadline, First-Terminal-Owner,
  Abort-/Cleanupgrenzen, fail-fast Response-/Headerreihenfolge,
  16.384/16.385-Responsegrenze, Nullchunk-/EOF-/Kopierregeln, strikte
  UTF-8-/BOM-/JSON-Semantik, statische Redaction, unveränderte
  SyncService-Verantwortung sowie geschlossene Browserkomposition, Runtimegates
  und Providerpfade.
- ✅ Für fremde Fetch-, Read- und Cleanup-Promise-Kandidaten ausschließlich das
  zum Prüfzeitpunkt beobachtbare geschlossene Profil als beweisbar festgelegt:
  echtes natives Promise-Brandprofil, exakt erfasster lokaler
  `Promise.prototype`, vollständige lokale Prototypkette, leere Own-Keys ohne
  eigene `constructor`-Property sowie unveränderte Constructor-/Species-
  Descriptoren und Verarbeitung nur über die erfasste native `then`-Referenz.
  Eine Erzeugungsrealm oder historische Constructor-/Subclass-Provenienz wird
  nicht behauptet. Unveränderte Cross-Realm-Promises bleiben negativ; bereits
  vollständig passend umprototypisierte echte Cross-Realm-Promises und native
  Subclass-Promises ohne verbleibendes Merkmal sind öffentlich nicht mehr nach
  Herkunft unterscheidbar. Der Transport selbst verändert keinen fremden
  Prototyp; sein äußeres Promise bleibt transport-eigen und lokal erzeugt.
- ✅ Für fremde Readerchunks dieselbe beobachtbare Grenze festgelegt: echte
  native `Uint8Array`- und `ArrayBuffer`-Brands, exakt lokale
  Prototypidentitäten und -ketten, fester nicht geteilter, nicht resizable und
  nicht detached Buffer, positive sichere ByteLength sowie sämtliche Cap- und
  Restlängenprüfungen. Unveränderte oder nur teilweise umprototypisierte
  Cross-Realm-Werte bleiben negativ. Eine bereits vollständig passend
  umprototypisierte echte View samt echtem festem Backing-Buffer ist nach
  historischer Realm nicht unterscheidbar. Akzeptierte Bytes werden weiterhin
  ohne verbleibende Fremdidentität sofort in den transport-eigenen lokalen
  Zielbuffer kopiert; spätere Quellmutation wirkt nicht auf die Kopie.
- ✅ Realm ausdrücklich nicht als Sicherheits-, Identitäts-, Berechtigungs-,
  Authentisierungs-, Datenschutz- oder Vertrauenssignal eingeordnet. Fremde
  Thenables, Proxy/Fake, Zusatzkeys oder Symbole, Constructor-Accessors,
  sichtbar unveränderte Subclassprototypen, mutierte Constructor-/Species-
  Descriptoren, Shared/Growable Shared/Resizable/Detached Memory, Nullchunks,
  falsche Längen und Capüberschreitungen bleiben fail-closed.
- ✅ Den produktiven privaten Requestcap unverändert auf einschließlich
  `65.536` UTF-8-Bytes belassen; Byte 65.537 scheitert weiter vor Controller,
  Timer und Fetch. Unter dem geschlossenen SyncContract v1 ist diese reale
  Grenze über die öffentliche Transport-API nicht erreichbar. Der maximal
  gültige 64-ASCII-Zeichen-`requestId` ergibt mit den festen übrigen Werten,
  kanonischem Timestamp und leerem Payload einen exakt 193 Byte großen
  JSON-Body. Eine insgesamt 65 Zeichen lange ID scheitert vor Stringify,
  Encoding, Controller, Timer und Fetch. Die 193 Bytes ersetzen den privaten
  Cap nicht; sie bestimmen nur die aktuelle öffentliche Erreichbarkeit.
- ✅ Für den späteren netzwerkfreien Implementierungstest den maximal gültigen
  193-Byte-v1-Request bis zu genau einem Fetch und die 65-Zeichen-ID bis zur
  frühen Contractablehnung festgelegt. Die private Capverdrahtung wird kausal
  ausschließlich an vollständig bereinigten temporären Modulkopien geprüft:
  Cap `193` lässt denselben Request passieren, Cap `192` lehnt ihn vor
  Controller, Timer und Fetch ab; Entfernen, Umgehen oder ein falscher Vergleich
  muss eine Gegenprobe rot machen. Der Nachweis gilt nur Verdrahtung,
  inklusive/überschreitende Semantik und Position, nicht einer öffentlich
  erreichbaren 65.536/65.537-Grenze. Contractmutation, Testexport,
  injizierbarer Encoder, Capparameter, fünfter Seam oder Produktionsänderung
  zugunsten des Tests bleiben verboten.
- ✅ Die spätere Cross-Realm-Matrix auf `node:vm`, lokale native Intrinsics und
  Doubles begrenzt. Positive Promiseproben umfassen lokal native und
  fixtureseitig vollständig passend umprototypisierte echte Cross-Realm-
  Promises einschließlich einer nativen Subclass ohne Restmerkmal. Positive
  Byteproben umfassen eine lokale feste View und eine vollständig passend
  umprototypisierte echte fremde View samt echtem festem Buffer sowie die
  mutationsisolierte Sofortkopie. Unveränderte, nur teilweise angeglichene,
  Proxy-/Fake-, Shared-, Growable-, Resizable-, Detached-, Nullchunk-, Längen-
  und Capfälle bleiben negativ. Der Transport ruft in keiner Probe
  `Object.setPrototypeOf` auf Eingabewerten auf; globale Testmutationen müssen
  seriell und mit vollständigem `finally`-Restore laufen.
- ✅ Die bestehende enge Phase-0-/Tor-A-Arbeitshypothese nicht zu einer Rechts-
  oder Complianceklassifikation erweitert. Vor Modulevaluation kompromittierte
  Intrinsics, Enginekompromittierung, OOM und Prozessabbruch bleiben außerhalb
  der Garantie; Same-Realm und Deep Freeze bleiben keine Sandbox. Dieser
  Entscheidungsslice erzeugt keinen Browser-, Gateway-, Provider- oder privaten
  Datenfluss und besitzt keine KI-, Modell-, Workflow-, Credential-, Storage-,
  Logging- oder Telemetriewirkung.
- ✅ Nach ADR 0027 als nächsten Slice ausschließlich die isolierte und
  netzwerkfreie BrowserSyncTransport-Implementierung gemäß dem korrigierten
  Vertrag freigegeben. Realer Fetch, Browser- oder Gatewaystart, PNA-/LNA-/
  Mixed-Content-Evidenz, Browserkomposition, End-to-End-`syncTest`, globale
  Betriebsgrenzen, Provider, Credentials, private Payloads und weitere Aktionen
  bleiben getrennt und geschlossen. Nur ein späterer kontext- und
  versionsgebundener Runtime-`PASS` darf die Browserkomposition öffnen.

Der nachfolgende ADR-0026-Abschnitt bleibt als historischer Stand des
ersetzten Entscheidungsslices unverändert erhalten. Seine stärkeren
Same-Realm- und öffentlichen Requestcap-Nachweisbehauptungen sind keine
aktuellen Anforderungen mehr.

### Abgeschlossener Entscheidungsslice: Browser SyncTransport Contract / ADR 0026

- ✅ ADR 0026 am `2026-08-24` angenommen und korrigiert. Er ergänzt ADR 0017,
  ADR 0020, ADR 0023 und ADR 0025, ersetzt keine Entscheidung und verändert
  weder SyncContract, SyncService-Port, Gateway noch SyncAgent.
- ✅ Für die spätere isolierte Implementierung ausschließlich
  `src/transports/browserSyncTransport.js`, den einzigen Export
  `createBrowserSyncTransport` und eine frische gewöhnliche eingefrorene API
  mit exakt `{ sendSyncRequest }` entschieden. Die Methode akzeptiert exakt ein
  Argument, liefert auf jedem Methodenpfad sofort ein echtes natives Promise
  und lehnt falsche Arity vor jeder weiteren Beobachtung redigiert ab.
- ✅ Die Factory- und Capturegrenze geschlossen: Bei Modulevaluation werden
  Reflection, Apply, Freeze/Frozen, JSON, Encoder-/Decoder-Prototypmethoden,
  Typed Arrays, ArrayBuffer-Intrinsics, relevante Prototypidentitäten und native
  Browserdefaults privat erfasst. Für Promise werden der native Same-Realm-
  Konstruktor, `Promise.prototype`, dessen natives `then`, die Identität von
  `Symbol.species`, die ursprünglichen Own-Deskriptoren von
  `Promise.prototype.constructor` und `Promise[Symbol.species]`, die
  ursprüngliche Species-Getteridentität sowie die erforderlichen Promise-/
  Object-Ketten bis `null` erfasst. Typed-Array-Buffer-/ByteLength-/Kopier- und
  ArrayBuffer-Brand-/ByteLength-/optionale Resizable-Intrinsics schließen die
  Buffergrenze. Nur null Factoryargumente wählen private
  Defaultwrapper; explizites `undefined`, Extras, ungeeignete Container oder
  fehlende Defaults ergeben synchron
  `TypeError("Ungültige BrowserSyncTransport-Komposition.")`. Der einzige
  explizite Compositionrecord enthält exakt vier Own-Data-Funktionen für Fetch,
  AbortController und Timer. Andere Seams sind ausgeschlossen.
- ✅ Den Endpoint fest auf
  `http://127.0.0.1:8787/api/sync-test` begrenzt. URL, Port `8787`, Deadline
  und Größenlimits sind private nicht injizierbare Modulwerte; `localhost`,
  IPv6, relative URLs, DNS, Discovery, Redirect, Fallback und Werte aus UI,
  Request, DOM, Storage oder Environment sind ausgeschlossen. Die spätere
  Gateway-Runtime muss Port `8787` explizit setzen; `allowedOrigin` bleibt die
  getrennte tatsächliche Browser-Origin.
- ✅ Einen autoritativen descriptor-basierten Request-Snapshot festgelegt:
  vollständige Root-Own-Key-Menge einmal, Rootprototyp einmal, anschließend die
  sechs Own-Deskriptoren `version`, `action`, `source`, `requestId`, `timestamp`,
  `payload` in genau dieser Reihenfolge je einmal, Payloadidentität ausschließlich
  aus dem erfassten Rootdescriptor, vollständige Payload-Own-Key-Menge einmal
  und Payloadprototyp einmal. Danach wird kein Caller- oder Payload-Key,
  -Prototyp, -Descriptor oder -Propertywert erneut gelesen. Der Snapshot ist nur
  die interne Evidenzmenge, kein zweites Requestobjekt.
- ✅ Aus dieser Evidenz genau einen frischen disjunkten gewöhnlichen Sechs-
  Felder-Requestgraphen mit neuer exakt leerer Payload erzeugen. Ausschließlich
  derselbe Graph ist Validatorinput und wird mit derselben Timestampreferenz
  exakt zweimal vollständig validiert: einmal vor und einmal nach seinem
  Freeze. Callerroot, Callerpayload und separates Snapshotobjekt erreichen den
  Validator nullmal; ein dritter oder alternativer Pfad fehlt. Danach wird der
  Graph terminal auf exakte Own-Data-Felder, Prototypketten bis
  `null`, tatsächlichen Frozen-Zustand, fehlendes eigenes `toJSON` an Root,
  Payload und Object-Prototyp sowie fehlende fremde verschachtelte Identitäten
  prüfen. Erfasstes natives `JSON.stringify` läuft exakt einmal ohne Replacer;
  die erfasste Encoder-Prototypmethode exakt einmal mit korrektem Receiver.
  Nur ein echter nicht abgeleiteter brand-geprüfter `Uint8Array` zählt;
  `65.536` Bytes bestehen, `65.537` scheitern vor Timer und Fetch.
  Die Timestamp-Differenz null belegt nur interne Snapshotkonsistenz, weder
  Frische, zuverlässige Browserzeit noch Replay-Schutz; die operative
  Frischeprüfung bleibt beim Gateway.
- ✅ Pro zulässigem Aufruf einen eingefrorenen Null-Prototyp-`RequestInit` mit
  exakt zehn Own-Data-Feldern und einen frischen eingefrorenen Null-Prototyp-
  Headerrecord mit exakt dem einen Content-Type-Feld festgelegt. Das interne
  Signal bleibt die einmal erfasste Controlleridentität; Eigentum oder Freeze
  des Signals werden nicht behauptet. Die Fetchpolicy bleibt exakt `POST`,
  `cors`, `credentials: "omit"`, `no-store`, `redirect: "error"`,
  `no-referrer`, `keepalive: false`, ohne Authorization, Cookie, Secret,
  Caller-Signal, Retry, Backoff oder Fallback.
- ✅ Einen First-Terminal-Owner `active → success | transportFailure |
  deadline` entschieden. Controller, Signal und Abort werden vor Timer und
  Fetch einmal aufgelöst. Die `5.000-ms`-Eventloopdeadline begrenzt nur
  asynchrones Fetch- und Streamwarten; sie wird vor synchroner Decodierung und
  Parsing disarmed und ist keine harte Echtzeit-/CPU-Grenze. Ein synchroner
  Deadlinecallback gewinnt vor Fetch, ein späterer Handle wird dennoch einmal
  bereinigt. Unmittelbar vor dem Seam-Aufruf wird `fetchStarted` gesetzt. Jeder
  danach gewinnende Transportfehler oder die Deadline abortiert den Controller
  höchstens einmal nicht blockierend mit richtigem Receiver: einschließlich
  synchronem Fetch-Throw, ungültigem Promiseprofil, Rejection, Non-200,
  Redirect, falscher finaler URL, falschem Response-Typ, Responsegetter-/
  Snapshot-, Header-, Body-, `getReader`-/Methodenauflösungs-,
  Reader-, Chunk-, Cap-, EOF-, Release-, UTF-8-, JSON- oder Handoff-Fehler. Vor
  Fetch und bei Erfolg bleibt Abort nullmal; nach Readerübernahme kommen Cancel
  und Release je höchstens einmal hinzu. Vor Readerübernahme wird keine
  zusätzliche Bodymethode aufgelöst; der gespeicherte Controllerabort ist dort
  der einzige Netzwerkcleanup. Cleanup wartet nicht auf fremde Abschlüsse,
  konsumiert beherrschte Throws und Rejections, ändert den Owner nicht und kann
  weder zweiten Abschluss noch Fetch auslösen. Jeder tatsächlich erhaltene
  Timerhandle wird auf jedem terminalen Pfad genau einmal nicht blockierend best
  effort gelöscht; Pfade ohne Handle greifen nullmal auf die Clear-Seam zu.
- ✅ Vor jedem erfassten `Promise.prototype.then` auf Fetch-, Read- oder
  zulässigem Cleanup-Promise unmittelbar und ohne fremden Zwischenhook exakten
  Same-Realm-Prototyp, leere Own-Keys ohne eigene `constructor`, unveränderte
  Kette, ursprünglichen Constructor-Datendescriptor mit nativer
  Konstruktoridentität und ursprünglichen Species-Accessordescriptor mit
  Getteridentität prüfen. Erst danach wird `then` mit richtigem Receiver
  angewendet; Brand-, Descriptor-, Species- und Applyfehler scheitern. Es gibt
  weder `Promise.resolve` noch freien `.then`-Zugriff. Sämtliche kontrollierten
  Fulfillment-/Rejectionhandler fangen beherrschte Throws, prüfen bei spätem
  Settlement zuerst den Owner und geben auf jedem Pfad nur primitives
  `undefined` zurück.
- ✅ Response und Header fail-fast beobachten: `status`, `redirected`, `url`,
  `type`, `headers`, `body` werden in dieser Reihenfolge je genau einmal gelesen
  und sofort geprüft; nach einer Ablehnung folgen null spätere Reads. Non-200
  stoppt direkt nach `status`, abortiert höchstens einmal und liest oder parst
  keinen Body. `headers.get` wird einmal aufgelöst und mit richtigem Receiver
  verwendet; `content-type`, `content-length`, `content-encoding` werden in
  dieser Reihenfolge je nur nach bestandener Vorprüfung gelesen und sofort
  geprüft. Erst danach wird `body` gelesen. Nur HTTP `200`, keine Umleitung,
  exakte URL, Typ `cors`, exakter Content-Type, browserexponierte kanonische
  Länge bis `16.384` und browserexponiertes Content-Encoding exakt `null`
  öffnen den Reader.
- ✅ `Content-Encoding` korrekt als nicht automatisch CORS-safelisted
  eingeordnet. Der aktuelle Gateway exponiert es nicht zusätzlich und bleibt
  samt CORS-Headern unverändert. `null` belegt nur Unsichtbarkeit im gefilterten
  Browserheaderobjekt, weder Wire-Abwesenheit noch fehlende
  Browserdekompression; ein exponierter Nicht-null-Wert scheitert. Das Cap zählt
  browserexponierte, möglicherweise bereits decodierte Bytes; die Gleichheit
  von exponierter Content-Length und Kopie ist nur ein enger kanonischer
  Gateway-Kompatibilitätscheck, kein Kompressions- oder Wire-Oktett-Beweis. Ein
  beweiskräftiger sichtbarer Nachweis verlangt einen neuen Gateway-/CORS-Slice.
- ✅ `getReader`, `read`, `cancel`, `releaseLock` werden je einmal aufgelöst;
  Reads sind seriell. Je Result werden Prototyp und vollständige Own-Key-Menge
  einmal erfasst; es muss exakt
  `Reflect.ownKeys(result) === ["value", "done"]` gelten. Danach werden
  die Deskriptoren genau einmal in der Reihenfolge `done`, `value` gelesen und
  keine Werte erneut beobachtet. Beobachtbare Proxyinkonsistenzen scheitern,
  ohne transparente Record-Proxies universell erkennen zu wollen.
- ✅ Das terminale Readerprofil auf `done: true` mit exakt
  `value: undefined` festgelegt; `getReader` verwendet den Body und
  `read`/`cancel`/`releaseLock` den Reader als richtigen Receiver. `abort`
  verwendet den Controllerreceiver. Fehlercleanup bleibt nicht blockierend;
  Throws und zulässige native Rejections werden konsumiert.
- ✅ `done: false` nur mit echtem brand-geprüftem, nicht unterklassifiziertem
  `Uint8Array` exakten Prototyps und sicherer positiver Ganzzahl-ByteLength
  zulassen. Ein Nullchunk scheitert nach genau diesem Read ohne Kopie oder
  zweiten Read mit Abort und Cleanup; damit bleiben höchstens `16.384`
  akzeptierte Nicht-EOF-Reads, ohne zusätzliche konfigurierbare Readgrenze.
  Die backing-buffer-Identität stammt ausschließlich aus der erfassten
  Intrinsic und muss ein echter fester Same-Realm-`ArrayBuffer` mit exakt
  erfasstem `ArrayBuffer.prototype` sein. SharedArrayBuffer, Growable
  SharedArrayBuffer, Proxy, fremder Buffer, detached Buffer, malformed Buffer,
  falscher Bufferprototyp und, sofern prüfbar, resizable Buffer scheitern.
  ByteLength und Kopie verwenden erfasste Intrinsics; zwischen letzter Prüfung
  und Kopie liegt kein fremder Hook. Genau ein fester, nicht geteilter
  transport-eigener Ziel-`ArrayBuffer` hält die sofortigen Kopien. Byte `16.385`
  scheitert vor Kopie, Allokation oder weiterem Read. Erfolg verlangt EOF,
  exakte Längengleichheit, null Cancel und genau ein erfolgreiches Release;
  Fehler und Deadline versuchen Cancel/Release höchstens einmal best effort.
- ✅ Nach Disarm und Timercleanup genau eine fatale UTF-8-Decodierung über die
  erfasste Decoder-Prototypmethode mit `ignoreBOM: true` und genau ein natives
  `JSON.parse` ohne Reviver, Trim, Reparatur oder Normalisierung festgelegt.
  Parsed-Primitiven sind zulässig; Object-/Arrayroots müssen die exakten
  Prototypketten bis `null` besitzen; die erfassten Object-/Array-Prototypen
  dürfen keine eigene `then`-Property besitzen. Ein eigenes Top-Level-`then` darf nur eine
  nicht aufrufbare Dateneigenschaft sein. Erst dieser geschlossene Wert erfüllt
  unmittelbar das bereits erzeugte native Promise.
- ✅ Beherrschte Methodenfehler auf denselben statischen tief eingefrorenen
  Zwei-Felder-Record `BROWSER_SYNC_TRANSPORT_FAILED` / `Der lokale Browser-
  SyncTransport ist fehlgeschlagen.` begrenzt. Keine URL, Header, Bodies,
  Bytes, Request-ID, Dependency-, Browser-, Validator-, Exceptiondetails oder
  Logs dürfen leaken. Factory-`TypeError` bleibt getrennt. SyncService ordnet
  Transportfehler `transportFailed` und parsebare ungeeignete oder falsch
  korrelierte HTTP-200-Werte `invalidResponse` zu.
- ✅ Browser, UI, Same-Origin-Code, Caller, Fetch und Responsewerte bleiben
  unvertrauenswürdig. Die App setzt keine Cookies, Credentials, Authorization,
  Referrer, privaten Payload, Provider-Secrets, Logs oder Telemetrie; der
  Browser kann dennoch Origin, User-Agent, Accept/Accept-Language, Sec-Fetch-*,
  Client Hints und PNA/LNA-Metadaten an den lokalen Port senden. Omit,
  No-Referrer, Loopback und CORS beweisen weder Datenschutz, Anonymität,
  Authentisierung noch Autorisierung.
- ✅ Die spätere Unit-Suite vollständig netzwerkfrei am exakten Pfad
  `tests/browserSyncTransport.test.js` geplant. Ihre mutationswirksame Matrix
  umfasst die exakte Request-Reflection-Reihenfolge, nur denselben frischen
  Graphen als genau zweimaligen Validatorinput und null Snapshotvalidierungen;
  eigene `constructor`-Accessorproperty, zusätzliche Promisekeys, mutierte
  Constructor-/Species-Deskriptoren, fremde Species-Getter/-Konstruktoren,
  post-import ersetztes globales `Promise.prototype.then` und ausschließlich
  `undefined` zurückgebende Handler ohne Leak; einen ersten nativen Same-Realm-
  Promise-Read mit leerem `Uint8Array`, der nach genau einem Read ohne Kopie,
  zweiten Read oder Microtask-Starvation mit Abort/Cleanup scheitert; native
  Iterator-Keyfolge `value`, `done` und Descriptorfolge `done`, `value`;
  SharedArrayBuffer-/Growable-SharedArrayBuffer-/Resizable-/detached-/falsche-
  Bufferprototyp- und post-import Getterfälle sowie die unmittelbare saubere
  Kontrollkopie eines normalen festen `ArrayBuffer`; Abort jedes Post-Fetch-Fehlerprofils bei null Abort
  vor Fetch und Erfolg; fail-fast Responsegetter-/Headeraufrufzahlen sowie
  gefiltertes Content-Encoding `null` gegenüber exponiertem Nicht-null ohne
  Wireclaim. Kein echter Netzwerkrequest gehört in diesen Slice.
- ✅ Vor Browserkomposition und End-to-End-Fluss ein separates reales und an
  OS, Browserversion, Frontend-Origin/-Kontext und Endpoint gebundenes Gate
  verlangt. Es muss CORS/Preflight, Private/Local Network Access,
  Browserberechtigungen, Secure Context/Mixed Content, Loopbackziel, Redirect,
  exponierte und blockierte Responseheader, finale URL, Response-Typ,
  Browserunterschiede und nötige Benutzerfreigaben als `PASS` belegen. Das
  `PASS` bleibt kontext- und versionsgebunden und ist keine allgemeine
  Browsergarantie. Benötigte
  Policy-, Permission-, Header- oder CORS-Änderungen öffnen ADR 0020/0026 neu;
  ein Fallback bleibt unzulässig.
- ✅ Den aktuellen Tor-A-Befund ausschließlich auf den Dokumentationsslice
  begrenzt. Vor Merge der Implementierung werden tatsächlicher Code, Browser-
  APIs, Dependencies und Datenflüsse auf fehlende Modelle, modell-, lern- oder
  statistikbasierte Inferenz, Training, Lernen oder Adaptieren, Provider,
  Workflows, private Payloads, Telemetrie, Persistenz und fachliche
  Nebenwirkungen erneut geprüft; Browserkomposition und
  reale menschliche Interaktion erhalten ein eigenes vollständiges Gate. Jeder
  Befund bleibt eine vorläufige Nicht-KI-Arbeitshypothese, keine Rechtsberatung,
  Gesamtklassifikation oder Compliancegarantie.
- ✅ Ausschließlich Dokumentation geändert: kein Transportmodul, Test, Fetch,
  Browserrequest, Nutzertrigger, `src/main.js`- oder UI-Komposition,
  Browser-End-to-End-Fluss, Gateway-/Runtimeänderung, Provider oder privater
  Datenpfad. ADR 0026 ist nur das Gate für den nächsten isolierten
  Implementierungsslice.

### Verbindliche Slice-Reihenfolge innerhalb von v0.3.0

1. ✅ **ADR 0023 – lokaler SyncAgent, optionale Provider:** neue Zieltopologie,
   Vertrauenszonen, Providerrolle und Reihenfolge entschieden; ADR 0002 und ADR
   0019 formal ersetzt.
2. ✅ **Vollständig lokaler SyncAgent-Kern:** logisch getrennten,
   importinaktiven, synchronen und modellfreien Kern ausschließlich für den
   leeren synthetischen `syncTest` nach ADR 0024 implementiert. ModelProvider,
   WorkflowProvider oder externe Adapter sind keine Dependencies dieses Kerns.
   Das zusätzliche Entscheidungsgate vor Schritt 3 ist mit ADR 0025 erfüllt:
   In-Process-Kompositionsstelle, Boundary-Handoff, untrusted Agentresult,
   defensive Responseprojektion, HTTP-Matrix, Responsebesitz, Lifecycle und
   enges Phase-0-Tor sind entschieden, ohne Code oder `503`-Pfad zu ändern.
3. ✅ **Implementierung der getrennten lokalen Komposition:** den durch ADR 0025
   entschiedenen Vertrag im bestehenden Gateway-Prozess umgesetzt, ohne einen
   zweiten Listener, eine neue IPC-Grenze oder einen zusätzlichen
   Netzwerkdienst einzuführen. Der exakte Erfolg endet lokal mit HTTP `200`.
4. ✅ **ADR 0026 – Browser-SyncTransport-Entscheidung und -Vertrag:** die
   konkrete Clienttransportgrenze hinter
   `syncTransport.sendSyncRequest(syncRequest)` ausschließlich dokumentarisch
   als damaligen Stand entschieden, ohne Transport oder Browserfluss zu
   implementieren; die Entscheidung ist inzwischen durch ADR 0027 ersetzt.
5. ✅ **ADR 0027 – beobachtbare Browser-SyncTransport-Nachweisgrenzen:** den
   ersten Implementierungsversuch vor jeder Dateiänderung gestoppt, ADR 0026
   formal ersetzt, alle nicht betroffenen Regeln unverändert übernommen und
   Realm-Provenienz sowie die öffentliche Requestcap-Erreichbarkeit auf die
   tatsächlich beweisbaren Profile und 193 gültigen v1-Bytes korrigiert.
6. ✅ **Isolierte BrowserSyncTransport-Implementierung:** ausschließlich
   `src/transports/browserSyncTransport.js` und die netzwerkfreie
   mutationswirksame Unit-Suite `tests/browserSyncTransport.test.js` gemäß ADR
   0027 implementiert und den tatsächlichen Slice erneut eng durch Tor A
   geprüft; weiterhin keine `src/main.js`-, UI- oder Browserkomposition und kein
   Browser-End-to-End-Test.
7. ✅ **ADR 0028 – Browser SyncTransport Validator Integrity Boundary:** ADR
   0027 formal ersetzt, dessen beide Korrekturen übernommen und für die
   damals bestätigte Validator-Integritätslücke genau eine feste private
   v1-Wire-Policy unmittelbar vor Stringify entschieden.
8. ✅ **Feste v1-Wire-Policy und Mutationsnachweis:** die transportlokale
   Policy ohne neue API, Dependency oder Composition-Seam implementiert;
   exakt zwei Contractvalidatoraufrufe, genau eine Policyprüfung, frühe
   Ablehnung jeder Abweichung und den kausalen Bypass bei neutralisierter
   Policy in einer temporären Quellkopie mutationswirksam belegt. Contract,
   Bundle, Manifest und Generator bleiben unverändert.
9. ✅ **ADR 0029 – Local Browser Runtime Evidence Gate:** das Runtimegate als
   reinen Dokumentationsvertrag an `T₀`, zwei geschlossen allowlistete
   Negativdeltas, zehn Pflichtgates, Restore, Cleanup und einen geschlossenen
   Evidence-Record gebunden; keinen Runtimevorgang ausgeführt. Der tatsächliche
   Gatezustand war am Ende dieses Entscheidungsslices `UNPROVEN`.
10. ❌ **Einmaliger Chrome-Stable-Runtime-Evidence-Nachweis:** an Windows,
   Chrome `151.0.7922.174`, tatsächliche Frontend-Origin und -Kontext sowie
   Endpoint gebunden ausgeführt und nach `positive-default` stopregelkonform
   beendet; `normalSyntheticTransport` und Gesamtgate `FAIL`, PNA/LNA sowie
   die nicht ausgeführten Negativkontrollen `UNPROVEN`, Cleanup `PASS`.
11. ✅ **ADR 0030 / ADR 0031 – korrigierte passive Runtime-Diagnosegrenze:**
   den unabhängigen Pipe-Observer, `T_replay ≡R T₀`, externe Stages, das exakte
   Requestbudget und den `BrowserTransportDiagnosticRecord` entschieden;
   ADR 0031 ersetzt ADR 0030 formal und ergänzt die exakt 20 Cleanup-IDs, die
   flüchtige By-Value-Hüllengrenze und `(S && N) || C`, ohne Foundation oder
   Lauf zu implementieren oder zu autorisieren.
12. ⬜ **Nächster Slice – netzwerkfreie Diagnosefoundation:** den passiven
   Controller und die geschlossene Projektions-/Integritätslogik in einem
   eigenen vollständig netzwerkfreien Slice implementieren und testen.
13. ⬜ **Separate Laufautorisierung:** erst danach Zielbrowser, `T_replay`,
   Observer, exakt einen Request, Benutzerinteraktion und Cleanup ausdrücklich
   autorisieren.
14. ⬜ **Einmaliger sichtbarer Diagnoselauf:** ausschließlich den autorisierten
   Einmallauf ausführen und in einem getrennten sanitisierten Record
   dokumentieren.
15. ⬜ **Bedingter Produktentscheidungs-ADR:** nur bei ausreichendem Befund eine
   Produktänderung entscheiden; Reproduktion allein ist kein Ursachennachweis.
16. ⬜ **Getrennte Produktimplementierung:** ausschließlich die zuvor
   entschiedene Produktänderung implementieren und prüfen.
17. ⬜ **Vollständig neuer ADR-0029-Runtime-Evidence-Lauf:** mit neuer Run-ID
   und vollständiger Gatematrix separat autorisieren und ausführen.
18. ⬜ **Browserkomposition:** erst nach dessen Gesamt-`PASS` in einem eigenen
   Entscheidungs- und Implementierungsslice den isoliert geprüften
   Clienttransport mit dem SyncService komponieren.
19. ⬜ **Lokaler End-to-End-`syncTest`:** den vollständig lokalen Browserfluss
   bis zur normal korrelierten SyncResponse danach in einem weiteren getrennten
   Slice nachweisen.
20. ⬜ **Globale/systemweite lokale Betriebsgrenzen:** Missbrauchs-,
   Parallelitäts-, Zeit- und Ressourcenbegrenzung für den lokalen Pfad
   entscheiden, implementieren und verifizieren.
21. ⬜ **Erst danach getrennte Providerentscheidungen:** jeden externen oder
   lokalen Provider nur capability-spezifisch, standardmäßig deaktiviert und
   mit eigener Sicherheits-, Datenschutz- und Aktivierungsentscheidung planen.
22. ⬜ **Provideradapter als getrennte Slices:** OpenAI-, lokales-Modell- und
   n8n-Adapter unabhängig voneinander entscheiden und implementieren; kein
   Adapter ist durch ADR 0023 autorisiert.
23. ⬜ **Private Daten, weitere Aktionen, Tools und Nebenwirkungen:** erst nach
   neuen Contract-, Identitäts-, Berechtigungs-, Replay-, Idempotenz- und
   Datenschutzentscheidungen einführen.

Eine normale vollständig korrelierte Contract-Fehlerresponse bleibt im
SyncService außen `ok: true`, während `syncResponse.success: false` den
fachlichen Misserfolg trägt. HTTP-Fehler, Authentisierungsfehler, Timeouts,
frühe `gateway_`-Responses, lokale Gatewayfehler und ungeeignete
Providerantworten bleiben dagegen unvertrauenswürdig; ungeeignete Antworten
werden als statisch redigierte lokale Transport- oder Responsefehler behandelt
und nie in normale SyncAgent-Responses umgeschrieben.

### Abnahmekriterien der abgeschlossenen SyncService Foundation

- Die öffentliche API ist eingefroren und besitzt exakt `runSyncTest`;
  zusätzliche Argumente werden ohne Inspektion und ohne Dependency-Zugriff
  abgelehnt.
- Generator und Clock werden erst nach erfolgreicher einmaliger Auflösung von
  `sendSyncRequest` während des Request-Builds jeweils exakt einmal
  ausgewertet. Bei einer nicht verfügbaren Portmethode werden sie nicht
  ausgewertet; ungültige oder werfende Buildergebnisse führen nicht zum Aufruf
  der Portmethode.
- Jeder Transportrequest ist vollständig validiert und von seiner
  unveränderlichen internen Korrelation getrennt.
- Die Portmethode wird erst nach vollständiger Requestvalidierung und pro
  Aufruf höchstens einmal aufgerufen. Sequenzielle und parallele Aufrufe teilen
  keine veränderlichen Records.
- Nur defensive, vollständig validierte und konkret korrelierte normale
  SyncResponses werden ausgegeben. Eine gültige normale Contract-Fehlerresponse
  bleibt außen `ok: true`; der fachliche Zustand bleibt
  `syncResponse.success`.
- Lokale Fehler besitzen ausschließlich den exakten Fünf-Felder-Result,
  statische redigierte Fehler und keine behauptete SyncAgent-Verarbeitung.
- Injizierte Functions bleiben vertrauenswürdiger ausführbarer Code.
  Beobachtbare Dependency-, Proxy- und Thenable-Fehler werden redigiert;
  bereits ausgelöste Seiteneffekte werden nicht als verhinderbar oder
  rückgängig dargestellt.
- Die gezielte SyncService-Suite besteht mit 43/43 Tests, die kombinierte
  SyncService-/SyncContract-Suite mit 88/88 Tests und die Gesamtsuite mit
  1021/1021 Tests bei 0 Fehlschlägen, 0 Skips und 0 Todos.
- Der Produktions-Build ist erfolgreich und transformiert exakt 46 Module.

### Portfolio-Nachweis der abgeschlossenen SyncService Foundation

- exakte öffentliche Service-API, kontrollierter Request-Build und
  unveränderliche Korrelation;
- getrennter normaler SyncResponse- und lokaler Servicefehlervertrag;
- ausschließlich testseitiger, vollständig simulierter In-Memory-Fluss mit als
  `synthetic` klassifizierten Erfolgsdaten; `synthetic` bleibt ausschließlich
  eine `dataOrigin`-Klassifikation und kein Herkunftsbeweis;
- ADR 0017 mit klarer Trennung von Transport-Port, konkretem Transport und
  späterer Gateway-Grenze; ADR 0016 bleibt die unveränderte Contract-Grundlage.

### Abnahmekriterien der abgeschlossenen SyncGateway Request Boundary Foundation

- Die öffentliche API ist eingefroren, gewöhnlich und besitzt exakt die
  synchrone Methode `processSyncRawBody`; falsche Argumentanzahlen werden ohne
  Inspektion und ohne Dependency-Zugriff abgelehnt.
- Die Prüfung des unveränderten Raw-Body-Werts erfolgt garantiert vor dem
  einzigen nativen Parse ohne Reviver. Übergröße wird ohne Parserzugriff
  abgelehnt.
- Der unveränderte Parsed-Wert muss den geschlossenen SyncContract vollständig
  bestehen, bevor eine defensive Projektion entsteht. Zusatzfelder werden
  nicht vor dieser Prüfung entfernt.
- Die neue Sechs-Felder-Projektion verwendet ein frisches exakt leeres Payload,
  wird mit derselben einmal erfassten Referenzzeit validiert, tief eingefroren
  und final erneut validiert.
- Jeder Result besitzt exakt fünf Felder. Ein akzeptierter Request, eine
  kontrollierte frühe Gateway-Ablehnung und ein lokaler Boundary-Fehler bleiben
  semantisch getrennt.
- Gateway-Fehlerprofile folgen ausschließlich der dokumentierten statischen
  Zuordnung. Gemischte Requestfehler ergeben `VALIDATION_ERROR`; interne
  Clock-, Generator-, Builder-, Freeze- oder Validatorfehler ergeben keine
  Gateway-Response.
- Jede Gateway-Ablehnung besitzt frische Records und Arrays, eine neue
  kontrollierte `gateway_`-ID, keine gespiegelte `req_`-ID, keinen Handler
  und eine leere Verarbeitungskette.
- Clock und Generator werden höchstens in den dokumentierten Pfaden ausgewertet
  und weder fremde Werte noch Exceptions, Parser- oder Validatorinterna werden
  ausgegeben oder geloggt.
- Mutationsgerichtete Tests belegen die reale Validierungs-/Freeze-Reihenfolge,
  die unveränderte Originalgrößenprüfung vor NFC-Normalisierung und Parsing,
  einen Console-stillen Erfolgspfad, exakt einen Versuch werfender Functions,
  Function-Proxies und des Default-UUID-Pfads sowie vollständig getrennte
  Identitäten wiederholter `INVALID_JSON`-Responses. Globale
  Instrumentierungen laufen mit `concurrency: false` und `finally`-Restore.
- Native Duplicate-Key-/Last-Key-Wins- und Single-Parser-Semantik sowie die
  Grenze zwischen bereits materialisiertem String und späterer Wire-
  Bytebegrenzung sind dokumentiert.
- Die isolierte Boundary Foundation selbst enthält keinen HTTP-Handler,
  Endpoint, konkreten Transport, Webhook, n8n, operativen Agenten, Storage,
  Logging, Telemetrie, UI oder `src/main.js`-Komposition. Der nachfolgende
  lokale HTTP-Slice verändert diese historische Modulgrenze nicht.
- Die gezielte Boundary-Suite besteht mit 54/54 Tests unter dem exakt
  geforderten `node --test tests/syncGatewayRequestBoundary.test.js`; Boundary
  plus SyncContract bestehen mit 99/99 und Boundary plus SyncContract plus
  SyncService mit 142/142 Tests.
- Die Gesamtsuite besteht mit 1075/1075 Tests. Alle vier Läufe besitzen 0
  Fehlschläge, 0 Skips und 0 Todos.
- Der Produktions-Build ist erfolgreich und transformiert exakt 46 Module.

### Portfolio-Nachweis der abgeschlossenen SyncGateway Request Boundary Foundation

- exakte synchrone Boundary-API und exakter Fünf-Felder-Resultvertrag;
- nachvollziehbarer Raw-Body-, Single-Parse-, ursprünglicher
  Contractvalidierungs-, Projektions- und Freeze-Fluss;
- statische redigierte frühe Gateway-Ablehnungen ohne erfundene
  SyncAgent-Verarbeitung;
- ADR 0018 mit klarer Trennung von materialisiertem String, späterer
  Wire-Byte-Grenze und HTTP-/Webhook-Komposition; ADR 0016 und ADR 0017 bleiben
  unveränderte Grundlagen.

## v0.4.0 – DataAgent and Airtable Integration

### Ziel der Datenanbindung

Den `DataAgent` als Bibliothekar und einzige strukturierte Schnittstelle
zwischen Agentensystem und Airtable etablieren. Nur er kommuniziert direkt mit
Airtable; `SyncAgent` und `TestAgent` erhalten keinen direkten Zugriff.

### Umfang der Datenanbindung

- ⬜ Minimales Airtable-Schema für den ersten Testfluss definieren.
- ⬜ Feldnamen und fachliche Entitäten in `schemas/airtable/` dokumentieren.
- ⬜ Die GoldenDawn-seitige Kopie eines Airtable-Credentials ausschließlich in
  der später entschiedenen vertrauenswürdigen Laufzeitkonfiguration oder
  Secretverwaltung des konkreten Airtable-Adapters auf GD-WS01 konfigurieren;
  providerseitiges Prüfmaterial getrennt nur bei Airtable halten, niemals im
  DataAgent selbst, Browser oder Repository.
- ⬜ DataAgent für validierte Lese- und Schreibaufträge implementieren.
- ⬜ SyncAgent-Routing zum DataAgent ergänzen.
- ⬜ Airtable-interne Antworten in stabile Domänenobjekte übersetzen.
- ⬜ Eindeutige IDs und `requestId` zur Duplikatvermeidung verwenden.
- ⬜ Einen Datensatz kontrolliert schreiben und wieder lesen.
- ⬜ Nicht gefundene Datensätze und Mappingfehler behandeln.
- ⬜ Private und Demo-Datenquellen konzeptionell trennen.

### Abnahmekriterien für v0.4.0

- Nur der DataAgent besitzt die fachliche Zuständigkeit für Airtable-Zugriffe;
  er hält selbst kein Credential und erreicht Airtable ausschließlich über den
  konkreten Adapter mit getrennten lokalen und providerseitigen
  Credentialgrenzen.
- Ein gültiger Schreibauftrag erzeugt genau einen Datensatz.
- Ein Leseauftrag liefert ein normalisiertes Ergebnis zurück.
- Wiederholte Requests erzeugen keine unbeabsichtigten Duplikate.
- Änderungen am Airtable-Schema erfordern keine Änderung an UI-Komponenten.
- Fehler enthalten keine Credentials oder unnötigen persönlichen Daten.

### Portfolio-Nachweis für v0.4.0

- dokumentiertes Airtable-Schema;
- End-to-End-Beispiel für Schreiben und Lesen;
- sichtbare Kapselung des Datenzugriffs im DataAgent.

## v0.5.0 – TestAgent and Learning Tests

### Ziel der TestAgent-Lerntests

Einen abgegrenzten Lernprüfungsprozess mit Erstellung, Bewertung, Feedback und
kontrollierter Ergebnisspeicherung umsetzen.

### Umfang der TestAgent-Lerntests

- ⬜ `LearningTestService` über die dokumentierte lokale Grenze an
  `SyncService → lokaler SyncTransport → lokales SyncGateway auf GD-WS01 →
  lokaler SyncAgent → TestAgent` anbinden, ohne direkte
  Agentenaufrufe aus UI-Komponenten oder stille Erweiterung der lokalen
  Schema-1-Verträge. Dafür ist vorab eine neue Architektur- und
  Sicherheitsentscheidung nötig; ADR 0023 autorisiert nur die Entscheidung zum
  lokalen `syncTest`. Ein optionaler ModelProvider benötigt einen eigenen
  späteren Entscheidungsslice.
- ⬜ Request- und Ergebnisformat für Lerntests definieren.
- ⬜ Freigegebenen Lernkontext strukturiert an den TestAgent übergeben.
- ⬜ Testfragen mit erwarteten Antwortmerkmalen erzeugen.
- ⬜ Nutzerantworten anhand dokumentierter Kriterien bewerten.
- ⬜ Semantische Freitextbewertung als echte TestAgent-Funktion einführen.
- ⬜ Punktzahl, Status, Feedback und Wiederholungshinweise zurückgeben.
- ⬜ Ergebnisse über den SyncAgent an den DataAgent übergeben.
- ⬜ Testergebnisse durch den DataAgent in Airtable speichern.
- ⬜ Fachliches Testergebnis und technischen Speicherstatus getrennt anzeigen.
- ⬜ Beschädigte oder unvollständige Modellantworten kontrolliert behandeln.
- ⬜ Einen vollständigen Arisa-Test-Durchlauf dokumentieren.

### Abnahmekriterien für v0.5.0

- Der TestAgent greift nicht direkt auf Airtable zu.
- Gleicher Testkontext erzeugt ein nachvollziehbares Prüfungsformat.
- Bewertungen enthalten begründetes Feedback und keine reine Punktzahl.
- Ein erfolgreicher Test bleibt fachlich erfolgreich, wenn die Speicherung
  vorübergehend fehlschlägt.
- Ein gespeichertes Ergebnis ist über eine stabile ID auffindbar.
- Der gesamte Datenfluss entspricht `docs/architecture.md`.

### Portfolio-Nachweis für v0.5.0

- anonymisierter Beispieltest;
- strukturierte Bewertungsantwort;
- Sequenzdarstellung vom Dashboard bis Airtable.

## v0.6.0 – Multi-Agent Integration

### Ziel der Integrationsphase

Die drei Agenten als zusammenhängendes System stabilisieren und eine sichere
Portfolio-Demo vorbereiten.

### Umfang der Integrationsphase

- ⬜ End-to-End-Flüsse automatisiert oder reproduzierbar prüfen.
- ⬜ Einheitliche Fehlercodes und Agentenstatus verwenden.
- ⬜ Timeouts und begrenzte Wiederholungsstrategien testen.
- ⬜ Duplikate bei wiederholten Schreibversuchen verhindern.
- ⬜ Logs um `requestId`, Agent und Ergebnisstatus ergänzen.
- ⬜ Logs auf Secrets und unnötige personenbezogene Daten prüfen.
- ⬜ Synthetischen Demo-Datensatz erstellen.
- ⬜ Private und öffentliche Konfiguration vollständig trennen.
- ⬜ Responsive Darstellung auf Desktop und Smartphone prüfen.
- ⬜ Sicherheits- und Architekturreview durchführen.

### Abnahmekriterien für v0.6.0

- Die wichtigsten drei End-to-End-Flüsse sind reproduzierbar getestet.
- Fehlerzustände sind verständlich und führen nicht zu Datenverlust oder
  unbemerkten Duplikaten.
- Demo-Modus enthält ausschließlich synthetische Daten.
- Private Konfiguration wird nicht in den Frontend-Build oder das Repository
  übernommen.
- Ein frischer Clone kann anhand der Dokumentation gestartet werden.

### Portfolio-Nachweis für v0.6.0

- Testprotokoll der wichtigsten Flüsse;
- Demo-Datensatz und Sicherheitscheckliste;
- Architekturvergleich zwischen lokalem und verbundenem Modus.

## v1.0.0 – Portfolio Release

### Ziel des Portfolio-Releases

GoldenDawn OS als sichere, verständliche und professionell dokumentierte
Drei-Agenten-Demo veröffentlichen.

### Umfang des Portfolio-Releases

- ⬜ Öffentliche Demo mit synthetischen Daten bereitstellen.
- ⬜ Statische Frontend-Bereitstellung dokumentieren.
- ⬜ Die tatsächlich separat freigegebenen serverseitigen Provider- und
  Airtable-Adapterkonfigurationen ohne Credentials dokumentieren.
- ⬜ README mit aktuellen Screenshots und Demo-Link vervollständigen.
- ⬜ Architektur, Roadmap, Sicherheit und Datenverträge final abgleichen.
- ⬜ Projektfallstudie mit Problem, Entscheidungen und Ergebnissen erstellen.
- ⬜ Bekannte Grenzen und nächste mögliche Schritte dokumentieren.
- ⬜ Release-Checkliste abschließen.
- ⬜ Tag und GitHub Release manuell erstellen.

### Abnahmekriterien für v1.0.0

- Die öffentliche Demo enthält keine privaten Daten oder Secrets.
- SyncAgent, DataAgent und TestAgent sind klar unterscheidbar demonstrierbar.
- Ein vollständiger Lerntest kann durchgeführt und kontrolliert gespeichert
  werden.
- Dokumentation und sichtbarer Produktstand stimmen überein.
- Build, Kernflüsse und mobile Darstellung sind geprüft.
- Bekannte Einschränkungen sind transparent dokumentiert.

### Portfolio-Nachweis für v1.0.0

- Live-Demo oder reproduzierbare lokale Demo;
- technische Fallstudie;
- Architektur- und Workflow-Diagramme;
- GitHub-Release mit nachvollziehbarer Entwicklungsgeschichte.

## Qualitätsgates zwischen den Versionen

Vor dem Start einer neuen Version werden folgende Punkte geprüft:

1. Sind alle Abnahmekriterien der aktuellen Version erfüllt?
2. Ist `npm run build` erfolgreich?
3. Sind relevante Tests oder manuelle Prüfungen dokumentiert?
4. Stimmen README, AGENTS.md, Architektur und Roadmap überein?
5. Enthält der geplante nächste Schritt neue Abhängigkeiten oder Secrets?
6. Bleibt der Scope auf die drei Agenten von Version 1 begrenzt?
7. Ist der Git-Arbeitsstand sauber und der Pull Request nachvollziehbar?

## Hauptrisiken

| Risiko | Gegenmaßnahme |
| --- | --- |
| Unkontrolliertes Scope-Wachstum | Version 1 strikt auf drei Agenten und definierte Module begrenzen |
| Secrets im Frontend | GoldenDawn-seitige Credentialkopien nur in der vertrauenswürdigen Runtime-/Secretverwaltung konkreter Adapter auf GD-WS01, providerseitiges Prüfmaterial getrennt im jeweiligen Provider-Store halten; Same-Realm und Providerablage nicht als Secret-Isolation, Redaction, Retention oder Nichtweitergabe überbehaupten |
| Live manipulierbare Validatoroberflächen und ungeklärte positive Browser-Laufzeitabweichung | Die implementierte feste transportlokale v1-Wire-Policy samt kausalem Mutationsnachweis schließt die damalige Transportlücke; Contractvalidator und Same-Realm bleiben unverändert. Der einmalige Chrome-151-Runtime-Lauf endete wegen einer getrennten positiven Transportabweichung mit Gesamt-`FAIL`; ADR 0031 ersetzt ADR 0030 formal und begrenzt ausschließlich die spätere passive Diagnose, der Ursachenstatus bleibt exakt `CAUSE_NOT_PROVEN` |
| Kopplung an Airtable-Feldnamen | Mapping vollständig im DataAgent kapseln |
| Ungültige Modellantworten | Struktur validieren und kontrollierte Fallbacks verwenden |
| Doppelte Datensätze | Stabile IDs, `requestId` und idempotente Schreiblogik einsetzen |
| Vermischung privater und öffentlicher Daten | Getrennte Datenquellen, Konfigurationen und Deployments verwenden |
| Dokumentation veraltet | Dokumentationsabgleich als Abnahmekriterium jeder Version verwenden |

## Ausblick nach v1.0.0

`v1.0.0` vollendet die erste vollständige Produkt- und Portfolio-Phase von
GoldenDawn OS. Das System soll danach weiterentwickelt werden. Eine konkrete
Post-`v1.0.0`-Roadmap wird jedoch erst festgelegt, wenn `v1.0.0` fertiggestellt
und ausgewertet ist. Prioritäten, Versionsnummern und Funktionsumfänge für die
Zeit danach sind noch nicht zugesagt.

Ausdrücklich unverbindliche mögliche Themen sind:

- CareerHub und ResearchAgent;
- weitere spezialisierte Agenten und Automatisierungen;
- Cloud- beziehungsweise Serverbetrieb;
- mobile Nutzung und PWA-Ausbau;
- erweiterte Lern-, Analyse- und Review-Funktionen.

Keines dieser Themen ist bereits beschlossen oder einer künftigen
Versionsnummer zugeordnet.

## Nächster konkreter Schritt

Die Implementierung von `v0.2.0 – Local Dashboard MVP` ist abgeschlossen, mit
den automatisierten Tests sowie dem Produktions-Build geprüft und als Tag
`v0.2.0` mit dem zugehörigen GitHub Release veröffentlicht. PromptVault
unterstützt lokal Anzeigen, Erstellen, Bearbeiten,
Löschen, Durchsuchen, Kategorie- und Favoritenfilter, persistente Favoriten,
unveränderliche Versionierung und Wiederherstellung als neue Version. Suchtext
und Filterzustände bleiben flüchtig. Die Daten liegen ausschließlich im
aktuellen Browserprofil; dies ist keine Cloud-Sicherung.

Git-Aktionen für zukünftige Releases bleiben vollständig manuell bei Jan.

`v0.2.1 – LearningHub Local MVP` ist vollständig abgeschlossen, final mit
552/552 bestandenen automatisierten Tests sowie dem Produktions-Build geprüft
und veröffentlicht. Die Schema-2-Foundation
sowie `LearningHubView`, `LearningHubController`,
`createLearningHubService` und `createLearningHubStorage` für private lokale
Inhalte sind umgesetzt. Der feste Inhaltsnamespace lautet
`goldendawn.learningHub.content.v1`; ein fehlender Key liefert ohne
Schreibzugriff einen leeren privaten Hub. Vorgelagert initialisiert ein
Koordinator genau bei vollständig fehlendem Inhalts-, Artifact-, Testbank- und
Marker-Key einmalig das klar gekennzeichnete synthetische KI-Demo als private
lokale Arbeitskopie. Vorhandene Werte werden nie ergänzt oder überschrieben;
ein stabiler Marker verhindert spätere Rücksetzungen oder erneutes Seeding.
Die Inhaltsoberfläche ist über die bestehende Navigation bedienbar.

Zusätzlich sind LearningProgress-Vertrag, reine Projektion, lokaler Storage und
Service unter dem getrennten Namespace
`goldendawn.learningHub.progress.v1` umgesetzt. Der Service validiert Hub und
Log, prüft Referenzen, hängt Abschluss- und Wiederöffnungsereignisse append-only
an und behandelt bereits erreichte Zielzustände ohne Schreibzugriff. Die
validierte Projektion ist über den vorhandenen Controller und die View als
Kapitelabschluss und Modulfortschritt bedienbar; Progress-Fehler bleiben vom
Inhaltsfluss isoliert.

Außerdem sind LearningArtifact-Vertrag, privater lokaler Storage und Service
unter `goldendawn.learningHub.artifacts.v1` umgesetzt. Notiz und
Zusammenfassung bleiben als höchstens ein editierbarer aktueller Stand je
LearningNode und Typ vom Inhalt und vom append-only Progress getrennt. Der
Service prüft die vollständige Quellenreferenzkette, behandelt identische
Speicherungen und leere Clear-Ziele schreibfrei und kopiert keine Titel oder
LearningNode-Inhalte in den Artifact-Store. `src/main.js`, der vorhandene
Controller und die View binden diesen Pfad ein. Die UI verwendet eine sichere
Projektion, isoliert Artefaktfehler von Inhalt und Fortschritt, bietet Retry,
meldet schreibfreie No-ops sichtbar und leert erst nach zugänglicher
Inline-Bestätigung.

Der lokale LearningTest-Pfad ist ebenfalls umgesetzt: getrennte
Schema-1-Verträge und private Storages unter
`goldendawn.learningHub.testBank.v1` und
`goldendawn.learningHub.testAttempts.v1`, eine reine deterministische Engine
sowie der referenzprüfende Service für Fragenverwaltung, flüchtige Sessions,
exakte Auswertung, kontrollierten Abbruch und append-only Attempts. Der
vorhandene Controller und die View machen Fragenverwaltung, Modultest,
Ergebnis und redigierte Versuchshistorie als „Lokaler Mock-Test“ bedienbar. Es
gibt keine Zufallsauswahl, KI- oder Netzwerkfunktion. Der koordinierte
Erststart befüllt nur die sieben Demo-Fragen; Attempts, Antworten, Ergebnisse
und Historieneinträge bleiben leer.

Der annotierte Tag `v0.2.1` und das zugehörige GitHub Release wurden am
`2026-07-25` veröffentlicht. GoldenDawn OS ist seitdem als öffentlich
sichtbares Portfolio-Repository ohne Open-Source-Lizenz verfügbar.
`v0.2.2 – LichtwaldLog Local MVP` wurde am `2026-07-26` begonnen, ist
vollständig abgeschlossen und geprüft und wurde am `2026-08-02` veröffentlicht.
Implementiert sind die Contract Foundation und private Storage-Foundation mit
ADR 0013 und ADR 0014 sowie die in ADR 0015 getrennte synthetische
In-Memory-Demo-Runtime und die darauf aufbauenden Service- und
Controller-Foundations und die isolierte View- und CSS-Foundation. Der Service
lädt den autoritativen privaten Zustand ohne Cache, normalisiert Formeingaben,
löst Ziel-IDs exakt auf und kapselt Laden, Erstellen, vollständiges Bearbeiten,
Löschen und Fokusverwaltung hinter dem fachlichen Storage. Der Controller
koordiniert diese Operationen über vollständig geprüfte private
Service-Snapshots und ausschließlich flüchtige Darstellungszustände. Die View
stellt diese Projektion sicher und zugänglich dar. `src/main.js` komponiert den
Pfad über den gemeinsamen `StorageAdapter`; LichtwaldLog ist über die Navigation
mit dem sichtbaren Status `Lokales MVP` erreichbar. Anzeigen, Erstellen,
vollständiges Bearbeiten, dauerhaftes Löschen sowie explizites Setzen und
Entfernen des Fokus sind vollständig über GoldenDawn OS bedienbar. Der
autoritativ über `featuredEntryId` fokussierte Eintrag wird in Übersicht und
Detail rein durch View und CSS als `Besonderer Lichtwaldmoment` präsentiert,
ohne einen zweiten Zustand, eine neue API, Persistenz oder ein
Dashboard-Redesign einzuführen. Die sichtbare synthetische Herkunft und das
Reload-Verhalten bleiben erhalten. Lokale
Textsuche sowie exakte Kalenderdatum- und Tagfilter arbeiten ausschließlich auf
der flüchtigen Controller-Projektion und sind weder Schema-1-Felder noch
persistierte Zustände. Die reale Browserprüfung auf Desktop und bei exakt
`390 × 844` ist für den Navigations-, CRUD-, Fokus-, Such- und Filterfluss
erfolgreich abgeschlossen. Die strikt getrennte synthetische In-Memory-Demo ist
als eigener Storage-, Service-, Controller- und View-Stack vollständig
bedienbar integriert. Der geplante Implementierungsumfang ist vollständig
abgeschlossen und mit 374/374 LichtwaldLog-Tests, 933/933 Tests der Gesamtsuite,
0 Skips, 0 Todos sowie einem Produktions-Build mit exakt 46 transformierten
Modulen geprüft. Die Paketversion ist `0.2.2`; der annotierte Tag `v0.2.2` und
das zugehörige GitHub Release wurden am `2026-08-02` veröffentlicht. `v0.2.2`
ist das neueste veröffentlichte Release. In `v0.3.0` sind SyncContract,
SyncService, SyncGateway Request Boundary, die lokale Raw-Wire-/HTTP-Foundation,
das Generated n8n Boundary Bundle und die lokale, standardmäßig
netzwerkinaktive n8n Cloud Ingress & Runtime Evidence Gate Foundation
implementiert. ADR 0023 ist angenommen, ersetzt ADR 0002 sowie ADR 0019 und
entscheidet den lokalen SyncAgent hinter dem lokalen SyncGateway als
verbindliche Agenten- und Providergrenze. ADR 0024 implementiert den isolierten
synchronen, modell- und providerfreien `syncTest`-Kern. Der lokale Gateway-/
SyncAgent-Kompositionsvertrag aus ADR 0025 ist implementiert; der Kern ist mit
dem Gateway, aber weiterhin nicht mit dem Browser komponiert. ADR 0027 ist am
`2026-08-27` angenommen, ersetzt ADR 0026 formal und übernimmt dessen festen
Browser-SyncTransport-Vertrag mit ausschließlich zwei korrigierten
Nachweisgrenzen. Der damals dateilos gestoppte erste Implementierungsversuch
bleibt historisch dokumentiert. Der korrigierte Transport ist inzwischen in
Isolation samt netzwerkfreier mutationswirksamer Unit-Suite implementiert; der
einmalige Chrome-151-Runtime-Evidence-Lauf ist mit Gesamt-`FAIL` dokumentiert,
während Browserkomposition und lokaler Browser-End-to-End-Fluss weiterhin
fehlen. Der produktive private
65.536-Byte-Requestcap bleibt unverändert, während der größte gültige
öffentliche v1-Request aktuell exakt 193 UTF-8-Bytes umfasst. Realm-Herkunft
wird für fremde native Promise-, View- oder Bufferkandidaten nicht mehr
behauptet; maßgeblich ist ausschließlich ihr geschlossenes beobachtbares
Brand-/Prototypprofil.
ADR 0028 ist am `2026-08-29` angenommen und ersetzt ADR 0027 formal. Die
Entscheidung dokumentierte die damals bestätigte Validator-Integritätslücke der
Browser-Wirefreigabe und legt genau eine private feste v1-Wire-Policy
unmittelbar vor Stringify fest. Diese Policy und ihre kausale
mutationswirksame Matrix sind implementiert und schließen die Transportlücke;
der Contractvalidator selbst blieb unverändert. SyncContract, Bundle,
Manifest und Generator wurden nicht geändert.
ADR 0029 ist am `2026-08-30` als reine Dokumentationsentscheidung angenommen.
Er ergänzt ADR 0020 und ADR 0028, operationalisiert die fortgeltenden ADR-
0026-/ADR-0027-Runtimeanforderungen und ersetzt keinen ADR. Positive
Pflichtbeobachtungen bleiben an `T₀`, die beiden Negativkontrollen ausschließlich
an ihre allowlisteten Deltas gebunden. In diesem Slice erfolgten weder Browser-,
Gateway-, Devserver-, Request-, Port- noch Permissionoperationen; der
tatsächliche Browser-Runtimegate-Status war danach zunächst `UNPROVEN`. Der
später gesondert autorisierte Lauf `chrome-stable-win-01` ist inzwischen mit
Gesamt-`FAIL`, PNA/LNA und den nicht ausgeführten Negativvektoren `UNPROVEN`
sowie Cleanup `PASS` dokumentiert. Die Ursache bleibt `CAUSE_NOT_PROVEN`.
ADR 0030 ist ebenfalls am `2026-08-30` als reine Dokumentationsentscheidung
angenommen. Er ergänzt ADR 0028 und ADR 0029, ersetzt keinen ADR und lässt ADR
0020 als ausdrücklich erneut bewertete Produktions-Gateway-Baseline
unverändert. Die neue Diagnosebindung verwendet ein vollständig neues
`T_replay ≡R T₀` und ausschließlich das allowlistete passive
`Δ_observer`. Der unabhängige `BrowserTransportDiagnosticRecord`, seine
externen Stages, getrennten Clock-Domänen, das exakte Ein-Request-Budget und
die geschlossene Redaction-/Cleanupgrenze sind entschieden, aber weder
Foundation noch Lauf implementiert oder autorisiert. `observerGate` ist kein
Runtimegate; `internalStage` und `internalOwner` bleiben `unknown`, und das
ADR-0029-`overallGate` bleibt unverändert `FAIL`.
ADR 0031 ersetzt ADR 0030 formal, übernimmt dessen fortgeltende Grenzen und
korrigiert ausschließlich die Cleanup-Kardinalität, die flüchtige
CDP-By-Value-Hülle und den gemeinsamen Beobachtungsabschluss. Der Vertrag
behält exakt 20 Cleanup-IDs; die Completion-Barriere lautet `(S && N) || C`.
ADR 0031 ist angenommen, aber weder Foundation noch Lauf sind implementiert
oder autorisiert.
Der veröffentlichte `v0.2.2`-Umfang bleibt
vollständig lokal. Es wurde kein Cloudrequest ausgeführt; weder Listener noch
Evidence-Tool besitzen einen Browser-, Produkt- oder komponierten
Cloudtransport oder eine `src/main.js`-Komposition. Das Evidence-Tool enthält
ausschließlich den standardmäßig inaktiven, synthetischen und manuell
freizugebenden Test-URL-Probeadapter. Daher bestehen weiterhin kein
Produktdatenfluss, kein browserseitig erreichbarer `SyncAgent`, kein
Provideradapter und keine Airtable-Anbindung. Der exakte leere synthetische
Erfolg ist ausschließlich über den explizit gestarteten lokalen Gateway-
Prozess mit HTTP `200` erreichbar.

Import/Export, Webhooks, Synchronisierung, geräteübergreifende Speicherung,
automatische Cloud-Sicherung, Airtable, ein allgemeines Fachbackend,
Benutzerkonten und weitere Agentenlogik bleiben offen beziehungsweise beginnen
erst in den dafür vorgesehenen späteren Slices und Versionen. Der nächste
konkrete Schritt ist ausschließlich die **vollständig netzwerkfreie
Implementierung und Prüfung der passiven ADR-0031-Diagnosefoundation**. Erst
danach können Zielbrowser, `T_replay`, Observer, exakt ein Request,
Benutzerinteraktion und Cleanup für einen sichtbaren Einmallauf separat
autorisiert werden. Ein neuer ADR-0029-Runtime-Evidence-Lauf benötigt später
eine neue Run-ID, die vollständige Gatematrix und eine eigene ausdrückliche
Autorisierung. Der ADR-0028-
Implementierungsslice wurde mit 423/423 fokussierten Tests, 466/466 Tests mit
dem SyncService, 735/735 Tests der sechs Sync-Suites und 1755/1755 Tests der
vollständigen seriellen Gesamtsuite bei `Δ = 151` und jeweils 0 Fehlschlägen,
Abbrüchen, Skips und Todos abgeschlossen. Der Produktions-Build transformiert
weiterhin exakt 46 Module; `bundle:n8n:check` ist driftfrei. Tor A wurde anhand
der tatsächlichen Implementierung erneut bestätigt; kein realer Browser-,
externer Netzwerk-, Gateway-, Cloud-, n8n-, Provider-, Credential- oder
Vaultzugriff erfolgte.
`src/main.js`-, UI- und Browserkomposition sowie der lokale Browser-End-to-End-
`syncTest` folgen erst nach einem späteren vollständig neuen ADR-0029-Gesamt-
`PASS` in weiteren getrennten Slices,
danach lokale Missbrauchs-, Parallelitäts-, Zeit- und Ressourcenlimits und erst
anschließend getrennte Providerentscheidungen.

n8n Cloud, self-hosted n8n, OpenAI und lokale Modelle sind nicht autorisiert
und bilden keinen zwingenden Kernhop. Das unveränderte Evidence-Schema 1 besitzt
kein `overallGate`; die gepinnten Stable-OSS-Befunde bleiben
`stableOssCompatibility: FAIL`, der Production-URL-Messstatus
`productionUrlMeasurementStatus: UNPROVEN` und die Aktivierung
`activationDecision: FAIL`. ADR 0023 autorisiert keinen Cloudzugriff und keine
Tenantmessung. Vor jeglicher Vorbereitung oder Ausführung einer neuen n8n-
Tenantmessung müssen ein neuer n8n-Adapter-ADR angenommen und eine neue
adapterbezogene Evidenz-Schemaversion festgelegt sein. Erst danach benötigen
die Anlage des temporären Workflows, das Wegwerfcredential, jeder einzelne
synthetische Test-URL-One-shot sowie der vorab definierte Cleanup und die
Entfernung der Cloudartefakte jeweils eine eigene ausdrückliche Freigabe. Jede
Supportanfrage ist unabhängig davon separat freizugeben, bleibt rein
informativ und autorisiert weder Workflow, Credential, Tenantvorbereitung oder
-ausführung, Adapteraktivierung noch Productionlauf. Ohne angenommenen ADR und
festgelegte Schemaversion gibt es keinen Workflow, kein Credential und keinen
Test-URL-Verkehr; ein Production-URL-Runner oder -Messpfad existiert nicht.
Header Authentication, Bearer-Secret, konkreter Headername, JWT, HMAC,
asymmetrisches Verfahren, Credentialformat und Rotationsmechanismus bleiben
unentschieden; der ADR-0022-Header-Auth-/Execution-Data-Befund ist ein Blocker,
keine gewählte Lösung. Es wird weder automatisch ein n8n-Endpoint kontaktiert
noch ein Webhook, Credential oder Workflow angelegt.
