# GoldenDawn OS – Roadmap

## Dokumentstatus

| Feld | Wert |
| --- | --- |
| Projektphase | `v0.2.1 – LearningHub Local MVP in Arbeit` |
| Zielrelease | `v1.0.0 – Portfolio Release` |
| Agenten-Scope | SyncAgent, DataAgent und TestAgent |
| Status | In Arbeit; Schema 2 sowie getrennte lokale LearningHub-Inhalts- und Progress-Pfade bis zur UI umgesetzt |
| Letzte Aktualisierung | 2026-07-18 |

Diese Roadmap übersetzt die Vision und Architektur von GoldenDawn OS in kleine,
überprüfbare Entwicklungsstufen. Sie definiert Ergebnisse und Qualitätsgrenzen,
nicht starre Kalendertermine.

## Roadmap-Prinzipien

- Jede Version liefert ein sichtbares und lokal überprüfbares Ergebnis.
- Eine neue Phase beginnt erst, wenn die Abnahmekriterien der vorherigen Phase
  erfüllt sind.
- Die Reihenfolge bleibt: **Mock → Webhook → Airtable → Agentenlogik**.
- Die Reihe `v0.2.x` ist bewusst lokalen GoldenDawn-OS-Modulen vorbehalten;
  `v0.3.0` markiert den Beginn der externen Kommunikation.
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
| `v0.2.1` | LearningHub Local MVP | Nutzerkonfigurierte Inhaltsverwaltung und separate Progress-UI; Notizen, Zusammenfassungen und lokaler Mock-Test folgen | 🟡 |
| `v0.2.2` | LichtwaldLog Local MVP | Lokale Reflexions- und Erkenntniseinträge | ⬜ |
| `v0.3.0` | SyncAgent and Webhook Foundation | Beginn der externen Kommunikationsschicht | ⬜ |
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
- Fortschritt und spätere Testkompetenz sind getrennte Konzepte.
- Private Lerninhalte bleiben außerhalb des Repositorys. Die Demo-Daten sind
  unabhängig erfunden, synthetisch und vollständig tief eingefroren.
- Die abgeschlossene Schema-2-Foundation selbst enthält keine UI, Persistenz,
  Storage-, Fortschritts- oder Testlogik. Getrennte nachfolgende Arbeitspakete
  haben Service, Storage, Controller und Inhalts-UI sowie die weiterhin
  eigenständige Progress-Foundation ergänzt, ohne diese Vertragsgrenzen zu
  vermischen.

### Umfang des LearningHub Local MVP

- ✅ Schema-2-Strukturvertrag für mehrere LearningModules, LearningChapters und
  LearningNodes einschließlich synthetischer Zwei-Modul-Demo bereitstellen.
- ✅ `createLearningHubStorage` mit `loadLearningHub` und `saveLearningHub`
  hinter dem gemeinsamen `StorageAdapter` sowie dem festen Key
  `goldendawn.learningHub.content.v1` bereitstellen.
- ✅ `createLearningHubService` mit `loadHub`, `createModule`, `renameModule`,
  `addChapter`, `renameChapter`, `addLearningNode` und `updateLearningNode`
  bereitstellen.
- ✅ Einen fehlenden Storage-Key als unpersistierten leeren privaten Hub laden,
  erst bei einer Mutation schreiben und kein automatisches Demo-Seeding
  durchführen.
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
- ⬜ Lokale Notizen und Zusammenfassungen hinter den vorgesehenen Service- und
  Storage-Grenzen speichern.
- ⬜ Einen vorbereiteten, sichtbaren **„Lokalen Mock-Test“** für bekannte Inhalte
  anbieten.
- ⬜ Single-Choice-, Selbstkontroll- oder andere eindeutig auswertbare Aufgaben
  mit synthetischen, vorbereiteten Fragen verwenden.
- ⬜ Lokale Testversuche ausschließlich hinter Service- und Storage-Grenzen
  speichern; Views und Controller greifen nicht direkt auf `localStorage` zu.
- ✅ Lade-, Leer-, Inhalts-, Mutations-, Erfolgs- und Fehlerzustände zugänglich
  gestalten.

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

Der geplante lokale Mock-Testfluss lautet:

```text
LearningHubView
  → LearningHubController
  → LearningTestService
  → MockLearningTestProvider
```

Der `MockLearningTestProvider` arbeitet ausschließlich lokal, deterministisch
und testbar. Er verwendet synthetische, vorbereitete Fragen, behauptet weder
KI-Auswertung noch semantische Freitextbewertung und benötigt keine externe
Kommunikation.

