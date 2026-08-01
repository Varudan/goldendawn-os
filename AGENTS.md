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

Aktueller Stand: `v0.2.2 – LichtwaldLog Local MVP in Arbeit`

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
`v0.2.1 – LearningHub Local MVP` ist vollständig abgeschlossen, mit 552/552
automatisierten Tests und einem erfolgreichen Produktions-Build geprüft und am
`2026-07-25` als annotierter Tag `v0.2.1` mit zugehörigem GitHub Release
veröffentlicht. Schema 2, lokale
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
Der Mock-Test verwendet weder KI noch externe Kommunikation. GoldenDawn OS ist
seit dem `2026-07-25` als öffentlich sichtbares Portfolio-Repository ohne
Open-Source-Lizenz verfügbar. `v0.2.2 – LichtwaldLog Local MVP` ist seit dem
`2026-07-26` in Arbeit. Implementiert sind die LichtwaldLog-Contract-Foundation
mit Schema-1-Vertrag, reinem Validator, synthetischen Contract-Tests und ADR
0013, die private Storage-Foundation mit begrenzter
Full-Snapshot-Persistenz und ADR 0014, die Service- und Controller-Foundation,
die isolierte View- und CSS-Foundation sowie die beiden getrennten
Anwendungskompositionen in `src/main.js`. Ausschließlich der private Stack
verwendet den gemeinsamen `StorageAdapter`; die in ADR 0015 festgelegte
synthetische Demo arbeitet über einen eigenen In-Memory-Stack ohne Adapter.
LichtwaldLog ist über die
Navigation mit dem sichtbaren Status `In Arbeit` erreichbar. Anzeigen,
Erstellen, vollständiges Bearbeiten, dauerhaftes Löschen sowie explizites
Setzen und Entfernen des Fokus sind vollständig über GoldenDawn OS bedienbar.
Die reine lokale Textsuche über Kalenderdatum, Titel, Text und Tags sowie der
exakte Kalenderdatum- und Tagfilter sind ebenfalls implementiert. Alle drei
Kriterien werden ausschließlich aus der flüchtigen Controller-Projektion
abgeleitet, logisch mit AND kombiniert und nicht persistiert.
Die reale Browserprüfung war in einem frischen isolierten temporären
Chrome-Profil auf Desktop mit `1440 × 1000` sowie bei exakt `390 × 844`
erfolgreich. Geprüft wurden der vollständige lokale Navigations-, CRUD-, Fokus-,
Dirty-Guard-, Delete-, Reload-, Such- und Filterfluss einschließlich literalem
Matching, AND-Verknüpfung, Leerzustand und Reset. Tastatur- und Caretfokus,
Live-Regionen, mindestens `44px` hohe Controls, der sichtbare
`3px`-Fokusrahmen und fehlender horizontaler Seitenoverflow wurden bestätigt;
es gab 0 Console-Warnungen oder -Fehler, 0 Runtime-Exceptions, 0 externe
Requests und keine Storage-Schreiboperation durch Suche oder Filter.
Die getrennte synthetische In-Memory-Demo ist als eigener vollständig
bedienbarer Runtime-Stack umgesetzt. Demo-Änderungen bleiben bei Navigation im
selben Dokument erhalten und werden bei Reload oder neuer Komposition auf den
kanonischen Seed zurückgesetzt; der private Browserbestand bleibt davon
unberührt. Damit ist der funktionale Umfang implementiert, als nächster Schritt
bleibt die abschließende Release-Prüfung. `v0.2.2` ist weiterhin weder
abgeschlossen noch veröffentlicht. Paketversion und letztes veröffentlichtes
Release bleiben `v0.2.1`. Der
Meilenstein bleibt vollständig lokal und besitzt keine externe Kommunikation,
Webhooks, Agentenlogik oder Airtable-Anbindung.

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

- Implementiert sind der Schema-1-Vertrag, der reine Validator, die
  synthetischen Contract-Tests und die in ADR 0013 dokumentierte
  Contract-Entscheidung.
- Die private Storage-Foundation ist gemäß ADR 0014 umgesetzt. Zusammen mit
  Service-, Controller- und isolierter View-Foundation lautet der
  ausschließlich lokale Datenfluss
  `LichtwaldLogView → LichtwaldLogController → LichtwaldLogService → LichtwaldLogStorage → StorageAdapter → localStorage`.
  Der Storage verwendet den festen Key
  `goldendawn.lichtwaldLog.content.v1`, speichert den direkten Schema-1-Root als
  gemeinsamen Full-Snapshot und akzeptiert ausschließlich
  `dataOrigin: private`.
