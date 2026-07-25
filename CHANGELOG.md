# Changelog

Dieses Changelog dokumentiert nachvollziehbare GoldenDawn-OS-Meilensteine.
Die Versionsnummern strukturieren den Projektfortschritt, sind aber keine
Zusicherung einer strikt semantischen Versionierung. Ein Eintrag allein
behauptet weder einen veröffentlichten Git-Tag noch ein veröffentlichtes
Release.

## v0.2.1 – 2026-07-25

### LearningHub Local MVP

- LearningHub Schema 2 mit mehreren nutzerkonfigurierten LearningModules,
  LearningChapters und textbasierten LearningNodes umgesetzt.
- Lokale Inhalts-, Fortschritts- und LearningArtifact-Pfade mit getrennten
  Verträgen, Services, Storages und UI-Projektionen bereitgestellt.
- Aktuelle Notizen und Zusammenfassungen pro LearningNode lokal bedienbar
  gemacht, ohne sie mit Inhalt oder append-only Fortschritt zu vermischen.
- Veränderbare LearningTestBank und getrennte append-only Versuchshistorie
  ergänzt; abgeschlossene Attempts bleiben in persistierter Reihenfolge
  erhalten.
- Reine deterministische Single-Choice-Engine sowie sichtbar als `Lokaler
  Mock-Test` gekennzeichnete Fragenverwaltung, Durchführung, Auswertung,
  kontrollierter Abbruch und Historie umgesetzt.

### Demo-Initialisierung und Datenschutz

- Genau ein kanonisches synthetisches Demo-Modul mit drei Kapiteln, vier
  LearningNodes, acht LearningArtifacts und sieben Fragen bereitgestellt.
- Einmalige koordinierte Initialisierung vorgeschaltet, die nur bei gemeinsam
  fehlenden Inhalts-, Artifact-, Testbank- und Marker-Keys schreibt.
- Vorhandene Nutzerdaten, bewusst leere oder beschädigte Fachwerte und spätere
  Bearbeitungen vor Ergänzung oder Überschreiben geschützt; Teilfehler werden
  nur für weiterhin bytegleiche Seed-Werte kontrolliert zurückgerollt.
- Die einzelnen Storage- und Service-Loads behalten ihre schreibfreien leeren
  Zustände bei fehlenden Keys; Progress und Attempt-Historie werden nicht
  vorbefüllt.

### Bedienung und Accessibility

- Anzeige- und Bearbeitungswechsel der LearningNodes klarer getrennt und die
  stabile Auswahl bei Abbruch, Validierungsfehlern und erfolgreichem Speichern
  erhalten.
- Ungespeicherte Änderungen in den betroffenen Bearbeitungs- und Testflüssen
  vor unbeabsichtigtem Bereichswechsel oder Verwerfen geschützt.
- Mobile Kapitelüberschriften durch die begrenzte Flex-Basis korrigiert sowie
  Umbruch, Touchziele, native Beschriftungen, Fokusführung und zugängliche
  Status-, Bestätigungs- und Fehlerzustände verbessert.

### Qualität und lokale Grenzen

- Die finale Release-Verifikation umfasst 552/552 bestandene automatisierte
  Tests; sowohl die vollständige Suite mit erzwungener Einzeldatei-Ausführung
  als auch der Produktions-Build wurden erfolgreich abgeschlossen.
- Inhalt, Fortschritt, Notizen, Zusammenfassungen, Fragen und Attempts bleiben
  im aktuellen Browserprofil; `localStorage` ist unverschlüsselt und weder
  Synchronisierung noch Cloud-Sicherung.
- Der lokale Mock-Test verwendet keine KI, Agentenlogik oder externe
  Kommunikation. Repository-Daten bleiben synthetisch und von privaten
  Browserdaten getrennt.
