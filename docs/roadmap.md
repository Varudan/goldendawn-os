# GoldenDawn OS – Roadmap

## Dokumentstatus

| Feld | Wert |
| --- | --- |
| Projektphase | `v0.3.0 – in Arbeit – Local SyncGateway before n8n Cloud Decision` |
| Zielrelease | `v1.0.0 – Portfolio Release` |
| Agenten-Scope | SyncAgent, DataAgent und TestAgent |
| Status | Paketversion `0.2.2`; neuestes veröffentlichtes Release und Tag `v0.2.2`; SyncContract, SyncService und SyncGateway Request Boundary Foundations implementiert; ADR 0019 zum geplanten lokalen SyncGateway vor n8n Cloud angenommen |
| Letzte Aktualisierung | 2026-08-15 |

Diese Roadmap übersetzt die Vision und Architektur von GoldenDawn OS in kleine,
überprüfbare Entwicklungsstufen. Sie definiert Ergebnisse und Qualitätsgrenzen,
nicht starre Kalendertermine.

## Roadmap-Prinzipien

- Jede Version liefert ein sichtbares und lokal überprüfbares Ergebnis.
- Eine neue Phase beginnt erst, wenn die Abnahmekriterien der vorherigen Phase
  erfüllt sind.
- Die Reihenfolge bleibt: **Mock → Webhook → Airtable → Agentenlogik**.
- Die Reihe `v0.2.x` ist bewusst lokalen GoldenDawn-OS-Modulen vorbehalten.
  `v0.3.0` bereitet die erste externe Kommunikation zunächst mit einem
  transportneutralen Vertrag, einer transportneutralen Servicegrenze und einer
  synchronen Request Boundary für bereits materialisierte Raw-Body-Werte vor.
  Mit ADR 0019 ist als nächster Architekturschritt die lokale Sicherheitsgrenze
  vor n8n Cloud entschieden.
  Da Server, HTTP-Handler, konkreter Transport, Webhook und Workflow noch nicht
  implementiert oder komponiert sind, kommuniziert der aktuelle Stand nicht
  extern.
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
| `v0.3.0` | SyncAgent and Webhook Foundation | In Arbeit: SyncContract, SyncService und SyncGateway Request Boundary Foundations implementiert; ADR 0019 für das geplante lokale SyncGateway vor n8n Cloud angenommen; alle Netzwerk- und Cloudkomponenten folgen | 🟡 |
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
  → künftiges lokales SyncGateway auf GD-WS01
  → authentisierter n8n-Cloud-Webhook
  → SyncAgent
  → TestAgent