Der spätere Zielpfad bleibt:

```text
LearningTestService
  → SyncService
  → SyncAgent
  → TestAgent
```

Semantische Freitextbewertung und echte `TestAgent`-Logik bleiben für `v0.5.0`
geplant.

### Abnahmekriterien für v0.2.1

- LearningHub unterstützt mehrere nutzerkonfigurierte Module mit mindestens
  einem Kapitel; Kapitel dürfen ohne LearningNodes bestehen.
- Private LearningHub-Inhalte werden über `LearningHubService`,
  `LearningHubStorage` und `StorageAdapter` unter dem festen Namespace
  `goldendawn.learningHub.content.v1` gespeichert; ein reines Laden des leeren
  Initialzustands schreibt nichts und übernimmt keine Demo-Daten.
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
- Notizen, Zusammenfassungen und Testversuche bleiben lokal und verwenden die
  vorgesehenen Service- und Storage-Grenzen.
- Der lokale Mock-Test ist eindeutig gekennzeichnet, reproduzierbar und ohne
  KI-Auswertung eindeutig auswertbar.
- Private Kursinhalte gelangen nicht in das Repository; eine öffentliche Demo
  verwendet ausschließlich synthetische Inhalte.
- Das Modul funktioniert ohne Webhook, Airtable oder Agentenlogik.

### Portfolio-Nachweis für v0.2.1

- tief eingefrorener synthetischer Demo-Hub mit zwei Modulen;
- umfassende Schema-2-Vertrags-, Service- und Storage-Tests sowie Controller-
  und View-Tests für den durchgängigen lokalen Inhaltsfluss;
- dokumentierte Persistenzgrenze mit privatem leeren Initialzustand und ohne
  automatisches Demo-Seeding;
- Vertrags-, Projektions-, Storage- und Service-Tests der separaten
  Progress-Foundation einschließlich Referenzfehlern, No-ops und
  unveränderlichen Eingaben;
- sichere Textdarstellung HTML-artiger Eingaben, zugängliche Accordions und
  responsive Inhaltsverwaltung ohne direkte Storage-Zugriffe aus UI-Schichten;
- nachvollziehbare, deterministische Ableitung des Modulfortschritts aus der
  Ereignisreihenfolge sowie zugängliche Kapitel-Markierungsfelder,
  Fortschrittsanzeigen und isolierte Retry-Zustände;
- reproduzierbarer lokaler Mock-Test ohne behauptete KI-Funktion.

## v0.2.2 – LichtwaldLog Local MVP

### Ziel des LichtwaldLog Local MVP

Ein vollständig lokales Modul für persönliche Reflexions- und
Erkenntniseinträge bereitstellen. Synchronisierte, automatisierte oder
agentengestützte Prozesse sind nicht Teil dieser Version.

### Umfang des LichtwaldLog Local MVP

- ⬜ Einträge mit Titel, Kalenderdatum, Text und Tags lokal abbilden.
- ⬜ Einträge erstellen, anzeigen, bearbeiten und löschen.
- ⬜ Lokale Textsuche und Filter bereitstellen.
- ⬜ Datenzugriffe vollständig hinter Services und Storage-Adaptern kapseln.
- ⬜ Private lokale Einträge und synthetische öffentliche Demo-Daten strikt
  getrennt halten.
- ⬜ Bilder nicht als Base64-Daten in `localStorage` speichern.
- ⬜ Lade-, Leer-, Validierungs-, Erfolgs- und Speicherfehlerzustände gestalten.
- ⬜ Klar kennzeichnen, dass lokale Browserdaten weder synchronisiert noch
  automatisch in der Cloud gesichert werden.

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
- In `localStorage` werden keine Bilder als Base64-Daten abgelegt.
- Das Modul enthält weder Sync- oder Agentenlogik noch einen Weekly Review.

### Portfolio-Nachweis für v0.2.2

- synthetischer lokaler CRUD-Workflow;
- demonstrierbare lokale Suche und Filterung;
- dokumentierte Trennung von privaten lokalen und öffentlichen Demo-Daten.

## v0.3.0 – SyncAgent and Webhook Foundation

### Ziel der Webhook-Grundlage

Den ersten kontrollierten Kommunikationsfluss zwischen Dashboard und n8n
bereitstellen, ohne Airtable oder Fachagenten einzubeziehen. `v0.3.0` markiert
damit den Beginn der externen Kommunikationsschicht.

### Umfang der Webhook-Grundlage