- Der Umfang von `v0.2.1` ist vollständig abgeschlossen. Der annotierte Tag
  `v0.2.1` und das zugehörige GitHub Release wurden am `2026-07-25`
  veröffentlicht; GoldenDawn OS ist seitdem als öffentlich sichtbares
  Portfolio-Repository ohne Open-Source-Lizenz verfügbar.

## v0.2.0 – 2026-07-15

### Command Center und Design

- Responsive Command-Center-Shell mit Sidebar-Navigation, Modulübersicht,
  Projektstatus und klar gekennzeichneten aktuellen sowie geplanten Bereichen
  umgesetzt.
- Responsives Wald-/Gold-Design mit zentralen Farb-, Abstands-, Radius- und
  Schatten-Tokens sowie sichtbaren Fokuszuständen bereitgestellt.
- Desktop- und mobile Darstellung, semantische Beschriftungen sowie bewusste
  Lade-, Leer-, Erfolgs-, Bestätigungs- und Fehlerzustände ausgearbeitet.

### PromptVault Local MVP

- Lokales Anzeigen, Erstellen, Bearbeiten und dauerhaftes Löschen von Prompts
  einschließlich zugänglicher Inline-Bestätigung umgesetzt.
- Lokale Volltextsuche, Kategorie-Filter und kombinierte Filterung ergänzt;
  Such- und Filterzustände bleiben bewusst flüchtig.
- Persistente Favoriten ergänzt, ohne dadurch neue Inhaltsversionen zu
  erzeugen.
- Robuste lokale Speicherung unter `goldendawn.promptVault.v1` mit einem
  Schema-2-Envelope und kontrollierter Behandlung beschädigter, ungültiger oder
  nicht unterstützter Daten umgesetzt.
- Die fachlich unveränderliche Versionshistorie als append-only modelliert:
  Inhaltsänderungen ergänzen neue Snapshots und überschreiben keine frühere
  Fassung.
- Historische Fassungen können nach Bestätigung als neue `restored`-Version
  wiederhergestellt werden; bestehende Historie bleibt erhalten.
- UI, Controller, `PromptService`, `PromptStorage` und gemeinsamer
  `StorageAdapter` klar getrennt. Direkte `localStorage`-Zugriffe aus der
  Oberfläche wurden vermieden.

### Qualität und lokale Grenzen

- 162 automatisierte Tests für Suche, Storage-Adapter, Prompt-Speicherung,
  Service, Controller und View etabliert.
- PromptVault bleibt auf das aktuelle Browserprofil und den aktuellen Origin
  begrenzt. Die lokale Speicherung ist weder Synchronisierung noch
  geräteübergreifende Speicherung oder automatische Cloud-Sicherung.
- Import und Export, Webhooks, Airtable, Backend, Authentifizierung sowie echte
  SyncAgent-, DataAgent- oder TestAgent-Logik sind nicht Bestandteil dieses
  Meilensteins.
- Repository und öffentliche Beispiele verwenden ausschließlich synthetische
  Demo-Daten und enthalten keine privaten Kurs-, Reflexions- oder
  Gesundheitsdaten.

## v0.1.0 – 2026-07-11

### Foundation

- Vite mit Vanilla JavaScript, HTML und CSS als kleine, nachvollziehbare
  Frontend-Grundlage eingerichtet.
- Verbindliche Projekt- und Agentenregeln in `AGENTS.md` festgehalten.
- README, Architektur, Roadmap, Sicherheitsgrundlage sowie Daten- und
  Sync-Verträge als gemeinsame Projektreferenz aufgebaut.
- Fünf Architecture Decision Records zu Vite/Vanilla JavaScript, SyncAgent,
  DataAgent, privater und öffentlicher Datentrennung sowie dem
  Drei-Agenten-Scope dokumentiert.
- Zielarchitektur, Agentenrollen, Storage- und Sync-Grenzen, Sicherheitsregeln
  und schrittweise Entwicklungsreihenfolge definiert.
- UTF-8 ohne BOM, LF-Zeilenenden und abschließende Zeilenumbrüche als
  Repository-Standard festgelegt.