- Die getrennte synthetische Demo-Runtime ist gemäß ADR 0015 umgesetzt. Ihr
  Datenfluss lautet
  `LichtwaldLogView → LichtwaldLogController → LichtwaldLogDemoService → LichtwaldLogDemoStorage → In-Memory-Full-Snapshot → kanonische Demo-Factory`.
  Die Factory liefert jeweils einen frischen defensiv entkoppelten
  `dataOrigin: synthetic`-Snapshot mit genau fünf vollständig erfundenen
  Einträgen. Demo-Storage und Demo-Service importieren weder privaten Storage
  noch privaten Service und verwenden weder `StorageAdapter`,
  `localStorage`, `sessionStorage`, Browser-Key, Netzwerk noch
  Fallback. Eine Storage-Instanz lebt genau für die aktuelle
  Anwendungskomposition.
- `createLichtwaldLogService({ lichtwaldLogStorage, generateLichtwaldLogEntryId })`
  erhält den ID-Generator optional und liefert eine eingefrorene API mit exakt
  `loadLog`, `createEntry`, `updateEntry`, `deleteEntry` und
  `setFeaturedEntry`. `setFeaturedEntry(null)` entfernt den Fokus; eine
  zusätzliche Clear- oder Toggle-Operation existiert nicht.
- `createLichtwaldLogController({ lichtwaldLogService, lichtwaldLogView,
  scheduleTask, expectedDataOrigin })` liefert eine eingefrorene API mit exakt
  `open` und `close`. Fehlendes oder `undefined`
  `expectedDataOrigin` bedeutet exakt `private`; als explizite Werte sind
  ausschließlich `private` und `synthetic` zulässig. Die Herkunft bleibt
  für den Lifecycle fest und projiziert ausschließlich `runtimeMode: private`
  beziehungsweise `runtimeMode: syntheticDemo`.
  Der View-Port wird ausschließlich über `render(viewModel, actions)` und
  `unmount()` injiziert. Die isolierte Factory
  `createLichtwaldLogView(rootElement)` implementiert ihn und liefert eine
  eingefrorene API mit exakt den eigenen Data-Properties `render` und
  `unmount`. Jeder Render erhält dieselbe eingefrorene Action-API mit exakt:

```text
onRetryLoad
onSelectEntry
onBackToOverview
onOpenCreateEntryForm
onOpenUpdateEntryForm
onUpdateFormField
onSubmitForm
onCancelForm
onRequestDeleteEntry
onCancelDeleteEntry
onConfirmDeleteEntry
onSetFeaturedEntry
onChangeSearchQuery
onChangeCalendarDateFilter
onChangeTagFilter
onResetFilters
```

- Das reine Modul `lichtwaldLogSearch.js` exportiert ausschließlich
  `ALL_LICHTWALD_LOG_TAGS`, `LICHTWALD_LOG_SEARCH_QUERY_MAX_LENGTH`,
  `getLichtwaldLogFilterTags` und `filterLichtwaldLogEntries`. Die Suche trimmt
  nur äußere Query-Whitespace für den Vergleich, normalisiert kanonisch mit
  NFC und vereinheitlicht Groß-/Kleinschreibung mit `toLowerCase()`. Sie sucht
  anschließend literal und zusammenhängend ausschließlich in `calendarDate`,
  `title`, `text` und `tags[]`; interne Whitespaces bleiben bedeutungsvoll.
- `''` bedeutet für Datum und Tag jeweils keine Einschränkung. Andere
  Kalenderdatum-Filter werden mit `isValidCalendarDate` ohne `Date`- oder
  Zeitzonenumwandlung geprüft und exakt verglichen. Der Tagfilter vergleicht
  vollständige Tags nach NFC- und Case-Normalisierung. Tagoptionen stammen aus
  allen autoritativen Einträgen, werden nach dieser Identität dedupliziert und
  bewahren die erste gespeicherte Schreibweise sowie Entry- und Tag-Reihenfolge.
  Suche, Datum und Tag werden mit AND kombiniert; Ergebnisse werden nie
  sortiert oder gewichtet.