- ⬜ `docs/data-contracts.md` für Request und Response finalisieren.
- ⬜ `SyncService` als einzige externe Kommunikationsschicht des Frontends
  implementieren und den Übergang von lokalen Mocks zum Webhook vorbereiten.
- ⬜ Konfigurierbaren Webhook-Endpunkt außerhalb von UI-Komponenten verwalten.
- ⬜ Direkte externe Kommunikation aus UI-Komponenten ausschließen.
- ⬜ Lokalen Modus bei fehlender Webhook-Konfiguration erhalten.
- ⬜ n8n-Webhook mit HTTP `POST` erstellen.
- ⬜ SyncAgent als Validierungs- und Routinggerüst aufbauen.
- ⬜ Reproduzierbare Aktion `syncTest` implementieren.
- ⬜ Standardisierte Erfolgs- und Fehlerantworten zurückgeben.
- ⬜ Timeout, ungültiges JSON und nicht unterstützte Aktionen behandeln.
- ⬜ Bereinigten n8n-Workflow-Export dokumentieren.

### Abnahmekriterien für v0.3.0

- Das Dashboard sendet einen gültigen `syncTest`-Request.
- Der SyncAgent übernimmt oder erzeugt eine `requestId`.
- Die Antwort entspricht dem dokumentierten Vertrag.
- Eine ungültige Aktion wird kontrolliert abgewiesen oder als `unknown`
  behandelt.
- Ein Netzwerkfehler erzeugt einen verständlichen UI-Zustand.
- Im Frontend befinden sich keine Airtable- oder Modell-Credentials.

### Portfolio-Nachweis für v0.3.0

- Request- und Response-Beispiel;
- n8n-Workflow-Diagramm ohne Credentials;
- kurze Demonstration des lokalen und verbundenen Modus.

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

## Bewusst nach Version 1 verschoben

Folgende Ideen bleiben erhalten, sind aber kein Versprechen für Version 1:

- zusätzliche Fachagenten;
- agentengestützte, synchronisierte oder automatisierte LichtwaldLog-Prozesse;
- Weekly Review als eigenständige spätere Funktion;
- Benutzerkonten und Rollen;
- eigene relationale Datenbank;
- PWA-Installation und erweiterte Offline-Synchronisation;
- Analytics und umfassende Agentenbeobachtung;
- Kalender-, E-Mail- oder GitHub-Agenten;
- Mehrbenutzer- oder Teamfunktionen.

Diese Punkte werden erst nach dem Portfolio Release bewertet und priorisiert.

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

`v0.2.1 – LearningHub Local MVP` ist jetzt in Arbeit. Die Schema-2-Foundation
sowie `LearningHubView`, `LearningHubController`,
`createLearningHubService` und `createLearningHubStorage` für private lokale
Inhalte sind umgesetzt. Der feste Inhaltsnamespace lautet
`goldendawn.learningHub.content.v1`; ein fehlender Key liefert ohne
Schreibzugriff einen leeren privaten Hub, und die synthetische Demo wird nicht
automatisch übernommen. Die Inhaltsoberfläche ist über die bestehende
Navigation bedienbar.

Zusätzlich sind LearningProgress-Vertrag, reine Projektion, lokaler Storage und
Service unter dem getrennten Namespace
`goldendawn.learningHub.progress.v1` umgesetzt. Der Service validiert Hub und
Log, prüft Referenzen, hängt Abschluss- und Wiederöffnungsereignisse append-only
an und behandelt bereits erreichte Zielzustände ohne Schreibzugriff. Die
validierte Projektion ist über den vorhandenen Controller und die View als
Kapitelabschluss und Modulfortschritt bedienbar; Progress-Fehler bleiben vom
Inhaltsfluss isoliert. Als Nächstes folgen Notizen und Zusammenfassungen. Der
lokale Mock-Test bleibt ein späteres, getrenntes Arbeitspaket; der Meilenstein
ist damit noch nicht abgeschlossen.

`v0.2.2 – LichtwaldLog Local MVP` folgt anschließend als weiteres rein lokales
Modul und ist noch nicht implementiert.

Import/Export, Webhooks, Synchronisierung, geräteübergreifende Speicherung,
automatische Cloud-Sicherung, Airtable, ein Backend, Benutzerkonten und
Agentenlogik bleiben offen beziehungsweise beginnen erst in den dafür
vorgesehenen späteren Versionen. Die externe Kommunikationsschicht beginnt
bewusst erst mit `v0.3.0 – SyncAgent and Webhook Foundation`.
