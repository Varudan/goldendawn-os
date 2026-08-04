# Changelog

Dieses Changelog dokumentiert nachvollziehbare GoldenDawn-OS-Meilensteine.
Die Versionsnummern strukturieren den Projektfortschritt, sind aber keine
Zusicherung einer strikt semantischen Versionierung. Ein Eintrag allein
behauptet weder einen veröffentlichten Git-Tag noch ein veröffentlichtes
Release.

## Unveröffentlicht – v0.3.0 in Arbeit

### SyncContract Foundation

- Transportneutralen Vertragskern für Contract-Version `1.0`, die einzige
  Aktion `syncTest`, den kanonischen Handler `SyncAgent` und ausschließlich
  als `synthetic` klassifizierte Erfolgsdaten ergänzt.
- Strikte Validatoren für den exakt sechs Felder umfassenden Request, normal
  korrelierte Responses, getrennte frühe Gateway-Fehler und bereits als String
  vorliegende Raw Bodies bereitgestellt. Determinismus und Seiteneffektfreiheit
  werden nur für stabile gewöhnliche Records, Arrays und Strings zugesichert,
  deren Beobachtung selbst keine Seiteneffekte auslöst.
- Pflicht-`requestId`, kanonische UTC-Zeitstempel mit expliziter Referenzzeit,
  statische redigierte Fehlerprofile, exakte Response-Korrelation und
  kontrollierte Ablehnung nicht unterstützter beobachteter Strukturen
  festgelegt.
- Dokumentiert, dass der Validator selbst keine Properties schreibt und Werte
  gewöhnlicher eigener Accessors nicht ausliest, Reflection auf Proxies jedoch
  Traps und Descriptor-Getter ausführen kann. Same-Realm-Proxy-Traps führen
  beliebigen JavaScript-Code aus und können Eingaben, externen Zustand oder
  globale Laufzeitobjekte verändern, blockieren oder spätere Operationen zum
  Werfen bringen. Reflection-Catches können solche Wirkungen weder verhindern
  noch rückgängig machen; eine vollständige portable Proxy-Erkennung existiert
  nicht. Erfolg bestätigt nur die während des Aufrufs beobachtete Struktur.
- Das Raw-Body-Limit exakt auf 65.536 UTF-8-Bytes begrenzt. Der reine Helper
  serialisiert keine Objekte und ist ohne konkrete Wire-/Webhook-
  Transportgrenze keine tatsächliche Webhook-Durchsetzung.
- Für die spätere Wire-Grenze die Reihenfolge
  `rohe Bodybytes begrenzen → JSON kontrolliert parsen → datenförmigen weiterhin
  unvertrauenswürdigen Wert validieren` festgelegt. `JSON.parse` ohne
  benutzerdefinierten Reviver überträgt keine Proxies, Accessors, Symbole oder
  Trap-Funktionen.
- `source: "goldendawn-os"` als reine syntaktische Klassifikation festgehalten,
  nicht als Nachweis für Authentisierung, Herkunft, Identität oder Berechtigung.
  Vertrauenswürdige Herkunft, Routing und Autorisierung folgen später aus
  serverseitigem Kontext und niemals allein aus `source`.

### SyncService Foundation

- `createSyncService({ syncTransport, generateRequestId, getCurrentTimestamp })`
  als asynchrone transportneutrale Service-Foundation mit einer eingefrorenen
  API aus exakt `runSyncTest` ergänzt. Der Aufruf akzeptiert keine Argumente
  und bietet keinen generischen Aktions-, Payload-, Endpoint- oder Moduspfad.
- Bei einem argumentlosen Aufruf zuerst
  `syncTransport.sendSyncRequest` in einem einmaligen sicheren
  Auflösungsversuch aufgelöst. Bei fehlender, nicht funktionaler oder werfend
  aufgelöster Methode werden Generator und Clock nicht ausgewertet.
- Erst nach erfolgreicher Methodenauflösung einen frischen exakt sechs Felder
  umfassenden `syncTest`-Request mit exakt leerem `payload` aus den bestehenden
  Contract-Konstanten aufgebaut. `requestId` und `timestamp` stammen aus den
  dabei jeweils exakt einmal ausgewerteten kontrollierten
  Composition-Dependencies; der Standard-ID-Generator verwendet ausschließlich
  `req_ + crypto.randomUUID()` ohne schwächeren Fallback.
- Transportrequest und interne Korrelationsgrundlage als getrennte, tief
  eingefrorene Snapshots erzeugt. Nur die zuvor aufgelöste Portmethode
  `syncTransport.sendSyncRequest(syncRequest)` wird nach vollständiger
  Requestvalidierung pro Aufruf höchstens einmal mit dem vorgesehenen Receiver
  aufgerufen.
- Transportantworten als unvertrauenswürdige Eingaben behandelt, über feste
  Felder defensiv projiziert und ausschließlich als vollständig validierte,
  normal korrelierte SyncResponses akzeptiert. Frühe Gateway-Fehler gehören
  weiterhin nicht zum lokalen Transportprofil.
- Den exakten lokalen Fünf-Felder-Service-Result von der SyncResponse getrennt.
  Eine gültige normale Contract-Fehlerresponse bleibt außen `ok: true`; ihr
  fachlicher Zustand wird weiterhin ausschließlich durch
  `syncResponse.success` ausgedrückt. Lokale Fehler verwenden nur statische
  redigierte Status-, Code- und Meldungsprofile.