- Jeder View-Render baut einen frischen DOM-Baum ausschließlich mit sicheren
  DOM- und Formcontrol-APIs. Titel, Texte, Tags und Formwerte bleiben
  ungeparster Plain Text. Entry-IDs werden ausschließlich als unveränderte
  Ziele in Closures und renderlokalen Maps gehalten und gelangen weder in
  DOM-/ARIA-IDs, Selektoren noch View-eigene Meldungen. Die verlustfreie
  Mehrfeld-Tag-UI verwendet kein Komma-Parsing und bewahrt Entry- und
  Tag-Reihenfolge sowie Schreibweise.
- Die isolierte View stellt Lade-, Leer-, Busy-, Erfolgs-, Notice-,
  Validierungs- und Fehlerzustände zugänglich dar, löst sämtliche
  Controller-Fokusziele nach dem DOM-Austausch kontrolliert auf und verwendet
  explizite Fokusendzustände statt eines Toggles. Sie projiziert weder Inhalt,
  Delete noch Fokus optimistisch. `unmount()` entfernt private DOM-Inhalte und
  verwirft ausschließlich flüchtige Fokus- und Caret-Metadaten. Das gekapselte
  CSS enthält responsive und Reduced-Motion-Regeln und ist über `src/main.js`
  in den Buildgraph eingebunden.
- Der Controller hält zusätzlich ausschließlich flüchtig `searchQuery`,
  `calendarDateFilter`, `selectedTag`, `availableTags`, `visibleEntryIds`,
  `hasActiveFilters` und `filteredEmptyState`. `entries` bleibt die vollständige
  autoritative UI-Projektion. Die Übersicht verwendet `visibleEntryIds`,
  während Detail und Formulare weiterhin aus dem vollständigen Snapshot
  aufgelöst werden. Alle neuen Werte und Arrays werden defensiv entkoppelt und
  tief eingefroren; sie sind keine Schema-1-Felder und werden nicht gespeichert.
- Der Controller hält ausschließlich eine flüchtige, validierte und defensiv
  entkoppelte UI-Projektion. Er prüft jeden Service-Snapshot vollständig mit
  `validateLichtwaldLog` und akzeptiert nur die bei der Komposition
  festgelegte exakte Herkunft. Der rohe
  Schema-1-Root wird nicht an die View weitergegeben. Storage bleibt die
  einzige veränderliche Wahrheit; der Service bleibt die autoritative
  fachliche Mutationsgrenze.
- Pro akzeptierter Lade- oder Mutationsintention ruft der Controller exakt eine
  passende Serviceoperation auf. Such- und Filteraktionen rufen dagegen weder
  Service, Storage, Adapter, ID-Generator noch Scheduler auf. Nach einer
  Mutation erfolgt kein zusätzlicher Load,
  und Inhalte oder Fokus werden nicht optimistisch verändert. Auswahl,
  Formularänderungen, Abbruch sowie Anfordern und Abbrechen einer
  Löschbestätigung bleiben service- und schreibfrei. Update- und Fokus-No-ops
  entscheidet ausschließlich der Service.
- Ziel-IDs werden im Controller exakt und case-sensitive gegen den aktuellen
  vertrauenswürdigen Snapshot aufgelöst. Ein Auswahlziel aus der Übersicht muss
  zusätzlich zur aktuell sichtbaren Ergebnismenge gehören. Fokus wird explizit
  als Ziel-ID oder
  `null` gesetzt; es gibt keine Toggle-Aktion. Entry- und Tag-Reihenfolge
  bleiben in den defensiven View-Projektionen unverändert.
- Controllerfehler und Statusmeldungen stammen ausschließlich aus statischen
  Allowlists. Private Inhalte, IDs sowie fremde Service-, Dependency- oder
  Exception-Meldungen werden nicht übernommen. Gültige Texte bleiben
  ungeparster, nicht vertrauenswürdiger Plain Text. Die isolierte View gibt sie
  ausschließlich über `textContent`, `createTextNode`, Formcontrol-Werte und
  feste Attribute sicher aus.
- Der Storage bleibt die einzige veränderliche Wahrheit. Jede gültige
  Serviceoperation lädt den aktuellen privaten Snapshot neu und der Service
  hält keinen langlebigen Cache. Ungültige Form- oder Ziel-ID-Eingaben werden
  vor Storage- und Generatorzugriffen abgelehnt.