```

Semantische Freitextbewertung und echte `TestAgent`-Logik bleiben für `v0.5.0`
geplant. ADR 0019 autorisiert für den ersten externen Flow ausschließlich den
synthetischen, leeren und nebenwirkungsfreien `syncTest`, nicht diesen späteren
privaten Lernpfad.

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

## v0.3.0 – SyncAgent and Webhook Foundation

### Aktueller Stand

`v0.3.0` ist **in Arbeit – Local SyncGateway before n8n Cloud Decision**. Die
SyncContract Foundation für Version `1.0`, die Aktion `syncTest` und den Handler
`SyncAgent`, die asynchrone SyncService Foundation sowie die synchrone,
transportneutrale SyncGateway Request Boundary für einen bereits
materialisierten Raw-Body-String sind implementiert. ADR 0019 ist als nächste
Architektur- und Sicherheitsentscheidung angenommen: Der spätere Browserfluss
führt über einen separaten lokalen Loopback-Prozess auf GD-WS01, bevor ein
authentisierter n8n-Cloud-Webhook erreicht wird.

Der Request-Payload ist exakt leer; erfolgreiche Responses sind auf
`dataOrigin: "synthetic"` begrenzt. Dieser Wert ist nur eine
Vertragsklassifikation und kein Herkunfts- oder Datenschutzbeweis. Die aktuelle
Arbeit ist ausschließlich Dokumentation. Sie implementiert keinen lokalen
Server, Netzwerktransport, HTTP-Handler, Endpoint, Webhook, operativen
`SyncAgent`, n8n-Workflow, kein generiertes Cloudartefakt, keine Header-,
Methoden-, Statuscode-, Content-Type-, Charset- oder Encoding-Verarbeitung,
Authentisierung, Autorisierung, Secrets, CORS- oder Rate-Limit-Durchsetzung,
keine Timeouts, Retries, Replay-, Idempotenz- oder Deduplizierungsschicht, Hub-
UI, Persistenz, Logs, Telemetrie oder `src/main.js`-Komposition. Es entsteht
kein externer Datenfluss; Paketversion, Tag und Release bleiben `0.2.2`/
`v0.2.2`.

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

### Aktueller Slice: ADR 0019 – Local SyncGateway before n8n Cloud Decision

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
- ✅ Alle Komponenten dieses Zielpfads als geplant und nicht implementiert
  ausgewiesen; Vertrag, Service, Boundary, Paketversion und veröffentlichtes
  Release bleiben unverändert.

### Verbindliche Slice-Reihenfolge innerhalb von v0.3.0

1. ✅ **ADR 0019 entschieden:** lokales SyncGateway als Sicherheitsgrenze vor
   n8n Cloud dokumentiert.
2. ⬜ **Lokale Raw-Wire-/HTTP-Foundation:** separaten Loopback-Prozess mit
   fester POST-/OPTIONS-/Origin-/Content-Policy, Streaminglimit von 65.536
   Bytes, Abbruch bei Byte 65.537, strikter einmaliger UTF-8-Decodierung,
   erhaltener U+FEFF-BOM und exakt einem Boundary-Aufruf implementieren.
3. ⬜ **Generiertes n8n-Boundary-Bundle:** aus den kanonischen lokalen Quellen
   ein reproduzierbares selbstständiges Cloudartefakt erzeugen und dessen
   Integrität, Parität und Mutationshärte automatisiert prüfen; keine manuelle
   Contractkopie.
4. ⬜ **Bereinigter Webhook und minimales SyncAgent-Gerüst:** n8n Header
   Authentication, Raw Body und ausschließlich den synthetischen `syncTest`
   komponieren. Eine Byte-/Decoder-/Boundary-Prüfung vor Decodierung darf erst
   nach einem versions- und tenantgebundenen Nachweis tatsächlicher Binärdaten
   aktiviert werden; andernfalls ist ADR 0019 neu zu bewerten.
5. ⬜ **Browser-SyncTransport:** den konkreten lokalen Clienttransport hinter
   `syncTransport.sendSyncRequest(syncRequest)` mit endlichem Timeout,
   statisch redigierten lokalen Fehlern und ohne automatische Retries
   implementieren.
6. ⬜ **End-to-End-`syncTest`:** den einzigen leeren, nebenwirkungsfreien,
   synthetischen Fluss über beide Transporthops und die normale korrelierte
   SyncResponse nachweisen.
7. ⬜ **Betriebshärtung:** konkrete lokale und Cloud-Rate-Limits, Monitoring,
   Retention/Redaction sowie Replay-, Idempotenz- und Deduplizierungsregeln vor
   einer Capability-Erweiterung neu entscheiden und implementieren.
8. ⬜ **Hub-Oberflächen später:** `SyncAgent` im AgentHub und Verbindungen,
   Webhook, Workflow sowie den einzigen `syncTest`-Auslöser im AutomationHub
   darstellen; keine UI gehört zu den vorherigen Foundations.

Eine normale vollständig korrelierte Contract-Fehlerresponse bleibt im
SyncService außen `ok: true`, während `syncResponse.success: false` den
fachlichen Misserfolg trägt. HTTP-Fehler, Authentisierungsfehler, Timeouts,
frühe `gateway_`-Responses, lokale Gatewayfehler und ungeeignete
Cloudresponses bleiben dagegen statisch redigierte lokale Transport- oder
Responsefehler und werden nie in normale SyncAgent-Responses umgeschrieben.

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
- Es gibt keinen HTTP-Handler, Endpoint, konkreten Transport, Webhook, n8n,
  operativen Agenten, Storage, Logging, Telemetrie, UI oder
  `src/main.js`-Komposition.
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
- ⬜ Airtable-Credentials ausschließlich in n8n konfigurieren.
- ⬜ DataAgent für validierte Lese- und Schreibaufträge implementieren.
- ⬜ SyncAgent-Routing zum DataAgent ergänzen.
- ⬜ Airtable-interne Antworten in stabile Domänenobjekte übersetzen.
- ⬜ Eindeutige IDs und `requestId` zur Duplikatvermeidung verwenden.
- ⬜ Einen Datensatz kontrolliert schreiben und wieder lesen.
- ⬜ Nicht gefundene Datensätze und Mappingfehler behandeln.
- ⬜ Private und Demo-Datenquellen konzeptionell trennen.

### Abnahmekriterien für v0.4.0

- Nur der DataAgent besitzt Zugriff auf Airtable-Credentials.
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

- ⬜ `LearningTestService` über eine dokumentierte Provider- oder
  Adaptergrenze an `SyncService → lokaler SyncTransport → lokales SyncGateway
  auf GD-WS01 → authentisierter n8n-Cloud-Webhook → SyncAgent → TestAgent`
  anbinden, ohne direkte
  Agentenaufrufe aus UI-Komponenten oder stille Erweiterung der lokalen
  Schema-1-Verträge. Dafür ist vorab eine neue Architektur- und
  Sicherheitsentscheidung nötig; ADR 0019 erlaubt nur `syncTest`.
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
- ⬜ n8n- und Airtable-Konfiguration ohne Credentials dokumentieren.
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
| Secrets im Frontend | Credentials ausschließlich in n8n oder serverseitiger Umgebung speichern |
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
SyncService und SyncGateway Request Boundary Foundations implementiert. ADR
0019 ist als Architektur- und Sicherheitsentscheidung für ein späteres lokales
SyncGateway auf GD-WS01 vor n8n Cloud angenommen. Der veröffentlichte
`v0.2.2`-Umfang bleibt vollständig lokal. Da weder lokaler Server noch
konkreter Transport, Webhook, Cloudworkflow oder Anwendungskomposition
implementiert sind, besteht weiterhin keine externe Kommunikation, kein
operativer `SyncAgent` und keine Airtable-Anbindung.

Import/Export, Webhooks, Synchronisierung, geräteübergreifende Speicherung,
automatische Cloud-Sicherung, Airtable, ein allgemeines Fachbackend,
Benutzerkonten und Agentenlogik bleiben offen beziehungsweise beginnen erst in
den dafür vorgesehenen späteren Slices und Versionen. Der nächste konkrete
Schritt ist die geplante **lokale Raw-Wire-/HTTP-Foundation** aus Schritt 2 der
verbindlichen v0.3.0-Slice-Reihenfolge. Erst danach folgen generiertes
n8n-Boundary-Bundle, bereinigter Cloudwebhook, konkreter Browser-SyncTransport
und der End-to-End-`syncTest`.