- Einen klar gekennzeichneten deterministischen In-Memory-Transport
  ausschließlich als Test-Double vorgesehen. In `src/` wird kein Mock-, HTTP-,
  Fetch-, Webhook- oder n8n-Transport ausgeliefert.
- Dokumentiert, dass injizierte Functions und Function-Proxies
  vertrauenswürdiger ausführbarer Anwendungscode sind. Promise-/Thenable-
  Auflösung und Proxy-Reflection können fremden Code und Seiteneffekte
  auslösen; beobachtbare Throws und Rejections werden redigiert, bereits
  ausgelöste Wirkungen können aber nicht rückgängig gemacht werden.

### Qualität

- Gezielte SyncService-Suite mit 43/43 Tests, kombinierte
  SyncService-/SyncContract-Suite mit 88/88 Tests und die vollständige Suite
  mit 1021/1021 Tests geprüft; 0 Fehlschläge, 0 Skips und 0 Todos.
- Produktions-Build erfolgreich abgeschlossen; exakt 46 Module transformiert.

### Architektur- und Sicherheitsgrenzen

- Den späteren browserinitiierten Fluss als
  `GoldenDawn → SyncService → serverseitiger n8n-Webhook/Gateway → SyncAgent →
  validierte Antwort` dokumentiert; ein Vite-Browserfrontend terminiert keinen
  eingehenden öffentlichen Webhook.
- Die spätere Darstellung des `SyncAgent` dem AgentHub und Verbindungen,
  Webhooks, Workflows sowie den einzigen `syncTest`-Auslöser dem AutomationHub
  zugeordnet. In diesem Slice wird keine Hub-UI umgesetzt.
- Keine Netzwerkkommunikation, keinen konkreten externen Transport, Endpoint
  oder Webhook, keinen operativen `SyncAgent`, keine n8n-Verbindung,
  Authentisierung, Signaturprüfung, CORS- oder Rate-Limit-Durchsetzung, keinen
  privaten externen Datenfluss und keinen produktiven Datenfluss eingeführt.
  Der SyncService ist weder in `src/main.js` noch in einer UI komponiert.
- ADR 0016 für den transportneutralen Kern und die künftige Transport- und
  Hub-Grenze bleibt unveränderte Vertragsgrundlage. ADR 0017 dokumentiert die
  transportneutrale SyncService Foundation. Paketversion `0.2.2`, Tag
  `v0.2.2` und neuestes veröffentlichtes Release `v0.2.2` bleiben
  unverändert.

## v0.2.2 – 2026-08-02

### LichtwaldLog Local MVP

- Lokalen Schema-1-Pfad für Anzeigen, Erstellen, vollständiges Bearbeiten,
  dauerhaftes Löschen und explizite Fokusverwaltung umgesetzt.
- `featuredEntryId` als einzige autoritative Fokusquelle beibehalten und den
  `Besonderen Lichtwaldmoment` ausschließlich als View-/CSS-Projektion ergänzt;
  es gibt keinen zweiten Zustand, keine neue API und keine zusätzliche
  Persistenz.
- Privaten Full-Snapshot unter `goldendawn.lichtwaldLog.content.v1` mit einem
  Limit von 500.000 UTF-16-Codeeinheiten, Read-Preflight, vollständiger
  Validierung, defensiven Kopien und statischer Fehlerredaktion abgesichert.

### Suche und getrennte synthetische Demo

- Flüchtige Textsuche sowie exakte Kalenderdatum- und Tagfilter mit
  AND-Semantik umgesetzt; die Eintragsreihenfolge bleibt unverändert und die
  Filterung vollständig schreibfrei.
- Fünf vollständig erfundene Demo-Einträge über einen vollständig getrennten
  In-Memory-Stack ohne `StorageAdapter`, Browser-Key, privaten Service oder
  Fallback bereitgestellt.
- Demo-Zustand innerhalb des Dokuments erhalten und nach Reload auf den
  kanonischen Seed zurückgesetzt; Demoaktionen lassen den privaten Storage und
  die vollständige Storage-Key-Liste bytegleich.

### Bedienung, Qualität und lokale Grenzen

- Safe DOM, Entry-ID-Isolation, Dirty Guards, Tastaturbedienung, sichtbaren
  `3px`-Fokusrahmen, Reduced Motion und responsive Darstellung geprüft.
- Reale Browserprüfung bei `1440 × 1000` und `390 × 844` erfolgreich
  abgeschlossen.
- LichtwaldLog mit 374/374 Tests und die Gesamtsuite mit 933/933 Tests geprüft;
  0 Skips und 0 Todos. Der Produktions-Build transformiert exakt 46 Module.
- Keine externe Kommunikation, Webhooks, Agentenlogik oder Airtable-Anbindung
  eingeführt. `localStorage` bleibt unverschlüsselt und ist keine
  Cloud-Sicherung.
- Der Umfang von `v0.2.2` ist vollständig abgeschlossen und geprüft. Der
  annotierte Tag `v0.2.2` und das zugehörige GitHub Release wurden am
  `2026-08-02` veröffentlicht; `v0.2.2` ist das neueste veröffentlichte Release.

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