- Kalenderdatum, Titel, Text und Tags werden an den Rändern getrimmt; interne
  Whitespaces und Zeilenumbrüche bleiben erhalten. Kalenderdaten werden ohne
  `Date`- oder Zeitzonenumwandlung geprüft. Ziel-IDs werden nicht automatisch
  getrimmt, sondern müssen bereits gültig sein und werden exakt sowie
  case-sensitive aufgelöst.
- Erstellen hängt einen Eintrag ohne Datumssortierung an. Vollständiges
  Bearbeiten erhält ID, Arrayposition und Fokusreferenz. Löschen erhält die
  Reihenfolge der übrigen Einträge und setzt beim fokussierten Ziel
  `featuredEntryId` atomar im selben Kandidaten auf `null`. Die
  Standard-ID verwendet `lichtwald-entry-${crypto.randomUUID()}`; ungültige,
  kollidierende oder werfende Generatorresultate sind gemeinsam auf fünf
  Versuche begrenzt.
- Jede echte Mutation validiert den vollständigen privaten Kandidaten und ruft
  an der Servicegrenze höchstens einmal `saveLichtwaldLog` auf. Inhaltlich
  identische Updates, ein bereits gesetzter Fokus und das Entfernen eines
  bereits leeren Fokus sind erfolgreiche schreibfreie No-ops. Nach einem
  fehlgeschlagenen Save bleibt ausschließlich der vorherige vertrauenswürdige
  Snapshot autoritativ.
- Servicefehler verwenden ausschließlich allowlist-basierte Status-Code-Paare
  und statische redigierte Meldungen. Private Eingaben, IDs, Tags,
  Generatorwerte sowie fremde Storage-, Adapter- oder Exception-Meldungen
  gelangen weder in `error` noch in Logs oder Console-Ausgaben.
- Der LichtwaldLog-Snapshot ist auf 500.000 tatsächlich serialisierte
  UTF-16-Codeeinheiten gemäß `String.length` begrenzt; exakt 500.000 sind
  erlaubt. Ein fehlender Key liefert schreibfrei einen frischen privaten
  Leerzustand. Synthetische, beschädigte, inkompatible oder übergroße Bestände
  werden weder repariert noch automatisch überschrieben. Größenprüfung,
  Serialisierung und Read-Preflight bleiben im Storage beziehungsweise
  `StorageAdapter`; der Preflight ist keine Transaktion, kein
  Compare-and-Swap und keine Multi-Tab-Sperre.
- `src/main.js`-Anbindung über den gemeinsamen `StorageAdapter`, Navigation und
  der vollständig über die Anwendung bedienbare CRUD- und Fokusfluss sind
  implementiert und real im Browser auf Desktop sowie bei exakt `390 × 844`
  geprüft. Lokale Suche sowie exakte Kalenderdatum- und Tagfilter sind
  implementiert und greifen nur auf die flüchtige Controller-Projektion zu.
  Die APIs von privatem Service, privatem Storage und gemeinsamem Adapter
  bleiben unverändert. Direkt nach dem privaten Modul ist die dauerhaft als
  `Synthetische Demo` gekennzeichnete getrennte In-Memory-Demo navigierbar.
  Beide Stacks besitzen eigene Instanzen, sind niemals gleichzeitig montiert
  und wechseln nur nach erfolgreichem Dirty-Guard-`close()`. Der funktionale
  Umfang ist implementiert; offen bleibt die abschließende Release-Prüfung.
- Das Ziel des LichtwaldLog Local MVP bleibt ein lokales Journal-Modul mit CRUD
  für Einträge aus Titel, reinem Kalenderdatum, Text und Tags sowie lokaler
  Suche und Filtern.
- Kalenderdaten werden als `YYYY-MM-DD` gespeichert.
- Bilder werden nicht als Base64 in localStorage gespeichert.
- Private Einträge und synthetische Demo-Einträge bleiben technisch getrennt
  und sichtbar unterscheidbar. Es gibt keine Konvertierung, kein gemeinsames
  Seeding und keinen Fallback zwischen beiden Stacks.
- Externe Kommunikation, Webhooks, Synchronisierung, Agentenanbindung,
  Airtable und Weekly Review gehören nicht zu `v0.2.2` und dürfen für diesen
  Meilenstein nicht als umgesetzt dargestellt werden.

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
